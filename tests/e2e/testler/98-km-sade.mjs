// ✦ Karışık Sınıf sade ekranları (2026-11-03, v373 — dagsk-km-sade.js). Telefon boyunda GERÇEK tıklamayla:
//  · Yoklama: ✓ / ✕ (tekrar basmak kaldırır), Kalanlar geldi, isim yazıp derse ekle (geldi işaretlenir), dersten çıkar
//  · Kim ne yapacak: isme dokununca Yarışma ↔ Oyun (dag_km_hat_<konum>)
//  · Yeni yarışma: 36 ok seç → Başlat → sıralama turu yalnız Yarışma tarafıyla başlar
//  · Yeni sporcu: kalıcı kayıt + bugünkü derse ekle · Yeni sınıf: yeni konum + seçilen grubun sporcuları, yoklamaya geçer
// Ders listesi, yoklama, hatlar, yarışma kaydı, konum listesi ve oluşturulan sporcu sonunda geri alınır.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit, api, benzersiz } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 390, yukseklik: 844 });
  let yedek = null, yeniAd = null, yeniKonum = null;
  const tasmaYok = () => p.evaluate(() => { const e = document.getElementById('ks-ekran'); return !e || e.scrollWidth <= e.clientWidth + 1; });
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'skor');
    yedek = await p.evaluate(() => ({ liste: JSON.stringify(_kmListe), hat: localStorage.getItem(kmHatAnahtari()), yok: JSON.stringify(otomatikYoklamaDB[bugunISO()] || {}), yz: localStorage.getItem('dag_km_yarismatur_' + (_kmAktifKonum || 'varsayilan')) }));
    // 4 sporculu ders, yoklama ve hatlar temiz, yarışma kaydı yok
    const ders = await p.evaluate(() => {
      _kmListe = _kmListe.filter((s) => turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]).slice(0, 4);
      ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (_kmListe.length < 4 && !turnuvaDB[g][ad].pasif && !_kmListe.some((s) => s.g === g && s.ad === ad)) _kmListe.push({ g, ad }); })); // kalan eski liste boş olabilir
      _kmListeKaydet();
      localStorage.removeItem(kmHatAnahtari()); localStorage.removeItem('dag_km_yarismatur_' + (_kmAktifKonum || 'varsayilan'));
      _kmListe.forEach((s) => { delete (otomatikYoklamaDB[bugunISO()] || {})[s.ad]; });
      if (typeof _yz !== 'undefined') _yz.kurulum = null;
      kmIzgaraGeriDon();
      let disari = null; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].some((g) => Object.keys(turnuvaDB[g] || {}).some((ad) => { const sp = turnuvaDB[g][ad]; if (!sp.pasif && !sp.donduruldu && ad.length >= 4 && !_kmListe.some((s) => s.g === g && s.ad === ad)) { disari = { g, ad }; return true; } return false; }));
      return { liste: _kmListe.slice(), disari };
    });
    esit(ders.liste.length, 4, 'test dersi 4 sporcu olmalı');
    dogrula(ders.disari, 'derste olmayan sporcu bulunamadı');

    // ---- Yoklama
    await p.locator('.ks-serit-ana').click();
    await p.waitForSelector('#ks-ekran .ks-liste .ks-sat', { timeout: 20000 });
    esit(await p.locator('#ks-ekran .ks-liste .ks-sat').count(), 4, 'yoklamada 4 satır');
    const ilk = await p.locator('#ks-ekran .ks-liste .ks-sat').first().locator('.ks-ad b').innerText();
    const kisi = ders.liste.find((s) => s.ad === ilk);
    await p.locator('#ks-ekran .ks-liste .ks-sat').first().locator('.ks-yb').first().click();
    esit(await p.evaluate((s) => { const y = (otomatikYoklamaDB[bugunISO()] || {})[s.ad]; return !!y && y.geldi === true && y.grup === s.g; }, kisi), true, 'geldi yazılmadı');
    const satir = () => p.locator('#ks-ekran .ks-liste .ks-sat').filter({ hasText: ilk });
    await satir().locator('.ks-yb.ok').click(); // tekrar basmak kaldırır
    esit(await p.evaluate((s) => !(otomatikYoklamaDB[bugunISO()] || {})[s.ad], kisi), true, 'tekrar basınca kaldırılmadı');
    await satir().locator('.ks-yb').nth(1).click();
    esit(await p.evaluate((s) => (otomatikYoklamaDB[bugunISO()] || {})[s.ad].geldi, kisi), false, 'gelmedi yazılmadı');
    await p.locator('#ks-ekran button', { hasText: 'Kalanlar geldi' }).click();
    esit(await p.evaluate((l) => l.filter((s) => { const y = (otomatikYoklamaDB[bugunISO()] || {})[s.ad]; return y && y.geldi === true; }).length, ders.liste), 3, 'Kalanlar geldi: 3 geldi olmalı (gelmedi korunur)');
    dogrula(await tasmaYok(), 'yoklama yatay taşma');
    // derse ekle: isim yaz → Ekle
    await p.fill('#ks-ara', ders.disari.ad.slice(0, 4));
    await p.locator('#ks-ekran .ks-aday .ks-sat', { hasText: ders.disari.ad }).first().locator('button', { hasText: 'Ekle' }).click();
    esit(await p.evaluate((d) => _kmListe.some((s) => s.g === d.g && s.ad === d.ad), ders.disari), true, 'derse eklenmedi');
    esit(await p.evaluate((d) => ((otomatikYoklamaDB[bugunISO()] || {})[d.ad] || {}).geldi, ders.disari), true, 'eklenen geldi işaretlenmedi');
    esit(await p.locator('#ks-ekran .ks-liste .ks-sat').count(), 5, 'eklenince 5 satır');
    // dersten çıkar
    await p.locator('#ks-ekran .ks-liste .ks-sat', { hasText: ders.disari.ad }).locator('.ks-cik').click();
    await p.locator('#onay-evet-btn').click(); await p.waitForTimeout(300);
    esit(await p.evaluate(() => _kmListe.length), 4, 'çıkarılmadı');

    // ---- Kim ne yapacak
    await p.locator('#ks-ekran .ks-ana-btn', { hasText: 'Kim ne yapacak' }).click();
    await p.waitForSelector('#ks-ekran .ks-sutunlar');
    esit(await p.locator('#ks-ekran .ks-sutun').nth(1).locator('.ks-kisi').count(), 3, 'gelmedi olan gizli: oyun sütununda 3');
    const yarisan = await p.locator('#ks-ekran .ks-sutun').nth(1).locator('.ks-kisi b').first().innerText();
    await p.locator('#ks-ekran .ks-sutun').nth(1).locator('.ks-kisi').first().click();
    esit(await p.evaluate((ad) => { const s = _kmListe.find((x) => x.ad === ad); return kmHat(s.g, s.ad); }, yarisan), 'yarisma', 'Yarışma tarafına geçmedi');
    esit(await p.locator('#ks-ekran .ks-sutun.y .ks-kisi').count(), 1, 'yarışma sütununda 1 kişi');
    dogrula(await tasmaYok(), 'kim ne yatay taşma');

    // ---- Yeni yarışma
    await p.locator('#ks-ekran .ks-ana-btn', { hasText: 'Yarışmayı kur' }).click();
    await p.waitForSelector('#ks-ekran .ks-format', { timeout: 20000 });
    await p.locator('#ks-ekran .ks-format', { hasText: '36 ok' }).click();
    esit(await p.evaluate(() => yzKurulumTaslak().format), 'yarim', '36 ok seçilmedi');
    await p.locator('#ks-ekran .ks-cip', { hasText: '20 m' }).click();
    dogrula(await tasmaYok(), 'yeni yarışma yatay taşma');
    await p.locator('#ks-ekran .ks-ana-btn', { hasText: 'Yarışmayı başlat' }).click();
    await p.waitForFunction(() => _kmAktifSekme === 'yarisma' && yzOku().durum && yzOku().durum.asama === 'tur', null, { timeout: 15000 });
    const tur = await p.evaluate(() => { const d = yzOku().durum; return { n: d.katilimci.length, mesafe: d.ayar.mesafe, format: d.ayar.format }; });
    esit(tur.n, 1, 'turda yalnız yarışma tarafı (1)'); esit(tur.mesafe, '20m', 'mesafe'); esit(tur.format, 'yarim', 'format');
    await p.evaluate(() => kmIzgaraGeriDon());
    dogrula(await p.locator('.ks-yarisma button', { hasText: 'Devam et' }).isVisible(), 'tur sürerken ana kartta Devam et yok');

    // ---- Yeni sporcu (derse de eklenir)
    yeniAd = benzersiz('TESTKS ');
    await p.locator('.ks-alt-is button', { hasText: 'Yeni sporcu' }).click();
    await p.waitForSelector('#ks-sp-ad');
    await p.fill('#ks-sp-ad', yeniAd.toLocaleLowerCase('tr-TR')); // küçük yazılır, kayıt BÜYÜK harfle
    await p.locator('#ks-ekran .ks-cip', { hasText: 'Minikler' }).click();
    await p.locator('#ks-ekran .ks-cip', { hasText: 'Kız' }).click();
    await p.fill('#ks-sp-yil', '2018');
    dogrula(await tasmaYok(), 'yeni sporcu yatay taşma');
    await p.locator('#ks-ekran .ks-ana-btn', { hasText: 'Sporcuyu kaydet' }).click();
    await p.waitForTimeout(500);
    const sp = await p.evaluate((ad) => { const s = turnuvaDB.minikler[ad]; return s ? { yil: s.dogumYili, c: s.cinsiyet, derste: _kmListe.some((x) => x.g === 'minikler' && x.ad === ad) } : null; }, yeniAd);
    dogrula(sp, 'sporcu kaydedilmedi (büyük harfle)'); esit(sp.yil, 2018, 'doğum yılı'); esit(sp.c, 'K', 'cinsiyet'); esit(sp.derste, true, 'derse eklenmedi');
    dogrula(await p.locator('#ks-ekran .ks-liste .ks-sat', { hasText: yeniAd }).count(), 'kayıttan sonra yoklamada görünmüyor');
    await p.evaluate(() => ksKapat());

    // ---- Yeni sınıf
    const sinifAd = benzersiz('Test Sınıf ');
    await p.locator('.ks-alt-is button', { hasText: 'Yeni sınıf' }).click();
    await p.waitForSelector('#ks-sinif-ad');
    await p.fill('#ks-sinif-ad', sinifAd);
    await p.locator('#ks-ekran .ks-grup', { hasText: 'Minikler' }).click();
    const miniSay = await p.evaluate(() => ksAktifSporcular('minikler').length);
    dogrula(miniSay > 0, 'minikler boş');
    dogrula(await tasmaYok(), 'yeni sınıf yatay taşma');
    await p.locator('#ks-sinif-btn').click();
    await p.waitForFunction((ad) => (_kmKonumlar || []).some((k) => k.ad === ad) && _kmAktifKonum !== 'varsayilan' && document.querySelector('#ks-ekran .ks-liste'), sinifAd, { timeout: 15000 });
    yeniKonum = await p.evaluate(() => _kmAktifKonum);
    esit(await p.evaluate(() => _kmListe.length), miniSay, 'yeni sınıfa minikler gelmedi');
    esit(await p.locator('#ks-ekran .ks-liste .ks-sat').count(), miniSay, 'yeni sınıfın yoklaması açılmadı');
    const sunucu = (await api('/api/meta/karisik_sinif_konumlar')).d;
    dogrula(JSON.parse(sunucu.value || '[]').some((k) => k.id === yeniKonum), 'konum sunucuya yazılmadı');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('sade: yoklama ✓/✕/kalanlar/ekle/çıkar, kim ne (hat), 36 ok yarışma başlat, yeni sporcu + derse, yeni sınıf (konum + grup)');
  } finally {
    try {
      if (yeniKonum) {
        const l = JSON.parse((await api('/api/meta/karisik_sinif_konumlar')).d.value || '[]').filter((k) => k.id !== yeniKonum);
        await api('/api/meta/karisik_sinif_konumlar', { method: 'PUT', body: JSON.stringify({ value: JSON.stringify(l) }) });
        await api('/api/meta/karisik_sinif_liste_' + yeniKonum, { method: 'PUT', body: JSON.stringify({ value: '[]' }) });
      }
      if (yeniAd) {
        await p.evaluate((ad) => { delete turnuvaDB.minikler[ad]; try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {} }, yeniAd).catch(() => {});
        await api('/api/athletes/minikler/' + encodeURIComponent(yeniAd), { method: 'DELETE' });
      }
      if (yedek) await p.evaluate((y) => {
        try { ksKapat(); } catch (e) {}
        if (_kmAktifKonum !== 'varsayilan') { localStorage.removeItem('dag_km_liste_' + _kmAktifKonum); _kmAktifKonum = 'varsayilan'; localStorage.setItem('dag_km_konum', 'varsayilan'); _kmKonumlar = (_kmKonumlar || []).filter((k) => k.id.indexOf('k') !== 0 || !k.ad.startsWith('Test Sınıf')); }
        _kmListe = JSON.parse(y.liste); _kmListeKaydet();
        if (y.hat === null) localStorage.removeItem(kmHatAnahtari()); else localStorage.setItem(kmHatAnahtari(), y.hat);
        if (y.yz === null) localStorage.removeItem('dag_km_yarismatur_varsayilan'); else localStorage.setItem('dag_km_yarismatur_varsayilan', y.yz);
        otomatikYoklamaDB[bugunISO()] = JSON.parse(y.yok); otomatikYoklamaKaydet();
      }, yedek).catch(() => {});
      await p.waitForTimeout(800);
    } catch (e) {}
    await ctx.close();
  }
}
