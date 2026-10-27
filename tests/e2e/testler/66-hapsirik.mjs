// Karışık Sınıf › Oyunlar › 🤧 Hapşırık (2026-10-27) + ⚖️ adil başlangıç.
// Tema seçiciden açılır, dosya tembel yüklenir, sahne çizilir; dock'tan girilen seri GERÇEK kayda yazılır ve yaratığı
// gıdıklar (gizli puan gizli yere gider), gıdık dolunca hapşırır → sıradaki (FARKLI) yaratık gelir; geri al durumu
// geri yükler; 4 yaratığın hepsi çizilir. Adil başlangıç: hiç ilk başlamamış sporcu başlar, aynı gün tekrar açınca
// sıra yerinde kalır; Ok Partisi/Kelime takım yardımcısı ilk başlayanı seçer.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    // temiz durum: oyun durumu + adil başlangıç kaydı
    const n = await p.evaluate(() => {
      const kn = _kmAktifKonum || 'varsayilan';
      localStorage.removeItem('dag_km_hapsirik_' + kn); localStorage.removeItem('dag_km_ilkbaslayan_' + kn); localStorage.removeItem('dagsk_km_sirada_' + kn);
      _kmOyunRosterCache.forEach((s) => { const sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (sp) sp.devamModu = true; });
      return _kmOyunRosterCache.length;
    });
    dogrula(n >= 2, 'testte en az 2 sporcu gerekli (gelen ' + n + ')');
    // ⚖️ adil başlangıç: X'in daha önce ilk başladığını kaydet → Hapşırık X'ten başlamamalı
    const adil = await p.evaluate(() => {
      const kn = _kmAktifKonum || 'varsayilan', ilk = _kmOyunRosterCache[0];
      const t = {}; t[ilk.g + '|' + ilk.ad] = Date.now() - 86400000;
      localStorage.setItem('dag_km_ilkbaslayan_' + kn, JSON.stringify({ t: t, oyun: {} }));
      _kmOyunAktifIndex = 0; kmOyunTemaSec('hapsirik');
      return { i: _kmOyunAktifIndex, ad: _kmOyunRosterCache[_kmOyunAktifIndex].ad, ilk: ilk.ad };
    });
    dogrula(adil.i !== 0, `adil başlangıç: daha önce ilk başlayan ${adil.ilk} yine başladı`);
    await p.waitForFunction(() => !!document.getElementById('hps-svg'), null, { timeout: 30000 });
    // aynı gün tekrar açınca sıra zıplamaz
    const ayni = await p.evaluate(() => { _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; const once = _kmOyunAktifIndex; kmOyunTemaSec('zirve'); kmOyunTemaSec('hapsirik'); return { once, sonra: _kmOyunAktifIndex }; });
    esit(ayni.sonra, ayni.once, 'aynı gün tema tekrar açılınca sıra başa zıpladı');
    // seri → gerçek kayıt + gıdık
    const seri = async (oklar) => p.evaluate(async (oklar) => {
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      const st = JSON.parse(localStorage.getItem('dag_km_hapsirik_' + (_kmAktifKonum || 'varsayilan')));
      return { ad: s.ad, once, sonra: (sp.seriler || []).length, st, sira: _kmOyunAktifIndex, i };
    }, oklar);
    const r1 = await seri(['10', '7', '5']);
    esit(r1.sonra, r1.once + 1, 'seri gerçek kayda yazılmadı');
    dogrula(r1.st.gidik > 0, 'gıdık artmadı');
    dogrula(r1.sira !== r1.i, 'sıra sonraki sporcuya geçmedi');
    // gizli puan → gizli nokta bulunur
    const gizliDeger = r1.st.gizli.deger;
    const r2 = await seri([String(gizliDeger), 'M', 'M']);
    dogrula(!!r2.st.bulan, 'gizli puan (' + gizliDeger + ') gizli noktayı bulmadı');
    await p.waitForTimeout(3000);
    dogrula(await p.evaluate(() => /= /.test(document.getElementById('hps-gizli-cip').textContent)), 'gizli nokta çipi güncellenmedi');
    // geri al → önceki durum
    const geri = await p.evaluate(() => { const once = _kmOyunSonGiris && _kmOyunSonGiris.hapsirik; window.confirm = () => true; kmOyunSonGirisiGeriAl(); const st = JSON.parse(localStorage.getItem('dag_km_hapsirik_' + (_kmAktifKonum || 'varsayilan'))); return { var: !!once, bulan: st.bulan, gidik: st.gidik, onceGidik: once && once.gidik }; });
    dogrula(geri.var, 'geri al için Hapşırık kopyası alınmadı');
    esit(geri.bulan, null, 'geri al gizli noktayı geri almadı'); esit(geri.gidik, geri.onceGidik, 'geri al gıdığı geri almadı');
    // hapşırık: gerekeni küçült, sahte hapşırığı kullanılmış say → bir seride hapşırsın, sıradaki farklı yaratık
    const tip0 = await p.evaluate(() => { const k = 'dag_km_hapsirik_' + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); st.gerekli = 20; st.sahte = true; localStorage.setItem(k, JSON.stringify(st)); kmOyunSahneKurHapsirik(); return st.tip; });
    await p.waitForTimeout(500);
    const r3 = await seri(['10', '10', '10']);
    esit(r3.st.hapsirtanlar.length, 1, 'hapşırık kaydedilmedi');
    dogrula(r3.st.tip !== tip0, 'sıradaki yaratık aynı tip geldi (' + tip0 + ')');
    esit(r3.st.no, 1, 'yaratık numarası');
    await p.waitForTimeout(7000);
    dogrula(await p.evaluate(() => /Hapşırtan/.test(document.getElementById('hps-dev').textContent)), 'kahraman anı (Hapşırtan) gösterilmedi');
    const rozet = await p.evaluate((ad) => { const s = _kmOyunRosterCache.find((x) => x.ad === ad); const sp = turnuvaDB[s.g][s.ad]; return sp.oyun && sp.oyun.hapsirik && sp.oyun.hapsirik.hapsirtti; }, r3.ad);
    dogrula(rozet >= 1, 'hapşırtan rozeti yazılmadı');
    // 12 yaratığın hepsi çizilir (farklı gövdeler)
    const yar = await p.evaluate(async () => {
      const k = 'dag_km_hapsirik_' + (_kmAktifKonum || 'varsayilan'), sonuc = {};
      for (const tip of Object.keys(hpsYaratiklar)) {
        const st = JSON.parse(localStorage.getItem(k)); st.tip = tip; st.gizli = { yer: hpsYaratiklar[tip].gizliler[0].yer, deger: 7 }; localStorage.setItem(k, JSON.stringify(st));
        hpsGeriYukle(st); await new Promise((r) => setTimeout(r, 200));
        sonuc[tip] = ['hps-bas', 'hps-burun', 'hps-ayak', 'hps-kuyruk', 'hps-agiz', 'hps-h-burun', 'hps-h-' + st.gizli.yer].every((id) => !!document.getElementById(id)) && document.getElementById('km-oyun-panel-hapsirik').dataset.tip === tip;
      }
      return sonuc;
    });
    esit(Object.keys(yar).length, 12, 'yaratık sayısı');
    dogrula(Object.values(yar).every(Boolean), 'eksik çizilen yaratık: ' + JSON.stringify(yar));
    // ⚖️ takım yardımcısı (Ok Partisi / Kelime Hedefi): en uzun süredir ilk başlamamış sporcunun takımı başlar
    const tk = await p.evaluate(() => {
      const kn = _kmAktifKonum || 'varsayilan', L = _kmOyunRosterCache.slice(0, 4).map((s) => ({ g: s.g, ad: s.ad })); if (L.length < 2) return { atla: true };
      const t = {}; L.forEach((s, i) => { if (i !== 1) t[s.g + '|' + s.ad] = Date.now() - 5000; }); // L[1] hiç ilk başlamadı
      localStorage.setItem('dag_km_ilkbaslayan_' + kn, JSON.stringify({ t: t, oyun: {} }));
      const a = kmAdilTakimBaslangic([{ uyeler: [L[0]] }, { uyeler: [L[1]] }]);
      return { sira: a.sira };
    });
    if (!tk.atla) esit(tk.sira, 1, 'takım başlangıcı: hiç ilk başlamamış sporcunun takımı başlamadı');
    // 👆 çocuğun karakterine dokununca sıra ona geçer (gerçek tıklama — üstteki katmanlar engellemesin)
    await p.evaluate(() => { _kmOyunAktifIndex = 0; kmOyunSahneKurHapsirik(); }); await p.waitForTimeout(600);
    const kb = await p.locator('#hps-c1 .hps-ci').boundingBox(); await p.mouse.click(kb.x + kb.width / 2, kb.y + kb.height / 2); await p.waitForTimeout(300); // karakterler hafif sallandığı için locator.click 'stabil' beklerdi
    const sec = await p.evaluate(() => ({ i: _kmOyunAktifIndex, halka: document.querySelector('#hps-c1 .hps-halka').getAttribute('opacity') }));
    esit(sec.i, 1, 'karaktere tıklayınca sıra o sporcuya geçmedi'); esit(sec.halka, '1', 'seçilen çocuğun halkası yanmadı');
    // ⚙️ Oyun Ayarları › Hapşırık seviyesi: Çok zor (2 seri/kişi) gereken gıdığı ikiye katlar, sahnedekine hemen uygulanır
    const sv = await p.evaluate(() => {
      const k = 'dag_km_hapsirik_' + (_kmAktifKonum || 'varsayilan'), oku = () => JSON.parse(localStorage.getItem(k));
      const yedek = localStorage.getItem('dag_km_oyun_ayar');
      kmOyunAyarAc(); const satir = /Hapşırık seviyesi/.test(document.getElementById('km-oyun-ayar-modal').textContent); kmOyunAyarKapat();
      kmOyunAyarKaydet({ mod: 'standart', ozel: {} }); const std = oku().gerekli;
      kmOyunAyarKaydet({ mod: 'ozel', ozel: { hapsirikSeri: 2 } }); const zor = oku();
      kmOyunAyarKaydet({ mod: 'ozel', ozel: { hapsirikSeri: 0.5 } }); const kolay = oku().gerekli;
      if (yedek) localStorage.setItem('dag_km_oyun_ayar', yedek); else localStorage.removeItem('dag_km_oyun_ayar'); kmOyunAyarKaydet(kmOyunAyarHam());
      return { satir, std, zor: zor.gerekli, kolay, oran: zor.gidik / zor.gerekli };
    });
    dogrula(sv.satir, 'Oyun Ayarları\'nda Hapşırık seviyesi satırı yok');
    dogrula(Math.abs(sv.zor / sv.std - 2) < 0.05, `Çok zor gereken gıdığı 2 katına çıkarmadı (${sv.std} → ${sv.zor})`);
    dogrula(sv.kolay < sv.std, `Çok kolay gereken gıdığı düşürmedi (${sv.std} → ${sv.kolay})`);
    dogrula(sv.oran < 1, 'seviye değişince yaratık doldu sayıldı');
    // telefon genişliğinde taşma yok
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px genişlikte yatay taşma');
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
    log(`başlayan ${adil.ad} (ilk sıradaki ${adil.ilk} değil) · gizli ${gizliDeger} bulundu · ${tip0} hapşırdı → ${r3.st.tip}`);
  } finally { await ctx.close(); }
}
