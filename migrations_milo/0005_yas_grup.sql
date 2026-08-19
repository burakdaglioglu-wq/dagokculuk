-- Yas Kategorisi -> Grup gezinme/katalog yapisi. members.grup ve antrenman_programi.grup'a HICBIR
-- FK/CHECK baglanmiyor -- ikisi de serbest metin kalir, eslesme sadece ISIMLE yapilir (antrenman_programi'nin
-- zaten members.grup'a bugun de FK'siz, isimle bagli olmasiyla ayni kanitlanmis desen).
CREATE TABLE yas_kategorileri (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad TEXT NOT NULL,
  olusturulma INTEGER NOT NULL
);

CREATE TABLE gruplar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  yasKategorisiId INTEGER NOT NULL,
  ad TEXT NOT NULL,
  olusturulma INTEGER NOT NULL
);
CREATE INDEX idx_milo_gruplar_yas ON gruplar(yasKategorisiId);
