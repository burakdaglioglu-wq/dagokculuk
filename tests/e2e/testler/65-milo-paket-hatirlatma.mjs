// Milo · 📦 paket bitiyor hatırlatması (2026-10-27, kullanıcı: "7. derste veliye 'Son dersiniz yaklaşıyor, yeni paket' mesajı hazır
// olsun. Telafi hakkı varsa onu da yazsın"). 7 ders (1 gelmedi) → Defter'de "Paketi bitiyor" kartı, öğrenci sayfasında uyarı, mesajda
// "son 1 dersi kaldı" + "1 telafi hakkı", WhatsApp veli numarasıyla açılır, gönderildi her cihazda (meta) görünür; Genel Bakış dikkat
// listesinde. Sıradaki paket ödenince listeden düşer. Test üyesi, yoklamaları ve meta kayıtları sonunda silinir.
import { miloApi, miloOturumAl, esit, dogrula, benzersiz, sayfaAc, B } from '../yardimci.mjs';

export default async function ({ log }) {
  const G = benzersiz('E2E Paket '), A = 'PAKET ' + G, gun = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const tarihler = [20, 18, 15, 13, 10, 8, 3].map(gun), anahtar = G + '|' + A;
  const metaOku = async (k) => { const r = await miloApi('/meta/' + k); return r.d && r.d.value ? JSON.parse(r.d.value) : {}; };
  try {
    await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: G, ad: A, acilTelefon: '05321234567' }) });
    for (const [i, t] of tarihler.entries()) await miloApi('/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: t, ad: A, grup: G, saat: '10:00', elle: true, geldi: i !== 2 }) });
    const yd = await metaOku('yoklama_durum'); yd[tarihler[2] + '|' + A] = { d: 'haber', t: Date.now() }; await miloApi('/meta/yoklama_durum', { method: 'PUT', body: JSON.stringify({ value: JSON.stringify(yd) }) }); // 📞 haber verdi → telafi hakkı
    const tok = await miloOturumAl();
    const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 1280, yukseklik: 860 });
    try {
      await ctx.addInitScript((t) => { try { localStorage.setItem('milo_oturum', t); localStorage.setItem('milo_kagit_aktarim_2026_10', '1'); } catch (e) {} }, tok);
      await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof miloUygulamayaGir === 'function' && typeof mdPaketBitenler === 'function', null, { timeout: 30000 });
      await p.evaluate(() => { window.__acilan = []; window.open = (u) => { window.__acilan.push(u); return null; }; miloUygulamayaGir(); }); await p.waitForTimeout(600);
      await p.evaluate(() => miloSekme('defter')); await p.waitForSelector('.md-ph', { timeout: 20000 });
      const kart = await p.evaluate((ad) => { let s = [...document.querySelectorAll('.md-ph-s')].find((x) => x.textContent.includes(ad)); return s ? { metin: s.textContent, btn: s.querySelector('.md-btn').textContent } : null; }, A);
      dogrula(kart && /7\/8/.test(kart.metin) && /son ders/.test(kart.metin) && /1 telafi/.test(kart.metin) && /Hatırlat/.test(kart.btn), 'Paketi bitiyor kartı: ' + JSON.stringify(kart));
      const msg = await p.evaluate((k) => mdPaketMesaj(mdPaketBul(mdUye(k))), anahtar);
      dogrula(/1\. paket: 7\/8 ders tamamlandı, son 1 dersi kaldı/.test(msg) && /1 telafi hakkı var \(.+ tarihine kadar\)/.test(msg) && /Son dersiniz yaklaşıyor/.test(msg) && /yeni paketi/.test(msg), 'mesaj: ' + msg);
      // öğrenci sayfası uyarısı → gönder
      await p.evaluate((k) => mdSec(encodeURIComponent(k)), anahtar); await p.waitForSelector('.md-uyari.paket');
      await p.locator('.md-uyari.paket button').click(); await p.waitForTimeout(800);
      const acilan = await p.evaluate(() => window.__acilan[0] || '');
      dogrula(acilan.startsWith('https://api.whatsapp.com/send?phone=905321234567&text=') && decodeURIComponent(acilan).includes('son 1 dersi kaldı'), 'WhatsApp: ' + acilan.slice(0, 90));
      const sunucu = await metaOku('paket_hatirlatma');
      dogrula(sunucu[anahtar + '|1'] && sunucu[anahtar + '|1'].t > 0, 'gönderildi sunucuya yazılmalı');
      dogrula(await p.evaluate((ad) => { let s = [...document.querySelectorAll('.md-ph-s')].find((x) => x.textContent.includes(ad)); return s && s.classList.contains('gitti') && /tekrar/.test(s.textContent); }, A), 'kartta gönderildi');
      // Genel Bakış dikkat listesi: gönderilmemişleri sayar (bu öğrenci gönderildi → içinde olmamalı)
      const dikkat = await p.evaluate((ad) => { let l = miloYonetimAdaptor().ekDikkat(); return l.map((x) => x.alt).join(' | ').includes(ad.split(' ')[0] + ' 7/8'); }, A);
      dogrula(!dikkat, 'gönderilen öğrenci dikkat listesinde olmamalı');
      // sıradaki paket ödenince listeden düşer
      await p.evaluate(async (k) => { MD.odeme = await mdMetaYaz('paket_odeme', { [k + '|2']: { odendi: true, tutar: 1000, odemeTarihi: '2026-10-27', t: Date.now() } }); }, anahtar);
      esit(await p.evaluate((k) => !!mdPaketBul(mdUye(k)), anahtar), false, 'yeni paket ödenince hatırlatma kalkmalı');
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
    log('7/8 + 1 haber verdi → kart, uyarı, mesaj (son 1 ders + 1 telafi), WhatsApp veli no, gönderildi meta, dikkat listesi, ödenince düşer');
  } finally {
    { const v = await metaOku('yoklama_durum').catch(() => ({})); delete v[tarihler[2] + '|' + A]; await miloApi('/meta/yoklama_durum', { method: 'PUT', body: JSON.stringify({ value: JSON.stringify(v) }) }).catch(() => {}); }
    for (const k of ['paket_hatirlatma', 'paket_odeme']) { const v = await metaOku(k).catch(() => ({})); Object.keys(v).filter((x) => x.startsWith(anahtar + '|')).forEach((x) => delete v[x]); await miloApi('/meta/' + k, { method: 'PUT', body: JSON.stringify({ value: JSON.stringify(v) }) }).catch(() => {}); }
    for (const t of tarihler) await miloApi('/attendance/auto', { method: 'DELETE', body: JSON.stringify({ tarih: t, ad: A }) }).catch(() => {});
    await miloApi('/members/' + encodeURIComponent(G) + '/' + encodeURIComponent(A), { method: 'DELETE' }).catch(() => {});
  }
}
