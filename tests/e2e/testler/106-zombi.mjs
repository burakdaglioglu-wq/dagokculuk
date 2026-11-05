// Karışık Sınıf › Oyunlar › 🧟 Zombi Salgını (2026-11-06, v381; Son Üs'ün yerine). Gerçek seri kayda yazılır, panzehir çocuğun seviyesine göre, zombi önce kendini kurtarır,
// her atıştan sonra ısırık, puan sıralaması görünmez, herkes atmadan bitmez, finalde herkesin adı, "Hep birlikte bitir", geri al, 12 saat kuralı, 24 çocuk ekrana sığar, 390 px yana taşmaz.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 720 });
  let yedek = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedek = await p.evaluate(() => JSON.stringify(_kmListe));
    const n = await p.evaluate(() => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 4); localStorage.removeItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan')); kmOyunTemaSec('zombi'); return _kmListe.length;
    });
    dogrula(n >= 3, 'en az 3 sporcu gerekli');
    await p.waitForSelector('#zb-kalabalik .zb-kisi', { timeout: 30000 });
    const kur = await p.evaluate(() => ({ tema: KM_OYUN_TEMALAR.zombi && KM_OYUN_TEMALAR.zombi.ad, eski: !!KM_OYUN_TEMALAR.sonus, sifir: KM_OYUN_SIFIR_ONEK.includes('dag_km_zombi_'), icerik: !!KM_OYUN_ICERIK.zombi, oner: KM_DA_OYUN.kucuk[0] }));
    esit(kur.tema, 'Zombi Salgını', 'tema'); esit(kur.eski, false, 'Son Üs kalkmalı'); esit(kur.sifir, true, '12 saat kuralına girmeli'); dogrula(kur.icerik, 'içerik anahtarı'); esit(kur.oner, 'zombi', '8 yaş önerisi');
    esit(await p.locator('#km-oyun-rightpanel').isVisible().catch(() => false), false, 'puan sıralaması görünmemeli');
    const seri = (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef;
      for (let j = 0; j < _kmOyunRosterCache.length && !(turnuvaDB[_kmOyunRosterCache[_kmOyunAktifIndex].g] || {})[_kmOyunRosterCache[_kmOyunAktifIndex].ad]; j++) _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length;
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = turnuvaDB[s.g][s.ad], once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 120 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 120)); }
      return { key: s.g + '|' + s.ad, i, once, sonra: (sp.seriler || []).length, st: JSON.parse(JSON.stringify(zbDurum())) };
    }, [oklar, hedef]);

    // başlangıç
    const b0 = await p.evaluate(() => { const st = zbDurum(), l = _kmOyunRosterCache.map((s) => s.g + '|' + s.ad); return { z: l.filter((k) => st.zombi[k]).length, gor: document.querySelectorAll('.zb-kisi.zombi').length, n: l.length }; });
    dogrula(b0.z >= 1, 'en az 1 zombi başlamalı'); esit(b0.gor, b0.z, 'ekrandaki zombi sayısı');

    // saf kurallar: seviyeye göre eşik; zombi önce kendini kurtarır; bir seride en çok bir kişi; ısırık sağlama gider; zombi kalmazsa yeni dalga
    const saf = await p.evaluate(() => {
      const I = _zbIc, ilk = (l) => l[0], herkes = ['a', 'b', 'c', 'd'], yeni = (z) => { const st = { zombi: {}, zamani: {}, isirik: {}, seri: 0 }; z.forEach((k, i) => { st.zombi[k] = 1; st.zamani[k] = i; }); return st; };
      const s1 = yeni(['a', 'b']), r1 = I.adimHesapla(s1, 'a', [10, 10, 10], 5, herkes, ilk, true);
      const s2 = yeni(['b', 'c']), r2 = I.adimHesapla(s2, 'a', [10, 10, 10], 5, herkes, ilk, true);
      const s3 = yeni(['b']), r3 = I.adimHesapla(s3, 'a', [1, 2, 0], 5, herkes, ilk, true);
      const s4 = yeni(['a']), r4 = I.adimHesapla(s4, 'a', [9, 0, 0], 5, herkes, ilk, true);
      return { esik: [I.esikOf(0), I.esikOf(6), I.esikOf(8)], r1: r1.iyilesen, r1i: r1.isirilan.length, r2: r2.iyilesen, r3i: r3.iyilesen.length, r3b: r3.isirilan.length, dalga: r4.dalga, r4z: Object.keys(s4.zombi).length, kaz: [I.kazandi(3, 10), I.kazandi(5, 10)], bas: [I.baslangicSay(6), I.baslangicSay(18), I.baslangicSay(24)] };
    });
    esit(JSON.stringify(saf.esik), JSON.stringify([5, 7, 9]), 'seviye eşiği'); esit(JSON.stringify(saf.r1), JSON.stringify(['a']), 'zombi önce kendini kurtarmalı'); esit(saf.r1i, 1, 'her atıştan sonra ısırık');
    esit(JSON.stringify(saf.r2), JSON.stringify(['b']), 'en eski zombi kurtulmalı, tek kişi'); esit(saf.r3i, 0, 'panzehirsiz kimse kurtulmaz'); esit(saf.r3b, 1, 'ısırık'); esit(saf.dalga, true, 'yeni dalga'); esit(saf.r4z, 1, 'dalga bir zombi getirir');
    esit(JSON.stringify(saf.kaz), JSON.stringify([true, false]), 'kazanma: sağlam çoğunluk'); esit(JSON.stringify(saf.bas), JSON.stringify([1, 3, 4]), 'başlangıç zombi sayısı');

    // gerçek seri; herkes atmadan bitmez
    const r1 = await seri(['X', '10', '9']);
    esit(r1.sonra, r1.once + 1, 'seri gerçek kayda yazılmadı'); esit(r1.st.atan[r1.key], 1, 'atan işaretlenmedi'); esit(r1.st.faz, 'oyun', 'herkes atmadan bitmemeli');
    // geri al: durum önceki hale döner
    const ga = await p.evaluate(() => { window.confirm = () => true; const once = zbDurum().seri; kmOyunSonGirisiGeriAl(); return { once, sonra: zbDurum().seri, faz: zbDurum().faz }; });
    esit(ga.sonra, ga.once - 1, 'geri al');
    // herkes atar → final, herkesin adı, son atan kahraman değil
    const kalan = await p.evaluate(() => _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]) ? j : -1).filter((j) => j >= 0));
    let son = null; for (const j of kalan) son = await seri(['9', '9', '7'], j);
    esit(son.st.faz, 'son', 'herkes atınca bitmeli'); esit((son.st.finalAdlar || []).length, kalan.length, 'finalde herkesin adı');
    await p.waitForSelector('#zb-son', { timeout: 8000 }); const sonYazi = await p.locator('#zb-son').innerText();
    dogrula(/SALGIN DURDU|ŞEHİR DÜŞTÜ/i.test(sonYazi), 'sonuç başlığı: ' + sonYazi.slice(0, 60));
    dogrula(!/kahraman/i.test(sonYazi), 'son atan öne çıkmamalı');
    // yeni salgın + 12 saat
    await p.locator('#zb-yeni-son').click(); await p.waitForSelector('#zb-kalabalik .zb-kisi');
    esit(await p.evaluate(() => zbDurum().faz), 'oyun', 'yeni salgın');
    const on2 = await p.evaluate(() => { localStorage.setItem('dag_km_oyun_son_' + (_kmAktifKonum || 'varsayilan'), String(Date.now() - 13 * 3600000)); try { kmOyunBayatSifirla(); } catch (e) { return 'hata:' + e.message; } return localStorage.getItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan')) ? 'kaldi' : 'silindi'; });
    esit(on2, 'silindi', '12 saat sonra sıfırlanmalı');
    // 24 çocuk: hepsi ekranda, skor panelinin altında kalmıyor; 390 px yana taşmıyor
    const kalab = await p.evaluate(async () => {
      const tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmOyunRosterCache.length = 0; tum.slice(0, 24).forEach((x) => _kmOyunRosterCache.push(x)); zbGuncelle(); await new Promise((r) => setTimeout(r, 200));
      const dok = document.querySelector('.km-oyun-dok'), dr = dok ? dok.getBoundingClientRect() : null, sahne = document.querySelector('.zb-sahne').getBoundingClientRect();
      const kisi = [...document.querySelectorAll('.zb-kisi')].map((b) => b.getBoundingClientRect());
      return { n: kisi.length, icinde: kisi.every((r) => r.bottom <= sahne.bottom + 1 && r.top >= sahne.top - 1), boy: Math.min(...kisi.map((r) => r.height)), carpan: dr ? kisi.filter((r) => r.right > dr.left + 2 && r.bottom > dr.top + 2 && r.left < dr.right && r.top < dr.bottom).length : 0, dok: !!dr };
    });
    esit(kalab.n, 24, '24 çocuk'); dogrula(kalab.icinde, '24 çocuk sahneden taşıyor'); dogrula(kalab.boy >= 60, 'karakter küçük: ' + kalab.boy); if (kalab.dok) esit(kalab.carpan, 0, 'skor paneli çocukları kapatıyor');
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(300);
    const tel = await p.evaluate(() => { const x = document.querySelector('.zb-sahne'); return x.scrollWidth <= x.clientWidth + 1; });
    dogrula(tel, '390 px taşıyor');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(n + ' çocuk · kurallar · gerçek seri · geri al · herkes atınca sonuç · 12 saat · 24 çocuk · 390 px');
  } finally {
    await p.evaluate((y) => { try { localStorage.removeItem('dag_km_zombi_' + (_kmAktifKonum || 'varsayilan')); if (y) _kmListe = JSON.parse(y); } catch (e) { } }, yedek).catch(() => { });
    await ctx.close();
  }
}
