// Karışık Sınıf › Yoklama: geç yükleme, sekmeler, geldi/gelmedi, ay modu, haftalık+aylık PDF, telefon genişliği.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  for (const [w, h, ad] of [[1280, 900, 'bilgisayar'], [390, 844, 'telefon']]) {
    const { ctx, p, hatalar } = await sayfaAc({ genislik: w, yukseklik: h });
    try {
      await uygulamaAc(p);
      esit(await p.evaluate(() => typeof kmYoklamaAnalizCiz), 'undefined', 'yoklama dosyası açılışta yüklenmemeli');
      await karisikSinifArac(p, 'yoklamaanaliz', 'kmYoklamaAnalizCiz');
      dogrula(await p.locator('.ya-sekmeler').count(), 'yoklama sekmeleri yok');
      // bellek içi (sunucuya yazılmayan) örnek: bir dersin kayıtlısını dün "gelmedi" yap
      const secilen = await p.evaluate(() => {
        let d = new Date(); d.setDate(d.getDate() - 1); let iso = kmYaIso(d), gd = d.getDay();
        let s = _kmYa.slotlar.find((x) => kmYaSlotGunler(x).includes(gd)) || _kmYa.slotlar[0];
        if (!s) return null;
        let k = kmYaSporcular()[0]; s.katilimcilar = [{ grup: k.g, ad: k.ad }];
        if (otomatikYoklamaDB[iso]) delete otomatikYoklamaDB[iso][k.ad];
        kmYaTarihAc(kmYaIso(d)); return k.ad;
      });
      if (secilen) {
        const satir = () => p.locator('.ya-dkart .ya-yk', { hasText: secilen }).first();
        await satir().locator('button.y').click(); await p.waitForTimeout(200);
        dogrula(await p.locator('.ya-dkart .ya-yk.gelmedi', { hasText: secilen }).count(), 'gelmedi işareti uygulanmadı');
        await satir().locator('button.y').click(); await p.waitForTimeout(200);
        dogrula(!(await p.locator('.ya-dkart .ya-yk.gelmedi', { hasText: secilen }).count()), 'gelmedi işareti kaldırılamadı');
      }
      for (const s of ['Sporcular', 'Sayılar', 'Dersler']) { await p.locator('.ya-sekmeler button', { hasText: s }).click(); await p.waitForTimeout(250); }
      await p.locator('.ya-sekmeler button', { hasText: 'Sayılar' }).click(); await p.waitForTimeout(250);
      dogrula(await p.locator('.ya-kart', { hasText: 'Ders doluluğu' }).count(), 'ders doluluk analizi yok');
      await p.locator('.ya-sekmeler button', { hasText: 'Dersler' }).click(); await p.waitForTimeout(200);
      let dl = p.waitForEvent('download', { timeout: 60000 });
      await p.locator('button[onclick="kmYaPdfIndir()"]').click();
      dogrula((await dl).suggestedFilename().startsWith('Yoklama_Raporu_'), 'haftalık PDF inmedi');
      await p.locator('.ya-mod button', { hasText: 'Ay' }).click(); await p.waitForTimeout(400);
      dogrula(await p.locator('.ya-gunhucre:not(.bos)').count() >= 28, 'ay takvimi çizilmedi');
      dl = p.waitForEvent('download', { timeout: 60000 });
      await p.locator('button[onclick="kmYaPdfIndir()"]').click();
      dogrula((await dl).suggestedFilename().startsWith('Aylik_Yoklama_Raporu_'), 'aylık PDF inmedi');
      dogrula(await yataydaTasmaYok(p), `${ad}: sayfa yana taşıyor`);
      esit(hatalar.length, 0, `${ad} sayfa hatası: ` + hatalar.join(' | '));
      log(`${ad}: sekmeler, geldi/gelmedi, ay takvimi, iki PDF tamam`);
    } finally { await ctx.close(); }
  }
}
