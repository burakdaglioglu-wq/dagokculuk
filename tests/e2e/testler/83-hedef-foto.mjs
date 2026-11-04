// 📷 Skor Gir › Fotoğrafla puanla · Hedef Haritası (2026-10-29, v354; kullanıcı bir uygulamanın "fotoğraftan otomatik puan"
// videosunu gösterip "böyle bir şey yapabilir miyiz" dedi, taslak A · Skorbord seçildi).
// Yapay 3'lü spot fotoğrafı (açılı: elips + dönme, bilinen delikler) → spotlar bulunur; büyük ekranda dokunarak ok koyulur
// (X / 9 / 8); SERİYE YAZ → Skor Gir'in kendi kaydı (seri + detayliOklar x,y,t,spot); ikinci fotoğrafta önceki fotoğrafla fark →
// yeni oklar ÖNERİLİR; grup analizi açılır; 390 px taşma yok. Eklenen seriler sonunda geri alınır.
import { sayfaAc, uygulamaAc, dogrula, esit } from '../yardimci.mjs';

// sayfada çalışır: yapay hedef fotoğrafı (dataURL değil, canvas döner)
const FOTO_CIZ = `window._hfTestFoto = function (delikler, ucgen) {
  const c = document.createElement('canvas'); c.width = 900; c.height = 1400; const g = c.getContext('2d');
  g.fillStyle = '#5a4634'; g.fillRect(0, 0, 900, 1400); g.fillStyle = '#ece6d8'; g.fillRect(150, 160, 600, 1080);
  const A = { k: 2.2, sy: 0.84, rot: 0.12 };
  const P = (u, v) => { const x = u * A.k, y = v * A.k * A.sy, c1 = Math.cos(A.rot), s1 = Math.sin(A.rot); return [450 + x * c1 - y * s1, 700 + x * s1 + y * c1]; };
  const YER = ucgen ? [[0, -75], [-72, 62], [72, 62]] : [[0, -140], [0, 0], [0, 140]]; // v374 Vegas üçgen
  YER.forEach(([ox, oy], s) => {
    [[60, '#2f7fd6'], [50, '#2f7fd6'], [40, '#e23b2e'], [30, '#e23b2e'], [20, '#f5d32a'], [10, '#f5d32a'], [5, '#f5d32a']].forEach(([r, f]) => {
      g.beginPath(); for (let t = 0; t <= 60; t++) { const a = t / 60 * Math.PI * 2, p = P(ox + Math.cos(a) * r, oy + Math.sin(a) * r); t ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
      g.closePath(); g.fillStyle = f; g.fill(); g.strokeStyle = '#222'; g.lineWidth = 1; g.stroke();
    });
    (delikler[s] || []).forEach(([u, v, golge]) => { const p = P(ox + u, oy + v); g.fillStyle = '#111'; g.beginPath(); g.arc(p[0], p[1], 5, 0, Math.PI * 2); g.fill();
      if (golge) { const q = P(ox + u + 22, oy + v - 30); g.strokeStyle = '#1b1b1b'; g.lineWidth = 6; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); } });
  });
  return c;
};`;

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1200, yukseklik: 900 });
  let geriAl = null;
  try {
    await uygulamaAc(p);
    const k = await p.evaluate(() => {
      const ge = document.getElementById('giris-ekrani'); if (ge) ge.style.display = 'none';
      aktifPlatform = 'egitmen'; try { tablariPlatformaGoreAyarla(); } catch (e) { }
      const g = Object.keys(turnuvaDB).find((x) => turnuvaDB[x] && typeof turnuvaDB[x] === 'object' && Object.keys(turnuvaDB[x]).some((a) => turnuvaDB[x][a] && turnuvaDB[x][a].seriler && !turnuvaDB[x][a].pasif && !turnuvaDB[x][a].donduruldu));
      const ad = Object.keys(turnuvaDB[g]).find((a) => turnuvaDB[g][a] && turnuvaDB[g][a].seriler && !turnuvaDB[g][a].pasif && !turnuvaDB[g][a].donduruldu);
      const sp = turnuvaDB[g][ad];
      window._hfTestOnce = { seri: (sp.seriler || []).length, detay: (sp.detayliOklar || []).length, devam: sp.devamModu };
      sp.devamModu = true; // test seri limitine takılmasın
      aktifGrup = g; skorEkraniniAc(ad); setHedefTipi('3spot'); okSayisiAyarla(3);
      return [g, ad];
    });
    const [g, ad] = k;
    geriAl = [g, ad];
    // giriş düğmesi Skor Gir'de
    dogrula(await p.evaluate(() => { const b = document.getElementById('hf-giris-btn'); return !!b && /Fotoğrafla puanla/.test(b.textContent); }), 'Skor Gir\'de "Fotoğrafla puanla" düğmesi yok');
    await p.evaluate(FOTO_CIZ);
    await p.evaluate(() => hedefFotoAc());
    await p.waitForFunction(() => !!document.getElementById('hf') && typeof window._hfIc === 'object', null, { timeout: 15000 });
    dogrula(await p.evaluate(() => /SERİ/.test(document.getElementById('hf').textContent) && /3'LÜ SPOT/.test(document.getElementById('hf').textContent)), 'kamera ekranı başlığı/etiketi yok');

    // ① fotoğraf: eski delikler var (önceki fotoğraf yok → öneri olmamalı)
    const eski = [[[-30, 20]], [[18, 30]], [[-8, -40]]];
    await p.evaluate((eski) => _hfIc.fotoIsle(_hfTestFoto(eski)), eski);
    await p.waitForTimeout(300);
    const t1 = await p.evaluate(() => { const d = _hfIc.durum(); return { akis: d.akis, n: d.spotlar.length, sp: d.spotlar.map((s) => ({ x: s.x, y: s.y, det: Math.sqrt(Math.abs(s.M[0] * s.M[3] - s.M[1] * s.M[2])) })), oneri: d.oklar.length, kanvas: document.querySelectorAll('#hf .hf-spot canvas').length }; });
    esit(t1.akis, 'duzelt', 'düzelt ekranına geçmedi'); esit(t1.n, 3, '3 spot bulunmalı'); esit(t1.kanvas, 3, '3 spot kanvası'); esit(t1.oneri, 0, 'ilk fotoğrafta öneri olmamalı');
    // merkezler ve ölçek: gerçek P(0, oy) ve √det = k·√sy
    const beklenen = [-140, 0, 140].map((oy) => { const y = oy * 2.2 * 0.84, c = Math.cos(0.12), s = Math.sin(0.12); return [450 - y * s, 700 + y * c]; });
    t1.sp.forEach((s, i) => {
      dogrula(Math.hypot(s.x - beklenen[i][0], s.y - beklenen[i][1]) < 6, `spot ${i + 1} merkezi kaymış: ${s.x.toFixed(1)},${s.y.toFixed(1)} ≠ ${beklenen[i].map((v) => v.toFixed(1))}`);
      dogrula(Math.abs(s.det - 2.2 * Math.sqrt(0.84)) < 0.12, `spot ${i + 1} ölçeği yanlış: ${s.det.toFixed(3)}`);
    });

    // ② büyük ekranda dokunarak ok koy: spot1 (0,2) X · spot2 (14,4) 9 · spot3 (-24,8) 8
    const hedefler = [[0, 2], [14, 4], [-24, 8]];
    for (let s = 0; s < 3; s++) {
      await p.locator('#hf .hf-spot').nth(s).click(); await p.waitForSelector('#hf-b-cv');
      const r = await p.evaluate(() => { const b = document.getElementById('hf-b-cv').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width }; });
      const R = 68, [u, v] = hedefler[s];
      await p.mouse.click(r.x + (u / R + 1) / 2 * r.w, r.y + (v / R + 1) / 2 * r.w); await p.waitForTimeout(80);
      await p.click('#hf-buyuk >> text=✓ TAMAM'); await p.waitForTimeout(120);
    }
    const t2 = await p.evaluate(() => ({ chip: [...document.querySelectorAll('#hf .hf-toplam .hf-chip')].map((e) => e.textContent), top: document.querySelector('#hf .hf-n').textContent, btn: document.querySelector('#hf .hf-btn').disabled }));
    esit(JSON.stringify(t2.chip), JSON.stringify(['X', '9', '8']), 'dokunarak konan okların puanı'); esit(t2.top, '27', 'seri toplamı'); esit(t2.btn, false, 'SERİYE YAZ açık olmalı');
    // büyük ekranda oka kısa dokun = sil, geri al = geri gelir
    await p.locator('#hf .hf-spot').nth(0).click(); await p.waitForSelector('#hf-b-cv');
    const r0 = await p.evaluate(() => { const b = document.getElementById('hf-b-cv').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width }; });
    await p.mouse.click(r0.x + (0 / 68 + 1) / 2 * r0.w, r0.y + (2 / 68 + 1) / 2 * r0.w); await p.waitForTimeout(80);
    esit(await p.evaluate(() => _hfIc.durum().oklar.length), 2, 'oka kısa dokunuş silmeli');
    await p.click('#hf-buyuk >> text=↶'); await p.click('#hf-buyuk >> text=✓ TAMAM'); await p.waitForTimeout(100);
    esit(await p.evaluate(() => _hfIc.durum().oklar.length), 3, 'geri al oku geri getirmeli');

    // SERİYE YAZ → Skor Gir'in kaydı
    await p.click('#hf >> text=✓ SERİYE YAZ'); await p.waitForTimeout(400);
    const t3 = await p.evaluate(([g, ad]) => { const sp = turnuvaDB[g][ad], s = sp.seriler[sp.seriler.length - 1], d = sp.detayliOklar.slice(-3); return { n: sp.seriler.length, puan: s.puan, oklar: s.oklar, d: d.map((o) => ({ p: o.puan, spot: o.spot, y: o.y, t: !!o.t, foto: o.foto })), akis: _hfIc.durum() && _hfIc.durum().akis }; }, [g, ad]);
    esit(t3.n, (await p.evaluate(() => _hfTestOnce.seri)) + 1, 'seri eklenmedi'); esit(t3.puan, 27, 'kaydedilen seri puanı'); esit(JSON.stringify(t3.oklar), JSON.stringify(['X', '9', '8']), 'kaydedilen oklar');
    dogrula(t3.d.every((o) => o.t && o.foto === 1), 'detayliOklar zaman/foto işareti yok'); esit(JSON.stringify(t3.d.map((o) => o.spot)), '[0,1,2]', 'spot numaraları');
    dogrula(t3.d[0].y < -100 && Math.abs(t3.d[1].y) < 20 && t3.d[2].y > 100, '3\'lü spot y kaydırması yanlış: ' + JSON.stringify(t3.d.map((o) => o.y)));
    esit(t3.akis, 'kamera', 'kayıttan sonra sıradaki seri için kameraya dönmeli');

    // ③ ikinci fotoğraf: eski delikler + ilk serinin okları (çekildi, delik kaldı) + yeni oklar (gövdeli) → öneri
    const ilk = await p.evaluate(() => _hfIc.durum().onceki[0].oklar.length);
    esit(ilk, 1, 'önceki fotoğraf bilgisi saklanmadı');
    const yeni = [[-15, 0], [0, 25], [-25, -25]];
    await p.evaluate(([eski, h, yeni]) => _hfIc.fotoIsle(_hfTestFoto(eski.map((e, s) => e.concat([h[s]], [[yeni[s][0], yeni[s][1], true]])))), [eski, hedefler, yeni]);
    await p.waitForTimeout(300);
    const t4 = await p.evaluate(() => _hfIc.durum().oklar.map((o) => ({ s: o.s, u: o.u, v: o.v, oneri: o.oneri })));
    log('öneriler: ' + JSON.stringify(t4.map((o) => [o.s, o.u.toFixed(1), o.v.toFixed(1)])));
    esit(t4.length, 3, 'her spotta bir yeni ok önerilmeli');
    // öneriler dönmüş çerçevede (simetrik M) — mesafe/puan korunur
    const pu = await p.evaluate(() => [...document.querySelectorAll('#hf .hf-toplam .hf-chip')].map((e) => e.textContent));
    esit(JSON.stringify(pu), JSON.stringify(['9', '8', '7']), 'önerilen okların puanı ' + JSON.stringify(t4.map((o) => [o.s, +o.u.toFixed(1), +o.v.toFixed(1)])));
    dogrula(await p.evaluate(() => document.querySelectorAll('#hf .hf-chip.oneri').length >= 3), 'öneriler işaretli (kesikli) değil');
    await p.click('#hf >> text=✓ SERİYE YAZ'); await p.waitForTimeout(400);
    esit(await p.evaluate(([g, ad]) => turnuvaDB[g][ad].seriler[turnuvaDB[g][ad].seriler.length - 1].puan, [g, ad]), 24, 'ikinci seri puanı');

    // ④ v374 İLK FOTOĞRAF: önceki fotoğraf yok, oklar hedefte (gövdeli) → halka arka plan modeliyle bulunur; eski delikler önerilmez.
    // Spot 2'deki ok tam 8/7 çizgisinde (r = 30) → kırmızı ? (emin değil).
    const ilkOk = [[-15, 0], [0, 30], [-25, -25]];
    await p.evaluate(([eski, ilkOk]) => { _hfIc.durum().onceki = {}; _hfIc.fotoIsle(_hfTestFoto(eski.map((e, s) => e.concat([[ilkOk[s][0], ilkOk[s][1], true]])))); }, [eski, ilkOk]);
    await p.waitForTimeout(300);
    const t7 = await p.evaluate(() => _hfIc.durum().oklar.map((o) => ({ s: o.s, u: o.u, v: o.v, sup: o.supheli })));
    log('ilk fotoğraf: ' + JSON.stringify(t7.map((o) => [o.s, +o.u.toFixed(1), +o.v.toFixed(1), o.sup])));
    esit(t7.length, 3, 'ilk fotoğrafta her spotta bir ok bulunmalı');
    // çerçeve fotoğraftaki dönmeyi korumaz (simetrik M) → merkeze uzaklık (= puan) karşılaştırılır
    t7.forEach((o) => { const g = ilkOk[o.s], r = Math.hypot(o.u, o.v), rg = Math.hypot(g[0], g[1]); dogrula(Math.abs(r - rg) < 2, `spot ${o.s + 1} okunun merkeze uzaklığı ${r.toFixed(1)} ≠ ${rg.toFixed(1)}`); });
    esit(t7.find((o) => o.s === 1).sup, 'çizgide', 'çizgideki ok ? ile işaretlenmeli');
    dogrula(t7.filter((o) => o.s !== 1).every((o) => !o.sup), 'çizgide olmayan oklar emin olmalı');
    dogrula(await p.evaluate(() => document.querySelectorAll('#hf .hf-toplam .hf-chip.supheli').length === 1 && /emin değil/.test(document.getElementById('hf').textContent)), 'emin değil uyarısı / ? çipi yok');

    // ⑤ v374 Vegas 3'lü (üçgen): tür seçici → spotlar üçgende bulunur, sıra üstteki → soldaki → sağdaki
    await p.evaluate(() => { hfGeri(); });
    await p.waitForSelector('#hf .hf-tur');
    await p.locator('#hf .hf-tur', { hasText: 'Vegas' }).click(); await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => /VEGAS 3'LÜ/.test(document.getElementById('hf').textContent) && _hfIc.durum().yerlesim === 'ucgen'), 'Vegas seçilmedi');
    await p.evaluate(() => _hfIc.fotoIsle(_hfTestFoto([[], [], []], true))); await p.waitForTimeout(250);
    const t8 = await p.evaluate(() => { const d = _hfIc.durum(); return { akis: d.akis, sp: d.spotlar.map((s) => [Math.round(s.x), Math.round(s.y)]) }; });
    esit(t8.akis, 'duzelt', 'Vegas: düzelt ekranına geçmedi'); esit(t8.sp.length, 3, 'Vegas: 3 spot');
    dogrula(t8.sp[0][1] < t8.sp[1][1] && t8.sp[1][0] < t8.sp[2][0], 'Vegas spot sırası yanlış: ' + JSON.stringify(t8.sp));
    await p.evaluate(() => { hfGeri(); hfTipSec('3spot', 'dikey'); });

    // M (ıska) + eksik ok: 2 ok + 1 M
    await p.evaluate(([eski]) => _hfIc.fotoIsle(_hfTestFoto(eski)), [eski]); await p.waitForTimeout(200);
    await p.evaluate(() => { const d = _hfIc.durum(); d.oklar = [{ s: 0, u: 0, v: 0 }, { s: 1, u: 0, v: 15 }]; hfM(1); });
    const t5 = await p.evaluate(() => ({ chip: [...document.querySelectorAll('#hf .hf-toplam .hf-chip')].map((e) => e.textContent), btn: document.querySelector('#hf .hf-btn').disabled }));
    esit(JSON.stringify(t5.chip), JSON.stringify(['X', '9', 'M']), 'M eklenince'); esit(t5.btn, false, 'M ile seri tamam olmalı');
    await p.evaluate(() => hfGeri()); // kaydetmeden çık (onay penceresi) → kamera
    await p.waitForTimeout(150);

    // grup analizi
    // v376 saf kararlar: nişangâh, bulma başarısı
    const kr = await p.evaluate(() => { const K = _hfIc.nisanKarar, O = _hfIc.dogrulukOlc; return {
      az: K({ u: 20, v: 0, r: 5, cap: 10 }, 3).tur, orta: K({ u: 1, v: 1, r: 5, cap: 10 }, 12).tur, oynat: K({ u: 12, v: 0, r: 6, cap: 12 }, 12), rast: K({ u: 8, v: 0, r: 30, cap: 60 }, 8).tur,
      olc: O([{ s: 0, u: 0, v: 0 }, { s: 0, u: 20, v: 20 }, { s: 1, u: 5, v: 5 }], [{ s: 0, u: 1, v: 1 }, { s: 0, u: 30, v: 30 }, { s: 0, u: 5, v: 5 }]) }; });
    esit(kr.az, 'az', '6 oktan az karar verilmemeli'); esit(kr.orta, 'ortada', 'ortadaki grup'); esit(kr.oynat.tur, 'oynat', 'tutarlı kayma'); esit(kr.oynat.yon.yazi, 'sağ', 'kayma yönü'); esit(kr.rast, 'rastgele', 'dağınık grupta nişangâh oynatılmamalı');
    esit(JSON.stringify(kr.olc), JSON.stringify({ onerilen: 3, kaydedilen: 3, dogru: 1 }), 'bulma başarısı: başka spot ve uzak ok doğru sayılmamalı');
    await p.evaluate(() => hfAnaliz()); await p.waitForTimeout(200);
    dogrula(await p.locator('#hf-nisan-karar').isVisible(), 'nişangâh kartı yok');
    dogrula(await p.locator('#hf-basari').isVisible(), 'bulma başarısı kartı yok (seri yazılmıştı)');
    const dg = await p.evaluate(() => JSON.parse(localStorage.getItem('dagsk_hf_dogruluk') || '[]'));
    dogrula(dg.length > 0 && dg.every((x) => x.dogru <= x.kaydedilen), 'bulma başarısı kaydı yok');
    const t6 = await p.evaluate(() => { const h = document.getElementById('hf'); return { t: h.textContent, svg: !!h.querySelector('svg'), veli: h.querySelector('.hf-btn') && !h.querySelector('.hf-btn').disabled, metin: _hfIc.durum().analizMetin }; });
    dogrula(/GRUP ANALİZİ/.test(t6.t) && /Grup çapı/.test(t6.t) && /halka/.test(t6.t), 'analiz ekranı eksik');
    dogrula(t6.svg && t6.veli, 'analizde hedef çizimi ya da veliye gönder yok'); dogrula(/antrenman özeti/.test(t6.metin) && /Grup çapı/.test(t6.metin), 'veli metni eksik');

    // telefon (390 px): düzelt ekranı taşmasın
    await p.setViewportSize({ width: 390, height: 844 });
    await p.evaluate(([eski]) => _hfIc.fotoIsle(_hfTestFoto(eski)), [eski]); await p.waitForTimeout(250);
    const tasma = await p.evaluate(() => { const h = document.getElementById('hf'); return [...h.querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > 391; }).map((e) => e.className || e.tagName).slice(0, 5); });
    esit(JSON.stringify(tasma), '[]', '390 px\'te taşan öğe var');
    if (process.env.E2E_EKRAN) await p.screenshot({ path: process.env.E2E_EKRAN });
    await p.evaluate(() => hfKapat());
    dogrula(await p.evaluate(() => !document.getElementById('hf')), 'kapatınca ekran kalmamalı');
    dogrula(hatalar.length === 0, 'sayfa hataları: ' + hatalar.join(' | '));
  } finally {
    if (geriAl) await p.evaluate(([g, ad]) => {
      const sp = turnuvaDB[g] && turnuvaDB[g][ad], o = window._hfTestOnce; if (!sp || !o) return;
      const ekli = sp.seriler.slice(o.seri); sp.seriler = sp.seriler.slice(0, o.seri); sp.detayliOklar = (sp.detayliOklar || []).slice(0, o.detay); sp.devamModu = o.devam;
      try { seriIptalEkle(ekli.map((s) => s.seriId).filter(Boolean)); } catch (e) { }
      try { sporcuPuanlariYenidenHesapla(sp); } catch (e) { } localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB));
    }, geriAl).catch(() => { });
    await ctx.close();
  }
}
