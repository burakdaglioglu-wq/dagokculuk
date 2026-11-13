/* 🗺️ Sınıf Yolculuğu (v404, 2026-11-12) — kullanıcı: "oyunlar ilerlemiyor, yeni yaptıkların bir amacı yok".
   Taslak A (Harita) onaylandı. TEK KURAL: her iyi ok sınıfı bir adım ilerletir. "İyi" çocuğun KENDİ seviyesine göre
   (Zombi'nin esikOf'u: ort ≥7 → sarı (9+), ort ≥5 → kırmızı (7+), yoksa mavi (5+)). Hangi oyun açık olursa olsun
   aynı sayaç dolar; oyunların kuralları DEĞİŞMEZ. Koça ek dokunuş yok. Ceza yok, sıralama yok; başarıda herkesin adı.
   Kalıcı (12 saat sıfırlamasına GİRMEZ), konum başına: localStorage 'dag_yolculuk_<konum>'. Yalnızca bu cihazda.
   KABUK (app.js): ykCiz() · ykSeri(s, kaydedilecek, seriId) · ykGeriAl(seriId) · ykHaritaAc() */
(function () {
    'use strict';
    const DURAKLAR = [
        ['🏠', 'Köy', 'Köye', 'Yola çıktık!'],
        ['🌲', 'Orman', 'Ormana', 'Ormana vardık!'],
        ['🌉', 'Köprü', 'Köprüye', 'Köprüyü geçtik!'],
        ['💧', 'Şelale', 'Şelaleye', 'Şelaleye vardık!'],
        ['🕳️', 'Mağara', 'Mağaraya', 'Mağarayı geçtik!'],
        ['🍄', 'Mantar Vadisi', 'Mantar Vadisine', 'Mantar Vadisine vardık!'],
        ['🏜️', 'Çöl', 'Çöle', 'Çölü geçtik!'],
        ['🌋', 'Yanardağ', 'Yanardağa', 'Yanardağı geçtik!'],
        ['🏔️', 'Karlı Geçit', 'Karlı Geçide', 'Karlı Geçidi aştık!'],
        ['🌊', 'Deniz', 'Denize', 'Denizi geçtik!'],
        ['🏰', 'Kale', 'Kaleye', 'Kaleye vardık!'],
        ['🐉', 'Ejder Dağı', 'Ejder Dağına', 'Ejder Dağına ulaştık!']
    ];
    // 🧟 v414 (kullanıcı: "bunu zombi moduna geçir, önce köprüdeki zombileri geçelim sonra kulede..."): Zombi oyunu açıkken
    // AYNI sayaç/durak, zombi şehri olarak görünür — her iyi ok bir zombiyi yener. [ikon, ad, bulunma hali, başarı]
    const ZOMBI_DURAKLAR = [
        ['🏠', 'Sığınak', 'Sığınakta', 'Sığınaktan çıktık!'],
        ['🌉', 'Köprü', 'Köprüde', 'Köprüyü temizledik!'],
        ['🗼', 'Kule', 'Kulede', 'Kuleyi temizledik!'],
        ['🏫', 'Okul', 'Okulda', 'Okulu temizledik!'],
        ['🛒', 'Market', 'Markette', 'Marketi temizledik!'],
        ['🏥', 'Hastane', 'Hastanede', 'Hastaneyi temizledik!'],
        ['🚉', 'İstasyon', 'İstasyonda', 'İstasyonu temizledik!'],
        ['🎡', 'Lunapark', 'Lunaparkta', 'Lunaparkı temizledik!'],
        ['🏭', 'Fabrika', 'Fabrikada', 'Fabrikayı temizledik!'],
        ['🏟️', 'Stadyum', 'Stadyumda', 'Stadyumu temizledik!'],
        ['🏰', 'Kale', 'Kalede', 'Kaleyi geri aldık!'],
        ['👑', 'Zombi Kralı', 'Zombi Kralının ininde', 'Zombi Kralını yendik! Şehir kurtuldu!']
    ];
    const SON = DURAKLAR.length - 1;
    const zombiMi = () => { try { return typeof _kmOyunAktifTema !== 'undefined' && _kmOyunAktifTema === 'zombi'; } catch (e) { return false; } };
    const D = (i) => (zombiMi() ? ZOMBI_DURAKLAR : DURAKLAR)[Math.max(0, Math.min(i, SON))];
    // "Ormana 5 iyi ok kaldı" · zombi: "Köprüde 5 zombi kaldı"
    const kalanYazi = (h, n) => zombiMi() ? h[2] + ' ' + n + ' zombi kaldı' : h[2] + ' ' + n + ' iyi ok kaldı';
    const ustYazi = () => zombiMi() ? 'Zombi Şehri' : 'Sınıf Yolculuğu';
    const KISI_BASI = 1.7;
    const $ = (id) => document.getElementById(id);
    const konum = () => (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) || 'varsayilan';
    const anahtar = () => 'dag_yolculuk_' + konum();
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toLocaleDateString('sv-SE'));
    const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const ozelMi = () => /^ozel_/.test(konum());
    const basKartiAcik = () => { try { return localStorage.getItem('dag_yolculuk_ders_basi') !== '0'; } catch (e) { return true; } };
    let _basZaman = null;
    const ilkAd = (ad) => String(ad || '').trim().split(/\s+/)[0];

    function sinifSay() { try { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache.length) || 0; } catch (e) { return 0; } }
    function hedefHesapla() { return Math.max(8, Math.min(80, Math.round((sinifSay() || 10) * KISI_BASI))); }
    function yeni() { return { durak: 0, sayac: 0, hedef: hedefHesapla(), tur: 1, acik: true, basGun: '', elle: false, son: null }; }
    function oku() {
        let st = null; try { st = JSON.parse(localStorage.getItem(anahtar()) || 'null'); } catch (e) { st = null; }
        if (!st || typeof st.durak !== 'number') st = yeni();
        return st;
    }
    function yaz(st) { try { localStorage.setItem(anahtar(), JSON.stringify(st)); } catch (e) { } }

    function puanSay(v) { return v === 'X' || v === 'x' ? 10 : (v === 'M' || v === 'm' ? 0 : (parseInt(v, 10) || 0)); }
    function esikOf(ort) { return ort >= 7 ? 9 : ort >= 5 ? 7 : 5; }
    function esikKisi(s) { let o = 0; try { if (typeof kmCanavarSporcuOrtalama === 'function') o = kmCanavarSporcuOrtalama(s.g, s.ad) || 0; } catch (e) { } return esikOf(o); }

    // ── Şerit ──────────────────────────────────────────────────────────────
    function seritHTML(st) {
        if (!st.acik) return '<button class="yk-kapali" onclick="ykHaritaAc()">🗺️ Sınıf Yolculuğu kapalı · aç</button>';
        const h = D(st.durak + 1), kalan = Math.max(0, st.hedef - st.sayac), yuzde = Math.min(100, Math.round(st.sayac / st.hedef * 100));
        return '<button class="yk-serit-ic' + (zombiMi() ? ' yk-zombi' : '') + '" onclick="ykHaritaAc()" aria-label="Sınıf yolculuğu haritasını aç">'
            + '<span class="yk-ik">' + h[0] + (zombiMi() ? '🧟' : '') + '</span><span class="yk-orta"><b>' + esc(kalanYazi(h, kalan)) + '</b>'
            + '<span class="yk-bar"><span style="width:' + yuzde + '%"></span></span></span><span class="yk-say">' + st.sayac + '/' + st.hedef + '</span></button>';
    }
    function ykCiz() {
        const el = $('yk-serit'); if (!el) return;
        if (ozelMi()) { el.innerHTML = ''; el.style.display = 'none'; return; }
        el.style.display = '';
        const st = oku();
        // hedef henüz hiç dolmaya başlamadıysa bugünkü sınıf mevcuduna göre ayarlanır (koç elle değiştirmediyse)
        if (st.sayac === 0 && !st.elle && sinifSay()) { const h = hedefHesapla(); if (h !== st.hedef) { st.hedef = h; yaz(st); } }
        el.innerHTML = seritHTML(st);
        if (st.acik && basKartiAcik() && st.basGun !== bugun() && sinifSay() && !$('yk-ortu')) dersBasi(st);
    }

    // ── Harita (SVG) ───────────────────────────────────────────────────────
    function haritaSVG(st, boy) {
        const W = 640, H = 214, n = DURAKLAR.length, px = (i) => 26 + i * (W - 52) / (n - 1), py = (i) => 112 + Math.sin(i * 1.05) * 52;
        let d = '', dYesil = '';
        for (let i = 0; i < n; i++) { const c = (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(i).toFixed(1) + ' '; d += c; if (i <= st.durak) dYesil += c; }
        // hedefe doğru kısmi ilerleme
        if (st.durak < SON) { const f = Math.min(1, st.sayac / st.hedef), a = st.durak, b = a + 1; dYesil += 'L' + (px(a) + (px(b) - px(a)) * f).toFixed(1) + ' ' + (py(a) + (py(b) - py(a)) * f).toFixed(1); }
        let s = '<svg class="yk-harita" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Sınıf yolculuğu haritası" style="' + (boy || '') + '">'
            + '<path d="' + d + '" stroke="rgba(255,255,255,.18)" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
            + '<path d="' + dYesil + '" stroke="' + (zombiMi() ? '#9BEA5A' : '#3ddc97') + '" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
        const zm = zombiMi();
        (zm ? ZOMBI_DURAKLAR : DURAKLAR).forEach((k, i) => {
            const gecti = i <= st.durak, hedef = i === st.durak + 1, adli = hedef || i === SON;
            // telefonda 12 ad üst üste biniyordu: yalnızca hedef ve Ejder Dağı yazılı (bulunduğumuz yeri sarı nokta gösterir)
            const ax = Math.max(40, Math.min(W - 40, px(i)));
            s += '<g opacity="' + (gecti || hedef ? 1 : .45) + '"><text x="' + px(i) + '" y="' + (py(i) - 16) + '" font-size="' + (hedef ? 38 : 26) + '" text-anchor="middle">' + k[0] + '</text>'
                // zombi şehri: temizlenmemiş her durakta zombi, temizlenende yeşil tik
                + (zm && i > 0 ? (gecti ? '<text x="' + (px(i) + 15) + '" y="' + (py(i) - 34) + '" font-size="15" text-anchor="middle">✅</text>' : '<text x="' + (px(i) + (hedef ? 22 : 15)) + '" y="' + (py(i) - (hedef ? 44 : 34)) + '" font-size="' + (hedef ? 24 : 16) + '" text-anchor="middle">🧟</text>') : '')
                // son durak sağa yaslı ("Zombi Kralı" uzun, kesiliyordu)
                + (adli ? '<text x="' + (i === SON ? W - 4 : ax) + '" y="' + (py(i) + 38) + '" font-size="' + (hedef ? 22 : 17) + '" font-weight="900" fill="' + (hedef ? '#ffd34d' : '#cfd6e2') + '" text-anchor="' + (i === SON ? 'end' : 'middle') + '">' + esc(k[1]) + '</text>' : '') + '</g>';
        });
        const ci = st.durak < SON ? st.durak + Math.min(1, st.sayac / st.hedef) : SON;
        const a = Math.floor(ci), f = ci - a, b = Math.min(SON, a + 1), cx = px(a) + (px(b) - px(a)) * f, cy = py(a) + (py(b) - py(a)) * f;
        s += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="11" fill="#ffd34d" stroke="#0b0f16" stroke-width="4"/></svg>';
        return s;
    }

    function kap(el) { const o = el || $('yk-ortu'); if (o) o.remove(); }
    function ortu(ic, sinif) {
        kap();
        const kok = $('km-oyun-wrap') || document.body, o = document.createElement('div');
        o.id = 'yk-ortu'; o.className = 'yk-ortu ' + (sinif || '');
        o.innerHTML = '<div class="yk-kart" role="dialog" aria-modal="true">' + ic + '</div>';
        o.addEventListener('click', (e) => { if (e.target === o) kap(o); });
        kok.appendChild(o);
        const gv = $('km-oyun-govde'); if (gv && kok.id === 'km-oyun-wrap') o.style.top = gv.offsetTop + 'px';
        return o;
    }
    function sinifAdi() { try { return typeof kmKonumAdi === 'function' ? kmKonumAdi() : ''; } catch (e) { return ''; } }

    function dersBasi(st) {
        const h = D(st.durak + 1), n = st.hedef - st.sayac, zm = zombiMi();
        ortu('<small class="yk-ust">' + esc(sinifAdi()) + ' · ' + ustYazi() + (typeof yeniRozet === 'function' ? yeniRozet() : '') + '</small>'
            + haritaSVG(st)
            + (zm ? '<div class="yk-buyuk">' + h[0] + ' ' + esc(h[2]) + ' ' + n + ' zombi var! Hep birlikte temizleyelim.</div>'
                + '<div class="yk-alt">Her iyi ok bir zombiyi yener. Önce ' + esc(h[1]) + ', sonra ' + esc(D(st.durak + 2)[1]) + '… en sonunda Zombi Kralı. İyi ok herkesin kendi seviyesine göre: yeni başlayana mavi, ortaya kırmızı, iyiye sarı.</div>'
                : '<div class="yk-buyuk">Bugün ' + n + ' iyi ok atarsak ' + h[0] + ' ' + esc(h[2]) + ' varırız.</div>'
                + '<div class="yk-alt">Herkesin iyi oku sayılır, hangi oyunu oynarsak oynayalım. İyi ok herkesin kendi seviyesine göre: yeni başlayana mavi, ortaya kırmızı, iyiye sarı.</div>')
            + '<button class="yk-btn" onclick="ykBasla()">Başlayalım</button>', 'yk-bas');
        clearTimeout(_basZaman); _basZaman = setTimeout(() => { const o = $('yk-ortu'); if (o && o.classList.contains('yk-bas')) ykBasla(); }, 10000);
    }
    function ykBasla() { clearTimeout(_basZaman); const st = oku(); st.basGun = bugun(); yaz(st); kap(); ykCiz(); }

    function ykHaritaAc() {
        const st = oku(), h = D(st.durak + 1);
        ortu('<small class="yk-ust">' + esc(sinifAdi()) + ' · ' + ustYazi() + (st.tur > 1 ? ' · ' + st.tur + '. yolculuk' : '') + (typeof yeniRozet === 'function' ? yeniRozet() : '') + '</small>'
            + haritaSVG(st)
            + (st.acik ? '<div class="yk-buyuk">' + h[0] + ' ' + esc(kalanYazi(h, Math.max(0, st.hedef - st.sayac))) + '</div>' : '<div class="yk-buyuk">Yolculuk kapalı</div>')
            + '<div class="yk-alt">' + (zombiMi() ? 'Her iyi ok bir zombiyi yener; durak temizlenince sıradakine geçeriz.' : 'Her iyi ok sınıfı bir adım ilerletir.') + ' Hedef tutmazsa bir sonraki derste kaldığımız yerden devam ederiz.</div>'
            + '<div class="yk-ayar"><span>Bu durak için hedef</span><button onclick="ykHedef(-5)" aria-label="Hedefi azalt">−</button><b id="yk-hedef-yazi">' + st.hedef + '</b><button onclick="ykHedef(5)" aria-label="Hedefi artır">+</button></div>'
            + '<div class="yk-alt-btn"><button onclick="ykBasKarti()">Ders başı kartı: ' + (basKartiAcik() ? 'açık' : 'kapalı') + '</button><button onclick="ykAcKapa()">' + (st.acik ? 'Yolculuğu kapat' : 'Yolculuğu aç') + '</button><button class="yk-btn" onclick="ykKapat()">Tamam</button></div>');
    }
    function ykHedef(d) { const st = oku(); st.hedef = Math.max(5, Math.min(150, st.hedef + d)); st.elle = true; yaz(st); const b = $('yk-hedef-yazi'); if (b) b.textContent = st.hedef; ykCiz(); }
    function ykAcKapa() { const st = oku(); st.acik = !st.acik; if (st.acik) st.basGun = bugun(); yaz(st); kap(); ykCiz(); }
    function ykKapat() { kap(); }
    function ykBasKarti() { try { localStorage.setItem('dag_yolculuk_ders_basi', basKartiAcik() ? '0' : '1'); } catch (e) { } ykHaritaAc(); }

    // ── Seri girişi ────────────────────────────────────────────────────────
    let _basariZaman = null;
    function ykSeri(s, kaydedilecek, seriId) {
        if (ozelMi() || !s) return 0;
        const st = oku(); if (!st.acik) return 0;
        const esik = esikKisi(s), iyi = (kaydedilecek || []).filter((k) => puanSay(k && k.puan !== undefined ? k.puan : k) >= esik).length;
        const onceki = JSON.parse(JSON.stringify(Object.assign({}, st, { son: null })));
        st.son = { seriId: seriId || null, onceki: onceki };
        st.basGun = bugun();
        { const o = $('yk-ortu'); if (o && o.classList.contains('yk-bas')) { clearTimeout(_basZaman); kap(o); } }
        if (!iyi) { yaz(st); return 0; }
        st.sayac += iyi;
        let gecilen = null;
        if (st.sayac >= st.hedef) {
            st.durak = Math.min(SON, st.durak + 1); st.sayac = 0; st.elle = false; st.hedef = hedefHesapla();
            gecilen = st.durak;
            if (st.durak >= SON) { st.tur = (st.tur || 1) + 1; st.durak = 0; }
        }
        yaz(st); ykCiz(); puf(ilkAd(s.ad) + ' +' + iyi + ' ' + (zombiMi() ? '🧟' : D(gecilen != null ? gecilen : st.durak + 1)[0]));
        if (gecilen != null) { clearTimeout(_basariZaman); _basariZaman = setTimeout(() => basari(gecilen), 2200); }
        return iyi;
    }
    function ykGeriAl(seriId) {
        const st = oku(); if (!st.son || !st.son.onceki) return;
        if (seriId && st.son.seriId && st.son.seriId !== seriId) return;
        const o = st.son.onceki; o.son = null; yaz(o);
        clearTimeout(_basariZaman); const ort = $('yk-ortu'); if (ort && ort.classList.contains('yk-basari')) kap(ort);
        ykCiz();
    }
    function puf(metin) {
        const el = $('yk-serit'); if (!el) return;
        const p = document.createElement('span'); p.className = 'yk-puf'; p.textContent = metin; el.appendChild(p);
        setTimeout(() => p.remove(), 2600);
    }
    function basari(i) {
        const k = D(i), final = i >= SON, st = oku(), zm = zombiMi();
        let adlar = []; try { adlar = (_kmOyunRosterCache || []).map((x) => ilkAd(x.ad)); } catch (e) { }
        const sonraki = final ? D(1) : D(i + 1);
        const o = ortu('<div class="yk-dev">' + k[0] + '</div><div class="yk-buyuk">' + esc(k[3]) + '</div>'
            + (final ? '<div class="yk-alt">' + (zm ? 'Bütün şehri zombilerden kurtardık! ' : 'Bütün yolculuğu bitirdik! ') + (st.tur) + '. yolculuk başlıyor.</div>' : '<div class="yk-alt2">Sıradaki durak: ' + sonraki[0] + ' ' + esc(sonraki[1]) + ' (' + st.hedef + (zm ? ' zombi' : ' iyi ok') + ')</div>')
            + haritaSVG(st)
            + (adlar.length ? '<div class="yk-adlar">Hep birlikte: ' + adlar.map(esc).join(', ') + '</div>' : '')
            + '<button class="yk-btn" onclick="ykKapat()">Devam</button>', 'yk-basari' + (final ? ' yk-final' : ''));
        try { if (typeof kmOyunSesCal === 'function') kmOyunSesCal('basari'); } catch (e) { }
        setTimeout(() => { if ($('yk-ortu') === o) kap(o); }, final ? 15000 : 9000);
    }

    // ── Stil ───────────────────────────────────────────────────────────────
    (function () {
        if ($('yk-stil')) return;
        const st = document.createElement('style'); st.id = 'yk-stil';
        st.textContent = ''
            + '#yk-serit{position:relative;margin:0 0 8px}'
            + '.yk-serit-ic{width:100%;display:flex;align-items:center;gap:10px;padding:8px 12px;min-height:52px;border-radius:16px;border:1px solid rgba(255,255,255,.14);background:rgba(10,14,22,.86);color:#eef2f8;font:inherit;text-align:left;cursor:pointer}'
            + '.yk-ik{font-size:26px;line-height:1;flex:none}.yk-orta{flex:1;min-width:0;display:block}'
            + '.yk-orta b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
            + '.yk-bar{display:block;height:12px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;margin-top:5px}.yk-bar span{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3ddc97,#ffd34d);transition:width .6s}'
            + '.yk-say{font-weight:900;font-size:18px;font-variant-numeric:tabular-nums;flex:none}'
            + '.yk-kapali{border:1px dashed rgba(255,255,255,.25);background:transparent;color:inherit;border-radius:12px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;opacity:.75}'
            + '.yk-puf{position:absolute;right:10px;top:100%;margin-top:4px;z-index:30;background:#3ddc97;color:#06261a;font-weight:900;border-radius:99px;padding:4px 12px;font-size:14px;pointer-events:none;animation:ykPuf 2.6s ease forwards}'
            + '@keyframes ykPuf{0%{opacity:0;transform:translateY(6px)}12%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}'
            // fixed DEĞİL: yalnızca oyun alanını (#km-oyun-wrap) kaplar; üstteki "← Karışık Sınıf" ve menü hep kullanılabilir (101 testi yakaladı)
            + '#km-oyun-wrap>.yk-ortu{position:absolute;border-radius:inherit}'
            + '.yk-ortu{position:fixed;inset:0;z-index:2000;display:flex;align-items:flex-start;justify-content:center;padding:16px;background:rgba(5,8,14,.78);backdrop-filter:blur(4px)}'
            + '.yk-kart{width:min(760px,100%);max-height:100%;overflow:auto;box-sizing:border-box;padding:20px;border-radius:22px;background:radial-gradient(circle at 50% 0,#22324a,#0d1117 75%);color:#eef2f8;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 60px rgba(0,0,0,.5)}'
            + '.yk-basari .yk-kart{background:radial-gradient(circle at 50% 20%,#3a2a10,#0d1117 72%);text-align:center;align-items:center}'
            + '.yk-ust{color:#9aa3b5;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:12px}'
            + '.yk-harita{width:100%;height:auto;display:block}'
            + '.yk-buyuk{font-size:clamp(22px,5.6vw,40px);font-weight:900;line-height:1.15}'
            + '.yk-alt{color:#b8c0cf;font-size:14px;line-height:1.45}.yk-alt2{font-size:16px;font-weight:700}'
            + '.yk-dev{font-size:clamp(72px,16vw,140px);line-height:1;animation:ykZipla 1.2s ease infinite}'
            + '.yk-final .yk-dev{animation-duration:.8s}'
            + '@keyframes ykZipla{50%{transform:translateY(-12px) scale(1.06)}}'
            + '.yk-adlar{color:#cfd6e2;font-size:clamp(13px,2.4vw,20px);line-height:1.6;max-width:720px}'
            + '.yk-btn{min-height:52px;border-radius:16px;border:0;background:#ff8a3d;color:#1a0d05;font:inherit;font-weight:900;font-size:18px;padding:0 26px;cursor:pointer}'
            + '.yk-basari .yk-btn{min-width:200px}'
            + '.yk-ayar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-weight:700}.yk-ayar span{flex:1;min-width:140px;color:#b8c0cf}'
            + '.yk-ayar button{width:46px;height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:inherit;font-size:22px;font-weight:900;cursor:pointer}.yk-ayar b{min-width:44px;text-align:center;font-size:22px}'
            + '.yk-alt-btn{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}.yk-alt-btn button:not(.yk-btn){min-height:52px;border-radius:16px;border:1px solid rgba(255,255,255,.2);background:transparent;color:inherit;font:inherit;font-weight:800;padding:0 16px;cursor:pointer}'
            + '#km-oyun-wrap:fullscreen .yk-serit-ic{min-height:76px;padding:12px 20px;border-radius:20px}#km-oyun-wrap:fullscreen .yk-ik{font-size:44px}#km-oyun-wrap:fullscreen .yk-orta b{font-size:24px}#km-oyun-wrap:fullscreen .yk-bar{height:18px}#km-oyun-wrap:fullscreen .yk-say{font-size:32px}#km-oyun-wrap:fullscreen .yk-puf{font-size:22px;padding:8px 18px}'
            + '@media (max-width:400px){.yk-orta b{font-size:13px}.yk-kart{padding:16px}}'
            + '@media (prefers-reduced-motion:reduce){.yk-dev,.yk-puf{animation:none}.yk-bar span{transition:none}}';
        document.head.appendChild(st);
    })();

    window.ykCiz = ykCiz; window.ykSeri = ykSeri; window.ykGeriAl = ykGeriAl; window.ykHaritaAc = ykHaritaAc;
    window.ykBasla = ykBasla; window.ykHedef = ykHedef; window.ykAcKapa = ykAcKapa; window.ykKapat = ykKapat; window.ykBasKarti = ykBasKarti;
    window._ykIc = { DURAKLAR, ZOMBI_DURAKLAR, esikOf, oku, yaz, anahtar, hedefHesapla };
})();
