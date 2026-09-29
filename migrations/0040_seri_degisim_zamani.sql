-- Çevrimdışı tam telafi (2026-09-29): bir seri düzeltilince/iptal edilince bunun ZAMANI da tutulur. Uzun süre
-- çevrimdışı kalan cihaz tekrar bağlanınca "ben yokken ne değişti" diye sorar (GET /api/series/degisenler)
-- ve kaçırdığı düzeltme/iptalleri uygular — eskiden yeni seriler gelirdi ama düzeltme/iptaller hiç gelmezdi.
ALTER TABLE series ADD COLUMN degisti INTEGER;
UPDATE series SET degisti = received_at WHERE iptal = 1;
CREATE INDEX IF NOT EXISTS idx_series_degisti ON series(degisti);
