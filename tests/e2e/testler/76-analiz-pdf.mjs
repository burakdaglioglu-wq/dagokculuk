// Yarışma › 📄 Sporcu analiz PDF'i (2026-10-28, kullanıcı: "yarışma modundaki sonucu bitirdikten sonra sporcu analiz PDF dosyasını
// istiyorum"). Sahte arşiv (gelişim çizgisi için 3 eski tur) + konumlu oklarla girilmiş bir tur bitirilir; sonuç ekranındaki
// "Sporcu analiz PDF" düğmesi (gerçek tıklama) her sporcuya bir sayfa indirir; Sporcu raporları penceresinden tek sporcunun PDF'i
// tek sayfa iner. Arşiv ve tur sonunda eski haline döner (sunucuya yazılmaz).
import fs from 'node:fs';
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

const sayfaSay = (dosya) => (fs.readFileSync(dosya).toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 950 });
  let yedek = null;
  try {
    // bitirilen tur sunucudaki arşive yazılmasın (diğer testlerin "Tümü" sayımlarını bozuyordu)
    await p.route('**/api/meta/yz_arsiv', (r) => (r.request().method() === 'GET' ? r.continue() : r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })));
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), ar: localStorage.getItem('dag_yz_arsiv') }));
    const n = await p.evaluate(() => {
      let ks = yzRoster().slice(0, 3).map((k) => k.g + '|' + k.ad), t0 = Date.now() - 10 * 864e5, ar = [];
      for (let t = 0; t < 3; t++) ar.push({ id: 'e2e-apdf-' + t, t: t0 + t * 864e5, g: 1, tarih: bugunISO(new Date(t0 + t * 864e5)), mesafe: '18m', format: 'tam', yuz: '6',
        sporcular: ks.map((k, i) => ({ k, ad: k.slice(k.indexOf('|') + 1), sira: i + 1, ok: 36, toplam: 220 + t * 6 - i * 10, on: 4, x: 1, seriT: [36, 37, 36, 38, 36, 37], dag: { M: 0 }, kon: [[0.2, 0.1], [0.25, 0.05], [0.15, 0.12]] })) });
      localStorage.setItem('dag_yz_arsiv', JSON.stringify(ar)); localStorage.removeItem(yzAnahtar());
      _yz.kurulum = null; yzModAyarla('siralama'); yzKurAyar('kayit', false);
      let tk = yzKurulumTaslak(); tk.katilimci = ks; yzBaslat();
      let d = yzOku().durum, f = yzFormat(d);
      d.katilimci.forEach((k, i) => {
        for (let sr = 0; sr < f.seri; sr++) {
          yzGirisAc(yzEnc(k), sr); let say = yzGirisOkSay(_yz.giris, yzOku().durum);
          for (let o = 0; o < say; o++) yzOkEkle(['10', '9', '8', '9', '7', '8'][(o + i) % 6], { x: 0.12 + 0.03 * ((o + sr) % 3) - i * 0.05, y: -0.08 + 0.04 * (o % 3) + sr * 0.01 });
          yzGirisKaydet();
        }
      });
      yzGirisKapat(); yzBitir(true); yzCiz();
      return ks.length;
    });
    esit(await p.evaluate(() => yzOku().durum.asama), 'bitti', 'tur bitmeli');
    const btn = p.locator('.yz-tur-btn button', { hasText: 'Sporcu analiz PDF' });
    dogrula(await btn.count(), 'sonuç ekranında "Sporcu analiz PDF" düğmesi yok');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), btn.click()]);
    const yol = await dl.path(); if (process.env.E2E_EKRAN) await dl.saveAs(process.env.E2E_EKRAN + '-analiz.pdf');
    dogrula(yol && /^Sporcu_Analizi_Tum_Sporcular_\d{8}\.pdf$/.test(dl.suggestedFilename()), 'PDF adı: ' + dl.suggestedFilename());
    esit(sayfaSay(yol), n, 'her sporcuya bir sayfa');
    // ekrandaki analizle aynı veri: bu turun okları hedefte
    const nk = await p.evaluate(() => { let tur = yzaTurBilgi(); return yzaNoktalar(tur, tur.sporcular[0].k, 'bu').length; });
    dogrula(nk >= 18, 'bu turun ok konumları analizde yok: ' + nk);
    // tek sporcu: Sporcu raporları penceresinden
    await p.evaluate(() => yzRaporAc(yzEnc(yzOku().durum.katilimci[1])));
    const [dl2] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.locator('#yz-rapor button', { hasText: 'Analiz PDF' }).click()]);
    esit(sayfaSay(await dl2.path()), 1, 'tek sporcu PDF\'i tek sayfa');
    dogrula(!/Tum_Sporcular/.test(dl2.suggestedFilename()), 'tek sporcu dosya adı: ' + dl2.suggestedFilename());
    await p.evaluate(() => { let k = document.getElementById('yz-rapor'); if (k) k.remove(); });
    // Sporcu Analizi penceresindeki düğme de var
    await p.evaluate(() => yzAnalizAc());
    await p.waitForSelector('#yza .yza-tablo', { timeout: 20000 });
    dogrula(await p.locator('#yza .yza-bas button', { hasText: 'Analiz PDF' }).count(), 'Sporcu Analizi başlığında PDF düğmesi yok');
    await p.evaluate(() => yzaKapat());
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('sonuç ekranı → ' + n + ' sayfalık analiz PDF\'i; tek sporcu PDF\'i 1 sayfa; analiz penceresinde düğme');
  } finally {
    if (yedek) await p.evaluate((y) => { if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); if (y.ar) localStorage.setItem('dag_yz_arsiv', y.ar); else localStorage.removeItem('dag_yz_arsiv'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
