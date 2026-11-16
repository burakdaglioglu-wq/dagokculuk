// Karışık Sınıf › Oyunlar › 🥷 Gölge Yolu 3B (2026-11-16, v421): Çatı Koşusu (bireysel) + Ejder Kulesi (hep birlikte), 5 bölümlük ilerleme.
// Seçicide iki kart, seri kayda yazılır, herkes atmadan bölüm bitmez, çatı arası kuralı (yarı puan, 2 kalışta sensei), kapıya varana yıldız,
// bölüm bitince ilerleme 1 artar (geri al bunu da geri alır), "Sonraki bölüm" yeni bölümü açar, 12 saat kuralı günlük oyunu siler ama
// ilerlemeyi silmez; 18 sporcu ekran görüntüsü (E2E_3B=1 ile gerçek 3B), 390 px'te yana taşma yok.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  const O = 'tests/e2e/_cikti/130-';
  let yedek = null;
  const TID = ['catikosu', 'ejderkule'];
  try {
    if (process.env.E2E_3B) await ctx.addInitScript(() => { window.__h3Zorla3B = true; });
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const tum = await p.evaluate(() => { const t = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) t.push({ g, ad }); })); window.__tum = t; return t.length; });
    dogrula(tum >= 9, 'en az 9 sporcu gerekli');
    const kur = await p.evaluate((TID) => ({ ad: TID.map((t) => KM_OYUN_TEMALAR[t] && KM_OYUN_TEMALAR[t].ad).join('|'), sifir: TID.every((t) => KM_OYUN_SIFIR_ONEK.includes('dag_km_n3_' + t + '_')), secici: ['Çatı Koşusu', 'Ejder Kulesi'].every((a) => kmOyunSeciciKartlari().includes(a)), ucb: TID.every(kmOyun3BMi) }), TID);
    esit(kur.ad, 'Çatı Koşusu|Ejder Kulesi', 'iki tema'); dogrula(kur.sifir, '12 saat kuralı'); dogrula(kur.secici, 'seçicide iki kart'); dogrula(kur.ucb, '3B listesi');
    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0, bos = 0; k < 250 && bos < 4; k++) { await new Promise((r) => setTimeout(r, 100)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); bos = 0; } else if (!_kmOyunKilit) bos++; else bos = 0; }
      return { key: s.g + '|' + s.ad, once, sonra: (sp.seriler || []).length, st: JSON.parse(JSON.stringify(n3Durum(_kmOyunAktifTema))), il: JSON.parse(JSON.stringify(n3Ilerleme(_kmOyunAktifTema))) };
    }, [oklar, hedef]);
    const ac = async (tid, n) => {
      await p.evaluate(([tid, n]) => { _kmListe = window.__tum.slice(0, n); const kn = _kmAktifKonum || 'varsayilan'; localStorage.removeItem('dag_km_n3_' + tid + '_' + kn); localStorage.removeItem('dag_km_n3ilerleme_' + tid + '_' + kn); kmOyunListeDegisti && kmOyunListeDegisti(); kmOyunTemaSec(tid); }, [tid, n]);
      await p.waitForSelector('#n3-hud #n3-serit .n3-k', { timeout: 30000 }); await p.waitForTimeout(800);
    };
    const idxler = () => p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0));
    // saf kurallar
    const saf = await p.evaluate(async () => { await dagskEkYukle('dagsk-km-ninja3d.js?v=2'); const h = {}, a = _n3Ic.kosuHesap(20, 0.4, h, 'k', 0), b = _n3Ic.kosuHesap(20, 0.5, {}, 'k', 0), b2 = _n3Ic.kosuHesap(20, 0.4, h, 'k', 0), c = _n3Ic.kosuHesap(20, 0.4, h, 'k', 0); return { dur: a.s1, kaldi: !!a.kaldi, gec: b.s1 > 28, kil: b.kil, ikinci: !!b2.kaldi, sensei: c.sensei && c.s1 > 28, can: _n3Ic.muhafizCan(0, 9, 3) }; });
    esit(saf.dur, 23.5, 'yarı puan altı çatı arasında durur'); dogrula(saf.kaldi && saf.gec && saf.kil, 'yarı puan atlar (kıl payı)'); dogrula(saf.ikinci && saf.sensei, '2 kalıştan sonra sensei'); esit(saf.can, 216, 'muhafız canı');
    const sonuclar = [];
    for (const tid of TID) {
      await ac(tid, 9);
      esit(await p.locator('#km-oyun-rightpanel').isVisible().catch(() => false), false, tid + ': puan sıralaması görünmemeli');
      const r1 = await seri(['X', '10', '10'], 0);
      esit(r1.sonra, r1.once + 1, tid + ': seri kayda yazılmadı'); esit(r1.st.atan[r1.key], 1, tid + ': atan');
      const ga = await p.evaluate((tid) => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); return n3Durum(tid).atan; }, tid);
      esit(Object.keys(ga).length, 0, tid + ': geri al');
      const idx = await idxler(); let son = null, tur = 0;
      while (tur < 6) {
        tur++;
        for (let k = 0; k < idx.length; k++) { son = await seri(['X', '10', '10'], idx[k]); if (k === idx.length - 2) esit(son.st.faz, 'oyun', tid + ': herkes atmadan bitmemeli'); }
        if (son.st.faz === 'son') break;
      }
      esit(son.st.faz, 'son', tid + ': bölüm bitmeli (' + tur + ' tur)');
      esit((son.st.finalAdlar || []).length, 9, tid + ': finalde herkesin adı');
      esit(son.il.bolum, 1, tid + ': ilerleme 2. bölüme geçmeli');
      if (tid === 'catikosu') { esit((son.st.varan || []).length, 9, 'herkes kapıda'); esit(son.il.yildiz[son.key], 1, 'kapıya varana yıldız'); }
      await p.waitForSelector('#n3-son', { timeout: 10000 });
      const yazi = await p.locator('#n3-son').innerText();
      dogrula(/BİTTİ|DÜŞTÜ/.test(yazi) && /Sonraki bölüm/.test(yazi), tid + ': sonuç kartı ' + yazi.slice(0, 60));
      // geri al: bölüm bitişi + ilerleme geri gelir
      const gb = await p.evaluate((tid) => { kmOyunSonGirisiGeriAl(); return { faz: n3Durum(tid).faz, bolum: n3Ilerleme(tid).bolum }; }, tid);
      esit(gb.faz, 'oyun', tid + ': geri al bitişi kaldırmalı'); esit(gb.bolum, 0, tid + ': geri al ilerlemeyi geri almalı');
      son = await seri(['X', '10', '10'], idx[idx.length - 1]); esit(son.st.faz, 'son', tid + ': yeniden bitmeli'); esit(son.il.bolum, 1, tid + ': yeniden ilerleme');
      await p.waitForSelector('#n3-son', { timeout: 10000 });
      await p.locator('#n3-sonraki').click(); await p.waitForTimeout(600);
      const yeni = await p.evaluate((tid) => ({ faz: n3Durum(tid).faz, bolum: n3Durum(tid).bolum, harita: document.querySelector('.n3-dg.simdi') && document.querySelector('.n3-dg.simdi').title }), tid);
      esit(yeni.faz, 'oyun', tid + ': sonraki bölüm açılmalı'); esit(yeni.bolum, 1, tid + ': 2. bölüm'); esit(yeni.harita, 'Bambu Ormanı', tid + ': haritada 2. bölüm');
      sonuclar.push(tid + ' ' + tur + ' tur');
    }
    // 12 saat: günlük oyun gider, ilerleme kalır
    const sil = await p.evaluate(() => { const kn = _kmAktifKonum || 'varsayilan', k = 'dag_km_n3_ejderkule_' + kn, st = n3Durum('ejderkule'); st.tur = 4; localStorage.setItem(k, JSON.stringify(st)); localStorage.setItem('dag_km_oyun_son_' + kn, String(Date.now() - 13 * 3600000)); kmOyunBayatSifirla(); const h = localStorage.getItem(k); return { gunluk: !h || JSON.parse(h).tur === 1 ? 'silindi' : 'kaldi', ilerleme: n3Ilerleme('ejderkule').bolum }; });
    esit(sil.gunluk, 'silindi', '12 saat sonra günlük oyun sıfırlanmalı'); esit(sil.ilerleme, 1, '12 saat ilerlemeyi silmemeli');
    // 18 sporcu: oyun ortası ekranlar
    for (const tid of TID) {
      await ac(tid, 18);
      const idx = await idxler();
      for (const j of idx.slice(0, 11)) await seri([['X', '10', '9'], ['4', '3', '5'], ['6', '7', '5'], ['10', '9', '9']][j % 4], j);
      await p.waitForTimeout(1800);
      await p.evaluate(() => document.querySelectorAll('button').forEach((b) => { if (/^(Devam|Kapat)$/.test(b.textContent.trim()) && b.offsetParent && !b.closest('#km-oyun-wrap .n3-sahne')) b.click(); })); await p.waitForTimeout(600);
      await p.screenshot({ path: O + tid + '.png' });
      dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tid + ': 1280 yana taşma');
    }
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(1200);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yana taşıyor');
    await p.screenshot({ path: O + 'telefon.png' });
    const mod = await p.evaluate(() => document.querySelector('.n3-sahne').classList.contains('duz') ? '2B' : '3B');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('iki oyun: ' + sonuclar.join(' · ') + ' · çatı arası/sensei · yıldız · ilerleme + geri al · sonraki bölüm · 12 saat · 18 sporcu · 390 px · görünüm ' + mod);
  } finally {
    try {
      await p.evaluate(([y, TID]) => { const kn = _kmAktifKonum || 'varsayilan'; TID.forEach((t) => { localStorage.removeItem('dag_km_n3_' + t + '_' + kn); localStorage.removeItem('dag_km_n3ilerleme_' + t + '_' + kn); }); if (y) { _kmListe = JSON.parse(y); kmOyunListeDegisti && kmOyunListeDegisti(); } }, [yedek, TID]);
    } catch (e) {}
    await ctx.close();
  }
}
