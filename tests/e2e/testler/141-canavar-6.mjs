// 🐉 Ortak Canavar 6.0 (2026-11-19, v435) — kullanıcı fikir sayfasından 1, 2, 3, 4, 5, 9, 10'u seçti:
//   1 beş kılık · 2 ruh hali · 3 düşen zırh · 4 siste kim var · 5 ikinci form · 9 halka rengine göre patlama · 10 savrulma
// 24 çocukta 1366 ve 390 px ekran görüntüleri.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const O = 'tests/e2e/_cikti/141-';
  let yedek = null, cnvYedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    cnvYedek = await p.evaluate(() => localStorage.getItem('dag_km_canavar_' + (_kmAktifKonum || 'varsayilan')));
    const tum = await p.evaluate(() => { const t = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) t.push({ g, ad }); })); window.__tum = t; localStorage.setItem('dag_km_an_kapali', '1'); return t.length; });
    const n24 = Math.min(24, tum);
    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      _kmOyunAktifIndex = hedef; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0, bos = 0; k < 400 && bos < 4; k++) { await new Promise((r) => setTimeout(r, 100)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); bos = 0; } else if (!_kmOyunKilit) bos++; else bos = 0; }
    }, [oklar, hedef]);
    const idx = () => p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0));
    const kur = (alan) => p.evaluate((alan) => { kmCanavarDurumEmin(); const c = _kmCanavar.aktif; Object.assign(c, alan); c.kalkan = false; c.kalkanEsik = []; kmCanavarKaydet(); kmOyunCanavarGovdeKur(false); kmOyunCanavarHudGuncelle(); }, alan);
    const durum = () => p.evaluate(() => { const c = _kmCanavar.aktif, pn = document.getElementById('km-oyun-panel-canavar'); return { c: JSON.parse(JSON.stringify(c)), sinif: pn.className, ad: document.getElementById('km-cnv-ad').textContent, no: document.getElementById('km-cnv-no').textContent, evre: document.getElementById('km-cnv-evre').textContent }; });

    // ── 4 Siste kim var + 1 kılık + 2 huy: yeni canavar alanlarla doğar
    await p.evaluate((n) => { localStorage.removeItem('dag_km_canavar_' + (_kmAktifKonum || 'varsayilan')); _kmCanavar = null; _kmListe = window.__tum.slice(0, n); kmOyunListeDegisti && kmOyunListeDegisti(); kmOyunTemaSec('canavar'); }, n24);
    await p.waitForSelector('#km-cnv-canavar-ic .km-cnv-tum', { timeout: 30000 }); await p.waitForTimeout(1800);
    let d = await durum();
    dogrula(d.c.gizli === true, 'yeni canavar siste doğar');
    dogrula(!!d.c.huy && (d.c.kilik || d.c.tip === 'kral'), 'kılık + huy atandı: ' + d.c.kilik + '/' + d.c.huy);
    dogrula(/km-cnv-gizli/.test(d.sinif), 'panelde sis sınıfı');
    dogrula(/Siste/.test(d.ad), 'adı gizli: ' + d.ad);
    dogrula(await p.locator('.km-cnv-sis-goz').first().isVisible(), 'parlayan gözler görünür');
    await p.screenshot({ path: O + 'sis-24.png' });

    // ── 3 eşya + sis açılışı: sarı ok kafaya gider, eşya düşer, ad ortaya çıkar
    await kur({ tip: 'golem', kilik: 'ates', huy: 'sinirli', ek: 'migfer', ekDustu: null, gizli: true, form2: false });
    let ix = await idx();
    const ilkAd = await p.evaluate((j) => _kmOyunRosterCache[j].ad, ix[0]);
    await p.evaluate((j) => { _kmOyunAktifIndex = j; _kmOyunSeriGirisleri = ['9', '7', '5']; _kmOyunSeriKonumlari = []; kmOyunIlerlet(); }, ix[0]);
    await p.waitForTimeout(150);
    await p.evaluate(() => { const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') onayOnayla(); }); // günlük seri limiti
    await p.waitForTimeout(1200);
    await p.screenshot({ path: O + 'esya-ucuyor.png' });
    await p.waitForTimeout(2500);
    d = await durum();
    esit(d.c.gizli, false, 'ilk seri sisi açtı');
    esit(d.c.ekDustu, ilkAd, 'miğferi düşüren kayıtlı');
    dogrula(/km-cnv-ek-dustu/.test(d.sinif) && !/km-cnv-gizli/.test(d.sinif), 'eşya yerde, sis yok: ' + d.sinif);
    dogrula(/Ateşli Kaya Golemi/.test(d.ad), 'ada kılık sıfatı: ' + d.ad);
    dogrula(/SİNİRLİ/.test(d.no), 'huy başlıkta: ' + d.no);
    dogrula(await p.locator('.km-cnv-aksesuar-yer').isVisible(), 'miğfer yerde görünür');
    await p.screenshot({ path: O + 'ates-golem-24.png' });
    await p.evaluate(async () => { for (let k = 0; k < 60 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 100)); });

    // ── 2 huy: ıskada laf
    await p.evaluate(() => { document.querySelectorAll('.km-cnv-ucan-yazi').forEach((e) => e.remove()); kmCnvHuyIska(_kmCanavar.aktif); });
    await p.waitForTimeout(250);
    const laf = await p.evaluate(() => (document.querySelector('.km-cnv-ucan-yazi.huy') || {}).textContent || '');
    dogrula(/😡/.test(laf), 'sinirli ıska lafı: ' + laf);

    // ── 9 halka rengine göre patlama (her renk kendi parçacığı) + ıskada kaçış
    for (const r of ['altin', 'kirmizi', 'mavi', 'siyah', 'beyaz']) {
      const n = await p.evaluate((r) => { const k = document.getElementById('km-cnv-oklar'), once = k.childElementCount; kmCnvRenkEfekt(840, 220, r, false); return k.childElementCount - once; }, r);
      dogrula(n >= 8, r + ' patlaması parçacık: ' + n);
    }
    await p.evaluate(() => { kmCnvRenkEfekt(820, 200, 'altin', true); kmCnvRenkEfekt(900, 260, 'mavi', true); kmCnvRenkEfekt(980, 210, 'kirmizi', true); });
    await p.waitForTimeout(230); await p.screenshot({ path: O + 'renk-patlama.png' });
    await p.waitForTimeout(1300);
    esit(await p.evaluate(() => document.getElementById('km-cnv-oklar').childElementCount), 0, 'parçacıklar temizlendi');
    await p.evaluate(() => kmCnvKac()); await p.waitForTimeout(350);
    dogrula(await p.evaluate(() => /matrix/.test(getComputedStyle(document.querySelector('.km-cnv-tum')).transform)), 'ıskada canavar eğildi');
    await p.waitForTimeout(800);

    // ── 10 savrulma: kritikte yere düşer, sonra kalkar
    await p.evaluate(() => kmCnvSavrul(true)); await p.waitForTimeout(900);
    const aci = await p.evaluate(() => { const m = getComputedStyle(document.querySelector('.km-cnv-tum')).transform.match(/matrix\(([^,]+),\s*([^,]+)/); return m ? Math.round(Math.atan2(parseFloat(m[2]), parseFloat(m[1])) * 180 / Math.PI) : 0; });
    dogrula(aci > 40, 'kritikte sırtüstü düştü: ' + aci + '°');
    await p.screenshot({ path: O + 'kritik-dusus.png' });
    await p.waitForTimeout(1700);
    esit(await p.evaluate(() => getComputedStyle(document.querySelector('.km-cnv-tum')).transform), 'none', 'ayağa kalktı');

    // ── 5 ikinci form: can yarının hemen üstünde, bir seri → büyür, kanat açar
    await p.evaluate(() => { const c = _kmCanavar.aktif; c.can = Math.floor(c.maxCan * 0.5) + 1; kmCanavarKaydet(); kmOyunCanavarHudGuncelle(); });
    ix = await idx(); await seri(['8', '7', '6'], ix[1]);
    await p.waitForTimeout(1800);
    d = await durum();
    esit(d.c.form2, true, '2. forma geçti');
    dogrula(/km-cnv-form2/.test(d.sinif), 'panelde 2. form');
    esit(d.evre, '2. form!', 'evre yazısı');
    dogrula(await p.evaluate(() => getComputedStyle(document.querySelector('.km-cnv-kanat')).opacity === '1'), 'kanat açıldı');
    await p.waitForTimeout(800); await p.screenshot({ path: O + 'ikinci-form-24.png' });

    // ── 1 kılıklar yan yana (görüntü) + eski kayıt uyumu
    for (const k of ['buz', 'zehir', 'golge', 'altin']) {
      await kur({ tip: 'kraken', kilik: k, huy: 'uykucu', ek: 'tac', ekDustu: null, gizli: false, form2: false });
      await p.waitForTimeout(900);
      dogrula(await p.evaluate((k) => document.getElementById('km-oyun-panel-canavar').classList.contains('km-cnv-kilik-' + k), k), 'kılık sınıfı ' + k);
      await p.screenshot({ path: O + 'kilik-' + k + '.png', clip: { x: 500, y: 60, width: 866, height: 560 } });
    }
    await kur({ tip: 'golem', kilik: undefined, huy: undefined, ek: undefined, ekDustu: undefined, gizli: undefined, form2: undefined });
    d = await durum();
    dogrula(!/km-cnv-(gizli|kilik|huy|form2)/.test(d.sinif) && d.ad.indexOf('Kaya Golemi') >= 0, 'eski kayıt eskisi gibi: ' + d.ad);

    await p.setViewportSize({ width: 390, height: 844 }); await kur({ tip: 'golem', kilik: 'zehir', huy: 'korkak', ek: 'korsan', gizli: false });
    await p.waitForTimeout(800);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'telefonda taşma yok');
    await p.screenshot({ path: O + 'telefon.png' });
    await p.setViewportSize({ width: 1366, height: 768 });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🌫️ sis → ilk seri açar · 🪖 sarı ok kafaya, eşya yerde · 🔥 kılık adı + 😡 huy · 💥 5 renk patlaması · 🤸 kritikte düşüp kalkar · 🦇 2. form · eski kayıt uyumlu');
  } finally {
    try { await p.evaluate(([y, cy]) => { const kn = _kmAktifKonum || 'varsayilan'; if (cy) localStorage.setItem('dag_km_canavar_' + kn, cy); else localStorage.removeItem('dag_km_canavar_' + kn); _kmCanavar = null; localStorage.removeItem('dag_km_an_kapali'); if (y) { _kmListe = JSON.parse(y); kmOyunListeDegisti && kmOyunListeDegisti(); } }, [yedek, cnvYedek]); } catch (e) {}
    await ctx.close();
  }
}
