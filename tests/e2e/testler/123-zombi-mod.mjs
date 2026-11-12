// Karışık Sınıf › Oyunlar › 🧟 Zombi Salgını v411 MODLAR (2026-11-12; kullanıcı: "zombi oyunu kolay bitiyor, modları olsun, birkaç eğlence modu da olsun
// korkutucu ya da dostane"). Zorluk: Kolay / Normal / Zor / Kâbus; eğlence: 👻 Korkutucu (Zor kuralı), 🧸 Dostane (Kolay kuralı, sarılır).
// Saf kurallar (başlangıç, 2 atışta bir ısırık, çift ısırık, süper panzehir) + Mod düğmesi → seçici → yeni salgın, sahne görünümü, sonuç ekranında rövanş modu, 390 px.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  let yedek = null;
  const seri = (oklar) => p.evaluate(async (oklar) => {
    _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
    for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120));
    const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120)); }
    await new Promise((r) => setTimeout(r, 200));
  }, oklar);
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));

    // saf kurallar
    const saf = await p.evaluate(async () => {
      await kmOyunZombiHazir();
      const I = _zbIc, ilk = (l) => l[0], h8 = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      const yeni = (mod, z) => { const st = { mod, zombi: {}, zamani: {}, isirik: {}, seri: 0 }; z.forEach((k, i) => { st.zombi[k] = 1; st.zamani[k] = i; }); return st; };
      const bas = ['kolay', 'normal', 'zor', 'kabus', 'korku', 'dost'].map((m) => I.baslangicSay(24, { mod: m }));
      const k1 = yeni('kolay', ['b']), rk1 = I.adimHesapla(k1, 'a', [0, 0, 0], 5, h8, ilk, true), rk2 = I.adimHesapla(k1, 'a', [0, 0, 0], 5, h8, ilk, true);
      const z1 = yeni('zor', ['a', 'b', 'c']), rz1 = I.adimHesapla(z1, 'a', [9, 9, 9], 5, h8, ilk, true, () => 0.99);
      const z2 = yeni('zor', ['b']), rz2 = I.adimHesapla(z2, 'a', [0, 0, 0], 5, h8, ilk, true, () => 0);
      const n1 = yeni('normal', ['a', 'b', 'c']), rn1 = I.adimHesapla(n1, 'a', [9, 9, 9], 5, h8, ilk, true, () => 0);
      return { bas, k1: rk1.isirilan.length, k2: rk2.isirilan.length, super: rz1.iyilesen, superB: !!rz1.super, cift: rz2.isirilan.length, ciftB: !!rz2.cift, normal: rn1.iyilesen.length, normalB: rn1.isirilan.length, mod: Object.keys(I.MODLAR).length };
    });
    esit(JSON.stringify(saf.bas), JSON.stringify([3, 4, 6, 8, 6, 3]), 'başlangıç zombi sayısı (24 kişi)');
    esit(saf.k1, 0, 'kolay: 1. atışta ısırık yok'); esit(saf.k2, 1, 'kolay: 2. atışta ısırık');
    esit(JSON.stringify(saf.super), JSON.stringify(['a', 'b']), 'zor: 3 iyi ok = kendisi + en eski zombi'); dogrula(saf.superB, 'süper panzehir işareti');
    esit(saf.cift, 2, 'zor: çift ısırık'); dogrula(saf.ciftB, 'çift işareti');
    esit(saf.normal, 1, 'normal: yine bir kişi'); esit(saf.normalB, 1, 'normal: çift ısırık yok'); esit(saf.mod, 6, '6 mod');

    // ekran
    const n = await p.evaluate(async () => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      const k = _kmAktifKonum || 'varsayilan'; localStorage.removeItem('dag_km_zombi_' + k); localStorage.removeItem('dag_km_zombimod_' + k); localStorage.setItem('dag_km_oyun_sessiz', '1');
      _kmListe = tum.slice(0, 8); kmOyunTemaSec('zombi'); kmSekme('oyunlar');
      for (let i = 0; i < 100 && !document.querySelector('#zb-kalabalik .zb-kisi'); i++) await new Promise((r) => setTimeout(r, 100));
      document.querySelectorAll('#yk-ortu').forEach((e) => e.remove());
      return _kmListe.length;
    });
    esit(n, 8, '8 sporcu');
    await p.waitForTimeout(2500);
    dogrula(/Mod: Normal/.test(await p.locator('#zb-mod-btn').textContent()), 'Mod düğmesi Normal göstermeli');
    await p.locator('#zb-mod-btn').click(); await p.waitForTimeout(200);
    esit(await p.locator('#zb-modsec .zb-ms-kart').count(), 6, 'seçicide 6 mod');
    await p.screenshot({ path: 'tests/e2e/_cikti/123-zombi-mod-secici.png' });
    await p.locator('#zb-modsec .zb-ms-kart[data-zbmod="zor"]').click(); await p.waitForTimeout(400);
    const z = await p.evaluate(() => { const st = zbDurum(); return { mod: st.mod, z: Object.keys(st.zombi).length, sahne: document.querySelector('.zb-sahne').getAttribute('data-mod'), kl: document.getElementById('zb-kl').textContent, sec: !!document.getElementById('zb-modsec'), hatir: localStorage.getItem('dag_km_zombimod_' + (_kmAktifKonum || 'varsayilan')) }; });
    esit(z.mod, 'zor', 'zor modu'); esit(z.z, 2, 'zor: 8 kişide 2 zombi'); esit(z.sahne, 'zor', 'sahne modu'); dogrula(/ZOR/.test(z.kl), 'HUD mod yazısı: ' + z.kl); esit(z.sec, false, 'seçici kapanmalı'); esit(z.hatir, 'zor', 'son mod hatırlanmalı');

    // 👻 korkutucu
    await p.evaluate(() => zbModSec('korku')); await p.waitForTimeout(2600);
    esit(await p.evaluate(() => document.querySelector('.zb-sahne').getAttribute('data-mod')), 'korku', 'korku sahnesi');
    dogrula(await p.evaluate(() => getComputedStyle(document.getElementById('zb-tema')).display !== 'none'), 'korku katmanı görünmeli');
    await p.screenshot({ path: 'tests/e2e/_cikti/123-zombi-korku.png' });

    // 🧸 dostane: kaçan atış → 2 atışta bir sarılma
    await p.evaluate(() => zbModSec('dost')); await p.waitForTimeout(2600);
    await p.evaluate(() => { _kmOyunAktifIndex = 0; });
    await seri(['M', 'M', 'M']);
    await seri(['M', 'M', 'M']);
    await p.waitForTimeout(300);
    const d = await p.evaluate(() => ({ sahne: document.querySelector('.zb-sahne').getAttribute('data-mod'), kl: document.getElementById('zb-kl').textContent, kalp: [...document.querySelectorAll('.zb-kisi.zombi .zb-kafa')].some((e) => getComputedStyle(e, ':after').content.includes('💗')) }));
    esit(d.sahne, 'dost', 'dostane sahnesi'); dogrula(/sarılma/.test(d.kl), 'dostane HUD: ' + d.kl); dogrula(d.kalp, 'sevimli zombide kalp yok');
    await p.screenshot({ path: 'tests/e2e/_cikti/123-zombi-dost.png' });

    // sonuç ekranı → rövanş modu
    await p.evaluate(async () => { zbFinalZorla(); await new Promise((r) => setTimeout(r, 200)); const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') onayOnayla(); });
    await p.waitForSelector('#zb-son', { timeout: 8000 });
    esit(await p.locator('#zb-son .zb-son-mod .zb-ms-kart').count(), 6, 'sonuçta 6 rövanş modu');
    await p.screenshot({ path: 'tests/e2e/_cikti/123-zombi-son.png' });
    await p.locator('#zb-son .zb-ms-kart[data-zbmod="kabus"]').click(); await p.waitForTimeout(600);
    const k = await p.evaluate(() => ({ mod: zbDurum().mod, faz: zbDurum().faz, z: Object.keys(zbDurum().zombi).length, oyun: !!document.getElementById('zb-oyun') }));
    esit(k.mod, 'kabus', 'rövanş kâbus'); esit(k.faz, 'oyun', 'yeni salgın'); esit(k.z, 3, 'kâbus: 8 kişide 3 zombi'); dogrula(k.oyun, 'oyun ekranı');
    await p.waitForTimeout(2400);
    await p.screenshot({ path: 'tests/e2e/_cikti/123-zombi-kabus.png' });

    // 📱 telefon
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
    await p.locator('#zb-mod-btn').click(); await p.waitForTimeout(200);
    dogrula(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '390 px yatay taşma');
    await p.screenshot({ path: 'tests/e2e/_cikti/123-zombi-mod-telefon.png' });
    await p.locator('#zb-ms-kapa').click();
    dogrula(hatalar.length === 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('6 mod · başlangıç/ısırık/çift/süper kuralları · seçici → zor · korku + dost sahnesi · sonuçta rövanş → kâbus · 390 px');
  } finally {
    await p.evaluate((y) => { try { const k = _kmAktifKonum || 'varsayilan'; localStorage.removeItem('dag_km_zombi_' + k); localStorage.setItem('dag_km_zombimod_' + k, 'normal'); if (y) _kmListe = JSON.parse(y); } catch (e) { } }, yedek).catch(() => {});
    await ctx.close();
  }
}
