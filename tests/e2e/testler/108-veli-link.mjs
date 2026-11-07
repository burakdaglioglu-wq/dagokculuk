// 2026-11-08 Kullanıcı: "velilere bilgilendirme veya aidat bilgilerinin olduğu linki atamıyorum, o kadar zorlaştırdın ki".
// Sporcu kartında tek dokunuşla 🔗 Veliye link gönder: tek WhatsApp mesajında ödeme ekranı (veli.html) + gelişim raporu (rapor.html).
// Telefon yoksa numarasız WhatsApp + yalnız rapor linki. Yönetim › Aidat araçlarında 📤 Velilere link gönder (sıradaki).
// Gönderim işareti test sonunda geri alınır.
import { sayfaAc, uygulamaAc, dogrula } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 860 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    yedek = await p.evaluate(() => localStorage.getItem('dag_aidat_gonderildi'));
    const k = await p.evaluate(() => { for (const g of AIDAT_GRUPLAR) for (const ad of Object.keys(turnuvaDB[g] || {})) { const sp = turnuvaDB[g][ad]; if (!sp.pasif && !sp.aidatMuaf && aidatVeliOdemeTel(sp)) return { g, ad }; } return null; });
    dogrula(k, 'telefonu kayıtlı sporcu yok');
    await p.evaluate((id) => sporcuProfilAc(id), k.g + '|' + k.ad);
    const btn = p.locator('.yn-veli-link');
    await btn.waitFor({ timeout: 30000 });
    dogrula(await btn.isVisible(), 'sporcu kartında Veliye link gönder yok');
    await btn.click(); await p.waitForTimeout(1500);
    const url = await p.evaluate(() => window.__acilan.filter(Boolean).pop() || '');
    dogrula(/^https:\/\/api\.whatsapp\.com\/send\?phone=\d+&text=/.test(url), 'WhatsApp numarayla açılmadı: ' + url.slice(0, 80));
    const metin = decodeURIComponent(url.split('&text=')[1] || '');
    dogrula(/\/veli\.html\?kod=/.test(metin) && /\/rapor\.html\?kod=/.test(metin), 'mesajda iki link yok: ' + metin.slice(0, 200));
    dogrula(!/₺/.test(metin), 'mesajda tutar olmamalı');
    // Yönetim › Aidat araçlarında sıradaki
    dogrula(await p.evaluate(() => typeof veliLinkSiradaki === 'function' && JSON.stringify(aidatPanelAdaptor().araclar[0]).includes('veliLinkSiradaki')), 'Aidat araçlarında ilk sırada değil');
    // telefonsuz: numarasız + yalnız rapor
    const t = await p.evaluate(() => { for (const g of AIDAT_GRUPLAR) for (const ad of Object.keys(turnuvaDB[g] || {})) { const sp = turnuvaDB[g][ad]; if (!sp.pasif && !aidatVeliOdemeTel(sp)) return { g, ad }; } return null; });
    if (t) {
      await p.evaluate((t) => veliLinkGonder(t.g, t.ad), t); await p.waitForTimeout(1500);
      const u2 = await p.evaluate(() => window.__acilan.filter(Boolean).pop() || '');
      dogrula(/send\?text=/.test(u2), 'telefonsuzda numarasız WhatsApp açılmalı');
      const m2 = decodeURIComponent(u2.split('text=')[1] || '');
      dogrula(!/veli\.html/.test(m2) && /rapor\.html/.test(m2), 'telefonsuzda yalnız rapor linki gitmeli');
    }
    dogrula(!hatalar.length, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🔗 veliye link: kartta tek dokunuş, iki link tek mesaj, telefonsuz yalnız rapor, araçlarda sıradaki ✓');
  } finally {
    await p.evaluate((y) => { if (y == null) localStorage.removeItem('dag_aidat_gonderildi'); else localStorage.setItem('dag_aidat_gonderildi', y); }, yedek).catch(() => {});
    await ctx.close();
  }
}
