CREATE TABLE ihtiyac_talepleri (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ad        TEXT NOT NULL,
  grup      TEXT,
  kategori  TEXT NOT NULL,
  aciklama  TEXT NOT NULL,
  durum     TEXT NOT NULL DEFAULT 'yeni',
  t         INTEGER NOT NULL
);
CREATE INDEX idx_ihtiyac_t ON ihtiyac_talepleri(t);
