import type { Env } from "../env";
import { resolveAthleteRedirect } from "./moves";
import type { AthleteRow } from "./athletes";

// "Çift Kayıt Birleştir" (2026-09-20) — aynı kişi iki kez kayıtlıysa (ör. "Test Elif" / "TEST ELİF")
// kaynak kaydın TÜM çocuk satırları (seriler, aidat, yoklama, atış günlüğü, ders katılımcıları) hedefe
// taşınır, hedefin BOŞ skaler alanları kaynaktan doldurulur, JSON listeleri birleştirilir; kaynak
// satırı silinir ve moveAthlete ile AYNI tombstone + yönlendirme yazılır — böylece başka bir cihazdan
// eski anahtara gelen gecikmiş bir yazma, kopyayı diriltmek yerine hedefe akar.
export async function mergeAthlete(
  env: Env,
  fromGrup: string,
  fromAd: string,
  toGrup: string,
  toAd: string,
  zaman: number
): Promise<{ applied: boolean; reason?: string; moved?: Record<string, number> }> {
  const source = await resolveAthleteRedirect(env, { grup: fromGrup, ad: fromAd });
  const target = await resolveAthleteRedirect(env, { grup: toGrup, ad: toAd });
  if (source.grup === target.grup && source.ad === target.ad) return { applied: false, reason: "same-athlete" };
  const srcRow = await env.DB.prepare("SELECT * FROM athletes WHERE grup = ? AND ad = ?").bind(source.grup, source.ad).first<AthleteRow>();
  const dstRow = await env.DB.prepare("SELECT * FROM athletes WHERE grup = ? AND ad = ?").bind(target.grup, target.ad).first<AthleteRow>();
  if (!srcRow) return { applied: false, reason: "source-missing" };
  if (!dstRow) return { applied: false, reason: "target-missing" };

  const say = async (sql: string, ...args: unknown[]) => {
    const r = await env.DB.prepare(sql).bind(...args).first<{ n: number }>();
    return r?.n ?? 0;
  };
  const moved = {
    seri: await say("SELECT COUNT(*) AS n FROM series WHERE grup = ? AND ad = ?", source.grup, source.ad),
    aidat: await say("SELECT COUNT(*) AS n FROM dues WHERE ad = ?", source.ad),
    yoklama: await say("SELECT COUNT(*) AS n FROM attendance_auto WHERE ad = ?", source.ad),
  };

  // JSON listeleri birleştir; skaler alanlarda hedef doluysa hedef kalır, boşsa kaynak gelir.
  const arr = (s: string | null | undefined): unknown[] => {
    try { const v = JSON.parse(s || "[]"); return Array.isArray(v) ? v : []; } catch { return []; }
  };
  const dedupe = (a: unknown[]) => {
    const seen = new Set<string>();
    return a.filter((x) => { const k = JSON.stringify(x); if (seen.has(k)) return false; seen.add(k); return true; });
  };
  const detayliOklar = dedupe(arr(dstRow.detayliOklar_json).concat(arr(srcRow.detayliOklar_json)));
  const kartGecmisi = dedupe(arr(dstRow.kartGecmisi_json).concat(arr(srcRow.kartGecmisi_json)));
  const gecmisSezonlar = dedupe(arr(dstRow.gecmisSezonlar_json).concat(arr(srcRow.gecmisSezonlar_json)));
  const biyomotor = dedupe(arr(dstRow.biyomotorTestleri_json).concat(arr(srcRow.biyomotorTestleri_json)));
  const dolu = (v: unknown) => v !== null && v !== undefined && v !== "" && v !== 0;
  const sec = <T,>(d: T, s: T): T => (dolu(d) ? d : s);
  const coin = (dstRow.coin || 0) + (srcRow.coin || 0);
  const xAdet = (dstRow.xAdet || 0) + (srcRow.xAdet || 0);
  const toplamSkor = (dstRow.toplamSkor || 0) + (srcRow.toplamSkor || 0);
  const sonSkorZamani = Math.max(dstRow.sonSkorZamani || 0, srcRow.sonSkorZamani || 0) || null;

  await env.DB.batch([
    // çocuk satırlar: PK çakışmayanlar taşınır, çakışanlarda hedefinki kalır
    env.DB.prepare("UPDATE series SET grup = ?, ad = ? WHERE grup = ? AND ad = ?").bind(target.grup, target.ad, source.grup, source.ad),
    env.DB.prepare("UPDATE shot_log SET grup = ?, ad = ? WHERE ad = ?").bind(target.grup, target.ad, source.ad),
    env.DB.prepare("INSERT OR IGNORE INTO dues (ad, ay, odendi, tutar, tarih) SELECT ?, ay, odendi, tutar, tarih FROM dues WHERE ad = ?").bind(target.ad, source.ad),
    env.DB.prepare(
      `UPDATE dues SET odendi = 1,
         tutar = (SELECT s.tutar FROM dues s WHERE s.ad = ?1 AND s.ay = dues.ay),
         tarih = (SELECT s.tarih FROM dues s WHERE s.ad = ?1 AND s.ay = dues.ay)
       WHERE ad = ?2 AND odendi = 0 AND ay IN (SELECT ay FROM dues WHERE ad = ?1 AND odendi = 1)`
    ).bind(source.ad, target.ad),
    env.DB.prepare("DELETE FROM dues WHERE ad = ?").bind(source.ad),
    env.DB.prepare("INSERT OR IGNORE INTO aidat_hatirlatma_log (ad, ay, t) SELECT ?, ay, t FROM aidat_hatirlatma_log WHERE ad = ?").bind(target.ad, source.ad),
    env.DB.prepare("DELETE FROM aidat_hatirlatma_log WHERE ad = ?").bind(source.ad),
    env.DB.prepare("INSERT OR IGNORE INTO attendance_auto (tarih, ad, grup, saat) SELECT tarih, ?, ?, saat FROM attendance_auto WHERE ad = ?").bind(target.ad, target.grup, source.ad),
    env.DB.prepare("DELETE FROM attendance_auto WHERE ad = ?").bind(source.ad),
    env.DB.prepare("INSERT OR IGNORE INTO attendance_auto_archive (tarih, ad, grup, saat, elle, geldi) SELECT tarih, ?, ?, saat, elle, geldi FROM attendance_auto_archive WHERE ad = ?").bind(target.ad, target.grup, source.ad),
    env.DB.prepare("DELETE FROM attendance_auto_archive WHERE ad = ?").bind(source.ad),
    env.DB.prepare("INSERT OR IGNORE INTO antrenman_programi_katilimci (slotId, grup, ad, eklenme) SELECT slotId, ?, ?, eklenme FROM antrenman_programi_katilimci WHERE grup = ? AND ad = ?").bind(target.grup, target.ad, source.grup, source.ad),
    env.DB.prepare("DELETE FROM antrenman_programi_katilimci WHERE grup = ? AND ad = ?").bind(source.grup, source.ad),
    // hedef satırı: birleşik alanlar
    env.DB.prepare(
      `UPDATE athletes SET kod = ?, dogumYili = ?, sinif = ?, yay = ?, cinsiyet = ?, toplamSkor = ?, xAdet = ?, sonSkorZamani = ?, coin = ?,
         kartGecmisi_json = ?, gecmisSezonlar_json = ?, detayliOklar_json = ?, biyomotorTestleri_json = ?,
         acilKisi = ?, acilTelefon = ?, antrenmanNotu = ?, genelNot = ?, dogumTarihi = ?, katilmaTarihi = ?, aileMeslek = ?,
         saglikRaporuBitis = ?, lisansBitis = ?, fotoUrl = ?, lastModified = ?
       WHERE grup = ? AND ad = ?`
    ).bind(
      sec(dstRow.kod, srcRow.kod), sec(dstRow.dogumYili, srcRow.dogumYili), sec(dstRow.sinif, srcRow.sinif), sec(dstRow.yay, srcRow.yay), sec(dstRow.cinsiyet, srcRow.cinsiyet),
      toplamSkor, xAdet, sonSkorZamani, coin,
      JSON.stringify(kartGecmisi), JSON.stringify(gecmisSezonlar), JSON.stringify(detayliOklar), JSON.stringify(biyomotor),
      sec(dstRow.acilKisi, srcRow.acilKisi), sec(dstRow.acilTelefon, srcRow.acilTelefon), sec(dstRow.antrenmanNotu, srcRow.antrenmanNotu), sec(dstRow.genelNot, srcRow.genelNot),
      sec(dstRow.dogumTarihi, srcRow.dogumTarihi), sec(dstRow.katilmaTarihi, srcRow.katilmaTarihi), sec(dstRow.aileMeslek, srcRow.aileMeslek),
      sec(dstRow.saglikRaporuBitis, srcRow.saglikRaporuBitis), sec(dstRow.lisansBitis, srcRow.lisansBitis), sec(dstRow.fotoUrl, srcRow.fotoUrl), zaman,
      target.grup, target.ad
    ),
    // kaynak: sil + tombstone (tasindi=1, Silinenler listesinde görünmez) + yönlendirme
    env.DB.prepare("DELETE FROM athletes WHERE grup = ? AND ad = ?").bind(source.grup, source.ad),
    env.DB.prepare(
      `INSERT INTO deleted_athletes (grup, ad, tarih, tasindi) VALUES (?, ?, ?, 1)
       ON CONFLICT(grup, ad) DO UPDATE SET tarih = excluded.tarih, tasindi = 1`
    ).bind(source.grup, source.ad, zaman),
    env.DB.prepare(
      `INSERT INTO athlete_moves (eski_grup, eski_ad, yeni_grup, yeni_ad, tasindi_zaman) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(eski_grup, eski_ad) DO UPDATE SET yeni_grup = excluded.yeni_grup, yeni_ad = excluded.yeni_ad, tasindi_zaman = excluded.tasindi_zaman`
    ).bind(source.grup, source.ad, target.grup, target.ad, zaman),
  ]);
  return { applied: true, moved };
}
