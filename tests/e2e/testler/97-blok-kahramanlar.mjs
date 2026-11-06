// Karışık Sınıf › Oyunlar › 🦸 Blok Kahramanlar (2026-11-03, v372; kullanıcı 8 yaş için "süper kahraman + blok dünya + hep birlikte
// büyük düşman", iki boss taslağına "bu ikisini de yap"). Doğrulanan: tema açılır, dosya tembel yüklenir, tuval + HUD çizilir;
// dock'tan girilen seri GERÇEK kayda yazılır ve boss'tan küp koparır (halka gücü: sarı 3, kırmızı 2, mavi donar, siyah onarır);
// her 5 seride boss saldırır (donmuşsa boşa); can bitse de HERKES atmadan boss düşmez, son kahraman atınca hep birlikte final
// (yenilenler + herkese rozet) ve sıradaki boss (diğer tip); geri al; Ejder sahnesi; dokununca sıra o çocuğa geçer.
import { sayfaAc, uygulamaAc, karisikSinifArac, dogrula, esit } from '../yardimci.mjs';

export default async function ({ log }) {
  const { ctx, p, hatalar } = await sayfaAc({ genislik: 1400, yukseklik: 900 });
  let yedekListe = null;
  try {
    await uygulamaAc(p);
    await karisikSinifArac(p, 'oyunlar');
    yedekListe = await p.evaluate(() => JSON.stringify(_kmListe));
    const n = await p.evaluate(() => {
      let tum = []; ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach((g) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { if (!turnuvaDB[g][ad].pasif) tum.push({ g, ad }); }));
      _kmListe = tum.slice(0, 4); localStorage.removeItem('dag_km_blok_' + (_kmAktifKonum || 'varsayilan')); localStorage.removeItem('dag_km_blokbs_' + (_kmAktifKonum || 'varsayilan')); _kmOyunRosterCache.forEach((s) => { const sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (sp) sp.devamModu = true; }); kmOyunTemaSec('blok'); return _kmOyunRosterCache.length; });
    dogrula(n >= 2, 'testte en az 2 sporcu gerekli (gelen ' + n + ')');
    await p.waitForFunction(() => !!document.getElementById('blk-cv') && /LAV GOLEMİ/.test((document.getElementById('blk-hud') || {}).textContent || ''), null, { timeout: 30000 });
    const ilk = await p.evaluate(() => ({ kutu: document.querySelectorAll('#blk-kutular [data-km-sporcu]').length, tema: KM_OYUN_TEMALAR.blok && KM_OYUN_TEMALAR.blok.ad, sifir: KM_OYUN_SIFIR_ONEK.indexOf('dag_km_blok_') >= 0, icerik: !!KM_OYUN_ICERIK.blok }));
    dogrula(ilk.kutu === n && ilk.tema === 'Blok Kahramanlar' && ilk.sifir && ilk.icerik, 'kurulum: ' + JSON.stringify(ilk));

    const seri = async (oklar, hedef) => p.evaluate(async ([oklar, hedef]) => {
      const gecerli = (j) => { const x = _kmOyunRosterCache[j]; return x && turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]; };
      if (typeof hedef === 'number') _kmOyunAktifIndex = hedef; else for (let j = 0; j < _kmOyunRosterCache.length && !gecerli(_kmOyunAktifIndex); j++) _kmOyunAktifIndex = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length;
      const i = _kmOyunAktifIndex, s = _kmOyunRosterCache[i], sp = (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]) || {}, once = (sp.seriler || []).length;
      _kmOyunSeriGirisleri = oklar.slice(); _kmOyunSeriKonumlari = []; kmOyunIlerlet();
      for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150));
      const m = document.getElementById('onay-modal'); if (m && getComputedStyle(m).display !== 'none') { onayOnayla(); for (let k = 0; k < 100 && _kmOyunKilit; k++) await new Promise((r) => setTimeout(r, 150)); }
      return { ad: s.ad, key: s.g + '|' + s.ad, once, sonra: (sp.seriler || []).length, st: JSON.parse(JSON.stringify(blkDurum())), i, sira: _kmOyunAktifIndex };
    }, [oklar, hedef]);
    // 12 kahraman: sınıfta 12 kişiye kadar aynısı yok, atanan kalıcı (2026-11-06)
    const kh = await p.evaluate(() => { const a = 'dag_km_blokkh_' + (_kmAktifKonum || 'varsayilan'), l = _kmOyunRosterCache.slice(0, 12).map((s) => s.g + '|' + s.ad), ilk = l.map((k) => blkKahraman(k)), kayit = JSON.parse(localStorage.getItem(a) || '{}'); return { tur: _blkKahramanlar().length, n: l.length, farkli: new Set(ilk).size, ayni: JSON.stringify(ilk) === JSON.stringify(l.map((k) => blkKahraman(k))), kayitli: l.every((k) => kayit[k] != null), sifir: KM_OYUN_SIFIR_ONEK.some((o) => a.indexOf(o) === 0) }; });
    esit(kh.tur, 12, '12 kahraman'); esit(kh.farkli, kh.n, 'aynı kahraman çıkmamalı'); dogrula(kh.ayni && kh.kayitli, 'kahraman kalıcı değil'); esit(kh.sifir, false, 'kahraman 12 saat kuralıyla silinmemeli');
    dogrula(/:/.test(await p.locator('#blk-sira-kh').innerText()), 'HUD kahraman adını göstermiyor');
    const c0 = await p.evaluate(() => blkDurum().can);
    const r1 = await seri(['10', '7', '5']); // 3 + 2 + 1, mavi donar
    esit(r1.sonra, r1.once + 1, 'seri gerçek kayda yazılmadı');
    esit(c0 - r1.st.can, 6, 'küp hasarı (sarı 3 + kırmızı 2 + mavi 1)');
    dogrula(r1.st.donmus === 1 && r1.st.atanlar[r1.key] && r1.st.katki[r1.key] === 6, 'donma / atanlar / katkı: ' + JSON.stringify(r1.st));
    dogrula(r1.sira !== r1.i, 'sıra sonraki sporcuya geçmedi');
    // 5. seride saldırı: donmuş olduğu için boşa gider; sonra yeni saldırı bina yıkar, siyah onarır
    const sal = await p.evaluate(() => { const st = blkDurum(); st.seri = 4; st.donmus = 1; localStorage.setItem('dag_km_blok_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); return 1; });
    void sal;
    const r2 = await seri(['M', 'M', 'M']);
    dogrula(r2.st.sehir.every(Boolean) && r2.st.donmus === 0, 'donmuş boss saldırısı boşa gitmeli: ' + JSON.stringify(r2.st.sehir));
    await p.evaluate(() => { const st = blkDurum(); st.seri = 9; localStorage.setItem('dag_km_blok_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); });
    const r3 = await seri(['M', 'M', 'M']);
    esit(r3.st.sehir.filter(Boolean).length, 5, 'saldırı bir bina yıkmalı');
    const r4 = await seri(['4', 'M', 'M']);
    esit(r4.st.sehir.filter(Boolean).length, 6, 'siyah halka binayı onarmalı');
    // geri al → önceki durum
    const geri = await p.evaluate(() => { const once = _kmOyunSonGiris && _kmOyunSonGiris.blok; window.confirm = () => true; kmOyunSonGirisiGeriAl(); const st = blkDurum(); return { var: !!once, sehir: st.sehir.filter(Boolean).length }; });
    dogrula(geri.var && geri.sehir === 5, 'geri al: ' + JSON.stringify(geri));
    // HERKES ATMADAN DÜŞMEZ: canı 1'e indir, atanları sıfırla → ilk çocuk vurur, boss düşmez (son küp); herkes atınca final
    await p.evaluate(() => { const st = blkDurum(); st.can = 1; st.atanlar = {}; localStorage.setItem('dag_km_blok_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); });
    const no0 = await p.evaluate(() => blkDurum().no);
    const a = await seri(['10', '10', '10']);
    dogrula(a.st.can === 0 && a.st.no === no0, 'herkes atmadan boss düşmemeli: ' + JSON.stringify({ can: a.st.can, no: a.st.no }));
    const kalan = await p.evaluate(() => { const st = blkDurum(); return _kmOyunRosterCache.map((x, j) => (turnuvaDB[x.g] && turnuvaDB[x.g][x.ad] && !st.atanlar[x.g + '|' + x.ad]) ? j : -1).filter((j) => j >= 0); });
    const nv = kalan.length + 1;
    dogrula(/Hep birlikte bitir/.test(await p.evaluate(() => document.getElementById('blk-hud').textContent)), 'son küpte koç düğmesi yok');
    let son = a;
    for (const j of kalan) son = await seri(['3', 'M', 'M'], j);
    dogrula(son.st.no === no0 + 1 && son.st.tip === 'ejder' && son.st.can === son.st.toplam && son.st.yenilenler.length >= 1, 'final + sıradaki boss: ' + JSON.stringify({ no: son.st.no, tip: son.st.tip }));
    esit(son.st.yenilenler[son.st.yenilenler.length - 1].adlar.length, nv, 'finalde atan herkesin adı');
    await p.waitForTimeout(8200);
    dogrula(/GÖLGE EJDER/.test(await p.evaluate(() => document.getElementById('blk-hud').textContent)), 'Ejder HUD');
    // koç: atmayan kaldıysa ⚡ Hep birlikte bitir
    const zorla = await p.evaluate(async () => { const k = 'dag_km_blok_' + (_kmAktifKonum || 'varsayilan'), st = blkDurum(), x = _kmOyunRosterCache[0]; st.can = 0; st.atanlar = {}; st.atanlar[x.g + '|' + x.ad] = 1; localStorage.setItem(k, JSON.stringify(st)); const no = st.no; blkGuncelle(); blkFinalZorla(); await new Promise((r) => setTimeout(r, 200)); onayOnayla(); await new Promise((r) => setTimeout(r, 300)); const s2 = blkDurum(); return { no, sonra: s2.no, tip: s2.tip, adlar: s2.yenilenler[s2.yenilenler.length - 1].adlar.length }; });
    dogrula(zorla.sonra === zorla.no + 1 && zorla.tip === 'buz' && zorla.adlar === 1, 'hep birlikte bitir: ' + JSON.stringify(zorla));
    await p.waitForTimeout(8000);
    // 8 canavar (2026-11-06): sıra kalıcı (yeni gün kalınan yerden), her biri tam / hasarlı / son küp halinde hatasız çizilir, sahneler farklı, galeriden seçilir
    const bs = await p.evaluate(() => {
      const k = 'dag_km_blok_' + (_kmAktifKonum || 'varsayilan'), ka = 'dag_km_blokbs_' + (_kmAktifKonum || 'varsayilan'), tipler = _blkBosslar(), kal = JSON.parse(localStorage.getItem(ka) || '{}');
      const st0 = blkDurum(); st0.tarih = '2000-01-01'; localStorage.setItem(k, JSON.stringify(st0));
      const yeniGun = blkDurum().tip;
      const resim = new Set(), hata = [];
      tipler.forEach((t) => { [1, .4, 0].forEach((o) => { try { const st = blkDurum(); st.tip = t; st.can = Math.round(st.toplam * o); localStorage.setItem(k, JSON.stringify(st)); _blkCizDene(); if (o === 1) resim.add(document.getElementById('blk-cv').toDataURL('image/png').length); } catch (e) { hata.push(t + ':' + e.message); } }); });
      return { n: tipler.length, sira: kal.sira, golem: kal.yenilen && kal.yenilen.golem, ejder: kal.yenilen && kal.yenilen.ejder, yeniGun, farkli: resim.size, hata };
    });
    esit(bs.n, 8, '8 canavar'); esit(bs.hata.length, 0, 'çizim: ' + bs.hata.join(' | ')); esit(bs.farkli, 8, 'her canavarın sahnesi farklı olmalı');
    dogrula(bs.sira === 'buz' && bs.golem >= 1 && bs.ejder >= 1, 'kalıcı sıra: ' + JSON.stringify(bs));
    esit(bs.yeniGun, 'buz', 'yeni gün kalınan canavardan sürmeli');
    await p.evaluate(() => { const st = blkDurum(); st.tip = 'buz'; st.can = st.toplam; localStorage.setItem('dag_km_blok_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); });
    await p.click('#blk-boss-btn');
    esit(await p.locator('#blk-galeri .blk-g-kart').count(), 8, 'galeride 8 kart');
    await p.click('#blk-galeri .blk-g-kart[data-tip="kraken"]');
    dogrula(await p.evaluate(() => blkDurum().tip === 'kraken' && JSON.parse(localStorage.getItem('dag_km_blokbs_' + (_kmAktifKonum || 'varsayilan'))).sira === 'kraken' && /KRAKEN/.test(document.getElementById('blk-hud').textContent)), 'galeriden seçim');
    // yeni canavarda da saldırı evi yıkar, siyah onarır
    await p.evaluate(() => { const st = blkDurum(); st.seri = 4; st.donmus = 0; localStorage.setItem('dag_km_blok_' + (_kmAktifKonum || 'varsayilan'), JSON.stringify(st)); });
    const rk = await seri(['M', 'M', 'M']);
    esit(rk.st.sehir.filter(Boolean).length, 5, 'kraken saldırısı bir gemi batırmalı');
    const rk2 = await seri(['4', 'M', 'M']);
    esit(rk2.st.sehir.filter(Boolean).length, 6, 'siyah halka gemiyi onarmalı');
    // dokununca sıra o çocuğa
    const dok = await p.evaluate(() => { const hedef = (_kmOyunAktifIndex + 1) % _kmOyunRosterCache.length; document.querySelector('#blk-kutular [data-km-sporcu="' + hedef + '"]').click(); return { hedef, ai: _kmOyunAktifIndex }; });
    esit(dok.ai, dok.hedef, 'kahramana dokununca sıra geçmedi');
    esit(hatalar.length, 0, 'sayfa hatası: ' + hatalar.join(' | '));
    log(`${n} kahraman · 8 canavar + kalıcı sıra + galeri · halka gücü (3+2+1, donma) · donmuşken saldırı boşa · bina yıkılır/onarılır · geri al · herkes atmadan düşmez → hep birlikte final · Ejder sırada · dokununca sıra`);
  } finally {
    await p.evaluate((y) => { try { localStorage.removeItem('dag_km_blok_' + (_kmAktifKonum || 'varsayilan')); localStorage.removeItem('dag_km_blokbs_' + (_kmAktifKonum || 'varsayilan')); if (y) _kmListe = JSON.parse(y); } catch (e) {} }, yedekListe).catch(() => {});
    await ctx.close();
  }
}
