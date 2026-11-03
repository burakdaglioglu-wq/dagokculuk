// Karışık Sınıf ana ekranı — v373 SADE (2026-11-03, kullanıcı: "hocalarım karışık sınıfı kullanıyor ama karışık geliyor — sade,
// bilgilendirici ikonlu, Nike uygulaması gibi; ağırlıklı yarışma, oyun ve Form Lab"). Yarışma (Yeni yarışma + TV), Oyun (son oyun
// kaldığı yerden), Form Lab, Skor Gir; üstte Yoklama ve "Kim ne yapıyor?" şeritleri; altta Yeni sınıf · Yeni sporcu · Diğer araçlar
// (eski gruplu ızgara, açık/kapalı hatırlanır). Telefonda yana taşma yok.
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
      dogrula(await p.evaluate(() => document.getElementById('karisik-platform').classList.contains('ks-ana-acik')), 'sade zemin sınıfı yok');
      const yazi = (await p.locator('#karisik-platform').innerText()).toLocaleLowerCase('tr-TR'); // başlıklar büyük harfle görünür
      for (const k of ['Yoklama', 'Kim ne yapıyor?', 'Yarışma', 'TV', 'Oyun', 'Ortak Canavar', 'Form Lab', 'Skor Gir', 'Yeni sınıf', 'Yeni sporcu', 'Diğer araçlar']) dogrula(yazi.includes(k.toLocaleLowerCase('tr-TR')), k + ' yok');
      dogrula(/yeni yarışma|devam et/.test(yazi), 'Yarışma kartında Yeni yarışma / Devam et yok');
      dogrula(await yataydaTasmaYok(p), 'yatay taşma');
      // Diğer araçlar: kapalı başlar, dokununca gruplu ızgara açılır ve hatırlanır
      dogrula(await p.locator('#km-arac-diger').isHidden(), 'Diğer araçlar kapalı başlamalı');
      await p.locator('.ks-alt-is button', { hasText: 'Diğer araçlar' }).click();
      await p.waitForTimeout(300);
      dogrula(await p.locator('#km-arac-govde button.km-arac', { hasText: 'Tanıtım Ekranı' }).first().isVisible(), 'Diğer araçlar açılmadı');
      esit(await p.evaluate(() => localStorage.getItem('dagsk_km_diger_acik')), '1', 'açık durumu hatırlanmadı');
      await p.evaluate(() => kmAracIzgaraCiz());
      dogrula(await p.locator('#km-arac-diger').isVisible(), 'yeniden çizimde kapandı');
      dogrula(await yataydaTasmaYok(p), 'yatay taşma (Diğer açık)');
      if (w > 1000) {
        await p.locator('.ks-karo', { hasText: 'Oyun' }).click(); await p.waitForTimeout(800);
        esit(await p.evaluate(() => _kmOyunAktifTema), 'canavar', 'son oyun açılmadı');
        dogrula(await p.locator('#km-oyun-panel-canavar').isVisible(), 'canavar sahnesi görünmüyor');
        await p.locator('button:has-text("Karışık Sınıf")').first().click();
        dogrula(await p.evaluate(() => document.getElementById('karisik-platform').classList.contains('ks-ana-acik')), 'geri dönünce sade zemin yok');
        await p.locator('.ks-karo', { hasText: 'Form Lab' }).click(); await p.waitForTimeout(500);
        esit(await p.evaluate(() => _kmAktifSekme), 'formlab', 'Form Lab açılmadı');
        dogrula(!(await p.evaluate(() => document.getElementById('karisik-platform').classList.contains('ks-ana-acik'))), 'araçtayken sade zemin kalmamalı');
        await p.locator('button:has-text("Karışık Sınıf")').first().click();
        await p.locator('.ks-yarisma-bas').click();
        await p.waitForFunction(() => typeof yzOku === 'function' && _kmAktifSekme === 'yarisma', null, { timeout: 20000 });
      }
      await p.evaluate(() => localStorage.setItem('dagsk_km_diger_acik', '0'));
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
  }
  log('KM sade ana ekran: Yarışma/Oyun/Form Lab/Skor, şeritler, Diğer araçlar; 1280/390/360 taşma yok ✓');
}
