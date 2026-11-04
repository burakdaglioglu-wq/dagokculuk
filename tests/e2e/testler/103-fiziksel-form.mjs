// Fiziksel dosya + kayıt formu (2026-11-05, v378). Oturumsuz görsel yok (çocuk fotoğrafı, izin=1 yolu yok); duruş fotoğrafı veli onayı olmadan yüklenmez; ad değişince
// fotoğraflar taşınır; PDF kişiye özel + boş; form okuma: API anahtarı yoksa anlaşılır hata; okunan bilgi onaysız kaydedilmez, kayıtlıdan farklı değer varsayılan yazılmaz,
// geçersiz telefon yazılmaz; onay sonrası veli, meslek, ölçüm ve form fotoğrafı kaydolur; 390/360 px taşma yok. Yapay zekânın gerçek okuması burada SAHTE yanıtla sınanır.
import { api, esit, dogrula, benzersiz, sayfaAc, uygulamaAc, yoneticiAc, B } from '../yardimci.mjs';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==';

export default async function ({ log }) {
  let AD = benzersiz('FZ '), yeniAd = null; const AD2 = benzersiz('FZOKU ');
  const yol = () => `/api/fiziksel/yildizlar/${encodeURIComponent(AD)}`;
  for (const a of [AD, AD2]) await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'yildizlar', ad: a, lastModified: Date.now() }) });
  try {
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD2)}`, { method: 'PATCH', body: JSON.stringify({ fields: { acilKisi: 'Eski Veli', biyomotorTestleri_json: JSON.stringify([{ id: 'b1', tarih: '2026-09-01', boy: 150, kilo: 43, t: 1 }]) }, lastModified: Date.now() }) });
    // güvenlik
    esit((await api(yol(), {}, true)).s, 401, 'liste oturumsuz okunuyor');
    esit((await api(yol(), { method: 'POST', body: JSON.stringify({ tur: 'form', tarih: '2026-11-01', veri: PNG }) }, true)).s, 401, 'oturumsuz yükleme açık');
    esit((await api(yol(), { method: 'POST', body: JSON.stringify({ tur: 'on', tarih: '2026-11-01', veri: PNG }) })).s, 400, 'duruş fotoğrafı onaysız yüklendi');
    esit((await api(yol(), { method: 'POST', body: JSON.stringify({ tur: 'on', tarih: 'kotu', veri: PNG, veliOnayi: true }) })).s, 400, 'geçersiz tarih kabul edildi');
    const y = await api(yol(), { method: 'POST', body: JSON.stringify({ tur: 'on', tarih: '2026-09-02', veri: PNG, veliOnayi: true }) });
    esit(y.s, 200, 'yükleme başarısız'); const id = y.d.id;
    await api(yol(), { method: 'POST', body: JSON.stringify({ tur: 'on', tarih: '2026-11-03', veri: PNG, veliOnayi: true }) });
    esit((await fetch(`${B}/api/fiziksel-foto/${id}`)).status, 401, 'görsel oturumsuz açılıyor');
    esit((await fetch(`${B}/api/fiziksel-ozet`)).status, 401, 'özet oturumsuz açılıyor');
    esit((await api('/api/form-oku', { method: 'POST', body: JSON.stringify({ veri: PNG }) }, true)).s, 401, 'form okuma oturumsuz açık');
    // ad değişince taşınır
    yeniAd = AD + ' X';
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}/rename`, { method: 'POST', body: JSON.stringify({ yeniAd, zaman: Date.now(), lastModified: Date.now() }) });
    AD = yeniAd;
    esit((await api(yol())).d.fotolar.length, 2, 'ad değişince fotoğraflar kayboldu');

    for (const [w, h] of [[1280, 900], [390, 844], [360, 740]]) {
      const { ctx, p, hatalar } = await sayfaAc({ genislik: w, yukseklik: h });
      try {
        await uygulamaAc(p);
        await yoneticiAc(p, 'fiziksel');
        await p.waitForFunction(() => typeof fzCiz === 'function', null, { timeout: 15000 });
        await p.waitForSelector('#fz-satirlar', { timeout: 15000 });
        await p.fill('#fz-ara', AD); await p.waitForSelector('.fz-sat');
        dogrula((await p.locator('.fz-sat').first().innerText()).includes('2 fotoğraf') || (await p.waitForFunction(() => document.querySelector('.fz-sat')?.innerText.includes('2 fotoğraf'), null, { timeout: 8000 })), 'liste fotoğraf sayısı');
        dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), w + ' liste taşıyor');
        await p.locator('.fz-sat').first().click();
        await p.waitForSelector('#fz-ad');
        esit(await p.locator('.fz-foto').count(), 2, 'dosyada 2 fotoğraf');
        await p.waitForFunction(() => document.querySelector('.fz-foto.dolu'), null, { timeout: 8000 });
        await p.locator('.fz-alt .fz-btn', { hasText: 'Karşılaştır' }).click();
        esit(await p.locator('.fz-iki select').count(), 2, 'iki tarih seçici');
        dogrula(await p.evaluate(() => { const x = document.getElementById('fz-ekran'); return x.scrollWidth <= x.clientWidth + 1; }), w + ' karşılaştır taşıyor');
        await p.evaluate(() => fzKapat());
        // PDF
                const pdf = await p.evaluate(async () => { const pd = await _yeniPdfAl('portrait'); _fzIc.formSayfa(pd, null); pd.addPage(); const sp = Object.values(turnuvaDB.yildizlar)[0]; _fzIc.formSayfa(pd, { g: 'yildizlar', ad: 'DENEME ŞİŞLİ', sp: Object.assign({}, sp, { acilTelefon: '05551112233', acilKisi: 'Veli Ğ' }) }); return { n: pd.getNumberOfPages(), m: pd.output('datauristring').length }; });
        esit(pdf.n, 2, 'PDF sayfa sayısı'); dogrula(pdf.m > 5000, 'PDF boş');
        // Sahte okuma: gerçek yanıt yerine; önce anahtar yok hatası
        await p.evaluate(() => fzFormSec());
        dogrula(await p.locator('#fz-form-dosya').isDisabled(), 'onaysız fotoğraf seçilebiliyor');
        await p.locator('#fz-ekran .fz-onay input').check();
        await p.route('**/api/form-oku', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'anahtar-yok' }) }));
        await p.setInputFiles('#fz-form-dosya', { name: 'f.png', mimeType: 'image/png', buffer: Buffer.from(PNG.split(',')[1], 'base64') });
        await p.waitForSelector('#fz-form-dosya'); // hata sonrası başa döner, veri kaybı yok
        await p.unroute('**/api/form-oku');
        await p.route('**/api/form-oku', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ alanlar: { sporcuAd: AD2, dogumTarihi: '2015-03-04', cinsiyet: 'K', veli1Ad: 'Yeni Veli', veli1Telefon: '05551234567', veli1Meslek: 'Mimar', veli2Ad: 'İkinci Veli', veli2Telefon: '123', veli2Meslek: 'Doktor', olcumTarihi: '2026-11-03', boy: 152, kilo: 44, kavramaGucu: 21, esneklik: null, denge: null, plank: 65, kvkkOnay: true, yapayZekaOnay: true, fizikselFotoOnay: true, imzaVar: false, belirsiz: ['veli1Telefon'] } }) }));
        await p.locator('#fz-ekran .fz-onay input').check();
        await p.setInputFiles('#fz-form-dosya', { name: 'f.png', mimeType: 'image/png', buffer: Buffer.from(PNG.split(',')[1], 'base64') });
        await p.waitForSelector('#fz-oku-kaydet');
        esit(await p.locator('#fz-hedef').inputValue(), 'yildizlar|' + AD2, 'sporcu eşleşmedi');
        dogrula(!(await p.locator('#fz-y-veli1Ad').isChecked()), 'kayıtlıdan farklı veli adı varsayılan yazılıyor');
        dogrula(await p.locator('#fz-y-veli1Telefon').isChecked(), 'boş telefon alanı işaretli olmalı');
        dogrula(await p.locator('#fz-y-veli2Telefon').isDisabled(), 'geçersiz telefon yazılabiliyor');
        dogrula((await p.locator('#fz-uyari').innerText()).includes('İmza'), 'imza uyarısı yok');
        dogrula(await p.locator('.fz-ks.bel').count() >= 1, 'belirsiz alan işaretli değil');
        dogrula(await p.evaluate(() => { const x = document.getElementById('fz-ekran'); return x.scrollWidth <= x.clientWidth + 1; }), w + ' kontrol ekranı taşıyor');
        esit((await api(`/api/athletes/yildizlar/${encodeURIComponent(AD2)}`)).d.athlete.acilTelefon || null, w === 1280 ? null : '05551234567', 'onaysız kaydedildi');
        await p.unroute('**/api/form-oku');
        if (w === 1280) {
          await p.locator('#fz-oku-kaydet').click();
          await p.waitForSelector('#fz-ad', { timeout: 15000 });
          const a = (await api(`/api/athletes/yildizlar/${encodeURIComponent(AD2)}`)).d.athlete;
          esit(a.acilTelefon, '05551234567', 'telefon kaydolmadı'); esit(a.acilKisi, 'Eski Veli', 'farklı değer üstüne yazıldı'); esit(a.aileMeslek, 'Mimar / Doktor', 'meslek'); esit(a.veli2Telefon || null, null, 'geçersiz telefon kaydoldu'); esit(a.dogumYili, 2015, 'doğum yılı');
          esit(a.biyomotorTestleri.length, 2, 'ölçüm eklenmedi'); dogrula(a.biyomotorTestleri.some((o) => o.id === 'b1'), 'eski ölçüm silindi');
          const f = (await api(`/api/fiziksel/yildizlar/${encodeURIComponent(AD2)}`)).d.fotolar; esit(f.length, 1, 'form fotoğrafı eklenmedi'); esit(f[0].tur, 'form', 'form türü');
        }
        esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
      } finally { await ctx.close(); }
    }
    // silme
    esit((await api(`/api/fiziksel-foto/${id}`, { method: 'DELETE' }, true)).s, 401, 'oturumsuz silme açık');
    esit((await api(`/api/fiziksel-foto/${id}`, { method: 'DELETE' })).s, 200, 'silinemedi');
    esit((await api(yol())).d.fotolar.length, 1, 'silme çalışmadı');
    log('güvenlik, onay, ad değişimi, karşılaştırma, PDF, okuma kontrol ekranı (sahte yanıt), 1280/390/360');
  } finally {
    for (const a of [AD, AD2]) {
      const f = await api(`/api/fiziksel/yildizlar/${encodeURIComponent(a)}`).catch(() => null);
      for (const x of (f?.d?.fotolar || [])) await api(`/api/fiziksel-foto/${x.id}`, { method: 'DELETE' }).catch(() => { });
      await api(`/api/athletes/yildizlar/${encodeURIComponent(a)}`, { method: 'DELETE' }).catch(() => { });
    }
  }
}
