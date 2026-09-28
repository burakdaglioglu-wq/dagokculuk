// Girişsiz açılan cihaz (gizlenmiş veri) sonradan giriş yapıp tam senkron gönderince gerçek kişisel veri SİLİNMEMELİ.
import { api, esit, benzersiz, sayfaAc, B, oturumAl } from '../yardimci.mjs';

export default async function ({ log }) {
  const AD = benzersiz('KVK ');
  await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'yildizlar', ad: AD, lastModified: Date.now() }) });
  await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'PATCH', body: JSON.stringify({ fields: { acilTelefon: '05550001122', acilKisi: 'Veli', dogumTarihi: '2014-05-06' }, lastModified: Date.now() + 10 }) });
  const { ctx, p, hatalar } = await sayfaAc({ girisli: false });
  try {
    await p.goto(B + '/app.html');
    await p.waitForFunction((n) => turnuvaDB.yildizlar && turnuvaDB.yildizlar[n], AD, { timeout: 90000 });
    esit(await p.evaluate((n) => 'acilTelefon' in turnuvaDB.yildizlar[n], AD), false, 'girişsiz cihaza telefon geldi');
    const token = await oturumAl();
    await p.evaluate((t) => { _oturumToken = t; }, token);
    await p.evaluate((n) => { let sp = turnuvaDB.yildizlar[n]; sp.sinif = '5A'; sp.lastModified = Date.now(); bekleyenGonderim = true; bulutaGonderKontrol(); }, AD);
    let a = null;
    for (let i = 0; i < 40 && !(a && a.sinif === '5A'); i++) { await p.waitForTimeout(1500); a = (await api('/api/athletes')).d.athletes.find((x) => x.ad === AD); }
    esit(a && a.sinif, '5A', 'senkron sunucuya ulaşmadı');
    esit(a.acilTelefon, '05550001122', 'senkron veli telefonunu sildi');
    esit(a.dogumTarihi, '2014-05-06', 'senkron doğum tarihini sildi');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('girişsiz→girişli cihaz senkronu kişisel veriyi korudu');
  } finally {
    await ctx.close();
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'DELETE' });
  }
}
