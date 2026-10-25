-- 🔑 Sporcu girişleri (2026-10-25, kullanıcı: "yönetici panelinde sporcuların girişlerini ayarlamam lazım"). Sporcu girişi
-- telefonda (ad + kod) yapılıyor; uygulama girişten sonra POST /api/sporcu-giris ile burayı haberdar eder → yönetici son girişi
-- ve hiç girmeyenleri görür. kapali = 1 ise sunucu girişi reddeder ve telefon oturumu kapatır.
-- anahtar: 'grup|ad'.
CREATE TABLE sporcu_giris (
  anahtar TEXT PRIMARY KEY,
  kapali  INTEGER NOT NULL DEFAULT 0,
  son     INTEGER,
  sayi    INTEGER NOT NULL DEFAULT 0
);
