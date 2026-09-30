// ================================================================================================
// 🏹 YARIŞMA — SIRALAMA TURU + 📺 TV SKOR TABLOSU (2026-09-30)
// Kullanıcı: "performans takımı 12 serilik gerçek yarışma temposunda antrenman yapacak; skorlar hedefe
// gidildiğinde tabletten yazılır, PC'den televizyona yansıtılır, herkes skorlarına oradan bakar. Yarışma
// modu görsel ve karışıklık açısından anlamsız olmuş — daha anlaşılır ve profesyonel olmalı."
//
// Yarışma sekmesi artık bir giriş ekranıyla açılır: 🏹 Sıralama Turu (ana mod) · ⚔️ Takım & Düello (eski
// Yarışma modu, dokunulmadı — kmYarismaCiz sarmalanıp üstüne "← Yarışma türleri" çubuğu eklenir).
//
// Veri: 'dag_km_yarismatur_<konum>' → dagsk-km-ortak.js ile TÜM cihazlarda ortak (tablet yazar, TV okur).
// Nesnenin ÜST anahtarları ayrı ayrı birleştirildiği için her sporcunun skoru AYRI anahtarda
// ('s_<turId>_<grup|ad>') — iki tablet aynı anda farklı sporculara skor girerse ikisi de korunur.
// Süre sayacı mutlak zamanla ('sayac.basla') tutulur; her cihaz kendi saatinden hesaplar, tik başına yazmaz.
// TV ekranı SADECE okur (hiçbir zaman yazmaz) — eski bir kopyayla tabletin girişini ezemez.
// ================================================================================================
const YZ_FORMAT = {
    tam: { ad: '72 ok · 12 seri × 6', kisa: '72 ok', seri: 12, ok: 6, yari: 6 },
    yarim: { ad: '36 ok · 6 seri × 6', kisa: '36 ok', seri: 6, ok: 6, yari: 0 },
    salon: { ad: '60 ok · 20 seri × 3 (salon)', kisa: '60 ok salon', seri: 20, ok: 3, yari: 10 }
};
const YZ_DEGER = { X: 10, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1, M: 0 };
const YZ_SIRA = { X: 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1, M: 0 };
const YZ_HAZIRLIK = 10; // WA: hatta geçiş 10 sn (kırmızı), sonra atış (yeşil), son 30 sn sarı, bitince kırmızı
let _yz = { mod: null, kurulum: null, giris: null, siradaki: true, tv: false, tvPoll: null, tvHam: null, tvSon: {}, timer: null, calinan: {}, kilit: null };
try { _yz.mod = localStorage.getItem('dag_yz_mod') || null; _yz.siradaki = localStorage.getItem('dag_yz_siradaki') !== '0'; _yz.ses = localStorage.getItem('dag_yz_ses') !== '0'; } catch (e) { _yz.ses = true; }

// ---------------------------------------------------------------- veri
function yzAnahtar() { return 'dag_km_yarismatur_' + (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum ? _kmAktifKonum : 'varsayilan'); }
function yzOku() { try { return JSON.parse(localStorage.getItem(yzAnahtar()) || 'null') || {}; } catch (e) { return {}; } }
function yzYaz(o) { try { localStorage.setItem(yzAnahtar(), JSON.stringify(o)); } catch (e) { showToast('Kaydedilemedi (depo dolu?)', 'error'); } }
// Her yazma TAZE okumayla yapılır — başka cihazdan gelen son hali ezmemek için.
function yzGuncelle(fn) { let o = yzOku(); fn(o); yzYaz(o); return o; }
function yzEnc(s) { return encodeURIComponent(s).replace(/'/g, '%27'); }
function yzSKey(id, k) { return 's_' + id + '_' + k; }
function yzSkor(o, k) { return (o.durum && o[yzSKey(o.durum.id, k)]) || []; }
function yzFormat(d) { return YZ_FORMAT[(d && d.ayar && d.ayar.format) || 'tam'] || YZ_FORMAT.tam; }
// Seri süresi (sn) — kullanıcı seçer (90/120/150/180/240 ya da özel); seçilmemişse WA varsayılanı: 6 ok 240, 3 ok 120.
const YZ_SURELER = [90, 120, 150, 180, 240];
function yzVarsayilanSure(format) { return (YZ_FORMAT[format] || YZ_FORMAT.tam).ok >= 6 ? 240 : 120; }
function yzSure(d) { let s = d && d.ayar && parseInt(d.ayar.sure, 10); return s >= 10 ? s : yzFormat(d).ok >= 6 ? 240 : 120; }
function yzSureEtiket(sn) { return sn + ' sn' + (sn >= 60 ? ' (' + yzSaat(sn) + ')' : ''); }
// Süre seçici: hazır kalıplar + özel. hedef: 'kurulum' (taslak) ya da 'tur' (süren tur, ortak kayda yazar)
function yzSureSeciciHTML(secili, hedef) {
    let ozel = YZ_SURELER.indexOf(secili) === -1, id = 'yz-sure-ozel-' + hedef;
    return '<div class="yz-cipler">' + YZ_SURELER.map(function (sn) { return '<button class="yz-cip' + (sn === secili ? ' aktif' : '') + '" onclick="yzSureSec(\'' + hedef + '\',' + sn + ')">' + sn + ' sn</button>'; }).join('')
        + '<span class="yz-sure-ozel' + (ozel ? ' aktif' : '') + '"><input id="' + id + '" type="number" inputmode="numeric" min="10" max="900" step="5" placeholder="Özel" value="' + (ozel ? secili : '') + '" aria-label="Özel süre (saniye)" onkeydown="if(event.key===\'Enter\'){yzSureSec(\'' + hedef + '\', this.value)}"><span>sn</span><button class="yz-cip" onclick="yzSureSec(\'' + hedef + '\', document.getElementById(\'' + id + '\').value)">Uygula</button></span></div>';
}
function yzSureSec(hedef, sn) {
    sn = parseInt(sn, 10); if (!(sn >= 10 && sn <= 900)) return showToast('Süre 10–900 sn arası olmalı.', 'error');
    if (hedef === 'kurulum') { yzKurulumTaslak().sure = sn; yzCiz(); return; }
    yzGuncelle(function (o) { if (o.durum) { o.durum.ayar.sure = sn; if (o.sayac && o.sayac.seri === o.durum.seri) o.sayac.sure = sn; } });
    let m = document.getElementById('onay-modal'); if (m) m.style.display = 'none';
    yzCiz(); if (_yz.tv) yzTvCiz(); showToast('⏱ Seri süresi: ' + yzSureEtiket(sn), 'success');
}
function yzSureMenu() {
    let d = yzOku().durum; if (!d) return;
    onayIste('<div style="text-align:left"><b>⏱ Seri süresi</b><div class="yz-alt" style="margin:4px 0 10px">Şu an: ' + yzSureEtiket(yzSure(d)) + ' + 10 sn hatta geçiş. Seçtiğin süre bundan sonraki serilerde (ve çalışan sayaçta) kullanılır.</div>' + yzSureSeciciHTML(yzSure(d), 'tur') + '</div>', null);
}
function yzTop(oklar) { return (oklar || []).reduce(function (a, p) { return a + (YZ_DEGER[p] || 0); }, 0); }
function yzKAd(k) { return k.slice(k.indexOf('|') + 1); }
function yzKisaAd(ad) { let p = String(ad).trim().split(/\s+/); return p.length > 1 ? p.slice(0, -1).join(' ') + ' ' + p[p.length - 1].charAt(0) + '.' : ad; }
function yzRoster() { return (typeof _kmListe !== 'undefined' ? _kmListe : []).filter(function (k) { return turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; }); }
function yzSaat(sn) { sn = Math.max(0, Math.ceil(sn)); return Math.floor(sn / 60) + ':' + String(sn % 60).padStart(2, '0'); }
function yzOkRenk(p) { return 'yz-r-' + (p === 'X' || p === '10' || p === '9' ? 'sari' : p === '8' || p === '7' ? 'kirmizi' : p === '6' || p === '5' ? 'mavi' : p === '4' || p === '3' ? 'siyah' : p === '2' || p === '1' ? 'beyaz' : 'kacan'); }

// Sıralama: toplam → 10+X → X (WA). Eşitlikte aynı sıra no. "onceki": şu anki seri hariç sıra (yükseliş oku için).
function yzSiralama(o, seriSinir) {
    let d = o.durum, f = yzFormat(d);
    let liste = d.katilimci.map(function (k) {
        let s = yzSkor(o, k), toplam = 0, on = 0, x = 0, ok = 0, y1 = 0, y2 = 0, seriT = [];
        for (let i = 0; i < f.seri; i++) {
            let e = s[i];
            if (!e || (seriSinir != null && i >= seriSinir)) { seriT.push(null); continue; }
            let t = yzTop(e); seriT.push(t); toplam += t; ok += e.length;
            e.forEach(function (p) { if (p === 'X') { x++; on++; } else if (p === '10') on++; });
            if (f.yari && i < f.yari) y1 += t; else y2 += t;
        }
        return { k: k, ad: yzKAd(k), hedef: (d.hedefler || {})[k] || '', seriT: seriT, toplam: toplam, on: on, x: x, ok: ok, y1: y1, y2: y2 };
    });
    liste.sort(function (a, b) { return b.toplam - a.toplam || b.on - a.on || b.x - a.x || a.ad.localeCompare(b.ad, 'tr'); });
    liste.forEach(function (r, i) { let p = liste[i - 1]; r.sira = p && p.toplam === r.toplam && p.on === r.on && p.x === r.x ? p.sira : i + 1; });
    return liste;
}
function yzBekleyenler(o, seri) { let d = o.durum; return d.katilimci.filter(function (k) { return !yzSkor(o, k)[seri]; }); }
function yzHedefSirasi(o) { let d = o.durum, h = d.hedefler || {}; return d.katilimci.slice().sort(function (a, b) { return String(h[a]).localeCompare(String(h[b]), 'tr', { numeric: true }); }); }

// ---------------------------------------------------------------- giriş noktası (kmSekme('yarisma'))
function yzModAyarla(m) { _yz.mod = m; try { localStorage.setItem('dag_yz_mod', m || ''); } catch (e) {} }
function kmYarismaGiris() {
    yzCssYukle();
    let o = yzOku(), d = o.durum;
    let mod = _yz.mod;
    if (d && d.asama && d.asama !== 'kurulum' && mod !== 'takim') mod = 'siralama';   // süren tur varsa her cihaz ona açılır
    if (!mod) mod = (typeof _kmYarismaAktif !== 'undefined' && _kmYarismaAktif) ? 'takim' : 'secim';
    if (mod === 'takim') { yzTakimCiz(); }
    else if (mod === 'siralama') yzCiz();
    else yzSecimCiz();
    if (_yz.tv) yzTvCiz();
    yzTimerBaslat();
}
const _ypEskiYarismaCiz = typeof kmYarismaCiz === 'function' ? kmYarismaCiz : null;
// Takım modunun kendi iç çağrıları (kmYarismaCiz) buradan geçer: takım modundaysak eski ekran + geri çubuğu.
kmYarismaCiz = function () {
    if (_yz.mod !== 'takim' && !(typeof _kmYarismaAktif !== 'undefined' && _kmYarismaAktif && _yz.mod !== 'siralama')) return kmYarismaGiris();
    yzTakimCiz();
};
function yzTakimCiz() {
    if (_yz.mod !== 'takim') yzModAyarla('takim');
    if (_ypEskiYarismaCiz) _ypEskiYarismaCiz();
    let ic = document.getElementById('km-icerik'); if (!ic || ic.querySelector('.yz-geri-bar')) return;
    let bar = document.createElement('div'); bar.className = 'yz-geri-bar';
    bar.innerHTML = '<button class="yz-btn" onclick="yzTurlereDon()">← Yarışma türleri</button><span>⚔️ Takım &amp; Düello maçları</span>';
    ic.insertBefore(bar, ic.firstChild);
}
function yzTurlereDon() { yzModAyarla('secim'); kmYarismaGiris(); }

// ---------------------------------------------------------------- 1) tür seçimi
function yzSecimCiz() {
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    let o = yzOku(), d = o.durum, suren = d && d.asama && d.asama !== 'kurulum';
    ic.innerHTML = '<div class="yp"><div class="yz-sayfa-bas"><div><div class="yz-baslik">🏆 Yarışma</div><div class="yz-alt">Ne tür bir yarışma yapacaksınız?</div></div></div>'
        + '<div class="yz-turler">'
        + '<button class="yz-tur ana" onclick="yzModAyarla(\'siralama\'); yzCiz()"><span class="yz-tur-rozet">Önerilen</span><span class="yz-tur-ikon">🏹</span><span class="yz-tur-ad">Sıralama Turu</span>'
        + '<span class="yz-tur-acik">Gerçek yarışma temposu: 12 seri × 6 ok, süreli seriler, hedef ataması, canlı sıralama. Skorlar tabletten girilir, <b>📺 TV ekranında</b> herkes anında görür.</span>'
        + (suren ? '<span class="yz-tur-durum">● Süren tur var — dokun ve devam et</span>' : '<span class="yz-tur-durum sakin">72 ok · 36 ok · 60 ok salon</span>') + '</button>'
        + '<button class="yz-tur" onclick="yzModAyarla(\'takim\'); kmYarismaGiris()"><span class="yz-tur-ikon">⚔️</span><span class="yz-tur-ad">Takım &amp; Düello Maçları</span>'
        + '<span class="yz-tur-acik">1v1 – 4v4 takım maçları, set sistemi, eleme ağacı. Ders içi eğlenceli rekabet için.</span><span class="yz-tur-durum sakin">Klasik Yarışma modu</span></button>'
        + '</div></div>';
}

// ---------------------------------------------------------------- 2) sıralama turu
function yzCiz() {
    if (_yz.mod !== 'siralama') yzModAyarla('siralama');
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    let o = yzOku(), d = o.durum;
    if (!d || !d.asama || d.asama === 'kurulum') ic.innerHTML = yzKurulumHTML();
    else if (d.asama === 'bitti') ic.innerHTML = yzSonucHTML(o);
    else ic.innerHTML = yzTurHTML(o);
    yzTimerBaslat();
}
// ---- kurulum (bu cihazda taslak; "Başlat" ile ortak kayda yazılır)
function yzKurulumTaslak() {
    let roster = yzRoster();
    if (!_yz.kurulum) _yz.kurulum = { katilimci: roster.map(function (k) { return k.g + '|' + k.ad; }), mesafe: '70m', format: 'tam', hedefBasi: 3, kayit: true };
    _yz.kurulum.katilimci = _yz.kurulum.katilimci.filter(function (k) { return roster.some(function (r) { return r.g + '|' + r.ad === k; }); });
    return _yz.kurulum;
}
function yzKurulumHTML() {
    let t = yzKurulumTaslak(), roster = yzRoster(), f = YZ_FORMAT[t.format];
    let cip = function (ad, aktif, fn) { return '<button class="yz-cip' + (aktif ? ' aktif' : '') + '" onclick="' + fn + '">' + ad + '</button>'; };
    let hedefSay = Math.ceil(t.katilimci.length / t.hedefBasi);
    return '<div class="yp">'
        + '<div class="yz-sayfa-bas"><div><button class="yz-link" onclick="yzTurlereDon()">← Yarışma türleri</button><div class="yz-baslik">🏹 Sıralama Turu</div><div class="yz-alt">Gerçek yarışma provası. Her seri süreli; skorlar hedefe gidilince tabletten girilir, TV ekranında canlı sıralama görünür.</div></div></div>'
        + '<div class="yz-kart"><div class="yz-etiket">Sporcular <b>' + t.katilimci.length + '</b> <span class="yz-etiket-btn"><button class="yz-link" onclick="yzKurTumu(true)">Tümü</button> · <button class="yz-link" onclick="yzKurTumu(false)">Hiçbiri</button></span></div>'
        + (roster.length ? '<div class="yz-cipler">' + roster.map(function (k, i) { return cip(esc(k.ad), t.katilimci.indexOf(k.g + '|' + k.ad) !== -1, 'yzKurSporcu(' + i + ')'); }).join('') + '</div>' : '<div class="yz-alt">Önce Karışık Sınıf listesine sporcu ekle.</div>')
        + '</div>'
        + '<div class="yz-kart yz-kur-izgara">'
        + '<div><div class="yz-etiket">Mesafe</div><div class="yz-cipler">' + ['18m', '30m', '50m', '60m', '70m'].map(function (m) { return cip(m, t.mesafe === m, 'yzKurAyar(\'mesafe\',\'' + m + '\')'); }).join('') + '</div></div>'
        + '<div><div class="yz-etiket">Format</div><div class="yz-cipler">' + Object.keys(YZ_FORMAT).map(function (k) { return cip(YZ_FORMAT[k].ad, t.format === k, 'yzKurAyar(\'format\',\'' + k + '\')'); }).join('') + '</div></div>'
        + '<div><div class="yz-etiket">Hedef başına sporcu</div><div class="yz-cipler">' + [1, 2, 3, 4].map(function (n) { return cip(String(n), t.hedefBasi === n, 'yzKurAyar(\'hedefBasi\',' + n + ')'); }).join('') + '</div><div class="yz-alt">' + (t.katilimci.length ? hedefSay + ' hedef kullanılacak (1A, 1B, … sırayla atanır)' : '') + '</div></div>'
        + '</div>'
        + '<div class="yz-kart"><div class="yz-etiket">⏱ Seri süresi <span class="yz-alt" style="text-transform:none;letter-spacing:0;font-weight:600">· + 10 sn hatta geçiş</span></div>' + yzSureSeciciHTML(t.sure || yzVarsayilanSure(t.format), 'kurulum') + '<div class="yz-ozet-satir"><span>⏱ <b>' + yzSureEtiket(t.sure || yzVarsayilanSure(t.format)) + '</b> / seri</span><span>🎯 ' + f.seri + ' seri × ' + f.ok + ' ok</span>' + (f.yari ? '<span>☕ ' + f.yari + '. seriden sonra ara</span>' : '') + '</div>'
        + '<label class="yz-onay"><input type="checkbox"' + (t.kayit ? ' checked' : '') + ' onchange="yzKurAyar(\'kayit\', this.checked)"> Okları sporcuların gerçek skoruna / karnesine işle</label>'
        + '<button class="yz-btn ana buyuk" ' + (t.katilimci.length ? '' : 'disabled') + ' onclick="yzBaslat()">🏁 Turu başlat</button></div>'
        + '</div>';
}
function yzKurSporcu(i) { let t = yzKurulumTaslak(), r = yzRoster()[i]; if (!r) return; let k = r.g + '|' + r.ad, j = t.katilimci.indexOf(k); if (j === -1) t.katilimci.push(k); else t.katilimci.splice(j, 1); yzCiz(); }
function yzKurTumu(hepsi) { let t = yzKurulumTaslak(); t.katilimci = hepsi ? yzRoster().map(function (k) { return k.g + '|' + k.ad; }) : []; yzCiz(); }
function yzKurAyar(a, v) { yzKurulumTaslak()[a] = v; if (a !== 'kayit') yzCiz(); }
function yzHedefAta(katilimci, hb) { let h = {}; katilimci.forEach(function (k, i) { h[k] = (Math.floor(i / hb) + 1) + 'ABCD'.charAt(i % hb); }); return h; }
function yzBaslat() {
    let t = yzKurulumTaslak(); if (!t.katilimci.length) return showToast('Sporcu seç.', 'error');
    let id = 'yp' + Date.now().toString(36);
    yzGuncelle(function (o) {
        Object.keys(o).forEach(function (a) { if (a.indexOf('s_') === 0) delete o[a]; }); // önceki turların skorları
        o.durum = { asama: 'tur', id: id, ayar: { mesafe: t.mesafe, format: t.format, kayit: !!t.kayit, hedefBasi: t.hedefBasi, sure: t.sure || yzVarsayilanSure(t.format) }, katilimci: t.katilimci.slice(), hedefler: yzHedefAta(t.katilimci, t.hedefBasi), seri: 0, basla: Date.now() };
        o.sayac = null;
    });
    // 12+ seri tek turda — günlük seri limiti koçu her seride "uzatayım mı?" diye durdurmasın.
    if (t.kayit) {
        t.katilimci.forEach(function (k) { let i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)] && turnuvaDB[k.slice(0, i)][k.slice(i + 1)]; if (sp && !sp.devamModu) { sp.devamModu = true; sp.lastModified = Date.now(); } });
        try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
    }
    _yz.kurulum = null;
    yzCiz();
    showToast('🏁 Tur başladı — ▶ Süreyi başlat ile ilk seriyi aç', 'success');
}
// ---- tur ekranı (hakem masası)
function yzTurHTML(o) {
    let d = o.durum, f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1);
    let bek = yzBekleyenler(o, seri), girilen = d.katilimci.length - bek.length, sira = yzSiralama(o);
    let siraMap = {}; sira.forEach(function (r) { siraMap[r.k] = r; });
    let sonSeri = seri >= f.seri - 1, tamam = bek.length === 0;
    let yariArasi = f.yari && seri === f.yari && d.katilimci.every(function (k) { return !yzSkor(o, k)[seri]; });
    // hedef grupları
    let gruplar = {}; yzHedefSirasi(o).forEach(function (k) { let h = String((d.hedefler || {})[k] || '?'), no = h.replace(/[A-D]$/, ''); (gruplar[no] = gruplar[no] || []).push(k); });
    let hedefHTML = Object.keys(gruplar).sort(function (a, b) { return (+a) - (+b); }).map(function (no) {
        return '<div class="yz-hedef"><div class="yz-hedef-no">HEDEF ' + esc(no) + '</div><div class="yz-hedef-sp">' + gruplar[no].map(function (k) {
            let e = yzSkor(o, k)[seri], r = siraMap[k];
            return '<button class="yz-sp' + (e ? ' tamam' : '') + '" onclick="yzGirisAc(\'' + yzEnc(k) + '\',' + seri + ')">'
                + '<span class="yz-sp-hedef">' + esc((d.hedefler || {})[k] || '') + '</span><span class="yz-sp-ad">' + esc(yzKisaAd(yzKAd(k))) + '</span>'
                + '<span class="yz-sp-seri">' + (e ? yzTop(e) : 'GİR') + '</span>'
                + '<span class="yz-sp-top">Σ ' + r.toplam + ' · ' + r.sira + '.</span></button>';
        }).join('') + '</div></div>';
    }).join('');
    let ilerlemeBtn = tamam
        ? (sonSeri ? '<button class="yz-btn ana buyuk" onclick="yzBitir()">🏁 Turu bitir — sonuçlar</button>' : '<button class="yz-btn ana buyuk" onclick="yzSonrakiSeri()">▶ ' + (seri + 2) + '. seriye geç</button>')
        : '<button class="yz-btn" onclick="yzSonrakiSeri()">' + (sonSeri ? 'Turu yine de bitir' : 'Beklemeden ' + (seri + 2) + '. seriye geç') + '</button>';
    return '<div class="yp">'
        + '<div class="yz-tur-bas">'
        + '<div class="yz-tur-bilgi"><div class="yz-ust-etiket">SIRALAMA TURU · ' + esc(d.ayar.mesafe) + ' · ' + f.kisa + '</div><div class="yz-seri-no">SERİ <b>' + (seri + 1) + '</b><span>/' + f.seri + '</span></div>'
        + (f.yari ? '<div class="yz-yari">' + (seri < f.yari ? '1. yarı' : '2. yarı') + '</div>' : '') + '</div>'
        + '<div class="yz-sayac-kap">' + yzSayacHTML(o, 'yz-sayac') + '<div class="yz-sayac-btn">' + (o.sayac ? '<button class="yz-btn" onclick="yzSayacDurdur()">⏹ Sıfırla</button>' : '<button class="yz-btn yesil" onclick="yzSayacBaslat()">▶ Süreyi başlat</button>') + '<button class="yz-btn" onclick="yzSureMenu()" title="Seri süresini değiştir">⏱ ' + yzSure(d) + ' sn</button></div></div>'
        + '<div class="yz-tur-btn"><button class="yz-btn tv" onclick="yzTvAc()">📺 TV ekranı</button><button class="yz-btn" onclick="yzMenu()" aria-label="Diğer">⋯</button></div>'
        + '</div>'
        + (yariArasi ? '<div class="yz-bilgi">☕ 1. yarı bitti — kısa mola. Hazır olunca süreyi başlat.</div>' : '')
        + '<div class="yz-ilerleme"><div class="yz-bar"><i style="width:' + Math.round(girilen / Math.max(1, d.katilimci.length) * 100) + '%"></i></div><span><b>' + girilen + '/' + d.katilimci.length + '</b> sporcu bu seriyi girdi</span>' + ilerlemeBtn + '</div>'
        + '<div class="yz-hedefler">' + hedefHTML + '</div>'
        + '<div class="yz-kart yz-tablo-kart"><div class="yz-etiket">Canlı sıralama <span class="yz-alt">· hücreye dokun → o seriyi düzelt</span></div><div class="yz-tablo-kap">' + yzTabloHTML(o, sira, { kompakt: true, duzenle: true }) + '</div></div>'
        + '</div>';
}
// Tablo — tur ekranı, TV ve sonuç ekranı ortak.
function yzTabloHTML(o, sira, sec) {
    sec = sec || {};
    let d = o.durum, f = yzFormat(d), aktif = d.asama === 'bitti' ? -1 : Math.min(d.seri, f.seri - 1);
    let onceki = {}; if (sec.hareket && aktif > 0) yzSiralama(o, aktif).forEach(function (r) { onceki[r.k] = r.sira; });
    let bas = '<th class="sira">#</th>' + (sec.hareket ? '<th class="hr"></th>' : '') + '<th class="hdf">HEDEF</th><th class="ad">SPORCU</th>';
    for (let i = 0; i < f.seri; i++) { bas += '<th class="s' + (i === aktif ? ' aktif' : '') + '">' + (i + 1) + '</th>'; if (f.yari && i === f.yari - 1) bas += '<th class="yari">1.Y</th>'; }
    if (f.yari) bas += '<th class="yari">2.Y</th>';
    bas += '<th class="top">TOPLAM</th><th class="on">10+X</th><th class="x">X</th>';
    let govde = sira.map(function (r) {
        let hr = '';
        if (sec.hareket) { let p = onceki[r.k]; hr = '<td class="hr">' + (p && p > r.sira ? '<span class="yuk">▲' + (p - r.sira) + '</span>' : p && p < r.sira ? '<span class="dus">▼' + (r.sira - p) + '</span>' : '') + '</td>'; }
        let tr = '<tr class="' + (r.sira <= 3 && r.toplam > 0 ? 'p' + r.sira : '') + (sec.yeni && sec.yeni[r.k] ? ' yeni' : '') + '"><td class="sira">' + r.sira + '</td>' + hr + '<td class="hdf">' + esc(r.hedef) + '</td><td class="ad">' + esc(sec.kompakt ? yzKisaAd(r.ad) : r.ad) + '</td>';
        for (let i = 0; i < f.seri; i++) {
            let v = r.seriT[i], cls = 's' + (i === aktif ? ' aktif' : '') + (v == null ? ' bos' : '');
            tr += sec.duzenle && (v != null || i <= aktif) ? '<td class="' + cls + ' tik" onclick="yzGirisAc(\'' + yzEnc(r.k) + '\',' + i + ')">' + (v == null ? '·' : v) + '</td>' : '<td class="' + cls + '">' + (v == null ? '·' : v) + '</td>';
            if (f.yari && i === f.yari - 1) tr += '<td class="yari">' + (r.y1 || '·') + '</td>';
        }
        if (f.yari) tr += '<td class="yari">' + (r.y2 || '·') + '</td>';
        return tr + '<td class="top">' + r.toplam + '</td><td class="on">' + r.on + '</td><td class="x">' + r.x + '</td></tr>';
    }).join('');
    return '<table class="yz-tablo' + (sec.kompakt ? ' kompakt' : '') + '"><thead><tr>' + bas + '</tr></thead><tbody>' + govde + '</tbody></table>';
}
function yzSonrakiSeri() {
    let o = yzOku(), d = o.durum; if (!d) return;
    let f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1), bek = yzBekleyenler(o, seri);
    let git = function () {
        if (seri >= f.seri - 1) return yzBitir(true);
        yzGuncelle(function (x) { if (x.durum && x.durum.id === d.id && x.durum.seri === d.seri) { x.durum.seri = seri + 1; x.sayac = null; } });
        yzCiz();
    };
    if (bek.length) return onayIste(bek.length + ' sporcu bu seriyi henüz girmedi (' + bek.slice(0, 4).map(function (k) { return esc(yzKisaAd(yzKAd(k))); }).join(', ') + (bek.length > 4 ? '…' : '') + ').<br><small>Sonradan tablodaki hücreye dokunarak girebilirsin.</small>', git, seri >= f.seri - 1 ? 'Yine de bitir' : 'Sonraki seriye geç');
    git();
}
function yzBitir(zorla) {
    let o = yzOku(); if (!o.durum) return;
    let bitir = function () { yzGuncelle(function (x) { if (x.durum) { x.durum.asama = 'bitti'; x.durum.bitis = Date.now(); } x.sayac = null; }); yzCiz(); if (_yz.tv) yzTvCiz(); };
    if (zorla === true) return bitir();
    onayIste('Tur bitirilsin mi? Sonuçlar ekranı açılır (TV\'de de).', bitir, 'Turu bitir');
}
function yzMenu() {
    let o = yzOku(), d = o.durum; if (!d) return;
    let disari = yzRoster().filter(function (r) { return d.katilimci.indexOf(r.g + '|' + r.ad) === -1; });
    let html = '<div style="text-align:left"><b>Tur ayarları</b><div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">'
        + (disari.length ? '<div style="font-size:12px;color:var(--text-muted)">Tura sporcu ekle (kaçırdığı seriler boş kalır):</div><div style="display:flex;flex-wrap:wrap;gap:6px">' + disari.map(function (r) { return '<button class="yz-cip" onclick="yzSporcuEkle(\'' + yzEnc(r.g + '|' + r.ad) + '\')">+ ' + esc(r.ad) + '</button>'; }).join('') + '</div>' : '')
        + '<button class="yz-btn" onclick="yzSesDegis()">' + (_yz.ses ? '🔔 Düdük sesleri açık (bu cihaz)' : '🔕 Düdük sesleri kapalı (bu cihaz)') + '</button>'
        + '<button class="yz-btn" onclick="yzPdf()">📄 Sonuç PDF\'i (şu anki durum)</button>'
        + '<button class="yz-btn" onclick="document.getElementById(\'onay-modal\').style.display=\'none\'; yzBitir()">🏁 Turu şimdi bitir</button>'
        + '<button class="yz-btn tehlike" onclick="document.getElementById(\'onay-modal\').style.display=\'none\'; yzIptal()">🗑 Turu iptal et</button>'
        + '</div></div>';
    onayIste(html, null);
}
function yzSesDegis() { _yz.ses = !_yz.ses; try { localStorage.setItem('dag_yz_ses', _yz.ses ? '1' : '0'); } catch (e) {} document.getElementById('onay-modal').style.display = 'none'; showToast(_yz.ses ? '🔔 Sesler açık' : '🔕 Sesler kapalı', 'success'); }
function yzSporcuEkle(kEnc) {
    let k = decodeURIComponent(kEnc);
    yzGuncelle(function (o) { let d = o.durum; if (!d || d.katilimci.indexOf(k) !== -1) return; d.katilimci.push(k); let hb = d.ayar.hedefBasi || 3, n = d.katilimci.length - 1; d.hedefler[k] = (Math.floor(n / hb) + 1) + 'ABCD'.charAt(n % hb); });
    document.getElementById('onay-modal').style.display = 'none'; yzCiz(); showToast(yzKAd(k) + ' tura eklendi', 'success');
}
function yzIptal() {
    onayIste('Tur iptal edilsin mi? Tablo silinir (karneye işlenmiş oklar karnede kalır).', function () {
        yzGuncelle(function (o) { Object.keys(o).forEach(function (a) { if (a.indexOf('s_') === 0) delete o[a]; }); o.durum = null; o.sayac = null; });
        yzCiz();
    }, 'İptal et');
}
function yzYeniTur() { yzGuncelle(function (o) { Object.keys(o).forEach(function (a) { if (a.indexOf('s_') === 0) delete o[a]; }); o.durum = null; o.sayac = null; }); yzCiz(); }

// ---- ok girişi (tablet) — gövdede ayrı pencere: uzaktan gelen yeniden çizimler girişi bozmaz
function yzGirisAc(kEnc, seri) {
    let k = decodeURIComponent(kEnc), o = yzOku(), d = o.durum; if (!d) return;
    let mevcut = yzSkor(o, k)[seri];
    _yz.giris = { k: k, seri: seri, id: d.id, oklar: mevcut ? mevcut.slice() : [], duzeltme: !!mevcut };
    yzGirisCiz();
}
function yzGirisCiz() {
    let g = _yz.giris, kap = document.getElementById('yz-giris');
    if (!g) { if (kap) kap.remove(); document.removeEventListener('keydown', yzGirisTus, true); return; }
    let o = yzOku(), d = o.durum; if (!d) { _yz.giris = null; return yzGirisCiz(); }
    let f = yzFormat(d), r = yzSiralama(o).find(function (x) { return x.k === g.k; }) || { toplam: 0, sira: '-' };
    let onceki = yzSkor(o, g.k)[g.seri], digerToplam = r.toplam - (onceki ? yzTop(onceki) : 0);
    if (!kap) { kap = document.createElement('div'); kap.id = 'yz-giris'; kap.className = 'yz-giris-arka'; kap.addEventListener('click', function (e) { if (e.target === kap) yzGirisKapat(); }); document.body.appendChild(kap); document.addEventListener('keydown', yzGirisTus, true); }
    let slotlar = ''; for (let i = 0; i < f.ok; i++) { let p = g.oklar[i]; slotlar += '<span class="yz-ok ' + (p ? yzOkRenk(p) : 'bos') + '">' + (p || '') + '</span>'; }
    let tus = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].map(function (p) { return '<button class="yz-tus ' + yzOkRenk(p) + '" onclick="yzOkEkle(\'' + p + '\')"' + (g.oklar.length >= f.ok ? ' disabled' : '') + '>' + p + '</button>'; }).join('');
    let dolu = g.oklar.length >= f.ok, seriTop = yzTop(g.oklar);
    kap.innerHTML = '<div class="yz-giris" role="dialog" aria-modal="true" aria-label="Seri skoru">'
        + '<div class="yz-giris-bas"><div><span class="yz-sp-hedef">' + esc((d.hedefler || {})[g.k] || '') + '</span> <b>' + esc(yzKAd(g.k)) + '</b><div class="yz-alt">' + (g.seri + 1) + '. seri' + (g.duzeltme ? ' · <b style="color:var(--status-warning,#d97706)">düzeltme</b>' : '') + ' · ' + f.ok + ' ok</div></div><button class="yz-btn" onclick="yzGirisKapat()" aria-label="Kapat">✕</button></div>'
        + '<div class="yz-oklar">' + slotlar + '</div>'
        + '<div class="yz-giris-top"><span>Seri <b>' + seriTop + '</b></span><span>Toplam <b>' + (digerToplam + seriTop) + '</b></span></div>'
        + '<div class="yz-tuslar">' + tus + '</div>'
        + '<div class="yz-giris-alt"><button class="yz-btn" onclick="yzOkSil()"' + (g.oklar.length ? '' : ' disabled') + '>⌫ Geri al</button>'
        + '<label class="yz-onay kucuk"><input type="checkbox"' + (_yz.siradaki ? ' checked' : '') + ' onchange="_yz.siradaki=this.checked; try{localStorage.setItem(\'dag_yz_siradaki\', this.checked?\'1\':\'0\')}catch(e){}"> Kaydedince sıradakine geç</label>'
        + '<button class="yz-btn ana buyuk" onclick="yzGirisKaydet()"' + (dolu ? '' : ' disabled') + '>💾 Kaydet</button></div>'
        + '<div class="yz-alt" style="text-align:center">Klavye: X · 0 = 10 · 1-9 · M · ⌫ · Enter</div>'
        + '</div>';
}
function yzGirisTus(e) {
    if (!_yz.giris) return;
    let t = e.key, m = { x: 'X', X: 'X', m: 'M', M: 'M', '0': '10' };
    if (m[t] || /^[1-9]$/.test(t)) { e.preventDefault(); yzOkEkle(m[t] || t); }
    else if (t === 'Backspace') { e.preventDefault(); yzOkSil(); }
    else if (t === 'Enter') { e.preventDefault(); yzGirisKaydet(); }
    else if (t === 'Escape') { e.preventDefault(); e.stopPropagation(); yzGirisKapat(); }
}
function yzOkEkle(p) { let g = _yz.giris, d = yzOku().durum; if (!g || !d || g.oklar.length >= yzFormat(d).ok) return; g.oklar.push(p); yzGirisCiz(); }
function yzOkSil() { let g = _yz.giris; if (!g || !g.oklar.length) return; g.oklar.pop(); yzGirisCiz(); }
function yzGirisKapat() { _yz.giris = null; yzGirisCiz(); }
function yzGirisKaydet() {
    let g = _yz.giris; if (!g) return;
    let o = yzOku(), d = o.durum;
    if (!d || d.id !== g.id) { yzGirisKapat(); return showToast('Tur değişmiş — giriş kaydedilmedi.', 'error'); }
    let f = yzFormat(d); if (g.oklar.length < f.ok) return;
    let sirali = g.oklar.slice().sort(function (a, b) { return YZ_SIRA[b] - YZ_SIRA[a]; });
    let onceVardi = false;
    yzGuncelle(function (x) { let a = yzSKey(g.id, g.k), arr = (x[a] || []).slice(); onceVardi = !!arr[g.seri]; while (arr.length < g.seri) arr.push(null); arr[g.seri] = sirali; x[a] = arr; });
    if (d.ayar.kayit && !onceVardi) yzGercekKaydet(g.k, g.oklar, d.ayar.mesafe);
    else if (onceVardi) showToast('Tablo düzeltildi (karnedeki kayıt değişmez).', 'warning');
    let k = g.k, seri = g.seri; _yz.giris = null; yzGirisCiz();
    let yeni = yzOku(); yzCiz(); if (_yz.tv) yzTvCiz();
    // Sıradaki: aynı seride, hedef sırasına göre bu sporcudan sonra gelen ilk girilmemiş sporcu
    if (_yz.siradaki && !onceVardi && yeni.durum && seri === Math.min(yeni.durum.seri, f.seri - 1)) {
        let sira = yzHedefSirasi(yeni), i = sira.indexOf(k), aday = sira.slice(i + 1).concat(sira.slice(0, i)).find(function (x) { return !yzSkor(yeni, x)[seri]; });
        if (aday) yzGirisAc(yzEnc(aday), seri);
        else showToast('✅ ' + (seri + 1) + '. seri tamamlandı', 'success');
    }
}
// Gerçek skor/karne kaydı — Yarışma/Oyunlar ile aynı çekirdek. Turda seri limiti sessizce uzatılır.
function yzGercekKaydet(k, oklar, mesafe) {
    let i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1);
    let kaydedilecek = oklar.map(function (p) { return { puan: p, tarih: bugunISO(), mesafe: mesafe, kaynak: 'yarisma-siralama' }; });
    let sonuc = _skorKaydetCekirdek(g, ad, kaydedilecek);
    if (!sonuc.ok && sonuc.sebep === 'limit-doldu') {
        sonuc.grupData.devamModu = true; sonuc.grupData.lastModified = Date.now();
        try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
        sonuc = _skorKaydetCekirdek(g, ad, kaydedilecek);
    }
    if (!sonuc.ok) return showToast(ad + ': karneye işlenemedi (' + (sonuc.sebep || '?') + ') — tablo kaydedildi.', 'warning');
    try { klasmanDoldur(); } catch (e) {}
    try { otomatikYoklamaIsaretle(ad); } catch (e) {}
}

// ---- süre sayacı (WA: 10 sn hatta geçiş → atış → son 30 sn sarı → bitti)
function yzSesHazirla() { try { let AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; _yz.ac = _yz.ac || new AC(); if (_yz.ac.state === 'suspended') _yz.ac.resume(); } catch (e) {} }
function yzSayacBaslat() { yzSesHazirla(); let d = yzOku().durum; if (!d) return; yzGuncelle(function (o) { o.sayac = { basla: Date.now(), hazir: YZ_HAZIRLIK, sure: yzSure(d), seri: d.seri }; }); yzCiz(); }
function yzSayacDurdur() { yzGuncelle(function (o) { o.sayac = null; }); yzCiz(); }
function yzSayacDurum(o) {
    let s = o.sayac, d = o.durum;
    if (!d || d.asama === 'bitti') return { faz: 'bitti-tur', metin: 'SONUÇLAR', alt: '' };
    if (!s || s.seri !== d.seri) return { faz: 'hazir', metin: yzSaat(yzSure(d)), alt: 'HAZIR' };
    let gecen = (Date.now() - s.basla) / 1000;
    if (gecen < s.hazir) return { faz: 'hazirlik', metin: yzSaat(s.hazir - gecen), alt: 'HATTA GEÇ' };
    let kalan = s.sure - (gecen - s.hazir);
    if (kalan <= 0) return { faz: 'bitti', metin: '0:00', alt: 'SÜRE BİTTİ' };
    return { faz: kalan <= 30 ? 'son' : 'atis', metin: yzSaat(kalan), alt: kalan <= 30 ? 'SON 30 SN' : 'ATIŞ' };
}
function yzSayacHTML(o, id) { let s = yzSayacDurum(o); return '<div id="' + id + '" class="yz-sayac ' + s.faz + '"><span class="yz-sayac-alt">' + s.alt + '</span><span class="yz-sayac-sure">' + s.metin + '</span></div>'; }
function yzTimerBaslat() {
    if (_yz.timer) return;
    _yz.timer = setInterval(function () {
        let a = document.getElementById('yz-sayac'), b = document.getElementById('yz-tv-sayac');
        if (!a && !b) { clearInterval(_yz.timer); _yz.timer = null; return; }
        let o = yzOku(), s = yzSayacDurum(o);
        [a, b].forEach(function (el) { if (!el) return; el.className = 'yz-sayac ' + s.faz; el.querySelector('.yz-sayac-alt').textContent = s.alt; el.querySelector('.yz-sayac-sure').textContent = s.metin; });
        yzSesKontrol(o, s);
    }, 250);
}
// WA düdükleri: hatta geçiş 2, atış başlangıcı 1, süre sonu 3. Her geçiş cihaz başına bir kez; sayfa geç açıldıysa eski geçişi çalmaz.
function yzSesKontrol(o, s) {
    if (!_yz.ses || !o.sayac) return;
    let anahtar = o.sayac.basla + ':' + s.faz; if (_yz.calinan[anahtar]) return;
    let gecen = (Date.now() - o.sayac.basla) / 1000, sinir = s.faz === 'hazirlik' ? 0 : s.faz === 'atis' ? o.sayac.hazir : s.faz === 'bitti' ? o.sayac.hazir + o.sayac.sure : null;
    if (sinir === null) return;
    _yz.calinan[anahtar] = 1;
    if (gecen - sinir > 3) return;
    yzDuduk(s.faz === 'hazirlik' ? 2 : s.faz === 'atis' ? 1 : 3);
}
function yzDuduk(n) {
    try {
        let AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        _yz.ac = _yz.ac || new AC(); let ac = _yz.ac, t = ac.currentTime + 0.02;
        for (let i = 0; i < n; i++) {
            let os = ac.createOscillator(), g = ac.createGain(); os.type = 'square'; os.frequency.value = 2200;
            g.gain.setValueAtTime(0.0001, t + i * 0.55); g.gain.exponentialRampToValueAtTime(0.25, t + i * 0.55 + 0.02); g.gain.setValueAtTime(0.25, t + i * 0.55 + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.55 + 0.42);
            os.connect(g); g.connect(ac.destination); os.start(t + i * 0.55); os.stop(t + i * 0.55 + 0.45);
        }
    } catch (e) {}
}

// ---- sonuç ekranı
function yzSonucHTML(o) {
    let d = o.durum, f = yzFormat(d), sira = yzSiralama(o), ilk3 = sira.filter(function (r) { return r.toplam > 0; }).slice(0, 3);
    let podyum = [1, 0, 2].map(function (i) { let r = ilk3[i]; if (!r) return '<div class="yz-pod bos"></div>'; return '<div class="yz-pod p' + r.sira + '"><div class="yz-pod-madalya">' + (r.sira === 1 ? '🥇' : r.sira === 2 ? '🥈' : '🥉') + '</div><div class="yz-pod-ad">' + esc(r.ad) + '</div><div class="yz-pod-puan">' + r.toplam + '</div><div class="yz-alt">' + r.on + ' × 10+X · ' + (r.ok ? (r.toplam / r.ok).toFixed(2) : '0') + ' ort.</div><div class="yz-pod-blok"></div></div>'; }).join('');
    return '<div class="yp">'
        + '<div class="yz-sayfa-bas"><div><div class="yz-ust-etiket">SIRALAMA TURU · ' + esc(d.ayar.mesafe) + ' · ' + f.kisa + '</div><div class="yz-baslik">🏁 Sonuçlar</div></div>'
        + '<div class="yz-tur-btn"><button class="yz-btn tv" onclick="yzTvAc()">📺 TV ekranı</button><button class="yz-btn" onclick="yzPdf()">📄 PDF</button><button class="yz-btn ana" onclick="yzYeniTur()">🔁 Yeni tur</button></div></div>'
        + (ilk3.length ? '<div class="yz-podyum">' + podyum + '</div>' : '')
        + '<div class="yz-kart yz-tablo-kart"><div class="yz-tablo-kap">' + yzTabloHTML(o, sira, { duzenle: true }) + '</div></div>'
        + '</div>';
}

// ---------------------------------------------------------------- 📺 TV skor tablosu (sadece okur)
function yzTvAc() {
    _yz.tv = true; yzSesHazirla();
    let el = document.getElementById('yz-tv');
    if (!el) {
        el = document.createElement('div'); el.id = 'yz-tv'; el.className = 'yz-tv'; document.body.appendChild(el);
        try { if (el.requestFullscreen) el.requestFullscreen().catch(function () {}); } catch (e) {}
        try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { _yz.kilit = l; }).catch(function () {}); } catch (e) {}
        document.addEventListener('keydown', yzTvTus, true);
        window.addEventListener('resize', yzTvCiz);
    }
    _yz.tvHam = null; _yz.tvSon = {};
    yzTvCiz();
    clearInterval(_yz.tvPoll);
    // Ortak ders senkronu yerel kaydı güncelleyince (WS ile ~1 sn) burada fark edilir; ekran sadece değişince çizilir.
    _yz.tvPoll = setInterval(function () { let h = localStorage.getItem(yzAnahtar()); if (h !== _yz.tvHam) yzTvCiz(); }, 700);
    yzTimerBaslat();
}
function yzTvKapat() {
    _yz.tv = false; clearInterval(_yz.tvPoll); _yz.tvPoll = null;
    let el = document.getElementById('yz-tv'); if (el) el.remove();
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    try { if (_yz.kilit) { _yz.kilit.release(); _yz.kilit = null; } } catch (e) {}
    document.removeEventListener('keydown', yzTvTus, true); window.removeEventListener('resize', yzTvCiz);
}
function yzTvTus(e) { if (e.key === 'Escape' && _yz.tv && !_yz.giris) { e.preventDefault(); yzTvKapat(); } }
function yzTvCiz() {
    let el = document.getElementById('yz-tv'); if (!el) return;
    let ham = localStorage.getItem(yzAnahtar()); _yz.tvHam = ham;
    let o = yzOku(), d = o.durum;
    if (!d || !d.asama || d.asama === 'kurulum') { el.innerHTML = '<button class="yz-tv-kapat" onclick="yzTvKapat()">✕ Kapat</button><div class="yz-tv-bos"><div class="yz-tv-logo">DAĞ S.K.</div><div>Tur henüz başlamadı</div><small>Tablette Yarışma → Sıralama Turu → Turu başlat</small></div>'; return; }
    let f = yzFormat(d), sira = yzSiralama(o), seri = Math.min(d.seri, f.seri - 1), bitti = d.asama === 'bitti';
    // Yeni gelen seri skorlarını birkaç saniye vurgula
    let yeni = {}, simdi = Date.now();
    sira.forEach(function (r) { let imza = r.seriT.join(','), eski = _yz.tvSon[r.k]; if (eski && eski.imza !== imza) eski.zaman = simdi; if (!eski) _yz.tvSon[r.k] = { imza: imza, zaman: 0 }; else eski.imza = imza; if (_yz.tvSon[r.k].zaman && simdi - _yz.tvSon[r.k].zaman < 4000) yeni[r.k] = 1; });
    let bek = yzBekleyenler(o, seri).length;
    // Satır yüksekliği: tüm sporcular ekrana sığsın
    let n = Math.max(sira.length, 4), yuk = Math.max(28, Math.min(84, Math.floor((window.innerHeight * 0.74) / (n + 1))));
    el.style.setProperty('--yz-satir', yuk + 'px');
    el.innerHTML = '<button class="yz-tv-kapat" onclick="yzTvKapat()">✕ Kapat</button>'
        + '<div class="yz-tv-bas">'
        + '<div class="yz-tv-kimlik"><div class="yz-tv-logo">DAĞ S.K.</div><div class="yz-tv-ad">' + (bitti ? 'SIRALAMA TURU · SONUÇLAR' : 'SIRALAMA TURU') + '</div><div class="yz-tv-alt">' + esc(d.ayar.mesafe) + ' · ' + f.ad + ' · ' + new Date(d.basla).toLocaleDateString('tr-TR') + '</div></div>'
        + '<div class="yz-tv-seri">' + (bitti ? '<span class="yz-tv-seri-et">TUR</span><b>BİTTİ</b>' : '<span class="yz-tv-seri-et">SERİ</span><b>' + (seri + 1) + '</b><span class="yz-tv-seri-top">/ ' + f.seri + '</span>') + (!bitti ? '<div class="yz-tv-bek">' + (bek ? bek + ' skor bekleniyor' : '✓ seri tamam') + '</div>' : '') + '</div>'
        + (bitti ? '' : yzSayacHTML(o, 'yz-tv-sayac'))
        + '</div>'
        + '<div class="yz-tv-tablo">' + yzTabloHTML(o, sira, { hareket: true, yeni: yeni }) + '</div>';
    yzTimerBaslat();
}

// ---------------------------------------------------------------- 📄 PDF (native jsPDF — html2pdf bu projede boş sayfa üretiyor)
function yzPdf() {
    let o = yzOku(), d = o.durum; if (!d) return;
    try { let m = document.getElementById('onay-modal'); if (m) m.style.display = 'none'; } catch (e) {}
    showToast('PDF hazırlanıyor...', 'warning');
    let f = yzFormat(d), sira = yzSiralama(o), T = _trTranslit;
    _yeniPdfAl('landscape').then(function (pdf) {
        let W = 297, H = 210, mx = 12, uw = W - mx * 2, y;
        let sabit = [{ b: '#', w: 8 }, { b: 'HEDEF', w: 12 }, { b: 'SPORCU', w: 46 }], son = [{ b: 'TOPLAM', w: 18 }, { b: '10+X', w: 12 }, { b: 'X', w: 9 }];
        let yariSut = f.yari ? 2 : 0, kalan = uw - sabit.concat(son).reduce(function (a, c) { return a + c.w; }, 0), sw = kalan / (f.seri + yariSut);
        let kolonlar = sabit.slice(); for (let i = 0; i < f.seri; i++) { kolonlar.push({ b: String(i + 1), w: sw, s: i }); if (f.yari && i === f.yari - 1) kolonlar.push({ b: '1.Y', w: sw, y: 1 }); }
        if (f.yari) kolonlar.push({ b: '2.Y', w: sw, y: 2 }); kolonlar = kolonlar.concat(son);
        y = _kurumsalBaslikCiz(pdf, mx, uw, 10, 'SIRALAMA TURU', 'Sonuc listesi  |  ' + d.ayar.mesafe + '  |  ' + f.ad + '  |  ' + new Date(d.basla).toLocaleDateString('tr-TR') + (d.asama === 'bitti' ? '' : '  |  ARA SONUC (seri ' + (Math.min(d.seri, f.seri - 1) + 1) + ')'));
        let basliklar = function () {
            pdf.setFillColor(9, 22, 43); pdf.rect(mx, y, uw, 7.5, 'F'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(203, 213, 225);
            let x = mx; kolonlar.forEach(function (c) { pdf.text(c.b, c.s != null || c.y || c.b === 'TOPLAM' || c.b === '10+X' || c.b === 'X' ? x + c.w / 2 : x + 2, y + 5, c.s != null || c.y || c.b === 'TOPLAM' || c.b === '10+X' || c.b === 'X' ? { align: 'center' } : undefined); x += c.w; });
            y += 7.5;
        };
        basliklar();
        sira.forEach(function (r, i) {
            if (y + 8 > H - 16) { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, 'F'); y = 14; basliklar(); }
            if (r.sira <= 3 && r.toplam > 0) { pdf.setFillColor(r.sira === 1 ? 255 : r.sira === 2 ? 241 : 253, r.sira === 1 ? 247 : r.sira === 2 ? 245 : 239, r.sira === 1 ? 214 : r.sira === 2 ? 249 : 230); pdf.rect(mx, y, uw, 8, 'F'); }
            else if (i % 2 === 1) { pdf.setFillColor(248, 250, 252); pdf.rect(mx, y, uw, 8, 'F'); }
            pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.15); pdf.line(mx, y + 8, mx + uw, y + 8);
            let x = mx;
            kolonlar.forEach(function (c) {
                let v = '', orta = true, kalin = false, boy = 8, renk = [30, 41, 59];
                if (c.b === '#') { v = String(r.sira); kalin = true; }
                else if (c.b === 'HEDEF') v = r.hedef;
                else if (c.b === 'SPORCU') { v = T(r.ad); orta = false; kalin = true; boy = 8.5; renk = [9, 22, 43]; }
                else if (c.s != null) { v = r.seriT[c.s] == null ? '-' : String(r.seriT[c.s]); boy = 7.5; renk = r.seriT[c.s] == null ? [190, 198, 210] : [51, 65, 85]; }
                else if (c.y) { v = String(c.y === 1 ? r.y1 : r.y2); boy = 7.5; kalin = true; renk = [0, 110, 125]; }
                else if (c.b === 'TOPLAM') { v = String(r.toplam); kalin = true; boy = 10; renk = [9, 22, 43]; }
                else if (c.b === '10+X') v = String(r.on); else if (c.b === 'X') v = String(r.x);
                pdf.setFont('helvetica', kalin ? 'bold' : 'normal'); pdf.setFontSize(boy); pdf.setTextColor(renk[0], renk[1], renk[2]);
                if (orta) pdf.text(v, x + c.w / 2, y + 5.4, { align: 'center' }); else { let s = v; while (s.length > 1 && pdf.getTextWidth(s) > c.w - 3) s = s.slice(0, -1); pdf.text(s, x + 2, y + 5.4); }
                x += c.w;
            });
            y += 8;
        });
        _kurumsalAltBilgiCiz(pdf, W, H);
        pdf.save('Siralama_Turu_' + d.ayar.mesafe + '_' + bugunISO().replace(/-/g, '') + '.pdf');
        showToast('PDF indirildi! 📄', 'success');
    }).catch(function (e) { console.error(e); showToast('PDF oluşturulamadı.', 'error'); });
}

// ---------------------------------------------------------------- stil
function yzCssYukle() {
    if (document.getElementById('yz-css')) return;
    let st = document.createElement('style'); st.id = 'yz-css';
    st.textContent = [
        '.yp{display:flex;flex-direction:column;gap:12px;padding-bottom:30px}',
        '.yz-sayfa-bas{display:flex;justify-content:space-between;align-items:flex-end;gap:10px;flex-wrap:wrap}',
        '.yz-baslik{font-size:20px;font-weight:900;letter-spacing:-.01em}.yz-alt{font-size:12px;color:var(--text-muted);line-height:1.45}',
        '.yz-link{background:none;border:none;color:var(--text-muted);font:inherit;font-size:12px;font-weight:700;cursor:pointer;padding:0;margin-bottom:4px}',
        '.yz-ust-etiket{font-size:10.5px;font-weight:800;letter-spacing:.12em;color:var(--text-muted)}',
        '.yz-kart{background:var(--bg-panel);border:1px solid var(--border-color);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px}',
        '.yz-etiket{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.yz-etiket b{color:var(--text-main)}.yz-etiket-btn{margin-left:auto;text-transform:none;letter-spacing:0}',
        '.yz-cipler{display:flex;flex-wrap:wrap;gap:6px}.yz-cip{border:1px solid var(--border-color);background:transparent;color:var(--text-muted);border-radius:999px;padding:0 13px;min-height:38px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}.yz-cip.aktif{background:var(--accent-orange);border-color:var(--accent-orange);color:#1a0d05}',
        '.yz-sure-ozel{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--border-color);border-radius:999px;padding:3px 4px 3px 12px}.yz-sure-ozel.aktif{border-color:var(--accent-orange)}.yz-sure-ozel input{width:64px;background:transparent;border:none;color:var(--text-main);font:inherit;font-size:14px;font-weight:800;appearance:auto!important;-webkit-appearance:auto!important}.yz-sure-ozel span{font-size:12px;color:var(--text-muted)}.yz-sure-ozel .yz-cip{min-height:32px}',
        '.yz-kur-izgara{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}',
        '.yz-ozet-satir{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:13px;color:var(--text-muted)}.yz-ozet-satir b{color:var(--text-main)}',
        '.yz-onay{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-muted);cursor:pointer}.yz-onay input{width:20px;height:20px;appearance:auto!important;-webkit-appearance:checkbox!important;accent-color:var(--accent-orange)}.yz-onay.kucuk{font-size:12px}',
        '.yz-btn{border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);border-radius:12px;padding:0 16px;min-height:44px;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap}.yz-btn:disabled{opacity:.4;cursor:default}',
        '.yz-btn.ana{background:var(--accent-orange);border-color:var(--accent-orange);color:#1a0d05}.yz-btn.buyuk{min-height:54px;font-size:15px;padding:0 22px}.yz-btn.yesil{background:#16a34a;border-color:#16a34a;color:#fff}.yz-btn.tv{background:#0e7490;border-color:#0e7490;color:#fff}.yz-btn.tehlike{color:var(--status-danger,#ef4444)}',
        '.yz-geri-bar{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:12px;font-weight:800;color:var(--text-muted)}',
        '.yz-turler{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}',
        '.yz-tur{position:relative;text-align:left;display:flex;flex-direction:column;gap:8px;padding:20px;border-radius:18px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);font:inherit;cursor:pointer;min-height:190px}',
        '.yz-tur.ana{border-color:var(--accent-orange);box-shadow:0 0 0 1px var(--accent-orange),0 12px 32px color-mix(in srgb,var(--accent-orange) 18%,transparent)}',
        '.yz-tur-ikon{font-size:34px}.yz-tur-ad{font-size:19px;font-weight:900}.yz-tur-acik{font-size:13px;color:var(--text-muted);line-height:1.5}.yz-tur-durum{margin-top:auto;font-size:12px;font-weight:800;color:#22c55e}.yz-tur-durum.sakin{color:var(--text-muted)}',
        '.yz-tur-rozet{position:absolute;top:14px;right:14px;font-size:10.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;background:var(--accent-orange);color:#1a0d05;border-radius:999px;padding:3px 9px}',
        '.yz-tur-bas{display:grid;grid-template-columns:1fr auto auto;gap:14px;align-items:center;background:var(--bg-panel);border:1px solid var(--border-color);border-radius:18px;padding:14px 16px}',
        '@media (max-width:760px){.yz-tur-bas{grid-template-columns:1fr auto}.yz-tur-btn{grid-column:1/-1}}',
        '.yz-seri-no{font-size:15px;font-weight:800;color:var(--text-muted)}.yz-seri-no b{font-size:40px;line-height:1;color:var(--text-main);font-variant-numeric:tabular-nums}.yz-seri-no span{font-size:18px}.yz-yari{font-size:12px;font-weight:700;color:var(--text-muted)}',
        '.yz-sayac-kap{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.yz-sayac-btn{display:flex;gap:6px}',
        '.yz-sayac{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:130px;padding:6px 14px;border-radius:14px;background:#1f2937;color:#e5e7eb;font-variant-numeric:tabular-nums;transition:background .3s}',
        '.yz-sayac-alt{font-size:10.5px;font-weight:900;letter-spacing:.14em;opacity:.9}.yz-sayac-sure{font-size:34px;font-weight:900;line-height:1.05}',
        '.yz-sayac.hazirlik,.yz-sayac.bitti{background:#dc2626;color:#fff}.yz-sayac.atis{background:#16a34a;color:#fff}.yz-sayac.son{background:#facc15;color:#1a1a1a}.yz-sayac.hazir{background:#334155;color:#e2e8f0}',
        '.yz-tur-btn{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}',
        '.yz-bilgi{padding:12px 14px;border-radius:14px;background:color-mix(in srgb,#facc15 16%,transparent);border:1px solid color-mix(in srgb,#facc15 45%,transparent);font-weight:700;font-size:13px}',
        '.yz-ilerleme{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:13px;color:var(--text-muted)}.yz-ilerleme b{color:var(--text-main)}',
        '.yz-bar{flex:1;min-width:120px;height:10px;border-radius:99px;background:var(--border-color);overflow:hidden}.yz-bar i{display:block;height:100%;background:linear-gradient(90deg,#16a34a,#22c55e);border-radius:99px;transition:width .4s}',
        '.yz-hedefler{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}',
        '.yz-hedef{background:var(--bg-panel);border:1px solid var(--border-color);border-radius:16px;padding:10px;display:flex;flex-direction:column;gap:8px}',
        '.yz-hedef-no{font-size:11px;font-weight:900;letter-spacing:.14em;color:var(--text-muted)}.yz-hedef-sp{display:flex;flex-direction:column;gap:6px}',
        '.yz-sp{display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;column-gap:10px;align-items:center;text-align:left;padding:10px 12px;min-height:60px;border-radius:12px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;cursor:pointer}',
        '.yz-sp-hedef{grid-row:1/3;display:inline-flex;align-items:center;justify-content:center;min-width:34px;height:34px;border-radius:10px;background:#0e7490;color:#fff;font-weight:900;font-size:13px}',
        '.yz-sp-ad{font-weight:800;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.yz-sp-top{font-size:11.5px;color:var(--text-muted);font-variant-numeric:tabular-nums}',
        '.yz-sp-seri{grid-row:1/3;grid-column:3;font-size:22px;font-weight:900;font-variant-numeric:tabular-nums;color:var(--accent-orange)}',
        '.yz-sp.tamam{border-color:color-mix(in srgb,#22c55e 55%,transparent);background:color-mix(in srgb,#22c55e 9%,var(--bg-main))}.yz-sp.tamam .yz-sp-seri{color:#22c55e}',
        '.yz-tablo-kart{padding:10px}.yz-tablo-kap{overflow-x:auto}',
        '.yz-tablo{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums;font-size:13px}',
        '.yz-tablo th{font-size:10.5px;font-weight:800;letter-spacing:.06em;color:var(--text-muted);padding:6px 4px;border-bottom:1px solid var(--border-color);text-align:center;white-space:nowrap}',
        '.yz-tablo td{padding:7px 4px;border-bottom:1px solid var(--border-color);text-align:center;white-space:nowrap}',
        '.yz-tablo .ad{text-align:left;font-weight:800;padding-left:8px}.yz-tablo th.ad{text-align:left}.yz-tablo .sira{font-weight:900;width:32px}.yz-tablo .hdf{color:var(--text-muted);font-weight:700}',
        '.yz-tablo .top{font-weight:900;font-size:1.15em}.yz-tablo .yari{color:#0891b2;font-weight:800}.yz-tablo td.s.bos{color:var(--border-color)}.yz-tablo .s.aktif{background:color-mix(in srgb,var(--accent-orange) 13%,transparent)}',
        '.yz-tablo td.tik{cursor:pointer}.yz-tablo td.tik:hover{outline:1px solid var(--accent-orange);outline-offset:-2px;border-radius:6px}',
        '.yz-tablo tr.p1 .sira{color:#eab308}.yz-tablo tr.p2 .sira{color:#94a3b8}.yz-tablo tr.p3 .sira{color:#c2410c}',
        '.yz-tablo .hr .yuk{color:#22c55e;font-weight:900}.yz-tablo .hr .dus{color:#ef4444;font-weight:900}',
        // giriş penceresi
        '.yz-giris-arka{position:fixed;inset:0;z-index:30800;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;padding:10px}',
        '@media (min-width:700px){.yz-giris-arka{align-items:center}}',
        '.yz-giris{width:min(560px,100%);max-height:100%;overflow:auto;background:linear-gradient(var(--bg-panel),var(--bg-panel)),var(--bg-main,#14121c);color:var(--text-main);border:1px solid var(--border-color);border-radius:22px;padding:16px;display:flex;flex-direction:column;gap:12px;box-shadow:0 24px 60px rgba(0,0,0,.5)}',
        '.yz-giris-bas{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.yz-giris-bas b{font-size:17px}',
        '.yz-oklar{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}',
        '.yz-ok{height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:19px;aspect-ratio:1;margin:auto;width:100%;max-width:58px}',
        '.yz-ok.bos{border:2px dashed var(--border-color)}',
        '.yz-giris-top{display:flex;justify-content:space-between;font-size:14px;color:var(--text-muted)}.yz-giris-top b{font-size:22px;color:var(--text-main);font-variant-numeric:tabular-nums}',
        '.yz-tuslar{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}',
        '.yz-tus{min-height:62px;border-radius:16px;border:none;font:inherit;font-size:24px;font-weight:900;cursor:pointer;touch-action:manipulation}.yz-tus:disabled{opacity:.3;filter:saturate(.4)}',
        '.yz-r-sari{background:#fde047;color:#1a1a1a}.yz-r-kirmizi{background:#ef4444;color:#fff}.yz-r-mavi{background:#0ea5e9;color:#fff}.yz-r-siyah{background:#111827;color:#fff;box-shadow:inset 0 0 0 2px #4b5563}.yz-r-beyaz{background:#f8fafc;color:#111;box-shadow:inset 0 0 0 2px #cbd5e1}.yz-r-kacan{background:#475569;color:#fff}',
        '.yz-giris-alt{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.yz-giris-alt .yz-btn.ana{margin-left:auto}',
        // sonuç
        '.yz-podyum{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;align-items:end;max-width:720px;width:100%;margin:6px auto}',
        '.yz-pod{text-align:center;display:flex;flex-direction:column;gap:3px;align-items:center}.yz-pod-madalya{font-size:38px}.yz-pod-ad{font-weight:900;font-size:14px}.yz-pod-puan{font-size:30px;font-weight:900;font-variant-numeric:tabular-nums}',
        '.yz-pod-blok{width:100%;border-radius:12px 12px 0 0;margin-top:6px}.yz-pod.p1 .yz-pod-blok{height:90px;background:linear-gradient(#eab308,#a16207)}.yz-pod.p2 .yz-pod-blok{height:64px;background:linear-gradient(#cbd5e1,#64748b)}.yz-pod.p3 .yz-pod-blok{height:44px;background:linear-gradient(#fb923c,#9a3412)}',
        // 📺 TV — tek görsel dünya (tema bağımsız): gece laciverdi zemin, yarışma ışıkları, büyük rakamlar
        '.yz-tv{position:fixed;inset:0;z-index:31500;background:radial-gradient(1200px 600px at 85% -10%,#12325a 0%,transparent 60%),#050b16;color:#e8eef7;display:flex;flex-direction:column;padding:2.2vh 2.2vw;gap:1.6vh;font-variant-numeric:tabular-nums;overflow:hidden}',
        '.yz-tv-kapat{position:absolute;top:10px;left:10px;opacity:.15;background:#0f1d33;color:#fff;border:1px solid #29425f;border-radius:10px;padding:6px 12px;font:inherit;font-size:12px;cursor:pointer;z-index:2}.yz-tv-kapat:hover,.yz-tv-kapat:focus{opacity:1}',
        '.yz-tv-bas{display:grid;grid-template-columns:1fr auto auto;gap:2vw;align-items:stretch}',
        '.yz-tv-kimlik{display:flex;flex-direction:column;justify-content:center;border-left:.6vw solid #f59e0b;padding-left:1.4vw}',
        '.yz-tv-logo{font-size:1.5vw;font-weight:900;letter-spacing:.3em;color:#f59e0b}.yz-tv-ad{font-size:3.2vw;font-weight:900;letter-spacing:.02em;line-height:1.05}.yz-tv-alt{font-size:1.3vw;color:#8aa2c0;font-weight:600}',
        '.yz-tv-seri{display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0d1a2e;border:1px solid #1d3354;border-radius:1.4vw;padding:1vh 2.2vw}',
        '.yz-tv-seri-et{font-size:1.1vw;font-weight:900;letter-spacing:.3em;color:#8aa2c0}.yz-tv-seri b{font-size:5.4vw;line-height:1;font-weight:900}.yz-tv-seri-top{font-size:1.6vw;color:#8aa2c0;font-weight:800}.yz-tv-bek{font-size:1vw;color:#8aa2c0;margin-top:.4vh}',
        '.yz-tv .yz-sayac{min-width:15vw;border-radius:1.4vw;padding:1vh 2vw}.yz-tv .yz-sayac-alt{font-size:1.2vw}.yz-tv .yz-sayac-sure{font-size:5.6vw}',
        '.yz-tv-tablo{flex:1;overflow:hidden;background:#08121f;border:1px solid #16263e;border-radius:1.2vw}',
        '.yz-tv .yz-tablo{font-size:calc(var(--yz-satir) * .42);color:#e8eef7}',
        '.yz-tv .yz-tablo th{font-size:calc(var(--yz-satir) * .24);color:#7d93b2;border-bottom:1px solid #1d3354;padding:.9vh .3vw;background:#0b1829;position:sticky;top:0}',
        '.yz-tv .yz-tablo td{height:var(--yz-satir);padding:0 .3vw;border-bottom:1px solid #12223a}',
        '.yz-tv .yz-tablo tbody tr:nth-child(even){background:#0a1728}',
        '.yz-tv .yz-tablo .ad{font-size:1.08em;padding-left:1vw}.yz-tv .yz-tablo .top{font-size:1.35em;color:#fff;background:#0f2440}.yz-tv .yz-tablo td.s.bos{color:#23364f}',
        '.yz-tv .yz-tablo .s.aktif{background:rgba(245,158,11,.14);color:#fbbf24;font-weight:900}.yz-tv .yz-tablo th.s.aktif{color:#fbbf24}',
        '.yz-tv .yz-tablo .yari{color:#38bdf8}.yz-tv .yz-tablo .hdf{color:#7d93b2}.yz-tv .yz-tablo .on,.yz-tv .yz-tablo .x{color:#9fb3cf}',
        '.yz-tv .yz-tablo tr.p1 td.sira{color:#0b0b0b;background:#fbbf24}.yz-tv .yz-tablo tr.p2 td.sira{color:#0b0b0b;background:#cbd5e1}.yz-tv .yz-tablo tr.p3 td.sira{color:#fff;background:#c2410c}',
        '.yz-tv .yz-tablo tr.yeni td{animation:yzYeni 4s ease-out}',
        '@keyframes yzYeni{0%{background:rgba(34,197,94,.45)}100%{background:transparent}}',
        '.yz-tv-bos{margin:auto;text-align:center;display:flex;flex-direction:column;gap:1.4vh;font-size:3vw;font-weight:900}.yz-tv-bos small{font-size:1.4vw;color:#8aa2c0;font-weight:600}',
        '@media (prefers-reduced-motion:reduce){.yz-tv .yz-tablo tr.yeni td{animation:none;background:rgba(34,197,94,.25)}}'
    ].join('\n');
    document.head.appendChild(st);
}
