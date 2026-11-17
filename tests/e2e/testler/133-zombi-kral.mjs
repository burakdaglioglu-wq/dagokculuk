// 🧟👑 Zombi Kralı + komik-korkunç zombiler (2026-11-18, v425). Kullanıcı tarayıcı taslağından 2.yi seçti ("zombiler biraz daha korkutucu
// ama komik korkutucu"). Kral köprüden yürür: her seri 2 adım, her panzehir oku 1 adım geri; çatıya varırsa (Normal) 2 kişiyi ısırır, köprüye döner.
// Şerit ekranda, Kral itilince "AYYY" balonu, zombiler ara sıra konuşur; içerikten kapatılınca şerit gizlenir ve Kral gelmez. Geri al Kral'ı da geri alır.
// 24 çocukta ekran görüntüsü (1366 + tam ekran benzeri 1920) ve 390 px.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const O = 'tests/e2e/_cikti/133-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const ac = (n) => p.evaluate((n) => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      const kn = _kmAktifKonum || 'varsayilan'; _kmListe = tum.slice(0, n); localStorage.removeItem('dag_km_zombi_' + kn); localStorage.setItem('dag_km_zombimod_' + kn, 'normal'); localStorage.setItem('dag_km_an_kapali', '1');
      kmOyunListeDegisti && kmOyunListeDegisti(); kmOyunTemaSec('zombi'); return _kmListe.length;
    }, n);
    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0, bos = 0; k < 200 && bos < 4; k++) { await new Promise((r) => setTimeout(r, 100)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); bos = 0; } else if (!_kmOyunKilit) bos++; else bos = 0; }
      return JSON.parse(JSON.stringify(zbDurum()));
    }, [oklar, hedef]);
    const idx = () => p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0));

    // oyunda: şerit görünür, zayıf seri Kral'ı yaklaştırır, iyi seri iter
    await ac(16);
    await p.waitForSelector('#zb-kalabalik .zb-kisi', { timeout: 30000 }); await p.waitForTimeout(2600);
    // saf kurallar
    const saf = await p.evaluate(() => {
      const I = _zbIc, ilk = (l) => l[0], h = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const st = { zombi: { a: 1 }, zamani: {}, isirik: {}, seri: 0, mod: 'normal', kral: { d: 0, gel: 0 } };
      const r1 = I.kralAdim(st, 0, h, [], ilk); const r2 = I.kralAdim(st, 3, h, [], ilk);
      st.kral.d = I.kralYol(h.length) - 1; const r3 = I.kralAdim(st, 0, h, ['b'], ilk);
      return { yol: [I.kralYol(8), I.kralYol(16), I.kralYol(24), I.kralYol(40)], d1: r1.d, d2: r2.d, var3: r3.vardi, is3: r3.isirilan, d3: st.kral.d, gel: st.kral.gel, isk: [I.kralIsirik({ mod: 'kolay' }), I.kralIsirik({ mod: 'normal' }), I.kralIsirik({ mod: 'kabus' })] };
    });
    esit(JSON.stringify(saf.yol), JSON.stringify([7, 14, 16, 16]), 'yol uzunluğu'); esit(saf.d1, 2, 'zayıf seri 2 adım'); esit(saf.d2, 1, '3 panzehir 1 adım geri itti');
    esit(saf.var3, true, 'çatıya vardı'); esit(JSON.stringify(saf.is3), JSON.stringify(['c', 'd']), 'Normal: 2 kişi, zombi ve hariç tutulan değil'); esit(saf.d3, 0, 'köprüye döner'); esit(saf.gel, 1, 'geliş sayısı');
    esit(JSON.stringify(saf.isk), JSON.stringify([1, 2, 3]), 'moda göre ısırık');

    dogrula(await p.locator('#zb-kral').isVisible(), 'Kral şeridi görünmeli');
    const ix = await idx();
    let st = await seri(['2', '1', 'M'], ix[0]); esit(st.kral.d, 2, 'zayıf seri: Kral 2 adım');
    const sol1 = await p.evaluate(() => parseFloat(document.getElementById('zb-kr-k').style.left));
    dogrula(sol1 > 0, 'Kral şeritte ilerledi: ' + sol1);
    st = await seri(['X', '10', '10'], ix[1]); dogrula(st.kral.d <= 1, 'iyi seri Kral\'ı itti (d ' + st.kral.d + ')');
    // geri al
    st = await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); return JSON.parse(JSON.stringify(zbDurum())); });
    esit(st.kral.d, 2, 'geri al Kral\'ı da geri alır');
    // çatıya varış: Kral'ı bir adım kalaya getir, zayıf seri → ısırık + büyük Kral
    await p.evaluate(() => { const s = zbDurum(); s.kral.d = 13; localStorage.setItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(s)); zbGuncelle(); });
    const once = await p.evaluate(() => { const s = zbDurum(); return _kmOyunRosterCache.filter((x) => s.zombi[x.g + '|' + x.ad]).length; });
    const varis = p.evaluate(async (j) => { _kmOyunAktifIndex = j; _kmOyunSeriGirisleri = ['2', '1', 'M']; _kmOyunSeriKonumlari = []; kmOyunIlerlet(); }, ix[2]);
    await varis;
    let buyukGoruldu = false, balonGoruldu = false;
    for (let k = 0; k < 60; k++) { await p.waitForTimeout(100); if (!buyukGoruldu && await p.locator('.zb-kral-buyuk').count()) { buyukGoruldu = true; await p.screenshot({ path: O + 'kral-catida.png' }); } if (await p.locator('.zb-balon.kral').count()) balonGoruldu = true; }
    await p.waitForFunction(() => !_kmOyunKilit, null, { timeout: 20000 });
    st = await p.evaluate(() => JSON.parse(JSON.stringify(zbDurum())));
    const sonra = await p.evaluate(() => { const s = zbDurum(); return _kmOyunRosterCache.filter((x) => s.zombi[x.g + '|' + x.ad]).length; });
    dogrula(buyukGoruldu, 'Kral çatıya atlamalı'); dogrula(balonGoruldu, 'Kral konuşmalı'); esit(st.kral.d, 0, 'Kral köprüye döndü'); esit(st.kral.gel, 1, 'geliş');
    dogrula(sonra >= once + 2, 'Kral + normal ısırık: zombi ' + once + ' → ' + sonra);
    // zombiler ara sıra konuşur
    await p.evaluate(() => { document.querySelectorAll('.zb-balon').forEach((b) => b.remove()); });
    let konustu = false; for (let k = 0; k < 110 && !konustu; k++) { await p.waitForTimeout(100); konustu = (await p.locator('#zb-kalabalik .zb-balon').count()) > 0; }
    dogrula(konustu, 'bir zombi konuşmalı');
    await p.screenshot({ path: O + 'konusan.png' });
    // içerikten kapat: şerit gizli, Kral yürümez
    await p.evaluate(() => { const h = JSON.parse(localStorage.getItem('dag_km_oyun_icerik') || '{}'); h.zombi = Object.assign(h.zombi || {}, { kral: false }); localStorage.setItem('dag_km_oyun_icerik', JSON.stringify(h)); zbGuncelle(); });
    esit(await p.locator('#zb-kral').isVisible(), false, 'kapalıyken şerit gizli');
    st = await seri(['2', '1', 'M'], ix[3]); esit(st.kral.d, 0, 'kapalıyken Kral yürümez');
    await p.evaluate(() => { const h = JSON.parse(localStorage.getItem('dag_km_oyun_icerik') || '{}'); if (h.zombi) delete h.zombi.kral; localStorage.setItem('dag_km_oyun_icerik', JSON.stringify(h)); zbGuncelle(); });

    // 24 çocuk: ekranlar
    await ac(24);
    await p.waitForSelector('#zb-kalabalik .zb-kisi', { timeout: 30000 }); await p.waitForTimeout(2600);
    const ix24 = await idx();
    for (const j of ix24.slice(0, 5)) await seri([['8', '4', '2'], ['3', '2', 'M'], ['X', '9', '7'], ['5', '3', '1'], ['2', '2', 'M']][j % 5], j);
    await p.waitForTimeout(800);
    await p.screenshot({ path: O + 'oyun-24.png' });
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '1366 yana taşma');
    await p.setViewportSize({ width: 1920, height: 1080 }); await p.waitForTimeout(1200);
    await p.screenshot({ path: O + 'oyun-1920.png' });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(1200);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yana taşıyor');
    await p.screenshot({ path: O + 'telefon.png' });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Kral kuralları (yol, 2 adım, panzehir iter, moda göre ısırık) · şerit · geri al · çatıya varış + büyük Kral + balon · zombiler konuşur · içerikten kapatma · 24 çocuk · 1920 · 390 px');
  } finally {
    try {
      await p.evaluate((y) => { const kn = _kmAktifKonum || 'varsayilan'; localStorage.removeItem('dag_km_zombi_' + kn); localStorage.removeItem('dag_km_an_kapali'); if (y) { _kmListe = JSON.parse(y); kmOyunListeDegisti && kmOyunListeDegisti(); } }, yedek);
    } catch (e) {}
    await ctx.close();
  }
}
