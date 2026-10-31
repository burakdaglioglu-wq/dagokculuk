// 2026-10-31 kullanıcı: "kale savunmasında kaleye kadar gelen düşman olduğunda bug oluşuyor" + "12 saat geçtiyse oyunlar
// otomatik sıfırlansın, yumurta hariç". (1) Son düşman kapıya varıp kale ayakta kalınca dalga boş kalmamalı: sıradaki dalga
// gelir, "KALE DAYANDI" gösterilir. (2) Eski sürümden kalan boş dalga yüklenince onarılır. (3) Son seriden 12 saat geçmişse
// Oyunlar açılırken oyun durumları silinir; yumurta (sp.oyun.yuva) ve sporcu kayıtları kalır.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    const n = await p.evaluate(() => {
      localStorage.removeItem('dag_km_kale_' + (_kmAktifKonum || 'varsayilan'));
      _kmOyunRosterCache.forEach((s) => { const sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (sp) sp.devamModu = true; });
      kmOyunTemaSec('kale');
      return _kmOyunRosterCache.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).length;
    });
    dogrula(n >= 1, 'testte kaydı olan en az 1 sporcu gerekli');
    await p.waitForFunction(() => !!document.getElementById('kale-svg'), null, { timeout: 30000 });
    const k = 'dag_km_kale_';
    // (1) tek düşman kalsın, kapının dibinde ve çok canlı → ıska serisiyle kapıya varır
    await p.evaluate((a) => {
      const key = a + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(key));
      const d = st.dusmanlar.find((x) => x.tip === 'goblin') || st.dusmanlar[0]; d.x = 361; d.can = 999; d.max = 999; d.tip = 'goblin';
      st.dusmanlar = [d]; st.can = 3; st.donma = 0; st.mermi = null; localStorage.setItem(key, JSON.stringify(st)); kmOyunSahneKurKale();
    }, k);
    await p.waitForTimeout(400);
    const r = await p.evaluate(async (a) => {
      for (let j = 0; j < _kmOyunRosterCache.length; j++) { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      const once = JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan')));
      _kmOyunSeriGirisleri = ['M', 'M', 'M']; _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let j = 0; j < 80 && _kmOyunKilit; j++) await new Promise((res) => setTimeout(res, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let j = 0; j < 80 && _kmOyunKilit; j++) await new Promise((res) => setTimeout(res, 150)); }
      return { once, st: JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))) };
    }, k);
    esit(r.st.can, 2, 'kapıya varan düşman 1 can almalı');
    esit(r.st.dalga, r.once.dalga + 1, 'kale ayakta kalınca sıradaki dalga gelmeli');
    dogrula(r.st.dusmanlar.length >= 3, 'yeni dalgada düşman olmalı (boş dalga = takılma)');
    await p.waitForTimeout(1600);
    dogrula(await p.evaluate(() => /KALE DAYANDI/.test(document.getElementById('kale-dev').textContent)), '"KALE DAYANDI" gösterilmedi');
    await p.waitForTimeout(3600);
    esit(await p.evaluate(() => document.querySelectorAll('#kale-dusmanlar .kale-dusman').length), r.st.dusmanlar.length, 'yeni dalganın düşmanları çizilmeli');
    // (2) eski sürümden kalmış boş dalga → yüklenince onarılır
    const onar = await p.evaluate((a) => {
      const key = a + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(key)); st.dusmanlar = []; localStorage.setItem(key, JSON.stringify(st));
      kaleAnlik(); const s2 = JSON.parse(localStorage.getItem(key)); return { d0: st.dalga, d1: s2.dalga, n: s2.dusmanlar.length };
    }, k);
    await p.waitForTimeout(400);
    dogrula(onar.n > 0 && onar.d1 === onar.d0 + 1, 'boş dalga onarılmadı');
    // (3) 12 saat kuralı: oyun durumları silinir, yumurta ve sporcu kalır
    const z = await p.evaluate(() => {
      const kn = _kmAktifKonum || 'varsayilan', s = _kmOyunRosterCache.find((x) => turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]), sp = turnuvaDB[s.g][s.ad];
      const yuva = sp.oyun && sp.oyun.yuva ? JSON.stringify(sp.oyun.yuva) : null, seri = (sp.seriler || []).length;
      localStorage.setItem('dag_km_oyun_' + kn, JSON.stringify({ [s.g + '|' + s.ad]: { frac: 0.5, toplamSkor: 50 } }));
      localStorage.setItem('dag_km_hy_zirve_' + kn, '{"gun":"x"}');
      localStorage.setItem('dag_km_oyun_son_' + kn, String(Date.now() - 11 * 3600e3));
      const erken = kmOyunBayatSifirla();
      localStorage.setItem('dag_km_oyun_son_' + kn, String(Date.now() - 13 * 3600e3));
      const gec = kmOyunBayatSifirla();
      return { erken, gec, kale: localStorage.getItem('dag_km_kale_' + kn), oyun: localStorage.getItem('dag_km_oyun_' + kn), hy: localStorage.getItem('dag_km_hy_zirve_' + kn),
        yuvaAyni: (sp.oyun && sp.oyun.yuva ? JSON.stringify(sp.oyun.yuva) : null) === yuva, seriAyni: (sp.seriler || []).length === seri, bellek: Object.keys(_kmOyunDurum).length };
    });
    esit(z.erken, false, '11 saatte sıfırlanmamalı');
    esit(z.gec, true, '13 saatte sıfırlanmalı');
    dogrula(z.kale === null && z.oyun === null && z.hy === null, 'oyun durumları silinmedi');
    dogrula(z.yuvaAyni && z.seriAyni, 'yumurta / seriler değişmemeli');
    esit(z.bellek, 0, 'bellekteki yol ilerlemesi temizlenmeli');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kapıdan geçen son düşman → sıradaki dalga; boş dalga onarımı; 12 saat sıfırlama (yumurta kaldı)');
  } finally {
    await p.evaluate(() => { const kn = _kmAktifKonum || 'varsayilan'; localStorage.removeItem('dag_km_kale_' + kn); localStorage.removeItem('dag_km_oyun_son_' + kn); }).catch(() => {});
    await ctx.close();
  }
}
