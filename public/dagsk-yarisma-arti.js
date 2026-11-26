// ================================================================================================
// ➕ YARIŞMA ARTI (v468, 2026-11-26) — kullanıcı telefondan yönetiyor: "yarışma alanını nasıl geliştirelim?" →
// 8 öneriden "hepsini yap". Bu dosya dagsk-km-yarisma-pro.js'in sonunda yüklenir (masa + TV cihazında), ya* öneki.
//   🎤 Sesle puan     — giriş penceresinde "dokuz sekiz on" → oklar dolar, 1.5 sn sonra kendiliğinden kaydeder, sıradakine geçer
//   👍 Tek elle çubuk — telefonda tur ekranının altında: ↩ son girişi düzelt · ▶ Sıradaki · 🎤 · ⏱
//   🌟 Rekor anı      — çocuk kendi en iyi serisini geçince TV'de kısa kutlama (sıralama yok, yalnız kendisiyle)
//   🪄 Otomatik kur   — yaş + yay + seviyeye göre hedeflere dağıtır, önizleme gösterir, tek dokunuşla başlatır
//   🧭 Koç özeti      — kim ilerledi / geriledi / sona doğru düştü / okları hangi yöne kaçıyor
//   🗺️ Yolculuk       — sporcunun bütün turlarda ok ortalaması basamakları; veliye WhatsApp (para bilgisi yok)
// Ortak kayda yalnız 'rekorAn' anahtarı eklenir (tek anahtar, üzerine yazılır).
// ================================================================================================
let _ya = { ses: { acik: false, rec: null, metin: '', otoZ: null, calisiyor: false }, son: null, rekorGoster: {} };
function yaA(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;'); }
function yaYeni() { try { return typeof yeniRozet === 'function' ? ' ' + yeniRozet('2026-12-10') : ''; } catch (e) { return ''; } }
function yaOrt(top, ok) { return ok ? top / ok : null; }
function yaV(x) { return x == null ? '–' : x.toFixed(1).replace('.', ','); }

// ------------------------------------------------------------------------------------------------ 🎤 SESLE PUAN
const YA_KELIME = { on: '10', dokuz: '9', sekiz: '8', yedi: '7', 'altı': '6', alti: '6', 'beş': '5', bes: '5', 'dört': '4', dort: '4', 'üç': '3', uc: '3', iki: '2', bir: '1',
    x: 'X', iks: 'X', eks: 'X', ekis: 'X', iksi: 'X', merkez: 'X', 'ıks': 'X',
    'ıska': 'M', iska: 'M', m: 'M', em: 'M', 'sıfır': 'M', sifir: 'M', 'boş': 'M', bos: 'M', 'dışarı': 'M', disari: 'M', miss: 'M', 'kaçtı': 'M' };
const YA_KOMUT = { kaydet: 'kaydet', tamam: 'kaydet', sil: 'sil', geri: 'sil', atla: 'atla', 'sıradaki': 'atla', siradaki: 'atla', dur: 'dur', kapat: 'dur', bitir: 'dur' };
function yaSesVarMi() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
// Metni puanlara çevirir: ["9","8","10"] ve komutlar. Rakam dizileri açgözlü: "9810" → 9, 8, 10 · "0" → M.
function yaSesCoz(metin) {
    let t = String(metin || '').toLocaleLowerCase('tr').replace(/[.,;:!?'"’\-]/g, ' ').split(/\s+/).filter(Boolean), r = [];
    t.forEach(function (w) {
        if (YA_KOMUT[w]) return r.push({ komut: YA_KOMUT[w] });
        if (/^\d+$/.test(w)) { let s = w; while (s.length) { if (s.slice(0, 2) === '10') { r.push({ p: '10' }); s = s.slice(2); } else { r.push({ p: s[0] === '0' ? 'M' : s[0] }); s = s.slice(1); } } return; }
        if (YA_KELIME[w]) r.push({ p: YA_KELIME[w] });
    });
    return r;
}
function yaSesUygula(metin) {
    let parca = yaSesCoz(metin); _ya.ses.metin = metin;
    parca.forEach(function (x) {
        let g = _yz.giris;
        if (x.komut === 'dur') { yaSesKapat(); return; }
        if (g && g.tamamEkrani) { if (x.komut === 'atla' || x.komut === 'kaydet') yzGirisSeriGec(true); return; }
        if (!g) { if (x.komut !== 'atla' && !x.p) return; yaSiradakiAc(); g = _yz.giris; if (!g || g.tamamEkrani || !x.p) return; }
        if (x.komut === 'sil') { yaOtoIptal(); return yzOkSil(); }
        if (x.komut === 'atla') { yaOtoIptal(); return yzGirisAtla(); }
        if (x.komut === 'kaydet') { yaOtoIptal(); return yzGirisKaydet(); }
        if (x.p) { if (_yz.yonBek && typeof yzYonBitir === 'function') yzYonBitir(null, true); yzOkEkle(x.p); }
    });
    yaSesDurumYaz();
    let g = _yz.giris, d = yzOku().durum;
    if (g && !g.tamamEkrani && d && g.oklar.length >= yzGirisOkSay(g, d)) yaOtoKaydet();
}
function yaOtoIptal() { if (_ya.ses.otoZ) { clearTimeout(_ya.ses.otoZ); _ya.ses.otoZ = null; yaSesDurumYaz(); } }
function yaOtoKaydet() {
    yaOtoIptal(); let g = _yz.giris; if (!g) return; let kim = g.k + ':' + g.seri;
    _ya.ses.otoZ = setTimeout(function () { _ya.ses.otoZ = null; let g2 = _yz.giris; if (g2 && !g2.tamamEkrani && g2.k + ':' + g2.seri === kim) yzGirisKaydet(); }, 1500);
    yaSesDurumYaz();
}
function yaSesAc() {
    if (!yaSesVarMi()) return showToast('Bu tarayıcı sesle girişi desteklemiyor — telefonda Chrome ile aç.', 'warning');
    if (_ya.ses.acik) return;
    let SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = new SR();
    rec.lang = 'tr-TR'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 1;
    rec.onresult = function (e) {
        let ara = '';
        for (let i = e.resultIndex; i < e.results.length; i++) { let r = e.results[i]; if (r.isFinal) yaSesUygula(r[0].transcript); else ara += r[0].transcript; }
        if (ara) { _ya.ses.metin = ara + '…'; yaSesDurumYaz(); }
    };
    rec.onerror = function (e) { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { _ya.ses.acik = false; showToast('Mikrofon izni verilmedi.', 'error'); yaSesDurumYaz(); yaBarYenile(); } };
    rec.onend = function () { _ya.ses.calisiyor = false; if (_ya.ses.acik) setTimeout(function () { if (_ya.ses.acik) try { rec.start(); _ya.ses.calisiyor = true; } catch (e) {} }, 250); };
    _ya.ses.rec = rec; _ya.ses.acik = true; _ya.ses.metin = '';
    try { rec.start(); _ya.ses.calisiyor = true; } catch (e) {}
    showToast('🎤 Dinliyorum — "dokuz sekiz on" de. "Sil", "atla", "dur" da olur.', 'success');
    if (!_yz.giris) yaSiradakiAc();
    yaSesDurumYaz(); yaBarYenile();
}
function yaSesKapat() { _ya.ses.acik = false; yaOtoIptal(); try { _ya.ses.rec && _ya.ses.rec.stop(); } catch (e) {} _ya.ses.rec = null; yaSesDurumYaz(); yaBarYenile(); }
function yaSesDegis() { if (_ya.ses.acik) yaSesKapat(); else yaSesAc(); }
function yaSesDurumYaz() {
    let kap = document.getElementById('yz-giris'); if (!kap) return;
    let btn = kap.querySelector('.ya-mik'); if (btn) btn.classList.toggle('aktif', _ya.ses.acik);
    let el = kap.querySelector('.ya-ses-durum'); if (!el) return;
    el.style.display = _ya.ses.acik ? '' : 'none';
    el.innerHTML = _ya.ses.otoZ ? '<b>💾 Kaydediyorum…</b> <button class="yz-btn" onclick="yaOtoIptal()">Bekle</button>'
        : '<span class="ya-nabiz"></span> <b>Dinliyorum</b>' + (_ya.ses.metin ? ' · “' + yaA(_ya.ses.metin) + '”' : ' · "dokuz sekiz on", "sil", "atla", "dur"');
}

// ------------------------------------------------------------------------------------------------ 👍 TEK ELLE ÇUBUK
function yaSiradaki(o) {
    let d = o.durum; if (!d || d.asama !== 'tur') return null;
    let f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1);
    let k = yzHedefSirasi(o).find(function (x) { return !yzSkor(o, x)[seri]; });
    return { k: k || null, seri: seri, son: seri >= f.seri - 1 };
}
function yaSiradakiAc() {
    let o = yzOku(), s = yaSiradaki(o); if (!s) return;
    if (s.k) return yzGirisAc(yzEnc(s.k), s.seri);
    if (s.son) return yzBitir();
    yzGirisSeriGec(!o.sayac);
}
function yaSonDuzelt() { let s = _ya.son, d = yzOku().durum; if (!s || !d || d.id !== s.id) return showToast('Düzeltilecek son giriş yok.', 'info'); yzGirisAc(yzEnc(s.k), s.seri); }
function yaBarHTML(o) {
    let s = yaSiradaki(o); if (!s) return '';
    let d = o.durum, ana;
    if (s.k) ana = '<button class="ya-bar-ana" onclick="yaSiradakiAc()"><small>Sıradaki · ' + (s.seri + 1) + '. seri</small><b>' + esc((d.hedefler || {})[s.k] || '') + ' · ' + esc(yzKisaAd(yzKAd(s.k))) + '</b></button>';
    else ana = '<button class="ya-bar-ana tamam" onclick="yaSiradakiAc()"><small>✅ ' + (s.seri + 1) + '. seri tamam</small><b>' + (s.son ? '🏁 Turu bitir' : '▶ ' + (s.seri + 2) + '. seri' + (o.sayac ? '' : ' + süre')) + '</b></button>';
    let sonVar = _ya.son && _ya.son.id === d.id;
    return '<div id="ya-bar" class="ya-bar" role="toolbar" aria-label="Tek elle yönetim">'
        + '<button class="ya-bar-k" onclick="yaSonDuzelt()"' + (sonVar ? '' : ' disabled') + ' title="Son girişi düzelt"><i>↩</i><small>Düzelt</small></button>'
        + ana
        + (yaSesVarMi() ? '<button class="ya-bar-k' + (_ya.ses.acik ? ' aktif' : '') + '" onclick="yaSesDegis()" title="Sesle puan"><i>🎤</i><small>' + (_ya.ses.acik ? 'Açık' : 'Ses') + '</small></button>' : '')
        + (o.sayac ? '' : '<button class="ya-bar-k" onclick="yzSayacBaslat()" title="Seri süresini başlat"><i>⏱</i><small>Süre</small></button>')
        + '</div>';
}
function yaBarYenile() {
    let ic = document.getElementById('km-icerik'), eski = document.getElementById('ya-bar');
    let o = yzOku(), d = o.durum, ok = ic && _yz.mod === 'siralama' && d && d.asama === 'tur' && !d.ayar.dogrudan && (typeof _kmAktifSekme === 'undefined' || !_kmAktifSekme || _kmAktifSekme === 'yarisma');
    if (!ok) { if (eski) eski.remove(); return; }
    let h = yaBarHTML(o); if (eski) eski.outerHTML = h; else ic.insertAdjacentHTML('beforeend', h);
}

// ------------------------------------------------------------------------------------------------ 🌟 REKOR ANI
// Önceki en iyi seri: aynı mesafe + aynı hedef kağıdı + aynı ok sayısındaki arşiv turları + bu turun önceki serileri.
// En az 3 önceki seri yoksa (yeni çocuk) rekor sayılmaz — ilk serisi hep "rekor" olmasın.
function yaEnIyiSeri(o, k, haricSeri) {
    let d = o.durum, f = yzFormat(d), okSay = yzOkSayiK(d, k), yuz = d.ayar.yuz || '6', enIyi = null, n = 0;
    yzArsivOku().forEach(function (r) {
        if (r.id === d.id || r.mesafe !== d.ayar.mesafe || (r.yuz || '6') !== yuz || yzFormatBul(r.format).ok !== okSay) return;
        let s = (r.sporcular || []).find(function (x) { return x.k === k; }); if (!s) return;
        (s.seriT || []).forEach(function (v) { if (v != null) { n++; if (enIyi == null || v > enIyi) enIyi = v; } });
    });
    yzSkor(o, k).forEach(function (e, i) { if (!e || i === haricSeri || e.length !== okSay) return; let v = yzTop(e); n++; if (enIyi == null || v > enIyi) enIyi = v; });
    return { enIyi: enIyi, n: n, f: f };
}
function yaRekorKontrol(g, oOnce) {
    let o = yzOku(), d = o.durum; if (!d || d.id !== g.id) return;
    let e = yzSkor(o, g.k)[g.seri]; if (!e) return;
    let b = yaEnIyiSeri(oOnce, g.k, g.seri), top = yzTop(e);
    if (b.n < 3 || b.enIyi == null || top <= b.enIyi) return;
    let an = { id: d.id, k: g.k, ad: yzKAd(g.k), top: top, eski: b.enIyi, seri: g.seri, ts: Date.now() };
    yzGuncelle(function (x) { x.rekorAn = an; });
    showToast('🌟 ' + yzKisaAd(an.ad) + ' kendi rekorunu kırdı: ' + top + ' (eski ' + b.enIyi + ')', 'success');
    if (_yz.tv) yaRekorGoster(an);
}
function yaRekorGoster(an) {
    if (!an || _ya.rekorGoster[an.ts] || Date.now() - an.ts > 20000) return; _ya.rekorGoster[an.ts] = 1;
    let eski = document.getElementById('ya-rekor'); if (eski) eski.remove();
    let el = document.createElement('div'); el.id = 'ya-rekor'; el.className = 'ya-rekor';
    let kon = ''; for (let i = 0; i < 26; i++) kon += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;animation-delay:' + (Math.random() * 0.9).toFixed(2) + 's;background:' + ['#f5c542', '#38bdf8', '#f472b6', '#34d399', '#fb923c'][i % 5] + '"></i>';
    el.innerHTML = '<div class="ya-rekor-kon">' + kon + '</div><div class="ya-rekor-kart"><div class="ya-rekor-ust">🌟 YENİ KİŞİSEL REKOR</div>'
        + '<div class="ya-rekor-yuz">' + yzFotoYuz(an.k) + '</div><div class="ya-rekor-ad">' + esc(an.ad) + '</div>'
        + '<div class="ya-rekor-sayi"><b>' + an.top + '</b><span>bu seri</span></div><div class="ya-rekor-alt">Önceki en iyi serisi ' + an.eski + ' · kendini geçti!</div></div>';
    (document.fullscreenElement || document.body).appendChild(el);
    try { yzSesHazirla(); let ac = _yz.ac; if (ac) [523, 659, 784, 1047].forEach(function (hz, i) { let os = ac.createOscillator(), gn = ac.createGain(), t = ac.currentTime + i * 0.13; os.type = 'triangle'; os.frequency.value = hz; gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.25, t + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.35); os.connect(gn); gn.connect(ac.destination); os.start(t); os.stop(t + 0.4); }); } catch (e) {}
    setTimeout(function () { el.classList.add('cik'); setTimeout(function () { el.remove(); }, 600); }, 6500);
    el.addEventListener('click', function () { el.remove(); });
}

// ------------------------------------------------------------------------------------------------ 🪄 OTOMATİK KURULUM
function yaSeviye(k, mesafe) {
    let a = yzArsivOku(), top = 0, ok = 0;
    let al = function (fn) { a.filter(fn).slice(-5).forEach(function (r) { let s = (r.sporcular || []).find(function (x) { return x.k === k; }); if (s && s.ok) { top += s.toplam; ok += s.ok; } }); };
    al(function (r) { return r.mesafe === mesafe; }); if (ok < 12) { top = 0; ok = 0; al(function () { return true; }); }
    return ok >= 6 ? top / ok : null;
}
function yaYay(k) { let i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)] && turnuvaDB[k.slice(0, i)][k.slice(i + 1)]; return (sp && sp.yay) === 'Makaralı' ? 'Makaralı' : 'Klasik'; }
function yaOtoPlan() {
    let t = yzKurulumTaslak(), kisi = t.katilimci.slice(); if (!kisi.length) kisi = yzRoster().map(function (r) { return r.g + '|' + r.ad; });
    let yaslar = kisi.map(yzSporcuYas).filter(function (y) { return y != null; });
    let kucuk = yaslar.length && yaslar.filter(function (y) { return y >= 9 && y <= 12; }).length / yaslar.length >= 0.6 && !yaslar.some(function (y) { return y > 13; });
    let kat = kucuk ? 'k912' : (t.kategori || 'serbest'), K = YZ_KATEGORI[kat] || {}, mesafe = K.mesafe || t.mesafe;
    let bilgi = kisi.map(function (k) { return { k: k, yay: yaYay(k), yas: yzSporcuYas(k), sv: yaSeviye(k, mesafe) }; });
    // Makaralılar kendi hedeflerinde; aynı yayda seviyesi yakın olanlar yan yana (bilinmeyen en sonda, yaşa göre).
    bilgi.sort(function (a, b) { return (a.yay === b.yay ? 0 : a.yay === 'Klasik' ? -1 : 1) || ((b.sv == null ? -1 : b.sv) - (a.sv == null ? -1 : a.sv)) || ((b.yas || 0) - (a.yas || 0)) || yzKAd(a.k).localeCompare(yzKAd(b.k), 'tr'); });
    let n = bilgi.length, hb = n <= 5 ? 2 : n <= 15 ? 3 : 4;
    // Yay değişiminde hedef boşluğu: makaralılar yeni hedeften başlasın (boş yerleri doldurmak için yer tutucu yok, sırayı kaydırırız).
    let sira = [], hedefler = [], cur = [];
    bilgi.forEach(function (b, i) { if (cur.length && (cur.length >= hb || cur[0].yay !== b.yay)) { hedefler.push(cur); cur = []; } cur.push(b); });
    if (cur.length) hedefler.push(cur);
    hedefler.forEach(function (h) { h.forEach(function (b) { sira.push(b.k); }); });
    return { kat: kat, K: K, mesafe: mesafe, hb: hb, hedefler: hedefler, kisi: sira };
}
function yaOtoKurAc() {
    let p = yaOtoPlan(); if (!p.kisi.length) return showToast('Derste sporcu yok.', 'warning');
    _ya.plan = p;
    let satir = p.hedefler.map(function (h, i) {
        return '<div class="ya-oh"><div class="ya-oh-no">HEDEF ' + (i + 1) + '<small>' + (h[0].yay === 'Makaralı' ? '⚙️ Makaralı' : '🏹 Klasik') + '</small></div><div class="ya-oh-sp">'
            + h.map(function (b) { return '<span>' + esc(yzKisaAd(yzKAd(b.k))) + '<small>' + (b.yas != null ? b.yas + ' yaş' : '') + (b.sv != null ? ' · ort ' + yaV(b.sv) : ' · yeni') + '</small></span>'; }).join('') + '</div></div>';
    }).join('');
    yaPencere('🪄 Otomatik kurulum', '<div class="yz-alt" style="margin-bottom:10px">' + p.kisi.length + ' sporcu · <b>' + esc(p.mesafe) + '</b>' + (p.K.aciklama ? ' · ' + esc(p.K.ad) + ' (' + esc(p.K.aciklama) + ')' : '') + ' · hedef başına ' + p.hb + ' kişi. Aynı yay bir arada, seviyesi yakın olanlar aynı hedefte.</div>'
        + satir
        + '<div class="ya-p-btn"><button class="yz-btn ana buyuk" onclick="yaOtoBaslat()">🏁 Böyle başlat</button><button class="yz-btn buyuk" onclick="yaOtoUygula(); yaPencereKapat()">✏️ Uygula, ayarlara bakayım</button></div>');
}
function yaOtoUygula() {
    let p = _ya.plan, t = yzKurulumTaslak(); if (!p) return;
    if (p.kat !== (t.kategori || 'serbest') && typeof yzKurKategori === 'function' && YZ_KATEGORI[p.kat]) { t.kategori = p.kat; let K = YZ_KATEGORI[p.kat]; if (K.mesafe) { t.mesafe = K.mesafe; t.yuz = K.yuz; t.format = K.format; t.sure = K.sure; } }
    t.katilimci = p.kisi.slice(); t.hedefBasi = p.hb; t.tur = 'siralama';
    t.yaHb = p.hb; t.yaHedef = {}; p.hedefler.forEach(function (h, i) { h.forEach(function (b, j) { t.yaHedef[b.k] = (i + 1) + 'ABCD'.charAt(j); }); });
    yzCiz();
}
function yaOtoBaslat() { yaOtoUygula(); yaPencereKapat(); yzBaslat(); }

// ------------------------------------------------------------------------------------------------ 🧭 KOÇ ÖZETİ
const YA_YON = [['sağa', '→'], ['sağ alta', '↘'], ['aşağıya', '↓'], ['sol alta', '↙'], ['sola', '←'], ['sol üste', '↖'], ['yukarıya', '↑'], ['sağ üste', '↗']];
function yaYonBul(o, k) {
    let p = yzKonumlar(o, k); if (p.length < 6) return null;
    let mx = 0, my = 0; p.forEach(function (q) { mx += q.x; my += q.y; }); mx /= p.length; my /= p.length;
    if (Math.hypot(mx, my) < 0.14) return null;
    let a = Math.atan2(my, mx), i = Math.round(a / (Math.PI / 4)); i = ((i % 8) + 8) % 8;
    return { ad: YA_YON[i][0], ok: YA_YON[i][1], n: p.length };
}
function yaKocVeri(o) {
    let d = o.durum, f = yzFormat(d), yuz = d.ayar.yuz || '6';
    return yzSiralama(o).filter(function (r) { return r.ok; }).map(function (r) {
        let onc = yzArsivOku().filter(function (a) { return a.id !== d.id && a.mesafe === d.ayar.mesafe && (a.yuz || '6') === yuz; }).slice(-3), top = 0, ok = 0;
        onc.forEach(function (a) { let s = (a.sporcular || []).find(function (x) { return x.k === r.k; }); if (s && s.ok) { top += s.toplam; ok += s.ok; } });
        let simdi = r.toplam / r.ok, once = ok >= 6 ? top / ok : null;
        let girilen = r.seriT.map(function (v, i) { return v == null ? null : { v: v, n: (yzSkor(o, r.k)[i] || []).length }; }).filter(Boolean), yari = Math.floor(girilen.length / 2), dusus = null;
        if (girilen.length >= 6) { let s1 = girilen.slice(0, yari), s2 = girilen.slice(yari), o1 = s1.reduce(function (a, x) { return a + x.v; }, 0) / s1.reduce(function (a, x) { return a + x.n; }, 0), o2 = s2.reduce(function (a, x) { return a + x.v; }, 0) / s2.reduce(function (a, x) { return a + x.n; }, 0); dusus = o2 - o1; }
        return { k: r.k, ad: r.ad, simdi: simdi, once: once, fark: once == null ? null : simdi - once, dusus: dusus, yon: yaYonBul(o, r.k), seri: girilen.length };
    });
}
function yaKocOzetAc() {
    let o = yzOku(), d = o.durum; if (!d || !d.katilimci) return showToast('Önce bir tur başlat.', 'info');
    let v = yaKocVeri(o); if (!v.length) return showToast('Henüz girilmiş seri yok.', 'info');
    let sat = function (x, sag) { return '<button class="ya-ks" onclick="yaPencereKapat(); yzAnalizAc(\'' + encodeURIComponent(x.k) + '\')"><span>' + esc(yzKisaAd(x.ad)) + '</span><b>' + sag + '</b></button>'; };
    let bolum = function (baslik, alt, liste, fn) { return liste.length ? '<div class="ya-kb"><div class="ya-kb-bas">' + baslik + ' <small>' + alt + '</small></div>' + liste.map(fn).join('') + '</div>' : ''; };
    let ilerl = v.filter(function (x) { return x.fark != null && x.fark >= 0.3; }).sort(function (a, b) { return b.fark - a.fark; });
    let geri = v.filter(function (x) { return x.fark != null && x.fark <= -0.3; }).sort(function (a, b) { return a.fark - b.fark; });
    let dus = v.filter(function (x) { return x.dusus != null && x.dusus <= -0.7; }).sort(function (a, b) { return a.dusus - b.dusus; });
    let yon = v.filter(function (x) { return x.yon; });
    let yeni = v.filter(function (x) { return x.once == null; });
    let sabit = v.filter(function (x) { return x.fark != null && Math.abs(x.fark) < 0.3; });
    let html = '<div class="yz-alt" style="margin-bottom:8px">Ok ortalaması, aynı mesafe ve hedef kağıdındaki son 3 turla karşılaştırılır. İsme dokun → o sporcunun analizi.</div>'
        + bolum('📈 İlerleyenler', 'son turlarına göre', ilerl, function (x) { return sat(x, yaV(x.once) + ' → ' + yaV(x.simdi) + ' <em class="yu">+' + yaV(x.fark) + '</em>'); })
        + bolum('📉 Gerileyenler', 'bir konuşmak iyi olur', geri, function (x) { return sat(x, yaV(x.once) + ' → ' + yaV(x.simdi) + ' <em class="du">' + yaV(x.fark) + '</em>'); })
        + bolum('🔋 Sona doğru düşenler', '2. yarı, 1. yarıdan zayıf', dus, function (x) { return sat(x, '<em class="du">' + yaV(x.dusus) + ' / ok</em>'); })
        + bolum('🧭 Okları bir yöne kaçanlar', 'hedefe dokunarak girilen oklardan', yon, function (x) { return sat(x, x.yon.ok + ' ' + x.yon.ad + ' <small>(' + x.yon.n + ' ok)</small>'); })
        + bolum('➖ Aynı seviyede', '±0,3 içinde', sabit, function (x) { return sat(x, yaV(x.simdi)); })
        + bolum('🆕 Karşılaştıracak tur yok', 'ilk turları', yeni, function (x) { return sat(x, yaV(x.simdi)); })
        + (yon.length ? '' : '<div class="yz-alt">🧭 Yön için okları "Puan + yön" ya da "Hedefe dokun" ile girmek gerekir.</div>');
    yaPencere('🧭 Koç özeti · ' + (d.asama === 'bitti' ? 'tur sonu' : (Math.min(d.seri, yzFormat(d).seri - 1) + 1) + '. seriye kadar'), html);
}

// ------------------------------------------------------------------------------------------------ 🗺️ YOLCULUK (sezon)
function yaYolVeri(k) {
    let l = [], enIyiSeri = null, enIyiTarih = null;
    yzArsivOku().slice().sort(function (a, b) { return a.t - b.t; }).forEach(function (r) {
        let s = (r.sporcular || []).find(function (x) { return x.k === k; }); if (!s || !s.ok) return;
        (s.seriT || []).forEach(function (v) { if (v != null && (enIyiSeri == null || v > enIyiSeri)) { enIyiSeri = v; enIyiTarih = r.tarih; } });
        l.push({ tarih: r.tarih, ort: s.toplam / s.ok, mesafe: r.mesafe, ok: s.ok });
    });
    let o = yzOku(), d = o.durum;
    if (d && d.katilimci && d.katilimci.indexOf(k) !== -1 && d.asama !== 'kurulum' && !yzArsivOku().some(function (r) { return r.id === d.id; })) {
        let r = yzSiralama(o).find(function (x) { return x.k === k; }); if (r && r.ok) l.push({ tarih: bugunISO(), ort: r.toplam / r.ok, mesafe: d.ayar.mesafe, ok: r.ok, simdi: true });
        r && r.seriT.forEach(function (v) { if (v != null && (enIyiSeri == null || v > enIyiSeri)) { enIyiSeri = v; enIyiTarih = bugunISO(); } });
    }
    return { l: l, enIyiSeri: enIyiSeri, enIyiTarih: enIyiTarih };
}
function yaYolSvg(l, w, h) {
    if (!l.length) return '';
    let min = Math.min.apply(null, l.map(function (x) { return x.ort; })), max = Math.max.apply(null, l.map(function (x) { return x.ort; }));
    if (max - min < 1) { let m = (max + min) / 2; min = m - 0.5; max = m + 0.5; }
    let px = function (i) { return l.length === 1 ? w / 2 : 22 + i * (w - 44) / (l.length - 1); }, py = function (v) { return h - 26 - (v - min) / (max - min) * (h - 52); };
    let enIyi = Math.max.apply(null, l.map(function (x) { return x.ort; }));
    let yol = l.map(function (x, i) { return (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(x.ort).toFixed(1); }).join(' ');
    let tas = l.map(function (x, i) { let iyi = x.ort === enIyi; return '<g><circle cx="' + px(i).toFixed(1) + '" cy="' + py(x.ort).toFixed(1) + '" r="' + (iyi ? 9 : 6) + '" fill="' + (iyi ? '#f5c542' : x.simdi ? '#38bdf8' : '#e2e8f0') + '" stroke="#0f172a" stroke-width="2"/>' + (l.length <= 12 || iyi || i === l.length - 1 ? '<text x="' + px(i).toFixed(1) + '" y="' + (py(x.ort) - 14).toFixed(1) + '" text-anchor="middle" font-size="12" font-weight="800" fill="currentColor">' + yaV(x.ort) + '</text>' : '') + '</g>'; }).join('');
    return '<svg class="ya-yol-svg" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Ok ortalaması turdan tura"><path d="' + yol + '" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 9" opacity=".8"/>' + tas + '</svg>';
}
function yaYolMetin(k, v) {
    let ad = yzKAd(k), ilk = v.l[0], son = v.l[v.l.length - 1], fark = son.ort - ilk.ort;
    let ay = function (t) { try { return new Date(t + 'T12:00:00').toLocaleDateString('tr-TR', { month: 'long' }); } catch (e) { return ''; } };
    let hedef = Math.ceil((son.ort + 0.3) * 10) / 10;
    return 'DAĞ S.K. · ' + ad + ' — yarışma yolculuğu 🏹\n'
        + v.l.length + ' yarışma' + (v.l.length > 1 ? ' (' + ay(ilk.tarih) + (ay(ilk.tarih) !== ay(son.tarih) ? '–' + ay(son.tarih) : '') + ')' : '') + '\n'
        + 'Ok ortalaması: ' + (v.l.length > 1 ? yaV(ilk.ort) + ' → ' + yaV(son.ort) + (fark >= 0.1 ? ' ⬆️' : fark <= -0.1 ? '' : '') : yaV(son.ort)) + '\n'
        + (v.enIyiSeri != null ? 'En iyi serisi: ' + v.enIyiSeri + '\n' : '')
        + 'Sıradaki hedefi: ' + yaV(hedef) + ' ortalama 🎯';
}
function yaYolculukAc(kEnc) {
    if (!kEnc) return yaYolListe();
    let k = decodeURIComponent(kEnc), v = yaYolVeri(k);
    if (!v.l.length) return yaPencere('🗺️ ' + esc(yzKAd(k)), '<div class="yz-alt">Bu sporcunun henüz tamamlanmış yarışma turu yok.</div><div class="ya-p-btn"><button class="yz-btn" onclick="yaYolListe()">← Liste</button></div>');
    let ilk = v.l[0], son = v.l[v.l.length - 1], fark = son.ort - ilk.ort;
    let gi = k.indexOf('|'), sp = turnuvaDB[k.slice(0, gi)] && turnuvaDB[k.slice(0, gi)][k.slice(gi + 1)], tel = sp && sp.acilTelefon;
    yaPencere('🗺️ ' + esc(yzKAd(k)) + ' · yolculuk',
        '<div class="ya-yol-ust"><span><b>' + v.l.length + '</b> yarışma</span><span>Ok ort. <b>' + (v.l.length > 1 ? yaV(ilk.ort) + ' → ' + yaV(son.ort) : yaV(son.ort)) + '</b>' + (v.l.length > 1 ? ' <em class="' + (fark >= 0 ? 'yu' : 'du') + '">' + (fark >= 0 ? '+' : '') + yaV(fark) + '</em>' : '') + '</span>' + (v.enIyiSeri != null ? '<span>En iyi seri <b>' + v.enIyiSeri + '</b></span>' : '') + '</div>'
        + yaYolSvg(v.l, 360, 190)
        + '<div class="yz-alt">Her taş bir yarışma turu (ok ortalaması). ⭐ sarı = en iyi tur' + (son.simdi ? ', mavi = bugünkü' : '') + '. Mesafeler: ' + esc(Array.from(new Set(v.l.map(function (x) { return x.mesafe; }))).join(', ')) + '. Sıralama gösterilmez — çocuk yalnız kendisiyle yarışır.</div>'
        + '<pre class="ya-yol-mesaj">' + yaA(yaYolMetin(k, v)) + '</pre>'
        + '<div class="ya-p-btn"><button class="yz-btn ana buyuk" onclick="yaYolGonder(\'' + yzEnc(k) + '\')">📲 Veliye gönder' + (tel ? '' : ' (numara yok)') + '</button><button class="yz-btn" onclick="yaYolListe()">← Liste</button></div>');
}
function yaYolGonder(kEnc) {
    let k = decodeURIComponent(kEnc), v = yaYolVeri(k); if (!v.l.length) return;
    let gi = k.indexOf('|'), sp = turnuvaDB[k.slice(0, gi)] && turnuvaDB[k.slice(0, gi)][k.slice(gi + 1)];
    let numara = typeof telefonWaFormat === 'function' ? telefonWaFormat((sp && sp.acilTelefon) || '') : '';
    window.open((numara ? 'https://api.whatsapp.com/send?phone=' + numara + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(yaYolMetin(k, v)), '_blank');
    _ya.gonderildi = _ya.gonderildi || {}; _ya.gonderildi[k] = 1;
}
function yaYolListe() {
    let o = yzOku(), d = o.durum, kisi = d && d.katilimci && d.asama !== 'kurulum' ? yzHedefSirasi(o) : yzRoster().map(function (r) { return r.g + '|' + r.ad; });
    let sat = kisi.map(function (k) {
        let v = yaYolVeri(k), l = v.l, mini = l.length >= 2 ? yaYolSvg(l.slice(-8), 120, 44).replace('class="ya-yol-svg"', 'class="ya-yol-mini"').replace(/<text[^>]*>[^<]*<\/text>/g, '') : '';
        let son = l[l.length - 1], ilk = l[0];
        return '<div class="ya-yl"><button class="ya-yl-ad" onclick="yaYolculukAc(\'' + yzEnc(k) + '\')"><b>' + esc(yzKisaAd(yzKAd(k))) + '</b><small>' + (l.length ? l.length + ' tur · ' + (l.length > 1 ? yaV(ilk.ort) + ' → ' : '') + yaV(son.ort) : 'henüz tur yok') + '</small></button>' + mini
            + (l.length ? '<button class="yz-btn ya-yl-g' + (_ya.gonderildi && _ya.gonderildi[k] ? ' gitti' : '') + '" onclick="yaYolGonder(\'' + yzEnc(k) + '\'); this.classList.add(\'gitti\')" aria-label="Veliye gönder">📲</button>' : '') + '</div>';
    }).join('');
    yaPencere('🗺️ Yarışma yolculuğu', '<div class="yz-alt" style="margin-bottom:8px">Her sporcunun turdan tura ok ortalaması. Ada dokun → yolculuk kartı. 📲 → veliye WhatsApp (yalnız kendi gelişimi; sıralama ve para yok).</div>' + sat);
}

// ------------------------------------------------------------------------------------------------ ortak pencere (telefonda tam ekran)
function yaPencere(baslik, govde) {
    yaPencereKapat();
    let el = document.createElement('div'); el.id = 'ya-pencere'; el.className = 'ya-p-arka';
    el.innerHTML = '<div class="ya-p" role="dialog" aria-modal="true" aria-label="' + yaA(baslik.replace(/<[^>]+>/g, '')) + '"><div class="ya-p-bas"><b>' + baslik + '</b><button class="yz-btn" onclick="yaPencereKapat()" aria-label="Kapat">✕</button></div><div class="ya-p-ic">' + govde + '</div></div>';
    el.addEventListener('click', function (e) { if (e.target === el) yaPencereKapat(); });
    (document.fullscreenElement && document.fullscreenElement !== document.documentElement ? document.fullscreenElement : document.body).appendChild(el);
}
function yaPencereKapat() { let el = document.getElementById('ya-pencere'); if (el) el.remove(); }


// ------------------------------------------------------------------------------------------------ 📱 HEDEF HATTI (telefon masası)
// 2026-11-26 (kullanıcı telefondan yönetiyor; A/B taslağından "A · Hedef hattı"): telefonda tur ekranı yalnız seri, süre ve
// hedef hedef sporcular. Kim girdi (yeşil), kim sırada (turuncu), kim bekliyor (soluk) renginden anlaşılır. Sporcuya dokun →
// puan penceresi. İlerleme alttaki çubukta (Sıradaki / seri tamam → sonraki seri). Tablo, grafik, araçlar ⋯ ve "Ayrıntılı ekran"da.
const YA_MASA_ANAHTAR = 'dag_yz_masa';
function yaHatGenislik() { return (window.innerWidth || document.documentElement.clientWidth || 1000) <= 600; }
function yaHatMi(o) {
    let d = o && o.durum; if (!d || d.asama !== 'tur' || !d.ayar || d.ayar.dogrudan || d.ayar.minik) return false;
    try { if (localStorage.getItem(YA_MASA_ANAHTAR) === 'eski') return false; } catch (e) {}
    return yaHatGenislik();
}
function yaMasaSec(m) { try { if (m === 'eski') localStorage.setItem(YA_MASA_ANAHTAR, 'eski'); else localStorage.removeItem(YA_MASA_ANAHTAR); } catch (e) {} yzCiz(); window.scrollTo(0, 0); }
function yaHatHTML(o) {
    let d = o.durum, f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1), n = d.katilimci.length;
    let bek = yzBekleyenler(o, seri), girilen = n - bek.length, sonSeri = seri >= f.seri - 1, tamam = !bek.length;
    let sira = {}; yzSiralama(o).forEach(function (r) { sira[r.k] = r; });
    let sir = yaSiradaki(o), siradaki = sir && sir.k;
    let yariArasi = f.yari && seri === f.yari && d.katilimci.every(function (k) { return !yzSkor(o, k)[seri]; });
    let gruplar = {}; yzHedefSirasi(o).forEach(function (k) { let h = String((d.hedefler || {})[k] || '?'), no = h.replace(/[A-D]$/, ''); (gruplar[no] = gruplar[no] || []).push(k); });
    let liste = Object.keys(gruplar).sort(function (a, b) { return (+a) - (+b); }).map(function (no) {
        let ks = gruplar[no], mak = ks.every(function (k) { return yaYay(k) === 'Makaralı'; });
        return '<div class="ya-hh"><h3>HEDEF ' + esc(no) + (mak ? ' · MAKARALI' : '') + '</h3>' + ks.map(function (k) {
            let e = yzSkor(o, k)[seri], r = sira[k] || { toplam: 0 }, durum = e ? 'tamam' : k === siradaki ? 'sira' : 'bek';
            return '<button class="ya-hs ' + durum + '" data-k="' + yaA(k) + '" onclick="yzGirisAc(\'' + yzEnc(k) + '\',' + seri + ')">' + yzFotoYuz(k, 'ya-hs-yuz')
                + '<span class="ya-hs-ad">' + esc(yzKisaAd(yzKAd(k))) + '<small>' + esc((d.hedefler || {})[k] || '') + ' · Toplam ' + r.toplam + (d.okK && d.okK[k] ? ' · ' + d.okK[k] + ' ok' : '') + '</small></span>'
                + '<span class="ya-hs-pu">' + (e ? yzTop(e) : durum === 'sira' ? 'SIRADA' : 'GİR') + '</span></button>';
        }).join('') + '</div>';
    }).join('');
    let sonIs = tamam && sonSeri ? '<div class="ya-hat-son">' + (n >= 2 ? '<button class="yz-btn buyuk" onclick="yzBitirEleme()">⚔️ Bitir → eleme</button>' : '') + '<button class="yz-btn buyuk" onclick="yzSeriUzat(1, true)">➕ 1 seri daha</button></div>' : '';
    return '<div class="yz ya-hat">'
        + '<div class="ya-hat-bas"><div class="ya-hat-seri">' + (seri + 1) + '<small>/' + f.seri + '</small></div>'
        + '<div class="ya-hat-bilgi"><span>' + yzKatEtiket(d) + 'SERİ · ' + esc(d.ayar.mesafe) + ' · ' + esc(f.kisa) + '</span><span><b>' + girilen + '/' + n + '</b> girildi' + (f.yari ? ' · ' + (seri < f.yari ? '1.' : '2.') + ' yarı' : '') + '</span><i><b style="width:' + Math.round(girilen / Math.max(1, n) * 100) + '%"></b></i></div>'
        + '<button class="ya-hat-sure" onclick="' + (o.sayac ? 'yzSureMenu()' : 'yzSayacBaslat()') + '" aria-label="' + (o.sayac ? 'Süre' : 'Süreyi başlat') + '">' + yzSayacHTML(o, 'yz-sayac') + '</button>'
        + '<button class="ya-hat-menu" onclick="yzMenu()" aria-label="Diğer: TV, analiz, mola, hedefler">⋯</button></div>'
        + (yariArasi ? '<div class="yz-bilgi">☕ 1. yarı bitti — kısa mola. Hazır olunca süreyi başlat.</div>' : '')
        + yzYenilerHTML(o, false)
        + '<div class="ya-hat-liste">' + liste + '</div>' + sonIs
        + '<div class="ya-hat-is">'
        + '<button class="yz-btn" onclick="yzTvAc()">📺 TV</button>'
        + '<button class="yz-btn" onclick="yzSporcuSecici(\'tur\')">👥 Sporcular (' + n + ')</button>'
        + '<button class="yz-btn" onclick="yzSeriUzat(1)">➕ Seri ekle</button>'
        + (seri > 0 ? '<button class="yz-btn" onclick="yzOncekiSeri()">◀ ' + seri + '. seri</button>' : '')
        + (o.sayac ? '<button class="yz-btn" onclick="yzSayacDurdur()">⏹ Süreyi sıfırla</button>' : '')
        + '<button class="yz-btn yz-mola-btn" onclick="yzMolaMenu()">' + yzMolaBtnYazi(o) + '</button>'
        + '</div>'
        + '<button class="ya-hat-ayr" onclick="yaMasaSec(\'eski\')">Ayrıntılı ekran: tablo, grafik, tüm araçlar →</button>'
        + '</div>';
}

// ------------------------------------------------------------------------------------------------ bağlantılar (sarmalayıcılar)
(function () {
    // 🎤 giriş penceresine mikrofon + durum satırı
    let asilGiris = yzGirisCiz;
    yzGirisCiz = function () {
        let r = asilGiris.apply(this, arguments);
        try {
            let kap = document.getElementById('yz-giris'), g = _yz.giris;
            if (kap && g && yaSesVarMi()) {
                let hedef = kap.querySelector('.yz-giris-mod') || kap.querySelector('.yz-tamam-btnlar');
                if (hedef && !kap.querySelector('.ya-mik')) hedef.insertAdjacentHTML(g.tamamEkrani ? 'afterbegin' : 'beforeend', '<button type="button" class="ya-mik' + (_ya.ses.acik ? ' aktif' : '') + (g.tamamEkrani ? ' yz-btn' : '') + '" onclick="yaSesDegis()" title="Sesle puan: dokuz sekiz on">🎤 Sesle' + yaYeni() + '</button>');
                let ok = kap.querySelector('.yz-oklar') || hedef;
                if (ok && !kap.querySelector('.ya-ses-durum')) ok.insertAdjacentHTML('afterend', '<div class="ya-ses-durum" style="display:none"></div>');
                yaSesDurumYaz();
            }
            if (!g) yaBarYenile();
        } catch (e) {}
        return r;
    };
    // 💾 kayıt: son giriş (düzelt), rekor kontrolü, otomatik kaydetme iptali
    let asilKaydet = yzGirisKaydet;
    yzGirisKaydet = function () {
        yaOtoIptal();
        let g = _yz.giris, oOnce = yzOku(), kopya = null;
        try { if (g && !g.tip && !g.tamamEkrani && oOnce.durum && oOnce.durum.id === g.id && !yzSkor(oOnce, g.k)[g.seri]) kopya = { k: g.k, seri: g.seri, id: g.id }; } catch (e) {}
        let r = asilKaydet.apply(this, arguments);
        try { if (g && !g.tip && !g.tamamEkrani) { let o2 = yzOku(); if (o2.durum && o2.durum.id === g.id && yzSkor(o2, g.k)[g.seri]) _ya.son = { k: g.k, seri: g.seri, id: g.id }; } if (kopya) yaRekorKontrol(kopya, oOnce); } catch (e) {}
        try { yaBarYenile(); } catch (e) {}
        return r;
    };
    // 👍 tur ekranına çubuk + araç ızgarasına Koç özeti / Yolculuk
    let asilCiz = yzCiz;
    yzCiz = function () { let r = asilCiz.apply(this, arguments); try { yaBarYenile(); } catch (e) {} return r; };
    // Araç ızgarası bilerek en fazla 7 düğme (v380 sadelik, test 105) — Koç özeti ve Yolculuk "⋯ Diğer" menüsünün başında
    let asilTur = yzTurHTML;
    yzTurHTML = function (o) {
        let bos = '<div class="ya-bar-bosluk"></div>';
        if (yaHatMi(o)) return yaHatHTML(o) + bos;
        let geri = o && o.durum && o.durum.asama === 'tur' && yaHatGenislik() && !o.durum.ayar.dogrudan && !o.durum.ayar.minik ? '<button class="ya-hat-ayr ust" onclick="yaMasaSec()">📱 Sade telefon ekranına dön</button>' : '';
        return geri + asilTur.apply(this, arguments) + bos;
    };
    // telefon ↔ geniş ekran geçişinde (döndürme) tur ekranı yeniden çizilsin
    let sonGen = yaHatGenislik();
    window.addEventListener('resize', function () { let g = yaHatGenislik(); if (g === sonGen) return; sonGen = g; try { let d = yzOku().durum; if (d && d.asama === 'tur' && _yz.mod === 'siralama' && document.querySelector('#km-icerik .ya-hat, #km-icerik .yz-a-grid') && !_yz.giris) yzCiz(); } catch (e) {} });
    let asilMenu = yzMenu;
    yzMenu = function () {
        let r = asilMenu.apply(this, arguments);
        try {
            let m = document.getElementById('onay-modal'), ilk = m && m.querySelector('button.yz-btn'), kapat = "document.getElementById('onay-modal').style.display='none'; ";
            if (ilk && !m.querySelector('.ya-menu')) ilk.insertAdjacentHTML('beforebegin', '<button class="yz-btn ya-menu" onclick="' + kapat + 'yaKocOzetAc()">🧭 Koç özeti — kim ilerledi, oklar nereye kaçıyor' + yaYeni() + '</button><button class="yz-btn ya-menu" onclick="' + kapat + 'yaYolculukAc()">🗺️ Yolculuk — veliye gönder' + yaYeni() + '</button>');
        } catch (e) {}
        return r;
    };
    // 🏁 sonuç ekranı: koç özeti + yolculuk kartı
    let asilSonuc = yzSonucHTML;
    yzSonucHTML = function (o) {
        let h = asilSonuc.apply(this, arguments);
        if (o && o.durum && o.durum.ayar && o.durum.ayar.dogrudan) return h;
        let kart = '<div class="yz-kart ya-sonuc-kart"><div class="yz-etiket">Tur sonrası' + yaYeni() + '</div><div class="ya-sonuc-btn"><button class="yz-btn buyuk" onclick="yaKocOzetAc()">🧭 Koç özeti<small>kim ilerledi, kim geriledi, oklar nereye kaçtı</small></button><button class="yz-btn buyuk" onclick="yaYolculukAc()">🗺️ Yolculuk · veliye gönder<small>her çocuğun kendi gelişimi</small></button></div></div>';
        let i = h.indexOf('<div class="yz-kart'); return i === -1 ? h + kart : h.slice(0, i) + kart + h.slice(i);
    };
    // 🪄 kurulum ekranına otomatik kur kartı (yalnız sıralama turu)
    let asilKur = yzKurulumHTML;
    yzKurulumHTML = function () {
        let h = asilKur.apply(this, arguments), t = yzKurulumTaslak();
        if (t.tur === 'eleme') return h;
        let n = t.katilimci.length || yzRoster().length;
        let kart = '<div class="yz-tk-serit ya-oto"><span><b>🪄 Otomatik kur' + yaYeni() + '</b><br><span class="yz-alt">' + n + ' sporcu · yaşa, yaya ve seviyeye göre hedeflere dağıtır, önce gösterir</span></span><button class="yz-btn ana buyuk" onclick="yaOtoKurAc()"' + (n ? '' : ' disabled') + '>🪄 Kur</button></div>';
        let i = h.indexOf('<div class="yz-tk-serit" id="yz-hizli"'); if (i === -1) i = h.indexOf('<div class="yz-kart yz-tur-sec"');
        if (i === -1 && h.indexOf('<h2 class="yzr-soru">Kimler') !== -1) { let b = h.indexOf('</p></div>', h.indexOf('class="yzr-bas"')); if (b !== -1) i = b + 10; } // resimli kurulum 1. adım
        return i === -1 ? h : h.slice(0, i) + kart + h.slice(i);
    };
    // Otomatik kurulumun hedef düzeni (makaralılar yeni hedeften) — sıralı 1A,1B… atamasının yerine geçer; koç sonra kişi
    // ekler ya da hedef başı sayısını değiştirirse plan geçersiz olur ve eski sıralı atama döner.
    let asilHedef = yzHedefAta;
    yzHedefAta = function (katilimci, hb) {
        let t = _yz.kurulum, plan = t && t.yaHedef;
        if (plan && katilimci === t.katilimci && hb === t.yaHb && katilimci.every(function (k) { return plan[k]; })) { let h = {}; katilimci.forEach(function (k) { h[k] = plan[k]; }); return h; }
        return asilHedef.apply(this, arguments);
    };
    // 📺 TV: rekor anı
    let asilTv = yzTvCiz;
    yzTvCiz = function () { let r = asilTv.apply(this, arguments); try { let o = yzOku(); if (o.rekorAn && o.durum && o.rekorAn.id === o.durum.id) yaRekorGoster(o.rekorAn); } catch (e) {} return r; };
})();

(function yaCss() {
    if (document.getElementById('ya-css')) return;
    let st = document.createElement('style'); st.id = 'ya-css';
    st.textContent = [
        '.ya-mik{border:1px solid rgba(56,189,248,.5)!important;color:#7dd3fc}',
        '.ya-mik.aktif{background:#0ea5e9!important;color:#fff!important;border-color:#0ea5e9!important;animation:yaNabizB 1.6s ease-in-out infinite}',
        '@keyframes yaNabizB{50%{box-shadow:0 0 0 6px rgba(14,165,233,.25)}}',
        '.ya-ses-durum{margin:6px 0;padding:8px 12px;border-radius:12px;background:rgba(14,165,233,.12);border:1px solid rgba(14,165,233,.35);font-size:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
        '.ya-nabiz{width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;animation:yaNabiz 1s infinite}',
        '@keyframes yaNabiz{50%{opacity:.25}}',
        '.ya-bar{display:none}',
        '.ya-bar-bosluk{height:0}',
        '@media (max-width:820px){',
        ' .ya-bar{display:flex;position:fixed;left:8px;right:8px;bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:900;gap:8px;padding:8px;border-radius:20px;background:rgba(15,17,22,.92);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.1);box-shadow:0 10px 30px rgba(0,0,0,.45)}',
        ' .ya-bar-bosluk{height:96px}',
        '}',
        '.ya-bar-k{flex:0 0 58px;height:62px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:#23262d;color:#f4f4f5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font:inherit;cursor:pointer}',
        '.ya-bar-k i{font-style:normal;font-size:22px;line-height:1}.ya-bar-k small{font-size:11px;font-weight:700;opacity:.8}',
        '.ya-bar-k:disabled{opacity:.35}.ya-bar-k.aktif{background:#0ea5e9;border-color:#0ea5e9}',
        '.ya-bar-ana{flex:1;min-width:0;height:62px;border-radius:14px;border:0;background:linear-gradient(135deg,#f97316,#f59e0b);color:#111;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:0 14px;font:inherit;cursor:pointer;text-align:left}',
        '.ya-bar-ana small{font-size:12px;font-weight:700;opacity:.75}.ya-bar-ana b{font-size:19px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
        '.ya-bar-ana.tamam{background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff}',
        '.ya-hat{display:flex;flex-direction:column;gap:12px;padding:4px 2px 0;color:#f4f4f5}',
        '.ya-hat-bas{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;padding:12px;border-radius:18px;background:rgba(17,19,24,.96);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}',
        '.ya-hat-seri{font-size:42px;font-weight:900;line-height:.9;font-variant-numeric:tabular-nums}.ya-hat-seri small{font-size:19px;color:#a1a1aa;font-weight:800}',
        '.ya-hat-bilgi{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;font-size:11.5px;font-weight:800;letter-spacing:.03em;color:#a1a1aa}.ya-hat-bilgi span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ya-hat-bilgi b{color:#f4f4f5}',
        '.ya-hat-bilgi i{display:block;height:6px;border-radius:9px;background:#2a2d35;overflow:hidden;margin-top:2px}.ya-hat-bilgi i b{display:block;height:100%;background:#f59e5b;border-radius:9px;transition:width .3s}',
        '.ya-hat-sure{border:0;background:none;padding:0;cursor:pointer;font:inherit;color:inherit}.ya-hat-sure .yz-sayac{min-width:74px;padding:5px 8px;border-radius:14px}.ya-hat-sure .yz-sayac-sure{font-size:24px}.ya-hat-sure .yz-sayac-alt{font-size:9px;letter-spacing:.08em}',
        '.ya-hat-menu{flex:0 0 46px;height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:#23262d;color:#f4f4f5;font-size:24px;font-weight:900;cursor:pointer;line-height:1}',
        '.ya-hat-liste{display:flex;flex-direction:column;gap:14px}',
        '.ya-hh{display:flex;flex-direction:column;gap:6px}.ya-hh h3{margin:0 4px;font-size:11px;letter-spacing:.14em;color:#a1a1aa;font-weight:900}',
        '.ya-hs{display:flex;align-items:center;gap:10px;width:100%;min-height:60px;padding:9px 12px;border-radius:15px;background:#1b1d22;border:1.5px solid transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}',
        '.ya-hs:focus-visible,.ya-hat-menu:focus-visible,.ya-hat-sure:focus-visible{outline:2px solid #38bdf8;outline-offset:2px}',
        '.ya-hs .ya-hs-yuz{width:38px;height:38px;margin:0;font-size:13px;background-color:#2a2d35;color:#d4d4d8;border-color:transparent}',
        '.ya-hs-ad{flex:1;min-width:0;font-weight:800;font-size:16.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ya-hs-ad small{display:block;font-weight:600;font-size:12px;color:#a1a1aa}',
        '.ya-hs-pu{min-width:48px;text-align:right;font-size:27px;font-weight:900;font-variant-numeric:tabular-nums}',
        '.ya-hs.tamam .ya-hs-pu{color:#34d399}.ya-hs.tamam .ya-hs-yuz{border-color:#34d399}',
        '.ya-hs.sira{border-color:#f59e5b;background:linear-gradient(90deg,rgba(245,158,91,.2),#1b1d22 72%)}.ya-hs.sira .ya-hs-pu{font-size:13px;letter-spacing:.06em;color:#f59e5b}',
        '.ya-hs.bek .ya-hs-pu{font-size:13px;color:#71717a;letter-spacing:.06em}',
        '.ya-hat-son{display:flex;gap:8px;flex-wrap:wrap}.ya-hat-son .yz-btn{flex:1}',
        '.ya-hat-is{display:flex;flex-wrap:wrap;gap:8px}.ya-hat-is .yz-btn{flex:1 1 auto;min-height:46px}',
        '.ya-hat-ayr{background:none;border:0;color:#a1a1aa;font:inherit;font-size:13.5px;font-weight:700;padding:10px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}.ya-hat-ayr.ust{display:block;margin:0 auto 6px;color:#f59e5b}',
        '.ya-p-arka{position:fixed;inset:0;z-index:32100;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px}',
        '.ya-p{width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;background:#17191e;color:#f4f4f5;border:1px solid rgba(255,255,255,.1);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.5)}',
        '.ya-p-bas{position:sticky;top:0;background:#17191e;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.08);font-size:17px;z-index:1}',
        '.ya-p-ic{padding:14px 16px 18px}',
        '@media (max-width:600px){.ya-p-arka{padding:0;align-items:stretch}.ya-p{border-radius:0;max-height:100vh;height:100%}}',
        '.ya-p-btn{display:flex;flex-direction:column;gap:8px;margin-top:14px}',
        '.ya-oh{display:flex;gap:10px;padding:10px;border-radius:14px;background:#22252c;margin-bottom:8px;align-items:flex-start}',
        '.ya-oh-no{flex:0 0 78px;font-weight:900;font-size:13px;color:#fbbf24;display:flex;flex-direction:column}.ya-oh-no small{color:#a1a1aa;font-weight:700;font-size:11px;margin-top:2px}',
        '.ya-oh-sp{display:flex;flex-wrap:wrap;gap:6px}.ya-oh-sp span{background:#2e323b;border-radius:10px;padding:5px 9px;font-weight:800;font-size:14px;display:flex;flex-direction:column}.ya-oh-sp small{font-weight:600;font-size:11px;color:#a1a1aa}',
        '.ya-kb{margin-bottom:14px}.ya-kb-bas{font-weight:900;font-size:15px;margin-bottom:6px}.ya-kb-bas small{font-weight:600;color:#a1a1aa;font-size:12px}',
        '.ya-ks{display:flex;width:100%;justify-content:space-between;align-items:center;gap:10px;padding:11px 12px;margin-bottom:5px;border-radius:12px;background:#22252c;border:0;color:inherit;font:inherit;font-size:15px;cursor:pointer;text-align:left}',
        '.ya-ks b{font-weight:800;white-space:nowrap}.ya-ks small{color:#a1a1aa}',
        'em.yu{color:#4ade80;font-style:normal;font-weight:900}em.du{color:#f87171;font-style:normal;font-weight:900}',
        '.ya-yol-ust{display:flex;flex-wrap:wrap;gap:8px 16px;font-size:14px;margin-bottom:6px}.ya-yol-ust b{font-size:17px}',
        '.ya-yol-svg{width:100%;height:auto;display:block;color:#f4f4f5;margin:6px 0}',
        '.ya-yol-mesaj{white-space:pre-wrap;font:inherit;font-size:14px;background:#0f1115;border:1px dashed rgba(255,255,255,.15);border-radius:12px;padding:10px 12px;margin:10px 0 0}',
        '.ya-yl{display:flex;align-items:center;gap:8px;padding:6px;border-radius:12px;background:#22252c;margin-bottom:6px}',
        '.ya-yl-ad{flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;background:none;border:0;color:inherit;font:inherit;padding:6px;cursor:pointer;text-align:left}.ya-yl-ad b{font-size:15px}.ya-yl-ad small{color:#a1a1aa;font-size:12px}',
        '.ya-yol-mini{width:110px;height:40px;flex:0 0 110px}',
        '.ya-yl-g{min-width:48px;height:44px;font-size:20px}.ya-yl-g.gitti{background:#14532d!important;border-color:#16a34a!important}',
        '.ya-sonuc-btn{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ya-sonuc-btn .yz-btn{display:flex;flex-direction:column;align-items:flex-start;text-align:left}.ya-sonuc-btn small{font-weight:600;opacity:.7;font-size:12px}',
        '@media (max-width:600px){.ya-sonuc-btn{grid-template-columns:1fr}}',
        '.ya-rekor{position:fixed;inset:0;z-index:32200;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%,rgba(245,197,66,.28),rgba(0,0,0,.72) 60%);animation:yaRGir .5s ease-out;cursor:pointer;overflow:hidden}',
        '.ya-rekor.cik{opacity:0;transition:opacity .6s}',
        '@keyframes yaRGir{from{opacity:0}}',
        '.ya-rekor-kart{text-align:center;color:#fff;animation:yaRZip .7s cubic-bezier(.2,1.6,.4,1)}',
        '@keyframes yaRZip{from{transform:scale(.4);opacity:0}}',
        '.ya-rekor-ust{font-weight:900;letter-spacing:.12em;font-size:clamp(18px,3vw,40px);color:#fde68a;text-shadow:0 0 24px rgba(245,197,66,.7)}',
        '.ya-rekor-yuz{margin:18px auto 8px;width:clamp(90px,14vw,200px);height:clamp(90px,14vw,200px);border-radius:50%;overflow:hidden;border:5px solid #f5c542;box-shadow:0 0 40px rgba(245,197,66,.6);display:flex;align-items:center;justify-content:center;background:#27272a;font-size:clamp(30px,5vw,70px);font-weight:900}',
        '.ya-rekor-yuz img,.ya-rekor-yuz>*{width:100%;height:100%;object-fit:cover;display:flex;align-items:center;justify-content:center;font-size:inherit}',
        '.ya-rekor-ad{font-size:clamp(28px,5vw,80px);font-weight:900;line-height:1.05}',
        '.ya-rekor-sayi{display:flex;align-items:baseline;justify-content:center;gap:12px;margin-top:8px}.ya-rekor-sayi b{font-size:clamp(60px,11vw,180px);font-weight:900;color:#f5c542;line-height:1}.ya-rekor-sayi span{font-size:clamp(16px,2.4vw,32px);font-weight:800;opacity:.8}',
        '.ya-rekor-alt{font-size:clamp(15px,2.2vw,30px);font-weight:700;opacity:.85;margin-top:6px}',
        '.ya-rekor-kon i{position:absolute;top:-20px;width:12px;height:18px;border-radius:3px;animation:yaKon 3.2s linear forwards}',
        '@keyframes yaKon{to{transform:translateY(110vh) rotate(720deg)}}'
    ].join('\n');
    document.head.appendChild(st);
})();
