-- 💵 Kasa ve muhasebe (2026-10-30, kullanıcı: aidat paneli "Kasa ve muhasebe" fikirleri). Her ödemede yöntem (nakit / iban / kart)
-- ve tahsil eden kişi (oturumdaki yönetici/eğitmen; sunucu yazar, ilk girişte sabitlenir). Aidat dışı gelir (kayıt ücreti, forma,
-- ekipman satışı…) ayrı tabloda; Net = aidat + diğer gelir − gider.
ALTER TABLE dues ADD COLUMN yontem TEXT;
ALTER TABLE dues ADD COLUMN giren TEXT;
CREATE TABLE gelir (
  id        TEXT PRIMARY KEY,
  tarih     TEXT NOT NULL,
  kategori  TEXT NOT NULL,
  aciklama  TEXT,
  tutar     REAL NOT NULL,
  yontem    TEXT,
  sporcu    TEXT,
  giren     TEXT,
  t         INTEGER NOT NULL
);
CREATE INDEX idx_gelir_tarih ON gelir(tarih);
