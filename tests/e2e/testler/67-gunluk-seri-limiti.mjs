// Günlük seri limiti (2026-10-27): yalnız BUGÜN atılan seriler sayılır. Eskiden aktif karttaki tüm seriler sayılıyordu;
// kart arşivlenmeyince önceki günlerin serileri birikiyor, tablette her oyunda "günlük seri limiti doldu" çıkıyordu.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    const r = await p.evaluate(() => {
      const g = Object.keys(turnuvaDB).find((k) => turnuvaDB[k] && Object.keys(turnuvaDB[k]).length);
      const ad = Object.keys(turnuvaDB[g])[0], sp = turnuvaDB[g][ad];
      const yedek = JSON.stringify({ seriler: sp.seriler, detayliOklar: sp.detayliOklar, toplamSkor: sp.toplamSkor, xAdet: sp.xAdet, devamModu: sp.devamModu });
      const limit = parseInt(document.getElementById('toplam-seri-ayar').value) || 12;
      const dun = new Date(Date.now() - 86400000), dunISO = bugunISO(dun);
      const seri = (tarih, t) => ({ seriId: 'test_' + Math.random(), puan: 27, oklar: ['9', '9', '9'], tarih, t });
      sp.devamModu = false;
      // dünden limit kadar seri → bugün yine kaydedebilmeli
      sp.seriler = Array.from({ length: limit }, () => seri(dunISO, dun.getTime()));
      const eski = { sayi: bugunkuSeriSayisi(sp) };
      // bugünden limit kadar seri → limit dolmalı (çekirdek kayıt reddeder)
      sp.seriler = sp.seriler.concat(Array.from({ length: limit }, () => seri(bugunISO(), Date.now())));
      const bugun = { sayi: bugunkuSeriSayisi(sp), sonuc: _skorKaydetCekirdek(g, ad, [{ puan: '9' }, { puan: '9' }, { puan: '9' }]).sebep || 'ok' };
      // tarih alanı olmayan eski seri zaman damgasından değerlendirilir
      const zamanli = bugunkuSeriSayisi({ seriler: [{ t: dun.getTime() }, { t: Date.now() }, {}] });
      Object.assign(sp, JSON.parse(yedek));
      return { limit, eski, bugun, zamanli };
    });
    esit(r.eski.sayi, 0, 'dünkü seriler bugünün sayısına girdi');
    esit(r.bugun.sayi, r.limit, 'bugünkü seri sayısı');
    esit(r.bugun.sonuc, 'limit-doldu', 'bugün limit kadar seri atan için limit dolmadı');
    esit(r.zamanli, 1, 'tarihsiz seri zaman damgasından sayılmadı');
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
    log(`limit ${r.limit}: dünkü ${r.limit} seri sayılmıyor, bugünkü ${r.limit} seriyle limit doluyor`);
  } finally { await ctx.close(); }
}
