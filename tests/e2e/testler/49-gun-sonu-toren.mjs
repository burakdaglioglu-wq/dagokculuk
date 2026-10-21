// 🏅 Gün sonu madalya töreni (2026-10-21): bugünün serileri (sunucu) → kategoriler (en iyi ortalama, gelişen, emekçi, rekor,
// oyun) → 3B/2B tören açılır; Kapanış / Ders Sonu Özeti kutusu. Bugünün serileri sahte sunucu yanıtıyla verilir (gerçek veri yazılmaz).
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 800 });
  try {
    await uygulamaAc(p);
    const kisiler = await p.evaluate(() => { let l = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif && yonKisiTuru(g, ad) === 'sporcu' && l.length < 4) l.push({ g, ad }); })); return l; });
    esit(kisiler.length, 4, 'test için 4 sporcu');
    const bugun = await p.evaluate(() => bugunISO());
    const seri = (k, puan, n, i) => ({ seriId: 'e2e-gs-' + i, grup: k.g, ad: k.ad, oklar: Array(n).fill(String(Math.round(puan / n))), puan, tarih: bugun, t: Date.now() - 60000 * i, iptal: false });
    const sahte = [];
    [[30, 28, 29, 30], [20, 22, 21], [25, 26, 24, 25, 23, 27], [27]].forEach((l, ki) => l.forEach((pu, j) => sahte.push(seri(kisiler[ki], pu, 3, ki * 10 + j))));
    await p.route('**/api/series?tarih=*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ series: sahte }) }));
    const v = await p.evaluate(async () => { let v = await gunSonuTorenVeri(); return v && v.sahne.map((s) => ({ ad: s.ad, liste: s.liste.map((x) => x.ad + '|' + x.alt) })); });
    dogrula(v && v.length >= 2, 'kategori yok: ' + JSON.stringify(v));
    const ort = v.find((s) => /ORTALAMA/.test(s.ad)), emek = v.find((s) => /EMEKÇİ/.test(s.ad));
    dogrula(ort && ort.liste[0].startsWith(kisiler[0].ad + '|'), 'en iyi ortalama 1. yanlış: ' + JSON.stringify(ort));
    esit(ort.liste.length, 3, 'ortalamada en az 3 seri şartı (4. sporcu 1 seri)');
    dogrula(emek && emek.liste[0].startsWith(kisiler[2].ad + '|') && /18 ok/.test(emek.liste[0]), 'emekçi yanlış: ' + JSON.stringify(emek));
    // tören açılır, ilk kategori adı görünür, kapanır
    await p.evaluate(() => gunSonuTorenBaslat());
    await p.waitForSelector('#yz-toren', { timeout: 20000 });
    await p.waitForFunction(() => /GÜN SONU/.test((document.querySelector('#yz-toren .yz-tor-baslik') || {}).textContent || ''), null, { timeout: 10000 });
    await p.evaluate(() => { try { yzTorenBitir(); } catch (e) {} if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); });
    dogrula(!(await p.locator('#yz-toren').count()), 'tören kapanmadı');
    // Kapanış / Özet kutusu
    dogrula(await p.evaluate(() => /Töreni başlat/.test(gunSonuTorenKutuHTML())), 'tören kutusu yok');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kategoriler: ' + v.map((s) => s.ad).join(', '));
  } finally {
    await ctx.close();
  }
}
