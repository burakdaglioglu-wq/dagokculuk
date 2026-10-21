/* ================================================================================================
   🏠 MILO GENEL BAKIŞ (2026-10-01, kullanıcı: "görseli daha iyi ve basit hale getir, dashboard şeklinde olabilir").
   Milo açılınca ilk bu panel gelir: 4 büyük özet kutusu (dokununca ilgili sekme), "Bugün" dersleri, "Dikkat"
   (aidat gecikmesi · 2+ haftadır gelmeyen · eksik bilgi — tek dokunuşla WhatsApp/Hızlı Düzenle), doğum günleri ve
   son öğrenilen beceriler. Sekmeler de sadeleşti: 5 ana sekme + "Diğer ▾" menüsü (Hızlı Düzenle/Personel/Dersler/Beceri).
   Sadece OKUR — veri yazan her şey ilgili sekmenin kendi fonksiyonuna gider. Tarihler YEREL (bugunISO UTC'dir).
   ================================================================================================ */
const MGB_GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
function mgbBugun() { return _miloBsIsoTarih(new Date()); }
function mgbGunFark(isoA, isoB) { return Math.round((new Date(isoB + 'T00:00:00') - new Date(isoA + 'T00:00:00')) / 864e5); }

let _mgbSon = 0;
async function mgbYukleVeCiz(zorla, cizme) { // cizme: arka plan yenilemesi yalnız veriyi çeker (milo/app.js miloArkaPlanYenile)
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    // 15 sn'lik otomatik yenileme her seferinde 6 istek atmasın: sunucudan en fazla dakikada bir, arada eldeki veriyle çiz
    if (!zorla && _mgbSon && Date.now() - _mgbSon < 60000 && miloUyeler.length) { if (!cizme) mgbCiz(); return; }
    _mgbSon = Date.now();
    if (!cizme && !alan.querySelector('.ap')) alan.innerHTML = '<div class="mgb-yukleniyor">Yükleniyor…</div>';
    let al = function (yol, alanAd) { return miloApi(yol).then(function (d) { return d[alanAd] || []; }).catch(function () { return null; }); };
    let s = await Promise.all([al('/members', 'members'), al('/dues', 'dues'), al('/antrenman-programi', 'slots'), al('/attendance/auto', 'attendance'), al('/member-skills', 'skills'), al('/ders-icerikleri', 'dersler')]);
    if (s[0]) miloUyeler = s[0]; if (s[1]) miloDuesTum = s[1]; if (s[2]) miloProgram = s[2]; if (s[3]) miloAttendanceTum = s[3]; if (s[4]) miloMemberSkills = s[4]; if (s[5]) miloDersler = s[5];
    if (miloAktifSekme === 'genel' && !cizme) mgbCiz();
}

// Genel Bakış = ortak yönetim paneli (/yonetim-panel.js, DAĞ ile aynı; 2026-10-21 "en iyi yönetim sayfaları gibi, hem Milo hem DAĞ").
function mgbCiz() {
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    if (typeof ynCiz !== 'function') { alan.innerHTML = '<div class="mgb-yukleniyor">Panel yüklenemedi — sayfayı yenile.</div>'; return; }
    ynKulup(miloYonetimAdaptor()); ynCiz(alan);
    try { miloYanCiz(); } catch (e) {}
}

// ---- 🎨 Tema seçici (cihazda hatırlanır; temalar index.html'de html.milo-tema-* sınıfları)
const MILO_TEMALAR = [
    { id: 'gece', ad: '⚫ Gece', renk: ['#FF7A2B', '#0C0B0A'], bar: '#0C0B0A' },
    { id: 'sade', ad: '⚪ Sade (açık)', renk: ['#138A80', '#F4F7F6'], bar: '#F4F7F6' },
    { id: 'turuncu', ad: '🟠 Turuncu Gece', renk: ['#FF7A1A', '#140C07'], bar: '#140C07' },
    { id: 'mor', ad: '💜 Mor Gece', renk: ['#8B7FFF', '#15121F'], bar: '#15121F' },
    { id: 'okyanus', ad: '🌊 Okyanus', renk: ['#14B8A6', '#06141A'], bar: '#06141A' },
    { id: 'gul', ad: '🌸 Gül', renk: ['#EC4899', '#160A11'], bar: '#160A11' },
    { id: 'mavi', ad: '🔵 Gece Mavisi', renk: ['#3B82F6', '#080D18'], bar: '#080D18' }
];
function miloTemaAktif() { let c = [...document.documentElement.classList].find(function (x) { return x.indexOf('milo-tema-') === 0; }); return c ? c.slice(10) : 'gece'; }
function miloTemaSec(id) {
    let t = MILO_TEMALAR.find(function (x) { return x.id === id; }); if (!t) return;
    [...document.documentElement.classList].forEach(function (c) { if (c.indexOf('milo-tema-') === 0) document.documentElement.classList.remove(c); });
    document.documentElement.classList.add('milo-tema-' + id);
    try { localStorage.setItem('milo_tema', id); } catch (e) {}
    let m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', t.bar);
    miloTemaMenuKapat(); showToast('🎨 ' + t.ad.replace(/^\S+\s/, '') + ' teması', 'success');
}
function miloTemaMenu(e) {
    if (e) e.stopPropagation();
    if (document.getElementById('milo-tema-menu')) return miloTemaMenuKapat();
    let btn = document.getElementById('milo-tema-btn'), r = btn.getBoundingClientRect(), aktif = miloTemaAktif();
    let m = document.createElement('div'); m.id = 'milo-tema-menu'; m.className = 'milo-tema-menu';
    m.style.top = (r.bottom + 6) + 'px'; m.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    m.innerHTML = '<div class="baslik">Tema</div>' + MILO_TEMALAR.map(function (t) {
        return '<button class="' + (t.id === aktif ? 'aktif' : '') + '" onclick="miloTemaSec(\'' + t.id + '\')"><span class="ornek" style="background:radial-gradient(circle at 30% 30%,' + t.renk[0] + ',' + t.renk[1] + ' 75%)"></span>' + t.ad.replace(/^\S+\s/, '') + (t.id === aktif ? '<span class="tik">✓</span>' : '') + '</button>';
    }).join('');
    document.body.appendChild(m);
    setTimeout(function () { document.addEventListener('click', miloTemaMenuKapat, { once: true }); }, 0);
}
function miloTemaMenuKapat() { let m = document.getElementById('milo-tema-menu'); if (m) m.remove(); }
(function () { let t = MILO_TEMALAR.find(function (x) { return x.id === miloTemaAktif(); }), m = document.querySelector('meta[name="theme-color"]'); if (t && m) m.setAttribute('content', t.bar); })();

// ---- "Diğer ▾" menüsü
function miloDigerMenu(e) {
    if (e) e.stopPropagation();
    let eski = document.getElementById('milo-diger-menu'); if (eski) { eski.remove(); return; }
    let btn = document.getElementById('milo-diger-btn'), r = btn.getBoundingClientRect();
    let m = document.createElement('div'); m.id = 'milo-diger-menu'; m.className = 'mgb-menu';
    m.style.top = (r.bottom + 6) + 'px'; m.style.right = Math.max(8, window.innerWidth - r.right) + 'px';
    m.innerHTML = Object.keys(MILO_DIGER_SEKMELER).map(function (k) { return '<button class="' + (miloAktifSekme === k ? 'aktif' : '') + '" onclick="miloSekme(\'' + k + '\')">' + MILO_DIGER_SEKMELER[k] + '</button>'; }).join('');
    document.body.appendChild(m);
    setTimeout(function () { document.addEventListener('click', miloDigerMenuKapat, { once: true }); }, 0);
}
function miloDigerMenuKapat() { let m = document.getElementById('milo-diger-menu'); if (m) m.remove(); }

(function () {
    let st = document.createElement('style');
    st.textContent = [
        '#milo-icerik{background:transparent!important}',
        '.mgb{display:flex;flex-direction:column;gap:14px;max-width:1200px;margin:0 auto}',
        '.mgb-yukleniyor{padding:40px;text-align:center;color:var(--milo-ink-dim)}',
        '.mgb-bas{display:flex;justify-content:space-between;align-items:center}.mgb-selam{font-size:22px;font-weight:800}.mgb-tarih{font-size:13px;color:var(--milo-ink-dim)}',
        '.mgb-yenile{width:40px;height:40px;border-radius:12px;border:1px solid var(--milo-line);background:var(--milo-card);color:var(--milo-ink);font-size:18px;cursor:pointer}',
        '.mgb-kutular{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}@media (max-width:820px){.mgb-kutular{grid-template-columns:repeat(2,1fr)}}',
        '.mgb-kutu{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:16px;border-radius:22px;border:1px solid rgba(255,255,255,.10);background:var(--milo-card);backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3);color:var(--milo-ink);font:inherit;text-align:left;cursor:pointer;min-height:128px}',
        '.mgb-kutu::before{content:"";position:absolute;inset:0;background:radial-gradient(180px 120px at 100% 0%,color-mix(in srgb,var(--r) 28%,transparent),transparent 70%);pointer-events:none}',
        '.mgb-kutu:hover{border-color:color-mix(in srgb,var(--r) 60%,transparent)}',
        '.mgb-kutu-ikon{font-size:20px}.mgb-kutu-deger{font-size:30px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--r)}.mgb-kutu-et{font-size:13px;font-weight:800}.mgb-kutu-alt{font-size:11.5px;color:var(--milo-ink-dim)}',
        '.mgb-bar{display:block;width:100%;height:6px;border-radius:9px;background:rgba(255,255,255,.08);margin-top:8px;overflow:hidden}.mgb-bar i{display:block;height:100%;background:var(--r);border-radius:9px}',
        '.mgb-izgara{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start}@media (max-width:820px){.mgb-izgara{grid-template-columns:1fr}}',
        '.mgb-kart{display:flex;flex-direction:column;gap:8px;padding:16px;border-radius:22px;border:1px solid rgba(255,255,255,.10);background:var(--milo-card);backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3)}',
        '.mgb-kart-bas{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:800}.mgb-kart-bas small{font-weight:600;color:var(--milo-ink-dim);font-size:11px}',
        '.mgb-link{margin-left:auto;background:none;border:none;color:var(--milo-teal);font:inherit;font-size:12px;font-weight:800;cursor:pointer}',
        '.mgb-ders{display:grid;grid-template-columns:62px 1fr auto;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;border:1px solid var(--milo-line);background:rgba(255,255,255,.04);color:var(--milo-ink);font:inherit;text-align:left;cursor:pointer}.mgb-ders.iptal{opacity:.6}',
        '.mgb-ders-saat{display:flex;flex-direction:column;font-weight:800;font-size:15px;font-variant-numeric:tabular-nums}.mgb-ders-saat small{font-size:11px;font-weight:600;color:var(--milo-ink-dim)}.mgb-ders-ad{font-weight:700}.mgb-ders-kisi{font-size:12px;color:var(--milo-ink-dim)}',
        '.mgb-rozet{font-size:10px;padding:2px 6px;border-radius:6px}.mgb-rozet.kirmizi{background:rgba(239,68,68,.18);color:#f87171}',
        '.mgb-bos{padding:14px;text-align:center;color:var(--milo-ink-dim);font-size:13px}',
        '.mgb-dikkat-bolum{display:flex;flex-direction:column;gap:6px;padding:8px 0;border-top:1px solid var(--milo-line)}.mgb-dikkat-bolum:first-of-type{border-top:none}',
        '.mgb-dikkat-bas{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700}.mgb-dikkat-bas b{font-size:15px}.mgb-nokta{width:9px;height:9px;border-radius:50%}',
        '.mgb-tamam{font-size:12px;color:#4ade80;padding-left:17px}.mgb-alt-yazi{font-size:12px;color:var(--milo-ink-dim);padding-left:17px}',
        '.mgb-satir{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0 6px 17px}.mgb-satir span{display:flex;flex-direction:column;min-width:0}.mgb-satir b{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mgb-satir small{font-size:11.5px;color:var(--milo-ink-dim)}',
        '.mgb-mini{flex-shrink:0;border:1px solid var(--milo-line);background:rgba(255,255,255,.05);color:var(--milo-ink);border-radius:10px;padding:6px 10px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}.mgb-mini.yesil{border-color:rgba(34,197,94,.6);color:#4ade80;background:rgba(34,197,94,.10)}',
        '.mgb-menu{position:fixed;z-index:9000;display:flex;flex-direction:column;gap:4px;padding:6px;border-radius:14px;border:1px solid rgba(255,255,255,.12);background:var(--milo-opak,#1E1A2D);box-shadow:0 18px 44px rgba(0,0,0,.5);min-width:190px}',
        '.mgb-menu button{text-align:left;border:none;background:transparent;color:var(--milo-ink);font:inherit;font-size:13px;font-weight:700;padding:10px 12px;border-radius:10px;cursor:pointer}.mgb-menu button:hover{background:rgba(255,255,255,.06)}.mgb-menu button.aktif{background:var(--milo-teal);color:#fff}'
    ].join('\n');
    document.head.appendChild(st);
})();

// ================================================================================================
// 🧭 KOMUTA MERKEZİ (2026-10-02, kullanıcı DAĞ yönetici paneli için A tasarımını seçti ve "Milo'ya da yap"):
// ≥700px'te solda sabit gruplu menü (tüm sekmeler, "Diğer"dekiler dahil), her sekmenin üstünde dokunulabilir
// sayı şeridi (aidatı geciken · bugün gelen · bugünkü ders · 2+ haftadır gelmeyen). Dar ekranda üst sekme çubuğu
// kalır. Aidat sayısı aidat paneliyle aynı hesaptan (apOzet).
// ================================================================================================
const MILO_YAN_GRUPLAR = [
    ['YÖNETİM', [['genel', '🏠', 'Genel Bakış'], ['uyeler', '👤', 'Üyeler'], ['hizli', '📝', 'Hızlı Düzenle']]],
    ['ANTRENMAN', [['analiz', '📋', 'Yoklama'], ['defter', '📒', 'Öğrenci Defteri'], ['gunluk', '📝', 'Ders Günlüğü'], ['program', '📅', 'Program'], ['ders', '📚', 'Dersler']]],
    ['KULÜP İŞLERİ', [['aidat', '💰', 'Aidat'], ['personel', '🧑‍🏫', 'Personel']]]
];
function miloSayilar() {
    let bugun = mgbBugun(), gun = new Date().getDay(), aktif = miloUyeler.filter(u => !u.pasif), gelen = 0, son = {}, geciken = 0;
    (miloAttendanceTum || []).forEach(a => { if (!a.geldi) return; if (a.tarih === bugun) gelen++; if (!son[a.ad] || a.tarih > son[a.ad]) son[a.ad] = a.tarih; });
    try { if (typeof apOzet === 'function' && miloDuesTum.length) geciken = apOzet(miloAidatPanelAdaptor()).bek.length; } catch (e) {}
    let ders = miloProgram.filter(sl => (sl.gunler || [sl.gun]).indexOf(gun) !== -1 && !(sl.istisnalar || []).some(i => i.tarih === bugun)).length;
    let gelmeyen = aktif.filter(u => { let r = son[u.ad] || u.katilmaTarihi; return r && mgbGunFark(r, bugun) >= 14; }).length;
    return { geciken, gelen, ders, gelmeyen, aktif: aktif.length };
}
function miloYanCiz(s) {
    let nav = document.getElementById('milo-yan'); if (!nav) return;
    s = s || (miloUyeler.length ? miloSayilar() : null);
    let rozet = function (k) {
        if (!s) return '';
        if (k === 'uyeler') return '<span class="milo-yan-rozet">' + s.aktif + '</span>';
        if (k === 'aidat' && s.geciken) return '<span class="milo-yan-rozet kirmizi">' + s.geciken + '</span>';
        if (k === 'analiz' && s.gelen) return '<span class="milo-yan-rozet">' + s.gelen + '</span>';
        return '';
    };
    nav.innerHTML = MILO_YAN_GRUPLAR.map(function (gr) {
        return '<div class="milo-yan-grup">' + gr[0] + '</div>' + gr[1].map(function (x) {
            let aktif = miloAktifSekme === x[0];
            return '<button class="milo-yan-btn' + (aktif ? ' aktif' : '') + '"' + (aktif ? ' aria-current="page"' : '') + ' onclick="miloSekme(\'' + x[0] + '\')"><span class="milo-yan-ikon" aria-hidden="true">' + x[1] + '</span>' + x[2] + rozet(x[0]) + '</button>';
        }).join('');
    }).join('');
}
function miloSeritCiz(s) {
    let el = document.getElementById('milo-serit'); if (!el) return;
    if (miloAktifSekme === 'genel' || !miloUyeler.length) { el.innerHTML = ''; return; } // Genel Bakış'ta büyük kutular var
    s = s || miloSayilar();
    let b = function (r, deger, et, sekme) { return '<button class="milo-serit-btn" style="--r:' + r + '" onclick="miloSekme(\'' + sekme + '\')"><b>' + deger + '</b>' + et + '</button>'; };
    el.innerHTML = b('#ef4444', s.geciken, 'aidatı geciken', 'aidat') + b('#22c55e', s.gelen, 'bugün geldi', 'analiz') + b('var(--milo-teal)', s.ders, 'bugünkü ders', 'program') + b('#f97316', s.gelmeyen, '2+ haftadır gelmeyen', 'analiz');
}
function miloKomutaYenile() { let s = miloUyeler.length ? miloSayilar() : null; miloYanCiz(s); miloSeritCiz(s); }
// Genel Bakış araması → Üyeler sekmesi, filtre dolu
function miloAramaGit(q) { try { miloUyeAramaFiltre = q || ''; } catch (e) {} miloSekme('uyeler'); }
(function () {
    // Sekme değişince menü vurgusu + şerit (miloSekme app.js'te; global olduğu için sarmalanabilir)
    let eskiSekme = miloSekme;
    miloSekme = function (k) { let r = eskiSekme.apply(this, arguments); try { miloKomutaYenile(); } catch (e) {} return r; };
    let eskiYukle = mgbYukleVeCiz;
    mgbYukleVeCiz = async function () { let r = await eskiYukle.apply(this, arguments); try { miloKomutaYenile(); } catch (e) {} return r; };
    let st = document.createElement('style');
    st.textContent = [
        '.milo-govde{flex:1;min-height:0;display:flex}',
        '.milo-ana{flex:1;min-width:0;display:flex;flex-direction:column;min-height:0}',
        '.milo-yan{display:none}',
        '.milo-serit{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:12px 15px 0;flex-shrink:0}.milo-serit::-webkit-scrollbar{display:none}.milo-serit:empty{display:none}',
        '.milo-serit-btn{flex:0 0 auto;display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 14px;border-radius:12px;border:1px solid var(--milo-line);background:var(--milo-card-raised,var(--milo-card));color:var(--milo-ink);font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap}',
        '.milo-serit-btn b{font-size:16px;font-weight:900;color:var(--r);font-variant-numeric:tabular-nums}.milo-serit-btn:hover{border-color:var(--r)}.milo-serit-btn:focus-visible{outline:2px solid var(--milo-teal);outline-offset:2px}',
        '@media (min-width:700px){',
        '  #milo-tab-bar{display:none!important}',
        '  .milo-yan{display:flex;flex-direction:column;gap:2px;width:228px;flex-shrink:0;overflow-y:auto;padding:14px 10px;border-right:1px solid var(--milo-line);background:var(--milo-card-raised,var(--milo-card))}',
        '  .milo-yan-grup{font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--milo-ink-dim);padding:12px 10px 6px}.milo-yan-grup:first-child{padding-top:2px}',
        '  .milo-yan-btn{display:flex;align-items:center;gap:10px;width:100%;min-height:40px;padding:0 10px;border:0;border-radius:10px;background:transparent;color:var(--milo-ink);font:inherit;font-size:13px;font-weight:600;text-align:left;cursor:pointer}',
        '  .milo-yan-btn:hover:not(.aktif){background:rgba(255,255,255,.05)}.milo-yan-btn.aktif{background:color-mix(in srgb,var(--milo-teal) 22%,transparent);font-weight:800}',
        '  .milo-yan-btn:focus-visible{outline:2px solid var(--milo-teal);outline-offset:1px}.milo-yan-ikon{font-size:15px;width:20px;text-align:center}',
        '  .milo-yan-rozet{margin-left:auto;font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:99px;color:var(--milo-ink-dim);font-variant-numeric:tabular-nums}.milo-yan-rozet.kirmizi{background:rgba(239,68,68,.18);color:#fca5a5}',
        '  #milo-icerik{padding:16px 22px!important}.milo-serit{padding:14px 22px 0}',
        '}'
    ].join('\n');
    document.head.appendChild(st);
})();
