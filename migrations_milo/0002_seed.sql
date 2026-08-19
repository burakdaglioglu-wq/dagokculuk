-- Varsayilan PIN: 1234 — Gizem ve Burak ilk girişten hemen sonra Şifre Yönetimi'nden değiştirmeli.
INSERT INTO credentials (id, yonetici_hash, egitmen_hash, degisim) VALUES (
  1,
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
  0
);

INSERT INTO meta (key, value, updated_at) VALUES ('minSurum', '1', 0);
