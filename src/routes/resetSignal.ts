import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcast } from "../lib/broadcast";
import { bumpMetaIfNewer } from "../db/meta";

export function registerResetSignalRoutes(router: Router): void {
  router.post("/api/reset-signal", async (request, env) => {
    const body = await readJson<{ grup?: string; tip: "yeni_antrenman" | "sezon_bitis"; sezonAdi?: string; deviceId?: string }>(request);
    if (!body.tip) return badRequest("tip is required");

    const zaman = Date.now();
    if (body.tip === "sezon_bitis") {
      await bumpMetaIfNewer(env, "resetZamani", zaman);
    }

    await broadcast(env, {
      type: "reset-signal",
      deviceId: body.deviceId ?? null,
      payload: { grup: body.grup, zaman, tip: body.tip, sezonAdi: body.sezonAdi },
    });
    return json({ applied: true, zaman });
  });
}
