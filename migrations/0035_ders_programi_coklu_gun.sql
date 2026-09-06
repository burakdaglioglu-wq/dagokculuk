-- Ders Programı — haftada birden fazla gün desteği (2026-08-20, kullanıcı: "haftada iki kez yazilacak
-- sekilde ayarlamani istiyorum"). Bir slot artık TEK bir `gun`a değil, birden fazla güne bağlanabiliyor
-- — roster/kapasite/dersPlani ortak kalır, ızgarada aynı kart her bağlı günde görünür.
-- `antrenman_programi.gun` kolonu KASITLI OLARAK silinmiyor — geriye dönük güvenlik ağı olarak
-- (seçilen günlerin en küçüğü) yazılmaya devam ediyor, ama artık uygulama tarafında OKUNMUYOR; tek
-- doğru kaynak bu yeni tablo.

CREATE TABLE antrenman_programi_gun (
  slotId INTEGER NOT NULL REFERENCES antrenman_programi(id) ON DELETE CASCADE,
  gun INTEGER NOT NULL,
  PRIMARY KEY (slotId, gun)
);
CREATE INDEX idx_apg_gun ON antrenman_programi_gun(gun);

-- Geçiş dolgusu: her mevcut slot kendi tek `gun`'unu bu yeni tabloya da yazar.
INSERT INTO antrenman_programi_gun (slotId, gun)
  SELECT id, gun FROM antrenman_programi;
