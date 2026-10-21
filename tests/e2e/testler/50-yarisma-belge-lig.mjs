// 📜🏆📋 Yarışma ekleri (2026-10-21): fotoğraflı başarı belgesi (A · Klasik, PDF), kulüp ligi (kategori içi puan 25-18-15…,
// +2 katılım, yalnız "lige sayılsın" turlar, sezon Eylül), resmi skor kağıdı (hedef başına A4). Tur kayda işlemez; arşiv yalnız
// yerelde sahte kayıtlarla denenir ve sonda geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 800 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()), arsiv: localStorage.getItem('dag_yz_arsiv') }));
    await p.evaluate(() => dagskEkYukle('dagsk-yarisma-ek.js?v=1'));
    // ---- 🏆 lig hesabı (sahte arşiv, sunucuya yazılmaz) ----
    const lig = await p.evaluate(() => {
      let t = new Date(); t.setDate(15); let s = (k, ad, sira, toplam) => ({ k, ad, sira, toplam });
      localStorage.setItem('dag_yz_arsiv', JSON.stringify([
        { id: 'e2e-l1', lig: true, t: Date.now() - 3000, tarih: '2026-10-01', mesafe: '18m', sporcular: [s('buyukler|A A', 'A A', 1, 600), s('minikler|M M', 'M M', 2, 400), s('buyukler|B B', 'B B', 3, 550)] },
        { id: 'e2e-l2', lig: true, t: Date.now() - 2000, tarih: '2026-10-08', mesafe: '18m', sporcular: [s('buyukler|B B', 'B B', 1, 610), s('buyukler|A A', 'A A', 2, 610), s('minikler|M M', 'M M', 3, 300)] },
        { id: 'e2e-x', lig: false, t: Date.now() - 1000, tarih: '2026-10-09', mesafe: '18m', sporcular: [s('buyukler|B B', 'B B', 1, 700)] }]));
      let h = yzlHesap(yzlSezon(Date.now()));
      return { tur: h.turlar.length, b: h.kat.buyukler.map((x) => x.ad + ':' + x.puan), m: h.kat.minikler.map((x) => x.ad + ':' + x.puan) };
    });
    esit(lig.tur, 2, 'yalnız lige sayılan turlar');
    // A: 1. (25+2) + eşit 1. (25+2) = 54 · B: 2. (18+2) + eşit 1. (25+2) = 47 · M: kendi kategorisinde iki kez 1. = 54
    esit(lig.b.join(','), 'A A:54,B B:47', 'büyükler lig puanı');
    esit(lig.m.join(','), 'M M:54', 'minikler kendi kategorisinde puan alır');
    await p.evaluate(() => yzLigAc()); await p.waitForSelector('#yzl-ekran tbody tr');
    esit(await p.locator('#yzl-ekran tbody tr').count(), 2, 'lig tablosu satırı');
    await p.evaluate(() => yzLigKapat());
    // ---- 📋 skor kağıdı + 📜 belge (gerçek tur, kayda işlemez) ----
    await p.evaluate(() => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif && !turnuvaDB[g][ad].donduruldu) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 5); localStorage.removeItem(kmHatAnahtari()); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama'); yzCiz();
      yzKurAyar('kayit', false); yzKurulumTaslak().lig = true;
    });
    await p.locator('button:has-text("Turu başlat")').click(); await p.waitForTimeout(400);
    esit(await p.evaluate(() => yzOku().durum.ayar.lig), true, 'lig işareti tura geçmeli');
    const [kd] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.locator('button:has-text("Skor kâğıtları")').first().click()]);
    dogrula(/Skor_Kagitlari/.test(kd.suggestedFilename()), 'skor kağıdı PDF adı: ' + kd.suggestedFilename());
    await p.evaluate(() => { let o = yzOku(); yzHedefSirasi(o).forEach((k, i) => { yzGirisAc(yzEnc(k), 0); ['10', '9', '9', '8', '8', '7'].slice(i % 3).concat(['7', '7', '7']).slice(0, 6).forEach((v) => yzOkEkle(v)); _yz.siradaki = false; yzGirisKaydet(); }); yzGuncelle((x) => { x.durum.asama = 'bitti'; }); yzCiz(); });
    await p.waitForSelector('button:has-text("Belgeler")', { timeout: 10000 });
    await p.locator('button:has-text("Belgeler")').first().click();
    await p.waitForSelector('#yzb-pencere');
    const genislik = await p.evaluate(async () => { await yzBelgeGoster(0); return document.querySelector('#yzb-onizleme canvas').width; });
    esit(genislik, 2339, 'belge tuvali A4 yatay');
    const [bd] = await Promise.all([p.waitForEvent('download', { timeout: 90000 }), p.evaluate(() => yzBelgePdf())]);
    dogrula(/Basari_Belgeleri/.test(bd.suggestedFilename()), 'belge PDF adı: ' + bd.suggestedFilename());
    await p.evaluate(() => document.getElementById('yzb-pencere').remove());
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('lig puanı (kategori içi, eşitlik, +2), skor kağıdı PDF, belge PDF tamam');
  } finally {
    if (yedek) await p.evaluate((y) => { if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); _kmListe = JSON.parse(y.liste); if (y.hat) localStorage.setItem(kmHatAnahtari(), y.hat); else localStorage.removeItem(kmHatAnahtari()); if (y.arsiv) localStorage.setItem('dag_yz_arsiv', y.arsiv); else localStorage.removeItem('dag_yz_arsiv'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
