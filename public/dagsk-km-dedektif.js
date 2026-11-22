/* ================================================================================================
   🕵️ DEDEKTİF OKÇULAR — Karışık Sınıf › Oyunlar teması 'dedektif' (v444, 2026-11-22).
   Kullanıcı "oyunlar çok kötü, sadece 3 oyun oynuyoruz" dedi; sunucu kaydında Ortak Canavar + Gizli Kelime (tahmin)
   öne çıktı. 6 fikirlik sayfadan Dedektif + Yanardağ seçildi, "görseller iyi olsun" + "zorluk seviyeleri (bazıları
   zeki, bazıları küçük)" + "dedektifteki yazılar büyük olsun" istendi. Taslak: claude.ai/artifact/NccwUsq6iJ9v9nFJfTqBag
   OYUN: 4–6 çizilmiş şüpheli polis sırasında (şapka/gözlük/bıyık/boy/atkı/çanta/palto = ipucu özellikleri). Eşiği geçen
   ok mantar panoya bir ipucu kartı açar; 10/X "altın ipucu": Komiser Baykuş bir masumu eler. Sınıf "bu değil" der → koç
   şüpheliye dokunup çizer; hazır olunca 🫵 Suçla. Yanlış suçlama 2 seri kaybettirir. İstasyon saati (7–10 seri) dolunca
   tren kalkar, hırsız kaçar (Rövanş). 5 vaka zinciri; final: herkesin adı (asla son atan kahraman değil).
   ZORLUK: Kolay 4 şüpheli/10 seri/5+/uymayanlar kendiliğinden elenir · Normal 6/8/7+ · Zor 6/7/8+ "…DEĞİLDİ" ipuçları.
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js, _skorKaydetCekirdek). Bu dosya yalnız oyun durumu + çizim:
     ddkSahneKur(panel) · ddkGuncelle() · ddkSeri(s, i, kaydedilecek, done) · ddkAnlik() · ddkGeriYukle(k) · ddkSporcu(g, ad)
   DURUM 'dag_km_dedektif_<konum>' (km-ortak ile her cihaza gider), GÜNE ÖZEL; 12 saat kuralı KM_OYUN_SIFIR_ONEK'te.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const W = 1280, H = 720, AYAK = 640;
    const DF = '"Lilita One","Baloo 2","Arial Rounded MT Bold","Trebuchet MS",sans-serif';
    const TF = '"Special Elite","Courier New",monospace';
    const rnd = (a, b) => a + Math.random() * (b - a);
    const sec = (a) => a[Math.floor(Math.random() * a.length)];
    const karistir = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function kacis(t) { return typeof esc === 'function' ? esc(t) : String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    function aktifSporcu() { const l = liste(); const i = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0; return l[i] || null; }
    function adlarHTML(l, st) {
        const rz = (st && st.vakaRozet) || {};
        return '<div class="ddk-adlar">' + l.map((a) => { const k = Object.keys(rz).find((x) => x.slice(x.indexOf('|') + 1) === a), ik = k ? rz[k].map((id) => ROZET[id] ? ROZET[id][0] : '').join('') : ''; return '<span>' + kacis(ilkAd(a)) + (ik ? ' <i>' + ik + '</i>' : '') + '</span>'; }).join('') + '</div>';
    }
    function siraliAdlar(a) { return (a || []).slice().sort((x, y) => String(x).localeCompare(String(y), 'tr')); }

    /* ---------------- SES ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1' && localStorage.getItem('dag_ddk_ses') !== '0'; } catch (e) { return true; } }
    function ses(t) {
        if (!sesAcik()) return;
        try {
            AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const n = AC.currentTime;
            const ton = (f, d, tip, v, f2, g0) => { const o = AC.createOscillator(), g = AC.createGain(), b = n + (g0 || 0); o.type = tip || 'sine'; o.frequency.setValueAtTime(f, b); if (f2) o.frequency.exponentialRampToValueAtTime(f2, b + d); g.gain.setValueAtTime(v || .15, b); g.gain.exponentialRampToValueAtTime(.001, b + d); o.connect(g).connect(AC.destination); o.start(b); o.stop(b + d + .02); };
            const gur = (d, v, fr) => { const L = Math.floor(AC.sampleRate * d), bf = AC.createBuffer(1, L, AC.sampleRate), c = bf.getChannelData(0); for (let i = 0; i < L; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / L); const s = AC.createBufferSource(); s.buffer = bf; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = fr || 1200; const g = AC.createGain(); g.gain.value = v || .3; s.connect(f).connect(g).connect(AC.destination); s.start(); };
            ({
                cek: () => ton(900, .12, 'triangle', .06, 1600),
                vur: () => { gur(.15, .3, 1500); ton(500, .12, 'square', .06, 900); },
                kritik: () => { [660, 880, 1320].forEach((f, i) => ton(f, .18, 'triangle', .11, null, i * .07)); },
                iska: () => ton(300, .25, 'sine', .08, 150),
                kart: () => { gur(.08, .25, 3000); ton(1200, .06, 'square', .04); },
                tik: () => ton(1500, .03, 'square', .05),
                dudu: () => { ton(440, .5, 'sawtooth', .08, 430); ton(554, .5, 'sawtooth', .06, 550, .02); },
                davul: () => { for (let i = 0; i < 10; i++) ton(90, .08, 'square', .08, 60, i * .1); },
                dogru: () => [523, 659, 784, 1046, 1318].forEach((f, i) => ton(f, .35, 'triangle', .12, null, i * .1)),
                yanlis: () => { ton(300, .3, 'sawtooth', .1, 200); ton(200, .4, 'sawtooth', .1, 120, .25); },
                sec: () => ton(880, .07, 'square', .05)
            })[t]();
        } catch (e) { }
    }

    /* ---------------- VERİ ---------------- */
    const DZ = {
        kolay: { ad: '🐣 Kolay', d: '4 şüpheli · 10 seri · 5+ ipucu · uymayanlar kendiliğinden elenir', n: 4, saat: 10, esik: 5, oto: true, ters: false },
        normal: { ad: '🦊 Normal', d: '6 şüpheli · 8 seri · 7+ ipucu', n: 6, saat: 8, esik: 7, oto: false, ters: false },
        zor: { ad: '🧠 Zor', d: '6 şüpheli · 7 seri · 8+ ipucu · "DEĞİLDİ" ipuçları', n: 6, saat: 7, esik: 8, oto: false, ters: true }
    };
    const PALTO = { kahve: ['#8a5a35', 'kahverengi'], gri: ['#6b7484', 'gri'], yesil: ['#3f7d4e', 'yeşil'], mor: ['#6d4c9a', 'mor'] };
    const SAPKA = { kirmizi: '#d23a32', mavi: '#2f6fd6', silindir: '#1b1b22' };
    const ATKI = { sari: '#f2c230', yesil: '#3fbf6a' };
    const TEN = ['#f6d2b4', '#e8b48e', '#c98d63', '#8d5a3b', '#f1c7a2'];
    const SAC = ['#2a1c14', '#5a3a22', '#a8742c', '#d8b56a', '#1a1a1a', '#8a3a1c'];
    // v446 (kullanıcı: "dedektif popüler ve mükemmel oldu ama hep aynı dizilimde gidiyor"): 5 sabit vaka yerine 18 vakalık havuz,
    // her vaka başında 3 zarftan biri seçilir; her vakanın kendi olay yeri (sahne) ve şüpheli dizilimi var.
    const SAHNE = {
        karakol: { ad: 'Karakol', diz: 'sira' }, muze: { ad: 'Müze', diz: 'daginik' }, pastane: { ad: 'Pastane', diz: 'iki' },
        hayvanat: { ad: 'Hayvanat Bahçesi', diz: 'daginik' }, park: { ad: 'Park', diz: 'daginik' }, uzay: { ad: 'Uzay Kampı', diz: 'sira' },
        kale: { ad: 'Kale', diz: 'merdiven' }, gar: { ad: 'Tren Garı', diz: 'merdiven' }, otel: { ad: 'Otel', diz: 'iki' }, gemi: { ad: 'Korsan Gemisi', diz: 'iki' }
    };
    const SAHNE_IKON = { karakol: '🚓', muze: '🏛️', pastane: '🧁', hayvanat: '🦒', park: '🌳', uzay: '🚀', kale: '🏰', gar: '🚉', otel: '🏨', gemi: '🏴‍☠️' };
    const KOV_TIP = { gar: 'tren', gemi: 'kayik', hayvanat: 'kayik', park: 'kayik' }; // diğerleri: çatı
    const VAKALAR = [
        { id: 'altinok', ad: 'Kayıp Altın Ok', yer: 'Şehir Müzesi', sahne: 'muze', nesne: 'altinok', hikaye: 'Şehir müzesindeki Altın Ok gece yarısı vitrininden kayboldu! Bekçi {n} ziyaretçinin heykellerin arasında dolaştığını gördü.', anlat: 'Komiser Baykuş: "Okçularım, iyi atış = iyi ipucu. Hepinize güveniyorum!"' },
        { id: 'pasta', ad: 'Kraliyet Pastası', yer: 'Saray Pastanesi', sahne: 'pastane', nesne: 'pasta', hikaye: 'Kralın doğum günü pastası pastaneden çalındı! Pastacı tezgâhın önünde ve arkasında {n} kişi hatırlıyor.', anlat: 'Komiser Baykuş: "Pasta kokusu hâlâ havada… Hırsız uzakta değil!"' },
        { id: 'papagan', ad: 'Konuşan Papağan', yer: 'Hayvanat Bahçesi', sahne: 'hayvanat', nesne: 'papagan', hikaye: 'Hayvanat bahçesinin ünlü konuşan papağanı Pırpır kayıp! Ağaçların arasında {n} ziyaretçi görülmüş.', anlat: 'Komiser Baykuş: "Pırpır kaçırılırken bağırmış: İMDAT! Hadi bulalım!"' },
        { id: 'kupa', ad: 'Okçuluk Kupası', yer: 'Karakol', sahne: 'karakol', nesne: 'kupa', hikaye: 'Turnuva kupası salondan kayboldu! Yarın tören var. {n} şüpheli karakolda sıraya dizildi.', anlat: 'Komiser Baykuş: "Kupayı bulamazsak tören olmaz!"' },
        { id: 'tac', ad: 'Kralın Tacı', yer: 'Kale', sahne: 'kale', nesne: 'tac', hikaye: 'Kralın tacı çalındı! Kale merdivenlerinde {n} şüpheli yakalandı ama hangisi gerçek hırsız?', anlat: 'Komiser Baykuş: "Bu vakayı çözen okçular kraliyet dedektifi olacak!"' },
        { id: 'yumurta', ad: 'Dinozor Yumurtası', yer: 'Doğa Müzesi', sahne: 'muze', nesne: 'yumurta', hikaye: 'Müzedeki 70 milyon yıllık dinozor yumurtası kayıp! Kamera {n} ziyaretçiyi yakaladı.', anlat: 'Komiser Baykuş: "Ya yumurta çatlarsa? Acele edelim!"' },
        { id: 'dondurma', ad: 'Dondurma Arabası', yer: 'Sahil Parkı', sahne: 'park', nesne: 'dondurma', hikaye: 'Parkın dondurma arabası bütün dondurmalarıyla kayboldu! Parkta {n} kişi geziniyordu.', anlat: 'Komiser Baykuş: "Dondurmalar erimeden bulmalıyız!"' },
        { id: 'roket', ad: 'Kayıp Roket', yer: 'Uzay Kampı', sahne: 'uzay', nesne: 'roket', hikaye: 'Uzay kampının fırlatmaya hazır roketi hangardan kayboldu! {n} astronot adayı sorguda.', anlat: 'Komiser Baykuş: "Geri sayım başlamadan hırsızı bulalım!"' },
        { id: 'yay', ad: 'Sihirli Yay', yer: 'Kale Kulesi', sahne: 'kale', nesne: 'yay', hikaye: 'Efsanevi okçunun sihirli yayı kuleden çalındı! Kale merdiveninde {n} kişi görüldü.', anlat: 'Komiser Baykuş: "Bu yay ancak gerçek okçuların elinde parlar!"' },
        { id: 'madalya', ad: 'Şampiyon Madalyası', yer: 'Tren Garı', sahne: 'gar', nesne: 'madalya', hikaye: 'Şampiyonun altın madalyası garda çantasından kayboldu! Peron merdiveninde {n} yolcu var.', anlat: 'Komiser Baykuş: "Tren kalkmadan madalyayı geri alalım!"' },
        { id: 'elmas', ad: 'Mavi Elmas', yer: 'Lüks Otel', sahne: 'otel', nesne: 'elmas', hikaye: 'Otelin kasasındaki Mavi Elmas kayıp! Balkonda ve lobide {n} misafir vardı.', anlat: 'Komiser Baykuş: "Elmas gibi parlak gözlerinizi açın!"' },
        { id: 'anahtar', ad: 'Hazine Anahtarı', yer: 'Korsan Gemisi', sahne: 'gemi', nesne: 'anahtar', hikaye: 'Kaptanın hazine sandığının anahtarı çalındı! Güvertede {n} tayfa var.', anlat: 'Komiser Baykuş: "Yo-ho-ho! Hırsız gemiden inmeden yakalayalım!"' },
        { id: 'saat', ad: 'Kule Saatinin Çarkı', yer: 'Tren Garı', sahne: 'gar', nesne: 'saat', hikaye: 'Garın büyük saatinin çarkı söküldü, trenler karıştı! Merdivende {n} kişi bekliyordu.', anlat: 'Komiser Baykuş: "Saat durdu ama biz durmayız!"' },
        { id: 'kitap', ad: 'Büyü Kitabı', yer: 'Eski Kütüphane', sahne: 'muze', nesne: 'kitap', hikaye: 'Kütüphanenin en eski büyü kitabı rafından kayboldu! Rafların arasında {n} okuyucu vardı.', anlat: 'Komiser Baykuş: "Sayfalarında ne yazdığını kimse bilmiyor…"' },
        { id: 'kedi', ad: 'Kayıp Kedi Pamuk', yer: 'Lüks Otel', sahne: 'otel', nesne: 'kedi', hikaye: 'Otel sahibinin kedisi Pamuk kaçırıldı! Balkonda ve lobide {n} misafir sorguda.', anlat: 'Komiser Baykuş: "Miyav sesine kulak verin!"' },
        { id: 'papagan2', ad: 'Korsanın Papağanı', yer: 'Korsan Gemisi', sahne: 'gemi', nesne: 'papagan', hikaye: 'Kaptan Kanca\'nın papağanı ortadan kayboldu! Güvertede {n} tayfa var.', anlat: 'Komiser Baykuş: "Papağan konuşursa hırsızı söyler!"' },
        { id: 'kurabiye', ad: 'Çikolatalı Kurabiyeler', yer: 'Mahalle Pastanesi', sahne: 'pastane', nesne: 'pasta', hikaye: 'Pastanenin bütün çikolatalı kurabiyeleri bir gecede kayboldu! {n} müşteri şüpheli.', anlat: 'Komiser Baykuş: "Kırıntıları takip edin!"' },
        { id: 'uzaytasi', ad: 'Uzay Taşı', yer: 'Uzay Kampı', sahne: 'uzay', nesne: 'elmas', hikaye: 'Aydan getirilen parlak uzay taşı vitrinden kayboldu! {n} astronot adayı sırada.', anlat: 'Komiser Baykuş: "Bu taş karanlıkta parlıyor, iz bırakmış olmalı!"' }
    ];
    // 🦊 Haritanın 5 parçası tamamlanınca gelen büyük vaka
    const TILKI_VAKA = { id: 'tilki', ad: 'Gölge Tilki', yer: 'Tilki\'nin Kalesi', sahne: 'kale', nesne: 'harita', hikaye: 'Haritanın 5 parçası tamam! Bütün hırsızların patronu Gölge Tilki kılık değiştirip {n} kişinin arasına saklandı. Bu sefer kaçarsa başka şehre gider!', anlat: 'Komiser Baykuş: "Yıllardır bu anı bekliyordum. Hep birlikte, okçularım!"' };
    function vakaBul(id) { return id === 'tilki' ? TILKI_VAKA : (VAKALAR.find((v) => v.id === id) || VAKALAR[0]); }
    // 🏅 Rozetler (attığı puana göre) ve rütbe (bütün günlerde açtığı ipucu sayısı) — kalıcı
    const ROZET = { iz: ['🔍', 'İz Sürücü'], altin: ['⭐', 'Altın Göz'], uclu: ['🎯', 'Üçü de İyi'], gelisen: ['📈', 'Gelişen Dedektif'], isik: ['💡', 'Işık Getiren'], atla: ['🏃', 'Çatı Koşucusu'] };
    const RUTBE = [[0, '🐣', 'Çaylak'], [1, '🔎', 'Dedektif'], [5, '🕵️', 'Müfettiş'], [12, '🎖️', 'Baş Müfettiş'], [25, '👑', 'Kraliyet Dedektifi']];
    function rutbeBul(n) { let r = RUTBE[0]; RUTBE.forEach((x) => { if (n >= x[0]) r = x; }); return r; }
    const OZ = [
        { k: 'sapka', v: ['kirmizi', 'mavi', 'silindir', null] }, { k: 'gozluk', v: [true, false] }, { k: 'biyik', v: [true, false] },
        { k: 'boy', v: ['uzun', 'kisa'] }, { k: 'atki', v: ['sari', 'yesil', null] }, { k: 'canta', v: [true, false] }, { k: 'palto', v: ['kahve', 'gri', 'yesil', 'mor'] }
    ];
    function eslesir(o, c) { return c.not ? o[c.k] !== c.v : o[c.k] === c.v; }
    function ipucuMetni(c) {
        const v = c.v;
        if (c.not) {
            const RN = { kirmizi: 'KIRMIZI', mavi: 'MAVİ', sari: 'SARI', yesil: 'YEŞİL' };
            if (c.k === 'sapka') return v === null ? 'Şapka TAKIYORDU' : v === 'silindir' ? 'Silindir şapkası YOKTU' : 'Şapkası ' + RN[v] + ' DEĞİLDİ';
            if (c.k === 'atki') return v === null ? 'Atkı TAKIYORDU' : 'Atkısı ' + RN[v] + ' DEĞİLDİ';
            if (c.k === 'palto') return 'Paltosu ' + PALTO[v][1].toUpperCase() + ' DEĞİLDİ';
        }
        switch (c.k) {
            case 'sapka': return v === 'silindir' ? 'Uzun siyah silindir şapkası vardı' : v ? 'Şapkası ' + (v === 'kirmizi' ? 'KIRMIZI' : 'MAVİ') + 'ydı' : 'Şapkası YOKTU';
            case 'gozluk': return v ? 'GÖZLÜK takıyordu' : 'Gözlüğü YOKTU';
            case 'biyik': return v ? 'BIYIKLIYDI' : 'Bıyığı YOKTU';
            case 'boy': return v === 'uzun' ? 'UZUN boyluydu' : 'KISA boyluydu';
            case 'atki': return v ? 'Atkısı ' + (v === 'sari' ? 'SARI' : 'YEŞİL') + 'ydı' : 'Atkısı YOKTU';
            case 'canta': return v ? 'Elinde ÇANTA vardı' : 'Çantası YOKTU';
            case 'palto': return 'Paltosu ' + PALTO[v][1].toUpperCase() + 'di';
        }
        return '';
    }
    // Her vakada ipuçları hırsızı TEK kişiye indirir (3–5 ipucu; Kolay'da 2–4); ilk ipucu en az yarısını ayakta bırakır.
    function vakaUret(n, ters) {
        for (let deneme = 0; deneme < 4000; deneme++) {
            const s = []; for (let i = 0; i < n; i++) { const o = {}; OZ.forEach((z) => o[z.k] = sec(z.v)); o.ten = sec(TEN); o.sac = sec(SAC); o.no = i + 1; o.faz = Math.random() * 6; s.push(o); }
            const h = Math.floor(Math.random() * n), hr = s[h];
            const imza = (o) => OZ.map((z) => String(o[z.k])).join('|'); if (new Set(s.map(imza)).size < n) continue;
            let ad = OZ.map((z) => ({ k: z.k, v: hr[z.k] }));
            if (ters) OZ.forEach((z) => { if (z.k !== 'sapka' && z.k !== 'atki' && z.k !== 'palto') return; const dig = z.v.filter((v) => v !== hr[z.k]); ad.push({ k: z.k, v: sec(dig), not: true }); ad.push({ k: z.k, v: sec(dig), not: true }); });
            ad = karistir(ad);
            let kalan = s.map((_, i) => i); const ipucu = [];
            for (const c of ad) { if (kalan.length === 1) break; if (ipucu.some((p) => p.k === c.k && p.v === c.v && !!p.not === !!c.not)) continue; const yeni = kalan.filter((i) => eslesir(s[i], c)); if (yeni.length < kalan.length) { ipucu.push(c); kalan = yeni; } }
            if (kalan.length !== 1 || ipucu.length < (n <= 4 ? 2 : 3) || ipucu.length > 5) continue;
            if (ters && ipucu.filter((c) => c.not).length < 2) continue;
            if (s.filter((o) => eslesir(o, ipucu[0])).length < Math.ceil(n / 2)) continue;
            return { s, h, ipucu };
        }
        return null;
    }

    /* ---------------- DURUM ---------------- */
    let _st = null, _stHam = null, _stKonum = null;
    function anahtar() { return 'dag_km_dedektif_' + konum(); }
    function bosDurum(zor) { const st = { tarih: bugun(), zor: zor || 'normal', vaka: 0, faz: 'zarf', hepAtan: [], toplamOk: 0, katki: {}, sonTop: {} }; zarfHazirla(st); return st; }
    // 3 zarf: son 10 vakada açılmamışlardan, mümkünse 3 farklı olay yeri. Harita tamamsa zarf yok: Gölge Tilki.
    function zarfHazirla(st) {
        const K = kal();
        if ((K.parca || 0) >= 5) { st.vid = 'tilki'; vakaKur(st); st.faz = 'basla'; st.rovans = false; return; }
        const son = K.son || [], aday = karistir(VAKALAR.filter((v) => son.indexOf(v.id) === -1)), havuz = aday.length >= 3 ? aday : karistir(VAKALAR.slice());
        const z = []; for (const v of havuz) { if (z.length >= 3) break; if (!z.some((id) => vakaBul(id).sahne === v.sahne)) z.push(v.id); }
        for (const v of havuz) { if (z.length >= 3) break; if (z.indexOf(v.id) === -1) z.push(v.id); }
        st.zarflar = z; st.faz = 'zarf'; st.rovans = false;
    }
    function vakaSec(st, id) { const K = kal(); K.son = (K.son || []).filter((x) => x !== id).concat([id]).slice(-10); kalKaydet(); st.vid = id; vakaKur(st); st.faz = 'basla'; }
    function vakaKur(st) {
        const Z = DZ[st.zor] || DZ.normal, V = vakaBul(st.vid), til = V.id === 'tilki';
        st.n = til ? 6 : Z.n; st.maxSaat = Z.saat + (til ? 1 : 0); st.esik = st.esikEl || Z.esik; st.sahne = V.sahne;
        st.v = vakaUret(st.n, Z.ters); st.acik = 0; st.x = Array(st.n).fill(0); st.masum = Array(st.n).fill(0); st.saat = 0; st.sonuc = null; st.vakaAtan = []; st.vakaRozet = {};
        st.karanlik = false; st.kov = null; st.parcaKazandi = null;
        // 🦊 Hırsızın hamlesi: hangi seriden sonra ne yapacağı (Kolay: yalnız yer değiştirir)
        const tipler = st.zor === 'kolay' ? ['yer'] : ['karanlik', 'yer', 'ruzgar'], ilk = st.zor === 'kolay' ? 3 : 2;
        st.olaylar = [{ s: ilk, tip: sec(tipler) }];
        if (st.zor === 'zor' || (til && st.zor !== 'kolay')) st.olaylar.push({ s: ilk + 3, tip: sec(tipler.filter((t) => t !== st.olaylar[0].tip)) });
    }
    function durum() {
        const k = anahtar();
        if (_stKonum !== konum()) { _st = null; _stHam = null; _stKonum = konum(); }
        let ham = null; try { ham = localStorage.getItem(k); } catch (e) { }
        if (ham !== _stHam) { _stHam = ham; try { _st = ham ? JSON.parse(ham) : null; } catch (e) { _st = null; } }
        const bozuk = !_st || _st.tarih !== bugun() || (_st.faz === 'zarf' ? !(_st.zarflar || []).length : (!_st.vid || !_st.v || !_st.v.s));
        if (bozuk) { _st = bosDurum(_st && _st.zor); kaydet(); }
        return _st;
    }
    // Kalıcı (günler arası, 12 saat sıfırlamasından etkilenmez): harita parçaları, sezon, son vakalar, ipucu sayısı (rütbe), rozetler.
    let _kal = null, _kalHam = null, _kalKonum = null;
    function kalAnahtar() { return 'dag_km_ddkkalici_' + konum(); }
    function kal() {
        if (_kalKonum !== konum()) { _kal = null; _kalHam = null; _kalKonum = konum(); }
        let ham = null; try { ham = localStorage.getItem(kalAnahtar()); } catch (e) { }
        if (ham !== _kalHam) { _kalHam = ham; try { _kal = ham ? JSON.parse(ham) : null; } catch (e) { _kal = null; } }
        if (!_kal || typeof _kal !== 'object') _kal = { parca: 0, sezon: 1, son: [], ipucu: {}, rozet: {} };
        _kal.ipucu = _kal.ipucu || {}; _kal.rozet = _kal.rozet || {}; return _kal;
    }
    function kalKaydet() { try { _kalHam = JSON.stringify(_kal); localStorage.setItem(kalAnahtar(), _kalHam); } catch (e) { } }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }

    /* ---------------- ÇİZİM YARDIMCILARI ---------------- */
    function yaz(x, t, px, py, size, renk, o) { o = o || {}; x.save(); x.font = size + 'px ' + (o.font || DF); x.textAlign = o.al || 'center'; x.textBaseline = 'middle'; if (o.a != null) x.globalAlpha *= o.a; if (o.kontur !== false) { x.lineJoin = 'round'; x.lineWidth = o.kalin || Math.max(4, size / 7); x.strokeStyle = o.kontur || 'rgba(0,0,0,.75)'; x.strokeText(t, px, py); } x.fillStyle = renk; x.fillText(t, px, py); x.restore(); }
    function yuv(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
    function shade(hex, p) { const n = parseInt(hex.slice(1), 16); let r = (n >> 16) + p, g = (n >> 8 & 255) + p, b = (n & 255) + p; r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b)); return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1); }
    function lerp(a, b, t) { return a + (b - a) * t; }

    /* ---------------- EFEKTLER ---------------- */
    const FX = { p: [], f: [], a: [], shake: 0, flash: 0 };
    function fxParca(px, py, n, renk, hiz, boy) { hiz = hiz || 7; boy = boy || 6; for (let i = 0; i < n; i++) { const an = Math.random() * Math.PI * 2, v = rnd(.3, 1) * hiz; FX.p.push({ x: px, y: py, vx: Math.cos(an) * v, vy: Math.sin(an) * v - hiz * .3, l: 50 * rnd(.5, 1), m: 50, r: Array.isArray(renk) ? sec(renk) : renk, s: boy * rnd(.5, 1.3) }); } }
    function fxYazi(px, py, t, renk, boy, omur) { FX.f.push({ x: px, y: py, t, r: renk, s: boy || 56, l: omur || 70, m: omur || 70 }); }
    function fxOk(x0, y0, x1, y1, dur) { return new Promise((res) => FX.a.push({ x0, y0, x1, y1, t: 0, dur, res, yay: 180, iz: [] })); }
    function fxNokta(a, t) { const cx = (a.x0 + a.x1) / 2, cy = Math.min(a.y0, a.y1) - a.yay, u = 1 - t; return { x: u * u * a.x0 + 2 * u * t * cx + t * t * a.x1, y: u * u * a.y0 + 2 * u * t * cy + t * t * a.y1 }; }
    function fxGuncelle(dt) {
        const k = dt / 16.7;
        for (const p of FX.p) { p.x += p.vx * k; p.y += p.vy * k; p.vy += .25 * k; p.l -= k; } FX.p = FX.p.filter((p) => p.l > 0);
        for (const f of FX.f) { f.l -= k; f.y -= .8 * k; } FX.f = FX.f.filter((f) => f.l > 0);
        for (const a of FX.a) { a.t += dt / a.dur; a.iz.push(fxNokta(a, Math.min(1, a.t))); if (a.iz.length > 10) a.iz.shift(); if (a.t >= 1 && !a.bitti) { a.bitti = true; a.res(); } } FX.a = FX.a.filter((a) => !a.bitti);
        FX.shake *= Math.pow(.88, k); if (FX.shake < .3) FX.shake = 0; FX.flash *= Math.pow(.92, k); if (FX.flash < .01) FX.flash = 0;
    }
    function fxCiz(x) {
        for (const a of FX.a) {
            const t = Math.min(1, a.t), q = fxNokta(a, t), q2 = fxNokta(a, Math.max(0, t - .03)), an = Math.atan2(q.y - q2.y, q.x - q2.x);
            x.save(); x.globalCompositeOperation = 'lighter'; for (let i = 1; i < a.iz.length; i++) { x.strokeStyle = 'rgba(255,230,160,' + (i / a.iz.length * .5) + ')'; x.lineWidth = 4 * i / a.iz.length; x.beginPath(); x.moveTo(a.iz[i - 1].x, a.iz[i - 1].y); x.lineTo(a.iz[i].x, a.iz[i].y); x.stroke(); } x.restore();
            x.save(); x.translate(q.x, q.y); x.rotate(an); x.strokeStyle = '#e8d2a8'; x.lineWidth = 4; x.beginPath(); x.moveTo(-52, 0); x.lineTo(0, 0); x.stroke(); x.fillStyle = '#d9dde8'; x.beginPath(); x.moveTo(10, 0); x.lineTo(-6, -7); x.lineTo(-6, 7); x.closePath(); x.fill(); x.fillStyle = '#ff4f5e'; x.beginPath(); x.moveTo(-52, 0); x.lineTo(-64, -9); x.lineTo(-46, 0); x.lineTo(-64, 9); x.closePath(); x.fill(); x.restore();
        }
        for (const p of FX.p) { x.globalAlpha = Math.max(0, p.l / p.m); x.fillStyle = p.r; x.beginPath(); x.arc(p.x, p.y, p.s, 0, 7); x.fill(); } x.globalAlpha = 1;
        for (const f of FX.f) { const a = Math.min(1, f.l / (f.m * .4)), sk = 1 + Math.max(0, (f.l - f.m + 10) / 10) * .4; yaz(x, f.t, f.x, f.y, f.s * sk, f.r, { a }); }
    }

    /* ---------------- ŞÜPHELİ ÇİZİMİ ---------------- */
    const SIRA_X0 = 520, SIRA_GEN = 744; // şüpheliler sağda: sol alt köşe skor dock'una bırakıldı (Komiser masası)
    function SARA(st) { return SIRA_GEN / (st.n || 6); }
    function SX(st, i) { return poz(st, i).x; }
    // v446 dizilim (olay yerine göre): sira = polis sırası · merdiven = basamaklarda yükselen · iki = arka sıra (balkon/tezgâh arkası) + ön sıra · daginik = önde/arkada zikzak.
    function poz(st, i) {
        const d = (SAHNE[st.sahne] || SAHNE.karakol).diz, n = st.n || 6;
        if (d === 'merdiven') { const g = SIRA_GEN / n; return { x: SIRA_X0 + g * (i + .5), ayak: AYAK - i * (110 / Math.max(1, n - 1)), s: .78 }; }
        if (d === 'iki') { const arkaN = Math.ceil(n / 2), on = i >= arkaN, k = on ? n - arkaN : arkaN, j = on ? i - arkaN : i, g = SIRA_GEN / k; return { x: SIRA_X0 + g * (j + .5) + (on ? -g / 5 : g / 5), ayak: on ? AYAK : 440, s: on ? .72 : .6, arka: !on }; }
        if (d === 'daginik') { const g = SIRA_GEN / n, arka = i % 2 === 1; return { x: SIRA_X0 + g * (i + .5), ayak: arka ? 560 : AYAK, s: arka ? .74 : .9, arka: arka }; }
        return { x: SIRA_X0 + SARA(st) * (i + .5), ayak: AYAK, s: 1 };
    }
    // 🔀 yer değiştirme animasyonu: numarası aynı şüpheli eski yerinden yenisine kayar
    let _yerAnim = null;
    function pozA(st, i) {
        const p = poz(st, i); if (!_yerAnim) return p;
        const u = Math.min(1, (performance.now() - _yerAnim.t) / 1100), e = _yerAnim.eski[st.v.s[i].no]; if (u >= 1) { _yerAnim = null; return p; }
        if (!e) return p; const k = u * u * (3 - 2 * u);
        return { x: lerp(e.x, p.x, k), ayak: lerp(e.ayak, p.ayak, k) - Math.sin(k * Math.PI) * 60, s: lerp(e.s, p.s, k), arka: p.arka };
    }
    function boyH(o) { return o.boy === 'uzun' ? 330 : 258; }
    function supheliY(st, i, oran) { const p = poz(st, i); return p.ayak - boyH(st.v.s[i]) * p.s * (oran == null ? .7 : oran); }
    function supheliCiz(x, o, cx, t, durumu) {
        const uzun = o.boy === 'uzun', boyH = uzun ? 330 : 258, nef = Math.sin(t / 700 + o.faz) * 2.2;
        const ust = AYAK - boyH, govdeUst = ust + 86, govdeAlt = AYAK - 70, omuz = uzun ? 46 : 42;
        x.save();
        x.fillStyle = 'rgba(0,0,0,.45)'; x.beginPath(); x.ellipse(cx, AYAK + 6, 54, 10, 0, 0, 7); x.fill();
        x.fillStyle = '#22202a'; yuv(x, cx - 24, govdeAlt - 6, 18, 76, 7); x.fill(); yuv(x, cx + 6, govdeAlt - 6, 18, 76, 7); x.fill();
        x.fillStyle = '#111'; yuv(x, cx - 30, AYAK - 8, 26, 12, 5); x.fill(); yuv(x, cx + 4, AYAK - 8, 26, 12, 5); x.fill();
        const pr = PALTO[o.palto][0]; const pg = x.createLinearGradient(cx - omuz, 0, cx + omuz, 0); pg.addColorStop(0, pr); pg.addColorStop(.5, shade(pr, 18)); pg.addColorStop(1, shade(pr, -25));
        x.fillStyle = pg; x.beginPath(); x.moveTo(cx - omuz + 6, govdeUst + nef); x.quadraticCurveTo(cx, govdeUst - 8 + nef, cx + omuz - 6, govdeUst + nef); x.lineTo(cx + omuz + 6, govdeAlt + 14); x.lineTo(cx - omuz - 6, govdeAlt + 14); x.closePath(); x.fill();
        x.strokeStyle = shade(pr, -40); x.lineWidth = 2; x.beginPath(); x.moveTo(cx, govdeUst + 10 + nef); x.lineTo(cx, govdeAlt + 12); x.stroke();
        x.fillStyle = shade(pr, -45); x.fillRect(cx - omuz - 2, lerp(govdeUst, govdeAlt, .55), omuz * 2 + 4, 8);
        x.fillStyle = '#d9c48a'; for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(cx + 8, govdeUst + 28 + i * 26 + nef, 3.4, 0, 7); x.fill(); }
        x.fillStyle = shade(pr, -20); x.beginPath(); x.moveTo(cx - 18, govdeUst + nef); x.lineTo(cx, govdeUst + 30 + nef); x.lineTo(cx - 30, govdeUst + 8 + nef); x.closePath(); x.fill(); x.beginPath(); x.moveTo(cx + 18, govdeUst + nef); x.lineTo(cx, govdeUst + 30 + nef); x.lineTo(cx + 30, govdeUst + 8 + nef); x.closePath(); x.fill();
        x.fillStyle = shade(pr, -12); yuv(x, cx - omuz - 14, govdeUst + 6 + nef, 18, uzun ? 122 : 100, 9); x.fill(); yuv(x, cx + omuz - 4, govdeUst + 6 + nef, 18, uzun ? 122 : 100, 9); x.fill();
        x.fillStyle = o.ten; x.beginPath(); x.arc(cx - omuz - 5, govdeUst + (uzun ? 130 : 108) + nef, 9, 0, 7); x.fill(); x.beginPath(); x.arc(cx + omuz + 5, govdeUst + (uzun ? 130 : 108) + nef, 9, 0, 7); x.fill();
        if (o.canta) { const bx = cx + omuz + 5, by = govdeUst + (uzun ? 136 : 114) + nef; x.strokeStyle = '#3a2414'; x.lineWidth = 3; x.beginPath(); x.arc(bx, by + 4, 12, Math.PI, 0); x.stroke(); x.fillStyle = '#7a4a22'; yuv(x, bx - 22, by + 8, 44, 34, 6); x.fill(); x.fillStyle = '#d9c48a'; x.fillRect(bx - 4, by + 14, 8, 6); }
        yuv(x, cx - 26, govdeUst + 46 + nef, 52, 36, 5); x.fillStyle = '#f4efe2'; x.fill(); x.strokeStyle = '#222'; x.lineWidth = 2; x.stroke();
        x.font = '28px ' + DF; x.fillStyle = '#1a1a1a'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(o.no, cx, govdeUst + 65 + nef);
        const bx = cx, by = ust + 46 + nef;
        x.fillStyle = shade(o.ten, -15); x.fillRect(cx - 10, by + 30, 20, 16);
        if (o.atki) { const ar = ATKI[o.atki]; x.fillStyle = ar; yuv(x, cx - 30, by + 36, 60, 18, 9); x.fill(); x.fillStyle = shade(ar, -20); yuv(x, cx + 6, by + 44, 16, 56, 6); x.fill(); x.strokeStyle = shade(ar, -35); x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(cx + 8, by + 60 + i * 12); x.lineTo(cx + 20, by + 60 + i * 12); x.stroke(); } }
        x.fillStyle = o.ten; x.beginPath(); x.ellipse(bx, by, 34, 40, 0, 0, 7); x.fill();
        x.fillStyle = shade(o.ten, -10); x.beginPath(); x.arc(bx - 34, by + 4, 8, 0, 7); x.fill(); x.beginPath(); x.arc(bx + 34, by + 4, 8, 0, 7); x.fill();
        x.fillStyle = o.sac; x.beginPath(); x.ellipse(bx, by - 22, 36, 24, 0, Math.PI, 0); x.fill(); x.fillRect(bx - 36, by - 24, 8, 22); x.fillRect(bx + 28, by - 24, 8, 22);
        const bak = Math.sin(t / 1300 + o.faz * 3) * 3.5;
        x.fillStyle = '#fff'; x.beginPath(); x.ellipse(bx - 13, by - 2, 8, 7, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(bx + 13, by - 2, 8, 7, 0, 0, 7); x.fill();
        x.fillStyle = '#1b1b22'; x.beginPath(); x.arc(bx - 13 + bak, by - 1, 4, 0, 7); x.fill(); x.beginPath(); x.arc(bx + 13 + bak, by - 1, 4, 0, 7); x.fill();
        x.strokeStyle = o.sac; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(bx - 22, by - 14); x.lineTo(bx - 6, by - 11 + (o.faz > 3 ? 2 : -1)); x.moveTo(bx + 22, by - 14); x.lineTo(bx + 6, by - 11 + (o.faz > 3 ? -1 : 2)); x.stroke();
        x.fillStyle = shade(o.ten, -25); x.beginPath(); x.moveTo(bx, by + 2); x.lineTo(bx - 5, by + 13); x.lineTo(bx + 5, by + 13); x.closePath(); x.fill();
        x.strokeStyle = '#6b2a24'; x.lineWidth = 3; x.beginPath(); x.arc(bx, by + 18, 7, .2, Math.PI - .2); x.stroke();
        if (o.biyik) { x.fillStyle = o.sac === '#d8b56a' ? '#8a6a2a' : o.sac; x.beginPath(); x.moveTo(bx, by + 14); x.quadraticCurveTo(bx - 14, by + 10, bx - 22, by + 20); x.quadraticCurveTo(bx - 10, by + 18, bx, by + 18); x.quadraticCurveTo(bx + 10, by + 18, bx + 22, by + 20); x.quadraticCurveTo(bx + 14, by + 10, bx, by + 14); x.fill(); }
        if (o.gozluk) { x.strokeStyle = '#15151c'; x.lineWidth = 3.5; x.beginPath(); x.arc(bx - 13, by - 2, 11, 0, 7); x.stroke(); x.beginPath(); x.arc(bx + 13, by - 2, 11, 0, 7); x.stroke(); x.beginPath(); x.moveTo(bx - 2, by - 3); x.lineTo(bx + 2, by - 3); x.stroke(); }
        if (o.sapka === 'silindir') { x.fillStyle = '#1b1b22'; x.beginPath(); x.ellipse(bx, by - 30, 48, 9, 0, 0, 7); x.fill(); yuv(x, bx - 28, by - 96, 56, 68, 6); x.fill(); x.fillStyle = '#8a1c2a'; x.fillRect(bx - 28, by - 44, 56, 10); }
        else if (o.sapka) { const sr = SAPKA[o.sapka]; x.fillStyle = shade(sr, -20); x.beginPath(); x.ellipse(bx, by - 28, 52, 11, 0, 0, 7); x.fill(); x.fillStyle = sr; x.beginPath(); x.moveTo(bx - 30, by - 30); x.quadraticCurveTo(bx - 32, by - 70, bx, by - 66); x.quadraticCurveTo(bx + 32, by - 70, bx + 30, by - 30); x.closePath(); x.fill(); x.fillStyle = '#1b1b22'; x.fillRect(bx - 30, by - 40, 60, 8); }
        x.restore();
        if (durumu === 'x' || durumu === 'masum') {
            x.save(); x.fillStyle = 'rgba(8,10,20,.55)'; x.fillRect(cx - 70, ust - 80, 140, boyH + 90);
            if (durumu === 'x') { x.strokeStyle = 'rgba(230,50,50,.9)'; x.lineWidth = 12; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - 50, ust - 10); x.lineTo(cx + 50, ust + 150); x.moveTo(cx + 50, ust - 10); x.lineTo(cx - 50, ust + 150); x.stroke(); }
            else damga(x, cx, ust + 80, 'MASUM', '#3fbf6a', -.2);
            x.restore();
        }
        if (durumu === 'suclu') damga(x, cx, ust + 90, 'YAKALANDI', '#e23b3b', -.18, 30);
    }
    function damga(x, cx, cy, t, renk, rot, boy) { boy = boy || 34; x.save(); x.translate(cx, cy); x.rotate(rot); x.font = boy + 'px ' + DF; const w = x.measureText(t).width + 24; x.strokeStyle = renk; x.lineWidth = 5; yuv(x, -w / 2, -boy * .8, w, boy * 1.6, 8); x.stroke(); x.fillStyle = renk; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 0, 2); x.restore(); }
    function yokCiz(x) { x.strokeStyle = '#d02828'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 24, 0, 7); x.moveTo(-17, -17); x.lineTo(17, 17); x.stroke(); }
    function sapkaIkon(x, renk) { x.fillStyle = shade(renk, -20); x.beginPath(); x.ellipse(0, 10, 26, 6, 0, 0, 7); x.fill(); x.fillStyle = renk; x.beginPath(); x.moveTo(-15, 9); x.quadraticCurveTo(-16, -14, 0, -12); x.quadraticCurveTo(16, -14, 15, 9); x.fill(); }
    function ipucuIkon(x, c, cx, cy) {
        x.save(); x.translate(cx, cy); x.lineCap = 'round';
        const v = c.v;
        if (c.k === 'sapka') { if (v === 'silindir') { x.fillStyle = '#1b1b22'; x.beginPath(); x.ellipse(0, 12, 24, 5, 0, 0, 7); x.fill(); x.fillRect(-14, -20, 28, 32); x.fillStyle = '#8a1c2a'; x.fillRect(-14, 4, 28, 5); } else sapkaIkon(x, v ? SAPKA[v] : '#6b7484'); if (!v && !c.not) yokCiz(x); }
        else if (c.k === 'gozluk') { x.strokeStyle = '#15151c'; x.lineWidth = 4; x.beginPath(); x.arc(-12, 0, 10, 0, 7); x.stroke(); x.beginPath(); x.arc(12, 0, 10, 0, 7); x.stroke(); x.beginPath(); x.moveTo(-2, 0); x.lineTo(2, 0); x.stroke(); if (!v) yokCiz(x); }
        else if (c.k === 'biyik') { x.fillStyle = '#3a2414'; x.beginPath(); x.moveTo(0, -2); x.quadraticCurveTo(-14, -6, -24, 6); x.quadraticCurveTo(-10, 4, 0, 4); x.quadraticCurveTo(10, 4, 24, 6); x.quadraticCurveTo(14, -6, 0, -2); x.fill(); if (!v) yokCiz(x); }
        else if (c.k === 'boy') { x.strokeStyle = '#1b1b22'; x.lineWidth = 4; const h = v === 'uzun' ? 22 : 10; x.beginPath(); x.moveTo(0, h); x.lineTo(0, -h); x.moveTo(-7, -h + 7); x.lineTo(0, -h); x.lineTo(7, -h + 7); x.moveTo(-7, h - 7); x.lineTo(0, h); x.lineTo(7, h - 7); x.stroke(); x.fillStyle = '#1b1b22'; x.beginPath(); x.arc(-18, v === 'uzun' ? -16 : -4, 5, 0, 7); x.fill(); x.fillRect(-21, v === 'uzun' ? -11 : 1, 6, v === 'uzun' ? 32 : 18); }
        else if (c.k === 'atki') { x.fillStyle = v ? ATKI[v] : '#8a92a6'; yuv(x, -22, -8, 44, 12, 6); x.fill(); yuv(x, 4, 0, 12, 22, 4); x.fill(); if (!v && !c.not) yokCiz(x); }
        else if (c.k === 'canta') { x.strokeStyle = '#3a2414'; x.lineWidth = 3; x.beginPath(); x.arc(0, -6, 10, Math.PI, 0); x.stroke(); x.fillStyle = '#7a4a22'; yuv(x, -18, -4, 36, 24, 5); x.fill(); if (!v) yokCiz(x); }
        else if (c.k === 'palto') { x.fillStyle = PALTO[v][0]; x.beginPath(); x.moveTo(-12, -18); x.lineTo(12, -18); x.lineTo(20, 20); x.lineTo(-20, 20); x.closePath(); x.fill(); x.fillRect(-24, -16, 8, 26); x.fillRect(16, -16, 8, 26); }
        if (c.not && v !== null) yokCiz(x);
        x.restore();
    }
    function nesneCiz(x, tip, cx, cy, s) {
        x.save(); x.translate(cx, cy); x.scale(s, s);
        if (tip === 'altinok') { x.rotate(-.5); x.strokeStyle = '#f6c53a'; x.lineWidth = 5; x.beginPath(); x.moveTo(-36, 0); x.lineTo(30, 0); x.stroke(); x.fillStyle = '#ffd95a'; x.beginPath(); x.moveTo(40, 0); x.lineTo(26, -9); x.lineTo(26, 9); x.fill(); x.fillStyle = '#e39a1a'; x.beginPath(); x.moveTo(-36, 0); x.lineTo(-48, -10); x.lineTo(-30, 0); x.lineTo(-48, 10); x.fill(); }
        else if (tip === 'pasta') { x.fillStyle = '#f3d9b0'; x.fillRect(-30, -6, 60, 26); x.fillStyle = '#f58ab0'; x.fillRect(-30, -14, 60, 10); x.fillRect(-20, -30, 40, 18); x.fillStyle = '#fff6e0'; x.fillRect(-20, -34, 40, 6); x.fillStyle = '#ff4a4a'; x.beginPath(); x.arc(0, -40, 6, 0, 7); x.fill(); }
        else if (tip === 'papagan') { x.fillStyle = '#2fbf5a'; x.beginPath(); x.ellipse(0, 4, 18, 26, 0, 0, 7); x.fill(); x.fillStyle = '#e8402a'; x.beginPath(); x.arc(0, -22, 15, 0, 7); x.fill(); x.fillStyle = '#ffd23a'; x.beginPath(); x.moveTo(10, -24); x.lineTo(22, -18); x.lineTo(10, -14); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(4, -26, 4, 0, 7); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(5, -26, 2, 0, 7); x.fill(); }
        else if (tip === 'kupa') { x.fillStyle = '#ffc94a'; x.beginPath(); x.moveTo(-24, -30); x.lineTo(24, -30); x.quadraticCurveTo(22, 6, 0, 10); x.quadraticCurveTo(-22, 6, -24, -30); x.fill(); x.fillRect(-5, 8, 10, 14); x.fillRect(-18, 22, 36, 8); }
        else if (tip === 'yumurta') { x.fillStyle = '#e9e2c8'; x.beginPath(); x.ellipse(0, 0, 24, 32, 0, 0, 7); x.fill(); x.fillStyle = '#7fb069'; [[-8, -10, 5], [9, 4, 6], [-4, 16, 4]].forEach((p) => { x.beginPath(); x.arc(p[0], p[1], p[2], 0, 7); x.fill(); }); }
        else if (tip === 'dondurma') { x.fillStyle = '#d9a05b'; x.beginPath(); x.moveTo(-14, 0); x.lineTo(14, 0); x.lineTo(0, 34); x.closePath(); x.fill(); x.fillStyle = '#ff9ec4'; x.beginPath(); x.arc(-6, -6, 12, 0, 7); x.fill(); x.fillStyle = '#fff3d6'; x.beginPath(); x.arc(7, -8, 12, 0, 7); x.fill(); x.fillStyle = '#7a4a22'; x.beginPath(); x.arc(0, -20, 11, 0, 7); x.fill(); x.fillStyle = '#ff4a4a'; x.beginPath(); x.arc(2, -32, 5, 0, 7); x.fill(); }
        else if (tip === 'roket') { x.rotate(.4); x.fillStyle = '#e8ecf4'; x.beginPath(); x.moveTo(0, -38); x.quadraticCurveTo(16, -18, 12, 18); x.lineTo(-12, 18); x.quadraticCurveTo(-16, -18, 0, -38); x.fill(); x.fillStyle = '#d23a32'; x.beginPath(); x.moveTo(-12, 8); x.lineTo(-22, 26); x.lineTo(-10, 18); x.fill(); x.beginPath(); x.moveTo(12, 8); x.lineTo(22, 26); x.lineTo(10, 18); x.fill(); x.fillStyle = '#3aa0ff'; x.beginPath(); x.arc(0, -10, 6, 0, 7); x.fill(); x.fillStyle = '#ffb02e'; x.beginPath(); x.moveTo(-8, 20); x.lineTo(0, 38); x.lineTo(8, 20); x.fill(); }
        else if (tip === 'yay') { x.strokeStyle = '#8a4a1a'; x.lineWidth = 6; x.beginPath(); x.arc(-24, 0, 38, -1.1, 1.1); x.stroke(); x.strokeStyle = '#ffe9a8'; x.lineWidth = 2; x.beginPath(); x.moveTo(-7, -34); x.lineTo(-7, 34); x.stroke(); x.fillStyle = '#ffd34a'; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(14 + (i % 2) * 8, -20 + i * 13, 3, 0, 7); x.fill(); } }
        else if (tip === 'madalya') { x.fillStyle = '#2f6fd6'; x.beginPath(); x.moveTo(-14, -36); x.lineTo(-2, -4); x.lineTo(6, -4); x.lineTo(-4, -36); x.fill(); x.fillStyle = '#d23a32'; x.beginPath(); x.moveTo(14, -36); x.lineTo(2, -4); x.lineTo(-6, -4); x.lineTo(4, -36); x.fill(); x.fillStyle = '#ffc94a'; x.beginPath(); x.arc(0, 12, 20, 0, 7); x.fill(); x.fillStyle = '#e39a1a'; x.font = '22px ' + DF; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('1', 0, 13); }
        else if (tip === 'elmas') { x.fillStyle = '#5ac8ff'; x.beginPath(); x.moveTo(-26, -8); x.lineTo(-14, -22); x.lineTo(14, -22); x.lineTo(26, -8); x.lineTo(0, 26); x.closePath(); x.fill(); x.fillStyle = '#b8ecff'; x.beginPath(); x.moveTo(-14, -22); x.lineTo(0, -8); x.lineTo(14, -22); x.fill(); x.strokeStyle = '#1f6fa8'; x.lineWidth = 2; x.beginPath(); x.moveTo(-26, -8); x.lineTo(26, -8); x.stroke(); }
        else if (tip === 'anahtar') { x.rotate(-.5); x.strokeStyle = '#e8b42a'; x.lineWidth = 7; x.beginPath(); x.arc(-20, 0, 12, 0, 7); x.stroke(); x.beginPath(); x.moveTo(-8, 0); x.lineTo(32, 0); x.moveTo(22, 0); x.lineTo(22, 12); x.moveTo(30, 0); x.lineTo(30, 10); x.stroke(); }
        else if (tip === 'saat') { x.fillStyle = '#c8a050'; x.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? 26 : 32; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fill(); x.fillStyle = '#8a6a30'; x.beginPath(); x.arc(0, 0, 10, 0, 7); x.fill(); }
        else if (tip === 'kitap') { x.fillStyle = '#6d4c9a'; yuv(x, -28, -24, 56, 46, 4); x.fill(); x.fillStyle = '#f5ecd6'; x.fillRect(-24, 16, 50, 6); x.fillStyle = '#ffd34a'; x.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 12; x.lineTo(Math.cos(a) * r, Math.sin(a) * r - 2); } x.fill(); }
        else if (tip === 'kedi') { x.fillStyle = '#f4f0e6'; x.beginPath(); x.ellipse(0, 12, 22, 18, 0, 0, 7); x.fill(); x.beginPath(); x.arc(0, -14, 16, 0, 7); x.fill(); x.beginPath(); x.moveTo(-14, -22); x.lineTo(-12, -38); x.lineTo(-2, -28); x.fill(); x.beginPath(); x.moveTo(14, -22); x.lineTo(12, -38); x.lineTo(2, -28); x.fill(); x.fillStyle = '#3fbf6a'; x.beginPath(); x.arc(-6, -15, 3, 0, 7); x.fill(); x.beginPath(); x.arc(6, -15, 3, 0, 7); x.fill(); x.fillStyle = '#ff8aa8'; x.beginPath(); x.arc(0, -9, 2.5, 0, 7); x.fill(); }
        else if (tip === 'harita') { x.fillStyle = '#e8d6a8'; x.beginPath(); x.moveTo(-32, -24); x.lineTo(-10, -18); x.lineTo(10, -24); x.lineTo(32, -18); x.lineTo(32, 24); x.lineTo(10, 18); x.lineTo(-10, 24); x.lineTo(-32, 18); x.closePath(); x.fill(); x.strokeStyle = '#d23a32'; x.lineWidth = 3; x.setLineDash([5, 4]); x.beginPath(); x.moveTo(-24, 10); x.quadraticCurveTo(0, -20, 18, 4); x.stroke(); x.setLineDash([]); x.strokeStyle = '#d23a32'; x.lineWidth = 4; x.beginPath(); x.moveTo(14, 0); x.lineTo(24, 10); x.moveTo(24, 0); x.lineTo(14, 10); x.stroke(); }
        else if (tip === 'tac') { x.fillStyle = '#ffc94a'; x.beginPath(); x.moveTo(-32, 16); x.lineTo(-32, -14); x.lineTo(-16, 2); x.lineTo(0, -22); x.lineTo(16, 2); x.lineTo(32, -14); x.lineTo(32, 16); x.closePath(); x.fill(); ['#e23b3b', '#2f6fd6', '#3fbf6a'].forEach((r, i) => { x.fillStyle = r; x.beginPath(); x.arc(-18 + i * 18, 8, 5, 0, 7); x.fill(); }); }
        x.restore();
    }
    function kartSatir(x, metin, gen) {
        for (const boy of [30, 27, 24, 21]) { x.font = boy + 'px ' + DF; const kel = metin.split(' '), sat = []; let su = ''; for (const k of kel) { const den = su ? su + ' ' + k : k; if (x.measureText(den).width <= gen) su = den; else { if (su) sat.push(su); su = k; } } if (su) sat.push(su); if (sat.length <= (boy >= 27 ? 2 : 3)) return { boy, sat }; }
        return { boy: 20, sat: [metin] };
    }
    const _kartAnim = {};
    function kartCiz(x, i, c, acik) {
        const px = 14 + i * 251, py = 84, w = 243, h = 104;
        const anim = _kartAnim[i]; const don = anim != null ? Math.min(1, anim) : 1; const sx = Math.abs(Math.cos(Math.PI * (1 - don)));
        x.save(); x.translate(px + w / 2, py + h / 2); x.rotate(((i * 37) % 7 - 3) * .005); x.scale(acik ? Math.max(.02, sx) : 1, 1);
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
        const goster = acik && don > .5;
        x.fillStyle = goster ? (c.not ? '#ffe9e2' : '#f5ecd6') : '#d9c9a6'; x.fillRect(-w / 2, -h / 2, w, h);
        if (goster) {
            x.save(); x.translate(-w / 2 + 34, 0); ipucuIkon(x, c, 0, 0); x.restore();
            const r = kartSatir(x, ipucuMetni(c), w - 76);
            x.font = r.boy + 'px ' + DF; x.fillStyle = c.not ? '#8a1c14' : '#2a2014'; x.textAlign = 'left'; x.textBaseline = 'middle';
            const sh = r.boy * 1.08; r.sat.forEach((t, k) => x.fillText(t, -w / 2 + 68, (k - (r.sat.length - 1) / 2) * sh + 2));
        } else { x.fillStyle = 'rgba(80,50,20,.5)'; x.font = '44px ' + DF; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('?', 0, -6); x.font = '18px ' + DF; x.fillText('İPUCU ' + (i + 1), 0, 28); }
        x.restore();
        x.fillStyle = '#d23a32'; x.beginPath(); x.arc(px + w / 2, py + 4, 7, 0, 7); x.fill();
    }
    let _statik = null, _statikOlcek = 0, _statikImza = '';
    function statikCiz(x, st) {
        const g = x.createLinearGradient(0, 0, 0, AYAK); g.addColorStop(0, '#1a2030'); g.addColorStop(1, '#2b3346'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        sahneCiz(x, st);
        const z = x.createLinearGradient(0, AYAK, 0, H); z.addColorStop(0, '#14161e'); z.addColorStop(1, '#07080c'); x.fillStyle = z; x.fillRect(0, AYAK, W, H - AYAK);
        // üst mantar şerit (ipucu panosu)
        x.fillStyle = '#4a2f1a'; x.fillRect(0, 74, W, 124);
        const pg = x.createLinearGradient(0, 78, 0, 194); pg.addColorStop(0, '#b88752'); pg.addColorStop(1, '#946638'); x.fillStyle = pg; x.fillRect(4, 78, W - 8, 116);
        for (let i = 0; i < 700; i++) { x.fillStyle = 'rgba(60,30,10,' + rnd(.05, .2) + ')'; x.fillRect(4 + Math.random() * (W - 8), 78 + Math.random() * 116, 2, 2); }
        // sol: komiserin odası (üstte "ŞİMDİ ATIYOR" kartı HTML olarak durur; sol alt köşe skor dock'una kalabilir — süs)
        const og = x.createLinearGradient(0, 200, 0, H); og.addColorStop(0, '#20263a'); og.addColorStop(1, '#141824'); x.fillStyle = og; x.fillRect(0, 198, SIRA_X0 - 14, H - 198);
        x.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 6; i++) x.fillRect(0, 250 + i * 70, SIRA_X0 - 14, 2);
        x.fillStyle = '#0e1220'; x.fillRect(SIRA_X0 - 16, 198, 6, H - 198);
        x.fillStyle = '#5a3a22'; x.fillRect(20, 520, 460, 26); x.fillStyle = '#3a2414'; x.fillRect(40, 546, 22, 140); x.fillRect(436, 546, 22, 140);
    }
    // Olay yerinin arka planı (sağ taraf, x 506–1280, y 198–640). Merdiven basamakları şüpheli yerlerine göre çizilir.
    function sahneCiz(x, st) {
        const sa = st.sahne || 'karakol', L = SIRA_X0 - 10, R = W, T = 198, B = AYAK;
        const zemin = (a, b) => { const g = x.createLinearGradient(0, T, 0, B); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(L, T, R - L, B - T); };
        if (sa === 'karakol' || sa === 'uzay') {
            if (sa === 'uzay') { zemin('#070b1e', '#1a1f3e'); for (let i = 0; i < 90; i++) { x.fillStyle = 'rgba(255,255,255,' + rnd(.3, .9) + ')'; x.fillRect(L + Math.random() * (R - L), T + Math.random() * 260, 2, 2); } x.fillStyle = '#c8ccd8'; x.beginPath(); x.arc(1180, 260, 34, 0, 7); x.fill(); x.fillStyle = '#2a3150'; x.fillRect(L, 520, R - L, 120); x.fillStyle = '#3d4670'; for (let i = 0; i < 9; i++) { x.fillRect(L + 20 + i * 84, 540, 60, 30); x.fillStyle = i % 2 ? '#5ee39b' : '#ff7a5a'; x.fillRect(L + 30 + i * 84, 548, 8, 8); x.fillStyle = '#3d4670'; } }
            x.strokeStyle = 'rgba(220,230,255,.18)';
            for (let cm = 60; cm <= 190; cm += 10) { const y = AYAK - cm / 0.53; if (y < 200) continue; x.lineWidth = cm % 50 === 0 ? 3 : 1.5; x.beginPath(); x.moveTo(SIRA_X0 - 6, y); x.lineTo(W - 6, y); x.stroke(); if (cm % 20 === 0) { x.font = '18px ' + DF; x.fillStyle = 'rgba(220,230,255,.45)'; x.textAlign = 'left'; x.fillText(cm, SIRA_X0, y - 8); x.textAlign = 'right'; x.fillText(cm, W - 10, y - 8); } }
        } else if (sa === 'muze') {
            zemin('#2a2440', '#3a3050'); [[600, '#b84a3a'], [860, '#3a7ab8'], [1120, '#5aa06a']].forEach((p) => { x.fillStyle = '#c8a050'; x.fillRect(p[0] - 70, 222, 140, 100); x.fillStyle = p[1]; x.fillRect(p[0] - 58, 234, 116, 76); x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(p[0] - 10, 268, 22, 0, 7); x.fill(); });
            x.fillStyle = '#4a4068'; [L + 6, R - 40].forEach((c) => x.fillRect(c, T, 34, B - T)); x.fillStyle = '#2a2236'; for (let i = 0; i < 12; i++) x.fillRect(L + i * 66, 600, 33, 40);
            x.strokeStyle = '#a8202a'; x.lineWidth = 5; x.beginPath(); x.moveTo(L + 20, 520); x.quadraticCurveTo(L + 380, 560, R - 20, 520); x.stroke();
        } else if (sa === 'pastane') {
            zemin('#f3d7d2', '#e8bfb6'); for (let i = 0; i < 14; i++) { x.fillStyle = i % 2 ? '#ff7aa8' : '#fff4f0'; x.fillRect(L + i * 56, T, 56, 38); } x.fillStyle = '#ff7aa8'; for (let i = 0; i < 14; i++) { x.beginPath(); x.arc(L + 28 + i * 56, T + 38, 28, 0, Math.PI); x.fill(); }
            x.fillStyle = 'rgba(160,90,80,.25)'; x.fillRect(L, 290, R - L, 8);
        } else if (sa === 'hayvanat' || sa === 'park') {
            zemin('#7cc4e8', '#bfe6a6'); x.fillStyle = '#5aa04a'; x.fillRect(L, 470, R - L, 170);
            [[600, 300], [760, 270], [1000, 310], [1200, 280]].forEach((p, i) => { x.fillStyle = '#6a4a2a'; x.fillRect(p[0] - 10, p[1], 20, 200); x.fillStyle = i % 2 ? '#3f8a3a' : '#4fa04a'; x.beginPath(); x.arc(p[0], p[1], 62, 0, 7); x.fill(); x.beginPath(); x.arc(p[0] - 40, p[1] + 20, 40, 0, 7); x.fill(); x.beginPath(); x.arc(p[0] + 40, p[1] + 16, 44, 0, 7); x.fill(); });
            if (sa === 'hayvanat') { x.strokeStyle = '#555c6a'; x.lineWidth = 6; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(1150 + i * 22, 300); x.lineTo(1150 + i * 22, 480); x.stroke(); } x.fillStyle = '#e8b04a'; x.beginPath(); x.ellipse(1205, 430, 26, 34, 0, 0, 7); x.fill(); }
            else { x.fillStyle = '#8a5a35'; x.fillRect(560, 560, 140, 14); x.fillRect(570, 574, 10, 40); x.fillRect(680, 574, 10, 40); x.fillStyle = '#2a2a34'; x.fillRect(1240, 300, 8, 300); x.fillStyle = '#ffe9a8'; x.beginPath(); x.arc(1244, 296, 14, 0, 7); x.fill(); }
        } else if (sa === 'kale' || sa === 'gar') {
            if (sa === 'kale') { zemin('#5a5f70', '#454a5a'); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 2; for (let y = T; y < B; y += 34) for (let k = 0; k < 14; k++) x.strokeRect(L + k * 60 + ((y / 34) % 2) * 30, y, 60, 34); [[640, '#d23a32'], [1140, '#2f6fd6']].forEach((b) => { x.fillStyle = b[1]; x.fillRect(b[0] - 26, 214, 52, 110); x.beginPath(); x.moveTo(b[0] - 26, 324); x.lineTo(b[0], 344); x.lineTo(b[0] + 26, 324); x.fill(); }); }
            else { zemin('#38404f', '#4a5263'); x.fillStyle = '#f4efe2'; x.beginPath(); x.arc(1150, 250, 32, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineWidth = 4; x.stroke(); x.beginPath(); x.moveTo(1150, 250); x.lineTo(1150, 230); x.moveTo(1150, 250); x.lineTo(1164, 256); x.stroke(); x.fillStyle = '#1f4f9a'; x.fillRect(560, 222, 180, 40); yaz(x, 'PERON 3', 650, 242, 22, '#fff'); }
            const n = st.n || 6, g = SIRA_GEN / n; x.fillStyle = sa === 'kale' ? '#6e6a62' : '#6a7080';
            for (let i = 0; i < n; i++) { const p = poz(st, i); x.fillRect(p.x - g / 2, p.ayak, g + 1, B - p.ayak + 2); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(p.x - g / 2, p.ayak, g + 1, 5); x.fillStyle = sa === 'kale' ? '#6e6a62' : '#6a7080'; }
        } else if (sa === 'otel') {
            zemin('#3a2a3e', '#4a3448'); x.fillStyle = '#5a4058'; x.fillRect(L, T, R - L, 250);
            for (let i = 0; i < 9; i++) { x.fillStyle = i % 3 === 1 ? '#2a1e2e' : '#ffd98a'; x.fillRect(L + 30 + i * 84, 214, 48, 70); }
            x.fillStyle = '#7a1c2a'; x.fillRect(L, 600, R - L, 40);
        } else if (sa === 'gemi') {
            zemin('#6ab0e0', '#2a6aa0'); x.fillStyle = '#1e5a8a'; x.fillRect(L, 340, R - L, 120);
            x.fillStyle = '#7a4a22'; x.fillRect(880, T, 16, 260); x.fillStyle = '#f4efe2'; x.beginPath(); x.moveTo(900, 210); x.quadraticCurveTo(1010, 280, 900, 380); x.fill(); x.fillStyle = '#1b1b22'; x.fillRect(896, 204, 60, 34); yaz(x, '☠', 926, 222, 24, '#fff', { kontur: false });
            x.fillStyle = '#8a5a35'; x.fillRect(L, 460, R - L, 180); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 2; for (let y = 480; y < B; y += 26) { x.beginPath(); x.moveTo(L, y); x.lineTo(R, y); x.stroke(); }
        }
    }
    // "iki" dizilimde ön sırayla arka sıra arasına çizilen ön parça (tezgâh / balkon parmaklığı / küpeşte)
    function sahneOnCiz(x, st) {
        const sa = st.sahne, L = SIRA_X0 - 10;
        if (sa === 'pastane') { x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(L, 420, W - L, 70); x.fillStyle = '#c86a5a'; x.fillRect(L, 488, W - L, 14); for (let i = 0; i < 9; i++) { const cx = L + 50 + i * 86; x.fillStyle = ['#ff9ec4', '#7a4a22', '#fff3d6'][i % 3]; x.beginPath(); x.arc(cx, 470, 16, Math.PI, 0); x.fill(); x.fillRect(cx - 16, 470, 32, 14); } }
        else if (sa === 'otel') { x.fillStyle = '#2a1e2e'; x.fillRect(L, 436, W - L, 12); x.strokeStyle = '#c8a050'; x.lineWidth = 4; x.beginPath(); x.moveTo(L, 400); x.lineTo(W, 400); x.stroke(); for (let k = L; k < W; k += 26) { x.beginPath(); x.moveTo(k, 400); x.lineTo(k, 438); x.stroke(); } }
        else if (sa === 'gemi') { x.fillStyle = '#6a3a1a'; x.fillRect(L, 432, W - L, 16); x.strokeStyle = '#5a3216'; x.lineWidth = 5; x.beginPath(); x.moveTo(L, 402); x.lineTo(W, 402); x.stroke(); for (let k = L; k < W; k += 40) { x.beginPath(); x.moveTo(k, 402); x.lineTo(k, 434); x.stroke(); } }
    }
    function baykusCiz(x, t, etiketsiz) {
        const bx = 150, by = 474 + Math.sin(t / 800) * 3, goz = (Math.sin(t / 2200) > .96) ? .15 : 1;
        x.save();
        x.fillStyle = '#7a5434'; x.beginPath(); x.ellipse(bx, by, 64, 74, 0, 0, 7); x.fill();
        x.fillStyle = '#c9a77c'; x.beginPath(); x.ellipse(bx, by + 18, 42, 50, 0, 0, 7); x.fill();
        x.strokeStyle = 'rgba(120,80,40,.5)'; x.lineWidth = 2; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(bx, by + 8 + i * 14, 18, .3, Math.PI - .3); x.stroke(); }
        x.fillStyle = '#5a3a22'; x.beginPath(); x.ellipse(bx - 58, by + 10, 18, 44, .25, 0, 7); x.fill(); x.beginPath(); x.ellipse(bx + 58, by + 10, 18, 44, -.25, 0, 7); x.fill();
        // dedektif şapkası
        x.fillStyle = '#8a6a44'; x.beginPath(); x.ellipse(bx, by - 62, 58, 12, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(bx - 40, by - 62); x.quadraticCurveTo(bx, by - 112, bx + 40, by - 62); x.fill();
        x.strokeStyle = '#6a4a2a'; x.lineWidth = 3; x.beginPath(); x.moveTo(bx - 36, by - 72); x.lineTo(bx + 36, by - 72); x.stroke();
        // gözler
        [-24, 24].forEach((dx) => { x.fillStyle = '#fff6dc'; x.beginPath(); x.arc(bx + dx, by - 22, 22, 0, 7); x.fill(); x.strokeStyle = '#5a3a22'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#1a1208'; x.beginPath(); x.ellipse(bx + dx + Math.sin(t / 1500) * 4, by - 22, 10, 10 * goz, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(bx + dx + 3, by - 26, 3, 0, 7); x.fill(); });
        x.fillStyle = '#f2a83a'; x.beginPath(); x.moveTo(bx - 8, by - 6); x.lineTo(bx + 8, by - 6); x.lineTo(bx, by + 8); x.closePath(); x.fill();
        // büyüteç
        x.strokeStyle = '#3a2414'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(bx + 62, by + 30); x.lineTo(bx + 92, by + 64); x.stroke();
        x.strokeStyle = '#c8a050'; x.lineWidth = 6; x.beginPath(); x.arc(bx + 52, by + 18, 20, 0, 7); x.stroke(); x.fillStyle = 'rgba(180,220,255,.3)'; x.fill();
        x.restore();
        if (!etiketsiz) yaz(x, 'KOMİSER BAYKUŞ', bx, 592, 20, '#ffe2a0');
    }
    /* ---------------- SAHNE ---------------- */
    let _cv = null, _ctx = null, _raf = 0, _son = 0, _olcek = 1, _ox = 0, _oy = 0, _dpr = 1, _suclaMod = false, _tren = 0, _sonucAnim = null, _perdeFaz = null, _zaman = [];
    function panel() { return $('km-oyun-panel-dedektif'); }
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }
    const bekle = (ms) => new Promise((r) => sonra(r, ms));
    // Skor dock'u sol altta durur: sahnenin o köşesi bilerek süs (Komiser masası / deniz); kartlar dock'un üstünde açılır.
    let _alanImza = '';
    function serbestAlan(r) {
        let x0 = 0, x1 = r.width; const d = null; // v444: sahne dock köşesini boş bırakacak şekilde tasarlandı → tam alan
        if (d && d.offsetParent !== null) {
            const b = d.getBoundingClientRect();
            if (b.width > 150 && b.width < r.width * .6 && b.bottom > r.top + 40 && b.top < r.bottom && b.right > r.left && b.left < r.right) {
                if (b.left + b.width / 2 < r.left + r.width / 2) x0 = Math.max(0, b.right - r.left + 8); else x1 = Math.min(r.width, b.left - r.left - 8);
            }
        }
        if (x1 - x0 < r.width * .45) { x0 = 0; x1 = r.width; }
        return { x0, x1 };
    }
    function boyutla() {
        if (!_cv) return; const r = _cv.getBoundingClientRect(); if (!r.width || !r.height) return;
        const a = serbestAlan(r); _alanImza = [Math.round(r.width), Math.round(r.height), Math.round(a.x0), Math.round(a.x1)].join('|');
        _dpr = Math.min(2, window.devicePixelRatio || 1); _cv.width = Math.round(r.width * _dpr); _cv.height = Math.round(r.height * _dpr);
        const gw = a.x1 - a.x0; _olcek = Math.min(gw / W, r.height / H); _ox = a.x0 + (gw - W * _olcek) / 2; _oy = (r.height - H * _olcek) / 2; _statik = null;
        yerlestir();
    }
    // HTML katmanları sahne ölçeğine göre: 1em = 10 sahne pikseli
    function yerlestir() {
        const k = $('ddk-kim'); if (k) { k.style.left = (_ox + 14 * _olcek) + 'px'; k.style.top = (_oy + 204 * _olcek) + 'px'; k.style.width = (480 * _olcek) + 'px'; k.style.fontSize = (10 * _olcek) + 'px'; }
        const r = $('ddk-rozet'); if (r) { r.style.left = (_ox + 560 * _olcek) + 'px'; r.style.top = (_oy + 206 * _olcek) + 'px'; r.style.width = (680 * _olcek) + 'px'; r.style.fontSize = (10 * _olcek) + 'px'; }
    }
    let _alanSon = 0;
    function alanKontrol(t) { if (t - _alanSon < 400 || !_cv) return; _alanSon = t; const r = _cv.getBoundingClientRect(); if (!r.width) return; const a = serbestAlan(r); const im = [Math.round(r.width), Math.round(r.height), Math.round(a.x0), Math.round(a.x1)].join('|'); if (im !== _alanImza) boyutla(); }
    function ddkSahneKur(p) {
        p = p || panel(); if (!p) return; css(); zamanTemizle(); _suclaMod = false; _tren = 0; _sonucAnim = null; _perdeFaz = null;
        p.innerHTML = `<div class="ddk-kap"><canvas id="ddk-cv"></canvas>
          <div class="ddk-hud"><button class="ddk-btn ddk-sucla" id="ddk-sucla-btn">🫵 Suçla</button><button class="ddk-btn" id="ddk-zor-btn" title="Zorluk">⚙️</button><button class="ddk-btn" id="ddk-ses-btn" title="Ses">🔊</button><button class="ddk-btn" id="ddk-nasil-btn" title="Nasıl oynanır?">❓</button><button class="ddk-btn" id="ddk-yeni-btn" title="Bu vakayı baştan">🔄</button></div>
          <div class="ddk-kim" id="ddk-kim" hidden></div><div class="ddk-rozet" id="ddk-rozet" hidden></div>
          <div class="ddk-perde" id="ddk-perde" hidden></div></div>`;
        _kimImza = ''; _rozetKuyruk = []; clearTimeout(_rozetZ); _rozetZ = 0;
        _cv = $('ddk-cv'); _ctx = _cv.getContext('2d');
        try { new ResizeObserver(boyutla).observe(_cv); } catch (e) { window.addEventListener('resize', boyutla); }
        boyutla();
        _cv.addEventListener('pointerdown', tiklama);
        $('ddk-sucla-btn').onclick = () => { const st = durum(); if (st.faz !== 'oyun') return; _suclaMod = !_suclaMod; ses('sec'); hudCiz(); };
        $('ddk-zor-btn').onclick = zorlukAc;
        $('ddk-ses-btn').onclick = () => { try { localStorage.setItem('dag_ddk_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); ses('sec'); };
        $('ddk-nasil-btn').onclick = nasil;
        $('ddk-yeni-btn').onclick = yeniSor;
        if (!_raf) { _son = performance.now(); _raf = requestAnimationFrame(dongu); }
        ddkGuncelle();
    }
    function hudCiz() {
        const b = $('ddk-sucla-btn'); if (b) { b.textContent = _suclaMod ? '✖ Vazgeç' : '🫵 Suçla'; b.classList.toggle('acik', _suclaMod); }
        const s = $('ddk-ses-btn'); if (s) s.textContent = sesAcik() ? '🔊' : '🔇';
    }
    function ddkGuncelle() {
        if (!panel()) return;
        const st = durum(); hudCiz(); kimCiz(true);
        if (st.faz !== _perdeFaz) perdeCiz(st);
    }
    function dongu(t) {
        _raf = 0;
        if (!_cv || !document.body.contains(_cv)) { _cv = null; return; }
        const dt = Math.min(50, t - _son); _son = t;
        if (_cv.offsetParent !== null) { alanKontrol(t); ciz(t, dt); if (t - _kimSon > 300) { _kimSon = t; kimCiz(); } }
        _raf = requestAnimationFrame(dongu);
    }
    let _hamle = null, _kimSon = 0;
    const HAMLE = { karanlik: ['IŞIKLARI SÖNDÜRDÜ!', 'İlk iyi ok ışığı yakar'], yer: ['ŞÜPHELİLER YER DEĞİŞTİRDİ!', 'Numaralara dikkat!'], ruzgar: ['BİR İPUCUNU UÇURDU!', 'Sıradaki iyi ok kartı geri getirir'] };
    function ciz(t, dt) {
        const x = _ctx, st = _st || durum(); if (!x) return;
        fxGuncelle(dt);
        for (const k in _kartAnim) if (_kartAnim[k] < 1) _kartAnim[k] = Math.min(1, _kartAnim[k] + dt / 450);
        x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#07080c'; x.fillRect(0, 0, _cv.width, _cv.height);
        const sc = _dpr * _olcek; x.setTransform(sc, 0, 0, sc, _dpr * _ox, _dpr * _oy);
        x.save(); x.beginPath(); x.rect(0, 0, W, H); x.clip();
        if (FX.shake) x.translate(rnd(-FX.shake, FX.shake), rnd(-FX.shake, FX.shake));
        const im = (st.sahne || 'karakol') + '|' + (st.n || 6);
        if (!_statik || _statikOlcek !== sc || _statikImza !== im) { _statik = document.createElement('canvas'); _statik.width = Math.ceil(W * sc); _statik.height = Math.ceil(H * sc); const sx = _statik.getContext('2d'); sx.setTransform(sc, 0, 0, sc, 0, 0); statikCiz(sx, st); _statikOlcek = sc; _statikImza = im; }
        x.drawImage(_statik, 0, 0, W, H);
        const V = vakaBul(st.vid), vVar = !!(st.vid && st.v && st.v.s && st.faz !== 'zarf');
        if (vVar) {
            const diz = (SAHNE[st.sahne] || SAHNE.karakol).diz;
            if (diz === 'sira') {
                x.save(); x.globalCompositeOperation = 'lighter';
                for (let i = 0; i < st.n; i++) { const cx = pozA(st, i).x; const vurgu = _suclaMod || (st.sonuc && st.sonuc.i === i); const a = st.x[i] ? .03 : vurgu ? .16 : .09; const g = x.createLinearGradient(cx, 0, cx, AYAK); g.addColorStop(0, 'rgba(255,240,200,' + a * 1.8 + ')'); g.addColorStop(1, 'rgba(255,240,200,' + a * .4 + ')'); x.fillStyle = g; x.beginPath(); x.moveTo(cx - 16, 198); x.lineTo(cx + 16, 198); x.lineTo(cx + 70, AYAK); x.lineTo(cx - 70, AYAK); x.closePath(); x.fill(); }
                x.restore();
            }
            const sira = st.v.s.map((_, i) => i).sort((a, b) => poz(st, a).ayak - poz(st, b).ayak); let on = false;
            sira.forEach((i) => {
                const p = pozA(st, i); if (diz === 'iki' && !p.arka && !on) { sahneOnCiz(x, st); on = true; }
                const d = st.sonuc && st.sonuc.i === i && st.sonuc.dogru ? 'suclu' : st.masum[i] ? 'masum' : st.x[i] ? 'x' : null;
                x.save(); x.translate(p.x, p.ayak); x.scale(p.s, p.s); x.translate(0, -AYAK); supheliCiz(x, st.v.s[i], 0, t, d); x.restore();
            });
            if (diz === 'iki' && !on) sahneOnCiz(x, st);
            if (st.karanlik && st.faz === 'oyun') karanlikCiz(x, st, t);
            if (_suclaMod) { const pu = Math.sin(t / 200) * .5 + .5; st.v.s.forEach((o, i) => { if (st.x[i] || st.masum[i]) return; const p = pozA(st, i); yaz(x, '👆', p.x, p.ayak - (boyH(o) + 60) * p.s - pu * 10, 40, '#fff'); }); }
            for (let i = 0; i < 5; i++) { if (i < st.v.ipucu.length) kartCiz(x, i, st.v.ipucu[i], i < st.acik); else { const px = 14 + i * 251; x.strokeStyle = 'rgba(60,30,10,.35)'; x.setLineDash([8, 8]); x.lineWidth = 2; x.strokeRect(px + 4, 88, 235, 96); x.setLineDash([]); } }
        }
        baykusCiz(x, t);
        if (st.vid) {
            yuv(x, 262, 378, 238, 112, 12); x.fillStyle = '#f5ecd6'; x.fill(); nesneCiz(x, V.nesne, 302, 436, .72);
            x.font = '15px ' + TF; x.fillStyle = '#7a2a1a'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('ÇALINAN:', 338, 398); { const r = kartSatir(x, V.ad, 154); x.font = r.boy + 'px ' + DF; x.fillStyle = '#2a2014'; r.sat.forEach((tt, k) => x.fillText(tt, 338, 430 + k * r.boy * 1.1)); }
        }
        if (st.faz === 'kovala' && st.kov && vVar) kovalaCiz(x, st, t, dt);
        fxCiz(x);
        if (_hamle) hamleCiz(x);
        x.restore();
        if (FX.flash) { x.fillStyle = 'rgba(255,60,40,' + FX.flash * .4 + ')'; x.fillRect(0, 0, W, H); }
        // üst şerit: vaka no + harita parçaları + ad
        x.fillStyle = 'rgba(6,8,14,.92)'; x.fillRect(0, 0, W, 74); x.fillStyle = '#ffc94a'; x.fillRect(0, 72, W, 3);
        const K = kal();
        yaz(x, 'VAKA ' + (st.vaka + 1) + ' · HARİTA', 24, 22, 20, '#ffc94a', { al: 'left' });
        for (let i = 0; i < 5; i++) parcaIkon(x, 214 + i * 24, 22, i < (K.parca || 0));
        { const ad = st.faz === 'zarf' ? 'DOSYA SEÇİLİYOR' : V.ad.toUpperCase(); let fs = 32; x.font = fs + 'px ' + DF; while (x.measureText(ad).width > 320 && fs > 18) { fs -= 2; x.font = fs + 'px ' + DF; } yaz(x, ad, 24, 52, fs, st.vid === 'tilki' ? '#ff9a5a' : '#ffffff', { al: 'left' }); }
        yaz(x, (DZ[st.zor] || DZ.normal).ad.toUpperCase(), 412, 38, 22, st.zor === 'zor' ? '#ff9a6a' : st.zor === 'kolay' ? '#9ff0c4' : '#ffd98a');
        if (st.faz === 'kovala' && st.kov) {
            const kal2 = Math.max(0, st.kov.L - 1 - st.kov.h);
            yaz(x, '🏃 KOVALAMACA!', 490, 26, 28, '#ffd34a', { al: 'left' }); yaz(x, 'Hırsız ' + kal2 + ' çatı sonra kaçar', 490, 56, 18, '#b8c0e0', { al: 'left' });
        } else if (vVar) {
            const kalan = st.maxSaat - st.saat, cx = 520, cy = 37, R = 31;
            x.fillStyle = '#f4efe2'; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineWidth = 4; x.stroke();
            for (let i = 0; i < st.maxSaat; i++) { const a = -Math.PI / 2 + i / st.maxSaat * Math.PI * 2; x.fillStyle = i < st.saat ? '#d23a32' : '#222'; x.beginPath(); x.arc(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, 3.5, 0, 7); x.fill(); }
            const ya = -Math.PI / 2 + st.saat / st.maxSaat * Math.PI * 2; x.strokeStyle = '#d23a32'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ya) * 18, cy + Math.sin(ya) * 18); x.stroke();
            const tehlike = kalan <= 2 && st.faz === 'oyun';
            yaz(x, '🚂 TREN ' + kalan + ' SERİ SONRA', cx + 46, 26, 26, tehlike ? '#ff7a6a' : '#ffffff', { al: 'left', a: tehlike ? .6 + Math.sin(t / 150) * .4 : 1 });
            yaz(x, 'kalkmadan hırsızı bul!', cx + 46, 56, 18, '#b8c0e0', { al: 'left' });
        }
        // şimdi cümlesi (alt şerit)
        if (vVar && (st.faz === 'oyun' || st.faz === 'kovala')) {
            const s = aktifSporcu(), ad = s ? '🏹 ' + ilkAd(s.ad).toUpperCase() + ' atıyor · ' : '';
            yuv(x, SIRA_X0, 664, 744, 48, 14); x.fillStyle = 'rgba(10,12,24,.88)'; x.fill();
            const tumu = st.faz === 'oyun' && st.acik >= st.v.ipucu.length && !st.karanlik;
            const cumle = st.faz === 'kovala' ? ad + 'İyi ok (' + st.esik + '+) = bir atlayış' : st.karanlik ? ad + 'Karanlık! ' + st.esik + '+ ışığı yakar' : tumu ? 'Bütün ipuçları açık! Hırsızı gösterin, 🫵 Suçla' : ad + 'İpucu için ' + st.esik + '+';
            let fs = 28; x.font = fs + 'px ' + DF; while (x.measureText(cumle).width > 720 && fs > 18) { fs -= 2; x.font = fs + 'px ' + DF; }
            yaz(x, cumle, SIRA_X0 + 372, 688, fs, tumu || st.faz === 'kovala' ? '#ffd98a' : '#ffffff');
        }
        if (_suclaMod) { yuv(x, SIRA_X0 + 20, 204, 704, 52, 16); x.fillStyle = 'rgba(140,20,20,.92)'; x.fill(); yaz(x, 'KİMİ SUÇLUYORSUNUZ? ŞÜPHELİYE DOKUN', SIRA_X0 + 372, 230, 26, '#fff'); }
        if (_tren > 0) { _tren += dt / 2200; const tx = lerp(-300, W + 300, Math.min(1, _tren)); x.fillStyle = '#1b1b22'; yuv(x, tx - 160, 560, 320, 90, 14); x.fill(); x.fillStyle = '#d23a32'; x.fillRect(tx - 160, 590, 320, 10); x.fillStyle = '#ffd98a'; for (let i = 0; i < 4; i++) x.fillRect(tx - 140 + i * 70, 572, 40, 22); x.fillStyle = '#222'; for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(tx - 130 + i * 65, 652, 16, 0, 7); x.fill(); } if (_tren >= 1) _tren = 0; }
    }
    function parcaIkon(x, cx, cy, dolu) {
        x.save(); x.translate(cx, cy); x.fillStyle = dolu ? '#ffc94a' : 'rgba(255,255,255,.14)'; x.strokeStyle = dolu ? '#a8742c' : 'rgba(255,255,255,.35)'; x.lineWidth = 2;
        x.beginPath(); x.moveTo(-9, -9); x.lineTo(-3, -9); x.arc(0, -9, 3, Math.PI, 0); x.lineTo(9, -9); x.lineTo(9, -3); x.arc(9, 0, 3, -Math.PI / 2, Math.PI / 2); x.lineTo(9, 9); x.lineTo(-9, 9); x.closePath(); x.fill(); x.stroke(); x.restore();
    }
    function karanlikCiz(x, st, t) {
        x.fillStyle = 'rgba(3,4,12,.92)'; x.fillRect(SIRA_X0 - 10, 198, W, AYAK - 188);
        st.v.s.forEach((o, i) => { if (st.x[i] || st.masum[i]) return; const p = pozA(st, i), by = p.ayak - (boyH(o) - 46) * p.s, k = Math.sin(t / 600 + i * 1.7) > .93 ? .15 : 1; x.fillStyle = '#ffe27a'; [-13, 13].forEach((dx) => { x.beginPath(); x.ellipse(p.x + dx * p.s, by - 2 * p.s, 5 * p.s, 4 * p.s * k, 0, 0, 7); x.fill(); }); });
        yaz(x, '💡 IŞIKLAR SÖNDÜ!', SIRA_X0 + 372, 300, 46, '#ffd34a'); yaz(x, 'İlk ' + st.esik + '+ ok ışığı yakar', SIRA_X0 + 372, 350, 28, '#fff');
    }
    function hamleCiz(x) {
        const u = (performance.now() - _hamle.t) / 3400; if (u >= 1) { _hamle = null; return; }
        const a = u < .08 ? u / .08 : u > .85 ? (1 - u) / .15 : 1, h = HAMLE[_hamle.tip] || HAMLE.yer;
        const cx = SIRA_X0 + 372; let fs = 42; x.font = fs + 'px ' + DF; while (x.measureText(h[0]).width > 640 && fs > 26) { fs -= 2; x.font = fs + 'px ' + DF; }
        x.save(); x.globalAlpha = a; yuv(x, cx - 350, 250, 700, 176, 24); x.fillStyle = 'rgba(90,24,10,.95)'; x.fill(); x.strokeStyle = '#ff9a5a'; x.lineWidth = 5; x.stroke();
        yaz(x, '🦊 HIRSIZIN HAMLESİ', cx, 288, 30, '#ffd34a'); yaz(x, h[0], cx, 340, fs, '#ffffff'); yaz(x, h[1], cx, 392, 26, '#ffe2a0'); x.restore();
    }
    // 🏃 Kovalamaca: L platform (çatı / vagon / kütük); Komiser Baykuş d'de, hırsız h'de. İyi ok = bir atlayış (10/X iki), her seri (Kolay: iki seride bir) hırsız bir platform kaçar.
    function kovX(K, v) { return SIRA_X0 + 50 + v * ((W - SIRA_X0 - 170) / (K.L - 1)); } // sağ alan: sol alt köşe skor dock'una kalır
    function kovY(K, i) { i = Math.max(0, Math.min(K.L - 1, Math.round(i))); if (K.tip === 'tren') return 470; if (K.tip === 'kayik') return 500; return 440 + [0, -40, 20, -25, 15, -45, 5, -15][i % 8]; }
    let _kovGor = null;
    function kovPoz(K, v) { const a = Math.floor(v), b = Math.min(K.L - 1, a + 1), f = v - a; return { x: kovX(K, v), y: lerp(kovY(K, a), kovY(K, b), f) - Math.sin(f * Math.PI) * 70 }; }
    function kovalaCiz(x, st, t, dt) {
        const K = st.kov, T0 = 198;
        const g = x.createLinearGradient(0, T0, 0, H); if (K.tip === 'kayik') { g.addColorStop(0, '#3a5a9a'); g.addColorStop(1, '#6a9ad0'); } else { g.addColorStop(0, '#0b1530'); g.addColorStop(1, '#22305a'); }
        x.fillStyle = g; x.fillRect(0, T0, W, H - T0); x.fillStyle = '#f4f0d0'; x.beginPath(); x.arc(1225, 320, 24, 0, 7); x.fill();
        for (let i = 0; i < K.L; i++) {
            const px = kovX(K, i), py = kovY(K, i), son = i === K.L - 1;
            if (K.tip === 'kayik') { const b = Math.sin(t / 500 + i) * 4; x.fillStyle = son ? '#c23a2a' : '#7a4a22'; yuv(x, px - 46, py + b, 92, 24, 12); x.fill(); x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(px - 50, py + 8 + b, 100, 4); }
            else if (K.tip === 'tren') { x.fillStyle = son ? '#c23a2a' : '#3a4a6a'; yuv(x, px - 50, py, 100, 110, 10); x.fill(); x.fillStyle = '#ffd98a'; x.fillRect(px - 36, py + 20, 28, 24); x.fillRect(px + 8, py + 20, 28, 24); x.fillStyle = '#111'; x.beginPath(); x.arc(px - 30, py + 114, 13, 0, 7); x.fill(); x.beginPath(); x.arc(px + 30, py + 114, 13, 0, 7); x.fill(); }
            else { x.fillStyle = son ? '#4a2a3a' : ['#2a3658', '#33406a', '#26304e'][i % 3]; x.fillRect(px - 50, py, 100, H - py); x.fillStyle = '#ffd98a'; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) if ((i + r + c) % 3) x.fillRect(px - 38 + c * 28, py + 30 + r * 50, 14, 22); x.fillStyle = '#1a2038'; x.fillRect(px - 56, py - 8, 112, 10); }
            if (son) yaz(x, K.tip === 'kayik' ? '🚤 KAÇIŞ' : K.tip === 'tren' ? '🚂 KAÇIŞ' : '🎈 KAÇIŞ', px, py - 120, 24, '#ff8a6a');
        }
        if (K.tip === 'kayik') { x.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 14; i++) x.fillRect(((i * 97 + t / 20) % (W + 100)) - 50, 560 + (i % 4) * 30, 60, 4); }
        if (K.tip === 'tren') { x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 3; for (let i = 0; i < 10; i++) { const yy = 260 + i * 34, xx = W - ((t / 3 + i * 140) % (W + 200)); x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + 80, yy); x.stroke(); } }
        if (!_kovGor) _kovGor = { d: K.d, h: K.h }; const hz = Math.min(1, dt / 160); _kovGor.d += (K.d - _kovGor.d) * hz; _kovGor.h += (K.h - _kovGor.h) * hz;
        const hp = kovPoz(K, _kovGor.h), hr = st.v.s[st.v.h];
        x.save(); x.translate(hp.x, hp.y); x.scale(.42, .42); x.translate(0, -AYAK); supheliCiz(x, hr, 0, t, null); x.restore();
        nesneCiz(x, vakaBul(st.vid).nesne, hp.x + 40, hp.y - 90, .55);
        const dp = kovPoz(K, _kovGor.d), s2 = .5; x.save(); x.translate(dp.x - 150 * s2, dp.y - 548 * s2); x.scale(s2, s2); baykusCiz(x, t, true); x.restore();
        const fark = Math.max(0, K.h - K.d); yuv(x, SIRA_X0 + 80, 214, 580, 60, 16); x.fillStyle = 'rgba(10,12,24,.85)'; x.fill();
        yaz(x, fark <= 1 ? 'ÇOK YAKIN! Bir iyi ok daha!' : 'Hırsıza ' + fark + ' atlayış var', SIRA_X0 + 370, 244, 32, fark <= 1 ? '#ffd34a' : '#ffffff');
    }
    function tiklama(e) {
        const st = durum(); if (st.faz !== 'oyun' || !st.v) return;
        const r = _cv.getBoundingClientRect(); const qx = (e.clientX - r.left - _ox) / _olcek, qy = (e.clientY - r.top - _oy) / _olcek;
        if (qx < SIRA_X0 - 10 || qy < 200 || qy > AYAK + 20) return;
        let i = -1; const sira = st.v.s.map((_, j) => j).sort((a, b) => poz(st, b).ayak - poz(st, a).ayak); // öndeki önce
        for (const j of sira) { const p = poz(st, j), h = boyH(st.v.s[j]) * p.s; if (Math.abs(qx - p.x) < 64 * p.s && qy > p.ayak - h - 40 * p.s && qy < p.ayak + 14) { i = j; break; } }
        if (i < 0 || st.masum[i]) return;
        if (st.karanlik) { fxYazi(SIRA_X0 + 372, 420, 'Karanlıkta göremiyoruz!', '#ffd34a', 32, 60); return; }
        if (_suclaMod) { if (!st.x[i]) suclaSor(i); return; }
        st.x[i] = st.x[i] ? 0 : 1; kaydet(); ses('sec'); if (st.x[i]) fxYazi(SX(st, i), supheliY(st, i, .5), 'BU DEĞİL!', '#ff8a8a', 34, 50);
    }

    /* ---------------- ŞİMDİ ATIYOR KARTI + SEÇİM + ROZET ---------------- */
    // v446 (kullanıcı: "sporcu seçme işini kolaylaştır, kim atıyor görmekte zor"): sahnenin sol üstünde kocaman kart (fotoğraf, ad,
    // rütbe, bu vakanın rozetleri, sonra gelen 2 kişi). Karta dokun → bütün sınıfın yüzleri; yüze dokun → o atar (2 dokunuş).
    let _kimImza = '', _rozetKuyruk = [], _rozetZ = 0;
    function aktifIndex() { return typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0; }
    function avatarHTML(s, j) { const r = typeof kmOyunRenk === 'function' ? kmOyunRenk('dedektif', j) : '#5a6ab0'; return '<span class="ddk-av" style="background:' + r + '">' + (s.foto ? '<img src="' + kacis(s.foto) + '" alt="">' : kacis(s.kisa || String(s.ad).slice(0, 2).toLocaleUpperCase('tr-TR'))) + '</span>'; }
    function rutbeS(s) { return rutbeBul((kal().ipucu || {})[s.g + '|' + s.ad] || 0); }
    function rozetIkon(st, s) { return (((st.vakaRozet || {})[s.g + '|' + s.ad]) || []).map((id) => ROZET[id] ? ROZET[id][0] : '').join(''); }
    function kimCiz(zorla) {
        const el = $('ddk-kim'); if (!el) return; const st = _st || durum(), l = liste(), n = l.length, i = aktifIndex(), s = l[i];
        const goster = !!s && (st.faz === 'oyun' || st.faz === 'kovala');
        const im = [goster, i, s && s.ad, n, s && s.foto, s && rozetIkon(st, s), s && rutbeS(s)[2], n > 1 && l[(i + 1) % n].ad, n > 2 && l[(i + 2) % n].ad].join('|');
        if (!zorla && im === _kimImza) return; _kimImza = im;
        el.hidden = !goster; if (!goster) return;
        const r = rutbeS(s), sonra = []; for (let k = 1; k <= Math.min(2, n - 1); k++) { const j = (i + k) % n; sonra.push('<button type="button" class="ddk-sonra-k" data-j="' + j + '">' + avatarHTML(l[j], j) + '<span>' + kacis(ilkAd(l[j].ad)) + '</span></button>'); }
        el.innerHTML = '<div class="ddk-kim-kutu"><button type="button" class="ddk-kim-ana" id="ddk-kim-btn"><span class="ddk-kim-et">🏹 ŞİMDİ ATIYOR' + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + ' <i>👆 değiştir</i></span><span class="ddk-kim-sat">' + avatarHTML(s, i) + '<span class="ddk-kim-ad"><b>' + kacis(ilkAd(s.ad)) + '</b><small>' + r[1] + ' ' + r[2] + ' <em>' + rozetIkon(st, s) + '</em></small></span></span></button>'
            + (sonra.length ? '<div class="ddk-kim-sonra"><span class="ddk-kim-sl">SONRA</span>' + sonra.join('') + '</div>' : '') + '</div>';
        $('ddk-kim-btn').onclick = secAc;
        el.querySelectorAll('[data-j]').forEach((b) => b.onclick = () => sporcuSec(+b.dataset.j));
    }
    function sporcuSec(j) { if (typeof kmOyunSporcuSec === 'function') kmOyunSporcuSec(j); else _kmOyunAktifIndex = j; ses('sec'); kimCiz(true); }
    function secAc() {
        const l = liste(), st = durum(), ai = aktifIndex();
        const sira = l.map((s, j) => ({ s, j, atti: (st.vakaAtan || []).indexOf(s.ad) !== -1 })).sort((a, b) => (a.atti - b.atti) || (a.j - b.j));
        perde('<div class="ddk-kart ddk-sec"><h2>Kim atıyor?</h2><p>Çocuğa dokun. Önce bu vakada henüz atmayanlar · ✓ = attı</p><div class="ddk-yuzler">' + sira.map((o) => '<button type="button" data-j="' + o.j + '" class="' + (o.j === ai ? 'on' : '') + (o.atti ? ' atti' : '') + '">' + avatarHTML(o.s, o.j) + '<b>' + kacis(ilkAd(o.s.ad)) + '</b><i>' + rutbeS(o.s)[1] + (o.atti ? ' ✓' : '') + '</i></button>').join('') + '</div><div class="ddk-butonlar"><button class="ddk-b ikincil" id="ddk-kapat">Kapat</button></div></div>', (p) => {
            p.querySelectorAll('[data-j]').forEach((b) => b.onclick = () => { sporcuSec(+b.dataset.j); _perdeFaz = null; ddkGuncelle(); });
            p.querySelector('#ddk-kapat').onclick = () => { _perdeFaz = null; ddkGuncelle(); };
        });
        _perdeFaz = 'sec';
    }
    // 🏅 Rozet: her çocuk her vakada her rozetten bir kez alır; ekranda 2 sn "URAZ · ⭐ ALTIN GÖZ rozeti!" (sıra/kazanan değil, kendi atışı)
    function rozetVer(S, s, id) {
        const key = s.g + '|' + s.ad; S.vakaRozet = S.vakaRozet || {}; const v = S.vakaRozet[key] = S.vakaRozet[key] || [];
        if (v.indexOf(id) !== -1) return; v.push(id);
        const K = kal(); const r = K.rozet[key] = K.rozet[key] || {}; r[id] = (r[id] || 0) + 1; kalKaydet();
        rozetSira({ s: { g: s.g, ad: s.ad }, id });
    }
    function ipucuSay(s) {
        const key = s.g + '|' + s.ad, K = kal(), once = rutbeBul(K.ipucu[key] || 0); K.ipucu[key] = (K.ipucu[key] || 0) + 1; kalKaydet();
        const sonra = rutbeBul(K.ipucu[key]); if (sonra !== once) rozetSira({ s: { g: s.g, ad: s.ad }, rutbe: sonra });
    }
    function rozetSira(r) { if (!$('ddk-rozet')) return; _rozetKuyruk.push(r); if (_rozetKuyruk.length > 6) _rozetKuyruk.shift(); rozetOynat(); }
    function rozetOynat() {
        const el = $('ddk-rozet'); if (!el) { _rozetKuyruk = []; return; } if (_rozetZ) return;
        if (_hamle) { _rozetZ = setTimeout(() => { _rozetZ = 0; rozetOynat(); }, 500); return; } // hırsızın hamlesi bandı bitsin
        const r = _rozetKuyruk.shift(); if (!r) { el.hidden = true; return; }
        const l = liste(), j = l.findIndex((o) => o.g === r.s.g && o.ad === r.s.ad), s = j >= 0 ? l[j] : r.s;
        el.innerHTML = avatarHTML(s, Math.max(0, j)) + '<span><b>' + kacis(ilkAd(s.ad)) + '</b>' + (r.rutbe ? '<i>' + r.rutbe[1] + ' artık ' + kacis(r.rutbe[2].toLocaleUpperCase('tr-TR')) + '!</i>' : '<i>' + ROZET[r.id][0] + ' ' + kacis(ROZET[r.id][1].toLocaleUpperCase('tr-TR')) + ' rozeti!</i>') + '</span>';
        el.classList.toggle('rutbe', !!r.rutbe); el.hidden = false; el.classList.remove('oyna'); void el.offsetWidth; el.classList.add('oyna');
        _rozetZ = setTimeout(() => { _rozetZ = 0; el.hidden = true; rozetOynat(); }, 2000);
    }

    /* ---------------- PERDELER (kartlar) ---------------- */
    function perde(html, bag) { const p = $('ddk-perde'); if (!p) return; p.innerHTML = html; p.hidden = false; if (bag) bag(p); }
    function perdeKapat() { const p = $('ddk-perde'); if (p) { p.hidden = true; p.innerHTML = ''; } }
    function zorSecHTML(aktif) { return '<p><b>Zorluk seç:</b></p><div class="ddk-zorsec">' + Object.keys(DZ).map((k) => '<button type="button" data-z="' + k + '" class="' + (k === aktif ? 'on' : '') + '"><span class="n">' + DZ[k].ad + '</span><span class="d">' + DZ[k].d + '</span></button>').join('') + '</div>'; }
    function haritaHTML(parca, yeni) { let h = '<div class="ddk-harita">'; for (let i = 0; i < 5; i++) h += '<span class="' + (i < parca ? 'dolu' : '') + (yeni && i === parca - 1 ? ' yeni' : '') + '">' + (i < parca ? '🧩' : '?') + '</span>'; return h + '<b>🦊</b></div>'; }
    function perdeCiz(st) {
        _perdeFaz = st.faz; const V = vakaBul(st.vid), K = kal();
        if (st.faz === 'oyun' || st.faz === 'kovala') { perdeKapat(); return; }
        if (st.faz === 'zarf') {
            // v446 💌 zarf: sınıf seçer (koç dokunur); seri girilirse ok rastgele birini açar
            perde('<div class="ddk-kart"><span class="ddk-etiket">Komiser Baykuş\'un masası · Vaka ' + (st.vaka + 1) + ' · Harita ' + (K.parca || 0) + '/5</span><h2>Hangi dosyayı açalım?' + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + '</h2><p>Sınıf seçsin: <b>A mı, B mi, C mi?</b></p><div class="ddk-zarflar">' + st.zarflar.map((id, k) => { const v = vakaBul(id); return '<button type="button" data-v="' + id + '"><span class="z-ust">ZARF ' + 'ABC'[k] + '</span><span class="z-ik">' + (SAHNE_IKON[v.sahne] || '📁') + '</span><span class="z-yer">' + kacis(v.yer) + '</span></button>'; }).join('') + '</div>'
                + haritaHTML(K.parca || 0) + (st.vaka === 0 ? zorSecHTML(st.zor) : '') + '<p class="ddk-not">Seri girilirse ok rastgele bir zarf açar ve soruşturma başlar.</p></div>', (p) => {
                p.querySelectorAll('[data-v]').forEach((b) => b.onclick = () => { const s2 = durum(); vakaSec(s2, b.dataset.v); kaydet(); ses('kart'); ddkGuncelle(); });
                p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => { const s2 = durum(); s2.zor = b.dataset.z; s2.esikEl = 0; kaydet(); ses('sec'); _perdeFaz = null; ddkGuncelle(); });
            });
        } else if (st.faz === 'basla') {
            const til = st.vid === 'tilki';
            perde('<div class="ddk-kart' + (til ? ' tilki' : '') + '"><span class="ddk-etiket">' + (til ? '🦊 BÜYÜK VAKA' : 'Gizli dosya · Vaka ' + (st.vaka + 1)) + ' · ' + (SAHNE_IKON[st.sahne] || '') + ' ' + kacis(V.yer) + '</span><h2>' + kacis(V.ad) + '</h2><p>' + (st.rovans ? 'Hırsız yine aynı numarayı yaptı! ' : '') + kacis(V.hikaye.replace('{n}', st.n)) + '</p><p class="ddk-anlat">' + kacis(V.anlat) + '</p><p class="ddk-not">Dikkat: hırsız soruşturma sırasında bir numara yapacak! 🦊</p><div class="ddk-butonlar"><button class="ddk-b" id="ddk-bas">🔍 Soruşturmayı başlat</button></div><p class="ddk-not">İlk seri girilince soruşturma kendiliğinden başlar.</p></div>', (p) => {
                p.querySelector('#ddk-bas').onclick = () => { const s2 = durum(); s2.faz = 'oyun'; kaydet(); ses('kart'); ddkGuncelle(); };
            });
        } else if (st.faz === 'cozuldu') {
            const kz = st.parcaKazandi, til = st.vid === 'tilki';
            perde('<div class="ddk-kart"><div class="ddk-buyuk">' + (kz ? '🔒✅' : '💨🎒') + '</div><span class="ddk-etiket">Vaka kapandı · ' + kacis(V.yer) + '</span><h2>' + (kz ? 'Hırsız yakalandı!' : til ? 'Gölge Tilki kaçtı!' : 'Ganimet bizde, hırsız kaçtı!') + '</h2>'
                + '<p>' + (kz ? 'Hırsızın cebinden haritanın bir parçası çıktı: <b>' + (K.parca || 0) + '/5</b>' + ((K.parca || 0) >= 5 ? ' — Gölge Tilki\'nin yeri bulundu!' : '') : til ? 'Ama haritası bizde. Bir dahaki sefere kaçamayacak!' : 'Bu sefer harita parçası yok. Sıradaki vakada yakalayalım!') + '</p>' + haritaHTML(K.parca || 0, kz)
                + '<p>Bu vakanın dedektifleri:</p>' + adlarHTML(siraliAdlar(st.vakaAtan), st) + '<div class="ddk-butonlar"><button class="ddk-b" id="ddk-dev">' + ((K.parca || 0) >= 5 ? '🦊 Gölge Tilki vakası →' : '💌 Sıradaki zarflar →') + '</button></div></div>', (p) => {
                p.querySelector('#ddk-dev').onclick = () => { zarfHazirla(durum()); kaydet(); ddkGuncelle(); };
            });
        } else if (st.faz === 'kacti') {
            const h = st.v.s[st.v.h];
            perde('<div class="ddk-kart"><div class="ddk-buyuk">🚂💨</div><h2>Tren kalktı!</h2><p>Hırsız ' + h.no + ' numaraydı ve kaçtı… Ama Komiser Baykuş izini sürüyor.</p><p class="ddk-anlat">Komiser Baykuş: "Bir sonraki trene yetişiriz! Bu sefer daha hızlı ipucu toplayalım."</p><div class="ddk-butonlar"><button class="ddk-b kirmizi" id="ddk-rov">🔁 Rövanş: bu vakayı yeniden</button></div></div>', (p) => {
                p.querySelector('#ddk-rov').onclick = () => { const s2 = durum(); vakaKur(s2); s2.rovans = true; s2.faz = 'basla'; kaydet(); ddkGuncelle(); };
            });
        } else if (st.faz === 'final') {
            const hep = siraliAdlar(st.hepAtan);
            perde('<div class="ddk-kart tilki"><div class="ddk-buyuk">🦊🔒👑</div><h2>GÖLGE TİLKİ YAKALANDI!</h2><p>Şehir kurtuldu! ' + (K.sezon - 1 || 1) + '. sezonun kahramanları ' + hep.length + ' okçunun hepsi:</p>' + adlarHTML(hep, st) + '<p>Toplam ' + st.toplamOk + ' ok</p><p class="ddk-anlat">Komiser Baykuş: "Ama duydum ki Tilki\'nin bir kardeşi var… Yeni harita, yeni sezon!"</p><div class="ddk-butonlar"><button class="ddk-b" id="ddk-yeni">🗺️ Yeni sezon</button></div></div>', (p) => {
                p.querySelector('#ddk-yeni').onclick = () => { _st = bosDurum(st.zor); kaydet(); ddkGuncelle(); };
            });
        }
    }
    function zorAyarla(z) { const st = durum(); st.zor = z; st.esikEl = 0; if (st.vid && st.faz !== 'zarf') { vakaKur(st); st.faz = 'basla'; } kaydet(); ses('sec'); _perdeFaz = null; ddkGuncelle(); }
    function zorlukAc() {
        const st = durum();
        perde('<div class="ddk-kart"><h2>⚙️ Zorluk</h2><p>Değiştirirsen bu vaka yeni şüphelilerle baştan başlar.</p>' + zorSecHTML(st.zor) + '<p><b>İpucu için gereken puan:</b></p><div class="ddk-esik">' + [5, 6, 7, 8].map((v) => '<button type="button" data-e="' + v + '" class="' + (v === st.esik ? 'on' : '') + '">' + v + '+</button>').join('') + '</div><div class="ddk-butonlar"><button class="ddk-b ikincil" id="ddk-kapat">Kapat</button></div></div>', (p) => {
            p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => zorAyarla(b.dataset.z));
            p.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => { const s = durum(); s.esik = +b.dataset.e; s.esikEl = s.esik; kaydet(); ses('sec'); zorlukAc(); });
            p.querySelector('#ddk-kapat').onclick = () => { _perdeFaz = null; ddkGuncelle(); };
        });
        _perdeFaz = 'ayar';
    }
    function nasil() {
        perde('<div class="ddk-kart"><h2>🕵️ Nasıl oynanır?</h2><p class="ddk-sol">📣 <b>Koç söyler:</b> "İyi atılan her ok bir ipucu açar. Tren kalkmadan hırsızı hep birlikte bulun!"<br>💌 Her vaka 3 zarftan biri: sınıf seçer, her gün başka yer ve dizilim.<br>🏹 Eşiği geçen ok panoya bir ipucu kartı açar. <b>10/X</b> altın ipucudur: Komiser Baykuş bir masumu eler.<br>🙋 Sınıf "bu değil!" derse şüpheliye dokun, üstü çizilir. Hazır olunca <b>🫵 Suçla</b>.<br>⚠️ Yanlış suçlama 2 seri kaybettirir. Saat dolarsa tren kalkar, hırsız kaçar.<br>🦊 Hırsız bir numara yapar: ışıkları söndürür, yer değiştirir ya da bir ipucunu uçurur.<br>🏃 Doğru suçlayınca hırsız kaçar: her iyi ok bir atlayış, yakalarsak haritanın bir parçası. 5 parça = Gölge Tilki vakası.<br>🏅 Rozetler: ipucu, 10/X, üçü de iyi, önceki serisinden iyi, ışık yakmak, atlayış.<br>⚙️ Zorluk: Kolay (4 şüpheli, uymayanlar kendiliğinden elenir) · Normal · Zor ("DEĞİLDİ" ipuçları).</p><div class="ddk-butonlar"><button class="ddk-b" id="ddk-tamam">Tamam</button></div></div>', (p) => { p.querySelector('#ddk-tamam').onclick = () => { _perdeFaz = null; ddkGuncelle(); }; });
        _perdeFaz = 'nasil';
    }
    function yeniSor() {
        perde('<div class="ddk-kart"><h2>🔄 Bu vaka baştan mı?</h2><p>Yeni şüpheliler ve yeni ipuçları gelir. Vaka numarası aynı kalır.</p><div class="ddk-butonlar"><button class="ddk-b kirmizi" id="ddk-evet">Evet, baştan</button><button class="ddk-b ikincil" id="ddk-hayir">Vazgeç</button></div></div>', (p) => {
            p.querySelector('#ddk-evet').onclick = () => { const s = durum(); if (s.vid && s.faz !== 'zarf') { vakaKur(s); s.faz = 'basla'; } kaydet(); _perdeFaz = null; ddkGuncelle(); };
            p.querySelector('#ddk-hayir').onclick = () => { _perdeFaz = null; ddkGuncelle(); };
        });
        _perdeFaz = 'yeni';
    }
    function suclaSor(i) {
        const st = durum(); _suclaMod = false; hudCiz();
        perde('<div class="ddk-kart"><span class="ddk-etiket">Suçlama</span><h2>' + st.v.s[i].no + ' numara mı?</h2><p>Sınıf emin mi? Herkes "evet" derse koç bassın.</p><div class="ddk-butonlar"><button class="ddk-b kirmizi" id="ddk-evet">🫵 Evet, hırsız bu!</button><button class="ddk-b ikincil" id="ddk-hayir">Vazgeç</button></div></div>', (p) => {
            p.querySelector('#ddk-hayir').onclick = () => { _perdeFaz = null; ddkGuncelle(); };
            p.querySelector('#ddk-evet').onclick = () => { perdeKapat(); _perdeFaz = 'oyun'; sucla(i); };
        });
        _perdeFaz = 'sucla';
    }
    async function sucla(i) {
        const st = durum(); ses('davul'); st.sonuc = { i: i, dogru: null }; await bekle(1300);
        if (i === st.v.h) {
            st.sonuc.dogru = true; kaydet(); ses('dogru'); FX.shake = 12; fxParca(SX(st, i), 300, 80, ['#ffd34a', '#ff7a5a', '#8fe0ff', '#fff'], 12, 7); fxYazi(SX(st, i), 220, 'BULDUK!', '#ffd34a', 64, 120);
            await bekle(1500);
            // v446 🏃 bulduk ama ganimeti kapıp kaçıyor → kovalamaca (her iyi ok bir atlayış)
            const s = durum(); fxYazi(SIRA_X0 + 372, 330, 'GANİMETİ KAPIP KAÇIYOR!', '#ff8a6a', 46, 110); ses('dudu'); kovalaKur(s); kaydet(); ddkGuncelle();
        } else {
            st.sonuc = null; st.masum[i] = 1; st.saat = Math.min(st.maxSaat, st.saat + 2); kaydet();
            ses('yanlis'); FX.flash = .6; FX.shake = 14; fxYazi(SX(st, i), 260, 'MASUM!', '#5ee39b', 56, 100); fxYazi(SIRA_X0 + 372, 260, '⏰ 2 seri kaybettik!', '#ff8a8a', 40, 110);
            if (st.saat >= st.maxSaat) { await bekle(800); kacti(); }
        }
    }
    function kovalaKur(st) {
        const til = st.vid === 'tilki';
        st.kov = { tip: KOV_TIP[st.sahne] || 'cati', L: til ? 8 : 7, d: 0, h: st.zor === 'kolay' ? 2 : (st.zor === 'zor' || til) ? 4 : 3, her: st.zor === 'kolay' ? 2 : 1, sayac: 0 };
        st.sonuc = null; st.faz = 'kovala'; _kovGor = null;
    }
    async function yakaladik(S, gorsel) {
        if (gorsel) { ses('dogru'); FX.shake = 12; const p = kovPoz(S.kov, S.kov.h); fxParca(p.x, p.y - 80, 90, ['#ffd34a', '#ff7a5a', '#8fe0ff', '#fff'], 12, 7); fxYazi(SIRA_X0 + 372, 330, 'YAKALADIK!', '#ffd34a', 76, 120); await bekle(1900); }
        const K = kal(); S.parcaKazandi = true; S.vaka++;
        if (S.vid === 'tilki') { K.parca = 0; K.sezon = (K.sezon || 1) + 1; K.tilki = (K.tilki || 0) + 1; S.faz = 'final'; } else { K.parca = Math.min(5, (K.parca || 0) + 1); S.faz = 'cozuldu'; }
        kalKaydet(); kaydet(); ddkGuncelle();
    }
    async function kacisBitti(S, gorsel) {
        if (gorsel) { ses('yanlis'); fxYazi(SIRA_X0 + 372, 330, S.vid === 'tilki' ? 'GÖLGE TİLKİ KAÇTI!' : 'HIRSIZ KAÇTI…', '#ff8a6a', 56, 110); await bekle(1700); }
        S.parcaKazandi = false; S.vaka++; S.faz = 'cozuldu'; kaydet(); ddkGuncelle();
    }
    // 🦊 Hırsızın hamlesi
    function olayUygula(S, tip, gorsel) {
        if (tip === 'ruzgar' && S.acik < 1) tip = 'yer';
        if (tip === 'karanlik') S.karanlik = true;
        else if (tip === 'ruzgar') { S.acik--; _kartAnim[S.acik] = 0; }
        else yerDegistir(S, gorsel);
        kaydet();
        if (gorsel) { ses('dudu'); FX.flash = .35; FX.shake = 6; _hamle = { t: performance.now(), tip }; }
    }
    function yerDegistir(S, gorsel) {
        const eski = {}; S.v.s.forEach((o, i) => { eski[o.no] = poz(S, i); });
        let perm; do { perm = karistir(S.v.s.map((_, i) => i)); } while (S.n > 1 && perm.every((p, i) => p === i));
        const hNo = S.v.s[S.v.h].no;
        S.v.s = perm.map((j) => S.v.s[j]); S.x = perm.map((j) => S.x[j]); S.masum = perm.map((j) => S.masum[j]); S.v.h = S.v.s.findIndex((o) => o.no === hNo);
        if (gorsel) _yerAnim = { t: performance.now(), eski };
    }
    async function kacti() { const st = durum(); ses('dudu'); _tren = .0001; await bekle(2300); st.faz = 'kacti'; kaydet(); ddkGuncelle(); }

    /* ---------------- SERİ ---------------- */
    function ddkSeri(s, i, kaydedilecek, done) {
        let bitti = false; const bitir = () => { if (!bitti) { bitti = true; try { done(); } catch (e) { } } };
        let st = durum();
        // Kart açıkken seri girildiyse sıradaki adıma geç (koç kartı kapatmayı unuttu)
        if (st.faz === 'final') { _st = bosDurum(st.zor); st = _st; }
        if (st.faz === 'cozuldu') zarfHazirla(st);
        if (st.faz === 'zarf') vakaSec(st, sec(st.zarflar)); // ok rastgele bir zarf açar
        if (st.faz === 'kacti') { vakaKur(st); st.rovans = false; }
        const S = durum(); if (S.faz !== 'kovala') S.faz = 'oyun'; _suclaMod = false; _perdeFaz = null; kaydet(); perdeKapat(); hudCiz();
        const key = s.g + '|' + s.ad, oklar = (kaydedilecek || []).map((k) => okDeger(k.puan));
        if (S.vakaAtan.indexOf(s.ad) === -1) S.vakaAtan.push(s.ad);
        if (S.hepAtan.indexOf(s.ad) === -1) S.hepAtan.push(s.ad);
        S.toplamOk += oklar.length;
        const gorsel = !!(_cv && document.body.contains(_cv) && _cv.offsetParent !== null);
        // 🏅 puana göre rozetler (v446, kullanıcı: "sınıfı motive edecek şeyler, rozet gibi, attığı puana göre")
        const top = oklar.reduce((a, b) => a + b, 0); S.sonTop = S.sonTop || {};
        if (oklar.some((p) => p === 10)) rozetVer(S, s, 'altin');
        if (oklar.length >= 3 && oklar.every((p) => p >= S.esik)) rozetVer(S, s, 'uclu');
        if (S.sonTop[key] != null && top >= S.sonTop[key] + 3) rozetVer(S, s, 'gelisen');
        S.sonTop[key] = top; kaydet();
        if (S.faz === 'kovala') return kovalaSeri(S, s, oklar, gorsel, bitir);
        (async () => {
            for (const p of oklar) {
                if (S.faz !== 'oyun') break;
                if (S.karanlik) { // 💡 önce ışık: ilk iyi ok ışığı yakar (ipucu açmaz)
                    if (gorsel) { ses('cek'); await fxOk(SIRA_X0 + 372, 660, SIRA_X0 + 372 + rnd(-200, 200), 300, 520); }
                    if (p >= S.esik) { S.karanlik = false; rozetVer(S, s, 'isik'); if (gorsel) { ses('kritik'); FX.flash = 0; fxYazi(SIRA_X0 + 372, 300, '💡 IŞIKLAR YANDI!', '#ffd34a', 56, 110); } }
                    else if (gorsel) { fxYazi(SIRA_X0 + 372, 420, p === 0 ? 'ISKA' : 'karanlıkta…', '#e8d8c0', 36); ses('iska'); }
                    kaydet(); if (gorsel) await bekle(120); continue;
                }
                const hedefIp = S.acik < S.v.ipucu.length; const tx = hedefIp ? 14 + S.acik * 251 + 121 : 640, ty = hedefIp ? 136 : 160;
                const isabet = p >= S.esik && hedefIp;
                if (gorsel) { ses('cek'); await fxOk(SIRA_X0 + 372, 660, isabet ? tx : tx + rnd(-140, 140), isabet ? ty : ty + rnd(40, 90), 520); }
                if (isabet) {
                    _kartAnim[S.acik] = 0; S.acik++; S.katki[key] = (S.katki[key] || 0) + 1; rozetVer(S, s, 'iz'); ipucuSay(s);
                    if (gorsel) { ses('kart'); fxParca(tx, ty, 24, ['#ffd34a', '#fff3c4'], 7, 5); fxYazi(tx, ty + 90, '🔍 İPUCU!', '#ffd34a', 46, 80); }
                    if ((DZ[S.zor] || DZ.normal).oto) { const c = S.v.ipucu[S.acik - 1]; S.v.s.forEach((o, j) => { if (!eslesir(o, c) && !S.x[j] && !S.masum[j]) { S.x[j] = 1; if (gorsel) fxYazi(SX(S, j), supheliY(S, j, .5), 'UYMUYOR', '#ff8a8a', 30, 80); } }); }
                    if (p === 10) { const aday = S.v.s.map((_, j) => j).filter((j) => j !== S.v.h && !S.x[j] && !S.masum[j]); if (aday.length) { const m = sec(aday); S.masum[m] = 1; if (gorsel) { ses('kritik'); fxYazi(SX(S, m), supheliY(S, m, .8), '🦉 MASUM!', '#5ee39b', 44, 110); fxYazi(SIRA_X0 + 372, 300, 'ALTIN İPUCU! Komiser birini eledi', '#ffd34a', 36, 120); } } }
                } else if (gorsel) { if (p >= S.esik) { fxYazi(640, 240, 'Bütün ipuçları açık!', '#ffd34a', 30); ses('vur'); } else { fxYazi(tx, 240, p === 0 ? 'ISKA' : 'iz bulunamadı…', '#e8d8c0', 36); ses('iska'); } }
                kaydet();
                if (gorsel) await bekle(120);
            }
            if (S.faz !== 'oyun') { bitir(); return; }
            S.saat++; kaydet();
            if (gorsel) { ses('tik'); if (S.maxSaat - S.saat === 2) { fxYazi(SIRA_X0 + 372, 260, '🚂 Düdük çaldı! 2 seri kaldı!', '#ff8a6a', 38, 120); ses('dudu'); } }
            // 🦊 hırsızın hamlesi (planlanan seriden sonra, ipuçları bitmediyse)
            const ol = (S.olaylar || []).find((o) => o.s === S.saat && !o.oldu);
            if (ol && S.saat < S.maxSaat) { ol.oldu = true; if (gorsel) await bekle(500); olayUygula(S, ol.tip, gorsel); } // rüzgâr açık kart yoksa yer değiştirmeye döner
            bitir();
            if (S.saat >= S.maxSaat) { if (gorsel) kacti(); else { S.faz = 'kacti'; kaydet(); } }
        })().catch(() => bitir());
        setTimeout(bitir, 6000); // emniyet: animasyon takılırsa dock kilitli kalmasın
    }
    function kovalaSeri(S, s, oklar, gorsel, bitir) {
        const K = S.kov;
        (async () => {
            for (const p of oklar) {
                if (S.faz !== 'kovala') break;
                const iyi = p >= S.esik, hd = kovPoz(K, Math.min(K.L - 1, K.d + 1));
                if (gorsel) { ses('cek'); await fxOk(SIRA_X0 + 372, 660, iyi ? hd.x : hd.x + rnd(-80, 80), iyi ? hd.y - 40 : 600, 460); }
                if (iyi) {
                    const adim = p === 10 ? 2 : 1; K.d = Math.min(K.L - 1, K.d + adim); rozetVer(S, s, 'atla');
                    if (gorsel) { ses('vur'); const q = kovPoz(K, K.d); fxYazi(q.x, q.y - 160, adim === 2 ? 'ÇİFT ATLAYIŞ!' : 'HOP!', '#ffd34a', 44, 70); }
                    if (K.d >= K.h) { kaydet(); bitir(); await yakaladik(S, gorsel); return; }
                } else if (gorsel) { const q = kovPoz(K, K.d); fxYazi(q.x, q.y - 150, p === 0 ? 'ISKA' : 'kaydı!', '#e8d8c0', 34); ses('iska'); }
                kaydet(); if (gorsel) await bekle(160);
            }
            if (S.faz === 'kovala') {
                K.sayac++;
                if (K.sayac % K.her === 0) { K.h = Math.min(K.L - 1, K.h + 1); if (gorsel) { ses('tik'); const q = kovPoz(K, K.h); fxYazi(q.x, q.y - 170, 'Hırsız kaçıyor!', '#ff8a6a', 36, 90); } }
                kaydet(); bitir();
                if (K.h >= K.L - 1) { await kacisBitti(S, gorsel); return; }
            }
            bitir();
        })().catch(() => bitir());
        setTimeout(bitir, 6000);
    }

    /* ---------------- GERİ AL / CHIP ---------------- */
    function ddkAnlik() { const a = JSON.parse(JSON.stringify(durum())); a._kal = JSON.parse(JSON.stringify(kal())); return a; }
    function ddkGeriYukle(k) { if (!k) return; zamanTemizle(); k = JSON.parse(JSON.stringify(k)); if (k._kal) { _kal = k._kal; _kalKonum = konum(); kalKaydet(); delete k._kal; } _st = k; _stKonum = konum(); kaydet(); _perdeFaz = null; _yerAnim = null; _hamle = null; _kovGor = null; if (panel()) ddkGuncelle(); }
    function ddkSporcu(g, ad) { const st = durum(); const n = st.katki[g + '|' + ad] || 0; return n ? '🔍' + n : '-'; }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('ddk-css')) return;
        if (!$('ddk-font')) { const l = document.createElement('link'); l.id = 'ddk-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Lilita+One&family=Special+Elite&display=swap'; document.head.appendChild(l); }
        const st = document.createElement('style'); st.id = 'ddk-css';
        st.textContent = `
.km-oyun-panel-dedektif{padding:0;background:#07080c;overflow:hidden}
.ddk-kap{position:absolute;inset:0}
.ddk-kap canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation;cursor:pointer}
.ddk-hud{position:absolute;right:8px;top:6px;display:flex;gap:5px;z-index:2}
.ddk-btn{background:rgba(10,12,24,.85);border:1px solid #3b4680;color:#fff;border-radius:999px;min-width:36px;height:36px;font-size:16px;cursor:pointer;padding:0 10px;font-weight:900}
.ddk-btn.ddk-sucla{background:#c2262f;border-color:#ff7a7a;font-size:17px;padding:0 16px}
.ddk-btn.ddk-sucla.acik{background:#555}
.ddk-perde{position:absolute;inset:0;z-index:12;display:flex;align-items:center;justify-content:center;padding:2%;background:rgba(5,6,14,.62);backdrop-filter:blur(2px)}
.ddk-perde[hidden]{display:none}
.ddk-kart{max-width:800px;width:100%;max-height:100%;overflow:auto;background:linear-gradient(160deg,#e9dcc0,#d6c39c);color:#2a2014;border:2px solid #8a6d3b;border-radius:20px;padding:clamp(12px,2.6vw,26px);display:flex;flex-direction:column;gap:clamp(6px,1.2vw,12px);text-align:center;box-shadow:0 30px 80px rgba(0,0,0,.6)}
.ddk-kart h2{margin:0;font-family:"Special Elite","Courier New",monospace;font-size:clamp(24px,3.6vw,42px);line-height:1.1}
.ddk-kart p{margin:0 auto;max-width:60ch;font-size:clamp(15px,1.9vw,22px);color:#3a2c1a;line-height:1.4}
.ddk-kart .ddk-sol{text-align:left}
.ddk-anlat{font-style:italic;color:#7a3a10!important}
.ddk-not{font-size:13px!important;opacity:.7}
.ddk-etiket{font-size:12px;font-weight:900;letter-spacing:1.4px;text-transform:uppercase;color:#7a5a2a}
.ddk-buyuk{font-size:clamp(34px,6vw,64px);line-height:1}
.ddk-adlar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.ddk-adlar span{background:#2a3566;color:#fff;border-radius:999px;padding:3px 12px;font-weight:800;font-size:clamp(13px,1.6vw,17px)}
.ddk-butonlar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.ddk-b{border:0;cursor:pointer;font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(17px,2.2vw,23px);padding:10px 22px;border-radius:14px;background:#ffc94a;color:#241800}
.ddk-b.kirmizi{background:#d93a3a;color:#fff}.ddk-b.ikincil{background:#2a3566;color:#fff}
.ddk-zorsec{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.ddk-zorsec button{cursor:pointer;border-radius:16px;padding:10px;background:#fff8e6;border:3px solid #c8a868;color:#2a2014;display:flex;flex-direction:column;gap:3px;align-items:center}
.ddk-zorsec button.on{border-color:#ff9a1a;box-shadow:0 0 0 3px rgba(255,154,26,.35)}
.ddk-zorsec .n{font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(17px,2.4vw,25px)}.ddk-zorsec .d{font-weight:800;font-size:12px;opacity:.8}
.ddk-esik{display:flex;gap:8px;justify-content:center}.ddk-esik button{cursor:pointer;border-radius:12px;padding:8px 16px;font-weight:900;font-size:18px;background:#fff8e6;border:2px solid #c8a868}.ddk-esik button.on{border-color:#ff9a1a;background:#ffe2a8}
.ddk-kart.tilki{background:linear-gradient(160deg,#ffd9b0,#e8a870);border-color:#a8501a}
.ddk-adlar span i{font-style:normal}
.ddk-zarflar{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ddk-zarflar button{cursor:pointer;border:0;border-radius:10px;padding:14px 8px 16px;background:linear-gradient(170deg,#e2cc96,#c8a868);color:#2a1708;display:flex;flex-direction:column;align-items:center;gap:6px;box-shadow:0 6px 0 #8a6a38;position:relative;font-family:"Special Elite","Courier New",monospace}
.ddk-zarflar button::before{content:"";position:absolute;left:0;right:0;top:0;height:42%;background:linear-gradient(160deg,#d4b87c,#b8955a);clip-path:polygon(0 0,100% 0,50% 100%);border-radius:10px 10px 0 0}
.ddk-zarflar button:hover{transform:translateY(-3px)}
.ddk-zarflar .z-ust{position:relative;font-weight:900;font-size:clamp(15px,1.9vw,20px)}.ddk-zarflar .z-ik{position:relative;font-size:clamp(34px,5vw,54px);line-height:1}.ddk-zarflar .z-yer{font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(15px,2vw,22px)}
.ddk-harita{display:flex;gap:6px;justify-content:center;align-items:center}
.ddk-harita span{width:clamp(34px,4.5vw,48px);height:clamp(34px,4.5vw,48px);border-radius:8px;border:2px dashed #a8874c;display:grid;place-items:center;font-size:clamp(18px,2.6vw,26px);color:#a8874c;font-weight:900}
.ddk-harita span.dolu{border-style:solid;background:#ffe2a0;color:#2a1708}.ddk-harita span.yeni{animation:ddkParca 1.2s ease 2}
.ddk-harita b{font-size:clamp(24px,3.4vw,34px);margin-left:6px}
@keyframes ddkParca{0%,100%{transform:scale(1)}40%{transform:scale(1.3) rotate(-8deg);box-shadow:0 0 0 6px rgba(255,201,74,.5)}}
.ddk-kim{position:absolute;z-index:3;display:flex;flex-direction:column;gap:.6em}
.ddk-kim[hidden]{display:none}
.ddk-kim-kutu{display:flex;align-items:stretch;background:linear-gradient(160deg,rgba(28,36,70,.97),rgba(14,18,36,.97));border:.3em solid #ffc94a;border-radius:1.6em;box-shadow:0 .6em 1.6em rgba(0,0,0,.5);overflow:hidden}
.ddk-kim-ana{flex:1;min-width:0;cursor:pointer;text-align:left;font:inherit;color:#fff;background:none;border:0;padding:.8em 1em .9em 1.2em;display:flex;flex-direction:column;gap:.5em}
.ddk-kim-ana:hover{background:rgba(255,255,255,.06)}
.ddk-kim-et{font-weight:900;letter-spacing:.12em;font-size:1.6em;color:#ffc94a;display:flex;justify-content:space-between;gap:1em}.ddk-kim-et i:not(.dag-yeni){font-style:normal;letter-spacing:0;color:#b8c0e0;font-size:.85em;font-weight:800}
.ddk-kim-sat{display:flex;align-items:center;gap:1.1em;min-width:0}
.ddk-kim .ddk-av{width:7.6em;height:7.6em;font-size:1em;border-width:.35em}
.ddk-av{flex:none;border-radius:50%;display:grid;place-items:center;overflow:hidden;color:#10131c;font-weight:900;border:3px solid rgba(255,255,255,.85)}
.ddk-av img{width:100%;height:100%;object-fit:cover}
.ddk-kim .ddk-kim-sat .ddk-av{font-size:2.8em;width:2.7em;height:2.7em}
.ddk-kim-ad{display:flex;flex-direction:column;min-width:0;line-height:1.05}
.ddk-kim-ad b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:4em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ddk-kim-ad small{font-size:1.8em;font-weight:800;color:#ffe2a0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ddk-kim-ad em{font-style:normal}
.ddk-kim-sonra{flex:none;width:13em;display:flex;flex-direction:column;justify-content:center;gap:.6em;padding:.8em;border-left:.15em solid rgba(255,255,255,.12)}
.ddk-kim-sl{font-weight:900;letter-spacing:.12em;font-size:1.3em;color:#b8c0e0}
.ddk-sonra-k{cursor:pointer;display:flex;align-items:center;gap:.5em;background:rgba(255,255,255,.06);border:.15em solid #3b4680;color:#fff;border-radius:99em;padding:.2em .8em .2em .25em;font:inherit;font-weight:900;font-size:1.6em;min-width:0}
.ddk-sonra-k span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ddk-sonra-k .ddk-av{width:1.8em;height:1.8em;font-size:.8em;border-width:2px}
.ddk-rozet{position:absolute;z-index:4;display:flex;align-items:center;justify-content:center;gap:1.2em;background:linear-gradient(90deg,rgba(24,60,40,.96),rgba(14,40,28,.96));border:.35em solid #5ee39b;border-radius:99em;padding:.8em 2em;color:#fff;pointer-events:none;box-shadow:0 1em 3em rgba(0,0,0,.5)}
.ddk-rozet[hidden]{display:none}.ddk-rozet.rutbe{background:linear-gradient(90deg,rgba(80,50,10,.96),rgba(50,30,6,.96));border-color:#ffc94a}
.ddk-rozet .ddk-av{width:6em;height:6em;font-size:2.4em;width:2.5em;height:2.5em}
.ddk-rozet span{display:flex;flex-direction:column;line-height:1.05}.ddk-rozet b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:3.6em}.ddk-rozet i{font-style:normal;font-weight:900;font-size:2.6em;color:#ffe27a}
.ddk-rozet.oyna{animation:ddkRozet 2s ease forwards}
@keyframes ddkRozet{0%{opacity:0;transform:scale(.5)}10%{opacity:1;transform:scale(1.08)}16%{transform:scale(1)}85%{opacity:1}100%{opacity:0;transform:translateY(-1em)}}
.ddk-sec .ddk-yuzler{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(84px,11vw,120px),1fr));gap:8px;max-height:52vh;overflow:auto;padding:4px}
.ddk-yuzler button{cursor:pointer;border-radius:14px;border:3px solid transparent;background:#fff8e6;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;color:#2a2014}
.ddk-yuzler button.on{border-color:#ff9a1a;background:#ffe2a8}.ddk-yuzler button.atti{opacity:.6}
.ddk-yuzler .ddk-av{width:clamp(50px,6.4vw,72px);height:clamp(50px,6.4vw,72px);font-size:clamp(18px,2.4vw,26px)}
.ddk-yuzler b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:clamp(15px,1.9vw,20px)}.ddk-yuzler i{font-style:normal;font-size:13px;font-weight:800}
@media (prefers-reduced-motion:reduce){.ddk-rozet.oyna,.ddk-harita span.yeni{animation:none}}
@media (max-width:600px){.ddk-zarflar{grid-template-columns:1fr}.ddk-zarflar button{flex-direction:row;justify-content:center;padding:10px}.ddk-zarflar button::before{display:none}}
@media (max-width:600px){.ddk-zorsec{grid-template-columns:1fr}.ddk-zorsec .d{display:none}.ddk-btn{height:36px;min-width:36px;font-size:15px}}`;
        document.head.appendChild(st);
    }

    window.ddkSahneKur = ddkSahneKur;
    window.ddkGuncelle = ddkGuncelle;
    window.ddkSeri = ddkSeri;
    window.ddkAnlik = ddkAnlik;
    window.ddkGeriYukle = ddkGeriYukle;
    window.ddkSporcu = ddkSporcu;
    // e2e: i. şüphelinin ekrandaki (client) gövde noktası
    window.ddkPozTest = (st, i) => poz(st, i); // e2e: olay yerine göre şüpheli yeri
    window.ddkSupheliNokta = (i) => { if (!_cv) return null; const r = _cv.getBoundingClientRect(), st = durum(); return { x: r.left + _ox + SX(st, i) * _olcek, y: r.top + _oy + supheliY(st, i, .45) * _olcek }; };
})();
