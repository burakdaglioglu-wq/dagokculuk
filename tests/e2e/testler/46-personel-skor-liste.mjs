// 👥 Sporcular & Skor yeni liste · 🪪 Eğitmen & Misafir personel ekranı · 🎯 Skor Girenler · isme dokun → profil (2026-10-21).
// Kullanıcı: "Sporcular & Skor'u da son önerdiğin düzende yönetelim (eski berbat düzen olmasın), Canlı İzleme Linki'ni kaldır ·
// Eğitmen & Misafir'de isme tıklayınca bilgileri düzelteyim, eğitmene verilen/alınan para (şifreyle) · Eğitmen Panosu'nu kaldır ·
// Bugün skor girenler çalışmıyor, geçmişi de göremiyorum · Öğrenci Defteri'nde ve her yerde sporcuya tıklayınca düzelteyim".
// Test eğitmeni açılır, ödeme eklenir; sonunda eğitmen silinir, ödeme silindi işaretlenir.
import { sayfaAc, uygulamaAc, yoneticiAc, benzersiz, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  const AD = benzersiz('ZZ E2E EĞİTMEN ');
  let pid = null;
  try {
    await uygulamaAc(p);
    await yoneticiAc(p, 'kullanicilar');
    // ---- Sporcular & Skor: yeni liste ----
    await p.waitForSelector('#ys-ekran .ys-sat', { timeout: 30000 });
    dogrula(!/Canlı İzleme/.test(await p.locator('#yonetici-liste').textContent()), 'Canlı İzleme Linki listeden kalkmalı');
    dogrula(await p.locator('#ys-ekran .ys-sat input').count() === 0, 'kapalı satırlarda eski düzenleme kutuları olmamalı');
    const ilk = await p.evaluate(() => document.querySelector('#ys-ekran .ys-sat .yn-isim').getAttribute('data-sporcu'));
    await p.locator('#ys-ekran .ys-sat .yn-isim').first().click();
    await p.waitForSelector('#yn-kart .yn-p-kart', { timeout: 15000 });
    const prof = await p.locator('#yn-kart').textContent();
    for (const x of ['Uygulama girişi', 'Giriş linkini gönder', 'Fotoğraf', 'Haftalık program', 'Skorları düzelt', 'Çift kayıt']) dogrula(prof.includes(x), 'profilde "' + x + '" işlemi yok');
    await p.evaluate(() => ynKartKapat());
    await p.locator('#ys-ekran .ys-sat .isl .ap-btn').first().click();
    await p.waitForSelector('#ys-ekran .ys-skor', { timeout: 5000 });
    await p.locator('#ys-ekran .ys-sat .isl .ap-btn').first().click();
    dogrula(await p.locator('#ys-ekran .ys-skor').count() === 0, 'Skorlar ikinci dokunuşta kapanmalı');
    // menü: Eğitmen Panosu ve eski Personel yok, Skor Girenler var
    const menu = await p.evaluate(() => JSON.stringify(YONETICI_BOLUMLER));
    dogrula(!/'egitmen'|"egitmen"/.test(menu) && !/"personel"/.test(menu), 'Eğitmen Panosu / Personel menüden kalkmalı');
    dogrula(/Skor Girenler/.test(menu), 'menüde Skor Girenler olmalı');
    log('liste + profil işlemleri tamam (' + ilk + ')');

    // ---- 🪪 Eğitmen & Misafir ----
    await p.evaluate(() => yoneticiSekme('egitmen')); // eski Eğitmen Panosu adresi → yeni ekran
    await p.waitForSelector('#ps-ekran', { timeout: 20000 });
    await p.evaluate(() => { _aidatKilitAcikMi = false; });
    await p.locator('#ps-ekran button:has-text("Eğitmen ekle")').click();
    await p.waitForSelector('#girdi-input', { state: 'visible' });
    await p.fill('#girdi-input', AD);
    await p.evaluate(() => girdiKaydet());
    await p.waitForSelector('#ps-profil [data-alan="tel"]', { timeout: 10000 });
    pid = await p.evaluate((ad) => (personelDB.find((x) => x.ad === ad) || {}).id, AD);
    dogrula(!!pid, 'eğitmen kadroya eklenmedi');
    await p.fill('#ps-profil [data-alan="tel"]', '05551234567');
    await p.selectOption('#ps-profil [data-alan="rol"]', 'antrenor');
    await p.locator('#ps-profil [data-alan="calisma"] button[data-v="yari"]').click();
    await p.locator('#ps-profil .yn-p-sag .ap-btn.ana').click();
    await p.waitForFunction(() => !document.querySelector('#ps-profil [data-alan]'), null, { timeout: 5000 });
    const b = await p.evaluate((id) => _psBilgi[id], pid);
    dogrula(b && b.tel === '05551234567' && b.rol === 'antrenor' && b.calisma === 'yari', 'eğitmen bilgisi kaydedilmedi: ' + JSON.stringify(b));
    dogrula(/Yarı zamanlı/.test(await p.locator('#ps-profil').textContent()), 'profil yeni bilgiyi göstermiyor');
    // para kilitli → PIN ister
    dogrula(await p.locator('#ps-profil #ps-pin').count() === 1, 'ücret/ödeme bölümü PIN istemeli');
    dogrula(!/Ödeme yaptım/.test(await p.locator('#ps-profil').textContent()), 'kilitliyken ödeme düğmesi görünmemeli');
    await p.evaluate(() => { _aidatKilitAcikMi = true; psProfilCiz(); });
    await p.fill('#ps-u-ders', '400'); await p.locator('#ps-profil button:has-text("Ücreti kaydet")').click();
    await p.locator('#ps-profil button:has-text("Ödeme yaptım")').click();
    await p.fill('#ps-o-tutar', '750'); await p.fill('#ps-o-acik', 'e2e avans');
    await p.locator('#ps-profil .ps-form .ap-btn.iyi').click();
    const od = await p.evaluate((id) => psOdemeler(id).map((o) => ({ tutar: o.tutar, tur: o.tur })), pid);
    dogrula(od.length === 1 && od[0].tutar === 750 && od[0].tur === 'verilen', 'ödeme kaydedilmedi: ' + JSON.stringify(od));
    dogrula(/e2e avans/.test(await p.locator('#ps-profil').textContent()), 'ödeme geçmişinde görünmüyor');
    esit(await p.evaluate((id) => String(_egUcret[id] && _egUcret[id].ucret), pid), '400', 'ders başı ücret');
    await p.evaluate(() => psProfilKapat());
    await p.evaluate(() => { PS.sekme = 'para'; psCiz(); });
    await p.waitForSelector('#ps-bordro:not([hidden])', { state: 'attached', timeout: 5000 });
    dogrula(new RegExp(AD.slice(0, 12)).test(await p.locator('#ps-ekran').textContent()), 'ödemeler sekmesinde eğitmen yok');
    await p.evaluate(() => { PS.sekme = 'egitmen'; psCiz(); });
    log('eğitmen profili + ödeme tamam');

    // ---- 🎯 Skor Girenler: sunucudan, 14 gün ----
    await p.evaluate(() => yoneticiSekme('bugunskor'));
    await p.waitForSelector('#sg-ekran .sg-gunler button', { timeout: 20000 });
    esit(await p.locator('#sg-ekran .sg-gunler button').count(), 14, '14 günlük şerit');
    await p.waitForFunction(() => !!_sgVeri, null, { timeout: 15000 });
    esit(await p.evaluate(() => _sgVeri && _sgVeri.kaynak), 'sunucu', 'skorlar sunucudan gelmeli');
    await p.locator('#sg-ekran .sg-gunler button').first().click();
    await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => _skorGirenlerTarih !== bugunISO()), 'geçmiş gün seçilebilmeli');

    // ---- 📒 Öğrenci Defteri: isim → profil ----
    await p.evaluate(() => yoneticiSekme('defter'));
    await p.waitForSelector('.od-sat [data-sporcu]', { timeout: 20000 });
    await p.locator('.od-sat [data-sporcu]').first().click();
    await p.waitForSelector('#yn-kart .yn-p-kart', { timeout: 15000 });
    await p.evaluate(() => ynKartKapat());

    // ---- telefon genişliği: yana taşma yok ----
    await p.setViewportSize({ width: 390, height: 844 });
    for (const s of ['kullanicilar', 'kisiler', 'bugunskor']) {
      await p.evaluate((x) => yoneticiSekme(x), s); await p.waitForTimeout(700);
      dogrula(await p.evaluate(() => { let e = document.getElementById('yonetici-liste'); return document.documentElement.scrollWidth <= innerWidth + 1 && e.scrollWidth <= e.clientWidth + 1; }), 'telefonda yana taşıyor: ' + s);
    }
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
  } finally {
    if (pid) await p.evaluate((id) => { try { psOdemeler(id).forEach((o) => psOdemeYaz(o.id, Object.assign({}, o, { sil: true }))); let c = window.confirm; window.confirm = () => true; personelSil(id); window.confirm = c; psBilgiYaz(id, { sil: true }); } catch (e) {} }, pid).catch(() => {});
    await p.waitForTimeout(1500);
    await ctx.close();
  }
}
