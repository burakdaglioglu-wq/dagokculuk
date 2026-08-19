ALTER TABLE ders_kullanim_log ADD COLUMN grup TEXT;
CREATE INDEX idx_ders_kullanim_grup ON ders_kullanim_log(grup);
