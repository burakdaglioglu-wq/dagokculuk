-- 💵 Ödeme yöntemi (nakit / iban / kart) + tahsil eden kişi — DAĞ'daki 0046 ile aynı (aidat paneli ortak).
ALTER TABLE dues ADD COLUMN yontem TEXT;
ALTER TABLE dues ADD COLUMN giren TEXT;
