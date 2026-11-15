// 2026-11-15 (v417) kullanıcı: "9 kişilik sınıfta 3'erli takım yarıştırmak istedim; sen 3'lü ile 3'lüyü yarıştırdın, rastgele bir takımı
// üst tura çıkardın. Üçü de tek bir amaç için yarışsın — yendiyse 2 puan, berabere 1." → 3+ takımda "🤝 birlikte" (varsayılan):
// hepsi aynı maçta, sette en yüksek 2, eşit 1; set takımdaki herkes atınca sayılır; 4 set; en üstte eşitlik → sadece eşitler ek atış.
// 9 sporcu 3v3 → 3 takım · seçim görünür + varsayılan birlikte · eleme ağacı/bay YOK · puanlar 2/1 · yarım set sayılmaz · ek atış ·
// kendiliğinden biter · TV + final · 390 px taşma yok. Atılan seriler test sonunda geri alınır.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  const O = 'tests/e2e/_cikti/125-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    yedek = await p.evaluate(() => ({ tur: localStorage.getItem(yzAnahtar()), mod: localStorage.getItem('dag_yz_mod'), liste: JSON.stringify(_kmListe), ses: _yz.ses }));
    const n = await p.evaluate(() => {
      _yz.ses = false;
      const l = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (l.length < 9 && !turnuvaDB[g][ad].pasif) l.push({ g, ad }); }));
      window.__once = {}; l.forEach((s) => { window.__once[s.g + '|' + s.ad] = { n: (turnuvaDB[s.g][s.ad].seriler || []).length, t: turnuvaDB[s.g][s.ad].toplamSkor }; });
      _kmListe = l; kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _yzK.tur = 'takim'; _yzK.haric = {}; _yzK.kaynak = 'rast'; _yzK.bicim = null; _yzK.boyut = 3;
      yzModAyarla('takim'); yzTakimlariKur(); kmYarismaKurulumCiz();
      return l.length;
    });
    esit(n, 9, 'testte 9 sporcu gerekli');
    await p.waitForTimeout(300);
    esit(await p.evaluate(() => _kmTakimlar.filter((t) => t.uyeler.length).map((t) => t.uyeler.length).join(',')), '3,3,3', '9 sporcu 3v3 → 3 takım olmalı');
    const secim = p.locator('.yz-bicim-sec');
    dogrula(await secim.count() === 1, '"Nasıl yarışsınlar?" seçimi yok');
    dogrula(/birlikte/.test(await secim.locator('.aktif').textContent()), 'varsayılan "birlikte" değil');
    dogrula(/birlikte/.test(await p.locator('.yz-sk-alt .yz-btn.ana').textContent()), 'başlat düğmesi "birlikte" demiyor');
    await p.screenshot({ path: O + 'kurulum.png', fullPage: true });
    await p.locator('.yz-sk-alt .yz-btn.ana').click(); await p.waitForTimeout(400);
    const bas = await p.evaluate(() => ({ aktif: _kmYarismaAktif, gor: _kmYarismaBracketGorunum, maclar: _kmYarismaBracketMaclar.length, n: _kmYarismaAktifTakimlar().length }));
    dogrula(bas.aktif === true && bas.gor === null && bas.maclar === 0 && bas.n === 3, 'tek maç başlamadı / eleme ağacı kuruldu: ' + JSON.stringify(bas));
    dogrula(!/bay geç/i.test(await p.locator('#km-icerik').textContent()), 'ekranda "bay geçti" var');

    const onayGec = () => p.evaluate(() => { const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') try { onayOnayla(); } catch (e) {} });
    const seri = async (k, v, ok) => { await p.evaluate(([k, v, ok]) => { yzTkGirisAc(yzEnc(k), ok); for (let i = 0; i < ok; i++) yzTkOk(v); yzTkGirisKaydet(); yzTkGirisKapat(); }, [k, v, ok]); await onayGec(); };
    const uy = await p.evaluate(() => _kmYarismaAktifTakimlar().map((t) => t.uyeler.map((u) => u.g + '|' + u.ad)));
    const okS = await p.evaluate(() => { const v = yzTkVeri(); return yzTkOkSayisi(v.deg && v.deg.kural, v.deg); });
    const durum = () => p.evaluate(() => { const v = yzTkVeri(); return { sp: v.deg.setSonuc.setPuanlari.join(','), set: v.deg.setSonuc.tamamlananSet, d: v.deg.durum, ek: (v.deg.ekAtisanlar || []).join(','), kaz: v.deg.kazananIdx }; });
    const set = async (degerler) => { for (let t = 0; t < 3; t++) for (const k of uy[t]) await seri(k, degerler[t], okS); };

    // 1. set: A 10, B 7, C 7 — C'nin son sporcusu atmadan set sayılmaz
    for (let t = 0; t < 2; t++) for (const k of uy[t]) await seri(k, ['10', '7'][t], okS);
    for (const k of uy[2].slice(0, 2)) await seri(k, '7', okS);
    esit((await durum()).set, 0, 'takımdaki herkes atmadan set sayıldı');
    await p.screenshot({ path: O + 'tablet-maç.png', fullPage: false });
    await seri(uy[2][2], '7', okS);
    esit((await durum()).sp, '2,0,0', '1. set: tek kazanan 2 puan almalı');
    await set(['8', '8', '5']);
    esit((await durum()).sp, '3,1,0', '2. set: en yüksekte eşit iki takım 1\'er puan almalı');
    await set(['5', '5', '10']);
    await p.evaluate(() => yzTkTvAc()); await p.waitForTimeout(400); await p.evaluate(() => document.fullscreenElement && document.exitFullscreen());
    await p.waitForTimeout(300); await p.screenshot({ path: O + 'tv-maç.png' });
    dogrula(await p.locator('#yz-tk-tv .yz-tk-coklu .yz-tk-taraf').count() === 3, 'TV\'de 3 takım kartı yok');
    dogrula(/hep birlikte/.test(await p.locator('#yz-tk-tv').textContent()), 'TV kural yazısı "hep birlikte" demiyor');
    await set(['6', '10', '6']);
    let d = await durum();
    esit(d.sp + '|' + d.d + '|' + d.ek, '3,3,2|shootoff|0,1', '4 set sonra en üstte eşitlik → sadece A ve B ek atış');
    await p.waitForTimeout(300); await p.screenshot({ path: O + 'tv-ekatis.png' });
    const ekOk = await p.evaluate(() => { const v = yzTkVeri(); return yzTkOkSayisi(v.deg.kural, v.deg); });
    esit(ekOk, 1, 'ek atışta 1 ok önerilmeli');
    for (const k of uy[0]) await seri(k, '10', 1);
    for (const k of uy[1]) await seri(k, '9', 1);
    await p.waitForTimeout(1500);
    const son = await p.evaluate(() => ({ aktif: _kmYarismaAktif, g: _kmYarismaGecmisi[0], son: _yzSon && { kaz: _yzSon.kaz, ad: _yzSon.taraflar[_yzSon.kaz] && _yzSon.taraflar[_yzSon.kaz].ad } }));
    esit(son.aktif, false, 'ek atış sonrası maç kendiliğinden bitmeli');
    esit(son.g.kazananAd, son.g.takimlar[0].ad, 'geçmişte kazanan ilk sırada olmalı');
    esit(son.g.takimlar.map((t) => t.setPuan).join(','), '3,3,2', 'geçmişte set puanları');
    esit(son.son && son.son.kaz, 0, 'final: A kazanmalı');
    await p.evaluate(() => { try { document.getElementById('kutlama-overlay').classList.remove('acik'); } catch (e) {} }); await p.waitForTimeout(1200);
    await p.screenshot({ path: O + 'tv-final.png' });
    dogrula(await p.locator('#yz-tk-tv .yzs.tv').count() === 1 && /KAZANDI/.test(await p.locator('#yz-tk-tv .yzs h1').textContent()), 'TV final ekranı yok');
    esit(await p.locator('#yz-tk-tv .yzs-adlar span').count(), 9, 'finalde 9 sporcunun adı');
    const finalAd = await p.evaluate(() => [...document.querySelectorAll('#yz-tk-tv .yzs-adlar')].map((d) => [...d.querySelectorAll('span')].map((x) => x.textContent).join('+')).join(' / '));
    const macAd = await p.evaluate((uy) => uy.map((t) => t.map((k) => yzKisaAd(k.slice(k.indexOf('|') + 1))).join('+')).join(' / '), uy);
    esit(finalAd, macAd, 'finaldeki takım üyeleri maçtakilerle aynı olmalı');
    await p.evaluate(() => yzTkTvKapat());

    // telefon: maç ekranı (yeni maç, 1 set) 390 px
    await p.evaluate(() => { kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _yzK.tur = 'takim'; yzTakimlariKur(); kmYarismaKurulumCiz(); });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px kurulum taşıyor');
    await p.screenshot({ path: O + 'telefon-kurulum.png', fullPage: true });
    await p.evaluate(() => yzSihirbazBaslat()); await p.waitForTimeout(300);
    const uy2 = await p.evaluate(() => _kmYarismaAktifTakimlar().map((t) => t.uyeler.map((u) => u.g + '|' + u.ad)));
    for (let t = 0; t < 3; t++) for (const k of uy2[t]) await seri(k, ['9', '9', '7'][t], okS);
    await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px maç ekranı taşıyor');
    await p.screenshot({ path: O + 'telefon-maç.png', fullPage: true });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('9 sporcu → 3 takım birlikte · 2/1 puan · yarım set sayılmaz · eşitlikte sadece A-B ek atış · kendiliğinden biter · TV + final · 390 px');
  } finally {
    try {
      await p.evaluate((y) => {
        Object.keys(window.__once || {}).forEach((k) => { const i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)][k.slice(i + 1)]; if (sp) { sp.seriler = (sp.seriler || []).slice(0, window.__once[k].n); sp.toplamSkor = window.__once[k].t; sp.lastModified = Date.now(); } });
        try { yzTkTvKapat(); } catch (e) {}
        kmYarismaSifirla(); _yzK.bicim = null; _yzK.tur = null; _yzK.kaynak = null;
        if (y) { if (y.tur == null) localStorage.removeItem(yzAnahtar()); else localStorage.setItem(yzAnahtar(), y.tur); if (y.mod == null) localStorage.removeItem('dag_yz_mod'); else localStorage.setItem('dag_yz_mod', y.mod); _kmListe = JSON.parse(y.liste); _yz.ses = y.ses; }
        try { kaydet(); } catch (e) {}
      }, yedek);
    } catch (e) {}
    await ctx.close();
  }
}
