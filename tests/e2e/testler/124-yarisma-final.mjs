// Yarışma › maç sonu FİNAL ekranı (2026-11-12, v413; kullanıcı: "yarışmada bitirişler TV ekranında hasarlı, kötü"). Takım maçı bitince TV final
// (kazanan, skor, setler, herkesin adı); 'Yarışmayı Bitir' sonrası TV 'Maç henüz başlamadı'ya düşmez; tablette sonuç kartı + Rövanş;
// Hayali Rakip son seti maçı bitirince rakibin son atışı yine oynar, TV final + seviye atlar; 390 px taşma yok.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1920, yukseklik: 1080 });
  const O = 'tests/e2e/_cikti/124-';
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    yedek = await p.evaluate(() => ({ tur: localStorage.getItem(yzAnahtar()), mod: localStorage.getItem('dag_yz_mod'), liste: JSON.stringify(_kmListe) }));
    const sec = (n) => p.evaluate((n) => {
      const l = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (l.length < n && !turnuvaDB[g][ad].pasif && (typeof bugunkuSeriSayisi !== 'function' || bugunkuSeriSayisi(turnuvaDB[g][ad]) < 2)) l.push({ g, ad }); }));
      window.__L = (window.__L || []).concat(l.filter((s) => !(window.__L || []).some((x) => x.g === s.g && x.ad === s.ad)));
      window.__once = window.__once || {}; l.forEach((s) => { const k = s.g + '|' + s.ad; if (!(k in window.__once)) window.__once[k] = { n: (turnuvaDB[s.g][s.ad].seriler || []).length, t: turnuvaDB[s.g][s.ad].toplamSkor }; });
      _kmListe = l; return l.length;
    }, n);
    const onayGec = () => p.evaluate(() => { const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') try { onayOnayla(); } catch (e) {} });
    const tkSeri = (k, oklar) => p.evaluate(([k, oklar]) => { yzTkGirisAc(yzEnc(k), oklar.length); oklar.forEach((v) => yzTkOk(v)); yzTkGirisKaydet(); yzTkGirisKapat(); }, [k, oklar]);

    // 1) TAKIM MAÇI 2v2
    log('takım: ' + await sec(4));
    await p.evaluate(() => { kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _yzK.tur = 'takim'; _yzK.haric = {}; yzModAyarla('takim'); yzTakimlariKur(); kmYarismaBaslat(); });
    await p.waitForTimeout(300);
    await p.evaluate(() => yzTkTvAc()); await p.waitForTimeout(400); await p.evaluate(() => document.fullscreenElement && document.exitFullscreen());
    for (let s = 0; s < 6; s++) {
      const bitti = await p.evaluate(() => { const v = yzTkVeri(); return !!(v.deg && v.deg.durum === 'bitti'); }); if (bitti) break;
      const uy = await p.evaluate(() => _kmTakimlar.slice(0, 2).map((t) => t.uyeler.map((u) => u.g + '|' + u.ad)));
      const ok = await p.evaluate(() => yzTkOkSayisi(yzTkVeri().deg && yzTkVeri().deg.kural, yzTkVeri().deg));
      for (const k of uy[0]) { await tkSeri(k, Array(ok).fill('10')); await onayGec(); }
      for (const k of uy[1]) { await tkSeri(k, Array(ok).fill('7')); await onayGec(); }
    }
    await p.waitForTimeout(1500);
    await p.screenshot({ path: O + 'takim-bitti.png' });
    dogrula(await p.locator('#yz-tk-tv .yzs.tv').count() === 1, 'maç bitince TV final ekranı yok');
    dogrula(/KAZANDI/.test(await p.locator('#yz-tk-tv .yzs h1').textContent()), 'final başlığı KAZANDI demiyor');
    esit(await p.locator('#yz-tk-tv .yzs-adlar span').count(), 4, 'finalde herkesin adı');
    dogrula(!/dokun: başlat/.test(await p.locator('#yz-tk-tv').textContent()), 'final ekranında sayaç kalmamalı');
    await p.evaluate(() => kmYarismaBitir()); await p.waitForTimeout(1800);
    await p.screenshot({ path: O + 'takim-bitir.png' });
    dogrula(await p.locator('#yz-tk-tv .yzs.tv').count() === 1, 'Bitir sonrası TV final ekranı kayboldu');
    dogrula(!/henüz başlamadı/.test(await p.locator('#yz-tk-tv').textContent()), 'Bitir sonrası TV "Maç henüz başlamadı" diyor');
    await p.evaluate(() => { try { document.getElementById('kutlama-overlay').classList.remove('acik'); } catch (e) {} }); await p.waitForTimeout(1500);
    await p.screenshot({ path: O + 'takim-bitir2.png' });
    await p.evaluate(() => yzTkTvKapat()); await p.evaluate(() => kmYarismaCiz()); await p.waitForTimeout(400);
    dogrula(await p.locator('#km-icerik .yzs').count() === 1 && await p.locator('#km-icerik .yzs button', { hasText: 'Rövanş' }).count() === 1, 'tablette sonuç kartı + Rövanş yok');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px sonuç kartı taşıyor');
    await p.locator('#km-icerik .yzs').screenshot({ path: O + 'tablet-kart.png' });
    await p.setViewportSize({ width: 1920, height: 1080 }); await p.waitForTimeout(300);

    // 2) HAYALİ: sınıf kazanır
    log('hayali: ' + await sec(4));
    await p.evaluate(() => { localStorage.setItem('dag_yz_hy_ses', '0'); kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _yzK.tur = 'hayali'; _yzK.haric = {}; yzModAyarla('takim'); yzTakimlariKur(); kmYarismaBaslat(); _kmTakimlar[1].hyOrt = 3; window.__atis = 0; new MutationObserver(() => { if (document.getElementById('yz-hy-atis') && !window.__atisVar) { window.__atis++; window.__atisVar = 1; } if (!document.getElementById('yz-hy-atis')) window.__atisVar = 0; }).observe(document.body, { childList: true }); window.__sv0 = yzHySeviye(_kmTakimlar[1].hyGrup, _kmTakimlar[1].hyRakip); });
    await p.evaluate(() => yzTkTvAc()); await p.waitForTimeout(400); await p.evaluate(() => document.fullscreenElement && document.exitFullscreen());
    for (let s = 0; s < 6; s++) {
      const bitti = await p.evaluate(() => { const v = yzHyVeri(); return !!(v.deg && v.deg.durum === 'bitti'); }); if (bitti) break;
      const uy = await p.evaluate(() => _kmTakimlar[0].uyeler.map((u) => u.g + '|' + u.ad));
      for (const k of uy) { await tkSeri(k, ['10', '10', '9']); await onayGec(); await p.evaluate(() => { clearTimeout(_yzHy.devamT); }); }
      await p.waitForTimeout(1700); await p.evaluate(() => { const a = document.getElementById('yz-hy-atis'); if (a) a.click(); }); await p.waitForTimeout(600); await p.evaluate(() => { clearTimeout(_yzHy.devamT); yzTkGirisKapat(); });
    }
    await p.waitForTimeout(800);
    await p.screenshot({ path: O + 'hayali-bitti.png' });
    const hy = await p.evaluate(() => ({ sets: _yzSon && _yzSon.taraflar[1].turlar.length, atis: window.__atis, aktif: _kmYarismaAktif, sv: yzHySeviye(_yzSon.taraflar.length && _kmTakimlar[1].hyGrup, _kmTakimlar[1].hyRakip), sv0: window.__sv0 }));
    esit(hy.aktif, false, 'hayali maç kendiliğinden bitmeli'); esit(hy.atis, hy.sets, 'son set dahil her setin rakip atışı oynamalı');
    esit(hy.sv, Math.min(5, hy.sv0 + 1), 'sınıf kazanınca rakip bir seviye güçlenmeli');
    dogrula(await p.locator('#yz-tk-tv .yzs.tv').count() === 1 && /SINIF KAZANDI/.test(await p.locator('#yz-tk-tv .yzs h1').textContent()), 'hayali bitince TV final yok');
    await p.evaluate(() => kmYarismaBitir()); await p.waitForTimeout(1800);
    await p.screenshot({ path: O + 'hayali-bitir.png' });
    await p.evaluate(() => { try { document.getElementById('kutlama-overlay').classList.remove('acik'); } catch (e) {} }); await p.waitForTimeout(1500);
    await p.screenshot({ path: O + 'hayali-bitir2.png' });
    await p.evaluate(() => yzTkTvKapat());

    dogrula(hatalar.length === 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('takım finali (TV + Bitir sonrası + tablet kartı + 390 px) · hayali: son atış oynar, final, seviye +1');
  } finally {
    try {
      await p.evaluate((y) => {
        Object.keys(window.__once || {}).forEach((k) => { const i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)][k.slice(i + 1)]; if (sp) { sp.seriler = (sp.seriler || []).slice(0, window.__once[k].n); sp.toplamSkor = window.__once[k].t; sp.lastModified = Date.now(); } });
        try { yzTkTvKapat(); } catch (e) {} try { yzTvKapat(); } catch (e) {}
        _kmRakipTipi = 'gercek'; kmYarismaSifirla();
        if (y) { if (y.tur == null) localStorage.removeItem(yzAnahtar()); else localStorage.setItem(yzAnahtar(), y.tur); if (y.mod == null) localStorage.removeItem('dag_yz_mod'); else localStorage.setItem('dag_yz_mod', y.mod); _kmListe = JSON.parse(y.liste); }
        try { kaydet(); } catch (e) {}
      }, yedek);
    } catch (e) {}
    await ctx.close();
  }
}
