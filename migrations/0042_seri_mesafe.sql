-- Seri mesafesi (2026-10-02, araştırma: "gelişim ölçülemiyor çünkü mesafe kaydı yok"). Metre; eski serilerde NULL.
ALTER TABLE series ADD COLUMN mesafe INTEGER;
