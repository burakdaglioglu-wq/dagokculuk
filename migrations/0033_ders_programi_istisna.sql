CREATE TABLE antrenman_programi_istisna (
  slotId INTEGER NOT NULL REFERENCES antrenman_programi(id) ON DELETE CASCADE,
  tarih TEXT NOT NULL,
  sebep TEXT,
  olusturulma INTEGER NOT NULL,
  PRIMARY KEY (slotId, tarih)
);
