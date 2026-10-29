// 🏰 Kale Savunması › hep birlikte + özel oklar + atölye (2026-10-29, v342; kullanıcı: "en son atan sanki kaleyi kurtarmış hissi
// veriyorsun, canavarda da öyle — aslında toplu yapıyorlar, bu hissiyatı vermek lazım").
// 🛡️ kapının dibindeki düşman düşünce "SON ANDA" ona vuran HERKESLE; ❄️ buz (üç sarı) 2 adım dondurur; ⚡ 10-10-10 bütün düşmanlara
// −10; 🎯 8-8-8 zırhı deler; 🔨 atölye (altınla mancınık/hendek/sur) sahneye ve seriye işler; dalga temiz → o dalgada vuran herkese
// rozet + "HEP BİRLİKTE"; 📜 defter + WhatsApp; Ortak Canavar yenilince son vuranı değil birlikte vuranları söyler; 390 px atölye taşmaz.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => localStorage.getItem('dag_km_kale_' + (_kmAktifKonum || 'varsayilan')));
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
    const yaz = async (fn, arg) => { await p.evaluate(([a, f, arg]) => { const k = a + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); new Function('st', 'arg', f)(st, arg); localStorage.setItem(k, JSON.stringify(st)); kmOyunSahneKurKale(); }, [K, fn, arg]); await p.waitForTimeout(300); };
    // sıradaki (kaydı olan) atıcının ve başka bir sporcunun anahtarı
    const kimler = () => p.evaluate(() => {
      const var_ = (s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad];
      for (let k = 0; k < _kmOyunRosterCache.length; k++) { if (var_(_kmOyunRosterCache[_kmOyunAktifIndex])) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      const a = _kmOyunRosterCache[_kmOyunAktifIndex], b = _kmOyunRosterCache.find((s) => s !== a && var_(s));
      return { atan: a.g + '|' + a.ad, diger: b.g + '|' + b.ad, digerAd: kmOyunIlkAd(b.ad), digerG: b.g, digerTam: b.ad };
    });
    const seri = (oklar) => p.evaluate(async (oklar) => {
      // yerel test verisinde kaydı olmayan sporcuyu atla (seri yazılamaz)
      for (let k = 0; k < _kmOyunRosterCache.length; k++) { const s = _kmOyunRosterCache[_kmOyunAktifIndex]; if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) break; _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; }
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
    }, oklar);
    const devBekle = (re) => p.evaluate(async (re) => { const r = new RegExp(re); for (let k = 0; k < 60; k++) { const t = document.getElementById('kale-dev').textContent; if (r.test(t)) return t; await new Promise((x) => setTimeout(x, 100)); } return document.getElementById('kale-dev').textContent; }, re);

    // 🛡️ Son anda: kapının dibindeki goblin, önceden başka bir sporcu da vurmuştu → ikisi birlikte anılır
    let ki = await kimler();
    await yaz("st.can = 3; st.dusmanlar.forEach((d, j) => { d.tip = 'goblin'; d.can = 50; d.max = 50; d.x = 900 + j * 20; d.vuran = []; }); const g = st.dusmanlar[0]; g.x = 365; g.can = 15; g.max = 30; g.vuran = [arg];", ki.diger);
    const sonAnda = devBekle('SON ANDA');
    await seri(['7', '7', '5']);
    let st = await oku();
    esit(st.kurtarma, 1, 'son anda kurtarış sayılmadı');
    esit(st.can, 3, 'kurtarılan düşman yine de can aldı');
    const sa = await sonAnda; dogrula(/2 okçu birlikte/.test(sa) && sa.indexOf(ki.digerAd) >= 0, 'son anda mesajı birlikte vuranları söylemiyor: "' + sa + '"');
    await p.waitForTimeout(1500);

    // ❄️ Buz oku: üç sarı → bu adım ve sonraki adım donar, sonra yürürler
    await yaz("st.donma = 0; st.dusmanlar.forEach((d, j) => { d.tip = 'goblin'; d.can = 300; d.max = 300; d.x = 700 + j * 40; });");
    const x0 = (await oku()).dusmanlar.map((d) => d.x);
    await seri(['9', '10', 'X']);
    st = await oku(); esit(st.donma, 1, 'buz oku donma başlatmadı'); dogrula(st.dusmanlar.every((d, j) => d.x === x0[j]), 'buzdaki düşmanlar yürüdü');
    dogrula(await p.evaluate(() => document.getElementById('kale-dusmanlar').classList.contains('kale-donuk')), 'donuk görünüm yok');
    await p.waitForTimeout(1200);
    await seri(['5', '6', '5']);
    st = await oku(); esit(st.donma, 0, 'donma ikinci adımda bitmedi'); dogrula(st.dusmanlar.every((d, j) => d.x === x0[j]), 'ikinci donuk adımda yürüdüler');
    await p.waitForTimeout(1200);
    await seri(['5', '6', '5']);
    st = await oku(); dogrula(st.dusmanlar[0].x < x0[0], 'buz bitince düşmanlar yürümedi');
    await p.waitForTimeout(1200);

    // ⚡ Yıldırım: 10-10-10 → öndeki dışındakiler tam −10
    await yaz("st.dusmanlar.forEach((d, j) => { d.tip = 'goblin'; d.can = 100; d.max = 100; d.x = 600 + j * 50; });");
    await seri(['10', '10', '10']);
    st = await oku();
    dogrula(st.dusmanlar.slice(1).every((d) => d.can === 90), 'yıldırım arkadakilere −10 vurmadı: ' + st.dusmanlar.map((d) => d.can).join(','));
    esit(st.dusmanlar[0].can, 100 - 45 - 10, 'öndeki 3×15 + yıldırım almadı');
    esit(st.ozel.yildirim, 1, 'yıldırım sayılmadı');
    await p.waitForTimeout(1500);

    // 🎯 Delici: 8-8-8 Altın Zırhlı Goblin'in zırhını deler (normalde 9+ ister)
    await yaz("st.dusmanlar.forEach((d, j) => { d.tip = 'goblin'; d.can = 100; d.max = 100; d.x = 700 + j * 50; }); const z = st.dusmanlar[0]; z.tip = 'zirhli'; z.can = 30; z.max = 30; z.x = 600;");
    await seri(['8', '8', '8']);
    st = await oku(); esit(st.dusmanlar.find((d) => d.tip === 'zirhli').can, 6, 'delici ok zırhı delmedi');
    await p.waitForTimeout(1500);

    // 🔨 Atölye: 3 altın → mancınık + hendek + sur; sahnede çizilir, seride işler
    await yaz("st.altin = 3; st.can = 3; st.atolye = {}; st.dusmanlar = st.dusmanlar.slice(0, 2); st.dusmanlar.forEach((d, j) => { d.tip = 'goblin'; d.can = 50; d.max = 50; d.x = 600 + j * 200; });");
    await p.click('#kale-atolye-btn'); await p.waitForTimeout(400);
    for (const id of ['mancinik', 'hendek', 'sur']) { await p.click(`#kale-atolye [data-at="${id}"]`); await p.waitForTimeout(250); }
    st = await oku();
    esit(st.altin, 0, 'altın harcanmadı'); esit(st.atolye.mancinik, 1, 'mancınık alınmadı'); esit(st.atolye.hendek, 1, 'hendek alınmadı'); esit(st.can, 4, 'sur onarımı +1 can vermedi');
    dogrula(await p.evaluate(() => !!document.querySelector('.kale-mancinik') && !!document.querySelector('.kale-hendek')), 'mancınık/hendek sahnede çizilmedi');
    dogrula(await p.evaluate(() => /🧡/.test(document.getElementById('kale-canlar').textContent)), 'fazladan can görünmüyor');
    const once = await oku();
    await seri(['M', 'M', 'M']);
    st = await oku();
    const arka0 = once.dusmanlar[1], arka = st.dusmanlar.find((d) => d.id === arka0.id);
    esit(arka.can, 47, 'mancınık en arkadakine −3 vurmadı');
    dogrula(Math.abs((arka0.x - arka.x) - once.adim * 0.85) < 0.01, `hendek adımı %15 kısaltmadı (${arka0.x - arka.x} / ${once.adim})`);
    await p.waitForTimeout(2000);

    // 🤝 Dalga temiz: o dalgada vuran herkes (atan + önceki atan) rozet alır, "HEP BİRLİKTE" + altın
    ki = await kimler();
    const rozet0 = await p.evaluate(([g, ad]) => { const sp = turnuvaDB[g][ad]; return (sp.oyun && sp.oyun.kale && sp.oyun.kale.temizledi) || 0; }, [ki.digerG, ki.digerTam]);
    await yaz("st.altin = 0; st.dalgaKatki = {}; st.dalgaKatki[arg] = 12; st.dusmanlar.forEach((d) => { d.can = 3; d.max = 3; d.tip = 'goblin'; });", ki.diger);
    const dalga0 = (await oku()).dalga;
    const birlikte = devBekle('HEP BİRLİKTE');
    await seri(['7', '6', '5']);
    st = await oku();
    esit(st.dalga, dalga0 + 1, 'dalga temizlenmedi'); dogrula(st.altin >= 1, 'dalga altın vermedi');
    const rozet1 = await p.evaluate(([g, ad]) => { const sp = turnuvaDB[g][ad]; return (sp.oyun && sp.oyun.kale && sp.oyun.kale.temizledi) || 0; }, [ki.digerG, ki.digerTam]);
    esit(rozet1, rozet0 + 1, 'son atmayan ama dalgaya vuran sporcu rozet almadı');
    const bt = await birlikte; dogrula(/HEP BİRLİKTE/.test(bt) && bt.indexOf(ki.digerAd) >= 0 && !/düşüren/.test(bt), 'tören birlikte vuranları söylemiyor: "' + bt + '"');
    dogrula(await p.evaluate(() => !document.querySelector('#kale-cocuklar text') || ![...document.querySelectorAll('#kale-cocuklar text')].some((t) => t.textContent === '👑')), 'tek kişiye taç takıldı');
    await p.waitForTimeout(5200);
    dogrula(await p.evaluate(() => document.getElementById('kale-atolye').classList.contains('goster')), 'tören sonrası altın varken atölye açılmadı');

    // 📜 Defter + WhatsApp
    await p.evaluate(() => document.getElementById('kale-atolye').classList.remove('goster'));
    await p.click('#kale-defter-btn'); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => /Kale Defteri/.test(document.getElementById('kale-dev').textContent) && /okçu hep birlikte/.test(document.getElementById('kale-dev').textContent) && !!document.getElementById('kale-wa')), 'defter / WhatsApp düğmesi yok');
    await p.evaluate(() => document.getElementById('kale-dev').click());

    // 🐉 Ortak Canavar: yenilince birlikte vuranlar
    const cnv = await p.evaluate(() => { const c = { istat: { a: { ad: 'ALP KAYA', hasar: 5 }, b: { ad: 'EMRE ŞEN', hasar: 3 }, c: { ad: 'CAN ER', hasar: 0 } } }; return [kmCanavarBirlikteYazi(c), kmCanavarBirlikteAdlar(c)]; });
    dogrula(/2 okçu hep birlikte/.test(cnv[0]) && !/son vuruş/i.test(cnv[0]), 'canavar banner\'ı birlikte demiyor: ' + cnv[0]);
    dogrula(/alp/i.test(cnv[1]) && /emre/i.test(cnv[1]) && !/can/i.test(cnv[1]), 'canavar özeti birlikte vuranları listelemiyor: ' + cnv[1]);

    // 390 px: atölye kartı ekrana sığar
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    await yaz('st.altin = 2;'); await p.evaluate(() => document.getElementById('kale-atolye-btn').onclick()); await p.waitForTimeout(500);
    const kut = await p.locator('#kale-atolye').boundingBox();
    dogrula(kut && kut.x >= 0 && kut.x + kut.width <= 390 + 1, 'atölye kartı 390 px\'te taşıyor: ' + JSON.stringify(kut));
    dogrula(hatalar.length === 0, 'sayfa hataları: ' + hatalar.join(' | '));
    log('son anda birlikte · buz 2 adım · yıldırım −10 · delici zırh · atölye mancınık/hendek/sur · temiz → herkese rozet + HEP BİRLİKTE · defter · canavar birlikte · 390 px');
  } finally {
    try { await p.evaluate((y) => { const k = 'dag_km_kale_' + (_kmAktifKonum || 'varsayilan'); if (y) localStorage.setItem(k, y); else localStorage.removeItem(k); }, yedek); } catch (e) { }
    await ctx.close();
  }
}
