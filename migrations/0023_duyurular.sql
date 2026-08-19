CREATE TABLE duyurular (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  baslik     TEXT NOT NULL,
  mesaj      TEXT NOT NULL,
  hedefGrup  TEXT,
  gonderen   TEXT,
  t          INTEGER NOT NULL
);
CREATE INDEX idx_duyurular_t ON duyurular(t);
