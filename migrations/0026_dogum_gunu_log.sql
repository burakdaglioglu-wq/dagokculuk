CREATE TABLE dogum_gunu_hatirlatma_log (
  ad   TEXT NOT NULL,
  yil  INTEGER NOT NULL,
  t    INTEGER NOT NULL,
  PRIMARY KEY (ad, yil)
);
