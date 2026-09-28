// Veliye aylık rapor: kod üretimi (girişli), /api/veli-rapor yalnızca o sporcuyu ve kişisel veri OLMADAN döner, sayfa açılır.
import { api, esit, dogrula, benzersiz, sayfaAc, B, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  const AD = benzersiz('VRP ');
  await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'yildizlar', ad: AD, lastModified: Date.now() }) });
  try {
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'PATCH', body: JSON.stringify({ fields: { acilTelefon: '05559998877' }, lastModified: Date.now() + 5 }) });
    const n = new Date(), ay = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
    await api('/api/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: ay + '-02', ad: AD, grup: 'yildizlar', saat: '17:00', elle: true, geldi: true }) });
    esit((await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}/izle-kodu`, { method: 'POST' }, true)).s, 401, 'rapor kodu girişsiz üretilebiliyor');
    const kod = (await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}/izle-kodu`, { method: 'POST' })).d.kod;
    dogrula(kod, 'rapor kodu üretilmedi');
    const r = await api(`/api/veli-rapor/${kod}?ay=${ay}`, {}, true);
    esit(r.s, 200, 'rapor verisi alınamadı');
    esit(r.d.ad, AD, 'rapor başka sporcuyu döndü');
    dogrula(r.d.yoklama.some((y) => y.geldi), 'rapor yoklamayı içermiyor');
    dogrula(!JSON.stringify(r.d).includes('05559998877'), 'rapor veli telefonunu sızdırıyor');
    esit((await api(`/api/veli-rapor/yanliskod?ay=${ay}`, {}, true)).s, 404, 'yanlış kod 404 dönmeli');
    const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 390, yukseklik: 844 });
    try {
      await p.goto(`${B}/rapor.html?kod=${kod}&ay=${ay}`);
      await p.waitForSelector('h1', { timeout: 20000 });
      dogrula(await p.locator('.gun.geldi').count() >= 1, 'rapor takviminde gelinen gün yok');
      dogrula(await yataydaTasmaYok(p), 'rapor sayfası telefonda taşıyor');
      esit(hatalar.length, 0, 'rapor sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
    log('kod, rapor verisi (kişisel veri yok), rapor sayfası tamam');
  } finally {
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'DELETE' });
  }
}
