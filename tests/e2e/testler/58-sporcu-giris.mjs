// 🔑 Sporcu Girişleri + sporcunun kendi fotoğrafı (v316). Kullanıcı: "yönetici panelinde sporcuların girişlerini ayarlamam lazım,
// profil fotolarını kendileri değiştirebilsinler". Yönetici: kod ver, girişi kapat → sporcu telefonu ?sg linkiyle giremez; aç → girer,
// son giriş yöneticide görünür; sporcu ana ekrandaki 📷 ile fotoğrafını değiştirir (veli izni değişmez, kendisi ?sk ile görür).
// Test sporcunun kodunu / fotoğrafını / giriş durumunu sonunda eski hâline getirir.
import { sayfaAc, uygulamaAc, yoneticiAc, B, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  const tel = await sayfaAc({ girisli: false, genislik: 390, yukseklik: 844 });
  let s = null, eskiKod = null, eskiFoto = null;
  try {
    await uygulamaAc(p);
    await yoneticiAc(p, 'girisler');
    await p.waitForSelector('#yonetici-liste .sg-satir', { state: 'attached', timeout: 20000 });
    dogrula(await p.evaluate(() => YONETICI_BOLUMLER[0][1].some((x) => x[0] === 'girisler')), 'menüde Sporcu Girişleri yok');
    // telefonun da gördüğü (silinmemiş) bir sporcu: girişsiz sporcu listesinde olan ilk test sporcusu
    const telListe = (await (await fetch(B + '/api/athletes')).json()).athletes;
    s = await p.evaluate(() => { let l = sgSporcular(); let x = l.find((y) => y.ad === 'YoklamaTest') || l.find((y) => /TEST/i.test(y.ad) && !/KULLANICI/.test(y.ad)) || l.find((y) => !/KULLANICI/.test(y.ad)); return { g: x.g, ad: x.ad, k: x.k }; });
    dogrula(telListe.some((a) => a.grup === s.g && a.ad === s.ad) , 'test sporcusu sunucuda yok: ' + s.k);
    eskiKod = await p.evaluate((s) => turnuvaDB[s.g][s.ad].kod || null, s);
    eskiFoto = await p.evaluate((s) => fotoBilgi(fotoAnahtar(s.g, s.ad)), s);
    // 🎲 yeni kod + listede görünür; WhatsApp mesajında giriş linki
    const kod = await p.evaluate((s) => { let b = sgBul(s.k), k = sgYeniKod(); sgKodYaz(b, k); sgCiz(); return k; }, s);
    dogrula(/^\d{4}$/.test(kod) && !/^(19|20)\d\d$/.test(kod), 'kod: ' + kod);
    dogrula(await p.evaluate((a) => [...document.querySelectorAll('#sg-liste .sg-satir')].some((r) => r.textContent.includes(a.ad) && r.textContent.includes(a.kod)), { ad: s.ad, kod }), 'yeni kod listede yok');
    dogrula(await p.evaluate((s) => sgMesaj(s.ad, turnuvaDB[s.g][s.ad]).includes('?sg=' + encodeURIComponent(s.ad) + '&sk='), s), 'mesajda giriş linki yok');
    // kod sunucuya gitsin (telefon sporcu listesini oradan alır)
    for (let i = 0; i < 30; i++) { let a = (await (await fetch(B + '/api/athletes')).json()).athletes.find((x) => x.grup === s.g && x.ad === s.ad); if (a && a.kod === kod) break; await p.evaluate(() => { try { bulutaGonderKontrol(); } catch (e) {} }); await p.waitForTimeout(1000); }
    // ⛔ girişi kapat → telefon linkle giremez
    await p.evaluate((s) => sgKapaliYaz(s.k, true), s);
    await p.waitForFunction((k) => SG.liste && SG.liste[k] && SG.liste[k].kapali, s.k, { timeout: 8000 });
    const link = B + '/app.html?sg=' + encodeURIComponent(s.ad) + '&sk=' + kod;
    await tel.p.goto(link);
    await tel.p.waitForFunction(() => { try { return JSON.parse(localStorage.getItem('dag_giris_kapali') || '[]').length > 0; } catch (e) { return false; } }, null, { timeout: 30000 });
    await tel.p.waitForTimeout(3500);
    esit(await tel.p.evaluate(() => loggedInSporcu), null, 'girişi kapalı sporcu girememeli');
    // ✓ aç → link girer, son giriş yöneticide görünür
    await p.evaluate((s) => sgKapaliYaz(s.k, false), s);
    await p.waitForFunction((k) => SG.liste && SG.liste[k] && !SG.liste[k].kapali, s.k, { timeout: 8000 });
    await tel.p.goto(link);
    await tel.p.waitForFunction((ad) => loggedInSporcu === ad, s.ad, { timeout: 30000 });
    dogrula(await tel.p.evaluate(() => !location.search), 'link adres çubuğundan silinmeli (kod görünmesin)');
    await p.evaluate(() => sgYukle().then(() => sgCiz()));
    dogrula(await p.evaluate((ad) => [...document.querySelectorAll('#sg-liste .sg-satir')].some((r) => r.textContent.includes(ad) && /az önce|dk önce/.test(r.textContent)), s.ad), 'son giriş yöneticide görünmeli');
    // 📷 sporcu kendi fotoğrafını değiştirir: ana ekranda düğme, pencerede veli izni yok
    await tel.p.evaluate(() => { sekmeAc('ana'); sporcuAnaDoldur(); });
    await tel.p.waitForSelector('#icerik-ana button[aria-label="Profil fotoğrafımı değiştir"]', { timeout: 10000 });
    await tel.p.click('#icerik-ana button[aria-label="Profil fotoğrafımı değiştir"]');
    await tel.p.waitForSelector('#foto-pencere #fp-kaydet');
    dogrula(!(await tel.p.locator('#fp-izin').isVisible()), 'sporcuya veli izni sorulmamalı');
    dogrula(await tel.p.locator('#fp-kaydet').isDisabled(), 'fotoğraf seçilmeden Kaydet kapalı olmalı');
    await tel.p.evaluate(() => new Promise((ok) => { let c = document.createElement('canvas'); c.width = 400; c.height = 300; let x = c.getContext('2d'); x.fillStyle = '#36c'; x.fillRect(0, 0, 400, 300); let im = new Image(); im.onload = () => { FY.img = im; document.getElementById('fp-kirp').innerHTML = '<canvas width="320" height="320"></canvas>'; fotoCiz(); fotoDugmeler(); ok(); }; im.src = c.toDataURL('image/png'); }));
    await tel.p.click('#fp-kaydet');
    await tel.p.waitForFunction(() => !document.getElementById('foto-pencere'), null, { timeout: 15000 });
    const fb = await (await fetch(B + '/api/fotolar')).json(), yeni = fb.fotolar['s:' + s.g + '|' + s.ad];
    dogrula(yeni && yeni.var, 'fotoğraf sunucuda yok');
    esit(yeni.izin, eskiFoto ? eskiFoto.izin : null, 'veli izni değişmemeli');
    esit((await fetch(B + '/api/foto/' + encodeURIComponent('s:' + s.g + '|' + s.ad) + '?v=' + yeni.t + '&sk=' + kod)).status, 200, 'sporcu kendi fotoğrafını kodla görmeli');
    if (yeni.izin !== 1) esit((await fetch(B + '/api/foto/' + encodeURIComponent('s:' + s.g + '|' + s.ad) + '?v=' + yeni.t + '&sk=0000')).status, 401, 'yanlış kodla izinsiz fotoğraf açılmamalı');
    await tel.p.waitForFunction(() => !!document.querySelector('#icerik-ana img[src*="/api/foto/"]'), null, { timeout: 10000 });
    // telefon taşma yok
    dogrula(await tel.p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'telefonda yatay taşma');
    // yönetici ekranı telefonda da taşmasın
    await p.setViewportSize({ width: 375, height: 812 }); await p.evaluate(() => sgCiz()); await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => [...document.querySelectorAll('#yonetici-liste .sg *')].every((e) => { let b = e.getBoundingClientRect(); return !b.width || b.right <= innerWidth + 1; })), 'Sporcu Girişleri telefonda taşıyor');
    log('🔑 Sporcu Girişleri: kod ver, kapat → link reddedildi, aç → girdi, son giriş görünür; 📷 sporcu kendi fotoğrafını değiştirdi (izin aynı) ✓');
  } finally {
    if (s) await p.evaluate(({ s, eskiKod, eskiFoto }) => {
      let sp = turnuvaDB[s.g][s.ad]; if (eskiKod) sp.kod = eskiKod; else delete sp.kod; sp.lastModified = Date.now(); try { yoneticiKaydet(); } catch (e) {}
      fetch('/api/sporcu-giris/' + encodeURIComponent(s.k), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kapali: false }) }).catch(() => {});
      if (!eskiFoto || !eskiFoto.var) fotoKaydet(fotoAnahtar(s.g, s.ad), { veri: null, izin: eskiFoto ? eskiFoto.izin : null }).catch(() => {});
    }, { s, eskiKod, eskiFoto }).catch(() => {});
    await p.waitForTimeout(1500);
    await tel.ctx.close(); await ctx.close();
  }
}
