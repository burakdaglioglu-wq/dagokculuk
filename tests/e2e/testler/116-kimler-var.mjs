// Karışık Sınıf › Oyunlar › 👥 Kimler var (2026-11-10, v401; kullanıcı: "tüm oyunlar içerisinde sporcuları seçebileceğim, gelmeyenleri çıkartabileceğim bir bölüm").
// Her oyunun üst çubuğunda; dokun = geldi/gelmedi; Uygula: dersten ve oyundan çıkar, seri yoksa yoklamaya "gelmedi"; geri seçince "gelmedi" silinir;
// aramayla listede olmayan eklenir; zombi gibi modül oyunlarında da kadro güncellenir; 390 px yana taşmaz.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => ({ liste: JSON.stringify(_kmListe), yok: JSON.stringify(otomatikYoklamaDB[bugunISO()] || null), hat: localStorage.getItem(kmHatAnahtari()) }));
    const kur = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      const bugun = bugunISO(), temiz = tum.filter((s) => !(turnuvaDB[s.g][s.ad].seriler || []).some((x) => x && x.tarih === bugun) && !(otomatikYoklamaDB[bugun] && otomatikYoklamaDB[bugun][s.ad]));
      localStorage.removeItem(kmHatAnahtari()); localStorage.removeItem(kmKvAnahtar());
      _kmListe = temiz.slice(0, 5); _kmSecimler = {}; _kmListe.forEach((x) => { _kmSecimler[x.g + '_' + x.ad] = x; });
      kmOyunTemaSec('zombi'); kmOyunListeDegisti();
      return { n: _kmListe.length, disari: temiz[6] || null };
    });
    dogrula(kur.n === 5 && kur.disari, 'en az 7 seri atmamış sporcu gerekli');
    await p.waitForSelector('#km-kv-btn', { timeout: 30000 });
    esit((await p.locator('#km-kv-btn b').textContent()).trim(), '5', 'düğmede kişi sayısı');
    dogrula(/dag-yeni/.test(await p.locator('#km-kv-btn').innerHTML()), 'YENİ rozeti');

    await p.click('#km-kv-btn');
    await p.waitForSelector('#km-kv .km-kv-kisi');
    esit(await p.locator('#km-kv .km-kv-kisi.on').count(), 5, '5 kişi geldi işaretli');
    esit((await p.locator('#km-kv-uygula').textContent()).trim(), 'Kapat', 'değişiklik yokken Kapat');
    await p.locator('#km-kv .km-kv-kisi').nth(1).click();
    await p.locator('#km-kv .km-kv-kisi').nth(3).click();
    esit(await p.locator('#km-kv .km-kv-kisi.on').count(), 3, 'iki kişi gelmedi');
    dogrula(/2 çıkar/.test(await p.locator('#km-kv-uygula').textContent()), 'Uygula sayısı');
    // aramayla listede olmayanı ekle
    const ara = kur.disari.ad.split(' ')[0];
    await p.fill('#km-kv-ara', ara);
    await p.waitForSelector('#km-kv .km-kv-ekle button');
    const ekBtn = p.locator('#km-kv .km-kv-ekle button', { hasText: kur.disari.ad });
    esit(await ekBtn.count(), 1, 'aramada listede olmayan sporcu');
    await ekBtn.click();
    dogrula(/1 ekle/.test(await p.locator('#km-kv-uygula').textContent()), 'ekle sayısı');
    await p.click('#km-kv-uygula');
    await p.waitForTimeout(400);
    const s1 = await p.evaluate((d) => {
      const bugun = bugunISO(), y = otomatikYoklamaDB[bugun] || {};
      return { panel: !!document.getElementById('km-kv'), n: _kmListe.length, roster: _kmOyunRosterCache.length, ekli: _kmListe.some((x) => x.g === d.g && x.ad === d.ad), yok: kmKvCikanlar().map((c) => (y[c.ad] && y[c.ad].geldi === false && y[c.ad].elle) ? 1 : 0).join(''), cik: kmKvCikanlar().length, btn: document.querySelector('#km-kv-btn b').textContent, kayit: JSON.parse(localStorage.getItem(kmLocalAnahtari()) || '[]').length };
    }, kur.disari);
    esit(s1.panel, false, 'panel kapanmalı'); esit(s1.n, 4, 'listede 4 kişi'); esit(s1.roster, 4, 'zombi kadrosu 4'); esit(s1.ekli, true, 'eklenen derste');
    esit(s1.cik, 2, '2 çıkan hatırlanır'); esit(s1.yok, '11', 'çıkanlara yoklamada gelmedi'); esit(s1.btn, '4', 'düğme sayısı'); esit(s1.kayit, 4, 'liste kaydedildi');

    // tekrar aç: çıkanlar soluk duruyor; birini geri seç → derse döner, "gelmedi" silinir
    await p.click('#km-kv-btn');
    await p.waitForSelector('#km-kv .km-kv-kisi');
    esit(await p.locator('#km-kv .km-kv-kisi').count(), 6, 'çıkanlar panelde görünür');
    esit(await p.locator('#km-kv .km-kv-kisi:not(.on)').count(), 2, 'çıkanlar gelmedi');
    await p.locator('#km-kv .km-kv-kisi:not(.on)').first().click();
    await p.click('#km-kv-uygula');
    await p.waitForTimeout(300);
    const s2 = await p.evaluate(() => ({ n: _kmListe.length, cik: kmKvCikanlar().length, yokSay: Object.values(otomatikYoklamaDB[bugunISO()] || {}).filter((v) => v.elle && v.geldi === false).length }));
    esit(s2.n, 5, 'geri seçilen derse döndü'); esit(s2.cik, 1, '1 çıkan kaldı');

    // tekli 🚫 düğmesi de listeye yazar (eski temada sıra kartı)
    await p.evaluate(() => { kmOyunTemaSec('zirve'); });
    await p.waitForSelector('.km-sk-yok', { timeout: 20000 });
    await p.locator('.km-sk-yok').first().click();
    await p.waitForTimeout(300);
    esit(await p.evaluate(() => kmKvCikanlar().length), 2, 'tekli çıkarma da listeye girer');

    // telefon: tam ekran panel, yana taşmaz
    await p.setViewportSize({ width: 390, height: 800 });
    await p.click('#km-kv-btn');
    await p.waitForSelector('#km-kv .km-kv-kisi');
    const tel = await p.evaluate(() => { const k = document.querySelector('.km-kv-kutu').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, w: Math.round(k.width), sutun: getComputedStyle(document.querySelector('.km-kv-izgara')).gridTemplateColumns.split(' ').length }; });
    dogrula(tel.sw <= 392, '390 px yana taşmaz: ' + tel.sw); esit(tel.w, 390, 'telefonda tam genişlik'); esit(tel.sutun, 3, 'telefonda 3 sütun');
    await p.click('.km-kv-ust button');
    esit(await p.locator('#km-kv').count(), 0, '✕ kapatır');
    dogrula(hatalar.length === 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('👥 Kimler var: çıkar/ekle/geri seç/yoklama/tekli düğme/telefon tamam');
  } finally {
    if (yedek) await p.evaluate((y) => {
      _kmListe = JSON.parse(y.liste); _kmSecimler = {}; _kmListe.forEach((x) => { _kmSecimler[x.g + '_' + x.ad] = x; }); _kmListeKaydet();
      const b = bugunISO(); if (y.yok) otomatikYoklamaDB[b] = JSON.parse(y.yok); else delete otomatikYoklamaDB[b]; otomatikYoklamaKaydet();
      if (y.hat) localStorage.setItem(kmHatAnahtari(), y.hat); localStorage.removeItem(kmKvAnahtar());
    }, yedek).catch(() => {});
    await ctx.close();
  }
}
