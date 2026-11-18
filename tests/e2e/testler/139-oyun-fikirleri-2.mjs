// 🎮 Oyun fikirleri 2. dalga (2026-11-18, v434):
//   7 📖 Hapşırık · Sınıfın Kitabı (her hapşırık günün sayfasına: yaratık + katkı verenlerin adları; 12 saatte silinmez; yazdır)
//   2 🥷 Çatı Koşusu · Klan Akını (1. ve 3. tur sonunda Kızıl Klan; 7+ ok düşürür; varanlar fener söndürür; 3 fener = kayıp, Rövanş)
//  10 👕 Karakter dolabı (katılım günü sayılır, eşya açılır, ok anında ikon + duyuru, Dolap penceresi)
// 24 çocukta 1366 ve 390 px ekran görüntüleri.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const O = 'tests/e2e/_cikti/139-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const tum = await p.evaluate(() => { const t = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) t.push({ g, ad }); })); window.__tum = t; localStorage.setItem('dag_km_an_kapali', '1'); return t.length; });
    dogrula(tum >= 6, 'en az 6 sporcu gerekli');
    const KEYS = ['dag_km_hapsirik_', 'dag_km_hps_kitap_', 'dag_km_n3_catikosu_', 'dag_km_n3ilerleme_catikosu_'];
    const ac = (tema, n) => p.evaluate(([tema, n, KEYS]) => { _kmListe = window.__tum.slice(0, n); const kn = _kmAktifKonum || 'varsayilan'; KEYS.forEach((a) => localStorage.removeItem(a + kn)); kmOyunListeDegisti && kmOyunListeDegisti(); kmOyunTemaSec(tema); }, [tema, n, KEYS]);
    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      _kmOyunAktifIndex = hedef; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0, bos = 0; k < 400 && bos < 4; k++) { await new Promise((r) => setTimeout(r, 100)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); bos = 0; } else if (!_kmOyunKilit) bos++; else bos = 0; }
    }, [oklar, hedef]);
    const idx = () => p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0));
    const n24 = Math.min(24, tum);

    // ── 7 📖 Hapşırık kitabı: saf ekleme + 6 çocukla gerçek hapşırık
    await ac('hapsirik', 6); await p.waitForSelector('#hps-svg', { timeout: 30000 }); await p.waitForTimeout(800);
    let ix = await idx();
    await p.evaluate(() => { const st = JSON.parse(localStorage.getItem('dag_km_hapsirik_' + (_kmAktifKonum || 'varsayilan'))); st.gidik = st.gerekli - 40; st.sahte = true; localStorage.setItem('dag_km_hapsirik_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); hpsSahneKur(); });
    await seri(['3', '2', '1'], ix[0]); await seri(['X', '10', '9'], ix[1]);
    await p.waitForTimeout(10500);
    let kitap = await p.evaluate(() => _hpsKitap.kitapOku());
    esit(kitap.sayfalar.length, 1, 'bir sayfa'); esit(kitap.sayfalar[0].yaratiklar.length, 1, 'bir yaratık');
    dogrula(kitap.sayfalar[0].yaratiklar[0].adlar.length >= 2, 'katkı verenlerin adları: ' + kitap.sayfalar[0].yaratiklar[0].adlar.join(','));
    dogrula(/sahte/.test((kitap.sayfalar[0].komik || []).join(' ')), 'komik an: sahte hapşırık');
    // ikinci yaratık aynı gün aynı sayfaya; 12 saat sıfırlaması kitabı silmez
    await p.evaluate(() => { _hpsKitap.kitapEkle({ tip: 'mamut', adi: 'Mamut', katkilar: ['buyukler|Ela Test', 'buyukler|Mert Test'] }, []); });
    kitap = await p.evaluate(() => _hpsKitap.kitapOku()); esit(kitap.sayfalar.length + '/' + kitap.sayfalar[0].yaratiklar.length, '1/2', 'aynı gün aynı sayfa');
    dogrula(await p.evaluate(() => !(KM_OYUN_SIFIR_ONEK || []).some((o) => ('dag_km_hps_kitap_x').indexOf(o) === 0)), 'kitap 12 saat sıfırlamasına girmez');
    await p.locator('#hps-kitap-btn').click(); await p.waitForSelector('#hps-kitap .hps-sayfa');
    dogrula(/hapşırdı/.test(await p.locator('#hps-kitap').textContent()), 'kitap sayfası açıldı');
    await p.screenshot({ path: O + 'kitap.png' });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'kitap 390 px taşma'); await p.screenshot({ path: O + 'kitap-telefon.png' });
    await p.setViewportSize({ width: 1366, height: 768 });
    await p.waitForTimeout(800); if (!(await p.locator('#hps-k-yaz').count())) { await p.locator('#hps-kitap-btn').click(); await p.waitForSelector('#hps-k-yaz'); } await p.locator('#hps-k-yaz').click(); await p.waitForTimeout(900);
    const yz = await p.evaluate(() => { const fr = document.getElementById('hps-yazdir'); const d = fr && fr.contentWindow.document; return d ? { t: d.title, n: d.querySelectorAll('.hps-sayfa').length, kapak: !!d.querySelector('.kapak') } : null; });
    dogrula(yz && /Hapşırık Kitabı/.test(yz.t) && yz.kapak, 'yazdırma çerçevesi'); esit(yz.n, 1, 'yazdırmada 1 sayfa');
    await p.locator('#hps-kitap-kapat').click();

    // ── 2 🥷 Klan akını: saf
    await ac('catikosu', 6); await p.waitForSelector('#n3-hud #n3-serit .n3-k', { timeout: 30000 }); await p.waitForTimeout(800);
    const k = await p.evaluate(() => { const I = _n3Ic, st = { tur: 1, fener: 3, klan: null };
      const a = I.klanTur(st, 24).olay, n0 = st.klan.n, d = I.klanOk(st, [9, 7, 6]); const b = I.klanTur(st, 24);
      const st2 = { tur: 3, fener: 1, klan: { n: 2 } }; const c = I.klanTur(st2, 24);
      const st3 = { tur: 1, fener: 2, klan: { n: 0 } }; const e = I.klanTur(st3, 24);
      const st4 = { tur: 2, fener: 3, klan: null }; const f = I.klanTur(st4, 24).olay; const st5 = { tur: 5, fener: 3, klan: null }; const g = I.klanTur(st5, 24).olay;
      return { a, n0, d, b: b.olay + b.sonen + '/' + st.fener, c: c.olay + st2.fener, e: e.olay + st3.fener, f, g }; });
    esit(k.a, 'geldi', '1. tur sonu klan gelir'); esit(k.n0, 8, '24 çocukta 8'); esit(k.d, 2, '9 ve 7 iki ninja düşürür');
    esit(k.b, 'vardi2/1', '6 ninja → 2 fener söner'); esit(k.c, 'vardi0', 'son fener söndü'); esit(k.e, 'puskurtuldu3', 'püskürtülünce fener yanar');
    esit(k.f, null, '2. tur sonunda klan yok'); esit(k.g, null, '5. turda klan yok');
    // oyunda: 6 çocuk 1 tur → klan; iyi seri düşürür; kayıp yolu
    ix = await idx();
    for (const j of ix) await seri(['5', '5', '4'], j);
    let st = await p.evaluate(() => JSON.parse(JSON.stringify(n3Durum('catikosu'))));
    dogrula(st.klan && st.klan.n === 3, '1. tur sonunda 3 kızıl ninja: ' + JSON.stringify(st.klan));
    dogrula(/KIZIL/.test(await p.locator('#an-simdi').textContent()), 'ŞİMDİ klanı söyler');
    await seri(['9', '8', '7'], ix[0]);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(n3Durum('catikosu')))); esit(st.klan.n, 0, '3 iyi ok 3 ninja düşürdü');
    await p.screenshot({ path: O + 'klan-6.png' });
    // 24 çocuk görüntü + kayıp
    await ac('catikosu', n24); await p.waitForSelector('#n3-hud #n3-serit .n3-k', { timeout: 30000 });
    await p.evaluate(() => { const s = n3Durum('catikosu'); s.klan = { n: 8, ilk: 8 }; s.fener = 2; localStorage.setItem('dag_km_n3_catikosu_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(s)); kmOyunTemaSec('catikosu'); });
    await p.waitForTimeout(2500); await p.screenshot({ path: O + 'klan-24.png' });
    ix = await idx(); for (const j of ix) await seri(['2', '1', 'M'], j);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(n3Durum('catikosu'))));
    esit(st.kayip + '/' + st.fener, 'true/0', '8 ninja vardı: fenerler söndü, bölüm kaybedildi');
    await p.waitForSelector('#n3-son', { timeout: 10000 }); dogrula(/FENERLER/.test(await p.locator('#n3-son').textContent()), 'kayıp kartı');
    await p.screenshot({ path: O + 'klan-kayip.png' });
    await p.locator('#n3-sonraki').click(); await p.waitForTimeout(600);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(n3Durum('catikosu')))); esit(st.faz + st.fener + st.bolum, 'oyun30', 'Rövanş aynı bölüm, 3 fener');

    // ── 10 👕 dolap: katılım günü + eşya
    const dl = await p.evaluate(() => { const s = window.__tum[0], sp = turnuvaDB[s.g][s.ad], yed = sp.oyun && sp.oyun.dolap ? JSON.stringify(sp.oyun.dolap) : null; window.__dolapYedek = [s, yed];
      sp.oyun = sp.oyun || {}; sp.oyun.dolap = { gun: 5, son: '2000-01-01' }; const y = _anIc.dolapSay(s.g, s.ad), y2 = _anIc.dolapSay(s.g, s.ad);
      return { y: y && y[2], y2, gun: sp.oyun.dolap.gun, ik: kmDolapIkon(s.g, s.ad) }; });
    esit(dl.y, 'Pelerin', '6. günde pelerin'); esit(dl.y2, null, 'aynı gün ikinci kez saymaz'); esit(dl.gun, 6, 'gün 6'); esit(dl.ik, '🦸', 'en yüksek eşya ikonu');
    await p.locator('#an-dolap-dug').click(); await p.waitForSelector('.an-dolap .an-dolap-k');
    dogrula(/🦸/.test(await p.locator('.an-dolap').textContent()), 'dolapta pelerin'); await p.waitForTimeout(600);
    await p.screenshot({ path: O + 'dolap.png' });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'dolap 390 px taşma'); await p.screenshot({ path: O + 'dolap-telefon.png' });
    await p.evaluate(() => anKuralKapat());
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('📖 kitap (sayfa, adlar, komik an, 12 saat, yazdır) · 🥷 klan akını (gelir, düşer, fener, kayıp, rövanş) · 👕 dolap (gün, eşya, pencere) · 24 çocuk · 390 px');
  } finally {
    try { await p.evaluate((y) => { const kn = _kmAktifKonum || 'varsayilan'; ['dag_km_hapsirik_', 'dag_km_hps_kitap_', 'dag_km_n3_catikosu_'].forEach((a) => localStorage.removeItem(a + kn)); localStorage.removeItem('dag_km_an_kapali');
      const d = window.__dolapYedek; if (d) { const sp = turnuvaDB[d[0].g][d[0].ad]; if (d[1]) sp.oyun.dolap = JSON.parse(d[1]); else if (sp.oyun) delete sp.oyun.dolap; }
      if (y) { _kmListe = JSON.parse(y); kmOyunListeDegisti && kmOyunListeDegisti(); } }, yedek); } catch (e) {}
    await ctx.close();
  }
}
