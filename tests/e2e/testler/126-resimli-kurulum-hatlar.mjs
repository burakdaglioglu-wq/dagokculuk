// 2026-11-15 (v418) kullanıcı: "TV ekranı ve TV ekranı öncesi tema, stil, kurulum daha güzel, daha anlaşılır olsun, hatta fotoğraflı
// seçim" → taslaktan "A ve 2". Resimli adım adım kurulum: 1 Ne oynuyoruz (resimli kartlar) → 2 Kimler burada (yüzler; dokun → gri)
// → 3 Nasıl atılacak (seri/ok/mesafe/kâğıt/süre resimleri) → 4 TV (Hedef hatları/Sahne/Tablo + renk) → Başlat ve TV'yi aç.
// TV "Hedef hatları": her hedef bir sütun, sporcu satırı, ✓ girdi / bekliyor, ilk 3, renk; 18 ve 24 sporcuda taşma yok; telefonda kurulum
// taşmaz. Ayrıntılı (eski) kurulum tercih olarak hatırlanır. Veriler geri yüklenir (kayıt kapalı, karneye yazılmaz).
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  const O = 'tests/e2e/_cikti/126-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), g: localStorage.getItem('dag_yz_tv_gorunum'), r: localStorage.getItem('dag_yz_tv_renk'), a: localStorage.getItem('dag_yz_kur_ayrintili'), liste: JSON.stringify(_kmListe), mod: localStorage.getItem('dag_yz_mod') }));
    // resimli kart: adı tam bu olan (ör. "6 seri", "16 seri" değil)
    const kart = (ad) => p.locator('.yzr-k').filter({ has: p.locator('.yzr-yazi > b').filter({ hasText: new RegExp('^' + ad + '( |$)') }) }).first().click();
    const n = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      window.__tum = tum; _kmListe = tum.slice(0, 19); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null;
      localStorage.setItem('dag_yz_kur_ayrintili', '0'); _yzr.ayrintili = false; localStorage.removeItem('dag_yz_tv_v418'); localStorage.setItem('dag_yz_tv_gorunum', 'sahne');
      _yz.mod = 'secim'; _yz.secimAcik = true; kmYarismaGiris();
      return _kmListe.length;
    });
    esit(n, 19, 'testte 19 sporcu gerekli');
    // varsayılan TV görünümü bir kez Hedef hatları olur
    esit(await p.evaluate(() => yzTvGorunum()), 'hatlar', 'v418 sonrası TV varsayılanı Hedef hatları olmalı');
    // 1) Ne oynuyoruz?
    dogrula(await p.locator('#km-icerik .yzr-k svg').count() >= 7, 'tür kartlarında resim yok');
    await p.screenshot({ path: O + '1-tur.png', fullPage: true });
    await kart('Sıralama Turu'); await p.waitForTimeout(300);
    // 2) Kimler burada?
    dogrula(/Kimler burada/.test(await p.locator('.yzr-soru').textContent()), '2. adım açılmadı');
    esit(await p.locator('.yzr-yuz').count(), 19, 'her sporcunun yüz kartı');
    await p.locator('.yzr-yuz').last().click(); await p.waitForTimeout(200);
    esit(await p.evaluate(() => yzKurulumTaslak().katilimci.length), 18, 'dokununca gelmeyen çıkmadı');
    dogrula(await p.locator('.yzr-yuz').last().evaluate((e) => e.classList.contains('yok')), 'gelmeyen gri görünmüyor');
    await kart('3 kişi'); await p.waitForTimeout(200);
    esit(await p.evaluate(() => yzKurulumTaslak().hedefBasi), 3, 'hedef başı 3 seçilmedi');
    await p.screenshot({ path: O + '2-kimler.png', fullPage: true });
    await p.locator('.yzr-ileri').click(); await p.waitForTimeout(300);
    // 3) Nasıl atılacak?
    await kart('6 seri'); await p.waitForTimeout(150);
    await kart('3 ok'); await p.waitForTimeout(150);
    await kart('18 metre'); await p.waitForTimeout(150);
    await kart('120 saniye'); await p.waitForTimeout(150);
    const t = await p.evaluate(() => { const t = yzKurulumTaslak(); return t.format + '|' + t.mesafe + '|' + t.sure; });
    esit(t, 's6o3|18m|120', 'resimli seçimler taslağa yazılmadı');
    await p.screenshot({ path: O + '3-nasil.png', fullPage: true });
    await p.locator('.yzr-ileri').click(); await p.waitForTimeout(300);
    // 4) TV
    dogrula(await p.locator('.yzr-k.aktif', { hasText: 'Hedef hatları' }).count() === 1, 'Hedef hatları seçili gelmedi');
    await kart('Gece'); await p.waitForTimeout(150);
    esit(await p.evaluate(() => localStorage.getItem('dag_yz_tv_renk')), 'gece', 'renk seçilmedi');
    await p.evaluate(() => { const c = document.querySelector('.yzr input[type=checkbox]'); if (c && c.checked) c.click(); });
    await p.screenshot({ path: O + '4-tv-sec.png', fullPage: true });
    // telefon: kurulum taşmaz
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px kurulum taşıyor');
    await p.screenshot({ path: O + '4-telefon.png', fullPage: true });
    await p.evaluate(() => yzrAdim(1)); await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yüzler taşıyor');
    await p.screenshot({ path: O + '2-telefon.png', fullPage: true });
    await p.evaluate(() => yzrAdim(3));
    await p.setViewportSize({ width: 1920, height: 1080 }); await p.waitForTimeout(250);
    // Başlat ve TV'yi aç
    await p.locator('.yzr-ileri').click();
    await p.waitForSelector('#yz-tv .yzh-tv .yzh-h', { timeout: 15000 });
    await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(400);
    const d = await p.evaluate(() => { const d = yzOku().durum; return { asama: d.asama, n: d.katilimci.length, kayit: d.ayar.kayit }; });
    dogrula(d.asama === 'tur' && d.n === 18, 'tur başlamadı: ' + JSON.stringify(d));
    esit(d.kayit, false, 'test kayıtsız olmalı');
    esit(await p.locator('#yz-tv .yzh-h').count(), 6, '18 sporcu / 3 = 6 hedef sütunu');
    esit(await p.locator('#yz-tv .yzh-s:not(.bos)').count(), 18, 'her sporcu bir satır');
    esit(await p.locator('#yz-tv .yzh-tv').getAttribute('data-renk'), 'gece', 'TV rengi gece değil');
    dogrula(await p.locator('#yz-tv #yz-tv-sayac').count() === 1, 'hatlarda sayaç yok');
    // skorlar: yarısı girdi
    await p.evaluate(() => yzGuncelle((o) => { const d = o.durum; d.katilimci.forEach((k, i) => { if (i % 2) return; o[yzSKey(d.id, k)] = [[['10', '9', '8'], ['9', '9', '7'], ['X', '10', '9']][i % 3]]; }); }));
    await p.evaluate(() => yzTvCiz()); await p.waitForTimeout(600);
    esit(await p.locator('#yz-tv .yzh-s .dur.ok').count(), 9, '9 sporcu ✓ girdi görünmeli');
    dogrula(/9\/18/.test(await p.locator('#yz-tv .yzh-alt').textContent()), 'altta 9/18 yok');
    esit(await p.locator('#yz-tv .yzh-alt .ilk').count(), 3, 'ilk 3 yok');
    dogrula(await p.locator('#yz-tv .yzh-s.lider').count() >= 1, 'lider vurgusu yok');
    const tasma = () => p.evaluate(() => { const tv = document.querySelector('.yzh-tv').getBoundingClientRect(); return [...document.querySelectorAll('.yzh-s, .yzh-alt, .yzh-bas')].every((e) => { const r = e.getBoundingClientRect(); return r.bottom <= tv.bottom + 1 && r.right <= tv.right + 1; }) && [...document.querySelectorAll('.yzh-s:not(.bos)')].every((e) => { const r = e.getBoundingClientRect(), b = e.querySelector('.bilgi').getBoundingClientRect(), v = e.querySelector('.yzh-av').getBoundingClientRect(); return b.bottom <= r.bottom + 1 && v.top >= r.top - 1 && b.right <= r.right + 1; }); });
    dogrula(await tasma(), '18 sporcuda hatlar taşıyor');
    // yeni skor → o satır vurgulanır
    const k = await p.evaluate(() => { const d = yzOku().durum, k = d.katilimci[1]; yzGuncelle((o) => { o[yzSKey(d.id, k)] = [['X', 'X', '10']]; }); yzTvCiz(); return k; });
    await p.waitForTimeout(500);
    dogrula(await p.locator('#yz-tv .yzh-s.yeni').count() === 1, 'az önce giren vurgulanmadı');
    await p.screenshot({ path: O + '5-tv-18.png' });
    // satıra dokun → skor girişi açılır
    await p.locator('#yz-tv .yzh-s:not(.bos)').nth(2).click(); await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => !!_yz.giris), 'satıra dokununca skor girişi açılmadı');
    await p.evaluate(() => yzGirisKapat());
    // renk düğmesi ve görünüm geçişi
    await p.evaluate(() => yzhRenkDegis()); await p.waitForTimeout(300);
    esit(await p.locator('#yz-tv .yzh-tv').getAttribute('data-renk'), 'kestane', 'renk düğmesi değiştirmedi');
    await p.screenshot({ path: O + '6-tv-kestane.png' });
    await p.evaluate(() => yzTvGorunumSec('sahne')); await p.waitForSelector('#yz-tv .yzs-tv', { timeout: 15000 });
    await p.evaluate(() => yzTvGorunumSec('hatlar')); await p.waitForSelector('#yz-tv .yzh-tv', { timeout: 15000 });
    dogrula(await p.locator('#yz-tv .yzs-tv').count() === 0, 'Sahne kalıntısı kaldı');
    await p.evaluate(() => yzTvKapat());
    // 24 sporcu, hedefte 4 kişi
    await p.evaluate(() => { _kmListe = window.__tum.slice(0, 24); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama'); const t = yzKurulumTaslak(); t.katilimci = _kmListe.map((k) => k.g + '|' + k.ad); t.hedefBasi = 4; t.kayit = false; t.format = yzFormatAnahtar(12, 3); yzBaslat(); localStorage.setItem('dag_yz_tv_renk', 'komur'); yzTvAc(); });
    await p.waitForSelector('#yz-tv .yzh-tv .yzh-h', { timeout: 15000 }); await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(500);
    esit(await p.locator('#yz-tv .yzh-h').count(), 6, '24 / 4 = 6 hedef');
    await p.screenshot({ path: O + '7-tv-24.png' });
    dogrula(await tasma(), '24 sporcuda hatlar taşıyor');
    await p.screenshot({ path: O + '7-tv-24.png' });
    await p.evaluate(() => yzTvKapat());
    // 30 sporcu, hedefte 1 kişi → çok hedef, iki sıra
    await p.evaluate(() => { _kmListe = window.__tum.slice(0, 30); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; const t = yzKurulumTaslak(); t.katilimci = _kmListe.map((k) => k.g + '|' + k.ad); t.hedefBasi = 2; t.kayit = false; yzBaslat(); yzTvAc(); });
    await p.waitForSelector('#yz-tv .yzh-tv .yzh-h', { timeout: 15000 }); await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(500);
    dogrula(await tasma(), (await p.evaluate(() => yzOku().durum.katilimci.length)) + ' sporcu / 2 kişi hedefte taşıyor');
    await p.screenshot({ path: O + '8-tv-30.png' });
    await p.evaluate(() => yzTvKapat());
    // ayrıntılı kurulum tercihi hatırlanır
    await p.evaluate(() => { localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzCiz(); yzrAyrintili(true); });
    dogrula(await p.locator('button', { hasText: 'Turu başlat' }).count() === 1 && await p.evaluate(() => localStorage.getItem('dag_yz_kur_ayrintili')) === '1', 'ayrıntılı kurulum açılmadı / hatırlanmadı');
    await p.locator('button', { hasText: 'Resimli kuruluma dön' }).click(); await p.waitForTimeout(200);
    dogrula(await p.locator('.yzr-yuz').count() > 0, 'resimli kuruluma dönmedi');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('resimli 4 adım (tür · yüzler · seri/ok/mesafe/süre · TV+renk) · Başlat ve TV · Hedef hatları 18/24/30 sporcu sığar · ✓ girdi · yeni vurgu · dokun → giriş · renk · Sahne ⇄ Hatlar · 390 px · ayrıntılı hatırlanır');
  } finally {
    if (yedek) await p.evaluate((y) => {
      try { yzTvKapat(); } catch (e) {}
      const w = (k, v) => { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); };
      w(yzAnahtar(), y.yz); w('dag_yz_tv_gorunum', y.g || 'tablo'); w('dag_yz_tv_renk', y.r); w('dag_yz_kur_ayrintili', y.a || '1'); w('dag_yz_mod', y.mod); localStorage.setItem('dag_yz_tv_v418', '1');
      _kmListe = JSON.parse(y.liste); _yz.kurulum = null; _yzr.ayrintili = y.a !== '0' && y.a != null; _yzr.adim = 1;
    }, yedek).catch(() => {});
    await ctx.close();
  }
}
