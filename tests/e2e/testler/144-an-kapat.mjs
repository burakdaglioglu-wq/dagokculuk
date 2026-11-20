// 🎬 Büyük anı isteğe göre kapatma (2026-11-20, v437; kullanıcı ekran görüntüsü "BURAK 9 9 9 KRİTİK!" — "bunu isteğe göre kapatayım").
// Tam ekranda şeritteki 🎬 An düğmesi artık görünür; büyük anın köşesindeki "🎬 Bu ekranı kapat" anı bitirir ve cihazda hatırlanır.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  let yedek;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => localStorage.getItem('dag_km_an_kapali'));
    await p.evaluate(() => { localStorage.removeItem('dag_km_an_kapali'); kmOyunTemaSec('canavar'); });
    await p.waitForFunction(() => typeof anSeriGoster === 'function' && !!document.querySelector('#an-dug'), null, { timeout: 20000 });
    await p.evaluate(() => { document.querySelectorAll('.an-kural').forEach((x) => x.remove()); document.getElementById('km-oyun-wrap').classList.add('km-tam'); });
    const gor = await p.evaluate(() => { const d = document.getElementById('an-dug'); return { an: !!d && getComputedStyle(d).display !== 'none', kural: (() => { const k = document.getElementById('an-kural-dug'); return !!k && getComputedStyle(k).display !== 'none'; })() }; });
    dogrula(gor.an, 'tam ekranda 🎬 An düğmesi görünmeli');
    dogrula(!gor.kural, 'tam ekranda diğer şerit düğmeleri gizli kalmalı');

    // büyük an: köşede kapat düğmesi
    await p.evaluate(() => { const s = _kmOyunRosterCache[0]; window.__anBitti = 0; anSeriGoster('canavar', s, ['X', '9', '9'], () => { window.__anBitti++; }); });
    await p.waitForSelector('.an-perde.ac .an-kapat');
    await p.waitForTimeout(1500);
    await p.screenshot({ path: 'tests/e2e/_cikti/144-an.png' });
    await p.locator('.an-perde .an-kapat').click();
    await p.waitForTimeout(500);
    const s = await p.evaluate(() => ({ k: localStorage.getItem('dag_km_an_kapali'), perde: !!document.querySelector('.an-perde'), bitti: window.__anBitti, dug: document.getElementById('an-dug').textContent }));
    esit(s.k, '1', 'kapatma cihazda hatırlanmalı');
    dogrula(!s.perde, 'büyük an kapanmalı');
    esit(s.bitti, 1, 'oyun akışı devam etmeli (devam bir kez çağrılır)');
    esit(s.dug, '🎬 An: kapalı', 'şerit düğmesi kapalı yazmalı');

    // kapalıyken bir sonraki seri büyük an göstermez
    await p.evaluate(() => { anSeriGoster('canavar', _kmOyunRosterCache[0], ['X', 'X', 'X'], () => { window.__anBitti++; }); });
    await p.waitForTimeout(300);
    const k2 = await p.evaluate(() => ({ perde: !!document.querySelector('.an-perde'), bitti: window.__anBitti }));
    dogrula(!k2.perde, 'kapalıyken an çıkmamalı'); esit(k2.bitti, 2, 'kapalıyken oyun hemen devam etmeli');

    // şeritten geri açılır
    await p.locator('#an-dug').click();
    esit(await p.evaluate(() => localStorage.getItem('dag_km_an_kapali')), '0', '🎬 An ile geri açılmalı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('tam ekranda 🎬 An görünür · köşedeki "Bu ekranı kapat" anı bitirir + hatırlar · kapalıyken an yok · şeritten geri açılır');
  } finally {
    await p.evaluate((y) => { if (y == null) localStorage.removeItem('dag_km_an_kapali'); else localStorage.setItem('dag_km_an_kapali', y); document.getElementById('km-oyun-wrap')?.classList.remove('km-tam'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
