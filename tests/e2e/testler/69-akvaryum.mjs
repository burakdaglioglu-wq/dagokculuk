// Karışık Sınıf › Oyunlar › 🐠 Sınıf Akvaryumu (2026-10-28).
// Tema seçiciden açılır, dosya tembel yüklenir, sahne çizilir; dock'tan girilen seri GERÇEK kayda yazılır ve her ok bir canlı
// ekler (iska yalnız kabarcık, X/10 nadir); doluluk %100'de akvaryum doluyor → tören + sıradaki (FARKLI) akvaryum; geri al
// durumu geri yükler; 5 akvaryumun hepsi çizilir; çocuğa dokununca sıra ona geçer; Oyun Ayarları › Akvaryum seviyesi.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    const n = await p.evaluate(() => {
      const kn = _kmAktifKonum || 'varsayilan';
      localStorage.removeItem('dag_km_akvaryum_' + kn);
      _kmOyunRosterCache.forEach((s) => { const sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (sp) sp.devamModu = true; });
      kmOyunTemaSec('akvaryum');
      return _kmOyunRosterCache.length;
    });
    dogrula(n >= 2, 'testte en az 2 sporcu gerekli (gelen ' + n + ')');
    await p.waitForFunction(() => !!document.getElementById('akv-svg'), null, { timeout: 30000 });
    const anahtar = 'dag_km_akvaryum_';
    const seri = async (oklar) => p.evaluate(async ([oklar, anahtar]) => {
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      const st = JSON.parse(localStorage.getItem(anahtar + (_kmAktifKonum || 'varsayilan')));
      return { ad: s.ad, g: s.g, once, sonra: (sp.seriler || []).length, st, sira: _kmOyunAktifIndex, i, ekran: document.querySelectorAll('#akv-canlilar .akv-canli').length };
    }, [oklar, anahtar]);
    // seri → gerçek kayıt + 2 canlı (iska canlı getirmez)
    const r1 = await seri(['7', '5', 'M']);
    esit(r1.sonra, r1.once + 1, 'seri gerçek kayda yazılmadı');
    esit(r1.st.canlilar.length, 2, 'iki isabet iki canlı getirmeli');
    dogrula(r1.st.dolu > 0, 'akvaryum dolmadı');
    esit(r1.ekran, 2, 'ekrandaki canlı sayısı');
    dogrula(r1.sira !== r1.i, 'sıra sonraki sporcuya geçmedi');
    const canli = await p.evaluate(() => typeof akvSporcuCanli === 'function' ? 1 : 0);
    esit(canli, 1, 'akvSporcuCanli yok');
    // X → nadir canlı + rozet
    const r2 = await seri(['X', '3', '9']);
    esit(r2.st.canlilar.filter((c) => c.n).length, 1, 'X nadir canlı getirmedi');
    const nadirRozet = await p.evaluate(([g, ad]) => { const sp = turnuvaDB[g][ad]; return sp.oyun && sp.oyun.akvaryum && sp.oyun.akvaryum.nadir; }, [r2.g, r2.ad]);
    dogrula(nadirRozet >= 1, 'nadir rozeti yazılmadı');
    await p.waitForTimeout(2600);
    dogrula(await p.evaluate(() => /nadir/.test(document.getElementById('akv-sayi').textContent)), 'HUD nadir sayısını göstermiyor');
    // geri al → önceki durum
    const geri = await p.evaluate((anahtar) => { const once = _kmOyunSonGiris && _kmOyunSonGiris.akvaryum; window.confirm = () => true; kmOyunSonGirisiGeriAl(); const st = JSON.parse(localStorage.getItem(anahtar + (_kmAktifKonum || 'varsayilan'))); return { var: !!once, adet: st.canlilar.length, onceAdet: once && once.canlilar.length }; }, anahtar);
    dogrula(geri.var, 'geri al için Akvaryum kopyası alınmadı');
    esit(geri.adet, geri.onceAdet, 'geri al canlıları geri almadı'); esit(geri.adet, 2, 'geri al sonrası canlı sayısı');
    // dolma: gerekeni küçült → bir seride dolsun, sıradaki farklı akvaryum
    const tip0 = await p.evaluate((anahtar) => { const k = anahtar + (_kmAktifKonum || 'varsayilan'), st = JSON.parse(localStorage.getItem(k)); st.gerekli = 25; localStorage.setItem(k, JSON.stringify(st)); kmOyunSahneKurAkvaryum(); return st.tip; }, anahtar);
    await p.waitForTimeout(500);
    const r3 = await seri(['10', '9', '8']);
    esit(r3.st.dolanlar.length, 1, 'dolan akvaryum kaydedilmedi');
    dogrula(r3.st.tip !== tip0, 'sıradaki akvaryum aynı tip geldi (' + tip0 + ')');
    esit(r3.st.no, 1, 'akvaryum numarası');
    await p.waitForTimeout(3500);
    dogrula(await p.evaluate(() => /Dolduran/.test(document.getElementById('akv-dev').textContent)), 'kahraman anı (Dolduran) gösterilmedi');
    const rozet = await p.evaluate(([g, ad]) => { const sp = turnuvaDB[g][ad]; return sp.oyun && sp.oyun.akvaryum && sp.oyun.akvaryum.doldurdu; }, [r3.g, r3.ad]);
    dogrula(rozet >= 1, 'dolduran rozeti yazılmadı');
    await p.waitForTimeout(8500);
    const yeni = await p.evaluate(() => document.getElementById('km-oyun-panel-akvaryum').dataset.tip);
    esit(yeni, r3.st.tip, 'tören sonrası yeni akvaryum çizilmedi');
    // 5 akvaryumun hepsi çizilir
    const ak = await p.evaluate(async (anahtar) => {
      const k = anahtar + (_kmAktifKonum || 'varsayilan'), sonuc = {};
      for (const tip of Object.keys(akvAkvaryumlar)) {
        const st = JSON.parse(localStorage.getItem(k)); st.tip = tip; akvGeriYukle(st); await new Promise((r) => setTimeout(r, 150));
        sonuc[tip] = !!document.getElementById('akv-dekor') && document.getElementById('akv-dekor').childNodes.length > 0 && document.getElementById('km-oyun-panel-akvaryum').dataset.tip === tip;
      }
      return sonuc;
    }, anahtar);
    esit(Object.keys(ak).length, 5, 'akvaryum sayısı');
    dogrula(Object.values(ak).every(Boolean), 'eksik çizilen akvaryum: ' + JSON.stringify(ak));
    // 👆 çocuğun karakterine dokununca sıra ona geçer
    await p.evaluate(() => { _kmOyunAktifIndex = 0; kmOyunSahneKurAkvaryum(); }); await p.waitForTimeout(600);
    const kb = await p.locator('#akv-c1 .akv-ci').boundingBox(); await p.mouse.click(kb.x + kb.width / 2, kb.y + kb.height / 2); await p.waitForTimeout(300);
    const sec = await p.evaluate(() => ({ i: _kmOyunAktifIndex, halka: document.querySelector('#akv-c1 .akv-halka').getAttribute('opacity') }));
    esit(sec.i, 1, 'karaktere tıklayınca sıra o sporcuya geçmedi'); esit(sec.halka, '1', 'seçilen çocuğun halkası yanmadı');
    // ⚙️ Oyun Ayarları › Akvaryum seviyesi
    const sv = await p.evaluate((anahtar) => {
      const k = anahtar + (_kmAktifKonum || 'varsayilan'), oku = () => JSON.parse(localStorage.getItem(k));
      const yedek = localStorage.getItem('dag_km_oyun_ayar');
      kmOyunAyarAc(); const satir = /Akvaryum seviyesi/.test(document.getElementById('km-oyun-ayar-modal').textContent); kmOyunAyarKapat();
      kmOyunAyarKaydet({ mod: 'standart', ozel: {} }); const std = oku().gerekli;
      kmOyunAyarKaydet({ mod: 'ozel', ozel: { akvaryumSeri: 2 } }); const zor = oku().gerekli;
      if (yedek) localStorage.setItem('dag_km_oyun_ayar', yedek); else localStorage.removeItem('dag_km_oyun_ayar'); kmOyunAyarKaydet(kmOyunAyarHam());
      return { satir, std, zor };
    }, anahtar);
    dogrula(sv.satir, 'Oyun Ayarları\'nda Akvaryum seviyesi satırı yok');
    dogrula(Math.abs(sv.zor / sv.std - 2) < 0.05, `Çok zor gereken doluluğu 2 katına çıkarmadı (${sv.std} → ${sv.zor})`);
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px genişlikte yatay taşma');
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
    log(`${r3.st.dolanlar.length} akvaryum doldu (${tip0} → ${r3.st.tip}) · nadir rozet ${nadirRozet}`);
  } finally { await ctx.close(); }
}
