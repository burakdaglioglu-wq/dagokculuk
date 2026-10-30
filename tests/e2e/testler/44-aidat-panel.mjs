// 📊 Aidat paneli (2026-10-21, kullanıcı: "bir sürü isim düşünce kasıyor, basit bir site dashboard'u olsun: tahmin, istatistik,
// kaçan / ödenmemiş ödemeler, belki ödendi ben girmedim → tıklayıp donmadan halledeyim"; "hem DAĞ hem Milo"). Ortak /yonetim-panel.js.
// DAĞ: bellekte geçici aidat kaydı (sunucuya yazmaz, _aidatDuesPut susturulur), sonunda eski hali. Milo: test üyesi açılır, silinir.
import { sayfaAc, uygulamaAc, miloApi, miloOturumAl, benzersiz, B, dogrula, esit, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  const n = new Date(), ay = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0'), bugun = ay + '-' + String(n.getDate()).padStart(2, '0');
  const ayEkle = (a, k) => { let p = a.split('-').map(Number), d = new Date(p[0], p[1] - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  // ---- DAĞ ----
  {
    const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
    let yedek = null;
    try {
      await uygulamaAc(p);
      yedek = await p.evaluate(({ ay, bugun }) => {
        let ek = (a, k) => { let q = a.split('-').map(Number), d = new Date(q[0], q[1] - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
        let g = AIDAT_GRUPLAR.find((x) => Object.keys(turnuvaDB[x] || {}).filter((ad) => !turnuvaDB[x][ad].pasif && !turnuvaDB[x][ad].donduruldu && yonKisiTuru(x, ad) === 'sporcu').length >= 3);
        let l = Object.keys(turnuvaDB[g]).filter((ad) => !turnuvaDB[g][ad].pasif && !turnuvaDB[g][ad].donduruldu && yonKisiTuru(g, ad) === 'sporcu').slice(0, 3);
        let y = { g, l, kayit: l.map((ad) => JSON.stringify(aidatDB[ad] || null)), sp: l.map((ad) => JSON.stringify({ m: turnuvaDB[g][ad].aidatMuaf || false, k: turnuvaDB[g][ad].katilmaTarihi || null })), yok: JSON.stringify((otomatikYoklamaDB || {})[bugun] || null), put: null };
        window.__putSay = 0; window.__eskiPut = _aidatDuesPut; _aidatDuesPut = function () { window.__putSay++; };
        l.forEach((ad) => { turnuvaDB[g][ad].aidatMuaf = false; turnuvaDB[g][ad].katilmaTarihi = '2020-01-01'; aidatDB[ad] = {}; });
        aidatDB[l[0]][ay] = { odendi: true, tutar: 1500, tarih: new Date().toISOString(), odemeTarihi: ay + '-02', notMetin: 'Havale, dekont alındı' };
        [-1, -2, -3].forEach((k) => { aidatDB[l[1]][ek(ay, k)] = { odendi: true, tutar: 1500, odemeTarihi: ek(ay, k) + '-03' }; });
        otomatikYoklamaDB[bugun] = Object.assign({}, otomatikYoklamaDB[bugun] || {}); otomatikYoklamaDB[bugun][l[1]] = { geldi: true, grup: g };
        aidatDB[l[2]][ek(ay, -3)] = { odendi: true, tutar: 1500, odemeTarihi: ek(ay, -3) + '-05' }; // -1 ve -2 boş → 2 ay eski borç
        _aidatKilitAcikMi = true; _aidatAltSekme = 'panel';
        let d = document.createElement('div'); d.id = 'tmp-aidat'; d.style.cssText = 'position:fixed;inset:0;z-index:30000;overflow:auto;background:#0b0d10;padding:12px'; document.body.appendChild(d);
        y.eskiHedef = renderHedefId; renderHedefId = 'tmp-aidat'; egitmenRenderAidat();
        return y;
      }, { ay, bugun });
      await p.waitForSelector('#tmp-aidat .ap .ap-kpi', { timeout: 20000 });
      // kasmasın: tüm sporcular yerine en fazla 20 satır
      const satir = await p.locator('#tmp-aidat .ap-sat:not(.bas)').count();
      dogrula(satir <= 20, 'liste sayfalanmalı (en fazla 20 satır), gelen ' + satir);
      await p.evaluate((g) => { AP.grup = g; AP.sayfa = 0; apYenile(); }, yedek.g);
      const v = await p.evaluate((y) => { let id = (ad) => y.g + '|' + ad; return { ol: AP.v.olabilir.map((s) => s.k.id).includes(id(y.l[1])), gec: (AP.v.satirlar.find((s) => s.k.id === id(y.l[2])) || {}).gec, od: AP.v.od.some((s) => s.k.id === id(y.l[0])), metin: document.querySelector('#tmp-aidat .ap').textContent }; }, yedek);
      dogrula(v.ol, 'derse gelen + hep ödeyen "ödemiş olabilir" listesinde olmalı');
      esit(v.gec, 2, 'iki ay eski borç');
      dogrula(v.od && /Ay sonu tahmini/.test(v.metin) && /Kaçan/.test(v.metin) && /Tahsilat oranı/.test(v.metin), 'özet kartları yok');
      // ödeyenler sekmesi: gerçek ödeme günü (odemeTarihi) + not
      await p.evaluate(() => { AP.liste = 'odedi'; apTabloCiz(); });
      const od = await p.locator('#tmp-aidat .ap-sat.od:not(.bas)').first().textContent();
      dogrula(od.includes('02.' + ay.slice(5, 7) + '.' + ay.slice(0, 4)) && od.includes('Havale'), 'ödeyen satırında ödeme günü/not yok: ' + od);
      // arama yalnız tabloyu süzer
      await p.evaluate(() => { AP.liste = 'bekleyen'; apTabloCiz(); });
      await p.locator('#ap-ara').fill(yedek.l[2]); await p.waitForTimeout(400);
      const ar = await p.evaluate((q) => [...document.querySelectorAll('#tmp-aidat .ap-sat:not(.bas) .ad b')].map((b) => b.textContent), yedek.l[2]);
      dogrula(ar.length >= 1 && ar.length < satir + 1 && ar.includes(yedek.l[2]) && ar.every((t) => t.toLocaleLowerCase('tr').includes(yedek.l[2].toLocaleLowerCase('tr'))), 'arama sonucu: ' + JSON.stringify(ar));
      await p.evaluate((ad) => { let i = [...document.querySelectorAll('#tmp-aidat .ap-sat:not(.bas)')].findIndex((r) => r.querySelector('.ad b').textContent === ad); window.__sat = i; }, yedek.l[2]);
      dogrula(await p.evaluate(() => document.activeElement && document.activeElement.id === 'ap-ara'), 'arama kutusu odağı kaybetmemeli');
      // tek tık ödendi + eski borç
      await p.locator('#tmp-aidat .ap-sat:not(.bas)').nth(await p.evaluate(() => window.__sat)).locator('.ap-btn.iyi').click();
      await p.waitForSelector('#ap-f-not');
      await p.fill('#ap-f-not', 'Test: elden'); await p.check('#ap-f-eski');
      await p.locator('#tmp-aidat .ap-form .ap-btn.ana').click(); await p.waitForTimeout(300);
      const k = await p.evaluate(({ y, ay }) => { let ek = (a, k) => { let q = a.split('-').map(Number), d = new Date(q[0], q[1] - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }; let r = aidatDB[y.l[2]]; return { bu: r[ay], a1: r[ek(ay, -1)], a2: r[ek(ay, -2)], put: window.__putSay }; }, { y: yedek, ay });
      dogrula(k.bu && k.bu.odendi && k.bu.tutar > 0 && k.bu.odemeTarihi === bugun && k.bu.notMetin === 'Test: elden', 'bu ay ödendi kaydı yanlış: ' + JSON.stringify(k.bu));
      dogrula(k.a1 && k.a1.odendi && k.a2 && k.a2.odendi, 'eski borç ayları ödendi olmalı');
      esit(k.put, 3, 'üç ay sunucuya gönderilmeli');
      // v355: arama bütün sekmelerde + Türkçe harf katlama (KARADENIZ ↔ "karadeniz"); tek sonuçta Enter formu açar
      await p.evaluate(() => { AP.liste = 'odedi'; AP.acik = null; apTabloCiz(); });
      const katli = yedek.l[1].toLocaleLowerCase('tr').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ö/g, 'o').replace(/ü/g, 'u');
      await p.locator('#ap-ara').fill(katli); await p.waitForTimeout(400);
      const ar2 = await p.evaluate(() => [...document.querySelectorAll('#tmp-aidat .ap-sat:not(.bas) .ad b')].map((b) => b.textContent));
      dogrula(ar2.includes(yedek.l[1]), 'ödeyenler sekmesindeyken "' + katli + '" araması ödemeyen sporcuyu bulmalı: ' + JSON.stringify(ar2));
      if (ar2.length === 1) { await p.locator('#ap-ara').press('Enter'); await p.waitForSelector('#ap-f-not', { timeout: 3000 }); }
      // toplu: ödemiş olabilir olanı seç → ödendi
      await p.evaluate(() => { AP.acik = null; });
      await p.locator('#ap-ara').fill(''); await p.waitForTimeout(300);
      await p.evaluate((y) => { AP.liste = 'olabilir'; AP.sec = {}; AP.sec[y.g + '|' + y.l[1]] = true; apTabloCiz(); window.confirm = () => true; }, yedek);
      await p.locator('#ap-toplu').click(); await p.waitForTimeout(300);
      dogrula(await p.evaluate(({ y, ay }) => !!(aidatDB[y.l[1]][ay] && aidatDB[y.l[1]][ay].odendi), { y: yedek, ay }), 'toplu ödendi kaydetmedi');
      if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-dag.png', fullPage: false });
      // telefon genişliği: yana taşma yok
      await p.setViewportSize({ width: 390, height: 844 }); await p.evaluate(() => apYenile()); await p.waitForTimeout(200);
      dogrula(await p.evaluate(() => { let e = document.querySelector('#tmp-aidat .ap'); return e.scrollWidth <= e.clientWidth + 1; }), 'telefonda panel yana taşıyor');
      if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-dag-tel.png', fullPage: false });
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    } finally {
      if (yedek) await p.evaluate(({ y, bugun }) => { try { _aidatDuesPut = window.__eskiPut; y.l.forEach((ad, i) => { let k = JSON.parse(y.kayit[i]); if (k) aidatDB[ad] = k; else delete aidatDB[ad]; let s = JSON.parse(y.sp[i]); turnuvaDB[y.g][ad].aidatMuaf = s.m; turnuvaDB[y.g][ad].katilmaTarihi = s.k; }); let yk = JSON.parse(y.yok); if (yk) otomatikYoklamaDB[bugun] = yk; else delete otomatikYoklamaDB[bugun]; renderHedefId = y.eskiHedef; let e = document.getElementById('tmp-aidat'); if (e) e.remove(); } catch (e) {} }, { y: yedek, bugun }).catch(() => {});
      await ctx.close();
    }
  }
  // ---- Milo ----
  const G = 'E2E Grup', A = benzersiz('AP ');
  try {
    await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: G, ad: A, acilTelefon: '05551112233' }) });
    await miloApi(`/dues/${encodeURIComponent(A)}/${ayEkle(ay, -3)}`, { method: 'PUT', body: JSON.stringify({ odendi: true, tutar: 900, tarih: bugun, odemeTarihi: ayEkle(ay, -3) + '-04' }) });
    const tok = await miloOturumAl();
    const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 1280, yukseklik: 900 });
    try {
      await ctx.addInitScript((t) => { try { localStorage.setItem('milo_oturum', t); } catch (e) {} }, tok);
      await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof miloUygulamayaGir === 'function', null, { timeout: 30000 });
      await p.evaluate(() => miloUygulamayaGir()); await p.waitForTimeout(800);
      await p.evaluate(() => miloSekme('aidat')); await p.waitForSelector('#milo-aidat-kilit-pin', { timeout: 20000 }); // aidat ek kilidi
      await p.evaluate(() => { miloAidatAcik = true; miloAidatCiz(); }); await p.waitForSelector('#milo-aidat-panel-kap .ap .ap-kpi', { timeout: 20000 });
      dogrula(await p.locator('#milo-aidat-panel-kap .ap-sat:not(.bas)').count() <= 20, 'Milo listesi sayfalanmalı');
      await p.evaluate((a) => { AP.grup = 'tumu'; AP.liste = 'geciken'; AP.arama = a; apTabloCiz(); }, A);
      const s = await p.evaluate((a) => { let x = AP.v.satirlar.find((q) => q.k.ad === a); return x && { gec: x.gec, aylik: x.aylik }; }, A);
      dogrula(s && s.gec === 2 && s.aylik === 900, 'Milo eski borç / aylık tutar yanlış: ' + JSON.stringify(s));
      await p.locator('#milo-aidat-panel-kap .ap-sat .ap-btn.iyi').first().click();
      await p.waitForSelector('#ap-f-not'); await p.check('#ap-f-eski');
      await p.locator('#milo-aidat-panel-kap .ap-form .ap-btn.ana').click();
      await p.waitForFunction((a) => AP.v && AP.v.od.some((q) => q.k.ad === a), A, { timeout: 15000 });
      const d = (await miloApi('/dues')).d.dues.filter((x) => x.ad === A && x.odendi);
      esit(d.length, 4, 'Milo: bu ay + 2 eski ay + eski kayıt ödendi olmalı');
      dogrula(d.some((x) => x.ay === ay && x.odemeTarihi === bugun && x.tutar === 900), 'Milo bu ay kaydı yanlış');
      // üye kartları sekmesi hâlâ çalışıyor
      await p.evaluate(() => { miloAidatGorunum = 'kartlar'; miloAidatCiz(); }); await p.waitForSelector('#milo-aidat-arama');
      if (process.env.E2E_EKRAN) { await p.evaluate(() => { miloAidatGorunum = 'panel'; miloAidatCiz(); }); await p.screenshot({ path: process.env.E2E_EKRAN + '-milo.png' }); }
      esit(hatalar.length, 0, 'Milo sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
  } finally {
    for (const m of [0, -1, -2, -3]) await miloApi(`/dues/${encodeURIComponent(A)}/${ayEkle(ay, m)}`, { method: 'PUT', body: JSON.stringify({ odendi: false, tutar: null, notMetin: null, odemeTarihi: null, tarih: bugun }) }).catch(() => {});
    await miloApi(`/members/${encodeURIComponent(G)}/${encodeURIComponent(A)}`, { method: 'DELETE' }).catch(() => {});
  }
  log('📊 aidat paneli (DAĞ + Milo): sayfalı liste, ödemiş olabilir, eski borç, arama, tek tık + toplu ödendi, telefon ✓');
}
