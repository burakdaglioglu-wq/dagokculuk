// Milo · 🎡 veli / sporcu panosu (2026-10-26, kullanıcı taslaklardan "2 · Halka pano"yu seçti). Sporcu girişi (ad + doğum yılı)
// → 8 derslik paket halkası (Defter hesabı: gelmedi/hasta = telafi hakkı), ödeme durumu (tutar yok), sıradaki ders (program),
// Ders Günlüğü'nden "bu hafta", gelişim yolu, antrenör notu. Test üyesi, yoklamaları, dersi ve meta kayıtları sonunda silinir.
import { miloApi, esit, dogrula, benzersiz, sayfaAc, B } from '../yardimci.mjs';

export default async function ({ log }) {
  const G = benzersiz('3 Yaş Pano '), A = 'PANO ' + G, gun = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const tarihler = [gun(12), gun(10), gun(8), gun(5), gun(3)], metaYedek = {};
  let slotId = null;
  const metaOku = async (k) => { const r = await miloApi('/meta/' + k); return r.d && r.d.value ? JSON.parse(r.d.value) : {}; };
  const metaYaz = async (k, v) => miloApi('/meta/' + k, { method: 'PUT', body: JSON.stringify({ value: JSON.stringify(v) }) });
  try {
    await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: G, ad: A, dogumTarihi: '2023-04-10', genelNot: 'Denge tahtasında elimi tutmadan yürüyor.', acilTelefon: '05550000000' }) });
    for (const [i, t] of tarihler.entries()) await miloApi('/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: t, ad: A, grup: G, saat: '10:00', elle: true, geldi: i !== 1 && i !== 3 }) });
    for (const k of ['yoklama_durum', 'paket_odeme', 'ders_gunlugu']) metaYedek[k] = await metaOku(k);
    await metaYaz('yoklama_durum', { ...metaYedek.yoklama_durum, [tarihler[3] + '|' + A]: { d: 'hasta', t: Date.now() } });
    await metaYaz('paket_odeme', { ...metaYedek.paket_odeme, [G + '|' + A + '|1']: { odendi: true, tutar: 1234, odemeTarihi: gun(12), not: 'gizli not', t: Date.now() } });
    await metaYaz('ders_gunlugu', { ...metaYedek.ders_gunlugu, e2epano: { tarih: gun(3), slot: G + ' 10:00', yaslar: ['3 yaş'], beceriler: ['denge', 'ziplama'], konu: 'Hayvan yürüyüşleri parkuru', yapilanlar: 'Ayı ve yengeç yürüyüşü', t: Date.now() } });
    const yarin = (new Date().getDay() + 1) % 7;
    const sl = await miloApi('/antrenman-programi', { method: 'POST', body: JSON.stringify({ grup: G, gunler: [yarin], baslangicSaat: '10:00', bitisSaat: '10:45' }) });
    slotId = sl.d.id; await miloApi('/antrenman-programi/' + slotId + '/katilimci', { method: 'POST', body: JSON.stringify({ grup: G, ad: A }) });

    // sunucu: paket 5/8 (2 gelmedi/hasta → 2 telafi hakkı), ödendi ama TUTAR/NOT yok, ders, bu hafta
    const r = await miloApi('/sporcu-girisi', { method: 'POST', body: JSON.stringify({ ad: A.toLocaleLowerCase('tr'), dogumYili: '2023' }) }, true);
    const s = r.d.sporcu;
    esit(s.paket && s.paket.dersler.join(''), 'gyghg', 'paket dersleri (geldi/gelmedi/hasta)');
    dogrula(s.paket.no === 1 && s.paket.telafiHakki === 2 && s.paket.odendi === true && s.paket.odemeTarihi === gun(12), 'paket: ' + JSON.stringify(s.paket));
    dogrula(!JSON.stringify(r.d).includes('1234') && !JSON.stringify(r.d).includes('gizli not'), 'ödeme tutarı / notu veliye gitmemeli');
    dogrula(s.dersler.length === 1 && s.dersler[0].gunler.includes(yarin) && s.dersler[0].bas === '10:00', 'dersler: ' + JSON.stringify(s.dersler));
    dogrula(s.buHafta.length === 1 && s.buHafta[0].konu === 'Hayvan yürüyüşleri parkuru' && s.buHafta[0].beceriler.join() === 'denge,ziplama', 'bu hafta: ' + JSON.stringify(s.buHafta));
    dogrula(s.kazanacak.map((b) => b.id + ':' + b.ders).sort().join() === 'denge:1,ziplama:1' && typeof s.buAyGeldi === 'number', 'kazanacak: ' + JSON.stringify(s.kazanacak));

    // ekran (telefon): sporcu girişi → halka pano
    const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 390, yukseklik: 844 });
    try {
      await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof mvpCss === 'function' && typeof miloSporcuGirisDene === 'function', null, { timeout: 30000 });
      await p.evaluate(([ad]) => { document.getElementById('milo-sporcu-giris-ad').value = ad; document.getElementById('milo-sporcu-giris-yil').value = '2023'; document.getElementById('milo-sporcu-hatirla-chk').checked = false; return miloSporcuGirisDene(); }, [A]);
      await p.waitForSelector('#milo-sporcu-app.mvp-kap .mvp-hero', { timeout: 10000 });
      await p.waitForTimeout(1300);
      const e = await p.evaluate(() => ({
        orta: document.querySelector('.mvp-orta b').textContent, dolu: document.querySelectorAll('.mvp-dilim.dolu').length, dilim: document.querySelectorAll('.mvp-dilim').length,
        cip: [...document.querySelectorAll('.mvp-hero .mvp-cip')].map((c) => c.textContent).join(' | '),
        sonraki: (document.querySelector('.mvp-sonraki') || {}).textContent || '', kare: [...document.querySelectorAll('.mvp-kare b')].map((b) => b.textContent).join(','),
        konu: (document.querySelector('.mvp-konu b') || {}).textContent, beceri: document.querySelectorAll('.mvp-beceri').length, not: (document.querySelector('.mvp-not') || {}).textContent || '', kz: document.querySelectorAll('.mvp-kz-s').length, kzBaslik: [...document.querySelectorAll('.mvp h4')].some((h) => /Bunları kazanacak/.test(h.textContent)), ogrendi: /öğrendi/.test(document.querySelector('.mvp').textContent),
        tasma: [...document.querySelectorAll('.mvp *')].filter((x) => !x.closest('.mvp-yatay') && x.getBoundingClientRect().right > innerWidth + 1).length,
      }));
      await p.screenshot({ path: 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/8cce1594-4a72-48c2-b738-81e8bb994514/scratchpad/mvp-e2e.png' }).catch(() => {});
      dogrula(e.orta === '5/8' && e.dilim === 8 && e.dolu === 5, 'halka: ' + JSON.stringify(e));
      dogrula(/2 telafi hakkı/.test(e.cip) && /Ödendi/.test(e.cip), 'paket çipleri: ' + e.cip);
      dogrula(/Sıradaki ders · 10:00/.test(e.sonraki) && /Yarın/.test(e.sonraki), 'sıradaki ders: ' + e.sonraki);
      dogrula(e.konu === 'Hayvan yürüyüşleri parkuru' && e.beceri === 2 && /Denge tahtasında/.test(e.not) && e.tasma === 0 && e.kz === 2 && e.kzBaslik && !e.ogrendi, 'pano içeriği: ' + JSON.stringify(e));
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
    log('sporcu girişi → halka 5/8 (gelmedi + hasta = 2 telafi), ödendi (tutarsız), yarınki ders, bu hafta + beceriler, bunları kazanacak (öğrendi yok), not, 390 px taşma yok');
  } finally {
    for (const k of Object.keys(metaYedek)) {
      const v = await metaOku(k).catch(() => ({}));
      delete v[tarihler[3] + '|' + A]; delete v[G + '|' + A + '|1']; delete v.e2epano;
      await metaYaz(k, v).catch(() => {});
    }
    if (slotId) await miloApi('/antrenman-programi/' + slotId, { method: 'DELETE' }).catch(() => {});
    for (const t of tarihler) await miloApi('/attendance/auto', { method: 'DELETE', body: JSON.stringify({ tarih: t, ad: A }) }).catch(() => {});
    await miloApi('/members/' + encodeURIComponent(G) + '/' + encodeURIComponent(A), { method: 'DELETE' }).catch(() => {});
  }
}
