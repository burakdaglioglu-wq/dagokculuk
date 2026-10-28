// ⚔️ Yol oyunlarına heyecan (2026-10-29, v340; kullanıcı: "Kale'deki heyecan seviyesi diğer oyunlara da gelsin — görsellerini
// değiştirelim". İki taslaktan "A · Çizgi film" seçildi, önce Hazine Adası, beğenilirse Zirve/Roket/Pist/Ninja/Dağ/Balon).
// Oyun Ayarları › Özel › "Yol oyunları heyecanı" (yolMod):
//   🙂 Tatlı      — bugünkü oyun, yalnız yeni görseller (deniz, adalar);
//   ⚔️ Heyecanlı  — arkadan KOVALAYAN gelir (herkes bir seri atınca bir adım), en arkadakine yetişirse o sporcu geri itilir;
//                   yolda 2 SARI KAPI (kayalık geçit): sporcu kapıda bekler, seride 9+ ok olunca geçer; karakterler laf atar;
//   😈 Korkutucu  — gece, kovalayan daha hızlı ve daha çok iter, 3 kapı, kapı için seride 2 sarı.
// Adalet: kovalayan yalnız herkes attıktan sonra yürür (sıranın önü/arkası avantaj değil); kovalayanın arkasında kalmış
// (yeni gelen) sporcuyu yakalamaz, yalnız önünden geçtiği kişiyi. Takım modunda kapalı. Gerçek skora dokunmaz.
// Durum: dag_km_hy_<tema>_<konum> (km-ortak ile cihazlar arası). Çekirdek kancalar app.js kmOyunIlerlet'te (hyKapiUygula,
// hySeriSonu), geri al (hyAnlik/hyGeriYukle), sahne kur/resync (hyCiz/hyGuncelle), ayar (hyAyarUygula).

const HY_TEMALAR = {
    hazine: { svg: 'km-oyun-svg-hazine', panel: 'km-oyun-panel-hazine', nokta: function (f) { return kmOyunHazineNokta(Math.max(0, Math.min(1, f))); }, ust: 'km-oyun-ships',
        kovAd: 'Korsan gemisi', kapiAd: 'Kayalık geçit' }
};
const HY_KAPI = { 2: [0.35, 0.7], 3: [0.25, 0.5, 0.75] };
const HY_SARI_GEREK = { 2: 1, 3: 2 };
const HY_ADIM = { 2: 0.06, 3: 0.085 };     // tur başına kovalayan (ortalama seri ~0,1 ilerletir; zayıf seriler yakalanır)
const HY_GERI = { 2: 0.06, 3: 0.1 };      // yakalanan ne kadar geri itilir
const HY_KAPI_PAY = 0.012;                // kapıda bekleyen kapının bu kadar önünde durur

const HY_SOZ = {
    hazine: {
        yuru: ['Yelkenler fora! Geliyoruz!', 'Hazine bizim olacak!', 'Kaçamazsınız tatlı korsanlar!', 'Rüzgâr bizden yana, hahaha!'],
        tehlike: ['{ad}, ensendeyiz!', 'Az kaldı {ad}!', '{ad}, kancamı görüyor musun?'],
        yakala: ['Yakaladık! {ad} geri!', 'Ha! {ad} rotadan çıktı!'],
        bekle: ['Rüzgâr lazım kaptan, sarı at!', 'Bu geçit 9 ister kaptan!', 'Kayalar sarıdan korkar!'],
        bekle3: ['Bu gece 2 sarı lazım kaptan!', 'Karanlıkta 2 sarı ister bu geçit!'],
        gecti: ['Geçit açıldı! Yaşasın!', 'Harika rüzgâr kaptan!', 'Kayalar çekildi!']
    }
};

function hyMod() { try { let m = kmOyunAyar().yolMod || 1; return m >= 1 && m <= 3 ? m : 1; } catch (e) { return 1; } }
function hyAcik(t) { return !!HY_TEMALAR[t] && hyMod() >= 2 && !_kmOyunTakimModu; }
function hyAnahtar(t) { return 'dag_km_hy_' + t + '_' + (_kmAktifKonum || 'varsayilan'); }
function hyKey(s) { return s.g + '|' + s.ad; }
function hySec(l) { return l[Math.floor(Math.random() * l.length)]; }
function hyKapilar() { return HY_KAPI[hyMod()] || []; }
// Bitirmiş (frac 1) sporcu kovalanmaz; sıradaki seride yolu baştan başlar.
function hyAktifler() { return (_kmOyunRosterCache || []).filter(function (s) { return (s.frac || 0) < 1; }); }

function hyOku(t) {
    let st = null; try { st = JSON.parse(localStorage.getItem(hyAnahtar(t))); } catch (e) {}
    let bugun = bugunISO();
    if (!st || st.gun !== bugun) {
        let akt = hyAktifler(), min = akt.length ? Math.min.apply(null, akt.map(function (s) { return s.frac || 0; })) : 0;
        st = { gun: bugun, kov: Math.max(0, min - 0.15), atanlar: [], tur: 0 };
    }
    if (!Array.isArray(st.atanlar)) st.atanlar = [];
    return st;
}
function hyYaz(t, st) { try { localStorage.setItem(hyAnahtar(t), JSON.stringify(st)); } catch (e) {} }

// ---- çekirdek kancaları
// Sarı kapı: seri bir kapıyı geçecekse yeterli sarı yoksa sporcu kapının önünde durur. Geçerse kutlama.
function hyKapiUygula(t, s, eskiFrac, artis, kaydedilecek) {
    if (!hyAcik(t) || artis <= 0) return null;
    let m = hyMod(), sari = kaydedilecek.filter(function (k) { return k.puan === 'X' || k.puan === '10' || k.puan === '9'; }).length;
    let sonuc = { artis: artis, kapi: null, kapiFrac: null }, hedef = eskiFrac + artis;
    for (let g of hyKapilar()) {
        if (eskiFrac >= g || hedef < g) continue;
        if (sari >= HY_SARI_GEREK[m]) { sonuc.kapi = 'gecti'; sonuc.kapiFrac = g; continue; }
        sonuc.artis = Math.max(0, g - HY_KAPI_PAY - eskiFrac); sonuc.kapi = 'bekle'; sonuc.kapiFrac = g; break;
    }
    return sonuc;
}
// Seri bittikten sonra (bitirOrtak): sporcuyu "attı" işaretle, herkes attıysa kovalayan yürür; yakalarsa geri iter.
function hySeriSonu(t, s, h) {
    if (!hyAcik(t)) return;
    let st = hyOku(t), k = hyKey(s);
    if (st.atanlar.indexOf(k) === -1) st.atanlar.push(k);
    if (h && h.kapi) setTimeout(function () { hyKapiGoster(t, h); }, 150);
    let roster = (_kmOyunRosterCache || []).map(hyKey), turBitti = roster.length && roster.every(function (x) { return st.atanlar.indexOf(x) !== -1; });
    if (!turBitti) { hyYaz(t, st); hyGuncelle(t); return; }
    let m = hyMod(), eski = st.kov;
    st.kov = Math.min(0.97, eski + HY_ADIM[m]); st.atanlar = []; st.tur++;
    let kurban = hyAktifler().filter(function (o) { return o.frac > eski && o.frac <= st.kov; });
    kurban.forEach(function (o) {
        let yeni = Math.max(0, o.frac - HY_GERI[m]); o.frac = yeni;
        let d = kmOyunDurumAl(o.g, o.ad); d.frac = yeni;
    });
    if (kurban.length) { st.kov = Math.max(0, Math.min.apply(null, kurban.map(function (o) { return o.frac; })) - 0.08); kmOyunDurumKaydet(); }
    hyYaz(t, st);
    setTimeout(function () { hyYuruGoster(t, eski, st.kov, kurban); }, 700);
}
function hyAnlik(t) {
    if (!hyAcik(t)) return null;
    let fr = {}; (_kmOyunRosterCache || []).forEach(function (o) { fr[hyKey(o)] = o.frac; });
    return { t: t, ham: localStorage.getItem(hyAnahtar(t)), fr: fr };
}
function hyGeriYukle(a) {
    if (!a) return;
    try { if (a.ham) localStorage.setItem(hyAnahtar(a.t), a.ham); else localStorage.removeItem(hyAnahtar(a.t)); } catch (e) {}
    (_kmOyunRosterCache || []).forEach(function (o) { let f = a.fr[hyKey(o)]; if (f == null) return; o.frac = f; kmOyunDurumAl(o.g, o.ad).frac = f; });
    kmOyunDurumKaydet();
    hyGuncelle(a.t);
}
function hyAyarUygula() { let t = _kmOyunAktifTema; if (HY_TEMALAR[t] && document.getElementById(HY_TEMALAR[t].svg)) hyCiz(t); }

// ---- çizim
function hyCiz(t) {
    let c = HY_TEMALAR[t], svg = c && document.getElementById(c.svg); if (!svg) return;
    hyCss();
    if (t === 'hazine') hyHazineSahne(svg);
    let m = hyMod(), acik = hyAcik(t);
    svg.classList.toggle('hy-gece', acik && m === 3);
    let panel = document.getElementById(c.panel); if (panel) { panel.classList.add('hy-a'); panel.classList.toggle('hy-gece', acik && m === 3); }
    let ust = document.getElementById(c.ust);
    ['hy-kapilar', 'hy-kov', 'hy-balonlar', 'hy-hud'].forEach(function (id) {
        let g = document.getElementById(id);
        if (!g) { g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = id; }
        if (id === 'hy-kapilar' || id === 'hy-kov') svg.insertBefore(g, ust); else svg.appendChild(g);
        g.innerHTML = '';
    });
    if (!acik) { let v = document.getElementById('hy-vinyet'); if (v) v.remove(); return; }
    let kg = document.getElementById('hy-kapilar'), sari = HY_SARI_GEREK[m];
    kg.innerHTML = hyKapilar().map(function (f, i) {
        let p = c.nokta(f), h = hyYon(c, f), nx = -Math.sin(h), ny = Math.cos(h);
        let kaya = function (sx) { let x = p.x + nx * 30 * sx, y = p.y + ny * 30 * sx; return '<g class="hy-kaya" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><path d="M-18 8 L-12 -10 L-2 -16 L10 -12 L18 2 L12 10 Z" fill="#8b8f98" stroke="#3f4450" stroke-width="2.5"/><path d="M-8 -8 L2 -12 L8 -6" fill="none" stroke="#c7cbd3" stroke-width="2.5" stroke-linecap="round"/></g>'; };
        return '<g class="hy-kapi" id="hy-kapi-' + i + '">' + kaya(-1) + kaya(1)
            + '<g transform="translate(' + p.x.toFixed(1) + ' ' + (p.y - 46).toFixed(1) + ')"><rect x="-24" y="-15" width="48" height="28" rx="7" fill="#facc15" stroke="#1d1a16" stroke-width="2.5"/><text y="6" text-anchor="middle" class="hy-tabela">' + (sari > 1 ? '2×9+' : '9+') + '</text></g></g>';
    }).join('');
    document.getElementById('hy-hud').innerHTML = '<g transform="translate(16 16)"><rect width="' + (m === 3 ? 150 : 140) + '" height="34" rx="17" class="hy-hud-z"/><text x="' + (m === 3 ? 75 : 70) + '" y="23" text-anchor="middle" class="hy-hud-t">' + (m === 3 ? '😈 Korkutucu' : '⚔️ Heyecanlı') + '</text></g>';
    hyGuncelle(t);
}
function hyYon(c, f) { let a = c.nokta(Math.max(0, f - 0.004)), b = c.nokta(Math.min(1, f + 0.004)); return Math.atan2(b.y - a.y, b.x - a.x); }
function hyKovSVG(t) {
    // Kara bayraklı korsan gemisi — çizgi film: kocaman gözler, sırıtan ağız (A taslağı ailesi)
    return '<g class="hy-sallan"><path d="M-46 4 Q-40 28 0 28 Q40 28 50 2 Z" fill="#7c4a24" stroke="#3b2210" stroke-width="3"/><path d="M-40 10 H44" stroke="#3b2210" stroke-width="2" opacity=".6"/>'
        + '<line x1="0" y1="4" x2="0" y2="-62" stroke="#3b2210" stroke-width="4"/><path d="M2 -58 Q30 -40 2 -12 Z" fill="#1f2937" stroke="#111" stroke-width="2"/>'
        + '<circle cx="10" cy="-38" r="6" fill="#f8fafc"/><circle cx="8" cy="-39" r="1.6" fill="#111"/><circle cx="12" cy="-39" r="1.6" fill="#111"/><path d="M6 -32 h8" stroke="#f8fafc" stroke-width="2"/>'
        + '<path d="M-2 -60 h-16 l4 6 l-4 6 h16 z" fill="#111"/>'
        + '<circle cx="-22" cy="12" r="7" fill="#fff"/><circle cx="-6" cy="12" r="7" fill="#fff"/><circle class="hy-goz" cx="-20" cy="13" r="3.4" fill="#111"/><circle class="hy-goz" cx="-4" cy="13" r="3.4" fill="#111"/>'
        + '<path d="M-28 4 l10 3 M0 4 l-10 3" stroke="#3b2210" stroke-width="3" stroke-linecap="round"/><path d="M14 18 q8 6 16 0" fill="none" stroke="#fde68a" stroke-width="3" stroke-linecap="round"/></g>'
        + '<path class="hy-dalga" d="M-56 30 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"/>';
}
// Konumlar: kovalayan + tehlike çerçevesi (kovalayanın bir adım önündeki sporcu varsa)
function hyGuncelle(t) {
    let c = HY_TEMALAR[t], kg = document.getElementById('hy-kov'); if (!c || !kg || !hyAcik(t)) return;
    let st = hyOku(t), p = c.nokta(st.kov), h = hyYon(c, st.kov), ters = Math.cos(h) < 0;
    kg.innerHTML = '<g id="hy-kov-g" transform="translate(' + p.x.toFixed(1) + ' ' + (p.y + 4).toFixed(1) + ')"><g transform="scale(' + (ters ? -0.78 : 0.78) + ' 0.78)">' + hyKovSVG(t) + '</g></g>'
        + '<g transform="translate(' + p.x.toFixed(1) + ' ' + (p.y + 40).toFixed(1) + ')"><rect x="-38" y="-10" width="76" height="20" rx="10" class="hy-kov-et-z"/><text y="5" text-anchor="middle" class="hy-kov-et">' + (st.atanlar.length ? (st.atanlar.length + '/' + _kmOyunRosterCache.length + ' attı') : 'bekliyor') + '</text></g>';
    hyVinyet(t, hyTehlikedekiler(t, st).length > 0);
}
function hyTehlikedekiler(t, st) { let a = HY_ADIM[hyMod()]; return hyAktifler().filter(function (o) { return o.frac > st.kov && o.frac <= st.kov + a; }); }
function hyVinyet(t, acik) {
    let panel = document.getElementById(HY_TEMALAR[t].panel); if (!panel) return;
    let v = document.getElementById('hy-vinyet');
    if (!acik) { if (v) v.remove(); return; }
    if (!v) { v = document.createElement('div'); v.id = 'hy-vinyet'; if (getComputedStyle(panel).position === 'static') panel.style.position = 'relative'; panel.appendChild(v); }
}
// Konuşma balonu (SVG, ~3 sn): x,y noktasının üstünde
function hyKonus(t, x, y, metin, tur) {
    let g = document.getElementById('hy-balonlar'); if (!g) return;
    let w = Math.max(120, Math.min(330, metin.length * 8.6 + 30)), bx = Math.max(8, Math.min(1192 - w, x - w / 2)), by = Math.max(6, y - 74);
    let el = document.createElementNS('http://www.w3.org/2000/svg', 'g'); el.setAttribute('class', 'hy-balon ' + (tur || ''));
    let kx = Math.max(bx + 14, Math.min(bx + w - 14, x));
    el.innerHTML = '<path d="M' + bx + ' ' + by + ' h' + w + ' a10 10 0 0 1 10 10 v24 a10 10 0 0 1 -10 10 H' + (kx + 9) + ' l-9 14 l-9 -14 H' + bx + ' a10 10 0 0 1 -10 -10 v-24 a10 10 0 0 1 10 -10 z" />'
        + '<text x="' + (bx + w / 2) + '" y="' + (by + 28) + '" text-anchor="middle">' + esc(metin) + '</text>';
    g.appendChild(el);
    setTimeout(function () { el.classList.add('git'); setTimeout(function () { el.remove(); }, 400); }, 3200);
}
function hySoz(t, tur, ad) { let l = (HY_SOZ[t] || HY_SOZ.hazine)[tur] || ['']; return hySec(l).replace('{ad}', ad || ''); }
function hyKapiGoster(t, h) {
    let c = HY_TEMALAR[t], i = hyKapilar().indexOf(h.kapiFrac), p = c.nokta(h.kapiFrac), k = document.getElementById('hy-kapi-' + i);
    if (h.kapi === 'gecti') {
        if (k) { k.classList.remove('acil'); void k.getBBox(); k.classList.add('acil'); }
        hyKonus(t, p.x, p.y - 40, hySoz(t, 'gecti'), 'iyi');
        try { sesCal(660, 0.12); setTimeout(function () { sesCal(990, 0.16); }, 120); } catch (e) {}
    } else {
        if (k) { k.classList.remove('salla'); void k.getBBox(); k.classList.add('salla'); }
        hyKonus(t, p.x, p.y - 40, hySoz(t, hyMod() === 3 ? 'bekle3' : 'bekle'));
        try { sesCal(220, 0.15); } catch (e) {}
    }
}
// Kovalayanın yürüyüşü: eski → yeni konum, yakaladıysa geri itilenler + banner, değilse laf / tehlike uyarısı
function hyYuruGoster(t, eski, yeni, kurban) {
    let c = HY_TEMALAR[t], g = document.getElementById('hy-kov-g'); if (!c || !g) { hyGuncelle(t); return; }
    let hedef = kurban.length ? Math.min(0.97, eski + HY_ADIM[hyMod()]) : yeni, t0 = performance.now(), sure = 1100;
    (function ad(now) {
        let f = Math.min(1, (now - t0) / sure), e = 1 - Math.pow(1 - f, 3), fr = eski + (hedef - eski) * e, p = c.nokta(fr);
        if (g.isConnected) g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + (p.y + 4).toFixed(1) + ')');
        if (f < 1) { requestAnimationFrame(ad); return; }
        if (kurban.length) {
            let adlar = kurban.map(function (o) { return kmOyunIlkAd(o.ad); }).join(', ');
            hyKonus(t, p.x, p.y - 30, hySoz(t, 'yakala', adlar), 'kotu');
            try { sesCal(180, 0.25); setTimeout(function () { sesCal(140, 0.3); }, 180); } catch (e) {}
            try { kmOyunBanner('⚓ YAKALANDI!', adlar + ' geri itildi — sarı atıp kaç!', 'cp'); } catch (e) {}
            setTimeout(function () { try { kmOyunResyncAktif(); kmOyunChipleriCiz(); kmOyunLiderCiz(); } catch (e) {} hyGuncelle(t); }, 900);
        } else {
            let st = hyOku(t), tehlike = hyTehlikedekiler(t, st);
            if (tehlike.length) { hyKonus(t, p.x, p.y - 30, hySoz(t, 'tehlike', kmOyunIlkAd(tehlike[0].ad)), 'kotu'); hyKalp(); }
            else hyKonus(t, p.x, p.y - 30, hySoz(t, 'yuru'));
            hyGuncelle(t);
        }
    })(t0);
}
function hyKalp() { try { sesCal(70, 0.18); setTimeout(function () { sesCal(70, 0.14); }, 240); setTimeout(function () { sesCal(70, 0.18); }, 900); setTimeout(function () { sesCal(70, 0.14); }, 1140); } catch (e) {} }

// ---- 🏝️ Hazine Adası A görünümü: parşömen harita yerine çizgi film deniz, rotadaki duraklar kum adacıkları
function hyHazineSahne(svg) {
    let g = document.getElementById('hy-deniz');
    if (!g) { g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = 'hy-deniz'; svg.insertBefore(g, svg.firstChild); }
    svg.classList.add('hy-a');
    let ada = function (x, y, r, palmiye) {
        return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><ellipse rx="' + (r + 10) + '" ry="' + (r * 0.55 + 8) + '" class="hy-sig"/><ellipse rx="' + r + '" ry="' + (r * 0.55) + '" class="hy-kum"/>'
            + (palmiye ? '<path d="M' + (r * 0.4) + ' -4 q4 -26 -2 -44" class="hy-govde"/><path d="M' + (r * 0.4 - 2) + ' -48 q-22 -6 -30 8 M' + (r * 0.4 - 2) + ' -48 q20 -8 30 6 M' + (r * 0.4 - 2) + ' -48 q-6 -18 -22 -18 M' + (r * 0.4 - 2) + ' -48 q8 -18 24 -16" class="hy-yaprak"/>' : '') + '</g>';
    };
    let duraklar = KM_OYUN_CP_FRAC.slice(0, -1).map(function (f, i) { let p = kmOyunHazineNokta(f); return ada(p.x, p.y + 6, 26, i % 2 === 0); }).join('');
    let dalga = ''; for (let i = 0; i < 18; i++) { let x = (i * 137) % 1180 + 20, y = (i * 89) % 400 + 20; dalga += '<path class="hy-dlg" style="animation-delay:-' + (i * 0.37).toFixed(2) + 's" d="M' + x + ' ' + y + ' q8 -6 16 0 t16 0 t16 0"/>'; }
    g.innerHTML = '<defs><radialGradient id="hy-deniz-g" cx="50%" cy="45%" r="70%"><stop offset="0" class="hy-d1"/><stop offset="1" class="hy-d2"/></radialGradient></defs>'
        + '<rect x="-40" y="-40" width="1280" height="520" fill="url(#hy-deniz-g)"/>' + dalga
        + ada(90, 342, 46, true) + ada(1130, 96, 54, true) + duraklar
        + '<g class="hy-ay"><circle cx="1000" cy="50" r="26"/><circle cx="1012" cy="44" r="22" class="hy-ay-oyuk"/></g>';
}

function hyCss() {
    if (document.getElementById('hy-css')) return;
    let st = document.createElement('style'); st.id = 'hy-css';
    st.textContent = [
        '#km-oyun-panel-hazine.hy-a{background:#3fa7d6}#km-oyun-panel-hazine.hy-a.hy-gece{background:#0b1a33}',
        '#km-oyun-svg-hazine.hy-a .km-grid,#km-oyun-svg-hazine.hy-a .km-compass{display:none}',
        '#km-oyun-svg-hazine.hy-a .km-map-route{stroke:#fff;stroke-dasharray:10 9;opacity:.9}#km-oyun-svg-hazine.hy-a .km-map-route-glow{stroke:#0e7490;opacity:.35}',
        '.hy-d1{stop-color:#6cc9ec}.hy-d2{stop-color:#2b8fc4}.hy-gece .hy-d1{stop-color:#1d3557}.hy-gece .hy-d2{stop-color:#070f22}',
        '.hy-kum{fill:#f6dc9a;stroke:#d4a957;stroke-width:3}.hy-sig{fill:#a5e3f5;opacity:.75}.hy-gece .hy-kum{fill:#8a7a52;stroke:#5c4f30}.hy-gece .hy-sig{fill:#24456e}',
        '.hy-govde{fill:none;stroke:#8b5a2b;stroke-width:5;stroke-linecap:round}.hy-yaprak{fill:none;stroke:#2f9e44;stroke-width:6;stroke-linecap:round}.hy-gece .hy-yaprak{stroke:#1f5c33}',
        '.hy-dlg{fill:none;stroke:#e0f7ff;stroke-width:2.5;stroke-linecap:round;opacity:.55;animation:hyDlg 3.2s ease-in-out infinite}@keyframes hyDlg{50%{transform:translateX(10px);opacity:.25}}.hy-gece .hy-dlg{stroke:#5b7db0}',
        '.hy-ay{display:none}.hy-gece .hy-ay{display:block}.hy-ay circle{fill:#fca5a5}.hy-ay .hy-ay-oyuk{fill:#0b1a33}',
        '.hy-gece #km-oyun-hazine-dekor{opacity:.55}',
        '.hy-tabela{font:900 15px "Baloo 2",system-ui,sans-serif;fill:#1d1a16}',
        '.hy-kapi.acil .hy-kaya:first-of-type{animation:hyAc1 1.4s ease forwards}.hy-kapi.acil .hy-kaya:nth-of-type(2){animation:hyAc2 1.4s ease forwards}',
        '@keyframes hyAc1{40%{translate:-14px 0}100%{translate:0 0}}@keyframes hyAc2{40%{translate:14px 0}100%{translate:0 0}}',
        '.hy-kapi.salla{animation:hySalla .45s ease 2}@keyframes hySalla{25%{translate:-4px 0}75%{translate:4px 0}}',
        '.hy-sallan{animation:hySal 1.6s ease-in-out infinite alternate}@keyframes hySal{to{rotate:-4deg;translate:0 -2px}}.hy-dalga{animation:hyDlg 1.2s ease-in-out infinite}',
        '.hy-gece .hy-goz{fill:#ef4444}',
        '.hy-kov-et-z{fill:rgba(17,24,39,.78)}.hy-kov-et{font:800 11px "Nunito",system-ui,sans-serif;fill:#fde68a}',
        '.hy-hud-z{fill:#fffdf8;stroke:#1d1a16;stroke-width:2.5}.hy-hud-t{font:900 16px "Baloo 2",system-ui,sans-serif;fill:#1d1a16}.hy-gece .hy-hud-z{fill:rgba(70,16,28,.9);stroke:#fca5a5}.hy-gece .hy-hud-t{fill:#fee2e2}',
        '.hy-balon path{fill:#fffdf8;stroke:#1d1a16;stroke-width:2.5}.hy-balon text{font:800 16px "Nunito",system-ui,sans-serif;fill:#1d1a16}',
        '.hy-balon.kotu path{stroke:#dc2626;stroke-width:3}.hy-balon.iyi path{stroke:#16a34a;stroke-width:3}',
        '.hy-balon{transform-box:fill-box;transform-origin:50% 100%;animation:hyBalon .35s cubic-bezier(.2,1.6,.4,1) both}.hy-balon.git{animation:hyBalonGit .35s ease forwards}',
        '@keyframes hyBalon{from{scale:0;opacity:0}}@keyframes hyBalonGit{to{scale:.85;opacity:0}}',
        '#hy-vinyet{position:absolute;inset:0;pointer-events:none;border-radius:inherit;box-shadow:inset 0 0 60px 18px rgba(220,38,38,.55);animation:hyVin 1.3s ease-in-out infinite;z-index:3}@keyframes hyVin{50%{opacity:.35}}',
        '@media (prefers-reduced-motion:reduce){.hy-dlg,.hy-sallan,.hy-dalga,#hy-vinyet{animation:none}}'
    ].join('\n');
    document.head.appendChild(st);
}
