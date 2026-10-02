import type { Env } from "../env";
import type { Router } from "../router";
import { json, badRequest, notFound, readJson, unauthorized } from "../lib/json";
import { broadcast } from "../lib/broadcast";
import { yetkiliOturum } from "../auth";
import * as athletesDb from "../db/athletes";
import { mergeAthlete, renameAthlete, tasimaKopuklari, tasimaOnar } from "../db/athletesMerge";

// "/api/athletes/:grup/:ad" hem sporcunun kendi öz-servis girişleri (ör. günlük Hazır Olma anketi)
// HEM DE yönetici-only alan düzenlemeleri (sağlık raporu/lisans bitiş tarihi gibi hassas belgeler)
// için kullanılıyor — route tamamen açık bırakılamaz (hassas belge açığa çıkar) ama tamamen
// kapatılamaz da (sporcu kendi anketini PIN'siz dolduramaz hale gelir). Bu yüzden index.ts'teki
// genel kapıdan İSTİSNA tutulup burada ALAN bazında karar veriliyor.
const OZ_SERVIS_ALANLARI = new Set<string>(["hazirOlma_json"]);

// KVKK (2026-09-28): sporcu listesi PIN'siz ekranlar (skor girişi, Karışık Sınıf) için girişsiz okunabilmeli —
// ama çocukların kişisel verileri (veli adı/telefonu, doğum tarihi, notlar, sağlık belgesi tarihleri, hazır olma
// anketindeki sağlık/sakatlık bilgisi) yalnızca giriş yapmış yönetici/eğitmene gider. Alanlar null değil,
// HİÇ gönderilmez: istemci (turnuvaDBMerge + sync.js kisiselAlanlar) "yok" ile "silindi"yi ayırt eder ve
// girişsiz bir cihaz gerçek veriyi boşlukla ezemez. Sporcu giriş kodu (kod) PIN'siz sporcu girişi için kalır.
const KISISEL_ALANLAR = ["acilKisi", "acilTelefon", "antrenmanNotu", "genelNot", "dogumTarihi", "katilmaTarihi", "aileMeslek", "veli2Kisi", "veli2Telefon", "saglikRaporuBitis", "lisansBitis"] as const;
function kisiselGizle(a: athletesDb.AthleteDTO): athletesDb.AthleteDTO {
  const k = { ...a } as Record<string, unknown>;
  KISISEL_ALANLAR.forEach((f) => { delete k[f]; });
  const h = k.hazirOlma as { tarih?: string } | null | undefined;
  // sporcunun kendi "bugün anketi doldurdum" kontrolü için yalnızca tarih kalır
  k.hazirOlma = h && h.tarih ? { tarih: h.tarih, _gizli: true } : null;
  return k as athletesDb.AthleteDTO;
}

export function registerAthleteRoutes(router: Router): void {
  router.get("/api/athletes", async (request, env) => {
    const grup = new URL(request.url).searchParams.get("grup") ?? undefined;
    const athletes = await athletesDb.listAthletes(env, grup);
    const oturum = await yetkiliOturum(request, env, false);
    return json({ athletes: oturum ? athletes : athletes.map(kisiselGizle) });
  });

  router.get("/api/athletes/deleted", async (_request, env) => {
    const deleted = await athletesDb.listDeletedAthletes(env);
    return json({ deleted });
  });

  router.get("/api/athletes/:grup/:ad", async (request, env, params) => {
    const athlete = await athletesDb.getAthlete(env, params.grup, params.ad);
    if (!athlete) return notFound("athlete not found");
    return json({ athlete: (await yetkiliOturum(request, env, false)) ? athlete : kisiselGizle(athlete) });
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
      deviceId?: string;
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

    // KASMA KÖK NEDENİ (2026-09-30): senkron her sporcu için bu uca "oluştur/güncelle" atıyor; eskiden HİÇBİR
    // şey değişmese de herkese athlete-updated yayılıyordu → her cihaz tüm kulübü yeniden çekip kendisi de
    // gönderiyordu (eski sürümlü iki cihaz arasında saniyede ~2 yayınlık sonsuz döngü ölçüldü). Artık yalnızca
    // satır gerçekten eklendi/değiştiyse yayınlanır; gönderen cihaz kendi yankısını deviceId ile yok sayar.
    if (!result.degisti) return json({ applied: true, athlete: result.athlete });
    await broadcast(env, {
      type: "athlete-updated",
      deviceId: body.deviceId ?? null,
      payload: { grup: body.grup, ad: body.ad, fields: result.athlete ? kisiselGizle(result.athlete) : {}, lastModified: body.lastModified ?? Date.now() },
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

    // KVKK geçiş koruması: kişisel alanlara gelen null yok sayılır (girişsiz açılmış eski bir istemci "bende yok"u
    // null olarak gönderip gerçek veriyi silmesin). Bilerek boşaltma '' ile gelir ve uygulanır.
    for (const f of KISISEL_ALANLAR) if ((body.fields as Record<string, unknown>)[f] === null) delete (body.fields as Record<string, unknown>)[f];
    if (Object.keys(body.fields).length === 0) return json({ applied: true });
    const sadeceOzServis = Object.keys(body.fields).every((f) => OZ_SERVIS_ALANLARI.has(f));
    if (!sadeceOzServis && !(await yetkiliOturum(request, env, false))) return unauthorized();

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

  // Çift Kayıt Birleştir (2026-09-20) — :grup/:ad KAYNAK (silinecek), body.toGrup/toAd HEDEF (kalacak).
  router.post("/api/athletes/:grup/:ad/merge", async (request, env, params) => {
    const body = await readJson<{ toGrup: string; toAd: string; deviceId?: string }>(request);
    if (!body.toGrup || !body.toAd) return badRequest("toGrup and toAd are required");
    const zaman = Date.now();
    const result = await mergeAthlete(env, params.grup, params.ad, body.toGrup, body.toAd, zaman);
    if (!result.applied) return badRequest(result.reason || "merge-failed");
    await broadcast(env, {
      type: "athlete-updated",
      deviceId: body.deviceId ?? null,
      payload: { grup: params.grup, ad: params.ad, fields: { deleted: true, mergedInto: { grup: body.toGrup, ad: body.toAd } }, lastModified: zaman },
    });
    await broadcast(env, {
      type: "athlete-updated",
      deviceId: body.deviceId ?? null,
      payload: { grup: body.toGrup, ad: body.toAd, fields: { merged: true }, lastModified: zaman },
    });
    return json(result);
  });

  // Kategori Taşı onarımı (2026-09-28): GET oturum ister (index.ts OTURUMLU_OKUMA_YOLLARI), POST varsayılan olarak ister.
  router.get("/api/athlete-moves/kopuk", async (_request, env) => json({ kopuk: await tasimaKopuklari(env) }));
  router.post("/api/athlete-moves/onar", async (request, env) => {
    const body = await readJson<{ deviceId?: string }>(request).catch(() => ({} as { deviceId?: string }));
    const onarilan = await tasimaOnar(env);
    if (onarilan.length) await broadcast(env, { type: "master-changed", deviceId: body.deviceId ?? null, payload: {} });
    return json({ onarilan });
  });

  // İsim Düzelt (2026-09-28) — veri kaybı olmadan yeniden adlandırma (bkz. renameAthlete). Admin-only.
  router.post("/api/athletes/:grup/:ad/rename", async (request, env, params) => {
    const body = await readJson<{ yeniAd: string; yeniGrup?: string; deviceId?: string }>(request);
    const yeniAd = (body.yeniAd || "").trim();
    if (!yeniAd) return badRequest("yeniAd is required");
    const zaman = Date.now();
    const result = await renameAthlete(env, params.grup, params.ad, yeniAd, zaman, body.yeniGrup);
    if (!result.applied) return badRequest(result.reason || "rename-failed");
    await broadcast(env, {
      type: "athlete-updated",
      deviceId: body.deviceId ?? null,
      payload: { grup: params.grup, ad: params.ad, fields: { deleted: true, mergedInto: { grup: body.yeniGrup || params.grup, ad: yeniAd } }, lastModified: zaman },
    });
    return json(result);
  });

  // Silinenlerden geri al (2026-10-02) — tek yol; oturum ister (varsayılan yazma kuralı), işlem günlüğüne yazılır.
  router.post("/api/athletes/:grup/:ad/restore", async (request, env, params) => {
    const body = await readJson<{ deviceId?: string }>(request).catch(() => ({} as { deviceId?: string }));
    const result = await athletesDb.restoreAthlete(env, params.grup, params.ad, Date.now());
    if (result.restored) await broadcast(env, { type: "master-changed", deviceId: body.deviceId ?? null, payload: {} });
    return json(result);
  });

  router.delete("/api/athletes/:grup/:ad", async (request, env, params) => {
    // GÜVENLİK (2026-09-28): bu yol PATCH'in öz-servis alanları için PUBLIC_YAZMA_YOLLARI'nda — aynı eşleşme
    // DELETE'i de oturumsuz bırakıyordu (URL'i bilen herkes sporcu silebiliyordu). Silme her zaman oturum ister.
    if (!(await yetkiliOturum(request, env, false))) return unauthorized();
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
