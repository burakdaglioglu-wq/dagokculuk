PRAGMA foreign_keys = ON;

-- ================= MEMBERS (cimnastik uyeleri — sadece genel/aidat-iliskili alanlar,
-- skor/coin/gamification/yay gibi okculuga ozgu hicbir kolon yok) =================
CREATE TABLE members (
  grup           TEXT NOT NULL,      -- serbest metin, Gizem'in kendi belirledigi grup/seviye adi (CHECK enum YOK)
  ad             TEXT NOT NULL,
  sinif          TEXT,
  cinsiyet       TEXT,
  dogumTarihi    TEXT,
  katilmaTarihi  TEXT,
  aileMeslek     TEXT,
  acilKisi       TEXT,
  acilTelefon    TEXT,
  antrenmanNotu  TEXT,
  genelNot       TEXT,
  aidatMuaf      INTEGER NOT NULL DEFAULT 0,
  pasif          INTEGER NOT NULL DEFAULT 0,
  lastModified   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (grup, ad)
);
CREATE INDEX idx_milo_members_lastmod ON members(lastModified);

-- ================= DUES (aidat) =================
CREATE TABLE dues (
  ad          TEXT NOT NULL,
  ay          TEXT NOT NULL,
  odendi      INTEGER NOT NULL DEFAULT 0,
  tutar       REAL,
  tarih       TEXT,
  notMetin    TEXT,
  odemeTarihi TEXT,
  PRIMARY KEY (ad, ay)
);

-- ================= ATTENDANCE =================
CREATE TABLE attendance_auto (
  tarih  TEXT NOT NULL,
  ad     TEXT NOT NULL,
  grup   TEXT,
  saat   TEXT,
  elle   INTEGER DEFAULT 0,
  geldi  INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (tarih, ad)
);

CREATE TABLE personnel (
  id     TEXT PRIMARY KEY,
  ad     TEXT NOT NULL,
  ucret  TEXT
);

CREATE TABLE personnel_attendance (
  tarih        TEXT NOT NULL,
  personel_id  TEXT NOT NULL,
  elle         INTEGER DEFAULT 0,
  geldi        INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (tarih, personel_id)
);

-- ================= ANTRENMAN PROGRAMI =================
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
CREATE INDEX idx_milo_antrenman_grup ON antrenman_programi(grup);

-- ================= DERS ICERIKLERI =================
CREATE TABLE ders_icerikleri (
  id              TEXT PRIMARY KEY,
  tip             TEXT NOT NULL,
  baslik          TEXT NOT NULL,
  seviye          TEXT NOT NULL,
  gruplar_json    TEXT NOT NULL,
  sure            INTEGER,
  malzeme         TEXT,
  aciklama        TEXT,
  adimlar_json    TEXT NOT NULL DEFAULT '[]',
  dikkat_json     TEXT NOT NULL DEFAULT '[]',
  cizim           TEXT,
  olusturan       TEXT,
  olusturulma     INTEGER NOT NULL,
  guncelleme      INTEGER NOT NULL,
  baglantiSlotId  INTEGER
);

CREATE TABLE ders_kullanim_log (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  dersId   TEXT NOT NULL,
  tarih    TEXT NOT NULL,
  kullanan TEXT,
  t        INTEGER NOT NULL,
  grup     TEXT
);
CREATE INDEX idx_milo_ders_kullanim_dersid ON ders_kullanim_log(dersId);

CREATE TABLE ders_degerlendirme (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  dersId         TEXT NOT NULL,
  puan           INTEGER NOT NULL,
  degerlendiren  TEXT,
  t              INTEGER NOT NULL
);
CREATE INDEX idx_milo_ders_degerlendirme_dersid ON ders_degerlendirme(dersId);

-- ================= MISC =================
CREATE TABLE custom_classes ( ad TEXT PRIMARY KEY );

-- Tek satirlik kimlik dogrulama tablosu — okculuktakinden tamamen ayri, bu DB'ye ozel.
CREATE TABLE credentials (
  id             INTEGER PRIMARY KEY CHECK (id = 1),
  yonetici_hash  TEXT NOT NULL,
  egitmen_hash   TEXT NOT NULL,
  aidat_hash     TEXT,
  degisim        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE meta ( key TEXT PRIMARY KEY, value TEXT, updated_at INTEGER );
