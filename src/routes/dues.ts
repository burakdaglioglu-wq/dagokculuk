import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";

// ödeme yöntemi (2026-10-30): yalnız bu üçü; başka değer null yazılır
const YONTEMLER = ["nakit", "iban", "kart"];

interface DuesRow {
  ad: string;
  ay: string;
  odendi: number;
  tutar: number | null;
  tarih: string | null;
  notMetin: string | null;
  odemeTarihi: string | null;
  yontem: string | null;
  giren: string | null;
}

export function registerDuesRoutes(router: Router): void {
  router.get("/api/dues", async (request, env) => {
    const ad = new URL(request.url).searchParams.get("ad");
    const stmt = ad ? env.DB.prepare("SELECT * FROM dues WHERE ad = ?").bind(ad) : env.DB.prepare("SELECT * FROM dues");
    const { results } = await stmt.all<DuesRow>();
    return json({ dues: results.map((r) => ({ ...r, odendi: !!r.odendi })) });
  });

  // Son-yazan-kazanır (tarih bazlı): eskiden odendi=true her zaman false'u yenerdi, bu da bir ödemeyi
  // "ödenmedi"ye GERİ DÖNDÜRMEYİ kalıcı olarak imkansız kılıyordu (yanlışlıkla ödendi işaretlenen bir ay
  // asla düzeltilemezdi). Artık kural basit: tarihli bir güncelleme, kendinden eski/tarihsiz bir kayda
  // her zaman üstün gelir — hem işaretleme hem düzeltme aynı şekilde çalışır. Tarihsiz (null) gönderimler
  // hiçbir zaman mevcut veriyi ezmez (arka plandaki eski/bayat senkron döngülerine karşı koruma).
  // DÜZELTME: fanOutMasterPayload her sporcu×ay kombinasyonu için ayrı ayrı buraya postalıyordu (N sporcu
  // × 12 ay = yüzlerce istek), her biri Durable Object'e ayrı bir broadcast isteği tetikliyordu — ücretsiz
  // DO kotasının dolmasına büyük katkısı vardı. Aidat rutin/acil olmadığından broadcast kaldırıldı.
  router.put("/api/dues/:ad/:ay", async (request, env, params) => {
    const body = await readJson<{
      odendi: boolean;
      tutar?: number | null;
      tarih?: string | null;
      notMetin?: string | null;
      odemeTarihi?: string | null;
      yontem?: string | null;
      deviceId?: string;
    }>(request);
    if (typeof body.odendi !== "boolean") return badRequest("odendi is required");

    // NOT: "tarih" senkron/çakışma-çözümü için son-yazan-kazanır zaman damgasıdır (yukarıdaki WHERE
    // koşulu buna bakar) — "odemeTarihi" ise kullanıcının elle girdiği GERÇEK ödeme tarihidir (geçmişe
    // dönük girişler için). İkisi kasıtlı olarak ayrı: odemeTarihi geçmiş bir tarihe ayarlansa bile
    // güncelleme senkron korumasına takılmasın diye "tarih" alanı bundan etkilenmez.
    await env.DB.prepare(
      `INSERT INTO dues (ad, ay, odendi, tutar, tarih, notMetin, odemeTarihi, yontem, giren) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(ad, ay) DO UPDATE SET
         odendi = excluded.odendi, tutar = excluded.tutar, tarih = excluded.tarih, notMetin = excluded.notMetin, odemeTarihi = excluded.odemeTarihi,
         yontem = CASE WHEN excluded.odendi = 0 THEN NULL ELSE COALESCE(excluded.yontem, dues.yontem) END,
         giren = CASE WHEN excluded.odendi = 0 THEN NULL WHEN dues.odendi = 1 AND dues.giren IS NOT NULL THEN dues.giren ELSE excluded.giren END
       WHERE excluded.tarih IS NOT NULL AND (dues.tarih IS NULL OR excluded.tarih >= dues.tarih)`
    )
      .bind(params.ad, params.ay, body.odendi ? 1 : 0, body.tutar ?? null, body.tarih ?? null, body.notMetin ?? null, body.odemeTarihi ?? null, YONTEMLER.includes(body.yontem || "") ? body.yontem : null, body.odendi ? params._oturumAd || null : null)
      .run();

    return json({ applied: true });
  });
}
