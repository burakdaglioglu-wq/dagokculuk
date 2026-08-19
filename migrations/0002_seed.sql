INSERT INTO season (id, ad, guncelleme) VALUES (1, 'Aktif Sezon', 0);

INSERT INTO edit_lock (id, grup, ad, yapan, zaman) VALUES (1, NULL, NULL, NULL, NULL);

INSERT INTO credentials (id, yonetici_hash, egitmen_hash, degisim) VALUES (
  1,
  '7f59051d004a7ac406880e4122e7cd0dd7995ef0ae9be2c9f7ddc6683b7f0357',
  'd88e4a72af6b2d5e7c737813df9e499a7acb92c308b62dc0ae7f429b154b4da4',
  0
);

INSERT INTO meta (key, value, updated_at) VALUES
  ('minSurum', '105', 0),
  ('resetZamani', '0', 0),
  ('sonGeriYukleme', '0', 0),
  ('aktifTur', '1', 0),
  ('aktifTakimTur', '1', 0);
