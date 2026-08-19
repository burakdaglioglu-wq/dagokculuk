import type { Env } from "./env";

// Yazma isteklerinin gerçekten bir PIN sahibi tarafından yapıldığını doğrular. İstemci, mevcut
// yönetici/eğitmen PIN'inin (SHA-256) özetini "X-Dagsk-Auth" başlığında gönderir — sunucu bunu
// credentials tablosundaki güncel özetlerle karşılaştırır. Öncesinde HİÇBİR yazma isteği sunucu
// tarafında doğrulanmıyordu (PIN sadece ekran kilidiydi, API'nin kendisi açıktı).
interface CredentialsHashRow {
  yonetici_hash: string;
  egitmen_hash: string;
  aidat_hash: string | null;
}

export async function isAuthorized(request: Request, env: Env, milo: boolean): Promise<boolean> {
  const hash = request.headers.get("x-dagsk-auth");
  if (!hash) return false;
  const db = milo ? env.DB_MILO : env.DB;
  const row = await db.prepare("SELECT yonetici_hash, egitmen_hash, aidat_hash FROM credentials WHERE id = 1").first<CredentialsHashRow>();
  if (!row) return false;
  return hash === row.yonetici_hash || hash === row.egitmen_hash || (!!row.aidat_hash && hash === row.aidat_hash);
}
