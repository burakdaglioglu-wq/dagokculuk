import type { Env } from "../env";

export type BroadcastEvent =
  | { type: "series-added"; deviceId: string | null; payload: { seriId: string; grup: string; ad: string; oklar: string[]; puan: number; tarih: string; t: number } }
  | { type: "series-updated"; deviceId: string | null; payload: { seriId: string; oklar: string[]; puan: number } }
  | { type: "series-cancelled"; deviceId: string | null; payload: { seriIds: string[] } }
  | { type: "athlete-updated"; deviceId: string | null; payload: { grup: string; ad: string; fields: Record<string, unknown>; lastModified: number } }
  | { type: "lock-acquired"; deviceId: string | null; payload: { grup: string; ad: string; yapan: string; zaman: number } }
  | { type: "lock-released"; deviceId: string | null; payload: Record<string, never> }
  | { type: "season-changed"; deviceId: string | null; payload: { ad: string; baslangic: string | null; bitis: string | null; guncelleme: number } }
  | { type: "reset-signal"; deviceId: string | null; payload: { grup?: string; zaman: number; tip: "yeni_antrenman" | "sezon_bitis"; sezonAdi?: string } }
  | { type: "daily-backup-restored"; deviceId: string | null; payload: { tarih: string; guncelleme: number } }
  | { type: "master-changed"; deviceId: string | null; payload: Record<string, never> }
  | { type: "canli-atis"; deviceId: string | null; payload: { grup: string; ad: string; oklar: string[]; aktif: boolean } }
  | {
      type: "duello-davet";
      deviceId: string | null;
      payload: { duelId: string; davetciAd: string; davetciGrup: string; rakipAd: string; rakipGrup: string; seriSayisi: number; okSayisi: number; sureAktif: boolean; sureSaniye: number };
    }
  | {
      type: "duello-yanit";
      deviceId: string | null;
      payload: { duelId: string; kabul: boolean; davetciAd: string; davetciGrup: string; rakipAd: string; rakipGrup: string; seriSayisi: number; okSayisi: number; sureAktif: boolean; sureSaniye: number };
    }
  | {
      type: "duello-ok";
      deviceId: string | null;
      payload: {
        duelId: string; kimAd: string; kimGrup: string; seriIndex: number; ok: string;
        seriToplam: number | null; tamamlandiSeriSayisi: number | null;
        // Seri tamamlanma mesajları artık DELTA değil, o ana kadarki TÜM seri puanlarının tam anlık
        // görüntüsünü taşır — alıcı bunu olduğu gibi yerine koyar (push değil). Böylece bağlantı bir
        // arayla koptuysa kaçırılan ara mesajlar, bir SONRAKİ mesaj geldiğinde otomatik telafi olur.
        tumSeriPuanlari: number[] | null;
      };
    }
  | { type: "duello-iptal"; deviceId: string | null; payload: { duelId: string; kimAd: string; kimGrup: string } }
  | { type: "duyuru"; deviceId: string | null; payload: { baslik: string; mesaj: string; hedefGrup: string | null } };

let counter = 0;

export async function broadcast(env: Env, event: BroadcastEvent): Promise<void> {
  const id = env.CLUB_SYNC.idFromName("dagsk-club");
  const stub = env.CLUB_SYNC.get(id);
  counter += 1;
  const envelope = {
    id: `evt_${Date.now()}_${counter}`,
    ts: Date.now(),
    type: event.type,
    deviceId: event.deviceId,
    payload: event.payload,
  };
  await stub.fetch("https://do/broadcast", {
    method: "POST",
    body: JSON.stringify(envelope),
    headers: { "content-type": "application/json" },
  });
}

/** Fired by every route that mutates blob-covered state (dues, attendance, personnel, teams, brackets, meta) so sync.js's master-doc shim knows to re-pull and reassemble. */
export async function broadcastMasterChanged(env: Env, deviceId: string | null): Promise<void> {
  await broadcast(env, { type: "master-changed", deviceId, payload: {} });
}
