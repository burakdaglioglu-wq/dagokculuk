// 🏹 Sporcu profili › Oklar (v452, kullanıcı: "attığı oklar, ısı haritası, puan ortalaması, en fazla nereye gitmiş, en çok yapabileceği
// hataları büyük yazılarla"): yön, oran, puan, filtre, olası hata + odak; sıkı ama kayık grupta önce nişangah; konum yoksa açık mesaj.
// Ayrıca profil Genel Bakış'tan (ynKartAc) açılınca modüller yüklenir (giriş kodu düğmeleri soluk kalıyordu).
import { sayfaAc, uygulamaAc, yoneticiAc, api, benzersiz, dogrula, esit } from '../yardimci.mjs';
const AD = benzersiz('OK TEST '), G = 'yildizlar';
export default async function ({ log }) {
  await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: G, ad: AD, lastModified: Date.now() }) });
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 844 });
  try {
    await uygulamaAc(p); await yoneticiAc(p);
    await p.waitForFunction(({ g, ad }) => turnuvaDB[g] && turnuvaDB[g][ad], { g: G, ad: AD }, { timeout: 30000 });
    await p.waitForFunction(() => document.querySelector('#yn-genel .ap-kpi') && typeof ynKartAc === 'function', null, { timeout: 30000 });
    // sol alta kayık ve geniş 120 ok; 4 gün × 6 seri × 5 ok, gün sonunda puan düşer
    await p.evaluate(({ g, ad }) => {
      let h = 7, rnd = () => { h = (h * 16807) % 2147483647; return h / 2147483647; }, nrm = () => Math.sqrt(-2 * Math.log(rnd() || 1e-6)) * Math.cos(6.283185 * rnd());
      let sp = turnuvaDB[g][ad]; sp.kartGecmisi = []; sp.seriler = []; sp.detayliOklar = []; sp.yay = 'Klasik';
      const kart = (mx, my, yay, gun, n) => { let d = new Date(); d.setDate(d.getDate() - gun); let t = bugunISO(d), k = { tarih: t, seriler: [], detayliOklar: [] }; for (let s = 0; s < n; s++) { let o = []; for (let i = 0; i < 5; i++) { let e = 1 + s * 0.16, x = +(mx + nrm() * yay * e).toFixed(1), y = +(my + nrm() * yay * e).toFixed(1), r = Math.hypot(x, y) / 10, v = r >= 10 ? 'M' : String(Math.max(1, 10 - Math.floor(r))); o.push(v); k.detayliOklar.push({ puan: v, x, y, tip: '10ring', t: d.getTime() + s * 1000 + i }); } k.seriler.push({ seriId: 'o' + gun + '_' + s + ad, oklar: o, puan: 0, tarih: t, t: d.getTime() + s * 60000 }); } k.toplamSkor = 100; return k; };
      window.__kart = kart; [3, 6, 10, 13].forEach((g2) => sp.kartGecmisi.push(kart(-16, 20, 17, g2, 6)));
      sp.seriler = [{ seriId: 'konumsuz' + ad, oklar: ['9', '9', '9'], puan: 27, tarih: bugunISO(), t: Date.now() }];
    }, { g: G, ad: AD });
    // Genel Bakış'taki yol: doğrudan ynKartAc → modüller yüklenir
    await p.evaluate(({ g, ad }) => ynKartAc(g + '|' + ad), { g: G, ad: AD });
    await p.waitForSelector('#yn-b-oklar .okh-yon', { timeout: 20000 });
    await p.waitForFunction(() => typeof sgGonder === 'function' && typeof gelisimPanelHTML === 'function' && document.getElementById('gp-panel'), null, { timeout: 15000 });
    const bek = await p.evaluate(({ g, ad }) => { const T = okhTest, N = T.noktalar(g, ad), gr = T.grup(N), o = T.puanOzet(T.seriler(g, ad)); let el = [].concat(...turnuvaDB[g][ad].kartGecmisi.map((k) => k.detayliOklar)); return { n: N.length, mx: gr.mx, my: gr.my, ort: o.ort, ok: o.n, solAlt: el.filter((q) => Math.hypot(q.x, q.y) > 10 && q.x < 0 && q.y > 0 && Math.abs(Math.atan2(q.y, -q.x) - Math.PI / 4) < Math.PI / 8).length, say3: gr.say[3] }; }, { g: G, ad: AD });
    esit(bek.n, 120, 'ok yeri sayısı'); esit(bek.ok, 123, 'puan ortalamasına konumsuz oklar da girer'); dogrula(bek.mx < -10 && bek.my > 12, 'grup merkezi'); esit(bek.say3, bek.solAlt, 'sol alt sayısı');
    const t = await p.locator('#yn-b-oklar').textContent();
    dogrula(/SOL ALTA GİDİYOR/.test(t), 'yön büyük yazıyla'); dogrula(t.includes(bek.ort.toFixed(1).replace('.', ',')), 'ortalama'); dogrula(/123 okun 120 tanesinin yeri biliniyor/.test(t), 'kaç okun yeri var');
    const boy = await p.evaluate(() => ({ yon: parseFloat(getComputedStyle(document.querySelector('.okh-yon b')).fontSize), hata: parseFloat(getComputedStyle(document.querySelector('.okh-h h4')).fontSize), n: document.querySelectorAll('.okh-h').length, ad: document.querySelector('.okh-h h4').textContent, kanit: document.querySelector('.okh-h .kanit').textContent, tas: document.getElementById('yn-kart').scrollWidth > document.getElementById('yn-kart').clientWidth + 1, img: !!document.querySelector('.okh-hedef image') }));
    dogrula(boy.yon >= 24 && boy.hata >= 20 && boy.n >= 2 && boy.img && !boy.tas, 'büyük yazı / hata / ısı / taşma ' + JSON.stringify(boy)); dogrula(/aşağıda|solda|düşüyor/.test(boy.kanit), 'kanıt: ' + boy.kanit);
    if (process.env.E2E_EKRAN) { await p.evaluate(() => ynBolum('oklar')); await p.waitForTimeout(1900); await p.screenshot({ path: process.env.E2E_EKRAN + '-o1.png' }); await p.setViewportSize({ width: 390, height: 2300 }); await p.evaluate(() => ynBolum('oklar')); await p.waitForTimeout(1500); await p.screenshot({ path: process.env.E2E_EKRAN + '-o2.png', clip: { x: 0, y: 560, width: 390, height: 1700 } }); await p.setViewportSize({ width: 390, height: 844 }); }
    // 9 yön düğmesi: oranlar toplamı, dokununca süzer
    const y = await p.evaluate(() => [...document.querySelectorAll('.okh-9 b')].reduce((a, b) => a + +b.textContent.slice(1), 0)); dogrula(y >= 96 && y <= 104, 'oranlar toplamı ' + y);
    await p.locator('.okh-9 button[aria-label^="sol alt"]').click(); dogrula((await p.locator('.okh-suz').textContent()).includes(bek.say3 + ' ok'), 'yön süzgeci');
    await p.locator('.okh-suz .ap-btn').click(); await p.locator('.okh-dag button').first().click(); dogrula(/10 puanlık/.test(await p.locator('.okh-suz').textContent()), 'puan süzgeci');
    await p.locator('.okh-seg button', { hasText: 'Son 30 ok' }).click(); esit(await p.evaluate(() => document.querySelectorAll('.okh-hedef > circle > title').length), 30, 'son 30 ok noktası');
    await p.locator('.okh-seg button', { hasText: 'Tümü' }).click();
    // odak (Teknik Koçluk ile ortak kayıt; sunucuya yazmadan)
    await p.evaluate(() => { window.__odak = null; kcOdakYaz = function (g, ad, k) { window.__odak = [g, ad, k]; }; });
    await p.locator('.okh-h .ap-btn.ana').first().click(); const od = await p.evaluate(() => window.__odak); dogrula(od && od[1] === AD && od[2].hata && od[2].cumle, 'odak kaydı ' + JSON.stringify(od));
    // sıkı ama kayık grup → önce nişangah; makaralıda klasik hatası çıkmaz
    const nis = await p.evaluate(({ g, ad }) => { let sp = turnuvaDB[g][ad]; sp.kartGecmisi = [__kart(30, -22, 4, 2, 6)]; sp.seriler = []; sp.yay = 'Makaralı'; ynKartCiz(); return { ilk: document.querySelector('.okh-h h4').textContent, ids: [...document.querySelectorAll('.okh-h h4')].map((x) => x.textContent).join('|'), yon: document.querySelector('.okh-yon b').textContent }; }, { g: G, ad: AD });
    dogrula(/Önce nişangahı yukarı ve sağa al/.test(nis.ilk) && /SAĞ ÜSTE/.test(nis.yon), 'nişangah önerisi ' + JSON.stringify(nis)); dogrula(!/parmakla/.test(nis.ids), 'makaralıda klasik hatası olmamalı');
    // konum yoksa uydurmaz
    const yok = await p.evaluate(({ g, ad }) => { let sp = turnuvaDB[g][ad]; sp.kartGecmisi = []; sp.seriler = [{ seriId: 'z' + ad, oklar: ['9', '8', '7'], puan: 24, tarih: bugunISO(), t: Date.now() }]; ynKartCiz(); return { t: document.getElementById('yn-b-oklar').textContent, svg: !!document.querySelector('.okh-hedef'), h: document.querySelectorAll('.okh-h').length }; }, { g: G, ad: AD });
    dogrula(/Okların yeri henüz girilmemiş/.test(yok.t) && !yok.svg && yok.h === 0 && /8,0/.test(yok.t), 'konum yokken');
    if (process.env.E2E_EKRAN) { await p.setViewportSize({ width: 1366, height: 900 }); await p.evaluate(({ g, ad }) => { let sp = turnuvaDB[g][ad]; sp.yay = 'Klasik'; sp.kartGecmisi = [3, 6, 10, 13].map((x) => __kart(-16, 20, 17, x, 6)); ynKartCiz(); ynBolum('oklar'); }, { g: G, ad: AD }); await p.waitForTimeout(1900); await p.screenshot({ path: process.env.E2E_EKRAN + '-o4.png' }); }
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
  } finally { await ctx.close(); await api(`/api/athletes/${G}/${encodeURIComponent(AD)}`, { method: 'DELETE' }).catch(() => {}); }
}
