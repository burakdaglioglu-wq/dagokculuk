// 👁 Maddi bilgiler gözü (v458, kullanıcı: "bazen sporcuların yanında açıyorum, maddi olan her şeyi kapat-aç göz koy"): her açılışta gizli,
// göze dokununca görünür, tekrar dokununca / Yönetici kapanınca / arka plana geçince gizlenir; PIN girilince açılır.
import { sayfaAc, uygulamaAc, yoneticiAc, dogrula, esit } from '../yardimci.mjs';
const MADDI = /ödemeyen|ödemedi|tahsilat|aidatı geciken|eski borç|borcu var|₺|kaçan/i;
export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 844, paraGizli: true });
  try {
    await uygulamaAc(p); await yoneticiAc(p); await p.waitForSelector('#yn-genel .ap-kpi', { timeout: 30000 }); await p.waitForFunction(() => Object.keys(aidatDB || {}).length > 0 && typeof apOzet === 'function', null, { timeout: 30000 }); await p.evaluate(() => yoneticiOzetCiz()); await p.waitForTimeout(1200);
    const metin = (s) => p.evaluate((q) => { const e = document.querySelector(q); return e ? e.textContent : ''; }, s);
    let t = await metin('#yn-genel'); dogrula(!MADDI.test(t), 'gizliyken Genel Bakış: ' + (t.match(MADDI) || [])[0]); dogrula(/gizli/.test(t) && /Aktif sporcu/i.test(t) && /Bugün gelen/i.test(t), 'diğer kutular durur'); esit(await p.evaluate(() => yoneticiSayilar().aidat), null, 'sayı da gizli');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-p1.png' });
    // menü, şerit, kenar menüsü
    await p.locator('#yon-bottom-nav button', { hasText: 'Menü' }).click(); await p.waitForSelector('#ym-liste .ym-kart'); dogrula(!MADDI.test(await metin('#yon-diger-sheet')), 'menü gizli'); await p.locator('.ym-kapat').click(); await p.evaluate(() => yoneticiSekme('yoklama')); await p.waitForTimeout(500); dogrula(!MADDI.test(await metin('#yon-serit')), 'şerit gizli'); esit(await p.locator('#yon-serit button').count(), 3, 'şeritte kalanlar'); esit(await p.evaluate(() => [...document.querySelectorAll('#yon-sidebar-nav .yon-sb-rozet.kirmizi')].filter((x) => x.closest('button').textContent.includes('Aidat')).length), 0, 'kenar rozeti');
    // profil
    await p.evaluate(() => yoneticiSekme('panel')); const sp = await p.evaluate(() => { const g = AIDAT_GRUPLAR.find((x) => Object.keys(turnuvaDB[x] || {}).some((a) => !turnuvaDB[x][a].pasif)), ad = Object.keys(turnuvaDB[g]).find((a) => !turnuvaDB[g][a].pasif); _aidatKilitAcikMi = true; sporcuProfilAc(g + '|' + ad); return ad; }); await p.waitForSelector('#yn-b-aidat', { timeout: 10000 }); await p.waitForTimeout(600);
    dogrula(await p.evaluate(() => !document.querySelector('#yn-kart .yn-aylar') && /gizli/.test(document.getElementById('yn-b-aidat').textContent) && !/Aidattan muaf/i.test(document.getElementById('yn-kart').textContent)), 'PIN açık olsa da profilde gizli');
    await p.locator('#yn-b-aidat button', { hasText: 'Göster' }).click(); await p.waitForSelector('#yn-kart .yn-aylar', { timeout: 5000 }); await p.evaluate(() => { ynKartKapat(); _aidatKilitAcikMi = false; });
    // göz: aç → her şey, kapat → gizli
    await p.evaluate(() => paraGoster(false)); await p.locator('#yon-para-btn').click(); await p.waitForTimeout(500); t = await metin('#yn-genel'); dogrula(/ödemeyen/i.test(t) && /tahsilat/i.test(t), 'göz açınca görünür'); esit(await p.locator('#yon-para-btn').getAttribute('aria-pressed'), 'true', 'düğme durumu'); if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN + '-p2.png' });
    const g = await p.evaluate(() => { const k = [...document.querySelectorAll('#yn-genel .ap-grafik')][0], b = [...k.children].map((x) => Math.round(x.querySelector('.s').getBoundingClientRect().bottom)), kb = k.closest('.ap-panel').getBoundingClientRect().bottom; return { hiza: new Set(b).size, tas: Math.max(...[...k.querySelectorAll('small')].map((x) => x.getBoundingClientRect().bottom)) > kb }; }); dogrula(g.hiza === 1 && !g.tas, 'katılım grafiği hizası ' + JSON.stringify(g));
    await p.locator('#yon-para-btn').click(); await p.waitForTimeout(400); dogrula(!MADDI.test(await metin('#yn-genel')), 'tekrar gizlenir');
    // arka plana geçince, Yönetici kapanınca
    await p.locator('#yon-para-btn').click(); await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); delete document.hidden; }); dogrula(await p.evaluate(() => paraGizliMi()), 'arka planda gizlenir');
    await p.evaluate(() => paraGoster(true)); await p.evaluate(() => yoneticiPaneliKapat()); dogrula(await p.evaluate(() => paraGizliMi()), 'kapanınca gizlenir'); await p.evaluate(() => anaMenuAc()); await p.waitForSelector('#koc-ana'); dogrula(!MADDI.test(await metin('#koc-ana')), 'antrenör ana ekranı gizli');
    // aidat PIN'i girilince göz açılır; gözü kapatınca aidat ekranı yeniden kilitlenir
    await p.evaluate(() => { _yoneticiPaneliAcIc(); yoneticiSekme('aidat'); }); await p.evaluate(() => { const f = window.fetch; window.fetch = (u, o) => String(u).includes('aidat-dogrula') ? Promise.resolve(new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } })) : f(u, o); }); await p.evaluate(() => aidatKilitAc('1')); dogrula(await p.evaluate(() => !paraGizliMi()), 'PIN gözü açar'); await p.evaluate(() => egitmenRenderAidat()); await p.waitForTimeout(500); await p.locator('#yon-para-btn').click(); await p.waitForTimeout(400); dogrula(await p.evaluate(() => !_aidatKilitAcikMi && !!document.getElementById('akl')), 'göz kapanınca aidat kilitlenir');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
  } finally { await ctx.close(); }
}
