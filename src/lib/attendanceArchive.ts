import type { Env } from "../env";
import { turkiyeSaatBilgisi } from "./reminders";

// Yoklama arşivleme (2026-09-11, DEVIR.md §9d/§9f) — attendance_auto hiç arşivlenmiyordu, fan-out'ta
// sürekli büyüyen tek koleksiyondu. Bu modül her cron turunda (bkz. src/index.ts scheduled()) 90
// günden eski satırları attendance_auto_archive'a taşır — ama SADECE ARSIV_RAPORLAR_HAZIR true
// olduğunda. O bayrak, arşive düşen tarihleri okuyabilmesi gereken 7 rapor fonksiyonu (bkz. DEVIR.md
// §9f — _aylikBultenMetni, sporcuAylikRaporPdfIndir, aylikBultenCiz, aileRaporuPDF, aileRaporuMetin,
// _dersSonuOzetMetni, yoneticiAylikKatilimCiz) arşiv-farkında hale getirilene kadar BİLEREK false
// kalıyor — false iken cron veri TAŞIMAZ, sadece "şu kadar satır taşınacaktı" diye kuru bir log yazar.
// Bu, "yerel testte 0 satır taşınıyordu, gerçek veri 90 günü geçince rapor fonksiyonları
// haberi olmadan veri kaybediyormuş gibi görünsün" riskini baştan siler.
export const ARSIV_RAPORLAR_HAZIR = false;

const HOT_GUN_SAYISI = 90;

function cutoffTarihHesapla(simdi: Date): string {
  // turkiyeSaatBilgisi UTC'yi Europe/Istanbul'a çeviriyor (Workers runtime'ında Date'in yerel
  // getter'ları UTC döner, bkz. reminders.ts'teki AYNI uyarı) — 90 günlük bir eşik için birkaç
  // saatlik kayma zaten önemsiz olurdu, ama tutarlılık için proje genelindeki AYNI desen kullanıldı.
  const bugunTr = turkiyeSaatBilgisi(simdi).tarih; // YYYY-MM-DD
  const [y, m, d] = bugunTr.split("-").map(Number);
  const cutoff = new Date(Date.UTC(y, m - 1, d));
  cutoff.setUTCDate(cutoff.getUTCDate() - HOT_GUN_SAYISI);
  return cutoff.toISOString().slice(0, 10);
}

/** Cron tetiklendiğinde (her ~5 dakikada bir) çağrılır. ARSIV_RAPORLAR_HAZIR false iken hiçbir satır
 * taşınmaz — sadece kaç satırın taşınacağı bir kere (gerçek bir sayı varsa) archive_runs'a "kuru" bir
 * satır olarak yazılır, tekrar tekrar aynı sayıyı loglamaz (kontrol her turda yapılır ama log SADECE
 * sayı bir önceki kuru kayıttan farklıysa yazılır — yoksa archive_runs kendisi 5 dakikada bir büyüyen
 * bir tabloya dönerdi, tam çözülmeye çalışılan sorunun aynısı). */
export async function archiveOldAttendance(env: Env): Promise<void> {
  const cutoff = cutoffTarihHesapla(new Date());
  const { results } = await env.DB.prepare("SELECT COUNT(*) as adet FROM attendance_auto WHERE tarih < ?").bind(cutoff).all<{ adet: number }>();
  const adet = results?.[0]?.adet ?? 0;

  if (!ARSIV_RAPORLAR_HAZIR) {
    if (adet === 0) return; // taşınacak hiçbir şey yok, log kirletmeye gerek yok
    const son = await env.DB.prepare("SELECT tasinan_satir FROM archive_runs WHERE bayrak_durumu = 'kuru' ORDER BY id DESC LIMIT 1").first<{ tasinan_satir: number }>();
    if (son && son.tasinan_satir === adet) return; // sayı değişmedi, tekrar loglama
    await env.DB.prepare("INSERT INTO archive_runs (tablo, calisma_zamani, cutoff_tarih, tasinan_satir, bayrak_durumu) VALUES (?, ?, ?, ?, 'kuru')")
      .bind("attendance_auto", Date.now(), cutoff, adet)
      .run();
    return;
  }

  // Gerçek taşıma (bayrak true olduğunda) — arşive ekle + canlı tablodan sil + sonucu logla, hepsi
  // TEK bir batch'te (D1'de atomik) ki yarım kalmış bir taşıma (kopyalanmış ama silinmemiş, ya da
  // tersi) asla olmasın.
  if (adet === 0) return;
  const { results: satirlar } = await env.DB.prepare(
    "SELECT tarih, ad, grup, saat, elle, geldi FROM attendance_auto WHERE tarih < ?"
  ).bind(cutoff).all<{ tarih: string; ad: string; grup: string | null; saat: string | null; elle: number; geldi: number }>();

  const stmts = satirlar.map((r) =>
    env.DB.prepare(
      "INSERT OR REPLACE INTO attendance_auto_archive (tarih, ad, grup, saat, elle, geldi) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(r.tarih, r.ad, r.grup, r.saat, r.elle, r.geldi)
  );
  stmts.push(env.DB.prepare("DELETE FROM attendance_auto WHERE tarih < ?").bind(cutoff));
  stmts.push(
    env.DB.prepare("INSERT INTO archive_runs (tablo, calisma_zamani, cutoff_tarih, tasinan_satir, bayrak_durumu) VALUES (?, ?, ?, ?, 'gercek')")
      .bind("attendance_auto", Date.now(), cutoff, satirlar.length)
  );
  await env.DB.batch(stmts);
}
