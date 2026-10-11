// Elle deneme (PIN gerektirmez): giriş ekranında app.js yüklü → yarışma modülünü yükle, sahte sporcularla 12×6 sıralama
// turu kur, ilk yarıyı gir; hedef panelini, 3 temayı, TV'yi, büyük sayacı ve Kapat düğmesini dene, ekran görüntüsü al.
// Kullanım: node tests/e2e/_yz-tv-kontrol.mjs  (yerel sunucu açık olmalı; CIKTI=klasör/)
import { chromium } from 'playwright';
import fs from 'fs';
const O = process.env.CIKTI || 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/a34eadc3-762f-45c5-9abc-c9cab8d6c143/scratchpad/yz/';
fs.mkdirSync(O, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
const hata = []; p.on('pageerror', (e) => hata.push('pageerror: ' + e.message)); p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load|401|403|404/.test(m.text())) hata.push('console: ' + m.text()); });
await p.goto('http://localhost:8787/app.html');
await p.waitForFunction(() => typeof dagskEkYukle === 'function' && typeof turnuvaDB !== 'undefined', null, { timeout: 60000 });
await p.evaluate(() => dagskEkYukle('dagsk-km-yarisma-pro.js'));
await p.waitForFunction(() => typeof yzBaslat === 'function');
await p.evaluate(() => {
  const A = ['ELİF YILDIZ', 'CAN DEMİR', 'ADA KAYA', 'MERT ŞAHİN', 'DEFNE ARSLAN', 'KEREM ÖZ'];
  turnuvaDB.kucukler = turnuvaDB.kucukler || {};
  const t0 = Date.now() - 86400000 * 10;
  A.forEach((a, i) => { const s = []; for (let j = 0; j < 30; j++) { const o = Array.from({ length: 6 }, () => String(Math.max(3, Math.min(10, Math.round(7.5 - i * 0.4 + (Math.random() - 0.5) * 3))))); s.push({ seriId: a + j, oklar: o, puan: o.reduce((x, v) => x + +v, 0), tarih: '2026-10-01', t: t0 + j * 1000 }); } turnuvaDB.kucukler[a] = { seriler: s, devamModu: true, dogumYili: 2015 + (i % 3), yay: 'Klasik' }; });
  _kmListe.length = 0; A.forEach((a) => _kmListe.push({ g: 'kucukler', ad: a }));
  let ic = document.getElementById('km-icerik') || document.createElement('div'); ic.id = 'km-icerik'; document.body.appendChild(ic);
  ic.style.cssText = 'position:fixed;inset:0;z-index:30000;overflow:auto;background:#000;padding:12px;display:block';
  yzCssYukle(); localStorage.removeItem(yzAnahtar()); localStorage.removeItem('dag_yz_dev_sayac'); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
  yzKurAyar('kayit', false); const x = yzKurulumTaslak(); x.katilimci = yzRoster().map((k) => k.g + '|' + k.ad); yzBaslat();
  for (let s = 0; s < 6; s++) { if (s) yzGuncelle((o) => { o.durum.seri = s; }); yzOku().durum.katilimci.forEach((k, i) => { yzGirisAc(yzEnc(k), s); ['10', '9', '9', '8', '8', '7'].map((v, j) => String(Math.max(1, +v - (i % 3) + (j === s % 6 ? 1 : 0)))).forEach((v) => yzOkEkle(v)); yzGirisKaydet(); }); }
  yzGuncelle((o) => { o.durum.seri = 6; }); yzCiz();
});
// hedef paneli: 2 tema
for (const t of ['gece', 'kagit']) {
  await p.evaluate((t) => { localStorage.setItem('dag_yz_ana_tema', t); yzHedeflerAc(); yzHedefSec(0, +document.querySelector('#yzh-k-0 .yzh-tas.ger').dataset.v); yzHedefSec(1, +document.querySelector('#yzh-k-1 .yzh-tas.iddia').dataset.v); }, t);
  await p.waitForTimeout(400); await p.screenshot({ path: O + '2-hedef-' + t + '.png' });
}
await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300); await p.screenshot({ path: O + '2-hedef-tel.png' });
await p.setViewportSize({ width: 1600, height: 900 });
await p.evaluate(() => { yzHedefToplu('ger'); yzHedefSec(2, +document.querySelector('#yzh-k-2 .yzh-tas.kolay').dataset.v); yzHedeflerKaydet(); });
await p.waitForTimeout(300);
for (const t of ['gece', 'kagit', 'neon']) { await p.evaluate((t) => yzAnaTemaSec(t), t); await p.waitForTimeout(400); await p.screenshot({ path: O + '1-ana-' + t + '.png', fullPage: false }); }
await p.evaluate(() => yzAnaTemaAc()); await p.waitForTimeout(300); await p.screenshot({ path: O + '1-tema-secici.png' }); await p.evaluate(() => onayKapat());
await p.evaluate(() => yzTvAc()); await p.waitForTimeout(1200); await p.screenshot({ path: O + '3-tv-kagit.png' });
await p.evaluate(() => yzTvTemaDegis()); await p.waitForTimeout(600); await p.screenshot({ path: O + '3-tv-koyu.png' });
const kapat = await p.evaluate(() => { const k = document.querySelector('#yz-tv .yz-tv-kapat'); const r = k.getBoundingClientRect(), cs = getComputedStyle(k); return { r: [r.left, r.top, r.width, r.height].map(Math.round), op: cs.opacity, fs: cs.fontSize, ust: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === k }; });
console.log('KAPAT', JSON.stringify(kapat));
// süre menüsü TV üstünde görünüyor mu (gerçek tıklama)
await p.click('#yz-tv button[onclick="yzSureMenu()"]'); await p.waitForTimeout(300);
console.log('SÜRE MENÜSÜ üstte:', await p.evaluate(() => { const m = document.querySelector('#onay-modal .yz-cip'); if (!m) return 'yok'; const r = m.getBoundingClientRect(); const t = document.elementFromPoint(r.left + 5, r.top + 5); return t === m || (t.closest('#yz-tv') ? 'TV ' : 'disari ') + 'parent=' + document.getElementById('onay-modal').parentElement.id + ' ' + (t.id + '|' + t.className + '|' + JSON.stringify([r.left, r.top]) + getComputedStyle(document.getElementById('onay-modal')).display + ' z=' + getComputedStyle(document.getElementById('onay-modal')).zIndex + ' bodyCls=' + document.body.className + ' fs=' + !!document.fullscreenElement); })); await p.screenshot({ path: O + '3-sure.png' });
await p.evaluate(() => onayKapat());
// büyük sayaç: aç, başlat, kısa süre
await p.click('#yz-tv button[onclick="yzDevSayacDegis()"]');
await p.evaluate(() => { yzSureSec('tur', 10); yzGuncelle((o) => { o.sayac = { basla: Date.now(), hazir: 2, sure: 10, seri: o.durum.seri }; }); yzCiz(); });
await p.waitForTimeout(1000); await p.screenshot({ path: O + '4-dev-hazirlik.png' });
await p.waitForTimeout(2500); await p.screenshot({ path: O + '4-dev-atis.png' });
await p.waitForTimeout(8000); await p.screenshot({ path: O + '4-dev-bitti.png' });
await p.waitForTimeout(3500);
console.log('bitince kapandı mı:', await p.evaluate(() => !document.getElementById('yz-dev-sayac')));
await p.screenshot({ path: O + '4-dev-sonra.png' });
await p.click('#yz-tv .yz-tv-kapat'); await p.waitForTimeout(500);
console.log('TV kapandı:', await p.evaluate(() => !document.getElementById('yz-tv')));
await p.screenshot({ path: O + '5-tvden-cikis.png' });
console.log('hatalar', JSON.stringify(hata));
await b.close();
