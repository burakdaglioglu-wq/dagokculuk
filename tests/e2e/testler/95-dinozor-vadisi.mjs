// 🦕 Sis Haritası › Dinozor Vadisi (2026-11-03, kullanıcı taslaklardan "Dinozor Vadisi — güzel sisli olsun"). Doğrulanan:
// vadi zemini ve sis tuvalden <image> olarak gelir (canlı filtre yok), 7 keşif dinozor adlarıyla, fosil kazısı (sarı halka
// = kemik, sporcuya yazılır, hedefe varınca dev dinozor bir kez), HUD, geri al öncesini geri yükler.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => localStorage.getItem(kmOyunSisKesifAnahtari()));
    await p.evaluate(() => { kmOyunTemaSec('sisharita'); if (typeof kmOyunModSec === 'function') kmOyunModSec(false); });
    await p.waitForFunction(() => /^(blob:|data:)/.test(document.getElementById('km-sis-sis-img').getAttribute('href') || ''), null, { timeout: 15000 });
    const sahne = await p.evaluate(() => ({
      zemin: /^(blob:|data:)/.test(document.getElementById('km-sis-zemin-img').getAttribute('href') || ''),
      yedek: document.getElementById('km-sis-sis-yedek').getAttribute('opacity'),
      filtreliSis: !!document.querySelector('.km-sis-katman [filter]'), bulut: !!document.querySelector('.km-sis-bulut'),
      adlar: KM_SIS_KESIF_TURLERI.map((t) => t.ad).join(','), sembol: KM_SIS_KESIF_TURLERI.every((t) => document.getElementById('km-sis-sym-' + t.id)),
      fener: (document.querySelector('#km-sis-fenerler circle') || { getAttribute: () => '' }).getAttribute('fill'),
      hud: document.getElementById('km-sis-hud').textContent, parca: document.getElementById('km-sis-parca').textContent }));
    dogrula(sahne.zemin && sahne.yedek === '0' && !sahne.filtreliSis && !sahne.bulut && sahne.sembol, 'sahne: ' + JSON.stringify(sahne));
    dogrula(/Üç Boynuzlu/.test(sahne.adlar) && /Yavru T-Rex/.test(sahne.adlar) && /url\(#km-sis-delik-g\)/.test(sahne.fener || 'url(#km-sis-delik-g)'), 'keşifler/fener: ' + JSON.stringify(sahne));
    dogrula(/Dinozor Vadisi/.test(sahne.hud) && /Fosil kazısı/.test(sahne.parca), 'HUD: ' + JSON.stringify(sahne));

    const fosil = await p.evaluate(() => {
      const s = _kmOyunRosterCache[0]; _kmSisFosil = { kemik: 0, kim: {}, tamam: false };
      kmSisFosilEkle(s, 0, ['X', '9', '5'], 0.1);
      const bir = { kemik: _kmSisFosil.kemik, kisi: _kmSisFosil.kim[s.ad] };
      kmSisFosilEkle(s, 0, ['8', '7', 'M'], 0.1);
      const iki = _kmSisFosil.kemik;
      let dev = 0; const eski = window.kmSisDevDinozor; window.kmSisDevDinozor = () => { dev++; };
      _kmSisFosil.kemik = kmSisFosilHedef() - 1; kmSisFosilEkle(s, 0, ['10', '10', '10'], 0.1); kmSisFosilEkle(s, 0, ['10'], 0.1);
      const parca = document.getElementById('km-sis-parca').textContent;
      const kayit = JSON.parse(localStorage.getItem(kmOyunSisKesifAnahtari())).fosil;
      window.kmSisDevDinozor = eski;
      return { bir, iki, tamam: _kmSisFosil.tamam, parca, kayit, hedef: kmSisFosilHedef() };
    });
    await p.waitForTimeout(1600);
    dogrula(fosil.bir.kemik === 2 && fosil.bir.kisi === 2 && fosil.iki === 2, 'kemik sayımı: ' + JSON.stringify(fosil));
    dogrula(fosil.tamam && fosil.kayit && fosil.kayit.tamam && /canlandı/.test(fosil.parca), 'iskelet tamam: ' + JSON.stringify(fosil));
    // hepsi sıfırla fosili de temizler (çekirdek mantık)
    await p.evaluate(() => { _kmSisFosil = { kemik: 0, kim: {}, tamam: false }; kmOyunSisKesifKaydet(); kmSisParcaCiz(); });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('tuvalden zemin + sis (filtre yok), 7 dinozor, fosil kazısı (X/10/9 = kemik, kişiye yazılır), iskelet tamam + kayıt, HUD');
  } finally {
    await p.evaluate((y) => { try { if (y) localStorage.setItem(kmOyunSisKesifAnahtari(), y); else localStorage.removeItem(kmOyunSisKesifAnahtari()); } catch (e) {} }, yedek).catch(() => {});
    await ctx.close();
  }
}
