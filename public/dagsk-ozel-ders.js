/* ================================================================================================
   💪 SPORLA GELİŞİYORUM — Eğitmen › Özel Ders (2026-10-29, v343).
   Kullanıcı: "Furkan adlı sporcumla haftanın belirli saatlerinde özel ders yapıyorum ama okçuluk değil — 10 yaşında,
   koordinasyon, güç, denge gibi antrenmanlar. Aynı okçuluktaki gibi oyunları açıyorum, yaptığı hareketlere göre puan
   veriyorum, oyunların ilerleyişini birlikte TV'den takip ediyoruz — sanki ok atmış gibi hamle oluyor. Hareket
   değerlendirmesiyle ilerleme yapalım; ailesine de 'bugün ne yaptık, nelerde gelişeceğiz' bilgisini gönderelim."
   ------------------------------------------------------------------------------------------------
   • Sekme #icerik-ozelders (yalnız eğitmen): özel ders öğrencileri → öğrenci sayfası: bugünün hareketleri (kütüphaneden
     seçilir), hızlı puan, 🎮 oyunlarla devam, ders notu, 📩 veliye "bugün ne yaptık", gelişim (kategori ortalamaları,
     çizgi), geçmiş dersler.
   • 🎮 Oyunlar: Karışık Sınıf'ın kendi konumu açılır — 'ozel_<kısa kimlik>' (v346: yalnız bellekte; Karışık Sınıf'ın konum listesine ve
     cihazın konumuna YAZILMAZ — TV de özel ders sayfasından aynı öğrenciyle açılır, durum km-ortak ile aynı konumda buluşur). Bu konumda HAREKET MODU (ozdHareketModu): kmOyunIlerlet seriyi okçuluk
     kaydına (_skorKaydetCekirdek) YAZMAZ, ozdSeriKaydet ile özel ders defterine yazar; klasman/yoklama/kuşak atlanır.
     Dock'ta hangi hareketin puanlandığı seçilir (ozdDokHTML). Puan = hareket değerlendirmesi: X mükemmel … M yapamadı.
   • Veri: meta 'ozel_ders' (kyDepo, kayıt başına LWW 't'):
       'ogr|g|ad'          { g, ad, aktif, saatler, hedef, t }
       'ders|g|ad|tarih'   { g, ad, tarih, hareketler:[id], kayitlar:[{id, h, p:[puan], t}], not, gonderildi, t }
       'hrk|id'            { id, ad, kat, grup, kg, t }  — eğitmenin eklediği hareket (kütüphanedekilere ek)
       'test|g|ad|tarih'   { g, ad, tarih, olcum:{testId: sayı}, t }  — 📏 fiziksel test (v344)
     Ders kaydında kg:{hareketId: kg} (dumbbell, v344); kayitlar[].kg o serinin ağırlığı.
   ================================================================================================ */

const OZD_KAT = {
    koord: { ad: 'Koordinasyon', ikon: '🤹', renk: '#7dd3fc', ev: 'Evde: duvara top atıp tutma, 2 dk — sağ ve sol el sırayla.' },
    denge: { ad: 'Denge', ikon: '🧘', renk: '#a8e6a1', ev: 'Evde: diş fırçalarken tek ayak üstünde durma (her ayak 30 sn).' },
    guc: { ad: 'Güç', ikon: '💪', renk: '#ff9f43', ev: 'Evde: 10 squat + 10 sn plank, günde 2 kez.' },
    cevik: { ad: 'Çeviklik', ikon: '⚡', renk: '#ffd23f', ev: 'Evde: yere çizgi koyup sağa-sola hızlı sekme, 3 × 15 sn.' },
    esnek: { ad: 'Esneklik', ikon: '🤸', renk: '#c9a6ff', ev: 'Evde: yatmadan önce öne eğilme ve kelebek esnemesi, 1\'er dk.' },
    dayan: { ad: 'Dayanıklılık', ikon: '❤️', renk: '#ff8fa8', ev: 'Evde: 1 dk jumping jack, 30 sn mola, 3 tur.' }
};
// v344 (kullanıcı: "bazen vücut ağırlığıyla, bazen okçuluk alanındaki 1–10 kg dumbbell'larla geliştirme hareketleri, bazen sprint,
// bazen topla, BOSU / denge tahtası, zıplama-sıçrama… hepsini düşün") — kütüphane EKİPMANA göre gruplu (grup), gelişim yine
// kategoriye göre (kat). kg:true → dumbbell ağırlığı da kaydedilir. Eski kimlikler (v343 kayıtları) korunur.
const OZD_GRUP = {
    vucut: '🧍 Vücut ağırlığı', dumbbell: '🏋️ Dumbbell (1–10 kg)', sprint: '🏃 Sprint & koşu', top: '⚽ Topla',
    bosu: '🟣 BOSU & denge tahtası', zipla: '🦘 Zıplama & sıçrama', esnek: '🧘 Esneme & mobilite'
};
const OZD_HAREKETLER = [
    { id: 'squat', ad: 'Squat', kat: 'guc', grup: 'vucut' }, { id: 'sinav', ad: 'Şınav', kat: 'guc', grup: 'vucut' }, { id: 'plank', ad: 'Plank', kat: 'guc', grup: 'vucut' },
    { id: 'yan-plank', ad: 'Yan plank', kat: 'guc', grup: 'vucut' }, { id: 'hamle', ad: 'Hamle (lunge)', kat: 'guc', grup: 'vucut' }, { id: 'kopru', ad: 'Köprü', kat: 'guc', grup: 'vucut' },
    { id: 'superman', ad: 'Süpermen', kat: 'guc', grup: 'vucut' }, { id: 'ayi', ad: 'Ayı yürüyüşü', kat: 'koord', grup: 'vucut' }, { id: 'capraz', ad: 'Çapraz kol-bacak', kat: 'koord', grup: 'vucut' },
    { id: 'tirmanici', ad: 'Dağ tırmanıcı', kat: 'dayan', grup: 'vucut' }, { id: 'jumping', ad: 'Jumping jack', kat: 'dayan', grup: 'vucut' },
    { id: 'db-goblet', ad: 'Goblet squat', kat: 'guc', grup: 'dumbbell', kg: true }, { id: 'db-omuz', ad: 'Omuz press', kat: 'guc', grup: 'dumbbell', kg: true },
    { id: 'db-row', ad: 'Tek kol row (sırt)', kat: 'guc', grup: 'dumbbell', kg: true }, { id: 'db-yan', ad: 'Yana açış', kat: 'guc', grup: 'dumbbell', kg: true },
    { id: 'db-curl', ad: 'Biceps curl', kat: 'guc', grup: 'dumbbell', kg: true }, { id: 'db-hamle', ad: 'Dumbbell hamle', kat: 'guc', grup: 'dumbbell', kg: true },
    { id: 'db-rdl', ad: 'Romen deadlift', kat: 'guc', grup: 'dumbbell', kg: true }, { id: 'db-ciftci', ad: 'Çiftçi yürüyüşü', kat: 'dayan', grup: 'dumbbell', kg: true },
    { id: 'sprint-10', ad: '10 m çıkış sprinti', kat: 'cevik', grup: 'sprint' }, { id: 'sprint-20', ad: '20 m sprint', kat: 'cevik', grup: 'sprint' },
    { id: 'mekik-kosu', ad: 'Mekik koşusu', kat: 'cevik', grup: 'sprint' }, { id: 'reaksiyon', ad: 'Reaksiyon çıkışı', kat: 'cevik', grup: 'sprint' },
    { id: 'slalom', ad: 'Koni slalom', kat: 'cevik', grup: 'sprint' }, { id: 'yan-kayma', ad: 'Yan kayma', kat: 'cevik', grup: 'sprint' },
    { id: 'merdiven', ad: 'Koordinasyon merdiveni', kat: 'koord', grup: 'sprint' }, { id: 'yuksek-diz', ad: 'Yüksek diz koşu', kat: 'dayan', grup: 'sprint' },
    { id: 'top-sektir', ad: 'Top sektirme (sağ-sol)', kat: 'koord', grup: 'top' }, { id: 'at-tut', ad: 'Top at-tut (jonglör)', kat: 'koord', grup: 'top' },
    { id: 'top-duvar', ad: 'Duvara pas-tut', kat: 'koord', grup: 'top' }, { id: 'top-ayak', ad: 'Ayakla top sürme', kat: 'koord', grup: 'top' },
    { id: 'saglik-topu', ad: 'Sağlık topu fırlatma', kat: 'guc', grup: 'top' }, { id: 'flamingo-top', ad: 'Tek ayakta top yakalama', kat: 'denge', grup: 'top' },
    { id: 'bosu', ad: 'Denge tahtası', kat: 'denge', grup: 'bosu' }, { id: 'bosu-tek', ad: 'BOSU tek ayak', kat: 'denge', grup: 'bosu' },
    { id: 'bosu-squat', ad: 'BOSU squat', kat: 'denge', grup: 'bosu' }, { id: 'bosu-top', ad: 'BOSU üstünde top at-tut', kat: 'koord', grup: 'bosu' },
    { id: 'tek-ayak', ad: 'Tek ayak duruş', kat: 'denge', grup: 'bosu' }, { id: 'ucak', ad: 'Uçak duruşu', kat: 'denge', grup: 'bosu' }, { id: 'cizgi', ad: 'Çizgide yürüme', kat: 'denge', grup: 'bosu' },
    { id: 'durarak-uzun', ad: 'Durarak uzun atlama', kat: 'guc', grup: 'zipla' }, { id: 'squat-jump', ad: 'Squat jump', kat: 'guc', grup: 'zipla' },
    { id: 'kutu', ad: 'Kutuya sıçrama', kat: 'guc', grup: 'zipla' }, { id: 'engel', ad: 'Engel üstünden sıçrama', kat: 'cevik', grup: 'zipla' },
    { id: 'yan-sicrama', ad: 'Yana sıçrama', kat: 'cevik', grup: 'zipla' }, { id: 'seksek', ad: 'Seksek', kat: 'cevik', grup: 'zipla' },
    { id: 'zipla-alkis', ad: 'Zıpla + alkış', kat: 'koord', grup: 'zipla' }, { id: 'ip', ad: 'İp atlama', kat: 'dayan', grup: 'zipla' },
    { id: 'one-egil', ad: 'Öne eğilme', kat: 'esnek', grup: 'esnek' }, { id: 'kelebek', ad: 'Kelebek', kat: 'esnek', grup: 'esnek' },
    { id: 'kedi-inek', ad: 'Kedi-inek', kat: 'esnek', grup: 'esnek' }, { id: 'omuz', ad: 'Omuz açma', kat: 'esnek', grup: 'esnek' }
];
// 📏 Fiziksel test (sınav) — dönem dönem ölçülür; az: düşük değer daha iyi (süre)
const OZD_TESTLER = [
    { id: 't-sprint20', ad: '20 m sprint', birim: 'sn', az: true, ondalik: 2 }, { id: 't-mekik', ad: 'Mekik koşusu 4×10 m', birim: 'sn', az: true, ondalik: 2 },
    { id: 't-uzun', ad: 'Durarak uzun atlama', birim: 'cm' }, { id: 't-dikey', ad: 'Dikey sıçrama', birim: 'cm' },
    { id: 't-tekayak', ad: 'Tek ayak denge (gözler kapalı)', birim: 'sn', ondalik: 1 }, { id: 't-bosu', ad: 'BOSU üstünde denge', birim: 'sn', ondalik: 1 },
    { id: 't-plank', ad: 'Plank', birim: 'sn' }, { id: 't-sinav', ad: '30 sn şınav', birim: 'adet' }, { id: 't-squat', ad: '30 sn squat', birim: 'adet' },
    { id: 't-top', ad: 'Sağlık topu fırlatma', birim: 'm', ondalik: 1 }, { id: 't-esnek', ad: 'Otur-uzan', birim: 'cm' }
];
const OZD_PUAN = ['X', '10', '9', '8', '7', '6', '5', '4', '3', 'M'];
const OZD_PUAN_AD = { X: 'Mükemmel', 10: 'Harika', 9: 'Çok iyi', 8: 'Çok iyi', 7: 'İyi', 6: 'İyi', 5: 'Gelişiyor', 4: 'Gelişiyor', 3: 'Zorlandı', 2: 'Zorlandı', 1: 'Zorlandı', M: 'Yapamadı' };

let _ozdSecili = null; // açık öğrenci anahtarı 'g|ad'

function ozdEsc(t) { return typeof esc === 'function' ? esc(t) : String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function ozdBugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
function ozdIlkAd(ad) { const i = String(ad || '').trim().split(/\s+/)[0] || ''; return i.charAt(0) + i.slice(1).toLocaleLowerCase('tr-TR'); }
function ozdDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }
function ozdOrt(l) { return l.length ? l.reduce((a, b) => a + b, 0) / l.length : null; }
function ozdSayi(n) { return n == null ? '—' : (Math.round(n * 10) / 10).toLocaleString('tr-TR'); }
function ozdTarihYazi(t) { try { return new Date(t + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }); } catch (e) { return t; } }
// Türkçe iyelik eki: Furkan'ın, Ayşe'nin, Umut'un, Gül'ün
function ozdIn(ad) { const u = ad.toLocaleLowerCase('tr-TR'), sesli = u.match(/[aeıioöuü]/g), son = sesli ? sesli[sesli.length - 1] : 'e', ek = { a: 'ın', ı: 'ın', e: 'in', i: 'in', o: 'un', u: 'un', ö: 'ün', ü: 'ün' }[son]; return ad + "'" + (/[aeıioöuü]$/.test(u) ? 'n' : '') + ek; }
function ozdYildiz(o) { const n = Math.max(1, Math.min(5, Math.round((o || 0) / 2))); return '⭐'.repeat(n); }

/* ---------------- veri ---------------- */
function ozdDepo() { return typeof kyDepoOku === 'function' ? kyDepoOku('ozel_ders') : {}; }
function ozdYaz(k, v) {
    const d = ozdDepo(); v.t = Date.now(); d[k] = v;
    if (typeof kyDepoYazYerel === 'function') kyDepoYazYerel('ozel_ders', d);
    try { kyDepoSenkron('ozel_ders', () => kyDepoOku('ozel_ders'), true).catch(() => {}); } catch (e) { }
    return v;
}
function ozdSenkron() { try { return kyDepoSenkron('ozel_ders', () => kyDepoOku('ozel_ders'), false); } catch (e) { return Promise.resolve(); } }
function ozdOgrenciler() { const d = ozdDepo(); return Object.keys(d).filter((k) => k.indexOf('ogr|') === 0 && d[k] && d[k].aktif !== false).map((k) => d[k]); }
function ozdOgr(k) { return ozdDepo()['ogr|' + k] || null; }
function ozdHareketler() { const d = ozdDepo(), ek = Object.keys(d).filter((k) => k.indexOf('hrk|') === 0 && d[k] && !d[k].sil).map((k) => d[k]); return OZD_HAREKETLER.concat(ek); }
function ozdHareket(id) { return ozdHareketler().find((h) => h.id === id) || { id: id, ad: id, kat: 'koord', grup: 'vucut' }; }
function ozdKg(d, id) { return ozdHareket(id).kg ? ((d.kg && d.kg[id]) || null) : null; }
function ozdDersler(k) { const d = ozdDepo(), on = 'ders|' + k + '|'; return Object.keys(d).filter((x) => x.indexOf(on) === 0 && d[x]).map((x) => d[x]).sort((a, b) => a.tarih < b.tarih ? -1 : 1); }
function ozdDers(k, tarih) { return ozdDepo()['ders|' + k + '|' + (tarih || ozdBugun())] || null; }
// Bugünün dersi (yoksa son dersin hareketleriyle kurulur — program gibi sürer)
function ozdBugunDers(k) {
    let d = ozdDers(k); if (d) return d;
    const [g, ad] = ozdAyir(k), onceki = ozdDersler(k).pop();
    return { g: g, ad: ad, tarih: ozdBugun(), hareketler: onceki ? onceki.hareketler.slice() : ['top-sektir', 'tek-ayak', 'squat', 'slalom'], kayitlar: [], not: '' };
}
function ozdAyir(k) { const i = k.indexOf('|'); return [k.slice(0, i), k.slice(i + 1)]; }
function ozdSp(k) { const [g, ad] = ozdAyir(k); return (typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]) || null; }
// Ders içi ortalamalar: hareket → ort, kategori → ort
function ozdDersOzet(d) {
    const hk = {}; (d.kayitlar || []).forEach((r) => { (hk[r.h] = hk[r.h] || []).push(...r.p.map(ozdDeger)); });
    const h = {}; Object.keys(hk).forEach((id) => { h[id] = ozdOrt(hk[id]); });
    const kk = {}; Object.keys(h).forEach((id) => { const kat = ozdHareket(id).kat; (kk[kat] = kk[kat] || []).push(h[id]); });
    const kat = {}; Object.keys(kk).forEach((x) => { kat[x] = ozdOrt(kk[x]); });
    const tum = [].concat(...Object.values(hk));
    return { h: h, kat: kat, ort: ozdOrt(tum), tekrar: tum.length };
}

/* ---------------- hareket modu (Karışık Sınıf oyunları) ---------------- */
function ozdKonum(k) { let h = 2166136261; for (let i = 0; i < k.length; i++) { h ^= k.charCodeAt(i); h = Math.imul(h, 16777619); } return 'ozel_' + (h >>> 0).toString(36); }
function ozdHareketModu() { try { return typeof _kmAktifKonum !== 'undefined' && String(_kmAktifKonum || '').indexOf('ozel_') === 0; } catch (e) { return false; } }
function ozdKonumKisi() {
    if (!ozdHareketModu()) return null;
    const o = ozdOgrenciler().find((x) => ozdKonum(x.g + '|' + x.ad) === _kmAktifKonum);
    if (o) return o.g + '|' + o.ad;
    const l = (typeof _kmListe !== 'undefined' && _kmListe) || []; return l[0] ? l[0].g + '|' + l[0].ad : null;
}
function ozdSeciliHareket(k) {
    const d = ozdBugunDers(k); let s = null; try { s = localStorage.getItem('dag_ozd_secili_' + k); } catch (e) { }
    return d.hareketler.indexOf(s) >= 0 ? s : d.hareketler[0] || null;
}
function ozdHareketSec(k, id) { try { localStorage.setItem('dag_ozd_secili_' + k, id); } catch (e) { } ozdDokGuncelle(); if (_ozdSecili === k) ozdCiz(); }
// kmOyunIlerlet'in _skorKaydetCekirdek yerine çağırdığı kayıt: okçuluk kaydına dokunmaz
function ozdSeriKaydet(g, ad, kaydedilecek, hareketId) {
    const k = g + '|' + ad, d = JSON.parse(JSON.stringify(ozdBugunDers(k)));
    const h = hareketId || ozdSeciliHareket(k) || 'top-sektir';
    if (d.hareketler.indexOf(h) < 0) d.hareketler.push(h);
    const p = (kaydedilecek || []).map((x) => String(x.puan)), id = 'oz' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const kayit = { id: id, h: h, p: p, t: Date.now() }, kg = ozdKg(d, h); if (kg) kayit.kg = kg;
    d.kayitlar = (d.kayitlar || []).concat([kayit]);
    ozdYaz('ders|' + k + '|' + d.tarih, d);
    if (_ozdSecili === k) setTimeout(ozdCiz, 0);
    if (ozdHareketModu() && ozdDinOto()) setTimeout(() => ozdDinBaslat(), 0); // ⏱️ seri girildi → dinlenme
    return { ok: true, seriPuan: p.reduce((a, v) => a + ozdDeger(v), 0), seriDoc: { id: id }, ozd: true };
}
function ozdSeriGeriAl(g, ad, id) {
    const k = g + '|' + ad, liste = ozdDersler(k).reverse(), d = liste.find((x) => (x.kayitlar || []).some((r) => r.id === id));
    if (!d) return false;
    const y = JSON.parse(JSON.stringify(d)); y.kayitlar = y.kayitlar.filter((r) => r.id !== id);
    ozdYaz('ders|' + k + '|' + y.tarih, y); if (_ozdSecili === k) ozdCiz();
    return true;
}
// Oyun dock'unun üstünde: hangi hareket puanlanıyor
function ozdDokHTML() {
    const k = ozdKonumKisi(); if (!k) return '';
    const d = ozdBugunDers(k), s = ozdSeciliHareket(k), oz = ozdDersOzet(d);
    return `<div class="ozd-dok" id="ozd-dok"><div class="ozd-dok-bas">🤸 Hangi hareket? <small>puan = hareket değerlendirmesi · X mükemmel · M yapamadı</small></div><div class="ozd-dok-cipler">${d.hareketler.map((id) => {
        const h = ozdHareket(id), kt = OZD_KAT[h.kat] || OZD_KAT.koord, o = oz.h[id], kg = ozdKg(d, id);
        return `<button class="ozd-cip${id === s ? ' aktif' : ''}" style="--r:${kt.renk}" onclick="ozdHareketSec('${ozdEsc(k).replace(/'/g, "\\'")}','${id}')">${kt.ikon} ${ozdEsc(h.ad)}${kg ? ' · ' + kg + ' kg' : ''}${o != null ? ` <b>${ozdSayi(o)}</b>` : ''}</button>`;
    }).join('')}</div></div>`;
}
function ozdDokGuncelle() {
    const e = document.getElementById('ozd-dok');
    if (!ozdHareketModu()) { if (e) e.remove(); return; }
    const html = ozdDokHTML(); if (!html) return;
    if (e) { e.outerHTML = html; return; }
    const ic = document.getElementById('km-oyun-dok-icerik'); if (ic) ic.insertAdjacentHTML('afterbegin', html);
    const l = document.getElementById('km-oyun-ok-lbl'); if (l) l.textContent = '🤸 Hareket puanı — ' + (typeof _kmOyunOkSayisi !== 'undefined' ? _kmOyunOkSayisi : 3) + ' tekrar';
}
// Karışık Sınıf açıkken üstte şerit: kimin özel dersi, okçuluk kaydına yazılmadığı, geri dönüş
function ozdKmBanner() {
    const p = document.getElementById('karisik-platform'); if (!p) return;
    let b = document.getElementById('ozd-km-banner');
    try { ozdCss(); } catch (e) { } // stil, özel ders sekmesi hiç açılmadan oyuna girilse de yüklü olsun
    // v346: özel derste ekran okçuluk gibi görünmez — başlık Sporla Gelişiyorum, kuşak kartı gizli (.ozd-modu)
    const mod = ozdHareketModu(), bas = document.getElementById('km-baslik');
    p.classList.toggle('ozd-modu', mod); try { ozdDinCiz(); } catch (e) { } if (bas) bas.textContent = mod ? '💪 Sporla Gelişiyorum · Özel Ders' : '🎯 Karışık Sınıf';
    if (!mod) { if (b) b.remove(); return; }
    const k = ozdKonumKisi(), ad = k ? ozdIlkAd(ozdAyir(k)[1]) : '';
    const html = `<div id="ozd-km-banner" class="ozd-km-banner">💪 <b>Sporla Gelişiyorum · ${ozdEsc(ad)}</b><span>Puanlar hareket değerlendirmesidir — okçuluk kaydına yazılmaz</span><button onclick="ozdSinifaDon()">↩ Özel ders sayfası</button></div>`;
    if (b) b.outerHTML = html; else p.insertAdjacentHTML('afterbegin', html);
}
function ozdOyunaGec(k) {
    const [g, ad] = ozdAyir(k), kon = ozdKonum(k);
    if (typeof _kmAktifKonum === 'undefined') return;
    // v346 (kullanıcı: "bu bölümü diğer tarafla karıştırma — Karışık Sınıf okçuluk, özel ders kişisel gelişim"): cihazın Karışık Sınıf
    // konumu ('dag_km_konum') DEĞİŞMEZ ve özel ders konumu paylaşılan konum listesine EKLENMEZ — özel konum yalnız bu oturumun belleğinde.
    // Karışık Sınıf'a nereden girilirse girilsin (kmAc / konum seçici / Bugünün dersleri) ozdKonumuBirak okçuluk konumuna döner.
    // Bugünün dersi kaydedilsin (oyun ilk seriyi yazmadan önce de hareket listesi görünsün)
    if (!ozdDers(k)) ozdYaz('ders|' + k + '|' + ozdBugun(), ozdBugunDers(k));
    _kmAktifKonum = kon;
    _kmListe = [{ g: g, ad: ad }]; _kmSecimler = {}; _kmSecimler[g + '_' + ad] = _kmListe[0];
    _kmListeKaydet();
    kmPlatformGoster();
    setTimeout(() => { try { kmAracSec('oyunlar'); } catch (e) { } }, 60);
}
// Özel ders modundan çık: cihazın kendi (okçuluk) Karışık Sınıf konumu ve listesi geri gelir
function ozdKonumuBirak() {
    if (!ozdHareketModu()) return;
    let k = null; try { k = localStorage.getItem('dag_km_konum') || null; } catch (e) { }
    if (k && k.indexOf('ozel_') === 0) { // v343–345'te özel konuma takılı kalmış cihaz
        let o = null; try { o = localStorage.getItem('dag_ozd_onceki_konum') || null; } catch (e) { }
        k = o && o.indexOf('ozel_') !== 0 ? o : null;
        try { if (k) localStorage.setItem('dag_km_konum', k); else localStorage.removeItem('dag_km_konum'); } catch (e) { }
    }
    _kmAktifKonum = k;
    try { _kmListe = JSON.parse(localStorage.getItem(kmLocalAnahtari()) || '[]') || []; } catch (e) { _kmListe = []; }
    _kmSecimler = {}; (_kmListe || []).forEach((s) => { _kmSecimler[s.g + '_' + s.ad] = s; });
    try { _kmOyunRosterCache = []; } catch (e) { }
    try { ozdKmBanner(); } catch (e) { }
    const dk = document.getElementById('ozd-dok'); if (dk) dk.remove();
    try { kmDevamBanneriGuncelle(); } catch (e) { }
}
function ozdSinifaDon() {
    try { if (typeof kmOyunKapat === 'function' && document.getElementById('km-oyun-wrap')) kmOyunKapat(); } catch (e) { }
    ozdKonumuBirak();
    const p = document.getElementById('karisik-platform'); if (p) p.style.display = 'none';
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { }
    try { sekmeAc('ozelders'); } catch (e) { }
}
// v343–345'te konumu özel derse takılmış cihaz açılışta düzelir
try { if (typeof _kmAktifKonum !== 'undefined' && String(_kmAktifKonum || '').indexOf('ozel_') === 0) ozdKonumuBirak(); } catch (e) { }

/* ---------------- ⏱️ dinlenme sayacı (v346, kullanıcı: "oyunların içerisinde dinlenme saniyelerini de koy, görünür bir yere,
   büyütülebilir — özel dersteki yerden bahsediyorum") — yalnız hareket modunda, Karışık Sınıf ekranının üstünde yüzer.
   Her puan girişinden sonra kendiliğinden başlar (otomatik kapatılabilir); süre çipleri; ⤢ ile TV için ekran boyu. ---------------- */
let _ozdDin = { kalan: 0, toplam: 0, t: null, buyuk: false };
// v349 (kullanıcı: "bu dinlenmeyi diğer tarafa da taşı — Karışık Sınıf'taki bütün oyunlarda bir köşede küçük dursun, büyütebileyim"):
// sayaç Karışık Sınıf oyunlarında (okçuluk) da var. İki taraf KARIŞMAZ: süre / oto / yer-boy ayarları ayrı anahtarlarda
// ('dag_ozd_dinlenme*' özel ders, 'dag_km_dinlenme*' okçuluk). Okçulukta oto varsayılan KAPALI (sınıfta her çocuğun serisinden sonra
// başlaması karışık olur — süre çipine dokununca başlar), özel derste AÇIK.
function ozdDinOn() { return ozdHareketModu() ? 'dag_ozd_dinlenme' : 'dag_km_dinlenme'; }
function ozdDinGoster() { if (ozdHareketModu()) return true; const p = document.getElementById('karisik-platform'), w = document.getElementById('km-oyun-wrap'); return !!(p && p.style.display !== 'none' && w && w.isConnected && w.offsetParent !== null || (w && (document.fullscreenElement === w || document.webkitFullscreenElement === w))); }
function ozdDinSure() { let v = 30; try { v = +localStorage.getItem(ozdDinOn()) || 30; } catch (e) { } return v; }
function ozdDinOto() { try { const v = localStorage.getItem(ozdDinOn() + '_oto'); return v === null ? ozdHareketModu() : v === '1'; } catch (e) { return ozdHareketModu(); } }
// okçuluk seri girişi (kmOyunIlerlet) — oto açıksa dinlenme başlar
function ozdDinSeriSonu() { if (!ozdHareketModu() && ozdDinGoster() && ozdDinOto()) ozdDinBaslat(); }
function ozdDinBip(f, s, gec) { try { const A = ozdDinBip.a || (ozdDinBip.a = new (window.AudioContext || window.webkitAudioContext)()); if (A.state === 'suspended') A.resume(); const t = A.currentTime + (gec || 0), o = A.createOscillator(), g = A.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.25, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + s); o.connect(g).connect(A.destination); o.start(t); o.stop(t + s + .05); } catch (e) { } }
function ozdDinBaslat(sn) {
    clearInterval(_ozdDin.t); _ozdDin.toplam = _ozdDin.kalan = sn || ozdDinSure();
    _ozdDin.t = setInterval(() => {
        _ozdDin.kalan--;
        if (_ozdDin.kalan > 0 && _ozdDin.kalan <= 3) ozdDinBip(660, .15);
        if (_ozdDin.kalan <= 0) { clearInterval(_ozdDin.t); _ozdDin.t = null; ozdDinBip(880, .25); ozdDinBip(1175, .4, .25); }
        ozdDinCiz();
    }, 1000);
    ozdDinCiz();
}
function ozdDinDur() { if (_ozdDin.t) { clearInterval(_ozdDin.t); _ozdDin.t = null; } else if (_ozdDin.kalan > 0) ozdDinBaslat(_ozdDin.kalan); ozdDinCiz(); }
function ozdDinSec(sn) { try { localStorage.setItem(ozdDinOn(), sn); } catch (e) { } ozdDinBaslat(sn); }
function ozdDinOtoDegis() { try { localStorage.setItem(ozdDinOn() + '_oto', ozdDinOto() ? '0' : '1'); } catch (e) { } ozdDinCiz(); }
function ozdDinBuyut() { _ozdDin.buyuk = !_ozdDin.buyuk; ozdDinCiz(); }
// v347 (kullanıcı: "sağ altta güzel ama oynatılabilir, küçültebileyim büyütebileyim"): 4 boy (➖➕) + sürükle-bırak; ikisi de cihazda saklı
const OZD_DIN_BOY = [10, 13, 17, 22];
function ozdDinAyar() { try { return JSON.parse(localStorage.getItem(ozdDinOn() + '_yer') || '{}') || {}; } catch (e) { return {}; } }
function ozdDinAyarYaz(o) { try { localStorage.setItem(ozdDinOn() + '_yer', JSON.stringify(Object.assign(ozdDinAyar(), o))); } catch (e) { } }
function ozdDinBoy(d) { const a = ozdDinAyar(), v = Math.max(0, Math.min(OZD_DIN_BOY.length - 1, (a.boy != null ? a.boy : 1) + d)); ozdDinAyarYaz({ boy: v }); ozdDinCiz(); }
function ozdDinYerUygula(e) {
    const a = ozdDinAyar(), boy = OZD_DIN_BOY[a.boy != null ? a.boy : (innerWidth < 640 ? 0 : 1)];
    e.style.setProperty('--b', boy + 'px');
    if (a.x == null || _ozdDin.buyuk) { e.style.left = e.style.top = ''; e.style.right = e.style.bottom = ''; return; }
    // ekran döndü / küçüldü: kutu görünür alanda kalsın
    const w = e.offsetWidth || 200, h = e.offsetHeight || 150, x = Math.max(4, Math.min(innerWidth - w - 4, a.x)), y = Math.max(4, Math.min(innerHeight - h - 4, a.y));
    e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.right = e.style.bottom = 'auto';
}
function ozdDinSurukle(e) {
    let bas = null;
    e.addEventListener('pointerdown', (ev) => {
        if (_ozdDin.buyuk || !ev.target.closest('.ozd-din-ust') || ev.target.closest('button')) return;
        const r = e.getBoundingClientRect(); bas = { dx: ev.clientX - r.left, dy: ev.clientY - r.top };
        e.setPointerCapture(ev.pointerId); e.classList.add('surukle'); ev.preventDefault();
    });
    e.addEventListener('pointermove', (ev) => {
        if (!bas) return;
        const x = Math.max(4, Math.min(innerWidth - e.offsetWidth - 4, ev.clientX - bas.dx)), y = Math.max(4, Math.min(innerHeight - e.offsetHeight - 4, ev.clientY - bas.dy));
        e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.right = e.style.bottom = 'auto';
    });
    const bit = () => { if (!bas) return; bas = null; e.classList.remove('surukle'); ozdDinAyarYaz({ x: parseFloat(e.style.left) || 0, y: parseFloat(e.style.top) || 0 }); };
    e.addEventListener('pointerup', bit); e.addEventListener('pointercancel', bit);
    // kullanıcı: "bittiğinde illa ✕ değil, boşa tıkladığımda da küçülsün" — tam ekranda düğme dışı her dokunuş küçültür
    // (sayaç sürerken rakama dokunmak yine durdur/devam)
    e.addEventListener('click', (ev) => { if (!_ozdDin.buyuk || ev.target.closest('button') || (_ozdDin.t && ev.target.closest('.ozd-din-say'))) return; ev.stopPropagation(); ozdDinBuyut(); }, true);
}
function ozdDinCiz() {
    try { ozdCss(); } catch (e) { }
    const p = document.getElementById('karisik-platform'); let e = document.getElementById('ozd-dinlen');
    // taraf değişti (özel ders ↔ okçuluk) ya da oyun ekranı kapandı → sayaç sıfırlanır / kalkar
    const taraf = ozdDinOn(); if (_ozdDin.taraf && _ozdDin.taraf !== taraf) { clearInterval(_ozdDin.t); _ozdDin.t = null; _ozdDin.kalan = _ozdDin.toplam = 0; _ozdDin.buyuk = false; } _ozdDin.taraf = taraf;
    if (!p || !ozdDinGoster()) { if (e) e.remove(); clearInterval(_ozdDin.t); _ozdDin.t = null; _ozdDin.kalan = 0; _ozdDin.buyuk = false; return; }
    if (!e) { e = document.createElement('div'); e.id = 'ozd-dinlen'; ozdDinSurukle(e); }
    // v348 (kullanıcı: "tam ekranda dinlenme saniyesi açılmıyor"): oyun tam ekrandayken (#km-oyun-wrap) yalnız o öğe görünür —
    // sayaç tam ekran öğesinin içine taşınır, çıkınca Karışık Sınıf ekranına geri döner
    const fs_ = document.fullscreenElement || document.webkitFullscreenElement, kap = fs_ && p.contains(fs_) ? fs_ : p;
    if (e.parentNode !== kap) kap.appendChild(e);
    const k = _ozdDin.kalan, bitti = !_ozdDin.t && k <= 0 && _ozdDin.toplam > 0, oran = _ozdDin.toplam ? Math.max(0, k) / _ozdDin.toplam : 0;
    const say = k > 0 ? (k >= 60 ? Math.floor(k / 60) + ':' + String(k % 60).padStart(2, '0') : String(k)) : (bitti ? 'HAZIR! 💪' : '—');
    e.className = 'ozd-dinlen' + (_ozdDin.buyuk ? ' buyuk' : '') + (k > 0 && k <= 3 ? ' son' : '') + (bitti ? ' bitti' : '');
    e.innerHTML = `<div class="ozd-din-ust" title="Sürükleyip taşı"><b><span class="ozd-din-tut">⋮⋮</span>⏱️ Dinlenme</b>${_ozdDin.buyuk ? '' : `<button onclick="ozdDinBoy(-1)" title="Küçült">➖</button><button onclick="ozdDinBoy(1)" title="Büyüt">➕</button>`}<button onclick="ozdDinBuyut()" title="${_ozdDin.buyuk ? 'Küçült' : 'Tam ekran (TV)'}">${_ozdDin.buyuk ? '✕' : '⤢'}</button></div>
      <div class="ozd-din-say" onclick="ozdDinDur()" title="Durdur / devam">${say}</div><div class="ozd-din-bar"><i style="width:${oran * 100}%"></i></div>
      <div class="ozd-din-cip">${[15, 20, 30, 45, 60, 90].map((n) => `<button class="${n === ozdDinSure() ? 'aktif' : ''}" onclick="ozdDinSec(${n})">${n}</button>`).join('')}<button onclick="ozdDinOtoDegis()" title="Her puan girişinden sonra kendiliğinden başlasın">${ozdDinOto() ? '🔁 oto' : '✋ elle'}</button></div>`;
    ozdDinYerUygula(e);
}

['fullscreenchange', 'webkitfullscreenchange'].forEach((o) => document.addEventListener(o, () => { try { if (document.getElementById('ozd-dinlen') || ozdDinGoster()) ozdDinCiz(); } catch (e) { } }));

setInterval(() => { try { if (!!document.getElementById('ozd-dinlen') !== ozdDinGoster()) ozdDinCiz(); } catch (e) { } }, 1000);

/* ---------------- sekme ---------------- */
// Eğitmen Paneli kartı (Karışık Sınıf / Yarışmalar'ın yanında) — egitmenYarismaAc ile aynı yol
function egitmenOzelDersAc() { try { grupKurulumu(aktifGrup || 'buyukler'); } catch (e) { } try { sekmeAc('ozelders'); } catch (e) { } }
function ozdSekmeDoldur() {
    ozdCss(); ozdCiz();
    ozdSenkron().then(() => ozdCiz()).catch(() => {});
}
function ozdCiz() {
    const el = document.getElementById('icerik-ozelders'); if (!el) return;
    if (_ozdSecili && !ozdOgr(_ozdSecili)) _ozdSecili = null;
    el.innerHTML = `<div class="ozd">${_ozdSecili ? ozdOgrenciHTML(_ozdSecili) : ozdListeHTML()}</div>`;
}
function ozdListeHTML() {
    const l = ozdOgrenciler();
    const kart = (o) => {
        const k = o.g + '|' + o.ad, ds = ozdDersler(k), son = ds[ds.length - 1], oz = son ? ozdDersOzet(son) : null, yas = typeof kmSporcuYasi === 'function' ? kmSporcuYasi(o.g, o.ad) : null;
        return `<button class="ozd-kart" onclick="ozdAc('${ozdEsc(k).replace(/'/g, "\\'")}')"><span class="ozd-av">${ozdEsc(ozdIlkAd(o.ad).charAt(0))}</span>
          <span class="ozd-kart-ic"><b>${ozdEsc(o.ad)}</b><small>${yas ? yas + ' yaş · ' : ''}${o.saatler ? '🗓️ ' + ozdEsc(o.saatler) : 'ders saati yazılmadı'}</small>
          <small>${son ? `Son ders ${ozdTarihYazi(son.tarih)} · ort. ${ozdSayi(oz.ort)}` : 'Henüz ders yok'} · ${ds.length} ders</small></span><span class="ozd-ok">›</span></button>`;
    };
    return `<div class="ozd-bas"><div><h2>💪 Sporla Gelişiyorum</h2><p>Özel ders — koordinasyon, denge, güç… Hareketleri puanla, oyunlarda ilerlesin, veliye "bugün ne yaptık" gitsin.</p></div>
      <button class="ozd-btn ozd-ana" onclick="ozdOgrenciEkleAc()">＋ Öğrenci ekle</button></div>
      <div id="ozd-ekle"></div>
      ${l.length ? `<div class="ozd-kartlar">${l.map(kart).join('')}</div>` : '<div class="ozd-bos">Henüz özel ders öğrencisi yok.<br>“＋ Öğrenci ekle” ile aktif sporculardan seç (ör. Furkan).</div>'}`;
}
function ozdOgrenciEkleAc() {
    const alan = document.getElementById('ozd-ekle'); if (!alan) return;
    alan.innerHTML = `<div class="ozd-panel"><input id="ozd-ara" class="ozd-input" placeholder="Sporcu ara… (ör. Furkan)" oninput="ozdAraCiz()" autocomplete="off"><div id="ozd-ara-sonuc" class="ozd-ara-sonuc"></div></div>`;
    ozdAraCiz(); const i = document.getElementById('ozd-ara'); if (i) i.focus();
}
function ozdAraCiz() {
    const s = document.getElementById('ozd-ara-sonuc'); if (!s) return;
    const q = ((document.getElementById('ozd-ara') || {}).value || '').trim().toLocaleLowerCase('tr-TR'), var_ = {};
    ozdOgrenciler().forEach((o) => { var_[o.g + '|' + o.ad] = 1; });
    const l = [];
    Object.keys(typeof turnuvaDB !== 'undefined' ? turnuvaDB : {}).forEach((g) => { const grp = turnuvaDB[g]; if (!grp || typeof grp !== 'object') return; Object.keys(grp).forEach((ad) => { const sp = grp[ad]; if (!sp || typeof sp !== 'object' || sp.pasif || var_[g + '|' + ad]) return; if (q && ad.toLocaleLowerCase('tr-TR').indexOf(q) < 0) return; l.push({ g: g, ad: ad }); }); });
    l.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    s.innerHTML = l.slice(0, 30).map((x) => `<button class="ozd-ara-satir" onclick="ozdOgrenciEkle('${ozdEsc(x.g).replace(/'/g, "\\'")}','${ozdEsc(x.ad).replace(/'/g, "\\'")}')">＋ ${ozdEsc(x.ad)} <small>${ozdEsc(x.g)}</small></button>`).join('') || '<div class="ozd-bos-k">Bulunamadı</div>';
}
function ozdOgrenciEkle(g, ad) { const k = g + '|' + ad; ozdYaz('ogr|' + k, Object.assign({}, ozdOgr(k) || {}, { g: g, ad: ad, aktif: true })); _ozdSecili = k; ozdCiz(); if (typeof showToast === 'function') showToast('💪 ' + ozdIlkAd(ad) + ' özel ders öğrencisi oldu', 'success'); }
function ozdAc(k) { _ozdSecili = k; ozdCiz(); window.scrollTo && window.scrollTo(0, 0); }
function ozdGeri() { _ozdSecili = null; ozdCiz(); }
function ozdAlanKaydet(k, alan, v) { const o = Object.assign({}, ozdOgr(k) || {}); o[alan] = String(v || '').slice(0, 200); ozdYaz('ogr|' + k, o); }
function ozdOgrenciCikar(k) {
    const f = () => { const o = Object.assign({}, ozdOgr(k) || {}); o.aktif = false; ozdYaz('ogr|' + k, o); _ozdSecili = null; ozdCiz(); };
    if (typeof onayIste === 'function') onayIste('Özel ders listesinden çıkarılsın mı?<br><small>Geçmiş dersler silinmez.</small>', f, 'Çıkar', 'Vazgeç'); else if (confirm('Özel ders listesinden çıkarılsın mı?')) f();
}

function ozdOgrenciHTML(k) {
    const o = ozdOgr(k), sp = ozdSp(k), d = ozdBugunDers(k), oz = ozdDersOzet(d), s = ozdSeciliHareket(k), ke = ozdEsc(k).replace(/'/g, "\\'");
    const yas = typeof kmSporcuYasi === 'function' ? kmSporcuYasi(o.g, o.ad) : null, oyunda = ozdHareketModu() && ozdKonumKisi() === k;
    const satir = (id) => {
        const h = ozdHareket(id), kt = OZD_KAT[h.kat] || OZD_KAT.koord, p = [].concat(...(d.kayitlar || []).filter((r) => r.h === id).map((r) => r.p));
        const kg = h.kg ? `<select class="ozd-kg" title="Dumbbell ağırlığı" onclick="event.stopPropagation()" onchange="ozdKgSec('${ke}','${id}',this.value)"><option value="">🏋️ kg?</option>${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}"${ozdKg(d, id) === n ? ' selected' : ''}>🏋️ ${n} kg</option>`).join('')}</select>` : '';
        return `<div class="ozd-hs${id === s ? ' aktif' : ''}" style="--r:${kt.renk}" onclick="ozdHareketSec('${ke}','${id}')"><span class="ozd-hs-ad">${kt.ikon} ${ozdEsc(h.ad)}<small>${kt.ad} · ${(OZD_GRUP[h.grup] || '').replace(/^\S+\s/, '')}</small></span>${kg}
          <span class="ozd-hs-p">${p.map((v) => `<i class="${ozdDeger(v) >= 9 ? 'iyi' : ozdDeger(v) <= 4 ? 'zor' : ''}">${v}</i>`).join('') || '<em>puan yok</em>'}</span><b>${oz.h[id] != null ? ozdSayi(oz.h[id]) : ''}</b></div>`;
    };
    return `<div class="ozd-ust"><button class="ozd-btn" onclick="ozdGeri()">‹ Öğrenciler</button><button class="ozd-btn ozd-sil" onclick="ozdOgrenciCikar('${ke}')">Listeden çıkar</button></div>
      <div class="ozd-kimlik"><span class="ozd-av ozd-av-b">${ozdEsc(ozdIlkAd(o.ad).charAt(0))}</span><div><h2>${ozdEsc(o.ad)}</h2><small>💪 Sporla Gelişiyorum${yas ? ' · ' + yas + ' yaş' : ''}${sp && sp.acilTelefon ? ' · 📱 veli telefonu var' : ' · ⚠️ veli telefonu yok'}</small></div></div>
      <div class="ozd-iki">
        <label>🗓️ Ders saatleri<input class="ozd-input" value="${ozdEsc(o.saatler || '')}" placeholder="ör. Salı 17:00 · Perşembe 17:00" onchange="ozdAlanKaydet('${ke}','saatler',this.value)"></label>
        <label>🎯 Hedef<input class="ozd-input" value="${ozdEsc(o.hedef || '')}" placeholder="ör. koordinasyon ve denge" onchange="ozdAlanKaydet('${ke}','hedef',this.value)"></label>
      </div>
      <section class="ozd-panel"><div class="ozd-p-bas"><h3>📋 Bugünün dersi <small>${ozdTarihYazi(d.tarih)}</small></h3>
        <button class="ozd-btn ozd-oyun" onclick="ozdOyunaGec('${ke}')">🎮 ${oyunda ? 'Oyunlara dön' : 'Oyunlarla devam (TV)'}</button></div>
        <p class="ozd-not">Bir harekete dokun → aşağıdan puan ver ya da oyunlarda puanla (oyunda her seri = 3 tekrar, oyun ilerler).</p>
        <div class="ozd-hl">${d.hareketler.map(satir).join('') || '<div class="ozd-bos-k">Hareket seçilmedi — aşağıdan ekle</div>'}</div>
        ${s ? `<div class="ozd-pad"><span>${ozdEsc(ozdHareket(s).ad)}:</span>${OZD_PUAN.map((v) => `<button onclick="ozdHizliPuan('${ke}','${v}')" title="${OZD_PUAN_AD[v]}" class="${v === 'X' ? 'x' : v === 'M' ? 'm' : ''}">${v}</button>`).join('')}<button class="geri" onclick="ozdSonPuanSil('${ke}')" title="Son puanı sil">↶</button></div>` : ''}
        <details class="ozd-kutup"><summary>＋ Hareket ekle / çıkar</summary>${ozdKutuphaneHTML(k, d)}</details>
      </section>
      <section class="ozd-panel"><h3>📝 Ders notu</h3><textarea class="ozd-input ozd-ta" placeholder="Bugün neye dikkat ettik, nasıl hissetti…" onchange="ozdNotKaydet('${ke}',this.value)">${ozdEsc(d.not || '')}</textarea>
        <button class="ozd-btn ozd-ana ozd-gonder" onclick="ozdVeliOnizle('${ke}')">📩 Veliye “Bugün ne yaptık?” gönder${d.gonderildi ? ' <small>✓ gönderildi</small>' : ''}</button></section>
      ${ozdTestHTML(k)}
      ${ozdGelisimHTML(k)}`;
}

/* ---------------- 📏 fiziksel test (sınav) ---------------- */
function ozdTestKayitlari(k) { const d = ozdDepo(), on = 'test|' + k + '|'; return Object.keys(d).filter((x) => x.indexOf(on) === 0 && d[x] && d[x].olcum).map((x) => d[x]).sort((a, b) => a.tarih < b.tarih ? -1 : 1); }
function ozdTestGecmis(k, id) { return ozdTestKayitlari(k).filter((r) => typeof r.olcum[id] === 'number').map((r) => ({ tarih: r.tarih, v: r.olcum[id] })); }
function ozdTestYazi(t, v) { return v == null ? '—' : v.toLocaleString('tr-TR', { maximumFractionDigits: t.ondalik || 0 }) + ' ' + t.birim; }
// son ölçüm önceki ölçüme göre: { fark, iyi } (süre testlerinde azalma iyidir)
function ozdTestFark(t, g) { if (g.length < 2) return null; const f = g[g.length - 1].v - g[g.length - 2].v; return { fark: f, iyi: t.az ? f < 0 : f > 0, ayni: Math.abs(f) < 1e-9 }; }
function ozdTestHTML(k) {
    const ke = ozdEsc(k).replace(/'/g, "\\'"), bugun = (ozdDepo()['test|' + k + '|' + ozdBugun()] || {}).olcum || {}, kayit = ozdTestKayitlari(k), son = kayit[kayit.length - 1];
    const satir = (t) => {
        const g = ozdTestGecmis(k, t.id), f = ozdTestFark(t, g), ilk = g[0];
        return `<div class="ozd-t"><span class="ozd-t-ad">${ozdEsc(t.ad)}<small>${t.az ? 'düşük daha iyi' : 'yüksek daha iyi'}${ilk && g.length > 1 ? ' · ilk ' + ozdTestYazi(t, ilk.v) : ''}</small></span>
          <input class="ozd-input ozd-t-in" data-test="${t.id}" inputmode="decimal" placeholder="${t.birim}" value="${bugun[t.id] != null ? String(bugun[t.id]).replace('.', ',') : ''}">
          <span class="ozd-t-son">${g.length ? ozdTestYazi(t, g[g.length - 1].v) : '—'}</span>
          <span class="ozd-g-fark ${f && !f.ayni ? (f.iyi ? 'art' : 'az') : ''}">${f ? (f.ayni ? '=' : (f.iyi ? '▲ ' : '▼ ') + Math.abs(f.fark).toLocaleString('tr-TR', { maximumFractionDigits: t.ondalik || 0 })) : ''}</span></div>`;
    };
    return `<details class="ozd-panel ozd-test"${Object.keys(bugun).length ? ' open' : ''}><summary><h3>📏 Fiziksel test (sınav) <small>${son ? 'son test ' + ozdTarihYazi(son.tarih) + ' · ' + kayit.length + ' test günü' : 'henüz test yok'} — dönem dönem ölç, gelişimi gör</small></h3></summary>
      <div class="ozd-t ozd-t-bas"><span>Test</span><span>Bugün</span><span>Son</span><span>Değişim</span></div>${OZD_TESTLER.map(satir).join('')}
      <button class="ozd-btn ozd-ana ozd-gonder" onclick="ozdTestKaydet('${ke}')">💾 Bugünkü ölçümleri kaydet</button></details>`;
}
function ozdTestKaydet(k) {
    const [g, ad] = ozdAyir(k), olcum = {};
    document.querySelectorAll('.ozd-t-in').forEach((i) => { const v = parseFloat(String(i.value).replace(',', '.')); if (isFinite(v) && v >= 0) olcum[i.dataset.test] = v; });
    ozdYaz('test|' + k + '|' + ozdBugun(), { g: g, ad: ad, tarih: ozdBugun(), olcum: olcum });
    ozdCiz(); if (typeof showToast === 'function') showToast('📏 ' + Object.keys(olcum).length + ' ölçüm kaydedildi', 'success');
}
// Dumbbell: her harekette derslerdeki en yüksek ağırlık — ilk → son
function ozdKgGelisim(k) {
    const m = {}; ozdDersler(k).forEach((d) => (d.kayitlar || []).forEach((r) => { if (!r.kg) return; const x = m[r.h] = m[r.h] || {}; x[d.tarih] = Math.max(x[d.tarih] || 0, r.kg); }));
    return Object.keys(m).map((id) => { const t = Object.keys(m[id]).sort(); return { id: id, ilk: m[id][t[0]], son: m[id][t[t.length - 1]], n: t.length }; });
}
// Kütüphane ekipmana göre gruplu; çipin rengi gelişim kategorisi
function ozdKutuphaneHTML(k, d) {
    const ke = ozdEsc(k).replace(/'/g, "\\'"), l = ozdHareketler();
    return `<div class="ozd-lejant">${Object.keys(OZD_KAT).map((x) => `<span style="--r:${OZD_KAT[x].renk}">${OZD_KAT[x].ikon} ${OZD_KAT[x].ad}</span>`).join('')}</div>`
        + Object.keys(OZD_GRUP).map((gr) => `<div class="ozd-kat"><b>${OZD_GRUP[gr]}</b><div>${l.filter((h) => (h.grup || 'vucut') === gr).map((h) => { const kt = OZD_KAT[h.kat] || OZD_KAT.koord; return `<button class="ozd-cip${d.hareketler.indexOf(h.id) >= 0 ? ' aktif' : ''}" style="--r:${kt.renk}" title="${kt.ad}" onclick="ozdHareketToggle('${ke}','${ozdEsc(h.id)}')">${kt.ikon} ${ozdEsc(h.ad)}</button>`; }).join('')}</div></div>`).join('')
        + `<div class="ozd-yeni"><input id="ozd-yeni-ad" class="ozd-input" placeholder="Yeni hareket adı"><select id="ozd-yeni-grup" class="ozd-input">${Object.keys(OZD_GRUP).map((x) => `<option value="${x}">${OZD_GRUP[x]}</option>`).join('')}</select><select id="ozd-yeni-kat" class="ozd-input">${Object.keys(OZD_KAT).map((x) => `<option value="${x}">${OZD_KAT[x].ikon} ${OZD_KAT[x].ad}</option>`).join('')}</select><button class="ozd-btn" onclick="ozdYeniHareket('${ke}')">Ekle</button></div>`;
}
function ozdKgSec(k, id, v) { ozdDersYaz(k, (d) => { d.kg = d.kg || {}; if (+v > 0) d.kg[id] = +v; else delete d.kg[id]; }); }
function ozdDersYaz(k, fn) { const d = JSON.parse(JSON.stringify(ozdBugunDers(k))); fn(d); ozdYaz('ders|' + k + '|' + d.tarih, d); ozdCiz(); ozdDokGuncelle(); }
function ozdHareketToggle(k, id) { ozdDersYaz(k, (d) => { const i = d.hareketler.indexOf(id); if (i >= 0) d.hareketler.splice(i, 1); else d.hareketler.push(id); }); const det = document.querySelector('.ozd-kutup'); if (det) det.open = true; }
function ozdYeniHareket(k) {
    const ad = ((document.getElementById('ozd-yeni-ad') || {}).value || '').trim(), kat = (document.getElementById('ozd-yeni-kat') || {}).value || 'koord', grup = (document.getElementById('ozd-yeni-grup') || {}).value || 'vucut';
    if (!ad) return; const id = 'e' + Date.now().toString(36);
    ozdYaz('hrk|' + id, { id: id, ad: ad.slice(0, 40), kat: kat, grup: grup, kg: grup === 'dumbbell' }); ozdHareketToggle(k, id);
}
function ozdHizliPuan(k, v) { ozdSeriKaydet(...ozdAyir(k), [{ puan: v }]); ozdCiz(); }
function ozdSonPuanSil(k) {
    const s = ozdSeciliHareket(k);
    ozdDersYaz(k, (d) => { for (let i = d.kayitlar.length - 1; i >= 0; i--) { const r = d.kayitlar[i]; if (r.h !== s) continue; r.p.pop(); if (!r.p.length) d.kayitlar.splice(i, 1); break; } });
}
function ozdNotKaydet(k, v) { const d = JSON.parse(JSON.stringify(ozdBugunDers(k))); d.not = String(v || '').slice(0, 1000); ozdYaz('ders|' + k + '|' + d.tarih, d); }

/* ---------------- gelişim ---------------- */
function ozdGelisimVeri(k) {
    const ds = ozdDersler(k).filter((d) => (d.kayitlar || []).length), oz = ds.map((d) => ({ tarih: d.tarih, o: ozdDersOzet(d) }));
    const kat = {}; Object.keys(OZD_KAT).forEach((x) => { kat[x] = oz.filter((z) => z.o.kat[x] != null).map((z) => ({ tarih: z.tarih, v: z.o.kat[x] })); });
    return { ds: ds, oz: oz, kat: kat };
}
function ozdCizgi(seri, renk) {
    if (seri.length < 2) return '';
    const W = 120, H = 34, son = seri.slice(-10), xs = (i) => 4 + i * (W - 8) / (son.length - 1), ys = (v) => H - 4 - (v / 10) * (H - 8);
    return `<svg viewBox="0 0 ${W} ${H}" class="ozd-cizgi"><polyline points="${son.map((p, i) => xs(i) + ',' + ys(p.v)).join(' ')}" fill="none" stroke="${renk}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${xs(son.length - 1)}" cy="${ys(son[son.length - 1].v)}" r="3.5" fill="${renk}"/></svg>`;
}
function ozdGelisimHTML(k) {
    const G = ozdGelisimVeri(k);
    if (!G.ds.length) return '<section class="ozd-panel"><h3>📈 Gelişim</h3><div class="ozd-bos-k">İlk puanlanan dersten sonra burada kategori kategori gelişim görünür.</div></section>';
    const satir = Object.keys(OZD_KAT).filter((x) => G.kat[x].length).map((x) => {
        const s = G.kat[x], son = s[s.length - 1].v, onc = s.length > 1 ? s[s.length - 2].v : null, ilk = s[0].v, kt = OZD_KAT[x];
        const fark = onc != null ? son - onc : null;
        return `<div class="ozd-g"><span class="ozd-g-ad">${kt.ikon} ${kt.ad}</span><span class="ozd-g-bar"><i style="width:${son * 10}%;background:${kt.renk}"></i></span><b>${ozdSayi(son)}</b>
          <span class="ozd-g-fark ${fark > 0.05 ? 'art' : fark < -0.05 ? 'az' : ''}">${fark == null ? 'ilk' : (fark > 0 ? '▲ ' : fark < 0 ? '▼ ' : '') + ozdSayi(Math.abs(fark))}</span>${ozdCizgi(s, kt.renk)}
          <small>${s.length} ders · ilk ${ozdSayi(ilk)}</small></div>`;
    }).join('');
    const gecmis = G.ds.slice().reverse().slice(0, 8).map((d) => { const o = ozdDersOzet(d); return `<div class="ozd-gm"><span>${ozdTarihYazi(d.tarih)}</span><span>${Object.keys(o.h).length} hareket · ${o.tekrar} tekrar</span><b>${ozdSayi(o.ort)}</b>${d.gonderildi ? '<span title="Veliye gönderildi">📩</span>' : '<span></span>'}</div>`; }).join('');
    const kg = ozdKgGelisim(k).map((x) => `<div class="ozd-gm"><span>🏋️ ${ozdEsc(ozdHareket(x.id).ad)}</span><span>${x.n} ders</span><b>${x.ilk === x.son ? x.son + ' kg' : x.ilk + ' → ' + x.son + ' kg'}</b><span>${x.son > x.ilk ? '📈' : ''}</span></div>`).join('');
    return `<section class="ozd-panel"><h3>📈 Gelişim <small>kategori ortalaması (10 üzerinden) · son derse göre</small></h3>${satir}${kg ? '<h3 style="margin-top:12px">🏋️ Dumbbell ağırlıkları</h3>' + kg : ''}</section>
      <section class="ozd-panel"><h3>🗂️ Geçmiş dersler</h3>${gecmis}</section>`;
}

/* ---------------- veli mesajı ---------------- */
function ozdVeliMetni(k) {
    const d = ozdBugunDers(k), oz = ozdDersOzet(d), [, ad] = ozdAyir(k), o = ozdOgr(k) || {};
    const onceki = ozdDersler(k).filter((x) => x.tarih < d.tarih && (x.kayitlar || []).length).pop(), oo = onceki ? ozdDersOzet(onceki) : null;
    const s = ['🏹 *DAĞ SPOR KULÜBÜ* — 💪 Sporla Gelişiyorum', `📋 _${ozdIn(ozdIlkAd(ad))} bugünkü özel dersi_ — ${ozdTarihYazi(d.tarih)}`, ''];
    const katlar = Object.keys(OZD_KAT).filter((x) => oz.kat[x] != null);
    if (!katlar.length) s.push('Bugün hareketlerimizi çalıştık. 💪');
    else {
        s.push('*Bugün çalıştıklarımız:*');
        katlar.forEach((x) => {
            const kt = OZD_KAT[x], h = Object.keys(oz.h).filter((id) => ozdHareket(id).kat === x).map((id) => ozdHareket(id).ad + (ozdKg(d, id) ? ' (' + ozdKg(d, id) + ' kg)' : '')).join(', ');
            const f = oo && oo.kat[x] != null ? oz.kat[x] - oo.kat[x] : null;
            s.push(`${kt.ikon} ${kt.ad}: ${h} — ${ozdYildiz(oz.kat[x])}${f != null && Math.abs(f) >= 0.3 ? (f > 0 ? ' 📈 geçen derse göre gelişti' : ' (bugün biraz zorlandı)') : ''}`);
        });
        const sira = Object.keys(oz.h).sort((a, b) => oz.h[b] - oz.h[a]), en = sira[0], zayif = sira.filter((id) => oz.h[id] < 7).slice(-2).reverse();
        s.push('', `🌟 *Bugün en iyi:* ${ozdHareket(en).ad}`);
        const gel = zayif.length ? zayif : (sira.length > 1 ? [sira[sira.length - 1]] : []);
        if (gel.length) {
            s.push(`🎯 *Gelişeceğimiz alanlar:* ${gel.map((id) => ozdHareket(id).ad).join(', ')}`);
            const evKat = [...new Set(gel.map((id) => ozdHareket(id).kat))].slice(0, 2);
            evKat.forEach((x) => s.push('🏠 ' + OZD_KAT[x].ev));
        }
    }
    // 📏 bugün test yapıldıysa: ölçüm + öncekine göre
    const tb = (ozdDepo()['test|' + k + '|' + d.tarih] || {}).olcum || {}, tl = OZD_TESTLER.filter((t) => typeof tb[t.id] === 'number');
    if (tl.length) {
        s.push('', '📏 *Bugünkü fiziksel test:*');
        tl.forEach((t) => { const g = ozdTestGecmis(k, t.id).filter((x) => x.tarih <= d.tarih), f = ozdTestFark(t, g); s.push(`• ${t.ad}: ${ozdTestYazi(t, tb[t.id])}${f && !f.ayni ? (f.iyi ? ' 📈 önceki teste göre gelişti' : ' (önceki test ' + ozdTestYazi(t, g[g.length - 2].v) + ')') : ''}`); });
    }
    if (o.hedef) s.push('', '🧭 Hedefimiz: ' + o.hedef);
    if (d.not) s.push('', '💬 Antrenör notu: ' + d.not);
    s.push('', 'Görüşmek üzere! 🙌');
    return s.join('\n');
}
function ozdVeliOnizle(k) {
    const sp = ozdSp(k), ke = ozdEsc(k).replace(/'/g, "\\'");
    let m = document.getElementById('ozd-modal'); if (m) m.remove();
    document.body.insertAdjacentHTML('beforeend', `<div id="ozd-modal" class="ozd-modal" onclick="if(event.target===this)this.remove()"><div class="ozd-modal-k">
      <h3>📩 Veliye “Bugün ne yaptık?”</h3><p class="ozd-not">${sp && sp.acilTelefon ? 'WhatsApp veli numarasına açılır. Metni düzenleyebilirsin.' : '⚠️ Veli telefonu kayıtlı değil — WhatsApp kişi seçerek açılır. Metni düzenleyebilirsin.'}</p>
      <textarea id="ozd-mesaj" class="ozd-input ozd-mesaj">${ozdEsc(ozdVeliMetni(k))}</textarea>
      <div class="ozd-modal-alt"><button class="ozd-btn" onclick="document.getElementById('ozd-modal').remove()">Kapat</button><button class="ozd-btn" onclick="ozdKopyala()">📋 Kopyala</button><button class="ozd-btn ozd-wa" onclick="ozdWaGonder('${ke}')">💬 WhatsApp'ta gönder</button></div></div></div>`);
}
function ozdKopyala() { const t = document.getElementById('ozd-mesaj'); if (!t) return; try { navigator.clipboard.writeText(t.value); } catch (e) { t.select(); document.execCommand('copy'); } if (typeof showToast === 'function') showToast('📋 Kopyalandı', 'success'); }
function ozdWaGonder(k) {
    const t = document.getElementById('ozd-mesaj'), sp = ozdSp(k); if (!t) return;
    let n = ''; try { n = sp && sp.acilTelefon && typeof telefonWaFormat === 'function' ? telefonWaFormat(sp.acilTelefon) : ''; } catch (e) { }
    window.open((n ? 'https://api.whatsapp.com/send?phone=' + n + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(t.value), '_blank');
    const d = JSON.parse(JSON.stringify(ozdBugunDers(k))); d.gonderildi = Date.now(); ozdYaz('ders|' + k + '|' + d.tarih, d);
    const m = document.getElementById('ozd-modal'); if (m) m.remove(); ozdCiz();
}

/* ---------------- stil ---------------- */
function ozdCss() {
    if (document.getElementById('ozd-css')) return;
    const st = document.createElement('style'); st.id = 'ozd-css';
    st.textContent = `
.ozd{max-width:880px;margin:0 auto;padding:12px 16px 90px;color:var(--text-primary)}
.ozd h2{margin:0;font-size:22px}.ozd h3{margin:0 0 8px;font-size:16px}.ozd h3 small,.ozd-p-bas small{font-weight:600;color:var(--text-muted);font-size:11.5px;margin-left:6px}
.ozd-bas{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;margin-bottom:12px}.ozd-bas p{margin:4px 0 0;color:var(--text-muted);font-size:13px;max-width:560px}
.ozd-btn{border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-primary);border-radius:10px;padding:9px 13px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}
.ozd-btn:hover{border-color:var(--accent-orange)}.ozd-ana{background:var(--accent-orange);border-color:var(--accent-orange);color:#fff}.ozd-oyun{background:linear-gradient(135deg,#7c5cff,#ff6a1a);border:0;color:#fff}
.ozd-sil{color:var(--text-muted);font-weight:700}.ozd-wa{background:#25d366;border-color:#25d366;color:#08311a}
.ozd-kartlar{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}
.ozd-kart{display:flex;gap:12px;align-items:center;text-align:left;background:var(--bg-panel);border:1px solid var(--border-color);border-radius:14px;padding:12px;cursor:pointer;color:inherit;font-family:inherit}
.ozd-kart:hover{border-color:var(--accent-orange)}.ozd-kart-ic{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.ozd-kart-ic small{color:var(--text-muted);font-size:11.5px}.ozd-ok{font-size:22px;color:var(--text-muted)}
.ozd-av{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#ff6a1a,#ffd23f);color:#2a1400;font-weight:900;font-size:20px;flex-shrink:0}.ozd-av-b{width:56px;height:56px;font-size:26px}
.ozd-bos{text-align:center;color:var(--text-muted);padding:40px 16px;border:1.5px dashed var(--border-color);border-radius:14px;line-height:1.6}.ozd-bos-k{color:var(--text-muted);font-size:12.5px;padding:8px 0}
.ozd-panel{background:var(--bg-panel);border:1px solid var(--border-color);border-radius:14px;padding:14px;margin:10px 0}
.ozd-input{width:100%;box-sizing:border-box;background:var(--bg-dark,rgba(0,0,0,.25));border:1px solid var(--border-color);color:var(--text-primary);border-radius:10px;padding:9px 11px;font-size:14px;font-family:inherit}
.ozd-ara-sonuc{display:flex;flex-direction:column;gap:4px;margin-top:8px;max-height:280px;overflow:auto}
.ozd-ara-satir{text-align:left;background:transparent;border:1px solid var(--border-color);border-radius:9px;padding:9px 11px;color:var(--text-primary);font-weight:700;cursor:pointer;font-family:inherit}.ozd-ara-satir small{color:var(--text-muted);font-weight:600;margin-left:6px}
.ozd-ust{display:flex;justify-content:space-between;gap:8px;margin-bottom:10px}
.ozd-kimlik{display:flex;gap:12px;align-items:center;margin-bottom:10px}.ozd-kimlik small{color:var(--text-muted)}
.ozd-iki{display:grid;grid-template-columns:1fr 1fr;gap:10px}.ozd-iki label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:800;color:var(--text-muted)}
.ozd-p-bas{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}.ozd-p-bas h3{margin:0}
.ozd-not{color:var(--text-muted);font-size:12px;margin:6px 0 10px}
.ozd-hl{display:flex;flex-direction:column;gap:6px}
.ozd-hs{display:flex;align-items:center;gap:10px;padding:9px 11px;border-radius:11px;border:1px solid var(--border-color);border-left:4px solid var(--r);cursor:pointer}
.ozd-hs.aktif{background:color-mix(in srgb,var(--r) 14%,transparent);box-shadow:0 0 0 1.5px var(--r)}
.ozd-hs-ad{flex:1;min-width:0;font-weight:800;font-size:14px}.ozd-hs-ad small{display:block;font-weight:600;color:var(--text-muted);font-size:11px}
.ozd-hs-p{display:flex;gap:3px;flex-wrap:wrap;justify-content:flex-end;max-width:50%}.ozd-hs-p i{font-style:normal;font-weight:900;font-size:12px;min-width:22px;text-align:center;padding:2px 5px;border-radius:6px;background:rgba(255,255,255,.08)}
.ozd-hs-p i.iyi{background:#ffd23f;color:#2a1d00}.ozd-hs-p i.zor{background:rgba(255,107,107,.25)}.ozd-hs-p em{color:var(--text-muted);font-size:11.5px}
.ozd-hs>b{min-width:34px;text-align:right;font-size:16px}
.ozd-pad{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;padding:10px;border-radius:12px;background:rgba(0,0,0,.18)}.ozd-pad span{font-weight:800;font-size:12.5px;width:100%;color:var(--text-muted)}
.ozd-pad button{min-width:44px;height:44px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-primary);font-weight:900;font-size:16px;cursor:pointer}
.ozd-pad button.x{background:#ffd23f;color:#2a1d00;border:0}.ozd-pad button.m{color:#ff8f8f}.ozd-pad button.geri{margin-left:auto}
.ozd-kutup{margin-top:10px}.ozd-kutup summary{cursor:pointer;font-weight:800;font-size:13px;color:var(--accent-orange)}
.ozd-kat{margin-top:8px}.ozd-kat>b{font-size:12.5px}.ozd-kat>div{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}
.ozd-cip{border:1px solid var(--border-color);border-radius:999px;padding:6px 11px;background:transparent;color:var(--text-primary);font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit}
.ozd-cip.aktif{background:var(--r);border-color:var(--r);color:#1b1230}.ozd-cip b{margin-left:3px}
.ozd-yeni{display:grid;grid-template-columns:1fr 150px auto;gap:6px;margin-top:10px}
.ozd-ta{min-height:70px;resize:vertical}.ozd-gonder{margin-top:10px;width:100%}.ozd-gonder small{opacity:.85;font-weight:700}
.ozd-g{display:grid;grid-template-columns:130px 1fr 40px 56px 120px;align-items:center;gap:8px;padding:6px 0;border-top:1px solid var(--border-color)}
.ozd-g small{grid-column:1/-1;color:var(--text-muted);font-size:11px;margin-top:-4px}.ozd-g-ad{font-weight:800;font-size:13px}
.ozd-g-bar{height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}.ozd-g-bar i{display:block;height:100%;border-radius:999px}
.ozd-g-fark{font-size:12px;font-weight:800;color:var(--text-muted)}.ozd-g-fark.art{color:#7cf29a}.ozd-g-fark.az{color:#ff8f8f}.ozd-cizgi{width:120px;height:34px}
.ozd-gm{display:grid;grid-template-columns:1fr auto 40px 20px;gap:10px;padding:7px 0;border-top:1px solid var(--border-color);font-size:13px}.ozd-gm span:nth-child(2){color:var(--text-muted)}
.ozd-modal{position:fixed;inset:0;z-index:10050;background:rgba(0,0,0,.6);display:grid;place-items:center;padding:16px}
.ozd-modal-k{background:var(--bg-main,#1b1530);box-shadow:0 20px 60px rgba(0,0,0,.6);color:var(--text-primary);border:1px solid var(--border-color);border-radius:16px;padding:16px;width:min(560px,100%);max-height:90vh;overflow:auto}
.ozd-mesaj{min-height:300px;font-size:13px;line-height:1.45}.ozd-modal-alt{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:10px}
#karisik-platform.ozd-modu .km-sk-kusak{display:none}
/* ⏱️ dinlenme: boy (--b) ile her şey em cinsinden ölçeklenir; konum sürüklenir (sol/üst piksel, cihazda saklı) */
.ozd-dinlen{position:fixed;right:14px;bottom:14px;z-index:20050;font-size:var(--b,13px);width:15.4em;background:rgba(20,14,36,.94);color:#fff;border-radius:1.4em;padding:.8em .9em;box-shadow:0 10px 30px rgba(0,0,0,.5),0 0 0 2px #7c5cff;font-family:inherit;transition:background .3s;touch-action:none;user-select:none}
.ozd-din-ust{display:flex;align-items:center;gap:.3em;cursor:grab}.ozd-din-ust b{flex:1;min-width:0;font-size:1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ozd-din-ust button{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:.6em;width:2.3em;height:2.3em;font-size:1em;cursor:pointer;flex-shrink:0}
.ozd-dinlen.surukle .ozd-din-ust{cursor:grabbing}.ozd-din-tut{opacity:.5;letter-spacing:-.15em;margin-right:.2em}
.ozd-din-say{font-size:4.2em;font-weight:900;text-align:center;line-height:1.1;cursor:pointer;font-variant-numeric:tabular-nums;margin:.05em 0}
.ozd-din-bar{height:.6em;border-radius:999px;background:rgba(255,255,255,.12);overflow:hidden}.ozd-din-bar i{display:block;height:100%;background:linear-gradient(90deg,#7c5cff,#ff6a1a);transition:width 1s linear}
.ozd-din-cip{display:flex;flex-wrap:wrap;gap:.3em;margin-top:.6em}.ozd-din-cip button{flex:1;min-width:2.4em;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;border-radius:.6em;padding:.4em .1em;font-weight:800;font-size:.92em;cursor:pointer}.ozd-din-cip button.aktif{background:#7c5cff;border-color:#7c5cff}
.ozd-dinlen.son{background:rgba(160,40,20,.95)}.ozd-dinlen.son .ozd-din-say{animation:ozdNabiz .5s ease-in-out infinite alternate}@keyframes ozdNabiz{to{transform:scale(1.12)}}
.ozd-dinlen.bitti{background:rgba(20,120,60,.95)}.ozd-dinlen.bitti .ozd-din-say{font-size:2.6em}
.ozd-dinlen.buyuk{inset:0!important;width:auto;border-radius:0;display:flex;flex-direction:column;justify-content:center;padding:4vh 6vw;z-index:20100;font-size:clamp(18px,2.6vw,34px)}
.ozd-dinlen.buyuk .ozd-din-ust{cursor:default}.ozd-dinlen.buyuk .ozd-din-say{font-size:min(38vw,60vh)}.ozd-dinlen.buyuk.bitti .ozd-din-say{font-size:min(16vw,30vh)}.ozd-dinlen.buyuk .ozd-din-bar{height:1em}
.ozd-dinlen.buyuk .ozd-din-cip{max-width:760px;margin:1em auto 0;width:100%}
.ozd-km-banner{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 14px;background:linear-gradient(90deg,#7c5cff,#ff6a1a);color:#fff;font-size:13px;flex-shrink:0}
.ozd-km-banner span{opacity:.9;font-size:12px;flex:1;min-width:160px}.ozd-km-banner button{border:0;border-radius:999px;background:rgba(0,0,0,.28);color:#fff;font-weight:800;padding:6px 12px;cursor:pointer}
.ozd-dok{margin-bottom:8px}.ozd-dok-bas{font-size:12px;font-weight:900;margin-bottom:5px}.ozd-dok-bas small{font-weight:600;opacity:.7;margin-left:4px}
.ozd-dok-cipler{display:flex;gap:5px;overflow-x:auto;padding-bottom:3px}.ozd-dok .ozd-cip{white-space:nowrap;font-size:12px;padding:6px 10px;color:inherit}.ozd-dok .ozd-cip.aktif{color:#1b1230}
.ozd-kg{background:var(--bg-panel);color:var(--text-primary);border:1px solid var(--border-color);border-radius:8px;padding:5px 6px;font-weight:800;font-size:12.5px;font-family:inherit}
.ozd-lejant{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 2px;font-size:11px;color:var(--text-muted)}.ozd-lejant span{border-left:3px solid var(--r);padding-left:5px}
.ozd-test>summary{cursor:pointer;list-style:none}.ozd-test>summary::-webkit-details-marker{display:none}.ozd-test>summary h3{margin:0}.ozd-test[open]>summary h3{margin-bottom:8px}
.ozd-t{display:grid;grid-template-columns:1fr 92px 86px 64px;gap:8px;align-items:center;padding:6px 0;border-top:1px solid var(--border-color)}
.ozd-t-bas{font-size:11px;font-weight:800;color:var(--text-muted);border-top:0}.ozd-t-ad{font-weight:800;font-size:13px}.ozd-t-ad small{display:block;font-weight:600;color:var(--text-muted);font-size:10.5px}
.ozd-t-in{padding:7px 8px;text-align:center}.ozd-t-son{font-size:12.5px;font-weight:700}
.ozd-yeni{grid-template-columns:1fr 170px 150px auto}
@media (max-width:640px){.ozd-iki{grid-template-columns:1fr}.ozd-t{grid-template-columns:1fr 78px 64px}.ozd-t>.ozd-g-fark{grid-column:3}.ozd-t-bas span:last-child{display:none}.ozd-t{row-gap:2px}.ozd-g{grid-template-columns:110px 1fr 36px 50px}.ozd-cizgi{display:none}.ozd-yeni{grid-template-columns:1fr}.ozd-hs{flex-wrap:wrap}.ozd-hs-p{max-width:100%}}`;
    document.head.appendChild(st);
}
