// ✨ Işıklı Kartlar — Sıralama Turu TV görünümü (v439, 2026-11-20).
// Kullanıcı minik/küçükler için 3 taslaktan "Işıklı Kartlar"ı seçti (https://claude.ai/artifact/4yGLDJK4mwNapVN49STis7):
//   üstte kürsü (ilk 4), altta herkes bir kart; kartta son serinin okları, hedefteki yerleri, toplam; skor girilince kart
//   yeşil yanar ve üstünde övgü balonu çıkar (asla olumsuz değil). Sıralama modu (yzSiraModu) burada da geçerli:
//   normal = kartlar gerçek sırada, numaralı · ilk4 = kürsü + diğerleri 5 sn'de bir yer değiştirir · karisik = kürsü yok, herkes döner.
// Kartlar kalıcı DOM: yeniden çizimde yeni yerlerine kayar (transform geçişi). Karta dokununca o sporcunun skoru girilir.
(function () {
    const YZK_RENK = { X: '#ffd23f', 10: '#ffd23f', 9: '#ffd23f', 8: '#ff4d5e', 7: '#ff4d5e', 6: '#3fa7ff', 5: '#3fa7ff', 4: '#20242e', 3: '#20242e', 2: '#f4f6fb', 1: '#f4f6fb', M: '#4a5878' };
    const YZK_YAZI = { 4: '#fff', 3: '#fff', M: '#fff' };
    const AV_RENK = ['#ff8a5c', '#7cc6ff', '#ffd23f', '#7cf2b4', '#c79bff', '#ff7ab0', '#5fe0d0', '#ffb84d'];
    const KURSU_R = ['#ffcc33', '#cfd8e6', '#e0915a', '#7fc8ff'];
    let _yzk = { son: {}, balon: {}, ilk: true };

    function css() {
        if (document.getElementById('yzik-css')) return;
        const s = document.createElement('style'); s.id = 'yzik-css';
        s.textContent = [
            '#yz-tv.yzk-acik{background:#0c1426;color:#eef3ff;padding:0;overflow:hidden}',
            '#yzk{position:absolute;inset:0;display:flex;flex-direction:column;gap:1.2vh;padding:1.6vh 1.6vw 1.2vh;font-family:Nunito,Inter,system-ui,sans-serif}',
            '.yzik-bas{display:flex;align-items:center;gap:1.4vw;flex-wrap:wrap}',
            '.yzik-kim{display:flex;flex-direction:column;line-height:1.05;min-width:0;flex:1}',
            '.yzik-kim small{font-weight:800;letter-spacing:.16em;color:#ffcc33;font-size:1.25vh}',
            '.yzik-kim b{font-family:"Barlow Condensed","Arial Narrow",sans-serif;font-weight:800;font-size:3.6vh;letter-spacing:.02em}',
            '.yzik-kim span{font-size:1.5vh;color:#93a3c7;font-weight:700}',
            '.yzik-seri{text-align:center;line-height:1}.yzik-seri small{display:block;font-size:1.2vh;font-weight:800;color:#93a3c7;letter-spacing:.12em}.yzik-seri b{font-family:"Barlow Condensed",sans-serif;font-size:5vh}.yzik-seri i{font-style:normal;font-size:2.4vh;color:#93a3c7}',
            '.yzik-kursu{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1vw}',
            '.yzik-k{border-radius:1.6vh;border:.35vh solid var(--r);background:#0f1830;display:flex;align-items:center;gap:1vw;padding:1vh 1vw;min-width:0;cursor:pointer;color:inherit;font:inherit;text-align:left;position:relative}',
            '.yzik-k .md{font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:2.4vh;background:var(--r);color:#10131c;border-radius:99px;padding:.1vh .9vw;flex:none}',
            '.yzik-k .bil{min-width:0;flex:1;display:flex;flex-direction:column;gap:.4vh}',
            '.yzik-k .ad{font-weight:900;font-size:2.5vh;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
            '.yzik-k .top{font-family:"Barlow Condensed",sans-serif;font-weight:800;font-size:4.6vh;line-height:1;flex:none;font-variant-numeric:tabular-nums}',
            '.yzik-alan{position:relative;flex:1;min-height:0}',
            '.yzik-c{position:absolute;left:0;top:0;border-radius:1.4vh;background:#17244a;border:1px solid #24345a;display:flex;align-items:center;gap:.8vw;padding:0 .9vw;transition:transform .9s cubic-bezier(.5,0,.2,1),box-shadow .4s;cursor:pointer;color:inherit;font:inherit;text-align:left;min-width:0}',
            '.yzik-c.parla{box-shadow:0 0 0 .35vh #7cf2b4,0 0 3vh rgba(124,242,180,.45)}',
            '.yzik-c .no{font-family:"Barlow Condensed",sans-serif;font-weight:800;color:#93a3c7;flex:none;width:2.2em;text-align:center}',
            '.yzik-c .bil{min-width:0;flex:1;display:flex;flex-direction:column;gap:.3em}',
            '.yzik-c .ad{font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
            '.yzik-c .alt{color:#93a3c7;font-weight:700;font-size:.72em}',
            '.yzik-c .top{font-family:"Barlow Condensed",sans-serif;font-weight:800;flex:none;font-size:1.7em;font-variant-numeric:tabular-nums}',
            '.yzik-av{flex:none;border-radius:50%;display:grid;place-items:center;font-weight:900;color:#10131c;overflow:hidden;border:.25vh solid rgba(255,255,255,.7)}',
            '.yzik-av img{width:100%;height:100%;object-fit:cover}',
            '.yzik-oklar{display:flex;gap:.25em;flex-wrap:wrap}',
            '.yzik-ok{width:1.45em;height:1.45em;border-radius:50%;display:grid;place-items:center;font-weight:900;font-size:.7em;border:.15em solid rgba(255,255,255,.7)}',
            '.yzik-hedef{flex:none}',
            '.yzik-balon{position:absolute;left:50%;top:-.6vh;transform:translate(-50%,-100%);background:#7cf2b4;color:#0b2a1c;font-weight:900;font-size:2vh;padding:.5vh 1vw;border-radius:1.2vh;white-space:nowrap;z-index:5;pointer-events:none;animation:yzikBalon 4s forwards}',
            '.yzik-balon::after{content:"";position:absolute;left:50%;bottom:-.7vh;margin-left:-.7vh;border:.7vh solid transparent;border-top-color:#7cf2b4;border-bottom:0}',
            '@keyframes yzikBalon{0%{opacity:0;transform:translate(-50%,-80%) scale(.7)}10%{opacity:1;transform:translate(-50%,-100%) scale(1)}85%{opacity:1}100%{opacity:0;transform:translate(-50%,-130%)}}',
            '.yzik-alt{display:flex;align-items:center;gap:.8vw;flex-wrap:wrap}',
            '.yzik-alt .yz-tv-kontrol{margin:0}',
            '.yzik-not{font-weight:800;font-size:1.6vh;color:#93a3c7}',
            '@media (prefers-reduced-motion:reduce){.yzik-c{transition:none}.yzik-balon{animation:none}}'
        ].join('\n');
        document.head.appendChild(s);
    }
    function sonSeri(sk) { for (let i = sk.length - 1; i >= 0; i--) if (sk[i] && sk[i].length) return i; return -1; }
    function avatar(k, ad, px) {
        let foto = typeof yzFotoYuz === 'function' ? yzFotoYuz(k) : '', h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
        let src = /src="([^"]+)"/.exec(foto || '');
        return '<span class="yzik-av" style="width:' + px + 'px;height:' + px + 'px;font-size:' + Math.round(px * 0.42) + 'px;background:' + AV_RENK[h % AV_RENK.length] + '">' + (src ? '<img src="' + src[1] + '" alt="">' : esc((ad || '?').charAt(0).toLocaleUpperCase('tr-TR'))) + '</span>';
    }
    function oklarHTML(oklar) { return '<span class="yzik-oklar">' + (oklar || []).map(function (v) { let u = String(v).toUpperCase(); return '<i class="yzik-ok" style="background:' + (YZK_RENK[u] || '#4a5878') + ';color:' + (YZK_YAZI[u] || '#10131c') + '">' + esc(u) + '</i>'; }).join('') + '</span>'; }
    function miniHedef(o, k, seri, px) {
        let kon = []; try { kon = (typeof yzKonumlar === 'function' ? yzKonumlar(o, k) : []).filter(function (p) { return p.seri === seri; }); } catch (e) {}
        if (!kon.length) return '';
        let h = [[100, '#f4f6fb'], [80, '#20242e'], [60, '#3fa7ff'], [40, '#ff4d5e'], [20, '#ffd23f']].map(function (x) { return '<circle r="' + x[0] + '" fill="' + x[1] + '" stroke="#0006" stroke-width="1"/>'; }).join('');
        return '<svg class="yzik-hedef" viewBox="-110 -110 220 220" width="' + px + '" height="' + px + '" aria-hidden="true">' + h + kon.map(function (p) { return '<circle cx="' + (p.x * 100).toFixed(1) + '" cy="' + (p.y * 100).toFixed(1) + '" r="10" fill="#10131c" stroke="#fff" stroke-width="3.5"/>'; }).join('') + '</svg>';
    }
    // Övgü — her zaman olumlu (kullanıcı: "arada övgüler versin, moral yazısı çıksın")
    function ovgu(o, k, sk, i) {
        let ser = sk[i] || [], t = typeof yzTop === 'function' ? yzTop(ser) : 0, onceki = [];
        for (let j = 0; j < i; j++) if (sk[j] && sk[j].length) onceki.push(yzTop(sk[j]));
        let u = ser.map(function (v) { return String(v).toUpperCase(); }), sari = u.filter(function (v) { return v === 'X' || v === '10' || v === '9'; }).length, isabet = u.filter(function (v) { return v !== 'M'; }).length;
        if (!onceki.length) return 'İlk serin, hoş geldin! 🎉';
        if (t > Math.max.apply(null, onceki)) return 'Kişisel rekor: ' + t + '! 🚀';
        if (sari >= 2) return sari + ' ok sarıda! ⭐';
        if (sari === 1) return 'Sarıya girdi! ⭐';
        if (isabet === u.length && u.length) return 'Hepsi isabet! 🎯';
        if (t > onceki[onceki.length - 1]) return 'Bir öncekinden +' + (t - onceki[onceki.length - 1]) + '! 📈';
        let h = 0; for (let j = 0; j < k.length; j++) h += k.charCodeAt(j);
        return ['Güzel duruş, devam! 💪', 'Her ok seni geliştiriyor 🌱', 'Nefes al, sıradaki senin! 🌟', 'Cesur atış! 🏹'][(h + i) % 4];
    }

    window.yzKartlarCiz = function (el, o) {
        css();
        let d = o.durum, f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1), mod = yzSiraModu(d), gercek = yzSiralama(o), simdi = Date.now();
        if (!el.classList.contains('yzk-acik') || !el.querySelector('#yzk')) {
            el.classList.add('yzk-acik'); el.classList.remove('yzs-acik', 'yzh-acik', 'kagit');
            el.innerHTML = '<div id="yzk"><div class="yzik-bas"></div><div class="yzik-kursu"></div><div class="yzik-alan"></div><div class="yzik-alt"></div></div>';
            _yzk = { son: {}, balon: {}, ilk: true };
        }
        let kok = el.querySelector('#yzk');
        // yeni giriş: imza değişti → parla + balon
        let yeni = {};
        gercek.forEach(function (r) {
            let sk = yzSkor(o, r.k), imza = sk.map(function (e) { return (e || []).join(''); }).join('|');
            if (!_yzk.ilk && _yzk.son[r.k] != null && _yzk.son[r.k] !== imza) { let i = sonSeri(sk); if (i >= 0) _yzk.balon[r.k] = { t: simdi, yazi: ovgu(o, r.k, sk, i) }; }
            _yzk.son[r.k] = imza;
            if (_yzk.balon[r.k] && simdi - _yzk.balon[r.k].t < 4000) yeni[r.k] = _yzk.balon[r.k];
        });
        _yzk.ilk = false;
        let bek = yzBekleyenler(o, seri).length;
        kok.querySelector('.yzik-bas').innerHTML = '<div class="yzik-kim"><small>DAĞ S.K. · SIRALAMA TURU</small><b>✨ IŞIKLI KARTLAR</b><span>' + esc(yzKatEtiket(d)) + esc(d.ayar.mesafe) + ' · ' + esc(f.ad) + ' · ' + d.katilimci.length + ' sporcu · ' + (bek ? (d.katilimci.length - bek) + '/' + d.katilimci.length + ' bu seriyi girdi' : '✓ herkes girdi') + '</span></div>'
            + '<div class="yzik-seri"><small>SERİ</small><b>' + (seri + 1) + '<i>/' + f.seri + '</i></b></div>' + yzSayacHTML(o, 'yz-tv-sayac');
        // kürsü
        let kursu = mod === 'karisik' ? [] : gercek.filter(function (r) { return r.toplam > 0; }).slice(0, 4);
        let kEl = kok.querySelector('.yzik-kursu'); kEl.hidden = !kursu.length;
        kEl.innerHTML = kursu.map(function (r, i) {
            let sk = yzSkor(o, r.k), si = sonSeri(sk);
            return '<button type="button" class="yzik-k" style="--r:' + KURSU_R[i] + '" onclick="yzGirisAc(\'' + yzEnc(r.k) + '\',' + seri + ')"><span class="md">' + r.sira + '.</span>' + avatar(r.k, r.ad, Math.round(innerHeight * 0.06)) + '<span class="bil"><span class="ad">' + esc(yzKisaAd(r.ad)) + '</span>' + oklarHTML(si >= 0 ? sk[si] : []) + '</span><span class="top">' + r.toplam + '</span>' + (yeni[r.k] ? '<span class="yzik-balon">' + esc(yeni[r.k].yazi) + '</span>' : '') + '</button>';
        }).join('');
        // kartlar
        let ust = {}; kursu.forEach(function (r) { ust[r.k] = 1; });
        let liste = gercek.filter(function (r) { return !ust[r.k]; });
        if (mod !== 'normal') liste = yzKarisikSira(d, liste).map(function (r) { return Object.assign({}, r, { gizli: true }); });
        let alan = kok.querySelector('.yzik-alan'), W = alan.clientWidth || innerWidth * 0.96, H = alan.clientHeight || innerHeight * 0.5, n = Math.max(1, liste.length);
        let sut = Math.max(1, Math.min(n, W > 1500 ? 4 : W > 1000 ? 3 : W > 640 ? 2 : 1)); while (sut < 6 && Math.ceil(n / sut) * 64 > H) sut++;
        let sat = Math.ceil(n / sut), gap = Math.round(H * 0.018), kh = Math.max(46, Math.min(130, Math.floor((H - gap * (sat - 1)) / sat))), kw = (W - gap * (sut - 1)) / sut, fs = Math.round(kh * 0.24);
        alan.querySelectorAll('.yzik-c').forEach(function (c) { if (!liste.some(function (r) { return r.k === c.getAttribute('data-k'); })) c.remove(); });
        liste.forEach(function (r, i) {
            let c = null; alan.querySelectorAll('.yzik-c').forEach(function (x) { if (x.getAttribute('data-k') === r.k) c = x; });
            if (!c) { c = document.createElement('button'); c.type = 'button'; c.className = 'yzik-c'; c.setAttribute('data-k', r.k); c.style.transform = 'translate(' + ((i % sut) * (kw + gap)) + 'px,' + (Math.floor(i / sut) * (kh + gap)) + 'px)'; alan.appendChild(c); }
            c.onclick = function () { yzGirisAc(yzEnc(r.k), seri); };
            let sk = yzSkor(o, r.k), si = sonSeri(sk);
            c.style.width = kw + 'px'; c.style.height = kh + 'px'; c.style.fontSize = fs + 'px';
            c.innerHTML = (mod === 'normal' ? '<span class="no">' + r.sira + '.</span>' : '') + avatar(r.k, r.ad, Math.round(kh * 0.62)) + '<span class="bil"><span class="ad">' + esc(yzKisaAd(r.ad)) + '</span>' + oklarHTML(si >= 0 ? sk[si] : []) + '<span class="alt">' + (si >= 0 ? (si + 1) + '. seri: ' + yzTop(sk[si]) : 'ilk skoru bekliyor') + '</span></span>' + (si >= 0 ? miniHedef(o, r.k, si, Math.round(kh * 0.78)) : '') + '<span class="top">' + r.toplam + '</span>' + (yeni[r.k] ? '<span class="yzik-balon">' + esc(yeni[r.k].yazi) + '</span>' : '');
            c.classList.toggle('parla', !!yeni[r.k]);
            c.style.transform = 'translate(' + ((i % sut) * (kw + gap)) + 'px,' + (Math.floor(i / sut) * (kh + gap)) + 'px)';
        });
        kok.querySelector('.yzik-alt').innerHTML = '<button class="yz-tv-k" onclick="yzTvKapat()">✕ Kapat</button>' + yzTvKontrolHTML(o) + yzSiraModuHTML(d, true)
            + '<span class="yz-tv-kontrol"><button class="yz-tv-k" onclick="yzTvGorunumSec(\'hatlar\')">🎯 Hatlar</button><button class="yz-tv-k" onclick="yzTvGorunumSec(\'sahne\')">🎭 Sahne</button><button class="yz-tv-k" onclick="yzTvGorunumSec(\'tablo\')">📋 Tablo</button></span>'
            + '<span class="yzik-not">' + (mod === 'ilk4' ? '🏅 İlk 4 kürsüde · diğerleri sürekli yer değiştirir' : mod === 'karisik' ? '🔀 Herkes sürekli yer değiştirir' : '📊 Gerçek sıralama') + '</span>';
        // balonlar bitince parlamayı söndür
        clearTimeout(_yzk.z); if (Object.keys(yeni).length) _yzk.z = setTimeout(function () { let o2 = yzOku(); if (o2.durum && o2.durum.asama === 'tur' && el.classList.contains('yzk-acik')) window.yzKartlarCiz(el, o2); }, 4100);
    };
})();
