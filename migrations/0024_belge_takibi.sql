ALTER TABLE athletes ADD COLUMN saglikRaporuBitis TEXT;
ALTER TABLE athletes ADD COLUMN lisansBitis TEXT;

CREATE TABLE belge_hatirlatma_log (
  ad     TEXT NOT NULL,
  tip    TEXT NOT NULL,
  tarih  TEXT NOT NULL,
  t      INTEGER NOT NULL,
  PRIMARY KEY (ad, tip, tarih)
);
