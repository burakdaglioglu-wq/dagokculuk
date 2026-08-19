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
  router.get("/api/milo/credentials", async (_request, env) => {
    const row = await env.DB_MILO.prepare("SELECT yonetici_hash, egitmen_hash, aidat_hash, degisim FROM credentials WHERE id = 1").first<MiloCredentialsRow>();
    return json({ credentials: row });
  });

  router.put("/api/milo/credentials", async (request, env) => {
    const body = await readJson<{ yoneticiHash: string; egitmenHash: string; aidatHash?: string | null; degisim: number }>(request);
    if (!body.yoneticiHash || !body.egitmenHash) return badRequest("yoneticiHash and egitmenHash are required");

    const current = await env.DB_MILO.prepare("SELECT degisim FROM credentials WHERE id = 1").first<{ degisim: number }>();
    if (current && body.degisim <= current.degisim) return json({ applied: false }, { status: 409 });

    await env.DB_MILO.prepare("UPDATE credentials SET yonetici_hash = ?, egitmen_hash = ?, aidat_hash = ?, degisim = ? WHERE id = 1")
      .bind(body.yoneticiHash, body.egitmenHash, body.aidatHash ?? null, body.degisim)
      .run();
    return json({ applied: true });
  });

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
