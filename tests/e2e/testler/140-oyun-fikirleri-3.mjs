// 🎮 Oyun fikirleri 3. dalga (2026-11-18, v434) — gizli üç oyun (11 Kasım'da sınıfta beğenilmedi, KM_OYUN_GIZLI):
//   4 🪨 Uyuyan Dev · Taş Yol (balık hedefi nehirde 12 taşlık yol, taşta koyanın adı, kapınca taş batar; kural aynı)
//   5 ✂️ Fitil Hattı · İmha kabloları (çark yok: takımdan renge atan o kabloyu keser, 3 kablo = bomba söner +15 sn)
//   8 🗿 Dev Tahta · Son karede dev (ilk takım bitişe varınca Dev Taş uyanır, her takımın adımı canından düşer)
// 24 çocukta ekran görüntüleri.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const O = 'tests/e2e/_cikti/140-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const tum = await p.evaluate(() => { const t = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) t.push({ g, ad }); })); window.__tum = t; localStorage.setItem('dag_km_an_kapali', '1'); return t.length; });
    const n24 = Math.min(24, tum);
    const ac = (tema, n) => p.evaluate(([tema, n]) => { _kmListe = window.__tum.slice(0, n); const kn = _kmAktifKonum || 'varsayilan'; ['dag_km_timsah_', 'dag_km_bomba_', 'dag_km_tahta_'].forEach((a) => localStorage.removeItem(a + kn)); kmOyunListeDegisti && kmOyunListeDegisti(); kmOyunTemaSec(tema); }, [tema, n]);
    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      _kmOyunAktifIndex = hedef; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0, bos = 0; k < 400 && bos < 4; k++) { await new Promise((r) => setTimeout(r, 100)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); bos = 0; } else if (!_kmOyunKilit) bos++; else bos = 0;
        const g = document.querySelector('#tm-gorev-tamam, #bm-gorev-tamam, #tb-gorev-tamam'); if (g && g.offsetParent) { g.click(); } }
    }, [oklar, hedef]);
    const idx = () => p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0));

    // ── 4 🪨 Taş yol
    await ac('timsah', n24); await p.waitForSelector('#tm-oyun .tm-timsah', { timeout: 30000 }); await p.waitForTimeout(600);
    esit(await p.locator('#tm-tasyol .tm-tas').count(), 12, '12 taşlık yol');
    let ix = await idx();
    for (const j of ix.slice(0, 8)) await seri(['X', '10', '9'], j);
    const ty = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('dag_km_timsah_' + (_kmAktifKonum || 'varsayilan'))); return { taslar: s.taslar || [], dolu: document.querySelectorAll('#tm-tasyol .tm-tas.dolu').length, adlar: [...document.querySelectorAll('#tm-tasyol .tm-tas.dolu b')].map((b) => b.textContent) }; });
    dogrula(ty.taslar.length >= 3 && ty.dolu === ty.taslar.length, 'taşlar kondu: ' + ty.taslar.length + '/' + ty.dolu);
    dogrula(ty.adlar.filter(Boolean).length >= 2, 'taşlarda adlar: ' + ty.adlar.join(','));
    await p.screenshot({ path: O + 'tasyol-24.png' });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(600);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'taş yol 390 px taşma'); await p.screenshot({ path: O + 'tasyol-telefon.png' });
    await p.setViewportSize({ width: 1366, height: 768 });

    // ── 5 ✂️ İmha kabloları: saf + oyunda
    await ac('bomba', n24); await p.waitForSelector('#bm-oyun .bm-bomba', { timeout: 30000 }); await p.waitForTimeout(600);
    const kb = await p.evaluate(() => { const I = _bmIc, st = {}; const a = I.kabloKes(st, 0, [9, 7, 3], 'ELA'); const b = I.kabloKes(st, 0, [8, 2, 1], 'MERT'); const c = I.kabloKes(st, 0, [6, 6, 5], 'SU'); return { a: a.kesilen.join(','), b: b.kesilen.join(','), c: c.kesilen.join(',') + '/' + c.sondu, kalan: JSON.stringify(st.kablo[0]), sondu: st.sondu[0] }; });
    esit(kb.a, 'sari,kirmizi', '9 ve 7 sarı + kırmızı keser'); esit(kb.b, '', 'kesik kablo ikinci kez kesilmez'); esit(kb.c, 'mavi/true', 'mavi kesilince bomba söner'); esit(kb.kalan, '{}', 'yeni kablolar'); esit(kb.sondu, 1, 'sönme sayısı');
    ix = await idx(); await seri(['10', '8', '6'], ix[0]);
    const bs = await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('dag_km_bomba_' + (_kmAktifKonum || 'varsayilan'))); return { sondu: (s.sondu || []).reduce((a, b) => a + (b || 0), 0), kablolar: document.querySelectorAll('.bm-kablo span').length }; });
    esit(bs.sondu, 1, 'tek seride üç renk: bomba söndü'); dogrula(bs.kablolar >= 6, 'takım kartlarında kablolar');
    await seri(['9', '3', 'M'], ix[1]);
    await p.screenshot({ path: O + 'kablo-24.png' });

    // ── 8 🗿 Son karede dev: saf + oyunda (bitişe yakın konumdan)
    await ac('tahta', 8); await p.waitForSelector('#tb-tahta .tb-kare', { timeout: 30000 }); await p.waitForTimeout(600);
    const dv = await p.evaluate(() => { const I = _tbIc, st = { dev: { can: 10, max: 10, yikildi: false } }; const a = I.devVur(st, 4), b = I.devVur(st, 9); return { a, b, can: st.dev.can, y: st.dev.yikildi, can8: I.devCan(2) }; });
    esit(dv.a + '/' + dv.b + '/' + dv.can + '/' + dv.y, '4/6/0/true', 'dev canı düşer, fazlası boşa'); esit(dv.can8, 8, 'en az 8 can');
    ix = await idx(); await seri(['3', '2', '1'], ix[0]);
    await p.evaluate(() => { const kn = _kmAktifKonum || 'varsayilan', s = JSON.parse(localStorage.getItem('dag_km_tahta_' + kn)); s.poz = s.poz.map((x, i) => (i === 0 ? s.L - 1 : Math.max(0, s.L - 8))); localStorage.setItem('dag_km_tahta_' + kn, JSON.stringify(s)); tbSahneKur && tbSahneKur(); });
    await p.waitForTimeout(500);
    let st; const takim0 = await p.evaluate(() => { const kn = _kmAktifKonum || 'varsayilan', s = JSON.parse(localStorage.getItem('dag_km_tahta_' + kn)); return _kmOyunRosterCache.map((x, j) => s.takim[x.g + '|' + x.ad] === 0 && !(s.atan[x.g + '|' + x.ad]) ? j : -1).filter((j) => j >= 0); });
    await seri(['X', '10', '9'], takim0[0]);
    st = await p.evaluate(() => JSON.parse(localStorage.getItem('dag_km_tahta_' + (_kmAktifKonum || 'varsayilan'))));
    dogrula(st.dev && st.dev.max >= 8 && !st.dev.yikildi, 'bitişe varınca dev uyandı: ' + JSON.stringify(st.dev));
    dogrula(await p.locator('#tb-dev').isVisible(), 'dev çubuğu görünür');
    const diger = await p.evaluate(() => { const kn = _kmAktifKonum || 'varsayilan', s = JSON.parse(localStorage.getItem('dag_km_tahta_' + kn)); return _kmOyunRosterCache.map((x, j) => s.takim[x.g + '|' + x.ad] !== 0 && !(s.atan[x.g + '|' + x.ad]) ? j : -1).filter((j) => j >= 0); });
    const once = st.dev.can; await seri(['X', '10', '9'], diger[0]);
    st = await p.evaluate(() => JSON.parse(localStorage.getItem('dag_km_tahta_' + (_kmAktifKonum || 'varsayilan'))));
    dogrula(st.dev.can < once, 'geride kalan takımın oku da devi vurdu: ' + once + ' → ' + st.dev.can);
    await p.screenshot({ path: O + 'dev-8.png' });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🪨 taş yol (12 taş, adlar, 390 px) · ✂️ kablolar (kes, sön, yenile) · 🗿 dev taş (uyanır, her takım vurur) · 24 çocuk');
  } finally {
    try { await p.evaluate((y) => { const kn = _kmAktifKonum || 'varsayilan'; ['dag_km_timsah_', 'dag_km_bomba_', 'dag_km_tahta_'].forEach((a) => localStorage.removeItem(a + kn)); localStorage.removeItem('dag_km_an_kapali'); if (y) { _kmListe = JSON.parse(y); kmOyunListeDegisti && kmOyunListeDegisti(); } }, yedek); } catch (e) {}
    await ctx.close();
  }
}
