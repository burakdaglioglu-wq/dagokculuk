// ❤️ Gerilim katmanı (2026-11-27, v471). Kullanıcı: "çocuklar sıkılmaya başladı" → seçtiği 3 sebep:
//   2 kaybetme korkusu yok · 3 sırada bekleyenler bir şey yapmıyor · 4 kalıp hep aynı. Fikir sayfasından önerilen paket
//   (2.1 + 2.2 + 3.1 + 3.2 + 4.1 + 4.2) beş sevilen oyunun ÜSTÜNE ortak katman olarak; oyunların kendi durumuna DOKUNMAZ.
//   • 2.1 Kişiye göre hedef: her çocuğun hedefi kendi ok ortalaması × ok sayısı (kmCanavarSporcuOrtalama). Hedefin altı = kötü seri.
//         Böylece zayıf çocuk suçlanmaz, iyi atan da rahat geçemez.
//   • 2.2 Sınıfın 3 kalbi: kötü seri düşmanın öfke çubuğunu doldurur; dolunca saldırır → 1 kalp. TUR = mevcut çocuk sayısı kadar seri
//         (herkes bir kez). Kazanan/kaybeden ANCAK tur bitince (STANDING: herkes atmadan karar yok). Kalp 0'da "SON ŞANS":
//         seride iki sarı (9-10) atan 1 kalp geri getirir.
//   • 3.1 Tahmin: sıradakiler el kaldırır "Ece 19+ atar mı?" — seri sonunda koç tek dokunuş "Çoğunluk bildi" → öfke yarım adım iner.
//   • 3.2 Kalkan görevi: saldırıdan bir adım önce sıradakilere hareket görevi (heykel, çömel…); "Yaptılar" → öfke bir adım iner.
//   • 4.1 Sürpriz kart: turda her 3 seride bir sonraki seri için olay (çifte tehlike, şifa, altın ok, sarı avı, koro).
//   • 4.2 Yol ayrımı: tur bitince sınıf oylar — 🌲 kolay yol (1 ⭐) / 🌋 zor yol (3 ⭐). ⭐ kalıcı (12 saat sıfırlamasından etkilenmez).
// Denge (24 çocuk, gerçek isabet dağılımı simülasyonu; scratchpad sim/s5.js): tur kazanma Kolay ≈%100 · Normal ≈%90 · Zor ≈%70 ·
//   Kâbus ≈%50; turda ortalama 1–2.5 saldırı. Öfke adımı = 100·K/çocuk sayısı → sınıf büyüklüğünden bağımsız.
// Durum: dag_km_gr_<konum> (KM_OYUN_SIFIR_ONEK, 12 saatte sıfırlanır), kalıcı ⭐: dag_km_grk_<konum>, cihaz ayarı: dag_km_gr_ayar.
// Kancalar (app.js): kmOyunKabukGuncelle → grTazele(tema); bitirOrtak → grSeriSonu(tema, s, oklar); geri al → grAnlik/grGeriYukle.
// Takım/çoklu modda çalışmaz.
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const ilkAd = (ad) => String(ad || '').trim().split(/\s+/)[0] || '';
    const buyuk = (t) => String(t || '').toLocaleUpperCase('tr-TR');
    const puan = (v) => { const p = String(v && typeof v === 'object' ? v.puan : v == null ? '' : v).toUpperCase(); return p === 'X' ? 10 : (parseInt(p, 10) || 0); };
    const sariMi = (v) => puan(v) >= 9;
    const onMu = (v) => { const p = String(v && typeof v === 'object' ? v.puan : v).toUpperCase(); return p === 'X' || p === '10'; };

    const TEMA = {
        canavar: { dus: 'Canavar', sal: 'CANAVAR SALDIRDI!', ik: '👹' },
        blok: { dus: 'Canavar', sal: 'CANAVAR SALDIRDI!', ik: '👾' },
        zombi: { dus: 'Zombiler', sal: 'ZOMBİLER SALDIRDI!', ik: '🧟' },
        dedektif: { dus: 'Hırsız çete', sal: 'HIRSIZLAR SALDIRDI!', ik: '🦹' },
        hayalet: { dus: 'Hayaletler', sal: 'HAYALETLER SALDIRDI!', ik: '👻' }
    };
    const SEVIYE = ['kolay', 'normal', 'zor', 'kabus'];
    const SV = { kolay: { ad: '🐣 Kolay', k: 5 }, normal: { ad: '🦊 Normal', k: 7 }, zor: { ad: '🔥 Zor', k: 9 }, kabus: { ad: '💀 Kâbus', k: 11 } };
    const GOREV = ['HEYKEL OLUN! 5 saniye kıpırdamak yok', 'HEP BİRLİKTE 5 KEZ ÇÖMELİN!', 'TEK AYAK ÜSTÜNDE DURUN!', 'YERİNDE 10 KEZ ZIPLAYIN!', 'SESSİZCE 10\'A KADAR SAYIN!'];
    const OLAY = {
        cift: { ik: '⚡', ad: 'ÇİFTE TEHLİKE', s: 'Bu seri hedefin altında kalırsa öfke 2 kat dolar!' },
        sifa: { ik: '💚', ad: 'ŞİFA IŞIĞI', s: 'Bu seride 10 gelirse sınıfa 1 kalp geri gelir!' },
        altin: { ik: '🌟', ad: 'ALTIN OK', s: 'Bu seride 10 gelirse öfke tamamen sıfırlanır!' },
        sari: { ik: '🟡', ad: 'SARI AVI', s: 'Bu seride sarı (9-10) yoksa öfke dolar, varsa iner!' },
        koro: { ik: '📣', ad: 'KORO SERİSİ', s: 'Her 10\'da sıradakiler hep birlikte "ON!" diye bağırır!' }
    };
    const konum = () => (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) || 'varsayilan';
    const A_DURUM = () => 'dag_km_gr_' + konum(), A_KALICI = () => 'dag_km_grk_' + konum(), A_AYAR = 'dag_km_gr_ayar';
    const oku = (a, v) => { try { const x = JSON.parse(localStorage.getItem(a) || 'null'); return x == null ? v : x; } catch (e) { return v; } };
    const yaz = (a, x) => { try { localStorage.setItem(a, JSON.stringify(x)); } catch (e) { } };
    function ayar() { const a = oku(A_AYAR, {}); a.seviye = a.seviye || {}; a.kapali = a.kapali || {}; return a; }
    const aktifMi = (t) => !!TEMA[t] && !ayar().kapali[t];
    const tabanSeviye = (t) => SV[ayar().seviye[t]] ? ayar().seviye[t] : 'normal';
    const sessiz = () => (typeof kmOyunSessiz === 'function' ? kmOyunSessiz() : false);
    function soyle(m) { if (sessiz() || !m) return; if (typeof kmOyunSesliSoyle === 'function') { try { kmOyunSesliSoyle(m); } catch (e) { } } }
    function bip(f, s, gec) { if (sessiz() || typeof sesCal !== 'function') return; setTimeout(() => { try { sesCal(f, s); } catch (e) { } }, gec || 0); }
    const kadro = () => (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || [];
    const okSayisi = () => (typeof _kmOyunOkSayisi !== 'undefined' && _kmOyunOkSayisi) || 3;
    function siradaki() { try { return kadro()[_kmOyunAktifIndex] || null; } catch (e) { return null; } }

    /* ---------------------------------------------------------------- durum */
    function tum() { return oku(A_DURUM(), {}); }
    function durum(t) {
        const T = tum(); let d = T[t];
        if (!d) { d = yeniTur({ tur: 0, kazan: 0, kayip: 0, gecmis: [] }, t, null); T[t] = d; yaz(A_DURUM(), T); }
        return d;
    }
    function kaydet(t, d) { const T = tum(); T[t] = d; yaz(A_DURUM(), T); }
    function yeniTur(d, t, yol) {
        d.tur = (d.tur || 0) + 1; d.kalp = 3; d.ofke = 0; d.turSeri = 0; d.turKisi = Math.max(2, kadro().length || 12);
        d.kalkanVerildi = false; d.olay = null; d.tahmin = null; d.th = {}; d.yol = yol || null; d.bitti = null;
        return d;
    }
    function seviye(t, d) { let i = SEVIYE.indexOf(tabanSeviye(t)); if (d.yol === 'kolay') i--; if (d.yol === 'zor') i++; return SEVIYE[Math.max(0, Math.min(3, i))]; }
    const adim = (t, d) => 100 * SV[seviye(t, d)].k / Math.max(2, d.turKisi);
    function kalici() { return oku(A_KALICI(), { yildiz: 0, kazan: 0, kayip: 0 }); }

    // 2.1 kişinin hedefi: kendi ok ortalaması (son 30 seri) × ok sayısı; yoksa bugünkü sınıf ortalaması; yoksa 6
    function hedef(s, d) {
        let o = null; try { if (s && typeof kmCanavarSporcuOrtalama === 'function') o = kmCanavarSporcuOrtalama(s.g, s.ad); } catch (e) { }
        if (!o && d && d.gecmis && d.gecmis.length >= 3) o = d.gecmis.reduce((a, b) => a + b, 0) / d.gecmis.length;
        return Math.max(1, Math.round((o || 6) * okSayisi()));
    }

    /* ---------------------------------------------------------------- CSS */
    function css() {
        if ($('gr-css')) return;
        const st = document.createElement('style'); st.id = 'gr-css';
        st.textContent = [
            '#gr-serit{display:none;align-items:center;gap:4px 10px;flex-wrap:wrap;margin:0 0 6px;padding:4px 10px;border-radius:14px;background:linear-gradient(90deg,rgba(40,8,14,.92),rgba(14,20,40,.92));border:1px solid rgba(255,120,120,.28);color:#f6f8ff;font:800 14px/1.2 Nunito,Inter,system-ui,sans-serif}',
            '#gr-serit.ac{display:flex}',
            '#gr-serit .gr-kalp{font-size:clamp(18px,2vw,24px);letter-spacing:2px;white-space:nowrap}#gr-serit .gr-kalp s{text-decoration:none;filter:grayscale(1);opacity:.3}',
            '#gr-serit .gr-kalp.son{animation:grTit .45s infinite alternate}',
            '#gr-serit .gr-ofke{flex:1 1 180px;min-width:150px;display:grid;gap:3px}',
            '#gr-serit .gr-ofke small{font-size:12px;color:#ffb3b3;letter-spacing:.03em}',
            '#gr-serit .gr-cubuk{height:9px;border-radius:7px;background:rgba(255,255,255,.1);overflow:hidden}',
            '#gr-serit .gr-cubuk i{display:block;height:100%;background:linear-gradient(90deg,#ff9a3b,#ff3b4e);transition:width .6s}',
            '#gr-serit .gr-cubuk.dolu i{animation:grNabiz .6s infinite alternate}',
            '#gr-serit .gr-cip{padding:3px 8px;border-radius:99px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);white-space:nowrap;font-size:13px}',
            '#gr-serit .gr-tahmin{flex:1 1 360px;min-width:0;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:4px 10px;border-radius:10px;background:rgba(63,208,201,.12);border:1px solid rgba(63,208,201,.45);font-family:"Bungee","Barlow Condensed",Impact,system-ui,sans-serif;font-weight:400;font-size:clamp(13px,1.4vw,18px)}',
            '#gr-serit .gr-tahmin b{color:#ffd23f;font-weight:400}',
            '#gr-serit .gr-olay{flex:1 1 300px;min-width:0;padding:4px 10px;border-radius:10px;background:rgba(255,193,69,.14);border:1px solid rgba(255,193,69,.5);font-size:clamp(12px,1.2vw,16px)}',
            '#gr-serit .gr-olay b{font-family:"Bungee",Impact,system-ui,sans-serif;font-weight:400;color:#ffd23f}',
            '#gr-serit button{font:800 13px Nunito,Inter,system-ui,sans-serif;padding:3px 10px;min-height:30px;border-radius:99px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.07);color:#f6f8ff;cursor:pointer}',
            '.gr-menu{display:flex;gap:6px;flex-wrap:wrap;flex:1 1 100%}.gr-menu button.on{background:#ffd23f;color:#1a1200;border-color:#ffd23f}',
            '.gr-perde{position:fixed;inset:0;z-index:2147482000;display:grid;place-items:center;pointer-events:none;opacity:0;transition:opacity .2s;padding:12px}',
            '.gr-perde.ac{opacity:1}.gr-perde.tik button{pointer-events:auto}',
            '.gr-perde::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,4,12,.35) 15%,rgba(0,4,12,.85) 80%)}',
            '.gr-perde.kirmizi::before{background:radial-gradient(ellipse at center,rgba(120,0,10,.45) 10%,rgba(30,0,4,.9) 80%)}',
            '.gr-ic{position:relative;text-align:center;color:#fff;max-width:min(900px,100%);display:grid;gap:10px;justify-items:center}',
            '.gr-bas{font-family:"Bungee","Barlow Condensed",Impact,system-ui,sans-serif;font-size:clamp(26px,5.4vw,70px);line-height:1;text-shadow:0 5px 0 #000;animation:grGir .35s ease-out}',
            '.gr-alt{font:900 clamp(15px,2vw,26px)/1.2 Nunito,Inter,system-ui,sans-serif;color:#e6eefb;text-shadow:0 2px 0 #000}',
            '.gr-dev{font-size:clamp(50px,9vw,120px);line-height:1}',
            '.gr-sayac{font-family:"Bungee",Impact,system-ui,sans-serif;font-size:clamp(40px,8vw,100px);color:#ffd23f;line-height:1}',
            '.gr-dug{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
            '.gr-dug button{font:900 clamp(15px,1.8vw,22px) Nunito,Inter,system-ui,sans-serif;min-height:56px;padding:0 22px;border-radius:16px;border:0;cursor:pointer;background:#ffd23f;color:#1a1200}',
            '.gr-dug button.ikinci{background:rgba(255,255,255,.14);color:#fff}',
            '.gr-yol{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:min(760px,100%)}',
            '.gr-yol button{display:grid;gap:4px;justify-items:center;padding:16px 10px;border-radius:20px;border:3px solid rgba(255,255,255,.2);cursor:pointer;color:#fff;font:900 clamp(14px,1.6vw,19px) Nunito,system-ui,sans-serif}',
            '.gr-yol button i{font-style:normal;font-size:clamp(40px,6vw,74px);line-height:1}.gr-yol button b{font-family:"Bungee",Impact,system-ui,sans-serif;font-weight:400;font-size:clamp(20px,2.8vw,34px)}',
            '.gr-yol .k{background:linear-gradient(180deg,#1f6b3a,#123d22)}.gr-yol .z{background:linear-gradient(180deg,#9b2a14,#4d1208)}',
            '.gr-ust{position:fixed;left:50%;top:max(12px,env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:2147482000;display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:calc(100% - 20px);padding:10px 14px;border-radius:16px;background:rgba(6,14,28,.92);border:2px solid #3fd0c9;color:#fff;font:900 clamp(14px,1.7vw,20px) Nunito,system-ui,sans-serif;animation:grGir .3s ease-out}',
            '.gr-ust button{font:900 14px Nunito,system-ui,sans-serif;min-height:44px;padding:0 14px;border-radius:12px;border:0;background:#3fd0c9;color:#04201f;cursor:pointer}',
            '@keyframes grGir{from{transform:scale(1.3);opacity:0}to{transform:scale(1);opacity:1}}',
            '.gr-ust{animation-name:grUst}@keyframes grUst{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}',
            '@keyframes grTit{from{transform:translateX(-2px)}to{transform:translateX(2px)}}',
            '@keyframes grNabiz{from{filter:brightness(1)}to{filter:brightness(1.6)}}',
            '@keyframes grSars{0%,100%{transform:translate(0)}20%{transform:translate(-8px,4px)}40%{transform:translate(7px,-5px)}60%{transform:translate(-5px,3px)}80%{transform:translate(4px,-2px)}}',
            '.gr-sars{animation:grSars .5s}',
            '@media (prefers-reduced-motion:reduce){.gr-bas,#gr-serit .gr-kalp.son,.gr-sars,.gr-ust{animation:none}}',
            '@media (max-width:600px){#gr-serit{padding:7px 9px;font-size:13px}.gr-yol{grid-template-columns:1fr}}'
        ].join('\n');
        document.head.appendChild(st);
    }

    /* ---------------------------------------------------------------- şerit */
    let _menu = false, _tema = null;
    function serit() {
        let el = $('gr-serit');
        if (!el) { const an = $('an-simdi'); if (!an || !an.parentNode) return null; el = document.createElement('div'); el.id = 'gr-serit'; an.parentNode.insertBefore(el, an.nextSibling); }
        return el;
    }
    function grTazele(t) {
        css(); _tema = t;
        const el = serit(); if (!el) return;
        if (!TEMA[t] || takimMi()) { el.classList.remove('ac'); el.innerHTML = ''; return; }
        if (!aktifMi(t)) {
            el.innerHTML = '<span class="gr-cip">❤️ Gerilim: kapalı</span><button type="button" id="gr-ac">Aç</button>';
            el.classList.add('ac'); $('gr-ac').onclick = () => { const a = ayar(); delete a.kapali[t]; yaz(A_AYAR, a); grTazele(t); };
            return;
        }
        const d = durum(t);
        // tur başlamadan kadro geldiyse tur uzunluğu = bugün gelen çocuk sayısı
        if (d.turSeri === 0 && kadro().length >= 2 && d.turKisi !== kadro().length) { d.turKisi = kadro().length; kaydet(t, d); }
        const K = kalici(), sv = seviye(t, d), a = adim(t, d), T = TEMA[t];
        // 3.1 tahmin: sıradaki çocuk için (aktif değişirse yenilenir); kalkan görevinin olduğu seride ve 2 seride bir
        const s = siradaki();
        if (s && !d.bitti) {
            const k = s.g + '|' + s.ad;
            // seri bitince oyun sıradakine geçer; atan çocuğun sorusu kaybolmasın diye çocuk başına saklanır (d.th)
            d.th = d.th || {};
            if (!d.th[k]) { d.th[k] = { k, ad: s.ad, hedef: hedef(s, d), sor: d.turSeri % 2 === 1 }; kaydet(t, d); }
            d.tahmin = d.th[k];
        }
        const kalp = d.kalp > 0 ? '❤️'.repeat(d.kalp) + '<s>❤️</s>'.repeat(3 - d.kalp) : '<s>❤️❤️❤️</s>';
        const dolu = d.ofke + a >= 100;
        const olay = d.olay ? OLAY[d.olay] : null;
        el.innerHTML = '<span class="gr-kalp' + (d.kalp <= 1 ? ' son' : '') + '" title="Sınıfın kalbi">' + kalp + '</span>'
            + '<div class="gr-ofke"><small>' + T.ik + ' ' + esc(buyuk(T.dus)) + ' ÖFKESİ' + (dolu ? ' — SALDIRIYA HAZIR!' : '') + '</small><div class="gr-cubuk' + (dolu ? ' dolu' : '') + '"><i style="width:' + Math.min(100, Math.round(d.ofke)) + '%"></i></div></div>'
            + '<span class="gr-cip" title="Herkes bir kez atınca tur biter">Tur ' + d.tur + ' · ' + Math.min(d.turSeri, d.turKisi) + '/' + d.turKisi + '</span>'
            + '<span class="gr-cip">' + SV[sv].ad + (d.yol ? (d.yol === 'zor' ? ' · 🌋 zor yol' : ' · 🌲 kolay yol') : '') + '</span>'
            + '<span class="gr-cip" title="Kazanılan turlar: kolay yol 1, zor yol 3 yıldız. Kalıcı.">⭐ ' + (K.yildiz || 0) + '</span>'
            + '<button type="button" id="gr-ayar-dug" title="Zorluk / kapat">⚙️</button>' + (typeof yeniRozet === 'function' ? yeniRozet() : '')
            + (d.kalp <= 0 && !d.bitti ? '<div class="gr-olay"><b>💔 SON ŞANS!</b> Kalp kalmadı. Seride <b>iki sarı (9-10)</b> atan 1 kalp geri getirir. Tur bitince kalp yoksa kaybederiz.</div>' : '')
            + (olay ? '<div class="gr-olay">' + olay.ik + ' <b>' + olay.ad + '</b> · ' + esc(olay.s) + '</div>' : '')
            + (d.tahmin && d.tahmin.sor && !d.bitti ? '<div class="gr-tahmin">✋ SIRADAKİLER TAHMİN ETSİN: <b>' + esc(buyuk(ilkAd(d.tahmin.ad))) + ' ' + d.tahmin.hedef + '+</b> atar mı? EVET / HAYIR el kaldırın!</div>' : '')
            + (_menu ? '<div class="gr-menu">' + SEVIYE.map((x) => '<button type="button" data-sv="' + x + '" class="' + (tabanSeviye(t) === x ? 'on' : '') + '">' + SV[x].ad + '</button>').join('') + '<button type="button" data-sv="kapat">✕ Bu oyunda kapat</button><button type="button" data-sv="sifir">↺ Turu yeniden başlat</button></div>' : '');
        el.classList.add('ac');
        $('gr-ayar-dug').onclick = () => { _menu = !_menu; grTazele(t); };
        el.querySelectorAll('.gr-menu button').forEach((b) => b.onclick = () => {
            const v = b.dataset.sv, A = ayar();
            if (v === 'kapat') { A.kapali[t] = 1; yaz(A_AYAR, A); }
            else if (v === 'sifir') { const x = durum(t); yeniTur(x, t, x.yol); x.tur--; x.sayildi = false; kaydet(t, x); }
            else { A.seviye[t] = v; yaz(A_AYAR, A); }
            _menu = false; grTazele(t);
        });
    }
    // Bu beş oyun app.js'te takım modundan zaten muaf (takimGecerliMi); seri kancası takım/çoklu modda hiç çağrılmaz.
    function takimMi() { return false; }

    /* ---------------------------------------------------------------- perdeler (sırayla) */
    const _kuyruk = []; let _calisiyor = false;
    function sahne() { return document.querySelector('#km-oyun-wrap .km-oyun-scene'); }
    // sahnenin atalarında transform var → fixed perde sayfanın (ya da tam ekranın) köküne; sayfa kaydırılmış olsa da hep görünür
    const kok = () => document.fullscreenElement || document.getElementById('karisik-platform') || document.body;
    function sira(f) { _kuyruk.push(f); if (!_calisiyor) sonraki(); }
    function sonraki() { const f = _kuyruk.shift(); if (!f) { _calisiyor = false; if (_tema) grTazele(_tema); return; } _calisiyor = true; let bitti = false; f(() => { if (bitti) return; bitti = true; setTimeout(sonraki, 120); }); }
    function perde(html, ops) {
        const sh = sahne(); if (!sh) return null;
        const p = document.createElement('div'); p.className = 'gr-perde' + (ops && ops.kirmizi ? ' kirmizi' : '') + (ops && ops.tik ? ' tik' : '');
        p.innerHTML = '<div class="gr-ic">' + html + '</div>'; kok().appendChild(p);
        requestAnimationFrame(() => p.classList.add('ac'));
        return p;
    }
    function kapat(p) { if (!p) return; p.classList.remove('ac'); setTimeout(() => p.remove(), 220); }
    function bekle(ms, p, bitti) { const z = setTimeout(() => { kapat(p); bitti(); }, ms); return z; }

    /* ---------------------------------------------------------------- seri sonu */
    function grSeriSonu(t, s, oklar) {
        if (!aktifMi(t) || takimMi() || !s) return;
        css();
        const d = durum(t); if (d.bitti) return;
        const T = TEMA[t], liste = (oklar || []).map((k) => (k && typeof k === 'object' ? k.puan : k));
        const top = liste.reduce((a, v) => a + puan(v), 0), sari = liste.filter(sariMi).length, on = liste.some(onMu);
        const sk = s.g + '|' + s.ad, th = (d.th || {})[sk];
        const h = th ? th.hedef : hedef(s, d);
        const sorulduMu = !!(th && th.sor);
        d.th = {}; // her seriden sonra yeni sorular (sıradakinin sorusu güncel tur sayısına göre)
        const a = adim(t, d), olay = d.olay; d.olay = null;
        d.gecmis = (d.gecmis || []).concat(liste.length ? [top / liste.length] : []).slice(-60);
        d.turSeri++;
        const kotu = top < h;
        let ofkeArtis = 0, notlar = [];
        if (olay === 'sari') { ofkeArtis = sari ? -a : a; notlar.push(sari ? '🟡 Sarı geldi, öfke indi!' : '🟡 Sarı gelmedi, öfke doldu!'); }
        else if (kotu) ofkeArtis = olay === 'cift' ? 2 * a : a;
        if (olay === 'altin' && on) { d.ofke = 0; ofkeArtis = Math.min(0, ofkeArtis); notlar.push('🌟 ALTIN OK! Öfke sıfırlandı!'); }
        if (olay === 'sifa' && on) { if (d.kalp < 3) { d.kalp++; notlar.push('💚 ŞİFA! 1 kalp geri geldi!'); } else { ofkeArtis -= a; notlar.push('💚 Kalpler dolu, öfke indi!'); } }
        if (d.kalp <= 0 && sari >= 2) { d.kalp = 1; notlar.push('💖 SON ŞANS TUTTU! 1 kalp geri geldi!'); }
        d.ofke = Math.max(0, d.ofke + ofkeArtis);
        let saldiri = false;
        if (d.ofke >= 100) { d.ofke = 0; d.kalkanVerildi = false; saldiri = true; if (d.kalp > 0) d.kalp--; }
        // tur sonu?
        const turBitti = d.turSeri >= d.turKisi;
        // sıradaki seri için sürpriz kart (4.1): turda her 3 seride bir
        let yeniOlay = null;
        if (!turBitti && d.turSeri % 3 === 0) { const l = Object.keys(OLAY); yeniOlay = l[Math.floor(Math.random() * l.length)]; d.olay = yeniOlay; }
        // 3.2 kalkan görevi: bir sonraki kötü seri saldırı getirecekse (bir kez / saldırı döngüsü)
        const kalkanGorevi = !turBitti && !d.kalkanVerildi && d.ofke + adim(t, d) >= 100;
        if (kalkanGorevi) d.kalkanVerildi = true;
        d.tahmin = null;
        if (turBitti) d.bitti = d.kalp > 0 ? 'kazandi' : 'kaybetti';
        kaydet(t, d);

        // --- gösterim sırası
        if (sorulduMu) sira((bitti) => tahminSonuc(t, s, top, h, bitti));
        if (notlar.length) sira((bitti) => { const p = perde('<div class="gr-bas" style="font-size:clamp(22px,4vw,52px)">' + notlar.map(esc).join('<br>') + '</div>'); bip(880, .15); bip(1320, .25, 120); bekle(2000, p, bitti); });
        if (saldiri) sira((bitti) => saldiriGoster(t, d, bitti));
        if (turBitti) sira((bitti) => turSonu(t, bitti));
        else {
            if (kalkanGorevi) sira((bitti) => kalkanGoster(t, bitti));
            if (yeniOlay) sira((bitti) => olayGoster(yeniOlay, bitti));
        }
        grTazele(t);
    }

    function tahminSonuc(t, s, top, h, bitti) {
        const sh = sahne(); if (!sh) return bitti();
        const evet = top >= h, el = document.createElement('div'); el.className = 'gr-ust';
        el.innerHTML = '<span>✋ ' + esc(buyuk(ilkAd(s.ad))) + ' ' + top + ' attı → <b style="color:#ffd23f">' + (evet ? 'EVET' : 'HAYIR') + '</b> diyenler bildi!</span><button type="button">✋ Çoğunluk bildi</button>' + (typeof yeniRozet === 'function' ? yeniRozet() : '');
        kok().appendChild(el);
        let bir = false; const son = () => { if (bir) return; bir = true; clearTimeout(z); el.remove(); bitti(); };
        const z = setTimeout(son, 6000);
        el.querySelector('button').onclick = (ev) => { ev.stopPropagation(); const d = durum(t); d.ofke = Math.max(0, d.ofke - adim(t, d) / 2); kaydet(t, d); bip(990, .12); bip(1320, .18, 100); if (typeof showToast === 'function') showToast('✋ Sıradakiler bildi — ' + TEMA[t].dus + ' öfkesi azaldı!', 'success'); grTazele(t); son(); };
    }
    function saldiriGoster(t, d, bitti) {
        const T = TEMA[t], sh = sahne();
        const p = perde('<div class="gr-dev">' + T.ik + '💥</div><div class="gr-bas">' + esc(T.sal) + '</div><div class="gr-alt">' + (d.kalp > 0 ? 'Sınıf 1 kalp kaybetti. ' + d.kalp + ' kalp kaldı!' : 'KALP KALMADI! Son şans: iki sarı atan kalp geri getirir.') + '</div>', { kirmizi: true });
        if (sh) { sh.classList.remove('gr-sars'); void sh.offsetWidth; sh.classList.add('gr-sars'); }
        bip(110, .5); bip(80, .6, 180);
        soyle(T.dus + ' saldırdı! ' + (d.kalp > 0 ? d.kalp + ' kalbimiz kaldı.' : 'Kalp kalmadı! Son şans!'));
        bekle(2600, p, bitti);
    }
    function kalkanGoster(t, bitti) {
        const T = TEMA[t], g = GOREV[Math.floor(Math.random() * GOREV.length)];
        const p = perde('<div class="gr-alt" style="color:#ff8a8a">⚠️ ' + esc(buyuk(T.dus)) + ' SALDIRIYA HAZIRLANIYOR!</div><div class="gr-bas" style="font-size:clamp(24px,4.6vw,60px)">SIRADAKİLER:<br>' + esc(g) + '</div><div class="gr-sayac">5</div><div class="gr-dug" hidden><button type="button" class="e">💪 Yaptılar — öfke azalsın</button><button type="button" class="ikinci h">Yapamadılar</button></div>', { tik: true });
        if (!p) return bitti();
        soyle(T.dus + ' saldırıya hazırlanıyor! Sıradakiler: ' + g.replace(/!.*$/, ''));
        let n = 5; const say = p.querySelector('.gr-sayac'), dug = p.querySelector('.gr-dug');
        const zs = setInterval(() => { n--; if (n > 0) { say.textContent = n; bip(660, .08); } else { clearInterval(zs); say.textContent = '🛡️?'; dug.hidden = false; } }, 1000);
        let bir = false; const son = (ok) => { if (bir) return; bir = true; clearInterval(zs); clearTimeout(zo);
            if (ok) { const d = durum(t); d.ofke = Math.max(0, d.ofke - adim(t, d)); kaydet(t, d); bip(784, .12); bip(1046, .2, 110); soyle('Aferin! ' + TEMA[t].dus + ' sakinleşti.'); }
            kapat(p); grTazele(t); bitti(); };
        const zo = setTimeout(() => son(false), 25000);
        p.querySelector('.e').onclick = () => son(true); p.querySelector('.h').onclick = () => son(false);
    }
    function olayGoster(id, bitti) {
        const O = OLAY[id];
        const p = perde('<div class="gr-alt" style="color:#ffd23f;letter-spacing:.1em">SÜRPRİZ KART</div><div class="gr-dev">' + O.ik + '</div><div class="gr-bas">' + O.ad + '</div><div class="gr-alt">' + esc(O.s) + '</div>');
        bip(523, .1); bip(659, .1, 100); bip(784, .2, 200);
        soyle('Sürpriz kart! ' + O.ad.toLocaleLowerCase('tr-TR') + '. ' + O.s);
        bekle(3200, p, bitti);
    }
    function turSonu(t, bitti) {
        const d = durum(t), K = kalici(), T = TEMA[t], kazandi = d.bitti === 'kazandi';
        const kaz = kazandi ? (d.yol === 'zor' ? 3 : 1) : 0;
        if (!d.sayildi) { if (kazandi) { K.yildiz = (K.yildiz || 0) + kaz; K.kazan = (K.kazan || 0) + 1; d.kazan = (d.kazan || 0) + 1; } else { K.kayip = (K.kayip || 0) + 1; d.kayip = (d.kayip || 0) + 1; } d.sayildi = true; yaz(A_KALICI(), K); kaydet(t, d); }
        const p = perde((kazandi
            ? '<div class="gr-dev">🏆</div><div class="gr-bas">TURU KAZANDINIZ!</div><div class="gr-alt">Herkes attı, ' + d.kalp + ' kalp kaldı. +' + kaz + ' ⭐ (toplam ' + K.yildiz + ')</div>'
            : '<div class="gr-dev">' + T.ik + '</div><div class="gr-bas">BU TURU ' + esc(buyuk(T.dus)) + ' KAZANDI</div><div class="gr-alt">Herkes attı ama kalp kalmadı. Rövanş!</div>')
            + '<div class="gr-alt" style="margin-top:6px">SIRADAKİ TUR · SINIF OYLASIN, EL KALDIRIN:</div>'
            + '<div class="gr-yol"><button type="button" class="k"><i>🌲</i><b>KOLAY YOL</b><span>daha az öfke · 1 ⭐</span></button><button type="button" class="z"><i>🌋</i><b>ZOR YOL</b><span>daha çok öfke · 3 ⭐</span></button></div>', { tik: true, kirmizi: !kazandi });
        if (!p) return bitti();
        if (kazandi) { bip(784, .15); bip(988, .15, 140); bip(1318, .3, 280); } else { bip(220, .4); bip(165, .5, 260); }
        soyle(kazandi ? 'Turu kazandınız! Şimdi oylayın: kolay yol mu, zor yol mu?' : 'Bu turu ' + T.dus + ' kazandı. Rövanş! Kolay yol mu, zor yol mu?');
        const sec = (yol) => { const x = durum(t); yeniTur(x, t, yol); x.sayildi = false; kaydet(t, x); kapat(p); bip(660, .1); grTazele(t); bitti(); };
        p.querySelector('.k').onclick = () => sec('kolay'); p.querySelector('.z').onclick = () => sec('zor');
    }

    /* ---------------------------------------------------------------- geri al */
    function grAnlik(t) { if (!TEMA[t]) return null; return { t, d: JSON.parse(JSON.stringify(durum(t))), k: kalici() }; }
    function grGeriYukle(x) {
        if (!x || !x.t) return;
        // tur sonunda verilen ⭐ geri alınır (kalıcı sayaç da anlık görüntüye döner)
        kaydet(x.t, x.d); if (x.k) yaz(A_KALICI(), x.k);
        _kuyruk.length = 0; document.querySelectorAll('.gr-perde,.gr-ust').forEach((e) => e.remove()); _calisiyor = false;
        grTazele(x.t);
    }

    window.grTazele = grTazele;
    window.grSeriSonu = grSeriSonu;
    window.grAnlik = grAnlik;
    window.grGeriYukle = grGeriYukle;
    window.GR_TEMALAR = Object.keys(TEMA);
    window._grIc = { durum, kaydet, hedef, adim, seviye, kalici, OLAY, SV, yeniTur };
})();
