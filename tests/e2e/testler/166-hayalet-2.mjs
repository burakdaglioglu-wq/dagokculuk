// 👻 Hayalet Avcıları 2.0 (v467, 2026-11-26; kullanıcı: "diğer oyunu da geliştir hayaleti"): kapı seçimi · 32 hayalet · albüm · zırh/hırsız · ışık/dans · 5 seviye (kalıcı) · patron · telefon. (v459 kuralları da burada.)
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
    const Hh = 'dag_km_hayalet_', HK = 'dag_km_hylkalici_', CIKTI = process.env.E2E_CIKTI || null, foto = async (ad) => { if (CIKTI) await p.screenshot({ path: CIKTI + '/' + ad + '.png' }); };
    await kur('hayalet');
    await p.waitForFunction(() => !!document.getElementById('hyl-cv') && !document.getElementById('hyl-perde').hidden, null, { timeout: 60000 });
    const oda = (z, kr, oid) => p.evaluate(([z, kr, oid]) => hylOdaTest(z, kr, oid), [z, kr, oid]);
    // 1) kapı: 3 ayrı oda, portreler, seviye; seçince oda kartı
    let h = await oku(Hh); esit(h.faz, 'kapi', 'önce kapı'); esit(new Set(h.kapilar.map((k) => k.id)).size, 3, '3 ayrı oda'); esit(h.zor, 'normal', 'ilk açılış Normal'); esit(await p.locator('.hyl-kapilar canvas').count(), 15, 'kapılarda hayalet portreleri'); esit(await p.locator('.hyl-zorsec button').count(), 5, '5 seviye'); dogrula(await p.evaluate(() => [...document.querySelectorAll('.hyl-kapilar canvas')].every((c) => { const a = c.getBoundingClientRect(), b = c.closest('button').getBoundingClientRect(); return a.width > 20 && a.left >= b.left && a.right <= b.right && a.bottom <= b.bottom; })), 'portreler kapının içinde'); await p.waitForTimeout(600); await foto('hyl-kapi');
    await p.locator('.hyl-kapilar button').nth(1).click(); await p.waitForTimeout(400); h = await oku(Hh); esit(h.faz, 'basla', 'oda kartı'); esit(h.oid, h.kapilar[1].id, 'seçilen oda'); esit(h.kim.join(), h.kapilar[1].kim.join(), 'seçilen kadro'); esit(h.es.length, 7, 'Normal 7 eşya'); esit(h.hy.length, 5, '5 hayalet'); await foto('hyl-basla');
    await p.click('#hyl-bas'); await p.waitForTimeout(300); esit((await oku(Hh)).faz, 'oyun', 'av başladı');
    // 2) v459 kuralları: seç, yakala, boş + komşu, kaç, tıkırtı, 10 gösterir (sade kadro)
    await oda('normal', false, 'hol'); await yaz(Hh, "st.maxSaat = 30; st.olaylar = []; st.kim = ['mirmir','fisfis','tombik']; st.kadro = st.kim; st.can = [1,1,1]; st.canTop = [1,1,1]; st.hy = [1, 4, 4]; st.gor = [false, false, false]; st.bos = st.bos.map(() => null); st.duy = [];", 'hylGuncelle');
    { const pt = await p.evaluate(() => hylEsyaNokta(1)); await p.mouse.click(pt.x, pt.y); await p.waitForTimeout(200); } esit((await oku(Hh)).secili, 1, 'dokunulan eşya seçili');
    await seri(0, ['8', '0', '0']); await p.waitForTimeout(3600); h = await oku(Hh); esit(h.hy[0], -1, 'iyi ok yakalar'); esit(h.yakalanan, 1, '1 kavanoz'); esit(h.kav.join(), 'mirmir', 'kavanozda Mırmır'); dogrula(!!h.bos[1], 'eşya boş'); esit((await oku(HK)).album.mirmir, 1, 'albümde');
    await yaz(Hh, "st.secili = 2;", 'hylGuncelle'); await seri(1, ['9', '0', '0']); await p.waitForTimeout(3600); h = await oku(Hh); esit(h.bos[2], 'bos', '2 boş'); esit(h.bos[3], 'bos', 'yanındaki 3 de boş');
    await yaz(Hh, "st.secili = 4;", 'hylGuncelle'); await seri(2, ['3', '0', '0']); await p.waitForTimeout(3600); h = await oku(Hh); esit(h.hy.filter((x) => x === 4).length, 1, 'zayıf ok kaçırır'); { const k = h.hy.findIndex((x, j) => h.gor[j]); dogrula(k >= 0 && h.hy[k] !== 4, 'kaçan görünür'); esit(h.secili, h.hy[k], 'fener peşinde'); }
    await yaz(Hh, "st.hy = [0, 3, -1]; st.gor = [false, false, false]; st.bos = st.bos.map(() => null); st.duy = []; st.secili = 2;", 'hylGuncelle'); await seri(3, ['9', '0', '0']); await p.waitForTimeout(3600); h = await oku(Hh); esit(h.duy.join(), '1,3', 'iki yan tıkırdar'); esit(h.hy.join(), '0,3,-1', 'kimse kendiliğinden kaçmaz');
    await yaz(Hh, "st.secili = 1; st.onSay = 0;", 'hylGuncelle'); await seri(4, ['10', '0', '0']); await p.waitForTimeout(4600); h = await oku(Hh); esit(h.gor.filter(Boolean).length, 1, '10 gösterir');
    // 3) 🛡️ zırh: kalp gider, kaçmaz; Zor'da 10 iki kalp
    await oda('zor', false, 'lab'); await yaz(Hh, "st.maxSaat = 30; st.olaylar = []; st.kim = ['migfer','maskeli','mirmir']; st.kadro = st.kim; st.can = [3,1,1]; st.canTop = [3,1,1]; st.hy = [2, 5, 6]; st.gor = [true, false, false]; st.bos = st.bos.map(() => null); st.secili = 2;", 'hylGuncelle'); await foto('hyl-zor');
    await seri(5, ['10', '0', '0']); await p.waitForTimeout(3600); h = await oku(Hh); esit(h.can[0], 1, '10 iki kalp'); esit(h.hy[0], 2, 'zırhlı kaçmaz'); esit(h.yakalanan, 0, 'henüz yakalanmadı'); await foto('hyl-zirh');
    await seri(6, ['9', '0', '0']); await p.waitForTimeout(700); await foto('hyl-yakala'); await p.waitForTimeout(3000); h = await oku(Hh); esit(h.yakalanan, 1, 'son kalp yakalar');
    // 4) 🎒 hırsız: zayıf okta kaçar ve kavanozdakini salar; geri al hepsini döndürür
    await yaz(Hh, "st.gor = [false, true, false]; st.secili = 5;", 'hylGuncelle'); const kv0 = (await oku(HK)).kavanoz; await seri(7, ['3', '0', '0']); await p.waitForTimeout(2200); await foto('hyl-hirsiz'); await p.waitForTimeout(2400); h = await oku(Hh); esit(h.yakalanan, 0, 'kavanoz boşaldı'); dogrula(h.hy[0] >= 0 && h.gor[0], 'salınan hayalet görünür'); dogrula(h.hy[1] !== 5 && h.gor[1], 'hırsız kaçtı, görünür'); esit((await oku(HK)).kavanoz, kv0 - 1, 'toplam kavanoz azaldı');
    await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); }); await p.waitForTimeout(600); h = await oku(Hh); esit(h.yakalanan, 1, 'geri al kavanozu döndürür'); esit((await oku(HK)).kavanoz, kv0, 'geri al toplamı döndürür');
    // 5) 💡 ışık: ilk iyi ok yakar · 💃 dans: hayalet eşyasıyla gider
    await p.evaluate(() => hylOlayTest('isik')); await p.waitForTimeout(2600); await foto('hyl-isik'); const ac0 = JSON.stringify((await oku(Hh)).bos); await seri(8, ['9', '0', '0']); await p.waitForTimeout(3600); h = await oku(Hh); esit(h.isik, false, 'ışık yandı'); esit(JSON.stringify(h.bos), ac0, 'ışık oku eşya açmaz');
    { const es = (q) => q.hy.map((x) => x < 0 ? '-' : q.es[x].n).join(), bs = (q) => q.es.map((e, i) => e.n + ':' + q.bos[i]).sort().join(), once = await oku(Hh); await p.evaluate(() => hylOlayTest('dans')); await p.waitForTimeout(1000); await foto('hyl-dans'); await p.waitForTimeout(1600); h = await oku(Hh); esit(es(h), es(once), 'hayalet eşyasıyla gider'); esit(bs(h), bs(once), 'boşlar eşyasıyla gider'); dogrula(h.es.map((e) => e.n).join() !== once.es.map((e) => e.n).join(), 'sıra değişti'); esit(h.es.map((e) => e.x).join(), once.es.map((e) => e.x).join(), 'yerler aynı'); }
    // 6) ŞİMDİ ATIYOR kartı ince
    { const b = await p.evaluate(() => { const r = document.querySelector('#hyl-kim .kk-kutu').getBoundingClientRect(); return { w: r.width, h: r.height }; }); dogrula(b.h <= 64, 'ŞİMDİ ATIYOR ince olmalı: ' + JSON.stringify(b)); }
    await p.click('#hyl-kim .kk-ana'); await p.waitForTimeout(300); esit(await p.locator('.kk-yuzler button').count(), 24, '24 yüz'); await p.locator('.kk-yuzler button[data-j="5"]').click(); await p.waitForTimeout(200); esit(await p.evaluate(() => _kmOyunAktifIndex), 5, 'yüz seçimi');
    // 7) oda temiz → kapılar; tekrar etmeyen kadro; seviye teklifi
    await yaz(Hh, "st.kim = ['dili']; st.kadro = st.kim; st.can = [1]; st.canTop = [1]; st.hy = [0]; st.gor = [true]; st.bos = st.bos.map(() => null); st.secili = 0; st.yakalanan = 0; st.kav = [];", 'hylGuncelle'); await p.evaluate(([k]) => { const a = 'dag_km_hylkalici_' + eval(k), K = JSON.parse(localStorage.getItem(a)); K.ust = 1; localStorage.setItem(a, JSON.stringify(K)); }, [KON]);
    await seri(9, ['9', '0', '0']); await p.waitForTimeout(5200); h = await oku(Hh); let Kk = await oku(HK); esit(h.faz, 'temiz', 'oda temiz'); esit(Kk.oda, 1, 'sıradaki oda'); await foto('hyl-temiz'); await p.click('#hyl-ust'); await p.waitForTimeout(400); h = await oku(Hh); esit(h.zor, 'kabus', 'üst seviye'); esit(h.faz, 'kapi', 'sıradaki kapılar');
    const tum = await p.evaluate(() => { const g = []; for (let i = 0; i < 4; i++) g.push(hylOdaTest('kolay', false).kim); return g; }); esit(new Set(tum.slice(0, 3).flat()).size, 12, 'üç odada 12 ayrı hayalet');
    // 8) süre dolar → gece; patron
    await oda('normal', false, 'banyo'); await yaz(Hh, "st.olaylar = []; st.saat = st.maxSaat - 1;", 'hylGuncelle'); await seri(10, ['0', '0', '0']); await p.waitForTimeout(7200); esit((await oku(Hh)).faz, 'gece', 'süre doldu'); await p.click('#hyl-rov'); await p.waitForTimeout(300); esit((await oku(Hh)).oid, 'banyo', 'rövanş aynı oda');
    await oda('normal', true); h = await oku(Hh); esit(h.kim.join(), 'kral', '1. sezon patronu'); esit(h.can[0], 4, 'Normal patron 4 kalp'); await yaz(Hh, "st.olaylar = []; st.maxSaat = 20; st.gor = [true]; st.secili = st.hy[0];", 'hylGuncelle'); await p.waitForTimeout(600); await foto('hyl-patron');
    for (let k = 0; k < 4; k++) { await yaz(Hh, "st.secili = st.hy[0];", 'hylGuncelle'); await seri(11 + k, ['9', '0', '0']); await p.waitForTimeout(k < 3 ? 4000 : 6000); }
    h = await oku(Hh); Kk = await oku(HK); esit(h.faz, 'final', 'konak temiz'); esit(Kk.sezon, 2, 'yeni sezon'); esit(Kk.oda, 0, 'oda başa'); await p.click('#hyl-yeni'); await p.waitForTimeout(400); esit((await oku(Hh)).faz, 'kapi', 'yeni konak'); esit(await p.evaluate(() => hylOdaTest('normal', true).kim.join()), 'kaptan', '2. sezon patronu başka');
    // 9) seviye kalıcı, albüm, eski kayıt
    await p.evaluate(() => document.getElementById('hyl-album-btn').click()); await p.waitForTimeout(500); esit(await p.locator('.hyl-album canvas').count(), 36, 'albüm 36'); await foto('hyl-album'); await p.click('#hyl-kapat');
    await oda('zor', false); await p.evaluate(([k]) => localStorage.setItem('dag_km_hayalet_' + eval(k), JSON.stringify({ tarih: bugunISO(), zor: 'kolay', es: [{ t: 'dolap' }], hy: [0] })), [KON]); await p.evaluate(() => hylGuncelle()); h = await oku(Hh); esit(h.faz, 'kapi', 'eski kayıt yenilenir'); esit(h.zor, 'zor', 'seviye kalıcı');
    // 10) telefon
    { const t2 = await sayfaAc({ genislik: 390, yukseklik: 844 }); try { await uygulamaAc(t2.p); await karisikSinifArac(t2.p, 'oyunlar'); await t2.p.evaluate(() => { const a = []; ['minikler', 'kucukler', 'yildizlar'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) a.push({ g, ad }); })); _kmListe = a.slice(0, 24); kmOyunRosterYenile(); kmOyunTemaSec('hayalet'); });
      await t2.p.waitForFunction(() => typeof hylOdaTest === 'function' && !!document.getElementById('hyl-cv'), null, { timeout: 60000 }); await t2.p.waitForTimeout(900); if (CIKTI) await t2.p.screenshot({ path: CIKTI + '/hyl-tel-kapi.png' });
      const tas = await t2.p.evaluate(() => { const k = document.querySelector('.hyl-kart'); return k ? k.scrollWidth - k.clientWidth : 0; }); dogrula(tas <= 1, 'telefonda kapı kartı yana taşmamalı: ' + tas);
      await t2.p.evaluate(() => hylOdaTest('zor', false, 'oyuncak')); await t2.p.waitForTimeout(1200); dogrula(await t2.p.evaluate(() => /ve üstü at/.test(document.getElementById('hyl-simdi').textContent)), 'telefonda büyük cümle'); if (CIKTI) await t2.p.screenshot({ path: CIKTI + '/hyl-tel.png' }); esit(t2.hatalar.length, 0, 'telefon: ' + t2.hatalar.join(' | ')); } finally { await t2.ctx.close(); } }
    if (CIKTI) { for (const [z, o] of [['normal', 'oyuncak'], ['efsane', 'bahce'], ['kabus', 'gemi']]) { await oda(z, false, o); await yaz(Hh, "st.gor = st.gor.map((_, k) => k % 2 === 0); st.olaylar = [];", 'hylGuncelle'); await p.waitForTimeout(900); await foto('hyl-' + o); } }
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kapı · portre · v459 kuralları · zırh · hırsız + geri al · ışık · dans · ince kart · üst seviye · tekrarsız kadro · gece · patron · albüm · kalıcı seviye · telefon');
  } finally { await ctx.close(); }
}
