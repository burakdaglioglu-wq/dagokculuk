// Yarışma › ⚔️ Doğrudan eleme (2026-10-28, kullanıcı: "illa sıralama olmasın; ilk 4/8/16 eşleştirmeli elemeli yarışma,
// dünya standartlarında, ayarlayabileyim"). Kurulumda tür seçimi (gerçek tıklama), tablo boyutu + bay sayısı, tohum sırası
// (ortalama / elle ▲▼ / kura), toplam puan sistemi (5 seri × 3 ok, eşitlikte shoot-off), bay en üst tohumlara, bronz maçı,
// eleme bitince doğrudan eleme sonuç ekranı + TV; sıralama sonrası eleme sistemi/bronz ayarı; set sistemi 6 puan.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()) }));
    const n = await p.evaluate(() => {
      if (yzRoster().length < 5) { _kmListe = Object.keys(turnuvaDB.buyukler || {}).slice(0, 6).map((ad) => ({ g: 'buyukler', ad })); }
      localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
      return yzRoster().length;
    });
    dogrula(n >= 5, 'testte en az 5 sporcu gerekli (gelen ' + n + ')');
    // tür seçimi: gerçek tıklama
    await p.locator('.yz-tur-sec-btn', { hasText: 'Doğrudan eleme' }).click();
    dogrula((await p.locator('.yz-baslik').first().textContent()).includes('Doğrudan Eleme'), 'doğrudan eleme kurulumu açılmadı');
    await p.evaluate(() => { yzKurAyar('kayit', false); let t = yzKurulumTaslak(); t.katilimci = yzRoster().slice(0, 5).map((k) => k.g + '|' + k.ad); yzCiz(); });
    await p.locator('.yz-cip', { hasText: 'Toplam puan' }).click();
    const alt = await p.locator('.yz-eleme-ayar').textContent();
    dogrula(/8'li tablo/.test(alt) && /3 bay/.test(alt), 'tablo boyutu / bay bilgisi yanlış: ' + alt.slice(0, 200));
    esit(await p.locator('.yz-tohum').count(), 5, 'tohum listesi');
    // İlk 4 → 4'lü tablo, bay yok, 1 sporcu dışarıda
    await p.locator('.yz-cip', { hasText: /^İlk 4$/ }).click();
    dogrula(/4'lü tablo|4'li tablo/.test(await p.locator('.yz-eleme-ayar').textContent()) || /4.li tablo/.test(await p.locator('.yz-eleme-ayar').textContent()), '4\'lü tablo yazmıyor');
    esit(await p.locator('.yz-tohum.disari').count(), 1, 'İlk 4\'te 1 sporcu dışarıda görünmeli');
    await p.locator('.yz-cip', { hasText: /^Tümü/ }).click();
    // elle sıra: ▲ ile 2. sporcu 1. olur
    await p.locator('.yz-cip', { hasText: 'Elle' }).click();
    const once = await p.evaluate(() => yzTohumSirasi(yzKurulumTaslak()));
    await p.evaluate(() => yzKurSiraTasi(1, -1));
    const sonra = await p.evaluate(() => yzTohumSirasi(yzKurulumTaslak()));
    esit(sonra[0], once[1], 'elle ▲ sırayı değiştirmedi');
    // başlat
    await p.locator('button', { hasText: 'Elemeyi başlat' }).click();
    let o = await p.evaluate(() => { const o = yzOku(), el = yzElemeHesapla(o); return { asama: o.durum.asama, dog: o.durum.ayar.dogrudan, toh: o.eleme.tohumlar, n: el.n, sistem: el.sistem, bay: el.maclar.filter((m) => m.bay).map((m) => m.kazananK), bronz: o.eleme.bronz }; });
    esit(o.asama, 'eleme', 'eleme aşaması'); esit(o.dog, true, 'doğrudan işareti'); esit(o.n, 8, '8\'li tablo'); esit(o.sistem, 'toplam', 'toplam sistemi');
    esit(o.toh[0], sonra[0], 'elle sıra tohuma yansımadı');
    esit(JSON.stringify(o.bay.sort()), JSON.stringify(o.toh.slice(0, 3).sort()), 'bay en üst 3 tohuma gitmeli');
    esit(o.bronz, true, 'bronz maçı');
    dogrula((await p.locator('.yz-ust-etiket').first().textContent()).includes('TOPLAM PUAN'), 'eleme başlığında sistem yok');
    // maç oynatma yardımcısı: 5 seri (a/b okları), gerekirse shoot-off
    const oyna = (macId, a, b, sh) => p.evaluate(([macId, a, b, sh]) => {
      _yz.siradaki = false;
      for (let i = 0; i < 5; i++) { yzMacSetGir(macId, 'a', i); a.forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzMacSetGir(macId, 'b', i); b.forEach((v) => yzOkEkle(v)); yzGirisKaydet(); }
      if (sh) { yzMacShootGir(macId, 'a'); yzOkEkle(sh[0]); yzGirisKaydet(); yzMacShootGir(macId, 'b'); yzOkEkle(sh[1]); yzGirisKaydet(); }
      const m = yzElemeHesapla(yzOku()).maclar.find((x) => x.id === macId); return { kaz: m.kazanan, pa: m.puanA, pb: m.puanB, sg: m.shootGerek };
    }, [macId, a, b, sh]);
    // 4–5 tohum maçı (tek gerçek ilk tur maçı): toplam 135–120 → a
    const ilk = await p.evaluate(() => yzElemeHesapla(yzOku()).maclar.find((m) => m.oynanabilir).id);
    let r = await oyna(ilk, ['10', '9', '8'], ['9', '8', '7']);
    esit(`${r.kaz} ${r.pa}-${r.pb}`, 'a 135-120', 'toplam puan maçı');
    // yarı final: eşit toplam → shoot-off (X > 10)
    const yf = await p.evaluate(() => yzElemeHesapla(yzOku()).maclar.find((m) => m.oynanabilir).id);
    r = await p.evaluate(([macId]) => { _yz.siradaki = false; for (let i = 0; i < 5; i++) { yzMacSetGir(macId, 'a', i); ['9', '9', '9'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzMacSetGir(macId, 'b', i); ['10', '9', '8'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); } yzMacSec(macId); const m = yzElemeHesapla(yzOku()).maclar.find((x) => x.id === macId); return { kaz: m.kazanan, sg: m.shootGerek }; }, [yf]);
    esit(`${r.kaz} ${r.sg}`, 'null true', 'eşit toplamda shoot-off gerekmeli');
    dogrula((await p.locator('.yz-mac .yz-bilgi').first().textContent()).includes('Toplamlar eşit'), 'shoot-off açıklaması yok');
    r = await oyna(yf, [], [], ['10', 'X']);
    esit(r.kaz, 'b', 'shoot-off X kazanmalı');
    // kalan maçlar (yarı final 2, bronz, final): a kazansın
    for (let k = 0; k < 4; k++) {
      const id = await p.evaluate(() => { const m = yzElemeHesapla(yzOku()).maclar.find((x) => x.oynanabilir); return m ? m.id : null; });
      if (!id) break; await oyna(id, ['10', '10', '9'], ['8', '8', '8']);
    }
    o = await p.evaluate(() => { const el = yzElemeHesapla(yzOku()); return { bitti: el.bitti, yer: el.yerler.map((y) => y.yer).join(',') }; });
    esit(`${o.bitti} ${o.yer}`, 'true 1,2,3,4', 'eleme bitmeli: 1-2-3-4');
    await p.locator('button', { hasText: 'Sonuçlara geç' }).click();
    const sonuc = await p.locator('.yz').first().textContent();
    dogrula(sonuc.includes('DOĞRUDAN ELEME') && sonuc.includes('Tüm sonuçlar'), 'doğrudan eleme sonuç ekranı yok');
    esit(await p.locator('.yz-dg-sonuc').count(), 5, 'herkes sonuç listesinde');
    // TV bitince eleme tablosu + podyum
    await p.evaluate(() => yzTvAc()); await p.waitForTimeout(400);
    dogrula(await p.locator('#yz-tv .yz-tv-br').count(), 'TV eleme tablosu yok');
    await p.evaluate(() => yzTvKapat());
    // sıralama sonrası eleme: sistem + bronz ayarı (set sistemi, bronz kapalı)
    await p.evaluate(() => { localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzCiz(); yzKurAyar('tur', 'siralama'); yzKurAyar('kayit', false); let t = yzKurulumTaslak(); t.katilimci = yzRoster().slice(0, 4).map((k) => k.g + '|' + k.ad); yzBaslat(); yzBitir(true); });
    await p.locator('.yz-cip', { hasText: 'Bronz maçı açık' }).click();
    await p.locator('.yz-cip', { hasText: /^İlk 4$/ }).click();
    o = await p.evaluate(() => { const x = yzOku(), el = yzElemeHesapla(x); return { sistem: el.sistem, bronz: x.eleme.bronz, br: el.maclar.some((m) => m.id === 'bronz') }; });
    esit(`${o.sistem} ${o.bronz} ${o.br}`, 'set false false', 'sıralama sonrası eleme ayarları');
    // set sistemi: 3 set 30–27 → 6–0
    const sm = await p.evaluate(() => yzElemeHesapla(yzOku()).maclar.find((m) => m.oynanabilir).id);
    r = await p.evaluate(([macId]) => { _yz.siradaki = false; for (let i = 0; i < 3; i++) { yzMacSetGir(macId, 'a', i); ['10', '10', '10'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzMacSetGir(macId, 'b', i); ['9', '9', '9'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); } const m = yzElemeHesapla(yzOku()).maclar.find((x) => x.id === macId); return `${m.kazanan} ${m.puanA}-${m.puanB}`; }, [sm]);
    esit(r, 'a 6-0', 'set sistemi');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    await p.evaluate(() => { localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzCiz(); yzKurAyar('tur', 'eleme'); });
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px genişlikte yatay taşma');
    dogrula(!hatalar.filter((h) => !/Failed to fetch/.test(h)).length, 'sayfa hataları: ' + hatalar.join(' | '));
    log('tür seçimi · 8\'li tablo 3 bay · İlk 4 · elle ▲ · toplam puan + shoot-off · bronz · sonuç ekranı + TV · sıralama sonrası set/bronz ayarı');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzTvKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); }, yedek).catch(() => {});
    await ctx.close();
  }
}
