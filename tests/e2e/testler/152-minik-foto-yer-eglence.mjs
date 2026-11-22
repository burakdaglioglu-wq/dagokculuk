// 🌟 Çocuk yarışması düzeltmesi (v445, 2026-11-22; kullanıcı: "çocukların fotoğrafları gözükmüyor, attığı yerler gözükmüyor,
// biraz eğlenceli olsun ama seçeneğe göre olsun"). Işıklı Kartlar: izinli fotoğraf kartta görünür; her kartta o serinin okları
// hedefte (konum girilmediyse halkasına) görünür; 🎉 Eğlence Sade / Biraz / Çok — sade balonsuz, çok = büyük sahne.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1920, yukseklik: 1080 });
  const O = 'tests/e2e/_cikti/152-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    await p.waitForFunction(() => typeof yzBaslat === 'function' && typeof yzEglenceSec === 'function', null, { timeout: 20000 });
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), g: localStorage.getItem('dag_yz_tv_gorunum'), liste: JSON.stringify(_kmListe) }));
    await p.evaluate(() => {
      window.__fs = yzFotoSrc; window.yzFotoSrc = (k) => (k.length % 2 ? 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="red"/></svg>') : '');
      const tum = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 12); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null;
      const t = yzKurulumTaslak(); t.katilimci = _kmListe.map((s) => s.g + '|' + s.ad); t.kayit = false; t.siraModu = 'ilk4'; t.format = 's6o3'; t.minik = true;
      localStorage.setItem('dag_yz_tv_gorunum', 'kartlar'); yzBaslat(); yzTvAc();
    });
    await p.waitForSelector('#yz-tv #yzk', { timeout: 20000 });
    await p.evaluate(() => document.fullscreenElement && document.exitFullscreen()); await p.waitForTimeout(400);
    esit(await p.evaluate(() => yzEglence(yzOku().durum)), 'biraz', 'varsayılan eğlence Biraz');
    // herkes 1 seri: yarısı konumsuz (yalnız puan)
    await p.evaluate(() => { const d = yzOku().durum; yzGuncelle((o) => d.katilimci.forEach((k, i) => { o[yzSKey(d.id, k)] = [['10', '8', i % 3 ? '6' : 'M']]; if (i % 2) o[yzPKey(d.id, k)] = [[{ x: 0.05, y: 0, n: 1 }, { x: -0.2, y: 0.2, n: 2 }, { x: 0.4, y: 0.3, n: 3 }]]; })); _yz.tvHam = null; yzTvCiz(); });
    await p.waitForTimeout(500);
    const ilk = await p.evaluate(() => {
      const d = yzOku().durum, kartlar = [...document.querySelectorAll('#yzk .yzik-c, #yzk .yzik-k')];
      const fotolu = d.katilimci.filter((k) => k.length % 2).length;
      return { kart: kartlar.length, n: d.katilimci.length, hedefli: kartlar.filter((c) => c.querySelector('.yzik-hedef')).length, nokta: kartlar.filter((c) => c.querySelectorAll('.yzik-hedef .yzk-n').length === 3).length,
        foto: [...document.querySelectorAll('#yzk .yzik-alan .yzik-av, #yzk .yzik-kursu .yzik-av')].filter((a) => /data:image/.test(a.style.backgroundImage)).length, fotolu };
    });
    esit(ilk.kart, ilk.n, 'herkesin kartı'); esit(ilk.hedefli, ilk.n, 'her kartta hedef (konumsuz girişte de)'); esit(ilk.nokta, ilk.n, 'her hedefte 3 ok');
    esit(ilk.foto, ilk.fotolu, 'izinli fotoğraflar kartta görünmeli');
    // Biraz: yeni giriş → balon + kart zıplar, sahne yok
    const gir = (i, s) => p.evaluate(([i, s]) => { const d = yzOku().durum, k = d.katilimci[i]; yzGuncelle((o) => { o[yzSKey(d.id, k)] = [s]; }); _yz.tvHam = null; yzTvCiz(); }, [i, s]);
    await gir(2, ['X', '10', '9']); await p.waitForTimeout(300);
    let b = await p.evaluate(() => ({ balon: document.querySelectorAll('#yzk .yzik-balon').length, zipla: document.querySelectorAll('#yzk .zipla').length, spot: document.querySelectorAll('.yzik-spot').length, yildiz: document.querySelectorAll('#yzk .yzik-yildiz').length }));
    dogrula(b.balon >= 1 && b.zipla >= 1, 'biraz: balon + zıplama yok ' + JSON.stringify(b)); esit(b.spot, 0, 'biraz: sahne olmamalı'); dogrula(b.yildiz > 0, 'sarıya girince yıldız');
    await p.screenshot({ path: O + '1-biraz.png' });
    // Sade
    await p.evaluate(() => yzEglenceSec('sade')); await gir(3, ['9', '9', '9']); await p.waitForTimeout(300);
    b = await p.evaluate(() => ({ balon: document.querySelectorAll('#yzk .yzik-balon').length, parla: document.querySelectorAll('#yzk .parla').length, eg: yzOku().durum.ayar.eglence }));
    esit(b.eg, 'sade', 'ayar sade'); esit(b.balon, 0, 'sade: balon yok'); esit(b.parla, 0, 'sade: ışık yok');
    // Çok: büyük sahne
    await p.evaluate(() => yzEglenceSec('cok')); await p.waitForTimeout(200); await gir(4, ['X', 'X', '10']); await p.waitForTimeout(1600);
    b = await p.evaluate(() => { const s = document.querySelector('.yzik-spot'); return { spot: !!s, foto: !!(s && s.querySelector('.yzik-av')), hedef: s ? s.querySelectorAll('svg circle.yzk-n').length : 0, puan: s && s.querySelector('.yzik-spot-puan').textContent }; });
    dogrula(b.spot, 'çok: sahne açılmadı'); esit(b.hedef, 3, 'sahnede 3 ok'); esit(b.puan, '+30', 'sahne puanı');
    await p.screenshot({ path: O + '2-cok.png' });
    await p.waitForTimeout(2600);
    esit(await p.evaluate(() => document.querySelectorAll('.yzik-spot').length), 0, 'sahne kendiliğinden kapanmalı');
    // TV'deki 🎉 düğmesi döngüsü: cok → sade
    await p.locator('.yzik-arac .yzik-seffaf', { hasText: 'Eğlence' }).click(); await p.waitForTimeout(300);
    esit(await p.evaluate(() => yzOku().durum.ayar.eglence), 'sade', 'düğme Çok → Sade');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('fotoğraf kartta · konumsuz girişte de hedefte 3 ok · Eğlence sade/biraz/çok (balon, zıplama, yıldız, büyük sahne) · TV düğmesi');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzTvKapat(); } catch (e) {} if (window.__fs) window.yzFotoSrc = window.__fs; const w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); }; w(yzAnahtar(), y.yz); w('dag_yz_tv_gorunum', y.g); _kmListe = JSON.parse(y.liste); _yz.kurulum = null; }, yedek).catch(() => {});
    await ctx.close();
  }
}
