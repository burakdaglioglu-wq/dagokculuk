// 🔓 Hayvan Kurtarma (2026-10-14): Oyunlar seçicisinden açılır; okun halka RENGİ aynı renkteki kilidi açar (sarı 9-10-X,
// kırmızı 7-8, mavi 5-6, 🎯 herhangi isabet, X her kilidi), M açmaz. Bütün kilitler açılınca hayvan kurtulur (kutlama) ve
// sıradaki kafes gelir. İlerleme gerçek serilerden hesaplanır; saklanan tek şey başlangıç (dag_km_kurtarma_<konum>).
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.waitForFunction(() => _kmListe.length > 0 && _kmListe.some((k) => turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]), null, { timeout: 30000 });
    await p.evaluate(() => { localStorage.removeItem(kmHatAnahtari()); _kmListe.forEach((k) => { const sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; if (sp) sp.devamModu = true; }); kmOyunSeciciAc(); });
    await p.locator('#km-oyun-secici .card', { hasText: 'Hayvan Kurtarma' }).click();
    await p.waitForFunction(() => typeof kmKurtarmaCiz === 'function' && document.querySelector('#kr-kok'), null, { timeout: 30000 });
    // temiz başlangıç: yeni oyun (başlangıç = şimdi)
    await p.evaluate(() => { krDurumYaz({ basla: Date.now(), tarih: bugunISO() }); _kr.sonAcik = null; _kr.sonKurtarilan = null; kmKurtarmaCiz(); });
    const r0 = await p.evaluate(() => { const r = krHesapla(); return { acik: r.kafes.acik, n: r.kafes.kilitler.length, sari: r.kafes.kilitler.filter((x) => x.renk === 'sari').length, kisi: r.liste.length }; });
    esit(r0.acik, 0, 'yeni oyunda açık kilit olmamalı');
    dogrula(r0.n >= 6, 'kilit sayısı en az 6: ' + JSON.stringify(r0));
    // renk kuralı: 9-9-M → 2 kilit (sarı ya da herhangi), M açmaz
    const k0 = await p.evaluate(() => { const r = krHesapla(), k = r.liste[0]; _skorKaydetCekirdek(k.g, k.ad, [{ puan: '9' }, { puan: '9' }, { puan: 'M' }]); const s = krHesapla(); return { acik: s.kafes.acik, renkler: s.kafes.kilitler.filter((x) => x.acan).map((x) => x.renk), ad: k.ad }; });
    esit(k0.acik, 2, '9-9-M iki kilit açmalı');
    dogrula(k0.renkler.every((c) => c === 'sari' || c === 'herhangi'), 'sarı oklar yanlış kilidi açtı: ' + k0.renkler);
    // X'lerle kafesi bitir → kurtarılan 1 + kutlama
    const son = await p.evaluate(() => { const k = krHesapla().liste[0]; for (let i = 0; i < 12 && !krHesapla().kurtarilan.length; i++) _skorKaydetCekirdek(k.g, k.ad, [{ puan: 'X' }, { puan: 'X' }, { puan: 'X' }]); const r = krHesapla(); return { kurt: r.kurtarilan.length, yeniAcik: r.kafes.acik, hayvan: r.kurtarilan[0] && r.kurtarilan[0].hayvan.ad }; });
    esit(son.kurt, 1, 'hayvan kurtarılmadı');
    await p.evaluate(() => kmKurtarmaCiz());
    await p.waitForSelector('.kr-sahne-kutla', { timeout: 3000 });
    dogrula((await p.locator('.kr-sahne-kutla').textContent()).includes('KURTARILDI'), 'kutlama yazısı yok');
    await p.evaluate(() => document.querySelectorAll('.kr-sahne-kutla').forEach((x) => x.remove()));
    dogrula(await p.locator('.kr-raf .kr-kurt').count() === 1, 'kurtarılanlar rafında hayvan yok');
    // tuşlarla seri gir (gerçek kayıt) → kilit açılır
    const once = await p.evaluate(() => ({ acik: krHesapla().kafes.acik, seri: (() => { const k = krHesapla().liste[0]; return turnuvaDB[k.g][k.ad].seriler.length; })(), i: krHesapla().liste[0].i }));
    await p.locator('#kr-kart-' + once.i).click();
    for (const v of ['10', '8', '6']) await p.locator('.kr-ped button[data-ok="' + v + '"]').click();
    await p.locator('.kr-katman [data-kaydet]').click();
    await p.waitForTimeout(400);
    const sonra = await p.evaluate(() => { const k = krHesapla().liste[0]; return { acik: krHesapla().kafes.acik, seri: turnuvaDB[k.g][k.ad].seriler.length }; });
    esit(sonra.seri, once.seri + 1, 'tuşlarla girilen seri kaydedilmedi');
    dogrula(sonra.acik >= once.acik + 2, 'tuşlarla girilen seri kilit açmadı: ' + JSON.stringify({ once, sonra }));
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(`kafes ${r0.n} kilit · 9-9-M → 2 kilit · ${son.hayvan} kurtarıldı · tuşlarla seri ✓`);
  } finally { await ctx.close(); }
}
