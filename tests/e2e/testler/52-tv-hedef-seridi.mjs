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
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()), dev: localStorage.getItem('dag_yz_dev_sayac'), hs: localStorage.getItem('dag_yz_hs_acik') }));
    await p.evaluate(() => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif && !turnuvaDB[g][ad].donduruldu) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 10); localStorage.removeItem('dag_yz_hs_acik'); localStorage.removeItem(kmHatAnahtari()); localStorage.removeItem(yzAnahtar()); localStorage.setItem('dag_yz_dev_sayac', '0'); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz(); yzKurAyar('kayit', false);
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
    // varsayılan KAPALI: altta ince çubuk, tablo tüm sporcuları sayfalamadan gösterir
    await p.waitForSelector('#yz-tv #yz-tv-serit.kapali .yzhs-tut', { timeout: 15000 });
    const kapali = await p.evaluate(() => ({ kart: document.querySelectorAll('#yz-tv-serit .yzhs-k').length, sayfa: document.querySelectorAll('#yz-tv .yz-tv-sayfa').length, satir: [...document.querySelectorAll('#yz-tv .yz-tv-tablo tbody tr[data-k]')].filter((t) => t.offsetHeight > 0).length, simdi: document.querySelectorAll('#yz-tv .yz-tv-simdi').length, h: document.getElementById('yz-tv-serit').offsetHeight }));
    dogrula(kapali.kart === 0 && kapali.sayfa === 0 && kapali.satir === 10 && kapali.simdi === 0 && kapali.h < 80, 'kapalı şerit + 10 satırın hepsi: ' + JSON.stringify(kapali));
    await p.screenshot({ path: 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/acda31fc-ee77-42e4-bdbc-66748f4e0583/scratchpad/hs-kapali.png' }).catch(() => {});
    // çubuğa dokun → açık
    await p.locator('#yz-tv-serit .yzhs-tut').click();
    await p.waitForSelector('#yz-tv #yz-tv-serit.acik .yzhs-k', { timeout: 5000 });
    const ilk = await p.evaluate(() => ({ kart: document.querySelectorAll('#yz-tv-serit .yzhs-k').length, aktif: document.querySelectorAll('#yz-tv-serit .yzhs-k.aktif').length, konumsuz: document.querySelectorAll('#yz-tv-serit .yzhs-k.konumsuz').length, tabloAlti: !!document.querySelector('#yz-tv .yz-tv-tablo + #yz-tv-serit'), tablo: document.querySelector('#yz-tv .yz-tv-tablo').offsetHeight, ayar: localStorage.getItem('dag_yz_hs_acik') }));
    dogrula(ilk.kart >= 5 && ilk.aktif === 1 && ilk.konumsuz >= 1 && ilk.tabloAlti && ilk.tablo > 100 && ilk.ayar === '1', 'açık şerit: ' + JSON.stringify(ilk));
    await p.waitForTimeout(2600);
    dogrula(await p.evaluate(() => document.querySelectorAll('#yz-tv-serit .yzhs-kare.isi').length >= 1), 'ısı haritası açılmalı');
    // ışık döner
    await p.screenshot({ path: 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/acda31fc-ee77-42e4-bdbc-66748f4e0583/scratchpad/hs-acik.png' }).catch(() => {});
    const once = await p.evaluate(() => document.querySelector('#yz-tv-serit .yzhs-k.aktif').getAttribute('data-k'));
    await p.waitForTimeout(4800);
    const sonra = await p.evaluate(() => document.querySelector('#yz-tv-serit .yzhs-k.aktif').getAttribute('data-k'));
    dogrula(once !== sonra, 'ışık sıradaki sporcuya geçmeli');
    // yeni skor → ışık o sporcuya, kartta ve satırda +puan; son seri sarı, oklar ve grup merkezi aktif kartta
    const hedef = await p.evaluate(() => { let o = yzOku(), sira = yzSiralama(o), k = sira[sira.length - 1].k; let akt = document.querySelector('#yz-tv-serit .yzhs-k.aktif').getAttribute('data-k'); if (akt === k) k = sira[sira.length - 2].k;
      yzGirisAc(yzEnc(k), 1); ['10', '10', '9', '9', '9', '9'].forEach((v, j) => yzOkEkle(v, { x: 0.02 * j, y: -0.03, n: j + 1 })); _yz.siradaki = false; yzGirisKaydet(); try { yzGirisKapat(); } catch (e) {} return k; });
    await p.waitForFunction((k) => { let a = document.querySelector('#yz-tv-serit .yzhs-k.aktif'); return a && a.getAttribute('data-k') === k && a.querySelector('.yzhs-arti'); }, hedef, { timeout: 5000 });
    esit(await p.locator('#yz-tv-serit .yzhs-k.aktif .yzhs-arti').textContent(), '+56', 'kartta yeni seri puanı');
    dogrula(await p.locator('#yz-tv .yz-tv-tablo .yzhs-satir-arti').count() === 1, 'tablodaki satırda +puan uçmalı');
    const akt = await p.evaluate(() => { let a = document.querySelector('#yz-tv-serit .yzhs-k.aktif'); return { son: a.querySelectorAll('.yzhs-ok.son').length, ok: a.querySelectorAll('.yzhs-oklar .yz-ok').length, mrk: a.querySelectorAll('.yzhs-mrk').length }; });
    dogrula(akt.son === 6 && akt.ok === 6 && akt.mrk === 1, 'aktif kart: son seri sarı, 6 ok puanı, grup merkezi: ' + JSON.stringify(akt));
    // geri sayım (büyük sayaç KAPALI): tablo gizlenir, şerit kalan alanı kaplar, aktif kart iri
    await p.evaluate(() => { _yz.devGizle = null; yzSayacBaslat(); });
    await p.waitForFunction(() => document.getElementById('yz-tv').classList.contains('hs-sayac') && document.querySelector('#yz-tv-serit.sayac'), null, { timeout: 5000 });
    await p.waitForTimeout(900);
    const say = await p.evaluate(() => ({ tablo: getComputedStyle(document.querySelector('#yz-tv .yz-tv-tablo')).display, h: document.getElementById('yz-tv-serit').offsetHeight, ekran: innerHeight, aktifG: document.querySelector('#yz-tv-serit .yzhs-k.aktif').offsetWidth, digerG: document.querySelector('#yz-tv-serit .yzhs-k:not(.aktif)').offsetWidth }));
    dogrula(say.tablo === 'none' && say.h > say.ekran * 0.45 && say.aktifG > say.digerG * 1.5, 'geri sayımda şerit büyük: ' + JSON.stringify(say));
    await p.evaluate(() => { yzSayacDurdur(); });
    await p.waitForFunction(() => !document.getElementById('yz-tv').classList.contains('hs-sayac') && document.querySelector('#yz-tv-serit.acik'), null, { timeout: 5000 });
    // ⛶ büyük sayaçla: şerit sayacın altındaki yarıyı kaplar, başlıktaki küçük sayaç gizli
    await p.evaluate(() => { localStorage.setItem('dag_yz_dev_sayac', '1'); _yz.devGizle = null; yzSayacBaslat(); });
    await p.waitForFunction(() => document.documentElement.classList.contains('yz-dev-acik') && document.getElementById('yz-dev-sayac') && document.getElementById('yz-tv').classList.contains('hs-sayac'), null, { timeout: 5000 });
    await p.waitForTimeout(900);
    const buyuk = await p.evaluate(() => ({ tablo: getComputedStyle(document.querySelector('#yz-tv .yz-tv-tablo')).display, kucukSayac: getComputedStyle(document.getElementById('yz-tv-sayac')).display, h: document.getElementById('yz-tv-serit').offsetHeight, ekran: innerHeight }));
    await p.screenshot({ path: 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/acda31fc-ee77-42e4-bdbc-66748f4e0583/scratchpad/hs-buyuk.png' }).catch(() => {});
    dogrula(buyuk.tablo === 'none' && buyuk.kucukSayac === 'none' && buyuk.h > buyuk.ekran * 0.25, 'büyük sayaçta şerit: ' + JSON.stringify(buyuk));
    await p.evaluate(() => { yzSayacDurdur(); yzDevSayacGuncelle(yzOku()); });
    await p.waitForTimeout(1500);
    dogrula(await p.evaluate(() => getComputedStyle(document.querySelector('#yz-tv .yz-tv-tablo')).display !== 'none'), 'sayaç bitince tablo geri gelmeli');
    // Kapat → yine ince çubuk
    await p.locator('#yz-tv-serit .yzhs-tut').click();
    await p.waitForSelector('#yz-tv #yz-tv-serit.kapali', { timeout: 5000 });
    esit(await p.evaluate(() => localStorage.getItem('dag_yz_hs_acik')), '0', 'kapalı tercih hatırlanır');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kapalı çubuk + 10 satır, aç/kapat, ısı haritası, dönen ışık, +56, son seri/oklar/merkez, geri sayımda büyük (sayaçlı/sayaçsız) tamam');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzSayacDurdur(); } catch (e) {} try { yzTvKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); _kmListe = JSON.parse(y.liste); if (y.hat) localStorage.setItem(kmHatAnahtari(), y.hat); else localStorage.removeItem(kmHatAnahtari()); if (y.dev) localStorage.setItem('dag_yz_dev_sayac', y.dev); else localStorage.removeItem('dag_yz_dev_sayac'); if (y.hs) localStorage.setItem('dag_yz_hs_acik', y.hs); else localStorage.removeItem('dag_yz_hs_acik'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
