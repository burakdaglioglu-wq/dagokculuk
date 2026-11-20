// 🐉 8 yeni Ortak Canavar + 🚀🦖🦸 18 yeni karakter (2026-11-20, v438; kullanıcı: "karakter seç kısmında karakterleri genişletelim,
// ortak canavardaki canavarları çeşitlendir" → yeni karakterler + yeni canavar türleri).
// Her yeni canavar kendi arenasıyla çizilir, sahneye sığar, özel kuralı doğru hasar verir; yeni karakter SVG'leri yüklenir ve sahnede görünür.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

const YENI = ['ufo', 'robot', 'trex', 'alkarisi', 'yarasa', 'cin', 'ari', 'kardan'];

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  let cnvYedek = null, kYedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    cnvYedek = await p.evaluate(() => localStorage.getItem('dag_km_canavar_' + (_kmAktifKonum || 'varsayilan')));
    kYedek = await p.evaluate(() => localStorage.getItem('dag_km_oyun_hayvan_' + (_kmAktifKonum || 'varsayilan')));

    // havuz
    const hv = await p.evaluate((Y) => ({ n: KM_CANAVAR_TIPLERI.length, son: KM_CANAVAR_TIPLERI[KM_CANAVAR_TIPLERI.length - 1].id, eksik: Y.filter((id) => !KM_CANAVAR_TIPLERI.some((t) => t.id === id) || !KM_CANAVAR_OZELLIK[id] || !KM_CANAVAR_KAFA[id] || !KM_CANAVAR_GOVDE[id] || !KM_CANAVAR_ARENA_GOK[id] || !KM_CANAVAR_IPUCU[id]) }), YENI);
    esit(hv.n, 31, 'canavar türü sayısı (23 + 8)'); esit(hv.son, 'kral', 'Ejder Kral sonda kalmalı'); esit(hv.eksik.length, 0, 'eksik tanım: ' + hv.eksik.join(','));

    // kurallar
    const k = await p.evaluate(() => [kmCanavarOkDeger('ufo', '9'), kmCanavarOkDeger('ufo', '8'), kmCanavarOkDeger('robot', '4'), kmCanavarOkDeger('trex', 'X'), kmCanavarOkDeger('trex', '5'),
      kmCanavarOkDeger('alkarisi', '2'), kmCanavarOkDeger('alkarisi', '3'), kmCanavarOkDeger('yarasa', '6'), kmCanavarOkDeger('yarasa', 'X'), kmCanavarOkDeger('cin', '1'), kmCanavarOkDeger('cin', 'M'),
      kmCanavarOkDeger('ari', '7'), kmCanavarOkDeger('ari', 'M'), kmCanavarOkDeger('kardan', '10'), kmCanavarOkDeger('kardan', '5')]);
    esit(JSON.stringify(k), JSON.stringify([18, 8, 8, 20, 3.5, 6, 0, 12, 5, 5, 0, 9, 0, 20, 2.5]), 'özel kurallar');

    // her yeni canavar sahnede
    await p.evaluate(() => { localStorage.removeItem('dag_km_canavar_' + (_kmAktifKonum || 'varsayilan')); _kmCanavar = null; kmOyunTemaSec('canavar'); });
    await p.waitForSelector('#km-cnv-canavar-ic .km-cnv-tum', { timeout: 30000 }); await p.waitForTimeout(1500);
    const olc = {};
    for (const id of YENI) {
      await p.evaluate((id) => { kmCanavarDurumEmin(); const c = _kmCanavar.aktif; Object.assign(c, { tip: id, kilik: undefined, huy: undefined, ek: undefined, ekDustu: undefined, gizli: false, form2: false, kalkan: false, kalkanEsik: [] }); kmCanavarKaydet(); kmOyunCanavarGovdeKur(false); kmOyunCanavarHudGuncelle(); if (typeof kmCanavarArenaCiz === 'function') kmCanavarArenaCiz(id); }, id);
      await p.waitForTimeout(700);
      olc[id] = await p.evaluate(() => { const g = document.getElementById('km-cnv-canavar-ic'), b = g.getBBox(); return { h: Math.round(b.height), ust: Math.round(b.y), ad: document.getElementById('km-cnv-ad').textContent, arena: document.getElementById('km-oyun-panel-canavar').dataset.arena }; });
      dogrula(olc[id].h > 180, id + ': canavar çizilmeli (yükseklik ' + olc[id].h + ')');
      dogrula(olc[id].ust >= -390, id + ': sahneye sığmalı (üst ' + olc[id].ust + ')');
      await p.screenshot({ path: `tests/e2e/_cikti/145-${id}.png` });
    }
    // rehber kartları
    await p.evaluate(() => kmCanavarRehberAc()); await p.waitForTimeout(500);
    const rh = await p.evaluate(() => document.querySelectorAll('.km-cnv-rh-kart').length);
    esit(rh, 31, 'rehberde 31 canavar'); await p.screenshot({ path: 'tests/e2e/_cikti/145-rehber.png' }); await p.evaluate(() => kmOyunKarakterSecKapat());

    // yeni karakterler: SVG'ler yüklenir, biri seçilip sahnede görünür
    await p.evaluate(() => kmOyunTemaSec('kale')); await p.waitForTimeout(800);
    await p.evaluate(() => kmOyunKarakterSecAc(0));
    await p.waitForSelector('#km-oyun-karakter-modal .km-oyun-karakter-sec');
    await p.waitForFunction(() => [...document.querySelectorAll('#km-oyun-karakter-modal img')].every((i) => { i.loading = 'eager'; return i.complete; }), null, { timeout: 20000 });
    const kr = await p.evaluate(() => { const im = [...document.querySelectorAll('#km-oyun-karakter-modal .km-oyun-karakter-sec img')].filter((i) => /yeni-karakterler/.test(i.src)); return { n: im.length, bozuk: im.filter((i) => !i.naturalWidth).map((i) => i.src) }; });
    esit(kr.n, 18, 'seçicide 18 yeni karakter'); esit(kr.bozuk.length, 0, 'yüklenmeyen: ' + kr.bozuk.join(', '));
    await p.locator('#km-oyun-karakter-modal .km-oyun-karakter-sec', { hasText: 'T-Rex' }).scrollIntoViewIfNeeded();
    await p.screenshot({ path: 'tests/e2e/_cikti/145-karakterler.png' });
    await p.locator('#km-oyun-karakter-modal .km-oyun-karakter-sec', { hasText: 'Astronot' }).click(); await p.waitForTimeout(800);
    const sec = await p.evaluate(() => ({ no: kmOyunHayvanKarakterAta(_kmOyunRosterCache[0]), sahne: !!document.querySelector('#km-oyun-wrap image[href="/yeni-karakterler/uzay-astronot.svg"]') }));
    esit(sec.no, 56, 'Astronot seçildi'); dogrula(sec.sahne, 'Astronot sahnede görünmeli');
    await p.screenshot({ path: 'tests/e2e/_cikti/145-sahne.png' });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('8 yeni canavar (kural + arena + sahneye sığar) · rehber 31 · 18 yeni karakter yüklendi, Astronot sahnede');
  } finally {
    await p.evaluate(([c, k]) => { const kn = _kmAktifKonum || 'varsayilan'; const w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); }; w('dag_km_canavar_' + kn, c); w('dag_km_oyun_hayvan_' + kn, k); }, [cnvYedek, kYedek]).catch(() => {});
    await ctx.close();
  }
}
