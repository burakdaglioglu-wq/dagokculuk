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
// Seri (set) sayısı ve seri başına ok ayrı seçilir (2026-10-05, kullanıcı: "12 set veya 16 set gibi olsun").
// Hazır formatlarla aynı düşen seçim eski anahtarı kullanır (tam/yarim/salon) — geçmiş turlarla kıyas ve rekorlar bozulmasın;
// diğerleri "s<seri>o<ok>" anahtarıyla (ör. s16o6 = 96 ok). 8+ çift seride yarıda mola.
const YZ_SERI_SECENEK = [6, 10, 12, 16, 20], YZ_OK_SECENEK = [3, 6];
function yzFormatBul(key) {
    if (YZ_FORMAT[key]) return YZ_FORMAT[key];
    let m = /^s(\d{1,2})o(\d)$/.exec(key || '');
    if (!m) return YZ_FORMAT.tam;
    let seri = Math.max(1, Math.min(40, +m[1])), ok = Math.max(1, Math.min(6, +m[2]));
    return { ad: seri * ok + ' ok · ' + seri + ' seri × ' + ok, kisa: seri * ok + ' ok · ' + seri + ' seri', seri: seri, ok: ok, yari: seri >= 8 && seri % 2 === 0 ? seri / 2 : 0 };
}
function yzFormatAnahtar(seri, ok) {
    let hazir = Object.keys(YZ_FORMAT).filter(function (k) { return YZ_FORMAT[k].seri === seri && YZ_FORMAT[k].ok === ok; })[0];
    return hazir || ('s' + seri + 'o' + ok);
}
function yzKurSeriOk(a, v) { let t = yzKurulumTaslak(), f = yzFormatBul(t.format), seri = a === 'seri' ? v : f.seri, ok = a === 'ok' ? v : f.ok; t.format = yzFormatAnahtar(seri, ok); if (a === 'ok' && t.sure && YZ_SURELER.indexOf(t.sure) !== -1) t.sure = yzVarsayilanSure(t.format); yzCiz(); }
function yzFormat(d) { return yzFormatBul((d && d.ayar && d.ayar.format) || 'tam'); }
// Seri süresi (sn) — kullanıcı seçer (90/120/150/180/240 ya da özel); seçilmemişse WA varsayılanı: 6 ok 240, 3 ok 120.
const YZ_SURELER = [90, 120, 150, 180, 240];
function yzVarsayilanSure(format) { return yzFormatBul(format).ok >= 6 ? 240 : 120; }
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
function yzRoster() { return (typeof kmYarismaListe === 'function' ? kmYarismaListe() : (typeof _kmListe !== 'undefined' ? _kmListe : [])).filter(function (k) { return turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; }); }
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
    yzUstBarEkle('⚔️ Takım & Düello', YZ_TK_TV_BTN);
}
function yzTurlereDon() { yzModAyarla('secim'); kmYarismaGiris(); }

// ---------------------------------------------------------------- 1) tür seçimi
function yzSecimCiz() {
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    let o = yzOku(), d = o.durum, suren = d && d.asama && d.asama !== 'kurulum';
    ic.innerHTML = '<div class="yz"><div class="yz-sayfa-bas"><div><div class="yz-baslik">🏆 Yarışma</div><div class="yz-alt">Ne tür bir yarışma yapacaksınız?</div></div></div>'
        + '<div class="yz-turler">'
        + '<button class="yz-tur ana" onclick="yzModAyarla(\'siralama\'); yzCiz()"><span class="yz-tur-rozet">Önerilen</span><span class="yz-tur-ikon">🏹</span><span class="yz-tur-ad">Sıralama Turu</span>'
        + '<span class="yz-tur-acik">Gerçek yarışma temposu: 12, 16 ya da 20 set (3 ya da 6 ok), süreli seriler, hedef ataması, canlı sıralama. Skorlar tabletten girilir, <b>📺 TV ekranında</b> herkes anında görür.</span>'
        + (suren ? '<span class="yz-tur-durum">● Süren tur var — dokun ve devam et</span>' : '<span class="yz-tur-durum sakin">72 ok · 36 ok · 60 ok salon</span>') + '</button>'
        + '<button class="yz-tur" onclick="yzModAyarla(\'takim\'); kmYarismaGiris()"><span class="yz-tur-ikon">⚔️</span><span class="yz-tur-ad">Takım &amp; Düello Maçları</span>'
        + '<span class="yz-tur-acik">1v1 – 4v4 takım maçları, set sistemi, eleme ağacı. Ders içi eğlenceli rekabet için.</span><span class="yz-tur-durum sakin">Klasik Yarışma modu</span></button>'
        + '</div></div>';
    yzUstBarEkle(null);
}

// ---------------------------------------------------------------- 2) sıralama turu
function yzCiz() {
    if (typeof _kmAktifSekme !== 'undefined' && _kmAktifSekme && _kmAktifSekme !== 'yarisma') { if (_yz.tv) yzTvCiz(); yzKarmaDokCiz(); yzTimerBaslat(); return; }
    if (_yz.mod !== 'siralama') yzModAyarla('siralama');
    let ic = document.getElementById('km-icerik'), o = yzOku(), d = o.durum;
    if (ic) {
        if (!d || !d.asama || d.asama === 'kurulum') ic.innerHTML = yzKurulumHTML();
        else if (d.asama === 'bitti') ic.innerHTML = yzSonucHTML(o);
        else if (d.asama === 'eleme') ic.innerHTML = yzElemeHTML(o);
        else ic.innerHTML = yzTurHTML(o);
        let yk = ic.querySelector('.yz'); if (yk) yk.setAttribute('data-yzt', yzAnaTema());
        yzUstBarEkle('🏹 Sıralama Turu');
    }
    if (_yz.tv) yzTvCiz(); // TV'den yapılan işlemler (skor, süre, sonraki seri) TV'yi de hemen yeniler
    yzTimerBaslat();
}
// ---- kurulum (bu cihazda taslak; "Başlat" ile ortak kayda yazılır)
function yzKurulumTaslak() {
    let roster = yzRoster();
    if (!_yz.kurulum) _yz.kurulum = { katilimci: roster.map(function (k) { return k.g + '|' + k.ad; }), mesafe: '18m', sure: 90, yuz: '6', format: 'tam', hedefBasi: 3, kayit: true }; // hazır kalıp: 18 m · 90 sn · 6 halka
    // 2026-10-14: taslak ilk açılışta kuruluyordu → derse SONRADAN eklenen sporcu listede seçilmemiş çıkıyordu. Görülen
    // her ders sporcusu bir kez kendiliğinden seçilir; koç sonra kaldırırsa (bilinen'de olduğu için) geri eklenmez.
    let t0 = _yz.kurulum; if (!t0.bilinen) { t0.bilinen = {}; t0.katilimci.forEach(function (k) { t0.bilinen[k] = 1; }); roster.forEach(function (r) { t0.bilinen[r.g + '|' + r.ad] = 1; }); }
    roster.forEach(function (r) { let k = r.g + '|' + r.ad; if (!t0.bilinen[k]) { t0.bilinen[k] = 1; if (t0.katilimci.indexOf(k) === -1) t0.katilimci.push(k); } });
    _yz.kurulum.katilimci = _yz.kurulum.katilimci.filter(function (k) { return yzSporcuVar(k); });
    return _yz.kurulum;
}
function yzKurulumHTML() {
    let t = yzKurulumTaslak(), roster = yzRoster(), f = yzFormatBul(t.format);
    let cip = function (ad, aktif, fn) { return '<button class="yz-cip' + (aktif ? ' aktif' : '') + '" onclick="' + fn + '">' + ad + '</button>'; };
    let hedefSay = Math.ceil(t.katilimci.length / t.hedefBasi);
    return '<div class="yz">'
        + '<div class="yz-sayfa-bas"><div><div class="yz-baslik">🏹 Sıralama Turu</div><div class="yz-alt">Gerçek yarışma provası. Her seri süreli; skorlar hedefe gidilince tabletten girilir, TV ekranında canlı sıralama görünür.</div></div></div>'
        + yzKategoriKartHTML(t, roster)
        + (typeof kmKarmaMi === 'function' && kmKarmaMi() ? '<div class="yz-bilgi" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>🔀 Karma ders: yalnız <b>Yarışma</b> hattındakiler burada; diğerleri Oyunlar\'da ilerliyor.</span><button class="yz-btn" onclick="kmHatPanelAc()">Hatları düzenle</button></div>' : '<div class="yz-ipucu">Aynı derste küçükler oyun oynasın mı? <button class="yz-link" onclick="kmHatPanelAc()">🔀 Ders hatları →</button></div>')
        + '<div class="yz-kart"><div class="yz-etiket">Sporcular <b>' + t.katilimci.length + '</b> <span class="yz-etiket-btn"><button class="yz-link" onclick="yzKurTumu(true)">Tümü</button> · <button class="yz-link" onclick="yzKurTumu(false)">Hiçbiri</button></span></div>'
        + (roster.length ? '<div class="yz-cipler">' + roster.map(function (k, i) { return cip(esc(k.ad), t.katilimci.indexOf(k.g + '|' + k.ad) !== -1, 'yzKurSporcu(' + i + ')'); }).join('')
            + t.katilimci.filter(function (k) { return !roster.some(function (r) { return r.g + '|' + r.ad === k; }); }).map(function (k) { return cip(esc(yzKAd(k)) + ' ✕', true, 'yzKurDisCikar(\'' + yzEnc(k) + '\')'); }).join('') + '</div>' : '<div class="yz-alt">Ders listesi boş — aşağıdan sporcu ara.</div>')
        + '<div style="margin-top:10px"><button class="yz-btn" onclick="yzSporcuSecici(\'kurulum\')">🔍 Listede olmayan sporcu ekle</button></div>'
        + '</div>'
        + '<div class="yz-kart yz-kur-izgara">'
        + '<div><div class="yz-etiket">Mesafe</div><div class="yz-cipler">' + ['18m', '20m', '30m', '50m', '60m', '70m'].map(function (m) { return cip(m, t.mesafe === m, 'yzKurAyar(\'mesafe\',\'' + m + '\')'); }).join('') + '</div></div>'
        + '<div><div class="yz-etiket">Seri (set) sayısı</div><div class="yz-cipler">' + YZ_SERI_SECENEK.map(function (n) { return cip(n + ' set', f.seri === n, 'yzKurSeriOk(\'seri\',' + n + ')'); }).join('') + '</div>'
        + '<div class="yz-etiket" style="margin-top:10px">Seri başına ok</div><div class="yz-cipler">' + YZ_OK_SECENEK.map(function (n) { return cip(n + ' ok', f.ok === n, 'yzKurSeriOk(\'ok\',' + n + ')'); }).join('') + '</div>'
        + '<div class="yz-alt">Toplam <b>' + f.seri * f.ok + ' ok</b>' + (t.format === 'tam' ? ' · WA 72 ok sıralama formatı' : t.format === 'salon' ? ' · salon formatı' : '') + (f.yari ? ' · ' + f.yari + '. setten sonra mola' : '') + '</div></div>'
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
function yzKurDisCikar(kEnc) { let t = yzKurulumTaslak(), k = decodeURIComponent(kEnc), j = t.katilimci.indexOf(k); if (j !== -1) t.katilimci.splice(j, 1); yzCiz(); }
function yzKurTumu(hepsi) { let t = yzKurulumTaslak(); t.katilimci = hepsi ? yzRoster().map(function (k) { return k.g + '|' + k.ad; }) : []; yzCiz(); }
function yzKurAyar(a, v) { yzKurulumTaslak()[a] = v; if (a !== 'kayit') yzCiz(); }
function yzHedefAta(katilimci, hb) { let h = {}; katilimci.forEach(function (k, i) { h[k] = (Math.floor(i / hb) + 1) + 'ABCD'.charAt(i % hb); }); return h; }
function yzBaslat() {
    let t = yzKurulumTaslak(); if (!t.katilimci.length) return showToast('Sporcu seç.', 'error');
    let id = 'yp' + Date.now().toString(36);
    yzGuncelle(function (o) {
        yzTurTemizle(o); // önceki turların skorları
        o.durum = { asama: 'tur', id: id, ayar: { kategori: t.kategori || 'serbest', mesafe: t.mesafe, format: t.format, kayit: !!t.kayit, hedefBasi: t.hedefBasi, sure: t.sure || yzVarsayilanSure(t.format), yuz: t.yuz || '6' }, katilimci: t.katilimci.slice(), hedefler: yzHedefAta(t.katilimci, t.hedefBasi), seri: 0, basla: Date.now() };
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
        + '<div class="yz-tur-bilgi"><div class="yz-ust-etiket">' + yzKatEtiket(d) + 'SIRALAMA TURU · ' + esc(d.ayar.mesafe) + ' · ' + f.kisa + '</div><div class="yz-seri-no">SERİ <b>' + (seri + 1) + '</b><span>/' + f.seri + '</span></div>'
        + (f.yari ? '<div class="yz-yari">' + (seri < f.yari ? '1. yarı' : '2. yarı') + '</div>' : '') + '</div>'
        + '<div class="yz-sayac-kap">' + yzSayacHTML(o, 'yz-sayac') + '<div class="yz-sayac-btn">' + (o.sayac ? '<button class="yz-btn" onclick="yzSayacDurdur()">⏹ Sıfırla</button>' : '<button class="yz-btn yesil" onclick="yzSayacBaslat()">▶ Süreyi başlat</button>') + '<button class="yz-btn" onclick="yzSureMenu()" title="Seri süresini değiştir">⏱ ' + yzSure(d) + ' sn</button>' + yzDevBtnHTML() + '</div></div>'
        + '<div class="yz-tur-btn">' + (typeof kmKarmaMi === 'function' && kmKarmaMi() ? '<button class="yz-btn" onclick="kmKarmaOyunaGec()" title="Oyun hattına geç">🎮 Oyunlar</button>' : '') + (yzYuvaVarMi() ? '<button class="yz-btn" onclick="yzYuvayaGec()" title="Yumurta Yuvası — tur sürer, süre orada da görünür">🥚 Yumurta</button>' : '') + '<button class="yz-btn tv" onclick="yzTvAc()">📺 TV ekranı</button><button class="yz-btn" onclick="yzVideoAc()" title="5 sn gecikmeli ayna, canlı kamera ya da video — sporcu kendini görsün">🎥 Ayna / Video</button><button class="yz-btn" onclick="yzHedeflerAc()">🎯 Hedefler</button><button class="yz-btn" onclick="yzAnaTemaAc()" title="Ekran teması">🎨 Tema</button><button class="yz-btn" onclick="yzSporcuSecici(\'tur\')">👥 Sporcular (' + d.katilimci.length + ')</button><button class="yz-btn" onclick="yzMenu()" aria-label="Diğer">⋯</button></div>'
        + '</div>'
        + (yariArasi ? '<div class="yz-bilgi">☕ 1. yarı bitti — kısa mola. Hazır olunca süreyi başlat.</div>' : '')
        + yzYenilerHTML(o, false)
        + '<div class="yz-ilerleme"><div class="yz-bar"><i style="width:' + Math.round(girilen / Math.max(1, d.katilimci.length) * 100) + '%"></i></div><span><b>' + girilen + '/' + d.katilimci.length + '</b> sporcu bu seriyi girdi</span>' + (seri > 0 ? '<button class="yz-btn" onclick="yzOncekiSeri()" title="Önceki seriye dön (skorlar silinmez)">◀ ' + seri + '. seri</button>' : '') + ilerlemeBtn + '</div>'
        + (Object.keys(o[yzHpKey(d.id)] || {}).length ? '' : '<div class="yz-ipucu">🎯 Sporculara kişisel hedef puan ver → TV\'de <b>tempo</b> (bu gidişle bitiş) hedefe göre yeşil/kırmızı görünür. <button class="yz-link" onclick="yzHedeflerAc()">Hedefleri gir →</button></div>')
        + '<div class="yz-hedefler">' + hedefHTML + '</div>'
        + yzYarisGrafikKartHTML(o, sira, false)
        + '<div class="yz-kart yz-tablo-kart"><div class="yz-etiket">Canlı sıralama <span class="yz-alt">· hücreye dokun → o seriyi düzelt</span>' + yzGorunumKontrolHTML(o) + '</div><div class="yz-tablo-kap">' + yzGorunumHTML(o, sira, { kompakt: true, duzenle: true }) + '</div></div>'
        + yzOyunHattiKartHTML()
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
    bas += '<th class="top">TOPLAM</th>' + (sec.gelisim ? '<th class="gel">GELİŞİM</th>' : '') + '<th class="tmp">' + (aktif >= 0 ? (sira.some(function (r) { return r.hedefPuan; }) ? '🎯 HEDEF PUAN' : 'TEMPO') : 'HEDEF') + '</th><th class="on">10+X</th><th class="x">X</th>';
    let govde = sira.map(function (r, idx) {
        let hr = '', ayrac = sec.gelisim && idx === 3 ? '<tr class="yz-ayrac"><td colspan="40">📈 EN ÇOK GELİŞENLER · kendi ortalamasına göre (ilk 3 gerçek puana göre)</td></tr>' : '';
        if (sec.hareket) { let p = onceki[r.k]; hr = '<td class="hr">' + (p && p > r.sira ? '<span class="yuk">▲' + (p - r.sira) + '</span>' : p && p < r.sira ? '<span class="dus">▼' + (r.sira - p) + '</span>' : '') + '</td>'; }
        let tr = ayrac + '<tr class="' + (r.sira <= 3 && r.toplam > 0 ? 'p' + r.sira : '') + (sec.yeni && sec.yeni[r.k] ? ' yeni' : '') + (sec.tvGiris ? ' tv-tik' : '') + '" data-k="' + esc(r.k) + '"' + (sec.tvGiris ? ' onclick="yzTvSatir(\'' + yzEnc(r.k) + '\')"' : '') + '><td class="sira">' + r.sira + '</td>' + hr + '<td class="hdf">' + esc(r.hedef) + '</td><td class="ad">' + esc(sec.kompakt ? yzKisaAd(r.ad) : r.ad) + '</td>';
        for (let i = 0; i < f.seri; i++) {
            let v = r.seriT[i], cls = 's' + (i === aktif ? ' aktif' : '') + (v == null ? ' bos' : ''), ic = v == null ? '·' : '<span class="yz-sv ' + yzSeriBant(v, f.ok) + '">' + v + '</span>';
            tr += sec.duzenle && (v != null || i <= aktif) ? '<td class="' + cls + ' tik" onclick="event.stopPropagation(); yzGirisAc(\'' + yzEnc(r.k) + '\',' + i + ')">' + ic + '</td>' : '<td class="' + cls + '">' + ic + '</td>';
            if (f.yari && i === f.yari - 1) tr += '<td class="yari">' + (r.y1 || '·') + '</td>';
        }
        if (f.yari) tr += '<td class="yari">' + (r.y2 || '·') + '</td>';
        let liderTop = sira.length ? Math.max.apply(null, sira.map(function (x) { return x.toplam; })) : 0;
        return tr + '<td class="top">' + r.toplam + (sec.tvGiris || d.asama === 'bitti' ? '<i class="yz-lider-cub"><b style="width:' + (liderTop ? (r.toplam / liderTop * 100).toFixed(1) : 0) + '%"></b></i>' : '') + '</td>' + (sec.gelisim ? yzGelisimHucre(r, idx >= 3 && r.gelisim != null && r.gelisim === enIyi && enIyi > 0) : '') + yzTempoHucre(r, aktif < 0) + '<td class="on">' + r.on + '</td><td class="x">' + r.x + '</td></tr>';
    }).join('');
    return '<table class="yz-tablo' + (sec.kompakt ? ' kompakt' : '') + '"><thead><tr>' + bas + '</tr></thead><tbody>' + govde + '</tbody></table>';
}
function yzSonrakiSeri(zorla) {
    let o = yzOku(), d = o.durum; if (!d) return;
    let f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1), bek = yzBekleyenler(o, seri);
    let git = function () {
        if (seri >= f.seri - 1) return yzBitir(true);
        yzGuncelle(function (x) { if (x.durum && x.durum.id === d.id && x.durum.seri === d.seri) { x.durum.seri = seri + 1; x.sayac = null; } });
        if (bek.length && zorla === true) showToast(bek.length + ' sporcu ' + (seri + 1) + '. seride boş kaldı — tablodaki hücreye dokunup sonradan girebilirsin.', 'warning');
        yzCiz();
    };
    if (bek.length && zorla === true && seri < f.seri - 1) return git();
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
        + '<button class="yz-btn" onclick="document.getElementById(\'onay-modal\').style.display=\'none\'; yzSporcuSecici(\'tur\')">👥 Sporcu ekle / çıkar</button>'
        + (false && disari.length ? '<div style="font-size:12px;color:var(--text-muted)">Tura sporcu ekle (kaçırdığı seriler boş kalır):</div><div style="display:flex;flex-wrap:wrap;gap:6px">' + disari.map(function (r) { return '<button class="yz-cip" onclick="yzSporcuEkle(\'' + yzEnc(r.g + '|' + r.ad) + '\')">+ ' + esc(r.ad) + '</button>'; }).join('') + '</div>' : '')
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
    document.getElementById('onay-modal').style.display = 'none'; yzCiz(); if (_yz.tv) yzTvCiz(); showToast(yzKAd(k) + ' tura eklendi', 'success');
}
// ---- 🆕 Derse yeni gelenler (2026-10-14, kullanıcı: "yarışma devam ederken sporcu eklemeyi düzelt"). Tur sürerken derse
// eklenen sporcu tura kendiliğinden girmez (seri sırası, hedef ataması bozulmasın) ama tur ekranında ve TV'de şerit çıkar:
// "Tura ekle". Karma derste hattı henüz seçilmemiş (yeni gelen) sporcular da sayılır; eklenince Yarışma hattına alınır.
// "Yok say" / turdan çıkarma → d.cikarilan (ortak kayıt) → bir daha sorulmaz.
function yzDersYenileri(o) {
    let d = o.durum; if (!d || d.asama !== 'tur') return [];
    let h = typeof kmHatlar === 'function' ? kmHatlar() : {}, karma = typeof kmKarmaMi === 'function' && kmKarmaMi(), cik = d.cikarilan || [];
    return (typeof _kmListe !== 'undefined' ? _kmListe : []).filter(function (s) {
        let k = s.g + '|' + s.ad; if (d.katilimci.indexOf(k) !== -1 || cik.indexOf(k) !== -1 || !yzSporcuVar(k)) return false;
        return !karma || h[k] === 'yarisma' || !h[k];
    }).map(function (s) { return s.g + '|' + s.ad; });
}
function yzYenilerHTML(o, tv) {
    let y = yzDersYenileri(o); if (!y.length) return '';
    let ad = function (k) { return esc(yzKisaAd(yzKAd(k))); };
    if (tv) return '<div class="yz-tv-yeniler">🆕 Derse yeni geldi: <b>' + y.slice(0, 4).map(ad).join(', ') + (y.length > 4 ? ' +' + (y.length - 4) : '') + '</b><button class="yz-tv-k ana" onclick="yzYenileriEkle()">+ Tura ekle</button><button class="yz-tv-k" onclick="yzYenileriYoksay()">Yok say</button></div>';
    return '<div class="yz-bilgi yz-yeniler"><span>🆕 Derse yeni geldi: ' + y.map(function (k) { return '<button class="yz-cip" onclick="yzYenileriEkle(\'' + yzEnc(k) + '\')" title="Tura ekle">+ ' + ad(k) + '</button>'; }).join(' ') + '</span>'
        + '<span style="display:flex;gap:6px">' + (y.length > 1 ? '<button class="yz-btn ana" onclick="yzYenileriEkle()">Hepsini tura ekle</button>' : '') + '<button class="yz-btn" onclick="yzYenileriYoksay()">Yok say</button></span></div>';
}
function yzHattaAl(k) {
    try { if (typeof kmKarmaMi === 'function' && kmKarmaMi() && typeof kmHatlar === 'function') { let h = kmHatlar(); if (h[k] !== 'yarisma') { h[k] = 'yarisma'; kmHatKaydet(h); if (typeof kmHatHafizaKaydet === 'function') kmHatHafizaKaydet([k], h); } } } catch (e) {}
}
function yzTuraEkleKayit(o, k) {
    let d = o.durum; if (!d || d.katilimci.indexOf(k) !== -1) return;
    d.katilimci.push(k); d.cikarilan = (d.cikarilan || []).filter(function (x) { return x !== k; });
    d.hedefler = d.hedefler || {};
    if (!d.hedefler[k]) { let hb = d.ayar.hedefBasi || 3, n = d.katilimci.length - 1; d.hedefler[k] = (Math.floor(n / hb) + 1) + 'ABCD'.charAt(n % hb); }
}
function yzYenileriEkle(kEnc) {
    let liste = kEnc ? [decodeURIComponent(kEnc)] : yzDersYenileri(yzOku());
    if (!liste.length) return;
    let kayit = yzOku().durum && yzOku().durum.ayar.kayit;
    yzGuncelle(function (o) { liste.forEach(function (k) { yzTuraEkleKayit(o, k); }); });
    liste.forEach(function (k) { yzHattaAl(k); if (kayit) { let i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)] && turnuvaDB[k.slice(0, i)][k.slice(i + 1)]; if (sp && !sp.devamModu) { sp.devamModu = true; sp.lastModified = Date.now(); } } });
    showToast('➕ ' + (liste.length > 1 ? liste.length + ' sporcu' : yzKAd(liste[0])) + ' tura eklendi — kaçırdığı seriler boş, tablodan girebilirsin', 'success');
    yzCiz(); if (_yz.tv) yzTvCiz();
}
function yzYenileriYoksay() { let liste = yzDersYenileri(yzOku()); yzGuncelle(function (o) { if (o.durum) o.durum.cikarilan = (o.durum.cikarilan || []).concat(liste); }); yzCiz(); if (_yz.tv) yzTvCiz(); }
// Ders listesinde olmayan sporcu tura/kuruluma eklenince derse de eklenir (Skor Gir, yoklama, karne onu da görsün).
function yzDerseEkle(k) {
    if (typeof _kmListe === 'undefined') return false;
    let i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1);
    if (_kmListe.some(function (s) { return s.g === g && s.ad === ad; })) return false;
    _kmListe.push({ g: g, ad: ad });
    try { if (typeof _kmListeKaydet === 'function') _kmListeKaydet(); } catch (e) {}
    try { if (typeof kmSinifKartiCiz === 'function') kmSinifKartiCiz(); } catch (e) {}
    return true;
}
// Serileri geri al: yanlışlıkla geçilen seriye dönmek için (skorlar silinmez).
function yzOncekiSeri() {
    let d = yzOku().durum; if (!d || d.asama !== 'tur' || d.seri <= 0) return;
    let f = yzFormat(d), simdi = Math.min(d.seri, f.seri - 1);
    yzGuncelle(function (x) { if (x.durum && x.durum.id === d.id) { x.durum.seri = simdi - 1; x.sayac = null; } });
    showToast('◀ ' + simdi + '. seriye dönüldü', 'success'); yzCiz();
}
function yzIptal() {
    onayIste('Tur iptal edilsin mi? Tablo silinir (karneye işlenmiş oklar karnede kalır).', function () {
        yzGuncelle(function (o) { yzTurTemizle(o); o.durum = null; o.sayac = null; });
        yzCiz();
    }, 'İptal et');
}
function yzYeniTur() { yzGuncelle(function (o) { yzTurTemizle(o); o.durum = null; o.sayac = null; }); yzTorenKapatYerel(); yzCiz(); }

// ---- ok girişi (tablet) — gövdede ayrı pencere: uzaktan gelen yeniden çizimler girişi bozmaz
function yzGirisAc(kEnc, seri) {
    let k = decodeURIComponent(kEnc), o = yzOku(), d = o.durum; if (!d) return;
    let mevcut = yzSkor(o, k)[seri];
    let mk = ((o[yzPKey(d.id, k)] || [])[seri]) || null;
    _yz.giris = { k: k, seri: seri, id: d.id, oklar: mevcut ? mevcut.slice() : [], konumlar: mevcut ? (mk && mk.length === mevcut.length ? mk.slice() : mevcut.map(function () { return null; })) : [], duzeltme: !!mevcut };
    yzGirisCiz();
}
// ---- 2026-10-14 (kullanıcı: "TV'de bir sporcunun serisini girmedim ama diğer seriye geçmek istiyorum, yapamıyorum"). Kaydedince
// pencere sıradaki sporcuya geçiyor ve TV'nin önünü kapatıyordu; içinden çıkış yolu yalnız ✕'ti. Artık pencerede:
// bu serinin bekleyenleri (dokun → ona geç), ⏭ Atla (kaydetmeden sıradakine), ▶ Seriyi geç (bekleyenler boş kalır, onay sormaz),
// ve seri tamamlanınca "✅ seri tamam" ekranı: ▶ sonraki seri / ▶ sonraki seri + süreyi başlat / 🏁 turu bitir.
function yzGirisBekleyenler(o, g) { let d = o.durum; return yzHedefSirasi(o).filter(function (x) { return x !== g.k && !yzSkor(o, x)[g.seri]; }).filter(function () { return d; }); }
function yzGirisAtla() {
    let g = _yz.giris; if (!g || g.tip) return; let o = yzOku(), sira = yzHedefSirasi(o), i = sira.indexOf(g.k);
    let aday = sira.slice(i + 1).concat(sira.slice(0, i)).find(function (x) { return !yzSkor(o, x)[g.seri]; });
    if (aday) yzGirisAc(yzEnc(aday), g.seri); else { showToast('Bu seride başka bekleyen yok.', 'success'); }
}
function yzGirisSeriGec(sureBaslat) {
    let g = _yz.giris; _yz.giris = null; yzGirisCiz();
    let d = yzOku().durum; if (!d) return; let f = yzFormat(d);
    if (Math.min(d.seri, f.seri - 1) >= f.seri - 1) return yzBitir();
    yzSonrakiSeri(true);
    if (sureBaslat) setTimeout(yzSayacBaslat, 50);
    if (g && _yz.tv) yzTvCiz();
}
function yzGirisTamamHTML(g, o, d) {
    let f = yzFormat(d), son = g.seri >= f.seri - 1, sonraki = g.seri + 2;
    return '<div class="yz-giris yz-giris-tamam" role="dialog" aria-modal="true" aria-label="Seri tamam">'
        + '<div class="yz-giris-bas"><div><b style="font-size:20px">✅ ' + (g.seri + 1) + '. seri tamam!</b><div class="yz-alt">' + d.katilimci.length + ' sporcunun hepsi girildi' + (f.yari && g.seri + 1 === f.yari ? ' · ☕ 1. yarı bitti, mola zamanı' : '') + '</div></div><button class="yz-btn" onclick="yzGirisKapat()" aria-label="Kapat">✕</button></div>'
        + '<div class="yz-tamam-btnlar">'
        + (son ? '<button class="yz-btn ana buyuk" onclick="yzGirisKapat(); yzBitir()">🏁 Turu bitir — sonuçlar</button>'
            : '<button class="yz-btn ana buyuk" onclick="yzGirisSeriGec(true)">▶ ' + sonraki + '. seri + süreyi başlat</button><button class="yz-btn buyuk" onclick="yzGirisSeriGec(false)">▶ ' + sonraki + '. seriye geç (süre sonra)</button>')
        + '<button class="yz-btn" onclick="yzGirisKapat()">Kapat — tabloya bak</button></div>'
        + '<div class="yz-alt" style="text-align:center">Enter: ' + (son ? 'turu bitir' : 'sonraki seri + süre') + ' · Esc: kapat</div></div>';
}
// 🎥 Video analiz (2026-10-15, kullanıcı: "sözlü uyarılamıyor, gözüyle kendini görmesi gerekiyor" + "5 sn gecikmeli aynayı da buraya al")
// — pencere dagsk-km-video.js (kv*), ilk açılışta yüklenir. kEnc verilirse o sporcunun adıyla açılır, Form Lab'a o sporcu seçili gider.
function yzVideoAc(kEnc) {
    let k = kEnc ? decodeURIComponent(kEnc) : null;
    let ac = function () { kvAc(k, 'ayna'); };
    if (typeof kvAc === 'function') return ac();
    (typeof dagskEkYukle === 'function' ? dagskEkYukle('dagsk-km-video.js') : Promise.reject()).then(ac).catch(function () { if (typeof showToast === 'function') showToast('Video aracı yüklenemedi.', 'error'); });
}
function yzGirisCiz() {
    let g = _yz.giris, kap = document.getElementById('yz-giris');
    if (!g) { if (kap) kap.remove(); document.removeEventListener('keydown', yzGirisTus, true); return; }
    let o = yzOku(), d = o.durum; if (!d) { _yz.giris = null; return yzGirisCiz(); }
    if (g.tamamEkrani) {
        if (!kap) { kap = document.createElement('div'); kap.id = 'yz-giris'; kap.className = 'yz-giris-arka'; kap.addEventListener('click', function (e) { if (e.target === kap) yzGirisKapat(); }); (document.fullscreenElement && document.fullscreenElement !== document.documentElement ? document.fullscreenElement : document.body).appendChild(kap); document.addEventListener('keydown', yzGirisTus, true); }
        kap.innerHTML = yzGirisTamamHTML(g, o, d); return;
    }
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
    if (!kap) { kap = document.createElement('div'); kap.id = 'yz-giris'; kap.className = 'yz-giris-arka'; kap.addEventListener('click', function (e) { if (e.target === kap) yzGirisKapat(); }); (document.fullscreenElement && document.fullscreenElement !== document.documentElement ? document.fullscreenElement : document.body).appendChild(kap); document.addEventListener('keydown', yzGirisTus, true); }
    let slotlar = ''; for (let i = 0; i < okSay; i++) { let p = g.oklar[i]; slotlar += '<span class="yz-ok ' + (p ? yzOkRenk(p) : 'bos') + '">' + (p || '') + '</span>'; }
    let tus = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].map(function (p) { return '<button class="yz-tus ' + yzOkRenk(p) + '" onclick="yzOkEkle(\'' + p + '\')"' + (g.oklar.length >= okSay ? ' disabled' : '') + '>' + p + '</button>'; }).join('');
    let dolu = g.oklar.length >= okSay;
    kap.innerHTML = '<div class="yz-giris" role="dialog" aria-modal="true" aria-label="Skor girişi">'
        + '<div class="yz-giris-bas"><div><span class="yz-sp-hedef">' + esc(g.tip ? (g.taraf === 'a' ? 'A' : 'B') : ((d.hedefler || {})[g.k] || '')) + '</span> <b>' + esc(yzKAd(g.k)) + '</b><div class="yz-alt">' + altSatir + '</div></div><div style="display:flex;gap:6px">' + (g.k ? '<button class="yz-btn" onclick="yzVideoAc(\'' + encodeURIComponent(g.k) + '\')" title="Kendini görsün: gecikmeli ayna, canlı ya da video">🎥 Video</button>' : '') + '<button class="yz-btn" onclick="yzGirisKapat()" aria-label="Kapat">✕</button></div></div>'
        + '<div class="yz-giris-mod"><button class="' + (yzGirisHedefMi() ? 'aktif' : '') + '" onclick="yzGirisModSec(\'hedef\')">🎯 Hedefe dokun</button><button class="' + (yzGirisHedefMi() ? '' : 'aktif') + '" onclick="yzGirisModSec(\'tus\')">🔢 Tuşlar</button></div>'
        + '<div class="yz-oklar">' + slotlar + '</div>'
        + '<div class="yz-giris-top">' + topSatir + '</div>'
        + (yzGirisHedefMi() ? yzHedefGirisHTML(g, d, okSay) : '<div class="yz-tuslar">' + tus + '</div>')
        + '<div class="yz-giris-alt"><button class="yz-btn" onclick="yzOkSil()"' + (g.oklar.length ? '' : ' disabled') + '>⌫ Geri al</button>'
        + '<label class="yz-onay kucuk"><input type="checkbox"' + (_yz.siradaki ? ' checked' : '') + ' onchange="_yz.siradaki=this.checked; try{localStorage.setItem(\'dag_yz_siradaki\', this.checked?\'1\':\'0\')}catch(e){}"> Kaydedince sıradakine geç</label>'
        + '<button class="yz-btn ana buyuk" onclick="yzGirisKaydet()"' + (dolu ? '' : ' disabled') + '>💾 Kaydet</button></div>'
        + (g.tip ? '' : yzGirisAkisHTML(o, g, d))
        + '<div class="yz-alt" style="text-align:center">Klavye: X · 0 = 10 · 1-9 · M · ⌫ · Enter</div>'
        + '</div>';
}
function yzGirisAkisHTML(o, g, d) {
    let f = yzFormat(d); if (g.seri !== Math.min(d.seri, f.seri - 1)) return ''; // eski seriyi düzeltiyorsa akış düğmeleri yok
    let bek = yzGirisBekleyenler(o, g), girilen = d.katilimci.filter(function (x) { return yzSkor(o, x)[g.seri]; }).length, son = g.seri >= f.seri - 1;
    return '<div class="yz-akis"><div class="yz-akis-bas"><span>Bu seri: <b>' + girilen + '/' + d.katilimci.length + '</b> girildi' + (bek.length ? ' · bekleyenler ↓' : '') + '</span>'
        + '<span class="yz-akis-btn">' + (bek.length ? '<button class="yz-btn" onclick="yzGirisAtla()" title="Kaydetmeden sıradaki sporcuya geç">⏭ Atla</button>' : '')
        + '<button class="yz-btn" onclick="yzGirisSeriGec(false)" title="Girilmeyenler boş kalır; sonradan tablodaki hücreye dokunup girebilirsin">' + (son ? '🏁 Turu bitir' : '▶ ' + (g.seri + 2) + '. seriye geç') + '</button></span></div>'
        + (bek.length ? '<div class="yz-akis-cip">' + bek.map(function (k) { return '<button class="yz-cip" onclick="yzGirisAc(\'' + yzEnc(k) + '\',' + g.seri + ')">' + esc((d.hedefler || {})[k] || '') + ' · ' + esc(yzKisaAd(yzKAd(k))) + '</button>'; }).join('') + '</div>' : '')
        + '</div>';
}
function yzGirisTus(e) {
    if (!_yz.giris) return;
    if (_yz.giris.tamamEkrani) {
        if (e.key === 'Enter') { e.preventDefault(); let d = yzOku().durum; if (d && _yz.giris.seri >= yzFormat(d).seri - 1) { yzGirisKapat(); yzBitir(); } else yzGirisSeriGec(true); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); yzGirisKapat(); }
        return;
    }
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
        else { _yz.giris = { tamamEkrani: true, seri: seri, id: yeni.durum.id, oklar: [] }; yzGirisCiz(); } // ✅ seri tamam ekranı
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
    try { otomatikYoklamaIsaretle(ad, g); } catch (e) {}
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
        let a = document.getElementById('yz-sayac'), b = document.getElementById('yz-tv-sayac'), c = document.getElementById('yz-oyun-sayac');
        if (!a && !b && !c) { clearInterval(_yz.timer); _yz.timer = null; yzDevSayacGuncelle(null); return; }
        let o = yzOku(), s = yzSayacDurum(o);
        if (c) yzOyunSayacEtiket(o, s);
        yzOyunHattiKartTazele();
        [a, b, c].forEach(function (el) { if (!el) return; el.className = 'yz-sayac ' + s.faz; el.querySelector('.yz-sayac-alt').textContent = s.alt; el.querySelector('.yz-sayac-sure').textContent = s.metin; });
        yzSesKontrol(o, s); yzDevSayacGuncelle(o, s);
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
        + '<div class="yz-sayfa-bas"><div><div class="yz-ust-etiket">' + yzKatEtiket(d) + 'SIRALAMA TURU · ' + esc(d.ayar.mesafe) + ' · ' + f.kisa + '</div><div class="yz-baslik">🏁 Sonuçlar</div></div>'
        + '<div class="yz-tur-btn"><button class="yz-btn tv" onclick="yzTvAc()">📺 TV ekranı</button><button class="yz-btn" onclick="yzAnaTemaAc()" title="Ekran teması">🎨 Tema</button><button class="yz-btn" onclick="yzRaporAc()">📋 Sporcu raporları</button><button class="yz-btn" onclick="yzPdf()">📄 Sonuç PDF</button><button class="yz-btn toren" onclick="yzTorenBaslat()">🏅 Madalya töreni</button><button class="yz-btn ana" onclick="yzYeniTur()">🔁 Yeni tur</button></div></div>'
        + (elemeVar ? yzPodyumHTML(o) : yzGruplar(o, sira).map(function (gr) { return yzPodyumGrupHTML(gr); }).join(''))
        + yzYarisGrafikKartHTML(o, sira, true)
        + elemeKart
        + '<div class="yz-kart yz-tablo-kart"><div class="yz-etiket">Sıralama turu' + yzGorunumKontrolHTML(o) + '</div><div class="yz-tablo-kap">' + yzGorunumHTML(o, sira, { duzenle: true }) + '</div></div>'
        + yzOyunHattiKartHTML()
        + yzTeknikKartHTML(o, sira)
        + '<div class="yz-kart yz-tablo-kart"><div class="yz-etiket">🎯 Ok dağılımı <span class="yz-alt" style="text-transform:none;letter-spacing:0;font-weight:600">· her değerden kaç ok · koyu hücre = çok</span></div><div class="yz-tablo-kap">' + yzDagilimTabloHTML(o, sira) + '</div></div>'
        + '</div>';
}

// ---------------------------------------------------------------- 📺 TV skor tablosu (sadece okur)
function yzTvAc() {
    _yz.tv = true; yzSesHazirla(); document.body.classList.add('yz-tv-acik'); document.documentElement.classList.add('yz-tv-kok');
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
    _yz.tvHam = null; _yz.tvSon = {}; _yz.tvSayfa = 0; yzTv2Css(); yzV240CssYukle();
    clearInterval(_yz.tvSayfaZ); _yz.tvSayfaZ = setInterval(function () { if ((_yz.tvSayfaSay || 1) > 1) { _yz.tvSayfa = ((_yz.tvSayfa || 0) + 1) % _yz.tvSayfaSay; yzTvSigdir(document.getElementById('yz-tv')); } }, 9000);
    yzTvCiz();
    clearInterval(_yz.tvPoll);
    // Ortak ders senkronu yerel kaydı güncelleyince (WS ile ~1 sn) burada fark edilir; ekran sadece değişince çizilir.
    _yz.tvPoll = setInterval(function () { let h = localStorage.getItem(yzAnahtar()), im = yzOyunImza() + '|' + (typeof _kmListe !== 'undefined' ? _kmListe.length : 0); if (h !== _yz.tvHam || im !== _yz.tvOyunImza) { _yz.tvOyunImza = im; yzTvCiz(); } }, 700);
    yzTimerBaslat();
}
function yzTvKapat(tamEkranKalsin) {
    _yz.tv = false; document.body.classList.remove('yz-tv-acik'); document.documentElement.classList.remove('yz-tv-kok'); clearInterval(_yz.tvPoll); _yz.tvPoll = null; clearInterval(_yz.tvSayfaZ);
    let el = document.getElementById('yz-tv'); if (el) el.remove();
    yzTorenKapatYerel();
    try { if (!tamEkranKalsin && document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    try { if (_yz.kilit) { _yz.kilit.release(); _yz.kilit = null; } } catch (e) {}
    document.removeEventListener('keydown', yzTvTus, true); window.removeEventListener('resize', yzTvCiz);
}
// 2026-10-04 (kullanıcı: "tam ekranda bazı veriler ekrana sığmıyor, görünüm biraz at yarışı gibi"): satır yüksekliği
// tahminle (pencere yüksekliğinin %74'ü) hesaplanıyordu, başlığın gerçek boyunu bilmiyordu → 1280×720 projeksiyonda 16
// sporcunun son 2'si görünmüyordu. Artık çizimden sonra tablonun gerçek alanı ölçülür; satırlar okunaklı boyda (≥30 px)
// sığmıyorsa tablo sayfalanır ve sayfalar 9 sn'de bir döner ("Sayfa 1/2"). Renkler sakinleştirildi (yzTv2Css).
// Genişliğe sığdırma (2026-10-05): 16-20 setlik turda satır yüksekliğinden gelen yazı boyu tabloyu yana taşırıyordu
// (sağdaki TOPLAM kesiliyordu). Yükseklik ayarından sonra tablo genişliği kutuyu aşıyorsa satır boyu orantılı küçültülür.
function yzTvGenislikSigdir(el, kutu) {
    for (let i = 0; i < 8 && kutu.scrollWidth > kutu.clientWidth + 1; i++) {
        let su = parseFloat(getComputedStyle(el).getPropertyValue('--yz-satir')) || 40;
        let yeni = Math.max(20, Math.floor(su * kutu.clientWidth / kutu.scrollWidth) - (i ? 1 : 0));
        if (yeni >= su) yeni = su - 1; if (yeni < 20) break;
        el.style.setProperty('--yz-satir', yeni + 'px');
    }
}
function yzTvSigdir(el) {
    if (!el) return; let kutu = el.querySelector('.yz-tv-tablo'); if (!kutu) return;
    yzTvSigdirIc(el, kutu); yzTvGenislikSigdir(el, kutu);
}
function yzTvSigdirIc(el, kutu) {
    let satirlar = [].slice.call(kutu.querySelectorAll('tbody tr:not(.yz-ayrac)')); if (!satirlar.length) return;
    satirlar.forEach(function (tr) { tr.style.display = ''; });
    let eski = kutu.querySelector('.yz-tv-sayfa'); if (eski) eski.remove();
    let olc = function () { let e = 0; kutu.querySelectorAll('thead, .yz-grup-bas, tr.yz-ayrac').forEach(function (x) { e += x.offsetHeight; }); return e; };
    let H = kutu.clientHeight - 6, n = satirlar.length, MIN = 30;
    let yuk = Math.floor((H - olc()) / n); el.style.setProperty('--yz-satir', Math.max(MIN, Math.min(84, yuk)) + 'px');
    yuk = Math.floor((H - olc()) / n); // başlık satırı yazı boyuyla değişir → bir kez daha ölç
    if (yuk >= MIN) {
        el.style.setProperty('--yz-satir', Math.min(84, yuk) + 'px'); _yz.tvSayfaSay = 1;
        for (let i = 0; i < 4 && kutu.scrollHeight > kutu.clientHeight + 1; i++) { yuk -= Math.ceil((kutu.scrollHeight - kutu.clientHeight) / n) || 1; el.style.setProperty('--yz-satir', Math.max(MIN, yuk) + 'px'); }
        if (kutu.scrollHeight <= kutu.clientHeight + 1) return;
    }
    // sayfala: okunaklı boyda (34 px) kaç satır sığıyorsa
    el.style.setProperty('--yz-satir', '34px');
    let sayfaBoy = Math.max(1, Math.floor((H - olc() - 26) / 34)), sayfaSay = Math.ceil(n / sayfaBoy);
    _yz.tvSayfaSay = sayfaSay; _yz.tvSayfa = (_yz.tvSayfa || 0) % sayfaSay;
    satirlar.forEach(function (tr, i) { tr.style.display = Math.floor(i / sayfaBoy) === _yz.tvSayfa ? '' : 'none'; });
    let et = document.createElement('div'); et.className = 'yz-tv-sayfa';
    et.textContent = 'Sayfa ' + (_yz.tvSayfa + 1) + ' / ' + sayfaSay + ' · ' + (_yz.tvSayfa * sayfaBoy + 1) + '–' + Math.min(n, (_yz.tvSayfa + 1) * sayfaBoy) + '. sıra · ' + n + ' sporcu';
    kutu.appendChild(et);
}
function yzTv2Css() {
    if (document.getElementById('yz-tv2-css')) return;
    let st = document.createElement('style'); st.id = 'yz-tv2-css';
    st.textContent = [
        '#yz-tv{padding:1.8vh 1.8vw;gap:1.4vh}',
        '#yz-tv .yz-tv-bas{grid-template-columns:1fr auto auto;gap:1.4vw;align-items:center}',
        '#yz-tv .yz-tv-kimlik{border-left-width:.4vw;padding-left:1.1vw;gap:.3vh}',
        '#yz-tv .yz-tv-logo{font-size:max(11px,1vw)}#yz-tv .yz-tv-ad{font-size:2.5vw}#yz-tv .yz-tv-alt{font-size:max(11px,1vw)}',
        '#yz-tv .yz-tv-gorunum{justify-content:flex-start;max-width:none;margin-top:.8vh}',
        '#yz-tv .yz-tv-seri{padding:.8vh 1.8vw;border-radius:1vw}#yz-tv .yz-tv-seri b{font-size:4.2vw}#yz-tv .yz-tv-seri-top{font-size:1.3vw}#yz-tv .yz-tv-seri-et{font-size:max(10px,.9vw)}',
        '#yz-tv .yz-sayac{min-width:13vw;padding:.8vh 1.6vw;border-radius:1vw}#yz-tv .yz-sayac-sure{font-size:4.4vw}#yz-tv .yz-sayac-alt{font-size:max(10px,.95vw)}',
        '#yz-tv .yz-tv-saat{gap:.8vh}#yz-tv .yz-tv-kontrol{max-width:48vw;flex-wrap:wrap;justify-content:flex-end;gap:.45vw}',
        '#yz-tv .yz-tv-k{font-size:max(13px,.92vw);padding:max(7px,.9vh) max(9px,.85vw);border-radius:.6vw;min-height:36px}','#yz-tv .yz-tv-yeniler{display:flex;align-items:center;gap:.8vw;flex-wrap:wrap;padding:.8vh 1.2vw;border-radius:.8vw;background:rgba(253,142,1,.14);border:1px solid rgba(253,142,1,.5);color:#FFE2C2;font-weight:800;font-size:max(13px,1vw)}','#yz-tv.kagit .yz-tv-yeniler{background:#fff4d6;border-color:#efd27c;color:#5b4300}',
        '.yz-yeniler{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap}',
        'body .yz-tv .yz-tv-kapat{top:auto;left:auto;bottom:3px;right:6px;padding:3px 9px;font-size:11px;opacity:.35}',
        '#yz-tv .yz-tv-tablo{position:relative}',
        '#yz-tv .yz-tablo tr.p1 td.sira,#yz-tv .yz-tablo tr.p2 td.sira,#yz-tv .yz-tablo tr.p3 td.sira{background:transparent;font-weight:900}',
        '#yz-tv .yz-tablo tr.p1 td.sira{color:#fbbf24;box-shadow:inset .3vw 0 #fbbf24}#yz-tv .yz-tablo tr.p2 td.sira{color:#cbd5e1;box-shadow:inset .3vw 0 #cbd5e1}#yz-tv .yz-tablo tr.p3 td.sira{color:#f0a36b;box-shadow:inset .3vw 0 #e07a3a}',
        '#yz-tv .yz-tablo td.hr{font-size:.6em;opacity:.8}',
        '#yz-tv .yz-tablo .yari{color:#8aa2c0;font-weight:700}#yz-tv .yz-tablo th.yari{color:#6f86a6}',
        '#yz-tv .yz-tablo td.s.bos{color:#1b2b42}#yz-tv .yz-tablo .s.aktif{background:rgba(245,158,11,.09)}',
        '#yz-tv .yz-tablo .top{background:#0e1f36}#yz-tv .yz-tablo th.top{color:#e8eef7}',
        '#yz-tv .yz-tablo .tmp,#yz-tv .yz-tablo .on,#yz-tv .yz-tablo .x{font-size:.82em;color:#6f86a6}',
        '#yz-tv .yz-tablo .hdf{font-size:.78em;color:#56708f}',
        '#yz-tv .yz-tablo tbody tr:nth-child(even){background:rgba(255,255,255,.02)}',
        '#yz-tv .yz-tv-sayfa{position:absolute;right:1vw;bottom:.7vh;font-size:max(11px,.85vw);font-weight:800;color:#c9d6e8;background:#0f2440;border:1px solid #1d3354;padding:.4vh .8vw;border-radius:.6vw}'
    ].join('');
    document.head.appendChild(st);
}
function yzTvTus(e) { if (e.key === 'Escape' && document.getElementById('yz-hp-arka')) { e.preventDefault(); yzHedefKapat(); return; } if (e.key === 'Escape' && _yz.tv && !_yz.giris) { e.preventDefault(); yzTvKapat(); } }
function yzTvCiz() {
    let el = document.getElementById('yz-tv'); if (!el) return;
    let ham = localStorage.getItem(yzAnahtar()); _yz.tvHam = ham;
    let o = yzOku(), d = o.durum;
    if (!d || !d.asama || d.asama === 'kurulum') { el.innerHTML = '<button class="yz-tv-kapat" onclick="yzTvKapat()">✕ Kapat</button><div class="yz-tv-bos"><div class="yz-tv-logo">DAĞ S.K.</div><div>Tur henüz başlamadı</div><small>Tablette Yarışma → Sıralama Turu → Turu başlat</small></div>'; return; }
    if (d.asama === 'eleme') { el.innerHTML = yzTvElemeHTML(o); yzTimerBaslat(); return; }
    let f = yzFormat(d), sira = yzSiralama(o), seri = Math.min(d.seri, f.seri - 1), bitti = d.asama === 'bitti';
    el.classList.toggle('kagit', yzTvTema() === 'kagit'); yzKagitCss();
    // Yeni gelen seri skorlarını birkaç saniye vurgula
    let yeni = {}, simdi = Date.now();
    sira.forEach(function (r) { let imza = r.seriT.join(','), eski = _yz.tvSon[r.k]; if (eski && eski.imza !== imza) eski.zaman = simdi; if (!eski) _yz.tvSon[r.k] = { imza: imza, zaman: 0 }; else eski.imza = imza; if (_yz.tvSon[r.k].zaman && simdi - _yz.tvSon[r.k].zaman < 4000) yeni[r.k] = 1; });
    let bek = yzBekleyenler(o, seri).length;
    // Satır yüksekliği: tüm sporcular ekrana sığsın
    let gorN = yzGruplar(o, sira).length, n = Math.max(sira.length + (gorN - 1) * 1.6 + (yzGorunum().mod === 'gelisim' ? gorN * 0.8 : 0), 4), yuk = Math.max(28, Math.min(84, Math.floor((window.innerHeight * (bitti ? 0.6 : 0.74)) / (n + 1))));
    el.style.setProperty('--yz-satir', yuk + 'px');
    el.innerHTML = '<button class="yz-tv-kapat" onclick="yzTvKapat()">✕ Kapat</button>'
        + '<div class="yz-tv-bas">'
        + '<div class="yz-tv-kimlik"><div class="yz-tv-logo">DAĞ S.K.</div><div class="yz-tv-ad">' + (bitti ? 'SIRALAMA TURU · SONUÇLAR' : 'SIRALAMA TURU') + '</div><div class="yz-tv-alt">' + yzKatEtiket(d) + esc(d.ayar.mesafe) + ' · ' + f.ad + ' · ' + new Date(d.basla).toLocaleDateString('tr-TR') + '</div>' + yzGorunumKontrolHTML(o, true) + '</div>'
        + '<div class="yz-tv-seri">' + (bitti ? '<span class="yz-tv-seri-et">TUR</span><b style="font-size:3.8vw;margin-top:.6vh">BİTTİ</b><button class="yz-tv-k ana" style="margin-top:.8vh" onclick="yzTorenBaslat(true)">🏅 Tören</button>' : '<span class="yz-tv-seri-et">SERİ</span><b>' + (seri + 1) + '</b><span class="yz-tv-seri-top">/ ' + f.seri + '</span>') + (!bitti ? '<div class="yz-tv-bek">' + (bek ? bek + ' skor bekleniyor' : '✓ seri tamam') + '</div>' : '') + '</div>'
        + (bitti ? '' : '<div class="yz-tv-saat">' + yzSayacHTML(o, 'yz-tv-sayac') + yzTvKontrolHTML(o) + '</div>')
        + '</div>'
        + (bitti ? yzTvPodyumHTML(o) : '')
        + (bitti ? '' : yzYenilerHTML(o, true))
        + '<div class="yz-tv-tablo">' + yzGorunumHTML(o, sira, { hareket: !bitti, yeni: yeni, tvGiris: !bitti, duzenle: true }) + '</div>'
        + yzTvOyunSeridiHTML()
        + yzTvDuyuruHTML(o, sira, yeni);
    yzTvSigdir(el);
    yzTorenKontrol(o);
    clearTimeout(_yz.duyuruZ); if (el.querySelector('.yz-tv-duyuru')) _yz.duyuruZ = setTimeout(function () { let e2 = document.querySelector('.yz-tv-duyuru'); if (e2) e2.classList.add('gizle'); }, 9000);
    yzTimerBaslat();
}

// ---- 🎮 Oyun hattının skorları Yarışma'da (2026-10-13, kullanıcı: "Yarışma modu bizim için çok önemli; oyun oynayanın da skoru
// Yarışma modunda görünsün, oradan bakalım ne atmış"). Oyun hattındaki her sporcunun BUGÜN attığı gerçek seriler (Oyunlar'dan
// girilenler dahil, hepsi karnede): her seri bir halka (renk = ok başı ortalama), dokununca oklar. Toplam, ok ortalaması, son seri.
// Sıralamaya KATILMAZ (format farklı: oyunda 3 ok, yarışmada 3/6) — ayrı kart. Yeni seri gelince kendini tazeler.
function yzOyunHattiSatir(s) {
    let sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad], bugun = bugunISO();
    let ser = ((sp && sp.seriler) || []).filter(function (x) { return x && x.tarih === bugun && Array.isArray(x.oklar) && x.oklar.length; }).map(function (x) {
        let oklar = x.oklar.map(function (v) { return String(v); }), puan = typeof x.puan === 'number' ? x.puan : yzTop(oklar);
        return { puan: puan, ok: oklar.length, oklar: oklar };
    });
    let toplam = ser.reduce(function (a, x) { return a + x.puan; }, 0), ok = ser.reduce(function (a, x) { return a + x.ok; }, 0);
    let on = ser.reduce(function (a, x) { return a + x.oklar.filter(function (v) { return v === 'X' || v === '10'; }).length; }, 0);
    return { s: s, seriler: ser, toplam: toplam, ok: ok, ort: ok ? toplam / ok : 0, on: on, son: ser.length ? ser[ser.length - 1].puan : null };
}
function yzOyunImza() {
    if (typeof kmKarmaMi !== 'function' || !kmKarmaMi()) return '';
    return kmOyunListe().map(function (s) { let sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad], n = ((sp && sp.seriler) || []).length; return s.ad + ':' + n; }).join('|');
}
function yzOyunHattiKartHTML() {
    if (typeof kmKarmaMi !== 'function' || !kmKarmaMi()) return '';
    let liste = kmOyunListe(); if (!liste.length) return '';
    yzOyunHattiCss(); _yz.kartOyunImza = yzOyunImza();
    let satirlar = liste.map(yzOyunHattiSatir).sort(function (a, b) { return b.ort - a.ort || b.seriler.length - a.seriler.length; });
    let govde = satirlar.map(function (r) {
        let cip = r.seriler.length ? r.seriler.map(function (x, i) { return '<span class="yz-sv ' + yzSeriBant(x.puan, x.ok) + '" title="' + (i + 1) + '. seri: ' + esc(x.oklar.join(' · ')) + '" onclick="yzOyunSeriGoster(this)">' + x.puan + '</span>'; }).join('') : '<span class="yz-alt">henüz seri yok</span>';
        return '<tr><td class="ad">' + esc(yzKisaAd(r.s.ad)) + '</td><td class="yzoh-cip">' + cip + '</td><td>' + r.seriler.length + '</td><td class="top">' + r.toplam + '</td><td>' + (r.ok ? r.ort.toFixed(2) : '·') + '</td><td>' + r.on + '</td></tr>';
    }).join('');
    return '<div class="yz-kart yz-tablo-kart" id="yz-oyun-hatti-kart"><div class="yz-etiket">🎮 Oyun hattı — bugünkü seriler <span class="yz-alt" style="text-transform:none;letter-spacing:0;font-weight:600">· sıralamaya katılmaz · bir seriye dokun → oklar</span><span class="yz-etiket-btn"><button class="yz-link" onclick="kmKarmaOyunaGec()">🎮 Oyunlar\'a geç →</button></span></div>'
        + '<div class="yz-tablo-kap"><table class="yz-tablo yzoh"><thead><tr><th class="ad">SPORCU</th><th class="ad">SERİLER</th><th>SERİ</th><th class="top">TOPLAM</th><th>OK ORT.</th><th>10+X</th></tr></thead><tbody>' + govde + '</tbody></table></div>'
        + '<div class="yzoh-detay" id="yzoh-detay"></div></div>';
}
function yzOyunSeriGoster(el) {
    let d = document.getElementById('yzoh-detay'); if (!d) return;
    let t = el.getAttribute('title') || '', i = t.indexOf(':');
    d.innerHTML = '<b>' + esc(el.closest('tr').querySelector('.ad').textContent) + ' · ' + esc(t.slice(0, i)) + '</b><span>' + t.slice(i + 1).trim().split(' · ').map(function (v) { return '<i class="yz-ok ' + yzOkRenk(v) + '">' + esc(v) + '</i>'; }).join('') + '</span>';
}
function yzOyunHattiKartTazele() {
    let k = document.getElementById('yz-oyun-hatti-kart'); if (!k) return;
    if (yzOyunImza() === _yz.kartOyunImza) return;
    let yeni = yzOyunHattiKartHTML(); if (!yeni) { k.remove(); return; }
    k.outerHTML = yeni;
}
function yzOyunHattiCss() {
    if (document.getElementById('yz-oyunhatti-css')) return;
    let st = document.createElement('style'); st.id = 'yz-oyunhatti-css';
    st.textContent = '.yzoh td{vertical-align:middle}.yzoh .yzoh-cip{text-align:left;white-space:normal}.yzoh .yzoh-cip .yz-sv{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;margin:2px 3px 2px 0;border-radius:50%;font-weight:900;font-size:12px;cursor:pointer;background:rgba(127,127,127,.18)}'
        + '.yzoh .yz-sv.b10{background:#f5c518;color:#1d1a16}.yzoh .yz-sv.b9{background:#f7d955;color:#1d1a16}.yzoh .yz-sv.b8{background:#e2453c;color:#fff}.yzoh .yz-sv.b7{background:#ec7a73;color:#fff}.yzoh .yz-sv.b6{background:#3f8fd8;color:#fff}.yzoh .yz-sv.b5{background:#8bb9e6;color:#1d1a16}.yzoh .yz-sv.b0{background:#2b2a28;color:#fff}'
        + '.yzoh-detay:empty{display:none}.yzoh-detay{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:8px 10px;border-radius:12px;background:var(--bg-main);font-size:13px}.yzoh-detay span{display:flex;gap:6px}.yzoh-detay .yz-ok{width:36px;height:36px;font-size:14px;font-style:normal;margin:0}';
    document.head.appendChild(st);
}
// ---- 🎮 TV'de Oyun hattı şeridi (karma ders, 2026-10-12): Yarışma tablosunun altında, Oyun hattındaki her sporcu için
// ad · bugünkü seri sayısı · son seri · oyundaki ilerleme. Kimse Yarışma hattında değilse hiç çizilmez.
function yzTvOyunSeridiHTML() {
    if (typeof kmKarmaMi !== 'function' || !kmKarmaMi()) return '';
    let liste = kmOyunListe(); if (!liste.length) return '';
    try { kmOyunDurumEmin(); } catch (e) {}
    let bugun = bugunISO(), tema = (typeof KM_OYUN_TEMALAR !== 'undefined' && typeof _kmOyunAktifTema !== 'undefined' && KM_OYUN_TEMALAR[_kmOyunAktifTema]) || null;
    let kart = liste.map(function (s) {
        let sp = turnuvaDB[s.g] && turnuvaDB[s.g][s.ad], ser = ((sp && sp.seriler) || []).filter(function (x) { return x && x.tarih === bugun; });
        let son = ser.length ? ser[ser.length - 1].puan : null, fr = 0;
        try { fr = Math.max(0, Math.min(1, kmOyunDurumAl(s.g, s.ad).frac || 0)); } catch (e) {}
        let r = yzOyunHattiSatir(s), cip = r.seriler.slice(-4).map(function (x) { return '<span class="yz-sv ' + yzSeriBant(x.puan, x.ok) + '" title="' + esc(x.oklar.join(' · ')) + '">' + x.puan + '</span>'; }).join('');
        return '<div class="yz-tvo-k"><div class="yz-tvo-ad">' + esc(yzKisaAd(s.ad)) + (r.ok ? '<em>ort. ' + r.ort.toFixed(1) + '</em>' : '') + '</div><div class="yz-tvo-bil"><span>' + ser.length + ' seri' + (r.toplam ? ' · Σ ' + r.toplam : '') + '</span>' + (son !== null && !cip ? '<b>' + son + '</b>' : '') + '</div>' + (cip ? '<div class="yz-tvo-cip">' + cip + '</div>' : '') + '<i class="yz-tvo-bar"><u style="width:' + Math.round(fr * 100) + '%"></u></i></div>';
    }).join('');
    yzTvOyunCss();
    return '<div class="yz-tvo" onclick="kmKarmaOyunaGec()" title="Oyun hattına geç"><div class="yz-tvo-bas">🎮 OYUN HATTI' + (tema ? ' · ' + esc(tema.ikon + ' ' + tema.ad) : '') + '</div><div class="yz-tvo-liste">' + kart + '</div></div>';
}
function yzTvOyunCss() {
    if (document.getElementById('yz-tvo-css')) return;
    let st = document.createElement('style'); st.id = 'yz-tvo-css';
    st.textContent = '#yz-tv .yz-tv-k.oyun{background:#7c3aed;border-color:#7c3aed;color:#fff}#yz-tv.kagit .yz-tv-k.oyun{background:#7c3aed;border-color:#7c3aed;color:#fff}#yz-tv .yz-tvo{cursor:pointer}'
        + '#yz-tv .yz-tvo-ad em{font-style:normal;font-weight:700;font-size:.72em;opacity:.7;margin-left:.5em}#yz-tv .yz-tvo-cip{display:flex;gap:.3vw}#yz-tv .yz-tvo-cip .yz-sv{min-width:0;width:2.2vw!important;height:2.2vw!important;box-shadow:none!important;border-radius:50%;font-size:max(11px,.85vw);font-weight:900;display:inline-flex;align-items:center;justify-content:center;background:rgba(255,255,255,.12)}'
        + '#yz-tv .yz-tvo{flex:none;display:flex;align-items:center;gap:1.2vw;padding:.9vh 1.2vw;border-radius:.8vw;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}'
        + '#yz-tv .yz-tvo-bas{flex:none;font-weight:900;font-size:max(11px,.85vw);letter-spacing:.12em;color:#fbbf24;writing-mode:horizontal-tb;max-width:11vw;line-height:1.25}'
        + '#yz-tv .yz-tvo-liste{flex:1;display:flex;gap:.8vw;overflow:hidden}'
        + '#yz-tv .yz-tvo-k{flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:.4vh;padding:.6vh .7vw;border-radius:.6vw;background:rgba(255,255,255,.05)}'
        + '#yz-tv .yz-tvo-ad{font-weight:900;font-size:max(12px,1.05vw);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '#yz-tv .yz-tvo-bil{display:flex;justify-content:space-between;align-items:baseline;font-size:max(10px,.8vw);opacity:.75}#yz-tv .yz-tvo-bil b{font-size:max(12px,1.1vw);opacity:1}'
        + '#yz-tv .yz-tvo-bar{display:block;height:.6vh;min-height:4px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden}#yz-tv .yz-tvo-bar u{display:block;height:100%;background:#22c55e;border-radius:99px}'
        + '#yz-tv.kagit .yz-tvo{background:#fffdf8;border:2px solid #1d1a16}#yz-tv.kagit .yz-tvo-bas{color:#d92c20}#yz-tv.kagit .yz-tvo-k{background:#f3ecdf;color:#1d1a16}#yz-tv.kagit .yz-tvo-bar{background:#e3dccf}';
    document.head.appendChild(st);
}

// ---- 🎯 Karma dok — Oyunlar ekranının köşesinde Yarışma hattı (app.js kmKarmaDokBaslat açar). Turun anlık durumu: seri, her
// sporcunun toplamı, hedefe kalan, bu seriyi girdi mi; GİR → yarışma tuş takımı (yzGirisAc) aynı ekranda. Katlanabilir (cihazda hatırlanır).
function yzKarmaDokKur() {
    let wrap = document.getElementById('km-oyun-wrap'); if (!wrap) return;
    yzCssYukle(); yzKarmaCss();
    let el = document.getElementById('yz-karma-dok');
    if (!el || el.parentNode !== wrap) { if (el) el.remove(); el = document.createElement('div'); el.id = 'yz-karma-dok'; wrap.appendChild(el); }
    yzKarmaDokCiz(); yzTimerBaslat();
    clearInterval(_yz.karmaZ);
    _yz.karmaZ = setInterval(function () {
        if (!document.getElementById('yz-karma-dok')) { clearInterval(_yz.karmaZ); _yz.karmaZ = null; return; }
        if (yzKarmaImza() !== _yz.karmaHam) yzKarmaDokCiz();
    }, 1500);
}
function yzKarmaImza() { return (localStorage.getItem(yzAnahtar()) || '') + '|' + (localStorage.getItem('dag_km_hat_' + (_kmAktifKonum || 'varsayilan')) || '') + '|' + (localStorage.getItem('dagsk_karma_dok_acik') || ''); }
function yzKarmaDokAcKapat() { try { localStorage.setItem('dagsk_karma_dok_acik', localStorage.getItem('dagsk_karma_dok_acik') === '0' ? '1' : '0'); } catch (e) {} yzKarmaDokCiz(); }
function yzKarmaDokCiz() {
    let el = document.getElementById('yz-karma-dok'); if (!el) return;
    _yz.karmaHam = yzKarmaImza();
    let acik = localStorage.getItem('dagsk_karma_dok_acik') !== '0';
    let o = yzOku(), d = o.durum, liste = typeof kmYarismaListe === 'function' ? kmYarismaListe() : [];
    let tur = d && d.asama === 'tur', f = tur ? yzFormat(d) : null, seri = tur ? Math.min(d.seri, f.seri - 1) : 0, bek = tur ? yzBekleyenler(o, seri).length : 0;
    let bas = '<button class="yzk-bas" onclick="yzKarmaDokAcKapat()"><span>🎯 YARIŞMA HATTI</span>' + (tur ? '<em>Seri ' + (seri + 1) + '/' + f.seri + (bek ? ' · ' + bek + ' bekliyor' : ' · ✓') + '</em>' : '<em>' + liste.length + ' sporcu</em>') + '<i>' + (acik ? '▾' : '▴') + '</i></button>';
    if (!acik) { el.className = 'kapali'; el.innerHTML = bas; return; }
    el.className = '';
    let govde;
    if (!tur) {
        govde = '<div class="yzk-bos">' + (d && d.asama === 'bitti' ? 'Tur bitti — sonuçlar Yarışma\'da.' : d && d.asama === 'eleme' ? 'Eleme maçları sürüyor.' : 'Sıralama turu henüz başlamadı.') + '</div>'
            + liste.map(function (s) { return '<div class="yzk-sat"><span class="yzk-ad">' + esc(yzKisaAd(s.ad)) + '</span></div>'; }).join('')
            + '<button class="yzk-alt" onclick="kmAracSec(\'yarisma\')">Yarışma\'yı aç →</button>';
    } else {
        govde = yzSiralama(o).map(function (r) {
            let girdi = r.seriT[seri] != null, hd = r.hedefPuan ? (r.hedefPuan - r.toplam > 0 ? '🎯 ' + (r.hedefPuan - r.toplam) + ' kaldı' : '🎯 ✓') : '';
            return '<div class="yzk-sat' + (girdi ? ' tamam' : '') + '"><span class="yzk-sira">' + r.sira + '</span><span class="yzk-ad">' + esc(yzKisaAd(r.ad)) + '<small>Σ ' + r.toplam + (hd ? ' · ' + hd : '') + '</small></span>'
                + '<button class="yzk-gir' + (girdi ? ' ok' : '') + '" onclick="yzGirisAc(\'' + yzEnc(r.k) + '\',' + seri + ')">' + (girdi ? r.seriT[seri] : 'GİR') + '</button></div>';
        }).join('')
            + (bek ? '' : '<button class="yzk-alt ana" onclick="yzSonrakiSeri()">' + (seri >= f.seri - 1 ? '🏁 Turu bitir' : '▶ ' + (seri + 2) + '. seriye geç') + '</button>');
    }
    el.innerHTML = bas + '<div class="yzk-govde">' + govde + (tur ? '<button class="yzk-alt" onclick="kmKarmaYarismayaGec(true)">📺 Yarışma TV\'si</button>' : '') + '</div>';
}
function yzKarmaCss() {
    if (document.getElementById('yz-karma-css')) return;
    let st = document.createElement('style'); st.id = 'yz-karma-css';
    st.textContent = '#yz-karma-dok{position:absolute;left:14px;bottom:14px;z-index:70;width:min(300px,78vw);max-height:62%;display:flex;flex-direction:column;border-radius:16px;background:rgba(22,8,4,.93);border:1px solid rgba(253,142,1,.32);box-shadow:0 18px 50px rgba(0,0,0,.5);color:#FFF1E6;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);overflow:hidden;font-family:inherit}'
        + '#yz-karma-dok.kapali{width:auto;max-width:78vw}'
        + '.yzk-bas{display:flex;align-items:center;gap:10px;width:100%;padding:10px 14px;border:none;background:rgba(253,142,1,.12);color:#FFF1E6;font:inherit;cursor:pointer;text-align:left}'
        + '.yzk-bas span{font-weight:900;font-size:11.5px;letter-spacing:.12em;color:#FD8E01}.yzk-bas em{font-style:normal;font-size:12px;font-weight:700;opacity:.85;flex:1}.yzk-bas i{font-style:normal;opacity:.7}'
        + '.yzk-govde{overflow:auto;padding:6px;display:flex;flex-direction:column;gap:4px}'
        + '.yzk-sat{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:10px;background:rgba(255,255,255,.04)}.yzk-sat.tamam{background:rgba(34,197,94,.1)}'
        + '.yzk-sira{flex:none;width:22px;text-align:center;font-weight:900;font-size:13px;color:#FD8E01}'
        + '.yzk-ad{flex:1;min-width:0;display:flex;flex-direction:column;font-weight:800;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.yzk-ad small{font-size:11px;font-weight:700;opacity:.7}'
        + '.yzk-gir{flex:none;min-width:56px;min-height:38px;border-radius:10px;border:none;background:#FC5B01;color:#1A0700;font:inherit;font-weight:900;font-size:13px;cursor:pointer}.yzk-gir.ok{background:rgba(34,197,94,.22);color:#86efac}'
        + '.yzk-bos{font-size:12px;opacity:.8;padding:6px 8px}'
        + '.yzk-alt{margin-top:4px;min-height:40px;border-radius:10px;border:1px solid rgba(253,142,1,.4);background:transparent;color:#FFF1E6;font:inherit;font-weight:800;font-size:13px;cursor:pointer}.yzk-alt.ana{background:#FD8E01;color:#1A0700;border-color:#FD8E01}';
    document.head.appendChild(st);
}

// ---- ⏱ Oyunlar'da Yarışma sayacı (karma ders, 2026-10-12: "hatlar arası sıra ve süre uyumu"). Yarışma süresi işlerken oyun
// ekranının üst ortasında küçük sayaç (HATTA GEÇ / ATIŞ / SON 30 / SÜRE BİTTİ) — herkes aynı anda atar, aynı anda hedefe yürür.
// Sayaç durumu ortak kayıttan (dag_km_yarismatur_<konum>) okunur; tabletten başlatılınca oyun cihazında da görünür, düdük çalar.
function yzOyunSayacKur() {
    let wrap = document.getElementById('km-oyun-wrap'); if (!wrap) return;
    yzCssYukle(); yzOyunSayacCss();
    let kap = document.getElementById('yz-oyun-sayac-kap');
    if (!kap || kap.parentNode !== wrap) { if (kap) kap.remove(); kap = document.createElement('div'); kap.id = 'yz-oyun-sayac-kap'; kap.title = 'Yarışma hattının süresi — dokun: Yarışma TV'; kap.onclick = function () { if (typeof kmKarmaYarismayaGec === 'function') kmKarmaYarismayaGec(true); }; wrap.appendChild(kap); }
    kap.innerHTML = '<span class="yzos-et"></span>' + yzSayacHTML(yzOku(), 'yz-oyun-sayac');
    yzOyunSayacEtiket(yzOku(), yzSayacDurum(yzOku()));
    yzTimerBaslat();
}
function yzOyunSayacEtiket(o, s) {
    let kap = document.getElementById('yz-oyun-sayac-kap'); if (!kap) return;
    let d = o.durum, gor = !!(o.sayac && d && (d.asama === 'tur' || d.asama === 'eleme') && ['hazirlik', 'atis', 'son', 'bitti'].indexOf(s.faz) !== -1);
    kap.style.display = gor ? '' : 'none';
    if (gor) { let w = document.getElementById('km-oyun-wrap'), sh = document.getElementById('km-oyun-sahne'); if (w && sh) { let rs = sh.getBoundingClientRect(), rw = w.getBoundingClientRect(); kap.style.top = Math.max(6, Math.round(rs.top - rw.top + 10)) + 'px'; kap.style.left = Math.max(6, Math.round(rs.left - rw.left + 10)) + 'px'; } } // sahnenin sol üst köşesi — üst çubuk ve oyunun orta HUD'u (irtifa, tur) açık kalır
    let et = kap.querySelector('.yzos-et'); if (!et || !gor) return;
    let f = d.asama === 'tur' ? yzFormat(d) : null;
    et.textContent = '🎯 YARIŞMA' + (f ? ' · SERİ ' + (Math.min(d.seri, f.seri - 1) + 1) + '/' + f.seri : ' · ELEME');
}
function yzOyunSayacCss() {
    if (document.getElementById('yz-oyun-sayac-css')) return;
    let st = document.createElement('style'); st.id = 'yz-oyun-sayac-css';
    st.textContent = '#yz-oyun-sayac-kap{position:absolute;left:10px;top:10px;z-index:75;display:flex;align-items:center;gap:10px;padding:5px 6px 5px 14px;border-radius:999px;background:rgba(22,8,4,.9);border:1px solid rgba(253,142,1,.35);box-shadow:0 10px 30px rgba(0,0,0,.45);cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}'
        + '#yz-oyun-sayac-kap .yzos-et{font-weight:900;font-size:11px;letter-spacing:.12em;color:#FD8E01;white-space:nowrap}'
        + '#yz-oyun-sayac-kap .yz-sayac{min-width:0;flex-direction:row;gap:8px;padding:4px 14px;border-radius:999px}#yz-oyun-sayac-kap .yz-sayac-alt{font-size:10.5px}#yz-oyun-sayac-kap .yz-sayac-sure{font-size:24px;line-height:1}';
    document.head.appendChild(st);
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
        y = _kurumsalBaslikCiz(pdf, mx, uw, 10, 'SIRALAMA TURU', 'Sonuç listesi  |  ' + yzKatEtiket(d, '  |  ') + d.ayar.mesafe + '  |  ' + f.ad + '  |  ' + new Date(d.basla).toLocaleDateString('tr-TR') + (d.asama === 'bitti' ? '' : '  |  ARA SONUÇ (seri ' + (Math.min(d.seri, f.seri - 1) + 1) + ')'));
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
function yzTurTemizle(o) { Object.keys(o).forEach(function (a) { if (/^(s|m|hp|p)_/.test(a)) delete o[a]; }); delete o.eleme; delete o.toren; }
function yzPKey(id, k) { return 'p_' + id + '_' + k; }
function yzTarihTR(iso) { let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; }

// ---------------------------------------------------------------- 🎯 kişisel hedef + tempo
// ---- 🎯 hedef istatistiği (2026-09-30, kullanıcı: "ortalamaya göre alternatif sun, zor/kolay tahmini olsun, hedefe
// yaklaştıysa ya da ne kadar kaldıysa bildirsin"). Beklenen tur toplamı = kendi ok ortalaması × ok sayısı; belirsizlik =
// karnedeki serilerin seriden seriye sapması × √seri. Tutma ihtimali normal dağılımla (yaklaşık) hesaplanır.
function yzNormalCdf(z) { let t = 1 / (1 + 0.2316419 * Math.abs(z)), d = 0.3989423 * Math.exp(-z * z / 2), p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return z > 0 ? 1 - p : p; }
// 2026-10-11 (kullanıcı: "ilk yarıyı tamamlayınca hedef seçtiriyorum, şu anki puan da gözüksün, tahmini hedefleri daha mantıklı yap"):
// beklenen tur toplamı artık = şu anki toplam + (bugünkü seri ortalaması geçmişle harmanlanmış) × kalan seri; belirsizlik yalnız
// kalan serilerden gelir (sdSeri × √kalan). Tur başlamadan önce (0 seri) eski hesapla aynı sonucu verir.
function yzHedefIstat(o, k, r) {
    let d = o.durum, f = yzFormat(d), bk = yzBeklenenOrt(o, k);
    if (!r) r = yzSiralama(o).find(function (x) { return x.k === k; });
    let toplam = r ? r.toplam : 0, girilen = r ? r.girilen : 0;
    if (!bk && !girilen) return null;
    let gi = k.indexOf('|'), sp = turnuvaDB[k.slice(0, gi)] && turnuvaDB[k.slice(0, gi)][k.slice(gi + 1)];
    let seriler = ((sp && sp.seriler) || []).filter(function (x) { return (x.t || 0) < d.basla && Array.isArray(x.oklar) && x.oklar.length >= 3; }).slice(-30).map(function (x) { return (x.puan || 0) / x.oklar.length * f.ok; });
    let sdSeri = 0; if (seriler.length >= 5) { let m = yzOrt(seriler); sdSeri = Math.sqrt(yzOrt(seriler.map(function (v) { return (v - m) * (v - m); }))); }
    sdSeri = Math.max(sdSeri, f.ok * 0.6); // az/tekdüze veride aşırı iyimser tahmin olmasın (6 ok → en az ~3.6 puan)
    let ort = bk ? bk.ort : toplam / (girilen * f.ok), ortSeri = ort * f.ok;
    if (girilen) { let bugun = toplam / girilen; ortSeri = bk ? (bugun * girilen + ortSeri * 2) / (girilen + 2) : bugun; }
    let kalanSeri = Math.max(0, f.seri - girilen), onc = yzOncekiler(k, d.ayar.format, d.ayar.mesafe, d.id);
    return { ort: ort, kaynak: bk ? bk.kaynak : 'bugünkü seriler', mean: toplam + ortSeri * kalanSeri, sd: Math.max(1, sdSeri * Math.sqrt(kalanSeri)), sdSeri: sdSeri, rekor: onc.length ? Math.max.apply(null, onc.map(function (x) { return x.toplam; })) : null, toplam: toplam, girilen: girilen, kalanSeri: kalanSeri, ortSeri: ortSeri };
}
function yzHedefIhtimal(ist, hedef) { return 1 - yzNormalCdf((hedef - 0.5 - ist.mean) / ist.sd); }
function yzZorluk(p) { return p >= 0.7 ? { ad: 'Kolay', cls: 'kolay', i: '🟢' } : p >= 0.35 ? { ad: 'Gerçekçi', cls: 'orta', i: '🟡' } : p >= 0.12 ? { ad: 'İddialı', cls: 'zor', i: '🟠' } : { ad: 'Çok zor', cls: 'cokzor', i: '🔴' }; }
// Öneriler tutma ihtimaline göre: Kolay ≈ %80, Gerçekçi ≈ %45, İddialı ≈ %20; hepsi şu anki toplamın üstünde ve artan sırada.
function yzHedefOneriler(ist, maks) {
    let taban = (ist.toplam || 0) + 1, r = function (v) { return Math.max(taban, Math.min(maks, Math.round(v))); };
    let l = [{ ad: 'Kolay', tur: 'kolay', i: '🟢', v: r(ist.mean - 0.84 * ist.sd) }, { ad: 'Gerçekçi', tur: 'ger', i: '🟡', v: r(ist.mean + 0.15 * ist.sd) }, { ad: 'İddialı', tur: 'iddia', i: '🔥', v: r(ist.mean + 0.84 * ist.sd) }];
    for (let j = 1; j < l.length; j++) if (l[j].v <= l[j - 1].v) l[j].v = Math.min(maks, l[j - 1].v + 1);
    if (ist.rekor && ist.rekor + 1 > l[1].v && ist.rekor + 1 <= maks && ist.rekor + 1 !== l[2].v) l.push({ ad: 'Rekor', tur: 'rekor', i: '🏆', v: ist.rekor + 1 });
    return l;
}
function yzIlkAdTR(ad) { let s = String(ad || '').trim().split(/\s+/)[0] || ''; return s.charAt(0) + s.slice(1).toLocaleLowerCase('tr'); }
function yzBuyukBas(t) { return t.charAt(0).toLocaleUpperCase('tr') + t.slice(1); }
// Koçun çocuğa söyleyeceği hırslandırıcı cümle — seçilen hedefin zorluğuna göre
function yzHedefMotive(ist, v, ad) {
    if (!ist || !v) return '';
    let ilk = yzIlkAdTR(ad), kalan = v - ist.toplam, ks = ist.kalanSeri;
    if (kalan <= 0) return '✨ ' + ilk + ' bu puanı zaten geçti — çıtayı yükseltelim mi?';
    if (!ks) return '';
    let g = Math.ceil(kalan / ks), ne = ks > 1 ? 'seri başı ' + g + ' puan' : 'son seride ' + kalan + ' puan', o2 = Math.round(ist.ortSeri), p = yzHedefIhtimal(ist, v);
    if (ist.rekor && v > ist.rekor) return '🏆 Rekor avı! ' + ist.rekor + ' puanlık rekorunu geçersen tarih yazarsın, ' + ilk + '. Gereken: ' + ne + '.';
    if (p >= 0.7) return '💪 Isınma hedefi: ' + ne + ' yeter (ortalaman ' + o2 + '). Sağlam git, sonra çıtayı yükseltiriz!';
    if (p >= 0.35) return '🎯 Tam senin seviyen, ' + ilk + '! ' + yzBuyukBas(ne) + ' — odaklan, bu hedef senin.';
    if (p >= 0.12) return '🔥 İddialı! ' + yzBuyukBas(ne) + ' lazım, ortalamanın ' + (g > o2 ? g - o2 + ' puan üstü' : 'biraz üstü') + '. Bugün parlama günü olabilir!';
    return '⚡ Çok zor: ' + ne + ' lazım. Her ok sarıya gitmeli — cesaretin var mı, ' + ilk + '?';
}
// Tur içinde hedef durumu — kalan puan, kalan seri, bugünkü form (geçmiş ortalamayla hafif harmanlanmış)
function yzHedefDurum(o, r) {
    if (!r || !r.hedefPuan) return null;
    let d = o.durum, f = yzFormat(d), kalan = r.hedefPuan - r.toplam, kalanSeri = f.seri - r.girilen, ad = yzKisaAd(r.ad);
    if (kalan <= 0) return { d: 'ulasti', i: '🎯', metin: ad + ' hedefine ulaştı! (' + r.toplam + '/' + r.hedefPuan + ')', p: 1 };
    if (kalanSeri <= 0) return { d: 'kacti', i: '·', metin: ad + ': hedefe ' + kalan + ' puan kala bitti', p: 0 };
    let ist = yzHedefIstat(o, r.k, r), ortSeri = r.girilen ? r.toplam / r.girilen : (ist ? ist.ort * f.ok : f.ok * 7);
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
    // Herkesin önünde: geride kalan kırmızı değil sakin mavi; yaklaşan turuncu/yeşil, ulaşan altın ışıltı
    let H = r.hedefPuan, ulasti = r.toplam >= H, hd = ulasti ? null : yzHedefDurum(yzOku(), r), kalan = H - r.toplam;
    let cls = ulasti ? 'ulasti' : !hd ? 'orta' : hd.p >= 0.4 ? 'ust' : hd.p >= 0.12 ? 'orta' : 'alt';
    let su = Math.min(100, r.toplam / H * 100), tah = r.tempo == null ? su : Math.min(100, r.tempo / H * 100);
    let et = ulasti ? '✓ HEDEF!' : (hd && hd.d === 'yakin' ? '🔥 ' : '') + kalan + ' kaldı';
    return '<td class="tmp hb ' + cls + '" title="' + esc((hd ? hd.metin : 'Hedef ' + H) + (r.tempo != null ? ' · bu tempoyla ' + r.tempo : '')) + '"><div class="yz-hb"><div class="yz-hb-ust"><span class="yz-hb-et">' + et + '</span><b>' + H + '</b></div><div class="yz-hb-bar"><i class="tah" style="width:' + tah.toFixed(1) + '%"></i><i class="su" style="width:' + su.toFixed(1) + '%"></i></div></div></td>';
}
function yzHedeflerAc() {
    let o = yzOku(), d = o.durum; if (!d) return;
    yzCssYukle(); yzV240CssYukle();
    let hp = o[yzHpKey(d.id)] || {}, f = yzFormat(d), maks = f.seri * f.ok * 10, sira = yzSiralama(o), rMap = {};
    sira.forEach(function (r) { rMap[r.k] = r; });
    _yz.hpIst = []; _yz.hpAd = [];
    let kartlar = d.katilimci.map(function (k, i) {
        let r = rMap[k], ist = yzHedefIstat(o, k, r), on = ist ? yzHedefOneriler(ist, maks) : [];
        _yz.hpIst[i] = ist; _yz.hpAd[i] = yzKAd(k);
        let tas = on.map(function (x) {
            let p = yzHedefIhtimal(ist, x.v), g = ist.kalanSeri ? Math.ceil((x.v - ist.toplam) / ist.kalanSeri) : 0;
            return '<button type="button" class="yzh-tas ' + x.tur + '" data-v="' + x.v + '" onclick="yzHedefSec(' + i + ',' + x.v + ')"><span>' + x.i + ' ' + x.ad + '</span><b>' + x.v + '</b><small>%' + Math.round(p * 100) + ' şans' + (ist.kalanSeri ? ' · seri ' + g : '') + '</small></button>';
        }).join('');
        let veri = ist ? ' data-kolay="' + on[0].v + '" data-ger="' + on[1].v + '" data-iddia="' + on[2].v + '" data-en="' + (ist.rekor && ist.rekor < maks ? ist.rekor + 1 : '') + '"' : '';
        return '<div class="yzh-kart" id="yzh-k-' + i + '">'
            + '<div class="yzh-bas"><span class="yzh-hdf">' + esc((d.hedefler || {})[k] || '·') + '</span><b class="yzh-ad">' + esc(yzKAd(k)) + '</b>' + (r && r.girilen ? '<span class="yzh-sira">' + r.sira + '. sırada</span>' : '') + '</div>'
            + '<div class="yzh-skor"><div><small>ŞU AN</small><b>' + (r ? r.toplam : 0) + '</b><em>' + (r ? r.girilen : 0) + '/' + f.seri + ' seri</em></div>'
            + '<div><small>BU GİDİŞLE</small><b>' + (ist ? '≈' + Math.round(ist.mean) : '—') + '</b><em>' + (ist ? 'seri ort. ' + (Math.round(ist.ortSeri * 10) / 10) : 'veri yok') + '</em></div>'
            + '<div class="yzh-hk"><small>HEDEF</small><b id="yzh-hv-' + i + '">—</b><em id="yzh-he-' + i + '">seç ya da yaz</em></div></div>'
            + '<div class="yzh-bar" title="Dolu: şu anki puan · açık: bu gidişle · sağ uç: hedef"><i class="tah" id="yzh-bt-' + i + '"></i><i class="su" id="yzh-bs-' + i + '"></i></div>'
            + (tas ? '<div class="yzh-secenek">' + tas + '</div>' : '<div class="yz-alt">Geçmiş veri yok — hedefi elle yaz.</div>')
            + '<div class="yzh-giris"><button type="button" onclick="yzHedefAdim(' + i + ',-5)">−5</button><button type="button" onclick="yzHedefAdim(' + i + ',-1)">−1</button>'
            + '<input type="number" inputmode="numeric" min="1" max="' + maks + '" id="yz-hp-' + i + '"' + veri + ' value="' + (hp[k] || '') + '" placeholder="—" aria-label="' + esc(yzKAd(k)) + ' hedef puanı" oninput="yzHedefZorlukGuncelle(' + i + ')">'
            + '<button type="button" onclick="yzHedefAdim(' + i + ',1)">+1</button><button type="button" onclick="yzHedefAdim(' + i + ',5)">+5</button><span class="yz-hp-z" id="yz-hp-z-' + i + '"></span></div>'
            + '<div class="yzh-motive" id="yzh-m-' + i + '"></div>'
            + '</div>';
    }).join('');
    let ilk = sira.length ? Math.min.apply(null, sira.map(function (r) { return r.girilen; })) : 0, kalan = f.seri - ilk;
    let alt = ilk ? ilk + '/' + f.seri + ' seri bitti · kalan ' + kalan + ' seri (' + kalan * f.ok + ' ok). Öneriler bugünkü puan + çocuğun kendi geçmişinden hesaplanır.'
        : 'Tur toplamı için hedef (' + f.seri * f.ok + ' ok, en fazla ' + maks + '). Öneriler çocuğun kendi geçmişinden hesaplanır.';
    yzHedefKapat();
    let el = document.createElement('div'); el.id = 'yz-hp-arka'; el.className = 'yzh-arka'; el.setAttribute('data-yzt', yzAnaTema());
    el.addEventListener('click', function (e) { if (e.target === el) yzHedefKapat(); });
    el.innerHTML = '<div class="yzh-pano" role="dialog" aria-label="Hedef belirle">'
        + '<div class="yzh-ust"><div><div class="yzh-baslik">🎯 Hedef belirle</div><div class="yzh-alt">' + alt + '</div></div><button type="button" class="yzh-x" onclick="yzHedefKapat()" aria-label="Kapat">✕</button></div>'
        + '<div class="yzh-toplu">Hepsine <button type="button" onclick="yzHedefToplu(\'kolay\')">🟢 Kolay</button><button type="button" onclick="yzHedefToplu(\'ger\')">🟡 Gerçekçi</button><button type="button" onclick="yzHedefToplu(\'iddia\')">🔥 İddialı</button>' + (_yz.hpIst.some(function (x) { return x && x.rekor; }) ? '<button type="button" onclick="yzHedefToplu(\'en\')">🏆 Rekor</button>' : '') + '</div>'
        + '<div class="yzh-izgara">' + kartlar + '</div>'
        + '<div class="yzh-son"><span id="yzh-say"></span><button class="yz-btn" onclick="yzHedefKapat()">İptal</button><button class="yz-btn ana buyuk" onclick="yzHedeflerKaydet()">💾 Hedefleri kaydet</button></div>'
        + '</div>';
    document.body.appendChild(el);
    d.katilimci.forEach(function (k, i) { yzHedefZorlukGuncelle(i); });
}
function yzHedefKapat() { let el = document.getElementById('yz-hp-arka'); if (el) el.remove(); }
function yzHedefSec(i, v) { let el = document.getElementById('yz-hp-' + i); if (el) { el.value = v; yzHedefZorlukGuncelle(i); } }
function yzHedefAdim(i, n) {
    let el = document.getElementById('yz-hp-' + i), ist = (_yz.hpIst || [])[i]; if (!el) return;
    let su = parseInt(el.value, 10) || (ist ? Math.round(ist.mean) : 0), maks = parseInt(el.max, 10) || 9999;
    el.value = Math.max(1, Math.min(maks, su + n)); yzHedefZorlukGuncelle(i);
}
function yzHedefToplu(tur) { document.querySelectorAll('#yz-hp-arka input[id^="yz-hp-"]').forEach(function (el) { let v = el.dataset[tur]; if (v) { el.value = v; yzHedefZorlukGuncelle(parseInt(el.id.replace('yz-hp-', ''), 10)); } }); }
function yzHedefZorlukGuncelle(i) {
    let el = document.getElementById('yz-hp-' + i), z = document.getElementById('yz-hp-z-' + i), ist = (_yz.hpIst || [])[i];
    if (!el || !z) return;
    let v = parseInt(el.value, 10) || 0, kart = document.getElementById('yzh-k-' + i), toplam = ist ? ist.toplam : 0;
    if (kart) {
        kart.classList.toggle('secili', !!v);
        kart.querySelectorAll('.yzh-tas').forEach(function (t) { t.classList.toggle('aktif', parseInt(t.dataset.v, 10) === v); });
        let hv = document.getElementById('yzh-hv-' + i), he = document.getElementById('yzh-he-' + i), m = document.getElementById('yzh-m-' + i);
        if (hv) hv.textContent = v || '—';
        if (he) he.textContent = !v ? 'seç ya da yaz' : v > toplam ? (v - toplam) + ' puan kaldı' : 'şimdiden geçti!';
        let H = Math.max(v, ist ? ist.mean : 0, toplam, 1), bs = document.getElementById('yzh-bs-' + i), bt = document.getElementById('yzh-bt-' + i);
        if (bs) bs.style.width = (toplam / H * 100).toFixed(1) + '%';
        if (bt) bt.style.width = ((ist ? Math.min(ist.mean, H) : toplam) / H * 100).toFixed(1) + '%';
        if (m) m.textContent = v ? yzHedefMotive(ist, v, (_yz.hpAd || [])[i]) : '';
    }
    let say = document.getElementById('yzh-say'); if (say) { let n = [].filter.call(document.querySelectorAll('#yz-hp-arka input[id^="yz-hp-"]'), function (x) { return parseInt(x.value, 10) > 0; }).length; say.textContent = n + ' sporcunun hedefi var'; }
    if (!v) { z.textContent = ''; z.className = 'yz-hp-z'; return; }
    if (!ist) { z.textContent = 'tahmin yok'; z.className = 'yz-hp-z'; return; }
    let p = yzHedefIhtimal(ist, v), zr = yzZorluk(p);
    z.textContent = zr.i + ' ' + zr.ad + ' · %' + Math.round(p * 100); z.className = 'yz-hp-z ' + zr.cls;
}
function yzHedeflerKaydet() {
    let d = yzOku().durum; if (!d) return;
    let f = yzFormat(d), maks = f.seri * f.ok * 10, yeni = {};
    d.katilimci.forEach(function (k, i) { let el = document.getElementById('yz-hp-' + i), v = el && parseInt(el.value, 10); if (v > 0 && v <= maks) yeni[k] = v; });
    yzHedefKapat();
    yzGuncelle(function (o) { if (o.durum && o.durum.id === d.id) o[yzHpKey(d.id)] = yeni; });
    yzCiz(); if (_yz.tv) yzTvCiz(); showToast('🎯 ' + Object.keys(yeni).length + ' sporcunun hedefi kaydedildi', 'success');
}

// ---- ⛶ Büyük sayaç (2026-10-11, kullanıcı: "sayaç için ekranı kapla/büyüt seçeneği koy, tam ekranda sayaç gözüksün, sayaç
// bitince küçülsün"). Cihaz başına ayar: açıksa süre başlayınca sayaç tüm ekranı kaplar (TV'de de), "SÜRE BİTTİ" 2.5 sn
// görünür, sonra köşeye küçülerek kapanır. Dokununca o seri için küçülür; ⛶ ile geri açılır.
function yzDevAyar() { try { return localStorage.getItem('dag_yz_dev_sayac') === '1'; } catch (e) { return false; } }
function yzDevBtnHTML() { let a = yzDevAyar(); return '<button class="yz-btn' + (a ? ' dev-acik' : '') + '" onclick="yzDevSayacDegis()" title="Süre başlayınca sayaç ekranı kaplasın, bitince küçülsün">⛶ ' + (a ? 'Büyük sayaç açık' : 'Büyük sayaç') + '</button>'; }
function yzDevSayacDegis() {
    let o = yzOku();
    if (yzDevAyar() && o.sayac && _yz.devGizle === o.sayac.basla) { _yz.devGizle = null; yzDevSayacGuncelle(o); return; }
    let v = !yzDevAyar(); try { localStorage.setItem('dag_yz_dev_sayac', v ? '1' : '0'); } catch (e) {}
    _yz.devGizle = null;
    showToast(v ? '⛶ Büyük sayaç açık — süre başlayınca ekranı kaplar, bitince küçülür' : 'Büyük sayaç kapalı', 'success');
    yzCiz(); yzDevSayacGuncelle(yzOku());
}
function yzDevKucult() { let o = yzOku(); _yz.devGizle = o.sayac ? o.sayac.basla : null; yzDevSayacGuncelle(o); }
function yzDevSayacGuncelle(o, s) {
    yzV240CssYukle();
    let el = document.getElementById('yz-dev-sayac'), sy = o && o.sayac, d = o && o.durum;
    if (sy && d && !s) s = yzSayacDurum(o);
    let goster = !!(sy && d && s && yzDevAyar() && _yz.devGizle !== sy.basla && (document.getElementById('yz-sayac') || document.getElementById('yz-tv-sayac')));
    if (goster && s.faz === 'bitti') goster = Date.now() - (sy.basla + (sy.faz === 'shoot' ? sy.sure : (sy.hazir || 0) + (sy.sure || 0)) * 1000) < 2600;
    else if (goster && ['hazirlik', 'atis', 'son'].indexOf(s.faz) === -1) goster = false;
    if (!goster) {
        if (el && !el.classList.contains('kucul')) { el.classList.add('kucul'); setTimeout(function () { let e2 = document.getElementById('yz-dev-sayac'); if (e2 && e2.classList.contains('kucul')) e2.remove(); }, 750); }
        return;
    }
    if (!el || el.classList.contains('kucul')) {
        if (el) el.remove();
        el = document.createElement('div'); el.id = 'yz-dev-sayac'; el.setAttribute('role', 'timer'); el.onclick = yzDevKucult;
        el.innerHTML = '<div class="yz-dev-ust"><span class="yz-dev-faz"></span><span class="yz-dev-seri"></span></div><div class="yz-dev-sure"></div><div class="yz-dev-bar"><i></i></div><div class="yz-dev-ipucu">Dokun → küçült</div>';
        (document.fullscreenElement && document.fullscreenElement !== document.documentElement ? document.fullscreenElement : document.body).appendChild(el);
    }
    el.className = s.faz;
    el.querySelector('.yz-dev-faz').textContent = s.alt;
    el.querySelector('.yz-dev-sure').textContent = s.metin;
    let f = d.asama === 'tur' ? yzFormat(d) : null;
    el.querySelector('.yz-dev-seri').textContent = f ? 'SERİ ' + (Math.min(d.seri, f.seri - 1) + 1) + '/' + f.seri : '';
    let gecen = (Date.now() - sy.basla) / 1000, oran = 0;
    if (sy.faz === 'shoot') oran = 1 - gecen / sy.sure; else if (s.faz === 'hazirlik') oran = 1 - gecen / sy.hazir; else if (s.faz !== 'bitti') oran = 1 - (gecen - sy.hazir) / sy.sure;
    el.querySelector('.yz-dev-bar i').style.width = (Math.max(0, Math.min(1, oran)) * 100).toFixed(1) + '%';
}

// ---- 🎨 Yarışma ekranı teması (2026-10-11, kullanıcı: "TV ekranından çıktığımızda tema cidden kötü, 3 tema sun").
// Cihaz başına; uygulamanın renk değişkenleri .yz kökünde (ve hedef panelinde) temaya göre yeniden tanımlanır.
const YZ_ANA_TEMALAR = [
    { id: 'dag', ad: 'DAĞ Ateşi', acik: 'Kulübün renkleri: koyu kestane zemin, turuncu–kehribar vurgu.', renk: ['#160804', '#3a1206', '#FC5B01', '#FD8E01'] },
    { id: 'gece', ad: 'Gece Stadı', acik: 'Lacivert zemin, skorbord sarısı. Işıklı stadyum.', renk: ['#060d19', '#0e1c31', '#fbbf24', '#eaf1fb'] },
    { id: 'kagit', ad: 'Hedef Kâğıdı', acik: 'Açık krem kâğıt, kırmızı vurgu. TV\'nin açık görünümüyle aynı.', renk: ['#f6f1e7', '#fffdf8', '#d92c20', '#1d1a16'] },
    { id: 'neon', ad: 'Neon Arena', acik: 'Koyu cam paneller, camgöbeği–pembe ışık. Fütüristik.', renk: ['#0a0420', '#2a1258', '#22d3ee', '#f472b6'] }
];
function yzAnaTema() { try { let t = localStorage.getItem('dag_yz_ana_tema'); return YZ_ANA_TEMALAR.some(function (x) { return x.id === t; }) ? t : 'dag'; } catch (e) { return 'dag'; } }
function yzAnaTemaAc() {
    yzV240CssYukle();
    let su = yzAnaTema();
    onayIste('<div style="text-align:left"><b>🎨 Yarışma ekranı teması</b><div class="yz-alt" style="margin:4px 0 12px">Bu cihazda hatırlanır. TV ekranının görünümü ayrıdır (TV\'de ☀️/🌙).</div><div class="yzt-secici">'
        + YZ_ANA_TEMALAR.map(function (t) { return '<button type="button" class="yzt-sec' + (t.id === su ? ' aktif' : '') + '" onclick="yzAnaTemaSec(\'' + t.id + '\')"><span class="yzt-onizle" style="background:' + t.renk[0] + '"><i style="background:' + t.renk[1] + '"></i><i style="background:' + t.renk[1] + '"></i><em style="background:' + t.renk[2] + '"></em><u style="background:' + t.renk[3] + '"></u></span><b>' + (t.id === su ? '✓ ' : '') + t.ad + '</b><small>' + t.acik + '</small></button>'; }).join('')
        + '</div></div>', null);
}
function yzAnaTemaSec(id) {
    try { localStorage.setItem('dag_yz_ana_tema', id); } catch (e) {}
    let m = document.getElementById('onay-modal'); if (m) m.style.display = 'none';
    yzCiz(); let t = YZ_ANA_TEMALAR.find(function (x) { return x.id === id; }); showToast('🎨 Tema: ' + (t ? t.ad : id), 'success');
}
function yzV240CssYukle() {
    if (document.getElementById('yz-v240-css')) return;
    let st = document.createElement('style'); st.id = 'yz-v240-css';
    st.textContent = [
        // temalar
        '[data-yzt="dag"]{--bg-main:rgba(22,8,4,.7);--bg-panel:rgba(58,18,6,.66);--border-color:rgba(253,142,1,.18);--text-main:#FFF1E6;--text-muted:#D9AE93;--accent-orange:#FC5B01;--yzt-zemin:radial-gradient(800px 420px at 4% -10%,rgba(253,142,1,.22),transparent 60%),radial-gradient(900px 520px at 100% 0%,rgba(215,50,4,.26),transparent 62%),radial-gradient(900px 500px at 50% 120%,rgba(134,28,2,.45),transparent 60%),#160804;--yzt-ana-yazi:#1A0700;--yzt-golge:0 14px 36px rgba(20,4,0,.45)}',
        '.yz[data-yzt="dag"] .yz-sp-seri{color:#FD8E01}.yz[data-yzt="dag"] .yz-sp-hedef{background:#FC5B01;color:#1A0700}.yz[data-yzt="dag"] .yz-btn.tv{background:#D73204;border-color:#D73204}.yz[data-yzt="dag"] .yz-bar i{background:linear-gradient(90deg,#D73204,#FD8E01)}.yz[data-yzt="dag"] .yz-sayac.hazir{background:rgba(134,28,2,.55);color:#FFF1E6}.yz[data-yzt="dag"] .yz-bilgi{background:rgba(253,142,1,.14);border-color:rgba(253,142,1,.45);color:#FFE2C2}',
        '[data-yzt="dag"] .yz-hp-z.kolay{color:#4ade80}[data-yzt="dag"] .yz-hp-z.orta{color:#facc15}[data-yzt="dag"] .yz-hp-z.zor{color:#FD8E01}[data-yzt="dag"] .yz-hp-z.cokzor{color:#f87171}',
        '[data-yzt="gece"]{--bg-main:#0a1526;--bg-panel:#0e1c31;--border-color:#1d3352;--text-main:#eaf1fb;--text-muted:#8ea3bf;--accent-orange:#fbbf24;--yzt-zemin:radial-gradient(1100px 500px at 90% -20%,rgba(56,120,220,.22),transparent 60%),#060d19;--yzt-ana-yazi:#1a1203;--yzt-golge:0 10px 30px rgba(0,0,0,.35)}',
        '[data-yzt="kagit"]{--bg-main:#f3ecdf;--bg-panel:#fffdf8;--border-color:#e2d9c8;--text-main:#1d1a16;--text-muted:#6b6358;--accent-orange:#d92c20;--yzt-zemin:#f6f1e7;--yzt-ana-yazi:#fff;--yzt-golge:0 1px 0 rgba(29,26,22,.04),0 8px 24px rgba(29,26,22,.07)}',
        '[data-yzt="neon"]{--bg-main:rgba(10,4,30,.55);--bg-panel:rgba(34,14,70,.62);--border-color:rgba(34,211,238,.3);--text-main:#f6f3ff;--text-muted:#b3a6dc;--accent-orange:#22d3ee;--yzt-zemin:radial-gradient(700px 420px at 0% 0%,rgba(236,72,153,.42),transparent 62%),radial-gradient(800px 520px at 100% 10%,rgba(124,58,237,.45),transparent 62%),radial-gradient(900px 500px at 50% 120%,rgba(34,211,238,.25),transparent 60%),#0a0420;--yzt-ana-yazi:#04131a;--yzt-golge:0 0 0 1px rgba(236,72,153,.12),0 0 28px rgba(168,85,247,.22)}',
        '.yz[data-yzt="neon"] .yz-sp-seri{color:#22d3ee}.yz[data-yzt="neon"] .yz-sp.tamam .yz-sp-seri{color:#4ade80}.yz[data-yzt="neon"] .yz-bilgi{background:rgba(236,72,153,.16);border-color:rgba(236,72,153,.5);color:#fbcfe8}.yz[data-yzt="neon"] .yz-bar i{background:linear-gradient(90deg,#ec4899,#22d3ee)}.yz[data-yzt="neon"] .yz-btn.tv{background:#7c3aed;border-color:#a78bfa}',
        '.yz[data-yzt="gece"] .yz-btn.tv{background:#1d4ed8;border-color:#1d4ed8}.yz[data-yzt="gece"] .yz-sp-seri{color:#fbbf24}.yz[data-yzt="gece"] .yz-tur-bas{background:linear-gradient(180deg,#10223d,#0c1a2e);border-color:#24406a}',
        '.yz[data-yzt="kagit"] .yz-grafik-kap svg{filter:brightness(.72) saturate(1.5)}.yz[data-yzt="kagit"] .yz-btn.tv{background:#1d1a16;border-color:#1d1a16}',
        '.yz[data-yzt]{background:var(--yzt-zemin);color:var(--text-main);border-radius:22px;padding:16px;min-height:calc(100vh - 140px)}',
        '.yz[data-yzt] .yz-kart,.yz[data-yzt] .yz-tur-bas,.yz[data-yzt] .yz-hedef{box-shadow:var(--yzt-golge)}',
        '.yz[data-yzt="neon"] .yz-kart,.yz[data-yzt="neon"] .yz-tur-bas,.yz[data-yzt="neon"] .yz-hedef{-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}',
        '.yz[data-yzt="neon"] .yz-sp-seri{text-shadow:0 0 14px rgba(34,211,238,.55)}.yz[data-yzt="neon"] .yz-seri-no b{text-shadow:0 0 22px rgba(244,114,182,.45)}',
        '[data-yzt] .yz-btn.ana,[data-yzt] .yz-cip.aktif{color:var(--yzt-ana-yazi)}',
        '.yz[data-yzt] .yz-sp-hedef{background:var(--text-main);color:var(--bg-main)}.yz[data-yzt="neon"] .yz-sp-hedef{background:#22d3ee;color:#04131a}',
        '.yz[data-yzt] .yz-seri-no b{font-family:Archivo,Poppins,sans-serif;font-size:46px}',
        '.yz[data-yzt="gece"] .yz-sayac.hazir{background:#14243d;color:#eaf1fb}.yz[data-yzt="kagit"] .yz-sayac.hazir{background:#e8e0d0;color:#1d1a16}.yz[data-yzt="neon"] .yz-sayac.hazir{background:rgba(34,211,238,.12);color:#cffafe;box-shadow:inset 0 0 0 1px rgba(34,211,238,.35)}',
        '.yz[data-yzt="kagit"] .yz-bilgi{background:#fff4d6;border-color:#efd27c;color:#5b4300}',
        '.yz[data-yzt="kagit"] .yz-sp.tamam{background:#ecf8ef}',
        '.yz-btn.dev-acik{background:var(--accent-orange);border-color:var(--accent-orange);color:var(--yzt-ana-yazi,#1a0d05)}',
        '.yzt-secici{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}',
        '.yzt-sec{display:flex;flex-direction:column;gap:6px;text-align:left;padding:8px;border-radius:16px;border:2px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;cursor:pointer}.yzt-sec.aktif{border-color:var(--accent-orange)}.yzt-sec:focus-visible{outline:2px solid var(--accent-orange);outline-offset:2px}',
        '.yzt-sec b{font-size:14px;font-weight:900}.yzt-sec small{font-size:11.5px;color:var(--text-muted);line-height:1.35}',
        '.yzt-onizle{position:relative;display:block;height:86px;border-radius:10px;overflow:hidden}',
        '.yzt-onizle i{position:absolute;left:8%;right:8%;height:26%;border-radius:6px}.yzt-onizle i:first-child{top:12%}.yzt-onizle i:nth-child(2){top:48%;right:42%}',
        '.yzt-onizle em{position:absolute;right:8%;top:48%;width:28%;height:26%;border-radius:6px}.yzt-onizle u{position:absolute;left:13%;top:21%;width:34%;height:8%;border-radius:4px;opacity:.85}',
        // hedef paneli
        '.yzh-arka{position:fixed;inset:0;z-index:32400;background:rgba(5,8,15,.62);-webkit-backdrop-filter:blur(5px);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:16px}',
        '.yzh-pano{width:min(1200px,100%);max-height:100%;display:flex;flex-direction:column;background:var(--yzt-zemin,var(--bg-main));color:var(--text-main);border:1px solid var(--border-color);border-radius:24px;box-shadow:0 30px 90px rgba(0,0,0,.5);overflow:hidden}',
        '.yzh-ust{display:flex;gap:16px;align-items:flex-start;padding:18px 20px 10px}',
        '.yzh-baslik{font-family:Archivo,Poppins,sans-serif;font-size:26px;font-weight:900;letter-spacing:-.01em}',
        '.yzh-alt{font-size:13px;color:var(--text-muted);margin-top:2px;line-height:1.45}',
        '.yzh-x{margin-left:auto;width:44px;height:44px;border-radius:14px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);font-size:18px;cursor:pointer;flex:none}',
        '.yzh-toplu{display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:0 20px 12px;font-size:11px;font-weight:900;color:var(--text-muted);text-transform:uppercase;letter-spacing:.1em}',
        '.yzh-toplu button{min-height:36px;padding:0 14px;border-radius:999px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);font:inherit;font-size:12.5px;font-weight:800;letter-spacing:0;text-transform:none;cursor:pointer}',
        '.yzh-izgara{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px;padding:4px 20px 16px;align-content:start}',
        '.yzh-kart{background:var(--bg-panel);border:1.5px solid var(--border-color);border-radius:20px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:var(--yzt-golge,none);transition:border-color .2s}',
        '.yzh-kart.secili{border-color:color-mix(in srgb,var(--accent-orange) 55%,var(--border-color))}',
        '.yzh-bas{display:flex;align-items:center;gap:10px}.yzh-hdf{display:inline-flex;align-items:center;justify-content:center;min-width:36px;height:30px;padding:0 6px;border-radius:9px;background:var(--text-main);color:var(--bg-panel);font-weight:900;font-size:13px}',
        '.yzh-ad{font-size:16px;font-weight:900;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.yzh-sira{font-size:11.5px;font-weight:900;color:var(--text-muted);border:1px solid var(--border-color);border-radius:999px;padding:3px 9px;white-space:nowrap}',
        '.yzh-skor{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px}',
        '.yzh-skor>div{display:flex;flex-direction:column;gap:1px;padding:8px 10px;border-radius:14px;background:var(--bg-main);min-width:0}',
        '.yzh-skor small{font-size:9.5px;font-weight:900;letter-spacing:.12em;color:var(--text-muted)}.yzh-skor b{font-family:Archivo,Poppins,sans-serif;font-size:28px;font-weight:900;line-height:1.05;font-variant-numeric:tabular-nums}.yzh-skor em{font-style:normal;font-size:11px;color:var(--text-muted);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.yzh-skor .yzh-hk{background:color-mix(in srgb,var(--accent-orange) 15%,var(--bg-main))}.yzh-skor .yzh-hk b{color:var(--accent-orange)}',
        '.yzh-bar{position:relative;height:10px;border-radius:99px;background:var(--bg-main);overflow:hidden}.yzh-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:99px;transition:width .35s}.yzh-bar i.tah{background:color-mix(in srgb,var(--accent-orange) 30%,transparent)}.yzh-bar i.su{background:var(--accent-orange)}',
        '.yzh-secenek{display:grid;grid-template-columns:repeat(auto-fit,minmax(68px,1fr));gap:6px}',
        '.yzh-tas{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:8px 10px;border-radius:14px;border:1.5px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;cursor:pointer;text-align:left;transition:border-color .15s,background .15s}',
        '.yzh-tas span{font-size:11px;font-weight:800;color:var(--text-muted);white-space:nowrap}.yzh-tas b{font-family:Archivo,Poppins,sans-serif;font-size:22px;font-weight:900;line-height:1.1;font-variant-numeric:tabular-nums}.yzh-tas small{font-size:10.5px;font-weight:700;color:var(--text-muted);white-space:nowrap}',
        '.yzh-tas.kolay.aktif{border-color:#22c55e;background:color-mix(in srgb,#22c55e 15%,transparent)}.yzh-tas.ger.aktif{border-color:#eab308;background:color-mix(in srgb,#eab308 17%,transparent)}.yzh-tas.iddia.aktif{border-color:#f97316;background:color-mix(in srgb,#f97316 17%,transparent)}.yzh-tas.rekor.aktif{border-color:#a855f7;background:color-mix(in srgb,#a855f7 17%,transparent)}',
        '.yzh-giris{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
        '.yzh-giris button{width:44px;height:44px;border-radius:12px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;font-size:13px;font-weight:900;cursor:pointer;flex:none}',
        '.yzh-giris input{width:92px;height:44px;border-radius:12px;border:1.5px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;font-family:Archivo,Poppins,sans-serif;font-size:22px;font-weight:900;text-align:center;-moz-appearance:textfield;appearance:textfield}',
        '.yzh-giris input::-webkit-outer-spin-button,.yzh-giris input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}.yzh-giris input:focus{outline:none;border-color:var(--accent-orange)}',
        '.yzh-giris .yz-hp-z{margin-left:auto;font-size:12px;font-weight:900;padding:5px 10px;border-radius:999px;background:var(--bg-main);white-space:nowrap}.yzh-giris .yz-hp-z:empty{display:none}',
        '.yzh-arka .yz-hp-z.kolay{color:#16a34a}.yzh-arka .yz-hp-z.orta{color:#ca8a04}.yzh-arka .yz-hp-z.zor{color:#ea580c}.yzh-arka .yz-hp-z.cokzor{color:#dc2626}',
        '[data-yzt="gece"] .yz-hp-z.kolay,[data-yzt="neon"] .yz-hp-z.kolay{color:#4ade80}[data-yzt="gece"] .yz-hp-z.orta,[data-yzt="neon"] .yz-hp-z.orta{color:#facc15}[data-yzt="gece"] .yz-hp-z.zor,[data-yzt="neon"] .yz-hp-z.zor{color:#fb923c}[data-yzt="gece"] .yz-hp-z.cokzor,[data-yzt="neon"] .yz-hp-z.cokzor{color:#f87171}',
        '.yzh-motive{font-size:13.5px;font-weight:700;line-height:1.45;padding:10px 12px;border-radius:14px;background:color-mix(in srgb,var(--accent-orange) 10%,transparent)}.yzh-motive:empty{display:none}',
        '.yzh-son{display:flex;gap:10px;justify-content:flex-end;align-items:center;padding:12px 20px;border-top:1px solid var(--border-color);background:var(--bg-panel)}.yzh-son span{margin-right:auto;font-size:13px;color:var(--text-muted);font-weight:700}',
        '@media (max-width:600px){.yzh-arka{padding:0}.yzh-pano{border-radius:0;height:100%}.yzh-izgara{grid-template-columns:1fr;padding:4px 12px 12px}.yzh-ust{padding:14px 12px 8px}.yzh-toplu{padding:0 12px 10px}.yzh-baslik{font-size:21px}.yzh-son{padding:10px 12px}}',
        // Tam ekranda tamEkranKatmanlariTasi() onay penceresini body'den <html>'e taşıyor → "body.yz-tv-acik #onay-modal" eşleşmiyor,
        // pencere (31000) TV'nin (31500) ALTINDA kalıyordu: TV'de süre menüsü, "sonraki seri" onayı vb. görünmüyordu.
        'html.yz-tv-kok #onay-modal{z-index:32500!important}',
        // tablo / TV hedef göstergesi
        '.yz-tablo td.tmp.hb{padding-left:.4em;padding-right:.4em}',
        '.yz-hb{display:flex;flex-direction:column;gap:.2em;min-width:5.6em}',
        '.yz-hb-ust{display:flex;align-items:baseline;justify-content:space-between;gap:.5em;line-height:1}',
        '.yz-hb-et{font-size:.62em;font-weight:800;white-space:nowrap}.yz-hb-ust b{font-size:.95em;font-weight:900;white-space:nowrap}.yz-hb-ust b::before{content:"🎯";font-size:.6em;margin-right:.18em;vertical-align:.18em}',
        '.yz-hb-bar{position:relative;height:.34em;min-height:5px;border-radius:99px;background:rgba(127,127,127,.22);overflow:hidden}.yz-hb-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:99px}.yz-hb-bar i.tah{opacity:.32}',
        'td.hb.ust .yz-hb-bar i{background:#22c55e}td.hb.ust .yz-hb-et{color:#16a34a}',
        'td.hb.orta .yz-hb-bar i{background:#f59e0b}td.hb.orta .yz-hb-et{color:#d97706}',
        'td.hb.alt .yz-hb-bar i{background:#60a5fa}td.hb.alt .yz-hb-et{color:#3b82f6}',
        'td.hb.ulasti .yz-hb-bar i{background:linear-gradient(90deg,#f5c518,#fff3b0,#f5c518);background-size:200% 100%;animation:yzHbParla 1.6s linear infinite}td.hb.ulasti .yz-hb-et{color:#c99a06}',
        '@keyframes yzHbParla{to{background-position:-200% 0}}',
        '.yz .yz-tablo td.hb b{color:var(--text-main)}#yz-tv .yz-tablo td.hb b{color:#e8eef7}#yz-tv.kagit .yz-tablo td.hb b{color:#1d1a16}',
        '#yz-tv:not(.kagit) td.hb.ust .yz-hb-et{color:#4ade80}#yz-tv:not(.kagit) td.hb.orta .yz-hb-et{color:#fbbf24}#yz-tv:not(.kagit) td.hb.alt .yz-hb-et{color:#93c5fd}#yz-tv:not(.kagit) td.hb.ulasti .yz-hb-et{color:#fde047}',
        '#yz-tv .yz-tablo td.tmp.hb{font-size:.9em}',
        // TV Kapat: sağ altta, her zaman görünür, kendi şeridinde
        'body #yz-tv.yz-tv{padding-bottom:calc(1.8vh + 48px)}',
        'body #yz-tv.yz-tv .yz-tv-kapat{top:auto;left:auto;bottom:1.1vh;right:1.4vw;opacity:1;z-index:40;padding:9px 20px;font-size:15px;font-weight:900;border-radius:999px;background:#1d1a16;color:#fff;border:2px solid #1d1a16;box-shadow:0 8px 22px rgba(0,0,0,.28);cursor:pointer}',
        'body #yz-tv.yz-tv:not(.kagit) .yz-tv-kapat{background:#e8eef7;color:#0b1220;border-color:#e8eef7}',
        '#yz-tv .yz-tv-k.dev-acik{background:#fbbf24;border-color:#fbbf24;color:#1a1203}',
        // ⛶ büyük sayaç
        '#yz-dev-sayac{position:fixed;inset:0;z-index:31900;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.4vh;color:#fff;background:#15803d;font-family:Archivo,Poppins,sans-serif;cursor:pointer;user-select:none;-webkit-user-select:none;transform-origin:calc(100% - 10vw) 8vh;transition:transform .7s cubic-bezier(.6,0,.3,1),opacity .7s,background .35s;animation:yzDevGir .55s cubic-bezier(.2,.8,.2,1)}',
        '#yz-dev-sayac.hazirlik,#yz-dev-sayac.bitti{background:#c81e1e}#yz-dev-sayac.son{background:#facc15;color:#1a1a1a}',
        '#yz-dev-sayac.kucul{transform:scale(.08);opacity:0;pointer-events:none}',
        '@keyframes yzDevGir{from{transform:scale(.08);opacity:0}}',
        '.yz-dev-ust{display:flex;gap:2.4vw;align-items:center;font-size:max(18px,2.8vw);font-weight:900;letter-spacing:.14em}.yz-dev-seri{opacity:.7}.yz-dev-seri:empty{display:none}',
        '.yz-dev-sure{font-size:min(60vh,46vw);font-weight:900;line-height:.82;font-variant-numeric:tabular-nums;letter-spacing:-.03em}',
        '#yz-dev-sayac.bitti .yz-dev-sure{font-size:min(30vh,22vw)}',
        '.yz-dev-bar{width:min(80vw,1400px);height:2.2vh;min-height:10px;border-radius:99px;background:rgba(0,0,0,.22);overflow:hidden}.yz-dev-bar i{display:block;height:100%;background:currentColor;border-radius:99px;transition:width .25s linear}',
        '.yz-dev-ipucu{font-size:max(12px,1.1vw);font-weight:800;opacity:.6;letter-spacing:.06em}',
        '#yz-dev-sayac.son .yz-dev-sure{animation:yzDevNabiz 1s ease-in-out infinite}@keyframes yzDevNabiz{50%{transform:scale(1.04)}}',
        '@media (prefers-reduced-motion:reduce){#yz-dev-sayac,#yz-dev-sayac .yz-dev-sure{transition:none;animation:none}}'
    ].join('\n');
    document.head.appendChild(st);
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
        return '<button class="yz-arsiv-sat" onclick="yzArsivGoster(\'' + yzEnc(r.id) + '\')"><span class="yz-arsiv-t">' + yzTarihTR(r.tarih) + '</span><span class="yz-arsiv-f">' + esc(r.mesafe) + ' · ' + yzFormatBul(r.format).kisa + ' · ' + (r.sporcular || []).length + ' sporcu</span><span class="yz-arsiv-i">' + ilk + '</span></button>';
    }).join('') + '</div></div>';
}
function yzArsivGoster(idEnc) {
    let id = decodeURIComponent(idEnc), r = yzArsivOku().find(function (x) { return x.id === id; }); if (!r) return;
    let satir = (r.sporcular || []).map(function (s) {
        return '<tr><td>' + s.sira + '</td><td style="text-align:left"><b>' + esc(s.ad) + '</b></td><td><b>' + s.toplam + '</b></td><td>' + s.on + '</td><td>' + s.x + '</td><td>' + (s.hp ? (s.toplam >= s.hp ? '✓ ' : '') + s.hp : '·') + '</td><td>' + (s.eleme ? esc(s.eleme) : '·') + '</td></tr>';
    }).join('');
    onayIste('<div style="text-align:left"><b>📚 ' + yzTarihTR(r.tarih) + ' · ' + esc(r.mesafe) + ' · ' + yzFormatBul(r.format).ad + '</b><div class="yz-tablo-kap" style="margin-top:10px"><table class="yz-tablo"><thead><tr><th>#</th><th class="ad">SPORCU</th><th>TOPLAM</th><th>10+X</th><th>X</th><th>HEDEF</th><th>ELEME</th></tr></thead><tbody>' + satir + '</tbody></table></div></div>', null);
}

// ---------------------------------------------------------------- 🎯 ok dağılımı
function yzDagilim(o, k) { let c = {}; YZ_DEGERLER.forEach(function (p) { c[p] = 0; }); yzSkor(o, k).forEach(function (e) { (e || []).forEach(function (p) { c[p] = (c[p] || 0) + 1; }); }); return c; }
function yzDagilimTabloHTML(o, sira) {
    let bas = '<th class="sira">#</th><th class="ad">SPORCU</th>' + YZ_DEGERLER.map(function (p) { return '<th><span class="yz-dg-bas ' + yzOkRenk(p) + '">' + p + '</span></th>'; }).join('') + '<th class="yz-dg-cub-bas">DAĞILIM</th><th>10+X %</th><th>9+ %</th>';
    let govde = sira.map(function (r) {
        let c = yzDagilim(o, r.k), top = r.ok || 1, maks = Math.max.apply(null, YZ_DEGERLER.map(function (p) { return c[p]; })) || 1;
        let hucre = YZ_DEGERLER.map(function (p) { return '<td class="yz-dg" style="--a:' + (c[p] ? (0.12 + 0.6 * c[p] / maks).toFixed(2) : 0) + '">' + (c[p] || '·') + '</td>'; }).join('');
        let cub = '<td class="yz-dg-cub"><span>' + YZ_DEGERLER.filter(function (p) { return c[p]; }).map(function (p) { return '<i class="' + yzOkRenk(p) + '" style="flex:' + c[p] + '" title="' + p + ': ' + c[p] + '"></i>'; }).join('') + '</span></td>';
        return '<tr><td class="sira">' + r.sira + '</td><td class="ad">' + esc(yzKisaAd(r.ad)) + '</td>' + hucre + cub + '<td><b>' + (r.ok ? Math.round((c.X + c['10']) / top * 100) : 0) + '</b></td><td>' + (r.ok ? Math.round((c.X + c['10'] + c['9']) / top * 100) : 0) + '</td></tr>';
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
        + '<div class="yz-sayac-kap">' + yzSayacHTML(o, 'yz-sayac') + '<div class="yz-sayac-btn">' + (o.sayac ? '<button class="yz-btn" onclick="yzSayacDurdur()">⏹ Sıfırla</button>' : '<button class="yz-btn yesil" onclick="yzSayacBaslat()">▶ Set süresi</button>') + '<button class="yz-btn" onclick="yzSureMenu()" title="Set süresini değiştir">⏱ ' + yzSure(d) + ' sn</button>' + yzDevBtnHTML() + '</div></div>'
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
            let v = yzRaporVeri(o, sr.k), r = v.r, f = v.f, y = _kurumsalBaslikCiz(pdf, mx, uw, 12, 'SPORCU RAPORU', 'Sıralama turu  |  ' + d.ayar.mesafe + '  |  ' + f.ad + '  |  ' + new Date(d.basla).toLocaleDateString('tr-TR'));
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(9, 22, 43); pdf.text(T(r.ad), mx, y + 4);
            if (v.pb) { pdf.setFontSize(9); pdf.setTextColor(194, 65, 12); pdf.text(T('KİŞİSEL REKOR'), W - mx, y + 4, { align: 'right' }); }
            y += 10;
            let kutular = [['SIRA', r.sira + '.', v.kisi + ' sporcu'], ['TOPLAM', String(r.toplam), r.ok + ' ok'], ['OK ORT.', v.ort.toFixed(2), ''], ['10+X', String(r.on), 'X: ' + r.x]];
            if (r.hedefPuan) kutular.push(['HEDEF', String(r.hedefPuan), r.toplam >= r.hedefPuan ? 'ulaşıldı +' + (r.toplam - r.hedefPuan) : (r.hedefPuan - r.toplam) + ' eksik']);
            if (v.son) kutular.push(['ÖNCEKİ TUR', String(v.son.toplam), (r.toplam - v.son.toplam >= 0 ? '+' : '') + (r.toplam - v.son.toplam)]);
            if (r.gelisim != null) kutular.push(['GELİŞİM', (r.gelisim >= 0 ? '+' : '') + r.gelisim, 'kendi ort.']);
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
            if (f.yari) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(51, 65, 85); pdf.text(T('1. yarı ' + r.y1 + '   |   2. yarı ' + r.y2 + ' (' + (r.y2 - r.y1 >= 0 ? '+' : '') + (r.y2 - r.y1) + ')' + (v.en ? '   |   en iyi seri ' + (v.en.i + 1) + '. (' + v.en.v + ')   |   en zayıf ' + (v.kotu.i + 1) + '. (' + v.kotu.v + ')' : '')), mx, y); y += 8; }
            // ok dağılımı
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(9, 22, 43); pdf.text(T('Ok dağılımı'), mx, y); y += 3;
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
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(9, 22, 43); pdf.text(T('Gelişim (aynı format ve mesafe)'), mx, y); y += 5;
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5); pdf.setTextColor(51, 65, 85);
            if (v.onc.length) { pdf.text(T(v.onc.slice(-5).map(function (x) { return yzTarihTR(x.tarih) + ': ' + x.toplam; }).join('   >   ') + '   >   bugün: ' + r.toplam), mx, y); }
            else pdf.text(T('Önceki tur yok — bir sonraki turda kıyas burada görünecek.'), mx, y);
            y += 7;
            if (v.eleme) { pdf.text(T('Eleme: ' + v.eleme), mx, y); y += 7; }
            if (v.yorgun && v.yorgun.durum !== 'az') { pdf.setFont('helvetica', 'bold'); pdf.text(T('Tur içi: ' + v.yorgun.baslik + (v.yorgun.ozet ? ' - ' + v.yorgun.ozet : '')), mx, y); pdf.setFont('helvetica', 'normal'); y += 5; pdf.text(pdf.splitTextToSize(T(v.yorgun.detay), uw), mx, y); y += 8; }
            if (v.oneri) { pdf.setFont('helvetica', 'bold'); pdf.text(T('Grup: ' + v.oneri.kisa + ' (çap ~' + v.oneri.cap + ' cm, ' + v.oneri.sik + ')'), mx, y); pdf.setFont('helvetica', 'normal'); y += 5; pdf.text(T('Nişangah: ' + v.oneri.oneri), mx, y); y += 7; }
            pdf.setDrawColor(203, 213, 225); pdf.setLineWidth(0.3);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(9, 22, 43); pdf.text(T('Antrenör notu'), mx, y + 4);
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
// ---- 📈 Gelişim (2026-10-14, kullanıcı: "sporcuların gelişim grafiğini daha anlamlı hale getir" → sporcu kartı + Gelişim
// görünümü). Önceki turlar arşivden (aynı mesafe; seri seri karşılaştırma için aynı format). Ok başı ortalama kullanılır ki
// 36/60/72 oklu turlar birbirine kıyaslanabilsin. Gelişim sütunu: +puan (kendi beklentisine göre) + ok başı fark + son
// turların küçük çizgisi (bugünkü nokta vurgulu).
function yzGecmisTurlar(k, d) {
    if (!d) return [];
    let anahtar = d.id + ':' + yzArsivOku().length;
    if (!_yz.gecmisCache || _yz.gecmisCache.a !== anahtar) _yz.gecmisCache = { a: anahtar, m: {} };
    if (_yz.gecmisCache.m[k]) return _yz.gecmisCache.m[k];
    let l = yzArsivOku().filter(function (r) { return r.id !== d.id && r.mesafe === d.ayar.mesafe; }).map(function (r) {
        let x = (r.sporcular || []).find(function (q) { return q.k === k; });
        return x && x.ok ? { id: r.id, t: r.t, tarih: r.tarih, format: r.format, toplam: x.toplam, ok: x.ok, okOrt: x.toplam / x.ok, seriT: x.seriT || null, sira: x.sira, kisi: (r.sporcular || []).length } : null;
    }).filter(Boolean).sort(function (a, b) { return a.t - b.t; }).slice(-6);
    _yz.gecmisCache.m[k] = l; return l;
}
function yzMiniCizgi(degerler, w, h, renk) {
    if (degerler.length < 2) return '';
    let mn = Math.min.apply(null, degerler), mx = Math.max.apply(null, degerler), ar = Math.max(0.4, mx - mn);
    let X = function (i) { return 2 + i / (degerler.length - 1) * (w - 4); }, Y = function (v) { return h - 2 - (v - mn) / ar * (h - 4); };
    let p = degerler.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' '), n = degerler.length - 1;
    return '<svg class="yz-mini" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><polyline points="' + p + '" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.6" vector-effect="non-scaling-stroke"/><circle cx="' + X(n).toFixed(1) + '" cy="' + Y(degerler[n]).toFixed(1) + '" r="2.6" fill="' + renk + '"/></svg>';
}
function yzGelisimHucre(r, enIyi) {
    if (r.gelisim == null) return '<td class="gel bos" title="Geçmiş veri yok — ilk turundan sonra karşılaştırılır">yeni</td>';
    let d = yzOku().durum, gecmis = yzGecmisTurlar(r.k, d), bugun = r.ok ? r.toplam / r.ok : null;
    let seri = gecmis.map(function (g) { return g.okOrt; }); if (bugun != null) seri.push(bugun);
    let fark = bugun != null && r.ortOk ? bugun - r.ortOk : null, renk = r.gelisim >= 0 ? '#16a34a' : '#dc2626';
    let ipucu = 'Kendi beklentisi: ' + (r.ortOk ? (r.ortOk * r.ok).toFixed(0) + ' (ok başı ' + r.ortOk.toFixed(2) + ', ' + (r.ortKaynak || '') + ')' : '') + (gecmis.length ? ' · son turlar ok başı: ' + gecmis.map(function (g) { return g.okOrt.toFixed(1); }).join(' → ') + (bugun != null ? ' → bugün ' + bugun.toFixed(1) : '') : '');
    return '<td class="gel ' + (r.gelisim >= 0 ? 'ust' : 'alt') + '" title="' + esc(ipucu) + '"><span class="yz-gel-ic">' + yzMiniCizgi(seri, 46, 16, renk)
        + '<span class="yz-gel-say"><b>' + (enIyi ? '🔥 ' : '') + (r.gelisim >= 0 ? '+' : '') + r.gelisim + '</b>' + (fark != null ? '<small>' + (fark >= 0 ? '▲' : '▼') + Math.abs(fark).toFixed(1).replace('.', ',') + '/ok</small>' : '') + '</span></span></td>';
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
    let oyunaGec = (typeof kmKarmaMi === 'function' && kmKarmaMi() ? dugme('🎮 Oyun', 'kmKarmaOyunaGec()', 'oyun', 'Oyun hattına geç — tam ekran sürer') : '') + (yzYuvaVarMi() ? dugme('🥚', 'yzYuvayaGec()', 'oyun', 'Yumurta Yuvası — tam ekran sürer') : '');
    if (d.asama === 'eleme') {
        let sh = el && el.maclar.some(function (m) { return m.shootGerek && !m.kazanan; });
        return '<div class="yz-tv-kontrol">' + oyunaGec + sayac + sure + dugme('⛶', 'yzDevSayacDegis()', yzDevAyar() ? 'dev-acik' : '', 'Büyük sayaç: süre başlayınca ekranı kaplar, bitince küçülür') + (sh ? dugme('🎯 Shoot-off 40 sn', 'yzShootSayac()') : '') + '</div>';
    }
    let f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1), bek = yzBekleyenler(o, seri).length, son = seri >= f.seri - 1;
    // 2026-10-14 (kullanıcı: "TV ekranında her şeyi yapabileyim"): sporcu ekle/çıkar, önceki seriye dön ve tur menüsü
    // TV'den de; düğmeler büyüdü ve sığmazsa alt satıra geçer (eskiden tek satırda sıkışıyordu).
    return '<div class="yz-tv-kontrol">' + oyunaGec + sayac + sure + dugme('⛶', 'yzDevSayacDegis()', yzDevAyar() ? 'dev-acik' : '', 'Büyük sayaç: süre başlayınca ekranı kaplar, bitince küçülür') + dugme('🎯', 'yzHedeflerAc()', '', 'Kişisel hedef puanları') + dugme('🎥', 'yzVideoAc()', '', 'Gecikmeli ayna / canlı / video')
        + dugme('👥 ' + d.katilimci.length, 'yzSporcuSecici(\'tur\')', '', 'Sporcu ekle / çıkar')
        + (bek ? dugme('✎ Skor gir (' + bek + ')', 'yzTvSiradaki()', 'ana', 'Sıradaki sporcunun skorunu gir — satıra tıklayarak da girebilirsin') : '')
        + (seri > 0 ? dugme('◀', 'yzOncekiSeri()', '', 'Önceki seriye dön (skorlar silinmez)') : '')
        + dugme(son ? '🏁 Bitir' : '▶ ' + (seri + 2) + '. seri', 'yzSonrakiSeri()', bek ? '' : 'ana', bek ? bek + ' sporcu girmedi — yine de geçebilirsin, sonradan tablodan girilir' : '') + dugme(yzTvTema() === 'kagit' ? '🌙' : '☀️', 'yzTvTemaDegis()', '', 'Görünüm: açık (Hedef Kâğıdı) / koyu') + dugme('⋯', 'yzMenu()', '', 'Tur menüsü: PDF, bitir, iptal') + '</div>';
}
// 🥚 Yarışma → Yumurta Yuvası (2026-10-14, kullanıcı: "yumurta oyunu yarışma moduyla birlikte çalışmıyor, geçiş yeri yok").
// Düğme, derste yumurtası olan biri varsa ya da karma derste görünür. TV/tam ekrandan gelince yumurta ekranı tam ekran açılır.
function yzYuvaVarMi() {
    if (typeof kmKarmaMi === 'function' && kmKarmaMi()) return true;
    return (typeof _kmListe !== 'undefined' ? _kmListe : []).some(function (k) { let sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; return !!(sp && sp.oyun && sp.oyun.yuva); });
}
function yzYuvayaGec() {
    let tam = !!(document.fullscreenElement || document.webkitFullscreenElement);
    try { if (_yz.tv) yzTvKapat(true); } catch (e) {}
    kmSekme('yuva');
    if (!tam) return;
    let i = 0, bekle = function () { let el = document.getElementById('yv-kok'); if (el) { if (typeof kmTamEkranaGec === 'function') kmTamEkranaGec(el); } else if (i++ < 25) setTimeout(bekle, 120); };
    bekle();
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
// Silinmiş / başka gruba taşınmış (turnuvaDB'de olmayan) sporcu derste kalmış olabilir — maça alınmaz, yoksa skoru
// "Sporcu bulunamadı" diye reddedilir ve eşleşme kilitlenir.
function yzKatilanlar() { return (typeof _kmListe !== 'undefined' ? _kmListe : []).filter(function (s) { return !_yzK.haric[s.g + '|' + s.ad] && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; }); }
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
    window[ad] = function () { let r = eski.apply(this, arguments); if (_yz.mod === 'takim') yzUstBarEkle('⚔️ Takım & Düello', YZ_TK_TV_BTN); if (document.getElementById('yz-tk-tv')) { _yzTk.imza = ''; yzTkCiz(); } return r; };
});

// ---------------------------------------------------------------- stil
function yzCssYukle() {
    yzEkCssYukle(); yzEk2CssYukle(); yzSkCssYukle(); yzV240CssYukle();
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
        '.yz-akis{display:grid;gap:8px;padding:10px 12px;border-radius:14px;border:1px dashed var(--border-color);background:rgba(253,142,1,.06)}',
        '.yz-akis-bas{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:13px}.yz-akis-btn{display:flex;gap:6px;flex-wrap:wrap}',
        '.yz-akis-cip{display:flex;flex-wrap:wrap;gap:6px}.yz-akis-cip .yz-cip{min-height:38px}',
        '.yz-giris-tamam{text-align:left}.yz-tamam-btnlar{display:grid;gap:10px;margin:14px 0 8px}.yz-tamam-btnlar .yz-btn{min-height:52px;font-size:16px}',
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

// ---------------------------------------------------------------- 📺 TV — Takım & Düello (2026-10-02)
// Kullanıcı: "Sıralama Turu'ndaki gibi PC'den televizyona eleme ağacı ve canlı maç (set puanları, kimin attığı,
// kazanan)". Motor app.js'te (_kmTakimlar / _kmYarismaBracketMaclar / kmYarismaMacSonucDegerlendir) — burada
// SADECE okunur; değerler ortak ders senkronuyla (kurulum paketi) ve seri yayınıyla (turnuvaDB) canlı gelir, ekran
// 1.2 sn'de bir yeniden hesaplanıp yalnızca değişince çizilir. TV'den skor girişi motorun kendi kayıt yolundan
// (kmYarismaSeriKaydet) geçer — eleme ilerlemesi / kazanan seçimi aynen çalışır.
const YZ_TK_TV_BTN = '<button class="yz-btn tv" onclick="yzTkTvAc()">📺 TV ekranı</button>';
let _yzTk = { poll: null, imza: '', sayim: {}, son: null, kilit: null, giris: null };
function yzTkTvAc() {
    yzCssYukle(); yzTkCssYukle(); yzTv2Css();
    document.body.classList.add('yz-tv-acik'); document.documentElement.classList.add('yz-tv-kok');
    let el = document.getElementById('yz-tk-tv');
    if (!el) {
        el = document.createElement('div'); el.id = 'yz-tk-tv'; el.className = 'yz-tv yz-tk'; document.body.appendChild(el);
        // Tam ekran SAYFAYA verilir (TV kutusuna değil) — yoksa skor girişi penceresi üstüne çıkamaz (bkz. yzTvAc).
        try { let kok = document.documentElement; if (kok.requestFullscreen && !document.fullscreenElement) kok.requestFullscreen().catch(function () {}); } catch (e) {}
        try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { _yzTk.kilit = l; }).catch(function () {}); } catch (e) {}
        document.addEventListener('keydown', yzTkTus, true);
    }
    _yzTk.imza = ''; _yzTk.sayim = {}; _yzTk.son = null;
    yzTkCiz();
    clearInterval(_yzTk.poll); _yzTk.poll = setInterval(yzTkCiz, 1200);
}
function yzTkTvKapat() {
    clearInterval(_yzTk.poll); _yzTk.poll = null; yzTkGirisKapat();
    let el = document.getElementById('yz-tk-tv'); if (el) el.remove();
    if (!_yz.tv) { document.body.classList.remove('yz-tv-acik'); document.documentElement.classList.remove('yz-tv-kok'); }
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    try { if (_yzTk.kilit) { _yzTk.kilit.release(); _yzTk.kilit = null; } } catch (e) {}
    document.removeEventListener('keydown', yzTkTus, true);
}
function yzTkTus(e) {
    if (e.key !== 'Escape' || !document.getElementById('yz-tk-tv')) return;
    e.preventDefault(); if (_yzTk.giris) yzTkGirisKapat(); else yzTkTvKapat();
}
// Bir tarafın her sporcusunun BU maçtaki serileri. snap: maç başlangıç anlık görüntüsü ({'g|ad': {seriSayisi}}).
// bracketMi: görüntüde olmayan sporcunun maçta serisi yok sayılır (motordaki _kmYarismaBracketMacTurBazliPuanlar ile aynı).
function yzTkUyeler(t, snap, bracketMi) {
    return (t.uyeler || []).map(function (u) {
        let sp = turnuvaDB[u.g] && turnuvaDB[u.g][u.ad], tum = (sp && sp.seriler) || [];
        let baz = snap && snap[u.g + '|' + u.ad];
        let n = baz && typeof baz === 'object' ? (baz.seriSayisi || 0) : (bracketMi ? tum.length : 0);
        return { k: u.g + '|' + u.ad, ad: u.ad, seriler: tum.slice(n).map(function (s) { return s.puan || 0; }) };
    });
}
function yzTkVeri() {
    let v = { mod: 'bos', taraflar: [], deg: null, mac: null, sampiyon: null, maclar: _kmYarismaBracketMaclar || [] };
    if (_kmRakipTipi === 'hayali') { v.mod = 'hayali'; return v; }
    if (_kmYarismaBracketGorunum === 'agac' && v.maclar.length) {
        v.mod = 'agac';
        let sonTur = v.maclar.filter(function (m) { return m.tur === _kmYarismaBracketToplamTur; });
        if (sonTur.length === 1 && sonTur[0].durum === 'bitti') v.sampiyon = _kmTakimlar[sonTur[0].kazananIdx] || null;
        let m = v.maclar.filter(function (x) { return x.durum === 'devam' && !x.isBye; }).sort(function (a, b) { return a.tur - b.tur; })[0];
        if (m && _kmTakimlar[m.aIdx] && _kmTakimlar[m.bIdx]) {
            v.mac = m;
            v.taraflar = [['a', m.aIdx], ['b', m.bIdx]].map(function (x) { let t = _kmTakimlar[x[1]]; return { t: t, idx: x[1], turlar: _kmYarismaBracketMacTurBazliPuanlar(m, x[0]), uyeler: yzTkUyeler(t, m.baslangicPuan, true) }; });
        }
    } else if (_kmYarismaAktif) {
        v.mod = 'mac';
        v.taraflar = _kmYarismaAktifTakimlar().map(function (t) { return { t: t, idx: _kmTakimlar.indexOf(t), turlar: _kmYarismaTurBazliPuanlar(t), uyeler: yzTkUyeler(t, _kmYarismaBaslangicPuan, false) }; });
    } else if (_kmYarismaBracketGorunum === 'eslestirme' || _kmYarismaBracketGorunum === 'siralama') v.mod = 'hazirlik';
    if (v.taraflar.length === 2) { try { v.deg = kmYarismaMacSonucDegerlendir(v.taraflar); } catch (e) {} }
    else if (v.taraflar.length > 2) v.setSonuc = _kmYarismaSetPuanlariHesapla(v.taraflar.map(function (x) { return x.turlar; }));
    return v;
}
function yzTkOkSayisi(k, d) {
    if (d && d.durum === 'shootoff') return 1;
    let n = typeof _kmYarismaOkSayisi !== 'undefined' ? _kmYarismaOkSayisi : 0;
    return n === 3 || n === 6 ? n : ((k && k.okSayisi) || 3);
}
function yzTkKuralYazi(k) {
    if (!k) return '';
    if (k.hedefTip === 'toplam') return 'toplam ' + k.hedefPuan + ' puana ilk ulaşan kazanır';
    if (k.hedefTip === 'tur') return k.hedefTur + ' tur antrenman maçı';
    return 'set sistemi · ' + k.okSayisi + ' ok/set · ' + k.hedefSetPuani + ' set puanı alan kazanır';
}
function yzTkCiz() {
    let el = document.getElementById('yz-tk-tv'); if (!el) return;
    let v = yzTkVeri(), simdi = Date.now();
    // "Kim attı": bir sporcunun maçtaki seri sayısı arttıysa son atan odur — birkaç saniye vurgulanır.
    v.taraflar.forEach(function (x) {
        x.uyeler.forEach(function (u) {
            let n = u.seriler.length, e = _yzTk.sayim[u.k];
            if (e != null && n > e) _yzTk.son = { k: u.k, ad: u.ad, puan: u.seriler[n - 1], renk: x.t.renk, z: simdi };
            _yzTk.sayim[u.k] = n;
        });
    });
    let son = _yzTk.son && simdi - _yzTk.son.z < 6000 ? _yzTk.son : null;
    let html = yzTkHTML(v, son);
    if (html === _yzTk.imza) return;
    _yzTk.imza = html; el.innerHTML = html;
}
function yzTkSonAtanHTML(son) {
    return son ? '<span>🎯 <b style="color:' + son.renk + '">' + esc(son.ad) + '</b> attı: <b>' + son.puan + '</b></span>' : '<span class="yz-alt">Sporcuya dokun → skor gir</span>';
}
function yzTkHTML(v, son) {
    let kapat = '<button class="yz-tv-kapat" onclick="yzTkTvKapat()">✕ Kapat</button>';
    let bos = function (b, a) { return kapat + '<div class="yz-tv-bos"><div class="yz-tv-logo">DAĞ S.K.</div><div>' + b + '</div><small>' + a + '</small></div>'; };
    if (v.mod === 'hayali') return bos('Hayali rakip maçı', 'TV ekranı gerçek takım ve düello maçları içindir.');
    if (v.mod === 'hazirlik') return bos('Eşleşmeler hazırlanıyor', 'Turnuva başlayınca eleme ağacı ve canlı maç burada görünür.');
    if (v.mod === 'bos') {
        let g = (typeof _kmYarismaGecmisi !== 'undefined' && _kmYarismaGecmisi[0] && _kmYarismaGecmisi[0].tarih === bugunISO()) ? _kmYarismaGecmisi[0] : null;
        return bos('Maç henüz başlamadı', g && g.kazananAd ? 'Son maç: ' + esc(g.kazananAd) + (g.kazananAd !== 'Berabere' ? ' kazandı' : '') : 'Tablette Yarışma → Takım & Düello → başlat');
    }
    let k = v.deg ? v.deg.kural : (v.taraflar.length ? kmYarismaMacKuralSecimi(v.taraflar.slice(0, 2)) : null);
    let turAd = v.mac ? _kmYarismaTurAdi(v.mac.tur, _kmYarismaBracketToplamTur) : '';
    let duelloMu = v.taraflar.length > 0 && v.taraflar.every(function (x) { return (x.t.uyeler || []).length === 1; });
    let bas = kapat + '<div class="yz-tv-bas"><div class="yz-tv-kimlik"><div class="yz-tv-logo">DAĞ S.K.</div><div class="yz-tv-ad">' + (duelloMu ? 'DÜELLO' : 'TAKIM MAÇI') + (v.mod === 'agac' ? ' · ELEME' : '') + '</div><div class="yz-tv-alt">' + yzTkKuralYazi(k) + '</div></div>'
        + '<div class="yz-tv-seri"><span class="yz-tv-seri-et">' + (v.sampiyon ? 'TURNUVA' : 'CANLI') + '</span><b style="font-size:2.6vw">' + (v.sampiyon ? 'BİTTİ' : esc(turAd || 'MAÇ')) + '</b></div></div>';
    let govde = '';
    if (v.sampiyon) govde += '<div class="yz-tk-sampiyon" style="--tr:' + v.sampiyon.renk + '"><span>🏆</span><div><small>ŞAMPİYON</small><b>' + kmYarismaIkonSvg(_kmTakimIkonAl(v.sampiyon, _kmTakimlar.indexOf(v.sampiyon)), 20) + '</span> ' + esc(v.sampiyon.ad) + '</b></div></div>';
    if (v.taraflar.length === 2) govde += yzTkCanliHTML(v, k, son);
    else if (v.taraflar.length > 2) govde += yzTkCokluHTML(v, son);
    if (v.mod === 'agac') { let enCok = 0; v.maclar.forEach(function (m) { enCok = Math.max(enCok, v.maclar.filter(function (x) { return x.tur === m.tur; }).length); }); govde += '<div class="yz-tk-agac' + (enCok > 4 ? ' sik' : '') + '">' + yzTkAgacHTML(v) + '</div>'; }
    return bas + '<div class="yz-tk-govde' + (v.mod === 'agac' && v.taraflar.length === 2 ? ' iki' : '') + '">' + govde + '</div>';
}
function yzTkUyeHTML(u, son, okSay) {
    let top = u.seriler.reduce(function (a, b) { return a + b; }, 0);
    let seri = u.seriler.slice(-6).map(function (p, i, d) { return i === d.length - 1 ? '<b>' + p + '</b>' : String(p); }).join(' · ');
    return '<button class="yz-tk-uye' + (son && son.k === u.k ? ' yeni' : '') + '" onclick="yzTkGirisAc(\'' + yzEnc(u.k) + '\',' + okSay + ')" title="Skor gir"><span class="ad">' + esc(yzKisaAd(u.ad)) + '</span><span class="sr">' + (seri || '—') + '</span><span class="top">' + top + '</span></button>';
}
function yzTkCanliHTML(v, k, son) {
    let d = v.deg, setMod = !k || k.hedefTip === 'set', a = v.taraflar[0], b = v.taraflar[1];
    let toplam = function (x) { return x.turlar.reduce(function (p, q) { return p + q; }, 0); };
    let buyuk = setMod && d ? d.setSonuc.setPuanlari : [toplam(a), toplam(b)];
    let kaz = d && d.durum === 'bitti' ? d.kazananIdx : null, okSay = yzTkOkSayisi(k, d);
    let taraf = function (x, i) {
        return '<div class="yz-tk-taraf' + (kaz === i ? ' kaz' : kaz != null ? ' kay' : '') + '" style="--tr:' + x.t.renk + '">'
            + '<div class="yz-tk-kim"><span class="ik">' + kmYarismaIkonSvg(_kmTakimIkonAl(x.t, x.idx), 20) + '</span><span class="ad">' + esc(x.t.ad) + '</span></div>'
            + '<div class="yz-tk-puan">' + buyuk[i] + '</div>'
            + '<div class="yz-tk-uyeler">' + x.uyeler.map(function (u) { return yzTkUyeHTML(u, son, okSay); }).join('') + '</div></div>';
    };
    let maxTur = Math.max(a.turlar.length, b.turlar.length), sutun = Math.max(maxTur, setMod && k ? Math.min(k.maxSet, 5) : 0, 1), setler = '';
    for (let i = 0; i < sutun; i++) {
        let pa = a.turlar[i], pb = b.turlar[i], ek = k && setMod && i >= k.maxSet;
        let c = pa != null && pb != null ? (pa > pb ? 'a' : pb > pa ? 'b' : 'e') : '';
        setler += '<div class="yz-tk-set ' + c + '"><small>' + (ek ? 'EK ATIŞ' : (i + 1) + (setMod ? '. SET' : '. TUR')) + '</small><span style="--tr:' + a.t.renk + '">' + (pa != null ? pa : '·') + '</span><span style="--tr:' + b.t.renk + '">' + (pb != null ? pb : '·') + '</span></div>';
    }
    let durum = kaz != null ? '<b style="color:' + v.taraflar[kaz].t.renk + '">🏆 ' + esc(v.taraflar[kaz].t.ad) + ' KAZANDI</b>'
        : d && d.durum === 'shootoff' ? '<b class="yz-tk-ek">🎯 EK ATIŞ — tek ok, yüksek puan kazanır</b>'
        : yzTkSonAtanHTML(son);
    return '<div class="yz-tk-canli">' + taraf(a, 0) + '<div class="yz-tk-vs">' + (setMod ? 'SET<br>PUANI' : 'TOPLAM') + '</div>' + taraf(b, 1) + '</div>'
        + '<div class="yz-tk-setler">' + setler + '</div><div class="yz-tk-durum">' + durum + '</div>';
}
function yzTkCokluHTML(v, son) {
    let sp = v.setSonuc ? v.setSonuc.setPuanlari : [];
    let okSay = yzTkOkSayisi(kmYarismaMacKuralSecimi(v.taraflar), null);
    return '<div class="yz-tk-coklu">' + v.taraflar.map(function (x, i) {
        let top = x.turlar.reduce(function (p, q) { return p + q; }, 0);
        return '<div class="yz-tk-taraf" style="--tr:' + x.t.renk + '"><div class="yz-tk-kim"><span class="ik">' + kmYarismaIkonSvg(_kmTakimIkonAl(x.t, x.idx), 20) + '</span><span class="ad">' + esc(x.t.ad) + '</span></div>'
            + '<div class="yz-tk-puan">' + top + '<small>' + (sp[i] || 0) + ' set puanı</small></div><div class="yz-tk-uyeler">' + x.uyeler.map(function (u) { return yzTkUyeHTML(u, son, okSay); }).join('') + '</div></div>';
    }).join('') + '</div><div class="yz-tk-durum">' + yzTkSonAtanHTML(son) + '</div>';
}
function yzTkAgacHTML(v) {
    let turSay = Math.max(_kmYarismaBracketToplamTur || 1, v.maclar.length ? Math.max.apply(null, v.maclar.map(function (m) { return m.tur; })) : 1), kol = '';
    let ad = function (idx) { let t = _kmTakimlar[idx]; return t ? '<span class="ik">' + kmYarismaIkonSvg(_kmTakimIkonAl(t, idx), 20) + '</span>' + esc(t.ad) : '<span class="yz-alt">—</span>'; };
    for (let tur = 1; tur <= turSay; tur++) {
        let ms = v.maclar.filter(function (m) { return m.tur === tur; });
        kol += '<div class="yz-tk-kol"><div class="yz-br-tur">' + esc(_kmYarismaTurAdi(tur, _kmYarismaBracketToplamTur)) + '</div>'
            + (ms.length ? ms.map(function (m) {
                let canli = v.mac && v.mac.id === m.id;
                let s = function (idx) { let t = _kmTakimlar[idx]; return '<div class="yz-tk-bs' + (m.durum === 'bitti' && m.kazananIdx === idx ? ' kaz' : m.durum === 'bitti' ? ' kay' : '') + '" style="--tr:' + (t ? t.renk : '#334155') + '">' + ad(idx) + '</div>'; };
                return '<div class="yz-tk-bm' + (canli ? ' canli' : '') + '">' + (canli ? '<span class="yz-tk-canli-et">CANLI</span>' : '') + s(m.aIdx) + (m.isBye ? '<div class="yz-tk-bs kay" style="--tr:#334155"><span class="yz-alt">bay geçti</span></div>' : s(m.bIdx)) + '</div>';
            }).join('') : new Array(Math.max(1, Math.ceil(v.maclar.filter(function (m) { return m.tur === 1; }).length / Math.pow(2, tur - 1)))).fill('<div class="yz-tk-bm"><div class="yz-tk-bs kay" style="--tr:#334155">—</div><div class="yz-tk-bs kay" style="--tr:#334155">—</div></div>').join(''))
            + '</div>';
    }
    return kol;
}
// ---- TV'den skor girişi: sporcuya dokun → okları gir → kaydet. Kayıt motorun kendi yolundan (kmYarismaSeriKaydet).
function yzTkGirisAc(kEnc, okSay) {
    _yzTk.giris = { k: decodeURIComponent(kEnc), okSay: [1, 3, 6].indexOf(okSay) >= 0 ? okSay : 3, oklar: [] };
    yzTkGirisCiz();
}
function yzTkGirisKapat() { _yzTk.giris = null; let g = document.getElementById('yz-tk-giris'); if (g) g.remove(); }
function yzTkGirisCiz() {
    let g = _yzTk.giris; if (!g) { yzTkGirisKapat(); return; }
    let el = document.getElementById('yz-tk-giris');
    if (!el) { el = document.createElement('div'); el.id = 'yz-tk-giris'; el.className = 'yz-tk-giris'; el.onclick = function (e) { if (e.target === el) yzTkGirisKapat(); }; document.body.appendChild(el); }
    let top = g.oklar.reduce(function (a, p) { return a + (YZ_DEGER[p] || 0); }, 0), tamam = g.oklar.length >= g.okSay;
    let kutu = ''; for (let i = 0; i < g.okSay; i++) { let p = g.oklar[i]; kutu += '<span class="yz-tk-ok ' + (p ? yzOkRenk(p) : '') + '">' + (p || '') + '</span>'; }
    el.innerHTML = '<div class="yz-tk-giris-ic" role="dialog" aria-label="Skor gir"><div class="yz-tk-giris-bas"><b>' + esc(yzKAd(g.k)) + '</b><span>' + g.oklar.length + '/' + g.okSay + ' ok · ' + top + '</span></div>'
        + '<div class="yz-tk-oksec">' + [1, 3, 6].map(function (n) { return '<button class="yz-tv-k' + (g.okSay === n ? ' ana' : '') + '" onclick="yzTkOkSayiSec(' + n + ')">' + n + ' ok' + (n === 1 ? ' (ek atış)' : '') + '</button>'; }).join('') + '</div>'
        + '<div class="yz-tk-oklar">' + kutu + '</div>'
        + '<div class="yz-tk-pad">' + YZ_DEGERLER.map(function (p) { return '<button class="' + yzOkRenk(p) + '" onclick="yzTkOk(\'' + p + '\')"' + (tamam ? ' disabled' : '') + '>' + p + '</button>'; }).join('') + '</div>'
        + '<div class="yz-tk-giris-alt"><button class="yz-tv-k" onclick="yzTkGirisKapat()">Vazgeç</button><button class="yz-tv-k" onclick="yzTkOkSil()"' + (g.oklar.length ? '' : ' disabled') + '>⌫ Sil</button><button class="yz-tv-k yesil" onclick="yzTkGirisKaydet()"' + (tamam ? '' : ' disabled') + '>✓ Kaydet · ' + top + '</button></div></div>';
}
function yzTkOkSayiSec(n) { let g = _yzTk.giris; if (!g) return; g.okSay = n; g.oklar = g.oklar.slice(0, n); yzTkGirisCiz(); }
function yzTkOk(p) { let g = _yzTk.giris; if (!g || g.oklar.length >= g.okSay) return; g.oklar.push(p); yzTkGirisCiz(); }
function yzTkOkSil() { let g = _yzTk.giris; if (!g) return; g.oklar.pop(); yzTkGirisCiz(); }
function yzTkGirisKaydet() {
    let g = _yzTk.giris; if (!g || g.oklar.length < g.okSay) return;
    _kmYarismaAktifSporcuKey = g.k; _kmYarismaOkSayisi = g.okSay; _kmYarismaSeriGirisleri = g.oklar.slice();
    yzTkGirisKapat();
    kmYarismaSeriKaydet();
    _yzTk.imza = ''; setTimeout(yzTkCiz, 50);
}
function yzTkCssYukle() {
    if (document.getElementById('yz-tk-css')) return;
    let st = document.createElement('style'); st.id = 'yz-tk-css';
    st.textContent = [
        '.yz-tk-govde{flex:1;min-height:0;display:flex;flex-direction:column;gap:1.6vh}',
        '.yz-tk-canli{display:grid;grid-template-columns:1fr auto 1fr;gap:1.6vw;align-items:stretch}',
        '.yz-tk-taraf{background:#0d1a2e;border:2px solid var(--tr);border-radius:1.4vw;padding:1.6vh 1.6vw;display:flex;flex-direction:column;gap:1vh;min-width:0}',
        '.yz-tk-taraf.kaz{background:color-mix(in srgb,var(--tr) 22%,#0d1a2e)}.yz-tk-taraf.kay{opacity:.55}',
        '.yz-tk-kim{display:flex;align-items:center;gap:.8vw;font-size:2.4vw;font-weight:900;min-width:0}.yz-tk-kim .ad{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--tr)}',
        '.yz-tk-puan{font-size:8vw;font-weight:900;line-height:.95;color:#fff;display:flex;align-items:baseline;gap:1vw}.yz-tk-puan small{font-size:1.4vw;color:#8aa2c0;font-weight:800}',
        '.yz-tk-uyeler{display:flex;flex-direction:column;gap:.6vh}',
        '.yz-tk-uye{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:1vw;align-items:center;background:#08121f;border:1px solid #1d3354;border-radius:.8vw;padding:.8vh 1vw;color:#e8eef7;font:inherit;font-size:max(13px,1.5vw);font-weight:800;text-align:left;cursor:pointer}',
        '.yz-tk-uye:hover,.yz-tk-uye:focus-visible{border-color:#fbbf24;outline:none}.yz-tk-uye .ad{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.yz-tk-uye .sr{color:#8aa2c0;font-size:max(12px,1.25vw)}.yz-tk-uye .sr b{color:#fff}.yz-tk-uye .top{color:#fbbf24;min-width:3vw;text-align:right}',
        '.yz-tk-uye.yeni{border-color:#22c55e;background:rgba(34,197,94,.16);animation:yzTkYeni 1.2s ease-out}',
        '@keyframes yzTkYeni{0%{transform:scale(1.04)}100%{transform:none}}',
        '.yz-tk-vs{align-self:center;text-align:center;font-size:1.1vw;font-weight:900;letter-spacing:.2em;color:#7d93b2}',
        '.yz-tk-setler{display:flex;gap:.8vw;justify-content:center;flex-wrap:wrap}',
        '.yz-tk-set{display:flex;flex-direction:column;align-items:center;gap:.2vh;min-width:6vw;background:#08121f;border:1px solid #16263e;border-radius:.8vw;padding:.6vh .6vw;font-size:2vw;font-weight:900;color:#8aa2c0}',
        '.yz-tk-set small{font-size:max(10px,.85vw);letter-spacing:.12em;color:#7d93b2}.yz-tk-set.a span:nth-of-type(1),.yz-tk-set.b span:nth-of-type(2){color:var(--tr)}.yz-tk-set.e span{color:#e8eef7}',
        '.yz-tk-durum{text-align:center;font-size:2vw;font-weight:800;min-height:3vh}.yz-tk-ek{color:#f97316}',
        '.yz-tk-coklu{display:grid;grid-template-columns:repeat(auto-fit,minmax(20vw,1fr));gap:1.4vw}.yz-tk-coklu .yz-tk-puan{font-size:6vw}',
        '.yz-tk-sampiyon{display:flex;align-items:center;justify-content:center;gap:1.4vw;padding:1.6vh 2vw;border-radius:1.4vw;border:2px solid var(--tr);background:linear-gradient(90deg,color-mix(in srgb,var(--tr) 30%,#0d1a2e),#0d1a2e)}',
        '.yz-tk-sampiyon>span{font-size:5vw}.yz-tk-sampiyon small{display:block;font-size:1.2vw;letter-spacing:.3em;color:#fbbf24;font-weight:900}.yz-tk-sampiyon b{font-size:3.6vw;color:#fff}',
        '.yz-tk-agac{flex:1;min-height:0;display:flex;gap:1.2vw;background:#08121f;border:1px solid #16263e;border-radius:1.2vw;padding:1.4vh 1vw;overflow:hidden}',
        '.yz-tk-govde.iki .yz-tk-agac{flex:1 1 0}.yz-tk-govde.iki .yz-tk-puan{font-size:6.4vw}.yz-tk-govde.iki .yz-tk-bs{font-size:max(11px,1vw);padding:.35vh .7vw}.yz-tk-govde.iki .yz-tk-kol{gap:.5vh}',
        '.yz-tk-agac.sik .yz-tk-bs{font-size:max(10px,.8vw);padding:.2vh .6vw}.yz-tk-agac.sik .yz-tk-kol{gap:.3vh}',
        '.yz-tk .ik{display:inline-flex;align-items:center;flex-shrink:0}.yz-tk .ik svg{width:1em;height:1em}',
        '.yz-tk-kol{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:space-around;gap:1vh}.yz-tk-kol .yz-br-tur{text-align:center;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#7d93b2;font-size:.9vw}',
        '.yz-tk-bm{flex-shrink:0;position:relative;background:#0b1829;border:1px solid #1d3354;border-radius:.8vw;overflow:hidden}.yz-tk-bm.canli{border-color:#22c55e;box-shadow:0 0 0 .25vw rgba(34,197,94,.25)}',
        '.yz-tk-bs{display:flex;align-items:center;gap:.6vw;padding:.6vh .8vw;font-size:max(12px,1.2vw);font-weight:800;border-left:.35vw solid var(--tr);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.yz-tk-bs+.yz-tk-bs{border-top:1px solid #1d3354}',
        '.yz-tk-bs.kaz{color:#22c55e}.yz-tk-bs.kay{color:#64748b}',
        '.yz-tk-canli-et{position:absolute;top:.3vh;right:.4vw;font-size:max(9px,.75vw);font-weight:900;letter-spacing:.15em;color:#22c55e}',
        '.yz-tk-giris{position:fixed;inset:0;z-index:32000;background:rgba(2,6,14,.72);display:flex;align-items:center;justify-content:center;padding:16px}',
        '.yz-tk-giris-ic{background:#0d1a2e;border:1px solid #29425f;border-radius:18px;padding:18px;width:min(560px,100%);display:flex;flex-direction:column;gap:14px;color:#e8eef7}',
        '.yz-tk-giris-bas{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:20px}.yz-tk-giris-bas span{color:#fbbf24;font-weight:800;font-size:15px}',
        '.yz-tk-oksec{display:flex;gap:6px;justify-content:center}.yz-tk-oksec .yz-tv-k{font-size:13px;padding:6px 12px}',
        '.yz-tk-oklar{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}.yz-tk-ok{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px}.yz-tk-ok:not([class*="yz-r-"]){background:#08121f;border:2px dashed #29425f}',
        '.yz-tk-pad{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.yz-tk-pad button{border:0;border-radius:12px;min-height:56px;font:inherit;font-size:20px;font-weight:900;cursor:pointer}.yz-tk-pad button:disabled{opacity:.35;cursor:default}',
        '.yz-tk-giris-alt{display:flex;gap:8px;justify-content:flex-end}.yz-tk-giris-alt .yz-tv-k{font-size:15px;padding:10px 16px}.yz-tk-giris-alt .yz-tv-k:disabled{opacity:.4;cursor:default}',
        '@media (prefers-reduced-motion:reduce){.yz-tk-uye.yeni{animation:none}}'
    ].join('\n');
    document.head.appendChild(st);
}

// ================================================================================================
// EK (2026-10-05, kullanıcı: "9-12 yaş için yapalım, gerçek yarışma gibi olsun" → küçük yaş standardı + madalya töreni)
// 1) Kategori: "9-12 yaş" seçilince 20m · 122 cm 10 halka kağıt · 12 set × 3 ok · 120 sn hazır gelir (sonra yine
//    değiştirilebilir); yaşı 9-12 olanlar tek dokunuşla seçilir (yarışma yaşı = bu yıl − doğum yılı). Etiket TV/PDF/başlıkta.
// 2) 🏅 Madalya töreni: tur bitince tablet ya da TV başlatır → ortak durumda o.toren = {id, basla}. TV'yi gösteren her
//    cihaz töreni AYNI zaman çizelgesiyle oynatır (geçen süreden hesaplanır, geç açılan ekran da doğru adımdan girer):
//    giriş → 🥉 → 🥈 → 🥇 (her birinden önce davul, 🥇'de fanfar + konfeti) → yay grubu varsa sıradaki grup →
//    "Tebrikler" ve tüm katılımcılar. Kaplama #yz-tv'nin DIŞINDA ayrı öğe: TV tablosunun yeniden çizimleri animasyonu bozmaz.
// ================================================================================================
const YZ_KATEGORI = {
    serbest: { ad: 'Serbest', etiket: '' },
    k912: { ad: '9-12 yaş', etiket: '9-12 YAŞ', mesafe: '20m', yuz: '10', format: 's12o3', sure: 120, yasMin: 9, yasMax: 12, aciklama: '20m · 122 cm kağıt (10 halka) · 12 set × 3 ok · 120 sn' }
};
function yzKatEtiket(d, ayrac) { let k = YZ_KATEGORI[(d && d.ayar && d.ayar.kategori) || 'serbest']; return k && k.etiket ? k.etiket + (ayrac || ' · ') : ''; }
function yzSporcuYas(k) {
    let i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)] && turnuvaDB[k.slice(0, i)][k.slice(i + 1)]; if (!sp) return null;
    let yil = sp.dogumTarihi ? parseInt(String(sp.dogumTarihi).slice(0, 4), 10) : parseInt(sp.dogumYili, 10);
    return yil > 1900 ? new Date().getFullYear() - yil : null;
}
function yzKategoriKartHTML(t, roster) {
    let kat = t.kategori || 'serbest', K = YZ_KATEGORI[kat];
    let cip = function (k) { return '<button class="yz-cip' + (kat === k ? ' aktif' : '') + '" onclick="yzKurKategori(\'' + k + '\')">' + YZ_KATEGORI[k].ad + '</button>'; };
    let yasli = '';
    if (K.yasMin) {
        let uygun = 0, bilinmeyen = 0;
        roster.forEach(function (r) { let y = yzSporcuYas(r.g + '|' + r.ad); if (y == null) bilinmeyen++; else if (y >= K.yasMin && y <= K.yasMax) uygun++; });
        yasli = '<div class="yz-cipler" style="margin-top:8px"><button class="yz-btn" onclick="yzKurYasSec()">👦 ' + K.yasMin + '-' + K.yasMax + ' yaşındakileri seç (' + uygun + ')</button></div>'
            + (bilinmeyen ? '<div class="yz-alt">' + bilinmeyen + ' sporcunun doğum yılı yok — onları elle seç.</div>' : '');
    }
    return '<div class="yz-kart"><div class="yz-etiket">Kategori</div><div class="yz-cipler">' + Object.keys(YZ_KATEGORI).map(cip).join('') + '</div>'
        + (K.aciklama ? '<div class="yz-alt" style="margin-top:6px">Küçük yaş standardı: <b>' + K.aciklama + '</b> — aşağıdan yine değiştirebilirsin.</div>' : '') + yasli + '</div>';
}
function yzKurKategori(k) {
    let t = yzKurulumTaslak(), K = YZ_KATEGORI[k]; if (!K) return;
    t.kategori = k;
    if (K.mesafe) { t.mesafe = K.mesafe; t.yuz = K.yuz; t.format = K.format; t.sure = K.sure; }
    yzCiz();
}
function yzKurYasSec() {
    let t = yzKurulumTaslak(), K = YZ_KATEGORI[t.kategori || 'serbest']; if (!K.yasMin) return;
    t.katilimci = yzRoster().map(function (r) { return r.g + '|' + r.ad; }).filter(function (k) { let y = yzSporcuYas(k); return y != null && y >= K.yasMin && y <= K.yasMax; });
    showToast(t.katilimci.length + ' sporcu seçildi', t.katilimci.length ? 'success' : 'warning'); yzCiz();
}

// ---------------------------------------------------------------- 🏅 madalya töreni
const YZ_TOR = { giris: 3, grup: 17, r3: 1.6, r2: 6.2, r1: 11, davul: 1.5 };
function yzTorenBaslat(tvden) {
    let o = yzOku(), d = o.durum; if (!d || d.asama !== 'bitti') return showToast('Tören tur bitince başlar.', 'warning');
    if (!yzTorenSahneler(o).length) return showToast('Podyum için puan girilmiş sporcu yok.', 'warning');
    yzSesHazirla();
    let baslat = function () { yzGuncelle(function (x) { x.toren = { id: d.id, basla: Date.now() + 800 }; }); if (_yz.tv) yzTvCiz(); };
    if (tvden || _yz.tv) return baslat();
    // Tören hemen başlar (TV başka cihazdaysa orada açılır); bu cihazda göstermek isteğe bağlı — geç açılan ekran aynı adımdan katılır.
    baslat();
    onayIste('🏅 Madalya töreni TV ekranında başladı.<br><small>TV başka bir cihazdaysa orada kendiliğinden açıldı. Bu cihazda da göstereyim mi?</small>',
        function () { yzTvAc(); }, 'Bu cihazda da göster', 'Sadece TV\'de');
}
function yzTorenSahneler(o) {
    let d = o.durum, p = yzPodyumListe(o), sahne = [];
    let kisi = function (r) { return { k: r.k, ad: r.ad, sira: r.sira, puan: p.eleme ? '' : r.toplam, alt: r.altMetin || (r.on + ' × 10+X') }; };
    if (p.eleme) { if (p.liste.length) sahne.push({ ad: '', liste: p.liste.map(kisi) }); }
    else yzGruplar(o, yzSiralama(o)).forEach(function (gr) {
        let ilk3 = gr.liste.filter(function (r) { return r.toplam > 0; }).slice(0, 3).map(function (r) { return kisi(Object.assign({}, r, { altMetin: r.on + ' × 10+X · ' + (r.ok ? (r.toplam / r.ok).toFixed(2) : '0') + ' ort.' })); });
        if (ilk3.length) sahne.push({ ad: gr.ad || '', liste: ilk3 });
    });
    return sahne;
}
function yzTorenKontrol(o) {
    let d = o.durum, t = o.toren;
    if (!_yz.tv || !d || d.asama !== 'bitti' || !t || t.id !== d.id) return yzTorenKapatYerel();
    if (_yz.toren && _yz.toren.basla === t.basla) return;
    yzTorenKapatYerel();
    _yz.toren = { basla: t.basla, sahne: yzTorenSahneler(o), adim: '', d: d, katilimci: yzSiralama(o).map(function (r) { return r.k; }).concat(d.katilimci).filter(function (k, i, a) { return a.indexOf(k) === i; }) };
    let el = document.createElement('div'); el.id = 'yz-toren'; el.className = 'yz-toren';
    el.innerHTML = '<div class="yz-tor-isik a"></div><div class="yz-tor-isik b"></div><div class="yz-tor-konfeti"></div>'
        + '<div class="yz-tor-bas"><div class="yz-tor-ust">DAĞ S.K. · ' + esc(yzKatEtiket(d) + d.ayar.mesafe + ' · ' + new Date(d.basla).toLocaleDateString('tr-TR')) + '</div><div class="yz-tor-baslik">MADALYA TÖRENİ</div><div class="yz-tor-grup"></div></div>'
        + '<div class="yz-tor-kursu"></div><div class="yz-tor-final"></div>'
        + '<div class="yz-tor-btn"><button onclick="yzTorenIleri()">⏭ İleri</button><button onclick="yzTorenBitir()">✕ Töreni kapat</button></div>';
    document.body.appendChild(el);
    yzTorenCss();
    _yz.torenZ = setInterval(yzTorenTik, 200); yzTorenTik();
}
// Özel tören (2026-10-07, Dönem Ligi kupa töreni): ortak tur durumuna YAZMAZ, bu cihazda oynar. Aynı zaman çizelgesi/
// görseller/sesler; başlık ve sahneler dışarıdan gelir. veri: {ust, baslik, sahne:[{ad, liste:[{k,ad,sira,puan,alt}]}], katilimci:[k]}
function yzOzelToren(v) {
    yzTorenKapatYerel(); yzSesHazirla();
    _yz.toren = { basla: Date.now() + 800, sahne: v.sahne, adim: '', ozel: true, katilimci: v.katilimci || [] };
    let el = document.createElement('div'); el.id = 'yz-toren'; el.className = 'yz-toren';
    el.innerHTML = '<div class="yz-tor-isik a"></div><div class="yz-tor-isik b"></div><div class="yz-tor-konfeti"></div>'
        + '<div class="yz-tor-bas"><div class="yz-tor-ust">' + esc(v.ust || '') + '</div><div class="yz-tor-baslik">' + esc(v.baslik || 'MADALYA TÖRENİ') + '</div><div class="yz-tor-grup"></div></div>'
        + '<div class="yz-tor-kursu"></div><div class="yz-tor-final"></div>'
        + '<div class="yz-tor-btn"><button onclick="yzTorenIleri()">⏭ İleri</button><button onclick="yzTorenBitir()">✕ Töreni kapat</button></div>';
    document.body.appendChild(el);
    yzTorenCss();
    try { if (document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(function () {}); } catch (e) {}
    _yz.torenZ = setInterval(yzTorenTik, 200); yzTorenTik();
}
function yzTorenKapatYerel() { clearInterval(_yz.torenZ); _yz.torenZ = null; _yz.toren = null; let e = document.getElementById('yz-toren'); if (e) e.remove(); }
function yzTorenBitir() { if (_yz.toren && _yz.toren.ozel) { yzTorenKapatYerel(); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} return; } yzGuncelle(function (x) { x.toren = null; }); yzTorenKapatYerel(); }
// İleri: başlangıcı sonraki olaya kaydır (ortak durumda — tüm ekranlar birlikte atlar)
function yzTorenIleri() {
    let T = _yz.toren; if (!T) return;
    let gecen = (Date.now() - T.basla) / 1000, olay = [];
    T.sahne.forEach(function (sh, gi) { let g0 = YZ_TOR.giris + gi * YZ_TOR.grup; [YZ_TOR.r3, YZ_TOR.r2, YZ_TOR.r1].forEach(function (r) { olay.push(g0 + r); }); });
    olay.push(YZ_TOR.giris + T.sahne.length * YZ_TOR.grup);
    let sonraki = olay.filter(function (x) { return x > gecen + 0.3; })[0]; if (sonraki == null) return;
    let yeni = T.basla - (sonraki - gecen) * 1000 + 300;
    if (T.ozel) { T.basla = yeni; T.adim = '__'; let el = document.getElementById('yz-toren'); if (el) { let k = el.querySelector('.yz-tor-kursu'); if (k) k.dataset.gi = ''; } yzTorenTik(); return; }
    yzGuncelle(function (x) { if (x.toren) x.toren.basla = yeni; });
    yzTorenKapatYerel(); yzTorenKontrol(yzOku());
}
function yzTorenTik() {
    let T = _yz.toren, el = document.getElementById('yz-toren'); if (!T || !el) return;
    let gecen = (Date.now() - T.basla) / 1000, G = T.sahne.length, finalT = YZ_TOR.giris + G * YZ_TOR.grup;
    let gi = gecen < YZ_TOR.giris ? -1 : Math.min(G - 1, Math.floor((gecen - YZ_TOR.giris) / YZ_TOR.grup));
    let ic = gi < 0 ? 0 : gecen - YZ_TOR.giris - gi * YZ_TOR.grup;
    let acik = gi < 0 ? 0 : ic >= YZ_TOR.r1 ? 3 : ic >= YZ_TOR.r2 ? 2 : ic >= YZ_TOR.r3 ? 1 : 0;
    let son = gecen >= finalT;
    let adim = son ? 'final' : gi + ':' + acik;
    // davul: bir sonraki açılıştan hemen önce (yalnız canlı izlenen anda; geç açılan ekran eski sesleri çalmaz)
    if (!son && gi >= 0) { let sr = [YZ_TOR.r3, YZ_TOR.r2, YZ_TOR.r1][acik], kimVar = sr != null && T.sahne[gi].liste.length >= 3 - acik; if (kimVar && ic >= sr - YZ_TOR.davul && ic < sr - YZ_TOR.davul + 0.4 && T.davul !== gi + ':' + acik) { T.davul = gi + ':' + acik; yzTorDavul(YZ_TOR.davul); } }
    if (adim === T.adim) return;
    let canli = T.adim !== '' ; T.adim = adim;
    if (son) return yzTorenFinal(el, T, canli);
    let sh = T.sahne[Math.max(0, gi)];
    el.querySelector('.yz-tor-grup').textContent = gi < 0 ? '' : (sh.ad ? (sh.ad === 'Makaralı' ? '⚙️ ' : '🏹 ') + sh.ad : '');
    let kursu = el.querySelector('.yz-tor-kursu');
    if (gi < 0) { kursu.innerHTML = '<div class="yz-tor-giris">🏅</div>'; return; }
    if (kursu.dataset.gi !== String(gi)) {
        kursu.dataset.gi = String(gi);
        let yer = { 1: null, 2: null, 3: null }; sh.liste.forEach(function (r, i) { yer[i + 1] = r; });
        kursu.innerHTML = [2, 1, 3].map(function (n) {
            let r = yer[n]; if (!r) return '<div class="yz-tor-k bos"></div>';
            let md = r.sira === 1 ? '🥇' : r.sira === 2 ? '🥈' : '🥉';
            return '<div class="yz-tor-k p' + n + '" data-n="' + n + '"><div class="yz-tor-kisi"><div class="yz-tor-madalya">' + md + '</div><div class="yz-tor-ad">' + esc(r.ad) + '</div>' + (r.puan !== '' ? '<div class="yz-tor-puan">' + r.puan + '<small> puan</small></div>' : '') + '<div class="yz-tor-alt">' + esc(r.alt) + '</div></div><div class="yz-tor-blok"><span>' + r.sira + '</span></div></div>';
        }).join('');
    }
    // açılış sırası: 3. → 2. → 1. (liste sırasına göre; 2 kişilik podyumda 2. ile başlar)
    let sirala = [3, 2, 1].filter(function (n) { return kursu.querySelector('.yz-tor-k.p' + n); });
    let acilacak = sirala.slice(0, Math.max(0, acik - (3 - sirala.length)));
    kursu.querySelectorAll('.yz-tor-k').forEach(function (k) { let n = +k.dataset.n; let a = acilacak.indexOf(n) !== -1; if (a && !k.classList.contains('acik')) { k.classList.add('acik'); if (canli) { if (n === 1) { yzTorFanfar(); yzTorAlkis(4.5); yzTorKonfeti(el); } else yzTorAlkis(2.2); } } });
    // atlandıysa (geç açılan ekran) yukarıdaki sesler çalmaz; bloklar geçişsiz yerinde
}
function yzTorenFinal(el, T, canli) {
    el.querySelector('.yz-tor-grup').textContent = '';
    el.querySelector('.yz-tor-kursu').innerHTML = '';
    let podyum = {}; T.sahne.forEach(function (sh) { sh.liste.forEach(function (r) { podyum[r.k] = r.sira; }); });
    el.querySelector('.yz-tor-final').innerHTML = '<div class="yz-tor-tebrik">TEBRİKLER!</div><div class="yz-tor-hepsi">' + T.katilimci.map(function (k) {
        let md = podyum[k] === 1 ? '🥇' : podyum[k] === 2 ? '🥈' : podyum[k] === 3 ? '🥉' : '🎖';
        return '<span class="yz-tor-cip' + (podyum[k] ? ' pod' : '') + '">' + md + ' ' + esc(yzKisaAd(yzKAd(k))) + '</span>';
    }).join('') + '</div><div class="yz-tor-not">Bugün yarışan herkes kazandı — sıradaki turda görüşmek üzere! 🏹</div>';
    el.classList.add('final');
    if (canli) { yzTorAlkis(5); yzTorKonfeti(el); }
}
// ---- sesler (Web Audio, dosya yok; düdük sesleri kapalıysa çalmaz)
function yzTorAC() { if (!_yz.ses) return null; yzSesHazirla(); return _yz.ac || null; }
function yzTorGurultu(ac, sure) { let n = Math.floor(ac.sampleRate * sure), b = ac.createBuffer(1, n, ac.sampleRate), v = b.getChannelData(0); for (let i = 0; i < n; i++) v[i] = Math.random() * 2 - 1; let s = ac.createBufferSource(); s.buffer = b; return s; }
function yzTorDavul(sure) {
    let ac = yzTorAC(); if (!ac) return;
    try {
        let t0 = ac.currentTime, kaz = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.connect(kaz); kaz.connect(ac.destination);
        for (let t = 0; t < sure; t += 0.055) { let g = ac.createGain(), src = yzTorGurultu(ac, 0.05), a = 0.12 + 0.35 * (t / sure); g.gain.setValueAtTime(a, t0 + t); g.gain.exponentialRampToValueAtTime(0.001, t0 + t + 0.05); src.connect(g); g.connect(f); src.start(t0 + t); }
        kaz.gain.value = 0.9;
    } catch (e) {}
}
function yzTorFanfar() {
    let ac = yzTorAC(); if (!ac) return;
    try {
        let t0 = ac.currentTime;
        [[523, 0, .18], [659, .18, .18], [784, .36, .18], [1047, .54, .7]].forEach(function (n) {
            [1, 2].forEach(function (h) { let o = ac.createOscillator(), g = ac.createGain(); o.type = h === 1 ? 'sawtooth' : 'square'; o.frequency.value = n[0] * h; g.gain.setValueAtTime(0, t0 + n[1]); g.gain.linearRampToValueAtTime(h === 1 ? 0.09 : 0.025, t0 + n[1] + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t0 + n[1] + n[2]); o.connect(g); g.connect(ac.destination); o.start(t0 + n[1]); o.stop(t0 + n[1] + n[2] + 0.05); });
        });
    } catch (e) {}
}
function yzTorAlkis(sure) {
    let ac = yzTorAC(); if (!ac) return;
    try {
        let t0 = ac.currentTime + 0.1, f = ac.createBiquadFilter(), ana = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 2200; f.Q.value = 0.7; f.connect(ana); ana.connect(ac.destination);
        ana.gain.setValueAtTime(0.001, t0); ana.gain.linearRampToValueAtTime(1, t0 + 0.4); ana.gain.setValueAtTime(1, t0 + sure - 1); ana.gain.linearRampToValueAtTime(0.001, t0 + sure);
        for (let t = 0; t < sure; t += 0.018) { let g = ac.createGain(), src = yzTorGurultu(ac, 0.03), a = 0.05 + Math.random() * 0.12; g.gain.setValueAtTime(a, t0 + t); g.gain.exponentialRampToValueAtTime(0.001, t0 + t + 0.03); src.connect(g); g.connect(f); src.start(t0 + t); }
    } catch (e) {}
}
function yzTorKonfeti(el) {
    try { if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    let k = el.querySelector('.yz-tor-konfeti'); if (!k) return;
    let renk = ['#facc15', '#f97316', '#22c55e', '#38bdf8', '#e879f9', '#f8fafc'], h = '';
    for (let i = 0; i < 90; i++) h += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + renk[i % renk.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.6 + Math.random() * 2.2).toFixed(2) + 's;transform:rotate(' + Math.floor(Math.random() * 360) + 'deg)"></i>';
    k.innerHTML = h; clearTimeout(_yz.konfetiZ); _yz.konfetiZ = setTimeout(function () { k.innerHTML = ''; }, 6000);
}
function yzTorenCss() {
    if (document.getElementById('yz-toren-css')) return;
    let st = document.createElement('style'); st.id = 'yz-toren-css';
    st.textContent = [
        '.yz-toren{position:fixed;inset:0;z-index:2147483000;background:radial-gradient(ellipse at 50% 120%,#1e3a8a 0%,#0b1226 45%,#04070f 100%);color:#f8fafc;display:flex;flex-direction:column;align-items:center;overflow:hidden;font-family:inherit}',
        '.yz-tor-isik{position:absolute;top:-20vh;width:40vw;height:130vh;background:linear-gradient(180deg,rgba(255,240,200,.16),rgba(255,240,200,0) 75%);filter:blur(10px);transform-origin:top center;pointer-events:none}',
        '.yz-tor-isik.a{left:8vw;animation:yzTorIsik 7s ease-in-out infinite alternate}.yz-tor-isik.b{right:8vw;animation:yzTorIsik 8s ease-in-out infinite alternate-reverse}',
        '@keyframes yzTorIsik{from{transform:rotate(18deg)}to{transform:rotate(-18deg)}}',
        '.yz-tor-bas{position:relative;text-align:center;margin-top:4vh}.yz-tor-ust{font-size:1.5vw;letter-spacing:.35em;color:#fbbf24;font-weight:800}',
        '.yz-tor-baslik{font-size:5.4vw;font-weight:900;letter-spacing:.06em;line-height:1.05;text-shadow:0 0 30px rgba(251,191,36,.35)}.yz-tor-grup{font-size:2.2vw;font-weight:800;color:#cbd5e1;min-height:3vw}',
        '.yz-tor-kursu{position:relative;flex:1;width:min(92vw,1500px);display:grid;grid-template-columns:repeat(3,1fr);gap:2vw;align-items:end;padding-bottom:0}',
        '.yz-tor-giris{grid-column:1/-1;align-self:center;text-align:center;font-size:14vw;animation:yzTorNabiz 1.4s ease-in-out infinite}@keyframes yzTorNabiz{50%{transform:scale(1.08)}}',
        '.yz-tor-k{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%}',
        '.yz-tor-kisi{text-align:center;opacity:0;transform:translateY(-8vh) scale(.7);transition:opacity .7s ease,transform .9s cubic-bezier(.2,1.6,.4,1)}',
        '.yz-tor-k.acik .yz-tor-kisi{opacity:1;transform:none}',
        '.yz-tor-madalya{font-size:7vw;line-height:1;filter:drop-shadow(0 0 1.4vw rgba(251,191,36,.55))}.yz-tor-k.p1 .yz-tor-madalya{font-size:9.5vw}',
        '.yz-tor-ad{font-size:2.6vw;font-weight:900;margin-top:1vh;line-height:1.1}.yz-tor-k.p1 .yz-tor-ad{font-size:3.4vw;color:#fde68a}',
        '.yz-tor-puan{font-size:2.2vw;font-weight:900;color:#e2e8f0;font-variant-numeric:tabular-nums}.yz-tor-puan small{font-size:1vw;color:#94a3b8;font-weight:700}.yz-tor-alt{font-size:1.1vw;color:#94a3b8;margin:.4vh 0 1.2vh}',
        '.yz-tor-blok{width:100%;border-radius:1vw 1vw 0 0;display:flex;align-items:flex-start;justify-content:center;font-size:4vw;font-weight:900;color:rgba(255,255,255,.85);padding-top:1.5vh;transform:scaleY(0);transform-origin:bottom;transition:transform .8s cubic-bezier(.2,1.2,.4,1);box-shadow:inset 0 2px 0 rgba(255,255,255,.35)}',
        '.yz-tor-k.acik .yz-tor-blok{transform:scaleY(1)}',
        '.yz-tor-k.p1 .yz-tor-blok{height:30vh;background:linear-gradient(#facc15,#a16207)}.yz-tor-k.p2 .yz-tor-blok{height:21vh;background:linear-gradient(#e2e8f0,#64748b)}.yz-tor-k.p3 .yz-tor-blok{height:14vh;background:linear-gradient(#fb923c,#9a3412)}',
        '.yz-tor-final{position:relative;display:none;flex-direction:column;align-items:center;gap:3vh;flex:1;justify-content:center;width:min(92vw,1500px)}.yz-toren.final .yz-tor-final{display:flex}.yz-toren.final .yz-tor-kursu{display:none}',
        '.yz-tor-tebrik{font-size:8vw;font-weight:900;color:#fde68a;letter-spacing:.04em;animation:yzTorNabiz 1.6s ease-in-out infinite;text-shadow:0 0 40px rgba(251,191,36,.45)}',
        '.yz-tor-hepsi{display:flex;flex-wrap:wrap;gap:1vw;justify-content:center}.yz-tor-cip{font-size:1.7vw;font-weight:800;padding:.8vh 1.3vw;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18)}.yz-tor-cip.pod{background:rgba(251,191,36,.16);border-color:rgba(251,191,36,.6)}',
        '.yz-tor-not{font-size:1.5vw;color:#cbd5e1}',
        '.yz-tor-konfeti{position:absolute;inset:0;pointer-events:none;overflow:hidden}.yz-tor-konfeti i{position:absolute;top:-4vh;width:.8vw;height:1.6vw;border-radius:2px;animation:yzTorDus linear forwards}',
        '@keyframes yzTorDus{to{top:105vh;transform:rotate(720deg) translateX(6vw)}}',
        '.yz-tor-btn{position:absolute;right:1.2vw;bottom:1.2vw;display:flex;gap:.6vw;opacity:.35;transition:opacity .2s}.yz-tor-btn:hover,.yz-tor-btn:focus-within{opacity:1}',
        '.yz-tor-btn button{font:inherit;font-size:13px;font-weight:800;padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.3);background:rgba(15,23,42,.7);color:#f8fafc;cursor:pointer}',
        '.yz-btn.toren{background:linear-gradient(135deg,#facc15,#f97316);border-color:#f59e0b;color:#1a0d05;font-weight:900}',
        '@media (max-width:700px){.yz-tor-ad{font-size:4.6vw}.yz-tor-k.p1 .yz-tor-ad{font-size:5.4vw}.yz-tor-puan{font-size:4vw}.yz-tor-alt{font-size:2.6vw}.yz-tor-cip{font-size:3.4vw}.yz-tor-ust{font-size:2.8vw}.yz-tor-grup{font-size:4vw}.yz-tor-not{font-size:3.2vw}}',
        '@media (prefers-reduced-motion:reduce){.yz-tor-isik,.yz-tor-giris,.yz-tor-tebrik{animation:none}.yz-tor-kisi,.yz-tor-blok{transition:none}}'
    ].join('\n');
    document.head.appendChild(st);
}

// ================================================================================================
// 👥 Sporcu ekle / çıkar (2026-10-05, kullanıcı: "yarışmaya sonradan sporcu ekleyemiyorum, var olanı çıkaramıyorum").
// Eskiden ekleme yalnız "⋯" menüsünde ve yalnız o anki ders listesindeki sporcularla mümkündü, çıkarma hiç yoktu.
// Artık tur ekranında görünür bir düğme; TÜM gruplardaki sporcular içinde arama; çıkarılan sporcunun girilmiş
// serileri silinmez (geri eklenirse tablosu geri gelir) — yalnız sıralamadan ve TV'den kalkar.
// ================================================================================================
function yzSporcuVar(k) { let i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1); return !!(turnuvaDB[g] && turnuvaDB[g][ad]); }
function yzTumSporcular() {
    let l = [];
    ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach(function (g) { Object.keys(turnuvaDB[g] || {}).forEach(function (ad) { let sp = turnuvaDB[g][ad]; if (sp) l.push({ g: g, ad: ad, k: g + '|' + ad, pasif: !!(sp.pasif || sp.donduruldu) }); }); });
    return l;
}
function yzKatla(x) { return String(x || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u'); }
let _yzSec = { yer: 'tur', ara: '' };
function yzSporcuSecici(yer) { _yzSec = { yer: yer || 'tur', ara: '' }; yzSporcuSeciciCiz(true); }
function yzSecKatilimci() { if (_yzSec.yer === 'kurulum') return yzKurulumTaslak().katilimci; let d = yzOku().durum; return d ? d.katilimci : []; }
function yzSporcuSeciciCiz(odak) {
    let kap = document.getElementById('yz-secici');
    if (!kap) { kap = document.createElement('div'); kap.id = 'yz-secici'; kap.className = 'yz-giris-arka'; kap.addEventListener('click', function (e) { if (e.target === kap) yzSeciciKapat(); }); document.body.appendChild(kap); }
    let kat = yzSecKatilimci(), o = yzOku(), d = o.durum, tur = _yzSec.yer === 'tur' && d;
    let grupAdi = function (g) { return typeof grupAd === 'function' ? grupAd(g) : g; };
    let icindekiler = kat.map(function (k) {
        let girilen = tur ? yzSkor(o, k).filter(Boolean).length : 0;
        return '<div class="yz-sec-sat"><span class="yz-sec-ad"><b>' + esc(yzKAd(k)) + '</b><small>' + esc(grupAdi(k.slice(0, k.indexOf('|')))) + (tur ? ' · hedef ' + esc((d.hedefler || {})[k] || '') + ' · ' + girilen + ' seri' : '') + '</small></span>'
            + '<button class="yz-btn tehlike" onclick="yzSecCikar(\'' + yzEnc(k) + '\')">Çıkar</button></div>';
    }).join('') || '<div class="yz-alt" style="padding:10px">Henüz sporcu yok.</div>';
    let q = yzKatla(_yzSec.ara.trim()), roster = {}, dersteMi = function (k) { return (typeof _kmListe !== 'undefined' ? _kmListe : []).some(function (s) { return s.g + '|' + s.ad === k; }); };
    yzRoster().forEach(function (r) { roster[r.g + '|' + r.ad] = 1; });
    let adaylar = yzTumSporcular().filter(function (x) { return kat.indexOf(x.k) === -1 && (q ? yzKatla(x.ad).indexOf(q) !== -1 : !x.pasif); }) // pasif/dondurulmuş yalnız aranınca
        .sort(function (a, b) { return (roster[b.k] || 0) - (roster[a.k] || 0) || a.ad.localeCompare(b.ad, 'tr'); }).slice(0, q ? 40 : 12);
    let ekle = adaylar.map(function (x) { return '<button class="yz-sec-aday" onclick="yzSecEkle(\'' + yzEnc(x.k) + '\')"><span>+ ' + esc(x.ad) + '</span><small>' + esc(grupAdi(x.g)) + (roster[x.k] ? ' · derste' : (dersteMi(x.k) ? ' · derste (oyun hattı)' : ' · derse de eklenir')) + (x.pasif ? ' · pasif' : '') + '</small></button>'; }).join('')
        || '<div class="yz-alt" style="padding:8px">' + (q ? 'Bu isimde sporcu bulunamadı.' : 'Eklenecek sporcu yok.') + '</div>';
    kap.innerHTML = '<div class="yz-giris yz-secici" role="dialog" aria-modal="true" aria-label="Sporcu ekle veya çıkar"><div class="yz-giris-bas"><div><b>👥 ' + (tur ? 'Turdaki sporcular' : 'Tura katılacaklar') + ' (' + kat.length + ')</b>'
        + (tur ? '<div class="yz-alt">Sonradan eklenen sporcunun kaçırdığı seriler boş kalır; tablodaki hücreye dokunup girebilirsin. Çıkarılanın serileri silinmez.</div>' : '') + '</div>'
        + '<button class="yz-btn" onclick="yzSeciciKapat()">Kapat</button></div>'
        + '<div class="yz-sec-liste">' + icindekiler + '</div>'
        + '<div class="yz-etiket" style="margin-top:14px">Sporcu ekle</div>'
        + '<input id="yz-sec-ara" class="yz-sec-ara" type="search" placeholder="İsim yaz… (tüm gruplar)" value="' + esc(_yzSec.ara) + '" oninput="_yzSec.ara=this.value; yzSporcuSeciciCiz(true)">'
        + '<div class="yz-sec-adaylar">' + ekle + '</div></div>';
    yzSeciciCss();
    if (odak) { let a = document.getElementById('yz-sec-ara'); if (a) { a.focus(); try { a.setSelectionRange(a.value.length, a.value.length); } catch (e) {} } }
}
function yzSeciciKapat() { let k = document.getElementById('yz-secici'); if (k) k.remove(); yzCiz(); if (_yz.tv) yzTvCiz(); }
function yzSecEkle(kEnc) {
    let k = decodeURIComponent(kEnc);
    // ders listesinde değilse derse de eklenir; karma derste Yarışma hattına alınır (Oyunlar'dan çıkar)
    let derse = yzDerseEkle(k), eskiTaslak = _yz.kurulum; yzHattaAl(k); if (eskiTaslak) _yz.kurulum = eskiTaslak; // hat kaydı taslağı sıfırlar — koçun seçimleri kalsın
    if (_yzSec.yer === 'kurulum') { let t = yzKurulumTaslak(); t.bilinen = t.bilinen || {}; t.bilinen[k] = 1; if (t.katilimci.indexOf(k) === -1) t.katilimci.push(k); }
    else {
        yzGuncelle(function (o) { yzTuraEkleKayit(o, k); });
        let d = yzOku().durum, i = k.indexOf('|'), sp = turnuvaDB[k.slice(0, i)] && turnuvaDB[k.slice(0, i)][k.slice(i + 1)];
        if (d && d.ayar.kayit && sp && !sp.devamModu) { sp.devamModu = true; sp.lastModified = Date.now(); } // uzun turda seri limiti durdurmasın
    }
    _yzSec.ara = ''; showToast(yzKAd(k) + ' eklendi' + (derse ? ' (derse de)' : ''), 'success'); yzSporcuSeciciCiz(true);
    if (_yz.tv) yzTvCiz();
}
function yzSecCikar(kEnc) {
    let k = decodeURIComponent(kEnc);
    let yap = function () {
        if (_yzSec.yer === 'kurulum') { let t = yzKurulumTaslak(), j = t.katilimci.indexOf(k); if (j !== -1) t.katilimci.splice(j, 1); }
        else yzGuncelle(function (o) { let d = o.durum; if (!d) return; let j = d.katilimci.indexOf(k); if (j !== -1) d.katilimci.splice(j, 1); d.cikarilan = (d.cikarilan || []).concat([k]); });
        showToast(yzKAd(k) + ' çıkarıldı', 'warning'); yzSporcuSeciciCiz(false); if (_yz.tv) yzTvCiz();
    };
    let girilen = _yzSec.yer === 'tur' ? yzSkor(yzOku(), k).filter(Boolean).length : 0;
    if (!girilen) return yap();
    // onay penceresi seçicinin üstünde görünsün
    let kap = document.getElementById('yz-secici'); if (kap) kap.style.display = 'none';
    onayIste('<b>' + esc(yzKAd(k)) + '</b> turdan çıkarılsın mı?<br><small>' + girilen + ' serisi girilmiş. Seriler silinmez; geri eklersen tablosu geri gelir.</small>',
        function () { if (kap) kap.style.display = ''; yap(); }, 'Çıkar', 'Vazgeç');
    setTimeout(function () { let h = document.querySelector('#onay-modal button[onclick="onayKapat()"]'); if (h) h.addEventListener('click', function () { if (kap) kap.style.display = ''; }, { once: true }); }, 30);
}
function yzSeciciCss() {
    if (document.getElementById('yz-secici-css')) return;
    let st = document.createElement('style'); st.id = 'yz-secici-css';
    st.textContent = '.yz-secici{max-width:560px;width:100%;max-height:88vh;overflow:auto}'
        + '.yz-sec-liste{display:flex;flex-direction:column;gap:6px;margin-top:10px}'
        + '.yz-sec-sat{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-main)}'
        + '.yz-sec-ad{display:flex;flex-direction:column;min-width:0}.yz-sec-ad b{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.yz-sec-ad small{font-size:11.5px;color:var(--text-muted)}'
        + '.yz-sec-ara{width:100%;box-sizing:border-box;min-height:42px;border-radius:12px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);padding:8px 12px;font:inherit;font-size:14px;margin:6px 0 8px}'
        + '.yz-sec-adaylar{display:flex;flex-wrap:wrap;gap:6px}'
        + '.yz-sec-aday{display:flex;flex-direction:column;align-items:flex-start;gap:1px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);border-radius:12px;padding:7px 12px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;min-height:44px}'
        + '.yz-sec-aday small{font-size:10.5px;font-weight:600;color:var(--text-muted)}.yz-sec-aday:hover{border-color:var(--accent-orange)}';
    document.head.appendChild(st);
}

// ================================================================================================
// 📈 Grafikler (2026-10-05, kullanıcı: "detaylı analizler güzel ama grafik açısından daha iyi olmalı").
// (1) Seri seri yarış: her sporcunun TOPLAMININ seriler boyunca yükselişi — kim ne zaman öne geçti tek bakışta.
//     İlk 3 kendi madalya renginde ve kalın; diğerleri ince/soluk (üzerine gelince/dokununca öne çıkar). Uçlarda isim.
// (2) "Seri puanları" kutu grafiği: her sporcunun en düşük–en yüksek seri aralığı + ortalaması (istikrar).
// Tamamen SVG, kütüphane yok. Seri sayısı < 2 ise gösterilmez.
// ================================================================================================
const YZ_GRAFIK_RENK = ['#f5c542', '#cbd5e1', '#f0883e', '#38bdf8', '#a78bfa', '#34d399', '#f472b6', '#facc15', '#60a5fa', '#fb7185', '#2dd4bf', '#c084fc'];
function yzYarisGrafikKartHTML(o, sira, sonuc) {
    let d = o.durum, f = yzFormat(d), son = -1;
    sira.forEach(function (r) { r.seriT.forEach(function (v, i) { if (v != null && i > son) son = i; }); });
    if (son < 1 || !sira.length) return '';
    let acik = sonuc || (_yz.grafikAcik !== false);
    return '<details class="yz-kart yz-grafik-kart"' + (acik ? ' open' : '') + (sonuc ? '' : ' data-yz-grafik="1"') + '><summary class="yz-etiket">📈 Seri seri yarış <span class="yz-alt" style="text-transform:none;letter-spacing:0;font-weight:600">· her seri sonunda lidere kaç puan geride · bir isme dokun → öne çıkar</span></summary>'
        + '<div class="yz-grafik-ikili"><div class="yz-grafik-kap">' + yzYarisSVG(o, sira, son) + '</div>'
        + '<div class="yz-grafik-kap"><div class="yz-grafik-baslik">Seri puanı aralığı · istikrar</div>' + yzKutuSVG(o, sira) + '</div></div></details>';
}
function yzYarisSVG(o, sira, son) {
    let d = o.durum, f = yzFormat(d), n = son + 1;
    let W = 760, H = 300, sol = 44, sag = 168, ust = 14, alt = 30, gw = W - sol - sag, gh = H - ust - alt;
    // Toplamlar hep birlikte yükseldiği için okunmuyordu → her seri sonunda LİDERE PUAN FARKI (lider = 0 çizgisi).
    let top_ = sira.map(function (r) { let t = 0, a = []; for (let i = 0; i < n; i++) { if (r.seriT[i] != null) t += r.seriT[i]; a.push(t); } return a; });
    let lider = []; for (let i = 0; i < n; i++) lider.push(Math.max.apply(null, top_.map(function (a) { return a[i]; })));
    let kum = top_.map(function (a) { return a.map(function (v, i) { return v - lider[i]; }); });
    let enAz = Math.min(-1, Math.min.apply(null, kum.map(function (a) { return Math.min.apply(null, a); })));
    let adim = -enAz > 120 ? 30 : -enAz > 60 ? 20 : -enAz > 25 ? 10 : -enAz > 10 ? 5 : 2, alt_ = Math.floor(enAz / adim) * adim;
    let X = function (i) { return sol + (n === 1 ? 0 : i / (n - 1) * gw); }, Y = function (v) { return ust + (v / alt_) * gh; };
    let izgara = '';
    for (let v = 0; v >= alt_; v -= adim) izgara += '<line x1="' + sol + '" x2="' + (sol + gw) + '" y1="' + Y(v).toFixed(1) + '" y2="' + Y(v).toFixed(1) + '" class="yz-gr-izgara' + (v === 0 ? ' sifir' : '') + '"/><text x="' + (sol - 6) + '" y="' + (Y(v) + 4).toFixed(1) + '" text-anchor="end" class="yz-gr-eksen">' + (v === 0 ? 'lider' : v) + '</text>';
    for (let i = 0; i < n; i++) izgara += '<text x="' + X(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" class="yz-gr-eksen">' + (i + 1) + '</text>';
    if (f.yari && f.yari < n) izgara += '<line x1="' + ((X(f.yari - 1) + X(f.yari)) / 2).toFixed(1) + '" x2="' + ((X(f.yari - 1) + X(f.yari)) / 2).toFixed(1) + '" y1="' + ust + '" y2="' + (ust + gh) + '" class="yz-gr-yari"/>';
    // isim etiketleri çakışmasın: uç y'lerini en az 13px aralıkla dağıt
    let uclar = sira.map(function (r, j) { return { j: j, y: Y(kum[j][n - 1]) }; }).sort(function (a, b) { return a.y - b.y; });
    for (let i = 1; i < uclar.length; i++) if (uclar[i].y - uclar[i - 1].y < 13) uclar[i].y = uclar[i - 1].y + 13;
    let etY = {}; uclar.forEach(function (u) { etY[u.j] = Math.min(H - alt + 6, u.y); });
    let cizgiler = sira.slice().map(function (r, j) { return { r: r, j: j }; }).reverse().map(function (x) {
        let r = x.r, j = x.j, renk = YZ_GRAFIK_RENK[j % YZ_GRAFIK_RENK.length], ilk3 = r.sira <= 3 && r.toplam > 0;
        let pts = kum[j].map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); }).join(' ');
        let sonX = X(n - 1), sonY = Y(kum[j][n - 1]);
        return '<g class="yz-gr-cizgi' + (ilk3 ? ' ilk' : '') + '" data-k="' + esc(r.k) + '" onclick="yzGrafikVurgula(this)" style="--c:' + renk + '">'
            + '<polyline points="' + pts + '" class="yz-gr-tik"/><polyline points="' + pts + '" class="yz-gr-hat"/>'
            + kum[j].map(function (v, i) { return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="' + (i === n - 1 ? 4.5 : 2.4) + '" class="yz-gr-nokta"><title>' + esc(r.ad) + ' · ' + (i + 1) + '. seri sonu: ' + top_[j][i] + ' puan' + (v ? ' (lidere ' + (-v) + ')' : ' (lider)') + '</title></circle>'; }).join('')
            + '<line x1="' + (sonX + 5) + '" y1="' + sonY.toFixed(1) + '" x2="' + (sonX + 12) + '" y2="' + etY[j].toFixed(1) + '" class="yz-gr-bag"/>'
            + '<text x="' + (sonX + 15) + '" y="' + (etY[j] + 4).toFixed(1) + '" class="yz-gr-ad">' + (ilk3 ? ['🥇', '🥈', '🥉'][r.sira - 1] + ' ' : r.sira + '. ') + esc(yzGrKisalt(yzKisaAd(r.ad), 13)) + ' · ' + top_[j][n - 1] + '</text></g>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="yz-gr-svg" role="img" aria-label="Seri seri toplam puan grafiği">' + izgara + cizgiler + '</svg>';
}
function yzGrKisalt(t, n) { t = String(t); return t.length > n ? t.slice(0, n - 1) + '…' : t; }
function yzGrafikVurgula(g) {
    let svg = g.closest('svg'), k = g.getAttribute('data-k'), zaten = g.classList.contains('secili');
    svg.querySelectorAll('.yz-gr-cizgi').forEach(function (x) { x.classList.remove('secili'); });
    svg.classList.toggle('vurgulu', !zaten);
    if (!zaten) { g.classList.add('secili'); g.parentNode.appendChild(g); }
}
function yzKutuSVG(o, sira) {
    let f = yzFormat(o.durum), maksSeri = f.ok * 10, liste = sira.filter(function (r) { return r.seriT.some(function (v) { return v != null; }); });
    let satirH = 24, W = 380, sol = 116, sag = 14, H = liste.length * satirH + 26, gw = W - sol - sag;
    let tum = []; liste.forEach(function (r) { r.seriT.forEach(function (v) { if (v != null) tum.push(v); }); });
    let alt_ = Math.max(0, Math.floor((Math.min.apply(null, tum) - 2) / 5) * 5), X = function (v) { return sol + (v - alt_) / Math.max(1, maksSeri - alt_) * gw; };
    let izgara = '';
    for (let v = alt_; v <= maksSeri; v += Math.max(5, Math.round((maksSeri - alt_) / 5 / 5) * 5)) izgara += '<line x1="' + X(v).toFixed(1) + '" x2="' + X(v).toFixed(1) + '" y1="4" y2="' + (H - 20) + '" class="yz-gr-izgara"/><text x="' + X(v).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" class="yz-gr-eksen">' + v + '</text>';
    let satir = liste.map(function (r, i) {
        let v = r.seriT.filter(function (x) { return x != null; }), mn = Math.min.apply(null, v), mx = Math.max.apply(null, v), ort = v.reduce(function (a, b) { return a + b; }, 0) / v.length, y = 10 + i * satirH;
        let renk = YZ_GRAFIK_RENK[sira.indexOf(r) % YZ_GRAFIK_RENK.length];
        return '<g style="--c:' + renk + '"><text x="' + (sol - 8) + '" y="' + (y + 5) + '" text-anchor="end" class="yz-gr-ad kucuk">' + esc(yzGrKisalt(yzKisaAd(r.ad), 14)) + '</text>'
            + '<line x1="' + X(mn).toFixed(1) + '" x2="' + X(mx).toFixed(1) + '" y1="' + y + '" y2="' + y + '" class="yz-gr-aralik"/>'
            + v.map(function (x) { return '<circle cx="' + X(x).toFixed(1) + '" cy="' + y + '" r="2.2" class="yz-gr-seri"/>'; }).join('')
            + '<rect x="' + (X(ort) - 2).toFixed(1) + '" y="' + (y - 7) + '" width="4" height="14" rx="1.5" class="yz-gr-ort"><title>' + esc(r.ad) + ' · ort. ' + ort.toFixed(1) + ' · en düşük ' + mn + ' · en yüksek ' + mx + '</title></rect></g>';
    }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="yz-gr-svg" role="img" aria-label="Seri puanı aralıkları">' + izgara + satir + '</svg>'
        + '<div class="yz-alt" style="margin-top:4px">Çizgi = en düşük–en yüksek seri · dikey çubuk = ortalama. Kısa çizgi = istikrarlı.</div>';
}
// açık/kapalı hatırlanır — satır içi ontoggle KULLANILMAZ (bu dosyanın let'leri o bağlamda görünmüyor); toggle kabarcıklanmaz, yakalama ile dinlenir
document.addEventListener('toggle', function (e) { let t = e.target; if (t && t.getAttribute && t.getAttribute('data-yz-grafik')) _yz.grafikAcik = t.open; }, true);
(function () {
    let st = document.createElement('style'); st.id = 'yz-grafik-css';
    st.textContent = '.yz-grafik-kart summary{cursor:pointer;list-style:none}.yz-grafik-kart summary::-webkit-details-marker{display:none}'
        + '.yz-grafik-ikili{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:16px;margin-top:10px;align-items:start}'
        + '@media (max-width:900px){.yz-grafik-ikili{grid-template-columns:minmax(0,1fr)}}'
        + '@media (max-width:640px){.yz-grafik-kap{overflow-x:auto}.yz-grafik-kap .yz-gr-svg{min-width:600px}.yz-grafik-kap:last-child .yz-gr-svg{min-width:340px}}'
        + '.yz-grafik-kap{border:1px solid var(--border-color);border-radius:14px;padding:10px;background:var(--bg-main);min-width:0}'
        + '.yz-grafik-baslik{font-size:11.5px;font-weight:800;color:var(--text-muted);margin-bottom:4px}'
        + '.yz-gr-svg{width:100%;height:auto;display:block;color:var(--text-main);font-family:inherit}'
        + '.yz-gr-izgara{stroke:currentColor;stroke-opacity:.09;stroke-width:1}.yz-gr-izgara.sifir{stroke-opacity:.35;stroke-dasharray:5 4}.yz-gr-eksen{fill:currentColor;fill-opacity:.55;font-size:10.5px;font-variant-numeric:tabular-nums}'
        + '.yz-gr-yari{stroke:currentColor;stroke-opacity:.25;stroke-dasharray:4 4}'
        + '.yz-gr-hat{fill:none;stroke:var(--c);stroke-width:1.6;stroke-opacity:.45;stroke-linejoin:round;stroke-linecap:round}'
        + '.yz-gr-nokta{fill:var(--c);fill-opacity:.55}.yz-gr-bag{stroke:var(--c);stroke-opacity:.4}'
        + '.yz-gr-ad{fill:currentColor;fill-opacity:.7;font-size:11px;font-weight:700}.yz-gr-ad.kucuk{font-size:11px;fill-opacity:.85}'
        + '.yz-gr-cizgi{cursor:pointer}.yz-gr-tik{fill:none;stroke:transparent;stroke-width:14;pointer-events:stroke}.yz-gr-ad{pointer-events:all}.yz-gr-cizgi.ilk .yz-gr-hat{stroke-width:3.2;stroke-opacity:1}.yz-gr-cizgi.ilk .yz-gr-nokta{fill-opacity:1}.yz-gr-cizgi.ilk .yz-gr-ad{fill:var(--c);fill-opacity:1;font-weight:900}'
        + '.yz-gr-svg.vurgulu .yz-gr-cizgi{opacity:.18}.yz-gr-svg.vurgulu .yz-gr-cizgi.secili{opacity:1}.yz-gr-cizgi.secili .yz-gr-hat{stroke-width:3.6;stroke-opacity:1}.yz-gr-cizgi.secili .yz-gr-ad{fill:var(--c);fill-opacity:1;font-weight:900}.yz-gr-cizgi.secili .yz-gr-nokta{fill-opacity:1}'
        + '.yz-gr-aralik{stroke:var(--c);stroke-width:6;stroke-linecap:round;stroke-opacity:.28}.yz-gr-seri{fill:var(--c);fill-opacity:.75}.yz-gr-ort{fill:currentColor}'
        + '.yz-dg-cub{min-width:120px}.yz-dg-cub span{display:flex;height:12px;border-radius:6px;overflow:hidden;gap:1px}.yz-dg-cub i{display:block;min-width:2px}'
        + '.yz-dg-cub i.yz-r-sari{background:#facc15}.yz-dg-cub i.yz-r-kirmizi{background:#ef4444}.yz-dg-cub i.yz-r-mavi{background:#3b82f6}.yz-dg-cub i.yz-r-siyah{background:#334155}.yz-dg-cub i.yz-r-beyaz{background:#e2e8f0}.yz-dg-cub i.yz-r-kacan{background:#64748b;opacity:.5}';
    document.head.appendChild(st);
})();

// ================================================================================================
// 🎯 TV "Hedef Kâğıdı" teması (2026-10-06, kullanıcı 3 seçenekten B'yi seçti): açık krem zemin, her seri puanı
// hedef halkası renginde daire, toplamın altında lidere göre çubuk. Varsayılan bu; TV kontrollerindeki ☀️/🌙 ile
// eski koyu görünüme dönülebilir (bu cihazda hatırlanır). Yalnız CSS + seri hücresindeki .yz-sv span'ı.
// Bant: seri puanının ok başına ortalaması (3 ve 6 okta aynı ölçek): ≥9.67 → 10, ≥9 → 9, ≥8 → 8, ≥7 → 7, ≥6 → 6, ≥5 → 5.
// ================================================================================================
function yzSeriBant(v, ok) { let a = v / (ok || 3); return a >= 9.66 ? 'b10' : a >= 9 ? 'b9' : a >= 8 ? 'b8' : a >= 7 ? 'b7' : a >= 6 ? 'b6' : a >= 5 ? 'b5' : 'b0'; }
function yzTvTema() { try { return localStorage.getItem('dag_yz_tv_tema') || 'kagit'; } catch (e) { return 'kagit'; } }
function yzTvTemaDegis() { try { localStorage.setItem('dag_yz_tv_tema', yzTvTema() === 'kagit' ? 'koyu' : 'kagit'); } catch (e) {} _yz.tvHam = null; yzTvCiz(); }
function yzKagitCss() {
    if (document.getElementById('yz-kagit-css')) return;
    let K = '#yz-tv.kagit';
    let st = document.createElement('style'); st.id = 'yz-kagit-css';
    st.textContent = [
        '.yz-sv{display:inline-flex;align-items:center;justify-content:center}',
        '.yz-lider-cub{display:none}',
        K + '{background:#f6f1e7;color:#1d1a16}',
        K + ' .yz-tv-kimlik{border-left-color:#d92c20}',
        K + ' .yz-tv-logo{color:#d92c20}' + K + ' .yz-tv-ad{color:#1d1a16;font-family:Archivo,Poppins,sans-serif;text-transform:uppercase}' + K + ' .yz-tv-alt{color:#6b6358}',
        K + ' .yz-tv-seri{background:#fffdf8;border:2px solid #1d1a16}' + K + ' .yz-tv-seri-et,' + K + ' .yz-tv-seri-top{color:#6b6358}' + K + ' .yz-tv-seri b{color:#1d1a16}' + K + ' .yz-tv-bek{color:#6b6358}',
        K + ' .yz-sayac.hazir{background:#e3dccf;color:#1d1a16}',
        K + ' .yz-tv-k{background:#fffdf8;border-color:#cfc6b6;color:#1d1a16}' + K + ' .yz-tv-k.ana{background:#1d1a16;border-color:#1d1a16;color:#fff}' + K + ' .yz-tv-k.yesil{background:#16a34a;border-color:#16a34a;color:#fff}',
        K + ' .yz-tv-kapat{background:#fffdf8;color:#1d1a16;border-color:#cfc6b6}',
        K + ' .yz-tv-tablo{background:#fffdf8;border:2px solid #1d1a16;border-radius:.8vw}',
        K + ' .yz-tablo{color:#1d1a16;font-variant-numeric:tabular-nums}',
        K + ' .yz-tablo th{background:#fffdf8;color:#8b8378;border-bottom:3px solid #1d1a16;font-family:"Roboto Mono",monospace;letter-spacing:.06em}',
        K + ' .yz-tablo td{border-bottom:1px solid #e9e2d4}',
        K + ' .yz-tablo tbody tr:nth-child(even){background:transparent}',
        K + ' .yz-tablo .ad{font-weight:800;color:#1d1a16}',
        K + ' .yz-tablo .hdf{color:#8b8378}',
        K + ' .yz-tablo td.sira{font-family:Archivo,Poppins,sans-serif;font-weight:900;font-size:1.15em;background:transparent!important;box-shadow:none!important;color:#1d1a16}',
        K + ' .yz-tablo tr.p1 td.sira{color:#c99a06!important}' + K + ' .yz-tablo tr.p2 td.sira{color:#7c8794!important}' + K + ' .yz-tablo tr.p3 td.sira{color:#b4581c!important}',
        K + ' .yz-tablo tr.p1{background:linear-gradient(90deg,rgba(245,197,24,.16),transparent 40%)!important}',
        K + ' .yz-tablo .s{padding:0 .15vw}',
        K + ' .yz-tablo .s.aktif{background:rgba(217,44,32,.06);color:#1d1a16}' + K + ' .yz-tablo th.s.aktif{color:#d92c20}',
        K + ' .yz-tablo td.s.bos{color:#d6cdbd}',
        K + ' .yz-sv{width:calc(var(--yz-satir) * .74);height:calc(var(--yz-satir) * .74);max-width:100%;border-radius:50%;font-weight:800;font-size:.86em;line-height:1}',
        K + ' .yz-sv.b10{background:#f5c518;color:#1d1a16;box-shadow:0 0 0 2px #fffdf8,0 0 0 3.5px #c99a06}' + K + ' .yz-sv.b9{background:#f7d955;color:#1d1a16}',
        K + ' .yz-sv.b8{background:#e2453c;color:#fff}' + K + ' .yz-sv.b7{background:#ec7a73;color:#fff}',
        K + ' .yz-sv.b6{background:#3f8fd8;color:#fff}' + K + ' .yz-sv.b5{background:#8bb9e6;color:#1d1a16}' + K + ' .yz-sv.b0{background:#2b2a28;color:#fff}',
        K + ' .yz-tablo .yari{color:#6b6358;font-weight:800}' + K + ' .yz-tablo th.yari{color:#8b8378}',
        K + ' .yz-tablo .top{background:transparent!important;color:#1d1a16;font-family:Archivo,Poppins,sans-serif;font-weight:900;position:relative}',
        K + ' .yz-tablo th.top,' + K + ' .yz-tablo th{font-family:"Roboto Mono",monospace!important;font-size:calc(var(--yz-satir) * .24)!important;font-weight:700}',
        K + ' .yz-lider-cub{display:block;height:.18em;margin:.12em auto 0;width:80%;background:#e9e2d4;border-radius:99px;overflow:hidden}' + K + ' .yz-lider-cub b{display:block;height:100%;background:#1d1a16;border-radius:99px}',
        K + ' .yz-tablo tr.p1 .yz-lider-cub b{background:#c99a06}',
        K + ' .yz-tablo .tmp,' + K + ' .yz-tablo .on,' + K + ' .yz-tablo .x{color:#6b6358}',
        K + ' .yz-tablo td.hr .yuk{color:#15803d}' + K + ' .yz-tablo td.hr .dus{color:#b91c1c}',
        K + ' .yz-tablo tr.yeni td{animation:yzKagitYeni 4s ease-out}',
        '@keyframes yzKagitYeni{0%{background:rgba(245,197,24,.45)}100%{background:transparent}}',
        K + ' .yz-tablo tr.tv-tik:hover td{background:rgba(29,26,22,.05)}' + K + ' .yz-tablo td.tik:hover{outline:2px solid #d92c20}',
        K + ' .yz-grup-bas{color:#b4581c}',
        K + ' .yz-tablo tr.yz-ayrac td{background:#efe8da;color:#15803d}',
        K + ' .yz-tv-sayfa{background:#fffdf8;color:#1d1a16;border-color:#cfc6b6}',
        K + ' .yz-tv-pod{background:#fffdf8;border:2px solid #1d1a16;color:#1d1a16}',
        K + ' .yz-tv-dy{background:#fffdf8;color:#1d1a16;box-shadow:0 10px 40px rgba(0,0,0,.18)}',
        '@media (prefers-reduced-motion:reduce){' + K + ' .yz-tablo tr.yeni td{animation:none}}'
    ].join('\n');
    document.head.appendChild(st);
}

// ================================================================================================
// 🖱 Sporcu üzerine gelince grafik kartı (2026-10-06, kullanıcı: "sporcunun üstünde mouse durursa grafiği açılsın").
// Sıralama tablosunun (TV, tur ekranı, sonuç) bir satırında fare ~0,25 sn durunca imlecin yanında kart: seri seri
// puan grafiği (ortalama çizgisiyle), toplam, lidere fark, 10 / X, ortalama, en iyi seri. Satırdan çıkınca kapanır.
// Dokunmatikte açılmaz (orada satıra dokunmak skor girişini açar). Tek bir yüzen öğe, delegasyonla; tablolar
// yeniden çizilse de çalışır.
// ================================================================================================
let _yzHov = { k: null, z: null, el: null };
function yzHoverKart(k, x, y) {
    let o = yzOku(), d = o.durum; if (!d) return;
    let sira = yzSiralama(o), r = sira.find(function (q) { return q.k === k; }); if (!r) return;
    let f = yzFormat(d), lider = sira.length ? sira[0].toplam : 0, v = r.seriT.map(function (x, i) { return { x: x, i: i }; }).filter(function (q) { return q.x != null; });
    let el = _yzHov.el; if (!el) { el = _yzHov.el = document.createElement('div'); el.className = 'yz-hov'; document.body.appendChild(el); }
    let tv = !!document.getElementById('yz-tv'), kagit = tv && document.getElementById('yz-tv').classList.contains('kagit');
    el.classList.toggle('kagit', kagit || !tv && false);
    let gecmis = yzGecmisTurlar(k, d), onceki = gecmis.filter(function (g) { return g.format === d.ayar.format && g.seriT; }).slice(-1)[0] || null, bek = r.ortOk ? r.ortOk * f.ok : null;
    if (v.length) return yzHoverKart2(el, o, d, f, r, v, lider, gecmis, onceki, bek, x, y);
    let maks = f.ok * 10, W = 300, H = 110, sol = 4, sag = 4, ust = 14, alt = 16, gw = W - sol - sag, gh = H - ust - alt;
    let mn = v.length ? Math.min.apply(null, v.map(function (q) { return q.x; })) : 0, taban = Math.max(0, Math.floor((mn - 2) / 2) * 2);
    let X = function (i) { return sol + (f.seri === 1 ? gw / 2 : i / (f.seri - 1) * gw); }, Y = function (val) { return ust + gh - (val - taban) / Math.max(1, maks - taban) * gh; };
    let ort = v.length ? v.reduce(function (a, q) { return a + q.x; }, 0) / v.length : 0, en = v.reduce(function (a, q) { return !a || q.x > a.x ? q : a; }, null);
    let pts = v.map(function (q) { return X(q.i).toFixed(1) + ',' + Y(q.x).toFixed(1); }).join(' ');
    let renk = r.sira === 1 ? '#c99a06' : r.sira === 2 ? '#7c8794' : r.sira === 3 ? '#b4581c' : '#d92c20';
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="yz-hov-svg">'
        + (v.length ? '<line x1="' + sol + '" x2="' + (W - sag) + '" y1="' + Y(ort).toFixed(1) + '" y2="' + Y(ort).toFixed(1) + '" class="yz-hov-ort"/><text x="' + (W - sag) + '" y="' + (Y(ort) - 3).toFixed(1) + '" text-anchor="end" class="yz-hov-et">ort. ' + ort.toFixed(1) + '</text>' : '')
        + (v.length > 1 ? '<polygon points="' + X(v[0].i).toFixed(1) + ',' + (ust + gh) + ' ' + pts + ' ' + X(v[v.length - 1].i).toFixed(1) + ',' + (ust + gh) + '" fill="' + renk + '" opacity=".12"/><polyline points="' + pts + '" fill="none" stroke="' + renk + '" stroke-width="2.4" stroke-linejoin="round"/>' : '')
        + v.map(function (q) { return '<circle cx="' + X(q.i).toFixed(1) + '" cy="' + Y(q.x).toFixed(1) + '" r="' + (en && q.i === en.i ? 4.5 : 3) + '" fill="' + (en && q.i === en.i ? '#16a34a' : renk) + '"/><text x="' + X(q.i).toFixed(1) + '" y="' + (Y(q.x) - 7).toFixed(1) + '" text-anchor="middle" class="yz-hov-deg">' + q.x + '</text>'; }).join('')
        + Array.from({ length: f.seri }, function (_, i) { return '<text x="' + X(i).toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle" class="yz-hov-et">' + (i + 1) + '</text>'; }).join('') + '</svg>';
    el.innerHTML = '<div class="yz-hov-ust"><span class="yz-hov-sira" style="background:' + renk + '">' + r.sira + '</span><b>' + esc(r.ad) + '</b><span class="yz-hov-hdf">' + esc(r.hedef || '') + '</span></div>'
        + '<div class="yz-hov-sayi"><span><b>' + r.toplam + '</b><small>toplam</small></span><span><b>' + (r.sira === 1 ? '—' : '−' + (lider - r.toplam)) + '</b><small>' + (r.sira === 1 ? 'lider' : 'lidere') + '</small></span><span><b>' + (r.ok ? (r.toplam / r.ok).toFixed(2) : '–') + '</b><small>ok ort.</small></span><span><b>' + r.on + '<i>/' + r.x + '</i></b><small>10+X / X</small></span></div>'
        + svg + (en ? '<div class="yz-hov-alt">En iyi seri: <b>' + (en.i + 1) + '.</b> (' + en.x + ')' + (r.hedefPuan ? ' · hedef ' + r.hedefPuan : '') + '</div>' : '<div class="yz-hov-alt">Henüz seri girilmedi.</div>');
    yzHoverKonum(x, y); el.classList.add('acik');
}
function yzHoverKart2(el, o, d, f, r, v, lider, gecmis, onceki, bek, mx, my) {
    let W = 320, H = 132, sol = 6, sag = 6, ust = 16, alt = 16, gw = W - sol - sag, gh = H - ust - alt, n = f.seri, bw = Math.max(4, Math.min(18, gw / n * 0.62));
    let degerler = v.map(function (q) { return q.x; }).concat(bek ? [bek] : []).concat(onceki ? onceki.seriT.filter(function (q) { return q != null; }) : []);
    let mn = Math.min.apply(null, degerler), taban = Math.max(0, Math.floor((mn - f.ok) / 2) * 2), maks = Math.min(f.ok * 10, Math.max.apply(null, degerler) + 2);
    let X = function (i) { return sol + (i + 0.5) / n * gw; }, Y = function (val) { return ust + gh - (val - taban) / Math.max(1, maks - taban) * gh; };
    let ort = v.reduce(function (a, q) { return a + q.x; }, 0) / v.length, en = v.reduce(function (a, q) { return !a || q.x > a.x ? q : a; }, null);
    let renk = r.sira === 1 ? '#c99a06' : r.sira === 2 ? '#7c8794' : r.sira === 3 ? '#b4581c' : '#d92c20';
    let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" class="yz-hov-svg">';
    v.forEach(function (q) { let ustu = bek ? q.x >= bek : q.x >= ort; svg += '<rect x="' + (X(q.i) - bw / 2).toFixed(1) + '" y="' + Y(q.x).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1, ust + gh - Y(q.x)).toFixed(1) + '" rx="2" fill="' + (ustu ? '#16a34a' : '#f97316') + '" opacity="' + (en && q.i === en.i ? 1 : .78) + '"/><text x="' + X(q.i).toFixed(1) + '" y="' + (Y(q.x) - 3).toFixed(1) + '" text-anchor="middle" class="yz-hov-deg">' + q.x + '</text>'; });
    if (onceki) { let op = onceki.seriT.map(function (q, i) { return q == null || i >= n ? null : X(i).toFixed(1) + ',' + Y(q).toFixed(1); }).filter(Boolean).join(' '); if (op) svg += '<polyline points="' + op + '" fill="none" stroke="#64748b" stroke-width="1.6" stroke-dasharray="3 3"/>'; }
    if (bek) svg += '<line x1="' + sol + '" x2="' + (W - sag) + '" y1="' + Y(bek).toFixed(1) + '" y2="' + Y(bek).toFixed(1) + '" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="6 4"/><text x="' + (W - sag) + '" y="' + (Y(bek) - 3).toFixed(1) + '" text-anchor="end" class="yz-hov-et" style="fill:#2563eb">kendi ort. ' + bek.toFixed(1).replace('.', ',') + '</text>';
    svg += Array.from({ length: n }, function (_, i) { return '<text x="' + X(i).toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle" class="yz-hov-et">' + (i + 1) + '</text>'; }).join('') + '</svg>';
    // özet cümleler
    let cumle = [];
    if (bek) { let ustu = v.filter(function (q) { return q.x >= bek; }).length; cumle.push((ustu * 2 >= v.length ? '🟢 ' : '🟠 ') + v.length + ' seriden <b>' + ustu + '</b>\'i kendi ortalamasının üstünde'); }
    if (r.girilen < f.seri && r.girilen >= 2) { let tahmin = Math.round(r.toplam / r.girilen * f.seri), gecen = gecmis.filter(function (g) { return g.format === d.ayar.format; }).slice(-1)[0]; cumle.push('⏱ Bu gidişle bitiş ≈ <b>' + tahmin + '</b>' + (gecen ? ' · geçen tur ' + gecen.toplam + ' (' + (tahmin - gecen.toplam >= 0 ? '+' : '') + (tahmin - gecen.toplam) + ')' : '')); }
    if (v.length >= 4) { let y1 = v.slice(0, Math.floor(v.length / 2)), y2 = v.slice(Math.floor(v.length / 2)), o1 = y1.reduce(function (a, q) { return a + q.x; }, 0) / y1.length, o2 = y2.reduce(function (a, q) { return a + q.x; }, 0) / y2.length, df = o2 - o1; let sd = Math.sqrt(v.reduce(function (a, q) { return a + (q.x - ort) * (q.x - ort); }, 0) / v.length), kot = v.reduce(function (a, q) { return !a || q.x < a.x ? q : a; }, null);
        cumle.push(Math.abs(df) < f.ok * 0.4 ? (sd >= f.ok * 0.8 ? '🎢 Dalgalı: en iyi ' + en.x + ', en zayıf ' + kot.x + ' (' + (en.x - kot.x) + ' puan fark) — istikrar çalışılabilir' : '➖ Seriler istikrarlı (en iyi ' + en.x + ', en zayıf ' + kot.x + ')') : df > 0 ? '📈 Giderek açılıyor (+' + df.toFixed(1).replace('.', ',') + '/seri)' : '📉 Son serilerde düşüş (' + df.toFixed(1).replace('.', ',') + '/seri) — dinlenme / odak?'); }
    if (gecmis.length) { let bugun = r.toplam / r.ok, l = gecmis.map(function (g) { return g.okOrt; }).concat([bugun]); cumle.push('🗓 Son ' + gecmis.length + ' tur (ok başı): ' + gecmis.map(function (g) { return g.okOrt.toFixed(1).replace('.', ','); }).join(' → ') + ' → <b>bugün ' + bugun.toFixed(1).replace('.', ',') + '</b> ' + yzMiniCizgi(l, 60, 16, bugun >= gecmis[gecmis.length - 1].okOrt ? '#16a34a' : '#dc2626')); }
    else cumle.push('🆕 Bu mesafede ilk turu — sonraki turlarda karşılaştırılır');
    let ef = r.ortOk ? r.toplam / r.ok - r.ortOk : null;
    el.innerHTML = '<div class="yz-hov-ust"><span class="yz-hov-sira" style="background:' + renk + '">' + r.sira + '</span><b>' + esc(r.ad) + '</b><span class="yz-hov-hdf">' + esc(r.hedef || '') + '</span></div>'
        + '<div class="yz-hov-sayi"><span><b>' + r.toplam + '</b><small>toplam</small></span><span><b>' + (r.sira === 1 ? '—' : '−' + (lider - r.toplam)) + '</b><small>' + (r.sira === 1 ? 'lider' : 'lidere') + '</small></span><span><b>' + (r.toplam / r.ok).toFixed(2) + '</b><small>ok ort.' + (ef != null ? ' <i style="color:' + (ef >= 0 ? '#16a34a' : '#dc2626') + ';font-style:normal">' + (ef >= 0 ? '+' : '') + ef.toFixed(2) + '</i>' : '') + '</small></span><span><b>' + r.on + '<i>/' + r.x + '</i></b><small>10+X / X</small></span></div>'
        + svg
        + '<div class="yz-hov-lej"><span><i style="background:#16a34a"></i>ort. üstü</span><span><i style="background:#f97316"></i>altı</span>' + (bek ? '<span><i class="cizgi" style="border-color:#2563eb"></i>kendi ort.</span>' : '') + (onceki ? '<span><i class="cizgi" style="border-color:#64748b"></i>geçen tur ' + esc(yzTarihTR(onceki.tarih)) + '</span>' : '') + '</div>'
        + '<div class="yz-hov-cumle">' + cumle.map(function (c) { return '<div>' + c + '</div>'; }).join('') + '</div>';
    yzHoverKonum(mx, my); el.classList.add('acik');
}
function yzHoverKonum(x, y) {
    let el = _yzHov.el; if (!el) return;
    let w = el.offsetWidth || 340, h = el.offsetHeight || 260, px = x + 22, py = y + 18;
    if (px + w > innerWidth - 8) px = x - w - 22; if (py + h > innerHeight - 8) py = innerHeight - h - 8;
    el.style.left = Math.max(8, px) + 'px'; el.style.top = Math.max(8, py) + 'px';
}
function yzHoverKapat() { clearTimeout(_yzHov.z); _yzHov.k = null; if (_yzHov.el) _yzHov.el.classList.remove('acik'); }
document.addEventListener('mouseover', function (e) {
    if (e.pointerType === 'touch' || (window.matchMedia && !matchMedia('(hover: hover)').matches)) return;
    let tr = e.target && e.target.closest && e.target.closest('table.yz-tablo tr[data-k]');
    if (!tr) { if (_yzHov.k) yzHoverKapat(); return; }
    let k = tr.getAttribute('data-k'); if (k === _yzHov.k) return;
    clearTimeout(_yzHov.z); if (_yzHov.el) _yzHov.el.classList.remove('acik'); _yzHov.k = k;
    let x = e.clientX, y = e.clientY;
    _yzHov.z = setTimeout(function () { if (_yzHov.k === k) yzHoverKart(k, x, y); }, 250);
}, true);
document.addEventListener('mousemove', function (e) { if (_yzHov.el && _yzHov.el.classList.contains('acik')) yzHoverKonum(e.clientX, e.clientY); }, { passive: true });
document.addEventListener('mousedown', function () { yzHoverKapat(); }, true);
(function () {
    let st = document.createElement('style'); st.id = 'yz-hov-css';
    st.textContent = '.yz-hov-lej{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;font-weight:700;color:#6b6358;margin-top:2px}.yz-hov-lej i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}.yz-hov-lej i.cizgi{height:0;border-top:2px dashed;border-radius:0;width:14px;vertical-align:3px}'
        + '.yz-hov-cumle{display:grid;gap:3px;margin-top:6px;padding-top:6px;border-top:1px solid #e9e2d4;font-size:12.5px;line-height:1.35}.yz-hov-cumle .yz-mini{width:60px;height:16px;vertical-align:-3px;color:#1d1a16}'
        + '.yz-tablo td.gel .yz-gel-ic{display:inline-flex;align-items:center;gap:.35em;white-space:nowrap}.yz-tablo td.gel .yz-mini{width:2.6em;height:1em;flex:none}.yz-tablo td.gel .yz-gel-say{display:inline-flex;flex-direction:column;align-items:flex-end;line-height:1}.yz-tablo td.gel .yz-gel-say small{font-size:.58em;font-weight:700;opacity:.8}'
        + '.yz-hov{position:fixed;z-index:2147483600;width:clamp(330px,22vw,470px);pointer-events:none;opacity:0;transform:translateY(6px) scale(.98);transition:opacity .15s ease,transform .15s ease;background:#fffdf8;color:#1d1a16;border:2px solid #1d1a16;border-radius:14px;padding:12px 14px 10px;box-shadow:0 18px 50px rgba(0,0,0,.35);font-family:inherit}'
        + '.yz-hov.acik{opacity:1;transform:none}'
        + '.yz-hov-ust{display:flex;align-items:center;gap:8px}.yz-hov-ust b{font-size:15px;font-weight:900;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
        + '.yz-hov-sira{min-width:26px;height:26px;border-radius:8px;color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:14px}'
        + '.yz-hov-hdf{font-size:11px;font-weight:800;color:#8b8378;font-family:"Roboto Mono",monospace}'
        + '.yz-hov-sayi{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0 6px}.yz-hov-sayi span{display:flex;flex-direction:column;align-items:center;background:#f3ede1;border-radius:9px;padding:5px 2px}'
        + '.yz-hov-sayi b{font-size:17px;font-weight:900;font-variant-numeric:tabular-nums}.yz-hov-sayi b i{font-style:normal;font-size:.7em;color:#8b8378}.yz-hov-sayi small{font-size:10px;color:#6b6358;font-weight:700}'
        + '.yz-hov-svg{width:100%;height:auto;display:block}.yz-hov-ort{stroke:#8b8378;stroke-dasharray:4 4;stroke-width:1}.yz-hov-et{font-size:9px;fill:#8b8378;font-weight:700}.yz-hov-deg{font-size:9.5px;fill:#1d1a16;font-weight:800}'
        + '.yz-hov-alt{font-size:11.5px;color:#6b6358;margin-top:4px}.yz-hov-alt b{color:#1d1a16}'
        + '@media (prefers-reduced-motion:reduce){.yz-hov{transition:none}}';
    document.head.appendChild(st);
})();
