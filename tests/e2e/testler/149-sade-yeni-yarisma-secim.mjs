// 🆕 KM sade "Yeni yarışma" ekranı seçimleri (2026-11-20, v442; kullanıcı ekran görüntüsü + "burası da sıkıntılı, seçme işi sıkıntı").
// 🌟 Minikler & Küçükler kartı tek dokunuşta kurar; 18 ok kalıbı seçili görünür; sporcular grup düğmeleriyle (Minikler n/m …);
// sıralama (Normal / İlk 4 / Herkes karışık) ve TV seçimi aynı ekranda; Başlat → tura geçer. Telefonda taşma yok.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  const O = 'tests/e2e/_cikti/149-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    await p.waitForFunction(() => typeof yzAnahtar === 'function' && typeof yzBaslat === 'function', null, { timeout: 20000 });
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), g: localStorage.getItem('dag_yz_tv_gorunum') }));
    await p.evaluate(() => { localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; });
    await p.evaluate(() => ksAc('yarisma'));
    await p.waitForSelector('#ks-ekran .ks-format', { timeout: 20000 });
    esit(await p.locator('#ks-ekran .ks-format').count(), 4, '4 hazır kalıp (18 ok eklendi)');
    await p.screenshot({ path: O + '1-ilk.png', fullPage: true });
    // 🌟 kartı
    await p.locator('#ks-ekran .ks-minik').click(); await p.waitForTimeout(300);
    const m = await p.evaluate(() => { const t = yzKurulumTaslak(); return { n: t.katilimci.length, hepsi: t.katilimci.every((k) => /^(minikler|kucukler)\|/.test(k)), format: t.format, mod: t.siraModu, tv: yzTvGorunum(), kart18: !!document.querySelector('#ks-ekran .ks-format.on b') && document.querySelector('#ks-ekran .ks-format.on b').textContent }; });
    dogrula(m.n >= 1 && m.hepsi, 'minik kartı yalnız minik + küçükleri seçmeli: ' + JSON.stringify(m)); esit(m.format, 's6o3', '18 ok'); esit(m.kart18, '18 ok', '18 ok kartı seçili görünmeli'); esit(m.mod, 'ilk4', 'İlk 4 kalsın'); esit(m.tv, 'kartlar', 'TV Kartlar');
    dogrula(await p.locator('#ks-ekran .ks-cip.on', { hasText: 'İlk 4 kalsın' }).count() === 1, 'sıralama çipi seçili değil');
    dogrula(await p.locator('#ks-ekran .ks-cip.on', { hasText: 'Işıklı Kartlar' }).count() === 1, 'TV çipi seçili değil');
    await p.screenshot({ path: O + '2-minik.png', fullPage: true });
    // grup düğmesi: Büyükler ekle / çıkar
    const b = await p.locator('#ks-ekran .ks-cip', { hasText: 'Büyükler' }).count();
    if (b) {
      const once = await p.evaluate(() => yzKurulumTaslak().katilimci.length);
      await p.locator('#ks-ekran .ks-cip', { hasText: 'Büyükler' }).click(); await p.waitForTimeout(200);
      const sonra = await p.evaluate(() => yzKurulumTaslak().katilimci.length);
      dogrula(sonra > once, 'Büyükler grubu eklenmedi');
      await p.locator('#ks-ekran .ks-cip', { hasText: 'Büyükler' }).click(); await p.waitForTimeout(200);
      esit(await p.evaluate(() => yzKurulumTaslak().katilimci.length), once, 'Büyükler grubu çıkmadı');
    }
    // Minikler grubunu çıkar → yalnız küçükler kalır
    await p.locator('#ks-ekran .ks-cip', { hasText: 'Minikler' }).click(); await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => yzKurulumTaslak().katilimci.every((k) => !/^minikler\|/.test(k))), 'Minikler çıkmadı');
    await p.locator('#ks-ekran .ks-cip', { hasText: 'Minikler' }).click(); await p.waitForTimeout(200);
    // telefon
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px taşıyor');
    await p.screenshot({ path: O + '3-telefon.png', fullPage: true });
    await p.setViewportSize({ width: 1280, height: 900 });
    // başlat (kayıtsız)
    await p.evaluate(() => { yzKurulumTaslak().kayit = false; });
    await p.locator('#ks-ekran .ks-ana-btn', { hasText: 'Yarışmayı başlat' }).click();
    await p.waitForFunction(() => _kmAktifSekme === 'yarisma' && yzOku().durum && yzOku().durum.asama === 'tur', null, { timeout: 15000 });
    const d = await p.evaluate(() => { const d = yzOku().durum; return { mod: d.ayar.siraModu, minik: d.ayar.minik, format: d.ayar.format, hepsi: d.katilimci.every((k) => /^(minikler|kucukler)\|/.test(k)) }; });
    esit(d.mod, 'ilk4', 'turda İlk 4'); esit(d.minik, true, 'turda minik bandı'); esit(d.format, 's6o3', 'turda 18 ok'); dogrula(d.hepsi, 'turda yalnız minik + küçük');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('4 kalıp · 🌟 kartı ' + m.n + ' sporcu, 18 ok, İlk 4, Kartlar · grup düğmeleri ekle/çıkar · 390 px · tur ayarları geçti');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzTvKapat(); } catch (e) {} const w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); }; w(yzAnahtar(), y.yz); w('dag_yz_tv_gorunum', y.g); _yz.kurulum = null; }, yedek).catch(() => {});
    await ctx.close();
  }
}
