/* ================================================================================================
   🎡 VELİ / SPORCU PANOSU — Milo. 2026-10-26 "2 · Halka pano"; 2026-10-27 kullanıcı: "sporcu girişini geliştirelim, örneğin İnci
   için girdiği dersi, gireceği dersi, kalan dersi, ödeme yapmış mı, kaç gün kaldı ödemeye görsün; becerileri yakında, şimdi
   kaldıralım ama tatlı olsun; telafiyi sporcu da görebilsin" → taslaklardan (https://claude.ai/artifact/H3mZWmXFNeyE4ZbVV6MyYj)
   "2 · Takvim" + "1 · Delikli kart" karışımı:
     · üstte ödeme geri sayımı (halka = paketin dolması, ortada ödemeye kalan gün) + durum çipleri
     · delikli kart: paketin 8 dersi — işlenenler (✓ geldi · 📞 haber verdi · 🤒 hasta · ✕ gelmedi) ve gireceği derslerin tarihleri
     · takvim: bu ay (+ ödeme günü sonraki aydaysa o ay) — geldiği / haber verdiği / gelmediği günler, gireceği dersler, ödeme günü
     · telafi hakları (son günü ve kalan gün), gireceği dersler, bu hafta neler yaptık, antrenörün notu
     · 🌱 Beceri bahçesi · Yakında (beceriler şimdilik yok)
   Gireceği dersler ve ödeme günü programdan cihaz saatiyle hesaplanır (yeni paket = kalan derslerden sonraki ilk ders).
   Veri: POST /api/milo/sporcu-girisi (paket / dersler / telafiler / kayitlar / buHafta → src/routes/milo/veliPano.ts).
   app.js'teki miloSporcuProfilCiz'in yerine geçer — bu dosya app.js'ten SONRA yüklenmeli. Önek mvp.
   ================================================================================================ */
const MVP_GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MVP_GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MVP_AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MVP_DURUM = { g: ['✓', 'Geldi'], t: ['🔁', 'Telafi dersi'], m: ['📞', 'Haber verdi'], h: ['🤒', 'Hasta'], y: ['✕', 'Gelmedi'], k: ['↪', 'Başka gün geldi'] };

function mvpIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function mvpTarih(iso) { let d = new Date(iso + 'T12:00:00'); return d.getDate() + ' ' + MVP_AY[d.getMonth()]; }
function mvpKisa(iso) { let d = new Date(iso + 'T12:00:00'); return d.getDate() + ' ' + MVP_AY[d.getMonth()].slice(0, 3); }
function mvpGunFark(a, b) { return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5); }
function mvpKalanYazi(n) { return n === 0 ? 'Bugün' : n === 1 ? 'Yarın' : n + ' gün sonra'; }
// Gireceği dersler: bugünden 90 gün ileriye, iptal edilmemiş, henüz kaydı olmayan dersler (bugünse bitmemiş olmalı)
function mvpGelecek(dersler, kayitli, simdi) {
    simdi = simdi || new Date();
    let saat = String(simdi.getHours()).padStart(2, '0') + ':' + String(simdi.getMinutes()).padStart(2, '0'), l = [];
    for (let i = 0; i < 90 && l.length < 24; i++) {
        let d = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate() + i, 12), iso = mvpIso(d), gun = [];
        (dersler || []).forEach(function (s) {
            if (s.gunler.indexOf(d.getDay()) === -1 || (s.iptal || []).indexOf(iso) !== -1 || kayitli[iso]) return;
            if (i === 0 && (s.bit || s.bas) <= saat) return;
            gun.push({ tarih: d, iso: iso, gun: i, bas: s.bas, bit: s.bit, grup: s.grup });
        });
        gun.sort(function (a, b) { return a.bas < b.bas ? -1 : 1; }); if (gun.length) l.push(gun[0]); // aynı gün iki ders olsa da paket için bir ders
    }
    return l;
}
// "Bu hafta neler yaptık" kısa olsun (2026-10-27, kullanıcı: "o kadar uzun geçmesin, ana başlık altına kısa bir cümle"): yapılanların
// ilk cümlesi, en çok ~90 harf
function mvpKisaCumle(t) {
    t = String(t || '').replace(/\s+/g, ' ').trim(); if (!t) return '';
    let c = (t.match(/^.+?[.!?](\s|$)/) || [t])[0].trim();
    return c.length > 90 ? c.slice(0, 88).replace(/[\s,;:]+\S*$/, '') + '…' : c;
}
function mvpSiradaki(dersler, simdi) { return mvpGelecek(dersler, {}, simdi)[0] || null; }

// ---- 📷 Sporcunun fotoğrafı (2026-10-27, kullanıcı: "foto koymaya izin ver, sporcunun fotosu olsun, tatlı bir şey olsun").
// Avatara dokun → kamera / galeri → kare kırpılıp 360 px JPEG'e küçültülür → POST /api/milo/sporcu-foto (ad + doğum yılı kontrolü,
// meta 'foto:<ad>'). Yalnız kendi sporcu ekranında görünür. İlk eklemede küçük bir kutlama.
let MVP = { s: null, kim: null };
function mvpAvatarHTML(s, ilk) {
    let ic = s.foto ? '<img src="' + miloEsc(s.foto) + '" alt="">' : '<span>' + miloEsc(String(ilk || '?').charAt(0).toLocaleUpperCase('tr')) + '</span>';
    return '<button type="button" class="mvp-av' + (s.foto ? ' foto' : ' bos') + '" onclick="mvpFotoMenu()" aria-label="' + (s.foto ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle') + '">' + ic + '<i class="mvp-av-r" aria-hidden="true">' + (s.foto ? '✨' : '📷') + '</i></button>'
        + (s.foto ? '' : '<small class="mvp-av-ip">Fotoğraf ekle</small>')
        + '<input type="file" id="mvp-foto-dosya" accept="image/*" hidden onchange="mvpFotoSecildi(this)">';
}
function mvpFotoMenu() {
    let k = document.getElementById('mvp-av-kap'); if (!k || !MVP.s) return;
    if (!MVP.s.foto) return document.getElementById('mvp-foto-dosya').click();
    let m = document.getElementById('mvp-foto-menu'); if (m) return m.remove();
    m = document.createElement('div'); m.id = 'mvp-foto-menu'; m.className = 'mvp-foto-menu';
    m.innerHTML = '<button type="button" onclick="document.getElementById(\'mvp-foto-menu\').remove(); document.getElementById(\'mvp-foto-dosya\').click()">📷 Fotoğrafı değiştir</button><button type="button" onclick="mvpFotoKaldir()">🗑 Kaldır</button>';
    k.appendChild(m);
}
function mvpFotoKucult(dosya) {
    return new Promise(function (ok, red) {
        let url = URL.createObjectURL(dosya), img = new Image();
        img.onload = function () {
            let K = 360, c = document.createElement('canvas'); c.width = c.height = K;
            let w = img.naturalWidth, h = img.naturalHeight, kenar = Math.min(w, h), x = (w - kenar) / 2, y = Math.max(0, (h - kenar) / 2.6); // dikey fotoda yüz üstte → biraz yukarıdan kırp
            c.getContext('2d').drawImage(img, x, y, kenar, kenar, 0, 0, K, K); URL.revokeObjectURL(url);
            ok(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = function () { URL.revokeObjectURL(url); red(new Error('resim')); };
        img.src = url;
    });
}
async function mvpFotoYukle(veri) {
    let k = MVP.kim || {}, r = await fetch('/api/milo/sporcu-foto', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ad: k.ad, dogumYili: k.yil, veri: veri }) });
    if (!r.ok) throw new Error('yukle ' + r.status);
}
async function mvpFotoSecildi(inp) {
    let f = inp.files && inp.files[0]; inp.value = ''; if (!f) return;
    let ilkKez = !MVP.s.foto, veri;
    try { veri = await mvpFotoKucult(f); } catch (e) { return showToast('Bu fotoğraf açılamadı, başka bir fotoğraf dene.', 'error'); }
    try { await mvpFotoYukle(veri); } catch (e) { return showToast('Fotoğraf yüklenemedi, internet bağlantını kontrol et.', 'error'); }
    MVP.s.foto = veri; mvpAvatarYenile();
    if (ilkKez) mvpKutla(); showToast('📷 Fotoğraf eklendi', 'success');
}
async function mvpFotoKaldir() {
    let m = document.getElementById('mvp-foto-menu'); if (m) m.remove();
    try { await mvpFotoYukle(null); } catch (e) { return showToast('Kaldırılamadı, internet bağlantını kontrol et.', 'error'); }
    MVP.s.foto = null; mvpAvatarYenile(); showToast('Fotoğraf kaldırıldı', 'info');
}
function mvpAvatarYenile() { let k = document.getElementById('mvp-av-kap'); if (k && MVP.s) k.innerHTML = mvpAvatarHTML(MVP.s, String(MVP.s.ad || '').split(' ')[0]); }
function mvpKutla() {
    let k = document.getElementById('mvp-av-kap'); if (!k) return;
    ['⭐', '💛', '✨', '🧡', '⭐', '✨'].forEach(function (e, i) { let s = document.createElement('i'); s.className = 'mvp-konfeti'; s.textContent = e; s.style.setProperty('--a', (i * 60 - 150) + 'deg'); k.appendChild(s); setTimeout(function () { s.remove(); }, 1300); });
}

// ---- 📋 sekmeler: Gireceği · Girdiği · Takvim · Ödemeler (ilk üçünde ay seçilir)
const MVP_SEKMELER = [['gelecek', 'Gireceği'], ['girdi', 'Girdiği'], ['takvim', 'Takvim'], ['odeme', 'Ödemeler']];
function mvpAyAd(ay) { return MVP_AY[+ay.slice(5) - 1] + ' ' + ay.slice(0, 4); }
function mvpAyEkle(ay, n) { let d = new Date(ay + '-01T12:00:00'); d.setMonth(d.getMonth() + n); return mvpIso(d).slice(0, 7); }
function mvpAyAralik() {
    let c = MVP.ctx, l = [c.bugun.slice(0, 7)];
    c.kayitlar.forEach(function (r) { l.push(r.iso.slice(0, 7)); }); c.gelecek.forEach(function (g) { l.push(g.iso.slice(0, 7)); });
    l.sort(); return [l[0], l[l.length - 1]];
}
function mvpSekmeSec(k) { MVP.sekme = k; let e = document.getElementById('mvp-sekme'); if (e) e.innerHTML = mvpSekmeHTML(); }
function mvpAyKaydir(n) { let a = mvpAyAralik(), y = mvpAyEkle(MVP.ay, n); if (y < a[0] || y > a[1]) return; MVP.ay = y; mvpSekmeSec(MVP.sekme); }
// Gireceği derslerin paket sırası: kalan dersler bu pakette, sonra her 8 ders yeni paket
function mvpGelecekSira(j) {
    let c = MVP.ctx, p = c.p; if (!p) return { etiket: '', yeni: false };
    if (j < c.kalan) return { etiket: p.no + '. paket · ' + (c.n + j + 1) + '. ders', son: c.n + j + 1 === 8 };
    let k = j - c.kalan, no = p.no + 1 + Math.floor(k / 8), d = k % 8 + 1;
    return { etiket: no + '. paket · ' + d + '. ders', yeni: d === 1, son: d === 8 };
}
function mvpSekmeHTML() {
    let c = MVP.ctx; if (!c) return '';
    let sek = '<div class="mvp-sekmeler" role="tablist">' + MVP_SEKMELER.map(function (x) { return '<button type="button" role="tab" aria-selected="' + (MVP.sekme === x[0]) + '" class="' + (MVP.sekme === x[0] ? 'on' : '') + '" onclick="mvpSekmeSec(\'' + x[0] + '\')">' + x[1] + '</button>'; }).join('') + '</div>';
    let ar = mvpAyAralik(), ayNav = MVP.sekme === 'odeme' ? '' : '<div class="mvp-aynav"><button type="button" onclick="mvpAyKaydir(-1)"' + (MVP.ay <= ar[0] ? ' disabled' : '') + ' aria-label="Önceki ay">‹</button><b>' + mvpAyAd(MVP.ay) + '</b><button type="button" onclick="mvpAyKaydir(1)"' + (MVP.ay >= ar[1] ? ' disabled' : '') + ' aria-label="Sonraki ay">›</button></div>';
    let ic = '', bos = function (m) { return '<div class="mvp-bos">' + m + '</div>'; };
    if (MVP.sekme === 'gelecek') {
        let l = c.gelecek.map(function (g, j) { return { g: g, s: mvpGelecekSira(j) }; }).filter(function (x) { return x.g.iso.slice(0, 7) === MVP.ay; });
        ic = l.length ? '<table class="mvp-tablo"><thead><tr><th>Tarih</th><th>Saat</th><th>Ders</th></tr></thead><tbody>' + l.map(function (x) {
            return '<tr' + (x.s.yeni ? ' class="yeni"' : '') + '><td><b>' + x.g.tarih.getDate() + ' ' + MVP_AY[x.g.tarih.getMonth()].slice(0, 3) + '</b><small>' + MVP_GUN[x.g.tarih.getDay()] + (x.g.gun <= 1 ? ' · ' + mvpKalanYazi(x.g.gun) : '') + '</small></td><td>' + miloEsc(x.g.bas) + '</td><td>' + miloEsc(x.s.etiket) + (x.s.yeni ? ' <span class="mvp-e y">💳 yeni paket</span>' : x.s.son ? ' <span class="mvp-e son">son ders</span>' : '') + '</td></tr>';
        }).join('') + '</tbody></table>' : bos(MVP.ay < c.bugun.slice(0, 7) ? 'Geçmiş ay — girdiği dersler için "Girdiği" sekmesine bak.' : 'Bu ay için ders görünmüyor.');
    } else if (MVP.sekme === 'girdi') {
        let l = c.kayitlar.filter(function (r) { return r.iso.slice(0, 7) === MVP.ay; }).slice().reverse(), say = {};
        l.forEach(function (r) { say[r.s] = (say[r.s] || 0) + 1; });
        ic = l.length ? '<div class="mvp-ozet">' + ['g', 't', 'm', 'h', 'y'].filter(function (k) { return say[k]; }).map(function (k) { return '<span class="d-' + k + '">' + MVP_DURUM[k][0] + ' ' + say[k] + ' ' + MVP_DURUM[k][1].toLocaleLowerCase('tr') + '</span>'; }).join('') + '</div>'
            + '<table class="mvp-tablo"><thead><tr><th>Tarih</th><th>Durum</th><th>Paket</th></tr></thead><tbody>' + l.map(function (r) {
                let d = new Date(r.iso + 'T12:00:00'), t = MVP_DURUM[r.s] || ['•', r.s];
                return '<tr><td><b>' + d.getDate() + ' ' + MVP_AY[d.getMonth()].slice(0, 3) + '</b><small>' + MVP_GUN[d.getDay()] + '</small></td><td><span class="mvp-dr d-' + r.s + '">' + t[0] + ' ' + t[1] + '</span>' + (r.hak ? '<small>🔁 telafi hakkı</small>' : '') + '</td><td>' + (r.pk ? r.pk + '. paket' : '—') + '</td></tr>';
            }).join('') + '</tbody></table>' : bos('Bu ay kayıtlı ders yok.');
    } else if (MVP.sekme === 'takvim') {
        let ay = MVP.ay, ilkGun = new Date(ay + '-01T12:00:00'), gunSay = new Date(ilkGun.getFullYear(), ilkGun.getMonth() + 1, 0).getDate(), b = (ilkGun.getDay() + 6) % 7;
        let h = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(function (g) { return '<div class="mvp-tb">' + g + '</div>'; }).join('');
        for (let i = 0; i < b; i++) h += '<div></div>';
        for (let d = 1; d <= gunSay; d++) {
            let iso = ay + '-' + String(d).padStart(2, '0'), k = c.kayit[iso], cls = '';
            if (k === 'g' || k === 't') cls = 'geldi'; else if (k === 'm') cls = 'haber'; else if (k === 'h') cls = 'hasta'; else if (k === 'y') cls = 'yok';
            else if (iso === c.odemeIso) cls = 'odeme'; else if (c.gelecekIso[iso]) cls = 'gelecek'; else if (c.digerDers[iso]) cls = 'ders';
            h += '<div class="mvp-tg ' + cls + (iso === c.bugun ? ' bugun' : '') + '" title="' + miloEsc(mvpTarih(iso) + (k && MVP_DURUM[k] ? ' · ' + MVP_DURUM[k][1] : iso === c.odemeIso ? ' · yeni paket' : c.gelecekIso[iso] ? ' · ders' : '')) + '">' + d + '</div>';
        }
        ic = '<div class="mvp-takvim">' + h + '</div><div class="mvp-lejant"><span><i class="geldi"></i>geldi</span><span><i class="haber"></i>haber verdi</span><span><i class="hasta"></i>hasta</span><span><i class="yok"></i>gelmedi</span><span><i class="gelecek"></i>gireceği ders</span>' + (c.odemeIso ? '<span><i class="odeme"></i>ödeme günü</span>' : '') + '</div>';
    } else {
        // Ödemeler: en üstte sıradaki ödeme (ne zaman), altında yapılan ödemeler (ne zaman, ne için) — Defter + Aidat birlikte
        let o = c.odeme || {}, satir = '';
        if (o.sonraki) satir += '<tr class="sonraki"><td><b>' + (o.sonraki.tarih ? miloEsc(mvpKisa(o.sonraki.tarih)) : '—') + '</b><small>' + (o.sonraki.gun != null ? (o.sonraki.gun <= 0 ? 'şimdi' : mvpKalanYazi(o.sonraki.gun)) : '') + '</small></td><td><b>' + miloEsc(o.sonraki.ne) + '</b><small>sıradaki ödeme</small></td><td><span class="mvp-dr d-bek">' + (o.sonraki.gun != null && o.sonraki.gun <= 0 ? '⏳ Bekliyor' : '📅 Yapılacak') + '</span></td></tr>';
        (o.bekleyen || []).forEach(function (b) { satir += '<tr><td><b>—</b></td><td><b>' + miloEsc(b.ne) + '</b>' + (b.alt ? '<small>' + miloEsc(b.alt) + '</small>' : '') + '</td><td><span class="mvp-dr d-bek">⏳ Bekliyor</span></td></tr>'; });
        (o.gecmis || []).forEach(function (h) { satir += '<tr><td><b>' + (h.tarih ? miloEsc(mvpKisa(h.tarih)) : '—') + '</b><small>' + (h.tarih ? MVP_GUN[new Date(h.tarih + 'T12:00:00').getDay()] + ' · ' + h.tarih.slice(0, 4) : 'ödeme günü girilmedi') + '</small></td><td><b>' + miloEsc(h.ne) + '</b>' + (h.alt ? '<small>' + miloEsc(h.alt) + '</small>' : '') + '</td><td><span class="mvp-dr d-g">✓ Ödendi</span></td></tr>'; });
        ic = satir ? '<table class="mvp-tablo"><thead><tr><th>Tarih</th><th>Ne için</th><th>Durum</th></tr></thead><tbody>' + satir + '</tbody></table>' : bos('Henüz ödeme kaydı yok.');
    }
    return sek + ayNav + ic;
}

// ---- 💳 ödeme durumu (2026-10-27, kullanıcı: "ne zaman ödeme yaptıkları ve ne zaman ödeme yapacakları da gözüksün; ödemeleri
// girdiklerim gözükmedi"). Milo'da ödeme iki yerden girilebiliyor: 📒 Defter'de paket ödemesi (meta paket_odeme) ve 💰 Aidat
// sekmesinde aylık kayıt (dues). İkisi de geçmişe yazılır. Model: çocuğun Defter paket ödemesi varsa PAKET (sıradaki ödeme =
// yeni paketin ilk dersi); yoksa ve Aidat'ta kaydı varsa AYLIK (sıradaki ödeme = ödenmemiş / dondurulmamış ilk ayın 1'i).
function mvpOdeme(s, p, yeniPaket, bugun) {
    let pak = s.odemeler || [], aid = s.aidat || [], ayAd = function (ay) { return MVP_AY[+ay.slice(5) - 1] + ' ' + ay.slice(0, 4); };
    let gecmis = [];
    pak.forEach(function (o) { if (o.odendi) gecmis.push({ tarih: o.odemeTarihi, sira: o.odemeTarihi || o.bas || '', ne: o.no + '. paket (8 ders)', alt: o.bas ? mvpKisa(o.bas) + (o.bit && o.bit !== o.bas ? ' – ' + mvpKisa(o.bit) : '') + ' dersleri' : '' }); });
    aid.forEach(function (a) { if (a.odendi) gecmis.push({ tarih: a.odemeTarihi, sira: a.odemeTarihi || a.ay + '-01', ne: ayAd(a.ay) + ' ödemesi', alt: '' }); });
    gecmis.sort(function (a, b) { return a.sira < b.sira ? 1 : a.sira > b.sira ? -1 : 0; });
    let son = gecmis[0] || null, model = pak.some(function (o) { return o.odendi; }) ? 'paket' : aid.length ? 'aylik' : 'paket';
    let r = { model: model, gecmis: gecmis, son: son, bekleyen: [], sonraki: null, gun: null, cls: '' };
    if (model === 'aylik') {
        let buAy = bugun.slice(0, 7), kayit = {}; aid.forEach(function (a) { kayit[a.ay] = a; });
        let ay = buAy; for (let i = 0; i < 24 && kayit[ay] && (kayit[ay].odendi || kayit[ay].dondu); i++) ay = mvpAyEkle(ay, 1);
        let gun = Math.max(0, mvpGunFark(bugun, ay + '-01'));
        r.sonraki = { tarih: ay === buAy ? null : ay + '-01', ne: ayAd(ay) + ' ödemesi', gun: ay === buAy ? 0 : gun };
        if (ay === buAy) { r.baslik = ayAd(ay).split(' ')[0] + ' ödemesi bekleniyor'; r.alt = son ? 'Son ödeme ' + (son.tarih ? mvpTarih(son.tarih) : son.ne) + '.' : 'Bu ayın ödemesi henüz girilmedi.'; r.cls = 'bek'; }
        else { r.gun = gun; r.baslik = gun === 0 ? 'Ödeme bugün' : 'Ödemeye ' + gun + ' gün'; r.alt = ayAd(ay).split(' ')[0] + ' ödemesi ' + mvpTarih(ay + '-01') + '. ' + (kayit[buAy] && kayit[buAy].odendi ? ayAd(buAy).split(' ')[0] + ' ödendi ✓' : ''); }
        return r;
    }
    pak.forEach(function (o) { if (!o.odendi) r.bekleyen.push({ ne: o.no + '. paket (8 ders)', alt: o.bas ? mvpKisa(o.bas) + "'den beri" : '' }); });
    if (!p) { r.baslik = 'Paket'; r.alt = 'İlk dersten itibaren 8 derslik paketin burada dolar.'; }
    else if (!p.odendi) { r.baslik = 'Ödeme bekleniyor'; r.alt = p.no + '. paketin ödemesi henüz girilmedi.' + (son ? ' Son ödeme ' + (son.tarih ? mvpTarih(son.tarih) : son.ne) + '.' : ''); r.cls = 'bek'; }
    else if (p.sonrakiOdendi) { r.baslik = 'Sonraki paket de ödendi ✓'; r.alt = (p.no + 1) + '. paket hazır, ödeme beklenmiyor.'; }
    else if (yeniPaket) { r.gun = yeniPaket.gun; r.baslik = r.gun === 0 ? 'Ödeme bugün' : 'Ödemeye ' + r.gun + ' gün'; r.alt = (p.no + 1) + '. paket ' + mvpTarih(yeniPaket.iso) + ' ' + MVP_GUN[yeniPaket.tarih.getDay()] + ' dersiyle başlıyor.'; r.sonraki = { tarih: yeniPaket.iso, ne: (p.no + 1) + '. paket (8 ders)', gun: r.gun }; }
    else { let kalan = Math.max(0, 8 - p.dersler.length); r.baslik = kalan ? kalan + ' ders kaldı' : 'Paket tamamlandı'; r.alt = 'Yeni paket, paket bitince başlar.'; }
    return r;
}

function miloSporcuProfilCiz(s) {
    mvpCss();
    if (!MVP.s || MVP.s.ad !== s.ad) { MVP.ay = null; MVP.sekme = null; } // başka çocuk → bu ay, "Gireceği" sekmesi
    MVP.s = s; MVP.kim = { ad: ((document.getElementById('milo-sporcu-giris-ad') || {}).value || s.ad || '').trim(), yil: ((document.getElementById('milo-sporcu-giris-yil') || {}).value || '').trim() };
    let kap = document.getElementById('milo-sporcu-app'); if (kap) kap.classList.add('mvp-kap');
    let alan = document.getElementById('milo-sporcu-icerik'); if (!alan) return;
    let ilk = String(s.ad || '').split(' ')[0], p = s.paket, bugun = mvpIso(new Date());
    let kayit = {}; (s.kayitlar || []).forEach(function (r) { kayit[r.iso] = r.s; });
    let gelecek = mvpGelecek(s.dersler, kayit), n = p ? p.dersler.length : 0, kalan = p ? Math.max(0, 8 - n) : 0;
    let paketDersleri = p ? gelecek.slice(0, kalan) : [], yeniPaket = p ? gelecek[kalan] || null : null;
    let acikHak = (s.telafiler || []).filter(function (h) { return h.durum === 'acik'; });

    // ---- ödeme (Defter paket ödemesi + Aidat sekmesindeki aylık ödemeler — mvpOdeme)
    let od = mvpOdeme(s, p, yeniPaket, bugun), odemeGun = od.gun, odemeBaslik = od.baslik, odemeAlt = od.alt, odemeCls = od.cls;
    let R = 15.5, C = 2 * Math.PI * R, dolu = C * (p ? n / 8 : 0);
    let halka = '<div class="mvp-halka"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="' + R + '" fill="none" stroke="var(--mvp-cizgi)" stroke-width="3.2"/><circle class="mvp-halka-d" cx="18" cy="18" r="' + R + '" fill="none" stroke="var(--mvp-vurgu)" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="' + dolu.toFixed(2) + ' ' + C.toFixed(2) + '" style="--c:' + C.toFixed(2) + '"/></svg>'
        + '<div class="mvp-orta"><div>' + (odemeGun != null ? '<b>' + odemeGun + '</b><small>gün kaldı</small>' : '<b>' + kalan + '</b><small>ders kaldı</small>') + '</div></div></div>';
    let cipler = (p && odemeGun != null ? '<span class="mvp-cip">' + (kalan ? kalan + ' ders kaldı' : 'paket tamam') + '</span>' : '')
        + (od.son ? '<span class="mvp-cip yesil">✓ Son ödeme · ' + (od.son.tarih ? miloEsc(mvpKisa(od.son.tarih)) : miloEsc(od.son.ne)) + '</span>' : '')
        + (acikHak.length ? '<span class="mvp-cip mor">🔁 ' + acikHak.length + ' telafi hakkı</span>' : '');
    let ustHTML = '<div class="mvp-hero ' + odemeCls + '">' + halka + '<div class="mvp-hero-m"><h3>' + miloEsc(odemeBaslik) + '</h3><p>' + miloEsc(odemeAlt) + '</p><div class="mvp-rozetler">' + cipler + '</div></div></div>';

    // ---- nokta yolu: paketin 8 dersi (2026-10-27, kullanıcı büyük yeşil delikli kartı beğenmedi → seçenekler
    // https://claude.ai/artifact/YBE4zMdhHCgLHr5SjSJzXJ → "C · Nokta yolu"): çizgiyle bağlı 8 küçük nokta, işlenenler dolu,
    // kalanlar kesikli; uçlarda paketin başladığı gün ve son dersin günü
    let biletHTML = '';
    if (p) {
        let yol = '';
        for (let i = 0; i < 8; i++) {
            if (i) yol += '<span class="mvp-cz' + (i < n ? ' d' : '') + '"></span>';
            if (i < n) { let d = p.dersler[i], t = MVP_DURUM[d] || ['•', '']; yol += '<span class="mvp-nk ' + d + '" title="' + miloEsc(mvpTarih(p.tarihler[i]) + ' · ' + t[1]) + '">' + (d === 'g' || d === 't' ? '✓' : d === 'y' ? '✕' : t[0]) + '</span>'; }
            else { let g = paketDersleri[i - n]; yol += '<span class="mvp-nk s" title="' + (g ? miloEsc(mvpTarih(g.iso)) : '') + '"></span>'; }
        }
        let sonG = kalan ? paketDersleri[kalan - 1] : null, sonIso = kalan ? (sonG ? sonG.iso : null) : p.tarihler[7];
        biletHTML = '<div class="mvp-kart mvp-paket"><div class="mvp-paket-b"><b>' + p.no + '. paket</b><span>' + (kalan ? kalan + ' ders kaldı' : 'tamamlandı') + '</span></div>'
            + '<div class="mvp-yol">' + yol + '</div>'
            + '<div class="mvp-yol-e"><span>' + (p.tarihler[0] ? miloEsc(mvpKisa(p.tarihler[0])) + ' · başladı' : '') + '</span><span>' + (sonIso ? miloEsc(mvpKisa(sonIso)) + ' · son ders' : '') + '</span></div></div>';
    }

    // ---- 📋 sekmeli kart (2026-10-27, kullanıcı: "gireceği dersleri ay olarak seçip tablo olarak görsün, girdiği dersleri de ayrıca
    // görebilsin, ödeme tablosu da olsun — 1. paketi 20.10'da ödemiş görebilsin"): Gireceği · Girdiği · Takvim · Ödemeler, ay seçmeli
    let gelecekIso = {}; paketDersleri.forEach(function (g) { gelecekIso[g.iso] = 1; });
    let digerDers = {}; gelecek.forEach(function (g) { if (!gelecekIso[g.iso]) digerDers[g.iso] = 1; });
    let odemeIso = od.sonraki && od.sonraki.tarih && od.sonraki.gun > 0 ? od.sonraki.tarih : null; // takvimde sıradaki ödeme günü
    MVP.ctx = { p: p, n: n, kalan: kalan, bugun: bugun, kayit: kayit, kayitlar: s.kayitlar || [], gelecek: gelecek, gelecekIso: gelecekIso, digerDers: digerDers, odemeIso: odemeIso, odeme: od, odemeler: s.odemeler || [] };
    if (!MVP.ay) MVP.ay = bugun.slice(0, 7); if (!MVP.sekme) MVP.sekme = 'gelecek';

    // ---- telafi
    let telafiHTML = acikHak.map(function (h) {
        let k = Math.max(0, mvpGunFark(bugun, h.bitis)), oran = Math.max(4, Math.min(100, k / 30 * 100));
        return '<div class="mvp-kart mvp-telafi"><div class="mvp-tik">🔁</div><div><b>Telafi hakkı · ' + miloEsc(mvpTarih(h.bitis)) + ' tarihine kadar</b><div class="mvp-alt">' + miloEsc(mvpTarih(h.iso)) + ' dersinde ' + (h.s === 'h' ? 'hastaydı' : h.s === 'm' ? 'haber verdi' : 'gelemedi') + '. ' + (k === 0 ? 'Son gün bugün.' : k + ' gün içinde uygun bir derse gelebilir; antrenörüne yazmanız yeterli.') + '</div><div class="mvp-bar"><i style="width:' + oran.toFixed(0) + '%"></i></div></div></div>';
    }).join('');
    let kullanilan = (s.telafiler || []).filter(function (h) { return h.durum === 'kullanildi' && h.kullanim; });
    if (!telafiHTML && kullanilan.length) telafiHTML = '<div class="mvp-not-sat">✓ ' + miloEsc(mvpTarih(kullanilan[kullanilan.length - 1].kullanim)) + ' telafi dersi yapıldı.</div>';

    // ---- bu hafta neler yaptık (Ders Günlüğü)
    let bh = s.buHafta || [], buHaftaHTML = '';
    if (bh.length) buHaftaHTML = '<div class="mvp-kart"><h4>Bu hafta neler yaptık <span>' + miloEsc(mvpTarih(bh[0].tarih)) + '</span></h4>'
        + bh.filter(function (k) { return k.konu || k.yapilanlar; }).slice(0, 2).map(function (k) { let kisa = mvpKisaCumle(k.yapilanlar); return '<div class="mvp-konu">' + (k.konu ? '<b>' + miloEsc(k.konu) + '</b>' : '') + (kisa ? '<p>' + miloEsc(kisa) + '</p>' : '') + '</div>'; }).join('') + '</div>';

    alan.innerHTML = '<div class="mvp">'
        + '<div class="mvp-logo"><img src="/milo/milo-logo.png" alt="MILO FITT KIDS"></div>' + '<div class="mvp-ust"><div><small>Merhaba</small><b>' + miloEsc(ilk) + '</b><span>' + miloEsc(s.grup) + '</span></div><div class="mvp-av-kap" id="mvp-av-kap">' + mvpAvatarHTML(s, ilk) + '</div></div>'
        + ustHTML + biletHTML + telafiHTML
        + '<div class="mvp-kart mvp-sekmeli" id="mvp-sekme">' + mvpSekmeHTML() + '</div>'
        + buHaftaHTML
        + '<div class="mvp-kart mvp-yakinda"><span class="mvp-yk-r">Yakında</span><div class="mvp-bahce"><span>🌱</span><span>🌷</span><span>🌼</span><span>🌻</span></div><b>Beceri bahçesi</b><div class="mvp-alt">' + miloEsc(ilk) + ' öğrendiği her beceriyle burada bir çiçek açacak. Çok yakında! 🐝</div></div>'
        + (s.antrenorNotu ? '<div class="mvp-kart"><h4>Antrenörün notu</h4><div class="mvp-not">' + miloEsc(s.antrenorNotu) + '</div></div>' : '')
        + '</div>';
}

function mvpCss() {
    if (document.getElementById('mvp-css')) return;
    let st = document.createElement('style'); st.id = 'mvp-css';
    st.textContent = [
        // Seçilen taslağın koyu paleti, tek turuncu vurgu
        '#milo-sporcu-app.mvp-kap{--mvp-zemin:#0e1110;--mvp-kart:#171c1a;--mvp-yukselt:#202724;--mvp-cizgi:#2b3430;--mvp-yazi:#f1f5f3;--mvp-soluk:#97a49f;--mvp-vurgu:#12c46e;--mvp-pembe:#c2186e;--mvp-sari:#f8b858;--mvp-koyu:#03261a;--mvp-gri:#2f3834;--mvp-yesil:#4ade80;--mvp-mor:#c4b5fd;--mvp-hasta:#f9a8d4;background:var(--mvp-zemin)!important;color:var(--mvp-yazi);font-family:Manrope,system-ui,sans-serif;color-scheme:dark}',
        '#milo-sporcu-app.mvp-kap>button{background:var(--mvp-kart)!important;color:var(--mvp-soluk)!important;border:0!important;box-shadow:none!important;border-radius:99px!important}',
        '.mvp{display:flex;flex-direction:column;gap:12px;padding-bottom:30px}',
        '.mvp-logo{align-self:center;background:#fff;border-radius:20px;padding:6px 14px;margin:-6px 0 2px;box-shadow:0 8px 24px rgba(0,0,0,.35)}.mvp-logo img{display:block;width:120px;height:auto}',
        '.mvp-ust{display:flex;justify-content:space-between;align-items:flex-end;margin:0 2px 2px}.mvp-ust small{color:var(--mvp-soluk);font-weight:700;font-size:13px}.mvp-ust b{display:block;font-size:32px;font-weight:800;letter-spacing:-.03em;line-height:1.05}.mvp-ust span{display:block;color:var(--mvp-soluk);font-weight:600;font-size:12.5px;margin-top:2px}',
        // 📷 avatar: yuvarlak, turuncu-pembe halka, köşede ✨ (foto yoksa kesikli halka + 📷)
        '.mvp-av-kap{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;flex:none}',
        '.mvp-av{position:relative;width:74px;height:74px;border-radius:50%;padding:3px;border:0;cursor:pointer;background:conic-gradient(from 200deg,#12c46e,#c2186e,#f8b858,#12c46e);display:grid;place-items:center;font:inherit}',
        '.mvp-av img,.mvp-av span{width:100%;height:100%;border-radius:50%;border:3px solid var(--mvp-zemin);object-fit:cover;display:grid;place-items:center;background:var(--mvp-yukselt);color:var(--mvp-vurgu);font-weight:800;font-size:26px;box-sizing:border-box}',
        '.mvp-av.bos{background:transparent;border:2px dashed rgba(18,196,110,.6)}.mvp-av.bos span{border:0}',
        '.mvp-av.foto img{animation:mvpFotoGir .5s cubic-bezier(.2,1.5,.4,1)}@keyframes mvpFotoGir{from{transform:scale(.6);opacity:0}}',
        '.mvp-av-r{position:absolute;right:-2px;bottom:-2px;width:26px;height:26px;border-radius:50%;background:var(--mvp-kart);display:grid;place-items:center;font-style:normal;font-size:14px;box-shadow:0 0 0 2px var(--mvp-zemin)}',
        '.mvp-av.foto .mvp-av-r{animation:mvpZipla 2.4s ease-in-out infinite}@keyframes mvpZipla{0%,80%,100%{transform:none}88%{transform:translateY(-4px) rotate(12deg)}}',
        '.mvp-av-ip{font-size:11px;font-weight:800;color:var(--mvp-vurgu)}',
        '.mvp-foto-menu{position:absolute;top:84px;right:0;z-index:5;display:flex;flex-direction:column;min-width:180px;background:var(--mvp-yukselt);border:1px solid var(--mvp-cizgi);border-radius:14px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.45)}',
        '.mvp-foto-menu button{border:0;background:transparent;color:var(--mvp-yazi);font:inherit;font-weight:700;font-size:14px;text-align:left;padding:12px 14px;cursor:pointer}.mvp-foto-menu button+button{border-top:1px solid var(--mvp-cizgi)}',
        '.mvp-konfeti{position:absolute;left:50%;top:37px;font-style:normal;font-size:18px;pointer-events:none;animation:mvpKonfeti 1.2s ease-out forwards}',
        '@keyframes mvpKonfeti{from{transform:translate(-50%,-50%) rotate(var(--a)) translateY(0) scale(.4);opacity:1}to{transform:translate(-50%,-50%) rotate(var(--a)) translateY(-70px) scale(1.2);opacity:0}}',
        '.mvp-kart{background:var(--mvp-kart);border-radius:20px;padding:16px}',
        '.mvp h4{margin:0 0 10px;font-size:14.5px;font-weight:800;display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}.mvp h4 span{color:var(--mvp-soluk);font-size:12px;font-weight:700}',
        '.mvp-alt{color:var(--mvp-soluk);font-size:12.5px;font-weight:600;line-height:1.45}',
        '.mvp-cip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;padding:5px 10px;border-radius:99px;background:var(--mvp-yukselt);color:var(--mvp-yazi)}.mvp-cip.yesil{color:var(--mvp-yesil);background:rgba(74,222,128,.1)}.mvp-cip.mor{color:var(--mvp-mor);background:rgba(196,181,253,.12)}',
        '.mvp-rozetler{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
        // üst: ödeme geri sayımı
        '.mvp-hero{background:var(--mvp-kart);border-radius:24px;padding:16px;display:grid;grid-template-columns:118px minmax(0,1fr);gap:14px;align-items:center}',
        '.mvp-hero.bek{box-shadow:inset 0 0 0 2px rgba(250,204,21,.45)}',
        '.mvp-halka{position:relative;width:118px;height:118px}.mvp-halka svg{width:100%;height:100%;transform:rotate(-90deg)}',
        '.mvp-halka-d{animation:mvpHalka 1s .1s cubic-bezier(.2,.8,.2,1) backwards}@keyframes mvpHalka{from{stroke-dasharray:0 var(--c)}}',
        '.mvp-orta{position:absolute;inset:0;display:grid;place-items:center;text-align:center}.mvp-orta b{font-size:30px;font-weight:800;line-height:1}.mvp-orta small{display:block;font-size:10.5px;font-weight:800;color:var(--mvp-soluk);margin-top:3px}',
        '.mvp-hero-m{min-width:0}.mvp-hero h3{margin:0 0 4px;font-size:16px;font-weight:800}.mvp-hero p{margin:0;color:var(--mvp-soluk);font-size:12.5px;font-weight:600;line-height:1.45}',
        // nokta yolu (paketin 8 dersi)
        '.mvp-paket-b{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.mvp-paket-b b{font-size:14.5px;font-weight:800}.mvp-paket-b span{color:var(--mvp-soluk);font-size:12px;font-weight:700}',
        '.mvp-yol{display:flex;align-items:center;margin:14px 2px 8px}',
        '.mvp-nk{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11.5px;font-weight:800;flex:none;animation:mvpDelik .35s backwards}',
        '.mvp-nk.g,.mvp-nk.t{background:var(--mvp-vurgu);color:var(--mvp-koyu)}.mvp-nk.y{background:var(--mvp-gri);color:var(--mvp-soluk)}.mvp-nk.m{background:var(--mvp-mor);font-size:11px}.mvp-nk.h{background:var(--mvp-hasta);font-size:11px}',
        '.mvp-nk.s{width:20px;height:20px;border:2px dashed var(--mvp-sari);box-sizing:border-box}',
        '.mvp-cz{flex:1;height:2px;background:var(--mvp-cizgi);min-width:4px}.mvp-cz.d{background:var(--mvp-vurgu)}',
        '.mvp-yol-e{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:700;color:var(--mvp-soluk)}',
        '@keyframes mvpDelik{from{transform:scale(.6);opacity:0}}',
        // telafi
        '.mvp-telafi{display:flex;gap:12px;align-items:flex-start}.mvp-tik{width:40px;height:40px;border-radius:12px;background:rgba(196,181,253,.12);display:grid;place-items:center;font-size:19px;flex:none}',
        '.mvp-telafi b{font-size:14px;font-weight:800;display:block;margin-bottom:2px}.mvp-telafi>div:last-child{flex:1;min-width:0}',
        '.mvp-bar{height:6px;border-radius:99px;background:var(--mvp-cizgi);margin-top:8px;overflow:hidden}.mvp-bar i{display:block;height:100%;background:var(--mvp-mor);border-radius:99px}',
        '.mvp-not-sat{color:var(--mvp-soluk);font-size:12.5px;font-weight:700;padding:0 4px}',
        // dersler
        '.mvp-dersler{display:flex;flex-direction:column}.mvp-d{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--mvp-cizgi)}.mvp-d:first-child{border-top:0}',
        '.mvp-dg{text-align:center;line-height:1.05}.mvp-dg small{display:block;font-size:10px;font-weight:800;color:var(--mvp-vurgu);text-transform:uppercase}.mvp-dg b{font-size:17px;font-weight:800}',
        '.mvp-dm{min-width:0}.mvp-dm b{display:block;font-size:13.5px;font-weight:700}.mvp-dm small{color:var(--mvp-soluk);font-size:12px;font-weight:600}',
        '.mvp-e{font-size:12px;font-weight:800;padding:4px 9px;border-radius:99px;white-space:nowrap}.mvp-e.s{color:var(--mvp-vurgu);background:rgba(18,196,110,.12)}.mvp-e.son{color:var(--mvp-koyu);background:var(--mvp-vurgu)}.mvp-e.y{color:var(--mvp-yazi);background:var(--mvp-yukselt)}',
        // 📋 sekmeli kart: sekmeler, ay seçici, tablolar
        '.mvp-sekmeler{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:4px;border-radius:14px;background:var(--mvp-yukselt);margin-bottom:12px}',
        '.mvp-sekmeler button{border:0;border-radius:10px;background:transparent;color:var(--mvp-soluk);font:inherit;font-weight:800;font-size:12.5px;padding:9px 2px;cursor:pointer;min-height:38px}.mvp-sekmeler button.on{background:var(--mvp-vurgu);color:var(--mvp-koyu)}',
        '.mvp-aynav{display:flex;align-items:center;justify-content:space-between;margin:0 2px 10px}.mvp-aynav b{font-size:15px;font-weight:800}',
        '.mvp-aynav button{width:38px;height:38px;border-radius:12px;border:0;background:var(--mvp-yukselt);color:var(--mvp-yazi);font-size:20px;font-weight:800;cursor:pointer}.mvp-aynav button:disabled{opacity:.3;cursor:default}',
        '.mvp-tablo{width:100%;border-collapse:collapse;font-size:13px}.mvp-tablo th{text-align:left;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--mvp-soluk);padding:0 6px 8px}',
        '.mvp-tablo td{padding:9px 6px;border-top:1px solid var(--mvp-cizgi);vertical-align:middle;font-weight:600}.mvp-tablo td b{display:block;font-size:13.5px;font-weight:800}.mvp-tablo td small{display:block;color:var(--mvp-soluk);font-size:11.5px;font-weight:600;margin-top:2px}',
        '.mvp-tablo tr.sonraki td{background:rgba(194,24,110,.12)}.mvp-tablo tr.sonraki td:first-child{border-radius:10px 0 0 10px}.mvp-tablo tr.sonraki td:last-child{border-radius:0 10px 10px 0}',
        '.mvp-tablo tr.yeni td{background:rgba(248,184,88,.07)}.mvp-tablo .mvp-e{font-size:11px;padding:3px 7px;margin-left:2px;display:inline-block}',
        '.mvp-dr{display:inline-block;font-size:12px;font-weight:800;padding:3px 8px;border-radius:99px;background:var(--mvp-yukselt);white-space:nowrap}',
        '.mvp-dr.d-g,.mvp-dr.d-t{color:var(--mvp-yesil);background:rgba(74,222,128,.1)}.mvp-dr.d-m{color:var(--mvp-mor);background:rgba(196,181,253,.12)}.mvp-dr.d-h{color:var(--mvp-hasta);background:rgba(249,168,212,.12)}.mvp-dr.d-y{color:var(--mvp-soluk)}.mvp-dr.d-bek{color:var(--mvp-sari);background:rgba(248,184,88,.12)}',
        '.mvp-ozet{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}.mvp-ozet span{font-size:12px;font-weight:800;padding:4px 9px;border-radius:99px;background:var(--mvp-yukselt)}',
        '.mvp-bos{color:var(--mvp-soluk);font-size:13px;font-weight:600;padding:14px 4px;text-align:center}',
        // takvim
        '.mvp-takvim{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;text-align:center}.mvp-tb{font-size:10.5px;font-weight:800;color:var(--mvp-soluk)}',
        '.mvp-tg{aspect-ratio:1;border-radius:10px;display:grid;place-items:center;font-size:12.5px;font-weight:700;color:#5d554e}',
        '.mvp-tg.ders{color:var(--mvp-yazi);background:var(--mvp-yukselt)}.mvp-tg.geldi{background:var(--mvp-yesil);color:#052e16}.mvp-tg.haber{background:var(--mvp-mor);color:#2e1065}.mvp-tg.hasta{background:var(--mvp-hasta);color:#500724}',
        '.mvp-tg.yok{background:var(--mvp-gri);color:#b5aba2;text-decoration:line-through}.mvp-tg.gelecek{box-shadow:inset 0 0 0 2px var(--mvp-sari);color:var(--mvp-sari)}.mvp-tg.odeme{background:var(--mvp-pembe);color:#fff}.mvp-tg.bugun{outline:2px solid var(--mvp-yazi);outline-offset:1px}',
        '.mvp-lejant{display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:12px;font-size:11.5px;font-weight:700;color:var(--mvp-soluk)}.mvp-lejant i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}',
        '.mvp-lejant i.geldi{background:var(--mvp-yesil)}.mvp-lejant i.haber{background:var(--mvp-mor)}.mvp-lejant i.hasta{background:var(--mvp-hasta)}.mvp-lejant i.yok{background:var(--mvp-gri)}.mvp-lejant i.gelecek{box-shadow:inset 0 0 0 2px var(--mvp-sari)}.mvp-lejant i.odeme{background:var(--mvp-pembe)}',
        // bu hafta
        '.mvp-konu b{display:block;font-size:14.5px;font-weight:800}.mvp-konu p{margin:3px 0 0;color:var(--mvp-soluk);font-size:13px;font-weight:600;line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.mvp-konu+.mvp-konu{margin-top:10px}',
        // 🌱 beceri bahçesi · yakında
        '.mvp-yakinda{position:relative;overflow:hidden;background:linear-gradient(160deg,#1b2a1f,#171513 60%);border:1px dashed #3b5a43}',
        '.mvp-bahce{display:flex;gap:6px;font-size:26px;margin:2px 0 8px}.mvp-bahce span{display:inline-block;animation:mvpSalla 2.6s ease-in-out infinite;transform-origin:bottom center}',
        '.mvp-bahce span:nth-child(2){animation-delay:.4s}.mvp-bahce span:nth-child(3){animation-delay:.8s;opacity:.45}.mvp-bahce span:nth-child(4){animation-delay:1.2s;opacity:.25}@keyframes mvpSalla{50%{transform:rotate(-8deg) scale(1.06)}}',
        '.mvp-yakinda b{font-size:15px;font-weight:800}.mvp-yk-r{position:absolute;right:14px;top:14px;font-size:11px;font-weight:800;color:#86efac;background:rgba(134,239,172,.12);padding:4px 9px;border-radius:99px}',
        '.mvp-not{font-size:13.5px;line-height:1.55;font-weight:600;white-space:pre-line}',
        '@media (max-width:360px){.mvp-hero{grid-template-columns:100px minmax(0,1fr)}.mvp-halka{width:100px;height:100px}.mvp-nk{width:21px;height:21px}}',
        '@media (prefers-reduced-motion:reduce){.mvp-halka-d,.mvp-nk,.mvp-bahce span,.mvp-av img,.mvp-av-r,.mvp-konfeti{animation:none}.mvp-konfeti{display:none}}'
    ].join('\n');
    document.head.appendChild(st);
}
