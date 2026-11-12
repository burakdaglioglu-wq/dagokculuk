import type { ClubSync } from "./durable-objects/ClubSync";

export interface Env {
  DB: D1Database;
  DB_MILO: D1Database;
  CLUB_SYNC: DurableObjectNamespace<ClubSync>;
  ASSETS: Fetcher;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  ANTHROPIC_API_KEY?: string; // kayıt formu okuma; yoksa /api/form-oku 503 döner, kalan her şey çalışır
  IG_APP_ID?: string; // Meta uygulaması "DAG SK Panel" (gizli değil)
  IG_CONFIG_ID?: string; // Facebook Login for Business yapılandırması (gizli değil)
  IG_APP_SECRET?: string; // wrangler secret — yoksa /api/instagram/baslat 503
}
