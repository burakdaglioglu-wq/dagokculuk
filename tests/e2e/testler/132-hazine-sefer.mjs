// 🏴‍☠️ Hazine Adası SEFER (2026-11-17, v424). Kullanıcı: "gemi düşürmecede bir gemi düşünce bitiyor oyun, devamı yok".
// Top Savaşı: 5 korsan gemisi sırayla (Sandal → Kara Yelken → Hayalet → Kızıl Kaptan → Amiral); biri batınca sıradaki gelir,
// oyun bitmez, fazla gülle sıradakine gider, +1 can tamir. Kayıpta Rövanş kaldığı gemiden. Final ancak amiral batınca ve
// herkes atınca. Kaçış ve Filo: 5 adalık rota, adaya varınca sıradaki ada (Filo'da varanlar yıldız alır).
// Sefer ilerlemesi 12 saat kuralına girmez (ertesi ders sürer), geri al onu da geri alır. 24 sporcuda ekran görüntüleri.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const O = 'tests/e2e/_cikti/132-';
  let yedek = null;
  try {
    if (process.env.E2E_3B) await ctx.addInitScript(() => { window.__h3Zorla3B = true; });
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const tum = await p.evaluate(() => { const t = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) t.push({ g, ad }); })); window.__tum = t; localStorage.setItem('dag_km_an_kapali', '1'); return t.length; });
    dogrula(tum >= 6, 'en az 6 sporcu gerekli');
    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      _kmOyunAktifIndex = hedef;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0, bos = 0; k < 400 && bos < 4; k++) { await new Promise((r) => setTimeout(r, 100)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); bos = 0; } else if (!_kmOyunKilit) bos++; else bos = 0; }
      return JSON.parse(JSON.stringify(h3Durum(_kmOyunAktifTema)));
    }, [oklar, hedef]);
    const ac = async (tid, n, sefer) => {
      await p.evaluate(([tid, n, sefer]) => { _kmListe = window.__tum.slice(0, n); const kn = _kmAktifKonum || 'varsayilan'; localStorage.removeItem('dag_km_h3_' + tid + '_' + kn); if (sefer) localStorage.setItem('dag_km_h3sefer_' + tid + '_' + kn, JSON.stringify(sefer)); else localStorage.removeItem('dag_km_h3sefer_' + tid + '_' + kn); kmOyunListeDegisti && kmOyunListeDegisti(); kmOyunTemaSec(tid); }, [tid, n, sefer || null]);
      await p.waitForSelector('#h3-hud #h3-serit .h3-k', { timeout: 30000 }); await p.waitForTimeout(800);
    };
    const idxler = () => p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0));
    const tur = async (oklar, kesBeklenen) => { const ix = await idxler(); let st = null; for (let k = 0; k < ix.length; k++) { st = await seri(typeof oklar === 'function' ? oklar(k) : oklar, ix[k]); if (kesBeklenen && k === ix.length - 2) kesBeklenen(st); } return st; };

    // ── Top Savaşı: biri batınca sıradaki gelir
    await ac('topsavasi', 6);
    const ix = await idxler();
    let st = await seri(['X', '10', '10'], ix[0]);
    esit(st.adim, 0, 'ilk seri: Sandal'); dogrula(st.hp < st.hpMax, 'hasar');
    st = await seri(['X', '10', '10'], ix[1]);
    // 6 sporcu × 3 ok = 18 → Sandal 27 can: 2 seri × 18 = 36 → battı, Kara Yelken geldi
    esit(st.adim, 1, 'Sandal batınca Kara Yelken gelmeli'); esit(st.faz, 'oyun', 'bir gemi batınca oyun bitmez');
    esit(st.hp, st.hpMax - 6, 'batıran oktan sonraki gülle sıradaki gemiye gider'); esit(st.yeni, true, 'yeni gelen gemi bu tur saymaz');
    const harita = await p.locator('#h3-durum .h3-harita').innerText();
    dogrula(/Kara Yelken/.test(harita) && /2\/5/.test(harita), 'HUD haritası: ' + harita.replace(/\s+/g, ' '));
    // geri al: batış da geri alınır, sefer kaydı da
    st = await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); return JSON.parse(JSON.stringify(h3Durum('topsavasi'))); });
    esit(st.adim, 0, 'geri al: Sandal geri gelir');
    esit(await p.evaluate(() => JSON.parse(localStorage.getItem('dag_km_h3sefer_topsavasi_' + (_kmAktifKonum || 'varsayilan'))).adim), 0, 'geri al: sefer kaydı');
    st = await seri(['X', '10', '10'], ix[1]); esit(st.adim, 1, 'yeniden batır');
    for (const j of ix.slice(2)) st = await seri(['X', '10', '10'], j);
    await p.waitForTimeout(600);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(h3Durum('topsavasi'))));
    dogrula(st.adim >= 2, 'iyi tur 2+ gemi batırır (adim ' + st.adim + ')'); esit(st.tur, 2, 'tur ilerler'); esit(st.faz, 'oyun', 'sefer sürer');
    dogrula(st.kalan === 3, 'yeni gelen gemi tur sonunda yaklaşmaz (kalan ' + st.kalan + ')');
    const simdi = await p.locator('#an-simdi .an-cumle').innerText().catch(() => '');
    // ── ertesi ders: sefer kaldığı gemiden sürer (12 saat kuralı günlük oyunu siler, seferi değil)
    const adim2 = st.adim;
    const ertesi = await p.evaluate(() => { const kn = _kmAktifKonum || 'varsayilan'; localStorage.setItem('dag_km_oyun_son_' + kn, String(Date.now() - 13 * 3600000)); kmOyunBayatSifirla(); const s = h3Durum('topsavasi'); return { adim: s.adim, tur: s.tur, can: s.can, hp: s.hp }; });
    esit(ertesi.adim, adim2, '12 saat sonra sefer sürer'); esit(ertesi.tur, 1, 'günlük oyun sıfırlanır'); esit(ertesi.can, 6, 'yeni ders 6 can');
    // ── kayıp → rövanş kaldığı gemiden
    await ac('topsavasi', 6, { adim: 3, yildiz: {}, tamam: 0 });
    for (let t = 0; t < 6; t++) { st = await tur(['2', '1', 'M'], (s) => esit(s.faz, 'oyun', 'herkes atmadan bitmez')); if (st.faz === 'son') break; }
    await p.waitForTimeout(800);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(h3Durum('topsavasi'))));
    esit(st.faz, 'son', 'zayıf sınıf kaybeder'); dogrula(!!st.kayip, 'kayıp');
    await p.waitForSelector('#h3-son', { timeout: 10000 });
    const kayipYazi = await p.locator('#h3-son').innerText();
    dogrula(/Kızıl Kaptan/.test(kayipYazi) && /3 gemi batırdınız/.test(kayipYazi) && /Rövanş/.test(kayipYazi), 'kayıp kartı: ' + kayipYazi.replace(/\s+/g, ' ').slice(0, 140));
    await p.screenshot({ path: O + 'topsavasi-kayip.png' });
    await p.locator('#h3-yeni-son').click(); await p.waitForTimeout(600);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(h3Durum('topsavasi'))));
    esit(st.faz, 'oyun', 'rövanş'); esit(st.adim, 3, 'rövanş kaldığı gemiden'); esit(st.can, 6, 'rövanş 6 can');
    // ── final: amiral batınca ve herkes atınca
    await ac('topsavasi', 6, { adim: 4, yildiz: {}, tamam: 0 });
    for (let t = 0; t < 4; t++) { st = await tur(['X', '10', '10'], (s) => esit(s.faz, 'oyun', 'amiral batsa da herkes atmadan bitmez')); if (st.faz === 'son') break; }
    await p.waitForTimeout(800);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(h3Durum('topsavasi'))));
    esit(st.faz, 'son', 'amiral batınca sefer biter'); esit(st.kayip, null, 'zafer'); esit((st.finalAdlar || []).length, 6, 'finalde herkesin adı');
    await p.waitForSelector('#h3-son', { timeout: 10000 });
    dogrula(/FİLOSU YOK/.test(await p.locator('#h3-son').innerText()), 'final kartı');
    await p.locator('#h3-yeni-son').click(); await p.waitForTimeout(500);
    esit(await p.evaluate(() => h3Durum('topsavasi').adim), 0, 'yeni sefer baştan');

    // ── Kaçış: adaya varınca sıradaki ada
    await ac('kacis', 6);
    for (let t = 0; t < 6; t++) { st = await tur(['X', '10', '10']); if (st.adim > 0 || st.faz !== 'oyun') break; }
    await p.waitForTimeout(800);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(h3Durum('kacis'))));
    esit(st.adim, 1, 'kaçış: Martı Adası sonrası Kayalık Ada'); esit(st.faz, 'oyun', 'kaçış sürer'); esit(st.yol, 0, 'yeni rota baştan');
    dogrula(/Kayalık Ada/.test(await p.locator('#h3-durum .h3-harita').innerText()), 'kaçış haritası');
    await p.screenshot({ path: O + 'kacis-ada2.png' });

    // ── Filo: varanlar yıldız alır, yarış sıradaki adaya devam eder
    await ac('filo', 6);
    for (let t = 0; t < 6; t++) { st = await tur(['X', '10', '10']); if (st.adim > 0 || st.faz !== 'oyun') break; }
    await p.waitForTimeout(800);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(h3Durum('filo'))));
    esit(st.adim, 1, 'filo: ikinci ada'); esit(st.faz, 'oyun', 'filo sürer'); esit(Object.keys(st.x).length, 0, 'gemiler yeniden başta');
    esit(Object.values(st.yildiz).filter((y) => y === 1).length, 6, 'adaya varan 6 sporcu yıldız aldı');

    // ── 24 sporcu: Top Savaşı ekranları (filo ufukta, geçiş anı) — 1366 ve 390 px
    await p.evaluate(() => localStorage.removeItem('dag_km_an_kapali'));
    await ac('topsavasi', 24);
    const ix24 = await idxler();
    for (const j of ix24.slice(0, 8)) await seri([['X', '10', '9'], ['8', '7', '9'], ['6', '7', '5'], ['10', '9', '9']][j % 4], j);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: O + 'topsavasi-24.png' });
    // batış anı: sıradaki seri gemiyi batıracak kadar hasar ver
    const adimOnce = await p.evaluate(() => h3Durum('topsavasi').adim);
    await p.evaluate(() => { const s = h3Durum('topsavasi'); s.hp = 3; localStorage.setItem('dag_km_h3_topsavasi_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(s)); });
    const batis = p.evaluate(async (j) => { _kmOyunAktifIndex = j; _kmOyunSeriGirisleri = ['X', '10', '9']; _kmOyunSeriKonumlari = []; kmOyunIlerlet(); }, ix24[8]);
    await batis; await p.waitForTimeout(4600);
    await p.screenshot({ path: O + 'topsavasi-batis.png' });
    await p.waitForTimeout(2600);
    await p.screenshot({ path: O + 'topsavasi-sonraki.png' });
    await p.waitForFunction(() => !_kmOyunKilit, null, { timeout: 20000 });
    esit(await p.evaluate(() => h3Durum('topsavasi').adim), adimOnce + 1, '24 sporcu: batış sonrası sıradaki gemi');
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '1366 yana taşma');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(1200);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yana taşıyor');
    await p.screenshot({ path: O + 'telefon.png' });
    const mod = await p.evaluate(() => document.querySelector('.h3-sahne').classList.contains('duz') ? '2B' : '3B');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Top Savaşı 5 gemi sırayla · fazla gülle sıradakine · geri al · 12 saat sefer sürer · kayıp+rövanş kaldığı gemiden · amiral finali · Kaçış ada 2 · Filo yıldız + ada 2 · 24 sporcu · 390 px · ' + mod + ' · ŞİMDİ: ' + simdi.slice(0, 60));
  } finally {
    try {
      await p.evaluate((y) => { const kn = _kmAktifKonum || 'varsayilan'; ['filo', 'kacis', 'topsavasi'].forEach((t) => { localStorage.removeItem('dag_km_h3_' + t + '_' + kn); localStorage.removeItem('dag_km_h3sefer_' + t + '_' + kn); }); localStorage.removeItem('dag_km_an_kapali'); if (y) { _kmListe = JSON.parse(y); kmOyunListeDegisti && kmOyunListeDegisti(); } }, yedek);
    } catch (e) {}
    await ctx.close();
  }
}
