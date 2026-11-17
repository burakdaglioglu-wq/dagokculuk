// 🎬 Ok anı + ŞİMDİ cümlesi + anlatıcı (2026-11-16, v423). Kullanıcı: "oyun içerikleri çok kötü, çocuklar sıkılıyor" —
// sebep: okun etkisi görünmüyor, ne olduğu anlaşılmıyor. Top Savaşı taslağı onaylandı ("YAP"), aynı katman son haftalardaki
// bütün oyunlara:
//   • ŞİMDİ cümlesi: oyunun üstünde tek büyük cümle + renk lejantı (9-10 / 7-8 / 5-6 / altı ne yapar), #an-simdi.
//   • Ok anı: her seride oyun alanı kararır, çocuğun adı büyük, 3 ok tek tek oyunun kendi diliyle ("+6 SN!", "PANZEHİR OKU!")
//     ve sesle düşer; sonra anlatıcı tek cümle söyler, ardından oyunun kendi animasyonu başlar. Gerçek skora dokunmaz.
//   • Kapatılabilir: ŞİMDİ şeridindeki "🎬 An" düğmesi (cihazda hatırlanır: dag_km_an_kapali). Ses, oyunların sessiz ayarına uyar.
// Takım/çoklu modda an gösterilmez (app.js kancası). Kanca: kmOyunIlerlet → anSeriGoster(tema, s, kaydedilecek, devam);
// kmOyunKabukGuncelle → anTazele(tema).
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const ilkAd = (ad) => String(ad || '').trim().split(/\s+/)[0] || '';
    const buyukTR = (t) => String(t || '').toLocaleUpperCase('tr-TR');
    function kademe(v) {
        const p = String(v == null ? '' : (typeof v === 'object' ? v.puan : v)).toUpperCase();
        if (p === 'X' || p === '10' || p === '9') return 'sari';
        if (p === '8' || p === '7') return 'kirmizi';
        if (p === '6' || p === '5') return 'mavi';
        if (p === '4' || p === '3') return 'siyah';
        if (p === '2' || p === '1') return 'beyaz';
        return 'iska';
    }
    const RENK = { sari: '#ffd23f', kirmizi: '#ff5a5a', mavi: '#4aa8ff', siyah: '#d5dbe4', beyaz: '#f4f4f4', iska: '#9fb2c4' };
    const IYI = { sari: 1, kirmizi: 1 };
    // ok: kademe → büyük yazı; ozet: [iyi seri, orta, zayıf] — {ad} çocuğun ilk adı; simdi: tek cümle
    const AN = {
        topsavasi: { simdi: () => { const st = typeof h3Durum === 'function' ? h3Durum('topsavasi') : null, k = st && st.kalan != null ? st.kalan : 4;
                const sf = typeof h3Sefer === 'function' ? h3Sefer('topsavasi') : null, ad = sf ? sf.ad : 'Korsan gemisi';
                if (st && st.faz === 'son') return st.kayip ? 'Bu sefer <b class="kirmizi">' + ad + ' kazandı.</b> Rövanş kaldığınız yerden!' : '<b>Korsan filosu yok edildi!</b> Hazine bütün sınıfın.';
                return 'ŞİMDİ: Hedef <b>' + ad + '</b> — batır! ' + (sf ? '(' + (sf.adim + 1) + '/' + sf.toplam + ') ' : '') + (k <= 1 ? '<b class="kirmizi">SON TUR</b> — batmazsa çarpar!' : k + ' tur sonra bize çarpar.'); },
            ok: { sari: 'TAM İSABET!', kirmizi: 'GÖVDEYE!', mavi: 'SIYIRDI', siyah: 'SUYA DÜŞTÜ', beyaz: 'SUYA DÜŞTÜ', iska: 'ISKA' },
            ozet: ['{ad} korsanı fena vurdu!', '{ad} isabet ettirdi.', '{ad} az vurdu. Korsan barut topluyor!'] },
        kacis: { simdi: () => { const sf = typeof h3Sefer === 'function' ? h3Sefer('kacis') : null; return 'ŞİMDİ: Yelkenleri doldur, <b>korsana yakalanmadan</b> ' + (sf ? 'adaya kaç! Rota: <b>' + sf.ad + '</b> (' + (sf.adim + 1) + '/' + sf.toplam + ')' : 'adaya kaç!'); },
            ok: { sari: 'FIRTINA RÜZGÂRI!', kirmizi: 'GÜÇLÜ RÜZGÂR', mavi: 'ESİNTİ', siyah: 'HAFİF ESİNTİ', beyaz: 'HAFİF ESİNTİ', iska: 'RÜZGÂR YOK!' },
            ozet: ['{ad} fırtına gibi esti, gemi uçuyor!', '{ad} yelkenleri doldurdu.', 'Rüzgâr zayıf, korsanlar yaklaşıyor!'] },
        filo: { simdi: () => { const sf = typeof h3Sefer === 'function' ? h3Sefer('filo') : null; return 'ŞİMDİ: Gemini <b>' + (sf ? sf.ad : 'adaya') + '</b> sür! ' + (sf ? '(' + (sf.adim + 1) + '/' + sf.toplam + ') ' : '') + '9-10 atan arkadan rüzgâr alır.'; },
            ok: { sari: 'ARKADAN RÜZGÂR!', kirmizi: 'TAM YELKEN', mavi: 'İLERİ', siyah: 'AZ İLERİ', beyaz: 'AZ İLERİ', iska: 'YELKEN BOŞ' },
            ozet: ['{ad} arkadan rüzgâr aldı, uçuyor!', '{ad} ilerliyor.', '{ad} yavaşladı, rüzgâr bekliyor.'] },
        catikosu: { simdi: () => 'ŞİMDİ: Ninjanı <b>kapıya</b> koştur! Çatı arasını atlamak için seride yarı puan gerek.',
            ok: { sari: 'UÇUŞ!', kirmizi: 'HIZLI KOŞU', mavi: 'KOŞU', siyah: 'YAVAŞ', beyaz: 'YAVAŞ', iska: 'TÖKEZLEDİ!' },
            ozet: ['{ad} çatıların üstünden uçuyor!', '{ad} koşuyor.', '{ad} yavaşladı, çatı arası tehlikeli!'] },
        ejderkule: { simdi: () => 'ŞİMDİ: Hep birlikte <b>muhafızı düşür</b>, kuleye tırman!',
            ok: { sari: 'KRİTİK SHURIKEN!', kirmizi: 'İSABET!', mavi: 'SIYIRDI', siyah: 'ZAYIF', beyaz: 'ZAYIF', iska: 'ISKA' },
            ozet: ['{ad} muhafızı sarstı!', '{ad} isabet ettirdi.', 'Muhafız gülüyor, daha sert vurun!'] },
        zombi: { simdi: () => 'ŞİMDİ: Zombilere karşı <b>dayan!</b> Kırmızı ve sarı ok panzehir taşır.',
            ok: { sari: 'PANZEHİR OKU!', kirmizi: 'PANZEHİR OKU!', mavi: 'İSABET', siyah: 'İSABET', beyaz: 'SIYIRDI', iska: 'ISKA!' },
            ozet: ['{ad} zombileri geri püskürttü!', '{ad} dayandı.', 'Dikkat! Zombiler yaklaşıyor!'] },
        tahta: { simdi: () => 'ŞİMDİ: Takımını <b>bitişe</b> taşı! İyi ok adım attırır.',
            ok: { sari: 'SÜPER OK!', kirmizi: 'İSABET', mavi: 'İSABET', siyah: 'İSABET', beyaz: 'İSABET', iska: 'ISKA' },
            ozet: ['{ad} takımını ileri fırlattı!', '{ad} adım attırdı.', '{ad} bu sefer yerinde saydı.'] },
        timsah: { simdi: () => 'ŞİMDİ: Devi <b>uyandırmadan</b> kovayı balıkla doldur!',
            ok: { sari: '🐟🐟 İKİ BALIK!', kirmizi: '🐟🐟 İKİ BALIK!', mavi: '🐟 BALIK', siyah: '🐟 BALIK', beyaz: '🔊 GÜRÜLTÜ', iska: '🔊🔊 ÇOK GÜRÜLTÜ!' },
            ozet: ['{ad} kovayı balıkla doldurdu!', '{ad} balık topladı.', 'Şşşt! Çok gürültü, dev uyanıyor!'] },
        bomba: { simdi: () => 'ŞİMDİ: Fitili <b>uzat</b>, bombayı patlatma!',
            ok: { sari: '+6 SN!', kirmizi: '+6 SN!', mavi: '+2 SN', siyah: '+2 SN', beyaz: '−2 SN', iska: '−5 SN!' },
            ozet: ['{ad} fitili uzattı, bomba sakin!', '{ad} biraz zaman kazandı.', 'Fitil kısalıyor, acele edin!'] },
        blok: { simdi: () => 'ŞİMDİ: Hep birlikte <b>canavarı yık!</b>',
            ok: { sari: 'KRİTİK!', kirmizi: 'GÜÇLÜ VURUŞ', mavi: 'VURUŞ', siyah: 'SIYIRDI', beyaz: 'SIYIRDI', iska: 'ISKA' },
            ozet: ['{ad} canavara güçlü vurdu!', '{ad} isabet ettirdi.', 'Canavar kükrüyor, daha güçlü vurun!'] },
        canavar: { simdi: () => 'ŞİMDİ: Hep birlikte <b>canavarı devir!</b>',
            ok: { sari: 'KRİTİK!', kirmizi: 'GÜÇLÜ VURUŞ', mavi: 'VURUŞ', siyah: 'SIYIRDI', beyaz: 'SIYIRDI', iska: 'ISKA' },
            ozet: ['{ad} canavarı sarstı!', '{ad} isabet ettirdi.', 'Canavar kükrüyor, daha güçlü vurun!'] },
        hapsirik: { simdi: () => 'ŞİMDİ: Yaratığı <b>gıdıkla</b>, hapşırt!',
            ok: { sari: 'SÜPER GIDIK!', kirmizi: 'GIDIK!', mavi: 'GIDIK', siyah: 'HAFİF GIDIK', beyaz: 'HAFİF GIDIK', iska: 'ISKA' },
            ozet: ['{ad} süper gıdıkladı!', '{ad} gıdıkladı.', 'Yaratık kıkırdamadı bile!'] }
    };
    const kapali = () => { try { return localStorage.getItem('dag_km_an_kapali') === '1'; } catch (e) { return false; } };
    const sessiz = () => (typeof kmOyunSessiz === 'function' ? kmOyunSessiz() : false);

    /* ---------------------------------------------------------------- ses */
    let AC = null;
    function ac() { if (sessiz()) return null; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch (e) { return null; } }
    function ton(f, sure, gur, gec, tip) { const a = ac(); if (!a) return; try { const t = a.currentTime + (gec || 0), o = a.createOscillator(), g = a.createGain(); o.type = tip || 'triangle'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gur, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + sure); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + sure + 0.05); } catch (e) { } }
    function gurultu(sure, gur, f, tip) { const a = ac(); if (!a) return; try { const n = Math.floor(a.sampleRate * sure), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.2); const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = b; fl.type = tip || 'lowpass'; fl.frequency.value = f; g.gain.value = gur; s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(); } catch (e) { } }
    const SES = {
        sari: () => { gurultu(0.7, 0.55, 600); ton(90, 0.4, 0.35, 0, 'sine'); ton(880, 0.25, 0.08, 0.05); ton(1320, 0.35, 0.07, 0.12); },
        kirmizi: () => { gurultu(0.5, 0.45, 700); ton(80, 0.3, 0.28, 0, 'sine'); },
        mavi: () => { gurultu(0.35, 0.3, 1200); ton(330, 0.15, 0.06); },
        siyah: () => gurultu(0.3, 0.22, 1600, 'bandpass'),
        beyaz: () => gurultu(0.3, 0.2, 2200, 'bandpass'),
        iska: () => { gurultu(0.5, 0.25, 2600, 'highpass'); ton(220, 0.3, 0.05, 0.05, 'sawtooth'); },
        ad: () => { ton(523, 0.12, 0.07, 0); ton(784, 0.18, 0.07, 0.09); }
    };
    function soyle(metin) {
        if (sessiz() || !metin) return;
        if (typeof kmOyunSesliSoyle === 'function') { kmOyunSesliSoyle(metin); return; }
        try { if (!window.speechSynthesis) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(metin); u.lang = 'tr-TR'; u.rate = 0.95; speechSynthesis.speak(u); } catch (e) { }
    }

    /* ---------------------------------------------------------------- CSS */
    function css() {
        if ($('an-css')) return;
        const st = document.createElement('style'); st.id = 'an-css';
        st.textContent = [
            '#an-simdi{display:none;align-items:center;gap:10px 14px;flex-wrap:wrap;margin:0 0 8px;padding:9px 14px;border-radius:14px;background:linear-gradient(90deg,rgba(8,16,30,.92),rgba(14,26,46,.92));border:1px solid rgba(160,200,240,.22);color:#f4f8ff}',
            '#an-simdi.ac{display:flex}',
            '#an-simdi .an-cumle{flex:1 1 320px;min-width:0;font-family:"Bungee","Barlow Condensed",Impact,system-ui,sans-serif;font-size:clamp(15px,1.9vw,24px);line-height:1.2;letter-spacing:.01em}',
            '#an-simdi .an-cumle b{color:#ffd23f;font-weight:400}#an-simdi .an-cumle b.kirmizi{color:#ff6b6b}',
            '#an-simdi .an-lej{display:flex;gap:5px;flex-wrap:wrap}',
            '#an-simdi .an-lej span{font:800 12px/1 Nunito,Inter,system-ui,sans-serif;padding:5px 8px;border-radius:99px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);white-space:nowrap}',
            '#an-simdi .an-lej i{font-style:normal;font-weight:900;margin-right:4px}',
            '#an-simdi .an-dug{font:800 12px Nunito,Inter,system-ui,sans-serif;padding:5px 10px;border-radius:99px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#f4f8ff;cursor:pointer}',
            '#km-oyun-wrap:fullscreen #an-simdi .an-cumle{font-size:clamp(18px,2.2vw,32px)}',
            '.an-perde{position:absolute;inset:0;z-index:60;pointer-events:none;display:grid;place-items:center;opacity:0;transition:opacity .2s}',
            '.an-perde.ac{opacity:1}',
            '.an-perde::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,6,16,.25) 20%,rgba(0,6,16,.78) 78%)}',
            '.an-ic{position:relative;text-align:center;color:#fff;transform:translateY(-6%)}',
            '.an-ad{font-family:"Bungee","Barlow Condensed",Impact,system-ui,sans-serif;font-size:clamp(30px,6.5vw,84px);line-height:1;text-shadow:0 5px 0 #000,0 0 28px rgba(0,0,0,.6);animation:anGir .35s ease-out}',
            '.an-okl{display:flex;gap:12px;justify-content:center;margin-top:14px}',
            '.an-okl span{width:clamp(48px,6vw,70px);height:clamp(48px,6vw,70px);border-radius:50%;display:grid;place-items:center;font-family:"Bungee",Impact,system-ui,sans-serif;font-size:clamp(18px,2.4vw,28px);background:rgba(0,0,0,.55);border:4px solid rgba(255,255,255,.2);opacity:.25;transform:scale(.6);transition:all .2s;color:#111}',
            '.an-okl span.on{opacity:1;transform:scale(1)}',
            '.an-etiket{min-height:1.3em;margin-top:12px;font-family:"Bungee","Barlow Condensed",Impact,system-ui,sans-serif;font-size:clamp(24px,4.6vw,60px);line-height:1.05;text-shadow:0 5px 0 #000,0 0 24px rgba(0,0,0,.7)}',
            '.an-etiket.pat{animation:anPat .45s ease-out}',
            '.an-alt{margin-top:8px;font:900 clamp(14px,1.8vw,22px) Nunito,Inter,system-ui,sans-serif;color:#dbe7f5;text-shadow:0 2px 0 #000}',
            '@keyframes anGir{from{transform:scale(1.4);opacity:0}to{transform:scale(1);opacity:1}}',
            '@keyframes anPat{0%{transform:scale(.4);opacity:0}55%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}',
            '@media (prefers-reduced-motion:reduce){.an-ad,.an-etiket.pat{animation:none}}',
            '@media (max-width:600px){#an-simdi .an-lej span{font-size:10.5px;padding:4px 6px}#an-simdi{padding:7px 10px}}'
        ].join('\n');
        document.head.appendChild(st);
    }

    /* ---------------------------------------------------------------- ŞİMDİ şeridi */
    function lejant(T) {
        const o = T.ok, alt = o.iska === o.beyaz ? o.beyaz : o.beyaz.replace(/!$/, '') + ' / ' + o.iska;
        return [['#ffd23f', '9-10', o.sari], ['#ff6b6b', '7-8', o.kirmizi], ['#4aa8ff', '5-6', o.mavi], ['#c7d2de', 'altı', alt]]
            .map((x) => '<span><i style="color:' + x[0] + '">' + x[1] + '</i>' + esc(x[2].replace(/!$/, '')) + '</span>').join('');
    }
    function anTazele(tema) {
        css();
        const el = $('an-simdi'); if (!el) return;
        const T = AN[tema];
        if (!T) { el.classList.remove('ac'); el.innerHTML = ''; return; }
        let cumle = ''; try { cumle = T.simdi(); } catch (e) { cumle = ''; }
        el.innerHTML = '<div class="an-cumle">' + cumle + '</div><div class="an-lej">' + lejant(T) + '</div>'
            + '<button type="button" class="an-dug" id="an-dug" title="Her seriden sonraki büyük anı aç/kapat">' + (kapali() ? '🎬 An: kapalı' : '🎬 An: açık') + '</button>' + (typeof yeniRozet === 'function' ? yeniRozet() : '');
        el.classList.add('ac');
        const d = $('an-dug'); if (d) d.onclick = () => { try { localStorage.setItem('dag_km_an_kapali', kapali() ? '0' : '1'); } catch (e) { } anTazele(tema); };
    }

    /* ---------------------------------------------------------------- ok anı */
    let _calisan = null;
    function anSeriGoster(tema, s, oklar, devam) {
        const T = AN[tema], bitti = () => { try { devam(); } catch (e) { } };
        if (!T || kapali()) return bitti();
        const sahne = document.querySelector('#km-oyun-wrap .km-oyun-scene');
        if (!sahne) return bitti();
        css();
        if (_calisan) { try { _calisan(); } catch (e) { } }
        const liste = (oklar || []).map((k) => (k && typeof k === 'object' ? k.puan : k));
        const ad = ilkAd(s && s.ad);
        let p = sahne.querySelector('.an-perde'); if (p) p.remove();
        p = document.createElement('div'); p.className = 'an-perde';
        p.innerHTML = '<div class="an-ic"><div class="an-ad">' + esc(buyukTR(ad)) + '</div><div class="an-okl">' + liste.map(() => '<span></span>').join('') + '</div><div class="an-etiket"></div><div class="an-alt"></div></div>';
        sahne.appendChild(p);
        requestAnimationFrame(() => p.classList.add('ac'));
        SES.ad();
        const zl = []; let bitirildi = false;
        const sonla = () => { if (bitirildi) return; bitirildi = true; zl.forEach(clearTimeout); _calisan = null; p.classList.remove('ac'); setTimeout(() => p.remove(), 250); bitti(); };
        _calisan = sonla;
        const adim = 640, bas = 420;
        const daireler = p.querySelectorAll('.an-okl span'), et = p.querySelector('.an-etiket'), alt = p.querySelector('.an-alt');
        let iyi = 0, orta = 0;
        liste.forEach((v, j) => zl.push(setTimeout(() => {
            const k = kademe(v); if (IYI[k]) iyi++; else if (k === 'mavi') orta++;
            const d = daireler[j]; d.textContent = String(v).toUpperCase(); d.style.background = RENK[k]; d.style.borderColor = '#fff'; if (k === 'siyah') { d.style.background = '#1d222b'; d.style.color = '#fff'; } if (k === 'iska') { d.style.background = '#2b3a48'; d.style.color = '#fff'; } d.classList.add('on');
            et.textContent = T.ok[k]; et.style.color = k === 'siyah' || k === 'beyaz' ? '#e9eef5' : RENK[k]; et.classList.remove('pat'); void et.offsetWidth; et.classList.add('pat');
            try { SES[k](); } catch (e) { }
        }, bas + j * adim)));
        zl.push(setTimeout(() => {
            const n = Math.max(1, liste.length), i = iyi / n >= 0.6 ? 0 : (iyi >= 1 || orta >= 2) ? 1 : 2, cumle = T.ozet[i].replace('{ad}', ad);
            alt.textContent = cumle; soyle(cumle);
        }, bas + liste.length * adim + 80));
        zl.push(setTimeout(sonla, bas + liste.length * adim + 1050));
    }

    window.anTazele = anTazele;
    window.anSeriGoster = anSeriGoster;
    window.AN_TEMALAR = Object.keys(AN);
    window._anIc = { kademe: kademe, AN: AN };
})();
