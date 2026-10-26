// Milo › Geçmiş yoklama çizelgesi (2026-10-16, kullanıcı: "yoklama geçmişini nasıl gireceğiz, bunu da kolaylaştır").
// Yoklama → 🗓 Geçmiş gir → grup + önceki ay; boş hücre 1 dokunuş = geldi, 3 dokunuş = 📞 haber verdi; Kaydet → sunucuda; geri alınır.
import { miloOturumAl, miloApi, sayfaAc, B, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const tok = await miloOturumAl();
  const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 390, yukseklik: 844 });
  await ctx.addInitScript((t) => { localStorage.setItem('milo_oturum', t); }, tok);
  let kayitlar = [];
  try {
    await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof mspKur === 'function');
    await p.evaluate(() => miloUygulamayaGir()); await p.waitForTimeout(800);
    await p.evaluate(() => miloSekme('analiz')); await p.waitForTimeout(1800);
    await p.locator('#milo-icerik button:has-text("Geçmiş gir")').click();
    await p.waitForSelector('#md-cz', { timeout: 15000 });
    await p.locator('#md-cz button[aria-label="Önceki ay"]').click(); await p.waitForTimeout(300);
    // boş hücre yoksa bir gün ekle (o grubun herkesi boş olur)
    if (!(await p.locator('#md-cz .md-cz-h.bos').count())) await p.evaluate(() => { let d = mdCzAyBas(MD.cz.ay); d.setDate(3); mdCzGunEkle(mdIso(d)); });
    const bos = await p.evaluate(() => [...document.querySelectorAll('#md-cz .md-cz-h.bos')].slice(0, 2).map((b) => b.getAttribute('onclick')));
    dogrula(bos.length >= 1, 'çizelgede boş hücre yok');
    await p.evaluate((oc) => { eval(oc); }, bos[0]);
    if (bos[1]) for (let i = 0; i < 3; i++) await p.evaluate((oc) => { eval(oc); }, bos[1]);
    kayitlar = await p.evaluate(() => Object.entries(MD.cz.bekleyen));
    esit(kayitlar[0][1], 'g', '1 dokunuş geldi olmalı'); if (kayitlar[1]) esit(kayitlar[1][1], 'm', '3 dokunuş haber verdi olmalı (2026-10-27: sıra geldi → gelmedi → 📞 haber verdi → hasta)');
    dogrula(await p.evaluate(() => miloMesgulMu()), 'bekleyen değişiklik varken arka plan yenilemesi durmuyor');
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'telefonda sayfa taşıyor');
    await p.locator('#md-cz-kaydet').click();
    await p.waitForFunction(() => !Object.keys(MD.cz.bekleyen).length, null, { timeout: 15000 });
    const att = (await miloApi('/attendance/auto')).d.attendance;
    for (const [k, s] of kayitlar) { const [iso, , ad] = k.split('|'); const a = att.find((r) => r.tarih === iso && r.ad === ad); dogrula(a && !!a.geldi === (s === 'g'), k + ' sunucuya yazılmadı'); }
    dogrula(!hatalar.length, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Geçmiş gir → çizelge: geldi/haber verdi dokunuşla, Kaydet sunucuya yazdı, telefonda taşma yok ✓');
  } finally {
    for (const [k] of kayitlar) { const [iso, , ad] = k.split('|'); await miloApi('/attendance/auto', { method: 'DELETE', body: JSON.stringify({ tarih: iso, ad }) }).catch(() => {}); }
    await ctx.close();
  }
}
