-- Veliye aylık rapor linki (2026-09-29): Dağ'daki athletes.izleKodu ile aynı — tahmin edilemez, üye başına tek kod.
ALTER TABLE members ADD COLUMN izleKodu TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_milo_members_izle_kodu ON members(izleKodu);
