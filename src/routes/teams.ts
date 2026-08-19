import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcastMasterChanged } from "../lib/broadcast";
import * as teamsDb from "../db/teams";

export function registerTeamRoutes(router: Router): void {
  router.get("/api/teams", async (request, env) => {
    const lig = new URL(request.url).searchParams.get("lig") ?? undefined;
    return json({ teams: await teamsDb.listTeams(env, lig) });
  });

  router.post("/api/teams", async (request, env) => {
    const body = await readJson<Omit<teamsDb.TeamRow, "id" | "lastModified"> & { deviceId?: string }>(request);
    if (!body.lig || !body.ad) return badRequest("lig and ad are required");
    const { deviceId, ...team } = body;
    const id = await teamsDb.createTeam(env, { ...team, lastModified: Date.now() });
    await broadcastMasterChanged(env, deviceId ?? null);
    return json({ id });
  });

  router.patch("/api/teams/:id", async (request, env, params) => {
    const body = await readJson<Partial<teamsDb.TeamRow> & { deviceId?: string }>(request);
    const { deviceId, ...fields } = body;
    const invalid = Object.keys(fields).filter((c) => !(teamsDb.TEAM_UPDATABLE_FIELDS as readonly string[]).includes(c));
    if (invalid.length > 0) return badRequest(`invalid field(s): ${invalid.join(", ")}`);
    const result = await teamsDb.updateTeam(env, Number(params.id), { ...fields, lastModified: Date.now() });
    await broadcastMasterChanged(env, deviceId ?? null);
    return json(result);
  });

  router.delete("/api/teams/:id", async (request, env, params) => {
    const url = new URL(request.url);
    const result = await teamsDb.deleteTeam(env, Number(params.id));
    await broadcastMasterChanged(env, url.searchParams.get("deviceId"));
    return json(result);
  });
}
