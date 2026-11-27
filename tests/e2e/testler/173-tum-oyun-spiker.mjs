// 🎙️ Bütün oyunlarda seri sonu spiker (2026-11-28, v477; kullanıcı: "tüm oyunlarda var mı, dedektifte yok şu an").
// Gerçek seri akışı (kmOyunIlerlet) ile: spiker cümlesi konuşulmalı ve oyunun/katmanın kendi konuşması onu KESMEMELİ.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.evaluate(() => {
      localStorage.removeItem('dag_km_oyun_sessiz');
      window.__olay = []; const t0 = performance.now();
      const ss = window.speechSynthesis;
      if (ss) { ss.speak = (u) => { window.__olay.push(['konus', Math.round(performance.now() - t0), u.text]); }; ss.cancel = () => { window.__olay.push(['kes', Math.round(performance.now() - t0)]); }; }
      const A = window.Audio; window.Audio = function (src) { const a = new A(src); a.play = () => { window.__olay.push(['cal', Math.round(performance.now() - t0), String(src)]); setTimeout(() => a.onended && a.onended(), 30); return Promise.resolve(); }; return a; };
    });
    const kur = (t) => p.evaluate((t) => {
      Object.keys(localStorage).filter((a) => a.indexOf('dag_km_gr') === 0).forEach((a) => localStorage.removeItem(a));
      const hepsi = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) hepsi.push({ g, ad }); }));
      _kmListe = hepsi.slice(0, 6); kmOyunRosterYenile(); _kmOyunRosterCache.forEach((s) => { turnuvaDB[s.g][s.ad].devamModu = true; });
      kmOyunTemaSec(t);
    }, t);
    const seri = (oklar) => p.evaluate(async (oklar) => { window.__olay = []; _kmOyunAktifIndex = 0; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet(); for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); } await new Promise((r) => setTimeout(r, 2500)); return { olay: window.__olay.slice(), ad: _kmOyunRosterCache[0].ad }; }, oklar);
    const sonuc = [];
    for (const t of ['dedektif', 'yanardag', 'hayalet', 'kale', 'ninja', 'blok']) {
      await kur(t); await p.waitForTimeout(2500);
      await p.evaluate(() => { document.querySelectorAll('.an-kural').forEach((x) => x.remove()); try { anKuralKapat(); } catch (e) { } });
      const r = await seri(['X', '10', '9']);
      const ilk = r.ad.split(/\s+/)[0].toLocaleLowerCase('tr-TR');
      // spiker: ya kayıt çaldı (/ses/an/) ya da "Ad Soyad! ..." konuşuldu
      const kayit = r.olay.find((o) => o[0] === 'cal' && /\/ses\/an\//.test(o[2]));
      const konus = r.olay.find((o) => o[0] === 'konus' && o[2].toLocaleLowerCase('tr-TR').startsWith(ilk));
      let ok = !!kayit;
      if (!ok && konus) { const kesildi = r.olay.some((o) => o[0] === 'kes' && o[1] > konus[1] && o[1] - konus[1] < 6000); ok = !kesildi; if (kesildi) sonuc.push(t + ': spiker cümlesi başka konuşmayla KESİLDİ ' + JSON.stringify(r.olay)); }
      if (!kayit && !konus) sonuc.push(t + ': spiker hiç konuşmadı ' + JSON.stringify(r.olay));
      log(t + ': ' + (kayit ? 'kayıt ' + kayit[2].replace(/^.*\/ses\//, '') : konus ? 'tarayıcı "' + konus[2] + '"' : 'YOK') + (ok ? ' ✓' : ' ✗'));
    }
    dogrula(sonuc.length === 0, sonuc.join('\n'));
    dogrula(hatalar.length === 0, 'sayfa hatası olmamalı: ' + hatalar.join(' | '));
  } finally { await ctx.close(); }
}
