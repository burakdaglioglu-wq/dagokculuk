// Karışık Sınıf › Oyunlar › 🧟 Zombi Salgını 2.0 (2026-11-10, v401; kullanıcı ilk gerçek dersten sonra: "çok sevdiler, zor olması da hoştu" → sunumdaki 6 fikir).
// Geceler (kazanınca yeni gece, kalıcı kamp), özel oklar (süper panzehir, ışık bombası, zincir), dev zombi (yalnız herkes atınca düşer, çatlatanların adı),
// zombi çocuğun işi (koro, poz, yürüyüş), sığınak parçaları, 4 sahne; gece paneli; sis; 390 px.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  let yedek = null;
  const K = "(_kmAktifKonum || 'varsayilan')";
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => ({ liste: JSON.stringify(_kmListe), ic: localStorage.getItem('dag_km_oyun_icerik') }));
    await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      const k = _kmAktifKonum || 'varsayilan'; localStorage.removeItem('dag_km_zombi_' + k); localStorage.removeItem('dag_km_zombikamp_' + k); localStorage.removeItem('dag_km_oyun_icerik');
      _kmListe = tum.slice(0, 4); kmOyunTemaSec('zombi'); kmOyunListeDegisti();
    });
    await p.waitForSelector('#zb-kalabalik .zb-kisi', { timeout: 30000 });

    // ---- saf kurallar ----
    const saf = await p.evaluate(() => {
      const I = _zbIc, ilk = (l) => l[0], h = ['a', 'b', 'c', 'd', 'e'], yeni = (z) => { const st = { zombi: {}, zamani: {}, isirik: {}, seri: 0 }; z.forEach((k, i) => { st.zombi[k] = 1; st.zamani[k] = i; }); return st; };
      const s1 = yeni(['b', 'c', 'd']), r1 = I.adimHesapla(s1, 'a', [10, 9, 1], 5, h, ilk, true, { ekKurtar: 1 });
      const s2 = yeni(['b']), r2 = I.adimHesapla(s2, 'a', [9, 9, 9], 5, h, ilk, true, { isirikAtla: true });
      const s3 = yeni(['b']), r3 = I.adimHesapla(s3, 'a', [1, 1, 1], 5, h, ilk, true, { ekIsirik: 1 });
      const s4 = yeni(['a', 'b']), r4 = I.adimHesapla(s4, 'a', [9, 9, 1], 5, h, ilk, true, { ekKurtar: 1 });
      const ge = (g, sh, seri, isik, dev, dd) => { const e = I.geceEtkisi(g, sh, seri, isik, dev, dd); return e.ek.join('+') + '/' + e.atla; };
      const d1 = { zombi: { a: 1, b: 1, c: 1 }, zamani: { a: 3, b: 1, c: 2 }, seri: 9, dev: { gerek: 2, sayi: 2, catlak: {} } }, dv1 = I.devCoz(d1, ['a', 'b', 'c', 'd', 'e'], ilk);
      const d2 = { zombi: { a: 1 }, zamani: { a: 1 }, seri: 9, dev: { gerek: 3, sayi: 2, catlak: {} } }, dv2 = I.devCoz(d2, ['a', 'b', 'c', 'd', 'e'], ilk);
      return {
        r1: r1.iyilesen.join(','), r1b: r1.isirilan.length, r2: r2.atlandi + ':' + r2.isirilan.length, r3: r3.isirilan.length, r4: r4.iyilesen.join(','),
        sup: [I.superMi(['X', '1', '1']), I.superMi(['10', '1']), I.superMi(['9', '9', '9'])].join(','), isik: [I.isikBombasiMi([9, 9, 9], 9), I.isikBombasiMi([9, 9, 8], 9), I.isikBombasiMi([9, 9], 5)].join(','),
        ge: [ge(1, 'sokak', 4, false, false, 0), ge(2, 'sokak', 4, false, false, 0), ge(2, 'sokak', 5, false, false, 0), ge(4, 'sokak', 3, false, false, 0), ge(4, 'sokak', 3, true, false, 0), ge(1, 'kar', 8, false, false, 0), ge(1, 'sokak', 6, false, true, 4), ge(1, 'sokak', 5, false, true, 4)].join(' '),
        dev: [I.devGerek(2, 1), I.devGerek(9, 1), I.devGerek(9, 5), I.devGerek(0, 1)].join(','), dv1: dv1.dustu + ':' + dv1.iyilesen.join(','), dv2: dv2.dustu + ':' + dv2.isirilan.length + ':' + Object.keys(d2.zombi).length,
        zh: [I.zincirHedef('sokak'), I.zincirHedef('lunapark')].join(','), sise: [I.siseGerek(4), I.siseGerek(18)].join(','), sg: I.SAHNE_GECE.slice(1).join(','), parca: I.PARCA.map((x) => x.esik).join(',')
      };
    });
    esit(saf.r1, 'b,c', 'süper: iki en eski zombi'); esit(saf.r1b, 1, 'ısırık sürer'); esit(saf.r2, 'true:0', 'ışık bombası: ısırık yok'); esit(saf.r3, 2, 'ek ısırık');
    esit(saf.r4, 'a,b', 'zombi önce kendini, sonra bir kişi daha'); esit(saf.sup, 'true,true,false', 'süper panzehir X/10'); esit(saf.isik, 'true,false,false', 'ışık bombası 3 ok');
    esit(saf.ge, '/ kosucu/ / karanlik/ / /tipi dev/ /', 'gece etkileri'); esit(saf.dev, '1,5,6,1', 'dev kalbi'); esit(saf.dv1, 'true:b,c', 'dev düşünce en eski 2 kurtulur');
    esit(saf.dv2, 'false:2:3', 'dev aşınca 2 ısırık'); esit(saf.zh, '3,2', 'zincir'); esit(saf.sise, '2,6', 'şişe'); esit(saf.sg, 'sokak,lunapark,hastane,kar,sokak', 'gece sahneleri'); esit(saf.parca, '1,2,4,6,8', 'sığınak eşikleri');

    // ---- başlangıç: 1. gece, sokak; gece düğmesi; içerik anahtarları ----
    const b0 = await p.evaluate(() => ({ st: zbDurum(), yazi: document.getElementById('zb-gece-yazi').textContent, ic: KM_OYUN_ICERIK.zombi.liste.map((x) => x[0]).join(','), yeni: /Zombi Salgını<i class="dag-yeni/.test(kmOyunSeciciKartlari()) }));
    esit(b0.st.gece, 1, '1. gece'); esit(b0.st.sahne, 'sokak', 'sokak'); dogrula(/GECE 1/.test(b0.yazi), 'gece yazısı: ' + b0.yazi);
    esit(b0.ic, 'dalga,ozelOk,dev,koro,kampanya,siginak', 'içerik anahtarları'); dogrula(b0.yeni, 'seçicide YENİ');

    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      _kmOyunAktifIndex = hedef; const s = _kmOyunRosterCache[hedef];
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 150 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 150 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120)); }
      return { key: s.g + '|' + s.ad, st: JSON.parse(JSON.stringify(zbDurum())) };
    }, [oklar, hedef]);

    // ---- süper panzehir (oyunda bir kez) + dev zombi: 4 çocuk, 2'si atınca gelir, son ok atılınca düşer ----
    const a1 = await seri(['X', '1', '1'], 0);
    esit(a1.st.superKul[a1.key], 1, 'süper panzehir kullanıldı'); esit(a1.st.dev, null, 'dev erken gelmemeli');
    const a2 = await seri(['9', '9', '9'], 1);
    dogrula(a2.st.dev && a2.st.dev.gerek === 1, 'yarısı atınca dev gelmeli: ' + JSON.stringify(a2.st.dev));
    esit(await p.locator('#zb-dev').count(), 1, 'dev zombi sahnede');
    const a3 = await seri(['9', '9', '9'], 2);
    esit(a3.st.dev.sayi, 1, 'panzehir kalbi çatlatır'); esit(a3.st.devSonuc, null, 'dev son ok atılmadan düşmemeli'); esit(a3.st.faz, 'oyun', 'oyun sürer');
    const a4 = await seri(['1', '1', '1'], 3);
    esit(a4.st.faz, 'son', 'herkes atınca bitmeli'); esit(a4.st.devSonuc && a4.st.devSonuc.dustu, true, 'dev düşmeli');
    await p.waitForSelector('#zb-son', { timeout: 10000 });
    const sonYazi = await p.locator('#zb-son').innerText();
    dogrula(/Dev zombi düştü/.test(sonYazi), 'finalde dev: ' + sonYazi.slice(0, 200));
    dogrula(/Süper panzehir/.test(sonYazi), 'finalde süper panzehir adı');
    esit((a4.st.finalAdlar || []).length, 4, 'finalde herkesin adı');
    const kamp1 = await p.evaluate(() => ({ k: zbKamp(), son: zbDurum().kazandi }));
    if (kamp1.son) { esit(kamp1.k.gece, 2, 'kazanınca 2. gece'); esit(kamp1.k.enYuksek, 2, '2. gece açıldı'); esit(kamp1.k.kazanilan, 1, 'sığınak sayacı'); dogrula(/Gece 1 geçildi/.test(sonYazi), 'gece mesajı'); dogrula(/Projektör/.test(sonYazi), 'yeni parça'); }
    else { esit(kamp1.k.gece, 1, 'kaybedince aynı gece'); }

    // ---- 12 saat kuralı kampa dokunmaz ----
    const kalici = await p.evaluate(() => { const k = _kmAktifKonum || 'varsayilan'; localStorage.setItem('dag_km_zombikamp_' + k, JSON.stringify({ gece: 3, enYuksek: 4, kazanilan: 6 })); localStorage.setItem('dag_km_oyun_son_' + k, String(Date.now() - 13 * 3600000)); kmOyunBayatSifirla(); return { kamp: !!localStorage.getItem('dag_km_zombikamp_' + k), oyun: !!localStorage.getItem('dag_km_zombi_' + k) }; });
    esit(kalici.kamp, true, 'kamp 12 saatte silinmemeli'); esit(kalici.oyun, false, 'oyun 12 saatte sıfırlanır');

    // ---- yeni salgın 3. gece: sis, hastane, sığınak parçaları; gece paneli ----
    await p.evaluate(() => { kmOyunSahneKurZombi(); }); await p.waitForSelector('#zb-gece-btn', { timeout: 10000 }); await p.waitForTimeout(400);
    const g3 = await p.evaluate(() => ({ st: zbDurum(), z: document.getElementById('zb-z').textContent, sis: document.getElementById('zb-kalabalik').classList.contains('sis'), sise: !document.getElementById('zb-sise').hidden }));
    esit(g3.st.gece, 3, '3. gece'); esit(g3.st.sahne, 'hastane', 'geceye göre hastane'); esit(g3.st.kazanilan0, 6, 'sığınak');
    esit(g3.sis, false, '6 zaferle çatı: sis kalkar'); dogrula(g3.z !== '?', 'çatı varken sayı görünür'); esit(g3.sise, true, 'hastanede şişe sayacı');
    await p.click('#zb-gece-btn'); await p.waitForSelector('#zb-kamp');
    const pan = await p.evaluate(() => ({ g4: !document.querySelector('#zb-kamp [data-gece="4"]').disabled, g5: document.querySelector('#zb-kamp [data-gece="5"]').disabled, parca: document.querySelectorAll('#zb-kamp .zb-kamp-parca span.on').length }));
    esit(pan.g4, true, '4. gece açık'); esit(pan.g5, true, '5. gece kilitli'); esit(pan.parca, 4, '6 zaferle 4 parça');
    await p.click('#zb-kamp [data-sahne="kar"]');
    esit(await p.evaluate(() => zbDurum().sahne), 'kar', 'başlamamış oyunda sahne hemen değişir');
    await p.click('#zb-kamp [data-yuruyus="1"]');
    esit(await p.evaluate(() => zbKamp().yuruyus), true, 'yürüyüş açıldı');
    await p.screenshot({ path: 'tests/e2e/_cikti/117-panel.png' }).catch(() => {});
    await p.click('#zb-kamp-kapat'); esit(await p.locator('#zb-kamp').count(), 0, 'panel kapanır');

    // ---- sis (çatı yokken) + yürüyüş görevi + koro alt satırı ----
    await p.evaluate(() => { const k = _kmAktifKonum || 'varsayilan'; localStorage.setItem('dag_km_zombikamp_' + k, JSON.stringify({ gece: 3, enYuksek: 4, kazanilan: 0, yuruyus: true, sahne: 'sokak' })); localStorage.removeItem('dag_km_zombi_' + k); kmOyunSahneKurZombi(); });
    await p.waitForTimeout(800);
    esit(await p.evaluate(() => document.getElementById('zb-z').textContent), '?', 'sis: zombi sayısı gizli');
    const isir = await p.evaluate(async () => {
      const st = zbDurum(); st.basladi = true; st.zombi = {}; const l = _kmOyunRosterCache.map((s) => s.g + '|' + s.ad); st.zombi[l[0]] = 1; st.zamani[l[0]] = 0; localStorage.setItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); zbGuncelle();
      _kmOyunAktifIndex = 1; _kmOyunSeriGirisleri = ['1', '1', '1']; _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      let alt = '', gorev = false; for (let i = 0; i < 80; i++) { await new Promise((r) => setTimeout(r, 100)); const d = document.querySelector('#zb-duyuru small'); if (d && /HIRRR/.test(d.textContent)) alt = d.textContent; if (document.getElementById('zb-gorev')) gorev = true; if (alt && gorev) break; }
      for (let k = 0; k < 150 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120));
      return { alt, gorev, g: (document.getElementById('zb-gorev') || {}).textContent || '' };
    });
    dogrula(isir.alt, 'zombi korosu alt satırı'); dogrula(isir.gorev, 'yürüyüş görevi: ' + isir.g);

    // ---- sahneler çizilir ----
    for (const sh of ['lunapark', 'hastane', 'kar', 'sokak']) {
      const ok = await p.evaluate(async (sh) => { const k = _kmAktifKonum || 'varsayilan'; const km = zbKamp(); km.sahne = sh; localStorage.setItem('dag_km_zombikamp_' + k, JSON.stringify(km)); localStorage.removeItem('dag_km_zombi_' + k); kmOyunSahneKurZombi(); await new Promise((r) => setTimeout(r, 900)); const z = document.getElementById('zb-zemin'); return zbDurum().sahne === sh && z.getContext('2d').getImageData(10, 10, 1, 1).data[3] === 255; }, sh);
      dogrula(ok, sh + ' sahnesi çizilmedi');
      await p.screenshot({ path: 'tests/e2e/_cikti/117-' + sh + '.png' }).catch(() => {});
    }

    // ---- 390 px: panel taşmaz ----
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    await p.click('#zb-gece-btn'); await p.waitForSelector('#zb-kamp');
    const tel = await p.evaluate(() => { const x = document.querySelector('.zb-sahne'), k = document.querySelector('.zb-kamp-kutu').getBoundingClientRect(), s = x.getBoundingClientRect(); return { tas: x.scrollWidth <= x.clientWidth + 1, ic: k.left >= s.left - 1 && k.right <= s.right + 1 }; });
    dogrula(tel.tas && tel.ic, '390 px panel taşıyor: ' + JSON.stringify(tel));
    await p.screenshot({ path: 'tests/e2e/_cikti/117-tel-panel.png' }).catch(() => {});
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kurallar · süper · dev zombi (herkes atınca) · geceler + kamp · 12 saat · panel · sis · koro · yürüyüş · 4 sahne · 390 px');
  } finally {
    await p.evaluate((y) => { try { const k = _kmAktifKonum || 'varsayilan'; localStorage.removeItem('dag_km_zombi_' + k); localStorage.removeItem('dag_km_zombikamp_' + k); if (y) { _kmListe = JSON.parse(y.liste); if (y.ic) localStorage.setItem('dag_km_oyun_icerik', y.ic); } } catch (e) { } }, yedek).catch(() => { });
    await ctx.close();
  }
}
