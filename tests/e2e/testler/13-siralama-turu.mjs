// Yarışma › Sıralama Turu: set sayısı (6/10/12/16/20) ve seri başına ok (3/6) ayrı seçilir; 16 set × 6 ok turu
// kurulur, tablo 16 seri + 2 yarı sütunu çizer, skor girilir, TV ekranı taşmaz, PDF iner. Hazır formatla aynı seçim
// eski anahtarı (tam) kullanır. Skorlar gerçek kayda İŞLENMEZ (kayit=false); önceki tur durumu geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe) }));
    await p.evaluate(() => {
      if (yzRoster().length < 3) { _kmListe = Object.keys(turnuvaDB.buyukler || {}).slice(0, 4).map((ad) => ({ g: 'buyukler', ad })); }
      localStorage.removeItem(yzAnahtar());
      _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
    });
    // anahtar eşleme
    esit(await p.evaluate(() => yzFormatAnahtar(12, 6)), 'tam', '12×6 hazır formata eşlenmeli');
    esit(await p.evaluate(() => yzFormatAnahtar(16, 6)), 's16o6', '16×6 anahtarı');
    esit(await p.evaluate(() => JSON.stringify(yzFormatBul('s16o6'))), JSON.stringify({ ad: '96 ok · 16 seri × 6', kisa: '96 ok · 16 seri', seri: 16, ok: 6, yari: 8 }), '16×6 format');
    // kurulum: gerçek tıklamayla 16 set
    await p.locator('.yz-cip', { hasText: /^16 set$/ }).click();
    dogrula(await p.locator('.yz-cip.aktif', { hasText: /^16 set$/ }).count(), '16 set seçili görünmüyor');
    dogrula((await p.locator('.yz-kur-izgara').textContent()).includes('96 ok'), 'toplam ok yazmıyor');
    await p.locator('.yz-cip', { hasText: /^3 ok$/ }).click();
    dogrula((await p.locator('.yz-kur-izgara').textContent()).includes('48 ok'), '16×3 = 48 ok yazmıyor');
    await p.locator('.yz-cip', { hasText: /^6 ok$/ }).click();
    await p.evaluate(() => { yzKurAyar('kayit', false); let t = yzKurulumTaslak(); t.katilimci = yzRoster().slice(0, 3).map((k) => k.g + '|' + k.ad); yzCiz(); });
    await p.locator('button', { hasText: 'Turu başlat' }).click();
    await p.waitForTimeout(400);
    const d = await p.evaluate(() => yzOku().durum);
    esit(d.ayar.format, 's16o6', 'tur formatı');
    dogrula((await p.locator('.yz-seri-no').textContent()).includes('/16'), 'seri sayacı /16 değil');
    esit(await p.locator('.yz-tablo thead th.s').count(), 16, 'tabloda 16 seri sütunu olmalı');
    esit(await p.locator('.yz-tablo thead th.yari').count(), 2, 'yarı sütunları');
    // 1. seriyi herkese gir
    await p.evaluate(() => {
      let o = yzOku(); o.durum.katilimci.forEach((k) => { yzGirisAc(yzEnc(k), 0); ['X', '10', '9', '9', '8', '7'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); });
    });
    await p.waitForTimeout(300);
    const toplam = await p.evaluate(() => yzSiralama(yzOku()).map((r) => r.toplam));
    dogrula(toplam.length === 3 && toplam.every((t) => t === 53), 'seri toplamları yanlış: ' + toplam);
    // tur sürerken sporcu ekle / çıkar (ders listesinde olmayan biri de eklenebilmeli)
    await p.locator('.yz-btn', { hasText: '👥 Sporcular' }).click();
    await p.waitForSelector('#yz-secici');
    const disaridan = await p.evaluate(() => { let kat = yzOku().durum.katilimci; return yzTumSporcular().find((x) => kat.indexOf(x.k) === -1 && !yzRoster().some((r) => r.g + '|' + r.ad === x.k)); });
    dogrula(disaridan, 'listede olmayan aday sporcu bulunamadı');
    await p.locator('#yz-sec-ara').fill(disaridan.ad.slice(0, 5));
    await p.locator('.yz-sec-aday', { hasText: disaridan.ad }).first().click();
    dogrula(await p.evaluate((k) => yzOku().durum.katilimci.includes(k), disaridan.k), 'sporcu tura eklenmedi');
    const cikan = await p.evaluate(() => yzOku().durum.katilimci[0]);
    await p.locator('.yz-sec-sat', { hasText: cikan.split('|')[1] }).locator('button', { hasText: 'Çıkar' }).click();
    await p.waitForTimeout(200);
    await p.locator('#onay-evet-btn').click();
    await p.waitForTimeout(300);
    dogrula(!(await p.evaluate((k) => yzOku().durum.katilimci.includes(k), cikan)), 'sporcu turdan çıkarılmadı');
    dogrula(await p.evaluate((k) => !!yzOku()['s_' + yzOku().durum.id + '_' + k], cikan), 'çıkarılanın serileri silinmemeli');
    await p.locator('#yz-secici .yz-btn', { hasText: 'Kapat' }).click();
    esit(await p.evaluate(() => yzSiralama(yzOku()).length), 3, 'sıralama ekle/çıkar sonrası 3 kişi olmalı');
    // ikinci seri → yarış grafiği görünür
    await p.evaluate(() => { yzGuncelle((o) => { o.durum.seri = 1; }); yzOku().durum.katilimci.forEach((k) => { yzGirisAc(yzEnc(k), 1); ['10', '9', '9', '8', '8', '7'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); }); yzCiz(); });
    dogrula(await p.locator('.yz-grafik-kart .yz-gr-cizgi').count() >= 3, 'yarış grafiği çizilmedi');
    if (process.env.E2E_EKRAN) await p.locator('.yz-grafik-kart').screenshot({ path: process.env.E2E_EKRAN + '-grafik.png' });
    // TV: 16 sütun ekrana sığmalı
    await p.evaluate(() => yzTvAc()); await p.waitForTimeout(800);
    const tv = await p.evaluate(() => { let e = document.querySelector('#yz-tv .yz-tv-tablo'); return e ? { sw: e.scrollWidth, cw: e.clientWidth } : null; });
    dogrula(tv && tv.sw <= tv.cw + 2, 'TV ekranı yatay taşıyor: ' + JSON.stringify(tv));
    dogrula((await p.locator('#yz-tv').textContent()).includes('/ 16'), 'TV seri sayısı /16 değil');
    await p.evaluate(() => { try { yzTvKapat(); } catch (e) { let t = document.getElementById('yz-tv'); if (t) t.remove(); _yz.tv = false; } });
    // PDF
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.evaluate(() => yzPdf())]);
    dogrula((await dl.path()) && /\.pdf$/i.test(dl.suggestedFilename()), 'PDF inmedi');
    log('16 set × 6 ok: kurulum, tablo, skor, TV, PDF ✓');

    // 9-12 yaş kategorisi + madalya töreni
    await p.evaluate(() => { localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzCiz(); });
    await p.locator('.yz-cip', { hasText: /^9-12 yaş$/ }).click();
    const t = await p.evaluate(() => { let x = yzKurulumTaslak(); return [x.kategori, x.mesafe, x.yuz, x.format, x.sure].join(','); });
    esit(t, 'k912,20m,10,s12o3,120', '9-12 yaş ön ayarı');
    dogrula(await p.locator('.yz-btn', { hasText: 'yaşındakileri seç' }).count(), 'yaşa göre seç düğmesi yok');
    await p.evaluate(() => {
      yzKurAyar('kayit', false); let x = yzKurulumTaslak(); x.katilimci = yzRoster().slice(0, 4).map((k) => k.g + '|' + k.ad); yzBaslat();
      let degerler = [['10', '9', '9'], ['9', '8', '8'], ['8', '7', '7'], ['7', '6', '6']];
      for (let s = 0; s < 12; s++) { if (s) yzGuncelle((o) => { o.durum.seri = s; }); yzOku().durum.katilimci.forEach((k, i) => { yzGirisAc(yzEnc(k), s); degerler[i].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); }); }
      yzBitir(true);
    });
    dogrula((await p.locator('.yz-ust-etiket').first().textContent()).includes('9-12 YAŞ'), 'sonuç başlığında kategori yok');
    dogrula(await p.locator('.yz-btn.toren').count(), 'madalya töreni düğmesi yok');
    await p.evaluate(() => { yzTvAc(); yzTorenBaslat(true); });
    await p.waitForSelector('#yz-toren', { timeout: 5000 });
    for (const n of [3, 2, 1]) {
      await p.evaluate(() => yzTorenIleri()); await p.waitForTimeout(500);
      dogrula(await p.locator(`#yz-toren .yz-tor-k.p${n}.acik`).count(), `${n}. açılmadı`);
    }
    esit((await p.locator('#yz-toren .yz-tor-k.p1 .yz-tor-ad').textContent()).trim(), await p.evaluate(() => yzSiralama(yzOku())[0].ad), 'birinci yanlış');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-kursu.png' });
    await p.evaluate(() => yzTorenIleri()); await p.waitForTimeout(500);
    dogrula(await p.locator('#yz-toren.final').count(), 'final ekranı gelmedi');
    esit(await p.locator('#yz-toren .yz-tor-cip').count(), 4, 'tüm katılımcılar finalde olmalı');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-final.png' });
    await p.locator('#yz-toren button', { hasText: 'Töreni kapat' }).click();
    dogrula(!(await p.locator('#yz-toren').count()) && !(await p.evaluate(() => yzOku().toren)), 'tören kapanmadı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('9-12 yaş kategori + madalya töreni (🥉→🥈→🥇→final) ✓');
  } finally {
    if (yedek) await p.evaluate((y) => { if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); _kmListe = JSON.parse(y.liste); }, yedek).catch(() => {});
    await ctx.close();
  }
}
