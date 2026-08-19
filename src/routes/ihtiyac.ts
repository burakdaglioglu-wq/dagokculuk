import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { createTalep, listRecentTalepler, updateDurum } from "../db/ihtiyac";

const GECERLI_DURUMLAR = ["yeni", "inceleniyor", "tamamlandi"];

export function registerIhtiyacRoutes(router: Router): void {
  router.get("/api/ihtiyac", async (_request, env) => {
    const talepler = await listRecentTalepler(env, 50);
    return json({ talepler });
  });

  // Öz-servis: sporcu/veli PIN'siz gönderir (bkz. src/index.ts PUBLIC_YAZMA_YOLLARI).
  router.post("/api/ihtiyac", async (request, env) => {
    const body = await readJson<{ ad: string; grup?: string | null; kategori: string; aciklama: string }>(request);
    const ad = (body.ad || "").trim();
    const kategori = (body.kategori || "").trim();
    const aciklama = (body.aciklama || "").trim();
    if (!ad || !kategori || !aciklama) return badRequest("ad, kategori and aciklama are required");
    if (aciklama.length > 500) return badRequest("aciklama too long (max 500)");

    const id = await createTalep(env, { ad, grup: body.grup || null, kategori, aciklama, t: Date.now() });
    return json({ applied: true, id });
  });

  // Admin-only (varsayılan olarak korunuyor — src/index.ts'te istisna değil).
  router.patch("/api/ihtiyac/:id", async (request, env, params) => {
    const body = await readJson<{ durum: string }>(request);
    if (!GECERLI_DURUMLAR.includes(body.durum)) return badRequest("invalid durum");
    const id = Number(params.id);
    if (!Number.isInteger(id)) return badRequest("invalid id");

    const applied = await updateDurum(env, id, body.durum);
    return json({ applied });
  });
}
