// 🎗️ Aidat: sporcu kartından muaf + aidat başlangıcı (2026-10-23, kullanıcı: "sporcu kartlarının içerisinde aidat bölümünde muaf olarak
// da işaretleyebileyim · yeni kayıtlı sporcular 6 ay hiç ödemedi diyor, yanlış"). Katılma tarihi yoksa aidat ilk ödeme / ilk dersten
// başlar (apBaslangic); karttan 🎗️ Muaf yap ve 📌 Bu aydan başladı. DAĞ bellekte, sonunda geri alınır.
import { sayfaAc, uygulamaAc, yoneticiAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const n = new Date(), ay = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
  const ayEkle = (a, k) => { let p = a.split('-').map(Number), d = new Date(p[0], p[1] - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await yoneticiAc(p);
    await p.waitForSelector('#yn-genel .ap-kpi', { timeout: 30000, state: 'attached' });
    // hesap: sahte adaptör — yeni sporcu yalnız bu ay ödedi → eski borç yok; katılma tarihi olan eski sporcu → borç sayılır
    const h = await p.evaluate(({ ay, ayEkle }) => {
      ayEkle = new Function('return ' + ayEkle)();
      let kayit = { ['YENI|' + ay]: { odendi: true, tutar: 1000 }, ['ESKI|' + ayEkle(ay, -4)]: { odendi: true, tutar: 1000 } };
      let a = { kisiler: () => [{ id: 'g|YENI', ad: 'YENI', grup: 'g', katilma: '' }, { id: 'g|ESKI', ad: 'ESKI', grup: 'g', katilma: ayEkle(ay, -8) + '-01' }, { id: 'g|DERS', ad: 'DERS', grup: 'g', katilma: '' }],
        kayit: (ad, m) => kayit[ad + '|' + m] || null, aylik: () => 1000, ilkGelis: (k) => k.ad === 'DERS' ? ayEkle(ay, -1) + '-10' : null };
      // DERS: hiç ödemesi yok ama geçen ay derse başladı → takip dışı (eski kural) kalır, eski borç yazılmaz
      let v = apOzet(a, ay), s = ad => v.satirlar.find(x => x.k.ad === ad);
      let v2 = apOzet(a, ayEkle(ay, -1));
      return { yeni: s('YENI').gec, yeniD: s('YENI').d, eski: s('ESKI').gec, ders: s('DERS').gec, gecenAyYeni: v2.satirlar.find(x => x.k.ad === 'YENI').d, bas: apBaslangic(a, a.kisiler()[0]), basD: apBaslangic(a, a.kisiler()[2]) };
    }, { ay, ayEkle: ayEkle.toString() });
    esit(h.yeni, 0, 'yeni sporcuya eski borç yazılmamalı');
    esit(h.yeniD, 'odedi', 'yeni sporcu bu ay ödedi');
    esit(h.gecenAyYeni, 'yeni', 'geçen ay yeni sporcu "henüz kayıtlı değildi" olmalı');
    esit(h.eski, 3, 'katılma tarihli eski sporcunun ödeme sonrası 3 ayı borç');
    esit(h.ders, 0, 'ödemesi olmayan sporcuya eski borç yok');
    dogrula(h.bas && h.bas.ay === ay && h.bas.kaynak === 'odeme', 'başlangıç ilk ödemeden: ' + JSON.stringify(h.bas));
    dogrula(h.basD && h.basD.ay === ayEkle(ay, -1) && h.basD.kaynak === 'gelis', 'başlangıç ilk dersten: ' + JSON.stringify(h.basD));
    // kart: aktif bir sporcu, aidatı geçici olarak "yalnız bu ay ödedi"
    yedek = await p.evaluate(({ ay }) => {
      let g = AIDAT_GRUPLAR.find((x) => Object.keys(turnuvaDB[x] || {}).some((ad) => !turnuvaDB[x][ad].pasif && !turnuvaDB[x][ad].donduruldu && !turnuvaDB[x][ad].aidatMuaf && yonKisiTuru(x, ad) === 'sporcu'));
      let ad = Object.keys(turnuvaDB[g]).find((a) => !turnuvaDB[g][a].pasif && !turnuvaDB[g][a].donduruldu && !turnuvaDB[g][a].aidatMuaf && yonKisiTuru(g, a) === 'sporcu');
      let sp = turnuvaDB[g][ad], y = { g, ad, kayit: JSON.stringify(aidatDB[ad] || null), kilit: _aidatKilitAcikMi, katilma: sp.katilmaTarihi || null, muaf: !!sp.aidatMuaf, lm: sp.lastModified };
      window.__eskiPut = _aidatDuesPut; _aidatDuesPut = function () {};
      aidatDB[ad] = { [ay]: { odendi: true, tutar: 1500, odemeTarihi: ay + '-02' } }; sp.katilmaTarihi = null; _aidatKilitAcikMi = true; window.confirm = () => true;
      return y;
    }, { ay });
    await p.evaluate((y) => ynKartAc(y.g + '|' + y.ad), yedek);
    await p.waitForSelector('#yn-kart .yn-aidat-ayar', { timeout: 5000 });
    const k1 = await p.evaluate(() => ({ bor: document.querySelectorAll('#yn-kart .yn-aylar button.bor').length, ayar: document.querySelector('#yn-kart .yn-aidat-ayar').textContent, kpi: document.querySelector('#yn-kart .ap-kpi').textContent }));
    // ilk dersi bu aydan önceyse o aydan sayılır; bu testte en az "6 ay ödenmemiş" yazmamalı (eski hata)
    dogrula(!/6 ay ödenmemiş/.test(k1.kpi), 'yeni sporcu kartında 6 ay ödenmemiş yazmamalı: ' + k1.kpi);
    dogrula(/Aidat başlangıcı/.test(k1.ayar), 'aidat başlangıcı satırı yok');
    // 🎗️ Muaf yap → kaydedilir, ızgara "muaf" olur; tekrar dokun → kalkar
    await p.locator('#yn-kart .yn-aidat-ayar button[aria-pressed]').click(); await p.waitForTimeout(400);
    const m1 = await p.evaluate((y) => ({ muaf: turnuvaDB[y.g][y.ad].aidatMuaf, kpi: document.querySelector('#yn-kart .ap-kpi').textContent, btn: document.querySelector('#yn-kart .yn-aidat-ayar button[aria-pressed]').textContent }), yedek);
    dogrula(m1.muaf === true && /Muaf/.test(m1.kpi) && /kaldır/.test(m1.btn), 'muaf yapılamadı: ' + JSON.stringify(m1));
    await p.locator('#yn-kart .yn-aidat-ayar button[aria-pressed]').click(); await p.waitForTimeout(400);
    esit(await p.evaluate((y) => turnuvaDB[y.g][y.ad].aidatMuaf, yedek), false, 'muaf kaldırılamadı');
    // 📌 Bu aydan başladı: 2 ay önceye dokun → katılma o ayın 1'i
    const hedef = ayEkle(ay, -2);
    await p.evaluate(({ hedef }) => ynKartAySec(hedef), { hedef }); await p.waitForSelector('#yn-k-tutar');
    await p.evaluate(() => [...document.querySelectorAll('#yn-kart .ap-form .ap-btn')].find((b) => /Bu aydan başladı/.test(b.textContent)).click()); await p.waitForTimeout(400);
    const b1 = await p.evaluate((y) => ({ k: turnuvaDB[y.g][y.ad].katilmaTarihi, ayar: document.querySelector('#yn-kart .yn-aidat-ayar').textContent }), yedek);
    esit(b1.k, hedef + '-01', 'katılma tarihi seçilen ay olmalı');
    dogrula(/katılma tarihi/.test(b1.ayar), 'başlangıç kaynağı katılma tarihi olmalı: ' + b1.ayar);
    // ❄️ ödenmemiş ayları toplu dondur → borç sayılmaz; tek ayı geri al
    const borlar = await p.evaluate(() => document.querySelectorAll('#yn-kart .yn-aylar button.bor').length);
    dogrula(borlar >= 2, 'başlangıç sonrası ödenmemiş aylar kırmızı olmalı: ' + borlar);
    await p.evaluate(() => [...document.querySelectorAll('#yn-kart .yn-aidat-ayar .ap-btn')].find((b) => /dondur/.test(b.textContent)).click()); await p.waitForTimeout(400);
    const d1 = await p.evaluate(({ y, m }) => ({ r: aidatDB[y.ad][m], dd: apDondu(aidatDB[y.ad][m]), bor: document.querySelectorAll('#yn-kart .yn-aylar button.bor').length, dondu: document.querySelectorAll('#yn-kart .yn-aylar button.dondu').length,
      gec: apOzet(aidatPanelAdaptor()).satirlar.find((s) => s.k.ad === y.ad).gec, kpi: document.querySelector('#yn-kart .ap-kpi').textContent }), { y: yedek, m: ayEkle(ay, -1) });
    dogrula(d1.r && d1.r.odendi === false && d1.dd, 'dondurulmuş kayıt yok: ' + JSON.stringify(d1.r));
    dogrula(d1.bor === 0 && d1.dondu >= 2 && d1.gec === 0 && /Güncel/.test(d1.kpi), 'dondurulan aylar borç sayılmamalı: ' + JSON.stringify(d1));
    await p.evaluate(({ m }) => ynKartAySec(m), { m: ayEkle(ay, -1) }); await p.waitForSelector('#yn-k-tutar');
    await p.evaluate(() => [...document.querySelectorAll('#yn-kart .ap-form .ap-btn')].find((b) => /Dondurmayı kaldır/.test(b.textContent)).click()); await p.waitForTimeout(400);
    dogrula(await p.evaluate(({ y, m }) => !aidatDB[y.ad][m], { y: yedek, m: ayEkle(ay, -1) }), 'dondurma kaldırılamadı');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-muaf.png' });
    await p.evaluate(() => ynKartKapat());
    log('muaf + başlangıç tamam');
  } finally {
    if (yedek) await p.evaluate((y) => {
      let sp = turnuvaDB[y.g][y.ad]; sp.katilmaTarihi = y.katilma; sp.aidatMuaf = y.muaf; sp.lastModified = Date.now(); bekleyenGonderim = true;
      let k = JSON.parse(y.kayit); if (k) aidatDB[y.ad] = k; else delete aidatDB[y.ad]; aidatKaydet(); _aidatKilitAcikMi = y.kilit; _aidatDuesPut = window.__eskiPut;
    }, yedek).catch(() => {});
    await ctx.close();
  }
  dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
}
