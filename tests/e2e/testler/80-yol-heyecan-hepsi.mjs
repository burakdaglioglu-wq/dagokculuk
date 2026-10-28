// ⚔️ Yol oyunları heyecanı — diğer 6 oyun (2026-10-29, v341; kullanıcı Hazine'den sonra "diğer 6 oyuna da geç"). Her oyunda
// Heyecanlı'da kovalayan + HUD, kapı sayısı (Zirve/Ninja'da yok — kendi engelleri var; Pist'te her turda 2); Tatlı'da Pist ve
// Balon yeni çizgi film sahnesiyle, kovalayan yok. Pist bariyeri sarısız seride arabayı durdurur; Balon'da fırtına bandı
// herkes atınca yükselir ve önünden geçtiğini aşağı iter. Korkutucu gece. Ayar, ilerleme ve kovalayanlar sonunda geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

const SP = process.env.E2E_FOTO_DIZIN || '';
const TEMALAR = ['zirve', 'yildiz', 'pist', 'ninja', 'dag', 'balon'];
export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate((T) => ({ ayar: localStorage.getItem('dag_km_oyun_ayar'), hy: T.map((t) => [t, localStorage.getItem('dag_km_hy_' + t + '_' + (_kmAktifKonum || 'varsayilan'))]), fr: _kmOyunRosterCache.map((s) => [s.g, s.ad, kmOyunDurumAl(s.g, s.ad).frac]) }), TEMALAR);
    await p.evaluate(() => _kmOyunRosterCache.forEach((s) => { const sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (sp) sp.devamModu = true; }));
    const ayar = (m) => p.evaluate((m) => kmOyunAyarKaydet({ mod: 'ozel', ozel: { yolMod: m } }), m);
    const tema = async (t) => { await p.evaluate((t) => kmOyunTemaSec(t), t); await p.waitForTimeout(900); };
    const fracYaz = (l) => p.evaluate((l) => { _kmOyunRosterCache.forEach((s, i) => { const f = l[i] != null ? l[i] : 0.9; s.frac = f; kmOyunDurumAl(s.g, s.ad).frac = f; }); kmOyunDurumKaydet(); kmOyunResyncAktif(); }, l);
    const seri = (oklar) => p.evaluate(async (oklar) => {
      for (let k = 0; k < _kmOyunRosterCache.length; k++) { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      const s = _kmOyunRosterCache[_kmOyunAktifIndex];
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      return { ad: s.ad, frac: s.frac };
    }, oklar);
    const durum = (t) => p.evaluate((t) => { const svg = document.getElementById('km-oyun-svg-' + t); return { kov: !!(svg && svg.querySelector('#hy-kov-g')), hud: svg && svg.querySelector('#hy-hud') ? svg.querySelector('#hy-hud').textContent : '', kapi: svg ? svg.querySelectorAll('#hy-kapilar .hy-kapi').length : -1, a: !!(svg && svg.classList.contains('hy-a')), gece: !!(svg && svg.classList.contains('hy-gece')) }; }, t);

    // 🙂 Tatlı: Pist ve Balon yeni sahne, kovalayan yok
    await ayar(1);
    for (const t of ['pist', 'balon']) { await tema(t); const d = await durum(t); dogrula(d.a && !d.kov && d.kapi === 0, t + ' Tatlı: ' + JSON.stringify(d)); if (SP) await p.screenshot({ path: SP + '/hy-' + t + '-1.png' }); }

    // ⚔️ Heyecanlı: her oyunda kovalayan + doğru kapı sayısı
    await ayar(2);
    await fracYaz([0.3, 0.5, 0.2, 0.6, 0.4, 0.55, 0.45, 0.35, 0.25, 0.65]);
    for (const t of TEMALAR) {
      await tema(t);
      const d = await durum(t), tur = t === 'pist' ? await p.evaluate(() => kmOyunPistToplamTur()) : 1, beklenen = (t === 'zirve' || t === 'ninja') ? 0 : 2 * tur;
      dogrula(d.kov && /Heyecanlı/.test(d.hud), t + ': kovalayan/HUD yok ' + JSON.stringify(d));
      esit(d.kapi, beklenen, t + ': kapı sayısı');
      if (SP) await p.screenshot({ path: SP + '/hy-' + t + '-2.png' });
    }

    // 🏎️ Pist: kapının önündeki araba sarısız seride durur, sarıyla geçer
    await tema('pist');
    await p.evaluate(() => localStorage.removeItem('dag_km_hy_pist_' + (_kmAktifKonum || 'varsayilan')));
    await fracYaz([0.3, 1.5]);
    await p.evaluate(() => { _kmOyunAktifIndex = 0; hyCiz('pist'); });
    let r = await seri(['8', '8', '8']);
    dogrula(r.frac < 0.35, 'Pist: sarısız seri bariyerden geçti: ' + r.frac);
    await p.waitForTimeout(600);
    await p.evaluate(() => { _kmOyunAktifIndex = 0; const k = 'dag_km_hy_pist_' + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); st.atanlar = []; localStorage.setItem(k, JSON.stringify(st)); });
    r = await seri(['9', '8', '8']);
    dogrula(r.frac > 0.35, 'Pist: 9\'lu seri bariyerden geçmedi: ' + r.frac);
    await p.waitForTimeout(1500);

    // 🎈 Balon: fırtına bandı herkes atınca yükselir, önünden geçtiğini aşağı iter
    await tema('balon');
    await p.evaluate(() => { const k = 'dag_km_hy_balon_' + (_kmAktifKonum || 'varsayilan'); localStorage.setItem(k, JSON.stringify({ gun: bugunISO(), kov: 0.1, atanlar: _kmOyunRosterCache.slice(1).map((s) => s.g + '|' + s.ad), tur: 0 })); });
    await fracYaz([0.6, 0.13]);
    await p.evaluate(() => { _kmOyunAktifIndex = 0; hyGuncelle('balon'); });
    const kurban = await p.evaluate(() => _kmOyunRosterCache[1].ad);
    await seri(['M', 'M', 'M']); await p.waitForTimeout(2600);
    const kf = await p.evaluate((ad) => _kmOyunRosterCache.find((s) => s.ad === ad).frac, kurban);
    dogrula(kf < 0.08, 'Balon: fırtına yakaladığını aşağı itmedi: ' + kf);
    if (SP) await p.screenshot({ path: SP + '/hy-balon-yakala.png' });

    // 😈 Korkutucu: gece
    await ayar(3);
    for (const t of TEMALAR) { await tema(t); const d = await durum(t); dogrula(d.gece && /Korkutucu/.test(d.hud), t + ' Korkutucu: ' + JSON.stringify(d)); if (SP && (t === 'pist' || t === 'zirve' || t === 'balon')) await p.screenshot({ path: SP + '/hy-' + t + '-3.png' }); }
    await ayar(1);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yatay taşma');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('6 oyunda kovalayan + kapılar (Zirve/Ninja kapısız, Pist her turda) · Pist bariyeri 9+ ister · Balon fırtınası yakalar · Korkutucu gece · Tatlı yeni sahne');
  } finally {
    if (yedek) await p.evaluate((y) => { if (y.ayar) localStorage.setItem('dag_km_oyun_ayar', y.ayar); else localStorage.removeItem('dag_km_oyun_ayar'); y.hy.forEach(([t, v]) => { const k = 'dag_km_hy_' + t + '_' + (_kmAktifKonum || 'varsayilan'); if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); }); y.fr.forEach(([g, ad, f]) => { kmOyunDurumAl(g, ad).frac = f; }); kmOyunDurumKaydet(); }, yedek).catch(() => {});
    await ctx.close();
  }
}
