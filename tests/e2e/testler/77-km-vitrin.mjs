// 📺 Tanıtım Ekranı Karışık Sınıf'ta da (2026-10-28, kullanıcı: "tanıtım bölümünü karışık sınıfın içinde de yap, TV ekranı tam
// ekran devam etsin"). Araç ızgarasındaki "Tanıtım Ekranı" kutusu ve Oyunlar kartının altındaki hızlı düğme — GERÇEK tıklamayla —
// vitrini tam ekran açar; sekme değişmez; kapatınca KM ızgarası yerinde kalır.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1600, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'skor');
    await p.evaluate(() => kmIzgaraGeriDon()); await p.waitForTimeout(500);
    const ac = async (loc, ne) => {
      dogrula(await loc.count(), ne + ' düğmesi yok');
      await loc.first().click();
      await p.waitForSelector('#vt', { timeout: 20000 });
      dogrula(await p.waitForFunction(() => !!document.fullscreenElement, null, { timeout: 3000 }).then(() => true, () => false), ne + ': tam ekran açılmadı'); // dosya önbellekteyse #vt tam ekran sözü bitmeden çıkar
      dogrula(await p.evaluate(() => _kmAktifSekme !== 'vitrin' && getComputedStyle(document.getElementById('km-arac-izgara')).display !== 'none'), ne + ': KM sekmesi değişti');
      await p.waitForTimeout(800);
      await p.evaluate(() => vtKapat()); await p.waitForFunction(() => !document.getElementById('vt') && !document.fullscreenElement, null, { timeout: 5000 }); await p.waitForTimeout(2500); // pencere eski boyuna dönsün (tam ekran çıkışı sürerken yeni istek reddedilir)
    };
    await ac(p.locator('#km-arac-govde button.km-arac', { hasText: 'Tanıtım Ekranı' }), 'ızgara');
    await ac(p.locator('.km-arac-hizli button', { hasText: 'Tanıtım Ekranı' }), 'Oyunlar hızlı');
    // arama da bulur
    await p.fill('#km-arac-ara', 'reklam'); await p.waitForTimeout(300);
    dogrula(await p.locator('#km-arac-govde button.km-arac:visible', { hasText: 'Tanıtım Ekranı' }).count(), 'aramada "reklam" Tanıtım Ekranı\'nı bulmadı');
    await p.fill('#km-arac-ara', '');
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
    log('KM ızgarası + Oyunlar hızlı düğmesi → tam ekran tanıtım; arama "reklam" bulur');
  } finally { await ctx.close(); }
}
