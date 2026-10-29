// 💪 Eğitmen › Özel Ders · Sporla Gelişiyorum (2026-10-29, v343; kullanıcı: "Furkan'la özel ders yapıyorum, okçuluk değil —
// koordinasyon, güç, denge; okçuluktaki gibi oyunları açıp hareketlere göre puan veriyorum, TV'den takip ediyoruz; hareket
// değerlendirmesiyle ilerleme yapalım, veliye 'bugün ne yaptık, nelerde gelişeceğiz' gitsin").
// Sekme yalnız eğitmende; öğrenci ekle; hareket seç + hızlı puan; 🎮 oyunlarla devam → özel konum, şerit, dock'ta hareket seçimi,
// oyundan girilen seri OKÇULUK KAYDINA YAZILMAZ, özel ders defterine yazılır, geri al siler; özel ders sayfasına dönüş eski konumu
// geri getirir; gelişim (önceki derse göre ▲); veli mesajı + WhatsApp; 390 px taşma yok.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    yedek = await p.evaluate(() => ({ konum: localStorage.getItem('dag_km_konum'), depo: localStorage.getItem('dag_ozel_ders') }));
    // sporcu görünümünde sekme gizli, eğitmende görünür
    const gor = await p.evaluate(() => {
      loggedInSporcu = null; aktifPlatform = 'sporcu'; tablariPlatformaGoreAyarla(); const sporcu = document.getElementById('tab-ozelders').style.display;
      aktifPlatform = 'egitmen'; tablariPlatformaGoreAyarla(); const egitmen = document.getElementById('tab-ozelders').style.display; const ge = document.getElementById('giris-ekrani'); if (ge) ge.style.display = 'none'; // eğitmen girişi yapılmış gibi
      return { sporcu, egitmen };
    });
    esit(gor.sporcu, 'none', 'sporcu görünümünde özel ders sekmesi açık'); dogrula(gor.egitmen !== 'none', 'eğitmende özel ders sekmesi yok');
    // öğrenci ekle
    const k = await p.evaluate(() => {
      localStorage.removeItem('dag_ozel_ders'); sekmeAc('ozelders');
      const g = Object.keys(turnuvaDB).find((x) => turnuvaDB[x] && typeof turnuvaDB[x] === 'object' && Object.keys(turnuvaDB[x]).some((a) => turnuvaDB[x][a] && turnuvaDB[x][a].seriler && !turnuvaDB[x][a].pasif));
      const ad = Object.keys(turnuvaDB[g]).find((a) => turnuvaDB[g][a] && turnuvaDB[g][a].seriler && !turnuvaDB[g][a].pasif);
      return g + '|' + ad;
    });
    await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => /Sporla Gelişiyorum/.test(document.getElementById('icerik-ozelders').textContent)), 'sekme başlığı yok');
    const [g, ad] = [k.slice(0, k.indexOf('|')), k.slice(k.indexOf('|') + 1)];
    // önceki koşudan kalan kayıtlar sunucudan geri gelir (kayıt başına birleştirme) — öğrenciyi listeden çıkar, bugünü sıfırla
    await p.evaluate(async ([k, g, ad]) => { await ozdSenkron(); if (ozdOgr(k)) ozdYaz('ogr|' + k, Object.assign({}, ozdOgr(k), { aktif: false })); ozdYaz('ders|' + k + '|' + ozdBugun(), { g, ad, tarih: ozdBugun(), hareketler: ['top-sektir', 'tek-ayak'], kayitlar: [], not: '' }); _ozdSecili = null; ozdCiz(); }, [k, g, ad]);
    await p.click('text=＋ Öğrenci ekle'); await p.waitForTimeout(200);
    await p.fill('#ozd-ara', ad.split(' ')[0]); await p.waitForTimeout(200);
    await p.locator('.ozd-ara-satir', { hasText: ad }).first().click(); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => /Bugünün dersi/.test(document.getElementById('icerik-ozelders').textContent)), 'öğrenci sayfası açılmadı');
    // hareket seç (Denge › Uçak duruşu ekle) + hızlı puan
    await p.evaluate((k) => ozdHareketToggle(k, 'ucak'), k); await p.waitForTimeout(150);
    await p.locator('.ozd-hs', { hasText: 'Uçak duruşu' }).click(); await p.waitForTimeout(150);
    for (const v of ['8', 'X']) { await p.locator('.ozd-pad button', { hasText: new RegExp('^' + v + '$') }).click(); await p.waitForTimeout(120); }
    let d = await p.evaluate((k) => ozdDers(k), k);
    dogrula(d && d.hareketler.includes('ucak'), 'hareket eklenmedi');
    esit(JSON.stringify(d.kayitlar.filter((r) => r.h === 'ucak').map((r) => r.p).flat()), JSON.stringify(['8', 'X']), 'hızlı puanlar');
    // dün: daha düşük denge → gelişim ▲
    await p.evaluate(([k, g, ad]) => { const dn = new Date(); dn.setDate(dn.getDate() - 1); const t = dn.getFullYear() + '-' + String(dn.getMonth() + 1).padStart(2, '0') + '-' + String(dn.getDate()).padStart(2, '0'); ozdYaz('ders|' + k + '|' + t, { g, ad, tarih: t, hareketler: ['ucak'], kayitlar: [{ id: 'dun', h: 'ucak', p: ['5', '6'], t: 1 }], not: '' }); ozdCiz(); }, [k, g, ad]);
    dogrula(await p.evaluate(() => [...document.querySelectorAll('.ozd-g')].some((e) => /Denge/.test(e.textContent) && /▲/.test(e.textContent))), 'gelişimde denge artışı (▲) görünmüyor');

    // 🎮 oyunlarla devam → özel konum + şerit + hareket modu; seri okçuluk kaydına yazılmaz
    const seri0 = await p.evaluate(([g, ad]) => (turnuvaDB[g][ad].seriler || []).length, [g, ad]);
    await p.evaluate((k) => ozdOyunaGec(k), k);
    await p.waitForFunction(() => typeof kmOyunTemaSec === 'function' && !!document.getElementById('km-oyun-wrap'), null, { timeout: 30000 });
    await p.evaluate(() => kmOyunTemaSec('kale'));
    await p.waitForFunction(() => !!document.getElementById('kale-svg'), null, { timeout: 30000 });
    const mod = await p.evaluate(() => ({ konum: _kmAktifKonum, mod: ozdHareketModu(), serit: !!document.getElementById('ozd-km-banner'), dok: !!document.getElementById('ozd-dok'), lbl: (document.getElementById('km-oyun-ok-lbl') || {}).textContent, liste: _kmListe.length }));
    dogrula(/^ozel_/.test(mod.konum) && mod.mod, 'özel konum / hareket modu açılmadı: ' + JSON.stringify(mod));
    dogrula(mod.serit && mod.dok, 'şerit ya da dock hareket seçimi yok'); dogrula(/Hareket puanı/.test(mod.lbl), 'dock etiketi hareket puanı değil: ' + mod.lbl); esit(mod.liste, 1, 'özel derste tek sporcu olmalı');
    await p.locator('#ozd-dok .ozd-cip', { hasText: 'Uçak duruşu' }).click(); await p.waitForTimeout(150);
    await p.evaluate(async () => {
      _kmOyunAktifIndex = 0; _kmOyunSeriGirisleri = ['9', '7', 'X']; _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let i = 0; i < 80 && _kmOyunKilit; i++) await new Promise((r) => setTimeout(r, 150));
    });
    esit(await p.evaluate(([g, ad]) => (turnuvaDB[g][ad].seriler || []).length, [g, ad]), seri0, 'hareket puanı okçuluk kaydına yazıldı');
    d = await p.evaluate((k) => ozdDers(k), k);
    const son = d.kayitlar[d.kayitlar.length - 1];
    esit(son.h, 'ucak', 'oyundaki seri seçili harekete yazılmadı'); esit(son.p.join(','), '9,7,X', 'oyundaki seri puanları');
    dogrula(await p.evaluate(() => { const k = JSON.parse(localStorage.getItem('dag_km_kale_' + _kmAktifKonum) || 'null'); return k && k.seri >= 1; }), 'oyun (kale) ilerlemedi');
    await p.waitForTimeout(1500);
    await p.evaluate(() => kmOyunSonGirisiGeriAl()); await p.waitForTimeout(300);
    d = await p.evaluate((k) => ozdDers(k), k);
    dogrula(!d.kayitlar.some((r) => r.id === son.id), 'geri al hareket puanını silmedi');
    esit(await p.evaluate(([g, ad]) => (turnuvaDB[g][ad].seriler || []).length, [g, ad]), seri0, 'geri al okçuluk kaydına dokundu');

    // özel ders sayfasına dön → eski konum
    await p.click('#ozd-km-banner button'); await p.waitForTimeout(500);
    const don = await p.evaluate(() => ({ konum: _kmAktifKonum, km: document.getElementById('karisik-platform').style.display, aktif: document.getElementById('icerik-ozelders').classList.contains('aktif') }));
    esit(don.konum, yedek.konum, 'eski Karışık Sınıf konumu geri gelmedi'); esit(don.km, 'none', 'Karışık Sınıf kapanmadı'); dogrula(don.aktif, 'özel ders sekmesine dönülmedi');

    // 🏋️ v344 dumbbell: kg seç → puanlanan tekrar o kg ile kaydedilir
    await p.evaluate((k) => ozdHareketToggle(k, 'db-goblet'), k); await p.waitForTimeout(150);
    await p.locator('.ozd-hs', { hasText: 'Goblet squat' }).locator('select.ozd-kg').selectOption('4'); await p.waitForTimeout(150);
    await p.locator('.ozd-hs', { hasText: 'Goblet squat' }).click(); await p.waitForTimeout(100);
    await p.locator('.ozd-pad button', { hasText: /^9$/ }).click(); await p.waitForTimeout(150);
    d = await p.evaluate((k) => ozdDers(k), k);
    const gb = d.kayitlar[d.kayitlar.length - 1]; esit(gb.h + '|' + gb.kg, 'db-goblet|4', 'dumbbell ağırlığı kayda yazılmadı');
    // 📏 v344 fiziksel test: dünkü 20 m sprint 4,5 sn → bugün 4,21 sn = gelişme (süre azaldı)
    await p.evaluate(([k, g, ad]) => { const dn = new Date(); dn.setDate(dn.getDate() - 1); const t = dn.getFullYear() + '-' + String(dn.getMonth() + 1).padStart(2, '0') + '-' + String(dn.getDate()).padStart(2, '0'); ozdYaz('test|' + k + '|' + t, { g, ad, tarih: t, olcum: { 't-sprint20': 4.5 } }); ozdYaz('test|' + k + '|' + ozdBugun(), { g, ad, tarih: ozdBugun(), olcum: {} }); ozdCiz(); document.querySelector('.ozd-test').open = true; }, [k, g, ad]);
    await p.fill('.ozd-t-in[data-test="t-sprint20"]', '4,21');
    await p.click('text=Bugünkü ölçümleri kaydet'); await p.waitForTimeout(200);
    esit(await p.evaluate((k) => (ozdDepo()['test|' + k + '|' + ozdBugun()] || {}).olcum['t-sprint20'], k), 4.21, 'test ölçümü kaydedilmedi');
    dogrula(await p.evaluate(() => [...document.querySelectorAll('.ozd-t')].some((e) => /20 m sprint/.test(e.textContent) && e.querySelector('.ozd-g-fark.art'))), 'sprint süresi azaldığı halde gelişme (▲) görünmüyor');

    // veli mesajı
    await p.click('text=Veliye “Bugün ne yaptık?” gönder'); await p.waitForTimeout(300);
    const metin = await p.evaluate(() => document.getElementById('ozd-mesaj').value);
    dogrula(/Bugün çalıştıklarımız/.test(metin) && /Denge/.test(metin) && /Gelişeceğimiz|en iyi/.test(metin), 'veli mesajı eksik: ' + metin);
    dogrula(/Goblet squat \(4 kg\)/.test(metin) && /20 m sprint: 4,21 sn 📈/.test(metin), 'veli mesajında dumbbell ya da test yok: ' + metin);
    await p.click('.ozd-wa'); await p.waitForTimeout(300);
    const acilan = await p.evaluate(() => window.__acilan.slice(-1)[0] || '');
    dogrula(/^https:\/\/api\.whatsapp\.com\/send/.test(acilan), 'WhatsApp açılmadı: ' + acilan);
    dogrula(await p.evaluate((k) => !!ozdDers(k).gonderildi, k), 'gönderildi işaretlenmedi');

    // 390 px
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    const tas = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    dogrula(tas <= 1, '390 px\'te yatay taşma: ' + tas);
    dogrula(hatalar.length === 0, 'sayfa hataları: ' + hatalar.join(' | '));
    log(`öğrenci ${ad} · hızlı puan · gelişim ▲ · oyun (kale) hareket modu, okçuluk kaydı ${seri0} → ${seri0} · geri al · dönüş · veli WhatsApp · 390 px`);
  } finally {
    try {
      await p.evaluate(async (y) => {
        const kon = _kmAktifKonum;
        if (y.konum) localStorage.setItem('dag_km_konum', y.konum); else localStorage.removeItem('dag_km_konum');
        if (y.depo) localStorage.setItem('dag_ozel_ders', y.depo); else localStorage.removeItem('dag_ozel_ders');
        // test konumunu paylaşılan konum listesinden çıkar
        const l = await _kmKonumlariGetir(); await _kmKonumlariKaydet(l.filter((x) => String(x.id).indexOf('ozel_') !== 0));
      }, yedek);
    } catch (e) { }
    await ctx.close();
  }
}
