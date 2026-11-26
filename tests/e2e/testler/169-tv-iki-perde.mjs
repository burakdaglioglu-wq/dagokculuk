// 2026-11-26 (v470) Kullanıcı TV taslaklarından B "İki perde"yi seçti: TV yeni varsayılanı (bir kez; Tablo seçmiş olan Tablo'da kalır).
// Süre yokken PUAN perdesi: herkes bir kart (bu serinin puanı, ✓ girdi / bekliyor), sağda son girenin hedefi (okları numaralı) +
// kendi rekoruna göre not. Süre başlayınca ATIŞ perdesi: dev halka sayaç + hedef hedef hattakiler. Seri tamamlanınca "en çok gelişen"
// adı bulanıktan açılır. 24 sporcu sığar. Tablo'ya geçip geri gelinir. Tur kayıt dışı; önceki durum geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1920, yukseklik: 1080 });
  let yedek = null;
  const ekran = async (ad) => { if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-' + ad + '.png' }); };
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), g: localStorage.getItem('dag_yz_tv_gorunum'), v: localStorage.getItem('dag_yz_tv_v470') }));
    // varsayılan bir kez İki perde olur; Tablo seçmiş olan Tablo'da kalır
    const goc = await p.evaluate(() => {
      localStorage.removeItem('dag_yz_tv_v470'); localStorage.setItem('dag_yz_tv_gorunum', 'hatlar'); const a = yzTvGorunum();
      localStorage.removeItem('dag_yz_tv_v470'); localStorage.setItem('dag_yz_tv_gorunum', 'tablo'); const b = yzTvGorunum();
      return a + '/' + b;
    });
    esit(goc, 'perde/tablo', 'v470 geçişi');
    const n = await p.evaluate(() => {
      localStorage.setItem('dag_yz_tv_gorunum', 'perde');
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      const l = tum.slice(0, 18); _kmListe = l; localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
      yzKurAyar('kayit', false); yzKurAyar('yuz', '10k'); const t = yzKurulumTaslak(); t.katilimci = l.map((k) => k.g + '|' + k.ad); t.format = yzFormatAnahtar(6, 6); yzCiz(); yzBaslat();
      // 1. seri herkes girdi, 2. seride yarısı (konumlu)
      yzGuncelle((o) => { const d = o.durum; d.seri = 1; d.katilimci.forEach((k, i) => { o[yzSKey(d.id, k)] = i % 2 ? [['8', '7', '7', '6', '5', '5']] : [['8', '7', '7', '6', '5', '5'], ['9', '9', '8', '8', '7', '6']]; }); });
      yzCiz(); return l.length;
    });
    await p.evaluate(() => yzTvAc());
    await p.waitForSelector('#yz-tv .yzp-perde.puan', { timeout: 15000 });
    esit(await p.locator('#yz-tv .yzp-kart').count(), n, 'puan duvarında herkes');
    esit(await p.locator('#yz-tv .yzp-kart.girdi').count(), n / 2, 'yarısı girdi');
    const sigiyor = () => p.evaluate(() => { const d = document.querySelector('.yzp-duvar').getBoundingClientRect(); return [...document.querySelectorAll('.yzp-kart')].every((k) => k.getBoundingClientRect().bottom <= d.bottom + 2); });
    dogrula(await sigiyor(), n + ' sporcu sığmıyor');

    // yeni skor (konumlu) → kart yeşil, sağda o sporcu, 6 ok hedefte
    const k = await p.evaluate(() => { const o = yzOku(), d = o.durum, k = d.katilimci.find((x) => !yzSkor(o, x)[1]); yzGuncelle((x) => { x[yzSKey(d.id, k)] = [['8', '7', '7', '6', '5', '5'], ['X', '10', '10', '9', '9', '8']]; x[yzPKey(d.id, k)] = [null, [{ x: 0.01, y: 0.02, n: 1 }, { x: 0.06, y: -0.04, n: 2 }, { x: -0.07, y: 0.03, n: 3 }, { x: 0.12, y: 0.1, n: 4 }, { x: -0.15, y: -0.12, n: 5 }, { x: 0.2, y: 0.22, n: 6 }]]; }); yzTvCiz(); return k; });
    await p.waitForTimeout(400);
    esit(await p.locator('#yz-tv .yzp-kart.yeni').count(), 1, 'yeni giren kart vurgulanmadı');
    esit((await p.locator('.yzp-spot h3').textContent()).trim(), await p.evaluate((x) => yzKAd(x), k), 'son giren sağda değil');
    esit(await p.locator('.yzp-spot .yzp-pin').count(), 6, '6 ok hedefte');
    esit(await p.locator('.yzp-spot .yzp-top').count(), 6, '6 ok topu');
    await p.waitForTimeout(1200);
    await ekran('1-puan');

    // süre → atış perdesi
    await p.evaluate(() => yzSayacBaslat());
    await p.waitForSelector('#yz-tv .yzp-perde.atis', { timeout: 3000 });
    esit(await p.locator('#yz-tv .yzp-ki').count(), n, 'hatta herkes');
    esit(await p.locator('#yz-tv .yzp-halka #yz-tv-sayac').count(), 1, 'halkada sayaç yok');
    const o1 = await p.locator('.yzp-halka-ilerle').evaluate((e) => e.style.strokeDashoffset || e.getAttribute('stroke-dashoffset'));
    await p.waitForTimeout(1500);
    const o2 = await p.locator('.yzp-halka-ilerle').evaluate((e) => e.style.strokeDashoffset || e.getAttribute('stroke-dashoffset'));
    dogrula(+o2 > +o1, 'halka azalmıyor: ' + o1 + ' → ' + o2);
    await ekran('2-atis');
    await p.evaluate(() => yzSayacDurdur());
    await p.waitForSelector('#yz-tv .yzp-perde.puan', { timeout: 3000 });

    // seri tamam → en çok gelişen bulanıktan açılır
    await p.evaluate(() => { yzGuncelle((o) => { const d = o.durum; d.katilimci.forEach((x, i) => { if (!(o[yzSKey(d.id, x)] || [])[1]) o[yzSKey(d.id, x)] = [['8', '7', '7', '6', '5', '5'], i === 3 ? ['X', 'X', '10', '10', '10', '9'] : ['7', '7', '6', '6', '5', '5']]; }); }); yzTvCiz(); });
    await p.waitForSelector('.yzp-acilis h2.bulanik', { timeout: 3000 });
    await ekran('3-merak');
    await p.waitForSelector('.yzp-acilis h2.acik', { timeout: 4000 });
    const gel = await p.evaluate(() => { const d = yzOku().durum; return yzKAd(d.katilimci[3]); });
    esit((await p.locator('.yzp-acilis h2').textContent()).trim(), gel, 'en çok gelişen yanlış');
    await ekran('4-acildi');

    // Tablo'ya geç, Tema penceresinden İki perde'ye dön
    await p.evaluate(() => yzTvGorunumSec('tablo')); await p.waitForTimeout(500);
    dogrula(await p.locator('#yz-tv .yz-tv-tablo').count() === 1 && !(await p.locator('#yz-tv .yzp-tv').count()), "Tablo'ya geçmedi");
    dogrula(await p.locator('#yz-tv button', { hasText: '🎬 Perde' }).count() >= 1, "Tablo'da Perde düğmesi yok");
    await p.evaluate(() => yzAnaTemaAc()); await p.waitForTimeout(200);
    await p.locator('#onay-modal button', { hasText: 'İki perde' }).click(); await p.waitForTimeout(600);
    dogrula(await p.locator('#yz-tv .yzp-tv').count() === 1, "Tema'dan İki perde'ye dönmedi");

    // 24 sporcu sığar
    await p.evaluate(() => { const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push(g + '|' + ad); })); yzGuncelle((o) => { const d = o.durum; tum.slice(0, 24).forEach((x, i) => { if (d.katilimci.indexOf(x) === -1) { d.katilimci.push(x); d.hedefler[x] = (7 + Math.floor(i / 4)) + 'A'; } }); }); yzTvCiz(); });
    await p.waitForTimeout(500);
    const n24 = await p.locator('#yz-tv .yzp-kart').count();
    dogrula(n24 >= 20, 'yeterli sporcu yok: ' + n24);
    dogrula(await sigiyor(), n24 + ' sporcu sığmıyor');
    await ekran('5-24');
    await p.evaluate(() => yzTvKapat());
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🎬 iki perde: varsayılan (tablo korunur) · puan duvarı ' + n + ' · son giren hedefte 6 ok · süre → atış perdesi, halka azalır · seri tamam → en çok gelişen açılır · Tablo ⇄ Perde · ' + n24 + ' sporcu sığar');
  } finally {
    if (yedek) await p.evaluate((y) => { const w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); }; try { yzSayacDurdur(); yzTvKapat(); } catch (e) {} w(yzAnahtar(), y.yz); w('dag_yz_tv_gorunum', y.g); w('dag_yz_tv_v470', y.v || '1'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
