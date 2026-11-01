// 2026-11-01 kullanıcı: "grup 2'ye 2, 3'e 3, 4'e 4, 5'e 5 takım yarışması — buraya girmek çok zor, sıralama turlarından sonra
// 'grup oluştur ve yarıştır' demen gerekiyor, gruplara isim verebilmeliyim, saniyeyi sıralama turları gibi ayarla" → taslak A (tek ekran).
// Süren sıralama turu varken 🏆 Yarışma → tür seçimi açılır ("Tura dön" şeridi), 👥 Takım Yarışması kartı → kurulum; 5v5; takım adı
// yazılır ve boyut değişince kalır; 🎲 isim öner; seri süresi seçici; başlayınca üst çubukta seri sayacı (dokun: başlat). Veriler geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    yedek = await p.evaluate(() => ({ tur: localStorage.getItem(yzAnahtar()), mod: localStorage.getItem('dag_yz_mod'), sure: localStorage.getItem('dag_yz_tk_sure'), liste: JSON.stringify(_kmListe), ses: _yz.ses }));
    const n = await p.evaluate(() => {
      _yz.ses = false;
      const l = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (l.length < 10 && !turnuvaDB[g][ad].pasif) l.push({ g, ad }); }));
      _kmListe = l; kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _yzK.tur = null; _yzK.haric = {}; _yzK.kaynak = null;
      // süren sıralama turu
      const kat = l.slice(0, 4).map((s) => s.g + '|' + s.ad), id = 'yt90' + Date.now().toString(36);
      localStorage.setItem(yzAnahtar(), JSON.stringify({ durum: { asama: 'tur', id, ayar: { kategori: 'serbest', mesafe: '18m', format: Object.keys(YZ_FORMAT)[0], kayit: false, lig: false, hedefBasi: 1, sure: 120, yuz: '6', eleme: { sistem: 'set', bronz: true } }, katilimci: kat, hedefler: {}, seri: 2, basla: Date.now() } }));
      yzModAyarla('siralama'); kmYarismaGiris();
      return l.length;
    });
    dogrula(n === 10, 'testte 10 sporcu gerekli (gelen ' + n + ')');
    await p.waitForTimeout(300);
    // süren tur ekranından 🏆 Yarışma → tür seçimi (eskiden tura geri atıyordu)
    await p.evaluate(() => yzTurlereDon()); await p.waitForTimeout(200);
    dogrula(await p.locator('.yz-tk-serit', { hasText: 'Sıralama turu sürüyor' }).count() === 1, '"Tura dön" şeridi yok — tür seçimi açılmadı');
    await p.locator('.yz-tur', { hasText: 'Takım Yarışması' }).click(); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => _yz.mod === 'takim' && _yzK.tur === 'takim' && !!document.querySelector('.yz-tk-ad-gir')), 'Takım Yarışması kurulumu açılmadı');
    dogrula(/Takım Yarışması/.test(await p.locator('.yz-ust-bar').textContent()), 'üst çubukta "Takım Yarışması" yok');
    // 5v5 → 2 takım
    await p.locator('.yz-sk-cipler button', { hasText: '5v5' }).click(); await p.waitForTimeout(200);
    esit(await p.evaluate(() => _kmTakimlar.map((t) => t.uyeler.length).join(',')), '5,5', '5v5 ile 10 sporcu 2 takıma dağılmadı');
    // isim yaz → boyut değişse de kalır
    const ad = p.locator('.yz-tk-ad-gir').first();
    await ad.fill('Kartal Gücü'); await ad.press('Enter'); await p.waitForTimeout(150);
    await p.locator('.yz-sk-cipler button', { hasText: '2v2' }).click(); await p.waitForTimeout(200);
    esit(await p.evaluate(() => _kmTakimlar.length + '|' + _kmTakimlar[0].ad), '5|Kartal Gücü', '2v2\'ye geçince takım adı kayboldu');
    // 🎲 isim öner → hepsi farklı ve "Takım N" değil
    await p.locator('button', { hasText: 'Hepsine isim öner' }).click(); await p.waitForTimeout(200);
    const adlar = await p.evaluate(() => _kmTakimlar.map((t) => t.ad));
    dogrula(new Set(adlar).size === adlar.length && adlar.every((a) => !/^Takım \d+$/.test(a)), 'isim önerisi hatalı: ' + adlar.join(', '));
    // renk değiştir
    const r0 = await p.evaluate(() => _kmTakimlar[0].renk);
    await p.locator('.yz-tk-renk').first().click(); await p.waitForTimeout(150);
    dogrula(await p.evaluate((r) => _kmTakimlar[0].renk !== r, r0), 'renk değişmedi');
    // seri süresi: 150 sn çipi + elle +5
    await p.locator('.yz-sk-adim .yz-cip', { hasText: '150 sn' }).click(); await p.waitForTimeout(200);
    await p.locator('.yz-sure-elle .yz-cip', { hasText: '+5' }).click();
    await p.locator('.yz-sure-elle .uygula').click(); await p.waitForTimeout(200);
    esit(await p.evaluate(() => _yzTkS.sure + '|' + localStorage.getItem('dag_yz_tk_sure')), '155|155', 'seri süresi ayarlanmadı');
    dogrula(/155 sn/.test(await p.locator('.yz-sk-alt .yz-btn.ana').textContent()), 'başlat düğmesinde süre yok');
    // başlat → eleme ağacı + üst çubukta sayaç, dokun: hatta geçiş
    await p.locator('.yz-sk-alt .yz-btn.ana').click(); await p.waitForTimeout(400);
    esit(await p.evaluate(() => _kmYarismaBracketGorunum), 'agac', 'turnuva başlamadı');
    const say = p.locator('.yz-ust-bar .yz-tk-sayac');
    dogrula(await say.count() === 1, 'üst çubukta seri sayacı yok');
    dogrula(/155/.test(await say.textContent()), 'sayaç süresi 155 değil: ' + await say.textContent());
    await say.click(); await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => document.querySelector('.yz-ust-bar .yz-tk-sayac').classList.contains('hazirlik')), 'sayaç hatta geçişe başlamadı');
    await say.click(); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => _yzTkS.basla === null), 'sayaç durmadı');
    // takım adı maça taşındı
    dogrula((await p.locator('#km-icerik').textContent()).includes(adlar[1]), 'eleme ağacında takım adı görünmüyor');
    await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), '390 px\'te taşma');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('süren turda tür seçimi · Takım Yarışması kartı · 5v5/2v2 · ad kalır · isim öner · renk · 155 sn · sayaç başlat/durdur · 390 px');
  } finally {
    if (yedek) await p.evaluate((y) => {
      const set = (k, v) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); };
      localStorage.setItem(yzAnahtar(), y.tur || '{}'); // silmek ortak derse yayılmıyor, boş kayıt yayılır
      set('dag_yz_mod', y.mod); set('dag_yz_tk_sure', y.sure); _yz.ses = y.ses;
      _yzTkS.basla = null; _kmListe = JSON.parse(y.liste); _kmListeKaydet();
      try { kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _yzK.tur = null; _yzK.kaynak = null; } catch (e) {}
    }, yedek).catch(() => {});
    await ctx.close();
  }
}
