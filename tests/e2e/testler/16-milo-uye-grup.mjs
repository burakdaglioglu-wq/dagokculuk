// Milo · üye formu (isim değiştirme + veli adı parantezde + Türkçe büyük harf), grup adı değiştirme (sporcu + ders taşınır),
// Yaş/Grup "Sporcu ata" seçicisi (kayıpsız /rename), ders penceresinde çoklu ekleme, hazır yaş gruplarını düzenleme,
// haftalık program takvimi/ajanda; telefonda taşma yok.
import { miloApi, miloOturumAl, esit, dogrula, benzersiz, sayfaAc, B, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  const G = benzersiz('E2E Grup '), G2 = G + ' Yeni', H = benzersiz('E2E Hedef ');
  const uyeler = [[G, 'ALİ ' + G], [G, 'AYŞE ' + G], [H, 'CAN ' + H]];
  let slotId = null, eskiPreset = null, sil = [];
  try {
    for (const [g, ad] of uyeler) await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: g, ad }) });
    const r = await miloApi('/antrenman-programi', { method: 'POST', body: JSON.stringify({ grup: G, gunler: [new Date().getDay()], baslangicSaat: '10:00', bitisSaat: '11:00', kapasite: 8 }) });
    slotId = r.d.id;
    await miloApi('/antrenman-programi/' + slotId + '/katilimci', { method: 'POST', body: JSON.stringify({ grup: G, ad: 'ALİ ' + G }) });
    eskiPreset = (await miloApi('/meta/ders_yas_presetler')).d.value;
    const tok = await miloOturumAl();
    for (const [w, h] of [[1280, 900], [390, 844]]) {
      const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: w, yukseklik: h });
      try {
        await ctx.addInitScript((t) => { try { localStorage.setItem('milo_oturum', t); } catch (e) {} }, tok);
        await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof miloUygulamayaGir === 'function' && typeof mspKur === 'function' && typeof mufKaydet === 'function', null, { timeout: 30000 });
        await p.evaluate(() => miloUygulamayaGir()); await p.waitForTimeout(800);
        // program: takvim (masaüstü) / ajanda (telefon)
        await p.evaluate(() => miloSekme('program')); await p.waitForSelector('#milo-program-izgara .pno', { timeout: 20000 });
        if (w === 390) {
          dogrula(await p.locator('#milo-program-izgara .pno-kart', { hasText: G }).count(), 'telefonda panoda ders yok');
          dogrula(await yataydaTasmaYok(p), 'Milo program telefonda taşıyor');
          await p.evaluate(() => miloSekme('uyeler')); await p.waitForTimeout(400);
          await p.evaluate(() => miloUyeFormAc()); await p.waitForSelector('#muf-ad');
          dogrula(await yataydaTasmaYok(p), 'üye formu telefonda taşıyor');
          esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
          continue;
        }
        const blok = p.locator('#milo-program-izgara .pno-kart', { hasText: G });
        dogrula(await blok.count(), 'takvimde ders bloğu yok');


        // ders penceresi: çoklu seçici ile AYŞE ekle
        await blok.first().click(); await p.waitForSelector('.mdp-hd');
        await p.locator('.mdp-ekle').click(); await p.waitForSelector('#msp-ders');
        await p.evaluate((g) => mspAra('ders', g), G); await p.waitForTimeout(150);
        await p.locator('#msp-ders .msp-uye', { hasText: 'AYŞE ' + G }).click();
        await p.locator('#msp-ders-btn').click();
        await p.waitForFunction((a) => (miloProgram.find((s) => s.katilimcilar && s.katilimcilar.some((k) => k.ad === a)) || null), 'AYŞE ' + G, { timeout: 10000 });
        await p.evaluate(() => miloDersRosterKapat());

        // hazır yaş grupları: ilkinin adını değiştir, kaydet
        await p.locator('.mds-pduz-ac').click(); await p.waitForSelector('.mds-pd-sat');
        await p.locator('.mds-pd-ad').first().fill('Minikler E2E');
        await p.locator('.mds-pd-alt .kaydet').click();
        await p.waitForSelector('.mds-yas:has-text("Minikler E2E")', { timeout: 8000 });
        const pr = JSON.parse((await miloApi('/meta/ders_yas_presetler')).d.value || '[]');
        esit(pr[0] && pr[0].ad, 'Minikler E2E', 'hazır grup adı kaydı');

        // üye formu: isim değiştir + veli adı, Türkçe büyük harf
        await p.evaluate(() => miloSekme('uyeler')); await p.waitForTimeout(400);
        await p.evaluate(([g, a]) => miloUyeFormAc(g, a), [G, 'ALİ ' + G]); await p.waitForSelector('#muf-ad');
        dogrula(!(await p.locator('#muf-ad').isDisabled()), 'isim kutusu kilitli');
        await p.locator('#muf-ad').fill('ali can ' + G.toLowerCase());
        await p.locator('#muf-veli').fill('Zeynep (anne)');
        await p.locator('.muf-btnler .milo-btn-full').click();
        const yeniAd = ('ali can ' + G.toLowerCase()).toLocaleUpperCase('tr-TR');
        sil.push([G, yeniAd]);
        await p.waitForFunction((a) => miloUyeler.some((u) => u.ad === a), yeniAd, { timeout: 10000 });
        dogrula(yeniAd.includes('İ'), 'Türkçe büyük harf (i→İ) beklenirdi');
        const u = await p.evaluate((a) => miloUyeler.find((x) => x.ad === a), yeniAd);
        esit(u.acilKisi, 'Zeynep (anne)', 'veli adı');
        dogrula(await p.locator('.muf-veli', { hasText: 'Zeynep (anne)' }).count(), 'listede veli adı parantezde görünmüyor');
        // ders kaydı yeni isme taşındı mı
        const slot = (await miloApi('/antrenman-programi')).d.slots.find((s) => s.id === slotId);
        dogrula(slot.katilimcilar.some((k) => k.ad === yeniAd), 'isim değişince ders kaydı taşınmadı');

        // grup adı değiştir (prompt) → üyeler + ders
        await p.evaluate(async () => { await miloSekme('ders'); miloDerslerAltGorunum = 'grup'; miloSeciliYasId = null; miloSeciliGrupId = null; miloDerslerCiz(); }); await p.waitForTimeout(500);
        dogrula(await p.locator('.msp-grupad-sat', { hasText: G }).count(), 'Kullanılan grup adları listesinde grup yok');
        await p.evaluate((g) => { window.prompt = () => g; }, G2);
        await p.evaluate((g) => mspGrupAdDegistir(g), G);
        await p.waitForFunction((g) => miloUyeler.filter((u) => u.grup === g).length === 2, G2, { timeout: 10000 });
        const s2 = (await miloApi('/antrenman-programi')).d.slots.find((s) => s.id === slotId);
        esit(s2.grup, G2, 'ders adı da yeni gruba geçmeli');
        dogrula(s2.katilimcilar.every((k) => k.grup === G2), 'ders katılımcıları yeni grupta değil');
        sil = sil.map(([g, a]) => [G2, a]);

        // Yaş/Grup › sporcu ata seçicisi: CAN'ı G2'ye taşı (/rename)
        const yk = await miloApi('/yas-kategorileri', { method: 'POST', body: JSON.stringify({ ad: 'E2E Yaş ' + G }) }).then((x) => x.d);
        const gr = await miloApi('/gruplar', { method: 'POST', body: JSON.stringify({ yasKategorisiId: yk.id, ad: G2 }) }).then((x) => x.d);
        await p.evaluate(async (id) => { miloGruplar = (await miloApi('/gruplar')).gruplar; miloYasKategorileri = (await miloApi('/yas-kategorileri')).yasKategorileri; await miloGrupAc(id); miloGrupAtamaAcikToggle(); }, gr.id);
        await p.waitForSelector('#msp-grup');
        await p.evaluate((g) => mspAra('grup', g), H); await p.waitForTimeout(150);
        await p.locator('#msp-grup .msp-uye', { hasText: 'CAN ' + H }).click();
        await p.locator('#msp-grup-btn').click();
        await p.waitForFunction(([g, a]) => miloUyeler.some((u) => u.grup === g && u.ad === a), [G2, 'CAN ' + H], { timeout: 10000 });
        await miloApi('/yas-kategorileri/' + yk.id, { method: 'DELETE' });
        esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
      } finally { await ctx.close(); }
    }
    log('Milo: isim değiştirme (İ) + veli parantezde, ders kaydı taşındı; grup adı → sporcu + ders; Sporcu ata seçicisi; ders penceresi çoklu ekleme; hazır grup adı kaydı; takvim/ajanda ✓');
  } finally {
    if (slotId) await miloApi('/antrenman-programi/' + slotId, { method: 'DELETE' }).catch(() => {});
    await miloApi('/meta/ders_yas_presetler', { method: 'PUT', body: JSON.stringify({ value: eskiPreset || '[]' }) }).catch(() => {});
    const hepsi = (await miloApi('/members')).d.members.filter((u) => [G, G2, H].includes(u.grup));
    for (const u of hepsi) await miloApi(`/members/${encodeURIComponent(u.grup)}/${encodeURIComponent(u.ad)}`, { method: 'DELETE' }).catch(() => {});
  }
}
