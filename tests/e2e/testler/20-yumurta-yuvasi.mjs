// Karışık Sınıf › Oyunlar › 🥚 Yumurta Yuvası: seçiciden açılır, çocuk yumurta seçer; GERÇEK seriler (_skorKaydetCekirdek)
// yumurtayı ısıtır (her seri +1, hepsi hedefte +1, kendi ortalamasını geçerse +2), 10'da çatlar, 22'de yavru, 40'ta albüme
// girer ve yeni yumurta istenir; seçim sp.oyun.yuva'ya yazılır ve coinT ilerler (sunucuya gidebilsin).
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 950 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.waitForFunction(() => _kmListe.length > 0 && _kmListe.some((k) => turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]), null, { timeout: 30000 });
    // Temiz başlangıç: ilk sporcunun yuvasını sil, seri limitini aç
    const sp0 = await p.evaluate(() => { const k = _kmListe.find((x) => turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]); const sp = turnuvaDB[k.g][k.ad]; if (sp.oyun) delete sp.oyun.yuva; sp.devamModu = true; return { g: k.g, ad: k.ad }; });
    await p.evaluate(() => kmOyunSeciciAc());
    await p.locator('#km-oyun-secici .card', { hasText: 'Yumurta Yuvası' }).click();
    await p.waitForFunction(() => typeof kmYuvaCiz === 'function' && document.querySelector('#yv-kok'), null, { timeout: 30000 });
    // ilk kart → yumurta seçimi
    await p.locator('#yv-kart-0').click();
    await p.locator('.yv-secim button').first().click();
    const ilk = await p.evaluate((k) => { const sp = turnuvaDB[k.g][k.ad]; return { sira: sp.oyun.yuva.sira.length, coinT: sp.coinT || 0, d: yuvaDurum(k.g, k.ad) }; }, sp0);
    esit(ilk.sira, 1, 'yumurta seçilmedi');
    dogrula(ilk.coinT > Date.now() - 60000, 'coinT ilerlemedi (sunucuya gitmez)');
    // Gerçek seriler: 4 iyi seri → her biri en az 2 ısı (hedefte) → çatlama (10)
    const sonuc = await p.evaluate((k) => {
      const adimlar = [];
      for (let i = 0; i < 12; i++) { const r = _skorKaydetCekirdek(k.g, k.ad, [{ puan: '10' }, { puan: '9' }, { puan: '9' }]); if (!r.ok) return { hata: r.sebep }; adimlar.push(yuvaDurum(k.g, k.ad).ilerleme); }
      return { adimlar, d: yuvaDurum(k.g, k.ad) };
    }, sp0);
    dogrula(!sonuc.hata, 'seri kaydedilemedi: ' + sonuc.hata);
    dogrula(sonuc.d.toplam >= 24, 'ısı birikmedi: ' + JSON.stringify(sonuc.adimlar));
    dogrula(sonuc.d.evre >= 1 || sonuc.d.secimGerek, 'yumurta çatlamadı: ' + JSON.stringify(sonuc.d.ilerleme));
    // Kalan ısıyı doldur → albüm + yeni yumurta isteği
    const son = await p.evaluate((k) => { for (let i = 0; i < 30 && !yuvaDurum(k.g, k.ad).secimGerek; i++) _skorKaydetCekirdek(k.g, k.ad, [{ puan: 'X' }, { puan: '10' }, { puan: '10' }]); return yuvaDurum(k.g, k.ad); }, sp0);
    dogrula(son.secimGerek && son.album.length === 1, 'hayvan albüme girmedi: ' + JSON.stringify({ album: son.album.length, ilerleme: son.ilerleme }));
    // Ekran: kart seçim istiyor, detay/seçim penceresi "büyüdü" diyor; yeni yumurta seçilince farklı hayvan
    await p.evaluate(() => kmYuvaCiz()); await p.waitForTimeout(400);
    await p.locator('#yv-kart-0').click();
    dogrula(await p.locator('.yv-pencere', { hasText: 'büyüdü' }).isVisible(), '"büyüdü" penceresi çıkmadı');
    await p.locator('.yv-secim button').first().click();
    const iki = await p.evaluate((k) => turnuvaDB[k.g][k.ad].oyun.yuva.sira.map((x) => x.no), sp0);
    dogrula(iki.length === 2 && iki[0] !== iki[1], 'ikinci yumurtada aynı hayvan: ' + iki);
    esit(await p.evaluate((k) => yuvaDurum(k.g, k.ad).ilerleme, sp0), 0, 'yeni yumurta sıfırdan başlamalı (artan ısı taşınmaz)');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(`yumurta → çatladı → albüm (${son.album.length}), ikinci yumurta farklı hayvan`);
  } finally { await ctx.close(); }
}
