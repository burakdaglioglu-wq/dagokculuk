import type { Env } from "../env";

export interface GiderRow {
  id: string;
  tarih: string;
  kategori: string;
  aciklama: string | null;
  tutar: number;
  giren: string | null;
  t: number;
}

export async function listGiderler(env: Env, ay?: string): Promise<GiderRow[]> {
  const stmt = ay
    ? env.DB.prepare("SELECT * FROM gider WHERE tarih LIKE ? ORDER BY tarih DESC").bind(ay + "%")
    : env.DB.prepare("SELECT * FROM gider ORDER BY tarih DESC");
  const { results } = await stmt.all<GiderRow>();
  return results;
}

export async function createGider(env: Env, row: GiderRow): Promise<void> {
  await env.DB.prepare("INSERT INTO gider (id, tarih, kategori, aciklama, tutar, giren, t) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(row.id, row.tarih, row.kategori, row.aciklama, row.tutar, row.giren, row.t)
    .run();
}

export async function deleteGider(env: Env, id: string): Promise<void> {
  await env.DB.prepare("DELETE FROM gider WHERE id = ?").bind(id).run();
}
