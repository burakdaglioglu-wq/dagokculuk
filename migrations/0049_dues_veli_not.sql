-- 💬 Veliye not (2026-11-09, kullanıcı: "veli ne kadar vermiş, verdiğindeki not gözüksün, yöneticinin yazdığı").
-- Ayrı alan: yalnız buraya yazılan veliye görünür (telefon son 4 doğrulamalı /api/veli-odeme). notMetin iç not olarak
-- kalır ve hiçbir veli uç noktasından dönmez (eski iç notlar gizli kalsın diye kullanıcı ayrı alanı seçti).
ALTER TABLE dues ADD COLUMN veliNot TEXT;
