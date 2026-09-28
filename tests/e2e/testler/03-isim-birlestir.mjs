// Veri kaybısız isim düzeltme / grup değişimi (/rename), birleştirme (/merge), eski taşıma onarımı.
import { api, esit, dogrula, benzersiz } from '../yardimci.mjs';

const seriVar = async (g, ad, id) => JSON.stringify((await api(`/api/series?grup=${g}&ad=${encodeURIComponent(ad)}`)).d).includes(id);
const yoklamaVar = async (ad, t) => JSON.stringify((await api('/api/attendance/auto?tarih=' + t)).d).includes(ad);

export default async function ({ log }) {
  const A = benzersiz('ISM '), A2 = A + ' DUZ', M = benzersiz('BRL '), M2 = benzersiz('BRL '), T = benzersiz('TSI ');
  const temizle = [];
  try {
    // /rename: seri + yoklama + alanlar yeni isme, sonra grup değişimi
    await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'buyukler', ad: A, lastModified: Date.now() }) });
    await api(`/api/athletes/buyukler/${encodeURIComponent(A)}`, { method: 'PATCH', body: JSON.stringify({ fields: { acilTelefon: '0555' }, lastModified: Date.now() + 5 }) });
    const sid = 'e2e_' + Date.now();
    await api('/api/series', { method: 'POST', body: JSON.stringify({ seriId: sid, grup: 'buyukler', ad: A, oklar: ['9', '9', '9'], puan: 27, tarih: '2026-09-20', t: Date.now() }) });
    await api('/api/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: '2026-09-20', ad: A, grup: 'buyukler', saat: '17:00', elle: true, geldi: true }) });
    esit((await api(`/api/athletes/buyukler/${encodeURIComponent(A)}/rename`, { method: 'POST', body: JSON.stringify({ yeniAd: A2 }) })).s, 200, 'rename başarısız');
    dogrula(await seriVar('buyukler', A2, sid), 'seri yeni isme taşınmadı');
    dogrula(await yoklamaVar(A2, '2026-09-20'), 'yoklama yeni isme taşınmadı');
    esit((await api(`/api/athletes/buyukler/${encodeURIComponent(A2)}`)).d.athlete.acilTelefon, '0555', 'alanlar taşınmadı');
    esit((await api(`/api/athletes/buyukler/${encodeURIComponent(A2)}/rename`, { method: 'POST', body: JSON.stringify({ yeniAd: A2, yeniGrup: 'yildizlar' }) })).s, 200, 'grup değişimi başarısız');
    dogrula(await seriVar('yildizlar', A2, sid), 'seri yeni gruba taşınmadı');
    temizle.push(['yildizlar', A2]);

    // /merge
    await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'buyukler', ad: M, lastModified: Date.now() }) });
    await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'buyukler', ad: M2, lastModified: Date.now() }) });
    const sid2 = 'e2e_m_' + Date.now();
    await api('/api/series', { method: 'POST', body: JSON.stringify({ seriId: sid2, grup: 'buyukler', ad: M2, oklar: ['8'], puan: 8, tarih: '2026-09-21', t: Date.now() }) });
    esit((await api(`/api/athletes/buyukler/${encodeURIComponent(M2)}/merge`, { method: 'POST', body: JSON.stringify({ toGrup: 'buyukler', toAd: M }) })).s, 200, 'merge başarısız');
    dogrula(await seriVar('buyukler', M, sid2), 'birleştirmede seri taşınmadı');
    dogrula(!(await api('/api/athletes')).d.athletes.some((x) => x.ad === M2), 'birleştirilen kaynak silinmedi');
    temizle.push(['buyukler', M]);

    // eski usul taşıma (move) → kopuk seri → onar
    await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'yildizlar', ad: T, lastModified: Date.now() }) });
    const sid3 = 'e2e_t_' + Date.now();
    await api('/api/series', { method: 'POST', body: JSON.stringify({ seriId: sid3, grup: 'yildizlar', ad: T, oklar: ['7'], puan: 7, tarih: '2026-09-22', t: Date.now() }) });
    await api(`/api/athletes/yildizlar/${encodeURIComponent(T)}/move`, { method: 'POST', body: JSON.stringify({ toGrup: 'minikler' }) });
    dogrula((await api('/api/athlete-moves/kopuk')).d.kopuk.some((k) => k.hedefAd === T && k.seri === 1), 'kopuk veri tespit edilmedi');
    esit((await api('/api/athlete-moves/onar', { method: 'POST', body: '{}' })).s, 200, 'onarım başarısız');
    dogrula(await seriVar('minikler', T, sid3), 'onarım seriyi bağlamadı');
    dogrula(!(await api('/api/athlete-moves/kopuk')).d.kopuk.some((k) => k.hedefAd === T), 'onarımdan sonra hâlâ kopuk');
    temizle.push(['minikler', T]);
    log('rename, grup değişimi, birleştirme ve taşıma onarımı veri kaybetmeden çalışıyor');
  } finally {
    for (const [g, ad] of temizle) await api(`/api/athletes/${g}/${encodeURIComponent(ad)}`, { method: 'DELETE' });
  }
}
