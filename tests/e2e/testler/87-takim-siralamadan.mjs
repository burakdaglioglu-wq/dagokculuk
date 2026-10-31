// 2026-11-01 kullanıcı: "Yarışma'daki grup (takım) yarışmasını düzeltelim — var olan yarışma sonrası sıralama ve eşleşme olsun".
// Bugünün 🏹 Sıralama turu sonucu (arşiv) → Takım & Düello sihirbazında "🏹 Sıralama turuna göre" (varsayılan açık):
// takım maçında yılan dağıtım tur puanıyla (1-8, 2-7, 3-6, 4-5), düelloda eşleşme sıraya göre (1. bay, 2–5, 3–4); kapatılabilir;
// sonuç ekranındaki "Bu sıralamayla takım maçları kur" sihirbazı takım maçıyla açar. Veriler geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'yarisma');
    yedek = await p.evaluate(() => ({ tur: localStorage.getItem(yzAnahtar()), arsiv: localStorage.getItem('dag_yz_arsiv'), mod: localStorage.getItem('dag_yz_mod'), liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()) }));
    const sec = await p.evaluate(() => {
      const l = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (l.length < 8 && !turnuvaDB[g][ad].pasif) l.push({ g, ad }); }));
      localStorage.removeItem(yzAnahtar()); localStorage.removeItem(kmHatAnahtari());
      const a = JSON.parse(localStorage.getItem('dag_yz_arsiv') || '[]');
      a.push({ id: 'test87', t: Date.now() - 600000, g: Date.now() - 60000, tarih: bugunISO(), mesafe: '18m', format: 'tam', sporcular: l.map((s, i) => ({ k: s.g + '|' + s.ad, toplam: 300 - i * 10, sira: i + 1 })) });
      localStorage.setItem('dag_yz_arsiv', JSON.stringify(a));
      _kmListe = l.slice().reverse(); // ders listesi ters sırada — dağıtım listeye değil sıralamaya bakmalı
      _yzK.tur = 'takim'; _yzK.boyut = 2; _yzK.sira = null; _yzK.haric = {}; _yzK.eski = false;
      yzModAyarla('takim'); yzTakimlariKur(); kmYarismaGiris();
      return l.map((s) => s.g + '|' + s.ad);
    });
    dogrula(sec.length === 8, 'testte 8 sporcu gerekli (gelen ' + sec.length + ')');
    await p.waitForTimeout(300);
    dogrula(await p.locator('.yz-sk-sira.aktif', { hasText: 'Sıralama turuna göre' }).count() === 1, 'sihirbazda "Sıralama turuna göre" açık görünmüyor');
    const t = await p.evaluate(() => _kmTakimlar.map((x) => x.uyeler.map((u) => u.g + '|' + u.ad)));
    esit(JSON.stringify(t), JSON.stringify([[sec[0], sec[7]], [sec[1], sec[6]], [sec[2], sec[5]], [sec[3], sec[4]]]), 'takımlar tur puanına göre yılan dağıtılmadı');
    dogrula(/🏹 530p/.test(await p.locator('.yz-sk-takimlar').textContent()), 'takım kartında tur puanı yok');
    // kapat → karne ortalamasına döner, açıklama değişir
    await p.locator('.yz-sk-sira button').click(); await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => _yzK.sira === false && /kapalı/.test(document.querySelector('.yz-sk-sira').textContent)), 'sıralama kapanmadı');
    await p.locator('.yz-sk-sira button').click(); await p.waitForTimeout(200);
    // düello, 5 sporcu: 1. bay, 2–5, 3–4
    const d = await p.evaluate((sec) => {
      _kmListe = sec.slice(0, 5).reverse().map((k) => { const i = k.indexOf('|'); return { g: k.slice(0, i), ad: k.slice(i + 1) }; });
      yzTurSec('duello'); yzSihirbazBaslat();
      const ad = (i) => i == null ? null : _kmTakimlar[i].uyeler[0].g + '|' + _kmTakimlar[i].uyeler[0].ad;
      return { maclar: _kmYarismaBracketMaclar.map((m) => [ad(m.aIdx), ad(m.bIdx)]), gorunum: _kmYarismaBracketGorunum };
    }, sec);
    esit(d.gorunum, 'agac', 'düello ağacı açılmadı');
    const bek = [[sec[1], sec[4]], [sec[2], sec[3]], [sec[0], null]].map((x) => JSON.stringify(x)).sort();
    esit(JSON.stringify(d.maclar.map((x) => JSON.stringify(x)).sort()), JSON.stringify(bek), 'düello eşleşmesi sıralamaya göre değil');
    // sonuç ekranı düğmesi → sihirbaz takım maçıyla
    const s = await p.evaluate(() => { kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _yzK.tur = 'hayali'; yzSiralamadanTakim(); return { mod: _yz.mod, tur: _yzK.tur, sira: !!document.querySelector('.yz-sk-sira.aktif') }; });
    dogrula(s.mod === 'takim' && s.tur === 'takim' && s.sira, 'sonuç ekranı düğmesi sihirbazı açmadı: ' + JSON.stringify(s));
    await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), '390 px\'te taşma');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('sıralama turu → takımlar 1-8/2-7/3-6/4-5 (530p) · kapat/aç · düello 1. bay, 2–5, 3–4 · sonuç ekranından giriş · 390 px');
  } finally {
    if (yedek) await p.evaluate((y) => {
      const set = (k, v) => { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); };
      set(yzAnahtar(), y.tur); set('dag_yz_arsiv', y.arsiv); set('dag_yz_mod', y.mod); set(kmHatAnahtari(), y.hat);
      _kmListe = JSON.parse(y.liste); _kmListeKaydet();
      try { kmYarismaSifirla(); _kmYarismaBracketGorunum = null; _yzK.tur = null; } catch (e) {}
    }, yedek).catch(() => {});
    await ctx.close();
  }
}
