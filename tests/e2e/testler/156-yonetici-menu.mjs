// 📱 Yönetici menüsü (v449, kullanıcı: "bu kısım çok iğrenç duruyor"): hizalı iki sütun, canlı kartlar, arama (ekran + sporcu),
// kapatma düğmesi ve alt çubuk menü açıkken de görünür (eskiden ekranı kaplıyor, çıkış yoktu). Masaüstü kenar menüsü aynı liste + ikonlar.
import { sayfaAc, uygulamaAc, yoneticiAc, dogrula, esit } from '../yardimci.mjs';
export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 844 });
  try {
    await uygulamaAc(p); await yoneticiAc(p); await p.waitForTimeout(800);
    const menuDugme = p.locator('#yon-bottom-nav button', { hasText: 'Menü' });
    await menuDugme.click(); await p.waitForSelector('#ym-liste .ym-kart');
    const o = await p.evaluate(() => {
      const r = (e) => e.getBoundingClientRect(), k = [...document.querySelectorAll('#ym-liste .ym-kart')].map(r), g = [...document.querySelectorAll('#ym-liste .ym-oge')].map(r), say = YONETICI_BOLUMLER.flatMap((x) => x[1]).length;
      const b = document.querySelector('#yon-bottom-nav button:last-child'), br = r(b), ust = document.elementFromPoint(br.left + br.width / 2, br.top + br.height / 2);
      return { kart: k.length, oge: g.length, say, genis: new Set(g.map((x) => Math.round(x.width))).size, sol: new Set(g.map((x) => Math.round(x.left))).size, kisa: Math.min(...g.map((x) => x.height)), nav: b.contains(ust), svg: document.querySelectorAll('#yon-diger-sheet .ym-kart .ym-ik svg, #yon-diger-sheet .ym-oge .ym-ik svg').length, tas: document.getElementById('yon-diger-sheet').scrollWidth > document.getElementById('yon-diger-sheet').clientWidth + 1 };
    });
    esit(o.kart, 4, 'kart'); esit(o.kart + o.oge, o.say - 2, 'Genel Bakış ve Velilere Gönder (üstte ayrı bant) dışındaki bütün ekranlar menüde'); esit(o.svg, o.kart + o.oge, 'her öğede ikon');
    esit(o.genis, 1, 'kutular aynı genişlikte'); esit(o.sol, 2, 'iki hizalı sütun'); dogrula(o.kisa >= 52, 'dokunma boyu'); dogrula(o.nav, 'alt çubuk menü açıkken de dokunulur'); dogrula(!o.tas, 'yatay taşma');
    if (process.env.E2E_EKRAN) { await p.waitForTimeout(800); await p.screenshot({ path: process.env.E2E_EKRAN + '-m1.png' }); await p.evaluate(() => { let s = document.getElementById('yon-diger-sheet'); s.scrollTop = s.scrollHeight; }); await p.waitForTimeout(200); await p.screenshot({ path: process.env.E2E_EKRAN + '-m2.png' }); await p.evaluate(() => { document.getElementById('yon-diger-sheet').scrollTop = 0; }); }
    // kapatma: ✕ ve alt çubuk
    await p.locator('.ym-kapat').click(); dogrula(!(await p.locator('#yon-diger-sheet').isVisible()), '✕ kapatmalı');
    await menuDugme.click(); await menuDugme.click(); dogrula(!(await p.locator('#yon-diger-sheet').isVisible()), 'Menü düğmesi kapatmalı');
    // arama: ekran (anlam kelimesiyle) + sporcu
    await menuDugme.click(); await p.fill('#ym-ara', 'birleştir');
    esit((await p.locator('#ym-liste .ym-oge b').allTextContents()).join(), 'Çift Kayıt', 'anlam kelimesiyle arama');
    const sp = await p.evaluate(() => { let g = AIDAT_GRUPLAR.find((x) => Object.keys(turnuvaDB[x] || {}).length), ad = Object.keys(turnuvaDB[g])[0]; return { g, ad }; });
    await p.fill('#ym-ara', sp.ad); await p.waitForSelector('.ym-sporcu button');
    if (process.env.E2E_EKRAN) { await p.fill('#ym-ara', 'de'); await p.screenshot({ path: process.env.E2E_EKRAN + '-m3.png' }); await p.fill('#ym-ara', sp.ad); }
    await p.locator('.ym-sporcu button').first().click(); await p.waitForSelector('#yn-kart h2', { timeout: 10000 });
    esit(await p.locator('#yn-kart h2').textContent(), sp.ad, 'sporcu profili'); await p.evaluate(() => ynKartKapat());
    // öğe → ekran
    await menuDugme.click(); await p.locator('#ym-liste .ym-oge', { hasText: 'Çift Kayıt' }).click(); await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => yoneticiSekmeAktif === 'ciftkayit' && !document.getElementById('yon-diger-sheet').classList.contains('acik')), 'ekrana gitmeli, menü kapanmalı');
    // açık tema + masaüstü
    if (process.env.E2E_EKRAN) { await p.evaluate(() => document.body.classList.add('light-theme')); await menuDugme.click(); await p.waitForTimeout(400); await p.screenshot({ path: process.env.E2E_EKRAN + '-m4.png' }); await p.evaluate(() => { document.body.classList.remove('light-theme'); yoneticiDigerSheetAcKapat(); }); }
    await p.setViewportSize({ width: 1366, height: 900 }); await p.evaluate(() => yoneticiSekme('panel')); await p.waitForTimeout(400);
    esit(await p.locator('#yon-sidebar-nav .yon-sidebar-btn svg').count(), o.say + 1, 'kenar menüsünde ikonlar');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-m5.png' });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
  } finally { await ctx.close(); }
}
