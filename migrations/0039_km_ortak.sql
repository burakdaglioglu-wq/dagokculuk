-- Karışık Sınıf "ortak ders" (2026-09-29): bir konumdaki dersin oyun/takım/araç durumu artık cihaza değil
-- konuma ait — aynı konuma giren her cihaz (tablet, telefon, PC) aynı dersi görür ve birlikte çalışır.
-- Her satır tek bir paylaşılan yerel kayıt (anahtar) ya da o kaydın bir alt girdisi (alt: ör. sporcu
-- "grup|ad"). Çakışmada en yeni t kazanır (tek bir UPSERT ... WHERE excluded.t > t ile, atomik).
-- deger NULL = silindi. s = sunucu yazma zamanı (artımlı çekme için, cihaz saatinden bağımsız).
CREATE TABLE IF NOT EXISTS km_ortak (
  konum   TEXT NOT NULL,
  anahtar TEXT NOT NULL,
  alt     TEXT NOT NULL DEFAULT '',
  deger   TEXT,
  t       INTEGER NOT NULL,
  s       INTEGER NOT NULL,
  cihaz   TEXT,
  PRIMARY KEY (konum, anahtar, alt)
);
CREATE INDEX IF NOT EXISTS idx_km_ortak_s ON km_ortak(konum, s);
