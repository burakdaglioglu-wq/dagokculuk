// Karışık Sınıf › Oyunlar › 🏰 Kale Savunması (2026-10-28).
// Tema seçiciden açılır, dosya tembel yüklenir, düşmanlar çizilir (domuz yok); dock'tan girilen seri GERÇEK kayda yazılır, her ok
// en öndeki düşmana hasar verir, seriden sonra düşmanlar yaklaşır; dalga temizlenince tören + sıradaki dalga; kapıya varan can
// alır, kale düşerse aynı dalga baştan; geri al; 5 düşman tipi çizilir; çocuğa dokununca sıra; Oyun Ayarları › Kale seviyesi.
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
    dogrula(n >= 2, 'testte kaydı olan en az 2 sporcu gerekli (gelen ' + n + ')');
    await p.waitForFunction(() => !!document.getElementById('kale-svg'), null, { timeout: 30000 });
    const anahtar = 'dag_km_kale_';
    const oku = () => p.evaluate((a) => JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))), anahtar);
    const seri = async (oklar) => p.evaluate(async ([oklar, anahtar]) => {
      // yerel test verisinde kaydı olmayan sporcuyu atla (seri yazılamaz)
      for (let k = 0; k < _kmOyunRosterCache.length; k++) { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      const st0 = JSON.parse(localStorage.getItem(anahtar + (_kmAktifKonum || 'varsayilan')));
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      const st = JSON.parse(localStorage.getItem(anahtar + (_kmAktifKonum || 'varsayilan')));
      return { ad: s.ad, g: s.g, once, sonra: (sp.seriler || []).length, st0, st, sira: _kmOyunAktifIndex, i };
    }, [oklar, anahtar]);
    const st0 = await oku();
    dogrula(st0.dusmanlar.length >= 3, 'ilk dalgada en az 3 düşman olmalı');
    dogrula(st0.dusmanlar.every((d) => d.tip !== 'domuz'), 'domuz olmamalı');
    esit(await p.evaluate(() => document.querySelectorAll('#kale-dusmanlar .kale-dusman').length), st0.dusmanlar.length, 'ekrandaki düşman sayısı');
    // seri → gerçek kayıt + hasar + düşmanlar yaklaşır
    const r1 = await seri(['7', '5', 'M']);
    esit(r1.sonra, r1.once + 1, 'seri gerçek kayda yazılmadı');
    const toplam = (st) => st.dusmanlar.reduce((a, d) => a + d.can, 0);
    esit(toplam(r1.st0) - toplam(r1.st), 12, 'hasar 7+5 olmalı (ıska hasar vermez)');
    dogrula(Math.min(...r1.st.dusmanlar.map((d) => d.x)) < Math.min(...r1.st0.dusmanlar.map((d) => d.x)), 'düşmanlar yaklaşmadı');
    dogrula(r1.sira !== r1.i, 'sıra sonraki sporcuya geçmedi');
    esit(await p.evaluate(([g, ad]) => kaleSporcuHasar(g, ad), [r1.g, r1.ad]), 12, 'sporcunun hasar katkısı');
    // geri al → önceki durum
    const geri = await p.evaluate((anahtar) => { const once = _kmOyunSonGiris && _kmOyunSonGiris.kale; window.confirm = () => true; kmOyunSonGirisiGeriAl(); const st = JSON.parse(localStorage.getItem(anahtar + (_kmAktifKonum || 'varsayilan'))); return { var: !!once, can: st.dusmanlar.reduce((a, d) => a + d.can, 0), x: Math.min(...st.dusmanlar.map((d) => d.x)) }; }, anahtar);
    dogrula(geri.var, 'geri al için Kale kopyası alınmadı');
    esit(geri.can, toplam(r1.st0), 'geri al hasarı geri almadı'); esit(geri.x, Math.min(...r1.st0.dusmanlar.map((d) => d.x)), 'geri al düşman yerini geri almadı');
    // dalga temizleme: düşmanların canını küçült → bir seride temizlensin, 2. dalga gelir
    await p.evaluate((anahtar) => { const k = anahtar + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); st.dusmanlar.forEach((d) => { d.can = 3; d.max = 3; }); localStorage.setItem(k, JSON.stringify(st)); kmOyunSahneKurKale(); }, anahtar);
    await p.waitForTimeout(400);
    const r2 = await seri(['10', '10', '10']);
    esit(r2.st.dalga, 2, 'dalga temizlenince 2. dalga gelmeli');
    esit(r2.st.temizlenen, 1, 'temizlenen dalga sayısı');
    await p.waitForTimeout(3200);
    dogrula(await p.evaluate(() => /düşüren/.test(document.getElementById('kale-dev').textContent)), 'kahraman anı gösterilmedi');
    const rozet = await p.evaluate(([g, ad]) => { const sp = turnuvaDB[g][ad]; return sp.oyun && sp.oyun.kale && sp.oyun.kale.temizledi; }, [r2.g, r2.ad]);
    dogrula(rozet >= 1, 'temizledi rozeti yazılmadı');
    await p.waitForTimeout(4000);
    esit(await p.evaluate(() => /Dalga 2/.test(document.getElementById('kale-ad').textContent)), true, 'tören sonrası 2. dalga çizilmedi');
    // kapıya varış: öndeki düşmanı kapının dibine al → ıska seri → kale bir can kaybeder; can 1 iken kale düşer → aynı dalga baştan
    await p.evaluate((anahtar) => { const k = anahtar + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); st.dusmanlar[0].x = 365; localStorage.setItem(k, JSON.stringify(st)); kmOyunSahneKurKale(); }, anahtar);
    await p.waitForTimeout(400);
    const r3 = await seri(['M', 'M', 'M']);
    esit(r3.st.can, 2, 'kapıya varan düşman kalenin canını almadı');
    await p.evaluate((anahtar) => { const k = anahtar + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); st.can = 1; st.dusmanlar[0].x = 365; localStorage.setItem(k, JSON.stringify(st)); kmOyunSahneKurKale(); }, anahtar);
    await p.waitForTimeout(400);
    const r4 = await seri(['M', 'M', 'M']);
    esit(r4.st.dustu, 1, 'kale düşmesi kaydedilmedi'); esit(r4.st.can, 3, 'kale düşünce can 3\'e dönmeli'); esit(r4.st.dalga, 2, 'kale düşünce aynı dalga baştan');
    await p.waitForTimeout(1500);
    dogrula(await p.evaluate(() => /KALE DÜŞTÜ/.test(document.getElementById('kale-dev').textContent)), 'kale düştü mesajı yok');
    await p.waitForTimeout(3000);
    // 5 düşman tipi çizilir
    const tipler = await p.evaluate(async (anahtar) => {
      const k = anahtar + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k));
      st.dusmanlar = Object.keys(kaleDusmanlar).map((t, i) => ({ id: 900 + i, tip: t, can: 10, max: 10, x: 500 + i * 90, y: kaleDusmanlar[t].ucar ? 360 : 486 }));
      kaleGeriYukle(st); await new Promise((r) => setTimeout(r, 200));
      return Object.keys(kaleDusmanlar).map((t) => { const e = document.querySelector('.kale-dusman[data-tip="' + t + '"]'); return e && e.getBBox().width > 20 ? t : '!' + t; });
    }, anahtar);
    esit(tipler.length, 5, 'düşman tipi sayısı');
    dogrula(tipler.every((t) => t[0] !== '!'), 'eksik çizilen düşman: ' + tipler.join(','));
    // 👆 çocuğun karakterine dokununca sıra ona geçer
    await p.evaluate(() => { _kmOyunAktifIndex = 0; kmOyunSahneKurKale(); }); await p.waitForTimeout(600);
    const kb = await p.locator('#kale-c1 .kale-ci').boundingBox(); await p.mouse.click(kb.x + kb.width / 2, kb.y + kb.height / 2); await p.waitForTimeout(300);
    const sec = await p.evaluate(() => ({ i: _kmOyunAktifIndex, halka: document.querySelector('#kale-c1 .kale-halka').getAttribute('opacity') }));
    esit(sec.i, 1, 'karaktere tıklayınca sıra o sporcuya geçmedi'); esit(sec.halka, '1', 'seçilen çocuğun halkası yanmadı');
    // ⚙️ Oyun Ayarları › Kale Savunması seviyesi
    const sv = await p.evaluate((anahtar) => {
      const k = anahtar + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); st.dalga = 1; st.can = 3; localStorage.setItem(k, JSON.stringify(st));
      const yedek = localStorage.getItem('dag_km_oyun_ayar'), top = () => { const s = JSON.parse(localStorage.getItem(k)); return { max: s.dusmanlar.reduce((a, d) => a + d.max, 0), adim: s.adim }; };
      kmOyunAyarAc(); const satir = /Kale Savunması seviyesi/.test(document.getElementById('km-oyun-ayar-modal').textContent); kmOyunAyarKapat();
      kmOyunAyarKaydet({ mod: 'standart', ozel: {} }); const std = top();
      kmOyunAyarKaydet({ mod: 'ozel', ozel: { kaleSeri: 2 } }); const zor = top();
      if (yedek) localStorage.setItem('dag_km_oyun_ayar', yedek); else localStorage.removeItem('dag_km_oyun_ayar'); kmOyunAyarKaydet(kmOyunAyarHam());
      return { satir, std, zor };
    }, anahtar);
    dogrula(sv.satir, 'Oyun Ayarları\'nda Kale Savunması seviyesi satırı yok');
    dogrula(sv.zor.max > sv.std.max * 1.5, `Çok zor dalga canını artırmadı (${sv.std.max} → ${sv.zor.max})`);
    dogrula(sv.zor.adim < sv.std.adim, `Çok zor düşmanları yavaşlatmadı (${sv.std.adim} → ${sv.zor.adim})`);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px genişlikte yatay taşma');
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
    log(`${st0.dusmanlar.length} düşman · dalga 1 temizlendi → 2 · kapı ve kale düşmesi doğru · ${tipler.join(', ')}`);
  } finally { await ctx.close(); }
}
