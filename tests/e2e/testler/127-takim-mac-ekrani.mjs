// 2026-11-15 (v419) kullanıcı tablet fotoğrafı: "bu ekran o kadar kötü dizayn edilmiş, görselleri o kadar kötü ki" → taslaktan "A · Takım
// sütunları". 9 sporcu 3v3 → 3 takım birlikte: her takım bir sütun (kaçıncı, büyük puan, çubuk), sporcular fotoğraflı, "👉 sırada";
// sporcuya dokun → alttan skor girişi; Kaydet → kapanır, sporcu "✓ bu seriyi attı", sıradaki ilerler; 2 takımlı eleme maçı da aynı
// ekran; 390 px taşma yok. Atılan seriler sonunda geri alınır.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  const O = 'tests/e2e/_cikti/127-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    yedek = await p.evaluate(() => ({ liste: JSON.stringify(_kmListe), mod: localStorage.getItem('dag_yz_mod') }));
    await p.evaluate(() => {
      const l = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (l.length < 9 && !turnuvaDB[g][ad].pasif) l.push({ g, ad }); }));
      window.__once = {}; l.forEach((s) => { window.__once[s.g + '|' + s.ad] = { n: (turnuvaDB[s.g][s.ad].seriler || []).length, t: turnuvaDB[s.g][s.ad].toplamSkor }; });
      _kmListe = l; kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _yzK.tur = 'takim'; _yzK.haric = {}; _yzK.kaynak = 'rast'; _yzK.bicim = null; _yzK.boyut = 3; _kmYarismaHedef = null; _kmYarismaOkTercih = 3;
      yzModAyarla('takim'); yzTakimlariKur(); yzSihirbazBaslat();
    });
    await p.waitForTimeout(400);
    esit(await p.locator('.yzam-t').count(), 3, '3 takım sütunu');
    esit(await p.locator('.yzam-u').count(), 9, '9 sporcu kartı');
    esit(await p.locator('.yzam-u.sirada').count(), 1, 'bir sporcu "sırada"');
    dogrula(/3 takım birlikte/.test(await p.locator('.yzam-kural').textContent()), 'kural satırı yok');
    await p.screenshot({ path: O + 'bos.png', fullPage: true });
    const onayGec = () => p.evaluate(() => { const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') try { onayOnayla(); } catch (e) {} });
    const at = async (v) => {
      await p.locator('.yzam-u.sirada').click(); await p.waitForTimeout(200);
      dogrula(await p.locator('.yzam-cek').isVisible(), 'skor girişi açılmadı');
      const n = await p.evaluate(() => _kmYarismaOkSayisi);
      for (let i = 0; i < n; i++) await p.locator('.yzam-cek .km-ydok-pad button', { hasText: new RegExp('^' + v + '$') }).first().click();
      await p.locator('.yzam-cek .km-ydok-kaydet').click(); await p.waitForTimeout(250); await onayGec(); await p.waitForTimeout(150);
    };
    const ilk = await p.evaluate(() => document.querySelector('.yzam-u.sirada .ad').childNodes[0].textContent);
    await at('10');
    dogrula(await p.locator('.yzam-cek').count() === 0, 'kaydedince skor girişi kapanmadı');
    dogrula(await p.locator('.yzam-u.atti', { hasText: ilk }).count() === 1, 'atan "✓ bu seriyi attı" olmadı');
    dogrula(await p.evaluate((a) => !document.querySelector('.yzam-u.sirada .ad').textContent.startsWith(a), ilk), 'sıradaki ilerlemedi');
    for (let k = 0; k < 4; k++) await at(['9', '8', '10', '7'][k]);
    await p.locator('.yzam-u.sirada').click(); await p.waitForTimeout(250);
    await p.screenshot({ path: O + 'giris.png' });
    await p.evaluate(() => yzAmKapat()); await p.waitForTimeout(200);
    await p.screenshot({ path: O + 'mac.png', fullPage: true });
    dogrula(await p.locator('.yzam-t .yer').first().textContent() !== '', 'sıra rozeti yok');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px taşıyor');
    await p.screenshot({ path: O + 'telefon.png', fullPage: true });
    await p.locator('.yzam-u.sirada').click(); await p.waitForTimeout(250);
    dogrula(await p.evaluate(() => { const r = document.querySelector('.yzam-cek').getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; }), 'telefonda skor girişi taşıyor');
    await p.screenshot({ path: O + 'telefon-giris.png' });
    await p.evaluate(() => yzAmKapat());
    await p.setViewportSize({ width: 1280, height: 900 });
    // 2 takım → eleme ağacı maçı da aynı ekran
    await p.evaluate(() => { kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _kmListe = _kmListe.slice(0, 4); _yzK.boyut = 2; _yzK.bicim = null; yzTakimlariKur(); yzSihirbazBaslat(); });
    await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => _kmYarismaBracketGorunum === 'agac' || _kmYarismaAktif), 'maç başlamadı');
    esit(await p.locator('.yzam-t').count(), 2, '2 takımlı maçta 2 sütun');
    await p.screenshot({ path: O + 'iki-takim.png', fullPage: true });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('3 takım sütunu · 9 fotoğraflı sporcu · sırada · dokun → alttan giriş → kaydet → ✓ attı, sıra ilerler · 390 px · 2 takımlı maç aynı ekran');
  } finally {
    try {
      await p.evaluate((y) => {
        Object.keys(window.__once || {}).forEach((k) => { const i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)][k.slice(i + 1)]; if (sp) { sp.seriler = (sp.seriler || []).slice(0, window.__once[k].n); sp.toplamSkor = window.__once[k].t; sp.lastModified = Date.now(); } });
        try { yzTkTvKapat(); } catch (e) {}
        kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _yzK.bicim = null; _yzK.tur = null; _yzK.kaynak = null; _kmYarismaOkTercih = null;
        if (y) { _kmListe = JSON.parse(y.liste); if (y.mod == null) localStorage.removeItem('dag_yz_mod'); else localStorage.setItem('dag_yz_mod', y.mod); }
        try { kaydet(); } catch (e) {}
      }, yedek);
    } catch (e) {}
    await ctx.close();
  }
}
