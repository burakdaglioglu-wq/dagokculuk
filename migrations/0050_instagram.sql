-- Instagram bağlantısı (2026-11-12). Tek satır: kulübün Facebook sayfası + bağlı Instagram iş hesabı.
-- Anahtarlar YALNIZ sunucuda kalır; hiçbir uç bunları istemciye döndürmez.
CREATE TABLE IF NOT EXISTS instagram_baglanti (
  id               INTEGER PRIMARY KEY CHECK (id = 1),
  sayfa_id         TEXT NOT NULL,
  sayfa_ad         TEXT,
  sayfa_token      TEXT NOT NULL,
  ig_id            TEXT,
  ig_kullanici     TEXT,
  kullanici_token  TEXT NOT NULL,
  kullanici_bitis  INTEGER NOT NULL DEFAULT 0,
  baglayan         TEXT,
  tarih            INTEGER NOT NULL
);
-- "Bağla" düğmesine basan yöneticinin tek kullanımlık state anahtarı (10 dk). Başka biri dönüş adresini taklit edemesin.
CREATE TABLE IF NOT EXISTS instagram_state (
  state     TEXT PRIMARY KEY,
  ad        TEXT,
  olusturma INTEGER NOT NULL
);
