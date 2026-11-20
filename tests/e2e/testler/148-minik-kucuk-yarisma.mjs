// 🌟 Minikler & Küçükler Yarışması (2026-11-20, v441; kullanıcı: "minikler küçükler için yarışma sekmesinde nereye tıklayacağım
// çok karışık, bunları da ekle"). Yarışma → ilk kart tek dokunuşla hazır kurar (minik + küçük seçili, 6×3, 18 m, 120 sn,
// İlk 4 kalsın, TV Işıklı Kartlar); her adımda "şimdi ne yapacağım" bandı; Başlat → TV Kartlar; tur ve sonuç ekranında da bant.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  const O = 'tests/e2e/_cikti/148-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), g: localStorage.getItem('dag_yz_tv_gorunum'), a: localStorage.getItem('dag_yz_kur_ayrintili') }));
    const beklenen = await p.evaluate(() => { localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; _yz.mod = 'secim'; _yz.secimAcik = true; kmYarismaGiris(); return yzMinikSporcular().length; });
    dogrula(beklenen >= 2, 'testte en az 2 minik/küçük sporcu gerekli (' + beklenen + ')');
    // 1) Ne oynuyoruz → ilk kart minik
    await p.waitForSelector('.yzr-k.yzr-minik');
    esit(await p.evaluate(() => document.querySelector('.yzr-izgara .yzr-k').classList.contains('yzr-minik')), true, 'minik kartı ilk sırada olmalı');
    await p.screenshot({ path: O + '1-sec.png', fullPage: true });
    await p.locator('.yzr-k.yzr-minik').click(); await p.waitForTimeout(400);
    const t = await p.evaluate(() => { const t = yzKurulumTaslak(), f = yzFormatBul(t.format); return { n: t.katilimci.length, hepsi: t.katilimci.every((k) => /^(minikler|kucukler)\|/.test(k)), mod: t.siraModu, seri: f.seri, ok: f.ok, sure: t.sure, tv: yzTvGorunum(), minik: t.minik, bant: (document.querySelector('.yz-mr-a.su') || {}).textContent }; });
    esit(t.n, beklenen, 'bütün minik/küçükler seçili'); dogrula(t.hepsi, 'yalnız minik ve küçükler'); esit(t.mod, 'ilk4', 'İlk 4 kalsın'); esit(t.seri + '×' + t.ok, '6×3', '6 seri × 3 ok'); esit(t.sure, 120, '120 sn'); esit(t.tv, 'kartlar', 'TV Işıklı Kartlar'); dogrula(/Kimler geldi/.test(t.bant || ''), 'bant 1. adımı göstermeli');
    // gelmeyen: bir yüze dokun
    if (t.n > 2) { await p.locator('.yzr-yuz').first().click(); await p.waitForTimeout(200); esit(await p.evaluate(() => yzKurulumTaslak().katilimci.length), t.n - 1, 'dokununca gelmeyen çıkmalı'); }
    await p.screenshot({ path: O + '2-kimler.png', fullPage: true });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px kimler taşıyor');
    await p.screenshot({ path: O + '2-telefon.png', fullPage: true });
    await p.setViewportSize({ width: 1280, height: 900 });
    await p.locator('.yzr-ileri').click(); await p.waitForTimeout(300);
    dogrula(/Atış ayarı/.test(await p.locator('.yz-mr-a.su').textContent()), 'bant 2. adım');
    await p.locator('.yzr-ileri').click(); await p.waitForTimeout(300);
    dogrula(/Başlat/.test(await p.locator('.yz-mr-a.su').textContent()), 'bant 3. adım');
    esit(await p.locator('.yzr-k.aktif', { hasText: 'İlk 4 kalsın' }).count(), 1, 'sihirbazda İlk 4 seçili');
    await p.evaluate(() => { yzKurulumTaslak().kayit = false; }); // test karneye yazmasın
    await p.locator('.yzr-ileri').click();
    await p.waitForSelector('#yz-tv #yzk', { timeout: 20000 });
    await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(400);
    const d = await p.evaluate(() => { const d = yzOku().durum; return { asama: d.asama, minik: d.ayar.minik, mod: d.ayar.siraModu }; });
    esit(d.asama, 'tur', 'tur başlamalı'); esit(d.minik, true, 'minik bayrağı'); esit(d.mod, 'ilk4', 'mod');
    await p.screenshot({ path: O + '3-tv.png' });
    await p.evaluate(() => yzTvKapat()); await p.waitForTimeout(300); await p.evaluate(() => yzCiz()); await p.waitForTimeout(300);
    dogrula(/Skor gir/.test(await p.locator('.yz-mr-a.su').textContent()), 'tur ekranında bant: skor gir');
    esit(await p.locator('#km-icerik .yz-yeniler').count(), 0, 'minik turunda "Derse yeni geldi" önerisi çıkmamalı');
    await p.screenshot({ path: O + '4-tur.png', fullPage: true });
    await p.evaluate(() => yzBitir(true)); await p.waitForTimeout(400); await p.evaluate(() => yzCiz()); await p.waitForTimeout(300);
    dogrula(/Bitir/.test(await p.locator('.yz-mr-a.su').textContent()), 'sonuç ekranında bant');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('ilk kart minik → ' + t.n + ' sporcu, 6×3, İlk 4, Kartlar · bant 5 adımda · Başlat → TV Kartlar · 390 px');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzTvKapat(); } catch (e) {} const w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); }; w(yzAnahtar(), y.yz); w('dag_yz_tv_gorunum', y.g); w('dag_yz_kur_ayrintili', y.a); _yz.kurulum = null; }, yedek).catch(() => {});
    await ctx.close();
  }
}
