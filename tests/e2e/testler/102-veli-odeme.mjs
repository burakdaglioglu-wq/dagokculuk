// Veli ödeme ekranı (2026-11-04, v377 — kullanıcı: "velilerin girebileceği, ödemelerinin ne zaman geleceğini ve ne ödediğini bildiği bir sistem").
// Link + telefonun son 4 hanesi; yanlış numara reddedilir, 5 yanlışta kilit; oturumsuz okuma yok; numara değişince oturum biter; başka sporcu,
// not ve telefon sızmaz; herkese açık rapor linkinde hâlâ tutar yok; ekran 390/360 px taşmaz, takvimde aya dokununca ayrıntı açılır.
import { api, esit, dogrula, benzersiz, sayfaAc, uygulamaAc, B } from '../yardimci.mjs';

const ipUret = () => '10.' + Array.from({ length: 3 }, () => Math.floor(Math.random() * 250)).join('.');
async function veliGiris(kod, son4, ip) {
  const r = await fetch(B + '/api/veli-odeme/giris', { method: 'POST', headers: { 'content-type': 'application/json', 'cf-connecting-ip': ip || ipUret() }, body: JSON.stringify({ kod, son4 }) });
  return { s: r.status, d: await r.json().catch(() => ({})) };
}
async function veliOku(token, yil) {
  const r = await fetch(B + '/api/veli-odeme' + (yil ? '?yil=' + yil : ''), { headers: token ? { 'x-veli-oturum': token } : {} });
  return { s: r.status, d: await r.json().catch(() => ({})) };
}

export default async function ({ log }) {
  const AD = benzersiz('VELI '), AD2 = benzersiz('VELIB '), n = new Date();
  const ay = (k) => { const d = new Date(n.getFullYear(), n.getMonth() + k, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
  const damga = new Date().toISOString();
  for (const a of [AD, AD2]) await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'yildizlar', ad: a, lastModified: Date.now() }) });
  try {
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'PATCH', body: JSON.stringify({ fields: { acilTelefon: '0555 111 22 33', veli2Telefon: '05446667788' }, lastModified: Date.now() }) });
    const koy = (a, m, g) => api(`/api/dues/${encodeURIComponent(a)}/${m}`, { method: 'PUT', body: JSON.stringify({ tarih: damga, ...g }) });
    await koy(AD, ay(-3), { odendi: true, tutar: 1400, odemeTarihi: ay(-3) + '-05', yontem: 'kart', notMetin: 'GIZLI-NOT-A' });
    await koy(AD, ay(-2), { odendi: false, notMetin: '❄️ dondu' });
    await koy(AD, ay(-1), { odendi: true, tutar: 1500, odemeTarihi: ay(-1) + '-02', yontem: 'iban', veliNot: 'Teşekkürler, EFT alındı' });
    // eski sürüm cihaz / master senkronu veliNot göndermeden yazar: veliye not KORUNMALI (2026-11-09)
    await api(`/api/dues/${encodeURIComponent(AD)}/${ay(-1)}`, { method: 'PUT', body: JSON.stringify({ tarih: new Date(Date.now() + 1000).toISOString(), odendi: true, tutar: 1500, odemeTarihi: ay(-1) + '-02', yontem: 'iban' }) });
    await koy(AD2, ay(-1), { odendi: true, tutar: 9999, odemeTarihi: ay(-1) + '-01' });
    const kod = (await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}/izle-kodu`, { method: 'POST' })).d.kod;
    const kod2 = (await api(`/api/athletes/yildizlar/${encodeURIComponent(AD2)}/izle-kodu`, { method: 'POST' })).d.kod;

    // oturumsuz / yanlış
    esit((await veliOku('')).s, 401, 'oturumsuz okuma açık');
    esit((await veliOku('uydurma-anahtar')).s, 401, 'uydurma anahtarla okuma açık');
    esit((await veliGiris(kod, '0000')).s, 401, 'yanlış numara kabul edildi');
    esit((await veliGiris(kod, 'abcd')).s, 400, 'harfli giriş reddedilmeli');
    esit((await veliGiris(kod2, '0000')).s, 401, 'telefonsuz sporcuya giriş açık');
    const bilgi2 = await (await fetch(B + '/api/veli-odeme/bilgi/' + kod2)).json();
    esit(bilgi2.telefonVar, false, 'telefonsuz sporcu işaretlenmeli');
    esit((await fetch(B + '/api/veli-odeme/bilgi/yanliskodyanliskod')).status, 404, 'yanlış kod 404 olmalı');

    // doğru: iki veliden biri de girer
    const g1 = await veliGiris(kod, '2233'), g2 = await veliGiris(kod, '7788');
    dogrula(g1.d.ok && g1.d.token, '1. veli giremedi'); dogrula(g2.d.ok && g2.d.token, '2. veli giremedi');
    const r = await veliOku(g1.d.token);
    esit(r.s, 200, 'okuma başarısız'); esit(r.d.ad, AD, 'başka sporcu döndü');
    const metin = JSON.stringify(r.d);
    for (const yok of ['GIZLI-NOT-A', '9999', '555', '7788', 'notMetin', 'giren', 'acilTelefon']) dogrula(!metin.includes(yok), 'sızıntı: ' + yok);
    esit(r.d.son.tutar, 1500, 'son ödeme tutarı'); esit(r.d.son.tarih, ay(-1) + '-02', 'son ödeme tarihi'); esit(r.d.son.yontem, 'iban', 'son ödeme yöntemi');
    esit(r.d.son.veliNot, 'Teşekkürler, EFT alındı', 'veliye not dönmeli (ve veliNot göndermeyen yazım silmemeli)');
    esit(r.d.siradaki.ay, ay(0), 'sıradaki bu ay olmalı'); esit(r.d.siradaki.tutar, 1500, 'sıradaki tutar son ödemeden gelmeli'); esit(r.d.gecikenAy, 0, 'dondurulan ay gecikmiş sayılmamalı');

    // eski yılda öncesi yok, dondurulan ay doğru: ay(-2) aynı yıldaysa durum dondu
    const yilData = (await veliOku(g1.d.token, ay(-2).slice(0, 4))).d;
    esit(yilData.aylar.find((a) => a.ay === ay(-2)).durum, 'dondu', 'dondurulan ay');
    esit(yilData.aylar.find((a) => a.ay === ay(-3))?.tutar ?? 1400, 1400, 'ödenen ayın tutarı');

    // herkese açık rapor linki hâlâ tutarsız
    const rapor = await fetch(`${B}/api/veli-rapor/${kod}?ay=${ay(-1)}`);
    dogrula(!(await rapor.text()).includes('1500'), 'rapor linkinde tutar çıkmamalı');

    // ekran
    for (const [w, h] of [[390, 844], [360, 740]]) {
      const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: w, yukseklik: h });
      try {
        await p.goto(`${B}/veli.html?kod=${kod}`);
        await p.waitForSelector('#son4');
        await p.fill('#son4', '1234'); await p.click('#gir');
        await p.waitForFunction(() => document.getElementById('hata')?.textContent.includes('eşleşmedi'));
        await p.fill('#son4', '2233'); await p.click('#gir');
        await p.waitForSelector('#izgara');
        esit(await p.locator('#izgara .ay').count(), 12, '12 ay olmalı');
        dogrula((await p.locator('#kahraman').innerText()).includes('1.500'), 'kartta sıradaki tutar yok');
        dogrula((await p.locator('#son').innerText()).includes('1.500'), 'son ödeme yok');
        dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), w + ' px yana taşma');
        await p.locator(`.ay[data-ay="${ay(0)}"]`).waitFor();
        await p.locator(`.ay[data-ay="${ay(0)}"]`).click();
        dogrula((await p.locator('#detay').innerText()).includes('bekleniyor'), 'ayrıntı açılmadı');
        const kucuk = await p.evaluate(() => [...document.querySelectorAll('#v button, #v a')].filter((b) => b.getBoundingClientRect().height < 44).length);
        esit(kucuk, 0, 'dokunma alanı 44 px altında');
        await p.reload(); await p.waitForSelector('#izgara'); // hatırlanır
        esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
      } finally { await ctx.close(); }
    }

    // 💳 rapor sayfası (2026-11-09): tutar ancak son 4 haneyle; oturum veli.html ile ortak
    {
      const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 390, yukseklik: 844 });
      try {
        await p.goto(`${B}/rapor.html?kod=${kod}&ay=${ay(-1)}`);
        await p.waitForSelector('#odeme-kart #od-son4');
        dogrula(!(await p.locator('#odeme-kart').innerText()).includes('1.500'), 'doğrulamadan tutar görünmemeli');
        await p.fill('#od-son4', '1234'); await p.click('#odeme-kart button[type=submit]');
        await p.waitForFunction(() => (document.querySelector('.od-hata') || {}).textContent);
        await p.fill('#od-son4', '2233'); await p.click('#odeme-kart button[type=submit]');
        await p.waitForSelector('#odeme-kart .od-bu');
        const kart = await p.locator('#odeme-kart').innerText();
        dogrula(kart.includes('1.500') && kart.includes('Havale'), 'kartta tutar/yöntem yok: ' + kart.slice(0, 120));
        dogrula(kart.includes('Teşekkürler, EFT alındı'), 'kartta veliye not yok');
        dogrula(!kart.includes('GIZLI-NOT-A'), 'iç not sızdı');
        dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'rapor 390 px yana taşma');
        await p.goto(`${B}/veli.html?kod=${kod}`); await p.waitForSelector('#izgara', { timeout: 15000 }); // aynı oturum: tekrar sorulmaz
        await p.locator(`.ay[data-ay="${ay(-1)}"]`).click();
        dogrula((await p.locator('#detay').innerText()).includes('Teşekkürler, EFT alındı'), 'veli.html ayrıntısında veliye not yok');
        esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
      } finally { await ctx.close(); }
    }

    // başka ailelerin yanlış denemeleri (aynı IP) doğru numarayı yazan veliyi kilitlemez
    const ortakIp = ipUret();
    for (let i = 0; i < 16; i++) await veliGiris(kod2, '1111', ortakIp);
    dogrula((await veliGiris(kod, '2233', ortakIp)).d.ok, 'aynı IP\'deki başka aile kilitledi');

    // hoca: Sıradaki veli gönderilmemişi açar, telefonsuz ve muaf atlanır, gönderilen işaretlenir
    {
      const { ctx, p } = await sayfaAc({ genislik: 390, yukseklik: 844 });
      try {
        await uygulamaAc(p);
        const s = await p.evaluate(async ({ AD, AD2 }) => {
          localStorage.removeItem('dag_aidat_gonderildi');
          const acilan = []; window.open = () => { const w = { close() { }, location: { set href(u) { acilan.push(u); } } }; return w; };
          _aidatVeliOzetListe = [{ g: 'yildizlar', ad: AD2, sp: {} }, { g: 'yildizlar', ad: 'MUAF', sp: { aidatMuaf: 1, acilTelefon: '05551234567' } }, { g: 'yildizlar', ad: AD, sp: { acilTelefon: '0555 111 22 33' } }];
          const ilk = aidatVeliOdemeKalanlar().map((o) => o.x.ad);
          aidatVeliOdemeSiradaki();
          for (let i = 0; i < 50 && !acilan.length; i++) await new Promise((r) => setTimeout(r, 100));
          return { ilk, acilan, kalan: aidatVeliOdemeKalanlar().length };
        }, { AD, AD2 });
        esit(JSON.stringify(s.ilk), JSON.stringify([AD]), 'telefonsuz ve muaf atlanmalı');
        const metin = decodeURIComponent(s.acilan[0] || '');
        dogrula(metin.includes('phone=905551112233') && metin.includes('/veli.html?kod=' + kod), 'WhatsApp bağlantısı yanlış: ' + metin.slice(0, 120));
        esit(s.kalan, 0, 'gönderilen işaretlenmedi');
      } finally { await ctx.close(); }
    }

    // numara değişince oturum biter
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'PATCH', body: JSON.stringify({ fields: { acilTelefon: '05550000000', veli2Telefon: '05441112299' }, lastModified: Date.now() + 1000 }) });
    esit((await veliOku(g1.d.token)).s, 401, 'numara değişince oturum bitmeli');
    esit((await veliOku(g2.d.token)).s, 401, 'değişen 2. numaranın oturumu bitmeli');

    // kilit: aynı koda 5 yanlış, doğru numara bile reddedilir
    const ip = ipUret();
    for (let i = 0; i < 5; i++) await veliGiris(kod, '1111', ip);
    const kilit = await veliGiris(kod, '0000', ip);
    esit(kilit.s, 429, '5 yanlıştan sonra kilit bekleniyordu'); esit(kilit.d.sebep, 'kilit', 'kilit sebebi');
    log('giriş, kilit, sızıntı yok, numara değişimi, 390/360 ekran');
  } finally {
    for (const a of [AD, AD2]) await api(`/api/athletes/yildizlar/${encodeURIComponent(a)}`, { method: 'DELETE' }).catch(() => { });
  }
}
