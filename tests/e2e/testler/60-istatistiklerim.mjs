// 📊 İstatistiklerim (v319). Kullanıcı (2026-10-26): "kendi skorlarını, istatistiklerini görmesini istiyorum, kendi sayfasına
// girdiğinde" → iki taslaktan A · Sayı panosu. Test: (1) hesap — bilinen serilerle ok/seri ortalaması, en iyi seri, karavana,
// dönem süzgeci (7/30/sezon), önceki döneme fark, iptal edilen seri sayılmaz; (2) sporcu ana ekranında kart → Gelişim'in
// başında pano, telefon genişliğinde taşma yok.
import { chromium } from 'playwright';
import { B, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const hatalar = []; p.on('pageerror', (e) => hatalar.push(e.message));
  try {
    const a = (await (await fetch(B + '/api/athletes')).json()).athletes.find((x) => x.ad === 'YoklamaTest');
    await p.goto(B + '/app.html?sg=YoklamaTest&sk=' + encodeURIComponent(a.kod || a.dogumYili));
    await p.waitForFunction(() => loggedInSporcu === 'YoklamaTest', null, { timeout: 40000 });
    // (1) hesap: bugün 2 seri (10,9,9=28 · 9,8,M=17), 3 gün önce 1 seri (10,10,10=30), 40 gün önce 1 seri (5,5,5=15), iptal 1 seri
    const r = await p.evaluate(() => {
      let g = (n) => istGunEkle(bugunISO(), -n);
      let sp = { seriler: [{ oklar: ['10', '9', '9'], tarih: g(0), t: 2 }, { oklar: ['9', '8', 'M'], tarih: g(0), t: 3 }, { oklar: ['X', 'X', 'X'], tarih: g(0), t: 4, iptal: true }],
        kartGecmisi: [{ tarih: g(3), seriler: [{ oklar: ['10', '10', '10'], tarih: g(3) }] }, { tarih: g(40), seriler: [{ oklar: ['5', '5', '5'], tarih: g(40) }] }] };
      let v7 = istVeri(sp, 7), v30 = istVeri(sp, 30), vs = istVeri(sp, 0);
      let h = istPanoHTML('buyukler', 'YoklamaTest', sp);
      return { ok7: v7.oz.ok, ort7: v7.oz.okOrt.toFixed(3), enIyi: v7.oz.enIyi.puan, kar7: v7.oz.karavana.toFixed(1), ant7: v7.oz.antrenman, ok30: v30.oz.ok, okS: vs.oz.ok, ortS: vs.oz.okOrt.toFixed(3), once30: v30.once.ok, cizgi: v7.ant.map((x) => x.ort.toFixed(2)).join(','), html: /Oklar nereye gitti/.test(h) && /Rekorlarım/.test(h) && /Son antrenmanlar/.test(h) };
    });
    esit(r.ok7, 9, '7 günde ok (iptal sayılmaz)');
    esit(r.ort7, (75 / 9).toFixed(3), '7 gün ok ortalaması');
    esit(r.enIyi, 30, 'en iyi seri');
    esit(r.kar7, (100 / 9).toFixed(1), 'karavana yüzdesi');
    esit(r.ant7, 2, 'antrenman sayısı');
    esit(r.ok30, 9, '30 gün: 40 gün önceki dahil değil');
    esit(r.okS, 12, 'sezon: hepsi');
    esit(r.ortS, (90 / 12).toFixed(3), 'sezon ok ortalaması');
    esit(r.once30, 3, 'önceki 30 gün (31–60 gün önce)');
    esit(r.cizgi, '10.00,7.50', 'antrenman antrenman ortalama (eski önce)');
    dogrula(r.html, 'pano bölümleri eksik');
    // (2) gerçek ekran: ana ekranda kart → Gelişim
    await p.evaluate(() => { try { kurulumRehberiKapat(); } catch (e) {} sekmeAc('ana'); sporcuAnaDoldur(); });
    await p.waitForSelector('#icerik-ana .ist-ana', { timeout: 8000 });
    await p.click('#icerik-ana .ist-ana');
    await p.waitForSelector('#icerik-gelisim.aktif #ist-pano .ist-kpi', { timeout: 8000 });
    for (const d of [7, 30, 0]) { await p.evaluate((d) => { IST.donem = d; istYenile(); }, d); await p.waitForTimeout(100); dogrula(await p.locator('#ist-pano .ist-cip button[aria-pressed="true"]').count() === 1, 'dönem çipi'); }
    dogrula(await p.evaluate(() => [...document.querySelectorAll('#ist-pano *')].every((e) => { let r = e.getBoundingClientRect(); return !r.width || r.right <= innerWidth + 1; })), 'pano telefonda taşıyor');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('📊 İstatistiklerim: ok/seri ortalaması, en iyi seri, karavana, dönem + önceki dönem, iptal hariç; ana ekran kartı → Gelişim panosu ✓');
  } finally {
    await b.close();
  }
}
