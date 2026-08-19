import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcastMasterChanged } from "../lib/broadcast";

interface PersonnelRow {
  id: string;
  ad: string;
  ucret: string | null;
}

export function registerPersonnelRoutes(router: Router): void {
  router.get("/api/personnel", async (_request, env) => {
    const { results } = await env.DB.prepare("SELECT * FROM personnel").all<PersonnelRow>();
    return json({ personnel: results });
  });

  // DÜZELTME: fanOutMasterPayload her personel kaydı için ayrı ayrı buraya postalıyordu, her biri bir
  // Durable Object broadcast isteğiydi — ücretsiz DO kotası aşımına katkısı vardı. Kaldırıldı.
  router.post("/api/personnel", async (request, env) => {
    const body = await readJson<PersonnelRow & { deviceId?: string }>(request);
    if (!body.id || !body.ad) return badRequest("id and ad are required");
    await env.DB.prepare(
      "INSERT INTO personnel (id, ad, ucret) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET ad = excluded.ad, ucret = excluded.ucret"
    )
      .bind(body.id, body.ad, body.ucret ?? null)
      .run();
    return json({ applied: true });
  });

  const PERSONNEL_UPDATABLE_FIELDS = ["ad", "ucret"] as const;

  router.patch("/api/personnel/:id", async (request, env, params) => {
    const body = await readJson<Partial<PersonnelRow> & { deviceId?: string }>(request);
    const { deviceId, ...fields } = body;
    const columns = Object.keys(fields);
    if (columns.length === 0) return badRequest("no fields to update");
    const invalid = columns.filter((c) => !(PERSONNEL_UPDATABLE_FIELDS as readonly string[]).includes(c));
    if (invalid.length > 0) return badRequest(`invalid field(s): ${invalid.join(", ")}`);
    const setClause = columns.map((c) => `${c} = ?`).join(", ");
    const values = columns.map((c) => (fields as Record<string, unknown>)[c]);
    await env.DB.prepare(`UPDATE personnel SET ${setClause} WHERE id = ?`)
      .bind(...values, params.id)
      .run();
    await broadcastMasterChanged(env, deviceId ?? null);
    return json({ applied: true });
  });

  router.delete("/api/personnel/:id", async (request, env, params) => {
    const url = new URL(request.url);
    await env.DB.prepare("DELETE FROM personnel WHERE id = ?").bind(params.id).run();
    await broadcastMasterChanged(env, url.searchParams.get("deviceId"));
    return json({ applied: true });
  });
}
