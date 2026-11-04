// 📱 Atış Ölçer (2026-11-04, v374 — kullanıcı rakip uygulamanın saat/AirPods hareketiyle atış zamanlamasını gösterip "son ikisini yap"
// dedi). Skor Gir'deki düğmeden açılır; sahte hareket sensörü verisiyle (yerçekimi + dönme + bırakış sarsıntısı): 3 atış (tutuş 4 / 3 / 6 sn)
// ve 1 indirme (atmadan yayı indirmek) doğru ayrılır, hedef tutuş (5 sn) aşılınca titreşir, atıştan sonra yayı indirmek "indirme"
// sayılmaz; Bitir → özet + bugün işaretlenen 3 okla eşleşen NİŞAN İZİ TEKRARI. KM araç listesinde de var. 390 px taşma yok.
// Sporcunun geçici okları ve oturum geçmişi sonunda geri alınır.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

// sahte sensör: dinlenme (yerçekimi z'de) → kaldır (y'ye döner) → tut (hafif salınım) → bırak (sarsıntı) → takip → indir
const ORNEK = `window._hkSahte = function () {
  const l = []; let t = 1000; const dt = 20;
  const ekle = (ag, r, lin) => { l.push({ t, ag, r: r || [0, 0, 0], l: lin || [0, 0, 0] }); t += dt; };
  const dinlen = (ms) => { for (let i = 0; i < ms / dt; i++) ekle([0, 0, 9.8]); };
  const kaldir = () => { for (let i = 0; i <= 25; i++) { const a = i / 25 * Math.PI / 2; ekle([0, 9.8 * Math.sin(a), 9.8 * Math.cos(a)], [0, 90, 0]); } };
  const tut = (ms) => { for (let i = 0; i < ms / dt; i++) { const s = i * dt / 1000; ekle([0, 9.8, 0], [0.3, 3 * Math.sin(s * 5), 2 * Math.cos(s * 4)]); } };
  const indir = () => { for (let i = 0; i <= 25; i++) { const a = (1 - i / 25) * Math.PI / 2; ekle([0, 9.8 * Math.sin(a), 9.8 * Math.cos(a)], [0, -90, 0]); } };
  const birak = () => { ekle([0, 9.8, 0], [0, 40, 260], [32, 4, 2]); for (let i = 0; i < 1500 / dt; i++) ekle([0, 9.8, 0], [0, 4, 3]); };
  dinlen(1000);
  [4000, 3000, 6000].forEach((h) => { kaldir(); tut(h); birak(); indir(); dinlen(1200); });
  kaldir(); tut(2000); indir(); dinlen(1000); // atmadan indirdi
  return l;
};`;

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 844 });
  let geri = null;
  try {
    await uygulamaAc(p);
    geri = await p.evaluate(() => {
      const ge = document.getElementById('giris-ekrani'); if (ge) ge.style.display = 'none';
      aktifPlatform = 'egitmen'; try { tablariPlatformaGoreAyarla(); } catch (e) { }
      const g = ['buyukler', 'yildizlar', 'kucukler', 'minikler'].find((x) => Object.keys(turnuvaDB[x] || {}).some((a) => !turnuvaDB[x][a].pasif));
      const ad = Object.keys(turnuvaDB[g]).find((a) => !turnuvaDB[g][a].pasif);
      aktifGrup = g; skorEkraniniAc(ad);
      window.__titre = []; navigator.vibrate = (x) => { window.__titre.push(x); return true; };
      return { g, ad, detay: (turnuvaDB[g][ad].detayliOklar || []).length, gecmis: localStorage.getItem('dagsk_atis_olcer'), ayar: localStorage.getItem('dagsk_hk_ayar'), hedef: localStorage.getItem('dagsk_hk_hedef'), rapor: localStorage.getItem('dagsk_hk_rapor') };
    });
    dogrula(await p.locator('#hk-giris-btn').isVisible(), 'Skor Gir\'de Atış Ölçer düğmesi yok');
    await p.locator('#hk-giris-btn').click();
    await p.waitForSelector('#hk .hk-ana', { timeout: 15000 });
    dogrula(await p.evaluate((ad) => document.getElementById('hk').textContent.includes(ad), geri.ad), 'sporcu adı başlıkta yok');
    await p.locator('#hk .hk-cip', { hasText: '5 sn' }).click();
    await p.locator('#hk .hk-cip', { hasText: '18 m' }).click();
    dogrula(await p.evaluate(() => document.getElementById('hk').scrollWidth <= document.getElementById('hk').clientWidth + 1), 'hazırlık ekranı taşıyor');
    await p.locator('#hk .hk-ana', { hasText: 'Başla' }).click();
    await p.waitForSelector('#hk-evre');
    await p.evaluate(ORNEK);
    await p.evaluate(() => _hkIc.besle(_hkSahte()));
    const D = await p.evaluate(() => { const d = _hkIc.durum().D; return { n: d.oklar.length, tutus: d.oklar.map((o) => o.tutus), sal: d.oklar.map((o) => o.salinim), yol: d.oklar.map((o) => o.yol.length), indirme: d.indirme, evre: d.evre }; });
    log('tutuş: ' + D.tutus.map((x) => (x / 1000).toFixed(2)).join(' / ') + ' sn · salınım ' + D.sal.join(', ') + ' · indirme ' + D.indirme);
    esit(D.n, 3, '3 atış algılanmalı');
    [4000, 3000, 6000].forEach((h, i) => dogrula(Math.abs(D.tutus[i] - h) < 600, `${i + 1}. okun tutuşu ${D.tutus[i]} ms ≠ ~${h}`));
    esit(D.indirme, 1, 'atmadan indirme 1 kez sayılmalı (atıştan sonra indirmek sayılmaz)');
    dogrula(D.sal.every((s) => s > 0) && D.yol.every((n) => n >= 10), 'salınım / nişan izi boş');
    esit(D.evre, 'bekle', 'sonunda hazır beklemeli');
    const titre = await p.evaluate(() => window.__titre);
    dogrula(titre.some((x) => x === 220), '5 sn hedef aşılınca titremedi: ' + JSON.stringify(titre));
    dogrula(/3/.test(await p.locator('#hk .hk-sayac div').first().innerText()), 'canlı sayaçta 3 ok yok');
    // v375 sesli uyarı: hedef aşılınca güçlü bip, bırakışta kısa bip
    const bip = await p.evaluate(() => _hkIc.durum().bipler);
    dogrula(bip.includes(700) && bip.includes(880), 'sesli uyarı çalmadı: ' + JSON.stringify(bip));
    // v375 yanlış bildirme: son oku çıkarır + ham pencereyi saklar (sporcu adı yok); kaçan atış not edilir
    await p.locator('#hk .hk-bildir .hk-cip', { hasText: 'Yanlış saydı' }).click();
    esit(await p.evaluate(() => _hkIc.durum().D.oklar.length), 2, 'Yanlış saydı oku çıkarmadı');
    await p.locator('#hk .hk-bildir .hk-cip', { hasText: 'Atış kaçtı' }).click();
    esit(await p.evaluate(() => JSON.stringify(_hkIc.durum().kacan)), '[2]', 'kaçan atış konumu yanlış');
    const rap = await p.evaluate((ad) => { const l = JSON.parse(localStorage.getItem('dagsk_hk_rapor')).slice(-2); return { tur: l.map((r) => r.tur), dolu: l.every((r) => r.ornek.length > 50), ad: JSON.stringify(l).includes(ad) }; }, geri.ad);
    esit(JSON.stringify(rap.tur), JSON.stringify(['yanlis-sayim', 'kacan-atis']), 'bildirim türleri');
    dogrula(rap.dolu, 'bildirimde ham sensör verisi yok');
    dogrula(!rap.ad, 'sensör kaydında sporcu adı olmamalı');
    // eslestir: kaçan atış sonraki okları bir kaydırır
    const es = await p.evaluate(() => _hkIc.eslestir({ t: 1000000, oklar: [{ tutus: 1 }, { tutus: 2 }], kacan: [1] }, [{ t: 1000001, puan: 'A' }, { t: 1000002, puan: 'B' }, { t: 1000003, puan: 'C' }], null).map((e) => e.o && e.o.puan));
    esit(JSON.stringify(es), JSON.stringify(['A', 'C']), 'kaçan atıştan sonra eşleşme kaymadı');
    // tutusAnaliz: az okta karar yok; 4-6 sn iyi → aralık çıkar; fark yoksa aralık yok
    const an = await p.evaluate(() => {
      const c = (d) => d.flatMap(([sn, puan, n]) => Array(n).fill(0).map(() => ({ tutus: sn * 1000 + 100, puan })));
      return { az: _hkIc.tutusAnaliz(c([[4, 9, 5]])), iyi: _hkIc.tutusAnaliz(c([[3, 7, 5], [4, 9, 5], [5, 9, 5], [7, 6, 5]])), yok: _hkIc.tutusAnaliz(c([[3, 8, 6], [4, 8, 6], [5, 8, 6], [7, 8, 6]])), tek: _hkIc.tutusAnaliz(c([[4, 9, 18]])) };
    });
    dogrula(!an.az.hazir, '18 oktan azla karar verilmemeli');
    esit(an.iyi.bas, 4, 'en iyi aralık 4 sn başlamalı'); esit(an.iyi.son, 6, 'en iyi aralık 6 sn bitmeli');
    esit(an.yok.bas, null, 'fark yokken aralık önerilmemeli');
    esit(an.tek.bas, null, 'hep aynı sürede karşılaştırma yapılmamalı');
    // kalan testler 3 oku bekler: sahte akışı temiz oturumla yeniden besle
    await p.evaluate(() => { const h = _hkIc.durum(); h.kacan = []; h.D = _hkIc.yeniDurum(); _hkIc.besle(_hkSahte()); });
    // bugün işaretlenen 3 ok (Skor Gir / fotoğraf) → nişan izi tekrarında eşleşir
    await p.evaluate(({ g, ad }) => { const sp = turnuvaDB[g][ad]; sp.detayliOklar = sp.detayliOklar || []; const t = Date.now(); [[0, 4, 'X'], [12, -6, '9'], [-20, 14, '8']].forEach(([x, y, puan]) => sp.detayliOklar.push({ x, y, puan, tip: '6ring', t })); }, geri);
    await p.locator('#hk .hk-ana', { hasText: 'Bitir' }).click();
    await p.waitForSelector('#hk-tekrar');
    const oz = await p.evaluate(() => ({ t: document.getElementById('hk').textContent, sat: [...document.querySelectorAll('#hk .hk-sat .hk-puan')].map((e) => e.textContent) }));
    dogrula(/3 ok/i.test(oz.t) && /3 ok hedefle eşleşti/.test(oz.t), 'özet / eşleşme yazısı yok');
    esit(JSON.stringify(oz.sat), JSON.stringify(['X', '9', '8']), 'oklar sırayla eşleşmedi');
    await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => { const c = document.getElementById('hk-tekrar').getContext('2d').getImageData(0, 0, 320, 320).data; let r = 0; for (let i = 0; i < c.length; i += 4) if (c[i] > 200 && c[i + 1] > 100 && c[i + 1] < 170 && c[i + 2] < 60) r++; return r > 20; }), 'tekrar çiziminde turuncu iz yok');
    dogrula(await p.evaluate(({ g, ad }) => { const k = JSON.parse(localStorage.getItem('dagsk_atis_olcer') || '{}')[g + '|' + ad]; return k && k.length && k[k.length - 1].oklar.length === 3; }, geri), 'oturum geçmişe yazılmadı');
    // v375 uygun süre kartı: 3/18 ilerleme; sensör kayıtları dosya olarak iner; özette ok çıkarınca geçmiş de güncellenir
    dogrula(/3 \/ 18/.test(await p.locator('#hk .hk-kisisel').innerText()), 'uygun süre ilerlemesi yok');
    const [indir] = await Promise.all([p.waitForEvent('download', { timeout: 5000 }), p.locator('#hk .hk-rapor').click()]);
    dogrula(/^atis-olcer-sensor-.*\.json$/.test(indir.suggestedFilename()), 'sensör kaydı dosya adı');
    await p.locator('#hk .hk-sat-sil').first().click();
    await p.waitForFunction(() => document.querySelectorAll('#hk .hk-sat').length === 2);
    dogrula(await p.evaluate(({ g, ad }) => { const k = JSON.parse(localStorage.getItem('dagsk_atis_olcer'))[g + '|' + ad]; const son = k[k.length - 1]; return son.oklar.length === 2 && k.filter((s) => s.t === son.t).length === 1; }, geri), 'ok çıkarınca geçmiş güncellenmedi');
    dogrula(await p.evaluate(() => document.getElementById('hk').scrollWidth <= document.getElementById('hk').clientWidth + 1), 'özet ekranı taşıyor');
    // KM: Diğer araçlar › Teknik & video
    dogrula(await p.evaluate(() => KM_ARAC_GRUPLAR.some((gr) => gr.idler.includes('atisolcer')) && !!kmAracBul('atisolcer')), 'KM araç listesinde Atış Ölçer yok');
    await p.evaluate(() => hkKapat());
    dogrula(await p.evaluate(() => !document.getElementById('hk')), 'kapatınca ekran kalmamalı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Atış Ölçer: 3 atış + 1 indirme, titreşim, özet, nişan izi tekrarı (X / 9 / 8 eşleşti), KM listesi');
  } finally {
    if (geri) await p.evaluate((y) => {
      try { hkKapat(); } catch (e) { }
      const sp = turnuvaDB[y.g][y.ad]; if (sp && sp.detayliOklar) sp.detayliOklar = sp.detayliOklar.slice(0, y.detay);
      if (y.gecmis == null) localStorage.removeItem('dagsk_atis_olcer'); else localStorage.setItem('dagsk_atis_olcer', y.gecmis);
      if (y.ayar == null) localStorage.removeItem('dagsk_hk_ayar'); else localStorage.setItem('dagsk_hk_ayar', y.ayar);
      if (y.hedef == null) localStorage.removeItem('dagsk_hk_hedef'); else localStorage.setItem('dagsk_hk_hedef', y.hedef);
      if (y.rapor == null) localStorage.removeItem('dagsk_hk_rapor'); else localStorage.setItem('dagsk_hk_rapor', y.rapor);
    }, geri).catch(() => { });
    await ctx.close();
  }
}
