/* 🎚️ Klik Testi (2026-11-08, v390) — "Bir halka kaydırmak kaç klik?"
   Kaynak fikir: okçuluk reel'i (3 seri ayarsız → N klik sağa 3 seri → N klik yukarı 3 seri; okları hedefe işaretle).
   Sporcu okları hedefe dokunarak işaretler; grup merkezlerinin kaymasından 1 klikin kaç cm kaydırdığı bulunur.
   Kayıt: sp.ekipmanBilgisi.klik[] = { id, mesafe, yatay (cm/klik), dikey (cm/klik), n, yuz, ok, tarih, giren, t }
   (ekipmanBilgisi_json olarak bütün halinde senkronlanır — sunucu/migration değişikliği gerekmez).
   Yarışmadaki grup önerisi bu değeri yzKlikBul() ile okur: "Nişangahı 8 klik sağa al". */
(function () {
    const KLK_YUZ = [
        { id: '40', ad: '40 cm (10 halka)', R: 20 },
        { id: '60', ad: '60 cm (10 halka)', R: 30 },
        { id: '80', ad: '80 cm (10 halka)', R: 40 },
        { id: '122', ad: '122 cm (10 halka)', R: 61 }
    ];
    const KLK_VARSAYILAN_YUZ = { '18m': '40', '30m': '80', '50m': '122', '70m': '122' };
    const KLK_RENK = ['#94a3b8', '#38bdf8', '#f97316'];
    let _klk = null;

    function klkEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function klkYuz() { return KLK_YUZ.find(function (y) { return y.id === _klk.yuz; }) || KLK_YUZ[2]; }
    function klkMerkez(ok) {
        if (!ok.length) return null;
        let x = 0, y = 0; ok.forEach(function (p) { x += p.x; y += p.y; }); x /= ok.length; y /= ok.length;
        let yay = 0; ok.forEach(function (p) { yay += Math.hypot(p.x - x, p.y - y); }); yay /= ok.length;
        return { x: x, y: y, yay: yay, n: ok.length };
    }
    function klkSonuc() {
        let m = _klk.ok.map(klkMerkez), n = _klk.n, R = klkYuz().R, halka = R / 10;
        if (!m[0] || !m[1] || !m[2]) return null;
        let dx = m[1].x - m[0].x;                       // sağa klik → oklar sağa (x+)
        let dy = (m[0].y + m[1].y) / 2 - m[2].y;         // yukarı klik → oklar yukarı (SVG'de y−)
        let yay = Math.max(m[0].yay, m[1].yay, m[2].yay), uyari = [];
        if (dx < 0) uyari.push('Sağa klikte oklar SOLA kaydı. Bu nişangahta yön işaretleri ters olabilir; değer yine de kaydedilir, ayarı yaparken buna dikkat et.');
        if (dy < 0) uyari.push('Yukarı klikte oklar AŞAĞI kaydı. Bu nişangahta yön ters olabilir; ayarı yaparken buna dikkat et.');
        if (Math.abs(dx) < halka / 2 || Math.abs(dy) < halka / 2) uyari.push('Kayma yarım halkadan az. Daha çok klikle (ör. ' + (n * 2) + ') tekrar etmek sonucu netleştirir.');
        if (yay > Math.max(Math.abs(dx), Math.abs(dy))) uyari.push('Gruplar kaymadan daha dağınık. Sonuç kaba bir tahmin; grup toplanınca tekrar et.');
        let az = _klk.ok.some(function (o) { return o.length < 6; });
        if (az) uyari.push('Her adımda en az 6 ok (2–3 seri) işaretlemek daha güvenilir.');
        let yatay = Math.abs(dx) / n, dikey = Math.abs(dy) / n;
        return { yatay: yatay, dikey: dikey, halka: halka, yHalka: yatay > 0 ? halka / yatay : null, dHalka: dikey > 0 ? halka / dikey : null, uyari: uyari };
    }
    function klkSayi(v, b) { return (Math.round(v * Math.pow(10, b)) / Math.pow(10, b)).toLocaleString('tr-TR'); }

    function klkStil() {
        if (document.getElementById('klk-stil')) return;
        let st = document.createElement('style'); st.id = 'klk-stil';
        st.textContent = '.klk-arka{position:fixed;inset:0;z-index:99600;background:rgba(0,0,0,.78);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:12px}'
            + '.klk-kutu{background:linear-gradient(var(--bg-panel,#111827),var(--bg-panel,#111827)),var(--bg-main,#0b1220);color:var(--text-main,#f1f5f9);border:1px solid var(--border-color,#334155);border-radius:16px;width:100%;max-width:440px;max-height:96vh;overflow:auto;padding:14px;box-sizing:border-box}'
            + '.klk-bas{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px}.klk-bas b{font-size:16px}'
            + '.klk-kapat{background:transparent;border:none;color:var(--text-muted,#94a3b8);font-size:22px;cursor:pointer;padding:4px 8px}'
            + '.klk-adimlar{display:flex;gap:6px;margin-bottom:10px}.klk-adimlar i{flex:1;height:5px;border-radius:3px;background:var(--border-color,#334155)}.klk-adimlar i.on{background:var(--neon-blue,#38bdf8)}'
            + '.klk-yonerge{font-size:15px;line-height:1.4;margin-bottom:10px;font-weight:600}.klk-yonerge small{display:block;font-weight:400;color:var(--text-muted,#94a3b8);font-size:12px;margin-top:4px}'
            + '.klk-ayar{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px}.klk-ayar label{font-size:11px;color:var(--text-muted,#94a3b8);display:flex;flex-direction:column;gap:3px}'
            + '.klk-ayar select,.klk-ayar input{padding:8px;background:var(--bg-main,#0b1220);border:1px solid var(--border-color,#334155);color:var(--text-main,#f1f5f9);border-radius:8px;font-size:14px;min-width:0}'
            + '.klk-hedef{display:block;width:100%;max-width:360px;margin:0 auto 8px;touch-action:manipulation;cursor:crosshair}'
            + '.klk-sayac{text-align:center;font-size:13px;color:var(--text-muted,#94a3b8);margin-bottom:10px}.klk-sayac b{color:var(--text-main,#f1f5f9);font-size:16px}'
            + '.klk-dugmeler{display:grid;grid-template-columns:1fr 1fr 1.4fr;gap:8px}.klk-dugmeler button,.klk-kaydet{padding:13px 8px;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;border:1px solid var(--border-color,#334155);background:transparent;color:var(--text-main,#f1f5f9)}'
            + '.klk-dugmeler button:disabled{opacity:.4;cursor:default}.klk-dugmeler .ana,.klk-kaydet{background:var(--neon-blue,#38bdf8);border-color:transparent;color:#fff}'
            + '.klk-sonuc{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.klk-sonuc div{border:1px solid var(--border-color,#334155);border-radius:12px;padding:10px;text-align:center}'
            + '.klk-sonuc small{display:block;font-size:11px;color:var(--text-muted,#94a3b8)}.klk-sonuc b{display:block;font-size:22px;margin:2px 0}'
            + '.klk-uyari{font-size:12px;line-height:1.4;color:var(--gold,#eab308);margin:6px 0}.klk-kaydet{width:100%;margin-top:8px}';
        document.head.appendChild(st);
    }

    function klkHedefSVG() {
        let R = klkYuz().R, k = R * 1.08, renk = ['#f8fafc', '#f8fafc', '#1f2937', '#1f2937', '#0ea5e9', '#0ea5e9', '#ef4444', '#ef4444', '#fde047', '#fde047'];
        let halkalar = '';
        for (let i = 0; i < 10; i++) { let r = R * (10 - i) / 10; halkalar += '<circle r="' + r + '" fill="' + renk[i] + '" stroke="' + (i === 2 || i === 3 ? '#9ca3af' : '#475569') + '" stroke-width="' + (R / 220) + '"/>'; }
        halkalar += '<line x1="' + (-R / 40) + '" x2="' + (R / 40) + '" y1="0" y2="0" stroke="#111" stroke-width="' + (R / 300) + '"/><line y1="' + (-R / 40) + '" y2="' + (R / 40) + '" x1="0" x2="0" stroke="#111" stroke-width="' + (R / 300) + '"/>';
        let nok = '', dr = R / 34;
        _klk.ok.forEach(function (ok, a) {
            if (a > _klk.adim) return;
            let soluk = a < _klk.adim ? ' opacity=".45"' : '';
            ok.forEach(function (p) { nok += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + dr + '" fill="' + KLK_RENK[a] + '" stroke="#fff" stroke-width="' + (dr / 3) + '"' + soluk + '/>'; });
            let m = klkMerkez(ok);
            if (m && ok.length >= 2) nok += '<g stroke="' + KLK_RENK[a] + '" stroke-width="' + (R / 120) + '"' + soluk + '><line x1="' + (m.x - dr * 2.5) + '" x2="' + (m.x + dr * 2.5) + '" y1="' + m.y + '" y2="' + m.y + '"/><line x1="' + m.x + '" x2="' + m.x + '" y1="' + (m.y - dr * 2.5) + '" y2="' + (m.y + dr * 2.5) + '"/></g>';
        });
        return '<svg class="klk-hedef" id="klk-hedef" viewBox="' + (-k) + ' ' + (-k) + ' ' + (2 * k) + ' ' + (2 * k) + '" role="img" aria-label="Hedef: okun düştüğü yere dokun" onpointerdown="klikTestiDokun(event)">' + halkalar + nok + '</svg>';
    }

    function klkCiz() {
        let el = document.getElementById('klk-arka');
        if (!el) { el = document.createElement('div'); el.id = 'klk-arka'; el.className = 'klk-arka'; el.onclick = function (e) { if (e.target === el) klikTestiKapat(); }; document.body.appendChild(el); }
        let a = _klk.adim, n = _klk.n, ust = '<div class="klk-bas"><b>🎚️ Klik Testi</b><button class="klk-kapat" onclick="klikTestiKapat()" aria-label="Kapat">×</button></div>'
            + '<div class="klk-adimlar">' + [0, 1, 2, 3].map(function (i) { return '<i class="' + (i <= a ? 'on' : '') + '"></i>'; }).join('') + '</div>';
        if (a === 3) {
            let s = klkSonuc();
            el.innerHTML = '<div class="klk-kutu">' + ust
                + '<div class="klk-yonerge">' + klkEsc(_klk.ad) + ' · ' + klkEsc(_klk.mesafe) + '<small>' + n + ' klik sağa ve ' + n + ' klik yukarı ile ölçüldü.</small></div>'
                + '<div class="klk-sonuc"><div><small>↔ Sağ-sol</small><b>' + klkSayi(s.yatay * 10, 1) + ' mm</b><small>1 klik</small></div><div><small>↕ Yukarı-aşağı</small><b>' + klkSayi(s.dikey * 10, 1) + ' mm</b><small>1 klik</small></div>'
                + '<div><small>1 halka (' + klkSayi(s.halka, 1) + ' cm) sağ-sol</small><b>' + (s.yHalka ? Math.round(s.yHalka) + ' klik' : '–') + '</b></div><div><small>1 halka yukarı-aşağı</small><b>' + (s.dHalka ? Math.round(s.dHalka) + ' klik' : '–') + '</b></div></div>'
                + s.uyari.map(function (u) { return '<div class="klk-uyari">⚠️ ' + klkEsc(u) + '</div>'; }).join('')
                + '<div class="klk-yonerge" style="font-size:12px;font-weight:400;color:var(--text-muted)">Kaydedince yarışmadaki nişangah önerisi bu sporcuya kaç klik oynatacağını da söyler.</div>'
                + '<div class="klk-dugmeler" style="grid-template-columns:1fr 2fr"><button onclick="klikTestiAdim(-1)">← Geri</button><button class="ana" onclick="klikTestiKaydet()" ' + (s.yatay > 0 && s.dikey > 0 ? '' : 'disabled') + '>💾 Kaydet</button></div>'
                + '</div>';
            return;
        }
        let yon = [
            ['Nişangaha <u>dokunmadan</u> 2–3 seri at.', 'Sonra okları hedefte düştükleri yere dokunarak işaretle.'],
            ['Nişangahı <u>' + n + ' klik SAĞA</u> al, 2–3 seri at.', 'Okları işaretle. Soluk noktalar önceki adım.'],
            ['Sağ ayarı kalsın, <u>' + n + ' klik YUKARI</u> al, 2–3 seri at.', 'Okları işaretle. Bitince sonuç çıkar.']
        ][a];
        let ayar = a === 0 ? '<div class="klk-ayar"><label>Mesafe<select onchange="klikTestiAyar(\'mesafe\',this.value)">' + ['18m', '30m', '50m', '70m'].map(function (m) { return '<option' + (m === _klk.mesafe ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select></label>'
            + '<label>Hedef<select onchange="klikTestiAyar(\'yuz\',this.value)">' + KLK_YUZ.map(function (y) { return '<option value="' + y.id + '"' + (y.id === _klk.yuz ? ' selected' : '') + '>' + y.ad + '</option>'; }).join('') + '</select></label>'
            + '<label>Klik sayısı<input type="number" inputmode="numeric" min="5" max="200" value="' + n + '" onchange="klikTestiAyar(\'n\',this.value)"></label></div>' : '';
        let say = _klk.ok[a].length;
        el.innerHTML = '<div class="klk-kutu">' + ust + ayar
            + '<div class="klk-yonerge">' + (a + 1) + '/3 · ' + yon[0] + '<small>' + yon[1] + '</small></div>'
            + klkHedefSVG()
            + '<div class="klk-sayac"><b>' + say + '</b> ok işaretlendi' + (say < 3 ? ' · en az 3' : say < 6 ? ' · 6+ daha iyi' : ' ✓') + '</div>'
            + '<div class="klk-dugmeler"><button onclick="klikTestiAdim(-1)" ' + (a === 0 ? 'disabled' : '') + '>← Geri</button><button onclick="klikTestiGeriAl()" ' + (say ? '' : 'disabled') + '>↶ Son oku sil</button><button class="ana" onclick="klikTestiAdim(1)" ' + (say >= 3 ? '' : 'disabled') + '>' + (a === 2 ? 'Sonuç →' : 'İleri →') + '</button></div>'
            + '</div>';
    }

    window.klikTestiAc = function (ad, sfx) {
        let sp = turnuvaDB[aktifGrup] && turnuvaDB[aktifGrup][ad]; if (!sp) return;
        klkStil();
        let mesafe = '18m';
        try { let m = document.getElementById('eki-nis-mesafe' + (sfx || '')); if (m && /^\d+m$/.test(m.value)) mesafe = m.value; } catch (e) {}
        _klk = { ad: ad, sfx: sfx || '', mesafe: mesafe, yuz: KLK_VARSAYILAN_YUZ[mesafe] || '80', n: 50, adim: 0, ok: [[], [], []] };
        klkCiz();
    };
    window.klikTestiKapat = function () {
        if (_klk && _klk.adim < 3 && _klk.ok.some(function (o) { return o.length; }) && !confirm('Test kapatılsın mı? İşaretlenen oklar silinir.')) return;
        let el = document.getElementById('klk-arka'); if (el) el.remove(); _klk = null;
    };
    window.klikTestiAyar = function (alan, deger) {
        if (!_klk) return;
        if (alan === 'n') { let v = parseInt(deger, 10); _klk.n = isNaN(v) ? 50 : Math.max(5, Math.min(200, v)); }
        else if (alan === 'mesafe') { _klk.mesafe = deger; if (!_klk.ok.some(function (o) { return o.length; })) _klk.yuz = KLK_VARSAYILAN_YUZ[deger] || _klk.yuz; }
        else if (alan === 'yuz') { if (_klk.ok.some(function (o) { return o.length; }) && !confirm('Hedef değişirse işaretlenen oklar silinir. Devam?')) return klkCiz(); _klk.yuz = deger; _klk.ok = [[], [], []]; }
        klkCiz();
    };
    window.klikTestiDokun = function (e) {
        if (!_klk || _klk.adim > 2) return;
        let svg = document.getElementById('klk-hedef'); if (!svg || !svg.getScreenCTM) return;
        e.preventDefault();
        let pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
        let p = pt.matrixTransform(svg.getScreenCTM().inverse()), R = klkYuz().R;
        if (Math.hypot(p.x, p.y) > R * 1.08) return;
        _klk.ok[_klk.adim].push({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 });
        try { if (navigator.vibrate) navigator.vibrate(12); } catch (er) {}
        klkCiz();
    };
    window.klikTestiGeriAl = function () { if (_klk && _klk.adim < 3) { _klk.ok[_klk.adim].pop(); klkCiz(); } };
    window.klikTestiAdim = function (d) { if (!_klk) return; _klk.adim = Math.max(0, Math.min(3, _klk.adim + d)); klkCiz(); };
    window.klikTestiKaydet = function () {
        if (!_klk) return;
        let sp = turnuvaDB[aktifGrup] && turnuvaDB[aktifGrup][_klk.ad]; if (!sp) return;
        let s = klkSonuc(); if (!s || !(s.yatay > 0) || !(s.dikey > 0)) return showToast('Sonuç hesaplanamadı.', 'warning');
        let eki = ekipmanBos(sp); if (!Array.isArray(eki.klik)) eki.klik = [];
        eki.klik.push({ id: 'k_' + Date.now(), mesafe: _klk.mesafe, yatay: Math.round(s.yatay * 1000) / 1000, dikey: Math.round(s.dikey * 1000) / 1000, n: _klk.n, yuz: _klk.yuz,
            ok: _klk.ok.reduce(function (t, o) { return t + o.length; }, 0), tarih: bugunISO(), giren: ekipmanGiren(), t: Date.now() });
        ekipmanKaydet(sp);
        let sfx = _klk.sfx; _klk = null; let el = document.getElementById('klk-arka'); if (el) el.remove();
        showToast('Klik ayarı kaydedildi 🎚️', 'success');
        ekipmanYenile(sfx);
    };
})();
