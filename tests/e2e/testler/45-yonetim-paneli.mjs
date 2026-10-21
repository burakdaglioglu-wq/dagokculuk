// 🏠 Yönetim paneli (2026-10-21, kullanıcı: "aidattaki panel gibi bütün yönetici panelini düzelt · yönetici sekmesini açınca tam sayfa
// açılsın, sporcu sekmesinin üstüne açılmış gibi kasmasın · sporcu kartına tıklayınca halledeyim (pasife aldığım sporcunun geldiği
// aylardaki ödemesini düzelteyim) · raporlar ekrandaki gibi PDF · hem Milo hem DAĞ"). Ortak /yonetim-panel.js (ynCiz, ynKartAc, ynPdf).
// DAĞ: bellekte geçici aidat kaydı (_aidatDuesPut susturulur), pasif değişikliği sonunda geri alınır. Milo: test üyesi açılır, silinir.
import { sayfaAc, uygulamaAc, yoneticiAc, miloApi, miloOturumAl, benzersiz, B, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const n = new Date(), ay = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'), bugun = ay + '-' + String(n.getDate()).padStart(2, '0');
  const ayEkle = (a, k) => { let p = a.split('-').map(Number), d = new Date(p[0], p[1] - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  // ---- DAĞ ----
  {
    const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
    let yedek = null;
    try {
      await uygulamaAc(p);
      await yoneticiAc(p);
      await p.waitForSelector('#yn-genel .ap-kpi', { timeout: 30000, state: 'attached' });
      // tam sayfa: arkadaki uygulama gizli
      const tam = await p.evaluate(() => ({ sinif: document.body.classList.contains('yon-acik'), skor: getComputedStyle(document.getElementById('icerik-skor')).display, ust: getComputedStyle(document.getElementById('ust-bar')).display }));
      dogrula(tam.sinif && tam.skor === 'none' && tam.ust === 'none', 'yönetici tam sayfa açılmalı (arka ekran gizli): ' + JSON.stringify(tam));
      dogrula(await p.locator('#yn-genel .ap-kpi > button').count() >= 5, 'özet kutuları eksik');
      // aidat sayısı her yerde aynı hesaptan
      const say = await p.evaluate(() => { let s = yoneticiSayilar(); return { s: s.aidat, a: Object.keys(aidatDB || {}).length ? apOzet(aidatPanelAdaptor()).bek.length : null }; });
      esit(say.s, say.a, 'kenar rozeti / şerit aidat sayısı aidat paneliyle aynı olmalı');
      yedek = await p.evaluate(({ ay }) => {
        let g = AIDAT_GRUPLAR.find((x) => Object.keys(turnuvaDB[x] || {}).some((ad) => !turnuvaDB[x][ad].pasif && !turnuvaDB[x][ad].donduruldu && yonKisiTuru(x, ad) === 'sporcu'));
        let ad = Object.keys(turnuvaDB[g]).find((a) => !turnuvaDB[g][a].pasif && !turnuvaDB[g][a].donduruldu && yonKisiTuru(g, a) === 'sporcu');
        let y = { g, ad, kayit: JSON.stringify(aidatDB[ad] || null), kilit: _aidatKilitAcikMi };
        window.__putSay = 0; window.__eskiPut = _aidatDuesPut; _aidatDuesPut = function () { window.__putSay++; };
        aidatDB[ad] = {}; _aidatKilitAcikMi = true; window.confirm = () => true;
        return y;
      }, { ay });
      // arama → sporcu kartı
      await p.locator('#yn-ara-girdi').fill(yedek.ad.slice(0, Math.min(6, yedek.ad.length)));
      await p.waitForSelector('#yn-ara-liste button', { timeout: 5000 });
      await p.evaluate((ad) => { let b = [...document.querySelectorAll('#yn-ara-liste button')].find((x) => x.textContent.includes(ad)); (b || document.querySelector('#yn-ara-liste button')).click(); }, yedek.ad);
      await p.waitForSelector('#yn-kart .yn-aylar button', { timeout: 5000 });
      await p.evaluate((y) => ynKartAc(y.g + '|' + y.ad), yedek); await p.waitForTimeout(100);
      esit(await p.locator('#yn-kart .yn-aylar button').count(), 12, '12 aylık aidat ızgarası');
      // bu ayı kart üzerinden ödendi yap
      const ayNo = +ay.slice(5, 7);
      await p.locator('#yn-kart .yn-aylar button').nth(ayNo - 1).click();
      await p.waitForSelector('#yn-k-tutar');
      await p.fill('#yn-k-tutar', '1750'); await p.fill('#yn-k-not', 'Karttan düzeltildi');
      await p.locator('#yn-kart .ap-form .ap-btn.iyi').click(); await p.waitForTimeout(300);
      const r = await p.evaluate(({ y, ay }) => ({ k: aidatDB[y.ad][ay], put: window.__putSay }), { y: yedek, ay });
      dogrula(r.k && r.k.odendi && r.k.tutar === 1750 && r.k.notMetin === 'Karttan düzeltildi' && r.k.odemeTarihi === bugun, 'karttan ödeme kaydı yanlış: ' + JSON.stringify(r.k));
      esit(r.put, 1, 'sunucuya bir kez gönderilmeli');
      dogrula(/Ödendi/.test(await p.locator('#yn-kart').textContent()), 'kart güncellenmedi');
      // ödenmedi yap (temizle)
      await p.locator('#yn-kart .yn-aylar button').nth(ayNo - 1).click(); await p.waitForSelector('#yn-k-tutar');
      await p.evaluate(() => [...document.querySelectorAll('#yn-kart .ap-form .ap-btn')].find((b) => /Ödenmedi/.test(b.textContent)).click()); await p.waitForTimeout(300);
      dogrula(await p.evaluate(({ y, ay }) => !aidatDB[y.ad][ay], { y: yedek, ay }), 'ödenmedi yapılamadı');
      // pasife al → aktif et (sporcu kartı)
      await p.evaluate(() => [...document.querySelectorAll('#yn-kart .ap-btn')].find((b) => /Pasife al/.test(b.textContent)).click()); await p.waitForTimeout(300);
      dogrula(await p.evaluate((y) => turnuvaDB[y.g][y.ad].pasif === true, yedek), 'pasife alınmadı');
      dogrula(/Pasif/.test(await p.locator('#yn-kart').textContent()), 'kartta pasif görünmüyor');
      await p.evaluate(() => [...document.querySelectorAll('#yn-kart .ap-btn')].find((b) => /Aktif et/.test(b.textContent)).click()); await p.waitForTimeout(300);
      dogrula(await p.evaluate((y) => turnuvaDB[y.g][y.ad].pasif === false, yedek), 'aktif edilmedi');
      if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-kart.png' });
      await p.evaluate(() => ynKartKapat());
      // Sporcular & Skor listesinden de kart açılır
      await p.evaluate((y) => yoneticiKartAc(y.g, y.ad), yedek); await p.waitForSelector('#yn-kart .yn-aylar button', { timeout: 10000 });
      dogrula((await p.locator('#yn-kart h2').textContent()) === yedek.ad, 'listeden açılan kart yanlış sporcu');
      await p.evaluate(() => ynKartKapat());
      // aidat kutusu → aidat paneli ödemeyenler listesi
      await p.evaluate(() => ynGit('aidat', { liste: 'bekleyen' }));
      await p.waitForSelector('#ap-kok .ap-sekmeler', { timeout: 20000 });
      esit(await p.evaluate(() => AP.liste), 'bekleyen', 'ödemeyenler listesi açılmalı');
      await p.evaluate(() => yoneticiSekme('panel')); await p.waitForSelector('#yn-genel', { state: 'attached' });
      if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-genel.png', fullPage: false });
      // ekran PDF'i (ekrandaki görünüm)
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.evaluate(() => ynPdf(document.getElementById('yn-genel'), 'genel-bakis'))]);
      dogrula(/genel-bakis/.test(dl.suggestedFilename()), 'PDF adı: ' + dl.suggestedFilename());
      if (process.env.E2E_EKRAN) await dl.saveAs(process.env.E2E_EKRAN + '-genel.pdf');
      // telefon genişliği
      await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => yoneticiSekme('panel')); await p.waitForTimeout(300);
      dogrula(await p.evaluate(() => { let e = document.querySelector('#yn-genel'); return e && e.scrollWidth <= e.clientWidth + 1; }), 'telefonda panel yana taşıyor');
      if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-tel.png' });
      await p.evaluate(() => yoneticiPaneliKapat());
      dogrula(await p.evaluate(() => !document.body.classList.contains('yon-acik')), 'kapanınca tam sayfa sınıfı kalkmalı');
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    } finally {
      if (yedek) await p.evaluate((y) => { try { _aidatDuesPut = window.__eskiPut; let k = JSON.parse(y.kayit); if (k) aidatDB[y.ad] = k; else delete aidatDB[y.ad]; if (turnuvaDB[y.g][y.ad].pasif) sporcuPasifAyarla(y.g, y.ad, false); _aidatKilitAcikMi = y.kilit; } catch (e) {} }, yedek).catch(() => {});
      await p.waitForTimeout(1500); // pasif geri alımı sunucuya gitsin
      await ctx.close();
    }
  }
  // ---- Milo ----
  const G = 'E2E Grup', A = benzersiz('YN ');
  try {
    await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: G, ad: A, acilTelefon: '05551112244' }) });
    await miloApi(`/members/${encodeURIComponent(G)}/${encodeURIComponent(A)}`, { method: 'PATCH', body: JSON.stringify({ pasif: 1 }) });
    await miloApi(`/dues/${encodeURIComponent(A)}/${ayEkle(ay, -1)}`, { method: 'PUT', body: JSON.stringify({ odendi: true, tutar: 800, tarih: bugun, odemeTarihi: ayEkle(ay, -1) + '-03' }) });
    const tok = await miloOturumAl();
    const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 1280, yukseklik: 900 });
    try {
      await ctx.addInitScript((t) => { try { localStorage.setItem('milo_oturum', t); } catch (e) {} }, tok);
      await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof miloUygulamayaGir === 'function', null, { timeout: 30000 });
      await p.evaluate(() => miloUygulamayaGir()); await p.waitForTimeout(800);
      await p.evaluate(() => miloSekme('genel')); await p.waitForSelector('#milo-icerik #yn-genel .ap-kpi', { timeout: 30000 });
      dogrula(await p.locator('#yn-genel .ap-kpi > button').count() >= 5, 'Milo özet kutuları eksik');
      // pasif üye aramada bulunur, kart açılır, geldiği ayın ödemesi düzeltilir
      await p.locator('#yn-ara-girdi').fill(A); await p.waitForSelector('#yn-ara-liste button');
      dogrula(/pasif/.test(await p.locator('#yn-ara-liste').textContent()), 'aramada pasif etiketi yok');
      await p.locator('#yn-ara-liste button').first().click(); await p.waitForSelector('#yn-kart .yn-aylar button');
      await p.locator('#yn-kart .yn-aylar button').nth(+ay.slice(5, 7) - 1).click(); await p.waitForSelector('#yn-k-tutar');
      esit(await p.inputValue('#yn-k-tutar'), '800', 'aylık tutar son ödemeden gelmeli');
      await p.locator('#yn-kart .ap-form .ap-btn.iyi').click();
      await p.waitForFunction(() => !document.querySelector('#yn-kart .ap-form'), null, { timeout: 15000 });
      const d = (await miloApi('/dues')).d.dues.find((x) => x.ad === A && x.ay === ay);
      dogrula(d && d.odendi && d.tutar === 800 && d.odemeTarihi === bugun, 'Milo karttan ödeme kaydı yanlış: ' + JSON.stringify(d));
      // aktif et
      await p.evaluate(() => { window.confirm = () => true; [...document.querySelectorAll('#yn-kart .ap-btn')].find((b) => /Aktif et/.test(b.textContent)).click(); });
      await p.waitForFunction(() => /Pasife al/.test(document.querySelector('#yn-kart').textContent), null, { timeout: 15000 });
      const u = (await miloApi('/members')).d.members.find((x) => x.ad === A);
      dogrula(u && u.pasif === false, 'Milo üye aktif edilmedi');
      if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-milo-kart.png' });
      await p.evaluate(() => ynKartKapat());
      // Üyeler listesindeki 🪪 Kart düğmesi
      await p.evaluate(() => miloSekme('uyeler')); await p.waitForFunction((a) => [...document.querySelectorAll('#milo-icerik button')].some((b) => /Kart/.test(b.textContent) && (b.getAttribute('onclick') || '').includes(a)), A, { timeout: 15000 });
      await p.evaluate((a) => [...document.querySelectorAll('#milo-icerik button')].find((b) => /Kart/.test(b.textContent) && (b.getAttribute('onclick') || '').includes(a)).click(), A);
      await p.waitForSelector('#yn-kart .yn-aylar button', { timeout: 10000 });
      dogrula(/Ödendi/.test(await p.locator('#yn-kart').textContent()), 'Üyelerden açılan kartta bu ayın ödemesi görünmeli');
      await p.evaluate(() => { ynKartKapat(); miloSekme('genel'); }); await p.waitForSelector('#milo-icerik #yn-genel', { timeout: 15000 });
      if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-milo.png' });
      esit(hatalar.length, 0, 'Milo sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
  } finally {
    for (const m of [0, -1]) await miloApi(`/dues/${encodeURIComponent(A)}/${ayEkle(ay, m)}`, { method: 'PUT', body: JSON.stringify({ odendi: false, tutar: null, notMetin: null, odemeTarihi: null, tarih: bugun }) }).catch(() => {});
    await miloApi(`/members/${encodeURIComponent(G)}/${encodeURIComponent(A)}`, { method: 'DELETE' }).catch(() => {});
  }
  log('🏠 yönetim paneli (DAĞ + Milo): tam sayfa, özet, tek aidat sayısı, arama (pasif dahil), sporcu kartında ödeme düzelt / ödenmedi / pasif-aktif, ekran PDF ✓');
}
