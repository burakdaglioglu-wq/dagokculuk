// Uçtan uca test çalıştırıcı:  npm run test:e2e            → hepsi
//                             npm run test:e2e -- yoklama  → adında "yoklama" geçenler
// Önce yerel sunucuyu başlat (npm run dev) ve DAGSK_TEST_PIN'i ver. Bkz. tests/e2e/README.md
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { B, canliMiKontrol, oturumAl, tarayiciKapat } from './yardimci.mjs';

const klasor = join(dirname(fileURLToPath(import.meta.url)), 'testler');
const filtre = process.argv.slice(2).join(' ').toLocaleLowerCase('tr-TR');
const dosyalar = readdirSync(klasor).filter((f) => f.endsWith('.mjs') && (!filtre || f.toLocaleLowerCase('tr-TR').includes(filtre))).sort();

try {
  canliMiKontrol();
  const r = await fetch(B + '/app.html', { redirect: 'manual' }).catch(() => null);
  if (!r) throw new Error(`${B} yanıt vermiyor — önce "npm run dev" ile yerel sunucuyu başlat.`);
  await oturumAl();
} catch (e) { console.error('✗ Hazırlık: ' + e.message); process.exit(2); }

let gecen = 0, kalan = [];
for (const f of dosyalar) {
  const t0 = Date.now();
  try {
    const mod = await import(pathToFileURL(join(klasor, f)).href);
    const notlar = [];
    await mod.default({ log: (...a) => notlar.push(a.join(' ')) });
    gecen++;
    console.log(`✓ ${f}  (${((Date.now() - t0) / 1000).toFixed(1)} sn)${notlar.length ? '\n    ' + notlar.join('\n    ') : ''}`);
  } catch (e) {
    kalan.push(f);
    console.log(`✗ ${f}  (${((Date.now() - t0) / 1000).toFixed(1)} sn)\n    ${String(e && e.stack || e).split('\n').slice(0, 3).join('\n    ')}`);
  }
}
await tarayiciKapat();
console.log(`\n${gecen}/${dosyalar.length} test geçti${kalan.length ? ' — BAŞARISIZ: ' + kalan.join(', ') : ''}`);
process.exit(kalan.length ? 1 : 0);
