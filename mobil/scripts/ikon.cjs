// Uygulama ikonu ve açılış ekranı kaynakları (assets/) — büyük logodan (../2-dagPNG.png, şeffaf rozet) üretilir.
// Sonra: npx capacitor-assets generate  → iOS ve Android'in tüm boyutları.
const sharp = require('sharp');
const ZEMIN = { r: 15, g: 23, b: 42, alpha: 1 }; // mevcut ikon-512.png zemini
async function rozet(boy) { return sharp('../2-dagPNG.png').trim().resize({ width: boy, height: boy, fit: 'inside' }).png().toBuffer(); }
async function kare(boyut, oran, cikti, zemin) {
  const r = await rozet(Math.round(boyut * oran));
  await sharp({ create: { width: boyut, height: boyut, channels: 4, background: zemin } }).composite([{ input: r, gravity: 'center' }]).png().toFile(cikti);
}
(async () => {
  await kare(1024, 0.8, 'assets/icon-tmp.png', ZEMIN); await sharp('assets/icon-tmp.png').flatten({ background: ZEMIN }).removeAlpha().toFile('assets/icon-only.png'); require('fs').unlinkSync('assets/icon-tmp.png'); // iOS: şeffaflık kanalı olmamalı (App Store reddeder)
  await kare(1024, 0.58, 'assets/icon-foreground.png', { r: 0, g: 0, b: 0, alpha: 0 });  // Android adaptif: güvenli alan %66
  await sharp({ create: { width: 1024, height: 1024, channels: 4, background: ZEMIN } }).png().toFile('assets/icon-background.png');
  await kare(2732, 0.3, 'assets/splash.png', ZEMIN); await kare(2732, 0.3, 'assets/splash-dark.png', ZEMIN);
  console.log('tamam');
})();
