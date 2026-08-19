CREATE TABLE gider (
  id        TEXT PRIMARY KEY,
  tarih     TEXT NOT NULL,
  kategori  TEXT NOT NULL,
  aciklama  TEXT,
  tutar     REAL NOT NULL,
  giren     TEXT,
  t         INTEGER NOT NULL
);
CREATE INDEX idx_gider_tarih ON gider(tarih);
