import { buildPushPayload } from "@block65/webcrypto-web-push";
import type { Env } from "../env";
import { listSubscriptionsFor, listSubscriptionsForGroup, removeSubscription, type PushSubscriptionRow } from "../db/push";

export interface PushNotificationData {
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: { action: string; title: string }[];
}

async function sendToSubscriptions(env: Env, subs: PushSubscriptionRow[], data: PushNotificationData): Promise<void> {
  if (!subs.length) return;

  const vapid = {
    subject: env.VAPID_SUBJECT,
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
  };

  await Promise.all(
    subs.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        expirationTime: null,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        const payload = await buildPushPayload({ data: data as never, options: { urgency: "high", ttl: 60 } }, subscription, vapid);
        const res = await fetch(sub.endpoint, { method: "POST", headers: payload.headers, body: payload.body as BodyInit });
        if (res.status === 404 || res.status === 410) {
          await removeSubscription(env, sub.endpoint);
        }
      } catch {
        // push service unreachable — sessizce geç, in-app WS bildirimi zaten devrede
      }
    })
  );
}

/** Belirli bir sporcunun kayıtlı tüm cihazlarına Web Push bildirimi gönderir. Ölmüş (404/410) abonelikler otomatik silinir. */
export async function sendPushToAthlete(env: Env, grup: string, ad: string, data: PushNotificationData): Promise<void> {
  const subs = await listSubscriptionsFor(env, grup, ad);
  await sendToSubscriptions(env, subs, data);
}

/** Bir gruptaki (yaş kategorisi) push aboneliği olan TÜM sporculara bildirim gönderir — antrenman hatırlatması gibi grup-geneli duyurular için. */
export async function sendPushToGroup(env: Env, grup: string, data: PushNotificationData): Promise<void> {
  const subs = await listSubscriptionsForGroup(env, grup);
  await sendToSubscriptions(env, subs, data);
}

const TUM_GRUPLAR = ["buyukler", "yildizlar", "kucukler", "minikler"] as const;

/** Kulüp genelinde (dört yaş kategorisinin tamamı) push aboneliği olan herkese bildirim gönderir — toplu duyuru için. */
export async function sendPushToAll(env: Env, data: PushNotificationData): Promise<void> {
  await Promise.all(TUM_GRUPLAR.map((grup) => sendPushToGroup(env, grup, data)));
}
