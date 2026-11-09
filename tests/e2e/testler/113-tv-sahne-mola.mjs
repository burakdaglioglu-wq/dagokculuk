// ☕ TV Sahne'de mola analizi (2026-11-09, v398; kullanıcı: "molada sporcular dönmüyor; bütün okların sıcak analizi, merak ettirsin" —
// "Tablo kısmında yapmışsın ama Sahne kısmında yapmamışsın"). Mola başlayınca sahne: sınıfın ısı haritası → 🥁 ödül kartı (ad 2,4 sn
// bulanık) → kişisel ısı haritaları, sırayla döner; sayaç "SÜRE BİTTİ" değil ☕ MOLA gösterir. Tur kayda işlemez, eski tur geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1600, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()), dev: localStorage.getItem('dag_yz_dev_sayac'), gor: localStorage.getItem('dag_yz_tv_gorunum') }));
    await p.evaluate(() => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif && !turnuvaDB[g][ad].donduruldu) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 5); localStorage.removeItem(kmHatAnahtari()); localStorage.removeItem(yzAnahtar()); localStorage.removeItem('dag_yz_tv_gorunum'); localStorage.setItem('dag_yz_dev_sayac', '0');
      _yz.kurulum = null; yzModAyarla('siralama'); yzCiz(); yzKurAyar('kayit', false);
    });
    await p.locator('button:has-text("Turu başlat")').click(); await p.waitForTimeout(400);
    // 4 seri: her sporcunun okları kendine özgü bir yöne kümelenir (ısı haritası farklı görünsün)
    await p.evaluate(() => {
      let o = yzOku(), yuz = yzYuz(o.durum), kay = [[0.05, -0.05], [0.35, -0.3], [-0.3, 0.25], [0.1, 0.4], [-0.45, -0.1]];
      for (let s = 0; s < 4; s++) {
        o = yzOku(); yzHedefSirasi(o).forEach((k, i) => {
          yzGirisAc(yzEnc(k), s);
          for (let j = 0; j < yzFormat(o.durum).ok; j++) { let x = kay[i][0] + Math.sin(s * 3 + j * 2 + i) * (0.08 + i * 0.03), y = kay[i][1] + Math.cos(s * 2 + j * 3 + i) * (0.08 + i * 0.03); yzOkEkle(yzKonumPuan(x, y, yuz, false), { x, y, n: j + 1 }); }
          _yz.siradaki = false; yzGirisKaydet();
        });
        yzSonrakiSeri(true);
      }
      yzMolaBaslat(5);
    });
    await p.evaluate(() => yzTvAc());
    await p.waitForSelector('#yz-tv.yzs-acik .yzs-mola', { timeout: 15000 });
    await p.waitForTimeout(1800);
    const s1 = await p.evaluate(() => {
      const cv = document.querySelector('#yzs-sahne .yzs-m-isi'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let renk = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 30) renk++;
      return { baslik: document.querySelector('.yzs-m-baslik').textContent, renk, sayac: document.querySelector('#yz-tv-sayac .yz-sayac-alt').textContent, sayacSinif: document.getElementById('yz-tv-sayac').className, bek: document.getElementById('yzs-bek').textContent, n: _yzs.mola.n };
    });
    dogrula(/ISI HARİTASI/.test(s1.baslik) && s1.renk > 500, 'ilk slayt sınıf ısı haritası: ' + JSON.stringify(s1));
    dogrula(/MOLA/.test(s1.sayac) && /mola/.test(s1.sayacSinif) && /Mola/.test(s1.bek), 'sayaç/alt şerit molayı göstermeli: ' + JSON.stringify(s1));
    dogrula(s1.n >= 5 + 3, 'slayt sayısı (sınıf + ödüller + 5 kişi): ' + s1.n);
    await p.screenshot({ path: 'tests/e2e/_cikti/113-sinif.png' });
    // sıradaki slayt: 🥁 ödül (ad önce bulanık, sonra açılır)
    await p.evaluate(() => { _yzs.mola.t -= 60000; }); await p.waitForTimeout(900);
    const s2 = await p.evaluate(() => ({ i: _yzs.mola.i, tip: _yzs.mola.s.tip, baslik: document.querySelector('.yzs-m-baslik').textContent, gizem: !!document.querySelector('.yzs-mola.gizem .yzs-m-davul'), ad: document.querySelector('.yzs-m-ad').textContent }));
    dogrula(s2.i === 1 && s2.tip === 'odul' && s2.gizem && /KİM/.test(s2.baslik) && s2.ad.length > 1, 'ödül slaytı: ' + JSON.stringify(s2));
    await p.screenshot({ path: 'tests/e2e/_cikti/113-odul-gizem.png' });
    await p.waitForTimeout(3600);
    await p.screenshot({ path: 'tests/e2e/_cikti/113-odul-acik.png' });
    // kişisel slayt
    await p.evaluate(() => { _yzs.mola.t -= 60000; }); await p.waitForTimeout(900);
    const s3 = await p.evaluate(() => ({ tip: _yzs.mola.s.tip, bar: document.querySelectorAll('.yzs-m-bar i').length, yon: !!document.querySelector('.yzs-m-yon') }));
    dogrula(s3.tip === 'kisi' && s3.bar === 4 && s3.yon, 'kişisel analiz: ' + JSON.stringify(s3));
    await p.waitForTimeout(1500);
    await p.screenshot({ path: 'tests/e2e/_cikti/113-kisi.png' });
    // mola bitince normal sahne geri gelir
    await p.evaluate(() => yzMolaBitir()); await p.waitForTimeout(1200);
    dogrula(await p.evaluate(() => !document.querySelector('#yzs-sahne .yzs-mola') && !!document.querySelector('#yzs-sahne .yzs-hedef')), 'mola bitince sahne normale dönmeli');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('sınıf ısı haritası → 🥁 ödül (bulanık → açık) → kişisel analiz döner · sayaç ☕ MOLA · mola bitince sahne normale');
  } finally {
    if (yedek) await p.evaluate((y) => {
      try { yzMolaBitir(); } catch (e) { } try { yzTvKapat(); } catch (e) { }
      const w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); };
      w(yzAnahtar(), y.yz); w(kmHatAnahtari(), y.hat); w('dag_yz_dev_sayac', y.dev); w('dag_yz_tv_gorunum', y.gor); _kmListe = JSON.parse(y.liste);
    }, yedek).catch(() => {});
    await p.waitForTimeout(1200);
    await p.waitForFunction(() => { const d = typeof kmOrtakDurum === 'function' ? kmOrtakDurum() : null; return !d || d.bekleyen === 0; }, null, { timeout: 15000 }).catch(() => {});
    await ctx.close();
  }
}
