import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { listGiderler, createGider, deleteGider } from "../db/gider";

export function registerGiderRoutes(router: Router): void {
  router.get("/api/gider", async (request, env) => {
    const ay = new URL(request.url).searchParams.get("ay") ?? undefined;
    const giderler = await listGiderler(env, ay);
    return json({ giderler });
  });

  router.post("/api/gider", async (request, env) => {
    const body = await readJson<{ tarih: string; kategori: string; aciklama?: string | null; tutar: number; giren?: string | null }>(request);
    if (!body.tarih || !body.kategori || typeof body.tutar !== "number") return badRequest("tarih, kategori and tutar are required");
    if (body.tutar <= 0) return badRequest("tutar must be positive");

    const id = "gd_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    await createGider(env, {
      id,
      tarih: body.tarih,
      kategori: body.kategori,
      aciklama: body.aciklama ?? null,
      tutar: body.tutar,
      giren: body.giren ?? null,
      t: Date.now(),
    });
    return json({ applied: true, id });
  });

  router.delete("/api/gider/:id", async (_request, env, params) => {
    await deleteGider(env, params.id);
    return json({ applied: true });
  });
}
