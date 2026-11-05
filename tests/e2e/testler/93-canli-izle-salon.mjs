// 📹 Yarışma › Atış Hattı · Canlı İzle (2026-11-02, kullanıcı: "yarışma sekmesinde bir bölüm oluştur, bu bölümde sporcu atarken
// izlenebilsin" — Tapo salon kamerasıyla). Gerçek köprü testte yok: flSalonAkis sahte akış döner. Doğrulanan: tür seçiminde kart,
// pencere canlı modda salon kaynağıyla açılır, görüntü bağlanır, "Kim atıyor?" başlığı değiştirir, ⧉ köşeye alır (Esc alttaki
// ekrana kalır), kapatınca salon bağlantısı kapanır ve Form Lab'ın kendi bağlantısına dokunulmaz; bağlanamayınca kurulum/tekrar.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 860 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma', 'kmYarismaGiris');
    yedek = await p.evaluate(() => ({ kaynak: localStorage.getItem('kv_kaynak'), liste: JSON.stringify(_kmListe) }));
    await p.evaluate(() => dagskEkYukle('dagsk-km-formlab.js'));
    await p.evaluate(() => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 3);
      window._kapatilan = 0; window._gercekKapat = flSalonKapat; flSalonKapat = function () { window._kapatilan++; return window._gercekKapat(); };
      window._gercekSalon = flSalonAkis;
      flSalonAkis = async () => { let cv = document.createElement('canvas'); cv.width = 640; cv.height = 360; let c = cv.getContext('2d'); c.fillStyle = '#0a0'; c.fillRect(0, 0, 640, 360); _fl.salonPc = { close() { window._pcKapandi = true; } }; return cv.captureStream(10); };
      _fl.salonPc = 'FORMLAB'; // Form Lab'ın kendi bağlantısı varmış gibi — pencere buna dokunmamalı
      localStorage.setItem('kv_kaynak', 'yerel'); yzSecimCiz();
    });
    dogrula(await p.locator('.yz-tur:has-text("Canlı İzle")').isVisible(), 'tür seçiminde Canlı İzle kartı yok');
    await p.locator('.yz-tur:has-text("Canlı İzle")').click();
    await p.waitForFunction(() => typeof _kv !== 'undefined' && _kv && _kv.akisSalon && document.getElementById('kv-v') && document.getElementById('kv-v').srcObject, null, { timeout: 15000 });
    const ac = await p.evaluate(() => ({ mod: _kv.mod, kaynak: _kv.kaynak, chip: !!document.querySelector('#kv .kv-grup button.aktif') && /Salon/.test(document.querySelector('#kv .kv-grup button.aktif').textContent), fl: _fl.salonPc, sec: document.querySelectorAll('#kv .kv-sporcu option').length }));
    dogrula(ac.mod === 'canli' && ac.kaynak === 'salon' && ac.chip && ac.fl === 'FORMLAB' && ac.sec >= 3, 'canlı + salon: ' + JSON.stringify(ac));
    // kim atıyor
    const k = await p.evaluate(() => document.querySelectorAll('#kv .kv-sporcu option')[2].value);
    await p.locator('#kv .kv-sporcu').selectOption(k);
    dogrula((await p.locator('#kv-ad').innerText()).includes(k.split('|')[1]), 'başlık sporcu adını göstermedi');
    esit(await p.evaluate(() => _kv.k), k, 'seçili sporcu');
    // köşeye al: küçük pencere, Esc pencereyi kapatmaz
    await p.locator('#kv button[aria-label="Köşeye al"]').click(); await p.waitForTimeout(150);
    const kutu = await p.locator('#kv').boundingBox();
    dogrula(kutu.width <= 400 && kutu.x > 600, 'köşe penceresi: ' + JSON.stringify(kutu));
    await p.keyboard.press('Escape');
    dogrula(await p.evaluate(() => !!_kv), 'köşedeyken Esc pencereyi kapattı');
    dogrula((await p.locator('#kv-mini-ad').innerText()).includes(k.split('|')[1]), 'köşe başlığında ad yok');
    await p.locator('#kv button[aria-label="Büyüt"]').click();
    dogrula(!(await p.evaluate(() => document.getElementById('kv').classList.contains('kv-mini'))), 'büyütülmedi');
    // kapat: kendi bağlantısı kapanır, Form Lab'ınki kalır
    await p.evaluate(() => kvKapat());
    const kap = await p.evaluate(() => ({ pc: !!window._pcKapandi, fl: _fl.salonPc }));
    dogrula(kap.pc && kap.fl === 'FORMLAB', 'kapatma: ' + JSON.stringify(kap));
    // bağlanamayınca: tekrar dene + kurulum
    await p.evaluate(() => { flSalonAkis = async () => { throw new Error('görüntü gelmedi'); }; yzCanliIzle(); });
    await p.waitForFunction(() => /bağlanılamadı/.test((document.getElementById('kv-sahne') || {}).textContent || ''), null, { timeout: 10000 });
    dogrula(await p.locator('#kv button:has-text("Kurulum")').isVisible() && await p.locator('#kv button:has-text("Tekrar dene")').isVisible(), 'hata ekranı düğmeleri');
    await p.evaluate(() => kvKapat());
    // tur ekranında araç düğmesi
    dogrula(await p.evaluate(() => /yzCanliIzle/.test(yzMenu.toString())), 'tur Diğer menüsünde Canlı izle yok');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('tür seçiminde kart, canlı + salon kaynağı, kim atıyor, köşeye al (Esc alta kalır), ayrı bağlantı kapanır, hata ekranı');
  } finally {
    if (yedek) await p.evaluate((y) => { try { kvKapat(); } catch (e) {} try { if (window._gercekSalon) flSalonAkis = window._gercekSalon; if (window._gercekKapat) flSalonKapat = window._gercekKapat; _fl.salonPc = null; } catch (e) {} if (y.kaynak) localStorage.setItem('kv_kaynak', y.kaynak); else localStorage.removeItem('kv_kaynak'); try { _kmListe = JSON.parse(y.liste); } catch (e) {} }, yedek).catch(() => {});
    await ctx.close();
  }
}
