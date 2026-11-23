// 👤 Sporcu profili (v448, kullanıcı: "bu kısmı çok geliştirmemiz gerekiyor — geldiği günlerin özeti, saat dilimleri; aidata tıklayamıyorum,
// her şeye tıklayabilme gerekiyor"): geliş takvimi + gün × saat, dokunulan kutular, satırdan düzenleme, aidatın kendiliğinden yüklenmesi.
import { sayfaAc, uygulamaAc, yoneticiAc, api, benzersiz, dogrula, esit } from '../yardimci.mjs';

const AD = benzersiz('PROFIL TEST '), G = 'yildizlar';
export default async function ({ log }) {
  await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: G, ad: AD, lastModified: Date.now() }) });
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 844 });
  try {
    await uygulamaAc(p); await yoneticiAc(p);
    await p.waitForFunction(({ g, ad }) => turnuvaDB[g] && turnuvaDB[g][ad], { g: G, ad: AD }, { timeout: 30000 });
    await p.waitForFunction(() => typeof dagYonetimAdaptor === 'function' && document.querySelector('#yn-genel .ap-kpi'), null, { timeout: 30000 });
    // 10 haftalık geçmiş: Çarşamba 17:00 + Cumartesi 10:00 dersi; 3 Çarşamba kaçırıldı, 1 Pazar kendi günü dışında; son gelişte 2 seri
    const veri = await p.evaluate(({ g, ad }) => {
      const gun = (n) => { let d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; }, ARK = 'ARKADAS ' + ad;
      _programSlotlar = [{ id: 9001, grup: 'Yıldızlar', gunler: [3], baslangicSaat: '17:00', bitisSaat: '18:30', katilimcilar: [{ grup: g, ad }, { grup: g, ad: ARK }] }, { id: 9002, grup: 'Yıldızlar', gunler: [6], baslangicSaat: '10:00', bitisSaat: '11:30', katilimcilar: [{ grup: g, ad }, { grup: g, ad: ARK }] }];
      const eskiFetch = window.fetch; window.__yazilan = [];
      window.fetch = (u, o) => { if (String(u).startsWith('/api/antrenman-programi') && !(o && o.method && o.method !== 'GET')) return Promise.resolve(new Response(JSON.stringify({ slots: _programSlotlar }), { headers: { 'content-type': 'application/json' } })); if (String(u) === '/api/attendance/auto' && o && o.method) window.__yazilan.push([o.method, o.body]); return eskiFetch(u, o); };
      let car = 0, gelen = [], kacan = [], yaz = (t, a, r) => { (otomatikYoklamaDB[t] = otomatikYoklamaDB[t] || {})[a] = Object.assign({ grup: g, elle: true, geldi: true }, r); };
      for (let n = 70; n >= 1; n--) { let d = gun(n), t = bugunISO(d), w = d.getDay(); if (w !== 3 && w !== 6) continue; yaz(t, ARK, { saat: w === 3 ? '17:05' : '10:05' }); if (w === 3) { car++; if (car === 3 || car === 5 || car === 8) { kacan.push(t); continue; } } yaz(t, ad, { saat: w === 3 ? '17:10' : '10:08' }); gelen.push(t); }
      let pz = [...Array(14).keys()].map((i) => gun(i + 1)).find((d) => d.getDay() === 0), pzT = bugunISO(pz); yaz(pzT, ad, { saat: '13:20' }); gelen.push(pzT); gelen.sort();
      let son = gelen[gelen.length - 1], sp = turnuvaDB[g][ad], z = new Date(son + 'T17:22:00').getTime();
      sp.acilKisi = 'Test Veli'; sp.acilTelefon = '0555 111 22 33'; sp.seriler = [{ seriId: 'p1' + ad, oklar: ['X', '9', '8', '7', '6', 'M'], puan: 40, tarih: son, t: z }, { seriId: 'p2' + ad, oklar: ['10', '9', '9', '5', '4', '3'], puan: 40, tarih: son, t: z + 300000 }];
      return { son, gelen, kacan, pzT };
    }, { g: G, ad: AD });
    // aidat verisi yokken profil kendisi ister (eskiden hep "yükleniyor")
    await p.evaluate(({ g, ad }) => { aidatDB = {}; _aidatKilitAcikMi = false; sporcuProfilAc(g + '|' + ad); }, { g: G, ad: AD });
    await p.waitForSelector('#yn-b-gelis .yn-t button', { timeout: 15000 });
    await p.waitForFunction(() => /PIN/.test([...document.querySelectorAll('#yn-b-ozet button')].find((b) => /Aidat/i.test(b.textContent)).textContent), null, { timeout: 10000 });
    const ozet = await p.locator('#yn-b-gelis .yn-g-ozet').textContent();
    dogrula(/Cumartesi 10:00/.test(ozet) && /Çarşamba 17:00/.test(ozet), 'özet gün + saati söylemeli: ' + ozet);
    const say = await p.evaluate(() => [...document.querySelectorAll('#yn-b-gelis .yn-g-say b')].map((b) => b.textContent));
    esit(+say[0], veri.gelen.length, 'geldiği gün sayısı'); esit(+say[1], veri.kacan.length, 'kaçırdığı ders sayısı'); esit(+say[2], 1, 'kendi günü dışında');
    // kutuların hepsi düğme ve bir yere gider
    dogrula(await p.evaluate(() => [...document.querySelectorAll('#yn-b-ozet > *')].every((e) => e.tagName === 'BUTTON' && e.getAttribute('onclick')) && document.querySelectorAll('#yn-b-ozet > button').length >= 6), 'kutular dokunulur olmalı');
    if (process.env.E2E_EKRAN) { await p.waitForTimeout(1500); await p.screenshot({ path: process.env.E2E_EKRAN + '-1.png' }); await p.evaluate(() => ynBolum('gelis')); await p.waitForTimeout(1800); await p.screenshot({ path: process.env.E2E_EKRAN + '-2.png' }); }
    await p.locator('#yn-b-ozet button', { hasText: 'Aidat' }).click();
    await p.waitForFunction(() => document.activeElement && document.activeElement.id === 'yn-kart-pin');
    // son geliş → gün detayı: gerçek ilk skor saati + ders + oklar
    await p.locator('#yn-b-ozet button', { hasText: 'Son geliş' }).click(); await p.waitForSelector('#yn-gd');
    const gd = await p.locator('#yn-gd').textContent();
    dogrula(/17:22/.test(gd) && /2 seri/.test(gd) && /ok başı 6,7/.test(gd.replace(/\s+/g, ' ')), 'gün detayı: ' + gd);
    esit(await p.locator('#yn-gd .yn-ok i').count(), 12, 'oklar');
    dogrula(!/Gelmedi yap/.test(gd), 'skoru olan güne "gelmedi" yazılamaz');
    if (process.env.E2E_EKRAN) { await p.waitForTimeout(1500); await p.screenshot({ path: process.env.E2E_EKRAN + '-3.png' }); }
    // saat hücresi → o dilimin günleri; kaçırdı → liste → gün → Geldi yap
    await p.locator('#yn-b-gelis .yn-isi td button[aria-label^="Çarşamba 17:00"]').click();
    esit(await p.locator('#yn-b-gelis .yn-g-cip button').count(), veri.gelen.filter((t) => new Date(t + 'T12:00:00').getDay() === 3).length, 'Çarşamba 17:00 günleri');
    await p.locator('#yn-b-ozet button', { hasText: 'Derse katılım' }).click();
    esit(await p.locator('#yn-b-gelis .yn-g-cip button.k').count(), veri.kacan.length, 'kaçırdığı dersler listesi');
    await p.locator('#yn-b-gelis .yn-g-cip button.k').first().click();
    dogrula(/ders yapıldı, bu sporcunun kaydı yok/.test(await p.locator('#yn-gd').textContent()), 'kaçırılan ders açıklaması');
    if (process.env.E2E_EKRAN) { await p.evaluate(() => ynBolum('gelis')); await p.waitForTimeout(1800); await p.screenshot({ path: process.env.E2E_EKRAN + '-4.png' }); }
    await p.locator('#yn-gd button', { hasText: 'Geldi yap' }).click();
    await p.waitForFunction((n) => +document.querySelectorAll('#yn-b-gelis .yn-g-say b')[0].textContent === n, veri.gelen.length + 1);
    const yz = await p.evaluate(() => window.__yazilan.filter((x) => x[0] === 'POST').pop());
    dogrula(yz && JSON.parse(yz[1]).saat === '17:00' && JSON.parse(yz[1]).geldi === true, 'yoklama ders saatiyle yazılmalı: ' + JSON.stringify(yz));
    // kimlik satırı → yalnız o alan düzenlenir
    await p.locator('#yn-kart .yn-dl button', { hasText: 'Test Veli' }).click(); await p.waitForSelector('#yn-a-veli input');
    esit(await p.locator('#yn-kart [data-alan]').count(), 1, 'yalnız dokunulan alan açılmalı');
    if (process.env.E2E_EKRAN) { await p.waitForTimeout(1500); await p.screenshot({ path: process.env.E2E_EKRAN + '-5.png' }); }
    await p.fill('#yn-a-veli input', 'Yeni Veli'); await p.locator('#yn-a-veli .yn-alan-d .ana').click();
    await p.waitForFunction(({ g, ad }) => turnuvaDB[g][ad].acilKisi === 'Yeni Veli' && !document.querySelector('#yn-kart [data-alan]'), { g: G, ad: AD });
    // devam çubuğu → o ayın takvimi; Geçmiş satırı → gün
    await p.locator('#yn-kart .yn-devam button').first().click();
    dogrula(await p.locator('#yn-b-gelis .yn-t-ust').isVisible(), 'takvim');
    await p.locator('#yn-kart .yn-gecmis .yn-olay').first().click(); await p.waitForSelector('#yn-gd');
    // oturum yoksa açıkça söyler, "yükleniyor"da kalmaz
    await p.evaluate(({ g, ad }) => { const f = window.fetch; window.fetch = (u, o) => String(u) === '/api/dues' ? Promise.resolve(new Response('{}', { status: 401 })) : f(u, o); aidatDB = {}; ynKartKapat(); sporcuProfilAc(g + '|' + ad); }, { g: G, ad: AD });
    await p.waitForFunction(() => { const b = [...document.querySelectorAll('#yn-b-ozet button')].find((x) => /Aidat/i.test(x.textContent)); return b && /giriş yap/.test(b.textContent); }, null, { timeout: 10000 });
    // yatay taşma yok (390 px)
    dogrula(await p.evaluate(() => { const a = document.getElementById('yn-kart'); return a.scrollWidth <= a.clientWidth + 1; }), '390 px yatay taşma');
    if (process.env.E2E_EKRAN) { await p.setViewportSize({ width: 1366, height: 900 }); await p.evaluate((t) => ynGunAc(t), veri.son); await p.evaluate(() => { document.getElementById('yn-kart').scrollTop = 0; }); await p.waitForTimeout(1500); await p.screenshot({ path: process.env.E2E_EKRAN + '-6.png' }); await p.setViewportSize({ width: 390, height: 844 }); }
    // o günün yoklaması → Yönetici › Yoklama, o tarih
    await p.evaluate((t) => ynGunAc(t), veri.son); await p.locator('#yn-gd button', { hasText: 'O günün yoklaması' }).click(); await p.waitForTimeout(400);
    dogrula(await p.evaluate((t) => !document.getElementById('yn-kart') && yoneticiSekmeAktif === 'yoklama' && _yonElTarih === t, veri.son), 'o günün yoklamasına gitmeli');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
  } finally {
    const gunler = await p.evaluate((ad) => Object.keys(otomatikYoklamaDB).filter((t) => otomatikYoklamaDB[t][ad] || otomatikYoklamaDB[t]['ARKADAS ' + ad]), AD).catch(() => []);
    await ctx.close();
    for (const t of gunler) for (const ad of [AD, 'ARKADAS ' + AD]) await api('/api/attendance/auto', { method: 'DELETE', body: JSON.stringify({ tarih: t, ad }) }).catch(() => {});
    await api(`/api/athletes/${G}/${encodeURIComponent(AD)}`, { method: 'DELETE' }).catch(() => {});
  }
}
