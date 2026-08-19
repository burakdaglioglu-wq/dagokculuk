import type { Router } from "../router";
import { json, badRequest } from "../lib/json";
import { readJson } from "../lib/json";
import { saveSubscription, removeSubscription } from "../db/push";

export function registerPushRoutes(router: Router): void {
  router.get("/api/push/public-key", async (_request, env) => {
    return json({ publicKey: env.VAPID_PUBLIC_KEY });
  });

  router.post("/api/push/subscribe", async (request, env) => {
    const body = await readJson<{ grup: string; ad: string; subscription: { endpoint: string; keys: { p256dh: string; auth: string } } }>(request);
    if (!body.grup || !body.ad || !body.subscription?.endpoint) return badRequest("grup, ad and subscription are required");

    await saveSubscription(env, {
      endpoint: body.subscription.endpoint,
      grup: body.grup,
      ad: body.ad,
      p256dh: body.subscription.keys.p256dh,
      auth: body.subscription.keys.auth,
      createdAt: Date.now(),
    });
    return json({ applied: true });
  });

  router.post("/api/push/unsubscribe", async (request, env) => {
    const body = await readJson<{ endpoint: string }>(request);
    if (!body.endpoint) return badRequest("endpoint is required");
    await removeSubscription(env, body.endpoint);
    return json({ applied: true });
  });
}
