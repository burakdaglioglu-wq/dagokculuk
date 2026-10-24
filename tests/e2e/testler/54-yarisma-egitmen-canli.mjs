// 🏆 Eğitmen Yarışma sekmesi + canlı ısı haritası (v309, kullanıcı: "yarışma oldu, sporcular skor girdi ama eğitmen olarak
// görebileceğim yer bulamadım; düşüşleri/yükselişleri görmek istiyorum" + "eğitmene Yarışma sekmesi: ayarlanmış yarışmalar +
// yeni yarışma"; üç taslaktan B · Canlı Isı Haritası). Eğitmen sekmeden yarışma ekler, yarışmaya dokununca herkes × seriler
// tablosu, ± antrenmana göre, Dikkat kutusu (2. yarı düşüşü, girmeyen), seri dökümü; girmeyen sporcu için "✏️ Gir" Skor Gir'i
// yarışma modunda açar, çıkınca sekmeye döner. Test kendi yarışmasını en sonda siler.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yid = null;
  try {
    await uygulamaAc(p);
    await p.evaluate(() => { loggedInSporcu = null; aktifPlatform = 'egitmen'; tablariPlatformaGoreAyarla(); });
    esit(await p.evaluate(() => document.getElementById('tab-yarisma').style.display), '', 'eğitmende Yarışma sekmesi görünmeli');
    await p.evaluate(() => sekmeAc('yarisma'));
    // v312: önce soru ekranı; eğitmende Benim skorum yok, Tüm yarışmalar → yönetim listesi
    await p.waitForSelector('#icerik-yarisma .yrs-acilis .yrs-sec-kart', { timeout: 15000, state: 'attached' });
    dogrula(!/Benim skorum/.test(await p.locator('#icerik-yarisma').textContent()), 'eğitmende Benim skorum olmamalı');
    await p.evaluate(() => yrsAcilisSec('liste'));
    await p.waitForSelector('#icerik-yarisma .yrs-sekme-yonet .yrs-ana-btn', { timeout: 15000, state: 'attached' });
    await p.evaluate(() => { let o = {}; yrsListe().filter((y) => /^TEST/.test(y.ad)).forEach((y) => { o[y.id] = Object.assign({}, y, { sil: true }); }); if (Object.keys(o).length) yrsYaz('yarismalar', o); });
    const sp = await p.evaluate(() => yrsTumSporcular().slice(0, 2));
    dogrula(sp.length === 2, 'iki sporcu yok');
    // ＋ Yeni yarışma (sekmenin içinde, pencere değil)
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-ana-btn').click());
    await p.waitForSelector('#icerik-yarisma .yrs-form', { state: 'attached' });
    yid = await p.evaluate((sp) => { let y = _yrs.duzenle; y.ad = 'TEST Canlı Kupa'; y.tarih = yrsBugun(); y.mesafe = '18m'; y.yuz = '6'; y.ok = 30; y.seriOk = 3; sp.forEach((s) => yrsEkle(s.k)); yrsKaydet(); return y.id; }, sp);
    dogrula(await p.locator('#icerik-yarisma .yrs-yar.bugun', { hasText: 'TEST Canlı Kupa' }).count(), 'bugünkü yarışma listede vurgulu değil');
    // 1. sporcu 10 seri girmiş (2. yarıda düşüş + bir 0'lı seri), 2. sporcu hiç girmemiş
    await p.evaluate(({ yid, sp }) => { let s = [['10', '9', '9'], ['10', '10', '9'], ['9', '9', '9'], ['10', '9', '8'], ['10', '10', '10'], ['7', '6', 'M'], ['6', '6', '5'], ['M', 'M', 'M'], ['7', '6', '5'], ['6', '5', 'M']], o = {}; o[yid + '|' + sp[0].k] = { mac: { seriler: s, kon: [], nis: [], bitti: false, son: Date.now() } }; yrsYaz('yarisma_sporcu', o); }, { yid, sp });
    await p.evaluate((yid) => yrsCanliAc(yid), yid);
    await p.waitForSelector('#icerik-yarisma .yrs-isi', { state: 'attached' });
    const t = await p.evaluate(() => { let e = document.getElementById('icerik-yarisma'), r = [...e.querySelectorAll('.yrs-isi tbody tr')]; return { satir: r.length, hucre: r[0].querySelectorAll('td[title]').length, top: r[0].querySelector('td.top').textContent, gir: r[1].querySelectorAll('.yrs-sen-gir').length, metin: e.textContent, canli: e.querySelectorAll('.yrs-canli-rozet').length, nabiz: e.querySelectorAll('.yrs-nabiz').length }; });
    esit(t.satir, 2, 'ısı haritası satırları');
    esit(t.hucre, 10, '10 seri hücresi');
    dogrula(/^200/.test(t.top), 'toplam 200 olmalı: ' + t.top);
    esit(t.gir, 1, 'girmeyen sporcuda ✏️ Gir');
    dogrula(/2\. yarıda düştü/.test(t.metin) && /hiç vuramadı/.test(t.metin) && /skor girmedi/.test(t.metin), 'Dikkat kutusu eksik');
    dogrula(t.canli >= 1 && t.nabiz === 1, 'CANLI rozeti / şu an atıyor işareti');
    dogrula(/Kulüp seri ortalaması/.test(t.metin), 'kulüp seri ortalaması yok');
    // isme dokun → seri dökümü
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-isi tbody tr td.ad button').click());
    await p.waitForSelector('#icerik-yarisma .yrs-cn-detay .yrs-bar', { state: 'attached' });
    dogrula(/1–5\. SERİ/.test(await p.locator('#icerik-yarisma .yrs-cn-detay').textContent()), 'yarı karşılaştırması yok');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-canli.png', fullPage: true });
    // ✏️ Gir → Skor Gir yarışma modunda, 2. sporcu adına; çıkınca canlı ekrana dönülür
    const eskiGrup = await p.evaluate(() => aktifGrup);
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-sen-gir').click());
    await p.waitForSelector('#skor-grid-paneli-baba #yrs-giris-bant', { timeout: 8000 });
    esit(await p.evaluate((sp) => [secilenSporcu === sp[1].ad, aktifGrup === sp[1].g, aktifHedefTipi, getMaksOk()].join(','), sp), 'true,true,6ring,3', 'Skor Gir yarışma modu (2. sporcu, 6 halka, 3 ok)');
    for (const v of ['9', '8', '7']) { await p.evaluate((v) => hizliOkEkle(v), v); await p.waitForTimeout(40); }
    await p.waitForTimeout(700);
    await p.evaluate(() => skorEkraniniKapat()); await p.waitForTimeout(300);
    await p.waitForSelector('#icerik-yarisma .yrs-isi', { state: 'attached' });
    esit(await p.evaluate(() => aktifGrup), eskiGrup, 'aktif grup geri gelmeli');
    const t2 = await p.evaluate(() => [...document.querySelectorAll('#icerik-yarisma .yrs-isi tbody tr td.top')].map((x) => x.textContent).join('|'));
    dogrula(/^200.*\|24/.test(t2), 'koçun girdiği seri tabloda yok: ' + t2);
    // v313 · antrenman ortalaması normal Skor Gir serilerinden: dün 9 seri × 3 ok eklenince 27 ok daha sayılmalı (yalnız bu sayfanın belleğinde)
    const bk = await p.evaluate(({ yid, sp }) => {
      let s = turnuvaDB[sp[0].g][sp[0].ad], dun = yrsGunEkle(yrsBugun(), -1), y = kyDepoOku('yarismalar')[yid];
      let once = yrsBeklenenBilgi(y, sp[0].k), onceOk = once && /antrenman/.test(once.kaynak) ? once.ok : 0;
      s.seriler = (s.seriler || []).concat(Array.from({ length: 9 }, (_, i) => ({ oklar: ['8', '8', '8'], puan: 24, tarih: dun, t: Date.now() - 864e5 + i, seriId: 'TESTBK' + i })));
      let b = yrsBeklenenBilgi(y, sp[0].k); return b ? [b.ok - onceOk, /antrenman/.test(b.kaynak)].join('|') : null;
    }, { yid, sp });
    esit(bk, '27|true', 'antrenman ortalaması Skor Gir serilerini saymalı (+27 ok)');
    // v313 · 🏅 resmi sonuç: 1. sporcu 205 (uygulamada 200 → fark uyarısı), 2. sporcu 250 · 2. · 🥈
    await p.evaluate((yid) => yrsResmiAc(yid), yid);
    await p.waitForSelector('#icerik-yarisma .yrs-resmi tbody tr', { state: 'attached' });
    await p.evaluate((sp) => { let tr = [...document.querySelectorAll('#icerik-yarisma .yrs-resmi tbody tr')]; let bul = (k) => tr.find((x) => decodeURIComponent(x.dataset.k) === k); let a = bul(sp[0].k), b = bul(sp[1].k); a.querySelector('.r-puan').value = '205'; b.querySelector('.r-puan').value = '250'; b.querySelector('.r-sira').value = '2'; b.querySelector('.r-mad').value = '🥈'; document.querySelector('#icerik-yarisma .yrs-resmi .r-kisi').value = '12'; }, sp);
    await p.evaluate((yid) => yrsResmiKaydet(yid), yid); await p.waitForTimeout(200);
    const rs = await p.evaluate(({ yid, sp }) => { let h = kyDepoOku('yarisma_hedef'), e = document.getElementById('icerik-yarisma'); return { a: JSON.stringify(h[yid + '|' + sp[0].k].resmi), b: JSON.stringify(h[yid + '|' + sp[1].k].resmi), top: [...e.querySelectorAll('.yrs-isi tbody tr td.top')].map((x) => x.textContent).join('|'), dikkat: /resmi puan 205, uygulamaya girilen 200/.test(e.textContent), madalya: /🥈/.test(e.querySelector('.yrs-isi tbody tr').textContent) }; }, { yid, sp });
    dogrula(/"puan":205/.test(rs.a) && /"puan":250,"sira":2,"kisi":12,"madalya":"🥈"/.test(rs.b), 'resmi sonuç kaydı: ' + rs.a + ' ' + rs.b);
    esit(rs.top, '250resmi · ⚠ 24|205resmi · ⚠ 200', 'tabloda resmi puan + uygulama farkı (2. sporcuya eğitmen 1 seri girmişti)');
    dogrula(rs.dikkat && rs.madalya, 'Dikkat farkı / madalya yok');
    // v313 · 📄 rapor görseli + WhatsApp metni
    await p.evaluate((yid) => yrsRaporAc(yid), yid);
    await p.waitForSelector('#yrs-rapor .yrs-rapor-img', { state: 'attached' });
    const rp = await p.evaluate((yid) => ({ h: _yrs.rapor.c.height, w: _yrs.rapor.c.width, metin: yrsRaporMetinYap(kyDepoOku('yarismalar')[yid]) }), yid);
    dogrula(rp.w === 1080 && rp.h > 700, 'rapor boyutu ' + rp.w + 'x' + rp.h);
    dogrula(/TEST Canlı Kupa/.test(rp.metin) && /🥈/.test(rp.metin) && /— 250/.test(rp.metin), 'rapor metni: ' + rp.metin);
    if (process.env.E2E_EKRAN) await p.evaluate(() => { let a = document.createElement('a'); a.id = 'rapor-veri'; a.textContent = _yrs.rapor.c.toDataURL('image/png'); a.style.display = 'none'; document.body.appendChild(a); });
    if (process.env.E2E_EKRAN) { const fs = await import('fs'); fs.writeFileSync(process.env.E2E_EKRAN + '-rapor.png', Buffer.from((await p.locator('#rapor-veri').textContent()).split(',')[1], 'base64')); }
    await p.evaluate(() => yrsRaporKapat());
    // v313 · 📈 sezon karnesi
    dogrula(await p.evaluate((sp) => /Sezon karnesi · 1 yarışma/.test(yrsKarneHTML(sp[1].g, sp[1].ad)) && /250/.test(yrsKarneHTML(sp[1].g, sp[1].ad)), sp), 'sezon karnesi');
    await p.evaluate((sp) => { let s = turnuvaDB[sp[0].g][sp[0].ad]; s.seriler = (s.seriler || []).filter((x) => !String(x.seriId || '').startsWith('TESTBK')); }, sp);
    // v314 · telefon: ısı haritası yerine sporcu kartları + analiz, hiçbir şey yana taşmaz; dokun → döküm kartın altında
    await p.setViewportSize({ width: 375, height: 812 }); await p.evaluate(() => yrsYonetCiz()); await p.waitForTimeout(300);
    const tl = await p.evaluate(() => { let e = document.getElementById('icerik-yarisma'), w = innerWidth, tas = [...e.querySelectorAll('*')].filter((x) => { let b = x.getBoundingClientRect(); return b.width && b.right > w + 1 && !x.closest('.yrs-isi-kap'); }).length; return { kart: e.querySelectorAll('.yrs-sk').length, tablo: e.querySelectorAll('.yrs-isi').length, analiz: e.querySelectorAll('.yrs-sk-analiz div').length, tas }; });
    dogrula(tl.kart === 2 && tl.tablo === 0 && tl.analiz >= 3 && tl.tas === 0, 'telefon kart görünümü: ' + JSON.stringify(tl));
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-sk').click()); await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => { let k = document.querySelector('#icerik-yarisma .yrs-sk.acik'); return !!k && !!k.nextElementSibling && k.nextElementSibling.classList.contains('yrs-cn-detay'); }), 'kart altında seri dökümü açılmalı');
    await p.evaluate(() => yrsCanliSec(null));
    await p.setViewportSize({ width: 1280, height: 900 }); await p.waitForTimeout(300);
    // ← Yarışmalar → liste; ✏️ düzenle açılır
    await p.evaluate(() => [...document.querySelectorAll('#icerik-yarisma .yz-btn')].find((b) => /Yarışmalar/.test(b.textContent)).click());
    await p.waitForSelector('#icerik-yarisma .yrs-yar-duz', { state: 'attached' });
    // 🔴 açılış → Bugün atılanlar: bugünkü yarışmanın ısı haritası gömülü (geri düğmesi yok, Düzenle var); Dün çipi boş
    await p.evaluate(() => yrsAcilisSec(null));
    await p.waitForSelector('#icerik-yarisma .yrs-sec-kart.ana', { state: 'attached' });
    dogrula(/TEST Canlı Kupa/.test(await p.locator('#icerik-yarisma .yrs-sec-kart.ana').textContent()), 'Bugün atılanlar kartında yarışma yok');
    await p.evaluate(() => document.querySelector('#icerik-yarisma .yrs-sec-kart.ana').click());
    await p.waitForSelector('#icerik-yarisma .yrs-gun-blok .yrs-isi', { state: 'attached' });
    const gv = await p.evaluate(() => { let e = document.getElementById('icerik-yarisma'); return { geri: /← Yarışmalar/.test(e.textContent), duz: /Düzenle/.test(e.textContent), cip: e.querySelectorAll('.yrs-gun-cip button').length }; });
    esit([gv.geri, gv.duz, gv.cip].join(','), 'false,true,4', 'gün görünümü');
    await p.evaluate(() => yrsGunSec('hafta'));
    dogrula(await p.locator('#icerik-yarisma .yrs-yar', { hasText: 'TEST Canlı Kupa' }).count(), 'Bu hafta listesinde yarışma yok');
    // 📊 sporcu görünümü (v311): "Yarışma skorları" kartı herkesin ısı haritasını salt okunur açar (Düzenle / Gir yok)
    dogrula(await p.evaluate(() => /TEST Canlı Kupa/.test(yrsSkorKartHTML())), 'sporcu skor kartında bugünkü yarışma yok');
    await p.evaluate((yid) => yrsSonuclarAc(yid), yid);
    await p.waitForSelector('#yrs-yonet.yrs-arka .yrs-isi', { state: 'attached' });
    const ro = await p.evaluate(() => { let k = document.getElementById('yrs-yonet'); return { gir: k.querySelectorAll('.yrs-sen-gir, .yrs-link').length, duz: /Düzenle/.test(k.textContent), satir: k.querySelectorAll('.yrs-isi tbody tr').length }; });
    esit([ro.gir, ro.duz, ro.satir].join(','), '0,false,2', 'salt okunur skor tablosu');
    await p.evaluate(() => yrsYonetKapat());
    esit(await p.evaluate(() => [!!document.getElementById('yrs-yonet'), !!_yrs.salt].join(',')), 'false,false', 'kapatınca salt okunur mod kalkmalı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🏆 eğitmen Yarışma sekmesi: yeni yarışma, canlı ısı haritası, Dikkat, seri dökümü, ✏️ Gir → Skor Gir yarışma modu ✓');
  } finally {
    if (yid) await p.evaluate((yid) => { try { let o = {}; o[yid] = Object.assign({}, kyDepoOku('yarismalar')[yid], { sil: true }); yrsYaz('yarismalar', o); } catch (e) {} }, yid).catch(() => {});
    await p.waitForTimeout(500);
    await ctx.close();
  }
}
