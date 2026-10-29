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
    // v346: özel ders Karışık Sınıf'la karışmaz — cihazın konumu değişmez, konum listesinde yok, başlık okçuluk değil, kuşak gizli
    const ayri = await p.evaluate(async () => ({ cihaz: localStorage.getItem('dag_km_konum'), liste: (await _kmKonumlariGetir()).some((x) => String(x.id).indexOf('ozel_') === 0), baslik: document.getElementById('km-baslik').textContent, kusak: [...document.querySelectorAll('#karisik-platform .km-sk-kusak')].every((e) => getComputedStyle(e).display === 'none') }));
    esit(ayri.cihaz, yedek.konum, 'özel ders cihazın Karışık Sınıf konumunu değiştirdi'); dogrula(!ayri.liste, 'özel ders konumu Karışık Sınıf listesinde');
    dogrula(/Sporla Gelişiyorum/.test(ayri.baslik), 'başlık hâlâ Karışık Sınıf: ' + ayri.baslik); dogrula(ayri.kusak, 'özel derste okçuluk kuşağı görünüyor');
    await p.locator('#ozd-dok .ozd-cip', { hasText: 'Uçak duruşu' }).click(); await p.waitForTimeout(150);
    await p.evaluate(async () => {
      _kmOyunAktifIndex = 0; _kmOyunSeriGirisleri = ['9', '7', 'X']; _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let i = 0; i < 80 && _kmOyunKilit; i++) await new Promise((r) => setTimeout(r, 150));
    });
    esit(await p.evaluate(([g, ad]) => (turnuvaDB[g][ad].seriler || []).length, [g, ad]), seri0, 'hareket puanı okçuluk kaydına yazıldı');
    d = await p.evaluate((k) => ozdDers(k), k);
    const son = d.kayitlar[d.kayitlar.length - 1];
    esit(son.h, 'ucak', 'oyundaki seri seçili harekete yazılmadı');
    // ⏱️ dinlenme: seri girilince kendiliğinden başlar, büyütülür
    const din = await p.evaluate(() => { const e = document.getElementById('ozd-dinlen'); const a = { var: !!e, kalan: _ozdDin.kalan }; ozdDinBuyut(); a.buyuk = document.getElementById('ozd-dinlen').classList.contains('buyuk'); ozdDinBuyut(); return a; });
    dogrula(din.var && din.kalan > 0 && din.buyuk, 'dinlenme sayacı başlamadı / büyümedi: ' + JSON.stringify(din));
    // v351: elle süre (1:15 → 75 sn) + dinlenirken cümle
    const elle = await p.evaluate(() => { const sn = ozdDinCoz('1:15'); ozdDinSec(sn); const e = document.getElementById('ozd-dinlen'); return { sn, kalan: _ozdDin.kalan, soz: (e.querySelector('.ozd-din-soz') || {}).textContent || '', cip: [...e.querySelectorAll('.ozd-din-cip button')].some((b) => /1:15/.test(b.textContent) && b.classList.contains('aktif')) }; });
    dogrula(elle.sn === 75 && elle.kalan === 75 && elle.soz.length > 5 && elle.cip, 'elle süre / dinlenme cümlesi yok: ' + JSON.stringify(elle));
    // v347: ➕ büyür, başlıktan sürüklenir; yer ve boy saklanır
    const w0 = await p.evaluate(() => { localStorage.removeItem('dag_ozd_dinlenme_yer'); ozdDinCiz(); return document.getElementById('ozd-dinlen').offsetWidth; });
    await p.locator('#ozd-dinlen button[title="Büyüt"]').click(); await p.waitForTimeout(100);
    const w1 = await p.evaluate(() => document.getElementById('ozd-dinlen').offsetWidth); dogrula(w1 > w0, 'büyüt düğmesi boyu artırmadı ' + w0 + ' → ' + w1);
    const bb = await p.locator('#ozd-dinlen .ozd-din-ust b').boundingBox();
    await p.mouse.move(bb.x + 10, bb.y + bb.height / 2); await p.mouse.down(); await p.mouse.move(300, 200, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(100);
    const yer = await p.evaluate(() => ({ r: document.getElementById('ozd-dinlen').getBoundingClientRect().left, a: JSON.parse(localStorage.getItem('dag_ozd_dinlenme_yer') || '{}') }));
    dogrula(yer.r < 400 && yer.a.x != null && yer.a.boy === 2, 'sürükleme / saklama olmadı: ' + JSON.stringify(yer));
    await p.evaluate(() => localStorage.removeItem('dag_ozd_dinlenme_yer'));
    // v348: oyun tam ekrandayken sayaç tam ekranın içinde görünür
    await p.click('#km-oyun-tam-btn'); await p.waitForTimeout(600);
    const tam = await p.evaluate(() => { const fe = document.fullscreenElement, e = document.getElementById('ozd-dinlen'); if (!fe) return { fe: false }; const r = e.getBoundingClientRect(), u = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return { fe: true, icinde: fe.contains(e), gorunur: !!(u && e.contains(u)) }; });
    if (tam.fe) dogrula(tam.icinde && tam.gorunur, 'tam ekranda dinlenme sayacı görünmüyor: ' + JSON.stringify(tam)); else log('(bu tarayıcıda tam ekran açılmadı — tam ekran kontrolü atlandı)');
    await p.evaluate(() => { if (document.fullscreenElement) return document.exitFullscreen(); }); await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => document.getElementById('ozd-dinlen').parentNode === document.body), 'tam ekrandan çıkınca sayaç geri dönmedi');
    // tam ekranda boş yere dokununca küçülür
    await p.evaluate(() => { if (!_ozdDin.buyuk) ozdDinBuyut(); }); await p.mouse.click(40, 860); await p.waitForTimeout(150);
    dogrula(await p.evaluate(() => !_ozdDin.buyuk && !document.getElementById('ozd-dinlen').classList.contains('buyuk')), 'tam ekran sayaç boş yere dokununca küçülmedi'); esit(son.p.join(','), '9,7,X', 'oyundaki seri puanları');
    dogrula(await p.evaluate(() => { const k = JSON.parse(localStorage.getItem('dag_km_kale_' + _kmAktifKonum) || 'null'); return k && k.seri >= 1; }), 'oyun (kale) ilerlemedi');
    await p.waitForTimeout(1500);
    await p.evaluate(() => kmOyunSonGirisiGeriAl()); await p.waitForTimeout(300);
    d = await p.evaluate((k) => ozdDers(k), k);
    dogrula(!d.kayitlar.some((r) => r.id === son.id), 'geri al hareket puanını silmedi');
    esit(await p.evaluate(([g, ad]) => (turnuvaDB[g][ad].seriler || []).length, [g, ad]), seri0, 'geri al okçuluk kaydına dokundu');

    // özel ders sayfasına dön → eski konum
    await p.click('#ozd-km-banner button'); await p.waitForTimeout(500);
    const don = await p.evaluate(() => ({ konum: _kmAktifKonum, km: document.getElementById('karisik-platform').style.display, aktif: document.getElementById('icerik-ozelders').classList.contains('aktif') }));
    esit(don.konum, yedek.konum, 'eski Karışık Sınıf konumu geri gelmedi'); esit(don.km, 'none', 'Karışık Sınıf kapanmadı'); dogrula(await p.evaluate(() => !document.getElementById('ozd-dinlen')), 'dinlenme sayacı özel ders dışında kaldı'); dogrula(don.aktif, 'özel ders sekmesine dönülmedi');

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

    // Karışık Sınıf'a girmek (kmAc) her zaman okçuluk: özel ders modundan çıkar
    await p.evaluate((k) => ozdOyunaGec(k), k); await p.waitForTimeout(400);
    const km = await p.evaluate(() => { kmAc(); return { mod: ozdHareketModu(), konum: _kmAktifKonum, baslik: document.getElementById('km-baslik').textContent }; });
    dogrula(!km.mod && km.konum === yedek.konum && /Karışık Sınıf/.test(km.baslik), 'Karışık Sınıf açılınca özel ders modu sürdü: ' + JSON.stringify(km));
    // v349: okçuluk tarafındaki oyunlarda da dinlenme sayacı var — ayarları ayrı, oto varsayılan kapalı
    await p.waitForTimeout(1500); await p.evaluate(() => { ['karisik-konum-modal', 'karisik-modal'].forEach((id) => { const e = document.getElementById(id); if (e) e.style.display = 'none'; }); kmPlatformGoster(); kmAracSec('oyunlar'); });
    await p.waitForFunction(() => !!document.getElementById('km-oyun-wrap'), null, { timeout: 30000 }); await p.waitForTimeout(1300);
    const okc = await p.evaluate(() => ({ var: !!document.getElementById('ozd-dinlen'), on: ozdDinOn(), oto: ozdDinOto(), serit: !!document.getElementById('ozd-km-banner') }));
    dogrula(okc.var && okc.on === 'dag_km_dinlenme' && okc.oto === false && !okc.serit, 'okçuluk oyunlarında dinlenme sayacı / ayrımı yanlış: ' + JSON.stringify(okc));
    await p.waitForTimeout(1500); // kmAc gerçekten Karışık Sınıf'ı (okçuluk) açar — kapat, özel ders sayfasına dön
    await p.evaluate(() => { ['karisik-platform', 'karisik-konum-modal', 'karisik-modal'].forEach((id) => { const e = document.getElementById(id); if (e) e.style.display = 'none'; }); sekmeAc('ozelders'); }); await p.waitForTimeout(200);

    // veli mesajı
    await p.evaluate((k) => ozdVeliOnizle(k), k); await p.waitForTimeout(300);
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
