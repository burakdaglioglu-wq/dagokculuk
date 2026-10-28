// Karışık Sınıf › Oyunlar › 🇹🇷 Fener Alayı (2026-10-28, 29 Ekim için).
// Tema seçiciden açılır, hedef = Cumhuriyet'in yaşı kadar fener; dock'tan girilen seri GERÇEK kayda yazılır, her ok halkaya göre
// fener yakar (ıska yakmaz), bayrak yükselir; bilgi kartı; hepsi yanınca tören + yeni tur + rozet; geri al; çocuğa dokununca sıra.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.evaluate(() => {
      localStorage.removeItem('dag_km_fener_' + (_kmAktifKonum || 'varsayilan'));
      _kmOyunRosterCache.forEach((s) => { const sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (sp) sp.devamModu = true; });
      kmOyunTemaSec('fener');
    });
    await p.waitForFunction(() => !!document.getElementById('fener-svg'), null, { timeout: 30000 });
    const hedef = await p.evaluate(() => fenerHedef);
    esit(hedef, new Date().getFullYear() - 1923, 'hedef Cumhuriyet\'in yaşı olmalı');
    esit(await p.evaluate(() => document.querySelectorAll('#fener-fenerler .fener').length), hedef, 'ekrandaki fener sayısı');
    const anahtar = 'dag_km_fener_';
    const seri = async (oklar) => p.evaluate(async ([oklar, anahtar]) => {
      for (let k = 0; k < _kmOyunRosterCache.length; k++) { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      const st = JSON.parse(localStorage.getItem(anahtar + (_kmAktifKonum || 'varsayilan')));
      return { ad: s.ad, g: s.g, once, sonra: (sp.seriler || []).length, st, i, sira: _kmOyunAktifIndex, yanik: document.querySelectorAll('#fener-fenerler .fener.yanik').length };
    }, [oklar, anahtar]);
    // 10 → 4, 7 → 3, M → 0 = 7 fener
    const r1 = await seri(['10', '7', 'M']);
    esit(r1.sonra, r1.once + 1, 'seri gerçek kayda yazılmadı');
    esit(r1.st.yanan, 7, '10+7+ıska 7 fener yakmalı');
    esit(r1.yanik, 7, 'ekranda yanan fener sayısı');
    dogrula(r1.sira !== r1.i, 'sıra sonraki sporcuya geçmedi');
    // X → 5 fener, 10. fenerde bilgi kartı (29 Ekim 1923)
    const r2 = await seri(['X', '3', '5']);
    esit(r2.st.yanan, 15, 'X(5)+3(1)+5(2) = 8 fener daha');
    await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => /1923/.test(document.getElementById('fener-dev').textContent)), '10. fenerde 1923 bilgi kartı çıkmadı');
    // geri al
    const geri = await p.evaluate((a) => { const once = _kmOyunSonGiris && _kmOyunSonGiris.fener; window.confirm = () => true; kmOyunSonGirisiGeriAl(); return { var: !!once, yanan: JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))).yanan }; }, anahtar);
    dogrula(geri.var, 'geri al için Fener kopyası alınmadı'); esit(geri.yanan, 7, 'geri al fenerleri geri almadı');
    // tamamlama: hedefe 3 kala → 10 ile tamamlanır, tören, yeni tur, rozet
    await p.evaluate(([a, h]) => { const k = a + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); st.yanan = h - 3; localStorage.setItem(k, JSON.stringify(st)); kmOyunSahneKurFener(); }, [anahtar, hedef]);
    await p.waitForTimeout(400);
    const r3 = await seri(['10', '9', '8']);
    esit(r3.st.tur, 2, 'hepsi yanınca 2. tur başlamalı');
    esit(r3.st.yanan, 4 + 4 + 3 - 3, 'taşan fenerler yeni tura geçmeli');
    esit(r3.st.tamamlayanlar.length, 1, 'tamamlayan kaydedilmedi');
    await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => /YAŞINDA/.test(document.getElementById('fener-dev').textContent)), 'Cumhuriyet töreni gösterilmedi');
    const rozet = await p.evaluate(([g, ad]) => { const sp = turnuvaDB[g][ad]; return sp.oyun && sp.oyun.fener && sp.oyun.fener.tamamladi; }, [r3.g, r3.ad]);
    dogrula(rozet >= 1, 'tamamladı rozeti yazılmadı');
    await p.waitForTimeout(9500);
    dogrula(await p.evaluate(() => /2\. tur/.test(document.getElementById('fener-ad').textContent)), 'tören sonrası 2. tur çizilmedi');
    // 👆 çocuğun karakterine dokununca sıra ona geçer
    await p.evaluate(() => { _kmOyunAktifIndex = 0; kmOyunSahneKurFener(); }); await p.waitForTimeout(600);
    const kb = await p.locator('#fener-c1 .fener-ci').boundingBox(); await p.mouse.click(kb.x + kb.width / 2, kb.y + kb.height / 2); await p.waitForTimeout(300);
    const sec = await p.evaluate(() => ({ i: _kmOyunAktifIndex, halka: document.querySelector('#fener-c1 .fener-halka').getAttribute('opacity') }));
    esit(sec.i, 1, 'karaktere tıklayınca sıra o sporcuya geçmedi'); esit(sec.halka, '1', 'seçilen çocuğun halkası yanmadı');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px genişlikte yatay taşma');
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
    log(`hedef ${hedef} fener · bilgi kartı · tören → 2. tur · rozet`);
  } finally { await ctx.close(); }
}
