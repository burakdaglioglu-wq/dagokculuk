// Form Lab (2026-10-03): Karışık Sınıf'ta videodan çapa/kol analizi. Model indirmeden test edilebilsin diye atış
// ayırma + çapa kilidi + bulgular, sabit kamerada 3 atış yapan SENTETİK bir iskelet dizisiyle doğrulanır
// (flHesapla saf fonksiyon). 3. atışta çapa bilerek ~0,19 omuz aşağıda: "çapa noktası değişiyor" çıkmalı.
import { dogrula, esit, sayfaAc, uygulamaAc, karisikSinifArac, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'formlab', 'kmFormLabCiz');
    await p.waitForSelector('.fl .fl-basla');
    dogrula(await p.locator('.fl-butonlar input[type=file]').count() === 2, 'çekim/seçim düğmeleri yok');
    dogrula(await yataydaTasmaYok(p), 'Form Lab yatayda taşıyor');

    const r = await p.evaluate(() => {
      const FPS = FL_FPS, kareler = [];
      const taban = () => Array.from({ length: 33 }, () => [0.5, 0.5, 1]);
      for (let atis = 0; atis < 3; atis++) {
        for (let f = 0; f < 6 * FPS; f++) {
          const t = f / FPS, p = taban();
          p[0] = [0.5, 0.30, 1]; p[9] = [0.51, 0.34, 1]; p[10] = [0.49, 0.34, 1];
          p[11] = [0.58, 0.42, 1]; p[12] = [0.42, 0.42, 1]; p[23] = [0.55, 0.75, 1]; p[24] = [0.45, 0.75, 1];
          const cekili = t >= 1 && t < 3.5, sonra = t >= 3.5 && t < 4.2;
          if (cekili || sonra) { p[13] = [0.70, 0.42, 1]; p[15] = [0.82, sonra ? 0.46 : 0.42, 1]; p[19] = [0.85, sonra ? 0.46 : 0.42, 1]; }
          else { p[13] = [0.60, 0.55, 1]; p[15] = [0.62, 0.68, 1]; p[19] = [0.62, 0.71, 1]; }
          p[14] = [0.30, 0.40, 1];
          if (t >= 1.5 && t < 3.5) { // çapada: çok küçük titreme; 3. atışta çapa ~0,03 (≈0,19 omuz) aşağıda
            const j = (Math.sin(f * 1.7) * 0.0015), dy = atis === 2 ? 0.03 : 0;
            p[20] = [0.50 + j, 0.38 + dy + j, 1]; p[16] = [0.47, 0.40 + dy, 1];
          } else if (t >= 1 && t < 1.5) { const k = (t - 1) / 0.5; p[20] = [0.40 + 0.10 * k, 0.68 - 0.30 * k, 1]; p[16] = [0.40, 0.65 - 0.25 * k, 1]; }
          else if (sonra) { p[20] = [0.33, 0.40, 1]; p[16] = [0.34, 0.41, 1]; }
          else { p[20] = [0.40, 0.68, 1]; p[16] = [0.40, 0.65, 1]; }
          kareler.push({ t: atis * 6 + t, p, h: null });
        }
      }
      _fl.el = 'oto';
      const s = flHesapla(kareler, 1000, 1000), b = flBulgular(s.ozet, 'yildizlar');
      return { n: s.ozet.n, taraf: s.ozet.taraf, tutma: s.atislar.map(a => a.tutma), kilitsiz: s.ozet.kilitsiz, capaFarkMm: flMm(s.ozet.capaFark, 'yildizlar'),
        uzak: s.atislar.map(a => flMm(a.capaUzak, 'yildizlar')), bulgu: b.map(x => x.hata), puan: flPuan(s.ozet), dusen: s.ozet.dusen };
    });
    esit(r.n, 3, 'atış sayısı');
    esit(r.taraf, 'sag', 'çekiş tarafı (otomatik)');
    esit(r.kilitsiz, 0, 'kilitlenmeyen atış olmamalı');
    dogrula(r.tutma.every(t => t >= 1.5 && t <= 2.5), 'çapada bekleme ~2 sn olmalı: ' + r.tutma.join(','));
    dogrula(r.uzak[2] > r.uzak[0] && r.uzak[2] > r.uzak[1], '3. atışın çapası en uzak olmalı: ' + r.uzak.join(','));
    dogrula(r.bulgu.includes('ankraj'), 'çapa noktası değişiyor bulgusu çıkmadı: ' + r.bulgu.join(','));
    dogrula(r.puan > 0 && r.puan < 100, 'tutarlılık puanı');

    // karne: kayıt yazılınca son analiz karnede görünür
    const karne = await p.evaluate(() => {
      const k = flRoster()[0]; if (!k) return 'sporcu-yok';
      _fl.secili = k.g + '|' + k.ad; _fl.sonuc = { ozet: { n: 3, capaFark: 0.1, kaymaOrt: 0.02, tutmaOrt: 2, tutmaSap: 0.2, yayKolOrt: 172, yayKolSap: 2, egimOrt: 0, dirsekYukOrt: 0, dusen: 0, kilitsiz: 0 }, atislar: [] };
      flKaydet();
      return formLabKarneHTML(k.g, k.ad);
    });
    dogrula(karne !== 'sporcu-yok', 'derste sporcu yok');
    dogrula(/FORM LAB/.test(karne) && /tutarlılık/.test(karne), 'karnede Form Lab özeti yok');
    dogrula(!hatalar.length, 'sayfa hatası: ' + hatalar.join(' | '));
    log('3 sentetik atış ayrıldı, ~2 sn kilit, kayan çapa bulundu, karneye yazıldı');
  } finally { await ctx.close(); }
}
