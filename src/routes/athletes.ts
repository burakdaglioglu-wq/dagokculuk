import type { Env } from "../env";
import type { Router } from "../router";
import { json, badRequest, notFound, readJson, unauthorized } from "../lib/json";
import { broadcast } from "../lib/broadcast";
import { isAuthorized } from "../auth";
import * as athletesDb from "../db/athletes";

// "/api/athletes/:grup/:ad" hem sporcunun kendi öz-servis girişleri (ör. günlük Hazır Olma anketi)
// HEM DE yönetici-only alan düzenlemeleri (sağlık raporu/lisans bitiş tarihi gibi hassas belgeler)
// için kullanılıyor — route tamamen açık bırakılamaz (hassas belge açığa çıkar) ama tamamen
// kapatılamaz da (sporcu kendi anketini PIN'siz dolduramaz hale gelir). Bu yüzden index.ts'teki
// genel kapıdan İSTİSNA tutulup burada ALAN bazında karar veriliyor.
const OZ_SERVIS_ALANLARI = new Set<string>(["hazirOlma_json"]);

export function registerAthleteRoutes(router: Router): void {
  router.get("/api/athletes", async (request, env) => {
    const grup = new URL(request.url).searchParams.get("grup") ?? undefined;
    const athletes = await athletesDb.listAthletes(env, grup);
    return json({ athletes });
  });

  router.get("/api/athletes/deleted", async (_request, env) => {
    const deleted = await athletesDb.listDeletedAthletes(env);
    return json({ deleted });
  });

  router.get("/api/athletes/:grup/:ad", async (_request, env, params) => {
    const athlete = await athletesDb.getAthlete(env, params.grup, params.ad);
    return athlete ? json({ athlete }) : notFound("athlete not found");
  });

  router.post("/api/athletes", async (request, env) => {
    const body = await readJson<{
      grup: string;
      ad: string;
      kod?: string | null;
      dogumYili?: number | null;
      sinif?: string | null;
      yay?: string | null;
      lastModified?: number;
    }>(request);
    if (!body.grup || !body.ad) return badRequest("grup and ad are required");

    const result = await athletesDb.createAthlete(env, {
      grup: body.grup,
      ad: body.ad,
      kod: body.kod,
      dogumYili: body.dogumYili,
      sinif: body.sinif,
      yay: body.yay,
      lastModified: body.lastModified ?? Date.now(),
    });
    if (!result.applied) return json({ applied: false, reason: result.reason }, { status: 409 });

    await broadcast(env, {
      type: "athlete-updated",
      deviceId: null,
      payload: { grup: body.grup, ad: body.ad, fields: result.athlete ?? {}, lastModified: body.lastModified ?? Date.now() },
    });
    return json({ applied: true, athlete: result.athlete });
  });

  // DÜZELTME: bu endpoint her sporcu için HER 10sn'lik tam anlık görüntü gönderiminde (fanOutMasterPayload)
  // ayrı ayrı çağrılıyor ve her çağrı Durable Object'e bir broadcast isteği atıyordu — 60 sporcu olan bir
  // kulüpte tek bir skor kaydı bile onlarca DO isteği tetikliyordu. Ücretsiz DO kotasını aşmanın asıl
  // sebebi buydu. Alan güncellemesi rutin/acil olmayan bir veri (coin, sınıf vb.) olduğundan, broadcast
  // kaldırıldı — diğer cihazlar bunu zaten kendi doğal senkron döngülerinde alacak.
  router.patch("/api/athletes/:grup/:ad", async (request, env, params) => {
    const body = await readJson<{ fields: Record<string, unknown>; lastModified: number; deviceId?: string }>(request);
    if (!body.fields || typeof body.lastModified !== "number") return badRequest("fields and lastModified are required");
    const invalid = Object.keys(body.fields).filter(
      (c) => !(athletesDb.ATHLETE_UPDATABLE_FIELDS as readonly string[]).includes(c)
    );
    if (invalid.length > 0) return badRequest(`invalid field(s): ${invalid.join(", ")}`);

    const sadeceOzServis = Object.keys(body.fields).every((f) => OZ_SERVIS_ALANLARI.has(f));
    if (!sadeceOzServis && !(await isAuthorized(request, env, false))) return unauthorized();

    const result = await athletesDb.updateAthlete(
      env,
      params.grup,
      params.ad,
      body.fields as Partial<Pick<athletesDb.AthleteRow, (typeof athletesDb.ATHLETE_UPDATABLE_FIELDS)[number]>>,
      body.lastModified
    );
    if (!result.applied) return json({ applied: false }, { status: 409 });

    return json({ applied: true });
  });

  router.patch("/api/athletes/:grup/:ad/gamification", async (request, env, params) => {
    const body = await readJson<{ gamification: Record<string, unknown>; coin: number; coinT: number; deviceId?: string }>(request);
    if (typeof body.coinT !== "number") return badRequest("coinT is required");

    const result = await athletesDb.updateGamification(env, params.grup, params.ad, body.gamification ?? {}, body.coin ?? 0, body.coinT);
    if (!result.applied) return json({ applied: false }, { status: 409 });

    return json({ applied: true });
  });

  // Admin-only (PUBLIC_YAZMA_YOLLARI'na eklenmedi) — "Canlı Veli İzleme" linkini üretir/döner.
  router.post("/api/athletes/:grup/:ad/izle-kodu", async (_request, env, params) => {
    const kod = await athletesDb.getOrCreateIzleKodu(env, params.grup, params.ad);
    if (!kod) return notFound("athlete not found");
    return json({ kod });
  });

  router.post("/api/athletes/:grup/:ad/move", async (request, env, params) => {
    const body = await readJson<{ toGrup: string; toAd?: string; deviceId?: string }>(request);
    if (!body.toGrup) return badRequest("toGrup is required");

    const toAd = body.toAd ?? params.ad;
    const result = await athletesDb.moveAthlete(env, params.grup, params.ad, body.toGrup, toAd, Date.now());

    await broadcast(env, {
      type: "athlete-updated",
      deviceId: body.deviceId ?? null,
      payload: { grup: body.toGrup, ad: toAd, fields: { movedFrom: { grup: params.grup, ad: params.ad } }, lastModified: Date.now() },
    });
    return json(result);
  });

  router.delete("/api/athletes/:grup/:ad", async (request, env, params) => {
    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");
    const result = await athletesDb.deleteAthlete(env, params.grup, params.ad, Date.now());

    await broadcast(env, {
      type: "athlete-updated",
      deviceId,
      payload: { grup: params.grup, ad: params.ad, fields: { deleted: true }, lastModified: Date.now() },
    });
    return json(result);
  });
}
