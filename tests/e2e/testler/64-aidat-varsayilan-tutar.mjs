// 💰 Aidat varsayılan tutarı kulüp geneli (2026-10-26, kullanıcı: "ödemeyenlerin ödemesi gereken tutarı girdim ama yansıtmıyor, 8 sporcu
// ödemedi diyor ama rakamı göstermiyor"). Eskiden varsayılan tutar yalnız girildiği cihazda kalıyordu. Doğrulanır: ödenmemiş kayda yazılan
// tutar bekleyene girer; "tutarı belli değil" uyarısındaki kutu tutarı kaydeder ve panel hemen hesaplar; DAĞ'da tutar sunucuya
// (meta aidat_ayar) yazılır ve başka cihaz (boş yerel) onu alır. Meta ve yerel değerler sonunda geri yüklenir.
import { sayfaAc, uygulamaAc, api, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const n = new Date(), ay = n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0');
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  const metaYedek = (await api('/api/meta/aidat_ayar')).d;
  let yerelYedek = null;
  try {
    await uygulamaAc(p);
    await p.evaluate(() => dagskEkYukle(YN_DOSYA));
    await p.waitForFunction(() => typeof apOzet === 'function' && typeof apCiz === 'function', null, { timeout: 20000 });

    // 1) ödenmemiş kayda yazılan tutar = o ay beklenen (varsayılan boşken bile)
    const h = await p.evaluate((ay) => {
      let kayit = { ['A|' + ay]: { odendi: false, tutar: 900 } };
      let a = { kisiler: () => [{ id: 'g|A', ad: 'A', grup: 'g', katilma: '2026-01-01' }, { id: 'g|B', ad: 'B', grup: 'g', katilma: '2026-01-01' }], kayit: (ad, m) => kayit[ad + '|' + m] || null, aylik: () => 0 };
      let v = apOzet(a, ay); return { bek: v.bek.length, bekTL: v.bekTL };
    }, ay);
    dogrula(h.bek === 2 && h.bekTL === 900, 'ödenmemiş kayıttaki tutar bekleyene girmeli: ' + JSON.stringify(h));

    // 2) uyarıdaki kutu: tutar yazılınca bekleyen hemen hesaplanır
    const k = await p.evaluate(async (ay) => {
      let vt = 0, yazildi = null, kayit = {};
      let a = { kisiler: () => [1, 2, 3].map((i) => ({ id: 'g|K' + i, ad: 'K' + i, grup: 'g', katilma: '2026-01-01' })), kayit: (ad, m) => kayit[ad + '|' + m] || null, aylik: () => vt,
        varsayilanTutar: () => vt, varsayilanTutarYaz: async (v) => { vt = v; yazildi = v; } };
      let el = document.createElement('div'); el.id = 'test-ap'; document.body.appendChild(el);
      AP.ay = ay; AP.grup = 'tumu'; apCiz(el, a);
      let once = { kutu: !!el.querySelector('#ap-vt'), uyari: /tutarı belli değil/.test(el.textContent) };
      el.querySelector('#ap-vt').value = '750'; await apVarsayilanKaydet();
      let sonra = { yazildi, uyari: /tutarı belli değil/.test(el.textContent), bek: /2\.250₺/.test(el.textContent) };
      el.remove(); AP.el = null; AP.a = null; AP.ay = null;
      return { once, sonra };
    }, ay);
    dogrula(k.once.kutu && k.once.uyari, 'uyarıda tutar kutusu: ' + JSON.stringify(k));
    dogrula(k.sonra.yazildi === 750 && !k.sonra.uyari && k.sonra.bek, 'kaydedince bekleyen 3 × 750: ' + JSON.stringify(k));

    // 3) DAĞ: tutar sunucuya yazılır, başka cihaz (yereli boş) sunucudakini alır
    yerelYedek = await p.evaluate(() => ({ t: localStorage.getItem('okculuk_aidat_tutar'), k: localStorage.getItem('dag_aidat_ayar'), v: aidatVarsayilanTutar }));
    await p.evaluate(async () => { aidatTutarDegis(1234); clearTimeout(_aidatAyarZ); await aidatVarsayilanSenkron(true); });
    const sunucu = (await api('/api/meta/aidat_ayar')).d;
    dogrula(sunucu && sunucu.value && JSON.parse(sunucu.value).tutar.v === 1234, 'sunucuda varsayılan tutar: ' + JSON.stringify(sunucu));
    const diger = await p.evaluate(async () => { localStorage.removeItem('dag_aidat_ayar'); localStorage.removeItem('okculuk_aidat_tutar'); aidatVarsayilanTutar = 0; let d = await aidatVarsayilanSenkron(false); return { d, v: aidatVarsayilanTutar, yerel: localStorage.getItem('okculuk_aidat_tutar') }; });
    dogrula(diger.d === true && diger.v === 1234 && diger.yerel === '1234', 'başka cihaz sunucudaki tutarı almalı: ' + JSON.stringify(diger));
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('ödenmemiş kayıttaki tutar bekleyene girer · uyarıdaki kutu tutarı kaydeder, panel 3 × 750 = 2.250₺ · DAĞ tutarı sunucuya yazar, başka cihaz alır');
  } finally {
    await api('/api/meta/aidat_ayar', { method: 'PUT', body: JSON.stringify({ value: metaYedek && metaYedek.value != null ? metaYedek.value : '{}' }) }).catch(() => {});
    if (yerelYedek) await p.evaluate((y) => { if (y.t != null) localStorage.setItem('okculuk_aidat_tutar', y.t); else localStorage.removeItem('okculuk_aidat_tutar'); if (y.k != null) localStorage.setItem('dag_aidat_ayar', y.k); else localStorage.removeItem('dag_aidat_ayar'); aidatVarsayilanTutar = y.v; }, yerelYedek).catch(() => {});
    await ctx.close();
  }
}
