// Karışık Sınıf › Oyunlar › 🪢 Dev Halat Çekme (2026-10-28, 29 Ekim turnuvası).
// Kullanıcı kuralı: skorlar tek tek girilir; raundun kazananı ANCAK herkes atınca belli olur (önce atanın avantajı yok).
// Takımlar dengeli kurulur; seri halatı oynatır ama raunt herkes atmadan bitmez; herkes atınca önde olan raundu alır;
// takım puanı mevcuda bölünür; 2 raunt alan maçı kazanır + rozet; ⏭️ ile atanlarla bitirme; geri al; çocuğa dokununca sıra.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    // kaydı olmayan (yerel test verisi) sporcuları listeden çıkar ki raunt tamamlanabilsin
    const n = await p.evaluate(() => {
      localStorage.removeItem('dag_km_halat_' + (_kmAktifKonum || 'varsayilan'));
      _kmListe = _kmListe.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).slice(0, 5); kmOyunRosterYenile();
      _kmOyunRosterCache.forEach((s) => { turnuvaDB[s.g][s.ad].devamModu = true; });
      kmOyunTemaSec('halat');
      return _kmOyunRosterCache.length;
    });
    dogrula(n >= 3, 'testte kaydı olan en az 3 sporcu gerekli (gelen ' + n + ')');
    await p.waitForFunction(() => !!document.getElementById('halat-svg'), null, { timeout: 30000 });
    const a = 'dag_km_halat_';
    const st0 = await p.evaluate((a) => JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))), a);
    const tk = Object.values(st0.takim);
    esit(tk.length, n, 'herkes bir takıma girmeli');
    dogrula(Math.abs(tk.filter((t) => t === 0).length - tk.filter((t) => t === 1).length) <= 1, 'takımlar dengeli olmalı');
    // belirli bir sporcuya belirli seri
    const seri = (i, oklar) => p.evaluate(async ([i, oklar, a]) => {
      _kmOyunAktifIndex = i; const s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      return { once, sonra: (sp.seriler || []).length, st: JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))), alt: document.getElementById('halat-alt').textContent };
    }, [i, oklar, a]);
    const takimi = (i) => p.evaluate(([i, a]) => { const s = _kmOyunRosterCache[i], st = JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))); return st.takim[s.g + '|' + s.ad]; }, [i, a]);
    // 1. raunt: AL üyeleri 10'lar, AK üyeleri 1'ler — son atan hariç herkes atınca raunt BİTMEMELİ
    const T = []; for (let i = 0; i < n; i++) T.push(await takimi(i));
    let r;
    for (let i = 0; i < n - 1; i++) {
      r = await seri(i, T[i] === 0 ? ['10', '10', '10'] : ['1', '1', '1']);
      esit(r.sonra, r.once + 1, 'seri gerçek kayda yazılmadı');
      esit(r.st.mac.skor.join('-'), '0-0', 'raunt herkes atmadan bitti (önce atan avantajı!)');
    }
    dogrula(/okunda/.test(r.alt), 'son atıştan önce "her şey X\'in okunda" gösterilmedi');
    r = await seri(n - 1, T[n - 1] === 0 ? ['10', '10', '10'] : ['1', '1', '1']);
    esit(r.st.mac.skor.join('-'), '1-0', 'herkes atınca AL raundu almalı');
    esit(r.st.raunt, 2, '2. raunda geçilmeli');
    esit(Object.keys(r.st.atan).length, 0, 'yeni rauntta atanlar sıfırlanmalı');
    await p.waitForTimeout(1500);
    dogrula(await p.evaluate(() => /ÇEKTİ/.test(document.getElementById('halat-dev').textContent)), 'raunt kazanma gösterisi yok');
    await p.waitForTimeout(3500);
    // geri al → raunt sonucu geri döner
    const geri = await p.evaluate((a) => { const once = _kmOyunSonGiris && _kmOyunSonGiris.halat; window.confirm = () => true; kmOyunSonGirisiGeriAl(); const st = JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))); return { var: !!once, skor: st.mac.skor.join('-'), raunt: st.raunt, atan: Object.keys(st.atan).length }; }, a);
    dogrula(geri.var, 'geri al için Halat kopyası alınmadı'); esit(geri.skor, '0-0', 'geri al raunt skorunu geri almadı'); esit(geri.raunt, 1, 'geri al raundu geri almadı'); esit(geri.atan, n - 1, 'geri al atanları geri almadı');
    await p.waitForTimeout(800);
    r = await seri(n - 1, T[n - 1] === 0 ? ['10', '10', '10'] : ['1', '1', '1']);
    esit(r.st.mac.skor.join('-'), '1-0', 'geri al sonrası yeniden atınca raunt');
    await p.waitForTimeout(5000);
    // 2. raunt: ⏭️ ile yalnız ilk sporcu atmışken bitir → atanlarla değerlendirilir; AL yine kazanırsa maç biter + rozet
    const ilkAL = T.indexOf(0);
    await seri(ilkAL, ['10', '10', '10']);
    await p.waitForTimeout(1200);
    await p.evaluate(() => { document.getElementById('halat-bitir-btn').click(); });
    await p.waitForTimeout(300);
    await p.evaluate(() => { const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') onayOnayla(); });
    await p.waitForTimeout(500);
    const st2 = await p.evaluate((a) => JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))), a);
    esit(st2.galip.length, 1, '2 raunt alan AL maçı kazanmalı');
    esit(st2.mac.no, 2, 'yeni maç başlamalı');
    const rozet = await p.evaluate(([i]) => { const s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad]; return sp.oyun && sp.oyun.halat && sp.oyun.halat.mac; }, [ilkAL]);
    dogrula(rozet >= 1, 'maç rozeti yazılmadı');
    await p.waitForTimeout(4500);
    dogrula(await p.evaluate(() => /KAZANDI/.test(document.getElementById('halat-dev').textContent)), 'maç kazanma töreni yok');
    await p.waitForTimeout(4800);
    // 👆 çocuğa dokununca sıra
    await p.evaluate(() => { _kmOyunAktifIndex = 0; kmOyunSahneKurHalat(); }); await p.waitForTimeout(700);
    // skor paneli üstünü örtmeyen ilk çocuğa (0 hariç) gerçek tıklama
    const hedefJ = await p.evaluate(() => { for (let j = 1; j < _kmOyunRosterCache.length; j++) { const g = document.querySelector('#halat-c' + j + ' .halat-govde'); if (!g) continue; const b = g.getBoundingClientRect(), e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); if (e && e.closest('#halat-c' + j)) return j; } return -1; });
    const ust = await p.evaluate(() => { const g = document.querySelector('#halat-c1 .halat-govde'); if (!g) return 'c1 yok'; const b = g.getBoundingClientRect(), e = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2); return JSON.stringify({ b: [Math.round(b.x), Math.round(b.y), Math.round(b.width)], e: e ? e.tagName + '#' + e.id + '.' + (e.className.baseVal != null ? e.className.baseVal : e.className) + ' < ' + ((e.closest('[id]') || {}).id) : null, vw: innerWidth, vh: innerHeight }); });
    dogrula(hedefJ > 0, 'tıklanabilir çocuk bulunamadı: ' + ust);
    const kb = await p.locator('#halat-c' + hedefJ + ' .halat-govde').boundingBox(); await p.mouse.click(kb.x + kb.width / 2, kb.y + kb.height / 2); await p.waitForTimeout(300);
    esit(await p.evaluate(() => _kmOyunAktifIndex), hedefJ, 'karaktere tıklayınca sıra o sporcuya geçmedi');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px genişlikte yatay taşma');
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
    log(`${n} sporcu · raunt herkes atmadan bitmedi · AL 2-0 maç · ⏭️ atanlarla bitirme · geri al`);
  } finally { await ctx.close(); }
}
