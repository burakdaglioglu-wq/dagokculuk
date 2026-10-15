// Yarışma › 🎥 Video analiz (2026-10-15, kullanıcı: "sözlü uyarılamıyor, gözüyle kendini görmesi gerekiyor; canlı ya da
// video yükleyerek ekranda gösterelim; 5 sn gecikmeli aynayı da buraya al").
// Sahte kamerayla (Chromium --use-fake-device-for-media-stream): skor girişinden 🎥 → pencere sporcunun adıyla açılır,
// gecikmeli ayna kare biriktirir ve geriden çizer, ⏪ tekrar kare kare ilerler, açı çizimi, canlı kayıt → video modu,
// Form Lab'a bu sporcu seçili devredilir. Tur kayda işlenmez (kayit=false); tur ve ders listesi sonunda geri yüklenir.
import { chromium } from 'playwright';
import { oturumAl, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const b = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const tok = await oturumAl();
  await ctx.addInitScript((tk) => { try { localStorage.setItem('dag_oturum', tk); } catch (e) {} }, tok);
  const p = await ctx.newPage();
  const hatalar = []; p.on('pageerror', (e) => { if (!/Failed to fetch/.test(e.message)) hatalar.push(e.message); });
  p.on('dialog', (d) => d.accept());
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()) }));
    const k = await p.evaluate(() => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif && !turnuvaDB[g][ad].donduruldu) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 3); localStorage.removeItem(kmHatAnahtari()); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
      yzKurulumTaslak(); yzKurAyar('kayit', false); yzCiz();
      return tum[0].g + '|' + tum[0].ad;
    });
    await p.locator('button:has-text("Turu başlat")').click(); await p.waitForTimeout(400);
    dogrula(await p.locator('.yz-tur-btn button:has-text("Ayna / Video")').isVisible(), 'tur çubuğunda Ayna / Video yok');
    // ok sayısı: bu sporcu bu seride 3 ok attı → 3 ok kaydedilir, tabloda "3 ok" rozeti; sonradan 6'ya çevrilebilir
    await p.evaluate((kk) => yzGirisAc(encodeURIComponent(kk), 0), k); await p.waitForTimeout(300);
    await p.locator('#yz-giris .yz-oksay button', { hasText: '3 ok' }).click();
    for (const v of ['10', '9', '8']) await p.locator('#yz-giris .yz-tus', { hasText: new RegExp('^' + v + '$') }).first().click();
    await p.locator('#yz-giris button:has-text("Kaydet")').click(); await p.waitForTimeout(300);
    esit(await p.evaluate((kk) => yzSkor(yzOku(), kk)[0].length, k), 3, '3 oklu seri kaydı');
    esit(await p.evaluate((kk) => yzOku().durum.okK[kk], k), 3, 'sporcunun ok sayısı');
    dogrula(await p.locator('.yz-okk', { hasText: '3 ok' }).first().isVisible(), 'tabloda 3 ok rozeti yok');
    await p.evaluate(() => yzGirisKapat());
    await p.evaluate((kk) => yzGirisAc(encodeURIComponent(kk), 0), k); await p.waitForTimeout(200);
    dogrula(await p.locator('#yz-giris .yz-oksay button.aktif', { hasText: '3 ok' }).isVisible(), 'düzeltmede 3 ok seçili açılmadı');
    await p.locator('#yz-giris .yz-oksay button', { hasText: '6 ok' }).click();
    esit(await p.evaluate((kk) => (yzOku().durum.okK || {})[kk] || 0, k), 0, '6 oka dönünce sporcu varsayılanı silinmedi');
    await p.evaluate(() => yzGirisKapat());
    // süre elle: ⏱ menüsünde −10 → Uygula → 80 sn (2026-10-15)
    await p.evaluate(() => yzSureMenu()); await p.waitForTimeout(300);
    await p.locator('#onay-modal .yz-sure-elle button', { hasText: '−10' }).click();
    await p.locator('#onay-modal .yz-sure-elle button', { hasText: 'Uygula' }).click(); await p.waitForTimeout(300);
    esit(await p.evaluate(() => yzSure(yzOku().durum)), 80, 'elle süre');
    // seriyi uzat: ⋯ → ➕ 1 seri (12 → 13), ➖ son boş seriyi kaldır (→ 12) (2026-10-15)
    await p.evaluate(() => yzMenu()); await p.waitForTimeout(300);
    await p.locator('#onay-modal button', { hasText: '1 seri' }).first().click(); await p.waitForTimeout(300);
    esit(await p.evaluate(() => yzFormat(yzOku().durum).seri), 13, 'seri uzatma');
    await p.evaluate(() => yzMenu()); await p.waitForTimeout(300);
    await p.locator('#onay-modal button:has-text("Son boş seriyi kaldır")').click(); await p.waitForTimeout(300);
    esit(await p.evaluate(() => yzFormat(yzOku().durum).seri), 12, 'uzatılan serinin geri alınması');
    // skor girişi → 🎥 Video
    await p.evaluate((kk) => yzGirisAc(encodeURIComponent(kk), 0), k); await p.waitForTimeout(300);
    await p.locator('#yz-giris button:has-text("🎥 Video")').click();
    await p.waitForSelector('#kv .kv', { timeout: 15000 });
    dogrula((await p.locator('#kv .kv-baslik b').innerText()).includes(k.split('|')[1]), 'pencere sporcunun adıyla açılmadı');
    // gecikmeli ayna: 3 sn seç, kareler birikip geriden çizilsin
    await p.locator('#kv button', { hasText: '3 sn' }).click();
    await p.waitForFunction(() => _kv && _kv.kareler.length > 25, null, { timeout: 15000 });
    await p.waitForFunction(() => /geriden/.test((document.getElementById('kv-rozet') || {}).textContent || ''), null, { timeout: 8000 });
    const dolu = await p.waitForFunction(() => { let c = document.getElementById('kv-c'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, top = 0; for (let i = 0; i < d.length; i += 400) top += d[i] + d[i + 1] + d[i + 2]; return top > 0; }, null, { timeout: 8000 }).then(() => true, () => false);
    dogrula(dolu, 'gecikmeli görüntü çizilmedi');
    // ⏪ tekrar: kare kare ilerle
    await p.locator('#kv button:has-text("yavaş izle")').click(); await p.waitForTimeout(300);
    await p.locator('#kv-oynat').click(); // durdur
    const i0 = await p.evaluate(() => _kv.tekrar.i);
    await p.locator('#kv button[aria-label="Bir kare ileri"]').click();
    esit(await p.evaluate(() => _kv.tekrar.i), i0 + 1, 'kare ileri çalışmadı');
    // açı çizimi: üç dokunuş
    await p.locator('#kv button:has-text("Açı")').click();
    const kutu = await p.locator('#kv-ciz').boundingBox();
    for (const [x, y] of [[0.3, 0.3], [0.5, 0.6], [0.7, 0.3]]) await p.mouse.click(kutu.x + kutu.width * x, kutu.y + kutu.height * y);
    esit(await p.evaluate(() => _kv.sekiller.length), 1, 'açı çizilmedi');
    await p.locator('#kv button:has-text("Aynaya dön")').click();
    // canlı: 2 sn kaydet → video modu
    await p.locator('#kv .kv-sekmeler button:has-text("Canlı")').click();
    await p.locator('#kv button:has-text("Kayda başla")').click({ timeout: 15000 });
    await p.waitForTimeout(2200);
    await p.locator('#kv button:has-text("Kaydı bitir")').click();
    await p.waitForFunction(() => _kv && _kv.mod === 'video' && _kv.video && _kv.video.size > 0, null, { timeout: 10000 });
    dogrula(await p.locator('#kv button:has-text("Form Lab")').isVisible(), 'Form Lab düğmesi yok');
    // Form Lab'a devret: yarışma penceresi kapanır, Form Lab bu sporcu seçili videoyu almış olur
    await p.locator('#kv button:has-text("Form Lab")').click();
    await p.waitForFunction(() => typeof _fl !== 'undefined' && _fl.hamBlob, null, { timeout: 20000 });
    esit(await p.evaluate(() => _fl.secili), k, 'Form Lab sporcusu');
    dogrula(!(await p.locator('#kv').count()), 'video penceresi kapanmadı');
    await p.evaluate(() => { _fl.iptal = true; });
    // Yumurta Yuvası'nda da süre: şeritte ⏱ → −5 → Uygula (80 → 75), ▶ başlat (2026-10-15)
    await p.evaluate(() => kmAracSec('yuva'));
    await p.waitForFunction(() => typeof kmYuvaCiz === 'function' && document.querySelector('.yv-yz'), null, { timeout: 20000 });
    await p.locator('.yv-yz button', { hasText: 'sn' }).click(); await p.waitForTimeout(300);
    await p.locator('#onay-modal .yz-sure-elle button', { hasText: '−5' }).click();
    await p.locator('#onay-modal .yz-sure-elle button', { hasText: 'Uygula' }).click(); await p.waitForTimeout(300);
    esit(await p.evaluate(() => yzSure(yzOku().durum)), 75, 'yumurtada elle süre');
    dogrula((await p.locator('.yv-yz').innerText()).includes('75 sn'), 'yumurta şeridi yeni süreyi göstermiyor');
    await p.locator('.yv-yz button', { hasText: 'Süreyi başlat' }).click(); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => !!yzOku().sayac), 'yumurtadan süre başlamadı');
    await p.evaluate(() => yzSayacDurdur());
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('seri uzat/kaldır; elle süre 80 sn (yumurtada 75); 3 ok seçimi + rozet + 6 oka dönüş; 🎥 skor girişinden açılır, 3 sn gecikmeli ayna çizer, ⏪ kare kare, açı çizimi, canlı kayıt → video → Form Lab (sporcu seçili) ✓');
  } finally {
    if (yedek) await p.evaluate((y) => {
      try { kvKapat(); } catch (e) {}
      if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar());
      if (y.hat) localStorage.setItem(kmHatAnahtari(), y.hat); else localStorage.removeItem(kmHatAnahtari());
      _kmListe = JSON.parse(y.liste); _kmListeKaydet();
    }, yedek).catch(() => {});
    await p.waitForTimeout(2500);
    await ctx.close(); await b.close();
  }
}
