import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

interface MiloYasKategorisiRow {
  id: number;
  ad: string;
  olusturulma: number;
}

interface MiloGrupRow {
  id: number;
  yasKategorisiId: number;
  ad: string;
  olusturulma: number;
}

/** MILO FITT KIDS Yas Kategorisi -> Grup gezinme/katalog yapisi. members.grup ve
 * antrenman_programi.grup'a HICBIR FK/CHECK baglanmiyor -- eslesme sadece isimle yapiliyor,
 * gun/saat icin antrenman_programi, uye rosteri icin members.grup aynen yeniden kullaniliyor. */
export function registerMiloGruplarRoutes(router: Router): void {
  router.get("/api/milo/yas-kategorileri", async (_request, env) => {
    const { results } = await env.DB_MILO.prepare("SELECT * FROM yas_kategorileri ORDER BY olusturulma ASC").all<MiloYasKategorisiRow>();
    return json({ yasKategorileri: results });
  });

  router.post("/api/milo/yas-kategorileri", async (request, env) => {
    const body = await readJson<{ ad: string }>(request);
    if (!body.ad || !body.ad.trim()) return badRequest("ad is required");
    const res = await env.DB_MILO.prepare("INSERT INTO yas_kategorileri (ad, olusturulma) VALUES (?, ?)")
      .bind(body.ad.trim(), Date.now())
      .run();
    return json({ applied: true, id: res.meta.last_row_id });
  });

  router.delete("/api/milo/yas-kategorileri/:id", async (_request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    // Oksuz grup kaydi kalmasin — bir yas kategorisi silinince altindaki gruplar da silinir.
    // members.grup/antrenman_programi.grup'a HIC dokunulmaz (bkz. dosya basi aciklamasi).
    await env.DB_MILO.prepare("DELETE FROM gruplar WHERE yasKategorisiId = ?").bind(id).run();
    await env.DB_MILO.prepare("DELETE FROM yas_kategorileri WHERE id = ?").bind(id).run();
    return json({ applied: true });
  });

  router.get("/api/milo/gruplar", async (request, env) => {
    const yasKategorisiId = new URL(request.url).searchParams.get("yasKategorisiId");
    const stmt = yasKategorisiId
      ? env.DB_MILO.prepare("SELECT * FROM gruplar WHERE yasKategorisiId = ? ORDER BY olusturulma ASC").bind(Number(yasKategorisiId))
      : env.DB_MILO.prepare("SELECT * FROM gruplar ORDER BY olusturulma ASC");
    const { results } = await stmt.all<MiloGrupRow>();
    return json({ gruplar: results });
  });

  router.post("/api/milo/gruplar", async (request, env) => {
    const body = await readJson<{ yasKategorisiId: number; ad: string }>(request);
    if (!body.yasKategorisiId || !body.ad || !body.ad.trim()) return badRequest("yasKategorisiId and ad are required");
    const res = await env.DB_MILO.prepare("INSERT INTO gruplar (yasKategorisiId, ad, olusturulma) VALUES (?, ?, ?)")
      .bind(body.yasKategorisiId, body.ad.trim(), Date.now())
      .run();
    return json({ applied: true, id: res.meta.last_row_id });
  });

  router.put("/api/milo/gruplar/:id", async (request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    const body = await readJson<{ ad: string }>(request);
    if (!body.ad || !body.ad.trim()) return badRequest("ad is required");
    await env.DB_MILO.prepare("UPDATE gruplar SET ad = ? WHERE id = ?").bind(body.ad.trim(), id).run();
    return json({ applied: true });
  });

  router.delete("/api/milo/gruplar/:id", async (_request, env, params) => {
    const id = Number(params.id);
    if (!id) return badRequest("invalid id");
    await env.DB_MILO.prepare("DELETE FROM gruplar WHERE id = ?").bind(id).run();
    return json({ applied: true });
  });
}
