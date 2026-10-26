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
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()), dev: localStorage.getItem('dag_yz_dev_sayac'), boy: localStorage.getItem('dag_yz_dev_boy'), hs: localStorage.getItem('dag_yz_hs_acik') }));
    await p.evaluate(() => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif && !turnuvaDB[g][ad].donduruldu) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 10); localStorage.removeItem('dag_yz_hs_acik'); localStorage.removeItem(kmHatAnahtari()); localStorage.removeItem(yzAnahtar()); localStorage.setItem('dag_yz_dev_sayac', '0'); localStorage.removeItem('dag_yz_dev_boy'); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz(); yzKurAyar('kayit', false);
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
    // geri sayım (büyük sayaç KAPALI): tablo gizlenir, şerit kalan alanı kaplar → yakın çekim (v322)
    await p.evaluate(() => { _yz.devGizle = null; yzSayacBaslat(); });
    await p.waitForFunction(() => document.getElementById('yz-tv').classList.contains('hs-sayac') && document.querySelector('#yz-tv-serit.sayac'), null, { timeout: 5000 });
    await p.waitForTimeout(900);
    const say = await p.evaluate(() => { let a = document.querySelector('#yz-tv-serit .yzhs-a-ana'), h = a && a.querySelector('.yzhs-a-hedef .yzhs-kare'); return { tablo: getComputedStyle(document.querySelector('#yz-tv .yz-tv-tablo')).display, h: document.getElementById('yz-tv-serit').offsetHeight, ekran: innerHeight, k: a && a.getAttribute('data-k'), hedefH: h ? h.offsetHeight : 0, ucus: a ? a.querySelectorAll('.yzhs-ucus').length : 0, film: document.querySelectorAll('#yz-tv-serit .yzhs-f').length, filmAktif: document.querySelectorAll('#yz-tv-serit .yzhs-f.aktif').length, kutu: a ? a.querySelectorAll('.yzhs-kutu').length : 0, sag: a ? a.getBoundingClientRect().right : 0 }; });
    dogrula(say.tablo === 'none' && say.h > say.ekran * 0.45 && say.k && say.hedefH > say.ekran * 0.3 && say.ucus >= 1 && say.film >= 3 && say.filmAktif === 1 && say.kutu === 3 && say.sag <= 1600, 'geri sayımda yakın çekim: ' + JSON.stringify(say));
    await p.waitForTimeout(3200);
    dogrula(await p.evaluate(() => !!document.querySelector('#yz-tv-serit .yzhs-a-ana .yzhs-kare.isi')), 'yakın çekimde ısı haritası yayılmalı');
    await p.screenshot({ path: 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/8cce1594-4a72-48c2-b738-81e8bb994514/scratchpad/hs-yakin.png' }).catch(() => {});
    // aynı sporcu ekrandayken başka kayıt gelirse büyük kart yeniden çizilmez (animasyon baştan başlamaz)
    const ayni = await p.evaluate(() => { let a = document.querySelector('#yz-tv-serit .yzhs-a-hedef'); yzTvCiz(); return a === document.querySelector('#yz-tv-serit .yzhs-a-hedef'); });
    dogrula(ayni, 'yeniden çizimde yakın çekim korunmalı');
    await p.evaluate(() => { yzSayacDurdur(); });
    await p.waitForFunction(() => !document.getElementById('yz-tv').classList.contains('hs-sayac') && document.querySelector('#yz-tv-serit.acik'), null, { timeout: 5000 });
    // ⛶ büyük sayaçla: şerit sayacın altındaki yarıyı kaplar, başlıktaki küçük sayaç gizli
    await p.evaluate(() => { localStorage.setItem('dag_yz_dev_sayac', '1'); _yz.devGizle = null; yzSayacBaslat(); });
    await p.waitForFunction(() => document.documentElement.classList.contains('yz-dev-acik') && document.getElementById('yz-dev-sayac') && document.getElementById('yz-tv').classList.contains('hs-sayac'), null, { timeout: 5000 });
    await p.waitForTimeout(900);
    const buyuk = await p.evaluate(() => ({ tablo: getComputedStyle(document.querySelector('#yz-tv .yz-tv-tablo')).display, kucukSayac: getComputedStyle(document.getElementById('yz-tv-sayac')).display, h: document.getElementById('yz-tv-serit').offsetHeight, ekran: innerHeight }));
    await p.screenshot({ path: 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/acda31fc-ee77-42e4-bdbc-66748f4e0583/scratchpad/hs-buyuk.png' }).catch(() => {});
    dogrula(buyuk.tablo === 'none' && buyuk.kucukSayac === 'none' && buyuk.h > buyuk.ekran * 0.25, 'büyük sayaçta şerit: ' + JSON.stringify(buyuk));
    // sayaç boyu: Küçük / Orta (varsayılan) / Büyük
    const boy = async (b) => { if (b) await p.locator('#yz-dev-sayac .yz-dev-boy button[data-b="' + b + '"]').click(); await p.waitForTimeout(800); return p.evaluate(() => ({ dev: document.getElementById('yz-dev-sayac').offsetHeight, serit: document.getElementById('yz-tv-serit').offsetHeight, ekran: innerHeight, secili: (document.querySelector('#yz-dev-sayac .yz-dev-boy .secili') || {}).textContent, sure: document.querySelector('.yz-dev-sure').getBoundingClientRect().toJSON(), devR: document.getElementById('yz-dev-sayac').getBoundingClientRect().bottom })); };
    const orta = await boy(null);
    dogrula(orta.secili === 'Orta' && Math.abs(orta.dev - orta.ekran * 0.5) < 6, 'varsayılan Orta: ' + JSON.stringify(orta));
    const bb = await boy('buyuk');
    await p.screenshot({ path: 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/8cce1594-4a72-48c2-b738-81e8bb994514/scratchpad/hs-buyuk-boy.png' }).catch(() => {});
    dogrula(bb.secili === 'Büyük' && bb.dev > bb.ekran * 0.6 && bb.serit > 60 && bb.sure.bottom <= bb.devR + 2, 'Büyük boy: ' + JSON.stringify(bb));
    const kk = await boy('kucuk');
    await p.screenshot({ path: 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/8cce1594-4a72-48c2-b738-81e8bb994514/scratchpad/hs-kucuk-boy.png' }).catch(() => {});
    dogrula(kk.secili === 'Küçük' && kk.dev < kk.ekran * 0.32 && kk.serit > kk.ekran * 0.5 && kk.sure.top >= -2 && kk.sure.bottom <= kk.devR + 2, 'Küçük boy: ' + JSON.stringify(kk));
    esit(await p.evaluate(() => localStorage.getItem('dag_yz_dev_boy')), 'kucuk', 'boy cihazda hatırlanır');
    dogrula(await p.evaluate(() => !!document.querySelector('#yz-dev-sayac:not(.kucul)') && document.documentElement.classList.contains('yz-dev-acik')), 'boy seçmek sayacı küçültmemeli');
    await boy('orta');
    await p.evaluate(() => { yzSayacDurdur(); yzDevSayacGuncelle(yzOku()); });
    await p.waitForTimeout(1500);
    dogrula(await p.evaluate(() => getComputedStyle(document.querySelector('#yz-tv .yz-tv-tablo')).display !== 'none'), 'sayaç bitince tablo geri gelmeli');
    // ☕ mola (büyük sayaç ayarı KAPALIYKEN de): büyük geri sayım, altında hedefler slayt gibi döner
    await p.evaluate(() => { localStorage.setItem('dag_yz_dev_sayac', '0'); });
    await p.locator('#yz-tv .yz-mola-btn').click();
    await p.locator('#onay-modal button.yz-cip[onclick="yzMolaBaslat(5)"]').click();
    await p.waitForFunction(() => document.querySelector('#yz-dev-sayac.mola') && document.getElementById('yz-tv').classList.contains('hs-sayac') && document.querySelector('#yz-tv-serit .yzhs-a-ana'), null, { timeout: 5000 });
    const mola = await p.evaluate(() => ({ sure: document.querySelector('#yz-dev-sayac .yz-dev-sure').textContent, faz: document.querySelector('#yz-dev-sayac .yz-dev-faz').textContent, btn: document.querySelector('#yz-tv .yz-mola-btn').textContent, modal: getComputedStyle(document.getElementById('onay-modal')).display, k: document.querySelector('#yz-tv-serit .yzhs-a-ana').getAttribute('data-k') }));
    dogrula(/^[45]:\d\d$/.test(mola.sure) && mola.faz.includes('MOLA') && /☕ [45]:\d\d/.test(mola.btn) && mola.modal === 'none', 'mola sayacı: ' + JSON.stringify(mola));
    await p.waitForTimeout(3000);
    await p.screenshot({ path: 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/8cce1594-4a72-48c2-b738-81e8bb994514/scratchpad/hs-mola.png' }).catch(() => {});
    await p.waitForFunction((k) => { let a = document.querySelector('#yz-tv-serit .yzhs-a-ana'); return a && a.getAttribute('data-k') !== k; }, mola.k, { timeout: 8000 });
    // süre başlatınca mola biter
    await p.evaluate(() => { yzSayacBaslat(); });
    esit(await p.evaluate(() => yzOku().mola), null, 'süre başlayınca mola silinir');
    await p.evaluate(() => { yzSayacDurdur(); yzDevSayacGuncelle(yzOku()); });
    await p.waitForFunction(() => !document.querySelector('#yz-dev-sayac:not(.kucul)') && !document.getElementById('yz-tv').classList.contains('hs-sayac'), null, { timeout: 5000 });
    // Kapat → yine ince çubuk
    await p.locator('#yz-tv-serit .yzhs-tut').click();
    await p.waitForSelector('#yz-tv #yz-tv-serit.kapali', { timeout: 5000 });
    esit(await p.evaluate(() => localStorage.getItem('dag_yz_hs_acik')), '0', 'kapalı tercih hatırlanır');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kapalı çubuk + 10 satır, aç/kapat, ısı haritası, dönen ışık, +56, yakın çekim, sayaç boyu K/O/B, ☕ mola + dönen slayt tamam');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzSayacDurdur(); yzMolaBitir(); } catch (e) {} try { yzTvKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); _kmListe = JSON.parse(y.liste); if (y.hat) localStorage.setItem(kmHatAnahtari(), y.hat); else localStorage.removeItem(kmHatAnahtari()); if (y.dev) localStorage.setItem('dag_yz_dev_sayac', y.dev); else localStorage.removeItem('dag_yz_dev_sayac'); if (y.boy) localStorage.setItem('dag_yz_dev_boy', y.boy); else localStorage.removeItem('dag_yz_dev_boy'); if (y.hs) localStorage.setItem('dag_yz_hs_acik', y.hs); else localStorage.removeItem('dag_yz_hs_acik'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
