// 🏠 Antrenör ana ekranı (v453, kullanıcı: boş "Ana Ekran — Sporcu girişi yap" + kahverengi Ana Menü penceresi "çok saçma"): Yönetici
// kapanınca ve Ana Menü'de aynı gerçek ekran; her şey dokunulur; lig seçince skor; sporcu girişinde sporcunun ekranı aynen.
import { sayfaAc, uygulamaAc, yoneticiAc, dogrula, esit } from '../yardimci.mjs';
export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 663 });
  try {
    await uygulamaAc(p); await p.waitForFunction(() => !!_oturum || !!_oturumToken); await p.evaluate(() => oturumYukle());
    await p.evaluate(() => { document.getElementById('giris-ekrani').style.display = 'none'; }); await yoneticiAc(p); await p.waitForTimeout(600);
    // ✕ → ana ekran (eskiden "Sporcu girişi yap")
    await p.locator('#yonetici-modal-header [aria-label="Yöneticiyi kapat"]').click(); await p.waitForSelector('#koc-ana .koc-km', { timeout: 10000 }); await p.waitForTimeout(900);
    const o = await p.evaluate(() => { const e = document.getElementById('icerik-ana'), g = (s) => { const x = document.querySelector(s); return !!x && x.getClientRects().length > 0; }; return { metin: e.textContent, menu: !!document.getElementById('ana-menu-modal'), ust: g('#ust-bar'), alt: g('#alt-bar'), tas: e.scrollWidth > e.clientWidth + 1, dug: [...e.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().height < 40).length, plat: aktifPlatform, etiket: document.getElementById('aktif-grup-etiket').textContent, kart: e.querySelectorAll('.ym-kart').length, lig: e.querySelectorAll('.koc-lig button').length }; });
    dogrula(!/Sporcu girişi yap/.test(o.metin) && !o.menu, 'boş ekran / menü penceresi kalkmalı'); dogrula(!o.ust && o.alt && !o.tas && o.dug === 0, 'düzen ' + JSON.stringify({ ust: o.ust, alt: o.alt, tas: o.tas, dug: o.dug }));
    esit(o.plat, 'egitmen', 'platform'); dogrula(!/SEÇİLMEDİ/.test(o.etiket), 'lig yazısı'); esit(o.kart, 4, 'kart'); esit(o.lig, 4, 'lig');
    if (process.env.E2E_EKRAN) { await p.screenshot({ path: process.env.E2E_EKRAN + '-a1.png' }); await p.setViewportSize({ width: 390, height: 1700 }); await p.waitForTimeout(400); await p.screenshot({ path: process.env.E2E_EKRAN + '-a2.png' }); await p.setViewportSize({ width: 390, height: 663 }); }
    // Yönetici › Ana Menü → aynı ekran
    await p.evaluate(() => _yoneticiPaneliAcIc()); await p.waitForTimeout(300); await p.locator('#yonetici-modal-header [aria-label="Ana Menü"]').click();
    dogrula(await p.locator('#koc-ana').isVisible() && !(await p.locator('#yonetici-modal').isVisible()), 'Ana Menü → ana ekran');
    // kart → sekme, alt çubuk Ana → geri
    await p.locator('#koc-ana .ym-kart', { hasText: 'Canlı Takip' }).click(); dogrula(await p.evaluate(() => document.getElementById('icerik-canlitakip').classList.contains('aktif') && !document.body.classList.contains('koc-ana')), 'Canlı Takip'); await p.waitForTimeout(300);
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-a3.png' });
    await p.locator('#altbar-ana').click(); await p.waitForSelector('#koc-ana');
    for (const [ad, id] of [['Sayaç', 'timer'], ['Liderlik', 'liderlik'], ['Klasman', 'klasman'], ['Takımlar', 'takimlar'], ['Düello', 'duello']]) { await p.locator('#koc-ana .ym-oge', { hasText: ad }).click(); dogrula(await p.evaluate((x) => document.getElementById('icerik-' + x).classList.contains('aktif'), id), ad); await p.evaluate(() => sekmeAc('ana')); }
    // lig → skor; Lig değiştir (giriş paneli) → o ligin skoru
    await p.locator('.koc-lig button', { hasText: 'Küçükler' }).click(); dogrula(await p.evaluate(() => aktifGrup === 'kucukler' && document.getElementById('icerik-skor').classList.contains('aktif') && /KÜÇÜKLER/.test(document.getElementById('aktif-grup-etiket').textContent)), 'lig seç → skor');
    await p.evaluate(() => { sekmeAc('ana'); grupKurulumu('yildizlar'); }); dogrula(await p.evaluate(() => aktifGrup === 'yildizlar' && document.getElementById('icerik-skor').classList.contains('aktif')), 'giriş panelinden lig');
    // Karışık Sınıf kartı açar
    await p.evaluate(() => { sekmeAc('ana'); window.__km = 0; window.kmAc = () => { window.__km++; }; }); await p.locator('.koc-km').click(); esit(await p.evaluate(() => window.__km), 1, 'Karışık Sınıf');
    // senkron yenilemesi kaydırmayı bozmaz
    const y = await p.evaluate(async () => { let e = document.getElementById('icerik-ana'); e.scrollTop = 200; await new Promise((r) => setTimeout(r, 5200)); kocAnaYenile(); return e.scrollTop; }); dogrula(y > 150, 'kaydırma yeri ' + y);
    // sporcu girişi: sporcunun kendi ekranı
    const sp = await p.evaluate(() => { let g = AIDAT_GRUPLAR.find((x) => Object.keys(turnuvaDB[x] || {}).some((a) => !turnuvaDB[x][a].pasif)), ad = Object.keys(turnuvaDB[g]).find((a) => !turnuvaDB[g][a].pasif); loggedInSporcu = ad; aktifGrup = g; sekmeAc('ana'); let r = { koc: !!document.getElementById('koc-ana'), sinif: document.body.classList.contains('koc-ana') }; loggedInSporcu = null; sekmeAc('ana'); return r; });
    dogrula(!sp.koc && !sp.sinif, 'sporcu ekranı değişmemeli');
    if (process.env.E2E_EKRAN) { await p.evaluate(() => document.body.classList.add('light-theme')); await p.waitForTimeout(500); await p.screenshot({ path: process.env.E2E_EKRAN + '-a4.png' }); await p.evaluate(() => document.body.classList.remove('light-theme')); await p.setViewportSize({ width: 1280, height: 850 }); await p.waitForTimeout(400); await p.screenshot({ path: process.env.E2E_EKRAN + '-a5.png' }); }
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
  } finally { await ctx.close(); }
}
