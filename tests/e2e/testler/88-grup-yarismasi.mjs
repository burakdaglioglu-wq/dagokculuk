// 2026-11-01 kullanıcı: "yarışmada grup yarışması da olsun, isteğe göre" → "ikisi de". Sıralama turunda:
// 👥 Gruplar ayrı → her yaş grubu kendi sıralaması (1'den başlar), kendi podyumu ve kendi elemesi (yalnız o grup, kendi tohumları);
// 🏆 Gruplar arası → yaş grupları ok başı ortalamaya göre sıralanır. Varsayılan "Birlikte" (eskisi gibi). Veriler geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    yedek = await p.evaluate(() => ({ tur: localStorage.getItem(yzAnahtar()), gor: localStorage.getItem('dag_yz_gorunum'), mod: localStorage.getItem('dag_yz_mod') }));
    const kur = await p.evaluate(() => {
      // iki yaş grubundan 3'er sporcu
      const al = (g) => Object.keys(turnuvaDB[g] || {}).filter((ad) => !turnuvaDB[g][ad].pasif).slice(0, 3).map((ad) => g + '|' + ad);
      const ligler = ['buyukler', 'yildizlar', 'kucukler', 'minikler'].filter((g) => al(g).length >= 3).slice(0, 2);
      if (ligler.length < 2) return null;
      const A = al(ligler[0]), B = al(ligler[1]), kat = A.concat(B), id = 'yt88' + Date.now().toString(36);
      const o = { durum: { asama: 'bitti', id, ayar: { kategori: 'serbest', mesafe: '18m', format: Object.keys(YZ_FORMAT)[0], kayit: false, lig: false, hedefBasi: 1, sure: 120, yuz: '6', eleme: { sistem: 'set', bronz: true } }, katilimci: kat, hedefler: {}, seri: 0, basla: Date.now() - 600000, bitis: Date.now() } };
      // A grubu: 9-9-9 (27), 8-8-8, 7-7-7 · B grubu: 10-10-10 (30), 5-5-5, 4-4-4 → genel 1. B[0]; ok başı A 8,0 > B 6,33
      const p = { [A[0]]: ['9', '9', '9'], [A[1]]: ['8', '8', '8'], [A[2]]: ['7', '7', '7'], [B[0]]: ['10', '10', '10'], [B[1]]: ['5', '5', '5'], [B[2]]: ['4', '4', '4'] };
      kat.forEach((k) => { o[yzSKey(id, k)] = [p[k]]; });
      localStorage.setItem(yzAnahtar(), JSON.stringify(o));
      localStorage.removeItem('dag_yz_gorunum'); _yz.gorunum = null;
      yzModAyarla('siralama'); kmYarismaGiris();
      return { A, B, ligler };
    });
    dogrula(kur, 'testte iki yaş grubundan 3\'er sporcu gerekli');
    await p.waitForTimeout(300);
    // varsayılan birlikte: tek tablo, B[0] 1.
    esit(await p.evaluate(() => yzGruplar(yzOku(), yzSiralama(yzOku())).length), 1, 'varsayılan birlikte olmalı');
    dogrula(await p.locator('.yz-gorunum button', { hasText: 'Gruplar ayrı' }).count() > 0, '"Gruplar ayrı" düğmesi yok');
    // 👥 Gruplar ayrı
    await p.locator('.yz-gorunum button', { hasText: 'Gruplar ayrı' }).first().click(); await p.waitForTimeout(300);
    const ayri = await p.evaluate(() => yzGruplar(yzOku(), yzSiralama(yzOku())).map((g) => ({ ad: g.ad, lig: g.lig, ilk: g.liste[0].k, sira: g.liste.map((r) => r.sira) })));
    esit(ayri.length, 2, 'iki grup ayrı tablo olmalı');
    dogrula(ayri.every((g) => JSON.stringify(g.sira) === '[1,2,3]'), 'her grup kendi içinde 1-2-3 sıralanmalı: ' + JSON.stringify(ayri));
    esit(ayri.find((g) => g.lig === kur.ligler[0]).ilk, kur.A[0], 'A grubunun 1.si yanlış');
    dogrula((await p.locator('.yz-grup-bas').count()) >= 2, 'grup başlıkları çizilmedi');
    // 🏆 Gruplar arası
    await p.locator('.yz-gorunum button', { hasText: 'Gruplar arası' }).first().click(); await p.waitForTimeout(300);
    const ga = await p.evaluate(() => ({ l: yzGrupArasi(yzSiralama(yzOku())).map((x) => [x.lig, +x.ort.toFixed(2)]), html: !!document.querySelector('.yz-ga') }));
    dogrula(ga.html, 'gruplar arası tablo çizilmedi');
    esit(JSON.stringify(ga.l), JSON.stringify([[kur.ligler[0], 8], [kur.ligler[1], 6.33]]), 'gruplar arası ortalama/sıra yanlış');
    // grup elemesi: yalnız B grubu, B'nin kendi sırasıyla
    dogrula(await p.locator('.yz-cipler button', { hasText: '⚔️' }).count() >= 2, 'grup eleme düğmeleri yok');
    const el = await p.evaluate((l) => { yzElemeBaslat(3, l); const o = yzOku(); return { t: o.eleme.tohumlar, lig: o.eleme.lig, asama: o.durum.asama }; }, kur.ligler[1]);
    esit(JSON.stringify(el.t), JSON.stringify(kur.B), 'grup elemesi yalnız o grubun sporcularıyla, kendi sırasıyla başlamalı');
    esit(el.lig, kur.ligler[1], 'eleme grubu kaydedilmedi');
    // telefon
    await p.evaluate(() => { yzSiralamayaDon(); });
    await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), '390 px\'te taşma');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('birlikte varsayılan · gruplar ayrı (1-2-3 her grupta) · gruplar arası ok başı 8,00 > 6,33 · grup elemesi yalnız kendi sporcularıyla · 390 px');
  } finally {
    if (yedek) await p.evaluate((y) => {
      const set = (k, v) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); };
      set(yzAnahtar(), y.tur); set('dag_yz_gorunum', y.gor); set('dag_yz_mod', y.mod); _yz.gorunum = null;
    }, yedek).catch(() => {});
    await ctx.close();
  }
}
