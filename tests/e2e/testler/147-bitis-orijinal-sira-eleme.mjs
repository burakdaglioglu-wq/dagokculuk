// 🏁 Yarışma sonu: orijinal sıralama + eleme tablosu (2026-11-20, v440; kullanıcı: "yarışma sonunda orijinal sıralama ile elemeli
// maçlar tablosu da oluştur"). Sıralama modu yalnız tur sürerken: tur bitince ✦ kalkar, sonuçta "Orijinal sıralama açıldı" bandı;
// son seride TV "🏁 Bitir" iki yol sunar (yalnız sıralama / sıralama + eleme); eleme gerçek sıralamaya göre (1–son) kurulur ve
// eleme ekranında "📋 orijinal sıralama" tablosu durur.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 900 });
  const O = 'tests/e2e/_cikti/147-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    await p.waitForFunction(() => typeof yzAnahtar === 'function' && typeof yzBaslat === 'function', null, { timeout: 20000 });
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe), g: localStorage.getItem('dag_yz_tv_gorunum') }));
    // 8 sporcu, kayıtsız tur, mod ilk4, her sporcuya farklı puan → gerçek sıra belli
    const n = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 8); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null;
      const t = yzKurulumTaslak(); t.katilimci = _kmListe.map((s) => s.g + '|' + s.ad); t.kayit = false; t.siraModu = 'ilk4'; t.hedefBasi = 2;
      yzBaslat(); localStorage.setItem('dag_yz_tv_gorunum', 'tablo');
      const o = yzOku(), d = o.durum, f = yzFormat(d);
      yzGuncelle((x) => { x.durum.katilimci.forEach((k, i) => { const s = []; for (let j = 0; j < f.seri; j++) s.push([['X', '10', '9'], ['10', '9', '9'], ['9', '9', '8'], ['8', '8', '8'], ['8', '7', '7'], ['7', '6', '6'], ['5', '5', '4'], ['3', '2', 'M']][i % 8]); x[yzSKey(d.id, k)] = s; }); x.durum.seri = f.seri - 1; });
      yzCiz(); return _kmListe.length;
    });
    esit(n, 8, 'testte 8 sporcu gerekli');
    const tur = await p.evaluate(() => ({ asama: yzOku().durum.asama, mod: yzOku().durum.ayar.siraModu, yildiz: document.querySelectorAll('#km-icerik .yz-tablo .yz-gizli-sira').length }));
    esit(tur.asama, 'tur', 'tur başlamalı'); esit(tur.mod, 'ilk4', 'mod ilk4'); esit(tur.yildiz, 4, 'tur sırasında ilk 4 dışında ✦');
    // TV son seri: 🏁 Bitir → iki seçenek
    await p.evaluate(() => yzTvAc()); await p.waitForSelector('#yz-tv .yz-tv-kontrol', { timeout: 15000 }); await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(400);
    await p.locator('#yz-tv .yz-tv-k', { hasText: '🏁 Bitir' }).first().click(); await p.waitForTimeout(300);
    esit(await p.locator('#yz-bitir-sira').count(), 1, 'Bitir: orijinal sıralama seçeneği'); esit(await p.locator('#yz-bitir-eleme').count(), 1, 'Bitir: eleme seçeneği');
    await p.screenshot({ path: O + '1-bitir-sec.png' });
    // yalnız sıralama → sonuç ekranı, ✦ yok, bant var
    await p.locator('#yz-bitir-sira').click(); await p.waitForTimeout(600);
    await p.evaluate(() => yzTvKapat()); await p.waitForTimeout(300); await p.evaluate(() => yzCiz()); await p.waitForTimeout(400);
    const son = await p.evaluate(() => { const sr = yzSiralama(yzOku()); return { asama: yzOku().durum.asama, yildiz: document.querySelectorAll('.yz-gizli-sira').length, bant: !!document.querySelector('.yz-gercek-sira'), ilk: (document.querySelector('#km-icerik .yz-tablo tbody tr td.sira') || {}).textContent, lider: sr[0].sira }; });
    esit(son.asama, 'bitti', 'tur bitmeli'); esit(son.yildiz, 0, 'sonuçta ✦ kalmamalı'); dogrula(son.bant, '"Orijinal sıralama açıldı" bandı yok'); esit(son.ilk, '1', 'tablo 1. ile başlamalı');
    await p.screenshot({ path: O + '2-sonuc.png', fullPage: true });
    // sonuçtan eleme (4) → gerçek sıraya göre 1–4, 2–3
    await p.evaluate(() => yzElemeBaslat(4)); await p.waitForTimeout(700);
    const el = await p.evaluate(() => { const o = yzOku(), sr = yzSiralama(o), e = yzElemeHesapla(o), m = e.maclar.filter((x) => x.a && x.b).slice(0, 2); return { asama: o.durum.asama, mac: m.map((x) => [x.a, x.b].sort().join('~')), bek: [[sr[0].k, sr[3].k].sort().join('~'), [sr[1].k, sr[2].k].sort().join('~')], orj: !!document.querySelector('.yz-orj-sira'), orjAcik: !!(document.querySelector('.yz-orj-sira') || {}).open, yildiz: document.querySelectorAll('.yz-orj-sira .yz-gizli-sira').length, satir: document.querySelectorAll('.yz-orj-sira .yz-tablo tbody tr').length }; });
    esit(el.asama, 'eleme', 'eleme başlamalı');
    dogrula(el.bek.every((b) => el.mac.indexOf(b) !== -1), 'eşleşme gerçek sıraya göre olmalı (1–4, 2–3): ' + JSON.stringify(el));
    dogrula(el.orj && el.orjAcik, 'eleme ekranında açık orijinal sıralama tablosu yok'); esit(el.yildiz, 0, 'orijinal tabloda ✦ olmamalı'); esit(el.satir, 8, 'orijinal tabloda 8 sporcu');
    await p.screenshot({ path: O + '3-eleme.png', fullPage: true });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('tur sırasında ✦ · Bitir iki seçenek · sonuçta ✦ yok + bant · eleme gerçek sıraya göre (1–4, 2–3) · eleme ekranında orijinal sıralama');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzTvKapat(); } catch (e) {} const w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); }; w(yzAnahtar(), y.yz); w('dag_yz_tv_gorunum', y.g); _kmListe = JSON.parse(y.liste); }, yedek).catch(() => {});
    await ctx.close();
  }
}
