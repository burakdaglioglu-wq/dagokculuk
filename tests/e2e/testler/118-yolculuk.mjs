// Karışık Sınıf › Oyunlar › 🗺️ Sınıf Yolculuğu (v404, 2026-11-12). Her iyi ok (çocuğun kendi seviyesine göre) sınıfı haritada ilerletir; bütün oyunlarda
// aynı sayaç. Ders başı kartı, gerçek seri → sayaç, durak geçince kutlama + herkesin adı, geri al, ıska saymaz, oyun değişince sayaç kalır, 12 saat sıfırlamasına girmez, 390 px.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  let yedek = null;
  const anahtar = () => p.evaluate(() => 'dag_yolculuk_' + (_kmAktifKonum || 'varsayilan'));
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const n = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 4); localStorage.removeItem('dag_yolculuk_' + (_kmAktifKonum || 'varsayilan')); localStorage.setItem('dag_yolculuk_ders_basi', '1'); localStorage.removeItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan'));
      kmOyunTemaSec('zombi'); return _kmListe.length;
    });
    dogrula(n >= 3, 'en az 3 sporcu gerekli');
    // ekranı baştan çiz (ders başı kartı yeni durumla gelsin)
    await p.evaluate(() => { const el = document.getElementById('yk-ortu'); if (el) el.remove(); kmSekme('oyunlar'); });
    await p.waitForSelector('#yk-serit .yk-serit-ic', { timeout: 30000 });
    // 1) ders başı kartı
    await p.waitForSelector('#yk-ortu.yk-bas', { timeout: 10000 });
    const bas = await p.locator('#yk-ortu .yk-buyuk').innerText();
    // v414: Zombi açıkken yolculuk zombi şehri — "Köprüde N zombi var!"
    dogrula(/Köprüde \d+ zombi var/.test(bas), 'zombi ders başı cümlesi: ' + bas);
    dogrula(/Zombi Şehri/.test(await p.locator('#yk-ortu .yk-ust').textContent()), 'zombi başlığı');
    dogrula(await p.locator('#yk-ortu svg.yk-harita').count() === 1, 'haritada çizim yok');
    await p.locator('#yk-ortu .yk-btn').click();
    esit(await p.locator('#yk-ortu').count(), 0, 'Başlayalım kartı kapatmalı');
    const st0 = await p.evaluate(() => _ykIc.oku());
    esit(st0.durak, 0, 'başlangıç durağı'); esit(st0.sayac, 0, 'başlangıç sayacı'); dogrula(st0.hedef >= 8, 'hedef en az 8: ' + st0.hedef);
    // aynı gün tekrar açınca kart bir daha çıkmaz
    await p.evaluate(() => kmSekme('oyunlar')); await p.waitForSelector('#yk-serit .yk-serit-ic'); await p.waitForTimeout(400);
    esit(await p.locator('#yk-ortu').count(), 0, 'ders başı kartı günde bir kez');

    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
      for (let j = 0; j < _kmOyunRosterCache.length && !(turnuvaDB[_kmOyunRosterCache[_kmOyunAktifIndex].g] || {})[_kmOyunRosterCache[_kmOyunAktifIndex].ad]; j++) _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length;
      const s = _kmOyunRosterCache[_kmOyunAktifIndex];
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120)); }
      await new Promise((r) => setTimeout(r, 300));
      return { ad: s.ad, st: _ykIc.oku() };
    }, [oklar, hedef]);

    // 2) saf kural: eşik seviyeye göre
    const es = await p.evaluate(() => [_ykIc.esikOf(0), _ykIc.esikOf(6), _ykIc.esikOf(8)]);
    esit(JSON.stringify(es), JSON.stringify([5, 7, 9]), 'seviye eşiği (Zombi ile aynı)');
    // 3) ıska serisi saymaz, utandırmaz (puf yok)
    const r0 = await seri(['M', 'M', 'M']);
    esit(r0.st.sayac, 0, 'ıska serisi saymamalı'); esit(await p.locator('.yk-puf').count(), 0, 'ıska için puf çıkmamalı');
    // 4) gerçek seri sayacı doldurur; hedef küçükken durak geçilir → kutlama + herkesin adı
    await p.evaluate(() => { const st = _ykIc.oku(); st.hedef = 5; st.elle = true; _ykIc.yaz(st); ykCiz(); });
    const r1 = await seri(['X', '10', '9']);
    esit(r1.st.sayac, 3, 'X/10/9 → 3 iyi ok'); esit(r1.st.durak, 0, 'henüz durak geçilmedi');
    dogrula(/Köprüde 2 zombi kaldı/.test(await p.locator('#yk-serit').innerText()), 'zombi şerit yazısı: ' + await p.locator('#yk-serit').innerText());
    const r2 = await seri(['X', '10', '9']);
    esit(r2.st.durak, 1, 'ilk durak geçilmeli'); esit(r2.st.sayac, 0, 'yeni durakta sayaç sıfır'); esit(r2.st.elle, false, 'yeni durakta hedef yeniden hesaplanır');
    await p.waitForSelector('#yk-ortu.yk-basari', { timeout: 6000 });
    const bs = await p.locator('#yk-ortu').innerText();
    dogrula(/Köprüyü temizledik/.test(bs), 'zombi kutlama başlığı: ' + bs.slice(0, 80));
    const adlar = await p.evaluate(() => _kmOyunRosterCache.map((x) => String(x.ad).trim().split(/\s+/)[0]));
    dogrula(adlar.every((a) => bs.includes(a)), 'kutlamada herkesin adı olmalı');
    dogrula(/Sıradaki durak: .*Kule/.test(bs), 'sıradaki durak Kule yazmalı');
    // 5) geri al → durak geri gelir, kutlama kapanır
    const ga = await p.evaluate(async () => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); await new Promise((r) => setTimeout(r, 200)); return { st: _ykIc.oku(), ortu: !!document.getElementById('yk-ortu') }; });
    esit(ga.st.durak, 0, 'geri al durağı geri getirmeli'); esit(ga.st.sayac, 3, 'geri al sayacı geri getirmeli'); esit(ga.ortu, false, 'geri alınca kutlama kapanmalı');
    // 6) oyun değişince aynı sayaç (Hapşırık) ve gene ilerler
    await p.evaluate(() => kmOyunTemaSec('hapsirik')); await p.waitForTimeout(600);
    dogrula(/Ormana 2 iyi ok kaldı/.test(await p.locator('#yk-serit').innerText()), 'oyun değişince sayaç kalmalı, normal harita: ' + await p.locator('#yk-serit').innerText());
    const r3 = await seri(['X', '10', '9']);
    esit(r3.st.durak, 1, 'başka oyunda da ilerlemeli');
    await p.evaluate(() => { const el = document.getElementById('yk-ortu'); if (el) el.remove(); });
    // Zombi'ye dönünce aynı durak zombi şehri olarak: sıradaki Kule
    await p.evaluate(() => kmOyunTemaSec('zombi')); await p.waitForTimeout(600);
    dogrula(/Kulede \d+ zombi kaldı/.test(await p.locator('#yk-serit').innerText()), 'zombiye dönünce Kule: ' + await p.locator('#yk-serit').innerText());
    // 7) 12 saat kuralı yolculuğu silmez
    const k = await anahtar();
    const on2 = await p.evaluate((k) => { localStorage.setItem('dag_km_oyun_son_' + (_kmAktifKonum || 'varsayilan'), String(Date.now() - 13 * 3600000)); try { kmOyunBayatSifirla(); } catch (e) { return 'hata:' + e.message; } return localStorage.getItem(k) ? 'duruyor' : 'silindi'; }, k);
    esit(on2, 'duruyor', '12 saat sıfırlaması yolculuğu silmemeli');
    // 8) harita penceresi: hedef +/−, kapat/aç
    await p.locator('#yk-serit .yk-serit-ic').click(); await p.waitForSelector('#yk-ortu .yk-ayar');
    const h0 = await p.evaluate(() => _ykIc.oku().hedef); await p.locator('#yk-ortu .yk-ayar button').nth(1).click();
    esit(await p.evaluate(() => _ykIc.oku().hedef), h0 + 5, 'hedef artmalı');
    await p.locator('#yk-ortu .yk-alt-btn button:has-text("Yolculuğu")').click();
    dogrula(await p.locator('#yk-serit .yk-kapali').count() === 1, 'kapalıyken küçük aç düğmesi');
    const r4 = await seri(['X', 'X', 'X']); esit(r4.st.sayac, 0, 'kapalıyken saymamalı');
    await p.locator('#yk-serit .yk-kapali').click(); await p.locator('#yk-ortu .yk-alt-btn button:has-text("Yolculuğu")').click();
    dogrula(await p.locator('#yk-serit .yk-serit-ic').count() === 1, 'yeniden açılmalı');
    // 9) 390 px: şerit ve ders başı kartı taşmaz
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    const tel = await p.evaluate(() => { const s = document.getElementById('yk-serit').getBoundingClientRect(); return { sag: s.right <= innerWidth + 1, yuk: s.height, sayfa: document.documentElement.scrollWidth <= innerWidth + 1 }; });
    dogrula(tel.sag && tel.yuk <= 80, '390 px şerit: ' + JSON.stringify(tel));
    await p.evaluate(() => { const st = _ykIc.oku(); st.basGun = ''; _ykIc.yaz(st); ykCiz(); });
    await p.waitForSelector('#yk-ortu.yk-bas');
    const kart = await p.evaluate(() => { const r = document.querySelector('#yk-ortu .yk-kart').getBoundingClientRect(), b = document.querySelector('#yk-ortu .yk-btn').getBoundingClientRect(); return { sigiyor: r.right <= innerWidth + 1 && r.left >= -1, btn: b.bottom <= innerHeight + 1 }; });
    dogrula(kart.sigiyor && kart.btn, '390 px ders başı kartı: ' + JSON.stringify(kart));
    await p.screenshot({ path: 'tests/e2e/_cikti/118-yolculuk-tel.png' }).catch(() => { });
    await p.locator('#yk-ortu .yk-btn').click();
    await p.screenshot({ path: 'tests/e2e/_cikti/118-yolculuk-tel-serit.png' }).catch(() => { });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(n + ' çocuk · ders başı kartı · eşik · ıska saymaz · gerçek seri → durak + kutlama + herkesin adı · geri al · oyun değişince aynı sayaç · 12 saat silmez · hedef ± · kapat/aç · 390 px');
  } finally {
    await p.evaluate((y) => { try { localStorage.removeItem('dag_yolculuk_' + (_kmAktifKonum || 'varsayilan')); localStorage.removeItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan')); if (y) _kmListe = JSON.parse(y); } catch (e) { } }, yedek).catch(() => { });
    await ctx.close();
  }
}
