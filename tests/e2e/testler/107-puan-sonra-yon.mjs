// 2026-11-07 (v385) Kullanıcı 3 taslaktan "B · Puan, sonra yön"ü seçti: "ama illa oka tıklamama gerek kalmasın".
// Tek yüzde: puana basınca o halka parlar, 8 yön oku açılır (kılavuz). Hedefin HERHANGİ bir yerine dokunmak yön sayılır;
// sıradaki puana basmak ya da 2 sn beklemek yalnız puan kaydeder. 3x3 yön pedi yok. Yeni ok uçarak saplanır, sonra numarası çıkar.
// Tur kayıt dışı; önceki durum geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 860 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), mod: localStorage.getItem('dag_yz_girismod') }));
    await p.evaluate(() => {
      localStorage.removeItem(yzAnahtar()); localStorage.setItem('dag_yz_girismod', 'yon');
      if (yzRoster().length < 2) { _kmListe = Object.keys(turnuvaDB.buyukler || {}).slice(0, 3).map((ad) => ({ g: 'buyukler', ad })); }
      _yz.kurulum = null; yzModAyarla('siralama'); yzKurAyar('kayit', false); yzKurAyar('yuz', '10k');
      const t = yzKurulumTaslak(); t.katilimci = yzRoster().slice(0, 2).map((k) => k.g + '|' + k.ad); yzKurSeriOk('ok', 6); yzBaslat(); yzSayacBaslat();
    });
    await p.waitForTimeout(300);
    const k0 = await p.evaluate(() => yzOku().durum.katilimci[0]);
    await p.evaluate((k) => { const i = k.indexOf('|'); turnuvaDB[k.slice(0, i)][k.slice(i + 1)].yay = 'Klasik'; yzGirisAc(yzEnc(k), 0); }, k0);
    await p.waitForSelector('.yz-yon-b2');
    esit(await p.locator('.yz-yon-b').count(), 0, 'tek yüzde 3x3 yön pedi olmamalı');
    const kagit = (x, y) => p.evaluate(([x, y]) => { const svg = document.querySelector('.yz-parlak-kagit'), pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const m = pt.matrixTransform(svg.getScreenCTM()); return { x: m.x, y: m.y }; }, [x, y]);
    const puan = (v) => p.locator('.yz-yon-puan', { hasText: new RegExp('^' + v + '$') }).click();

    // 1. ok: 9, hedefin sağ üst KÖŞESİNE dokun (yön düğmesine değil) → 9 halkasında sağ üstte
    await puan('9'); await p.waitForTimeout(150);
    dogrula(await p.locator('.yz-yv-halka').count() === 1, 'bekleyen puanın halkası parlamıyor');
    esit(await p.locator('.yz-yv-ok').count(), 8, '8 yön kılavuzu');
    let q = await kagit(0.85, -0.8); await p.mouse.click(q.x, q.y);
    await p.waitForTimeout(120);
    esit(await p.locator('.yz-pk-ok.bekle').count(), 1, 'yeni ok uçarken numarası beklemeli');
    await p.waitForTimeout(1100);
    esit(await p.locator('.yz-pk-ok.bekle').count(), 0, 'uçuştan sonra ok görünmeli');
    // 2. ok: 8, dokunmadan sıradaki puana bas → 8 yönsüz; 3. ok 10 sola
    await puan('8'); await p.waitForTimeout(100); await puan('10'); q = await kagit(-0.6, 0); await p.mouse.click(q.x, q.y); await p.waitForTimeout(100);
    // 4. ok: 7, 2 sn bekle → yalnız puan
    await puan('7'); await p.waitForTimeout(2300);
    dogrula(!(await p.locator('.yz-yv').count()), 'süre bitince vurgu kapanmalı');
    const g = await p.evaluate(() => { const yuz = yzYuz(yzOku().durum); return { o: _yz.giris.oklar.join(','), k: _yz.giris.konumlar.map((k) => k ? yzKonumPuan(k.x, k.y, yuz) + '@' + Math.sign(Math.round(k.x * 10)) + '/' + Math.sign(Math.round(k.y * 10)) : '-').join(' ') }; });
    esit(g.o, '9,8,10,7', 'puanlar');
    esit(g.k, '9@1/-1 - 10@-1/0 -', 'yön: hedefin her yeri sayılır, yönsüzler yalnız puan');
    esit(await p.locator('.yz-parlak-kagit .yz-pk-ok').count(), 2, 'kağıtta 2 ok');
    // 390 px: taşma yok
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => { const e = document.querySelector('.yz-giris'); return e.scrollWidth <= e.clientWidth + 1; }), '390 px giriş penceresi yana taşıyor');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-b.png' });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🎯 puan, sonra yön: halka vurgusu, hedefin her yeri yön, yönsüz yalnız puan, ok uçuşu, 390 px ✓');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzGirisKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); if (y.mod) localStorage.setItem('dag_yz_girismod', y.mod); }, yedek).catch(() => {});
    await ctx.close();
  }
}
