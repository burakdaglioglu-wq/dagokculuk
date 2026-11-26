// 2026-11-26 (v469) Telefonda "A · Hedef hattı" masa ekranı (kullanıcı A/B taslağından A'yı seçti): 390 px'te tur ekranı
// yalnız seri + süre + hedef hedef sporcular; girdi / sırada / bekliyor renkli; dokun → puan penceresi; kayıttan sonra
// sıradaki turuncu olur; "Ayrıntılı ekran" eski panele döner, "Sade telefon ekranına dön" geri getirir; 1280 px eski panel.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 860 });
  let yedek = null;
  const ekran = async (ad) => { if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-' + ad + '.png' }); };
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), masa: localStorage.getItem('dag_yz_masa') }));
    await p.waitForFunction(() => typeof yaHatHTML === 'function', null, { timeout: 8000 });
    await p.evaluate(() => {
      localStorage.removeItem(yzAnahtar()); localStorage.removeItem('dag_yz_masa');
      if (yzRoster().length < 4) { _kmListe = Object.keys(turnuvaDB.buyukler || {}).slice(0, 6).map((ad) => ({ g: 'buyukler', ad })); }
      _yz.kurulum = null; yzModAyarla('siralama'); yzKurAyar('kayit', false); yzKurulumTaslak(); yzBaslat();
    });
    await p.waitForTimeout(300);
    // 1280 px: eski komuta paneli
    dogrula(await p.locator('.yz-a-araclar').isVisible(), 'geniş ekranda eski panel yok');
    esit(await p.locator('.ya-hat').count(), 0, 'geniş ekranda hedef hattı olmamalı');

    // 390 px: hedef hattı (döndürme / pencere daraltma kendiliğinden yeniden çizer)
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForSelector('.ya-hat', { timeout: 4000 });
    esit(await p.locator('.yz-a-araclar').count(), 0, 'telefonda araç ızgarası görünmemeli');
    const n = await p.evaluate(() => yzOku().durum.katilimci.length);
    esit(await p.locator('.ya-hs').count(), n, 'her sporcu bir satır');
    esit(await p.locator('.ya-hs.sira').count(), 1, 'tek sporcu SIRADA');
    const ilk = await p.evaluate(() => yzHedefSirasi(yzOku())[0]);
    esit(await p.locator('.ya-hs.sira').getAttribute('data-k'), ilk, 'sıradaki ilk hedefteki sporcu');
    dogrula(await p.locator('#yz-sayac').isVisible(), 'süre görünmüyor');
    dogrula(await p.locator('#ya-bar').isVisible(), 'alt çubuk yok');
    await ekran('1-hat');

    // dokun → puan penceresi → kaydet → yeşil, sıradaki değişir
    await p.locator('.ya-hs.sira').click();
    await p.waitForSelector('.yz-giris');
    await p.evaluate(() => { const g = _yz.giris, n2 = yzGirisOkSay(g, yzOku().durum); g.oklar = Array.from({ length: n2 }, () => ({ p: '9' })); yzGirisKaydet(); });
    await p.waitForTimeout(300);
    await p.evaluate(() => { if (_yz.giris) yzGirisKapat(); });
    await p.waitForTimeout(200);
    esit(await p.locator('.ya-hs.tamam').count(), 1, 'kaydedilen sporcu yeşil');
    dogrula((await p.locator('.ya-hs.sira').getAttribute('data-k')) !== ilk, 'sıradaki ilerlemedi');
    dogrula((await p.locator('#ya-bar .ya-bar-ana').innerText()).includes('Sıradaki'), 'çubukta sıradaki yok');
    await ekran('2-bir-girdi');

    // ⋯ menü açılır
    await p.locator('.ya-hat-menu').click();
    await p.waitForSelector('#onay-modal .ya-menu');
    await p.evaluate(() => { document.getElementById('onay-modal').style.display = 'none'; });

    // Ayrıntılı ekran ↔ sade
    await p.locator('.ya-hat-ayr').click();
    await p.waitForSelector('.yz-a-araclar');
    esit(await p.evaluate(() => localStorage.getItem('dag_yz_masa')), 'eski', 'tercih saklanmalı');
    await p.locator('.ya-hat-ayr.ust').click();
    await p.waitForSelector('.ya-hat');
    esit(await p.evaluate(() => localStorage.getItem('dag_yz_masa')), null, 'sade tercihe dönmeli');

    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= 392), '390 px sayfa yana taşıyor');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('📱 hedef hattı: 1280 eski panel · 390 satırlar, SIRADA, kayıt → yeşil, ⋯, ayrıntılı ↔ sade, taşma yok');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzGirisKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); if (y.masa) localStorage.setItem('dag_yz_masa', y.masa); else localStorage.removeItem('dag_yz_masa'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
