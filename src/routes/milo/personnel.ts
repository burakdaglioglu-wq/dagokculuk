import type { Router } from "../../router";
import { json, badRequest, readJson } from "../../lib/json";

interface MiloPersonnelRow {
  id: string;
  ad: string;
  ucret: string | null;
}

/** MILO FITT KIDS personel — okculuktaki personnel.ts ile ayni sekil, ayri DB_MILO'da. */
export function registerMiloPersonnelRoutes(router: Router): void {
  router.get("/api/milo/personnel", async (_request, env) => {
    const { results } = await env.DB_MILO.prepare("SELECT * FROM personnel").all<MiloPersonnelRow>();
    return json({ personnel: results });
  });

  router.post("/api/milo/personnel", async (request, env) => {
    const body = await readJson<MiloPersonnelRow>(request);
    if (!body.id || !body.ad) return badRequest("id and ad are required");
    await env.DB_MILO.prepare(
      "INSERT INTO personnel (id, ad, ucret) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET ad = excluded.ad, ucret = excluded.ucret"
    )
      .bind(body.id, body.ad, body.ucret ?? null)
      .run();
    return json({ applied: true });
  });

  const MILO_PERSONNEL_UPDATABLE_FIELDS = ["ad", "ucret"] as const;

  router.patch("/api/milo/personnel/:id", async (request, env, params) => {
    const body = await readJson<Partial<MiloPersonnelRow>>(request);
    const columns = Object.keys(body);
    if (!columns.length) return badRequest("no fields to update");
    const invalid = columns.filter((c) => !(MILO_PERSONNEL_UPDATABLE_FIELDS as readonly string[]).includes(c));
    if (invalid.length > 0) return badRequest(`invalid field(s): ${invalid.join(", ")}`);
    const setClause = columns.map((c) => `${c} = ?`).join(", ");
    const values = columns.map((c) => (body as Record<string, unknown>)[c]);
    await env.DB_MILO.prepare(`UPDATE personnel SET ${setClause} WHERE id = ?`)
      .bind(...values, params.id)
      .run();
    return json({ applied: true });
  });

  router.delete("/api/milo/personnel/:id", async (_request, env, params) => {
    await env.DB_MILO.prepare("DELETE FROM personnel WHERE id = ?").bind(params.id).run();
    return json({ applied: true });
  });
}
