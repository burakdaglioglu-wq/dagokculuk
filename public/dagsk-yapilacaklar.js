/* ================================================================================================
   ✅ BUGÜN YAPILACAKLAR (2026-09-29, kullanıcı: "beni kolaylaştıracak şekilde" — aidatı gecikenler, 2+
   haftadır gelmeyenler, belgesi dolanlar, dönüş bekleyen misafirler, doğum günleri 4-5 ayrı ekrana
   dağılmıştı). Yönetici açılışında (panel özeti) tek liste: her satırda hazır WhatsApp mesajı, dokun-gönder,
   "✓ Tamam". Hesaplar YENİ değil — var olan yardımcılar: devamsizlikListesi, _dogumGunuListesi, aidatDB
   (aidatBorcListesi'nin kuralı, tüm gruplar), sağlık/lisans bitiş tarihleri, Kişi Yönetimi misafir takibi.

   "Tamam" kaydı sunucuda (meta "yapilacak_tamam", oturumlu — kimin aidatı gecikmiş bilgisini taşır), kayıt
   başına en yeni kazanır (kyDepoSenkron). Bir iş şu kadar süre gizlenir: aidat → o ay, devamsızlık → o hafta,
   belge → bitiş tarihi değişene kadar, doğum günü → o yıl. Misafir "tamam" = Kişi Yönetimi'nde "Arandı".
   ================================================================================================ */
const YP_ANAHTAR = 'yapilacak_tamam';
let _yp = { acik: {}, bitenAcik: false, sonSenkron: 0 };

function ypIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function ypTamamlar() { return kyDepoOku(YP_ANAHTAR); }
function ypBuda(d) { let sinir = Date.now() - 400 * 86400000; Object.keys(d).forEach(function (k) { if ((d[k].t || 0) < sinir) delete d[k]; }); return d; }
function ypSenkron(yaz) { return kyDepoSenkron(YP_ANAHTAR, function () { return kyDepoOku(YP_ANAHTAR); }, yaz, ypBuda); }
function ypSporcuMu(g, ad) { try { return typeof kisiTuru !== 'function' || kisiTuru(g, ad) === 'sporcu'; } catch (e) { return true; } }
function ypAktifler() {
    let r = [];
    ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach(function (g) { Object.keys(turnuvaDB[g] || {}).forEach(function (ad) { let sp = turnuvaDB[g][ad]; if (sp && !sp.pasif && !sp.donduruldu) r.push({ g: g, ad: ad, sp: sp }); }); });
    return r;
}
function ypIlkAd(ad) { let i = String(ad || '').trim().split(/\s+/)[0] || ''; return i.charAt(0) + i.slice(1).toLocaleLowerCase('tr-TR'); }
function ypTarih(iso) { return iso ? new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : ''; }

// Tüm işler — { id, tur, g, ad, baslik, alt, tel, mesaj }
function ypListe() {
    let bugun = new Date(), iso = ypIso(bugun), ay = iso.slice(0, 7), yil = iso.slice(0, 4), hafta = (typeof bsHaftaAnahtar === 'function') ? bsHaftaAnahtar(iso) : iso;
    let aktifler = ypAktifler(), is = [];
    // 💰 Aidat — geçen ayı ödemeyen her zaman; bu ayı ödemeyen ayın 10'undan sonra. aidatDB boşsa (giriş yok / henüz
    // yüklenmedi) bölüm hiç gösterilmez — yoksa herkes borçlu görünürdü.
    if (typeof aidatDB !== 'undefined' && Object.keys(aidatDB || {}).length) {
        aktifler.forEach(function (x) {
            if (x.sp.aidatMuaf || !ypSporcuMu(x.g, x.ad)) return;
            // Aidat sisteminde hiç kaydı olmayan (henüz aidat takibine alınmamış) sporcu listeyi boğmasın.
            if (!aidatDB[x.ad] || !Object.keys(aidatDB[x.ad]).length) return;
            let borc = 0, d = new Date(bugun.getFullYear(), bugun.getMonth(), 1);
            for (let i = 0; i < 6; i++) { let a = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); let rec = aidatDB[x.ad] && aidatDB[x.ad][a]; if (rec && rec.odendi) break; borc++; d.setMonth(d.getMonth() - 1); }
            if (borc >= 2 || (borc >= 1 && bugun.getDate() >= 10)) is.push({ id: 'aidat|' + x.ad + '|' + ay, tur: 'aidat', g: x.g, ad: x.ad, alt: borc >= 6 ? '6+ aydır ödenmedi' : borc + ' aydır ödenmedi', tel: x.sp.acilTelefon,
                mesaj: "Merhaba 🌟 DAĞ Spor Kulübü'nden yazıyoruz.\n\n" + ypIlkAd(x.ad) + " için bu ayki aidat ödemesini henüz göremedik. Uygun olduğunuzda tamamlarsanız çok seviniriz 🧡 Ödemeyi yaptıysanız bize bildirmeniz yeterli.\n\nDAĞ Spor Kulübü" });
        });
    }
    // 📉 2+ haftadır gelmeyenler (daha önce en az bir kez gelmiş olanlar — hiç kaydı olmayan yeni sporcu gürültü yapmasın)
    try {
        devamsizlikListesi(14).forEach(function (x) {
            if (x.gun === null || !ypSporcuMu(x.g, x.ad)) return;
            let sp = turnuvaDB[x.g] && turnuvaDB[x.g][x.ad];
            is.push({ id: 'devam|' + x.g + '|' + x.ad + '|' + hafta, tur: 'devam', g: x.g, ad: x.ad, alt: x.gun + ' gündür gelmiyor', tel: sp && sp.acilTelefon,
                mesaj: "Merhaba 🌟 DAĞ Spor Kulübü'nden yazıyoruz.\n\n" + ypIlkAd(x.ad) + "'i son antrenmanlarda göremedik ve çok özledik! 🏹 Antrenmanlarımız her zamanki programında devam ediyor — kendisini yeniden aramızda görmekten mutluluk duyarız.\n\nBir engel ya da sorunuz varsa her zaman buradayız 🧡\nDAĞ Spor Kulübü" });
        });
    } catch (e) {}
    // 🩺 Sağlık raporu / lisans — 14 gün içinde dolacak ya da dolmuş (tarih girilmişse)
    aktifler.forEach(function (x) {
        [['saglikRaporuBitis', 'Sağlık raporu'], ['lisansBitis', 'Lisans']].forEach(function (b) {
            let t = x.sp[b[0]]; if (!t) return;
            let kalan = Math.round((new Date(t + 'T12:00:00') - new Date(iso + 'T12:00:00')) / 86400000); if (kalan > 14) return;
            is.push({ id: 'belge|' + x.g + '|' + x.ad + '|' + b[0] + '|' + t, tur: 'belge', g: x.g, ad: x.ad, alt: b[1] + (kalan < 0 ? ' — süresi doldu (' + ypTarih(t) + ')' : kalan === 0 ? ' — bugün doluyor' : ' — ' + kalan + ' gün kaldı'), tel: x.sp.acilTelefon,
                mesaj: "Merhaba 🌟 DAĞ Spor Kulübü'nden yazıyoruz.\n\n" + ypIlkAd(x.ad) + "'in " + b[1].toLocaleLowerCase('tr-TR') + ' ' + (kalan < 0 ? 'süresi ' + ypTarih(t) + ' tarihinde doldu' : 'süresi ' + ypTarih(t) + ' tarihinde doluyor') + '. Yenisini getirebilirseniz antrenmanlara sorunsuz devam edebiliriz 🧡\n\nDAĞ Spor Kulübü' });
        });
    });
    // 🎟️ Dönüş bekleyen misafirler (Kişi Yönetimi'ndeki "aranmayı bekleyenler" ile aynı kural)
    try {
        if (typeof kyTumKisiler === 'function') kyTumKisiler().filter(function (x) { return kisiTuru(x.g, x.ad) === 'misafir'; }).forEach(function (x) {
            let b = kisiBilgi(x.g, x.ad) || {}, o = kyOzet(x.g, x.ad);
            if ((b.takip && KY_TAKIP[b.takip.durum]) || !(o.son || b.eklenme)) return;
            let gun = kyGunFark(o.son || b.eklenme); if (gun < 1) return;
            is.push({ id: 'misafir|' + x.g + '|' + x.ad, tur: 'misafir', g: x.g, ad: x.ad, alt: (o.yoklama ? o.yoklama + ' kez geldi · son ' + gun + ' gün önce' : 'kayıt ' + gun + ' gün önce'), tel: b.tel,
                mesaj: "Merhaba 🌟 DAĞ Spor Kulübü'nden yazıyoruz.\n\n" + ypIlkAd(x.ad) + ' okçuluk dersimize katıldığı için çok teşekkür ederiz! 🏹 Nasıl buldu, devam etmek ister mi?\n\nDers günlerimizi, saatlerimizi ve kayıt bilgilerini paylaşmaktan memnuniyet duyarız — buradan yazmanız yeterli.\n\nDAĞ Spor Kulübü' });
        });
    } catch (e) {}
    // 🎂 Bu hafta doğum günü (7 gün içinde)
    try {
        _dogumGunuListesi(7).forEach(function (x) {
            let sp = turnuvaDB[x.g] && turnuvaDB[x.g][x.ad];
            is.push({ id: 'dogum|' + x.g + '|' + x.ad + '|' + yil, tur: 'dogum', g: x.g, ad: x.ad, alt: x.gunSonra === 0 ? 'Bugün! 🎂' : x.gunSonra === 1 ? 'Yarın' : x.gunSonra + ' gün sonra', tel: sp && sp.acilTelefon,
                mesaj: '🎉 İyi ki doğdun ' + ypIlkAd(x.ad) + "! 🎂\n\nDAĞ Spor Kulübü ailesi olarak yeni yaşının sağlık, mutluluk ve nice başarılarla dolu olmasını diliyoruz 🏹\n\nNice senelere! 🧡\nDAĞ Spor Kulübü" });
        });
    } catch (e) {}
    return is;
}
const YP_TURLER = [
    { id: 'dogum', ad: 'Doğum günleri', ikon: '🎂' },
    { id: 'belge', ad: 'Belgesi dolan', ikon: '🩺' },
    { id: 'aidat', ad: 'Aidatı geciken', ikon: '💰' },
    { id: 'devam', ad: '2+ haftadır gelmeyen', ikon: '📉' },
    { id: 'misafir', ad: 'Dönüş bekleyen misafir', ikon: '🎟️' }
];

function ypCiz() {
    let el = document.getElementById('yp-kart'); if (!el) return;
    let tum = ypListe(), tamam = ypTamamlar(), bugun = ypIso(new Date());
    let bekleyen = tum.filter(function (x) { return !(tamam[x.id] && !tamam[x.id].sil); });
    let bugunBiten = tum.filter(function (x) { let t = tamam[x.id]; return t && !t.sil && t.tarih === bugun; });
    let bolumler = YP_TURLER.map(function (tr) {
        let l = bekleyen.filter(function (x) { return x.tur === tr.id; }); if (!l.length) return '';
        let acik = !!_yp.acik[tr.id], goster = acik ? l : l.slice(0, 4);
        return '<div class="yp-bolum"><div class="yp-bolum-bas">' + tr.ikon + ' ' + tr.ad + ' <b>' + l.length + '</b></div>'
            + goster.map(function (x) {
                let k = encodeURIComponent(x.id).replace(/'/g, '%27');
                return '<div class="yp-sat"><div class="yp-ad"><b>' + esc(x.ad) + '</b><small>' + esc(x.alt) + (x.tel ? '' : ' · telefon yok') + '</small></div>'
                    + '<button class="yp-btn wa" onclick="ypGonder(\'' + k + '\')">💬 WhatsApp</button><button class="yp-btn" onclick="ypTamam(\'' + k + '\')" aria-label="Tamam">✓</button></div>';
            }).join('')
            + (l.length > 4 ? '<button class="yp-daha" onclick="_yp.acik[\'' + tr.id + '\']=' + (!acik) + '; ypCiz()">' + (acik ? '▴ Daha az göster' : '▾ ' + (l.length - 4) + ' tane daha') + '</button>' : '') + '</div>';
    }).join('');
    el.innerHTML = '<div class="yp-ust"><div><div class="yp-baslik">✅ Bugün yapılacaklar</div><div class="yp-alt">' + (bekleyen.length ? bekleyen.length + ' iş bekliyor — mesaja dokun, gönder, işaretle' : 'Bekleyen iş yok 🎉') + '</div></div></div>'
        + (bolumler || '<div class="yp-bos">Aidat, devam, belge, misafir ve doğum günü tarafında yapılacak bir şey kalmadı.</div>')
        + (bugunBiten.length ? '<button class="yp-daha" onclick="_yp.bitenAcik=!_yp.bitenAcik; ypCiz()">' + (_yp.bitenAcik ? '▴' : '▸') + ' Bugün tamamlananlar (' + bugunBiten.length + ')</button>'
            + (_yp.bitenAcik ? bugunBiten.map(function (x) { let k = encodeURIComponent(x.id).replace(/'/g, '%27'); return '<div class="yp-sat bitti"><div class="yp-ad"><b>' + esc(x.ad) + '</b><small>' + esc(x.alt) + '</small></div><button class="yp-btn" onclick="ypGeriAl(\'' + k + '\')">↩ Geri al</button></div>'; }).join('') : '') : '');
    if (Date.now() - _yp.sonSenkron > 60000) { _yp.sonSenkron = Date.now(); ypSenkron(false).then(function () { if (document.getElementById('yp-kart')) ypCiz(); }).catch(function () {}); }
}
function ypBul(k) { let id = decodeURIComponent(k); return ypListe().find(function (x) { return x.id === id; }); }
function ypIsaretle(x, tamamMi) {
    if (x.tur === 'misafir' && typeof kisiTurAyarla === 'function') {
        kisiTurAyarla(x.g, x.ad, tamamMi ? { takip: { durum: 'arandi', tarih: ypIso(new Date()), kanal: 'whatsapp' } } : { takip: null });
    }
    let d = kyDepoOku(YP_ANAHTAR); d[x.id] = tamamMi ? { t: Date.now(), tarih: ypIso(new Date()) } : { t: Date.now(), sil: true };
    kyDepoYazYerel(YP_ANAHTAR, d); ypSenkron(true).catch(function () {});
}
function ypGonder(k) {
    let x = ypBul(k); if (!x) return;
    let n = (typeof telefonWaFormat === 'function') ? telefonWaFormat(x.tel) : '';
    window.open((n ? 'https://api.whatsapp.com/send?phone=' + n + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(x.mesaj), '_blank');
    ypIsaretle(x, true); ypCiz();
}
function ypTamam(k) { let x = ypBul(k); if (!x) return; ypIsaretle(x, true); ypCiz(); }
function ypGeriAl(k) {
    let id = decodeURIComponent(k), x = ypListe().find(function (y) { return y.id === id; }); if (!x) return;
    if (x.tur === 'misafir' && typeof kisiTurAyarla === 'function') kisiTurAyarla(x.g, x.ad, { takip: null });
    let d = kyDepoOku(YP_ANAHTAR); d[id] = { t: Date.now(), sil: true }; kyDepoYazYerel(YP_ANAHTAR, d); ypSenkron(true).catch(function () {}); ypCiz();
}

// Yönetici panel özetine (yoneticiOzetCiz) kartı ekle — başlık kartının hemen altına.
(function () {
    function kanca() {
        if (typeof yoneticiOzetCiz !== 'function' || typeof kyDepoSenkron !== 'function') return setTimeout(kanca, 300);
        let eski = yoneticiOzetCiz;
        yoneticiOzetCiz = function () {
            let r = eski.apply(this, arguments);
            try {
                let alan = document.getElementById('yonetici-liste'), hero = alan && alan.querySelector('.adm-hero');
                // 2026-10-01 sade panel: kart, iki sütunlu ızgaradaki yuvasına (#yon-yp-yuva) yerleşir; yuva yoksa eski yer (hero altı).
                let yuva = document.getElementById('yon-yp-yuva');
                if (!document.getElementById('yp-kart')) {
                    if (yuva) { yuva.innerHTML = '<div class="adm-card yp-kart" id="yp-kart"></div>'; ypCiz(); }
                    else if (hero) { hero.insertAdjacentHTML('afterend', '<div class="adm-card yp-kart" id="yp-kart"></div>'); ypCiz(); }
                }
            } catch (e) { console.warn('yapılacaklar', e); }
            return r;
        };
    }
    kanca();
    let st = document.createElement('style');
    st.textContent = '.yp-kart{display:flex;flex-direction:column;gap:10px}'
        + '.yp-baslik{font-weight:900;font-size:15px}.yp-alt{font-size:11.5px;color:var(--text-muted);margin-top:2px}'
        + '.yp-bolum{display:flex;flex-direction:column;gap:2px;border-top:1px solid var(--border-color);padding-top:8px}'
        + '.yp-bolum-bas{font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted);margin-bottom:2px}.yp-bolum-bas b{color:var(--text-primary,var(--text-main))}'
        + '.yp-sat{display:flex;align-items:center;gap:8px;padding:6px 0;flex-wrap:wrap}.yp-sat.bitti{opacity:.6}'
        + '.yp-ad{flex:1;min-width:140px}.yp-ad b{display:block;font-size:13px}.yp-ad small{font-size:11px;color:var(--text-muted)}'
        + '.yp-btn{border:1px solid var(--border-color);background:transparent;color:var(--text-primary,var(--text-main));border-radius:9px;padding:0 12px;min-height:38px;font-weight:800;font-size:12px;cursor:pointer}'
        + '.yp-btn.wa{border-color:var(--status-success,#4FB07A);color:var(--status-success,#4FB07A)}'
        + '.yp-btn:focus-visible,.yp-daha:focus-visible{outline:2px solid var(--accent-orange);outline-offset:2px}'
        + '.yp-daha{align-self:flex-start;border:none;background:transparent;color:var(--text-muted);font-weight:700;font-size:12px;cursor:pointer;padding:4px 0}'
        + '.yp-bos{font-size:12px;color:var(--text-muted)}';
    document.head.appendChild(st);
})();
