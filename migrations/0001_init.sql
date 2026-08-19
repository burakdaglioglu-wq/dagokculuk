PRAGMA foreign_keys = ON;

-- ================= ATHLETES =================
CREATE TABLE athletes (
  grup                TEXT NOT NULL CHECK (grup IN ('buyukler','yildizlar','kucukler','minikler')),
  ad                   TEXT NOT NULL,
  kod                  TEXT,
  dogumYili            INTEGER,
  sinif                TEXT,
  yay                  TEXT,
  pasif                INTEGER NOT NULL DEFAULT 0,
  frozen               INTEGER NOT NULL DEFAULT 0,
  toplamSkor           INTEGER NOT NULL DEFAULT 0,
  xAdet                INTEGER NOT NULL DEFAULT 0,
  sonSkorZamani        INTEGER,
  lastModified         INTEGER NOT NULL DEFAULT 0,
  coin                 INTEGER NOT NULL DEFAULT 0,
  coinT                INTEGER NOT NULL DEFAULT 0,
  gamification_json    TEXT NOT NULL DEFAULT '{}',
  kartGecmisi_json     TEXT NOT NULL DEFAULT '[]',
  gecmisSezonlar_json  TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (grup, ad)
);
CREATE INDEX idx_athletes_lastmod ON athletes(lastModified);

-- ================= SERIES (sync-critical path) =================
CREATE TABLE series (
  seriId       TEXT PRIMARY KEY,
  grup         TEXT NOT NULL,
  ad           TEXT NOT NULL,
  oklar_json   TEXT NOT NULL,
  puan         INTEGER NOT NULL DEFAULT 0,
  tarih        TEXT NOT NULL,
  cihazId      TEXT,
  t            INTEGER NOT NULL,
  iptal        INTEGER NOT NULL DEFAULT 0,
  received_at  INTEGER NOT NULL
);
CREATE INDEX idx_series_ad_tarih ON series(grup, ad, tarih);
CREATE INDEX idx_series_t ON series(t);

-- ================= TOMBSTONES / MOVES =================
CREATE TABLE deleted_athletes (
  grup    TEXT NOT NULL,
  ad      TEXT NOT NULL,
  tarih   INTEGER NOT NULL,
  tasindi INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (grup, ad)
);

CREATE TABLE athlete_moves (
  eski_grup     TEXT NOT NULL,
  eski_ad       TEXT NOT NULL,
  yeni_grup     TEXT NOT NULL,
  yeni_ad       TEXT NOT NULL,
  tasindi_zaman INTEGER NOT NULL,
  PRIMARY KEY (eski_grup, eski_ad)
);

-- ================= TEAMS / BRACKETS =================
CREATE TABLE teams (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  lig          TEXT NOT NULL,
  ad           TEXT NOT NULL,
  size         TEXT,
  p1 TEXT, p2 TEXT, p3 TEXT,
  renk         TEXT,
  lastModified INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE bracket_matches (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  tip          TEXT NOT NULL CHECK (tip IN ('bireysel','takim')),
  lig          TEXT NOT NULL,
  tur          INTEGER NOT NULL,
  data_json    TEXT NOT NULL,
  lastModified INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_bracket_lookup ON bracket_matches(tip, lig, tur);

-- ================= SEASON =================
CREATE TABLE season (
  id          INTEGER PRIMARY KEY CHECK (id = 1),
  ad          TEXT NOT NULL DEFAULT 'Aktif Sezon',
  baslangic   TEXT,
  bitis       TEXT,
  guncelleme  INTEGER NOT NULL DEFAULT 0
);

-- ================= EDIT LOCK =================
CREATE TABLE edit_lock (
  id     INTEGER PRIMARY KEY CHECK (id = 1),
  grup   TEXT,
  ad     TEXT,
  yapan  TEXT,
  zaman  INTEGER
);

-- ================= DAILY BACKUPS =================
CREATE TABLE daily_backups (
  tarih       TEXT PRIMARY KEY,
  veri_json   TEXT NOT NULL,
  guncelleme  INTEGER NOT NULL
);

-- ================= DUES =================
CREATE TABLE dues (
  ad      TEXT NOT NULL,
  ay      TEXT NOT NULL,
  odendi  INTEGER NOT NULL DEFAULT 0,
  tutar   REAL,
  tarih   TEXT,
  PRIMARY KEY (ad, ay)
);

-- ================= ATTENDANCE =================
CREATE TABLE attendance_auto (
  tarih  TEXT NOT NULL,
  ad     TEXT NOT NULL,
  grup   TEXT,
  saat   TEXT,
  PRIMARY KEY (tarih, ad)
);

CREATE TABLE personnel (
  id     TEXT PRIMARY KEY,
  ad     TEXT NOT NULL,
  ucret  TEXT
);

CREATE TABLE personnel_attendance (
  tarih       TEXT NOT NULL,
  personel_id TEXT NOT NULL,
  PRIMARY KEY (tarih, personel_id)
);

-- ================= MISC =================
CREATE TABLE custom_classes ( ad TEXT PRIMARY KEY );

CREATE TABLE training_sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  tarih      TEXT NOT NULL,
  lig        TEXT,
  data_json  TEXT NOT NULL
);

CREATE TABLE shot_log (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  t      TEXT NOT NULL,
  tarih  TEXT NOT NULL,
  ad     TEXT NOT NULL,
  grup   TEXT,
  sari   INTEGER,
  x      INTEGER,
  puan   INTEGER
);
CREATE INDEX idx_shotlog_tarih ON shot_log(tarih);
CREATE INDEX idx_shotlog_ad ON shot_log(ad);

CREATE TABLE club_records (
  anahtar TEXT PRIMARY KEY,
  deger   INTEGER NOT NULL,
  ad      TEXT,
  tarih   TEXT
);

CREATE TABLE credentials (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  yonetici_hash  TEXT NOT NULL,
  egitmen_hash   TEXT NOT NULL,
  degisim        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE meta (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  INTEGER
);
