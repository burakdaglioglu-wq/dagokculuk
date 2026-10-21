-- Profil fotoğrafları (2026-10-21, kullanıcı: "fotoğraflarını koyabileceği profil fotoğrafları, oyunlarda da kullanalım, kim attı").
-- Eskiden fotoğraf athletes.fotoUrl içinde base64 duruyordu: her sporcu listesi isteğinde (girişsiz ekranlar dahil) tüm
-- fotoğraflar iniyordu. Artık ayrı tabloda; görsel kendi adresinden (/api/foto/:anahtar?v=t) tarayıcı önbelleğine alınır.
-- anahtar: 's:grup|ad' sporcu, 'p:<personel id>' eğitmen. izin: 1 veli izni var (TV/oyun/girişsiz ekranlarda görünür),
-- 0 izin yok, NULL bilinmiyor — izin 1 değilse görsel yalnız giriş yapmış yönetici/eğitmene verilir.
CREATE TABLE fotolar (
  anahtar TEXT PRIMARY KEY,
  veri    TEXT,
  izin    INTEGER,
  t       INTEGER NOT NULL
);
-- mevcut fotoğraflar taşınır; zaten oyunlarda gösteriliyorlardı → izin 1
INSERT OR IGNORE INTO fotolar (anahtar, veri, izin, t)
  SELECT 's:' || grup || '|' || ad, fotoUrl, 1, COALESCE(lastModified, 0) FROM athletes WHERE fotoUrl LIKE 'data:image%';
UPDATE athletes SET fotoUrl = NULL WHERE fotoUrl IS NOT NULL;
