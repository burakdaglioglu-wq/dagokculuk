// Pasif sporcu derse eklenebilsin (2026-10-08, kullanıcı: "Uğurkan ders eklede çıkmıyor, Beyza'yı da derslere ekleyemiyorum").
// Sebep: ikisi de pasifti; ders programı "Sporcu ekle" araması ve Karışık Sınıf sporcu seçimi pasifleri SESSİZCE gizliyordu.
// Artık isim aranınca "⏸ pasif" bölümünde çıkıyor, "Aktif et" ile tekrar aktif edilip seçiliyor (sunucuya da gidiyor).
import { api, esit, dogrula, benzersiz, sayfaAc, uygulamaAc, karisikSinifArac } from '../yardimci.mjs';

export default async function ({ log }) {
  const g = 'minikler', P = benzersiz('PASIF ');
  try {
    await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: g, ad: P, lastModified: Date.now() - 5000 }) });
    await api(`/api/athletes/${g}/${encodeURIComponent(P)}`, { method: 'PATCH', body: JSON.stringify({ fields: { pasif: 1 }, lastModified: Date.now() - 1000 }) });
    const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
    try {
      await uygulamaAc(p);
      await p.waitForFunction(([g, ad]) => turnuvaDB[g] && turnuvaDB[g][ad], [g, P], { timeout: 20000 });
      esit(!!(await p.evaluate(([g, ad]) => turnuvaDB[g][ad].pasif, [g, P])), true, 'yerelde pasif olmalı');
      // Karışık Sınıf › sporcu seçimi: aranınca pasif bölümünde
      await karisikSinifArac(p, 'skor', null);
      await p.evaluate(() => kmSporcuEkle()); await p.waitForTimeout(400);
      await p.locator('#km-ara').fill(P.toLocaleLowerCase('tr')); await p.evaluate(() => kmModalDoldur());
      const btn = p.locator('#km-liste button', { hasText: 'Aktif et' });
      esit(await btn.count(), 1, 'pasif sporcu aramada görünmüyor');
      p.once('dialog', (d) => d.accept().catch(() => {}));
      await p.evaluate(() => { window.confirm = () => true; });
      await btn.click();
      esit(await p.evaluate(([g, ad]) => !turnuvaDB[g][ad].pasif && !!_kmSecimler[g + '_' + ad], [g, P]), true, 'aktif edilip seçilmedi');
      // sunucuya gitti mi
      let tamam = false;
      for (let i = 0; i < 20 && !tamam; i++) { await p.waitForTimeout(1000); const a = await api('/api/athletes'); tamam = (a.d.athletes || a.d || []).some((x) => x.grup === g && x.ad === P && !x.pasif); }
      dogrula(tamam, 'aktif etme sunucuya ulaşmadı');
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
    log('pasif sporcu aramada görünüyor → Aktif et ve seç → sunucuda aktif ✓');
  } finally {
    await api(`/api/athletes/${g}/${encodeURIComponent(P)}`, { method: 'DELETE' }).catch(() => {});
  }
}
