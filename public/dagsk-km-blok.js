/* ================================================================================================
   🦸 BLOK KAHRAMANLAR — Karışık Sınıf › Oyunlar teması 'blok' (2026-11-03, v372).
   Kullanıcı 8 yaş için oyun istedi; iki taslak turu beğenilmedi, sonra "süper kahraman / canavar + oyun dünyası (blok)
   + hep birlikte büyük düşman" seçti, iki boss taslağına "bu ikisini de yap" dedi.
   KAHRAMANLAR (2026-11-06, v381; kullanıcı: "blok kahramanları çoğalt"): 12 ayrı kahraman (KAHRAMANLAR). Pelerin yine çocuğun rengi. Her çocuğun kahramanı
     kalıcıdır ('dag_km_blokkh_<konum>': 12 saat kuralına girmez, km-ortak ile cihazlara gider); sınıfta 12 kişiye kadar aynı kahraman çıkmaz.
   8 CANAVAR (2026-11-06, v382; kullanıcı: "sadece iki canavar var, en az 7-8 olmalı"): her birinin kendi dünyası, koruduğu yerleşimi, saldırısı (TIPLER/BOSS/DUNYA/VOKSEL).
     Kurallar aynı. Sıra konum başına kalıcı ('dag_km_blokbs_<konum>': {sira, yenilen{tip:n}}; 12 saat kuralına girmez): ertesi ders kalınan canavardan sürer, her gün golemle başlamaz.
     Yeni canavar: VOKSEL + HAREKET + YAPI + BOSS + DUNYA + zeminSus satırı, TIPLER'e ekle. Uzuv (v.u) her karede çizilir, gövde önceden.
   OYUN: Her çocuk blok blok çizilmiş bir süper kahraman (pelerin = kendi rengi). Dev boss'a karşı bütün sınıf:
     🌋 Lav Golemi · 🐉 Gölge Ejder · 🧊 Buz Devi · 🤖 Dev Robot · 🕷️ Dev Örümcek · 🐙 Kraken · 💀 İskelet Kral · 👾 Uzay Canavarı. Sırayla gelirler, üstteki düğmeden seçilebilir.
   Her ok halkasına göre bir süper güç: sarı ⚡ 3 küp (X 4) · kırmızı 👊 2 · mavi ❄️ 1 + boss donar (saldırısı boşa gider) ·
     siyah 🛡️ 1 + şehir/kale onarılır · beyaz 🔨 1 · M 🍌 kayar (0). Her 5 seride boss saldırır (bina yıkar / kaleye dalar).
   ADİL / HEP BİRLİKTE (STANDING): boss, sınıftaki herkes en az bir kez atmadan düşmez — can biterse "SON KÜP" kalır,
     süper ışın şarj olur; son kahraman da atınca HERKES aynı anda ışın atar, ekranda herkesin adı. Tek kahraman yok.
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js). Bu dosya yalnız oyun durumu + çizim:
     blkSahneKur() · blkGuncelle() · blkSeri(s, i, kaydedilecek, done) · blkAnlik() · blkGeriYukle(k) · blkSporcu(g, ad) · blkAyarUygula()
   DURUM 'dag_km_blok_<konum>' (km-ortak ile cihazlara gider, 12 saat kuralıyla sıfırlanır), GÜNE ÖZEL:
     { tarih, no, tip, toplam, can, katki{'g|ad':küp}, atanlar{'g|ad':1}, seri, donmus, sehir[6 bool], duvar, kule[4 bool], yenilenler[] }
   Çizim tek <canvas>; zemin ve golem gövdesi değişince önceden çizilir (her karede yüzlerce küp çizilmez).
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const W = 1200, H = 600;
    const TIPLER = ['golem', 'ejder', 'buz', 'robot', 'orumcek', 'kraken', 'iskelet', 'uzayli'];
    // atis: 'top' = fırlatılan blok, 'isin' = düz ışın. yapi/onar: koruduğu yerleşim. vur: yıktığında, bos: yıkacak yer kalmadığında.
    const BOSS = {
        golem: { ad: 'Lav Golemi', kisa: 'Golem', ikon: '🌋', yapi: '🏠 Şehir', onar: '🏠 Bina onarıldı!', vur: '👊 GOLEM BİR BİNAYI YIKTI!', bos: '👊 GOLEM YUMRUK ATTI!', atis: 'top', atisRenk: '#ff7a2f', parca: ['#6b6f7a', '#5a5e69', '#ff7a2f', '#ff4a1a'] },
        ejder: { ad: 'Gölge Ejder', kisa: 'Ejder', ikon: '🐉', parca: ['#7c5cff', '#4b2a9a', '#a78bfa', '#ffd23f'] },
        buz: { ad: 'Buz Devi', kisa: 'Buz Devi', ikon: '🧊', yapi: '🏔️ Kar Köyü', onar: '🏔️ Ev kurtarıldı!', vur: '🧊 BUZ DEVİ BİR EVİ EZDİ!', bos: '🧊 BUZ DEVİ KAR FIRTINASI ATTI!', atis: 'top', atisRenk: '#bfefff', parca: ['#9ad8f2', '#7cc3e6', '#e9fbff', '#3f7cff'] },
        robot: { ad: 'Dev Robot', kisa: 'Robot', ikon: '🤖', yapi: '🏙️ Metropol', onar: '🏙️ Kule onarıldı!', vur: '🤖 ROBOT LAZERLE BİR KULE YIKTI!', bos: '🤖 ROBOT LAZER ATEŞLEDİ!', atis: 'isin', atisRenk: '#ff3b3b', ses: 'lazer', parca: ['#8b94a7', '#6f788c', '#ffd23f', '#3fd2ff'] },
        orumcek: { ad: 'Dev Örümcek', kisa: 'Örümcek', ikon: '🕷️', yapi: '🌲 Orman Köyü', onar: '🌲 Ağaç ev kurtuldu!', vur: '🕷️ ÖRÜMCEK BİR AĞAÇ EVİ AĞA SARDI!', bos: '🕷️ ÖRÜMCEK AĞ FIRLATTI!', atis: 'top', atisRenk: '#f2f2f2', parca: ['#2a2233', '#3b2f4a', '#e5484d', '#c0392b'] },
        kraken: { ad: 'Kraken', kisa: 'Kraken', ikon: '🐙', yapi: '⚓ Liman', onar: '⚓ Gemi kurtuldu!', vur: '🐙 KRAKEN BİR GEMİYİ BATIRDI!', bos: '🐙 KRAKEN SU FIŞKIRTTI!', atis: 'isin', atisRenk: '#9fe6ff', parca: ['#b3265a', '#8e1f4a', '#e86a92', '#ffd23f'] },
        iskelet: { ad: 'İskelet Kral', kisa: 'İskelet', ikon: '💀', yapi: '🏚️ Gece Köyü', onar: '🏚️ Ev kurtuldu!', vur: '💀 İSKELET KRAL BİR EVİ YIKTI!', bos: '💀 İSKELET KRAL ATEŞ ATTI!', atis: 'top', atisRenk: '#5fe07a', parca: ['#ece5d0', '#cfc7ae', '#5fe07a', '#ffd23f'] },
        uzayli: { ad: 'Uzay Canavarı', kisa: 'Uzaylı', ikon: '👾', yapi: '🚀 Ay Üssü', onar: '🚀 Kubbe onarıldı!', vur: '👾 CANAVAR BİR KUBBEYİ PATLATTI!', bos: '👾 CANAVAR PLAZMA ATTI!', atis: 'isin', atisRenk: '#7dff6b', ses: 'lazer', parca: ['#4fd35a', '#3bb648', '#a855f7', '#ffffff'] }
    };
    function sonrakiTip(tip) { return TIPLER[(TIPLER.indexOf(tip) + 1) % TIPLER.length]; }
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    const ic = (k) => { try { return typeof kmOyunIcerik !== 'function' || kmOyunIcerik('blok', k); } catch (e) { return true; } };
    function renk(i) { return typeof kmOyunRenk === 'function' ? kmOyunRenk('blok', i) : '#3b82f6'; }
    function azHareket() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
    // Halka → güç
    function guc(v) {
        v = String(v); if (v === 'M' || v === '0') return { tip: 'muz', hasar: 0 };
        const d = v === 'X' ? 10 : +v;
        if (d >= 9) return { tip: 'isin', hasar: v === 'X' ? 4 : 3 };
        if (d >= 7) return { tip: 'yumruk', hasar: 2 };
        if (d >= 5) return { tip: 'buz', hasar: 1 };
        if (d >= 3) return { tip: 'kalkan', hasar: 1 };
        return { tip: 'cekic', hasar: 1 };
    }
    const GUC = {
        isin: { renk: '#ffd23f', yazi: ['POW!', 'ZAAP!', 'SÜPER IŞIN!'] },
        yumruk: { renk: '#ff4a3a', yazi: ['BAM!', 'KABOOM!', 'GÜÇ YUMRUĞU!'] },
        buz: { renk: '#5ec8ff', yazi: ['DONDU! ❄️'] },
        kalkan: { renk: '#9aa4b8', yazi: ['ONARILDI! 🛡️'] },
        cekic: { renk: '#f2f2f2', yazi: ['TAK!', 'TOK!'] },
        muz: { renk: '#ffe14a', yazi: ['ups! 🍌'] }
    };
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];

    /* ---------------- SES (WebAudio sentezi; Oyunlar sessiz anahtarı + kendi düğmesi) ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1' && localStorage.getItem('dag_blk_ses') !== '0'; } catch (e) { return true; } }
    function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
    function ton(f1, f2, dur, tip, vol, gec) {
        const a = ac(); if (!a || !sesAcik()) return; const t = a.currentTime + (gec || 0), o = a.createOscillator(), g = a.createGain();
        o.type = tip || 'square'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .08, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + dur);
        o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
    }
    function gurultu(dur, vol, gec, f) {
        const a = ac(); if (!a || !sesAcik()) return; const t = a.currentTime + (gec || 0), n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const s = a.createBufferSource(); s.buffer = b; const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = f || 1200;
        const g = a.createGain(); g.gain.value = vol || .2; s.connect(fl).connect(g).connect(a.destination); s.start(t);
    }
    const SES = {
        isin() { ton(1400, 300, .3, 'sawtooth', .07); ton(900, 1800, .15, 'square', .04, .05); },
        yumruk() { gurultu(.25, .3, 0, 600); ton(160, 60, .25, 'square', .1); },
        buz() { for (let i = 0; i < 4; i++) ton(1800 + i * 300, 2400 + i * 300, .08, 'triangle', .05, i * .06); },
        kalkan() { ton(500, 900, .15, 'square', .06); ton(700, 1200, .15, 'square', .06, .12); },
        cekic() { ton(800, 500, .07, 'square', .06); },
        muz() { ton(600, 200, .35, 'sine', .08); },
        kup() { ton(300 + Math.random() * 200, 120, .12, 'square', .04); },
        kukreme() { gurultu(1.1, .35, 0, 400); ton(110, 55, 1, 'sawtooth', .12); },
        patlama() { gurultu(1.6, .5, 0, 900); ton(200, 40, 1.2, 'square', .15); },
        zafer() { [523, 659, 784, 1047, 784, 1047].forEach((f, k) => ton(f, f, .18, 'square', .07, k * .14)); },
        sira() { ton(660, 990, .1, 'square', .05); },
        lazer() { ton(1600, 120, .9, 'sawtooth', .1); ton(800, 60, .9, 'square', .07, .05); gurultu(.8, .18, .1, 2000); }
    };

    /* ---------------- DURUM ---------------- */
    function anahtar() { return 'dag_km_blok_' + konum(); }
    let _st = null, _stHam = null, _stKonum = null;
    function seviye() { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a.blokSeri > 0) ? a.blokSeri : 1; } catch (e) { return 1; } }
    // Boss canı (küp): sınıftaki her çocuktan ~1 seri × seviye. Çocuğun ok ortalaması beklenen küpü belirler.
    function toplamHesapla(no) {
        let top = 0;
        liste().forEach((s) => {
            let o = 6; try { if (typeof kmCanavarSporcuOrtalama === 'function') { const a = kmCanavarSporcuOrtalama(s.g, s.ad); if (a > 0) o = a; } } catch (e) { }
            top += 3 * (o >= 9 ? 2.6 : o >= 7 ? 2 : o >= 5 ? 1.4 : 1.1);
        });
        return Math.round(Math.max(18, top * seviye()) * (1 + .1 * Math.min(no, 5)));
    }
    // Kalıcı sıra + kaç kez yenildi: günlük durum silinse de sınıf kaldığı canavardan sürer
    function kaliciAnahtar() { return 'dag_km_blokbs_' + konum(); }
    function kalici() { try { const k = JSON.parse(localStorage.getItem(kaliciAnahtar()) || 'null'); if (k && typeof k === 'object') return { sira: BOSS[k.sira] ? k.sira : TIPLER[0], yenilen: (k.yenilen && typeof k.yenilen === 'object') ? k.yenilen : {} }; } catch (e) { } return { sira: TIPLER[0], yenilen: {} }; }
    function kaliciYaz(k) { try { localStorage.setItem(kaliciAnahtar(), JSON.stringify(k)); } catch (e) { } }
    function yeniBoss(st, tip) {
        st.no = (st.no == null ? 0 : st.no + 1); st.tip = tip || st.tip || TIPLER[0];
        st.toplam = toplamHesapla(st.no); st.can = st.toplam; st.katki = {}; st.atanlar = {}; st.seri = 0; st.donmus = 0;
        st.sehir = [true, true, true, true, true, true]; st.duvar = 3; st.kule = [true, true, true, true];
    }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_stKonum !== konum() || ham !== _stHam || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _stKonum = konum(); _stHam = ham; }
        if (!_st || _st.tarih !== bugun() || !BOSS[_st.tip]) { _st = { tarih: bugun(), yenilenler: [] }; yeniBoss(_st, kalici().sira); _st.no = 0; kaydet(); }
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    // "Herkes" = listede olup gerçekten atış kaydı tutulabilen sporcular (kayıtta bulunmayan bir satır boss'u sonsuza bekletmesin).
    function atabilenler() { return liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad])); }
    function herkesAtti(st) { const l = atabilenler(); return l.length > 0 && l.every((s) => st.atanlar[s.g + '|' + s.ad]); }
    function atanSayi(st) { return atabilenler().filter((s) => st.atanlar[s.g + '|' + s.ad]).length; }
    // Final verisi (boss yenildi): katkı verenlerin hepsi; durum yeni boss'a geçer
    function finalKur(st) {
        const adlar = liste().map((x) => x.g + '|' + x.ad).filter((k2) => st.atanlar[k2]);
        const f = { tip: st.tip, adlar: adlar.map((k2) => ilkAd(k2.slice(k2.indexOf('|') + 1))), anahtarlar: adlar };
        st.yenilenler = (st.yenilenler || []).concat([{ tip: st.tip, adlar: f.adlar, t: Date.now() }]);
        rozetToplu(adlar);
        const sonraki = sonrakiTip(st.tip), k = kalici(); k.yenilen[st.tip] = (k.yenilen[st.tip] || 0) + 1; k.sira = sonraki; kaliciYaz(k);
        yeniBoss(st, sonraki);
        return f;
    }
    // Koç: "⚡ Hep birlikte bitir" — can bitti ama atmayan biri kaldıysa (erken çıktı, bugün atmıyor) finali o an başlatır.
    function blkFinalZorla() {
        const st = durum(); if (st.can > 0 || _toren) return;
        const f = () => { const s2 = durum(); if (s2.can > 0) return; _gorSt = JSON.parse(JSON.stringify(s2)); _golemOn = null; const fin = finalKur(s2); kaydet(); _toren = true; finalGoster(fin); };
        const kalan = atabilenler().length - atanSayi(st);
        if (typeof onayIste === 'function') onayIste('Süper ışın şimdi ateşlensin mi?<br><small>' + kalan + ' kahraman henüz atmadı. Atanların hepsi finalde adıyla görünür.</small>', f, 'Hep birlikte bitir', 'Bekle'); else f();
    }
    function evre(st) { const o = st.can / (st.toplam || 1); return o > .66 ? 1 : o > .33 ? 2 : 3; }
    function rozetToplu(adlar) {
        adlar.forEach((k) => {
            const i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1);
            const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
            const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
            o.blok = o.blok || {}; o.blok.yenen = (o.blok.yenen || 0) + 1; sp.lastModified = Date.now();
        });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---------------- ÇİZİM: yardımcılar ---------------- */
    function koyu(h, k) { const n = parseInt(h.slice(1), 16); let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; r = Math.min(255, r * k); g = Math.min(255, g * k); b = Math.min(255, b * k); return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')'; }
    function kup(c, ox, oy, s, x, y, z, rk, p) {
        const X = ox + (x - z) * s * .866, Y = oy + (x + z) * s * .5 - y * s; p = p || 0;
        c.fillStyle = koyu(rk, 1.15 + p); c.beginPath(); c.moveTo(X, Y - s); c.lineTo(X + s * .866, Y - s * .5); c.lineTo(X, Y); c.lineTo(X - s * .866, Y - s * .5); c.closePath(); c.fill();
        c.fillStyle = koyu(rk, .82 + p); c.beginPath(); c.moveTo(X - s * .866, Y - s * .5); c.lineTo(X, Y); c.lineTo(X, Y + s); c.lineTo(X - s * .866, Y + s * .5); c.closePath(); c.fill();
        c.fillStyle = koyu(rk, .62 + p); c.beginPath(); c.moveTo(X + s * .866, Y - s * .5); c.lineTo(X, Y); c.lineTo(X, Y + s); c.lineTo(X + s * .866, Y + s * .5); c.closePath(); c.fill();
    }
    function isoXY(ox, oy, s, x, y, z) { return [ox + (x - z) * s * .866, oy + (x + z) * s * .5 - y * s]; }
    function tohum(n) { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

    // Canavar vokselleri (yerel ızgara, +z yüzü izleyiciye bakar). Kopma sırası: dış zırh önce, kalp en son (tohumlu karışık).
    // v.kalp: en son kopan çekirdek · v.goz: her karede parlar · v.u: uzuv (her karede hareketle çizilir), v.on: gövdenin önünde, v.uz: gövdeden uzaklık.
    function vokselKur(tohumNo, yap) {
        const h = new Map();
        const ek = (x0, x1, y0, y1, z0, z1, f, o) => { for (let x = x0; x < x1; x++) for (let y = y0; y < y1; y++) for (let z = z0; z < z1; z++) h.set(x + ',' + y + ',' + z, Object.assign({ x, y, z, r: typeof f === 'function' ? f(x, y, z) : f }, o || {})); };
        const kure = (cx, cy, cz, rx, ry, rz, f, o) => { for (let x = Math.floor(cx - rx); x <= cx + rx; x++) for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let z = Math.floor(cz - rz); z <= cz + rz; z++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1) ek(x, x + 1, y, y + 1, z, z + 1, f, o); };
        yap(ek, kure);
        const V = Array.from(h.values()), K = V.filter((v) => v.kalp), m = (a) => K.reduce((t, v) => t + v[a], 0) / (K.length || 1), cx = m('x'), cy = m('y'), cz = m('z'), rn = tohum(tohumNo);
        const uz = (v) => Math.hypot(v.x - cx, (v.y - cy) * .7, v.z - cz);
        V.forEach((v) => { v.sira = (v.kalp ? 1000 : 0) + uz(v) * -10 + rn() * 14; });
        V.slice().sort((a, b) => a.sira - b.sira).forEach((v, i) => { v.k = i; });
        K.reduce((en, v) => uz(v) < uz(en) ? v : en, K[0]).son = 1;
        V.sort((a, b) => (a.x + a.z) - (b.x + b.z) || a.y - b.y);
        return V;
    }
    const VOKSEL = {
        golem: vokselKur(77, (ek) => {
            const tas = (x, y, z) => ((x * 7 + y * 13 + z * 5) % 9 === 0 ? '#ff7a2f' : ((x + y + z) % 3 ? '#6b6f7a' : '#5a5e69'));
            ek(1, 3, 0, 4, 1, 3, tas); ek(5, 7, 0, 4, 1, 3, tas); ek(0, 8, 4, 9, 0, 4, tas); ek(-2, 0, 4, 9, 1, 3, tas); ek(8, 10, 4, 9, 1, 3, tas); ek(-2, 0, 2, 4, 1, 3, '#5a5e69'); ek(8, 10, 2, 4, 1, 3, '#5a5e69'); ek(2, 6, 9, 12, 1, 4, tas);
            ek(3, 5, 10, 11, 3, 4, '#ffe14a', { goz: 1 }); ek(3, 5, 5, 8, 2, 4, '#ff4a1a', { kalp: 1 });
        }),
        // Geniş omuz, buz dikenleri, kocaman baş, dişli ağız
        buz: vokselKur(11, (ek) => {
            const buz = (x, y, z) => ((x * 5 + y * 11 + z * 3) % 7 === 0 ? '#d8f4ff' : ((x + y + z) % 3 ? '#62b4e4' : '#468fc8'));
            ek(1, 3, 0, 3, 1, 4, '#2f6fa8'); ek(5, 7, 0, 3, 1, 4, '#2f6fa8'); ek(0, 8, 3, 9, 0, 5, buz);
            ek(-2, 0, 7, 10, 0, 5, buz); ek(8, 10, 7, 10, 0, 5, buz);
            ek(-2, -1, 10, 12, 1, 2, '#e9fbff'); ek(-2, -1, 10, 12, 3, 4, '#e9fbff'); ek(9, 10, 10, 12, 1, 2, '#e9fbff'); ek(9, 10, 10, 12, 3, 4, '#e9fbff');
            ek(1, 7, 9, 13, 1, 6, buz); ek(2, 3, 13, 15, 3, 4, '#e9fbff'); ek(5, 6, 13, 15, 3, 4, '#e9fbff');
            ek(1, 7, 12, 13, 5, 6, '#d8f4ff'); ek(2, 3, 10, 12, 5, 6, '#0b1f55'); ek(5, 6, 10, 12, 5, 6, '#0b1f55'); ek(2, 3, 11, 12, 5, 6, '#ff3b3b'); ek(5, 6, 11, 12, 5, 6, '#ff3b3b');
            ek(1, 7, 9, 10, 5, 6, '#0b1f55'); [1, 3, 5].forEach((x) => ek(x, x + 1, 9, 10, 5, 6, '#ffffff'));
            ek(3, 5, 5, 7, 3, 5, '#3f7cff', { kalp: 1 });
            const kol = (x) => ({ u: x < 0 ? 0 : 1, on: x > 0, uz: 1 });
            ek(-2, 0, 2, 7, 1, 3, buz, kol(-1)); ek(8, 10, 2, 7, 1, 3, buz, kol(1));
            ek(9, 10, 0, 2, 2, 3, '#7a5230', kol(1)); ek(8, 11, 0, 1, 1, 4, '#bfefff', kol(1));
        }),
        // Kare gövde, sarı-siyah bacak şeritleri, omuz topları, kırmızı vizör, mavi reaktör
        robot: vokselKur(23, (ek) => {
            const m = (x, y) => ((x + y) % 4 === 0 ? '#6f788c' : '#8b94a7'), sarit = (x, y) => ((x + y) % 2 ? '#ffd23f' : '#20242f');
            ek(1, 3, 0, 4, 1, 4, (x, y) => y === 1 ? sarit(x, y) : '#6f788c'); ek(6, 8, 0, 4, 1, 4, (x, y) => y === 1 ? sarit(x, y) : '#6f788c');
            ek(1, 8, 4, 5, 1, 4, '#4a5266'); ek(0, 9, 5, 10, 0, 5, m);
            ek(3, 6, 6, 9, 4, 5, '#3fd2ff', { kalp: 1 }); ek(4, 5, 7, 8, 3, 4, '#bff2ff', { kalp: 1, goz: 1 });
            ek(-3, 0, 8, 11, 1, 4, '#4a5266'); ek(9, 12, 8, 11, 1, 4, '#4a5266'); ek(-2, -1, 9, 10, 4, 6, '#20242f'); ek(10, 11, 9, 10, 4, 7, '#20242f');
            ek(3, 7, 10, 13, 1, 4, m); ek(3, 7, 11, 12, 3, 4, '#ff3b3b', { goz: 1 }); ek(4, 5, 13, 15, 2, 3, '#4a5266'); ek(4, 5, 15, 16, 2, 3, '#ff3b3b', { goz: 1 });
            const kol = (x) => ({ u: x < 0 ? 0 : 1, on: x > 0, uz: 1 });
            ek(-2, 0, 3, 8, 1, 3, m, kol(-1)); ek(9, 11, 3, 8, 1, 3, m, kol(1)); ek(-3, 0, 1, 3, 0, 4, '#4a5266', kol(-1)); ek(9, 12, 1, 3, 0, 4, '#4a5266', kol(1));
        }),
        // Alçak ve geniş: kocaman karın, kırmızı damga, sekiz göz, zehirli dişler, sekiz yürüyen bacak
        orumcek: vokselKur(35, (ek, kure) => {
            const kara = (x, y, z) => ((x + y + z) % 3 ? '#2a2233' : '#3b2f4a');
            kure(4.5, 6, -1, 4.2, 3.4, 3.4, kara); ek(3, 6, 8, 10, -2, 1, '#e5484d'); ek(4, 5, 8, 10, -3, 2, '#e5484d');
            ek(3, 6, 5, 7, -2, 1, '#ff4a1a', { kalp: 1 });
            ek(2, 7, 3, 7, 2, 6, kara);
            [[2, 5], [3, 6], [5, 6], [6, 5], [3, 4], [6, 4]].forEach(([x, y]) => ek(x, x + 1, y, y + 1, 5, 6, '#ff3b3b', { goz: 1 }));
            ek(3, 4, 1, 3, 6, 7, '#f5f0d8'); ek(5, 6, 1, 3, 6, 7, '#f5f0d8');
            const yol = [[1, 5], [2, 6], [3, 7], [4, 7], [5, 6], [6, 4], [7, 2], [7, 0]];
            [-2, 0, 2, 4].forEach((z, li) => {
                yol.forEach(([d, y], uz) => {
                    const r = uz === 3 ? '#e5484d' : (uz % 2 ? '#6a4f8a' : '#8a6bb0');
                    ek(2 - d, 3 - d, y, y + 1, z, z + 1, r, { u: li, on: false, uz });
                    ek(6 + d, 7 + d, y, y + 1, z, z + 1, r, { u: li + 4, on: true, uz });
                });
            });
        }),
        // Sudan çıkan kocaman baş, iki sarı göz, gaga; altı dolanan kol
        kraken: vokselKur(47, (ek, kure) => {
            const et = (x, y, z) => ((x * 3 + y * 5 + z * 7) % 8 === 0 ? '#e86a92' : ((x + y + z) % 3 ? '#b3265a' : '#8e1f4a'));
            kure(5, 7, 3, 4.6, 6.4, 3.8, et);
            ek(2, 4, 7, 9, 6, 7, '#ffd23f', { goz: 1 }); ek(6, 8, 7, 9, 6, 7, '#ffd23f', { goz: 1 }); ek(3, 4, 7, 8, 6, 7, '#111111'); ek(6, 7, 7, 8, 6, 7, '#111111');
            ek(4, 6, 3, 5, 6, 7, '#2a1020'); ek(2, 4, 9, 10, 6, 7, '#5a1030'); ek(6, 8, 9, 10, 6, 7, '#5a1030');
            ek(4, 6, 6, 9, 2, 4, '#ffd23f', { kalp: 1 });
            [[-3, 1, 9, false], [-2, 6, 7, false], [2, 9, 6, true], [8, 9, 6, true], [12, 6, 7, true], [13, 1, 9, true]].forEach(([x, z, boy, on], u) => {
                for (let y = 0; y < boy; y++) { const r = y % 2 ? '#e86a92' : '#b3265a'; ek(x, x + (y < 3 ? 2 : 1), y, y + 1, z, z + (y < 3 ? 2 : 1), r, { u, on, uz: y }); }
            });
        }),
        // Boş kaburga arasından görünen yeşil kalp, oyuk gözlü kafatası, halka taç, yanda mor kılıç
        iskelet: vokselKur(59, (ek) => {
            const k = '#ece5d0', k2 = '#cfc7ae', al = '#ffd23f';
            ek(2, 4, 0, 1, 1, 5, k2); ek(6, 8, 0, 1, 1, 5, k2); ek(2, 3, 1, 3, 2, 3, k); ek(7, 8, 1, 3, 2, 3, k); ek(2, 8, 3, 4, 1, 4, k2);
            [4, 6].forEach((y) => { ek(1, 8, y, y + 1, 1, 2, k); ek(1, 8, y, y + 1, 4, 5, k); ek(1, 2, y, y + 1, 1, 5, k); ek(7, 8, y, y + 1, 1, 5, k); });
            ek(4, 5, 4, 8, 1, 2, k2); ek(3, 6, 4, 7, 2, 4, '#5fe07a', { kalp: 1 });
            ek(0, 9, 7, 8, 1, 5, k);
            ek(2, 7, 8, 12, 0, 5, k);
            ek(2, 4, 10, 12, 4, 5, '#0f0a1e'); ek(5, 7, 10, 12, 4, 5, '#0f0a1e'); ek(3, 4, 10, 11, 4, 5, '#7dff6b', { goz: 1 }); ek(5, 6, 10, 11, 4, 5, '#7dff6b', { goz: 1 });
            ek(4, 5, 9, 10, 4, 5, '#2a2340'); [2, 4, 6].forEach((x) => ek(x, x + 1, 8, 9, 4, 5, '#2a2340'));
            ek(2, 7, 12, 13, 0, 1, al); ek(2, 7, 12, 13, 4, 5, al); ek(2, 3, 12, 13, 0, 5, al); ek(6, 7, 12, 13, 0, 5, al); ek(4, 5, 12, 13, 4, 5, '#e5484d');
            [2, 4, 6].forEach((x) => { ek(x, x + 1, 13, 14, 0, 1, al); ek(x, x + 1, 13, 14, 4, 5, al); });
            const kl = { u: 0, on: false, uz: 1 };
            ek(-1, 0, 3, 7, 2, 3, k, kl); ek(-3, -2, 4, 14, 2, 3, '#a78bfa', kl); ek(-4, -1, 4, 5, 2, 3, al, kl); ek(-3, -2, 2, 4, 2, 3, '#5a3a22', kl); ek(-2, -1, 3, 4, 2, 3, k, kl);
            ek(9, 10, 3, 7, 2, 3, k, { u: 1, on: true, uz: 1 });
        }),
        // Kocaman tek göz, dişli ağız, iki anten, dört dolanan kol
        uzayli: vokselKur(61, (ek, kure) => {
            const yes = (x, y, z) => ((x * 5 + y * 3 + z * 7) % 17 === 0 ? '#a855f7' : ((x + y + z) % 3 ? '#4fd35a' : '#3bb648'));
            kure(5, 7, 3, 5.2, 6.2, 3.7, yes);
            ek(2, 9, 7, 12, 6, 7, '#ffffff'); ek(3, 8, 8, 11, 6, 7, '#e5484d'); ek(4, 7, 8, 11, 6, 7, '#111111'); ek(5, 6, 10, 11, 6, 7, '#ffffff');
            ek(2, 9, 3, 5, 6, 7, '#2a0f2f'); [2, 4, 6, 8].forEach((x) => ek(x, x + 1, 4, 5, 6, 7, '#ffffff')); [3, 5, 7].forEach((x) => ek(x, x + 1, 3, 4, 6, 7, '#ffffff'));
            ek(4, 7, 5, 8, 2, 4, '#7dff6b', { kalp: 1 });
            ek(3, 4, 12, 15, 2, 3, '#3bb648'); ek(3, 4, 15, 16, 2, 3, '#ffd23f', { goz: 1 }); ek(7, 8, 12, 15, 2, 3, '#3bb648'); ek(7, 8, 15, 16, 2, 3, '#ffd23f', { goz: 1 });
            [[-1, 8, 1, -1, false], [-1, 3, 1, -1, false], [10, 8, 1, 1, true], [10, 3, 1, 1, true]].forEach(([x0, y0, z, yon, on], u) => {
                for (let i = 0; i < 6; i++) { const r = i % 2 ? '#3bb648' : '#a855f7'; ek(x0 + i * yon, x0 + i * yon + 1, y0 - Math.floor(i / 2), y0 - Math.floor(i / 2) + 1, z + (u % 2), z + (u % 2) + 1, r, { u, on, uz: i }); }
            });
        })
    };
    const HAREKET = {
        golem: () => [0, 0],
        buz: (v, t) => [0, Math.sin(t * 1.4 + v.u * 3) * 5],
        robot: (v, t) => [0, Math.sin(t * 2 + v.u * 3) * 4],
        orumcek: (v, t) => [0, Math.sin(t * 3.4 + v.u * 1.7) * v.uz * 1.1],
        kraken: (v, t) => [Math.sin(t * 2 + v.y * .55 + v.u) * v.y * 2, Math.cos(t * 1.6 + v.y * .4 + v.u) * v.y * .5],
        iskelet: (v, t) => [0, Math.sin(t * 1.8 + v.u * 2) * 6],
        uzayli: (v, t) => [Math.sin(t * 2.6 + v.uz * .7 + v.u * 2) * v.uz * 2.2, Math.cos(t * 2.1 + v.uz * .6 + v.u) * v.uz * 1.6]
    };
    const BINA = [[-6, 1, '#e8d3a8', 3], [-6, 6, '#c9a0dc', 4], [12, -1, '#a8d8e8', 5], [13, 4, '#f0b8a0', 3], [12, 9, '#e8d3a8', 2], [-4, 11, '#b8e0a8', 3]];
    // Yerleşim küp rengi + boy eki: her dünya kendi evini yapar
    const YAPI = {
        golem: { ek: 0, enkaz: '#8a8a8a', renk: (y, h, a, rk) => (y % 2 && a === 1) ? '#ffe9a8' : rk },
        buz: { ek: 0, enkaz: '#a9c6d8', renk: (y, h, a) => y === h - 1 ? '#ffffff' : (y === 0 && a === 1 ? '#ffd27a' : '#cfeaf9') },
        robot: { ek: 2, enkaz: '#3c4352', renk: (y, h, a, rk, bi) => (y % 2 && a === 1) ? (bi % 2 ? '#ffd23f' : '#3fd2ff') : (bi % 2 ? '#2a3350' : '#3a3160') },
        orumcek: { ek: 2, enkaz: '#4a3a24', renk: (y, h, a) => y < 2 ? (y === 1 && a === 1 ? '#ffd27a' : '#6b4a2b') : ((y + a) % 2 ? '#2f7a3a' : '#3c8f48') },
        kraken: { ek: 0, enkaz: '#3f6f8a', renk: (y, h, a) => y === 0 ? '#7a4a24' : y === h - 1 ? '#e5484d' : (y % 2 ? '#f5f0d8' : (a === 1 ? '#3fd2ff' : '#f5f0d8')) },
        iskelet: { ek: 0, enkaz: '#2a2340', renk: (y, h, a) => y === h - 1 ? '#2a2340' : (y % 2 === 0 && a === 1 ? '#5fe07a' : '#4a3f63') },
        uzayli: { ek: 0, enkaz: '#55575f', renk: (y, h, a) => y === h - 1 ? '#5fd4ff' : (y % 2 && a === 1 ? '#ffd23f' : '#e8ecf3') }
    };
    const ISO = { ox: 520, oy: 250, s: 21 }; // sahne sola kayık: skor kutusu sağ altta

    // Ejder blokları: zincir boyunca parçalar; her parçanın sırası (önce sırt dikenleri, sonra kanat, sonra gövde)
    const EJDER_N = 52;

    /* ---------------- SAHNE ---------------- */
    let _cv = null, _c = null, _boy = { w: 0, h: 0, k: 1, ox: 0, oy: 0 }, _raf = 0, _zemin = null, _zeminTip = null, _golemOn = null, _golemAnahtar = '', _yapiOnC = null, _yapiAnahtar = '';
    let _efekt = [], _parca = [], _yazi = [], _sallan = 0, _isinlar = [], _saldiri = null, _final = null, _gorSt = null, _toren = false, _zaman = [], _aktifZ = 0;
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function panel() { return $('km-oyun-panel-blok'); }
    function boyutla() {
        const p = panel(); if (!p || !_cv) return; const r = p.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
        if (!r.width || !r.height) return;
        _cv.width = Math.round(r.width * d); _cv.height = Math.round(r.height * d); _cv.style.width = r.width + 'px'; _cv.style.height = r.height + 'px';
        const k = Math.min(r.width / W, r.height / H); _boy = { w: r.width, h: r.height, k: k, ox: (r.width - W * k) / 2, oy: (r.height - H * k) / 2, d: d };
        kahramanKutulari();
    }
    // Çocuk yerleri: altta 12'li sıralar (çok kalabalıkta iki sıra, arka sıra küçük)
    function cocukYer(i, n) {
        const sira = n > 12 ? (i < Math.ceil(n / 2) ? 0 : 1) : 0, satirN = n > 12 ? (sira === 0 ? Math.ceil(n / 2) : n - Math.ceil(n / 2)) : n, j = sira === 0 ? i : i - Math.ceil(n / 2);
        // skor kutusu varsayılan olarak sağ altta → kahramanlar sol üçte ikide dizilir (24 çocukta da sığar)
        const ara = Math.min(88, 590 / Math.max(1, satirN)), x0 = 322 - ara * (satirN - 1) / 2;
        return { x: x0 + j * ara + (sira ? ara / 2 : 0), y: sira === 0 ? 586 : 548, o: sira === 0 ? 1 : .82 };
    }
    // Dokununca sıra o çocuğa geçsin: kabuğun ortak data-km-sporcu dinleyicisi için şeffaf kutular
    function kahramanKutulari() {
        const k = $('blk-kutular'); if (!k) return; const n = liste().length, b = _boy;
        k.innerHTML = liste().map((s, i) => { const p = cocukYer(i, n), w = 70 * p.o * b.k, h = 96 * p.o * b.k; return `<button class="blk-kutu" data-km-sporcu="${i}" aria-label="${ilkAd(s.ad)} sıraya" style="left:${b.ox + p.x * b.k - w / 2}px;top:${b.oy + (p.y - 80 * p.o) * b.k}px;width:${w}px;height:${h}px"></button>`; }).join('');
    }
    // Dünyalar: gökyüzü, zemin küpleri, alt bant
    const DUNYA = {
        golem: { gok: ['#6fbfff', '#d6efff'], ufuk: '#b9dcf2', zem: ['#5fb552', '#56a84a'], alt: '#4f9a42' },
        buz: { gok: ['#6fa8dc', '#eaf6ff'], ufuk: '#c3dcef', zem: ['#f1f9ff', '#dcecf7'], alt: '#cfe4f2' },
        robot: { gok: ['#2a1a55', '#ff8a5c'], ufuk: '#3a2a66', zem: ['#3c4352', '#343a47'], alt: '#2b303b' },
        orumcek: { gok: ['#16382f', '#6d9a6e'], ufuk: '#24493b', zem: ['#6c8f4a', '#5f8040'], alt: '#3f5a2c' },
        kraken: { gok: ['#2a6f9e', '#b5e4ee'], ufuk: '#6aa7c0', zem: ['#1f88ba', '#1b7cab'], alt: '#125c86' },
        iskelet: { gok: ['#160f2e', '#5a3a6e'], ufuk: '#241a42', zem: ['#3f3956', '#37324c'], alt: '#272239' },
        uzayli: { gok: ['#05060f', '#1a1640'], ufuk: '#3a3b48', zem: ['#8f919b', '#82848f'], alt: '#5f616c' }
    };
    // Uzaktaki manzara: önceden çizilir
    function zeminSus(c, tip) {
        const d = DUNYA[tip]; c.fillStyle = d.ufuk;
        if (tip === 'golem') { for (let x = 0; x < W; x += 60) { const h = 40 + ((x * 37) % 70); c.fillRect(x, 230 - h, 56, h + 40); } }
        else if (tip === 'buz') { for (let x = 0; x < W; x += 30) { const u = Math.abs(((x + 90) % 300) - 150), h = 170 - u; c.fillStyle = d.ufuk; c.fillRect(x, 270 - h, 30, h); c.fillStyle = '#fff'; c.fillRect(x, 270 - h, 30, Math.min(h, 24)); } }
        else if (tip === 'robot') { const r = tohum(3); for (let x = 0; x < W; x += 46) { const h = 70 + ((x * 41) % 130); c.fillStyle = d.ufuk; c.fillRect(x, 260 - h, 42, h + 30); c.fillStyle = 'rgba(255,210,63,.75)'; for (let y = 260 - h + 8; y < 260; y += 16) for (let a = 6; a < 36; a += 12) if (r() > .55) c.fillRect(x + a, y, 6, 7); } }
        else if (tip === 'orumcek') {
            for (let x = 0; x < W; x += 74) { const h = 110 + ((x * 29) % 90); c.fillStyle = '#16302a'; c.fillRect(x + 28, 280 - h, 18, h); c.fillStyle = d.ufuk; c.fillRect(x, 280 - h - 40, 74, 62); c.fillRect(x + 14, 280 - h - 66, 46, 30); }
            c.strokeStyle = 'rgba(240,240,240,.45)'; c.lineWidth = 2; [[1000, 40], [120, 150]].forEach(([x, y]) => { for (let a = 0; a < 8; a++) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a * .785) * 90, y + Math.sin(a * .785) * 90); c.stroke(); } for (let q = 22; q < 90; q += 22) { c.beginPath(); for (let a = 0; a <= 8; a++) { const X = x + Math.cos(a * .785) * q, Y = y + Math.sin(a * .785) * q; if (a) c.lineTo(X, Y); else c.moveTo(X, Y); } c.stroke(); } });
        }
        else if (tip === 'kraken') { c.fillRect(0, 205, W, 40); c.fillStyle = '#1f88ba'; c.fillRect(0, 232, W, 40); [[140, 196], [980, 200]].forEach(([x, y]) => { c.fillStyle = '#4b6f85'; c.fillRect(x, y, 70, 12); c.fillRect(x + 28, y - 26, 6, 26); c.fillStyle = '#d5e6ef'; c.fillRect(x + 34, y - 24, 22, 18); }); }
        else if (tip === 'iskelet') {
            c.fillStyle = '#ffe9a8'; c.fillRect(980, 46, 80, 80); c.fillStyle = '#d9c88c'; c.fillRect(1000, 66, 16, 16); c.fillRect(1032, 92, 12, 12);
            for (let x = 10; x < W; x += 88) { const h = 40 + ((x * 31) % 34); c.fillStyle = d.ufuk; c.fillRect(x, 270 - h, 34, h); c.fillRect(x + 12, 270 - h - 16, 10, 16); c.fillRect(x + 4, 270 - h - 10, 26, 7); }
        }
        else if (tip === 'uzayli') {
            const r = tohum(19); for (let i = 0; i < 200; i++) { c.fillStyle = 'rgba(255,255,255,' + (.3 + r() * .7) + ')'; const b = r() < .1 ? 3 : 2; c.fillRect(r() * W, r() * 240, b, b); }
            const kx = 1040, ky = 90; for (let x = -7; x <= 7; x++) for (let y = -7; y <= 7; y++) if (x * x + y * y <= 50) { c.fillStyle = ((x * 3 + y * 5) % 5 === 0) ? '#5fb552' : '#3a7fd5'; c.fillRect(kx + x * 8, ky + y * 8, 8, 8); }
            c.fillStyle = d.ufuk; for (let x = 0; x < W; x += 40) { const h = 16 + ((x * 23) % 34); c.fillRect(x, 262 - h, 40, h + 10); }
        }
    }
    function zeminCiz(tip) {
        const z = document.createElement('canvas'); z.width = W * 1.5; z.height = H * 1.5; const c = z.getContext('2d'); c.scale(1.5, 1.5);
        if (tip !== 'ejder') {
            const d = DUNYA[tip]; let g = c.createLinearGradient(0, 0, 0, H * .5); g.addColorStop(0, d.gok[0]); g.addColorStop(1, d.gok[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
            zeminSus(c, tip);
            c.fillStyle = d.alt; c.fillRect(0, 272, W, H - 272);
            for (let x = -9; x < 18; x++) for (let z2 = -7; z2 < 15; z2++) kup(c, ISO.ox, ISO.oy, ISO.s, x, -1, z2, (x + z2) % 2 ? d.zem[0] : d.zem[1]);
            if (tip === 'uzayli') [[-4, 3, 2], [8, 11, 2], [14, 0, 1], [1, 12, 1]].forEach(([x, z2, r]) => { const [X, Y] = isoXY(ISO.ox, ISO.oy, ISO.s, x, 0, z2); c.fillStyle = 'rgba(40,42,52,.45)'; c.beginPath(); c.ellipse(X, Y - ISO.s * .5, r * 24, r * 12, 0, 0, 7); c.fill(); });
            c.fillStyle = d.alt; c.fillRect(0, 500, W, 100);
        } else {
            let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0a26'); g.addColorStop(1, '#3a2a6a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
            const r = tohum(9); for (let i = 0; i < 160; i++) { c.fillStyle = 'rgba(255,255,255,' + (.3 + r() * .7) + ')'; c.fillRect(r() * W, r() * 330, r() < .1 ? 3 : 2, r() < .1 ? 3 : 2); }
            c.fillStyle = '#fff6d0'; c.fillRect(990, 50, 76, 76); c.fillStyle = '#e8dcae'; c.fillRect(1006, 66, 16, 16); c.fillRect(1036, 96, 12, 12);
            c.fillStyle = '#2a2350'; for (let x = 0; x < W; x += 50) { const h = 30 + ((x * 53) % 60); c.fillRect(x, 400 - h, 48, h + 20); }
            c.fillStyle = '#2b2440'; c.fillRect(0, 470, W, 130);
        }
        return z;
    }
    // Dünyanın canlı katmanı, canavarın arkasında (bulut, ışıldak, dalga, sis, yarasa, kayan yıldız)
    function dunyaAnim(c, t, tip) {
        if (tip === 'golem') { [[140, 90], [520, 60], [980, 110]].forEach(([x, y], i) => { const dx = (t * 10 + i * 300) % 1400 - 100; c.fillStyle = 'rgba(255,255,255,.95)'; c.fillRect(x + dx - 60, y, 120, 24); c.fillRect(x + dx - 36, y - 20, 72, 20); }); }
        else if (tip === 'robot') { [[150, 0], [820, 1.5]].forEach(([x, f]) => { const a = Math.sin(t * .7 + f) * .5; c.fillStyle = 'rgba(255,240,180,.13)'; c.beginPath(); c.moveTo(x, 250); c.lineTo(x + Math.sin(a) * 300 - 34, 0); c.lineTo(x + Math.sin(a) * 300 + 34, 0); c.closePath(); c.fill(); }); }
        else if (tip === 'kraken') { c.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 12; i++) c.fillRect(((i * 113 + t * 24) % (W + 80)) - 40, 238 + (i % 3) * 9, 48, 3); }
        else if (tip === 'iskelet') { for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(95,224,122,.09)'; c.fillRect(((i * 340 + t * 16) % (W + 400)) - 400, 240 + i * 34, 420, 26); } c.fillStyle = '#0f0a1e'; for (let i = 0; i < 3; i++) { const x = ((i * 410 + t * 36) % (W + 80)) - 40, y = 70 + i * 34 + Math.sin(t * 2 + i) * 12, k = Math.sin(t * 11 + i) * 7; c.fillRect(x - 4, y - 3, 8, 7); c.fillRect(x - 16, y - 2 - k, 12, 4); c.fillRect(x + 4, y - 2 - k, 12, 4); } }
        else if (tip === 'uzayli') { const p = (t * .14) % 1; if (p < .3) { const x = 1200 - p / .3 * 900, y = 30 + p / .3 * 120; c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(x, y, 26, 3); } }
    }
    // Canavarın önüne düşen parçacıklar (kar, ateş böceği); kahramanların arkasında kalır
    function dunyaOn(c, t, tip) {
        if (tip === 'buz') { c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 46; i++) { const b = 3 + (i % 3) * 2; c.fillRect(((i * 97 + Math.sin(t + i) * 22 + t * 14) % W + W) % W, (i * 53 + t * (34 + (i % 5) * 9)) % 500, b, b); } }
        else if (tip === 'orumcek') { for (let i = 0; i < 18; i++) { c.fillStyle = 'rgba(214,255,120,' + (.35 + .55 * Math.abs(Math.sin(t * 2 + i))) + ')'; c.fillRect(((i * 139) % W) + Math.sin(t * .6 + i) * 34, 110 + (i * 71) % 350 + Math.cos(t * .8 + i) * 22, 5, 5); } }
    }
    // Evler önceden çizilir (her karede onlarca küp çizilmez); yıkılınca yenilenir
    function yapiOn(st, tip) {
        const a = tip + '|' + st.sehir.map((b) => b ? 1 : 0).join(''); if (_yapiOnC && _yapiAnahtar === a) return _yapiOnC;
        const z = document.createElement('canvas'); z.width = W * 1.5; z.height = H * 1.5; const c = z.getContext('2d'); c.scale(1.5, 1.5); const Y = YAPI[tip];
        BINA.forEach(([x, q0, rk, h0], bi) => {
            const sag = st.sehir[bi], h = h0 + Y.ek, hh = sag ? h : 1;
            for (let y = 0; y < hh; y++) for (let a2 = 0; a2 < 2; a2++) for (let q = 0; q < 2; q++) kup(c, ISO.ox, ISO.oy, ISO.s, x + a2, y, q0 + q, sag ? Y.renk(y, h, a2, rk, bi) : Y.enkaz);
            if (!sag) { const [X, Yy] = isoXY(ISO.ox, ISO.oy, ISO.s, x + 1, 1.6, q0 + 1); c.font = '22px system-ui'; c.textAlign = 'center'; c.fillText('💥', X, Yy); }
        });
        _yapiOnC = z; _yapiAnahtar = a; return z;
    }
    function gorunenSayi(st, tip) { const n = VOKSEL[tip].length; return Math.max(st.can > 0 ? 1 : 0, Math.ceil(n * st.can / (st.toplam || 1))); }
    // Gövde önceden çizilir, can değişince yenilenir. Uzuvlar (v.u) burada yok, uzuvCiz'de.
    function golemOnCiz(st) {
        const tip = st.tip, V = VOKSEL[tip], gor = gorunenSayi(st, tip), e = evre(st), son = st.can <= 0;
        const anahtarG = tip + '|' + gor + '|' + e + '|' + son; if (_golemOn && _golemAnahtar === anahtarG) return _golemOn;
        const z = document.createElement('canvas'); z.width = W * 1.5; z.height = H * 1.5; const c = z.getContext('2d'); c.scale(1.5, 1.5);
        V.forEach((v) => {
            if (v.u != null || (son ? !v.son : v.k >= gor)) return;
            let rk = v.r; if (e >= 2 && rk === '#ff7a2f') rk = '#ff9a3a'; if (e >= 2 && v.goz && !v.kalp) rk = '#ff3b3b'; // öfkeli: gözler kızarır
            kup(c, ISO.ox, ISO.oy, ISO.s, v.x + 2, v.y, v.z + 3, rk, (v.kalp && e === 3) || son ? .35 : 0);
        });
        _golemOn = z; _golemAnahtar = anahtarG; return z;
    }
    function uzuvCiz(c, st, tip, t, on) {
        if (st.can <= 0) return; const gor = gorunenSayi(st, tip), h = HAREKET[tip];
        VOKSEL[tip].forEach((v) => { if (v.u == null || v.on !== on || v.k >= gor) return; const [dx, dy] = h(v, t); kup(c, ISO.ox + dx, ISO.oy + dy, ISO.s, v.x + 2, v.y, v.z + 3, v.r); });
    }
    function gozParla(c, st, tip, t) {
        const gor = gorunenSayi(st, tip), e = evre(st), son = st.can <= 0, a = .1 + .14 * Math.abs(Math.sin(t * 3));
        VOKSEL[tip].forEach((v) => {
            if (!v.goz || v.u != null || (son ? !v.son : v.k >= gor)) return; const [X, Y] = isoXY(ISO.ox, ISO.oy, ISO.s, v.x + 2, v.y, v.z + 3);
            c.globalAlpha = a; c.fillStyle = e >= 2 && !v.kalp ? '#ff3b3b' : v.r; c.beginPath(); c.arc(X, Y - ISO.s * .3, ISO.s * .8, 0, 7); c.fill(); c.globalAlpha = 1;
        });
    }
    // Canavarın saldırısı: bir eve (ya da yıkacak yer kalmadıysa önüne) fırlatılır
    function saldiriCiz(c, t) {
        const sa = _saldiri; if (!sa || sa.tip === 'ejder') return; const B = BOSS[sa.tip], p = Math.min(1, (t - sa.t0) / .9); if (p >= 1) return;
        const b = sa.bina != null ? BINA[sa.bina] : null, [hx, hy] = b ? isoXY(ISO.ox, ISO.oy, ISO.s, b[0] + 1, 1, b[1] + 1) : [600, 460], bx = 590, by = 170;
        if (B.atis === 'isin') { c.globalAlpha = 1 - p * .5; c.strokeStyle = B.atisRenk; c.lineWidth = 16; c.beginPath(); c.moveTo(bx, by); c.lineTo(hx, hy); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke(); c.globalAlpha = 1; c.fillStyle = B.atisRenk; c.beginPath(); c.arc(hx, hy, 18 + p * 34, 0, 7); c.fill(); return; }
        for (let q = 0; q < 5; q++) { const f = Math.max(0, p - q * .05), x = bx + (hx - bx) * f, y = by + (hy - by) * f - Math.sin(f * Math.PI) * 130, s = 36 - q * 6; c.save(); c.translate(x, y); c.rotate(t * 8 + q); c.globalAlpha = 1 - q * .17; c.fillStyle = B.atisRenk; c.fillRect(-s / 2, -s / 2, s, s); c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(0, -s / 2, s / 2, s); c.restore(); }
    }
    // Galeri küçük resmi
    function kucukCiz(cv, tip) {
        const c = cv.getContext('2d'), w = cv.width, h = cv.height;
        if (tip === 'ejder') {
            let g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a0a26'); g.addColorStop(1, '#3a2a6a'); c.fillStyle = g; c.fillRect(0, 0, w, h);
            c.fillStyle = '#4e536c'; c.fillRect(0, h - 26, w, 26);
            for (let i = 30; i >= 0; i--) { const f = i * .17, x = w * .78 - i * 5.6, y = 62 + Math.sin(f * 1.6) * 24, s = i === 0 ? 24 : Math.max(6, 18 - i * .35); c.fillStyle = i % 4 ? '#4b2a9a' : '#7c5cff'; c.fillRect(x - s / 2, y - s / 2, s, s); }
            c.fillStyle = '#ffe14a'; c.fillRect(w * .78 + 3, 52, 6, 5);
            return;
        }
        const d = DUNYA[tip]; let g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, d.gok[0]); g.addColorStop(1, d.gok[1]); c.fillStyle = g; c.fillRect(0, 0, w, h);
        c.fillStyle = d.alt; c.fillRect(0, h * .62, w, h);
        const s = 7, ox = w * .5 - 8, oy = h * .54;
        VOKSEL[tip].forEach((v) => kup(c, ox, oy, s, v.x + 2, v.y, v.z + 3, v.r));
    }
    // Ejder zinciri: t anındaki segment konumları
    function ejderSeg(t, st) {
        const e = evre(st), yuk = e === 3 ? 60 : 0, hiz = st.donmus ? .25 : .6, out = [];
        for (let i = 0; i < EJDER_N; i++) { const f = t * hiz - i * .045; out.push([520 + Math.cos(f) * 340, 190 + yuk + Math.sin(f * 2) * 70]); }
        return out;
    }
    function ejderGorunen(st) { return st.can <= 0 ? 1 : Math.max(1, Math.ceil(EJDER_N * 1.6 * st.can / (st.toplam || 1))); }

    /* ---- 12 kahraman: hepsi aynı iskelet (baş -66..-42, gövde -42..-14), kendine özgü kafa + gövde + silah ---- */
    const r = (c, f, x, y, w, h) => { c.fillStyle = f; c.fillRect(x, y, w, h); };
    const goz = (c, f) => { r(c, f || '#fff', -8, -59, 5, 4); r(c, f || '#fff', 3, -59, 5, 4); r(c, '#1b1b24', -6, -58, 2, 2); r(c, '#1b1b24', 5, -58, 2, 2); };
    const KAHRAMANLAR = [
        { id: 'ates', ad: 'Ateş Savaşçısı', ten: '#f2c79a', govde: '#d73204', bacak: '#3b1a10', kafa(c, rk, t) { goz(c); [-12, -6, 0, 6].forEach((x, i) => { const h = 12 + Math.sin(t * 9 + i * 2) * 4; r(c, '#fd8e01', x, -66 - h, 6, h); r(c, '#ffd23f', x + 1, -66 - h * .55, 4, h * .55); }); }, gogus(c) { r(c, '#fd8e01', -5, -38, 10, 12); r(c, '#ffd23f', -2, -33, 4, 7); }, silah(c, t) { r(c, '#fd8e01', 20, -56, 12, 12); r(c, '#ffd23f', 23, -53, 6, 6); r(c, '#ff5a1f', 32 + Math.sin(t * 20) * 2, -53, 6, 6); } },
        { id: 'buz', ad: 'Buz Ninja', ten: '#f2c79a', govde: '#1d3f66', bacak: '#132c48', kafa(c) { r(c, '#1d3f66', -13, -67, 26, 26); r(c, '#f2c79a', -10, -61, 20, 8); goz(c, '#bfefff'); r(c, '#5fd4ff', -13, -66, 26, 4); r(c, '#5fd4ff', 13, -64, 7, 3); r(c, '#5fd4ff', 18, -60, 5, 3); }, gogus(c) { r(c, '#5fd4ff', -2, -41, 4, 26); r(c, '#bfefff', -6, -32, 12, 4); }, silah(c) { r(c, '#bfefff', 20, -60, 4, 14); r(c, '#bfefff', 15, -55, 14, 4); r(c, '#5fd4ff', 20, -55, 4, 4); } },
        { id: 'robot', ad: 'Demir Robot', ten: '#aab4c6', govde: '#7d8aa0', bacak: '#4a556a', kafa(c, rk, t) { r(c, '#aab4c6', -13, -67, 26, 25); r(c, '#1b1f2a', -10, -61, 20, 8); const g = Math.sin(t * 4) > 0 ? '#ff4b3e' : '#c02a20'; r(c, g, -8, -59, 5, 4); r(c, g, 3, -59, 5, 4); r(c, '#1b1f2a', -7, -49, 14, 3); r(c, '#7d8aa0', -1, -75, 2, 8); r(c, '#ff4b3e', -3, -79, 6, 5); }, gogus(c, rk, t) { r(c, '#1b1f2a', -8, -38, 16, 14); r(c, Math.sin(t * 6) > 0 ? '#5fd4ff' : '#2a88b8', -5, -35, 10, 8); }, silah(c) { r(c, '#4a556a', 13, -52, 20, 10); r(c, '#1b1f2a', 33, -50, 5, 6); r(c, '#ff4b3e', 22, -49, 4, 4); } },
        { id: 'sovalye', ad: 'Çelik Şövalye', ten: '#f2c79a', govde: '#8e9bb0', bacak: '#5a6578', kafa(c, rk) { r(c, '#a9b5c8', -13, -68, 26, 27); r(c, '#1b1b24', -9, -59, 18, 4); r(c, '#6f7b90', -1, -68, 2, 27); r(c, rk, -3, -78, 6, 11); r(c, rk, -9, -80, 8, 5); }, gogus(c, rk) { r(c, rk, -7, -38, 14, 16); r(c, '#f5f0d8', -1, -38, 2, 16); r(c, '#f5f0d8', -7, -32, 14, 2); }, silah(c) { r(c, '#d7dee8', 21, -78, 5, 30); r(c, '#ffd23f', 15, -50, 17, 4); r(c, '#5a3a22', 21, -46, 5, 8); } },
        { id: 'buyucu', ad: 'Fırtına Büyücüsü', ten: '#f2c79a', govde: '#4b2a86', bacak: '#2c1a52', kafa(c) { goz(c); r(c, '#ece7da', -11, -50, 22, 8); r(c, '#4b2a86', -16, -67, 32, 6); r(c, '#4b2a86', -10, -77, 20, 10); r(c, '#4b2a86', -6, -87, 12, 10); r(c, '#ffd23f', -2, -74, 4, 4); }, gogus(c) { r(c, '#ffd23f', -6, -28, 12, 3); r(c, '#b79cff', -2, -40, 4, 12); }, silah(c, t) { r(c, '#7a5230', 22, -80, 4, 36); const f = Math.sin(t * 12) > 0 ? '#ffd23f' : '#b79cff'; r(c, f, 18, -88, 12, 10); r(c, '#fff', 22, -85, 4, 4); } },
        { id: 'pilot', ad: 'Uzay Pilotu', ten: '#f2c79a', govde: '#e8ecf3', bacak: '#aeb7c6', kafa(c, rk) { r(c, '#e8ecf3', -14, -69, 28, 28); r(c, '#0f2740', -10, -63, 20, 13); r(c, '#5fd4ff', -8, -61, 6, 4); r(c, rk, -14, -44, 28, 3); }, gogus(c, rk) { r(c, '#1b1f2a', -8, -38, 16, 11); r(c, rk, -6, -36, 4, 3); r(c, '#ff4b3e', 0, -36, 3, 3); r(c, '#7edc9e', 4, -36, 3, 3); r(c, '#ffd23f', -6, -31, 12, 2); }, silah(c, t) { r(c, '#aeb7c6', 13, -52, 14, 9); r(c, '#5fd4ff', 27, -51, 8 + Math.sin(t * 22) * 2, 7); } },
        { id: 'korsan', ad: 'Korsan Kaptan', ten: '#e0ad80', govde: '#6a1e1e', bacak: '#23252f', kafa(c) { goz(c); r(c, '#1b1b24', 2, -60, 8, 6); r(c, '#1b1b24', -12, -62, 24, 2); r(c, '#b3261e', -13, -69, 26, 10); r(c, '#f5f0d8', -5, -66, 3, 3); r(c, '#f5f0d8', 2, -66, 3, 3); r(c, '#b3261e', 13, -64, 6, 3); r(c, '#3b2415', -10, -48, 20, 6); }, gogus(c) { r(c, '#f5f0d8', -3, -41, 6, 14); r(c, '#23252f', -13, -22, 26, 4); r(c, '#ffd23f', -3, -23, 6, 6); }, silah(c) { r(c, '#d7dee8', 19, -72, 5, 24); r(c, '#d7dee8', 24, -72, 3, 6); r(c, '#ffd23f', 15, -49, 13, 4); } },
        { id: 'kurt', ad: 'Gece Kurdu', ten: '#6b7384', govde: '#2f3442', bacak: '#1f232e', kafa(c) { r(c, '#6b7384', -13, -67, 26, 25); r(c, '#6b7384', -13, -75, 8, 9); r(c, '#6b7384', 5, -75, 8, 9); r(c, '#d6a2a2', -11, -72, 4, 5); r(c, '#d6a2a2', 7, -72, 4, 5); r(c, '#ffd23f', -8, -60, 5, 4); r(c, '#ffd23f', 3, -60, 5, 4); r(c, '#aeb5c4', -6, -52, 12, 10); r(c, '#1b1b24', -2, -52, 4, 3); r(c, '#fff', -5, -44, 3, 3); r(c, '#fff', 2, -44, 3, 3); }, gogus(c) { r(c, '#6b7384', -8, -40, 16, 8); r(c, '#ff4b3e', -8, -30, 3, 10); r(c, '#ff4b3e', -2, -32, 3, 10); r(c, '#ff4b3e', 4, -30, 3, 10); }, silah(c) { r(c, '#6b7384', 15, -54, 13, 10); r(c, '#fff', 28, -55, 5, 3); r(c, '#fff', 28, -51, 5, 3); r(c, '#fff', 28, -47, 5, 3); } },
        { id: 'simsek', ad: 'Şimşek Koşucu', ten: '#f2c79a', govde: '#ffb000', bacak: '#8a2b0a', kafa(c) { r(c, '#c21f1f', -13, -68, 26, 15); r(c, '#f2c79a', -9, -60, 18, 7); goz(c); r(c, '#ffd23f', -17, -68, 5, 12); r(c, '#ffd23f', 12, -68, 5, 12); }, gogus(c) { r(c, '#c21f1f', 1, -41, 5, 9); r(c, '#c21f1f', -4, -33, 8, 4); r(c, '#c21f1f', -3, -30, 5, 11); }, silah(c, t) { const f = Math.sin(t * 24) > 0 ? '#fff' : '#ffd23f'; r(c, f, 17, -62, 7, 6); r(c, f, 22, -56, 7, 6); r(c, f, 27, -50, 7, 6); r(c, f, 22, -46, 7, 4); } },
        { id: 'avci', ad: 'Orman Avcısı', ten: '#e6b98c', govde: '#2f6b3a', bacak: '#3a2a18', kafa(c) { r(c, '#2f6b3a', -14, -69, 28, 15); r(c, '#2f6b3a', -14, -55, 5, 13); r(c, '#2f6b3a', 9, -55, 5, 13); r(c, '#1d4a27', -2, -76, 4, 8); goz(c); }, gogus(c) { r(c, '#7a5230', -13, -40, 4, 4); r(c, '#7a5230', -9, -36, 4, 4); r(c, '#7a5230', -5, -32, 4, 4); r(c, '#7a5230', -1, -28, 4, 4); r(c, '#7a5230', 3, -24, 4, 4); r(c, '#7a5230', -13, -22, 26, 3); }, silah(c) { r(c, '#7a5230', 20, -70, 4, 8); r(c, '#7a5230', 24, -62, 4, 20); r(c, '#7a5230', 20, -42, 4, 8); r(c, '#f5f0d8', 19, -66, 2, 28); r(c, '#f5f0d8', 2, -53, 22, 2); r(c, '#ff4b3e', -2, -54, 4, 4); } },
        { id: 'dev', ad: 'Taş Dev', ten: '#8b7a66', govde: '#6d5e4d', bacak: '#4d4236', genis: true, kafa(c) { r(c, '#8b7a66', -14, -67, 28, 25); r(c, '#6d5e4d', -14, -67, 28, 6); r(c, '#fd8e01', -9, -59, 6, 4); r(c, '#fd8e01', 3, -59, 6, 4); r(c, '#3b3127', -8, -50, 16, 4); r(c, '#6d5e4d', 4, -48, 6, 4); }, gogus(c) { r(c, '#8b7a66', -13, -40, 12, 11); r(c, '#8b7a66', 1, -40, 12, 11); r(c, '#fd8e01', -1, -32, 2, 16); }, silah(c) { r(c, '#8b7a66', 13, -56, 20, 18); r(c, '#6d5e4d', 13, -44, 20, 6); r(c, '#fd8e01', 20, -52, 6, 3); } },
        { id: 'golge', ad: 'Gölge Kılıç', ten: '#3a2f55', govde: '#17131f', bacak: '#0f0c15', kafa(c) { r(c, '#17131f', -14, -69, 28, 28); r(c, '#17131f', -9, -77, 18, 9); r(c, '#b6f', -9, -59, 7, 4); r(c, '#b6f', 2, -59, 7, 4); }, gogus(c) { r(c, '#b6f', -7, -38, 14, 2); r(c, '#b6f', -1, -36, 2, 18); r(c, '#b6f', -5, -24, 10, 2); }, silah(c, t) { const f = Math.sin(t * 10) > 0 ? '#c9a2ff' : '#7c5cff'; r(c, f, 21, -84, 4, 38); r(c, '#fff', 22, -84, 2, 38); r(c, '#17131f', 15, -48, 16, 4); } }
    ];
    // Kalıcı atama: önce adın karması; sınıfta boştaki kahramanlar bitmeden aynısı verilmez. Atanan bir daha değişmez.
    function kahramanHarita() {
        const a = 'dag_km_blokkh_' + konum(); let m = {}; try { m = JSON.parse(localStorage.getItem(a) || '{}') || {}; } catch (e) { m = {}; }
        const l = liste().map((s) => s.g + '|' + s.ad).sort(); let degisti = false;
        const kul = {}; l.forEach((k) => { if (m[k] != null && KAHRAMANLAR[m[k]]) kul[m[k]] = (kul[m[k]] || 0) + 1; });
        l.forEach((k) => {
            if (m[k] != null && KAHRAMANLAR[m[k]]) return;
            let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
            const en = Math.min(...KAHRAMANLAR.map((_, i) => kul[i] || 0)); let j = h % KAHRAMANLAR.length; while ((kul[j] || 0) > en) j = (j + 1) % KAHRAMANLAR.length;
            m[k] = j; kul[j] = (kul[j] || 0) + 1; degisti = true;
        });
        if (degisti) { try { localStorage.setItem(a, JSON.stringify(m)); } catch (e) { } }
        return m;
    }
    let _khIm = '', _khM = {};
    function kahramanOf(k) { const im = liste().length + '|' + konum(); if (im !== _khIm || _khM[k] == null) { _khM = kahramanHarita(); _khIm = im; } return KAHRAMANLAR[_khM[k]] || KAHRAMANLAR[0]; }
    function kahramanCiz(c, x, y, rk, ad, t, i, aktif, o, atis, kh) {
        const z = aktif ? Math.abs(Math.sin(t * 6)) * 8 : Math.abs(Math.sin(t * 2 + i)) * 2;
        kh = kh || KAHRAMANLAR[i % KAHRAMANLAR.length];
        c.save(); c.translate(x, y - z); c.scale(o, o);
        c.fillStyle = koyu(rk, .78); c.fillRect(-15, -44, 30, 40 + Math.sin(t * 5 + i) * 3); // pelerin = çocuğun rengi
        const gw = kh.genis ? 32 : 26, ka = kh.genis ? 9 : 8;
        c.fillStyle = kh.bacak; c.fillRect(-11, -14, 9, 14); c.fillRect(2, -14, 9, 14);
        c.fillStyle = kh.govde; c.fillRect(-gw / 2, -42, gw, 28);
        kh.gogus(c, rk, t);
        c.fillStyle = kh.ten; c.fillRect(-12, -66, 24, 24);
        kh.kafa(c, rk, t);
        c.fillStyle = kh.govde; if (atis) { c.fillRect(gw / 2, -48, ka, 8); kh.silah(c, t); } else { c.fillRect(-gw / 2 - ka, -40, ka, 22); c.fillRect(gw / 2, -40, ka, 22); }
        c.restore();
        c.font = '800 ' + (aktif ? 15 : 13) + 'px system-ui,sans-serif'; const w = c.measureText(ad).width + 14, ly = o < 1 ? y - 92 * o - 19 : y + 4;
        c.fillStyle = aktif ? '#ffd23f' : 'rgba(0,0,0,.62)'; c.fillRect(x - w / 2, ly, w, 19);
        c.fillStyle = aktif ? '#2a1d00' : '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ad, x, ly + 10); c.textBaseline = 'alphabetic';
    }
    // Boss'un ekrandaki hedef noktası (ışınların gittiği yer)
    function hedefNokta(st, t) {
        if (st.tip !== 'ejder') {
            const V = VOKSEL[st.tip], gor = V.filter((v) => v.u == null && v.k < Math.ceil(V.length * st.can / (st.toplam || 1)));
            const v = gor.length ? gor[Math.floor(Math.random() * gor.length)] : V.find((x) => x.son);
            const [X, Y] = isoXY(ISO.ox, ISO.oy, ISO.s, v.x + 2, v.y, v.z + 3); return { x: X + Math.sin(t * 1.2) * 3, y: Y - ISO.s * .5, r: v.r };
        }
        const seg = ejderSeg(t, st), i = Math.floor(Math.random() * Math.min(seg.length, 30)); return { x: seg[i][0], y: seg[i][1], r: '#7c5cff' };
    }
    function sahneCiz(ms) {
        const c = _c; if (!c) return; const st = _gorSt || durum(), t = ms / 1000, b = _boy;
        // kutlamada yenilen boss'un dünyası kalır, boss küplere dağılmış (çizilmez); durum çoktan sıradaki boss'a geçti
        const gt = _final ? _final.tip : st.tip, bossYok = !!_final;
        c.setTransform(b.d, 0, 0, b.d, 0, 0); c.fillStyle = gt === 'ejder' ? '#2b2440' : DUNYA[gt].alt; c.fillRect(0, 0, b.w, b.h);
        c.setTransform(b.d * b.k, 0, 0, b.d * b.k, b.d * b.ox, b.d * b.oy);
        if (_sallan > 0) { c.translate((Math.random() - .5) * _sallan, (Math.random() - .5) * _sallan); _sallan *= .9; if (_sallan < .5) _sallan = 0; }
        if (_zeminTip !== gt) { _zemin = zeminCiz(gt); _zeminTip = gt; _golemOn = null; }
        c.drawImage(_zemin, 0, 0, W, H);
        if (gt !== 'ejder') {
            dunyaAnim(c, t, gt);
            c.drawImage(yapiOn(st, gt), 0, 0, W, H);
            const sal = st.donmus ? 0 : Math.sin(t * 1.2) * 3, sv = gt === 'kraken' || gt === 'uzayli' ? (st.donmus ? 0 : Math.sin(t * 1.8) * 5) : 0, atak = _saldiri && _saldiri.tip !== 'ejder' ? Math.sin(Math.min(1, (t - _saldiri.t0) / .9) * Math.PI) : 0;
            if (!bossYok) {
                c.save(); c.translate(sal + atak * -40, sv - atak * 30);
                const ut = st.donmus ? t * .12 : t;
                uzuvCiz(c, st, gt, ut, false);
                c.drawImage(golemOnCiz(st), 0, 0, W, H);
                uzuvCiz(c, st, gt, ut, true);
                gozParla(c, st, gt, t);
                c.restore();
            }
            saldiriCiz(c, t);
            dunyaOn(c, t, gt);
            if (st.donmus && !bossYok) { c.font = '30px system-ui'; c.textAlign = 'center'; [[560, 110], [700, 150], [520, 260], [740, 300], [640, 70]].forEach(([x, y], k) => c.fillText('❄️', x + Math.sin(t * 2 + k) * 6, y + Math.cos(t * 2 + k) * 6)); }
        } else {
            // kale: duvar (seviye) + kuleler
            const kule = (x, h, ok) => { const hh = ok ? h : 2; for (let y = 0; y < hh; y++) { c.fillStyle = y % 2 ? '#5a5f7a' : '#4e536c'; c.fillRect(x, 470 - (y + 1) * 28, 84, 28); c.strokeStyle = 'rgba(0,0,0,.25)'; c.strokeRect(x, 470 - (y + 1) * 28, 84, 28); } if (ok) { for (let k = 0; k < 3; k++) { c.fillStyle = '#5a5f7a'; c.fillRect(x + k * 30, 470 - hh * 28 - 18, 24, 18); } c.fillStyle = '#ffd27a'; c.fillRect(x + 34, 470 - (hh - 1) * 28 + 6, 16, 14); } else { c.font = '22px system-ui'; c.textAlign = 'center'; c.fillText('💥', x + 42, 470 - hh * 28 - 6); } };
            for (let y = 0; y < st.duvar; y++) { c.fillStyle = y % 2 ? '#4a4f6a' : '#555a78'; c.fillRect(150, 470 - (y + 1) * 24, 900, 24); for (let x = 150; x < 1050; x += 50) { c.strokeStyle = 'rgba(0,0,0,.2)'; c.strokeRect(x + (y % 2) * 25, 470 - (y + 1) * 24, 50, 24); } }
            for (let x = 150; x < 1050; x += 40) { c.fillStyle = '#555a78'; c.fillRect(x, 470 - st.duvar * 24 - 16, 24, 16); }
            kule(90, 9, st.kule[0]); kule(1026, 9, st.kule[3]); kule(380, 7, st.kule[1]); kule(736, 7, st.kule[2]);
            // ejder
            if (!bossYok) {
            let seg = ejderSeg(t, st);
            if (_saldiri && _saldiri.tip === 'ejder') { const p = Math.min(1, (t - _saldiri.t0) / 1.4), d = Math.sin(p * Math.PI); seg = seg.map(([x, y], i) => [x + (600 - x) * d * .6 * Math.max(0, 1 - i / 40), y + d * 220 * Math.max(0, 1 - i / 50)]); }
            // can azaldıkça: önce sırt dikenleri (%66 altı), sonra kanatlar küçülür, kuyruktan geriye gövde küpleri düşer
            const oran = st.can / (st.toplam || 1), e = evre(st), son = st.can <= 0, gor = son ? 1 : Math.max(8, Math.ceil(EJDER_N * (.25 + .75 * oran)));
            for (let i = gor - 1; i >= 0; i--) {
                const [x, y] = seg[i], s = i === 0 ? 50 : Math.max(12, 38 - i * .5);
                const rk = son ? '#ffd23f' : (e === 3 ? (i % 4 ? '#6a2a9a' : '#c05cff') : (i % 4 === 0 ? '#7c5cff' : '#4b2a9a'));
                c.fillStyle = rk; c.fillRect(x - s / 2, y - s / 2, s, s); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - s / 2, y + s / 4, s, s / 4);
                if (oran > .66 && i > 3 && i < 40 && i % 4 === 0) { c.fillStyle = '#a78bfa'; c.fillRect(x - 4, y - s / 2 - 12, 8, 12); }
            }
            const [hx, hy] = seg[0]; c.fillStyle = e >= 2 ? '#ff4a3a' : '#ffe14a'; c.fillRect(hx + 6, hy - 12, 10, 8); c.fillStyle = '#fff'; c.fillRect(hx + 18, hy + 6, 14, 5);
            const kanat = son ? 0 : Math.max(0, Math.min(5, Math.round(oran * 6))); if (kanat) { const [wx, wy] = seg[9], kn = Math.sin(t * (st.donmus ? 2 : 6)) * 30; c.fillStyle = 'rgba(124,92,255,.85)'; for (let k = 0; k < kanat; k++) { c.fillRect(wx - 20 - k * 22, wy - 20 - kn * (k / 5) - k * 6, 20, 20); c.fillRect(wx + k * 22, wy - 20 - kn * (k / 5) - k * 6, 20, 20); } }
            if (st.donmus) { c.font = '28px system-ui'; c.textAlign = 'center'; c.fillText('❄️', hx, hy - 40); }
            if (son) { c.fillStyle = 'rgba(255,210,63,.3)'; c.beginPath(); c.arc(hx, hy, 50 + Math.sin(t * 6) * 8, 0, 7); c.fill(); }
            }
        }
        if (!bossYok && st.tip !== 'ejder' && st.can <= 0) { const q = VOKSEL[st.tip].find((v) => v.son), [X, Y] = isoXY(ISO.ox, ISO.oy, ISO.s, q.x + 2, q.y, q.z + 3); c.fillStyle = 'rgba(255,210,63,.3)'; c.beginPath(); c.arc(X, Y - 10, 46 + Math.sin(t * 6) * 8, 0, 7); c.fill(); }
        // ışınlar
        _isinlar = _isinlar.filter((s) => t - s.t0 < .45);
        _isinlar.forEach((s) => { const a = 1 - (t - s.t0) / .45; c.globalAlpha = a; c.strokeStyle = s.renk; c.lineWidth = s.kalin; c.beginPath(); c.moveTo(s.x1, s.y1); c.lineTo(s.x2, s.y2); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = s.kalin / 3; c.stroke(); c.globalAlpha = 1; });
        // kopan küpler
        _parca = _parca.filter((p) => p.y < 640);
        _parca.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += .4; p.d += p.vd; c.save(); c.translate(p.x, p.y); c.rotate(p.d); c.fillStyle = p.r; c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(0, -p.s / 2, p.s / 2, p.s); c.restore(); });
        // kahramanlar
        const l = liste(), n = l.length, ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0;
        c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(0, n > 12 ? 470 : 512, W, 130);
        const atanIdx = _isinlar.length ? _isinlar[_isinlar.length - 1].i : -1;
        // arka sıra önce çizilir
        l.map((s, i) => i).sort((a, b) => cocukYer(a, n).y - cocukYer(b, n).y).forEach((i) => { const p = cocukYer(i, n); kahramanCiz(c, p.x, p.y - 26, renk(i), ilkAd(l[i].ad).slice(0, 9), t, i, i === ai && !_toren, p.o, i === atanIdx || (_final && _final.atis), kahramanOf(l[i].g + '|' + l[i].ad)); });
        // yazılar
        _yazi = _yazi.filter((y) => t - y.t0 < 1.3);
        _yazi.forEach((y) => { const p = (t - y.t0) / 1.3, s = p < .2 ? .5 + p * 3 : 1.1; c.save(); c.globalAlpha = 1 - Math.max(0, p - .6) / .4; c.translate(y.x, y.y - p * 60); c.scale(s, s); c.font = '900 ' + y.boy + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(y.m, 0, 0); c.fillStyle = y.renk; c.fillText(y.m, 0, 0); c.restore(); });
        // final: isim yağmuru + konfeti
        if (_final) {
            const p = (t - _final.t0);
            _final.konf.forEach((k) => { k.y += k.v; k.x += Math.sin(t * 2 + k.f) * .8; if (k.y > 620) k.y = -10; c.fillStyle = k.r; c.fillRect(k.x, k.y, 10, 10); });
            if (p > 1.2) { c.globalAlpha = Math.min(1, (p - 1.2) * 2); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(150, 150, 900, 220); c.font = '900 46px system-ui,sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffd23f'; c.fillText('HEP BİRLİKTE YENDİK!', 600, 215);
                c.font = '800 22px system-ui,sans-serif'; c.fillStyle = '#fff'; const sat = []; let cur = ''; _final.adlar.forEach((a) => { if ((cur + a).length > 46) { sat.push(cur); cur = ''; } cur += (cur ? ' · ' : '') + a; }); if (cur) sat.push(cur); sat.slice(0, 4).forEach((s, i) => c.fillText(s, 600, 262 + i * 30)); c.globalAlpha = 1; }
        }
    }
    function dongu(ms) {
        _raf = 0;
        const p = panel(); if (!p || !p.isConnected || !_cv || (typeof _kmOyunAktifTema !== 'undefined' && _kmOyunAktifTema !== 'blok')) return;
        if (!document.hidden) { if (ms - _aktifZ >= 31) { _aktifZ = ms; try { sahneCiz(ms); } catch (e) { } } }
        _raf = requestAnimationFrame(dongu);
    }
    function dongBaslat() { if (!_raf) _raf = requestAnimationFrame(dongu); }

    /* ---------------- HUD ---------------- */
    function hudCiz() {
        const st = (_gorSt && !_final) ? _gorSt : durum(), h = $('blk-hud'); if (!h) return;
        const n = 24, dolu = st.can <= 0 ? 0 : Math.max(1, Math.round(st.can / (st.toplam || 1) * n)), e = evre(st);
        const atan = atanSayi(st), top = atabilenler().length;
        const durumYazi = st.tip !== 'ejder' ? BOSS[st.tip].yapi + ' ' + st.sehir.filter(Boolean).length + '/6' : '🧱 Duvar ' + st.duvar + '/5 · 🏰 ' + st.kule.filter(Boolean).length + '/4';
        const sonra5 = 5 - (st.seri % 5);
        h.innerHTML = `<div class="blk-bas"><b>${BOSS[st.tip].ikon} ${BOSS[st.tip].ad.toLocaleUpperCase('tr-TR')}</b><span>${st.can <= 0 ? '⚡ SON KÜP — herkes atınca hep birlikte!' : ['', 'Zırhlı', 'Öfkeli!', 'Son güç!'][e]}</span></div>
          <div class="blk-can" aria-label="Boss canı">${Array.from({ length: n }, (_, i) => `<i class="${i < dolu ? (i < n * .3 ? 'k' : 'd') : ''}"></i>`).join('')}</div>
          <div class="blk-alt">${liste()[typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1] ? '<span id="blk-sira-kh" class="blk-sira-kh">' + ilkAd(liste()[_kmOyunAktifIndex].ad) + ': ' + kahramanOf(liste()[_kmOyunAktifIndex].g + '|' + liste()[_kmOyunAktifIndex].ad).ad + '</span>' : ''}<span title="Bu boss'a en az bir ok atan kahraman">🦸 ${atan}/${top} kahraman attı</span><span>${durumYazi}</span>${st.can <= 0 && !_toren ? '<button class="blk-bitir" id="blk-bitir">⚡ Hep birlikte bitir</button>' : ''}${ic('saldiri') ? `<span>${st.donmus ? '❄️ Boss dondu' : '👊 Saldırı: ' + sonra5 + ' seri sonra'}</span>` : ''}</div>`;
        const bt = $('blk-bitir'); if (bt) bt.onclick = blkFinalZorla;
        const ses = $('blk-ses'); if (ses) ses.textContent = sesAcik() ? '🔊' : '🔇';
        const sb = $('blk-boss-btn'); if (sb) sb.textContent = BOSS[st.tip].ikon + ' ' + BOSS[st.tip].kisa + ' ▾';
    }
    function blkGuncelle() { hudCiz(); kahramanKutulari(); }

    /* ---------------- SERİ ---------------- */
    function blkSeri(s, i, kaydedilecek, done) {
        if (_toren) { zamanTemizle(); _toren = false; _final = null; } _gorSt = null; _golemOn = null;
        const st = durum(), key = s.g + '|' + s.ad, olay = [];
        st.seri = (st.seri || 0) + 1; st.atanlar[key] = 1;
        (kaydedilecek || []).forEach((k) => {
            const g = guc(k.puan), o = { tip: g.tip, hasar: 0, v: String(k.puan) };
            if (g.hasar && st.can > 0) { o.hasar = Math.min(st.can, g.hasar); st.can -= o.hasar; }
            if (g.hasar) st.katki[key] = (st.katki[key] || 0) + g.hasar;
            if (g.tip === 'buz') { st.donmus = 1; }
            if (g.tip === 'kalkan') {
                if (st.tip !== 'ejder') { const y = st.sehir.indexOf(false); if (y >= 0) { st.sehir[y] = true; o.onar = 'bina'; } }
                else { const y = st.kule.indexOf(false); if (y >= 0) { st.kule[y] = true; o.onar = 'kule'; } else if (st.duvar < 5) { st.duvar++; o.onar = 'duvar'; } }
            }
            olay.push(o);
        });
        // boss saldırısı (her 5 seride), mavi okla donmuşsa boşa gider
        let saldiri = null;
        if (ic('saldiri') && st.seri % 5 === 0 && st.can > 0) {
            if (st.donmus) { saldiri = { tip: st.tip, dondu: true }; }
            else if (st.tip !== 'ejder') { const ayakta = st.sehir.map((b, j) => b ? j : -1).filter((j) => j >= 0); if (ayakta.length) { const j = ayakta[st.seri % ayakta.length]; st.sehir[j] = false; saldiri = { tip: st.tip, yikti: j }; } else saldiri = { tip: st.tip }; }
            else if (st.duvar >= 3) { st.duvar--; saldiri = { tip: 'ejder', sekti: true }; }
            else { const ayakta = st.kule.map((b, j) => b ? j : -1).filter((j) => j >= 0); if (ayakta.length) { const j = ayakta[st.seri % ayakta.length]; st.kule[j] = false; saldiri = { tip: 'ejder', yikti: j }; } else saldiri = { tip: 'ejder' }; }
        }
        if (saldiri) st.donmus = 0; // donma bir saldırıyı boşa çıkarır
        // final: can bitti VE herkes attı
        let final = null;
        // v394 (kullanıcı: "son vuruşta animasyon bir sonraki karaktere geçip vurduğu karaktere dönüp patlıyor"): finalKur durumu hemen
        // sıradaki boss'a geçirir; vuruş + patlama bitene kadar ekranda VURULAN boss'un kopyası (_gorSt) çizilir.
        if (st.can <= 0 && herkesAtti(st)) { _gorSt = JSON.parse(JSON.stringify(st)); _golemOn = null; final = finalKur(st); }
        kaydet();
        // görsel
        if (!panel() || !_cv) { try { done(); } catch (e) { } return; }
        const l = liste(), n = l.length, p = cocukYer(i, n), bas = { x: p.x + 14, y: p.y - 26 - 48 * p.o };
        olay.forEach((o, k) => sonra(() => {
            const tt = performance.now() / 1000, hedef = hedefNokta(_gorSt || st, tt), G = GUC[o.tip];
            if (o.tip === 'muz') { SES.muz(); _yazi.push({ m: 'ups! 🍌 kaydı', x: p.x, y: p.y - 120, renk: '#ffe14a', boy: 26, t0: tt }); return; }
            _isinlar.push({ x1: bas.x, y1: bas.y, x2: hedef.x, y2: hedef.y, renk: G.renk, kalin: o.tip === 'isin' ? 14 : 9, t0: tt, i: i });
            SES[o.tip] && SES[o.tip]();
            for (let q = 0; q < Math.max(1, o.hasar) * 2; q++) _parca.push({ x: hedef.x, y: hedef.y, vx: (Math.random() - .5) * 9, vy: -4 - Math.random() * 5, d: 0, vd: (Math.random() - .5) * .4, s: 12 + Math.random() * 8, r: hedef.r });
            if (o.hasar) sonra(SES.kup, 120);
            _yazi.push({ m: rnd(G.yazi) + (o.v === 'X' ? ' X!' : ''), x: hedef.x + 30, y: hedef.y - 30, renk: G.renk, boy: o.tip === 'isin' ? 40 : 32, t0: tt });
            if (o.onar) _yazi.push({ m: o.onar === 'bina' ? BOSS[st.tip].onar : o.onar === 'kule' ? '🏰 Kule onarıldı!' : '🧱 Duvar yükseldi!', x: 600, y: 470, renk: '#c8f7c5', boy: 26, t0: tt + .1 });
            if (o.tip === 'isin' || o.tip === 'yumruk') _sallan = o.tip === 'isin' ? 10 : 6;
            hudCiz();
        }, k * 450));
        const bitis = olay.length * 450 + 300;
        if (saldiri) sonra(() => saldiriGoster(saldiri), bitis);
        const sonraki = bitis + (saldiri ? 1700 : 0);
        sonra(() => {
            if (final) _toren = true;
            try { done(); } catch (e) { }
            hudCiz();
            if (final) finalGoster(final);
            else if (st.can <= 0) { _yazi.push({ m: '⚡ SON KÜP! ' + (atabilenler().length - atanSayi(st)) + ' kahraman daha atınca hep birlikte!', x: 600, y: 120, renk: '#ffd23f', boy: 26, t0: performance.now() / 1000 }); }
        }, sonraki);
    }
    function saldiriGoster(sa) {
        const t = performance.now() / 1000;
        if (sa.dondu) { SES.buz(); _yazi.push({ m: '❄️ Boss saldıracaktı ama DONDU!', x: 600, y: 140, renk: '#9be0ff', boy: 30, t0: t }); hudCiz(); return; }
        _saldiri = { tip: sa.tip, t0: t, bina: sa.yikti }; if (BOSS[sa.tip].ses) SES[BOSS[sa.tip].ses](); else SES.kukreme(); _sallan = 16;
        _yazi.push({ m: sa.tip !== 'ejder' ? (sa.yikti != null ? BOSS[sa.tip].vur : BOSS[sa.tip].bos) : (sa.sekti ? '🐉 EJDER DUVARA ÇARPIP SEKTİ!' : (sa.yikti != null ? '🐉 EJDER BİR KULEYİ DEVİRDİ!' : '🐉 EJDER DALDI!')), x: 600, y: 150, renk: '#ff7a5a', boy: 30, t0: t + .4 });
        _yazi.push({ m: 'Siyah halka 🛡️ onarır!', x: 600, y: 196, renk: '#e8eef8', boy: 20, t0: t + .7 });
        sonra(() => { _saldiri = null; hudCiz(); }, 1600);
    }
    function finalGoster(f) {
        const t = performance.now() / 1000;
        _final = { t0: t, tip: f.tip, adlar: f.adlar, atis: true, konf: Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: -Math.random() * 600, v: 2 + Math.random() * 3, f: Math.random() * 6, r: rnd(['#ff5a5a', '#ffd23f', '#5fe07a', '#3fd2ff', '#b07bff', '#ff9be0']) })) };
        const l = liste(), n = l.length, hedef = f.tip !== 'ejder' ? { x: 560, y: 200 } : { x: 520, y: 200 };
        SES.isin(); SES.patlama();
        l.forEach((s, i) => { if (!f.anahtarlar.includes(s.g + '|' + s.ad)) return; const p = cocukYer(i, n); sonra(() => { _isinlar.push({ x1: p.x + 14, y1: p.y - 74 * p.o, x2: hedef.x, y2: hedef.y, renk: renk(i), kalin: 12, t0: performance.now() / 1000, i: -1 }); }, (i % 8) * 60); });
        for (let q = 0; q < 140; q++) _parca.push({ x: hedef.x + (Math.random() - .5) * 120, y: hedef.y + (Math.random() - .5) * 120, vx: (Math.random() - .5) * 16, vy: -6 - Math.random() * 9, d: 0, vd: (Math.random() - .5) * .5, s: 12 + Math.random() * 12, r: rnd(BOSS[f.tip].parca) });
        _sallan = 22; sonra(SES.zafer, 900);
        try { if (typeof kmOyunBanner === 'function') sonra(() => kmOyunBanner('🦸 ' + BOSS[f.tip].ad.toLocaleUpperCase('tr-TR') + ' YENİLDİ!', 'Hep birlikte: ' + f.adlar.slice(0, 14).join(', ') + (f.adlar.length > 14 ? ' ve ' + (f.adlar.length - 14) + ' kahraman daha' : ''), 'bitis'), 1400); } catch (e) { }
        sonra(() => { _final = null; _gorSt = null; _toren = false; _golemOn = null; _yapiOnC = null; hudCiz(); const st = durum(); _yazi.push({ m: BOSS[st.tip].ikon + ' Yeni boss geliyor: ' + BOSS[st.tip].ad + '!', x: 600, y: 160, renk: '#fff', boy: 32, t0: performance.now() / 1000 }); }, 7600);
    }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }

    /* ---------------- KURULUM ---------------- */
    function nasil() {
        const m = 'Her ok bir süper güç: sarı ⚡ 3 küp (X 4) · kırmızı 👊 2 küp · mavi ❄️ boss donar (saldırısı boşa gider) · siyah 🛡️ yıkılanı onarır · beyaz 🔨 1 küp · ıska 🍌 kayar.<br>Her 5 seride boss saldırır. 8 canavar sırayla gelir. Boss, sınıftaki herkes en az bir ok atmadan düşmez — son vuruşu hep birlikte yaparız!';
        if (typeof onayIste === 'function') onayIste(m, () => { }, 'Tamam', 'Kapat'); else alert(m.replace(/<br>/g, '\n'));
    }
    function bossSec(tip) {
        const st = durum(); if (st.tip === tip) return;
        const f = () => { const s2 = durum(); const no = s2.no; yeniBoss(s2, tip); s2.no = no; kaydet(); const k = kalici(); k.sira = tip; kaliciYaz(k); _golemOn = null; hudCiz(); };
        if (st.can < st.toplam && typeof onayIste === 'function') onayIste('Boss değişsin mi?<br><small>Bu boss\'taki ilerleme sıfırlanır (serileri silinmez).</small>', f, 'Değiştir', 'Vazgeç'); else f();
    }
    // 8 canavar galerisi: küçük resim + kaç kez yenildi; dokununca o canavara geçer
    function galeriAc() {
        const p = panel(); if (!p || $('blk-galeri')) return;
        const st = durum(), k = kalici(), d = document.createElement('div'); d.id = 'blk-galeri'; d.className = 'blk-galeri';
        d.innerHTML = '<div class="blk-galeri-ic" role="dialog" aria-label="Canavar seç"><div class="blk-galeri-bas"><b>Canavar seç</b><button class="blk-btn" id="blk-galeri-kapat" aria-label="Kapat">✕</button></div><div class="blk-galeri-izgara">' + TIPLER.map((t) => '<button class="blk-g-kart' + (t === st.tip ? ' aktif' : '') + '" data-tip="' + t + '"><canvas width="240" height="150" data-kucuk="' + t + '"></canvas><b>' + BOSS[t].ikon + ' ' + BOSS[t].ad + '</b><span>' + (t === st.tip ? 'Şimdi burada' : k.yenilen[t] ? '✓ ' + k.yenilen[t] + ' kez yenildi' : 'Henüz yenilmedi') + '</span></button>').join('') + '</div></div>';
        (document.fullscreenElement || document.body).appendChild(d);
        d.querySelectorAll('canvas[data-kucuk]').forEach((x) => kucukCiz(x, x.dataset.kucuk));
        const kapat = () => d.remove();
        $('blk-galeri-kapat').onclick = kapat;
        d.onclick = (e) => { if (e.target === d) kapat(); };
        d.querySelectorAll('.blk-g-kart').forEach((b) => { b.onclick = () => { kapat(); bossSec(b.dataset.tip); }; });
    }
    function yeniSor() {
        const f = () => { const st = durum(); yeniBoss(st, st.tip); kaydet(); _golemOn = null; zamanTemizle(); _toren = false; _final = null; _gorSt = null; hudCiz(); if (typeof showToast === 'function') showToast('🔄 Boss baştan başladı', 'success'); };
        if (typeof onayIste === 'function') onayIste('Boss baştan başlasın mı?<br><small>Can dolar, şehir/kale onarılır (sporcuların serileri silinmez).</small>', f, 'Baştan başlat', 'Vazgeç'); else f();
    }
    function blkSahneKur() {
        const p = panel(); if (!p) return; css();
        zamanTemizle(); _toren = false; _final = null; _gorSt = null; _isinlar = []; _parca = []; _yazi = []; _saldiri = null; _golemOn = null; _zeminTip = null;
        p.innerHTML = `<canvas id="blk-cv" aria-label="Blok Kahramanlar sahnesi"></canvas><div id="blk-kutular"></div>
          <div class="blk-hud" id="blk-hud"></div>
          <div class="blk-ust"><button class="blk-boss-btn" id="blk-boss-btn" title="Canavar seç" aria-haspopup="dialog"></button>
            <button class="blk-btn" id="blk-ses" title="Ses">🔊</button><button class="blk-btn" id="blk-nasil" title="Nasıl oynanır?">❓</button><button class="blk-btn" id="blk-yeni-btn" title="Boss baştan">🔄</button></div>`;
        _cv = $('blk-cv'); _c = _cv.getContext('2d');
        $('blk-boss-btn').onclick = galeriAc;
        $('blk-ses').onclick = () => { try { localStorage.setItem('dag_blk_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); if (sesAcik()) SES.sira(); };
        $('blk-nasil').onclick = nasil; $('blk-yeni-btn').onclick = yeniSor;
        boyutla();
        if (window.ResizeObserver) { if (p._blkRo) p._blkRo.disconnect(); p._blkRo = new ResizeObserver(() => boyutla()); p._blkRo.observe(p); }
        hudCiz(); dongBaslat();
        if (azHareket()) sahneCiz(performance.now());
    }

    /* ---------------- GERİ AL / CHIP / AYAR ---------------- */
    function blkAnlik() { return JSON.parse(JSON.stringify(durum())); }
    window.blkKahraman = (k) => kahramanOf(k).ad;
    window._blkKahramanlar = () => KAHRAMANLAR.map((x) => x.ad);
    window._blkBosslar = () => TIPLER.slice();
    window._blkCizDene = () => sahneCiz(performance.now()); // test: sahne hatası döngüde yutulur, burada görünür
    function blkGeriYukle(k) {
        if (!k) return;
        // geri alınan seri bir canavarı yendiyse kalıcı sıra + sayı da geri döner
        const simdi = _st && _st.yenilenler ? _st.yenilenler : [], eski = k.yenilenler || [], ka = kalici();
        simdi.slice(eski.length).forEach((y) => { if (ka.yenilen[y.tip] > 0) ka.yenilen[y.tip]--; });
        ka.sira = BOSS[k.tip] ? k.tip : ka.sira; kaliciYaz(ka);
        zamanTemizle(); _toren = false; _final = null; _gorSt = null; _st = k; _stKonum = konum(); kaydet(); _golemOn = null; if (panel()) hudCiz(); }
    function blkSporcu(g, ad) { const st = durum(); return Math.round(st.katki[g + '|' + ad] || 0); }
    function blkAyarUygula() { const st = durum(); if (_toren) return; const yeni = toplamHesapla(st.no); if (!yeni || yeni === st.toplam) return; const oran = st.can / (st.toplam || 1); st.toplam = yeni; st.can = Math.round(oran * yeni); kaydet(); _golemOn = null; hudCiz(); }

    function css() {
        if ($('blk-css')) return;
        const st = document.createElement('style'); st.id = 'blk-css';
        st.textContent = `
.km-oyun-panel-blok{padding:0;background:#2b2440;overflow:hidden}
#blk-cv{position:absolute;left:0;top:0;display:block}
#blk-kutular{position:absolute;inset:0;pointer-events:none}.blk-kutu{position:absolute;pointer-events:auto;background:transparent;border:0;cursor:pointer;border-radius:10px}.blk-kutu:hover{background:rgba(255,255,255,.08)}.blk-kutu:focus-visible{outline:3px solid #ffd23f}
.blk-hud{position:absolute;left:12px;top:10px;width:min(560px,56%);background:rgba(10,12,20,.72);border-radius:14px;padding:8px 12px;color:#fff;pointer-events:none;display:grid;gap:6px}
.blk-bas{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:14px}.blk-bas b{font-size:16px;letter-spacing:.04em}.blk-bas span{font-weight:800;color:#ffd23f;font-size:13px}
.blk-can{display:grid;grid-template-columns:repeat(24,1fr);gap:3px}.blk-can i{height:13px;background:#333;border-radius:2px}.blk-can i.d{background:#ff8a2a}.blk-can i.k{background:#ff3b3b}
.blk-alt{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;font-weight:800;color:#d9e0f0;align-items:center}.blk-bitir{pointer-events:auto;border:0;border-radius:999px;background:#ffd23f;color:#2a1d00;font-weight:900;font-size:12.5px;padding:6px 12px;cursor:pointer}
.blk-ust{position:absolute;right:10px;top:10px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end;max-width:26%}
.blk-boss-btn{border:0;background:#ffd23f;color:#2a1d00;font-weight:900;font-size:13px;border-radius:999px;padding:8px 14px;min-height:38px;cursor:pointer;white-space:nowrap}
.blk-galeri{position:fixed;inset:0;z-index:30000;background:rgba(6,8,16,.78);display:flex;align-items:center;justify-content:center;padding:12px}
.blk-galeri-ic{background:#14172a;border-radius:18px;padding:12px 14px;width:min(860px,100%);max-height:100%;overflow:auto;color:#fff}
.blk-galeri-bas{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:17px}
.blk-galeri-izgara{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.blk-g-kart{border:2px solid transparent;background:#222642;border-radius:14px;padding:6px 6px 9px;color:#fff;cursor:pointer;display:grid;gap:3px;text-align:center;min-width:0}.blk-g-kart.aktif{border-color:#ffd23f}.blk-g-kart canvas{width:100%;height:auto;border-radius:9px;display:block}.blk-g-kart b{font-size:13px}.blk-g-kart span{font-size:11px;font-weight:700;color:#b8c0d8}
.blk-btn{background:rgba(10,12,20,.72);border:0;color:#fff;border-radius:999px;width:36px;height:36px;font-size:16px;cursor:pointer}
@media (max-width:760px){.blk-galeri-izgara{grid-template-columns:repeat(2,1fr)}.blk-hud{width:calc(100% - 20px);left:10px;top:56px}.blk-ust{max-width:none;left:10px;right:10px}.blk-alt{font-size:11px}}`;
        document.head.appendChild(st);
    }

    window.blkSahneKur = blkSahneKur;
    window.blkGuncelle = blkGuncelle;
    window.blkSeri = blkSeri;
    window.blkAnlik = blkAnlik;
    window.blkGeriYukle = blkGeriYukle;
    window.blkSporcu = blkSporcu;
    window.blkAyarUygula = blkAyarUygula;
    window.blkFinalZorla = blkFinalZorla;
    window.blkDurum = durum; // test/teşhis
})();
