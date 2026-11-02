// 2026-11-02 kullanıcı: "sporcuların bölümü çok basit" → Kale'de okçu dokunuşları (Masal Kalesi v365'in üstüne):
// sıradaki çocuğa ışık huzmesi + "ATIYOR" etiketi; bu dalgada atanın yanında küçük meşale (yeni dalgada söner);
// düşman kapıya bir adım kala okçular titrer. Kale durumu geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  const K = 'dag_km_kale_';
  let yedek;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate((a) => localStorage.getItem(a + (_kmAktifKonum || 'varsayilan')), K);
    const n = await p.evaluate((a) => {
      localStorage.removeItem(a + (_kmAktifKonum || 'varsayilan'));
      _kmOyunRosterCache.forEach((s) => { const sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (sp) sp.devamModu = true; });
      kmOyunTemaSec('kale');
      return _kmOyunRosterCache.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).length;
    }, K);
    dogrula(n >= 2, 'testte kaydı olan en az 2 sporcu gerekli');
    await p.waitForFunction(() => !!document.getElementById('kale-svg'), null, { timeout: 30000 });
    await p.waitForTimeout(600);
    const gor = () => p.evaluate(() => {
      const ai = _kmOyunAktifIndex, c = document.getElementById('kale-c' + ai);
      const op = (sel) => c && c.querySelector(sel) ? +getComputedStyle(c.querySelector(sel)).opacity : 0;
      return { ai, isik: op('.kale-isik'), et: op('.kale-sira-et'), digerEt: [...document.querySelectorAll('.kale-cocuk:not(.kale-aktif) .kale-sira-et')].some((e) => +getComputedStyle(e).opacity > 0), atti: [...document.querySelectorAll('.kale-cocuk.kale-atti')].map((e) => +e.id.slice(6)) };
    });
    let g = await gor();
    dogrula(g.isik > 0 && g.et > 0 && !g.digerEt, 'sıradaki çocukta ışık/ATIYOR yok ya da başkasında da var: ' + JSON.stringify(g));
    dogrula(!g.atti.length, 'dalga başında meşale yanmamalı');
    // kaydı olan sıradaki sporcu bir seri atar → onun yanında meşale; ATIYOR sıradakine geçer
    const atan = await p.evaluate(async () => {
      for (let k = 0; k < _kmOyunRosterCache.length; k++) { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      const i = _kmOyunAktifIndex;
      _kmOyunSeriGirisleri = ['3', '2', '1']; _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      return i;
    });
    await p.waitForTimeout(1500);
    g = await gor();
    dogrula(g.atti.indexOf(atan) >= 0, 'seri atan çocuğun yanında meşale yanmadı: ' + JSON.stringify(g));
    dogrula(g.ai !== atan && g.et > 0, 'ATIYOR sıradaki çocuğa geçmedi');
    // tehlike: öndeki düşmanı kapıya bir adım kalaya getir → bir seri sonra okçular titrer
    await p.evaluate((a) => { const k = a + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); st.dusmanlar.forEach((d, i) => { d.x = i ? 980 : Math.round(360 + st.adim * 1.6); d.can = d.max = 400; d.tip = 'goblin'; delete d.ofke; }); localStorage.setItem(k, JSON.stringify(st)); kmOyunSahneKurKale(); }, K);
    const titre = p.evaluate(async () => { for (let k = 0; k < 500; k++) { if (document.querySelector('#kale-cocuklar .kale-ci.kale-titre')) return true; await new Promise((r) => setTimeout(r, 50)); } return false; });
    await p.evaluate(async () => {
      for (let k = 0; k < _kmOyunRosterCache.length; k++) { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      _kmOyunSeriGirisleri = ['1', '1', '1']; _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
    });
    dogrula(await titre, 'düşman kapıya yaklaşınca okçular titremedi');
    dogrula(!hatalar.length, 'sayfa hatası: ' + hatalar.join(' | '));
    log('ATIYOR + ışık yalnız sıradakinde · atanın yanında meşale · ATIYOR sıradakine geçer · tehlikede titreme');
  } finally {
    await p.evaluate(([a, y]) => { const k = a + (_kmAktifKonum || 'varsayilan'); if (y === null) localStorage.setItem(k, '{}'); else localStorage.setItem(k, y); }, [K, yedek ?? null]).catch(() => {});
    await ctx.close();
  }
}
