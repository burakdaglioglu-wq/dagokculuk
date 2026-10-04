// Deneme Dersleri: sitedeki form talebi sayılır (kişi bilgisi gitmez), aday listesi oturumsuz okunamaz, site mesajı
// yapıştırınca alanlar dolar, aday Yeni → Arandı → Gün verildi → Geldi → Kayıt oldu ilerler ve sporcu olarak eklenir.
import { sayfaAc, uygulamaAc, yoneticiAc, dogrula, esit, api, benzersiz, B, yataydaTasmaYok } from '../yardimci.mjs';

export default async function ({ log }) {
  esit((await api('/api/meta/deneme_adaylari', {}, true)).s, 401, 'aday listesi oturumsuz okunabiliyor');
  const once = (await api('/api/tanitim/ziyaret-ozet')).d;
  dogrula(once.son90 && typeof once.son90.talep === 'number', 'ziyaret özeti talep sayısını dönmüyor');

  // 1) site: form gönderilince talep sayılır, WhatsApp mesajı hazırlanır
  {
    const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 390, yukseklik: 844 });
    try {
      await p.goto(B + '/');
      await p.waitForSelector('#deneme-form');
      await p.locator('#deneme-form input[name="yas"]').fill('9');
      await p.locator('#deneme-form input[name="ad"]').fill('Deneme');
      await p.evaluate(() => document.getElementById('deneme-form').requestSubmit());
      await p.waitForTimeout(1200);
      const acilan = await p.evaluate(() => window.__acilan);
      dogrula(acilan.some((u) => u.includes('api.whatsapp.com') && decodeURIComponent(u).includes('9 yaş')), 'form WhatsApp mesajı açmadı');
      esit(hatalar.length, 0, 'site sayfa hatası: ' + hatalar.join(' | '));
    } finally { await ctx.close(); }
    const sonra = (await api('/api/tanitim/ziyaret-ozet')).d;
    esit(sonra.son90.talep, once.son90.talep + 1, 'form talebi sayılmadı');
    log('site talebi sayıldı ✓');
  }

  // 2) uygulama: aday ekle (mesajdan), ilerlet, sporcu olarak ekle
  const AD = benzersiz('DNM ');
  const mesaj = `Merhaba, ücretsiz deneme dersi almak istiyorum.\n\n- Çocuğum için (10 yaş)\n- Branş: Okçuluk\n- Uygun zaman: Cmt 11:00\n- Ad: ${AD}`;
  for (const [w, h] of [[1280, 900], [390, 844]]) {
    const { ctx, p, hatalar } = await sayfaAc({ genislik: w, yukseklik: h });
    let id = null;
    try {
      await uygulamaAc(p);
      await yoneticiAc(p, 'deneme');
      await p.waitForFunction(() => typeof ddCiz === 'function' && document.querySelector('.dd'), null, { timeout: 20000 });
      if (w === 390) { dogrula(await yataydaTasmaYok(p), 'Deneme Dersleri telefonda taşıyor'); break; }
      await p.locator('.dd button', { hasText: '+ Yeni aday' }).click();
      await p.locator('#dd-yapistir').fill(mesaj);
      await p.waitForTimeout(200);
      esit(await p.locator('#dd-ad').inputValue(), AD, 'mesajdan ad dolmadı');
      esit(await p.locator('#dd-yas').inputValue(), '10', 'mesajdan yaş dolmadı');
      esit(await p.locator('#dd-saat').inputValue(), 'Cmt 11:00', 'mesajdan saat dolmadı');
      await p.locator('#dd-tel').fill('0555 111 22 33');
      await p.locator('.dd button', { hasText: 'Adayı kaydet' }).click();
      const kart = () => p.locator('.dd-kart', { hasText: AD }).first();
      dogrula(await kart().count(), 'aday kartı yok');
      id = await kart().getAttribute('data-id');
      dogrula(await kart().locator('.dd-uyari').count(), 'yeni aday dikkat uyarısı yok');
      await kart().locator('button', { hasText: 'WhatsApp' }).click();
      const wa = await p.evaluate(() => window.__acilan.slice(-1)[0] || '');
      dogrula(wa.includes('phone=905551112233') && decodeURIComponent(wa).includes('Cmt 11:00'), 'aday WhatsApp mesajı yanlış: ' + wa);
      esit(await p.evaluate((i) => ddKayitlar()[i].durum, id), 'arandi', 'WhatsApp sonrası durum Arandı olmalı');
      await kart().locator('button', { hasText: '→ Gün verildi' }).click();
      const yarin = await p.evaluate(() => bsIsoTarih(new Date(Date.now() + 86400000)));
      await kart().locator('.dd-tarih input').fill(yarin);
      await kart().locator('.dd-tarih input').dispatchEvent('change');
      dogrula((await kart().locator('.dd-uyari').textContent()).includes('Yarın'), 'yarınki deneme hatırlatması yok');
      await kart().locator('button', { hasText: '→ Geldi' }).click();
      await kart().locator('button', { hasText: '✓ Kayıt oldu' }).click();
      await p.locator('#dd-sp-ad').fill(AD);
      esit(await p.locator('#dd-sp-grup').inputValue(), 'kucukler', '10 yaş için grup önerisi');
      await p.locator('.dd-ekle button', { hasText: 'Ekle' }).click();
      const sp = await p.evaluate((ad) => turnuvaDB.kucukler && turnuvaDB.kucukler[ad] ? { tel: turnuvaDB.kucukler[ad].acilTelefon } : null, AD);
      dogrula(sp, 'sporcu eklenmedi'); esit(sp.tel, '0555 111 22 33', 'veli telefonu aktarılmadı');
      const x = await p.evaluate((i) => ddKayitlar()[i], id);
      esit(x.durum, 'kayit', 'durum kayıt olmalı'); dogrula(x.sporcu && x.sporcu.g === 'kucukler', 'adaya sporcu bağlanmadı');
      esit(x.gecmis.map((g) => g.d).join('>'), 'yeni>arandi>planlandi>geldi>kayit', 'durum geçmişi');
      // huni: bu aday deneme + kayıt olarak sayılır
      const huni = await p.evaluate(() => ddHuni());
      dogrula(huni.kayit >= 1 && huni.deneme >= huni.kayit, 'huni sayıları');
      // sunucuya yazıldı mı
      await p.waitForTimeout(1500);
      const uzak = JSON.parse((await api('/api/meta/deneme_adaylari')).d.value || '{}');
      esit(uzak[id] && uzak[id].durum, 'kayit', 'aday sunucuya yazılmadı');
      esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
      log('aday: mesajdan doldurma, WhatsApp, Yeni→Kayıt, sporcu ekleme, sunucu ✓');
    } finally {
      if (id) { await p.evaluate((i) => { ddKaydet(i, { sil: true }); }, id).catch(() => {}); await p.waitForTimeout(1200); }
      await ctx.close();
    }
  }
  await api(`/api/athletes/kucukler/${encodeURIComponent(AD)}`, { method: 'DELETE' });
}
