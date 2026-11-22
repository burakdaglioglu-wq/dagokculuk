// 🕵️ Dedektif Okçular 2.0 (v446, 2026-11-23; kullanıcı: "dedektif popüler ve mükemmel oldu ama hep aynı dizilimde gidiyor" →
// fikir sayfasından 1 zarflar + 2 olay yeri/dizilim + 3 hırsızın hamlesi + 7 kovalamaca + 8 Gölge Tilki haritası; ayrıca
// "sporcu seçme işini kolaylaştır, kim atıyor görmekte zor" + "rozet gibi attığı puana göre").
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const KON = "(_kmAktifKonum || 'varsayilan')";
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.evaluate(() => {
      ['dag_km_dedektif_', 'dag_km_ddkkalici_'].forEach((a) => localStorage.removeItem(a + (_kmAktifKonum || 'varsayilan')));
      const hepsi = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) hepsi.push({ g, ad }); }));
      _kmListe = hepsi.slice(0, 24); kmOyunRosterYenile(); _kmOyunRosterCache.forEach((s) => { turnuvaDB[s.g][s.ad].devamModu = true; });
      kmOyunTemaSec('dedektif');
    });
    await p.waitForFunction(() => !!document.getElementById('ddk-cv') && !document.getElementById('ddk-perde').hidden, null, { timeout: 30000 });
    const oku = () => p.evaluate((k) => JSON.parse(localStorage.getItem('dag_km_dedektif_' + eval(k))), KON);
    const kal = () => p.evaluate((k) => JSON.parse(localStorage.getItem('dag_km_ddkkalici_' + eval(k)) || 'null'), KON);
    const yaz = (fn) => p.evaluate(([k, fn]) => { const a = 'dag_km_dedektif_' + eval(k), st = JSON.parse(localStorage.getItem(a)); (new Function('st', fn))(st); localStorage.setItem(a, JSON.stringify(st)); ddkGuncelle(); }, [KON, fn]);
    const seri = (i, oklar) => p.evaluate(async ([i, oklar]) => { _kmOyunAktifIndex = i % _kmOyunRosterCache.length; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); } }, [i, oklar]);

    // 1 💌 zarflar: 3 farklı vaka, mümkünse 3 farklı olay yeri; seri girilirse ok bir zarf açar
    let st = await oku(); esit(st.faz, 'zarf', 'zarf ekranı'); esit(new Set(st.zarflar).size, 3, '3 farklı vaka');
    const yerler = await p.evaluate((z) => z.map((id) => document.querySelector('.ddk-zarflar [data-v="' + id + '"] .z-yer').textContent), st.zarflar); esit(yerler.length, 3, 'zarflarda yer adı');
    await seri(0, ['3', '2', '1']); await p.waitForTimeout(800);
    st = await oku(); esit(st.faz, 'oyun', 'seri bir zarfı açıp soruşturmayı başlatmalı'); dogrula(st.zarflar.indexOf(st.vid) !== -1, 'açılan vaka zarflardan biri olmalı');
    dogrula(!!st.sahne, 'olay yeri olmalı');

    // 2 🏛️ dizilim: her olay yerinde şüpheliler farklı yerde durur
    const dizilim = await p.evaluate(() => ['karakol', 'kale', 'pastane', 'muze'].map((sa) => { const st = { sahne: sa, n: 6 }; return [0, 1, 2, 3, 4, 5].map((i) => { const pt = window.ddkPozTest ? ddkPozTest(st, i) : null; return pt && Math.round(pt.ayak); }).join(','); }));
    esit(new Set(dizilim).size, 4, '4 olay yerinde 4 farklı dizilim: ' + dizilim.join(' | '));

    // ŞİMDİ ATIYOR kartı + kolay seçim (2 dokunuş)
    await p.evaluate(() => { _kmOyunAktifIndex = 1; ddkGuncelle(); }); await p.waitForTimeout(400);
    const ad1 = await p.evaluate(() => kmOyunIlkAd(_kmOyunRosterCache[1].ad));
    esit(await p.evaluate(() => document.querySelector('#ddk-kim .ddk-kim-ad b').textContent), ad1, 'kartta atan çocuğun adı');
    esit(await p.locator('#ddk-kim .ddk-sonra-k').count(), 2, 'sonra gelen 2 kişi');
    await p.click('#ddk-kim-btn'); await p.waitForTimeout(300);
    esit(await p.locator('.ddk-yuzler button').count(), 24, 'seçim ekranında 24 yüz');
    dogrula(await p.evaluate(() => document.querySelector('.ddk-yuzler button').classList.contains('atti') === false), 'atmayanlar önce');
    await p.locator('.ddk-yuzler button[data-j="7"]').click(); await p.waitForTimeout(300);
    esit(await p.evaluate(() => _kmOyunAktifIndex), 7, 'yüze dokununca o çocuk seçilmeli');
    dogrula(await p.evaluate(() => document.getElementById('ddk-perde').hidden), 'seçimden sonra ekran kapanmalı');
    await p.locator('#ddk-kim .ddk-sonra-k').first().click(); await p.waitForTimeout(200);
    esit(await p.evaluate(() => _kmOyunAktifIndex), 8, 'SONRA dokununca o seçilmeli');

    // 🏅 rozetler (puana göre) + rütbe
    await seri(2, ['10', '9', '8']); await p.waitForTimeout(1500);
    st = await oku(); let K = await kal();
    const k2 = await p.evaluate(() => _kmOyunRosterCache[2].g + '|' + _kmOyunRosterCache[2].ad);
    dogrula(st.vakaRozet[k2].includes('altin') && st.vakaRozet[k2].includes('uclu') && st.vakaRozet[k2].includes('iz'), 'altın + üçü de + iz rozeti: ' + JSON.stringify(st.vakaRozet[k2]));
    esit(K.ipucu[k2], Math.min(3, st.v.ipucu.length), 'açılan ipucu sayısı kalıcı (rütbe)');
    await seri(2, ['8', '1', '1']); await p.waitForTimeout(800); await seri(2, ['9', '9', '7']); await p.waitForTimeout(800);
    dogrula((await oku()).vakaRozet[k2].includes('gelisen'), 'önceki serisinden 3+ iyi → Gelişen');

    // 3 🦊 hırsızın hamlesi: yer değiştirince hırsız aynı kişi (numara) kalır
    st = await oku(); const hNo = st.v.s[st.v.h].no, isaret = st.v.s.map((o, i) => o.no + ':' + st.x[i] + st.masum[i]).sort().join();
    await yaz("st.saat = 1; st.olaylar = [{ s: 2, tip: 'yer' }];");
    await seri(3, ['1', '1', '1']); await p.waitForTimeout(1500);
    st = await oku(); esit(st.v.s[st.v.h].no, hNo, 'yer değişince hırsız aynı kalmalı'); esit(st.v.s.map((o, i) => o.no + ':' + st.x[i] + st.masum[i]).sort().join(), isaret, 'çizgiler/masumlar şüpheliyle birlikte gitmeli');
    // karanlık: ilk iyi ok ışığı yakar, ipucu açmaz
    await yaz("st.karanlik = true;"); st = await oku(); const acik0 = st.acik;
    await seri(4, ['9', '9', '2']); await p.waitForTimeout(1500);
    st = await oku(); esit(st.karanlik, false, 'iyi ok ışığı yakmalı'); esit(st.acik, Math.min(st.v.ipucu.length, acik0 + 1), 'ikinci iyi ok ipucu açmalı, ilki ışığa gitti');
    // rüzgâr: bir ipucu kartını uçurur
    await yaz("st.saat = 4; st.olaylar = [{ s: 5, tip: 'ruzgar' }];"); st = await oku(); const acik1 = st.acik;
    await seri(5, ['1', '1', '1']); await p.waitForTimeout(1200);
    esit((await oku()).acik, acik1 - 1, 'rüzgâr bir kartı kapatmalı');

    // 7 🏃 kovalamaca: doğru suçla → kovala; hırsız kaçarsa parça yok, yakalarsak parça
    await yaz("st.saat = 0;"); st = await oku();
    await p.click('#ddk-sucla-btn'); { const xy = await p.evaluate((h) => ddkSupheliNokta(h), st.v.h); await p.mouse.click(xy.x, xy.y); }
    await p.waitForSelector('#ddk-evet'); await p.click('#ddk-evet'); await p.waitForTimeout(3300);
    st = await oku(); esit(st.faz, 'kovala', 'kovalamaca başlamalı'); esit(st.kov.d, 0, 'dedektif başta'); esit(st.kov.h, 3, 'Normal: hırsız 3 önde');
    dogrula(await p.evaluate(() => !document.getElementById('ddk-kim').hidden), 'kovalarken de ŞİMDİ ATIYOR kartı');
    await seri(6, ['9', '2', '2']); await p.waitForTimeout(2000);
    st = await oku(); esit(st.kov.d, 1, 'iyi ok bir atlayış'); esit(st.kov.h, 4, 'seri sonunda hırsız bir kaçar');
    for (let k = 0; k < 3; k++) { await seri(7 + k, ['1', '1', '1']); await p.waitForTimeout(1300); }
    await p.waitForTimeout(2200);
    st = await oku(); K = await kal(); esit(st.faz, 'cozuldu', 'hırsız sona varınca kaçmalı'); esit(st.parcaKazandi, false, 'kaçınca parça yok'); esit(K.parca || 0, 0, 'harita boş');
    dogrula(await p.evaluate(() => /kaçtı/.test(document.getElementById('ddk-perde').textContent)), 'kaçtı kartı');
    await p.click('#ddk-dev'); await p.waitForTimeout(300); esit((await oku()).faz, 'zarf', 'sıradaki zarflar');

    // 8 🦊 harita: 4 parça varken yakala → 5 → Gölge Tilki vakası → yakala → final, yeni sezon
    await p.evaluate((k) => { const a = 'dag_km_ddkkalici_' + eval(k), K = JSON.parse(localStorage.getItem(a)); K.parca = 4; localStorage.setItem(a, JSON.stringify(K)); }, KON);
    await p.locator('.ddk-zarflar button').first().click(); await p.waitForTimeout(300);
    await yaz("st.faz = 'kovala'; st.kov = { tip: 'cati', L: 7, d: 0, h: 1, her: 1, sayac: 0 };");
    await seri(10, ['9', '1', '1']); await p.waitForTimeout(3000);
    st = await oku(); K = await kal(); esit(st.faz, 'cozuldu', 'yakaladık'); esit(K.parca, 5, 'harita 5/5');
    dogrula(await p.evaluate(() => /Gölge Tilki vakası/.test(document.getElementById('ddk-perde').textContent)), 'Tilki düğmesi');
    await p.click('#ddk-dev'); await p.waitForTimeout(300);
    st = await oku(); esit(st.vid, 'tilki', 'Gölge Tilki vakası'); esit(st.faz, 'basla', 'Tilki kartı'); esit(st.n, 6, 'Tilki 6 şüpheli');
    await p.click('#ddk-bas'); await p.waitForTimeout(200);
    await yaz("st.faz = 'kovala'; st.kov = { tip: 'cati', L: 8, d: 0, h: 1, her: 1, sayac: 0 };");
    await seri(11, ['9', '1', '1']); await p.waitForTimeout(3000);
    st = await oku(); K = await kal(); esit(st.faz, 'final', 'Tilki yakalanınca final'); esit(K.parca, 0, 'harita sıfırlanır'); esit(K.sezon, 2, 'yeni sezon');
    dogrula(await p.evaluate(() => /GÖLGE TİLKİ YAKALANDI/.test(document.getElementById('ddk-perde').textContent)), 'final kartı');
    // kalıcı kayıt günlük durumdan ayrı ve 12 saat sıfırlamasında silinmez
    dogrula(await p.evaluate(() => typeof KM_OYUN_SIFIR_ONEK === 'undefined' || !KM_OYUN_SIFIR_ONEK.some((o) => 'dag_km_ddkkalici_x'.indexOf(o) === 0 && o !== 'dag_km_')), 'kalıcı anahtar sıfırlama listesinde olmamalı');
    // geri al kalıcıyı da geri alır
    await p.click('#ddk-yeni'); await p.waitForTimeout(300);
    await p.locator('.ddk-zarflar button').first().click(); await p.click('#ddk-bas'); await p.waitForTimeout(200);
    const once = JSON.stringify((await kal()).ipucu);
    await seri(12, ['9', '9', '9']); await p.waitForTimeout(1500);
    await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); }); await p.waitForTimeout(600);
    esit(JSON.stringify((await kal()).ipucu), once, 'geri al rütbe sayacını da geri almalı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('zarflar · 4 dizilim · ŞİMDİ ATIYOR kartı + 2 dokunuşla seçim · rozetler/rütbe · yer değiştirme/karanlık/rüzgâr · kovalamaca kaç/yakala · harita → Gölge Tilki → sezon · geri al');
  } finally { await ctx.close(); }
}
