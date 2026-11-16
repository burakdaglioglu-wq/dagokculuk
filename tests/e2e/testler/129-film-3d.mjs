// 🎬 Okun Yolculuğu · 3B film (2026-11-16, v420). Karışık Sınıf araçlarında (Oyun & motivasyon) ve sade ana ekranın "Yeni" listesinde;
// açılır, oynar (zaman ilerler), çubuktan sarılır, altyazı sahneye göre değişir, 8 adım etiketi görünür, kapanır. WebGL yoksa düzgün uyarı verir.
// E2E_3B=1 ve --use-gl=angle ile gerçek 3B; aksi halde uyarı yolu test edilir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    const arac = await p.evaluate(() => ({ var: KM_ARAC_LISTESI.some((a) => a.id === 'film3d'), grup: KM_ARAC_GRUPLAR.some((g) => g.idler.includes('film3d')), yeni: typeof KS_YENILER === 'undefined' || KS_YENILER.some((y) => y.id === 'film3d') }));
    dogrula(arac.var && arac.grup, 'Karışık Sınıf aracı yok: ' + JSON.stringify(arac));
    dogrula(arac.yeni, 'Yeni listesinde yok');
    await p.evaluate(() => kmAracSec('film3d'));
    await p.waitForSelector('#df3', { timeout: 30000 }); await p.waitForTimeout(1200);
    const ucb = await p.evaluate(() => !!document.querySelector('#df3 .df3-tuval'));
    if (!ucb) {
      dogrula(/3B çizim açılamadı|kurulamadı/.test(await p.locator('#df3').innerText()), 'WebGL yokken uyarı yok');
      await p.click('#df3-kapat'); esit(await p.locator('#df3').count(), 0, 'kapanmadı');
      log('3B yok: uyarı + kapat (gerçek 3B için E2E_3B=1 ve --use-gl=angle)');
      return;
    }
    esit(await p.evaluate(() => _df3.SURE), 182, 'süre ~3 dk');
    await p.click('#df3-oynat'); await p.waitForTimeout(2200);
    const t1 = await p.evaluate(() => _df3.D.t);
    dogrula(t1 > 1 && t1 < 4, 'oynatma ilerlemedi: ' + t1);
    await p.click('#df3-oynat'); // duraklat
    // çubuktan sar: 8 adım bölümü
    await p.evaluate(() => dagFilm3dSar(74)); await p.waitForTimeout(500);
    dogrula(/ANKRAJ/.test(await p.locator('#df3-etiket').innerText()), '74. sn: 5. adım (ankraj) etiketi yok');
    dogrula(/ankraj/i.test(await p.locator('#df3-alt').innerText()), 'altyazı sahneye uymuyor');
    await p.evaluate(() => dagFilm3dSar(135)); await p.waitForTimeout(500);
    dogrula(/düdük/i.test(await p.locator('#df3-alt').innerText()), 'güvenlik altyazısı yok');
    esit(await p.locator('#df3-bolum').innerText(), 'GÜVENLİK', 'bölüm adı');
    await p.evaluate(() => dagFilm3dSar(181.5)); await p.click('#df3-oynat'); await p.waitForTimeout(1500);
    dogrula(/Tekrar izle/.test(await p.locator('#df3-oynat').innerText()), 'bitince Tekrar izle yok');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px taşıyor');
    await p.click('#df3-kapat'); await p.waitForTimeout(300);
    esit(await p.locator('#df3').count(), 0, 'kapanmadı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('3B film: araç + Yeni · oynar · sar · 8 adım etiketi · altyazı · bitiş · 390 px · kapat');
  } finally { await ctx.close(); }
}
