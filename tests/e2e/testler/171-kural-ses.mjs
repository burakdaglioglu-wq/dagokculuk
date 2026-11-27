// 🔊 Kural ekranı doğal ses (2026-11-28, v473; kullanıcı: "seslendirme o kadar kötü ki heceleyerek söylüyor, ses tonu gerçek değil").
// "NASIL OYNANIR?" artık tarayıcı sesi yerine önceden kaydedilmiş doğal sesi çalar (/ses/kural/<tema>.mp3); dosya çalınamazsa eski sese düşer.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1366, yukseklik: 768 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.evaluate(() => { localStorage.removeItem('dag_km_oyun_sessiz'); kmOyunTemaSec('blok'); });
    await p.waitForFunction(() => typeof anKural === 'function' && !!document.querySelector('#km-oyun-wrap .km-oyun-scene'), null, { timeout: 20000 });

    // 12 kural dosyası sunucuda gerçekten mp3 olarak duruyor
    const dosyalar = await p.evaluate(async () => {
      const t = ['topsavasi', 'kacis', 'filo', 'catikosu', 'ejderkule', 'zombi', 'tahta', 'timsah', 'bomba', 'blok', 'canavar', 'hapsirik'];
      const r = await Promise.all(t.map((k) => fetch('/ses/kural/' + k + '.mp3?v=2').then((x) => [k, x.status, x.headers.get('content-type'), Number(x.headers.get('content-length') || 0)])));
      return r.filter((x) => x[1] !== 200 || !/audio\/mpeg/.test(x[2]));
    });
    esit(dosyalar.length, 0, 'bütün kural sesleri 200 + audio/mpeg olmalı: ' + JSON.stringify(dosyalar));

    // Audio + konuşma motorunu izle
    await p.evaluate(() => {
      window.__ses = []; window.__konus = [];
      const A = window.Audio;
      window.Audio = function (src) { const a = new A(src); const kayit = { src, durdu: false }; window.__ses.push(kayit); a.play = () => Promise.resolve(); a.pause = () => { kayit.durdu = true; }; return a; };
      if (window.speechSynthesis) speechSynthesis.speak = (u) => { window.__konus.push(u.text); };
    });
    await p.evaluate(() => { document.querySelectorAll('.an-kural').forEach((x) => x.remove()); anKural('blok', true); });
    await p.waitForSelector('.an-kural .an-k-tekrar');
    await p.waitForTimeout(900);
    let s = await p.evaluate(() => ({ ses: window.__ses.map((x) => x.src), konus: window.__konus.length }));
    esit(s.ses.length, 1, 'kural açılınca bir kez kayıt çalmalı');
    dogrula(/\/ses\/kural\/blok\.mp3\?v=\d+$/.test(s.ses[0]), 'doğru dosya çalmalı: ' + s.ses[0]);
    esit(s.konus, 0, 'kayıt çalarken robot ses konuşmamalı');
    await p.screenshot({ path: 'tests/e2e/_cikti/171-kural.png' });

    // Tekrar dinle → öncekini durdurur, yeniden çalar
    await p.locator('.an-kural .an-k-tekrar').click();
    s = await p.evaluate(() => ({ n: window.__ses.length, ilkDurdu: window.__ses[0].durdu }));
    esit(s.n, 2, 'Tekrar dinle kaydı yeniden çalmalı'); dogrula(s.ilkDurdu, 'önceki kayıt durmalı');

    // Başlayalım → ses kesilir
    await p.locator('.an-kural .an-k-basla').click();
    s = await p.evaluate(() => ({ durdu: window.__ses[1].durdu, acik: !!document.querySelector('.an-kural') }));
    dogrula(s.durdu, 'kural kapanınca ses durmalı'); dogrula(!s.acik, 'kural ekranı kapanmalı');

    // dosya çalınamazsa (çevrimdışı) eski sese düşer
    await p.evaluate(() => { window.Audio = function () { return { play: () => Promise.reject(new Error('yok')), pause() { } }; }; });
    await p.evaluate(() => anKural('canavar', true));
    await p.waitForTimeout(900);
    const k = await p.evaluate(() => window.__konus.slice());
    esit(k.length, 1, 'kayıt çalınamazsa tarayıcı sesi devreye girmeli');
    dogrula(/canavar/i.test(k[0]), 'yedek ses doğru kuralı okumalı');
    await p.evaluate(() => anKuralKapat());

    // sessiz modda hiç ses yok
    await p.evaluate(() => { localStorage.setItem('dag_km_oyun_sessiz', '1'); window.__ses = []; window.__konus = []; window.Audio = function (src) { window.__ses.push({ src }); return { play: () => Promise.resolve(), pause() { } }; }; anKural('blok', true); });
    await p.waitForTimeout(900);
    const z = await p.evaluate(() => ({ s: window.__ses.length, k: window.__konus.length }));
    esit(z.s + z.k, 0, 'sessizde hiç ses çıkmamalı');
    await p.evaluate(() => { localStorage.removeItem('dag_km_oyun_sessiz'); anKuralKapat(); });

    dogrula(hatalar.length === 0, 'sayfa hatası olmamalı: ' + hatalar.join(' | '));
    log('kural sesi: 12 dosya, kayıt çalıyor, tekrar/kapat, yedek ses, sessiz ✓');
  } finally { await ctx.close(); }
}
