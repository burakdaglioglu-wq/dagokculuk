// Karışık Sınıf › Oyunlar: her tema bireysel + takım modunda açılır, kart ve liderlik çizilir, sıralama modları çalışır.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

const TEMALAR = ['zirve', 'yildiz', 'hazine', 'pist', 'ninja', 'monopoly', 'dag', 'balon', 'hedef', 'futbol', 'futboltakim', 'arena', 'sisharita', 'kehanet', 'gizlikelime', 'kule', 'canavar', 'yukselis'];

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    const sorunlu = [];
    for (const t of TEMALAR) for (const takim of [false, true]) {
      const r = await p.evaluate(([t, takim]) => {
        try {
          kmOyunTemaSec(t);
          if (t !== 'futbol' && t !== 'futboltakim' && typeof kmOyunModSec === 'function') kmOyunModSec(takim);
          kmOyunChipleriCiz(); kmOyunLiderCiz();
          for (const m of ['adil', 'yukselen', 'lig', 'puan']) kmOyunSiralamaModuSec(m);
          kmOyunSporcuIzgaraAcKapat(); kmOyunSporcuIzgaraAcKapat();
          return { ok: !!document.querySelector('#km-oyun-chips .km-sk-kart') && !!document.getElementById('km-oyun-lider-ic') };
        } catch (e) { return { hata: e.message }; }
      }, [t, takim]);
      if (!r.ok) sorunlu.push(`${t}/${takim ? 'takım' : 'bireysel'}: ${r.hata || 'kart/liderlik çizilmedi'}`);
    }
    dogrula(!sorunlu.length, 'sorunlu temalar: ' + sorunlu.join('; '));
    // Kelime Hedefi ayrı dosyada (dagsk-km-kelime.js) — Oyunlar seçicisinden açılınca yüklenmeli ve çizilmeli
    esit(await p.evaluate(() => typeof kmKelimeCiz), 'undefined', 'Kelime Hedefi açılışta yüklenmemeli');
    await p.evaluate(() => kmOyunKelimeAc());
    await p.waitForFunction(() => typeof kmKelimeCiz === 'function', null, { timeout: 20000 });
    await p.waitForTimeout(600);
    dogrula((await p.locator('#km-icerik').innerText()).length > 50, 'Kelime Hedefi çizilmedi');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(`${TEMALAR.length} tema × 2 mod açıldı`);
  } finally { await ctx.close(); }
}
