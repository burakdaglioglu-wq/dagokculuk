-- DAĞ Okçuluk'un Ders Programı genişlemesinin Milo'ya taşınması (2026-08-20) — roster, kapasite,
-- tek-seferlik-iptal ve ders planı. Ana app'teki migrations/0032+0033+0034'ün BİRLEŞTİRİLMİŞ hali
-- (ayrı ayrı 3 migration yerine tek dosya — Milo'nun migration geçmişi ana app'ten bağımsız, henüz
-- production'da kimse bu ara adımlara bağımlı değil).

CREATE TABLE antrenman_programi_katilimci (
  slotId INTEGER NOT NULL REFERENCES antrenman_programi(id) ON DELETE CASCADE,
  grup TEXT NOT NULL,
  ad TEXT NOT NULL,
  eklenme INTEGER NOT NULL,
  PRIMARY KEY (slotId, grup, ad)
);
CREATE INDEX idx_milo_apk_grup_ad ON antrenman_programi_katilimci(grup, ad);

-- Geçiş dolgusu: mevcut her ders slotu için, o an nominal grubu eşleşen tüm aktif üyeleri otomatik
-- kaydeder — ana app'teki 0032'nin AYNI mantığı, tablo adı `athletes` yerine Milo'nun `members`.
INSERT INTO antrenman_programi_katilimci (slotId, grup, ad, eklenme)
  SELECT p.id, m.grup, m.ad, strftime('%s','now') * 1000
  FROM antrenman_programi p JOIN members m ON m.grup = p.grup AND m.pasif = 0;

CREATE TABLE antrenman_programi_istisna (
  slotId INTEGER NOT NULL REFERENCES antrenman_programi(id) ON DELETE CASCADE,
  tarih TEXT NOT NULL,
  sebep TEXT,
  olusturulma INTEGER NOT NULL,
  PRIMARY KEY (slotId, tarih)
);

ALTER TABLE antrenman_programi ADD COLUMN dersPlani TEXT;
ALTER TABLE antrenman_programi ADD COLUMN kapasite INTEGER;
