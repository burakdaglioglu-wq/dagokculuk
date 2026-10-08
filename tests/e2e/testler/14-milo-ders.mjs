// Milo · yaşa göre ders oluşturma: aylık yaş gösterimi, "Bebek 12–24 ay" kutusu uygun çocukları önerir/seçer, ders + katılımcılar
// + yaş aralığı (meta ders_yas) kaydedilir, ızgarada yaş rozeti, ders penceresinde "Yaşı uyanlar"; 15 sn yenileme formu silmez.
import { miloApi, miloOturumAl, esit, dogrula, benzersiz, sayfaAc, B, yataydaTasmaYok } from '../yardimci.mjs';

const ayOnce = (n) => { let d = new Date(); d.setDate(15); d.setMonth(d.getMonth() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-15'; };

export default async function ({ log }) {
  const G = benzersiz('E2E Bebek '), uye = [['11 AY ' + G, 11], ['14 AY ' + G, 14], ['20 AY ' + G, 20], ['30 AY ' + G, 30], ['60 AY ' + G, 60]];
  let slotId = null, elleId = null;
  try {
    for (const [ad, ay] of uye) await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: G, ad, dogumTarihi: ayOnce(ay) }) });
    const tok = await miloOturumAl();
    for (const [w, h] of [[1280, 900], [390, 844]]) {
      const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: w, yukseklik: h });
      try {
        await ctx.addInitScript((t) => { try { localStorage.setItem('milo_oturum', t); } catch (e) {} }, tok);
        await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof miloUygulamayaGir === 'function' && typeof mdsCiz === 'function', null, { timeout: 30000 });
        await p.evaluate(() => miloUygulamayaGir()); await p.waitForTimeout(800);
        await p.evaluate(() => miloSekme('program')); await p.waitForSelector('#mds-kap .mds-yas', { timeout: 20000 });
        esit(await p.evaluate(() => miloYasMetin(new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10))), '13 ay', 'aylık yaş metni');
        if (w === 390) { dogrula(await yataydaTasmaYok(p), 'Milo ders sihirbazı telefonda taşıyor'); esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | ')); continue; }
        // ✍️ MANUEL (varsayılan): yaş/öğrenci olmadan elle ders; hiçbir şey kendiliğinden seçilmez
        esit(await p.evaluate(() => _mds.mod), 'manuel', 'varsayılan mod manuel');
        await p.locator('#mds-m-ad').fill('Elle ' + G);
        await p.locator('.mds-zaman-m input[type=time]').first().fill('17:00'); await p.locator('.mds-zaman-m input[type=time]').first().dispatchEvent('change');
        await p.locator('.mds-zaman-m .mds-cipler button', { hasText: '40 dk' }).click();
        await p.locator('.mds-yas', { hasText: '12–24 ay' }).click();
        esit(await p.evaluate(() => Object.keys(_mds.secili).length), 0, 'manuelde kendiliğinden seçim olmamalı');
        await p.locator('.mds-olustur').click();
        await p.waitForFunction((g) => (miloProgram || []).some((s) => s.grup === 'Elle ' + g), G, { timeout: 15000 });
        const m = await p.evaluate((g) => { let s = miloProgram.find((x) => x.grup === 'Elle ' + g); return { id: s.id, n: (s.katilimcilar || []).length, b: s.baslangicSaat + '-' + s.bitisSaat }; }, G);
        elleId = m.id; esit(m.n, 0, 'manuel derste öğrenci olmamalı'); esit(m.b, '17:00-17:40', 'manuel saat');
        // ✨ OTOMATİK
        await p.evaluate(() => { _mds.bas = '10:00'; mdsModSec('otomatik'); }); await p.waitForTimeout(200);
        await p.locator('.mds-yas', { hasText: '12–24 ay' }).click();
        // uygun: 14 ve 20 aylık (11 ay ve 30 ay dışarıda)
        const sec = await p.evaluate((g) => Object.keys(_mds.secili).filter((k) => k.startsWith(g + '|')).map((k) => k.split('|')[1]).sort(), G);
        esit(JSON.stringify(sec), JSON.stringify(['14 AY ' + G, '20 AY ' + G].sort()), 'bebek dersine uygun çocuklar');
        esit(await p.evaluate(() => _mds.sure), 30, 'bebek dersi süresi önerisi');
        // sadece test çocukları kalsın (yerel DB'de başka bebekler olabilir)
        await p.evaluate((g) => { Object.keys(_mds.secili).forEach((k) => { if (!k.startsWith(g + '|')) delete _mds.secili[k]; }); _mds.ad = 'Bebek ' + g; _mds.adElle = true; mdsCiz(); }, G);
        // 15 sn yenileme formu silmemeli
        esit(await p.evaluate(() => mdsDuzenleniyor()), true, 'form doluyken otomatik yenileme durmalı');
        await p.screenshot({ path: process.env.E2E_EKRAN ? process.env.E2E_EKRAN + '-milo-ders.png' : '/dev/null' }).catch(() => {});
        await p.locator('.mds-olustur').click();
        await p.waitForFunction((g) => (miloProgram || []).some((s) => s.grup === 'Bebek ' + g), G, { timeout: 15000 });
        const s = await p.evaluate((g) => { let s = miloProgram.find((x) => x.grup === 'Bebek ' + g); return { id: s.id, kisi: (s.katilimcilar || []).map((k) => k.ad).sort(), bit: s.bitisSaat, bas: s.baslangicSaat, kap: s.kapasite }; }, G);
        slotId = s.id;
        esit(JSON.stringify(s.kisi), JSON.stringify(['14 AY ' + G, '20 AY ' + G].sort()), 'derse eklenen çocuklar');
        esit(s.kap, 6, 'bebek kapasitesi'); esit(s.bas, '10:00', 'başlangıç'); esit(s.bit, '10:30', 'bitiş = başlangıç + 30 dk');
        const meta = JSON.parse((await miloApi('/meta/ders_yas')).d.value || '{}');
        esit(meta[slotId] && meta[slotId].minAy + '-' + meta[slotId].maxAy, '12-24', 'yaş aralığı kaydı');
        await p.waitForTimeout(500);
        dogrula(await p.locator('#milo-program-izgara .pno-kart', { hasText: '12–24 ay' }).count(), 'panoda yaş etiketi yok');
        // ders penceresi: 11 aylık listede değil, 20 aylık zaten derste; yaşı uyan öneri bölümü
        await p.evaluate((id) => miloDersRosterAc(id), slotId); await p.waitForTimeout(400);
        dogrula(await p.locator('.mdp-pill', { hasText: '12–24 ay' }).count(), 'ders penceresinde yaş aralığı yok');
        // sade ders penceresi: saat satırı → 45 dk çipi anında kaydeder
        await p.locator('.mdp-row', { hasText: 'Saat' }).click(); await p.locator('.mdp-cipler button', { hasText: '45 dk' }).click();
        await p.waitForFunction((id) => miloProgram.find((s) => s.id === id).bitisSaat === '10:45', slotId, { timeout: 8000 });
        esit(await p.evaluate(() => document.documentElement.classList.contains('milo-tema-sade')), true, 'varsayılan tema Sade');
        esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
      } finally { await ctx.close(); }
    }
    log('Milo: aylık yaş, Bebek 12–24 ay → doğru çocuklar seçildi, 10:00–10:30 · kapasite 6, yaş rozeti, yenileme formu korur ✓');
  } finally {
    if (slotId) await miloApi('/antrenman-programi/' + slotId, { method: 'DELETE' });
    if (elleId) await miloApi('/antrenman-programi/' + elleId, { method: 'DELETE' });
    for (const [ad] of uye) await miloApi(`/members/${encodeURIComponent(G)}/${encodeURIComponent(ad)}`, { method: 'DELETE' });
  }
}
