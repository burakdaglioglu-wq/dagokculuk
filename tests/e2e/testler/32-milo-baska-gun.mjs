// Milo › ↪ Başka gün geldi (2026-10-16, kullanıcı: "geldi/gelmedi yanında bir buton daha: o gün gelmedi ama farklı gün geldi —
// bazen kendi ders saatinde gelmeyip diğer grubun dersine gelebiliyor"). Yoklama'da ↪ → tarih → o gün 'k' (devamsızlık sayılmaz,
// gelmeyenlerde yok), seçilen gün geldi; Defter paketinde 'k' ders yemez/telafi hakkı doğurmaz.
import { miloOturumAl, miloApi, sayfaAc, B, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const tok = await miloOturumAl();
  const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 1280, yukseklik: 900 });
  await ctx.addInitScript((t) => { localStorage.setItem('milo_oturum', t); }, tok);
  let temiz = null;
  try {
    await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof mspKur === 'function');
    await p.evaluate(() => miloUygulamayaGir()); await p.waitForTimeout(800);
    await p.evaluate(() => miloSekme('analiz')); await p.waitForTimeout(1800);
    // geçen haftadan, derste öğrencisi olan ve o gün kaydı OLMAYAN bir gün + öğrenci bul
    const hedef = await p.evaluate(() => {
      for (let i = 7; i < 40; i++) {
        let d = new Date(); d.setDate(d.getDate() - i); let iso = maIso(d);
        for (let s of MA.slotlar) { if (!maSlotGunler(s).includes(d.getDay())) continue; let u = maSlotUyeler(s, iso).find((x) => !maDurum(x, iso)); if (u) return { iso, ad: u.ad, grup: u.grup, key: maKey(u.grup, u.ad) }; }
      }
      return null;
    });
    dogrula(hedef, 'uygun ders günü bulunamadı');
    const bugun = await p.evaluate(() => maBugun());
    temiz = { ...hedef, bugun };
    await p.evaluate((iso) => maGunAc(iso), hedef.iso); await p.waitForTimeout(400);
    const kisi = p.locator('.ma-kisi', { hasText: hedef.ad }).first();
    await kisi.locator('button:has-text("Başka gün")').click(); await p.waitForTimeout(300);
    esit(await p.locator('#ma-bg-tarih').inputValue(), bugun, 'varsayılan tarih bugün değil');
    await p.locator('#onay-evet-btn').click(); await p.waitForTimeout(2000);
    const att = (await miloApi('/attendance/auto')).d.attendance;
    const o = att.find((r) => r.tarih === hedef.iso && r.ad === hedef.ad), b = att.find((r) => r.tarih === bugun && r.ad === hedef.ad);
    dogrula(o && !o.geldi, 'kaçırılan gün "gelmedi" yazılmadı'); dogrula(b && b.geldi, 'seçilen gün "geldi" yazılmadı');
    esit(await p.evaluate((h) => maDurum(maUye(h.grup, h.ad), h.iso), hedef), 'k', 'yoklamada ↪ durumu yok');
    dogrula((await kisi.innerText()).includes('geldi'), 'öğrenci satırında "… geldi" notu yok');
    // Defter: 'k' paketten ders yemez, telafi hakkı doğurmaz
    const pk = await p.evaluate(async (h) => { MD.yuklendi = false; await mdYukle(); let u = MD.uyeler.find((x) => x.grup === h.grup && x.ad === h.ad); return { s: mdGun(u, h.iso), dersler: mdPaketler(u).some((p) => p.dersler.some((r) => r.iso === h.iso)) }; }, hedef);
    esit(pk.s, 'k', 'defterde ↪ yok'); dogrula(!pk.dersler, '↪ günü paketten ders yedi');
    dogrula(!hatalar.length, 'sayfa hatası: ' + hatalar.join(' | '));
    log('↪ Başka gün: kaçırılan gün k (devamsızlık değil), seçilen gün geldi, pakete sayılmadı ✓');
  } finally {
    if (temiz) {
      for (const t of [temiz.iso, temiz.bugun]) await miloApi('/attendance/auto', { method: 'DELETE', body: JSON.stringify({ tarih: t, ad: temiz.ad }) }).catch(() => {});
    }
    await ctx.close();
  }
}
