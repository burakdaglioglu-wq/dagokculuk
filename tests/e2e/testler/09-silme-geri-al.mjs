// Kesin silme, Silinenlerden geri alma, sahipsiz isim bağlama ve "Buluttan yenile" kopya seri hatası (2026-10-02).
// Kullanıcı: "bazı sporcuları sildiğimde geri tekrar sisteme düşüyor", "yanlışlıkla sildiğimi silinenlerden düzgün
// geri çekmem gerekiyor", "Deniz Yılmaz ile Deniz Tuna Yılmaz aynı kişi, birleştiremiyorum".
import { api, esit, dogrula, benzersiz, sayfaAc, uygulamaAc } from '../yardimci.mjs';

const isaretli = async (g, ad) => (await api('/api/athletes/deleted')).d.deleted.some((x) => x.grup === g && x.ad === ad && !x.tasindi);
const seriAktif = async (g, ad, id) => JSON.stringify((await api(`/api/series?grup=${g}&ad=${encodeURIComponent(ad)}`)).d).includes(id);

export default async function ({ log }) {
  const g = 'buyukler', S = benzersiz('SIL '), H = benzersiz('HDF '), bugun = new Date().toISOString().slice(0, 10);
  const temizle = [];
  try {
    // 1) Silinen sporcu, silmeden SONRA güncellenmiş bir kopya gelse de dirilmez
    await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: g, ad: S, lastModified: Date.now() }) });
    const sid = 'e2e_sil_' + Date.now();
    await api('/api/series', { method: 'POST', body: JSON.stringify({ seriId: sid, grup: g, ad: S, oklar: ['10', '9', '9'], puan: 28, tarih: bugun, t: Date.now() }) });
    await api('/api/series/cancel-batch', { method: 'POST', body: JSON.stringify({ seriIds: [sid] }) }); // istemci silerken serileri iptal eder
    esit((await api(`/api/athletes/${g}/${encodeURIComponent(S)}`, { method: 'DELETE' })).s, 200, 'silme başarısız');
    const yeniden = await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: g, ad: S, lastModified: Date.now() + 60000 }) });
    esit(yeniden.s, 409, 'silinmiş sporcu yeni zaman damgasıyla geri yaratıldı');
    dogrula(await isaretli(g, S), 'silme işareti kalktı (sporcu dirildi)');

    // 2) Geri al: işaret kalkar, silmede iptal edilen seri geri açılır
    const geri = await api(`/api/athletes/${g}/${encodeURIComponent(S)}/restore`, { method: 'POST', body: '{}' });
    esit(geri.s, 200, 'geri alma başarısız');
    dogrula(geri.d.restored && (geri.d.seriIds || []).includes(sid), 'geri alma seriyi döndürmedi');
    dogrula(!(await isaretli(g, S)), 'geri almadan sonra hâlâ silinmiş');
    dogrula(await seriAktif(g, S, sid), 'seri geri açılmadı');
    temizle.push([g, S]);

    // 3) Sahipsiz isim (sporcu kaydı yok, sadece yoklama) bir sporcuya bağlanır
    await api('/api/athletes', { method: 'POST', body: JSON.stringify({ grup: 'yildizlar', ad: H + ' TUNA YILMAZ', lastModified: Date.now() }) });
    const hayalet = H + ' TUNA YİLMAZ';
    await api('/api/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: bugun, ad: hayalet, grup: 'yildizlar', saat: '17:00' }) });
    const m = await api(`/api/athletes/yildizlar/${encodeURIComponent(hayalet)}/merge`, { method: 'POST', body: JSON.stringify({ toGrup: 'yildizlar', toAd: H + ' TUNA YILMAZ' }) });
    esit(m.s, 200, 'sahipsiz isim bağlanamadı: ' + JSON.stringify(m.d));
    const yok = (await api('/api/attendance/auto?tarih=' + bugun)).d.attendance.map((a) => a.ad);
    dogrula(yok.includes(H + ' TUNA YILMAZ') && !yok.includes(hayalet), 'yoklama doğru sporcuya taşınmadı');
    temizle.push(['yildizlar', H + ' TUNA YILMAZ']);

    // 4) "Buluttan yenile" numarasız kopya seri eklemez
    const { ctx, p } = await sayfaAc();
    try {
      await uygulamaAc(p);
      await p.evaluate(() => bulutManuelYenile()); await p.waitForTimeout(4000);
      const n = await p.evaluate(([g, ad]) => ((turnuvaDB[g][ad] || {}).seriler || []).map((x) => x.seriId), [g, S]);
      dogrula(n.length === 1 && n[0] === sid, 'yenilemeden sonra seriler: ' + JSON.stringify(n));
    } finally { await ctx.close(); }
    log('silme kesin, geri alma serileri döndürüyor, sahipsiz isim bağlanıyor, yenileme kopya eklemiyor');
  } finally {
    for (const [gg, ad] of temizle) await api(`/api/athletes/${gg}/${encodeURIComponent(ad)}`, { method: 'DELETE' });
  }
}
