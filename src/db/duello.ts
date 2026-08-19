import type { Env } from "../env";

export interface DuelloDavetRow {
  duelId: string;
  davetciAd: string;
  davetciGrup: string;
  rakipAd: string;
  rakipGrup: string;
  seriSayisi: number;
  okSayisi: number;
  sureAktif: number; // D1'de 0/1 olarak saklanır
  sureSaniye: number;
  durum: "bekliyor" | "kabul" | "red" | "iptal";
  olusturulma: number;
  guncelleme: number;
}

export async function createInvite(env: Env, row: Omit<DuelloDavetRow, "durum" | "guncelleme">): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO duello_davetler (duelId, davetciAd, davetciGrup, rakipAd, rakipGrup, seriSayisi, okSayisi, sureAktif, sureSaniye, durum, olusturulma, guncelleme)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'bekliyor', ?, ?)`
  )
    .bind(row.duelId, row.davetciAd, row.davetciGrup, row.rakipAd, row.rakipGrup, row.seriSayisi, row.okSayisi, row.sureAktif, row.sureSaniye, row.olusturulma, row.olusturulma)
    .run();
}

export async function updateInviteStatus(env: Env, duelId: string, durum: "kabul" | "red" | "iptal"): Promise<void> {
  await env.DB.prepare(`UPDATE duello_davetler SET durum = ?, guncelleme = ? WHERE duelId = ?`).bind(durum, Date.now(), duelId).run();
}

/** Belirli bir sporcuya gelen, hâlâ cevaplanmamış davetler (belirtilen süreden daha yeni olanlar). */
export async function listPendingFor(env: Env, grup: string, ad: string, sinceMs: number): Promise<DuelloDavetRow[]> {
  const rows = await env.DB.prepare(
    `SELECT * FROM duello_davetler WHERE rakipGrup = ? AND rakipAd = ? AND durum = 'bekliyor' AND olusturulma > ? ORDER BY olusturulma DESC`
  )
    .bind(grup, ad, sinceMs)
    .all<DuelloDavetRow>();
  return rows.results;
}

/** Bir sporcunun gönderdiği, hâlâ açık olan (veya yakın zamanda cevaplanmış) davetler — bekleme ekranındaki cihaz WS mesajını kaçırdıysa buradan yakalar. */
export async function listSentBy(env: Env, grup: string, ad: string, sinceMs: number): Promise<DuelloDavetRow[]> {
  const rows = await env.DB.prepare(
    `SELECT * FROM duello_davetler WHERE davetciGrup = ? AND davetciAd = ? AND olusturulma > ? ORDER BY olusturulma DESC`
  )
    .bind(grup, ad, sinceMs)
    .all<DuelloDavetRow>();
  return rows.results;
}
