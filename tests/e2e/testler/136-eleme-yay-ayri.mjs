// ⚔️ Doğrudan eleme: klasik ve makaralı ayrı eşleşme (2026-11-18, v429). Kullanıcı dersten: "Yiğit Eymen ile Nisanur yarışması lazım,
// iki klasik yay; makaralılar makaralılarla; finalde kendi içlerinde final; makaralı–klasik genel finali isteğe bağlı".
// Kurulumda varsayılan açık: ilk tur hiç karışık maç yok, her grup kendi tohumuyla (1–son), yarının son maçı "Klasik/Makaralı Finali",
// genel final kapalıyken iki şampiyon; açılınca Genel Final. Mevcut karışık elemeye "Yay türüne göre ayır" düğmesi.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 900 });
  const O = 'tests/e2e/_cikti/136-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => localStorage.getItem(yzAnahtar()));
    // 7 sporcu: 5 klasik, 2 makaralı (yalnız bellekte, kaydedilmez)
    const sp = await p.evaluate(() => {
      const l = Object.keys(turnuvaDB.buyukler || {}).filter((ad) => !turnuvaDB.buyukler[ad].pasif).slice(0, 7);
      window.__yayYedek = l.map((ad) => turnuvaDB.buyukler[ad].yay);
      l.forEach((ad, i) => { turnuvaDB.buyukler[ad].yay = i === 2 || i === 5 ? 'Makaralı' : 'Klasik'; });
      _kmListe = l.map((ad) => ({ g: 'buyukler', ad }));
      localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
      return l.map((ad) => 'buyukler|' + ad);
    });
    esit(sp.length, 7, '7 sporcu');
    await p.evaluate(() => { yzKurAyar('tur', 'eleme'); });
    await p.evaluate((sp) => { yzKurAyar('kayit', false); const t = yzKurulumTaslak(); t.katilimci = sp.slice(); yzCiz(); }, sp);
    dogrula(await p.locator('.yz-eleme-ayar label:has-text("ayrı eşleşsin") input').isChecked(), 'ayrı eşleşme varsayılan açık');
    await p.screenshot({ path: O + 'kurulum.png', fullPage: false });
    await p.locator('button', { hasText: 'Elemeyi başlat' }).click();
    let r = await p.evaluate(() => { const o = yzOku(), el = yzElemeHesapla(o); return { ayri: el.ayri, genel: el.genel, n: el.n, ilk: el.maclar.filter((m) => m.tur === 0 && m.a && m.b).map((m) => [yzMakaraliMi(m.a), yzMakaraliMi(m.b)]), adlar: el.maclar.map((m) => m.turAd), turlar: el.turlar, seed: el.seedOf, toh: o.eleme.tohumlar }; });
    esit(r.ayri, true, 'ayrı'); esit(r.genel, false, 'genel final varsayılan kapalı'); esit(r.n, 16, '5 klasik → 8\'li yarı, 16\'lık tablo');
    dogrula(r.ilk.length > 0 && r.ilk.every(([a, b]) => a === b), 'ilk turda karışık maç yok: ' + JSON.stringify(r.ilk));
    dogrula(r.adlar.includes('Klasik Finali') && r.adlar.includes('Makaralı Finali') && !r.adlar.includes('Genel Final'), 'grup finalleri: ' + r.adlar.join(','));
    // klasik tohumları 1..5, makaralı 1..2
    const kl = r.toh.filter((k) => !r.seed || true);
    dogrula(Object.values(r.seed).filter((x) => x === 1).length === 2, 'her grubun kendi 1. tohumu');
    await p.screenshot({ path: O + 'tablo.png' });
    // v431 📺 TV: klasik ve makaralı aynı anda — iki yay da canlıda, tablo yay başına ayrı
    await p.evaluate(() => { _yz.siradaki = false; const el = yzElemeHesapla(yzOku()); ['Klasik', 'Makaralı'].forEach((g) => { const m = el.maclar.find((x) => x.oynanabilir && x.grup === g); yzMacSetGir(m.id, 'a', 0); ['9', '8', '7'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); }); yzTvAc(); });
    await p.waitForTimeout(1500);
    const tv = await p.evaluate(() => ({ canli: [...document.querySelectorAll('.yz-tv-canli .yz-tv-mac-tur')].map((x) => x.textContent), gruplar: document.querySelectorAll('.yz-tv-br .yz-br-grup').length, bas: (document.querySelector('.yz-tv-seri b') || {}).textContent, tas: document.documentElement.scrollWidth > innerWidth + 1 }));
    dogrula(tv.canli.some((t) => /Klasik/.test(t)) && tv.canli.some((t) => /Makaralı/.test(t)), 'TV canlıda iki yay: ' + tv.canli.join(' | '));
    esit(tv.gruplar, 2, 'TV tablosu yay başına ayrı'); dogrula(/KLASİK \+/.test(tv.bas || ''), 'TV başlığı: ' + tv.bas); esit(tv.tas, false, 'TV yana taşma');
    await p.screenshot({ path: O + 'tv.png' });
    await p.evaluate(() => { yzTvKapat(); const o = yzOku(); yzGuncelle((x) => { Object.keys(x).forEach((a) => { if (a.indexOf('m_') === 0) delete x[a]; }); }); yzCiz(); });
    // v430 🛠 yönet: tura çıksın (onaylı) → geri al → son girişi sil
    const mid = await p.evaluate(() => { const m = yzElemeHesapla(yzOku()).maclar.find((x) => x.oynanabilir); yzMacSec(m.id); return m.id; });
    await p.locator('.yz-mac-yonet button', { hasText: 'tura çıksın' }).last().click();
    await p.evaluate(() => onayOnayla());
    let y = await p.evaluate((id) => { const m = yzElemeHesapla(yzOku()).maclar.find((x) => x.id === id); return { kaz: m.kazanan, elle: m.elle }; }, mid);
    esit(y.kaz + y.elle, 'btrue', 'koç kararı: b tura çıktı');
    dogrula(/koç kararı/.test(await p.locator('.yz-mac-sonuc').innerText()), 'sonuç yazısı');
    await p.screenshot({ path: O + 'yonet.png' });
    await p.locator('.yz-mac-yonet button', { hasText: 'geri al' }).click();
    y = await p.evaluate((id) => { _yz.siradaki = false; yzMacSetGir(id, 'a', 0); ['9', '9', '9'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzMacSetGir(id, 'b', 0); ['8', '8', '8'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzMacSec(id); const m = yzElemeHesapla(yzOku()).maclar.find((x) => x.id === id); return { kaz: m.kazanan, pa: m.puanA }; }, mid);
    esit(y.kaz + '/' + y.pa, 'null/2', 'geri alındı, 1. set a\'nın');
    await p.locator('.yz-mac-yonet button', { hasText: 'Son girişi sil' }).click();
    y = await p.evaluate((id) => { const m = yzElemeHesapla(yzOku()).maclar.find((x) => x.id === id); return { a: !!(m.setler[0] && m.setler[0].a), b: !!(m.setler[0] && m.setler[0].b), pa: m.puanA }; }, mid);
    esit(JSON.stringify(y), JSON.stringify({ a: true, b: false, pa: 0 }), 'son giriş (b) silindi');
    await p.evaluate((id) => { const o = yzOku(); yzGuncelle((x) => { delete x[yzMacKey(o.durum.id, id)]; }); yzCiz(); }, mid);
    // v432 👥 kenar yarışması: 3 sporcu seç, 2 seri, giriş + sıralama + TV
    await p.locator('button', { hasText: '👥 Kenar yarışması' }).click();
    await p.evaluate((sp) => { _yz.kenarSec = {}; sp.slice(4, 7).forEach((k) => { _yz.kenarSec[k] = 1; }); _yz.kenarSeri = 2; onayOnayla(); }, sp);
    await p.waitForSelector('.yz-kenar');
    const kn = await p.evaluate((sp) => {
      _yz.siradaki = true; const k3 = sp.slice(4, 7), oklar = [['10', '9', '9'], ['X', '10', '10'], ['7', '6', '5']];
      for (let s = 0; s < 2; s++) { yzKenarGir(encodeURIComponent(k3[0]), s); for (let i = 0; i < 3; i++) { oklar[i].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); } }
      _yz.siradaki = false; const r = yzKenarSira(yzOku().kenar); return { sira: r.map((x) => x.k === k3[1] ? 'B' : x.k === k3[0] ? 'A' : 'C').join(''), top: r.map((x) => x.top), giris: !!_yz.giris };
    }, sp);
    esit(kn.sira + ' ' + kn.top.join('/'), 'BAC 60/56/36', 'kenar sıralaması (sıradakine geçerek giriş)');
    await p.screenshot({ path: O + 'kenar.png' });
    await p.locator('.yz-kenar button', { hasText: 'Bitir' }).click();
    dogrula(/🥇/.test(await p.locator('.yz-kenar').innerText()), 'bitince madalya');
    await p.evaluate(() => yzTvAc()); await p.waitForTimeout(1200);
    dogrula(/Kenar yarışması/.test(await p.locator('.yz-tv-kenar').textContent()), 'TV\'de kenar kartı');
    await p.screenshot({ path: O + 'kenar-tv.png' });
    await p.evaluate(() => { yzTvKapat(); yzGuncelle((x) => { delete x.kenar; }); yzCiz(); });
    // tüm maçları "a" kazansın → iki şampiyon
    const oyna = () => p.evaluate(() => {
      _yz.siradaki = false;
      for (let g = 0; g < 20; g++) {
        const m = yzElemeHesapla(yzOku()).maclar.find((x) => x.oynanabilir); if (!m) break;
        for (let i = 0; i < 3; i++) { yzMacSetGir(m.id, 'a', i); ['10', '10', '10'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzMacSetGir(m.id, 'b', i); ['5', '5', '5'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); }
      }
      const el = yzElemeHesapla(yzOku()); return { bitti: el.bitti, yer: el.yerler.map((y) => y.yer + ':' + y.metin + ':' + (yzMakaraliMi(y.k) ? 'M' : 'K')) };
    });
    r = await oyna();
    dogrula(r.bitti, 'genel finalsiz eleme bitti');
    dogrula(r.yer.includes('1:🏹 Klasik şampiyonu:K') && r.yer.includes('1:⚙️ Makaralı şampiyonu:M'), 'iki şampiyon: ' + r.yer.join(' | '));
    // genel final aç → final maçı oynanabilir
    await p.evaluate(() => { const m = document.getElementById('onay-modal'); if (m) m.style.display = 'none'; yzElemeyeDon(); });
    await p.locator('button', { hasText: /Genel final kapalı/ }).first().click();
    r = await p.evaluate(() => { const el = yzElemeHesapla(yzOku()), f = el.maclar.find((m) => m.turAd === 'Genel Final'); return { var: !!f, oyn: f && f.oynanabilir, karisik: f && yzMakaraliMi(f.a) !== yzMakaraliMi(f.b), bitti: el.bitti }; });
    dogrula(r.var && r.oyn && r.karisik && !r.bitti, 'genel final: ' + JSON.stringify(r));
    r = await oyna();
    dogrula(r.bitti && r.yer[0].startsWith('1:Genel şampiyon') && r.yer.some((y) => y.startsWith('3:')), 'genel final sonucu: ' + r.yer.join(' | '));
    await p.screenshot({ path: O + 'genel-final.png' });
    // mevcut karışık eleme → "Yay türüne göre ayır"
    await p.evaluate(() => { yzElemeYayAyir(false); });
    await p.evaluate(() => { const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') onayOnayla(); });
    esit(await p.evaluate(() => !!yzElemeHesapla(yzOku()).ayri), false, 'karışığa döndü');
    await p.locator('button', { hasText: 'Yay türüne göre ayır' }).click();
    esit(await p.evaluate(() => !!yzElemeHesapla(yzOku()).ayri), true, 'düğmeyle ayrıldı');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px taşma');
    await p.screenshot({ path: O + 'telefon.png' });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('ayrı eşleşme varsayılan · ilk turda karışık maç yok · Klasik/Makaralı Finali · iki şampiyon · genel final isteğe bağlı · Yay türüne göre ayır düğmesi · 390 px');
  } finally {
    try { await p.evaluate((y) => { const l = (_kmListe || []); (window.__yayYedek || []).forEach((v, i) => { const s = l[i] && turnuvaDB.buyukler[l[i].ad]; if (s) { if (v === undefined) delete s.yay; else s.yay = v; } }); if (y) localStorage.setItem(yzAnahtar(), y); else localStorage.removeItem(yzAnahtar()); }, yedek); } catch (e) {}
    await ctx.close();
  }
}
