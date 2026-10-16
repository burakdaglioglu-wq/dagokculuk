// DAĞ › Milo'daki 4 yoklama/program özelliğinin DAĞ hâli (2026-10-16, kullanıcı: "dağ okçuluk için de bunları yap"):
//  1) Öğrenci Defteri › 🗓 Geçmiş yoklama çizelgesi (ders/lig seç, hücreye dokun ✓→✗…, gün başlığı = hepsi geldi, toplu Kaydet)
//  2) ↪ Başka gün geldi — Karışık Sınıf Yoklama satırında düğme; o gün 'k' (gelmeyenlerde yok, telafi hakkı doğmaz), seçilen gün geldi
//  3) İlk ders tarihi (sp.katilmaTarihi) — öncesinde dersin listesinde beklenmez, çizelgede "–"
//  4) Günlere farklı saat — yeni ders formunda farklı saatli gün ayrı ders olur; ders penceresinden bir günü başka saate ayırma
// Test kayıtları (yoklama, meta notu, dersler) sonunda silinir; ilk ders tarihi eski değerine döner.
import { sayfaAc, uygulamaAc, yoneticiAc, karisikSinifArac, dogrula, esit, api } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1280, yukseklik: 900 });
  const silYoklama = []; let ilk = null; const silSlot = [];
  try {
    await uygulamaAc(p);
    // ---------- 1) çizelge
    await yoneticiAc(p, 'defter');
    await p.waitForSelector('.od-sat', { timeout: 20000 });
    await p.locator('.od-btn', { hasText: 'Geçmiş yoklama gir' }).click();
    await p.waitForSelector('#od-cz', { timeout: 20000 });
    // Büyükler (tümü), geçen ay; "+ gün" ile ayın 3'ünü ekle
    await p.locator('.od-cz-sec select').selectOption('lbuyukler');
    await p.locator('.od-cz-ay button[aria-label="Önceki ay"]').click();
    const gun = await p.evaluate(() => { const d = new Date(); d.setDate(3); d.setMonth(d.getMonth() - 1); return odIso(d); });
    await p.locator('.od-cz-ekle input').fill(gun); await p.locator('.od-cz-ekle input').dispatchEvent('change');
    await p.waitForTimeout(200);
    const sp = await p.evaluate((g) => { const u = odCzUyeler().find((x) => !odGun(x, g) && !(x.sp.katilmaTarihi && x.sp.katilmaTarihi > g)); return u && { k: u.k, ad: u.ad, g: u.g }; }, gun);
    dogrula(sp, 'çizelgede uygun sporcu yok');
    silYoklama.push({ iso: gun, ad: sp.ad });
    const hucre = p.locator(`.od-cz-tablo tr:has(td.ad:has-text("${sp.ad}")) button[aria-label^="${sp.ad} ${gun.split('-').reverse().join('.')}"]`).first();
    await hucre.click(); await hucre.click(); // boş → ✓ → ✗
    dogrula((await hucre.getAttribute('class')).includes('y'), 'hücre ✗ olmadı');
    dogrula((await p.locator('#od-cz-kaydet').innerText()).includes('1 değişiklik'), 'bekleyen değişiklik sayısı');
    await p.locator('#od-cz-kaydet').click(); await p.waitForTimeout(1200);
    const s1 = (await api('/api/attendance/auto?tarih=' + gun)).d.attendance.find((x) => x.ad === sp.ad);
    dogrula(s1 && !s1.geldi, 'çizelge kaydı sunucuya "gelmedi" yazılmadı');
    // ---------- 3) ilk ders tarihi: paneli aç, tarihi ayın 10'una al → 3'ü "–" olmalı (kaydı olan hücre hariç: önce boşalt)
    await p.evaluate(async (a) => { await odGunYaz(odBul(a.k), a.gun, null); odCzYenile(); }, { k: sp.k, gun });
    ilk = { k: sp.k, eski: await p.evaluate((k) => odBul(k).sp.katilmaTarihi || null, sp.k) };
    await p.locator('.od-cz-ust-btn button', { hasText: 'İlk ders tarihleri' }).click();
    const on = await p.evaluate((g) => g.slice(0, 8) + '10', gun);
    const inp = p.locator(`.od-cz-ilk-sat:has(b:text-is("${sp.ad}")) input[type=date]`);
    await inp.fill(on); await inp.dispatchEvent('change'); await p.waitForTimeout(300);
    esit(await p.evaluate((k) => odBul(k).sp.katilmaTarihi, sp.k), on, 'ilk ders tarihi kaydedilmedi');
    dogrula(await p.locator(`.od-cz-tablo tr:has(td.ad:has-text("${sp.ad}")) .od-cz-h.once`).count(), 'başlamadan önceki gün "–" değil');
    // KM yoklama: başlamadan önceki gün dersin listesinde yok
    const yok = await p.evaluate(async (a) => { await dagskEkYukle('dagsk-km-yoklama-analiz.js'); const s = { katilimcilar: [{ grup: a.g, ad: a.ad }] }; return { once: kmYaSlotSporcu(s, a.gun).length, sonra: kmYaSlotSporcu(s, a.on).length }; }, { ...sp, gun, on });
    dogrula(yok.once === 0 && yok.sonra === 1, 'ilk ders tarihi yoklama listesine uygulanmadı: ' + JSON.stringify(yok));
    await p.evaluate((a) => odIlkDersKaydet(encodeURIComponent(a.k), a.eski), ilk); ilk.geri = true;
    await p.locator('.od-cz-ust-btn button', { hasText: 'Defter' }).click(); await p.waitForTimeout(300);

    // ---------- 2) ↪ başka gün (Karışık Sınıf › Yoklama, gerçek tıklama)
    await p.waitForTimeout(1500); await uygulamaAc(p); // ana ekrandan Karışık Sınıf'a
    await karisikSinifArac(p, 'yoklamaanaliz', 'kmYoklamaAnalizCiz');
    await p.waitForFunction(() => _kmYa.ekDurum, null, { timeout: 15000 });
    const h = await p.evaluate(() => {
      for (let i = 1; i <= 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - i); const iso = kmYaIso(d);
        const s = _kmYa.slotlar.find((x) => kmYaSlotGunler(x).includes(d.getDay()) && !kmYaIptalMi(x, iso)); if (!s) continue;
        const k = kmYaSporcular().find((x) => !kmYaDurum(x, iso) && !kmYaDurum(x, kmYaIso(new Date())) && kmYaTur(x) === 'sporcu');
        s.katilimcilar = [{ grup: k.g, ad: k.ad }]; kmYaTarihAc(iso); return { iso, ad: k.ad, g: k.g, bugun: kmYaIso(new Date()) };
      }
      return null;
    });
    dogrula(h, 'son 7 günde ders yok');
    silYoklama.push({ iso: h.iso, ad: h.ad }, { iso: h.bugun, ad: h.ad });
    const satir = p.locator('.ya-dkart .ya-yk', { hasText: h.ad }).first();
    await satir.locator('button.k').click(); await p.waitForTimeout(300);
    esit(await p.locator('#ya-bg-tarih').inputValue(), h.bugun, 'varsayılan tarih bugün değil');
    await p.locator('#onay-evet-btn').click(); await p.waitForTimeout(1800);
    esit(await p.evaluate((a) => kmYaDurum({ g: a.g, ad: a.ad }, a.iso), h), 'k', 'yoklamada ↪ durumu yok');
    esit(await p.evaluate((a) => kmYaDurum({ g: a.g, ad: a.ad }, a.bugun), h), 'g', 'seçilen gün geldi değil');
    dogrula(await p.locator('.ya-dkart .ya-yk.baska', { hasText: h.ad }).count(), 'satır ↪ görünmüyor');
    const meta = JSON.parse((await api('/api/meta/yoklama_durum')).d.value || '{}')[h.iso + '|' + h.ad];
    dogrula(meta && meta.d === 'baska' && meta.ref === h.bugun, 'meta notu: ' + JSON.stringify(meta));
    dogrula(!(await p.evaluate((a) => kmYaGelmeyenler(_kmYa.slotlar.filter((s) => (s.katilimcilar || []).some((k) => k.ad === a.ad)), a.iso).length, h)), '↪ gelmeyenlerde çıktı');
    // defterde de 'k', telafi hakkı doğurmaz
    const df = await p.evaluate(async (a) => { await dagskEkYukle('dagsk-defter.js'); OD.durum = await odMeta('yoklama_durum'); const u = odBul(a.g + '|' + a.ad); const m = odAylar(u).find((x) => x.ay === a.iso.slice(0, 7)); return { s: odGun(u, a.iso), hakVar: !!(m && m.dersler.some((r) => r.iso === a.iso)) }; }, h);
    esit(df.s, 'k', 'defterde ↪ yok'); dogrula(!df.hakVar, '↪ günü ders/telafi hakkı sayıldı');
    // tekrar dokununca kalkar (not da silinir)
    await satir.locator('button.k').click(); await p.waitForTimeout(1500);
    esit(await p.evaluate((a) => kmYaDurum({ g: a.g, ad: a.ad }, a.iso), h), null, '↪ kaldırılamadı');

    // ---------- 4) günlere farklı saat
    await yoneticiAc(p, 'program'); await p.waitForSelector('#program-gun-container', { timeout: 20000 });
    const once = (await api('/api/antrenman-programi')).d.slots.map((s) => s.id);
    await p.evaluate(() => { _gunSeciciState['program-gun'] = new Set([4]); _gunSeciciToggle('program-gun', 6); }); // Per + Cmt
    await p.waitForSelector('.program-gs-sat[data-gun="6"]');
    await p.evaluate(() => { document.getElementById('program-baslangic-saat').value = '17'; document.getElementById('program-baslangic-dakika').value = '0'; document.getElementById('program-bitis-saat').value = '18'; document.getElementById('program-bitis-dakika').value = '0'; programGunSaatCiz(); });
    await p.locator('#program-gs-6-saat').selectOption('14');
    await p.waitForSelector('.program-gs-sat[data-gun="6"] button[title="Ana saate dön"]');
    await p.locator('button[onclick="programSlotEkle()"]').click(); await p.waitForTimeout(1500);
    const yeni = (await api('/api/antrenman-programi')).d.slots.filter((s) => !once.includes(s.id)); silSlot.push(...yeni.map((s) => s.id));
    esit(yeni.length, 2, 'iki ayrı ders açılmadı');
    const per = yeni.find((s) => s.gunler.includes(4)), cmt = yeni.find((s) => s.gunler.includes(6));
    dogrula(per && per.baslangicSaat === '17:00' && per.bitisSaat === '18:00' && per.gunler.length === 1, 'Perşembe dersi: ' + JSON.stringify(per));
    dogrula(cmt && cmt.baslangicSaat === '14:00' && cmt.bitisSaat === '15:00' && cmt.gunler.length === 1, 'Cumartesi dersi: ' + JSON.stringify(cmt));
    // ders penceresi: 2 günlü dersten Salı'yı 19:00'a ayır
    const iki = (await api('/api/antrenman-programi', { method: 'POST', body: JSON.stringify({ grup: 'genel', gunler: [2, 5], baslangicSaat: '16:00', bitisSaat: '17:00', kapasite: 9 }) })).d.id;
    silSlot.push(iki);
    await p.evaluate(async (id) => { await new Promise((r) => { fetch('/api/antrenman-programi').then((x) => x.json()).then((d) => { _programSlotlar = d.slots; r(); }); }); dersRosterAc(id); dpkAc('saat'); }, iki);
    await p.locator('.dpk-gunsaat input[aria-label="Salı saati"]').fill('19:00');
    await p.locator('.dpk-gunsaat input[aria-label="Salı saati"]').dispatchEvent('change');
    await p.waitForTimeout(1800);
    const l2 = (await api('/api/antrenman-programi')).d.slots, ana = l2.find((s) => s.id === iki), ayr = l2.find((s) => !once.includes(s.id) && !silSlot.includes(s.id));
    if (ayr) silSlot.push(ayr.id);
    dogrula(ana && ana.gunler.length === 1 && ana.gunler[0] === 5, 'eski dersten Salı çıkmadı: ' + JSON.stringify(ana && ana.gunler));
    dogrula(ayr && ayr.gunler[0] === 2 && ayr.baslangicSaat === '19:00' && ayr.bitisSaat === '20:00' && ayr.kapasite === 9, 'ayrılan ders: ' + JSON.stringify(ayr));
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log('DAĞ: çizelge ✗ kaydı, ilk ders "–" + yoklamada yok, ↪ başka gün (k, gelmeyenlerde yok, defterde hak yok), günlere farklı saat (2 ders + gün ayırma) ✓');
  } finally {
    await p.evaluate(async (a) => {
      for (const y of a.y) { try { delete (otomatikYoklamaDB[y.iso] || {})[y.ad]; await fetch('/api/attendance/auto', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tarih: y.iso, ad: y.ad }) }); } catch (e) {} }
      try { otomatikYoklamaKaydet(); } catch (e) {}
      if (a.ilk && !a.ilk.geri && typeof odIlkDersKaydet === 'function') try { odIlkDersKaydet(encodeURIComponent(a.ilk.k), a.ilk.eski); } catch (e) {}
      for (const id of a.s) { try { await fetch('/api/antrenman-programi/' + id, { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: '{}' }); } catch (e) {} }
    }, { y: silYoklama, ilk, s: silSlot }).catch(() => {});
    await p.waitForTimeout(800);
    await ctx.close();
  }
}
