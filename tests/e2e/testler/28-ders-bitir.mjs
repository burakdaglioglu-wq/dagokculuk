// Ders bitir → yeni ders (2026-10-15, kullanıcı: "Ders bitir yapamıyorum, bazen geliyor bazen gidiyor"). Bitince ortak senkronda
// liste için "silindi" işareti kalıyordu; sonra açılan yeni ders birkaç saniye görünüp bu eski işaretle kapanıyordu
// ("Bu ders başka bir cihazda bitirildi"). İki tur: gir → 14 sn açık kalmalı → Dersi Bitir → kapanmalı, sunucu listesi boş.
import { sayfaAc, uygulamaAc, karisikSinifArac, api, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 800 });
  const acik = () => p.evaluate(() => getComputedStyle(document.getElementById('karisik-platform')).display !== 'none' && _kmListe.length > 0);
  try {
    for (let tur = 1; tur <= 2; tur++) {
      await uygulamaAc(p);
      await karisikSinifArac(p, 'yarisma'); await p.evaluate(() => kmIzgaraGeriDon());
      for (let i = 0; i < 7; i++) { await p.waitForTimeout(2000); dogrula(await acik(), tur + '. ders ' + (i + 1) * 2 + '. saniyede kendiliğinden kapandı'); }
      // 2026-10-31: 2. turda Yarışma TV'si açıkken bitir — onay penceresi TV'nin arkasında kalıyordu
      if (tur === 2) {
        await p.evaluate(() => { try { yzTvAc(); } catch (e) {} }); await p.waitForTimeout(800);
        dogrula(await p.evaluate(() => !!document.getElementById('yz-tv')), 'Yarışma TV açılmadı (test kurulumu)');
      }
      await p.evaluate(() => kmDersiBitir()); await p.waitForTimeout(500);
      dogrula(await p.evaluate(() => { const b = document.getElementById('onay-evet-btn'), r = b.getBoundingClientRect(), e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return !!e && b.contains(e); }), tur + '. turda onay penceresi üstte görünmüyor');
      if (tur === 2) dogrula(await p.evaluate(() => !document.getElementById('yz-tv')), 'Dersi bitir Yarışma TV\'sini kapatmadı');
      await p.locator('#onay-evet-btn').click(); await p.waitForTimeout(2500);
      await p.evaluate(() => { try { kmKapanisKapat(); } catch (e) {} });
      dogrula(!(await acik()), tur + '. ders bitmedi');
      esit(JSON.parse((await api('/api/meta/karisik_sinif_liste_varsayilan')).d.value || '[]').length, 0, 'sunucudaki ders listesi');
      await p.reload();
    }
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('2 kez: ders açık kalır (14 sn) → Dersi Bitir (2.si TV açıkken: onay üstte) → kapanır, sunucu boş ✓');
  } finally { await ctx.close(); }
}
