// Yönetici › Çift Kayıt (hata toleranslı arama + panelden birleştirme) ve Eğitmen & Misafir (misafir + takip).
import { sayfaAc, uygulamaAc, yoneticiAc, dogrula, esit, api, benzersiz } from '../yardimci.mjs';

export default async function ({ log }) {
  const kok = benzersiz('KY');
  const A1 = kok + ' SARE YILMAZ', A2 = kok + ' SAER YILMAZ', MIS = (kok + ' misafir').toLocaleUpperCase('tr-TR');
  const { ctx, p, hatalar } = await sayfaAc();
  try {
    await uygulamaAc(p);
    await p.evaluate(([a, b]) => { _yoneticiSporcuEkleGerceklestir(a, '2012', 'buyukler'); _yoneticiSporcuEkleGerceklestir(b, '2012', 'buyukler'); }, [A1, A2]);
    for (let i = 0; i < 60; i++) { const at = (await api('/api/athletes')).d.athletes; if (at.some((x) => x.ad === A1) && at.some((x) => x.ad === A2)) break; await p.waitForTimeout(1000); }
    await yoneticiAc(p, 'ciftkayit');
    await p.locator('#ky-ara').fill(kok.toLowerCase() + ' sare'); await p.waitForTimeout(400);
    const kart = p.locator('.ky-kart:has(.ky-kisi .ky-sec)').first();
    esit(await kart.locator('.ky-kisi').count(), 2, '"sare" araması yazım hatalı kaydı (SAER) bulmadı');
    await kart.locator('.ky-kisi', { hasText: A1 }).locator('.ky-sec').click(); await p.waitForTimeout(150);
    await p.locator('.ky-kart:has(.ky-kisi .ky-sec)').first().locator('.ky-kisi', { hasText: A2 }).locator('.ky-sec').click(); await p.waitForTimeout(250);
    await p.locator('#ky-panel label', { hasText: A1 }).locator('input').check();
    await p.locator('#ky-panel button', { hasText: 'olarak birleştir' }).click();
    await p.locator('#onay-evet-btn').click();
    await p.waitForFunction((n) => !turnuvaDB.buyukler[n], A2, { timeout: 30000 });
    dogrula(!(await api('/api/athletes')).d.athletes.some((x) => x.ad === A2), 'birleştirilen kayıt sunucuda duruyor');
    // misafir + takip
    await p.evaluate((n) => { let d = new Date(); d.setDate(d.getDate() - 2); let iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); kyMisafirOlustur('kucukler', n, { tel: '05551112233' }, iso); }, MIS);
    await p.evaluate(() => { yoneticiSekme('kisiler'); _ky.kisiSekme = 'misafir'; kyKisilerCiz(); }); await p.waitForTimeout(400);
    const bekleyen = p.locator('.ky-kart', { hasText: 'Misafirden üyeye' }).locator('.ky-kisi', { hasText: MIS });
    esit(await bekleyen.count(), 1, 'misafir "aranmayı bekleyenler"de yok');
    await bekleyen.locator('button', { hasText: 'Arandı' }).click(); await p.waitForTimeout(300);
    esit(await p.evaluate((n) => (kisiBilgi('kucukler', n).takip || {}).durum, MIS), 'arandi', 'takip durumu kaydedilmedi');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('hata toleranslı arama, panelden birleştirme, misafir takibi tamam');
  } finally {
    await ctx.close();
    for (const [g, ad] of [['buyukler', A1], ['buyukler', A2], ['kucukler', MIS]]) await api(`/api/athletes/${g}/${encodeURIComponent(ad)}`, { method: 'DELETE' });
  }
}
