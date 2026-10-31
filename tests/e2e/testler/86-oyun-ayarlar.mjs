// 2026-10-31 kullanıcı: "oyunlar için özel özellikler ekle (özellikler panelinde), oyunu yeniden başlat düğmesi de gelsin".
// Oyunlar › ⚙️ Ayarlar: en üstte açık oyunun kendi ayarları + 🔄 yeniden başlat; 🔊 tüm oyunların sesi tek yerden; 📜 gün sonu
// oyun özeti; ⏰ otomatik sıfırlama süresi (Kapalı/6/12/24). Üst çubukta da 🔄 Yeniden başlat. Ayarlar sonunda geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 860 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => ({ icerik: localStorage.getItem('dag_km_oyun_icerik'), ayar: localStorage.getItem('dag_km_oyun_ayar'), sessiz: localStorage.getItem('dag_km_oyun_sessiz'), kale: localStorage.getItem('dag_kale_ses') }));
    await p.evaluate(() => kmOyunTemaSec('kale'));
    await p.waitForFunction(() => !!document.getElementById('kale-svg'), null, { timeout: 30000 });
    dogrula(await p.locator('.km-oyun-topbar button', { hasText: 'Yeniden başlat' }).count() === 1, 'üst çubukta Yeniden başlat yok');
    await p.locator('.km-oyun-topbar button', { hasText: 'Ayarlar' }).click();
    await p.waitForSelector('#km-oyun-ayar-modal .kmoa-acik', { timeout: 5000 });
    const ust = await p.locator('#km-oyun-ayar-modal .kmoa-acik').textContent();
    dogrula(/Kale Savunması/.test(ust) && /heyecanı/.test(ust) && /seviyesi/.test(ust), 'açık oyunun (Kale) ayarları üstte değil: ' + ust.slice(0, 120));
    // 🔄 yeniden başlat → Ayarlar kapanır, Kale'nin kendi onayı görünür (üstte)
    await p.locator('#km-oyun-ayar-modal .kmoa-yeniden').click(); await p.waitForTimeout(400);
    esit(await p.locator('#km-oyun-ayar-modal').count(), 0, 'Ayarlar kapanmadı');
    dogrula(await p.evaluate(() => { const b = document.getElementById('onay-evet-btn'), r = b.getBoundingClientRect(), e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return b.contains(e) && /1\. dalgadan/.test(document.getElementById('onay-mesaj').textContent); }), 'Kale yeniden başlat onayı görünmedi');
    await p.evaluate(() => onayKapat());
    // 🔊 ses: kapat → anahtar + kale sesAcik kapalı; aç → kale tercihi de açık
    await p.evaluate(() => kmOyunAyarAc());
    await p.locator('#km-oyun-ayar-modal .kmoa-arac button', { hasText: 'Ses' }).click();
    esit(await p.evaluate(() => localStorage.getItem('dag_km_oyun_sessiz')), '1', 'ses kapanmadı');
    dogrula(/Ses kapalı/.test(await p.locator('#km-oyun-ayar-modal .kmoa-arac').textContent()), 'ses düğmesi kapalı göstermiyor');
    await p.evaluate(() => localStorage.setItem('dag_kale_ses', '0'));
    await p.locator('#km-oyun-ayar-modal .kmoa-arac button', { hasText: 'Ses' }).click();
    dogrula(await p.evaluate(() => localStorage.getItem('dag_km_oyun_sessiz') === null && localStorage.getItem('dag_kale_ses') === '1'), 'ses açılınca oyunların kendi sesi açılmadı');
    // 🧩 içerik aç/kapat (2026-11-01): Kale'nin içerik kutusu açık oyun bölümünde; sapancıyı kapat → sahnedeki sapancı goblin olur
    dogrula(/Oyunun içeriği/.test(await p.locator('#km-oyun-ayar-modal .kmoa-acik').textContent()), 'açık oyunda içerik kutusu yok');
    dogrula(/Hapşırık — içerik/.test(await p.locator('#km-oyun-ayar-modal').textContent()), 'diğer oyunların içeriği listelenmedi');
    const ic = await p.evaluate(() => {
      const key = 'dag_km_kale_' + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(key));
      st.dusmanlar[st.dusmanlar.length - 1].tip = 'sapanci'; localStorage.setItem(key, JSON.stringify(st));
      return true;
    });
    await p.locator('#km-oyun-ayar-modal .kmoa-acik .kmoa-icerik-l button', { hasText: 'Sapancı' }).click();
    const ic2 = await p.evaluate(() => {
      const st = JSON.parse(localStorage.getItem('dag_km_kale_' + (_kmAktifKonum || 'varsayilan')));
      const b = [...document.querySelectorAll('#km-oyun-ayar-modal .kmoa-acik .kmoa-icerik-l button')].find((x) => /Sapancı/.test(x.textContent));
      return { acik: kmOyunIcerik('kale', 'sapanci'), sapanci: st.dusmanlar.some((d) => d.tip === 'sapanci'), etiket: b && b.textContent };
    });
    dogrula(ic && !ic2.acik && !ic2.sapanci && /Kapalı/.test(ic2.etiket), 'sapancı kapanmadı / sahnede kaldı: ' + JSON.stringify(ic2));
    await p.locator('#km-oyun-ayar-modal .kmoa-acik .kmoa-icerik-l button', { hasText: 'Sapancı' }).click();
    esit(await p.evaluate(() => kmOyunIcerik('kale', 'sapanci')), true, 'sapancı tekrar açılmadı');
    // 📜 özet
    await p.locator('#km-oyun-ayar-modal .kmoa-arac button', { hasText: 'özeti' }).click();
    await p.waitForTimeout(200);
    const oz = await p.evaluate(() => ({ baslik: document.querySelector('#km-oyun-ayar-modal h3').textContent, yazi: kmOyunGunOzetiYazi(), m: kmOyunGunOzetiMetni() }));
    dogrula(/oyun özeti/.test(oz.baslik), 'özet açılmadı');
    dogrula(/DAĞ Spor Kulübü/.test(oz.yazi) && oz.m.atanlar.every((a) => oz.yazi.includes(a)), 'özet metni hatalı (atan herkes adıyla yazılmalı)');
    // ⏰ otomatik sıfırlama: Özel → Kapalı → 13 saat sonra bile sıfırlanmaz; 6 saat → 7 saatte sıfırlanır
    const z = await p.evaluate(() => {
      const kn = _kmAktifKonum || 'varsayilan';
      kmOyunAyarMod('ozel'); kmOyunAyarSec('sifirSaat', 0);
      localStorage.setItem('dag_km_oyun_son_' + kn, String(Date.now() - 13 * 3600e3)); const kapali = kmOyunBayatSifirla();
      kmOyunAyarSec('sifirSaat', 6);
      localStorage.setItem('dag_km_oyun_son_' + kn, String(Date.now() - 5 * 3600e3)); const bes = kmOyunBayatSifirla();
      localStorage.setItem('dag_km_oyun_son_' + kn, String(Date.now() - 7 * 3600e3)); const yedi = kmOyunBayatSifirla();
      const satir = !!document.querySelector('#km-oyun-ayar-modal') && /kendiliğinden baştan/.test(document.getElementById('km-oyun-ayar-modal').textContent);
      return { kapali, bes, yedi, satir };
    });
    dogrula(z.satir, 'otomatik sıfırlama satırı yok');
    dogrula(!z.kapali && !z.bes && z.yedi, 'sıfırlama süresi ayarı çalışmadı: ' + JSON.stringify(z));
    // telefon genişliği: taşma yok
    await p.setViewportSize({ width: 390, height: 800 });
    await p.evaluate(() => kmOyunAyarAc()); await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => { const k = document.querySelector('#km-oyun-ayar-modal .kmoa-kutu'); return k.scrollWidth <= k.clientWidth + 1; }), '390 px\'te Ayarlar taşıyor');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Ayarlar: açık oyun (Kale) üstte + 🔄 yeniden başlat · 🧩 içerik aç/kapat (sapancı) · tek ses · gün özeti · sıfırlama Kapalı/6 saat · üst çubukta 🔄 · 390 px');
  } finally {
    if (yedek) await p.evaluate((y) => {
      try { kmOyunAyarKapat(); onayKapat(); } catch (e) {}
      const set = (k, v) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); };
      set('dag_km_oyun_ayar', y.ayar); set('dag_km_oyun_icerik', y.icerik); set('dag_km_oyun_sessiz', y.sessiz); set('dag_kale_ses', y.kale);
      localStorage.removeItem('dag_km_oyun_son_' + (_kmAktifKonum || 'varsayilan'));
    }, yedek).catch(() => {});
    await ctx.close();
  }
}
