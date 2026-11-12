// Karışık Sınıf › Oyunlar › 🧟 Zombi Salgını v405 "Çatıda Kurtarma": tek sporcu (adsız kasabalılar, 3 tur), özel atış (her 5. atış, kocaman kart, ad, mavi yeter,
// çocuk başına bir kez, geri alınca geri gelir, ayardan kapanır), çatı sahnesi çizilir, ses kapalıyken hata yok, 390 px + TV görüntüleri.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  let yedek = null;
  const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
    if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
    const s = _kmOyunRosterCache[_kmOyunAktifIndex];
    _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
    for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120));
    const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120)); }
    await new Promise((r) => setTimeout(r, 200));
    return { key: s.g + '|' + s.ad, st: JSON.parse(JSON.stringify(zbDurum())) };
  }, [oklar, hedef]);
  const kur = (n) => p.evaluate(async (n) => {
    const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
    // yüksek ortalamalı (eşik sarı) bir çocuk öne: özel atışta mavinin yettiği görülsün
    tum.sort((a, b) => (kmCanavarSporcuOrtalama(b.g, b.ad) || 0) - (kmCanavarSporcuOrtalama(a.g, a.ad) || 0));
    localStorage.removeItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan')); localStorage.setItem('dag_km_zombimod_' + (_kmAktifKonum || 'varsayilan'), 'normal'); localStorage.setItem('dag_km_oyun_sessiz', '1');
    _kmListe = tum.slice(0, n); kmOyunTemaSec('zombi'); kmSekme('oyunlar');
    for (let i = 0; i < 100 && !document.querySelector('#zb-kalabalik .zb-kisi'); i++) await new Promise((r) => setTimeout(r, 100));
    document.querySelectorAll('#yk-ortu').forEach((e) => e.remove());
    return _kmListe.length;
  }, n);
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));

    // 1) TEK SPORCU: 7 kasabalı, 2 zombi başlar, 3 tur, kasabalılar atmaz
    esit(await kur(1), 1, 'tek sporcu');
    await p.waitForTimeout(2600);
    const t0 = await p.evaluate(() => ({ kasaba: document.querySelectorAll('.zb-kisi.kasabali').length, hepsi: document.querySelectorAll('#zb-kalabalik .zb-kisi').length, z: Object.keys(zbDurum().zombi).length, at: document.getElementById('zb-at').textContent }));
    esit(t0.kasaba, 7, '7 kasabalı'); esit(t0.hepsi, 8, 'kalabalık 8'); esit(t0.z, 2, 'az kişide 2 zombi başlar'); dogrula(/Tur 1 \/ 3/.test(t0.at), 'tur yazısı: ' + t0.at);
    const sahne = await p.evaluate(() => { const c = document.getElementById('zb-zemin'); const d = c.getContext('2d').getImageData(5, 5, 1, 1).data; return { gok: d[2] > d[1] && d[3] === 255 }; });
    dogrula(sahne.gok, 'çatı sahnesi: mavi gece göğü çizilmeli');
    await p.screenshot({ path: 'tests/e2e/_cikti/119-zombi-tek-tv.png' });
    let r = await seri(['9', '9', '9'], 0); esit(r.st.faz, 'oyun', '1. turdan sonra bitmemeli');
    r = await seri(['9', '9', '9'], 0); esit(r.st.faz, 'oyun', '2. turdan sonra bitmemeli');
    r = await seri(['9', '9', '9'], 0); esit(r.st.faz, 'son', '3 turda bitmeli');
    dogrula(r.st.finalAdlar.length === 1 && !/kasaba/i.test(r.st.finalAdlar.join()), 'finalde yalnızca gerçek çocuk: ' + r.st.finalAdlar);
    await p.waitForSelector('#zb-son', { timeout: 8000 });

    // 2) ÖZEL ATIŞ: 6 çocuk (kasabalı yok); 5. atışta kart
    esit(await kur(6), 6, '6 çocuk'); await p.waitForTimeout(2600);
    esit(await p.locator('.zb-kisi.kasabali').count(), 0, '6 kişide kasabalı yok');
    for (let i = 0; i < 4; i++) { r = await seri(['1', '1', '1'], i); }
    esit(r.st.seri, 4, '4 atış');
    await p.evaluate(() => { _kmOyunAktifIndex = 4; zbGuncelle(); });
    await p.waitForSelector('#zb-ozel', { timeout: 5000 });
    const kart = await p.evaluate(() => ({ yazi: document.getElementById('zb-ozel').innerText, ad: _kmOyunRosterCache[4].ad, ozel: zbDurum().ozel, esik: document.getElementById('zb-yan-hedef').getAttribute('data-esik'), yan: document.getElementById('zb-yan-esik').textContent }));
    dogrula(/ÖZEL ATIŞ/.test(kart.yazi) && /Maviye vursan panzehir/.test(kart.yazi), 'kart yazısı: ' + kart.yazi);
    dogrula(kart.yazi.toLocaleUpperCase('tr-TR').includes(String(kart.ad).trim().split(/\s+/)[0].toLocaleUpperCase('tr-TR')), 'kartta çocuğun adı');
    esit(kart.esik, '5', 'özel atışta mavi yeter'); dogrula(/Özel atış/.test(kart.yan), 'yan bilgi: ' + kart.yan);
    await p.screenshot({ path: 'tests/e2e/_cikti/119-zombi-ozel-tv.png' });
    // sıra başka çocuğa geçerse kart onunla gider
    await p.evaluate(() => { _kmOyunAktifIndex = 5; zbGuncelle(); });
    esit(await p.evaluate(() => zbDurum().ozel.key === _kmOyunRosterCache[5].g + '|' + _kmOyunRosterCache[5].ad), true, 'özel atış sıradaki çocuğa geçmeli');
    // mavi (5) ile panzehir: sarı eşikli çocuk bile kurtarır
    const once = await p.evaluate(() => Object.keys(zbDurum().zombi).length);
    r = await seri(['5', '1', '1'], 5);
    esit(r.st.kurtardi[r.key] || 0, 1, 'mavi ile panzehir sayılmalı'); esit(r.st.ozel, null, 'özel atış bitmeli'); esit(r.st.ozelOlan[r.key], 1, 'çocuk işaretlenmeli');
    esit(await p.locator('#zb-ozel').count(), 0, 'kart kapanmalı'); void once;
    // geri al: özel atış geri gelir
    await p.evaluate(async () => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); await new Promise((r) => setTimeout(r, 300)); });
    const ga = await p.evaluate(() => ({ ozel: zbDurum().ozel, kart: !!document.getElementById('zb-ozel') }));
    dogrula(ga.ozel && ga.kart, 'geri alınca özel atış ve kart geri gelmeli: ' + JSON.stringify(ga));
    // ayardan kapat: yeni özel atış çıkmaz
    await p.evaluate(() => { kmOyunIcerikDegis('zombi', 'ozel'); kmOyunAyarKapat(); const st = zbDurum(); st.ozel = null; st.ozelKarar = -1; st.seri = 9; localStorage.setItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); document.querySelectorAll('#zb-ozel').forEach((e) => e.remove()); _kmOyunAktifIndex = 3; zbGuncelle(); });
    await p.waitForTimeout(300);
    esit(await p.locator('#zb-ozel').count(), 0, 'kapalıyken özel atış çıkmamalı');
    await p.evaluate(() => { kmOyunIcerikDegis('zombi', 'ozel'); kmOyunAyarKapat(); });

    // 3) 390 px: kart ve sahne taşmaz
    await p.evaluate(() => { const st = zbDurum(); st.ozel = { key: _kmOyunRosterCache[0].g + '|' + _kmOyunRosterCache[0].ad, tip: 'goz', seri: st.seri }; st.ozelOlan = {}; localStorage.setItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); _kmOyunAktifIndex = 0; zbGeriYukle(st); });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    const tel = await p.evaluate(() => { const o = document.getElementById('zb-ozel'), s = document.querySelector('.zb-sahne'); if (!o) return { yok: true }; const ad = o.querySelector('.zb-oz-ad').getBoundingClientRect(), g = o.querySelector('.zb-oz-gorev').getBoundingClientRect(), r = s.getBoundingClientRect(); return { ad: ad.right <= r.right + 1 && ad.left >= r.left - 1, gorev: g.right <= r.right + 1, sahne: s.scrollWidth <= s.clientWidth + 1 }; });
    dogrula(tel.ad && tel.gorev && tel.sahne, '390 px özel atış kartı: ' + JSON.stringify(tel));
    await p.screenshot({ path: 'tests/e2e/_cikti/119-zombi-ozel-tel.png' });
    await p.evaluate(() => document.getElementById('zb-ozel').click());
    await p.screenshot({ path: 'tests/e2e/_cikti/119-zombi-tel.png' });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('tek sporcu (7 kasabalı, 2 zombi, 3 tur, finalde yalnız çocuk) · özel atış (5. atış, kart, ad, mavi yeter, sıradakine geçer, bir kez, geri al, ayar) · çatı sahnesi · 390 px');
  } finally {
    await p.evaluate((y) => { try { localStorage.removeItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan')); localStorage.removeItem('dag_km_oyun_sessiz'); if (y) _kmListe = JSON.parse(y); } catch (e) { } }, yedek).catch(() => { });
    await ctx.close();
  }
}
