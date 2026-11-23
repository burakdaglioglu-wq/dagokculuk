// 🔒 Aidat kilidi (v450): rakam tuşları, noktalar kesilmez, yanlış PIN ekranda yazar, arka plan yenilemesi yazılanı silmez, harfli PIN,
// klavye; üst çubuk ve sayı şeridi 390 px'te kesilmez. PIN denemeleri sahte yanıtla (gerçek kilit sayacına dokunmaz).
import { sayfaAc, uygulamaAc, yoneticiAc, dogrula, esit } from '../yardimci.mjs';
export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 780 });
  try {
    await uygulamaAc(p); await yoneticiAc(p); await p.waitForTimeout(500);
    await p.evaluate(() => { const f = window.fetch; window.__denenen = []; window.fetch = (u, o) => { if (String(u).indexOf('/api/giris/aidat-dogrula') === 0) { let pin = JSON.parse(o.body).pin; window.__denenen.push(pin); let ok = pin === '12345678' || pin === 'Harfli9'; return Promise.resolve(new Response(JSON.stringify(ok ? { ok: true } : { error: 'yanlis-pin' }), { status: ok ? 200 : 401, headers: { 'content-type': 'application/json' } })); } return f(u, o); }; localStorage.removeItem('dag_aidat_kilit_yazi'); _aidatKilitAcikMi = false; yoneticiSekme('aidat'); });
    await p.waitForSelector('#akl .akl-tus');
    const bas = async (s) => { for (const c of s) await p.locator('.akl-tus', { hasText: new RegExp('^' + c + '$') }).click(); };
    await bas('12345678');
    const o = await p.evaluate(() => { let n = document.getElementById('akl-noktalar'), r = n.getBoundingClientRect(), s = document.getElementById('yon-serit'), sb = [...s.children].map((x) => x.getBoundingClientRect()); let t = document.querySelector('.akl-tus.tamam').getBoundingClientRect(), alt = document.getElementById('yon-bottom-nav').getBoundingClientRect(); return { dolu: n.querySelectorAll('.dolu').length, tas: n.scrollWidth > n.clientWidth + 1, tus: Math.min(...[...document.querySelectorAll('.akl-tus')].map((x) => Math.min(x.getBoundingClientRect().height, x.getBoundingClientRect().width))), serit: sb.length, seritTas: Math.max(...sb.map((x) => x.right)) > innerWidth, gorunur: t.bottom <= alt.top }; });
    esit(o.dolu, 8, '8 nokta'); dogrula(!o.tas && o.tus >= 48, 'noktalar kesilmez, tuşlar büyük ' + JSON.stringify(o)); dogrula(o.serit === 4 && !o.seritTas, 'sayı şeridi kesilmez'); dogrula(o.gorunur, 'tuşlar kaydırmadan görünür');
    await p.evaluate(() => egitmenRenderAidat()); esit(await p.evaluate(() => _aklBuf), '12345678', 'yenileme PIN\'i silmemeli');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-k1.png' });
    await p.locator('.akl-tus.yan').click(); await p.locator('.akl-tus.tamam').click();
    await p.waitForFunction(() => /hatalı/.test(document.getElementById('akl-mesaj').textContent)); esit(await p.evaluate(() => _aklBuf), '', 'yanlış PIN temizlenir');
    if (process.env.E2E_EKRAN) { await p.waitForTimeout(500); await p.screenshot({ path: process.env.E2E_EKRAN + '-k2.png' }); }
    await bas('12345678'); await p.locator('.akl-tus.tamam').click(); await p.waitForFunction(() => _aidatKilitAcikMi && !document.getElementById('akl'), null, { timeout: 10000 });
    // harfli PIN + bu cihazda hatırlanır; klavye
    await p.evaluate(() => { yoneticiSekme('panel'); yoneticiSekme('aidat'); }); await p.locator('.akl-mod').click(); await p.fill('#aidat-kilit-pin', 'Harfli9');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-k3.png' });
    await p.locator('.akl-ac').click(); await p.waitForFunction(() => _aidatKilitAcikMi && !document.getElementById('akl'));
    await p.evaluate(() => { yoneticiSekme('panel'); yoneticiSekme('aidat'); }); dogrula(await p.locator('#aidat-kilit-pin').isVisible(), 'yazı seçimi hatırlanmalı'); await p.locator('.akl-mod').click();
    await p.setViewportSize({ width: 1366, height: 800 }); await p.evaluate(() => document.activeElement && document.activeElement.blur());
    await p.keyboard.type('12345678'); esit(await p.evaluate(() => _aklBuf), '12345678', 'klavye'); if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-k4.png' });
    await p.keyboard.press('Enter'); await p.waitForFunction(() => _aidatKilitAcikMi && !document.getElementById('akl'));
    esit(await p.evaluate(() => window.__denenen.join()), '1234567,12345678,Harfli9,12345678', 'her dokunuş tek deneme');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
  } finally { await ctx.close(); }
}
