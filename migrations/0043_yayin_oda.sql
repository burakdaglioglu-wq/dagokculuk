-- Form Lab "Telefondan yayın al" (2026-10-03): telefon kamerası → bilgisayardaki Form Lab'a WebRTC canlı görüntü.
-- Bu tablo yalnızca iki cihazın birbirini bulması (SDP teklif/cevap alışverişi) içindir; görüntü sunucudan GEÇMEZ.
-- Oda kodu + uzun gizli anahtar (QR içinde) ile korunur; 2 saatten eski odalar yeni oda açılırken silinir.
CREATE TABLE yayin_oda (
  kod          TEXT PRIMARY KEY,
  gizli        TEXT NOT NULL,
  teklif       TEXT,
  teklif_surum INTEGER NOT NULL DEFAULT 0,
  cevap        TEXT,
  cevap_surum  INTEGER NOT NULL DEFAULT 0,
  olusturma    INTEGER NOT NULL,
  guncelleme   INTEGER NOT NULL
);
