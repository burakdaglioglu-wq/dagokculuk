// Form Lab › Döndür (2026-10-28, kullanıcı: "telefondan kamerayı açınca açı ters yöne bakıyor, telefon açısını değiştir ekle").
// Sahte kamera akışı (640×360 kanvas, sol üstte kırmızı kare) canlı ekrana bağlanır; Döndür'e (gerçek tıklama) basınca
// ekrandaki video 360×640 olur ve kırmızı kare sağ üste geçer (90° saat yönü); 4 basışta düze döner. Telefondan gelen
// noktaların çevrilmesi (flDonNokta) ve seçimin cihazda kalması da doğrulanır.
import { dogrula, esit, sayfaAc, uygulamaAc, karisikSinifArac } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'formlab', 'kmFormLabCiz');
    await p.waitForSelector('.fl .fl-basla');
    await p.evaluate(() => {
      try { localStorage.removeItem('dagsk_formlab_donus'); } catch (e) {} _fl.donus = null;
      const cv = document.createElement('canvas'); cv.width = 640; cv.height = 360; const x = cv.getContext('2d');
      const ciz = () => { x.fillStyle = '#204060'; x.fillRect(0, 0, 640, 360); x.fillStyle = '#ff0000'; x.fillRect(0, 0, 90, 90); window._testRaf = requestAnimationFrame(ciz); }; ciz();
      _fl.durum = 'canli'; _fl.canli = { mod: 'ayna', kayit: false, kareler: [], yon: 'environment', ipucu: '', atisSay: 0 };
      kmFormLabCiz(); _fl.akis = cv.captureStream(30); _fl.akisTel = false; flCanliBagla();
    });
    const olc = () => p.evaluate(async () => {
      const v = document.getElementById('fl-canli-video');
      for (let i = 0; i < 40 && (v.readyState < 2 || !v.videoWidth); i++) await new Promise((r) => setTimeout(r, 50));
      await new Promise((r) => setTimeout(r, 300));
      const W = v.videoWidth, H = v.videoHeight, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(v, 0, 0);
      const kirmizi = (px, py) => { const d = x.getImageData(px, py, 1, 1).data; return d[0] > 180 && d[1] < 80; };
      return { W, H, solUst: kirmizi(20, 20), sagUst: kirmizi(W - 20, 20), sagAlt: kirmizi(W - 20, H - 20), solAlt: kirmizi(20, H - 20) };
    });
    let o = await olc();
    esit(`${o.W}x${o.H} ${o.solUst}`, '640x360 true', 'döndürmesiz görüntü');
    const btn = p.locator('#fl-don-btn');
    await btn.click(); o = await olc();
    esit(`${o.W}x${o.H} ${o.sagUst} ${o.solUst}`, '360x640 true false', '90°: dikey + kırmızı sağ üstte');
    dogrula((await btn.textContent()).includes('90°'), 'düğmede açı yazmıyor');
    await btn.click(); o = await olc();
    esit(`${o.W}x${o.H} ${o.sagAlt}`, '640x360 true', '180°: baş aşağı');
    await btn.click(); o = await olc();
    esit(`${o.W}x${o.H} ${o.solAlt}`, '360x640 true', '270°');
    esit(await p.evaluate(() => localStorage.getItem('dagsk_formlab_donus')), '270', 'seçim cihazda kalmalı');
    // telefon noktaları: kaynakta sol üst (0.1, 0.2) → 90°'de (0.8, 0.1); ters çevirme geri getirir
    const n = await p.evaluate(() => [flDonNokta([0.1, 0.2, 0.9], 90), flDonNokta(flDonNokta([0.1, 0.2], 90), 270), flDonNokta([0.1, 0.2], 180)].map((a) => a.map((v) => Math.round(v * 100) / 100).join(',')));
    esit(n.join(' | '), '0.8,0.1,0.9 | 0.1,0.2 | 0.9,0.8', 'nokta çevirme');
    await btn.click(); o = await olc();
    esit(`${o.W}x${o.H} ${o.solUst}`, '640x360 true', '4. basış düze döner');
    dogrula(await p.evaluate(() => !_fl.donAkis), 'düzken döndürme katmanı kapanmalı');
    await btn.click(); await p.evaluate(() => flCanliVazgec());
    dogrula(await p.evaluate(() => !_fl.donAkis), 'kapatınca döndürme katmanı kalmamalı');
    dogrula(!hatalar.length, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Döndür: 0° → 90° → 180° → 270° → 0°, piksel konumu doğru, noktalar çevriliyor, seçim kalıcı');
  } finally {
    await p.evaluate(() => { try { cancelAnimationFrame(window._testRaf); localStorage.removeItem('dagsk_formlab_donus'); _fl.donus = null; } catch (e) {} }).catch(() => {});
    await ctx.close();
  }
}
