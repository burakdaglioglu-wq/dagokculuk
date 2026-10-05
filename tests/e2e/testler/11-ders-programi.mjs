// Ders programına kalıcı ekle/çıkar (2026-10-04): programdan başlatılan ders sürerken "Sporcu ekle" penceresinde 📌 düğmeleri;
// programda olmayan biri eklenince "programa da kaydedeyim mi?" sorusu → onaylayınca ders programına yazılır; 📌 ile geri çıkarılır.
// Test sonunda yerel ders programı eski haline döner.
import { dogrula, esit, sayfaAc, uygulamaAc, karisikSinifArac } from '../yardimci.mjs';
export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'skor', null);
    // bugünün haftanın gününe ait, kayıtlı sporcusu olan bir ders + o derste olmayan bir sporcu
    const h = await p.evaluate(async () => {
      let sl = await kmProgramSlotlariGetir(), gd = new Date().getDay();
      let s = sl.find(x => (x.gunler && x.gunler.length ? x.gunler : [x.gun]).map(Number).includes(gd) && kmDersSporculari(x).length);
      // bugün dersi olmayan günlerde (yerel test verisi) herhangi bir günün dersiyle dene — akış günden bağımsız
      if (!s) s = sl.find(x => kmDersSporculari(x).length);
      if (!s) return null;
      let prog = kmDersSporculari(s), disarida = Object.keys(turnuvaDB).flatMap(g => Object.keys(turnuvaDB[g] || {}).filter(ad => !turnuvaDB[g][ad].pasif).map(ad => ({ g, ad }))).find(k => !prog.some(x => x.g === k.g && x.ad === k.ad));
      return { id: s.id, ad: s.grup, bas: s.baslangicSaat, prog: prog.map(k => k.ad), ham: (s.katilimcilar || []).length, disarida };
    });
    log('ders: ' + JSON.stringify(h));
    dogrula(h && h.disarida, 'uygun ders/sporcu yok');
    await p.evaluate(id => kmProgramDersBaslat(id), h.id); await p.waitForTimeout(1500);
    esit(await p.evaluate(() => !!kmDersSlot()), true, 'ders bağlantısı');
    // ders sürerken "Sporcu ekle": 📌 düğmeleri + açıklama
    await p.evaluate(() => kmSporcuEkle()); await p.waitForTimeout(1500);
    await p.waitForSelector('.kmp-pin', { timeout: 10000 });
    log('pin sayısı: ' + await p.locator('.kmp-pin').count() + ' · programda: ' + await p.locator('.kmp-pin.var').count());
    dogrula(await p.locator('.kmp-ortaders').count() === 1, 'ders açıklaması yok');
    // programda olmayanı bugüne ekle → onayla → soru
    await p.evaluate(k => { _kmSecimler[k.g + '_' + k.ad] = k; }, h.disarida);
    await p.evaluate(() => kmBaslat()); await p.waitForTimeout(2500);
    dogrula(await p.locator('#onay-modal').isVisible(), 'program sorusu çıkmadı');
    log('soru: ' + (await p.locator('#onay-mesaj').innerText()).replace(/\n/g, ' | ').slice(0, 220));
    await p.locator('#onay-evet-btn').click(); await p.waitForTimeout(2000);
    const sonra = await p.evaluate(async (id) => { _kmProgramOnbellek.t = 0; let sl = await kmProgramSlotlariGetir(); return (sl.find(x => x.id === id).katilimcilar || []).map(k => k.ad); }, h.id);
    dogrula(sonra.includes(h.disarida.ad), 'programa eklenmedi: ' + sonra.join(','));
    esit(await p.evaluate(() => !!kmDersSlot()), true, 'ders bağlantısı korunmalı');
    log('programa eklendi ✓ (' + sonra.length + ' kişi)');
    // 📌 ile programdan çıkar (temizlik) → modalda
    await p.evaluate(() => kmSporcuEkle()); await p.waitForTimeout(1500);
    await p.evaluate(k => kmProgramPinDegis(encodeURIComponent(k.g), encodeURIComponent(k.ad)), h.disarida); await p.waitForTimeout(400);
    await p.locator('#onay-evet-btn').click(); await p.waitForTimeout(2000);
    const son = await p.evaluate(async (id) => { _kmProgramOnbellek.t = 0; let sl = await kmProgramSlotlariGetir(); return (sl.find(x => x.id === id).katilimcilar || []).map(k => k.ad); }, h.id);
    dogrula(!son.includes(h.disarida.ad), '📌 ile programdan çıkmadı');
    esit(son.length, h.ham, 'program eski haline döndü');
    log('📌 programdan çıkarma ✓ · program eski haline döndü');
    await p.evaluate(() => { document.getElementById('karisik-modal').style.display = 'none'; document.getElementById('karisik-platform').style.display = 'flex'; });
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
  } finally { await ctx.close(); }
}
