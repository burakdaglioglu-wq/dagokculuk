import type { Router } from "../router";
import { json, badRequest } from "../lib/json";
import { readJson } from "../lib/json";
import { saveSubscription, removeSubscription } from "../db/push";
import { sendPushToGroup } from "../lib/push";
import { turkiyeSaatBilgisi } from "../lib/reminders";
import { YONETICI_GRUP, ozetBildirim, yoneticiAboneSayisi } from "../lib/aidatYonetici";

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

  // Aidat paneli › 🔔 "Deneme bildirimi": abone yönetici telefonlarına bugünkü özeti hemen yollar (oturum ister; açık yollar listesinde değil)
  router.post("/api/push/yonetici-deneme", async (_request, env) => {
    const cihaz = await yoneticiAboneSayisi(env);
    if (cihaz) {
      const su = turkiyeSaatBilgisi(new Date());
      await sendPushToGroup(env, YONETICI_GRUP, await ozetBildirim(env, su.tarih.slice(0, 7), Number(su.tarih.split("-")[2]), true));
    }
    return json({ cihaz });
  });

  router.post("/api/push/unsubscribe", async (request, env) => {
    const body = await readJson<{ endpoint: string }>(request);
    if (!body.endpoint) return badRequest("endpoint is required");
    await removeSubscription(env, body.endpoint);
    return json({ applied: true });
  });
}
