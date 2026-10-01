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
function yzSure(d) { if (d && d.asama === 'eleme') { let e = parseInt(d.ayar.setSure, 10); return e >= 10 ? e : 120; } let s = d && d.ayar && parseInt(d.ayar.sure, 10); return s >= 10 ? s : yzFormat(d).ok >= 6 ? 240 : 120; }
function yzSureEtiket(sn) { return sn + ' sn'; }
// Süre seçici: hazır kalıplar + özel. hedef: 'kurulum' (taslak) ya da 'tur' (süren tur, ortak kayda yazar)
function yzSureSeciciHTML(secili, hedef) {
    let ozel = YZ_SURELER.indexOf(secili) === -1, id = 'yz-sure-ozel-' + hedef;
    return '<div class="yz-cipler">' + YZ_SURELER.map(function (sn) { return '<button class="yz-cip' + (sn === secili ? ' aktif' : '') + '" onclick="yzSureSec(\'' + hedef + '\',' + sn + ')">' + sn + ' sn</button>'; }).join('')
        + '<span class="yz-sure-ozel' + (ozel ? ' aktif' : '') + '"><input id="' + id + '" type="number" inputmode="numeric" min="10" max="900" step="5" placeholder="Özel" value="' + (ozel ? secili : '') + '" aria-label="Özel süre (saniye)" onkeydown="if(event.key===\'Enter\'){yzSureSec(\'' + hedef + '\', this.value)}"><span>sn</span><button class="yz-cip" onclick="yzSureSec(\'' + hedef + '\', document.getElementById(\'' + id + '\').value)">Uygula</button></span></div>';
}
function yzSureSec(hedef, sn) {
    sn = parseInt(sn, 10); if (!(sn >= 10 && sn <= 900)) return showToast('Süre 10–900 sn arası olmalı.', 'error');
    if (hedef === 'kurulum') { yzKurulumTaslak().sure = sn; yzCiz(); return; }
    yzGuncelle(function (o) { if (o.durum) { if (o.durum.asama === 'eleme') o.durum.ayar.setSure = sn; else o.durum.ayar.sure = sn; if (o.sayac && o.sayac.seri === o.durum.seri) o.sayac.sure = sn; } });
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
// Sayaç SANİYE olarak gösterilir (kullanıcı: '1:20 değil, 90'dan geri saysın').
function yzSaat(sn) { return String(Math.max(0, Math.ceil(sn))); }
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
        let girilen = seriT.filter(function (v) { return v != null; }).length, hp = parseInt(((o[yzHpKey(d.id)] || {})[k]), 10) || null;
        let gi = k.indexOf('|'), spx = turnuvaDB[k.slice(0, gi)] && turnuvaDB[k.slice(0, gi)][k.slice(gi + 1)], bk = yzBeklenenOrt(o, k);
        return { yay: (spx && spx.yay) || 'Klasik', ortOk: bk ? bk.ort : null, ortKaynak: bk ? bk.kaynak : null, gelisim: bk && ok ? Math.round(toplam - bk.ort * ok) : null, k: k, ad: yzKAd(k), hedef: (d.hedefler || {})[k] || '', seriT: seriT, toplam: toplam, on: on, x: x, ok: ok, y1: y1, y2: y2, girilen: girilen, hedefPuan: hp, tempo: girilen >= 2 && girilen < f.seri ? Math.round(toplam / girilen * f.seri) : (girilen === f.seri ? toplam : null) };
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
    yzUstBarEkle('⚔️ Takım & Düello');
}
function yzTurlereDon() { yzModAyarla('secim'); kmYarismaGiris(); }

// ---------------------------------------------------------------- 1) tür seçimi
function yzSecimCiz() {
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    let o = yzOku(), d = o.durum, suren = d && d.asama && d.asama !== 'kurulum';
    ic.innerHTML = '<div class="yz"><div class="yz-sayfa-bas"><div><div class="yz-baslik">🏆 Yarışma</div><div class="yz-alt">Ne tür bir yarışma yapacaksınız?</div></div></div>'
        + '<div class="yz-turler">'
        + '<button class="yz-tur ana" onclick="yzModAyarla(\'siralama\'); yzCiz()"><span class="yz-tur-rozet">Önerilen</span><span class="yz-tur-ikon">🏹</span><span class="yz-tur-ad">Sıralama Turu</span>'
        + '<span class="yz-tur-acik">Gerçek yarışma temposu: 12 seri × 6 ok, süreli seriler, hedef ataması, canlı sıralama. Skorlar tabletten girilir, <b>📺 TV ekranında</b> herkes anında görür.</span>'
        + (suren ? '<span class="yz-tur-durum">● Süren tur var — dokun ve devam et</span>' : '<span class="yz-tur-durum sakin">72 ok · 36 ok · 60 ok salon</span>') + '</button>'
        + '<button class="yz-tur" onclick="yzModAyarla(\'takim\'); kmYarismaGiris()"><span class="yz-tur-ikon">⚔️</span><span class="yz-tur-ad">Takım &amp; Düello Maçları</span>'
        + '<span class="yz-tur-acik">1v1 – 4v4 takım maçları, set sistemi, eleme ağacı. Ders içi eğlenceli rekabet için.</span><span class="yz-tur-durum sakin">Klasik Yarışma modu</span></button>'
        + '</div></div>';
    yzUstBarEkle(null);
}

// ---------------------------------------------------------------- 2) sıralama turu
function yzCiz() {
    if (_yz.mod !== 'siralama') yzModAyarla('siralama');
    let ic = document.getElementById('km-icerik'), o = yzOku(), d = o.durum;
    if (ic) {
        if (!d || !d.asama || d.asama === 'kurulum') ic.innerHTML = yzKurulumHTML();
        else if (d.asama === 'bitti') ic.innerHTML = yzSonucHTML(o);
        else if (d.asama === 'eleme') ic.innerHTML = yzElemeHTML(o);
        else ic.innerHTML = yzTurHTML(o);
        yzUstBarEkle('🏹 Sıralama Turu');
    }
    if (_yz.tv) yzTvCiz(); // TV'den yapılan işlemler (skor, süre, sonraki seri) TV'yi de hemen yeniler
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
    return '<div class="yz">'
        + '<div class="yz-sayfa-bas"><div><div class="yz-baslik">🏹 Sıralama Turu</div><div class="yz-alt">Gerçek yarışma provası. Her seri süreli; skorlar hedefe gidilince tabletten girilir, TV ekranında canlı sıralama görünür.</div></div></div>'
        + '<div class="yz-kart"><div class="yz-etiket">Sporcular <b>' + t.katilimci.length + '</b> <span class="yz-etiket-btn"><button class="yz-link" onclick="yzKurTumu(true)">Tümü</button> · <button class="yz-link" onclick="yzKurTumu(false)">Hiçbiri</button></span></div>'
        + (roster.length ? '<div class="yz-cipler">' + roster.map(function (k, i) { return cip(esc(k.ad), t.katilimci.indexOf(k.g + '|' + k.ad) !== -1, 'yzKurSporcu(' + i + ')'); }).join('') + '</div>' : '<div class="yz-alt">Önce Karışık Sınıf listesine sporcu ekle.</div>')
        + '</div>'
        + '<div class="yz-kart yz-kur-izgara">'
        + '<div><div class="yz-etiket">Mesafe</div><div class="yz-cipler">' + ['18m', '30m', '50m', '60m', '70m'].map(function (m) { return cip(m, t.mesafe === m, 'yzKurAyar(\'mesafe\',\'' + m + '\')'); }).join('') + '</div></div>'
        + '<div><div class="yz-etiket">Format</div><div class="yz-cipler">' + Object.keys(YZ_FORMAT).map(function (k) { return cip(YZ_FORMAT[k].ad, t.format === k, 'yzKurAyar(\'format\',\'' + k + '\')'); }).join('') + '</div></div>'
        + '<div><div class="yz-etiket">Hedef kağıdı</div><div class="yz-cipler">' + Object.keys(YZ_YUZ).map(function (y) { return cip(YZ_YUZ[y].ad, (t.yuz || '6') === y, 'yzKurAyar(\'yuz\',\'' + y + '\')'); }).join('') + '</div><div class="yz-alt">Hedefe dokunarak girişte puan ve grup analizi buna göre hesaplanır.</div></div>'
        + '<div><div class="yz-etiket">Hedef başına sporcu</div><div class="yz-cipler">' + [1, 2, 3, 4].map(function (n) { return cip(String(n), t.hedefBasi === n, 'yzKurAyar(\'hedefBasi\',' + n + ')'); }).join('') + '</div><div class="yz-alt">' + (t.katilimci.length ? hedefSay + ' hedef kullanılacak (1A, 1B, … sırayla atanır)' : '') + '</div></div>'
        + '</div>'
        + '<div class="yz-kart"><div class="yz-etiket">⏱ Seri süresi <span class="yz-alt" style="text-transform:none;letter-spacing:0;font-weight:600">· + 10 sn hatta geçiş</span></div>' + yzSureSeciciHTML(t.sure || yzVarsayilanSure(t.format), 'kurulum') + '<div class="yz-ozet-satir"><span>⏱ <b>' + yzSureEtiket(t.sure || yzVarsayilanSure(t.format)) + '</b> / seri</span><span>🎯 ' + f.seri + ' seri × ' + f.ok + ' ok</span>' + (f.yari ? '<span>☕ ' + f.yari + '. seriden sonra ara</span>' : '') + '</div>'
        + '<label class="yz-onay"><input type="checkbox"' + (t.kayit ? ' checked' : '') + ' onchange="yzKurAyar(\'kayit\', this.checked)"> Okları sporcuların gerçek skoruna / karnesine işle</label>'
        + '<button class="yz-btn ana buyuk" ' + (t.katilimci.length ? '' : 'disabled') + ' onclick="yzBaslat()">🏁 Turu başlat</button></div>'
        + yzArsivKartHTML()
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
        yzTurTemizle(o); // önceki turların skorları
        o.durum = { asama: 'tur', id: id, ayar: { mesafe: t.mesafe, format: t.format, kayit: !!t.kayit, hedefBasi: t.hedefBasi, sure: t.sure || yzVarsayilanSure(t.format), yuz: t.yuz || '6' }, katilimci: t.katilimci.slice(), hedefler: yzHedefAta(t.katilimci, t.hedefBasi), seri: 0, basla: Date.now() };
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
                + '<span class="yz-sp-top">Σ ' + r.toplam + ' · ' + r.sira + '.' + (r.hedefPuan ? ' · 🎯 ' + (r.hedefPuan - r.toplam > 0 ? (r.hedefPuan - r.toplam) + ' kaldı' : '✓') : '') + '</span></button>';
        }).join('') + '</div></div>';
    }).join('');
    let ilerlemeBtn = tamam
        ? (sonSeri ? '<button class="yz-btn ana buyuk" onclick="yzBitir()">🏁 Turu bitir — sonuçlar</button>' : '<button class="yz-btn ana buyuk" onclick="yzSonrakiSeri()">▶ ' + (seri + 2) + '. seriye geç</button>')
        : '<button class="yz-btn" onclick="yzSonrakiSeri()">' + (sonSeri ? 'Turu yine de bitir' : 'Beklemeden ' + (seri + 2) + '. seriye geç') + '</button>';
    return '<div class="yz">'
        + '<div class="yz-tur-bas">'
        + '<div class="yz-tur-bilgi"><div class="yz-ust-etiket">SIRALAMA TURU · ' + esc(d.ayar.mesafe) + ' · ' + f.kisa + '</div><div class="yz-seri-no">SERİ <b>' + (seri + 1) + '</b><span>/' + f.seri + '</span></div>'
        + (f.yari ? '<div class="yz-yari">' + (seri < f.yari ? '1. yarı' : '2. yarı') + '</div>' : '') + '</div>'
        + '<div class="yz-sayac-kap">' + yzSayacHTML(o, 'yz-sayac') + '<div class="yz-sayac-btn">' + (o.sayac ? '<button class="yz-btn" onclick="yzSayacDurdur()">⏹ Sıfırla</button>' : '<button class="yz-btn yesil" onclick="yzSayacBaslat()">▶ Süreyi başlat</button>') + '<button class="yz-btn" onclick="yzSureMenu()" title="Seri süresini değiştir">⏱ ' + yzSure(d) + ' sn</button></div></div>'
        + '<div class="yz-tur-btn"><button class="yz-btn tv" onclick="yzTvAc()">📺 TV ekranı</button><button class="yz-btn" onclick="yzMenu()" aria-label="Diğer">⋯</button></div>'
        + '</div>'
        + (yariArasi ? '<div class="yz-bilgi">☕ 1. yarı bitti — kısa mola. Hazır olunca süreyi başlat.</div>' : '')
        + '<div class="yz-ilerleme"><div class="yz-bar"><i style="width:' + Math.round(girilen / Math.max(1, d.katilimci.length) * 100) + '%"></i></div><span><b>' + girilen + '/' + d.katilimci.length + '</b> sporcu bu seriyi girdi</span>' + ilerlemeBtn + '</div>'
        + (Object.keys(o[yzHpKey(d.id)] || {}).length ? '' : '<div class="yz-ipucu">🎯 Sporculara kişisel hedef puan ver → TV\'de <b>tempo</b> (bu gidişle bitiş) hedefe göre yeşil/kırmızı görünür. <button class="yz-link" onclick="yzHedeflerAc()">Hedefleri gir →</button></div>')
        + '<div class="yz-hedefler">' + hedefHTML + '</div>'
        + '<div class="yz-kart yz-tablo-kart"><div class="yz-etiket">Canlı sıralama <span class="yz-alt">· hücreye dokun → o seriyi düzelt</span>' + yzGorunumKontrolHTML(o) + '</div><div class="yz-tablo-kap">' + yzGorunumHTML(o, sira, { kompakt: true, duzenle: true }) + '</div></div>'
        + '</div>';
}
// Tablo — tur ekranı, TV ve sonuç ekranı ortak.
function yzTabloHTML(o, sira, sec) {
    sec = sec || {};
    let d = o.durum, f = yzFormat(d), aktif = d.asama === 'bitti' ? -1 : Math.min(d.seri, f.seri - 1);
    let onceki = {}; if (sec.onceki) onceki = sec.onceki; else if (sec.hareket && aktif > 0) yzSiralama(o, aktif).forEach(function (r) { onceki[r.k] = r.sira; });
    let enIyi = sec.gelisim ? Math.max.apply(null, sira.slice(3).map(function (r) { return r.gelisim == null ? -1e9 : r.gelisim; }).concat([-1e9])) : null;
    let bas = '<th class="sira">#</th>' + (sec.hareket ? '<th class="hr"></th>' : '') + '<th class="hdf">HEDEF</th><th class="ad">SPORCU</th>';
    for (let i = 0; i < f.seri; i++) { bas += '<th class="s' + (i === aktif ? ' aktif' : '') + '">' + (i + 1) + '</th>'; if (f.yari && i === f.yari - 1) bas += '<th class="yari">1.Y</th>'; }
    if (f.yari) bas += '<th class="yari">2.Y</th>';
    bas += '<th class="top">TOPLAM</th>' + (sec.gelisim ? '<th class="gel">GELİŞİM</th>' : '') + '<th class="tmp">' + (aktif >= 0 ? 'TEMPO' : 'HEDEF') + '</th><th class="on">10+X</th><th class="x">X</th>';
    let govde = sira.map(function (r, idx) {
        let hr = '', ayrac = sec.gelisim && idx === 3 ? '<tr class="yz-ayrac"><td colspan="40">📈 EN ÇOK GELİŞENLER · kendi ortalamasına göre (ilk 3 gerçek puana göre)</td></tr>' : '';
        if (sec.hareket) { let p = onceki[r.k]; hr = '<td class="hr">' + (p && p > r.sira ? '<span class="yuk">▲' + (p - r.sira) + '</span>' : p && p < r.sira ? '<span class="dus">▼' + (r.sira - p) + '</span>' : '') + '</td>'; }
        let tr = ayrac + '<tr class="' + (r.sira <= 3 && r.toplam > 0 ? 'p' + r.sira : '') + (sec.yeni && sec.yeni[r.k] ? ' yeni' : '') + (sec.tvGiris ? ' tv-tik' : '') + '"' + (sec.tvGiris ? ' onclick="yzTvSatir(\'' + yzEnc(r.k) + '\')" title="Bu serinin skorunu gir"' : '') + '><td class="sira">' + r.sira + '</td>' + hr + '<td class="hdf">' + esc(r.hedef) + '</td><td class="ad">' + esc(sec.kompakt ? yzKisaAd(r.ad) : r.ad) + '</td>';
        for (let i = 0; i < f.seri; i++) {
            let v = r.seriT[i], cls = 's' + (i === aktif ? ' aktif' : '') + (v == null ? ' bos' : '');
            tr += sec.duzenle && (v != null || i <= aktif) ? '<td class="' + cls + ' tik" onclick="event.stopPropagation(); yzGirisAc(\'' + yzEnc(r.k) + '\',' + i + ')">' + (v == null ? '·' : v) + '</td>' : '<td class="' + cls + '">' + (v == null ? '·' : v) + '</td>';
            if (f.yari && i === f.yari - 1) tr += '<td class="yari">' + (r.y1 || '·') + '</td>';
        }
        if (f.yari) tr += '<td class="yari">' + (r.y2 || '·') + '</td>';
        return tr + '<td class="top">' + r.toplam + '</td>' + (sec.gelisim ? yzGelisimHucre(r, idx >= 3 && r.gelisim != null && r.gelisim === enIyi && enIyi > 0) : '') + yzTempoHucre(r, aktif < 0) + '<td class="on">' + r.on + '</td><td class="x">' + r.x + '</td></tr>';
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
    let bitir = function () { let son = yzGuncelle(function (x) { if (x.durum) { x.durum.asama = 'bitti'; x.durum.bitis = Date.now(); } x.sayac = null; }); yzArsivKaydet(son); yzCiz(); if (_yz.tv) yzTvCiz(); };
    if (zorla === true) return bitir();
    onayIste('Tur bitirilsin mi? Sonuçlar ekranı açılır (TV\'de de).', bitir, 'Turu bitir');
}
function yzMenu() {
    let o = yzOku(), d = o.durum; if (!d) return;
    let disari = yzRoster().filter(function (r) { return d.katilimci.indexOf(r.g + '|' + r.ad) === -1; });
    let html = '<div style="text-align:left"><b>Tur ayarları</b><div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">'
        + (disari.length ? '<div style="font-size:12px;color:var(--text-muted)">Tura sporcu ekle (kaçırdığı seriler boş kalır):</div><div style="display:flex;flex-wrap:wrap;gap:6px">' + disari.map(function (r) { return '<button class="yz-cip" onclick="yzSporcuEkle(\'' + yzEnc(r.g + '|' + r.ad) + '\')">+ ' + esc(r.ad) + '</button>'; }).join('') + '</div>' : '')
        + '<button class="yz-btn" onclick="yzHedeflerAc()">🎯 Kişisel hedef puanları</button>'
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
        yzGuncelle(function (o) { yzTurTemizle(o); o.durum = null; o.sayac = null; });
        yzCiz();
    }, 'İptal et');
}
function yzYeniTur() { yzGuncelle(function (o) { yzTurTemizle(o); o.durum = null; o.sayac = null; }); yzCiz(); }

// ---- ok girişi (tablet) — gövdede ayrı pencere: uzaktan gelen yeniden çizimler girişi bozmaz
function yzGirisAc(kEnc, seri) {
    let k = decodeURIComponent(kEnc), o = yzOku(), d = o.durum; if (!d) return;
    let mevcut = yzSkor(o, k)[seri];
    let mk = ((o[yzPKey(d.id, k)] || [])[seri]) || null;
    _yz.giris = { k: k, seri: seri, id: d.id, oklar: mevcut ? mevcut.slice() : [], konumlar: mevcut ? (mk && mk.length === mevcut.length ? mk.slice() : mevcut.map(function () { return null; })) : [], duzeltme: !!mevcut };
    yzGirisCiz();
}
function yzGirisCiz() {
    let g = _yz.giris, kap = document.getElementById('yz-giris');
    if (!g) { if (kap) kap.remove(); document.removeEventListener('keydown', yzGirisTus, true); return; }
    let o = yzOku(), d = o.durum; if (!d) { _yz.giris = null; return yzGirisCiz(); }
    let okSay = yzGirisOkSay(g, d), altSatir, topSatir, seriTop = yzTop(g.oklar);
    if (g.tip === 'set' || g.tip === 'shoot') {
        let m = yzElemeHesapla(o).maclar.find(function (x) { return x.id === g.macId; }) || {};
        altSatir = (g.tip === 'shoot' ? 'Shoot-off · tek ok' : g.setNo + 1 + '. set · 3 ok') + ' · ' + esc(m.turAd || '') + (g.duzeltme ? ' · <b style="color:var(--status-warning,#d97706)">düzeltme</b>' : '');
        topSatir = '<span>' + (g.tip === 'shoot' ? 'Ok' : 'Set') + ' <b>' + seriTop + '</b></span><span>Maç <b>' + (m.puanA != null ? m.puanA + ' – ' + m.puanB : '') + '</b></span>';
    } else {
        let r = yzSiralama(o).find(function (x) { return x.k === g.k; }) || { toplam: 0, sira: '-' };
        let onceki = yzSkor(o, g.k)[g.seri], digerToplam = r.toplam - (onceki ? yzTop(onceki) : 0);
        altSatir = (g.seri + 1) + '. seri' + (g.duzeltme ? ' · <b style="color:var(--status-warning,#d97706)">düzeltme</b>' : '') + ' · ' + okSay + ' ok';
        topSatir = '<span>Seri <b>' + seriTop + '</b></span><span>Toplam <b>' + (digerToplam + seriTop) + '</b></span>';
    }
    if (!kap) { kap = document.createElement('div'); kap.id = 'yz-giris'; kap.className = 'yz-giris-arka'; kap.addEventListener('click', function (e) { if (e.target === kap) yzGirisKapat(); }); document.body.appendChild(kap); document.addEventListener('keydown', yzGirisTus, true); }
    let slotlar = ''; for (let i = 0; i < okSay; i++) { let p = g.oklar[i]; slotlar += '<span class="yz-ok ' + (p ? yzOkRenk(p) : 'bos') + '">' + (p || '') + '</span>'; }
    let tus = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].map(function (p) { return '<button class="yz-tus ' + yzOkRenk(p) + '" onclick="yzOkEkle(\'' + p + '\')"' + (g.oklar.length >= okSay ? ' disabled' : '') + '>' + p + '</button>'; }).join('');
    let dolu = g.oklar.length >= okSay;
    kap.innerHTML = '<div class="yz-giris" role="dialog" aria-modal="true" aria-label="Skor girişi">'
        + '<div class="yz-giris-bas"><div><span class="yz-sp-hedef">' + esc(g.tip ? (g.taraf === 'a' ? 'A' : 'B') : ((d.hedefler || {})[g.k] || '')) + '</span> <b>' + esc(yzKAd(g.k)) + '</b><div class="yz-alt">' + altSatir + '</div></div><button class="yz-btn" onclick="yzGirisKapat()" aria-label="Kapat">✕</button></div>'
        + '<div class="yz-giris-mod"><button class="' + (yzGirisHedefMi() ? 'aktif' : '') + '" onclick="yzGirisModSec(\'hedef\')">🎯 Hedefe dokun</button><button class="' + (yzGirisHedefMi() ? '' : 'aktif') + '" onclick="yzGirisModSec(\'tus\')">🔢 Tuşlar</button></div>'
        + '<div class="yz-oklar">' + slotlar + '</div>'
        + '<div class="yz-giris-top">' + topSatir + '</div>'
        + (yzGirisHedefMi() ? yzHedefGirisHTML(g, d, okSay) : '<div class="yz-tuslar">' + tus + '</div>')
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
function yzGirisOkSay(g, d) { return g.tip === 'shoot' ? 1 : g.tip === 'set' ? 3 : yzFormat(d).ok; }
function yzOkEkle(p, konum) { let g = _yz.giris, d = yzOku().durum; if (!g || !d || g.oklar.length >= yzGirisOkSay(g, d)) return; g.konumlar = g.konumlar || []; while (g.konumlar.length < g.oklar.length) g.konumlar.push(null); g.oklar.push(p); g.konumlar.push(konum || null); yzGirisCiz(); }
function yzOkSil() { let g = _yz.giris; if (!g || !g.oklar.length) return; g.oklar.pop(); if (g.konumlar && g.konumlar.length > g.oklar.length) g.konumlar.length = g.oklar.length; yzGirisCiz(); }
function yzGirisKapat() { _yz.giris = null; yzGirisCiz(); }
function yzGirisKaydet() {
    let g = _yz.giris; if (!g) return;
    let o = yzOku(), d = o.durum;
    if (!d || d.id !== g.id) { yzGirisKapat(); return showToast('Tur değişmiş — giriş kaydedilmedi.', 'error'); }
    if (g.tip === 'set' || g.tip === 'shoot') return yzMacGirisKaydet(g, d);
    let f = yzFormat(d); if (g.oklar.length < f.ok) return;
    // Oklar büyükten küçüğe (WA) — hedefte işaretlenen konumlar okla BİRLİKTE sıralanır ki eşleşme bozulmasın
    let ciftler = g.oklar.map(function (p, i) { return { p: p, k: (g.konumlar || [])[i] || null }; }).sort(function (a, b) { return YZ_SIRA[b.p] - YZ_SIRA[a.p]; });
    let sirali = ciftler.map(function (c) { return c.p; }), konumlar = ciftler.map(function (c) { return c.k; }), konumVar = konumlar.some(function (c) { return c; });
    let onceVardi = false;
    yzGuncelle(function (x) {
        let a = yzSKey(g.id, g.k), arr = (x[a] || []).slice(); onceVardi = !!arr[g.seri]; while (arr.length < g.seri) arr.push(null); arr[g.seri] = sirali; x[a] = arr;
        let pk = yzPKey(g.id, g.k), parr = (x[pk] || []).slice(); if (konumVar || parr[g.seri]) { while (parr.length < g.seri) parr.push(null); parr[g.seri] = konumVar ? konumlar : null; x[pk] = parr; }
    });
    if (d.ayar.kayit && !onceVardi) yzGercekKaydet(g.k, g.oklar, d.ayar.mesafe);
    else if (onceVardi) showToast('Tablo düzeltildi (karnedeki kayıt değişmez).', 'warning');
    let k = g.k, seri = g.seri; _yz.giris = null; yzGirisCiz();
    let yeni = yzOku(); yzCiz(); if (_yz.tv) yzTvCiz();
    try { let r2 = yzSiralama(yeni).find(function (x) { return x.k === k; }), hd = yzHedefDurum(yeni, r2); if (hd && !onceVardi) showToast(hd.i + ' ' + hd.metin, hd.d === 'ulasti' || hd.d === 'rahat' || hd.d === 'yakin' ? 'success' : 'warning'); } catch (e) {}
    // Sıradaki: aynı seride, hedef sırasına göre bu sporcudan sonra gelen ilk girilmemiş sporcu
    if (_yz.siradaki && !onceVardi && yeni.durum && seri === Math.min(yeni.durum.seri, f.seri - 1)) {
        let sira = yzHedefSirasi(yeni), i = sira.indexOf(k), aday = sira.slice(i + 1).concat(sira.slice(0, i)).find(function (x) { return !yzSkor(yeni, x)[seri]; });
        if (aday) yzGirisAc(yzEnc(aday), seri);
        else showToast('✅ ' + (seri + 1) + '. seri tamamlandı', 'success');
    }
}
// Gerçek skor/karne kaydı — Yarışma/Oyunlar ile aynı çekirdek. Turda seri limiti sessizce uzatılır.
function yzGercekKaydet(k, oklar, mesafe, kaynak) {
    let i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1);
    let kaydedilecek = oklar.map(function (p) { return { puan: p, tarih: bugunISO(), mesafe: mesafe, kaynak: kaynak || 'yarisma-siralama' }; });
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
    if (d.asama === 'eleme' && s && s.faz === 'shoot') { let g2 = (Date.now() - s.basla) / 1000, k2 = s.sure - g2; return k2 <= 0 ? { faz: 'bitti', metin: '0', alt: 'SÜRE BİTTİ' } : { faz: k2 <= 10 ? 'son' : 'atis', metin: yzSaat(k2), alt: 'SHOOT-OFF' }; }
    if (!s || s.seri !== d.seri) return { faz: 'hazir', metin: yzSaat(yzSure(d)), alt: 'HAZIR' };
    let gecen = (Date.now() - s.basla) / 1000;
    if (gecen < s.hazir) return { faz: 'hazirlik', metin: yzSaat(s.hazir - gecen), alt: 'HATTA GEÇ' };
    let kalan = s.sure - (gecen - s.hazir);
    if (kalan <= 0) return { faz: 'bitti', metin: '0', alt: 'SÜRE BİTTİ' };
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
// Podyum: eleme oynandıysa eleme sıralaması (1-2 final, 3 bronz), yoksa sıralama turu toplamı.
function yzPodyumListe(o) {
    let el = o.eleme && o.eleme.id === o.durum.id ? yzElemeHesapla(o) : null, sira = yzSiralama(o), map = {};
    sira.forEach(function (r) { map[r.k] = r; });
    if (el && el.yerler.length) return { eleme: true, liste: el.yerler.slice(0, 3).map(function (y) { let r = map[y.k] || { toplam: 0, on: 0, ok: 0 }; return Object.assign({}, r, { k: y.k, ad: yzKAd(y.k), sira: y.yer, altMetin: y.metin }); }) };
    return { eleme: false, liste: sira.filter(function (r) { return r.toplam > 0; }).slice(0, 3).map(function (r) { return Object.assign({}, r, { altMetin: r.on + ' × 10+X · ' + (r.ok ? (r.toplam / r.ok).toFixed(2) : '0') + ' ort.' }); }) };
}
function yzPodyumHTML(o) {
    let p = yzPodyumListe(o), ilk3 = p.liste; if (!ilk3.length) return '';
    return '<div class="yz-podyum">' + [1, 0, 2].map(function (i) { let r = ilk3[i]; if (!r) return '<div class="yz-pod bos"></div>'; return '<div class="yz-pod p' + r.sira + '"><div class="yz-pod-madalya">' + (r.sira === 1 ? '🥇' : r.sira === 2 ? '🥈' : '🥉') + '</div><div class="yz-pod-ad">' + esc(r.ad) + '</div><div class="yz-pod-puan">' + (p.eleme ? r.sira + '.' : r.toplam) + '</div><div class="yz-alt">' + esc(r.altMetin || '') + '</div><div class="yz-pod-blok"></div></div>'; }).join('') + '</div>'
        + (p.eleme ? '<div class="yz-alt" style="text-align:center">Podyum eleme maçlarına göre · sıralama turu toplamları aşağıdaki tabloda</div>' : '');
}
function yzSonucHTML(o) {
    let d = o.durum, f = yzFormat(d), sira = yzSiralama(o), elemeVar = o.eleme && o.eleme.id === d.id;
    let n = d.katilimci.length, secenek = [4, 8, 16].filter(function (x) { return x <= n; });
    let varsayilan = secenek.length ? secenek[secenek.length - 1] : n;
    let elemeKart = elemeVar ? '<div class="yz-kart"><div class="yz-etiket">⚔️ Eleme maçları</div><div class="yz-cipler"><button class="yz-btn" onclick="yzElemeyeDon()">Eleme tablosunu aç</button></div></div>'
        : (n >= 2 ? '<div class="yz-kart"><div class="yz-etiket">⚔️ Eleme maçları <span class="yz-alt" style="text-transform:none;letter-spacing:0;font-weight:600">· set sistemi (3 ok/set, 6 puan alan kazanır, 5–5\'te shoot-off) · sıralamaya göre eşleşme (1–8, 2–7…)</span></div>'
            + '<div class="yz-cipler">' + secenek.concat(n > varsayilan ? [n] : []).map(function (x) { return '<button class="yz-cip' + (x === varsayilan ? ' aktif' : '') + '" onclick="yzElemeBaslat(' + x + ')">' + (x === n && secenek.indexOf(x) === -1 ? 'Tümü (' + x + ', bay ile)' : 'İlk ' + x) + '</button>'; }).join('') + '</div>'
            + '<div class="yz-alt">Seçince eleme hemen başlar. 4 ve üstünde bronz madalya maçı da oynanır.</div></div>' : '');
    return '<div class="yz">'
        + '<div class="yz-sayfa-bas"><div><div class="yz-ust-etiket">SIRALAMA TURU · ' + esc(d.ayar.mesafe) + ' · ' + f.kisa + '</div><div class="yz-baslik">🏁 Sonuçlar</div></div>'
        + '<div class="yz-tur-btn"><button class="yz-btn tv" onclick="yzTvAc()">📺 TV ekranı</button><button class="yz-btn" onclick="yzRaporAc()">📋 Sporcu raporları</button><button class="yz-btn" onclick="yzPdf()">📄 Sonuç PDF</button><button class="yz-btn ana" onclick="yzYeniTur()">🔁 Yeni tur</button></div></div>'
        + (elemeVar ? yzPodyumHTML(o) : yzGruplar(o, sira).map(function (gr) { return yzPodyumGrupHTML(gr); }).join(''))
        + elemeKart
        + '<div class="yz-kart yz-tablo-kart"><div class="yz-etiket">Sıralama turu' + yzGorunumKontrolHTML(o) + '</div><div class="yz-tablo-kap">' + yzGorunumHTML(o, sira, { duzenle: true }) + '</div></div>'
        + yzTeknikKartHTML(o, sira)
        + '<div class="yz-kart yz-tablo-kart"><div class="yz-etiket">🎯 Ok dağılımı <span class="yz-alt" style="text-transform:none;letter-spacing:0;font-weight:600">· her değerden kaç ok · koyu hücre = çok</span></div><div class="yz-tablo-kap">' + yzDagilimTabloHTML(o, sira) + '</div></div>'
        + '</div>';
}

// ---------------------------------------------------------------- 📺 TV skor tablosu (sadece okur)
function yzTvAc() {
    _yz.tv = true; yzSesHazirla(); document.body.classList.add('yz-tv-acik');
    let el = document.getElementById('yz-tv');
    if (!el) {
        el = document.createElement('div'); el.id = 'yz-tv'; el.className = 'yz-tv'; document.body.appendChild(el);
        // Tam ekran SAYFAYA verilir (TV kutusuna değil): tam ekran öğe tarayıcının en üst katmanına çıkar ve dışındaki
        // hiçbir pencere (skor girişi, süre seçimi) z-index ne olursa olsun üstüne çıkamaz — TV'den yönetim bozuluyordu.
        try { let kok = document.documentElement; if (kok.requestFullscreen && !document.fullscreenElement) kok.requestFullscreen().catch(function () {}); } catch (e) {}
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
    _yz.tv = false; document.body.classList.remove('yz-tv-acik'); clearInterval(_yz.tvPoll); _yz.tvPoll = null;
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
    if (d.asama === 'eleme') { el.innerHTML = yzTvElemeHTML(o); yzTimerBaslat(); return; }
    let f = yzFormat(d), sira = yzSiralama(o), seri = Math.min(d.seri, f.seri - 1), bitti = d.asama === 'bitti';
    // Yeni gelen seri skorlarını birkaç saniye vurgula
    let yeni = {}, simdi = Date.now();
    sira.forEach(function (r) { let imza = r.seriT.join(','), eski = _yz.tvSon[r.k]; if (eski && eski.imza !== imza) eski.zaman = simdi; if (!eski) _yz.tvSon[r.k] = { imza: imza, zaman: 0 }; else eski.imza = imza; if (_yz.tvSon[r.k].zaman && simdi - _yz.tvSon[r.k].zaman < 4000) yeni[r.k] = 1; });
    let bek = yzBekleyenler(o, seri).length;
    // Satır yüksekliği: tüm sporcular ekrana sığsın
    let gorN = yzGruplar(o, sira).length, n = Math.max(sira.length + (gorN - 1) * 1.6 + (yzGorunum().mod === 'gelisim' ? gorN * 0.8 : 0), 4), yuk = Math.max(28, Math.min(84, Math.floor((window.innerHeight * (bitti ? 0.6 : 0.74)) / (n + 1))));
    el.style.setProperty('--yz-satir', yuk + 'px');
    el.innerHTML = '<button class="yz-tv-kapat" onclick="yzTvKapat()">✕ Kapat</button>'
        + '<div class="yz-tv-bas">'
        + '<div class="yz-tv-kimlik"><div class="yz-tv-logo">DAĞ S.K.</div><div class="yz-tv-ad">' + (bitti ? 'SIRALAMA TURU · SONUÇLAR' : 'SIRALAMA TURU') + '</div><div class="yz-tv-alt">' + esc(d.ayar.mesafe) + ' · ' + f.ad + ' · ' + new Date(d.basla).toLocaleDateString('tr-TR') + '</div></div>'
        + '<div class="yz-tv-seri">' + (bitti ? '<span class="yz-tv-seri-et">TUR</span><b style="font-size:3.8vw;margin-top:.6vh">BİTTİ</b>' : '<span class="yz-tv-seri-et">SERİ</span><b>' + (seri + 1) + '</b><span class="yz-tv-seri-top">/ ' + f.seri + '</span>') + (!bitti ? '<div class="yz-tv-bek">' + (bek ? bek + ' skor bekleniyor' : '✓ seri tamam') + '</div>' : '') + '</div>'
        + (bitti ? '<div class="yz-tv-saat">' + yzGorunumKontrolHTML(o, true) + '</div>' : '<div class="yz-tv-saat">' + yzSayacHTML(o, 'yz-tv-sayac') + yzTvKontrolHTML(o) + '</div>')
        + '</div>'
        + (bitti ? yzTvPodyumHTML(o) : '')
        + '<div class="yz-tv-tablo">' + yzGorunumHTML(o, sira, { hareket: !bitti, yeni: yeni, tvGiris: !bitti, duzenle: true }) + '</div>'
        + yzTvDuyuruHTML(o, sira, yeni);
    clearTimeout(_yz.duyuruZ); if (el.querySelector('.yz-tv-duyuru')) _yz.duyuruZ = setTimeout(function () { let e2 = document.querySelector('.yz-tv-duyuru'); if (e2) e2.classList.add('gizle'); }, 9000);
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

// ================================================================================================
// EK (2026-09-30, kullanıcı: "sıralama turları için dediklerini yap"): 🎯 kişisel hedef + tempo · 📚 geçmiş
// turlar arşivi · 🎯 ok dağılımı · 📋 sporcu raporu (ekran/WhatsApp/PDF) · ⚔️ eleme maçları (+ TV).
// Eleme maç sonuçları maç başına AYRI anahtarda ('m_<turId>_<macId>'); kim kazandı / üst tura kim geçti
// hiç kaydedilmez, her seferinde maç verisinden HESAPLANIR (iki tablet farklı maçlara aynı anda girebilir).
// ================================================================================================
const YZ_DEGERLER = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
function yzHpKey(id) { return 'hp_' + id; }
function yzTurTemizle(o) { Object.keys(o).forEach(function (a) { if (/^(s|m|hp|p)_/.test(a)) delete o[a]; }); delete o.eleme; }
function yzPKey(id, k) { return 'p_' + id + '_' + k; }
function yzTarihTR(iso) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }

// ---------------------------------------------------------------- 🎯 kişisel hedef + tempo
// ---- 🎯 hedef istatistiği (2026-09-30, kullanıcı: "ortalamaya göre alternatif sun, zor/kolay tahmini olsun, hedefe
// yaklaştıysa ya da ne kadar kaldıysa bildirsin"). Beklenen tur toplamı = kendi ok ortalaması × ok sayısı; belirsizlik =
// karnedeki serilerin seriden seriye sapması × √seri. Tutma ihtimali normal dağılımla (yaklaşık) hesaplanır.
function yzNormalCdf(z) { let t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
function yzHedefIstat(o, k) {
    let d = o.durum, f = yzFormat(d), bk = yzBeklenenOrt(o, k); if (!bk) return null;
    let gi = k.indexOf('|'), sp = turnuvaDB[k.slice(0, gi)] && turnuvaDB[k.slice(0, gi)][k.slice(gi + 1)];
    let seriler = ((sp && sp.seriler) || []).filter(function (x) { return (x.t || 0) < d.basla && Array.isArray(x.oklar) && x.oklar.length >= 3; }).slice(-30).map(function (x) { return (x.puan || 0) / x.oklar.length * f.ok; });
    let sdSeri = 0; if (seriler.length >= 5) { let m = yzOrt(seriler); sdSeri = Math.sqrt(yzOrt(seriler.map(function (v) { return (v - m) * (v - m); }))); }
    sdSeri = Math.max(sdSeri, f.ok * 0.6); // az/tekdüze veride aşırı iyimser tahmin olmasın (6 ok → en az ~3.6 puan)
    let onc = yzOncekiler(k, d.ayar.format, d.ayar.mesafe, d.id);
    return { ort: bk.ort, kaynak: bk.kaynak, mean: bk.ort * f.seri * f.ok, sd: sdSeri * Math.sqrt(f.seri), sdSeri: sdSeri, rekor: onc.length ? Math.max.apply(null, onc.map(function (x) { return x.toplam; })) : null };
}
function yzHedefIhtimal(ist, hedef) { return 1 - yzNormalCdf((hedef - 0.5 - ist.mean) / ist.sd); }
function yzZorluk(p) { return p >= 0.7 ? { ad: 'Kolay', cls: 'kolay', i: '🟢' } : p >= 0.35 ? { ad: 'Gerçekçi', cls: 'orta', i: '🟡' } : p >= 0.12 ? { ad: 'İddialı', cls: 'zor', i: '🟠' } : { ad: 'Çok zor', cls: 'cokzor', i: '🔴' }; }
function yzHedefOneriler(ist, maks) {
    let r = function (v) { return Math.max(1, Math.min(maks, Math.round(v))); };
    let l = [{ ad: 'Kolay', i: '🟢', v: r(ist.mean - 0.85 * ist.sd) }, { ad: 'Gerçekçi', i: '🟡', v: r(ist.mean + 0.1 * ist.sd) }, { ad: 'İddialı', i: '🟠', v: r(ist.mean + 0.8 * ist.sd) }];
    if (ist.rekor && ist.rekor + 1 > l[1].v && ist.rekor + 1 !== l[2].v) l.push({ ad: 'Rekor', i: '🏆', v: r(ist.rekor + 1) });
    return l;
}
// Tur içinde hedef durumu — kalan puan, kalan seri, bugünkü form (geçmiş ortalamayla hafif harmanlanmış)
function yzHedefDurum(o, r) {
    if (!r || !r.hedefPuan) return null;
    let d = o.durum, f = yzFormat(d), kalan = r.hedefPuan - r.toplam, kalanSeri = f.seri - r.girilen, ad = yzKisaAd(r.ad);
    if (kalan <= 0) return { d: 'ulasti', i: '🎯', metin: ad + ' hedefine ulaştı! (' + r.toplam + '/' + r.hedefPuan + ')', p: 1 };
    if (kalanSeri <= 0) return { d: 'kacti', i: '·', metin: ad + ': hedefe ' + kalan + ' puan kala bitti', p: 0 };
    let ist = yzHedefIstat(o, r.k), ortSeri = r.girilen ? r.toplam / r.girilen : (ist ? ist.ort * f.ok : f.ok * 7);
    if (ist && r.girilen) ortSeri = (ortSeri * r.girilen + ist.ort * f.ok * 2) / (r.girilen + 2);
    let sdSeri = ist ? ist.sdSeri : f.ok * 0.6, gerekli = kalan / kalanSeri;
    let p = 1 - yzNormalCdf((kalan - 0.5 - ortSeri * kalanSeri) / (sdSeri * Math.sqrt(kalanSeri)));
    let g = Math.ceil(gerekli), o2 = Math.round(ortSeri);
    if (gerekli > f.ok * 10) return { d: 'imkansiz', i: '·', metin: ad + ': hedef bu turda yetişmez — her seriyi en iyi haline getir', p: 0 };
    if (kalan <= ortSeri) return { d: 'yakin', i: '🔥', metin: ad + ': hedefe sadece ' + kalan + ' puan! ' + (kalanSeri === 1 ? 'Son seri.' : kalanSeri + ' seri var.'), p: p };
    if (p >= 0.75) return { d: 'rahat', i: '✅', metin: ad + ': hedefe ' + kalan + ' kaldı · seri başı ' + g + ' yeter (ort. ' + o2 + ')', p: p };
    if (p >= 0.4) return { d: 'yolunda', i: '🟡', metin: ad + ': hedefe ' + kalan + ' kaldı · seri başı ' + g + ' lazım (ort. ' + o2 + ')', p: p };
    if (p >= 0.12) return { d: 'zorlasiyor', i: '⚠️', metin: ad + ': zorlaşıyor · seri başı ' + g + ' lazım (ort. ' + o2 + ')', p: p };
    return { d: 'cokzor', i: '🔴', metin: ad + ': hedef zor · seri başı ' + g + ' lazım (ort. ' + o2 + ')', p: p };
}
function yzTempoHucre(r, bitti) {
    if (bitti) {
        if (!r.hedefPuan) return '<td class="tmp bos">·</td>';
        let f = r.toplam - r.hedefPuan;
        return '<td class="tmp ' + (f >= 0 ? 'ust' : 'alt') + '" title="Hedef ' + r.hedefPuan + '">' + (f >= 0 ? '✓ +' + f : '−' + (-f)) + '<small>/' + r.hedefPuan + '</small></td>';
    }
    if (!r.hedefPuan) return r.tempo == null ? '<td class="tmp bos">·</td>' : '<td class="tmp" title="Bu tempoyla tahmini bitiş">' + r.tempo + '</td>';
    let hd = yzHedefDurum(yzOku(), r), cls = !hd ? '' : hd.p >= 0.4 ? ' ust' : hd.p >= 0.12 ? ' orta' : ' alt';
    return '<td class="tmp' + cls + '" title="' + esc(hd ? hd.metin : '') + '">' + (hd && hd.d !== 'yolunda' && hd.d !== 'kacti' && hd.d !== 'imkansiz' ? '<span class="tmp-i">' + hd.i + '</span>' : '') + (r.tempo == null ? '·' : r.tempo) + '<small>/' + r.hedefPuan + '</small></td>';
}
function yzHedeflerAc() {
    let o = yzOku(), d = o.durum; if (!d) return;
    let hp = o[yzHpKey(d.id)] || {}, f = yzFormat(d), maks = f.seri * f.ok * 10;
    _yz.hpIst = [];
    let satirlar = d.katilimci.map(function (k, i) {
        let ist = yzHedefIstat(o, k); _yz.hpIst[i] = ist;
        let bilgi = ist ? 'ort. ' + ist.ort.toFixed(2) + '/ok → beklenen ~' + Math.round(ist.mean) + ' (±' + Math.round(ist.sd) + ') · ' + esc(ist.kaynak) + (ist.rekor ? ' · rekor ' + ist.rekor : '') : 'geçmiş veri yok — tahmin yapılamıyor';
        let cipler = ist ? yzHedefOneriler(ist, maks).map(function (x) { return '<button type="button" class="yz-hp-cip" onclick="yzHedefSec(' + i + ',' + x.v + ')">' + x.i + ' ' + x.ad + ' <b>' + x.v + '</b></button>'; }).join('') : '';
        return '<div class="yz-hp-sat"><div class="yz-hp-ust"><span class="yz-hp-ad">' + esc(yzKAd(k)) + '<small>' + bilgi + '</small></span>'
            + '<span class="yz-hp-giris"><input type="number" inputmode="numeric" min="1" max="' + maks + '" id="yz-hp-' + i + '" data-en="' + (ist && ist.rekor ? ist.rekor : '') + '" data-ger="' + (ist ? yzHedefOneriler(ist, maks)[1].v : '') + '" value="' + (hp[k] || '') + '" placeholder="—" oninput="yzHedefZorlukGuncelle(' + i + ')"><span class="yz-hp-z" id="yz-hp-z-' + i + '"></span></span></div>'
            + (cipler ? '<div class="yz-hp-cipler">' + cipler + '</div>' : '') + '</div>';
    }).join('');
    onayIste('<div style="text-align:left"><b>🎯 Kişisel hedef puanları</b><div class="yz-alt" style="margin:4px 0 10px">Tur toplamı için hedef (' + f.seri * f.ok + ' ok, en fazla ' + maks + '). Öneriler ve tutma ihtimali çocuğun kendi geçmişinden hesaplanır. Tur boyunca hedefe ne kadar kaldığı bildirilir.</div>'
        + '<div class="yz-hp">' + satirlar + '</div><div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="yz-btn" onclick="yzHedefToplu(\'ger\')">🟡 Boşlara gerçekçi hedef</button><button class="yz-btn" onclick="yzHedefToplu(\'en\')">🏆 Boşlara kişisel rekor</button></div></div>', yzHedeflerKaydet, '💾 Hedefleri kaydet');
    d.katilimci.forEach(function (k, i) { yzHedefZorlukGuncelle(i); });
}
function yzHedefSec(i, v) { let el = document.getElementById('yz-hp-' + i); if (el) { el.value = v; yzHedefZorlukGuncelle(i); } }
function yzHedefToplu(tur) { document.querySelectorAll('.yz-hp input').forEach(function (el) { let v = tur === 'en' ? el.dataset.en : el.dataset.ger; if (v && !el.value) { el.value = v; let i = parseInt(el.id.replace('yz-hp-', ''), 10); yzHedefZorlukGuncelle(i); } }); }
function yzHedefZorlukGuncelle(i) {
    let el = document.getElementById('yz-hp-' + i), z = document.getElementById('yz-hp-z-' + i), ist = (_yz.hpIst || [])[i];
    if (!el || !z) return;
    let v = parseInt(el.value, 10);
    if (!v) { z.textContent = ''; z.className = 'yz-hp-z'; return; }
    if (!ist) { z.textContent = 'tahmin yok'; z.className = 'yz-hp-z'; return; }
    let p = yzHedefIhtimal(ist, v), zr = yzZorluk(p);
    z.textContent = zr.i + ' ' + zr.ad + ' · %' + Math.round(p * 100); z.className = 'yz-hp-z ' + zr.cls;
}
function yzHedeflerKaydet() {
    let d = yzOku().durum; if (!d) return;
    let f = yzFormat(d), maks = f.seri * f.ok * 10, yeni = {};
    d.katilimci.forEach(function (k, i) { let el = document.getElementById('yz-hp-' + i), v = el && parseInt(el.value, 10); if (v > 0 && v <= maks) yeni[k] = v; });
    yzGuncelle(function (o) { if (o.durum && o.durum.id === d.id) o[yzHpKey(d.id)] = yeni; });
    yzCiz(); if (_yz.tv) yzTvCiz(); showToast('🎯 ' + Object.keys(yeni).length + ' sporcunun hedefi kaydedildi', 'success');
}

// ---------------------------------------------------------------- 📚 geçmiş turlar (tüm cihazlar: /api/meta/yz_arsiv, id ile birleşir)
function yzArsivOku() { try { return JSON.parse(localStorage.getItem('dag_yz_arsiv') || '[]') || []; } catch (e) { return []; } }
function yzArsivBirlestir(a, b) {
    let m = {}; (a || []).concat(b || []).forEach(function (r) { if (r && r.id && (!m[r.id] || (r.g || 0) >= (m[r.id].g || 0))) m[r.id] = r; });
    return Object.values(m).sort(function (x, y) { return (x.t || 0) - (y.t || 0); }).slice(-80);
}
function yzArsivCek(sonra) {
    fetch('/api/meta/yz_arsiv').then(function (r) { return r.json(); }).then(function (d) {
        let uzak = []; try { uzak = d && d.value ? JSON.parse(d.value) : []; } catch (e) {}
        let once = JSON.stringify(yzArsivOku()), tum = yzArsivBirlestir(yzArsivOku(), uzak);
        try { localStorage.setItem('dag_yz_arsiv', JSON.stringify(tum)); } catch (e) {}
        if (JSON.stringify(tum) !== once && sonra) sonra();
    }).catch(function () {});
}
function yzArsivYaz(kayit) {
    try { localStorage.setItem('dag_yz_arsiv', JSON.stringify(yzArsivBirlestir(yzArsivOku(), [kayit]))); } catch (e) {}
    fetch('/api/meta/yz_arsiv').then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (d) {
        let uzak = []; try { uzak = d && d.value ? JSON.parse(d.value) : []; } catch (e) {}
        let tum = yzArsivBirlestir(uzak, yzArsivOku());
        try { localStorage.setItem('dag_yz_arsiv', JSON.stringify(tum)); } catch (e) {}
        return fetch('/api/meta/yz_arsiv', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: JSON.stringify(tum) }) });
    }).catch(function () {});
}
function yzArsivKaydet(o) {
    let d = o && o.durum; if (!d) return;
    let sira = yzSiralama(o), el = o.eleme && o.eleme.id === d.id ? yzElemeHesapla(o) : null;
    yzArsivYaz({ id: d.id, t: d.basla, g: Date.now(), tarih: bugunISO(new Date(d.basla)), mesafe: d.ayar.mesafe, format: d.ayar.format,
        sporcular: sira.map(function (r) { return { k: r.k, ad: r.ad, sira: r.sira, toplam: r.toplam, on: r.on, x: r.x, ok: r.ok, seriT: r.seriT, hp: r.hedefPuan, dag: yzDagilim(o, r.k), eleme: el ? yzElemeSonucu(el, r.k) : null }; }) });
}
// Aynı format + mesafedeki önceki turlar (eskiden yeniye)
function yzOncekiler(k, format, mesafe, haricId) {
    return yzArsivOku().filter(function (r) { return r.id !== haricId && r.format === format && r.mesafe === mesafe; }).map(function (r) {
        let s = (r.sporcular || []).find(function (x) { return x.k === k; });
        return s ? { id: r.id, tarih: r.tarih, t: r.t, toplam: s.toplam, sira: s.sira, kisi: r.sporcular.length, ok: s.ok } : null;
    }).filter(Boolean).sort(function (a, b) { return a.t - b.t; });
}
function yzArsivKartHTML() {
    if (!_yz.arsivCekildi) { _yz.arsivCekildi = true; yzArsivCek(function () { let d = yzOku().durum; if (_yz.mod === 'siralama' && (!d || !d.asama || d.asama === 'kurulum')) yzCiz(); }); }
    let l = yzArsivOku().slice(-8).reverse(); if (!l.length) return '';
    return '<div class="yz-kart"><div class="yz-etiket">📚 Geçmiş turlar</div><div class="yz-arsiv">' + l.map(function (r) {
        let ilk = (r.sporcular || []).slice(0, 3).map(function (s) { return esc(yzKisaAd(s.ad)) + ' ' + s.toplam; }).join(' · ');
        return '<button class="yz-arsiv-sat" onclick="yzArsivGoster(\'' + yzEnc(r.id) + '\')"><span class="yz-arsiv-t">' + yzTarihTR(r.tarih) + '</span><span class="yz-arsiv-f">' + esc(r.mesafe) + ' · ' + ((YZ_FORMAT[r.format] || {}).kisa || '') + ' · ' + (r.sporcular || []).length + ' sporcu</span><span class="yz-arsiv-i">' + ilk + '</span></button>';
    }).join('') + '</div></div>';
}
function yzArsivGoster(idEnc) {
    let id = decodeURIComponent(idEnc), r = yzArsivOku().find(function (x) { return x.id === id; }); if (!r) return;
    let satir = (r.sporcular || []).map(function (s) {
        return '<tr><td>' + s.sira + '</td><td style="text-align:left"><b>' + esc(s.ad) + '</b></td><td><b>' + s.toplam + '</b></td><td>' + s.on + '</td><td>' + s.x + '</td><td>' + (s.hp ? (s.toplam >= s.hp ? '✓ ' : '') + s.hp : '·') + '</td><td>' + (s.eleme ? esc(s.eleme) : '·') + '</td></tr>';
    }).join('');
    onayIste('<div style="text-align:left"><b>📚 ' + yzTarihTR(r.tarih) + ' · ' + esc(r.mesafe) + ' · ' + ((YZ_FORMAT[r.format] || {}).ad || '') + '</b><div class="yz-tablo-kap" style="margin-top:10px"><table class="yz-tablo"><thead><tr><th>#</th><th class="ad">SPORCU</th><th>TOPLAM</th><th>10+X</th><th>X</th><th>HEDEF</th><th>ELEME</th></tr></thead><tbody>' + satir + '</tbody></table></div></div>', null);
}

// ---------------------------------------------------------------- 🎯 ok dağılımı
function yzDagilim(o, k) { let c = {}; YZ_DEGERLER.forEach(function (p) { c[p] = 0; }); yzSkor(o, k).forEach(function (e) { (e || []).forEach(function (p) { c[p] = (c[p] || 0) + 1; }); }); return c; }
function yzDagilimTabloHTML(o, sira) {
    let bas = '<th class="sira">#</th><th class="ad">SPORCU</th>' + YZ_DEGERLER.map(function (p) { return '<th><span class="yz-dg-bas ' + yzOkRenk(p) + '">' + p + '</span></th>'; }).join('') + '<th>10+X %</th><th>9+ %</th>';
    let govde = sira.map(function (r) {
        let c = yzDagilim(o, r.k), top = r.ok || 1, maks = Math.max.apply(null, YZ_DEGERLER.map(function (p) { return c[p]; })) || 1;
        let hucre = YZ_DEGERLER.map(function (p) { return '<td class="yz-dg" style="--a:' + (c[p] ? (0.12 + 0.6 * c[p] / maks).toFixed(2) : 0) + '">' + (c[p] || '·') + '</td>'; }).join('');
        return '<tr><td class="sira">' + r.sira + '</td><td class="ad">' + esc(yzKisaAd(r.ad)) + '</td>' + hucre + '<td><b>' + (r.ok ? Math.round((c.X + c['10']) / top * 100) : 0) + '</b></td><td>' + (r.ok ? Math.round((c.X + c['10'] + c['9']) / top * 100) : 0) + '</td></tr>';
    }).join('');
    return '<table class="yz-tablo kompakt"><thead><tr>' + bas + '</tr></thead><tbody>' + govde + '</tbody></table>';
}

// ---------------------------------------------------------------- ⚔️ eleme maçları
function yzTohum(n) { if (n <= 1) return [1]; let o = yzTohum(n / 2), r = []; o.forEach(function (s) { r.push(s, n + 1 - s); }); return r; }
function yzMacKey(id, macId) { return 'm_' + id + '_' + macId; }
// Set sistemi: set başına 3 ok · seti kazanan 2, beraberlikte 1'er · 6 puana ulaşan kazanır · 5 set sonunda 5–5 → tek ok shoot-off
// (yüksek puan kazanır; eşitse X, 10'u yener; yine eşitse koç "merkeze daha yakın" olanı seçer).
function yzMacPuan(v) {
    let pa = 0, pb = 0, liste = [], tamamSay = 0;
    ((v && v.setler) || []).forEach(function (st) {
        st = st || {};
        let ta = st.a ? yzTop(st.a) : null, tb = st.b ? yzTop(st.b) : null, tamam = ta != null && tb != null, sayildi = false;
        if (tamam && pa < 6 && pb < 6 && tamamSay < 5) { tamamSay++; sayildi = true; if (ta > tb) pa += 2; else if (tb > ta) pb += 2; else { pa++; pb++; } }
        liste.push({ a: st.a || null, b: st.b || null, ta: ta, tb: tb, tamam: tamam, sayildi: sayildi });
    });
    let kaz = pa >= 6 ? 'a' : pb >= 6 ? 'b' : null, sh = (v && v.shoot) || null;
    let shootGerek = !kaz && pa === 5 && pb === 5 && tamamSay >= 5;
    if (shootGerek && sh && sh.a && sh.b) {
        let na = YZ_DEGER[sh.a[0]], nb = YZ_DEGER[sh.b[0]];
        if (na > nb) kaz = 'a'; else if (nb > na) kaz = 'b';
        else if ((sh.a[0] === 'X') !== (sh.b[0] === 'X')) kaz = sh.a[0] === 'X' ? 'a' : 'b';
        else if (sh.yakin) kaz = sh.yakin;
    }
    return { puanA: pa, puanB: pb, setler: liste, kazanan: kaz, shootGerek: shootGerek, shoot: sh, siradakiSet: liste.findIndex(function (s) { return !s.tamam; }) === -1 ? liste.length : liste.findIndex(function (s) { return !s.tamam; }) };
}
function yzMacOlustur(o, e, id, tur, i, a, b, turAd, hazir) {
    let v = o[yzMacKey(e.id, id)] || null, m = { id: id, tur: tur, i: i, a: a, b: b, turAd: turAd, hazir: hazir, puanA: 0, puanB: 0, setler: [], siradakiSet: 0 };
    if (hazir && a && !b) { m.kazanan = 'a'; m.bay = true; }
    else if (hazir && b && !a) { m.kazanan = 'b'; m.bay = true; }
    else if (hazir && !a && !b) m.bos = true;
    else if (a && b) Object.assign(m, yzMacPuan(v));
    m.kazananK = m.kazanan === 'a' ? a : m.kazanan === 'b' ? b : null;
    m.kaybedenK = m.kazanan && a && b ? (m.kazanan === 'a' ? b : a) : null;
    m.bitti = !!m.kazanan || !!m.bos;
    m.oynanabilir = !!(hazir && a && b && !m.kazanan);
    m.suruyor = m.oynanabilir && !!(v && ((v.setler && v.setler.some(function (s) { return s && (s.a || s.b); })) || v.shoot));
    return m;
}
function yzElemeHesapla(o) {
    let e = o.eleme, d = o.durum;
    if (!e || !d || e.id !== d.id) return { maclar: [], turlar: [], yerler: [], bitti: false, seedOf: {} };
    let N = e.tohumlar.length, n = 1; while (n < N) n *= 2;
    let turSay = Math.max(1, Math.log2(n)), toh = yzTohum(n), maclar = [], seedOf = {};
    e.tohumlar.forEach(function (k, i) { seedOf[k] = i + 1; });
    let turAd = function (t) { let kalan = n / Math.pow(2, t); return kalan === 2 ? 'Final' : kalan === 4 ? 'Yarı Final' : kalan === 8 ? 'Çeyrek Final' : '1/' + (kalan / 2) + ' Final'; };
    let bul = function (t, i) { return maclar.find(function (m) { return m.tur === t && m.i === i && m.id !== 'bronz'; }); };
    for (let t = 0; t < turSay; t++) {
        let adet = n / Math.pow(2, t + 1);
        for (let i = 0; i < adet; i++) {
            let a, b, hazir;
            if (t === 0) { a = e.tohumlar[toh[2 * i] - 1] || null; b = e.tohumlar[toh[2 * i + 1] - 1] || null; hazir = true; }
            else { let m1 = bul(t - 1, 2 * i), m2 = bul(t - 1, 2 * i + 1); a = m1.kazananK; b = m2.kazananK; hazir = m1.bitti && m2.bitti; }
            maclar.push(yzMacOlustur(o, e, 't' + t + 'm' + i, t, i, a, b, turAd(t), hazir));
        }
    }
    let fin = bul(turSay - 1, 0), br = null;
    if (e.bronz && turSay >= 2) {
        let y1 = bul(turSay - 2, 0), y2 = bul(turSay - 2, 1);
        br = yzMacOlustur(o, e, 'bronz', turSay - 1, 1, y1.kaybedenK, y2.kaybedenK, 'Bronz Madalya', y1.bitti && y2.bitti);
        maclar.push(br);
    }
    let yerler = [];
    if (fin && fin.kazananK) { yerler.push({ k: fin.kazananK, yer: 1, metin: 'Şampiyon' }); if (fin.kaybedenK) yerler.push({ k: fin.kaybedenK, yer: 2, metin: 'Finalist' }); }
    if (br && br.kazananK) { yerler.push({ k: br.kazananK, yer: 3, metin: 'Bronz madalya' }); if (br.kaybedenK) yerler.push({ k: br.kaybedenK, yer: 4, metin: '4.' }); }
    else if (!br && turSay >= 2 && fin && fin.bitti) { [bul(turSay - 2, 0), bul(turSay - 2, 1)].forEach(function (m) { if (m && m.kaybedenK) yerler.push({ k: m.kaybedenK, yer: 3, metin: 'Yarı finalist' }); }); }
    return { maclar: maclar, turlar: Array.from({ length: turSay }, function (_, t) { return turAd(t); }), yerler: yerler, bitti: !!(fin && fin.bitti) && (!br || br.bitti), seedOf: seedOf, n: n };
}
// Sporcunun eleme sonucu (rapor/arşiv için tek satır)
function yzElemeSonucu(el, k) {
    let y = el.yerler.find(function (x) { return x.k === k; }); if (y) return y.metin;
    let son = null; el.maclar.forEach(function (m) { if (m.id !== 'bronz' && (m.a === k || m.b === k)) son = m; });
    if (!son) return el.seedOf[k] ? null : 'Elemeye kalamadı';
    if (son.kaybedenK === k) return son.turAd + '\'de elendi';
    return son.bitti ? son.turAd + ' kazandı' : son.turAd + ' (sürüyor)';
}
function yzElemeBaslat(sayi) {
    let o = yzOku(), d = o.durum; if (!d) return;
    let sira = yzSiralama(o).map(function (r) { return r.k; }).slice(0, sayi);
    if (sira.length < 2) return showToast('Eleme için en az 2 sporcu gerekli.', 'error');
    yzGuncelle(function (x) {
        Object.keys(x).forEach(function (a) { if (a.indexOf('m_') === 0) delete x[a]; });
        x.eleme = { id: d.id, tohumlar: sira, bronz: sira.length >= 4, t: Date.now() };
        x.durum.asama = 'eleme'; x.sayac = null; if (!x.durum.ayar.setSure) x.durum.ayar.setSure = 120;
    });
    _yz.aktifMac = null; yzCiz(); if (_yz.tv) yzTvCiz();
    showToast('⚔️ Eleme başladı — ' + sira.length + ' sporcu', 'success');
}
function yzElemeyeDon() { yzGuncelle(function (x) { if (x.durum) x.durum.asama = 'eleme'; x.sayac = null; }); yzCiz(); if (_yz.tv) yzTvCiz(); }
function yzSiralamayaDon(bitir) {
    let son = yzGuncelle(function (x) { if (x.durum) x.durum.asama = 'bitti'; x.sayac = null; });
    let m = document.getElementById('onay-modal'); if (m) m.style.display = 'none';
    if (bitir) yzArsivKaydet(son);
    yzCiz(); if (_yz.tv) yzTvCiz();
}
function yzElemeIptal() {
    onayIste('Eleme maçları silinsin mi? Sıralama turu sonuçları kalır.', function () {
        yzGuncelle(function (x) { Object.keys(x).forEach(function (a) { if (a.indexOf('m_') === 0) delete x[a]; }); delete x.eleme; if (x.durum) x.durum.asama = 'bitti'; x.sayac = null; });
        yzCiz(); if (_yz.tv) yzTvCiz();
    }, 'Elemeyi sil');
}
function yzElemeMenu() {
    onayIste('<div style="text-align:left"><b>Eleme ayarları</b><div style="display:flex;flex-direction:column;gap:8px;margin-top:10px">'
        + '<button class="yz-btn" onclick="yzSiralamayaDon()">📊 Sıralama turu sonuçlarına dön</button>'
        + '<button class="yz-btn" onclick="yzSesDegis()">' + (_yz.ses ? '🔔 Düdük sesleri açık (bu cihaz)' : '🔕 Düdük sesleri kapalı (bu cihaz)') + '</button>'
        + '<button class="yz-btn tehlike" onclick="document.getElementById(\'onay-modal\').style.display=\'none\'; yzElemeIptal()">🗑 Elemeyi sil</button></div></div>', null);
}
function yzMacSec(id) { _yz.aktifMac = id; yzCiz(); let p = document.querySelector('.yz-mac'); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function yzMacBul(o, macId) { return yzElemeHesapla(o).maclar.find(function (x) { return x.id === macId; }); }
function yzMacSetGir(macId, taraf, setNo) {
    let o = yzOku(), d = o.durum, m = yzMacBul(o, macId); if (!d || !m || !m[taraf]) return;
    let st = (m.setler || [])[setNo] || {}, mevcut = st[taraf];
    _yz.giris = { tip: 'set', macId: macId, taraf: taraf, setNo: setNo, id: d.id, k: m[taraf], oklar: mevcut ? mevcut.slice() : [], duzeltme: !!mevcut };
    yzGirisCiz();
}
function yzMacShootGir(macId, taraf) {
    let o = yzOku(), d = o.durum, m = yzMacBul(o, macId); if (!d || !m || !m[taraf]) return;
    let mevcut = m.shoot && m.shoot[taraf];
    _yz.giris = { tip: 'shoot', macId: macId, taraf: taraf, id: d.id, k: m[taraf], oklar: mevcut ? mevcut.slice() : [], duzeltme: !!mevcut };
    yzGirisCiz();
}
function yzMacGirisKaydet(g, d) {
    if (g.oklar.length < yzGirisOkSay(g, d)) return;
    let sirali = g.oklar.slice().sort(function (a, b) { return YZ_SIRA[b] - YZ_SIRA[a]; }), onceVardi = false;
    yzGuncelle(function (x) {
        let a = yzMacKey(g.id, g.macId), v = JSON.parse(JSON.stringify(x[a] || {}));
        if (g.tip === 'set') { v.setler = v.setler || []; while (v.setler.length <= g.setNo) v.setler.push({}); v.setler[g.setNo] = v.setler[g.setNo] || {}; onceVardi = !!v.setler[g.setNo][g.taraf]; v.setler[g.setNo][g.taraf] = sirali; }
        else { v.shoot = v.shoot || {}; onceVardi = !!v.shoot[g.taraf]; v.shoot[g.taraf] = sirali; delete v.shoot.yakin; }
        x[a] = v;
    });
    if (g.tip === 'set' && d.ayar.kayit && !onceVardi) yzGercekKaydet(g.k, g.oklar, d.ayar.mesafe, 'yarisma-eleme');
    let macId = g.macId, taraf = g.taraf, setNo = g.setNo, tip = g.tip;
    _yz.giris = null; yzGirisCiz();
    yzCiz(); if (_yz.tv) yzTvCiz();
    let m = yzMacBul(yzOku(), macId); if (!m) return;
    if (m.kazanan) { showToast('🏆 ' + yzKAd(m.kazananK) + ' maçı kazandı (' + m.puanA + '–' + m.puanB + ')', 'success'); return; }
    if (!_yz.siradaki || onceVardi) return;
    let diger = taraf === 'a' ? 'b' : 'a';
    if (tip === 'set') { let st = (m.setler || [])[setNo] || {}; if (!st[diger]) yzMacSetGir(macId, diger, setNo); }
    else if (!(m.shoot && m.shoot[diger])) yzMacShootGir(macId, diger);
}
function yzMacYakin(macId, taraf) {
    let d = yzOku().durum; if (!d) return;
    yzGuncelle(function (x) { let a = yzMacKey(d.id, macId), v = x[a] || {}; v.shoot = v.shoot || {}; v.shoot.yakin = taraf; x[a] = v; });
    yzCiz(); if (_yz.tv) yzTvCiz();
}
function yzMacSifirla(macId) {
    onayIste('Bu maçın girilmiş tüm setleri silinsin mi? (karneye işlenmiş oklar karnede kalır)', function () {
        let d = yzOku().durum; if (!d) return;
        yzGuncelle(function (x) { delete x[yzMacKey(d.id, macId)]; }); yzCiz(); if (_yz.tv) yzTvCiz();
    }, 'Sil');
}
function yzShootSayac() { yzSesHazirla(); let d = yzOku().durum; if (!d) return; yzGuncelle(function (o) { o.sayac = { basla: Date.now(), hazir: 0, sure: 40, seri: d.seri, faz: 'shoot' }; }); yzCiz(); }
function yzSporcuEtiket(el, k, kisa) { return k ? '<span class="yz-seed">' + (el.seedOf[k] || '') + '</span>' + esc(kisa ? yzKisaAd(yzKAd(k)) : yzKAd(k)) : '<span class="yz-alt">—</span>'; }
function yzMacPanelHTML(o, m, el) {
    let setSay = Math.max(5, m.setler.length), aktifSet = m.siradakiSet;
    let hucre = function (t, i) {
        let st = m.setler[i], v = st ? (t === 'a' ? st.ta : st.tb) : null, diger = st ? (t === 'a' ? st.tb : st.ta) : null;
        let cls = 'yz-mac-s' + (v != null && diger != null ? (v > diger ? ' kaz' : v < diger ? ' kay' : ' ber') : '') + (i === aktifSet && !m.kazanan ? ' aktif' : '');
        let tik = v != null || (i <= aktifSet && !m.kazanan && !m.shootGerek);
        return '<td class="' + cls + (tik ? ' tik' : '') + '"' + (tik ? ' onclick="yzMacSetGir(\'' + m.id + '\',\'' + t + '\',' + i + ')"' : '') + '>' + (v != null ? v : '·') + '</td>';
    };
    let shootH = function (t) { let sh = m.shoot && m.shoot[t]; return '<td class="yz-mac-s so' + (sh ? '' : ' bos') + (m.shootGerek && !m.kazanan ? ' tik' : '') + '"' + (m.shootGerek ? ' onclick="yzMacShootGir(\'' + m.id + '\',\'' + t + '\')"' : '') + '>' + (sh ? sh[0] : (m.shootGerek ? '?' : '·')) + '</td>'; };
    let satir = function (t) {
        let k = m[t], hucreler = ''; for (let i = 0; i < setSay; i++) hucreler += hucre(t, i);
        return '<tr class="' + (m.kazanan === t ? 'kazanan' : m.kazanan ? 'kaybeden' : '') + '"><td class="yz-mac-ad">' + yzSporcuEtiket(el, k) + '</td>' + hucreler + shootH(t) + '<td class="yz-mac-p">' + (t === 'a' ? m.puanA : m.puanB) + '</td></tr>';
    };
    let bas = '<th></th>'; for (let i = 0; i < setSay; i++) bas += '<th>SET ' + (i + 1) + '</th>'; bas += '<th>SO</th><th>PUAN</th>';
    let aksiyon;
    if (m.kazanan) {
        let sonraki = el.maclar.find(function (x) { return x.oynanabilir && x.id !== m.id; });
        aksiyon = '<div class="yz-mac-sonuc">🏆 <b>' + esc(yzKAd(m.kazananK)) + '</b> kazandı · ' + m.puanA + '–' + m.puanB + '</div>' + (sonraki ? '<button class="yz-btn ana buyuk" onclick="yzMacSec(\'' + sonraki.id + '\')">▶ Sıradaki maç: ' + esc(sonraki.turAd) + '</button>' : '');
    } else if (m.shootGerek) {
        let sh = m.shoot || {}, esit = sh.a && sh.b && !m.kazanan;
        aksiyon = '<div class="yz-bilgi">🎯 5–5 — <b>shoot-off</b>: iki sporcu da tek ok atar, yüksek puan kazanır. <button class="yz-btn" onclick="yzShootSayac()">⏱ 40 sn başlat</button></div>'
            + '<div class="yz-mac-btnler">' + ['a', 'b'].map(function (t) { return '<button class="yz-btn' + (sh[t] ? '' : ' ana') + ' buyuk" onclick="yzMacShootGir(\'' + m.id + '\',\'' + t + '\')">' + esc(yzKisaAd(yzKAd(m[t]))) + ' — shoot-off oku' + (sh[t] ? ' ✓' : '') + '</button>'; }).join('') + '</div>'
            + (esit ? '<div class="yz-bilgi">Oklar eşit (' + sh.a[0] + ') — merkeze hangisi daha yakın?<div class="yz-mac-btnler">' + ['a', 'b'].map(function (t) { return '<button class="yz-btn ana" onclick="yzMacYakin(\'' + m.id + '\',\'' + t + '\')">' + esc(yzKisaAd(yzKAd(m[t]))) + '</button>'; }).join('') + '</div></div>' : '');
    } else {
        let st = m.setler[aktifSet] || {};
        aksiyon = '<div class="yz-mac-btnler">' + ['a', 'b'].map(function (t) { return '<button class="yz-btn' + (st[t] ? '' : ' ana') + ' buyuk" onclick="yzMacSetGir(\'' + m.id + '\',\'' + t + '\',' + aktifSet + ')">' + esc(yzKisaAd(yzKAd(m[t]))) + ' — ' + (aktifSet + 1) + '. set' + (st[t] ? ' ✓' : '') + '</button>'; }).join('') + '</div>';
    }
    return '<div class="yz-kart yz-mac"><div class="yz-mac-bas"><div class="yz-ust-etiket">' + esc(m.turAd).toLocaleUpperCase('tr-TR') + '</div><button class="yz-link" onclick="yzMacSifirla(\'' + m.id + '\')">Maçı sıfırla</button></div>'
        + '<div class="yz-mac-skor"><div class="yz-mac-taraf' + (m.kazanan === 'a' ? ' kaz' : '') + '">' + yzSporcuEtiket(el, m.a) + '</div><div class="yz-mac-puan"><b>' + m.puanA + '</b><span>–</span><b>' + m.puanB + '</b></div><div class="yz-mac-taraf sag' + (m.kazanan === 'b' ? ' kaz' : '') + '">' + yzSporcuEtiket(el, m.b) + '</div></div>'
        + '<div class="yz-tablo-kap"><table class="yz-mac-tablo"><thead><tr>' + bas + '</tr></thead><tbody>' + satir('a') + satir('b') + '</tbody></table></div>'
        + aksiyon + '</div>';
}
function yzBracketHTML(el, sec) {
    sec = sec || {};
    let kolonlar = el.turlar.map(function (ad, t) {
        let maclar = el.maclar.filter(function (m) { return m.tur === t && m.id !== 'bronz'; });
        if (t === el.turlar.length - 1) maclar = maclar.concat(el.maclar.filter(function (m) { return m.id === 'bronz'; }));
        return '<div class="yz-br-kol"><div class="yz-br-tur">' + esc(ad) + '</div><div class="yz-br-maclar">' + maclar.map(function (m) {
            let sat = function (t) { let k = m[t]; return '<div class="yz-bm-s' + (m.kazanan === t ? ' kaz' : m.kazanan && !m.bay ? ' kay' : '') + '"><span class="yz-bm-ad">' + (k ? yzSporcuEtiket(el, k, true) : (m.hazir && m.tur === 0 ? '<span class="yz-alt">BAY</span>' : '<span class="yz-alt">…</span>')) + '</span><b>' + (m.bay || m.bos || !m.a || !m.b ? '' : (t === 'a' ? m.puanA : m.puanB)) + '</b></div>'; };
            let cls = 'yz-bm' + (m.id === 'bronz' ? ' bronz' : '') + (m.suruyor ? ' suruyor' : '') + (m.oynanabilir ? ' oyn' : '') + (m.id === _yz.aktifMac && !sec.tv ? ' aktif' : '') + (m.bitti ? ' bitti' : '');
            return '<div class="' + cls + '"' + (!sec.tv && (m.oynanabilir || (m.a && m.b)) ? ' onclick="yzMacSec(\'' + m.id + '\')"' : '') + '>' + (m.id === 'bronz' ? '<div class="yz-bm-et">🥉 Bronz</div>' : '') + sat('a') + sat('b') + '</div>';
        }).join('') + '</div></div>';
    }).join('');
    return '<div class="yz-bracket">' + kolonlar + '</div>';
}
function yzElemeHTML(o) {
    let d = o.durum, el = yzElemeHesapla(o);
    let gecerli = el.maclar.find(function (m) { return m.id === _yz.aktifMac && m.a && m.b; });
    if (!gecerli) { let s = el.maclar.find(function (m) { return m.suruyor; }) || el.maclar.find(function (m) { return m.oynanabilir; }); _yz.aktifMac = s ? s.id : null; }
    let m = _yz.aktifMac ? el.maclar.find(function (x) { return x.id === _yz.aktifMac; }) : null;
    let bitis = el.bitti ? '<div class="yz-kart yz-eleme-bitti"><div class="yz-baslik">🏆 Eleme tamamlandı</div>' + el.yerler.map(function (y) { return '<div>' + (y.yer === 1 ? '🥇' : y.yer === 2 ? '🥈' : y.yer === 3 ? '🥉' : '4.') + ' <b>' + esc(yzKAd(y.k)) + '</b> <span class="yz-alt">' + esc(y.metin) + '</span></div>'; }).join('') + '<button class="yz-btn ana buyuk" onclick="yzSiralamayaDon(true)">🏁 Sonuçlara geç (podyum + raporlar)</button></div>' : '';
    return '<div class="yz">'
        + '<div class="yz-tur-bas">'
        + '<div class="yz-tur-bilgi"><div class="yz-ust-etiket">ELEME MAÇLARI · ' + esc(d.ayar.mesafe) + ' · SET SİSTEMİ</div><div class="yz-seri-no" style="font-size:24px;font-weight:900;color:var(--text-main)">' + (m ? esc(m.turAd) : el.bitti ? 'Tamamlandı' : 'Eleme') + '</div></div>'
        + '<div class="yz-sayac-kap">' + yzSayacHTML(o, 'yz-sayac') + '<div class="yz-sayac-btn">' + (o.sayac ? '<button class="yz-btn" onclick="yzSayacDurdur()">⏹ Sıfırla</button>' : '<button class="yz-btn yesil" onclick="yzSayacBaslat()">▶ Set süresi</button>') + '<button class="yz-btn" onclick="yzSureMenu()" title="Set süresini değiştir">⏱ ' + yzSure(d) + ' sn</button></div></div>'
        + '<div class="yz-tur-btn"><button class="yz-btn tv" onclick="yzTvAc()">📺 TV ekranı</button><button class="yz-btn" onclick="yzElemeMenu()" aria-label="Diğer">⋯</button></div>'
        + '</div>'
        + bitis
        + (m ? yzMacPanelHTML(o, m, el) : '')
        + '<div class="yz-kart"><div class="yz-etiket">Eleme tablosu <span class="yz-alt" style="text-transform:none;letter-spacing:0;font-weight:600">· maça dokun → aç · aynı anda birden çok maç oynanabilir</span></div><div class="yz-tablo-kap">' + yzBracketHTML(el) + '</div></div>'
        + '</div>';
}
// 📺 TV — eleme
function yzTvPodyumHTML(o) {
    let p = yzPodyumListe(o); if (!p.liste.length) return '';
    // Eleme yoksa yay filtresine uy: "Ayrı" → Klasik ve Makaralı için ayrı podyum şeridi
    if (!p.eleme) {
        let gruplar = yzGruplar(o, yzSiralama(o));
        if (gruplar.length > 1 || gruplar[0].ad) return gruplar.map(function (gr) {
            let ilk3 = gr.liste.filter(function (r) { return r.toplam > 0; }).slice(0, 3);
            return '<div class="yz-tv-podyum"><div class="yz-tv-pod"><span class="a" style="color:#fbbf24">' + (gr.ad === 'Makaralı' ? '⚙️' : '🏹') + ' ' + esc(gr.ad || '') + '</span></div>' + ilk3.map(function (r) { return '<div class="yz-tv-pod p' + r.sira + '"><span class="m">' + (r.sira === 1 ? '🥇' : r.sira === 2 ? '🥈' : '🥉') + '</span><span class="a">' + esc(r.ad) + '</span><span class="p">' + r.toplam + '</span></div>'; }).join('') + '</div>';
        }).join('');
    }
    return '<div class="yz-tv-podyum">' + p.liste.map(function (r) { return '<div class="yz-tv-pod p' + r.sira + '"><span class="m">' + (r.sira === 1 ? '🥇' : r.sira === 2 ? '🥈' : '🥉') + '</span><span class="a">' + esc(r.ad) + '</span><span class="p">' + (p.eleme ? esc(r.altMetin) : r.toplam) + '</span></div>'; }).join('') + '</div>';
}
function yzTvElemeHTML(o) {
    let d = o.durum, el = yzElemeHesapla(o);
    let canli = el.maclar.filter(function (m) { return m.suruyor; });
    if (!canli.length) canli = el.maclar.filter(function (m) { return m.oynanabilir; }).slice(0, 2);
    canli = canli.slice(0, 3);
    let macKart = function (m) {
        let setler = ''; for (let i = 0; i < Math.max(5, m.setler.length); i++) { let s = m.setler[i]; setler += '<span class="' + (s && s.tamam ? (s.ta > s.tb ? 'a' : s.tb > s.ta ? 'b' : 'e') : '') + '">' + (s && s.ta != null ? s.ta : '·') + '<i>' + (s && s.tb != null ? s.tb : '·') + '</i></span>'; }
        return '<div class="yz-tv-mac"><div class="yz-tv-mac-tur">' + esc(m.turAd) + (m.shootGerek ? ' · SHOOT-OFF' : '') + '</div>'
            + '<div class="yz-tv-mac-sat tv-tik' + (m.kazanan === 'a' ? ' kaz' : '') + '" onclick="yzTvMacGir(\'' + m.id + '\',\'a\')" title="Skor gir"><span class="ad">' + yzSporcuEtiket(el, m.a) + '</span><b>' + m.puanA + '</b></div>'
            + '<div class="yz-tv-mac-sat tv-tik' + (m.kazanan === 'b' ? ' kaz' : '') + '" onclick="yzTvMacGir(\'' + m.id + '\',\'b\')" title="Skor gir"><span class="ad">' + yzSporcuEtiket(el, m.b) + '</span><b>' + m.puanB + '</b></div>'
            + '<div class="yz-tv-mac-setler">' + setler + '</div></div>';
    };
    return '<button class="yz-tv-kapat" onclick="yzTvKapat()">✕ Kapat</button>'
        + '<div class="yz-tv-bas"><div class="yz-tv-kimlik"><div class="yz-tv-logo">DAĞ S.K.</div><div class="yz-tv-ad">ELEME MAÇLARI</div><div class="yz-tv-alt">' + esc(d.ayar.mesafe) + ' · set sistemi · 6 puan alan kazanır</div></div>'
        + '<div class="yz-tv-seri"><span class="yz-tv-seri-et">' + (el.bitti ? 'ELEME' : 'CANLI') + '</span><b style="font-size:3vw">' + (el.bitti ? 'BİTTİ' : canli.length ? esc(canli[0].turAd) : '—') + '</b></div>'
        + (el.bitti ? '' : '<div class="yz-tv-saat">' + yzSayacHTML(o, 'yz-tv-sayac') + yzTvKontrolHTML(o, el) + '</div>') + '</div>'
        + (el.bitti ? yzTvPodyumHTML(Object.assign({}, o, { durum: Object.assign({}, d, { asama: 'bitti' }) })) : '')
        + '<div class="yz-tv-eleme">' + (canli.length && !el.bitti ? '<div class="yz-tv-canli">' + canli.map(macKart).join('') + '</div>' : '') + '<div class="yz-tv-br">' + yzBracketHTML(el, { tv: true }) + '</div></div>';
}

// ---------------------------------------------------------------- 📋 sporcu raporu
function yzRaporVeri(o, k) {
    let d = o.durum, f = yzFormat(d), sira = yzSiralama(o), r = sira.find(function (x) { return x.k === k; }); if (!r) return null;
    let dolu = r.seriT.map(function (v, i) { return { v: v, i: i }; }).filter(function (x) { return x.v != null; });
    let en = dolu.slice().sort(function (a, b) { return b.v - a.v; })[0], kotu = dolu.slice().sort(function (a, b) { return a.v - b.v; })[0];
    if (!en || en.v === kotu.v) { en = null; kotu = null; } // tüm seriler eşitse en iyi/en zayıf yok
    let onc = yzOncekiler(k, d.ayar.format, d.ayar.mesafe, d.id), son = onc[onc.length - 1] || null, rekor = onc.length ? Math.max.apply(null, onc.map(function (x) { return x.toplam; })) : null;
    let el = o.eleme && o.eleme.id === d.id ? yzElemeHesapla(o) : null;
    let yorgun = yzYorgunluk(o, r), ov = yzOneriVeri(o, r, yorgun);
    return { nokta: ov.nokta, grp: ov.gr, oneri: ov.on, yorgun: yorgun, r: r, f: f, d: d, kisi: sira.length, dag: yzDagilim(o, k), en: en, kotu: kotu, ort: r.ok ? r.toplam / r.ok : 0, seriOrt: dolu.length ? r.toplam / dolu.length : 0, onc: onc, son: son, rekor: rekor, pb: rekor != null && r.toplam > rekor && r.girilen === f.seri, eleme: el ? yzElemeSonucu(el, k) : null };
}
function yzRaporMetin(o, k) {
    let v = yzRaporVeri(o, k); if (!v) return '';
    let r = v.r, s = [];
    s.push('🏹 DAĞ S.K. — Sıralama Turu Raporu');
    s.push('👤 ' + r.ad + ' · ' + yzTarihTR(bugunISO(new Date(v.d.basla))) + ' · ' + v.d.ayar.mesafe + ' · ' + v.f.ad);
    s.push('');
    s.push('🏅 Sıralama: ' + r.sira + '. / ' + v.kisi + ' sporcu');
    s.push('🎯 Toplam: ' + r.toplam + ' (' + r.ok + ' ok · ok ortalaması ' + v.ort.toFixed(2) + ')');
    s.push('⭐ 10+X: ' + r.on + ' · X: ' + r.x);
    if (v.f.yari) s.push('↔️ 1. yarı ' + r.y1 + ' · 2. yarı ' + r.y2 + ' (' + (r.y2 - r.y1 >= 0 ? '+' : '') + (r.y2 - r.y1) + ')');
    if (v.en) s.push('📈 En iyi seri: ' + (v.en.i + 1) + '. seri ' + v.en.v + ' · en zayıf: ' + (v.kotu.i + 1) + '. seri ' + v.kotu.v);
    if (r.hedefPuan) s.push('🎯 Hedef ' + r.hedefPuan + ': ' + (r.toplam >= r.hedefPuan ? '✅ ulaşıldı (+' + (r.toplam - r.hedefPuan) + ')' : '❌ ' + (r.hedefPuan - r.toplam) + ' puan kaldı'));
    if (v.son) s.push('📊 Önceki tur (' + yzTarihTR(v.son.tarih) + '): ' + v.son.toplam + ' → bugün ' + r.toplam + ' (' + (r.toplam - v.son.toplam >= 0 ? '+' : '') + (r.toplam - v.son.toplam) + ')');
    if (v.pb) s.push('🔥 KİŞİSEL REKOR! (önceki en iyi ' + v.rekor + ')');
    if (v.eleme) s.push('⚔️ Eleme: ' + v.eleme);
    if (r.gelisim != null) s.push('📈 Kendi ortalamasına göre: ' + (r.gelisim >= 0 ? '+' : '') + r.gelisim + ' puan');
    if (v.oneri) s.push('🎯 ' + v.oneri.kisa + ' → ' + v.oneri.oneri);
    if (v.yorgun && v.yorgun.durum !== 'az') s.push('📉 Tur içi: ' + v.yorgun.baslik + (v.yorgun.ozet ? ' — ' + v.yorgun.ozet : ''));
    s.push('');
    s.push('Ok dağılımı: ' + YZ_DEGERLER.filter(function (p) { return v.dag[p]; }).map(function (p) { return p + '×' + v.dag[p]; }).join('  '));
    return s.join('\n');
}
function yzRaporAc(kEnc) {
    let o = yzOku(), d = o.durum; if (!d) return;
    if (!_yz.raporArsivCek) { _yz.raporArsivCek = true; yzArsivCek(function () { if (document.getElementById('yz-rapor')) yzRaporAc(kEnc); }); }
    let kap = document.getElementById('yz-rapor');
    if (!kap) { kap = document.createElement('div'); kap.id = 'yz-rapor'; kap.className = 'yz-giris-arka'; kap.addEventListener('click', function (e) { if (e.target === kap) kap.remove(); }); document.body.appendChild(kap); }
    let sira = yzSiralama(o), k = kEnc ? decodeURIComponent(kEnc) : null;
    let liste = '<div class="yz-rapor-liste">' + sira.map(function (r) { return '<button class="yz-rapor-kisi' + (r.k === k ? ' aktif' : '') + '" onclick="yzRaporAc(\'' + yzEnc(r.k) + '\')"><span>' + r.sira + '.</span>' + esc(yzKisaAd(r.ad)) + '<b>' + r.toplam + '</b></button>'; }).join('') + '</div>';
    let icerik = k ? yzRaporDetayHTML(o, k) : '<div class="yz-alt" style="padding:20px;text-align:center">Raporunu görmek istediğin sporcuyu seç.</div>';
    kap.innerHTML = '<div class="yz-giris yz-rapor" role="dialog" aria-modal="true" aria-label="Sporcu raporu"><div class="yz-giris-bas"><div><b>📋 Sporcu raporları</b><div class="yz-alt">' + esc(d.ayar.mesafe) + ' · ' + yzFormat(d).ad + '</div></div><div style="display:flex;gap:6px"><button class="yz-btn" onclick="yzRaporPdf()">📄 Tüm raporlar PDF</button><button class="yz-btn" onclick="document.getElementById(\'yz-rapor\').remove()" aria-label="Kapat">✕</button></div></div>' + liste + icerik + '</div>';
}
function yzRaporDetayHTML(o, k) {
    let v = yzRaporVeri(o, k); if (!v) return '';
    let r = v.r, f = v.f, maks = Math.max.apply(null, r.seriT.filter(function (x) { return x != null; }).concat([f.ok * 10 * 0.6]));
    let W = 560, H = 150, bw = W / f.seri, taban = f.ok * 10 * 0.5;
    let cubuk = r.seriT.map(function (x, i) {
        if (x == null) return '';
        let h = Math.max(4, (x - taban) / (f.ok * 10 - taban) * (H - 24)), y = H - h, renk = v.en && i === v.en.i ? '#22c55e' : v.kotu && i === v.kotu.i ? '#ef4444' : '#0ea5e9';
        return '<rect x="' + (i * bw + 4) + '" y="' + y + '" width="' + (bw - 8) + '" height="' + h + '" rx="3" fill="' + renk + '"/><text x="' + (i * bw + bw / 2) + '" y="' + (y - 4) + '" text-anchor="middle" font-size="11" font-weight="800" fill="currentColor">' + x + '</text>';
    }).join('');
    let ortY = H - Math.max(4, (v.seriOrt - taban) / (f.ok * 10 - taban) * (H - 24));
    let grafik = '<svg viewBox="0 0 ' + W + ' ' + (H + 16) + '" class="yz-rapor-grafik" role="img" aria-label="Seri toplamları">' + cubuk
        + (v.seriOrt ? '<line x1="0" x2="' + W + '" y1="' + ortY + '" y2="' + ortY + '" stroke="#f59e0b" stroke-dasharray="5 4"/><text x="2" y="' + (ortY + 11) + '" text-anchor="start" font-size="10" font-weight="800" fill="#f59e0b">ort.' + v.seriOrt.toFixed(1) + '</text>' : '')
        + r.seriT.map(function (x, i) { return '<text x="' + (i * bw + bw / 2) + '" y="' + (H + 13) + '" text-anchor="middle" font-size="10" fill="currentColor" opacity=".6">' + (i + 1) + '</text>'; }).join('') + '</svg>';
    let dagMaks = Math.max.apply(null, YZ_DEGERLER.map(function (p) { return v.dag[p]; })) || 1;
    let dag = '<div class="yz-rapor-dag">' + YZ_DEGERLER.map(function (p) { return '<div class="yz-rd"><span class="yz-dg-bas ' + yzOkRenk(p) + '">' + p + '</span><i style="width:' + (v.dag[p] / dagMaks * 100) + '%"></i><b>' + (v.dag[p] || '') + '</b></div>'; }).join('') + '</div>';
    let gecmis = v.onc.length ? '<div class="yz-rapor-gecmis">' + v.onc.slice(-5).map(function (x) { return '<span><small>' + yzTarihTR(x.tarih) + '</small><b>' + x.toplam + '</b><small>' + x.sira + './' + x.kisi + '</small></span>'; }).join('') + '<span class="bugun"><small>bugün</small><b>' + r.toplam + '</b><small>' + r.sira + './' + v.kisi + '</small></span></div>' : '<div class="yz-alt">Bu format ve mesafede önceki tur yok — bir sonraki turda kıyas burada görünecek.</div>';
    let kutu = function (et, deger, alt, cls) { return '<div class="yz-rk' + (cls ? ' ' + cls : '') + '"><small>' + et + '</small><b>' + deger + '</b>' + (alt ? '<small>' + alt + '</small>' : '') + '</div>'; };
    return '<div class="yz-rapor-detay">'
        + '<div class="yz-rapor-ad">' + esc(r.ad) + (v.pb ? ' <span class="yz-pb">🔥 KİŞİSEL REKOR</span>' : '') + '</div>'
        + '<div class="yz-rapor-kutular">' + kutu('SIRA', r.sira + '.', v.kisi + ' sporcu') + kutu('TOPLAM', r.toplam, r.ok + ' ok') + kutu('OK ORT.', v.ort.toFixed(2), '') + kutu('10+X', r.on, 'X: ' + r.x)
        + (r.hedefPuan ? kutu('HEDEF', r.hedefPuan, r.toplam >= r.hedefPuan ? '✓ +' + (r.toplam - r.hedefPuan) : '−' + (r.hedefPuan - r.toplam), r.toplam >= r.hedefPuan ? 'ust' : 'alt') : '')
        + (v.son ? kutu('ÖNCEKİ TUR', v.son.toplam, (r.toplam - v.son.toplam >= 0 ? '+' : '') + (r.toplam - v.son.toplam), r.toplam >= v.son.toplam ? 'ust' : 'alt') : '')
        + (v.eleme ? kutu('ELEME', '⚔️', esc(v.eleme)) : '')
        + (r.gelisim != null ? kutu('GELİŞİM', (r.gelisim >= 0 ? '+' : '') + r.gelisim, 'kendi ort.', r.gelisim >= 0 ? 'ust' : 'alt') : '') + '</div>'
        + '<div class="yz-etiket">Seri seri</div>' + grafik
        + (f.yari ? '<div class="yz-alt">1. yarı <b>' + r.y1 + '</b> · 2. yarı <b>' + r.y2 + '</b> (' + (r.y2 - r.y1 >= 0 ? '+' : '') + (r.y2 - r.y1) + ')' + (v.en ? ' · en iyi ' + (v.en.i + 1) + '. seri (' + v.en.v + ') · en zayıf ' + (v.kotu.i + 1) + '. seri (' + v.kotu.v + ')' : '') + '</div>' : '')
        + '<div class="yz-etiket">📉 Tur içi dayanıklılık</div><div class="yz-yorgun ' + v.yorgun.durum + '"><b>' + esc(v.yorgun.baslik) + '</b>' + (v.yorgun.ozet ? ' · ' + esc(v.yorgun.ozet) : '') + '<div class="yz-alt">' + esc(v.yorgun.detay) + '</div></div>'
        + '<div class="yz-etiket">🎯 Grup analizi</div>' + (v.grp ? '<div class="yz-rapor-grup">' + yzGrupSVG(v.nokta, v.grp, yzYuz(v.d), 160) + '<div><b>' + esc(v.oneri.kisa) + '</b> · grup çapı ~' + v.oneri.cap + ' cm (' + v.oneri.sik + ')<div class="yz-tek-oneri" style="margin-top:6px">🎯 ' + esc(v.oneri.oneri) + '</div>' + (v.oneri.not ? '<div class="yz-alt">ℹ️ ' + esc(v.oneri.not) + '</div>' : '') + (v.oneri.uyari ? '<div class="yz-alt">' + esc(v.oneri.uyari) + '</div>' : '') + '</div></div>' : '<div class="yz-alt">Oklar tuşla girildi — grup analizi için girişte <b>🎯 Hedefe dokun</b> modunu kullan.</div>')
        + '<div class="yz-etiket">Ok dağılımı</div>' + dag
        + '<div class="yz-etiket">Gelişim (aynı format, ' + esc(v.d.ayar.mesafe) + ')</div>' + gecmis
        + '<div class="yz-mac-btnler"><button class="yz-btn" onclick="yzRaporKopyala(\'' + yzEnc(k) + '\')">📋 Metni kopyala</button><button class="yz-btn yesil" onclick="yzRaporWhatsapp(\'' + yzEnc(k) + '\')">💬 Veliye WhatsApp</button></div>'
        + '</div>';
}
function yzRaporKopyala(kEnc) {
    let metin = yzRaporMetin(yzOku(), decodeURIComponent(kEnc));
    let bitti = function () { showToast('📋 Rapor metni kopyalandı', 'success'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(metin).then(bitti).catch(function () { yzKopyaYedek(metin); bitti(); }); else { yzKopyaYedek(metin); bitti(); }
}
function yzKopyaYedek(metin) { let t = document.createElement('textarea'); t.value = metin; t.style.cssText = 'position:fixed;left:-9999px'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); }
function yzRaporWhatsapp(kEnc) {
    let k = decodeURIComponent(kEnc), i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)] && turnuvaDB[k.slice(0, i)][k.slice(i + 1)];
    let tel = String((sp && (sp.acilTelefon || sp.veli2Telefon)) || '').replace(/\D/g, '');
    if (tel.length === 10 && tel[0] === '5') tel = '90' + tel; else if (tel.length === 11 && tel[0] === '0') tel = '9' + tel;
    let url = 'https://api.whatsapp.com/send?' + (tel.length >= 11 ? 'phone=' + tel + '&' : '') + 'text=' + encodeURIComponent(yzRaporMetin(yzOku(), k));
    if (tel.length < 11) showToast('Veli telefonu kayıtlı değil — WhatsApp\'ta kişiyi sen seç.', 'warning');
    window.open(url, '_blank');
}
// 📄 tüm sporcular, sporcu başına bir sayfa (native jsPDF)
function yzRaporPdf() {
    let o = yzOku(), d = o.durum; if (!d) return;
    showToast('PDF hazırlanıyor...', 'warning');
    let sira = yzSiralama(o), T = _trTranslit;
    let renk = { X: [253, 224, 71], '10': [253, 224, 71], '9': [253, 224, 71], '8': [239, 68, 68], '7': [239, 68, 68], '6': [14, 165, 233], '5': [14, 165, 233], '4': [17, 24, 39], '3': [17, 24, 39], '2': [226, 232, 240], '1': [226, 232, 240], M: [100, 116, 139] };
    _yeniPdfAl().then(function (pdf) {
        let W = 210, mx = 16, uw = W - mx * 2;
        sira.forEach(function (sr, si) {
            if (si > 0) { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, 210, 297, 'F'); }
            let v = yzRaporVeri(o, sr.k), r = v.r, f = v.f, y = _kurumsalBaslikCiz(pdf, mx, uw, 12, 'SPORCU RAPORU', 'Siralama turu  |  ' + d.ayar.mesafe + '  |  ' + f.ad + '  |  ' + new Date(d.basla).toLocaleDateString('tr-TR'));
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(9, 22, 43); pdf.text(T(r.ad), mx, y + 4);
            if (v.pb) { pdf.setFontSize(9); pdf.setTextColor(194, 65, 12); pdf.text(T('KISISEL REKOR'), W - mx, y + 4, { align: 'right' }); }
            y += 10;
            let kutular = [['SIRA', r.sira + '.', v.kisi + ' sporcu'], ['TOPLAM', String(r.toplam), r.ok + ' ok'], ['OK ORT.', v.ort.toFixed(2), ''], ['10+X', String(r.on), 'X: ' + r.x]];
            if (r.hedefPuan) kutular.push(['HEDEF', String(r.hedefPuan), r.toplam >= r.hedefPuan ? 'ulasildi +' + (r.toplam - r.hedefPuan) : (r.hedefPuan - r.toplam) + ' eksik']);
            if (v.son) kutular.push(['ONCEKI TUR', String(v.son.toplam), (r.toplam - v.son.toplam >= 0 ? '+' : '') + (r.toplam - v.son.toplam)]);
            if (r.gelisim != null) kutular.push(['GELISIM', (r.gelisim >= 0 ? '+' : '') + r.gelisim, 'kendi ort.']);
            let kw = (uw - (kutular.length - 1) * 3) / kutular.length;
            kutular.forEach(function (k, i) {
                let x = mx + i * (kw + 3); pdf.setFillColor(241, 245, 249); pdf.roundedRect(x, y, kw, 19, 2, 2, 'F');
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(100, 116, 139); pdf.text(T(k[0]), x + kw / 2, y + 5, { align: 'center' });
                pdf.setFontSize(14); pdf.setTextColor(9, 22, 43); pdf.text(T(k[1]), x + kw / 2, y + 12, { align: 'center' });
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(100, 116, 139); pdf.text(T(k[2]), x + kw / 2, y + 16.5, { align: 'center' });
            });
            y += 27;
            // seri grafiği
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(9, 22, 43); pdf.text(T('Seri seri toplamlar'), mx, y); y += 4;
            let gh = 52, taban = f.ok * 10 * 0.5, bw = uw / f.seri;
            pdf.setDrawColor(226, 232, 240); pdf.setLineWidth(0.2); pdf.line(mx, y + gh, mx + uw, y + gh);
            r.seriT.forEach(function (x, i) {
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(148, 163, 184); pdf.text(String(i + 1), mx + i * bw + bw / 2, y + gh + 4, { align: 'center' });
                if (x == null) return;
                let h = Math.max(1.5, (x - taban) / (f.ok * 10 - taban) * (gh - 8)), c = v.en && i === v.en.i ? [34, 197, 94] : v.kotu && i === v.kotu.i ? [239, 68, 68] : [14, 165, 233];
                pdf.setFillColor(c[0], c[1], c[2]); pdf.rect(mx + i * bw + 1.5, y + gh - h, bw - 3, h, 'F');
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(30, 41, 59); pdf.text(String(x), mx + i * bw + bw / 2, y + gh - h - 1.5, { align: 'center' });
            });
            y += gh + 10;
            if (f.yari) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(51, 65, 85); pdf.text(T('1. yari ' + r.y1 + '   |   2. yari ' + r.y2 + ' (' + (r.y2 - r.y1 >= 0 ? '+' : '') + (r.y2 - r.y1) + ')' + (v.en ? '   |   en iyi seri ' + (v.en.i + 1) + '. (' + v.en.v + ')   |   en zayif ' + (v.kotu.i + 1) + '. (' + v.kotu.v + ')' : '')), mx, y); y += 8; }
            // ok dağılımı
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(9, 22, 43); pdf.text(T('Ok dagilimi'), mx, y); y += 3;
            let dm = Math.max.apply(null, YZ_DEGERLER.map(function (p) { return v.dag[p]; })) || 1;
            YZ_DEGERLER.forEach(function (p) {
                let c = renk[p]; pdf.setFillColor(c[0], c[1], c[2]); pdf.circle(mx + 3, y + 3.2, 2.6, 'F');
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(p === '4' || p === '3' || p === 'M' || p === '8' || p === '7' || p === '6' || p === '5' ? 255 : 17, p === '4' || p === '3' || p === 'M' || p === '8' || p === '7' || p === '6' || p === '5' ? 255 : 17, p === '4' || p === '3' || p === 'M' || p === '8' || p === '7' || p === '6' || p === '5' ? 255 : 17); pdf.text(p, mx + 3, y + 4.2, { align: 'center' });
                if (v.dag[p]) { pdf.setFillColor(203, 213, 225); pdf.rect(mx + 8, y + 1.5, (uw - 30) * v.dag[p] / dm, 3.4, 'F'); }
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(51, 65, 85); pdf.text(String(v.dag[p] || 0), mx + 10 + (uw - 30) * v.dag[p] / dm, y + 4.3);
                y += 6.2;
            });
            y += 4;
            // gelişim
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(9, 22, 43); pdf.text(T('Gelisim (ayni format ve mesafe)'), mx, y); y += 5;
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(51, 65, 85);
            if (v.onc.length) { pdf.text(T(v.onc.slice(-5).map(function (x) { return yzTarihTR(x.tarih) + ': ' + x.toplam; }).join('   >   ') + '   >   bugun: ' + r.toplam), mx, y); }
            else pdf.text(T('Onceki tur yok - bir sonraki turda kiyas burada gorunecek.'), mx, y);
            y += 7;
            if (v.eleme) { pdf.text(T('Eleme: ' + v.eleme), mx, y); y += 7; }
            if (v.yorgun && v.yorgun.durum !== 'az') { pdf.setFont('helvetica', 'bold'); pdf.text(T('Tur ici: ' + v.yorgun.baslik + (v.yorgun.ozet ? ' - ' + v.yorgun.ozet : '')), mx, y); pdf.setFont('helvetica', 'normal'); y += 5; pdf.text(pdf.splitTextToSize(T(v.yorgun.detay), uw), mx, y); y += 8; }
            if (v.oneri) { pdf.setFont('helvetica', 'bold'); pdf.text(T('Grup: ' + v.oneri.kisa + ' (cap ~' + v.oneri.cap + ' cm, ' + v.oneri.sik + ')'), mx, y); pdf.setFont('helvetica', 'normal'); y += 5; pdf.text(T('Nisangah: ' + v.oneri.oneri), mx, y); y += 7; }
            pdf.setDrawColor(203, 213, 225); pdf.setLineWidth(0.3);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(9, 22, 43); pdf.text(T('Antrenor notu'), mx, y + 4);
            for (let i = 0; i < 3; i++) pdf.line(mx, y + 12 + i * 8, mx + uw, y + 12 + i * 8);
        });
        _kurumsalAltBilgiCiz(pdf, 210, 297);
        pdf.save('Sporcu_Raporlari_' + d.ayar.mesafe + '_' + bugunISO().replace(/-/g, '') + '.pdf');
        showToast('PDF indirildi! 📄', 'success');
    }).catch(function (e) { console.error(e); showToast('PDF oluşturulamadı.', 'error'); });
}
function yzEkCssYukle() {
    if (document.getElementById('yz-ek-css')) return;
    let st = document.createElement('style'); st.id = 'yz-ek-css';
    st.textContent = [
        // TV'den yönetim: giriş/onay pencereleri TV'nin ÜSTÜNDE açılsın
        '.yz-giris-arka{z-index:32000!important}body.yz-tv-acik #onay-modal{z-index:32500!important}',
        '.yz-tv-saat{display:flex;flex-direction:column;gap:.8vh;align-items:stretch}',
        '.yz-tv-kontrol{display:flex;gap:.5vw;flex-wrap:wrap;justify-content:center;max-width:26vw}',
        '.yz-tv-k{border:1px solid #29425f;background:#0f1d33;color:#e8eef7;border-radius:.7vw;padding:.7vh .9vw;font:inherit;font-size:max(12px,.85vw);font-weight:800;cursor:pointer;white-space:nowrap}.yz-tv-k:hover{border-color:#fbbf24}.yz-tv-k.yesil{background:#15803d;border-color:#16a34a}.yz-tv-k.ana{background:#b45309;border-color:#f59e0b;color:#fff}',
        '.yz-tv .yz-tablo tr.tv-tik{cursor:pointer}.yz-tv .yz-tablo tr.tv-tik:hover td{background:rgba(251,191,36,.08)}.yz-tv .yz-tablo td.tik:hover{outline:2px solid #fbbf24}',
        '.yz-tv-mac-sat.tv-tik{cursor:pointer;border-radius:.6vw;padding:0 .4vw}.yz-tv-mac-sat.tv-tik:hover{background:rgba(251,191,36,.08)}',
        '.yz-ipucu{font-size:12.5px;color:var(--text-muted);padding:8px 12px;border-radius:12px;border:1px dashed var(--border-color)}',
        '.yz-tablo .tmp{font-weight:800;color:var(--text-muted)}.yz-tablo .tmp small{font-size:.7em;opacity:.7;margin-left:2px}.yz-tablo .tmp.ust{color:#22c55e}.yz-tablo .tmp.alt{color:#ef4444}',
        '.yz-tv .yz-tablo .tmp{font-size:.95em}.yz-tv .yz-tablo th.tmp{color:#7d93b2}',
        '.yz-hp{display:flex;flex-direction:column;gap:6px;max-height:50vh;overflow:auto}.yz-hp-sat{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 0;border-bottom:1px solid var(--border-color)}.yz-hp-sat span{display:flex;flex-direction:column;font-weight:800;font-size:13px}.yz-hp-sat small{font-weight:600;color:var(--text-muted);font-size:11px}.yz-hp-sat input{width:90px;min-height:40px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;font-weight:800;text-align:center;appearance:auto!important}',
        '.yz-arsiv{display:flex;flex-direction:column;gap:6px}.yz-arsiv-sat{display:grid;grid-template-columns:90px 180px 1fr;gap:10px;align-items:center;text-align:left;padding:10px 12px;border-radius:12px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;font-size:12.5px;cursor:pointer}.yz-arsiv-t{font-weight:900}.yz-arsiv-f{color:var(--text-muted)}.yz-arsiv-i{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '@media (max-width:640px){.yz-arsiv-sat{grid-template-columns:1fr}}',
        '.yz-dg{background:rgba(245,158,11,var(--a,0));font-weight:700}.yz-dg-bas{display:inline-flex;min-width:22px;height:22px;border-radius:50%;align-items:center;justify-content:center;font-size:10.5px;font-weight:900}',
        '.yz-mac{gap:12px}.yz-mac-bas{display:flex;justify-content:space-between;align-items:center}',
        '.yz-mac-skor{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:center}.yz-mac-taraf{font-size:17px;font-weight:900}.yz-mac-taraf.sag{text-align:right}.yz-mac-taraf.kaz{color:#22c55e}',
        '.yz-mac-puan{display:flex;gap:10px;align-items:center;font-variant-numeric:tabular-nums}.yz-mac-puan b{font-size:46px;line-height:1;font-weight:900}.yz-mac-puan span{font-size:28px;color:var(--text-muted)}',
        '.yz-seed{display:inline-flex;align-items:center;justify-content:center;min-width:20px;height:20px;padding:0 4px;border-radius:6px;background:var(--border-color);color:var(--text-muted);font-size:10.5px;font-weight:900;margin-right:6px;vertical-align:middle}',
        '.yz-mac-tablo{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}.yz-mac-tablo th{font-size:10.5px;color:var(--text-muted);font-weight:800;letter-spacing:.06em;padding:6px 4px}.yz-mac-tablo td{padding:8px 4px;text-align:center;border-top:1px solid var(--border-color)}',
        '.yz-mac-ad{text-align:left!important;font-weight:800;white-space:nowrap}.yz-mac-s{font-size:17px;font-weight:800;border-radius:8px}.yz-mac-s.kaz{color:#22c55e}.yz-mac-s.kay{color:var(--text-muted)}.yz-mac-s.ber{color:#f59e0b}.yz-mac-s.aktif{background:color-mix(in srgb,var(--accent-orange) 14%,transparent)}.yz-mac-s.tik{cursor:pointer}.yz-mac-s.so{color:#a855f7}.yz-mac-s.so.bos{color:var(--border-color)}',
        '.yz-mac-p{font-size:24px;font-weight:900}.yz-mac-tablo tr.kazanan .yz-mac-ad{color:#22c55e}.yz-mac-tablo tr.kaybeden{opacity:.55}',
        '.yz-mac-btnler{display:flex;gap:8px;flex-wrap:wrap}.yz-mac-btnler .yz-btn{flex:1;min-width:200px}.yz-mac-sonuc{font-size:16px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,#22c55e 12%,transparent)}',
        '.yz-bracket{display:flex;gap:16px;min-width:min-content}.yz-br-kol{display:flex;flex-direction:column;gap:8px;min-width:190px}.yz-br-tur{font-size:10.5px;font-weight:900;letter-spacing:.1em;color:var(--text-muted);text-transform:uppercase;text-align:center}',
        '.yz-br-maclar{display:flex;flex-direction:column;justify-content:space-around;gap:10px;flex:1}',
        '.yz-bm{border:1px solid var(--border-color);border-radius:12px;background:var(--bg-main);overflow:hidden}.yz-bm.oyn{cursor:pointer;border-color:color-mix(in srgb,var(--accent-orange) 60%,transparent)}.yz-bm.aktif{box-shadow:0 0 0 2px var(--accent-orange)}.yz-bm.suruyor{border-color:#22c55e;box-shadow:0 0 0 1px #22c55e}',
        '.yz-bm.bronz{border-style:dashed}.yz-bm-et{font-size:10px;font-weight:900;color:#c2410c;padding:4px 8px 0}',
        '.yz-bm-s{display:flex;justify-content:space-between;gap:8px;padding:7px 9px;font-size:12.5px;font-weight:700}.yz-bm-s+.yz-bm-s{border-top:1px solid var(--border-color)}.yz-bm-s b{font-variant-numeric:tabular-nums}.yz-bm-s.kaz{color:#22c55e;font-weight:900}.yz-bm-s.kay{opacity:.5}.yz-bm-ad{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.yz-eleme-bitti{gap:6px;font-size:15px}',
        // rapor
        '.yz-rapor{width:min(820px,100%)!important;max-height:94vh}',
        '.yz-rapor-liste{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px}.yz-rapor-kisi{flex:0 0 auto;display:flex;gap:6px;align-items:center;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);border-radius:999px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}.yz-rapor-kisi span{color:var(--text-muted)}.yz-rapor-kisi.aktif{border-color:var(--accent-orange);box-shadow:0 0 0 1px var(--accent-orange)}',
        '.yz-rapor-detay{display:flex;flex-direction:column;gap:10px}.yz-rapor-ad{font-size:22px;font-weight:900}.yz-pb{font-size:12px;background:#c2410c;color:#fff;border-radius:999px;padding:3px 10px;vertical-align:middle}',
        '.yz-rapor-kutular{display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px}.yz-rk{display:flex;flex-direction:column;align-items:center;padding:10px 6px;border-radius:12px;background:var(--bg-main);border:1px solid var(--border-color)}.yz-rk small{font-size:10.5px;color:var(--text-muted);font-weight:700}.yz-rk b{font-size:24px;font-weight:900;font-variant-numeric:tabular-nums}.yz-rk.ust b{color:#22c55e}.yz-rk.alt b{color:#ef4444}',
        '.yz-rapor-grafik{width:100%;height:auto;color:var(--text-main)}',
        '.yz-rapor-dag{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:4px 16px}.yz-rd{display:grid;grid-template-columns:24px 1fr 28px;gap:8px;align-items:center}.yz-rd i{display:block;height:8px;border-radius:9px;background:var(--accent-orange);min-width:2px}.yz-rd b{font-size:12px;text-align:right}',
        '.yz-rapor-gecmis{display:flex;gap:8px;flex-wrap:wrap}.yz-rapor-gecmis span{display:flex;flex-direction:column;align-items:center;padding:8px 12px;border-radius:12px;border:1px solid var(--border-color);min-width:80px}.yz-rapor-gecmis span.bugun{border-color:var(--accent-orange)}.yz-rapor-gecmis b{font-size:18px}.yz-rapor-gecmis small{font-size:10.5px;color:var(--text-muted)}',
        // TV — eleme + podyum
        '.yz-tv-podyum{display:flex;gap:1.4vw;justify-content:center}.yz-tv-pod{display:flex;align-items:center;gap:1vw;padding:1vh 1.6vw;border-radius:1vw;background:#0d1a2e;border:1px solid #1d3354}.yz-tv-pod .m{font-size:2.6vw}.yz-tv-pod .a{font-size:1.9vw;font-weight:900}.yz-tv-pod .p{font-size:1.5vw;color:#fbbf24;font-weight:800}.yz-tv-pod.p1{border-color:#fbbf24}',
        '.yz-tv-eleme{flex:1;display:flex;gap:1.6vw;overflow:hidden}.yz-tv-canli{display:flex;flex-direction:column;gap:1.4vh;width:36vw}',
        '.yz-tv-mac{background:#0d1a2e;border:1px solid #22c55e;border-radius:1.2vw;padding:1.4vh 1.4vw;display:flex;flex-direction:column;gap:.8vh}.yz-tv-mac-tur{font-size:1.1vw;font-weight:900;letter-spacing:.2em;color:#fbbf24;text-transform:uppercase}',
        '.yz-tv-mac-sat{display:flex;justify-content:space-between;align-items:center;font-size:2vw;font-weight:900}.yz-tv-mac-sat b{font-size:3.4vw}.yz-tv-mac-sat.kaz{color:#22c55e}.yz-tv-mac-sat .yz-seed{background:#1d3354;color:#8aa2c0;font-size:1vw;height:auto;padding:.2vh .5vw}',
        '.yz-tv-mac-setler{display:flex;gap:.6vw}.yz-tv-mac-setler span{flex:1;display:flex;flex-direction:column;align-items:center;background:#08121f;border-radius:.6vw;padding:.5vh 0;font-size:1.3vw;font-weight:800;color:#8aa2c0}.yz-tv-mac-setler span i{font-style:normal}.yz-tv-mac-setler span.a{color:#fff}.yz-tv-mac-setler span.b{color:#fff}',
        '.yz-tv-br{flex:1;overflow:hidden;background:#08121f;border:1px solid #16263e;border-radius:1.2vw;padding:1.4vh 1vw}.yz-tv .yz-bracket{height:100%;gap:1.2vw}.yz-tv .yz-br-kol{flex:1;min-width:0}.yz-tv .yz-br-tur{color:#7d93b2;font-size:.9vw}',
        '.yz-tv .yz-bm{background:#0b1829;border-color:#1d3354}.yz-tv .yz-bm.suruyor{border-color:#22c55e}.yz-tv .yz-bm-s{font-size:1.15vw;padding:.7vh .7vw;color:#e8eef7}.yz-tv .yz-bm-s+.yz-bm-s{border-top-color:#1d3354}.yz-tv .yz-bm-s.kaz{color:#22c55e}.yz-tv .yz-seed{background:#1d3354;color:#8aa2c0;font-size:.8vw;height:auto;min-width:1.4vw}'
    ].join('\n');
    document.head.appendChild(st);
}

// ================================================================================================
// EK 2 (2026-09-30, kullanıcı): 📈 gelişim sıralaması (ilk 3 gerçek puana göre, Klasik/Makaralı ayrı, gerçek
// sıralama filtresi) · 🎯 hedefe dokunarak giriş (6 halka) + grup merkezi → nişangah önerisi · 📉 yorulma analizi.
// ================================================================================================
// Hedef kağıtları — R: hedef yüzünün (en dış sayılan halka) yarıçapı, cm
const YZ_YUZ = {
    '6': { ad: '6 halka (80 cm)', halka: 6, R: 24 },
    '10': { ad: '10 halka (122 cm)', halka: 10, R: 61 },
    '10k': { ad: '10 halka (80 cm)', halka: 10, R: 40 }
};
function yzYuz(d) { return YZ_YUZ[(d && d.ayar && d.ayar.yuz) || '6'] || YZ_YUZ['6']; }
// Konum (merkez 0,0 · yüz yarıçapı 1) → puan. X: 10'un iç yarısı. Yüz dışı M.
function yzKonumPuan(x, y, yuz) {
    // Çizgiye değen ok yüksek puanı alır (WA): ok kalınlığı kadar pay (~halka genişliğinin %8'i) içeri doğru sayılır.
    let r = Math.hypot(x, y), n = yuz.halka, pay = 0.08 / n;
    if (r - pay > 1) return 'M';
    if (r - pay <= 1 / (2 * n)) return 'X';
    return String(11 - Math.max(1, Math.ceil((r - pay) * n)));
}
function yzHalkaRenk(deger) { return deger >= 9 ? ['#fde047', '#a16207'] : deger >= 7 ? ['#ef4444', '#7f1d1d'] : deger >= 5 ? ['#0ea5e9', '#075985'] : deger >= 3 ? ['#1f2937', '#9ca3af'] : ['#f8fafc', '#94a3b8']; }
function yzHedefYuzSVG(yuz) {
    let n = yuz.halka, s = '';
    for (let i = n; i >= 1; i--) { let deger = 11 - i, c = yzHalkaRenk(deger); s += '<circle r="' + (i / n) + '" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="0.006"/>'; }
    s += '<circle r="' + (1 / (2 * n)) + '" fill="none" stroke="#a16207" stroke-width="0.005"/>';
    s += '<line x1="-0.03" x2="0.03" y1="0" y2="0" stroke="#7c2d12" stroke-width="0.006"/><line y1="-0.03" y2="0.03" x1="0" x2="0" stroke="#7c2d12" stroke-width="0.006"/>';
    return s;
}
// ---- 🎯 hedefe dokunarak giriş (bu cihazın tercihi)
function yzGirisHedefMi() { try { return localStorage.getItem('dag_yz_girismod') === 'hedef'; } catch (e) { return false; } }
function yzGirisModSec(m) { try { localStorage.setItem('dag_yz_girismod', m); } catch (e) {} yzGirisCiz(); }
function yzHedefGirisHTML(g, d, okSay) {
    let yuz = yzYuz(d), noktalar = '';
    (g.konumlar || []).forEach(function (k, i) {
        if (!k) return;
        noktalar += '<g><circle cx="' + k.x + '" cy="' + k.y + '" r="0.045" fill="#10b981" stroke="#fff" stroke-width="0.012"/><text x="' + k.x + '" y="' + (k.y + 0.016) + '" text-anchor="middle" font-size="0.05" font-weight="900" fill="#fff">' + (i + 1) + '</text></g>';
    });
    let dolu = g.oklar.length >= okSay;
    return '<div class="yz-hedef-giris"><svg id="yz-hedef-svg" viewBox="-1.1 -1.1 2.2 2.2" class="yz-hedef-svg' + (dolu ? ' dolu' : '') + '" onclick="yzHedefTik(event)" role="img" aria-label="Hedef — okun yerine dokun">'
        + '<rect x="-1.1" y="-1.1" width="2.2" height="2.2" fill="#e5e7eb" opacity=".12"/>' + yzHedefYuzSVG(yuz) + noktalar + '</svg>'
        + '<div class="yz-hedef-yan"><button class="yz-tus yz-r-kacan" onclick="yzOkEkle(\'M\')"' + (dolu ? ' disabled' : '') + '>M</button><div class="yz-alt">Okun hedefteki yerine dokun · ıska için M · ' + esc(yuz.ad) + '</div></div></div>';
}
function yzHedefTik(e) {
    let svg = document.getElementById('yz-hedef-svg'), g = _yz.giris, d = yzOku().durum; if (!svg || !g || !d) return;
    if (g.oklar.length >= yzGirisOkSay(g, d)) return;
    let pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    let p = pt.matrixTransform(svg.getScreenCTM().inverse()), x = Math.round(p.x * 1000) / 1000, y = Math.round(p.y * 1000) / 1000;
    yzOkEkle(yzKonumPuan(x, y, yzYuz(d)), { x: x, y: y });
}
// ---- grup analizi + nişangah önerisi
function yzKonumlar(o, k, bas, son) {
    let d = o.durum, arr = o[yzPKey(d.id, k)] || [], r = [];
    arr.forEach(function (seri, i) { if (!seri || (bas != null && i < bas) || (son != null && i >= son)) return; seri.forEach(function (p) { if (p && Math.hypot(p.x, p.y) <= 1.1) r.push({ x: p.x, y: p.y, seri: i }); }); });
    return r;
}
function yzGrup(noktalar) {
    if (!noktalar || noktalar.length < 3) return null;
    let n = noktalar.length, mx = 0, my = 0; noktalar.forEach(function (p) { mx += p.x; my += p.y; }); mx /= n; my /= n;
    let yay = 0; noktalar.forEach(function (p) { yay += Math.hypot(p.x - mx, p.y - my); }); yay /= n;
    return { n: n, mx: mx, my: my, yay: yay };
}
// Nişangah oku takip eder: grup sağdaysa nişangah sağa, aşağıdaysa aşağı.
function yzGrupOneri(gr, yuz) {
    if (!gr) return null;
    let cx = gr.mx * yuz.R, cy = gr.my * yuz.R, kay = Math.hypot(cx, cy), cap = gr.yay * 2 * yuz.R;
    let sik = gr.yay < 0.22 ? 'sıkı' : gr.yay < 0.4 ? 'orta' : 'dağınık';
    let yon = [], ayar = [];
    if (Math.abs(cx) >= 2) { yon.push(Math.round(Math.abs(cx)) + ' cm ' + (cx > 0 ? 'sağda' : 'solda')); ayar.push(cx > 0 ? 'sağa' : 'sola'); }
    if (Math.abs(cy) >= 2) { yon.push(Math.round(Math.abs(cy)) + ' cm ' + (cy > 0 ? 'aşağıda' : 'yukarıda')); ayar.push(cy > 0 ? 'aşağı' : 'yukarı'); }
    let merkezde = kay < 2.5 || !ayar.length;
    return {
        merkezde: merkezde, cap: Math.round(cap), sik: sik, n: gr.n,
        kisa: merkezde ? 'Grup merkezde ✓' : 'Grup ' + yon.join(', '),
        oneri: merkezde ? 'Nişangahı değiştirme' + (sik === 'dağınık' ? ' — önce grubu toplamaya çalış (tutarlı nişan/bırakış)' : '') + '.'
            : 'Nişangahı ' + ayar.join(' ve ') + ' al' + (sik === 'dağınık' ? ' (grup dağınık — önce tutarlılık, ayarı küçük adımlarla yap)' : '') + '.',
        uyari: gr.n < 12 ? 'Az ok (' + gr.n + ') — ayar kararı için en az 12 ok önerilir.' : ''
    };
}
// Nişangah önerisi: yorulma (kalıcı düşüş) varsa SADECE yorulmadan önceki oklardan — yorgunlukla aşağı düşen
// oklar nişangah hatası sanılıp "nişangahı aşağı al" denmesin. Çizim yine tüm okları gösterir.
function yzOneriVeri(o, r, yg) {
    let yuz = yzYuz(o.durum), nokta = yzKonumlar(o, r.k), gr = yzGrup(nokta), on = yzGrupOneri(gr, yuz);
    if (yg && yg.durum === 'dayaniklilik' && yg.kirilma != null) {
        let erken = yzGrup(yzKonumlar(o, r.k, 0, yg.kirilma));
        if (erken && erken.n >= 6) { on = yzGrupOneri(erken, yuz); on.not = 'Yorulma öncesi ' + erken.n + ' oka göre (sonraki oklar yorgunlukla kaydı — nişangah değil kuvvet sorunu).'; }
    }
    return { nokta: nokta, gr: gr, on: on };
}
function yzGrupSVG(noktalar, gr, yuz, boyut) {
    let dots = noktalar.map(function (p) { return '<circle cx="' + p.x + '" cy="' + p.y + '" r="0.035" fill="#111827" stroke="#fff" stroke-width="0.01" opacity=".85"/>'; }).join('');
    let merkez = gr ? '<g stroke="#10b981" stroke-width="0.022"><line x1="' + (gr.mx - 0.09) + '" x2="' + (gr.mx + 0.09) + '" y1="' + gr.my + '" y2="' + gr.my + '"/><line x1="' + gr.mx + '" x2="' + gr.mx + '" y1="' + (gr.my - 0.09) + '" y2="' + (gr.my + 0.09) + '"/></g><circle cx="' + gr.mx + '" cy="' + gr.my + '" r="' + gr.yay + '" fill="none" stroke="#10b981" stroke-width="0.012" stroke-dasharray="0.03 0.02"/>' : '';
    return '<svg viewBox="-1.1 -1.1 2.2 2.2" width="' + (boyut || 120) + '" height="' + (boyut || 120) + '" role="img" aria-label="Ok dağılımı ve grup merkezi">' + yzHedefYuzSVG(yuz) + dots + merkez + '</svg>';
}
// ---- 📉 yorulma analizi (tur içi dayanıklılık / konsantrasyon)
function yzOrt(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }
function yzYorgunluk(o, r) {
    let d = o.durum, f = yzFormat(d), t = r.seriT.map(function (v, i) { return { v: v, i: i }; }).filter(function (x) { return x.v != null; });
    if (t.length < 6) return { durum: 'az', baslik: 'Az veri', detay: 'Yorulma analizi için en az 6 seri gerekli.' };
    let deg = t.map(function (x) { return x.v; }), esik = f.ok * 0.4, en = null;
    for (let b = 3; b <= t.length - 2; b++) { let on = yzOrt(deg.slice(0, b)), son = yzOrt(deg.slice(b)); if (!en || on - son > en.fark) en = { b: b, on: on, son: son, fark: on - son }; }
    let ort = yzOrt(deg), sd = Math.sqrt(yzOrt(deg.map(function (v) { return (v - ort) * (v - ort); }))), mx = Math.max.apply(null, deg), mn = Math.min.apply(null, deg);
    if (en && en.fark >= esik) {
        let sonra = deg.slice(en.b).sort(function (a, b) { return a - b; }), kirpik = sonra.length > 2 ? yzOrt(sonra.slice(1)) : yzOrt(sonra);
        let duzenli = en.on - kirpik >= esik * 0.75, seriNo = t[en.b].i + 1;
        let erken = yzGrup(yzKonumlar(o, r.k, 0, t[en.b].i)), gec = yzGrup(yzKonumlar(o, r.k, t[en.b].i, null));
        let asagi = !!(erken && gec && gec.my - erken.my > 0.08), dagildi = !!(erken && gec && gec.yay - erken.yay > 0.08);
        let ozet = seriNo + '. seriden sonra ortalama −' + en.fark.toFixed(1) + ' (seri başı ' + en.on.toFixed(1) + ' → ' + en.son.toFixed(1) + ')';
        if (duzenli || asagi) return { durum: 'dayaniklilik', baslik: 'Kuvvet / dayanıklılık', ozet: ozet, kirilma: t[en.b].i,
            detay: 'Düşüş tur ilerledikçe kalıcı' + (asagi ? ' ve oklar aşağı kayıyor (yorulunca çekiş kısalır)' : '') + (dagildi ? ', grup da genişliyor' : '') + '. Yay kuvveti ve uzun tur (72 ok) dayanıklılığı çalışılmalı.' };
        return { durum: 'konsantrasyon', baslik: 'Konsantrasyon', ozet: ozet, detay: 'Düşüş bir-iki kötü seriden geliyor, sonra toparlanıyor. Seri arası rutin, nefes ve odak çalışılmalı.' };
    }
    if (sd >= f.ok * 0.9) return { durum: 'konsantrasyon', baslik: 'Dalgalı', ozet: 'En iyi ' + mx + ', en zayıf ' + mn + ' — seriler arası fark büyük', detay: 'Kalıcı bir düşüş yok ama seriler çok dalgalı. Her okta aynı rutin (nişan süresi, bırakış) çalışılmalı.' };
    return { durum: 'istikrarli', baslik: 'İstikrarlı ✓', ozet: 'Seriler ' + mn + '–' + mx + ' arasında', detay: 'Tur boyunca belirgin bir düşüş yok.' };
}
// ---- 📈 gelişim: kendi ortalamasına göre beklenen puan
function yzBeklenenOrt(o, k) {
    let d = o.durum; if (!d) return null;
    let anahtar = d.id + ':' + yzArsivOku().length;
    if (!_yz.ortCache || _yz.ortCache.a !== anahtar) _yz.ortCache = { a: anahtar, m: {} };
    if (Object.prototype.hasOwnProperty.call(_yz.ortCache.m, k)) return _yz.ortCache.m[k];
    let sonuc = null, top = 0, ok = 0;
    yzArsivOku().filter(function (r) { return r.id !== d.id && r.mesafe === d.ayar.mesafe; }).slice(-5).forEach(function (r) {
        let s = (r.sporcular || []).find(function (x) { return x.k === k; }); if (s && s.ok) { top += s.toplam; ok += s.ok; }
    });
    if (ok >= 18) sonuc = { ort: top / ok, kaynak: 'son turlar (' + d.ayar.mesafe + ')' };
    else {
        let gi = k.indexOf('|'), sp = turnuvaDB[k.slice(0, gi)] && turnuvaDB[k.slice(0, gi)][k.slice(gi + 1)];
        top = 0; ok = 0;
        ((sp && sp.seriler) || []).filter(function (s) { return (s.t || 0) < d.basla && Array.isArray(s.oklar) && s.oklar.length; }).slice(-30).forEach(function (s) { top += (s.puan || 0); ok += s.oklar.length; });
        if (ok >= 18) sonuc = { ort: top / ok, kaynak: 'karne' };
    }
    _yz.ortCache.m[k] = sonuc;
    return sonuc;
}
function yzGelisimHucre(r, enIyi) {
    if (r.gelisim == null) return '<td class="gel bos" title="Geçmiş veri yok">yeni</td>';
    return '<td class="gel ' + (r.gelisim >= 0 ? 'ust' : 'alt') + '" title="Beklenen: ' + (r.ortOk ? (r.ortOk * r.ok).toFixed(0) : '') + ' (' + esc(r.ortKaynak || '') + ')">' + (enIyi ? '🔥 ' : '') + (r.gelisim >= 0 ? '+' : '') + r.gelisim + '</td>';
}
// ---- görünüm (bu cihaz): 📊 gerçek / 📈 gelişim · yay: tümü / Klasik / Makaralı / ayrı
function yzGorunum() {
    if (!_yz.gorunum) { try { _yz.gorunum = JSON.parse(localStorage.getItem('dag_yz_gorunum') || 'null'); } catch (e) {} }
    if (!_yz.gorunum) _yz.gorunum = { mod: 'gercek', yay: 'tumu' };
    return _yz.gorunum;
}
function yzGorunumAyarla(a, v) { let g = yzGorunum(); g[a] = v; try { localStorage.setItem('dag_yz_gorunum', JSON.stringify(g)); } catch (e) {} yzCiz(); }
function yzGrupSirala(liste) {
    liste = liste.map(function (r) { return Object.assign({}, r); });
    liste.sort(function (a, b) { return b.toplam - a.toplam || b.on - a.on || b.x - a.x || a.ad.localeCompare(b.ad, 'tr'); });
    liste.forEach(function (r, i) { let p = liste[i - 1]; r.sira = p && p.toplam === r.toplam && p.on === r.on && p.x === r.x ? p.sira : i + 1; });
    return liste;
}
function yzGruplar(o, sira) {
    let g = yzGorunum(), var_ = function (y) { return sira.some(function (r) { return r.yay === y; }); };
    if (g.yay === 'Klasik' || g.yay === 'Makaralı') return [{ ad: g.yay, liste: yzGrupSirala(sira.filter(function (r) { return r.yay === g.yay; })) }];
    if (g.yay === 'ayri' && var_('Klasik') && var_('Makaralı')) return ['Klasik', 'Makaralı'].map(function (y) { return { ad: y, liste: yzGrupSirala(sira.filter(function (r) { return r.yay === y; })) }; });
    return [{ ad: null, liste: sira }];
}
// Gelişim görünümü: ilk 3 GERÇEK puana göre sabit, kalanlar kendi ortalamasına göre gelişime göre.
function yzGelisimSirala(liste) {
    let ilk = liste.filter(function (r) { return r.toplam > 0; }).slice(0, 3), kalan = liste.filter(function (r) { return ilk.indexOf(r) === -1; });
    kalan.sort(function (a, b) { return (b.gelisim == null ? -1e9 : b.gelisim) - (a.gelisim == null ? -1e9 : a.gelisim) || b.toplam - a.toplam; });
    return ilk.concat(kalan);
}
function yzGorunumHTML(o, sira, sec) {
    let g = yzGorunum(), d = o.durum, f = yzFormat(d), aktif = d.asama === 'bitti' ? -1 : Math.min(d.seri, f.seri - 1);
    let gruplar = yzGruplar(o, sira);
    return gruplar.map(function (gr) {
        let liste = g.mod === 'gelisim' ? yzGelisimSirala(gr.liste) : gr.liste, onceki = null;
        if (sec.hareket && g.mod !== 'gelisim' && aktif > 0) { let on = yzSiralama(o, aktif); if (gr.ad) on = yzGrupSirala(on.filter(function (r) { return r.yay === gr.ad; })); onceki = {}; on.forEach(function (r) { onceki[r.k] = r.sira; }); }
        let bas = gr.ad ? '<div class="yz-grup-bas">' + (gr.ad === 'Makaralı' ? '⚙️' : '🏹') + ' ' + gr.ad + ' <small>' + liste.length + ' sporcu</small></div>' : '';
        return bas + yzTabloHTML(o, liste, Object.assign({}, sec, { onceki: onceki, hareket: sec.hareket && g.mod !== 'gelisim', gelisim: g.mod === 'gelisim' }));
    }).join('');
}
function yzGorunumKontrolHTML(o, tv) {
    let g = yzGorunum(), d = o.durum, yaylar = {};
    (d.katilimci || []).forEach(function (k) { let i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)] && turnuvaDB[k.slice(0, i)][k.slice(i + 1)]; yaylar[(sp && sp.yay) || 'Klasik'] = 1; });
    let ikiYay = yaylar.Klasik && yaylar['Makaralı'];
    let c = function (yazi, a, v, baslik) { return '<button class="' + (tv ? 'yz-tv-k' : 'yz-cip') + (g[a] === v ? (tv ? ' ana' : ' aktif') : '') + '" onclick="event.stopPropagation(); yzGorunumAyarla(\'' + a + '\',\'' + v + '\')"' + (baslik ? ' title="' + baslik + '"' : '') + '>' + yazi + '</button>'; };
    return '<span class="' + (tv ? 'yz-tv-kontrol yz-tv-gorunum' : 'yz-gorunum') + '">' + c('📊 Gerçek', 'mod', 'gercek', 'Gerçek puan sıralaması') + c('📈 Gelişim', 'mod', 'gelisim', 'İlk 3 gerçek puana göre, kalanlar kendi ortalamasına göre gelişime göre')
        + (ikiYay ? c('Tümü', 'yay', 'tumu') + c('🏹 Klasik', 'yay', 'Klasik') + c('⚙️ Makaralı', 'yay', 'Makaralı') + c('Ayrı', 'yay', 'ayri', 'Klasik ve makaralı ayrı tablolarda, ayrı sıralama') : '') + '</span>';
}
function yzPodyumGrupHTML(gr) {
    let ilk3 = gr.liste.filter(function (r) { return r.toplam > 0; }).slice(0, 3); if (!ilk3.length) return '';
    return (gr.ad ? '<div class="yz-grup-bas" style="text-align:center">' + (gr.ad === 'Makaralı' ? '⚙️' : '🏹') + ' ' + gr.ad + '</div>' : '')
        + '<div class="yz-podyum">' + [1, 0, 2].map(function (i) { let r = ilk3[i]; if (!r) return '<div class="yz-pod bos"></div>'; return '<div class="yz-pod p' + r.sira + '"><div class="yz-pod-madalya">' + (r.sira === 1 ? '🥇' : r.sira === 2 ? '🥈' : '🥉') + '</div><div class="yz-pod-ad">' + esc(r.ad) + '</div><div class="yz-pod-puan">' + r.toplam + '</div><div class="yz-alt">' + r.on + ' × 10+X · ' + (r.ok ? (r.toplam / r.ok).toFixed(2) : '0') + ' ort.</div><div class="yz-pod-blok"></div></div>'; }).join('') + '</div>';
}
// ---- 🔬 sonuç ekranı: teknik analiz kartı (grup + nişangah + tur içi)
function yzTeknikKartHTML(o, sira) {
    let d = o.durum, yuz = yzYuz(d);
    let satir = sira.map(function (r) {
        let yg = yzYorgunluk(o, r), ov = yzOneriVeri(o, r, yg), nokta = ov.nokta, gr = ov.gr, on = ov.on;
        return '<div class="yz-tek-sat"><div class="yz-tek-ad"><b>' + esc(yzKisaAd(r.ad)) + '</b><small>' + r.sira + '. · ' + r.toplam + '</small></div>'
            + '<div class="yz-tek-hedef">' + (gr ? yzGrupSVG(nokta, gr, yuz, 92) : '<span class="yz-alt">Konum yok<br>(tuşla girildi)</span>') + '</div>'
            + '<div class="yz-tek-metin">' + (on ? '<div><b>' + esc(on.kisa) + '</b> · çap ~' + on.cap + ' cm (' + on.sik + ')</div><div class="yz-tek-oneri">🎯 ' + esc(on.oneri) + '</div>' + (on.not ? '<div class="yz-alt">ℹ️ ' + esc(on.not) + '</div>' : '') + (on.uyari ? '<div class="yz-alt">' + esc(on.uyari) + '</div>' : '') : '')
            + '<div class="yz-yorgun ' + yg.durum + '"><b>📉 ' + esc(yg.baslik) + '</b>' + (yg.ozet ? ' · ' + esc(yg.ozet) : '') + '<div class="yz-alt">' + esc(yg.detay) + '</div></div></div></div>';
    }).join('');
    return '<div class="yz-kart"><div class="yz-etiket">🔬 Teknik analiz <span class="yz-alt" style="text-transform:none;letter-spacing:0;font-weight:600">· grup merkezi (yeşil artı) ve nişangah önerisi hedefe dokunarak girilen oklardan · tur içi düşüş analizi</span></div><div class="yz-tek">' + satir + '</div></div>';
}
function yzEk2CssYukle() {
    if (document.getElementById('yz-ek2-css')) return;
    let st = document.createElement('style'); st.id = 'yz-ek2-css';
    st.textContent = [
        '.yz-giris-mod{display:flex;gap:6px}.yz-giris-mod button{flex:1;border:1px solid var(--border-color);background:transparent;color:var(--text-muted);border-radius:10px;min-height:38px;font:inherit;font-weight:800;font-size:13px;cursor:pointer}.yz-giris-mod button.aktif{background:var(--accent-orange);border-color:var(--accent-orange);color:#1a0d05}',
        '.yz-hedef-giris{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center}.yz-hedef-svg{width:min(100%,44vh,420px);height:auto;touch-action:manipulation;cursor:crosshair;border-radius:50%}.yz-hedef-svg.dolu{opacity:.6;cursor:default}',
        '.yz-hedef-yan{display:flex;flex-direction:column;gap:8px;align-items:center;max-width:120px;text-align:center}.yz-hedef-yan .yz-tus{width:90px}',
        '.yz-tablo .gel{font-weight:900}.yz-tablo .gel.ust{color:#22c55e}.yz-tablo .gel.alt{color:#ef4444}.yz-tablo .gel.bos{color:var(--text-muted);font-weight:600;font-size:.85em}',
        '.yz-tablo tr.yz-ayrac td{text-align:left;font-size:10.5px;font-weight:900;letter-spacing:.08em;color:#22c55e;padding:8px 8px 4px;border-bottom:1px dashed var(--border-color)}',
        '.yz-tv .yz-tablo tr.yz-ayrac td{height:auto;font-size:calc(var(--yz-satir) * .24);padding:.6vh 1vw;color:#4ade80;background:#0b1829}.yz-tv .yz-tablo .gel{font-size:1.1em}.yz-tv .yz-tablo th.gel{color:#4ade80}',
        '.yz-grup-bas{font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);padding:10px 4px 4px}.yz-grup-bas small{font-weight:600;letter-spacing:0;text-transform:none}',
        '.yz-tv .yz-grup-bas{font-size:1.2vw;color:#fbbf24;padding:.8vh 1vw .4vh}',
        '.yz-gorunum{display:inline-flex;gap:4px;flex-wrap:wrap;margin-left:auto;text-transform:none;letter-spacing:0}.yz-gorunum .yz-cip{min-height:32px;padding:0 10px;font-size:12px}',
        '.yz-tv-gorunum{margin-top:.2vh}.yz-tv-gorunum .yz-tv-k{font-size:max(11px,.75vw);padding:.5vh .7vw}',
        '.yz-tek{display:flex;flex-direction:column;gap:8px}.yz-tek-sat{display:grid;grid-template-columns:130px 100px 1fr;gap:12px;align-items:center;padding:8px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-main)}',
        '.yz-tek-ad{display:flex;flex-direction:column}.yz-tek-ad small{color:var(--text-muted)}.yz-tek-hedef{display:flex;justify-content:center;font-size:11px;text-align:center}.yz-tek-metin{display:flex;flex-direction:column;gap:4px;font-size:13px}.yz-tek-oneri{font-weight:800;color:#0891b2}',
        '.yz-yorgun{padding:6px 10px;border-radius:10px;font-size:12.5px}.yz-yorgun.dayaniklilik{background:color-mix(in srgb,#ef4444 12%,transparent)}.yz-yorgun.konsantrasyon{background:color-mix(in srgb,#f59e0b 14%,transparent)}.yz-yorgun.istikrarli{background:color-mix(in srgb,#22c55e 12%,transparent)}.yz-yorgun.az{background:var(--bg-panel)}',
        '.yz-hp-sat{flex-direction:column;align-items:stretch!important;gap:6px}.yz-hp-ust{display:flex;justify-content:space-between;align-items:center;gap:10px}.yz-hp-ad{display:flex;flex-direction:column;font-weight:800;font-size:13px}.yz-hp-ad small{font-weight:600;color:var(--text-muted);font-size:11px}',
        '.yz-hp-giris{display:flex;flex-direction:column;align-items:flex-end;gap:3px}.yz-hp-z{font-size:11px;font-weight:800;min-height:14px}.yz-hp-z.kolay{color:#22c55e}.yz-hp-z.orta{color:#eab308}.yz-hp-z.zor{color:#f97316}.yz-hp-z.cokzor{color:#ef4444}',
        '.yz-hp-cipler{display:flex;gap:6px;flex-wrap:wrap}.yz-hp-cip{border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);border-radius:999px;padding:5px 10px;font:inherit;font-size:12px;cursor:pointer}.yz-hp-cip b{font-variant-numeric:tabular-nums}',
        '.yz-tablo .tmp.orta{color:#f59e0b}.yz-tablo .tmp-i{margin-right:3px}',
        '.yz-tv-duyuru{position:absolute;left:50%;bottom:2.4vh;transform:translateX(-50%);display:flex;flex-direction:column;gap:.8vh;z-index:3;transition:opacity .6s}.yz-tv-duyuru.gizle{opacity:0;pointer-events:none}',
        '.yz-tv-dy{display:flex;align-items:center;gap:1vw;padding:1.2vh 2vw;border-radius:1vw;background:#0d1a2e;border:2px solid #1d3354;font-size:1.9vw;font-weight:900;box-shadow:0 10px 40px rgba(0,0,0,.6);animation:yzDuyuru .5s ease-out}.yz-tv-dy span{font-size:2.3vw}',
        '.yz-tv-dy.ulasti{background:linear-gradient(90deg,#854d0e,#ca8a04);border-color:#fde047;color:#fff}.yz-tv-dy.yakin{border-color:#f97316}.yz-tv-dy.rahat{border-color:#22c55e}.yz-tv-dy.zorlasiyor,.yz-tv-dy.cokzor{border-color:#ef4444}',
        '@keyframes yzDuyuru{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}',
        '.yz-rapor-grup{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:13px}',
        '@media (max-width:640px){.yz-tek-sat{grid-template-columns:1fr 100px}.yz-tek-metin{grid-column:1/-1}}'
    ].join('\n');
    document.head.appendChild(st);
}

// ---------------------------------------------------------------- 📺 TV'den yönetim (2026-09-30, kullanıcı: "TV ekranında skor
// giremiyorum, saniyeyi buradan da yönetebileyim"). TV artık yazabilir: her yazma yzGuncelle ile TAZE okuyup yazıyor ve
// skorlar sporcu/maç başına ayrı anahtarda — tabletle aynı anda kullanılsa da birbirini ezmez.
function yzTvDuyuruHTML(o, sira, yeni) {
    let msj = sira.filter(function (r) { return yeni[r.k] && r.hedefPuan; }).map(function (r) { return yzHedefDurum(o, r); })
        // TV herkesin önünde: sadece olumlu/nötr mesajlar (moral) — "zor/yetişmez" sadece koçun cihazında (toast) görünür
        .filter(function (h) { return h && ['ulasti', 'yakin', 'rahat', 'yolunda'].indexOf(h.d) !== -1; });
    if (!msj.length) return '';
    msj.sort(function (a, b) { return (b.d === 'ulasti') - (a.d === 'ulasti'); });
    return '<div class="yz-tv-duyuru">' + msj.slice(0, 3).map(function (h) { return '<div class="yz-tv-dy ' + h.d + '"><span>' + h.i + '</span>' + esc(h.metin) + '</div>'; }).join('') + '</div>';
}
function yzTvKontrolHTML(o, el) {
    let d = o.durum, dugme = function (yazi, fn, cls, baslik) { return '<button class="yz-tv-k' + (cls ? ' ' + cls : '') + '" onclick="' + fn + '"' + (baslik ? ' title="' + baslik + '"' : '') + '>' + yazi + '</button>'; };
    let sayac = o.sayac ? dugme('⏹ Sıfırla', 'yzSayacDurdur()') : dugme('▶ Başlat', 'yzSayacBaslat()', 'yesil', 'Süreyi başlat (10 sn hatta geçiş + atış)');
    let sure = dugme('⏱ ' + yzSure(d) + ' sn', 'yzSureMenu()', '', 'Süreyi değiştir');
    if (d.asama === 'eleme') {
        let sh = el && el.maclar.some(function (m) { return m.shootGerek && !m.kazanan; });
        return '<div class="yz-tv-kontrol">' + sayac + sure + (sh ? dugme('🎯 Shoot-off 40 sn', 'yzShootSayac()') : '') + '</div>';
    }
    let f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1), bek = yzBekleyenler(o, seri).length, son = seri >= f.seri - 1;
    return '<div class="yz-tv-kontrol">' + sayac + sure
        + (bek ? dugme('✎ Skor gir (' + bek + ')', 'yzTvSiradaki()', 'ana', 'Sıradaki sporcunun skorunu gir — satıra tıklayarak da girebilirsin') : '')
        + dugme(son ? '🏁 Bitir' : '▶ ' + (seri + 2) + '. seri', 'yzSonrakiSeri()', bek ? '' : 'ana') + '</div>' + yzGorunumKontrolHTML(o, true);
}
function yzTvSatir(kEnc) { let o = yzOku(), d = o.durum; if (!d || d.asama !== 'tur') return; yzGirisAc(kEnc, Math.min(d.seri, yzFormat(d).seri - 1)); }
function yzTvSiradaki() {
    let o = yzOku(), d = o.durum; if (!d) return;
    let seri = Math.min(d.seri, yzFormat(d).seri - 1), k = yzHedefSirasi(o).find(function (x) { return !yzSkor(o, x)[seri]; });
    if (k) yzGirisAc(yzEnc(k), seri); else showToast('Bu serinin tüm skorları girildi.', 'success');
}
function yzTvMacGir(macId, taraf) {
    let m = yzMacBul(yzOku(), macId); if (!m || m.kazanan || !m.a || !m.b) return;
    if (m.shootGerek) return yzMacShootGir(macId, taraf);
    yzMacSetGir(macId, taraf, m.siradakiSet);
}

// ================================================================================================
// ⚔️ TAKIM & DÜELLO — SADE KURULUM (2026-10-01, kullanıcı seçtiği sorunlar: eşleştirme ikinci adımı gereksiz,
// 1v1'de isimler görünmüyor, kurulum ekranı çok kalabalık, üç ayrı geri düğmesi).
// Maç motoruna (set puanı, skor kartı, ağaç, sayaç) DOKUNULMADI — bu bölüm sadece motorun durum değişkenlerini
// (_kmTakimlar, _kmYarismaFormat, _kmRakipTipi …) doldurur ve mevcut fonksiyonları sırayla çağırır:
// Başlat → kmYarismaBracketEslestirmeyeGec → kmYarismaBracketOtomatikEslestir → kmYarismaBracketTuruBaslat.
// Eski ayrıntılı kurulum "Gelişmiş kurulum" bağlantısıyla hâlâ açılabilir (kmYarismaKurulumCiz'in asıl hali).
// ================================================================================================
let _yzK = { tur: null, boyut: 2, gelismis: false, eski: false, secili: null, haric: {} };
const _yzEskiKurulumCiz = typeof kmYarismaKurulumCiz === 'function' ? kmYarismaKurulumCiz : null;
kmYarismaKurulumCiz = function () {
    if (_yz.mod !== 'takim') return kmYarismaGiris();
    if (_yzK.eski && _yzEskiKurulumCiz) { _yzEskiKurulumCiz(); yzUstBarEkle('⚔️ Takım & Düello', '<button class="yz-link" onclick="_yzK.eski=false; kmYarismaKurulumCiz()">← Sade kurulum</button>'); return; }
    yzSihirbazCiz();
};
// 1v1'de takım adı yerine sporcunun adı: tek üyeli ve varsayılan adlı ("Takım 3") takımlar sporcunun adını alır.
function yzTakimAdlariniDuzelt() {
    (typeof _kmTakimlar !== 'undefined' ? _kmTakimlar : []).forEach(function (t) { if (t.uyeler.length === 1 && /^Takım \d+$/.test(t.ad || '')) t.ad = yzKisaAd(t.uyeler[0].ad); });
}
['kmYarismaBracketTuruBaslat', 'kmYarismaBaslat'].forEach(function (ad) {
    let eski = window[ad]; if (typeof eski !== 'function') return;
    window[ad] = function () { yzTakimAdlariniDuzelt(); return eski.apply(this, arguments); };
});
// ---- tek üst çubuk (çerçevenin "← Karışık Sınıf" çubuğu gizlenir, yerine bu tek çubuk)
function yzUstBarHTML(kirinti, sag) {
    return '<div class="yz-geri-bar yz-ust-bar"><button class="yz-btn" onclick="kmIzgaraGeriDon()">← Karışık Sınıf</button>'
        + '<span class="yz-kirinti">' + (kirinti ? '<button class="yz-link" onclick="yzTurlereDon()">🏆 Yarışma</button><span class="yz-kirinti-ayrac">›</span><b>' + kirinti + '</b>' : '<b>🏆 Yarışma</b>') + '</span>'
        + (sag ? '<span class="yz-ust-sag">' + sag + '</span>' : '') + '</div>';
}
function yzUstBarEkle(kirinti, sag) {
    let cb = document.getElementById('km-icerik-geri-bar'); if (cb) cb.style.display = 'none';
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    ic.querySelectorAll('.yz-geri-bar').forEach(function (b) { b.remove(); });
    ic.insertAdjacentHTML('afterbegin', yzUstBarHTML(kirinti, sag));
}
// ---- sporcu gücü (dengeli dağıtım için): karnedeki son 20 serinin ok ortalaması
function yzSporcuGuc(s) {
    let sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad], top = 0, ok = 0;
    ((sp && sp.seriler) || []).slice(-20).forEach(function (x) { if (Array.isArray(x.oklar)) { top += x.puan || 0; ok += x.oklar.length; } });
    return ok ? top / ok : 0;
}
function yzKatilanlar() { return (typeof _kmListe !== 'undefined' ? _kmListe : []).filter(function (s) { return !_yzK.haric[s.g + '|' + s.ad]; }); }
function yzTurCikar() {
    if (_yzK.tur) return;
    _yzK.tur = _kmRakipTipi === 'hayali' ? 'hayali' : (_kmYarismaFormat > 1 ? 'takim' : 'duello');
    if (_yzK.tur === 'takim') _yzK.boyut = Math.max(2, Math.min(4, _kmYarismaFormat));
}
// Takımları seçili türe göre kur. Düello: herkes kendi başına. Takım: boyuta göre takım sayısı OTOMATİK
// (kimse açıkta kalmaz), güce göre yılan sıralı dengeli dağıtım. Hayali: gerçek takım = katılanlar.
function yzTakimlariKur(karistir) {
    let L = yzKatilanlar().map(function (s) { return { g: s.g, ad: s.ad }; }), renk = KM_TAKIM_RENKLERI, ik = KM_YARISMA_IKON_SIRASI;
    if (_yzK.tur === 'duello') {
        _kmRakipTipi = 'gercek'; _kmYarismaFormat = 1;
        _kmTakimlar = L.map(function (s, i) { return { ad: yzKisaAd(s.ad), renk: renk[i % renk.length], ikon: ik[i % ik.length], uyeler: [s] }; });
    } else if (_yzK.tur === 'takim') {
        let k = _yzK.boyut, n = Math.max(2, Math.ceil(L.length / k));
        _kmRakipTipi = 'gercek'; _kmYarismaFormat = k; _kmTakimlar = _kmTakimlarOlustur(n);
        let sira = karistir ? L.sort(function () { return Math.random() - 0.5; }) : L.sort(function (a, b) { return yzSporcuGuc(b) - yzSporcuGuc(a); });
        sira.forEach(function (s, i) { let tur = Math.floor(i / n), j = i % n; _kmTakimlar[tur % 2 === 0 ? j : n - 1 - j].uyeler.push(s); });
    } else {
        _kmRakipTipi = 'hayali'; _kmTakimlar = _kmTakimlarOlustur(2); _kmTakimlar[0].uyeler = L; _kmYarismaFormat = Math.max(1, L.length);
    }
    _kmYarismaTakimSayisi = _kmTakimlar.length; _yzK.secili = null;
    try { _kmYarismaKurulumKaydet(); } catch (e) {}
}
// Kurulumdaki takımlar sınıf listesiyle uyuşmuyorsa (yeni gelen/çıkan sporcu) yeniden kur
function yzTakimlarGuncelMi() {
    let atanan = {}; _kmTakimlar.forEach(function (t) { t.uyeler.forEach(function (u) { atanan[u.g + '|' + u.ad] = 1; }); });
    let kat = yzKatilanlar();
    return kat.length === Object.keys(atanan).length && kat.every(function (s) { return atanan[s.g + '|' + s.ad]; });
}
function yzTurSec(t) { _yzK.tur = t; yzTakimlariKur(); kmYarismaKurulumCiz(); }
function yzBoyutSec(k) { _yzK.boyut = k; yzTakimlariKur(); kmYarismaKurulumCiz(); }
function yzKatilimDegis(kEnc) { let k = decodeURIComponent(kEnc); if (_yzK.haric[k]) delete _yzK.haric[k]; else _yzK.haric[k] = 1; yzTakimlariKur(); kmYarismaKurulumCiz(); }
// Takım maçında elle düzeltme: bir sporcuya dokun → başka takımdaki sporcuya dokun (yer değiştir) ya da takımın "＋ buraya" düğmesine dokun (taşı)
function yzUyeTikla(ti, ui) {
    let s = _yzK.secili;
    if (!s) { _yzK.secili = { ti: ti, ui: ui }; return kmYarismaKurulumCiz(); }
    if (s.ti === ti && s.ui === ui) { _yzK.secili = null; return kmYarismaKurulumCiz(); }
    if (s.ti !== ti) { let a = _kmTakimlar[s.ti].uyeler, b = _kmTakimlar[ti].uyeler, x = a[s.ui]; a[s.ui] = b[ui]; b[ui] = x; }
    _yzK.secili = null; try { _kmYarismaKurulumKaydet(); } catch (e) {} kmYarismaKurulumCiz();
}
function yzBurayaTasi(ti) {
    let s = _yzK.secili; if (!s || s.ti === ti) return;
    let u = _kmTakimlar[s.ti].uyeler.splice(s.ui, 1)[0]; _kmTakimlar[ti].uyeler.push(u);
    _yzK.secili = null; try { _kmYarismaKurulumKaydet(); } catch (e) {} kmYarismaKurulumCiz();
}
function yzSihirbazBaslat() {
    yzTakimAdlariniDuzelt();
    if (_kmRakipTipi === 'hayali') return kmYarismaBaslat();
    if (_kmYarismaAktifTakimlar().length < 2) return showToast('En az 2 katılımcı gerekli.', 'error');
    kmYarismaBracketEslestirmeyeGec(); kmYarismaBracketOtomatikEslestir(); kmYarismaBracketTuruBaslat();
}
function yzSihirbazCiz() {
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    yzCssYukle(); yzTurCikar();
    if (!yzTakimlarGuncelMi() || (_yzK.tur === 'duello' && _kmYarismaFormat !== 1) || (_yzK.tur === 'hayali') !== (_kmRakipTipi === 'hayali')) yzTakimlariKur();
    let L = typeof _kmListe !== 'undefined' ? _kmListe : [], kat = yzKatilanlar();
    let turKart = function (id, ikon, ad, acik) { return '<button class="yz-sk-tur' + (_yzK.tur === id ? ' aktif' : '') + '" onclick="yzTurSec(\'' + id + '\')"><span class="yz-sk-tur-ikon">' + ikon + '</span><b>' + ad + '</b><small>' + acik + '</small></button>'; };
    // 1 — tür
    let adim1 = '<div class="yz-sk-adim"><div class="yz-sk-no">1</div><div class="yz-sk-icerik"><div class="yz-sk-baslik">Ne oynanacak?</div><div class="yz-sk-turler">'
        + turKart('duello', '🥊', 'Düello', 'Herkes kendi başına · eleme ağacı')
        + turKart('takim', '👥', 'Takım Maçı', 'Takımlar otomatik, güce göre dengeli')
        + turKart('hayali', '🤖', 'Hayali Rakip', 'Sınıf birlikte sanal rakibe karşı')
        + '</div></div></div>';
    // 2 — katılanlar / takımlar
    let katCip = '<div class="yz-sk-cipler">' + L.map(function (s) { let k = s.g + '|' + s.ad, h = !!_yzK.haric[k]; return '<button class="yz-cip' + (h ? '' : ' aktif') + '" onclick="yzKatilimDegis(\'' + yzEnc(k) + '\')" title="' + (h ? 'Katılmıyor — dokun: ekle' : 'Katılıyor — dokun: çıkar') + '">' + (h ? '' : '✓ ') + esc(yzKisaAd(s.ad)) + '</button>'; }).join('') + '</div>';
    let takimHTML = '';
    if (_yzK.tur === 'takim') {
        let s = _yzK.secili;
        takimHTML = '<div class="yz-sk-cipler" style="margin-top:8px">' + [2, 3, 4].map(function (k) { return '<button class="yz-cip' + (_yzK.boyut === k ? ' aktif' : '') + '" onclick="yzBoyutSec(' + k + ')">' + k + 'v' + k + '</button>'; }).join('')
            + '<button class="yz-cip" onclick="yzTakimlariKur(false); kmYarismaKurulumCiz()">⚖️ Dengeli dağıt</button><button class="yz-cip" onclick="yzTakimlariKur(true); kmYarismaKurulumCiz()">🎲 Karıştır</button></div>'
            + '<div class="yz-sk-takimlar">' + _kmTakimlar.map(function (t, ti) {
                let guc = t.uyeler.length ? yzOrt(t.uyeler.map(yzSporcuGuc)) : 0;
                return '<div class="yz-sk-takim" style="--tr:' + t.renk + '"><div class="yz-sk-takim-bas"><b>' + esc(t.ad) + '</b><small>' + (guc ? 'ort. ' + guc.toFixed(1) : '') + '</small></div>'
                    + t.uyeler.map(function (u, ui) { let sec = s && s.ti === ti && s.ui === ui; return '<button class="yz-sk-uye' + (sec ? ' secili' : '') + '" onclick="yzUyeTikla(' + ti + ',' + ui + ')">' + esc(yzKisaAd(u.ad)) + '</button>'; }).join('')
                    + (s && s.ti !== ti ? '<button class="yz-sk-tasi" onclick="yzBurayaTasi(' + ti + ')">＋ buraya taşı</button>' : '') + '</div>';
            }).join('') + '</div>'
            + (kat.length % _yzK.boyut ? '<div class="yz-bilgi">⚠️ ' + kat.length + ' sporcu ' + _yzK.boyut + '\'li takımlara tam bölünmüyor — ' + _kmTakimlar.filter(function (t) { return t.uyeler.length < _yzK.boyut; }).map(function (t) { return esc(t.ad) + ' ' + t.uyeler.length + ' kişi'; }).join(', ') + '. Eksik yer güçlü sporculara verildi; istersen bir sporcuyu çıkar ya da başka takım boyutu seç.</div>' : '')
            + '<div class="yz-alt">Değiştirmek için: bir sporcuya dokun → başka takımdaki sporcuya dokun (yer değiştirir) ya da “＋ buraya taşı”.</div>';
    } else if (_yzK.tur === 'hayali') {
        takimHTML = '<div class="yz-sk-cipler" style="margin-top:8px"><span class="yz-alt" style="align-self:center">Rakip zorluğu:</span>' + ['rookie', 'dengeli', 'usta'].map(function (z) { return '<button class="yz-cip' + (_kmHayaliZorluk === z ? ' aktif' : '') + '" onclick="_kmHayaliZorluk=\'' + z + '\'; kmYarismaKurulumCiz()">' + HAYALI_ZORLUKLER[z].avatar + ' ' + HAYALI_ZORLUKLER[z].ad + '</button>'; }).join('') + '</div>';
    } else {
        let n = kat.length, tur = n >= 2 ? Math.ceil(Math.log2(n)) : 0;
        takimHTML = '<div class="yz-alt" style="margin-top:6px">' + (n >= 2 ? n + ' sporcu · ' + tur + ' tur' + (n & (n - 1) ? ' · bazı sporcular ilk turu bay geçer' : '') : 'En az 2 sporcu seç.') + '</div>';
    }
    let adim2 = '<div class="yz-sk-adim"><div class="yz-sk-no">2</div><div class="yz-sk-icerik"><div class="yz-sk-baslik">' + (_yzK.tur === 'takim' ? 'Takımlar' : 'Katılanlar') + ' <small>' + kat.length + '/' + L.length + '</small></div>' + katCip + takimHTML + '</div></div>';
    // 3 — kural
    let hedefOto = _kmYarismaHedef === null;
    let sablonlar = KM_YARISMA_SABLONLAR.map(function (sb, i) { let aktif = _kmYarismaOkTercih === sb.ok && !hedefOto && _kmYarismaHedef.tip === sb.hedef.tip && _kmYarismaHedef.deger === sb.hedef.deger; return '<button class="yz-cip' + (aktif ? ' aktif' : '') + '" onclick="kmYarismaSablonUygula(' + i + ')" title="' + esc(sb.aciklama) + '">' + sb.ikon + ' ' + sb.ad + '</button>'; }).join('');
    let oto = '<button class="yz-cip' + (hedefOto && _kmYarismaOkTercih === null ? ' aktif' : '') + '" onclick="_kmYarismaHedef=null; _kmYarismaOkTercih=null; kmYarismaKurulumCiz()">🏹 WA standart (otomatik)</button>';
    let adim3 = '<div class="yz-sk-adim"><div class="yz-sk-no">3</div><div class="yz-sk-icerik"><div class="yz-sk-baslik">Kural <button class="yz-link" onclick="_yzK.gelismis=!_yzK.gelismis; kmYarismaKurulumCiz()">' + (_yzK.gelismis ? '▴ Gelişmiş ayarları gizle' : '⚙️ Gelişmiş ayarlar') + '</button></div><div class="yz-sk-cipler">' + oto + sablonlar + '</div>'
        + (_yzK.gelismis ? '<div class="yz-sk-gelismis">' + kmYarismaMacAyarlariHTML()
            + (_yzK.tur === 'hayali' ? '<div class="yz-etiket">Tur süresi</div><div class="yz-sk-cipler">' + [[0, 'Süresiz'], [60, '1 dk'], [120, '2 dk'], [180, '3 dk'], [300, '5 dk']].map(function (x) { return '<button class="yz-cip' + (_kmYarismaSuresi === x[0] ? ' aktif' : '') + '" onclick="kmYarismaSureSec(' + x[0] + ')">' + x[1] + '</button>'; }).join('') + '</div>' : '')
            + '<button class="yz-link" style="margin-top:8px" onclick="_yzK.eski=true; kmYarismaKurulumCiz()">Ayrıntılı (eski) kurulumu aç — takım adı, renk, simge →</button></div>' : '')
        + '</div></div>';
    let hazir = _kmRakipTipi === 'hayali' ? kat.length >= 1 : _kmYarismaAktifTakimlar().length >= 2;
    let baslat = _yzK.tur === 'duello' ? '▶ Düelloyu başlat · ' + kat.length + ' sporcu' : _yzK.tur === 'takim' ? '▶ Turnuvayı başlat · ' + _kmTakimlar.length + ' takım' : '▶ Maçı başlat';
    ic.innerHTML = '<div class="yz yz-sk">' + adim1 + adim2 + adim3
        + '<div class="yz-sk-alt"><button class="yz-btn ana buyuk" ' + (hazir ? '' : 'disabled') + ' onclick="yzSihirbazBaslat()">' + baslat + '</button>'
        + '<div class="yz-alt">' + (_yzK.tur === 'hayali' ? 'Maç hemen başlar — tüm sınıf sanal rakibe karşı.' : 'Eşleşmeler ve eleme ağacı otomatik kurulur.') + '</div>'
        + (typeof kmYarismaGecmisiHTML === 'function' ? '<details class="yz-sk-gecmis"><summary>📜 Geçmiş yarışmalar</summary>' + kmYarismaGecmisiHTML() + '</details>' : '') + '</div></div>';
    yzUstBarEkle('⚔️ Takım & Düello');
}
function yzSkCssYukle() {
    if (document.getElementById('yz-sk-css')) return;
    let st = document.createElement('style'); st.id = 'yz-sk-css';
    st.textContent = [
        '.yz-ust-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}.yz-kirinti{display:flex;align-items:center;gap:6px;font-size:13px}.yz-kirinti .yz-link{margin:0;font-size:13px}.yz-kirinti-ayrac{color:var(--text-muted)}.yz-ust-sag{margin-left:auto}',
        '.yz-sk{gap:10px}',
        '.yz-sk-adim{display:grid;grid-template-columns:34px 1fr;gap:12px;padding:14px;border-radius:18px;border:1px solid var(--border-color);background:var(--bg-panel)}',
        '.yz-sk-no{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;background:var(--accent-orange);color:#1a0d05}',
        '.yz-sk-icerik{display:flex;flex-direction:column;gap:8px;min-width:0}.yz-sk-baslik{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800}.yz-sk-baslik small{color:var(--text-muted);font-weight:700}.yz-sk-baslik .yz-link{margin:0 0 0 auto}',
        '.yz-sk-turler{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}@media (max-width:640px){.yz-sk-turler{grid-template-columns:1fr}}',
        '.yz-sk-tur{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:12px;border-radius:14px;border:1.5px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;text-align:left;cursor:pointer}.yz-sk-tur.aktif{border-color:var(--accent-orange);box-shadow:0 0 0 1px var(--accent-orange);background:color-mix(in srgb,var(--accent-orange) 10%,var(--bg-main))}',
        '.yz-sk-tur-ikon{font-size:24px}.yz-sk-tur b{font-size:14px}.yz-sk-tur small{font-size:11.5px;color:var(--text-muted)}',
        '.yz-sk-cipler{display:flex;flex-wrap:wrap;gap:6px}',
        '.yz-sk-takimlar{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}',
        '.yz-sk-takim{display:flex;flex-direction:column;gap:5px;padding:10px;border-radius:14px;border:1.5px solid var(--tr);background:var(--bg-main)}.yz-sk-takim-bas{display:flex;justify-content:space-between;align-items:baseline;color:var(--tr)}.yz-sk-takim-bas small{color:var(--text-muted);font-size:11px}',
        '.yz-sk-uye{text-align:left;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);border-radius:10px;padding:8px 10px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}.yz-sk-uye.secili{border-color:var(--accent-orange);box-shadow:0 0 0 2px var(--accent-orange)}',
        '.yz-sk-tasi{border:1.5px dashed var(--accent-orange);background:transparent;color:var(--accent-orange);border-radius:10px;padding:7px;font:inherit;font-size:12px;font-weight:800;cursor:pointer}',
        '.yz-sk-gelismis{display:flex;flex-direction:column;gap:6px;padding-top:6px;border-top:1px dashed var(--border-color)}',
        '.yz-sk-alt{position:sticky;bottom:0;z-index:2;display:flex;flex-direction:column;gap:6px;padding:12px 0 4px;background:linear-gradient(transparent,var(--bg-main) 30%)}.yz-sk-alt .yz-btn{width:100%}',
        '.yz-sk-gecmis summary{cursor:pointer;font-size:12.5px;font-weight:700;color:var(--text-muted);padding:6px 0}'
    ].join('\n');
    document.head.appendChild(st);
}

['kmYarismaSkorbordCiz', 'kmYarismaBracketAgacCiz', 'kmYarismaBracketEslestirmeCiz', 'kmYarismaSiralamaCiz'].forEach(function (ad) {
    let eski = window[ad]; if (typeof eski !== 'function') return;
    window[ad] = function () { let r = eski.apply(this, arguments); if (_yz.mod === 'takim') yzUstBarEkle('⚔️ Takım & Düello'); return r; };
});

// ---------------------------------------------------------------- stil
function yzCssYukle() {
    yzEkCssYukle(); yzEk2CssYukle(); yzSkCssYukle();
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
