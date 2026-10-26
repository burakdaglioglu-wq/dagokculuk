// Milo · 🎡 veli / sporcu panosu (2026-10-26, kullanıcı taslaklardan "2 · Halka pano"yu seçti). Sporcu girişi (ad + doğum yılı)
// → 8 derslik paket halkası (Defter hesabı: gelmedi/hasta = telafi hakkı), ödeme durumu (tutar yok), sıradaki ders (program),
// Ders Günlüğü'nden "bu hafta", gelişim yolu, antrenör notu. Test üyesi, yoklamaları, dersi ve meta kayıtları sonunda silinir.
import { miloApi, esit, dogrula, benzersiz, sayfaAc, B } from '../yardimci.mjs';

export default async function ({ log }) {
  const G = benzersiz('3 Yaş Pano '), A = 'PANO ' + G, gun = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const tarihler = [gun(12), gun(10), gun(8), gun(5), gun(3)], metaYedek = {};
  let slotId = null;
  const metaOku = async (k) => { const r = await miloApi('/meta/' + k); return r.d && r.d.value ? JSON.parse(r.d.value) : {}; };
  const metaYaz = async (k, v) => miloApi('/meta/' + k, { method: 'PUT', body: JSON.stringify({ value: JSON.stringify(v) }) });
  try {
    await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: G, ad: A, dogumTarihi: '2023-04-10', genelNot: 'Denge tahtasında elimi tutmadan yürüyor.', acilTelefon: '05550000000' }) });
    for (const [i, t] of tarihler.entries()) await miloApi('/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: t, ad: A, grup: G, saat: '10:00', elle: true, geldi: i !== 1 && i !== 3 }) });
    for (const k of ['yoklama_durum', 'paket_odeme', 'ders_gunlugu']) metaYedek[k] = await metaOku(k);
    await metaYaz('yoklama_durum', { ...metaYedek.yoklama_durum, [tarihler[1] + '|' + A]: { d: 'haber', t: Date.now() }, [tarihler[3] + '|' + A]: { d: 'hasta', t: Date.now() } });
    await metaYaz('paket_odeme', { ...metaYedek.paket_odeme, [G + '|' + A + '|1']: { odendi: true, tutar: 1234, odemeTarihi: gun(12), not: 'gizli not', t: Date.now() } });
    await metaYaz('ders_gunlugu', { ...metaYedek.ders_gunlugu, e2epano: { tarih: gun(3), slot: G + ' 10:00', yaslar: ['3 yaş'], beceriler: ['denge', 'ziplama'], konu: 'Hayvan yürüyüşleri parkuru', yapilanlar: 'Ayı ve yengeç yürüyüşü', t: Date.now() } });
    const yarin = (new Date().getDay() + 1) % 7;
    const sl = await miloApi('/antrenman-programi', { method: 'POST', body: JSON.stringify({ grup: G, gunler: [yarin], baslangicSaat: '10:00', bitisSaat: '10:45' }) });
    slotId = sl.d.id; await miloApi('/antrenman-programi/' + slotId + '/katilimci', { method: 'POST', body: JSON.stringify({ grup: G, ad: A }) });

    // sunucu: paket 5/8 (2 gelmedi/hasta → 2 telafi hakkı), ödendi ama TUTAR/NOT yok, ders, bu hafta
    const r = await miloApi('/sporcu-girisi', { method: 'POST', body: JSON.stringify({ ad: A.toLocaleLowerCase('tr'), dogumYili: '2023' }) }, true);
    const s = r.d.sporcu;
    esit(s.paket && s.paket.dersler.join(''), 'gmghg', 'paket dersleri (geldi / haber verdi / hasta)');
    dogrula(s.telafiler.filter((h) => h.durum === 'acik').length === 2 && s.telafiler.every((h) => h.bitis >= s.bugun) && s.kayitlar.length === 5 && s.paket.tarihler.length === 5 && s.paket.sonrakiOdendi === false, 'telafiler / kayıtlar: ' + JSON.stringify({ t: s.telafiler, k: s.kayitlar.length }));
    dogrula(s.paket.no === 1 && s.paket.telafiHakki === 2 && s.paket.odendi === true && s.paket.odemeTarihi === gun(12), 'paket: ' + JSON.stringify(s.paket));
    dogrula(!JSON.stringify(r.d).includes('1234') && !JSON.stringify(r.d).includes('gizli not'), 'ödeme tutarı / notu veliye gitmemeli');
    dogrula(s.dersler.length === 1 && s.dersler[0].gunler.includes(yarin) && s.dersler[0].bas === '10:00', 'dersler: ' + JSON.stringify(s.dersler));
    dogrula(s.buHafta.length === 1 && s.buHafta[0].konu === 'Hayvan yürüyüşleri parkuru' && s.buHafta[0].beceriler.join() === 'denge,ziplama', 'bu hafta: ' + JSON.stringify(s.buHafta));
    dogrula(s.kazanacak.map((b) => b.id + ':' + b.ders).sort().join() === 'denge:1,ziplama:1' && typeof s.buAyGeldi === 'number', 'kazanacak: ' + JSON.stringify(s.kazanacak));

    // ekran (telefon): sporcu girişi → halka pano
    const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 390, yukseklik: 844 });
    try {
      await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof mvpCss === 'function' && typeof miloSporcuGirisDene === 'function', null, { timeout: 30000 });
      await p.evaluate(([ad]) => { document.getElementById('milo-sporcu-giris-ad').value = ad; document.getElementById('milo-sporcu-giris-yil').value = '2023'; document.getElementById('milo-sporcu-hatirla-chk').checked = false; return miloSporcuGirisDene(); }, [A]);
      await p.waitForSelector('#milo-sporcu-app.mvp-kap .mvp-hero', { timeout: 10000 });
      await p.waitForTimeout(1300);
      const e = await p.evaluate(() => ({
        baslik: document.querySelector('.mvp-hero h3').textContent, orta: document.querySelector('.mvp-orta').textContent, delik: document.querySelectorAll('.mvp-delik').length, islenen: document.querySelectorAll('.mvp-delik:not(.s)').length, bos: document.querySelectorAll('.mvp-delik.s').length, tarihli: [...document.querySelectorAll('.mvp-delik.s')].filter((d) => d.querySelector('b')).length,
        takvim: document.querySelectorAll('.mvp-tg.geldi').length + document.querySelectorAll('.mvp-tg.haber').length + document.querySelectorAll('.mvp-tg.hasta').length, gelecek: document.querySelectorAll('.mvp-tg.gelecek').length, odeme: document.querySelectorAll('.mvp-tg.odeme').length, telafi: document.querySelectorAll('.mvp-telafi').length, yakinda: !!document.querySelector('.mvp-yakinda'), sira: [...document.querySelectorAll('.mvp-d')].map((x) => x.textContent).join(' | '),
        cip: [...document.querySelectorAll('.mvp-hero .mvp-cip')].map((c) => c.textContent).join(' | '),
        konu: (document.querySelector('.mvp-konu b') || {}).textContent, not: (document.querySelector('.mvp-not') || {}).textContent || '', kz: document.querySelectorAll('.mvp-kz-s').length, ogrendi: /beceri öğrendi|rozet/.test(document.querySelector('.mvp').textContent),
        tasma: [...document.querySelectorAll('.mvp *')].filter((x) => !x.closest('.mvp-yatay') && x.getBoundingClientRect().right > innerWidth + 1).length,
      }));
      await p.screenshot({ path: 'C:/Users/burak/AppData/Local/Temp/claude/c--Users-burak-Desktop-dagsk/8cce1594-4a72-48c2-b738-81e8bb994514/scratchpad/mvp-e2e.png' }).catch(() => {});
      dogrula(/^Ödemeye \d+ gün$/.test(e.baslik) && /gün kaldı/.test(e.orta), 'ödeme geri sayımı: ' + JSON.stringify(e));
      dogrula(e.delik === 8 && e.islenen === 5 && e.bos === 3 && e.tarihli === 3, 'delikli kart: ' + JSON.stringify(e));
      dogrula(e.takvim >= 1 && e.gelecek >= 1 && e.odeme === 1 && e.telafi === 2 && e.yakinda, 'takvim / telafi / yakında: ' + JSON.stringify(e));
      dogrula(/6\. ders · 10:00/.test(e.sira) && /Yarın/.test(e.sira), 'gireceği dersler: ' + e.sira);
      dogrula(/2 telafi hakkı/.test(e.cip) && /1. paket ödendi/.test(e.cip), 'çipler: ' + e.cip);
      dogrula(e.konu === 'Hayvan yürüyüşleri parkuru' && /Denge tahtasında/.test(e.not) && e.tasma === 0 && !e.ogrendi && !e.kz, 'pano içeriği: ' + JSON.stringify(e));
      // 📷 fotoğraf: avatar boşken "Fotoğraf ekle" → seçilen resim kare küçültülür, yüklenir, avatar fotoğraf olur, kutlama;
      // tekrar girişte gelir; menüden kaldırılır
      dogrula(await p.evaluate(() => !!document.querySelector('.mvp-av.bos') && /Fotoğraf ekle/.test(document.querySelector('.mvp-av-kap').textContent)), 'boş avatar');
      const fy = await p.evaluate(async () => {
        let c = document.createElement('canvas'); c.width = 800; c.height = 1200; let x = c.getContext('2d'); x.fillStyle = '#f59e0b'; x.fillRect(0, 0, 800, 1200); x.fillStyle = '#1d4ed8'; x.beginPath(); x.arc(400, 420, 200, 0, 7); x.fill();
        let blob = await new Promise((ok) => c.toBlob(ok, 'image/png')), f = new File([blob], 'inci.png', { type: 'image/png' });
        await mvpFotoSecildi({ files: [f], value: '' });
        let img = document.querySelector('.mvp-av.foto img'), konfeti = document.querySelectorAll('.mvp-konfeti').length;
        let w = await new Promise((ok) => { let i = new Image(); i.onload = () => ok(i.naturalWidth + 'x' + i.naturalHeight); i.src = img.src; });
        return { img: !!img, boyut: w, uzunluk: img.src.length, konfeti, jpeg: img.src.startsWith('data:image/jpeg') };
      });
      dogrula(fy.img && fy.boyut === '360x360' && fy.jpeg && fy.uzunluk < 120000 && fy.konfeti > 0, 'fotoğraf yükleme: ' + JSON.stringify(fy));
      const g2 = await miloApi('/sporcu-girisi', { method: 'POST', body: JSON.stringify({ ad: A, dogumYili: '2023' }) }, true);
      dogrula(g2.d.sporcu.foto && g2.d.sporcu.foto.startsWith('data:image/jpeg'), 'girişte fotoğraf dönmeli');
      const yanlis = await miloApi('/sporcu-foto', { method: 'POST', body: JSON.stringify({ ad: A, dogumYili: '2019', veri: g2.d.sporcu.foto }) }, true);
      const bozuk = await miloApi('/sporcu-foto', { method: 'POST', body: JSON.stringify({ ad: A, dogumYili: '2023', veri: 'data:text/html;base64,PHNjcmlwdD4=' }) }, true);
      dogrula(yanlis.s === 404 && bozuk.s === 400, 'yanlış kişi / bozuk veri reddedilmeli: ' + yanlis.s + ' ' + bozuk.s);
      await p.locator('.mvp-av.foto').click(); await p.locator('#mvp-foto-menu button', { hasText: 'Kaldır' }).click(); await p.waitForSelector('.mvp-av.bos');
      const g3 = await miloApi('/sporcu-girisi', { method: 'POST', body: JSON.stringify({ ad: A, dogumYili: '2023' }) }, true);
      esit(g3.d.sporcu.foto, null, 'kaldırınca fotoğraf silinmeli');
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
    log('sporcu girişi → ödemeye N gün, delikli kart 5 işlendi + 3 tarihli, takvim (geldi/haber/hasta, gireceği, yeni paket günü), 2 telafi hakkı (haber verdi + hasta) son günüyle, gireceği dersler, bu hafta, beceri bahçesi yakında, ödeme tutarı gizli, 📷 fotoğraf ekle (360 px JPEG, kutlama) / girişte gelir / kaldır / yanlış kişi-bozuk veri red, 390 px taşma yok');
  } finally {
    for (const k of Object.keys(metaYedek)) {
      const v = await metaOku(k).catch(() => ({}));
      delete v[tarihler[3] + '|' + A]; delete v[G + '|' + A + '|1']; delete v.e2epano;
      await metaYaz(k, v).catch(() => {});
    }
    if (slotId) await miloApi('/antrenman-programi/' + slotId, { method: 'DELETE' }).catch(() => {});
    for (const t of tarihler) await miloApi('/attendance/auto', { method: 'DELETE', body: JSON.stringify({ tarih: t, ad: A }) }).catch(() => {});
    await miloApi('/sporcu-foto', { method: 'POST', body: JSON.stringify({ ad: A, dogumYili: '2023', veri: null }) }, true).catch(() => {});
    await miloApi('/members/' + encodeURIComponent(G) + '/' + encodeURIComponent(A), { method: 'DELETE' }).catch(() => {});
  }
}
