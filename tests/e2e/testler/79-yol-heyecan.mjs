// ⚔️ Yol oyunları heyecanı — Hazine Adası (2026-10-29, v340; kullanıcı: "Kale'deki heyecan seviyesi diğer oyunlara da gelsin,
// görsellerini değiştirelim" — taslaktan A · Çizgi film seçildi, önce Hazine). Tatlı: yeni deniz görünümü, kovalayan/kapı yok.
// Heyecanlı: kayalık geçit sarısız seride sporcuyu durdurur, 9+ ile geçer; herkes atınca korsan gemisi yürür, önünden geçtiği
// sporcuyu geri iter; geri al hepsini geri yükler. Korkutucu: gece, 3 geçit. Ayar, ilerleme ve kovalayan sonunda eski haline döner.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

const SP = process.env.E2E_FOTO_DIZIN || '';
export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => ({ ayar: localStorage.getItem('dag_km_oyun_ayar'), hy: localStorage.getItem('dag_km_hy_hazine_' + (_kmAktifKonum || 'varsayilan')), fr: _kmOyunRosterCache.map((s) => [s.g, s.ad, kmOyunDurumAl(s.g, s.ad).frac]) }));
    const n = await p.evaluate(() => { _kmOyunRosterCache.forEach((s) => { const sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (sp) sp.devamModu = true; }); kmOyunTemaSec('hazine'); return _kmOyunRosterCache.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).length; });
    dogrula(n >= 2, 'testte kaydı olan en az 2 sporcu gerekli');
    const ayar = (m) => p.evaluate((m) => kmOyunAyarKaydet({ mod: 'ozel', ozel: { yolMod: m } }), m);
    const fracYaz = (l) => p.evaluate((l) => { _kmOyunRosterCache.forEach((s, i) => { const f = l[i] != null ? l[i] : 0.9; s.frac = f; kmOyunDurumAl(s.g, s.ad).frac = f; }); kmOyunDurumKaydet(); kmOyunResyncAktif(); }, l);
    const seri = (oklar) => p.evaluate(async (oklar) => {
      for (let k = 0; k < _kmOyunRosterCache.length; k++) { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      const s = _kmOyunRosterCache[_kmOyunAktifIndex];
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      return { ad: s.ad, frac: s.frac };
    }, oklar);
    const hy = () => p.evaluate(() => JSON.parse(localStorage.getItem('dag_km_hy_hazine_' + (_kmAktifKonum || 'varsayilan')) || 'null'));

    // satır + Tatlı: deniz var, kovalayan/kapı yok
    dogrula(await p.evaluate(() => { kmOyunAyarAc(); const v = /Yol oyunları heyecanı/.test(document.getElementById('km-oyun-ayar-modal').textContent); kmOyunAyarKapat(); return v; }), 'Oyun Ayarları\'nda yol heyecanı satırı yok');
    await ayar(1);
    await p.waitForFunction(() => !!document.getElementById('hy-deniz'), null, { timeout: 20000 });
    esit(await p.evaluate(() => document.querySelectorAll('#hy-kapilar .hy-kapi, #hy-kov-g').length), 0, 'Tatlı: kapı/kovalayan olmamalı');

    // ⚔️ Heyecanlı: 2 geçit + gemi + HUD
    await ayar(2); await p.waitForTimeout(300);
    esit(await p.evaluate(() => document.querySelectorAll('#hy-kapilar .hy-kapi').length), 2, 'Heyecanlı: 2 kayalık geçit');
    dogrula(await p.evaluate(() => !!document.getElementById('hy-kov-g') && /Heyecanlı/.test(document.getElementById('hy-hud').textContent)), 'Heyecanlı: gemi/HUD yok');
    // geçit: kapının hemen önündeki sporcu sarısız seriyle geçemez, 9 ile geçer
    await p.evaluate(() => localStorage.removeItem('dag_km_hy_hazine_' + (_kmAktifKonum || 'varsayilan')));
    await fracYaz([0.33, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6]);
    await p.evaluate(() => { _kmOyunAktifIndex = 0; hyCiz('hazine'); });
    const balon = p.evaluate(async () => { for (let k = 0; k < 60; k++) { const b = document.querySelector('#hy-balonlar .hy-balon'); if (b) return b.textContent; await new Promise((r) => setTimeout(r, 100)); } return ''; });
    let r1 = await seri(['8', '8', '8']);
    dogrula(r1.frac < 0.35, 'sarısız seri geçitten geçti: ' + r1.frac);
    dogrula(/sarı|9/i.test(await balon), 'papağan konuşmadı');
    if (SP) await p.screenshot({ path: SP + '/hy-hazine-2.png' });
    await p.waitForTimeout(800);
    // tur tamamlanmadan önce (sıradaki herkes) — ilk sporcuya geri dön: 9'lu seri geçer
    await p.evaluate(() => { _kmOyunAktifIndex = 0; let st = JSON.parse(localStorage.getItem('dag_km_hy_hazine_' + (_kmAktifKonum || 'varsayilan'))); st.atanlar = []; localStorage.setItem('dag_km_hy_hazine_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); });
    const r2 = await seri(['9', '6', '6']);
    dogrula(r2.frac > 0.35, '9\'lu seri geçitten geçmedi: ' + r2.frac);
    await p.waitForTimeout(1200);

    // kovalayan: herkes atınca yürür, önünden geçtiği sporcuyu geri iter; geri al geri yükler
    await p.evaluate(() => { let k = 'dag_km_hy_hazine_' + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); st.kov = 0.1; st.atanlar = _kmOyunRosterCache.slice(1).map((s) => s.g + '|' + s.ad); localStorage.setItem(k, JSON.stringify(st)); });
    await fracYaz([0.6, 0.13]);
    await p.evaluate(() => { _kmOyunAktifIndex = 0; hyGuncelle('hazine'); });
    const kurbanAd = await p.evaluate(() => _kmOyunRosterCache[1].ad);
    await seri(['M', 'M', 'M']);
    await p.waitForTimeout(2600);
    let st = await hy(), kurbanFrac = await p.evaluate((ad) => _kmOyunRosterCache.find((s) => s.ad === ad).frac, kurbanAd);
    dogrula(kurbanFrac < 0.13 - 0.05, 'kovalayan yakaladığını geri itmedi: ' + kurbanFrac);
    esit(st.atanlar.length, 0, 'tur bitince atanlar sıfırlanmalı'); esit(st.tur, 1, 'tur sayısı');
    if (SP) await p.screenshot({ path: SP + '/hy-hazine-yakala.png' });
    await p.evaluate(() => kmOyunSonGirisiGeriAl()); await p.waitForTimeout(400);
    const onay = await p.evaluate(() => { const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); return true; } return false; });
    if (onay) await p.waitForTimeout(400);
    kurbanFrac = await p.evaluate((ad) => _kmOyunRosterCache.find((s) => s.ad === ad).frac, kurbanAd); st = await hy();
    dogrula(Math.abs(kurbanFrac - 0.13) < 1e-6 && Math.abs(st.kov - 0.1) < 1e-6, 'geri al kovalayanı ve geri itmeyi geri yüklemedi: ' + kurbanFrac + ' / ' + st.kov);

    // 😈 Korkutucu: gece, 3 geçit
    await ayar(3); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => document.getElementById('km-oyun-svg-hazine').classList.contains('hy-gece')), 'Korkutucu: gece yok');
    esit(await p.evaluate(() => document.querySelectorAll('#hy-kapilar .hy-kapi').length), 3, 'Korkutucu: 3 geçit');
    if (SP) await p.screenshot({ path: SP + '/hy-hazine-3.png' });
    await ayar(1); await p.waitForTimeout(200);
    esit(await p.evaluate(() => document.querySelectorAll('#hy-kapilar .hy-kapi').length), 0, 'Tatlı\'ya dönünce geçit kalmamalı');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yatay taşma');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Tatlı: deniz görünümü · Heyecanlı: geçit 9+ ister + papağan, korsan gemisi yakalar/geri iter, geri al · Korkutucu: gece, 3 geçit');
  } finally {
    if (yedek) await p.evaluate((y) => { const k = 'dag_km_hy_hazine_' + (_kmAktifKonum || 'varsayilan'); if (y.ayar) localStorage.setItem('dag_km_oyun_ayar', y.ayar); else localStorage.removeItem('dag_km_oyun_ayar'); if (y.hy) localStorage.setItem(k, y.hy); else localStorage.removeItem(k); y.fr.forEach(([g, ad, f]) => { kmOyunDurumAl(g, ad).frac = f; }); kmOyunDurumKaydet(); }, yedek).catch(() => {});
    await ctx.close();
  }
}
