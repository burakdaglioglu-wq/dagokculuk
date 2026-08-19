import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcastMasterChanged } from "../lib/broadcast";

export interface DersRow {
  id: string;
  tip: string;
  baslik: string;
  seviye: string;
  gruplar_json: string;
  sure: number | null;
  malzeme: string | null;
  aciklama: string | null;
  adimlar_json: string;
  dikkat_json: string;
  cizim: string | null;
  olusturan: string | null;
  olusturulma: number;
  guncelleme: number;
  baglantiSlotId: number | null;
  kullanimSayisi: number;
  sonKullanim: string | null;
  ortalamaPuan: number | null;
  degerlendirmeSayisi: number;
}

interface DersBody {
  id?: string;
  tip: string;
  baslik: string;
  seviye: string;
  gruplar: string[];
  sure?: number | null;
  malzeme?: string | null;
  aciklama?: string | null;
  adimlar?: string[];
  dikkat?: string[];
  cizim?: string | null;
  olusturan?: string | null;
  baglantiSlotId?: number | null;
}

/** Ders içerikleri kütüphanesi — hem sistem tarafından hazırlanmış hem eğitmenlerin eklediği
 * dersler tek D1 tablosunda (ders_icerikleri), tamamı düzenlenebilir/silinebilir, kalıcı. */
export function registerDersIcerikleriRoutes(router: Router): void {
  router.get("/api/ders-icerikleri", async (_request, env) => {
    const { results } = await env.DB.prepare(
      `SELECT d.*,
              (SELECT COUNT(*) FROM ders_kullanim_log k WHERE k.dersId = d.id) AS kullanimSayisi,
              (SELECT MAX(k.tarih) FROM ders_kullanim_log k WHERE k.dersId = d.id) AS sonKullanim,
              (SELECT AVG(g.puan) FROM ders_degerlendirme g WHERE g.dersId = d.id) AS ortalamaPuan,
              (SELECT COUNT(*) FROM ders_degerlendirme g WHERE g.dersId = d.id) AS degerlendirmeSayisi
       FROM ders_icerikleri d
       ORDER BY d.olusturulma ASC`
    ).all<DersRow>();
    return json({ dersler: results });
  });

  router.post("/api/ders-icerikleri", async (request, env) => {
    const body = await readJson<DersBody>(request);
    if (!body.tip || !body.baslik || !body.seviye || !Array.isArray(body.gruplar) || !body.gruplar.length) {
      return badRequest("tip, baslik, seviye, gruplar are required");
    }
    const id = body.id || "ozel_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO ders_icerikleri (id, tip, baslik, seviye, gruplar_json, sure, malzeme, aciklama, adimlar_json, dikkat_json, cizim, olusturan, olusturulma, guncelleme, baglantiSlotId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        body.tip,
        body.baslik,
        body.seviye,
        JSON.stringify(body.gruplar),
        body.sure ?? null,
        body.malzeme ?? null,
        body.aciklama ?? null,
        JSON.stringify(body.adimlar || []),
        JSON.stringify(body.dikkat || []),
        body.cizim ?? null,
        body.olusturan ?? null,
        now,
        now,
        body.baglantiSlotId ?? null
      )
      .run();
    await broadcastMasterChanged(env, null);
    return json({ applied: true, id });
  });

  router.put("/api/ders-icerikleri/:id", async (request, env, params) => {
    const body = await readJson<DersBody>(request);
    if (!body.tip || !body.baslik || !body.seviye || !Array.isArray(body.gruplar) || !body.gruplar.length) {
      return badRequest("tip, baslik, seviye, gruplar are required");
    }
    const now = Date.now();
    await env.DB.prepare(
      `UPDATE ders_icerikleri SET tip=?, baslik=?, seviye=?, gruplar_json=?, sure=?, malzeme=?, aciklama=?, adimlar_json=?, dikkat_json=?, cizim=?, olusturan=?, guncelleme=?, baglantiSlotId=?
       WHERE id=?`
    )
      .bind(
        body.tip,
        body.baslik,
        body.seviye,
        JSON.stringify(body.gruplar),
        body.sure ?? null,
        body.malzeme ?? null,
        body.aciklama ?? null,
        JSON.stringify(body.adimlar || []),
        JSON.stringify(body.dikkat || []),
        body.cizim ?? null,
        body.olusturan ?? null,
        now,
        body.baglantiSlotId ?? null,
        params.id
      )
      .run();
    await broadcastMasterChanged(env, null);
    return json({ applied: true, id: params.id });
  });

  router.delete("/api/ders-icerikleri/:id", async (_request, env, params) => {
    await env.DB.prepare("DELETE FROM ders_icerikleri WHERE id = ?").bind(params.id).run();
    await env.DB.prepare("DELETE FROM ders_kullanim_log WHERE dersId = ?").bind(params.id).run();
    await env.DB.prepare("DELETE FROM ders_degerlendirme WHERE dersId = ?").bind(params.id).run();
    await broadcastMasterChanged(env, null);
    return json({ applied: true });
  });

  router.post("/api/ders-icerikleri/:id/kullanim", async (request, env, params) => {
    const body = await readJson<{ tarih?: string; kullanan?: string | null; grup?: string | null }>(request);
    const tarih = body.tarih || new Date().toISOString().slice(0, 10);
    await env.DB.prepare("INSERT INTO ders_kullanim_log (dersId, tarih, kullanan, t, grup) VALUES (?, ?, ?, ?, ?)")
      .bind(params.id, tarih, body.kullanan ?? null, Date.now(), body.grup ?? null)
      .run();
    await broadcastMasterChanged(env, null);
    return json({ applied: true });
  });

  router.get("/api/ders-icerikleri/kullanim-raporu", async (request, env) => {
    const url = new URL(request.url);
    const grup = url.searchParams.get("grup");
    const gun = Number(url.searchParams.get("gun") || 30);
    const esikTarih = new Date(Date.now() - gun * 86400000).toISOString().slice(0, 10);

    const kullanimlar = await env.DB.prepare(
      `SELECT d.id AS dersId, d.baslik, d.tip, COUNT(k.id) AS sayi
       FROM ders_kullanim_log k JOIN ders_icerikleri d ON d.id = k.dersId
       WHERE k.tarih >= ? AND (? IS NULL OR k.grup = ?)
       GROUP BY d.id ORDER BY sayi DESC`
    )
      .bind(esikTarih, grup, grup)
      .all();

    const tipDagilimi = await env.DB.prepare(
      `SELECT d.tip, COUNT(k.id) AS sayi
       FROM ders_kullanim_log k JOIN ders_icerikleri d ON d.id = k.dersId
       WHERE k.tarih >= ? AND (? IS NULL OR k.grup = ?)
       GROUP BY d.tip`
    )
      .bind(esikTarih, grup, grup)
      .all();

    return json({ kullanimlar: kullanimlar.results, tipDagilimi: tipDagilimi.results, gun, grup });
  });

  router.post("/api/ders-icerikleri/:id/degerlendir", async (request, env, params) => {
    const body = await readJson<{ puan: number; degerlendiren?: string | null }>(request);
    if (!body.puan || body.puan < 1 || body.puan > 5) return badRequest("puan 1-5 arasinda olmalidir");
    await env.DB.prepare("INSERT INTO ders_degerlendirme (dersId, puan, degerlendiren, t) VALUES (?, ?, ?, ?)")
      .bind(params.id, body.puan, body.degerlendiren ?? null, Date.now())
      .run();
    await broadcastMasterChanged(env, null);
    return json({ applied: true });
  });
}
