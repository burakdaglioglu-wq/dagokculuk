// Karışık Sınıf › Oyunlar › 🏝️ Hazine Adası 3B (2026-11-16, v420): ⛵ Filo Yarışı · 🏴‍☠️ Korsandan Kaçış · 💣 Top Savaşı — üç ayrı oyun, aynı 3B sahne.
// Her oyun: seçicide görünür, gerçek seri kayda yazılır, herkes atmadan sonuç yok (adaya varan / batan tur sonunda), finalde herkesin adı,
// geri al, yeni oyun, 12 saat kuralı; 18 sporcuda 3B sahne (E2E_3B=1 ise zorla 3B, ekran görüntüsü) ve 390 px'te yana taşma yok.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  const O = 'tests/e2e/_cikti/128-';
  let yedek = null;
  try {
    if (process.env.E2E_3B) await ctx.addInitScript(() => { window.__h3Zorla3B = true; });
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const tum = await p.evaluate(() => { const t = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) t.push({ g, ad }); })); window.__tum = t; return t.length; });
    dogrula(tum >= 9, 'en az 9 sporcu gerekli');
    const kur = await p.evaluate(() => ({ ad: ['filo', 'kacis', 'topsavasi'].map((t) => KM_OYUN_TEMALAR[t] && KM_OYUN_TEMALAR[t].ad).join('|'), sifir: ['filo', 'kacis', 'topsavasi'].every((t) => KM_OYUN_SIFIR_ONEK.includes('dag_km_h3_' + t + '_')), secici: ['Filo Yarışı', 'Korsandan Kaçış', 'Top Savaşı'].every((a) => kmOyunSeciciKartlari().includes(a)) }));
    esit(kur.ad, 'Filo Yarışı|Korsandan Kaçış|Top Savaşı', 'üç tema'); dogrula(kur.sifir, '12 saat kuralı'); dogrula(kur.secici, 'seçicide üç kart');
    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      // günlük seri sınırı onayı gecikmeli açılabilir: kilit bitse de birkaç tur pencereye bak
      for (let k = 0, bos = 0; k < 250 && bos < 4; k++) { await new Promise((r) => setTimeout(r, 100)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); bos = 0; } else if (!_kmOyunKilit) bos++; else bos = 0; }
      return { key: s.g + '|' + s.ad, once, sonra: (sp.seriler || []).length, st: JSON.parse(JSON.stringify(h3Durum(_kmOyunAktifTema))) };
    }, [oklar, hedef]);
    const ac = async (tid, n) => {
      await p.evaluate(([tid, n]) => { _kmListe = window.__tum.slice(0, n); localStorage.removeItem('dag_km_h3_' + tid + '_' + (_kmAktifKonum || 'varsayilan')); kmOyunListeDegisti && kmOyunListeDegisti(); kmOyunTemaSec(tid); }, [tid, n]);
      await p.waitForSelector('#h3-hud #h3-serit .h3-k', { timeout: 30000 }); await p.waitForTimeout(800);
    };
    const tumunuAt = async (oklar) => { const idx = await p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0)); let r = null; for (const j of idx) r = await seri(oklar, j); return r; };
    const sonuclar = [];
    for (const tid of ['filo', 'kacis', 'topsavasi']) {
      await ac(tid, 9);
      esit(await p.locator('#km-oyun-rightpanel').isVisible().catch(() => false), false, tid + ': puan sıralaması görünmemeli');
      const r1 = await seri(['X', '10', '10'], 0);
      esit(r1.sonra, r1.once + 1, tid + ': seri kayda yazılmadı'); esit(r1.st.atan[r1.key], 1, tid + ': atan'); esit(r1.st.faz, 'oyun', tid + ': herkes atmadan bitmemeli');
      const ga = await p.evaluate((tid) => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); return h3Durum(tid).atan; }, tid);
      esit(Object.keys(ga).length, 0, tid + ': geri al');
      let son = null, tur = 0;
      while (tur < 8) { tur++; son = await tumunuAt(['X', '10', '10']); if (son.st.faz === 'son') break; }
      esit(son.st.faz, 'son', tid + ': oyun bitmeli (' + tur + ' tur)');
      esit((son.st.finalAdlar || []).length, 9, tid + ': finalde herkesin adı');
      await p.waitForSelector('#h3-son', { timeout: 10000 });
      const yazi = await p.locator('#h3-son').innerText();
      dogrula(/HAZİNEYİ BULANLAR|ADAYA VARDINIZ|BATTI/i.test(yazi), tid + ': sonuç başlığı ' + yazi.slice(0, 50));
      sonuclar.push(tid + ' ' + tur + ' tur');
      await p.locator('#h3-yeni-son').click(); await p.waitForTimeout(500);
      esit(await p.evaluate((tid) => h3Durum(tid).faz, tid), 'oyun', tid + ': yeni oyun');
    }
    // saf kurallar
    const saf = await p.evaluate(() => ({ h: [10, 9, 8, 7, 6, 5, 4, 3, 2, 0].map(_h3Ic.topHasar).join(','), f: _h3Ic.filoAdim([10, 10, 10]).toFixed(3) }));
    esit(saf.h, '6,6,4,4,2,2,1,1,0,0', 'gülle hasarı');
    // 12 saat
    // açık oyun sıfırlamadan hemen sonra boş bir kayıt kurabilir: eski ilerlemenin (tur 5) gittiğine bakılır
    const sil = await p.evaluate(() => { const k = 'dag_km_h3_topsavasi_' + (_kmAktifKonum || 'varsayilan'), st = h3Durum('topsavasi'); st.tur = 5; localStorage.setItem(k, JSON.stringify(st)); localStorage.setItem('dag_km_oyun_son_' + (_kmAktifKonum || 'varsayilan'), String(Date.now() - 13 * 3600000)); kmOyunBayatSifirla(); const h = localStorage.getItem(k); return !h || JSON.parse(h).tur === 1 ? 'silindi' : 'kaldi'; });
    esit(sil, 'silindi', '12 saat sonra sıfırlanmalı');
    // 18 sporcu: oyun ortası ekranlar
    for (const tid of ['filo', 'kacis', 'topsavasi']) {
      await ac(tid, 18);
      const idx = await p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0));
      for (const j of idx.slice(0, 11)) await seri([['X', '10', '9'], ['8', '7', '9'], ['6', '7', '5'], ['10', '9', '9']][j % 4], j);
      await p.waitForTimeout(1500);
      await p.screenshot({ path: O + tid + '.png' });
      dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tid + ': 1280 yana taşma');
    }
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(1200);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yana taşıyor');
    await p.screenshot({ path: O + 'telefon.png' });
    const mod = await p.evaluate(() => document.querySelector('.h3-sahne').classList.contains('duz') ? '2B' : '3B');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('üç oyun baştan sona: ' + sonuclar.join(' · ') + ' · geri al · yeni oyun · 12 saat · 18 sporcu · 390 px · görünüm ' + mod);
  } finally {
    try {
      await p.evaluate((y) => { ['filo', 'kacis', 'topsavasi'].forEach((t) => localStorage.removeItem('dag_km_h3_' + t + '_' + (_kmAktifKonum || 'varsayilan'))); if (y) { _kmListe = JSON.parse(y); kmOyunListeDegisti && kmOyunListeDegisti(); } }, yedek);
    } catch (e) {}
    await ctx.close();
  }
}
