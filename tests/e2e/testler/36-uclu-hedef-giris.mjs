// Yarışma › 🎯 Hedefe dokunarak giriş — 3'lü dikey kağıt (2026-10-17, kullanıcı: "3'lü hedef kağıdı üzerinde dokunarak girelim, her yüz
// 6 halkalı hedef yüzü gibi olsun, hassasiyet önemli, makaralılara makaralı hedef gösterilsin"). Gerçek fare basma/kaydırma/bırakma:
// büyüteç çıkar, canlı puan gösterir; bırakınca o yüzün yerel konumu ve puanı kaydolur. Çizgiye değen ok yüksek puan alır.
// Makaralıda dış 10 → 9, iç 10 → X. Tur kayıt dışıdır (kayit=false), önceki durum geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), mod: localStorage.getItem('dag_yz_girismod') }));
    // puan fonksiyonu: yüz yarıçapı 12 cm (10 halkası r ≤ 1/6), ok yarıçapı 0,28 cm → 10/9 çizgisine değen ok 10 sayılır
    const pu = await p.evaluate(() => { const y = YZ_YUZ['3lu']; return [yzKonumPuan(0, 0, y), yzKonumPuan(0.15, 0, y), yzKonumPuan(1 / 6 + 0.01, 0, y), yzKonumPuan(1 / 6 + 0.03, 0, y), yzKonumPuan(0.15, 0, y, true), yzKonumPuan(0.05, 0, y, true), yzKonumPuan(1.05, 0, y)].join(','); });
    esit(pu, 'X,10,10,9,9,X,M', 'puan kuralı (çizgi/makaralı)');
    await p.evaluate(() => {
      localStorage.removeItem(yzAnahtar()); localStorage.setItem('dag_yz_yon_v1', '1'); localStorage.setItem('dag_yz_girismod', 'hedef');
      if (yzRoster().length < 2) { _kmListe = Object.keys(turnuvaDB.buyukler || {}).slice(0, 3).map((ad) => ({ g: 'buyukler', ad })); }
      _yz.kurulum = null; yzModAyarla('siralama'); yzKurAyar('kayit', false); yzKurAyar('yuz', '3lu');
      let t = yzKurulumTaslak(); t.katilimci = yzRoster().slice(0, 2).map((k) => k.g + '|' + k.ad); yzKurSeriOk('ok', 3); yzBaslat();
    });
    await p.waitForTimeout(300);
    const k0 = await p.evaluate(() => yzOku().durum.katilimci[0]);
    await p.evaluate((k) => { let i = k.indexOf('|'); turnuvaDB[k.slice(0, i)][k.slice(i + 1)].yay = 'Klasik'; yzGirisAc(yzEnc(k), 0); }, k0);
    await p.waitForSelector('#yz-hedef-svg.uclu');
    // kağıttaki üç yüzün merkezini ekrandan hesapla
    const merkez = async (s, dx, dy) => p.evaluate(([s, dx, dy]) => { const svg = document.getElementById('yz-hedef-svg'), pt = svg.createSVGPoint(); pt.x = dx; pt.y = (s - 1) * YZ_UCLU_ARA + dy; const m = pt.matrixTransform(svg.getScreenCTM()); return { x: m.x, y: m.y }; }, [s, dx, dy]);
    // 1. ok: üst yüz tam merkez (X) — bas, büyüteç görünsün, biraz kaydır, bırak
    let a = await merkez(0, 0.3, 0); await p.mouse.move(a.x, a.y); await p.mouse.down();
    dogrula(await p.locator('#yz-lup').isVisible(), 'büyüteç çıkmadı');
    let b = await merkez(0, 0, 0); await p.mouse.move(b.x, b.y, { steps: 5 });
    esit((await p.locator('#yz-lup b').innerText()).trim(), 'X', 'büyüteçte canlı puan');
    await p.mouse.up(); await p.waitForTimeout(150);
    dogrula(!(await p.locator('#yz-lup').count()), 'büyüteç kapanmadı');
    // 2. ok: orta yüz 8 (r ≈ 0.42), 3. ok: alt yüz 6 (r ≈ 0.75)
    a = await merkez(1, 0.42, 0); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up();
    a = await merkez(2, 0, 0.75); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up();
    await p.waitForTimeout(150);
    const g = await p.evaluate(() => ({ oklar: _yz.giris.oklar.join(','), s: _yz.giris.konumlar.map((k) => k && k.s).join(',') }));
    esit(g.oklar, 'X,8,6', 'üçlü kağıttan puanlar');
    esit(g.s, '0,1,2', 'oklar kendi yüzlerine kaydolmadı');
    await p.evaluate(() => { yzGirisKaydet(); yzGirisKapat(); });
    const kay = await p.evaluate((k) => JSON.stringify(yzOku()[yzPKey(yzOku().durum.id, k)][0].map((x) => x && x.s)), k0);
    esit(kay, '[0,1,2]', 'konumlar kayda geçmedi');
    // makaralı: aynı yere (dış 10) basınca 9
    const k1 = await p.evaluate(() => yzOku().durum.katilimci[1]);
    await p.evaluate((k) => { let i = k.indexOf('|'); turnuvaDB[k.slice(0, i)][k.slice(i + 1)].yay = 'Makaralı'; yzGirisAc(yzEnc(k), 0); }, k1);
    await p.waitForSelector('.yz-mak-not');
    a = await merkez(0, 0.15, 0); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up();
    esit(await p.evaluate(() => _yz.giris.oklar[0]), '9', 'makaralıda dış 10 → 9 olmalı');
    await p.evaluate((k) => { let i = k.indexOf('|'); turnuvaDB[k.slice(0, i)][k.slice(i + 1)].yay = 'Klasik'; yzGirisKapat(); }, k1);
    // 🗑 oka dokun → sil, sürükle → taşı (yeni puan), üstteki kutucuğa dokun → sil (2026-10-17)
    await p.evaluate((k) => { yzGirisAc(yzEnc(k), 1); }, k0);
    await p.waitForSelector('#yz-hedef-svg.uclu');
    for (const [sp, dx, dy] of [[0, 0, 0], [1, 0.42, 0], [2, 0, 0.75]]) { a = await merkez(sp, dx, dy); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up(); }
    esit(await p.evaluate(() => _yz.giris.oklar.join(',')), 'X,8,6', 'üç ok');
    dogrula(await p.locator('#yz-hedef-svg.dolu').count(), 'hedef dolu değil');
    // dolu hedefte 2. okun (orta yüz, 8) PUAN ETİKETİNE kısa dokun → silinir (deliğe dokunmak silmez)
    a = await merkez(1, 0.42, 0); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(100);
    esit(await p.evaluate(() => _yz.giris.oklar.length), 3, 'deliğe dokununca ok silinmemeli');
    a = await merkez(1, 0.42 + 0.11, -0.11); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(100);
    esit(await p.evaluate(() => _yz.giris.oklar.join(',')), 'X,6', 'oka dokununca silinmedi');
    // 1. okun (üst X) etiketini sürükle → üst yüzde 7 bölgesine (r ≈ 0.58) taşı
    a = await merkez(0, 0.11, -0.11); let b2 = await merkez(0, 0.58, 0);
    await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.move(b2.x, b2.y, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(100);
    esit(await p.evaluate(() => _yz.giris.oklar.join(',') + '|' + _yz.giris.konumlar[0].s), '7,6|0', 'sürükleyince ok taşınmadı / puanı değişmedi');
    // üstteki kutucuk: 2. kutucuğa (6) dokun → silinir
    await p.locator('#yz-giris button.yz-ok').nth(1).click();
    esit(await p.evaluate(() => _yz.giris.oklar.join(',')), '7', 'kutucuğa dokununca silinmedi');
    await p.evaluate(() => yzGirisKapat());
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log("3'lü kağıt: büyüteç + canlı puan, oklar kendi yüzünde, çizgi kuralı, makaralı iç 10 ✓");
  } finally {
    if (yedek) await p.evaluate((y) => { if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); if (y.mod) localStorage.setItem('dag_yz_girismod', y.mod); else localStorage.removeItem('dag_yz_girismod'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
