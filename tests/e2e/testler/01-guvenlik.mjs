// Oturum gerektiren okuma/yazmalar, KVKK alan gizleme, null koruması.
import { api, esit, dogrula, benzersiz } from '../yardimci.mjs';

export default async function ({ log }) {
  const girisli = ['/api/dues', '/api/personnel', '/api/attendance/personnel', '/api/gider', '/api/backups', '/api/ihtiyac', '/api/tanitim/ziyaret-ozet', '/api/athlete-moves/kopuk', '/api/meta/kisi_notlari', '/api/meta/personel_ders_ucret', '/api/milo/dues', '/api/milo/personnel', '/api/milo/members', '/api/milo/member-skills'];
  for (const y of girisli) esit((await api(y, {}, true)).s, 401, `${y} girişsiz okunabiliyor`);
  for (const y of ['/api/athletes', '/api/series', '/api/antrenman-programi', '/api/meta/kisi_turleri']) esit((await api(y, {}, true)).s, 200, `${y} herkese açık kalmalı`);
  esit((await api('/api/athletes/buyukler/YOK%20BOYLE', { method: 'DELETE' }, true)).s, 401, 'sporcu silme girişsiz yapılabiliyor');
  esit((await api('/api/athletes/buyukler/YOK/rename', { method: 'POST', body: JSON.stringify({ yeniAd: 'X' }) }, true)).s, 401, 'isim değiştirme girişsiz yapılabiliyor');
  esit((await api('/api/meta/kisi_notlari', { method: 'PUT', body: JSON.stringify({ value: '{}' }) }, true)).s, 401, 'kişi notları girişsiz yazılabiliyor');

  // KVKK: girişsiz sporcu okumasında kişisel alanlar YOK (null değil, hiç yok), girişli okumada var
  const AD = benzersiz('GUV ');
  await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'yildizlar', ad: AD, lastModified: Date.now() }) });
  await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'PATCH', body: JSON.stringify({ fields: { acilTelefon: '05550000000', dogumTarihi: '2014-01-02', genelNot: 'not', hazirOlma_json: JSON.stringify({ tarih: '2026-01-01', sakatlik: true, sakatlikNotu: 'x' }) }, lastModified: Date.now() + 5 }) });
  try {
    const acik = (await api('/api/athletes', {}, true)).d.athletes.find((a) => a.ad === AD);
    for (const f of ['acilTelefon', 'dogumTarihi', 'genelNot']) dogrula(!(f in acik), `girişsiz okumada ${f} var`);
    dogrula(acik.hazirOlma && acik.hazirOlma.tarih && !('sakatlikNotu' in acik.hazirOlma), 'hazır olma anketinde sağlık bilgisi girişsiz görünüyor');
    const tam = (await api('/api/athletes')).d.athletes.find((a) => a.ad === AD);
    esit(tam.acilTelefon, '05550000000', 'girişli okumada telefon yok');
    // null yok sayılır, '' temizler
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'PATCH', body: JSON.stringify({ fields: { acilTelefon: null }, lastModified: Date.now() + 10 }) });
    esit((await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`)).d.athlete.acilTelefon, '05550000000', 'null gönderimi telefonu sildi');
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'PATCH', body: JSON.stringify({ fields: { acilTelefon: '' }, lastModified: Date.now() + 20 }) });
    esit((await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`)).d.athlete.acilTelefon, '', 'boş metin telefonu temizlemedi');
    log(`${girisli.length} girişli okuma, KVKK gizleme ve null koruması doğru`);
  } finally {
    await api(`/api/athletes/yildizlar/${encodeURIComponent(AD)}`, { method: 'DELETE' });
  }
}
