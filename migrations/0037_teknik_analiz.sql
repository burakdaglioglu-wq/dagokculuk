-- Teknik Analiz (Faz — Karışık Sınıf aracı, 2026-09-23): sporcuya özel, faz faz (duruş/kabza/çekiş/
-- çapa/nişan/bırakış/takip...) puanlanan, foto+not eklenen atış-formu değerlendirmesi. Klasik ve
-- makaralı yay ayrı faz setleriyle değerlendirilir (istemci tarafında tanımlı, burada sadece "yay"
-- etiketi tutuluyor). fazlar_json fotoğrafları da içerir (athletes.fotoUrl ile AYNI desen: base64
-- data URL, canvas'ta küçültülmüş) — R2 bu projede hiç kurulmamış, tutarlılık için aynı yol izlendi.
CREATE TABLE teknik_analiz (
  id           TEXT PRIMARY KEY,
  grup         TEXT NOT NULL,
  ad           TEXT NOT NULL,
  yay          TEXT NOT NULL,
  tarih        TEXT NOT NULL,
  skor         INTEGER,
  fazlar_json  TEXT NOT NULL,
  olusturan    TEXT,
  lastModified INTEGER NOT NULL
);
CREATE INDEX idx_teknik_analiz_grup_ad ON teknik_analiz(grup, ad, lastModified);
