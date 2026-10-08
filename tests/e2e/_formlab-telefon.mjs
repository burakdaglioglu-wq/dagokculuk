// Form Lab · telefonda analiz (2026-10-08) — elle çalıştırılan uçtan uca deneme (internetten MediaPipe modelleri iner).
// "Telefon" = sahte kamerası gerçek bir atış videosu olan ikinci Chromium; "bilgisayar" = giriş yapılmış Form Lab.
// Kontrol: telefon iskeleti kendisi çıkarıp 'iskelet' kanalından yollar, bilgisayar bunları kullanır (ANALİZ TELEFONDA),
// telefonun gönderimi kesilince bilgisayar kendi analizine döner. Kullanım: node tests/e2e/_formlab-telefon.mjs <y4m>
import { chromium } from 'playwright';
import { sayfaAc, uygulamaAc, karisikSinifArac, tarayiciKapat, B } from './yardimci.mjs';

const Y4M = process.argv[2];
const tel = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-video-capture=' + Y4M, '--autoplay-policy=no-user-gesture-required'] });
const { p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
let sonuc = 0;
try {
  await uygulamaAc(p);
  await karisikSinifArac(p, 'formlab', 'kmFormLabCiz');
  await p.evaluate(() => { try { localStorage.removeItem('dagsk_formlab_oda'); } catch (e) {} flTelefonAc(); });
  await p.waitForFunction(() => _fl.tel && _fl.tel.link, null, { timeout: 20000 });
  const link = await p.evaluate(() => _fl.tel.link.replace(location.origin, ''));
  const tp = await (await tel.newContext({ viewport: { width: 900, height: 500 }, permissions: ['camera', 'microphone'] })).newPage();
  const telHata = []; tp.on('pageerror', (e) => telHata.push(e.message)); tp.on('console', (m) => { if (m.type() === 'error') telHata.push(m.text()); });
  await tp.goto(B + link);
  await p.waitForFunction(() => _fl.tel && _fl.tel.durum === 'bagli', null, { timeout: 60000 });
  console.log('bağlandı');
  await tp.waitForFunction(() => window.KA && KA.durum === 'calisiyor', null, { timeout: 120000 });
  console.log('telefonda model çalışıyor; kare süresi ~', await tp.evaluate(() => Math.round(KA.ms)), 'ms');
  await p.evaluate(() => flCanliAc('ayna'));
  await p.waitForFunction(() => flTelAnalizTelefondaMi() && _fl.sonKare && _fl.sonKare.p, null, { timeout: 30000 });
  await p.waitForTimeout(3000);
  const r1 = await p.evaluate(() => ({ rozet: (document.getElementById('fl-canli-tel') || {}).textContent, kuyruk: _fl.tel.iskQ.length, gecikme: Math.round(_fl.tel.gecikme || 0), kalite: _fl.tel.kalite, telKare: _fl.canli && _fl.canli.telKare, pcKare: _fl.canli && _fl.canli.pcKare }));
  console.log('canlı:', JSON.stringify(r1));
  if (!/TELEFONDA/.test(r1.rozet || '')) throw new Error('rozet "ANALİZ TELEFONDA" değil: ' + r1.rozet);
  // telefonun gönderimi kesilince bilgisayar kendi analizine dönmeli
  await tp.evaluate(() => { KA.gonder = null; });
  await p.waitForTimeout(2500);
  const r2 = await p.evaluate(() => ({ tel: flTelAnalizTelefondaMi(), pcKare: _fl.canli && _fl.canli.pcKare, son: !!(_fl.sonKare && _fl.sonKare.p) }));
  console.log('yedek:', JSON.stringify(r2));
  if (r2.tel) throw new Error('gönderim kesildi ama hâlâ telefonda sanılıyor');
  if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-fl-telefon.png' });
  console.log('sayfa hataları:', hatalar, 'telefon hataları:', telHata.filter((x) => !/favicon|404/.test(x)).slice(0, 5));
  sonuc = 1;
} catch (e) { console.error('HATA', e.message); }
finally { await tel.close(); await tarayiciKapat(); }
process.exit(sonuc ? 0 : 1);
