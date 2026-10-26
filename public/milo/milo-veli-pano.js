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
function mvpSiradaki(dersler, simdi) { return mvpGelecek(dersler, {}, simdi)[0] || null; }

function miloSporcuProfilCiz(s) {
    mvpCss();
    let kap = document.getElementById('milo-sporcu-app'); if (kap) kap.classList.add('mvp-kap');
    let alan = document.getElementById('milo-sporcu-icerik'); if (!alan) return;
    let ilk = String(s.ad || '').split(' ')[0], p = s.paket, bugun = mvpIso(new Date());
    let kayit = {}; (s.kayitlar || []).forEach(function (r) { kayit[r.iso] = r.s; });
    let gelecek = mvpGelecek(s.dersler, kayit), n = p ? p.dersler.length : 0, kalan = p ? Math.max(0, 8 - n) : 0;
    let paketDersleri = p ? gelecek.slice(0, kalan) : [], yeniPaket = p ? gelecek[kalan] || null : null;
    let acikHak = (s.telafiler || []).filter(function (h) { return h.durum === 'acik'; });

    // ---- ödeme
    let odemeGun = null, odemeBaslik, odemeAlt, odemeCls = '';
    if (!p) { odemeBaslik = 'Paket'; odemeAlt = 'İlk dersten itibaren 8 derslik paketin burada dolar.'; }
    else if (!p.odendi) { odemeBaslik = 'Ödeme bekleniyor'; odemeAlt = p.no + '. paketin ödemesi henüz girilmedi.'; odemeCls = 'bek'; }
    else if (p.sonrakiOdendi) { odemeBaslik = 'Sonraki paket de ödendi ✓'; odemeAlt = (p.no + 1) + '. paket hazır, ödeme beklenmiyor.'; }
    else if (yeniPaket) { odemeGun = yeniPaket.gun; odemeBaslik = odemeGun === 0 ? 'Ödeme bugün' : 'Ödemeye ' + odemeGun + ' gün'; odemeAlt = (p.no + 1) + '. paket ' + mvpTarih(yeniPaket.iso) + ' ' + MVP_GUN[yeniPaket.tarih.getDay()] + ' dersiyle başlıyor.'; }
    else { odemeBaslik = kalan ? kalan + ' ders kaldı' : 'Paket tamamlandı'; odemeAlt = 'Yeni paket, paket bitince başlar.'; }
    let R = 15.5, C = 2 * Math.PI * R, dolu = C * (p ? n / 8 : 0);
    let halka = '<div class="mvp-halka"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="' + R + '" fill="none" stroke="var(--mvp-cizgi)" stroke-width="3.2"/><circle class="mvp-halka-d" cx="18" cy="18" r="' + R + '" fill="none" stroke="var(--mvp-vurgu)" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="' + dolu.toFixed(2) + ' ' + C.toFixed(2) + '" style="--c:' + C.toFixed(2) + '"/></svg>'
        + '<div class="mvp-orta"><div>' + (odemeGun != null ? '<b>' + odemeGun + '</b><small>gün kaldı</small>' : '<b>' + n + '/8</b><small>ders</small>') + '</div></div></div>';
    let cipler = (p ? '<span class="mvp-cip">' + (kalan ? kalan + ' ders kaldı' : '8/8 tamam') + '</span>' : '')
        + (p && p.odendi ? '<span class="mvp-cip yesil">✓ ' + p.no + '. paket ödendi' + (p.odemeTarihi ? ' · ' + miloEsc(mvpKisa(p.odemeTarihi)) : '') + '</span>' : '')
        + (acikHak.length ? '<span class="mvp-cip mor">🔁 ' + acikHak.length + ' telafi hakkı</span>' : '');
    let ustHTML = '<div class="mvp-hero ' + odemeCls + '">' + halka + '<div class="mvp-hero-m"><h3>' + miloEsc(odemeBaslik) + '</h3><p>' + miloEsc(odemeAlt) + '</p><div class="mvp-rozetler">' + cipler + '</div></div></div>';

    // ---- delikli kart (paketin 8 dersi)
    let biletHTML = '';
    if (p) {
        let delik = '';
        for (let i = 0; i < 8; i++) {
            if (i < n) { let d = p.dersler[i], t = MVP_DURUM[d] || ['•', '']; delik += '<div class="mvp-delik ' + d + '" title="' + miloEsc(mvpTarih(p.tarihler[i]) + ' · ' + t[1]) + '"><i>' + t[0] + '</i><small>' + miloEsc(mvpKisa(p.tarihler[i])) + '</small></div>'; }
            else { let g = paketDersleri[i - n]; delik += '<div class="mvp-delik s' + (i === 7 ? ' son' : '') + '">' + (g ? '<b>' + g.tarih.getDate() + '</b><small>' + MVP_AY[g.tarih.getMonth()].slice(0, 3) + '</small>' : '<small>—</small>') + '</div>'; }
        }
        let olan = {}; p.dersler.forEach(function (d) { olan[d] = 1; });
        biletHTML = '<div class="mvp-bilet"><div class="mvp-bilet-b"><b>' + p.no + '. paket · 8 ders</b><span>' + (kalan ? kalan + ' ders kaldı' : 'tamamlandı') + '</span></div><div class="mvp-bilet-c"></div><div class="mvp-delikler">' + delik + '</div>'
            + '<div class="mvp-bilet-not">' + ['g', 'm', 'h', 'y'].filter(function (k) { return olan[k]; }).map(function (k) { return MVP_DURUM[k][0] + ' ' + MVP_DURUM[k][1].toLocaleLowerCase('tr'); }).join(' · ') + (p.telafi ? ' · +' + p.telafi + ' telafi dersi' : '') + '</div></div>';
    }

    // ---- takvim (bu ay; ödeme günü / kalan dersler sonraki aydaysa o ay da)
    let gelecekIso = {}; paketDersleri.forEach(function (g) { gelecekIso[g.iso] = 1; });
    let digerDers = {}; gelecek.forEach(function (g) { if (!gelecekIso[g.iso]) digerDers[g.iso] = 1; });
    let odemeIso = !p || !p.odendi || p.sonrakiOdendi || !yeniPaket ? null : yeniPaket.iso;
    let aylar = [bugun.slice(0, 7)], sonIso = odemeIso || (paketDersleri.length ? paketDersleri[paketDersleri.length - 1].iso : bugun);
    if (sonIso.slice(0, 7) !== aylar[0]) aylar.push(sonIso.slice(0, 7));
    let takvimHTML = aylar.map(function (ay, ai) {
        let ilkGun = new Date(ay + '-01T12:00:00'), gunSay = new Date(ilkGun.getFullYear(), ilkGun.getMonth() + 1, 0).getDate(), bos = (ilkGun.getDay() + 6) % 7, h = '';
        let say = { g: 0, m: 0, h: 0, y: 0 };
        if (!ai) h += ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(function (g) { return '<div class="mvp-tb">' + g + '</div>'; }).join('');
        for (let i = 0; i < bos; i++) h += '<div></div>';
        for (let d = 1; d <= gunSay; d++) {
            let iso = ay + '-' + String(d).padStart(2, '0'), k = kayit[iso], cls = '';
            if (k === 'g' || k === 't') cls = 'geldi'; else if (k === 'm') cls = 'haber'; else if (k === 'h') cls = 'hasta'; else if (k === 'y') cls = 'yok';
            else if (iso === odemeIso) cls = 'odeme'; else if (gelecekIso[iso]) cls = 'gelecek'; else if (digerDers[iso]) cls = 'ders';
            let sk = k === 't' ? 'g' : k; if (sk && say[sk] != null) say[sk]++;
            h += '<div class="mvp-tg ' + cls + (iso === bugun ? ' bugun' : '') + '" title="' + miloEsc(mvpTarih(iso) + (k && MVP_DURUM[k] ? ' · ' + MVP_DURUM[k][1] : iso === odemeIso ? ' · yeni paket' : gelecekIso[iso] ? ' · ders' : '')) + '">' + d + '</div>';
        }
        let ozet = [say.g ? say.g + ' geldi' : '', say.m ? say.m + ' haber verdi' : '', say.h ? say.h + ' hasta' : '', say.y ? say.y + ' gelmedi' : ''].filter(Boolean).join(' · ');
        return '<h4' + (ai ? ' style="margin-top:14px"' : '') + '>' + MVP_AY[ilkGun.getMonth()] + (ozet ? ' <span>' + ozet + '</span>' : '') + '</h4><div class="mvp-takvim">' + h + '</div>';
    }).join('');
    let lejant = '<div class="mvp-lejant"><span><i class="geldi"></i>geldi</span><span><i class="haber"></i>haber verdi</span><span><i class="hasta"></i>hasta</span><span><i class="yok"></i>gelmedi</span><span><i class="gelecek"></i>gireceği ders</span>' + (odemeIso ? '<span><i class="odeme"></i>yeni paket</span>' : '') + '</div>';

    // ---- telafi
    let telafiHTML = acikHak.map(function (h) {
        let k = Math.max(0, mvpGunFark(bugun, h.bitis)), oran = Math.max(4, Math.min(100, k / 30 * 100));
        return '<div class="mvp-kart mvp-telafi"><div class="mvp-tik">🔁</div><div><b>Telafi hakkı · ' + miloEsc(mvpTarih(h.bitis)) + ' tarihine kadar</b><div class="mvp-alt">' + miloEsc(mvpTarih(h.iso)) + ' dersinde ' + (h.s === 'h' ? 'hastaydı' : h.s === 'm' ? 'haber verdi' : 'gelemedi') + '. ' + (k === 0 ? 'Son gün bugün.' : k + ' gün içinde uygun bir derse gelebilir; antrenörüne yazmanız yeterli.') + '</div><div class="mvp-bar"><i style="width:' + oran.toFixed(0) + '%"></i></div></div></div>';
    }).join('');
    let kullanilan = (s.telafiler || []).filter(function (h) { return h.durum === 'kullanildi' && h.kullanim; });
    if (!telafiHTML && kullanilan.length) telafiHTML = '<div class="mvp-not-sat">✓ ' + miloEsc(mvpTarih(kullanilan[kullanilan.length - 1].kullanim)) + ' telafi dersi yapıldı.</div>';

    // ---- gireceği dersler
    let sira = gelecek.slice(0, Math.min(3, kalan + 1)).map(function (g, i) {
        let no = n + i + 1, yeni = p && i >= kalan, etiket = yeni ? '<span class="mvp-e y">💳 Yeni paket</span>' : no === 8 ? '<span class="mvp-e son">Son ders</span>' : g.gun <= 1 ? '<span class="mvp-e s">' + mvpKalanYazi(g.gun) + '</span>' : '';
        return '<div class="mvp-d"><div class="mvp-dg"><small>' + MVP_GUN_KISA[g.tarih.getDay()] + '</small><b>' + g.tarih.getDate() + '</b></div><div class="mvp-dm"><b>' + (p ? (yeni ? (p.no + 1) + '. paket başlıyor' : no + '. ders') : 'Ders') + ' · ' + miloEsc(g.bas) + '</b><small>' + mvpKalanYazi(g.gun) + (g.gun > 1 ? ' · ' + MVP_GUN[g.tarih.getDay()] : '') + (yeni && !p.sonrakiOdendi ? ' · ödeme bu derse kadar' : '') + '</small></div>' + etiket + '</div>';
    }).join('');
    let siraHTML = sira ? '<div class="mvp-kart"><h4>Gireceği dersler</h4><div class="mvp-dersler">' + sira + '</div></div>'
        : (s.dersler && s.dersler.length ? '' : '<div class="mvp-not-sat">Ders programı henüz girilmedi.</div>');

    // ---- bu hafta neler yaptık (Ders Günlüğü)
    let bh = s.buHafta || [], buHaftaHTML = '';
    if (bh.length) buHaftaHTML = '<div class="mvp-kart"><h4>Bu hafta neler yaptık <span>' + miloEsc(mvpTarih(bh[0].tarih)) + '</span></h4>'
        + bh.filter(function (k) { return k.konu || k.yapilanlar; }).map(function (k) { return '<div class="mvp-konu">' + (k.konu ? '<b>' + miloEsc(k.konu) + '</b>' : '') + (k.yapilanlar ? '<p>' + miloEsc(k.yapilanlar) + '</p>' : '') + '</div>'; }).join('') + '</div>';

    alan.innerHTML = '<div class="mvp">'
        + '<div class="mvp-ust"><div><small>Merhaba</small><b>' + miloEsc(ilk) + '</b><span>' + miloEsc(s.grup) + (p ? ' · ' + p.no + '. paket · ' + n + '/8 ders' : '') + '</span></div><div class="mvp-av">' + miloEsc(ilk.charAt(0).toLocaleUpperCase('tr') || '?') + '</div></div>'
        + ustHTML + biletHTML + telafiHTML + siraHTML
        + '<div class="mvp-kart">' + takvimHTML + lejant + '</div>'
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
        '#milo-sporcu-app.mvp-kap{--mvp-zemin:#0c0b0a;--mvp-kart:#171513;--mvp-yukselt:#1f1c19;--mvp-cizgi:#2a2622;--mvp-yazi:#f3eee8;--mvp-soluk:#9b928a;--mvp-vurgu:#ff7a2b;--mvp-sari:#facc15;--mvp-yesil:#4ade80;--mvp-mor:#c4b5fd;--mvp-hasta:#f9a8d4;background:var(--mvp-zemin)!important;color:var(--mvp-yazi);font-family:Manrope,system-ui,sans-serif;color-scheme:dark}',
        '#milo-sporcu-app.mvp-kap>button{background:var(--mvp-kart)!important;color:var(--mvp-soluk)!important;border:0!important;box-shadow:none!important;border-radius:99px!important}',
        '.mvp{display:flex;flex-direction:column;gap:12px;padding-bottom:30px}',
        '.mvp-ust{display:flex;justify-content:space-between;align-items:flex-end;margin:0 2px 2px}.mvp-ust small{color:var(--mvp-soluk);font-weight:700;font-size:13px}.mvp-ust b{display:block;font-size:32px;font-weight:800;letter-spacing:-.03em;line-height:1.05}.mvp-ust span{display:block;color:var(--mvp-soluk);font-weight:600;font-size:12.5px;margin-top:2px}',
        '.mvp-av{width:46px;height:46px;border-radius:14px;background:var(--mvp-vurgu);display:grid;place-items:center;font-weight:800;font-size:19px;color:#1a0c03;flex:none}',
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
        // delikli kart
        '.mvp-bilet{background:var(--mvp-vurgu);color:#1a0c03;border-radius:22px;padding:16px 16px 14px;position:relative}',
        '.mvp-bilet::before,.mvp-bilet::after{content:"";position:absolute;top:44px;width:18px;height:18px;border-radius:50%;background:var(--mvp-zemin)}.mvp-bilet::before{left:-9px}.mvp-bilet::after{right:-9px}',
        '.mvp-bilet-b{display:flex;justify-content:space-between;align-items:baseline;gap:8px}.mvp-bilet-b b{font-size:16px;font-weight:800}.mvp-bilet-b span{font-size:12px;font-weight:800;opacity:.72}',
        '.mvp-bilet-c{border-top:2px dashed rgba(26,12,3,.25);margin:14px 0 12px}',
        '.mvp-delikler{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}',
        '.mvp-delik{aspect-ratio:1;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;line-height:1;background:rgba(26,12,3,.12);font-size:11px;animation:mvpDelik .35s backwards}',
        '.mvp-delik i{font-style:normal;font-size:17px}.mvp-delik small{font-size:9.5px;opacity:.75;margin-top:2px}.mvp-delik b{font-size:16px}',
        '.mvp-delik.g,.mvp-delik.t{background:#1a0c03;color:var(--mvp-vurgu)}.mvp-delik.m{background:#1a0c03;color:var(--mvp-mor)}.mvp-delik.h{background:#1a0c03;color:var(--mvp-hasta)}.mvp-delik.y{background:rgba(26,12,3,.35);color:#fff3ea}',
        '.mvp-delik.s{border:2px dashed rgba(26,12,3,.45);background:transparent}.mvp-delik.son{border-style:solid}',
        '.mvp-delikler .mvp-delik:nth-child(2){animation-delay:.05s}.mvp-delikler .mvp-delik:nth-child(3){animation-delay:.1s}.mvp-delikler .mvp-delik:nth-child(4){animation-delay:.15s}.mvp-delikler .mvp-delik:nth-child(5){animation-delay:.2s}.mvp-delikler .mvp-delik:nth-child(6){animation-delay:.25s}.mvp-delikler .mvp-delik:nth-child(7){animation-delay:.3s}.mvp-delikler .mvp-delik:nth-child(8){animation-delay:.35s}',
        '@keyframes mvpDelik{from{transform:scale(.6);opacity:0}}',
        '.mvp-bilet-not{font-size:12px;font-weight:700;margin-top:12px;opacity:.85}',
        // telafi
        '.mvp-telafi{display:flex;gap:12px;align-items:flex-start}.mvp-tik{width:40px;height:40px;border-radius:12px;background:rgba(196,181,253,.12);display:grid;place-items:center;font-size:19px;flex:none}',
        '.mvp-telafi b{font-size:14px;font-weight:800;display:block;margin-bottom:2px}.mvp-telafi>div:last-child{flex:1;min-width:0}',
        '.mvp-bar{height:6px;border-radius:99px;background:var(--mvp-cizgi);margin-top:8px;overflow:hidden}.mvp-bar i{display:block;height:100%;background:var(--mvp-mor);border-radius:99px}',
        '.mvp-not-sat{color:var(--mvp-soluk);font-size:12.5px;font-weight:700;padding:0 4px}',
        // dersler
        '.mvp-dersler{display:flex;flex-direction:column}.mvp-d{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--mvp-cizgi)}.mvp-d:first-child{border-top:0}',
        '.mvp-dg{text-align:center;line-height:1.05}.mvp-dg small{display:block;font-size:10px;font-weight:800;color:var(--mvp-vurgu);text-transform:uppercase}.mvp-dg b{font-size:17px;font-weight:800}',
        '.mvp-dm{min-width:0}.mvp-dm b{display:block;font-size:13.5px;font-weight:700}.mvp-dm small{color:var(--mvp-soluk);font-size:12px;font-weight:600}',
        '.mvp-e{font-size:12px;font-weight:800;padding:4px 9px;border-radius:99px;white-space:nowrap}.mvp-e.s{color:var(--mvp-vurgu);background:rgba(255,122,43,.12)}.mvp-e.son{color:#1a0c03;background:var(--mvp-vurgu)}.mvp-e.y{color:var(--mvp-yazi);background:var(--mvp-yukselt)}',
        // takvim
        '.mvp-takvim{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;text-align:center}.mvp-tb{font-size:10.5px;font-weight:800;color:var(--mvp-soluk)}',
        '.mvp-tg{aspect-ratio:1;border-radius:10px;display:grid;place-items:center;font-size:12.5px;font-weight:700;color:#5d554e}',
        '.mvp-tg.ders{color:var(--mvp-yazi);background:var(--mvp-yukselt)}.mvp-tg.geldi{background:var(--mvp-yesil);color:#052e16}.mvp-tg.haber{background:var(--mvp-mor);color:#2e1065}.mvp-tg.hasta{background:var(--mvp-hasta);color:#500724}',
        '.mvp-tg.yok{background:#3a3430;color:#b5aba2;text-decoration:line-through}.mvp-tg.gelecek{box-shadow:inset 0 0 0 2px var(--mvp-vurgu);color:var(--mvp-vurgu)}.mvp-tg.odeme{background:var(--mvp-vurgu);color:#1a0c03}.mvp-tg.bugun{outline:2px solid var(--mvp-yazi);outline-offset:1px}',
        '.mvp-lejant{display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:12px;font-size:11.5px;font-weight:700;color:var(--mvp-soluk)}.mvp-lejant i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:4px;vertical-align:-1px}',
        '.mvp-lejant i.geldi{background:var(--mvp-yesil)}.mvp-lejant i.haber{background:var(--mvp-mor)}.mvp-lejant i.hasta{background:var(--mvp-hasta)}.mvp-lejant i.yok{background:#3a3430}.mvp-lejant i.gelecek{box-shadow:inset 0 0 0 2px var(--mvp-vurgu)}.mvp-lejant i.odeme{background:var(--mvp-vurgu)}',
        // bu hafta
        '.mvp-konu b{display:block;font-size:14.5px;font-weight:800}.mvp-konu p{margin:4px 0 0;color:var(--mvp-soluk);font-size:13px;font-weight:600;line-height:1.5;white-space:pre-line}.mvp-konu+.mvp-konu{margin-top:10px}',
        // 🌱 beceri bahçesi · yakında
        '.mvp-yakinda{position:relative;overflow:hidden;background:linear-gradient(160deg,#1b2a1f,#171513 60%);border:1px dashed #3b5a43}',
        '.mvp-bahce{display:flex;gap:6px;font-size:26px;margin:2px 0 8px}.mvp-bahce span{display:inline-block;animation:mvpSalla 2.6s ease-in-out infinite;transform-origin:bottom center}',
        '.mvp-bahce span:nth-child(2){animation-delay:.4s}.mvp-bahce span:nth-child(3){animation-delay:.8s;opacity:.45}.mvp-bahce span:nth-child(4){animation-delay:1.2s;opacity:.25}@keyframes mvpSalla{50%{transform:rotate(-8deg) scale(1.06)}}',
        '.mvp-yakinda b{font-size:15px;font-weight:800}.mvp-yk-r{position:absolute;right:14px;top:14px;font-size:11px;font-weight:800;color:#86efac;background:rgba(134,239,172,.12);padding:4px 9px;border-radius:99px}',
        '.mvp-not{font-size:13.5px;line-height:1.55;font-weight:600;white-space:pre-line}',
        '@media (max-width:360px){.mvp-hero{grid-template-columns:100px minmax(0,1fr)}.mvp-halka{width:100px;height:100px}.mvp-delikler{gap:7px}}',
        '@media (prefers-reduced-motion:reduce){.mvp-halka-d,.mvp-delik,.mvp-bahce span{animation:none}}'
    ].join('\n');
    document.head.appendChild(st);
}
