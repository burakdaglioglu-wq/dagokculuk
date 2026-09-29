-- İkinci veli (2026-09-30, kullanıcı: "bazen ailede iki kişinin numarasını giriyorum"). Kişisel bilgi (KVKK):
-- routes/athletes.ts KISISEL_ALANLAR'da, girişsiz okumada gizlenir.
ALTER TABLE athletes ADD COLUMN veli2Kisi TEXT;
ALTER TABLE athletes ADD COLUMN veli2Telefon TEXT;
