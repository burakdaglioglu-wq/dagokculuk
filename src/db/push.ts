import type { Env } from "../env";

export interface PushSubscriptionRow {
  endpoint: string;
  grup: string;
  ad: string;
  p256dh: string;
  auth: string;
  createdAt: number;
}

export async function saveSubscription(env: Env, row: PushSubscriptionRow): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO push_subscriptions (endpoint, grup, ad, p256dh, auth, createdAt) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET grup = excluded.grup, ad = excluded.ad, p256dh = excluded.p256dh, auth = excluded.auth`
  )
    .bind(row.endpoint, row.grup, row.ad, row.p256dh, row.auth, row.createdAt)
    .run();
}

export async function removeSubscription(env: Env, endpoint: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM push_subscriptions WHERE endpoint = ?`).bind(endpoint).run();
}

export async function listSubscriptionsFor(env: Env, grup: string, ad: string): Promise<PushSubscriptionRow[]> {
  const rows = await env.DB.prepare(`SELECT * FROM push_subscriptions WHERE grup = ? AND ad = ?`).bind(grup, ad).all<PushSubscriptionRow>();
  return rows.results;
}

export async function listSubscriptionsForGroup(env: Env, grup: string): Promise<PushSubscriptionRow[]> {
  const rows = await env.DB.prepare(`SELECT * FROM push_subscriptions WHERE grup = ?`).bind(grup).all<PushSubscriptionRow>();
  return rows.results;
}
