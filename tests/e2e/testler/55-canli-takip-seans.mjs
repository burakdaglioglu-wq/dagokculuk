// 📡 Canlı Takip · Ders Seansları (v310, kullanıcı: "günlük atan kişilerin olduğu canlı skor çok karışık" → 3 taslaktan
// "B · Ders Seansları"). Bugün atan sporcular derse göre gruplanır; son ders açık (sporcu × seri ısı haritası), eski ders katlı;
// başlığa dokun → açılır/kapanır; isme dokun → seri dökümü; yeniden çizimde açık/seçili durum korunur. Sunucu cevabı
// (bugünkü seriler) bu sayfada taklit edilir — hiçbir şey yazılmaz.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let eklenen = null;
  try {
    await uygulamaAc(p);
    eklenen = await p.evaluate(() => {
      let l = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { let sp = turnuvaDB[g][ad]; if (sp && !sp.pasif && !sp.donduruldu) l.push({ g, ad }); }));
      l = l.slice(0, 3); if (l.length < 3) return null;
      let bugun = bugunISO(), simdi = Date.now(), seri = (oklar, dkOnce) => ({ oklar, puan: oklar.reduce((t, o) => t + puanDeger(o), 0), tarih: bugun, t: simdi - dkOnce * 60000, seriId: 'TESTCT' + Math.random().toString(36).slice(2) });
      // 1. ders: iki sporcu (90–60 dk önce) · 2. ders: bir sporcu (10–2 dk önce)
      let plan = [[['10', '9', '9'], 90], [['9', '8', '7'], 80], [['X', '10', '9'], 70]];
      // Canlı Takip sunucudaki bugünkü serileri okur (/api/series) — test o cevabı bu sayfada taklit eder, sunucuya yazmaz
      let byKey = {};
      [0, 1].forEach((i) => { byKey[l[i].g + '_' + l[i].ad] = plan.map((x) => seri(x[0], x[1] - i)); });
      byKey[l[2].g + '_' + l[2].ad] = [seri(['8', '7', '6'], 10), seri(['M', '6', '5'], 2)];
      _canliTakipSunucudanCek = async () => ({ byKey, zaman: Date.now() });
      return l;
    });
    dogrula(eklenen, 'üç sporcu yok');
    await p.evaluate(() => { _ct.acik = {}; _ct.sec = null; _ct.kaydir = {}; sekmeAc('canlitakip'); });
    await p.waitForSelector('#canli-takip-liste .ct-seans', { timeout: 10000, state: 'attached' });
    const d = await p.evaluate((l) => {
      let el = document.getElementById('canli-takip-liste'), s = [...el.querySelectorAll('.ct-seans')];
      let bizim = (x) => l.some((q) => x.textContent.includes(q.ad.split(/\s+/)[0]));
      let acik = s.filter((x) => x.querySelector('.ct-isi')), kapali = s.filter((x) => !x.querySelector('.ct-isi'));
      let son = acik.find((x) => x.querySelector('.ct-isi').textContent.includes(l[2].ad));
      return { ozet: !!el.querySelector('.ct-ozet'), acikSay: acik.length, sonVar: !!son, sonHucre: son ? [...son.querySelectorAll('.ct-isi tbody tr')].find((r) => r.textContent.includes(l[2].ad)).querySelectorAll('td[title]').length : 0, eskiKapali: kapali.some(bizim) };
    }, eklenen);
    dogrula(d.ozet, 'özet kutuları yok');
    esit(d.acikSay, 1, 'yalnız son ders açık olmalı');
    dogrula(d.sonVar, 'son derste 3. sporcu yok');
    esit(d.sonHucre, 2, 'son derste 2 seri hücresi');
    dogrula(d.eskiKapali, 'eski ders katlı görünmeli');
    // eski dersi aç → iki sporcu, 3'er seri, renkli hücre; toplam sütunu
    await p.evaluate((l) => { let s = [...document.querySelectorAll('#canli-takip-liste .ct-seans')].find((x) => !x.querySelector('.ct-isi') && x.textContent.includes(l[0].ad.split(/\s+/)[0])); s.querySelector('.ct-bas').click(); }, eklenen);
    await p.waitForTimeout(400);
    const t = await p.evaluate((l) => { let r = [...document.querySelectorAll('#canli-takip-liste .ct-isi tbody tr')].find((x) => x.textContent.includes(l[0].ad)); return r ? { hucre: r.querySelectorAll('td[title]').length, top: r.querySelector('.ct-top').textContent, renk: r.querySelector('td[title]').style.background } : null; }, eklenen);
    dogrula(t && t.hucre >= 3 && t.renk, 'eski ders açılmadı / hücre yok: ' + JSON.stringify(t));
    // isme dokun → seri dökümü; yeniden çizimde kalır
    await p.evaluate((l) => [...document.querySelectorAll('#canli-takip-liste .ct-ad button')].find((b) => b.textContent.includes(l[0].ad)).click(), eklenen);
    await p.waitForSelector('#canli-takip-liste .ct-detay', { timeout: 5000, state: 'attached' });
    dogrula(await p.locator('#canli-takip-liste .ct-detay .ct-seri').count() >= 3, 'seri dökümü yok');
    await p.evaluate(() => canliTakipCiz()); await p.waitForTimeout(400);
    esit(await p.locator('#canli-takip-liste .ct-detay').count(), 1, 'yeniden çizimde seçili sporcu korunmalı');
    esit(await p.locator('#canli-takip-liste .ct-isi').count(), 2, 'yeniden çizimde açılan ders açık kalmalı');
    // telefon genişliği: sayfa yana taşmamalı (tablo kendi içinde kayar)
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => { let e = document.getElementById('canli-takip-liste'); return e.scrollWidth <= e.clientWidth + 1; }), 'telefonda liste yana taşıyor');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-canli-takip.png', fullPage: true });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('📡 canlı takip: ders seansları, son ders açık / eskisi katlı, aç-kapa, seri dökümü, durum korunur ✓');
  } finally {
    await ctx.close();
  }
}
