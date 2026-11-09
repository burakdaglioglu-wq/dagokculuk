// Karma ders sadeleşti (2026-11-09, v397; kullanıcı: "derste olmayan sporcular da gözüküyor, karmakarışık, mola çalışmıyor").
// Oyunlar'daki Yarışma hattı paneli varsayılan KAPALI; açınca ☕ mola düğmeleri (modalsız, tam ekranda da çalışır);
// oyun köşesindeki sayaç molayı gösterir, "SÜRE BİTTİ" 8 sn sonra kalkar; sıra kartında 🚫 Bugün derste yok + Geri al.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 800 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => { const k = _kmAktifKonum || 'varsayilan'; return { liste: JSON.stringify(_kmListe), hat: localStorage.getItem('dag_km_hat_' + k), yz: localStorage.getItem('dag_km_yarismatur_' + k), karma: localStorage.getItem('dagsk_karma_ekran'), dok: localStorage.getItem('dagsk_karma_dok_acik'), yok: JSON.stringify(otomatikYoklamaDB[bugunISO()] || null) }; });
    // 2 sporcu Yarışma hattında, tur 1. seride; seri süresi çoktan bitmiş
    const kur = await p.evaluate(() => {
      const k = _kmAktifKonum || 'varsayilan', l = _kmListe.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]);
      const yar = l.slice(0, 2).map((s) => s.g + '|' + s.ad), h = {}; yar.forEach((x) => { h[x] = 'yarisma'; });
      localStorage.setItem('dag_km_hat_' + k, JSON.stringify(h)); localStorage.setItem('dagsk_karma_ekran', '1'); localStorage.removeItem('dagsk_karma_dok_acik');
      localStorage.setItem('dag_km_yarismatur_' + k, JSON.stringify({ durum: { asama: 'tur', id: 'ytest', ayar: { kategori: 'serbest', mesafe: '18m', format: 'salon', sure: 90, hedefBasi: 3, yuz: '6' }, katilimci: yar, hedefler: {}, seri: 0, basla: Date.now() - 600000 }, sayac: { basla: Date.now() - 200000, hazir: 10, sure: 90, seri: 0 } }));
      kmAracSec('oyunlar'); return { yar, n: l.length };
    });
    await p.waitForFunction(() => !!document.getElementById('yz-karma-dok') && !!document.getElementById('yz-oyun-sayac-kap'), null, { timeout: 20000 });
    await p.waitForTimeout(600);
    const d0 = await p.evaluate(() => ({ kapali: document.getElementById('yz-karma-dok').classList.contains('kapali'), sat: document.querySelectorAll('#yz-karma-dok .yzk-sat').length, sayac: getComputedStyle(document.getElementById('yz-oyun-sayac-kap')).display }));
    dogrula(d0.kapali && d0.sat === 0, 'Yarışma hattı paneli kapalı başlamalı: ' + JSON.stringify(d0));
    esit(d0.sayac, 'none', 'süresi çoktan bitmiş seride "SÜRE BİTTİ" köşede kalmamalı');

    // aç → ☕ 5 dk mola (modal yok) → oyun sayacı MOLA gösterir, başlıkta kalan süre
    await p.locator('#yz-karma-dok .yzk-bas').click(); await p.waitForTimeout(200);
    await p.locator('#yz-karma-dok .yzk-mola button', { hasText: '5 dk' }).click(); await p.waitForTimeout(700);
    const m = await p.evaluate(() => ({ mola: !!(yzOku().mola && yzOku().mola.sure === 300), modal: (document.getElementById('onay-modal') || { style: {} }).style.display, sayac: getComputedStyle(document.getElementById('yz-oyun-sayac-kap')).display, alt: document.querySelector('#yz-oyun-sayac .yz-sayac-alt').textContent, sure: document.querySelector('#yz-oyun-sayac .yz-sayac-sure').textContent, bas: document.querySelector('#yz-karma-dok .yzk-bas').textContent, bitir: !!document.querySelector('#yz-karma-dok .yzk-mola button[onclick="yzKarmaMola(0)"]') }));
    dogrula(m.mola && m.sayac !== 'none' && /MOLA/.test(m.alt) && /^[45]:\d\d$/.test(m.sure) && /☕ [45]:\d\d/.test(m.bas) && m.bitir, 'oyun ekranında mola: ' + JSON.stringify(m));
    await p.screenshot({ path: 'tests/e2e/_cikti/112-mola.png' });
    await p.locator('#yz-karma-dok .yzk-mola button[onclick="yzKarmaMola(0)"]').click(); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => !yzOku().mola && getComputedStyle(document.getElementById('yz-oyun-sayac-kap')).display === 'none'), 'mola bitince sayaç kalkmalı');

    // 🚫 Bugün derste yok → listeden, oyundan çıkar; yoklamaya gelmedi; Geri al
    const once = await p.evaluate(() => { const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i]; return { k: s.g + '|' + s.ad, ad: s.ad, n: _kmListe.length, oyun: _kmOyunRosterCache.length }; });
    await p.locator('.km-sk-yok').first().click(); await p.waitForTimeout(500);
    const yok = await p.evaluate((k) => { const ad = k.slice(k.indexOf('|') + 1), y = (otomatikYoklamaDB[bugunISO()] || {})[ad]; return { n: _kmListe.length, oyun: _kmOyunRosterCache.length, var: _kmListe.some((s) => s.g + '|' + s.ad === k), kayit: JSON.parse(localStorage.getItem(kmLocalAnahtari()) || '[]').length, gelmedi: !!(y && y.geldi === false), geri: !!document.querySelector('#km-oyun-wrap #km-yok-geri') }; }, once.k);
    dogrula(!yok.var && yok.n === once.n - 1 && yok.oyun === once.oyun - 1 && yok.kayit === yok.n && yok.geri, 'derste yok: ' + JSON.stringify(yok));
    await p.locator('#km-yok-geri button').click(); await p.waitForTimeout(400);
    const geri = await p.evaluate((k) => ({ n: _kmListe.length, var: _kmListe.some((s) => s.g + '|' + s.ad === k), oyun: _kmOyunRosterCache.length }), once.k);
    dogrula(geri.var && geri.n === once.n && geri.oyun === once.oyun, 'geri al: ' + JSON.stringify(geri));
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('panel kapalı başlar · bayat SÜRE BİTTİ gizli · ☕ mola panelden + oyun sayacında · 🚫 derste yok + geri al');
  } finally {
    if (yedek) await p.evaluate((y) => {
      const k = _kmAktifKonum || 'varsayilan', w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); };
      _kmListe = JSON.parse(y.liste); try { _kmListeKaydet(); } catch (e) {}
      w('dag_km_hat_' + k, y.hat); w('dag_km_yarismatur_' + k, y.yz); w('dagsk_karma_ekran', y.karma); w('dagsk_karma_dok_acik', y.dok);
      const yy = JSON.parse(y.yok); if (yy) otomatikYoklamaDB[bugunISO()] = yy; else delete otomatikYoklamaDB[bugunISO()]; otomatikYoklamaKaydet();
    }, yedek).catch(() => {});
    // geri yazılanlar km-ortak ile sunucuya gitmeden sayfa kapanırsa test turu/hatlar sonraki testlere kalır
    await p.waitForTimeout(1200);
    await p.waitForFunction(() => { const d = typeof kmOrtakDurum === 'function' ? kmOrtakDurum() : null; return !d || d.bekleyen === 0; }, null, { timeout: 15000 }).catch(() => {});
    await ctx.close();
  }
}
