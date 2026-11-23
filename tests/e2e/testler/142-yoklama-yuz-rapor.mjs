// 📋 v436 Yönetici › Yoklama: Yüz Kartları varsayılan (kullanıcı alternatif sayfasında 2'yi seçti) + 📄 Rapor sekmesi
// (günlük: grup başına ✓ gelenler | ✗ gelmeyenler; haftalık: sporcu × ders günü tablosu) + aynı düzende iki PDF.
// Test verisi geçmiş bir haftaya (2025-01-06 / 08) yazılır, sonunda silinir.
import { sayfaAc, uygulamaAc, yoneticiAc, dogrula, esit, yataydaTasmaYok } from '../yardimci.mjs';

const PZT = '2025-01-06', CAR = '2025-01-08', CIKTI = 'tests/e2e/_cikti/';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 844 });
  try {
    await uygulamaAc(p);
    await yoneticiAc(p, 'yoklama');
    const s = await p.evaluate(({ PZT, CAR }) => {
      let b = _yokAktifUyeler('buyukler').slice(0, 3), k = _yokAktifUyeler('kucukler').slice(0, 1);
      otomatikYoklamaDB[PZT] = {}; otomatikYoklamaDB[CAR] = {};
      otomatikYoklamaDB[PZT][b[0]] = { saat: '17:05', grup: 'buyukler', elle: true, geldi: true };
      otomatikYoklamaDB[PZT][b[1]] = { saat: '17:10', grup: 'buyukler' };
      otomatikYoklamaDB[PZT][k[0]] = { saat: '16:00', grup: 'kucukler', elle: true, geldi: true };
      otomatikYoklamaDB[CAR][b[0]] = { saat: '17:02', grup: 'buyukler', elle: true, geldi: true };
      otomatikYoklamaDB[CAR][b[1]] = { saat: '17:30', grup: 'buyukler', elle: true, geldi: false };
      return { b, k, bSay: _yokAktifUyeler('buyukler').length };
    }, { PZT, CAR });
    dogrula(s.b.length === 3 && s.k.length === 1, 'yerel veride büyükler (3) / küçükler (1) sporcu yok');

    // 1) Yoklama sekmesi: tek parça sekme çubuğu (5 sekme), Yüz Kartları varsayılan, sayaç, telefonda taşma yok
    await p.evaluate((PZT) => { _yonYokGrupFiltre = '__hepsi'; _yonElTarih = PZT; yoneticiYoklamaTip = 'gunluk'; yoneticiYoklamaCiz(); }, PZT);
    await p.waitForSelector('.yy-izgara .yy-kutu');
    esit(await p.locator('.yy-sekme .yy-sekme-b').count(), 5, 'sekme sayısı');
    dogrula(/Rapor/.test(await p.locator('.yy-sekme').textContent()), 'Rapor sekmesi yok');
    const sayac = await p.evaluate(() => [...document.querySelectorAll('.yy-sayac b')].map((b) => +b.textContent));
    esit(sayac[0], 3, 'GELDİ sayacı (2 büyük + 1 küçük)');
    dogrula(await yataydaTasmaYok(p), 'yoklama ekranı 390 px yana taşıyor');
    const kart = p.locator('.yy-kutu', { hasText: s.b[2] }).first();
    await kart.scrollIntoViewIfNeeded();
    await p.screenshot({ path: CIKTI + 'yoklama-yuz-390.png' });
    const ilk = await kart.getAttribute('class');
    await kart.locator('.yy-yuz').click(); await p.waitForTimeout(150);
    dogrula(/geldi/.test(await p.locator('.yy-kutu', { hasText: s.b[2] }).first().getAttribute('class')), 'dokununca geldi olmalı');
    await p.locator('.yy-kutu', { hasText: s.b[2] }).first().locator('.yy-yuz').click(); await p.waitForTimeout(150);
    await p.locator('.yy-kutu', { hasText: s.b[2] }).first().locator('.yy-yuz').click(); await p.waitForTimeout(150);
    esit(await p.locator('.yy-kutu', { hasText: s.b[2] }).first().getAttribute('class'), ilk, '3 dokunuşta başa dönmeli');
    // ‹ › gün gezme
    await p.locator('.yy-tarih .yy-ok').first().click();
    esit(await p.evaluate(() => _yonElTarih), '2025-01-05', '‹ bir gün geri');
    // liste görünümü hâlâ var
    await p.evaluate(() => yoklamaYuzSec(false)); dogrula(await p.locator('.yy .adm-list').count() > 0, 'liste görünümü açılmadı');
    await p.evaluate(() => yoklamaYuzSec(true));

    // 2) Rapor › Günlük (Çarşamba): büyüklerde ✓ 1, ✗ işaretli + işaretsizler; küçüklerin yoklaması yok
    await p.evaluate((CAR) => { _yokRapor.mod = 'gun'; _yokRapor.gun = CAR; yoneticiYoklamaTip = 'rapor'; yoneticiYoklamaCiz(); }, CAR);
    await p.waitForSelector('.yr-grup');
    const gunKart = p.locator('.yr-grup', { hasText: 'Büyükler' });
    dogrula(await gunKart.locator('.yr-sut.g').textContent().then((t) => t.includes(s.b[0])), 'gelenlerde ilk sporcu yok');
    const gm = await gunKart.locator('.yr-sut.y').textContent();
    dogrula(gm.includes(s.b[1]) && /✗ gelmedi/.test(gm) && gm.includes(s.b[2]) && /işaretsiz/.test(gm), 'gelmeyenler yanlış: ' + gm.slice(0, 200));
    // (senkron arka planda sporcu listesini değiştirebilir — beklenen sayı o anki ekrandan)
    await p.evaluate(() => yoklamaRaporEkranCiz());
    esit(await gunKart.locator('.yr-sut.y .yr-k').count(), await p.evaluate(() => _yokAktifUyeler('buyukler').length - 1), 'büyüklerde gelmeyen = aktif - 1');
    dogrula(/yoklaması olmayan:.*Küçükler/.test(await p.locator('.yy').textContent()), 'küçükler "yoklaması olmayan" yazmalı');
    dogrula(await yataydaTasmaYok(p), 'günlük rapor 390 px yana taşıyor');
    await p.screenshot({ path: CIKTI + 'yoklama-rapor-gun-390.png', fullPage: true });
    const [dl1] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.evaluate(() => yoklamaGunPdf())]);
    esit(dl1.suggestedFilename(), 'Yoklama_Gunluk_20250108.pdf', 'günlük PDF adı');
    await dl1.saveAs(CIKTI + 'Yoklama_Gunluk.pdf');

    // 3) Rapor › Haftalık: büyüklerde 2 ders günü sütunu, 2/2 · 1/2 (✗) · 0/2 kırmızı; küçüklerde 1 sütun
    await p.evaluate(() => yoklamaRaporMod('hafta'));
    await p.waitForSelector('.yr-tablo');
    const tb = p.locator('.yr-grup', { hasText: 'Büyükler' });
    esit(await tb.locator('thead th.ders').count(), 2, 'büyükler ders günü sütunu');
    const satir = (ad) => tb.locator('tbody tr', { hasText: ad }).first();
    esit((await satir(s.b[0]).locator('td.top').textContent()).trim(), '2/2', 'ilk sporcu 2/2');
    esit((await satir(s.b[1]).locator('td.top').textContent()).trim(), '1/2', 'ikinci sporcu 1/2');
    esit(await satir(s.b[1]).locator('.yr-h.x').count(), 1, 'ikinci sporcuda ✗');
    dogrula(/dusuk/.test(await satir(s.b[2]).locator('td.top').getAttribute('class')), 'hiç gelmeyen kırmızı olmalı');
    esit(await p.locator('.yr-grup', { hasText: 'Küçükler' }).locator('thead th.ders').count(), 1, 'küçükler 1 ders günü');
    dogrula(await yataydaTasmaYok(p), 'haftalık rapor 390 px yana taşıyor');
    await p.screenshot({ path: CIKTI + 'yoklama-rapor-hafta-390.png', fullPage: true });
    const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.evaluate(() => yoklamaHaftaPdf())]);
    esit(dl2.suggestedFilename(), 'Yoklama_Haftalik_20250106.pdf', 'haftalık PDF adı');
    await dl2.saveAs(CIKTI + 'Yoklama_Haftalik.pdf');

    // 3b) v460 aylık liste: geldiği gün tik, ödeme günü turuncu (ödeme tarihi o aydaysa; başka ay / ödenmemiş sayılmaz), yazıda "ödeme" geçmez
    const ay = await p.evaluate(({ PZT, CAR, s }) => { const v = _yokAyVeri('2025-01', { [s.b[0]]: { '2024-12': { odendi: true, odemeTarihi: '2025-01-03' }, '2025-01': { odendi: true, odemeTarihi: '2025-02-01' }, '2025-02': { odendi: false, odemeTarihi: '2025-01-20' } } }); const gr = v.gruplar.find((x) => x.g === 'buyukler'), r = (ad) => gr.satir.find((x) => x.ad === ad); return { gun: v.gunler.length, g0: Object.keys(r(s.b[0]).gel).sort().join(), o0: Object.keys(r(s.b[0]).ode).join(), g1: Object.keys(r(s.b[1]).gel).join() }; }, { PZT, CAR, s });
    esit(ay.gun, 31, 'ayın tüm günleri'); dogrula(ay.g0.includes(PZT) && ay.g0.includes(CAR), 'geldiği günler: ' + ay.g0); dogrula(!ay.g1.includes(CAR), 'gelmedi işaretli gün sayılmaz'); esit(ay.o0, '2025-01-03', 'ödeme günü');
    // v461: bant Yoklama'nın her sekmesinde + menüde + Genel Bakış'ta; pencere bütün gruplarla açılır, ileri günler boş
    for (const t of ['ozet', 'gunluk', 'rapor', 'aylik', 'devamsizlik']) { await p.evaluate((t) => { yoneticiYoklamaTip = t; yoneticiYoklamaCiz(); }, t); esit(await p.locator('#yonetici-liste .yok-ck-bant').count(), 1, t + ' sekmesinde çıktı bandı'); const k = await p.locator('#yonetici-liste .yok-ck-bant').boundingBox(); dogrula(k.width > 300, 'bant dar: ' + k.width); if (t === 'gunluk') await p.screenshot({ path: CIKTI + 'yoklama-cikti-bant.png' }); }
    await p.evaluate(() => yoneticiSekme('panel')); await p.waitForSelector('#yn-genel .yok-ck-bant'); await p.screenshot({ path: CIKTI + 'yoklama-cikti-genel.png' });
    await p.evaluate(() => yoneticiDigerSheetAcKapat()); await p.waitForTimeout(400); await p.screenshot({ path: CIKTI + 'yoklama-cikti-menu.png' }); await p.locator('#ym-liste .yok-ck-bant').click();
    await p.waitForFunction(() => { const b = document.getElementById('yck-yaz'); return b && !b.disabled; }, null, { timeout: 60000 });
    const pen = await p.evaluate(() => ({ yazi: document.getElementById('yok-cikti').textContent, grup: _yokAyGrup, ileri: (() => { const d = new Date(); d.setDate(d.getDate() + 1); const i = bugunISO(d); otomatikYoklamaDB[i] = { [_yokAktifUyeler('buyukler')[0]]: { saat: '10:00', grup: 'buyukler', geldi: true } }; const v = _yokAyVeri(i.slice(0, 7), { [_yokAktifUyeler('buyukler')[1]]: { [i.slice(0, 7)]: { odendi: true, odemeTarihi: i } } }); delete otomatikYoklamaDB[i]; return v.gruplar.some((g) => g.satir.some((r) => r.gel[i] || r.ode[i])); })() }));
    dogrula(!/ödeme|aidat/i.test(pen.yazi), 'pencerede ödeme yazmamalı'); esit(pen.grup, '__hepsi', 'bütün gruplar'); dogrula(!pen.ileri, 'ileri günler boş olmalı'); dogrula(/sayfa/.test(pen.yazi), 'sayfa sayısı');
    dogrula(await p.evaluate(() => { const b = document.getElementById('yck-in').getBoundingClientRect(), e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return e && e.id === 'yck-in' && b.bottom <= innerHeight; }), 'indir düğmesi örtülü');
    await p.setViewportSize({ width: 390, height: 663 }); await p.waitForTimeout(200); await p.screenshot({ path: CIKTI + 'yoklama-cikti-pencere.png' }); await p.setViewportSize({ width: 390, height: 844 });
    await p.locator('.yck-grup button', { hasText: 'Küçükler' }).click(); await p.waitForFunction(() => !document.getElementById('yck-yaz').disabled, null, { timeout: 60000 }); esit(await p.evaluate(() => _yokAyGrup), 'kucukler', 'grup seçimi');
    await p.evaluate(() => { _yokAyGrup = '__hepsi'; _yokAyYM = '2025-01'; _yokCiktiYenile(); }); await p.waitForFunction(() => !document.getElementById('yck-in').disabled, null, { timeout: 60000 });
    const [dl3] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.locator('#yck-in').click()]);
    esit(dl3.suggestedFilename(), 'Yoklama_Listesi_2025-01.pdf', 'aylık PDF adı'); await dl3.saveAs(CIKTI + 'Yoklama_Listesi.pdf');
    dogrula(await yataydaTasmaYok(p), 'çıktı penceresi 390 px taşıyor');
    await p.locator('#yok-cikti .ym-kapat').click(); esit(await p.locator('#yok-cikti').count(), 0, 'pencere kapanmalı');
    await p.evaluate(() => { yoneticiSekme('yoklama'); yoneticiYoklamaTip = 'rapor'; _yokRapor.mod = 'hafta'; yoneticiYoklamaCiz(); });

    // 4) masaüstü görünüm
    await p.setViewportSize({ width: 1280, height: 900 }); await p.waitForTimeout(200);
    await p.screenshot({ path: CIKTI + 'yoklama-rapor-hafta-1280.png', fullPage: true });
    await p.evaluate((PZT) => { _yonElTarih = PZT; yoneticiYoklamaTip = 'gunluk'; yoneticiYoklamaCiz(); }, PZT);
    await p.screenshot({ path: CIKTI + 'yoklama-yuz-1280.png' });
    dogrula(!hatalar.length, 'sayfa hatası: ' + hatalar.join(' | '));
    log('yüz kartları + günlük/haftalık rapor + 2 PDF tamam');
  } finally {
    await p.evaluate(({ PZT, CAR }) => { delete otomatikYoklamaDB[PZT]; delete otomatikYoklamaDB[CAR]; delete otomatikYoklamaDB['2025-01-05']; try { otomatikYoklamaKaydet(); } catch (e) {} }, { PZT, CAR }).catch(() => {});
    await ctx.close();
  }
}
