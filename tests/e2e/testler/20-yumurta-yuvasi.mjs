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
    await p.evaluate(() => document.querySelectorAll('.yv-sahne').forEach((x) => x.remove())); await p.locator('#yv-kart-0').click();
    await p.locator('.yv-secim button:not([data-renk="altin"]):not([data-renk="elmas"])').first().click();
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
    // yumurta seçilince detay 0,7 sn sonra kendiliğinden açılır (seçim penceresi) — bekle, kapat, kartı elle aç
    await p.waitForTimeout(1200); await p.evaluate(() => kmYuvaCiz()); await p.waitForTimeout(400);
    await p.evaluate(() => document.querySelectorAll('.yv-sahne,.yv-katman').forEach((x) => x.remove())); await p.locator('#yv-kart-0').click();
    dogrula(await p.locator('.yv-pencere', { hasText: 'büyüdü' }).isVisible(), '"büyüdü" penceresi çıkmadı');
    await p.locator('.yv-secim button:not([data-renk="altin"]):not([data-renk="elmas"])').first().click();
    const iki = await p.evaluate((k) => turnuvaDB[k.g][k.ad].oyun.yuva.sira.map((x) => x.no), sp0);
    dogrula(iki.length === 2 && iki[0] !== iki[1], 'ikinci yumurtada aynı hayvan: ' + iki);
    esit(await p.evaluate((k) => yuvaDurum(k.g, k.ad).ilerleme, sp0), 0, 'yeni yumurta sıfırdan başlamalı (artan ısı taşınmaz)');
    // Pencereden skor girme (kullanıcı: "skor girme bölümü nerede") — 3 ok + Kaydet → gerçek seri, yumurta ısınır
    await p.locator('.yv-katman').first().waitFor({ timeout: 5000 }).catch(() => {});
    await p.evaluate(() => document.querySelectorAll('.yv-katman').forEach((x) => x.remove()));
    await p.evaluate(() => document.querySelectorAll('.yv-sahne').forEach((x) => x.remove())); await p.locator('#yv-kart-0').click();
    const seriOnce = await p.evaluate((k) => (turnuvaDB[k.g][k.ad].seriler || []).length, sp0);
    for (const v of ['10', '9', '9']) await p.locator('.yv-ped button[data-ok="' + v + '"]').click();
    await p.locator('.yv-katman [data-kaydet]').click(); await p.waitForTimeout(600);
    const pedSonra = await p.evaluate((k) => ({ seri: (turnuvaDB[k.g][k.ad].seriler || []).length, isi: yuvaDurum(k.g, k.ad).ilerleme }), sp0);
    esit(pedSonra.seri, seriOnce + 1, 'pencereden girilen seri kaydedilmedi');
    dogrula(pedSonra.isi >= 2, 'pencereden girilen seri yumurtayı ısıtmadı');
    // 2026-10-14 geliştirme: ilk büyüyen hayvan kendiliğinden dost olur ve sonraki serilerle beslenir; günde 3 görev;
    // 📺 Sınıf ekranı kartları çizer. (Sınıf/ortak yumurtası 2026-10-17'de kaldırıldı.)
    const gel = await p.evaluate((k) => { const d = yuvaDurum(k.g, k.ad), liste = _kmListe.filter((x) => turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]); return { dost: d.dost, ilk: turnuvaDB[k.g][k.ad].oyun.yuva.sira[0].no, yem: d.yem[d.dost] || 0, gorev: d.gorevler.length }; }, sp0);
    dogrula(gel.dost === gel.ilk && gel.yem >= 2, 'dost atanmadı / beslenmedi: ' + JSON.stringify(gel));
    esit(gel.gorev, 3, 'günün görevleri 3 değil');
    await p.evaluate(() => { document.querySelectorAll('.yv-katman,.yv-sahne').forEach((x) => x.remove()); _yvTv = true; kmYuvaCiz(); });
    dogrula(await p.locator('.yv-tv-kart').count() > 0, 'sınıf ekranı çizilmedi');
    esit(await p.locator('#yv-sinif').count(), 0, 'ortak sınıf yumurtası hâlâ çiziliyor');
    await p.evaluate(() => { _yvTv = false; kmYuvaCiz(); document.querySelectorAll('.yv-sahne').forEach((x) => x.remove()); });
    // 2026-10-14: koyu tema varsayılan; 👥 Sporcular ile çıkar/ekle (Yarışma hattındaki de eklenebilir → ikisini birden oynar)
    dogrula(await p.locator('#yv-kok.yv.koyu').count(), 'koyu tema varsayılan değil');
    const liste = await p.evaluate((k) => {
      const say = () => document.querySelectorAll('.yv-izgara .yv-kart').length, once = say();
      yuvaListeAyarla(k.g + '|' + k.ad, 'cik'); kmYuvaCiz(); const cik = say();
      const h = kmHatlar(); h[k.g + '|' + k.ad] = 'yarisma'; localStorage.setItem(kmHatAnahtari(), JSON.stringify(h));
      yuvaListeAyarla(k.g + '|' + k.ad, 'ek'); kmYuvaCiz(); const ek = say();
      delete h[k.g + '|' + k.ad]; localStorage.setItem(kmHatAnahtari(), JSON.stringify(h)); localStorage.removeItem(yuvaListeAnahtar()); kmYuvaCiz();
      return { once, cik, ek };
    }, sp0);
    dogrula(liste.cik === liste.once - 1 && liste.ek === liste.once, 'yumurtadan çıkar/ekle çalışmadı: ' + JSON.stringify(liste));
    await p.locator('#yv-kok .yv-btn', { hasText: 'Sporcular' }).click();
    dogrula(await p.locator('.yv-pencere .yv-sp-liste').isVisible(), 'Sporcular penceresi açılmadı');
    await p.evaluate(() => document.querySelectorAll('.yv-katman,.yv-sahne').forEach((x) => x.remove()));
    // Nadir yumurta: rekor seri → altın hak; seçilince parlak, ×1.5 ısınır
    const nadir = await p.evaluate((k) => {
      for (let i = 0; i < 20 && !yuvaDurum(k.g, k.ad).secimGerek; i++) _skorKaydetCekirdek(k.g, k.ad, [{ puan: 'X' }, { puan: '10' }, { puan: '10' }]);
      const sp = turnuvaDB[k.g][k.ad]; const tam = (x) => x && Array.isArray(x.oklar) && x.oklar.every((v) => v === 'X' || String(v) === '10'); // önceki kusursuz seriler (eski koşulardan birikir) rekoru engellemesin
      sp.seriler.forEach((x) => { if (tam(x)) x.oklar = ['X', '10', '9']; }); (sp.kartGecmisi || []).forEach((c) => (c.seriler || []).forEach((x) => { if (tam(x)) x.oklar = ['X', '10', '9']; }));
      _skorKaydetCekirdek(k.g, k.ad, [{ puan: 'X' }, { puan: 'X' }, { puan: 'X' }]);
      const d = yuvaDurum(k.g, k.ad); if (!d.secimGerek) return { hata: 'seçim beklenmiyordu' };
      const hak = d.hak.altin; yuvaYumurtaSec(k.g, k.ad, 'altin');
      const s2 = sp.oyun.yuva.sira; return { hak, renk: s2[s2.length - 1].renk, kalan: yuvaDurum(k.g, k.ad).hak.altin };
    }, sp0);
    dogrula(!nadir.hata && nadir.hak >= 1, 'rekor seri altın yumurta hakkı vermedi: ' + JSON.stringify(nadir));
    dogrula(nadir.renk === 'altin' && nadir.kalan === nadir.hak - 1, 'altın yumurta seçilemedi / hak düşmedi: ' + JSON.stringify(nadir));
    esit(await p.evaluate(() => { kmYuvaCiz(); return document.querySelectorAll('#yv-sinif, .yv-sinif').length; }), 0, 'sınıf yumurtası kaldırılmadı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(`yumurta → çatladı → albüm (${son.album.length}), ikinci yumurta farklı hayvan`);
  } finally { await ctx.close(); }
}
