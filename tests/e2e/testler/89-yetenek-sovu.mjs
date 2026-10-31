// 2026-11-01 kullanıcı: çocuklar için eğlenceli yarışma ekranı → "D · Yetenek Şovu", "sıralama rastgele olsun — alt sırada kalan
// küçük çocuk kendini kötü hissediyor, karışık sıralama olsun". Sıralama turu → 🎤 Yetenek Şovu: kura (her cihazda aynı, seriye
// göre değişir, önceki serinin ilki başa düşmez) → sahnede sıradaki → skor girilince 3 jüri kartı + toplam → tur bitince tören:
// ilk 3 podyum, diğerleri KARIŞIK sırada unvanla (herkese unvan). Tur boyunca puan sıralaması gösterilmez. Veriler geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1600, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    yedek = await p.evaluate(() => ({ tur: localStorage.getItem(yzAnahtar()), ses: localStorage.getItem('dag_yz_sov_ses') }));
    const kur = await p.evaluate(() => {
      const kat = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (kat.length < 5 && !turnuvaDB[g][ad].pasif) kat.push(g + '|' + ad); }));
      const id = 'sv' + Date.now().toString(36);
      localStorage.setItem(yzAnahtar(), JSON.stringify({ durum: { asama: 'tur', id, ayar: { kategori: 'serbest', mesafe: '18m', format: 'salon', hedefBasi: 1, sure: 120, yuz: '6', eleme: { sistem: 'set', bronz: true } }, katilimci: kat, hedefler: {}, seri: 0, basla: Date.now() } }));
      localStorage.setItem('dag_yz_sov_ses', '0');
      return { kat, id };
    });
    dogrula(kur.kat.length === 5, 'testte 5 sporcu gerekli');
    // kura: belirlenimci, seriye göre değişir, önceki serinin ilki başa düşmez
    const k = await p.evaluate(() => dagskEkYukle('dagsk-yz-sov.js').then(() => { const d = yzOku().durum; return { a: yzSovKura(d, 0), b: yzSovKura(d, 0), c: yzSovKura(d, 1) }; }));
    esit(JSON.stringify(k.a), JSON.stringify(k.b), 'kura her çağrıda aynı olmalı');
    dogrula(k.a.slice().sort().join() === kur.kat.slice().sort().join(), 'kura herkesi içermeli');
    dogrula(k.c[0] !== k.a[0], 'önceki serinin ilki başa düşmemeli');
    // aç → kura animasyonu → sahnede kura[0]
    await p.evaluate(() => yzSovEkran());
    await p.waitForSelector('#yz-sov .sv-kura-yazi', { timeout: 8000 });
    await p.waitForSelector('#yz-sov .sv-sanatci', { timeout: 9000 });
    const ad0 = await p.locator('#yz-sov .sv-sanatci .sv-ad').textContent();
    esit(ad0, await p.evaluate((x) => yzKisaAd(x.slice(x.indexOf('|') + 1)), k.a[0]), 'sahnede kuranın ilki olmalı');
    // sağdaki liste kura sırası; puan sırası değil
    const liste = await p.evaluate(() => [...document.querySelectorAll('#sv-sira .sv-sr')].map((e) => e.className));
    esit(liste.length, 5, 'sahne sırasında 5 satır');
    dogrula(/simdi/.test(liste[0]) && /gizli/.test(liste[4]), 'sahne sırası: ilk sahnede, sonrakiler kura (gizli)');
    // skor girilince 3 jüri kartı + toplam
    await p.evaluate((x) => yzGuncelle((o) => { o[yzSKey(o.durum.id, x)] = [['9', '10', 'M']]; }), k.a[0]);
    await p.waitForFunction(() => document.querySelectorAll('#yz-sov .sv-kart').length === 3, null, { timeout: 8000 });
    const kartlar = await p.evaluate(() => [...document.querySelectorAll('#yz-sov .sv-kart')].map((e) => e.textContent + ':' + e.className));
    dogrula(kartlar.some((x) => /^10:.*\bs\b/.test(x)) && kartlar.some((x) => /^–:.*\bg\b/.test(x)), 'jüri kartları ok değerleri/renkleriyle değil: ' + kartlar.join(','));
    await p.waitForSelector('#yz-sov .sv-toplam', { timeout: 6000 });
    esit((await p.locator('#yz-sov .sv-toplam').textContent()).replace(/\D+/g, ' ').trim().split(' ')[0], '19', 'seri toplamı 19 olmalı');
    // sonra sıradaki sahneye
    await p.waitForFunction((x) => { const e = document.querySelector('#yz-sov .sv-sanatci .sv-ad'); return e && e.textContent === x && !document.querySelector('#yz-sov .sv-toplam'); }, await p.evaluate((x) => yzKisaAd(x.slice(x.indexOf('|') + 1)), k.a[1]), { timeout: 9000 });
    // tur biter → tören: ilk 3 podyum, diğerleri unvanla karışık
    await p.evaluate((x) => yzGuncelle((o) => { const p = [['10', '10', '10'], ['9', '9', '9'], ['8', '8', '8'], ['5', '6', '7'], ['M', '5', '5']]; x.forEach((k, i) => { o[yzSKey(o.durum.id, k)] = [p[i]]; }); o.durum.asama = 'bitti'; }), kur.kat);
    await p.waitForSelector('#yz-sov .sv-podyum', { timeout: 6000 });
    await p.waitForFunction(() => document.getElementById('sv-orta').classList.contains('acikh'), null, { timeout: 14000 });
    const t = await p.evaluate(() => ({ b1: document.querySelector('#yz-sov .b1 .sv-blok span').textContent, herkes: [...document.querySelectorAll('#sv-herkes > div')].map((d) => d.querySelector('small').textContent), sira: document.getElementById('sv-sira').hidden }));
    dogrula(t.b1.indexOf('30') >= 0, '1. podyum en yüksek puan olmalı: ' + t.b1);
    esit(t.herkes.length, 2, 'podyum dışındaki 2 sporcu unvanla görünmeli');
    dogrula(t.herkes.every((x) => x.trim().length > 2), 'herkesin unvanı olmalı');
    dogrula(t.sira, 'törende sahne sırası paneli gizli olmalı');
    // kapat
    await p.evaluate(() => yzSovKapat());
    esit(await p.locator('#yz-sov').count(), 0, 'şov kapanmadı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kura (aynı, seriye göre değişir) · sahnede kuranın ilki · jüri 10/–/9 kartları + 19 · sıradaki · tören 1. podyum + 2 unvan karışık');
  } finally {
    if (yedek) await p.evaluate((y) => {
      try { yzSovKapat(); } catch (e) {}
      const set = (k, v) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); };
      set(yzAnahtar(), y.tur); set('dag_yz_sov_ses', y.ses);
    }, yedek).catch(() => {});
    await ctx.close();
  }
}
