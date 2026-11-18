// 🎬 Video geliştirme v427 (2026-11-18). Kullanıcı tarayıcı taslağından 2, 4, 5, 6, 7, 10'u seçti.
// A) 📱 Çek (telefon, 390 px, sahte kamera + mikrofon): kaydet → durdur → puan çipine dokun = kaydedilir; ses varsa bırakış sesten.
// B) Yapay iskelet verili 4 atış: 👥 seri üst üste (seçim → üst üste, 3. atış "kaçtı"), 🦴 iskelet çizimi, 📏 tablo; tek kayıtta ölçüm satırı;
//    ⭐ örnek atış + örnekle kıyasla (üst üste); ⚖️ en iyi ↔ en kötü (puanla); ✏️ puan değiştirme.
// C) 📺 TV ayna: 📷 bu cihazın kamerası → TV modu (rozet, üst çubuk gizli) → çıkış; o kamerayla ⏺ kayıt.
// D) (E2E_POZ=1) gerçek yapay zekâ: insan fotoğrafından yapılmış videoda iskelet çıkarılır.
import { chromium } from 'playwright';
import fs from 'fs';
import { B, oturumAl, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const tok = await oturumAl();
  const br = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--autoplay-policy=no-user-gesture-required'].concat(process.env.E2E_POZ ? ['--use-gl=angle', '--ignore-gpu-blocklist'] : []) });
  const O = 'tests/e2e/_cikti/135-'; const adim = (m) => { if (process.env.E2E_IZ) console.error('  · ' + m); };
  let p = null; const notlar = [];
  try {
    const cx = await br.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, permissions: ['camera', 'microphone'] });
    await cx.addInitScript((tk) => { localStorage.setItem('dag_oturum', tk); localStorage.removeItem('dagsk_cokaci_odalar'); }, tok);
    p = await cx.newPage(); const hatalar = []; p.on('pageerror', (e) => hatalar.push(e.message));
    await p.goto(B + '/app.html'); await p.waitForFunction(() => typeof dagskEkYukle === 'function' && typeof turnuvaDB !== 'undefined'); await p.waitForTimeout(1500);
    const temizle = () => p.evaluate(() => new Promise((ok) => { try { caKapat(); } catch (e) {} const r = indexedDB.deleteDatabase('dagsk-cokaci'); r.onsuccess = r.onerror = r.onblocked = () => ok(); }));
    await p.evaluate(() => dagskEkYukle('dagsk-cokaci-analiz.js?v=2')); await temizle();
    const sporcu = await p.evaluate(() => { for (const g of ['buyukler', 'yildizlar', 'kucukler', 'minikler']) { const o = turnuvaDB[g] || {}; const ad = Object.keys(o).find((a) => o[a] && !o[a].pasif); if (ad) return { g, ad }; } return null; });
    dogrula(!!sporcu, 'en az bir sporcu gerekli');

    // ---------------- A) 📱 Çek
    await p.evaluate(() => caAc()); await p.waitForSelector('#ca .ca-bos');
    await p.click('#ca .ca-ust button:has-text("Çek")');
    await p.waitForFunction(() => { const v = document.getElementById('ca-cek-v'); return v && v.videoWidth > 0; }, null, { timeout: 15000 });
    await p.selectOption('#ca-cek-sp', sporcu.g + '|' + sporcu.ad);
    const cek = async (puan, ms) => {
      await p.click('#ca-cek-dug'); await p.waitForTimeout(ms);
      dogrula(/●/.test(await p.locator('#ca-cek-sure').innerText()), 'kayıt süresi yazmalı');
      await p.click('#ca-cek-dug'); await p.waitForSelector('#ca-cek-puan:not([hidden]) .ca-puanlar button', { timeout: 10000 });
      if (puan === '10') await p.screenshot({ path: O + 'telefon-puan.png' });
      await p.click('#ca-cek-puan .ca-puanlar button:text-is("' + puan + '")');
      await p.waitForFunction(() => document.getElementById('ca-cek-puan').hidden, null, { timeout: 10000 });
    };
    await cek('10', 2600); await cek('7', 2200);
    await p.waitForFunction(() => /2 kayıt/.test(document.getElementById('ca-cek-son').textContent), null, { timeout: 10000 });
    await p.screenshot({ path: O + 'telefon-cek.png' });
    // arka planda ses analizi bitsin
    await p.waitForTimeout(2500);
    const tel = await p.evaluate(() => _caIc.klipListe().then((l) => l.map((k) => ({ puan: k.puan, ad: k.ad, sp: k.sporcu && k.sporcu.ad, aci: k.acilar[0].id, sure: k.sure, ses: k.sesBakildi, b: k.anlar && k.anlar.birakis, oto: k.anlar && k.anlar.birakisOto }))));
    esit(tel.length, 2, 'iki kayıt'); esit(JSON.stringify(tel.map((x) => x.puan).sort()), JSON.stringify(['10', '7']), 'puanlar');
    dogrula(tel.every((x) => x.sp === sporcu.ad && x.aci === 'yan' && x.sure > 1500), 'sporcu/açı/süre: ' + JSON.stringify(tel));
    dogrula(tel.some((x) => x.ad === '1. atış') && tel.some((x) => x.ad === '2. atış'), 'atış sırası: ' + tel.map((x) => x.ad));
    dogrula(tel.every((x) => x.ses), 'ses analizi yapılmalı');
    notlar.push('sahte mikrofonda bırakış: ' + tel.map((x) => x.b == null ? 'yok' : x.b + ' ms').join(', '));
    // kütüphane: puan rozeti
    await p.click('#ca-cek .ca-cek-ust button:has-text("Kayıtlar")'); await p.waitForSelector('#ca .ca-kart');
    esit(await p.locator('#ca .ca-kart .ca-puan').count(), 2, 'kartlarda puan rozeti');
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yana taşıyor (kütüphane)');
    await p.screenshot({ path: O + 'telefon-kutuphane.png' });
    // telefonda kaydı aç
    await p.click('#ca .ca-kart >> nth=0 >> button:has-text("Analiz et")'); await p.waitForSelector('#ca .ca-kare video', { timeout: 20000 });
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yana taşıyor (stüdyo)');
    await temizle();

    // ---------------- B) yapay iskeletli 4 atış
    await p.setViewportSize({ width: 1366, height: 800 });
    const ids = await p.evaluate(async (sp) => {
      const yap = (renk, ms) => new Promise((ok) => {
        const c = document.createElement('canvas'); c.width = 640; c.height = 360; const x = c.getContext('2d'), s = c.captureStream(30), r = new MediaRecorder(s, { mimeType: 'video/webm' }), p = []; let n = 0;
        r.ondataavailable = (e) => p.push(e.data); r.onstop = () => ok(new Blob(p, { type: 'video/webm' }));
        const ciz = () => { x.fillStyle = '#1b2430'; x.fillRect(0, 0, 640, 360); x.fillStyle = renk; x.font = '40px sans-serif'; x.fillText('kare ' + n, 20, 50); n++; };
        ciz(); r.start(200); const z = setInterval(ciz, 33); setTimeout(() => { clearInterval(z); r.stop(); }, ms);
      });
      // sağ elini kullanan, karşıdan: sol kol (yay) düz, sağ kol çekişte; dy = çekiş dirseğinin aşağı kayması
      const poz = (dy) => { const n = [[0.5, 0.2], [0.45, 0.35], [0.55, 0.35], [0.33, 0.35], [0.66, 0.36 + dy], [0.21, 0.35], [0.53, 0.33], [0.46, 0.6], [0.54, 0.6], [0.46, 0.78], [0.54, 0.78], [0.46, 0.95], [0.54, 0.95]]; const o = []; n.forEach(([a, b]) => o.push(a, b, 0.99)); return o; };
      const veri = (dy) => ({ on: { fps: 10, w: 640, h: 360, t0: 0, k: Array.from({ length: 31 }, () => poz(dy)) } });
      const v = await yap('#38bdf8', 3000), l = [['e2e s1', '10', 0], ['e2e s2', '9', 0.005], ['e2e s3', '6', 0.07], ['e2e s4', '8', -0.004]], ids = [];
      for (let i = 0; i < l.length; i++) {
        ids.push(await caKlipKaydet({ sporcu: sp, sure: 3000, ad: l[i][0], puan: l[i][1], t: Date.now() + i, acilar: [{ id: 'on', ad: 'Önden', ofset: 0 }], anlar: { capa: 900, birakis: 2000 }, iskelet: veri(l[i][2]) }, { on: { tip: 'video', blob: v, mime: 'video/webm' } }));
      }
      return ids;
    }, sporcu);
    // saf ölçüm: s1 hizası, s3 daha aşağıda
    const olc = await p.evaluate(async (ids) => { const r = []; for (const id of ids) { const k = await _caIc.klipOku(id); r.push(_caIc.klipOlcum(k, k.acilar[0]).b); } return r; }, ids);
    dogrula(olc.every((o) => o && o.dirsek != null && o.hiza != null && o.yay >= 175), 'ölçümler: ' + JSON.stringify(olc[0]));
    dogrula(olc[2].hiza - olc[0].hiza >= 8, '3. atışta dirsek daha aşağıda: ' + olc[0].hiza + ' → ' + olc[2].hiza);
    // 👥 seri üst üste — arayüzden seç
    await p.evaluate(() => caAc()); await p.waitForSelector('#ca .ca-kart');
    await p.click('#ca .ca-ust button:has-text("Seri üst üste")');
    for (const ad of ['e2e s1', 'e2e s2', 'e2e s3', 'e2e s4']) await p.click('#ca .ca-kart:has-text("' + ad + '") .ca-kart-resim');
    esit(await p.locator('#ca .ca-kart .ca-sec:text-is("3")').count(), 1, 'seçim sırası rozetle');
    await p.click('#ca .ca-ust button:has-text("Üst üste göster")');
    await p.waitForFunction(() => document.querySelectorAll('#ca .ca-kare video').length === 4, null, { timeout: 20000 });
    await p.waitForSelector('#ca-panel .ca-ozet');
    const ozet = await p.locator('#ca-panel .ca-ozet').innerText();
    dogrula(/3\. atış kaçtı/.test(ozet) && /aşağıda/.test(ozet), 'seri özeti: ' + ozet.replace(/\s+/g, ' '));
    dogrula(/3 tanesi birbirine yakın/.test(ozet), 'üç atış yakın: ' + ozet.replace(/\s+/g, ' '));
    esit(await p.locator('#ca-panel .ca-tablo td.kac').count() >= 1, true, 'tabloda kırmızı hücre');
    const st = await p.evaluate(() => { const s = _caIc.durum(); return { duzen: s.duzen, n: s.kareler.length, ust: s.ustUste }; });
    esit(st.duzen, 'seri', 'seri düzeni'); dogrula(st.ust, 'varsayılan üst üste');
    // 🦴 iskelet (veri hazır → model inmez)
    await p.click('#ca-ust button:has-text("İskelet")'); await p.waitForTimeout(700);
    const piksel = await p.evaluate(() => { let n = 0; document.querySelectorAll('#ca .ca-isk').forEach((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 40) if (d[i]) n++; }); return n; });
    dogrula(piksel > 200, 'iskelet çizildi: ' + piksel);
    esit(await p.evaluate(() => getComputedStyle(document.querySelectorAll('#ca .ca-kare')[1].querySelector('video')).opacity), '0', 'iskelet açıkken üstteki videolar gizli');
    await p.evaluate(() => caGit(2300)); await p.waitForTimeout(500);
    await p.screenshot({ path: O + 'seri-ust-uste.png' });
    await p.click('#ca-ust button:has-text("Izgara")'); await p.waitForTimeout(500); await p.screenshot({ path: O + 'seri-izgara.png' });
    // 📸 kare (iskeletli, 4 atış)
    const [ind] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.click('#ca-ust button:has-text("Kare")')]);
    dogrula(/\.png$/.test(ind.suggestedFilename()), 'seri karesi png');
    // tek kayıt: ölçüm satırı
    await p.evaluate((id) => caOynat(id), ids[0]); await p.waitForSelector('#ca .ca-kare video');
    dogrula(await p.evaluate(() => _caIc.durum().iskelet), 'iskelet açık kalır (veri var)');
    await p.evaluate(() => caGit(1500)); await p.waitForTimeout(600);
    const satir = await p.locator('#ca-olc').innerText();
    dogrula(/Çekiş dirseği/.test(satir) && /bırakıştan önce/.test(satir) && /nişanda/.test(satir), 'ölçüm satırı: ' + satir.replace(/\s+/g, ' '));
    await p.screenshot({ path: O + 'tek-iskelet.png' });
    // ⭐ örnek + örnekle kıyasla
    await p.click('#ca-ust button:has-text("Örnek yap")'); await p.waitForSelector('#ca-ust button:has-text("★ Örnek")');
    await p.evaluate(() => caListe()); await p.waitForSelector('#ca .ca-bolum');
    dogrula(/Örnek atışlar/.test(await p.locator('#ca .ca-bolum').first().textContent()), 'örnek bölümü');
    await p.click('#ca .ca-kart:has-text("e2e s3") button:has-text("Örnekle kıyasla")');
    await p.waitForFunction(() => document.querySelectorAll('#ca .ca-kare video').length === 2, null, { timeout: 20000 });
    const kiyas = await p.evaluate(() => { const s = _caIc.durum(); return { duzen: s.duzen, hay: s.hayalet, a: s.klip.ad, b: s.karsi.ad }; });
    esit(kiyas.duzen, 'kar', 'kıyas düzeni'); dogrula(kiyas.hay, 'örnekle kıyas üst üste açılır'); esit(kiyas.b, 'e2e s1', 'örnek ikinci kayıt');
    await p.click('#ca-ust button:has-text("Ölçümler")'); await p.waitForSelector('#ca-panel .ca-ozet');
    dogrula(/En büyük fark/.test(await p.locator('#ca-panel .ca-ozet').innerText()), 'kıyasta fark cümlesi');
    await p.screenshot({ path: O + 'ornek-kiyas.png' });
    // ⚖️ en iyi ↔ en kötü
    await p.evaluate(() => caListe()); await p.waitForSelector('#ca .ca-kart');
    await p.selectOption('#ca .ca-l-bas select', sporcu.g + '|' + sporcu.ad);
    await p.click('#ca .ca-l-bas button:has-text("En iyi")');
    await p.waitForFunction(() => document.querySelectorAll('#ca .ca-kare video').length === 2, null, { timeout: 20000 });
    const ik = await p.evaluate(() => { const s = _caIc.durum(); return { a: s.klip.puan, b: s.karsi.puan, panel: s.panel && s.panelTur }; });
    esit(ik.a + '/' + ik.b, '10/6', 'en iyi 10, en kötü 6'); esit(ik.panel, 'olcum', 'ölçüm paneli açık');
    dogrula(/aşağıda/.test(await p.locator('#ca-panel .ca-ozet').innerText()), 'iyi-kötü farkı dirsek hizasında');
    await p.screenshot({ path: O + 'iyi-kotu.png' });
    adim('puan değiştir');
    // ✏️ puan değiştir
    await p.evaluate(() => caListe()); await p.waitForSelector('#ca .ca-kart');
    await p.click('#ca .ca-kart:has-text("e2e s4") button[aria-label="Düzenle"]'); await p.click('#ca-b-puan button:text-is("X")'); await p.click('#ca-b-tamam');
    await p.waitForFunction(() => [...document.querySelectorAll('#ca .ca-kart')].some((k) => /e2e s4/.test(k.textContent) && /X/.test(k.querySelector('.ca-puan') ? k.querySelector('.ca-puan').textContent : '')), null, { timeout: 8000 });
    await temizle();

    adim('C başlıyor');
    // ---------------- C) 📺 TV ayna + bu cihazın kamerası
    await p.evaluate(() => dagskEkYukle('dagsk-coklu-kamera.js?v=3').then(() => ckAc())); await p.waitForSelector('#ck');
    await p.waitForSelector('#ck-rh .ck-rh-bar button'); await p.click('#ck-rh .ck-rh-bar button');
    await p.click('#ck-k-on .ck-bos button:has-text("Bu cihazın kamerası")');
    await p.waitForFunction(() => /^1\/4/.test((document.querySelector('#ck-ust h1 small') || {}).textContent || ''), null, { timeout: 15000 });
    dogrula(await p.locator('#ck-k-yan .ck-bos button:has-text("Bu cihazın kamerası")').count() === 0, 'bu cihazın kamerası tek açıda');
    adim('TV'); await p.click('#ck-ust button:has-text("TV ayna")'); await p.waitForTimeout(1500);
    dogrula(await p.evaluate(() => document.getElementById('ck').classList.contains('tv')), 'TV modu');
    dogrula(/8 sn önce/.test(await p.locator('#ck-tv-rozet').innerText()), 'gecikme rozeti');
    esit(await p.locator('#ck-ust').isVisible(), false, 'TV modunda üst çubuk gizli');
    esit(await p.evaluate(() => [...document.querySelectorAll('#ck .ck-kare')].filter((k) => getComputedStyle(k).display !== 'none').length), 1, 'yalnız bağlı açı görünür');
    await p.mouse.move(600, 400); await p.mouse.move(640, 420); await p.waitForTimeout(300);
    await p.screenshot({ path: O + 'tv-ayna.png' });
    await p.click('#ck-tv button:has-text("TV modundan çık")'); await p.waitForTimeout(300);
    esit(await p.evaluate(() => document.getElementById('ck').classList.contains('tv')), false, 'TV modundan çıkış');
    // bu cihazın kamerasıyla ⏺ kayıt
    await p.click('#ck-ust button:has-text("Kaydet")'); await p.waitForTimeout(2600); await p.click('#ck-ust .ck-btn.kayit');
    await p.waitForSelector('#ck-modal #ck-m-kay', { timeout: 10000 }); await p.click('#ck-m-kay');
    await p.waitForFunction(() => /Kayıtlar \(1\)/.test(document.getElementById('ck-ust').textContent), null, { timeout: 15000 });
    await p.evaluate(() => ckKapat());
    await temizle();

    adim('D başlıyor');
    // ---------------- D) gerçek yapay zekâ (isteğe bağlı: E2E_POZ=1)
    if (process.env.E2E_POZ) {
      const resim = 'data:image/jpeg;base64,' + fs.readFileSync('fotograflar/milofotograflar/shutterstock_146939540.jpg').toString('base64');
      const r = await p.evaluate(async (src) => {
        const img = new Image(); img.src = src; await img.decode();
        const c = document.createElement('canvas'); c.width = 960; c.height = 680; const x = c.getContext('2d'), s = c.captureStream(30), rec = new MediaRecorder(s, { mimeType: 'video/webm' }), parca = []; let n = 0;
        rec.ondataavailable = (e) => parca.push(e.data);
        const bitti = new Promise((ok) => { rec.onstop = ok; });
        const ciz = () => { x.drawImage(img, (n % 6) - 3, 0, 960, 680); n++; }; ciz(); rec.start(200); const z = setInterval(ciz, 33); await new Promise((ok) => setTimeout(ok, 2500)); clearInterval(z); rec.stop(); await bitti;
        const id = await caKlipKaydet({ sure: 2500, ad: 'e2e poz', acilar: [{ id: 'yan', ad: 'Yandan', ofset: 0 }] }, { yan: { tip: 'video', blob: new Blob(parca, { type: 'video/webm' }), mime: 'video/webm' } });
        await caOynat(id); const t0 = performance.now(); await caIskelet();
        const k = await _caIc.klipOku(id), d = k.iskelet && k.iskelet.yan;
        return { kare: d ? d.k.length : 0, bulunan: d ? d.k.filter(Boolean).length : 0, sn: Math.round((performance.now() - t0) / 100) / 10 };
      }, resim);
      dogrula(r.bulunan > 5, 'yapay zekâ insanı bulmalı: ' + JSON.stringify(r));
      await p.waitForTimeout(600); await p.screenshot({ path: O + 'gercek-poz.png' });
      notlar.push('gerçek model: ' + r.bulunan + '/' + r.kare + ' karede kişi, ' + r.sn + ' sn');
      await temizle();
    }
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('📱 çek → puan çipi (2 kayıt, 390 px) · 👥 seri üst üste (3. atış kaçtı) · 🦴 iskelet çizimi + ölçüm satırı · 📸 · ⭐ örnekle kıyas · ⚖️ en iyi↔en kötü · ✏️ puan · 📺 TV ayna + bu cihazın kamerası + kayıt · ' + notlar.join(' · '));
  } finally {
    try { if (p) await p.evaluate(() => new Promise((ok) => { try { caKapat(); } catch (e) {} try { ckKapat(); } catch (e) {} const r = indexedDB.deleteDatabase('dagsk-cokaci'); r.onsuccess = r.onerror = r.onblocked = () => ok(); })); } catch (e) {}
    await br.close();
  }
}
