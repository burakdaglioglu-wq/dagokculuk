CREATE TABLE ozel_ders_icerikleri (
  id            TEXT PRIMARY KEY,
  tip           TEXT NOT NULL,
  baslik        TEXT NOT NULL,
  seviye        TEXT NOT NULL,
  gruplar_json  TEXT NOT NULL,
  sure          INTEGER,
  malzeme       TEXT,
  aciklama      TEXT,
  adimlar_json  TEXT NOT NULL DEFAULT '[]',
  dikkat_json   TEXT NOT NULL DEFAULT '[]',
  cizim         TEXT,
  olusturan     TEXT,
  olusturulma   INTEGER NOT NULL,
  guncelleme    INTEGER NOT NULL
);
CREATE INDEX idx_ozel_ders_tip ON ozel_ders_icerikleri(tip);
