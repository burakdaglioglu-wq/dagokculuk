// 2026-11-08 (v388) Kullanıcı TV taslaklarından "Sahne"yi seçti: "alternatif olarak bunu da ekle, temalardan değiştirebileyim şu ankini de,
// ama bu yaptığın ilk açtığımda açılsın". TV ilk açılışta Sahne: son skoru giren sahnede (büyük hedefte bu serinin okları numarasıyla),
// sağda herkesin sıralaması (satıra dokun → skor girişi), altta bekleyenler, sol üstte sayaç. Tablo'ya geçilir, Tema penceresinden de.
// 24 sporcu sığar. Tur kayıt dışı; önceki durum geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1920, yukseklik: 1080 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), g: localStorage.getItem('dag_yz_tv_gorunum') }));
    const n = await p.evaluate(() => {
      localStorage.removeItem('dag_yz_tv_gorunum'); // ilk açılış
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      const l = tum.slice(0, 24); _kmListe = l; localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
      yzKurAyar('kayit', false); yzKurAyar('yuz', '10k'); const t = yzKurulumTaslak(); t.katilimci = l.map((k) => k.g + '|' + k.ad); t.format = yzFormatAnahtar(6, 6); yzCiz(); yzBaslat();
      yzGuncelle((o) => { const d = o.durum; d.katilimci.forEach((k, i) => { if (i % 2) return; o[yzSKey(d.id, k)] = [['10', '9', '9', '8', '7', '6']]; o[yzPKey(d.id, k)] = [[{ x: 0.08, y: -0.1, n: 1 }, { x: -0.15, y: 0.05, n: 2 }, { x: 0.12, y: 0.12, n: 3 }, { x: -0.2, y: -0.22, n: 4 }, { x: 0.3, y: 0.1, n: 5 }, { x: -0.1, y: 0.4, n: 6 }]]; }); });
      yzCiz(); return l.length;
    });
    await p.evaluate(() => yzTvAc());
    await p.waitForSelector('#yz-tv .yzs-tv', { timeout: 15000 });
    esit(await p.evaluate(() => yzTvGorunum()), 'sahne', 'ilk açılışta Sahne olmalı');
    esit(await p.locator('#yz-tv .yzs-tsat').count(), n, 'sıralamada herkes');
    dogrula(await p.evaluate(() => { const k = document.querySelector('.yzs-tkap').getBoundingClientRect(), s = [...document.querySelectorAll('.yzs-tsat')].pop().getBoundingClientRect(); return s.bottom <= k.bottom + 2; }), n + ' sporcu sığmıyor');
    dogrula(await p.locator('#yz-tv #yz-tv-sayac').count() === 1, 'sahnede sayaç yok');
    dogrula(await p.locator('#yzs-sahne .yzs-hedef').count() === 1, 'sahnede hedef yok');
    // yeni skor → o sporcu sahneye çıkar, okları numarasıyla düşer
    const k = await p.evaluate(() => { const d = yzOku().durum, k = d.katilimci[1]; yzGuncelle((o) => { o[yzSKey(d.id, k)] = [['X', '10', '10', '9', '9', '8']]; o[yzPKey(d.id, k)] = [[{ x: 0.01, y: 0.02, n: 1 }, { x: 0.06, y: -0.04, n: 2 }, { x: -0.07, y: 0.03, n: 3 }, { x: 0.13, y: 0.05, n: 4 }, { x: -0.12, y: -0.1, n: 5 }, { x: 0.2, y: -0.15, n: 6 }]]; }); return k; });
    await p.waitForTimeout(1500);
    const ad = await p.locator('#yzs-sahne .yzs-ad').textContent();
    esit(ad.trim(), k.slice(k.indexOf('|') + 1), 'son skoru giren sahneye çıkmadı');
    esit(await p.locator('#yzs-sahne .yzs-pin').count(), 6, 'bu serinin 6 oku hedefte');
    await p.waitForTimeout(2500);
    esit(await p.locator('#yzs-sahne [data-say]').textContent(), '56', 'seri puanı sayarak yazılmalı');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-sahne.png' });
    // sıralama satırına dokun → skor girişi
    await p.mouse.move(900, 500); await p.waitForTimeout(200);
    await p.locator('.yzs-tsat').nth(5).click(); await p.waitForSelector('#yz-giris .yz-giris', { timeout: 5000 });
    await p.evaluate(() => yzGirisKapat());
    // Tablo'ya geç, geri gel; Tema penceresinde seçim
    await p.evaluate(() => yzTvGorunumSec('tablo')); await p.waitForTimeout(500);
    dogrula(await p.locator('#yz-tv .yz-tv-tablo').count() === 1 && !(await p.locator('#yz-tv .yzs-tv').count()), 'Tablo görünümüne geçmedi');
    dogrula(await p.locator('#yz-tv button', { hasText: '🎭 Sahne' }).count() >= 1, "Tablo'da Sahne düğmesi yok");
    await p.evaluate(() => yzAnaTemaAc()); await p.waitForTimeout(200);
    dogrula(await p.locator('#onay-modal button', { hasText: 'Sahne' }).count() === 1, 'Tema penceresinde TV görünümü yok');
    await p.locator('#onay-modal button', { hasText: 'Sahne' }).click(); await p.waitForTimeout(600);
    dogrula(await p.locator('#yz-tv .yzs-tv').count() === 1, "Tema'dan Sahne'ye dönmedi");
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('🎭 TV Sahne: ilk açılışta, ' + n + ' sporcu sığar, son skoru giren sahnede, satır → skor girişi, Tablo ⇄ Sahne, Tema penceresi ✓');
  } finally {
    if (yedek) await p.evaluate((y) => { try { yzTvKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); if (y.g) localStorage.setItem('dag_yz_tv_gorunum', y.g); else localStorage.setItem('dag_yz_tv_gorunum', 'tablo'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
