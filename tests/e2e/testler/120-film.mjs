// 🎬 Okçuluk filmi (v405): Karışık Sınıf aracı açar, ▶ İzle oynatır (zaman ilerler, altyazı çıkar), 186 sn'nin her yarım saniyesi hatasız çizilir,
// sarma, duraklatma, kapat (overlay kalkar), 390 px'te taşmaz; önemli anların görüntüleri _cikti/film-*.png.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1600, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    // araç kaydı + açılış
    await p.evaluate(() => dagskEkYukle('dagsk-km-sade.js'));
    const arac = await p.evaluate(() => ({ grup: KM_ARAC_GRUPLAR.some((g) => g.idler.includes('film')), sade: typeof KS_YENILER !== 'undefined' ? KS_YENILER[0].id : 'yok' }));
    dogrula(arac.grup, 'film araç grubunda yok'); esit(arac.sade, 'film', 'Yeni özellikler listesinde ilk sırada');
    await p.evaluate(() => kmAracSec('film'));
    await p.waitForSelector('#dfm #dfm-basla', { timeout: 20000 });
    await p.waitForTimeout(1500); // fotoğraflar yüklensin
    await p.click('#dfm-basla');
    await p.waitForTimeout(2500);
    const oyn = await p.evaluate(() => ({ t: _dfmIc.durum.t, dur: _dfmIc.durum.duraklat }));
    dogrula(oyn.t > 1 && !oyn.dur, 'film oynamıyor: ' + JSON.stringify(oyn));
    // her yarım saniye hatasız çizilir
    const tara = await p.evaluate(async () => { document.getElementById('dfm-oynat').click(); for (let t = 0; t <= _dfmIc.SURE; t += .5) _dfmIc.ciz(t); return { hata: _dfmIc.hatalar.slice(), sure: _dfmIc.SURE, sahne: _dfmIc.SAHNE.length, satir: _dfmIc.ANLATIM.length }; });
    esit(tara.hata.length, 0, 'sahne çizim hatası: ' + tara.hata.join(' | '));
    dogrula(tara.sure >= 170 && tara.sure <= 200, 'süre yaklaşık 3 dk olmalı: ' + tara.sure);
    // altyazı zamanında
    const alt = await p.evaluate(() => { _dfmIc.ciz(58.5); return document.getElementById('dfm-alt').textContent; });
    dogrula(/Parmaklarınla çekersin/i.test(alt), 'altyazı: ' + alt);
    // önemli anlar
    for (const t of [9.7, 11.8, 22, 46, 57, 76, 95, 110, 117.4, 126, 146, 149.4, 156, 162, 169, 175, 181.4]) {
      await p.evaluate((t) => _dfmIc.ciz(t), t); await p.waitForTimeout(60);
      await p.locator('#dfm-cv').screenshot({ path: 'tests/e2e/_cikti/film-' + String(t).replace('.', '_') + '.png' });
    }
    // sarma + bitiş ekranı
    await p.evaluate(() => _dfmIc.sar(185.5)); await p.click('#dfm-oynat'); await p.waitForTimeout(1500);
    dogrula(await p.evaluate(() => document.getElementById('dfm').classList.contains('bitti')), 'bitiş ekranı çıkmadı');
    // 390 px
    await p.evaluate(async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {} }); await p.waitForTimeout(300);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    const tel = await p.evaluate(() => { const c = document.getElementById('dfm-cv').getBoundingClientRect(); return { sigiyor: c.width <= innerWidth + 1, tasma: document.documentElement.scrollWidth <= innerWidth + 1 }; });
    dogrula(tel.sigiyor && tel.tasma, '390 px: ' + JSON.stringify(tel));
    await p.click('#dfm-son-kapat');
    esit(await p.locator('#dfm').count(), 0, 'kapatınca film kalkmalı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(tara.sahne + ' sahne · ' + tara.satir + ' anlatım satırı · ' + tara.sure + ' sn · oynar · her 0,5 sn hatasız · altyazı · bitiş · 390 px · kapat');
  } finally {
    await ctx.close();
  }
}
