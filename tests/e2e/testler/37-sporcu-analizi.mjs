// Yarışma › 📊 Sporcu Analizi (2026-10-17, kullanıcı: "antrenör tablosu gibi olsun ama ısı haritası da olsun, gelişim grafiği daha
// güzel ve detaylı"). Tablo (sırala, satıra dokun → ayrıntı), ısı haritası (kapsam: bu tur / son 5 / tümü), 9 bölge yüzdesi, gelişim
// grafiği (sınıf bandı + eğilim + rekor), tespitler. Arşiv sahte turlarla doldurulur, sonunda eski haline döner (sunucuya yazılmaz).
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 950 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), ar: localStorage.getItem('dag_yz_arsiv') }));
    const ilk = await p.evaluate(() => {
      let ks = yzRoster().slice(0, 3).map((k) => k.g + '|' + k.ad), t0 = Date.now() + 864e5, ar = [];
      for (let t = 0; t < 6; t++) ar.push({ id: 'e2e-sa-' + t, t: t0 + t * 3600e3, g: 1, tarih: bugunISO(new Date()), mesafe: '18m', format: 'tam', yuz: '6',
        sporcular: ks.map((k, i) => ({ k, ad: k.slice(k.indexOf('|') + 1), sira: i + 1, ok: 36, toplam: Math.round((6.5 + i * 0.3 + (i === 0 ? t * 0.25 : 0)) * 36), on: 4 + t, x: 2, seriT: [26, 25, 27, 24, 28, 26], dag: { M: 1 },
          kon: Array.from({ length: 18 }, (_, j) => [((j % 6) - 2) * 0.06 + 0.15, (Math.floor(j / 6) - 1) * 0.07 + 0.1]) })) });
      localStorage.setItem('dag_yz_arsiv', JSON.stringify(ar)); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
      return ks[0];
    });
    // arşiv birleştirme: konum yalnız son 10 turda kalır
    esit(await p.evaluate(() => { let l = Array.from({ length: 14 }, (_, i) => ({ id: 'x' + i, t: i, sporcular: [{ k: 'a|b', kon: [[0, 0]] }] })); return yzArsivBirlestir([], l).filter((r) => r.sporcular[0].kon).length; }), 10, 'konum yalnız son 10 turda kalmalı');
    await p.locator('button', { hasText: 'Sporcu Analizi' }).first().click();
    await p.waitForSelector('#yza .yza-tablo', { timeout: 20000 });
    dogrula(await p.locator('#yza tbody tr').count() >= 3, 'tabloda sporcu yok');
    await p.locator('#yza thead button', { hasText: 'Ok ort.' }).click();
    // ilk sporcunun satırına dokun → ayrıntı
    await p.locator('#yza tbody tr', { hasText: ilk.slice(ilk.indexOf('|') + 1) }).first().click(); await p.waitForTimeout(300);
    dogrula(await p.locator('#yza-isi').count(), 'ısı haritası yok');
    dogrula(await p.locator('.yza-gelisim').count(), 'gelişim grafiği yok');
    esit(await p.locator('.yza-bolge div').count(), 9, '9 bölge');
    dogrula((await p.locator('.yza-detay').innerText()).includes('Tespitler'.toLocaleUpperCase('tr-TR')) || (await p.locator('.yza-tespit li').count()) > 0, 'tespit yok');
    esit((await p.locator('#yza tr.acik .yza-durum').innerText()).trim(), 'Yükselişte', 'durum etiketi');
    await p.evaluate(() => { _yza.antrenman = false; });
    await p.locator('.yza-sec button', { hasText: 'Tümü' }).click(); await p.waitForTimeout(200);
    dogrula((await p.locator('.yza-detay').innerText()).includes('108 ok'), 'Tümü kapsamında 6×18 ok olmalı');
    // tur sürerken kısa yollar (2026-10-18): tablodaki 📊 → o sporcu açık gelir; skor girişindeki 📊 Analiz; "← Tura dön"
    await p.evaluate(() => yzaKapat());
    await p.evaluate(() => { _yz.kurulum = null; yzModAyarla('siralama'); yzKurAyar('kayit', false); let t = yzKurulumTaslak(); t.katilimci = yzRoster().slice(0, 2).map((k) => k.g + '|' + k.ad); yzBaslat(); let k = yzOku().durum.katilimci[0]; yzGirisAc(yzEnc(k), 0); ['10', '9', '8', '9', '8', '7'].slice(0, yzGirisOkSay(_yz.giris, yzOku().durum)).forEach((v) => yzOkEkle(v)); yzGirisKaydet(); yzGirisKapat(); });
    await p.waitForSelector('.yz-an-btn');
    const k2 = await p.evaluate(() => yzOku().durum.katilimci[1]), ad2 = k2.slice(k2.indexOf('|') + 1);
    await p.locator('.yz-tablo tr[data-k="' + k2 + '"] .yz-an-btn').first().click();
    await p.waitForSelector('#yza tr.acik', { timeout: 20000 });
    dogrula((await p.locator('#yza tr.acik').innerText()).includes(ad2), '📊 doğru sporcuyu açmadı');
    dogrula((await p.locator('#yza .yza-bas button').innerText()).includes('Tura dön'), 'Tura dön düğmesi yok');
    await p.locator('#yza .yza-bas button').click();
    dogrula(!(await p.locator('#yza').count()), 'analiz kapanmadı');
    await p.evaluate(() => { let k = yzOku().durum.katilimci[0]; yzGirisAc(yzEnc(k), 1); });
    await p.locator('#yz-giris button', { hasText: '📊 Analiz' }).click();
    await p.waitForSelector('#yza tr.acik', { timeout: 20000 });
    dogrula(await p.evaluate(() => { let a = getComputedStyle(document.querySelector('.yza-arka')).zIndex, b = getComputedStyle(document.getElementById('yz-giris')).zIndex; return +a > +b; }), 'analiz skor penceresinin altında kaldı');
    await p.evaluate(() => { yzaKapat(); yzGirisKapat(); });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Sporcu Analizi: tablo + sıralama, ısı haritası (kapsam), 9 bölge, gelişim grafiği, durum etiketi; arşivde konum son 10 turda ✓');
  } finally {
    if (yedek) await p.evaluate((y) => { if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); if (y.ar) localStorage.setItem('dag_yz_arsiv', y.ar); else localStorage.removeItem('dag_yz_arsiv'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
