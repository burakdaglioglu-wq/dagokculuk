// Uçtan uca test yardımcıları (Playwright). Testler YEREL sunucuya (npm run dev) karşı çalışır, test verisi
// oluşturur ve siler — bu yüzden canlı adrese karşı çalışmayı reddeder (bkz. DAGSK_TEST_CANLI).
import { chromium } from 'playwright';

export const B = (process.env.DAGSK_TEST_URL || 'http://localhost:8787').replace(/\/$/, '');

export function canliMiKontrol() {
  const yerel = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(B);
  if (!yerel && process.env.DAGSK_TEST_CANLI !== '1') {
    throw new Error(`Testler veri oluşturup siliyor — ${B} yerel değil. Gerçekten istiyorsan DAGSK_TEST_CANLI=1 ver.`);
  }
}

// Yerel test hesabıyla oturum anahtarı. PIN koda YAZILMAZ: DAGSK_TEST_PIN ortam değişkeninden gelir.
let _token = null;
export async function oturumAl() {
  if (_token) return _token;
  const ad = process.env.DAGSK_TEST_KULLANICI || 'Burak';
  const pin = process.env.DAGSK_TEST_PIN;
  if (!pin) throw new Error('DAGSK_TEST_PIN ortam değişkeni gerekli (yerel test hesabının PIN\'i). Bkz. tests/e2e/README.md');
  const d = await (await fetch(B + '/api/giris/durum')).json();
  const k = (d.kullanicilar || []).find((x) => x.ad === ad);
  if (!k) throw new Error(`Yerel test hesabı "${ad}" yok — uygulamada ilk kurulumu yapıp bir hesap oluştur.`);
  const r = await (await fetch(B + '/api/giris/giris', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kullaniciId: k.id, pin, hatirla: true }) })).json();
  if (!r.token) throw new Error('Test girişi başarısız: ' + JSON.stringify(r));
  return (_token = r.token);
}

// JSON API çağrısı → { s: durum, d: gövde }. oturumsuz=true ise oturum başlığı gönderilmez.
export async function api(yol, opt = {}, oturumsuz = false) {
  const headers = { 'content-type': 'application/json', ...(oturumsuz ? {} : { 'X-Dagsk-Oturum': await oturumAl() }), ...(opt.headers || {}) };
  const r = await fetch(B + yol, { ...opt, headers });
  let d = null; try { d = await r.json(); } catch (e) {}
  return { s: r.status, d };
}

export function dogrula(kosul, mesaj) { if (!kosul) throw new Error(mesaj); }
export function esit(gercek, beklenen, mesaj) { if (gercek !== beklenen) throw new Error(`${mesaj} — beklenen ${JSON.stringify(beklenen)}, gelen ${JSON.stringify(gercek)}`); }
export function benzersiz(onEk) { return onEk + Array.from({ length: 5 }, () => String.fromCharCode(65 + Math.floor(Math.random() * 26))).join(''); }

let _tarayici = null;
export async function tarayici() { return _tarayici || (_tarayici = await chromium.launch()); }
export async function tarayiciKapat() { if (_tarayici) await _tarayici.close(); _tarayici = null; }

// Sayfa: oturum anahtarı önceden yazılı (girisli=true), window.open yakalanır (__acilan), sayfa hataları toplanır.
export async function sayfaAc({ girisli = true, genislik = 1280, yukseklik = 900 } = {}) {
  const b = await tarayici();
  const ctx = await b.newContext({ viewport: { width: genislik, height: yukseklik }, acceptDownloads: true });
  if (girisli) { const t = await oturumAl(); await ctx.addInitScript((tk) => { try { localStorage.setItem('dag_oturum', tk); } catch (e) {} }, t); }
  await ctx.addInitScript(() => { window.__acilan = []; window.open = (u) => { window.__acilan.push(u); return null; }; });
  const p = await ctx.newPage();
  const hatalar = [];
  p.on('pageerror', (e) => { if (!/Failed to fetch/.test(e.message)) hatalar.push(e.message); });
  p.on('dialog', (d) => d.accept());
  return { ctx, p, hatalar };
}
export async function uygulamaAc(p) {
  await p.goto(B + '/app.html');
  await p.waitForFunction(() => typeof turnuvaDB !== 'undefined' && Object.keys(turnuvaDB.buyukler || {}).length + Object.keys(turnuvaDB.yildizlar || {}).length > 0, null, { timeout: 90000 });
  const kulup = p.locator('button:has-text("DAĞ Okçuluk")');
  if (await kulup.isVisible().catch(() => false)) { await kulup.click(); await p.waitForTimeout(300); }
}
// Karışık Sınıf'a gir, bir aracı aç (kmAracSec). Geç yüklenen araçlar için dosyanın yüklenmesini bekler.
export async function karisikSinifArac(p, aracId, fnAd) {
  await p.locator('text=EĞİTMEN PLATFORMU').click(); await p.waitForTimeout(600);
  await p.locator('#km-giris-btn').click();
  await p.locator('button:has-text("Derse Devam Et")').first().waitFor({ timeout: 40000 }).catch(() => {});
  const k = p.locator('div', { hasText: 'Ana Salon' }).filter({ hasText: 'sporcu seçili' }).last();
  if (await k.isVisible().catch(() => false)) { await k.locator('button:has-text("Derse Devam Et")').click(); await p.waitForTimeout(800); }
  const kp = p.locator('button:has-text("✕")').first(); if (await kp.isVisible().catch(() => false)) { await kp.click(); await p.waitForTimeout(300); }
  await p.waitForFunction(() => typeof kmAracSec === 'function', null, { timeout: 30000 });
  await p.evaluate((id) => kmAracSec(id), aracId);
  if (fnAd) await p.waitForFunction((f) => typeof window[f] === 'function', fnAd, { timeout: 30000 });
  await p.waitForTimeout(800);
}
export async function yoneticiAc(p, sekme) {
  await p.evaluate(() => _yoneticiPaneliAcIc()); await p.waitForTimeout(400);
  if (sekme) { await p.evaluate((s) => yoneticiSekme(s), sekme); await p.waitForTimeout(500); }
}
export async function yataydaTasmaYok(p) { return p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1); }

// Milo (ikinci kulüp) — aynı test PIN'iyle ayrı Milo oturumu.
let _miloToken = null;
export async function miloOturumAl() {
  if (_miloToken) return _miloToken;
  const ad = process.env.DAGSK_TEST_KULLANICI || 'Burak', pin = process.env.DAGSK_TEST_PIN;
  const d = await (await fetch(B + '/api/milo/giris/durum')).json();
  const k = (d.kullanicilar || []).find((x) => x.ad === ad);
  if (!k) throw new Error(`Yerel Milo test hesabı "${ad}" yok.`);
  const r = await (await fetch(B + '/api/milo/giris/giris', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kullaniciId: k.id, pin, hatirla: true }) })).json();
  if (!r.token) throw new Error('Milo test girişi başarısız: ' + JSON.stringify(r));
  return (_miloToken = r.token);
}
export async function miloApi(yol, opt = {}, oturumsuz = false) {
  const headers = { 'content-type': 'application/json', ...(oturumsuz ? {} : { 'X-Dagsk-Oturum': await miloOturumAl() }) };
  const r = await fetch(B + '/api/milo' + yol, { ...opt, headers });
  let d = null; try { d = await r.json(); } catch (e) {}
  return { s: r.status, d };
}
