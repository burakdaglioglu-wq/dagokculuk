// 🔒 Dedektif: kilitli ipuçları + kalıcı seviye + tekrar etmeyen kadro (v466, 2026-11-25; kullanıcı: "yine aynı, hep aynı karakterler vardı, zorluğu da o kadar değildi").
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';
const CIKTI = process.env.E2E_CIKTI || null;

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  const foto = async (ad) => { if (CIKTI) await p.screenshot({ path: CIKTI + '/' + ad + '.png' }); };
  try {
    await uygulamaAc(p); await karisikSinifArac(p, 'oyunlar');
    const kur = () => p.evaluate(() => {
      const h = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) h.push({ g, ad }); }));
      _kmListe = h.slice(0, 24); kmOyunRosterYenile(); _kmOyunRosterCache.forEach((s) => { turnuvaDB[s.g][s.ad].devamModu = true; }); kmOyunTemaSec('dedektif');
    });
    await p.evaluate(() => ['dag_km_dedektif_', 'dag_km_ddkkalici_'].forEach((a) => localStorage.removeItem(a + (_kmAktifKonum || 'varsayilan')))); await kur();
    await p.waitForFunction(() => !!document.getElementById('ddk-cv') && !document.getElementById('ddk-perde').hidden, null, { timeout: 30000 });
    const oku = () => p.evaluate(() => JSON.parse(localStorage.getItem('dag_km_dedektif_' + (_kmAktifKonum || 'varsayilan'))));
    const vaka = (z, t, v) => p.evaluate(([z, t, v]) => { const st = ddkVakaTest(z, t, v); st.olaylar = []; localStorage.setItem('dag_km_dedektif_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); ddkGuncelle(); return st; }, [z, t, v]);
    const seri = (i, oklar) => p.evaluate(async ([i, oklar]) => { _kmOyunAktifIndex = i % _kmOyunRosterCache.length; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); } }, [i, oklar]);
    await foto('ddk-zarf');
    // 1) Normal: kilit dolmadan kart açılmaz; kilide vuran herkes katkı alır; üç iyi ok artık vakayı bitirmez
    let st = await vaka('normal', 'klasik', 'kupa'); const top = st.v.kilit.reduce((a, b) => a + b, 0); esit(top, 11, 'Normal toplam 11 iyi ok'); esit(st.v.kilit.length, st.v.ipucu.length, 'her kartın kilidi');
    await seri(0, ['9', '8', '2']); await p.waitForTimeout(1200); st = await oku(); const k0 = st.v.kilit[0];
    esit(st.acik, k0 <= 2 ? 1 : 0, 'iki iyi ok'); esit(st.acik * k0 + st.dolu, 2, 'iki nokta kırıldı'); await foto('ddk-kilit');
    await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); }); await p.waitForTimeout(500); st = await oku(); esit(st.acik + st.dolu, 0, 'geri al kilidi de alır');
    // 2) Zor: 10 iki nokta kırar, masum elemez; 8 benzer şüpheli; yanlış suçlama 3 seri
    st = await vaka('zor', 'klasik', 'kupa'); esit(st.n, 8, 'Zor 8 şüpheli'); st.v.kilit[0] = 9; await p.evaluate((st) => { localStorage.setItem('dag_km_dedektif_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); ddkGuncelle(); }, st);
    await seri(1, ['10', '8', '3']); await p.waitForTimeout(1200); st = await oku(); esit(st.dolu, 3, '10 çift + 8 tek'); esit(st.masum.filter(Boolean).length, 0, 'Zor: 10 masum elemez'); await foto('ddk-zor');
    { const y = (st.v.h + 1) % st.n, s0 = st.saat; await p.click('#ddk-sucla-btn'); const xy = await p.evaluate((i) => ddkSupheliNokta(i), y); await p.mouse.click(xy.x, xy.y); await p.waitForSelector('#ddk-evet', { timeout: 5000 }); await p.click('#ddk-evet'); await p.waitForTimeout(3600); st = await oku(); esit(st.saat, s0 + 3, 'Zor yanlış suçlama 3 seri'); }
    // rüzgâr kartı da kırılan noktaları da götürür
    st.acik = 1; st.dolu = 2; await p.evaluate((st) => { localStorage.setItem('dag_km_dedektif_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); ddkGuncelle(); ddkOlayTest('fare'); }, st); st = await oku(); esit(st.acik + st.dolu, 0, 'fare kartı ve noktaları götürür');
    // 3) kadro: art arda 3 hayvan vakasında cinsler tekrar etmez (18 hayvan, 6 şüpheli)
    const gorulen = await p.evaluate(() => { const r = []; for (let i = 0; i < 12 && r.length < 3; i++) { const st = ddkVakaTest('normal', 'klasik', 'papagan'); if (st.kadro === 'hayvan') r.push(st.v.s.map((o) => o.cins)); } return r; });
    esit(new Set(gorulen.slice(0, 3).flat()).size, 18, 'üç hayvan vakasında 18 ayrı hayvan');
    const tum = await p.evaluate(() => { const c = new Set(); for (let i = 0; i < 60; i++) ddkVakaTest('normal', 'klasik', ['altinok', 'kupa', 'uzaytasi', 'sirkkupa', 'karkure', 'donmedolap', 'kampyay', 'zamancarki', 'anahtar', 'pasta', 'tac', 'elmas'][i % 12]).v.s.forEach((o) => c.add(o.cins)); return [...c]; });
    dogrula(tum.length >= 36, '60 vakada en az 36 ayrı cins (gelen ' + tum.length + ')');
    const kk = await p.evaluate(() => { let t = 0, s = null; for (let i = 0; i < 30; i++) { const k = ddkVakaTest('normal', 'klasik', 'kupa').kadro; if (k === s) t++; s = k; } return t; }); esit(kk, 0, 'kadro türü arka arkaya tekrar etmez');
    // 4) seviye kalıcı: 12 saat sıfırlaması günlük durumu siler, seviye kalır
    await vaka('karmasik', 'klasik', 'kupa'); await p.evaluate(() => { localStorage.removeItem('dag_km_dedektif_' + (_kmAktifKonum || 'varsayilan')); ddkGuncelle(); }); await p.waitForTimeout(400);
    esit(await p.evaluate(() => { const b = document.querySelector('.ddk-zorsec .on'); return b && b.dataset.z; }), 'karmasik', 'seviye ertesi gün kalır');
    dogrula(await p.evaluate(() => { const b = document.querySelector('.ddk-zarflar button'); return b.getBoundingClientRect().top >= 0; }), 'zarflar görünür');
    if (CIKTI) { for (const [z, t, v] of [['karmasik', 'klasik', 'donmedolap'], ['normal', 'klasik', 'anahtar'], ['zor', 'sorgu', 'zamancarki'], ['efsane', 'ortak', 'tac']]) { await vaka(z, t, v); await p.waitForTimeout(3200); await foto('ddk-' + z + '-' + v); } }
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('kilit · geri al · 10 çift · ceza 3 · fare · 18 hayvan tekrarsız · ' + tum.length + ' cins · kadro değişir · seviye kalıcı');
  } finally { await ctx.close(); }
}
