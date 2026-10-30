// 📊 Aidat paneli (2026-10-21, kullanıcı: "bir sürü isim düşünce kasıyor, basit bir site dashboard'u olsun: tahmin, istatistik,
// kaçan / ödenmemiş ödemeler, belki ödendi ben girmedim → tıklayıp donmadan halledeyim"; "hem DAĞ hem Milo"). Ortak /yonetim-panel.js.
// DAĞ: bellekte geçici aidat kaydı (sunucuya yazmaz, _aidatDuesPut susturulur), sonunda eski hali. Milo: test üyesi açılır, silinir.
import fs from 'node:fs';
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
      // v356: özet kutusuna dokun → altında detay açılır, içinden ödeme düzeltilir / girilir
      await p.evaluate((g) => { AP.grup = g; AP.kpi = null; apYenile(); }, yedek.g);
      await p.locator('#tmp-aidat .ap-kpi > button[data-k="toplanan"]').click();
      await p.waitForSelector('#ap-kpi-detay.ap-kd', { timeout: 3000 });
      await p.locator('#ap-kpi-detay .ap-sat.od:not(.bas)', { hasText: yedek.l[0] }).locator('button', { hasText: 'Düzelt' }).click();
      await p.waitForSelector('#ap-kpi-detay #ap-f-tutar');
      esit(await p.inputValue('#ap-f-tutar'), '1500', 'düzelt formu eski tutarla gelmeli');
      await p.fill('#ap-f-tutar', '1600'); await p.locator('#ap-kpi-detay .ap-form .ap-btn.ana').click(); await p.waitForTimeout(300);
      const dz = await p.evaluate(({ y, ay }) => ({ r: aidatDB[y.l[0]][ay], acik: AP.kpi, detay: !!document.querySelector('#ap-kpi-detay.ap-kd') }), { y: yedek, ay });
      dogrula(dz.r.odendi && dz.r.tutar === 1600 && dz.r.notMetin === 'Havale, dekont alındı', 'düzeltme kaydı yanlış: ' + JSON.stringify(dz.r));
      dogrula(dz.acik === 'toplanan' && dz.detay, 'kaydettikten sonra detay açık kalmalı');
      for (const k of ['oran', 'bekleyen', 'kacan', 'tahmin']) {
        await p.locator(`#tmp-aidat .ap-kpi > button[data-k="${k}"]`).click();
        dogrula(await p.evaluate((k) => AP.kpi === k && !!document.querySelector('#ap-kpi-detay h3') && document.querySelector(`.ap-kpi > button[data-k="${k}"]`).getAttribute('aria-pressed') === 'true', k), k + ' detayı açılmadı');
      }
      await p.locator('#tmp-aidat .ap-kpi > button[data-k="tahmin"]').click();
      dogrula(await p.evaluate(() => AP.kpi === null && !document.querySelector('#ap-kpi-detay').innerHTML), 'aynı kutuya ikinci dokunuş detayı kapatmalı');
      // v357: peşin 3 ay %10 indirim → 3 ay ayrı kayıt, her birine indirimli aylık + "Peşin 3 ay" notu; kasaya düşer
      await p.evaluate(({ y, ay }) => { aidatDB[y.l[2]] = {}; aidatDB[y.l[2]][ay.slice(0, 4) + '-01'] = { odendi: true, tutar: 1000, odemeTarihi: ay.slice(0, 4) + '-01-05' }; AP.kpi = null; AP.liste = 'bekleyen'; AP.arama = y.l[2]; apYenile(); apFormAc(y.g + '|' + y.l[2], 'tablo'); }, { y: yedek, ay });
      await p.waitForSelector('#ap-f-sure');
      await p.fill('#ap-f-tutar', '1000'); await p.selectOption('#ap-f-sure', '3'); await p.waitForSelector('#ap-f-ind', { state: 'visible' });
      // indirim kutusu select değişince görünür; fill bazen görünmeden önce yazıp boşa gidiyordu → değeri tutana kadar yaz
      for (let i = 0; i < 5 && (await p.inputValue('#ap-f-ind')) !== '10'; i++) { await p.fill('#ap-f-ind', '10'); await p.waitForTimeout(50); }
      await p.dispatchEvent('#ap-f-ind', 'input');
      await p.locator('#tmp-aidat .ap-form .ap-yon label', { hasText: 'IBAN' }).click(); // v358 ödeme yöntemi
      dogrula(/2\.700₺/.test(await p.textContent('#ap-f-pesin')), 'peşin özeti 3 × 900 = 2.700₺ göstermeli: ' + await p.textContent('#ap-f-pesin'));
      await p.locator('#tmp-aidat .ap-form .ap-btn.ana').click(); await p.waitForTimeout(300);
      const ps = await p.evaluate(({ y, ay }) => { let ek = (a, k) => { let q = a.split('-').map(Number), d = new Date(q[0], q[1] - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }; return [0, 1, 2].map((i) => aidatDB[y.l[2]][ek(ay, i)]); }, { y: yedek, ay });
      dogrula(ps.every((r) => r && r.odendi && r.tutar === 900 && /^Peşin 3 ay .*%10 indirim/.test(r.notMetin || '') && r.yontem === 'iban'), 'peşin kayıtları yanlış: ' + JSON.stringify(ps));
      // alışılmadık gecikme: son 3 ay hep ayın 1'inde ödemiş, bu ay yok → (bugün 9'undan sonraysa) uyarı
      const alis = await p.evaluate(({ y, ay }) => { let ek = (a, k) => { let q = a.split('-').map(Number), d = new Date(q[0], q[1] - 1 + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }; aidatDB[y.l[0]] = {}; [-1, -2, -3].forEach((k) => { aidatDB[y.l[0]][ek(ay, k)] = { odendi: true, tutar: 1500, odemeTarihi: ek(ay, k) + '-01' }; }); apYenile(); return { var: AP.v.alisilmadik.some((s) => s.k.ad === y.l[0]), gun: new Date().getDate(), metin: document.querySelector('#tmp-aidat .ap-kpi').textContent }; }, { y: yedek, ay });
      if (alis.gun > 8) dogrula(alis.var && /alışılmadık gecikme/.test(alis.metin), 'alışılmadık gecikme bulunmadı: ' + JSON.stringify(alis)); else dogrula(!alis.var, 'ayın ilk günlerinde uyarı çıkmamalı');
      // kasa: bugün girilen peşin ödemeler; geçen yıl tablosu 12 satır; bildirim + net kutuları
      await p.locator('#tmp-aidat .ap-kpi > button[data-k="kasa"]').click();
      dogrula(await p.evaluate((ad) => document.querySelector('#ap-kpi-detay').textContent.includes(ad), yedek.l[2]), 'kasada bugünkü peşin ödeme yok');
      // v358: kasa yönteme göre ayrılır (IBAN kutusunda en az 2.700₺) + kim tahsil etti; ay modu = teslim listesi
      const kd = await p.evaluate(() => { let b = [...document.querySelectorAll('#ap-kpi-detay .ap-kasa-yon>div')].map((d) => d.textContent); return { b, kim: !!document.querySelector('#ap-kpi-detay h4') && /Kim tahsil etti/.test(document.querySelector('#ap-kpi-detay').textContent) }; });
      dogrula(kd.b.some((t) => /IBAN/.test(t) && parseInt(t.replace(/\D/g, ''), 10) >= 2700) && kd.kim, 'kasa yöntem / kim dökümü yok: ' + JSON.stringify(kd));
      await p.locator('#ap-kpi-detay .ap-sekmeler button', { hasText: 'teslim' }).click();
      dogrula(await p.evaluate(() => AP.kasaMod === 'ay' && /Kasa · /.test(document.querySelector('#ap-kpi-detay h3').textContent) && !!document.querySelector('#ap-kpi-detay .ap-tablo')), 'kasa ay modu (teslim listesi) açılmadı');
      await p.evaluate(() => { AP.kasaMod = 'gun'; });
      // v358: ödüyor ama gelmiyor (bu ay ödedi, son ders 25 gün önce) → mor şerit + detay
      const gm = await p.evaluate((y) => { let d = new Date(); d.setDate(d.getDate() - 25); let g = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); AP.a.sonGelis = (k) => (k.ad === y.l[1] ? g : null); AP.kpi = null; apYenile(); return { var: AP.v.gelmiyor.some((s) => s.k.ad === y.l[1]), serit: !!document.querySelector('#tmp-aidat .ap-serit.mor') }; }, yedek);
      dogrula(gm.var && gm.serit, 'ödüyor ama gelmiyor bulunmadı: ' + JSON.stringify(gm));
      await p.locator('#tmp-aidat .ap-serit.mor button').click();
      dogrula(await p.evaluate((ad) => AP.kpi === 'gelmiyor' && document.querySelector('#ap-kpi-detay').textContent.includes(ad) && /gündür yok/.test(document.querySelector('#ap-kpi-detay').textContent), yedek.l[1]), 'gelmiyor detayı yanlış');
      // v358: yıl sonu özeti — peşin ödeyen bu yılın listesinde, toplam 3×900 + Ocak 1000
      await p.evaluate(() => apKpiAc('yil', true));
      const yl = await p.evaluate((ad) => { let x = (AP.yilListe || []).find((q) => q.ad === ad); return x && { n: x.l.length, top: x.top }; }, yedek.l[2]);
      if (new Date().getMonth() > 0 && new Date().getMonth() <= 9) dogrula(yl && yl.n === 4 && yl.top === 3700, 'yıl sonu özeti yanlış: ' + JSON.stringify(yl));
      await p.locator('#tmp-aidat .ap-kpi > button[data-k="sezon"]').click();
      esit(await p.locator('#ap-kpi-detay .ap-tablo tbody tr').count(), 12, 'geçen yıl tablosu 12 ay');
      await p.locator('#tmp-aidat .ap-kpi > button[data-k="net"]').click(); await p.waitForTimeout(800);
      dogrula(await p.evaluate(() => /Aidat geliri|Giderler alınamadı/.test(document.querySelector('#ap-kpi-detay').textContent)), 'net detayı açılmadı');
      // v358: aidat dışı gelir (sunucuya gerçekten yazar, sonunda silinir) → Net + kasa; muhasebe raporu Excel
      if (await p.evaluate(() => !!(AP.a.gelirEkle && AP.gider && !AP.gider.hata))) {
        await p.locator('#ap-kpi-detay button', { hasText: 'Diğer gelir' }).click();
        await p.selectOption('#ap-g-kat', 'Forma / kıyafet'); await p.fill('#ap-g-tutar', '357'); await p.fill('#ap-g-acik', 'E2E test forması');
        await p.locator('#ap-kpi-detay .ap-gelir-form .ap-btn.ana').click();
        await p.waitForFunction(() => (AP.gelirHepsi || []).some((x) => x.aciklama === 'E2E test forması') && AP.gider && !AP.gider.yukleniyor, null, { timeout: 15000 });
        const gl = await p.evaluate(() => ({ x: AP.gelirHepsi.find((x) => x.aciklama === 'E2E test forması'), net: document.querySelector('#ap-kpi-detay').textContent, kasa: document.querySelector('.ap-kpi>button[data-k="kasa"]').textContent }));
        dogrula(gl.x.tutar === 357 && gl.x.yontem && gl.x.giren && /diğer gelir/.test(gl.net) && /357/.test(gl.net), 'diğer gelir kaydı / Net yanlış: ' + JSON.stringify(gl));
        const [indir] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), p.evaluate(() => apMuhasebe('csv'))]);
        const csv = fs.readFileSync(await indir.path(), 'utf8');
        dogrula(/AİDAT TAHSİLATLARI/.test(csv) && /E2E test forması/.test(csv) && /;357;|;357\r?\n|;357$/m.test(csv) && /NET;/.test(csv), 'muhasebe CSV eksik: ' + csv.slice(0, 300));
        await p.evaluate((id) => AP.a.gelirSil(id), gl.x.id);
      }
      dogrula(await p.locator('#tmp-aidat .ap-bl #ap-bl-gun').count() === 1, 'aylık hatırlatma kutusu yok');
      if (process.env.E2E_EKRAN) { await p.locator('#tmp-aidat .ap-kpi > button[data-k="bekleyen"]').click(); await p.locator('#ap-kpi-detay').scrollIntoViewIfNeeded(); }
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
      await p.locator('#milo-aidat-panel-kap .ap-form .ap-yon label', { hasText: 'Kart' }).click();
      await p.locator('#milo-aidat-panel-kap .ap-form .ap-btn.ana').click();
      await p.waitForFunction((a) => AP.v && AP.v.od.some((q) => q.k.ad === a), A, { timeout: 15000 });
      const d = (await miloApi('/dues')).d.dues.filter((x) => x.ad === A && x.odendi);
      esit(d.length, 4, 'Milo: bu ay + 2 eski ay + eski kayıt ödendi olmalı');
      dogrula(d.some((x) => x.ay === ay && x.odemeTarihi === bugun && x.tutar === 900 && x.yontem === 'kart' && x.giren), 'Milo bu ay kaydı yanlış: ' + JSON.stringify(d.find((x) => x.ay === ay)));
      // üye kartları sekmesi hâlâ çalışıyor
      await p.evaluate(() => { miloAidatGorunum = 'kartlar'; miloAidatCiz(); }); await p.waitForSelector('#milo-aidat-arama');
      if (process.env.E2E_EKRAN) { await p.evaluate(() => { miloAidatGorunum = 'panel'; miloAidatCiz(); }); await p.screenshot({ path: process.env.E2E_EKRAN + '-milo.png' }); }
      esit(hatalar.length, 0, 'Milo sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
  } finally {
    for (const m of [0, -1, -2, -3]) await miloApi(`/dues/${encodeURIComponent(A)}/${ayEkle(ay, m)}`, { method: 'PUT', body: JSON.stringify({ odendi: false, tutar: null, notMetin: null, odemeTarihi: null, tarih: bugun }) }).catch(() => {});
    await miloApi(`/members/${encodeURIComponent(G)}/${encodeURIComponent(A)}`, { method: 'DELETE' }).catch(() => {});
  }
  log('📊 aidat paneli (DAĞ + Milo): sayfalı liste, ödemiş olabilir, eski borç, arama, tek tık + toplu ödendi, yöntem/kasa/teslim, diğer gelir + muhasebe, gelmiyor, yıl özeti, telefon ✓');
}
