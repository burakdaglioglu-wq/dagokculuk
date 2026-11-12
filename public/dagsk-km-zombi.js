/* ================================================================================================
   🧟 ZOMBİ SALGINI — Karışık Sınıf › Oyunlar teması 'zombi' (2026-11-06, v381). Son Üs'ün yerine. Kullanıcı Son Üs için "çok kötü, yeni oyun yap" dedi,
   dört farklı oyundan bunu seçti. Teşhis: bütün oyunlar "ok at, can düşsün"; burada can barı yok, ekrandaki kalabalık değişir.
   OYUN: herkes ekranda kendi karakteriyle. Birkaç çocuk zombi başlar. Ok "panzehir" ise (çocuğun KENDİ seviyesine göre) bir zombi iyileşir; zombi çocuk
     önce kendini iyileştirir. Belirli aralıkla zombiler ısırır. Herkes atınca sağlam çoğunluktaysa salgın durur.
   KURALLAR (STANDING): sonuç herkes atmadan belli olmaz (zombi kalmazsa yeni dalga gelir); suç çocuğa yüklenmez: ısırık atan çocuğa değil, sırası gelen kalabalığa;
     tur sırasında puan sıralaması yok; finalde herkesin adı, son atan kahraman değil; koçta "Hep birlikte bitir".
   GÖRÜNÜM (2026-11-07, v383; kullanıcı: "zombi görünümünü daha iyi yapmalıyız", iki canlı taslaktan B "Son barikat"ı seçti): gece sokağı; zombiler barikatın arkasında, sağlamlar önünde.
     Isırılan çocuk barikatı geçer, kurtulan geri koşar. Karakterler piksel, sağlamın elinde yay; tişört rengi zombi olunca solgun kalır. Kurallar değişmedi. Kişiler DOM'da (data-km-sporcu), konum left/top ile: button:active transform'u bozmasın.
   ANLAR (v384): ısırıkta sokaktan ADSIZ bir zombi atlar (STANDING: ısıran hiçbir çocuk değil), panzehir parlayan ok + patlama, sentez zombi sesleri, final sahnesi (kazanınca güneş doğar, son zombiler de iyileşir; kaybedince barikat yıkılır, kızıl gök).
   v405 (2026-11-12; kullanıcı: "görünümünü değiştirelim, sesini güzelleştir özelleştir, bazen tek başına sporcu olabilir, bazen özel atışlar olsun: gözleri kapalı maviye at,
     ekranda kocaman"). İki canlı taslaktan B "Çatıda Kurtarma" seçildi. KURALLAR AYNI. Eklenenler:
     · GÖRÜNÜM: gece çatısı; zombiler çatı kenarından (merdivenler) tırmanır, sağlamlar çatıda helipadın üstünde; helikopter ışığı tarar; kazanınca helikopter iner.
     · ÖZEL ATIŞ: her 5. atış sıradaki çocuğa (oyunda bir kez) ekranı kaplayan kart: "ELA, gözlerin kapalı atmalısın!"; o atışta panzehir için MAVİ yeter. Koç dokununca kapanır.
       Türler ayrı ayrı kapatılabilir (KM_OYUN_ICERIK 'ozel_<tip>'), hepsi 'ozel'.
     · AZ KİŞİ: atan <6 ise ekrana adsız KASABALILAR eklenir (kalabalık 8); onlar atmaz ama ısırılır/kurtarılır, sonuçta sayılır. Tek sporcu 3 tur atar.
     · SES: katmanlı homurtu, ağır ısırık, parlayan panzehir, helikopter/rüzgâr arka planı (oyun açıkken), özel atışta ad söylenir (speechSynthesis tr-TR).
   KABUK: skor girişi Oyunlar'ın dock'u. zbSahneKur · zbGuncelle · zbSeri(s, i, kaydedilecek, done) · zbAnlik · zbGeriYukle · zbSporcu · zbAyarUygula · zbFinalZorla.
   Durum 'dag_km_zombi_<konum>' km-ortak ile cihazlara gider, 12 saat kuralıyla sıfırlanır (KM_OYUN_SIFIR_ONEK).
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toLocaleDateString('sv-SE'));
    const konum = () => ((typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan');
    const ilkAd = (ad) => (typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]);
    const liste = () => (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || [];
    const ic = (k) => { try { return typeof kmOyunIcerik !== 'function' || kmOyunIcerik('zombi', k); } catch (e) { return true; } };
    const renk = (i) => (typeof kmOyunRenk === 'function' ? kmOyunRenk('zombi', i) : '#5FD4FF');
    const azHareket = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const puan = (v) => { v = String(v); return v === 'X' ? 10 : (v === 'M' ? 0 : (+v || 0)); };
    const anahtar = () => 'dag_km_zombi_' + konum();
    const kimlik = (s) => s.g + '|' + s.ad;
    const buyuk = (x) => String(x).toLocaleUpperCase('tr-TR');

    /* ---- kurallar (saf) ---- */
    const ISIRIK_ARALIK = 1; // simülasyon: her atışta 1 ısırık, 8-24 çocukta aynı dengeyi veriyor (ok başı %40 iyi atış: ~%80 kazanma, kalabalığın ~%40'ı zombi; kötü gün ~%20)
    function esikOf(ort) { return ort >= 7 ? 9 : ort >= 5 ? 7 : 5; } // yeni başlayan maviye, orta kırmızıya, iyi sarıya vurunca panzehir
    function panzehirSay(puanlar, esik) { return puanlar.filter((p) => p >= esik).length; }
    function baslangicSay(n) { return Math.max(1, Math.round(n / 6)); }
    function isirikSay() { return 1; }
    function kazandi(z, n) { return z < n - z; }
    // Seri sonucu: { iyilesen: [...], isirilan: [...], dalga: bool }. secici(dizi) rastgele seçim (test sabitler).
    function adimHesapla(st, key, puanlar, esik, herkes, secici, dalgaAcik) {
        const r = { iyilesen: [], isirilan: [], dalga: false, panzehir: panzehirSay(puanlar, esik) };
        let hak = r.panzehir > 0 ? 1 : 0; // bir seride en çok bir kişi: oyunu tek çocuk bitiremesin
        if (hak && st.zombi[key]) { r.iyilesen.push(key); hak--; }
        else if (hak) { const adaylar = herkes.filter((k) => st.zombi[k]); if (adaylar.length) r.iyilesen.push(adaylar.slice().sort((a, b) => (st.zamani[a] || 0) - (st.zamani[b] || 0))[0]); }
        r.iyilesen.forEach((k) => { delete st.zombi[k]; delete st.zamani[k]; });
        st.seri = (st.seri || 0) + 1;
        if (st.seri % ISIRIK_ARALIK === 0) {
            const z = herkes.filter((k) => st.zombi[k]).length;
            if (z === 0) { if (dalgaAcik && herkes.length > 1) { r.dalga = true; const a = herkes.filter((k) => !r.iyilesen.includes(k)); const k = secici(a.length ? a : herkes); if (k) { r.isirilan.push(k); st.zombi[k] = 1; st.zamani[k] = st.seri; st.isirik[k] = (st.isirik[k] || 0) + 1; } } }
            else {
                let bos = herkes.filter((k) => !st.zombi[k] && !r.iyilesen.includes(k));
                for (let i = isirikSay(z); i > 0 && bos.length; i--) { // en az ısırılan öncelikli: hep aynı çocuk zombi olmasın
                    const en = Math.min(...bos.map((k) => st.isirik[k] || 0)), k = secici(bos.filter((x) => (st.isirik[x] || 0) === en));
                    st.zombi[k] = 1; st.zamani[k] = st.seri; st.isirik[k] = (st.isirik[k] || 0) + 1; r.isirilan.push(k); bos = bos.filter((x) => x !== k);
                }
            }
        }
        return r;
    }
    const rastgele = (l) => l[Math.floor(Math.random() * l.length)];

    /* ---- durum ---- */
    let _st = null, _ham = null, _kn = null, _z = [], _kilit = false, _kur = '';
    function yeniOyun() { return { tarih: bugun(), zombi: {}, zamani: {}, isirik: {}, atan: {}, kurtardi: {}, seri: 0, faz: 'oyun', basladi: false, finalAdlar: null, kazandi: null }; }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_kn !== konum() || ham !== _ham || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _kn = konum(); _ham = ham; }
        if (!_st || _st.tarih !== bugun()) { _st = yeniOyun(); kaydet(); }
        return _st;
    }
    function kaydet() { try { _ham = JSON.stringify(_st); localStorage.setItem(anahtar(), _ham); } catch (e) { } }
    const atabilenler = () => liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]));
    // v405 az kişi: adsız kasabalılar (atmaz, ısırılır/kurtarılır, sonuçta sayılır). Anahtar 'kasaba|N'.
    const KASABA_ESIK = 6, KASABA_HEDEF = 8, kasabaliMi = (k) => /^kasaba\|/.test(String(k));
    function kasabalilar() { const n = atabilenler().length; if (!n || n >= KASABA_ESIK || !ic('kasaba')) return []; const a = []; for (let i = 1; i <= KASABA_HEDEF - n; i++) a.push('kasaba|' + i); return a; }
    const kalabalik = () => atabilenler().map(kimlik).concat(kasabalilar());
    const turSay = () => { let t = 1; try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; t = (a && a.zombiTur > 0) ? a.zombiTur : 1; } catch (e) { } return atabilenler().length === 1 ? Math.max(3, t) : t; };
    function ortalama(s) { try { if (typeof kmCanavarSporcuOrtalama === 'function') return kmCanavarSporcuOrtalama(s.g, s.ad) || 0; } catch (e) { } return 0; }
    const herkesAtti = (st) => { const l = atabilenler(); return l.length > 0 && l.every((s) => (st.atan[kimlik(s)] || 0) >= turSay()); };
    const atanSay = (st) => atabilenler().filter((s) => (st.atan[kimlik(s)] || 0) >= turSay()).length;
    const zombiSay = (st) => kalabalik().filter((k) => st.zombi[k]).length;
    function salginBaslat(st) {
        const l = kalabalik(); if (!l.length) return [];
        const z = [], kalan = l.slice();
        for (let i = kasabalilar().length ? 2 : baslangicSay(l.length); i > 0 && kalan.length; i--) { const k = rastgele(kalan); z.push(k); st.zombi[k] = 1; st.zamani[k] = 0; kalan.splice(kalan.indexOf(k), 1); }
        st.basladi = true; return z;
    }
    function bitir(st) {
        const l = atabilenler();
        st.finalAdlar = l.map((s) => ilkAd(s.ad)); st.kazandi = kazandi(zombiSay(st), kalabalik().length); st.faz = 'son';
        l.forEach((s) => { const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (!sp) return; const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.zombi = o.zombi || {}; o.zombi.oyun = (o.zombi.oyun || 0) + 1; if (st.kazandi) o.zombi.kurtulus = (o.zombi.kurtulus || 0) + 1; sp.lastModified = Date.now(); });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---- ses ---- */
    let AC = null;
    const sesAcik = () => { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1'; } catch (e) { return true; } };
    function ton(f, sure, gec, tip, gur) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (gec || 0); o.type = tip || 'square'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(gur || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + sure); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + sure); } catch (e) { } }
    function gurultu(sure, gur, gec, f, tip) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const n = Math.floor(AC.sampleRate * sure), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const k = AC.createBufferSource(), fl = AC.createBiquadFilter(), g = AC.createGain(); k.buffer = b; fl.type = tip || 'lowpass'; fl.frequency.value = f || 800; g.gain.value = gur || .2; k.connect(fl); fl.connect(g); g.connect(AC.destination); k.start(AC.currentTime + (gec || 0)); } catch (e) { } }
    // v405 sesler: katmanlı (iki testere + formant süzgeci + titreşim), zarf ile yumuşak. Hepsi sesAcik() ve try/catch altında.
    function ac() { if (!sesAcik()) return null; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch (e) { return null; } }
    function zarf(g, t, atak, tut, birak, gur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gur, t + atak); g.gain.setValueAtTime(gur, t + atak + tut); g.gain.exponentialRampToValueAtTime(0.0001, t + atak + tut + birak); }
    function gurBuf(a, sure) { const n = Math.floor(a.sampleRate * sure), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; const s = a.createBufferSource(); s.buffer = b; return s; }
    // Hırıltı: alçak iki testere, titreşim, iki formant; her seferinde biraz farklı
    function hirilti(gur, gec) {
        const a = ac(); if (!a) return; try {
            const t = a.currentTime + (gec || 0), b = 66 + Math.random() * 30, sure = .9 + Math.random() * .5, o = a.createOscillator(), o2 = a.createOscillator(), f1 = a.createBiquadFilter(), f2 = a.createBiquadFilter(), g = a.createGain(), lfo = a.createOscillator(), lg = a.createGain(), mx = a.createGain();
            o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.setValueAtTime(b, t); o.frequency.linearRampToValueAtTime(b * .7, t + sure); o2.frequency.setValueAtTime(b * 1.51, t); o2.frequency.linearRampToValueAtTime(b * 1.02, t + sure);
            lfo.frequency.value = 10 + Math.random() * 7; lg.gain.value = b * .18; lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
            f1.type = 'bandpass'; f1.frequency.setValueAtTime(620, t); f1.frequency.linearRampToValueAtTime(380, t + sure); f1.Q.value = 4; f2.type = 'bandpass'; f2.frequency.value = 1100; f2.Q.value = 6; mx.gain.value = .6;
            o.connect(f1); o2.connect(f1); o.connect(f2); f1.connect(g); f2.connect(mx); mx.connect(g);
            const n = gurBuf(a, sure + .2), nf = a.createBiquadFilter(), ng = a.createGain(); nf.type = 'bandpass'; nf.frequency.value = 900; nf.Q.value = 1.2; ng.gain.value = .25; n.connect(nf); nf.connect(ng); ng.connect(g);
            g.connect(a.destination); zarf(g, t, .08, sure * .6, sure * .4, gur || .3); [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + sure + .2); }); n.start(t); n.stop(t + sure + .2);
        } catch (e) { }
    }
    function cinlama(notalar, gec, gur) { const a = ac(); if (!a) return; try { const t = a.currentTime + (gec || 0); notalar.forEach((f, i) => { const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 2.01; o.connect(g); o2.connect(g); g.connect(a.destination); zarf(g, t + i * .07, .005, .05, .9, gur || .15); o.start(t + i * .07); o2.start(t + i * .07); o.stop(t + i * .07 + 1.1); o2.stop(t + i * .07 + 1.1); }); const n = gurBuf(a, .8), fl = a.createBiquadFilter(), g = a.createGain(); fl.type = 'highpass'; fl.frequency.value = 6000; n.connect(fl); fl.connect(g); g.connect(a.destination); zarf(g, t, .02, .2, .5, .1); n.start(t); } catch (e) { } }
    function davul(gec, gur) { const a = ac(); if (!a) return; try { const t = a.currentTime + (gec || 0), o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(40, t + .3); o.connect(g); g.connect(a.destination); zarf(g, t, .004, .04, .35, gur || .8); o.start(t); o.stop(t + .45); } catch (e) { } }
    function akor(liste, gec, uzun) { const a = ac(); if (!a) return; try { const t0 = a.currentTime + (gec || 0); liste.forEach(([f, d], j) => { [1, 1.5, 2].forEach((m) => { const o = a.createOscillator(), g = a.createGain(), fl = a.createBiquadFilter(); o.type = m === 1 ? 'sawtooth' : 'triangle'; o.frequency.value = f * m; fl.type = 'lowpass'; fl.frequency.value = 2400; o.connect(fl); fl.connect(g); g.connect(a.destination); const son = j === liste.length - 1; zarf(g, t0 + d, .02, son ? (uzun || .9) : .12, .5, m === 1 ? .08 : .045); o.start(t0 + d); o.stop(t0 + d + 2.2); }); }); } catch (e) { } }
    // Konuşma: çocuğun adı (özel atışta). tr-TR ses yoksa sessiz geçer.
    function konus(metin) { if (!sesAcik() || !ic('sesAd')) return; try { if (!window.speechSynthesis) return; const u = new SpeechSynthesisUtterance(metin); u.lang = 'tr-TR'; u.rate = .95; u.pitch = .85; const v = speechSynthesis.getVoices().find((x) => /^tr/i.test(x.lang)); if (v) u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { } }
    const SES = {
        ok: () => { gurultu(.22, .1, 0, 2400, 'bandpass'); ton(660, .12, 0, 'sine', .04); },
        kurtar: () => cinlama([784, 988, 1175, 1568, 1976]),
        atla: () => { hirilti(.28); gurultu(.16, .14, .1, 900); },
        isir: () => { davul(0, .9); gurultu(.22, .3, 0, 2200, 'highpass'); hirilti(.3, .12); },
        kacti: () => ton(220, .14, 0, 'triangle', .05),
        boom: () => { gurultu(1.2, .5, 0, 500); davul(0, 1); davul(.25, .7); },
        ozel: () => { const a = ac(); if (!a) return; try { const t = a.currentTime, o = a.createOscillator(), g = a.createGain(); o.type = 'square'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(880, t + .5); o.connect(g); g.connect(a.destination); zarf(g, t, .01, .4, .2, .08); o.start(t); o.stop(t + .7); } catch (e) { } [.7, .88, 1.06].forEach((d) => davul(d, .9)); },
        zafer: () => { akor([[523, 0], [659, .18], [784, .36], [1047, .6]]); cinlama([1568, 2093, 2637], 1.2, .08); },
        yenilgi: () => { SES.boom(); [220, 185, 147, 110].forEach((f, i) => ton(f, .34, .3 + i * .2, 'sawtooth', .07)); hirilti(.35, .7); hirilti(.3, 1.3); }
    };
    // Arka plan: rüzgâr + uzaktan helikopter pervanesi. Yalnızca oyun ekranı açıkken (dongu) çalar, çıkınca/gizlenince durur.
    let _ortamSes = null;
    function ortamBaslat() {
        if (_ortamSes || !ic('ortam')) return; const a = ac(); if (!a || a.state !== 'running') return;
        try {
            const t = a.currentTime, ana = a.createGain(); ana.gain.setValueAtTime(0.0001, t); ana.gain.exponentialRampToValueAtTime(1, t + 2); ana.connect(a.destination);
            const n = gurBuf(a, 4); n.loop = true; const nf = a.createBiquadFilter(), ng = a.createGain(), lfo = a.createOscillator(), lg = a.createGain(); nf.type = 'bandpass'; nf.frequency.value = 450; nf.Q.value = .8; lfo.frequency.value = .13; lg.gain.value = 260; lfo.connect(lg); lg.connect(nf.frequency); ng.gain.value = .035; n.connect(nf); nf.connect(ng); ng.connect(ana);
            const p = gurBuf(a, 4); p.loop = true; const pf = a.createBiquadFilter(), pg = a.createGain(), pl = a.createOscillator(), plg = a.createGain(); pf.type = 'lowpass'; pf.frequency.value = 180; pg.gain.value = 0; pl.type = 'square'; pl.frequency.value = 7.5; plg.gain.value = .045; pl.connect(plg); plg.connect(pg.gain); p.connect(pf); pf.connect(pg); pg.connect(ana);
            [n, lfo, p, pl].forEach((x) => x.start(t)); _ortamSes = { ana, kaynak: [n, lfo, p, pl] };
        } catch (e) { _ortamSes = null; }
    }
    function ortamDur() { const o = _ortamSes; if (!o) return; _ortamSes = null; try { const t = AC.currentTime; o.ana.gain.cancelScheduledValues(t); o.ana.gain.setValueAtTime(o.ana.gain.value || .5, t); o.ana.gain.exponentialRampToValueAtTime(0.0001, t + .6); o.kaynak.forEach((x) => { try { x.stop(t + .7); } catch (e) { } }); } catch (e) { } }
    // gizli sekmede requestAnimationFrame durur, dongu çalışmaz: arka plan sesi burada kesilir
    document.addEventListener('visibilitychange', () => { if (document.hidden) { ortamDur(); try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { } } });

    /* ---- çizim: kalabalık bir kez kurulur, sınıflar ve konumlar değişir (animasyon ve performans için) ---- */
    const panel = () => $('km-oyun-panel-zombi');
    /* piksel karakter (26x36, iki kare). Sağlam çocuğun elinde yay; zombi olunca tişört rengi solgun kalır, çocuk kim olduğunu kaybetmez. */
    const SAC = ['#2B1B12', '#5A3417', '#8A5A2B', '#C99A4B', '#1C1C24', '#6E2F1E'], TEN = ['#F2C79A', '#E6B98C', '#D9A578', '#F5D0A9'];
    const karma = (k) => { let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0; return h; };
    const hexMi = (h) => /^#[0-9a-f]{6}$/i.test(String(h));
    const koyu = (h, k) => { const n = parseInt(h.slice(1), 16); return 'rgb(' + Math.min(255, ((n >> 16) & 255) * k | 0) + ',' + Math.min(255, ((n >> 8) & 255) * k | 0) + ',' + Math.min(255, (n & 255) * k | 0) + ')'; };
    const solgun = (h) => { const n = parseInt(h.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, o = (r + g + b) / 3; return 'rgb(' + ((r * .55 + o * .45) * .72 | 0) + ',' + ((g * .55 + o * .45) * .72 | 0) + ',' + ((b * .55 + o * .45) * .72 | 0) + ')'; };
    function kareSaglam(c, ox, a, o) {
        const p = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(ox + x, y, w, h); }, y0 = a ? 0 : 1, g = o.g, g2 = koyu(g, .72), ten = o.ten, t2 = koyu(ten, .82), s = o.sac;
        p(8, 25, 4, 8, '#26324A'); p(14, 25, 4, 8, '#26324A'); p(16, 25, 2, 8, '#1B2438'); p(7, 33, 5, 2, '#14141C'); p(14, 33, 5, 2, '#14141C');
        p(7, 14 + y0, 12, 11, g); p(16, 14 + y0, 3, 11, g2); p(7, 22 + y0, 12, 1, '#3A2A18'); p(19, 15 + y0, 3, 8, g); p(19, 23 + y0, 3, 2, ten); p(4, 15 + y0, 3, 8, g); p(4, 23 + y0, 3, 2, ten);
        for (let i = 0; i < 6; i++) p(8 + i, 15 + y0 + i, 1, 1, '#7A5230'); // sadak kayışı
        p(22, 5 + y0, 1, 2, '#8A5A2B'); p(23, 7 + y0, 1, 4, '#8A5A2B'); p(24, 11 + y0, 1, 10, '#7A5230'); p(23, 21 + y0, 1, 4, '#8A5A2B'); p(22, 25 + y0, 1, 2, '#8A5A2B'); p(22, 7 + y0, 1, 18, '#DFE6EA'); // yay
        p(8, 3 + y0, 10, 11, ten); p(16, 3 + y0, 2, 11, t2); p(10, 8 + y0, 2, 2, '#141018'); p(14, 8 + y0, 2, 2, '#141018'); p(11, 11 + y0, 4, 1, '#6B3B2A');
        if (o.stil === 0) { p(7, 1 + y0, 12, 4, s); p(7, 5 + y0, 2, 3, s); }
        else if (o.stil === 1) { p(7, 1 + y0, 12, 4, s); p(6, 4 + y0, 3, 12, s); p(17, 4 + y0, 3, 12, s); }
        else if (o.stil === 2) { p(7, 2 + y0, 12, 3, s); p(8, y0, 2, 2, s); p(12, y0, 2, 2, s); p(16, y0, 2, 2, s); }
        else if (o.stil === 3) { p(7, 1 + y0, 12, 4, s); p(18, 3 + y0, 3, 3, s); p(20, 5 + y0, 2, 8, s); }
        else if (o.stil === 4) { p(6, y0, 14, 5, s); p(5, 3 + y0, 3, 5, s); p(18, 3 + y0, 3, 5, s); }
        else { p(7, 1 + y0, 12, 3, s); p(17, 3 + y0, 2, 4, s); }
    }
    function kareZombi(c, ox, a, o) {
        const p = (x, y, w, h, f) => { c.fillStyle = f; c.fillRect(ox + x, y, w, h); }, sil = (x, y, w, h) => c.clearRect(ox + x, y, w, h), t = '#7FBF4A', t2 = '#5D9436', hx = 7 + a;
        p(8, 26, 4, 7, '#2A332E'); p(15, 27, 4, 6, '#2A332E'); p(7, 33, 5, 2, '#101410'); p(15, 33, 5, 2, '#101410'); sil(9, 30, 2, 2);
        p(7, 15, 12, 12, o.solgun); p(16, 15, 3, 12, 'rgba(0,0,0,.35)'); p(9, 18, 3, 3, t2); sil(7, 25, 3, 2); sil(14, 24, 3, 3); p(11, 26, 2, 1, '#2A332E');
        p(0, 15 + a, 8, 3, t); p(0, 15 + a, 2, 3, t2); p(0, 20 - a, 8, 3, t2); p(0, 20 - a, 2, 3, '#47752A');
        p(hx, 3, 11, 11, t); p(hx + 8, 3, 3, 11, t2); p(hx + 1, 6, 2, 3, t2);
        p(hx, 1, 11, 3, '#3D5A22'); p(hx, 4, 2, 3, '#3D5A22'); p(hx + 4, 0, 2, 1, '#3D5A22'); p(hx + 8, 0, 2, 1, '#3D5A22');
        p(hx + 1, 6, 4, 4, '#3B0B0B'); p(hx + 2, 7, 3, 3, '#FF3B30'); p(hx + 3, 8, 1, 1, '#FFE4D6'); p(hx + 7, 7, 2, 2, '#141018');
        p(hx + 2, 11, 7, 3, '#1A0A0A'); p(hx + 3, 11, 1, 1, '#EDE6C8'); p(hx + 5, 11, 1, 1, '#EDE6C8'); p(hx + 7, 11, 1, 1, '#EDE6C8'); p(hx + 4, 13, 1, 1, '#EDE6C8'); p(hx + 6, 13, 1, 1, '#EDE6C8');
        p(hx + 5, 14, 1, 2, '#9BEA5A');
    }
    const _spr = new Map();
    function spriteOf(k, r) {
        const an = k + '|' + r; if (_spr.has(an)) return _spr.get(an);
        const h = karma(k), g = hexMi(r) ? r : '#3B82F6', o = { g, solgun: solgun(g), ten: TEN[h % TEN.length], sac: SAC[(h >> 3) % SAC.length], stil: (h >> 6) % 6 };
        const yap = (f) => { const cv = document.createElement('canvas'); cv.width = 52; cv.height = 36; const c = cv.getContext('2d'); f(c, 0, 0, o); f(c, 26, 1, o); return cv.toDataURL('image/png'); };
        const s = { n: yap(kareSaglam), z: yap(kareZombi) }; _spr.set(an, s); return s;
    }
    function kisiHtml(k, r) { const s = spriteOf(k, r); return '<span class="zb-svg" aria-hidden="true"><i class="zb-spr n" style="background-image:url(' + s.n + ')"></i><i class="zb-spr z" style="background-image:url(' + s.z + ')"></i></span>'; }

    /* sahne: gece sokağı. Zemin barikat çizgisine göre bir kez çizilir; ateş, ışık, sis ayrı tuvalde. */
    function tohum(n) { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    let _sah = { w: 0, h: 0, bar: 0, ufuk: 0, anahtar: '' }, _raf = 0, _son = 0, _gok = null, _finalOynuyor = false, _fx = [], _okEf = [], _ortam = 0, _npc = [];
    function tuvalBoyut(cv, w, h) { const d = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(w * d); cv.height = Math.round(h * d); const c = cv.getContext('2d'); c.setTransform(d, 0, 0, d, 0, 0); return c; }
    /* v405 "Çatıda Kurtarma": gece göğü + şehir silüeti (antenlerde kırmızı ışık), çatı kenarı (bar) ve merdiven uçları, aşağıda beton çatı + helipad. */
    function zeminCiz(w, h, bar) {
        const cv = $('zb-zemin'); if (!cv) return; const c = tuvalBoyut(cv, w, h), o = Math.max(.55, h / 620), t = bar;
        _sah.ufuk = t; _sah.anten = [];
        const g = c.createLinearGradient(0, 0, 0, t); g.addColorStop(0, '#050A18'); g.addColorStop(.55, '#0F1D3D'); g.addColorStop(1, '#22305A'); c.fillStyle = g; c.fillRect(0, 0, w, t + 2);
        let r = tohum(4); for (let i = 0; i < 110; i++) { c.fillStyle = 'rgba(255,255,255,' + (.2 + r() * .6) + ')'; c.fillRect(r() * w, r() * t * .55, 2, 2); }
        // ince ay
        const ax = w * .12, ay = Math.max(22, t * .2), ar = Math.max(12, 20 * o); c.fillStyle = 'rgba(220,230,255,.08)'; c.beginPath(); c.arc(ax, ay, ar * 2.4, 0, 7); c.fill(); c.fillStyle = '#E8EEFF'; c.beginPath(); c.arc(ax, ay, ar, 0, 7); c.fill(); c.fillStyle = '#0B1530'; c.beginPath(); c.arc(ax + ar * .45, ay - ar * .2, ar * .92, 0, 7); c.fill();
        // uzak bloklar
        r = tohum(11); for (let x = -20; x < w;) { const gn = (60 + r() * 70) * o, y = Math.min(t * .62, (50 + r() * 90) * o); c.fillStyle = '#111C36'; c.fillRect(x, t - y, gn, y + 2); x += gn + r() * 10; }
        // yakın bloklar, pencereler, antenler
        r = tohum(23); for (let x = -30; x < w;) {
            const gn = (70 + r() * 90) * o, y = Math.min(t * .5, (30 + r() * 70) * o); c.fillStyle = '#0A1226'; c.fillRect(x, t - y, gn, y + 2);
            for (let wy = t - y + 7 * o; wy < t - 8 * o; wy += 14 * o) for (let a = x + 6 * o; a < x + gn - 9 * o; a += 13 * o) { const q = r(); c.fillStyle = q > .88 ? (q > .97 ? '#FFC870' : '#E8D9A0') : 'rgba(0,0,0,.3)'; c.fillRect(a, wy, 5 * o, 7 * o); }
            if (r() > .55) { const axn = x + gn * (.3 + r() * .4), ah = (14 + r() * 22) * o; c.fillStyle = '#26314F'; c.fillRect(axn - 1, t - y - ah, 2, ah); _sah.anten.push([axn, t - y - ah, r() * 6]); }
            x += gn + r() * 8;
        }
        // merdiven uçları: zombiler buradan tırmanır
        [.06, .3, .7, .94].forEach((f) => { const lx = w * f, lw = 26 * o, lh = Math.min(t * .32, 64 * o); c.fillStyle = '#6F7684'; c.fillRect(lx - lw / 2, t - lh, 4 * o, lh); c.fillRect(lx + lw / 2 - 4 * o, t - lh, 4 * o, lh); for (let yy = t - lh + 6 * o; yy < t; yy += 12 * o) c.fillRect(lx - lw / 2, yy, lw, 3 * o); c.beginPath(); c.strokeStyle = '#6F7684'; c.lineWidth = 4 * o; c.arc(lx - lw / 2 + 2 * o, t - lh, 9 * o, Math.PI, 0); c.stroke(); });
        // çatı
        const cat = c.createLinearGradient(0, bar, 0, h); cat.addColorStop(0, '#3D434F'); cat.addColorStop(1, '#1E222A'); c.fillStyle = cat; c.fillRect(0, bar, w, h - bar);
        c.strokeStyle = 'rgba(0,0,0,.22)'; c.lineWidth = 1; for (let x = 0; x < w; x += 60 * o) { c.beginPath(); c.moveTo(x, bar); c.lineTo(x, h); c.stroke(); } for (let y = bar + 40 * o; y < h; y += 46 * o) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
        // havalandırma kutuları
        [[.04, .3], [.9, .55]].forEach(([fx, fy]) => { const bx = w * fx, by = bar + (h - bar) * fy, bw = 46 * o, bh = 30 * o; c.fillStyle = '#4C5260'; c.fillRect(bx, by, bw, bh); c.fillStyle = '#2B303A'; for (let i = 0; i < 4; i++) c.fillRect(bx + 5 * o, by + 5 * o + i * 6 * o, bw - 10 * o, 2 * o); });
        // helipad
        const hx = w * .5, hy = bar + (h - bar) * .58, hr = Math.min((h - bar) * .4, w * .17); _sah.pad = [hx, hy, hr];
        c.strokeStyle = 'rgba(255,210,58,.75)'; c.lineWidth = Math.max(4, hr * .07); c.beginPath(); c.ellipse(hx, hy, hr, hr * .62, 0, 0, 7); c.stroke();
        c.fillStyle = 'rgba(255,210,58,.7)'; const hw = hr * .5, hh = hr * .6, kal = Math.max(5, hr * .13); c.fillRect(hx - hw / 2, hy - hh / 2 * .62 * 1.6, kal, hh); c.fillRect(hx + hw / 2 - kal, hy - hh / 2 * .62 * 1.6, kal, hh); c.fillRect(hx - hw / 2, hy - kal / 2 - hh * .02, hw, kal);
    }
    function barikatCiz(w, y, yuk) {
        // Çatı kenarı (korkuluk): beton kenar + sarı-siyah uyarı şeridi. id 'zb-barikat' (testler ve yıkılma animasyonu) korunur.
        const cv = $('zb-barikat'); if (!cv) return; const kp = $('zb-kalabalik'), sa = document.querySelector('.zb-sahne'); if (!kp || !sa) return; const rk = kp.getBoundingClientRect(), rs = sa.getBoundingClientRect();
        cv.style.left = (rs.left - rk.left) + 'px'; cv.style.top = y + 'px'; cv.style.width = w + 'px'; cv.style.height = (yuk + 4) + 'px';
        const c = tuvalBoyut(cv, w, yuk + 4), s = yuk * .38;
        c.clearRect(0, 0, w, yuk + 4);
        c.fillStyle = '#6A707C'; c.fillRect(0, 0, w, yuk); c.fillStyle = '#878D99'; c.fillRect(0, 0, w, Math.max(3, yuk * .14));
        c.save(); c.beginPath(); c.rect(0, yuk * .3, w, s); c.clip(); for (let x = -s * 2; x < w + s * 2; x += s * 2) { c.fillStyle = '#FFD23A'; c.beginPath(); c.moveTo(x, yuk * .3 + s); c.lineTo(x + s, yuk * .3); c.lineTo(x + s * 2, yuk * .3); c.lineTo(x + s, yuk * .3 + s); c.fill(); } c.restore();
        c.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 0; x < w; x += 90) c.fillRect(x, 0, 2, yuk);
        c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(0, yuk, w, 4);
    }
    // Helikopter (piksel). x,y gövde merkezi; ölçek o; pervane açısı t
    function heliCiz(c, x, y, o, t) {
        const p = (dx, dy, ww, hh, f) => { c.fillStyle = f; c.fillRect(x + dx * o, y + dy * o, ww * o, hh * o); };
        p(-30, -10, 44, 22, '#2E3A4E'); p(-26, -8, 18, 12, '#9FD8FF'); p(-24, -6, 6, 4, '#E6F6FF'); p(14, -4, 40, 6, '#2E3A4E'); p(50, -12, 6, 14, '#2E3A4E'); p(-24, 14, 40, 3, '#1C2433'); p(-20, 12, 3, 4, '#1C2433'); p(8, 12, 3, 4, '#1C2433'); p(-2, -15, 6, 5, '#1C2433');
        const pw = 54 * Math.abs(Math.cos(t * 22)) + 8; c.fillStyle = 'rgba(200,215,235,.75)'; c.fillRect(x + (1 - pw / 2) * o, y - 17 * o, pw * o, 2.5 * o);
        const kw = 10 * Math.abs(Math.sin(t * 25)) + 2; c.fillRect(x + (53 - kw / 2) * o, y - 6 * o, kw * o, 2 * o);
        if (Math.floor(t * 2) % 2) { c.fillStyle = '#FF3B3B'; c.fillRect(x + 54 * o, y - 14 * o, 3 * o, 3 * o); } else { c.fillStyle = '#7CFF8A'; c.fillRect(x - 31 * o, y - 2 * o, 3 * o, 3 * o); }
    }
    function canliCiz(ms) {
        const cv = $('zb-canli'); if (!cv || !_sah.w) return; const { w, h, bar, ufuk } = _sah, c = cv.getContext('2d'), t = ms / 1000, o = Math.max(.55, h / 620);
        c.clearRect(0, 0, w, h);
        if (_gok) {
            const p = azHareket() || !_gok.t0 ? 1 : Math.min(1, (ms - _gok.t0) / 1900);
            c.save(); c.beginPath(); c.rect(0, 0, w, ufuk); c.clip();
            const g = c.createLinearGradient(0, 0, 0, ufuk);
            if (_gok.tip === 'safak') {
                g.addColorStop(0, 'rgba(120,170,220,' + (.75 * p) + ')'); g.addColorStop(.6, 'rgba(255,170,90,' + (.8 * p) + ')'); g.addColorStop(1, 'rgba(255,214,140,' + (.9 * p) + ')'); c.fillStyle = g; c.fillRect(0, 0, w, ufuk);
                const r = 44 * o, sx = w * .8, sy = ufuk + r - p * (ufuk * .62 + r), ps = Math.max(3, r / 7); for (let i = 3; i > 0; i--) { c.fillStyle = 'rgba(255,226,140,' + (.12 * i) + ')'; c.beginPath(); c.arc(sx, sy, r + i * 18 * o, 0, 7); c.fill(); }
                c.fillStyle = '#FFE08A'; for (let x = -7; x <= 7; x++) for (let y = -7; y <= 7; y++) if (x * x + y * y <= 50) c.fillRect(sx + x * ps, sy + y * ps, ps + .5, ps + .5);
            } else {
                g.addColorStop(0, 'rgba(60,8,12,' + (.8 * p) + ')'); g.addColorStop(1, 'rgba(190,40,24,' + (.7 * p) + ')'); c.fillStyle = g; c.fillRect(0, 0, w, ufuk);
                for (let i = 0; i < 16; i++) { const u = (t * .12 + i * .13) % 1, sz = (18 + u * 40) * o; c.fillStyle = 'rgba(14,10,12,' + (.55 * (1 - u) * p) + ')'; c.fillRect(w * (.1 + (i % 8) * .12) + Math.sin(t + i) * 12 - sz / 2, ufuk - u * ufuk - sz / 2, sz, sz); }
            }
            c.restore();
        }
        // anten ışıkları
        (_sah.anten || []).forEach(([x, y, f]) => { if (Math.sin(t * 2.2 + f) > .2) { c.fillStyle = 'rgba(255,60,60,.25)'; c.beginPath(); c.arc(x, y, 7 * o, 0, 7); c.fill(); c.fillStyle = '#FF4D4D'; c.fillRect(x - 2, y - 2, 4, 4); } });
        // helikopter: gökte süzülür, ışığı çatıyı tarar; kazanınca helipada iner
        const pad = _sah.pad || [w * .5, bar + (h - bar) * .58, 60], ho = Math.max(.7, Math.min(1.6, w / 700));
        // sağ üstte "SIRADA" paneli, sol üstte sayaç var: helikopter ortanın solunda, ikisinin altında süzülür
        let hx = w * .3 + Math.sin(t * .35) * w * .08, hy = Math.max(110, ufuk * .42) + Math.sin(t * 1.3) * 5;
        if (_gok && _gok.tip === 'safak') { const p = azHareket() || !_gok.t0 ? 1 : Math.min(1, (ms - _gok.t0) / 2600), e = 1 - Math.pow(1 - p, 3); hx = hx + (pad[0] - hx) * e; hy = hy + (pad[1] - pad[2] * .5 - hy) * e; }
        if (!_gok) {
            const lx = w * .5 + Math.sin(t * .5) * w * .32, ly = bar + (h - bar) * .5, gen = 90 * o;
            const gr = c.createLinearGradient(hx, hy, lx, ly); gr.addColorStop(0, 'rgba(255,248,200,.22)'); gr.addColorStop(1, 'rgba(255,248,200,.05)'); c.fillStyle = gr;
            c.beginPath(); c.moveTo(hx - 4, hy + 10); c.lineTo(lx - gen, ly); c.lineTo(lx + gen, ly); c.lineTo(hx + 4, hy + 10); c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,248,200,.07)'; c.beginPath(); c.ellipse(lx, ly, gen, gen * .35, 0, 0, 7); c.fill();
        }
        if (!_gok || _gok.tip === 'safak') heliCiz(c, hx, hy, ho, t);
        if (_gok && _gok.tip === 'safak') return;
        // kenarda sis
        for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(150,170,210,.05)'; c.fillRect(((i * 330 + t * (12 + i * 3)) % (w + 420)) - 420, bar - (30 + i * 14) * o, 420, Math.max(14, 24 * o)); }
    }
    // Efekt katmanı (kişilerin üstünde): parlayan ok, patlama parçacıkları
    function efektCiz(ms) {
        const cv = $('zb-efekt'); if (!cv) return; if (!_fx.length && !_okEf.length) { if (cv._dolu) { cv.getContext('2d').clearRect(0, 0, _sah.w, _sah.h); cv._dolu = false; } return; }
        const c = cv.getContext('2d'); c.clearRect(0, 0, _sah.w, _sah.h); cv._dolu = true;
        _okEf = _okEf.filter((a) => ms - a.t0 < a.sure + 120);
        _okEf.forEach((a) => {
            const p = Math.min(1, (ms - a.t0) / a.sure), x = a.x0 + (a.x1 - a.x0) * p, y = a.y0 + (a.y1 - a.y0) * p, b = Math.max(0, p - .45), xk = a.x0 + (a.x1 - a.x0) * b, yk = a.y0 + (a.y1 - a.y0) * b, aci = Math.atan2(a.y1 - a.y0, a.x1 - a.x0);
            c.lineCap = 'round'; c.strokeStyle = 'rgba(155,234,90,.35)'; c.lineWidth = 14; c.beginPath(); c.moveTo(xk, yk); c.lineTo(x, y); c.stroke(); c.strokeStyle = '#D8FFB0'; c.lineWidth = 5; c.stroke();
            c.save(); c.translate(x, y); c.rotate(aci); c.fillStyle = '#FFF6C0'; c.beginPath(); c.moveTo(14, 0); c.lineTo(-6, -8); c.lineTo(-6, 8); c.closePath(); c.fill(); c.restore();
        });
        _fx = _fx.filter((q) => ms - q.t0 < q.om);
        _fx.forEach((q) => { const u = (ms - q.t0) / q.om; q.x += q.vx; q.y += q.vy; q.vy += .32; c.globalAlpha = 1 - u; c.fillStyle = q.r; c.fillRect(q.x - q.s / 2, q.y - q.s / 2, q.s, q.s); }); c.globalAlpha = 1;
    }
    function patla(x, y, renkler, n) { if (azHareket()) return; const t0 = performance.now(); for (let i = 0; i < n; i++) { const a = Math.random() * 6.3, h = 2 + Math.random() * 6; _fx.push({ x, y, vx: Math.cos(a) * h, vy: Math.sin(a) * h - 2, s: 4 + Math.random() * 8, r: renkler[i % renkler.length], t0, om: 450 + Math.random() * 450 }); } }
    function kisiMerkez(k) { const e = kisiEl(k), sa = document.querySelector('.zb-sahne'); if (!e || !sa) return null; const r = e.getBoundingClientRect(), rs = sa.getBoundingClientRect(); return { x: r.left - rs.left + r.width / 2, y: r.top - rs.top + r.height * .4 }; }
    function dongu(ms) {
        _raf = 0; const p = panel(); if (!p || !p.isConnected || !$('zb-canli') || (typeof _kmOyunAktifTema !== 'undefined' && _kmOyunAktifTema !== 'zombi')) { ortamDur(); return; }
        if (document.hidden || _gok || !$('zb-oyun') || !sesAcik() || !ic('ortam')) ortamDur(); else if (AC && AC.state === 'running') ortamBaslat();
        if (!document.hidden && ms - _son >= 33) {
            _son = ms; try { canliCiz(ms); efektCiz(ms); } catch (e) { }
            // zombiler ara sıra hırıldar (ses açıksa, kısık)
            if (ms > _ortam) { _ortam = ms + 8000 + Math.random() * 7000; try { if (AC && AC.state === 'running' && !_kilit && !_gok && $('zb-oyun') && zombiSay(durum()) > 0) hirilti(.1); } catch (e) { } }
        }
        _raf = requestAnimationFrame(dongu);
    }
    // Sahne ölçüsü değişince (ya da ilk açılışta) zemin yeniden çizilir
    function sahneOlc() {
        const sa = document.querySelector('.zb-sahne'); if (!sa) return null; const rs = sa.getBoundingClientRect(); if (!rs.width || !rs.height) return null;
        const kp = $('zb-kalabalik'), rk = kp ? kp.getBoundingClientRect() : null, bar = rk && rk.height ? Math.round(rk.top - rs.top + rk.height * BAR_ORAN) : Math.round(rs.height * .55), w = Math.round(rs.width), h = Math.round(rs.height), an = w + '|' + h + '|' + bar;
        if (_sah.anahtar !== an) { _sah = { w, h, bar, ufuk: 0, anahtar: an }; zeminCiz(w, h, bar); const cv = $('zb-canli'); if (cv) tuvalBoyut(cv, w, h); const ef = $('zb-efekt'); if (ef) tuvalBoyut(ef, w, h); if (azHareket()) canliCiz(performance.now()); }
        return _sah;
    }
    /* kalabalık: zombiler barikatın arkasında (sokakta), sağlamlar önünde. Çocuk ısırılınca barikatı geçer, kurtulunca geri koşar. */
    const BAR_ORAN = .5, AD_YUK = 19;
    // Verilen alana en büyük karakteri sığdıran sütun sayısı; karakterler azsa az satır
    function izgara(n, W, H, enFazla) {
        let en = { boy: 0, k: 1, s: 1 };
        for (let k = n; k >= 1; k--) { const s = Math.ceil(n / k), boy = Math.min(enFazla, W / k / .8, H / s - AD_YUK); if (boy > en.boy) en = { boy, k, s }; }
        return en;
    }
    function diz(el, W, y0, H, enFazla, zTaban) {
        if (!el.length) return; const g = izgara(el.length, W, Math.max(40, H), enFazla), sat = H / g.s, boy = Math.max(24, g.boy);
        el.forEach((b, i) => {
            const row = Math.floor(i / g.k), say = row < g.s - 1 ? g.k : el.length - g.k * (g.s - 1), o = i - row * g.k, cw = W / say, kw = Math.min(cw, boy * 1.25), y = y0 + sat * (row + 1) - boy - AD_YUK;
            b.style.left = Math.round(cw * (o + .5) - kw / 2) + 'px'; b.style.top = Math.round(y) + 'px'; b.style.width = Math.round(kw) + 'px'; b.style.height = Math.round(boy + AD_YUK) + 'px'; b.style.zIndex = zTaban + row; b.style.setProperty('--ad', Math.max(11, Math.min(15, boy * .2)) + 'px');
        });
    }
    function yerlesim(zombiler) {
        const kp = $('zb-kalabalik'); if (!kp) return; const r = kp.getBoundingClientRect(); if (!r.width || !r.height) return; const z = zombiler || durum().zombi, sa = sahneOlc();
        const bar = Math.round(r.height * BAR_ORAN), yuk = Math.max(24, Math.min(50, r.height * .1)), hepsi = Array.from(kp.querySelectorAll('.zb-kisi')), zo = hepsi.filter((b) => z[b.getAttribute('data-k')]), sg = hepsi.filter((b) => !z[b.getAttribute('data-k')]);
        diz(zo, r.width, 0, bar - 1, 112, 10);
        diz(sg, r.width, bar + yuk * .3, r.height - bar - yuk * .3, 140, 60);
        if (sa) barikatCiz(sa.w, bar, yuk);
    }
    const KASABA_RENK = ['#8A9BB0', '#A08C7A', '#7E9C8A', '#9A8AA8', '#B0A07A', '#7A8EA8', '#A87E7E'];
    const kurAnahtar = (st) => liste().map(kimlik).join('\u0001') + '|' + kasabalilar().length + '|' + st.tarih;
    function kalabalikKur() {
        const l = liste(), st = durum(), kp = $('zb-kalabalik'); if (!kp) return;
        kp.classList.remove('gecis');
        kp.innerHTML = '<canvas id="zb-barikat" aria-hidden="true"></canvas>' + l.map((s, i) => { const k = kimlik(s); return '<button type="button" class="zb-kisi" data-km-sporcu="' + i + '" data-k="' + esc(k) + '"><span class="zb-kafa">' + kisiHtml(k, renk(i)) + '<i class="zb-sira">SIRA</i></span><span class="zb-ad"><b class="zb-tik" aria-hidden="true"></b>' + esc(ilkAd(s.ad)) + '</span></button>'; }).join('')
            + kasabalilar().map((k, j) => '<button type="button" class="zb-kisi kasabali" tabindex="-1" data-k="' + k + '"><span class="zb-kafa">' + kisiHtml(k, KASABA_RENK[j % KASABA_RENK.length]) + '</span><span class="zb-ad">kasabalı</span></button>').join('');
        _kur = kurAnahtar(st);
        _sah.anahtar = '';
        requestAnimationFrame(() => requestAnimationFrame(() => { if (kp.isConnected && !azHareket()) kp.classList.add('gecis'); }));
    }
    function aktifIndeks() { return typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1; }
    function guncelle() {
        const kok = $('zb-icerik'); if (!kok) return; const st = durum();
        if (st.faz === 'son' && (_finalOynuyor || _kilit)) return; // final sahnesi oynuyor, kabuk erken çağırsa da kesilmesin
        if (st.faz === 'son') { if (!_gok) _gok = { tip: st.kazandi ? 'safak' : 'kizil', t0: 0 }; if (azHareket()) canliCiz(performance.now()); return sonCiz(st); }
        _gok = null;
        if (!$('zb-oyun')) oyunIskelet();
        if (kurAnahtar(st) !== _kur) kalabalikKur();
        if (!st.basladi && atabilenler().length) { const z = salginBaslat(st); kaydet(); if (z.length && !_kilit) acilis(z); }
        const ai = aktifIndeks(), n = atabilenler().length, nK = kalabalik().length;
        document.querySelectorAll('#zb-kalabalik .zb-kisi').forEach((b, i) => {
            const k = b.getAttribute('data-k'), z = !!st.zombi[k], at = (st.atan[k] || 0) >= turSay(), akt = i === ai;
            b.classList.toggle('zombi', z); b.classList.toggle('atti', at); b.classList.toggle('aktif', akt);
            const ad = b.querySelector('.zb-ad').textContent; b.setAttribute('aria-label', ad + (z ? ', zombi' : ', sağlam') + (at ? ', attı' : ''));
        });
        yerlesim();
        const zs = zombiSay(st), saglam = nK - zs, a = atanSay(st), akt = liste()[ai], tek = n === 1;
        const yaz = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
        yaz('zb-z', zs); yaz('zb-s', saglam); yaz('zb-at', tek ? 'Tur ' + Math.min(turSay(), ((st.atan[kimlik(atabilenler()[0])] || 0) + 1)) + ' / ' + turSay() : a + ' / ' + n + ' attı'); yaz('zb-kim', akt ? buyuk(ilkAd(akt.ad)) : '');
        const b = $('zb-bar'); if (b) b.style.width = (nK ? zs / nK * 100 : 0) + '%';
        if (!_kilit) ozelKarar(st);
        const ozelSen = akt && ozelBu(st, kimlik(akt));
        if (akt) { const es = ozelSen ? 5 : esikOf(ortalama(akt)), h = $('zb-yan-hedef'); if (h) h.setAttribute('data-esik', es); yaz('zb-yan-ad', buyuk(ilkAd(akt.ad))); yaz('zb-yan-esik', ozelSen ? '⚡ Özel atış: maviye vursan yeter' : (st.zombi[kimlik(akt)] ? 'Kendini kurtar: ' : 'Panzehir: ') + (es >= 9 ? 'sarıya vur' : es >= 7 ? 'kırmızıya ya da sarıya vur' : 'maviye ya da içine vur')); }
        const bit = $('zb-bitir'); if (bit) bit.hidden = !(a > 0 && a < n && a >= Math.ceil(n / 2));
    }
    /* ---- v405 özel atış ---- */
    const OZEL = [['goz', '🙈', 'Şu an gözlerin kapalı atmalısın!'], ['uc', '⏱️', '3 saniyede bırak, nişan yok!'], ['heykel', '🗿', 'Heykel ol: 5 saniye tut, sonra bırak!'], ['sessiz', '🤫', 'Sessiz atış: herkes nefesini tutsun!'], ['sayar', '🎤', 'Sınıf geri sayar: 3, 2, 1, BIRAK!']];
    const OZEL_ARALIK = 5;
    let _ozelGosterilen = '';
    const ozelBu = (st, key) => !!(st.ozel && st.ozel.seri === st.seri && st.ozel.key === key);
    function ozelKarar(st) {
        if (st.faz !== 'oyun' || !st.basladi) return;
        const akt = liste()[aktifIndeks()]; if (!akt || !atabilenler().includes(akt)) return;
        const key = kimlik(akt); st.ozelOlan = st.ozelOlan || {};
        if (st.ozel && st.ozel.seri === st.seri) {
            if (st.ozel.key !== key && !st.ozelOlan[key]) { st.ozel.key = key; kaydet(); }
            if (st.ozel.key === key) ozelGoster(st, akt); return;
        }
        if (st.ozel) { st.ozel = null; kaydet(); }
        if (st.ozelKarar === st.seri) return;
        st.ozelKarar = st.seri;
        const acik = ic('ozel') ? OZEL.filter((o) => ic('ozel_' + o[0])) : [];
        if (st.seri % OZEL_ARALIK === OZEL_ARALIK - 1 && !st.ozelOlan[key] && acik.length) { st.ozel = { key, tip: rastgele(acik)[0], seri: st.seri }; kaydet(); ozelGoster(st, akt); }
        else kaydet();
    }
    function ozelGoster(st, akt) {
        const im = st.ozel.key + '|' + st.ozel.seri; if (_ozelGosterilen === im) return; _ozelGosterilen = im;
        const o = OZEL.find((x) => x[0] === st.ozel.tip) || OZEL[0], sa = document.querySelector('.zb-sahne'); if (!sa) return;
        ozelKapa(); const d = document.createElement('div'); d.id = 'zb-ozel'; d.className = 'zb-ozel'; d.setAttribute('role', 'alert');
        d.innerHTML = '<div class="zb-oz-ust">⚡ ÖZEL ATIŞ ⚡</div><div class="zb-oz-ik">' + o[1] + '</div><div class="zb-oz-ad">' + esc(buyuk(ilkAd(akt.ad))) + '</div><div class="zb-oz-gorev">' + esc(o[2]) + '</div><div class="zb-oz-kolay"><i></i>Maviye vursan panzehir!</div><div class="zb-oz-alt">Dokun, kapanır</div>';
        d.onclick = () => ozelKapa(); sa.appendChild(d);
        SES.ozel(); setTimeout(() => konus(ilkAd(akt.ad) + '! Özel atış! ' + o[2]), 1200);
        sonra(() => ozelKapa(), 8000);
    }
    function ozelKapa() { const d = $('zb-ozel'); if (d) d.remove(); }
    function oyunIskelet() {
        $('zb-icerik').innerHTML = '<div class="zb-oyun" id="zb-oyun"><div class="zb-ust"><div class="zb-say z"><b id="zb-z">0</b><span>ZOMBİ</span></div><div class="zb-orta"><div class="zb-cubuk" role="img" aria-label="Zombi ve sağlam oranı"><i id="zb-bar"></i></div><div class="zb-bilgi"><span class="zb-sira-hud">Sıra: <b id="zb-kim"></b></span><span id="zb-at"></span><span class="zb-kl">Her atıştan sonra ısırık</span></div></div><div class="zb-say s"><b id="zb-s">0</b><span>SAĞLAM</span></div></div>'
            + '<div class="zb-duyuru" id="zb-duyuru" aria-live="polite"></div><div class="zb-kalabalik" id="zb-kalabalik"></div>'
            + '<div class="zb-yan" id="zb-yan"><div class="zb-yan-hedef" id="zb-yan-hedef" data-esik="7"><svg viewBox="0 0 120 120" role="img" aria-label="Hedefte panzehir bölgesi"><circle class="m" cx="60" cy="60" r="58"/><circle class="k" cx="60" cy="60" r="39"/><circle class="s" cx="60" cy="60" r="20"/></svg></div><div class="zb-yan-yazi"><small>SIRADA</small><b id="zb-yan-ad"></b><span id="zb-yan-esik"></span></div>'
            + '<div class="zb-arac"><button type="button" class="zb-kucuk" id="zb-nasil" aria-label="Nasıl oynanır">?</button><button type="button" class="zb-kucuk" id="zb-yeni-btn" aria-label="Yeni salgın">↻</button><button type="button" class="zb-kucuk genis" id="zb-bitir" hidden>Hep birlikte bitir</button></div></div></div>';
        kalabalikKur();
    }
    function sonCiz(st) {
        const k = st.kazandi, l = st.finalAdlar || [], n = l.length, z = st.sonZ != null ? st.sonZ : zombiSay(st);
        const sinif = liste().map((s, i) => '<span class="zb-son-kisi' + (k ? '' : ' zombi') + '" style="--g:' + (i % 7) + '">' + kisiHtml(kimlik(s), renk(i)) + '</span>').join('');
        $('zb-icerik').innerHTML = '<div class="zb-son ' + (k ? 'kazandi' : 'kaybetti') + '" id="zb-son"><span class="zb-et">Herkes attı</span><h2>' + (k ? 'SALGIN DURDU!' : 'ÇATI DÜŞTÜ!') + '</h2><p class="zb-sonuc"><b>' + (n - z) + '</b> sağlam · <b>' + z + '</b> zombi</p><p class="zb-cumle">' + (k ? 'Helikopter geldi, hep birlikte kurtuldunuz. Panzehir son zombilere de yetti.' : 'Bir dahaki sefere hep birlikte. Rövanş?') + '</p><div class="zb-adlar"><small>Bu salgında savaşanlar</small><span>' + l.map(esc).join(' · ') + '</span></div><button type="button" class="zb-buyuk" id="zb-yeni-son">Yeni salgın</button><div class="zb-son-kal" aria-hidden="true">' + sinif + '</div></div>';
        _kur = ''; _sah.anahtar = ''; sahneOlc();
    }
    function duyur(metin, sinif) { const d = $('zb-duyuru'); if (!d) return; const u = document.querySelector('.zb-ust'); if (u) d.style.top = (u.offsetHeight + 4) + 'px'; d.className = 'zb-duyuru ac ' + (sinif || ''); d.textContent = metin; }
    function duyuruKapa() { const d = $('zb-duyuru'); if (d) d.className = 'zb-duyuru'; }
    function zamanTemizle() { _z.forEach(clearTimeout); _z = []; _finalOynuyor = false; npcTemizle(); }
    function sonra(fn, ms) { const t = setTimeout(fn, ms); _z.push(t); }
    function kisiEl(k) { return document.querySelector('#zb-kalabalik .zb-kisi[data-k="' + (window.CSS && CSS.escape ? CSS.escape(k) : k) + '"]'); }
    function isaretle(k, sinif, ms) { const e = kisiEl(k); if (!e) return; e.classList.remove(sinif); void e.offsetWidth; e.classList.add(sinif); sonra(() => { const x = kisiEl(k); if (x) x.classList.remove(sinif); }, ms || 900); }
    // Panzehir oku: atan çocuktan iyileşene uçar; kendini iyileştirirse yukarıdan iner
    function okUcur(kaynak, hedef) {
        if (azHareket()) return; const a = kisiMerkez(kaynak), b = kisiMerkez(hedef); if (!a || !b) return;
        const ayni = kaynak === hedef; _okEf.push({ x0: ayni ? b.x + 40 : a.x, y0: ayni ? b.y - 130 : a.y, x1: b.x, y1: b.y, t0: performance.now(), sure: 300 });
    }
    // Isırık: sokaktan adsız bir zombi barikatı aşıp çocuğa atlar (hiçbir çocuk ısıran olmaz), sonra çocukla birlikte geri çekilir
    function npcGonder(k) {
        const kp = $('zb-kalabalik'), e = kisiEl(k); if (azHareket() || !kp || !e) return null;
        const r = kp.getBoundingClientRect(), bar = r.height * BAR_ORAN, g = parseFloat(e.style.width) || 60, y = parseFloat(e.style.height) || 90, x = parseFloat(e.style.left) || 0, ust = parseFloat(e.style.top) || 0, n = document.createElement('span');
        n.className = 'zb-npc zombi'; n.innerHTML = kisiHtml('sokak zombisi', '#6B7280'); n.style.cssText = 'left:' + x + 'px;top:' + (bar - y * .9) + 'px;width:' + g + 'px;height:' + y + 'px;opacity:0;z-index:45'; kp.appendChild(n); _npc.push(n);
        void n.offsetWidth; n.style.opacity = '1'; n.style.zIndex = '66'; n.style.left = (x - g * .18) + 'px'; n.style.top = (ust - y * .12) + 'px';
        return n;
    }
    function npcTemizle() { _npc.forEach((n) => n.remove()); _npc = []; }
    // Final sahnesi: kazanınca güneş doğar, son zombiler de iyileşir; kaybedince barikat yıkılır, herkes zombi. Sonra sonuç ekranı.
    function finalSahne(st, sonrasi) {
        const k = st.kazandi, kp = $('zb-kalabalik'); _gok = { tip: k ? 'safak' : 'kizil', t0: performance.now() }; (k ? SES.zafer : SES.yenilgi)();
        if (!kp || azHareket()) { _finalOynuyor = false; return sonrasi(); }
        _finalOynuyor = true;
        const el = Array.from(kp.querySelectorAll('.zb-kisi')), bitti = () => { _finalOynuyor = false; npcTemizle(); sonrasi(); };
        duyur(k ? 'SALGIN DURDU! HELİKOPTER GELİYOR!' : 'ZOMBİLER ÇATIYA ÇIKTI!', k ? 'iyi' : 'kotu');
        if (k) {
            const z = el.filter((b) => b.classList.contains('zombi'));
            z.forEach((b, i) => sonra(() => { b.classList.remove('zombi'); isaretle(b.getAttribute('data-k'), 'kurtuldu', 900); const m = kisiMerkez(b.getAttribute('data-k')); if (m) patla(m.x, m.y, ['#9BEA5A', '#FFD86B', '#FFFFFF'], 14); if (i % 2 === 0) ton(880 + i * 40, .12, 0, 'triangle', .05); }, 500 + i * 120));
            sonra(() => { yerlesim({}); }, 700 + z.length * 120);
        } else {
            const b = $('zb-barikat'); if (b) b.classList.add('yikil'); kp.classList.remove('sars'); void kp.offsetWidth; kp.classList.add('sars');
            const hepsi = {}; el.forEach((x) => { hepsi[x.getAttribute('data-k')] = 1; });
            el.filter((x) => !x.classList.contains('zombi')).forEach((x, i) => sonra(() => { x.classList.add('zombi'); isaretle(x.getAttribute('data-k'), 'isirildi', 800); }, 400 + i * 90));
            void hepsi;
        }
        sonra(() => { duyuruKapa(); bitti(); }, 2800);
    }
    function acilis(z) {
        _kilit = true; const adlar = z.map((k) => kasabaliMi(k) ? 'BİR KASABALI' : buyuk(ilkAd(k.slice(k.indexOf('|') + 1)))).join(', ');
        duyur('SALGIN BAŞLADI! ' + adlar + ' ZOMBİ OLDU!', 'kotu'); SES.isir(); z.forEach((k) => isaretle(k, 'isirildi', 900));
        sonra(() => { duyuruKapa(); _kilit = false; }, 2200);
    }

    /* ---- seri ---- */
    function zbSeri(s, i, kaydedilecek, done) {
        zamanTemizle(); duyuruKapa(); _kilit = true;
        const bit = () => { _kilit = false; try { done(); } catch (e) { } if (panel()) guncelle(); };
        const st = durum();
        if (st.faz !== 'oyun') { _kilit = false; kaydet(); try { done(); } catch (e) { } return; } // sonuç ekranında girilen seri kayda geçer, oyunu etkilemez
        if (!st.basladi) salginBaslat(st);
        const key = kimlik(s), puanlar = (kaydedilecek || []).map((k) => puan(k.puan)), ozel = ozelBu(st, key), esik = ozel ? 5 : esikOf(ortalama(s)), herkes = kalabalik();
        ozelKapa();
        const r = adimHesapla(st, key, puanlar, esik, herkes, rastgele, ic('dalga'));
        if (ozel) { st.ozelOlan = st.ozelOlan || {}; st.ozelOlan[key] = 1; st.ozel = null; }
        st.atan[key] = (st.atan[key] || 0) + 1;
        if (r.iyilesen.length) st.kurtardi[key] = (st.kurtardi[key] || 0) + 1;
        const final = herkesAtti(st);
        if (final) { st.sonZ = herkes.filter((k) => st.zombi[k]).length; bitir(st); }
        kaydet();
        if (!panel()) return bit();
        const adi = (ozel ? '⚡ ' : '') + buyuk(ilkAd(s.ad)), adOf = (k) => kasabaliMi(k) ? 'BİR KASABALI' : buyuk(ilkAd(k.slice(k.indexOf('|') + 1)));
        if (!$('zb-oyun')) oyunIskelet();
        // kalabalık önce iyileşeni gösterir, ısırık sonra gelir
        const goster = (zombiler) => { document.querySelectorAll('#zb-kalabalik .zb-kisi').forEach((b) => b.classList.toggle('zombi', !!zombiler[b.getAttribute('data-k')])); yerlesim(zombiler); const zs = herkes.filter((k) => zombiler[k]).length, bar = $('zb-bar'); if ($('zb-z')) $('zb-z').textContent = zs; if ($('zb-s')) $('zb-s').textContent = herkes.length - zs; if (bar) bar.style.width = (herkes.length ? zs / herkes.length * 100 : 0) + '%'; };
        const ara = Object.assign({}, st.zombi); r.isirilan.forEach((k) => delete ara[k]); if (!r.iyilesen.length) goster(ara);
        let bek = 0;
        if (r.iyilesen.length) {
            const h = r.iyilesen[0]; okUcur(key, h); SES.ok();
            sonra(() => { goster(ara); isaretle(h, 'kurtuldu', 1000); SES.kurtar(); const m = kisiMerkez(h); if (m) patla(m.x, m.y, ['#9BEA5A', '#D8FFB0', '#FFD86B', '#FFFFFF'], 30); }, 300);
            duyur(h === key ? adi + ' PANZEHİRİ VURDU, İYİLEŞTİ!' : adi + ' PANZEHİR ATTI, ' + adOf(h) + ' KURTULDU!', 'iyi'); bek = 1300;
        } else if (r.panzehir) { duyur(adi + ' PANZEHİR ATTI! ZOMBİ KALMADI!', 'iyi'); SES.kurtar(); bek = 1100; }
        else { duyur(adi + ': AZ KALDI!', ''); SES.kacti(); bek = 900; }
        if (r.isirilan.length) {
            sonra(() => { SES.atla(); r.isirilan.forEach(npcGonder); }, bek); bek += 420;
            sonra(() => { goster(st.zombi); SES.isir(); r.isirilan.forEach((k) => { isaretle(k, 'isirildi', 1000); const m = kisiMerkez(k); if (m) patla(m.x, m.y, ['#9BEA5A', '#5D9436', '#EDE6C8'], 18); }); _npc.forEach((n) => { n.style.top = '0px'; n.style.opacity = '0'; }); sonra(npcTemizle, 1100); const sah = $('zb-kalabalik'); if (sah && !azHareket()) { sah.classList.remove('sars'); void sah.offsetWidth; sah.classList.add('sars'); } duyur((r.dalga ? 'YENİ DALGA! ' : 'ZOMBİLER SALDIRDI! ') + r.isirilan.map(adOf).join(', ') + ' ISIRILDI!', 'kotu'); }, bek); bek += 1300;
        }
        sonra(() => {
            duyuruKapa();
            if (final) { finalSahne(st, () => { sonCiz(st); _kilit = false; try { done(); } catch (e) { } }); return; }
            bit();
        }, bek);
    }
    function zbFinalZorla() {
        const st = durum(); if (st.faz !== 'oyun') return;
        const f = () => { const s = durum(); if (s.faz !== 'oyun') return; s.sonZ = zombiSay(s); bitir(s); kaydet(); zamanTemizle(); finalSahne(s, () => guncelle()); };
        const kalan = atabilenler().length - atanSay(st);
        if (kalan > 0 && typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Salgın şimdi bitsin mi?<br><small>' + kalan + ' çocuk henüz atmadı. Sonuçta herkesin adı görünür.</small>', f, 'Hep birlikte bitir', 'Bekle'); else f();
    }
    function nasil() {
        const m = 'Ekrandakiler bu sınıf. Birkaç kişi zombi başlar.<br>Atış iyiyse panzehir olur: bir zombi kurtulur, zombi çocuk önce kendini kurtarır. "İyi atış" çocuğun kendi seviyesine göre: yeni başlayana mavi, ortaya kırmızı, iyiye sarı.<br>Her atıştan sonra zombiler bir kişiyi ısırır.<br>Herkes atınca sağlam çoğunluktaysa salgın durur.';
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste(m, () => { }, 'Tamam', 'Kapat');
    }
    function yeniSor() {
        const f = () => { zamanTemizle(); _kilit = false; _gok = null; _st = yeniOyun(); kaydet(); _kur = ''; $('zb-icerik').innerHTML = ''; guncelle(); };
        if (durum().faz !== 'oyun' || !durum().seri) return f();
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Yeni salgın başlasın mı?<br><small>Sporcu serileri silinmez.</small>', f, 'Yeni salgın', 'Vazgeç'); else f();
    }
    function zbSahneKur() {
        const p = panel(); if (!p) return; css(); zamanTemizle(); _kilit = false; _kur = '';
        p.innerHTML = '<div class="zb-sahne"><canvas id="zb-zemin" aria-hidden="true"></canvas><canvas id="zb-canli" aria-hidden="true"></canvas><div id="zb-icerik"></div><canvas id="zb-efekt" aria-hidden="true"></canvas></div>'; _fx = []; _okEf = []; _npc = []; _sah = { w: 0, h: 0, bar: 0, ufuk: 0, anahtar: '' };
        p.onclick = (e) => {
            const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.id === 'zb-nasil') nasil(); else if (t.id === 'zb-yeni-btn' || t.id === 'zb-yeni-son') yeniSor(); else if (t.id === 'zb-bitir') zbFinalZorla();
        };
        guncelle(); sahneOlc();
        if (window.ResizeObserver) { if (p._zbRo) p._zbRo.disconnect(); p._zbRo = new ResizeObserver(() => { const kp = $('zb-kalabalik'); if (!kp) return void sahneOlc(); kp.classList.remove('gecis'); yerlesim(); requestAnimationFrame(() => requestAnimationFrame(() => { if (kp.isConnected && !azHareket()) kp.classList.add('gecis'); })); }); p._zbRo.observe(p); }
        if (!_raf && !azHareket()) _raf = requestAnimationFrame(dongu); else if (azHareket()) canliCiz(performance.now());
    }
    function css() {
        if ($('zb-css')) return; const st = document.createElement('style'); st.id = 'zb-css';
        st.textContent = '.km-oyun-panel-zombi{padding:0;background:#0A1226;overflow:hidden;font-family:"Manrope",system-ui,sans-serif}'
            + '.zb-sahne{position:absolute;inset:0;color:#F2F6EE;overflow:hidden;background:#0A1226}#zb-zemin,#zb-canli,#zb-efekt{position:absolute;left:0;top:0;width:100%;height:100%;display:block;max-width:none}#zb-efekt{z-index:2;pointer-events:none}'
            + '#zb-icerik{position:absolute;inset:0;z-index:1;box-sizing:border-box;padding:10px min(440px,41%) 10px 14px}'
            + '.zb-oyun{position:relative;height:100%;display:flex;flex-direction:column;gap:6px;min-height:0}'
            + '.zb-ust{flex:none;position:relative;z-index:70;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:4px 10px;border-radius:12px;background:rgba(5,9,8,.72)}'
            + '.zb-say{display:flex;flex-direction:column;align-items:center;min-width:76px;line-height:1}.zb-say b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(44px,6vw,68px);font-weight:800;font-variant-numeric:tabular-nums}.zb-say span{font-size:13px;font-weight:800;letter-spacing:.08em}.zb-say.z b,.zb-say.z span{color:#9BEA5A}.zb-say.s b,.zb-say.s span{color:#7CCBFF}'
            + '.zb-cubuk{height:18px;border-radius:9px;background:#3A7FB8;overflow:hidden}.zb-cubuk i{display:block;height:100%;background:#7FD63F;transition:width .5s}'
            + '.zb-bilgi{display:flex;flex-wrap:wrap;gap:2px 14px;margin-top:6px;font-size:clamp(13px,1.45vw,17px);font-weight:700;color:#DCE6D6;align-items:baseline}.zb-bilgi b{font-family:"Barlow Condensed",sans-serif;font-size:clamp(22px,2.6vw,32px);font-weight:800;color:#FFC24B}.zb-kl{color:#FFB199}'
            + '.zb-kalabalik{flex:1;min-height:0;position:relative}#zb-barikat{position:absolute;z-index:50;pointer-events:none;display:block;max-width:none}.zb-npc{position:absolute;display:block;pointer-events:none;transition:left .36s ease-in,top .36s ease-in,opacity .2s}.zb-npc .zb-svg{height:100%}.zb-npc .zb-spr.z{display:block}.zb-npc .zb-spr.n{display:none}#zb-barikat.yikil{transition:transform 1.4s cubic-bezier(.5,0,.9,.5),opacity 1.4s;transform:translateY(60%) rotate(2deg);opacity:0}.zb-kalabalik.sars{animation:zb-sars .4s}.zb-kalabalik.gecis .zb-kisi{transition:left 1s ease-in-out,top 1s ease-in-out,width .5s,height .5s}'
            + '.zb-kisi{position:absolute;min-width:0;min-height:44px;padding:0;border:0;background:transparent;color:#F2F6EE;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:1px}'
            + '.zb-kafa{position:relative;flex:1;min-height:0;width:100%;display:flex;align-items:flex-end;justify-content:center}.zb-svg{position:relative;display:block;height:100%;aspect-ratio:26/36;max-width:100%;filter:drop-shadow(0 3px 0 rgba(0,0,0,.45))}.zb-spr{position:absolute;inset:0;display:block;background-size:200% 100%;background-repeat:no-repeat;image-rendering:pixelated}.zb-spr.z{display:none}.zombi>.zb-svg .zb-spr.z,.zombi .zb-kafa .zb-spr.z{display:block}.zombi>.zb-svg .zb-spr.n,.zombi .zb-kafa .zb-spr.n{display:none}'
            + '.zb-ad{flex:none;max-width:100%;font-size:var(--ad,13px);font-weight:800;line-height:1.15;padding:1px 6px;border-radius:7px;background:rgba(8,12,12,.78);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zb-kisi.zombi .zb-ad{color:#BDF58C}'
            + '.zb-tik:empty{display:none}.zb-kisi.atti .zb-ad:before{content:"✓ ";color:#FFC24B}'
            + '.zb-sira{display:none;position:absolute;top:-2px;left:50%;transform:translateX(-50%);padding:1px 8px;border-radius:6px;background:#FFC24B;color:#1A1000;font-style:normal;font-size:12px;font-weight:800;z-index:2}.zb-kisi.aktif .zb-sira{display:block}.zb-kisi.aktif .zb-ad{background:#FFC24B;color:#1A1000}.zb-kisi.aktif .zb-svg{filter:drop-shadow(0 0 7px #FFC24B)}'
            + '.zb-duyuru{position:absolute;left:0;right:0;z-index:95;text-align:center;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(22px,3vw,38px);line-height:1.05;padding:6px 12px;border-radius:10px;background:rgba(6,10,10,.88);color:#fff;opacity:0;pointer-events:none;transform:scale(.94);transition:opacity .12s,transform .12s}.zb-duyuru.ac{opacity:1;transform:none}.zb-duyuru.iyi{color:#FFD86B}.zb-duyuru.kotu{color:#9BEA5A}'
            + '.zb-ok{position:absolute;z-index:90;width:44px;height:5px;margin:-2px 0 0 -22px;background:#FFE9B0;border-radius:2px;transform-origin:center;pointer-events:none}'
            + '.zb-yan{position:absolute;z-index:70;left:100%;top:0;margin-left:16px;width:min(390px,56vw);box-sizing:border-box;padding:8px 10px;border-radius:12px;background:rgba(5,9,8,.72);display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center}.zb-yan-hedef{flex:none;width:112px}.zb-yan-hedef svg{display:block;width:100%}.zb-yan-hedef .m{fill:#2F7FD6}.zb-yan-hedef .k{fill:#E23B2E}.zb-yan-hedef .s{fill:#F5D32A}.zb-yan-hedef[data-esik="7"] .m,.zb-yan-hedef[data-esik="9"] .m,.zb-yan-hedef[data-esik="9"] .k{fill:#2A3430}'
            + '.zb-yan-yazi{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.zb-yan-yazi small{font-size:13px;font-weight:800;letter-spacing:.1em;color:#C9D4C4}.zb-yan-yazi b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(34px,4.4vw,56px);font-weight:800;line-height:1;color:#FFC24B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zb-yan-yazi span{font-size:clamp(15px,1.5vw,19px);font-weight:800;line-height:1.25}.zb-sira-hud{display:none}'
            + '.zb-arac{display:flex;flex-wrap:wrap;gap:6px;width:100%}.zb-kucuk{min-width:44px;height:44px;border-radius:22px;border:1px solid #3B4A44;background:#17211E;color:#F2F6EE;font:inherit;font-weight:800;cursor:pointer}.zb-kucuk[hidden]{display:none}.zb-kucuk.genis{padding:0 14px;font-size:13px}'
            + '.zb-son{height:100%;overflow-y:auto;display:flex;flex-direction:column;justify-content:flex-start;gap:8px;box-sizing:border-box;padding:10px 14px;border-radius:14px;background:rgba(5,9,8,.68)}.zb-son-kal{flex:none;display:flex;flex-wrap:wrap;gap:2px 6px;padding-top:4px}.zb-son-kisi{display:block;height:58px}.zb-son-kisi .zb-svg{height:100%}.zb-son-kisi.zombi .zb-spr.z{display:block}.zb-son-kisi.zombi .zb-spr.n{display:none}.zb-et{font-size:clamp(13px,1.5vw,17px);font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#DCE6D6}.zb-son h2{margin:0;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(44px,6vw,80px);line-height:.92}.zb-son.kazandi h2{color:#FFD86B}.zb-son.kaybetti h2{color:#9BEA5A}.zb-sonuc{margin:0;font-size:clamp(20px,2.6vw,32px);font-weight:700}.zb-sonuc b{font-family:"Barlow Condensed",sans-serif;font-size:1.3em}.zb-cumle{margin:0;font-size:clamp(17px,2vw,24px);font-weight:700;color:#DCE6D6}'
            + '.zb-adlar{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:12px;background:rgba(8,12,12,.72)}.zb-adlar small{font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#B9C6B3}.zb-adlar span{font-size:clamp(14px,1.45vw,18px);font-weight:700;line-height:1.4}.zb-buyuk{flex:none;align-self:flex-start;min-height:60px;padding:0 30px;border-radius:30px;border:0;background:#FFC24B;color:#1A1000;font:inherit;font-size:18px;font-weight:800;cursor:pointer}'
            + '.zb-ozel{position:absolute;inset:0;z-index:200;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:clamp(4px,1.4vh,14px);padding:12px;background:radial-gradient(circle,rgba(42,15,58,.88),rgba(5,3,10,.9) 70%);cursor:pointer;animation:zb-oz-gel .45s ease}'
            + '.zb-oz-ust{font-size:clamp(14px,2vw,24px);font-weight:900;letter-spacing:.3em;color:#E3B6FF}.zb-oz-ik{font-size:clamp(64px,13vw,150px);line-height:1}.zb-oz-ad{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(48px,9vw,120px);font-weight:800;line-height:.95;color:#fff;text-shadow:0 0 24px #B26BFF}'
            + '.zb-oz-gorev{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(26px,4.6vw,60px);font-weight:800;line-height:1.05;color:#FFE066;max-width:95%}.zb-oz-kolay{display:flex;align-items:center;gap:10px;font-size:clamp(17px,2.4vw,30px);font-weight:800;padding:6px 18px;border-radius:30px;background:rgba(255,255,255,.1)}.zb-oz-kolay i{width:1.3em;height:1.3em;border-radius:50%;background:#2F7FD6;box-shadow:0 0 0 4px rgba(255,255,255,.2)}.zb-oz-alt{font-size:13px;color:#B9B2C9}'
            + '@keyframes zb-oz-gel{from{opacity:0;transform:scale(1.12)}}@media(prefers-reduced-motion:no-preference){.zb-oz-ik{animation:zb-zipla 1s ease-in-out infinite}}'
            + '.zb-kisi.kasabali{cursor:default}.zb-kisi.kasabali .zb-ad{opacity:.6;font-weight:700}'
            + '.zb-sahne button:focus-visible{outline:3px solid #FFC24B;outline-offset:2px}'
            + '@media(prefers-reduced-motion:no-preference){.zb-spr{animation:zb-kare 1.3s steps(2,jump-end) infinite}.zombi .zb-spr{animation-duration:.7s}.zb-son.kazandi .zb-son-kisi:not(.zombi) .zb-svg{animation:zb-zipla .8s ease-in-out infinite;animation-delay:calc(var(--g) * -.11s)}@keyframes zb-kare{from{background-position:0 0}to{background-position:200% 0}}.zb-kisi.zombi .zb-svg{animation:zb-sal 1.5s ease-in-out infinite;transform-origin:50% 100%}.zb-kisi.isirildi .zb-svg{animation:zb-isir .9s}.zb-kisi.kurtuldu .zb-svg{animation:zb-kurtul .9s}.zb-kisi.aktif:not(.zombi) .zb-svg{animation:zb-zipla .9s ease-in-out infinite}@keyframes zb-sal{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}@keyframes zb-zipla{0%,100%{transform:none}50%{transform:translateY(-6%)}}@keyframes zb-isir{0%{transform:scale(1)}20%{transform:scale(1.28) rotate(-8deg)}40%{transform:scale(1.1) rotate(8deg)}60%{transform:scale(1.22) rotate(-5deg)}100%{transform:none}}@keyframes zb-kurtul{0%{transform:scale(.8)}35%{transform:scale(1.35) translateY(-12%)}100%{transform:none}}@keyframes zb-sars{20%{transform:translateX(9px)}45%{transform:translateX(-8px)}70%{transform:translateX(5px)}}}'
            + '.zb-kisi.kurtuldu .zb-svg{filter:drop-shadow(0 0 14px #FFD86B)}.zb-kisi.isirildi .zb-svg{filter:drop-shadow(0 0 14px #9BEA5A)}'
            + '@media(max-width:860px){#zb-icerik{padding:8px 8px 8px}.zb-say{min-width:58px}.zb-sira-hud{display:inline}.zb-yan{position:relative;left:auto;margin:0;width:100%;flex:none;gap:6px 10px;padding:4px 8px}.zb-yan-hedef{width:52px}.zb-yan-yazi small,.zb-yan-yazi b{display:none}.zb-yan-yazi span{font-size:14px}.zb-arac{width:auto}}';
        document.head.appendChild(st);
    }
    window.zbSahneKur = zbSahneKur;
    window.zbGuncelle = guncelle;
    window.zbSeri = zbSeri;
    window.zbAnlik = () => JSON.parse(JSON.stringify(durum()));
    window.zbGeriYukle = (k) => { if (!k) return; zamanTemizle(); duyuruKapa(); ozelKapa(); _ozelGosterilen = ''; _kilit = false; _st = k; _kn = konum(); kaydet(); if ($('zb-icerik')) { if (k.faz === 'oyun' && !$('zb-oyun')) $('zb-icerik').innerHTML = ''; guncelle(); } };
    window.zbSporcu = (g, ad) => (durum().kurtardi || {})[g + '|' + ad] || 0;
    window.zbAyarUygula = () => { if ($('zb-icerik')) guncelle(); };
    window.zbFinalZorla = zbFinalZorla;
    window.zbDurum = durum;
    window._zbIc = { esikOf, panzehirSay, baslangicSay, isirikSay, kazandi, adimHesapla, ISIRIK_ARALIK };
})();
