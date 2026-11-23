// 🖼️ Resim Avı + 👻 Hayalet Avcıları (v447, 2026-11-23; kullanıcı 6 fikirden bu ikisini seçti). 24 sporcu, 1366×768.
// Resim Avı: okun yönündeki kare açılır · 10/X üç kare · yanlış tahmin can götürür · 3 yanlış = kayboldu · doğru = yıldız · mürekkep · albüm sonu · geri al.
// Hayalet: eşya seçimi · iyi ok yakalar · zayıf ok kaçırır · boş → yandaki tıkırtı / yandakiler de boş · kaçtığı yer görünür, fener izler · gizli kıpırdama yok · oda temiz · gece yarısı · Hayalet Kral 3 kez · sezon.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const KON = "(_kmAktifKonum || 'varsayilan')";
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    const kur = (t) => p.evaluate((t) => {
      ['dag_km_resimavi_', 'dag_km_rsmkalici_', 'dag_km_hayalet_', 'dag_km_hylkalici_'].forEach((a) => localStorage.removeItem(a + (_kmAktifKonum || 'varsayilan')));
      const hepsi = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) hepsi.push({ g, ad }); }));
      _kmListe = hepsi.slice(0, 24); kmOyunRosterYenile(); _kmOyunRosterCache.forEach((s) => { turnuvaDB[s.g][s.ad].devamModu = true; });
      kmOyunTemaSec(t);
    }, t);
    const oku = (a) => p.evaluate(([a, k]) => JSON.parse(localStorage.getItem(a + eval(k)) || 'null'), [a, KON]);
    const yaz = (a, fn, gfn) => p.evaluate(([a, k, fn, gfn]) => { const key = a + eval(k), st = JSON.parse(localStorage.getItem(key)); (new Function('st', fn))(st); localStorage.setItem(key, JSON.stringify(st)); window[gfn](); }, [a, KON, fn, gfn]);
    const seri = (i, oklar, kon) => p.evaluate(async ([i, oklar, kon]) => { _kmOyunAktifIndex = i % _kmOyunRosterCache.length; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = kon || []; kmOyunIlerlet(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); } }, [i, oklar, kon]);

    /* ---------------- RESİM AVI ---------------- */
    const R = 'dag_km_resimavi_', RK = 'dag_km_rsmkalici_';
    await kur('resimavi');
    await p.waitForFunction(() => !!document.getElementById('rsm-sahne') && !document.getElementById('rsm-perde').hidden, null, { timeout: 30000 });
    let st = await oku(R); esit(st.faz, 'basla', 'resim kartı'); esit(st.N, 4, 'Normal 4×4'); esit(st.secenek.length, 4, '4 şık'); esit(st.can, 3, '3 can');
    await p.click('#rsm-bas'); await p.waitForTimeout(300);
    // okun yönü: sağ üst (x>0, y<0), kırmızı → sağ üst çeyrekte bir kare
    await seri(0, ['7', '2', '1'], [{ x: 40, y: -40, tip: '10ring' }, null, null]); await p.waitForTimeout(1200);
    st = await oku(R); const acik1 = st.kare.map((v, i) => v ? i : -1).filter((i) => i >= 0);
    esit(acik1.length, 1, 'bir iyi ok bir kare'); dogrula(acik1[0] % 4 >= 2 && Math.floor(acik1[0] / 4) <= 1, 'sağ üst kare açılmalı, açılan: ' + acik1[0]);
    // sarı ortadan
    const orta = await p.evaluate(() => rsmKareSecTest({ N: 4, kare: Array(16).fill(0) }, { p: 10, x: 2, y: 2 })); dogrula([5, 6, 9, 10].includes(orta), 'sarı orta kareyi açmalı: ' + orta);
    // 10 → 3 kare
    await seri(1, ['X', '1', '1'], [{ x: -50, y: 50, tip: '10ring' }]); await p.waitForTimeout(1200);
    st = await oku(R); esit(st.kare.filter(Boolean).length, 4, 'X kare + 2 komşu');
    // mürekkep: 3. seride bir açık kare kapanır (Normal, ≥3 açık)
    await seri(2, ['1', '1', '1']); await p.waitForTimeout(1200);
    st = await oku(R); esit(st.kare.filter(Boolean).length, 3, 'mürekkep bir kareyi kapatmalı'); esit(st.seri, 3, '3 seri');
    // ŞİMDİ ATIYOR kartı + seçim
    dogrula(await p.evaluate(() => !document.getElementById('rsm-kim').hidden), 'ŞİMDİ ATIYOR kartı');
    await p.click('#rsm-kim .kk-ana'); await p.waitForTimeout(300); esit(await p.locator('.kk-yuzler button').count(), 24, '24 yüz');
    await p.locator('.kk-yuzler button[data-j="9"]').click(); await p.waitForTimeout(300); esit(await p.evaluate(() => _kmOyunAktifIndex), 9, 'yüz seçimi');
    // yanlış tahmin → can
    const cevap = await p.evaluate(() => { const st = JSON.parse(localStorage.getItem('dag_km_resimavi_' + (_kmAktifKonum || 'varsayilan'))); return document.getElementById('rsm-emoji').textContent; });
    const dogruAd = await p.evaluate(([k]) => { const st = JSON.parse(localStorage.getItem('dag_km_resimavi_' + eval(k))); return st.secenek; }, [KON]);
    const yanlislar = await p.evaluate(() => [...document.querySelectorAll('#rsm-sik [data-s]')].map((b) => b.textContent));
    // doğru şıkkı resim kimliğinden bul (sayfadaki albüm verisi gizli → yanlışları teker teker dene)
    let kayip = 0, bildi = false;
    for (let k = 0; k < 4 && !bildi; k++) {
      const once = await oku(R); const b = p.locator('#rsm-sik [data-s]:not(.elendi)').first(); await b.click(); await p.waitForTimeout(400);
      const sonra2 = await oku(R); if (sonra2.faz === 'bildi') bildi = true; else if (sonra2.can < once.can) kayip++; if (sonra2.faz === 'kacti') break;
    }
    st = await oku(R);
    if (bildi) { dogrula(st.yildiz >= 1 && st.yildiz <= 3, 'yıldız 1–3'); dogrula(kayip <= 2, 'en fazla 2 can gitmeli'); }
    else { esit(st.faz, 'kacti', '3 yanlış → kayboldu'); esit(kayip, 3, '3 can gitti'); }
    await p.waitForTimeout(2000);
    dogrula(await p.evaluate(() => !document.getElementById('rsm-perde').hidden), 'sonuç kartı');
    let K = await oku(RK); esit(K.oynanan.length, 1, 'resim albüme işlendi');
    // albüm sonu: 5 oynanmış varken bitir → albüm kartı, yeni albüm
    await p.click('#rsm-dev'); await p.waitForTimeout(300);
    await p.evaluate(([k]) => { const a = 'dag_km_rsmkalici_' + eval(k), K = JSON.parse(localStorage.getItem(a)); const su = JSON.parse(localStorage.getItem('dag_km_resimavi_' + eval(k))).ri; K.sira.forEach((i) => { const id = K.album + ':' + i; if (i !== su && K.oynanan.length < 5 && K.oynanan.indexOf(id) === -1) { K.oynanan.push(id); K.yildiz[id] = 2; } }); localStorage.setItem(a, JSON.stringify(K)); }, [KON]);
    await yaz(R, "st.faz = 'oyun';", 'rsmGuncelle'); await p.waitForTimeout(300);
    for (let k = 0; k < 4; k++) { const s2 = await oku(R); if (s2.faz !== 'oyun') break; await p.locator('#rsm-sik [data-s]:not(.elendi)').first().click(); await p.waitForTimeout(350); }
    await p.waitForTimeout(2000); await p.click('#rsm-dev'); await p.waitForTimeout(500);
    st = await oku(R); K = await oku(RK); esit(st.faz, 'album', 'albüm sonu kartı'); esit(K.album, 'masal', 'sıradaki albüm'); esit(K.oynanan.length, 0, 'yeni albüm boş');
    dogrula(await p.evaluate(() => document.querySelectorAll('.rsm-album > div').length === 6), 'albümde 6 resim');
    await p.click('#rsm-dev'); await p.waitForTimeout(300); esit((await oku(R)).faz, 'basla', 'yeni albümün ilk resmi');
    // geri al
    await p.click('#rsm-bas'); await p.waitForTimeout(200);
    const k0 = JSON.stringify((await oku(RK)).acilan);
    await seri(3, ['9', '9', '9']); await p.waitForTimeout(1200);
    await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); }); await p.waitForTimeout(500);
    esit((await oku(R)).kare.filter(Boolean).length, 0, 'geri al kareleri kapatmalı'); esit(JSON.stringify((await oku(RK)).acilan), k0, 'geri al rütbe sayacını da');

    /* ---------------- HAYALET AVCILARI ---------------- */
    const Hh = 'dag_km_hayalet_', HK = 'dag_km_hylkalici_';
    await kur('hayalet');
    await p.waitForFunction(() => !!document.getElementById('hyl-cv') && !document.getElementById('hyl-perde').hidden, null, { timeout: 30000 });
    let h = await oku(Hh); esit(h.faz, 'basla', 'oda kartı'); esit(h.es.length, 6, 'Normal 6 eşya'); esit(h.hy.length, 3, '3 hayalet');
    await p.click('#hyl-bas'); await p.waitForTimeout(300);
    await yaz(Hh, "st.maxSaat = 20; st.hy = [1, 4, 4]; st.gor = [false, false, false];", 'hylGuncelle');
    // eşyaya dokun → seçili
    { const pt = await p.evaluate(() => hylEsyaNokta(1)); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(200); }
    esit((await oku(Hh)).secili, 1, 'dokunulan eşya seçili');
    await seri(0, ['8', '1', '1']); await p.waitForTimeout(2500);
    h = await oku(Hh); esit(h.hy[0], -1, 'iyi ok hayaleti yakalamalı'); esit(h.yakalanan, 1, '1 kavanoz'); dogrula(!!h.bos[1], 'yakalanınca eşya boş');
    dogrula(h.secili !== 1 && !h.bos[h.secili], 'fener her zaman kapalı bir eşyada');
    // boş eşya, yanında saklı hayalet yok → yandaki de boş sayılır
    await yaz(Hh, "st.secili = 2;", 'hylGuncelle');
    await seri(1, ['9', '1', '1']); await p.waitForTimeout(2500);
    h = await oku(Hh); esit(h.bos[2], 'bos', '2 boş'); esit(h.bos[3], 'bos', 'yanındaki 3 de boş'); dogrula(h.secili !== 2 && !h.bos[h.secili], 'fener işaretsiz eşyaya kaymalı');
    // zayıf ok hayaleti kaçırır
    await yaz(Hh, "st.secili = 4;", 'hylGuncelle');
    await seri(2, ['3', '0', '0']); await p.waitForTimeout(2500);
    h = await oku(Hh); esit(h.hy.filter((x) => x === 4).length, 1, 'zayıf ok bir hayaleti 4’ten kaçırmalı');
    { const k = h.hy.findIndex((x, j) => h.gor[j]); dogrula(k >= 0 && h.hy[k] !== 4, 'kaçan hayalet görünür kalmalı'); esit(h.secili, h.hy[k], 'fener kaçan hayaletin peşinde'); }
    // boş eşya, yanında saklı hayalet var → yan eşyalar tıkırdar ve hiçbir hayalet kendiliğinden yer değiştirmez
    await yaz(Hh, "st.hy = [0, 3, -1]; st.gor = [false, false, false]; st.bos = st.bos.map(() => null); st.duy = []; st.secili = 2; st.yakalanan = 1;", 'hylGuncelle');
    await seri(2, ['9', '0', '0']); await p.waitForTimeout(3000);
    h = await oku(Hh); esit(h.duy.join(), '1,3', 'iki yan da tıkırdar'); dogrula([1, 3].includes(h.secili), 'fener tıkırtıya gider'); esit(h.hy.join(), '0,3,-1', 'zayıf ok olmadan kimse kaçmaz');
    // 10 → saklanan bir hayalet görünür
    await yaz(Hh, "st.secili = 1;", 'hylGuncelle'); await seri(2, ['10', '0', '0']); await p.waitForTimeout(4200);
    h = await oku(Hh); esit(h.gor.filter(Boolean).length, 1, '10 bir hayaleti göstermeli'); esit(h.secili, h.hy[h.gor.indexOf(true)], 'fener görünen hayalette');
    // ŞİMDİ ATIYOR + seçim
    await p.click('#hyl-kim .kk-ana'); await p.waitForTimeout(300); esit(await p.locator('.kk-yuzler button').count(), 24, '24 yüz');
    await p.locator('.kk-yuzler button[data-j="5"]').click(); await p.waitForTimeout(200); esit(await p.evaluate(() => _kmOyunAktifIndex), 5, 'yüz seçimi');
    // oda temiz
    await yaz(Hh, "st.hy = st.hy.map((x) => x >= 0 ? 0 : -1); st.secili = 0;", 'hylGuncelle');
    await seri(3, ['9', '9', '9']); await p.waitForTimeout(4200);
    h = await oku(Hh); let HKk = await oku(HK); esit(h.faz, 'temiz', 'oda temizlenmeli'); esit(HKk.oda, 1, 'sıradaki oda'); dogrula(HKk.kavanoz >= 3, 'kavanoz sayısı kalıcı');
    await p.click('#hyl-dev'); await p.waitForTimeout(300); h = await oku(Hh); esit(h.faz, 'basla', 'oda 2 kartı'); esit(h.oda, 1, 'oda 2');
    // gece yarısı
    await p.click('#hyl-bas'); await yaz(Hh, "st.saat = st.maxSaat - 1; st.secili = st.es.findIndex((_, k) => st.hy.indexOf(k) === -1);", 'hylGuncelle');
    await seri(4, ['0', '0', '0']); await p.waitForTimeout(5000);
    esit((await oku(Hh)).faz, 'gece', 'gece yarısı → kaçtılar');
    // Hayalet Kral: 3 kez
    await p.evaluate(([k]) => { const a = 'dag_km_hylkalici_' + eval(k), K = JSON.parse(localStorage.getItem(a)); K.oda = 5; localStorage.setItem(a, JSON.stringify(K)); }, [KON]);
    await p.click('#hyl-rov'); await p.waitForTimeout(300); h = await oku(Hh); esit(h.kralCan, 3, 'Hayalet Kral 3 can'); esit(h.hy.length, 1, 'tek kral');
    await p.click('#hyl-bas'); await p.waitForTimeout(200);
    for (let k = 0; k < 3; k++) { await yaz(Hh, "st.secili = st.hy[0];", 'hylGuncelle'); await seri(5 + k, ['9', '0', '0']); await p.waitForTimeout(k < 2 ? 3000 : 5000); }
    h = await oku(Hh); HKk = await oku(HK); esit(h.faz, 'final', 'konak temiz'); esit(HKk.sezon, 2, 'yeni sezon'); esit(HKk.oda, 0, 'oda başa');
    dogrula(await p.evaluate(() => /KONAK TEMİZ/.test(document.getElementById('hyl-perde').textContent)), 'final kartı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Resim Avı: yön → kare, X üç kare, mürekkep, tahmin/can/yıldız, albüm, geri al · Hayalet: seçim, yakala, tıkırtı, görünür kaçış, 10 gösterir, kaçırma, oda temiz, gece yarısı, Kral 3 kez, sezon · ŞİMDİ ATIYOR + yüz seçimi');
  } finally { await ctx.close(); }
}
