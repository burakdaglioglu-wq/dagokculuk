// 2026-11-12 kullanıcı (derste): "küçük yaş grubu herkes hayali tek rakibe karşı yarışacak ama bu sayfanın görseli çok kötü ve tv
// ekranı da yok" → v408 🤖 Hayali Rakip sahnesi: tablet ve TV aynı sahne (SINIF vs ROBOT, yarış pisti, tur kutuları, robot balonu,
// çocuk düğmeleri: dokun → skor gir). Çocuklara sıralama yok, yalnız "✓ attı / 🏹 sırada". 1180 tablet, TV ve 390 telefon.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1180, yukseklik: 820 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    yedek = await p.evaluate(() => ({ tur: localStorage.getItem(yzAnahtar()), mod: localStorage.getItem('dag_yz_mod'), liste: JSON.stringify(_kmListe) }));
    const n = await p.evaluate(() => {
      _yz.ses = false;
      const l = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (l.length < 8 && !turnuvaDB[g][ad].pasif) l.push({ g, ad }); }));
      _kmListe = l; kmYarismaSifirla(); _kmYarismaBracketGorunum = null;
      window.__hyOnce = l.map((s) => (turnuvaDB[s.g][s.ad].seriler || []).length); window.__hyTop = l.map((s) => turnuvaDB[s.g][s.ad].toplamSkor);
      window.__hyL = l;
      _yzK.tur = 'hayali'; _yzK.haric = {}; yzModAyarla('takim'); yzTakimlariKur(); _kmHayaliZorluk = 'dengeli';
      kmYarismaBaslat();
      return l.length;
    });
    dogrula(n === 8, 'testte 8 sporcu gerekli (gelen ' + n + ')');
    await p.waitForTimeout(400);
    dogrula(await p.locator('#km-icerik .yz-hy').count() === 1, 'tablette Hayali Rakip sahnesi çizilmedi');
    esit(await p.locator('#km-icerik .yz-hy-cocuk').count(), 8, 'her çocuk için düğme olmalı');
    dogrula(await p.locator('#km-icerik .yz-hy-robot').count() === 1, 'robot çizilmedi');

    // 3 çocuk atsın (skor girişi penceresinden)
    for (let i = 0; i < 3; i++) {
      await p.locator('#km-icerik .yz-hy-cocuk').nth(i).click(); await p.waitForTimeout(150);
      dogrula(await p.locator('#yz-tk-giris').count() === 1, 'çocuğa dokununca skor penceresi açılmadı');
      await p.evaluate(() => yzTkOkSayiSec(3));
      for (const v of ['9', '7', '8']) await p.locator('#yz-tk-giris .yz-tk-pad button', { hasText: new RegExp('^' + v + '$') }).first().click();
      await p.locator('#yz-tk-giris button', { hasText: 'Kaydet' }).click(); await p.waitForTimeout(250);
    }
    esit(await p.locator('#km-icerik .yz-hy-cocuk.atti').count(), 3, '3 çocuk "✓ attı" olmalı');
    dogrula(/3\/8 attı/.test(await p.locator('#km-icerik .yz-hy-tur').textContent()), '"3/8 attı" yazmıyor');
    dogrula(await p.evaluate(() => _kmHayaliTurlar.length === 0), 'robot, sınıfta herkes atmadan turunu attı');
    await p.screenshot({ path: 'tests/e2e/_cikti/122-hayali-tablet.png' });

    // 📺 TV
    await p.setViewportSize({ width: 1920, height: 1080 }); await p.waitForTimeout(300);
    await p.locator('.yz-hy-tablet-alt button', { hasText: 'TV' }).click(); await p.waitForTimeout(600);
    await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(300);
    dogrula(await p.locator('#yz-tk-tv .yz-hy.tv').count() === 1, 'TV\'de Hayali Rakip sahnesi yok');
    dogrula(!/gerçek takım ve düello/.test(await p.locator('#yz-tk-tv').textContent()), 'TV hâlâ "gerçek takım ve düello içindir" diyor');
    await p.screenshot({ path: 'tests/e2e/_cikti/122-hayali-tv.png' });
    // TV'den skor: kalan 5 çocuk → tur tamam
    for (let i = 3; i < 8; i++) {
      await p.locator('#yz-tk-tv .yz-hy-cocuk').nth(i).click(); await p.waitForTimeout(120);
      await p.evaluate(() => yzTkOkSayiSec(3));
      for (const v of ['10', '6', '5']) await p.locator('#yz-tk-giris .yz-tk-pad button', { hasText: new RegExp('^' + v + '$') }).first().click();
      await p.locator('#yz-tk-giris button', { hasText: 'Kaydet' }).click(); await p.waitForTimeout(250);
    }
    await p.waitForTimeout(1400);
    dogrula(await p.evaluate(() => _kmHayaliTurlar.length === 1), 'herkes atınca robot turunu atmadı');
    dogrula(/2\. (SET|TUR)/.test(await p.locator('#yz-tk-tv .yz-hy-tur').textContent()), 'herkes atınca 2. set/tura geçmedi');
    esit(await p.locator('#yz-tk-tv .yz-hy-cocuk.atti').count(), 0, 'yeni turda herkes "sırada" olmalı');
    await p.screenshot({ path: 'tests/e2e/_cikti/122-hayali-tv2.png' });
    await p.evaluate(() => yzTkTvKapat()); await p.waitForTimeout(200);

    // 📱 telefon
    await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => kmYarismaCiz()); await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yatay taşma');
    await p.screenshot({ path: 'tests/e2e/_cikti/122-hayali-telefon.png', fullPage: false });
    dogrula(hatalar.length === 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('tablet sahne + 8 çocuk düğmesi · dokun → skor · 3/8 attı · robot turu · TV sahnesi + TV\'den skor · 2. set · 390 px');
  } finally {
    try {
      await p.evaluate((y) => {
        (window.__hyL || []).forEach((s, i) => { const sp = turnuvaDB[s.g][s.ad]; if (sp && sp.seriler) { sp.seriler = sp.seriler.slice(0, window.__hyOnce[i]); sp.toplamSkor = window.__hyTop[i]; sp.lastModified = Date.now(); } });
        try { yzTkTvKapat(); } catch (e) {}
        try { _kmYarismaAktifMaciTemizle(); } catch (e) {}
        _kmRakipTipi = 'gercek'; kmYarismaSifirla();
        if (y) { if (y.tur == null) localStorage.removeItem(yzAnahtar()); else localStorage.setItem(yzAnahtar(), y.tur); if (y.mod == null) localStorage.removeItem('dag_yz_mod'); else localStorage.setItem('dag_yz_mod', y.mod); _kmListe = JSON.parse(y.liste); }
        try { kaydet(); } catch (e) {}
      }, yedek);
    } catch (e) {}
    await ctx.close();
  }
}
