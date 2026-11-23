-- 💌 Velilere Gönder (2026-11-23): kişisel veli linkinin (athletes.izleKodu) gönderim ve açılış kaydı. Telefon / isim tutulmaz.
CREATE TABLE IF NOT EXISTS veli_link (
  izle_kodu     TEXT PRIMARY KEY,
  gonderildi    INTEGER,
  gonderen      TEXT,
  tur           TEXT,
  gonderim_sayi INTEGER NOT NULL DEFAULT 0,
  acildi        INTEGER,
  acilis_sayi   INTEGER NOT NULL DEFAULT 0,
  giris         INTEGER
);
