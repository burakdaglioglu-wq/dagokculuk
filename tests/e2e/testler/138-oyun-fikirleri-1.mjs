// 🎮 Oyun fikirleri 1. dalga (2026-11-18, v434). Kullanıcı fikir sayfasından 1–8, 10–12'yi seçti. Bu test:
//  12 📜 20 saniyede kural (her oyun cihazda günde ilk açılışta 3 kart + anlatıcı, ŞİMDİ şeridinde 📜 ile tekrar)
//  11 🎬 Günün 5 anı (5 ayrı çocuk, 5 ayrı başarı)
//   6 🎯 Zayıf nokta (Epik Arena: büyük halka "×2", ŞİMDİ cümlesinde renk, okta "ZAYIF NOKTA ×2!")
//   3 🤝 Zombi ikili kurtarma (art arda iki çocuğun toplamı ≥ ok başı 5,5 → en eski zombi kurtulur, iki ad birden)
//   1 ☠️ Filo korsan baskını (her 3 turda korsanlar adaya çıkar, 7+ ok denize atar, sandığa varan kese çalar, sandık boşalırsa kayıp)
// 24 çocukta 1366 ve 390 px ekran görüntüleri.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const O = 'tests/e2e/_cikti/138-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const tum = await p.evaluate(() => { const t = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) t.push({ g, ad }); })); window.__tum = t; localStorage.setItem('dag_km_an_kapali', '1'); return t.length; });
    dogrula(tum >= 6, 'en az 6 sporcu gerekli');
    const ac = (tema, n) => p.evaluate(([tema, n]) => { _kmListe = window.__tum.slice(0, n); const kn = _kmAktifKonum || 'varsayilan'; ['dag_km_zombi_', 'dag_km_h3_filo_', 'dag_km_h3sefer_filo_'].forEach((a) => localStorage.removeItem(a + kn)); localStorage.setItem('dag_km_zombimod_' + kn, 'normal'); kmOyunListeDegisti && kmOyunListeDegisti(); kmOyunTemaSec(tema); }, [tema, n]);
    const seri = (oklar, hedef, durumFn) => p.evaluate(async ([oklar, hedef, durumFn]) => {
      _kmOyunAktifIndex = hedef; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0, bos = 0; k < 400 && bos < 4; k++) { await new Promise((r) => setTimeout(r, 100)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); bos = 0; } else if (!_kmOyunKilit) bos++; else bos = 0; }
      return durumFn ? JSON.parse(JSON.stringify(window[durumFn](_kmOyunAktifTema))) : null;
    }, [oklar, hedef, durumFn || null]);
    const idx = () => p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0));
    const n24 = Math.min(24, tum);

    // ── 12 📜 kural kartları: Zombi 24 çocuk
    await p.evaluate(() => { window.__anTest = true; Object.keys(localStorage).filter((a) => a.indexOf('dag_km_kural_') === 0).forEach((a) => localStorage.removeItem(a)); });
    await ac('zombi', n24);
    await p.waitForSelector('.an-kural', { timeout: 20000 }); await p.waitForTimeout(4800);
    esit(await p.locator('.an-kural .an-kart').count(), 3, '3 kural kartı');
    esit(await p.locator('.an-kural .an-kart.on').count(), 3, 'kartlar sırayla açıldı');
    await p.screenshot({ path: O + 'kural-zombi.png' });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'kural 390 px taşma');
    await p.screenshot({ path: O + 'kural-telefon.png' });
    await p.setViewportSize({ width: 1366, height: 768 });
    await p.locator('.an-kural button', { hasText: 'Başlayalım' }).click();
    esit(await p.locator('.an-kural').count(), 0, 'Başlayalım kapatır');
    await p.evaluate(() => { kmOyunTemaSec('zombi'); }); await p.waitForTimeout(600);
    esit(await p.locator('.an-kural').count(), 0, 'aynı gün ikinci kez kendiliğinden açılmaz');
    await p.locator('#an-kural-dug').click(); await p.waitForTimeout(300);
    esit(await p.locator('.an-kural').count(), 1, '📜 Kural düğmesi tekrar açar');
    await p.evaluate(() => { anKuralKapat(); window.__anTest = false; });

    // ── 3 🤝 Zombi ikili kurtarma: saf + oyunda
    const saf = await p.evaluate(() => { const I = _zbIc, h = ['a', 'b', 'c', 'd'];
      const st = { zombi: { c: 1, d: 1 }, zamani: { c: 1, d: 3 } };
      const r1 = I.ikiliHesapla(st, 'a', [9, 8, 7], h, []); const r2 = I.ikiliHesapla(st, 'b', [3, 2, 5], h, []);
      const st2 = { zombi: { c: 1 }, zamani: { c: 1 } }; I.ikiliHesapla(st2, 'a', [2, 2, 1], h, []); const r3 = I.ikiliHesapla(st2, 'b', [6, 5, 4], h, []);
      const st3 = { zombi: { c: 1 }, zamani: { c: 1 } }; I.ikiliHesapla(st3, 'a', [10, 10, 10], h, []); const r4 = I.ikiliHesapla(st3, 'a', [10, 10, 10], h, []);
      return { esik: I.ikiliEsik(6), r1: r1.ikili, r2: r2.ikili && r2.ikili.join('+') + '>' + r2.kurtulan, kalan: Object.keys(st.zombi), sifir: st.ikili, r3: r3.ikili, ayni: r4.ikili }; });
    esit(saf.esik, 33, '3+3 ok eşiği 33'); esit(saf.r1, null, 'ilk atan tek başına ikili olamaz');
    esit(saf.r2, 'a+b>c', 'zayıf ikinci seri de ikili: 24+10=34 → en eski zombi (c)'); esit(JSON.stringify(saf.kalan), '["d"]', 'c kurtuldu'); esit(saf.sifir, null, 'başarıdan sonra çift sıfırlanır');
    esit(saf.r3, null, '5+15=20 yetmez'); esit(saf.ayni, null, 'aynı çocuk kendisiyle ikili olamaz');
    await p.waitForSelector('#zb-kalabalik .zb-kisi', { timeout: 30000 }); await p.waitForTimeout(2600);
    let ix = await idx();
    await seri(['9', '9', '8'], ix[0]);
    let ikiliGor = false; const ikinci = p.evaluate(([j]) => { _kmOyunAktifIndex = j; _kmOyunSeriGirisleri = ['8', '6', '5']; _kmOyunSeriKonumlari = []; kmOyunIlerlet(); }, [ix[1]]);
    await ikinci;
    for (let k = 0; k < 80 && !ikiliGor; k++) { await p.waitForTimeout(100); await p.evaluate(() => { const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') onayOnayla(); }); const t = await p.evaluate(() => (document.getElementById('zb-duyuru') || {}).textContent || ''); if (/İKİLİ PANZEHİR/.test(t)) { ikiliGor = true; await p.screenshot({ path: O + 'zombi-ikili.png' }); } }
    dogrula(ikiliGor, 'ekranda İKİLİ PANZEHİR duyurusu');
    await p.waitForFunction(() => !_kmOyunKilit, null, { timeout: 20000 });

    // ── 11 🎬 Günün anları: 6 çocuk, 5 ayrı ad
    const gun = await p.evaluate(() => {
      const kis = window.__tum.slice(0, 6), s = (i, o, t) => _anIc.anKaydet(t || 'zombi', kis[i], o);
      Object.keys(localStorage).filter((a) => a.indexOf('dag_km_anlar_') === 0).forEach((a) => localStorage.removeItem(a));
      s(0, ['X', 'X', '10']); s(1, ['9', '9', '9']); s(1, ['10', '9', '9']); s(2, ['3', '2', '1']); s(2, ['8', '7', '7']); s(3, ['6', '6', '5']); s(3, ['5', '6', '6']); s(4, ['X', '4', '3']); s(5, ['7', 'M', '6']);
      const r = anGununAnlari(); return r.map((x) => x.baslik + ':' + x.ad);
    });
    esit(gun.length, 5, '5 an'); esit(new Set(gun.map((x) => x.split(':')[1])).size, 5, '5 ayrı çocuk');
    dogrula(/En güçlü seri/.test(gun[0]) && gun[0].indexOf(await p.evaluate(() => window.__tum[0].ad)) > 0, 'en güçlü seri XX10: ' + gun[0]);
    await p.waitForTimeout(8500); await p.screenshot({ path: O + 'gunun-anlari.png' });
    await p.evaluate(() => anKuralKapat());

    // ── 6 🎯 Epik Arena zayıf nokta
    await ac('canavar', n24); await p.waitForTimeout(2500);
    const z = await p.evaluate(() => ({ yazi: (document.querySelector('.km-cnv-zayif .zy') || {}).textContent || '', r: (document.querySelector('.km-cnv-zayif .z0') || { getAttribute: () => '' }).getAttribute('r'), simdi: (document.getElementById('an-simdi') || {}).textContent || '', renk: kmCanavarZayifRenk(_kmCanavar.aktif), oz: _anIc.AN.canavar.okOzel(kmCanavarZayifRenk(_kmCanavar.aktif).okl.split('-')[0]) }));
    dogrula(/×2/.test(z.yazi), 'halkada ×2: ' + z.yazi); esit(z.r, '58', 'büyük halka');
    dogrula(/Zayıf nokta/.test(z.simdi) && z.simdi.indexOf(z.renk.ad.toLocaleUpperCase('tr-TR')) >= 0, 'ŞİMDİ cümlesinde renk: ' + z.simdi.slice(0, 90));
    esit(z.oz, 'ZAYIF NOKTA ×2!', 'okta zayıf nokta etiketi');
    await p.screenshot({ path: O + 'arena-zayif.png' });

    // ── 1 ☠️ Filo korsan baskını: saf + 6 çocukta 3 tur + 24 çocuk görüntü
    await ac('filo', 6); await p.waitForSelector('#h3-hud #h3-serit .h3-k', { timeout: 30000 }); await p.waitForTimeout(800);
    const fs = await p.evaluate(() => { const I = _h3Ic, st = { tur: 3, kese: 5, baskin: null };
      const a = I.baskinTur(st, 24).olay, n0 = st.baskin.n, it = I.baskinOk(st, [9, 7, 3]); st.tur = 4; const b = I.baskinTur(st, 24).olay; st.tur = 5; const c = I.baskinTur(st, 24);
      const st2 = { tur: 3, kese: 2, baskin: { n: 3, d: 1 } }; const d = I.baskinTur(st2, 24);
      const st3 = { tur: 3, kese: 4, baskin: { n: 0, d: 0 } }; const e = I.baskinTur(st3, 24).olay;
      return { a, n0, it, kalan: n0 - 2, b, c: c.olay + c.calinan, kese: st.kese, d: d.olay + st2.kese, e, kese3: st3.kese }; });
    esit(fs.a, 'cikti', '3. tur sonu korsan çıkar'); esit(fs.n0, 8, '24 çocukta 8 korsan'); esit(fs.it, 2, '9 ve 7 iki korsanı atar');
    esit(fs.b, 'yaklasti', 'bir tur sonra yaklaşır'); esit(fs.c, 'calindi5', 'kalan 6 korsan, sandıkta 5 kese: 5 çalınır'); esit(fs.kese, 0, 'kese en az 0');
    esit(fs.d, 'calindi0', 'sandık boşaldı'); esit(fs.e + fs.kese3, 'puskurtuldu5', 'püskürtülünce +1 kese');
    ix = await idx(); let st;
    for (let t = 0; t < 3; t++) for (const j of ix) st = await seri(['5', '4', '3'], j, 'h3Durum');
    dogrula(st.baskin && st.baskin.n === 3, '3 tur sonunda 6 çocukta 3 korsan: ' + JSON.stringify(st.baskin));
    dogrula(/KORSAN/.test(await p.locator('#an-simdi').textContent()), 'ŞİMDİ cümlesi baskını söyler');
    st = await seri(['9', '8', '2'], ix[0], 'h3Durum'); esit(st.baskin.n, 1, 'iki korsan denize');
    await p.screenshot({ path: O + 'filo-baskin-6.png' });
    for (const j of ix.slice(1)) st = await seri(['3', '2', '1'], j, 'h3Durum');
    for (const j of ix) st = await seri(['3', '2', '1'], j, 'h3Durum');
    esit(st.kese, 4, 'sandığa varan 1 korsan 1 kese çaldı'); esit(st.baskin, null, 'baskın bitti');
    // 24 çocuk görüntüsü: baskın sürerken
    await ac('filo', n24); await p.waitForSelector('#h3-hud #h3-serit .h3-k', { timeout: 30000 });
    await p.evaluate(() => { const s = h3Durum('filo'); s.tur = 4; s.baskin = { n: 8, d: 1, ilk: 8 }; s.kese = 3; localStorage.setItem('dag_km_h3_filo_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(s)); kmOyunTemaSec('filo'); });
    await p.waitForTimeout(2500); await p.screenshot({ path: O + 'filo-baskin-24.png' });
    // kayıp → Rövanş
    await p.evaluate(() => { const s = h3Durum('filo'); s.tur = 1; s.atan = {}; s.kese = 1; s.baskin = { n: 3, d: 1, ilk: 3 }; localStorage.setItem('dag_km_h3_filo_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(s)); kmOyunTemaSec('filo'); });
    await p.waitForSelector('#h3-serit .h3-k'); ix = await idx();
    for (const j of ix) st = await seri(['1', '1', 'M'], j, 'h3Durum');
    esit(st.kayip, 'soyuldu', 'sandık boşaldı → kayıp');
    await p.waitForSelector('#h3-son', { timeout: 10000 }); await p.screenshot({ path: O + 'filo-kayip.png' });
    await p.locator('#h3-yeni-son').click(); await p.waitForTimeout(800);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(h3Durum('filo'))));
    esit(st.faz + st.kese, 'oyun3', 'Rövanş: 3 kese ile sürer');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(800);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'filo 390 px taşma');
    await p.screenshot({ path: O + 'filo-telefon.png' });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('📜 kural kartları · 🤝 ikili kurtarma · 🎬 günün 5 anı · 🎯 zayıf nokta · ☠️ korsan baskını (çıkış, itme, kese, kayıp, rövanş) · 24 çocuk · 390 px');
  } finally {
    try { await p.evaluate((y) => { const kn = _kmAktifKonum || 'varsayilan'; ['dag_km_zombi_', 'dag_km_h3_filo_', 'dag_km_h3sefer_filo_'].forEach((a) => localStorage.removeItem(a + kn)); localStorage.removeItem('dag_km_an_kapali'); if (y) { _kmListe = JSON.parse(y); kmOyunListeDegisti && kmOyunListeDegisti(); } }, yedek); } catch (e) {}
    await ctx.close();
  }
}
