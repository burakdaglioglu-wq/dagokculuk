import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

interface MiloCredentialsRow {
  yonetici_hash: string;
  egitmen_hash: string;
  aidat_hash: string | null;
  degisim: number;
}

/** MILO FITT KIDS kimlik dogrulama + ozel siniflar — okculuktaki meta.ts'in ilgili kismiyla
 * ayni sekil, ama tamamen ayri DB_MILO'da. Bu credentials satiri okculuk route'larindan
 * fiziksel olarak erisilemez (farkli D1 binding). */
export function registerMiloMetaRoutes(router: Router): void {
  // Eski /api/milo/credentials (GET/PUT) kaldırıldı (2026-09-27): PIN özetlerini herkese dağıtıyordu. Giriş artık
  // /api/milo/giris/* üzerinden (bkz. routes/giris.ts).

  router.get("/api/milo/custom-classes", async (_request, env) => {
    const { results } = await env.DB_MILO.prepare("SELECT ad FROM custom_classes").all<{ ad: string }>();
    return json({ classes: results.map((r) => r.ad) });
  });

  router.post("/api/milo/custom-classes", async (request, env) => {
    const body = await readJson<{ ad: string }>(request);
    if (!body.ad) return badRequest("ad is required");
    await env.DB_MILO.prepare("INSERT OR IGNORE INTO custom_classes (ad) VALUES (?)").bind(body.ad).run();
    return json({ applied: true });
  });

  router.delete("/api/milo/custom-classes/:ad", async (_request, env, params) => {
    await env.DB_MILO.prepare("DELETE FROM custom_classes WHERE ad = ?").bind(params.ad).run();
    return json({ applied: true });
  });
}
