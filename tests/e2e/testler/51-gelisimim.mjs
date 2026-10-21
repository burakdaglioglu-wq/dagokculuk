// 📈 Gelişimim (2026-10-22): sporcunun ana ekranında tek kart (bugün nasıldı? · 4 haftalık plan · grup/nişangah), koçun sporcu
// profilinde tek panel (plan tablosu + not, grup analizi, his–skor). Grup hesabı sentetik oklarla; plan ve öz-değerlendirme yerel
// depoda (sunucu senkronu susturulur), sonda geri yüklenir.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 860 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await p.evaluate(() => dagskEkYukle('dagsk-gelisim-plan.js?v=1'));
    // ---- grup: merkez sağ-yukarıda (x +25, y −20) → "sağa ve yukarı"; dağılım ±6 → çap küçük
    const gr = await p.evaluate(() => { let o = []; for (let i = 0; i < 30; i++) o.push({ x: 25 + ((i * 7) % 13) - 6, y: -20 + ((i * 5) % 11) - 5 }); let g = gpGrup(o); return { oneri: g.oneri, kayik: g.kayik, cap: Math.round(g.cap * 10) / 10, ofset: Math.round(g.ofset * 10) / 10, ok: g.okIsaret }; });
    dogrula(gr.kayik && /sağa ve yukarı/.test(gr.oneri) && gr.ok === '↗', 'nişangah önerisi: ' + JSON.stringify(gr));
    dogrula(gr.cap > 0.5 && gr.cap < 1.5 && gr.ofset > 3 && gr.ofset < 3.4, 'çap/kayma: ' + JSON.stringify(gr));
    esit(await p.evaluate(() => gpGrup([{ x: 1, y: 1 }]) === null), true, '12 oktan azsa analiz yok');
    // ---- bir sporcu: plan + öz-değerlendirme, kayıtlar yerel (senkron susturulur)
    const sp = await p.evaluate(() => {
      let g = ['buyukler', 'yildizlar', 'kucukler', 'minikler'].find((x) => Object.keys(turnuvaDB[x] || {}).some((a) => !turnuvaDB[x][a].pasif)), ad = Object.keys(turnuvaDB[g]).find((a) => !turnuvaDB[g][a].pasif);
      window.__eskiSenk = kyDepoSenkron; kyDepoSenkron = function (a, f) { return Promise.resolve(f()); };
      return { g, ad, plan: localStorage.getItem('dag_gelisim_plani'), oz: localStorage.getItem('dag_oz_degerlendirme'), seri: JSON.stringify(turnuvaDB[g][ad].seriler || []), giris: loggedInSporcu, grup: aktifGrup };
    });
    yedek = sp;
    // bugün bir seri (öz-değerlendirme sorusu için) + sporcu girişi gibi ana ekran kartı
    await p.evaluate((x) => {
      let s = turnuvaDB[x.g][x.ad]; s.seriler = (s.seriler || []).concat([{ seriId: 'e2e-gp', puan: 27, oklar: ['9', '9', '9'], tarih: bugunISO(), t: Date.now() }]);
      loggedInSporcu = x.ad; aktifGrup = x.g;
      let d = document.createElement('div'); d.id = 'gelisim-widget'; document.body.prepend(d); gelisimWidgetCiz();
    }, sp);
    dogrula(await p.locator('#gelisim-widget .gp-oz').count() === 1, '"Bugün nasıldı?" sorusu çıkmalı');
    dogrula(/Gelişimim/.test(await p.locator('#gelisim-widget').textContent()), 'plan kartı yok');
    // (sayfa gerçek sporcu modunda değil — uygulamanın kendi ana ekran yenilemesi araya girmesin diye aynı adımda)
    const kaydetVar = await p.evaluate((x) => { _gpOz.his = 3; _gpOz.odak = 4; _gpOz.yorgun = 1; gelisimWidgetCiz(); let b = document.querySelector('#gelisim-widget .gp-kaydet'); let ok = !!b && !b.disabled; if (b) b.click(); return ok; }, sp);
    dogrula(kaydetVar, 'üç seçim yapılınca Kaydet açık olmalı');
    const oz = await p.evaluate((x) => kyDepoOku('oz_degerlendirme')[x.g + '|' + x.ad + '|' + bugunISO()], sp);
    dogrula(oz && oz.his === 3 && oz.odak === 4 && oz.yorgun === 1, 'öz-değerlendirme kaydı: ' + JSON.stringify(oz));
    dogrula(await p.locator('#gelisim-widget .gp-oz').count() === 0 && /Bugün: 🙂/.test(await p.locator('#gelisim-widget').textContent()), 'kaydedince soru kapanmalı');
    // ---- koç: profil paneli, plan kaydı → sporcunun kartında not
    await p.evaluate((x) => sporcuProfilAc(x.g + '|' + x.ad), sp);
    await p.waitForSelector('#yn-kart #gp-panel', { timeout: 15000 });
    await p.fill('#gp-not', 'Bırakışta takip 2 sn');
    await p.locator('#gp-panel button:has-text("Planı kaydet")').click();
    const kayit = await p.evaluate((x) => Object.assign({ suanki: gpBlok().no }, kyDepoOku('gelisim_plani')[x.g + '|' + x.ad]), sp);
    dogrula(kayit && kayit.not === 'Bırakışta takip 2 sn' && kayit.blok === kayit.suanki, 'plan kaydı: ' + JSON.stringify(kayit));
    await p.evaluate(() => { ynKartKapat(); gelisimWidgetCiz(); });
    dogrula(/Bırakışta takip 2 sn/.test(await p.locator('#gelisim-widget').textContent()), 'koç notu sporcu kartında görünmeli');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('grup/nişangah, öz-değerlendirme, plan + koç notu tamam');
  } finally {
    if (yedek) await p.evaluate((y) => { kyDepoSenkron = window.__eskiSenk; if (y.plan) localStorage.setItem('dag_gelisim_plani', y.plan); else localStorage.removeItem('dag_gelisim_plani'); if (y.oz) localStorage.setItem('dag_oz_degerlendirme', y.oz); else localStorage.removeItem('dag_oz_degerlendirme'); turnuvaDB[y.g][y.ad].seriler = JSON.parse(y.seri); loggedInSporcu = y.giris; aktifGrup = y.grup; }, yedek).catch(() => {});
    await ctx.close();
  }
}
