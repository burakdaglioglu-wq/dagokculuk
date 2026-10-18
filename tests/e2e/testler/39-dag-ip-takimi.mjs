// 🏔 Dağ Tırmanışı — 🪢 İp takımı (2026-10-19, kullanıcı: "dağ tırmanışını en heyecanlı oyuna çevirelim" → 3B dağ + ip takımı/kurtarma).
// Kurallar (gerçek skora dokunmaz): %35 altı seri → kayar, ipte asılı (o seri ilerlemez, geri gitmez); ip ortağı asılıyken %70+
// seri → ortağı patikaya çeker (+%3 yol) ve +10 kurtarma puanı. Geri al: ip durumu, ortağın yolu ve bonus geri döner.
// 3B sahne (dagsk-dag3d.js) başsız tarayıcıda yazılımsal GPU olduğu için açılmaz → 2B sahne kalmalı, hata olmamalı.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => { kmOyunTemaSec('dag'); if (typeof kmOyunModSec === 'function') kmOyunModSec(false); kmDagIpSifirla(); return { durum: JSON.stringify(_kmOyunDurum), n: _kmOyunRosterCache.length }; });
    if (yedek.n < 2) { log('ip takımı: derste 2 sporcu yok, atlandı'); return; }
    const ilk = await p.evaluate(() => {
      [0, 1].forEach((i) => { let s = _kmOyunRosterCache[i], d = kmOyunDurumAl(s.g, s.ad); d.frac = 0.2; s.frac = 0.2; turnuvaDB[s.g][s.ad].devamModu = true; });
      kmOyunSahneKurAktif();
      return { grup: JSON.stringify(kmDagIpGruplari()[0]), hud: !!document.querySelector('#km-dag-ip-hud .kdi-ad') };
    });
    esit(ilk.grup, '[0,1]', 'ilk iki sporcu aynı ipte olmalı'); dogrula(ilk.hud, 'ip takımları paneli çizilmedi');
    const seri = (i, v) => p.evaluate(async ([i, v]) => {
      kmOyunSporcuSec(i); _kmOyunSeriGirisleri = Array(_kmOyunOkSayisi).fill(v); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) { let m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') onayOnayla(); await new Promise((r) => setTimeout(r, 150)); }
      let s = _kmOyunRosterCache[i]; return { frac: s.frac, puan: s.toplamSkor };
    }, [i, v]);
    // 0 kayar → asılı, ilerlemez
    const a = await seri(0, '1');
    let d = await p.evaluate(() => ({ asili: Object.keys(kmDagIpDurum().asili), k: _kmOyunRosterCache[0].g + '|' + _kmOyunRosterCache[0].ad, cls: _kmOyunRosterCache[0].dagEl && _kmOyunRosterCache[0].dagEl.classList.contains('asili') }));
    dogrula(d.asili.includes(d.k), 'zayıf seride sporcu ipte asılı kalmadı');
    esit(Math.round(a.frac * 1000), 200, 'asılıyken ilerlememeli');
    dogrula(d.cls, '2B sahnede asılı görünümü yok');
    // 1 güçlü seri → 0'ı kurtarır
    const o1 = await p.evaluate(() => _kmOyunRosterCache[1].toplamSkor);
    const b = await seri(1, 'X');
    const kampBonus = (await p.evaluate(() => (_kmAraOlaySon || []).includes('bonus'))) ? 10 : 0; // günün bonus kampı (ara olay, geri alınmaz)
    d = await p.evaluate(() => ({ ip: kmDagIpDurum(), f0: _kmOyunRosterCache[0].frac }));
    esit(Object.keys(d.ip.asili).length, 0, 'kurtarmadan sonra asılı kalmamalı');
    esit(Math.round(d.f0 * 1000), 230, 'kurtarılan ortak +%3 yol almalı');
    dogrula(b.puan - o1 >= _okSayi(await p.evaluate(() => _kmOyunOkSayisi)) + 10, 'kurtarma bonusu (+10) eklenmedi');
    // geri al: ortağın yolu, asılı durumu ve bonus geri gelir
    await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); });
    d = await p.evaluate(() => ({ ip: kmDagIpDurum(), f0: _kmOyunRosterCache[0].frac, p1: _kmOyunRosterCache[1].toplamSkor }));
    esit(Math.round(d.f0 * 1000), 200, 'geri alınca ortağın yolu dönmeli');
    esit(Object.keys(d.ip.asili).length, 1, 'geri alınca ortak yeniden asılı olmalı');
    esit(d.p1, o1 + kampBonus, 'geri alınca kurtarma bonusu düşmeli');
    // 3B: başsız tarayıcıda açılmaz, 2B kalır
    esit(await p.evaluate(() => document.getElementById('km-oyun-panel-dag').classList.contains('d3') === !!_kmDag3d), true, '3B durumu ile panel sınıfı tutarsız');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('ip takımı: kayma → asılı, ortak kurtarır (+%3, +10), geri al ✓');
    function _okSayi(n) { return n * 10; }
  } finally {
    if (yedek) await p.evaluate((y) => { try { _kmOyunDurum = JSON.parse(y.durum); kmOyunDurumKaydet(); kmDagIpSifirla(); } catch (e) {} }, yedek).catch(() => {});
    await ctx.close();
  }
}
