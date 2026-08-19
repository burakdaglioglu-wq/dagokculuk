import type { Env } from "../env";

export interface IhtiyacRow {
  id: number;
  ad: string;
  grup: string | null;
  kategori: string;
  aciklama: string;
  durum: string;
  t: number;
}

export async function createTalep(env: Env, row: Omit<IhtiyacRow, "id" | "durum">): Promise<number> {
  const res = await env.DB.prepare(`INSERT INTO ihtiyac_talepleri (ad, grup, kategori, aciklama, durum, t) VALUES (?, ?, ?, ?, 'yeni', ?)`)
    .bind(row.ad, row.grup, row.kategori, row.aciklama, row.t)
    .run();
  return res.meta.last_row_id as number;
}

export async function listRecentTalepler(env: Env, limit = 50): Promise<IhtiyacRow[]> {
  const rows = await env.DB.prepare(`SELECT * FROM ihtiyac_talepleri ORDER BY t DESC LIMIT ?`).bind(limit).all<IhtiyacRow>();
  return rows.results;
}

export async function updateDurum(env: Env, id: number, durum: string): Promise<boolean> {
  const res = await env.DB.prepare(`UPDATE ihtiyac_talepleri SET durum = ? WHERE id = ?`).bind(durum, id).run();
  return (res.meta.changes ?? 0) > 0;
}
