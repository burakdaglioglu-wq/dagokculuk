// ⚔️ Sıralama turu → "Bitir → eleme" + 🔁 Elenenler tablosu (2026-11-18, v433). Kullanıcı: "sıralama yarışmasını normal bitirebilirim
// ya da elemeli yarışa döndürebilirim; elenenler de yarışsın — winner'lar ve loser'lar kendi aralarında".
// 8 sporcu (6 klasik, 2 makaralı): sıralama puanları girilir → Bitir → eleme (Tümü, klasik/makaralı ayrı) → ilk tur maçları oynanır →
// elenenler tablosu kurulur (yalnız elenenler, ana tablodaki sıralarıyla) → maç girilir, TV'de görünür.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 900 });
  const O = 'tests/e2e/_cikti/137-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => localStorage.getItem(yzAnahtar()));
    const sp = await p.evaluate(() => {
      const l = Object.keys(turnuvaDB.buyukler || {}).filter((ad) => !turnuvaDB.buyukler[ad].pasif).slice(0, 8);
      window.__yayYedek = l.map((ad) => turnuvaDB.buyukler[ad].yay);
      l.forEach((ad, i) => { turnuvaDB.buyukler[ad].yay = i === 1 || i === 6 ? 'Makaralı' : 'Klasik'; });
      _kmListe = l.map((ad) => ({ g: 'buyukler', ad }));
      localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
      return l.map((ad) => 'buyukler|' + ad);
    });
    esit(sp.length, 8, '8 sporcu');
    // sıralama turu: puanlar doğrudan yazılır (sıra: sp[0] en iyi … sp[7] en kötü), son seriye gelinir
    await p.evaluate((sp) => {
      yzKurAyar('tur', 'siralama'); yzKurAyar('kayit', false); const t = yzKurulumTaslak(); t.katilimci = sp.slice(); yzBaslat();
      const o = yzOku(), f = yzFormat(o.durum);
      yzGuncelle((x) => { sp.forEach((k, i) => { const p = String(10 - i); x[yzSKey(x.durum.id, k)] = Array.from({ length: f.seri }, () => Array.from({ length: f.ok }, () => p)); }); x.durum.seri = f.seri - 1; });
      const m = document.getElementById('onay-modal'); if (m) m.style.display = 'none'; yzCiz();
    }, sp);
    await p.waitForSelector('button:has-text("Bitir → eleme")', { timeout: 15000 });
    await p.screenshot({ path: O + 'tur-son.png' });
    await p.locator('button', { hasText: 'Bitir → eleme' }).first().click();
    await p.waitForTimeout(400);
    dogrula(/Klasik ve makaralı ayrı/.test(await p.locator('#onay-modal').textContent()), 'pencerede yay seçeneği');
    await p.evaluate(() => { _yz.beN = yzOku().durum.katilimci.length; onayOnayla(); });
    await p.waitForTimeout(800);
    let r = await p.evaluate(() => { const o = yzOku(), el = yzElemeHesapla(o); return { asama: o.durum.asama, ayri: el.ayri, n: o.eleme.tohumlar.length, ilk: el.maclar.filter((m) => m.tur === 0 && m.a && m.b).map((m) => yzMakaraliMi(m.a) === yzMakaraliMi(m.b)), arsiv: yzArsivOku().length }; });
    esit(r.asama, 'eleme', 'elemeye geçti'); esit(r.ayri, true, 'klasik/makaralı ayrı'); esit(r.n, 8, 'tümü tabloda');
    dogrula(r.ilk.length && r.ilk.every(Boolean), 'ilk turda karışık maç yok');
    // ilk turdaki gerçek maçları "a" kazansın
    const oynaIlk = () => p.evaluate(() => {
      _yz.siradaki = false; const el = yzElemeHesapla(yzOku()); const ids = el.maclar.filter((m) => m.tur === 0 && m.oynanabilir).map((m) => m.id);
      ids.forEach((id) => { for (let i = 0; i < 3; i++) { yzMacSetGir(id, 'a', i); ['10', '10', '10'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzMacSetGir(id, 'b', i); ['5', '5', '5'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); } });
      return ids.length;
    });
    const n1 = await oynaIlk(); dogrula(n1 >= 2, 'ilk tur maçı: ' + n1);
    // 🔁 elenenler tablosu
    await p.locator('button', { hasText: '🔁 Elenenler tablosu' }).click(); await p.waitForTimeout(300);
    const secilen = await p.evaluate(() => Object.keys(_yz.kenarSec));
    await p.evaluate(() => onayOnayla()); await p.waitForTimeout(500);
    r = await p.evaluate(() => { const o = yzOku(), el = yzElemeHesapla(o), elT = yzElemeHesapla(o, o.teselli); const elenen = el.maclar.filter((m) => m.kaybedenK).map((m) => m.kaybedenK); return { elenen: elenen.sort(), tes: o.teselli.tohumlar.slice().sort(), ids: elT.maclar.map((m) => m.id), oyn: elT.maclar.filter((m) => m.oynanabilir).map((m) => m.id) }; });
    esit(JSON.stringify(r.tes), JSON.stringify(r.elenen), 'elenenler tablosunda yalnız elenenler');
    dogrula(r.ids.every((id) => id[0] === 'L'), 'elenen maç id önekli');
    dogrula(r.oyn.length >= 1, 'elenenler maçı oynanabilir');
    // elenenler maçına giriş (paneli aç, ortak giriş)
    const tm = r.oyn[0];
    r = await p.evaluate((id) => { _yz.siradaki = false; yzMacSec(id); for (let i = 0; i < 3; i++) { yzMacSetGir(id, 'a', i); ['9', '9', '9'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzMacSetGir(id, 'b', i); ['6', '6', '6'].forEach((v) => yzOkEkle(v)); yzGirisKaydet(); } const m = yzTumMaclar(yzOku()).find((x) => x.id === id); return { kaz: m.kazanan, pa: m.puanA, ana: yzElemeHesapla(yzOku()).maclar.filter((x) => x.kazanan).length }; }, tm);
    esit(r.kaz + ' ' + r.pa, 'a 6', 'elenenler maçı kazanıldı');
    await p.screenshot({ path: O + 'elenenler.png', fullPage: true });
    // TV
    await p.evaluate(() => yzTvAc()); await p.waitForTimeout(1200);
    dogrula(/ELENENLER/i.test(await p.locator('.yz-tv-teselli').textContent()), 'TV elenenler tablosu');
    await p.screenshot({ path: O + 'tv.png' });
    await p.evaluate(() => yzTvKapat());
    // kapat
    await p.evaluate(() => { yzTeselliSil(); onayOnayla(); });
    esit(await p.evaluate(() => !!yzOku().teselli), false, 'elenenler tablosu kapandı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('sıralama son seri → ⚔️ Bitir → eleme (yay ayrı) · ilk tur · 🔁 elenenler tablosu (yalnız elenenler, L önekli maçlar, giriş, TV) · kapat');
  } finally {
    try { await p.evaluate((y) => { const l = (_kmListe || []); (window.__yayYedek || []).forEach((v, i) => { const s = l[i] && turnuvaDB.buyukler[l[i].ad]; if (s) { if (v === undefined) delete s.yay; else s.yay = v; } }); if (y) localStorage.setItem(yzAnahtar(), y); else localStorage.removeItem(yzAnahtar()); }, yedek); } catch (e) {}
    await ctx.close();
  }
}
