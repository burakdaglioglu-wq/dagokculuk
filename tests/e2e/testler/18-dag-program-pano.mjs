// DAĞ · Haftalık Program "Pano" + sade ders penceresi (2026-10-08): pano kartı görünür, karta dokununca alttan pencere
// açılır, Kapasite çipi ve tarih iptali anında sunucuya yazılır, sporcu ekle araması çalışır; telefonda taşma yok.
import { api, esit, dogrula, sayfaAc, uygulamaAc, yoneticiAc, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  const gun = new Date().getDay();
  const r = await api('/api/antrenman-programi', { method: 'POST', body: JSON.stringify({ grup: 'genel', gunler: [gun], baslangicSaat: '23:00', bitisSaat: '23:45', kapasite: null }) });
  const id = r.d.id; dogrula(id, 'test dersi açılamadı');
  try {
    for (const [w, h] of [[1280, 900], [390, 844]]) {
      const { ctx, p, hatalar } = await sayfaAc({ genislik: w, yukseklik: h });
      try {
        await uygulamaAc(p); await yoneticiAc(p, 'program');
        await p.waitForFunction((i) => _programSlotlar.some((s) => s.id === i) && document.querySelector('.pno-izgara'), id, { timeout: 20000 });
        const kart = p.locator(`.pno-kol[data-gun="${gun}"] .pno-kart`, { hasText: '23:00' });
        esit(await kart.count(), 1, 'panoda test dersi yok');
        if (w === 390) { dogrula(await yataydaTasmaYok(p), 'pano telefonda taşıyor'); esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | ')); continue; }
        await kart.click(); await p.waitForSelector('.dpk-hd');
        await p.locator('.dpk-row', { hasText: 'Kapasite' }).click();
        await p.locator('.dpk-cipler button', { hasText: /^10$/ }).click();
        await p.waitForTimeout(800);
        const s1 = (await api('/api/antrenman-programi')).d.slots.find((s) => s.id === id);
        esit(s1.kapasite, 10, 'kapasite kaydı');
        await p.locator('.dpk-row', { hasText: 'İptaller' }).click();
        await p.locator('.dpk-tarihler button').first().click(); await p.waitForTimeout(800);
        const s2 = (await api('/api/antrenman-programi')).d.slots.find((s) => s.id === id);
        esit((s2.istisnalar || []).length, 1, 'iptal kaydı');
        await p.locator('.dpk-ekle').click(); await p.locator('#dpk-ara').fill('a'); await p.waitForTimeout(200);
        dogrula(await p.locator('#dpk-adaylar .dpk-aday').count(), 'sporcu araması sonuç vermedi');
        await p.locator('.dpk-bitti').click();
        esit(await p.evaluate(() => document.getElementById('ders-roster-modal').style.display), 'none', 'Bitti pencereyi kapatmadı');
        esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
      } finally { await ctx.close(); }
    }
    log('DAĞ pano kartı → sade pencere: kapasite 10 ✓, tarih iptali ✓, sporcu arama ✓, telefonda taşma yok ✓');
  } finally {
    await api('/api/antrenman-programi/' + id, { method: 'DELETE' }).catch(() => {});
  }
}
