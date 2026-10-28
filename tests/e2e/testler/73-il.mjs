// Karışık Sınıf › Oyunlar › 🗺️ 81 İl: Bayrak Kapmaca (2026-10-28, 29 Ekim turnuvası).
// 81 petek (plakalar), dengeli takımlar, haritadan hedef seçme, bayrak dikme (eşik), kaçırma, çalma, savunma, güçlendirme,
// X komşu il; adil bitiş: 🏁 sonrası oyun herkes eşit sayıda atınca biter (önce atan avantajı yok) + rozet; geri al.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    const n = await p.evaluate(() => {
      localStorage.removeItem('dag_km_il_' + (_kmAktifKonum || 'varsayilan'));
      _kmListe = _kmListe.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).slice(0, 4); kmOyunRosterYenile();
      _kmOyunRosterCache.forEach((s) => { turnuvaDB[s.g][s.ad].devamModu = true; });
      kmOyunTemaSec('il');
      return _kmOyunRosterCache.length;
    });
    dogrula(n >= 2, 'testte kaydı olan en az 2 sporcu gerekli');
    await p.waitForFunction(() => !!document.getElementById('il-svg'), null, { timeout: 30000 });
    esit(await p.evaluate(() => document.querySelectorAll('#il-harita .il-petek').length), 81, '81 il çizilmeli');
    esit(await p.evaluate(() => Object.values(ilHarita).filter((h) => !h.komsu.length).length), 0, 'yalnız kalan il olmamalı');
    const a = 'dag_km_il_';
    const oku = () => p.evaluate((a) => JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))), a);
    const st0 = await oku();
    esit(st0.takimSay, 2, '≤7 sporcuda 2 takım');
    // haritadan il seç (gerçek tıklama) → sporcu seri atar
    const sec = async (plaka) => { const b = await p.locator('#il-p' + plaka + ' polygon').boundingBox(); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await p.waitForTimeout(150); };
    const seri = (i, oklar) => p.evaluate(async ([i, oklar, a]) => {
      _kmOyunAktifIndex = i; const s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 80 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      return { once, sonra: (sp.seriler || []).length, st: JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))) };
    }, [i, oklar, a]);
    const takim = (st, i) => p.evaluate(([i]) => { const s = _kmOyunRosterCache[i]; return s.g + '|' + s.ad; }, [i]).then((k) => st.takim[k]);
    const A = 0, B = await p.evaluate(([a]) => { const st = JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))); const t0 = st.takim[_kmOyunRosterCache[0].g + '|' + _kmOyunRosterCache[0].ad]; return _kmOyunRosterCache.findIndex((s) => st.takim[s.g + '|' + s.ad] !== t0); }, [a]);
    dogrula(B > 0, 'farklı takımdan sporcu bulunamadı');
    const tA = await takim(st0, A), tB = await takim(st0, B);
    // A: Ankara'ya 3 ok 3 → 9 < 10 → kaçtı
    await p.evaluate(() => { _kmOyunAktifIndex = 0; ilGuncelle(); }); await sec('06');
    let r = await seri(A, ['3', '3', '3']);
    esit(r.sonra, r.once + 1, 'seri gerçek kayda yazılmadı');
    dogrula(!r.st.iller['06'], 'eşik altı seri bayrak dikmemeli');
    // A: Ankara 7+6+5 = 18 → bayrak, savunma 18
    await p.evaluate(() => { _kmOyunAktifIndex = 0; ilGuncelle(); }); await sec('06');
    r = await seri(A, ['7', '6', '5']);
    esit(JSON.stringify(r.st.iller['06']), JSON.stringify({ t: tA, d: 18 }), 'Ankara bayrağı');
    // B: Ankara'ya 6+6+6 = 18 → savundu (eşit yetmez)
    await p.evaluate(([b]) => { _kmOyunAktifIndex = b; ilGuncelle(); }, [B]); await sec('06');
    r = await seri(B, ['6', '6', '6']);
    esit(r.st.iller['06'].t, tA, 'eşit seri çalmamalı');
    // B: Ankara 10+9+X = 29 → ÇALDI, X komşu il de gelir
    await p.evaluate(([b]) => { _kmOyunAktifIndex = b; ilGuncelle(); }, [B]); await sec('06');
    r = await seri(B, ['10', '9', 'X']);
    esit(r.st.iller['06'].t, tB, 'yüksek seri ili çalmalı');
    const komsuB = Object.entries(r.st.iller).filter(([pl, v]) => pl !== '06' && v.t === tB).length;
    dogrula(komsuB >= 1, 'X ile komşu il de gelmeli');
    const caldi = await p.evaluate(([b]) => { const s = _kmOyunRosterCache[b], sp = turnuvaDB[s.g][s.ad]; return sp.oyun && sp.oyun.il && sp.oyun.il.caldi; }, [B]);
    dogrula(caldi >= 1, 'çalma rozeti yazılmadı');
    // puan: Ankara ×5
    const puan = await p.evaluate(() => [...document.querySelectorAll('.il-puan')].map((e) => +e.textContent));
    dogrula(puan[tB] >= 6, 'Ankara 5 + komşu il puanı');
    // geri al
    const geri = await p.evaluate((a) => { const once = _kmOyunSonGiris && _kmOyunSonGiris.il; window.confirm = () => true; kmOyunSonGirisiGeriAl(); const st = JSON.parse(localStorage.getItem(a + (_kmAktifKonum || 'varsayilan'))); return { var: !!once, t: st.iller['06'].t }; }, a);
    dogrula(geri.var, 'geri al için İl kopyası alınmadı'); esit(geri.t, tA, 'geri al Ankara\'yı geri vermedi');
    await p.waitForTimeout(600);
    // adil bitiş: 🏁 → herkes eşit sayıda atınca biter
    await p.evaluate(() => document.getElementById('il-bitir-btn').click()); await p.waitForTimeout(300);
    await p.evaluate(() => { const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') onayOnayla(); });
    let st = await oku(); dogrula(st.bitir, 'bitir işaretlenmedi');
    const atis = (st) => p.evaluate(() => _kmOyunRosterCache.map((s) => s.g + '|' + s.ad)).then((k) => k.map((x) => st.atis[x] || 0));
    // en çok atan kadar atmamış herkes atar; son kişi atana kadar oyun bitmemeli
    let say = await atis(st); const mx = Math.max(...say);
    for (let tur = 0; tur < 6 && Math.min(...say) < mx; tur++) {
      for (let i = 0; i < n; i++) {
        if (say[i] >= mx) continue;
        const eksik = say.reduce((a, x) => a + (mx - x), 0);
        r = await seri(i, ['5', '5', '5']); say = await atis(r.st);
        if (eksik > 1) esit(r.st.bitti, null, 'tur tamamlanmadan oyun bitti (önce atan avantajı!)');
      }
    }
    st = await oku();
    dogrula(!!st.bitti, 'tur tamamlanınca oyun bitmeli');
    await p.waitForTimeout(600);
    dogrula(await p.evaluate(() => /KAZANDI|BERABERE/.test(document.getElementById('il-dev').textContent)), 'bitiş töreni yok');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px genişlikte yatay taşma');
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
    log(`81 il · eşik/kaçtı · bayrak · savundu · ÇALDI + X komşu · geri al · adil bitiş (${st.bitti.p.join('-')})`);
  } finally { await ctx.close(); }
}
