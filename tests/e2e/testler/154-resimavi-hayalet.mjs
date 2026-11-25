// 🖼️ Resim Avı + 👻 Hayalet Avcıları (v447, 2026-11-23; kullanıcı 6 fikirden bu ikisini seçti). 24 sporcu, 1366×768.
// Resim Avı: okun yönündeki kare açılır · 10/X üç kare · yanlış tahmin can götürür · 3 yanlış = kayboldu · doğru = yıldız · mürekkep · albüm sonu · geri al.
// Hayalet: eşya seçimi · iyi ok yakalar · zayıf ok kaçırır · boş → yandaki tıkırtı / yandakiler de boş · kaçtığı yer görünür, fener izler · gizli kıpırdama yok · oda temiz · gece yarısı · Hayalet Kral 3 kez · sezon.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const KON = "(_kmAktifKonum || 'varsayilan')";
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    const kur = (t) => p.evaluate((t) => {
      ['dag_km_resimavi_', 'dag_km_rsmkalici_', 'dag_km_hayalet_', 'dag_km_hylkalici_'].forEach((a) => localStorage.removeItem(a + (_kmAktifKonum || 'varsayilan')));
      const hepsi = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) hepsi.push({ g, ad }); }));
      _kmListe = hepsi.slice(0, 24); kmOyunRosterYenile(); _kmOyunRosterCache.forEach((s) => { turnuvaDB[s.g][s.ad].devamModu = true; });
      kmOyunTemaSec(t);
    }, t);
    const oku = (a) => p.evaluate(([a, k]) => JSON.parse(localStorage.getItem(a + eval(k)) || 'null'), [a, KON]);
    const yaz = (a, fn, gfn) => p.evaluate(([a, k, fn, gfn]) => { const key = a + eval(k), st = JSON.parse(localStorage.getItem(key)); (new Function('st', fn))(st); localStorage.setItem(key, JSON.stringify(st)); window[gfn](); }, [a, KON, fn, gfn]);
    const seri = (i, oklar, kon) => p.evaluate(async ([i, oklar, kon]) => { _kmOyunAktifIndex = i % _kmOyunRosterCache.length; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = kon || []; kmOyunIlerlet(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); } }, [i, oklar, kon]);

    /* ---------------- RESİM AVI ---------------- */
    const R = 'dag_km_resimavi_', RK = 'dag_km_rsmkalici_';
    await kur('resimavi');
    await p.waitForFunction(() => !!document.getElementById('rsm-sahne') && !document.getElementById('rsm-perde').hidden, null, { timeout: 30000 });
    let st = await oku(R); esit(st.faz, 'basla', 'resim kartı'); esit(st.N, 4, 'Normal 4×4'); esit(st.secenek.length, 4, '4 şık'); esit(st.can, 3, '3 can');
    await p.click('#rsm-bas'); await p.waitForTimeout(300);
    // okun yönü: sağ üst (x>0, y<0), kırmızı → sağ üst çeyrekte bir kare
    await seri(0, ['7', '2', '1'], [{ x: 40, y: -40, tip: '10ring' }, null, null]); await p.waitForTimeout(1200);
    st = await oku(R); const acik1 = st.kare.map((v, i) => v ? i : -1).filter((i) => i >= 0);
    esit(acik1.length, 1, 'bir iyi ok bir kare'); dogrula(acik1[0] % 4 >= 2 && Math.floor(acik1[0] / 4) <= 1, 'sağ üst kare açılmalı, açılan: ' + acik1[0]);
    // sarı ortadan
    const orta = await p.evaluate(() => rsmKareSecTest({ N: 4, kare: Array(16).fill(0) }, { p: 10, x: 2, y: 2 })); dogrula([5, 6, 9, 10].includes(orta), 'sarı orta kareyi açmalı: ' + orta);
    // 10 → 3 kare
    await seri(1, ['X', '1', '1'], [{ x: -50, y: 50, tip: '10ring' }]); await p.waitForTimeout(1200);
    st = await oku(R); esit(st.kare.filter(Boolean).length, 4, 'X kare + 2 komşu');
    // mürekkep: 3. seride bir açık kare kapanır (Normal, ≥3 açık)
    await seri(2, ['1', '1', '1']); await p.waitForTimeout(1200);
    st = await oku(R); esit(st.kare.filter(Boolean).length, 3, 'mürekkep bir kareyi kapatmalı'); esit(st.seri, 3, '3 seri');
    // ŞİMDİ ATIYOR kartı + seçim
    dogrula(await p.evaluate(() => !document.getElementById('rsm-kim').hidden), 'ŞİMDİ ATIYOR kartı');
    await p.click('#rsm-kim .kk-ana'); await p.waitForTimeout(300); esit(await p.locator('.kk-yuzler button').count(), 24, '24 yüz');
    await p.locator('.kk-yuzler button[data-j="9"]').click(); await p.waitForTimeout(300); esit(await p.evaluate(() => _kmOyunAktifIndex), 9, 'yüz seçimi');
    // yanlış tahmin → can
    const cevap = await p.evaluate(() => { const st = JSON.parse(localStorage.getItem('dag_km_resimavi_' + (_kmAktifKonum || 'varsayilan'))); return document.getElementById('rsm-emoji').textContent; });
    const dogruAd = await p.evaluate(([k]) => { const st = JSON.parse(localStorage.getItem('dag_km_resimavi_' + eval(k))); return st.secenek; }, [KON]);
    const yanlislar = await p.evaluate(() => [...document.querySelectorAll('#rsm-sik [data-s]')].map((b) => b.textContent));
    // doğru şıkkı resim kimliğinden bul (sayfadaki albüm verisi gizli → yanlışları teker teker dene)
    let kayip = 0, bildi = false;
    for (let k = 0; k < 4 && !bildi; k++) {
      const once = await oku(R); const b = p.locator('#rsm-sik [data-s]:not(.elendi)').first(); await b.click(); await p.waitForTimeout(400);
      const sonra2 = await oku(R); if (sonra2.faz === 'bildi') bildi = true; else if (sonra2.can < once.can) kayip++; if (sonra2.faz === 'kacti') break;
    }
    st = await oku(R);
    if (bildi) { dogrula(st.yildiz >= 1 && st.yildiz <= 3, 'yıldız 1–3'); dogrula(kayip <= 2, 'en fazla 2 can gitmeli'); }
    else { esit(st.faz, 'kacti', '3 yanlış → kayboldu'); esit(kayip, 3, '3 can gitti'); }
    await p.waitForTimeout(2000);
    dogrula(await p.evaluate(() => !document.getElementById('rsm-perde').hidden), 'sonuç kartı');
    let K = await oku(RK); esit(K.oynanan.length, 1, 'resim albüme işlendi');
    // albüm sonu: 5 oynanmış varken bitir → albüm kartı, yeni albüm
    await p.click('#rsm-dev'); await p.waitForTimeout(300);
    await p.evaluate(([k]) => { const a = 'dag_km_rsmkalici_' + eval(k), K = JSON.parse(localStorage.getItem(a)); const su = JSON.parse(localStorage.getItem('dag_km_resimavi_' + eval(k))).ri; K.sira.forEach((i) => { const id = K.album + ':' + i; if (i !== su && K.oynanan.length < 5 && K.oynanan.indexOf(id) === -1) { K.oynanan.push(id); K.yildiz[id] = 2; } }); localStorage.setItem(a, JSON.stringify(K)); }, [KON]);
    await yaz(R, "st.faz = 'oyun';", 'rsmGuncelle'); await p.waitForTimeout(300);
    for (let k = 0; k < 4; k++) { const s2 = await oku(R); if (s2.faz !== 'oyun') break; await p.locator('#rsm-sik [data-s]:not(.elendi)').first().click(); await p.waitForTimeout(350); }
    await p.waitForTimeout(2000); await p.click('#rsm-dev'); await p.waitForTimeout(500);
    st = await oku(R); K = await oku(RK); esit(st.faz, 'album', 'albüm sonu kartı'); esit(K.album, 'masal', 'sıradaki albüm'); esit(K.oynanan.length, 0, 'yeni albüm boş');
    dogrula(await p.evaluate(() => document.querySelectorAll('.rsm-album > div').length === 6), 'albümde 6 resim');
    await p.click('#rsm-dev'); await p.waitForTimeout(300); esit((await oku(R)).faz, 'basla', 'yeni albümün ilk resmi');
    // geri al
    await p.click('#rsm-bas'); await p.waitForTimeout(200);
    const k0 = JSON.stringify((await oku(RK)).acilan);
    await seri(3, ['9', '9', '9']); await p.waitForTimeout(1200);
    await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); }); await p.waitForTimeout(500);
    esit((await oku(R)).kare.filter(Boolean).length, 0, 'geri al kareleri kapatmalı'); esit(JSON.stringify((await oku(RK)).acilan), k0, 'geri al rütbe sayacını da');

    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('Resim Avı: yön → kare, X üç kare, mürekkep, tahmin/can/yıldız, albüm, geri al · ŞİMDİ ATIYOR + yüz seçimi');
  } finally { await ctx.close(); }
}
