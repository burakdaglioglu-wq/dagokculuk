import type { ClubSync } from "./durable-objects/ClubSync";

export interface Env {
  DB: D1Database;
  DB_MILO: D1Database;
  CLUB_SYNC: DurableObjectNamespace<ClubSync>;
  ASSETS: Fetcher;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
}
