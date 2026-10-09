// Karışık Sınıf › Oyunlar › 🎉 Ok Partisi: seçiciden açılır, 2 takım kurulur, bir tur oynanır (her takım gerçek seri
// girer, taş ilerler, kare olayları kapanır), mini oyun girilir; seriler sporcunun GERÇEK kaydına yazılır, durum
// sayfa yenilense de sürer, parti bitirilebilir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 950 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.evaluate(() => { localStorage.removeItem('dag_km_parti_' + (_kmAktifKonum || 'varsayilan')); kmOyunSeciciAc(); });
    await p.locator('#km-oyun-secici .card', { hasText: 'Ok Partisi' }).click();
    await p.waitForFunction(() => typeof kmPartiCiz === 'function' && document.querySelector('#kp-kok'), null, { timeout: 30000 });
    await p.locator('#kp-kok button', { hasText: '2 takım' }).click();
    await p.locator('#kp-kok button', { hasText: 'Partiyi başlat' }).click();
    await p.locator('.kp-katman button', { hasText: 'Hadi başlayalım' }).click();
    // ilk takımın ilk sporcusu — gerçek seri sayısı
    const atan = await p.evaluate(() => { const u = _kp.takimlar[0].uyeler[0]; const gd = turnuvaDB[u.g][u.ad]; gd.devamModu = true; return { ...u, once: (gd.seriler || []).length }; });
    const kapat = async () => { for (const s of ['[data-tamam]', '[data-al=""]']) { const b = p.locator('.kp-katman ' + s); if (await b.isVisible().catch(() => false)) await b.click(); } };
    const seriGir = async (oklar) => { for (const v of oklar) await p.locator(`#kp-ped button[data-v="${v}"]`).click(); await p.locator('#kp-ilerlet').click(); };
    // bir tur: her takım bir seri, araya çıkan olay/mağaza pencereleri kapatılır
    for (let t = 0; t < 2; t++) {
      await p.waitForFunction(() => !_kp.kilit && !document.querySelector('.kp-katman'), null, { timeout: 20000 }).catch(() => {});
      await kapat();
      await seriGir(['10', '9', '8']);
      for (let i = 0; i < 30; i++) { await p.waitForTimeout(400); await kapat(); if (await p.evaluate(() => !_kp.kilit)) break; }
    }
    // mini oyun açılır → başlat → iki takım seri girer → sonuç
    await p.locator('.kp-katman [data-basla]').waitFor({ timeout: 20000 });
    await p.locator('.kp-katman [data-basla]').click();
    for (let t = 0; t < 2; t++) { await p.waitForFunction(() => !!_kpPedHedef, null, { timeout: 10000 }); await seriGir(t ? ['9', '8', '7'] : ['X', '10', '9']); }
    await p.locator('.kp-katman .kp-sonuc').waitFor({ timeout: 10000 });
    await p.locator('.kp-katman [data-tamam]').click();
    const durum = await p.evaluate((u) => ({ tur: _kp.tur, sonra: (turnuvaDB[u.g][u.ad].seriler || []).length, kayitli: !!localStorage.getItem('dag_km_parti_' + (_kmAktifKonum || 'varsayilan')) }), atan);
    esit(durum.tur, 2, 'mini oyundan sonra 2. tura geçilmeli');
    dogrula(durum.sonra >= atan.once + 1, `seri gerçek kayda yazılmadı (${atan.ad}: ${atan.once} → ${durum.sonra})`);
    dogrula(durum.kayitli, 'parti durumu kaydedilmedi');
    // bitir
    await p.locator('#kp-kok button', { hasText: 'Partiyi bitir' }).click();
    await p.locator('.kp-katman [data-evet]').click();
    dogrula(await p.locator('#kp-kok button', { hasText: 'Partiyi başlat' }).isVisible(), 'bitirince kurulum ekranına dönülmedi');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(`1 tur + mini oyun oynandı, ${atan.ad} gerçek seri ${atan.once} → ${durum.sonra}`);
  } finally { await ctx.close(); }
}
