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
    yedek = await p.evaluate(() => ({ tur: localStorage.getItem(yzAnahtar()), mod: localStorage.getItem('dag_yz_mod'), liste: JSON.stringify(_kmListe), sv: localStorage.getItem(yzHySeviyeAnahtar()), rk: localStorage.getItem('dag_yz_hy_rakip') }));
    const n = await p.evaluate(() => {
      _yz.ses = false; localStorage.setItem('dag_yz_hy_ses', '0');
      const l = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (l.length < 8 && !turnuvaDB[g][ad].pasif && (typeof bugunkuSeriSayisi !== 'function' || bugunkuSeriSayisi(turnuvaDB[g][ad]) < 5)) l.push({ g, ad }); })); // günlük seri limitine takılmayanlar
      _kmListe = l; kmYarismaSifirla(); _kmYarismaBracketGorunum = null;
      window.__hyOnce = l.map((s) => (turnuvaDB[s.g][s.ad].seriler || []).length); window.__hyTop = l.map((s) => turnuvaDB[s.g][s.ad].toplamSkor);
      window.__hyL = l;
      _yzK.tur = 'hayali'; _yzK.haric = {}; yzModAyarla('takim'); yzTakimlariKur(); _kmHayaliZorluk = 'dengeli';
      localStorage.setItem(yzHySeviyeAnahtar(), JSON.stringify({ [yzHyGrup(_kmTakimlar[0].uyeler)]: { ejderha: { sv: 3 } } }));
      kmYarismaKurulumCiz();
      return l.length;
    });
    // v412: kurulumda 4 rakip kartı → Ejderha seç (Sv.3)
    await p.waitForTimeout(300);
    esit(await p.locator('.yz-hy-kur-k').count(), 4, 'kurulumda 4 rakip');
    await p.locator('.yz-hy-kur-k[data-rk="ejderha"]').click(); await p.waitForTimeout(300);
    dogrula(/Sv.3/.test(await p.locator('.yz-hy-kur-svd').textContent()), 'ejderha seviyesi Sv.3 görünmeli');
    await p.locator('.yz-hy-kur').scrollIntoViewIfNeeded(); await p.screenshot({ path: 'tests/e2e/_cikti/122-hayali-kurulum.png' });
    const rk = await p.evaluate(() => { kmYarismaBaslat(); const B = _kmTakimlar[1]; return { rk: B.hyRakip, sv: B.hySeviye, ad: B.ad, ort: B.hyOrt, sinif: yzHySinifOrt(_kmTakimlar[0].uyeler) }; });
    esit(rk.rk, 'ejderha', 'rakip ejderha'); esit(rk.sv, 3, 'seviye 3'); dogrula(/Ateş Ejderhası/.test(rk.ad), 'rakip adı: ' + rk.ad);
    dogrula(Math.abs(rk.ort - Math.max(2, Math.min(9.6, rk.sinif - 0.3))) < 0.02, 'Sv.3 gücü sınıf ortalaması -0.3 olmalı: ' + JSON.stringify(rk));
    dogrula(n === 8, 'testte 8 sporcu gerekli (gelen ' + n + ')');
    await p.waitForTimeout(400);
    dogrula(await p.locator('#km-icerik .yz-hy').count() === 1, 'tablette Hayali Rakip sahnesi çizilmedi');
    esit(await p.locator('#km-icerik .yz-hy-cocuk').count(), 8, 'her çocuk için düğme olmalı');
    dogrula(await p.locator('#km-icerik .yz-hy-robot.rk-ejderha').count() === 1, 'ejderha çizilmedi');

    // 3 çocuk atsın (skor girişi penceresinden)
    for (let i = 0; i < 3; i++) {
      await p.locator('#km-icerik .yz-hy-cocuk').nth(i).click(); await p.waitForTimeout(150);
      dogrula(await p.locator('#yz-tk-giris').count() === 1, 'çocuğa dokununca skor penceresi açılmadı');
      await p.evaluate(() => yzTkOkSayiSec(3));
      for (const v of ['9', '7', '8']) await p.locator('#yz-tk-giris .yz-tk-pad button', { hasText: new RegExp('^' + v + '$') }).first().click();
      await p.locator('#yz-tk-giris button', { hasText: 'Kaydet' }).click(); await p.waitForTimeout(250);
    }
    await p.waitForSelector('#yz-tk-giris', { timeout: 4000 }); // v410: sıradaki kendiliğinden açıldı
    esit(await p.evaluate(() => _yzTk.giris.k), await p.evaluate(() => _kmTakimlar[0].uyeler[3].g + '|' + _kmTakimlar[0].uyeler[3].ad), 'kaydetten sonra 4. çocuk açılmalı');
    await p.evaluate(() => yzTkGirisKapat());
    esit(await p.locator('#km-icerik .yz-hy-cocuk.atti').count(), 3, '3 çocuk "✓ attı" olmalı');
    dogrula(/3\/8 attı/.test(await p.locator('#km-icerik .yz-hy-tur').textContent()), '"3/8 attı" yazmıyor');
    dogrula(await p.evaluate(() => _kmHayaliTurlar.length === 0), 'robot, sınıfta herkes atmadan turunu attı');
    await p.screenshot({ path: 'tests/e2e/_cikti/122-hayali-tablet.png' });
    // ✏️ takım adına dokun → değiştir
    await p.evaluate(() => { window.__prm = window.prompt; window.prompt = () => 'Kartallar'; });
    await p.locator('#km-icerik .yz-hy-ad-btn').click(); await p.waitForTimeout(300);
    await p.evaluate(() => { window.prompt = window.__prm; });
    dogrula(/Kartallar/.test(await p.locator('#km-icerik .yz-hy-ad-btn').textContent()), 'takım adı değişmedi');

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
    // v410: robot atışı kaplaması → sonuç → sıradaki çocuğun penceresi kendiliğinden
    await p.waitForSelector('#yz-hy-atis', { timeout: 4000 });
    dogrula(await p.locator('#yz-hy-atis.yayin .yy-kam').count() === 1, 'yayın tarzı atış (hedef kamerası) yok');
    await p.waitForSelector('#yz-hy-pop.ac', { timeout: 4000 }); await p.waitForTimeout(250); await p.screenshot({ path: 'tests/e2e/_cikti/122-hayali-robot-atis.png' });
    await p.waitForSelector('#yz-hy-at-sonuc.goster', { timeout: 16000 });
    await p.screenshot({ path: 'tests/e2e/_cikti/122-hayali-robot-sonuc.png' });
    await p.locator('#yz-hy-atis').click();
    await p.waitForSelector('#yz-tk-giris', { timeout: 4000 });
    const ilk = await p.evaluate(() => _yzTk.giris && _yzTk.giris.k);
    esit(ilk, await p.evaluate(() => _kmTakimlar[0].uyeler[0].g + '|' + _kmTakimlar[0].uyeler[0].ad), 'tur bitince sıradaki = listenin ilki olmalı');
    dogrula(/Sırada|hazır mısın|atıyor/.test(await p.locator('#yz-tk-tv .yz-hy-balon').textContent()), 'robot sıradakini çağırmadı');
    // kaydet → bir sonraki kendiliğinden açılır, robot yorum yapar
    await p.evaluate(() => yzTkOkSayiSec(3));
    for (const v of ['10', '9', '9']) await p.locator('#yz-tk-giris .yz-tk-pad button', { hasText: new RegExp('^' + v + '$') }).first().click();
    await p.locator('#yz-tk-giris button', { hasText: 'Kaydet' }).click(); await p.waitForTimeout(300);
    dogrula(/sarı|Devrelerim/.test(await p.locator('#yz-tk-tv .yz-hy-balon').textContent()), 'robot üç sarıya yorum yapmadı');
    await p.waitForSelector('#yz-tk-giris', { timeout: 4000 });
    esit(await p.evaluate(() => _yzTk.giris && _yzTk.giris.k), await p.evaluate(() => _kmTakimlar[0].uyeler[1].g + '|' + _kmTakimlar[0].uyeler[1].ad), 'kaydetten sonra ikinci çocuk açılmadı');
    await p.evaluate(() => yzTkGirisKapat());
    await p.screenshot({ path: 'tests/e2e/_cikti/122-hayali-tv2.png' });
    await p.evaluate(() => yzTkTvKapat()); await p.waitForTimeout(200);

    // v412: maç kazanılınca seviye bir kez artar
    const svx = await p.evaluate(() => { const B = _kmTakimlar[1], g = B.hyGrup; const once = yzHySeviye(g, 'ejderha'); yzHySonucIsle(0, B); yzHySonucIsle(0, B); return [once, yzHySeviye(g, 'ejderha')]; });
    esit(JSON.stringify(svx), JSON.stringify([3, 4]), 'kazanınca bir seviye (bir kez)');
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
        if (y) { if (y.sv == null) localStorage.removeItem(yzHySeviyeAnahtar()); else localStorage.setItem(yzHySeviyeAnahtar(), y.sv); if (y.rk == null) localStorage.removeItem('dag_yz_hy_rakip'); else localStorage.setItem('dag_yz_hy_rakip', y.rk); }
        if (y) { if (y.tur == null) localStorage.removeItem(yzAnahtar()); else localStorage.setItem(yzAnahtar(), y.tur); if (y.mod == null) localStorage.removeItem('dag_yz_mod'); else localStorage.setItem('dag_yz_mod', y.mod); _kmListe = JSON.parse(y.liste); }
        try { kaydet(); } catch (e) {}
      }, yedek);
    } catch (e) {}
    await ctx.close();
  }
}
