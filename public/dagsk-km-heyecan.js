// ⚔️ Yol oyunlarına heyecan (2026-10-29, v340–341; kullanıcı: "Kale'deki heyecan seviyesi diğer oyunlara da gelsin — görsellerini
// değiştirelim". İki taslaktan "A · Çizgi film" seçildi; v340 Hazine Adası, v341 Zirve/Roket/Pist/Ninja/Dağ/Balon).
// Oyun Ayarları › Özel › "Yol oyunları heyecanı" (yolMod):
//   🙂 Tatlı      — bugünkü oyun; Hazine/Pist/Balon'da yeni A görünümü (deniz · çimenli rally pisti · güneşli gök);
//   ⚔️ Heyecanlı  — arkadan KOVALAYAN gelir (herkes bir seri atınca bir adım), önünden geçtiği sporcuyu geri iter;
//                   yolda 2 SARI KAPI: sporcu kapıda bekler, seride 9+ ok olunca geçer; karakterler laf atar;
//   😈 Korkutucu  — gece, kovalayan daha hızlı ve daha çok iter, 3 kapı, kapı için seride 2 sarı.
// Zirve ve Ninja'nın kendi kapıları var (kaya duvarı/yarık, Sensei/çukur) → onlarda sarı kapı yok, yalnız kovalayan.
// Pist çok turlu: kapılar her turda, kovalayan tur birimiyle (HY_TEMALAR.pist.olcek). Balon'da yol yok: kovalayan aşağıdan
// yükselen fırtına bulutu bandı, kapı yatay rüzgâr çizgisi.
// Adalet: kovalayan yalnız herkes attıktan sonra yürür; arkasında kalmış (yeni gelen) sporcuyu yakalamaz, yalnız önünden
// geçtiğini. Takım modunda kapalı. Gerçek skora dokunmaz.
// Durum: dag_km_hy_<tema>_<konum> (km-ortak ile cihazlar arası). Çekirdek kancalar app.js: kmOyunIlerlet (hyKapiUygula,
// hySeriSonu), geri al (hyAnlik/hyGeriYukle), kmOyunKabukGuncelle → hyTazele (katmanı kurar/günceller), ayar (hyAyarUygula).

const HY_TEMALAR = {
    hazine: { svg: 'km-oyun-svg-hazine', panel: 'km-oyun-panel-hazine', ust: 'km-oyun-ships', kapi: 'kaya', kaya: ['#8b8f98', '#3f4450'],
        nokta: function (f) { return kmOyunHazineNokta(Math.max(0, Math.min(1, f))); }, sahne: function (svg) { hyHazineSahne(svg); } },
    zirve: { svg: 'km-oyun-svg-zirve', panel: 'km-oyun-panel-zirve', ust: 'km-oyun-climbers', kapi: null,
        nokta: function (f) { return kmOyunZirveNokta(f); } },
    yildiz: { svg: 'km-oyun-svg-yildiz', panel: 'km-oyun-panel-yildiz', ust: 'km-oyun-rockets', kapi: 'kaya', kaya: ['#a78bfa', '#4c1d95'],
        nokta: function (f) { return kmOyunRoketNokta(f); } },
    pist: { svg: 'km-oyun-svg-pist', panel: 'km-oyun-panel-pist', ust: 'km-oyun-pist-arabalar', kapi: 'bariyer', olcek: 2.4,
        tur: function () { return kmOyunPistToplamTur(); }, nokta: function (f) { return kmOyunPistNokta(f); }, sahne: function (svg) { hyPistSahne(svg); } },
    ninja: { svg: 'km-oyun-svg-ninja', panel: 'km-oyun-panel-ninja', ust: 'km-oyun-ninjalar', kapi: null,
        nokta: function (f) { return kmOyunNinjaNokta(Math.max(0, Math.min(1, f))); } },
    dag: { svg: 'km-oyun-svg-dag', panel: 'km-oyun-panel-dag', ust: 'km-oyun-dag-climbers', kapi: 'kaya', kaya: ['#a8794f', '#5b3a1e'],
        nokta: function (f) { return kmOyunDagNokta(Math.max(0, Math.min(1, f))); } },
    balon: { svg: 'km-oyun-svg-balon', panel: 'km-oyun-panel-balon', ust: 'km-oyun-balonlar', kapi: 'cizgi', bant: true,
        nokta: function (f) { return { x: 600, y: 400 - Math.max(0, Math.min(1, f)) * 350 }; }, sahne: function (svg) { hyBalonSahne(svg); } }
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
    },
    zirve: {
        yuru: ['Yuvarlanıyorum, büyüyorum!', 'Bu dağ benim!', 'Kar topu geliyor!'],
        tehlike: ['{ad}, arkana bak!', '{ad}, seni kardan adam yapacağım!'],
        yakala: ['Hop! {ad} kara gömüldü!', 'Yakaladım! {ad} aşağı!'],
        bekle: [''], bekle3: [''], gecti: ['']
    },
    yildiz: {
        yuru: ['Meteor yağmuru başlıyor!', 'Vınnn! Geliyoruz!', 'Uzay bizim!'],
        tehlike: ['{ad}, kalkanın var mı?', '{ad}, sarı yakıt lazım!'],
        yakala: ['Bam! {ad} rotadan çıktı!', 'Yakaladık! {ad} geri!'],
        bekle: ['Sarı yakıt lazım!', 'Asteroitler 9 ister!', 'Sarı at, kuşak açılsın!'],
        bekle3: ['Bu gece 2 sarı yakıt lazım!', 'Karanlık uzayda 2 sarı ister!'],
        gecti: ['Kuşaktan geçtin!', 'Süper pilot!', 'Asteroitler kenara!']
    },
    pist: {
        yuru: ['Kara Kamyon geliyor!', 'Vrımm! Yakalarım!', 'Korna çalıyorum, düt düt!'],
        tehlike: ['{ad}, aynada beni görüyor musun?', '{ad}, tamponundayım!'],
        yakala: ['Yakaladım! {ad} pite!', 'Hop! {ad} geri!'],
        bekle: ['Sarı at, bariyer açılsın!', 'Bariyer 9 ister!', 'Nitro lazım, sarı at!'],
        bekle3: ['Gece bariyeri 2 sarı ister!', 'İki nitro lazım!'],
        gecti: ['Bariyer açıldı!', 'Nitro! Geçtin!', 'Süper sürüş!']
    },
    ninja: {
        yuru: ['Gölgeler sessiz yürür…', 'Seni izliyorum…', 'Ben senin gölgenim!'],
        tehlike: ['{ad}, arkanda bir gölge var…', '{ad}, sabır, sonra sarı!'],
        yakala: ['Yakaladım! {ad} geri!', 'Gölge kazandı! {ad} geri!'],
        bekle: [''], bekle3: [''], gecti: ['']
    },
    dag: {
        yuru: ['Fırtına yükseliyor!', 'Uuuu, rüzgâr geliyor!', 'Kar yağıyor, dikkat!'],
        tehlike: ['{ad}, fırtına arkanda!', 'Meee! {ad}, düşersin!'],
        yakala: ['Fırtına yakaladı! {ad} geri!', 'Brrr! {ad} kaydı!'],
        bekle: ['Meee! Köprü sarı ister!', 'Yarıktan 9 ile geçilir!', 'Sarı at, köprü kurulsun!'],
        bekle3: ['Meee! Gece 2 sarı lazım!', 'Karanlıkta köprü 2 sarı ister!'],
        gecti: ['Köprüden geçtin!', 'Meee! Aferin!', 'Harika tırmanış!']
    },
    balon: {
        yuru: ['Gürültü! Fırtına yükseliyor!', 'Şimşekler geliyor!', 'Bulutun üstüne çık!'],
        tehlike: ['{ad}, bulutun üstüne çık!', '{ad}, şimşek geliyor!'],
        yakala: ['Şimşek çaktı! {ad} aşağı!', 'Fırtına yakaladı! {ad} indi!'],
        bekle: ['Rüzgâr kapısı sarı ister!', 'Sarı at, rüzgâr gelsin!', 'Kapıdan 9 ile geçilir!'],
        bekle3: ['Gece rüzgârı 2 sarı ister!', 'İki sarı, sonra yukarı!'],
        gecti: ['Rüzgâr seni yükseltti!', 'Yukarı, yukarı!', 'Harika uçuş!']
    }
};

function hyMod() { try { let m = kmOyunAyar().yolMod || 1; return m >= 1 && m <= 3 ? m : 1; } catch (e) { return 1; } }
function hyAcik(t) { return !!HY_TEMALAR[t] && hyMod() >= 2 && !_kmOyunTakimModu; }
function hyAnahtar(t) { return 'dag_km_hy_' + t + '_' + (_kmAktifKonum || 'varsayilan'); }
function hyKey(s) { return s.g + '|' + s.ad; }
function hySec(l) { return l[Math.floor(Math.random() * l.length)]; }
function hyOlcek(t) { return HY_TEMALAR[t].olcek || 1; }
function hyTur(t) { let c = HY_TEMALAR[t]; try { return c.tur ? c.tur() : 1; } catch (e) { return 1; } }
// Kapılar her turda tekrar eder (yalnız Pist'te birden çok tur var)
function hyKapilar(t) {
    if (!HY_TEMALAR[t].kapi) return [];
    let l = [], k = HY_KAPI[hyMod()] || []; for (let tur = 0; tur < hyTur(t); tur++) k.forEach(function (g) { l.push(tur + g); }); return l;
}
// Bitirmiş sporcu kovalanmaz; sıradaki seride yolu baştan başlar.
function hyAktifler(t) { let son = hyTur(t); return (_kmOyunRosterCache || []).filter(function (s) { return (s.frac || 0) < son; }); }

function hyOku(t) {
    let st = null; try { st = JSON.parse(localStorage.getItem(hyAnahtar(t))); } catch (e) {}
    let bugun = bugunISO();
    if (!st || st.gun !== bugun) {
        let akt = hyAktifler(t), min = akt.length ? Math.min.apply(null, akt.map(function (s) { return s.frac || 0; })) : 0;
        st = { gun: bugun, kov: Math.max(0, min - 0.15 * hyOlcek(t)), atanlar: [], tur: 0 };
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
    for (let g of hyKapilar(t)) {
        if (eskiFrac >= g || hedef < g) continue;
        if (sari >= HY_SARI_GEREK[m]) { sonuc.kapi = 'gecti'; sonuc.kapiFrac = g; continue; }
        sonuc.artis = Math.max(0, g - HY_KAPI_PAY * hyOlcek(t) - eskiFrac); sonuc.kapi = 'bekle'; sonuc.kapiFrac = g; break;
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
    let m = hyMod(), o = hyOlcek(t), eski = st.kov;
    st.kov = Math.min(hyTur(t) - 0.03, eski + HY_ADIM[m] * o); st.atanlar = []; st.tur++;
    let kurban = hyAktifler(t).filter(function (x) { return x.frac > eski && x.frac <= st.kov; });
    kurban.forEach(function (x) {
        let yeni = Math.max(0, x.frac - HY_GERI[m] * o); x.frac = yeni;
        kmOyunDurumAl(x.g, x.ad).frac = yeni;
    });
    if (kurban.length) { st.kov = Math.max(0, Math.min.apply(null, kurban.map(function (x) { return x.frac; })) - 0.08 * o); kmOyunDurumKaydet(); }
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
// kmOyunKabukGuncelle'den (sahne kurulumu, resync, tema geçişi): katman yoksa ya da ayar/tur sayısı değiştiyse kur, yoksa güncelle.
function hyTazele(t) {
    let c = HY_TEMALAR[t], svg = c && document.getElementById(c.svg); if (!svg) return;
    let imza = hyMod() + '|' + hyTur(t) + '|' + (_kmOyunTakimModu ? 1 : 0);
    if (svg.getAttribute('data-hy') !== imza || !document.getElementById('hy-hud') || !svg.contains(document.getElementById('hy-hud'))) hyCiz(t);
    else hyGuncelle(t);
}

// ---- çizim
function hyKatman(svg, id, onune) {
    let g = svg.querySelector('#' + id);
    if (!g) { let eski = document.getElementById(id); if (eski) eski.remove(); g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = id; }
    let ust = onune ? document.getElementById(onune) : null;
    if (ust && ust.parentNode === svg) svg.insertBefore(g, ust); else svg.appendChild(g);
    g.innerHTML = ''; return g;
}
function hyCiz(t) {
    let c = HY_TEMALAR[t], svg = c && document.getElementById(c.svg); if (!svg) return;
    hyCss();
    // başka bir temanın katmanları (aynı id) bu SVG'ye karışmasın
    ['hy-ortu', 'hy-kapilar', 'hy-kov', 'hy-balonlar', 'hy-hud'].forEach(function (id) { let e = document.getElementById(id); if (e && !svg.contains(e)) e.remove(); });
    if (c.sahne) c.sahne(svg);
    let m = hyMod(), acik = hyAcik(t);
    svg.setAttribute('data-hy', m + '|' + hyTur(t) + '|' + (_kmOyunTakimModu ? 1 : 0));
    svg.classList.toggle('hy-gece', acik && m === 3);
    let panel = document.getElementById(c.panel); if (panel) { panel.classList.toggle('hy-a', !!c.sahne); panel.classList.toggle('hy-gece', acik && m === 3); }
    let ortu = hyKatman(svg, 'hy-ortu', c.ust), kg = hyKatman(svg, 'hy-kapilar', c.ust); hyKatman(svg, 'hy-kov', c.ust); hyKatman(svg, 'hy-balonlar'); let hud = hyKatman(svg, 'hy-hud');
    if (!acik) { let v = document.getElementById('hy-vinyet'); if (v) v.remove(); return; }
    if (m === 3 && !c.sahne) ortu.innerHTML = '<rect x="-900" y="-1100" width="3000" height="2800" class="hy-ortu"/>';
    let sari = HY_SARI_GEREK[m], tabela = function (x, y) { return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><rect x="-24" y="-15" width="48" height="28" rx="7" fill="#facc15" stroke="#1d1a16" stroke-width="2.5"/><text y="6" text-anchor="middle" class="hy-tabela">' + (sari > 1 ? '2×9+' : '9+') + '</text></g>'; };
    kg.innerHTML = hyKapilar(t).map(function (f, i) {
        let p = c.nokta(f);
        if (c.kapi === 'cizgi') return '<g class="hy-kapi" id="hy-kapi-' + i + '"><line x1="30" x2="1170" y1="' + p.y.toFixed(1) + '" y2="' + p.y.toFixed(1) + '" class="hy-ruzgar"/>' + tabela(1120, p.y - 18) + '</g>';
        let h = hyYon(t, f), nx = -Math.sin(h), ny = Math.cos(h);
        if (c.kapi === 'bariyer') {
            let x = p.x + nx * 30, y = p.y + ny * 30;
            return '<g class="hy-kapi" id="hy-kapi-' + i + '"><g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (h * 180 / Math.PI - 90).toFixed(1) + ')"><rect x="-6" y="-6" width="12" height="12" fill="#374151"/><g class="hy-kol"><rect x="0" y="-5" width="60" height="10" rx="3" fill="#facc15"/><rect x="10" y="-5" width="10" height="10" fill="#111"/><rect x="30" y="-5" width="10" height="10" fill="#111"/><rect x="50" y="-5" width="10" height="10" fill="#111"/></g></g>' + tabela(p.x, p.y - 42) + '</g>';
        }
        let kaya = function (sx) { let x = p.x + nx * 30 * sx, y = p.y + ny * 30 * sx; return '<g class="hy-kaya" transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"><path d="M-18 8 L-12 -10 L-2 -16 L10 -12 L18 2 L12 10 Z" fill="' + c.kaya[0] + '" stroke="' + c.kaya[1] + '" stroke-width="2.5"/><path d="M-8 -8 L2 -12 L8 -6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/></g>'; };
        return '<g class="hy-kapi" id="hy-kapi-' + i + '">' + kaya(-1) + kaya(1) + tabela(p.x, p.y - 46) + '</g>';
    }).join('');
    let hx = t === 'pist' ? 1040 : 16, w = m === 3 ? 150 : 140;
    hud.innerHTML = '<g transform="translate(' + hx + ' 16)"><rect width="' + w + '" height="34" rx="17" class="hy-hud-z"/><text x="' + (w / 2) + '" y="23" text-anchor="middle" class="hy-hud-t">' + (m === 3 ? '😈 Korkutucu' : '⚔️ Heyecanlı') + '</text></g>';
    hyGuncelle(t);
}
function hyYon(t, f) {
    let c = HY_TEMALAR[t], son = hyTur(t), a = c.nokta(Math.max(0, f - 0.004)), b = c.nokta(Math.min(son, f + 0.004));
    return Math.atan2(b.y - a.y, b.x - a.x);
}
// Kovalayanlar — çizgi film (A taslağı ailesi): kocaman gözler; 😈'de gözler kızıl (.hy-goz)
function hyGoz(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff"/><circle class="hy-goz" cx="' + (x + r * 0.25) + '" cy="' + (y + r * 0.1) + '" r="' + (r * 0.5) + '" fill="#111"/>'; }
function hyKovSVG(t, st) {
    if (t === 'zirve') {
        let k = Math.min(1.5, 0.85 + (st.tur || 0) * 0.08);
        return '<g class="hy-yuvarlan" transform="scale(' + k.toFixed(2) + ')"><circle r="26" fill="#f8fafc" stroke="#94a3b8" stroke-width="3"/><path d="M-14 -12 q6 -6 12 0 M6 10 q6 4 12 -2 M-18 8 q4 4 8 2" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/></g>'
            + hyGoz(-9, -4, 7) + hyGoz(9, -4, 7) + '<path d="M-8 12 q8 7 16 0" fill="none" stroke="#334155" stroke-width="3" stroke-linecap="round"/><path d="M-16 -14 l9 4 M16 -14 l-9 4" stroke="#334155" stroke-width="3" stroke-linecap="round"/>';
    }
    if (t === 'yildiz') return '<path d="M-20 0 Q-70 -14 -96 -4 Q-70 4 -96 14 Q-66 16 -20 8 Z" fill="#fb923c" opacity=".85" class="hy-alev"/><path d="M-20 2 Q-56 -4 -70 4 Q-52 8 -20 6 Z" fill="#fde047"/>'
        + '<path d="M-24 -6 L-14 -22 L6 -26 L24 -14 L26 8 L12 24 L-12 22 L-26 10 Z" fill="#78716c" stroke="#44403c" stroke-width="3"/><circle cx="-8" cy="12" r="4" fill="#57534e"/><circle cx="14" cy="-16" r="3" fill="#57534e"/>'
        + hyGoz(-4, -4, 6.5) + hyGoz(12, -4, 6.5) + '<path d="M-2 10 q7 5 14 0" fill="none" stroke="#1c1917" stroke-width="3" stroke-linecap="round"/>';
    if (t === 'pist') return '<g class="hy-sallan"><rect x="-44" y="-24" width="88" height="48" rx="10" fill="#1f2937" stroke="#0b0f17" stroke-width="3"/><rect x="18" y="-20" width="24" height="40" rx="6" fill="#111827"/>'
        + hyGoz(30, -9, 6) + hyGoz(30, 9, 6) + '<path d="M22 -18 l14 4 M22 18 l14 -4" stroke="#0b0f17" stroke-width="4" stroke-linecap="round"/>'
        + '<rect x="-38" y="-30" width="16" height="8" rx="3" fill="#111"/><rect x="-38" y="22" width="16" height="8" rx="3" fill="#111"/><rect x="12" y="-30" width="16" height="8" rx="3" fill="#111"/><rect x="12" y="22" width="16" height="8" rx="3" fill="#111"/></g>'
        + '<g fill="#9ca3af" opacity=".7"><circle cx="-56" cy="-6" r="9" class="hy-duman"/><circle cx="-72" cy="4" r="7" class="hy-duman" style="animation-delay:-.4s"/></g>';
    if (t === 'ninja') return '<g class="hy-sallan"><ellipse cx="0" cy="24" rx="20" ry="5" fill="#000" opacity=".3"/><path d="M-14 22 L-10 -4 Q0 -14 10 -4 L14 22 Z" fill="#0f172a"/><circle cx="0" cy="-16" r="15" fill="#0f172a"/>'
        + '<rect x="-15" y="-21" width="30" height="9" rx="4" fill="#1e293b"/><path d="M14 -18 q14 -2 20 6" fill="none" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>' + hyGoz(-6, -17, 4.5) + hyGoz(6, -17, 4.5) + '</g>';
    if (t === 'dag') return '<g class="hy-sallan"><g fill="#cbd5e1" stroke="#64748b" stroke-width="3"><circle cx="-20" cy="2" r="18"/><circle cx="6" cy="-8" r="24"/><circle cx="30" cy="4" r="16"/><rect x="-30" y="2" width="68" height="18" rx="9" stroke="none"/></g>'
        + hyGoz(-4, -6, 6) + hyGoz(14, -6, 6) + '<path d="M0 8 q6 -4 12 0" fill="none" stroke="#334155" stroke-width="3" stroke-linecap="round"/></g>'
        + '<g fill="#fff" class="hy-kar"><circle cx="-18" cy="30" r="3"/><circle cx="2" cy="38" r="2.5"/><circle cx="22" cy="30" r="3"/><circle cx="-6" cy="48" r="2"/></g>';
    // hazine: kara bayraklı korsan gemisi
    return '<g class="hy-sallan"><path d="M-46 4 Q-40 28 0 28 Q40 28 50 2 Z" fill="#7c4a24" stroke="#3b2210" stroke-width="3"/><path d="M-40 10 H44" stroke="#3b2210" stroke-width="2" opacity=".6"/>'
        + '<line x1="0" y1="4" x2="0" y2="-62" stroke="#3b2210" stroke-width="4"/><path d="M2 -58 Q30 -40 2 -12 Z" fill="#1f2937" stroke="#111" stroke-width="2"/>'
        + '<circle cx="10" cy="-38" r="6" fill="#f8fafc"/><circle cx="8" cy="-39" r="1.6" fill="#111"/><circle cx="12" cy="-39" r="1.6" fill="#111"/><path d="M6 -32 h8" stroke="#f8fafc" stroke-width="2"/>'
        + '<path d="M-2 -60 h-16 l4 6 l-4 6 h16 z" fill="#111"/>'
        + hyGoz(-22, 12, 7) + hyGoz(-6, 12, 7)
        + '<path d="M-28 4 l10 3 M0 4 l-10 3" stroke="#3b2210" stroke-width="3" stroke-linecap="round"/><path d="M14 18 q8 6 16 0" fill="none" stroke="#fde68a" stroke-width="3" stroke-linecap="round"/></g>'
        + '<path class="hy-dalga" d="M-56 30 q8 -6 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0" fill="none" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"/>';
}
// Balon: aşağıdan yükselen fırtına bulutu bandı (tüm şeritler), ortasında yüz
function hyBantSVG(y) {
    let bulut = ''; for (let x = 40; x <= 1160; x += 70) bulut += '<circle cx="' + x + '" cy="' + (y + ((x / 70) % 2 ? 6 : -4)) + '" r="' + (30 + ((x / 10) % 3) * 4) + '"/>';
    return '<rect x="-60" y="' + y + '" width="1320" height="' + Math.max(0, 470 - y) + '" class="hy-bant-alt"/><g class="hy-bant">' + bulut + '</g>'
        + '<path class="hy-simsek" d="M300 ' + (y + 10) + ' l-14 30 h12 l-10 28 l26 -36 h-12 l12 -22 z M880 ' + (y + 14) + ' l-14 30 h12 l-10 28 l26 -36 h-12 l12 -22 z"/>'
        + '<g transform="translate(600 ' + (y - 4) + ')">' + hyGoz(-12, -6, 8) + hyGoz(12, -6, 8) + '<path d="M-10 10 q10 -7 20 0" fill="none" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/><path d="M-22 -18 l12 5 M22 -18 l-12 5" stroke="#1e293b" stroke-width="3.5" stroke-linecap="round"/></g>';
}
// Konumlar: kovalayan + tehlike çerçevesi (kovalayanın bir adım önündeki sporcu varsa)
function hyGuncelle(t) {
    let c = HY_TEMALAR[t], kg = document.getElementById('hy-kov'); if (!c || !kg || !hyAcik(t)) return;
    let st = hyOku(t), p = c.nokta(st.kov), sayi = st.atanlar.length ? (st.atanlar.length + '/' + _kmOyunRosterCache.length + ' attı') : 'bekliyor';
    if (c.bant) {
        kg.innerHTML = '<g id="hy-kov-g" transform="translate(0 ' + (p.y - 400).toFixed(1) + ')">' + hyBantSVG(400) + '</g>'
            + '<g transform="translate(600 ' + (p.y + 34).toFixed(1) + ')"><rect x="-38" y="-10" width="76" height="20" rx="10" class="hy-kov-et-z"/><text y="5" text-anchor="middle" class="hy-kov-et">' + sayi + '</text></g>';
    } else {
        let h = hyYon(t, st.kov), ters = Math.cos(h) < 0, don = t === 'pist' || t === 'yildiz';
        let ic = don ? 'rotate(' + (h * 180 / Math.PI).toFixed(1) + ') scale(0.8)' : 'scale(' + (ters ? -0.78 : 0.78) + ' 0.78)';
        kg.innerHTML = '<g id="hy-kov-g" transform="translate(' + p.x.toFixed(1) + ' ' + (p.y + 4).toFixed(1) + ')"><g transform="' + ic + '">' + hyKovSVG(t, st) + '</g></g>'
            + '<g transform="translate(' + p.x.toFixed(1) + ' ' + (p.y + 42).toFixed(1) + ')"><rect x="-38" y="-10" width="76" height="20" rx="10" class="hy-kov-et-z"/><text y="5" text-anchor="middle" class="hy-kov-et">' + sayi + '</text></g>';
    }
    hyVinyet(t, hyTehlikedekiler(t, st).length > 0);
}
function hyTehlikedekiler(t, st) { let a = HY_ADIM[hyMod()] * hyOlcek(t); return hyAktifler(t).filter(function (o) { return o.frac > st.kov && o.frac <= st.kov + a; }); }
function hyVinyet(t, acik) {
    let panel = document.getElementById(HY_TEMALAR[t].panel); if (!panel) return;
    let v = document.getElementById('hy-vinyet');
    if (v && v.parentNode !== panel) { v.remove(); v = null; }
    if (!acik) { if (v) v.remove(); return; }
    if (!v) { v = document.createElement('div'); v.id = 'hy-vinyet'; if (getComputedStyle(panel).position === 'static') panel.style.position = 'relative'; panel.appendChild(v); }
}
// Konuşma balonu (SVG, ~3 sn): x,y noktasının üstünde
function hyKonus(t, x, y, metin, tur) {
    let g = document.getElementById('hy-balonlar'); if (!g || !metin) return;
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
    let c = HY_TEMALAR[t], i = hyKapilar(t).indexOf(h.kapiFrac), p = c.nokta(h.kapiFrac), k = document.getElementById('hy-kapi-' + i);
    if (c.bant) p = { x: 900, y: p.y };
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
    let hedef = kurban.length ? Math.min(hyTur(t) - 0.03, eski + HY_ADIM[hyMod()] * hyOlcek(t)) : yeni, t0 = performance.now(), sure = 1100;
    (function ad(now) {
        let f = Math.min(1, (now - t0) / sure), e = 1 - Math.pow(1 - f, 3), fr = eski + (hedef - eski) * e, p = c.nokta(fr);
        if (g.isConnected) g.setAttribute('transform', c.bant ? 'translate(0 ' + (p.y - 400).toFixed(1) + ')' : 'translate(' + p.x.toFixed(1) + ' ' + (p.y + 4).toFixed(1) + ')');
        if (f < 1) { requestAnimationFrame(ad); return; }
        let bx = c.bant ? 600 : p.x;
        if (kurban.length) {
            let adlar = kurban.map(function (o) { return kmOyunIlkAd(o.ad); }).join(', ');
            hyKonus(t, bx, p.y - 30, hySoz(t, 'yakala', adlar), 'kotu');
            try { sesCal(180, 0.25); setTimeout(function () { sesCal(140, 0.3); }, 180); } catch (e) {}
            try { kmOyunBanner('⚓ YAKALANDI!', adlar + ' geri itildi — sarı atıp kaç!', 'cp'); } catch (e) {}
            setTimeout(function () { try { kmOyunResyncAktif(); kmOyunChipleriCiz(); kmOyunLiderCiz(); } catch (e) {} hyGuncelle(t); }, 900);
        } else {
            let st = hyOku(t), tehlike = hyTehlikedekiler(t, st);
            if (tehlike.length) { hyKonus(t, bx, p.y - 30, hySoz(t, 'tehlike', kmOyunIlkAd(tehlike[0].ad)), 'kotu'); hyKalp(); }
            else hyKonus(t, bx, p.y - 30, hySoz(t, 'yuru'));
            hyGuncelle(t);
        }
    })(t0);
}
function hyKalp() { try { sesCal(70, 0.18); setTimeout(function () { sesCal(70, 0.14); }, 240); setTimeout(function () { sesCal(70, 0.18); }, 900); setTimeout(function () { sesCal(70, 0.14); }, 1140); } catch (e) {} }

// ---- A görünümü sahneleri (her seviyede)
function hyArka(svg, id, onune) {
    let g = svg.querySelector('#' + id);
    if (!g) { g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.id = id; let o = onune && svg.querySelector('#' + onune); svg.insertBefore(g, o || svg.firstChild); }
    svg.classList.add('hy-a'); return g;
}
// 🏝️ Hazine: parşömen harita yerine çizgi film deniz, rotadaki duraklar kum adacıkları
function hyHazineSahne(svg) {
    let g = hyArka(svg, 'hy-deniz');
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
// 🏎️ Pist: gündüz çimenli rally pisti — kırmızı-beyaz bordür, tribün, ağaçlar (A taslağı)
function hyPistSahne(svg) {
    let g = hyArka(svg, 'hy-pist-zemin', 'km-oyun-pist-seyirci'), d = KM_OYUN_PIST_YOL_D;
    let agac = [[40, 40], [1160, 50], [60, 410], [1150, 405], [600, 425]].map(function (a) { return '<g transform="translate(' + a[0] + ' ' + a[1] + ')"><circle r="24" class="hy-agac"/><circle cx="-10" cy="-8" r="12" class="hy-agac2"/></g>'; }).join('');
    let kalabalik = ''; for (let i = 0; i < 16; i++) kalabalik += '<circle class="hy-izleyici ' + (i % 3 === 0 ? 'm' : i % 3 === 1 ? 't' : 'k') + '" cx="' + (452 + i * 19) + '" cy="' + (i % 2 ? 196 : 184) + '" r="7"/>';
    g.innerHTML = '<rect x="-60" y="-60" width="1320" height="560" class="hy-cim"/>' + agac
        + '<path d="' + d + '" class="hy-bordur-b"/><path d="' + d + '" class="hy-bordur-k"/>'
        + '<rect x="200" y="112" width="800" height="216" rx="40" class="hy-ic-cim"/>'
        + '<g class="hy-tribun"><rect x="430" y="160" width="340" height="70" rx="8" class="hy-tribun-z"/><rect x="430" y="160" width="340" height="14" rx="6" class="hy-tribun-cati"/><g class="hy-alkis">' + kalabalik + '</g></g>';
}
// 🎈 Balon: güneşli çizgi film gökyüzü, tombul bulutlar; gece yıldızlar + ay
function hyBalonSahne(svg) {
    let g = hyArka(svg, 'hy-gok');
    let bulut = function (x, y, k) { return '<g class="hy-bulut" transform="translate(' + x + ' ' + y + ') scale(' + k + ')"><circle cx="-26" cy="4" r="20"/><circle cx="0" cy="-8" r="28"/><circle cx="28" cy="4" r="20"/><rect x="-46" y="4" width="92" height="20" rx="10"/></g>'; };
    let yildiz = ''; for (let i = 0; i < 26; i++) yildiz += '<circle class="hy-yildiz" cx="' + ((i * 173) % 1180 + 10) + '" cy="' + ((i * 61) % 300 + 10) + '" r="' + (1.2 + (i % 3) * 0.8) + '"/>';
    g.innerHTML = '<defs><linearGradient id="hy-gok-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="hy-g1"/><stop offset="1" class="hy-g2"/></linearGradient></defs>'
        + '<rect x="-60" y="-60" width="1320" height="560" fill="url(#hy-gok-g)"/>' + yildiz
        + '<g class="hy-gunes"><circle cx="1080" cy="70" r="44"/><circle cx="1066" cy="62" r="4" class="hy-gunes-goz"/><circle cx="1094" cy="62" r="4" class="hy-gunes-goz"/><path d="M1064 80 q16 12 32 0" class="hy-gunes-agiz"/></g>'
        + '<g class="hy-ay"><circle cx="1080" cy="70" r="34"/><circle cx="1094" cy="62" r="30" class="hy-ay-oyuk"/></g>'
        + bulut(180, 110, 1) + bulut(520, 70, 0.8) + bulut(820, 160, 1.1) + bulut(330, 260, 0.9) + bulut(980, 300, 0.85)
        + '<path d="M-60 410 Q300 380 600 410 T1260 405 V500 H-60 Z" class="hy-tepe"/>';
}

function hyCss() {
    if (document.getElementById('hy-css')) return;
    let st = document.createElement('style'); st.id = 'hy-css';
    st.textContent = [
        // Hazine
        '#km-oyun-panel-hazine.hy-a{background:#3fa7d6}#km-oyun-panel-hazine.hy-a.hy-gece{background:#0b1a33}',
        '#km-oyun-svg-hazine.hy-a .km-grid,#km-oyun-svg-hazine.hy-a .km-compass{display:none}',
        '#km-oyun-svg-hazine.hy-a .km-map-route{stroke:#fff;stroke-dasharray:10 9;opacity:.9}#km-oyun-svg-hazine.hy-a .km-map-route-glow{stroke:#0e7490;opacity:.35}',
        '.hy-d1{stop-color:#6cc9ec}.hy-d2{stop-color:#2b8fc4}.hy-gece .hy-d1{stop-color:#1d3557}.hy-gece .hy-d2{stop-color:#070f22}',
        '.hy-kum{fill:#f6dc9a;stroke:#d4a957;stroke-width:3}.hy-sig{fill:#a5e3f5;opacity:.75}.hy-gece .hy-kum{fill:#8a7a52;stroke:#5c4f30}.hy-gece .hy-sig{fill:#24456e}',
        '.hy-govde{fill:none;stroke:#8b5a2b;stroke-width:5;stroke-linecap:round}.hy-yaprak{fill:none;stroke:#2f9e44;stroke-width:6;stroke-linecap:round}.hy-gece .hy-yaprak{stroke:#1f5c33}',
        '.hy-dlg{fill:none;stroke:#e0f7ff;stroke-width:2.5;stroke-linecap:round;opacity:.55;animation:hyDlg 3.2s ease-in-out infinite}@keyframes hyDlg{50%{transform:translateX(10px);opacity:.25}}.hy-gece .hy-dlg{stroke:#5b7db0}',
        '.hy-ay{display:none}.hy-gece .hy-ay{display:block}.hy-ay circle{fill:#fca5a5}#hy-deniz .hy-ay-oyuk{fill:#0b1a33}',
        '.hy-gece #km-oyun-hazine-dekor{opacity:.55}',
        // Pist
        '#km-oyun-panel-pist.hy-a{background:#6fbf5f}#km-oyun-panel-pist.hy-a.hy-gece{background:#10241a}',
        '#km-oyun-svg-pist.hy-a .km-pist-asfalt{stroke:#4b5563}#km-oyun-svg-pist.hy-a .km-pist-asfalt-glow{display:none}#km-oyun-svg-pist.hy-a .km-pist-orta-cizgi{stroke:#fde68a;stroke-width:3}',
        '.hy-cim{fill:#7cc46a}.hy-ic-cim{fill:#8fd17c}.hy-gece .hy-cim{fill:#173524}.hy-gece .hy-ic-cim{fill:#1d4230}.hy-gece#km-oyun-svg-pist .km-pist-asfalt{stroke:#1f2937}',
        '.hy-bordur-b{fill:none;stroke:#fff;stroke-width:62;stroke-linejoin:round}.hy-bordur-k{fill:none;stroke:#e11d48;stroke-width:62;stroke-dasharray:22 22;stroke-linejoin:round}',
        '.hy-gece .hy-bordur-b{stroke:#94a3b8}.hy-gece .hy-bordur-k{stroke:#7f1d1d}',
        '.hy-agac{fill:#4ea33f}.hy-agac2{fill:#63b852}.hy-gece .hy-agac{fill:#123020}.hy-gece .hy-agac2{fill:#1a3d29}',
        '.hy-tribun-z{fill:#e7e1d3}.hy-tribun-cati{fill:#d23b2f}.hy-izleyici.m{fill:#3b82f6}.hy-izleyici.t{fill:#f59e0b}.hy-izleyici.k{fill:#ef4444}.hy-gece .hy-tribun-z{fill:#334155}',
        '.hy-alkis{animation:hyAlkis .6s ease-in-out infinite alternate}@keyframes hyAlkis{to{translate:0 -3px}}',
        '.hy-ruzgar{stroke:#facc15;stroke-width:4;stroke-dasharray:14 10;opacity:.9}',
        // Balon
        '#km-oyun-svg-balon.hy-a .km-gunes-balon,#km-oyun-panel-balon.hy-a #km-oyun-bulutlar-balon{display:none}',
        '#km-oyun-panel-balon.hy-a{background:#9bd8ff}#km-oyun-panel-balon.hy-a.hy-gece{background:#0b1430}',
        '.hy-g1{stop-color:#5ab8f5}.hy-g2{stop-color:#d8f1ff}.hy-gece .hy-g1{stop-color:#0b1430}.hy-gece .hy-g2{stop-color:#28305e}',
        '.hy-bulut{fill:#fff;opacity:.92}.hy-gece .hy-bulut{fill:#3b4475;opacity:.8}',
        '.hy-gunes circle{fill:#fde047}.hy-gunes .hy-gunes-goz{fill:#78350f}.hy-gunes-agiz{fill:none;stroke:#78350f;stroke-width:4;stroke-linecap:round}.hy-gece .hy-gunes{display:none}',
        '#hy-gok .hy-ay circle{fill:#fef3c7}#hy-gok .hy-ay-oyuk{fill:#0b1430}.hy-yildiz{fill:#fff;display:none}.hy-gece .hy-yildiz{display:block}',
        '.hy-tepe{fill:#86d16f}.hy-gece .hy-tepe{fill:#1c3a2a}',
        '.hy-bant circle{fill:#64748b}.hy-bant-alt{fill:#64748b}.hy-gece .hy-bant circle,.hy-gece .hy-bant-alt{fill:#334155}.hy-simsek{fill:#facc15;animation:hySimsek 2.2s steps(1) infinite}@keyframes hySimsek{0%,70%{opacity:0}72%,80%{opacity:1}82%{opacity:0}}',
        // ortak
        '.hy-tabela{font:900 15px "Baloo 2",system-ui,sans-serif;fill:#1d1a16}',
        '.hy-kapi.acil .hy-kaya:first-of-type{animation:hyAc1 1.4s ease forwards}.hy-kapi.acil .hy-kaya:nth-of-type(2){animation:hyAc2 1.4s ease forwards}',
        '@keyframes hyAc1{40%{translate:-14px 0}100%{translate:0 0}}@keyframes hyAc2{40%{translate:14px 0}100%{translate:0 0}}',
        '.hy-kapi.acil .hy-kol{animation:hyKol 1.6s ease forwards}@keyframes hyKol{30%,70%{rotate:-75deg}}.hy-kapi.acil .hy-ruzgar{animation:hyRz 1.4s ease}@keyframes hyRz{50%{stroke:#22c55e;stroke-width:8}}',
        '.hy-kapi.salla{animation:hySalla .45s ease 2}@keyframes hySalla{25%{translate:-4px 0}75%{translate:4px 0}}',
        '.hy-sallan{animation:hySal 1.6s ease-in-out infinite alternate}@keyframes hySal{to{rotate:-4deg;translate:0 -2px}}.hy-dalga{animation:hyDlg 1.2s ease-in-out infinite}',
        '.hy-yuvarlan{animation:hyYuv 2.4s linear infinite}@keyframes hyYuv{to{rotate:360deg}}.hy-alev{animation:hyAlev .3s ease-in-out infinite alternate}@keyframes hyAlev{to{opacity:.55}}',
        '.hy-duman{animation:hyDuman 1s ease-out infinite}@keyframes hyDuman{to{translate:-14px -8px;opacity:0}}.hy-kar{animation:hyKarY 1.4s linear infinite}@keyframes hyKarY{to{translate:0 10px;opacity:.2}}',
        '.hy-gece .hy-goz{fill:#ef4444}',
        '.hy-kov-et-z{fill:rgba(17,24,39,.78)}.hy-kov-et{font:800 11px "Nunito",system-ui,sans-serif;fill:#fde68a}',
        '.hy-hud-z{fill:#fffdf8;stroke:#1d1a16;stroke-width:2.5}.hy-hud-t{font:900 16px "Baloo 2",system-ui,sans-serif;fill:#1d1a16}.hy-gece .hy-hud-z{fill:rgba(70,16,28,.9);stroke:#fca5a5}.hy-gece .hy-hud-t{fill:#fee2e2}',
        '.hy-balon path{fill:#fffdf8;stroke:#1d1a16;stroke-width:2.5}.hy-balon text{font:800 16px "Nunito",system-ui,sans-serif;fill:#1d1a16}',
        '.hy-balon.kotu path{stroke:#dc2626;stroke-width:3}.hy-balon.iyi path{stroke:#16a34a;stroke-width:3}',
        '.hy-balon{transform-box:fill-box;transform-origin:50% 100%;animation:hyBalon .35s cubic-bezier(.2,1.6,.4,1) both}.hy-balon.git{animation:hyBalonGit .35s ease forwards}',
        '@keyframes hyBalon{from{scale:0;opacity:0}}@keyframes hyBalonGit{to{scale:.85;opacity:0}}',
        // 😈 gece: kendi sahnesi olan oyunlarda (Zirve/Roket/Ninja/Dağ) yolun üstüne, koşucuların altına koyu örtü
        '.hy-ortu{fill:#0b1027;opacity:.5;pointer-events:none}',
        '#hy-vinyet{position:absolute;inset:0;pointer-events:none;border-radius:inherit;box-shadow:inset 0 0 60px 18px rgba(220,38,38,.55);animation:hyVin 1.3s ease-in-out infinite;z-index:3}@keyframes hyVin{50%{opacity:.35}}',
        '@media (prefers-reduced-motion:reduce){.hy-dlg,.hy-sallan,.hy-dalga,.hy-yuvarlan,.hy-alev,.hy-duman,.hy-kar,.hy-alkis,.hy-simsek,#hy-vinyet{animation:none}}'
    ].join('\n');
    document.head.appendChild(st);
}
