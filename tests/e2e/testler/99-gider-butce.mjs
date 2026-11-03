// 📤 Aidat › Gider · Bütçe Kontrol (2026-11-04, v374 — kullanıcı: "aidattaki gideri düzelt, yeni tasarım" → taslak B).
// Telefon boyunda GERÇEK tıklamayla: toplam / bütçe çubuğu, aşılan kategori kırmızı, karta dokununca kayıtlar, kayda dokununca
// düzenle (PUT /api/gider/:id), "+" ile o kategoriye ekle, formdan sil (onaylı), hedefleri düzenle (meta gider_butce).
// Test giderleri ve eski bütçe sonunda geri alınır.
import { sayfaAc, uygulamaAc, dogrula, esit, api, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  const n = new Date(), ay = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
  const eskiButce = ((await api('/api/meta/gider_butce')).d || {}).value || '{}';
  const ek = (await api('/api/gider?ay=' + ay)).d.giderler.map((g) => g.id);
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 844 });
  try {
    for (const g of [['01', 'Kira', 'E2E salon kirası', 15000], ['02', 'Fatura', 'E2E elektrik', 2400], ['03', 'Fatura', 'E2E su', 1200]]) {
      const r = await api('/api/gider', { method: 'POST', body: JSON.stringify({ tarih: ay + '-' + g[0], kategori: g[1], aciklama: g[2], tutar: g[3], giren: 'E2E' }) });
      esit(r.s, 200, 'gider eklenemedi');
    }
    await api('/api/meta/gider_butce', { method: 'PUT', body: JSON.stringify({ value: JSON.stringify({ Kira: 15000, Fatura: 3000 }) }) });
    await uygulamaAc(p);
    await p.evaluate(() => { _aidatKilitAcikMi = true; _aidatAltSekme = 'gider'; aidatAy = null; const d = document.createElement('div'); d.id = 'tmp-gider'; d.style.cssText = 'position:fixed;inset:0;z-index:30000;overflow:auto;background:#0b0d10;padding:12px'; document.body.appendChild(d); renderHedefId = 'tmp-gider'; egitmenRenderAidat(); });
    await p.waitForSelector('#tmp-gider .gd-kat', { timeout: 20000 });
    const fatura = p.locator('.gd-kat', { hasText: 'Fatura' });
    dogrula(await fatura.evaluate((e) => e.classList.contains('asti')), 'Fatura 3.600 / 3.000 → aşıldı (kırmızı) olmalı');
    dogrula(/aşıldı/.test(await fatura.innerText()), 'aşıldı yazısı yok');
    dogrula(await yataydaTasmaYok(p), 'yatay taşma');
    // karta dokun → kayıtlar; elektrik kaydına dokun → düzenle
    await fatura.locator('.gd-kat-ana').click();
    await p.locator('.gd-kayit', { hasText: 'E2E elektrik' }).click();
    await p.waitForSelector('#gd-tutar');
    esit(await p.inputValue('#gd-tutar'), '2400', 'düzenleme formu dolu gelmedi');
    await p.fill('#gd-tutar', '2.650');
    await p.locator('#gd-kaydet').click(); await p.waitForTimeout(1200);
    const sonra = (await api('/api/gider?ay=' + ay)).d.giderler;
    esit((sonra.find((g) => g.aciklama === 'E2E elektrik') || {}).tutar, 2650, 'düzenleme sunucuya yazılmadı ("2.650" = 2650)');
    // "+" → o kategoriye yeni gider
    await p.locator('.gd-kat', { hasText: 'Kira' }).locator('.gd-arti').click();
    esit(await p.locator('.gd-cip.on').innerText(), 'Kira', '+ kategoriyi seçmedi');
    await p.fill('#gd-tutar', '350,50'); await p.fill('.gd-not', 'E2E aidat makbuzu');
    await p.locator('#gd-kaydet').click(); await p.waitForTimeout(1200);
    const yeni = (await api('/api/gider?ay=' + ay)).d.giderler.find((g) => g.aciklama === 'E2E aidat makbuzu');
    dogrula(yeni && yeni.tutar === 350.5 && yeni.kategori === 'Kira', 'yeni gider yanlış: ' + JSON.stringify(yeni));
    // formdan sil
    await p.locator('.gd-kayit', { hasText: 'E2E aidat makbuzu' }).click();
    await p.locator('.gd-form .gd-btn.sil').click();
    await p.locator('#onay-evet-btn').click(); await p.waitForTimeout(1200);
    dogrula(!(await api('/api/gider?ay=' + ay)).d.giderler.some((g) => g.aciklama === 'E2E aidat makbuzu'), 'silinmedi');
    // hedefleri düzenle
    await p.locator('.gd-link', { hasText: 'Hedefleri düzenle' }).click();
    await p.locator('.gd-kat', { hasText: 'Fatura' }).locator('.gd-hedef').fill('5000');
    await p.locator('.gd-btn', { hasText: 'Hedefleri kaydet' }).click(); await p.waitForTimeout(800);
    esit(JSON.parse((await api('/api/meta/gider_butce')).d.value).Fatura, 5000, 'hedef kaydedilmedi');
    dogrula(!(await p.locator('.gd-kat', { hasText: 'Fatura' }).evaluate((e) => e.classList.contains('asti'))), 'yeni hedefte Fatura aşmış görünmemeli');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('gider: aşım rengi, kategori kayıtları, düzenle (PUT), + ile ekle (350,50), sil, hedef kaydet');
  } finally {
    for (const g of (await api('/api/gider?ay=' + ay)).d.giderler) if (!ek.includes(g.id) && /^E2E/.test(g.aciklama || '')) await api('/api/gider/' + g.id, { method: 'DELETE' });
    await api('/api/meta/gider_butce', { method: 'PUT', body: JSON.stringify({ value: eskiButce }) });
    await ctx.close();
  }
}
