CREATE TABLE antrenman_programi (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  grup                 TEXT NOT NULL,
  gun                  INTEGER NOT NULL,
  baslangicSaat        TEXT NOT NULL,
  bitisSaat            TEXT NOT NULL,
  hatirlatmaAktif      INTEGER NOT NULL DEFAULT 0,
  hatirlatmaDakika     INTEGER NOT NULL DEFAULT 30,
  sonHatirlatmaTarihi  TEXT,
  olusturulma          INTEGER NOT NULL,
  guncelleme           INTEGER NOT NULL
);
CREATE INDEX idx_antrenman_programi_grup ON antrenman_programi(grup);