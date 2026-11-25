// 🕵️ Dedektif Okçular 3.0 (v466, 2026-11-24; kullanıcı: "iyi gidiyor ama tekrar ediyor; önce zor, sonra karmaşık zor; animasyonlar ve farklı karakterler").
// 5 vaka türü tek çözümlü · 5 seviye · sorgu/ortak/yalancı oynanış · örtü hamleleri · kapı/balon finali · albüm · üst seviye · geri al · telefon.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  try {
    await uygulamaAc(p); await karisikSinifArac(p, 'oyunlar');
    await p.evaluate(() => {
      ['dag_km_dedektif_', 'dag_km_ddkkalici_'].forEach((a) => localStorage.removeItem(a + (_kmAktifKonum || 'varsayilan')));
      window.ddkKilitsizTest = true; // kilitler 165'te denenir
      const h = []; ['minikler', 'kucukler', 'yildizlar', 'buyukler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) h.push({ g, ad }); }));
      _kmListe = h.slice(0, 24); kmOyunRosterYenile(); _kmOyunRosterCache.forEach((s) => { turnuvaDB[s.g][s.ad].devamModu = true; }); kmOyunTemaSec('dedektif');
    });
    await p.waitForFunction(() => !!document.getElementById('ddk-cv') && !document.getElementById('ddk-perde').hidden, null, { timeout: 30000 });
    const oku = () => p.evaluate(() => JSON.parse(localStorage.getItem('dag_km_dedektif_' + (_kmAktifKonum || 'varsayilan'))));
    const kal = () => p.evaluate(() => JSON.parse(localStorage.getItem('dag_km_ddkkalici_' + (_kmAktifKonum || 'varsayilan'))));
    const vaka = (z, t, v) => p.evaluate(([z, t, v]) => { const st = ddkVakaTest(z, t, v); st.olaylar = []; localStorage.setItem('dag_km_dedektif_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); ddkGuncelle(); return st; }, [z, t, v]);
    const seri = (i, oklar) => p.evaluate(async ([i, oklar]) => { _kmOyunAktifIndex = i % _kmOyunRosterCache.length; _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); } }, [i, oklar]);
    const sucla = async (i, ms) => { await p.click('#ddk-sucla-btn'); const xy = await p.evaluate((i) => ddkSupheliNokta(i), i); await p.mouse.click(xy.x, xy.y); await p.waitForSelector('#ddk-evet', { timeout: 5000 }); await p.click('#ddk-evet'); await p.waitForTimeout(ms); };

    // 1) üretim: her seviye × tür tek çözümlü, metinler dolu
    const sorun = await p.evaluate(() => { const r = []; for (const [z, tl] of ddkTipler()) for (const t of tl) for (const kd of ['insan', 'hayvan', 'robot', 'canavar', 'karisik']) for (let i = 0; i < 25; i++) {
      const v = ddkUretTest(z, t, kd), E = ddkEslesTest, hep = v.s.map((_, j) => j), ad = z + '/' + t; if (v.dustu) { r.push(ad + ' düştü'); continue; } let c = [];
      if (t === 'klasik' || t === 'foto') c = hep.filter((j) => v.ipucu.every((q) => E(v.s[j], q)));
      else if (t === 'sorgu') c = hep.filter((j) => v.ipucu.every((q) => q.no === v.s[j].no ? !E(v.s[j], q) : E(v.s[j], q)));
      else if (t === 'yalanci') c = hep.filter((j) => v.ipucu.filter((q) => E(v.s[j], q)).length >= v.ipucu.length - 1);
      else { c = hep.filter((j) => v.ipucu.filter((q) => q.kim === 1).every((q) => E(v.s[j], q))); const c2 = hep.filter((j) => v.ipucu.filter((q) => q.kim === 2).every((q) => E(v.s[j], q))); if (c2.length !== 1 || c2[0] !== v.h2) r.push(ad + ' 2. hırsız'); }
      if (c.length !== 1 || c[0] !== v.h) r.push(ad + ' çözüm ' + c.length); v.ipucu.forEach((q) => { if (!ddkMetinTest(q) || /undefined|null/.test(ddkMetinTest(q))) r.push('metin ' + JSON.stringify(q)); });
    } return r; });
    esit(sorun.length, 0, 'üretim: ' + sorun.slice(0, 4).join(' | '));
    esit(await p.locator('.ddk-zorsec button').count(), 5, '5 seviye'); esit(await p.locator('.ddk-zarflar .z-tip').count(), 3, 'zarflarda vaka türü');
    esit(await p.evaluate(() => new Set([...document.querySelectorAll('.z-tip')].map((e) => e.textContent)).size), 3, 'Normal: 3 zarf 3 ayrı tür');

    // 2) sorgu: iyi ok bir şüpheliyi konuşturur
    let st = await vaka('normal', 'sorgu', 'pasta'); esit(st.n, 5, 'sorgu 5 şüpheli'); esit(st.v.ipucu.length, 5, 'herkes konuşur');
    await seri(0, ['9', '8', '2']); await p.waitForTimeout(900); st = await oku(); esit(st.acik, 2, 'iki iyi ok iki ifade');
    // 3) örtü hamleleri: gazete/sis → ilk iyi ok kaldırır, ipucu açmaz; fare kartı götürür; saat ilerler
    for (const tip of ['gazete', 'sis']) { await p.evaluate((t) => ddkOlayTest(t), tip); st = await oku(); esit(st.karanlik, tip, tip + ' örtüsü'); const a0 = st.acik; await seri(1, ['9', '1', '1']); await p.waitForTimeout(900); st = await oku(); esit(st.karanlik, false, tip + ' kalkmalı'); esit(st.acik, a0, 'ilk iyi ok örtüye gider'); }
    { const a0 = st.acik; await p.evaluate(() => ddkOlayTest('fare')); st = await oku(); esit(st.acik, a0 - 1, 'fare bir kart götürür'); const s0 = st.saat; await p.evaluate(() => ddkOlayTest('saat')); st = await oku(); esit(st.saat, s0 + 1, 'saat 1 ileri'); }
    // 4) suç ortakları: ilki yakalanınca vaka bitmez, ikincide final; yer değişince ikisi de aynı kişi kalır
    st = await vaka('zor', 'ortak', 'roket'); const nolar = [st.v.s[st.v.h].no, st.v.s[st.v.h2].no].join(); await p.evaluate(() => ddkOlayTest('yer')); await p.waitForTimeout(3800); st = await oku(); esit([st.v.s[st.v.h].no, st.v.s[st.v.h2].no].join(), nolar, 'yer değişince iki hırsız da aynı');
    await sucla(st.v.h2, 3400); st = await oku(); esit(st.faz, 'oyun', '1. hırsızdan sonra soruşturma sürer'); esit(st.yak[st.v.h2], 1, '1. hırsız yakalı');
    await sucla(st.v.h, 3600); st = await oku(); esit(st.faz, 'kovala', 'iki hırsız da bulununca final');
    // 5) yalancı şahit: 10 yalan kartı gösterir, masum elemez
    st = await vaka('zor', 'yalanci', 'tac'); await p.evaluate(() => { const a = 'dag_km_dedektif_' + (_kmAktifKonum || 'varsayilan'), q = JSON.parse(localStorage.getItem(a)); q.acik = q.v.ipucu.length - 1; const yi = q.v.ipucu.findIndex((c) => c.yalan); if (yi === q.acik) q.v.ipucu.unshift(q.v.ipucu.pop()); localStorage.setItem(a, JSON.stringify(q)); ddkGuncelle(); });
    await seri(2, ['10', '1', '1']); await p.waitForTimeout(900); st = await oku(); dogrula(st.yalanAcik, '10 yalanı bulmalı'); esit(st.masum.filter(Boolean).length, 0, 'yalan bulununca masum elenmez');
    // 6) finaller: kapı (hepsi kapanınca yakaladık) / balon (süre dolunca kaçar)
    await vaka('normal', 'klasik', 'dondurma'); await p.evaluate(() => ddkFinalTest('kapi')); st = await oku(); esit(st.kov.N, 5, 'Normal 5 kapı');
    await seri(3, ['10', '10', '9']); await p.waitForTimeout(4200); st = await oku(); let K = await kal(); esit(st.faz, 'cozuldu', 'iki 10 dört kapı + 9 = yakaladık'); esit(st.parcaKazandi, true, 'parça'); esit(K.album.length, 1, 'albüme girdi'); dogrula(!!st.yakAd, 'lakap');
    dogrula(await p.evaluate(() => { const c = document.getElementById('ddk-port'), b = c.getBoundingClientRect(), k = c.closest('.ddk-kart').getBoundingClientRect(); return b.left >= k.left - 12 && b.right <= k.right && b.width > 60; }), 'sabıka fotoğrafı kartın içinde');
    await vaka('normal', 'klasik', 'elmas'); await p.evaluate(() => ddkFinalTest('balon')); for (let k = 0; k < 3; k++) { await seri(4 + k, ['1', '1', '1']); await p.waitForTimeout(900); } await p.waitForTimeout(2200); st = await oku(); esit(st.parcaKazandi, false, 'balon süresi dolunca kaçar'); K = await kal(); esit(K.ust, 0, 'kaçınca seviye serisi sıfır');
    // 7) üst üste 2 yakalama → üst seviye teklifi
    await p.evaluate(() => { const a = 'dag_km_ddkkalici_' + (_kmAktifKonum || 'varsayilan'), q = JSON.parse(localStorage.getItem(a)); q.ust = 1; localStorage.setItem(a, JSON.stringify(q)); });
    await vaka('normal', 'klasik', 'kupa'); await p.evaluate(() => ddkFinalTest('kapi')); await seri(7, ['10', '10', '9']); await p.waitForTimeout(4200);
    await p.click('#ddk-ust'); await p.waitForTimeout(400); st = await oku(); esit(st.zor, 'zor', 'üst seviye: Zor'); esit(st.faz, 'zarf', 'yeni zarflar');
    // 8) albüm + geri al + film
    await p.click('#ddk-album-btn', { force: true }).catch(() => {}); await p.evaluate(() => document.getElementById('ddk-album-btn').click()); esit(await p.locator('.ddk-album canvas').count(), 2, 'albümde 2 hırsız'); await p.click('#ddk-kapat');
    await p.locator('.ddk-zarflar button').first().click(); await p.waitForTimeout(500); dogrula(await p.evaluate(() => document.getElementById('ddk-perde').hidden), 'film oynarken kart kapalı'); await p.waitForSelector('#ddk-bas', { timeout: 6000 }); dogrula(await p.locator('.ddk-kural').count() === 1, 'vaka kuralı kartta');
    await p.click('#ddk-bas'); const once = JSON.stringify(await kal()); await seri(9, ['9', '9', '9']); await p.waitForTimeout(1200); await p.evaluate(() => { window.confirm = () => true; kmOyunSonGirisiGeriAl(); }); await p.waitForTimeout(500); st = await oku(); esit(st.acik, 0, 'geri al'); esit(JSON.stringify((await kal()).ipucu), JSON.stringify(JSON.parse(once).ipucu), 'geri al kalıcıyı da alır');
    // 9) telefon: Suçla düğmesi örtülmez
    const t2 = await sayfaAc({ genislik: 390, yukseklik: 844 });
    try {
      await uygulamaAc(t2.p); await karisikSinifArac(t2.p, 'oyunlar');
      await t2.p.evaluate(() => { const h = []; ['minikler', 'kucukler', 'yildizlar'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && !sp.pasif) h.push({ g, ad }); })); _kmListe = h.slice(0, 24); kmOyunRosterYenile(); kmOyunTemaSec('dedektif'); });
      await t2.p.waitForFunction(() => typeof ddkVakaTest === 'function' && !!document.getElementById('ddk-cv'), null, { timeout: 30000 });
      await t2.p.evaluate(() => ddkVakaTest('karmasik', 'sorgu', 'pasta')); let ort = 'x'; for (let k = 0; k < 10 && ort; k++) { await t2.p.waitForTimeout(600);
      ort = await t2.p.evaluate(() => { const e = document.getElementById('ddk-sucla-btn'); e.scrollIntoView({ block: 'center' }); const q = e.getBoundingClientRect(), u = document.elementFromPoint(q.x + q.width / 2, q.y + q.height / 2); return u === e ? '' : (u && (u.id || u.className)) + ' ' + JSON.stringify(q); }); }
      esit(ort, '', 'telefonda Suçla örtülü');
      esit(t2.hatalar.length, 0, 'telefon sayfa hatası: ' + t2.hatalar.join(' | '));
    } finally { await t2.ctx.close(); }
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('5 tür tek çözümlü · sorgu · gazete/sis/fare/saat · suç ortakları · yalancı · kapı/balon · albüm · üst seviye · film · geri al · telefon');
  } finally { await ctx.close(); }
}
