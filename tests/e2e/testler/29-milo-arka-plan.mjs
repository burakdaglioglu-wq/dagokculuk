// Milo arka plan yenilemesi (2026-10-16, kullanıcı: "Milo'da sayfa hep yenilendiği için bilgileri girerken bile sorun yaşıyoruz,
// özellikle yoklama — arka planda yapamaz mısın"). Koç meşgulken atlanır; veri aynıysa ekrana dokunulmaz; başka cihaz bir şey
// değiştirince yeniden çizilir ama açık görünüm (Defter'de seçili öğrenci) korunur.
import { miloOturumAl, miloApi, sayfaAc, B, dogrula } from '../yardimci.mjs';

export default async function ({ log }) {
  const tok = await miloOturumAl();
  const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 1280, yukseklik: 800 });
  await ctx.addInitScript((t) => { localStorage.setItem('milo_oturum', t); }, tok);
  try {
    await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof mspKur === 'function');
    await p.evaluate(() => miloUygulamayaGir()); await p.waitForTimeout(800);
    for (const sek of ['analiz', 'defter']) {
      await p.evaluate((s) => miloSekme(s), sek); await p.waitForTimeout(1800);
      if (sek === 'defter') await p.evaluate(() => { let b = document.querySelector('.md-sat'); if (b) b.click(); });
      await p.waitForTimeout(500);
      const iz = () => p.evaluate(() => { let e = document.querySelector('#milo-icerik > *'); if (!e.__iz) e.__iz = Math.random(); return { id: e.__iz, secili: typeof MD !== 'undefined' ? MD.secili : null }; });
      const d0 = await iz();
      await p.evaluate(async () => { _miloSonEtkilesim = Date.now(); await miloArkaPlanYenile(); _miloSonEtkilesim = 0; await miloArkaPlanYenile(); _miloSonEtkilesim = 0; await miloArkaPlanYenile(); });
      const d1 = await iz();
      dogrula(d0.id === d1.id, sek + ': veri değişmeden ekran yeniden çizildi');
      const uye = await p.evaluate(() => (typeof MD !== 'undefined' && MD.uyeler && MD.uyeler[0]) || MA.uyeler[0]);
      await miloApi('/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: '2026-10-01', ad: uye.ad, grup: uye.grup, geldi: true, saat: '10:00' }) });
      await p.evaluate(async () => { _miloSonEtkilesim = Date.now(); await miloArkaPlanYenile(); });
      dogrula((await iz()).id === d1.id, sek + ': koç meşgulken yeniden çizildi');
      await p.evaluate(async () => { _miloSonEtkilesim = 0; await miloArkaPlanYenile(); });
      const d2 = await iz();
      dogrula(d2.id !== d1.id, sek + ': başka cihazdaki değişiklik ekrana gelmedi');
      dogrula(d2.secili === d1.secili, sek + ': seçili öğrenci kayboldu');
      await miloApi('/attendance/auto', { method: 'DELETE', body: JSON.stringify({ tarih: '2026-10-01', ad: uye.ad }) });
    }
    dogrula(!hatalar.length, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Yoklama + Defter: meşgulken atlar, veri aynıysa dokunmaz, değişince görünümü koruyarak çizer ✓');
  } finally { await ctx.close(); }
}
