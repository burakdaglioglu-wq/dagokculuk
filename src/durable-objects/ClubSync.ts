import { DurableObject } from "cloudflare:workers";
import type { Env } from "../env";
import { json } from "../lib/json";

interface CanliDurum {
  aktif: boolean;
  oklar: unknown[];
  ts: number;
}
function canliDurumAnahtari(grup: string, ad: string): string {
  return "canli:" + grup + "|" + ad;
}

interface LockState {
  grup: string | null;
  ad: string | null;
  yapan: string | null;
  zaman: number | null;
}

interface SeasonState {
  ad: string;
  baslangic: string | null;
  bitis: string | null;
  guncelleme: number;
}

interface HelloState {
  lock: LockState;
  season: SeasonState;
  minSurum: number;
  resetZamani: number;
}

const HELLO_KEY = "hello-state";

export class ClubSync extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("expected websocket", { status: 426 });
      }
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      const hello = await this.getHelloState();
      server.send(JSON.stringify({ type: "hello", id: "hello", ts: Date.now(), deviceId: null, payload: hello }));
      return new Response(null, { status: 101, webSocket: client });
    }

    if (url.pathname === "/broadcast" && request.method === "POST") {
      const envelope = await request.json<{ type: string; payload: unknown }>();
      await this.applyToHelloState(envelope);
      await this.applyCanliDurum(envelope);
      const text = JSON.stringify(envelope);
      for (const ws of this.ctx.getWebSockets()) {
        try {
          ws.send(text);
        } catch {
          // socket gone stale, ignore — hibernation API cleans these up
        }
      }
      return new Response("ok");
    }

    // "Canlı Veli İzleme" — halka açık sayfa /ws'in ham yayınına HİÇ bağlanmıyor (o TÜM sporcuları
    // filtresiz yayınlıyor). Bunun yerine burada TEK bir sporcunun son bilinen canlı durumu okunuyor.
    if (url.pathname === "/canli-durum" && request.method === "GET") {
      const grup = url.searchParams.get("grup") ?? "";
      const ad = url.searchParams.get("ad") ?? "";
      const durum = await this.ctx.storage.get<CanliDurum>(canliDurumAnahtari(grup, ad));
      return json(durum ?? { aktif: false, oklar: [], ts: 0 });
    }

    return new Response("not found", { status: 404 });
  }

  async webSocketMessage(): Promise<void> {
    // clients only receive; they never send data frames today
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    try {
      ws.close(code, reason);
    } catch {
      // already closing
    }
  }

  private async getHelloState(): Promise<HelloState> {
    const stored = await this.ctx.storage.get<HelloState>(HELLO_KEY);
    if (stored) return stored;
    const fresh = await this.loadHelloStateFromD1();
    await this.ctx.storage.put(HELLO_KEY, fresh);
    return fresh;
  }

  private async loadHelloStateFromD1(): Promise<HelloState> {
    const lockRow = await this.env.DB.prepare("SELECT grup, ad, yapan, zaman FROM edit_lock WHERE id = 1").first<LockState>();
    const seasonRow = await this.env.DB.prepare("SELECT ad, baslangic, bitis, guncelleme FROM season WHERE id = 1").first<SeasonState>();
    const metaRows = await this.env.DB.prepare("SELECT key, value FROM meta WHERE key IN ('minSurum','resetZamani')").all<{ key: string; value: string }>();
    const metaMap = Object.fromEntries(metaRows.results.map((r) => [r.key, r.value]));
    return {
      lock: lockRow ?? { grup: null, ad: null, yapan: null, zaman: null },
      season: seasonRow ?? { ad: "Aktif Sezon", baslangic: null, bitis: null, guncelleme: 0 },
      minSurum: Number(metaMap.minSurum ?? 0),
      resetZamani: Number(metaMap.resetZamani ?? 0),
    };
  }

  private async applyToHelloState(envelope: { type: string; payload: unknown }): Promise<void> {
    const current = await this.getHelloState();
    if (envelope.type === "lock-acquired") {
      const p = envelope.payload as LockState & { yapan: string; zaman: number };
      current.lock = { grup: p.grup, ad: p.ad, yapan: p.yapan, zaman: p.zaman };
    } else if (envelope.type === "lock-released") {
      current.lock = { grup: null, ad: null, yapan: null, zaman: null };
    } else if (envelope.type === "season-changed") {
      current.season = envelope.payload as SeasonState;
    } else if (envelope.type === "reset-signal") {
      current.resetZamani = (envelope.payload as { zaman: number }).zaman;
    }
    await this.ctx.storage.put(HELLO_KEY, current);
  }

  // "Canlı Veli İzleme" için: son bilinen canlı-atış durumu sporcu bazında ayrı ayrı saklanır — ham
  // yayın gibi HERKESİ değil, /canli-durum ile sorgulayan tek bir sporcuyu döndürebilmek için.
  private async applyCanliDurum(envelope: { type: string; payload: unknown }): Promise<void> {
    if (envelope.type !== "canli-atis") return;
    const p = envelope.payload as { grup?: string; ad?: string; oklar?: unknown[]; aktif?: boolean };
    if (!p.grup || !p.ad) return;
    const durum: CanliDurum = { aktif: p.aktif !== false, oklar: p.oklar ?? [], ts: Date.now() };
    await this.ctx.storage.put(canliDurumAnahtari(p.grup, p.ad), durum);
  }
}
