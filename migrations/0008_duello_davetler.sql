CREATE TABLE duello_davetler (
  duelId       TEXT PRIMARY KEY,
  davetciAd    TEXT NOT NULL,
  davetciGrup  TEXT NOT NULL,
  rakipAd      TEXT NOT NULL,
  rakipGrup    TEXT NOT NULL,
  seriSayisi   INTEGER NOT NULL,
  okSayisi     INTEGER NOT NULL,
  durum        TEXT NOT NULL DEFAULT 'bekliyor',
  olusturulma  INTEGER NOT NULL,
  guncelleme   INTEGER NOT NULL
);
CREATE INDEX idx_duello_davet_rakip ON duello_davetler(rakipGrup, rakipAd, durum);
CREATE INDEX idx_duello_davet_davetci ON duello_davetler(davetciGrup, davetciAd, durum);
