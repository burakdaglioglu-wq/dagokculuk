/* ================================================================================================
   🔓 HAYVAN KURTARMA — Karışık Sınıf › Oyunlar (2026-10-14; 2026-10-11'de 8 yaş için önerilen ikinci oyun, kullanıcı
   "önce yumurta, sonra diğerine bakarız" demişti → bugün "4 ve 6" ile seçti).
   ORTAK oyun: sınıf birlikte kafesteki hayvanı kurtarır. Kafesin renkli kilitleri var; okun düştüğü halkanın RENGİ aynı
   renkteki kilidi açar: 🟡 sarı (9-10-X) · 🔴 kırmızı (7-8) · 🔵 mavi (5-6) · 🎯 herhangi bir isabet · ⭐ X her kilidi açar.
   Bütün kilitler açılınca hayvan kurtulur (kutlama) ve sıradaki kafes gelir; kilit sayısı çocuk sayısına göre.
   İlerleme SAKLANMAZ, HESAPLANIR (Yumurta Yuvası gibi): oyunun başlangıcından sonra oyun hattındaki çocukların
   GERÇEK serileri (Skor Gir, Oyunlar, Yumurta, buradaki tuşlar — nereden girilirse) sırayla kilitlere işlenir.
   Saklanan tek şey başlangıç: 'dag_km_kurtarma_<konum>' = { basla } (km-ortak ile her cihaza gider). Kafeslerin kilit
   dizilişi ve hayvanı tarih + başlangıçtan sabit seçilir → her cihaz aynı kafesi görür.
   ================================================================================================ */
const KR_RENK = {
    sari: { ad: 'Sarı', ikon: '🟡', renk: '#FACC15', koyu: '#A16207', aciklama: '9 · 10 · X' },
    kirmizi: { ad: 'Kırmızı', ikon: '🔴', renk: '#EF4444', koyu: '#991B1B', aciklama: '7 · 8' },
    mavi: { ad: 'Mavi', ikon: '🔵', renk: '#3B82F6', koyu: '#1E40AF', aciklama: '5 · 6' },
    herhangi: { ad: 'Herhangi', ikon: '🎯', renk: '#F5F0E8', koyu: '#8A7F72', aciklama: 'her isabet' }
};
let _kr = { poll: null, imza: '', sonAcik: null, sonKurtarilan: null };
function krKonum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
function krAnahtar() { return 'dag_km_kurtarma_' + krKonum(); }
function krDurumOku() { try { return JSON.parse(localStorage.getItem(krAnahtar()) || 'null') || null; } catch (e) { return null; } }
function krDurumYaz(o) { try { localStorage.setItem(krAnahtar(), JSON.stringify(o)); } catch (e) {} }
function krBasla() { let o = krDurumOku(); if (!o || !o.basla || o.tarih !== bugunISO()) { o = { basla: Date.now(), tarih: bugunISO() }; krDurumYaz(o); } return o; }
function krHash(m) { let h = 2166136261; for (let i = 0; i < m.length; i++) { h ^= m.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function krHayvanlar() { return (typeof KM_OYUN_KARAKTERLER !== 'undefined' ? KM_OYUN_KARAKTERLER : []).filter(function (k) { return k.no <= 9 || k.no >= 13; }); }
function krDeger(v) { return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }
function krHalka(v) { if (v === 'M') return null; let d = krDeger(v); return d >= 9 ? 'sari' : d >= 7 ? 'kirmizi' : d >= 5 ? 'mavi' : 'diger'; }
// Oyuncular: oyun hattı (Yarışma'dakiler hariç); Yumurta'da "ikisinde de" işaretli olanlar da katılır.
function krListe() {
    let yl = {}; try { yl = JSON.parse(localStorage.getItem('dag_km_yuvaliste_' + krKonum()) || '{}') || {}; } catch (e) {}
    return (_kmListe || []).map(function (k, i) { return Object.assign({}, k, { i: i }); }).filter(function (k) {
        if (!(turnuvaDB[k.g] && turnuvaDB[k.g][k.ad])) return false;
        if (typeof kmHat === 'function' && kmHat(k.g, k.ad) === 'yarisma') return false; // ya yarışma ya oyun (2026-10-31)
        return yl[k.g + '|' + k.ad] !== 'cik';
    });
}
// Kafes j: kilit sayısı çocuk sayısına göre (her çocuk ~2 kilit), her kafeste bir artar. Renk dağılımı sabit tohumla.
function krKafes(o, j, kisi) {
    let tohum = krHash(o.tarih + '|' + o.basla + '|' + j), n = Math.min(20, Math.max(6, kisi * 2) + j), kilitler = [];
    let torba = ['sari', 'sari', 'sari', 'kirmizi', 'kirmizi', 'kirmizi', 'mavi', 'mavi', 'herhangi', 'herhangi'];
    for (let i = 0; i < n; i++) { tohum = (Math.imul(tohum ^ (tohum >>> 15), 2246822519) + i) >>> 0; kilitler.push({ renk: torba[tohum % torba.length], acan: null }); }
    kilitler.sort(function (a, b) { return ['sari', 'kirmizi', 'mavi', 'herhangi'].indexOf(a.renk) - ['sari', 'kirmizi', 'mavi', 'herhangi'].indexOf(b.renk); });
    let hl = krHayvanlar(), h = hl.length ? hl[krHash(o.basla + '|hayvan|' + j) % hl.length] : { no: 0, ad: 'Hayvan', src: '' };
    return { j: j, kilitler: kilitler, hayvan: h, acik: 0 };
}
// Bütün okları sırayla işle → şu anki kafes + kurtarılanlar + kimin kaç kilit açtığı.
function krHesapla() {
    let o = krBasla(), liste = krListe(), oklar = [];
    liste.forEach(function (k) {
        let sp = turnuvaDB[k.g][k.ad];
        (sp.seriler || []).forEach(function (s) { if (!s || !Array.isArray(s.oklar) || (s.t || 0) < o.basla) return; s.oklar.forEach(function (v, n) { oklar.push({ v: String(v), t: s.t || 0, n: n, k: k.g + '|' + k.ad, ad: k.ad }); }); });
    });
    oklar.sort(function (a, b) { return a.t - b.t || a.n - b.n; });
    let j = 0, kafes = krKafes(o, 0, liste.length), kurtarilan = [], acan = {}, isabet = 0, iska = 0;
    oklar.forEach(function (ok) {
        let h = krHalka(ok.v); if (!h) { iska++; return; } isabet++;
        let L = kafes.kilitler, bul = function (r) { return L.find(function (x) { return !x.acan && x.renk === r; }); };
        let kilit = (h !== 'diger' && bul(h)) || bul('herhangi') || (ok.v === 'X' ? L.find(function (x) { return !x.acan; }) : null);
        if (!kilit) return;
        kilit.acan = ok.ad; kilit.t = ok.t; kafes.acik++; acan[ok.k] = (acan[ok.k] || 0) + 1;
        if (kafes.acik >= L.length) {
            let kimler = {}; L.forEach(function (x) { kimler[x.acan] = (kimler[x.acan] || 0) + 1; });
            kurtarilan.push({ hayvan: kafes.hayvan, kimler: kimler, t: ok.t });
            j++; kafes = krKafes(o, j, liste.length);
        }
    });
    return { o: o, liste: liste, kafes: kafes, kurtarilan: kurtarilan, acan: acan, isabet: isabet, iska: iska };
}
function krKisa(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
// ---------------- görsel: asma kilit
function krKilitSVG(r, acik, boy) {
    let R = KR_RENK[r] || KR_RENK.herhangi, govde = r === 'herhangi' ? '#EDE6DA' : R.renk;
    let kanca = acik ? '<path d="M14 20 V12 a10 10 0 0 1 20 0 V8" fill="none" stroke="#B9B2A6" stroke-width="5" stroke-linecap="round" transform="translate(6 -6) rotate(18 24 12)"/>' : '<path d="M14 22 V14 a10 10 0 0 1 20 0 V22" fill="none" stroke="#C9C2B6" stroke-width="5" stroke-linecap="round"/>';
    let ic = r === 'herhangi' ? '<circle cx="24" cy="34" r="7" fill="none" stroke="#7A6F62" stroke-width="2"/><circle cx="24" cy="34" r="3" fill="#D73204"/>' : (acik ? '' : '<circle cx="24" cy="31" r="3.2" fill="rgba(0,0,0,.45)"/><rect x="22.6" y="32" width="2.8" height="7" rx="1.2" fill="rgba(0,0,0,.45)"/>');
    return '<svg viewBox="0 0 48 52" width="' + boy + '" height="' + (boy * 52 / 48) + '" aria-hidden="true">' + kanca
        + '<rect x="6" y="20" width="36" height="28" rx="7" fill="' + govde + '" stroke="' + R.koyu + '" stroke-width="2"/><rect x="9" y="23" width="30" height="6" rx="3" fill="#fff" opacity=".28"/>' + ic + '</svg>';
}
function krKafesSVG(boy) {
    let cubuk = ''; for (let i = 0; i < 9; i++) cubuk += '<rect x="' + (18 + i * 21) + '" y="22" width="6" height="168" rx="3" fill="url(#krDemir)"/>';
    return '<svg class="kr-kafes-svg" viewBox="0 0 220 210" width="' + boy + '" height="' + (boy * 210 / 220) + '" aria-hidden="true"><defs><linearGradient id="krDemir" x1="0" x2="1"><stop offset="0" stop-color="#5A4A3E"/><stop offset=".5" stop-color="#B8A796"/><stop offset="1" stop-color="#4A3B30"/></linearGradient></defs>'
        + '<path d="M10 26 Q110 -8 210 26" fill="none" stroke="url(#krDemir)" stroke-width="9" stroke-linecap="round"/><rect x="8" y="186" width="204" height="14" rx="6" fill="#4A2A16"/><rect x="8" y="22" width="204" height="9" rx="4" fill="url(#krDemir)"/>' + cubuk + '</svg>';
}
// ---------------- ekran
function kmKurtarmaCiz() {
    krCss();
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    let r = krHesapla(), k = r.kafes, L = k.kilitler, kisi = r.liste.length;
    let oncekiAcik = _kr.sonAcik, oncekiKurt = _kr.sonKurtarilan;
    let yeniKilit = oncekiAcik != null && oncekiKurt === r.kurtarilan.length ? Math.max(0, k.acik - oncekiAcik) : 0;
    let yeniler = L.filter(function (q) { return q.acan; }).sort(function (a, b) { return b.t - a.t; }).slice(0, yeniKilit); // son açılanlar parlasın
    let kilitHTML = L.map(function (x) {
        let yeni = yeniler.indexOf(x) !== -1;
        return '<div class="kr-kilit' + (x.acan ? ' acik' : '') + (yeni ? ' yeni' : '') + '" title="' + KR_RENK[x.renk].ad + ' kilit · ' + KR_RENK[x.renk].aciklama + (x.acan ? ' · açan: ' + esc(x.acan) : '') + '">' + krKilitSVG(x.renk, !!x.acan, 44) + '<small>' + (x.acan ? esc(krKisa(x.acan)) : KR_RENK[x.renk].aciklama) + '</small></div>';
    }).join('');
    let kalan = {}; L.forEach(function (x) { if (!x.acan) kalan[x.renk] = (kalan[x.renk] || 0) + 1; });
    let ipucu = Object.keys(kalan).length ? 'Kalan: ' + Object.keys(KR_RENK).filter(function (c) { return kalan[c]; }).map(function (c) { return KR_RENK[c].ikon + ' ' + kalan[c]; }).join(' · ') : '';
    let kartlar = r.liste.map(function (s) {
        let n = r.acan[s.g + '|' + s.ad] || 0;
        return '<button class="kr-kart" id="kr-kart-' + s.i + '" onclick="krPedAc(' + s.i + ')"><span class="kr-kart-ad">' + esc(krKisa(s.ad)) + '</span><span class="kr-kart-say">🔓 ' + n + '</span></button>';
    }).join('');
    let kurt = r.kurtarilan.map(function (x) { return '<div class="kr-kurt" title="' + esc(x.hayvan.ad) + '"><img src="' + x.hayvan.src + '" alt="' + esc(x.hayvan.ad) + '"><small>' + esc(x.hayvan.ad) + '</small></div>'; }).join('');
    let kok = document.getElementById('kr-kok');
    if (!kok || !ic.contains(kok)) { ic.innerHTML = '<div class="kr" id="kr-kok"></div>'; kok = document.getElementById('kr-kok'); }
    kok.innerHTML = '<div class="kr-ust"><div class="kr-logo">🔓<div>Hayvan Kurtarma<small>Halkayı vur, kilidi aç — hayvanı birlikte kurtarın!</small></div></div>'
        + '<div class="kr-btnlar"><button class="kr-btn" onclick="krNasil()">❓ Nasıl oynanır?</button><button class="kr-btn" onclick="krTamEkran()">🖥️ Tam ekran</button><button class="kr-btn" onclick="krYeniOyun()">🔄 Yeni oyun</button><button class="kr-btn" onclick="kmSekme(\'oyunlar\')">← Oyunlar</button></div></div>'
        + '<div class="kr-sahne">'
        + '<div class="kr-kafes-kap"><div class="kr-hayvan"><img src="' + k.hayvan.src + '" alt="' + esc(k.hayvan.ad) + '"></div>' + krKafesSVG(260) + '<div class="kr-kafes-ad">' + esc(k.hayvan.ad) + ' kafeste!</div></div>'
        + '<div class="kr-sag"><div class="kr-ilerleme"><b>' + k.acik + '</b>/' + L.length + ' kilit açıldı<span>' + (r.kurtarilan.length ? '· ' + r.kurtarilan.length + '. hayvan kurtarıldı, sıradaki kafes' : '· ' + (r.kurtarilan.length + 1) + '. kafes') + '</span></div>'
        + '<div class="kr-cubuk"><i style="width:' + Math.round(k.acik / L.length * 100) + '%"></i></div>'
        + '<div class="kr-kilitler">' + kilitHTML + '</div><div class="kr-ipucu">' + ipucu + '</div></div></div>'
        + '<div class="kr-kurallar">' + ['sari', 'kirmizi', 'mavi', 'herhangi'].map(function (c) { return '<span>' + KR_RENK[c].ikon + ' <b>' + KR_RENK[c].ad + '</b> ' + KR_RENK[c].aciklama + '</span>'; }).join('') + '<span>⭐ <b>X</b> her kilidi açar</span></div>'
        + (kisi ? '<div class="kr-kartlar">' + kartlar + '</div>' : '<p class="kr-bos">Oyunda çocuk yok — Ders Paneli\'nden derse ekle ya da hatlarını 🎮 Oyun yap.</p>')
        + (kurt ? '<div class="kr-raf"><div class="kr-raf-bas">🏡 Bugün kurtarılanlar · ' + r.kurtarilan.length + '</div><div class="kr-raf-ic">' + kurt + '</div></div>' : '')
        + '<p class="kr-not">👆 Kartına dokun → serini gir. Skor Gir, Oyunlar ve Yumurta\'dan girilen seriler de kilit açar.</p>';
    // yeni kurtarılan → kutlama (bu cihazda bir kez)
    let gor = {}; try { gor = JSON.parse(localStorage.getItem('dag_kurtarma_gorulen') || '{}') || {}; } catch (e) {}
    if (gor.basla === r.o.basla && r.kurtarilan.length > (gor.n || 0)) { let son = r.kurtarilan[r.kurtarilan.length - 1]; setTimeout(function () { krKutla(son); }, 350); }
    try { localStorage.setItem('dag_kurtarma_gorulen', JSON.stringify({ basla: r.o.basla, n: r.kurtarilan.length })); } catch (e) {}
    if (yeniKilit) krSes(880, 0.12);
    _kr.sonAcik = k.acik; _kr.sonKurtarilan = r.kurtarilan.length; _kr.imza = krImza();
    clearInterval(_kr.poll);
    _kr.poll = setInterval(function () {
        if (!document.getElementById('kr-kok') || (typeof _kmAktifSekme !== 'undefined' && _kmAktifSekme !== 'kurtarma')) { clearInterval(_kr.poll); _kr.poll = null; return; }
        if (document.querySelector('.kr-katman,.kr-sahne-kutla')) return;
        if (krImza() !== _kr.imza) kmKurtarmaCiz();
    }, 3000);
}
function krImza() { return (localStorage.getItem(krAnahtar()) || '') + '|' + (localStorage.getItem('dag_km_hat_' + krKonum()) || '') + '|' + (_kmListe || []).map(function (k) { let sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; return sp ? (sp.seriler || []).length : 0; }).join(','); }
function krYeniOyun() {
    onayIste('Yeni kurtarma oyunu başlasın mı?<br><small>Kafes ve kilitler sıfırlanır (sporcuların serileri ve karneleri silinmez).</small>', function () {
        krDurumYaz({ basla: Date.now(), tarih: bugunISO() }); _kr.sonAcik = null; _kr.sonKurtarilan = null; kmKurtarmaCiz(); showToast('🔄 Yeni kafes hazır!', 'success');
    }, 'Yeni oyun', 'Vazgeç');
}
function krTamEkran() { let el = document.getElementById('kr-kok'); if (!el) return; if (document.fullscreenElement) { document.exitFullscreen(); return; } try { let p = el.requestFullscreen(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
let _krSes = null; function krSes(f, d) { try { _krSes = _krSes || new (window.AudioContext || window.webkitAudioContext)(); let o = _krSes.createOscillator(), g = _krSes.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.1, _krSes.currentTime); g.gain.exponentialRampToValueAtTime(0.001, _krSes.currentTime + d); o.connect(g).connect(_krSes.destination); o.start(); o.stop(_krSes.currentTime + d); } catch (e) {} }
function krPencere(html) {
    document.querySelectorAll('.kr-katman').forEach(function (x) { x.remove(); });
    let kok = document.getElementById('kr-kok') || document.body, k = document.createElement('div'); k.className = 'kr-katman';
    k.innerHTML = '<div class="kr-pencere">' + html + '</div>'; k.addEventListener('click', function (e) { if (e.target === k) k.remove(); }); kok.appendChild(k); return k;
}
function krNasil() {
    let p = krPencere('<h2>🔓 Nasıl oynanır?</h2><p class="kr-buyuk-yazi">Hayvan kafeste kalmış! Kafesin renkli kilitleri var. Okun hangi renge düşerse o renkteki kilidi açar.</p>'
        + '<div class="kr-nasil-kilit">' + ['sari', 'kirmizi', 'mavi', 'herhangi'].map(function (c) { return '<div>' + krKilitSVG(c, false, 52) + '<b>' + KR_RENK[c].ad + '</b><small>' + KR_RENK[c].aciklama + '</small></div>'; }).join('') + '</div>'
        + '<p>⭐ <b>X</b> atarsan istediğin kilidi açarsın! Iska (M) kilit açmaz.</p><p>Hep birlikte bütün kilitleri açınca hayvan kurtulur 🎉 ve sıradaki kafes gelir. Kimse kimseyle yarışmaz — <b>birlikte</b> kurtarırsınız.</p>'
        + '<div><button class="kr-btn ana" data-kapat="1">Tamam!</button></div>');
    p.querySelector('[data-kapat]').onclick = function () { p.remove(); };
}
function krKutla(son) {
    let kok = document.fullscreenElement || document.body, e = document.createElement('div'); e.className = 'kr-sahne-kutla';
    let kimler = Object.keys(son.kimler).sort(function (a, b) { return son.kimler[b] - son.kimler[a]; }).map(function (a) { return esc(krKisa(a)) + ' ' + son.kimler[a]; }).join(' · ');
    e.innerHTML = '<div class="kr-kutla-ic"><div class="kr-kutla-isin"></div><img src="' + son.hayvan.src + '" alt=""><div class="kr-kutla-yazi">🎉 ' + esc(son.hayvan.ad.toLocaleUpperCase('tr-TR')) + ' KURTARILDI!</div><div class="kr-kutla-alt">Kurtaranlar: ' + kimler + '</div>'
        + Array.from({ length: 14 }, function (_, j) { return '<i class="kr-yildiz" style="--a:' + (j * 360 / 14) + 'deg;--d:' + (130 + (j % 3) * 50) + 'px">' + ['⭐', '✨', '🔓'][j % 3] + '</i>'; }).join('') + '</div>';
    kok.appendChild(e);
    [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { krSes(f, 0.22); }, i * 140); });
    let kapat = function () { if (!e.parentNode) return; e.classList.add('kapan'); setTimeout(function () { e.remove(); }, 300); };
    e.addEventListener('click', kapat); setTimeout(kapat, 4200);
}
// ---------------- skor tuşları (Yumurta Yuvası'ndaki gibi: 3 ok → gerçek seri)
const KR_PED = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
function krPedRenk(v) { let h = krHalka(v); return h === 'sari' ? ['#FACC15', '#2A1E00'] : h === 'kirmizi' ? ['#EF4444', '#fff'] : h === 'mavi' ? ['#3B82F6', '#fff'] : v === 'M' ? ['#6B6358', '#fff'] : ['#E8E1D6', '#2A1E00']; }
function krPedAc(i) {
    let k = (_kmListe || [])[i]; if (!k) return;
    let oklar = [], p = krPencere('<h2>' + esc(krKisa(k.ad)) + '</h2><p>Serini gir — her ok kendi rengindeki kilide gider!</p><div class="kr-slotlar" data-slot></div>'
        + '<div class="kr-ped">' + KR_PED.map(function (v) { let r = krPedRenk(v); return '<button data-ok="' + v + '" style="background:' + r[0] + ';color:' + r[1] + '">' + v + '</button>'; }).join('') + '</div>'
        + '<div class="kr-ped-alt"><button class="kr-btn" data-sil="1">Son oku sil</button><button class="kr-btn ana" data-kaydet="1" disabled>🔓 Kaydet</button></div>');
    let slot = p.querySelector('[data-slot]'), kaydet = p.querySelector('[data-kaydet]');
    let ciz = function () { slot.innerHTML = [0, 1, 2].map(function (j) { let v = oklar[j]; if (v === undefined) return '<span></span>'; let r = krPedRenk(v); return '<span style="background:' + r[0] + ';color:' + r[1] + ';border-style:solid">' + v + '</span>'; }).join(''); kaydet.disabled = oklar.length < 3; p.querySelectorAll('[data-ok]').forEach(function (b) { b.disabled = oklar.length >= 3; }); };
    p.querySelectorAll('[data-ok]').forEach(function (b) { b.onclick = function () { if (oklar.length < 3) { oklar.push(b.dataset.ok); krSes(500 + krDeger(b.dataset.ok) * 40, 0.05); ciz(); } }; });
    p.querySelector('[data-sil]').onclick = function () { oklar.pop(); ciz(); };
    kaydet.onclick = function () {
        if (oklar.length < 3) return;
        let kayit = oklar.map(function (v) { return { puan: v }; }), sonuc = _skorKaydetCekirdek(k.g, k.ad, kayit);
        let bitti = function () {
            if (!sonuc.ok) { showToast('Seri kaydedilemedi.', 'error'); return; }
            try { klasmanDoldur(); } catch (e) {} try { otomatikYoklamaIsaretle(k.ad, k.g); } catch (e) {}
            p.remove(); kmKurtarmaCiz();
        };
        if (!sonuc.ok && sonuc.sebep === 'limit-doldu') {
            onayIste(esc(k.ad) + ' için günlük seri limiti (' + sonuc.limit + ') doldu.<br><br>Seriyi uzatıp bu skoru kaydedeyim mi?', function () {
                sonuc.grupData.devamModu = true; sonuc.grupData.lastModified = Date.now();
                try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
                try { if (typeof bulutaGonderKontrol === 'function') bulutaGonderKontrol(); } catch (e) {}
                sonuc = _skorKaydetCekirdek(k.g, k.ad, kayit); bitti();
            }, 'Devam Et');
            return;
        }
        bitti();
    };
    ciz();
}
// ---------------- stil (kulüp paleti, koyu)
function krCss() {
    if (!document.getElementById('kr-font') && !document.getElementById('yv-font') && !document.getElementById('kp-font')) { let l = document.createElement('link'); l.id = 'kr-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800;900&display=swap'; document.head.appendChild(l); }
    if (document.getElementById('kr-css')) return;
    let st = document.createElement('style'); st.id = 'kr-css';
    st.textContent = [
        '.kr{--yazi:#FFF1E6;--soluk:#D6A88A;--vurgu:#FD8E01;--ates:#FC5B01;--kart:#2B1209;--cizgi:rgba(253,142,1,.22);--fb:"Baloo 2","Trebuchet MS",system-ui,sans-serif;--fg:"Nunito",system-ui,sans-serif;',
        'color:var(--yazi);font-family:var(--fg);background:radial-gradient(900px 500px at 50% -18%,rgba(215,50,4,.3),transparent 62%),radial-gradient(700px 420px at 100% 110%,rgba(134,28,2,.45),transparent 60%),#160703;border-radius:22px;padding:18px;display:grid;gap:14px;position:relative;overflow:hidden}',
        '.kr:fullscreen{border-radius:0;overflow:auto}.kr button{font-family:inherit;cursor:pointer}.kr button:focus-visible{outline:3px solid var(--vurgu);outline-offset:2px}',
        '.kr-ust{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between}.kr-logo{font:800 32px/1 var(--fb);display:flex;align-items:center;gap:10px}.kr-logo small{display:block;font:800 11.5px var(--fg);letter-spacing:.12em;color:var(--soluk);text-transform:uppercase;margin-top:4px}',
        '.kr-btnlar{display:flex;gap:6px;flex-wrap:wrap}.kr-btn{border:0;border-radius:999px;padding:9px 16px;font:900 14px var(--fg);background:#341710;color:var(--yazi);box-shadow:0 3px 0 rgba(0,0,0,.35),inset 0 0 0 1.5px var(--cizgi);min-height:40px}',
        '.kr-btn.ana{background:linear-gradient(180deg,#FD8E01,#FC5B01);color:#1A0700;box-shadow:0 5px 0 #861C02}.kr-btn:disabled{opacity:.45;cursor:not-allowed}',
        '.kr-sahne{display:grid;grid-template-columns:minmax(240px,320px) 1fr;gap:18px;align-items:center;background:linear-gradient(135deg,#3A170A,#230d05);border-radius:24px;padding:16px;box-shadow:inset 0 0 0 2px rgba(253,142,1,.3)}',
        '.kr-kafes-kap{position:relative;display:flex;flex-direction:column;align-items:center;width:260px;max-width:100%;justify-self:center}.kr-kafes-kap .kr-kafes-svg{width:100%;height:auto}.kr-hayvan{position:absolute;top:22%;left:50%;transform:translateX(-50%);width:62%;display:flex;justify-content:center}',
        '.kr-hayvan img{width:100%;max-width:170px;object-fit:contain;filter:grayscale(.35) brightness(.85) drop-shadow(0 6px 10px rgba(0,0,0,.5));animation:krUzgun 3s ease-in-out infinite}',
        '@keyframes krUzgun{50%{transform:translateY(4px) rotate(-2deg)}}.kr-kafes-svg{position:relative;z-index:1;filter:drop-shadow(0 10px 20px rgba(0,0,0,.5))}',
        '.kr-kafes-ad{margin-top:6px;font:800 20px var(--fb);color:var(--yazi)}',
        '.kr-ilerleme{font:800 18px var(--fb)}.kr-ilerleme b{font-size:30px;color:var(--vurgu)}.kr-ilerleme span{font:800 13px var(--fg);color:var(--soluk);margin-left:6px}',
        '.kr-cubuk{height:14px;border-radius:999px;background:rgba(255,241,230,.1);overflow:hidden;margin:8px 0 12px}.kr-cubuk i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#FD8E01,#FC5B01);transition:width .6s ease}',
        '.kr-kilitler{display:grid;grid-template-columns:repeat(auto-fill,minmax(66px,1fr));gap:8px}',
        '.kr-kilit{display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;border-radius:14px;background:rgba(255,241,230,.05)}.kr-kilit small{font:800 10.5px var(--fg);color:var(--soluk);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.kr-kilit.acik{opacity:.5}.kr-kilit.acik small{color:#4ade80}.kr-kilit.yeni{animation:krAc .9s ease}@keyframes krAc{0%{transform:scale(1);opacity:1}30%{transform:scale(1.35) rotate(-8deg);opacity:1}60%{transform:scale(.95) rotate(5deg)}100%{transform:scale(1);opacity:.5}}',
        '.kr-ipucu{margin-top:8px;font-weight:800;font-size:13px;color:var(--soluk)}',
        '.kr-kurallar{display:flex;flex-wrap:wrap;gap:8px}.kr-kurallar span{background:var(--kart);border-radius:14px;padding:7px 12px;font-weight:800;font-size:13.5px;box-shadow:inset 0 0 0 1.5px var(--cizgi)}',
        '.kr-kartlar{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px}.kr-kart{border:0;border-radius:18px;padding:12px 10px;background:linear-gradient(180deg,#331609,#230d05);color:var(--yazi);box-shadow:0 5px 0 rgba(0,0,0,.35),inset 0 0 0 1.5px var(--cizgi);display:flex;justify-content:space-between;align-items:center;gap:6px;min-height:52px}',
        '.kr-kart-ad{font:800 17px var(--fb);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kr-kart-say{font-weight:900;font-size:13px;color:var(--vurgu);white-space:nowrap}',
        '.kr-raf{background:var(--kart);border-radius:20px;padding:12px;box-shadow:inset 0 0 0 1.5px var(--cizgi)}.kr-raf-bas{font:800 16px var(--fb);margin-bottom:6px}.kr-raf-ic{display:flex;flex-wrap:wrap;gap:8px}',
        '.kr-kurt{display:flex;flex-direction:column;align-items:center;width:72px}.kr-kurt img{width:60px;height:60px;object-fit:contain;animation:krZipla 1.6s ease-in-out infinite;filter:drop-shadow(0 4px 4px rgba(0,0,0,.35))}.kr-kurt:nth-child(2n) img{animation-delay:.4s}.kr-kurt small{font-weight:800;font-size:11px;color:var(--soluk);text-align:center}',
        '@keyframes krZipla{50%{transform:translateY(-8px)}}.kr-bos,.kr-not{margin:0;font-weight:700;color:var(--soluk);font-size:13px}.kr-bos{font-size:15px}',
        '.kr-katman{position:fixed;inset:0;z-index:9500;background:rgba(10,3,1,.7);display:flex;align-items:center;justify-content:center;padding:16px}',
        '.kr-pencere{width:min(560px,100%);max-height:100%;overflow:auto;background:linear-gradient(#2E1309,#1C0904);color:var(--yazi);border-radius:26px;padding:20px;box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 0 0 1.5px var(--cizgi);display:grid;gap:12px;text-align:center}',
        '.kr-pencere h2{margin:0;font:800 clamp(26px,5vw,36px)/1.05 var(--fb)}.kr-pencere p{margin:0;font-weight:700;color:var(--soluk)}.kr-buyuk-yazi{font:800 18px var(--fb)!important;color:var(--yazi)!important}',
        '.kr-nasil-kilit{display:flex;justify-content:center;gap:12px;flex-wrap:wrap}.kr-nasil-kilit div{display:flex;flex-direction:column;align-items:center}.kr-nasil-kilit small{color:var(--soluk);font-weight:800;font-size:11px}',
        '.kr-slotlar{display:flex;gap:8px;justify-content:center}.kr-slotlar span{width:54px;height:54px;border-radius:14px;border:3px dashed rgba(253,142,1,.35);display:flex;align-items:center;justify-content:center;font:800 24px var(--fb)}',
        '.kr-ped{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;max-width:420px;width:100%;margin:0 auto}.kr-ped button{border:0;border-radius:12px;padding:12px 0;font:800 20px var(--fb);box-shadow:inset 0 -4px 0 rgba(0,0,0,.2);min-height:48px}.kr-ped button:disabled{opacity:.4}',
        '.kr-ped-alt{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}',
        '.kr-sahne-kutla{position:fixed;inset:0;z-index:99999;background:radial-gradient(circle at 50% 45%,rgba(255,226,170,.96),rgba(253,142,1,.92) 55%,rgba(134,28,2,.94));display:flex;align-items:center;justify-content:center;cursor:pointer;animation:krGel .25s ease}',
        '.kr-sahne-kutla.kapan{animation:krGit .3s ease forwards}@keyframes krGel{from{opacity:0}}@keyframes krGit{to{opacity:0}}',
        '.kr-kutla-ic{position:relative;display:flex;flex-direction:column;align-items:center;gap:10px}.kr-kutla-ic img{width:min(260px,50vw);height:auto;animation:krFirla .8s cubic-bezier(.2,1.7,.4,1) both;filter:drop-shadow(0 12px 20px rgba(80,20,0,.45))}',
        '@keyframes krFirla{from{transform:scale(.2) translateY(80px);opacity:0}}',
        '.kr-kutla-yazi{font:800 clamp(30px,7vw,58px)/1 "Baloo 2",system-ui,sans-serif;color:#fff;text-shadow:0 4px 0 #861C02,0 10px 30px rgba(80,20,0,.4);text-align:center}.kr-kutla-alt{font:800 clamp(15px,3vw,22px) "Nunito",system-ui,sans-serif;color:#430F02;text-align:center;max-width:90vw}',
        '.kr-kutla-isin{position:absolute;width:560px;height:560px;left:50%;top:40%;margin:-280px 0 0 -280px;border-radius:50%;background:repeating-conic-gradient(rgba(255,255,255,.32) 0 10deg,transparent 10deg 22deg);animation:krDon 9s linear infinite;pointer-events:none;z-index:-1}@keyframes krDon{to{transform:rotate(360deg)}}',
        '.kr-yildiz{position:absolute;left:50%;top:40%;font-style:normal;font-size:28px;opacity:0;animation:krYildiz 1.1s .2s ease-out forwards}@keyframes krYildiz{0%{opacity:1;transform:translate(-50%,-50%) rotate(var(--a)) translateY(0)}100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--a)) translateY(calc(var(--d) * -1))}}',
        '@media (max-width:720px){.kr{padding:12px}.kr-logo{font-size:26px}.kr-sahne{grid-template-columns:1fr}.kr-kafes-kap{width:220px}}',
        '@media (prefers-reduced-motion:reduce){.kr *,.kr-sahne-kutla *{animation:none!important;transition:none!important}}'
    ].join('\n');
    document.head.appendChild(st);
}
window.kmKurtarmaCiz = kmKurtarmaCiz;
