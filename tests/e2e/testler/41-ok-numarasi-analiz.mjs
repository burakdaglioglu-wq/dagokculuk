// Yarışma › 🔢 Ok numarası (2026-10-20, kullanıcı: "ok yönleri çok önemli; diğer önemli olan hangi okun nereye gittiği — analizini
// tut"). Giriş sırası = ok numarası; kayıtta oklar büyükten küçüğe sıralansa da her okun numarası saklanır, düzeltmede numara
// sırasına geri dizilir, silinen okun yerine yeni ok aynı numaraya oturur. 📊 Sporcu Analizi'nde 🔢 Ok numaraları (harita, tablo,
// sorunlu ok uyarısı) ve 🧭 Yön eğilimi (seri seri kayma). 3 numaralı ok hep sağa gidiyor → uyarı çıkmalı. Tur kayıt dışı.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), mod: localStorage.getItem('dag_yz_girismod') }));
    await p.evaluate(() => {
      localStorage.removeItem(yzAnahtar()); localStorage.setItem('dag_yz_yon_v1', '1'); localStorage.setItem('dag_yz_girismod', 'tus');
      if (yzRoster().length < 2) { _kmListe = Object.keys(turnuvaDB.buyukler || {}).slice(0, 3).map((ad) => ({ g: 'buyukler', ad })); }
      _yz.kurulum = null; yzModAyarla('siralama'); yzKurAyar('kayit', false); yzKurAyar('yuz', '6');
      let t = yzKurulumTaslak(); t.katilimci = yzRoster().slice(0, 2).map((k) => k.g + '|' + k.ad); yzKurSeriOk('ok', 3); yzBaslat();
    });
    await p.waitForTimeout(300);
    const k0 = await p.evaluate(() => yzOku().durum.katilimci[0]);
    // 4 seri: ok 1 ve 2 merkeze yakın, ok 3 hep sağa (x≈0.55) — 3 numaralı ok "sorunlu" olmalı
    await p.evaluate((k) => {
      let i = k.indexOf('|'); turnuvaDB[k.slice(0, i)][k.slice(i + 1)].yay = 'Klasik';
      for (let s = 0; s < 4; s++) {
        if (s) yzGuncelle((o) => { o.durum.seri = s; });
        yzGirisAc(yzEnc(k), s);
        yzOkEkle('9', { x: -0.05 + s * 0.02, y: 0.1 }); yzOkEkle('10', { x: 0.04, y: -0.05 }); yzOkEkle('7', { x: 0.55, y: 0.02 * s });
        yzGirisKaydet(); yzGirisKapat();
      }
    }, k0);
    const kay = await p.evaluate((k) => { let o = yzOku(); return { skor: yzSkor(o, k)[0].join(','), no: o[yzPKey(o.durum.id, k)][0].map((c) => c.n).join(',') }; }, k0);
    esit(kay.skor, '10,9,7', 'kayıtta oklar büyükten küçüğe');
    esit(kay.no, '2,1,3', 'her okun numarası saklanmalı');
    // düzeltmede numara sırasına dizilir; 2. oku silip yeniden girince yine 2 numara olur
    const duz = await p.evaluate((k) => { yzGirisAc(yzEnc(k), 0); let a = _yz.giris.oklar.join(','); yzOkSilNo(1); yzOkEkle('8', { x: 0.3, y: 0 }); let b = _yz.giris.oklar.join(','); yzGirisKapat(); return { a, b }; }, k0);
    esit(duz.a, '9,10,7', 'düzeltmede ok 1, ok 2, ok 3 sırası');
    esit(duz.b, '9,8,7', 'silinen okun yerine yeni ok aynı numaraya oturmalı');
    dogrula(await p.evaluate(() => { yzGirisAc(yzEnc(yzOku().durum.katilimci[0]), 0); let n = document.querySelectorAll('#yz-giris .yz-ok-no').length; yzGirisKapat(); return n === 3; }), 'slotlarda "Ok 1-3" etiketi yok');
    // analiz
    await p.evaluate((k) => yzAnalizAc(encodeURIComponent(k)), k0);
    await p.waitForFunction(() => document.querySelector('#yza .yza-okno-tablo'), null, { timeout: 20000 });
    await p.evaluate(() => yzaKapsam('bu')); await p.waitForTimeout(200);
    const an = await p.evaluate(() => ({ satir: document.querySelectorAll('#yza .yza-okno-tablo tbody tr').length, metin: document.querySelector('#yza .yza-detay').textContent }));
    esit(an.satir, 3, 'ok tablosunda 3 ok');
    dogrula(/3 numaralı ok/.test(an.metin) && /sağ/.test(an.metin), 'sorunlu ok uyarısı çıkmadı: ' + an.metin.slice(0, 400));
    dogrula(!/1 numaralı ok/.test(an.metin), 'sağlam 1 numaralı ok sorunlu gösterilmemeli');
    dogrula(/Yön eğilimi/.test(an.metin), 'yön eğilimi bölümü yok');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-okno.png', fullPage: false });
    await p.evaluate(() => yzaKapat());
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🔢 ok numarası: kayıt/düzeltme/yer tutma, analiz tablosu, sorunlu ok uyarısı, yön eğilimi ✓');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzGirisKapat(); yzaKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); if (y.mod) localStorage.setItem('dag_yz_girismod', y.mod); }, yedek).catch(() => {});
    await ctx.close();
  }
}
