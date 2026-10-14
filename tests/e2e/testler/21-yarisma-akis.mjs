// Yarışma › Sıralama Turu akışı (2026-10-14, kullanıcı: "derste Yarışma'da sporcu eklerken sorun yaşadım; TV'de bir sporcunun
// serisini girmedim ama sonraki seriye geçemiyorum; yarışma sürerken sporcu eklemeyi düzelt").
// TV açıkken: satıra dokun → giriş penceresi; pencereden "Seriyi geç" (bekleyen boş kalır), seri bitince "✅ seri tamam"
// ekranı (sonraki seri + süre), ◀ önceki seri, 👥 ile TV'den sporcu ekleme (ders listesinde yoksa derse de girer).
// Ders sürerken ⋯ › Sporcu Ekle: "Derse ekle" modu (tarayıcı uyarısı yok, Yarışma'da kalır) → TV'de "🆕 Tura ekle" şeridi.
// Skorlar gerçek kayda İŞLENMEZ (kayit=false); tur ve ders listesi sonunda geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 760 });
  const diyaloglar = []; p.on('dialog', (d) => { diyaloglar.push(d.message()); d.dismiss().catch(() => {}); });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()) }));
    // ders: 4 sporcu, hat yok (karma değil); kurulum taslağı sıfır
    const ders = await p.evaluate(() => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif && !turnuvaDB[g][ad].donduruldu) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 4); localStorage.removeItem(kmHatAnahtari()); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
      return { dis: tum.slice(4, 7) };
    });
    // kurulum: derse SONRADAN gelen sporcu kendiliğinden seçili
    await p.evaluate((d) => { yzKurulumTaslak(); _kmListe.push(d.dis[0]); yzCiz(); }, ders);
    const kat = await p.evaluate(() => yzKurulumTaslak().katilimci.length);
    esit(kat, 5, 'derse sonradan gelen kurulumda seçili değil');
    await p.evaluate(() => { _kmListe.pop(); _yz.kurulum = null; yzKurulumTaslak(); yzKurAyar('kayit', false); yzCiz(); });
    await p.locator('button:has-text("Turu başlat")').click();
    await p.waitForTimeout(400);
    await p.locator('.yz-tur-btn button:has-text("TV ekranı")').click();
    await p.waitForTimeout(700);
    // 1) TV'de ilk satıra dokun, 6 ok, kaydet → pencere sıradakine geçer; içinden "2. seriye geç"
    await p.locator('#yz-tv tbody tr').first().click();
    for (const v of ['10', '9', '9', '8', '7', '6']) await p.locator('#yz-giris .yz-tus', { hasText: new RegExp('^' + v + '$') }).first().click();
    await p.locator('#yz-giris button:has-text("Kaydet")').click();
    await p.waitForTimeout(300);
    dogrula(await p.locator('#yz-giris .yz-akis').isVisible(), 'giriş penceresinde bekleyenler/seri geç yok');
    esit(await p.locator('#yz-giris .yz-akis-cip .yz-cip').count(), 2, 'bekleyen sporcu çipleri (4 sporcu, 1 girildi, 1 açık)');
    await p.locator('#yz-giris button', { hasText: '2. seriye geç' }).click();
    await p.waitForTimeout(400);
    esit(await p.evaluate(() => yzOku().durum.seri), 1, 'pencereden seri geçilemedi');
    dogrula(!(await p.locator('#yz-giris').count()), 'seri geçince pencere kapanmadı');
    // 2) 2. seri: üçünü doğrudan gir, sonuncuyu TV'den → "✅ seri tamam" ekranı → 3. seri + süre
    const son = await p.evaluate(() => { let o = yzOku(), s = yzHedefSirasi(o); s.slice(0, 3).forEach((k) => { yzGirisAc(yzEnc(k), 1); ['9', '9', '9', '8', '8', '8'].forEach((v) => yzOkEkle(v)); _yz.siradaki = false; yzGirisKaydet(); }); _yz.siradaki = true; return s[3]; });
    await p.evaluate((k) => yzTvSatir(yzEnc(k)), son);
    for (const v of ['X', '10', '9', '9', '8', '7']) await p.locator('#yz-giris .yz-tus', { hasText: new RegExp('^' + v + '$') }).first().click();
    await p.locator('#yz-giris button:has-text("Kaydet")').click();
    await p.waitForTimeout(300);
    dogrula(await p.locator('#yz-giris .yz-giris-tamam').isVisible(), '"seri tamam" ekranı çıkmadı');
    await p.locator('#yz-giris button', { hasText: 'süreyi başlat' }).click();
    await p.waitForTimeout(400);
    const s3 = await p.evaluate(() => ({ seri: yzOku().durum.seri, sayac: !!yzOku().sayac }));
    dogrula(s3.seri === 2 && s3.sayac, '3. seri + süre başlamadı: ' + JSON.stringify(s3));
    // 3) ◀ önceki seri (TV)
    await p.locator('#yz-tv .yz-tv-k', { hasText: /^◀$/ }).click();
    await p.waitForTimeout(300);
    esit(await p.evaluate(() => yzOku().durum.seri), 1, '◀ önceki seriye dönmedi');
    // 4) TV'den 👥 → ders dışı sporcu ara + ekle → tura ve derse girer
    await p.locator('#yz-tv .yz-tv-k', { hasText: '👥' }).click();
    await p.waitForTimeout(300);
    dogrula(await p.locator('#yz-secici .yz-secici').isVisible(), 'TV\'de sporcu seçici görünmüyor');
    await p.locator('#yz-sec-ara').fill(ders.dis[1].ad.slice(0, 6));
    await p.locator('#yz-secici .yz-sec-aday', { hasText: ders.dis[1].ad }).first().click();
    await p.waitForTimeout(300);
    const ek = await p.evaluate((x) => ({ tur: yzOku().durum.katilimci.includes(x.g + '|' + x.ad), ders: _kmListe.some((s) => s.g === x.g && s.ad === x.ad) }), ders.dis[1]);
    dogrula(ek.tur && ek.ders, 'TV\'den eklenen sporcu tura/derse girmedi: ' + JSON.stringify(ek));
    await p.locator('#yz-secici button:has-text("Kapat")').click();
    // 5) Ders sürerken ⋯ › Sporcu Ekle (TV açıkken): ekleme modu, uyarı yok, Yarışma'da kalınır
    await p.evaluate(() => kmSporcuEkle());
    await p.waitForTimeout(300);
    dogrula(await p.locator('#karisik-modal').isVisible(), 'sporcu ekle penceresi görünmüyor');
    esit((await p.locator('#km-baslat-btn').textContent()).trim(), '✓ Derse ekle', 'düğme ekleme modunda değil');
    await p.evaluate((x) => kmToggle(x.g, x.ad), ders.dis[2]);
    await p.locator('#km-baslat-btn').click();
    await p.waitForTimeout(800);
    // ders programı olan saatte "programa da yazayım mı?" sorulur (mevcut özellik) → bugünlük
    const bugunluk = p.locator('#onay-modal button', { hasText: 'Sadece bugün' }); if (await bugunluk.isVisible().catch(() => false)) { await bugunluk.click(); await p.waitForTimeout(300); }
    esit(diyaloglar.length, 0, 'tarayıcı uyarısı çıktı: ' + diyaloglar.join(' | '));
    const sonra = await p.evaluate((x) => ({ ders: _kmListe.some((s) => s.g === x.g && s.ad === x.ad), sekme: _kmAktifSekme, modal: getComputedStyle(document.getElementById('karisik-modal')).display }), ders.dis[2]);
    dogrula(sonra.ders && sonra.sekme === 'yarisma' && sonra.modal === 'none', 'derse ekleme / Yarışma\'ya dönüş: ' + JSON.stringify(sonra));
    // 6) TV'de "🆕 Tura ekle" şeridi → tura girer
    await p.waitForSelector('#yz-tv .yz-tv-yeniler', { timeout: 3000 });
    await p.locator('#yz-tv .yz-tv-yeniler button', { hasText: 'Tura ekle' }).click();
    await p.waitForTimeout(300);
    dogrula(await p.evaluate((x) => yzOku().durum.katilimci.includes(x.g + '|' + x.ad), ders.dis[2]), 'şeritten tura eklenmedi');
    dogrula(!(await p.locator('#yz-tv .yz-tv-yeniler').count()), 'şerit eklendikten sonra kalktı mı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('TV: seri geç, seri tamam → süre, ◀ geri, 👥 ekle; ders sürerken derse ekle → Tura ekle şeridi');
  } finally {
    if (yedek) await p.evaluate((y) => {
      try { yzTvKapat(); } catch (e) {}
      if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar());
      if (y.hat) localStorage.setItem(kmHatAnahtari(), y.hat); else localStorage.removeItem(kmHatAnahtari());
      _kmListe = JSON.parse(y.liste); _kmListeKaydet();
    }, yedek).catch(() => {});
    await p.waitForTimeout(2500); // ortak kayıt (km-ortak) gönderilsin
    await ctx.close();
  }
}
