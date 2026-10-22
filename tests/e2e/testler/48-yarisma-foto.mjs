// 📷 Yarışmada fotoğraflar (2026-10-21, kullanıcı taslaktan B "Sahne"yi seçti): TV tablosunda yüz, (v307'de kaldırıldı) "Şimdi atıyor" şeridi (giriş
// açıkken girilen oklar), hedef kartlarında ve giriş penceresinde fotoğraflı hedef rozeti, sıra yükselince fotoğraflı duyuru.
// 4 sporcuya geçici fotoğraf (izin Var) verilir; sonda kaldırılır. Tur kayda işlemez (kayit=false), eski tur geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1440, yukseklik: 860 });
  let yedek = null, anahtarlar = [];
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ yz: localStorage.getItem(yzAnahtar()), liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()) }));
    anahtarlar = await p.evaluate(async () => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif && !turnuvaDB[g][ad].donduruldu) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 5); localStorage.removeItem(kmHatAnahtari()); localStorage.removeItem(yzAnahtar()); _yz.kurulum = null; yzModAyarla('siralama');
      let k = [];
      for (let i = 0; i < 4; i++) { let x = _kmListe[i], c = document.createElement('canvas'); c.width = c.height = 64; let t = c.getContext('2d'); t.fillStyle = ['#36c', '#c63', '#3a6', '#93c'][i]; t.fillRect(0, 0, 64, 64);
        let a = fotoAnahtar(x.g, x.ad); await fotoKaydet(a, { veri: c.toDataURL('image/jpeg', .8), izin: 1 }); k.push(a); }
      yzCiz(); return k;
    });
    await p.evaluate(() => yzKurAyar('kayit', false));
    await p.locator('button:has-text("Turu başlat")').click(); await p.waitForTimeout(400);
    // 1. seri: herkes girer → 2. seri
    await p.evaluate(() => { let o = yzOku(); yzHedefSirasi(o).forEach((k, i) => { yzGirisAc(yzEnc(k), 0); [['10', '10', '9', '9', '8', '8'], ['10', '9', '9', '8', '8', '7'], ['9', '9', '8', '8', '7', '7'], ['9', '8', '8', '7', '7', '6'], ['8', '7', '7', '6', '6', '5']][i].forEach((v) => yzOkEkle(v)); _yz.siradaki = false; yzGirisKaydet(); }); yzSonrakiSeri(true); });
    await p.waitForTimeout(300);
    // hedef kartı fotoğraflı rozet
    dogrula(await p.locator('.yz-sp .yz-sp-foto').count() >= 1, 'hedef kartında fotoğraflı rozet yok');
    await p.locator('.yz-tur-btn button:has-text("TV ekranı")').click(); await p.waitForTimeout(700);
    dogrula(await p.evaluate(() => [...document.querySelectorAll('#yz-tv td.ad .yz-yuz')].filter((e) => /api\/foto/.test(e.getAttribute('style') || '')).length) >= 4, 'TV tablosunda yüzler yok');
    esit(await p.locator('#yz-tv td.ad .yz-yuz').count(), 5, 'her satırda yüz (fotoğrafsızda baş harf)');
    // v307: 'Şimdi atıyor' hedef kartları TV'den kaldırıldı (tablo yer kazandı)
    esit(await p.locator('#yz-tv .yz-tv-simdi').count(), 0, '"Şimdi atıyor" şeridi TV\'de olmamalı');
    // giriş penceresi: fotoğraflı rozet
    const ilk = await p.evaluate(() => { let o = yzOku(), s = yzHedefSirasi(o); let k = s.find((x) => /api\/foto/.test(yzFotoSrc(x))); yzGirisAc(yzEnc(k), 1); yzOkEkle('10'); yzOkEkle('9'); return k; });
    dogrula(await p.locator('#yz-giris .yz-giris-bas .yz-sp-foto').count() === 1, 'giriş penceresinde fotoğraf yok');
    // sıra yükselişi duyurusu: son sıradakine çok yüksek seri → fotoğraflı "yükseldi"
    await p.evaluate(() => { try { yzGirisKapat(); } catch (e) { _yz.giris = null; } let o = yzOku(), sira = yzSiralama(o), son = sira[sira.length - 1].k; yzGirisAc(yzEnc(son), 1); ['X', 'X', 'X', 'X', 'X', 'X'].forEach((v) => yzOkEkle(v)); _yz.siradaki = false; yzGirisKaydet(); try { yzGirisKapat(); } catch (e) {} });
    await p.waitForTimeout(600);
    dogrula(await p.evaluate(() => { let d = document.querySelector('#yz-tv .yz-tv-dy.yuksel'); return !!d && /sıraya yükseldi/.test(d.textContent) && !!d.querySelector('.yz-yuz'); }), 'fotoğraflı yükseliş duyurusu yok');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('TV yüzleri, şimdi atıyor şeridi, fotoğraflı rozet, yükseliş duyurusu tamam (' + ilk + ')');
  } finally {
    await p.evaluate(async (a) => { for (const k of a) await fotoKaydet(k, { veri: null, izin: null }).catch(() => {}); }, anahtarlar).catch(() => {});
    if (yedek) await p.evaluate((y) => { try { yzTvKapat(); } catch (e) {} if (y.yz) localStorage.setItem(yzAnahtar(), y.yz); else localStorage.removeItem(yzAnahtar()); _kmListe = JSON.parse(y.liste); if (y.hat) localStorage.setItem(kmHatAnahtari(), y.hat); else localStorage.removeItem(kmHatAnahtari()); }, yedek).catch(() => {});
    await ctx.close();
  }
}
