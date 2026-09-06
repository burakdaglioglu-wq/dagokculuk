-- DAĞ Okçuluk'un çoklu-gün desteğinin Milo'ya taşınması (2026-08-20) — bkz. migrations/0035 için AYNI
-- gerekçe. `antrenman_programi.gun` kolonu silinmiyor (seçilen günlerin en küçüğü yazılmaya devam
-- ediyor, geriye dönük güvenlik ağı), ama tek doğru kaynak bu yeni tablo.

CREATE TABLE antrenman_programi_gun (
  slotId INTEGER NOT NULL REFERENCES antrenman_programi(id) ON DELETE CASCADE,
  gun INTEGER NOT NULL,
  PRIMARY KEY (slotId, gun)
);
CREATE INDEX idx_milo_apg_gun ON antrenman_programi_gun(gun);

INSERT INTO antrenman_programi_gun (slotId, gun)
  SELECT id, gun FROM antrenman_programi;
