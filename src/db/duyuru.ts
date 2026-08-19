import type { Env } from "../env";

export interface DuyuruRow {
  id: number;
  baslik: string;
  mesaj: string;
  hedefGrup: string | null;
  gonderen: string | null;
  t: number;
}

export async function createDuyuru(env: Env, row: Omit<DuyuruRow, "id">): Promise<number> {
  const res = await env.DB.prepare(`INSERT INTO duyurular (baslik, mesaj, hedefGrup, gonderen, t) VALUES (?, ?, ?, ?, ?)`)
    .bind(row.baslik, row.mesaj, row.hedefGrup, row.gonderen, row.t)
    .run();
  return res.meta.last_row_id as number;
}

export async function listRecentDuyurular(env: Env, limit = 20): Promise<DuyuruRow[]> {
  const rows = await env.DB.prepare(`SELECT * FROM duyurular ORDER BY t DESC LIMIT ?`).bind(limit).all<DuyuruRow>();
  return rows.results;
}
