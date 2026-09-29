// Karışık Sınıf › ⚡ Reaksiyon (Pod / Yeşile Bas / Hızlı Dokunuş / …) — app.js'ten ayrıldı (2026-09-29, açılış hızı).
// Karışık Sınıf'ta "Reaksiyon" aracı ilk açıldığında yüklenir (app.js kmSekme → kmEkCalistir). Stiller app.js'teki
// KM_OYUN_CSS'te kaldı (kmOyunKaynaklarYukle). Klasik betik: tanımlar diğer betiklerle aynı genel kapsamda.
// ===== KARIŞIK SINIF — ⚡ REAKSİYON (2026-09-02, "reaksiyon oyunlarını buraya da ekleyelim,
// sporcular bekleme sırasında oynasınlar") =====
// Kişisel "🧠 Reaksiyon Oyunu" sekmesinde (rfx* fonksiyonları, sporcunun kendi giriş yaptığı
// profile bağlı coin/XP ekonomisi) ZATEN 14 oyun var — buraya HİÇBİRİ birebir taşınmadı, çünkü
// o fonksiyonlar hem sabit DOM id'leri kullanıyor (aynı anda iki yerde aynı id ÇAKIŞIRDI) hem de
// `rfxBitisIc` doğrudan `coinEkle`/kişisel görev sistemine yazıyor — Karışık Sınıf'ta birden fazla
// çocuk PIN'siz sırayla aynı cihazı kullanacağı için "kim oynadıysa ona coin yaz" mantığı YANLIŞ
// sporcuya ödül verirdi. Bunun yerine en doğal "sırada bekleyen oynasın" adayı olan 3 reaksiyon-hız
// oyunu (Pod/Yeşile Bas/Hızlı Dokunuş) kendi km-önekli, bağımsız kopyalarıyla YENİDEN kuruldu —
// Oyunlar'daki gibi _kmListe roster'ından PIN'siz sporcu seçimi, konum-bazlı yerel rekor (gerçek
// skora/coin'e DOKUNMAZ), ve eklenen bir 3-2-1 geri sayımla ("genişletelim" isteğine karşılık).
let _kmRfxSecilen = null; // {g, ad}
let _kmRfxAktifOyun = null;
let _kmRfxAktif = false;
let _kmRfxTimer = null, _kmRfxTimer2 = null, _kmRfxSpawnT = null, _kmRfxSpawnT2 = null;
let _kmRfxSkorlar = {}; // { 'g|ad': { pod:18, gonogo:15, tap:42 } } — konum-bazlı yerel rekor
let _kmRfxYuklenenKonum = null;
const KM_RFX_OYUNLAR = {
    pod: { ad: 'Reaksiyon Pod', ikon: '🔴', renk: '#ef4444', aciklama: 'Çıkan hedefe hızlı dokun!' },
    gonogo: { ad: 'Yeşile Bas', ikon: '🚦', renk: '#10b981', aciklama: 'YEŞİL\'de dokun, KIRMIZI\'da durma!' },
    tap: { ad: 'Hızlı Dokunuş', ikon: '💥', renk: '#f59e0b', aciklama: '5 saniyede en çok kaç dokunuş?' },
    odak: { ad: 'Odak Kilidi', ikon: '🔢', renk: '#a855f7', aciklama: 'Sayılara sırayla dokun, ızgara büyür!' },
    hafiza: { ad: 'Hafıza', ikon: '🧠', renk: '#3b82f6', aciklama: 'Yanan sırayı izle, aynısını tekrarla.' },
    takip: { ad: 'Hedef Takip', ikon: '👁️', renk: '#14b8a6', aciklama: 'Hareket eden noktayı akıcı takip et.' },
    sayim: { ad: 'Skor Sayımı', ikon: '🔢', renk: '#eab308', aciklama: 'Okların toplamını bul, doğru şıkka dokun!' },
    grup: { ad: 'Grup At', ikon: '🎯', renk: '#22c55e', aciklama: 'Aynı noktaya 6 kez dokun, grup küçük olsun.' },
    nefes: { ad: 'Nefes Ritmi', ikon: '🫁', renk: '#38bdf8', aciklama: 'Daire tepe/dipteyken tam zamanında dokun.' },
    sabir: { ad: 'Sabır', ikon: '⏳', renk: '#f59e0b', aciklama: 'Basılı tut, komut gelince sarıya bırak!' },
    dusus: { ad: 'Mükemmel Düşüş', ikon: '🏹', renk: '#22c55e', aciklama: 'Yayı ger, bırak, sonra DOKUNMA!' },
    kliker: { ad: 'Kliker Duvarı', ikon: '🖱️', renk: '#ef4444', aciklama: 'Barı doldur, TİK sesinde anında bırak!' },
    kaos: { ad: 'Kaos Odak', ikon: '🌪️', renk: '#a855f7', aciklama: 'Sahte sinyale kanma, sadece YEŞİLe bırak!' },
    yorgunluk: { ad: 'Son Okun Ağırlığı', ikon: '💪', renk: '#eab308', aciklama: '3 set — yorgunlukta bile sarıda kal!' }
};
function kmRfxAnahtari() { return 'dag_km_rfx_' + (_kmAktifKonum || 'varsayilan'); }
function kmRfxDurumEmin() {
    if(_kmRfxYuklenenKonum !== _kmAktifKonum) {
        try { let raw = localStorage.getItem(kmRfxAnahtari()); _kmRfxSkorlar = raw ? JSON.parse(raw) : {}; } catch(e) { _kmRfxSkorlar = {}; }
        _kmRfxYuklenenKonum = _kmAktifKonum;
    }
}
function kmRfxDurumKaydet() { try { localStorage.setItem(kmRfxAnahtari(), JSON.stringify(_kmRfxSkorlar)); } catch(e) {} }
function kmRfxRekorAl(g, ad, tip) { let k = g + '|' + ad; return (_kmRfxSkorlar[k] && _kmRfxSkorlar[k][tip]) || 0; }
function kmRfxRekorYaz(g, ad, tip, puan) {
    let k = g + '|' + ad; if(!_kmRfxSkorlar[k]) _kmRfxSkorlar[k] = {};
    let yeni = puan > (_kmRfxSkorlar[k][tip] || 0);
    if(yeni) _kmRfxSkorlar[k][tip] = puan;
    kmRfxDurumKaydet();
    return yeni;
}
function kmRfxTemizle() { _kmRfxAktif = false; if(_kmRfxTimer) clearInterval(_kmRfxTimer); if(_kmRfxTimer2) clearInterval(_kmRfxTimer2); if(_kmRfxSpawnT) clearTimeout(_kmRfxSpawnT); if(_kmRfxSpawnT2) clearTimeout(_kmRfxSpawnT2); _kmRfxTimer = null; _kmRfxTimer2 = null; _kmRfxSpawnT = null; _kmRfxSpawnT2 = null; }
function kmReaksiyonCiz() {
    let el = document.getElementById('km-icerik'); if(!el) return;
    // Bu CSS (KM_OYUN_CSS içinde, .km-rfx-* kuralları dahil) tembel yükleniyor — koç Oyunlar
    // sekmesine hiç uğramadan doğrudan Reaksiyon'u açarsa da enjekte edilmiş olsun diye burada
    // da çağrılıyor (gerçek testte bulundu: stil yoksa ekran tamamen çıplak metin gibi görünüyor).
    kmOyunKaynaklarYukle();
    kmRfxDurumEmin();
    kmRfxTemizle();
    _kmRfxAktifOyun = null;
    if(!_kmListe.length) { el.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:30px;">Liste boş — üstten ➕ Sporcu Ekle</div>'; return; }
    if(_kmRfxSecilen && !_kmListe.some(function(x) { return x.g === _kmRfxSecilen.g && x.ad === _kmRfxSecilen.ad; })) _kmRfxSecilen = null;
    el.innerHTML = kmReaksiyonHTML();
}
function kmReaksiyonHTML() {
    let chips = _kmListe.map(function(item) {
        let secili = _kmRfxSecilen && _kmRfxSecilen.g === item.g && _kmRfxSecilen.ad === item.ad;
        let sp = turnuvaDB[item.g] && turnuvaDB[item.g][item.ad];
        let avatar = (sp && sp.fotoUrl) ? `<img src="${sp.fotoUrl}" style="width:100%;height:100%;object-fit:cover;">` : kmOyunKisaAd(item.ad);
        let adEsc = item.ad.replace(/'/g, "\\'");
        return `<div class="km-rfx-chip${secili ? ' aktif' : ''}" onclick="kmRfxSporcuSec('${item.g}','${adEsc}')">
            <div class="km-rfx-chip-av">${avatar}</div><div class="km-rfx-chip-nm">${kmOyunIlkAd(item.ad)}</div>
        </div>`;
    }).join('');
    let kartlar = Object.keys(KM_RFX_OYUNLAR).map(function(tip) {
        let g = KM_RFX_OYUNLAR[tip];
        let rekor = _kmRfxSecilen ? kmRfxRekorAl(_kmRfxSecilen.g, _kmRfxSecilen.ad, tip) : 0;
        return `<button class="km-rfx-oyun-kart" style="--_c:${g.renk};" onclick="kmRfxOyunBaslat('${tip}')" ${_kmRfxSecilen ? '' : 'disabled'}>
            <div class="km-rfx-oyun-ikon">${g.ikon}</div>
            <div class="km-rfx-oyun-ad">${g.ad}</div>
            <div class="km-rfx-oyun-aciklama">${g.aciklama}</div>
            ${rekor ? `<div class="km-rfx-oyun-rekor">🏆 Rekorun: ${rekor}</div>` : ''}
        </button>`;
    }).join('');
    return `<div id="km-rfx-wrap">
        <div class="km-rfx-not">Sırasını bekleyen sporcular burada hızlıca bir reaksiyon oyunu oynayabilir — <b>gerçek skora dokunmaz</b>, sadece eğlence + kendi rekorunu geçme.</div>
        <div class="km-rfx-dok-lbl">Kim Oynuyor?</div>
        <div class="km-rfx-chips">${chips}</div>
        <div class="km-rfx-dok-lbl" style="margin-top:14px;">${_kmRfxSecilen ? 'Oyun Seç' : 'Önce yukarıdan bir sporcu seç'}</div>
        <div class="km-rfx-kartlar">${kartlar}</div>
        <div id="km-rfx-oyun-alani"></div>
    </div>`;
}
function kmRfxSporcuSec(g, ad) {
    _kmRfxSecilen = { g: g, ad: ad };
    let el = document.getElementById('km-rfx-wrap'); if(el) el.outerHTML = kmReaksiyonHTML();
}
function kmRfxOyunBaslat(tip) {
    if(!_kmRfxSecilen) return;
    kmRfxTemizle();
    _kmRfxAktifOyun = tip;
    let alan = document.getElementById('km-rfx-oyun-alani'); if(!alan) return;
    let g = KM_RFX_OYUNLAR[tip];
    alan.innerHTML = `<div class="km-rfx-oyun-shell">
        <div class="km-rfx-oyun-ustbar"><span>${g.ikon} ${g.ad} — <b>${kmOyunIlkAd(_kmRfxSecilen.ad)}</b></span><button class="km-rfx-geri-btn" onclick="kmReaksiyonCiz()">◀ Menü</button></div>
        <div id="km-rfx-sahne"></div>
    </div>`;
    kmRfxGeriSayim(tip);
}
function kmRfxGeriSayim(tip) {
    let sahne = document.getElementById('km-rfx-sahne'); if(!sahne) return;
    let n = 3;
    function adim() {
        sahne.innerHTML = `<div class="km-rfx-geri-sayim">${n > 0 ? n : 'BAŞLA!'}</div>`;
        try { sesCal(n > 0 ? 500 : 900, 0.12); } catch(e) {}
        // Geri sayımın setTimeout zinciri _kmRfxSpawnT'ye BAĞLANIYOR (gerçek testte bulunan
        // bug): eskiden bağımsız/izlenmeyen bir zincirdi — kullanıcı geri sayım SIRASINDA "◀ Menü"
        // deyip BAŞKA bir oyun seçerse, eski oyunun gecikmiş callback'i hâlâ ateşlenip YENİ seçilen
        // oyunun ekranını çalınmış gibi ele geçirebiliyordu. Artık `kmRfxOyunBaslat`/`kmReaksiyonCiz`
        // her ikisi de en başta kmRfxTemizle() çağırdığından, bu zincir de onunla iptal ediliyor.
        if(n > 0) { n--; _kmRfxSpawnT = setTimeout(adim, 650); }
        else _kmRfxSpawnT = setTimeout(function() {
            let s = document.getElementById('km-rfx-sahne'); if(!s) return;
            if(tip === 'pod') kmRfxPodKur(s);
            else if(tip === 'gonogo') kmRfxGnKur(s);
            else if(tip === 'tap') kmRfxTapKur(s);
            else if(tip === 'odak') kmRfxOdakKur(s);
            else if(tip === 'hafiza') kmRfxHfKur(s);
            else if(tip === 'takip') kmRfxTkKur(s);
            else if(tip === 'sayim') kmRfxSyKur(s);
            else if(tip === 'grup') kmRfxGrKur(s);
            else if(tip === 'nefes') kmRfxNfKur(s);
            else if(tip === 'sabir') kmRfxSbKur(s);
            else if(tip === 'dusus') kmRfxDsKur(s);
            else if(tip === 'kliker') kmRfxKlKur(s);
            else if(tip === 'kaos') kmRfxKaosKur(s);
            else if(tip === 'yorgunluk') kmRfxYrKur(s);
        }, 350);
    }
    adim();
}
function kmRfxSonucGoster(tip, puan, ozet) {
    let sahne = document.getElementById('km-rfx-sahne'); if(!sahne) return;
    let s = _kmRfxSecilen;
    let yeniRekor = s ? kmRfxRekorYaz(s.g, s.ad, tip, puan) : false;
    let rekor = s ? kmRfxRekorAl(s.g, s.ad, tip) : puan;
    sahne.innerHTML = `<div class="km-rfx-sonuc">
        <div class="km-rfx-sonuc-puan">${puan}</div>
        ${yeniRekor ? '<div class="km-rfx-yeni-rekor">🏆 YENİ REKOR!</div>' : `<div class="km-rfx-eski-rekor">🏆 Rekorun: ${rekor}</div>`}
        <div class="km-rfx-ozet">${ozet}</div>
        <div class="km-rfx-sonuc-btnler">
            <button class="km-rfx-tekrar-btn" onclick="kmRfxOyunBaslat('${tip}')">🔁 Tekrar Oyna</button>
            <button class="km-rfx-menu-btn" onclick="kmReaksiyonCiz()">◀ Menüye Dön</button>
        </div>
    </div>`;
    if(yeniRekor) { try { sesCal(1200, 0.3); setTimeout(function() { try { sesCal(1500, 0.25); } catch(e) {} }, 150); } catch(e) {} }
}
// --- Reaksiyon Pod: çıkan hedefe hızlı dokun, üst üste vurdukça küçülür/hızlanır ---
let _kmRfxPodSkor = 0, _kmRfxPodSure = 20, _kmRfxPodCombo = 0, _kmRfxPodEnCombo = 0;
function kmRfxPodKur(sahne) {
    _kmRfxAktif = true; _kmRfxPodSkor = 0; _kmRfxPodSure = 20; _kmRfxPodCombo = 0; _kmRfxPodEnCombo = 0;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>⏱️ <span id="km-rfx-pod-sure">20</span>s</div><div>🎯 <span id="km-rfx-pod-skor">0</span></div><div>🔥 <span id="km-rfx-pod-combo">0</span></div></div>
        <div id="km-rfx-pod-alan" class="km-rfx-pod-alan"></div>`;
    kmRfxPodHedef();
    _kmRfxTimer = setInterval(function() {
        _kmRfxPodSure--; let e = document.getElementById('km-rfx-pod-sure'); if(e) e.textContent = _kmRfxPodSure;
        if(_kmRfxPodSure <= 0) kmRfxPodBitir();
    }, 1000);
}
function kmRfxPodHedef() {
    let a = document.getElementById('km-rfx-pod-alan'); if(!a || !_kmRfxAktif) return;
    let b = Math.max(38, 70 - _kmRfxPodCombo * 3);
    let w = Math.max(10, a.clientWidth - b), h = Math.max(10, a.clientHeight - b);
    let x = Math.random() * w, y = Math.random() * h;
    let renkler = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6']; let rk = renkler[Math.min(3, Math.floor(_kmRfxPodCombo / 3))];
    a.innerHTML = `<button class="km-rfx-hedef" onclick="kmRfxPodVur(event)" style="left:${x.toFixed(1)}px; top:${y.toFixed(1)}px; width:${b}px; height:${b}px; background:radial-gradient(circle,#fff 0 14%, ${rk} 15% 38%, #fff 39% 46%, ${rk} 47%); box-shadow:0 0 16px ${rk};"></button>`;
    let pencere = Math.max(600, 1500 - _kmRfxPodSkor * 22);
    if(_kmRfxSpawnT) clearTimeout(_kmRfxSpawnT);
    _kmRfxSpawnT = setTimeout(function() {
        if(!_kmRfxAktif) return; _kmRfxPodCombo = 0; let c = document.getElementById('km-rfx-pod-combo'); if(c) c.textContent = '0';
        try { sesCal(180, 0.1); } catch(e) {} kmRfxPodHedef();
    }, pencere);
}
function kmRfxPodVur(e) {
    if(e) e.stopPropagation(); if(!_kmRfxAktif) return;
    if(_kmRfxSpawnT) { clearTimeout(_kmRfxSpawnT); _kmRfxSpawnT = null; }
    _kmRfxPodSkor++; _kmRfxPodCombo++; if(_kmRfxPodCombo > _kmRfxPodEnCombo) _kmRfxPodEnCombo = _kmRfxPodCombo;
    let s = document.getElementById('km-rfx-pod-skor'); if(s) s.textContent = _kmRfxPodSkor;
    let c = document.getElementById('km-rfx-pod-combo'); if(c) c.textContent = _kmRfxPodCombo;
    try { sesCal(880 + Math.min(600, _kmRfxPodCombo * 40), 0.05); } catch(e) {}
    kmRfxPodHedef();
}
function kmRfxPodBitir() {
    kmRfxTemizle();
    let ozet = _kmRfxPodSkor >= 18 ? 'Refleksin yıldırım gibi!' : _kmRfxPodSkor >= 10 ? 'İyi refleks!' : 'Hedefe odaklan, daha hızlı dokun.';
    kmRfxSonucGoster('pod', _kmRfxPodSkor, ozet);
}
// --- Yeşile Bas (Go/No-Go): YEŞİL'de dokun, KIRMIZI'da durma ---
let _kmRfxGnDogru = 0, _kmRfxGnHata = 0, _kmRfxGnCombo = 0, _kmRfxGnEnCombo = 0, _kmRfxGnBekliyor = false, _kmRfxGnYesil = false, _kmRfxGnSure = 20;
function kmRfxGnKur(sahne) {
    _kmRfxAktif = true; _kmRfxGnSure = 20; _kmRfxGnDogru = 0; _kmRfxGnHata = 0; _kmRfxGnCombo = 0; _kmRfxGnEnCombo = 0;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>⏱️ <span id="km-rfx-gn-sure">20</span>s</div><div>✅ <span id="km-rfx-gn-dogru">0</span></div><div>❌ <span id="km-rfx-gn-hata">0</span></div><div>🔥 <span id="km-rfx-gn-combo">0</span></div></div>
        <div id="km-rfx-gn-alan" class="km-rfx-gn-alan" onclick="kmRfxGnDokun()"><span style="color:#64748b;">Hazır ol...</span></div>`;
    kmRfxGnDongu();
    _kmRfxTimer = setInterval(function() {
        _kmRfxGnSure--; let e = document.getElementById('km-rfx-gn-sure'); if(e) e.textContent = _kmRfxGnSure;
        if(_kmRfxGnSure <= 0) kmRfxGnBitir();
    }, 1000);
}
function kmRfxGnDongu() {
    if(!_kmRfxAktif) return; let a = document.getElementById('km-rfx-gn-alan'); if(!a) return;
    _kmRfxGnBekliyor = false; _kmRfxGnYesil = false; a.style.background = '#1f2937'; a.innerHTML = '<span style="color:#64748b;">Hazır ol...</span>';
    let goster = Math.max(430, 850 - _kmRfxGnDogru * 18);
    _kmRfxSpawnT = setTimeout(function() {
        if(!_kmRfxAktif) return; let yesil = Math.random() < 0.58; _kmRfxGnYesil = yesil; _kmRfxGnBekliyor = true;
        a.style.background = yesil ? '#10b981' : '#ef4444'; a.innerHTML = yesil ? 'DOKUN!' : 'DURMA ✋';
        try { sesCal(yesil ? 900 : 400, 0.1); } catch(e) {}
        _kmRfxSpawnT = setTimeout(function() { if(!_kmRfxAktif) return; _kmRfxGnBekliyor = false; kmRfxGnDongu(); }, goster);
    }, 380 + Math.random() * 620);
}
function kmRfxGnDokun() {
    if(!_kmRfxAktif || !_kmRfxGnBekliyor) return;
    if(_kmRfxGnYesil) { _kmRfxGnDogru++; _kmRfxGnCombo++; if(_kmRfxGnCombo > _kmRfxGnEnCombo) _kmRfxGnEnCombo = _kmRfxGnCombo; document.getElementById('km-rfx-gn-dogru').textContent = _kmRfxGnDogru; let c = document.getElementById('km-rfx-gn-combo'); if(c) c.textContent = _kmRfxGnCombo; try { sesCal(1000 + Math.min(500, _kmRfxGnCombo * 35), 0.05); } catch(e) {} }
    else { _kmRfxGnHata++; _kmRfxGnCombo = 0; document.getElementById('km-rfx-gn-hata').textContent = _kmRfxGnHata; let c = document.getElementById('km-rfx-gn-combo'); if(c) c.textContent = '0'; try { sesCal(250, 0.15); } catch(e) {} }
    _kmRfxGnBekliyor = false; if(_kmRfxSpawnT) clearTimeout(_kmRfxSpawnT); kmRfxGnDongu();
}
function kmRfxGnBitir() {
    kmRfxTemizle(); let net = Math.max(0, _kmRfxGnDogru - _kmRfxGnHata);
    let ozet = net >= 18 ? 'Karar hızın ve kontrolün harika!' : net >= 9 ? 'İyi! Kırmızıda durmaya dikkat et.' : 'Acele etme, önce rengi gör sonra dokun.';
    kmRfxSonucGoster('gonogo', net, ozet);
}
// --- Hızlı Dokunuş: 5 saniyede en çok dokunuş ---
let _kmRfxTapSkor = 0, _kmRfxTapKalan = 5;
function kmRfxTapKur(sahne) {
    _kmRfxAktif = true; _kmRfxTapSkor = 0; _kmRfxTapKalan = 5.0;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>⏱️ <span id="km-rfx-tap-sure">5.0</span>s</div><div>💥 <span id="km-rfx-tap-skor" style="font-size:20px;">0</span></div></div>
        <button id="km-rfx-tap-btn" class="km-rfx-tap-btn" onclick="kmRfxTapDokun()">DOKUN! DOKUN!</button>`;
    _kmRfxTimer = setInterval(function() {
        _kmRfxTapKalan -= 0.1; if(_kmRfxTapKalan < 0) _kmRfxTapKalan = 0;
        let e = document.getElementById('km-rfx-tap-sure'); if(e) { e.textContent = _kmRfxTapKalan.toFixed(1); if(_kmRfxTapKalan <= 1) e.style.color = '#ef4444'; }
        if(_kmRfxTapKalan <= 0) kmRfxTapBitir();
    }, 100);
}
function kmRfxTapDokun() {
    if(!_kmRfxAktif) return;
    _kmRfxTapSkor++;
    let s = document.getElementById('km-rfx-tap-skor'); if(s) s.textContent = _kmRfxTapSkor;
    try { sesCal(780 + Math.min(400, _kmRfxTapSkor * 8), 0.025); } catch(e) {}
}
function kmRfxTapBitir() {
    kmRfxTemizle();
    let hiz = (_kmRfxTapSkor / 5).toFixed(1);
    let ozet = (_kmRfxTapSkor >= 50 ? 'Efsane hız! Zihin-parmak bağlantın çok güçlü.' : _kmRfxTapSkor >= 35 ? 'Harika tempo!' : _kmRfxTapSkor >= 20 ? 'İyi başlangıç!' : 'Daha hızlı — rahat tut, zorlama.') + ' (' + hiz + '/sn)';
    kmRfxSonucGoster('tap', _kmRfxTapSkor, ozet);
}
// --- Odak Kilidi: sayılara sırayla dokun, 3x3'ü bitirince ızgara 4x4'e büyür ---
let _kmRfxOdakSure = 30, _kmRfxOdakSkor = 0, _kmRfxOdakHata = 0, _kmRfxOdakHedef = 1, _kmRfxOdakBoyut = 3;
function kmRfxOdakKur(sahne) {
    _kmRfxAktif = true; _kmRfxOdakSure = 30; _kmRfxOdakSkor = 0; _kmRfxOdakHata = 0; _kmRfxOdakHedef = 1; _kmRfxOdakBoyut = 3;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>⏱️ <span id="km-rfx-odak-sure">30</span>s</div><div>Sırada: <b id="km-rfx-odak-hedef">1</b></div><div>✅ <span id="km-rfx-odak-skor">0</span> · ❌ <span id="km-rfx-odak-hata">0</span></div></div>
        <div id="km-rfx-odak-grid" class="km-rfx-odak-grid"></div>
        <div id="km-rfx-odak-mesaj" class="km-rfx-odak-mesaj"></div>`;
    kmRfxOdakGridCiz();
    _kmRfxTimer = setInterval(function() {
        _kmRfxOdakSure--; let e = document.getElementById('km-rfx-odak-sure'); if(e) e.textContent = _kmRfxOdakSure;
        if(_kmRfxOdakSure <= 0) kmRfxOdakBitir();
    }, 1000);
}
function kmRfxOdakGridCiz() {
    let g = document.getElementById('km-rfx-odak-grid'); if(!g) return;
    let max = _kmRfxOdakBoyut * _kmRfxOdakBoyut;
    g.style.gridTemplateColumns = 'repeat(' + _kmRfxOdakBoyut + ',1fr)';
    let nums = Array.from({ length: max }, function(_, i) { return i + 1; });
    for(let i = nums.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1)); let t = nums[i]; nums[i] = nums[j]; nums[j] = t; }
    g.innerHTML = nums.map(function(n) { return `<button class="km-rfx-odak-hucre" onclick="kmRfxOdakBas(${n})" data-n="${n}">${n}</button>`; }).join('');
}
function kmRfxOdakBas(n) {
    if(!_kmRfxAktif) return;
    if(n === _kmRfxOdakHedef) {
        _kmRfxOdakSkor++; _kmRfxOdakHedef++;
        let e = document.getElementById('km-rfx-odak-skor'); if(e) e.textContent = _kmRfxOdakSkor;
        try { sesCal(900 + Math.min(200, _kmRfxOdakSkor * 5), 0.04); } catch(err) {}
        let b = document.querySelector('#km-rfx-odak-grid button[data-n="' + n + '"]'); if(b) { b.classList.add('dogru'); b.disabled = true; }
        let max = _kmRfxOdakBoyut * _kmRfxOdakBoyut;
        if(_kmRfxOdakHedef > max) {
            _kmRfxOdakHedef = 1;
            if(_kmRfxOdakBoyut === 3) _kmRfxOdakBoyut = 4;
            let me = document.getElementById('km-rfx-odak-mesaj'); if(me) { me.textContent = _kmRfxOdakBoyut === 4 ? '⬆️ SEVİYE ATLADI! 4×4 ızgara!' : '✓ Tur tamamlandı!'; setTimeout(function() { if(me) me.textContent = ''; }, 900); }
            kmRfxOdakGridCiz();
        }
        let he = document.getElementById('km-rfx-odak-hedef'); if(he) he.textContent = _kmRfxOdakHedef;
    } else {
        _kmRfxOdakHata++;
        let h = document.getElementById('km-rfx-odak-hata'); if(h) h.textContent = _kmRfxOdakHata;
        let me = document.getElementById('km-rfx-odak-mesaj'); if(me) { me.textContent = '❌ Yanlış! -2sn'; setTimeout(function() { if(me) me.textContent = ''; }, 700); }
        _kmRfxOdakSure = Math.max(0, _kmRfxOdakSure - 2);
        try { sesCal(250, 0.12); } catch(e) {}
        let btn = document.querySelector('#km-rfx-odak-grid button[data-n="' + n + '"]'); if(btn) { btn.classList.add('yanlis'); setTimeout(function() { if(btn) btn.classList.remove('yanlis'); }, 400); }
    }
}
function kmRfxOdakBitir() {
    kmRfxTemizle();
    let ozet = _kmRfxOdakSkor >= 25 ? '4×4 ızgarayı da geçtin! Görsel tarama refleksin çok güçlü.' : _kmRfxOdakSkor >= 14 ? 'İyi! 4×4 seviyesine ulaşmayı hedefle.' : 'Sayıları göz ile tara, sırayla bul — acele etme.';
    kmRfxSonucGoster('odak', _kmRfxOdakSkor, ozet);
}
// --- Hafıza: yanan renk sırasını izle, aynı sırayla tekrarla (Simon) ---
let _kmRfxHfDizi = [], _kmRfxHfAdim = 0, _kmRfxHfGosteriyor = false;
function kmRfxHfRenk(i) { return ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'][i]; }
function kmRfxHfKur(sahne) {
    // _kmRfxHfGosteriyor BAŞTA true — ilk renk gösterilmeden önceki 700ms'de bir tuşa erken
    // basılırsa (gerçek testte bulunan bug) _kmRfxHfDizi henüz BOŞ olduğundan "yanlış" sayılıp
    // oyun anında bitiyordu; artık dizi gelene kadar dokunuşlar engelleniyor.
    _kmRfxAktif = true; _kmRfxHfDizi = []; _kmRfxHfAdim = 0; _kmRfxHfGosteriyor = true;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>Seviye: <b id="km-rfx-hf-sv">0</b></div></div>
        <div id="km-rfx-hf-mesaj" class="km-rfx-hf-mesaj">İzle...</div>
        <div class="km-rfx-hf-grid">${[0, 1, 2, 3].map(function(i) { return `<button id="km-rfx-hf-${i}" class="km-rfx-hf-tus" style="--_c:${kmRfxHfRenk(i)};" onclick="kmRfxHfBas(${i})"></button>`; }).join('')}</div>`;
    _kmRfxSpawnT = setTimeout(kmRfxHfYeniTur, 700);
}
function kmRfxHfYeniTur() {
    if(!_kmRfxAktif) return;
    _kmRfxHfDizi.push(Math.floor(Math.random() * 4));
    _kmRfxHfAdim = 0; _kmRfxHfGosteriyor = true;
    let sv = document.getElementById('km-rfx-hf-sv'); if(sv) sv.textContent = _kmRfxHfDizi.length - 1;
    let me = document.getElementById('km-rfx-hf-mesaj'); if(me) me.textContent = 'İzle...';
    let i = 0;
    function adim() {
        if(!_kmRfxAktif) return;
        if(i >= _kmRfxHfDizi.length) { _kmRfxHfGosteriyor = false; let m2 = document.getElementById('km-rfx-hf-mesaj'); if(m2) m2.textContent = 'Sıra sende!'; return; }
        let idx = _kmRfxHfDizi[i];
        let b = document.getElementById('km-rfx-hf-' + idx);
        if(b) { b.classList.add('yaniyor'); try { sesCal(300 + idx * 150, 0.2); } catch(e) {} setTimeout(function() { if(b) b.classList.remove('yaniyor'); }, 380); }
        i++;
        _kmRfxSpawnT = setTimeout(adim, 560);
    }
    adim();
}
function kmRfxHfBas(i) {
    if(!_kmRfxAktif || _kmRfxHfGosteriyor) return;
    let b = document.getElementById('km-rfx-hf-' + i);
    if(b) { b.classList.add('basildi'); setTimeout(function() { if(b) b.classList.remove('basildi'); }, 150); }
    if(_kmRfxHfDizi[_kmRfxHfAdim] === i) {
        _kmRfxHfAdim++;
        try { sesCal(300 + i * 150, 0.12); } catch(e) {}
        if(_kmRfxHfAdim >= _kmRfxHfDizi.length) {
            // Sonraki tur baslayana kadar (900ms) heyecanla erken basmayi ENGELLE — yoksa dizi
            // uzunlugunu asan bir index sorgulanip "yanlis" sayilir, oyun haksiz yere biter
            // (Hafiza'nin ilk-tur bugüyle AYNI kök neden, ikinci bir yerde tekrar bulundu).
            _kmRfxHfGosteriyor = true;
            let me = document.getElementById('km-rfx-hf-mesaj'); if(me) me.textContent = 'Doğru! Sıradaki...'; _kmRfxSpawnT = setTimeout(kmRfxHfYeniTur, 900);
        }
    } else {
        try { sesCal(180, 0.3); } catch(e) {}
        kmRfxHfBitir();
    }
}
function kmRfxHfBitir() {
    kmRfxTemizle();
    let seviye = Math.max(0, _kmRfxHfDizi.length - 1);
    let ozet = seviye >= 8 ? 'Hafızan mükemmel! Uzun sıraları kolayca hatırlıyorsun.' : seviye >= 4 ? 'İyi hafıza! Biraz daha yükseklere çıkabilirsin.' : 'Rengi izlerken sesli tekrar et, hafızana yardımcı olur.';
    kmRfxSonucGoster('hafiza', seviye, ozet);
}
// --- Hedef Takip: hareket eden noktayı parmağınla akıcı takip et ---
let _kmRfxTkSure = 20, _kmRfxTkOnHedef = 0, _kmRfxTkFaz = 0, _kmRfxTkFx = -999, _kmRfxTkFy = -999, _kmRfxTkTx = 0, _kmRfxTkTy = 0;
function kmRfxTkKur(sahne) {
    _kmRfxAktif = true; _kmRfxTkSure = 20; _kmRfxTkOnHedef = 0; _kmRfxTkFaz = 0; _kmRfxTkFx = -999; _kmRfxTkFy = -999;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>⏱️ <span id="km-rfx-tk-sure">20</span>s</div><div>Üstünde: <b id="km-rfx-tk-skor">0.0</b>s</div></div>
        <div id="km-rfx-tk-alan" class="km-rfx-tk-alan" onpointermove="kmRfxTkMove(event)" onpointerdown="kmRfxTkMove(event)"><div id="km-rfx-tk-hedef" class="km-rfx-tk-hedef"></div></div>
        <div class="km-rfx-tk-not">Parmağını altın noktanın üstünde tut, akıcı takip et.</div>`;
    let alanEl = document.getElementById('km-rfx-tk-alan'), hedef = document.getElementById('km-rfx-tk-hedef');
    _kmRfxTimer = setInterval(function() {
        _kmRfxTkFaz += 0.03;
        let w = alanEl ? alanEl.clientWidth : 300, h = alanEl ? alanEl.clientHeight : 320;
        _kmRfxTkTx = w / 2 + Math.sin(_kmRfxTkFaz * 1.1) * (w * 0.36) + Math.sin(_kmRfxTkFaz * 0.5) * (w * 0.08);
        _kmRfxTkTy = h / 2 + Math.cos(_kmRfxTkFaz * 0.9) * (h * 0.34) + Math.cos(_kmRfxTkFaz * 1.7) * (h * 0.07);
        if(hedef) { hedef.style.left = _kmRfxTkTx + 'px'; hedef.style.top = _kmRfxTkTy + 'px'; }
        let d = Math.sqrt(Math.pow(_kmRfxTkFx - _kmRfxTkTx, 2) + Math.pow(_kmRfxTkFy - _kmRfxTkTy, 2));
        if(d < 42) { _kmRfxTkOnHedef += 0.05; let s = document.getElementById('km-rfx-tk-skor'); if(s) s.textContent = _kmRfxTkOnHedef.toFixed(1); if(hedef) hedef.classList.add('uzerinde'); }
        else if(hedef) hedef.classList.remove('uzerinde');
    }, 50);
    _kmRfxTimer2 = setInterval(function() {
        _kmRfxTkSure--; let e = document.getElementById('km-rfx-tk-sure'); if(e) e.textContent = _kmRfxTkSure;
        if(_kmRfxTkSure <= 0) kmRfxTkBitir();
    }, 1000);
}
function kmRfxTkMove(e) {
    if(!_kmRfxAktif) return;
    let alanEl = document.getElementById('km-rfx-tk-alan'); if(!alanEl) return;
    let r = alanEl.getBoundingClientRect();
    _kmRfxTkFx = e.clientX - r.left; _kmRfxTkFy = e.clientY - r.top;
}
function kmRfxTkBitir() {
    kmRfxTemizle();
    let ozet = _kmRfxTkOnHedef >= 14 ? 'Takibin çok akıcı — nişanın sakin ve kontrollü!' : _kmRfxTkOnHedef >= 7 ? 'İyi! Daha yumuşak, öngörerek takip et.' : 'Sert hareket etme; noktanın gideceği yeri tahmin edip akıcı kal.';
    kmRfxSonucGoster('takip', Math.round(_kmRfxTkOnHedef * 10) / 10, ozet);
}
// --- Skor Sayımı: okların toplamını bul, doğru şıkka dokun ---
let _kmRfxSySure = 30, _kmRfxSyDogru = 0, _kmRfxSyCevap = 0;
function kmRfxSyKur(sahne) {
    _kmRfxAktif = true; _kmRfxSySure = 30; _kmRfxSyDogru = 0;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>⏱️ <span id="km-rfx-sy-sure">30</span>s</div><div>✅ <span id="km-rfx-sy-dogru">0</span></div></div>
        <div id="km-rfx-sy-soru" class="km-rfx-sy-soru"></div>
        <div id="km-rfx-sy-secenek" class="km-rfx-sy-secenek"></div>`;
    kmRfxSySoru();
    _kmRfxTimer = setInterval(function() {
        _kmRfxSySure--; let e = document.getElementById('km-rfx-sy-sure'); if(e) e.textContent = _kmRfxSySure;
        if(_kmRfxSySure <= 0) kmRfxSyBitir();
    }, 1000);
}
function kmRfxSySoru() {
    if(!_kmRfxAktif) return;
    let n = 3 + Math.floor(Math.random() * 4), degerler = ['X', '10', '9', '8', '7', '6', '5'], oklar = [], toplam = 0;
    for(let i = 0; i < n; i++) { let d = degerler[Math.floor(Math.random() * degerler.length)]; oklar.push(d); toplam += (d === 'X' ? 10 : parseInt(d, 10)); }
    _kmRfxSyCevap = toplam;
    let soru = document.getElementById('km-rfx-sy-soru'); if(soru) soru.textContent = '🎯 ' + oklar.join('  ');
    let secs = new Set([toplam]), guard = 0;
    while(secs.size < 4 && guard < 50) { let off = Math.floor(Math.random() * 11) - 5; guard++; if(off !== 0) secs.add(Math.max(0, toplam + off)); }
    let arr = Array.from(secs).sort(function() { return Math.random() - 0.5; });
    let sec = document.getElementById('km-rfx-sy-secenek');
    if(sec) sec.innerHTML = arr.map(function(v) { return `<button class="km-rfx-sy-btn" onclick="kmRfxSyCevapla(${v})">${v}</button>`; }).join('');
}
function kmRfxSyCevapla(v) {
    if(!_kmRfxAktif) return;
    if(v === _kmRfxSyCevap) { _kmRfxSyDogru++; let e = document.getElementById('km-rfx-sy-dogru'); if(e) e.textContent = _kmRfxSyDogru; try { sesCal(950, 0.05); } catch(e) {} }
    else { try { sesCal(220, 0.15); } catch(e) {} }
    kmRfxSySoru();
}
function kmRfxSyBitir() {
    kmRfxTemizle();
    let ozet = _kmRfxSyDogru >= 12 ? 'Zihinden toplama şimşek gibi!' : _kmRfxSyDogru >= 6 ? "İyi! Onlukları (X+10) birlikte topla." : "Acele etme; önce X ve 10'ları say.";
    kmRfxSonucGoster('sayim', _kmRfxSyDogru, ozet);
}
// --- Grup At: 6 dokunuşu aynı noktaya toplama (tutarlılık) ---
let _kmRfxGrNoktalar = [], _kmRfxGrKalan = 6;
function kmRfxGrKur(sahne) {
    _kmRfxAktif = true; _kmRfxGrNoktalar = []; _kmRfxGrKalan = 6;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>Kalan ok: <b id="km-rfx-gr-kalan">6</b></div></div>
        <div id="km-rfx-gr-alan" class="km-rfx-gr-alan" onclick="kmRfxGrAt(event)"></div>
        <div class="km-rfx-tk-not">Aynı noktaya 6 kez dokun. Hız değil, tutarlılık!</div>`;
}
function kmRfxGrAt(e) {
    if(!_kmRfxAktif || _kmRfxGrKalan <= 0) return;
    let alan = document.getElementById('km-rfx-gr-alan'); if(!alan) return;
    let r = alan.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    _kmRfxGrNoktalar.push({ x: x, y: y }); _kmRfxGrKalan--;
    let dot = document.createElement('div'); dot.className = 'km-rfx-gr-dot'; dot.style.left = x + 'px'; dot.style.top = y + 'px';
    alan.appendChild(dot);
    try { sesCal(700, 0.05); } catch(e) {}
    let k = document.getElementById('km-rfx-gr-kalan'); if(k) k.textContent = _kmRfxGrKalan;
    if(_kmRfxGrKalan <= 0) _kmRfxSpawnT = setTimeout(kmRfxGrBitir, 500);
}
function kmRfxGrBitir() {
    _kmRfxAktif = false;
    let cx = _kmRfxGrNoktalar.reduce(function(a, p) { return a + p.x; }, 0) / _kmRfxGrNoktalar.length;
    let cy = _kmRfxGrNoktalar.reduce(function(a, p) { return a + p.y; }, 0) / _kmRfxGrNoktalar.length;
    let mesafeler = _kmRfxGrNoktalar.map(function(p) { return Math.sqrt(Math.pow(p.x - cx, 2) + Math.pow(p.y - cy, 2)); });
    let ortMesafe = mesafeler.reduce(function(a, b) { return a + b; }, 0) / mesafeler.length;
    let maxMesafe = Math.max.apply(null, mesafeler);
    let cap = Math.round(maxMesafe * 2);
    // Küçük çap = iyi performans, ama rekor sistemi "büyük puan = iyi" varsayıyor — bu yüzden
    // gösterilen puan çapın TERSİ (200-çap), çap ise metinde ayrıca belirtiliyor.
    let puan = Math.max(1, 200 - cap);
    let ozet = (ortMesafe < 18 ? 'İnanılmaz sıkı grup — tutarlılığın profesyonel!' : ortMesafe < 40 ? 'İyi grup! Aynı rutini tekrarlamaya devam et.' : 'Grup biraz dağınık — her ok için aynı noktaya odaklan.') + ' (Grup çapı: ' + cap + 'px)';
    kmRfxSonucGoster('grup', puan, ozet);
}
// --- Nefes Ritmi: daire tepe/dipteyken tam zamanında dokun ---
let _kmRfxNfFaz = 0, _kmRfxNfIyi = 0, _kmRfxNfSure = 25, _kmRfxNfSonIyi = 0, _kmRfxNfTick = 0;
function kmRfxNfKur(sahne) {
    _kmRfxAktif = true; _kmRfxNfFaz = 0; _kmRfxNfIyi = 0; _kmRfxNfSure = 25; _kmRfxNfSonIyi = 0; _kmRfxNfTick = 0;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>⏱️ <span id="km-rfx-nf-sure">25</span>s</div><div>Ritim: <span id="km-rfx-nf-iyi">0</span></div></div>
        <div id="km-rfx-nf-alan" class="km-rfx-nf-alan" onclick="kmRfxNfDokun()">
            <div id="km-rfx-nf-daire" class="km-rfx-nf-daire"></div>
            <div id="km-rfx-nf-mesaj" class="km-rfx-nf-mesaj">Tepe/dip anında DOKUN</div>
        </div>`;
    _kmRfxTimer = setInterval(function() {
        _kmRfxNfFaz += 0.05; let val = Math.sin(_kmRfxNfFaz), scale = 1 + 0.6 * val;
        let daire = document.getElementById('km-rfx-nf-daire');
        if(daire) { daire.style.transform = 'scale(' + scale.toFixed(2) + ')'; daire.textContent = val >= 0 ? 'AL' : 'VER'; }
        _kmRfxNfTick++;
        if(_kmRfxNfTick % 20 === 0) { _kmRfxNfSure--; let su = document.getElementById('km-rfx-nf-sure'); if(su) su.textContent = _kmRfxNfSure; if(_kmRfxNfSure <= 0) kmRfxNfBitir(); }
    }, 50);
}
function kmRfxNfDokun() {
    if(!_kmRfxAktif) return;
    let val = Math.sin(_kmRfxNfFaz), now = performance.now(), mesaj = document.getElementById('km-rfx-nf-mesaj');
    if(Math.abs(val) > 0.85 && (now - _kmRfxNfSonIyi) > 1300) {
        _kmRfxNfIyi++; _kmRfxNfSonIyi = now; let e = document.getElementById('km-rfx-nf-iyi'); if(e) e.textContent = _kmRfxNfIyi;
        if(mesaj) { mesaj.textContent = '✓ Tam ritimde!'; mesaj.classList.add('iyi'); }
        try { sesCal(880, 0.08); } catch(e) {}
    } else if(mesaj) { mesaj.textContent = 'Tepe/dip anını bekle...'; mesaj.classList.remove('iyi'); }
}
function kmRfxNfBitir() {
    kmRfxTemizle();
    let ozet = _kmRfxNfIyi >= 16 ? 'Nefes ritmin çok iyi — atıştan önce bu sakinliği kullan!' : _kmRfxNfIyi >= 8 ? 'Güzel. Nefesi yavaşlat, tepe/dibi hisset.' : 'Acele etme; daireyle birlikte yavaş nefes al-ver.';
    kmRfxSonucGoster('nefes', _kmRfxNfIyi, ozet);
}
// --- Sabır (Hedef Panik): basılı tut, komut gelince sarıya bırak ---
let _kmRfxSbTur = 0, _kmRfxSbBasari = 0, _kmRfxSbHazir = false, _kmRfxSbBasili = false, _kmRfxSbFaz = 0, _kmRfxSbPinX = 0, _kmRfxSbPinY = 0;
function kmRfxSbKur(sahne) {
    _kmRfxAktif = true; _kmRfxSbTur = 0; _kmRfxSbBasari = 0; _kmRfxSbHazir = false; _kmRfxSbBasili = false;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>Tur: <b id="km-rfx-sb-tur">0</b>/5</div><div>İsabet: <b id="km-rfx-sb-basari">0</b></div></div>
        <div id="km-rfx-sb-ekran" class="km-rfx-sb-ekran">
            <div class="km-rfx-hedef-merkez"></div>
            <div class="km-rfx-sb-halka"></div>
            <div id="km-rfx-sb-pin" class="km-rfx-basili-pin"><i></i><i></i></div>
            <div id="km-rfx-sb-mesaj" class="km-rfx-ds-mesaj">Hazır mısın?</div>
        </div>
        <div class="km-rfx-tk-not">BASILI tut, sarı komutu bekle; sonra nişangahı SARIYA getirip bırak!</div>
        <button id="km-rfx-sb-btn" class="km-rfx-basili-btn" onpointerdown="kmRfxSbBasla(event)" onpointerup="kmRfxSbBirak(event)" onpointerleave="kmRfxSbBirak(event)">🎯 NİŞAN AL (BASILI TUT)</button>`;
}
function kmRfxSbBasla(e) {
    if(e) e.preventDefault();
    if(_kmRfxSbBasili || _kmRfxSbTur >= 5) return;
    _kmRfxSbBasili = true; _kmRfxAktif = true; _kmRfxSbHazir = false; _kmRfxSbFaz = 0;
    let ekran = document.getElementById('km-rfx-sb-ekran'), mesaj = document.getElementById('km-rfx-sb-mesaj'), pin = document.getElementById('km-rfx-sb-pin');
    if(ekran) ekran.classList.remove('hazir', 'basarili', 'basarisiz');
    if(mesaj) mesaj.textContent = 'Süzülüyor... sabret';
    if(pin) pin.style.opacity = '1';
    _kmRfxTimer = setInterval(function() {
        _kmRfxSbFaz += 0.08;
        let dx = Math.sin(_kmRfxSbFaz * 1.3) * 26 + Math.sin(_kmRfxSbFaz * 0.7) * 10;
        let dy = Math.cos(_kmRfxSbFaz) * 22 + Math.cos(_kmRfxSbFaz * 1.7) * 8;
        _kmRfxSbPinX = dx; _kmRfxSbPinY = dy;
        if(pin) pin.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    }, 40);
    let bekle = 1600 + Math.random() * 3400;
    _kmRfxSpawnT = setTimeout(function() {
        if(!_kmRfxSbBasili) return; _kmRfxSbHazir = true;
        if(ekran) ekran.classList.add('hazir');
        if(mesaj) mesaj.textContent = '🟡 SERBEST! Sarıya getir, BIRAK';
        try { sesCal(1200, 0.15); } catch(e) {}
    }, bekle);
}
function kmRfxSbBirak(e) {
    if(!_kmRfxSbBasili) return; _kmRfxSbBasili = false;
    if(_kmRfxTimer) { clearInterval(_kmRfxTimer); _kmRfxTimer = null; }
    if(_kmRfxSpawnT) { clearTimeout(_kmRfxSpawnT); _kmRfxSpawnT = null; }
    let ekran = document.getElementById('km-rfx-sb-ekran'), mesaj = document.getElementById('km-rfx-sb-mesaj'), pin = document.getElementById('km-rfx-sb-pin');
    if(pin) pin.style.opacity = '0';
    _kmRfxSbTur++;
    if(ekran) ekran.classList.remove('hazir');
    if(!_kmRfxSbHazir) { if(ekran) ekran.classList.add('basarisiz'); if(mesaj) mesaj.textContent = '❌ ACELE ETTİN! Komutu bekle.'; try { sesCal(200, 0.3); } catch(e) {} }
    else {
        let d = Math.sqrt(_kmRfxSbPinX * _kmRfxSbPinX + _kmRfxSbPinY * _kmRfxSbPinY);
        if(d < 16) { _kmRfxSbBasari++; if(ekran) ekran.classList.add('basarili'); if(mesaj) mesaj.textContent = '🎯 TAM SARI! Mükemmel atış!'; try { sesCal(1320, 0.18); } catch(e) {} }
        else if(d < 34) { _kmRfxSbBasari++; if(ekran) ekran.classList.add('basarili'); if(mesaj) mesaj.textContent = '✅ İSABET! Sarıya değdi.'; try { sesCal(1080, 0.15); } catch(e) {} }
        else { if(ekran) ekran.classList.add('basarisiz'); if(mesaj) mesaj.textContent = '❌ Sarıyı tutturamadın.'; try { sesCal(320, 0.2); } catch(e) {} }
    }
    _kmRfxSbHazir = false;
    let et = document.getElementById('km-rfx-sb-tur'); if(et) et.textContent = _kmRfxSbTur;
    let eb = document.getElementById('km-rfx-sb-basari'); if(eb) eb.textContent = _kmRfxSbBasari;
    if(_kmRfxSbTur >= 5) _kmRfxSpawnT2 = setTimeout(kmRfxSbBitir, 1200);
    else _kmRfxSpawnT2 = setTimeout(function() {
        let ek = document.getElementById('km-rfx-sb-ekran'), me = document.getElementById('km-rfx-sb-mesaj');
        if(ek) ek.classList.remove('basarili', 'basarisiz');
        if(me) me.textContent = 'Tekrar bas, nişan al';
    }, 1200);
}
function kmRfxSbBitir() {
    kmRfxTemizle();
    let ozet = _kmRfxSbBasari >= 5 ? 'Sabır + nişan kusursuz! Komutla sarıya bıraktın.' : _kmRfxSbBasari >= 3 ? 'İyi! Komut gelince acele etme.' : 'Önce sarı komutu bekle, sonra nişangahı sarıya getirip bırak.';
    kmRfxSonucGoster('sabir', _kmRfxSbBasari, ozet);
}
// --- Mükemmel Düşüş: yayı ger, yeşilde bırak, sonra DOKUNMA ---
let _kmRfxDsAtis = 0, _kmRfxDsBasari = 0, _kmRfxDsAsama = 'hazir', _kmRfxDsBar = 0;
function kmRfxDsKur(sahne) {
    _kmRfxAktif = true; _kmRfxDsAtis = 0; _kmRfxDsBasari = 0; _kmRfxDsAsama = 'hazir'; _kmRfxDsBar = 0;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>Atış: <b id="km-rfx-ds-atis">0</b>/5</div><div>Mükemmel: <b id="km-rfx-ds-basari">0</b></div></div>
        <div id="km-rfx-ds-sahne" class="km-rfx-ds-sahne">
            <div class="km-rfx-ds-hedef"></div>
            <div id="km-rfx-ds-yay" class="km-rfx-ds-yay">🏹</div>
            <div id="km-rfx-ds-ok" class="km-rfx-ds-ok">➤</div>
            <div id="km-rfx-ds-mesaj" class="km-rfx-ds-mesaj"></div>
        </div>
        <div class="km-rfx-ds-bar-dis"><div class="km-rfx-ds-bar-yesil"></div><div id="km-rfx-ds-bar" class="km-rfx-ds-bar-ic"></div></div>
        <div class="km-rfx-tk-not">Yeşilde bırak → ok gidene kadar DOKUNMA!</div>
        <button id="km-rfx-ds-btn" class="km-rfx-basili-btn" onpointerdown="kmRfxDsCekBasla(event)" onpointerup="kmRfxDsBirak(event)" onpointerleave="kmRfxDsBirak(event)">🏹 YAYI GER (BASILI TUT)</button>`;
}
function kmRfxDsCekBasla(e) {
    if(e) e.preventDefault();
    if(_kmRfxDsAsama !== 'hazir' || _kmRfxDsAtis >= 5) return;
    _kmRfxDsAsama = 'cekiliyor'; _kmRfxDsBar = 0; _kmRfxAktif = true;
    let mesaj = document.getElementById('km-rfx-ds-mesaj'); if(mesaj) mesaj.textContent = '';
    let yay = document.getElementById('km-rfx-ds-yay'); if(yay) yay.style.transform = 'translateY(-50%) scale(1.12)';
    let ok = document.getElementById('km-rfx-ds-ok'); if(ok) { ok.style.transition = 'none'; ok.style.opacity = '0'; ok.style.left = '64px'; ok.style.transform = 'translateY(-50%) rotate(0deg)'; }
    _kmRfxTimer = setInterval(function() { _kmRfxDsBar += 2; if(_kmRfxDsBar > 100) _kmRfxDsBar = 100; let b = document.getElementById('km-rfx-ds-bar'); if(b) b.style.width = _kmRfxDsBar + '%'; }, 30);
}
function kmRfxDsBirak(e) {
    if(_kmRfxDsAsama !== 'cekiliyor') return;
    if(_kmRfxTimer) { clearInterval(_kmRfxTimer); _kmRfxTimer = null; }
    let mesaj = document.getElementById('km-rfx-ds-mesaj'), yay = document.getElementById('km-rfx-ds-yay');
    if(_kmRfxDsBar < 70) {
        _kmRfxDsAsama = 'hazir';
        if(mesaj) { mesaj.textContent = 'Çok erken bıraktın — tam çekişe ulaş (yeşil)'; mesaj.style.color = '#ef4444'; }
        let b = document.getElementById('km-rfx-ds-bar'); if(b) b.style.width = '0%';
        if(yay) yay.style.transform = 'translateY(-50%) scale(1)';
        return;
    }
    _kmRfxDsAsama = 'dusus';
    if(mesaj) { mesaj.textContent = 'Ok atıldı... DOKUNMA!'; mesaj.style.color = '#eab308'; }
    let salla = 0;
    _kmRfxTimer = setInterval(function() { salla++; if(yay) yay.style.transform = 'translateY(-50%) rotate(' + (Math.sin(salla / 2) * 22).toFixed(1) + 'deg)'; }, 60);
    let sahne = document.getElementById('km-rfx-ds-sahne');
    if(sahne) sahne.onpointerdown = function() { if(_kmRfxDsAsama === 'dusus') kmRfxDsSonuc(false); };
    if(_kmRfxDsAtis >= 2) _kmRfxSpawnT2 = setTimeout(function() { try { sesCal(520, 0.12); } catch(e) {} }, 760);
    _kmRfxSpawnT = setTimeout(function() { kmRfxDsSonuc(true); }, 1800);
}
function kmRfxDsSonuc(basarili) {
    if(_kmRfxDsAsama !== 'dusus') return;
    _kmRfxDsAsama = 'hazir';
    if(_kmRfxSpawnT) { clearTimeout(_kmRfxSpawnT); _kmRfxSpawnT = null; }
    if(_kmRfxSpawnT2) { clearTimeout(_kmRfxSpawnT2); _kmRfxSpawnT2 = null; }
    if(_kmRfxTimer) { clearInterval(_kmRfxTimer); _kmRfxTimer = null; }
    let sahne = document.getElementById('km-rfx-ds-sahne'); if(sahne) sahne.onpointerdown = null;
    let yay = document.getElementById('km-rfx-ds-yay'); if(yay) yay.style.transform = 'translateY(-50%) rotate(0deg)';
    let ok = document.getElementById('km-rfx-ds-ok'), mesaj = document.getElementById('km-rfx-ds-mesaj');
    _kmRfxDsAtis++;
    if(basarili) {
        _kmRfxDsBasari++;
        if(ok) { ok.style.transition = 'left .5s ease-out'; ok.style.left = 'calc(100% - 66px)'; ok.style.opacity = '1'; }
        if(mesaj) { mesaj.textContent = '✅ MÜKEMMEL DÜŞÜŞ! Yay doğal düştü.'; mesaj.style.color = '#22c55e'; }
        try { sesCal(1100, 0.25); } catch(e) {}
    } else {
        if(ok) { ok.style.transition = 'left .45s, top .45s, transform .45s'; ok.style.left = 'calc(100% - 30px)'; ok.style.top = '14%'; ok.style.transform = 'translateY(-50%) rotate(-38deg)'; ok.style.opacity = '1'; }
        if(mesaj) { mesaj.textContent = '❌ TORK HATASI! Yayı yakaladın.'; mesaj.style.color = '#ef4444'; }
        try { sesCal(200, 0.3); } catch(e) {}
    }
    let ea = document.getElementById('km-rfx-ds-atis'); if(ea) ea.textContent = _kmRfxDsAtis;
    let eb = document.getElementById('km-rfx-ds-basari'); if(eb) eb.textContent = _kmRfxDsBasari;
    if(_kmRfxDsAtis >= 5) _kmRfxSpawnT = setTimeout(kmRfxDsBitir, 1500);
}
function kmRfxDsBitir() {
    kmRfxTemizle();
    let ozet = _kmRfxDsBasari >= 5 ? 'Bırakış kontrolün profesyonel seviyede!' : _kmRfxDsBasari >= 3 ? 'İyi gidiyorsun, refleksle tutma.' : 'Bıraktıktan sonra eli serbest bırak — tekrar dene!';
    kmRfxSonucGoster('dusus', _kmRfxDsBasari, ozet);
}
// --- Kliker Duvarı: barı doldur, TİK sesinde anında bırak ---
let _kmRfxKlBar = 0, _kmRfxKlFaz = 'bekle', _kmRfxKlTikZaman = 0, _kmRfxKlBasili = false, _kmRfxKlAtisSay = 0, _kmRfxKlBasari = 0;
function kmRfxKlKur(sahne) {
    _kmRfxAktif = true; _kmRfxKlAtisSay = 0; _kmRfxKlBasari = 0; _kmRfxKlFaz = 'bekle'; _kmRfxKlBar = 0;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>Atış: <b id="km-rfx-kl-atis">0</b>/5</div><div>Başarı: <b id="km-rfx-kl-basari">0</b></div></div>
        <div class="km-rfx-kl-sahne">
            <div class="km-rfx-ds-hedef km-rfx-kl-hedef-poz"></div>
            <div id="km-rfx-kl-ok" class="km-rfx-kl-ok">🏹</div>
            <div id="km-rfx-kl-kliker" class="km-rfx-kl-kliker"></div>
            <div id="km-rfx-kl-mesaj" class="km-rfx-ds-mesaj"></div>
        </div>
        <div class="km-rfx-kl-bar-lbl">Kliker barı</div>
        <div class="km-rfx-ds-bar-dis"><div class="km-rfx-kl-bar-yesil"></div><div id="km-rfx-kl-bar" class="km-rfx-ds-bar-ic"></div></div>
        <button id="km-rfx-kl-btn" class="km-rfx-basili-btn" onpointerdown="kmRfxKlBasla(event)" onpointerup="kmRfxKlBirak(event)" onpointerleave="kmRfxKlBirak(event)">🏹 YAYI ÇEK (BASILI TUT)</button>`;
}
function kmRfxKlBasla(e) {
    if(e) e.preventDefault(); if(_kmRfxKlBasili || _kmRfxKlAtisSay >= 5) return;
    _kmRfxKlBasili = true; _kmRfxKlBar = 0; _kmRfxKlFaz = 'cekis'; _kmRfxAktif = true;
    let mesaj = document.getElementById('km-rfx-kl-mesaj'); if(mesaj) { mesaj.textContent = 'Çekiyorsun...'; mesaj.style.color = ''; }
    _kmRfxTimer = setInterval(function() {
        if(!_kmRfxKlBasili) return;
        if(_kmRfxKlFaz === 'cekis') {
            _kmRfxKlBar += 1.8;
            if(_kmRfxKlBar >= 90) { _kmRfxKlBar = 90; _kmRfxKlFaz = 'genisleme'; if(mesaj) { mesaj.textContent = 'SIRTINI SIKMAYA DEVAM ET!'; mesaj.style.color = '#f59e0b'; } }
        } else if(_kmRfxKlFaz === 'genisleme') {
            _kmRfxKlBar += 0.22;
            if(_kmRfxKlBar >= 100) { _kmRfxKlBar = 100; _kmRfxKlFaz = 'tik'; _kmRfxKlTikZaman = performance.now(); kmRfxKlTik(); }
        }
        let b = document.getElementById('km-rfx-kl-bar'); if(b) { b.style.width = _kmRfxKlBar + '%'; b.style.background = _kmRfxKlBar >= 90 ? '#10b981' : '#f59e0b'; }
        let ok = document.getElementById('km-rfx-kl-ok'); if(ok) ok.style.left = (16 + _kmRfxKlBar * 0.45) + 'px';
    }, 30);
}
function kmRfxKlTik() {
    try { sesCal(1800, 0.3); } catch(e) {}
    let kl = document.getElementById('km-rfx-kl-kliker'), mesaj = document.getElementById('km-rfx-kl-mesaj');
    if(kl) { kl.style.transform = 'translateY(28px)'; kl.style.opacity = '0.3'; }
    if(mesaj) { mesaj.textContent = 'TİK! — ŞİMDİ BIRAK!'; mesaj.style.color = '#22c55e'; }
    _kmRfxSpawnT = setTimeout(function() {
        if(_kmRfxKlBasili && _kmRfxKlFaz === 'tik') {
            _kmRfxKlAtisSay++; let et = document.getElementById('km-rfx-kl-atis'); if(et) et.textContent = _kmRfxKlAtisSay;
            let me = document.getElementById('km-rfx-kl-mesaj'); if(me) { me.textContent = '⏰ GEÇ KALDIN, HEDEF KAÇTI!'; me.style.color = '#ef4444'; }
            kmRfxKlSifirla();
        }
    }, 500);
}
function kmRfxKlBirak(e) {
    if(!_kmRfxKlBasili) return; _kmRfxKlBasili = false;
    if(_kmRfxTimer) { clearInterval(_kmRfxTimer); _kmRfxTimer = null; }
    if(_kmRfxSpawnT) { clearTimeout(_kmRfxSpawnT); _kmRfxSpawnT = null; }
    _kmRfxKlAtisSay++;
    let mesaj = document.getElementById('km-rfx-kl-mesaj');
    if(_kmRfxKlFaz === 'cekis' || _kmRfxKlFaz === 'genisleme') {
        if(mesaj) { mesaj.textContent = '❌ KLİKERDEN ÖNCE ATTIN!'; mesaj.style.color = '#ef4444'; }
        try { sesCal(220, 0.2); } catch(e) {}
        kmRfxKlSifirla();
    } else if(_kmRfxKlFaz === 'tik') {
        let gecen = performance.now() - _kmRfxKlTikZaman;
        if(gecen <= 480) {
            _kmRfxKlBasari++;
            if(mesaj) { mesaj.textContent = '✅ MÜKEMMEL! (' + Math.round(gecen) + 'ms)'; mesaj.style.color = '#22c55e'; }
            try { sesCal(1100, 0.15); } catch(e) {}
            kmRfxKlSifirla();
        }
    }
}
function kmRfxKlSifirla() {
    _kmRfxKlFaz = 'bekle'; _kmRfxKlBar = 0; _kmRfxKlTikZaman = 0;
    let eb = document.getElementById('km-rfx-kl-basari'); if(eb) eb.textContent = _kmRfxKlBasari;
    let et = document.getElementById('km-rfx-kl-atis'); if(et) et.textContent = _kmRfxKlAtisSay;
    if(_kmRfxKlAtisSay >= 5) { _kmRfxSpawnT2 = setTimeout(kmRfxKlBitir, 1000); return; }
    _kmRfxSpawnT2 = setTimeout(function() {
        let b = document.getElementById('km-rfx-kl-bar'); if(b) { b.style.width = '0%'; b.style.background = '#f59e0b'; }
        let ok = document.getElementById('km-rfx-kl-ok'); if(ok) ok.style.left = '16px';
        let kl = document.getElementById('km-rfx-kl-kliker'); if(kl) { kl.style.transform = ''; kl.style.opacity = '1'; }
        let me = document.getElementById('km-rfx-kl-mesaj'); if(me) { me.textContent = 'Tekrar basılı tut'; me.style.color = ''; }
    }, 1100);
}
function kmRfxKlBitir() {
    kmRfxTemizle();
    let ozet = _kmRfxKlBasari >= 5 ? 'Kliker hakimiyetin mükemmel!' : _kmRfxKlBasari >= 3 ? 'İyi gidiyorsun. Genişleme fazında sabırsızlanma.' : 'Kliker düşmeden bırakma — tik sesini bekle.';
    kmRfxSonucGoster('kliker', _kmRfxKlBasari, ozet);
}
// --- Kaos Odak: sahte sinyale kanma, sadece merkez YEŞİL'e dön bırak ---
let _kmRfxKaosBasili = false, _kmRfxKaosHazir = false, _kmRfxKaosTur = 0, _kmRfxKaosBasari = 0, _kmRfxKaosFaz = 0;
function kmRfxKaosKur(sahne) {
    _kmRfxAktif = true; _kmRfxKaosTur = 0; _kmRfxKaosBasari = 0; _kmRfxKaosBasili = false; _kmRfxKaosHazir = false;
    sahne.innerHTML = `<div class="km-rfx-hud"><div>Tur: <b id="km-rfx-kaos-tur">0</b>/5</div><div>İsabet: <b id="km-rfx-kaos-basari">0</b></div></div>
        <div id="km-rfx-kaos-ekran" class="km-rfx-kaos-ekran">
            <div class="km-rfx-hedef-merkez"></div>
            <div id="km-rfx-kaos-merkez" class="km-rfx-kaos-merkez"></div>
            <div id="km-rfx-kaos-pin" class="km-rfx-basili-pin"><i></i><i></i></div>
            <div id="km-rfx-kaos-overlay" class="km-rfx-kaos-overlay"></div>
            <div id="km-rfx-kaos-mesaj" class="km-rfx-ds-mesaj" style="top:auto; bottom:8px;">Hazır mısın?</div>
        </div>
        <div class="km-rfx-tk-not">BASILI tut. Sahte sinyallere kanma! Yalnızca merkez YEŞİL'e dönünce bırak.</div>
        <button id="km-rfx-kaos-btn" class="km-rfx-basili-btn" onpointerdown="kmRfxKaosBasla(event)" onpointerup="kmRfxKaosBirak(event)" onpointerleave="kmRfxKaosBirak(event)">🎯 NİŞAN AL (BASILI TUT)</button>`;
}
function kmRfxKaosBasla(e) {
    if(e) e.preventDefault(); if(_kmRfxKaosBasili || _kmRfxKaosTur >= 5) return;
    _kmRfxKaosBasili = true; _kmRfxAktif = true; _kmRfxKaosHazir = false; _kmRfxKaosFaz = 0;
    let pin = document.getElementById('km-rfx-kaos-pin'), mesaj = document.getElementById('km-rfx-kaos-mesaj');
    if(pin) pin.style.opacity = '1'; if(mesaj) mesaj.textContent = 'Odaklan...';
    _kmRfxTimer = setInterval(function() {
        _kmRfxKaosFaz += 0.09;
        let dx = Math.sin(_kmRfxKaosFaz * 1.2) * 24 + Math.sin(_kmRfxKaosFaz * 0.6) * 9, dy = Math.cos(_kmRfxKaosFaz) * 20 + Math.cos(_kmRfxKaosFaz * 1.6) * 7;
        if(pin) pin.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    }, 40);
    kmRfxKaosParazit();
    let gercek = 2500 + Math.random() * 3000;
    _kmRfxSpawnT = setTimeout(function() {
        if(!_kmRfxKaosBasili) return; _kmRfxKaosHazir = true;
        let m = document.getElementById('km-rfx-kaos-merkez'); if(m) m.classList.add('yesil');
        if(mesaj) { mesaj.textContent = '🟢 BIRAK!'; mesaj.style.color = '#22c55e'; }
        try { sesCal(1300, 0.15); } catch(e) {}
    }, gercek);
}
function kmRfxKaosParazit() {
    if(!_kmRfxKaosBasili || !_kmRfxAktif) return;
    let ov = document.getElementById('km-rfx-kaos-overlay'); if(!ov) return;
    let tip = Math.floor(Math.random() * 3);
    if(tip === 0) { ov.style.background = 'rgba(255,255,255,0.85)'; setTimeout(function() { if(ov) ov.style.background = 'transparent'; }, 90); }
    else if(tip === 1) { ov.innerHTML = '<div class="km-rfx-kaos-at">AT!</div>'; setTimeout(function() { if(ov) ov.innerHTML = ''; }, 320); }
    else { let ekran = document.getElementById('km-rfx-kaos-ekran'); if(ekran) { ekran.style.transform = 'translate(' + ((Math.random() - 0.5) * 8).toFixed(1) + 'px,' + ((Math.random() - 0.5) * 6).toFixed(1) + 'px)'; setTimeout(function() { if(ekran) ekran.style.transform = ''; }, 120); } }
    let sonraki = 600 + Math.random() * 1200;
    _kmRfxSpawnT2 = setTimeout(kmRfxKaosParazit, sonraki);
}
function kmRfxKaosBirak(e) {
    if(!_kmRfxKaosBasili) return; _kmRfxKaosBasili = false;
    if(_kmRfxTimer) { clearInterval(_kmRfxTimer); _kmRfxTimer = null; }
    if(_kmRfxSpawnT) { clearTimeout(_kmRfxSpawnT); _kmRfxSpawnT = null; }
    if(_kmRfxSpawnT2) { clearTimeout(_kmRfxSpawnT2); _kmRfxSpawnT2 = null; }
    let pin = document.getElementById('km-rfx-kaos-pin'), mesaj = document.getElementById('km-rfx-kaos-mesaj'), merkez = document.getElementById('km-rfx-kaos-merkez'), ov = document.getElementById('km-rfx-kaos-overlay');
    if(pin) pin.style.opacity = '0'; if(ov) ov.innerHTML = ''; if(merkez) merkez.classList.remove('yesil');
    _kmRfxKaosTur++;
    if(!_kmRfxKaosHazir) { if(mesaj) { mesaj.textContent = '❌ DİKKATİN DAĞILDI! Sahteye kandın.'; mesaj.style.color = '#ef4444'; } try { sesCal(200, 0.25); } catch(e) {} }
    else { _kmRfxKaosBasari++; if(mesaj) { mesaj.textContent = '✅ TÜNEL ODAK! Gerçek sinyali yakaladın.'; mesaj.style.color = '#22c55e'; } try { sesCal(1200, 0.18); } catch(e) {} }
    _kmRfxKaosHazir = false;
    let et = document.getElementById('km-rfx-kaos-tur'); if(et) et.textContent = _kmRfxKaosTur;
    let eb = document.getElementById('km-rfx-kaos-basari'); if(eb) eb.textContent = _kmRfxKaosBasari;
    if(_kmRfxKaosTur >= 5) _kmRfxSpawnT = setTimeout(kmRfxKaosBitir, 1200);
    else _kmRfxSpawnT = setTimeout(function() { let me = document.getElementById('km-rfx-kaos-mesaj'); if(me) { me.textContent = 'Tekrar bas, odaklan'; me.style.color = ''; } }, 1200);
}
function kmRfxKaosBitir() {
    kmRfxTemizle();
    let ozet = _kmRfxKaosBasari >= 5 ? 'Müsabaka odağın demir gibi!' : _kmRfxKaosBasari >= 3 ? 'İyi! Sahte sinyallere biraz daha sabret.' : 'Odağını sadece merkez yeşil ışığa ver.';
    kmRfxSonucGoster('kaos', _kmRfxKaosBasari, ozet);
}
// --- Son Okun Ağırlığı: 3 set, yorgunlukta bile sarıda kal ---
let _kmRfxYrTur = 0, _kmRfxYrBasari = 0, _kmRfxYrFaz = 0, _kmRfxYrOnHedef = 0;
function kmRfxYrKur(sahne) {
    _kmRfxYrTur = 0; _kmRfxYrBasari = 0;
    kmRfxYrTurBaslat(sahne);
}
function kmRfxYrTurBaslat(sahne) {
    sahne = sahne || document.getElementById('km-rfx-sahne');
    _kmRfxYrFaz = 0; _kmRfxYrOnHedef = 0; _kmRfxAktif = true;
    let turAd = _kmRfxYrTur === 0 ? '1. Set — ZİNDE 💪' : _kmRfxYrTur === 1 ? '2. Set — YORULUYOR 😓' : '3. Set — TÜKENMİŞ 😵';
    let turSinif = _kmRfxYrTur === 0 ? 'zinde' : _kmRfxYrTur === 1 ? 'yoruluyor' : 'tukenmis';
    if(!sahne) return;
    sahne.innerHTML = `<div class="km-rfx-yr-baslik ${turSinif}">${turAd}</div>
        <div class="km-rfx-yr-sure-bar"><div id="km-rfx-yr-sure-ic" class="km-rfx-yr-sure-ic ${turSinif}"></div></div>
        <div id="km-rfx-yr-alan" class="km-rfx-kaos-ekran">
            <div id="km-rfx-yr-blur" class="km-rfx-yr-blur"></div>
            <div class="km-rfx-hedef-merkez"></div>
            <div id="km-rfx-yr-pin" class="km-rfx-basili-pin km-rfx-yr-pin"><i></i><i></i></div>
            <div id="km-rfx-yr-mesaj" class="km-rfx-yr-mesaj ${turSinif}"></div>
            <div class="km-rfx-yr-hedef-sure">Sarıda: <b id="km-rfx-yr-onhedef">0.0</b>s</div>
        </div>
        <button onclick="kmRfxYrAt()" class="km-rfx-basili-btn km-rfx-yr-btn ${turSinif}">🏹 ATIŞ YAP</button>`;
    let titreme = [2, 16, 36][_kmRfxYrTur];
    let sure = 7000, baslama = performance.now(), sureBit = false;
    _kmRfxTimer = setInterval(function() {
        _kmRfxYrFaz += 0.12;
        let shake = titreme + (_kmRfxYrTur >= 1 ? Math.sin(_kmRfxYrFaz * 3) * titreme * 0.6 : 0) + (Math.random() - 0.5) * titreme * (_kmRfxYrTur >= 2 ? 1.4 : 0.5);
        let dx = Math.sin(_kmRfxYrFaz * 1.3) * shake + (Math.random() - 0.5) * shake * 0.8;
        let dy = Math.cos(_kmRfxYrFaz * 0.9) * shake + (Math.random() - 0.5) * shake * 0.6;
        let pin = document.getElementById('km-rfx-yr-pin'); if(pin) pin.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
        let dist = Math.sqrt(dx * dx + dy * dy), sarida = dist < 16;
        if(sarida) { _kmRfxYrOnHedef += 0.05; let oe = document.getElementById('km-rfx-yr-onhedef'); if(oe) oe.textContent = _kmRfxYrOnHedef.toFixed(1); if(pin) pin.classList.add('sarida'); }
        else if(pin) pin.classList.remove('sarida');
        if(_kmRfxYrTur >= 1) { let me = document.getElementById('km-rfx-yr-mesaj'); if(me) me.textContent = _kmRfxYrTur === 1 ? '😓 KASLARIN YORULUYOR' : '😵 SON OK — VÜCUT TİTRİYOR'; }
        if(_kmRfxYrTur >= 2) { let bl = document.getElementById('km-rfx-yr-blur'); if(bl) bl.style.backdropFilter = 'blur(' + (Math.abs(Math.sin(_kmRfxYrFaz)) * 1.8).toFixed(1) + 'px)'; }
        let gecen = performance.now() - baslama, kalan = Math.max(0, 1 - gecen / sure);
        let si = document.getElementById('km-rfx-yr-sure-ic'); if(si) si.style.width = (kalan * 100) + '%';
        if(!sureBit && gecen >= sure) { sureBit = true; kmRfxYrAt(); }
    }, 40);
}
function kmRfxYrAt() {
    if(_kmRfxTimer) { clearInterval(_kmRfxTimer); _kmRfxTimer = null; }
    _kmRfxYrTur++;
    if(_kmRfxYrOnHedef >= 1.5) _kmRfxYrBasari++;
    let sahne = document.getElementById('km-rfx-sahne'); if(!sahne) return;
    if(_kmRfxYrTur >= 3) { kmRfxYrBitir(); return; }
    let basarili = _kmRfxYrOnHedef >= 1.5;
    sahne.innerHTML = `<div class="km-rfx-yr-arasonuc ${basarili ? 'basarili' : 'basarisiz'}">${basarili ? '✅' : '❌'} ${_kmRfxYrOnHedef.toFixed(1)}s sarıda!</div><div class="km-rfx-tk-not">Sıradaki set başlıyor...</div>`;
    _kmRfxSpawnT = setTimeout(function() { kmRfxYrTurBaslat(sahne); }, 1300);
}
function kmRfxYrBitir() {
    kmRfxTemizle();
    let ozet = _kmRfxYrBasari >= 3 ? 'Yorgunluğa rağmen zihnin dayanıklı!' : _kmRfxYrBasari >= 2 ? 'İyi! Son sette daha erken atış yapmayı dene.' : 'Yorgunlukta atış zamanlaması gelişiyor — devam et!';
    kmRfxSonucGoster('yorgunluk', _kmRfxYrBasari, ozet);
}
