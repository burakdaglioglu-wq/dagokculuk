// DAĞ · 📒 Öğrenci Defteri + 📝 Ders Günlüğü (2026-10-15, Milo'dakinin DAĞ sürümü, aylık aidat düzeni). Yönetici › Antrenman.
// Defter: takvimden gün → gelmedi (telafi hakkı açılır), telafi (hak kapanır), hasta (meta), boşalt (sunucudan da silinir);
// aidat yalnız gösterilir. Günlük: kayıt → haftalık veli metni → aylık PDF. Test yoklamaları ve günlük kaydı sonunda silinir.
import { sayfaAc, uygulamaAc, yoneticiAc, dogrula, esit, api } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let sp = null; const tarihler = [];
  try {
    await uygulamaAc(p);
    await yoneticiAc(p, 'defter');
    await p.waitForSelector('.od-sat', { timeout: 20000 });
    sp = await p.evaluate(() => { const u = odSporcular()[0]; return { g: u.g, ad: u.ad, k: u.k }; });
    await p.locator('.od-sat').first().click();
    await p.waitForSelector('.od-takvim .od-gun');
    // geçen ayın 3 günü: gelmedi → hak 1; telafi → hak 0; hasta → meta; sonra hepsini boşalt
    const g = await p.evaluate(() => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); const iso = (n) => { const x = new Date(d); x.setDate(n); return odIso(x); }; return [iso(5), iso(12), iso(19)]; });
    tarihler.push(...g);
    const r = await p.evaluate(async (a) => {
      const u = odBul(a.k);
      for (const t of a.g) { delete (otomatikYoklamaDB[t] || {})[u.ad]; }
      await odGunYaz(u, a.g[0], 'y');
      const ay = a.g[0].slice(0, 7), h1 = odAylar(u).find((x) => x.ay === ay).kalanHak;
      await odGunYaz(u, a.g[1], 't');
      const h2 = odAylar(u).find((x) => x.ay === ay).kalanHak;
      await odGunYaz(u, a.g[2], 'h');
      const hasta = odGun(u, a.g[2]), meta = (await odMeta('yoklama_durum'))[a.g[2] + '|' + u.ad];
      return { h1, h2, hasta, meta: meta && meta.d };
    }, { k: sp.k, g });
    esit(r.h1, 1, 'gelmedi telafi hakkı açmadı');
    esit(r.h2, 0, 'telafi hakkı kapatmadı');
    dogrula(r.hasta === 'h' && r.meta === 'hasta', 'hasta kaydı: ' + JSON.stringify(r));
    // takvimden gerçek tıklamayla: ilk geçmiş günü "Gelmedi" yap, sonra "Boşalt" → sunucudan silinir
    await p.evaluate((ay) => { OD.ay = ay; OD.secim = null; odDetayYenile(); }, g[0].slice(0, 7));
    await p.locator('.od-takvim .od-gun', { hasText: /^5/ }).first().click();
    await p.locator('.od-secici button', { hasText: 'Boşalt' }).click();
    await p.waitForTimeout(600);
    const sunucu = (await api('/api/attendance/auto?tarih=' + g[0])).d.attendance.some((x) => x.ad === sp.ad);
    dogrula(!sunucu, 'boşaltılan gün sunucuda kaldı');
    dogrula(await p.locator('.od-bolum', { hasText: 'Aidat' }).count(), 'aidat bölümü yok');
    // 📝 Ders günlüğü
    await yoneticiAc(p, 'gunluk');
    await p.waitForSelector('.od-detay .od-ad', { timeout: 20000 });
    await p.locator('.od-btn', { hasText: 'Bugünün dersini yaz' }).click(); await p.waitForSelector('#dg-form');
    await p.locator('#dg-form .od-cip', { hasText: 'Yıldızlar' }).click();
    await p.locator('#dg-form .od-cip', { hasText: 'Bırakış' }).click();
    await p.fill('#dg-konu', 'E2E bırakış günü'); await p.fill('#dg-yap', 'Lastikle bırakış 3×10\n18 m 6 seri');
    await p.locator('#dg-form button[type=submit]').click(); await p.waitForTimeout(700);
    dogrula(await p.locator('.od-kart', { hasText: 'E2E bırakış günü' }).count(), 'günlük kaydı listede yok');
    await p.locator('.od-aylar button', { hasText: 'Haftalık' }).click();
    await p.locator('.od-cip', { hasText: 'Yıldızlar' }).first().click();
    const metin = await p.locator('#dg-hafta-metin').inputValue();
    dogrula(metin.includes('Lastikle bırakış') && metin.includes('Bırakış'), 'haftalık metin: ' + metin.slice(0, 160));
    await p.locator('.od-aylar button', { hasText: 'Aylık' }).click();
    const [indir] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('.od-btn', { hasText: 'PDF indir' }).click()]);
    dogrula((await indir.suggestedFilename()).startsWith('DAG_Antrenman_Ozeti_'), 'PDF adı');
    await p.evaluate(async () => { const id = Object.keys(DG.kayit).find((x) => DG.kayit[x].konu === 'E2E bırakış günü'); if (id) await dgYaz(id, { sil: true, tarih: '' }); });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('DAĞ defter: gelmedi→hak, telafi kapatır, hasta, boşalt sunucudan siler; günlük → haftalık metin → PDF');
  } finally {
    if (sp) await p.evaluate(async (a) => { const u = odBul(a.k); for (const t of a.t) { try { await odGunYaz(u, t, null); } catch (e) {} } }, { k: sp.k, t: tarihler }).catch(() => {});
    await p.waitForTimeout(800);
    await ctx.close();
  }
}
