// 🎯 Hedef girişi her yerde (2026-10-18, kullanıcı: "hedef girişi her yerde" + "makaralıda her yerde iç 10" + yüzler: 3'lü dikey ve
// tek yüz, 6 halka). Skor Gir ve Oyunlar'da: büyüteç (bas-kaydır-bırak, canlı puan), 3'lü yüz 6 halkalı (5 dahil), puan etiketine
// dokun = sil (deliğe dokunmak silmez), makaralıda dış 10 → 9, Oyunlar'da konum tip + yüz no ile kaydolur. Hiçbir seri KAYDEDİLMEZ
// (otomatik kaydet kapatılır, İlerlet'e basılmaz); sporcunun yay türü eski haline döner.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let geri = null;
  try {
    await uygulamaAc(p);
    // ---------- Skor Gir
    const sp = await p.evaluate(() => {
      let g = ['buyukler', 'yildizlar', 'kucukler', 'minikler'].find((x) => Object.keys(turnuvaDB[x] || {}).some((a) => !turnuvaDB[x][a].donduruldu)); aktifGrup = g;
      let ad = Object.keys(turnuvaDB[g]).find((a) => !turnuvaDB[g][a].donduruldu); let oto = document.getElementById('hizli-otokaydet'); if (oto) oto.checked = false;
      kapatGirisEkrani(); skorEkraniniAc(ad); setHedefTipi('3spot'); currentZoom = 1; panX = 0; panY = 0; applyHedefTransform(); return { g, ad, yay: turnuvaDB[g][ad].yay || null };
    });
    geri = sp;
    await p.evaluate((s) => { turnuvaDB[s.g][s.ad].yay = 'Klasik'; hedefGorseliGuncelle(false); }, sp);
    const nokta = (x, y) => p.evaluate(([x, y]) => { const svg = document.getElementById('hedef-svg-3spot'), pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const q = pt.matrixTransform(svg.getScreenCTM()); return { x: q.x, y: q.y }; }, [x, y]);
    let a = await nokta(0, -140); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.waitForTimeout(400); // bastır-bekle → büyüteç
    dogrula(await p.locator('#hg-lup').isVisible(), 'Skor Gir: büyüteç çıkmadı');
    esit((await p.locator('#hg-lup b').innerText()).trim(), 'X', 'büyüteçte canlı puan');
    await p.mouse.up(); await p.waitForTimeout(200);
    a = await nokta(25, 0); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(200);
    a = await nokta(55, 140); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(200);
    await p.waitForTimeout(150);
    esit(await p.evaluate(() => anlikAtilanOklar.map((o) => o.puan + '@' + o.spot).join(',')), 'X@0,8@1,5@2', "Skor Gir 3'lü: puan + yüz (5 halkası da sayılmalı)");
    // deliğe dokunmak silmez, puan etiketine dokunmak siler
    a = await nokta(25 + 7, -7); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(200); await p.waitForTimeout(100);
    esit(await p.evaluate(() => anlikAtilanOklar.map((o) => o.puan).join(',')), 'X,5', 'Skor Gir: etikete dokununca silinmedi');
    // makaralı: dış 10 → 9
    await p.evaluate((s) => { turnuvaDB[s.g][s.ad].yay = 'Makaralı'; anlikAtilanOklar = []; hedefGorseliGuncelle(false); }, sp);
    dogrula(await p.locator('#hg-mak-not').isVisible(), 'makaralı uyarısı yok');
    a = await nokta(7, 0); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(200); await p.waitForTimeout(100);
    esit(await p.evaluate(() => anlikAtilanOklar[0] && anlikAtilanOklar[0].puan), '9', 'makaralıda dış 10 → 9');
    await p.evaluate((s) => { turnuvaDB[s.g][s.ad].yay = s.yay; anlikAtilanOklar = []; hedefGorseliGuncelle(false); }, sp);

    // ---------- Oyunlar
    await p.goto(p.url()); await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    await p.evaluate(() => { kmOyunTemaSec('zirve'); kmOyunSporcuSec(0); kmOyunGirisModuSec('hedef'); kmOyunHedefYuzSec('3spot'); });
    await p.waitForSelector('#km-oyun-hedef-svg.uclu');
    const kn = (x, y) => p.evaluate(([x, y]) => { const svg = document.getElementById('km-oyun-hedef-svg'), pt = svg.createSVGPoint(); pt.x = x; pt.y = y; const q = pt.matrixTransform(svg.getScreenCTM()); return { x: q.x, y: q.y }; }, [x, y]);
    a = await kn(0, 140); await p.mouse.move(a.x, a.y); await p.mouse.down();
    dogrula(await p.locator('#hg-lup').isVisible(), 'Oyunlar: büyüteç çıkmadı');
    await p.mouse.up(); await p.waitForTimeout(100);
    const ok = await p.evaluate(() => ({ p: _kmOyunSeriGirisleri.join(','), k: JSON.stringify(_kmOyunSeriKonumlari[0]) }));
    esit(ok.p, 'X', 'Oyunlar 3\'lü: alt yüz merkezi X');
    dogrula(ok.k.includes('"tip":"3spot"') && ok.k.includes('"spot":2'), 'Oyunlar konumu tip/yüz ile kaydolmadı: ' + ok.k);
    a = await kn(7, 133); await p.mouse.move(a.x, a.y); await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(200); await p.waitForTimeout(100);
    esit(await p.evaluate(() => _kmOyunSeriGirisleri.length), 0, 'Oyunlar: etikete dokununca silinmedi');
    await p.evaluate(() => { kmOyunHedefYuzSec('6ring'); kmOyunGirisModuSec('rakam'); try { localStorage.removeItem('dag_km_oyun_hedefyuz'); } catch (e) {} });
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log("Skor Gir + Oyunlar: büyüteç, 3'lü 6 halka (5 dahil), etikete dokun = sil, makaralı iç 10, Oyunlar'da tip + yüz kaydı ✓");
  } finally {
    if (geri) await p.evaluate((s) => { try { if (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) turnuvaDB[s.g][s.ad].yay = s.yay; anlikAtilanOklar = []; } catch (e) {} }, geri).catch(() => {});
    await ctx.close();
  }
}
