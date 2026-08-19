import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

interface MiloDersRow {
  id: string;
  tip: string;
  baslik: string;
  seviye: string;
  kategori: string | null;
  kazanim: string | null;
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

interface MiloDersBody {
  id?: string;
  tip: string;
  baslik: string;
  seviye: string;
  kategori?: string | null;
  kazanim?: string | null;
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

/** MILO FITT KIDS ders icerikleri kutuphanesi — okculuktaki dersIcerikleri.ts ile ayni sekil,
 * ayri DB_MILO'da. Gizem'in kendi cimnastik icerigi, okculugun 43 hazir dersinden bagimsiz,
 * bos baslar. */
export function registerMiloDersIcerikleriRoutes(router: Router): void {
  router.get("/api/milo/ders-icerikleri", async (_request, env) => {
    const { results } = await env.DB_MILO.prepare(
      `SELECT d.*,
              (SELECT COUNT(*) FROM ders_kullanim_log k WHERE k.dersId = d.id) AS kullanimSayisi,
              (SELECT MAX(k.tarih) FROM ders_kullanim_log k WHERE k.dersId = d.id) AS sonKullanim,
              (SELECT AVG(g.puan) FROM ders_degerlendirme g WHERE g.dersId = d.id) AS ortalamaPuan,
              (SELECT COUNT(*) FROM ders_degerlendirme g WHERE g.dersId = d.id) AS degerlendirmeSayisi
       FROM ders_icerikleri d
       ORDER BY d.olusturulma ASC`
    ).all<MiloDersRow>();
    return json({ dersler: results });
  });

  router.post("/api/milo/ders-icerikleri", async (request, env) => {
    const body = await readJson<MiloDersBody>(request);
    if (!body.tip || !body.baslik || !body.seviye || !Array.isArray(body.gruplar) || !body.gruplar.length) {
      return badRequest("tip, baslik, seviye, gruplar are required");
    }
    const id = body.id || "milo_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    const now = Date.now();
    await env.DB_MILO.prepare(
      `INSERT INTO ders_icerikleri (id, tip, baslik, seviye, kategori, kazanim, gruplar_json, sure, malzeme, aciklama, adimlar_json, dikkat_json, cizim, olusturan, olusturulma, guncelleme, baglantiSlotId)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id, body.tip, body.baslik, body.seviye, body.kategori ?? null, body.kazanim ?? null, JSON.stringify(body.gruplar), body.sure ?? null,
        body.malzeme ?? null, body.aciklama ?? null, JSON.stringify(body.adimlar || []), JSON.stringify(body.dikkat || []),
        body.cizim ?? null, body.olusturan ?? null, now, now, body.baglantiSlotId ?? null
      )
      .run();
    return json({ applied: true, id });
  });

  router.put("/api/milo/ders-icerikleri/:id", async (request, env, params) => {
    const body = await readJson<MiloDersBody>(request);
    if (!body.tip || !body.baslik || !body.seviye || !Array.isArray(body.gruplar) || !body.gruplar.length) {
      return badRequest("tip, baslik, seviye, gruplar are required");
    }
    await env.DB_MILO.prepare(
      `UPDATE ders_icerikleri SET tip=?, baslik=?, seviye=?, kategori=?, kazanim=?, gruplar_json=?, sure=?, malzeme=?, aciklama=?, adimlar_json=?, dikkat_json=?, cizim=?, olusturan=?, guncelleme=?, baglantiSlotId=?
       WHERE id=?`
    )
      .bind(
        body.tip, body.baslik, body.seviye, body.kategori ?? null, body.kazanim ?? null, JSON.stringify(body.gruplar), body.sure ?? null, body.malzeme ?? null,
        body.aciklama ?? null, JSON.stringify(body.adimlar || []), JSON.stringify(body.dikkat || []), body.cizim ?? null,
        body.olusturan ?? null, Date.now(), body.baglantiSlotId ?? null, params.id
      )
      .run();
    return json({ applied: true, id: params.id });
  });

  router.delete("/api/milo/ders-icerikleri/:id", async (_request, env, params) => {
    await env.DB_MILO.prepare("DELETE FROM ders_icerikleri WHERE id = ?").bind(params.id).run();
    await env.DB_MILO.prepare("DELETE FROM ders_kullanim_log WHERE dersId = ?").bind(params.id).run();
    await env.DB_MILO.prepare("DELETE FROM ders_degerlendirme WHERE dersId = ?").bind(params.id).run();
    await env.DB_MILO.prepare("DELETE FROM member_skills WHERE dersId = ?").bind(params.id).run();
    return json({ applied: true });
  });

  router.post("/api/milo/ders-icerikleri/:id/kullanim", async (request, env, params) => {
    const body = await readJson<{ tarih?: string; kullanan?: string | null; grup?: string | null }>(request);
    const tarih = body.tarih || new Date().toISOString().slice(0, 10);
    await env.DB_MILO.prepare("INSERT INTO ders_kullanim_log (dersId, tarih, kullanan, t, grup) VALUES (?, ?, ?, ?, ?)")
      .bind(params.id, tarih, body.kullanan ?? null, Date.now(), body.grup ?? null)
      .run();
    return json({ applied: true });
  });

  router.post("/api/milo/ders-icerikleri/:id/degerlendir", async (request, env, params) => {
    const body = await readJson<{ puan: number; degerlendiren?: string | null }>(request);
    if (!body.puan || body.puan < 1 || body.puan > 5) return badRequest("puan 1-5 arasinda olmalidir");
    await env.DB_MILO.prepare("INSERT INTO ders_degerlendirme (dersId, puan, degerlendiren, t) VALUES (?, ?, ?, ?)")
      .bind(params.id, body.puan, body.degerlendiren ?? null, Date.now())
      .run();
    return json({ applied: true });
  });
}
