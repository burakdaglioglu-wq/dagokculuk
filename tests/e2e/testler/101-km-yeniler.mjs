// Karışık Sınıf › Yeni özellikler (2026-11-04, v375 — kullanıcı: "yeni yaptıklarını karışık sınıf içerisinde yeni olarak kutucuğun yanında
// göster, hangi özellikler var ne işe yarıyor göster"). Skor Gir, Diğer araçlar ve Atış Ölçer kutusunda YENİ rozeti; ana ekrandaki satır
// özellikleri anlatan ekranı açar; düğmeler ilgili araca götürür; rozetler bitiş tarihinden sonra kalkar; telefonda yana taşma yok.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  for (const [w, h] of [[1280, 900], [390, 844], [360, 740]]) {
    const { ctx, p, hatalar } = await sayfaAc({ genislik: w, yukseklik: h });
    try {
      await uygulamaAc(p);
      await karisikSinifArac(p, 'oyunlar');
      await p.evaluate(() => { kmOyunTemaSec('canavar'); localStorage.setItem('dagsk_km_diger_acik', '0'); });
      await p.locator('button:has-text("Karışık Sınıf")').first().click();
      await p.waitForSelector('#km-arac-ana .ks-yarisma', { timeout: 20000 });
      dogrula(await p.evaluate(() => !kmYeniMi('2026-12-06') && kmYeniMi('2026-12-05')), 'bitiş tarihi hesabı yanlış');
      if (!await p.evaluate(() => kmYeniMi())) { dogrula(await p.locator('.km-yeni').count() === 0, 'süresi bitince rozet kalmamalı'); log('rozet süresi bitti: yalnız kalkma denetlendi'); return; }
      dogrula(await p.locator('.ks-satir[data-ana="skor"] .km-yeni').isVisible(), 'Skor Gir rozeti yok');
      dogrula(await p.locator('.ks-alt-is button', { hasText: 'Diğer araçlar' }).locator('.km-yeni').isVisible(), 'Diğer araçlar rozeti yok');
      dogrula(await yataydaTasmaYok(p), 'ana ekran yana taşıyor');
      // Rozet ikonun üstüne binmemeli
      dogrula(await p.evaluate(() => { const r = document.querySelector('.ks-alt-is .km-yeni'), b = r.getBoundingClientRect(), s = r.parentElement.querySelector('svg').getBoundingClientRect(); return b.bottom <= s.top + 1 || b.left >= s.right - 1 || b.right <= s.left + 1; }), 'Diğer araçlar rozeti ikona biniyor');
      await p.locator('.ks-alt-is button', { hasText: 'Diğer araçlar' }).click();
      await p.waitForTimeout(250);
      dogrula(await p.locator('#km-arac-govde button.km-arac', { hasText: 'Atış Ölçer' }).first().locator('.km-yeni').isVisible(), 'Atış Ölçer kutusunda rozet yok');
      // Anlatım ekranı
      await p.locator('.ks-yeniler').click();
      await p.waitForSelector('#ks-ekran [data-yeni="atisolcer"]', { timeout: 15000 });
      const yazi = await p.locator('#ks-ekran').innerText();
      for (const k of ['Tutuş süresi', 'Uygun süre', 'Sesli uyarı', 'bilgisayarda ölçmez', 'Emin değilse', 'Vegas 3\'lü']) dogrula(yazi.includes(k), 'anlatımda yok: ' + k);
      dogrula(await p.evaluate(() => { const e = document.getElementById('ks-ekran'); return e.scrollWidth <= e.clientWidth + 1; }), 'anlatım ekranı yana taşıyor');
      await p.locator('[data-yeni="atisolcer"] .ks-ana-btn').click();
      await p.waitForSelector('#hk .hk-baslik', { timeout: 15000 });
      dogrula(await p.evaluate(() => !document.getElementById('ks-ekran')), 'anlatım ekranı kapanmadı');
      esit(await p.evaluate(() => _hkIc.durum().yer), 'kol', 'varsayılan yer yay kolu olmalı');
      await p.evaluate(() => hkKapat());
      await p.locator('.ks-yeniler').click();
      await p.waitForSelector('[data-yeni="foto"] .ks-ana-btn');
      await p.locator('[data-yeni="foto"] .ks-ana-btn').click();
      await p.waitForFunction(() => getComputedStyle(document.getElementById('km-arac-izgara')).display === 'none');
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
      log(w + ' px: rozetler, anlatım ekranı, Atış Ölçer ve Skor Gir geçişi');
    } finally { await ctx.close(); }
  }
}
