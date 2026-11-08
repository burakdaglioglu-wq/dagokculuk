// 🎚️ Klik Testi (v390) · 🏹 Ok Hızı Ölçer (v391) · 🎥 Çok Açılı Kamera (v391) — CapTarget Instagram'dan seçilen fikirler.
// Klik: 50 klik sağa → 5 cm, 50 klik yukarı → 7,5 cm ⇒ 1 mm / 1,5 mm; yarışma önerisi "40 klik sağa ve 20 klik aşağı".
// Ok hızı: sentetik WAV (18 m, telefon 1 m; 55/40/25 m/s) "Videodan ölç" ile → 198/144/90 km/s, sporcu kaydına yazılır.
// Çok açılı: sahte kameralı telefon "Önden" açısına bağlanır, 3 sn gecikmede kare çizilir, tekrar açılır.
import { chromium } from 'playwright';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { oturumAl, B, dogrula, esit } from '../yardimci.mjs';

function wavYap(yol) {
  const sr = 44100, x = new Float32Array(sr * 10); let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let i = 0; i < x.length; i++) x[i] = rnd() * 0.003;
  const patla = (t, amp, tau, ring) => { const i0 = Math.round(t * sr); for (let k = 0; k < sr * 0.4 && i0 + k < x.length; k++) { const tt = k / sr; x[i0 + k] += rnd() * amp * Math.exp(-tt / tau) + (ring ? Math.sin(tt * 2 * Math.PI * 140) * ring * Math.exp(-tt / 0.15) : 0); } };
  const ek = (Math.sqrt(18 * 18 + 1) - 1) / 343.4; let t = 1; [55, 40, 25].forEach((v) => { patla(t, 0.8, 0.012, 0.06); patla(t + 18 / v + ek, 0.06, 0.008, 0); t += 3; });
  const b = Buffer.alloc(44 + x.length * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), 44 + i * 2);
  writeFileSync(yol, b);
}
const ortuGizle = () => document.querySelectorAll('body *').forEach((e) => { const s = getComputedStyle(e); if ((s.position === 'fixed' || s.position === 'absolute') && +s.zIndex > 1000 && !/^(klk|oh|ck)/.test(e.id)) e.style.display = 'none'; });

export default async function ({ log }) {
  const tok = await oturumAl(), wav = join(mkdtempSync(join(tmpdir(), 'dagsk-hiz-')), 'atis.wav'); wavYap(wav);
  const br = await chromium.launch(), telB = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  try {
    const cx = await br.newContext({ viewport: { width: 375, height: 760 } });
    await cx.addInitScript((tk) => { localStorage.setItem('dag_oturum', tk); localStorage.removeItem('dagsk_cokaci_odalar'); }, tok);
    const p = await cx.newPage(); const hatalar = []; p.on('pageerror', (e) => hatalar.push(e.message));
    await p.goto(B + '/app.html'); await p.waitForFunction(() => typeof dagskEkYukle === 'function' && typeof ekipmanKartHTML === 'function'); await p.waitForTimeout(1500);
    // geçici sporcu yalnız bu sayfanın belleğinde (sunucuya gönderilmez: bekleyenGonderim kapatılır)
    await p.evaluate(() => { if (!turnuvaDB[aktifGrup]) turnuvaDB[aktifGrup] = {}; turnuvaDB[aktifGrup]['E2E Klik'] = { ad: 'E2E Klik' }; window.__eskiKaydet = ekipmanKaydet; ekipmanKaydet = function (sp) { sp.lastModified = Date.now(); }; });
    await p.evaluate(ortuGizle);

    // --- Klik Testi
    await p.evaluate(() => klikTestiBaslat('E2E Klik', '-e2e')); await p.waitForSelector('#klk-hedef');
    const tikla = async (pts) => { for (const [x, y] of pts) { const q = await p.evaluate(([x, y]) => { const s = document.getElementById('klk-hedef'), pt = s.createSVGPoint(); pt.x = x; pt.y = y; const r = pt.matrixTransform(s.getScreenCTM()); return [r.x, r.y]; }, [x, y]); await p.mouse.click(q[0], q[1]); } };
    const grup = (cx, cy) => [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1], [cx + 0.5, cy + 0.5], [cx - 0.5, cy - 0.5]];
    await tikla(grup(-2, 3)); await p.click('#klk-arka .klk-dugmeler .ana');
    await tikla(grup(3, 3)); await p.click('#klk-arka .klk-dugmeler .ana');
    await tikla(grup(3, -4.5)); await p.click('#klk-arka .klk-dugmeler .ana');
    await p.click('#klk-arka .klk-dugmeler .ana'); // Kaydet
    const klik = await p.evaluate(() => turnuvaDB[aktifGrup]['E2E Klik'].ekipmanBilgisi.klik[0]);
    esit(klik.yatay, 0.1, '1 klik sağ-sol (cm)'); esit(klik.dikey, 0.15, '1 klik yukarı-aşağı (cm)');
    await p.evaluate(() => dagskEkYukle('dagsk-km-yarisma-pro.js'));
    const oneri = await p.evaluate(() => yzGrupOneri({ mx: 0.1, my: 0.075, yay: 0.15, n: 18 }, YZ_YUZ['10k'], yzKlikBul(aktifGrup + '|E2E Klik', '18m')).oneri);
    esit(oneri, 'Nişangahı 40 klik sağa ve 20 klik aşağı al.', 'klikli nişangah önerisi');

    // --- Ok Hızı (videodan)
    await p.evaluate(() => okHiziAcYukle({ g: aktifGrup, ad: 'E2E Klik', sfx: '-e2e' })); await p.waitForSelector('#oh');
    await p.setInputFiles('#oh input[type=file]', wav);
    await p.waitForFunction(() => document.querySelectorAll('#oh .oh-satir').length === 3, null, { timeout: 15000 });
    const hiz = await p.evaluate(() => turnuvaDB[aktifGrup]['E2E Klik'].ekipmanBilgisi.hiz.map((h) => Math.round(h.kmh)));
    dogrula(hiz.length === 3 && Math.abs(hiz[0] - 198) <= 2 && Math.abs(hiz[1] - 144) <= 2 && Math.abs(hiz[2] - 90) <= 2, 'ok hızları beklenenden farklı: ' + hiz.join(', '));
    await p.click('#oh .oh-kapat');
    await p.evaluate(() => { delete turnuvaDB[aktifGrup]['E2E Klik']; ekipmanKaydet = window.__eskiKaydet; });

    // --- Çok Açılı Kamera (1 telefon)
    await p.setViewportSize({ width: 1280, height: 760 });
    await p.evaluate(() => dagskEkYukle('dagsk-coklu-kamera.js?v=1').then(() => ckAc())); await p.waitForSelector('#ck');
    await p.waitForSelector('#ck-rh .ck-rh-adim svg'); // hiç telefon kurulmamış: önce kurulum rehberi (v392)
    dogrula(await p.locator('#ck-rh .ck-rh-adim').count() === 6, 'rehberde 6 adım yok');
    await p.click('#ck-rh .ck-rh-bar button'); await p.waitForSelector('#ck-rh', { state: 'detached' });
    await p.click('#ck-k-on .ck-bos button'); await p.waitForSelector('#ck-k-on .ck-bos img', { timeout: 15000 });
    const link = decodeURIComponent((await p.getAttribute('#ck-k-on .ck-bos img', 'src')).split('data=')[1]).replace(/^https?:\/\/[^/]+/, B);
    const tel = await (await telB.newContext({ viewport: { width: 844, height: 390 } })).newPage(); await tel.goto(link);
    await p.waitForFunction(() => /^1\/4/.test((document.querySelector('#ck-ust h1 small') || {}).textContent || ''), null, { timeout: 60000 });
    await tel.waitForFunction(() => document.getElementById('ai').textContent === 'Yalnız görüntü', null, { timeout: 15000 });
    await p.waitForTimeout(1500); await p.click('#ck-ust button:has-text("3 sn")'); await p.waitForTimeout(4000);
    dogrula(await p.evaluate(() => { const c = document.querySelector('#ck-k-on canvas'); return !c.hidden && c.width > 0; }), 'gecikmeli kare çizilmedi');
    await p.click('#ck-ust button:has-text("tekrar")'); await p.waitForSelector('#ck-surgu');
    await p.evaluate(() => ckKapat());
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('klik 1 mm / 1,5 mm → "40 klik sağa ve 20 klik aşağı" · ok hızı ' + hiz.join('/') + ' km/s · çok açılı: telefon bağlandı, 3 sn gecikme, tekrar ✓');
  } finally { await br.close(); await telB.close(); }
}
