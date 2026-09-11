-- Yoklama arşivleme (2026-09-11, DEVIR.md §9d/§9f) — attendance_auto hiç arşivlenmediği için
-- fan-out'ta sürekli büyüyen tek koleksiyondu (§9 ölçümü: 406 kayıt, en büyük dilim). Bu migration
-- SADECE şemayı ekliyor — hiçbir satırı TAŞIMIYOR. Gerçek taşıma, koddaki ARSIV_RAPORLAR_HAZIR
-- bayrağı (src/lib/attendanceArchive.ts) true olana kadar (7 rapor fonksiyonu arşiv-farkında olana
-- kadar, bkz. DEVIR.md) cron tarafından BİLEREK yapılmıyor — sadece "şu kadar satır taşınacaktı"
-- diye log'a yazılıyor. Bu yüzden bu migration'ı uygulamak veri taşımaz, sıfır davranış değişikliği,
-- geri dönüşü trivial (DROP TABLE ile).

CREATE TABLE attendance_auto_archive (
  tarih  TEXT NOT NULL,
  ad     TEXT NOT NULL,
  grup   TEXT,
  saat   TEXT,
  elle   INTEGER DEFAULT 0,
  geldi  INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (tarih, ad)
);

-- Cron'un her gerçek arşivleme turunda (bayrak true olduğunda) kaç satır taşıdığını kaydeder —
-- kullanıcı isteği: "bir yere yazsın, sonradan bakabileyim". Sadece GERÇEK bir taşıma olduğunda satır
-- eklenir (her 5 dakikalık boş kontrolde DEĞİL) — yoksa bu tablo kendisi sınırsız büyüyen bir
-- koleksiyon olurdu, tam çözmeye çalıştığımız sorunun aynısı.
CREATE TABLE archive_runs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  tablo          TEXT NOT NULL,
  calisma_zamani INTEGER NOT NULL,
  cutoff_tarih   TEXT NOT NULL,
  tasinan_satir  INTEGER NOT NULL,
  bayrak_durumu  TEXT NOT NULL DEFAULT 'gercek'  -- 'gercek' (tasindi) | 'kuru' (sadece loglandi, ARSIV_RAPORLAR_HAZIR=false)
);
