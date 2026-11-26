// 2026-11-26 (v468) Yarışma Artı — kullanıcı telefondan yönetiyor, 8 öneriden "hepsini yap":
// 🪄 otomatik kurulum (resimli kurulumda da), 👍 telefonda alt çubuk (Sıradaki / Düzelt / Ses / Süre),
// 🎤 sesle puan ("on on on" → oklar dolar, 1.5 sn sonra kendiliğinden kaydeder, sıradakine geçer),
// 🌟 rekor anı (TV'de kutlama), 🧭 koç özeti, 🗺️ yolculuk + veliye WhatsApp. Tur kayıt dışı; önceki durum geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 860 });
  let yedek = null;
  const ekran = async (ad) => { if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-' + ad + '.png' }); };
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    await p.setViewportSize({ width: 390, height: 844 });
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), ars: localStorage.getItem('dag_yz_arsiv'), ayr: localStorage.getItem('dag_yz_kur_ayrintili') }));
    await p.waitForFunction(() => typeof yaOtoKurAc === 'function', null, { timeout: 8000 });
    await p.evaluate(() => {
      localStorage.removeItem(yzAnahtar()); localStorage.setItem('dag_yz_kur_ayrintili', '0'); _yzr.ayrintili = false; _yzr.adim = 1;
      if (yzRoster().length < 4) { _kmListe = Object.keys(turnuvaDB.buyukler || {}).slice(0, 5).map((ad) => ({ g: 'buyukler', ad })); }
      _yz.kurulum = null; yzModAyarla('siralama'); yzKurAyar('kayit', false); yzCiz();
    });
    await p.waitForTimeout(300);

    // 🪄 resimli kurulumun 1. adımında kart
    dogrula(await p.locator('.ya-oto').count() === 1, 'resimli kurulumda Otomatik kur kartı yok');
    await ekran('1-kurulum');
    await p.locator('.ya-oto button').click();
    await p.waitForSelector('#ya-pencere .ya-oh');
    const hedefSay = await p.locator('#ya-pencere .ya-oh').count();
    dogrula(hedefSay >= 1, 'önizlemede hedef yok');
    await ekran('2-oto-onizleme');
    await p.locator('#ya-pencere button', { hasText: 'Böyle başlat' }).click();
    await p.waitForTimeout(400);
    const d0 = await p.evaluate(() => { const d = yzOku().durum; return { asama: d.asama, n: d.katilimci.length, h: d.hedefler, k: d.katilimci, mesafe: d.ayar.mesafe, yuz: d.ayar.yuz, format: d.ayar.format }; });
    esit(d0.asama, 'tur', 'otomatik kurulum turu başlatmalı');
    esit(Object.keys(d0.h).length, d0.n, 'her sporcunun hedefi olmalı');

    // Arşive bu sporculardan 3 eski tur (aynı mesafe/kağıt/format): ilk sporcunun en iyi serisi küçük olsun
    await p.evaluate((d) => {
      const f = yzFormatBul(d.format), ok = f.ok, ars = [];
      for (let t = 0; t < 3; t++) {
        ars.push({ id: 'e2e-ya-' + t, t: Date.now() - (5 - t) * 86400000, g: Date.now(), tarih: bugunISO(new Date(Date.now() - (5 - t) * 86400000)), mesafe: d.mesafe, format: d.format, yuz: d.yuz || '6',
          sporcular: d.k.map((k, i) => { const seriT = Array.from({ length: 4 }, () => ok * (6 + (i % 2))); return { k, ad: yzKAd(k), sira: i + 1, toplam: seriT.reduce((a, b) => a + b, 0), on: 0, x: 0, ok: ok * 4, seriT }; }) });
      }
      localStorage.setItem('dag_yz_arsiv', JSON.stringify(ars));
    }, d0);

    // 👍 alt çubuk
    await p.evaluate(() => yzCiz()); await p.waitForTimeout(200);
    dogrula(await p.locator('#ya-bar').isVisible(), 'telefonda alt çubuk görünmüyor');
    const ilk = await p.evaluate(() => yzHedefSirasi(yzOku())[0]);
    dogrula((await p.locator('.ya-bar-ana').innerText()).includes(await p.evaluate((k) => yzKisaAd(yzKAd(k)), ilk)), 'çubuk sıradaki sporcuyu göstermiyor');
    await ekran('3-cubuk');
    await p.locator('.ya-bar-ana').click();
    await p.waitForSelector('.yz-giris');
    esit(await p.evaluate(() => _yz.giris.k), ilk, 'Sıradaki → ilk hedefteki sporcu açılmalı');

    // 🎤 sesle puan (tanıma motoru yerine metin verilir)
    const okSay = await p.evaluate(() => yzGirisOkSay(_yz.giris, yzOku().durum));
    dogrula(await p.evaluate(() => JSON.stringify(yaSesCoz('dokuz sekiz on iks ıska 9810'))) === JSON.stringify(['9', '8', '10', 'X', 'M', '9', '8', '10'].map((x) => ({ p: x }))), 'ses çözümleme yanlış');
    await p.evaluate((n) => yaSesUygula(Array.from({ length: n }, () => 'on').join(' ')), okSay);
    esit(await p.evaluate(() => _yz.giris.oklar.length), okSay, 'sesle oklar dolmalı');
    await p.waitForTimeout(1800);
    const sonra = await p.evaluate((k) => ({ kayit: !!yzSkor(yzOku(), k)[0], acik: _yz.giris && _yz.giris.k, rek: yzOku().rekorAn }), ilk);
    dogrula(sonra.kayit, 'sesli giriş 1.5 sn sonra kaydedilmedi');
    dogrula(sonra.acik && sonra.acik !== ilk, 'kayıttan sonra sıradakine geçmedi');

    // 🌟 rekor anı (eski en iyi seri ok×6 ya da ok×7, bu seri ok×10)
    dogrula(sonra.rek && sonra.rek.k === ilk && sonra.rek.top === okSay * 10, 'rekor anı yazılmadı');
    await p.evaluate(() => { yzGirisKapat(); _ya.rekorGoster = {}; yaRekorGoster(yzOku().rekorAn); });
    dogrula(await p.locator('#ya-rekor').isVisible(), 'rekor kutlaması görünmüyor');
    await ekran('4-rekor');
    await p.locator('#ya-rekor').click();

    // ↩ son girişi düzelt
    await p.locator('.ya-bar-k', { hasText: 'Düzelt' }).click();
    await p.waitForSelector('.yz-giris');
    esit(await p.evaluate(() => _yz.giris.k + ':' + _yz.giris.duzeltme), ilk + ':true', 'Düzelt son girişi açmalı');
    await p.evaluate(() => yzGirisKapat());

    // 🧭 koç özeti
    await p.evaluate(() => yzMenu());
    esit(await p.locator('#onay-modal .ya-menu').count(), 2, '⋯ Diğer menüsünde Koç özeti + Yolculuk');
    await p.locator('#onay-modal .ya-menu', { hasText: 'Koç özeti' }).click();
    await p.waitForSelector('#ya-pencere .ya-kb');
    dogrula((await p.locator('#ya-pencere').innerText()).includes('İlerleyenler'), 'koç özetinde ilerleyen yok');
    await ekran('5-koc');
    await p.evaluate(() => yaPencereKapat());

    // 🗺️ yolculuk + veliye gönder
    await p.evaluate((k) => yaYolculukAc(yzEnc(k)), ilk);
    await p.waitForSelector('#ya-pencere .ya-yol-svg');
    esit(await p.locator('#ya-pencere .ya-yol-svg circle').count(), 4, '3 eski + bugünkü tur taşı');
    const mesaj = await p.locator('.ya-yol-mesaj').innerText();
    dogrula(mesaj.includes('Ok ortalaması') && !/₺|TL|aidat/i.test(mesaj), 'veli mesajı yanlış: ' + mesaj);
    await ekran('6-yolculuk');
    await p.locator('#ya-pencere button', { hasText: 'Veliye gönder' }).click();
    dogrula(await p.evaluate(() => window.__acilan.some((u) => u.startsWith('https://api.whatsapp.com/send'))), 'WhatsApp açılmadı');
    await p.evaluate(() => yaYolListe());
    await p.waitForSelector('#ya-pencere .ya-yl');
    await ekran('7-yolculuk-liste');
    await p.evaluate(() => yaPencereKapat());

    // 390 px: taşma yok
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= 392), '390 px sayfa yana taşıyor');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('➕ otomatik kur, alt çubuk, sesle puan, rekor anı, düzelt, koç özeti, yolculuk + WhatsApp, 390 px ✓');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzGirisKapat(); yaSesKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); if (y.ars) localStorage.setItem('dag_yz_arsiv', y.ars); else localStorage.removeItem('dag_yz_arsiv'); if (y.ayr) localStorage.setItem('dag_yz_kur_ayrintili', y.ayr); }, yedek).catch(() => {});
    await ctx.close();
  }
}
