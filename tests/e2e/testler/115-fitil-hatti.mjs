// Karışık Sınıf › Oyunlar › 💣 Fitil Hattı / Bomba Takımı (2026-11-10, v400; kullanıcı: cezalı oyunların ikincisi, taslaklardan "A · Fitil Hattı").
// Dengeli takımlar; her ok fitili 4 sn yakar, kendi hedefi +6, değen +2, çok altı −2, ıska −5; tam seri söndürücü +4.
// Fitil biterse bomba patlar, takım hep birlikte görev yapar, bomba 30 sn ile yeniden kurulur. Herkes atınca en az patlayan takım kazanır,
// finalde herkesin adı; 12 saat kuralı; 18/24 çocuk sahneye sığar ve skor panelinin altında kalmaz; 390 px yana taşmaz.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  let yedek = null;
  const K = "'dag_km_bomba_' + (_kmAktifKonum || 'varsayilan')";
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => ({ liste: JSON.stringify(_kmListe), ic: localStorage.getItem('dag_km_oyun_icerik') }));
    const n = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 4); localStorage.removeItem('dag_km_bomba_' + (_kmAktifKonum || 'varsayilan'));
      localStorage.setItem('dag_km_oyun_icerik', JSON.stringify({ bomba: { sans: false } })); // belirlilik: şans olayı yok
      kmOyunTemaSec('bomba'); return _kmListe.length;
    });
    dogrula(n >= 4, 'en az 4 sporcu gerekli');
    await p.waitForSelector('#bm-oyun .bm-bomba', { timeout: 30000 });
    // yerel veride kadro bugünkü dersten gelir; belirlilik için 4 çocukla başla (ilk seriye kadar takımlar kadroya göre yeniden kurulur)
    await p.evaluate(() => { const ilk = _kmOyunRosterCache.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).slice(0, 4); _kmOyunRosterCache.length = 0; ilk.forEach((x) => _kmOyunRosterCache.push(x)); bmGuncelle(); });
    const kur = await p.evaluate(() => ({ tema: KM_OYUN_TEMALAR.bomba && KM_OYUN_TEMALAR.bomba.ad, sifir: KM_OYUN_SIFIR_ONEK.includes('dag_km_bomba_'), icerik: KM_OYUN_ICERIK.bomba.liste.map((x) => x[0]).join(','), ayar: KM_OYUN_AYAR_TEMA.bomba.join(','), yeni: /Fitil Hattı<i class="dag-yeni/.test(kmOyunSeciciKartlari()), eskiYeni: /Uyuyan Dev<i class="dag-yeni/.test(kmOyunSeciciKartlari()), T: bmDurum().T }));
    esit(kur.tema, 'Fitil Hattı', 'tema'); esit(kur.sifir, true, '12 saat kuralına girmeli'); esit(kur.icerik, 'sans,ceza,gerilim', 'içerik anahtarları'); esit(kur.ayar, 'bombaTur,bombaTakim', 'ayar');
    dogrula(kur.yeni, 'seçicide YENİ rozeti'); dogrula(!kur.eskiYeni, 'YENİ rozeti Uyuyan Dev\'den kalkmalı'); esit(kur.T, 2, '4 çocuk → 2 takım');
    esit(await p.locator('#km-oyun-rightpanel').isVisible().catch(() => false), false, 'puan sıralaması görünmemeli');
    esit(await p.locator('.bm-tk').count(), 2, '2 bomba kartı');

    // saf kurallar
    const saf = await p.evaluate(() => {
      const I = _bmIc;
      return {
        ok: [I.okFitil(10, 5), I.okFitil(3, 5), I.okFitil(0, 5), I.okFitil(2, 7), I.okFitil(3, 7), I.okFitil(4, 9), I.okFitil(5, 9), I.okFitil(9, 9)].join(' '),
        seri: (() => { const x = I.seriFitil([10, 9, 0], 9); return x.kazanc + ':' + x.yanma + ':' + x.net + ':' + x.tam; })(),
        tam: (() => { const x = I.seriFitil([9, 10, 9], 9); return x.net + ':' + x.tam; })(), tamIki: I.seriFitil([9, 10], 9).tam,
        takim: [I.takimSayisi(1, 0), I.takimSayisi(4, 0), I.takimSayisi(9, 0), I.takimSayisi(10, 0), I.takimSayisi(18, 0), I.takimSayisi(18, 2), I.takimSayisi(3, 4)].join(','),
        bol: (() => { const o = { a: 9, b: 8, c: 7, d: 6, e: 5, f: 4 }, m = I.takimlaraBol(Object.keys(o), 3, (k) => o[k]); return Object.keys(o).map((k) => m[k]).join(''); })(),
        fitil: [JSON.stringify(I.fitilUygula(10, -10)), JSON.stringify(I.fitilUygula(10, -9)), JSON.stringify(I.fitilUygula(55, 20))].join(' '),
        kaz: [I.kazananlar([1, 0, 2], [30, 10, 50], [5, 5, 5], false), I.kazananlar([1, 1], [20, 40], [5, 5], false), I.kazananlar([1, 1], [20, 20], [5, 5], false), I.kazananlar([2, 1], [9, 9], [6, 2], true)].map((x) => x.join('+')).join(' ')
      };
    });
    esit(saf.ok, '6 2 -5 -2 2 -2 2 6', 'ok başına fitil'); esit(saf.seri, '7:12:-5:false', 'seri: kazanç, yanma, net'); esit(saf.tam, '10:true', 'tam seri söndürücü'); esit(saf.tamIki, false, '2 okla söndürücü yok');
    esit(saf.takim, '1,2,2,3,4,2,3', 'takım sayısı'); esit(saf.bol, '012210', 'dengeli yılan dağıtımı');
    esit(saf.fitil, '{"fitil":30,"patladi":true} {"fitil":1,"patladi":false} {"fitil":60,"patladi":false}', 'fitil uygula'); esit(saf.kaz, '1 1 0+1 0', 'kazanan');

    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 200 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 150 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120)); }
      const st = JSON.parse(JSON.stringify(bmDurum()));
      return { key: s.g + '|' + s.ad, ti: st.takim[s.g + '|' + s.ad], i, once, sonra: (sp.seriler || []).length, st };
    }, [oklar, hedef]);
    const yaz = (fn) => p.evaluate(new Function('k', 'const st = bmDurum(); (' + fn + ')(st); localStorage.setItem(' + K + ', JSON.stringify(st)); bmGuncelle();'));

    // gerçek seri: X-X-X her seviyede +18 +4 söndürücü −12 yanma = +10
    const r1 = await seri(['X', 'X', 'X'], 0);
    esit(r1.sonra, r1.once + 1, 'seri gerçek kayda yazılmadı'); esit(r1.st.fitil[r1.ti], 40, 'fitil 30 → 40'); esit(r1.st.faz, 'oyun', 'herkes atmadan bitmemeli');
    await p.waitForTimeout(400);
    esit(await p.evaluate((ti) => document.getElementById('bm-sure-' + ti).textContent, r1.ti), '0:40', 'bombada 0:40 görünmeli');
    // geri al
    const ga = await p.evaluate(() => { window.confirm = () => true; const once = bmDurum().seri; kmOyunSonGirisiGeriAl(); return { once, sonra: bmDurum().seri, fitil: bmDurum().fitil }; });
    esit(ga.sonra, ga.once - 1, 'geri al'); esit(ga.fitil.join(','), '30,30', 'geri alınca fitil 30');

    // kritik: fitil 10 → kart titrer
    const ti1 = await p.evaluate(() => { const s = _kmOyunRosterCache[1]; return bmDurum().takim[s.g + '|' + s.ad]; });
    await yaz('(st) => { st.fitil[' + ti1 + '] = 10; }');
    const kr = await p.evaluate((ti) => document.getElementById('bm-tk-' + ti).className, ti1);
    dogrula(/kritik/.test(kr) && /gerilim/.test(kr), 'kritik sınıfı: ' + kr);
    await p.screenshot({ path: 'tests/e2e/_cikti/115-kritik.png' }).catch(() => { });

    // patlama: fitil 10 + M-M-M (−15 −12) → patlar, takım görevi, bomba 30
    const r2 = await seri(['M', 'M', 'M'], 1);
    esit(r2.ti, ti1, 'aynı takım'); esit(r2.st.patlama[ti1], 1, 'patlama sayısı'); esit(r2.st.fitil[ti1], 30, 'bomba yeniden kuruldu');
    dogrula(r2.st.ceza && r2.st.ceza.ti === ti1, 'ceza takımda: ' + JSON.stringify(r2.st.ceza));
    await p.waitForSelector('#bm-ceza.ac #bm-gorev-tamam', { timeout: 8000 });
    const cz = await p.evaluate((ti) => ({ yazi: document.getElementById('bm-ceza').innerText, adlar: document.querySelectorAll('.bm-ceza-adlar span').length, uye: bmDurum() && Object.values(bmDurum().takim).filter((x) => x === ti).length, cezada: document.querySelectorAll('.bm-uye.cezada').length }), ti1);
    dogrula(/PATLADI/.test(cz.yazi) && /HEP BİRLİKTE/.test(cz.yazi) && /Yaylar yerde/.test(cz.yazi), 'ceza ekranı: ' + cz.yazi.slice(0, 140));
    esit(cz.adlar, cz.uye, 'takımın hepsi görevde'); esit(cz.cezada, cz.uye, 'takım üyeleri işaretli');
    const suclama = await p.evaluate((ad) => document.getElementById('bm-ceza').innerText.includes('yüzünden'), r2.key);
    dogrula(!suclama, 'atan suçlanmamalı');
    await p.screenshot({ path: 'tests/e2e/_cikti/115-patladi.png' }).catch(() => { });
    await p.locator('#bm-gorev-tamam').click(); await p.waitForTimeout(400);
    const c2 = await p.evaluate(() => ({ ceza: bmDurum().ceza, gorev: bmDurum().gorev, ac: document.getElementById('bm-ceza').classList.contains('ac') }));
    esit(c2.ceza, null, 'görev kapanmalı'); esit(c2.gorev, 1, 'görev sayısı'); esit(c2.ac, false, 'pencere kapanmalı');

    // herkes atınca sonuç
    const kalan = await p.evaluate(() => { const st = bmDurum(); return _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad] && !(st.atan[x.g + '|' + x.ad] >= 1)) ? j : -1).filter((j) => j >= 0); });
    for (const j of kalan) await seri(['8', '6', '2'], j);
    const son = await p.evaluate(() => ({ faz: bmDurum().faz, kaz: bmDurum().kazanan }));
    esit(son.faz, 'son', 'herkes atınca bitmeli (1 tur)'); dogrula(son.kaz.length >= 1 && son.kaz.indexOf(ti1) < 0, 'patlayan takım kazanmamalı: ' + JSON.stringify(son.kaz));
    await p.waitForSelector('#bm-son-ekran', { timeout: 10000 }); const sonYazi = await p.locator('#bm-son-ekran').innerText();
    dogrula(/KAZANDI|BERABERE/.test(sonYazi) && /patlad/.test(sonYazi), 'sonuç: ' + sonYazi.slice(0, 160));
    const adlar = await p.evaluate(() => _kmOyunRosterCache.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).map((s) => kmOyunIlkAd(s.ad).toLocaleUpperCase('tr-TR')));
    dogrula(adlar.every((a) => sonYazi.includes(a)), 'finalde herkesin adı, eksik: ' + adlar.filter((a) => !sonYazi.includes(a)).join(','));
    dogrula(!/kahraman|son atan/i.test(sonYazi), 'son atan öne çıkmamalı');
    await p.screenshot({ path: 'tests/e2e/_cikti/115-son.png' }).catch(() => { });
    // yeni oyun + 12 saat
    await p.locator('#bm-yeni-son').click(); await p.waitForSelector('#bm-oyun .bm-bomba');
    esit(await p.evaluate(() => bmDurum().faz + ':' + bmDurum().fitil.join(',') + ':' + bmDurum().patlama.join(',')), 'oyun:30,30:0,0', 'yeni oyun');
    const on2 = await p.evaluate(() => { localStorage.setItem('dag_km_oyun_son_' + (_kmAktifKonum || 'varsayilan'), String(Date.now() - 13 * 3600000)); try { kmOyunBayatSifirla(); } catch (e) { return 'hata:' + e.message; } return localStorage.getItem('dag_km_bomba_' + (_kmAktifKonum || 'varsayilan')) ? 'kaldi' : 'silindi'; });
    esit(on2, 'silindi', '12 saat sonra sıfırlanmalı');

    // 18/24 çocuk: hepsi sahnede, skor paneli üstlerine binmiyor, bomba görünür boyda
    for (const sayi of [18, 24]) {
      const kal = await p.evaluate(async (sayi) => {
        const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
        localStorage.removeItem('dag_km_bomba_' + (_kmAktifKonum || 'varsayilan')); _kmOyunRosterCache.length = 0; tum.slice(0, sayi).forEach((x) => _kmOyunRosterCache.push(x));
        document.getElementById('bm-icerik').innerHTML = ''; bmGuncelle(); await new Promise((r) => setTimeout(r, 500));
        const dok = document.querySelector('.km-oyun-dok'), dr = dok && dok.offsetParent ? dok.getBoundingClientRect() : null, sahne = document.querySelector('.bm-sahne').getBoundingClientRect();
        const uye = [...document.querySelectorAll('.bm-uye')].map((b) => b.getBoundingClientRect()), tk = [...document.querySelectorAll('.bm-tk')].map((b) => b.getBoundingClientRect()), svg = [...document.querySelectorAll('.bm-bomba')].map((b) => b.getBoundingClientRect().height);
        const ust = (l) => dr ? l.filter((r) => r.right > dr.left + 2 && r.bottom > dr.top + 2 && r.left < dr.right && r.top < dr.bottom).length : 0;
        return { n: uye.length, T: tk.length, icinde: uye.concat(tk).every((r) => r.bottom <= sahne.bottom + 1 && r.top >= sahne.top - 1), ustUye: ust(uye), ustTk: ust(tk), svg: Math.round(Math.min(...svg)), dok: !!dr };
      }, sayi);
      await p.screenshot({ path: 'tests/e2e/_cikti/115-' + sayi + '.png' }).catch(() => { });
      esit(kal.n, sayi, sayi + ' çocuk'); esit(kal.T, sayi <= 17 ? 3 : 4, sayi + ' çocuk takım sayısı'); dogrula(kal.icinde, sayi + ' çocuk sahneden taşıyor'); dogrula(kal.svg >= 70, 'bomba küçük: ' + JSON.stringify(kal));
      if (kal.dok) { esit(kal.ustUye, 0, 'skor paneli çocukları kapatıyor'); esit(kal.ustTk, 0, 'skor paneli bombaları kapatıyor'); }
    }
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    const tel = await p.evaluate(() => { const x = document.querySelector('.bm-sahne'), o = document.getElementById('bm-oyun'); return x.scrollWidth <= x.clientWidth + 1 && (!o || o.scrollWidth <= o.clientWidth + 1); });
    dogrula(tel, '390 px taşıyor');
    await p.screenshot({ path: 'tests/e2e/_cikti/115-390.png' }).catch(() => { });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kurallar · gerçek seri +10 · geri al · kritik · patlama + takım görevi + yeniden kurulum · herkes atınca kazanan + herkesin adı · 12 saat · 18/24 çocuk · 390 px');
  } finally {
    await p.evaluate((y) => { try { localStorage.removeItem('dag_km_bomba_' + (_kmAktifKonum || 'varsayilan')); if (y) { _kmListe = JSON.parse(y.liste); if (y.ic == null) localStorage.removeItem('dag_km_oyun_icerik'); else localStorage.setItem('dag_km_oyun_icerik', y.ic); } } catch (e) { } }, yedek).catch(() => { });
    await p.waitForTimeout(1200);
    await p.waitForFunction(() => { const d = typeof kmOrtakDurum === 'function' ? kmOrtakDurum() : null; return !d || d.bekleyen === 0; }, null, { timeout: 15000 }).catch(() => {});
    await ctx.close();
  }
}
