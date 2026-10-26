/* ================================================================================================
   🎡 VELİ / SPORCU PANOSU — Milo (2026-10-26). Kullanıcı: "Milo kullanıcı için bir arayüz yapalım ve içeriğini geliştirelim,
   3 farklı dizayn sun" → taslaklardan (https://claude.ai/artifact/KC28HMhwUYeJ35eWnpm3qr) "2 · Halka pano"yu seçti.
   Sporcu girişinden sonra (genelde veli bakar, çocuklar 18 ay – 9 yaş): 8 derslik paket halkası (her dilim bir ders: geldi /
   gelmedi / hasta), telafi hakkı, ödeme durumu (tutar yok), sıradaki ders (cihaz saatiyle), devam sayıları, Ders
   Günlüğü'nden "bu hafta neler yaptık", "bunları kazanacak" (son 30 günde çalışılan beceriler) ve antrenörün notu.
   Veri: POST /api/milo/sporcu-girisi (paket / dersler / buHafta → src/routes/milo/veliPano.ts). app.js'teki
   miloSporcuProfilCiz'in yerine geçer — bu dosya app.js'ten SONRA yüklenmeli. Önek mvp.
   ================================================================================================ */
const MVP_GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MVP_GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const MVP_AY = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
// Ders Günlüğü becerileri (milo-gunluk.js MG_BECERI ile aynı)
const MVP_BECERI = { kosma: ['🏃', 'Koşma'], ziplama: ['🐸', 'Zıplama'], denge: ['🤸', 'Denge'], atma: ['🏐', 'Atma-Tutma'], tirmanma: ['🧗', 'Tırmanma'], emekleme: ['🐛', 'Emekleme'], koordinasyon: ['🎯', 'Koordinasyon'], esneklik: ['🧘', 'Esneklik'], kuvvet: ['💪', 'Kuvvet'], ritim: ['🎵', 'Ritim'], incemotor: ['✋', 'İnce motor'], sosyal: ['🤝', 'Paylaşma'], oyun: ['🎲', 'Oyun'] };

function mvpIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function mvpTarih(iso) { let d = new Date(iso + 'T12:00:00'); return d.getDate() + ' ' + MVP_AY[d.getMonth()]; }
// Sıradaki ders: bugünden 14 gün ileriye, iptal edilmemiş ilk ders (bugünse bitmemiş olmalı)
function mvpSiradaki(dersler, simdi) {
    simdi = simdi || new Date();
    let saat = String(simdi.getHours()).padStart(2, '0') + ':' + String(simdi.getMinutes()).padStart(2, '0'), en = null;
    for (let i = 0; i < 15 && !en; i++) {
        let d = new Date(simdi.getFullYear(), simdi.getMonth(), simdi.getDate() + i, 12), iso = mvpIso(d);
        (dersler || []).forEach(function (s) {
            if (s.gunler.indexOf(d.getDay()) === -1 || (s.iptal || []).indexOf(iso) !== -1) return;
            if (i === 0 && (s.bit || s.bas) <= saat) return;
            if (!en || s.bas < en.bas) en = { tarih: d, gun: i, bas: s.bas, bit: s.bit, grup: s.grup };
        });
    }
    return en;
}
function mvpKalanYazi(n) { return n === 0 ? 'Bugün' : n === 1 ? 'Yarın' : n + ' gün sonra'; }

// 8 dilimli halka: dolu dilim = işlenen ders (geldi turuncu, gelmedi koyu, hasta sarı), boş dilim = kalan ders
function mvpHalkaSVG(dersler) {
    let R = 15.5, C = 2 * Math.PI * R, dilim = C / 8, bosluk = 1.1, s = '';
    for (let i = 0; i < 8; i++) {
        let d = dersler[i], renk = !d ? 'var(--mvp-cizgi)' : d === 'g' ? 'var(--mvp-vurgu)' : d === 'h' ? 'var(--mvp-sari)' : 'var(--mvp-kacan)';
        s += '<circle class="mvp-dilim' + (d ? ' dolu' : '') + '" style="--i:' + i + '" cx="18" cy="18" r="' + R + '" fill="none" stroke="' + renk + '" stroke-width="3.4" stroke-dasharray="' + (dilim - bosluk).toFixed(2) + ' ' + (C - dilim + bosluk).toFixed(2) + '" stroke-dashoffset="' + (-i * dilim).toFixed(2) + '"/>';
    }
    return '<svg viewBox="0 0 36 36" aria-hidden="true">' + s + '</svg>';
}

function miloSporcuProfilCiz(s) {
    mvpCss();
    let kap = document.getElementById('milo-sporcu-app'); if (kap) kap.classList.add('mvp-kap');
    let alan = document.getElementById('milo-sporcu-icerik'); if (!alan) return;
    let ilk = String(s.ad || '').split(' ')[0], p = s.paket, sir = mvpSiradaki(s.dersler);

    // ---- paket kartı
    let paketHTML;
    if (p) {
        let n = p.dersler.length, kalan = 8 - n, gel = p.dersler.filter(function (x) { return x === 'g'; }).length;
        let alt = n >= 8 ? 'Paket doldu.' + (p.telafiHakki ? ' Telafi derslerin bittiğinde yeni paket başlar.' : ' Sıradaki ders yeni paketle başlar.') : kalan + ' ders kaldı · ' + gel + ' derse geldi' + (p.telafi ? ' + ' + p.telafi + ' telafi' : '');
        paketHTML = '<div class="mvp-hero"><div class="mvp-halka">' + mvpHalkaSVG(p.dersler) + '<div class="mvp-orta"><div><b>' + n + '/8</b><small>ders</small></div></div></div>'
            + '<div class="mvp-hero-m"><h3>' + p.no + '. paket</h3><p>' + miloEsc(alt) + '</p>'
            + '<div class="mvp-rozetler">' + (p.telafiHakki ? '<span class="mvp-cip sari">🔁 ' + p.telafiHakki + ' telafi hakkı</span>' : '')
            + (p.odendi ? '<span class="mvp-cip yesil">✓ Ödendi' + (p.odemeTarihi ? ' · ' + miloEsc(mvpTarih(p.odemeTarihi)) : '') + '</span>' : '<span class="mvp-cip soluk">Ödeme bekleniyor</span>') + '</div></div></div>';
    } else {
        paketHTML = '<div class="mvp-hero"><div class="mvp-halka">' + mvpHalkaSVG([]) + '<div class="mvp-orta"><div><b>0/8</b><small>ders</small></div></div></div>'
            + '<div class="mvp-hero-m"><h3>Paket</h3><p>İlk dersten itibaren 8 derslik paketin burada dolar.</p></div></div>';
    }
    // ---- sıradaki ders
    let sonrakiHTML = sir ? '<div class="mvp-sonraki"><div class="mvp-gun"><small>' + MVP_GUN_KISA[sir.tarih.getDay()] + '</small><b>' + String(sir.tarih.getDate()).padStart(2, '0') + '</b></div>'
        + '<div><b>Sıradaki ders · ' + miloEsc(sir.bas) + '</b><small>' + mvpKalanYazi(sir.gun) + (sir.gun > 1 ? ' · ' + MVP_GUN[sir.tarih.getDay()] : '') + ' · ' + miloEsc(sir.grup) + '</small></div></div>'
        : (s.dersler && s.dersler.length ? '<div class="mvp-sonraki"><div><b>Önümüzdeki iki haftada ders görünmüyor</b><small>Program değişikliği için antrenörüne sor.</small></div></div>' : '');
    // ---- bu hafta neler yaptık
    let bh = s.buHafta || [], buHaftaHTML = '';
    if (bh.length) {
        let bec = []; bh.forEach(function (k) { (k.beceriler || []).forEach(function (b) { if (bec.indexOf(b) === -1) bec.push(b); }); });
        buHaftaHTML = '<h4>Bu hafta neler yaptık <span>' + miloEsc(mvpTarih(bh[0].tarih)) + '</span></h4>'
            + bh.filter(function (k) { return k.konu || k.yapilanlar; }).map(function (k) { return '<div class="mvp-konu">' + (k.konu ? '<b>' + miloEsc(k.konu) + '</b>' : '') + (k.yapilanlar ? '<p>' + miloEsc(k.yapilanlar) + '</p>' : '') + '</div>'; }).join('')
            + (bec.length ? '<div class="mvp-yatay">' + bec.map(function (b) { let x = MVP_BECERI[b] || ['•', b]; return '<div class="mvp-beceri"><i>' + x[0] + '</i><b>' + miloEsc(x[1]) + '</b></div>'; }).join('') + '</div>' : '');
    }
    // ---- bunları kazanacak (2026-10-26, kullanıcı: "öğrendiği becerileri bunları kazanacak diye değiştirelim"): "öğrendi / seviye /
    // rozet" yerine son 30 günde çocuğun yaş grubunda çalışılan beceriler, kaç derste çalışıldığıyla (Ders Günlüğü'nden)
    let kz = s.kazanacak || [], kzMax = kz.reduce(function (m, b) { return Math.max(m, b.ders); }, 1);
    let gelisimHTML = '<div class="mvp-kart"><h4>Bunları kazanacak <span>son 30 gün</span></h4>'
        + (kz.length ? '<div class="mvp-kz">' + kz.map(function (b) { let x = MVP_BECERI[b.id] || ['•', b.id]; return '<div class="mvp-kz-s"><i>' + x[0] + '</i><div><b>' + miloEsc(x[1]) + '</b><span class="mvp-kz-bar"><u style="width:' + Math.round(b.ders / kzMax * 100) + '%"></u></span></div><small>' + b.ders + ' derste</small></div>'; }).join('') + '</div>'
            : '<div class="mvp-alt">Antrenör derslerde neler yaptığını yazdıkça çocuğunun çalıştığı beceriler burada görünür.</div>') + '</div>';

    alan.innerHTML = '<div class="mvp">'
        + '<div class="mvp-ust"><div><small>Merhaba</small><b>' + miloEsc(ilk) + '</b><span>' + miloEsc(s.grup) + '</span></div><div class="mvp-av">' + miloEsc(ilk.charAt(0) || '?') + '</div></div>'
        + paketHTML + sonrakiHTML
        + '<div class="mvp-kare"><div><b>' + (s.devamSayisi || 0) + '</b><small>derse geldi</small></div><div><b>' + (s.buAyGeldi || 0) + '</b><small>bu ay geldi</small></div><div><b>' + (s.kazanacak || []).length + '</b><small>beceri kazanıyor</small></div></div>'
        + buHaftaHTML + gelisimHTML
        + (s.antrenorNotu ? '<div class="mvp-kart"><h4>Antrenörün notu</h4><div class="mvp-not">' + miloEsc(s.antrenorNotu) + '</div></div>' : '')
        + '</div>';
}

function mvpCss() {
    if (document.getElementById('mvp-css')) return;
    let st = document.createElement('style'); st.id = 'mvp-css';
    st.textContent = [
        // Seçilen taslağın kendi koyu paleti (Milo Sade Gece ile uyumlu), tek turuncu vurgu
        '#milo-sporcu-app.mvp-kap{--mvp-zemin:#0c0b0a;--mvp-kart:#171513;--mvp-yukselt:#1f1c19;--mvp-cizgi:#2a2622;--mvp-yazi:#f3eee8;--mvp-soluk:#9b928a;--mvp-vurgu:#ff7a2b;--mvp-sari:#facc15;--mvp-yesil:#4ade80;--mvp-kacan:#5b4a3d;background:var(--mvp-zemin)!important;color:var(--mvp-yazi);font-family:Manrope,system-ui,sans-serif;color-scheme:dark}',
        '#milo-sporcu-app.mvp-kap>button{background:var(--mvp-kart)!important;color:var(--mvp-soluk)!important;border:0!important;box-shadow:none!important;border-radius:99px!important}',
        '.mvp{display:flex;flex-direction:column;gap:12px;padding-bottom:30px}',
        '.mvp-ust{display:flex;justify-content:space-between;align-items:flex-end;margin:0 2px 4px}.mvp-ust small{color:var(--mvp-soluk);font-weight:700;font-size:13px}.mvp-ust b{display:block;font-size:32px;font-weight:800;letter-spacing:-.03em;line-height:1.05}.mvp-ust span{display:block;color:var(--mvp-soluk);font-weight:600;font-size:12.5px;margin-top:2px}',
        '.mvp-av{width:46px;height:46px;border-radius:14px;background:var(--mvp-vurgu);display:grid;place-items:center;font-weight:800;font-size:19px;color:#1a0c03;flex:none}',
        '.mvp-hero{background:var(--mvp-kart);border-radius:24px;padding:18px;display:grid;grid-template-columns:132px minmax(0,1fr);gap:16px;align-items:center}',
        '.mvp-halka{position:relative;width:132px;height:132px}.mvp-halka svg{width:100%;height:100%;transform:rotate(-90deg)}',
        '.mvp-dilim.dolu{opacity:0;animation:mvpDilim .35s calc(.15s + var(--i) * .09s) ease-out forwards}@keyframes mvpDilim{to{opacity:1}}',
        '.mvp-orta{position:absolute;inset:0;display:grid;place-items:center;text-align:center}.mvp-orta b{font-size:30px;font-weight:800;line-height:1}.mvp-orta small{display:block;font-size:11px;font-weight:700;color:var(--mvp-soluk);margin-top:3px}',
        '.mvp-hero-m{min-width:0}.mvp-hero h3{margin:0 0 4px;font-size:16px;font-weight:800}.mvp-hero p{margin:0;color:var(--mvp-soluk);font-size:12.5px;font-weight:600;line-height:1.45}',
        '.mvp-rozetler{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}',
        '.mvp-cip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;padding:5px 10px;border-radius:99px;background:var(--mvp-yukselt);color:var(--mvp-yazi)}',
        '.mvp-cip.sari{color:var(--mvp-sari);background:rgba(250,204,21,.1)}.mvp-cip.yesil{color:var(--mvp-yesil);background:rgba(74,222,128,.1)}.mvp-cip.soluk{color:var(--mvp-soluk)}',
        '.mvp-sonraki{background:var(--mvp-yukselt);border-radius:18px;padding:14px 16px;display:flex;align-items:center;gap:12px}',
        '.mvp-gun{width:48px;height:52px;border-radius:12px;background:var(--mvp-zemin);display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none}',
        '.mvp-gun small{font-size:10px;font-weight:800;color:var(--mvp-vurgu);text-transform:uppercase}.mvp-gun b{font-size:20px;font-weight:800;line-height:1}',
        '.mvp-sonraki>div:last-child{min-width:0}.mvp-sonraki>div:last-child b{display:block;font-size:15px;font-weight:800}.mvp-sonraki>div:last-child small{color:var(--mvp-soluk);font-weight:600;font-size:12.5px}',
        '.mvp-kare{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:6px}',
        '.mvp-kare div{background:var(--mvp-kart);border-radius:16px;padding:12px;min-width:0}.mvp-kare b{display:block;font-size:22px;font-weight:800;line-height:1.1}.mvp-kare small{color:var(--mvp-soluk);font-size:11.5px;font-weight:700}',
        '.mvp h4{margin:0 2px;font-size:15px;font-weight:800;display:flex;justify-content:space-between;align-items:baseline;gap:8px}.mvp h4 span{color:var(--mvp-soluk);font-size:12.5px;font-weight:700}',
        '.mvp-konu{background:var(--mvp-kart);border-radius:18px;padding:14px 16px}.mvp-konu b{display:block;font-size:14.5px;font-weight:800}.mvp-konu p{margin:4px 0 0;color:var(--mvp-soluk);font-size:13px;font-weight:600;line-height:1.5;white-space:pre-line}',
        '.mvp-yatay{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;margin:0 -20px;padding:0 20px 2px}.mvp-yatay::-webkit-scrollbar{display:none}',
        '.mvp-beceri{flex:none;width:104px;background:var(--mvp-kart);border-radius:18px;padding:14px 12px}.mvp-beceri i{font-style:normal;font-size:28px;display:block;margin-bottom:8px}.mvp-beceri b{font-size:13.5px;font-weight:800}',
        '.mvp-kart{background:var(--mvp-kart);border-radius:20px;padding:16px}',
        '.mvp-adimlar{display:flex;align-items:center;margin:14px 4px 10px}.mvp-n{width:14px;height:14px;border-radius:50%;background:var(--mvp-cizgi);flex:none}.mvp-n.d{background:var(--mvp-yesil)}.mvp-n.s{background:var(--mvp-vurgu);box-shadow:0 0 0 5px rgba(255,122,43,.2)}',
        '.mvp-c{flex:1;height:3px;background:var(--mvp-cizgi)}.mvp-c.d{background:var(--mvp-yesil)}',
        '.mvp-etiket{display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;color:var(--mvp-soluk)}.mvp-etiket b{color:var(--mvp-yazi)}',
        '.mvp-hedef{margin-top:12px;font-size:13px;font-weight:600;line-height:1.5}.mvp-hedef b{color:var(--mvp-vurgu)}',
        '.mvp-kz{display:flex;flex-direction:column;gap:12px;margin-top:12px}.mvp-kz-s{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:center}',
        '.mvp-kz-s i{font-style:normal;font-size:22px;width:34px;height:34px;border-radius:10px;background:var(--mvp-yukselt);display:grid;place-items:center}.mvp-kz-s b{display:block;font-size:14px;font-weight:800}',
        '.mvp-kz-bar{display:block;height:5px;border-radius:99px;background:var(--mvp-cizgi);margin-top:5px;overflow:hidden}.mvp-kz-bar u{display:block;height:100%;background:var(--mvp-vurgu);border-radius:99px;text-decoration:none}',
        '.mvp-kz-s small{color:var(--mvp-soluk);font-size:12px;font-weight:700;white-space:nowrap}',
        '.mvp-alt{margin-top:10px;color:var(--mvp-soluk);font-size:12.5px;font-weight:600;line-height:1.45}',
        '.mvp-not{font-size:13.5px;line-height:1.55;font-weight:600;margin-top:8px;white-space:pre-line}',
        '@media (max-width:360px){.mvp-hero{grid-template-columns:110px minmax(0,1fr)}.mvp-halka{width:110px;height:110px}}',
        '@media (prefers-reduced-motion:reduce){.mvp-dilim.dolu{animation:none;opacity:1}}'
    ].join('\n');
    document.head.appendChild(st);
}
