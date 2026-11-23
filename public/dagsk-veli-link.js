/* ================================================================================================
   💌 VELİLERE GÖNDER (v456, 2026-11-23) — Yönetici'de ayrı ekran. Kullanıcı: "sıradaki veliye gönder; eksik numarayı anında aynı yerde aç-kapa
   düzelteyim; geri dön sporcu seç değil, yana kaydırmalı / bir sonraki sporcu; ayrı ve dikkat çeken yer; linke girenler, göndermediklerimiz
   gibi süzme." Bir kart = bir veli (aynı telefondaki kardeşler tek kart, tek mesaj). Yana kaydır ya da ‹ › ile geç; gönderince
   WhatsApp açılır, kart "gönderildi" olur, dönünce sıradaki gönderilmemiş karta geçer (Geri al var).
   Durum sunucuda (/api/veli-link, src/routes/veliLink.ts): gönderildi · açtı (veli sayfayı açtı) · girdi (telefonunu doğruladı).
   Süzgeç seçilince sıra sabitlenir: gönderilen kart sıradan düşmez, geri kaydırınca görülür. Tutar hiçbir mesajda yazmaz.
   ================================================================================================ */
(function () {
    const VG = window.VG = { kayit: null, hata: null, suz: 'yeni', sira: null, i: 0, duzen: false, mesajAcik: false, liste: false, ara: '', mesaj: {}, sonGiden: null, bekle: false, yuk: null };
    const GRUP = { buyukler: 'Büyükler', yildizlar: 'Yıldızlar', kucukler: 'Küçükler', minikler: 'Minikler' };
    const TUR = [['ikisi', 'Ödeme + devam'], ['odeme', 'Yalnız ödeme'], ['hatirlat', 'Aidat hatırlat']];
    let tur = 'ikisi'; try { let t = localStorage.getItem('dag_vg_tur'); if (TUR.some(x => x[0] === t)) tur = t; } catch (e) {}
    const E = s => esc(String(s == null ? '' : s)), ilkAd = ad => aidatIlkAd(ad);
    const numara = t => { let n = telefonWaFormat(t || ''); return /^90\d{10}$/.test(n) ? n : ''; };
    const guzelTel = t => { let n = numara(t); return n ? '0' + n.slice(2, 5) + ' ' + n.slice(5, 8) + ' ' + n.slice(8, 10) + ' ' + n.slice(10) : t || ''; };
    const ne = t => { let g = Math.floor((Date.now() - t) / 864e5); return g <= 0 ? 'bugün' : g === 1 ? 'dün' : g + ' gün önce'; };
    const ag = (yol, o) => fetch(yol, o).then(r => r.ok ? r.json() : Promise.reject(r.status));
    const gonder = (yol, b) => ag(yol, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) });

    // ---------------- veri
    function yukle() {
        if (VG.yuk) return VG.yuk;
        VG.yuk = ag('/api/veli-link').then(d => { let k = {}; (d.kayit || []).forEach(x => { k[x.grup + '|' + x.ad] = x; }); VG.kayit = k; VG.hata = null; }).catch(e => { VG.hata = e === 401 ? 'oturum' : 'ag'; }).then(() => { VG.yuk = null; });
        return VG.yuk;
    }
    const kayitAl = u => (VG.kayit || {})[u.id] || {};
    // bir veli = aynı numaradaki çocuklar; numarası olmayan her çocuk kendi kartı
    function aileler() {
        let m = {}, l = [];
        Object.keys(GRUP).forEach(g => Object.keys(turnuvaDB[g] || {}).forEach(ad => {
            let sp = turnuvaDB[g][ad]; if (!sp || sp.pasif || sp.donduruldu || yonKisiTuru(g, ad) !== 'sporcu') return;
            let u = { id: g + '|' + ad, g, ad, sp, muaf: !!sp.aidatMuaf }, n = numara(sp.acilTelefon) || numara(sp.veli2Telefon), a = n ? 't:' + n : 'y:' + u.id;
            if (!m[a]) { m[a] = { tel: n, cocuk: [], veli: '' }; l.push(m[a]); }
            m[a].cocuk.push(u); if (!m[a].veli && sp.acilKisi) m[a].veli = sp.acilKisi;
        }));
        l.forEach(f => { f.id = f.cocuk[0].id; });
        return l.sort((x, y) => x.cocuk[0].ad.localeCompare(y.cocuk[0].ad, 'tr'));
    }
    let borclu = null;
    function borcSeti() { if (borclu) return borclu; borclu = {}; try { if (typeof apOzet === 'function' && Object.keys(aidatDB || {}).length) apOzet(aidatPanelAdaptor()).bek.forEach(s => { borclu[s.k.id] = 1; }); } catch (e) {} return borclu; }
    function durum(f) {
        let k = f.cocuk.map(kayitAl), en = a => Math.max(0, ...k.map(x => x[a] || 0)), g = k.length && k.every(x => x.gonderildi) ? en('gonderildi') : 0;
        return { gonderildi: g, kim: (k.find(x => x.gonderen) || {}).gonderen || '', acildi: en('acildi'), giris: en('giris'), borc: f.cocuk.some(u => borcSeti()[u.id]), tel: !!f.tel };
    }
    const SUZ = [['yeni', 'Gönderilmedi', (f, d) => d.tel && !d.gonderildi], ['acmadi', 'Gitti, açmadı', (f, d) => d.gonderildi && !(d.acildi > 0)], ['acti', 'Linke girdi', (f, d) => d.acildi > 0 || d.giris > 0], ['telsiz', 'Numara yok', (f, d) => !d.tel], ['borc', 'Ödemeyen', (f, d) => d.borc], ['hepsi', 'Hepsi', () => true]];
    const suzIsle = (s, l) => { let f = (SUZ.find(x => x[0] === s) || SUZ[0])[2]; return l.filter(x => f(x, durum(x))); };
    function sayilar(l) { let o = {}; SUZ.forEach(s => { o[s[0]] = 0; }); l.forEach(f => { let d = durum(f); SUZ.forEach(s => { if (s[2](f, d)) o[s[0]]++; }); }); return o; }
    // Menü rozeti / Genel Bakış bandı için: { telli, giden, acan, telsiz, kalan } — veri yoksa null (uydurulmaz)
    window.vgOzet = function () { if (!VG.kayit) return null; let l = aileler(), s = sayilar(l), telli = l.length - s.telsiz; return { telli, kalan: s.yeni, giden: telli - s.yeni, acan: s.acti, telsiz: s.telsiz, acmadi: s.acmadi }; };
    window.vgYukle = yukle;

    // ---------------- mesaj
    function mesajYaz(f) {
        let kok = location.origin, ay = bugunISO().slice(0, 7), kod = u => kayitAl(u).kod || '…', s = [], tek = f.cocuk.length === 1;
        let odeme = u => kok + '/veli.html?kod=' + kod(u), rapor = u => kok + '/rapor.html?kod=' + kod(u) + '&ay=' + ay, adlar = f.cocuk.map(u => ilkAd(u.ad)).join(' ve ');
        if (tur === 'hatirlat') {
            let b = f.cocuk.filter(u => borcSeti()[u.id] && !u.muaf), c = b.length ? b : f.cocuk.filter(u => !u.muaf), n = c.map(u => ilkAd(u.ad)).join(' ve ');
            s.push('Merhaba, DAĞ Spor Kulübü', '', n + ' için ' + aidatAyAdUzun(ay) + ' aidatı kaydımızda görünmüyor. Ödediyseniz yazmanız yeterli, hemen düzeltelim.', '', 'Ayrıntı:');
            c.forEach(u => s.push((c.length > 1 ? ilkAd(u.ad) + ': ' : '') + odeme(u)));
            s.push('(Girişte bu telefonun son 4 hanesi sorulur.)', '', 'Teşekkürler 🧡');
        } else {
            let od = f.cocuk.filter(u => !u.muaf);
            s.push('Merhaba 🌟 DAĞ Spor Kulübü', '', adlar + ' için ' + (tur === 'odeme' ? 'ödemeleri' : od.length ? 'ödemeleri ve devamı' : 'devam ve gelişimi') + ' artık buradan görebilirsiniz:', '');
            if (od.length) { s.push('💳 Ödemeler'); od.forEach(u => s.push((tek ? '' : ilkAd(u.ad) + ': ') + odeme(u))); s.push('(Girişte bu telefonun son 4 hanesi sorulur.)', ''); }
            if (tur === 'ikisi' || !od.length) { s.push('📊 Devam ve gelişim'); f.cocuk.forEach(u => s.push((tek ? '' : ilkAd(u.ad) + ': ') + rapor(u))); s.push(''); }
            s.push('Linkler size özeldir. Görüşmek üzere 🧡');
        }
        return s.join('\n');
    }
    const mesaj = f => VG.mesaj[f.id + '|' + tur] || mesajYaz(f);
    const gonderilir = f => tur === 'ikisi' || f.cocuk.some(u => !u.muaf);
    // link kodu olmayan çocuk için kod alınır (kart açılınca; WhatsApp düğmesi hazır bağlantı olur, boş sekme açılmaz)
    const istenen = {};
    function kodHazirla(f) {
        let eksik = f.cocuk.filter(u => !kayitAl(u).kod && !istenen[u.id]); if (!eksik.length || !f.tel) return;
        Promise.all(eksik.map(u => { istenen[u.id] = 1; return gonder('/api/athletes/' + encodeURIComponent(u.g) + '/' + encodeURIComponent(u.ad) + '/izle-kodu', {}).then(d => { if (d && d.kod) VG.kayit[u.id] = Object.assign({ grup: u.g, ad: u.ad }, VG.kayit[u.id], { kod: d.kod }); }).catch(() => { setTimeout(() => { delete istenen[u.id]; }, 4000); }); }))
            .then(() => { let s = simdiki(); if (s && s.id === f.id && !yaziliyor()) kartCiz(); });
    }
    const yaziliyor = () => { let a = document.activeElement; return !!(a && a.closest && a.closest('#vg-kart') && /INPUT|TEXTAREA/.test(a.tagName)); };

    // ---------------- sıra
    const bulAile = id => { let l = aileler(); return l.find(f => f.cocuk.some(u => u.id === id)); };
    function siraKur(s, id) { VG.suz = s; VG.sira = suzIsle(s, aileler()).map(f => f.id); VG.i = Math.max(0, id ? VG.sira.indexOf(id) : 0); VG.duzen = false; VG.mesajAcik = false; }
    const simdiki = () => VG.sira && VG.sira.length ? bulAile(VG.sira[VG.i]) : null;

    // ---------------- çizim
    window.vgAc = function () {
        css(); let el = document.getElementById('yonetici-liste'); if (!el) return;
        borclu = null; VG.duzen = false; VG.mesajAcik = false; VG.liste = false; VG.ara = ''; VG.sonGiden = null;
        el.innerHTML = '<div class="vg" id="vg"><div class="vg-bos">Yükleniyor…</div></div>';
        yukle().then(() => { if (!document.getElementById('vg')) return; if (VG.kayit) { let l = aileler(); siraKur(suzIsle('yeni', l).length ? 'yeni' : suzIsle('telsiz', l).length ? 'telsiz' : 'hepsi'); } ciz(); try { yoneticiNavCiz(); } catch (e) {} });
    };
    function ciz() {
        let el = document.getElementById('vg'); if (!el) return;
        if (!VG.kayit) { el.innerHTML = VG.hata === 'oturum' ? '<div class="vg-bos">🔑 Oturum kapanmış. Giriş yapınca bu ekran açılır.<br><button type="button" class="vg-d ana" onclick="yoneticiPaneliKapat(); yoneticiGirisIste()">Giriş yap</button></div>' : '<div class="vg-bos">Liste alınamadı. Bağlantını kontrol et.<br><button type="button" class="vg-d ana" onclick="vgAc()">Yeniden dene</button></div>'; return; }
        let l = aileler(), s = sayilar(l), telli = l.length - s.telsiz, giden = telli - s.yeni, acan = s.acti;
        el.innerHTML = '<header class="vg-ust"><div><h2>Velilere gönder ' + (typeof yeniRozet === 'function' ? yeniRozet() : '') + '</h2><p><b>' + giden + '</b> / ' + telli + ' veliye gitti, <b>' + acan + '</b> veli linke girdi</p></div><button type="button" class="vg-d" aria-pressed="' + VG.liste + '" onclick="VG.liste=!VG.liste; vgCiz()">' + (VG.liste ? 'Kartlar' : 'Liste') + '</button></header>'
            + '<div class="vg-cub" role="img" aria-label="' + giden + ' / ' + telli + ' gönderildi"><i style="width:' + (telli ? giden / telli * 100 : 0) + '%"></i></div>'
            + '<div class="vg-suz" role="group" aria-label="Süzgeç">' + SUZ.filter(x => x[0] !== 'borc' || s.borc).map(x => '<button type="button" aria-pressed="' + (VG.suz === x[0]) + '" onclick="vgSuz(\'' + x[0] + '\')">' + x[1] + ' <b>' + s[x[0]] + '</b></button>').join('') + '</div>'
            + (VG.liste ? listeHTML(l) : '<div id="vg-kart-kap">' + kartHTML() + '</div>');
        if (!VG.liste) kartBagla();
    }
    window.vgCiz = ciz;
    const etiket = d => !d.tel ? '<i class="vg-e y">numara yok</i>' : d.giris ? '<i class="vg-e a">✓ ödeme ekranına girdi · ' + ne(d.giris) + '</i>' : d.acildi ? '<i class="vg-e a">✓ linke girdi · ' + ne(d.acildi) + '</i>' : d.gonderildi ? '<i class="vg-e g">gönderildi · ' + ne(d.gonderildi) + (d.kim ? ' · ' + E(d.kim) : '') + '</i>' : '<i class="vg-e">gönderilmedi</i>';
    function kartHTML() {
        let f = simdiki(), top = VG.sira ? VG.sira.length : 0, geri = VG.sonGiden ? '<div class="vg-geri"><span>✓ ' + E(VG.sonGiden.ad) + ' gönderildi işaretlendi</span><button type="button" onclick="vgGeriAl()">Gitmedi, geri al</button></div>' : '';
        if (!f) { let ad = (SUZ.find(x => x[0] === VG.suz) || [])[1]; return geri + '<div class="vg-bos"><b>' + (VG.suz === 'yeni' ? 'Numarası olan bütün velilere gitti 🎉' : '“' + ad + '” listesinde kimse yok') + '</b><br>Yukarıdan başka bir liste seç.</div>'; }
        kodHazirla(f);
        let d = durum(f), n = f.cocuk.length, hazir = f.cocuk.every(u => kayitAl(u).kod), duzen = VG.duzen || !f.tel, uygun = gonderilir(f);
        let cocuk = f.cocuk.map(u => '<button type="button" class="vg-cocuk" onclick="sporcuProfilAc(' + escQ(u.id) + ')">' + (typeof fotoAvatarHTML === 'function' ? fotoAvatarHTML(fotoAnahtar(u.g, u.ad), u.ad, 'vg-av', true) : '') + '<span><b>' + E(u.ad) + '</b><small>' + GRUP[u.g] + (u.muaf ? ' · muaf' : '') + (borcSeti()[u.id] ? ' · <em>bu ay ödemedi</em>' : '') + '</small></span></button>').join('');
        let wa = f.tel ? (!uygun ? '<button type="button" class="vg-wa" disabled>Muaf: ödeme mesajı gitmez</button>' : hazir ? '<a class="vg-wa" id="vg-wa" target="_blank" rel="noopener" href="https://api.whatsapp.com/send?phone=' + f.tel + '&amp;text=' + encodeURIComponent(mesaj(f)) + '" onclick="vgGitti()">' + WA + (d.gonderildi ? 'Tekrar gönder' : 'WhatsApp’ta gönder') + '</a>' : '<button type="button" class="vg-wa" disabled>Link hazırlanıyor…</button>') : '<button type="button" class="vg-wa" disabled>Önce numarayı yaz</button>';
        return geri + '<div class="vg-kart" id="vg-kart" data-id="' + E(f.id) + '"><div class="vg-k-ust"><div><small>Veli</small><strong>' + E(f.veli || 'Veli adı yazılmamış') + '</strong></div>' + etiket(d) + '</div>'
            + '<div class="vg-cocuklar">' + cocuk + '</div>' + (n > 1 ? '<p class="vg-not">Aynı numara: ' + n + ' kardeş, tek mesaj.</p>' : '')
            + '<button type="button" class="vg-tel' + (f.tel ? '' : ' yok') + '" aria-expanded="' + duzen + '" onclick="vgDuzen()"><span>' + (f.tel ? E(guzelTel(f.tel)) : 'Telefon numarası yok') + '</span><em>' + (duzen ? 'Kapat ▴' : 'Düzelt ▾') + '</em></button>'
            + (duzen ? '<div class="vg-form" id="vg-form"><label>Veli telefonu<input id="vg-tel" type="tel" inputmode="tel" autocomplete="off" placeholder="05xx xxx xx xx" value="' + E(guzelTel(f.cocuk[0].sp.acilTelefon || f.cocuk[0].sp.veli2Telefon || '')) + '" onkeydown="if(event.key===\'Enter\') vgTelKaydet()"></label><label>Veli adı<input id="vg-veli" type="text" autocomplete="off" maxlength="60" value="' + E(f.veli) + '" onkeydown="if(event.key===\'Enter\') vgTelKaydet()"></label><p class="vg-hata" id="vg-hata" role="alert"></p><button type="button" class="vg-d ana" onclick="vgTelKaydet()">Kaydet' + (n > 1 ? ' (' + n + ' kardeş)' : '') + '</button></div>' : '')
            + (f.tel ? '<div class="vg-tur" role="group" aria-label="Mesaj türü">' + TUR.map(x => '<button type="button" aria-pressed="' + (tur === x[0]) + '" onclick="vgTur(\'' + x[0] + '\')">' + x[1] + '</button>').join('') + '</div><button type="button" class="vg-ac" aria-expanded="' + VG.mesajAcik + '" onclick="VG.mesajAcik=!VG.mesajAcik; vgKart()">' + (VG.mesajAcik ? 'Mesajı kapat ▴' : 'Mesajı gör ve değiştir ▾') + '</button>' + (VG.mesajAcik ? '<textarea id="vg-mesaj" rows="10" aria-label="Mesaj" oninput="vgMesaj(this.value)">' + E(mesaj(f)) + '</textarea>' : '') : '') + '</div>'
            + '<div class="vg-gec"><button type="button" aria-label="Önceki veli" onclick="vgGec(-1)"' + (VG.i <= 0 ? ' disabled' : '') + '>‹</button>' + wa + '<button type="button" aria-label="Sonraki veli" onclick="vgGec(1)"' + (VG.i >= top - 1 ? ' disabled' : '') + '>›</button><span>' + (VG.i + 1) + ' / ' + top + ' · yana kaydır</span></div>';
    }
    const WA = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="M4 20l1.3-4A8 8 0 1 1 8.2 18.8zM9 9.2c.2 2.8 2.9 5.4 5.7 5.7"/></svg>';
    function kartCiz(yon) { let k = document.getElementById('vg-kart-kap'); if (!k) return; k.innerHTML = kartHTML(); kartBagla(); let c = document.getElementById('vg-kart'); if (yon && c) c.classList.add(yon > 0 ? 'sagdan' : 'soldan'); }
    window.vgKart = () => kartCiz();
    function listeHTML(l) {
        let q = turkceNormalize(VG.ara || ''), a = suzIsle(VG.suz, l).filter(f => !q || turkceNormalize(f.cocuk.map(u => u.ad).join(' ') + ' ' + f.veli).includes(q));
        return '<input type="search" class="vg-ara" id="vg-ara" placeholder="Sporcu ya da veli ara" aria-label="Sporcu ya da veli ara" value="' + E(VG.ara) + '" oninput="vgAra(this.value)"><div class="vg-liste">' + (a.length ? a.map(f => '<button type="button" onclick="vgSec(' + escQ(f.id) + ')"><span><b>' + f.cocuk.map(u => E(u.ad)).join(' · ') + '</b><small>' + E(f.veli || '') + (f.tel ? (f.veli ? ' · ' : '') + E(guzelTel(f.tel)) : '') + '</small></span>' + etiket(durum(f)) + '</button>').join('') : '<div class="vg-bos">Kimse yok.</div>') + '</div>';
    }
    // ---------------- dokunma
    window.vgSuz = s => { siraKur(s); VG.sonGiden = null; ciz(); };
    window.vgSec = id => { VG.sira = suzIsle(VG.suz, aileler()).map(f => f.id); VG.i = Math.max(0, VG.sira.indexOf(id)); VG.liste = false; VG.duzen = false; VG.mesajAcik = false; ciz(); };
    window.vgAra = q => { VG.ara = q; clearTimeout(VG.z); VG.z = setTimeout(() => { ciz(); let e = document.getElementById('vg-ara'); if (e) { e.focus(); e.setSelectionRange(q.length, q.length); } }, 160); };
    window.vgGec = yon => { let y = VG.i + yon; if (!VG.sira || y < 0 || y >= VG.sira.length) return; VG.i = y; VG.duzen = false; VG.mesajAcik = false; kartCiz(yon); };
    window.vgTur = t => { tur = t; try { localStorage.setItem('dag_vg_tur', t); } catch (e) {} kartCiz(); };
    window.vgDuzen = () => { let f = simdiki(); if (!f) return; if (!f.tel) { let e = document.getElementById('vg-tel'); if (e) e.focus(); return; } VG.duzen = !VG.duzen; kartCiz(); if (VG.duzen) { let e = document.getElementById('vg-tel'); if (e) e.focus(); } };
    window.vgMesaj = v => { let f = simdiki(); if (!f) return; VG.mesaj[f.id + '|' + tur] = v; let a = document.getElementById('vg-wa'); if (a) a.href = 'https://api.whatsapp.com/send?phone=' + f.tel + '&text=' + encodeURIComponent(v); };
    // WhatsApp'a gidildi: işaretle; uygulamaya dönünce sıradaki gönderilmemiş karta geç
    window.vgGitti = function () {
        let f = simdiki(); if (!f) return; let kodlar = f.cocuk.map(u => kayitAl(u).kod).filter(Boolean), t = Date.now(), once = f.cocuk.map(u => [u.id, kayitAl(u).gonderildi || null]);
        f.cocuk.forEach(u => { let k = VG.kayit[u.id]; if (k) { k.gonderildi = t; k.gonderen = (typeof _oturum !== 'undefined' && _oturum && _oturum.ad) || null; } });
        VG.sonGiden = { ad: f.cocuk.map(u => ilkAd(u.ad)).join(' ve '), kodlar, once, id: f.id };
        VG.bekle = true;
        gonder('/api/veli-link/gonderildi', { kodlar, tur }).catch(() => { showToast('“Gönderildi” işareti kaydedilemedi, bağlantını kontrol et.', 'warning'); });
        setTimeout(() => { if (VG.bekle && !document.hidden && !matchMedia('(pointer:coarse)').matches) ilerle(); }, 900); // bilgisayarda sekme değişmeyebilir
    };
    function ilerle() {
        if (!VG.bekle || !document.getElementById('vg')) return; VG.bekle = false;
        for (let j = VG.i + 1; j < VG.sira.length; j++) { let f = bulAile(VG.sira[j]), d = f && durum(f); if (f && d.tel && (!d.gonderildi || VG.suz !== 'yeni')) { VG.i = j; VG.duzen = false; VG.mesajAcik = false; ciz(); let c = document.getElementById('vg-kart'); if (c) c.classList.add('sagdan'); try { yoneticiNavCiz(); } catch (e) {} return; } }
        if (VG.suz === 'yeni') siraKur('yeni'); ciz(); try { yoneticiNavCiz(); } catch (e) {}
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(ilerle, 250); });
    window.addEventListener('focus', () => setTimeout(ilerle, 250));
    window.vgGeriAl = function () {
        let s = VG.sonGiden; if (!s) return; s.once.forEach(([id, t]) => { let k = VG.kayit[id]; if (k) k.gonderildi = t; }); VG.sonGiden = null; VG.bekle = false;
        gonder('/api/veli-link/gonderildi', { kodlar: s.kodlar, geri: true }).catch(() => showToast('Geri alma kaydedilemedi, bağlantını kontrol et.', 'warning'));
        if (VG.sira.indexOf(s.id) < 0) VG.sira.unshift(s.id); VG.i = VG.sira.indexOf(s.id); ciz();
    };
    window.vgTelKaydet = async function () {
        let f = simdiki(); if (!f) return; let ham = (document.getElementById('vg-tel') || {}).value || '', veli = ((document.getElementById('vg-veli') || {}).value || '').trim(), n = numara(ham), h = document.getElementById('vg-hata');
        if (!n || n[2] !== '5') { if (h) h.textContent = 'Numara eksik ya da hatalı. 05 ile başlayan 11 hane yaz.'; return; }
        let tel = '+' + n.slice(0, 2) + ' ' + n.slice(2, 5) + ' ' + n.slice(5, 8) + ' ' + n.slice(8, 10) + ' ' + n.slice(10), idler = f.cocuk.map(u => u.id), z = Date.now();
        f.cocuk.forEach(u => { let sp = turnuvaDB[u.g][u.ad]; sp.acilTelefon = tel; if (veli) sp.acilKisi = veli; sp.lastModified = z; });
        bekleyenGonderim = true; try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
        // veli linke hemen girebilsin: numara sunucuya da doğrudan yazılır (senkron beklenmez)
        let sonuc = await Promise.all(f.cocuk.map(u => fetch('/api/athletes/' + encodeURIComponent(u.g) + '/' + encodeURIComponent(u.ad), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: Object.assign({ acilTelefon: tel }, veli ? { acilKisi: veli } : {}), lastModified: z }) }).then(r => r.ok).catch(() => false)));
        VG.duzen = false; VG.mesaj = {};
        // numara başka bir kardeşle aynıysa kart birleşir
        let y = bulAile(idler[0]); VG.sira = VG.sira.map(id => idler.indexOf(id) >= 0 && y ? y.id : id).filter((id, i, a) => a.indexOf(id) === i); VG.i = Math.max(0, Math.min(VG.sira.length - 1, y ? VG.sira.indexOf(y.id) : VG.i));
        showToast(sonuc.every(Boolean) ? '✓ Numara kaydedildi' + (y && y.cocuk.length > idler.length ? ', kardeşiyle birleşti' : '') : 'Numara bu cihaza kaydedildi, internet gelince gönderilecek', sonuc.every(Boolean) ? 'success' : 'warning'); ciz();
    };
    // yana kaydırma (yazı alanında ve dikey kaydırmada devreye girmez)
    function kartBagla() {
        let k = document.getElementById('vg-kart'); if (!k) return; let x0 = 0, y0 = 0, dx = 0, tut = false, yatay = null;
        k.addEventListener('touchstart', e => { let t = e.touches[0]; tut = e.touches.length === 1 && !/INPUT|TEXTAREA/.test(e.target.tagName); x0 = t.clientX; y0 = t.clientY; dx = 0; yatay = null; }, { passive: true });
        k.addEventListener('touchmove', e => { if (!tut) return; let t = e.touches[0]; dx = t.clientX - x0; let dy = t.clientY - y0; if (yatay === null && Math.hypot(dx, dy) > 10) yatay = Math.abs(dx) > Math.abs(dy) * 1.3; if (yatay) { k.style.transform = 'translateX(' + dx * 0.9 + 'px)'; k.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 420)); } }, { passive: true });
        let birak = () => { if (!tut) return; tut = false; k.style.transform = ''; k.style.opacity = ''; if (yatay && Math.abs(dx) > 60) vgGec(dx < 0 ? 1 : -1); };
        k.addEventListener('touchend', birak); k.addEventListener('touchcancel', birak);
    }
    document.addEventListener('keydown', e => { if (!document.getElementById('vg-kart') || document.getElementById('yn-kart') || /INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '') || typeof yoneticiSekmeAktif === 'undefined' || yoneticiSekmeAktif !== 'velilink') return; if (e.key === 'ArrowRight') vgGec(1); if (e.key === 'ArrowLeft') vgGec(-1); });

    function css() {
        if (document.getElementById('vg-css')) return; let s = document.createElement('style'); s.id = 'vg-css';
        s.textContent = `.vg{max-width:620px;margin:0 auto;color:var(--text-main);padding-bottom:4px}#yonetici-liste:has(>.vg){overflow-x:hidden}.vg button,.vg a{font-family:inherit;transform:none!important;touch-action:manipulation;cursor:pointer}
.vg-ust{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.vg-ust h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em}.vg-ust p{margin:2px 0 0;font-size:13.5px;color:var(--text-muted)}.vg-ust p b{color:var(--text-main)}
.vg-d{min-height:44px;padding:0 15px;border-radius:12px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);font-size:14px;font-weight:700}.vg-d.ana{background:#ff6a1a;border-color:#ff6a1a;color:#1d0d02}
.vg-cub{height:9px;border-radius:9px;background:var(--border-color);overflow:hidden;margin:10px 0 12px}.vg-cub i{display:block;height:100%;background:#3fbf7f}
.vg-suz{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none;margin:0 -2px 14px;padding:0 2px}.vg-suz::-webkit-scrollbar{display:none}.vg-suz button{flex:none;min-height:42px;padding:0 13px;border-radius:99px;border:1px solid var(--border-color);background:transparent;color:var(--text-muted);font-size:13.5px;font-weight:700}.vg-suz button b{color:var(--text-main);margin-left:3px}.vg-suz button[aria-pressed=true]{background:var(--bg-panel);border-color:#ff6a1a;color:var(--text-main)}
.vg-kart{border:1px solid var(--border-color);border-radius:20px;background:var(--bg-panel);padding:16px;display:grid;gap:12px;touch-action:pan-y;will-change:transform}.vg-kart>*{min-width:0}
.vg-kart.sagdan{animation:vgSag .22s ease-out}.vg-kart.soldan{animation:vgSol .22s ease-out}@keyframes vgSag{from{transform:translateX(60px);opacity:.2}}@keyframes vgSol{from{transform:translateX(-60px);opacity:.2}}
.vg-k-ust{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap}.vg-k-ust small{display:block;font-size:12.5px;color:var(--text-muted)}.vg-k-ust strong{font-size:20px;font-weight:800;line-height:1.2;overflow-wrap:anywhere}
.vg-e{font-style:normal;font-size:12.5px;font-weight:700;padding:5px 10px;border-radius:99px;background:rgba(143,152,167,.16);color:var(--text-muted);white-space:nowrap}.vg-e.g{background:rgba(96,165,250,.16);color:#8dbcf5}.vg-e.a{background:rgba(63,191,127,.16);color:#4fc98a}.vg-e.y{background:rgba(232,163,61,.16);color:#efb04f}
body.light-theme .vg-e.g{color:#1d5fb8}body.light-theme .vg-e.a{color:#12714a}body.light-theme .vg-e.y{color:#8a5500}
.vg-cocuklar{display:grid;gap:7px}.vg-cocuk{display:flex;align-items:center;gap:11px;text-align:left;width:100%;min-height:52px;padding:4px 0;border:0;background:none;color:var(--text-main)}.vg-cocuk span:last-child{min-width:0}.vg-cocuk b{display:block;font-size:16px;font-weight:700;overflow-wrap:anywhere;line-height:1.25}.vg-cocuk small{font-size:13px;color:var(--text-muted)}.vg-cocuk em{font-style:normal;color:#efb04f;font-weight:700}body.light-theme .vg-cocuk em{color:#8a5500}
.vg-av{flex:none;width:46px;height:46px;border-radius:13px;display:grid;place-items:center;font-size:14px;font-weight:700;background:rgba(212,167,58,.16);color:#e0b64c}.vg-not{margin:0;font-size:13px;color:var(--text-muted)}
.vg-tel{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;min-height:50px;padding:0 14px;border-radius:13px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font-size:17px;font-weight:700;font-variant-numeric:tabular-nums}.vg-tel em{font-style:normal;font-size:13.5px;color:var(--text-muted)}.vg-tel.yok{border-color:#e8a33d;color:#efb04f}body.light-theme .vg-tel.yok{color:#8a5500}
.vg-form{display:grid;gap:10px;padding:12px;border-radius:13px;background:var(--bg-main)}.vg-form label{display:grid;gap:4px;font-size:13px;color:var(--text-muted);font-weight:600}.vg .vg-form input,.vg textarea,.vg .vg-ara{width:100%;box-sizing:border-box;font:inherit;font-size:16px;min-height:46px;padding:10px 13px;border-radius:11px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);margin:0}.vg textarea{line-height:1.45;resize:vertical}.vg-hata{margin:0;font-size:13.5px;color:#ef6461;font-weight:700}.vg-hata:empty{display:none}
.vg-wa{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:60px;border-radius:16px;border:0;background:#25d366;color:#05250f;font-size:18px;line-height:1.15;font-weight:800;text-decoration:none}.vg-wa:disabled{opacity:.5}
.vg-tur{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.vg-tur button{min-height:44px;padding:4px 6px;border-radius:11px;border:1px solid var(--border-color);background:transparent;color:var(--text-muted);font-size:13px;font-weight:700;line-height:1.2}.vg-tur button[aria-pressed=true]{border-color:#ff6a1a;color:var(--text-main);background:var(--bg-main)}
.vg-ac{min-height:40px;border:0;background:none;color:var(--text-muted);font-size:13.5px;font-weight:700}
.vg-gec{display:grid;grid-template-columns:56px minmax(0,1fr) 56px;gap:6px 8px;align-items:center;position:sticky;bottom:0;z-index:2;padding:10px 0 4px;background:var(--bg-main)}.vg-gec>button[aria-label]{min-height:60px;padding:0;border-radius:16px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);font-size:28px;line-height:1;font-weight:700}.vg-gec>button:disabled{opacity:.4}.vg-gec>span{grid-column:1/-1;text-align:center;font-size:13px;font-weight:700;color:var(--text-muted);font-variant-numeric:tabular-nums}
.vg-geri{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 8px 8px 14px;border-radius:13px;background:rgba(63,191,127,.14);margin-bottom:10px;font-size:13.5px;font-weight:700}.vg-geri button{min-height:40px;padding:0 12px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);font-size:13px;font-weight:700;flex:none}
.vg-liste{display:grid;border:1px solid var(--border-color);border-radius:14px;background:var(--bg-panel);overflow:hidden;margin-top:10px}.vg-liste>button{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;text-align:left;min-height:60px;padding:9px 13px;border:0;border-top:1px solid var(--border-color);background:none;color:var(--text-main)}.vg-liste>button:first-child{border-top:0}.vg-liste span{min-width:0;flex:1 1 180px}.vg-liste b{display:block;font-size:14.5px;font-weight:700}.vg-liste small{font-size:12.5px;color:var(--text-muted)}
.vg-bos{padding:34px 16px;text-align:center;color:var(--text-muted);font-size:15px;line-height:1.6}.vg-bos b{color:var(--text-main);font-size:18px}.vg-bos .vg-d{margin-top:14px}
.vg button:focus-visible,.vg a:focus-visible{outline:2px solid #ff6a1a;outline-offset:2px}@media (prefers-reduced-motion:reduce){.vg-kart{animation:none!important}}`;
        document.head.appendChild(s);
    }
})();
