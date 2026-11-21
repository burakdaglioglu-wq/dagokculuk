// Karışık Sınıf › Oyunlar › 🕵️ Dedektif Okçular + 🌋 Yanardağ Hazinesi (v444, 2026-11-22).
// Kullanıcı 6 fikirden bu ikisini seçti; "görseller iyi olsun", "zorluk seviyeleri", "dedektifteki yazılar büyük".
// Kural (YENİ OYUNLAR REZALET): 24 çocukla tam tur, TV + telefon boyutu, ekran görüntüleri kullanıcıya gösterilir.
// Dedektif: eşiği geçen ok ipucu açar · yanlış suçlama masum + 2 seri · doğru suçlama vakayı kapatır · Kolay 4 şüpheli + otomatik eleme · geri al.
// Yanardağ: iyi ok yumurtayı tekneye · seriden sonra oy · KAÇ → 5 sn kürek → ambar · patlama yarısını yakar · oy açıkken seri = DEVAM · geri al.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

const CIKTI = process.env.E2E_CIKTI || null; // ekran görüntüsü klasörü (isteğe bağlı)

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const foto = async (ad) => { if (CIKTI) await p.screenshot({ path: CIKTI + '/' + ad + '.png' }); };
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    // 24 kişilik sınıf (kayıtlı sporculardan)
    const n = await p.evaluate(() => {
      ['dag_km_dedektif_', 'dag_km_yanardag_'].forEach((a) => localStorage.removeItem(a + (_kmAktifKonum || 'varsayilan')));
      const hepsi = []; Object.keys(turnuvaDB).forEach((g) => { if (turnuvaDB[g] && typeof turnuvaDB[g] === 'object') Object.keys(turnuvaDB[g]).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && typeof sp === 'object' && !sp.pasif) hepsi.push({ g, ad }); }); });
      _kmListe = hepsi.slice(0, 24); kmOyunRosterYenile();
      _kmOyunRosterCache.forEach((s) => { turnuvaDB[s.g][s.ad].devamModu = true; });
      kmOyunTemaSec('dedektif');
      return _kmOyunRosterCache.length;
    });
    dogrula(n >= 6, 'en az 6 sporcu gerekli (gelen ' + n + ')');
    await p.waitForFunction(() => !!document.getElementById('ddk-cv') && !document.getElementById('ddk-perde').hidden, null, { timeout: 30000 });
    await p.waitForTimeout(900);
    await foto('ddk-0-basla');
    const oku = (a) => p.evaluate((a) => JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))), a);
    const seri = (i, oklar) => p.evaluate(async ([i, oklar]) => {
      _kmOyunAktifIndex = i % _kmOyunRosterCache.length; const s = _kmOyunRosterCache[_kmOyunAktifIndex], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      return { once, sonra: (sp.seriler || []).length };
    }, [i, oklar]);

    /* ---------------- DEDEKTİF ---------------- */
    const D = 'dag_km_dedektif_';
    let st = await oku(D);
    esit(st.faz, 'basla', 'vaka başlangıç kartı ile açılmalı');
    esit(st.n, 6, 'Normal 6 şüpheli');
    dogrula(st.v.ipucu.length >= 3 && st.v.ipucu.length <= 5, 'Normal vakada 3–5 ipucu olmalı');
    await p.click('#ddk-bas'); await p.waitForTimeout(400);
    esit((await oku(D)).faz, 'oyun', 'Başlat oyunu açmalı');
    let r = await seri(0, ['9', '8', '3']);
    esit(r.sonra, r.once + 1, 'seri gerçek kayda yazılmadı');
    await p.waitForTimeout(600);
    st = await oku(D);
    esit(st.acik, 2, '9 ve 8 iki ipucu açmalı, 3 açmamalı (eşik 7)');
    esit(st.saat, 1, 'seri saati ilerletmeli');
    await foto('ddk-1-ipucu');
    // geri al
    const geri = await p.evaluate((D) => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); return JSON.parse(localStorage.getItem(D + (_kmAktifKonum || 'varsayilan'))); }, D);
    esit(geri.acik, 0, 'geri al ipuçlarını geri almadı'); esit(geri.saat, 0, 'geri al saati geri almadı');
    await p.waitForTimeout(800);
    r = await seri(1, ['10', '9', '9']); await p.waitForTimeout(600);
    st = await oku(D);
    dogrula(st.acik >= 3 || st.acik === st.v.ipucu.length, 'ipuçları açılmadı');
    esit(st.masum.filter(Boolean).length, 1, '10 altın ipucu bir masumu elemeli');
    // canvas üzerinde şüpheliye tıklama yardımcısı
    const tikla = async (i) => {
      const xy = await p.evaluate((i) => ddkSupheliNokta(i), i);
      const ust = await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e ? e.id || e.className : null; }, [xy.x, xy.y]);
      dogrula(ust === 'ddk-cv', i + '. şüphelinin üstünü başka bir şey örtüyor: ' + ust);
      await p.mouse.click(xy.x, xy.y); await p.waitForTimeout(250);
    };
    // "bu değil" çizme
    const yanlis = st.v.s.map((_, i) => i).find((i) => i !== st.v.h && !st.masum[i]);
    await tikla(yanlis); st = await oku(D); esit(st.x[yanlis], 1, 'şüpheliye dokununca üstü çizilmeli');
    await tikla(yanlis); st = await oku(D); esit(st.x[yanlis], 0, 'ikinci dokunuş çizgiyi kaldırmalı');
    // yanlış suçlama
    const saat0 = st.saat;
    await p.click('#ddk-sucla-btn'); await tikla(yanlis);
    await p.waitForSelector('#ddk-evet', { timeout: 5000 }); await p.click('#ddk-evet'); await p.waitForTimeout(1800);
    st = await oku(D); esit(st.masum[yanlis], 1, 'yanlış suçlanan MASUM olmalı'); esit(st.saat, Math.min(st.maxSaat, saat0 + 2), 'yanlış suçlama 2 seri kaybettirmeli');
    await foto('ddk-2-masum');
    // doğru suçlama
    await p.click('#ddk-sucla-btn'); await tikla(st.v.h);
    await p.waitForSelector('#ddk-evet', { timeout: 5000 }); await p.click('#ddk-evet'); await p.waitForTimeout(1500);
    await foto('ddk-3-yakalandi');
    await p.waitForTimeout(2000);
    st = await oku(D); esit(st.faz, 'cozuldu', 'doğru suçlama vakayı kapatmalı');
    dogrula(await p.evaluate(() => /bulundu/.test(document.getElementById('ddk-perde').textContent)), 'vaka kapandı kartı görünmedi');
    await foto('ddk-4-cozuldu');
    await p.click('#ddk-dev'); await p.waitForTimeout(400);
    st = await oku(D); esit(st.vaka, 1, 'sıradaki vakaya geçmeli'); esit(st.faz, 'basla', 'yeni vaka kartı açılmalı');
    // Kolay: 4 şüpheli + uymayanlar kendiliğinden elenir; kart açıkken seri girilince oyun başlar
    await p.click('#ddk-bas'); await p.waitForTimeout(300);
    await p.click('#ddk-zor-btn'); await p.click('#ddk-perde [data-z="kolay"]'); await p.waitForTimeout(400);
    st = await oku(D); esit(st.n, 4, 'Kolay 4 şüpheli'); esit(st.maxSaat, 10, 'Kolay 10 seri'); esit(st.esik, 5, 'Kolay eşik 5');
    r = await seri(2, ['6', '2', '1']); await p.waitForTimeout(500);
    st = await oku(D); esit(st.faz, 'oyun', 'kart açıkken girilen seri oyunu başlatmalı'); esit(st.acik, 1, '6 Kolay\'da ipucu açmalı');
    const c0 = st.v.ipucu[0], beklenenX = st.v.s.filter((o) => !(c0.not ? o[c0.k] !== c0.v : o[c0.k] === c0.v)).length;
    esit(st.x.filter(Boolean).length, beklenenX, 'Kolay: uymayanlar kendiliğinden çizilmeli');
    await foto('ddk-5-kolay');
    // Zor: DEĞİLDİ ipuçları üretilmeli
    await p.click('#ddk-zor-btn'); await p.click('#ddk-perde [data-z="zor"]'); await p.waitForTimeout(400);
    st = await oku(D); esit(st.maxSaat, 7, 'Zor 7 seri'); esit(st.esik, 8, 'Zor eşik 8'); dogrula(st.v.ipucu.filter((c) => c.not).length >= 2, 'Zor vakada en az 2 "DEĞİLDİ" ipucu');
    // ipucu üretici: her zorlukta hırsız tek kişiye iner (100 deneme)
    // (sayfa içi üretici kapalı; durumdan doğrula)
    const tek = (s) => s.v.s.filter((o) => s.v.ipucu.every((c) => c.not ? o[c.k] !== c.v : o[c.k] === c.v)).length;
    esit(tek(st), 1, 'ipuçları hırsızı tek kişiye indirmeli');
    // tren: saat dolunca kaçar
    await p.click('#ddk-bas'); await p.waitForTimeout(300);
    for (let k = 0; k < 7; k++) await seri(3 + k, ['1', '1', '1']);
    await p.waitForTimeout(3200);
    st = await oku(D); esit(st.faz, 'kacti', 'saat dolunca tren kalkmalı');
    dogrula(await p.evaluate(() => /Tren kalktı/.test(document.getElementById('ddk-perde').textContent)), 'tren kalktı kartı yok');

    /* ---------------- YANARDAĞ ---------------- */
    const Yk = 'dag_km_yanardag_';
    await p.evaluate(() => kmOyunTemaSec('yanardag'));
    await p.waitForFunction(() => !!document.getElementById('yng-cv') && !document.getElementById('yng-perde').hidden, null, { timeout: 30000 });
    await p.waitForTimeout(900);
    await foto('yng-0-basla');
    let y = await oku(Yk); esit(y.faz, 'basla', 'ada kartı ile açılmalı'); esit(y.esik, 7, 'Normal eşik 7');
    await p.evaluate((Yk) => { const k = Yk + (_kmAktifKonum || 'varsayilan'), s = JSON.parse(localStorage.getItem(k)); s.patla = 6; localStorage.setItem(k, JSON.stringify(s)); }, Yk);
    await p.click('#yng-bas'); await p.waitForTimeout(300);
    r = await seri(4, ['10', '9', '4']); esit(r.sonra, r.once + 1, 'yanardağ serisi gerçek kayda yazılmadı');
    await p.waitForTimeout(800);
    y = await oku(Yk); esit(y.tekne, 4, '10 (altın 3) + 9 (1) = 4 yumurta teknede'); esit(y.faz, 'oy', 'seriden sonra oy açılmalı');
    dogrula(await p.evaluate(() => !!document.getElementById('yng-dv') && !!document.getElementById('yng-kc')), 'DEVAM/KAÇ düğmeleri yok');
    await foto('yng-1-oy');
    // oy açıkken seri → DEVAM sayılır
    r = await seri(5, ['8', '7', 'M']); await p.waitForTimeout(800);
    y = await oku(Yk); esit(y.tekne, 6, 'oy açıkken seri DEVAM sayılmalı'); esit(y.seriNo, 2, 'ikinci seri sayılmalı');
    dogrula(y.lav.every((v) => v > 0), 'lav akmalı');
    await foto('yng-2-lav');
    // geri al
    const yg = await p.evaluate((Yk) => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); return JSON.parse(localStorage.getItem(Yk + (_kmAktifKonum || 'varsayilan'))); }, Yk);
    esit(yg.tekne, 4, 'geri al tekneyi geri almadı'); esit(yg.seriNo, 1, 'geri al seri sayısını geri almadı');
    await p.waitForTimeout(800);
    // KAÇ → kürek → ambar
    await p.evaluate(() => { if (typeof yngGuncelle === 'function') yngGuncelle(); });
    await p.waitForSelector('#yng-kc', { timeout: 5000 }); await p.click('#yng-kc'); await p.waitForTimeout(1200);
    await foto('yng-3-kurek');
    await p.waitForTimeout(5000);
    y = await oku(Yk); esit(y.faz, 'adasonu', 'kürekten sonra ada sonu'); esit(y.ambar, 4, 'teknedekiler ambara girmeli'); esit(y.tekne, 0, 'tekne boşalmalı');
    await foto('yng-4-kactik');
    await p.click('#yng-dev'); await p.waitForTimeout(400);
    y = await oku(Yk); esit(y.ada, 1, 'sıradaki ada');
    // patlama: gizli seri 1'e çekilir
    await p.evaluate((Yk) => { const k = Yk + (_kmAktifKonum || 'varsayilan'), s = JSON.parse(localStorage.getItem(k)); s.patla = 1; s.faz = 'oyun'; localStorage.setItem(k, JSON.stringify(s)); yngGuncelle(); }, Yk);
    r = await seri(6, ['9', '9', '9']); await p.waitForTimeout(1500);
    await foto('yng-5-patlama');
    await p.waitForTimeout(2500);
    y = await oku(Yk); esit(y.faz, 'adasonu', 'patlama ada sonu'); esit(y.son.tip, 'patladi', 'patlama mesajı'); esit(y.ambar, 4 + 1, '3 yumurtanın yarısı (2) yanar, 1 ambara');
    dogrula(y.yum.every((e) => e.d !== 'var'), 'patlamada kalan yumurtalar yanmalı');
    // telefon
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(700);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px genişlikte yatay taşma');
    await foto('yng-6-telefon');
    await p.evaluate(() => kmOyunTemaSec('dedektif')); await p.waitForTimeout(1200);
    await foto('ddk-6-telefon');
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
    log(`${n} sporcu · Dedektif: ipucu/geri al/altın ipucu/çizme/yanlış+doğru suçlama/Kolay/Zor/tren · Yanardağ: yumurta/oy/DEVAM/geri al/KAÇ/patlama`);
  } finally { await ctx.close(); }
}
