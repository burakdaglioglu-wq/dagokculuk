-- Giriş sistemi (2026-09-27): kişiye özel hesaplar, sunucu oturumları, deneme sınırı, passkey, işlem günlüğü.
-- Eski credentials tablosu yalnızca ilk kurulum (eski yönetici PIN'iyle hesap oluşturma) için okunur;
-- kurulum tamamlanınca içindeki özetler geçersiz bir değerle ezilir.
CREATE TABLE IF NOT EXISTS kullanicilar (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ad          TEXT NOT NULL,
  rol         TEXT NOT NULL CHECK (rol IN ('yonetici', 'egitmen')),
  pin_ozet    TEXT NOT NULL,
  aktif       INTEGER NOT NULL DEFAULT 1,
  olusturma   INTEGER NOT NULL,
  son_giris   INTEGER
);

CREATE TABLE IF NOT EXISTS oturumlar (
  token_ozet    TEXT PRIMARY KEY,
  kullanici_id  INTEGER NOT NULL,
  cihaz         TEXT,
  olusturma     INTEGER NOT NULL,
  son_kullanim  INTEGER NOT NULL,
  bitis         INTEGER NOT NULL,
  hatirla       INTEGER NOT NULL DEFAULT 0,
  yetki_zamani  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_oturumlar_kullanici ON oturumlar (kullanici_id);

CREATE TABLE IF NOT EXISTS giris_denemeleri (
  anahtar      TEXT PRIMARY KEY,
  sayi         INTEGER NOT NULL DEFAULT 0,
  son_deneme   INTEGER NOT NULL DEFAULT 0,
  kilit_bitis  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS giris_challenge (
  challenge     TEXT PRIMARY KEY,
  tur           TEXT NOT NULL,
  kullanici_id  INTEGER,
  bitis         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS passkeyler (
  id            TEXT PRIMARY KEY,
  kullanici_id  INTEGER NOT NULL,
  public_key    TEXT NOT NULL,
  alg           INTEGER NOT NULL,
  sayac         INTEGER NOT NULL DEFAULT 0,
  cihaz         TEXT,
  olusturma     INTEGER NOT NULL,
  son_kullanim  INTEGER
);

CREATE TABLE IF NOT EXISTS giris_ayarlar (
  anahtar  TEXT PRIMARY KEY,
  deger    TEXT
);

CREATE TABLE IF NOT EXISTS islem_gunlugu (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  zaman         INTEGER NOT NULL,
  kullanici_id  INTEGER,
  ad            TEXT,
  olay          TEXT NOT NULL,
  detay         TEXT
);
CREATE INDEX IF NOT EXISTS idx_islem_gunlugu_zaman ON islem_gunlugu (zaman);
