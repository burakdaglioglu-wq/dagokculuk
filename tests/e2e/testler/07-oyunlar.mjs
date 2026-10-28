// Karışık Sınıf › Oyunlar: her tema bireysel + takım modunda açılır, kart ve liderlik çizilir, sıralama modları çalışır.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

const TEMALAR = ['zirve', 'yildiz', 'hazine', 'pist', 'ninja', 'monopoly', 'dag', 'balon', 'hedef', 'futbol', 'futboltakim', 'arena', 'sisharita', 'kehanet', 'gizlikelime', 'kule', 'canavar', 'hapsirik', 'akvaryum', 'kale', 'yukselis'];

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    const sorunlu = [];
    for (const t of TEMALAR) for (const takim of [false, true]) {
      const r = await p.evaluate(([t, takim]) => {
        try {
          kmOyunTemaSec(t);
          if (t !== 'futbol' && t !== 'futboltakim' && typeof kmOyunModSec === 'function') kmOyunModSec(takim);
          kmOyunChipleriCiz(); kmOyunLiderCiz();
          for (const m of ['adil', 'yukselen', 'lig', 'puan']) kmOyunSiralamaModuSec(m);
          kmOyunSporcuIzgaraAcKapat(); kmOyunSporcuIzgaraAcKapat();
          return { ok: !!document.querySelector('#km-oyun-chips .km-sk-kart') && !!document.getElementById('km-oyun-lider-ic') };
        } catch (e) { return { hata: e.message }; }
      }, [t, takim]);
      if (!r.ok) sorunlu.push(`${t}/${takim ? 'takım' : 'bireysel'}: ${r.hata || 'kart/liderlik çizilmedi'}`);
    }
    dogrula(!sorunlu.length, 'sorunlu temalar: ' + sorunlu.join('; '));
    // Tam ekranda onay penceresi görünmeli (2026-10-09: seri limiti dolunca İlerlet'in onayı tam ekranın
    // arkasında kalıyor, oyun ilerlemiyordu) — katmanlar tam ekran öğesine taşınır, çıkınca geri döner.
    const tam = await p.evaluate(async () => {
      kmOyunTemaSec('zirve');
      try { await document.getElementById('km-oyun-wrap').requestFullscreen(); } catch (e) { return { atla: e.message }; }
      await new Promise((r) => setTimeout(r, 300));
      const icinde = document.getElementById('onay-modal').parentNode.id;
      await document.exitFullscreen(); await new Promise((r) => setTimeout(r, 300));
      return { icinde, sonra: document.getElementById('onay-modal').parentNode === document.body };
    });
    if (!tam.atla) { esit(tam.icinde, 'km-oyun-wrap', 'tam ekranda onay penceresi oyunun içine taşınmadı'); dogrula(tam.sonra, 'tam ekrandan çıkınca onay penceresi geri dönmedi'); }
    // Karakter seçici: 26 karakter (14 yeni), yeni bir hayvan seçilip sahnede çizilir
    const kar = await p.evaluate(() => { kmOyunKarakterSecAc(0); const n = document.querySelectorAll('.km-oyun-karakter-sec').length; kmOyunKarakterSec(0, 19); return { n, cizildi: !!document.querySelector('#km-oyun-sahne image[href*="yunus"]') }; });
    esit(kar.n, 26, 'karakter sayısı'); dogrula(kar.cizildi, 'seçilen yeni karakter sahnede çizilmedi');
    // Kelime Hedefi ayrı dosyada (dagsk-km-kelime.js) — Oyunlar seçicisinden açılınca yüklenmeli ve çizilmeli
    esit(await p.evaluate(() => typeof kmKelimeCiz), 'undefined', 'Kelime Hedefi açılışta yüklenmemeli');
    await p.evaluate(() => kmOyunKelimeAc());
    await p.waitForFunction(() => typeof kmKelimeCiz === 'function', null, { timeout: 20000 });
    await p.waitForTimeout(600);
    dogrula((await p.locator('#km-icerik').innerText()).length > 50, 'Kelime Hedefi çizilmedi');
    // Yeni görev (2026-10-15, kullanıcı: "Uzay belirli bir kısımdan sonra ilerlemiyor"): sona varmış (frac 1) sporcu yeni seri
    // girince yol baştan başlar, görev sayısı artar — eskiden sonsuza kadar Mars'ta kalıyordu.
    const gorev = await p.evaluate(async () => {
      kmOyunTemaSec('yildiz'); if (typeof kmOyunModSec === 'function') kmOyunModSec(false);
      let s = _kmOyunRosterCache[0]; if (!s) return { atla: true };
      let d = kmOyunDurumAl(s.g, s.ad); d.frac = 1; d.gorev = 1; s.frac = 1; kmOyunDurumKaydet();
      let sp = turnuvaDB[s.g][s.ad]; sp.devamModu = true;
      kmOyunSporcuSec(0); _kmOyunSeriGirisleri = Array(_kmOyunOkSayisi).fill('8'); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let i = 0; i < 60 && _kmOyunKilit; i++) await new Promise((r) => setTimeout(r, 200));
      let m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let i = 0; i < 60 && _kmOyunKilit; i++) await new Promise((r) => setTimeout(r, 200)); }
      return { frac: kmOyunDurumAl(s.g, s.ad).frac, gorev: kmOyunDurumAl(s.g, s.ad).gorev };
    });
    if (!gorev.atla) { dogrula(gorev.frac > 0 && gorev.frac < 1, 'Marstaki roket yeni göreve başlamadı: frac ' + gorev.frac); esit(gorev.gorev, 2, 'görev sayısı'); }
    // 🏅 Oyun madalya töreni (2026-10-15): bugün ilk 3 sona varınca tören önerilir; podyum varış sırasıyla
    const toren = await p.evaluate(async () => {
      kmOyunTemaSec('yildiz'); if (typeof kmOyunModSec === 'function') kmOyunModSec(false);
      let r = _kmOyunRosterCache; if (r.length < 3) return { atla: true };
      let t0 = Date.now(); r.forEach((s, i) => { let d = kmOyunDurumAl(s.g, s.ad); d.varis = i < 3 ? t0 - (3 - i) * 1000 : null; });
      _kmOyunTorenTeklif = {}; kmOyunTorenTeklifKontrol();
      let teklif = getComputedStyle(document.getElementById('onay-modal')).display !== 'none' && /Madalya töreni/.test(document.getElementById('onay-mesaj').innerText);
      onayOnayla();
      for (let i = 0; i < 50 && !document.getElementById('yz-toren'); i++) await new Promise((res) => setTimeout(res, 200));
      let acildi = !!document.getElementById('yz-toren'), ilk = kmOyunTorenSiralama()[0].s.ad;
      try { yzTorenBitir(); } catch (e) {}
      try { if (document.fullscreenElement) await document.exitFullscreen(); } catch (e) {}
      r.forEach((s) => { kmOyunDurumAl(s.g, s.ad).varis = null; });
      return { teklif, acildi, ilkDogru: ilk === r[0].ad };
    });
    if (!toren.atla) { dogrula(toren.teklif, 'ilk 3 bitince tören önerilmedi'); dogrula(toren.acildi, 'tören açılmadı'); dogrula(toren.ilkDogru, 'podyum varış sırasına göre değil'); }
    // 👆 Sahnede bir sporcunun karakterine/adına dokununca o seçilir (2026-10-17) — gerçek fare tıklamasıyla
    await p.evaluate(() => kmAracSec('oyunlar')); await p.waitForSelector('#km-oyun-wrap', { timeout: 20000 });
    for (const t of ['zirve', 'canavar', 'hedef']) {
      await p.evaluate((t) => { kmOyunTemaSec(t); if (typeof kmOyunModSec === 'function') kmOyunModSec(false); kmOyunSporcuSec(0); }, t);
      await p.waitForTimeout(1200);
      const r = await p.evaluate((t) => { for (let i = 1; i < _kmOyunRosterCache.length; i++) { const el = _kmOyunRosterCache[i][t + 'El']; if (!el) continue; for (const q of [el, ...el.querySelectorAll('*')]) { const b = q.getBoundingClientRect(); if (!b.width) continue; const x = b.x + b.width / 2, y = b.y + b.height / 2, e = document.elementFromPoint(x, y); if (e && el.contains(e)) return { x, y, i }; } } return null; }, t);
      dogrula(r, t + ': tıklanabilir sporcu bulunamadı');
      await p.mouse.click(r.x, r.y); await p.waitForTimeout(300);
      esit(await p.evaluate(() => _kmOyunAktifIndex), r.i, t + ': isme dokununca sporcu seçilmedi');
    }
    // ⛰️ Zirve 3 (2026-10-16): puan = metre (+N m), kampa varınca kamp görevi; sıradaki seride yapılırsa 🚩 bayrak + 90 m
    await p.evaluate(() => kmAracSec('oyunlar')); await p.waitForSelector('#km-oyun-wrap', { timeout: 20000 });
    const zirve = await p.evaluate(async () => {
      kmOyunTemaSec('zirve'); if (typeof kmOyunModSec === 'function') kmOyunModSec(false);
      let s = _kmOyunRosterCache[0]; if (!s) return { atla: true };
      kmZirveGunlukSifirla();
      let d = kmOyunDurumAl(s.g, s.ad); d.frac = 0.1; d.zirveGorev = null; s.frac = 0.1; kmOyunDurumKaydet();
      turnuvaDB[s.g][s.ad].devamModu = true;
      const seri = async (oklar) => {
        kmOyunSporcuSec(0); _kmOyunSeriGirisleri = oklar.slice(0, _kmOyunOkSayisi); while (_kmOyunSeriGirisleri.length < _kmOyunOkSayisi) _kmOyunSeriGirisleri.push(oklar[0]); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
        for (let i = 0; i < 60 && _kmOyunKilit; i++) await new Promise((r) => setTimeout(r, 200));
        let m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let i = 0; i < 60 && _kmOyunKilit; i++) await new Promise((r) => setTimeout(r, 200)); }
      };
      await seri(['8', '8', '8']);
      let metre = _kmZirveSeriSon && _kmZirveSeriSon.metre, g1 = kmOyunDurumAl(s.g, s.ad).zirveGorev;
      kmOyunSporcuSec(0); kmZirveCagriGuncelle(); let bant = document.getElementById('km-zirve-cagri').textContent;
      await seri(['9', '9', '9']);
      let sonuc = _kmZirveSeriSon && _kmZirveSeriSon.gorev, b = (kmZirveGunluk().bayraklar || {})[0] || [];
      let d2 = kmOyunDurumAl(s.g, s.ad); d2.frac = 0; d2.zirveGorev = null; s.frac = 0; kmOyunDurumKaydet(); kmZirveGunlukSifirla();
      return { metre, g1: g1 && g1.id + '@' + g1.ci, bant, sonuc, bayrak: b.length };
    });
    if (!zirve.atla) {
      dogrula(zirve.metre > 300, 'Zirve metre: ' + zirve.metre);
      esit(zirve.g1, 'iskasiz@0', 'ilk kampta görev verilmedi');
      dogrula(/görev/i.test(zirve.bant), 'görev bandı yok: ' + zirve.bant);
      dogrula(zirve.sonuc && zirve.sonuc.tamam, 'görev tamam sayılmadı: ' + JSON.stringify(zirve.sonuc));
      esit(zirve.bayrak, 1, 'kampa bayrak dikilmedi');
    }
    // 🐉 Ortak Canavar 5.0 (2026-10-16): 12 yeni canavar çizilir; kaplumbağa tavanı, Zümrüdüanka dirilir, jöle bölünür, mamut ıskada iyileşir
    const cnv = await p.evaluate(async () => {
      kmOyunTemaSec('canavar'); kmCanavarDurumEmin();
      const yedek = JSON.stringify(_kmCanavar), yeni = ['tepegoz', 'sahmeran', 'zumruduanka', 'karakoncolos', 'disli', 'kristal', 'jole', 'hayalet', 'kaplumbaga', 'solucan', 'mamut', 'kurbaga'];
      const cizim = yeni.filter((t) => kmOyunCanavarSVG(t).length < 800);
      const kur = (tip, can, max) => { _kmCanavar.aktif = { no: 2, tip, can, maxCan: max, istat: {}, izler: [], seri: 0, kalkan: false, kalkanEsik: [], enIyiKombo: 0 }; _kmCanavar.kombo = 0; kmCanavarKaydet(); };
      const seri = async (oklar) => {
        let s = _kmOyunRosterCache[0]; turnuvaDB[s.g][s.ad].devamModu = true;
        kmOyunSporcuSec(0); _kmOyunSeriGirisleri = oklar.slice(0, _kmOyunOkSayisi); while (_kmOyunSeriGirisleri.length < _kmOyunOkSayisi) _kmOyunSeriGirisleri.push(oklar[0]); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
        for (let i = 0; i < 60 && _kmOyunKilit; i++) await new Promise((r) => setTimeout(r, 200));
        let m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let i = 0; i < 60 && _kmOyunKilit; i++) await new Promise((r) => setTimeout(r, 200)); }
      };
      const r = {};
      kur('kaplumbaga', 500, 500); await seri(['X', 'X', 'X']); r.kap = 500 - _kmCanavar.aktif.can; r.kart = ((document.getElementById('km-cnv-vk') || {}).textContent || ''); r.kartAd = _kmOyunRosterCache[0].ad; r.menu = !!document.querySelector('#km-oyun-diger .km-oyun-diger-menu #km-oyun-sesli-btn');
      kur('zumruduanka', 5, 100); await seri(['9', '9', '9']); r.anka = { can: _kmCanavar.aktif.can, dirildi: !!_kmCanavar.aktif.dirildi, tip: _kmCanavar.aktif.tip };
      kur('jole', 60, 100); await seri(['5', '5', '5']); r.jole = !!_kmCanavar.aktif.parca && _kmCanavar.aktif.parca.can[0] + _kmCanavar.aktif.parca.can[1] === _kmCanavar.aktif.can;
      kur('mamut', 400, 500); await seri(['M', 'M', 'M']); r.mamut = _kmCanavar.aktif.can;
      _kmCanavar = JSON.parse(yedek); kmCanavarKaydet(); kmOyunCanavarGovdeKur(true); kmOyunCanavarCiz();
      return { cizim, ...r };
    });
    esit(cnv.cizim.length, 0, 'çizilmeyen canavar: ' + cnv.cizim.join(','));
    dogrula(cnv.kart.includes(cnv.kartAd) && /−\d+|ISKA/.test(cnv.kart), 'vuruş kartında vuran sporcu / hasar yok: ' + cnv.kart);
    dogrula(cnv.menu, 'Spiker düğmesi ⋯ Diğer menüsünde olmalı');
    dogrula(cnv.kap > 0 && cnv.kap <= 20, 'kaplumbağa kabuğu tavanı: ' + cnv.kap);
    dogrula(cnv.anka.tip === 'zumruduanka' && cnv.anka.dirildi && cnv.anka.can === 30, 'Zümrüdüanka dirilmedi: ' + JSON.stringify(cnv.anka));
    dogrula(cnv.jole, 'jöle ikiye bölünmedi');
    esit(cnv.mamut, 415, 'mamut ıskada iyileşmedi');
    // 📖 Canavar rehberi: 23 tür kartı; "Bununla savaş" sahnedeki canavarı değiştirir
    const yedekCnv = await p.evaluate(() => JSON.stringify(_kmCanavar));
    await p.evaluate(() => { kmOyunTemaSec('canavar'); _kmCanavar.aktif.can = _kmCanavar.aktif.maxCan; kmCanavarKaydet(); kmOyunCanavarHudGuncelle(); });
    await p.locator('#km-cnv-araclar button', { hasText: 'Canavar ▸' }).click(); // araçlar tek düğmede toplu (2026-10-21)
    await p.locator('#km-cnv-araclar button', { hasText: 'Canavarlar' }).click();
    esit(await p.locator('.km-cnv-rh-kart').count(), await p.evaluate(() => KM_CANAVAR_TIPLERI.length), 'rehberdeki kart sayısı');
    const [secAd, secId] = (await p.evaluate(() => _kmCanavar.aktif.tip)) === 'tepegoz' ? ['Kurbağa Kral', 'kurbaga'] : ['Tepegöz', 'tepegoz'];
    await p.locator('.km-cnv-rh-kart', { hasText: secAd }).locator('button', { hasText: 'Bununla savaş' }).click(); await p.waitForTimeout(400);
    esit(await p.evaluate(() => _kmCanavar.aktif.tip + '|' + (_kmCanavar.aktif.can === _kmCanavar.aktif.maxCan)), secId + '|true', 'seçilen canavar sahneye gelmedi');
    dogrula(!(await p.locator('#km-oyun-karakter-modal').count()), 'rehber kapanmadı');
    await p.evaluate((y) => { _kmCanavar = JSON.parse(y); kmCanavarKaydet(); kmOyunCanavarGovdeKur(true); kmOyunCanavarCiz(); }, yedekCnv);
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(`${TEMALAR.length} tema × 2 mod açıldı; Zirve: metre, kamp görevi, bayrak; Canavar 5.0: 12 yeni + kurallar`);
  } finally { await ctx.close(); }
}
