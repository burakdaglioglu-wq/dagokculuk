/* ================================================================================================
   🧟 ZOMBİ SALGINI — Karışık Sınıf › Oyunlar teması 'zombi' (2026-11-06, v381). Son Üs'ün yerine. Kullanıcı Son Üs için "çok kötü, yeni oyun yap" dedi,
   dört farklı oyundan bunu seçti. Teşhis: bütün oyunlar "ok at, can düşsün"; burada can barı yok, ekrandaki kalabalık değişir.
   OYUN: herkes ekranda kendi karakteriyle. Birkaç çocuk zombi başlar. Ok "panzehir" ise (çocuğun KENDİ seviyesine göre) bir zombi iyileşir; zombi çocuk
     önce kendini iyileştirir. Belirli aralıkla zombiler ısırır. Herkes atınca sağlam çoğunluktaysa salgın durur.
   KURALLAR (STANDING): sonuç herkes atmadan belli olmaz (zombi kalmazsa yeni dalga gelir); suç çocuğa yüklenmez: ısırık atan çocuğa değil, sırası gelen kalabalığa;
     tur sırasında puan sıralaması yok; finalde herkesin adı, son atan kahraman değil; koçta "Hep birlikte bitir".
   GÖRÜNÜM (2026-11-07, v383; kullanıcı: "zombi görünümünü daha iyi yapmalıyız", iki canlı taslaktan B "Son barikat"ı seçti): gece sokağı; zombiler barikatın arkasında, sağlamlar önünde.
     Isırılan çocuk barikatı geçer, kurtulan geri koşar. Karakterler piksel, sağlamın elinde yay; tişört rengi zombi olunca solgun kalır. Kurallar değişmedi. Kişiler DOM'da (data-km-sporcu), konum left/top ile: button:active transform'u bozmasın.
   KABUK: skor girişi Oyunlar'ın dock'u. zbSahneKur · zbGuncelle · zbSeri(s, i, kaydedilecek, done) · zbAnlik · zbGeriYukle · zbSporcu · zbAyarUygula · zbFinalZorla.
   Durum 'dag_km_zombi_<konum>' km-ortak ile cihazlara gider, 12 saat kuralıyla sıfırlanır (KM_OYUN_SIFIR_ONEK).
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toLocaleDateString('sv-SE'));
    const konum = () => ((typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan');
    const ilkAd = (ad) => (typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]);
    const liste = () => (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || [];
    const ic = (k) => { try { return typeof kmOyunIcerik !== 'function' || kmOyunIcerik('zombi', k); } catch (e) { return true; } };
    const renk = (i) => (typeof kmOyunRenk === 'function' ? kmOyunRenk('zombi', i) : '#5FD4FF');
    const azHareket = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const puan = (v) => { v = String(v); return v === 'X' ? 10 : (v === 'M' ? 0 : (+v || 0)); };
    const anahtar = () => 'dag_km_zombi_' + konum();
    const kimlik = (s) => s.g + '|' + s.ad;
    const buyuk = (x) => String(x).toLocaleUpperCase('tr-TR');

    /* ---- kurallar (saf) ---- */
    const ISIRIK_ARALIK = 1; // simülasyon: her atışta 1 ısırık, 8-24 çocukta aynı dengeyi veriyor (ok başı %40 iyi atış: ~%80 kazanma, kalabalığın ~%40'ı zombi; kötü gün ~%20)
    function esikOf(ort) { return ort >= 7 ? 9 : ort >= 5 ? 7 : 5; } // yeni başlayan maviye, orta kırmızıya, iyi sarıya vurunca panzehir
    function panzehirSay(puanlar, esik) { return puanlar.filter((p) => p >= esik).length; }
    function baslangicSay(n) { return Math.max(1, Math.round(n / 6)); }
    function isirikSay() { return 1; }
    function kazandi(z, n) { return z < n - z; }
    // Seri sonucu: { iyilesen: [...], isirilan: [...], dalga: bool }. secici(dizi) rastgele seçim (test sabitler).
    function adimHesapla(st, key, puanlar, esik, herkes, secici, dalgaAcik) {
        const r = { iyilesen: [], isirilan: [], dalga: false, panzehir: panzehirSay(puanlar, esik) };
        let hak = r.panzehir > 0 ? 1 : 0; // bir seride en çok bir kişi: oyunu tek çocuk bitiremesin
        if (hak && st.zombi[key]) { r.iyilesen.push(key); hak--; }
        else if (hak) { const adaylar = herkes.filter((k) => st.zombi[k]); if (adaylar.length) r.iyilesen.push(adaylar.slice().sort((a, b) => (st.zamani[a] || 0) - (st.zamani[b] || 0))[0]); }
        r.iyilesen.forEach((k) => { delete st.zombi[k]; delete st.zamani[k]; });
        st.seri = (st.seri || 0) + 1;
        if (st.seri % ISIRIK_ARALIK === 0) {
            const z = herkes.filter((k) => st.zombi[k]).length;
            if (z === 0) { if (dalgaAcik && herkes.length > 1) { r.dalga = true; const a = herkes.filter((k) => !r.iyilesen.includes(k)); const k = secici(a.length ? a : herkes); if (k) { r.isirilan.push(k); st.zombi[k] = 1; st.zamani[k] = st.seri; st.isirik[k] = (st.isirik[k] || 0) + 1; } } }
            else {
                let bos = herkes.filter((k) => !st.zombi[k] && !r.iyilesen.includes(k));
                for (let i = isirikSay(z); i > 0 && bos.length; i--) { // en az ısırılan öncelikli: hep aynı çocuk zombi olmasın
                    const en = Math.min(...bos.map((k) => st.isirik[k] || 0)), k = secici(bos.filter((x) => (st.isirik[x] || 0) === en));
                    st.zombi[k] = 1; st.zamani[k] = st.seri; st.isirik[k] = (st.isirik[k] || 0) + 1; r.isirilan.push(k); bos = bos.filter((x) => x !== k);
                }
            }
        }
        return r;
    }
    const rastgele = (l) => l[Math.floor(Math.random() * l.length)];

    /* ---- durum ---- */
    let _st = null, _ham = null, _kn = null, _z = [], _kilit = false, _kur = '';
    function yeniOyun() { return { tarih: bugun(), zombi: {}, zamani: {}, isirik: {}, atan: {}, kurtardi: {}, seri: 0, faz: 'oyun', basladi: false, finalAdlar: null, kazandi: null }; }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_kn !== konum() || ham !== _ham || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _kn = konum(); _ham = ham; }
        if (!_st || _st.tarih !== bugun()) { _st = yeniOyun(); kaydet(); }
        return _st;
    }
    function kaydet() { try { _ham = JSON.stringify(_st); localStorage.setItem(anahtar(), _ham); } catch (e) { } }
    const atabilenler = () => liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]));
    const turSay = () => { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a.zombiTur > 0) ? a.zombiTur : 1; } catch (e) { return 1; } };
    function ortalama(s) { try { if (typeof kmCanavarSporcuOrtalama === 'function') return kmCanavarSporcuOrtalama(s.g, s.ad) || 0; } catch (e) { } return 0; }
    const herkesAtti = (st) => { const l = atabilenler(); return l.length > 0 && l.every((s) => (st.atan[kimlik(s)] || 0) >= turSay()); };
    const atanSay = (st) => atabilenler().filter((s) => (st.atan[kimlik(s)] || 0) >= turSay()).length;
    const zombiSay = (st) => atabilenler().filter((s) => st.zombi[kimlik(s)]).length;
    function salginBaslat(st) {
        const l = atabilenler().map(kimlik); if (!l.length) return [];
        const z = [], kalan = l.slice();
        for (let i = baslangicSay(l.length); i > 0 && kalan.length; i--) { const k = rastgele(kalan); z.push(k); st.zombi[k] = 1; st.zamani[k] = 0; kalan.splice(kalan.indexOf(k), 1); }
        st.basladi = true; return z;
    }
    function bitir(st) {
        const l = atabilenler();
        st.finalAdlar = l.map((s) => ilkAd(s.ad)); st.kazandi = kazandi(zombiSay(st), l.length); st.faz = 'son';
        l.forEach((s) => { const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (!sp) return; const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.zombi = o.zombi || {}; o.zombi.oyun = (o.zombi.oyun || 0) + 1; if (st.kazandi) o.zombi.kurtulus = (o.zombi.kurtulus || 0) + 1; sp.lastModified = Date.now(); });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---- ses ---- */
    let AC = null;
    const sesAcik = () => { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1'; } catch (e) { return true; } };
    function ton(f, sure, gec, tip, gur) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (gec || 0); o.type = tip || 'square'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(gur || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + sure); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + sure); } catch (e) { } }
    const SES = { kurtar: () => [523, 659, 880].forEach((f, i) => ton(f, 0.16, i * 0.08, 'triangle', 0.09)), isir: () => { ton(110, 0.28, 0, 'sawtooth', 0.12); ton(70, 0.4, 0.12, 'sawtooth', 0.12); }, kacti: () => ton(180, 0.16, 0, 'triangle', 0.06), zafer: () => [392, 523, 659, 784, 1047].forEach((f, i) => ton(f, 0.28, i * 0.14, 'square', 0.07)), yenilgi: () => [220, 185, 147, 110].forEach((f, i) => ton(f, 0.34, i * 0.2, 'sawtooth', 0.09)) };

    /* ---- çizim: kalabalık bir kez kurulur, sınıflar ve konumlar değişir (animasyon ve performans için) ---- */
    const panel = () => $('km-oyun-panel-zombi');
    /* piksel karakter (26x36, iki kare). Sağlam çocuğun elinde yay; zombi olunca tişört rengi solgun kalır, çocuk kim olduğunu kaybetmez. */
    const SAC = ['#2B1B12', '#5A3417', '#8A5A2B', '#C99A4B', '#1C1C24', '#6E2F1E'], TEN = ['#F2C79A', '#E6B98C', '#D9A578', '#F5D0A9'];
    const karma = (k) => { let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0; return h; };
    const hexMi = (h) => /^#[0-9a-f]{6}$/i.test(String(h));
    const koyu = (h, k) => { const n = parseInt(h.slice(1), 16); return 'rgb(' + Math.min(255, ((n >> 16) & 255) * k | 0) + ',' + Math.min(255, ((n >> 8) & 255) * k | 0) + ',' + Math.min(255, (n & 255) * k | 0) + ')'; };
    const solgun = (h) => { const n = parseInt(h.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, o = (r + g + b) / 3; return 'rgb(' + ((r * .55 + o * .45) * .72 | 0) + ',' + ((g * .55 + o * .45) * .72 | 0) + ',' + ((b * .55 + o * .45) * .72 | 0) + ')'; };
    function kareSaglam(c, ox, a, o) {
        const p = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(ox + x, y, w, h); }, y0 = a ? 0 : 1, g = o.g, g2 = koyu(g, .72), ten = o.ten, t2 = koyu(ten, .82), s = o.sac;
        p(8, 25, 4, 8, '#26324A'); p(14, 25, 4, 8, '#26324A'); p(16, 25, 2, 8, '#1B2438'); p(7, 33, 5, 2, '#14141C'); p(14, 33, 5, 2, '#14141C');
        p(7, 14 + y0, 12, 11, g); p(16, 14 + y0, 3, 11, g2); p(7, 22 + y0, 12, 1, '#3A2A18'); p(19, 15 + y0, 3, 8, g); p(19, 23 + y0, 3, 2, ten); p(4, 15 + y0, 3, 8, g); p(4, 23 + y0, 3, 2, ten);
        for (let i = 0; i < 6; i++) p(8 + i, 15 + y0 + i, 1, 1, '#7A5230'); // sadak kayışı
        p(22, 5 + y0, 1, 2, '#8A5A2B'); p(23, 7 + y0, 1, 4, '#8A5A2B'); p(24, 11 + y0, 1, 10, '#7A5230'); p(23, 21 + y0, 1, 4, '#8A5A2B'); p(22, 25 + y0, 1, 2, '#8A5A2B'); p(22, 7 + y0, 1, 18, '#DFE6EA'); // yay
        p(8, 3 + y0, 10, 11, ten); p(16, 3 + y0, 2, 11, t2); p(10, 8 + y0, 2, 2, '#141018'); p(14, 8 + y0, 2, 2, '#141018'); p(11, 11 + y0, 4, 1, '#6B3B2A');
        if (o.stil === 0) { p(7, 1 + y0, 12, 4, s); p(7, 5 + y0, 2, 3, s); }
        else if (o.stil === 1) { p(7, 1 + y0, 12, 4, s); p(6, 4 + y0, 3, 12, s); p(17, 4 + y0, 3, 12, s); }
        else if (o.stil === 2) { p(7, 2 + y0, 12, 3, s); p(8, y0, 2, 2, s); p(12, y0, 2, 2, s); p(16, y0, 2, 2, s); }
        else if (o.stil === 3) { p(7, 1 + y0, 12, 4, s); p(18, 3 + y0, 3, 3, s); p(20, 5 + y0, 2, 8, s); }
        else if (o.stil === 4) { p(6, y0, 14, 5, s); p(5, 3 + y0, 3, 5, s); p(18, 3 + y0, 3, 5, s); }
        else { p(7, 1 + y0, 12, 3, s); p(17, 3 + y0, 2, 4, s); }
    }
    function kareZombi(c, ox, a, o) {
        const p = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(ox + x, y, w, h); }, sil = (x, y, w, h) => c.clearRect(ox + x, y, w, h), t = '#7FBF4A', t2 = '#5D9436', hx = 7 + a;
        p(8, 26, 4, 7, '#2A332E'); p(15, 27, 4, 6, '#2A332E'); p(7, 33, 5, 2, '#101410'); p(15, 33, 5, 2, '#101410'); sil(9, 30, 2, 2);
        p(7, 15, 12, 12, o.solgun); p(16, 15, 3, 12, 'rgba(0,0,0,.35)'); p(9, 18, 3, 3, t2); sil(7, 25, 3, 2); sil(14, 24, 3, 3); p(11, 26, 2, 1, '#2A332E');
        p(0, 15 + a, 8, 3, t); p(0, 15 + a, 2, 3, t2); p(0, 20 - a, 8, 3, t2); p(0, 20 - a, 2, 3, '#47752A');
        p(hx, 3, 11, 11, t); p(hx + 8, 3, 3, 11, t2); p(hx + 1, 6, 2, 3, t2);
        p(hx, 1, 11, 3, '#3D5A22'); p(hx, 4, 2, 3, '#3D5A22'); p(hx + 4, 0, 2, 1, '#3D5A22'); p(hx + 8, 0, 2, 1, '#3D5A22');
        p(hx + 1, 6, 4, 4, '#3B0B0B'); p(hx + 2, 7, 3, 3, '#FF3B30'); p(hx + 3, 8, 1, 1, '#FFE4D6'); p(hx + 7, 7, 2, 2, '#141018');
        p(hx + 2, 11, 7, 3, '#1A0A0A'); p(hx + 3, 11, 1, 1, '#EDE6C8'); p(hx + 5, 11, 1, 1, '#EDE6C8'); p(hx + 7, 11, 1, 1, '#EDE6C8'); p(hx + 4, 13, 1, 1, '#EDE6C8'); p(hx + 6, 13, 1, 1, '#EDE6C8');
        p(hx + 5, 14, 1, 2, '#9BEA5A');
    }
    const _spr = new Map();
    function spriteOf(k, r) {
        const an = k + '|' + r; if (_spr.has(an)) return _spr.get(an);
        const h = karma(k), g = hexMi(r) ? r : '#3B82F6', o = { g, solgun: solgun(g), ten: TEN[h % TEN.length], sac: SAC[(h >> 3) % SAC.length], stil: (h >> 6) % 6 };
        const yap = (f) => { const cv = document.createElement('canvas'); cv.width = 52; cv.height = 36; const c = cv.getContext('2d'); f(c, 0, 0, o); f(c, 26, 1, o); return cv.toDataURL('image/png'); };
        const s = { n: yap(kareSaglam), z: yap(kareZombi) }; _spr.set(an, s); return s;
    }
    function kisiHtml(k, r) { const s = spriteOf(k, r); return '<span class="zb-svg" aria-hidden="true"><i class="zb-spr n" style="background-image:url(' + s.n + ')"></i><i class="zb-spr z" style="background-image:url(' + s.z + ')"></i></span>'; }

    /* sahne: gece sokağı. Zemin barikat çizgisine göre bir kez çizilir; ateş, ışık, sis ayrı tuvalde. */
    function tohum(n) { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    let _sah = { w: 0, h: 0, bar: 0, ufuk: 0, anahtar: '' }, _raf = 0, _son = 0;
    function tuvalBoyut(cv, w, h) { const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(w * d); cv.height = Math.round(h * d); const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return c; }
    function zeminCiz(w, h, bar) {
        const cv = $('zb-zemin'); if (!cv) return; const c = tuvalBoyut(cv, w, h), t = Math.round(Math.max(bar * .42, Math.min(90, bar * .8))), o = Math.max(.55, h / 620);
        _sah.ufuk = t;
        const g = c.createLinearGradient(0, 0, 0, t); g.addColorStop(0, '#071018'); g.addColorStop(.55, '#123041'); g.addColorStop(1, '#2F5A4C'); c.fillStyle = g; c.fillRect(0, 0, w, t + 2);
        let r = tohum(4); for (let i = 0; i < 90; i++) { c.fillStyle = 'rgba(255,255,255,' + (.25 + r() * .6) + ')'; c.fillRect(r() * w, r() * t * .6, 2, 2); }
        const ax = w * .45, ay = Math.max(20, t * .42), ps = Math.max(3, 6 * o); for (let i = 5; i > 0; i--) { c.fillStyle = 'rgba(236,240,190,' + (.035 * i) + ')'; c.beginPath(); c.arc(ax, ay, ps * 7 + i * 18 * o, 0, 7); c.fill(); }
        c.fillStyle = '#ECEFC0'; for (let x = -7; x <= 7; x++) for (let y = -7; y <= 7; y++) if (x * x + y * y <= 50) c.fillRect(ax + x * ps, ay + y * ps, ps + .5, ps + .5);
        c.fillStyle = '#CFD3A0'; [[-3, -2, 2], [2, 1, 3], [-1, 4, 1], [4, -4, 1]].forEach(([x, y, s]) => c.fillRect(ax + x * ps, ay + y * ps, s * ps, s * ps));
        r = tohum(11); for (let x = -20; x < w;) { const gn = (70 + r() * 80) * o, y = (40 + r() * 70) * o; c.fillStyle = '#142630'; c.fillRect(x, t - y, gn, y + 2); x += gn + r() * 8; }
        r = tohum(23); for (let x = -30; x < w;) { const gn = (80 + r() * 90) * o, y = (24 + r() * 56) * o; c.fillStyle = '#0D1A1F'; c.fillRect(x, t - y, gn, y + 2); for (let wy = t - y + 7 * o; wy < t - 8 * o; wy += 15 * o) for (let a = x + 6 * o; a < x + gn - 9 * o; a += 14 * o) { const q = r(); c.fillStyle = q > .9 ? (q > .97 ? '#D9902A' : '#A98A48') : 'rgba(0,0,0,.28)'; c.fillRect(a, wy, 6 * o, 8 * o); } x += gn + r() * 6; }
        const yol = c.createLinearGradient(0, t, 0, bar); yol.addColorStop(0, '#26362E'); yol.addColorStop(1, '#141F1B'); c.fillStyle = yol; c.fillRect(0, t, w, bar - t + 2);
        r = tohum(41); c.fillStyle = 'rgba(0,0,0,.3)'; for (let i = 0; i < 26; i++) c.fillRect(r() * w, t + 4 + r() * (bar - t), (8 + r() * 30) * o, (3 + r() * 5) * o);
        const on = c.createLinearGradient(0, bar, 0, h); on.addColorStop(0, '#23302A'); on.addColorStop(1, '#111B18'); c.fillStyle = on; c.fillRect(0, bar, w, h - bar);
        // yanık araba + yanan varil
        const a = Math.max(.42, .62 * o), ax2 = w * .02, ay2 = t + 22 * o; c.fillStyle = '#0A0F10'; c.fillRect(ax2 - 6 * a, ay2 + 12 * a, 120 * a, 6 * a); c.fillStyle = '#4A2822'; c.fillRect(ax2, ay2 - 8 * a, 108 * a, 22 * a); c.fillRect(ax2 + 24 * a, ay2 - 28 * a, 52 * a, 22 * a); c.fillStyle = '#10202A'; c.fillRect(ax2 + 30 * a, ay2 - 24 * a, 18 * a, 16 * a); c.fillStyle = '#0A0A0E'; c.fillRect(ax2 + 12 * a, ay2 + 8 * a, 20 * a, 14 * a); c.fillRect(ax2 + 74 * a, ay2 + 8 * a, 20 * a, 14 * a);
        const vx = w * .34, vy = t + 6 * o; c.fillStyle = '#2A2F33'; c.fillRect(vx - 16 * o, vy, 32 * o, 28 * o); c.fillStyle = '#454B50'; c.fillRect(vx - 16 * o, vy + 7 * o, 32 * o, 3 * o); c.fillRect(vx - 16 * o, vy + 18 * o, 32 * o, 3 * o);
    }
    function barikatCiz(w, y, yuk) {
        const cv = $('zb-barikat'); if (!cv) return; const kp = $('zb-kalabalik'), sa = document.querySelector('.zb-sahne'); if (!kp || !sa) return; const rk = kp.getBoundingClientRect(), rs = sa.getBoundingClientRect(), lamba = 0;
        cv.style.left = (rs.left - rk.left) + 'px'; cv.style.top = (y - lamba) + 'px'; cv.style.width = w + 'px'; cv.style.height = (yuk + lamba + 4) + 'px';
        const c = tuvalBoyut(cv, w, yuk + lamba + 4), ks = yuk / 3, kg = ks * 2.5;
        c.clearRect(0, 0, w, yuk + lamba + 4);
        for (let s = 0; s < 3; s++) for (let x = -kg + (s % 2 ? kg / 2 : 0); x < w; x += kg) { const yy = lamba + s * ks; c.fillStyle = s % 2 ? '#8A7A52' : '#9A8A5E'; c.fillRect(x, yy, kg - 1, ks); c.fillStyle = 'rgba(0,0,0,.22)'; c.fillRect(x, yy + ks * .76, kg - 1, ks * .24); c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(x + 3, yy + 2, kg - 7, 2); }
        c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, lamba + yuk, w, 4);
    }
    function canliCiz(ms) {
        const cv = $('zb-canli'); if (!cv || !_sah.w) return; const { w, h, bar, ufuk } = _sah, c = cv.getContext('2d'), t = ms / 1000, o = Math.max(.55, h / 620);
        c.clearRect(0, 0, w, h);
        [[w * .09, 0], [w * .49, 1.7]].forEach(([x, f]) => { const a = Math.sin(t * .8 + f) * .3; c.fillStyle = 'rgba(235,240,190,.09)'; c.beginPath(); c.moveTo(x, bar); c.lineTo(x + Math.sin(a) * w * .35 - 80 * o, ufuk); c.lineTo(x + Math.sin(a) * w * .35 + 80 * o, ufuk); c.closePath(); c.fill(); });
        [w * .09, w * .49].forEach((x) => { c.fillStyle = '#0A1012'; c.fillRect(x - 3, bar - 118 * o, 6, 118 * o); c.fillStyle = '#D9DCC0'; c.fillRect(x - 13, bar - 128 * o, 26, 12 * o); });
        const fx = w * .34, fy = ufuk + 8 * o, pa = .1 + .04 * Math.sin(t * 9); c.fillStyle = 'rgba(255,130,40,' + pa + ')'; c.beginPath(); c.arc(fx, fy - 18 * o, 76 * o, 0, 7); c.fill();
        for (let i = 0; i < 20; i++) { const u = (t * (.8 + i * .04) + i * .31) % 1, x = fx + (Math.sin(i * 2.1 + t * 3) * (22 - u * 15) + (i % 7 - 3) * 5) * o, y = fy - u * 70 * o, s = ((1 - u) * 11 + 3) * o; c.fillStyle = u < .3 ? '#FFE08A' : u < .65 ? '#FF8A2E' : 'rgba(190,50,20,.8)'; c.fillRect(x - s / 2, y - s / 2, s, s); }
        for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(155,234,90,.05)'; c.fillRect(((i * 310 + t * (14 + i * 3)) % (w + 420)) - 420, ufuk + (bar - ufuk) * (i / 5), 420, Math.max(16, 28 * o)); }
    }
    function dongu(ms) {
        _raf = 0; const p = panel(); if (!p || !p.isConnected || !$('zb-canli') || (typeof _kmOyunAktifTema !== 'undefined' && _kmOyunAktifTema !== 'zombi')) return;
        if (!document.hidden && ms - _son >= 33) { _son = ms; try { canliCiz(ms); } catch (e) { } }
        _raf = requestAnimationFrame(dongu);
    }
    // Sahne ölçüsü değişince (ya da ilk açılışta) zemin yeniden çizilir
    function sahneOlc() {
        const sa = document.querySelector('.zb-sahne'); if (!sa) return null; const rs = sa.getBoundingClientRect(); if (!rs.width || !rs.height) return null;
        const kp = $('zb-kalabalik'), rk = kp ? kp.getBoundingClientRect() : null, bar = rk && rk.height ? Math.round(rk.top - rs.top + rk.height * BAR_ORAN) : Math.round(rs.height * .55), w = Math.round(rs.width), h = Math.round(rs.height), an = w + '|' + h + '|' + bar;
        if (_sah.anahtar !== an) { _sah = { w, h, bar, ufuk: 0, anahtar: an }; zeminCiz(w, h, bar); const cv = $('zb-canli'); if (cv) tuvalBoyut(cv, w, h); if (azHareket()) canliCiz(performance.now()); }
        return _sah;
    }
    /* kalabalık: zombiler barikatın arkasında (sokakta), sağlamlar önünde. Çocuk ısırılınca barikatı geçer, kurtulunca geri koşar. */
    const BAR_ORAN = .5, AD_YUK = 19;
    // Verilen alana en büyük karakteri sığdıran sütun sayısı; karakterler azsa az satır
    function izgara(n, W, H, enFazla) {
        let en = { boy: 0, k: 1, s: 1 };
        for (let k = n; k >= 1; k--) { const s = Math.ceil(n / k), boy = Math.min(enFazla, W / k / .8, H / s - AD_YUK); if (boy > en.boy) en = { boy, k, s }; }
        return en;
    }
    function diz(el, W, y0, H, enFazla, zTaban) {
        if (!el.length) return; const g = izgara(el.length, W, Math.max(40, H), enFazla), sat = H / g.s, boy = Math.max(24, g.boy);
        el.forEach((b, i) => {
            const row = Math.floor(i / g.k), say = row < g.s - 1 ? g.k : el.length - g.k * (g.s - 1), o = i - row * g.k, cw = W / say, kw = Math.min(cw, boy * 1.25), y = y0 + sat * (row + 1) - boy - AD_YUK;
            b.style.left = Math.round(cw * (o + .5) - kw / 2) + 'px'; b.style.top = Math.round(y) + 'px'; b.style.width = Math.round(kw) + 'px'; b.style.height = Math.round(boy + AD_YUK) + 'px'; b.style.zIndex = zTaban + row; b.style.setProperty('--ad', Math.max(11, Math.min(15, boy * .2)) + 'px');
        });
    }
    function yerlesim(zombiler) {
        const kp = $('zb-kalabalik'); if (!kp) return; const r = kp.getBoundingClientRect(); if (!r.width || !r.height) return; const z = zombiler || durum().zombi, sa = sahneOlc();
        const bar = Math.round(r.height * BAR_ORAN), yuk = Math.max(24, Math.min(50, r.height * .1)), hepsi = Array.from(kp.querySelectorAll('.zb-kisi')), zo = hepsi.filter((b) => z[b.getAttribute('data-k')]), sg = hepsi.filter((b) => !z[b.getAttribute('data-k')]);
        diz(zo, r.width, 0, bar - 1, 112, 10);
        diz(sg, r.width, bar + yuk * .3, r.height - bar - yuk * .3, 140, 60);
        if (sa) barikatCiz(sa.w, bar, yuk);
    }
    function kalabalikKur() {
        const l = liste(), st = durum(), kp = $('zb-kalabalik'); if (!kp) return;
        kp.classList.remove('gecis');
        kp.innerHTML = '<canvas id="zb-barikat" aria-hidden="true"></canvas>' + l.map((s, i) => { const k = kimlik(s); return '<button type="button" class="zb-kisi" data-km-sporcu="' + i + '" data-k="' + esc(k) + '"><span class="zb-kafa">' + kisiHtml(k, renk(i)) + '<i class="zb-sira">SIRA</i></span><span class="zb-ad"><b class="zb-tik" aria-hidden="true"></b>' + esc(ilkAd(s.ad)) + '</span></button>'; }).join('');
        _kur = l.map(kimlik).join('\u0001') + '|' + st.tarih;
        _sah.anahtar = '';
        requestAnimationFrame(() => requestAnimationFrame(() => { if (kp.isConnected && !azHareket()) kp.classList.add('gecis'); }));
    }
    function aktifIndeks() { return typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1; }
    function guncelle() {
        const kok = $('zb-icerik'); if (!kok) return; const st = durum();
        if (st.faz === 'son') return sonCiz(st);
        if (!$('zb-oyun')) oyunIskelet();
        if ((liste().map(kimlik).join('\u0001') + '|' + st.tarih) !== _kur) kalabalikKur();
        if (!st.basladi && atabilenler().length) { const z = salginBaslat(st); kaydet(); if (z.length && !_kilit) acilis(z); }
        const ai = aktifIndeks(), n = atabilenler().length;
        document.querySelectorAll('#zb-kalabalik .zb-kisi').forEach((b, i) => {
            const k = b.getAttribute('data-k'), z = !!st.zombi[k], at = (st.atan[k] || 0) >= turSay(), akt = i === ai;
            b.classList.toggle('zombi', z); b.classList.toggle('atti', at); b.classList.toggle('aktif', akt);
            const ad = b.querySelector('.zb-ad').textContent; b.setAttribute('aria-label', ad + (z ? ', zombi' : ', sağlam') + (at ? ', attı' : ''));
        });
        yerlesim();
        const zs = zombiSay(st), saglam = n - zs, a = atanSay(st), akt = liste()[ai];
        const yaz = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
        yaz('zb-z', zs); yaz('zb-s', saglam); yaz('zb-at', a + ' / ' + n + ' attı'); yaz('zb-kim', akt ? buyuk(ilkAd(akt.ad)) : '');
        const b = $('zb-bar'); if (b) b.style.width = (n ? zs / n * 100 : 0) + '%';
        if (akt) { const es = esikOf(ortalama(akt)), h = $('zb-yan-hedef'); if (h) h.setAttribute('data-esik', es); yaz('zb-yan-ad', buyuk(ilkAd(akt.ad))); yaz('zb-yan-esik', (st.zombi[kimlik(akt)] ? 'Kendini kurtar: ' : 'Panzehir: ') + (es >= 9 ? 'sarıya vur' : es >= 7 ? 'kırmızıya ya da sarıya vur' : 'maviye ya da içine vur')); }
        const bit = $('zb-bitir'); if (bit) bit.hidden = !(a > 0 && a < n && a >= Math.ceil(n / 2));
    }
    function oyunIskelet() {
        $('zb-icerik').innerHTML = '<div class="zb-oyun" id="zb-oyun"><div class="zb-ust"><div class="zb-say z"><b id="zb-z">0</b><span>ZOMBİ</span></div><div class="zb-orta"><div class="zb-cubuk" role="img" aria-label="Zombi ve sağlam oranı"><i id="zb-bar"></i></div><div class="zb-bilgi"><span class="zb-sira-hud">Sıra: <b id="zb-kim"></b></span><span id="zb-at"></span><span class="zb-kl">Her atıştan sonra ısırık</span></div></div><div class="zb-say s"><b id="zb-s">0</b><span>SAĞLAM</span></div></div>'
            + '<div class="zb-duyuru" id="zb-duyuru" aria-live="polite"></div><div class="zb-kalabalik" id="zb-kalabalik"></div>'
            + '<div class="zb-yan" id="zb-yan"><div class="zb-yan-hedef" id="zb-yan-hedef" data-esik="7"><svg viewBox="0 0 120 120" role="img" aria-label="Hedefte panzehir bölgesi"><circle class="m" cx="60" cy="60" r="58"/><circle class="k" cx="60" cy="60" r="39"/><circle class="s" cx="60" cy="60" r="20"/></svg></div><div class="zb-yan-yazi"><small>SIRADA</small><b id="zb-yan-ad"></b><span id="zb-yan-esik"></span></div>'
            + '<div class="zb-arac"><button type="button" class="zb-kucuk" id="zb-nasil" aria-label="Nasıl oynanır">?</button><button type="button" class="zb-kucuk" id="zb-yeni-btn" aria-label="Yeni salgın">↻</button><button type="button" class="zb-kucuk genis" id="zb-bitir" hidden>Hep birlikte bitir</button></div></div></div>';
        kalabalikKur();
    }
    function sonCiz(st) {
        const k = st.kazandi, l = st.finalAdlar || [], n = l.length, z = st.sonZ != null ? st.sonZ : zombiSay(st);
        const sinif = liste().map((s, i) => '<span class="zb-son-kisi' + (st.zombi[kimlik(s)] ? ' zombi' : '') + '" style="--g:' + (i % 7) + '">' + kisiHtml(kimlik(s), renk(i)) + '</span>').join('');
        $('zb-icerik').innerHTML = '<div class="zb-son ' + (k ? 'kazandi' : 'kaybetti') + '" id="zb-son"><span class="zb-et">Herkes attı</span><h2>' + (k ? 'SALGIN DURDU!' : 'ŞEHİR DÜŞTÜ!') + '</h2><p class="zb-sonuc"><b>' + (n - z) + '</b> sağlam · <b>' + z + '</b> zombi</p><p class="zb-cumle">' + (k ? 'Hep birlikte kurtardınız.' : 'Bir dahaki sefere hep birlikte. Rövanş?') + '</p><div class="zb-adlar"><small>Bu salgında savaşanlar</small><span>' + l.map(esc).join(' · ') + '</span></div><button type="button" class="zb-buyuk" id="zb-yeni-son">Yeni salgın</button><div class="zb-son-kal" aria-hidden="true">' + sinif + '</div></div>';
        _kur = ''; _sah.anahtar = ''; sahneOlc();
    }
    function duyur(metin, sinif) { const d = $('zb-duyuru'); if (!d) return; d.className = 'zb-duyuru ac ' + (sinif || ''); d.textContent = metin; }
    function duyuruKapa() { const d = $('zb-duyuru'); if (d) d.className = 'zb-duyuru'; }
    function zamanTemizle() { _z.forEach(clearTimeout); _z = []; }
    function sonra(fn, ms) { const t = setTimeout(fn, ms); _z.push(t); }
    function kisiEl(k) { return document.querySelector('#zb-kalabalik .zb-kisi[data-k="' + (window.CSS && CSS.escape ? CSS.escape(k) : k) + '"]'); }
    function isaretle(k, sinif, ms) { const e = kisiEl(k); if (!e) return; e.classList.remove(sinif); void e.offsetWidth; e.classList.add(sinif); sonra(() => { const x = kisiEl(k); if (x) x.classList.remove(sinif); }, ms || 900); }
    // Ok: atan çocuktan iyileşene uçar
    function okUcur(kaynak, hedef) {
        if (azHareket()) return; const a = kisiEl(kaynak), b = kisiEl(hedef), kok = $('zb-oyun'); if (!a || !b || !kok || a === b) return;
        const r0 = kok.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(), ok = document.createElement('i'); ok.className = 'zb-ok';
        const x0 = ra.left - r0.left + ra.width / 2, y0 = ra.top - r0.top + ra.height / 3, x1 = rb.left - r0.left + rb.width / 2, y1 = rb.top - r0.top + rb.height / 3, ac = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
        ok.style.cssText = 'left:' + x0 + 'px;top:' + y0 + 'px;transform:rotate(' + ac + 'deg)'; kok.appendChild(ok);
        try { ok.animate([{ transform: 'translate(0,0) rotate(' + ac + 'deg)' }, { transform: 'translate(' + (x1 - x0) + 'px,' + (y1 - y0) + 'px) rotate(' + ac + 'deg)' }], { duration: 280, easing: 'ease-in' }); } catch (e) { }
        sonra(() => ok.remove(), 290);
    }
    function acilis(z) {
        _kilit = true; const adlar = z.map((k) => buyuk(ilkAd(k.slice(k.indexOf('|') + 1)))).join(', ');
        duyur('SALGIN BAŞLADI! ' + adlar + ' ZOMBİ OLDU!', 'kotu'); SES.isir(); z.forEach((k) => isaretle(k, 'isirildi', 900));
        sonra(() => { duyuruKapa(); _kilit = false; }, 2200);
    }

    /* ---- seri ---- */
    function zbSeri(s, i, kaydedilecek, done) {
        zamanTemizle(); duyuruKapa(); _kilit = true;
        const bit = () => { _kilit = false; try { done(); } catch (e) { } if (panel()) guncelle(); };
        const st = durum();
        if (st.faz !== 'oyun') { _kilit = false; kaydet(); try { done(); } catch (e) { } return; } // sonuç ekranında girilen seri kayda geçer, oyunu etkilemez
        if (!st.basladi) salginBaslat(st);
        const key = kimlik(s), puanlar = (kaydedilecek || []).map((k) => puan(k.puan)), esik = esikOf(ortalama(s)), herkes = atabilenler().map(kimlik);
        const r = adimHesapla(st, key, puanlar, esik, herkes, rastgele, ic('dalga'));
        st.atan[key] = (st.atan[key] || 0) + 1;
        if (r.iyilesen.length) st.kurtardi[key] = (st.kurtardi[key] || 0) + 1;
        const final = herkesAtti(st);
        if (final) { st.sonZ = herkes.filter((k) => st.zombi[k]).length; bitir(st); }
        kaydet();
        if (!panel()) return bit();
        const adi = buyuk(ilkAd(s.ad)), adOf = (k) => buyuk(ilkAd(k.slice(k.indexOf('|') + 1)));
        if (!$('zb-oyun')) oyunIskelet();
        // kalabalık önce iyileşeni gösterir, ısırık sonra gelir
        const goster = (zombiler) => { document.querySelectorAll('#zb-kalabalik .zb-kisi').forEach((b) => b.classList.toggle('zombi', !!zombiler[b.getAttribute('data-k')])); yerlesim(zombiler); const zs = herkes.filter((k) => zombiler[k]).length, bar = $('zb-bar'); if ($('zb-z')) $('zb-z').textContent = zs; if ($('zb-s')) $('zb-s').textContent = herkes.length - zs; if (bar) bar.style.width = (herkes.length ? zs / herkes.length * 100 : 0) + '%'; };
        const ara = Object.assign({}, st.zombi); r.isirilan.forEach((k) => delete ara[k]); goster(ara);
        let bek = 0;
        if (r.iyilesen.length) {
            const h = r.iyilesen[0]; okUcur(key, h); SES.kurtar();
            sonra(() => isaretle(h, 'kurtuldu', 1000), 280);
            duyur(h === key ? adi + ' PANZEHİRİ VURDU, İYİLEŞTİ!' : adi + ' PANZEHİR ATTI, ' + adOf(h) + ' KURTULDU!', 'iyi'); bek = 1200;
        } else if (r.panzehir) { duyur(adi + ' PANZEHİR ATTI! ZOMBİ KALMADI!', 'iyi'); SES.kurtar(); bek = 1100; }
        else { duyur(adi + ': AZ KALDI!', ''); SES.kacti(); bek = 900; }
        if (r.isirilan.length) {
            sonra(() => { goster(st.zombi); SES.isir(); r.isirilan.forEach((k) => isaretle(k, 'isirildi', 1000)); const sah = $('zb-kalabalik'); if (sah && !azHareket()) { sah.classList.remove('sars'); void sah.offsetWidth; sah.classList.add('sars'); } duyur((r.dalga ? 'YENİ DALGA! ' : 'ZOMBİLER SALDIRDI! ') + r.isirilan.map(adOf).join(', ') + ' ISIRILDI!', 'kotu'); }, bek); bek += 1300;
        }
        sonra(() => {
            duyuruKapa();
            if (final) { sonCiz(st); (st.kazandi ? SES.zafer : SES.yenilgi)(); try { if (typeof kmOyunBanner === 'function') kmOyunBanner(st.kazandi ? '🧟 SALGIN DURDU!' : '🧟 ŞEHİR DÜŞTÜ!', 'Hep birlikte: ' + (st.finalAdlar || []).slice(0, 14).join(', ') + ((st.finalAdlar || []).length > 14 ? ' ve tüm sınıf' : ''), 'bitis'); } catch (e) { } _kilit = false; try { done(); } catch (e) { } return; }
            bit();
        }, bek);
    }
    function zbFinalZorla() {
        const st = durum(); if (st.faz !== 'oyun') return;
        const f = () => { const s = durum(); if (s.faz !== 'oyun') return; s.sonZ = zombiSay(s); bitir(s); kaydet(); (s.kazandi ? SES.zafer : SES.yenilgi)(); guncelle(); };
        const kalan = atabilenler().length - atanSay(st);
        if (kalan > 0 && typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Salgın şimdi bitsin mi?<br><small>' + kalan + ' çocuk henüz atmadı. Sonuçta herkesin adı görünür.</small>', f, 'Hep birlikte bitir', 'Bekle'); else f();
    }
    function nasil() {
        const m = 'Ekrandakiler bu sınıf. Birkaç kişi zombi başlar.<br>Atış iyiyse panzehir olur: bir zombi kurtulur, zombi çocuk önce kendini kurtarır. "İyi atış" çocuğun kendi seviyesine göre: yeni başlayana mavi, ortaya kırmızı, iyiye sarı.<br>Her atıştan sonra zombiler bir kişiyi ısırır.<br>Herkes atınca sağlam çoğunluktaysa salgın durur.';
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste(m, () => { }, 'Tamam', 'Kapat');
    }
    function yeniSor() {
        const f = () => { zamanTemizle(); _kilit = false; _st = yeniOyun(); kaydet(); _kur = ''; $('zb-icerik').innerHTML = ''; guncelle(); };
        if (durum().faz !== 'oyun' || !durum().seri) return f();
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Yeni salgın başlasın mı?<br><small>Sporcu serileri silinmez.</small>', f, 'Yeni salgın', 'Vazgeç'); else f();
    }
    function zbSahneKur() {
        const p = panel(); if (!p) return; css(); zamanTemizle(); _kilit = false; _kur = '';
        p.innerHTML = '<div class="zb-sahne"><canvas id="zb-zemin" aria-hidden="true"></canvas><canvas id="zb-canli" aria-hidden="true"></canvas><div id="zb-icerik"></div></div>'; _sah = { w: 0, h: 0, bar: 0, ufuk: 0, anahtar: '' };
        p.onclick = (e) => {
            const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.id === 'zb-nasil') nasil(); else if (t.id === 'zb-yeni-btn' || t.id === 'zb-yeni-son') yeniSor(); else if (t.id === 'zb-bitir') zbFinalZorla();
        };
        guncelle(); sahneOlc();
        if (window.ResizeObserver) { if (p._zbRo) p._zbRo.disconnect(); p._zbRo = new ResizeObserver(() => { const kp = $('zb-kalabalik'); if (!kp) return void sahneOlc(); kp.classList.remove('gecis'); yerlesim(); requestAnimationFrame(() => requestAnimationFrame(() => { if (kp.isConnected && !azHareket()) kp.classList.add('gecis'); })); }); p._zbRo.observe(p); }
        if (!_raf && !azHareket()) _raf = requestAnimationFrame(dongu); else if (azHareket()) canliCiz(performance.now());
    }
    function css() {
        if ($('zb-css')) return; const st = document.createElement('style'); st.id = 'zb-css';
        st.textContent = '.km-oyun-panel-zombi{padding:0;background:#0C1412;overflow:hidden;font-family:"Manrope",system-ui,sans-serif}'
            + '.zb-sahne{position:absolute;inset:0;color:#F2F6EE;overflow:hidden;background:#0C1412}#zb-zemin,#zb-canli{position:absolute;left:0;top:0;width:100%;height:100%;display:block}'
            + '#zb-icerik{position:absolute;inset:0;z-index:1;box-sizing:border-box;padding:10px min(440px,41%) 10px 14px}'
            + '.zb-oyun{position:relative;height:100%;display:flex;flex-direction:column;gap:6px;min-height:0}'
            + '.zb-ust{flex:none;position:relative;z-index:70;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:4px 10px;border-radius:12px;background:rgba(5,9,8,.72)}'
            + '.zb-say{display:flex;flex-direction:column;align-items:center;min-width:76px;line-height:1}.zb-say b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(44px,6vw,68px);font-weight:800;font-variant-numeric:tabular-nums}.zb-say span{font-size:13px;font-weight:800;letter-spacing:.08em}.zb-say.z b,.zb-say.z span{color:#9BEA5A}.zb-say.s b,.zb-say.s span{color:#7CCBFF}'
            + '.zb-cubuk{height:18px;border-radius:9px;background:#3A7FB8;overflow:hidden}.zb-cubuk i{display:block;height:100%;background:#7FD63F;transition:width .5s}'
            + '.zb-bilgi{display:flex;flex-wrap:wrap;gap:2px 14px;margin-top:6px;font-size:clamp(13px,1.45vw,17px);font-weight:700;color:#DCE6D6;align-items:baseline}.zb-bilgi b{font-family:"Barlow Condensed",sans-serif;font-size:clamp(22px,2.6vw,32px);font-weight:800;color:#FFC24B}.zb-kl{color:#FFB199}'
            + '.zb-kalabalik{flex:1;min-height:0;position:relative}#zb-barikat{position:absolute;z-index:50;pointer-events:none;display:block;max-width:none}.zb-kalabalik.sars{animation:zb-sars .4s}.zb-kalabalik.gecis .zb-kisi{transition:left 1s ease-in-out,top 1s ease-in-out,width .5s,height .5s}'
            + '.zb-kisi{position:absolute;min-width:0;min-height:44px;padding:0;border:0;background:transparent;color:#F2F6EE;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:1px}'
            + '.zb-kafa{position:relative;flex:1;min-height:0;width:100%;display:flex;align-items:flex-end;justify-content:center}.zb-svg{position:relative;display:block;height:100%;aspect-ratio:26/36;max-width:100%;filter:drop-shadow(0 3px 0 rgba(0,0,0,.45))}.zb-spr{position:absolute;inset:0;display:block;background-size:200% 100%;background-repeat:no-repeat;image-rendering:pixelated}.zb-spr.z{display:none}.zombi>.zb-svg .zb-spr.z,.zombi .zb-kafa .zb-spr.z{display:block}.zombi>.zb-svg .zb-spr.n,.zombi .zb-kafa .zb-spr.n{display:none}'
            + '.zb-ad{flex:none;max-width:100%;font-size:var(--ad,13px);font-weight:800;line-height:1.15;padding:1px 6px;border-radius:7px;background:rgba(8,12,12,.78);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zb-kisi.zombi .zb-ad{color:#BDF58C}'
            + '.zb-tik:empty{display:none}.zb-kisi.atti .zb-ad:before{content:"✓ ";color:#FFC24B}'
            + '.zb-sira{display:none;position:absolute;top:-2px;left:50%;transform:translateX(-50%);padding:1px 8px;border-radius:6px;background:#FFC24B;color:#1A1000;font-style:normal;font-size:12px;font-weight:800;z-index:2}.zb-kisi.aktif .zb-sira{display:block}.zb-kisi.aktif .zb-ad{background:#FFC24B;color:#1A1000}.zb-kisi.aktif .zb-svg{filter:drop-shadow(0 0 7px #FFC24B)}'
            + '.zb-duyuru{position:absolute;left:0;right:0;top:44%;z-index:95;text-align:center;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(28px,4.6vw,60px);line-height:1;padding:12px 16px;background:rgba(6,10,10,.86);color:#fff;opacity:0;pointer-events:none;transform:translateY(-50%) scale(.92);transition:opacity .12s,transform .12s}.zb-duyuru.ac{opacity:1;transform:translateY(-50%)}.zb-duyuru.iyi{color:#FFD86B}.zb-duyuru.kotu{color:#9BEA5A}'
            + '.zb-ok{position:absolute;z-index:90;width:44px;height:5px;margin:-2px 0 0 -22px;background:#FFE9B0;border-radius:2px;transform-origin:center;pointer-events:none}'
            + '.zb-yan{position:absolute;z-index:70;left:100%;top:0;margin-left:16px;width:min(390px,56vw);box-sizing:border-box;padding:8px 10px;border-radius:12px;background:rgba(5,9,8,.72);display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center}.zb-yan-hedef{flex:none;width:112px}.zb-yan-hedef svg{display:block;width:100%}.zb-yan-hedef .m{fill:#2F7FD6}.zb-yan-hedef .k{fill:#E23B2E}.zb-yan-hedef .s{fill:#F5D32A}.zb-yan-hedef[data-esik="7"] .m,.zb-yan-hedef[data-esik="9"] .m,.zb-yan-hedef[data-esik="9"] .k{fill:#2A3430}'
            + '.zb-yan-yazi{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.zb-yan-yazi small{font-size:13px;font-weight:800;letter-spacing:.1em;color:#C9D4C4}.zb-yan-yazi b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(34px,4.4vw,56px);font-weight:800;line-height:1;color:#FFC24B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zb-yan-yazi span{font-size:clamp(15px,1.5vw,19px);font-weight:800;line-height:1.25}.zb-sira-hud{display:none}'
            + '.zb-arac{display:flex;flex-wrap:wrap;gap:6px;width:100%}.zb-kucuk{min-width:44px;height:44px;border-radius:22px;border:1px solid #3B4A44;background:#17211E;color:#F2F6EE;font:inherit;font-weight:800;cursor:pointer}.zb-kucuk[hidden]{display:none}.zb-kucuk.genis{padding:0 14px;font-size:13px}'
            + '.zb-son{height:100%;overflow-y:auto;display:flex;flex-direction:column;justify-content:flex-start;gap:8px;box-sizing:border-box;padding:10px 14px;border-radius:14px;background:rgba(5,9,8,.68)}.zb-son-kal{flex:none;display:flex;flex-wrap:wrap;gap:2px 6px;padding-top:4px}.zb-son-kisi{display:block;height:58px}.zb-son-kisi .zb-svg{height:100%}.zb-son-kisi.zombi .zb-spr.z{display:block}.zb-son-kisi.zombi .zb-spr.n{display:none}.zb-et{font-size:clamp(13px,1.5vw,17px);font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#DCE6D6}.zb-son h2{margin:0;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(44px,6vw,80px);line-height:.92}.zb-son.kazandi h2{color:#FFD86B}.zb-son.kaybetti h2{color:#9BEA5A}.zb-sonuc{margin:0;font-size:clamp(20px,2.6vw,32px);font-weight:700}.zb-sonuc b{font-family:"Barlow Condensed",sans-serif;font-size:1.3em}.zb-cumle{margin:0;font-size:clamp(17px,2vw,24px);font-weight:700;color:#DCE6D6}'
            + '.zb-adlar{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:12px;background:rgba(8,12,12,.72)}.zb-adlar small{font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#B9C6B3}.zb-adlar span{font-size:clamp(14px,1.45vw,18px);font-weight:700;line-height:1.4}.zb-buyuk{flex:none;align-self:flex-start;min-height:60px;padding:0 30px;border-radius:30px;border:0;background:#FFC24B;color:#1A1000;font:inherit;font-size:18px;font-weight:800;cursor:pointer}'
            + '.zb-sahne button:focus-visible{outline:3px solid #FFC24B;outline-offset:2px}'
            + '@media(prefers-reduced-motion:no-preference){.zb-spr{animation:zb-kare 1.3s steps(2,jump-end) infinite}.zombi .zb-spr{animation-duration:.7s}.zb-son.kazandi .zb-son-kisi:not(.zombi) .zb-svg{animation:zb-zipla .8s ease-in-out infinite;animation-delay:calc(var(--g) * -.11s)}@keyframes zb-kare{from{background-position:0 0}to{background-position:200% 0}}.zb-kisi.zombi .zb-svg{animation:zb-sal 1.5s ease-in-out infinite;transform-origin:50% 100%}.zb-kisi.isirildi .zb-svg{animation:zb-isir .9s}.zb-kisi.kurtuldu .zb-svg{animation:zb-kurtul .9s}.zb-kisi.aktif:not(.zombi) .zb-svg{animation:zb-zipla .9s ease-in-out infinite}@keyframes zb-sal{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}@keyframes zb-zipla{0%,100%{transform:none}50%{transform:translateY(-6%)}}@keyframes zb-isir{0%{transform:scale(1)}20%{transform:scale(1.28) rotate(-8deg)}40%{transform:scale(1.1) rotate(8deg)}60%{transform:scale(1.22) rotate(-5deg)}100%{transform:none}}@keyframes zb-kurtul{0%{transform:scale(.8)}35%{transform:scale(1.35) translateY(-12%)}100%{transform:none}}@keyframes zb-sars{20%{transform:translateX(9px)}45%{transform:translateX(-8px)}70%{transform:translateX(5px)}}}'
            + '.zb-kisi.kurtuldu .zb-svg{filter:drop-shadow(0 0 14px #FFD86B)}.zb-kisi.isirildi .zb-svg{filter:drop-shadow(0 0 14px #9BEA5A)}'
            + '@media(max-width:860px){#zb-icerik{padding:8px 8px 8px}.zb-say{min-width:58px}.zb-sira-hud{display:inline}.zb-yan{position:relative;left:auto;margin:0;width:100%;flex:none;gap:6px 10px;padding:4px 8px}.zb-yan-hedef{width:52px}.zb-yan-yazi small,.zb-yan-yazi b{display:none}.zb-yan-yazi span{font-size:14px}.zb-arac{width:auto}}';
        document.head.appendChild(st);
    }
    window.zbSahneKur = zbSahneKur;
    window.zbGuncelle = guncelle;
    window.zbSeri = zbSeri;
    window.zbAnlik = () => JSON.parse(JSON.stringify(durum()));
    window.zbGeriYukle = (k) => { if (!k) return; zamanTemizle(); duyuruKapa(); _kilit = false; _st = k; _kn = konum(); kaydet(); if ($('zb-icerik')) { if (k.faz === 'oyun' && !$('zb-oyun')) $('zb-icerik').innerHTML = ''; guncelle(); } };
    window.zbSporcu = (g, ad) => (durum().kurtardi || {})[g + '|' + ad] || 0;
    window.zbAyarUygula = () => { if ($('zb-icerik')) guncelle(); };
    window.zbFinalZorla = zbFinalZorla;
    window.zbDurum = durum;
    window._zbIc = { esikOf, panzehirSay, baslangicSay, isirikSay, kazandi, adimHesapla, ISIRIK_ARALIK };
})();
