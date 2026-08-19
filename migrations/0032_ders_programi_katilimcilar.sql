CREATE TABLE antrenman_programi_katilimci (
  slotId INTEGER NOT NULL REFERENCES antrenman_programi(id) ON DELETE CASCADE,
  grup TEXT NOT NULL,
  ad TEXT NOT NULL,
  eklenme INTEGER NOT NULL,
  PRIMARY KEY (slotId, grup, ad)
);
CREATE INDEX idx_apk_grup_ad ON antrenman_programi_katilimci(grup, ad);

-- Geçiş dolgusu: mevcut her ders slotu için, o an nominal grubu eşleşen tüm aktif sporcuları otomatik
-- kaydeder — böylece migration anında hatırlatma bildirimleri sessizce kesilmez, eski davranış korunur.
-- Yönetici bundan sonra her dersin listesini istediği gibi özelleştirebilir (ekle/çıkar).
INSERT INTO antrenman_programi_katilimci (slotId, grup, ad, eklenme)
  SELECT p.id, a.grup, a.ad, strftime('%s','now') * 1000
  FROM antrenman_programi p JOIN athletes a ON a.grup = p.grup AND a.pasif = 0;
