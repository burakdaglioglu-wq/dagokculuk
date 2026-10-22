// 🎯 TV hedef şeridi (2026-10-22, kullanıcı taslaktan "2 · Hedef şeridi"ni seçti): tablonun altında herkesin hedef kâğıdı (ok
// konumları + ısı haritası), ışık sporcudan sporcuya döner, yeni skor gelince o sporcuya atlar ve "+puan" uçar; ⛶ büyük sayaç
// açıkken tablo gizlenir, şerit sayacın altındaki yarıyı kaplar. Tur kayda işlemez (kayit=false), eski tur geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1600, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()), dev: localStorage.getItem('dag_yz_dev_sayac') }));
    await p.evaluate(() => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif && !turnuvaDB[g][ad].donduruldu) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 5); localStorage.removeItem(kmHatAnahtari()); localStorage.removeItem(yzAnahtar()); localStorage.setItem('dag_yz_dev_sayac', '0'); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz(); yzKurAyar('kayit', false);
    });
    await p.locator('button:has-text("Turu başlat")').click(); await p.waitForTimeout(400);
    // 1. seri: ilk 4 sporcu konumlu (hedefe dokunarak), 5. yalnız puanla
    await p.evaluate(() => {
      let o = yzOku(); yzHedefSirasi(o).forEach((k, i) => {
        yzGirisAc(yzEnc(k), 0);
        for (let j = 0; j < 6; j++) { let x = (j % 3 - 1) * 0.12 + i * 0.05, y = (Math.floor(j / 3) - 0.5) * 0.15; let pu = yzKonumPuan(x, y, yzYuz(o.durum), false); yzOkEkle(pu, i < 4 ? { x, y, n: j + 1 } : null); }
        _yz.siradaki = false; yzGirisKaydet();
      });
      yzSonrakiSeri(true);
    });
    await p.locator('.yz-tur-btn button:has-text("TV ekranı")').click();
    await p.waitForSelector('#yz-tv #yz-tv-serit .yzhs-k', { timeout: 15000 });
    const ilk = await p.evaluate(() => ({ kart: document.querySelectorAll('#yz-tv-serit .yzhs-k').length, aktif: document.querySelectorAll('#yz-tv-serit .yzhs-k.aktif').length, konumsuz: document.querySelectorAll('#yz-tv-serit .yzhs-k.konumsuz').length, ok: document.querySelectorAll('#yz-tv-serit .yzhs-k.aktif .yzhs-ok').length, tabloAlti: !!document.querySelector('#yz-tv .yz-tv-tablo + #yz-tv-serit'), tablo: document.querySelector('#yz-tv .yz-tv-tablo').offsetHeight }));
    esit(ilk.kart, 5, 'her sporcuya bir kart');
    esit(ilk.aktif, 1, 'tek aktif kart');
    esit(ilk.konumsuz, 1, 'yalnız puanla giren "yalnız puan" kartı');
    dogrula(ilk.ok >= 1 && ilk.tabloAlti && ilk.tablo > 100, 'şerit tablonun altında, aktif kartta oklar: ' + JSON.stringify(ilk));
    await p.waitForTimeout(2600);
    dogrula(await p.evaluate(() => document.querySelectorAll('#yz-tv-serit .yzhs-kare.isi').length >= 4), 'ısı haritası açılmalı');
    // ışık döner
    const once = await p.evaluate(() => document.querySelector('#yz-tv-serit .yzhs-k.aktif').getAttribute('data-k'));
    await p.waitForTimeout(4800);
    const sonra = await p.evaluate(() => document.querySelector('#yz-tv-serit .yzhs-k.aktif').getAttribute('data-k'));
    dogrula(once !== sonra, 'ışık sıradaki sporcuya geçmeli');
    // yeni skor → ışık o sporcuya, kartta ve satırda +puan
    const hedef = await p.evaluate(() => { let o = yzOku(), sira = yzSiralama(o), k = sira[sira.length - 1].k; let akt = document.querySelector('#yz-tv-serit .yzhs-k.aktif').getAttribute('data-k'); if (akt === k) k = sira[sira.length - 2].k;
      yzGirisAc(yzEnc(k), 1); ['10', '10', '9', '9', '9', '9'].forEach((v, j) => yzOkEkle(v, { x: 0.02 * j, y: -0.03, n: j + 1 })); _yz.siradaki = false; yzGirisKaydet(); try { yzGirisKapat(); } catch (e) {} return k; });
    await p.waitForFunction((k) => { let a = document.querySelector('#yz-tv-serit .yzhs-k.aktif'); return a && a.getAttribute('data-k') === k && a.querySelector('.yzhs-arti'); }, hedef, { timeout: 5000 });
    esit(await p.locator('#yz-tv-serit .yzhs-k.aktif .yzhs-arti').textContent(), '+56', 'kartta yeni seri puanı');
    dogrula(await p.locator('#yz-tv .yz-tv-tablo .yzhs-satir-arti').count() === 1, 'tablodaki satırda +puan uçmalı');
    // ⛶ büyük sayaç: tablo gizli, şerit alt yarıyı kaplar
    await p.evaluate(() => { localStorage.setItem('dag_yz_dev_sayac', '1'); _yz.devGizle = null; yzSayacBaslat(); });
    await p.waitForFunction(() => document.documentElement.classList.contains('yz-dev-acik') && document.getElementById('yz-dev-sayac'), null, { timeout: 5000 });
    await p.waitForTimeout(900);
    const buyuk = await p.evaluate(() => ({ tablo: getComputedStyle(document.querySelector('#yz-tv .yz-tv-tablo')).display, h: document.getElementById('yz-tv-serit').offsetHeight, ekran: innerHeight, aktifG: document.querySelector('#yz-tv-serit .yzhs-k.aktif').offsetWidth, digerG: document.querySelector('#yz-tv-serit .yzhs-k:not(.aktif)').offsetWidth }));
    await p.screenshot({ path: "C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/acda31fc-ee77-42e4-bdbc-66748f4e0583/scratchpad/hs-buyuk.png" });
    dogrula(buyuk.tablo === 'none' && buyuk.h > buyuk.ekran * 0.28 && buyuk.aktifG > buyuk.digerG * 1.5, 'büyük sayaçta şerit büyük, aktif kart iri: ' + JSON.stringify(buyuk));
    await p.evaluate(() => { yzSayacDurdur(); yzDevSayacGuncelle(yzOku()); });
    await p.waitForTimeout(900);
    dogrula(await p.evaluate(() => getComputedStyle(document.querySelector('#yz-tv .yz-tv-tablo')).display !== 'none'), 'sayaç bitince tablo geri gelmeli');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('şerit (konumlu/konumsuz), ısı haritası, dönen ışık, yeni skor +56, büyük sayaçta alt yarı tamam');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzSayacDurdur(); } catch (e) {} try { yzTvKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); _kmListe = JSON.parse(y.liste); if (y.hat) localStorage.setItem(kmHatAnahtari(), y.hat); else localStorage.removeItem(kmHatAnahtari()); if (y.dev) localStorage.setItem('dag_yz_dev_sayac', y.dev); else localStorage.removeItem('dag_yz_dev_sayac'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
