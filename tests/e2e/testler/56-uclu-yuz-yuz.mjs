// 📱 3'lü hedef "Yüz yüz" (v312, kullanıcı: "sporcu kendi girişinde 3'lü halka telefonda otomatik küçük görünüyor, rahat dokunarak
// giriş" → 3 taslaktan A). Telefonda Skor Gir 3'lü hedefte yalnız bir yüz ekranı kaplar; ok konunca sıradaki boş yüze geçer;
// üstte 3 mini yüz (dokun → o yüz). Geniş ekranda eski üçlü kağıt. Test oklarını kaydetmeden temizler.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 844 });
  try {
    await uygulamaAc(p);
    const ad = await p.evaluate(() => { let g = 'buyukler', l = Object.keys(turnuvaDB[g] || {}).filter((a) => !turnuvaDB[g][a].pasif && !turnuvaDB[g][a].donduruldu); aktifGrup = g; let gz = document.getElementById('giris-ekrani'); if (gz) gz.style.display = 'none'; return l[0]; });
    dogrula(ad, 'sporcu yok');
    await p.evaluate((ad) => { skorEkraniniAc(ad); setHedefTipi('3spot'); }, ad);
    await p.waitForTimeout(300);
    const d = await p.evaluate(() => { let svg = document.getElementById('hedef-svg-3spot'), r = svg.getBoundingClientRect(); return { sinif: document.body.classList.contains('uclu-yuz-yuz'), vb: svg.getAttribute('viewBox'), gen: Math.round(r.width), mini: document.querySelectorAll('#uclu-yuz-sec button').length, zoom: currentZoom }; });
    dogrula(d.sinif, 'telefonda yüz yüz açılmadı');
    esit(d.vb, '-64 -204 128 128', '1. yüze odak');
    dogrula(d.gen >= 300, 'yüz büyük değil: ' + d.gen + ' px');
    esit(d.mini, 3, '3 mini yüz');
    esit(d.zoom, 1, 'yakınlaştırma 1×');
    // 1. yüzün ortasına dokun → X, sıradaki yüz (2.) açılır
    const dokun = (x, y) => p.evaluate(([x, y]) => { let svg = document.getElementById('hedef-svg-3spot'), pt = svg.createSVGPoint(); pt.x = x; pt.y = y; let q = pt.matrixTransform(svg.getScreenCTM()); hedefNoktaEkle(q.x, q.y); }, [x, y]);
    await dokun(2, -141);
    let s = await p.evaluate(() => [anlikAtilanOklar.map((o) => o.puan + '@' + o.spot).join(' '), document.getElementById('hedef-svg-3spot').getAttribute('viewBox'), document.querySelector('#uclu-yuz-sec button.dolu') ? 1 : 0].join('|'));
    esit(s, 'X@0|-64 -64 128 128|1', 'ok + sıradaki yüz');
    await dokun(25, 0);
    esit(await p.evaluate(() => document.getElementById('hedef-svg-3spot').getAttribute('viewBox')), '-64 76 128 128', '3. yüz');
    // mini yüze dokun → 1. yüz
    await p.evaluate(() => document.querySelectorAll('#uclu-yuz-sec button')[0].click());
    esit(await p.evaluate(() => document.getElementById('hedef-svg-3spot').getAttribute('viewBox')), '-64 -204 128 128', 'mini yüzle 1. yüze dönüş');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-yuz-yuz.png' });
    // geniş ekranda eski üçlü kağıt
    await p.setViewportSize({ width: 1280, height: 900 }); await p.waitForTimeout(300);
    esit(await p.evaluate(() => [document.body.classList.contains('uclu-yuz-yuz'), document.getElementById('hedef-svg-3spot').getAttribute('viewBox'), getComputedStyle(document.getElementById('uclu-yuz-sec')).display].join('|')), 'false|-110 -250 220 500|none', 'geniş ekranda üçlü kağıt');
    await p.evaluate(() => { anlikAtilanOklar = []; skorEkraniniKapat(); });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('📱 3\'lü yüz yüz: tek yüz büyük, otomatik sıradaki yüz, mini yüzler, geniş ekranda üçlü kağıt ✓');
  } finally {
    await ctx.close();
  }
}
