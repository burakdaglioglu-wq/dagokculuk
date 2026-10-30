import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";

// 💵 Aidat dışı gelir (2026-10-30): kayıt ücreti, forma, ekipman satışı… gider.ts ile aynı desen; Net = aidat + gelir − gider.
// "giren" oturumdaki kişi (sunucu yazar).
interface GelirRow { id: string; tarih: string; kategori: string; aciklama: string | null; tutar: number; yontem: string | null; sporcu: string | null; giren: string | null; t: number }
const YONTEMLER = ["nakit", "iban", "kart"];

export function registerGelirRoutes(router: Router): void {
  router.get("/api/gelir", async (request, env) => {
    const ay = new URL(request.url).searchParams.get("ay");
    const stmt = ay ? env.DB.prepare("SELECT * FROM gelir WHERE tarih LIKE ? ORDER BY tarih DESC").bind(ay + "%") : env.DB.prepare("SELECT * FROM gelir ORDER BY tarih DESC");
    const { results } = await stmt.all<GelirRow>();
    return json({ gelirler: results });
  });

  router.post("/api/gelir", async (request, env, params) => {
    const body = await readJson<{ tarih: string; kategori: string; aciklama?: string | null; tutar: number; yontem?: string | null; sporcu?: string | null }>(request);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.tarih || "") || !body.kategori || typeof body.tutar !== "number") return badRequest("tarih, kategori and tutar are required");
    if (!(body.tutar > 0)) return badRequest("tutar must be positive");
    const id = "gl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    await env.DB.prepare("INSERT INTO gelir (id, tarih, kategori, aciklama, tutar, yontem, sporcu, giren, t) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, body.tarih, String(body.kategori).slice(0, 60), body.aciklama ? String(body.aciklama).slice(0, 200) : null, body.tutar,
        YONTEMLER.includes(body.yontem || "") ? body.yontem : null, body.sporcu ? String(body.sporcu).slice(0, 120) : null, params._oturumAd || null, Date.now())
      .run();
    return json({ applied: true, id });
  });

  router.delete("/api/gelir/:id", async (_request, env, params) => {
    await env.DB.prepare("DELETE FROM gelir WHERE id = ?").bind(params.id).run();
    return json({ applied: true });
  });
}
