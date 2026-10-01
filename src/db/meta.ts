import type { Env } from "../env";

export async function getMeta(env: Env, key: string): Promise<string | null> {
  const row = await env.DB.prepare("SELECT value FROM meta WHERE key = ?").bind(key).first<{ value: string }>();
  return row?.value ?? null;
}

/** Değer + son yazılma zamanı (ms) — "12 saatten eski açık ders" gibi yaş kontrolleri için. */
export async function getMetaSatir(env: Env, key: string): Promise<{ value: string | null; guncelleme: number | null }> {
  const row = await env.DB.prepare("SELECT value, updated_at FROM meta WHERE key = ?").bind(key).first<{ value: string; updated_at: number | null }>();
  return { value: row?.value ?? null, guncelleme: row?.updated_at ?? null };
}

export async function getAllMeta(env: Env): Promise<Record<string, string>> {
  const { results } = await env.DB.prepare("SELECT key, value FROM meta").all<{ key: string; value: string }>();
  return Object.fromEntries(results.map((r) => [r.key, r.value]));
}

export async function setMeta(env: Env, key: string, value: string): Promise<void> {
  await env.DB.prepare(
    "INSERT INTO meta (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
  )
    .bind(key, value, Date.now())
    .run();
}

/** Only bumps forward — mirrors the client's *Uygula(t) guards (kumeMinSurumUygula, resetZamaniAyarla, sonGeriYuklemeKaydet). */
export async function bumpMetaIfNewer(env: Env, key: string, value: number): Promise<{ applied: boolean }> {
  const current = Number((await getMeta(env, key)) ?? 0);
  if (value <= current) return { applied: false };
  await setMeta(env, key, String(value));
  return { applied: true };
}
