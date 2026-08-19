import type { Router } from "../router";
import { json, badRequest, readJson } from "../lib/json";
import { broadcast } from "../lib/broadcast";

const LOCK_TTL_MS = 10_000;

interface LockRow {
  grup: string | null;
  ad: string | null;
  yapan: string | null;
  zaman: number | null;
}

export function registerLockRoutes(router: Router): void {
  router.get("/api/lock", async (_request, env) => {
    const row = await env.DB.prepare("SELECT grup, ad, yapan, zaman FROM edit_lock WHERE id = 1").first<LockRow>();
    if (row?.zaman && Date.now() - row.zaman > LOCK_TTL_MS) {
      return json({ lock: { grup: null, ad: null, yapan: null, zaman: null } });
    }
    return json({ lock: row });
  });

  router.post("/api/lock", async (request, env) => {
    const body = await readJson<{ grup: string; ad: string; deviceId: string }>(request);
    if (!body.grup || !body.ad || !body.deviceId) return badRequest("grup, ad, deviceId are required");

    const zaman = Date.now();
    await env.DB.prepare("UPDATE edit_lock SET grup = ?, ad = ?, yapan = ?, zaman = ? WHERE id = 1")
      .bind(body.grup, body.ad, body.deviceId, zaman)
      .run();

    await broadcast(env, {
      type: "lock-acquired",
      deviceId: body.deviceId,
      payload: { grup: body.grup, ad: body.ad, yapan: body.deviceId, zaman },
    });
    return json({ applied: true });
  });

  router.delete("/api/lock", async (request, env) => {
    const url = new URL(request.url);
    const deviceId = url.searchParams.get("deviceId");
    await env.DB.prepare("UPDATE edit_lock SET grup = NULL, ad = NULL, yapan = NULL, zaman = NULL WHERE id = 1").run();
    await broadcast(env, { type: "lock-released", deviceId, payload: {} });
    return json({ applied: true });
  });
}
