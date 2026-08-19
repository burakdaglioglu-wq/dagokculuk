import type { Env } from "../env";

export interface AthleteKey {
  grup: string;
  ad: string;
}

/**
 * A write against an athlete that was since moved to another category gets
 * redirected here instead of resurrecting a duplicate under the old key.
 * Follows the redirect chain (capped) in case an athlete was moved more than once.
 */
export async function resolveAthleteRedirect(env: Env, key: AthleteKey): Promise<AthleteKey> {
  let current = key;
  for (let hop = 0; hop < 10; hop++) {
    const row = await env.DB.prepare(
      "SELECT yeni_grup, yeni_ad FROM athlete_moves WHERE eski_grup = ? AND eski_ad = ?"
    )
      .bind(current.grup, current.ad)
      .first<{ yeni_grup: string; yeni_ad: string }>();
    if (!row) return current;
    current = { grup: row.yeni_grup, ad: row.yeni_ad };
  }
  return current;
}
