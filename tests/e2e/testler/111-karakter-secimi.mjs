// 🎭 Karakter seçimi çoğaldı (2026-11-09, v396; kullanıcı: "tüm oyunlarda karakter seçimlerini çoğaltalım").
// Ortak havuz 26 → 55 (okçu/ninja/korsan figürleri, gruplu seçici); rastgele atama yalnız hayvanlardan;
// seçilen figür sahnede görünür; Blok Kahramanlar'da 🎭 Karakter kendi 12 kahramanını seçtirir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 800 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => { const k = _kmAktifKonum || 'varsayilan'; return { h: localStorage.getItem('dag_km_oyun_hayvan_' + k), b: localStorage.getItem('dag_km_blokkh_' + k) }; });

    // havuz
    const hv = await p.evaluate(() => ({ n: KM_OYUN_KARAKTERLER.length, sira: KM_OYUN_KARAKTERLER.every((k, i) => k.no === i + 1), rast: Math.max(...KM_OYUN_RASTGELE_HAVUZ), rastN: KM_OYUN_RASTGELE_HAVUZ.length, oran: KM_OYUN_HAYVAN_ORAN.length }));
    esit(hv.n, 55, 'karakter sayısı'); dogrula(hv.sira, 'numaralar sıralı ve kalıcı olmalı'); esit(hv.rast, 26, 'rastgele atama yalnız hayvanlar'); esit(hv.rastN, 23, 'rastgele havuz'); esit(hv.oran, 55, 'oran listesi');

    // seçici: Kale (ortak havuzu kullanan oyun)
    await p.evaluate(() => kmOyunTemaSec('kale')); await p.waitForTimeout(800);
    await p.evaluate(() => kmOyunKarakterSecAc(0));
    await p.waitForSelector('#km-oyun-karakter-modal .km-oyun-karakter-sec');
    await p.waitForFunction(() => [...document.querySelectorAll('#km-oyun-karakter-modal img')].every((i) => { i.loading = 'eager'; return i.complete; }), null, { timeout: 20000 });
    const md = await p.evaluate(() => ({ dugme: document.querySelectorAll('#km-oyun-karakter-modal .km-oyun-karakter-sec').length, grup: [...document.querySelectorAll('.km-oyun-karakter-grup')].map((g) => g.textContent.replace(/\s+/g, ' ').trim()), bozuk: [...document.querySelectorAll('#km-oyun-karakter-modal img')].filter((i) => !i.naturalWidth).map((i) => i.src) }));
    esit(md.dugme, 55, 'seçicide 55 karakter'); esit(md.grup.length, 5, 'grup başlıkları: ' + md.grup.join(' | ')); esit(md.bozuk.length, 0, 'yüklenmeyen görsel: ' + md.bozuk.join(', '));
    dogrula(/Okçular 14/.test(md.grup.join('|')) && /Ninjalar 8/.test(md.grup.join('|')) && /Korsanlar 7/.test(md.grup.join('|')), 'grup sayıları: ' + md.grup.join(' | '));
    await p.screenshot({ path: 'tests/e2e/_cikti/111-secici.png' });
    // okçu seç → sahnede o görsel
    await p.locator('#km-oyun-karakter-modal .km-oyun-karakter-sec', { hasText: 'Elf Okçu' }).click(); await p.waitForTimeout(600);
    const sec = await p.evaluate(() => { const s = _kmOyunRosterCache[0]; return { no: kmOyunHayvanKarakterAta(s), sahne: !!document.querySelector('#km-oyun-wrap image[href="/okcu-karakterler/okcu-e-elf.webp"]'), modal: !!document.getElementById('km-oyun-karakter-modal') }; });
    esit(sec.no, 27, 'Elf Okçu seçildi'); dogrula(sec.sahne, 'seçilen okçu sahnede görünmeli'); dogrula(!sec.modal, 'seçici kapanmalı');
    await p.screenshot({ path: 'tests/e2e/_cikti/111-sahne.png' });

    // Blok: kendi kahramanları
    await p.evaluate(() => kmOyunTemaSec('blok'));
    await p.waitForFunction(() => typeof blkKahramanOnizle === 'function' && !!document.getElementById('blk-cv'), null, { timeout: 30000 });
    await p.evaluate(() => kmOyunKarakterSecAc(0)); await p.waitForTimeout(300);
    const bk = await p.evaluate(() => { const c = [...document.querySelectorAll('#km-oyun-karakter-modal canvas[data-kh]')]; return { n: c.length, dolu: c.filter((x) => { const d = x.getContext('2d').getImageData(0, 0, x.width, x.height).data; let a = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) a++; return a > 400; }).length }; });
    esit(bk.n, 12, 'Blok 12 kahraman'); esit(bk.dolu, 12, 'kahraman önizlemeleri çizilmeli');
    await p.screenshot({ path: 'tests/e2e/_cikti/111-blok.png' });
    await p.locator('#km-oyun-karakter-modal .km-oyun-karakter-sec').nth(3).click(); await p.waitForTimeout(300);
    const bs = await p.evaluate(() => { const s = _kmOyunRosterCache[0]; return { ad: blkKahraman(s.g + '|' + s.ad), bek: _blkKahramanlar()[3] }; });
    esit(bs.ad, bs.bek, 'Blok kahraman seçimi');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('55 karakter (5 grup, görseller yüklü) · rastgele yalnız hayvan · okçu seçilip sahnede · Blok 12 kahraman seçilir');
  } finally {
    if (yedek) await p.evaluate((y) => { const k = _kmAktifKonum || 'varsayilan'; const w = (a, v) => { if (v == null) localStorage.removeItem(a); else localStorage.setItem(a, v); }; w('dag_km_oyun_hayvan_' + k, y.h); w('dag_km_blokkh_' + k, y.b); }, yedek).catch(() => {});
    await ctx.close();
  }
}
