import type { Env } from "../env";

export interface TeknikAnalizListItem {
  id: string;
  grup: string;
  ad: string;
  yay: string;
  tarih: string;
  skor: number | null;
  lastModified: number;
}

export interface TeknikAnalizFull extends TeknikAnalizListItem {
  fazlarJson: string;
  olusturan: string | null;
}

// Liste görünümü fotoğrafları (fazlar_json) HİÇ okumaz — geçmiş analiz sayısı arttıkça D1 okuma
// hacmini büyütmemek için (2026-09-20'de free-tier günlük okuma limiti bir kez dolmuştu, bkz. DEVIR.md
// §41). Fotoğraflı tam kayıt sadece tek bir analiz açılırken (getTeknikAnaliz) çekilir.
export async function listTeknikAnaliz(env: Env, grup: string, ad: string, limit = 12): Promise<TeknikAnalizListItem[]> {
  const rows = await env.DB.prepare(
    `SELECT id, grup, ad, yay, tarih, skor, lastModified FROM teknik_analiz WHERE grup = ? AND ad = ? ORDER BY lastModified DESC LIMIT ?`
  ).bind(grup, ad, limit).all<TeknikAnalizListItem>();
  return rows.results;
}

export async function getTeknikAnaliz(env: Env, id: string): Promise<TeknikAnalizFull | null> {
  const row = await env.DB.prepare(
    `SELECT id, grup, ad, yay, tarih, skor, fazlar_json AS fazlarJson, olusturan, lastModified FROM teknik_analiz WHERE id = ?`
  ).bind(id).first<TeknikAnalizFull>();
  return row ?? null;
}

export async function createTeknikAnaliz(
  env: Env,
  row: { id: string; grup: string; ad: string; yay: string; tarih: string; skor: number | null; fazlarJson: string; olusturan: string | null; t: number }
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO teknik_analiz (id, grup, ad, yay, tarih, skor, fazlar_json, olusturan, lastModified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(row.id, row.grup, row.ad, row.yay, row.tarih, row.skor, row.fazlarJson, row.olusturan, row.t).run();
}

export async function deleteTeknikAnaliz(env: Env, id: string): Promise<boolean> {
  const res = await env.DB.prepare(`DELETE FROM teknik_analiz WHERE id = ?`).bind(id).run();
  return (res.meta.changes ?? 0) > 0;
}
