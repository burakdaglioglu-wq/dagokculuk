// ✨ Işıklı Kartlar + 🔀 sıralama modu (2026-11-20, v439). Kullanıcı minik/küçük yarışma taslağından "Işıklı Kartlar"ı seçti:
// "oraya bir düğme koy, herkesin sırasını değiştir veya ilk 4 kalsın gibi; bu sıralama alternatifini diğer yarışma sekmesindeki her şeye ekle".
// Turun ayarı d.ayar.siraModu: normal / ilk4 / karisik. Tablette ve TV'de (Tablo, Sahne, Hatlar, Kartlar) ilk 4 dışındakiler ✦ ve
// 5 sn'de bir yer değiştirir; gerçek sıralama (yzSiralama) değişmez. Kartlar: kürsü 4, skor girilince övgü balonu. Kurulumda seçilir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const O = 'tests/e2e/_cikti/146-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    await p.waitForFunction(() => typeof yzAnahtar === 'function' && typeof yzBaslat === 'function', null, { timeout: 20000 });
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), g: localStorage.getItem('dag_yz_tv_gorunum'), liste: JSON.stringify(_kmListe), a: localStorage.getItem('dag_yz_kur_ayrintili') }));
    // 12 sporcuyla kayıtsız tur, kurulumda "İlk 4 kalsın"
    const n = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 12); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; localStorage.setItem('dag_yz_kur_ayrintili', '0'); _yzr.ayrintili = false;
      _yz.mod = 'secim'; _yz.secimAcik = true; kmYarismaGiris(); return _kmListe.length;
    });
    dogrula(n >= 8, 'testte en az 8 sporcu gerekli (' + n + ')');
    await p.locator('.yzr-k').filter({ has: p.locator('.yzr-yazi > b').filter({ hasText: /^Sıralama Turu( |$)/ }) }).first().click(); await p.waitForTimeout(300);
    await p.evaluate(() => yzrAdim(3)); await p.waitForTimeout(300);
    dogrula(await p.locator('.yzr-k', { hasText: 'Işıklı Kartlar' }).count() === 1, 'kurulumda Işıklı Kartlar kartı yok');
    esit(await p.locator('.yzr-k', { hasText: 'İlk 4 kalsın' }).count(), 1, 'kurulumda sıralama seçimi yok');
    await p.locator('.yzr-k', { hasText: 'İlk 4 kalsın' }).click(); await p.waitForTimeout(200);
    await p.locator('.yzr-k', { hasText: 'Işıklı Kartlar' }).click(); await p.waitForTimeout(200);
    await p.evaluate(() => { const c = document.querySelector('.yzr input[type=checkbox]'); if (c && c.checked) c.click(); yzKurulumTaslak().kayit = false; });
    await p.screenshot({ path: O + '1-kurulum.png', fullPage: true });
    await p.locator('.yzr-ileri').click();
    await p.waitForSelector('#yz-tv #yzk .yzik-alan', { timeout: 20000 });
    await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(400);
    const d0 = await p.evaluate(() => { const d = yzOku().durum; return { mod: d.ayar.siraModu, kayit: d.ayar.kayit, n: d.katilimci.length }; });
    esit(d0.mod, 'ilk4', 'kurulumdaki mod tura geçmeli'); esit(d0.kayit, false, 'test kayıtsız olmalı');

    // herkese 1. seri
    await p.evaluate(() => yzGuncelle((o) => { const d = o.durum; d.katilimci.forEach((k, i) => { o[yzSKey(d.id, k)] = [[['10', '9', '8'], ['7', '6', '5'], ['X', '10', '9'], ['4', '3', 'M'], ['8', '8', '7']][i % 5]]; }); }));
    await p.evaluate(() => { _yz.tvHam = null; yzTvCiz(); }); await p.waitForTimeout(700);
    const k1 = await p.evaluate(() => ({ kursu: document.querySelectorAll('#yzk .yzik-k').length, kart: document.querySelectorAll('#yzk .yzik-c').length, no: document.querySelectorAll('#yzk .yzik-c .no').length, n: yzOku().durum.katilimci.length }));
    esit(k1.kursu, 4, 'kürsüde 4 sporcu'); esit(k1.kart, k1.n - 4, 'diğerleri kart'); esit(k1.no, 0, 'karışık kartlarda sıra numarası olmamalı');
    // ekran sırası zamanla değişir (5 sn kova), gerçek sıralama aynı kalır
    const sira = await p.evaluate(() => { const d = yzOku().durum, g = yzSiralama(yzOku()).map((r) => r.k).join(), a = yzKarisikSira(d, yzSiralama(yzOku())).map((r) => r.k); const gercek = Date.now; Date.now = () => gercek() + 5000; const b = yzKarisikSira(d, yzSiralama(yzOku())).map((r) => r.k); const g2 = yzSiralama(yzOku()).map((r) => r.k).join(); Date.now = gercek; return { ilk4ayni: a.slice(0, 4).join() === b.slice(0, 4).join(), digerDegisti: a.slice(4).join() !== b.slice(4).join(), gercekAyni: g === g2 }; });
    dogrula(sira.ilk4ayni, 'ilk 4 sabit kalmalı'); dogrula(sira.digerDegisti, 'diğerleri yer değiştirmeli'); dogrula(sira.gercekAyni, 'gerçek sıralama değişmemeli');
    await p.screenshot({ path: O + '2-kartlar-ilk4.png' });
    await p.waitForTimeout(4300); // ilk serinin "hoş geldin" balonları 4 sn sürer
    // skor girişi → övgü balonu
    const kim = await p.evaluate(() => { const d = yzOku().durum, sr = yzSiralama(yzOku()), k = sr[sr.length - 1].k; yzGuncelle((o) => { const a = o[yzSKey(d.id, k)]; a[1] = ['X', '10', '9']; }); _yz.tvHam = null; yzTvCiz(); return k; });
    await p.waitForTimeout(500);
    const bal = await p.evaluate(() => [...document.querySelectorAll('#yzk .yzik-balon')].map((b) => b.textContent));
    dogrula(bal.length === 1 && /rekor|sarıda|isabet|\+/.test(bal[0]), 'övgü balonu çıkmalı: ' + JSON.stringify(bal) + ' ' + kim);
    dogrula(!/kötü|zayıf|son sıra|en alt/i.test(bal.join()), 'övgü olumsuz olmamalı');
    await p.screenshot({ path: O + '3-ovgu.png' });
    // karışık mod: kürsü yok
    await p.evaluate(() => yzSiraModuSec('karisik')); await p.waitForTimeout(700);
    const k2 = await p.evaluate(() => ({ kursu: document.querySelectorAll('#yzk .yzik-k').length, kart: document.querySelectorAll('#yzk .yzik-c').length, n: yzOku().durum.katilimci.length }));
    esit(k2.kursu, 0, 'karışık modda kürsü olmamalı'); esit(k2.kart, k2.n, 'karışık modda herkes kart');
    await p.screenshot({ path: O + '4-kartlar-karisik.png' });
    // taşma yok
    dogrula(await p.evaluate(() => { const a = document.querySelector('#yzk').getBoundingClientRect(); return [...document.querySelectorAll('#yzk .yzik-c')].every((c) => { const r = c.getBoundingClientRect(); return r.right <= a.right + 2 && r.bottom <= a.bottom + 2; }); }), 'kartlar ekrandan taşıyor');

    // diğer TV görünümleri: Tablo, Sahne, Hatlar → ✦
    await p.evaluate(() => yzSiraModuSec('ilk4'));
    await p.evaluate(() => yzTvGorunumSec('tablo')); await p.waitForTimeout(700);
    const tb = await p.evaluate(() => ({ yildiz: document.querySelectorAll('#yz-tv .yz-tablo .yz-gizli-sira').length, n: yzOku().durum.katilimci.length, modDugme: document.querySelectorAll('#yz-tv .yz-tv-siramod button').length }));
    esit(tb.yildiz, tb.n - 4, 'Tablo: ilk 4 dışında ✦'); dogrula(tb.modDugme >= 3, 'TV tabloda mod düğmeleri yok');
    await p.screenshot({ path: O + '5-tablo.png' });
    await p.evaluate(() => yzTvGorunumSec('sahne')); await p.waitForSelector('#yz-tv .yzs-tsat', { timeout: 15000 }); await p.waitForTimeout(500);
    esit(await p.evaluate(() => [...document.querySelectorAll('#yz-tv .yzs-tsat .r')].filter((r) => r.textContent === '✦').length), tb.n - 4, 'Sahne: ilk 4 dışında ✦');
    await p.evaluate(() => yzTvGorunumSec('hatlar')); await p.waitForSelector('#yz-tv .yzh-s', { timeout: 15000 }); await p.waitForTimeout(500);
    esit(await p.evaluate(() => [...document.querySelectorAll('#yz-tv .yzh-s .sira')].filter((s) => /sırada/.test(s.textContent)).length), 4, 'Hatlar: yalnız ilk 4 sıra yazar');
    await p.evaluate(() => yzTvKapat()); await p.waitForTimeout(500);
    // tablet: tablo ✦ + mod çipleri, telefon taşmaz
    await p.evaluate(() => yzCiz()); await p.waitForTimeout(500);
    dogrula(await p.locator('#km-icerik .yz-siramod button').count() >= 3, 'tablette mod düğmeleri yok');
    await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => yzCiz()); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px taşıyor');
    esit(await p.evaluate(() => [...document.querySelectorAll('.yz-tel-kart .yz-tel-sira')].filter((s) => s.textContent === '✦').length), tb.n - 4, 'telefon kartları: ilk 4 dışında ✦');
    esit(await p.evaluate(() => [...document.querySelectorAll('.yz-sp-top')].filter((s) => /✦/.test(s.textContent)).length), tb.n - 4, 'hedef kartları: ilk 4 dışında ✦');
    await p.screenshot({ path: O + '6-telefon.png', fullPage: true });
    // normal mod geri: numaralar döner
    await p.evaluate(() => yzSiraModuSec('normal')); await p.waitForTimeout(300);
    esit(await p.evaluate(() => document.querySelectorAll('.yz-gizli-sira').length), 0, 'normal modda ✦ kalmamalı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kurulumda mod + Kartlar · kürsü 4, diğerleri ✦ ve dönüyor, gerçek sıra sabit · övgü balonu · karışıkta kürsü yok · Tablo/Sahne/Hatlar/tablet/telefon ✦');
  } finally {
    if (yedek) await p.evaluate((y) => { const w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); }; w(yzAnahtar(), y.yz); w('dag_yz_tv_gorunum', y.g); w('dag_yz_kur_ayrintili', y.a); _kmListe = JSON.parse(y.liste); }, yedek).catch(() => {});
    await ctx.close();
  }
}
