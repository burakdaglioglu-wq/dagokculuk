// 🧭 Ders Paneli (2026-10-14, kullanıcı: "tek ekrandan ders yönetimi — önemli bir buton olsun"). Sınıf kartındaki büyük
// düğme paneli açar; satırdan yoklama (geldi/yok), hat (Oyun/Yarışma), Yarışma'dakine "Yumurtada da", dersten çıkarma.
// Yoklama/hat/yumurta/ders listesi sonunda geri yüklenir.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 860 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'skor');
    yedek = await p.evaluate(() => ({ liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()), yuva: localStorage.getItem('dag_km_yuvaliste_' + (_kmAktifKonum || 'varsayilan')), yok: JSON.stringify(otomatikYoklamaDB[bugunISO()] || {}) }));
    const k = await p.evaluate(() => {
      _kmListe = _kmListe.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).slice(0, 4); localStorage.removeItem(kmHatAnahtari());
      kmGeri(); document.getElementById('karisik-platform').style.display = 'flex'; document.getElementById('km-icerik').style.display = 'none'; document.getElementById('km-sinif-karti').style.display = ''; kmSinifKartiCiz();
      const s = _kmListe.slice().sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))[0]; delete (otomatikYoklamaDB[bugunISO()] || {})[s.ad]; kmSinifKartiCiz(); return s;
    });
    await p.locator('.km-dp-buton').click();
    await p.waitForSelector('#km-dp .km-dp-sat', { timeout: 15000 });
    esit(await p.locator('#km-dp .km-dp-sat').count(), 4, 'panelde 4 sporcu olmalı');
    const sat = p.locator('#km-dp .km-dp-sat').first();
    // yoklama: Geldi → kayıt
    await sat.locator('button', { hasText: 'Geldi' }).click();
    esit(await p.evaluate((s) => { const y = (otomatikYoklamaDB[bugunISO()] || {})[s.ad]; return y && y.geldi !== false && y.grup === s.g; }, k), true, 'geldi yazılmadı');
    // hat: Yarışma → kmHat; "Yumurtada da" kutusu → yuvaliste 'ek'
    await p.locator('#km-dp .km-dp-sat').first().locator('button', { hasText: 'Yarışma' }).click();
    esit(await p.evaluate((s) => kmHat(s.g, s.ad), k), 'yarisma', 'hat Yarışma olmadı');
    await p.locator('#km-dp .km-dp-sat').first().locator('input[type=checkbox]').check();
    esit(await p.evaluate((s) => JSON.parse(localStorage.getItem('dag_km_yuvaliste_' + (_kmAktifKonum || 'varsayilan')) || '{}')[s.g + '|' + s.ad], k), 'ek', 'yumurtada da işaretlenmedi');
    // dersten çıkar → onay → liste 3
    await p.locator('#km-dp .km-dp-sat').first().locator('.km-dp-cik').click();
    await p.locator('#onay-evet-btn').click();
    await p.waitForTimeout(300);
    esit(await p.locator('#km-dp .km-dp-sat').count(), 3, 'çıkarılınca panelde 3 kalmalı');
    esit(await p.evaluate(() => _kmListe.length), 3, 'ders listesinden çıkmadı');
    // araca geçiş: Yarışma → panel kapanır, araç açılır
    await p.locator('#km-dp .km-dp-is', { hasText: 'Yarışma' }).click();
    await p.waitForTimeout(800);
    dogrula(!(await p.locator('#km-dp').count()) && await p.evaluate(() => _kmAktifSekme === 'yarisma'), 'Yarışma\'ya geçilmedi');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('panel: yoklama, hat, yumurtada da, dersten çıkar, Yarışma\'ya geçiş');
  } finally {
    if (yedek) await p.evaluate((y) => {
      try { kmDpKapat(); } catch (e) {}
      _kmListe = JSON.parse(y.liste); _kmListeKaydet();
      if (y.hat) localStorage.setItem(kmHatAnahtari(), y.hat); else localStorage.removeItem(kmHatAnahtari());
      const yk = 'dag_km_yuvaliste_' + (_kmAktifKonum || 'varsayilan'); if (y.yuva) localStorage.setItem(yk, y.yuva); else localStorage.removeItem(yk);
      otomatikYoklamaDB[bugunISO()] = JSON.parse(y.yok); otomatikYoklamaKaydet();
    }, yedek).catch(() => {});
    await p.waitForTimeout(2500);
    await ctx.close();
  }
}
