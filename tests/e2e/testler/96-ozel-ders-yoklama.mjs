// 📋 Özel Ders › Yoklama (2026-11-03, kullanıcı: "özel dersler için bir yoklama listesi oluştur"). Doğrulanan: ana sayfada
// Yoklama düğmesi ve özet kartı; tarih başına Geldi/Gelmedi/Telafi/İptal (aynı düğmeye tekrar basmak kaldırır); o gün puan
// girilmiş ders otomatik "geldi"; ders saatinde günün adı geçen öğrenci "bu gün dersi var"; paket (geldi + telafi düşer);
// aylık çizelge + ay özeti metni; 390 px'te taşma yok.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    yedek = await p.evaluate(() => localStorage.getItem('dag_ozel_ders'));
    const k = await p.evaluate(() => {
      aktifPlatform = 'egitmen'; tablariPlatformaGoreAyarla(); const ge = document.getElementById('giris-ekrani'); if (ge) ge.style.display = 'none';
      sekmeAc('ozelders');
      const g = Object.keys(turnuvaDB).find((x) => turnuvaDB[x] && typeof turnuvaDB[x] === 'object' && Object.keys(turnuvaDB[x]).some((a) => turnuvaDB[x][a] && !turnuvaDB[x][a].pasif));
      const ad = Object.keys(turnuvaDB[g]).find((a) => turnuvaDB[g][a] && !turnuvaDB[g][a].pasif);
      return g + '|' + ad;
    });
    const tarihler = await p.evaluate((k) => {
      const t = ozdBugun(), dun = ozdTarihEkle(t, -1), once = ozdTarihEkle(t, -2), [g, ad] = ozdAyir(k);
      const gun = OZD_GUNLER[new Date(t + 'T12:00:00').getDay()];
      ozdYaz('ogr|' + k, { g, ad, aktif: true, saatler: gun.charAt(0).toLocaleUpperCase('tr-TR') + gun.slice(1) + ' 17:00', paket: '' });
      ['yok|' + k + '|' + t, 'yok|' + k + '|' + dun, 'yok|' + k + '|' + once].forEach((x) => { const d = ozdDepo(); delete d[x]; kyDepoYazYerel('ozel_ders', d); });
      ozdYaz('ders|' + k + '|' + once, { g, ad, tarih: once, hareketler: ['ucak'], kayitlar: [{ id: 'y1', h: 'ucak', p: ['7'], t: 1 }], not: '' });
      const d0 = ozdDepo(); delete d0['ders|' + k + '|' + t]; delete d0['ders|' + k + '|' + dun]; kyDepoYazYerel('ozel_ders', d0);
      _ozdSecili = null; _ozdYoklama = false; ozdCiz();
      return { t, dun, once };
    }, k);
    dogrula(await p.locator('.ozd-bas-btn button', { hasText: 'Yoklama' }).isVisible(), 'Yoklama düğmesi yok');
    dogrula(/Bugün 1 öğrencinin dersi var|Bugün \d+ öğrencinin dersi var/.test(await p.locator('.ozd-yok-ozet').innerText()), 'özet kartı bugünkü dersi göstermiyor');
    await p.locator('.ozd-yok-ozet').click(); await p.waitForTimeout(200);
    const satir = p.locator('.ozd-yok-s', { hasText: k.split('|')[1] }).first();
    dogrula(/bu gün dersi var/.test(await satir.innerText()), 'ders günü işareti yok');
    // bugün: Geldi → kayıt; tekrar bas → kaldır; sonra Telafi
    await satir.locator('button', { hasText: 'Geldi' }).click(); await p.waitForTimeout(150);
    esit(await p.evaluate(([k, t]) => ozdYokDurum(k, t).durum, [k, tarihler.t]), 'geldi', 'geldi işareti');
    await p.locator('.ozd-yok-s', { hasText: k.split('|')[1] }).first().locator('button', { hasText: 'Geldi' }).click(); await p.waitForTimeout(150);
    esit(await p.evaluate(([k, t]) => ozdYokDurum(k, t).durum, [k, tarihler.t]), null, 'ikinci basış işareti kaldırmalı');
    await p.locator('.ozd-yok-s', { hasText: k.split('|')[1] }).first().locator('button', { hasText: 'Telafi' }).click(); await p.waitForTimeout(150);
    // dün: önceki gün düğmesiyle git, Gelmedi
    await p.locator('.ozd-yok-tarih button[aria-label="Önceki gün"]').click(); await p.waitForTimeout(150);
    await p.locator('.ozd-yok-s', { hasText: k.split('|')[1] }).first().locator('button', { hasText: 'Gelmedi' }).click(); await p.waitForTimeout(150);
    // evvelsi gün: puanlı ders var → otomatik geldi
    const r = await p.evaluate(([k, T]) => {
      const oto = ozdYokDurum(k, T.once);
      const [g, ad] = ozdAyir(k); ozdYaz('ogr|' + k, Object.assign({}, ozdOgr(k), { paket: '3', paketBas: T.once }));
      const pk = ozdPaket(k), ay = _ozdYokAy === T.t.slice(0, 7) || _ozdYokAy === T.dun.slice(0, 7);
      const metin = ozdYokOzetMetni();
      return { oto, pk, ay, metin, gelmedi: ozdYokDurum(k, T.dun).durum };
    }, [k, tarihler]);
    dogrula(r.oto.durum === 'geldi' && r.oto.oto, 'puanlı ders otomatik geldi: ' + JSON.stringify(r.oto));
    esit(r.gelmedi, 'gelmedi', 'dün gelmedi');
    dogrula(r.pk && r.pk.kullanilan === 2 && r.pk.kalan === 1, 'paket (geldi + telafi, gelmedi düşmez): ' + JSON.stringify(r.pk));
    dogrula(/Özel ders yoklaması/.test(r.metin) && r.metin.indexOf(k.split('|')[1]) > 0, 'ay özeti metni: ' + r.metin);
    // aylık çizelge: bugünün ayına dön
    await p.evaluate((t) => ozdYokTarihSec(t), tarihler.t); await p.waitForTimeout(150);
    const tablo = await p.evaluate((ad) => { const tr = [...document.querySelectorAll('.ozd-yok-tablo tbody tr')].find((x) => x.textContent.indexOf(ad) >= 0); return tr ? tr.textContent : ''; }, k.split('|')[1]);
    dogrula(/🔁/.test(tablo) && /kaldı/.test(tablo), 'aylık çizelge satırı: ' + tablo);
    // telefon genişliği
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(250);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yatay taşma');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Yoklama düğmesi + özet, Geldi/kaldır/Telafi, dün Gelmedi, puanlı ders otomatik geldi, paket 2/3, aylık çizelge, ay özeti, 390 px');
  } finally {
    await p.evaluate((y) => { try { if (y) localStorage.setItem('dag_ozel_ders', y); else localStorage.removeItem('dag_ozel_ders'); _ozdYoklama = false; } catch (e) {} }, yedek).catch(() => {});
    await ctx.close();
  }
}
