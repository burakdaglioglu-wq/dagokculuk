// Form Lab kalibrasyonu (2026-10-08): gerçek kulüp videolarını Form Lab'ın "Videodan seç" yolundan geçirir, bulunan atış
// sayısını ve kare kare ölçüleri (çekiş eli–ağız / omuz, yay kolu açısı, el bulunma) döker. Model internetten iner.
// Kullanım: node tests/e2e/_formlab-kalibrasyon.mjs video1.mp4 [video2.mp4 …]
import { sayfaAc, uygulamaAc, karisikSinifArac, tarayiciKapat } from './yardimci.mjs';

const dosyalar = process.argv.slice(2);
const { p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
try {
  await uygulamaAc(p);
  await karisikSinifArac(p, 'formlab', 'kmFormLabCiz');
  for (const f of dosyalar) {
    await p.evaluate(() => { _fl.durum = 'bos'; _fl.sonuc = null; kmFormLabCiz(); });
    await p.locator('.fl-butonlar input[type=file]').first().setInputFiles(f);
    await p.waitForFunction(() => _fl.durum === 'sonuc' || _fl.durum === 'hata', null, { timeout: 300000 });
    const r = await p.evaluate(() => {
      const s = _fl.sonuc; if (!s) return { hata: _fl.mesaj };
      const W = s.W, H = s.H, P = FL_P, px = (q, i) => [q[i][0] * W, q[i][1] * H], d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
      const sat = s.kareler.map((k) => {
        if (!k.p) return null;
        const q = k.p, S = d(px(q, P.omuzSol), px(q, P.omuzSag)) || 1, ag = flOrta(px(q, P.agizSol), px(q, P.agizSag));
        const sag = d(px(q, P.isaretSag), ag) / S, sol = d(px(q, P.isaretSol), ag) / S;
        const yaySol = flAci(px(q, P.omuzSol), px(q, P.dirsekSol), px(q, P.bilekSol)), yaySag = flAci(px(q, P.omuzSag), px(q, P.dirsekSag), px(q, P.bilekSag));
        return { t: k.t.toFixed(1), S: Math.round(S), sag: sag.toFixed(2), sol: sol.toFixed(2), ySol: Math.round(yaySol), ySag: Math.round(yaySag), el: k.h ? 1 : 0, gor: [11, 12, 13, 14, 15, 16].map((i) => q[i][2].toFixed(1)).join('/') };
      });
      return { W, H, sure: s.sure, n: s.atislar.length, atislar: s.atislar.map((a) => ({ bas: a.bas / FL_FPS, son: a.son / FL_FPS, tut: a.tutmaSn, kaynakEl: a.kaynakEl, yay: a.yayKol })), bos: s.kareler.filter((k) => !k.p).length, toplam: s.kareler.length, sat };
    });
    console.log('\n=== ' + f.split(/[\\/]/).pop() + ' ===');
    if (r.hata) { console.log('HATA', r.hata); continue; }
    console.log(`W×H ${r.W}×${r.H} · ${r.sure?.toFixed?.(1)} sn · iskeletsiz kare ${r.bos}/${r.toplam} · BULUNAN ATIŞ ${r.n}`, JSON.stringify(r.atislar));
    r.sat.forEach((x, i) => { if (x && i % 2 === 0) console.log(`${x.t}s S=${x.S} eli-ağız sağ ${x.sag} sol ${x.sol} | yay açısı sol ${x.ySol} sağ ${x.ySag} | el ${x.el} | gör ${x.gor}`); });
  }
  console.log('sayfa hataları', hatalar);
} finally { await tarayiciKapat(); }
