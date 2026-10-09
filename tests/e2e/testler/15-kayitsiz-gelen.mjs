// Yoklama › Derse kayıtlı olmadan gelenler: giriş saatine göre ders önerisi, "dersine ekle" (programa kalıcı),
// kişi türü (Öğrenci / Misafir / Eğitmen atışı) işaretleme.
import { api, sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit, benzersiz, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  const AD = benzersiz('KYS ');
  await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'yildizlar', ad: AD, lastModified: Date.now() }) });
  let slotId = null;
  try {
    // bugüne 17:00-18:00 test dersi + 17:10'da giriş
    const gun = new Date().getDay(), n = new Date(), bugun = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
    const r = await api('/api/antrenman-programi', { method: 'POST', body: JSON.stringify({ grup: 'E2E Kayitsiz ' + AD, gunler: [gun], baslangicSaat: '17:00', bitisSaat: '18:00' }) });
    slotId = r.d.id; dogrula(slotId, 'test dersi oluşmadı');
    await api('/api/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: bugun, ad: AD, grup: 'yildizlar', saat: '17:10', elle: true, geldi: true }) });
    for (const [w, h] of [[390, 844], [1280, 900]]) {
      const { ctx, p, hatalar } = await sayfaAc({ genislik: w, yukseklik: h });
      try {
        await uygulamaAc(p);
        await karisikSinifArac(p, 'yoklamaanaliz', 'kmYoklamaAnalizCiz');
        await p.evaluate(() => new Promise((ok) => { _kmYa.yukleniyor = false; kmYaSlotYukle(() => { kmYaTarihAc(kmYaIso(new Date())); ok(); }); }));
        await p.waitForTimeout(1500);
        const satir = p.locator('.ya-ks').filter({ has: p.locator('.ya-kisi-ad b', { hasText: AD }) });
        dogrula(await satir.count(), 'kayıtsız gelen satırı yok');
        if (w === 390) { dogrula(await yataydaTasmaYok(p), 'telefonda taşıyor'); esit(hatalar.length, 0, 'hata: ' + hatalar.join(' | ')); continue; }
        dogrula((await satir.textContent()).includes('17:00'), 'giriş saatine göre ders önerilmedi');
        await satir.locator('.ya-ks-tur button', { hasText: 'Misafir' }).click(); await p.waitForTimeout(300);
        esit(await p.evaluate((ad) => kisiTuru('yildizlar', ad), AD), 'misafir', 'misafir işaretlenmedi');
        await p.locator('.ya-ks').filter({ has: p.locator('.ya-kisi-ad b', { hasText: AD }) }).locator('.ya-ks-tur button', { hasText: 'Eğitmen atışı' }).click(); await p.waitForTimeout(300);
        esit(await p.evaluate((ad) => kisiTuru('yildizlar', ad), AD), 'egitmen', 'eğitmen işaretlenmedi');
        await p.locator('.ya-ks').filter({ has: p.locator('.ya-kisi-ad b', { hasText: AD }) }).locator('.ya-ks-tur button', { hasText: 'Öğrenci' }).click(); await p.waitForTimeout(300);
        if (process.env.E2E_EKRAN) await p.locator('.ya-kayitsiz').screenshot({ path: process.env.E2E_EKRAN + '-kayitsiz.png' });
        await p.locator('.ya-ks').filter({ has: p.locator('.ya-kisi-ad b', { hasText: AD }) }).locator('.ya-ks-ders .ya-btn', { hasText: 'dersine ekle' }).click(); await p.waitForTimeout(1500);
        const kat = (await api('/api/antrenman-programi')).d.slots.find((s) => s.id === slotId).katilimcilar.map((k) => k.ad);
        dogrula(kat.includes(AD), 'derse eklenmedi');
        esit(hatalar.length, 0, 'hata: ' + hatalar.join(' | '));
      } finally { await ctx.close(); }
    }
    log('kayıtsız gelen: saate göre ders önerisi, misafir/eğitmen/öğrenci, derse ekleme ✓');
  } finally {
    if (slotId) await api('/api/antrenman-programi/' + slotId, { method: 'DELETE' });
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'DELETE' });
  }
}
