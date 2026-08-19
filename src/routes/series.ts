import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcast } from "../lib/broadcast";
import * as seriesDb from "../db/series";

export function registerSeriesRoutes(router: Router): void {
  router.get("/api/series", async (request, env) => {
    const url = new URL(request.url);
    const series = await seriesDb.listSeries(env, {
      grup: url.searchParams.get("grup") ?? undefined,
      ad: url.searchParams.get("ad") ?? undefined,
      tarih: url.searchParams.get("tarih") ?? undefined,
      since: url.searchParams.has("since") ? Number(url.searchParams.get("since")) : undefined,
      includeIptal: url.searchParams.get("includeIptal") === "1",
    });
    return json({ series });
  });

  router.post("/api/series", async (request, env) => {
    const body = await readJson<{
      seriId: string;
      grup: string;
      ad: string;
      oklar: string[];
      puan: number;
      tarih: string;
      cihazId?: string | null;
      t?: number;
      okAraliklari?: number[] | null;
    }>(request);
    if (!body.seriId || !body.grup || !body.ad || !Array.isArray(body.oklar)) {
      return badRequest("seriId, grup, ad, oklar are required");
    }

    const t = body.t ?? Date.now();
    const result = await seriesDb.createSeries(env, {
      seriId: body.seriId,
      grup: body.grup,
      ad: body.ad,
      oklar: body.oklar,
      puan: body.puan ?? 0,
      tarih: body.tarih,
      cihazId: body.cihazId ?? null,
      t,
      okAraliklari: body.okAraliklari ?? null,
    });

    if (result.applied) {
      await broadcast(env, {
        type: "series-added",
        deviceId: body.cihazId ?? null,
        payload: { seriId: body.seriId, grup: result.athlete.grup, ad: result.athlete.ad, oklar: body.oklar, puan: body.puan ?? 0, tarih: body.tarih, t },
      });
    }
    return json({ applied: result.applied });
  });

  router.patch("/api/series/:seriId", async (request, env, params) => {
    const body = await readJson<{ oklar: string[]; puan: number; deviceId?: string }>(request);
    if (!Array.isArray(body.oklar)) return badRequest("oklar is required");

    const result = await seriesDb.updateSeries(env, params.seriId, body.oklar, body.puan ?? 0);
    if (result.applied) {
      await broadcast(env, {
        type: "series-updated",
        deviceId: body.deviceId ?? null,
        payload: { seriId: params.seriId, oklar: body.oklar, puan: body.puan ?? 0 },
      });
    }
    return json(result);
  });

  router.delete("/api/series/:seriId", async (request, env, params) => {
    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");
    const result = await seriesDb.cancelSeries(env, [params.seriId]);
    await broadcast(env, { type: "series-cancelled", deviceId, payload: { seriIds: [params.seriId] } });
    return json(result);
  });

  router.post("/api/series/cancel-batch", async (request, env) => {
    const body = await readJson<{ seriIds: string[]; deviceId?: string }>(request);
    if (!Array.isArray(body.seriIds)) return badRequest("seriIds is required");

    const result = await seriesDb.cancelSeries(env, body.seriIds);
    await broadcast(env, { type: "series-cancelled", deviceId: body.deviceId ?? null, payload: { seriIds: body.seriIds } });
    return json(result);
  });
}
