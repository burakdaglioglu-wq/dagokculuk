// 🎯 Sporcu giriş ekranı (v320). Kullanıcı (2026-10-26): "sporcu kartı giriş yerini daha kullanılabilir, kendini özel hissettiren,
// sade tatlı bir temaya getir". Test: isim yazınca öneri (Türkçe karakter / büyük-küçük harf farkı yok) → seç → kod kutusu;
// yanlış kod panelin içinde nazik hata (ayrıca toast yok); doğru kodla giriş; hatırlanan sporcuya kişisel karşılama (ilk ad)
// + "Ben değilim" formu açar; yazı kutusuna odaklanınca kart yana kaymaz (süs katmanı taşmıyor); telefonda taşma yok.
import { chromium } from 'playwright';
import { B, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const hatalar = []; p.on('pageerror', (e) => hatalar.push(e.message));
  try {
    const a = (await (await fetch(B + '/api/athletes')).json()).athletes.find((x) => x.ad === 'YoklamaTest');
    const kod = String(a.kod || a.dogumYili);
    await p.goto(B + '/app.html');
    await p.waitForFunction(() => typeof turnuvaDB !== 'undefined' && Object.keys(turnuvaDB.buyukler || {}).length > 0, null, { timeout: 60000 });
    await p.evaluate(() => { hatirlaTemizle(); let k = document.getElementById('kulup-secim-ekrani'); if (k) k.style.display = 'none'; platformSec('sporcu'); });
    await p.waitForSelector('#sgr-form', { state: 'visible' });
    // öneri: küçük harf, Türkçe karaktersiz
    await p.click('#sporcu-giris-ad');
    const kay = await p.evaluate(() => Math.round(document.getElementById('sgr-form').getBoundingClientRect().x - document.querySelector('.sgr-kart').getBoundingClientRect().x));
    dogrula(kay >= 15, 'odaklanınca kart kaydı: iç boşluk ' + kay);
    await p.keyboard.type('yoklamat', { delay: 20 });
    await p.waitForSelector('#sgr-oneri.acik button', { timeout: 3000 });
    dogrula(await p.locator('#sgr-oneri button', { hasText: 'YoklamaTest' }).count() === 1, 'öneride YoklamaTest yok');
    await p.locator('#sgr-oneri button', { hasText: 'YoklamaTest' }).click();
    await p.waitForFunction(() => document.activeElement && document.activeElement.id === 'sporcu-giris-kod', null, { timeout: 2000 }).catch(() => {});
    esit(await p.evaluate(() => document.activeElement.id), 'sporcu-giris-kod', 'seçince kod kutusuna geçmeli');
    dogrula(/YoklamaTest/.test(await p.locator('#sgr-secili').innerText()), 'seçili sporcu görünmeli');
    // yanlış kod: panelde nazik hata, toast yok
    await p.keyboard.type('0'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    dogrula(await p.locator('#sgr-hata').isVisible() && /Kod tutmadı/.test(await p.locator('#sgr-hata').innerText()), 'panelde hata yok');
    dogrula(!/Ad veya kod hatalı/.test(await p.evaluate(() => (document.getElementById('toast') || {}).textContent || '')) || !(await p.locator('#toast').isVisible()), 'panel açıkken ayrıca toast çıkmamalı');
    // doğru kod
    await p.fill('#sporcu-giris-kod', kod); await p.locator('.sgr-ana').click();
    await p.waitForFunction(() => loggedInSporcu === 'YoklamaTest', null, { timeout: 15000 });
    // hatırlanan: kişisel karşılama
    await p.evaluate(() => { loggedInSporcu = null; let g = document.getElementById('giris-ekrani'); g.style.display = 'flex'; document.getElementById('giris-platform').style.display = 'none'; platformSec('sporcu'); });
    await p.waitForSelector('#sgr-tanidik', { state: 'visible' });
    esit(await p.locator('#sgr-tanidik .sgr-isim').innerText(), 'YoklamaTest!', 'karşılamada ilk ad');
    await p.locator('#sgr-tanidik .sgr-ikinci').click();
    dogrula(await p.locator('#sgr-form').isVisible() && !(await p.locator('#sgr-tanidik').isVisible()), '"Ben değilim" formu açmalı');
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'telefonda taşma');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🎯 Sporcu giriş ekranı: öneri + seç → kod, nazik hata (toast yok), giriş, kişisel karşılama, Ben değilim, kart kaymıyor ✓');
  } finally {
    await p.evaluate(() => { try { hatirlaTemizle(); } catch (e) {} }).catch(() => {});
    await b.close();
  }
}
