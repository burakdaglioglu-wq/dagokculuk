import type { Router } from "../router";
import { json, badRequest, notFound, readJson } from "../lib/json";
import { broadcast } from "../lib/broadcast";
import { resolveIzleKodu } from "../db/athletes";

/** Ephemeral "kim şu an atış yapıyor" yayını — hiçbir zaman D1'e yazılmaz, sadece bağlı
 * cihazlara anlık ok görünürlüğü sağlamak için Durable Object üzerinden fan-out edilir. */
export function registerLiveRoutes(router: Router): void {
  router.post("/api/canli-atis", async (request, env) => {
    const body = await readJson<{ grup: string; ad: string; oklar?: string[]; aktif?: boolean; deviceId?: string }>(request);
    if (!body.grup || !body.ad) return badRequest("grup and ad are required");

    await broadcast(env, {
      type: "canli-atis",
      deviceId: body.deviceId ?? null,
      payload: { grup: body.grup, ad: body.ad, oklar: body.oklar ?? [], aktif: body.aktif !== false },
    });
    return json({ applied: true });
  });

  // "Canlı Veli İzleme" (public/izle.html) — /ws'in ham, filtresiz yayınına HİÇ bağlanmaz. Kod
  // sporcuya çözülür, sonra Durable Object'in İÇİNDEKİ (sadece bu sporcuya ait) son durumu okunur.
  router.get("/api/canli-izle/:kod", async (_request, env, params) => {
    const hedef = await resolveIzleKodu(env, params.kod);
    if (!hedef) return notFound("invalid code");

    const id = env.CLUB_SYNC.idFromName("dagsk-club");
    const stub = env.CLUB_SYNC.get(id);
    const res = await stub.fetch(
      `https://do/canli-durum?grup=${encodeURIComponent(hedef.grup)}&ad=${encodeURIComponent(hedef.ad)}`
    );
    const durum = await res.json<{ aktif: boolean; oklar: unknown[]; ts: number }>();
    return json({ grup: hedef.grup, ad: hedef.ad, ...durum });
  });
}
