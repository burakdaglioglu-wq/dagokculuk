// 📷 Profil fotoğrafları (2026-10-21) — ayrı tablo (/api/fotolar, /api/foto/:anahtar), veli izni (izin yoksa girişsiz ekran
// görmez), yükleme penceresi (kırp + izin), profil/liste avatarı, eski kodun okuduğu sp.fotoUrl = izinli fotoğrafın adresi.
// Test sporcusunun fotoğrafı sonunda kaldırılır (izin kaydı boşaltılır).
import { sayfaAc, uygulamaAc, yoneticiAc, B, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  let k = null;
  try {
    await uygulamaAc(p);
    await yoneticiAc(p, 'kullanicilar');
    await p.waitForSelector('#ys-ekran .ys-sat .yn-isim', { state: 'attached', timeout: 30000 });
    const s = await p.evaluate(() => { let id = document.querySelector('#ys-ekran .ys-sat .yn-isim').getAttribute('data-sporcu'), i = id.indexOf('|'); return { g: id.slice(0, i), ad: id.slice(i + 1) }; });
    k = 's:' + s.g + '|' + s.ad;
    // yükleme penceresi: izin seçilmeden Kaydet kapalı
    await p.evaluate((x) => { fotoKaydet('s:' + x.g + '|' + x.ad, { veri: null, izin: null }).catch(() => {}); }, s); await p.waitForTimeout(600);
    await p.evaluate((x) => fotoYukleAc(fotoAnahtar(x.g, x.ad), x.ad), s);
    await p.waitForSelector('#foto-pencere #fp-kaydet');
    dogrula(await p.locator('#fp-kaydet').isDisabled(), 'izin seçilmeden Kaydet açık olmamalı');
    // gerçek dosya seçici: PNG açılmalı; açılamayan (sahte HEIC) dosyada pencere nedenini yazmalı
    {
      const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.locator('#foto-pencere button:has-text("Galeriden")').click()]);
      await fc.setFiles({ name: 'bozuk.heic', mimeType: 'image/heic', buffer: Buffer.from('bu bir resim degil') });
      await p.waitForFunction(() => /HEIC/.test((document.getElementById('fp-durum') || {}).textContent || ''), null, { timeout: 8000 });
      const [fc2] = await Promise.all([p.waitForEvent('filechooser'), p.locator('#foto-pencere button:has-text("Galeriden")').click()]);
      await fc2.setFiles(new URL('../../../public/ikon-192.png', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
      await p.waitForFunction(() => !!FY.img, null, { timeout: 8000 });
      dogrula(/Fotoğraf seçildi/.test(await p.locator('#fp-durum').textContent()), 'seçim onayı görünmeli');
      await p.evaluate(() => { FY.img = null; fotoDugmeler(); });
    }
    // fotoğraf seç (dosya penceresi yerine test görseli) → izin Var → kaydet
    await p.evaluate(() => new Promise((ok) => { let c = document.createElement('canvas'); c.width = 400; c.height = 300; let x = c.getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 400, 300); x.fillStyle = '#fff'; x.fillRect(150, 80, 100, 140); let im = new Image(); im.onload = () => { FY.img = im; let kk = document.getElementById('fp-kirp'); kk.innerHTML = '<canvas width="320" height="320"></canvas>'; fotoCiz(); fotoDugmeler(); ok(); }; im.src = c.toDataURL('image/png'); }));
    await p.locator('#fp-izin button').first().click();
    dogrula(!(await p.locator('#fp-kaydet').isDisabled()), 'izin seçilince Kaydet açılmalı');
    await p.locator('#fp-kaydet').click();
    await p.waitForFunction(() => !document.getElementById('foto-pencere'), null, { timeout: 15000 });
    const f = await p.evaluate((kk) => ({ b: fotoBilgi(kk), src: fotoSrc(kk, false), sp: turnuvaDB[kk.slice(2).split('|')[0]][kk.slice(2).split('|').slice(1).join('|')].fotoUrl }), k);
    dogrula(f.b && f.b.var && f.b.izin === 1, 'fotoğraf bilgisi: ' + JSON.stringify(f.b));
    esit(f.sp, f.src, 'eski kod (oyunlar) sp.fotoUrl ile izinli adresi okumalı');
    // sunucu: izinli → girişsiz görsel 200 JPEG
    let r = await fetch(B + f.src);
    esit(r.status, 200, 'izinli fotoğraf girişsiz açılmalı'); esit(r.headers.get('content-type'), 'image/jpeg', 'tür');
    // sporcu listesi artık base64 taşımıyor
    const ath = await (await fetch(B + '/api/athletes')).json();
    dogrula(!ath.athletes.some((a) => a.fotoUrl), 'sporcu listesi fotoğraf taşımamalı');
    // liste avatarı ve profil avatarı fotoğrafı göstersin
    await p.evaluate(() => yoneticiPaneliCiz()); await p.waitForTimeout(300);
    dogrula(await p.evaluate((kk) => { let e = document.querySelector('#ys-ekran [data-foto-k="' + CSS.escape(kk) + '"]'); return !!e && /api\/foto/.test(e.style.backgroundImage); }, k), 'liste avatarında fotoğraf yok');
    await p.evaluate((x) => sporcuProfilAc(x.g + '|' + x.ad), s); await p.waitForSelector('#yn-kart .yn-p-kart');
    dogrula(await p.evaluate(() => /api\/foto/.test(document.querySelector('#yn-kart .yn-av').getAttribute('style') || '')), 'profil avatarında fotoğraf yok');
    dogrula(await p.locator('#yn-kart .yn-av-foto').count() === 1, 'profilde 📷 değiştir düğmesi yok');
    await p.evaluate(() => ynKartKapat());
    // 🪪 fotoğraflı sporcu kartı (önizleme + A4 PDF) ve 🎂 doğum günü kartı
    await p.evaluate((x) => sporcuKartAc(x.g, x.ad), s);
    await p.waitForSelector('#kart-onizleme canvas', { timeout: 20000 });
    esit(await p.evaluate(() => document.querySelector('#kart-onizleme canvas').width), 1012, 'kart genişliği');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.evaluate((x) => sporcuKartlariPdf([[x.g, x.ad]]), s)]);
    dogrula(/Sporcu_Karti/.test(dl.suggestedFilename()), 'kart PDF adı: ' + dl.suggestedFilename());
    await p.evaluate(() => fotoYukleKapat());
    esit(await p.evaluate((x) => dogumGunuKartCiz(x.g, x.ad).then((c) => c.width), s), 1080, 'doğum günü kartı');
    // 🖼 fotoğrafla yoklama: yüz ızgarası, dokun → durum döner (3 dokunuşta başa)
    await p.evaluate(() => { yoneticiYoklamaTip = 'gunluk'; yoneticiSekme('yoklama'); yoklamaYuzSec(true); });
    await p.waitForSelector('.yy-izgara .yy-kutu', { timeout: 15000 });
    const ilkDurum = await p.evaluate(() => document.querySelector('.yy-kutu').className);
    await p.locator('.yy-kutu .yy-yuz').first().click(); await p.waitForTimeout(200);
    dogrula((await p.evaluate(() => document.querySelector('.yy-kutu').className)) !== ilkDurum, 'yüze dokununca durum değişmeli');
    await p.locator('.yy-kutu .yy-yuz').first().click(); await p.waitForTimeout(200);
    await p.locator('.yy-kutu .yy-yuz').first().click(); await p.waitForTimeout(200);
    esit(await p.evaluate(() => document.querySelector('.yy-kutu').className), ilkDurum, '3 dokunuşta başa dönmeli');
    await p.evaluate(() => { yoklamaYuzSec(false); yoneticiSekme('kullanicilar'); });
    // 📺 "kim attı" alt bandı: TV gibi ekranda (Canlı Takip) yeni seri → fotoğraflı bant; aynı seri ikinci kez gelmez; eski seri gelmez
    const bant = await p.evaluate(async (x) => {
      document.getElementById('tab-canlitakip').classList.add('aktif');
      let id = 'e2e-ka-' + Date.now();
      kimAttiBildir({ id, g: x.g, ad: x.ad, puan: 52, oklar: ['X', '10', '9', '9', '8', '6'], t: Date.now(), mesafe: 18 });
      kimAttiBildir({ id, g: x.g, ad: x.ad, puan: 52, oklar: ['X'], t: Date.now() });
      kimAttiBildir({ id: id + 'eski', g: x.g, ad: x.ad, puan: 40, oklar: ['9'], t: Date.now() - 600000 });
      await new Promise((ok) => setTimeout(ok, 700));
      let el = document.getElementById('ka-bant'), r = { acik: !!el && el.classList.contains('acik'), foto: !!el && /api\/foto/.test(el.querySelector('.ka-foto').getAttribute('style') || ''), metin: el ? el.textContent : '', kuyruk: KA.kuyruk.length };
      document.getElementById('tab-canlitakip').classList.remove('aktif');
      return r;
    }, s);
    dogrula(bant.acik && bant.foto && /52/.test(bant.metin) && bant.metin.includes(s.ad), 'kim attı bandı: ' + JSON.stringify(bant));
    esit(bant.kuyruk, 0, 'aynı seri / eski seri banda girmemeli');
    dogrula(await p.evaluate((x) => /yz-pod-foto/.test(fotoYuzHTML(x.g + '|' + x.ad, 'yz-pod-foto')), s), 'kürsü yüzü');
    // izin Yok → girişsiz 401, oturumla (yönetici) görünür, sp.fotoUrl boşalır
    await p.evaluate((kk) => fotoIzinYaz(kk, 0), k); await p.waitForTimeout(300);
    const yeni = await p.evaluate((kk) => fotoBilgi(kk), k);
    r = await fetch(B + '/api/foto/' + encodeURIComponent(k) + '?v=' + yeni.t);
    esit(r.status, 401, 'izinsiz fotoğraf girişsiz verilmemeli');
    const yon = await p.evaluate((kk) => fetch('/api/foto/' + encodeURIComponent(kk)).then((x) => x.status), k);
    esit(yon, 200, 'yönetici izinsiz fotoğrafı görebilmeli');
    dogrula(await p.evaluate((x) => !turnuvaDB[x.g][x.ad].fotoUrl && !fotoSrc(fotoAnahtar(x.g, x.ad), false), s), 'izinsizken oyun/TV adresi boş olmalı');
    await p.evaluate(() => ynKartKapat());
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('yükle + kırp + izin + sunucu kapısı + avatarlar tamam');
  } finally {
    if (k) await p.evaluate((kk) => fotoKaydet(kk, { veri: null, izin: null }).catch(() => {}), k).catch(() => {});
    await p.waitForTimeout(500);
    await ctx.close();
  }
}
