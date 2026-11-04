// Karışık Sınıf › Oyunlar › 🛰️ Son Üs (2026-11-05, v379). Hikâye ekranı, gerçek seri + hasar, gizli görev yalnız düğmeyle görünür ve yapılınca kalkan +1, 5. seride saldırı,
// herkes atmadan bölüm bitmez + "Hep birlikte bitir", finalde herkesin adı, sınıf kararı sonraki bölümü ve "Geçen ders" yazısını değiştirir, hikâye 12 saat kuralıyla sıfırlanmaz,
// gün değişince yarım savaş sıfırlanır, geri al, 24 çocuk ve 390 px'te yana taşma yok.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const n = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 3); localStorage.removeItem('dag_km_sonus_' + (_kmAktifKonum || 'varsayilan')); kmOyunTemaSec('sonus'); return _kmListe.length;
    });
    dogrula(n >= 2, 'en az 2 sporcu gerekli');
    await p.waitForSelector('#su-basla', { timeout: 30000 });
    const kur = await p.evaluate(() => ({ tema: KM_OYUN_TEMALAR.sonus && KM_OYUN_TEMALAR.sonus.ad, sifir: KM_OYUN_SIFIR_ONEK.includes('dag_km_sonus_'), icerik: !!KM_OYUN_ICERIK.sonus, oner: KM_DA_OYUN.kucuk[0] }));
    esit(kur.tema, 'Son Üs', 'tema'); esit(kur.sifir, false, 'hikâye 12 saat kuralıyla silinmemeli'); dogrula(kur.icerik, 'içerik anahtarı'); esit(kur.oner, 'sonus', '8 yaş önerisi');
    dogrula((await p.locator('#su-icerik').innerText()).toLocaleLowerCase('tr-TR').includes('paslı sürü'), 'ilk düşman yok');
    await p.click('#su-basla');
    await p.waitForSelector('#su-dusman-ad');
    esit(await p.locator('#km-oyun-rightpanel').isVisible().catch(() => false), false, 'puan sıralaması görünmemeli');
    dogrula(await p.locator('#su-sira').isVisible(), 'sıradaki çocuk görünmeli');

    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
      for (let j = 0; j < _kmOyunRosterCache.length && !(turnuvaDB[_kmOyunRosterCache[_kmOyunAktifIndex].g] || {})[_kmOyunRosterCache[_kmOyunAktifIndex].ad]; j++) _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length;
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120)); }
      return { key: s.g + '|' + s.ad, once, sonra: (sp.seriler || []).length, st: JSON.parse(JSON.stringify(suDurum())) };
    }, [oklar, hedef]);

    // gizli görev: varsayılan görünmez, düğmeyle görünür, gizlenir
    dogrula(await p.locator('#su-gorev').count() === 0, 'görev kendiliğinden görünmemeli');
    await p.click('#su-gorev-ac'); dogrula(await p.locator('#su-gorev').isVisible(), 'görev açılmadı');
    await p.click('#su-gorev-kapat'); esit(await p.locator('#su-gorev').count(), 0, 'görev gizlenmedi');
    const k0 = await p.evaluate(() => suDurum().kalkan), c0 = await p.evaluate(() => suDurum().can);
    const r1 = await seri(['X', '9', '7']); // 4 + 3 + 2; her seviyedeki her görevi yapar
    esit(r1.sonra, r1.once + 1, 'seri gerçek kayda yazılmadı');
    esit(c0 - r1.st.can, 9, 'hasar X 4 + 9 3 + 7 2');
    esit(r1.st.gorevOk[r1.key], 1, 'görev işaretlenmedi'); esit(r1.st.kalkan, k0 + 1, 'görev kalkan vermedi');
    // saf görev kontrolleri
    const g = await p.evaluate(() => { const G = _suIc.GOREVLER, f = (lv, id) => G[lv].find((x) => x.id === id).ok; return [f('yeni', 'hepsi')([1, 2, 3]), f('yeni', 'hepsi')([0, 9, 9]), f('orta', 'mavi2')([5, 5, 0]), f('orta', 'mavi2')([5, 4, 0]), f('iyi', 'sari1')([9, 0, 0]), f('iyi', 'sari1')([8, 8, 8]), _suIc.seviyeOf(4), _suIc.seviyeOf(6), _suIc.seviyeOf(8)]; });
    esit(JSON.stringify(g), JSON.stringify([true, false, true, false, true, false, 'yeni', 'orta', 'iyi']), 'görev kontrolleri');
    // saldırı: 5. seride kalkan -1
    await p.evaluate(() => { const st = suDurum(); st.seri = 4; localStorage.setItem('dag_km_sonus_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); });
    const ks = await p.evaluate(() => suDurum().kalkan);
    const r2 = await seri(['M', 'M', 'M']);
    esit(r2.st.kalkan, ks - 1, 'saldırı kalkan düşürmedi');
    // geri al
    const ga = await p.evaluate(() => { window.confirm = () => true; const once = suDurum().kalkan; kmOyunSonGirisiGeriAl(); return { once, sonra: suDurum().kalkan, seri: suDurum().seri }; });
    esit(ga.sonra, ga.once + 1, 'geri al kalkanı geri vermedi');
    // HERKES ATMADAN BİTMEZ
    await p.evaluate(() => { const st = suDurum(); st.can = 1; st.atanlar = {}; st.gorevOk = {}; localStorage.setItem('dag_km_sonus_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); });
    const a = await seri(['10', '10', '10'], 0);
    esit(a.st.faz, 'savas', 'herkes atmadan bölüm bitmemeli'); esit(a.st.can, 0, 'can bitmeli');
    await p.waitForSelector('#su-bitir');
    const kalan = await p.evaluate(() => { const st = suDurum(); return _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad] && !st.atanlar[x.g + '|' + x.ad]) ? j : -1).filter((j) => j >= 0); });
    let son = a; for (const j of kalan) son = await seri(['3', 'M', 'M'], j);
    esit(son.st.faz, 'karar', 'herkes atınca karar ekranı');
    esit((son.st.finalAdlar || []).length, kalan.length + 1, 'finalde herkesin adı');
    await p.waitForSelector('#su-secimler');
    // karar: B kalkan -1, sıradaki düşman zayıf; son ekranı isimleri gösterir
    const kk = son.st.kalkan;
    await p.locator('[data-karar="b"]').click();
    await p.waitForSelector('#su-adlar');
    const s1 = await p.evaluate(() => suDurum());
    esit(s1.kalkan, Math.max(0, kk - 1), 'B kalkan'); esit(s1.zayif, 0.15, 'B zayıflatma'); dogrula(s1.ozetSon.includes('peşine'), 'özet');
    // sıfırlama kuralı: 12 saat sonrası hikâye kalır
    const silindi = await p.evaluate(() => { localStorage.setItem('dag_km_oyun_son_' + (_kmAktifKonum || 'varsayilan'), String(Date.now() - 13 * 3600000)); try { kmOyunBayatSifirla(); } catch (e) { return 'hata:' + e.message; } return localStorage.getItem('dag_km_sonus_' + (_kmAktifKonum || 'varsayilan')) ? 'kaldi' : 'silindi'; });
    esit(silindi, 'kaldi', '12 saat kuralı hikâyeyi sildi');
    // yeni ders: son → sıradaki bölüm, "Geçen ders" yazısı kararı anlatır
    await p.evaluate(() => { const st = suDurum(); st.tarih = '2020-01-01'; localStorage.setItem('dag_km_sonus_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); suGuncelle(); });
    await p.waitForSelector('#su-basla');
    const h = (await p.locator('#su-icerik').innerText()).toLocaleLowerCase('tr-TR');
    dogrula(/geçen ders/i.test(h) && h.includes('peşine') && h.includes('örümcek bot'), 'bölüm 2 geçen ders: ' + h.slice(0, 120));
    esit(await p.evaluate(() => suDurum().bolum), 1, 'bölüm 2 olmalı');
    // zayıf: sıradaki düşman %15 az can
    const can2 = await p.evaluate(() => { suDurum(); document.getElementById('su-basla').click(); const st = suDurum(); return { t: st.toplam, z: st.zayif }; });
    dogrula(can2.t > 0 && can2.z === 0, 'zayıflatma uygulanıp sıfırlanmalı');
    // yarım savaş ertesi derse: ilerleme sıfır, bölüm kalır
    await p.evaluate(() => { const st = suDurum(); st.atanlar = { x: 1 }; st.tarih = '2020-01-01'; localStorage.setItem('dag_km_sonus_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); suGuncelle(); });
    const y = await p.evaluate(() => { const st = suDurum(); return { b: st.bolum, f: st.faz, a: Object.keys(st.atanlar).length }; });
    esit(JSON.stringify(y), JSON.stringify({ b: 1, f: 'hikaye', a: 0 }), 'yarım savaş');
    // dost: A kararı ekibe katar, her bölüm +1 kalkan
    await p.evaluate(() => { const st = suDurum(); st.bolum = 1; st.faz = 'karar'; localStorage.setItem('dag_km_sonus_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); suGuncelle(); });
    await p.locator('[data-karar="a"]').click();
    const kb = await p.evaluate(() => { const st = suDurum(); return { e: st.ekip, k: st.kalkan }; });
    esit(kb.e[0], 'Volt', 'dost'); await p.click('#su-devam');
    const kc = await p.evaluate(() => ({ b: suDurum().bolum, k: suDurum().kalkan }));
    esit(kc.b, 2, '3. bölüm'); esit(kc.k, kb.k + 1, 'dost bölüm başına kalkan');
    // 24 çocuk, telefon genişliği
    await p.setViewportSize({ width: 390, height: 844 });
    const t = await p.evaluate(async () => { const st = suDurum(); st.faz = 'savas'; st.toplam = 50; st.can = 50; localStorage.setItem('dag_km_sonus_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); const c = _kmOyunRosterCache[0]; const yed = _kmOyunRosterCache.slice(); for (let i = 0; i < 24; i++) _kmOyunRosterCache[i] = Object.assign({}, c, { ad: 'UZUN İSİMLİ ÇOCUK ' + i }); suGuncelle(); await new Promise((r) => setTimeout(r, 150)); const x = document.querySelector('.su-sahne'), o = { tas: x.scrollWidth <= x.clientWidth + 1, kid: document.querySelectorAll('.su-kid').length }; _kmOyunRosterCache.length = 0; yed.forEach((v) => _kmOyunRosterCache.push(v)); return o; });
    dogrula(t.tas, '390 px taşıyor'); esit(t.kid, 24, '24 çocuk');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(n + ' çocuk · görev · saldırı · geri al · herkes atmadan bitmez · karar · 12 saat · yeni ders · dost · 24 çocuk 390 px');
  } finally {
    await p.evaluate((y) => { try { localStorage.removeItem('dag_km_sonus_' + (_kmAktifKonum || 'varsayilan')); if (y) _kmListe = JSON.parse(y); } catch (e) { } }, yedek).catch(() => { });
    await ctx.close();
  }
}
