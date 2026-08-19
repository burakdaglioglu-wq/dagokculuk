import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcastMasterChanged } from "../lib/broadcast";
import * as bracketsDb from "../db/brackets";
import * as metaDb from "../db/meta";

export function registerBracketRoutes(router: Router): void {
  router.get("/api/brackets/:tip", async (request, env, params) => {
    const url = new URL(request.url);
    const lig = url.searchParams.get("lig") ?? undefined;
    const turParam = url.searchParams.get("tur");
    const matches = await bracketsDb.listBracketMatches(env, params.tip, lig, turParam ? Number(turParam) : undefined);
    return json({ matches });
  });

  router.put("/api/brackets/:tip", async (request, env, params) => {
    const body = await readJson<{ lig: string; tur: number; matches: unknown[]; deviceId?: string }>(request);
    if (!body.lig || typeof body.tur !== "number" || !Array.isArray(body.matches)) {
      return badRequest("lig, tur, matches are required");
    }
    await bracketsDb.replaceBracketRound(env, params.tip, body.lig, body.tur, body.matches);
    await broadcastMasterChanged(env, body.deviceId ?? null);
    return json({ applied: true });
  });

  router.get("/api/bracket-state", async (_request, env) => {
    const meta = await metaDb.getAllMeta(env);
    return json({ aktifTur: Number(meta.aktifTur ?? 1), aktifTakimTur: Number(meta.aktifTakimTur ?? 1) });
  });

  router.put("/api/bracket-state", async (request, env) => {
    const body = await readJson<{ aktifTur?: number; aktifTakimTur?: number; deviceId?: string }>(request);
    if (typeof body.aktifTur === "number") await metaDb.setMeta(env, "aktifTur", String(body.aktifTur));
    if (typeof body.aktifTakimTur === "number") await metaDb.setMeta(env, "aktifTakimTur", String(body.aktifTakimTur));
    await broadcastMasterChanged(env, body.deviceId ?? null);
    return json({ applied: true });
  });
}
