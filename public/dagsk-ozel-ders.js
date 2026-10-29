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
   • 🎮 Oyunlar: Karışık Sınıf'ın kendi konumu açılır — 'ozel_<kısa kimlik>' (konum listesine "🤸 Özel Ders · Ad" olarak
     eklenir, TV/ikinci cihaz oradan katılır). Bu konumda HAREKET MODU (ozdHareketModu): kmOyunIlerlet seriyi okçuluk
     kaydına (_skorKaydetCekirdek) YAZMAZ, ozdSeriKaydet ile özel ders defterine yazar; klasman/yoklama/kuşak atlanır.
     Dock'ta hangi hareketin puanlandığı seçilir (ozdDokHTML). Puan = hareket değerlendirmesi: X mükemmel … M yapamadı.
   • Veri: meta 'ozel_ders' (kyDepo, kayıt başına LWW 't'):
       'ogr|g|ad'          { g, ad, aktif, saatler, hedef, t }
       'ders|g|ad|tarih'   { g, ad, tarih, hareketler:[id], kayitlar:[{id, h, p:[puan], t}], not, gonderildi, t }
       'hrk|id'            { id, ad, kat, t }  — eğitmenin eklediği hareket (kütüphanedekilere ek)
   ================================================================================================ */

const OZD_KAT = {
    koord: { ad: 'Koordinasyon', ikon: '🤹', renk: '#7dd3fc', ev: 'Evde: duvara top atıp tutma, 2 dk — sağ ve sol el sırayla.' },
    denge: { ad: 'Denge', ikon: '🧘', renk: '#a8e6a1', ev: 'Evde: diş fırçalarken tek ayak üstünde durma (her ayak 30 sn).' },
    guc: { ad: 'Güç', ikon: '💪', renk: '#ff9f43', ev: 'Evde: 10 squat + 10 sn plank, günde 2 kez.' },
    cevik: { ad: 'Çeviklik', ikon: '⚡', renk: '#ffd23f', ev: 'Evde: yere çizgi koyup sağa-sola hızlı sekme, 3 × 15 sn.' },
    esnek: { ad: 'Esneklik', ikon: '🤸', renk: '#c9a6ff', ev: 'Evde: yatmadan önce öne eğilme ve kelebek esnemesi, 1\'er dk.' },
    dayan: { ad: 'Dayanıklılık', ikon: '❤️', renk: '#ff8fa8', ev: 'Evde: 1 dk jumping jack, 30 sn mola, 3 tur.' }
};
const OZD_HAREKETLER = [
    { id: 'top-sektir', ad: 'Top sektirme (sağ-sol)', kat: 'koord' }, { id: 'merdiven', ad: 'Koordinasyon merdiveni', kat: 'koord' },
    { id: 'at-tut', ad: 'Top at-tut (jonglör)', kat: 'koord' }, { id: 'zipla-alkis', ad: 'Zıpla + alkış', kat: 'koord' }, { id: 'capraz', ad: 'Çapraz kol-bacak', kat: 'koord' },
    { id: 'tek-ayak', ad: 'Tek ayak duruş', kat: 'denge' }, { id: 'bosu', ad: 'Denge tahtası', kat: 'denge' }, { id: 'cizgi', ad: 'Çizgide yürüme', kat: 'denge' },
    { id: 'flamingo-top', ad: 'Flamingo + top tutma', kat: 'denge' }, { id: 'ucak', ad: 'Uçak duruşu', kat: 'denge' },
    { id: 'squat', ad: 'Squat', kat: 'guc' }, { id: 'sinav', ad: 'Şınav (dizden)', kat: 'guc' }, { id: 'plank', ad: 'Plank', kat: 'guc' },
    { id: 'kopru', ad: 'Köprü', kat: 'guc' }, { id: 'ayi', ad: 'Ayı yürüyüşü', kat: 'guc' },
    { id: 'slalom', ad: 'Koni slalom', kat: 'cevik' }, { id: 'mekik-kosu', ad: 'Mekik koşusu', kat: 'cevik' }, { id: 'reaksiyon', ad: 'Reaksiyon çıkışı', kat: 'cevik' },
    { id: 'yan-kayma', ad: 'Yan kayma', kat: 'cevik' }, { id: 'seksek', ad: 'Seksek', kat: 'cevik' },
    { id: 'one-egil', ad: 'Öne eğilme', kat: 'esnek' }, { id: 'kelebek', ad: 'Kelebek', kat: 'esnek' }, { id: 'kedi-inek', ad: 'Kedi-inek', kat: 'esnek' }, { id: 'omuz', ad: 'Omuz açma', kat: 'esnek' },
    { id: 'jumping', ad: 'Jumping jack', kat: 'dayan' }, { id: 'ip', ad: 'İp atlama', kat: 'dayan' }, { id: 'tirmanici', ad: 'Dağ tırmanıcı', kat: 'dayan' }
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
function ozdHareket(id) { return ozdHareketler().find((h) => h.id === id) || { id: id, ad: id, kat: 'koord' }; }
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
    d.kayitlar = (d.kayitlar || []).concat([{ id: id, h: h, p: p, t: Date.now() }]);
    ozdYaz('ders|' + k + '|' + d.tarih, d);
    if (_ozdSecili === k) setTimeout(ozdCiz, 0);
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
        const h = ozdHareket(id), kt = OZD_KAT[h.kat] || OZD_KAT.koord, o = oz.h[id];
        return `<button class="ozd-cip${id === s ? ' aktif' : ''}" style="--r:${kt.renk}" onclick="ozdHareketSec('${ozdEsc(k).replace(/'/g, "\\'")}','${id}')">${kt.ikon} ${ozdEsc(h.ad)}${o != null ? ` <b>${ozdSayi(o)}</b>` : ''}</button>`;
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
    if (!ozdHareketModu()) { if (b) b.remove(); return; }
    const k = ozdKonumKisi(), ad = k ? ozdIlkAd(ozdAyir(k)[1]) : '';
    const html = `<div id="ozd-km-banner" class="ozd-km-banner">💪 <b>Sporla Gelişiyorum · ${ozdEsc(ad)}</b><span>Puanlar hareket değerlendirmesidir — okçuluk kaydına yazılmaz</span><button onclick="ozdSinifaDon()">↩ Özel ders sayfası</button></div>`;
    if (b) b.outerHTML = html; else p.insertAdjacentHTML('afterbegin', html);
}
function ozdOyunaGec(k) {
    const [g, ad] = ozdAyir(k), kon = ozdKonum(k);
    if (typeof _kmAktifKonum === 'undefined') return;
    if (!ozdHareketModu()) { try { localStorage.setItem('dag_ozd_onceki_konum', _kmAktifKonum || ''); } catch (e) { } }
    // Bugünün dersi kaydedilsin (oyun ilk seriyi yazmadan önce de hareket listesi görünsün)
    if (!ozdDers(k)) ozdYaz('ders|' + k + '|' + ozdBugun(), ozdBugunDers(k));
    // konum listesine ekle — TV / ikinci cihaz "Karışık Sınıf › konum" ile bu derse katılabilsin
    try { _kmKonumlariGetir().then((l) => { if (!l.some((x) => x.id === kon)) _kmKonumlariKaydet(l.concat([{ id: kon, ad: '🤸 Özel Ders · ' + ozdIlkAd(ad) }])); }).catch(() => {}); } catch (e) { }
    _kmAktifKonum = kon; try { localStorage.setItem('dag_km_konum', kon); } catch (e) { }
    _kmListe = [{ g: g, ad: ad }]; _kmSecimler = {}; _kmSecimler[g + '_' + ad] = _kmListe[0];
    _kmListeKaydet();
    kmPlatformGoster();
    setTimeout(() => { try { kmAracSec('oyunlar'); } catch (e) { } }, 60);
}
function ozdSinifaDon() {
    let once = ''; try { once = localStorage.getItem('dag_ozd_onceki_konum') || ''; } catch (e) { }
    if (ozdHareketModu()) {
        _kmAktifKonum = once || null;
        try { if (once) localStorage.setItem('dag_km_konum', once); else localStorage.removeItem('dag_km_konum'); } catch (e) { }
        try { _kmListe = JSON.parse(localStorage.getItem(kmLocalAnahtari()) || '[]') || []; _kmSecimler = {}; _kmListe.forEach((s) => { _kmSecimler[s.g + '_' + s.ad] = s; }); } catch (e) { _kmListe = []; }
    }
    try { if (typeof kmOyunKapat === 'function' && document.getElementById('km-oyun-wrap')) kmOyunKapat(); } catch (e) { }
    const p = document.getElementById('karisik-platform'); if (p) p.style.display = 'none';
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { }
    try { kmDevamBanneriGuncelle(); } catch (e) { }
    const b = document.getElementById('ozd-km-banner'); if (b) b.remove();
    try { sekmeAc('ozelders'); } catch (e) { }
}

/* ---------------- sekme ---------------- */
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
        return `<div class="ozd-hs${id === s ? ' aktif' : ''}" style="--r:${kt.renk}" onclick="ozdHareketSec('${ke}','${id}')"><span class="ozd-hs-ad">${kt.ikon} ${ozdEsc(h.ad)}<small>${kt.ad}</small></span>
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
      ${ozdGelisimHTML(k)}`;
}
function ozdKutuphaneHTML(k, d) {
    const ke = ozdEsc(k).replace(/'/g, "\\'"), l = ozdHareketler();
    return Object.keys(OZD_KAT).map((kat) => `<div class="ozd-kat"><b>${OZD_KAT[kat].ikon} ${OZD_KAT[kat].ad}</b><div>${l.filter((h) => h.kat === kat).map((h) => `<button class="ozd-cip${d.hareketler.indexOf(h.id) >= 0 ? ' aktif' : ''}" style="--r:${OZD_KAT[kat].renk}" onclick="ozdHareketToggle('${ke}','${ozdEsc(h.id)}')">${ozdEsc(h.ad)}</button>`).join('')}</div></div>`).join('')
        + `<div class="ozd-yeni"><input id="ozd-yeni-ad" class="ozd-input" placeholder="Yeni hareket adı"><select id="ozd-yeni-kat" class="ozd-input">${Object.keys(OZD_KAT).map((x) => `<option value="${x}">${OZD_KAT[x].ikon} ${OZD_KAT[x].ad}</option>`).join('')}</select><button class="ozd-btn" onclick="ozdYeniHareket('${ke}')">Ekle</button></div>`;
}
function ozdDersYaz(k, fn) { const d = JSON.parse(JSON.stringify(ozdBugunDers(k))); fn(d); ozdYaz('ders|' + k + '|' + d.tarih, d); ozdCiz(); ozdDokGuncelle(); }
function ozdHareketToggle(k, id) { ozdDersYaz(k, (d) => { const i = d.hareketler.indexOf(id); if (i >= 0) d.hareketler.splice(i, 1); else d.hareketler.push(id); }); const det = document.querySelector('.ozd-kutup'); if (det) det.open = true; }
function ozdYeniHareket(k) {
    const ad = ((document.getElementById('ozd-yeni-ad') || {}).value || '').trim(), kat = (document.getElementById('ozd-yeni-kat') || {}).value || 'koord';
    if (!ad) return; const id = 'e' + Date.now().toString(36);
    ozdYaz('hrk|' + id, { id: id, ad: ad.slice(0, 40), kat: kat }); ozdHareketToggle(k, id);
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
    return `<section class="ozd-panel"><h3>📈 Gelişim <small>kategori ortalaması (10 üzerinden) · son derse göre</small></h3>${satir}</section>
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
            const kt = OZD_KAT[x], h = Object.keys(oz.h).filter((id) => ozdHareket(id).kat === x).map((id) => ozdHareket(id).ad).join(', ');
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
.ozd-km-banner{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:8px 14px;background:linear-gradient(90deg,#7c5cff,#ff6a1a);color:#fff;font-size:13px;flex-shrink:0}
.ozd-km-banner span{opacity:.9;font-size:12px;flex:1;min-width:160px}.ozd-km-banner button{border:0;border-radius:999px;background:rgba(0,0,0,.28);color:#fff;font-weight:800;padding:6px 12px;cursor:pointer}
.ozd-dok{margin-bottom:8px}.ozd-dok-bas{font-size:12px;font-weight:900;margin-bottom:5px}.ozd-dok-bas small{font-weight:600;opacity:.7;margin-left:4px}
.ozd-dok-cipler{display:flex;gap:5px;overflow-x:auto;padding-bottom:3px}.ozd-dok .ozd-cip{white-space:nowrap;font-size:12px;padding:6px 10px;color:inherit}.ozd-dok .ozd-cip.aktif{color:#1b1230}
@media (max-width:640px){.ozd-iki{grid-template-columns:1fr}.ozd-g{grid-template-columns:110px 1fr 36px 50px}.ozd-cizgi{display:none}.ozd-yeni{grid-template-columns:1fr}.ozd-hs{flex-wrap:wrap}.ozd-hs-p{max-width:100%}}`;
    document.head.appendChild(st);
}
