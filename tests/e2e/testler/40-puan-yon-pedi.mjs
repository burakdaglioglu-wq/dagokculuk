// Yarışma › ⚡ Puan + yön pedi (2026-10-20, kullanıcı: "hedef yüzüne tıklayınca çok uzun sürüyor" → taslaklardan "I · Puan + yön pedi",
// "güzel kağıt olsun parlak"). Puan tuşu → 1,5 sn içinde isteğe bağlı yön; yön basılırsa ok o halkada o yönde yaklaşık yere konur,
// basılmazsa yalnız puan. Üçlü yüzde sıradaki ok sıradaki yüze. Parlak kağıt okları gösterir. Tur kayıt dışı; önceki durum geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), mod: localStorage.getItem('dag_yz_girismod') }));
    await p.evaluate(() => {
      localStorage.removeItem(yzAnahtar()); localStorage.setItem('dag_yz_girismod', 'yon');
      if (yzRoster().length < 2) { _kmListe = Object.keys(turnuvaDB.buyukler || {}).slice(0, 3).map((ad) => ({ g: 'buyukler', ad })); }
      _yz.kurulum = null; yzModAyarla('siralama'); yzKurAyar('kayit', false); yzKurAyar('yuz', '3lu');
      let t = yzKurulumTaslak(); t.katilimci = yzRoster().slice(0, 2).map((k) => k.g + '|' + k.ad); yzKurSeriOk('ok', 3); yzBaslat();
    });
    await p.waitForTimeout(300);
    const k0 = await p.evaluate(() => yzOku().durum.katilimci[0]);
    await p.evaluate((k) => { let i = k.indexOf('|'); turnuvaDB[k.slice(0, i)][k.slice(i + 1)].yay = 'Klasik'; yzGirisAc(yzEnc(k), 0); }, k0);
    await p.waitForSelector('.yz-yon-giris');
    dogrula(await p.locator('.yz-parlak-kagit.uclu').count(), 'parlak üçlü kağıt çizilmedi');
    esit(await p.locator('.yz-yon-puan').count(), 8, "6 halkalı yüzde X,10-5,M = 8 puan tuşu");
    // 1. ok: 9 → ↗ (yön)
    await p.locator('.yz-yon-puan', { hasText: /^9$/ }).click();
    dogrula(await p.locator('.yz-yon-kutu.bekliyor').count(), 'yön kutusu beklemiyor');
    await p.locator('.yz-yon-b[aria-label="Yön ↗"]').click();
    // 2. ok: X → yön basma (1,5 sn sonra yalnız puan)
    await p.locator('.yz-yon-puan', { hasText: /^X$/ }).click(); await p.waitForTimeout(1800);
    // 3. ok: 7 → ← ; sonra M yok
    await p.locator('.yz-yon-puan', { hasText: /^7$/ }).click(); await p.locator('.yz-yon-b[aria-label="Yön ←"]').click();
    const g = await p.evaluate(() => ({ oklar: _yz.giris.oklar.join(','), k: _yz.giris.konumlar.map((k) => k ? [k.s, Math.sign(k.x), Math.sign(k.y), yzKonumPuan(k.x, k.y, YZ_YUZ['3lu'])].join('/') : '-').join(' ') }));
    esit(g.oklar, '9,X,7', 'puanlar');
    esit(g.k, '0/1/-1/9 - 2/-1/0/7', 'yaklaşık konumlar (yüz/yön/puan tutarlı)');
    dogrula(await p.locator('.yz-parlak-kagit .yz-pk-ok').count() === 2, 'kağıtta 2 ok görünmeli');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-yon.png' });
    await p.locator('.yz-giris button', { hasText: 'Kaydet' }).click(); await p.waitForTimeout(250);
    esit(await p.evaluate((k) => (yzSkor(yzOku(), k)[0] || []).join(','), k0), 'X,9,7', 'seri kaydedilmedi (büyükten küçüğe)');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('⚡ puan + yön pedi: yön → yaklaşık konum, yönsüz → yalnız puan, parlak kağıt, kayıt ✓');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzGirisKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); if (y.mod) localStorage.setItem('dag_yz_girismod', y.mod); }, yedek).catch(() => {});
    await ctx.close();
  }
}
