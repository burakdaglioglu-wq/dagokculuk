// 🎬 Çok açılı KAYIT + ANALİZ STÜDYOSU (2026-11-18, v426). Kullanıcı: "4'lü kameranın kaydet düğmesi yok; kaydedip tek ekranda ya da
// 4'lüde analiz etmek, yan yana koymak; bir sporcunun tam analizini yapacağız."
// A) Sahte telefonla gerçek kayıt: ⏺ Kaydet → ⏹ Durdur → sporcu seç → "Kaydet ve analiz et" → stüdyo videoyu açar; 📌 Son 12 sn'yi sakla.
// B) 4 açılı yapay kayıt: 4'lü/tek/yan yana, oynat/durdur, kare kare, anlar + süreler, açı ölçümü (°), çizgi, 📸 kare indir,
//    📋 tam analiz → /api/teknik-analiz'e kayıt (sonra silinir), 🎞️ video indir, ⚖️ karşılaştır, sil. 1366 ve 390 px ekran görüntüleri.
import { chromium } from 'playwright';
import { B, oturumAl, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const tok = await oturumAl();
  const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), telB = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const O = 'tests/e2e/_cikti/134-';
  let analizId = null, p = null;
  try {
    const cx = await br.newContext({ viewport: { width: 1366, height: 800 }, acceptDownloads: true });
    await cx.addInitScript((tk) => { localStorage.setItem('dag_oturum', tk); localStorage.removeItem('dagsk_cokaci_odalar'); }, tok);
    p = await cx.newPage(); const hatalar = []; p.on('pageerror', (e) => hatalar.push(e.message));
    await p.goto(B + '/app.html'); await p.waitForFunction(() => typeof dagskEkYukle === 'function' && typeof turnuvaDB !== 'undefined'); await p.waitForTimeout(1500);
    // önceki koşulardan kalan kayıtları temizle
    await p.evaluate(() => new Promise((ok) => { const r = indexedDB.deleteDatabase('dagsk-cokaci'); r.onsuccess = r.onerror = r.onblocked = () => ok(); }));
    const sporcu = await p.evaluate(() => { for (const g of ['buyukler', 'yildizlar', 'kucukler', 'minikler']) { const o = turnuvaDB[g] || {}; const ad = Object.keys(o).find((a) => o[a] && !o[a].pasif); if (ad) return { g, ad }; } return null; });
    dogrula(!!sporcu, 'en az bir sporcu gerekli');

    // ---------------- A) gerçek kayıt (sahte telefon)
    await p.evaluate(() => dagskEkYukle('dagsk-coklu-kamera.js?v=4').then(() => ckAc())); await p.waitForSelector('#ck');
    await p.waitForSelector('#ck-rh .ck-rh-bar button'); await p.click('#ck-rh .ck-rh-bar button');
    await p.click('#ck-k-on .ck-bos button'); await p.waitForSelector('#ck-k-on .ck-bos img', { timeout: 15000 });
    const link = decodeURIComponent((await p.getAttribute('#ck-k-on .ck-bos img', 'src')).split('data=')[1]).replace(/^https?:\/\/[^/]+/, B);
    const tel = await (await telB.newContext({ viewport: { width: 844, height: 390 } })).newPage(); await tel.goto(link);
    await p.waitForFunction(() => /^1\/4/.test((document.querySelector('#ck-ust h1 small') || {}).textContent || ''), null, { timeout: 60000 });
    await p.waitForTimeout(2500);
    dogrula(await p.locator('#ck-ust button:has-text("Kaydet")').isEnabled(), '⏺ Kaydet etkin olmalı');
    await p.click('#ck-ust button:has-text("Kaydet")');
    await p.waitForSelector('#ck-k-on .ck-kayit-isik'); await p.waitForTimeout(3200);
    dogrula(/Durdur · 0:0[2-4]/.test(await p.locator('#ck-ust .ck-btn.kayit').innerText()), 'kayıt süresi yazmalı');
    await p.click('#ck-ust .ck-btn.kayit'); await p.waitForSelector('#ck-modal #ck-m-sp', { timeout: 10000 });
    await p.selectOption('#ck-m-sp', sporcu.g + '|' + sporcu.ad); await p.fill('#ck-m-ad', 'e2e canlı');
    // v428 puan düğmeleri: 8 → 9 seçimi, sonra 9 kalır
    await p.click('#ck-m-puan button[data-p="8"]'); await p.click('#ck-m-puan button[data-p="9"]');
    esit(await p.locator('#ck-m-puan button.on').count(), 1, 'tek puan seçili');
    await p.screenshot({ path: 'tests/e2e/_cikti/134-kayit-puan.png' });
    await p.click('#ck-m-anl');
    await p.waitForSelector('#ca .ca-kare video', { timeout: 20000 }); await p.waitForTimeout(1200);
    const canli = await p.evaluate(() => { const s = _caIc.durum(); return { n: s.kareler.length, sure: s.kareler[0].src.sure, w: s.kareler[0].src.vw, sp: s.klip.sporcu && s.klip.sporcu.ad, ad: s.klip.ad, puan: s.klip.puan }; });
    esit(canli.puan, '9', 'kayıtta seçilen puan');
    esit(canli.n, 1, 'canlı kayıtta 1 açı'); dogrula(canli.sure > 1800, 'canlı kayıt süresi ' + canli.sure); dogrula(canli.w > 100, 'video boyutu'); esit(canli.sp, sporcu.ad, 'sporcu'); esit(canli.ad, 'e2e canlı', 'not');
    await p.evaluate(() => caKapat());
    // 📌 son 12 sn
    await p.waitForTimeout(1500); await p.click('#ck-ust button:has-text("Son 12 sn\'yi sakla")'); await p.waitForSelector('#ck-modal #ck-m-kay');
    await p.click('#ck-m-kay'); await p.waitForFunction(() => /Kayıtlar \(2\)/.test(document.getElementById('ck-ust').textContent), null, { timeout: 15000 });
    await tel.close(); await p.evaluate(() => ckKapat());

    // ---------------- B) 4 açılı yapay kayıt (her açı farklı renk, kare numarası yazılı)
    const id4 = await p.evaluate(async (sp) => {
      await dagskEkYukle('dagsk-cokaci-analiz.js?v=3');
      const yap = (renk, ms) => new Promise((ok) => {
        const c = document.createElement('canvas'); c.width = 640; c.height = 360; const x = c.getContext('2d'), s = c.captureStream(30), r = new MediaRecorder(s, { mimeType: 'video/webm' }), p = []; let n = 0;
        r.ondataavailable = (e) => p.push(e.data); r.onstop = () => ok(new Blob(p, { type: 'video/webm' }));
        const ciz = () => { x.fillStyle = '#111'; x.fillRect(0, 0, 640, 360); x.fillStyle = renk; x.beginPath(); x.arc(40 + (n * 9) % 560, 180, 40, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '40px sans-serif'; x.fillText('kare ' + n, 20, 50); n++; };
        ciz(); r.start(200); const z = setInterval(ciz, 33); setTimeout(() => { clearInterval(z); r.stop(); }, ms);
      });
      const [a, b, c, d] = await Promise.all([yap('#38bdf8', 3000), yap('#a78bfa', 3000), yap('#4ade80', 3000), yap('#facc15', 3000)]);
      const ac = [['on', 'Önden', a], ['yan', 'Yandan', b], ['arka', 'Arkadan', c], ['hedef', 'Hedef', d]], veri = {};
      ac.forEach(([id, , bl]) => { veri[id] = { tip: 'video', blob: bl, mime: 'video/webm' }; });
      const id1 = await caKlipKaydet({ sporcu: sp, sure: 3000, ad: 'e2e 4 açı', acilar: ac.map(([id, ad]) => ({ id, ad, ofset: 0 })) }, veri);
      const id2 = await caKlipKaydet({ sporcu: sp, sure: 3000, ad: 'e2e eski', tarih: '2026-11-01', acilar: [{ id: 'on', ad: 'Önden', ofset: 0 }], anlar: { birakis: 1500 } }, { on: veri.on });
      window.__id2 = id2; return id1;
    }, sporcu);
    await p.evaluate((id) => caAc({ id }), id4);
    await p.waitForFunction(() => document.querySelectorAll('#ca .ca-kare video').length === 4, null, { timeout: 20000 }); await p.waitForTimeout(800);
    let st = await p.evaluate(() => { const s = _caIc.durum(); return { sureler: s.kareler.map((k) => Math.round(k.src.sure)), duzen: s.duzen }; });
    dogrula(st.sureler.every((x) => x > 2000), 'yapay videoların süresi okunmalı (webm süre düzeltmesi): ' + st.sureler.join(',')); esit(st.duzen, '4', '4\'lü düzen');
    // oynat → T ilerler, durdur, kare kare
    await p.click('#ca-alt .ca-b.ana'); await p.waitForTimeout(1200); await p.click('#ca-alt .ca-b.ana');
    const t1 = await p.evaluate(() => _caIc.durum().T); dogrula(t1 > 300, '½× oynatınca zaman ilerlemeli: ' + t1);
    await p.click('#ca-alt button[aria-label="Bir kare ileri"]'); const t2 = await p.evaluate(() => _caIc.durum().T); dogrula(Math.abs(t2 - t1 - 33.3) < 2, 'bir kare = 1/30 sn');
    // anlar
    const anKoy = async (ms, ad) => { await p.evaluate((ms) => caGit(ms), ms); await p.click('#ca-alt .ca-anlar button:has-text("' + ad + '")'); };
    await anKoy(200, 'Duruş'); await anKoy(800, 'Çekiş'); await anKoy(1400, 'Çapa'); await anKoy(2100, 'Bırakış'); await anKoy(2700, 'Takip');
    const ist = await p.locator('#ca-alt .ca-ist').innerText();
    dogrula(/Çekiş 0,60/.test(ist) && /Nişan 0,70/.test(ist) && /Toplam atış 1,90/.test(ist), 'süreler: ' + ist.replace(/\s+/g, ' '));
    esit(await p.locator('#ca-alt .ca-im').count(), 5, 'zaman çubuğunda 5 an');
    // açı ölçümü: 3 nokta → 90°
    await p.click('#ca-alt button:has-text("Açı")');
    const cz = p.locator('#ca .ca-kare').first().locator('.ca-cizim'); const bb = await cz.boundingBox();
    await p.mouse.click(bb.x + bb.width * 0.3, bb.y + bb.height * 0.2); await p.mouse.click(bb.x + bb.width * 0.3, bb.y + bb.height * 0.7); await p.mouse.click(bb.x + bb.width * 0.3 + bb.height * 0.5 * bb.width / bb.width, bb.y + bb.height * 0.7);
    const aci = await p.evaluate(() => { const s = _caIc.durum(), k = s.kareler[0], sh = (s.klip.cizim[k.aci.id] || [])[0]; return sh ? _caIc.aciDerece(sh.p, k.src.vw, k.src.vh) : null; });
    dogrula(aci != null && Math.abs(aci - 90) <= 2, 'açı ölçümü ~90°: ' + aci);
    await p.click('#ca-alt button:has-text("Çizgi")'); await p.mouse.move(bb.x + 40, bb.y + 40); await p.mouse.down(); await p.mouse.move(bb.x + 160, bb.y + 120, { steps: 5 }); await p.mouse.up();
    esit(await p.evaluate(() => { const s = _caIc.durum(); return (s.klip.cizim[s.kareler[0].aci.id] || []).length; }), 2, 'çizgi de eklendi');
    await p.click('#ca-alt button:has-text("Çizgi")');
    await p.screenshot({ path: O + 'studyo-4lu.png' });
    // tek + yan yana
    await p.click('#ca-ust button:has-text("Tek")'); esit(await p.locator('#ca .ca-kare').count(), 1, 'tek düzen');
    await p.click('#ca-ust button:has-text("Yan yana")'); await p.click('#ca-ik-tamam'); esit(await p.locator('#ca .ca-kare').count(), 2, 'yan yana düzen');
    await p.click('#ca-ust button:has-text("4\'lü")');
    // 📸 kare indir
    const [ind] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('#ca-ust button:has-text("Kare")')]);
    dogrula(/\.png$/.test(ind.suggestedFilename()), 'kare png: ' + ind.suggestedFilename());
    // 📋 tam analiz
    await p.click('#ca-ust button:has-text("Tam analiz")'); await p.waitForSelector('#ca-panel .ca-faz');
    esit(await p.locator('#ca-panel .ca-faz').count(), 8, '8 faz');
    await p.click('#ca-panel .ca-yildiz button:has-text("4")'); await p.click('#ca-panel .ca-dh button[aria-label="Doğru"] >> nth=0'); await p.click('#ca-panel .ca-dh button[aria-label="Hatalı"] >> nth=1');
    await p.fill('#ca-panel textarea', 'e2e: ayak duruşu iyi'); await p.click('#ca-panel button:has-text("Bu anın karesini ekle")'); await p.waitForSelector('#ca-panel .ca-foto');
    const [cev] = await Promise.all([p.waitForResponse((r) => r.url().endsWith('/api/teknik-analiz') && r.request().method() === 'POST', { timeout: 20000 }), p.click('#ca-panel button:has-text("Saha karnesine kaydet")')]);
    const govde = await cev.json(); dogrula(govde.applied && govde.id, 'karne kaydı: ' + JSON.stringify(govde)); analizId = govde.id;
    const kayit = await p.evaluate(async (id) => { const r = await fetch('/api/teknik-analiz/' + id); const d = await r.json(); const f = JSON.parse(d.fazlarJson); return { ad: d.ad, puan: f[0].puan, k: f[0].k.slice(0, 2), foto: (f[0].foto || '').slice(0, 15), not: f[0].not, nisan: f[5] && f[5].not }; }, analizId);
    esit(kayit.ad, sporcu.ad, 'karnede sporcu'); esit(kayit.puan, 4, 'faz puanı'); esit(JSON.stringify(kayit.k), JSON.stringify(['dogru', 'hatali']), 'maddeler'); esit(kayit.foto, 'data:image/jpeg', 'faz karesi'); dogrula(/Nişan|nişan 0,70/.test(kayit.nisan || ''), 'nişan süresi karneye yazıldı: ' + kayit.nisan);
    await p.screenshot({ path: O + 'tam-analiz.png' });
    await p.click('#ca-ust button:has-text("Tam analiz")');
    // 🎞️ video indir (bütün kayıt, 1×)
    await p.click('#ca-ust button:has-text("Video indir")'); await p.selectOption('#ca-v-bol', 'hepsi'); await p.selectOption('#ca-v-hiz', '1');
    const [vid] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('#ca-v-tamam')]);
    dogrula(/\.(webm|mp4)$/.test(vid.suggestedFilename()), 'video dosyası: ' + vid.suggestedFilename());
    // kalıcılık: kapat-aç, anlar ve çizimler duruyor
    await p.evaluate(() => caKapat()); await p.evaluate((id) => caAc({ id }), id4); await p.waitForFunction(() => document.querySelectorAll('#ca .ca-kare video').length === 4, null, { timeout: 20000 });
    const kal = await p.evaluate(() => { const s = _caIc.durum(); return { an: Object.keys(s.klip.anlar).length, ciz: Object.values(s.klip.cizim).flat().length, analiz: !!s.klip.analiz }; });
    esit(kal.an, 5, 'anlar kalıcı'); esit(kal.ciz, 2, 'çizimler kalıcı'); dogrula(kal.analiz, 'analiz bağı kalıcı');
    // ⚖️ karşılaştır
    await p.evaluate(() => caListe()); await p.waitForSelector('#ca .ca-kart');
    esit(await p.locator('#ca .ca-kart').count(), 4, 'kütüphanede 4 kayıt');
    await p.evaluate((id) => caKarsiBasla(id), id4); await p.click('#ca .ca-kart:has-text("e2e eski") button:has-text("Bununla karşılaştır")');
    await p.waitForFunction(() => document.querySelectorAll('#ca .ca-kare video').length === 2, null, { timeout: 20000 });
    const kar = await p.evaluate(() => { const s = _caIc.durum(); return { duzen: s.duzen, kaydirma: s.kareler[1].kaydirma }; });
    esit(kar.duzen, 'kar', 'karşılaştırma düzeni'); esit(kar.kaydirma, 600, 'bırakışa göre hizalı (2100 − 1500)');
    await p.screenshot({ path: O + 'karsilastir.png' });
    await p.click('#ca-ust button:has-text("Üst üste")'); await p.waitForTimeout(400);
    esit(await p.evaluate(() => getComputedStyle(document.querySelectorAll('#ca .ca-kare')[1].querySelector('video')).opacity), '0.5', 'üst üste: ikinci kaydın görüntüsü yarı saydam');
    await p.screenshot({ path: O + 'ust-uste.png' });
    // telefon ekranı
    await p.evaluate((id) => caOynat(id), id4); await p.waitForFunction(() => document.querySelectorAll('#ca .ca-kare video').length === 4, null, { timeout: 20000 });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(900);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yana taşıyor');
    await p.screenshot({ path: O + 'telefon.png' });
    await p.setViewportSize({ width: 1366, height: 800 });
    // sil
    await p.evaluate(() => caListe()); await p.waitForSelector('#ca .ca-kart');
    await p.evaluate(() => { window.onayIste = (m, f) => f(); }); await p.click('#ca .ca-kart:has-text("e2e eski") button[aria-label="Sil"]');
    await p.waitForFunction(() => document.querySelectorAll('#ca .ca-kart').length === 3, null, { timeout: 10000 });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('canlı kayıt (sahte telefon) ' + (canli.sure / 1000).toFixed(1) + ' sn → stüdyo · son 12 sn sakla · 4 açı: oynat, kare kare, 5 an + süreler, açı ' + aci + '°, çizgi, tek/yan yana, kare png, tam analiz → karne (' + analizId.slice(0, 8) + ', silindi), video indir, kalıcılık, karşılaştır (bırakış hizası), sil, 390 px');
  } finally {
    try { if (analizId && p) await p.evaluate((id) => fetch('/api/teknik-analiz/' + id, { method: 'DELETE' }), analizId); } catch (e) {}
    try { if (p) await p.evaluate(() => new Promise((ok) => { try { caKapat(); } catch (e) {} const r = indexedDB.deleteDatabase('dagsk-cokaci'); r.onsuccess = r.onerror = r.onblocked = () => ok(); })); } catch (e) {}
    await br.close(); await telB.close();
  }
}
