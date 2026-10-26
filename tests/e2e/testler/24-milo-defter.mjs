// Milo · 📒 Öğrenci Defteri + 📝 Ders Günlüğü (2026-10-15). Defter: takvimden gün → durum (geldi/gelmedi/hasta/telafi/boşalt),
// seçim sayfayı yukarı kaydırmaz; 8 derslik paket, gelmediği ders = telafi hakkı, 8 dolunca uyarı, telafi hakkı kapatır;
// paket ödemesi notla. Kâğıt aktarımı: satır üyeye eşlenip yazılır. Günlük: kayıt → haftalık veli metni → aylık PDF.
// Test üyeleri, yoklamaları ve meta kayıtları sonunda silinir.
import { miloApi, miloOturumAl, esit, dogrula, benzersiz, sayfaAc, B } from '../yardimci.mjs';

export default async function ({ log }) {
  const G = benzersiz('E2E Defter '), A = 'DEFTER ' + G, A2 = 'AKTAR ' + G;
  const tarihler = [];
  try {
    for (const ad of [A, A2]) await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: G, ad, acilTelefon: '05550000000' }) });
    const tok = await miloOturumAl();
    const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 1280, yukseklik: 860 });
    try {
      await ctx.addInitScript((t) => { try { localStorage.setItem('milo_oturum', t); localStorage.removeItem('milo_kagit_aktarim_2026_10'); } catch (e) {} }, tok);
      await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof miloUygulamayaGir === 'function' && typeof mdDefterAc === 'function' && typeof mgAc === 'function', null, { timeout: 30000 });
      await p.evaluate(() => miloUygulamayaGir()); await p.waitForTimeout(600);
      await p.evaluate(() => miloSekme('defter')); await p.waitForSelector('.md-sat', { timeout: 20000 });
      await p.locator('#md-satirlar .md-sat', { hasText: A }).first().click();
      await p.waitForSelector('.md-takvim .md-gun');
      // takvimden gün seç: kaydırma yerinde kalmalı
      const gun = await p.evaluate(() => { const b = [...document.querySelectorAll('.md-takvim .md-gun:not([disabled])')]; return b.length; });
      dogrula(gun > 0, 'takvimde seçilebilir gün yok');
      await p.evaluate(() => { const a = document.getElementById('milo-icerik'); a.scrollTop = 200; });
      const once = await p.evaluate(() => document.getElementById('milo-icerik').scrollTop);
      await p.locator('.md-takvim .md-gun:not([disabled])').first().click();
      await p.waitForSelector('.md-secici');
      await p.locator('.md-secici button', { hasText: 'Gelmedi' }).click();
      await p.waitForTimeout(500);
      const sonra = await p.evaluate(() => document.getElementById('milo-icerik').scrollTop);
      dogrula(Math.abs(sonra - once) < 5, 'gün seçince sayfa kaydı: ' + once + ' → ' + sonra);
      // paket + TELAFİ KURALI (2026-10-27): 📞 haber verdi / 🤒 hasta → 30 gün hak, habersiz → hak yok (kural tarihinden önce eski
      // kural); yönetici "hak verme" / "geri al"; son günü geçen hak düşer; telafi dersi açık hakkı kapatır; hasta; boşalt
      const r = await p.evaluate(async (ad) => {
        const u = MD.uyeler.find((x) => x.ad === ad), gun = (n) => { const d = new Date(); d.setDate(d.getDate() - 40 + n); return mdIso(d); }, k = encodeURIComponent(mdKey(u));
        const once = mdKayitlar(u).length, yazilan = [];
        for (let i = 0; i < 6; i++) { await mdGunYaz(u, gun(i * 2), 'g'); yazilan.push(gun(i * 2)); }
        const hak0 = mdOzet(u).hak;
        await mdGunYaz(u, gun(12), 'm'); yazilan.push(gun(12));
        const o1 = mdOzet(u), hm = o1.haklar.find((h) => h.iso === gun(12));
        const kural = { eskiY: mdHakVarMi(u, { iso: '2020-01-01', s: 'y' }), yeniY: mdHakVarMi(u, { iso: '2099-01-01', s: 'y' }), yeniH: mdHakVarMi(u, { iso: '2099-01-01', s: 'h' }), yeniM: mdHakVarMi(u, { iso: '2099-01-01', s: 'm' }) };
        await mdHakIslem(k, gun(12), 'yok'); const hakYok = mdOzet(u).hak, satirYok = /Elle kaldırıldı/.test((document.querySelector('.md-haklar') || {}).textContent || '');
        await mdHakIslem(k, gun(12), 'geri'); const hakGeri = mdOzet(u).hak, satirAcik = /Açık/.test((document.querySelector('.md-haklar') || {}).textContent || '');
        const e = MD.durum[gun(12) + '|' + ad], eskiB = e.bitis; e.bitis = '2020-01-02';
        const dus = mdOzet(u).haklar.find((h) => h.iso === gun(12)).durum; if (eskiB) e.bitis = eskiB; else delete e.bitis;
        await mdGunYaz(u, gun(16), 't'); yazilan.push(gun(16));
        const o2 = mdOzet(u), kul = o2.haklar.filter((h) => h.kullanim === gun(16)).length, telafiPaket = o2.paketler.some((pp) => pp.telafiler.some((t) => t.iso === gun(16)));
        await mdGunYaz(u, gun(22), 'h'); yazilan.push(gun(22));
        const hasta = mdGun(u, gun(22)), metaH = (await mdMeta('yoklama_durum'))[gun(22) + '|' + ad];
        await mdGunYaz(u, gun(22), null);
        const bos = mdGun(u, gun(22)), sunucu = (await miloApi('/attendance/auto?tarih=' + gun(22))).attendance.some((x) => x.ad === ad);
        return { once, hak0, hak1: o1.hak, hm: hm && hm.durum, hmBitisOk: !!(hm && hm.bitis >= mdIso(new Date())), uy: o1.uyarilar.map((w) => w.tur), kural, hakYok, satirYok, hakGeri, satirAcik, dus, hak2: o2.hak, kul, telafiPaket, hasta, metaH: metaH && metaH.d, bos, sunucu, yazilan };
      }, A);
      tarihler.push(...r.yazilan);
      dogrula(r.hm === 'acik' && r.hmBitisOk && r.hak1 === r.hak0 + 1 && r.uy.includes('telafi'), '📞 haber verdi → 30 gün açık hak: ' + JSON.stringify(r));
      dogrula(!r.kural.eskiY && !r.kural.yeniY && r.kural.yeniH && r.kural.yeniM, 'kural: düz gelmedi (eski de) hak yok, hasta/haber hak: ' + JSON.stringify(r.kural));
      dogrula(r.hakYok === r.hak0 && r.satirYok && r.hakGeri === r.hak1 && r.satirAcik, 'yönetici hak verme / geri al: ' + JSON.stringify(r));
      esit(r.dus, 'dustu', 'son günü geçen hak düşmeli');
      dogrula(r.kul === 1 && r.hak2 === r.hak1 - 1 && r.telafiPaket, 'telafi dersi açık hakkı kapatmalı: ' + JSON.stringify(r));
      dogrula(r.hasta === 'h' && r.metaH === 'hasta', 'hasta kaydı: ' + JSON.stringify(r));
      dogrula(r.bos === null && !r.sunucu, 'boşalt sunucudan silmedi: ' + JSON.stringify(r));
      // ödeme: tutar + not
      await p.evaluate(() => mdDetayYenile()); await p.waitForSelector('#md-o-tutar-1');
      await p.fill('#md-o-tutar-1', '2400'); await p.fill('#md-o-not-1', 'forma ile beraber');
      await p.locator('.md-paket .md-btn', { hasText: 'Kaydet' }).last().click(); await p.waitForTimeout(600);
      const od = await p.evaluate((k) => mdMeta('paket_odeme').then((m) => m[k]), G + '|' + A + '|1');
      dogrula(od && od.odendi && od.tutar === 2400 && od.not === 'forma ile beraber', 'paket ödemesi: ' + JSON.stringify(od));
      dogrula((await p.locator('.md-odemeler').textContent()).includes('forma ile beraber'), 'ödeme listesinde not yok');
      // kâğıt aktarımı: ilk satırı test üyesine eşle, yaz
      await p.evaluate(() => { MD.aktarim = null; mdAktarimAc(); });
      await p.waitForSelector('.md-ak-sat');
      dogrula(await p.locator('.md-ak-sat').count() >= 17, 'aktarım satırları eksik');
      await p.evaluate((k) => { MD.aktarim.forEach((r) => { r.uyeler = []; }); mdAktarimUye(0, k); }, G + '|' + A2);
      await p.locator('#md-ak-kaydet').click(); await p.waitForTimeout(1500);
      const ak = await p.evaluate(async (ad) => (await miloApi('/attendance/auto')).attendance.filter((x) => x.ad === ad).map((x) => x.tarih + ':' + x.geldi), A2);
      dogrula(ak.length === 2 && ak.some((x) => x.startsWith('2026-09-20')), 'kâğıt aktarımı yazmadı: ' + JSON.stringify(ak));
      tarihler.push('2026-09-20', '2026-09-26');
      // 📝 Ders günlüğü: kayıt → haftalık metin → aylık PDF
      await p.evaluate(() => miloSekme('gunluk')); await p.waitForSelector('.mg');
      await p.locator('.mg-btn', { hasText: 'Bugünün dersini yaz' }).click(); await p.waitForSelector('#mg-form');
      await p.locator('#mg-form .mg-cip', { hasText: '2 yaş' }).click();
      await p.locator('#mg-form .mg-cip', { hasText: 'Koşma' }).click();
      await p.fill('#mg-konu', 'E2E ' + G); await p.fill('#mg-yap', 'Slalom koşusu\nTünelden emekleme');
      await p.locator('#mg-form button[type=submit]').click(); await p.waitForTimeout(700);
      dogrula(await p.locator('.mg-kart', { hasText: 'E2E ' + G }).count(), 'günlük kaydı listede yok');
      await p.locator('.mg-sekmeler button', { hasText: 'Haftalık' }).click();
      await p.locator('.mg-cip', { hasText: '2 yaş' }).first().click();
      const metin = await p.locator('#mg-hafta-metin').inputValue();
      dogrula(metin.includes('Slalom koşusu') && metin.includes('Koşma'), 'haftalık metin: ' + metin.slice(0, 200));
      await p.locator('.mg-sekmeler button', { hasText: 'Aylık' }).click();
      dogrula((await p.locator('.mg').textContent()).includes('Slalom koşusu'), 'aylık özette etkinlik yok');
      const [indir] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('.mg-btn', { hasText: 'PDF indir' }).click()]);
      dogrula((await indir.suggestedFilename()).startsWith('Milo_Ders_Ozeti_'), 'PDF adı');
      // günlük kaydını sil
      await p.evaluate(async (k) => { const id = Object.keys(MG.kayit).find((x) => MG.kayit[x].konu === k); if (id) await mgYaz(id, { sil: true, tarih: MG.kayit[id].tarih }); }, 'E2E ' + G);
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
      log('defter: kaydırma yerinde, 📞 haber verdi → 30 gün hak, kural (habersiz hak yok), hak verme/geri al, süre dolunca düşer, telafi hakkı kapatır, telafi/hasta/boşalt, notlu ödeme, kâğıt aktarımı; günlük → haftalık metin → PDF');
    } finally { await ctx.close(); }
  } finally {
    for (const ad of [A, A2]) {
      for (const t of new Set(tarihler)) await miloApi('/attendance/auto', { method: 'DELETE', body: JSON.stringify({ tarih: t, ad }) }).catch(() => {});
      await miloApi('/members/' + encodeURIComponent(G) + '/' + encodeURIComponent(ad), { method: 'DELETE' }).catch(() => {});
    }
  }
}
