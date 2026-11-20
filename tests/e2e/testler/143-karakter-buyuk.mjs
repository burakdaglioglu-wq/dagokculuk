// 🎭 Büyük karakter seçici (2026-11-20, v437; kullanıcı: "sporcular seçerken küçük gözüküyor, seçme yerinde karakterler büyük olsun").
// Telefonda (390) 2 sütun ≥110 px resim, TV'de (1366) ≥130 px; üstte "Şu an" vitrini seçilen karakteri büyük gösterir; taşma yok.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const sonuc = [];
  for (const [ad, gen, yuk] of [['telefon', 390, 844], ['tv', 1366, 768]]) {
    const { ctx, p, hatalar } = await sayfaAc({ genislik: gen, yukseklik: yuk });
    let yedek = null;
    try {
      await uygulamaAc(p);
      await karisikSinifArac(p, 'oyunlar');
      yedek = await p.evaluate(() => localStorage.getItem('dag_km_oyun_hayvan_' + (_kmAktifKonum || 'varsayilan')));
      await p.evaluate(() => kmOyunTemaSec('kale')); await p.waitForTimeout(600);
      await p.evaluate(() => kmOyunKarakterSecAc(0));
      await p.waitForSelector('#km-oyun-karakter-modal .km-kar-vitrin img');
      const o = await p.evaluate(() => {
        const k = document.querySelector('.km-kar-buyuk'), kart = [...document.querySelectorAll('.km-kar-buyuk .km-oyun-karakter-sec')];
        const r0 = kart[0].getBoundingClientRect(), r1 = kart[1].getBoundingClientRect(), r2 = kart[2].getBoundingClientRect();
        return { n: kart.length, resim: Math.round(kart[0].querySelector('img').getBoundingClientRect().width), vitrin: Math.round(document.querySelector('.km-kar-vitrin img').getBoundingClientRect().width),
          ikiSutun: Math.abs(r0.top - r1.top) < 2 && r2.top > r0.top + 10, tasma: k.scrollWidth > k.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth, rastgele: !!document.querySelector('.km-kar-vitrin button') };
      });
      esit(o.n, 73, ad + ': 73 karakter');
      dogrula(o.resim >= (ad === 'tv' ? 130 : 110), ad + ': karakter resmi büyük olmalı (' + o.resim + ' px)');
      dogrula(o.vitrin >= 90, ad + ': vitrin resmi büyük (' + o.vitrin + ' px)');
      if (ad === 'telefon') dogrula(o.ikiSutun, 'telefonda 2 sütun');
      dogrula(!o.tasma, ad + ': yatay taşma olmamalı'); dogrula(o.rastgele, 'Rastgele vitrinde');
      await p.screenshot({ path: `tests/e2e/_cikti/143-${ad}.png` });
      await p.locator('#km-oyun-karakter-modal .km-oyun-karakter-sec', { hasText: 'Penguen' }).click(); await p.waitForTimeout(400);
      await p.evaluate(() => kmOyunKarakterSecAc(0)); await p.waitForSelector('.km-kar-vitrin b');
      esit(await p.evaluate(() => document.querySelector('.km-kar-vitrin b').textContent), 'Penguen', ad + ': vitrin seçilen karakteri göstermeli');
      esit(await p.evaluate(() => document.querySelectorAll('.km-kar-buyuk .km-oyun-karakter-sec.secili').length), 1, ad + ': seçili kart işaretli');
      await p.evaluate(() => kmOyunKarakterSecKapat());
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
      sonuc.push(`${ad} ${o.resim}px`);
    } finally {
      if (p) await p.evaluate((y) => { const a = 'dag_km_oyun_hayvan_' + (_kmAktifKonum || 'varsayilan'); if (y == null) localStorage.removeItem(a); else localStorage.setItem(a, y); }, yedek).catch(() => {});
      await ctx.close();
    }
  }
  log('büyük seçici: ' + sonuc.join(' · ') + ' · vitrin seçileni gösterir · taşma yok');
}
