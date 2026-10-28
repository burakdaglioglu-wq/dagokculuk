// 🏰 Kale Savunması › Kale heyecanı (2026-10-28, v338; kullanıcı: "biraz daha zor, korkutucu, kaybetme hissi — ayarlardan seviyeye
// göre açayım; goblinler, ejderhalar 'sarı atamazsan beni düşüremezsin' desin").
// Oyun Ayarları'nda satır var; ⚔️ Heyecanlı: 2. dalgada Altın Zırhlı Goblin, sarı olmayan ok seker (hasar yok) ve düşman konuşur,
// sarı işler; ejderha sarısız seride öfkelenir, sınırda kaleye ateş (-1 can); kale düşerse 1 dalga geri. 😈 Korkutucu: gece
// sahnesi, 2 can, 2 dalga geri. 🙂 Tatlı'da yeni düşman yok. Ayar ve kale durumu sonunda eski haline döner.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => ({ ayar: localStorage.getItem('dag_km_oyun_ayar'), kale: localStorage.getItem('dag_km_kale_' + (_kmAktifKonum || 'varsayilan')) }));
    const n = await p.evaluate(() => {
      localStorage.removeItem('dag_km_kale_' + (_kmAktifKonum || 'varsayilan'));
      _kmOyunRosterCache.forEach((s) => { const sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (sp) sp.devamModu = true; });
      kmOyunTemaSec('kale');
      return _kmOyunRosterCache.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).length;
    });
    dogrula(n >= 2, 'testte kaydı olan en az 2 sporcu gerekli');
    await p.waitForFunction(() => !!document.getElementById('kale-svg'), null, { timeout: 30000 });
    const K = 'dag_km_kale_';
    const oku = () => p.evaluate((a) => JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))), K);
    const yaz = (fn) => p.evaluate(([a, f]) => { const k = a + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); new Function('st', f)(st); localStorage.setItem(k, JSON.stringify(st)); kmOyunSahneKurKale(); }, [K, fn]);
    const seri = (oklar) => p.evaluate(async (oklar) => {
      for (let k = 0; k < _kmOyunRosterCache.length; k++) { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
    }, oklar);
    const ayar = (mod) => p.evaluate((mod) => kmOyunAyarKaydet({ mod: 'ozel', ozel: { kaleMod: mod } }), mod);

    // ayar satırı
    dogrula(await p.evaluate(() => { kmOyunAyarAc(); const v = /Kale Savunması heyecanı/.test(document.getElementById('km-oyun-ayar-modal').textContent); kmOyunAyarKapat(); return v; }), 'Oyun Ayarları\'nda Kale heyecanı satırı yok');

    // ⚔️ Heyecanlı: seviye değişince dalga (2) yeni seviyenin düşmanlarıyla kurulur → Altın Zırhlı Goblin gelir
    await yaz('st.dalga = 2; st.can = 3; st.mod = 1;'); await ayar(2);
    let st = await oku();
    esit(st.mod, 2, 'dalga Heyecanlı seviyeyle kurulmadı');
    dogrula(st.dusmanlar.some((d) => d.tip === 'zirhli'), '2. dalgada Altın Zırhlı Goblin yok: ' + st.dusmanlar.map((d) => d.tip).join(','));
    dogrula(await p.evaluate(() => /Dalga 2.*⚔️/.test(document.getElementById('kale-ad').textContent)), 'HUD Heyecanlı işaretini göstermiyor');
    // zırhlıyı en öne al: 8-7-5 seker, hasar yok, balon çıkar
    await yaz("const z = st.dusmanlar.find((d) => d.tip === 'zirhli'); z.x = 520; z.can = 20; z.max = 20; st.dusmanlar.forEach((d) => { if (d !== z) d.x = 900; });");
    await p.waitForTimeout(300);
    const balon = p.evaluate(async () => { for (let k = 0; k < 60; k++) { const b = document.getElementById('kale-balon'); if (b) return b.textContent; await new Promise((r) => setTimeout(r, 100)); } return ''; });
    await seri(['8', '7', '5']);
    st = await oku();
    esit(st.dusmanlar.find((d) => d.tip === 'zirhli').can, 20, 'sarı olmayan ok zırhlıya hasar verdi');
    const bm = await balon; dogrula(/Sarı|Zırhım/.test(bm), 'zırhlı goblin konuşmadı: "' + bm + '"');
    await p.waitForTimeout(1200);
    await seri(['9', '6', '6']);
    st = await oku();
    const z = st.dusmanlar.find((d) => d.tip === 'zirhli');
    dogrula(!z || z.can === 20 - 14, 'sarı ok zırhlıya 9×1,5 hasar vermedi (' + (z && z.can) + ')');
    await p.waitForTimeout(1200);

    // ejderha öfkesi: dalga 3'te ejderha, öfke 3 (sınır 4) → sarısız seri → ateş, -1 can, öfke sıfırlanır
    await yaz("st.can = 3; st.dalga = 3; st.mod = 1;"); await p.evaluate(() => kaleAyarUygula());
    await yaz("const e = st.dusmanlar.find((d) => d.tip === 'ejderha'); e.ofke = 3; e.x = 900; st.dusmanlar.forEach((d) => { if (d !== e) { d.x = 700; d.tip = 'goblin'; } });");
    st = await oku();
    dogrula(st.dusmanlar.some((d) => d.tip === 'ejderha' && d.ofke === 3), 'ejderhada öfke alanı yok');
    dogrula(await p.evaluate(() => document.querySelectorAll('.kale-ofke circle').length === 4), 'ejderhanın öfke göstergesi (4 alev) çizilmedi');
    await seri(['5', '5', '5']);
    st = await oku();
    esit(st.can, 2, 'öfkeli ejderha ateş edip kalenin canını almadı');
    esit(st.dusmanlar.find((d) => d.tip === 'ejderha').ofke, 0, 'ateşten sonra öfke sıfırlanmadı');
    await p.waitForTimeout(1500);

    // kale düşerse 1 dalga geri (3 → 2)
    await yaz("st.can = 1; st.dusmanlar.forEach((d) => { if (d.tip !== 'ejderha') d.x = 900; else d.ofke = 0; }); st.dusmanlar[0].x = 365; if (st.dusmanlar[0].tip === 'ejderha') st.dusmanlar[0].x = 365;");
    await seri(['M', 'M', 'M']);
    st = await oku();
    esit(st.dalga, 2, 'Heyecanlı: kale düşünce 1 dalga geri gitmeli'); esit(st.can, 3, 'Heyecanlı: kale 3 canla başlamalı');
    await p.waitForTimeout(1500);
    dogrula(await p.evaluate(() => /1 dalga geri/.test(document.getElementById('kale-dev').textContent)), '"1 dalga geri" mesajı yok');
    await p.waitForTimeout(4000);

    // 😈 Korkutucu: gece sahnesi, 2 can, düşerse 2 dalga geri
    await yaz('st.dalga = 4;'); await ayar(3); await p.waitForTimeout(500);
    st = await oku();
    esit(st.mod, 3, 'dalga Korkutucu seviyeyle kurulmadı'); dogrula(st.can <= 2, 'Korkutucu: can 2\'yi geçmemeli (' + st.can + ')');
    dogrula(await p.evaluate(() => document.getElementById('kale-svg').classList.contains('kale-gece')), 'Korkutucu gece sahnesi çizilmedi');
    esit(await p.evaluate(() => [...document.getElementById('kale-canlar').textContent].filter((c) => c === '❤' || c === '🖤').length), 2, 'Korkutucu HUD 2 kalp göstermeli');
    await yaz("st.can = 1; st.dusmanlar.forEach((d) => { d.x = 900; d.ofke = d.ofke != null ? 0 : d.ofke; }); st.dusmanlar[0].x = 365;");
    await seri(['M', 'M', 'M']);
    st = await oku();
    esit(st.dalga, 2, 'Korkutucu: kale düşünce 2 dalga geri gitmeli (4 → 2)'); esit(st.can, 2, 'Korkutucu: kale 2 canla başlamalı');
    await p.waitForTimeout(5500);

    // 🙂 Tatlı'ya dönünce kurallı düşman kalmaz, 3 can
    await ayar(1); st = await oku();
    dogrula(st.dusmanlar.every((d) => !['zirhli', 'kalkanci', 'yavruejder'].includes(d.tip)), 'Tatlı seviyede kurallı düşman kaldı');
    esit(st.can, 3, 'Tatlı seviyede kale 3 canlı olmalı');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yatay taşma');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Heyecanlı: zırhlı goblin sarısız oku sektirir + konuşur, ejderha öfkesi ateş, 1 dalga geri · Korkutucu: gece, 2 can, 2 dalga geri · Tatlı temiz');
  } finally {
    if (yedek) await p.evaluate((y) => { const k = 'dag_km_kale_' + (_kmAktifKonum || 'varsayilan'); if (y.ayar) localStorage.setItem('dag_km_oyun_ayar', y.ayar); else localStorage.removeItem('dag_km_oyun_ayar'); if (y.kale) localStorage.setItem(k, y.kale); else localStorage.removeItem(k); }, yedek).catch(() => {});
    await ctx.close();
  }
}
