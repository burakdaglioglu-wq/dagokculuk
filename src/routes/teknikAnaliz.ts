import type { Router } from "../router";
import { json, badRequest, notFound, readJson } from "../lib/json";
import * as db from "../db/teknikAnaliz";

// Teknik Analiz — Karışık Sınıf aracı (2026-09-23). Admin-gated (index.ts'te istisna değil): sadece
// eğitmen/yönetici PIN'i girilmiş bir oturum yeni analiz kaydedebilir/silebilir; okuma da aynı şekilde
// korunur (analiz içeriği ve fotoğraflar hassas sayılıyor).
export function registerTeknikAnalizRoutes(router: Router): void {
  router.get("/api/teknik-analiz", async (request, env) => {
    const url = new URL(request.url);
    const grup = url.searchParams.get("grup");
    const ad = url.searchParams.get("ad");
    if (!grup || !ad) return badRequest("grup and ad are required");
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam ? Math.max(1, Math.min(50, Number(limitParam) || 12)) : 12;
    const list = await db.listTeknikAnaliz(env, grup, ad, limit);
    return json({ list });
  });

  router.get("/api/teknik-analiz/:id", async (_request, env, params) => {
    const row = await db.getTeknikAnaliz(env, params.id);
    if (!row) return notFound("not found");
    return json(row);
  });

  router.post("/api/teknik-analiz", async (request, env) => {
    const body = await readJson<{
      grup: string; ad: string; yay: string; tarih: string; skor: number | null; fazlar: unknown; olusturan?: string | null;
    }>(request);
    if (!body.grup || !body.ad || !body.yay || !body.tarih) return badRequest("grup, ad, yay and tarih are required");
    if (body.yay !== "klasik" && body.yay !== "makarali") return badRequest("invalid yay");
    if (!body.fazlar) return badRequest("fazlar is required");
    const fazlarJson = JSON.stringify(body.fazlar);
    if (fazlarJson.length > 6_000_000) return badRequest("fazlar too large");
    const id = crypto.randomUUID();
    const t = Date.now();
    await db.createTeknikAnaliz(env, {
      id, grup: body.grup, ad: body.ad, yay: body.yay, tarih: body.tarih,
      skor: typeof body.skor === "number" ? body.skor : null,
      fazlarJson, olusturan: body.olusturan || null, t,
    });
    return json({ applied: true, id });
  });

  router.delete("/api/teknik-analiz/:id", async (_request, env, params) => {
    const applied = await db.deleteTeknikAnaliz(env, params.id);
    return json({ applied });
  });
}
