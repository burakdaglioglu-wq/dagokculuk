// Karışık Sınıf › Oyunlar › 🎲 Dev Tahta (2026-11-09, v393; kullanıcı "B + A": Salon Tahtası + Görev Kartı). Takımlar dengeli, seri adıma dönüşür (kendi seviyesine göre),
// kural kartları adımı değiştirir, gerçek seri kayda yazılır, hareket karesi görevi (+1), her elde yeni kart, geri al, herkes atınca sonuç, finalde herkesin adı,
// 12 saat kuralı, 24 çocuk 4 takım ekrana sığar ve skor panelinin altında kalmaz, 390 px yana taşmaz.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const n = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 4); localStorage.removeItem('dag_km_tahta_' + (_kmAktifKonum || 'varsayilan')); kmOyunTemaSec('tahta'); return _kmListe.length;
    });
    dogrula(n >= 4, 'en az 4 sporcu gerekli');
    await p.waitForSelector('#tb-tahta .tb-kare', { timeout: 30000 });
    const kur = await p.evaluate(() => ({ tema: KM_OYUN_TEMALAR.tahta && KM_OYUN_TEMALAR.tahta.ad, sifir: KM_OYUN_SIFIR_ONEK.includes('dag_km_tahta_'), icerik: !!KM_OYUN_ICERIK.tahta, oner: KM_DA_OYUN.kucuk[0], ayar: KM_OYUN_AYAR_TEMA.tahta.join(','), yeni: /Dev Tahta/.test(kmOyunSeciciKartlari()) }));
    esit(kur.tema, 'Dev Tahta', 'tema'); esit(kur.sifir, true, '12 saat kuralına girmeli'); dogrula(kur.icerik, 'içerik anahtarı'); esit(kur.oner, 'zombi', '8 yaş önerisi (v403: Dev Tahta gizli)'); esit(kur.ayar, 'tahtaTur,tahtaEl,tahtaTakim', 'ayarlar'); dogrula(!kur.yeni, 'v403: Dev Tahta seçicide görünmemeli');
    esit(await p.locator('#km-oyun-rightpanel').isVisible().catch(() => false), false, 'puan sıralaması görünmemeli');

    // saf kurallar
    const saf = await p.evaluate(() => {
      const I = _tbIc, ad = (pp, e, k) => I.seriAdim(pp, e, k).toplam;
      const bol = I.takimlaraBol(['a', 'b', 'c', 'd', 'e', 'f', 'g'], 3, (k) => ({ a: 9, b: 8, c: 7, d: 6, e: 5, f: 4, g: 3 }[k]));
      const boy = [0, 1, 2].map((t) => Object.values(bol).filter((x) => x === t).length);
      const tah = I.tahtaUret(24, () => .3, { firtina: true, hareket: true });
      return {
        esik: [I.esikOf(0), I.esikOf(6), I.esikOf(8)], temel: ad([10, 6, 0], 5, null), temel7: ad([10, 6, 0], 7, null),
        cift: ad([9, 9, 1], 9, { tip: 'cift' }), sans: ad([0, 0, 0], 5, { tip: 'sans' }), renk: ad([5, 6, 8], 7, { tip: 'renk', renk: 'mavi' }), ilk: ad([10, 1, 1], 5, { tip: 'ilk' }), son: ad([1, 1, 10], 5, { tip: 'son' }), tam: ad([1, 1, 1], 5, { tip: 'tam' }), tamYok: ad([1, 0, 1], 5, { tip: 'tam' }),
        uz: [I.uzunluk(2, 1), I.uzunluk(6, 1), I.uzunluk(6, 3)], takim: [I.takimSayisi(1, 0), I.takimSayisi(8, 0), I.takimSayisi(12, 0), I.takimSayisi(18, 0), I.takimSayisi(18, 2)], boy,
        guclu: bol.a !== bol.b, tah: { bas: tah[0], bit: tah[24], ozel: tah.filter((x) => x !== 'bos').length, roket: tah.filter((x) => x === 'roket').length },
        kaz: [I.kazananlar([10, 12, 12], [3, 3, 3], false).join(','), I.kazananlar([10, 12], [2, 4], true).join(',')]
      };
    });
    esit(JSON.stringify(saf.esik), '[5,7,9]', 'seviye eşiği'); esit(saf.temel, 4, 'temel: 2+2+0'); esit(saf.temel7, 3, 'temel 7: 2+1+0');
    esit(saf.cift, 7, 'Çift Güç 3+3+1'); esit(saf.sans, 3, 'Şanslı El'); esit(saf.renk, 6, 'Renk Avı mavi: 2+2+2'); esit(saf.ilk, 6, 'İlk ok joker'); esit(saf.son, 6, 'Son ok joker'); esit(saf.tam, 5, 'Tam seri +2'); esit(saf.tamYok, 2, 'tam seri değil');
    esit(JSON.stringify(saf.uz), '[10,23,44]', 'tahta uzunluğu'); esit(JSON.stringify(saf.takim), '[1,2,3,4,2]', 'takım sayısı'); esit(JSON.stringify(saf.boy), '[3,2,2]', 'dengeli takımlar'); dogrula(saf.guclu, 'en güçlü iki çocuk ayrı takımda');
    esit(saf.tah.bas + '|' + saf.tah.bit, 'bas|bitis', 'başla/bitiş'); dogrula(saf.tah.ozel >= 8 && saf.tah.roket === 2, 'özel kareler: ' + JSON.stringify(saf.tah)); esit(saf.kaz[0], '1,2', 'beraberlik'); esit(saf.kaz[1], '0', 'erken bitiş atış başına');

    // tahta çizildi
    const b0 = await p.evaluate(() => { const st = tbDurum(); return { L: st.L, T: st.T, kare: document.querySelectorAll('.tb-kare').length, piyon: document.querySelectorAll('.tb-piyon').length, kart: document.getElementById('tb-kart').innerText, uye: document.querySelectorAll('.tb-uye').length, n: _kmOyunRosterCache.filter((x) => turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]).length }; });
    esit(b0.T, b0.n <= 9 ? 2 : 3, 'takım sayısı'); esit(b0.kare, b0.L + 1, 'kare sayısı'); esit(b0.piyon, 2, 'piyonlar'); dogrula(/KART/.test(b0.kart), 'kural kartı görünmeli'); esit(b0.uye, b0.n, 'takım listesi');

    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 150 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 150 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120)); }
      return { key: s.g + '|' + s.ad, i, once, sonra: (sp.seriler || []).length, st: JSON.parse(JSON.stringify(tbDurum())) };
    }, [oklar, hedef]);
    // belirlilik: düz tahta, kart yok
    const duz = () => p.evaluate(() => { const k = 'dag_km_tahta_' + (_kmAktifKonum || 'varsayilan'), st = tbDurum(); st.kareler = st.kareler.map((x, i) => i === 0 ? 'bas' : i === st.L ? 'bitis' : 'bos'); st.kart = null; localStorage.setItem(k, JSON.stringify(st)); localStorage.setItem('dag_km_oyun_icerik', JSON.stringify({ tahta: { ceza: false } })); tbGuncelle(); });
    await duz();

    // gerçek seri: X-10-9 her seviyede 6 adım
    const r1 = await seri(['X', '10', '9'], 0);
    esit(r1.sonra, r1.once + 1, 'seri gerçek kayda yazılmadı'); const t1 = r1.st.takim[r1.key];
    esit(r1.st.poz[t1], 6, 'piyon 6 adım gitmeli'); esit(r1.st.adim[r1.key], 6, 'adım kaydı'); esit(r1.st.faz, 'oyun', 'herkes atmadan bitmemeli');
    const gp = await p.evaluate(() => { const e = document.getElementById('tb-p' + tbDurum().takim[_kmOyunRosterCache[0].g + '|' + _kmOyunRosterCache[0].ad]), k = document.querySelector('.tb-kare[data-i="6"]'), a = e.getBoundingClientRect(), b = k.getBoundingClientRect(); return Math.abs((a.left + a.width / 2) - (b.left + b.width / 2)) < b.width && Math.abs((a.top + a.height / 2) - (b.top + b.height / 2)) < b.height; });
    dogrula(gp, 'piyon 6. karede görünmeli');
    // geri al
    const ga = await p.evaluate(() => { window.confirm = () => true; const once = tbDurum().seri; kmOyunSonGirisiGeriAl(); return { once, sonra: tbDurum().seri, poz: tbDurum().poz.join(',') }; });
    esit(ga.sonra, ga.once - 1, 'geri al'); esit(ga.poz, '0,0', 'geri alınca piyon başa');
    // v394 ceza şansı: iyi atış (X-10-9 = 6) 🐍 yılan karesine düşerse 3 geri; tahtada yılan var; kara bulut 0 adımda da yakalar
    const yl = await p.evaluate(() => { const t = _tbIc.tahtaUret(24, () => .3, { firtina: true, hareket: true, ceza: true }); return { yilan: t.filter((x) => x === 'yilan').length, sonaYakin: t.slice(18, 24).indexOf('yilan') >= 0, yok: _tbIc.tahtaUret(24, () => .3, { firtina: true, hareket: true, ceza: false }).indexOf('yilan') }; });
    dogrula(yl.yilan >= 2 && yl.sonaYakin && yl.yok < 0, 'yılan kareleri: ' + JSON.stringify(yl));
    await p.evaluate(() => { localStorage.setItem('dag_km_oyun_icerik', '{}'); const k = 'dag_km_tahta_' + (_kmAktifKonum || 'varsayilan'), st = tbDurum(); st.kareler[6] = 'yilan'; localStorage.setItem(k, JSON.stringify(st)); tbGuncelle(); });
    const ry = await seri(['X', '10', '9'], 0); esit(ry.st.poz[ry.st.takim[ry.key]], 3, 'iyi atış yılana düşünce 6 → 3'); await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); }); await p.waitForTimeout(300); esit(await p.evaluate(() => tbDurum().poz.join(',')), '0,0', 'yılan geri alındı');
    const rb = await p.evaluate(async () => { const k = 'dag_km_tahta_' + (_kmAktifKonum || 'varsayilan'), st = tbDurum(); st.kareler[6] = 'bos'; st.poz = st.poz.map(() => 4); localStorage.setItem(k, JSON.stringify(st)); tbGuncelle(); const R = Math.random; Math.random = () => 0; const s = _kmOyunRosterCache[0]; _kmOyunAktifIndex = 0; _kmOyunSeriGirisleri = ['M', 'M', 'M']; _kmOyunSeriKonumlari = []; kmOyunIlerlet(); for (let i = 0; i < 150 && _kmOyunKilit; i++) await new Promise((r) => setTimeout(r, 120)); Math.random = R; const d = tbDurum(); return d.poz[d.takim[s.g + '|' + s.ad]]; });
    dogrula(rb < 4, 'kara bulut kötü atışta da geri götürmeli: ' + rb);
    await p.evaluate(() => { kmOyunSonGirisiGeriAl(); }); await p.waitForTimeout(400); await p.evaluate(() => { localStorage.setItem('dag_km_oyun_icerik', JSON.stringify({ tahta: { ceza: false } })); const k = 'dag_km_tahta_' + (_kmAktifKonum || 'varsayilan'), st = tbDurum(); st.poz = st.poz.map(() => 0); localStorage.setItem(k, JSON.stringify(st)); tbGuncelle(); });
    esit(await p.evaluate(() => tbDurum().poz.join(',')), '0,0', 'ceza denemesi geri alındı');
    // hareket karesi: 1-1-1 → 3 adım, 3. kare hareket → görev penceresi, "Yaptık" +1
    await p.evaluate(() => { const k = 'dag_km_tahta_' + (_kmAktifKonum || 'varsayilan'), st = tbDurum(); st.kareler[3] = 'hareket'; localStorage.setItem(k, JSON.stringify(st)); tbGuncelle(); });
    const r2 = await seri(['1', '1', '1'], 0); const t2 = r2.st.takim[r2.key];
    dogrula(r2.st.gorevBekle && r2.st.gorevBekle.ti === t2, 'hareket görevi beklemeli: ' + JSON.stringify(r2.st.gorevBekle));
    await p.waitForSelector('#tb-gorev.ac #tb-gorev-tamam', { timeout: 6000 });
    const gy = await p.evaluate(() => document.querySelector('#tb-gorev').innerText);
    dogrula(/HAREKET/.test(gy) && /Yaylar yerde/.test(gy), 'görev metni: ' + gy.slice(0, 80));
    await p.locator('#tb-gorev-tamam').click(); await p.waitForTimeout(300);
    const g2 = await p.evaluate(() => ({ poz: tbDurum().poz, bek: tbDurum().gorevBekle, gorev: tbDurum().gorev, ac: document.getElementById('tb-gorev').classList.contains('ac') }));
    esit(g2.poz[t2], 4, 'görev +1'); esit(g2.bek, null, 'görev kapanmalı'); esit(g2.gorev[t2], 1, 'görev sayısı'); esit(g2.ac, false, 'pencere kapanmalı');
    // 🃏 Yeni kart (el): kart, yürüyüş, piyon değişir; kart penceresi görünür
    const el0 = await p.evaluate(() => ({ el: tbDurum().el, y: tbDurum().yuruyus }));
    await p.locator('#tb-kartcek').click(); await p.waitForSelector('#tb-yenikart.ac .tb-yk', { timeout: 3000 });
    const el1 = await p.evaluate(() => ({ el: tbDurum().el, y: tbDurum().yuruyus, yazi: document.getElementById('tb-yenikart').innerText }));
    esit(el1.el, el0.el + 1, 'yeni el'); dogrula(el1.y !== el0.y, 'yürüyüş kartı değişmeli'); dogrula(/YENİ KART/.test(el1.yazi) && /Hedefe giderken/.test(el1.yazi), 'kart penceresi: ' + el1.yazi.slice(0, 80));
    await p.waitForTimeout(2800);
    await duz();
    const kalan = await p.evaluate(() => { const st = tbDurum(); return _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad] && !(st.atan[x.g + '|' + x.ad] >= 1)) ? j : -1).filter((j) => j >= 0); });
    for (const j of kalan) await seri(['8', '6', '2'], j);
    esit(await p.evaluate(() => tbDurum().faz), 'son', 'herkes atınca bitmeli (1 tur)');
    await p.waitForSelector('#tb-son', { timeout: 10000 }); const sonYazi = await p.locator('#tb-son').innerText();
    dogrula(/KAZANDI|BERABERE/.test(sonYazi), 'sonuç başlığı: ' + sonYazi.slice(0, 80));
    const adlar = await p.evaluate(() => _kmOyunRosterCache.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).map((s) => kmOyunIlkAd(s.ad).toLocaleUpperCase('tr-TR')));
    dogrula(adlar.every((a) => sonYazi.includes(a)), 'finalde herkesin adı, eksik: ' + adlar.filter((a) => !sonYazi.includes(a)).join(',') + ' | ' + sonYazi.slice(0, 400)); dogrula(!/kahraman|son atan/i.test(sonYazi), 'son atan öne çıkmamalı');
    // yeni oyun + 12 saat
    await p.locator('#tb-yeni-son').click(); await p.waitForSelector('#tb-tahta .tb-kare');
    esit(await p.evaluate(() => tbDurum().faz), 'oyun', 'yeni oyun');
    const on2 = await p.evaluate(() => { localStorage.setItem('dag_km_oyun_son_' + (_kmAktifKonum || 'varsayilan'), String(Date.now() - 13 * 3600000)); try { kmOyunBayatSifirla(); } catch (e) { return 'hata:' + e.message; } return localStorage.getItem('dag_km_tahta_' + (_kmAktifKonum || 'varsayilan')) ? 'kaldi' : 'silindi'; });
    esit(on2, 'silindi', '12 saat sonra sıfırlanmalı');
    // 24 çocuk: 4 takım, hepsi sahnede, skor paneline binmiyor; kareler tahtada
    for (const sayi of [18, 24]) {
      const kal = await p.evaluate(async (sayi) => {
        const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
        localStorage.removeItem('dag_km_tahta_' + (_kmAktifKonum || 'varsayilan')); _kmOyunRosterCache.length = 0; tum.slice(0, sayi).forEach((x) => _kmOyunRosterCache.push(x));
        document.getElementById('tb-icerik').innerHTML = ''; tbGuncelle(); await new Promise((r) => setTimeout(r, 400));
        const dok = document.querySelector('.km-oyun-dok'), dr = dok && dok.offsetParent ? dok.getBoundingClientRect() : null, sahne = document.querySelector('.tb-sahne').getBoundingClientRect();
        const uye = [...document.querySelectorAll('.tb-uye')].map((b) => b.getBoundingClientRect()), kare = [...document.querySelectorAll('.tb-kare')].map((b) => b.getBoundingClientRect());
        const ust = (l) => dr ? l.filter((r) => r.right > dr.left + 2 && r.bottom > dr.top + 2 && r.left < dr.right && r.top < dr.bottom).length : 0;
        const tk = document.getElementById('tb-takimlar'), kart = document.getElementById('tb-kart').getBoundingClientRect();
        return { n: uye.length, T: tbDurum().T, L: tbDurum().L, icinde: uye.every((r) => r.bottom <= sahne.bottom + 1 && r.top >= sahne.top - 1), kare: Math.min(...kare.map((r) => r.width)), ustUye: ust(uye), ustKare: ust(kare), kaydir: tk.scrollHeight > tk.clientHeight + 2, kart: kart.width, dok: !!dr };
      }, sayi);
      await p.screenshot({ path: 'tests/e2e/_cikti/tahta-' + sayi + '.png' }).catch(() => { });
      esit(kal.n, sayi, sayi + ' çocuk'); esit(kal.T, sayi > 17 ? 4 : 3, 'takım sayısı ' + sayi); dogrula(kal.icinde, sayi + ' çocuk sahneden taşıyor'); esit(kal.kaydir, false, sayi + ' çocukta takım listesi kayıyor'); dogrula(kal.kare >= 36, 'kare küçük: ' + kal.kare);
      if (kal.dok) { esit(kal.ustUye, 0, 'skor paneli çocukları kapatıyor'); esit(kal.ustKare, 0, 'skor paneli tahtayı kapatıyor'); }
    }
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    const tel = await p.evaluate(() => { const x = document.querySelector('.tb-sahne'), o = document.getElementById('tb-oyun'); return x.scrollWidth <= x.clientWidth + 1 && (!o || o.scrollWidth <= o.clientWidth + 1); });
    dogrula(tel, '390 px taşıyor');
    await p.screenshot({ path: 'tests/e2e/_cikti/tahta-390.png' }).catch(() => { });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kurallar (kartlar, seviye, takımlar) · tahta · gerçek seri 6 adım · geri al · hareket görevi +1 · yeni el · herkes atınca sonuç + herkesin adı · 12 saat · 18/24 çocuk · 390 px');
  } finally {
    await p.evaluate((y) => { try { localStorage.removeItem('dag_km_tahta_' + (_kmAktifKonum || 'varsayilan')); if (y) _kmListe = JSON.parse(y); } catch (e) { } }, yedek).catch(() => { });
    await ctx.close();
  }
}
