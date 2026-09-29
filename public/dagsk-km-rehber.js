/* ================================================================================================
   REHBER ARAÇLARI — Karışık Sınıf (2026-09-28)
   Kullanıcı: "Ders İçerikleri Kütüphanesi, Malzeme Listesi, AI Video & Duruş Analizi'ni karışık sınıfa
   ekle; görüntü olarak daha iyi yap, bu şekilde çocuklar ya da antrenörler anlamaz."
     📚 Ders Kütüphanesi — resimli kartlar, "kim için / ne yapalım / ne kadar süre" filtreleri,
                            adım adım tahtada gösterme. Veri: /api/ders-icerikleri (mevcut D1 kütüphanesi).
     🧰 Malzeme          — çizimli malzeme kartları, sade açıklama, evde yapımı, hangi çalışmada kullanılır,
                            "salonda var mı?" kontrol listesi. İstasyonlar: DAGSK_TEKNIK.data.
     🎥 Video & Duruş    — 4 büyük seçim kartı + "3 adımda kullan" rehberi + "bu sayılar ne demek".
                            Asıl kamera ekranı (#icerik-video, onlarca id'ye bağlı) buraya TAŞINIR, çıkarken
                            yerine geri konur; gelişmiş araçlar (çizim, yakınlaştırma) varsayılan gizli.
   app.js genel fonksiyonlarını kullanır (esc, showToast, _kmAktifKonum, _dersleriCache, dersIcerik*).
   ================================================================================================ */

function kmRhCssYukle() {
    if (document.getElementById('km-rh-css')) return;
    let st = document.createElement('style');
    st.id = 'km-rh-css';
    st.textContent = `
.rh { display:flex; flex-direction:column; gap:14px; }
.rh-ust { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.rh-baslik { font-size:20px; font-weight:900; color:var(--text-primary); line-height:1.2; }
.rh-alt { font-size:13px; color:var(--text-secondary); line-height:1.45; max-width:62ch; }
.rh-soru { display:flex; flex-direction:column; gap:6px; }
.rh-soru > b { font-size:12px; font-weight:800; color:var(--text-secondary); letter-spacing:.04em; }
.rh-cipler { display:flex; gap:6px; flex-wrap:wrap; }
.rh-cipler button { min-height:40px; padding:0 14px; border-radius:999px; border:1.5px solid var(--border-color); background:var(--surface-1); color:var(--text-primary); font-weight:800; font-size:13px; cursor:pointer; }
.rh-cipler button.aktif { background:var(--accent); border-color:var(--accent); color:var(--text-on-accent-dark, #0b0f1c); }
.rh-ara { min-height:40px; padding:0 14px; border-radius:12px; border:1px solid var(--border-color); background:var(--surface-1); color:var(--text-primary); font-size:14px; width:100%; max-width:360px; box-sizing:border-box; }
.rh-btn { min-height:44px; padding:0 18px; border-radius:12px; border:1.5px solid var(--border-color); background:var(--surface-1); color:var(--text-primary); font-weight:800; font-size:14px; cursor:pointer; display:inline-flex; align-items:center; gap:8px; }
.rh-btn.buyuk { min-height:56px; font-size:16px; padding:0 22px; background:var(--accent); border-color:var(--accent); color:var(--text-on-accent-dark, #0b0f1c); }
.rh-btn.yesil { background:var(--status-success); border-color:var(--status-success); color:#fff; }
.rh-btn:disabled { opacity:.45; cursor:default; }
.rh-izgara { display:grid; grid-template-columns:repeat(auto-fill, minmax(210px, 1fr)); gap:12px; align-items:start; }
.rh-kart { display:flex; flex-direction:column; border-radius:16px; overflow:hidden; border:1px solid var(--border-color); background:var(--surface-1); cursor:pointer; text-align:left; padding:0; color:var(--text-primary); transition:transform .15s ease, border-color .15s ease; }
.rh-kart:hover { border-color:var(--accent); transform:translateY(-2px); }
.rh-kart:focus-visible { outline:3px solid var(--accent) !important; outline-offset:2px; }
.rh-resim { aspect-ratio:4 / 3; display:flex; align-items:center; justify-content:center; position:relative; }
.rh-resim svg { width:84%; height:84%; }
.rh-resim img { width:100%; height:100%; object-fit:contain; background:#fff; }
.rh-resim .rh-tip { position:absolute; top:8px; left:8px; padding:3px 10px; border-radius:999px; font-size:11px; font-weight:900; background:rgba(255,255,255,.88); color:#0b2545; }
.rh-kart-govde { padding:10px 12px 12px; display:flex; flex-direction:column; gap:6px; }
.rh-kart-govde b { font-size:14.5px; line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.rh-bilgi { display:flex; gap:6px; flex-wrap:wrap; align-items:center; font-size:11.5px; color:var(--text-secondary); font-weight:700; }
.rh-bilgi span { display:inline-flex; align-items:center; gap:3px; }
.rh-nokta { letter-spacing:1px; }
.rh-t-teknik { background:linear-gradient(160deg, #dbeafe, #bfdbfe); }
.rh-t-eglence { background:linear-gradient(160deg, #ffe4e6, #fed7aa); }
.rh-t-oyun { background:linear-gradient(160deg, #dcfce7, #bbf7d0); }
.rh-t-malzeme { background:linear-gradient(160deg, #fef3c7, #fde68a); }
.rh-t-video { background:linear-gradient(160deg, #e0e7ff, #c7d2fe); }
.rh-detay { display:grid; grid-template-columns:minmax(0, 380px) minmax(0, 1fr); gap:18px; align-items:start; }
.rh-detay .rh-resim { border-radius:18px; overflow:hidden; }
.rh-serit { display:flex; gap:8px; flex-wrap:wrap; }
.rh-serit > div { flex:1 1 120px; padding:10px 12px; border-radius:12px; background:var(--surface-2); display:flex; flex-direction:column; gap:2px; }
.rh-serit small { font-size:10.5px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--text-secondary); }
.rh-serit b { font-size:14px; color:var(--text-primary); }
.rh-adimlar { display:flex; flex-direction:column; gap:8px; }
.rh-adim { display:flex; gap:12px; align-items:flex-start; padding:12px 14px; border-radius:14px; background:var(--surface-1); border:1px solid var(--border-color); font-size:15px; line-height:1.45; color:var(--text-primary); }
.rh-adim i { flex-shrink:0; width:32px; height:32px; border-radius:50%; background:var(--accent); color:var(--text-on-accent-dark, #0b0f1c); font-style:normal; font-weight:900; display:flex; align-items:center; justify-content:center; font-size:15px; }
.rh-dikkat { padding:12px 14px; border-radius:14px; border:1.5px solid color-mix(in srgb, var(--status-warning) 60%, transparent); background:color-mix(in srgb, var(--status-warning) 10%, transparent); font-size:14px; line-height:1.45; color:var(--text-primary); }
.rh-dikkat ul { margin:6px 0 0 18px; padding:0; display:flex; flex-direction:column; gap:3px; }
.rh-sahne { border-radius:20px; border:1px solid var(--border-color); background:var(--surface-1); padding:24px; display:flex; flex-direction:column; align-items:center; gap:18px; text-align:center; min-height:320px; justify-content:center; }
.rh-sahne .no { font-size:14px; font-weight:900; color:var(--accent); letter-spacing:.1em; }
.rh-sahne .metin { font-size:clamp(20px, 3.2vw, 34px); font-weight:800; line-height:1.3; color:var(--text-primary); max-width:26ch; }
.rh-noktalar { display:flex; gap:6px; }
.rh-noktalar span { width:10px; height:10px; border-radius:50%; background:var(--border-color); }
.rh-noktalar span.aktif { background:var(--accent); width:26px; border-radius:6px; }
.rh-yildiz button { background:none; border:none; font-size:24px; cursor:pointer; padding:0 1px; color:var(--border-color); }
.rh-yildiz button.dolu { color:#f5b301; }
.rh-kontrol { display:flex; gap:6px; }
.rh-kontrol button { min-height:36px; padding:0 12px; border-radius:10px; border:1.5px solid var(--border-color); background:transparent; color:var(--text-secondary); font-weight:800; font-size:12.5px; cursor:pointer; }
.rh-kontrol button.var { border-color:var(--status-success); color:var(--status-success); background:color-mix(in srgb, var(--status-success) 12%, transparent); }
.rh-kontrol button.yok { border-color:var(--status-danger); color:var(--status-danger); background:color-mix(in srgb, var(--status-danger) 10%, transparent); }
.rh-ozet { padding:12px 14px; border-radius:14px; background:var(--surface-2); display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; font-size:14px; color:var(--text-primary); }
.rh-cip-kucuk { display:inline-flex; padding:4px 10px; border-radius:999px; border:1px solid var(--border-color); font-size:12px; font-weight:700; color:var(--text-primary); background:var(--surface-2); cursor:pointer; }
.rh-modlar { display:grid; grid-template-columns:repeat(auto-fill, minmax(230px, 1fr)); gap:12px; }
.rh-mod { display:flex; flex-direction:column; border-radius:18px; overflow:hidden; border:1.5px solid var(--border-color); background:var(--surface-1); cursor:pointer; text-align:left; padding:0; color:var(--text-primary); }
.rh-mod:hover { border-color:var(--accent); }
.rh-mod.aktif { border-color:var(--accent); box-shadow:0 0 0 2px var(--accent); }
.rh-mod .rh-resim { aspect-ratio:16 / 9; }
.rh-mod-govde { padding:12px 14px 14px; display:flex; flex-direction:column; gap:4px; }
.rh-mod-govde b { font-size:16px; }
.rh-mod-govde span { font-size:13px; color:var(--text-secondary); line-height:1.4; }
.rh-mod-govde em { font-style:normal; font-size:12px; font-weight:800; color:var(--accent); margin-top:4px; }
.rh-3adim { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:10px; }
.rh-3adim > div { border-radius:14px; background:var(--surface-2); padding:12px; display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; font-size:13.5px; line-height:1.4; color:var(--text-primary); }
.rh-3adim svg { width:100%; max-width:140px; height:auto; }
.rh-3adim i { font-style:normal; font-weight:900; color:var(--accent); font-size:12px; letter-spacing:.08em; }
.rh-olcu { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:10px; }
.rh-olcu > div { border-radius:14px; border:1px solid var(--border-color); background:var(--surface-1); padding:10px 12px; display:flex; gap:10px; align-items:center; font-size:13px; color:var(--text-primary); line-height:1.35; }
.rh-olcu svg { width:64px; height:48px; flex-shrink:0; }
.rh-olcu small { display:block; color:var(--text-secondary); font-size:11.5px; }
.rh-renkler { display:flex; gap:10px; flex-wrap:wrap; font-size:12.5px; color:var(--text-secondary); font-weight:700; }
.rh-renkler span::before { content:''; display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:5px; vertical-align:middle; background:var(--r); }
/* Taşınan kamera ekranı: kendi başlık + mod düğmeleri gizli (yukarıdaki kartlar onun yerine), gelişmiş araçlar isteğe bağlı */
#icerik-video.km-va-icinde { display:block !important; padding:0 !important; }
#icerik-video.km-va-icinde > .va-card:first-child { display:none; }
#icerik-video.km-va-icinde > div:has(> #va-mod-aipose-btn) { display:none !important; }
#icerik-video.km-va-icinde:not(.km-va-gelismis) .ai-draw-toolbar,
#icerik-video.km-va-icinde:not(.km-va-gelismis) .ai-zoom-bar,
#icerik-video.km-va-icinde:not(.km-va-gelismis) #ayna-hazir-acilar-baslik,
#icerik-video.km-va-icinde:not(.km-va-gelismis) #ayna-hazir-acilar { display:none !important; }
@media (max-width: 760px) { .rh-kart.acik { grid-column:1 / -1; } .rh-detay { grid-template-columns:1fr; } .rh-3adim { grid-template-columns:1fr; } .rh-3adim svg { max-width:180px; } .rh-izgara { grid-template-columns:repeat(2, minmax(0,1fr)); } .rh-kart-govde b { font-size:13.5px; } }
@media (prefers-reduced-motion: reduce) { .rh-kart { transition:none; } .rh-kart:hover { transform:none; } }
`;
    document.head.appendChild(st);
}

// ---------------------------------------------------------------- çizimler (tutarlı düz stil)
// Okçu yandan, hedefe (sağa) bakıyor. vurgu: ayak | yaykolu | dirsek | cene | goz | el | birakis
const RH_LACIVERT = '#143A5E', RH_TURUNCU = '#F26522';
function rhHedef(x, y, r) {
    return `<g transform="translate(${x},${y})"><circle r="${r}" fill="#fff" stroke="${RH_LACIVERT}" stroke-width="1.5"/><circle r="${r * 0.72}" fill="#2f8fe0"/><circle r="${r * 0.46}" fill="#e53939"/><circle r="${r * 0.22}" fill="#ffcc33"/></g>`;
}
function rhOkcu(vurgu, secenek) {
    secenek = secenek || {};
    let cekili = vurgu !== 'tutus' && vurgu !== 'durus-hazir';
    let L = RH_LACIVERT, T = RH_TURUNCU;
    let govde = `<line x1="8" y1="84" x2="112" y2="84" stroke="#9fb3c8" stroke-width="2"/>
        <path d="M54 56 L46 84 M54 56 L62 84" stroke="${L}" stroke-width="5" stroke-linecap="round"/>
        <path d="M54 58 L54 30" stroke="${L}" stroke-width="6" stroke-linecap="round"/>
        <circle cx="54" cy="21" r="7.5" fill="${L}"/>
        <path d="M54 32 L82 32" stroke="${L}" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M80 8 Q97 32 80 56" fill="none" stroke="#8b5a2b" stroke-width="3.5" stroke-linecap="round"/>`;
    let ip, kol, ok;
    if (vurgu === 'birakis') {
        ip = `<path d="M80 8 L80 56" stroke="#475569" stroke-width="1.2"/>`;
        kol = `<path d="M54 32 L40 30 L46 23" stroke="${L}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
        ok = `<g><path d="M92 30 L112 30" stroke="${L}" stroke-width="2"/><path d="M112 30 l-5 -3 v6 z" fill="${L}"/><path d="M84 24 h8 M82 30 h6 M84 36 h8" stroke="${T}" stroke-width="1.6" stroke-linecap="round"/></g>`;
    } else if (cekili) {
        ip = `<path d="M80 8 L60 26 L80 56" fill="none" stroke="#475569" stroke-width="1.2"/>`;
        kol = `<path d="M54 32 L40 30 L60 26" stroke="${L}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
        ok = `<path d="M60 26 L99 30" stroke="${L}" stroke-width="2"/><path d="M99 30 l-5 -3 v6 z" fill="${L}"/>`;
    } else {
        ip = `<path d="M80 8 L80 56" stroke="#475569" stroke-width="1.2"/>`;
        kol = `<path d="M54 34 L66 42 L79 33" stroke="${L}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
        ok = `<path d="M79 33 L100 33" stroke="${L}" stroke-width="2"/><path d="M100 33 l-5 -3 v6 z" fill="${L}"/>`;
    }
    let v = '';
    let halka = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${T}" stroke-width="2.5" stroke-dasharray="4 3"/>`;
    if (vurgu === 'ayak' || vurgu === 'durus-hazir') v = `<path d="M40 86 H68" stroke="${T}" stroke-width="3" stroke-linecap="round"/>` + halka(54, 80, 13);
    if (vurgu === 'yaykolu') v = `<path d="M54 27 L84 27" stroke="${T}" stroke-width="2.5" stroke-dasharray="4 3"/><text x="68" y="23" font-size="8" font-weight="900" fill="${T}" text-anchor="middle">düz</text>`;
    if (vurgu === 'dirsek') v = halka(40, 30, 8) + `<path d="M36 30 L100 30" stroke="${T}" stroke-width="1.4" stroke-dasharray="3 3"/>`;
    if (vurgu === 'cene') v = halka(59, 25, 7);
    if (vurgu === 'omuz') v = `<path d="M44 32 H64" stroke="${T}" stroke-width="3" stroke-linecap="round"/>` + halka(54, 32, 10);
    if (vurgu === 'goz') v = `<path d="M58 19 L106 30" stroke="${T}" stroke-width="1.8" stroke-dasharray="4 3"/>` + halka(57, 19, 5);
    if (vurgu === 'el' || vurgu === 'tutus') v = halka(80, 33, 8);
    let hedef = secenek.hedefYok ? '' : rhHedef(108, 30, 9);
    return `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${hedef}${govde}${ip}${kol}${ok}${v}</svg>`;
}
function rhIsinma() {
    let L = RH_LACIVERT, T = RH_TURUNCU;
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><line x1="8" y1="84" x2="112" y2="84" stroke="#9fb3c8" stroke-width="2"/>
        <circle cx="60" cy="20" r="7.5" fill="${L}"/><path d="M60 29 L60 56 M60 56 L50 84 M60 56 L70 84" stroke="${L}" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M60 33 L44 10 M60 33 L76 10" stroke="${L}" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M34 22 q-6 8 0 16 M86 22 q6 8 0 16" stroke="${T}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M24 30 q-6 8 0 16 M96 30 q6 8 0 16" stroke="${T}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/></svg>`;
}
function rhOyun() {
    return `<svg viewBox="0 0 120 90" aria-hidden="true">${rhHedef(60, 50, 26)}
        <g><ellipse cx="22" cy="24" rx="10" ry="12" fill="#e53939"/><path d="M22 36 q-3 10 2 22" stroke="#475569" stroke-width="1" fill="none"/></g>
        <g><ellipse cx="98" cy="20" rx="10" ry="12" fill="#2f8fe0"/><path d="M98 32 q3 10 -2 22" stroke="#475569" stroke-width="1" fill="none"/></g>
        <g><ellipse cx="96" cy="62" rx="8" ry="10" fill="#22c55e"/><path d="M96 72 q-2 6 1 12" stroke="#475569" stroke-width="1" fill="none"/></g>
        <path d="M8 76 L50 52" stroke="${RH_LACIVERT}" stroke-width="2.2"/><path d="M50 52 l-6 0 l3 -5 z" fill="${RH_LACIVERT}"/></svg>`;
}
function rhEglence() {
    return `<svg viewBox="0 0 120 90" aria-hidden="true">${rhHedef(60, 48, 24)}
        <path d="M60 10 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1 z" fill="#ffcc33" stroke="#b88a0f" stroke-width="1"/>
        <g fill="#F26522"><rect x="16" y="16" width="5" height="5" transform="rotate(20 18 18)"/><rect x="98" y="26" width="5" height="5" transform="rotate(-25 100 28)"/><circle cx="24" cy="66" r="3"/><circle cx="100" cy="70" r="3"/></g>
        <g fill="#2f8fe0"><rect x="30" y="34" width="4" height="4" transform="rotate(35 32 36)"/><circle cx="92" cy="12" r="2.5"/></g></svg>`;
}
function rhDersResmi(d) {
    let m = ((d.baslik || '') + ' ' + (d.aciklama || '')).toLocaleLowerCase('tr-TR');
    if (/ısınma|isinma|esne|germe|kuvvet|mobilite/.test(m)) return rhIsinma();
    if (/salıver|saliver|bırak|birak|release|takip|follow/.test(m)) return rhOkcu('birakis');
    if (/çapa|capa|anchor|çene|cene|referans/.test(m)) return rhOkcu('cene');
    if (/nişan|nisan|sight|göz|goz|odak/.test(m)) return rhOkcu('goz');
    if (/çekiş|cekis|sırt|sirt|dirsek/.test(m)) return rhOkcu('dirsek');
    if (/nock|yerleştir|yerlestir|tutuş|tutus|kabza|parmak/.test(m)) return rhOkcu('tutus');
    if (/yay kolu|yaykolu|omuz/.test(m)) return rhOkcu('yaykolu');
    if (/duruş|durus|ayak|kurulum|denge/.test(m)) return rhOkcu('ayak');
    if (d.tip === 'oyun' || /oyun|balon|yarış|yaris|takım|takim|bingo/.test(m)) return rhOyun();
    if (d.tip === 'eglence') return rhEglence();
    return rhOkcu('goz');
}

// ================================================================================================
// 📚 DERS KÜTÜPHANESİ
// ================================================================================================
const RH_TIP = { teknik: { ad: 'Teknik', ikon: '🎯' }, eglence: { ad: 'Eğlenceli', ikon: '🎉' }, oyun: { ad: 'Oyun', ikon: '🧩' } };
const RH_SEVIYE = { baslangic: { ad: 'Kolay', nokta: '●○○' }, orta: { ad: 'Orta', nokta: '●●○' }, ileri: { ad: 'Zor', nokta: '●●●' } };
const RH_GRUP = { minikler: '🌱 Minikler', kucukler: '🟢 Küçükler', yildizlar: '⭐ Yıldızlar', buyukler: '🔵 Büyükler' };
let _kmDr = { grup: 'hepsi', tip: 'hepsi', sure: 'hepsi', ara: '', secili: null, sahne: null, yukleniyor: false, hata: false };
function kmDrYukle(sonra) {
    if (_kmDr.yukleniyor) return;
    _kmDr.yukleniyor = true;
    fetch('/api/ders-icerikleri').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(d => {
        _dersleriCache = (d.dersler || []).map(r => {
            let gruplar = [], adimlar = [], dikkat = [];
            try { gruplar = JSON.parse(r.gruplar_json || '[]'); } catch (e) {}
            try { adimlar = JSON.parse(r.adimlar_json || '[]'); } catch (e) {}
            try { dikkat = JSON.parse(r.dikkat_json || '[]'); } catch (e) {}
            return { id: r.id, tip: r.tip, baslik: r.baslik, seviye: r.seviye, gruplar, sure: r.sure, malzeme: r.malzeme, aciklama: r.aciklama, adimlar, dikkat, cizim: r.cizim, olusturan: r.olusturan,
                baglantiSlotId: r.baglantiSlotId || null, kullanimSayisi: r.kullanimSayisi || 0, sonKullanim: r.sonKullanim || null, ortalamaPuan: r.ortalamaPuan || null, degerlendirmeSayisi: r.degerlendirmeSayisi || 0 };
        });
        try { _dersleriFetchT = Date.now(); } catch (e) {}
        _kmDr.hata = false;
    }).catch(() => { _kmDr.hata = true; }).then(() => { _kmDr.yukleniyor = false; if (sonra) sonra(); });
}
function kmDrListe() {
    let l = (typeof _dersleriCache !== 'undefined' && _dersleriCache) || [];
    let ara = _kmDr.ara ? _kmDr.ara.toLocaleLowerCase('tr-TR') : '';
    return l.filter(d => {
        if (_kmDr.grup !== 'hepsi' && !(d.gruplar || []).includes(_kmDr.grup)) return false;
        if (_kmDr.tip !== 'hepsi' && d.tip !== _kmDr.tip) return false;
        let s = Number(d.sure) || 0;
        if (_kmDr.sure === 'kisa' && !(s && s <= 15)) return false;
        if (_kmDr.sure === 'orta' && !(s > 15 && s <= 30)) return false;
        if (_kmDr.sure === 'uzun' && !(s > 30)) return false;
        if (ara && !((d.baslik || '') + ' ' + (d.aciklama || '')).toLocaleLowerCase('tr-TR').includes(ara)) return false;
        return true;
    });
}
function kmDerslerCiz() {
    kmRhCssYukle();
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    let cache = typeof _dersleriCache !== 'undefined' ? _dersleriCache : null;
    if (cache === null && !_kmDr.hata) { ic.innerHTML = '<div class="rh"><div class="rh-baslik">📚 Ders Kütüphanesi</div><div class="rh-alt">Dersler yükleniyor…</div></div>'; kmDrYukle(kmDerslerCiz); return; }
    if (cache === null) { ic.innerHTML = `<div class="rh"><div class="rh-baslik">📚 Ders Kütüphanesi</div><div class="rh-alt">Dersler yüklenemedi — bağlantıyı kontrol et.</div><div><button class="rh-btn" onclick="_kmDr.hata=false; kmDerslerCiz()">Tekrar dene</button></div></div>`; return; }
    if (_kmDr.sahne) { ic.innerHTML = kmDrSahneHTML(); return; }
    if (_kmDr.secili) { let d = cache.find(x => x.id === _kmDr.secili); if (d) { ic.innerHTML = kmDrDetayHTML(d); return; } _kmDr.secili = null; }
    let cip = (alan, deger, ad) => `<button class="${_kmDr[alan] === deger ? 'aktif' : ''}" onclick="kmDrFiltre('${alan}','${deger}')">${ad}</button>`;
    let liste = kmDrListe();
    let kartlar = liste.map(d => {
        let t = RH_TIP[d.tip] || RH_TIP.teknik, sv = RH_SEVIYE[d.seviye] || RH_SEVIYE.baslangic;
        return `<button class="rh-kart" onclick="kmDrAc('${d.id}')" aria-label="${esc(d.baslik)}">
            <div class="rh-resim rh-t-${d.tip || 'teknik'}">${d.cizim ? `<img src="${d.cizim}" alt="">` : rhDersResmi(d)}<span class="rh-tip">${t.ikon} ${t.ad}</span></div>
            <div class="rh-kart-govde"><b>${esc(d.baslik)}</b>
                <div class="rh-bilgi">${d.sure ? `<span>⏱ ${d.sure} dk</span>` : ''}<span><span class="rh-nokta">${sv.nokta}</span> ${sv.ad}</span>${d.ortalamaPuan ? `<span>★ ${(Math.round(d.ortalamaPuan * 10) / 10)}</span>` : ''}${d.kullanimSayisi ? `<span>✓ ${d.kullanimSayisi} kez</span>` : ''}</div></div></button>`;
    }).join('');
    ic.innerHTML = `<div class="rh">
        <div class="rh-ust"><div><div class="rh-baslik">📚 Ders Kütüphanesi</div><div class="rh-alt">Bugün ne çalışalım? Bir karta dokun — adımlar resimli ve sırayla açılır. İstersen tahtada adım adım gösterebilirsin.</div></div>
            <button class="rh-btn buyuk" onclick="kmDrRastgele()" ${liste.length ? '' : 'disabled'}>🎲 Bana bir ders seç</button></div>
        <div class="rh-soru"><b>KİM İÇİN?</b><div class="rh-cipler">${cip('grup', 'hepsi', 'Herkes')}${Object.keys(RH_GRUP).map(g => cip('grup', g, RH_GRUP[g])).join('')}</div></div>
        <div class="rh-soru"><b>NE YAPALIM?</b><div class="rh-cipler">${cip('tip', 'hepsi', 'Hepsi')}${Object.keys(RH_TIP).map(t => cip('tip', t, RH_TIP[t].ikon + ' ' + RH_TIP[t].ad)).join('')}</div></div>
        <div class="rh-soru"><b>NE KADAR SÜREMİZ VAR?</b><div class="rh-cipler">${cip('sure', 'hepsi', 'Fark etmez')}${cip('sure', 'kisa', '⏱ 15 dk ve altı')}${cip('sure', 'orta', '⏱ 15–30 dk')}${cip('sure', 'uzun', '⏱ 30 dk+')}</div></div>
        <input class="rh-ara" type="search" placeholder="🔍 Ders ara (örn. çapa, balon)" value="${esc(_kmDr.ara)}" oninput="_kmDr.ara=this.value; kmDrIzgaraYenile()">
        <div class="rh-alt" id="rh-dr-sayi">${liste.length} ders</div>
        <div class="rh-izgara" id="rh-dr-izgara">${kartlar || '<div class="rh-alt">Bu seçimde ders yok — filtreleri gevşet.</div>'}</div>
    </div>`;
}
function kmDrIzgaraYenile() {
    // Arama kutusu odağını kaybetmesin diye yalnızca ızgarayı yeniden çiz.
    let ara = document.activeElement && document.activeElement.classList.contains('rh-ara') ? _kmDr.ara : null;
    kmDerslerCiz();
    if (ara !== null) { let el = document.querySelector('#km-icerik .rh-ara'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
}
function kmDrFiltre(alan, deger) { _kmDr[alan] = deger; kmDerslerCiz(); }
function kmDrAc(id) { _kmDr.secili = id; _kmDr.sahne = null; kmDerslerCiz(); let ic = document.getElementById('km-icerik'); if (ic) ic.scrollIntoView({ block: 'start' }); }
function kmDrKapat() { _kmDr.secili = null; _kmDr.sahne = null; kmDerslerCiz(); }
function kmDrRastgele() { let l = kmDrListe(); if (!l.length) return; kmDrAc(l[Math.floor(Math.random() * l.length)].id); showToast('🎲 Bugünün dersi hazır!', 'success'); }
function kmDrDetayHTML(d) {
    let t = RH_TIP[d.tip] || RH_TIP.teknik, sv = RH_SEVIYE[d.seviye] || RH_SEVIYE.baslangic;
    let yildiz = Math.round(d.ortalamaPuan || 0);
    let adimlar = (d.adimlar || []).map((a, i) => `<div class="rh-adim"><i>${i + 1}</i><div>${esc(a)}</div></div>`).join('');
    return `<div class="rh">
        <div><button class="rh-btn" onclick="kmDrKapat()">← Tüm dersler</button></div>
        <div class="rh-detay">
            <div class="rh-resim rh-t-${d.tip || 'teknik'}">${d.cizim ? `<img src="${d.cizim}" alt="Eğitmen çizimi">` : rhDersResmi(d)}<span class="rh-tip">${t.ikon} ${t.ad}</span></div>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <div class="rh-baslik">${esc(d.baslik)}</div>
                ${d.aciklama ? `<div class="rh-alt" style="font-size:14.5px">${esc(d.aciklama)}</div>` : ''}
                <div class="rh-serit">
                    <div><small>Süre</small><b>⏱ ${d.sure ? d.sure + ' dk' : '—'}</b></div>
                    <div><small>Zorluk</small><b><span class="rh-nokta">${sv.nokta}</span> ${sv.ad}</b></div>
                    <div><small>Kim için</small><b>${(d.gruplar || []).map(g => (RH_GRUP[g] || g).split(' ').slice(1).join(' ') || g).join(', ') || '—'}</b></div>
                    <div><small>Malzeme</small><b>🧰 ${esc(d.malzeme || 'Yok')}</b></div>
                </div>
                ${(d.adimlar || []).length ? `<div><button class="rh-btn buyuk" onclick="kmDrSahneAc(0)">▶ Adım adım göster (tahta modu)</button></div>` : ''}
            </div>
        </div>
        ${adimlar ? `<div class="rh-soru"><b>NASIL YAPILIR?</b><div class="rh-adimlar">${adimlar}</div></div>` : ''}
        ${(d.dikkat || []).length ? `<div class="rh-dikkat"><b>⚠️ Dikkat!</b><ul>${d.dikkat.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
        <div class="rh-ozet">
            <div class="rh-yildiz" aria-label="Dersi puanla">${[1, 2, 3, 4, 5].map(n => `<button class="${n <= yildiz ? 'dolu' : ''}" onclick="kmDrPuanla('${d.id}', ${n})" aria-label="${n} yıldız">★</button>`).join('')} <span class="rh-alt">${d.ortalamaPuan ? (Math.round(d.ortalamaPuan * 10) / 10) + ' (' + d.degerlendirmeSayisi + ' oy)' : 'Henüz puan yok'}</span></div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;"><button class="rh-btn yesil" onclick="kmDrIsledik('${d.id}')">✅ Bugün işledik</button><button class="rh-btn" onclick="dersIcerikYazdir('${d.id}')">🖨️ Yazdır</button></div>
        </div>
        <div class="rh-alt">📊 ${d.kullanimSayisi || 0} kez işlendi${d.sonKullanim ? ' · son: ' + esc(d.sonKullanim) : ''}. Ders eklemek/düzenlemek için ana menüdeki Ders İçerikleri sekmesi kullanılır.</div>
    </div>`;
}
function kmDrSahneAc(i) { _kmDr.sahne = { i }; kmDerslerCiz(); }
function kmDrSahneGit(fark) {
    let d = (_dersleriCache || []).find(x => x.id === _kmDr.secili); if (!d || !_kmDr.sahne) return;
    let n = (d.adimlar || []).length, i = _kmDr.sahne.i + fark;
    if (i < 0) return;
    if (i >= n) { _kmDr.sahne = null; kmDerslerCiz(); showToast('👏 Tüm adımlar tamam!', 'success'); return; }
    _kmDr.sahne.i = i; kmDerslerCiz();
}
function kmDrSahneHTML() {
    let d = (_dersleriCache || []).find(x => x.id === _kmDr.secili); if (!d) { _kmDr.sahne = null; return ''; }
    let n = d.adimlar.length, i = _kmDr.sahne.i;
    return `<div class="rh">
        <div class="rh-ust"><button class="rh-btn" onclick="_kmDr.sahne=null; kmDerslerCiz()">✕ Tahta modundan çık</button><b style="color:var(--text-primary)">${esc(d.baslik)}</b></div>
        <div class="rh-sahne">
            <div style="width:min(260px, 70%)" class="rh-resim rh-t-${d.tip || 'teknik'}" aria-hidden="true">${rhDersResmi(d)}</div>
            <div class="no">ADIM ${i + 1} / ${n}</div>
            <div class="metin">${esc(d.adimlar[i])}</div>
            <div class="rh-noktalar">${d.adimlar.map((_, j) => `<span class="${j === i ? 'aktif' : ''}"></span>`).join('')}</div>
            <div style="display:flex; gap:10px;"><button class="rh-btn" onclick="kmDrSahneGit(-1)" ${i === 0 ? 'disabled' : ''}>◀ Geri</button><button class="rh-btn buyuk" onclick="kmDrSahneGit(1)">${i + 1 === n ? '✓ Bitti' : 'Sonraki ▶'}</button></div>
        </div></div>`;
}
function kmDrIsledik(id) { try { dersIcerikIsledim(id); } catch (e) {} setTimeout(() => kmDrYukle(kmDerslerCiz), 900); }
function kmDrPuanla(id, n) { try { dersIcerikDegerlendir(id, n); } catch (e) {} setTimeout(() => kmDrYukle(kmDerslerCiz), 900); }

// ================================================================================================
// 🧰 MALZEME
// ================================================================================================
const RH_MALZEME = [
    { id: 'lastik', ad: 'Direnç Lastiği', kisa: 'Yay olmadan atış hareketini çalıştırır.', neden: 'Yay çekmek yorar; lastikle aynı hareketi çok kez tekrar edip sırt kaslarını ve doğru çekişi öğreniriz.', diy: ['Eski bir bisiklet iç lastiğini kes', 'Ya da kalın pilates bandı kullan', '2–3 farklı sertlik ideal'], anahtar: /direnç|lastiğ|lastik|bant/i,
      svg: `<svg viewBox="0 0 120 90"><path d="M22 46 C42 20 78 20 98 46" fill="none" stroke="#F26522" stroke-width="9" stroke-linecap="round"/><circle cx="20" cy="50" r="9" fill="#143A5E"/><circle cx="100" cy="50" r="9" fill="#143A5E"/><path d="M34 62 l-6 8 M86 62 l6 8" stroke="#143A5E" stroke-width="4" stroke-linecap="round"/><path d="M50 72 h20" stroke="#9fb3c8" stroke-width="2" stroke-dasharray="3 3"/></svg>` },
    { id: 'balya', ad: 'Boş Balya / Sünger Hedef', kisa: 'Çok yakından, gözler kapalı atış yapmak için.', neden: 'Hedefe bakmadan, sadece hareketin kendisine odaklanırız. Puan derdi olmadığı için rahat öğreniriz.', diy: ['Saman balyası', 'Sıkıca sarılmış streç film', 'Üst üste yapıştırılmış karton + sünger'], anahtar: /balya|sünger/i,
      svg: `<svg viewBox="0 0 120 90"><rect x="30" y="22" width="62" height="56" rx="6" fill="#e9c46a" stroke="#b88a0f" stroke-width="2"/><path d="M34 36 h54 M34 50 h54 M34 64 h54" stroke="#b88a0f" stroke-width="1.5"/><path d="M40 28 l6 4 M60 42 l7 3 M50 58 l6 4 M74 30 l6 3 M78 66 l6 3" stroke="#b88a0f" stroke-width="1.2"/><path d="M4 50 L60 50" stroke="#143A5E" stroke-width="2.5"/><path d="M8 44 l6 6 -6 6" fill="none" stroke="#F26522" stroke-width="2"/></svg>` },
    { id: 'ayna', ad: 'Boy Aynası', kisa: 'Kendi duruşunu görüp düzeltmek için.', neden: 'Omuzlar düz mü, ayaklar doğru mu? Aynada görünce çocuk hatayı kendisi fark eder.', diy: ['Salondaki duvar aynası', 'Yoksa telefonu tripoda koyup ön kamerayla bak'], anahtar: /ayna/i,
      svg: `<svg viewBox="0 0 120 90"><rect x="34" y="6" width="52" height="80" rx="6" fill="#e0f2fe" stroke="#143A5E" stroke-width="3"/><path d="M42 16 L52 12 M42 26 L60 16" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="32" r="6" fill="#143A5E"/><path d="M60 38 V62 M60 62 L54 80 M60 62 L66 80 M60 44 H74 M60 44 H48" stroke="#143A5E" stroke-width="3.5" stroke-linecap="round"/></svg>` },
    { id: 'denge', ad: 'Denge Tahtası', kisa: 'Bacakları ve dengeyi güçlendirir.', neden: 'Sallanmadan durabilen okçu, atış anında da sabit kalır. Oyun gibi de oynanır.', diy: ['Bir tahta parçası', 'Altına kalın PVC boru ya da yarım silindir köpük', 'Önce duvar kenarında dene'], anahtar: /denge/i,
      svg: `<svg viewBox="0 0 120 90"><line x1="8" y1="84" x2="112" y2="84" stroke="#9fb3c8" stroke-width="2"/><circle cx="60" cy="74" r="10" fill="#94a3b8"/><rect x="18" y="60" width="84" height="6" rx="3" fill="#8b5a2b" transform="rotate(-4 60 63)"/><circle cx="60" cy="14" r="6" fill="#143A5E"/><path d="M60 20 V42 M60 42 L50 60 M60 42 L70 58 M60 28 L40 26 M60 28 L80 24" stroke="#143A5E" stroke-width="3.5" stroke-linecap="round"/></svg>` },
    { id: 'formaster', ad: 'Formaster', kisa: 'Ok bırakılırken kolun erken gevşemesini engeller.', neden: 'Bilek ile dirsek arasına takılan kayış; çocuk ipi erken bırakırsa kayış gerilir ve fark eder.', diy: ['Kol kayışı (eski saat kayışı)', 'Paraşüt ipi', 'Küçük bir karabina'], anahtar: /formaster/i,
      svg: `<svg viewBox="0 0 120 90"><path d="M10 60 L70 40" stroke="#143A5E" stroke-width="12" stroke-linecap="round"/><rect x="58" y="30" width="12" height="20" rx="3" fill="#F26522" transform="rotate(-18 64 40)"/><rect x="18" y="50" width="12" height="20" rx="3" fill="#F26522" transform="rotate(-18 24 60)"/><path d="M26 56 Q46 76 66 44" fill="none" stroke="#0f766e" stroke-width="2.5"/><circle cx="46" cy="66" r="4" fill="none" stroke="#475569" stroke-width="2"/><circle cx="88" cy="36" r="10" fill="#143A5E"/></svg>` },
    { id: 'bant', ad: 'Yer Bandı & Nişan Kağıdı', kisa: 'Ayağın nereye basacağını ve nişan noktasını gösterir.', neden: 'Her atışta ayak aynı yere basarsa atışlar da benzer olur. Tek nokta, gözü tek yere odaklar.', diy: ['Renkli maskeleme bandı', 'A4 kağıda basılmış turuncu bir nokta'], anahtar: /yer bandı|nişan kağıd|tek nokta|nokta/i,
      svg: `<svg viewBox="0 0 120 90"><path d="M6 76 H80" stroke="#F26522" stroke-width="6" stroke-linecap="round"/><ellipse cx="30" cy="70" rx="9" ry="4" fill="#143A5E"/><ellipse cx="54" cy="70" rx="9" ry="4" fill="#143A5E"/><circle cx="96" cy="72" r="12" fill="#fde68a" stroke="#b88a0f" stroke-width="3"/><circle cx="96" cy="72" r="5" fill="#fff"/><rect x="72" y="10" width="36" height="46" rx="3" fill="#fff" stroke="#143A5E" stroke-width="2"/><circle cx="90" cy="33" r="6" fill="#F26522"/></svg>` },
    { id: 'parmak', ad: 'Parmak Askısı', kisa: 'Yayı sıkmadan tutmayı öğretir.', neden: 'Yay eli gevşek kalırsa yay dönmez, ok daha düz gider. Askı yayın düşmesini engeller.', diy: ['İnce bir ip ya da ayakkabı bağcığı', 'Başparmak ve işaret parmağına halka yap'], anahtar: /parmak/i,
      svg: `<svg viewBox="0 0 120 90"><path d="M60 6 Q84 45 60 84" fill="none" stroke="#8b5a2b" stroke-width="6" stroke-linecap="round"/><path d="M40 52 C40 38 70 36 76 46 C80 54 70 60 60 58" fill="#fcd9b6" stroke="#b08968" stroke-width="2"/><path d="M50 46 C60 30 86 34 82 52 C78 64 58 60 56 54" fill="none" stroke="#F26522" stroke-width="3"/></svg>` },
    { id: 'metronom', ad: 'Kronometre / Metronom', kisa: 'Atışı aynı ritimde yapmayı sağlar.', neden: '"Çek – dur – bırak" her seferinde aynı sürede olursa atışlar tutarlı olur. Telefon yeterli.', diy: ['Telefonun kronometresi', 'Ücretsiz bir metronom uygulaması', 'Karışık Sınıf → Ritim & Tıkır aracı'], anahtar: /kronometre|metronom/i,
      svg: `<svg viewBox="0 0 120 90"><rect x="38" y="6" width="44" height="78" rx="8" fill="#143A5E"/><rect x="43" y="14" width="34" height="58" rx="3" fill="#e0e7ff"/><circle cx="60" cy="42" r="14" fill="#fff" stroke="#F26522" stroke-width="3"/><path d="M60 42 V32 M60 42 L68 46" stroke="#143A5E" stroke-width="2.5" stroke-linecap="round"/><path d="M90 30 q8 12 0 24 M98 24 q12 18 0 36" fill="none" stroke="#F26522" stroke-width="2.5" stroke-linecap="round"/></svg>` }
];
let _kmMz = { secili: null, istasyon: null };
function kmMzAnahtar() { return 'dag_km_malzeme_' + (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum ? _kmAktifKonum : 'varsayilan'); }
function kmMzDurum() { try { return JSON.parse(localStorage.getItem(kmMzAnahtar()) || '{}') || {}; } catch (e) { return {}; } }
function kmMzIstasyonlar(m) { let d = (window.DAGSK_TEKNIK && DAGSK_TEKNIK.data) || []; return d.filter(s => (s.malzeme || []).some(x => m.anahtar.test(x))); }
function kmMalzemeCiz() {
    // İstasyon listesi Teknik Çalışma modülünden (artık gerektiğinde yükleniyor) — yüklenince yeniden çiz.
    if (!window.DAGSK_TEKNIK && typeof dagskEkYukle === 'function') dagskEkYukle('dagsk-teknik-calisma.js').then(function () { if (_kmAktifSekme === 'malzeme') kmMalzemeCiz(); }).catch(function () {});
    kmRhCssYukle();
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    if (_kmMz.istasyon !== null) { ic.innerHTML = kmMzIstasyonHTML(); return; }
    let durum = kmMzDurum(), eksik = RH_MALZEME.filter(m => durum[m.id] === 'yok'), bilinmeyen = RH_MALZEME.filter(m => !durum[m.id]);
    let kartlar = RH_MALZEME.map(m => {
        let ist = kmMzIstasyonlar(m), acik = _kmMz.secili === m.id, st = durum[m.id];
        return `<div class="rh-kart${acik ? ' acik' : ''}" style="cursor:default">
            <button class="rh-resim rh-t-malzeme" style="border:none; padding:0; cursor:pointer" onclick="kmMzAc('${m.id}')" aria-label="${m.ad} ayrıntıları">${m.svg}</button>
            <div class="rh-kart-govde"><b>${m.ad}</b><div class="rh-alt">${m.kisa}</div>
                ${acik ? `<div class="rh-alt" style="color:var(--text-primary)">💡 ${m.neden}</div>
                    <div class="rh-soru"><b>EVDE NASIL YAPILIR?</b><div class="rh-adimlar">${m.diy.map((x, i) => `<div class="rh-adim" style="font-size:13px; padding:8px 10px"><i style="width:24px; height:24px; font-size:12px">${i + 1}</i><div>${x}</div></div>`).join('')}</div></div>
                    ${ist.length ? `<div class="rh-soru"><b>KULLANILDIĞI ÇALIŞMALAR</b><div class="rh-cipler" style="gap:5px">${ist.map(s => `<span class="rh-cip-kucuk" onclick="kmMzIstasyon(${s.num})">${s.num}. ${s.title}</span>`).join('')}</div></div>` : ''}`
                  : `<button class="rh-cip-kucuk" style="align-self:flex-start" onclick="kmMzAc('${m.id}')">Nedir, nasıl yapılır? ${ist.length ? '· ' + ist.length + ' çalışma' : ''}</button>`}
                <div class="rh-kontrol" role="group" aria-label="Salonda var mı?"><button class="${st === 'var' ? 'var' : ''}" onclick="kmMzIsaretle('${m.id}','var')">✓ Salonda var</button><button class="${st === 'yok' ? 'yok' : ''}" onclick="kmMzIsaretle('${m.id}','yok')">✗ Yok</button></div>
            </div></div>`;
    }).join('');
    ic.innerHTML = `<div class="rh">
        <div class="rh-ust"><div><div class="rh-baslik">🧰 Malzemeler</div><div class="rh-alt">Teknik çalışmalarda kullanılan malzemeler. Çoğu evde basitçe yapılabilir — resme dokun, ne işe yaradığını ve nasıl yapılacağını gör.</div></div></div>
        <div class="rh-ozet"><span>${eksik.length ? `🛒 Eksik: <b>${eksik.map(m => m.ad).join(', ')}</b>` : bilinmeyen.length === RH_MALZEME.length ? 'Salonda hangileri var? Aşağıdan işaretle.' : '✅ İşaretlenen malzemelerin hepsi salonda var.'}</span>${eksik.length ? `<button class="rh-btn" onclick="kmMzEksikKopyala()">📋 Eksik listesini kopyala</button>` : ''}</div>
        <div class="rh-izgara">${kartlar}</div></div>`;
}
function kmMzAc(id) { _kmMz.secili = _kmMz.secili === id ? null : id; kmMalzemeCiz(); }
function kmMzIsaretle(id, v) { let d = kmMzDurum(); d[id] = d[id] === v ? undefined : v; try { localStorage.setItem(kmMzAnahtar(), JSON.stringify(d)); } catch (e) {} kmMalzemeCiz(); }
function kmMzEksikKopyala() {
    let d = kmMzDurum(), metin = 'DAĞ S.K. — eksik malzemeler:\n' + RH_MALZEME.filter(m => d[m.id] === 'yok').map(m => '• ' + m.ad + ' (evde: ' + m.diy[0].toLocaleLowerCase('tr-TR') + ')').join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(metin) : Promise.reject()).then(() => showToast('📋 Eksik listesi kopyalandı.', 'success'), () => showToast('Kopyalanamadı.', 'error'));
}
function kmMzIstasyon(num) { _kmMz.istasyon = num; kmMalzemeCiz(); }
function kmMzIstasyonHTML() {
    let s = ((window.DAGSK_TEKNIK && DAGSK_TEKNIK.data) || []).find(x => x.num === _kmMz.istasyon); if (!s) { _kmMz.istasyon = null; return ''; }
    return `<div class="rh"><div><button class="rh-btn" onclick="_kmMz.istasyon=null; kmMalzemeCiz()">← Malzemeler</button></div>
        <div class="rh-detay"><div class="rh-resim rh-t-teknik">${s.svg || ''}</div>
            <div style="display:flex; flex-direction:column; gap:10px;"><div class="rh-alt" style="font-weight:800; letter-spacing:.06em">${s.num}. ÇALIŞMA · ${esc(s.cat || '')}</div><div class="rh-baslik">${esc(s.title)}</div><div class="rh-alt" style="font-size:14.5px">🎯 ${esc(s.amac || '')}</div>
                <div class="rh-serit">${(s.stats || []).map(x => `<div><small>${esc(x[0])}</small><b>${esc(x[1])}</b></div>`).join('')}</div>
                <div class="rh-alt">🧰 ${(s.malzeme || []).map(esc).join(' · ')}</div></div></div>
        <div class="rh-soru"><b>NASIL YAPILIR?</b><div class="rh-adimlar">${(s.steps || []).map((a, i) => `<div class="rh-adim"><i>${i + 1}</i><div>${esc(a)}</div></div>`).join('')}</div></div></div>`;
}

// ================================================================================================
// 🎥 VIDEO & DURUŞ — anlaşılır giriş + asıl kamera ekranının buraya taşınması
// ================================================================================================
const RH_VA_MODLAR = [
    { id: 'ai_pose', ad: 'Canlı Duruş Kontrolü', ikon: '🤖', ne: 'Kamera vücudun üzerine çizgiler çizer; yay kolun düz mü, omuzların eğik mi anında söyler.', ne2: 'Teknik çalışırken, formu düzeltirken',
      resim: () => rhOkcu('yaykolu'),
      adimlar: [['Telefonu sporcunun yanına koy', 'Yaklaşık 2–3 metre uzağa, bel yüksekliğine. Sporcu yandan, tam boy görünmeli.', () => rhTelefonYan()], ['Hangi elle attığını seç', '"Sağ elle" ya da "Sol elle" — yay türünü otomatik bulur.', () => rhEller()], ['"Canlı Kamerayı Aç"a bas ve at', 'Çizgiler yeşilse form iyi; kırmızıysa aşağıdaki öneriye bak.', () => rhOkcu('dirsek')]] },
    { id: 'ayna', ad: '5 Saniye Ayna', ikon: '🪞', ne: 'Atışını yap, arkanı dön: 5 saniye önceki halini ekranda izle. Kendi hatanı kendin gör.', ne2: 'Çocuklar için en kolayı — sırayla herkes',
      resim: () => rhAyna(),
      adimlar: [['Tableti atış çizgisinin yanına koy', 'Ekran sporcuya dönük olsun, kamera onu görsün.', () => rhTelefonYan()], ['"Aynayı Başlat"a bas', 'Görüntü 5 saniye geriden gelir.', () => rhAyna()], ['Atıştan sonra ekrana bak', 'Az önceki halini görürsün: omuz, dirsek, çapa yerinde mi?', () => rhOkcu('cene')]] },
    { id: 'karsilastir', ad: 'İki Atışı Karşılaştır', ikon: '⚔️', ne: 'İki videoyu yan yana ya da üst üste koy: bugünkü atışın ile en iyi atışın arasındaki farkı gör.', ne2: 'Haftalık kontrol, veliye gösterme',
      resim: () => rhIkiVideo(),
      adimlar: [['İki atış videosu çek', 'Telefonla, aynı açıdan, yandan.', () => rhTelefonYan()], ['Soldaki ve sağdaki kutuya yükle', '"Video seç" ile iki videoyu ekle.', () => rhIkiVideo()], ['Birlikte oynat', 'Açı farkları üstte otomatik yazar.', () => rhOkcu('yaykolu')]] },
    { id: 'hedef_kamera', ad: 'Kamera Hedef Hakemi', ikon: '🎯', ne: 'Kamerayı hedefe çevir; okların nereye saplandığını işaretler ve puanı hesaplar.', ne2: 'Uzak hedefte, puanı yürümeden görmek için',
      resim: () => `<svg viewBox="0 0 120 90" aria-hidden="true">${rhHedef(60, 46, 34)}<path d="M52 38 l-14 -18 M66 50 l14 -14" stroke="#143A5E" stroke-width="2"/><circle cx="52" cy="38" r="3" fill="#143A5E"/><circle cx="66" cy="50" r="3" fill="#143A5E"/><rect x="4" y="60" width="26" height="20" rx="3" fill="#143A5E"/><circle cx="17" cy="70" r="6" fill="#e0e7ff"/></svg>`,
      adimlar: [['Kamerayı hedefe doğrult', 'Hedefin tamamı görüntüde olsun.', () => `<svg viewBox="0 0 120 90">${rhHedef(80, 45, 26)}<rect x="6" y="34" width="30" height="22" rx="3" fill="#143A5E"/><circle cx="21" cy="45" r="7" fill="#e0e7ff"/><path d="M36 45 H54" stroke="#F26522" stroke-width="2" stroke-dasharray="3 3"/></svg>`], ['Hedefi tanıt', 'Ekrandaki yönergeyle hedefin kenarlarını göster.', () => rhHedefTanit()], ['Atış yap', 'Yeni oklar işaretlenir, puan hesaplanır.', () => `<svg viewBox="0 0 120 90">${rhHedef(60, 45, 34)}<circle cx="58" cy="40" r="4" fill="#22c55e" stroke="#fff" stroke-width="1.5"/><text x="60" y="88" text-anchor="middle" font-size="10" font-weight="900" fill="#143A5E">10!</text></svg>`]] }
];
function rhTelefonYan() {
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><line x1="6" y1="84" x2="114" y2="84" stroke="#9fb3c8" stroke-width="2"/><rect x="8" y="46" width="16" height="26" rx="3" fill="#143A5E"/><path d="M16 72 V84 M10 84 H22" stroke="#475569" stroke-width="2"/><path d="M24 58 L58 40 M24 58 L58 80" stroke="#F26522" stroke-width="1.6" stroke-dasharray="3 3"/>
        <g transform="translate(26,0) scale(.8)">${rhOkcu('yaykolu', { hedefYok: true }).replace(/<\/?svg[^>]*>/g, '')}</g><text x="41" y="88" font-size="7" font-weight="800" fill="#475569" text-anchor="middle">2–3 m</text></svg>`;
}
function rhEller() {
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><g fill="#fcd9b6" stroke="#b08968" stroke-width="2"><path d="M20 70 V36 q0 -6 6 -6 q6 0 6 6 V28 q0 -6 6 -6 q6 0 6 6 V34 q0 -5 5 -5 q5 0 5 5 V70 z"/><path d="M100 70 V36 q0 -6 -6 -6 q-6 0 -6 6 V28 q0 -6 -6 -6 q-6 0 -6 6 V34 q0 -5 -5 -5 q-5 0 -5 5 V70 z"/></g><text x="35" y="86" text-anchor="middle" font-size="9" font-weight="900" fill="#143A5E">SOL</text><text x="85" y="86" text-anchor="middle" font-size="9" font-weight="900" fill="#F26522">SAĞ</text></svg>`;
}
function rhAyna() {
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="62" y="8" width="52" height="72" rx="6" fill="#e0f2fe" stroke="#143A5E" stroke-width="3"/><g transform="translate(58,6) scale(.55)" opacity=".75">${rhOkcu('cene', { hedefYok: true }).replace(/<\/?svg[^>]*>/g, '')}</g>
        <g transform="translate(-10,6) scale(.75)">${rhOkcu('cene', { hedefYok: true }).replace(/<\/?svg[^>]*>/g, '')}</g><rect x="68" y="12" width="26" height="10" rx="5" fill="#dc2626"/><text x="81" y="20" font-size="7" font-weight="900" fill="#fff" text-anchor="middle">5 sn</text></svg>`;
}
function rhIkiVideo() {
    let ic = rhOkcu('yaykolu', { hedefYok: true }).replace(/<\/?svg[^>]*>/g, '');
    return `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="4" y="12" width="54" height="66" rx="5" fill="#fff" stroke="#143A5E" stroke-width="2.5"/><rect x="62" y="12" width="54" height="66" rx="5" fill="#fff" stroke="#F26522" stroke-width="2.5"/>
        <g transform="translate(2,18) scale(.5)">${ic}</g><g transform="translate(60,18) scale(.5)">${ic}</g><text x="31" y="88" font-size="7" font-weight="900" fill="#143A5E" text-anchor="middle">BUGÜN</text><text x="89" y="88" font-size="7" font-weight="900" fill="#F26522" text-anchor="middle">EN İYİ</text></svg>`;
}
function rhHedefTanit() {
    return `<svg viewBox="0 0 120 90" aria-hidden="true">${rhHedef(60, 45, 30)}<g fill="none" stroke="#F26522" stroke-width="3"><path d="M22 18 h10 M22 18 v10 M98 18 h-10 M98 18 v10 M22 72 h10 M22 72 v-10 M98 72 h-10 M98 72 v-10"/></g></svg>`;
}
const RH_VA_OLCU = [
    ['Yay kolu', 'Hedefe uzanan kol dümdüz olmalı (175–180°).', 'yaykolu'],
    ['Çekiş dirseği', 'İpi çeken kolun dirseği okla aynı hizada.', 'dirsek'],
    ['Çapa (çene teması)', 'İp her atışta çeneye aynı yerden değmeli.', 'cene'],
    ['Omuzlar', 'İki omuz aynı yükseklikte, eğik değil (6°\'den az).', 'omuz']
];
let _kmVa = { mod: null, gelismis: false }, _kmVaYer = null;
function kmVaTasi(kap) {
    let el = document.getElementById('icerik-video'); if (!el || !kap) return;
    if (!_kmVaYer) _kmVaYer = { parent: el.parentNode, next: el.nextSibling };
    kap.appendChild(el);
    el.classList.add('km-va-icinde'); el.classList.toggle('km-va-gelismis', !!_kmVa.gelismis);
}
// Karışık Sınıf'tan çıkarken / başka araca geçerken / ana menüden Video sekmesi açılırken çağrılır.
function kmVaGeriKoy() {
    let el = document.getElementById('icerik-video'); if (!el || !_kmVaYer) return;
    try { if (window.DAGSK_AI_POSE) DAGSK_AI_POSE.stopLiveCamera(); } catch (e) {}
    try { aynaDurdur(); } catch (e) {}
    try { if (window.DAGSK_TARGET_CV) DAGSK_TARGET_CV.stop(); } catch (e) {}
    el.classList.remove('km-va-icinde', 'km-va-gelismis');
    try { _kmVaYer.parent.insertBefore(el, _kmVaYer.next && _kmVaYer.next.parentNode === _kmVaYer.parent ? _kmVaYer.next : null); } catch (e) { _kmVaYer.parent.appendChild(el); }
    _kmVaYer = null;
}
function kmDurusCiz() {
    kmRhCssYukle();
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    // Önce eski yerleşimi temizle (ekran yeniden çizilecek, video düğümü kaybolmasın)
    let video = document.getElementById('icerik-video');
    if (video && video.classList.contains('km-va-icinde')) { document.body.appendChild(video); }
    let modlar = RH_VA_MODLAR.map(m => `<button class="rh-mod${_kmVa.mod === m.id ? ' aktif' : ''}" onclick="kmVaModSec('${m.id}')"><div class="rh-resim rh-t-video">${m.resim()}</div><div class="rh-mod-govde"><b>${m.ikon} ${m.ad}</b><span>${m.ne}</span><em>Ne zaman: ${m.ne2}</em></div></button>`).join('');
    if (!_kmVa.mod) {
        ic.innerHTML = `<div class="rh"><div class="rh-ust"><div><div class="rh-baslik">🎥 Video & Duruş</div><div class="rh-alt">Kamerayla atışını izle, doğru yapıp yapmadığını gör. Ne yapmak istiyorsun?</div></div></div>
            <div class="rh-modlar">${modlar}</div>
            <div class="rh-alt">🔒 Kamera görüntüsü hiçbir yere gönderilmez; yalnızca bu cihazda işlenir.</div></div>`;
        if (video && video.classList.contains('km-va-icinde')) kmVaGeriKoy();
        return;
    }
    let m = RH_VA_MODLAR.find(x => x.id === _kmVa.mod);
    let olcu = m.id === 'ai_pose' ? `<details class="pf-kart" style="border:1px solid var(--border-color); border-radius:14px; padding:12px; background:var(--surface-1)"><summary style="cursor:pointer; font-weight:800; color:var(--text-primary)">❓ Ekrandaki sayılar ne demek?</summary>
        <div class="rh-olcu" style="margin-top:10px">${RH_VA_OLCU.map(o => `<div>${rhOkcu(o[2], { hedefYok: true })}<div><b>${o[0]}</b><small>${o[1]}</small></div></div>`).join('')}</div>
        <div class="rh-renkler" style="margin-top:8px"><span style="--r:#22c55e">Yeşil = doğru</span><span style="--r:#f59e0b">Sarı = az kaldı</span><span style="--r:#ef4444">Kırmızı = düzelt</span></div></details>` : '';
    ic.innerHTML = `<div class="rh">
        <div class="rh-ust"><div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap"><button class="rh-btn" onclick="kmVaModSec(null)">← Başka araç seç</button><div class="rh-baslik">${m.ikon} ${m.ad}</div></div>
            <button class="rh-btn" onclick="kmVaGelismis()" aria-pressed="${_kmVa.gelismis}">${_kmVa.gelismis ? '🛠️ Gelişmiş araçları gizle' : '🛠️ Gelişmiş araçlar (çizim, yakınlaştırma)'}</button></div>
        <div class="rh-soru"><b>3 ADIMDA KULLAN</b><div class="rh-3adim">${m.adimlar.map((a, i) => `<div>${a[2]()}<i>${i + 1}. ADIM</i><b>${a[0]}</b><span class="rh-alt">${a[1]}</span></div>`).join('')}</div></div>
        ${olcu}
        <div id="rh-va-kap"></div></div>`;
    kmVaTasi(document.getElementById('rh-va-kap'));
    try { vaModSec(m.id); } catch (e) {}
}
function kmVaModSec(mod) {
    if (!mod) { kmVaGeriKoy(); _kmVa.mod = null; kmDurusCiz(); return; }
    _kmVa.mod = mod; kmDurusCiz();
    let ic = document.getElementById('km-icerik'); if (ic) ic.scrollIntoView({ block: 'start' });
}
function kmVaGelismis() { _kmVa.gelismis = !_kmVa.gelismis; let el = document.getElementById('icerik-video'); if (el) el.classList.toggle('km-va-gelismis', _kmVa.gelismis); let b = document.querySelector('#km-icerik .rh-ust > button.rh-btn'); if (b) { b.textContent = _kmVa.gelismis ? '🛠️ Gelişmiş araçları gizle' : '🛠️ Gelişmiş araçlar (çizim, yakınlaştırma)'; b.setAttribute('aria-pressed', _kmVa.gelismis); } }
