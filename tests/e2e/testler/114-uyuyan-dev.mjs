// Karışık Sınıf › Oyunlar › 🐊 Uyuyan Dev (2026-11-09, v399; kullanıcı: "cezalı oyunlar olsun", taslaklardan "Uyuyan Dev"i seçti).
// Bütün sınıf timsahı uyandırmadan balık toplar (kendi hedefi 🐟🐟, değen 🐟, ıska 🔊🔊). Metre dolunca timsah uyanır, balık kapar,
// çark o arada atanlardan 1–3 kişi seçer, görev "Yaptık" ile timsah yeniden uyur. Herkes atınca sonuç, finalde herkesin adı; 12 saat kuralı;
// 18/24 çocuk sahneye sığar ve skor panelinin altında kalmaz; 390 px yana taşmaz.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  let yedek = null;
  const K = "'dag_km_timsah_' + (_kmAktifKonum || 'varsayilan')";
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => ({ liste: JSON.stringify(_kmListe), ic: localStorage.getItem('dag_km_oyun_icerik') }));
    const n = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 4); localStorage.removeItem('dag_km_timsah_' + (_kmAktifKonum || 'varsayilan'));
      localStorage.setItem('dag_km_oyun_icerik', JSON.stringify({ timsah: { sans: false } })); // belirlilik: şans olayı yok
      kmOyunTemaSec('timsah'); return _kmListe.length;
    });
    dogrula(n >= 4, 'en az 4 sporcu gerekli');
    await p.waitForSelector('#tm-oyun .tm-timsah', { timeout: 30000 });
    // yerel veride kadro bugünkü dersten gelir (17 çocukta sondaki seriler timsahı uyandırıp sonucu görev kartının arkasında bekletiyordu); 4 çocukla sabitle
    await p.evaluate(() => { const ilk = _kmOyunRosterCache.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).slice(0, 4); _kmOyunRosterCache.length = 0; ilk.forEach((x) => _kmOyunRosterCache.push(x)); tmGuncelle(); });
    const kur = await p.evaluate(() => ({ tema: KM_OYUN_TEMALAR.timsah && KM_OYUN_TEMALAR.timsah.ad, sifir: KM_OYUN_SIFIR_ONEK.includes('dag_km_timsah_'), icerik: KM_OYUN_ICERIK.timsah.liste.map((x) => x[0]).join(','), ayar: KM_OYUN_AYAR_TEMA.timsah.join(','), yeni: /Uyuyan Dev<i class="dag-yeni/.test(kmOyunSeciciKartlari()) }));
    esit(kur.tema, 'Uyuyan Dev', 'tema'); esit(kur.sifir, true, '12 saat kuralına girmeli'); esit(kur.icerik, 'sans,kapma,gerilim', 'içerik anahtarları'); esit(kur.ayar, 'timsahTur', 'ayar'); // YENİ rozeti v400'de Fitil Hattı'na geçti (test 115)
    esit(await p.locator('#km-oyun-rightpanel').isVisible().catch(() => false), false, 'puan sıralaması görünmemeli');

    // saf kurallar
    const saf = await p.evaluate(() => {
      const I = _tmIc, o = (pp, e) => { const r = I.okSonuc(pp, e); return r.b + ':' + r.s; };
      let sira = [.0, .99, .5], j = 0; const r = () => sira[j++ % sira.length];
      return {
        ok: [o(10, 5), o(3, 5), o(0, 5), o(2, 7), o(3, 7), o(4, 9), o(5, 9), o(9, 9)].join(' '),
        seri: (() => { const x = I.seriSonuc([10, 9, 0], 9); return x.balik + ':' + x.ses + ':' + x.ninni; })(), ninni: I.seriSonuc([9, 10, 9], 9).ninni, ninniIki: I.seriSonuc([9, 10], 9).ninni,
        sec: [I.secimSayisi(1), I.secimSayisi(4), I.secimSayisi(6), I.secimSayisi(9), I.secimSayisi(24)].join(','),
        agir: I.agirlikliSec([{ k: 'a', w: 1 }, { k: 'b', w: 7 }, { k: 'c', w: 1 }], 2, r).join(','),
        hedef: [I.hedefBalik(20, 1, 3), I.hedefBalik(2, 1, 3), I.hedefBalik(10, 2, 6)].join(','), kap: [I.kapmaOf(50), I.kapmaOf(10), I.kapmaOf(1)].join(',')
      };
    });
    esit(saf.ok, '2:0 1:0 0:2 0:1 1:0 0:1 1:0 2:0', 'ok başına balık:ses'); esit(saf.seri, '4:2:false', 'seri toplamı'); esit(saf.ninni, true, 'tam seri ninni'); esit(saf.ninniIki, false, '2 okla ninni yok');
    esit(saf.sec, '1,1,2,3,3', 'çarkın seçtiği kişi sayısı'); esit(saf.agir, 'a,c', 'ağırlıklı seçim tekrarsız'); esit(saf.hedef, '54,10,108', 'balık hedefi'); esit(saf.kap, '5,2,1', 'kapılan balık');

    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 200 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 150 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120)); }
      return { key: s.g + '|' + s.ad, i, once, sonra: (sp.seriler || []).length, st: JSON.parse(JSON.stringify(tmDurum())) };
    }, [oklar, hedef]);
    const yaz = (fn) => p.evaluate(new Function('k', 'const st = tmDurum(); (' + fn + ')(st); localStorage.setItem(' + K + ', JSON.stringify(st)); tmGuncelle();'));

    // gerçek seri: X-10-9 her seviyede 6 balık, gürültü yok
    const r1 = await seri(['X', '10', '9'], 0);
    esit(r1.sonra, r1.once + 1, 'seri gerçek kayda yazılmadı'); esit(r1.st.balik, 6, '6 balık'); esit(r1.st.ses, 0, 'gürültü yok'); esit(r1.st.faz, 'oyun', 'herkes atmadan bitmemeli');
    await p.waitForTimeout(400);
    esit(await p.evaluate(() => document.getElementById('tm-balik').textContent), '6', 'kovada 6 balık görünmeli');
    // geri al
    const ga = await p.evaluate(() => { window.confirm = () => true; const once = tmDurum().seri; kmOyunSonGirisiGeriAl(); return { once, sonra: tmDurum().seri, balik: tmDurum().balik }; });
    esit(ga.sonra, ga.once - 1, 'geri al'); esit(ga.balik, 0, 'geri alınca kova boş');

    // gerilim: metre 7 → göz yarı açık, ekran kızarır
    await yaz('(st) => { st.ses = 7; }');
    const gr = await p.evaluate(() => ({ c: document.getElementById('tm-orta').className, dolu: document.querySelectorAll('.tm-metre-kap i.dolu').length }));
    dogrula(/gergin/.test(gr.c) && /gerilim/.test(gr.c), 'gerilim sınıfı: ' + gr.c); esit(gr.dolu, 7, 'metre 7 dolu');
    await p.screenshot({ path: 'tests/e2e/_cikti/114-gergin.png' }).catch(() => { });

    // uyanma: metre 8 + M-M-M (🔊×6) → uyanır, 30 balıktan 3'ünü kapar, çark atanı seçer, görev
    await yaz('(st) => { st.ses = 8; st.balik = 30; }');
    const r2 = await seri(['M', 'M', 'M'], 1);
    dogrula(r2.st.uyan && r2.st.uyan.secilen.length === 1 && r2.st.uyan.secilen[0] === r2.key, 'çark atanı seçmeli: ' + JSON.stringify(r2.st.uyan));
    esit(r2.st.balik, 27, 'timsah 3 balık kaptı'); esit(r2.st.uyanma, 1, 'uyanma sayısı'); esit(r2.st.ses, 10, 'metre dolu');
    await p.waitForSelector('#tm-uyan.ac #tm-gorev:not([hidden]) #tm-gorev-tamam', { timeout: 8000 });
    const uy = await p.evaluate(() => ({ yazi: document.getElementById('tm-uyan').innerText, c: document.getElementById('tm-orta').className, slot: [...document.querySelectorAll('.tm-slot.dur')].map((x) => x.textContent), yak: document.querySelectorAll('.tm-uye.yakalandi').length }));
    dogrula(/UYANDI/.test(uy.yazi) && /Yaylar yerde/.test(uy.yazi) && /uyandi/.test(uy.c), 'uyanma ekranı: ' + uy.yazi.slice(0, 120));
    esit(uy.slot.length, 1, 'çarkta 1 isim'); esit(uy.yak, 1, 'yakalanan listede işaretli');
    await p.screenshot({ path: 'tests/e2e/_cikti/114-uyandi.png' }).catch(() => { });
    await p.locator('#tm-gorev-tamam').click(); await p.waitForTimeout(400);
    const u2 = await p.evaluate(() => ({ uyan: tmDurum().uyan, ses: tmDurum().ses, gorev: tmDurum().gorev, ac: document.getElementById('tm-uyan').classList.contains('ac'), c: document.getElementById('tm-orta').className }));
    esit(u2.uyan, null, 'görev kapanmalı'); esit(u2.ses, 0, 'metre sıfırlanmalı'); esit(u2.gorev, 1, 'görev sayısı'); esit(u2.ac, false, 'pencere kapanmalı'); dogrula(!/uyandi/.test(u2.c), 'timsah yeniden uyumalı');

    // ninni: 2 metre + kendi hedefinde 3 ok → metre 0
    await yaz('(st) => { st.ses = 2; }');
    const r3 = await seri(['X', 'X', 'X'], 2); esit(r3.st.ses, 0, 'ninni metreyi indirmeli');

    // herkes atınca sonuç
    const kalan = await p.evaluate(() => { const st = tmDurum(); return _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad] && !(st.atan[x.g + '|' + x.ad] >= 1)) ? j : -1).filter((j) => j >= 0); });
    for (const j of kalan) await seri(['8', '6', '2'], j);
    esit(await p.evaluate(() => tmDurum().faz), 'son', 'herkes atınca bitmeli (1 tur)');
    await p.waitForSelector('#tm-son-ekran', { timeout: 10000 }); const sonYazi = await p.locator('#tm-son-ekran').innerText();
    dogrula(/BALIKLAR TOPLANDI|DOYDU/.test(sonYazi) && /balık topladınız/.test(sonYazi), 'sonuç: ' + sonYazi.slice(0, 120));
    const adlar = await p.evaluate(() => _kmOyunRosterCache.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).map((s) => kmOyunIlkAd(s.ad).toLocaleUpperCase('tr-TR')));
    dogrula(adlar.every((a) => sonYazi.includes(a)), 'finalde herkesin adı, eksik: ' + adlar.filter((a) => !sonYazi.includes(a)).join(','));
    dogrula(!/kahraman|son atan/i.test(sonYazi), 'son atan öne çıkmamalı');
    await p.screenshot({ path: 'tests/e2e/_cikti/114-son.png' }).catch(() => { });
    // yeni oyun + 12 saat
    await p.locator('#tm-yeni-son').click(); await p.waitForSelector('#tm-oyun .tm-timsah');
    esit(await p.evaluate(() => tmDurum().faz + ':' + tmDurum().balik), 'oyun:0', 'yeni oyun');
    const on2 = await p.evaluate(() => { localStorage.setItem('dag_km_oyun_son_' + (_kmAktifKonum || 'varsayilan'), String(Date.now() - 13 * 3600000)); try { kmOyunBayatSifirla(); } catch (e) { return 'hata:' + e.message; } return localStorage.getItem('dag_km_timsah_' + (_kmAktifKonum || 'varsayilan')) ? 'kaldi' : 'silindi'; });
    esit(on2, 'silindi', '12 saat sonra sıfırlanmalı');

    // 18/24 çocuk: hepsi sahnede, skor paneli üstlerine binmiyor, timsah görünür boyda
    for (const sayi of [18, 24]) {
      const kal = await p.evaluate(async (sayi) => {
        const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
        localStorage.removeItem('dag_km_timsah_' + (_kmAktifKonum || 'varsayilan')); _kmOyunRosterCache.length = 0; tum.slice(0, sayi).forEach((x) => _kmOyunRosterCache.push(x));
        document.getElementById('tm-icerik').innerHTML = ''; tmGuncelle(); await new Promise((r) => setTimeout(r, 400));
        const dok = document.querySelector('.km-oyun-dok'), dr = dok && dok.offsetParent ? dok.getBoundingClientRect() : null, sahne = document.querySelector('.tm-sahne').getBoundingClientRect();
        const uye = [...document.querySelectorAll('.tm-uye')].map((b) => b.getBoundingClientRect()), orta = document.getElementById('tm-orta').getBoundingClientRect(), svg = document.querySelector('.tm-timsah').getBoundingClientRect();
        const ust = (l) => dr ? l.filter((r) => r.right > dr.left + 2 && r.bottom > dr.top + 2 && r.left < dr.right && r.top < dr.bottom).length : 0;
        return { n: uye.length, icinde: uye.every((r) => r.bottom <= sahne.bottom + 1 && r.top >= sahne.top - 1), ustUye: ust(uye), ustOrta: ust([orta]), orta: Math.round(orta.height), svg: Math.round(svg.height), dok: !!dr };
      }, sayi);
      await p.screenshot({ path: 'tests/e2e/_cikti/114-' + sayi + '.png' }).catch(() => { });
      esit(kal.n, sayi, sayi + ' çocuk'); dogrula(kal.icinde, sayi + ' çocuk sahneden taşıyor'); dogrula(kal.orta >= 170 && kal.svg >= 120, 'timsah alanı küçük: ' + JSON.stringify(kal));
      if (kal.dok) { esit(kal.ustUye, 0, 'skor paneli çocukları kapatıyor'); esit(kal.ustOrta, 0, 'skor paneli timsahı kapatıyor'); }
    }
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    const tel = await p.evaluate(() => { const x = document.querySelector('.tm-sahne'), o = document.getElementById('tm-oyun'); return x.scrollWidth <= x.clientWidth + 1 && (!o || o.scrollWidth <= o.clientWidth + 1); });
    dogrula(tel, '390 px taşıyor');
    await p.screenshot({ path: 'tests/e2e/_cikti/114-390.png' }).catch(() => { });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kurallar · gerçek seri 6 balık · geri al · gerilim · uyanma + balık kapma + çark + görev · ninni · herkes atınca sonuç + herkesin adı · 12 saat · 18/24 çocuk · 390 px');
  } finally {
    await p.evaluate((y) => { try { localStorage.removeItem('dag_km_timsah_' + (_kmAktifKonum || 'varsayilan')); if (y) { _kmListe = JSON.parse(y.liste); if (y.ic == null) localStorage.removeItem('dag_km_oyun_icerik'); else localStorage.setItem('dag_km_oyun_icerik', y.ic); } } catch (e) { } }, yedek).catch(() => { });
    await p.waitForTimeout(1200);
    await p.waitForFunction(() => { const d = typeof kmOrtakDurum === 'function' ? kmOrtakDurum() : null; return !d || d.bekleyen === 0; }, null, { timeout: 15000 }).catch(() => {});
    await ctx.close();
  }
}
