// Oyunlar › ⚙️ Ayarlar › 👤 Yeni sporcu kaydet (2026-10-17, kullanıcı: "bütün oyunların ayarlar kısmına sporcu ekle düğmesi koy,
// kaydettiğimizde bu derse kaydedilsin mi diye sorsun"). Kaydet → kulübe eklenir → "Bu derse eklensin mi?" → Evet → ders listesine ve
// oyuna girer. Aynı isim zaten varsa yeni kayıt açılmaz, derse eklemeyi önerir. Yumurta › Sporcular'da da aynı düğme var.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit, api, benzersiz } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  const AD = benzersiz('OYN ');
  let listeYedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    listeYedek = await p.evaluate(() => JSON.stringify(_kmListe));
    await p.evaluate(() => kmOyunTemaSec('zirve'));
    await p.locator('button', { hasText: '⚙️ Ayarlar' }).first().click();
    await p.locator('#km-oyun-ayar-modal button', { hasText: 'Yeni sporcu kaydet' }).click();
    await p.fill('#kmoa-ad', AD);
    await p.locator('#kmoa-grup button', { hasText: 'Yıldızlar' }).click();
    await p.locator('#km-oyun-ayar-modal button', { hasText: 'Kaydet' }).click();
    await p.waitForTimeout(400);
    dogrula(await p.evaluate((a) => !!(turnuvaDB.yildizlar && turnuvaDB.yildizlar[a]), AD), 'sporcu kulübe kaydedilmedi');
    dogrula((await p.locator('#onay-mesaj').innerText()).includes('Bu derse eklensin mi'), '"Bu derse eklensin mi?" sorulmadı');
    await p.locator('#onay-evet-btn').click(); await p.waitForTimeout(600);
    dogrula(await p.evaluate((a) => _kmListe.some((k) => k.g === 'yildizlar' && k.ad === a), AD), 'derse eklenmedi');
    dogrula(await p.evaluate((a) => _kmOyunRosterCache.some((s) => s.ad === a), AD), 'oyunda görünmüyor');
    // aynı isim tekrar → yeni kayıt açılmaz, derse ekleme önerilir
    await p.locator('button', { hasText: '⚙️ Ayarlar' }).first().click();
    await p.locator('#km-oyun-ayar-modal button', { hasText: 'Yeni sporcu kaydet' }).click();
    await p.fill('#kmoa-ad', AD.toLocaleLowerCase('tr-TR'));
    await p.locator('#km-oyun-ayar-modal button', { hasText: 'Kaydet' }).click(); await p.waitForTimeout(300);
    dogrula((await p.locator('#onay-mesaj').innerText()).includes('zaten'), 'aynı isim uyarısı yok');
    await p.evaluate(() => onayKapat());
    // Yumurta › Sporcular'da da düğme var
    await p.evaluate(() => kmAracSec('yuva')); await p.waitForFunction(() => typeof yuvaSporcular === 'function', null, { timeout: 20000 });
    await p.evaluate(() => yuvaSporcular());
    await p.locator('.yv-katman button', { hasText: 'Yeni sporcu kaydet' }).click();
    dogrula(await p.locator('#kmoa-ad').isVisible(), 'yumurtadan yeni sporcu formu açılmadı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Oyunlar ⚙️ Ayarlar → yeni sporcu → "derse eklensin mi?" → derste ve oyunda; aynı isim uyarısı; Yumurta’da da düğme ✓');
  } finally {
    if (listeYedek) await p.evaluate((y) => { try { _kmListe = JSON.parse(y); _kmListeKaydet(); } catch (e) {} }, listeYedek).catch(() => {});
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'DELETE' }).catch(() => {});
    await ctx.close();
  }
}
