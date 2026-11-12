// 🏁 "Dersi Bitir" her ekranda tıklanabilir mi (2026-11-12, kullanıcı: "bazen ders bitire tıklayamıyorum, dün akşam yaşadım").
// Her senaryoda: ⋯ menüsü açılır, "Dersi Bitir" düğmesinin ORTASINDAKİ öğe gerçekten o düğme mi (üstünde bir katman var mı),
// tıklanınca onay penceresi görünür ve "Evet" düğmesi en üstte mi. Onaylamadan iptal edilir (veri değişmez).
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula } from '../yardimci.mjs';

const ustteMi = (p, sec) => p.evaluate((sec) => {
  const el = document.querySelector(sec); if (!el) return { var: false };
  const r = el.getBoundingClientRect(); if (!r.width || !r.height) return { var: true, gorunur: false };
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const ust = document.elementFromPoint(x, y);
  const ad = (n) => n ? (n.id ? '#' + n.id : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/).join('.') : '') + '<' + n.tagName.toLowerCase() + '>' : 'yok';
  let zinc = []; for (let n = ust; n && zinc.length < 5; n = n.parentElement) zinc.push(ad(n));
  return { var: true, gorunur: true, ustte: !!ust && (ust === el || el.contains(ust)), ust: zinc.join(' < '), x: Math.round(x), y: Math.round(y) };
}, sec);

async function dene(p, ad, sonuc) {
  // menüyü aç
  await p.evaluate(() => { const m = document.getElementById('km-menu-acilir'); if (m) m.style.display = 'none'; });
  const btn = await ustteMi(p, '#km-menu-btn');
  let r = { ad, menuBtn: btn };
  if (btn.ustte) {
    await p.locator('#km-menu-btn').click({ timeout: 3000 }).catch((e) => { r.menuHata = e.message.split('\n')[0]; });
    await p.waitForTimeout(200);
    r.bitir = await ustteMi(p, '#km-menu-acilir button[onclick*="kmDersiBitir"]');
    if (r.bitir.ustte) {
      await p.locator('#km-menu-acilir button[onclick*="kmDersiBitir"]').click({ timeout: 3000 }).catch((e) => { r.bitirHata = e.message.split('\n')[0]; });
      await p.waitForTimeout(500);
      r.evet = await ustteMi(p, '#onay-evet-btn');
    }
  }
  await p.evaluate(() => { try { onayKapat(); } catch (e) {} });
  r.tamam = !!(r.evet && r.evet.ustte);
  sonuc.push(r);
  await p.screenshot({ path: 'tests/e2e/_cikti/121-' + ad + '.png' }).catch(() => {});
}

export default async function ({ log }) {
  const sonuc = [];
  for (const [gen, yuk] of [[1180, 820], [390, 844]]) {
    const { ctx, p, hatalar } = await sayfaAc({ genislik: gen, yukseklik: yuk });
    try {
      await uygulamaAc(p);
      await karisikSinifArac(p, 'oyunlar');
      const on = gen + '-';
      for (const tema of ['zombi', 'hapsirik', 'blok']) {
        await p.evaluate((t) => { try { kmOyunTemaSec(t); } catch (e) {} }, tema); await p.waitForTimeout(1500);
        await dene(p, on + 'oyun-' + tema, sonuc);
      }
      await p.evaluate(() => { try { localStorage.setItem('dag_yolculuk_ders_basi', '1'); const st = _ykIc.oku(); st.basGun = ''; _ykIc.yaz(st); ykCiz(); } catch (e) {} }); await p.waitForTimeout(500);
      await dene(p, on + 'yolculuk-karti', sonuc);
      await p.evaluate(() => { try { kmSekme('yarisma'); } catch (e) {} }); await p.waitForTimeout(1500);
      await dene(p, on + 'yarisma', sonuc);
      await p.evaluate(() => { try { kmDersPaneli(); } catch (e) {} }); await p.waitForTimeout(1500);
      // Ders Paneli açıkken üst menü panelin arkasında kalır (beklenen) — panelin kendi "Dersi bitir" düğmesi en üstte olmalı
      const dp = await ustteMi(p, '#km-dp .km-dp-is.tehlike');
      sonuc.push({ ad: on + 'ders-paneli-dugmesi', tamam: !!dp.ustte, dp });
      await p.evaluate(() => { try { kmDpKapat(); } catch (e) {} });
      await p.evaluate(() => { try { kmIzgaraGeriDon(); } catch (e) {} }); await p.waitForTimeout(800);
      await dene(p, on + 'ana', sonuc);
      if (hatalar.length) sonuc.push({ ad: on + 'sayfa-hatasi', tamam: false, hatalar: hatalar.slice(0, 5) });
    } finally { await ctx.close(); }
  }
  const kotu = sonuc.filter((r) => !r.tamam);
  log(sonuc.map((r) => (r.tamam ? '✓ ' : '✗ ') + r.ad).join(' · '));
  dogrula(!kotu.length, 'Dersi Bitir tıklanamadı:\n' + kotu.map((r) => JSON.stringify(r)).join('\n'));
}
