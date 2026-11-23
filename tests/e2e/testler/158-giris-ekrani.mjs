// 📱 Giriş PIN ekranı (v451, kullanıcı: "telefonda ilk açtığımda altta kalmış, kasarak hareket ediyor"): tuşlar kaydırmadan sığar,
// vizör / sürüm / hesap satırı tuşları itmez, tuş basışında animasyon yok. Silinen / iptal hızlı arama eski sonuçla aynı.
// PIN sunucuya gönderilmez (kilit sayacına dokunmaz).
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

async function olc(p, ad, yuk) {
  await p.waitForSelector('#giris-sifre .pin-btn', { timeout: 20000 }); await p.waitForTimeout(400);
  const o = await p.evaluate(() => {
    const e = document.getElementById('giris-ekrani'), r = [...document.querySelectorAll('#giris-sifre .pin-btn')].map((x) => x.getBoundingClientRect()), ip = [...document.querySelectorAll('#giris-sifre .gs-alt button')].pop().getBoundingClientRect();
    const gor = (s) => { const x = document.querySelector(s); return !!x && x.offsetParent !== null; };
    return { tasma: e.scrollHeight - e.clientHeight, alt: Math.round(ip.bottom), boy: Math.round(Math.min(...r.map((x) => x.height))), gizli: !gor('#giris-ekrani > .gv-vizor') && !gor('#giris-ekrani > .giris-surum') && !gor('#giris-oturum-bilgi'), anim: [...e.children].some((x) => getComputedStyle(x).display !== 'none' && getComputedStyle(x).animationName !== 'none'), dokun: getComputedStyle(document.querySelector('#giris-sifre .pin-btn')).touchAction };
  });
  dogrula(o.tasma <= 1 && o.alt <= yuk, ad + ': tuşlar kaydırmadan sığmalı ' + JSON.stringify(o));
  dogrula(o.boy >= 48 && o.gizli && !o.anim && o.dokun === 'manipulation', ad + ': ' + JSON.stringify(o));
}
export default async function ({ log }) {
  // hatırlanan yönetici: PIN'i tekrar gir (kullanıcının ekranı, iPhone Chrome 390×663) + küçük telefon
  for (const [w, h] of [[390, 663], [375, 600]]) {
    const { ctx, p, hatalar } = await sayfaAc({ genislik: w, yukseklik: h });
    try {
      await uygulamaAc(p); await p.evaluate(() => { _yonYetkiSon = 0; platformSec('yonetici'); });
      await olc(p, 'PIN tekrar ' + w + 'x' + h, h);
      if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-g1-' + w + '.png' });
      for (const c of '123456') await p.locator('#giris-sifre .pin-btn', { hasText: new RegExp('^' + c + '$') }).click();
      esit(await p.locator('#sifre-display .dolu').count(), 6, 'noktalar'); await p.locator('#giris-sifre .gs-tus-kucuk').click(); esit(await p.locator('#sifre-display .dolu').count(), 5, 'sil');
      await p.evaluate(() => sifreGeri()); dogrula(await p.evaluate(() => getComputedStyle(document.querySelector('#giris-oturum-bilgi')).display !== 'none'), 'hesap satırı önceki ekranda durmalı');
      if (w === 390) {
        if (process.env.E2E_EKRAN) { await p.waitForTimeout(700); await p.screenshot({ path: process.env.E2E_EKRAN + '-g2.png' }); }
        // hızlı arama = eski tarama (push, filtre ile yeniden atama, boşaltma sonrası)
        const es = await p.evaluate(() => {
          const ys = silinenlerDB, yi = iptalSerilerDB, e = []; const bak = (ad) => { const s = (g, a) => silinenlerDB.some((x) => x.grup === g && x.ad === a); [['buyukler', 'A'], ['buyukler', 'B'], ['minikler', 'A']].forEach(([g, a]) => { if (silindiMi(g, a) !== s(g, a)) e.push(ad + g + a); }); ['i1', 'i2', null].forEach((i) => { if (seriIptalMi(i) !== (!!i && iptalSerilerDB.indexOf(i) >= 0)) e.push(ad + i); }); };
          silinenlerDB = [{ grup: 'buyukler', ad: 'A', tarih: 5, tasindi: true }]; iptalSerilerDB = ['i1']; bak('ilk'); silinenlerDB.push({ grup: 'buyukler', ad: 'B', tarih: 9 }); iptalSerilerDB.push('i2'); bak('ekle');
          if (silinmeEngelliyor('buyukler', 'A', { lastModified: 6 }) !== false || silinmeEngelliyor('buyukler', 'A', { lastModified: 4 }) !== true || silinmeEngelliyor('buyukler', 'B', { lastModified: 99 }) !== true) e.push('engel');
          silinenlerDB = silinenlerDB.filter((x) => x.ad !== 'A'); iptalSerilerDB = iptalSerilerDB.filter((x) => x !== 'i1'); bak('çıkar'); silinenlerDB = []; iptalSerilerDB = []; bak('boş'); silinenlerDB = ys; iptalSerilerDB = yi; return e;
        });
        esit(es.join(), '', 'hızlı arama eskisiyle aynı olmalı');
      }
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
  }
  // girişsiz: kişi seçimi + hatırla + parmak izi düğmesiyle en uzun hali
  const { ctx, p } = await sayfaAc({ girisli: false, genislik: 390, yukseklik: 663 });
  try {
    await uygulamaAc(p);
    dogrula(await p.evaluate(() => { const e = document.getElementById('giris-ekrani'); return e.scrollHeight - e.clientHeight <= 1 && document.querySelector('.gz-foto').naturalWidth === 1620; }), 'göz ekranı taşırmamalı');
    await p.evaluate(() => platformSec('yonetici')); await p.waitForSelector('#giris-sifre .pin-btn'); await p.evaluate(() => { _girisDurum.passkeyVar = true; girisPaneliCiz(); });
    await olc(p, 'giriş', 663); if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-g3.png' });
    await p.evaluate(() => { sifreGeri(); platformSec('egitmen'); }); await olc(p, 'eğitmen', 663); if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-g4.png' });
  } finally { await ctx.close(); }
}
