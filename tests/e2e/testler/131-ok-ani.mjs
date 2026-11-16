// 🎬 Ok anı + ŞİMDİ cümlesi + Top Savaşı tehlikesi (2026-11-16, v423). Kullanıcı: "oyun içerikleri çok kötü, çocuklar sıkılıyor"
// (okun etkisi görünmüyor, tehlike yok, anlamadılar). Son haftalardaki 12 oyunda ŞİMDİ şeridi + lejant görünür; her seride
// büyük an (ad, oklar, oyunun dilinde yazı) çıkar ve sonra kaybolur; "🎬 An" kapatınca an çıkmaz. Top Savaşı: zayıf seri barut
// verir, tur sonunda korsan ateş eder (can düşer), korsan 4 turda çarpar → kaybetmek mümkün, sonuç kartında Rövanş; geri al.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const O = 'tests/e2e/_cikti/131-';
  let yedek = null;
  try {
    if (process.env.E2E_3B) await ctx.addInitScript(() => { window.__h3Zorla3B = true; });
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    await p.evaluate(() => { const t = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) t.push({ g, ad }); })); window.__tum = t; localStorage.removeItem('dag_km_an_kapali'); });
    const temalar = await p.evaluate(() => KM_AN_TEMALAR.slice());
    esit(temalar.length, 12, 'an katmanı 12 oyunda');
    // ŞİMDİ şeridi her oyunda
    for (const t of temalar) {
      await p.evaluate((t) => kmOyunTemaSec(t), t);
      await p.waitForFunction(() => document.querySelector('#an-simdi.ac .an-cumle'), null, { timeout: 15000 });
      const y = await p.locator('#an-simdi').innerText();
      dogrula(/ŞİMDİ/.test(y) && /9-10/.test(y) && /7-8/.test(y), t + ': ŞİMDİ şeridi ' + y.slice(0, 60));
    }
    // ŞİMDİ şeridi başka oyunda görünmez
    await p.evaluate(() => kmOyunTemaSec('zirve')); await p.waitForTimeout(600);
    esit(await p.evaluate(() => document.querySelector('#an-simdi').classList.contains('ac')), false, 'eski oyunda şerit yok');

    const seri = (oklar, hedef, anBak) => p.evaluate(async ([oklar, hedef, anBak]) => {
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i];
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      let an = null;
      for (let k = 0, bos = 0; k < 300 && bos < 4; k++) {
        await new Promise((r) => setTimeout(r, 100));
        const pe = document.querySelector('.an-perde.ac'); if (pe && !an) an = { ad: pe.querySelector('.an-ad').textContent, var: true };
        if (pe && anBak && !an.etiket) { const e = pe.querySelector('.an-etiket').textContent; if (e) an.etiket = e; }
        const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); bos = 0; } else if (!_kmOyunKilit) bos++; else bos = 0;
      }
      return { ad: s.ad, an, st: typeof h3Durum === 'function' ? JSON.parse(JSON.stringify(h3Durum(_kmOyunAktifTema))) : null, perdeKaldi: !!document.querySelector('.an-perde') };
    }, [oklar, hedef, !!anBak]);
    const ac = async (tid, n) => {
      await p.evaluate(([tid, n]) => { _kmListe = window.__tum.slice(0, n); const kn = _kmAktifKonum || 'varsayilan'; localStorage.removeItem('dag_km_h3_' + tid + '_' + kn); kmOyunListeDegisti && kmOyunListeDegisti(); kmOyunTemaSec(tid); }, [tid, n]);
      await p.waitForSelector('#h3-hud #h3-serit .h3-k', { timeout: 30000 }); await p.waitForTimeout(800);
    };
    const idxler = () => p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0));

    // Top Savaşı: an + barut + karşı ateş + kaybetme
    await ac('topsavasi', 6);
    const ix = await idxler();
    const r1 = await seri(['X', '10', '9'], ix[0], true);
    dogrula(r1.an && r1.an.var, 'seride büyük an çıkmalı');
    dogrula(r1.an.ad.length > 0 && r1.an.ad === r1.an.ad.toLocaleUpperCase('tr-TR'), 'anda çocuğun adı büyük: ' + r1.an.ad);
    dogrula(/İSABET|GÖVDE|SIYIRDI|SUYA/.test(r1.an.etiket || ''), 'anda oyunun dilinde yazı: ' + r1.an.etiket);
    esit(r1.perdeKaldi, false, 'an bitince perde kalkmalı');
    esit(r1.st.barut, 0, 'iyi seri barut vermez');
    const r2 = await seri(['3', '2', 'M'], ix[1]);
    esit(r2.st.barut, 1, 'zayıf seri barut verir');
    // geri al barutu da geri alır
    esit(await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); return h3Durum('topsavasi').barut; }), 0, 'geri al barut');
    // An kapalıyken an çıkmaz
    await p.evaluate(() => { localStorage.setItem('dag_km_an_kapali', '1'); kmOyunAnTazele(_kmOyunAktifTema); });
    const r3 = await seri(['3', '2', 'M'], ix[1]);
    esit(r3.an, null, 'An kapalıyken an çıkmamalı');
    esit(await p.locator('#an-dug').innerText(), '🎬 An: kapalı', 'düğme kapalı yazmalı');
    await p.evaluate(() => { localStorage.removeItem('dag_km_an_kapali'); kmOyunAnTazele(_kmOyunAktifTema); });
    // turu zayıf serilerle bitir: korsan ateş eder, can düşer, korsan yaklaşır
    let son = null;
    for (const j of ix.slice(2)) son = await seri(['3', '2', 'M'], j);
    await p.waitForTimeout(500);
    let st = await p.evaluate(() => JSON.parse(JSON.stringify(h3Durum('topsavasi'))));
    esit(st.tur, 2, '1. tur bitmeli'); esit(st.kalan, 3, 'korsan bir tur yaklaşmalı');
    dogrula(st.can < 6, 'korsan ateşi can düşürmeli (can ' + st.can + ')'); esit(st.barut, 0, 'tur sonunda barut sıfırlanır');
    const simdi = await p.locator('#an-simdi .an-cumle').innerText();
    dogrula(/3 tur/.test(simdi), 'ŞİMDİ cümlesi kalan turu söylemeli: ' + simdi);
    await p.screenshot({ path: O + 'topsavasi-tur.png' });
    // kalan turlar zayıf → kaybedilir (herkes atmadan bitmez)
    let tur = 1;
    while (tur < 6) {
      tur++;
      for (let k = 0; k < ix.length; k++) { son = await seri(['3', '2', 'M'], ix[k]); if (k === ix.length - 2) esit(son.st.faz, 'oyun', 'herkes atmadan bitmemeli'); }
      if (son.st.faz === 'son') break;
    }
    await p.waitForTimeout(800);
    st = await p.evaluate(() => JSON.parse(JSON.stringify(h3Durum('topsavasi'))));
    esit(st.faz, 'son', 'zayıf sınıf kaybetmeli'); dogrula(st.kayip === 'batti' || st.kayip === 'carpti', 'kayıp nedeni: ' + st.kayip);
    esit((st.finalAdlar || []).length, ix.length, 'kayıpta da herkesin adı');
    await p.waitForSelector('#h3-son', { timeout: 10000 });
    const yazi = await p.locator('#h3-son').innerText();
    dogrula(/BATTI|ÇARPTI/.test(yazi) && /Rövanş/.test(yazi), 'kayıp kartı: ' + yazi.slice(0, 80));
    await p.screenshot({ path: O + 'topsavasi-kayip.png' });
    await p.locator('#h3-yeni-son').click(); await p.waitForTimeout(500);
    st = await p.evaluate(() => h3Durum('topsavasi'));
    esit(st.faz, 'oyun', 'rövanş'); esit(st.can, 6, 'rövanşta 6 can'); esit(st.kalan, 4, 'rövanşta 4 tur');
    // iyi sınıf kazanır
    for (const j of ix) son = await seri(['X', '10', '10'], j);
    await p.waitForTimeout(800);
    esit((await p.evaluate(() => h3Durum('topsavasi'))).faz, 'son', 'iyi sınıf 1 turda batırmalı');
    esit((await p.evaluate(() => h3Durum('topsavasi'))).kayip, null, 'kazanınca kayıp yok');

    // diğer oyunlarda an çıkıyor mu (zombi, bomba)
    for (const t of ['zombi', 'bomba', 'ejderkule']) {
      await p.evaluate(([t]) => { _kmListe = window.__tum.slice(0, 18); kmOyunListeDegisti && kmOyunListeDegisti(); kmOyunTemaSec(t); }, [t]);
      await p.waitForTimeout(2500);
      await p.evaluate(() => document.querySelectorAll('button').forEach((b) => { if (/^(Devam|Kapat)$/.test(b.textContent.trim()) && b.offsetParent) b.click(); }));
      const ixs = await idxler();
      const sh = p.screenshot({ path: O + t + '-an.png' }).catch(() => {});
      const r = await (async () => { const pr = seri(['10', '7', '4'], ixs[0], true); await p.waitForTimeout(1500); await p.screenshot({ path: O + t + '-an.png' }); return pr; })();
      await sh;
      dogrula(r.an && r.an.var, t + ': an çıkmalı'); esit(r.perdeKaldi, false, t + ': perde kalkmalı');
      dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), t + ': yana taşma');
    }
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(1000);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yana taşıyor');
    await p.screenshot({ path: O + 'telefon.png' });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('12 oyunda ŞİMDİ şeridi · an (ad, oklar, oyun dili) · An kapat · Top Savaşı barut + karşı ateş + yaklaşma + kayıp + rövanş + zafer · zombi/bomba/ejderkule anı · 390 px');
  } finally {
    try {
      await p.evaluate((y) => { const kn = _kmAktifKonum || 'varsayilan'; localStorage.removeItem('dag_km_h3_topsavasi_' + kn); localStorage.removeItem('dag_km_an_kapali'); if (y) { _kmListe = JSON.parse(y); kmOyunListeDegisti && kmOyunListeDegisti(); } }, yedek);
    } catch (e) {}
    await ctx.close();
  }
}
