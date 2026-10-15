// Milo (2026-10-16): (1) "Perşembe 17:00 ama Cumartesi 14:00 — ayrı ayrı yapamıyorum": sihirbazda günlere farklı saat → ayrı
// dersler; var olan çok günlü dersten bir günü başka saate ayırma. (2) "İlk ders tarihi": öncesi çizelgede "–", yoklamada beklenmez.
import { miloOturumAl, miloApi, sayfaAc, B, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const tok = await miloOturumAl();
  const { ctx, p, hatalar } = await sayfaAc({ girisli: false, genislik: 1280, yukseklik: 900 });
  await ctx.addInitScript((t) => { localStorage.setItem('milo_oturum', t); }, tok);
  const AD = 'TestDers' + (Date.now() % 100000), GR = 'TestIlkGrup', UYE = 'TEST ILK ' + (Date.now() % 1000);
  const temizle = async () => {
    for (const s of (await miloApi('/antrenman-programi')).d.slots.filter((x) => x.grup.startsWith('TestDers'))) await miloApi('/antrenman-programi/' + s.id, { method: 'DELETE' });
    await miloApi('/members/' + encodeURIComponent(GR) + '/' + encodeURIComponent(UYE), { method: 'DELETE' }).catch(() => {});
  };
  try {
    await p.goto(B + '/milo/'); await p.waitForFunction(() => typeof mspKur === 'function');
    await p.evaluate(() => miloUygulamayaGir()); await p.waitForTimeout(800);
    await p.evaluate(() => miloSekme('program')); await p.waitForTimeout(1500);
    // 1a) sihirbaz
    await p.evaluate((ad) => { _mds.mod = 'manuel'; _mds.ad = ad; _mds.bas = '17:00'; _mds.bit = '17:45'; _miloGunSeciciState['mds-gun'] = new Set([4, 6]); _mds.atamaAcik = false; _mds.secili = {}; mdsCiz(); }, AD);
    const sat = p.locator('#mds-gunsaat label:has-text("Cumartesi") input');
    await sat.fill('14:00'); await p.waitForTimeout(200);
    await p.evaluate(() => mdsOlustur()); await p.waitForTimeout(2500);
    const d1 = (await miloApi('/antrenman-programi')).d.slots.filter((s) => s.grup === AD).map((s) => (s.gunler || [s.gun]).join(',') + ' ' + s.baslangicSaat).sort();
    esit(JSON.stringify(d1), JSON.stringify(['4 17:00', '6 14:00']), 'sihirbaz farklı saatli günleri ayrı ders yapmadı');
    // 1b) ders penceresinden ayır
    const r = await miloApi('/antrenman-programi', { method: 'POST', body: JSON.stringify({ grup: AD + 'b', gunler: [4, 6], baslangicSaat: '17:00', bitisSaat: '17:45', kapasite: 6 }) });
    await p.evaluate(async (id) => { miloProgram = (await miloApi('/antrenman-programi')).slots; miloProgramCiz(); miloDersRosterAc(id); mdpAc('saat'); }, r.d.id); await p.waitForTimeout(500);
    await p.locator('.mdp-gunsaat label:has-text("Cmt") input').fill('14:00'); await p.waitForTimeout(3000);
    const d2 = (await miloApi('/antrenman-programi')).d.slots.filter((s) => s.grup === AD + 'b').map((s) => (s.gunler || [s.gun]).join(',') + ' ' + s.baslangicSaat + ' k' + s.kapasite).sort();
    esit(JSON.stringify(d2), JSON.stringify(['4 17:00 k6', '6 14:00 k6']), 'ders penceresinden gün ayrılmadı');
    // 2) ilk ders tarihi: ayın 10'u → 3'ü "–", 20'si dokunulabilir
    const ay = new Date().toISOString().slice(0, 7), bas = ay + '-10';
    await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: GR, ad: UYE, katilmaTarihi: bas }) });
    await p.evaluate(() => { MD.yuklendi = false; MD.cz = null; miloCizelgeAc(); });
    await p.waitForSelector('#md-cz', { timeout: 15000 });
    await p.evaluate(([gr, ay]) => { mdCzGrup(encodeURIComponent(gr)); mdCzGunEkle(ay + '-03'); mdCzGunEkle(ay + '-09'); }, [GR, ay]); await p.waitForTimeout(300);
    const satir = await p.evaluate((ad) => { let tr = [...document.querySelectorAll('#md-cz .md-cz-tablo tbody tr')].find((t) => t.querySelector('.ad').textContent.startsWith(ad)); return tr ? [...tr.querySelectorAll('td')].slice(1, -1).map((td) => (td.querySelector('.once') ? '–' : 'x')).join('') : null; }, UYE);
    esit(satir, '––', 'ilk ders öncesi günler "–" değil');
    await p.evaluate((ay) => mdCzGunEkle(new Date().getDate() >= 12 ? ay + '-11' : ay + '-10'), ay); await p.waitForTimeout(200);
    const satir2 = await p.evaluate((ad) => { let tr = [...document.querySelectorAll('#md-cz .md-cz-tablo tbody tr')].find((t) => t.querySelector('.ad').textContent.startsWith(ad)); return [...tr.querySelectorAll('td')].slice(1, -1).map((td) => (td.querySelector('.once') ? '–' : 'x')).join(''); }, UYE);
    esit(satir2, '––x', 'ilk dersten sonraki gün işaretlenemiyor');
    dogrula(!hatalar.length, 'sayfa hatası: ' + hatalar.join(' | '));
    log('günlere farklı saat (sihirbaz + ders penceresi), ilk ders tarihi öncesi "–" ✓');
  } finally { await temizle().catch(() => {}); await ctx.close(); }
}
