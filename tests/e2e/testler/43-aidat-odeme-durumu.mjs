// Aidat › 📋 Kim ödedi · kim ödemedi (2026-10-21, kullanıcı: "kim verdi kim vermedi nereden görebilirim, PDF olarak, geçmiş bu ay").
// Ay seçimi (◀ ▶, bu ay / geçen ay), ödeyen/ödemeyen/muaf/henüz kayıtlı değil ayrımı, 6 aylık tablo, iki PDF indirme.
// Kayıtlara dokunmaz: test bellekte geçici aidat kaydı kurar, sonunda eski haline getirir (kaydetmez).
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    yedek = await p.evaluate(() => {
      let g = AIDAT_GRUPLAR.find((x) => Object.keys(turnuvaDB[x] || {}).filter((ad) => !turnuvaDB[x][ad].pasif).length >= 3);
      let l = Object.keys(turnuvaDB[g]).filter((ad) => !turnuvaDB[g][ad].pasif).slice(0, 3), ay = aidatAyStrOfset(-1);
      let y = { g, l, ay, filtre: _aidatGrupFiltre, kayit: l.map((ad) => JSON.stringify(aidatDB[ad] || null)), muaf: l.map((ad) => !!turnuvaDB[g][ad].aidatMuaf), kat: l.map((ad) => turnuvaDB[g][ad].katilmaTarihi || null) };
      _aidatGrupFiltre = g;
      aidatDB[l[0]] = Object.assign({}, aidatDB[l[0]] || {}); aidatDB[l[0]][ay] = { odendi: true, tutar: 1234, tarih: ay + '-05T09:30:03.513Z' };
      aidatDB[l[1]] = Object.assign({}, aidatDB[l[1]] || {}); delete aidatDB[l[1]][ay]; turnuvaDB[g][l[1]].aidatMuaf = false; turnuvaDB[g][l[1]].katilmaTarihi = '2020-01-01';
      turnuvaDB[g][l[2]].aidatMuaf = true;
      return y;
    });
    await p.evaluate((ay) => aidatOdemeDurumAc(ay), yedek.ay);
    await p.waitForSelector('#aidat-odeme-durum');
    const v = await p.evaluate((y) => { let r = aidatOdemeDurumVeri(y.ay); let ad = (l) => l.map((x) => x.ad); return { o: ad(r.odeyen).includes(y.l[0]), x: ad(r.odemeyen).includes(y.l[1]), m: ad(r.muaf).includes(y.l[2]), metin: document.getElementById('aidat-odeme-durum').textContent }; }, yedek);
    dogrula(v.o && v.x && v.m, 'ödeyen/ödemeyen/muaf ayrımı yanlış');
    // saatli damga ('…T09:30:03.513Z') listede/PDF'te karışık görünmesin (kullanıcı ekran görüntüsü 2026-10-21)
    dogrula(!/T09:30/.test(v.metin) && v.metin.includes('05.' + yedek.ay.slice(5, 7) + '.' + yedek.ay.slice(0, 4)), 'ödeme tarihi gün.ay.yıl görünmeli');
    esit(await p.evaluate(() => aidatTarihGoster('2026-10-04') + '|' + aidatTarihGoster('2026-10-04T19:30:03.513Z')), '04.10.2026|04.10.2026', 'tarih biçimi');
    dogrula(/ÖDEMEYENLER/.test(v.metin) && /ÖDEYENLER/.test(v.metin) && /1\.234₺/.test(v.metin), 'liste ekranda yok');
    // ay kaydırma + 6 aylık tablo
    await p.evaluate(() => aidatOdemeAyKaydir(1));
    esit(await p.evaluate(() => _aidatOdemeAy), await p.evaluate(() => aidatAyStrOfset(0)), 'ileri ay');
    await p.evaluate((ay) => { aidatOdemeDurumAc(ay); _aidatOdemeGorunum = 'tablo'; aidatOdemeDurumCiz(); }, yedek.ay);
    dogrula(await p.locator('#aidat-odeme-durum table tbody tr').count() >= 3, '6 aylık tablo yok');
    // PDF'ler iner
    for (const fn of ['aidatOdemeDurumPdf', 'aidatOdemeTabloPdf']) {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.evaluate((fn) => window[fn](), fn)]);
      dogrula(/DAG-aidat-/.test(dl.suggestedFilename()), fn + ' PDF inmedi');
    }
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('📋 kim ödedi/ödemedi: ay seçimi, ayrım, 6 aylık tablo, 2 PDF ✓');
  } finally {
    if (yedek) await p.evaluate((y) => { try { y.l.forEach((ad, i) => { let k = JSON.parse(y.kayit[i]); if (k) aidatDB[ad] = k; else delete aidatDB[ad]; turnuvaDB[y.g][ad].aidatMuaf = y.muaf[i]; turnuvaDB[y.g][ad].katilmaTarihi = y.kat[i]; }); _aidatGrupFiltre = y.filtre; let e = document.getElementById('aidat-odeme-durum'); if (e) e.remove(); } catch (e) {} }, yedek).catch(() => {});
    await ctx.close();
  }
}
