// 🎯 Işıklı Kartlar: atış analizi + 📋 tablo + ⏱ sayaç boyu (2026-11-20, v443; kullanıcı ekran görüntüsü + "attığı yerlerin
// analizlerini göster ama büyük olsun, küçültebilelim de; yanına tabloyu göster butonu koy, büyük, şeffaf; saniyenin de büyük
// küçük alternatifi olsun"). Analiz: son girenin okları numaralı + sınıfın diğer okları + halka çubukları; Büyük → Küçük → Kapalı.
// Tablo örtüsü açılır/kapanır. Sayaç büyük/küçük ve 2560 px TV'de üstten taşmaz.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 2560, yukseklik: 1120 });
  const O = 'tests/e2e/_cikti/150-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    await p.waitForFunction(() => typeof yzAnahtar === 'function' && typeof yzBaslat === 'function', null, { timeout: 20000 });
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), g: localStorage.getItem('dag_yz_tv_gorunum'), liste: JSON.stringify(_kmListe), an: localStorage.getItem('dag_yz_k_analiz'), sy: localStorage.getItem('dag_yz_k_sayac') }));
    await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 24); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; localStorage.removeItem('dag_yz_k_analiz'); localStorage.removeItem('dag_yz_k_sayac');
      const t = yzKurulumTaslak(); t.katilimci = _kmListe.map((s) => s.g + '|' + s.ad); t.kayit = false; t.siraModu = 'ilk4'; t.format = 's6o3';
      localStorage.setItem('dag_yz_tv_gorunum', 'kartlar'); yzBaslat(); yzTvAc();
    });
    await p.waitForSelector('#yz-tv #yzk .yzik-analiz', { timeout: 20000 });
    await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(500);
    // ilk durum: analiz büyük, sayaç büyük, sayaç ekranın içinde
    const ilk = await p.evaluate(() => { const k = document.querySelector('#yzk'), s = document.querySelector('#yzk #yz-tv-sayac').getBoundingClientRect(), a = document.querySelector('#yzk .yzik-analiz').getBoundingClientRect(); return { an: k.dataset.analiz, sy: k.dataset.sayac, sayacUst: Math.round(s.top), sayacAlt: Math.round(s.bottom), anGen: Math.round(a.width), dugme: document.querySelectorAll('#yzk .yzik-seffaf').length }; });
    esit(ilk.an, 'buyuk', 'analiz varsayılan büyük'); esit(ilk.sy, 'buyuk', 'sayaç varsayılan büyük'); dogrula(ilk.sayacUst >= 0, 'sayaç üstten taşıyor: ' + ilk.sayacUst); dogrula(ilk.anGen > 700, 'analiz büyük değil: ' + ilk.anGen); dogrula(ilk.dugme >= 3, 'şeffaf düğmeler yok');
    // iki sporcu, konumlu oklar → analizde son giren numaralı + diğerleri
    await p.evaluate(() => { const d = yzOku().durum, a = d.katilimci[0], b = d.katilimci[1]; yzGuncelle((o) => { o[yzSKey(d.id, a)] = [['10', '9', '7']]; o[yzPKey(d.id, a)] = [[{ x: 0.05, y: -0.08, n: 1 }, { x: -0.15, y: 0.1, n: 2 }, { x: 0.3, y: 0.25, n: 3 }]]; }); _yz.tvHam = null; yzTvCiz(); });
    await p.waitForTimeout(400);
    await p.evaluate(() => { const d = yzOku().durum, b = d.katilimci[1]; yzGuncelle((o) => { o[yzSKey(d.id, b)] = [['X', '8', 'M']]; o[yzPKey(d.id, b)] = [[{ x: 0.01, y: 0.02, n: 1 }, { x: 0.22, y: -0.2, n: 2 }]]; }); _yz.tvHam = null; yzTvCiz(); });
    await p.waitForTimeout(600);
    const an = await p.evaluate(() => { const d = yzOku().durum; return { kim: (document.querySelector('.yzik-an-kim b') || {}).textContent, bek: yzKisaAd(yzKAd(d.katilimci[1])), numarali: document.querySelectorAll('.yzik-an-hedef text').length, diger: document.querySelectorAll('.yzik-an-hedef circle[r="4.5"]').length, cubuk: document.querySelectorAll('.yzik-an-c').length, ozet: document.querySelector('.yzik-an-ozet').textContent }; });
    esit(an.kim, an.bek, 'analiz son gireni göstermeli'); esit(an.numarali, 2, 'son girenin 2 konumlu oku numaralı'); esit(an.diger, 3, 'diğer sporcunun 3 oku soluk'); esit(an.cubuk, 6, '6 halka çubuğu'); dogrula(/6/.test(an.ozet), 'özet ok sayısı: ' + an.ozet);
    await p.screenshot({ path: O + '1-analiz-buyuk.png' });
    // Büyük → Küçük → Kapalı → Büyük
    const boy = async () => p.evaluate(() => ({ a: document.querySelector('#yzk').dataset.analiz, gizli: document.querySelector('.yzik-analiz').hidden, gen: Math.round(document.querySelector('.yzik-analiz').getBoundingClientRect().width) }));
    await p.locator('.yzik-arac .yzik-seffaf', { hasText: 'Analiz' }).click(); await p.waitForTimeout(300);
    let b = await boy(); esit(b.a, 'kucuk', 'küçük'); dogrula(b.gen < ilk.anGen, 'küçülmedi');
    await p.screenshot({ path: O + '2-analiz-kucuk.png' });
    await p.locator('.yzik-arac .yzik-seffaf', { hasText: 'Analiz' }).click(); await p.waitForTimeout(300);
    b = await boy(); esit(b.a, 'kapali', 'kapalı'); dogrula(b.gizli, 'panel gizlenmeli');
    await p.locator('.yzik-arac .yzik-seffaf', { hasText: 'Analiz' }).click(); await p.waitForTimeout(300);
    esit((await boy()).a, 'buyuk', 'yeniden büyük');
    // 📋 tablo örtüsü
    await p.locator('.yzik-arac .yzik-seffaf', { hasText: 'Tabloyu göster' }).click(); await p.waitForTimeout(400);
    const tb = await p.evaluate(() => ({ acik: !document.querySelector('.yzik-tablo').hidden, satir: document.querySelectorAll('.yzik-tablo .yz-tablo tbody tr').length, n: yzOku().durum.katilimci.length }));
    dogrula(tb.acik, 'tablo açılmadı'); esit(tb.satir, tb.n, 'tabloda herkes');
    await p.screenshot({ path: O + '3-tablo.png' });
    await p.locator('.yzik-tablo .yzik-seffaf', { hasText: 'Kartlara dön' }).click(); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => document.querySelector('.yzik-tablo').hidden), 'tablo kapanmadı');
    // ⏱ sayaç küçük
    const fs0 = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#yzk .yz-sayac-sure')).fontSize));
    await p.locator('.yzik-arac .yzik-seffaf', { hasText: 'Sayaç' }).click(); await p.waitForTimeout(300);
    const fs1 = await p.evaluate(() => ({ f: parseFloat(getComputedStyle(document.querySelector('#yzk .yz-sayac-sure')).fontSize), d: document.querySelector('#yzk').dataset.sayac }));
    esit(fs1.d, 'kucuk', 'sayaç küçük'); dogrula(fs1.f < fs0 * 0.6, 'sayaç küçülmedi ' + fs0 + ' → ' + fs1.f);
    await p.screenshot({ path: O + '4-sayac-kucuk.png' });
    // 1366×768: taşma yok
    await p.setViewportSize({ width: 1366, height: 768 }); await p.evaluate(() => { _yz.tvHam = null; yzTvCiz(); }); await p.waitForTimeout(600);
    dogrula(await p.evaluate(() => { const r = document.querySelector('#yzk').getBoundingClientRect(); return [...document.querySelectorAll('#yzk .yzik-c, #yzk .yzik-analiz, #yzk #yz-tv-sayac')].every((e) => { const q = e.getBoundingClientRect(); return q.top >= -1 && q.right <= r.right + 2 && q.bottom <= r.bottom + 2; }); }), '1366 px taşma');
    await p.screenshot({ path: O + '5-1366.png' });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('analiz büyük/küçük/kapalı (son giren numaralı + sınıf + halka çubukları) · tablo örtüsü · sayaç büyük/küçük · 2560 ve 1366 px');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzTvKapat(); } catch (e) {} const w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); }; w(yzAnahtar(), y.yz); w('dag_yz_tv_gorunum', y.g); w('dag_yz_k_analiz', y.an); w('dag_yz_k_sayac', y.sy); _kmListe = JSON.parse(y.liste); _yz.kurulum = null; }, yedek).catch(() => {});
    await ctx.close();
  }
}
