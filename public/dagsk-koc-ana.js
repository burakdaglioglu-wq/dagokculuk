/* ================================================================================================
   🏠 ANTRENÖR ANA EKRANI (v453, 2026-11-23). Kullanıcı (iki ekran görüntüsü: boş "Ana Ekran — Sporcu girişi yap" + kahverengi
   "Ana Menü" penceresi): "burası çok saçma". Yönetici kapatılınca / 🏠 Ana Menü'ye basılınca antrenör buraya gelir; ayrı menü
   penceresi kalktı. İçerik: Karışık Sınıf (süren ders), bugünün dersleri, 4 canlı kart, lig seçip skor gir, diğer ekranlar,
   son skorlar ve gelmeyenler (dokun → profil). Sporcu girişli cihazda #icerik-ana eskisi gibi sporcunun ana ekranıdır.
   Stil: telefon menüsüyle aynı ym-* sınıfları + koc-*; renkler body.koc-ana'da sabit grafit (kahverengi zemin yok).
   ================================================================================================ */
(function () {
    const IK = {
        km: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
        yonetici: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z"/>',
        yarisma: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5c0 3 1.3 4.7 3.8 5M16 6h3.5c0 3-1.3 4.7-3.8 5M12 13v4M8.5 20h7M10 17h4"/>',
        canli: '<circle cx="12" cy="12" r="2"/><path d="M8 16a5.6 5.6 0 0 1 0-8M16 8a5.6 5.6 0 0 1 0 8M5 19a9.8 9.8 0 0 1 0-14M19 5a9.8 9.8 0 0 1 0 14"/>',
        ozel: '<path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"/>',
        timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 3h5"/>',
        klasman: '<path d="M5 20V11M12 20V5M19 20v-6"/>',
        liderlik: '<path d="M9 3 6.5 8M15 3l2.5 5"/><circle cx="12" cy="14.5" r="6"/><path d="m12 11.8.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>',
        takimlar: '<circle cx="9" cy="8" r="3.3"/><path d="M2.8 19.5c.6-3.4 3-5.2 6.2-5.2s5.6 1.8 6.2 5.2M16 5.1a3.3 3.3 0 0 1 0 6.1M18 14.7c1.9.7 3 2.3 3.3 4.8"/>',
        duello: '<path d="m4 4 11 11M20 4 9 15M14 18l3-3M10 18l-3-3M17 18l3 3M7 18l-3 3"/>',
        daha: '<circle cx="5.5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18.5" cy="12" r="1.4"/>',
        cikis: '<path d="M10 4H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h4M14.5 8l4 4-4 4M18.5 12H9"/>',
        yenile: '<path d="M20 5v5h-5M4 19v-5h5M19 10a7.5 7.5 0 0 0-13-2.5L4 10M5 14a7.5 7.5 0 0 0 13 2.5l2-2.5"/>',
        kisi: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.7-3.8 3.4-5.8 7-5.8s6.3 2 7 5.8"/>'
    };
    const ik = k => '<svg class="yon-ik" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IK[k] + '</svg>';
    const LIG = [['buyukler', 'Büyükler'], ['yildizlar', 'Yıldızlar'], ['kucukler', 'Küçükler'], ['minikler', 'Minikler']];
    let dersler = null, sonCizim = 0, zaman = null, gunler = [];
    const onceYazi = t => { let dk = Math.round((Date.now() - t) / 60000); return dk < 1 ? 'az önce' : dk < 60 ? dk + ' dk önce' : Math.floor(dk / 60) + ' saat önce'; };

    function skorlar() {
        let l = [], simdi = Date.now();
        LIG.forEach(([g, ad2]) => Object.keys(turnuvaDB[g] || {}).forEach(ad => { let sp = turnuvaDB[g][ad], t = sp && sp.sonSkorZamani; if (t && simdi - t < 864e5 && (sp.seriler || []).length) l.push({ g, ad, t, lig: ad2, puan: sp.toplamSkor || 0, seri: sp.seriler.length }); }));
        return l.sort((a, b) => b.t - a.t);
    }
    function kmDurum() { // süren ders: giriş panelindeki Karışık Sınıf kartıyla aynı kaynak
        try { kmDevamBanneriGuncelle(); } catch (e) {}
        let b = document.getElementById('km-giris-btn'); if (!b || !b.classList.contains('aktif-ders')) return null;
        if (!b.dataset.katil) return 'Süren ders var, dokun ve devam et';
        let a = (typeof _kmSunucuAktif !== 'undefined' && _kmSunucuAktif) || [];
        return a.length === 1 ? esc(a[0].konum.ad) + ': ' + a[0].sayi + ' sporcu, dokun ve katıl' : a.length + ' yerde süren ders var, dokun ve seç';
    }
    function yarismaYazi() {
        let d = {}; try { d = typeof kyDepoOku === 'function' ? kyDepoOku('yarismalar') || {} : {}; } catch (e) {}
        let b = bugunISO(), y = Object.keys(d).map(x => d[x]).filter(x => x && !x.sil && x.tarih >= b).sort((p, q) => String(p.tarih).localeCompare(String(q.tarih)))[0];
        if (!y) return ['yaklaşan yarışma yok']; let ad = esc(String(y.ad || 'yarışma').trim().slice(0, 28));
        return y.tarih === b ? ['bugün: <b>' + ad + '</b>', 1] : [y.tarih.split('-').reverse().slice(0, 2).join('.') + ' · ' + ad];
    }
    window.kocAnaCiz = function (el) {
        css(); if (!el) return; sonCizim = Date.now();
        let s = {}; try { s = yoneticiSayilar(); } catch (e) {}
        let sk = skorlar(), saat = new Date().getHours(), ad = typeof _oturum !== 'undefined' && _oturum && _oturum.ad ? String(_oturum.ad).split(' ')[0] : '', yonMu = typeof _oturum !== 'undefined' && _oturum && _oturum.rol === 'yonetici';
        ad = ad ? ad.charAt(0).toLocaleUpperCase('tr') + ad.slice(1) : '';
        gunler = []; try { gunler = devamsizlikListesi(14).filter(x => x.gun !== null).sort((a, b) => a.gun - b.gun); } catch (e) {}
        let bagli = false; try { bagli = window.dagskSync && window.dagskSync.wsBagliMi(); } catch (e) {}
        let kart = (renk, i, ad2, alt, fn) => '<button type="button" class="ym-kart ' + renk + '" onclick="' + fn + '"><span class="ym-ik">' + ik(i) + '</span><b>' + ad2 + '</b><small' + (alt[1] ? ' class="dikkat"' : '') + '>' + alt[0] + '</small></button>';
        let oge = (i, ad2, fn) => '<button type="button" class="ym-oge gri" onclick="' + fn + '"><span class="ym-ik">' + ik(i) + '</span><span class="ym-ad"><b>' + ad2 + '</b></span></button>';
        let satir = (g, ad2, alt, sag, i) => '<div class="koc-satir"><button type="button" class="koc-kisi" onclick="sporcuProfilAc(' + escQ(g + '|' + ad2) + ')">' + (typeof fotoAvatarHTML === 'function' ? fotoAvatarHTML(fotoAnahtar(g, ad2), ad2, 'ym-av', true) : '') + '<span><b>' + esc(ad2) + '</b><small>' + alt + '</small></span></button>' + sag + '</div>';
        let km = kmDurum();
        el.innerHTML = '<div class="koc" id="koc-ana">'
            + '<header class="koc-ust"><img src="/tanitim-logo.png" alt="DAĞ Spor Kulübü" width="44" height="44"><div><h1>' + (saat < 12 ? 'Günaydın' : saat < 18 ? 'İyi günler' : 'İyi akşamlar') + (ad ? ', ' + esc(ad) : '') + '</h1><small>' + new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' }) + '</small></div>'
            + '<button type="button" class="koc-yuv" onclick="bulutManuelYenile()" aria-label="Yenile, ' + (bagli ? 'çevrimiçi' : 'bağlantı yok') + '">' + ik('yenile') + '<i class="' + (bagli ? 'iyi' : 'kotu') + '"></i></button>' + (typeof _oturum !== 'undefined' && _oturum ? '<button type="button" class="koc-yuv" onclick="hesabimAc()" aria-label="Hesabım">' + ik('kisi') + '</button>' : '') + '</header>'
            + '<button type="button" class="koc-km' + (km ? ' surer' : '') + '" onclick="kmAc()"><span class="ym-ik">' + ik('km') + '</span><span><b>Karışık Sınıf</b><small id="koc-km-alt">' + (km || 'Ders aç, yoklama, skor, oyun ve yarışma') + '</small></span><em aria-hidden="true">›</em></button>'
            + '<div id="koc-dersler">' + dersHTML() + '</div>'
            + '<div class="ym-kartlar">'
            + kart('altin', 'yonetici', 'Yönetici', s.aidat ? ['<b>' + s.aidat + '</b> kişi bu ay ödemedi', 1] : [yonMu || !ad ? 'aidat, yoklama, kayıtlar' : 'yönetici PIN’i ister'], "yoneticiPaneliAc()")
            + kart('mavi', 'yarisma', 'Yarışmalar', yarismaYazi(), "kocGit('yarisma')")
            + kart('iyi', 'canli', 'Canlı Takip', s.seri ? ['bugün <b>' + s.atan + '</b> kişi · ' + s.seri + ' seri'] : [s.gelen ? 'bugün <b>' + s.gelen + '</b> kişi geldi' : 'bugün henüz kayıt yok'], "kocGit('canlitakip')")
            + kart('gri', 'ozel', 'Özel Ders', ['Sporla Gelişiyorum'], "kocGit('ozelders')") + '</div>'
            + '<h4 class="ym-bas">LİG SEÇ, SKOR GİR</h4><div class="koc-lig">' + LIG.map(([g, a]) => { let n = Object.keys(turnuvaDB[g] || {}).filter(x => { let q = turnuvaDB[g][x]; return q && !q.pasif && !q.donduruldu; }).length; return '<button type="button" onclick="kocLig(\'' + g + '\')"><b>' + a + '</b><small>' + n + ' sporcu</small></button>'; }).join('') + '</div>'
            + '<h4 class="ym-bas">DİĞER EKRANLAR</h4><div class="ym-izgara">' + oge('timer', 'Sayaç', "kocGit('timer')") + oge('liderlik', 'Liderlik', "kocGit('liderlik')") + oge('klasman', 'Klasman', "kocGit('klasman')") + oge('takimlar', 'Takımlar', "kocGit('takimlar')") + oge('duello', 'Düello', "kocGit('duello')") + oge('daha', 'Daha fazlası', 'dahaPanelAc()') + '</div>'
            + (sk.length ? '<h4 class="ym-bas">SON SKORLAR</h4><div class="koc-liste">' + sk.slice(0, 5).map(x => satir(x.g, x.ad, x.lig + ' · ' + x.seri + ' seri · ' + onceYazi(x.t), '<b class="koc-puan">' + x.puan + '</b>')).join('') + '</div>' : '')
            + (gunler.length ? '<h4 class="ym-bas">14 GÜNDÜR GELMEYENLER · ' + gunler.length + '</h4><div class="koc-liste">' + gunler.slice(0, 4).map((x, i) => satir(x.g, x.ad, x.gun + ' gündür yok', '<button type="button" class="koc-wa" onclick="kocWa(' + i + ')">Veliye yaz</button>')).join('') + '</div>' : '')
            + '<button type="button" class="koc-cikis" onclick="kocGirisEkrani()">' + ik('cikis') + 'Giriş ekranına dön</button></div>';
        if (typeof kmProgramSlotlariGetir === 'function') kmProgramSlotlariGetir().then(sl => { dersler = kmBugunDersleri(sl || []); let e = document.getElementById('koc-dersler'); if (e) e.innerHTML = dersHTML(); }).catch(() => {});
        // süren ders bilgisi sunucudan biraz sonra gelir → yalnız o satır tazelenir
        clearTimeout(zaman); zaman = setTimeout(() => { let k = document.getElementById('koc-km-alt'); if (!k) return; let m = kmDurum(); k.innerHTML = m || 'Ders aç, yoklama, skor, oyun ve yarışma'; k.closest('.koc-km').classList.toggle('surer', !!m); }, 1800);
    };
    function dersHTML() {
        if (!dersler || !dersler.length) return '';
        return '<h4 class="ym-bas">BUGÜNÜN DERSLERİ</h4><div class="koc-liste">' + dersler.slice(0, 5).map((x, i) => { let n = kmDersSporculari(x.s).length; return '<div class="koc-satir ders' + (x.simdi ? ' simdi' : '') + '"><span class="koc-saat">' + esc(x.s.baslangicSaat) + '<small>' + esc(x.s.bitisSaat) + '</small></span><span class="koc-ders"><b>' + esc(x.s.grup || 'Ders') + '</b><small>' + (n ? n + ' kayıtlı sporcu' : 'kayıtlı sporcu yok') + (x.simdi ? ' · şimdi' : '') + '</small></span>' + (n ? '<button type="button" class="koc-wa' + (x.simdi ? ' dolu' : '') + '" onclick="kocDers(' + i + ')">Başlat</button>' : '') + '</div>'; }).join('') + '</div>';
    }
    window.kocDers = i => { let x = dersler && dersler[i]; if (x) _dersSlotBaslat(x); };
    window.kocWa = i => { let x = gunler[i]; if (x) devamsizlikWhatsApp(x.ad, x.gun); };
    window.kocGit = s => sekmeAc(s);
    window.kocLig = g => { grupKurulumu(g); sekmeAc('skor'); };
    window.kocGirisEkrani = () => location.reload();
    // senkron gelince: en fazla 5 sn'de bir, kaydırma yeri korunur
    window.kocAnaYenile = function () { let el = document.getElementById('icerik-ana'); if (!el || !document.getElementById('koc-ana') || !el.classList.contains('aktif') || Date.now() - sonCizim < 5000) return; let y = el.scrollTop; kocAnaCiz(el); el.scrollTop = y; };
    function css() {
        if (document.getElementById('koc-css')) return; let st = document.createElement('style'); st.id = 'koc-css';
        st.textContent = `body.koc-ana{--bg-main:#0f1216;--bg-panel:#1c2027;--text-main:#e8ebf0;--text-muted:#8f98a7;--border-color:#2b313b;--surface-1:#14171c;--surface-border:#2b313b;--text-secondary:#8f98a7;background:#0f1216!important}
body.koc-ana.light-theme{--bg-main:#f4f7f6;--bg-panel:#fff;--text-main:#1b2422;--text-muted:#5d6b68;--border-color:#e0e6e4;--surface-1:#fff;--surface-border:#e0e6e4;--text-secondary:#5d6b68;background:#f4f7f6!important}
body.koc-ana #ust-bar .grup-satir{display:none!important}body.koc-ana #ust-bar{background:var(--surface-1)!important;border-color:var(--border-color)!important;box-shadow:none!important}@media (max-width:680px){body.koc-ana #ust-bar{display:none!important}}
body.koc-ana #icerik-ana{background:var(--bg-main);height:auto;min-height:0}
.koc{width:100%;max-width:760px;margin:0 auto;color:var(--text-main);flex-shrink:0}.koc button{font-family:inherit;transform:none!important;touch-action:manipulation;cursor:pointer}
.koc-ust{display:flex;align-items:center;gap:11px;margin-bottom:16px}.koc-ust img{width:44px;height:44px;object-fit:contain}.koc-ust div{flex:1;min-width:0}.koc-ust h1{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em;line-height:1.15;color:var(--text-main);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.koc-ust small{font-size:13px;color:var(--text-muted)}
.koc-yuv{position:relative;width:44px;height:44px;flex:none;border-radius:50%;border:0;background:var(--bg-panel);color:var(--text-main);display:grid;place-items:center;padding:0}.koc-yuv i{position:absolute;right:9px;top:9px;width:9px;height:9px;border-radius:50%;border:2px solid var(--bg-panel)}.koc-yuv i.iyi{background:#3fbf7f}.koc-yuv i.kotu{background:#ef6461}
.koc-km{width:100%;display:flex;align-items:center;gap:14px;text-align:left;padding:16px;border-radius:18px;border:1px solid transparent;background:#ff6a1a;color:#1d0d02;margin-bottom:12px;min-height:84px}.koc-km .ym-ik{width:48px;height:48px;border-radius:14px;background:rgba(29,13,2,.14);color:#1d0d02}.koc-km .yon-ik{width:26px;height:26px}.koc-km>span:nth-child(2){flex:1;min-width:0}.koc-km b{display:block;font-size:20px;font-weight:800;line-height:1.2}.koc-km small{display:block;font-size:13.5px;font-weight:600;line-height:1.35;color:#3a1c06}.koc-km em{font-style:normal;font-size:28px;line-height:1}
.koc-km.surer small::before{content:'';display:inline-block;width:9px;height:9px;border-radius:50%;background:#0c7a3d;margin-right:6px}
.koc .ym-kartlar{margin-top:12px}@media (min-width:700px){.koc .ym-kartlar{grid-template-columns:repeat(4,1fr)}.koc .ym-izgara{grid-template-columns:repeat(3,1fr)}}
.koc .ym-bas{margin:18px 2px 8px}
.koc-lig{display:grid;grid-template-columns:1fr 1fr;gap:8px}@media (min-width:700px){.koc-lig{grid-template-columns:repeat(4,1fr)}}.koc-lig button{text-align:left;min-height:56px;padding:9px 13px;border-radius:13px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);display:grid;align-content:center}.koc-lig b{font-size:15px;font-weight:700}.koc-lig small{font-size:12px;color:var(--text-muted)}
.koc-liste{border:1px solid var(--border-color);border-radius:14px;background:var(--bg-panel);overflow:hidden}.koc-satir{display:flex;align-items:center;gap:10px;border-top:1px solid var(--border-color);padding:0 12px;min-height:60px}.koc-satir:first-child{border-top:0}
.koc-kisi{flex:1;min-width:0;display:flex;align-items:center;gap:10px;text-align:left;background:none;border:0;padding:8px 0;min-height:58px;color:var(--text-main)}.koc-kisi>span:last-child,.koc-ders{flex:1;min-width:0}.koc-satir b{font-size:14px;font-weight:700}.koc-kisi b,.koc-ders b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.koc-satir small{display:block;font-size:12px;color:var(--text-muted)}.koc .ym-av{flex:none}
.koc-satir .koc-puan{font-size:19px;font-weight:800;font-variant-numeric:tabular-nums}.koc-saat{width:52px;flex:none;font-size:16px;font-weight:800;font-variant-numeric:tabular-nums}.koc-satir.simdi .koc-saat{color:#ff8a4a}
.koc-wa{flex:none;min-height:42px;padding:0 13px;border-radius:11px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font-size:13px;font-weight:700}.koc-wa.dolu{background:#ff6a1a;border-color:#ff6a1a;color:#1d0d02}
.koc-cikis{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:48px;margin:20px 0 6px;border-radius:13px;border:1px solid var(--border-color);background:transparent;color:var(--text-muted);font-size:14px;font-weight:700}
.koc button:focus-visible{outline:2px solid #ff6a1a;outline-offset:2px}.koc-km:active,.koc-lig button:active,.koc-wa:active{filter:brightness(1.12)}`;
        document.head.appendChild(st);
    }
})();
