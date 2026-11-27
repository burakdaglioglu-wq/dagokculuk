// ❤️ Gerilim katmanı (v471, 2026-11-27; kullanıcı: "çocuklar sıkılmaya başladı" → 2 kaybetme korkusu · 3 sıradakiler · 4 kalıp aynı):
// sınıfın 3 kalbi + öfke çubuğu · kişiye göre hedef · tahmin turu · kalkan görevi · sürpriz kart · tur sonu + yol oyu · geri al · telefon.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const KON = "(_kmAktifKonum || 'varsayilan')";
  const CIKTI = process.env.E2E_CIKTI || null, foto = async (ad) => { if (CIKTI) await p.screenshot({ path: CIKTI + '/' + ad + '.png' }); };
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    const kur = (t, n) => p.evaluate(([t, n]) => {
      Object.keys(localStorage).filter((a) => a.indexOf('dag_km_gr') === 0).forEach((a) => localStorage.removeItem(a));
      const hepsi = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) hepsi.push({ g, ad }); }));
      _kmListe = hepsi.slice(0, n); kmOyunRosterYenile(); _kmOyunRosterCache.forEach((s) => { turnuvaDB[s.g][s.ad].devamModu = true; });
      kmOyunTemaSec(t);
    }, [t, n]);
    const D = (t) => p.evaluate(([t, k]) => (JSON.parse(localStorage.getItem('dag_km_gr_' + eval(k)) || '{}'))[t] || null, [t, KON]);
    const ayarla = (t, fn) => p.evaluate(([t, fn]) => { const d = window._grIc.durum(t); (new Function('d', fn))(d); window._grIc.kaydet(t, d); grTazele(t); }, [t, fn]);
    const perdeBekle = () => p.waitForFunction(() => !document.querySelector('.gr-perde, .gr-ust'), null, { timeout: 30000 });
    const seri = (i, oklar) => p.evaluate(async ([i, oklar]) => { _kmOyunAktifIndex = i % _kmOyunRosterCache.length; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet(); for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); } await new Promise((r) => setTimeout(r, 900)); }, [i, oklar]);
    await p.evaluate(() => { try { localStorage.setItem('dag_km_an_kapali', '1'); } catch (e) { } });

    // 1) Ortak Canavar: şerit, 3 kalp, tur = 24
    await kur('canavar', 24);
    await p.waitForFunction(() => typeof grTazele === 'function' && document.getElementById('gr-serit') && document.getElementById('gr-serit').classList.contains('ac'), null, { timeout: 60000 });
    let d = await D('canavar'); esit(d.kalp, 3, '3 kalp'); esit(d.turKisi, 24, 'tur = 24 çocuk'); esit(d.ofke, 0, 'öfke 0');
    dogrula(/Tur 1 · 0\/24/.test(await p.textContent('#gr-serit')), 'şeritte tur sayacı');
    const h0 = await p.evaluate(() => window._grIc.hedef(_kmOyunRosterCache[0], null)); dogrula(h0 >= 1 && h0 <= 30, 'kişiye göre hedef: ' + h0);
    await foto('gr-serit');
    // 2) kötü seri öfke doldurur; iyi seri doldurmaz
    await ayarla('canavar', 'd.olay = null; d.kalkanVerildi = true;');
    await seri(0, ['0', '0', '0']); await perdeBekle(); d = await D('canavar'); const adim = await p.evaluate(() => window._grIc.adim('canavar', window._grIc.durum('canavar')));
    dogrula(Math.abs(d.ofke - adim) < 0.01, 'kötü seri 1 adım öfke: ' + d.ofke + ' / ' + adim); esit(d.turSeri, 1, 'tur 1/24');
    await ayarla('canavar', 'd.olay = null;');
    await seri(1, ['X', 'X', 'X']); await perdeBekle(); d = await D('canavar'); dogrula(Math.abs(d.ofke - adim) < 0.01, 'iyi seri öfke artırmaz');
    // 3) saldırı: öfke dolunca 1 kalp; perde görünür
    await ayarla('canavar', 'd.ofke = 99; d.olay = null; d.kalkanVerildi = true;');
    await seri(2, ['0', '0', '0']); await p.waitForSelector('.gr-perde.kirmizi', { timeout: 8000 }); await p.waitForTimeout(500); await foto('gr-saldiri');
    dogrula(/SALDIRDI/.test(await p.textContent('.gr-perde.kirmizi')), 'saldırı yazısı'); await perdeBekle(); d = await D('canavar'); esit(d.kalp, 2, 'saldırı 1 kalp götürür'); esit(d.ofke, 0, 'öfke sıfırlandı');
    // 4) geri al: kalp geri gelir
    await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); }); await p.waitForTimeout(700); d = await D('canavar'); esit(d.kalp, 3, 'geri al kalbi döndürür'); dogrula(d.ofke >= 98, 'geri al öfkeyi döndürür');
    // 5) kalkan görevi: saldırıdan bir adım önce; Yaptılar → öfke iner
    await ayarla('canavar', 'd.ofke = 100 - 2 * ' + adim + ' + 0.5; d.olay = null; d.kalkanVerildi = false;');
    await seri(3, ['0', '0', '0']); await p.waitForSelector('.gr-perde .gr-sayac', { timeout: 8000 }); await p.waitForTimeout(300); await foto('gr-kalkan');
    dogrula(/SIRADAKİLER/.test(await p.textContent('.gr-perde')), 'kalkan görevi sıradakilere');
    await p.waitForSelector('.gr-perde .gr-dug:not([hidden]) .e', { timeout: 9000 }); const o1 = (await D('canavar')).ofke; await p.click('.gr-perde .gr-dug .e'); await perdeBekle(); d = await D('canavar');
    dogrula(Math.abs(o1 - d.ofke - adim) < 0.01, 'Yaptılar öfkeyi 1 adım indirir'); esit(d.kalp, 3, 'kalkan sonrası kalp tam');
    // 6) sürpriz kart: 3. seride; ŞİFA 10 ile kalp getirir
    await ayarla('canavar', 'd.turSeri = 5; d.olay = null; d.kalkanVerildi = true; d.ofke = 0;');
    await seri(4, ['8', '8', '8']); await p.waitForSelector('.gr-perde', { timeout: 8000 }); await p.waitForTimeout(500); await foto('gr-olay'); await perdeBekle(); d = await D('canavar'); dogrula(!!d.olay, 'sürpriz kart çekildi: ' + d.olay);
    dogrula(/SÜRPRİZ|ÇİFTE|ŞİFA|ALTIN|SARI|KORO/.test(await p.textContent('#gr-serit')), 'kart şeritte yazılı');
    await ayarla('canavar', "d.olay = 'sifa'; d.kalp = 2;"); await seri(5, ['10', '5', '5']); await perdeBekle(); d = await D('canavar'); esit(d.kalp, 3, 'şifa ışığı 1 kalp');
    await ayarla('canavar', "d.olay = 'altin'; d.ofke = 60;"); await seri(6, ['X', '0', '0']); await perdeBekle(); d = await D('canavar'); esit(d.ofke, 0, 'altın ok öfkeyi sıfırlar');
    // 7) tahmin: soru şeritte; seri sonu "Çoğunluk bildi" öfkeyi yarım adım indirir
    await ayarla('canavar', "d.olay = null; d.kalkanVerildi = true; d.ofke = 50; d.tahmin = null; d.th = {}; d.turSeri = 9;");
    await p.evaluate(() => { _kmOyunAktifIndex = 7; grTazele('canavar'); });
    dogrula(/TAHMİN ETSİN/.test(await p.textContent('#gr-serit')), 'tahmin sorusu şeritte'); await foto('gr-tahmin');
    await seri(7, ['X', 'X', 'X']); await p.waitForSelector('.gr-ust button', { timeout: 8000 }); await foto('gr-tahmin-sonuc'); await p.click('.gr-ust button'); await perdeBekle(); d = await D('canavar');
    dogrula(Math.abs(d.ofke - (50 - adim / 2)) < 0.01, 'tahmin öfkeyi yarım adım indirir: ' + d.ofke);
    // 8) son şans: kalp 0 → iki sarı 1 kalp
    await ayarla('canavar', "d.kalp = 0; d.olay = null; d.kalkanVerildi = true; d.tahmin = null;"); dogrula(/SON ŞANS/.test(await p.textContent('#gr-serit')), 'son şans yazısı');
    await seri(8, ['9', '10', '0']); await perdeBekle(); esit((await D('canavar')).kalp, 1, 'son şans kalp getirir');
    // 9) tur sonu: herkes attı → kazandınız + yol oyu; zor yol seviyeyi artırır, ⭐ kalıcı
    await ayarla('canavar', "d.turSeri = d.turKisi - 1; d.olay = null; d.kalkanVerildi = true; d.tahmin = null; d.kalp = 2;");
    await seri(9, ['9', '9', '9']); await p.waitForSelector('.gr-yol .z', { timeout: 10000 }); await p.waitForTimeout(500); await foto('gr-tur-kazandi');
    dogrula(/KAZANDINIZ/.test(await p.textContent('.gr-perde')), 'tur kazanıldı'); const K1 = await p.evaluate(() => window._grIc.kalici()); esit(K1.yildiz, 1, '1 ⭐');
    await p.click('.gr-yol .z'); await perdeBekle(); d = await D('canavar'); esit(d.tur, 2, 'tur 2'); esit(d.yol, 'zor', 'zor yol'); esit(d.kalp, 3, 'yeni turda 3 kalp'); esit(await p.evaluate(() => window._grIc.seviye('canavar', window._grIc.durum('canavar'))), 'zor', 'Normal + zor yol = Zor');
    // tur kaybı
    await ayarla('canavar', "d.turSeri = d.turKisi - 1; d.olay = null; d.kalkanVerildi = true; d.tahmin = null; d.kalp = 0;");
    await seri(10, ['0', '0', '0']); await p.waitForSelector('.gr-yol .k', { timeout: 10000 }); await p.waitForTimeout(500); await foto('gr-tur-kaybetti');
    dogrula(/KAZANDI/.test(await p.textContent('.gr-perde')) && !/KAZANDINIZ/.test(await p.textContent('.gr-perde')), 'tur kaybedildi'); esit((await p.evaluate(() => window._grIc.kalici())).kayip, 1, 'kayıp sayıldı');
    await p.click('.gr-yol .k'); await perdeBekle(); esit((await D('canavar')).yol, 'kolay', 'kolay yol');
    // 10) ayar: kapat → şerit "kapalı", seri sonu dokunmaz; aç
    await p.click('#gr-ayar-dug'); await p.click('.gr-menu button[data-sv="kapat"]'); dogrula(/kapalı/.test(await p.textContent('#gr-serit')), 'kapalı'); const ts = (await D('canavar')).turSeri; await seri(11, ['0', '0', '0']); esit((await D('canavar')).turSeri, ts, 'kapalıyken sayılmaz'); await p.click('#gr-ac');
    // 11) diğer oyunlar: şerit çıkar; başka oyunda çıkmaz
    for (const t of ['zombi', 'blok', 'dedektif', 'hayalet']) { await p.evaluate((t) => kmOyunTemaSec(t), t); await p.waitForFunction(() => document.getElementById('gr-serit') && document.getElementById('gr-serit').classList.contains('ac'), null, { timeout: 30000 }); await p.waitForTimeout(1200); await foto('gr-' + t); }
    // 11b) v472: Yanardağ, Kale Savunması, Ninja — şerit + gerçek seri girişi kancayı çalıştırır (tur sayılır, öfke dolar)
    for (const [t, dus] of [['yanardag', 'LAV CANAVARI'], ['kale', 'DÜŞMAN ORDUSU'], ['ninja', 'BEKÇİLER']]) {
      await kur(t, 12);
      await p.waitForFunction(() => typeof grTazele === 'function' && document.getElementById('gr-serit') && document.getElementById('gr-serit').classList.contains('ac'), null, { timeout: 60000 });
      await p.waitForTimeout(1500);
      dogrula((await p.textContent('#gr-serit')).indexOf(dus) !== -1, t + ': şeritte düşman adı ' + dus);
      dogrula(/Tur 1 · 0\/12/.test(await p.textContent('#gr-serit')), t + ': tur sayacı 0/12');
      await ayarla(t, 'd.olay = null; d.kalkanVerildi = true; d.tahmin = null; d.th = {};');
      await seri(0, ['0', '0', '0']);
      const durumYaz = await p.evaluate(([t, k]) => ({ kilit: _kmOyunKilit, coklu: typeof _kmOyunCokluMu !== 'undefined' ? _kmOyunCokluMu : null, takim: _kmOyunTakimModu, tema: _kmOyunAktifTema, d: (JSON.parse(localStorage.getItem('dag_km_gr_' + eval(k)) || '{}'))[t] }), [t, KON]);
      await p.waitForFunction(([t, k]) => ((JSON.parse(localStorage.getItem('dag_km_gr_' + eval(k)) || '{}'))[t] || {}).turSeri >= 1, [t, KON], { timeout: 40000 }).catch(() => log(t + ' durum: ' + JSON.stringify(durumYaz).slice(0, 300)));
      await perdeBekle(); const dt = await D(t);
      esit(dt.turSeri, 1, t + ': seri sayıldı ' + JSON.stringify(durumYaz).slice(0, 400)); dogrula(dt.ofke > 0, t + ': kötü seri öfke doldurdu: ' + dt.ofke);
      await foto('gr-' + t);
    }
    await p.evaluate(() => kmOyunTemaSec('hapsirik')); await p.waitForTimeout(800); dogrula(!(await p.evaluate(() => document.getElementById('gr-serit').classList.contains('ac'))), 'Hapşırık\'ta şerit yok');
    // 12) telefon: şerit taşmaz
    { const t2 = await sayfaAc({ genislik: 1280, yukseklik: 800 }); try { await uygulamaAc(t2.p); await karisikSinifArac(t2.p, 'oyunlar'); await t2.p.setViewportSize({ width: 390, height: 844 }); await t2.p.evaluate(() => { const a = []; ['minikler', 'kucukler', 'yildizlar'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) a.push({ g, ad }); })); _kmListe = a.slice(0, 24); kmOyunRosterYenile(); kmOyunTemaSec('canavar'); });
      await t2.p.waitForFunction(() => document.getElementById('gr-serit') && document.getElementById('gr-serit').classList.contains('ac'), null, { timeout: 60000 }); await t2.p.evaluate(() => { const d = window._grIc.durum('canavar'); d.turSeri = 1; d.olay = 'cift'; d.tahmin = null; window._grIc.kaydet('canavar', d); _kmOyunAktifIndex = 1; grTazele('canavar'); document.getElementById('gr-serit').scrollIntoView(); });
      await t2.p.waitForTimeout(500); if (CIKTI) await t2.p.screenshot({ path: CIKTI + '/gr-tel.png' });
      const tas = await t2.p.evaluate(() => { const e = document.getElementById('gr-serit'); return Math.max(e.scrollWidth - e.clientWidth, document.documentElement.scrollWidth - document.documentElement.clientWidth); }); dogrula(tas <= 1, 'telefonda şerit taşmamalı: ' + tas); esit(t2.hatalar.length, 0, 'telefon: ' + t2.hatalar.join(' | ')); } finally { await t2.ctx.close(); } }
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('şerit · kişiye göre hedef · öfke · saldırı · geri al · kalkan görevi · sürpriz kart (şifa, altın) · tahmin · son şans · tur kazan/kaybet + yol oyu + ⭐ · kapat/aç · 8 oyun (v472 yanardağ, kale, ninja gerçek seri) · telefon');
  } finally {
    await p.evaluate(() => { try { localStorage.removeItem('dag_km_an_kapali'); } catch (e) { } }).catch(() => {});
    await ctx.close();
  }
}
