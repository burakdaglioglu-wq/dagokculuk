ALTER TABLE members ADD COLUMN devamDuzeltme INTEGER NOT NULL DEFAULT 0;
-- devamDuzeltme: yoneticinin elle ekleyip cikarabildigi duzeltme payi. Gosterilen "devam sayisi" =
-- (attendance_auto'da geldi=1 olan kayit sayisi) + devamDuzeltme. Otomatik sayim asla elle ezilmez,
-- sadece bir duzeltme payi ustune eklenir.

CREATE TABLE member_skills (
  ad TEXT NOT NULL,                 -- SADECE ad ile anahtarli (dues/attendance_auto ile ayni desen) —
                                     -- grup degisince beceri kaydi kaybolmasin.
  dersId TEXT NOT NULL,
  durum TEXT NOT NULL DEFAULT 'henuz_degil' CHECK (durum IN ('henuz_degil','gelisiyor','ogrendi')),
  guncelleme INTEGER NOT NULL,
  PRIMARY KEY (ad, dersId)
);
CREATE INDEX idx_milo_member_skills_ad ON member_skills(ad);

CREATE TABLE gunluk_ders_notu (
  tarih TEXT PRIMARY KEY,
  notMetin TEXT,
  guncelleme INTEGER NOT NULL
);