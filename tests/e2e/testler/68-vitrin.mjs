// 📺 Tanıtım Ekranı (2026-10-27): Yönetici › Kulüp İşleri › Tanıtım Ekranı tam ekran oyun vitrinini açar (dagsk-vitrin.js).
// İlk oyun ve alt bant görünür, tüm vitrin görüntüleri sunucudan gelir, ara kartlar sırayla girer, 390 px'te taşma yok,
// Esc kapatır ve kapandıktan sonra zamanlayıcılar hata atmaz. v329: menüden GERÇEK tıklamayla tam ekran açılır (dosya inerken
// tıklama anı kaçıyordu); ara kartlar: kazanımlar, lisanslı sporcu, Google değerlendirme (+QR), arkadaşını getir %20;
// "resepsiyon" ve "deneme dersi" hiçbir yerde geçmez.
import { sayfaAc, uygulamaAc, yoneticiAc, dogrula, esit, B } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1600, yukseklik: 900 });
  try {
    await uygulamaAc(p);
    await yoneticiAc(p);
    dogrula(await p.evaluate(() => YONETICI_BOLUMLER.some(([, s]) => s.some(([k]) => k === 'vitrin'))), 'menüde Tanıtım Ekranı yok');
    await p.locator('.yon-sidebar-btn', { hasText: 'Tanıtım Ekranı' }).click();
    await p.waitForSelector('#vt', { timeout: 20000 });
    dogrula(await p.evaluate(() => !!document.fullscreenElement), 'menüden tıklayınca tam ekran açılmadı');
    await p.waitForTimeout(1500);
    const ilk = await p.evaluate(() => ({
      aktif: document.querySelector('#vt .vt-r.on')?.dataset.id, liste: document.querySelector('#vt .vt-oge.on')?.dataset.id,
      bas: document.getElementById('vt-bas').textContent, bant: document.getElementById('vt-alt3').classList.contains('on'),
      oyunlar: vtOyunlar.map((o) => o.id), sekme: yoneticiSekmeAktif
    }));
    esit(ilk.aktif, ilk.oyunlar[0], 'ilk oyun ekranda değil'); esit(ilk.liste, ilk.oyunlar[0], 'listede ilk oyun vurgulu değil');
    dogrula(ilk.bant && ilk.bas.length > 0, 'alt bant başlığı görünmedi');
    dogrula(ilk.sekme !== 'vitrin', 'vitrin yönetici sekmesini değiştirdi');
    // görüntüler sunucudan geliyor mu
    for (const id of ilk.oyunlar) { const r = await fetch(B + '/vitrin/' + id + '.webp'); esit(r.status, 200, id + '.webp gelmedi'); }
    // ara kart (3. oyundan sonra "nasıl çalışır")
    const ara = await p.evaluate(async () => {
      const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let k = 0; k < 60; k++) { if (document.getElementById('vt-ara').classList.contains('on')) return document.getElementById('vt-ara').textContent; await bekle(1000); }
      return '';
    });
    dogrula(/Gerçek ok/.test(ara), 'ara kart (nasıl çalışır) gelmedi');
    // yeni kartlar + yasak yazılar
    const kart = async (t) => { await p.evaluate((t) => vtAraGoster(t), t); await p.waitForTimeout(300); return p.evaluate(() => document.getElementById('vt-ara').textContent); };
    dogrula(/kazanıyor/.test(await kart('kazanim')), 'kazanımlar kartı yok');
    dogrula(/lisanslı sporcu/i.test(await kart('lisans')), 'lisanslı sporcu kartı yok');
    dogrula(/%20/.test(await kart('arkadas')), 'arkadaşını getir %20 kartı yok');
    dogrula(/Google/.test(await kart('google')), 'Google değerlendirme kartı yok');
    dogrula(await p.evaluate(() => !/resepsiyon|deneme dersi/i.test(document.getElementById('vt').textContent)), 'tanıtımda resepsiyon / deneme dersi yazısı kaldı');
    // tam ekrandan çık (ilk Esc yalnız tam ekranı kapatır, vitrin açık kalır)
    if (await p.evaluate(() => !!document.fullscreenElement)) { await p.evaluate(() => document.exitFullscreen()); await p.waitForFunction(() => !document.fullscreenElement); await p.waitForTimeout(1500); } // pencere eski boyuna dönsün
    dogrula(await p.evaluate(() => !!document.getElementById('vt')), 'tam ekrandan çıkınca vitrin kapandı');
    // telefon genişliği
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400);
    dogrula(await p.evaluate(() => { const v = document.getElementById('vt'); return v.scrollWidth <= innerWidth + 1 && document.documentElement.scrollWidth <= innerWidth + 1; }), '390 px genişlikte yatay taşma');
    await p.setViewportSize({ width: 1600, height: 900 });
    // Esc kapatır
    await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    dogrula(await p.evaluate(() => !document.getElementById('vt')), 'Esc tanıtım ekranını kapatmadı');
    await p.waitForTimeout(2000);
    dogrula(!hatalar.length, 'sayfa hataları: ' + hatalar.join(' | '));
    log(`${ilk.oyunlar.length} oyun · ara kart geldi · Esc kapattı`);
  } finally { await ctx.close(); }
}
