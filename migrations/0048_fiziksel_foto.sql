-- Sporcu fiziksel dosyası (2026-11-05). Duruş ve ölçüm formu fotoğrafları. Çocuk fotoğrafı: fotolar tablosundaki "izin=1, herkese açık" yolu
-- BURADA YOK; okuma ve yazma yalnız giriş yapmış yönetici/eğitmene açık (index.ts OTURUMLU_OKUMA_YOLLARI). Ad/grup değişince
-- mergeAthlete ve moveAthlete bu satırları da taşır. veli_onayi: yükleyen, velinin onayını aldığını işaretledi.
CREATE TABLE IF NOT EXISTS fiziksel_foto (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  grup       TEXT NOT NULL,
  ad         TEXT NOT NULL,
  tur        TEXT NOT NULL,
  tarih      TEXT NOT NULL,
  veri       TEXT NOT NULL,
  veli_onayi INTEGER NOT NULL DEFAULT 0,
  yukleyen   TEXT,
  t          INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fiziksel_foto_sporcu ON fiziksel_foto (grup, ad, tarih);
