// 🏰 Kale Savunması › gelişen canavarlar (2026-10-31, v359; kullanıcı: "bir noktaya kadar güzel, bir noktadan sonra sıkıyor;
// canavarlar değişerek gelsin, belki gelişsin — çocuklar yakından attığı için yüksek skor atıyorlar").
// ✨ evre (4. dalga 🪖, 7. dalga 👑) çizilir ve "CANAVARLAR GELİŞTİ" kartı çıkar; 🟢 balçık düşünce ikiye bölünür; 👻 görünmez hayalet
// hedef olmaz (ok arkadakine), her seri görünür↔görünmez; 🧙 şaman öndekini geliştirir; 🐲 ejderha yarı canda yardımcı çağırır;
// ⚔️ eşik evreyle yükselir; ⚖️ gerçek atış ölçümü dalga canını artırır; 390 px taşma yok.
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
    dogrula(n >= 1, 'testte kaydı olan en az 1 sporcu gerekli');
    await p.waitForFunction(() => !!document.getElementById('kale-svg'), null, { timeout: 30000 });
    const K = 'dag_km_kale_';
    const oku = () => p.evaluate((a) => JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))), K);
    const yaz = async (fn) => { await p.evaluate(([a, f]) => { const k = a + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); new Function('st', f)(st); localStorage.setItem(k, JSON.stringify(st)); kmOyunSahneKurKale(); }, [K, fn]); await p.waitForTimeout(300); };
    const seri = (oklar) => p.evaluate(async (oklar) => {
      for (let k = 0; k < _kmOyunRosterCache.length; k++) { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
    }, oklar);
    const ayar = (mod) => p.evaluate((mod) => kmOyunAyarKaydet({ mod: 'ozel', ozel: { kaleMod: mod } }), mod);
    const devBekle = (re, ms) => p.evaluate(async ([re, ms]) => { const r = new RegExp(re); for (let k = 0; k < ms / 100; k++) { const t = document.getElementById('kale-dev').textContent; if (r.test(t)) return t; await new Promise((x) => setTimeout(x, 100)); } return document.getElementById('kale-dev').textContent; }, [re, ms]);
    const goblinler = (ek) => `st.dusmanlar.forEach((d, j) => { d.tip = 'goblin'; d.can = 200; d.max = 200; d.x = 800 + j * 30; d.evre = 1; d.gorunmez = false; }); ${ek}`;

    // dalga içeriği: 5'te balçık, 6'da hayalet (🙂 Tatlı'da da), evre 4'te 2, 7'de 3
    await ayar(1);
    await yaz('st.dalga = 5; st.can = 3;'); await p.evaluate(() => { const st = JSON.parse(localStorage.getItem('dag_km_kale_' + (_kmAktifKonum || 'varsayilan'))); st.mod = 2; localStorage.setItem('dag_km_kale_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); kaleAyarUygula(); });
    let st = await oku();
    dogrula(st.dusmanlar.some((d) => d.tip === 'balcik') && st.dusmanlar.every((d) => d.evre === 2), '5. dalgada balçık / evre 2 yok: ' + st.dusmanlar.map((d) => d.tip + d.evre).join(','));
    dogrula(await p.evaluate(() => document.querySelectorAll('.kale-dusman[data-evre="2"]').length > 0), 'evre 2 çizilmedi');

    // 🟢 balçık bölünür: öndeki balçık 3 canda, 7 → iki minik balçık doğar, dalga bitmez
    await yaz(goblinler("const b = st.dusmanlar[0]; b.tip = 'balcik'; b.can = 3; b.max = 30; b.x = 600;"));
    await seri(['7', 'M', 'M']); await p.waitForTimeout(800);
    st = await oku();
    const mini = st.dusmanlar.filter((d) => d.tip === 'minibalcik');
    esit(mini.length, 2, 'balçık ikiye bölünmedi'); dogrula(mini.every((d) => d.max === 9),'minik balçık canı yanlış: ' + JSON.stringify(mini));
    dogrula(await p.evaluate((ids) => ids.every((id) => !!document.getElementById('kale-d' + id)), mini.map((d) => d.id)), 'minik balçıklar sahnede yok');

    // 👻 görünmez hayalet hedef olmaz: oklar arkadaki goblin'e; adımdan sonra görünür olur
    await yaz(goblinler("st.dusmanlar = st.dusmanlar.slice(0, 3); const h = st.dusmanlar[0]; h.tip = 'hayalet'; h.can = 50; h.max = 50; h.x = 600; h.gorunmez = true;"));
    await seri(['6', '6', '6']); await p.waitForTimeout(600);
    st = await oku();
    const hy = st.dusmanlar.find((d) => d.tip === 'hayalet');
    esit(hy.can, 50, 'görünmez hayalet vuruldu'); dogrula(st.dusmanlar.some((d) => d.tip === 'goblin' && d.can === 200 - 18), 'ok arkadaki goblin\'e gitmedi');
    esit(hy.gorunmez, false, 'hayalet adımdan sonra görünür olmadı');
    dogrula(await p.evaluate((id) => !document.getElementById('kale-d' + id).classList.contains('kale-gorunmez'), hy.id), 'hayalet görünür çizilmedi');
    await seri(['6', '6', '6']); st = await oku();
    esit(st.dusmanlar.find((d) => d.tip === 'hayalet').can, 50 - 18, 'görünür hayalet vurulmadı');

    // ⚔️ Heyecanlı: eşik evreyle yükselir (evre 2 kalkanlı 8+), 🧙 şaman öndekini geliştirir
    await ayar(2); await p.waitForTimeout(400);
    await yaz(goblinler("const t = st.dusmanlar[0]; t.tip = 'kalkanci'; t.evre = 2; t.can = 40; t.max = 40; t.x = 600;"));
    dogrula(await p.evaluate(() => /8\+/.test(document.querySelector('.kale-dusman[data-tip="kalkanci"]').textContent)), 'evre 2 kalkanlıda 8+ rozeti yok');
    await seri(['7', '7', '8']); st = await oku();
    esit(st.dusmanlar.find((d) => d.tip === 'kalkanci').can, 32, 'evre 2 kalkanlı: 7 sekmeli, 8 işlemeli');
    await yaz(goblinler("st.seri = 1; const s = st.dusmanlar[st.dusmanlar.length - 1]; s.tip = 'saman'; s.x = 1000; st.dusmanlar[0].x = 600;"));
    const on0 = (await oku()).dusmanlar[0];
    await seri(['M', 'M', 'M']); await p.waitForTimeout(1600);
    st = await oku();
    const on1 = st.dusmanlar.find((d) => d.id === on0.id);
    dogrula(on1.evre === 2 && on1.max === 260 && st.gelisen >= 1, 'şaman öndekini geliştirmedi: ' + JSON.stringify(on1));
    dogrula(await p.evaluate((id) => document.getElementById('kale-d' + id).dataset.evre === '2', on0.id), 'geliştirilen düşman yeniden çizilmedi');

    // 🐲 ejderha yarı canda iki yavru ejderha çağırır (bir kez)
    await yaz(goblinler("st.dusmanlar = st.dusmanlar.slice(0, 1); const e = st.dusmanlar[0]; e.tip = 'ejderha'; e.can = 105; e.max = 200; e.x = 600; e.ofke = 0;"));
    await seri(['5', 'M', 'M']); st = await oku();
    esit(st.dusmanlar.filter((d) => d.tip === 'yavruejder').length, 2, 'ejderha yardımcı çağırmadı');
    dogrula(st.dusmanlar.find((d) => d.tip === 'ejderha').cagirdi === true, 'çağrı işareti yok');

    // 🎯 v360 Sapancı (⚔️): 2. seride taş fırlatır → havada asılı; vurulamazsa çatlak; 8+ ilk ok havada vurur (+💰, düşmana gitmez);
    // 3. çatlak −1 ❤️ ve çatlaklar sıfırlanır
    await yaz(goblinler("st.dusmanlar = st.dusmanlar.slice(0, 3); st.can = 3; st.catlak = 0; st.altin = 0; st.mermi = null; st.dusmanlar[0].x = 600; const s = st.dusmanlar[2]; s.tip = 'sapanci'; s.x = 950; s.sayac = 1;"));
    await seri(['M', 'M', 'M']); await p.waitForTimeout(2200);
    st = await oku();
    dogrula(st.mermi && st.mermi.tur === 'tas', 'sapancı taş fırlatmadı: ' + JSON.stringify(st.mermi));
    dogrula(await p.evaluate(() => /8\+ ile vur/.test(document.getElementById('kale-mermi').textContent)), 'havadaki taş çizilmedi');
    await seri(['5', '5', '5']); await p.waitForTimeout(1200); st = await oku();
    dogrula(!st.mermi && st.catlak === 1 && st.can === 3, 'vurulamayan taş çatlak açmadı: ' + JSON.stringify({ m: st.mermi, c: st.catlak, can: st.can }));
    dogrula(await p.evaluate(() => document.querySelectorAll('#kale-catlak path').length === 1 && /çatlak 1\/3/.test(document.getElementById('kale-guc').textContent)), 'çatlak çizimi / HUD yok');
    await yaz("st.mermi = { tur: 'tas', kaynak: 0, x: 520, y: 250 }; st.dusmanlar.forEach((d) => { d.can = 200; d.sayac = 0; });");
    const onG = (await oku()).dusmanlar.slice().sort((a, b) => a.x - b.x)[0].id;
    await seri(['9', '5', '5']); await p.waitForTimeout(800); st = await oku();
    dogrula(!st.mermi && st.havada === 1 && st.altin === 1, 'havada vurma çalışmadı: ' + JSON.stringify({ m: st.mermi, h: st.havada, a: st.altin }));
    esit(st.dusmanlar.find((d) => d.id === onG).can, 190, '8+ ok havadaki taşa gitmeli, diğer iki ok düşmana');
    await yaz("st.catlak = 2; st.mermi = { tur: 'tas', kaynak: 0, x: 520, y: 250 }; st.dusmanlar.forEach((d) => { d.x = 900; });");
    await seri(['5', '5', '5']); st = await oku();
    dogrula(st.can === 2 && st.catlak === 0, '3. çatlak −1 ❤️ yapmadı: ' + JSON.stringify({ can: st.can, c: st.catlak }));
    // 🙂 Tatlı: domates zararsız; 3. dalgada sapancı gelir
    await ayar(1); await p.waitForTimeout(400);
    await yaz("st.can = 3; st.catlak = 0; st.mermi = { tur: 'domates', kaynak: 0, x: 520, y: 250 }; st.dusmanlar.forEach((d) => { d.x = 900; d.tip = 'goblin'; });");
    await seri(['5', '5', '5']); st = await oku();
    dogrula(st.can === 3 && !st.catlak && !st.mermi, 'domates zarar verdi');
    await yaz('st.dalga = 3; st.mod = 2;'); await p.evaluate(() => kaleAyarUygula()); st = await oku();
    dogrula(st.dusmanlar.some((d) => d.tip === 'sapanci'), '3. dalgada sapancı yok: ' + st.dusmanlar.map((d) => d.tip).join(','));
    await ayar(2); await p.waitForTimeout(400);

    // ⚖️ gerçek atış ölçümü: sınıf beklenenden çok vuruyorsa dalga canı artar
    const can = await p.evaluate(() => {
      const k = 'dag_km_kale_' + (_kmAktifKonum || 'varsayilan'), top = () => JSON.parse(localStorage.getItem(k)).dusmanlar.reduce((a, d) => a + d.max, 0);
      const set = (o) => { const s = JSON.parse(localStorage.getItem(k)); s.olcum = o; s.dalga = 2; s.mod = 2; localStorage.setItem(k, JSON.stringify(s)); kaleAyarUygula(); };
      set({ n: 0, h: 0 }); const a = top(); set({ n: 10, h: 10 * 500 }); const b = top(); return { a, b };
    });
    dogrula(can.b > can.a * 1.5, `ölçüm dalga canını artırmadı (${can.a} → ${can.b})`);

    // ✨ evrim kartı: 3. dalga temizlenince 4. dalga 🪖 Savaşçı + "CANAVARLAR GELİŞTİ"
    await yaz("st.dalga = 3; st.evreGor = 1; st.olcum = { n: 0, h: 0 }; st.dusmanlar = st.dusmanlar.slice(0, 3); st.dusmanlar.forEach((d) => { d.can = 2; d.max = 2; d.tip = 'goblin'; d.x = 600; });");
    const kart = devBekle('GELİŞTİ', 14000);
    await seri(['9', '9', '9']);
    const kt = await kart;
    dogrula(/CANAVARLAR GELİŞTİ/.test(kt) && /Savaşçı/.test(kt), 'evrim kartı çıkmadı: ' + kt);
    st = await oku(); esit(st.dalga, 4, '4. dalgaya geçmedi'); esit(st.evreGor, 2, 'evrim kartı işareti');
    dogrula(await p.evaluate(() => /🪖/.test(document.getElementById('kale-ad').textContent) && document.querySelectorAll('.kale-evrim svg').length === 2), 'HUD 🪖 / kart çizimleri yok');

    // 👑 evre 3 + bütün tipler çizilir; 390 px'te taşma yok
    await yaz("st.dalga = 7; st.dusmanlar = Object.keys(kaleDusmanlar).map((t, i) => ({ id: 950 + i, tip: t, can: 10, max: 10, evre: 3, x: 420 + i * 48, y: kaleDusmanlar[t].ucar ? 360 : 486 }));");
    const ciz = await p.evaluate(() => Object.keys(kaleDusmanlar).filter((t) => { const e = document.querySelector('.kale-dusman[data-tip="' + t + '"]'); return !(e && e.classList.contains('kale-e3') && e.getBBox().width > 20); }));
    esit(ciz.length, 0, 'evre 3 çizilmeyen tipler: ' + ciz.join(','));
    if (process.env.KALE_GORSEL) await p.screenshot({ path: process.env.KALE_GORSEL + '/kale-1400.png' });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= 391), '390 px yatay taşma');
    if (process.env.KALE_GORSEL) await p.screenshot({ path: process.env.KALE_GORSEL + '/kale-390.png' });
    dogrula(hatalar.length === 0, 'sayfa hataları: ' + hatalar.join(' | '));
    log('evre çizimi + GELİŞTİ kartı · balçık bölünür · hayalet görünmez/görünür · eşik 8+ · şaman geliştirir · ejderha yardımcı · ölçüm denge · 390 px');
  } finally {
    try {
      await p.evaluate((y) => {
        const k = 'dag_km_kale_' + (_kmAktifKonum || 'varsayilan'); if (y.kale) localStorage.setItem(k, y.kale); else localStorage.removeItem(k);
        if (y.ayar) localStorage.setItem('dag_km_oyun_ayar', y.ayar); else localStorage.removeItem('dag_km_oyun_ayar');
      }, yedek);
    } catch (e) { }
    await ctx.close();
  }
}
