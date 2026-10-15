// 📱 Telefon kamerası → bilgisayar (2026-10-15, kullanıcı: "PC'nin kamerası yok; telefonun kamerasını PC'ye, oradan TV'ye
// yansıtacağım; en az 720, en çok 1080; donarak hareket etmesin"). İki ayrı tarayıcı: "bilgisayar" (kamera yok) Video
// penceresinde 📱 Telefon'u seçer → QR/oda; "telefon" (sahte kamera) bağlantıyı açar → görüntü bilgisayara 720p+ gelir,
// gecikmeli ayna kare biriktirir, telefondaki iskelet analizi kapanır ("Yalnız görüntü").
import { chromium } from 'playwright';
import { oturumAl, B, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const pcB = await chromium.launch(), telB = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  try {
    const tok = await oturumAl();
    const pcx = await pcB.newContext({ viewport: { width: 1280, height: 800 } });
    await pcx.addInitScript((tk) => { localStorage.setItem('dag_oturum', tk); localStorage.removeItem('dagsk_formlab_oda'); }, tok);
    const pc = await pcx.newPage(); const hatalar = []; pc.on('pageerror', (e) => hatalar.push(e.message));
    await pc.goto(B + '/app.html'); await pc.waitForFunction(() => typeof dagskEkYukle === 'function');
    await pc.evaluate(() => dagskEkYukle('dagsk-km-video.js').then(() => kvAc('buyukler|TEST', 'ayna')));
    await pc.waitForSelector('#kv .kv', { timeout: 15000 });
    await pc.locator('#kv button:has-text("Telefon")').first().click();
    await pc.waitForSelector('#kv .kv-tel img', { timeout: 20000 });
    const link = await pc.evaluate(() => _fl.tel.link);
    dogrula(/\/kamera#k=/.test(link), 'yayın bağlantısı yok');
    const tel = await (await telB.newContext({ viewport: { width: 844, height: 390 } })).newPage();
    await tel.goto(link);
    await pc.waitForFunction(() => _kv && _kv.akisTel && _kv.mse && _kv.mse.v.buffered.length && _kv.mse.v.buffered.end(0) > 4, null, { timeout: 45000 });
    await pc.waitForFunction(() => _fl.tel && _fl.tel.kalite && _fl.tel.kalite.h, null, { timeout: 15000 });
    const k = await pc.evaluate(() => _fl.tel.kalite);
    dogrula(Math.min(k.w, k.h) >= 720, 'yayın 720p altında: ' + k.w + 'x' + k.h);
    dogrula(await pc.evaluate(() => Math.min(_kv.gW, _kv.gH)) >= 720, 'ayna 720p altında çiziyor');
    await tel.waitForFunction(() => document.getElementById('ai').textContent === 'Yalnız görüntü', null, { timeout: 15000 });
    // hafif mod (2026-10-16, kullanıcı: 'PC ve telefondan çekim için ağır'): Video penceresi açıkken telefon 720p gönderir
    await pc.waitForFunction(() => _fl.tel && _fl.tel.kalite && Math.min(_fl.tel.kalite.w, _fl.tel.kalite.h) === 720, null, { timeout: 20000 });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('telefon QR → bilgisayar: ' + Math.min(k.w, k.h) + 'p yayın, ayna akıcı (MediaSource) 720p+, telefonda analiz kapalı ✓');
  } finally { await pcB.close(); await telB.close(); }
}
