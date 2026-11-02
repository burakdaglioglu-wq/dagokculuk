// 🏯 Ninja › Ay Işığı Kalesi (2026-11-02, kullanıcı iki taslaktan "A çok iyiymiş"). Doğrulanan: gece sahnesi parçaları
// (çatılar, pencereler, kale taşları, kiraz dalı) çizilir; Fener Nöbeti kuralı (her 3. seride %60+ → saklanır +adım,
// altında → yerinde bekler, sıra değilse dokunmaz); sırası gelen sporcuya çağrı çıkar; kaleye varanlar pencere yakar.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => ({ liste: JSON.stringify(_kmListe), tapinak: localStorage.getItem(kmNinjaTapinakAnahtar()) }));
    const sahne = await p.evaluate(() => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 4);
      kmOyunTemaSec('ninja'); if (typeof kmOyunModSec === 'function') kmOyunModSec(false);
      const d = (id) => { const e = document.getElementById(id); return e ? e.getAttribute('d') || '' : ''; };
      return { n: _kmOyunRosterCache.length, bina: d('km-ninja-binalar').length, cati: d('km-ninja-catilar').length, isik: d('km-ninja-pencere-isik').length, tas: d('km-ninja-taslar').length, dal: d('km-ninja-dal').length,
        pencere: document.querySelectorAll('#km-ninja-pencereler .km-ninja-kale-pencere').length, koni: !!document.querySelector('.km-ninja-koni'), gece: document.getElementById('km-oyun-panel-ninja').classList.contains('km-ninja-gece-modu'),
        bambu: !!document.getElementById('km-ninja-bambu-uzak') };
    });
    dogrula(sahne.n >= 2, 'test için en az 2 sporcu gerekli: ' + sahne.n);
    dogrula(sahne.bina > 100 && sahne.cati > 100 && sahne.isik > 50 && sahne.tas > 100 && sahne.dal > 100 && sahne.koni && sahne.gece && !sahne.bambu, 'gece sahnesi: ' + JSON.stringify(sahne));
    esit(sahne.pencere, 25, 'kale pencere sayısı');

    // Fener Nöbeti kuralı
    const kural = await p.evaluate(() => {
      const s = _kmOyunRosterCache[0], d = kmOyunDurumAl(s.g, s.ad), eski = d.ninjaSeri;
      d.ninjaSeri = 0; const sirasiz = kmNinjaFenerUygula(s, 0.2, 0.1, 0.3);
      d.ninjaSeri = 2; const gordu = kmNinjaFenerUygula(s, 0.2, 0.1, 0.5);
      d.ninjaSeri = 5; const sakl = kmNinjaFenerUygula(s, 0.2, 0.1, 0.8);
      const eskiFrac = s.frac; s.frac = 0.3; d.ninjaSeri = 2; _kmOyunAktifIndex = 0; const sira = kmNinjaFenerSirada(s); kmNinjaSenseiCagriGuncelle();
      const cagri = document.getElementById('km-ninja-sinav'), aktif = document.getElementById('km-oyun-panel-ninja').classList.contains('km-ninja-fener-aktif');
      const sonuc = { sirasiz, gordu, sakl, sira, cagri: cagri.classList.contains('goster') && /FENER NÖBETİ|Fener nöbeti/.test(cagri.textContent), aktif, sayac: d.ninjaSeri, takim: _kmOyunTakimModu };
      d.ninjaSeri = eski; s.frac = eskiFrac; kmNinjaSenseiCagriGuncelle();
      return sonuc;
    });
    dogrula(kural.sirasiz.tip === null && Math.abs(kural.sirasiz.artis - 0.1) < 1e-9, 'sırası değilken dokunmamalı: ' + JSON.stringify(kural.sirasiz));
    dogrula(kural.gordu.tip === 'gordu' && kural.gordu.artis === 0 && kural.gordu.eski === 2, 'bekçi gördü → yerinde: ' + JSON.stringify(kural.gordu));
    dogrula(kural.sakl.tip === 'saklandi' && Math.abs(kural.sakl.artis - 0.125) < 1e-9, 'saklandı → +adım: ' + JSON.stringify(kural.sakl));
    dogrula(kural.sira && kural.cagri && kural.aktif, 'fener çağrısı: ' + JSON.stringify(kural));

    // Kaleye varanlar pencere yakar; hepsi gelince kale tam
    const kale = await p.evaluate(() => {
      const d = kmNinjaTapinakDurum(); d.bitirenler = [{ ad: 'A', renk: '#ff0000' }, { ad: 'B', renk: '#00ff00' }]; kmNinjaTapinakKaydet(d); kmNinjaTapinakCiz();
      const yanik = document.querySelectorAll('#km-ninja-pencereler .yanik').length, tabela = document.getElementById('km-ninja-tabela').textContent;
      const tam1 = document.getElementById('km-oyun-panel-ninja').classList.contains('km-ninja-kale-tam');
      d.bitirenler = _kmOyunRosterCache.map((s, i) => ({ ad: kmOyunIlkAd(s.ad) + i, renk: '#fff' })); kmNinjaTapinakKaydet(d); kmNinjaTapinakCiz();
      return { yanik, tabela, tam1, tam2: document.getElementById('km-oyun-panel-ninja').classList.contains('km-ninja-kale-tam') };
    });
    dogrula(kale.yanik === 2 && /KALEDE · 2 \//.test(kale.tabela) && !kale.tam1 && kale.tam2, 'kale pencereleri: ' + JSON.stringify(kale));
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('gece sahnesi (çatılar, pencereler, kale, kiraz dalı, fener konisi), Fener Nöbeti kuralı + çağrı, kale pencereleri + tam kale');
  } finally {
    if (yedek) await p.evaluate((y) => { try { _kmListe = JSON.parse(y.liste); if (y.tapinak) localStorage.setItem(kmNinjaTapinakAnahtar(), y.tapinak); else localStorage.removeItem(kmNinjaTapinakAnahtar()); } catch (e) {} }, yedek).catch(() => {});
    await ctx.close();
  }
}
