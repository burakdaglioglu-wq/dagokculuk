// 📹 Form Lab salon kamerası (2026-10-26, kullanıcı: "Tapo C212 var, PC'ye bağlayacağım; kulüpte internet yok, telefondan sağlıyorum").
// Gerçek köprü (go2rtc) ve kamera testte yok: kurulum penceresi, köprü yokken / kamera tanımsızken / hazırken durum satırı, indirilen
// .bat dosyası, salon akışının Form Lab'a bağlanması (sahte MediaStream) ve bağlanamayınca bu cihazın kamerasına dönüş doğrulanır.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'formlab', 'kmFormLabCiz');
    await p.waitForSelector('.fl .fl-basla');
    yedek = await p.evaluate(() => ({ k: localStorage.getItem('dagsk_formlab_kamera'), q: localStorage.getItem('dagsk_salon_kalite') }));
    await p.evaluate(() => { localStorage.setItem('dagsk_salon_kalite', 'hd'); });
    dogrula(await p.evaluate(() => flSalonGoster()), 'kurulmuş cihazda salon kamerası listede olmalı');

    // köprü yok → "Köprü çalışmıyor"
    await p.evaluate(() => flSalonKurulum());
    await p.waitForFunction(() => /Köprü çalışmıyor/.test((document.getElementById('fl-salon-durum') || {}).textContent || ''), null, { timeout: 8000 });
    const pen = await p.evaluate(() => ({ adim: document.querySelectorAll('#onay-modal ol li').length, link: (document.querySelector('#onay-modal a[download]') || {}).getAttribute && document.querySelector('#onay-modal a[download]').getAttribute('href'), tasma: [...document.querySelectorAll('#onay-modal *')].some((e) => e.getBoundingClientRect().right > innerWidth + 1) }));
    dogrula(pen.adim === 5 && pen.link === '/dagsk-kamera-koprusu.bat' && !pen.tasma, 'kurulum penceresi: ' + JSON.stringify(pen));
    const bat = await p.evaluate(async () => { let r = await fetch('/dagsk-kamera-koprusu.bat', { cache: 'no-store' }); let t = await r.text(); return { ok: r.ok, go2rtc: /go2rtc_win64\.zip/.test(t) && /tapo: rtsp:\/\//.test(t) && /tapo_dusuk:/.test(t) && /127\.0\.0\.1:1984/.test(t), crlf: /\r\n/.test(t) }; });
    dogrula(bat.ok && bat.go2rtc && bat.crlf, 'köprü dosyası indirilebilmeli: ' + JSON.stringify(bat));

    // sahte köprü: önce kamera tanımsız, sonra hazır
    await p.evaluate(() => {
      window._gercekFetch = window._gercekFetch || window.fetch; window._akislar = {};
      window.fetch = (u, o) => { u = String(u); if (u.startsWith(FL_KOPRU + '/api/streams')) return Promise.resolve(new Response(JSON.stringify(window._akislar))); if (u.startsWith(FL_KOPRU + '/api')) return Promise.resolve(new Response('{"version":"test"}')); return window._gercekFetch(u, o); };
    });
    await p.evaluate(() => flSalonTeshis());
    dogrula(/kamera tanımlı değil/.test(await p.locator('#fl-salon-durum').textContent()), 'kamera tanımsız uyarısı');
    await p.evaluate(() => { window._akislar = { tapo: {}, tapo_dusuk: {} }; return flSalonTeshis(); });
    dogrula(/Köprü çalışıyor, kamera tanımlı/.test(await p.locator('#fl-salon-durum').textContent()), 'hazır durumu');
    // kalite seçimi
    await p.locator('#onay-modal button:has-text("Hafif")').click();
    esit(await p.evaluate(() => flSalonAkisAdi()), 'tapo_dusuk', 'hafif akış');
    await p.locator('#onay-modal button:has-text("2K")').click();
    esit(await p.evaluate(() => flSalonAkisAdi()), 'tapo', '2K akış');

    // bağlan: salon akışı Form Lab'ın akışı olur (sahte MediaStream)
    const bag = await p.evaluate(async () => {
      let cv = document.createElement('canvas'); cv.width = 320; cv.height = 180; let c = cv.getContext('2d'); c.fillStyle = '#0a0'; c.fillRect(0, 0, 320, 180);
      let sahte = cv.captureStream(10); window._gercekSalon = window._gercekSalon || flSalonAkis; flSalonAkis = async () => sahte;
      document.getElementById('onay-modal').style.display = 'none';
      _fl.kamera = 'salon'; _fl.salonElle = true; await flKameraBaslat();
      return { ayni: _fl.akis === sahte, kayit: localStorage.getItem('dagsk_formlab_kamera') };
    });
    dogrula(bag.ayni, 'salon akışı Form Lab akışı olmalı: ' + JSON.stringify(bag));

    // bağlanamayınca: bu cihazın kamerasına döner, elle seçildiyse kurulum penceresi açılır
    const dus = await p.evaluate(async () => {
      flSalonAkis = async () => { throw new Error('görüntü gelmedi'); };
      _fl.kamera = 'salon'; _fl.salonElle = true; try { await flKameraBaslat(); } catch (e) {}
      return { kamera: _fl.kamera, modal: getComputedStyle(document.getElementById('onay-modal')).display, durum: !!document.getElementById('fl-salon-durum') };
    });
    dogrula(dus.kamera === 'oto' && dus.modal !== 'none' && dus.durum, 'bağlanamayınca dönüş + kurulum: ' + JSON.stringify(dus));

    // gerçek bağlantı denemesi köprü yokken temiz başarısız olur (asılı video / açık bağlantı kalmaz)
    const gercek = await p.evaluate(async () => {
      window.fetch = window._gercekFetch; flSalonAkis = window._gercekSalon;
      let t0 = Date.now(), hata = null; try { await flSalonAkis(); } catch (e) { hata = String(e && e.message || e); }
      return { hata, sn: (Date.now() - t0) / 1000, pc: !!_fl.salonPc, mse: !!_fl.salonMse };
    });
    await p.evaluate(() => flSalonKapat());
    dogrula(gercek.hata && gercek.sn < 25, 'köprü yokken hata vermeli: ' + JSON.stringify(gercek));
    dogrula(await p.evaluate(() => !_fl.salonPc && !_fl.salonMse && !document.querySelector('video[style*="-9999px"]')), 'kapatınca iz kalmamalı');
    await p.evaluate(() => { document.getElementById('onay-modal').style.display = 'none'; });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kurulum penceresi (5 adım, .bat), köprü yok / kamera tanımsız / hazır, 2K/Hafif, salon akışı bağlanır, düşünce cihaz kamerası, temiz hata');
  } finally {
    if (yedek) await p.evaluate((y) => { try { if (window._gercekFetch) window.fetch = window._gercekFetch; if (window._gercekSalon) flSalonAkis = window._gercekSalon; flSalonKapat(); flAkisBirak(); } catch (e) {} if (y.k) localStorage.setItem('dagsk_formlab_kamera', y.k); else localStorage.removeItem('dagsk_formlab_kamera'); if (y.q) localStorage.setItem('dagsk_salon_kalite', y.q); else localStorage.removeItem('dagsk_salon_kalite'); }, yedek).catch(() => {});
    await ctx.close();
  }
}
