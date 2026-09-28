// Milo: veri kaybısız isim/grup düzeltme + birleştirme, meta deposu, veli raporu, Analiz / Çift Kayıt / Misafir ekranları.
import { miloApi, miloOturumAl, esit, dogrula, benzersiz, sayfaAc, B, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  const A = benzersiz('ML '), A2 = A + ' D', M1 = benzersiz('MB '), M2 = benzersiz('MB '), G = 'E2E Grup', G2 = 'E2E Grup 2';
  const n = new Date(), bugun = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'), ay = bugun.slice(0, 7);
  const sil = [];
  try {
    esit((await miloApi('/meta/x', {}, true)).s, 401, 'Milo meta girişsiz okunabiliyor');
    // rename: aidat + yoklama yeni isme, grup değişimi
    await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: G, ad: A, acilTelefon: '0555' }) });
    await miloApi(`/dues/${encodeURIComponent(A)}/${ay}`, { method: 'PUT', body: JSON.stringify({ odendi: true, tutar: 500 }) }).catch(() => {});
    await miloApi('/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: bugun, ad: A, grup: G, saat: '10:00', elle: true, geldi: true }) });
    esit((await miloApi(`/members/${encodeURIComponent(G)}/${encodeURIComponent(A)}/rename`, { method: 'POST', body: JSON.stringify({ yeniAd: A2, yeniGrup: G2 }) })).s, 200, 'Milo rename başarısız');
    const att = (await miloApi('/attendance/auto?tarih=' + bugun)).d.attendance;
    dogrula(att.some((x) => x.ad === A2) && !att.some((x) => x.ad === A), 'Milo yoklaması yeni isme taşınmadı');
    const uyeler = (await miloApi('/members')).d.members;
    dogrula(uyeler.some((u) => u.ad === A2 && u.grup === G2 && u.acilTelefon === '0555') && !uyeler.some((u) => u.ad === A), 'Milo üye yeniden adlandırılmadı');
    sil.push([G2, A2]);
    // merge
    await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: G, ad: M1 }) });
    await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: G, ad: M2, acilTelefon: '0532' }) });
    await miloApi('/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: bugun, ad: M2, grup: G, saat: '11:00', elle: true, geldi: true }) });
    esit((await miloApi(`/members/${encodeURIComponent(G)}/${encodeURIComponent(M2)}/merge`, { method: 'POST', body: JSON.stringify({ toGrup: G, toAd: M1 }) })).s, 200, 'Milo merge başarısız');
    const m1 = (await miloApi('/members')).d.members.find((u) => u.ad === M1);
    esit(m1 && m1.acilTelefon, '0532', 'birleştirmede boş alan doldurulmadı');
    dogrula((await miloApi('/attendance/auto?tarih=' + bugun)).d.attendance.some((x) => x.ad === M1), 'birleştirmede yoklama taşınmadı');
    sil.push([G, M1]);
    // veli raporu
    const kod = (await miloApi(`/members/${encodeURIComponent(G2)}/${encodeURIComponent(A2)}/izle-kodu`, { method: 'POST' })).d.kod;
    const r = await miloApi(`/veli-rapor/${kod}?ay=${ay}`, {}, true);
    esit(r.s, 200, 'Milo veli raporu alınamadı'); esit(r.d.ad, A2, 'Milo raporu yanlış üye');
    dogrula(!JSON.stringify(r.d).includes('0555'), 'Milo raporu telefonu sızdırıyor');
    const rp = await sayfaAc({ girisli: false, genislik: 390, yukseklik: 844 });
    try { await rp.p.goto(`${B}/rapor.html?kulup=milo&kod=${kod}&ay=${ay}`); await rp.p.waitForSelector('h1', { timeout: 20000 }); dogrula((await rp.p.locator('.logo').innerText()).includes('MILO'), 'Milo rapor sayfası Milo markasını göstermiyor'); dogrula(await yataydaTasmaYok(rp.p), 'Milo rapor taşıyor'); } finally { await rp.ctx.close(); }
    // arayüz
    const tok = await miloOturumAl();
    for (const [w, h] of [[1280, 900], [390, 844]]) {
      const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: w, yukseklik: h });
      try {
        await ctx.addInitScript((t) => { try { localStorage.setItem('milo_oturum', t); } catch (e) {} }, tok);
        await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof miloUygulamayaGir === 'function', null, { timeout: 30000 });
        await p.evaluate(() => miloUygulamayaGir()); await p.waitForTimeout(800);
        await p.evaluate(() => miloSekme('analiz')); await p.waitForSelector('.ma-baslik', { timeout: 20000 });
        for (const s of ['Sporcular', 'Sayılar', 'Dersler']) { await p.locator('.ma-seg button', { hasText: s }).click(); await p.waitForTimeout(200); }
        await p.getByRole('button', { name: 'Ay', exact: true }).click(); await p.waitForTimeout(200);
        dogrula(await p.locator('.ma-hucre:not(.bos)').count() >= 28, 'Milo ay takvimi yok');
        await p.evaluate(() => maCiftAc()); await p.waitForTimeout(500);
        await p.locator('#ma-cift-ara').fill('mb'); await p.waitForTimeout(300);
        dogrula(await p.locator('.ma-kisi').count() >= 1, 'Milo çift kayıt araması sonuç vermedi');
        await p.evaluate(() => maMisafirAc()); await p.waitForTimeout(500);
        dogrula(await p.locator('.ma-baslik', { hasText: 'Misafirler' }).count(), 'Milo misafir ekranı açılmadı');
        dogrula(await yataydaTasmaYok(p), `Milo ${w}px taşıyor`);
        esit(hatalar.length, 0, 'Milo sayfa hatası: ' + hatalar.join(' | '));
      } finally { await ctx.close(); }
    }
    log('rename/grup/merge veri taşıyor, meta girişli, veli raporu ve Analiz/Çift Kayıt/Misafir ekranları çalışıyor');
  } finally {
    for (const [g, ad] of sil) await miloApi(`/members/${encodeURIComponent(g)}/${encodeURIComponent(ad)}`, { method: 'DELETE' });
  }
}
