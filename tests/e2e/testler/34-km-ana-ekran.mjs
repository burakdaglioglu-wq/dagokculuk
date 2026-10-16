// Karışık Sınıf ana ekranı (2026-10-16, kullanıcı: "oyunlar bölümünü de Form Lab ve Skor gibi büyük, farklı yap, yarışmayı da —
// hızlı aksiyon alalım"): 4 büyük kart (Skor Gir, Form Lab, Oyunlar, Yarışma); Oyunlar altında "▶ son oyun" + Yumurta, Yarışma
// altında Yarışma TV. Telefonda yana taşma yok.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const { ctx, p, hatalar } = await sayfaAc({ genislik: w, yukseklik: h });
    try {
      await uygulamaAc(p);
      await karisikSinifArac(p, 'oyunlar');
      await p.evaluate(() => kmOyunTemaSec('canavar'));
      await p.locator('button:has-text("Karışık Sınıf")').first().click();
      await p.waitForSelector('#km-arac-ana .km-arac-buyuk', { timeout: 20000 });
      esit(await p.locator('#km-arac-ana .km-arac-buyuk').count(), 4, 'büyük kart sayısı');
      const yazi = await p.locator('#km-arac-ana').innerText();
      for (const k of ['Skor Gir', 'Form Lab', 'Oyunlar', 'Yarışma', 'Yarışma TV', 'Yumurta Yuvası']) dogrula(yazi.includes(k), k + ' yok');
      dogrula(await yataydaTasmaYok(p), 'yatay taşma');
      if (w > 1000) {
        await p.locator('.km-arac-hizli button', { hasText: 'Ortak Canavar' }).click(); await p.waitForTimeout(800);
        esit(await p.evaluate(() => _kmOyunAktifTema), 'canavar', 'son oyun açılmadı');
        dogrula(await p.locator('#km-oyun-panel-canavar').isVisible(), 'canavar sahnesi görünmüyor');
        await p.locator('button:has-text("Karışık Sınıf")').first().click();
        await p.locator('#km-arac-ana .km-arac-buyuk', { hasText: 'Yarışma' }).click();
        await p.waitForFunction(() => typeof yzOku === 'function', null, { timeout: 20000 });
      }
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
  }
  log('KM ana ekranı: 4 büyük kart, son oyun hızlı düğmesi, Yarışma kartı ✓');
}
