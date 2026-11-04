-- Veli ödeme ekranı (2026-11-04, public/veli.html). Veli kişiye özel linki (athletes.izleKodu) açar, kayıtlı telefonunun son 4 hanesini
-- yazar; sunucu rastgele bir anahtar verir ve yalnız özetini tutar. Her istekte kod ve son 4 hane yeniden kontrol edilir: numara
-- değişirse oturum kendiliğinden geçersiz olur. Deneme sınırı mevcut giris_denemeleri tablosunda.
CREATE TABLE IF NOT EXISTS veli_oturum (
  token_ozet  TEXT PRIMARY KEY,
  izle_kodu   TEXT NOT NULL,
  son4        TEXT NOT NULL,
  olusturma   INTEGER NOT NULL,
  bitis       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_veli_oturum_bitis ON veli_oturum (bitis);
