// 🎙️ Seri sonu spiker (2026-11-28, v475; kullanıcı: "skor vurduğumda 'Burak canavarı güçlü vurdu' sesi hâlâ eski, her sporcu için farklı cümleler kursun").
// Ad ayrı kayıt (/ses/ad/<slug>.mp3) + oyunun kademesinden rastgele cümle (/ses/an/<tema>-<k>-<j>.mp3); sesi olmayan oyunda yeni cümleler tarayıcı sesiyle.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.evaluate(() => { localStorage.removeItem('dag_km_oyun_sessiz'); localStorage.removeItem('dag_km_an_kapali'); kmOyunTemaSec('blok'); });
    await p.waitForFunction(() => typeof anSeriGoster === 'function' && !!window.AN_CUMLE && !!document.querySelector('#km-oyun-wrap .km-oyun-scene'), null, { timeout: 20000 });
    esit(await p.evaluate(() => window.anAdSlug('Çağrı Şükrü  Yılmaz')), 'cagri-sukru-yilmaz', 'ad soyad dosya adı Türkçe harfleri sadeleştirmeli (v476)');
    const var_ = await p.evaluate(() => fetch('/ses/an/var.json?v=1').then((r) => r.json()));
    dogrula(var_.blok && var_.blok.every((k) => k.length === 6), 'blok: 3 kademede 6 cümle sesi hazır olmalı');
    await p.evaluate(() => new Promise((r) => setTimeout(r, 400))); // var.json yüklensin

    await p.evaluate(() => {
      window.__ses = []; window.__konus = [];
      const A = window.Audio;
      window.Audio = function (src) { const a = new A(src); const k = { src }; window.__ses.push(k); a.play = () => { k.caldi = true; setTimeout(() => a.onended && a.onended(), 20); return Promise.resolve(); }; return a; };
      if (window.speechSynthesis) speechSynthesis.speak = (u) => { window.__konus.push(u.text); };
      document.querySelectorAll('.an-kural').forEach((x) => x.remove());
    });
    const seri = async (tema, ad, oklar) => {
      await p.evaluate(({ tema, ad, oklar }) => new Promise((r) => { window.__ses = []; window.__konus = []; const s = Object.assign({}, _kmOyunRosterCache[0], { ad }); anSeriGoster(tema, s, oklar, r); }), { tema, ad, oklar });
      await p.waitForTimeout(400);
      return p.evaluate(() => ({ ses: window.__ses.map((x) => [x.src.replace(/^https?:\/\/[^/]+/, ''), !!x.caldi]), konus: window.__konus.slice(), alt: (document.querySelector('.an-perde .an-alt') || {}).textContent || window.__sonAlt || '' }));
    };
    await p.evaluate(() => { window.__sonAlt = ''; const o = new MutationObserver(() => { const a = document.querySelector('.an-perde .an-alt'); if (a && a.textContent) window.__sonAlt = a.textContent; }); o.observe(document.body, { subtree: true, childList: true, characterData: true }); });

    // iyi seri, adı kayıtlı sporcu → önce ad, sonra blok-0-j
    let r = await seri('blok', 'Burak Test', ['X', '10', '9']);
    const adS = r.ses.find((x) => /\/ses\/ad\//.test(x[0])), cS = r.ses.find((x) => /\/ses\/an\//.test(x[0]));
    dogrula(adS && /\/ses\/ad\/burak-test\.mp3\?v=\d+$/.test(adS[0]), 'önce ad-soyad kaydı istenmeli (v476): ' + JSON.stringify(r.ses));
    dogrula(cS && /\/ses\/an\/blok-0-[0-5]\.mp3\?v=\d+$/.test(cS[0]) && cS[1], 'iyi seri cümlesi çalmalı: ' + JSON.stringify(r.ses));
    esit(r.konus.length, 0, 'kayıt varken robot ses konuşmamalı');
    dogrula(/^Burak Test! /.test(r.alt), 'ekranda "Ad Soyad! cümle" yazmalı: ' + r.alt);
    await p.screenshot({ path: 'tests/e2e/_cikti/172-spiker.png' });

    // zayıf seri → kademe 2; adı kayıtsız sporcu → ad dosyası 404, yine de cümle çalar
    r = await seri('blok', 'Zzyx', ['1', 'M', '2']);
    const c2 = r.ses.find((x) => /\/ses\/an\//.test(x[0]));
    dogrula(c2 && /blok-2-\d\.mp3/.test(c2[0]) && c2[1], 'adı kayıtsız sporcuda da cümle çalmalı: ' + JSON.stringify(r.ses));

    // aynı kademede art arda 3 seri → 3 farklı cümle
    const secilen = new Set();
    for (let i = 0; i < 3; i++) { const x = await seri('blok', 'Burak', ['8', '7', '9']); const c = x.ses.find((y) => /\/ses\/an\//.test(y[0])); secilen.add(c && c[0]); }
    esit(secilen.size, 3, 'art arda cümleler tekrar etmemeli: ' + [...secilen].join(' '));

    // sesi henüz üretilmemiş oyun → yeni cümle havuzundan, tarayıcı sesiyle
    const vj = await p.evaluate(() => fetch('/ses/an/var.json?v=1').then((r) => r.json()));
    const t2 = Object.keys(await p.evaluate(() => window.AN_CUMLE)).find((t) => !vj[t]);
    if (t2) {
      r = await seri(t2, 'Elif', ['X', 'X', '9']);
      esit(r.ses.filter((x) => /\/ses\/an\//.test(x[0])).length, 0, t2 + ': ses dosyası istenmemeli');
      esit(r.konus.length, 1, t2 + ': tarayıcı sesi bir kez konuşmalı');
      const havuz = await p.evaluate((t) => window.AN_CUMLE[t][0], t2);
      dogrula(havuz.some((c) => r.konus[0] === 'Elif! ' + c), t2 + ': yeni cümle havuzundan okumalı: ' + r.konus[0]);
    }
    // v476: bütün oyunlar — kendi cümlesi olmayan oyun (ör. yanardag) "genel" havuzdan konuşur
    const g = await p.evaluate(() => { window.__konus = []; window.__ses = []; const ok = window.anSpikerSoyle('yanardag', { ad: 'Elif Kaya', g: 'x' }, ['X', '10', '9']); return new Promise((r) => setTimeout(() => r({ ok, konus: window.__konus.slice(), ses: window.__ses.map((x) => x.src), havuz: window.AN_CUMLE.genel[0] }), 600)); });
    dogrula(g.ok, 'anSpikerSoyle diğer oyunda çalışmalı');
    const genelSesli = !!(vj.genel && vj.genel[0] && vj.genel[0].length);
    if (genelSesli) dogrula(g.ses.some((x) => /\/ses\/an\/genel-0-\d\.mp3/.test(x)), 'genel kayıt çalmalı: ' + g.ses.join(' '));
    else dogrula(g.konus.length === 1 && g.havuz.some((c) => g.konus[0] === 'Elif Kaya! ' + c), 'genel havuzdan ad soyadla okumalı: ' + g.konus.join(' | '));
    // sessizde konuşmaz
    const z = await p.evaluate(() => { localStorage.setItem('dag_km_oyun_sessiz', '1'); const r = window.anSpikerSoyle('yanardag', { ad: 'Elif' }, ['X']); localStorage.removeItem('dag_km_oyun_sessiz'); return r; });
    esit(z, false, 'sessizde spiker konuşmamalı');

    dogrula(hatalar.length === 0, 'sayfa hatası olmamalı: ' + hatalar.join(' | '));
    log('seri spiker: ad + cümle kaydı, kayıtsız ad, tekrar yok, sesi olmayan oyunda yeni cümle (' + (t2 || '-') + ') ✓');
  } finally { await ctx.close(); }
}
