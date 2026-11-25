/* ================================================================================================
   🕵️ DEDEKTİF OKÇULAR — Karışık Sınıf › Oyunlar teması 'dedektif' (v444, 2026-11-22).
   Kullanıcı "oyunlar çok kötü, sadece 3 oyun oynuyoruz" dedi; sunucu kaydında Ortak Canavar + Gizli Kelime (tahmin)
   öne çıktı. 6 fikirlik sayfadan Dedektif + Yanardağ seçildi, "görseller iyi olsun" + "zorluk seviyeleri (bazıları
   zeki, bazıları küçük)" + "dedektifteki yazılar büyük olsun" istendi. Taslak: claude.ai/artifact/NccwUsq6iJ9v9nFJfTqBag
   OYUN: 4–6 çizilmiş şüpheli polis sırasında (şapka/gözlük/bıyık/boy/atkı/çanta/palto = ipucu özellikleri). Eşiği geçen
   ok mantar panoya bir ipucu kartı açar; 10/X "altın ipucu": Komiser Baykuş bir masumu eler. Sınıf "bu değil" der → koç
   şüpheliye dokunup çizer; hazır olunca 🫵 Suçla. Yanlış suçlama 2 seri kaybettirir. İstasyon saati (7–10 seri) dolunca
   tren kalkar, hırsız kaçar (Rövanş). 5 vaka zinciri; final: herkesin adı (asla son atan kahraman değil).
   ZORLUK: DZ tablosu. v466: kartlar KİLİTLİ (eskiden 3–5 iyi ok vakayı bitiriyordu, saat hiç hissedilmiyordu); seviye kalıcı (K.zor).
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js, _skorKaydetCekirdek). Bu dosya yalnız oyun durumu + çizim:
     ddkSahneKur(panel) · ddkGuncelle() · ddkSeri(s, i, kaydedilecek, done) · ddkAnlik() · ddkGeriYukle(k) · ddkSporcu(g, ad)
   v466 DEDEKTİF 3.0 (kullanıcı: "iyi gidiyor ama tekrar ediyor; önce zor, sonra karmaşık zor; animasyon ve farklı karakterler"):
     5 vaka türü (TIP: ipucu avı · yırtık fotoğraf · kim yalan söylüyor · suç ortakları · yalancı şahit), 5 seviye (… Karmaşık, Efsane),
     insan/hayvan/robot/canavar/karışık kadro (46 cins) (dagsk-km-dedektif-kadro.js), 7 hamle, 3 final, 4 yakalama sahnesi, suçlular albümü, seviye atlama.
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
        // kilit = vakadaki bütün kartları açmak için gereken iyi ok (kartlara dağıtılır, sonraki kart daha sağlam) · ceza = yanlış suçlamada giden seri
        // altin: 10/X → 'masum' (baykuş eler, altinMax kez) | 'cift' (iki kilit kırar) · benzer = şüpheliler birbirine benzesin
        kolay: { ad: '🐣 Kolay', d: '4 şüpheli · 10 seri · 5+ · uymayanlar kendiliğinden elenir', n: 4, saat: 10, esik: 5, oto: true, ters: false, kilit: 7, ceza: 2, altin: 'masum', altinMax: 2, tip: ['klasik', 'foto'], hamle: [3] },
        normal: { ad: '🦊 Normal', d: '6 şüpheli · 8 seri · 7+ · kilitli ipuçları', n: 6, saat: 8, esik: 7, oto: false, ters: false, kilit: 11, ceza: 2, altin: 'masum', altinMax: 1, tip: ['klasik', 'foto', 'sorgu'], hamle: [2, 5] },
        zor: { ad: '🧠 Zor', d: '8 benzer şüpheli · 9 seri · 8+ · sağlam kilitler, "DEĞİLDİ" ipuçları', n: 8, saat: 9, esik: 8, oto: false, ters: true, benzer: .5, kilit: 16, ceza: 3, altin: 'cift', tip: ['klasik', 'foto', 'sorgu', 'ortak', 'yalanci'], hamle: [2, 4, 6] },
        karmasik: { ad: '🧩 Karmaşık', d: '8 benzer şüpheli · 10 seri · 8+ · "EN AZ BİRİ / TAM 2 TANESİ", 4 numara', n: 8, saat: 10, esik: 8, oto: false, ters: true, karma: true, benzer: .45, kilit: 18, ceza: 3, altin: 'cift', tip: ['klasik', 'sorgu', 'ortak', 'yalanci'], hamle: [2, 4, 6, 8] },
        efsane: { ad: '💀 Efsane', d: '8 benzer şüpheli · 10 seri · 9+ · yalanlar, ortaklar, 5 numara, hızlı hırsız', n: 8, saat: 10, esik: 9, oto: false, ters: true, karma: true, benzer: .4, kilit: 18, ceza: 4, altin: 'cift', tip: ['sorgu', 'ortak', 'yalanci'], hamle: [1, 3, 5, 7, 9] }
    };
    const DZ_SIRA = ['kolay', 'normal', 'zor', 'karmasik', 'efsane'];
    // Kilitler: toplam iyi ok kartlara bölünür, artan son kartlara gider (3 kart / 11 → 3,4,4). Sorguda kartlar çok olduğundan toplam biraz artar.
    function kilitKur(c, top) { const t = Math.max(c, top + Math.max(0, c - 5)), b = Math.floor(t / c), art = t - b * c; return Array.from({ length: c }, (_, i) => b + (i >= c - art ? 1 : 0)); }
    function kilitN(st, i) { return (st.v && st.v.kilit && st.v.kilit[i]) || 1; }
    function sertMi(z) { return z === 'zor' || z === 'karmasik' || z === 'efsane'; }
    // Vaka türü: her zarf hem yer hem tür taşır; kural tek cümle (koç yüksek sesle okur).
    const TIP = {
        klasik: { ik: '🔍', ad: 'İpucu avı', kural: 'İyi oklar kilidi kırar, kilit bitince ipucu açılır!' },
        foto: { ik: '📸', ad: 'Yırtık fotoğraf', kural: 'Kilidi kırın, hırsızın fotoğrafından bir parça açılsın!' },
        sorgu: { ik: '🤥', ad: 'Kim yalan söylüyor?', kural: 'Masumlar DOĞRU söyler, hırsız YALAN söyler!' },
        ortak: { ik: '👥', ad: 'Suç ortakları', kural: 'İKİ hırsız var! Kırmızı kart 1. hırsız, mavi kart 2. hırsız.' },
        yalanci: { ik: '🎭', ad: 'Yalancı şahit', kural: 'BİR kart yalan! Hırsıza kartların biri hariç hepsi uyar.' }
    };
    const PALTO = { kahve: [DDKK.PALTO.kahve, 'KAHVERENGİ', 'ydi'], gri: [DDKK.PALTO.gri, 'GRİ', 'ydi'], yesil: [DDKK.PALTO.yesil, 'YEŞİL', 'di'], mor: [DDKK.PALTO.mor, 'MOR', 'du'], kirmizi: [DDKK.PALTO.kirmizi, 'KIRMIZI', 'ydı'] };
    const SAPKA = { kirmizi: DDKK.SAPKA.kirmizi, mavi: DDKK.SAPKA.mavi, silindir: '#1b1b22', bere: DDKK.SAPKA.bere };
    const ATKI = DDKK.ATKI;
    const TEN = ['#f6d2b4', '#e8b48e', '#c98d63', '#8d5a3b', '#f1c7a2'];
    const SAC = ['#2a1c14', '#5a3a22', '#a8742c', '#d8b56a', '#1a1a1a', '#8a3a1c'];
    // v446 (kullanıcı: "dedektif popüler ve mükemmel oldu ama hep aynı dizilimde gidiyor"): 5 sabit vaka yerine 18 vakalık havuz,
    // her vaka başında 3 zarftan biri seçilir; her vakanın kendi olay yeri (sahne) ve şüpheli dizilimi var.
    const SAHNE = {
        karakol: { ad: 'Karakol', diz: 'sira', kadro: ['insan', 'karisik', 'hayvan', 'canavar'] }, muze: { ad: 'Müze', diz: 'daginik', kadro: ['insan', 'karisik', 'canavar'], ozel: 'sovalye' }, pastane: { ad: 'Pastane', diz: 'iki', kadro: ['hayvan', 'insan', 'canavar'], ozel: 'palyaco' },
        hayvanat: { ad: 'Hayvanat Bahçesi', diz: 'daginik', kadro: ['hayvan'] }, park: { ad: 'Park', diz: 'daginik', kadro: ['hayvan', 'insan', 'karisik'] }, uzay: { ad: 'Uzay Kampı', diz: 'sira', kadro: ['robot', 'karisik', 'insan'], ozel: 'astronot' },
        kale: { ad: 'Kale', diz: 'merdiven', kadro: ['insan', 'hayvan', 'canavar'], ozel: 'sovalye' }, gar: { ad: 'Tren Garı', diz: 'merdiven', kadro: ['insan', 'karisik'] }, otel: { ad: 'Otel', diz: 'iki', kadro: ['insan', 'hayvan', 'karisik', 'canavar'], ozel: 'ninja' }, gemi: { ad: 'Korsan Gemisi', diz: 'iki', kadro: ['hayvan', 'insan', 'karisik'], ozel: 'korsan' },
        sirk: { ad: 'Sirk', diz: 'yay', kadro: ['hayvan', 'karisik', 'insan'], ozel: 'palyaco' }, kar: { ad: 'Kar Köyü', diz: 'merdiven', kadro: ['hayvan', 'canavar'] }, lunapark: { ad: 'Lunapark', diz: 'yay', kadro: ['karisik', 'insan', 'canavar'], ozel: 'palyaco' }, kamp: { ad: 'Orman Kampı', diz: 'daginik', kadro: ['hayvan', 'insan', 'canavar'], ozel: 'ninja' }, lab: { ad: 'Laboratuvar', diz: 'sira', kadro: ['robot', 'karisik', 'canavar'], ozel: 'dalgic' }
    };
    const SAHNE_IKON = { karakol: '🚓', muze: '🏛️', pastane: '🧁', hayvanat: '🦒', park: '🌳', uzay: '🚀', kale: '🏰', gar: '🚉', otel: '🏨', gemi: '🏴‍☠️', sirk: '🎪', kar: '⛄', lunapark: '🎡', kamp: '⛺', lab: '🧪' };
    const KOV_TIP = { gar: 'tren', gemi: 'kayik', hayvanat: 'kayik', park: 'kayik', kamp: 'kayik', kar: 'kizak', uzay: 'gezegen', lab: 'gezegen', sirk: 'ip', lunapark: 'ip' }; // diğerleri: çatı
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
        { id: 'sirkkitap', ad: 'Sihirbazın Kitabı', yer: 'Büyük Sirk', sahne: 'sirk', nesne: 'kitap', hikaye: 'Sihirbazın numara kitabı gösteriden az önce yok oldu! Sahnede {n} sirk sanatçısı var.', anlat: 'Komiser Baykuş: "Bu bir numara değil, gerçek bir hırsızlık!"' },
        { id: 'sirkkupa', ad: 'Altın Sirk Kupası', yer: 'Büyük Sirk', sahne: 'sirk', nesne: 'kupa', hikaye: 'Sirkin altın kupası çalındı, çadırın ışıkları yanıp sönüyor! {n} sanatçı sıraya girdi.', anlat: 'Komiser Baykuş: "Perde açılmadan hırsızı bulalım!"' },
        { id: 'karkure', ad: 'Kar Kristali', yer: 'Kar Köyü', sahne: 'kar', nesne: 'elmas', hikaye: 'Köye kar yağdıran büyülü kristal kayboldu! Tepede {n} köylü bekliyor.', anlat: 'Komiser Baykuş: "Karlar erimeden iz sürelim!"' },
        { id: 'karpasta', ad: 'Kış Şöleni Pastası', yer: 'Kar Köyü', sahne: 'kar', nesne: 'pasta', hikaye: 'Kış şöleninin üç katlı pastası buharlaştı! Yamaçta {n} köylü görülmüş.', anlat: 'Komiser Baykuş: "Karda ayak izi kalır…"' },
        { id: 'donmedolap', ad: 'Dönme Dolabın Anahtarı', yer: 'Lunapark', sahne: 'lunapark', nesne: 'anahtar', hikaye: 'Dönme dolap durmuyor, çünkü anahtarı çalındı! Lunaparkta {n} kişi vardı.', anlat: 'Komiser Baykuş: "Yukarıdakiler inmeyi bekliyor, acele!"' },
        { id: 'devdondurma', ad: 'Dev Dondurma', yer: 'Lunapark', sahne: 'lunapark', nesne: 'dondurma', hikaye: 'Lunaparkın rekor kıran dev dondurması gitti! {n} ziyaretçi şüpheli.', anlat: 'Komiser Baykuş: "Eriyen damlaları izleyin!"' },
        { id: 'kampharita', ad: 'Orman Haritası', yer: 'Orman Kampı', sahne: 'kamp', nesne: 'harita', hikaye: 'Ormandan çıkış haritası gece çadırdan çalındı! Ateşin başında {n} kampçı var.', anlat: 'Komiser Baykuş: "Gece benim işim. Hu huu!"' },
        { id: 'kampyay', ad: 'Orman Okçusunun Yayı', yer: 'Orman Kampı', sahne: 'kamp', nesne: 'yay', hikaye: 'Orman okçusunun yayı kütüğün üstünden alındı! Ateşin çevresinde {n} kişi toplandı.', anlat: 'Komiser Baykuş: "Bir okçunun yayına dokunulmaz!"' },
        { id: 'zamancarki', ad: 'Zaman Çarkı', yer: 'Gizli Laboratuvar', sahne: 'lab', nesne: 'saat', hikaye: 'Profesörün zaman makinesinin çarkı söküldü! Laboratuvarda {n} şüpheli var.', anlat: 'Komiser Baykuş: "Geçmişe dönemeyiz ama hırsızı bulabiliriz!"' },
        { id: 'ejderyumurta', ad: 'Ejderha Yumurtası', yer: 'Gizli Laboratuvar', sahne: 'lab', nesne: 'yumurta', hikaye: 'Kuluçka makinesindeki ejderha yumurtası kayıp, çatlamasına az kaldı! {n} şüpheli var.', anlat: 'Komiser Baykuş: "Yavru ejderha kime anne diyecek?"' },
        { id: 'uzaytasi', ad: 'Uzay Taşı', yer: 'Uzay Kampı', sahne: 'uzay', nesne: 'elmas', hikaye: 'Aydan getirilen parlak uzay taşı vitrinden kayboldu! {n} astronot adayı sırada.', anlat: 'Komiser Baykuş: "Bu taş karanlıkta parlıyor, iz bırakmış olmalı!"' }
    ];
    // 🦊 Haritanın 5 parçası tamamlanınca gelen büyük vaka
    const TILKI_VAKA = { id: 'tilki', ad: 'Gölge Tilki', yer: 'Tilki\'nin Kalesi', sahne: 'kale', nesne: 'harita', hikaye: 'Haritanın 5 parçası tamam! Bütün hırsızların patronu Gölge Tilki kılık değiştirip {n} kişinin arasına saklandı. Bu sefer kaçarsa başka şehre gider!', anlat: 'Komiser Baykuş: "Yıllardır bu anı bekliyordum. Hep birlikte, okçularım!"' };
    function vakaBul(id) { return id === 'tilki' ? TILKI_VAKA : (VAKALAR.find((v) => v.id === id) || VAKALAR[0]); }
    // 🏅 Rozetler (attığı puana göre) ve rütbe (bütün günlerde açtığı ipucu sayısı) — kalıcı
    const ROZET = { iz: ['🔍', 'İz Sürücü'], altin: ['⭐', 'Altın Göz'], uclu: ['🎯', 'Üçü de İyi'], gelisen: ['📈', 'Gelişen Dedektif'], isik: ['💡', 'Işık Getiren'], atla: ['🏃', 'Usta Takipçi'] };
    const RUTBE = [[0, '🐣', 'Çaylak'], [1, '🔎', 'Dedektif'], [5, '🕵️', 'Müfettiş'], [12, '🎖️', 'Baş Müfettiş'], [25, '👑', 'Kraliyet Dedektifi']];
    function rutbeBul(n) { let r = RUTBE[0]; RUTBE.forEach((x) => { if (n >= x[0]) r = x; }); return r; }
    const OZ = [
        { k: 'sapka', v: ['kirmizi', 'mavi', 'silindir', 'bere', null] }, { k: 'gozluk', v: [true, false] }, { k: 'biyik', v: [true, false] }, { k: 'boy', v: ['uzun', 'kisa'] },
        { k: 'atki', v: ['sari', 'yesil', null] }, { k: 'el', v: ['canta', 'semsiye', 'balon', null] }, { k: 'palto', v: ['kahve', 'gri', 'yesil', 'mor', 'kirmizi'] }, { k: 'desen', v: ['duz', 'cizgili', 'benekli'] }
    ];
    const SAYILAN = ['sapka', 'gozluk', 'biyik', 'atki', 'el'];
    function ozListe(kadro) { return kadro === 'karisik' ? OZ.concat([{ k: 'tur', v: ['insan', 'hayvan', 'robot', 'canavar'] }]) : OZ; }
    function eslesir(o, c) {
        if (c.t === 'veya') return eslesir(o, c.a) || eslesir(o, c.b);
        if (c.t === 'biri') return eslesir(o, c.a) !== eslesir(o, c.b);
        if (c.t === 'say') return SAYILAN.filter((k) => !!o[k]).length === c.n;
        const v = c.k === 'canta' ? (o.el !== undefined ? o.el === 'canta' : !!o.canta) : o[c.k];
        return c.not ? v !== c.v : v === c.v;
    }
    const RENK_AD = { kirmizi: 'KIRMIZI', mavi: 'MAVİ', sari: 'SARI', yesil: 'YEŞİL' };
    const EL_AD = { canta: 'ÇANTA', semsiye: 'ŞEMSİYE', balon: 'BALON' };
    const TUR_AD = { insan: 'İNSAN', hayvan: 'HAYVAN', robot: 'ROBOT ya da UZAYLI', canavar: 'CANAVAR' };
    const DESEN_AD = { duz: 'DÜZ', cizgili: 'ÇİZGİLİ', benekli: 'BENEKLİ' };
    function kisaMetin(c) { const v = c.v; switch (c.k) { case 'sapka': return v === 'silindir' ? 'SİLİNDİR ŞAPKA' : v === 'bere' ? 'BERE' : RENK_AD[v] + ' ŞAPKA'; case 'gozluk': return 'GÖZLÜK'; case 'biyik': return 'BIYIK'; case 'boy': return v === 'uzun' ? 'UZUN BOY' : 'KISA BOY'; case 'atki': return RENK_AD[v] + ' ATKI'; case 'el': return EL_AD[v]; case 'palto': return PALTO[v][1] + ' PALTO'; case 'desen': return DESEN_AD[v] + ' PALTO'; } return ''; }
    function ipucuMetni(c) {
        if (c.t === 'veya') return 'EN AZ BİRİ vardı: ' + kisaMetin(c.a) + ', ' + kisaMetin(c.b);
        if (c.t === 'biri') return 'YALNIZ BİRİ vardı: ' + kisaMetin(c.a) + ', ' + kisaMetin(c.b);
        if (c.t === 'say') return (c.n === 0 ? 'HİÇBİRİ yoktu' : 'TAM ' + c.n + ' TANESİ vardı') + ': şapka, gözlük, bıyık, atkı, elinde eşya';
        const v = c.v;
        if (c.not) {
            if (c.k === 'sapka') return v === null ? 'Şapka TAKIYORDU' : v === 'silindir' ? 'Silindir şapkası YOKTU' : v === 'bere' ? 'Beresi YOKTU' : 'Şapkası ' + RENK_AD[v] + ' DEĞİLDİ';
            if (c.k === 'atki') return v === null ? 'Atkı TAKIYORDU' : 'Atkısı ' + RENK_AD[v] + ' DEĞİLDİ';
            if (c.k === 'palto') return 'Paltosu ' + PALTO[v][1] + ' DEĞİLDİ';
            if (c.k === 'el') return v === null ? 'Elinde BİR ŞEY vardı' : 'Elinde ' + EL_AD[v] + ' YOKTU';
            if (c.k === 'desen') return 'Paltosu ' + DESEN_AD[v] + ' DEĞİLDİ';
            if (c.k === 'tur') return TUR_AD[v] + ' DEĞİLDİ';
        }
        switch (c.k) {
            case 'sapka': return v === 'silindir' ? 'Uzun siyah silindir şapkası vardı' : v === 'bere' ? 'Ponponlu BERE takıyordu' : v ? 'Şapkası ' + RENK_AD[v] + (v === 'mavi' ? 'ydi' : 'ydı') : 'Şapkası YOKTU';
            case 'gozluk': return v ? 'GÖZLÜK takıyordu' : 'Gözlüğü YOKTU';
            case 'biyik': return v ? 'BIYIKLIYDI' : 'Bıyığı YOKTU';
            case 'boy': return v === 'uzun' ? 'UZUN boyluydu' : 'KISA boyluydu';
            case 'atki': return v ? 'Atkısı ' + (v === 'sari' ? 'SARIydı' : 'YEŞİLdi') : 'Atkısı YOKTU';
            case 'canta': return v ? 'Elinde ÇANTA vardı' : 'Çantası YOKTU';
            case 'el': return v ? 'Elinde ' + EL_AD[v] + ' vardı' : 'Elleri BOŞTU';
            case 'palto': return 'Paltosu ' + PALTO[v][1] + PALTO[v][2];
            case 'desen': return v === 'duz' ? 'Paltosu DESENSİZdi' : v === 'cizgili' ? 'Paltosu ÇİZGİLİydi' : 'Paltosu BENEKLİydi';
            case 'tur': return v === 'insan' ? 'İNSANdı' : v === 'hayvan' ? 'HAYVANdı' : v === 'canavar' ? 'CANAVARdı' : 'ROBOT ya da UZAYLIydı';
        }
        return '';
    }
    /* ---- vaka üretimi ---- */
    // v466: kadro büyüdü (kullanıcı: "bugün yine aynı, hep aynı karakterler vardı"): 18 hayvan, 6 robot/uzaylı, 8 canavar, 6 kostümlü insan + 8 saçlı insan.
    // Son vakalarda görünen cinsler (K.sonCins) en sona atılır: aynı yüzler arka arkaya gelmez.
    const HAYVANLAR = ['kedi', 'ayi', 'panda', 'tavsan', 'kurbaga', 'aslan', 'penguen', 'kopek', 'maymun', 'koala', 'fil', 'rakun', 'kaplan', 'inek', 'fare', 'civciv', 'timsah', 'kurt'], ROBOTLAR = ['robot', 'kubbe', 'uzayli', 'tv', 'ampul', 'ahtapot'];
    const CANAVARLAR = ['mumya', 'vampir', 'iskelet', 'balkabagi', 'kardanadam', 'hayalet', 'zombi', 'ejder'], KOSTUM = ['ninja', 'palyaco', 'sovalye', 'astronot', 'korsan', 'dalgic'];
    const HAVUZ = { hayvan: HAYVANLAR, robot: ROBOTLAR, canavar: CANAVARLAR, insan: KOSTUM };
    let _sonCins = [], _ozel = null; // vakaKur doldurur
    function tazeSira(l) { return karistir(l.filter((c) => _sonCins.indexOf(c) === -1)).concat(l.filter((c) => _sonCins.indexOf(c) !== -1).sort((a, b) => _sonCins.indexOf(a) - _sonCins.indexOf(b))); }
    function kimlik(o, cins, tip) { o.cins = cins; const r = DDKK.CINS[cins].r; if (r) o.post = sec(r); o.ten = sec(TEN); o.sac = sec(SAC); o.sacTip = tip != null ? tip : Math.floor(Math.random() * 8); o.tur = DDKK.grup(o); }
    function kisiler(n, kadro, ayni, benzer) {
        const kuy = { hayvan: tazeSira(HAYVANLAR), robot: tazeSira(ROBOTLAR), canavar: tazeSira(CANAVARLAR), insan: tazeSira(KOSTUM) }, ix = { hayvan: 0, robot: 0, canavar: 0, insan: 0 }, sac = karistir([0, 1, 2, 3, 4, 5, 6, 7]), sablon = {}, s = []; let si = 0;
        if (_ozel && kuy.insan.indexOf(_ozel) > 0) kuy.insan = [_ozel].concat(kuy.insan.filter((c) => c !== _ozel));
        const al = (t) => kuy[t][ix[t]++ % kuy[t].length];
        if (ayni) kimlik(sablon, kadro === 'insan' ? (Math.random() < .6 ? al('insan') : 'insan') : al(kadro));
        // karışık kadroda türler dengeli dağılır; insan kadrosunda yarısı kostümlü
        const turler = karistir(Array.from({ length: n }, (_, i) => ['insan', 'hayvan', 'robot', 'canavar'][i % 4])), kostum = karistir(Array.from({ length: n }, (_, i) => i % 2 === 0)), temel = {}; OZ.forEach((z) => temel[z.k] = sec(z.v));
        for (let i = 0; i < n; i++) {
            const o = {}; OZ.forEach((z) => o[z.k] = benzer && z.k !== 'sapka' && z.k !== 'palto' && Math.random() < benzer ? temel[z.k] : sec(z.k === 'sapka' ? z.v.concat([null, null]) : z.v)); // şapka + palto hep serbest (aynı bere herkesi aynı gösteriyordu), başların yarıya yakını açık
            if (ayni) Object.assign(o, sablon); else { const tur = kadro === 'karisik' ? turler[i] : kadro; if (tur === 'insan' && !(kostum[i] && ix.insan < KOSTUM.length)) kimlik(o, 'insan', sac[si++ % 8]); else kimlik(o, al(tur)); }
            o.no = i + 1; o.faz = Math.random() * 6; s.push(o);
        }
        return s;
    }
    function farkli(s, oz) { return new Set(s.map((o) => oz.map((z) => String(o[z.k])).join('|'))).size === s.length; }
    function adaylar(hr, oz, ters) {
        const ad = oz.map((z) => ({ k: z.k, v: hr[z.k] }));
        if (ters) oz.forEach((z) => { if (['sapka', 'atki', 'palto', 'el', 'desen', 'tur'].indexOf(z.k) === -1) return; karistir(z.v.filter((v) => v !== hr[z.k])).slice(0, 2).forEach((v) => ad.push({ k: z.k, v, not: true })); });
        return ad;
    }
    // birleşik ipuçları (Karmaşık / Efsane): hırsız için doğru olanlar
    function karmaAday(hr, oz) {
        const r = [], tek = () => { const z = sec(oz.filter((q) => q.k !== 'tur')); const v = sec(z.v.filter((q) => q !== null && q !== false && q !== 'duz')); return { k: z.k, v }; };
        for (let i = 0; i < 40 && r.length < 12; i++) { const a = tek(), b = tek(); if (a.k === b.k) continue; const t = i % 2 ? 'veya' : 'biri', c = { t, a, b }; if (eslesir(hr, c)) r.push(c); }
        r.push({ t: 'say', n: SAYILAN.filter((k) => !!hr[k]).length }); return r;
    }
    function ayniIp(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
    // havuzdan sırayla seçip hırsızı tek kişiye indiren liste (yari: ilk ipucu en az yarısını ayakta bırakır)
    function indir(s, h, havuz, enAz, enCok, yari) {
        let kalan = s.map((_, i) => i); const ip = [];
        for (const c of havuz) { if (kalan.length === 1) break; if (ip.some((p) => ayniIp(p, c))) continue; const y = kalan.filter((i) => eslesir(s[i], c)); if (y.indexOf(h) === -1) return null; if (y.length < kalan.length) { ip.push(c); kalan = y; } }
        if (kalan.length !== 1 || ip.length < enAz || ip.length > enCok) return null;
        if (yari && s.filter((o) => eslesir(o, ip[0])).length < Math.ceil(s.length / 2)) return null;
        return ip;
    }
    const URET = {
        klasik(n, Z, kadro) {
            const oz = ozListe(kadro), s = kisiler(n, kadro, false, Z.benzer); if (!farkli(s, OZ)) return null; const h = Math.floor(Math.random() * n), hr = s[h];
            const ad = karistir(adaylar(hr, oz, Z.ters)), hv = Z.karma ? karistir(karmaAday(hr, oz).concat(ad.slice(0, 6))) : ad, ip = indir(s, h, hv, n <= 4 ? 2 : Z.karma ? 4 : 3, 5, true);
            if (!ip || (Z.karma ? ip.filter((c) => c.t).length < 2 : Z.ters && ip.filter((c) => c.not).length < 2)) return null; return { s, h, ipucu: ip };
        },
        foto(n, Z, kadro) {
            const oz = OZ.filter((z) => z.k !== 'boy'), s = kisiler(n, kadro === 'karisik' ? sec(['insan', 'hayvan', 'robot', 'canavar']) : kadro, true); if (!farkli(s, oz)) return null; const h = Math.floor(Math.random() * n);
            const ip = indir(s, h, karistir(oz.map((z) => ({ k: z.k, v: s[h][z.k], foto: true }))), n <= 4 ? 2 : 3, 5, true); return ip && { s, h, ipucu: ip };
        },
        // masumlar hırsız hakkında doğru, hırsız yanlış söyler; ifadelerin hepsiyle tutarlı TEK kişi hırsızdır
        sorgu(n, Z, kadro) {
            const oz = ozListe(kadro), s = kisiler(n, kadro, false, Z.benzer); if (!farkli(s, OZ)) return null; const h = Math.floor(Math.random() * n), hr = s[h], ip = [];
            const dogru = karistir(adaylar(hr, oz, Z.ters).concat(Z.karma ? karmaAday(hr, oz) : [])).filter((c) => { const m = s.filter((o) => eslesir(o, c)).length; return m >= 2 && m < n; });
            const z = sec(oz), yl = { k: z.k, v: sec(z.v.filter((v) => v !== hr[z.k])) }; if (!s.some((o) => eslesir(o, yl))) return null;
            let di = 0; for (let j = 0; j < n; j++) { const c = j === h ? yl : dogru[di++]; if (!c) return null; if (ip.some((p) => p.k && p.k === c.k && !!p.not === !!c.not && p.v === c.v)) return null; ip.push(Object.assign({}, c, { no: s[j].no })); }
            const tut = (t) => ip.every((c) => c.no === s[t].no ? !eslesir(s[t], c) : eslesir(s[t], c)); const ok = s.map((_, t) => t).filter(tut);
            return ok.length === 1 && ok[0] === h ? { s, h, ipucu: karistir(ip) } : null;
        },
        ortak(n, Z, kadro) {
            const oz = ozListe(kadro), s = kisiler(n, kadro, false, Z.benzer); if (!farkli(s, OZ)) return null; const p = karistir(s.map((_, i) => i)), h = p[0], h2 = p[1];
            const bul = (q) => indir(s, q, karistir(adaylar(s[q], oz, Z.ters).concat(Z.karma ? karmaAday(s[q], oz).slice(0, 5) : [])), 2, 3, false), a = bul(h), b = bul(h2);
            if (!a || !b || a.length + b.length > 5) return null; const A = a.map((c) => Object.assign({}, c, { kim: 1 })), B2 = b.map((c) => Object.assign({}, c, { kim: 2 })), ip = []; while (A.length || B2.length) { if (A.length) ip.push(A.shift()); if (B2.length) ip.push(B2.shift()); }
            return { s, h, h2, ipucu: ip };
        },
        // tam bir kart yalan: hırsız kartların biri hariç hepsine uyar, başka kimse o kadarına uymaz
        yalanci(n, Z, kadro) {
            const oz = ozListe(kadro), s = kisiler(n, kadro, false, Z.benzer); if (!farkli(s, OZ)) return null; const h = Math.floor(Math.random() * n), hr = s[h], k = 4 + Math.floor(Math.random() * 2);
            const d = [], hv = karistir(adaylar(hr, oz, Z.ters).concat(Z.karma ? karmaAday(hr, oz).slice(0, 6) : [])); for (const c of hv) { if (d.length >= k - 1) break; if (!d.some((q) => (q.k && q.k === c.k) || ayniIp(q, c))) d.push(c); }
            const z = sec(oz.filter((q) => !d.some((c) => c.k === q.k))); if (!z || d.length < k - 1) return null; const yl = { k: z.k, v: sec(z.v.filter((v) => v !== hr[z.k])), yalan: true }; if (!s.some((o) => eslesir(o, yl))) return null;
            const ip = karistir(d.concat([yl])), say = s.map((o) => ip.filter((c) => eslesir(o, c)).length); if (say[h] !== k - 1 || say.some((v, i) => i !== h && v >= k - 1)) return null;
            return { s, h, ipucu: ip };
        }
    };
    function vakaUret(n, Z, tip, kadro) {
        for (let d = 0; d < 6000; d++) { const v = URET[tip](n, Z, kadro); if (v) return v; }
        for (let d = 0; d < 20000; d++) { const v = URET.klasik(6, DZ.normal, 'insan'); if (v) { v.dustu = true; return v; } }
        return null;
    }
    function hirsizMi(v, i) { return i === v.h || (v.h2 != null && i === v.h2); }

    /* ---------------- DURUM ---------------- */
    let _st = null, _stHam = null, _stKonum = null;
    function anahtar() { return 'dag_km_dedektif_' + konum(); }
    function bosDurum(zor) { const st = { tarih: bugun(), zor: zor || (DZ[kal().zor] ? kal().zor : 'normal'), vaka: 0, faz: 'zarf', hepAtan: [], toplamOk: 0, katki: {}, sonTop: {} }; zarfHazirla(st); return st; }
    // 3 zarf: son 10 vakada açılmamışlardan, mümkünse 3 farklı olay yeri. Harita tamamsa zarf yok: Gölge Tilki.
    function zarfHazirla(st) {
        const K = kal();
        if ((K.parca || 0) >= 5) { st.vid = 'tilki'; st.tip = null; vakaKur(st); st.faz = 'basla'; st.rovans = false; return; }
        const son = K.son || [], aday = karistir(VAKALAR.filter((v) => son.indexOf(v.id) === -1)), havuz = aday.length >= 3 ? aday : karistir(VAKALAR.slice());
        const z = []; for (const v of havuz) { if (z.length >= 3) break; if (!z.some((id) => vakaBul(id).sahne === v.sahne)) z.push(v.id); }
        for (const v of havuz) { if (z.length >= 3) break; if (z.indexOf(v.id) === -1) z.push(v.id); }
        st.zarflar = z; st.faz = 'zarf'; st.rovans = false; zarfTipleri(st);
    }
    // 3 zarfa 3 ayrı vaka türü; son oynanan tür en sona kalır
    function zarfTipleri(st) { const t = (DZ[st.zor] || DZ.normal).tip, son = kal().sonTip, l = karistir(t.filter((q) => q !== son)).concat(t.indexOf(son) !== -1 ? [son] : []); st.zarfTip = (st.zarflar || []).map((_, i) => l[i % l.length]); }
    function vakaSec(st, id) { const K = kal(); K.son = (K.son || []).filter((x) => x !== id).concat([id]).slice(-16); const k = (st.zarflar || []).indexOf(id); st.tip = (st.zarfTip || [])[k] || sec((DZ[st.zor] || DZ.normal).tip); K.sonTip = st.tip; kalKaydet(); st.vid = id; vakaKur(st); st.faz = 'basla'; }
    function vakaKur(st) {
        const Z = DZ[st.zor] || DZ.normal, V = vakaBul(st.vid), til = V.id === 'tilki', K = kal();
        if (!TIP[st.tip] || Z.tip.indexOf(st.tip) === -1) st.tip = sec(Z.tip);
        st.sahne = V.sahne; { const SA = SAHNE[st.sahne] || SAHNE.karakol, kd = SA.kadro || ['insan'], yeniK = kd.filter((q) => q !== K.sonKadro); st.kadro = sec(yeniK.length ? yeniK : kd); K.sonKadro = st.kadro; _ozel = SA.ozel || null; } _sonCins = K.sonCins || []; K.zor = st.zor;
        st.n = st.tip === 'sorgu' ? (st.zor === 'kolay' ? 4 : Z.karma || til ? 6 : 5) : til || st.tip === 'ortak' ? Math.max(6, Z.n) : Z.n;
        st.maxSaat = Z.saat + (til || st.tip === 'ortak' ? 1 : 0); st.esik = st.esikEl || Z.esik;
        st.v = vakaUret(st.n, Z, st.tip, st.kadro); if (st.v.dustu) { st.tip = 'klasik'; st.n = st.v.s.length; }
        st.v.kilit = kilitKur(st.v.ipucu.length, Z.kilit + (st.tip === 'sorgu' ? 5 : 0)); if (window.ddkKilitsizTest) st.v.kilit = null; st.dolu = 0; st.altinSay = 0;
        { const cs = [...new Set(st.v.s.map((o) => o.cins))].filter((c) => c !== 'insan'); K.sonCins = (K.sonCins || []).filter((c) => cs.indexOf(c) === -1).concat(cs).slice(-18); }
        st.acik = 0; st.x = Array(st.n).fill(0); st.masum = Array(st.n).fill(0); st.yak = Array(st.n).fill(0); st.saat = 0; st.sonuc = null; st.vakaAtan = []; st.vakaRozet = {};
        st.karanlik = false; st.kov = null; st.parcaKazandi = null; st.yalanAcik = false; st.hata = 0; st.yakAd = null;
        const fin = ['kos', 'kapi', 'balon'].filter((f) => f !== K.sonFinal); st.finalTip = til ? 'kos' : sec(fin);
        // 🦊 Hırsızın hamleleri: hangi seriden sonra ne yapacağı; son vakalardaki hamle tekrar etmez (havuz yeterse)
        const hepsi = st.zor === 'kolay' ? ['yer', 'gazete'] : sertMi(st.zor) ? ['karanlik', 'yer', 'ruzgar', 'gazete', 'sis', 'fare', 'saat'] : ['karanlik', 'yer', 'ruzgar', 'gazete', 'sis', 'fare'];
        const sonH = K.sonHamle || [], taze = hepsi.filter((t) => sonH.indexOf(t) === -1), hv = karistir(taze).concat(karistir(hepsi.filter((t) => taze.indexOf(t) === -1)));
        const zaman = Z.hamle.concat(til && st.zor !== 'kolay' && Z.hamle.length < 2 ? [Z.hamle[0] + 3] : []); st.olaylar = zaman.map((s, i) => ({ s, tip: hv[i % hv.length] }));
        K.sonHamle = sonH.concat(st.olaylar.map((o) => o.tip)).slice(-Math.min(3, hepsi.length - 1)); K.sonFinal = st.finalTip; kalKaydet();
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
        _kal.ipucu = _kal.ipucu || {}; _kal.rozet = _kal.rozet || {}; _kal.album = _kal.album || []; return _kal;
    }
    function kalKaydet() { try { _kalHam = JSON.stringify(_kal); localStorage.setItem(kalAnahtar(), _kalHam); } catch (e) { try { _kalHam = localStorage.getItem(kalAnahtar()); } catch (e2) { } } }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { try { _stHam = localStorage.getItem(anahtar()); } catch (e2) { } } } // hafıza doluysa bellekteki durumla sürer, eski kayda dönmez

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
    const PX0 = SIRA_X0 + 22, PGEN = SIRA_GEN - 40; // şüpheli yerleri: dock ve SIRALAMA sekmesinden içeride
    function SARA(st) { return PGEN / (st.n || 6); }
    function SX(st, i) { return poz(st, i).x; }
    // v446 dizilim (olay yerine göre): sira = polis sırası · merdiven = basamaklarda yükselen · iki = arka sıra (balkon/tezgâh arkası) + ön sıra · daginik = önde/arkada zikzak.
    function poz(st, i) {
        const d = (SAHNE[st.sahne] || SAHNE.karakol).diz, n = st.n || 6;
        const k6 = Math.min(1, Math.pow(6 / n, .85));
        if (d === 'merdiven') { const g = PGEN / n; return { x: PX0 + g * (i + .5), ayak: AYAK - i * (110 / Math.max(1, n - 1)), s: .78 * k6 }; }
        if (d === 'iki') { const arkaN = Math.ceil(n / 2), on = i >= arkaN, k = on ? n - arkaN : arkaN, j = on ? i - arkaN : i, g = PGEN / k; return { x: PX0 + g * (j + .5) + (on ? -g / 5 : g / 5) * (n > 6 ? .6 : 1), ayak: on ? AYAK : 440, s: on ? .72 : .6, arka: !on }; }
        if (d === 'daginik') { const g = PGEN / n, arka = i % 2 === 1; return { x: PX0 + g * (i + .5), ayak: arka ? 560 : AYAK, s: (arka ? .74 : .9) * k6, arka: arka }; }
        if (d === 'yay') { const g = PGEN / n, u = (i + .5) / n; return { x: PX0 + g * (i + .5), ayak: AYAK - Math.sin(u * Math.PI) * 74, s: (.9 - Math.sin(u * Math.PI) * .12) * k6 }; }
        return { x: PX0 + SARA(st) * (i + .5), ayak: AYAK, s: k6 };
    }
    // 🔀 yer değiştirme animasyonu: numarası aynı şüpheli eski yerinden yenisine kayar
    let _yerAnim = null;
    function pozA(st, i) {
        const p = poz(st, i); if (!_yerAnim) return p;
        const u = Math.min(1, (performance.now() - _yerAnim.t) / 1100), e = _yerAnim.eski[st.v.s[i].no]; if (u >= 1) { _yerAnim = null; return p; }
        if (!e) return p; const k = u * u * (3 - 2 * u);
        return { x: lerp(e.x, p.x, k), ayak: lerp(e.ayak, p.ayak, k) - Math.sin(k * Math.PI) * 60, s: lerp(e.s, p.s, k), arka: p.arka };
    }
    function boyH(o) { return DDKK.boyH(o); }
    function supheliY(st, i, oran) { const p = poz(st, i); return p.ayak - boyH(st.v.s[i]) * p.s * (oran == null ? .7 : oran); }
    // Elenen / masum: gölgede kalır (kendi tuvalinde karartılır, arka plan kutulanmaz)
    let _golge = null;
    function golgeTuval(ciz, renk) { const g = _golge || (_golge = document.createElement('canvas')); if (g.width !== 420) { g.width = 420; g.height = 560; } const q = g.getContext('2d'); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1; q.clearRect(0, 0, 420, 560); q.translate(210, 520); ciz(q); q.setTransform(1, 0, 0, 1, 0, 0); q.globalCompositeOperation = 'source-atop'; q.fillStyle = renk; q.fillRect(0, 0, 420, 560); return g; }
    function supheliCiz(x, o, cx, t, durumu, op) {
        const H2 = boyH(o), ust = AYAK - H2; x.save(); x.translate(cx, AYAK);
        if (durumu === 'x' || durumu === 'masum') x.drawImage(golgeTuval((q) => DDKK.kisi(q, o, t, op), 'rgba(8,11,24,.68)'), -210, -520); else DDKK.kisi(x, o, t, op);
        x.restore();
        if (durumu === 'x') { x.save(); x.strokeStyle = 'rgba(240,52,52,.92)'; x.lineWidth = 13; x.lineCap = 'round'; x.beginPath(); x.moveTo(cx - 46, ust + 6); x.lineTo(cx + 46, ust + 138); x.moveTo(cx + 46, ust + 6); x.lineTo(cx - 46, ust + 138); x.stroke(); x.restore(); }
        else if (durumu === 'masum') damga(x, cx, ust + 100, 'MASUM', '#5ee39b', -.2);
        if (durumu === 'suclu') damga(x, cx, ust + 110, 'YAKALANDI', '#ff4a4a', -.18, 30);
    }
    function damga(x, cx, cy, t, renk, rot, boy) { boy = boy || 34; x.save(); x.translate(cx, cy); x.rotate(rot); x.font = boy + 'px ' + DF; const w = x.measureText(t).width + 24; x.strokeStyle = renk; x.lineWidth = 5; yuv(x, -w / 2, -boy * .8, w, boy * 1.6, 8); x.stroke(); x.fillStyle = renk; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 0, 2); x.restore(); }
    function yokCiz(x) { x.strokeStyle = '#d02828'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 24, 0, 7); x.moveTo(-17, -17); x.lineTo(17, 17); x.stroke(); }
    function sapkaIkon(x, renk) { x.fillStyle = shade(renk, -20); x.beginPath(); x.ellipse(0, 10, 26, 6, 0, 0, 7); x.fill(); x.fillStyle = renk; x.beginPath(); x.moveTo(-15, 9); x.quadraticCurveTo(-16, -14, 0, -12); x.quadraticCurveTo(16, -14, 15, 9); x.fill(); }
    function ipucuIkon(x, c, cx, cy) {
        x.save(); x.translate(cx, cy); x.lineCap = 'round';
        if (c.t) { if (c.t === 'say') { x.fillStyle = '#7a2a1a'; x.font = '46px ' + DF; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(c.n, 0, 2); } else { x.scale(.62, .62); ipucuIkon(x, c.a, -2, -32); ipucuIkon(x, c.b, -2, 34); } x.restore(); return; }
        const v = c.v;
        if (c.k === 'el') { if (v === 'semsiye') { x.fillStyle = '#e0488a'; x.beginPath(); x.moveTo(-5, -16); x.lineTo(5, -16); x.lineTo(12, 18); x.lineTo(0, 28); x.lineTo(-12, 18); x.closePath(); x.fill(); x.strokeStyle = '#6a3a1c'; x.lineWidth = 4; x.beginPath(); x.moveTo(0, -16); x.lineTo(0, -24); x.arc(6, -24, 6, Math.PI, 0); x.stroke(); } else if (v === 'balon') { x.fillStyle = '#ff5a7a'; x.beginPath(); x.ellipse(0, -8, 16, 20, 0, 0, 7); x.fill(); x.strokeStyle = '#7a5a4a'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, 12); x.lineTo(3, 30); x.stroke(); } else { x.strokeStyle = '#3a2414'; x.lineWidth = 3; x.beginPath(); x.arc(0, -6, 10, Math.PI, 0); x.stroke(); x.fillStyle = '#7a4a22'; yuv(x, -18, -4, 36, 24, 5); x.fill(); } if (!v && !c.not) yokCiz(x); }
        else if (c.k === 'desen') { x.save(); yuv(x, -22, -22, 44, 44, 8); x.fillStyle = '#7a8496'; x.fill(); x.clip(); if (v === 'cizgili') { x.fillStyle = '#e8ecf4'; for (let i = 0; i < 4; i++) x.fillRect(-22, -20 + i * 12, 44, 5); } else if (v === 'benekli') { x.fillStyle = '#e8ecf4'; [[-12, -12], [8, -12], [-2, 2], [14, 6], [-14, 14], [4, 16]].forEach((p) => { x.beginPath(); x.arc(p[0], p[1], 4.5, 0, 7); x.fill(); }); } x.restore(); }
        else if (c.k === 'tur') { x.font = '36px ' + DF; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#2a2014'; x.fillText(v === 'insan' ? '🧑' : v === 'hayvan' ? '🐾' : v === 'canavar' ? '👻' : '🤖', 0, 2); }
        else if (c.k === 'sapka' && v === 'bere') { x.fillStyle = SAPKA.bere; x.beginPath(); x.moveTo(-20, 12); x.quadraticCurveTo(-20, -18, 0, -18); x.quadraticCurveTo(20, -18, 20, 12); x.fill(); x.fillStyle = '#8ff0c0'; yuv(x, -23, 6, 46, 10, 5); x.fill(); x.fillStyle = '#fff'; x.strokeStyle = '#3a4a44'; x.lineWidth = 2; x.beginPath(); x.arc(0, -20, 7, 0, 7); x.fill(); x.stroke(); }
        else if (c.k === 'sapka') { if (v === 'silindir') { x.fillStyle = '#1b1b22'; x.beginPath(); x.ellipse(0, 12, 24, 5, 0, 0, 7); x.fill(); x.fillRect(-14, -20, 28, 32); x.fillStyle = '#8a1c2a'; x.fillRect(-14, 4, 28, 5); } else sapkaIkon(x, v ? SAPKA[v] : '#6b7484'); if (!v && !c.not) yokCiz(x); }
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
        let son = null; for (const boy of [30, 27, 24, 21, 19, 17, 15]) { x.font = boy + 'px ' + DF; const kel = metin.split(' '), sat = []; let su = ''; for (const k of kel) { const den = su ? su + ' ' + k : k; if (x.measureText(den).width <= gen) su = den; else { if (su) sat.push(su); su = k; } } if (su) sat.push(su); son = { boy, sat }; if (sat.length <= (boy >= 27 ? 2 : boy >= 21 ? 3 : boy >= 19 ? 4 : 5) && sat.every((q) => x.measureText(q).width <= gen)) return son; }
        if (son) return son;
        return { boy: 20, sat: [metin] };
    }
    const _kartAnim = {}; let _kilitAnim = 0;
    // 🔒 kartı açmak için gereken oklar: her nokta bir iyi ok, kırılanlar altın
    function kilitCiz(x, st, i, w, h) {
        const k = kilitN(st, i), bu = i === st.acik && st.faz === 'oyun', dolu = i === st.acik ? Math.min(k, st.dolu || 0) : 0, g = Math.min(27, (w - 30) / k), r = Math.min(10, g * .4), y = h / 2 - 22;
        if (bu) { const pu = .55 + Math.sin(performance.now() / 260) * .35; x.globalAlpha = pu; x.strokeStyle = '#ffd34a'; x.lineWidth = 5; x.strokeRect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4); x.globalAlpha = 1; }
        for (let j = 0; j < k; j++) { const cx = (j - (k - 1) / 2) * g, son = j === dolu - 1 && bu ? Math.max(0, 1 - (performance.now() - _kilitAnim) / 450) : 0; x.beginPath(); x.arc(cx, y, r + son * 7, 0, 7); x.fillStyle = j < dolu ? '#ffc21a' : 'rgba(60,34,12,.28)'; x.fill(); x.lineWidth = 2.5; x.strokeStyle = j < dolu ? '#8a5a08' : 'rgba(60,34,12,.6)'; x.stroke(); if (j < dolu) { x.strokeStyle = '#6a4406'; x.lineWidth = 3; x.beginPath(); x.moveTo(cx - r * .45, y); x.lineTo(cx - r * .1, y + r * .4); x.lineTo(cx + r * .5, y - r * .4); x.stroke(); } }
    }
    function kartGen(st) { return Math.min(243, (W - 28) / Math.max(5, st.v.ipucu.length) - 8); }
    function kartX(st, i) { return 14 + i * (kartGen(st) + 8); }
    function kartCiz(x, st, i, c, acik) {
        const w = kartGen(st), px = kartX(st, i), py = 84, h = 104;
        const anim = _kartAnim[i]; const don = anim != null ? Math.min(1, anim) : 1; const sx = Math.abs(Math.cos(Math.PI * (1 - don)));
        x.save(); x.translate(px + w / 2, py + h / 2); x.rotate(((i * 37) % 7 - 3) * .005); x.scale(acik ? Math.max(.02, sx) : 1, 1);
        x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(-w / 2 + 4, -h / 2 + 5, w, h);
        const goster = acik && don > .5, kr = c.kim === 1 ? '#d23a32' : c.kim === 2 ? '#2f6fd6' : null;
        x.fillStyle = goster ? (c.kim === 2 ? '#e4eeff' : c.not || c.kim === 1 ? '#ffe9e2' : c.t ? '#f0e6ff' : '#f5ecd6') : c.kim === 1 ? '#e2b4a6' : c.kim === 2 ? '#a9c0e2' : '#d9c9a6'; x.fillRect(-w / 2, -h / 2, w, h);
        let bas = 0; const ust = c.no != null ? c.no + ' NUMARA DEDİ Kİ' : kr ? c.kim + '. HIRSIZ' : '';
        if (ust) { bas = 22; x.fillStyle = kr || '#3a4680'; x.fillRect(-w / 2, -h / 2, w, 24); x.font = '17px ' + DF; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(ust, 0, -h / 2 + 13); }
        if (goster) {
            if (c.foto) { const g = h - 10; x.save(); x.translate(-w / 2 + 6, -g / 2); x.fillStyle = '#fff'; x.fillRect(-3, -3, g + 6, g + 6); DDKK.parca(x, st.v.s[st.v.h], c.k, g); x.restore(); x.font = '20px ' + DF; x.fillStyle = '#2a2014'; x.textAlign = 'center'; x.textBaseline = 'middle'; ({ sapka: ['BAŞINA', 'BAK!'], gozluk: ['GÖZÜNE', 'BAK!'], biyik: ['AĞZINA', 'BAK!'], atki: ['BOYNUNA', 'BAK!'], palto: ['PALTO', 'RENGİ!'], desen: ['PALTO', 'DESENİ!'], el: ['ELİNE', 'BAK!'] }[c.k] || ['BAK!']).forEach((t2, k) => x.fillText(t2, w / 2 - (w - g - 10) / 2, -12 + k * 26)); }
            else {
                x.save(); x.translate(-w / 2 + 32, bas / 2); const ik = w < 220 ? .82 : 1; x.scale(ik, ik); ipucuIkon(x, c, 0, 0); x.restore();
                const r = kartSatir(x, ipucuMetni(c), w - 72), b2 = bas && r.boy > 24 ? 24 : r.boy; x.font = b2 + 'px ' + DF; x.fillStyle = c.not ? '#8a1c14' : c.t ? '#4a1f7a' : '#2a2014'; x.textAlign = 'left'; x.textBaseline = 'middle';
                const sh = b2 * 1.08; r.sat.forEach((t2, k) => x.fillText(t2, -w / 2 + 64, (k - (r.sat.length - 1) / 2) * sh + 2 + bas / 2));
            }
            if (c.yalan && st.yalanAcik) { x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(-w / 2, -h / 2, w, h); damga(x, 0, 0, 'YALAN!', '#d21f1f', -.14, 36); }
        } else { x.fillStyle = 'rgba(80,50,20,.5)'; x.font = '44px ' + DF; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(st.tip === 'foto' ? '📷' : c.no != null ? '💬' : '?', 0, -14 + bas / 2); kilitCiz(x, st, i, w, h); }
        x.restore();
        if (!ust) { x.fillStyle = '#d23a32'; x.beginPath(); x.arc(px + w / 2, py + 4, 7, 0, 7); x.fill(); }
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
        if (DDKK.sahne(x, sa)) { if (sa === 'kar') { const n = st.n || 6, g = SIRA_GEN / n; for (let i = 0; i < n; i++) { const p = poz(st, i); x.fillStyle = '#e6f1fb'; x.fillRect(p.x - g / 2, p.ayak, g + 1, B - p.ayak + 2); x.fillStyle = '#fff'; yuv(x, p.x - g / 2 - 2, p.ayak - 6, g + 4, 14, 7); x.fill(); } } return; }
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
        const k = $('ddk-kim'); if (k) { k.style.left = (_ox + 14 * _olcek) + 'px'; k.style.top = (_oy + 204 * _olcek) + 'px'; k.style.maxWidth = (470 * _olcek) + 'px'; k.style.fontSize = Math.max(10 * _olcek, 5) + 'px'; k.classList.toggle('dar', _olcek < .5); }
        const r = $('ddk-rozet'); if (r) { r.style.left = (_ox + 560 * _olcek) + 'px'; r.style.top = (_oy + 206 * _olcek) + 'px'; r.style.width = (680 * _olcek) + 'px'; r.style.fontSize = (10 * _olcek) + 'px'; }
    }
    let _alanSon = 0;
    function alanKontrol(t) { if (t - _alanSon < 400 || !_cv) return; _alanSon = t; const r = _cv.getBoundingClientRect(); if (!r.width) return; const a = serbestAlan(r); const im = [Math.round(r.width), Math.round(r.height), Math.round(a.x0), Math.round(a.x1)].join('|'); if (im !== _alanImza) boyutla(); }
    function ddkSahneKur(p) {
        p = p || panel(); if (!p) return; css(); zamanTemizle(); _suclaMod = false; _tren = 0; _sonucAnim = null; _perdeFaz = null;
        p.innerHTML = `<div class="ddk-kap"><canvas id="ddk-cv"></canvas>
          <div class="ddk-hud"><button class="ddk-btn ddk-sucla" id="ddk-sucla-btn">🫵 Suçla</button><button class="ddk-btn" id="ddk-album-btn" title="Suçlular albümü">📖</button><button class="ddk-btn" id="ddk-zor-btn" title="Zorluk">⚙️</button><button class="ddk-btn" id="ddk-ses-btn" title="Ses">🔊</button><button class="ddk-btn" id="ddk-nasil-btn" title="Nasıl oynanır?">❓</button><button class="ddk-btn" id="ddk-yeni-btn" title="Bu vakayı baştan">🔄</button></div>
          <div class="ddk-kim" id="ddk-kim" hidden></div><div class="ddk-rozet" id="ddk-rozet" hidden></div>
          <div class="ddk-perde" id="ddk-perde" hidden></div></div>`;
        _kimImza = ''; _rozetKuyruk = []; clearTimeout(_rozetZ); _rozetZ = 0; animTemizle();
        _cv = $('ddk-cv'); _ctx = _cv.getContext('2d');
        try { new ResizeObserver(boyutla).observe(_cv); } catch (e) { window.addEventListener('resize', boyutla); }
        boyutla();
        _cv.addEventListener('pointerdown', tiklama);
        $('ddk-sucla-btn').onclick = () => { const st = durum(); if (st.faz !== 'oyun') return; _suclaMod = !_suclaMod; ses('sec'); hudCiz(); };
        $('ddk-zor-btn').onclick = zorlukAc; $('ddk-album-btn').onclick = albumAc;
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
    // v466 canlılık: film (olay canlandırma), giriş yürüyüşü, konuşma balonu, kamera yakınlaşması, yakalama sahnesi, köpek, uçan kart — hepsi yalnız görüntü
    let _film = null, _filmIstek = false, _giris = 0, _balon = null, _balonSon = 0, _bakT = 0, _sevinc = {}, _cam = { x: 0, y: 0, z: 1, hx: 0, hy: 0, hz: 1 }, _yakala = null, _kopek = 0, _ucan = null, _kir = [];
    function animTemizle() { _film = null; _filmIstek = false; _giris = 0; _balon = null; _bakT = 0; _sevinc = {}; _cam = { x: 0, y: 0, z: 1, hx: 0, hy: 0, hz: 1 }; _yakala = null; _kopek = 0; _ucan = null; _kir = []; }
    function kamera(hx, hy, hz) { _cam.hx = hx; _cam.hy = hy; _cam.hz = hz; }
    function gorunur() { return !!(_cv && document.body.contains(_cv) && _cv.offsetParent !== null); }
    const LAF = {
        insan: ['Ben evdeydim!', 'Vallahi ben değilim!', 'Ben sadece geziyordum.', 'Yanlış kişi!', 'Şapkama bakma öyle…', 'Saat kaç oldu ya?'],
        kedi: ['Miyav, uyuyordum!', 'Patim temiz!'], ayi: ['Bal yiyordum!', 'Kış uykum var…'], panda: ['Bambu yiyordum!', 'Ben tembelim, çalmam!'], tavsan: ['Havuç varken ne işim olur!', 'Zıp zıp, ben değilim!'], kurbaga: ['Vırak! Göldeydim!', 'Vırak, masumum!'],
        aslan: ['Kral çalmaz!', 'Yelemi taratıyordum.'], penguen: ['Ben üşüyordum!', 'Balık var mı?'], kopek: ['Hav! Ben bekçiyim!', 'Kemiğimi arıyordum.'], tilki: ['Hihi…', 'Kim, ben mi?'],
        robot: ['BİP BOP. MASUMUM.', 'ŞARJDAYDIM.'], kubbe: ['HATA 404: SUÇ YOK', 'BİİİP!'], uzayli: ['Blup blup?', 'Dün Mars\'taydım!']
    };
    function balonCiz(x, st, t) {
        if (!_balon) return; const u = t - _balon.t; if (u > _balon.sure) { _balon = null; return; }
        const i = st.v.s.findIndex((o) => o.no === _balon.no); if (i < 0) return; const p = pozA(st, i), bs = Math.min(1, u / 180), a = u > _balon.sure - 250 ? (_balon.sure - u) / 250 : 1;
        let fs = 22; x.font = fs + 'px ' + DF; const w = Math.min(320, x.measureText(_balon.m).width + 28), by = Math.max(258, p.ayak - boyH(st.v.s[i]) * p.s - 34), bx = Math.max(SIRA_X0 + w / 2, Math.min(W - 10 - w / 2, p.x));
        x.save(); x.globalAlpha = a; x.translate(bx, by); x.scale(bs, bs); yuv(x, -w / 2, -21, w, 42, 18); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = '#1c1420'; x.lineWidth = 3; x.stroke(); x.beginPath(); x.moveTo(p.x - bx - 8, 19); x.lineTo(p.x - bx, 36); x.lineTo(p.x - bx + 10, 19); x.fillStyle = '#fff'; x.fill(); x.stroke(); x.fillRect(p.x - bx - 6, 16, 14, 5);
        x.fillStyle = '#1c1420'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(_balon.m, 0, 1); x.restore();
    }
    function lafAt(st, t) {
        if (_balon || st.tip === 'sorgu' || st.karanlik || _suclaMod || _hamle || t - _balonSon < 6500) return; _balonSon = t - rnd(0, 1500);
        const l = st.v.s.filter((o, i) => !st.x[i] && !st.masum[i] && !(st.yak || [])[i]); if (!l.length) return; const o = sec(l); _balon = { no: o.no, t, sure: 2300, m: sec(LAF[o.cins || 'insan'] || LAF.insan) };
    }
    // 🎬 olay canlandırma: karanlıkta bir gölge çalınan eşyayla kaçar (2,6 sn; dokun = geç)
    const FILM_MS = 2600;
    function filmCiz(x, st, t) {
        const u = (t - _film.t) / FILM_MS; if (u >= 1) { filmBitir(); return; }
        const V = vakaBul(st.vid), x0 = SIRA_X0 - 10; x.save(); x.beginPath(); x.rect(x0, 198, W - x0, AYAK - 198); x.clip();
        x.fillStyle = 'rgba(4,6,18,.8)'; x.fillRect(x0, 198, W, AYAK); const hx = lerp(W + 60, x0 - 80, Math.max(0, (u - .12) / .8)), al = Math.sin(t / 110) > 0;
        if (u > .35) { x.fillStyle = al ? 'rgba(255,40,40,.20)' : 'rgba(40,90,255,.16)'; x.fillRect(x0, 198, W, AYAK); }
        const iz = lerp(W, x0, Math.max(0, (u - .3) / .75)), g = x.createRadialGradient(iz, 500, 20, iz, 500, 210); g.addColorStop(0, 'rgba(255,245,200,.5)'); g.addColorStop(1, 'rgba(255,245,200,0)'); x.fillStyle = g; x.fillRect(x0, 198, W, AYAK);
        const sil = { cins: 'insan', ten: '#222', sac: '#222', sacTip: 0, faz: 1, boy: 'kisa', palto: 'gri', sapka: 'kirmizi' }; x.save(); x.translate(hx, AYAK - 12); x.scale(-.95, .95); x.drawImage(golgeTuval((q) => DDKK.kisi(q, sil, t, { yuru: t / 85, nosuz: true, egim: .12 }), '#05060e'), -210, -520);
        x.fillStyle = '#ffe27a'; [-13, 13].forEach((d) => { x.beginPath(); x.ellipse(d + 6, -214 - Math.abs(Math.sin(t / 85)) * 8, 6, 5, 0, 0, 7); x.fill(); }); x.restore();
        nesneCiz(x, V.nesne, hx - 62, AYAK - 130 - Math.abs(Math.sin(t / 85)) * 14, .95); x.restore();
        yaz(x, u < .4 ? 'GECE YARISI…' : '🚨 ' + V.ad.toLocaleUpperCase('tr-TR') + ' ÇALINDI!', SIRA_X0 + 372, 262, u < .4 ? 44 : 38, u < .4 ? '#b8c8ff' : '#ff8a6a');
    }
    function filmBitir() { if (!_film) return; _film = null; _perdeFaz = null; ddkGuncelle(); }
    const HAMLE = { karanlik: ['IŞIKLARI SÖNDÜRDÜ!', 'İlk iyi ok ışığı yakar'], yer: ['ŞÜPHELİLER YER DEĞİŞTİRDİ!', 'Numaralara dikkat!'], ruzgar: ['BİR İPUCUNU UÇURDU!', 'Sıradaki iyi ok kartı geri getirir'], fare: ['FARESİ BİR İPUCUNU KAÇIRDI!', 'Sıradaki iyi ok kartı geri getirir'], sis: ['DUMAN BOMBASI ATTI!', 'İlk iyi ok dumanı dağıtır'], gazete: ['HERKESE GAZETE DAĞITTI!', 'İlk iyi ok gazeteleri düşürür'], saat: ['SAATİ 1 SERİ İLERİ ALDI!', 'Tren daha erken kalkacak!'] };
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
        { const k = Math.min(1, dt / 220); _cam.x += (_cam.hx - _cam.x) * k; _cam.y += (_cam.hy - _cam.y) * k; _cam.z += (_cam.hz - _cam.z) * k; }
        if (vVar) {
            const diz = (SAHNE[st.sahne] || SAHNE.karakol).diz, zoom = _cam.z > 1.01, x0 = SIRA_X0 - 10;
            x.save(); x.beginPath(); x.rect(x0, 198, W - x0, H - 198); x.clip();
            if (zoom) { const ox = SIRA_X0 + 372, oy = 430; x.translate(ox, oy); x.scale(_cam.z, _cam.z); x.translate(-lerp(ox, _cam.x, Math.min(1, (_cam.z - 1) * 2)), -lerp(oy, _cam.y, Math.min(1, (_cam.z - 1) * 2))); x.drawImage(_statik, 0, 0, W, H); }
            if (st.faz !== 'kovala') DDKK.canli(x, st.sahne || 'karakol', t);
            if (diz === 'sira') {
                x.save(); x.globalCompositeOperation = 'lighter';
                for (let i = 0; i < st.n; i++) { const cx = pozA(st, i).x; const vurgu = _suclaMod || (st.sonuc && st.sonuc.i === i); const a = st.x[i] ? .03 : vurgu ? .16 : .09; const g = x.createLinearGradient(cx, 0, cx, AYAK); g.addColorStop(0, 'rgba(255,240,200,' + a * 1.8 + ')'); g.addColorStop(1, 'rgba(255,240,200,' + a * .4 + ')'); x.fillStyle = g; x.beginPath(); x.moveTo(cx - 16, 198); x.lineTo(cx + 16, 198); x.lineTo(cx + 70, AYAK); x.lineTo(cx - 70, AYAK); x.closePath(); x.fill(); }
                x.restore();
            }
            const sira = st.v.s.map((_, i) => i).sort((a, b) => poz(st, a).ayak - poz(st, b).ayak); let on = false;
            const gazete = st.karanlik === 'gazete' && st.faz === 'oyun', gu = _giris ? (t - _giris) / 1000 : 99; if (gu > 3) _giris = 0;
            if (!_film) sira.forEach((i) => {
                const p = pozA(st, i), o = st.v.s[i]; if (diz === 'iki' && !p.arka && !on) { sahneOnCiz(x, st); on = true; }
                const suc = st.sonuc && st.sonuc.i === i, d = (suc && st.sonuc.dogru) || (st.yak || [])[i] ? 'suclu' : st.masum[i] ? 'masum' : st.x[i] ? 'x' : null;
                const op = { hareket: d ? 0 : Math.floor(t / 2900 + o.faz * 2) % 6 }; if (op.hareket === 5) op.hareket = 0;
                if (_yerAnim) op.yuru = t / 80; const g2 = gu - i * .12; let gx = 0; if (g2 < 1.2) { const e = Math.max(0, 1 - g2 / 1.2); gx = (W + 120 - p.x) * e; op.yuru = t / 85; }
                if (_bakT && t - _bakT < 1100) { op.bak = p.x > 640 ? -5 : 4; op.bakY = -4; op.hareket = 0; }
                if (_sevinc[o.no] && t - _sevinc[o.no] < 2200) op.mutlu = true;
                if (suc) { op.hareket = 0; if (st.sonuc.dogru) op.teslim = true; op.korku = true; } else if (_suclaMod && !d) op.korku = true;
                if (_balon && _balon.no === o.no && t - _balon.t < _balon.sure - 300) { op.konus = true; op.hareket = 0; }
                if (gazete && !d) op.gazete = true;
                x.save(); x.translate(p.x + gx, p.ayak); x.scale(p.s, p.s); x.translate(0, -AYAK); supheliCiz(x, o, 0, t, d, op); x.restore();
            });
            if (diz === 'iki' && !on) sahneOnCiz(x, st);
            if (_kopek) { const u = (t - _kopek) / 2200; if (u >= 1) _kopek = 0; else { x.save(); x.translate(lerp(x0 - 120, W + 120, u), AYAK + 14); DDKK.kopek(x, t, true); x.restore(); } }
            x.restore();
            if (st.karanlik && st.faz === 'oyun') ortuCiz(x, st, t);
            if (_suclaMod) { const pu = Math.sin(t / 200) * .5 + .5; st.v.s.forEach((o, i) => { if (st.x[i] || st.masum[i] || (st.yak || [])[i]) return; const p = pozA(st, i); yaz(x, '👆', p.x, p.ayak - (boyH(o) + 60) * p.s - pu * 10, 40, '#fff'); }); }
            if (st.faz === 'oyun' && !_film) { lafAt(st, t); balonCiz(x, st, t); }
            const kn = Math.max(5, st.v.ipucu.length); for (let i = 0; i < kn; i++) { if (i < st.v.ipucu.length) kartCiz(x, st, i, st.v.ipucu[i], i < st.acik); else { const px = kartX(st, i); x.strokeStyle = 'rgba(60,30,10,.35)'; x.setLineDash([8, 8]); x.lineWidth = 2; x.strokeRect(px + 4, 88, kartGen(st) - 8, 96); x.setLineDash([]); } }
            if (_ucan) { const u = (t - _ucan.t) / 1500; if (u >= 1) _ucan = null; else if (_ucan.tip === 'fare') { const fx = lerp(_ucan.x, W + 80, u), fy = 182; x.save(); x.translate(fx, fy - Math.abs(Math.sin(t / 60)) * 5); x.fillStyle = '#f5ecd6'; x.fillRect(-70, -40, 76, 36); x.fillStyle = '#8d8f9c'; x.beginPath(); x.ellipse(26, 0, 24, 14, 0, 0, 7); x.fill(); x.beginPath(); x.arc(44, -8, 11, 0, 7); x.fill(); x.fillStyle = '#f7a8b4'; x.beginPath(); x.arc(42, -16, 6, 0, 7); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(49, -9, 2.5, 0, 7); x.fill(); x.strokeStyle = '#f7a8b4'; x.lineWidth = 3; x.beginPath(); x.moveTo(4, 4); x.quadraticCurveTo(-18, 10, -26, -4); x.stroke(); x.restore(); } else { x.save(); x.translate(_ucan.x + u * 620 + Math.sin(u * 9) * 60, 136 + u * 420 - Math.sin(u * 7) * 70); x.rotate(u * 9); x.globalAlpha = 1 - u * .6; x.fillStyle = '#f5ecd6'; x.fillRect(-60, -34, 120, 68); x.strokeStyle = '#8a6d3b'; x.strokeRect(-60, -34, 120, 68); x.restore(); x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = 3; for (let i = 0; i < 6; i++) { const wx = ((t / 2 + i * 220) % (W + 200)) - 100; x.beginPath(); x.moveTo(wx, 220 + i * 60); x.quadraticCurveTo(wx + 60, 206 + i * 60, wx + 130, 222 + i * 60); x.stroke(); } } }
            if (st.faz === 'oyun' && st.tip && st.tip !== 'klasik' && !_suclaMod && !_film) { x.font = '23px ' + DF; const T2 = TIP[st.tip], m = T2.ik + ' ' + T2.kural; yuv(x, SIRA_X0 + 4, 202, 736, 36, 12); x.fillStyle = 'rgba(58,20,92,.9)'; x.fill(); let fs = 23; while (x.measureText(m).width > 712 && fs > 16) { fs--; x.font = fs + 'px ' + DF; } yaz(x, m, SIRA_X0 + 372, 220, fs, '#ffe27a', { kalin: 3 }); }
        }
        baykusCiz(x, t);
        if (st.vid) {
            yuv(x, 262, 378, 238, 112, 12); x.fillStyle = '#f5ecd6'; x.fill(); nesneCiz(x, V.nesne, 302, 436, .72);
            x.font = '15px ' + TF; x.fillStyle = '#7a2a1a'; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillText('ÇALINAN:', 338, 398); { const r = kartSatir(x, V.ad, 154); x.font = r.boy + 'px ' + DF; x.fillStyle = '#2a2014'; r.sat.forEach((tt, k) => x.fillText(tt, 338, 430 + k * r.boy * 1.1)); }
        }
        if (st.faz === 'kovala' && st.kov && vVar) { if (st.kov.mod) finalCiz(x, st, t, dt); else kovalaCiz(x, st, t, dt); }
        if (_yakala && vVar) yakalaCiz(x, st, t);
        if (_film && vVar) filmCiz(x, st, t);
        fxCiz(x);
        if (_hamle) hamleCiz(x);
        x.restore();
        if (FX.flash) { x.fillStyle = 'rgba(255,60,40,' + FX.flash * .4 + ')'; x.fillRect(0, 0, W, H); }
        // üst şerit: vaka no + harita parçaları + ad
        x.fillStyle = 'rgba(6,8,14,.92)'; x.fillRect(0, 0, W, 74); x.fillStyle = '#ffc94a'; x.fillRect(0, 72, W, 3);
        const K = kal();
        yaz(x, 'VAKA ' + (st.vaka + 1) + ' · HARİTA', 24, 22, 20, '#ffc94a', { al: 'left' });
        for (let i = 0; i < 5; i++) parcaIkon(x, 214 + i * 24, 22, i < (K.parca || 0));
        { const ad = st.faz === 'zarf' ? 'DOSYA SEÇİLİYOR' : V.ad.toLocaleUpperCase('tr-TR'); let fs = 32; x.font = fs + 'px ' + DF; while (x.measureText(ad).width > 320 && fs > 18) { fs -= 2; x.font = fs + 'px ' + DF; } yaz(x, ad, 24, 52, fs, st.vid === 'tilki' ? '#ff9a5a' : '#ffffff', { al: 'left' }); }
        yaz(x, (DZ[st.zor] || DZ.normal).ad.toLocaleUpperCase('tr-TR'), 412, 38, 20, st.zor === 'efsane' ? '#ff6a8a' : st.zor === 'karmasik' ? '#d8a8ff' : st.zor === 'zor' ? '#ff9a6a' : st.zor === 'kolay' ? '#9ff0c4' : '#ffd98a');
        if (st.faz === 'kovala' && st.kov) {
            const kal2 = Math.max(0, st.kov.L - 1 - st.kov.h);
            const M = st.kov.mod; yaz(x, M === 'kapi' ? '🚪 KAPILARI KAPAT!' : M === 'balon' ? '🎈 BALONLARI PATLAT!' : '🏃 KOVALAMACA!', 490, 26, 25, '#ffd34a', { al: 'left' }); yaz(x, M ? st.kov.kalan + ' seri sonra kaçar' : 'Hırsız ' + kal2 + ' adım sonra kaçar', 490, 56, 18, '#b8c0e0', { al: 'left' });
        } else if (vVar) {
            const kalan = st.maxSaat - st.saat, cx = 520, cy = 37, R = 31;
            x.fillStyle = '#f4efe2'; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.fill(); x.strokeStyle = '#222'; x.lineWidth = 4; x.stroke();
            for (let i = 0; i < st.maxSaat; i++) { const a = -Math.PI / 2 + i / st.maxSaat * Math.PI * 2; x.fillStyle = i < st.saat ? '#d23a32' : '#222'; x.beginPath(); x.arc(cx + Math.cos(a) * 22, cy + Math.sin(a) * 22, 3.5, 0, 7); x.fill(); }
            const ya = -Math.PI / 2 + st.saat / st.maxSaat * Math.PI * 2; x.strokeStyle = '#d23a32'; x.lineWidth = 4; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(ya) * 18, cy + Math.sin(ya) * 18); x.stroke();
            const tehlike = kalan <= 2 && st.faz === 'oyun';
            yaz(x, '🚂 ' + kalan + ' SERİ KALDI', cx + 46, 26, 25, tehlike ? '#ff7a6a' : '#ffffff', { al: 'left', a: tehlike ? .6 + Math.sin(t / 150) * .4 : 1 });
            yaz(x, 'tren kalkmadan bul!', cx + 46, 56, 17, '#b8c0e0', { al: 'left' });
        }
        // şimdi cümlesi (alt şerit)
        if (vVar && (st.faz === 'oyun' || st.faz === 'kovala')) {
            const s = aktifSporcu(), ad = s ? '🏹 ' + ilkAd(s.ad).toUpperCase() + ' atıyor · ' : '';
            yuv(x, SIRA_X0, 664, 744, 48, 14); x.fillStyle = 'rgba(10,12,24,.88)'; x.fill();
            const tumu = st.faz === 'oyun' && st.acik >= st.v.ipucu.length && !st.karanlik;
            const cumle = st.faz === 'kovala' ? ad + (st.kov && st.kov.mod === 'kapi' ? st.esik + '+ bir kapı kapatır' : st.kov && st.kov.mod === 'balon' ? st.esik + '+ bir balon patlatır' : st.kov && st.kov.muz ? '🍌 ' + st.esik + '+ önce muzu vurur' : 'İyi ok (' + st.esik + '+) = bir atlayış') : st.karanlik ? ad + ORTU[ortu(st)][2].replace('{e}', st.esik) : tumu ? (st.tip === 'sorgu' ? 'Herkes konuştu! Yalancıyı gösterin, 🫵 Suçla' : st.tip === 'ortak' ? 'İki hırsızı da gösterin, 🫵 Suçla' : 'Bütün ipuçları açık! Hırsızı gösterin, 🫵 Suçla') : ad + ((k1) => k1 === 1 ? '1 iyi ok daha (' + st.esik + '+) = ' + (st.tip === 'foto' ? 'yeni parça!' : st.tip === 'sorgu' ? 'biri konuşacak!' : 'yeni ipucu!') : (st.tip === 'foto' ? 'Parça' : st.tip === 'sorgu' ? 'Konuşturmak' : 'İpucu') + ' için ' + k1 + ' iyi ok (' + st.esik + '+)')(kilitN(st, st.acik) - (st.dolu || 0)) + ((DZ[st.zor] || DZ.normal).altin === 'cift' ? ' · 10 = çift' : '');
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
    const ORTU = { karanlik: ['💡 IŞIKLAR SÖNDÜ!', 'İlk {e}+ ok ışığı yakar', 'Karanlık! {e}+ ışığı yakar', '💡 IŞIKLAR YANDI!'], sis: ['🌫️ DUMAN BOMBASI!', 'İlk {e}+ ok dumanı dağıtır', 'Duman! {e}+ dumanı dağıtır', '🌬️ DUMAN DAĞILDI!'], gazete: ['📰 HEPSİ GAZETEYE SAKLANDI!', 'İlk {e}+ ok gazeteleri düşürür', 'Gazeteler! {e}+ gazeteleri düşürür', '📰 GAZETELER DÜŞTÜ!'] };
    function ortu(st) { return ORTU[st.karanlik] ? st.karanlik : 'karanlik'; }
    function ortuCiz(x, st, t) {
        const k = ortu(st), O = ORTU[k], cx = SIRA_X0 + 372; x.save(); x.beginPath(); x.rect(SIRA_X0 - 10, 198, W, AYAK - 190); x.clip();
        if (k === 'karanlik') {
            x.fillStyle = 'rgba(3,4,12,.92)'; x.fillRect(SIRA_X0 - 10, 198, W, AYAK - 188);
            st.v.s.forEach((o, i) => { if (st.x[i] || st.masum[i]) return; const p = pozA(st, i), by = p.ayak - (boyH(o) - 46) * p.s, kp = Math.sin(t / 600 + i * 1.7) > .93 ? .15 : 1; x.fillStyle = '#ffe27a'; [-13, 13].forEach((dx) => { x.beginPath(); x.ellipse(p.x + dx * p.s, by - 2 * p.s, 5 * p.s, 4 * p.s * kp, 0, 0, 7); x.fill(); }); });
        } else if (k === 'sis') {
            x.fillStyle = 'rgba(150,160,176,.55)'; x.fillRect(SIRA_X0 - 10, 198, W, AYAK); for (let i = 0; i < 46; i++) { const px = SIRA_X0 + ((i * 173 + t / (26 + i % 7 * 6)) % 860) - 60, py = 250 + (i * 97 % 390) + Math.sin(t / 900 + i) * 12, r = 62 + i % 5 * 14; x.fillStyle = 'rgba(' + (196 + i % 4 * 10) + ',' + (202 + i % 4 * 10) + ',214,.5)'; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
        }
        x.restore(); if (_hamle) return; const yy = k === 'gazete' ? 262 : 300; let fs = 46; x.font = fs + 'px ' + DF; while (x.measureText(O[0]).width > 690) { fs -= 2; x.font = fs + 'px ' + DF; }
        yaz(x, O[0], cx, yy, fs, '#ffd34a'); yaz(x, O[1].replace('{e}', st.esik), cx, yy + 46, 28, '#fff');
    }
    function hamleCiz(x) {
        const u = (performance.now() - _hamle.t) / 3400; if (u >= 1) { _hamle = null; return; }
        const a = u < .08 ? u / .08 : u > .85 ? (1 - u) / .15 : 1, h = HAMLE[_hamle.tip] || HAMLE.yer, t = performance.now();
        const cx = SIRA_X0 + 372; let fs = 42; x.font = fs + 'px ' + DF; while (x.measureText(h[0]).width > 560 && fs > 24) { fs -= 2; x.font = fs + 'px ' + DF; }
        x.save(); x.globalAlpha = a; yuv(x, cx - 356, 250, 712, 176, 24); x.fillStyle = 'rgba(90,24,10,.95)'; x.fill(); x.strokeStyle = '#ff9a5a'; x.lineWidth = 5; x.stroke();
        // gülen gölge hırsız
        x.save(); x.beginPath(); x.rect(cx - 356, 200, 150, 224); x.clip(); x.translate(cx - 282, 560 + Math.abs(Math.sin(t / 140)) * -14); x.drawImage(golgeTuval((q) => DDKK.kisi(q, { cins: 'insan', ten: '#222', sac: '#222', faz: 1, boy: 'uzun', palto: 'gri', sapka: 'kirmizi', no: null }, t, { nosuz: true }), '#180a12'), -210, -520); x.fillStyle = '#ffe27a'; [-13, 13].forEach((d) => { x.beginPath(); x.ellipse(d, -286, 8, 6, 0, 0, 7); x.fill(); }); x.strokeStyle = '#ffe27a'; x.lineWidth = 4; x.beginPath(); x.arc(0, -270, 14, .2, Math.PI - .2); x.stroke(); x.restore();
        yaz(x, '🦊 HIRSIZIN HAMLESİ', cx + 60, 288, 30, '#ffd34a'); yaz(x, h[0], cx + 60, 340, fs, '#ffffff'); yaz(x, h[1], cx + 60, 392, 25, '#ffe2a0'); x.restore();
    }
    // 🏃 Kovalamaca: L platform (çatı / vagon / kütük); Komiser Baykuş d'de, hırsız h'de. İyi ok = bir atlayış (10/X iki), her seri (Kolay: iki seride bir) hırsız bir platform kaçar.
    function kovX(K, v) { return SIRA_X0 + 84 + v * ((W - SIRA_X0 - 200) / (K.L - 1)); } // sağ alan: sol alt köşe skor dock'una kalır
    function kovY(K, i) { i = Math.max(0, Math.min(K.L - 1, Math.round(i))); if (K.tip === 'kizak') return 480 + [0, 24, -10, 30, 0, 20, -14, 10][i % 8]; if (K.tip === 'gezegen') return 450 + [0, -60, 30, -30, 40, -50, 10, -20][i % 8]; if (K.tip === 'ip') return 470 + [0, -26, 0, -26][i % 4]; if (K.tip === 'tren') return 470; if (K.tip === 'kayik') return 500; return 440 + [0, -40, 20, -25, 15, -45, 5, -15][i % 8]; }
    let _kovGor = null;
    function kovPoz(K, v) { const a = Math.floor(v), b = Math.min(K.L - 1, a + 1), f = v - a; return { x: kovX(K, v), y: lerp(kovY(K, a), kovY(K, b), f) - Math.sin(f * Math.PI) * 70 }; }
    function kovalaCiz(x, st, t, dt) {
        const K = st.kov, T0 = 198;
        const g = x.createLinearGradient(0, T0, 0, H); if (K.tip === 'kayik') { g.addColorStop(0, '#3a5a9a'); g.addColorStop(1, '#6a9ad0'); } else if (K.tip === 'kizak') { g.addColorStop(0, '#6aa8e0'); g.addColorStop(1, '#e8f4ff'); } else if (K.tip === 'ip') { g.addColorStop(0, '#5a1430'); g.addColorStop(1, '#a8304a'); } else if (K.tip === 'gezegen') { g.addColorStop(0, '#05071a'); g.addColorStop(1, '#1a1440'); } else { g.addColorStop(0, '#0b1530'); g.addColorStop(1, '#22305a'); }
        x.fillStyle = g; x.fillRect(0, T0, W, H - T0); x.fillStyle = '#f4f0d0'; x.beginPath(); x.arc(1225, 320, 24, 0, 7); x.fill();
        for (let i = 0; i < K.L; i++) {
            const px = kovX(K, i), py = kovY(K, i), son = i === K.L - 1;
            if (K.tip === 'kayik') { const b = Math.sin(t / 500 + i) * 4; x.fillStyle = son ? '#c23a2a' : '#7a4a22'; yuv(x, px - 46, py + b, 92, 24, 12); x.fill(); x.fillStyle = 'rgba(0,0,0,.2)'; x.fillRect(px - 50, py + 8 + b, 100, 4); }
            else if (K.tip === 'kizak') { x.fillStyle = '#fff'; x.beginPath(); x.ellipse(px, py + 40, 62, 46, 0, Math.PI, 0); x.fill(); x.fillStyle = '#dbeaf8'; x.fillRect(px - 62, py + 39, 124, H - py); if (i % 2) { x.fillStyle = '#2f6a4a'; x.beginPath(); x.moveTo(px + 40, py - 50); x.lineTo(px + 18, py + 12); x.lineTo(px + 62, py + 12); x.fill(); } }
            else if (K.tip === 'gezegen') { const b = Math.sin(t / 700 + i) * 5, rk = ['#c88ae0', '#e8a04a', '#5ab4d9', '#8fd06a'][i % 4]; x.beginPath(); x.arc(px, py + 44 + b, 44, 0, 7); x.fillStyle = son ? '#c23a2a' : rk; x.fill(); x.fillStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.arc(px + 14, py + 54 + b, 10, 0, 7); x.arc(px - 16, py + 38 + b, 7, 0, 7); x.fill(); if (i % 3 === 1) { x.strokeStyle = 'rgba(255,230,180,.7)'; x.lineWidth = 5; x.beginPath(); x.ellipse(px, py + 44 + b, 66, 14, -.25, 0, 7); x.stroke(); } }
            else if (K.tip === 'ip') { x.strokeStyle = '#e8cf86'; x.lineWidth = 4; if (!son) { x.beginPath(); x.moveTo(px, py + 8); x.quadraticCurveTo(px + 48, py + 26, kovX(K, i + 1), kovY(K, i + 1) + 8); x.stroke(); } x.fillStyle = son ? '#c23a2a' : i % 2 ? '#ffd34a' : '#fff'; x.fillRect(px - 8, py + 10, 16, H - py); yuv(x, px - 40, py, 80, 16, 6); x.fillStyle = son ? '#c23a2a' : '#d9382f'; x.fill(); }
            else if (K.tip === 'tren') { x.fillStyle = son ? '#c23a2a' : '#3a4a6a'; yuv(x, px - 50, py, 100, 110, 10); x.fill(); x.fillStyle = '#ffd98a'; x.fillRect(px - 36, py + 20, 28, 24); x.fillRect(px + 8, py + 20, 28, 24); x.fillStyle = '#111'; x.beginPath(); x.arc(px - 30, py + 114, 13, 0, 7); x.fill(); x.beginPath(); x.arc(px + 30, py + 114, 13, 0, 7); x.fill(); }
            else { x.fillStyle = son ? '#4a2a3a' : ['#2a3658', '#33406a', '#26304e'][i % 3]; x.fillRect(px - 50, py, 100, H - py); x.fillStyle = '#ffd98a'; for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) if ((i + r + c) % 3) x.fillRect(px - 38 + c * 28, py + 30 + r * 50, 14, 22); x.fillStyle = '#1a2038'; x.fillRect(px - 56, py - 8, 112, 10); }
            if (son) yaz(x, K.tip === 'kayik' ? '🚤 KAÇIŞ' : K.tip === 'tren' ? '🚂 KAÇIŞ' : '🎈 KAÇIŞ', px, py - 120, 24, '#ff8a6a');
        }
        if (K.tip === 'kayik') { x.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 14; i++) x.fillRect(((i * 97 + t / 20) % (W + 100)) - 50, 560 + (i % 4) * 30, 60, 4); }
        if (K.tip === 'tren') { x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 3; for (let i = 0; i < 10; i++) { const yy = 260 + i * 34, xx = W - ((t / 3 + i * 140) % (W + 200)); x.beginPath(); x.moveTo(xx, yy); x.lineTo(xx + 80, yy); x.stroke(); } }
        if (!_kovGor) _kovGor = { d: K.d, h: K.h }; const hz = Math.min(1, dt / 160); _kovGor.d += (K.d - _kovGor.d) * hz; _kovGor.h += (K.h - _kovGor.h) * hz;
        const hp = kovPoz(K, _kovGor.h), hr = st.v.s[st.v.h];
        if (K.tip === 'gezegen') for (let i = 0; i < 60; i++) { x.fillStyle = 'rgba(255,255,255,' + (.3 + Math.sin(t / 400 + i) * .25) + ')'; x.fillRect((i * 137) % W, T0 + (i * 89) % 440, 2, 2); }
        if (K.muz) { const m = kovPoz(K, Math.min(K.h - .5, K.d + 1)); yaz(x, '🍌', m.x, m.y - 24 - Math.abs(Math.sin(t / 250)) * 10, 46, '#fff', { kontur: false }); }
        const kosar = Math.abs(K.h - _kovGor.h) > .05, hop = { yuru: t / (kosar ? 60 : 150), egim: .1, nosuz: true, maske: st.vid === 'tilki', pelerin: st.vid === 'tilki' };
        if (st.v.h2 != null) { x.save(); x.translate(hp.x - 44, hp.y); x.scale(.38, .38); DDKK.kisi(x, st.v.s[st.v.h2], t + 200, hop); x.restore(); }
        x.save(); x.translate(hp.x, hp.y); x.scale(.42, .42); DDKK.kisi(x, hr, t, hop); x.restore();
        nesneCiz(x, vakaBul(st.vid).nesne, hp.x + 40, hp.y - 90, .55);
        const dp = kovPoz(K, _kovGor.d), s2 = .5; x.save(); x.translate(dp.x - 150 * s2, dp.y - 548 * s2); x.scale(s2, s2); baykusCiz(x, t, true); x.restore();
        const fark = Math.max(0, K.h - K.d); yuv(x, SIRA_X0 + 80, 214, 580, 60, 16); x.fillStyle = 'rgba(10,12,24,.85)'; x.fill();
        yaz(x, fark <= 1 ? 'ÇOK YAKIN! Bir iyi ok daha!' : 'Hırsıza ' + fark + ' atlayış var', SIRA_X0 + 370, 244, 32, fark <= 1 ? '#ffd34a' : '#ffffff');
    }
    // 🚪 kapi / 🎈 balon finali (st.kov = {mod, N, k, kalan, sure}): iyi ok bir kapı kapatır / bir balon patlatır (10/X iki); süre dolmadan hepsi → yakaladık
    function kapiX(K, i) { return SIRA_X0 + 372 + (i - (K.N - 1) / 2) * (700 / K.N); }
    function balonXY(K, i, yuk) { const a = (i - (K.N - 1) / 2); return { x: SIRA_X0 + 372 + a * 62, y: yuk - 178 - Math.cos(a * .5) * 34 }; }
    function balonYuk(K, t) { const u = 1 - K.kalan / K.sure; if (_kovGor == null || _kovGor.y == null) _kovGor = { y: u }; _kovGor.y += (u - _kovGor.y) * .04; return 690 - _kovGor.y * 170 + Math.sin(t / 600) * 8; }
    function finalCiz(x, st, t, dt) {
        const K = st.kov, T0 = 198, x0 = SIRA_X0 - 10, hr = st.v.s[st.v.h], til = st.vid === 'tilki'; x.save(); x.beginPath(); x.rect(x0, T0, W - x0, H - T0); x.clip();
        const g = x.createLinearGradient(0, T0, 0, H);
        if (K.mod === 'kapi') {
            g.addColorStop(0, '#1a1830'); g.addColorStop(1, '#3a3450'); x.fillStyle = g; x.fillRect(x0, T0, W, H); x.strokeStyle = 'rgba(0,0,0,.3)'; x.lineWidth = 2; for (let y = T0; y < 600; y += 30) for (let k = 0; k < 14; k++) x.strokeRect(x0 + k * 60 + ((y / 30) % 2) * 30, y, 60, 30);
            x.fillStyle = '#2a2438'; x.fillRect(x0, 600, W, 120); const gen = Math.min(120, 700 / K.N - 26);
            for (let i = 0; i < K.N; i++) { const px = kapiX(K, i), kp = i < K.k; x.fillStyle = kp ? '#141020' : '#8fd0f0'; x.beginPath(); x.moveTo(px - gen / 2, 600); x.lineTo(px - gen / 2, 400); x.arc(px, 400, gen / 2, Math.PI, 0); x.lineTo(px + gen / 2, 600); x.closePath(); x.fill(); if (!kp) { x.fillStyle = '#5aa04a'; x.fillRect(px - gen / 2, 560, gen, 40); x.fillStyle = '#f4f0d0'; x.beginPath(); x.arc(px, 430, 16, 0, 7); x.fill(); } x.strokeStyle = '#c8a050'; x.lineWidth = 8; x.beginPath(); x.moveTo(px - gen / 2, 600); x.lineTo(px - gen / 2, 400); x.arc(px, 400, gen / 2, Math.PI, 0); x.lineTo(px + gen / 2, 600); x.stroke();
                if (kp) { const d = Math.min(1, (t - (_kir[i] || 0)) / 350), yy = -260 * (1 - d * d); x.save(); x.beginPath(); x.rect(px - gen / 2, 400 - gen / 2, gen, 202 + gen / 2); x.clip(); x.translate(0, yy); x.strokeStyle = '#5a6478'; x.lineWidth = 9; for (let k = 0; k < 5; k++) { const bx = px - gen / 2 + (k + .5) * gen / 5; x.beginPath(); x.moveTo(bx, 400 - gen / 2); x.lineTo(bx, 600); x.stroke(); } [430, 510, 585].forEach((y) => { x.beginPath(); x.moveTo(px - gen / 2, y); x.lineTo(px + gen / 2, y); x.stroke(); }); x.restore(); }
            }
            const sal = Math.sin(t / 900), hx = SIRA_X0 + 372 + sal * 270, sag = Math.cos(t / 900) > 0; x.save(); x.translate(hx, 660); x.scale(sag ? .56 : -.56, .56); DDKK.kisi(x, hr, t, { yuru: t / 70, nosuz: true, korku: K.N - K.k <= 1, egim: .1 }); x.restore(); if (st.v.h2 != null) { x.save(); x.translate(hx - (sag ? 70 : -70), 664); x.scale(sag ? .5 : -.5, .5); DDKK.kisi(x, st.v.s[st.v.h2], t, { yuru: t / 70 + 1, nosuz: true }); x.restore(); } nesneCiz(x, vakaBul(st.vid).nesne, hx + (sag ? 46 : -46), 570, .55);
        } else {
            g.addColorStop(0, '#0f2a5a'); g.addColorStop(1, '#e88a5a'); x.fillStyle = g; x.fillRect(x0, T0, W, H); for (let i = 0; i < 5; i++) { x.fillStyle = 'rgba(255,255,255,.25)'; const bx = x0 + ((i * 190 + t / 40) % 900) - 80, by = 280 + i * 60; x.beginPath(); x.ellipse(bx, by, 60, 18, 0, 0, 7); x.ellipse(bx + 34, by - 12, 36, 18, 0, 0, 7); x.fill(); }
            x.fillStyle = '#1c2038'; for (let i = 0; i < 12; i++) { const h = 40 + (i * 37 % 50); x.fillRect(x0 + i * 66, H - h, 58, h); }
            const yuk = balonYuk(K, t); x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 2.5; for (let i = K.k; i < K.N; i++) { const b = balonXY(K, i, yuk); x.beginPath(); x.moveTo(SIRA_X0 + 372, yuk - 120); x.lineTo(b.x, b.y + 34); x.stroke(); }
            for (let i = K.k; i < K.N; i++) { const b = balonXY(K, i, yuk), s2 = Math.sin(t / 500 + i) * 4; x.fillStyle = ['#ff5a5a', '#ffb02e', '#5ee39b', '#5ab4ff', '#c88ae0', '#ff8ac8', '#ffe26a'][i % 7]; x.beginPath(); x.ellipse(b.x + s2, b.y, 30, 37, 0, 0, 7); x.fill(); x.strokeStyle = '#1c1420'; x.lineWidth = 3; x.stroke(); x.fillStyle = 'rgba(255,255,255,.55)'; x.beginPath(); x.ellipse(b.x + s2 - 9, b.y - 12, 7, 11, .4, 0, 7); x.fill(); }
            x.save(); x.translate(SIRA_X0 + 372, yuk); x.rotate(Math.sin(t / 700) * .08); x.scale(.46, .46); DDKK.kisi(x, hr, t, { teslim: true, korku: K.N - K.k <= 1, nosuz: true, yuru: t / 300 }); if (st.v.h2 != null) { x.translate(0, 190); DDKK.kisi(x, st.v.s[st.v.h2], t, { teslim: true, nosuz: true, yuru: t / 260 }); } x.restore(); nesneCiz(x, vakaBul(st.vid).nesne, SIRA_X0 + 440, yuk - 50, .6);
        }
        x.restore(); const kl = K.N - K.k; yuv(x, SIRA_X0 + 60, 208, 620, 54, 16); x.fillStyle = 'rgba(10,12,24,.85)'; x.fill(); yaz(x, K.mod === 'kapi' ? (kl === 1 ? 'SON KAPI! Kapat, yakala!' : kl + ' kapı hâlâ açık!') : (kl === 1 ? 'SON BALON! Vur, düşsün!' : kl + ' balon kaldı!'), SIRA_X0 + 370, 236, 32, kl === 1 ? '#ffd34a' : '#ffffff');
    }
    // 🔒 yakalama sahnesi: kafes / ağ / köpek Karabaş / polis arabası (2,1 sn)
    const YAKALA_MS = 2100;
    function yakalaCiz(x, st, t) {
        const u = (t - _yakala.t) / YAKALA_MS; if (u >= 1) { _yakala = null; return; } const x0 = SIRA_X0 - 10, cx = SIRA_X0 + 372; x.save(); x.beginPath(); x.rect(x0, 198, W - x0, H - 198); x.clip(); x.fillStyle = '#0c0e1e'; x.fillRect(x0, 198, W, H);
        const g = x.createRadialGradient(cx, 520, 30, cx, 520, 360); g.addColorStop(0, 'rgba(255,240,190,.5)'); g.addColorStop(1, 'rgba(255,240,190,0)'); x.fillStyle = g; x.fillRect(x0, 198, W, H); x.fillStyle = '#1a1d34'; x.fillRect(x0, 640, W, 90); x.fillStyle = 'rgba(255,240,190,.25)'; x.beginPath(); x.ellipse(cx, 652, 240, 30, 0, 0, 7); x.fill();
        if (st.v.h2 != null) { x.save(); x.translate(cx + 150, 652); x.scale(.8, .8); DDKK.kisi(x, st.v.s[st.v.h2], t, { teslim: true, korku: true, nosuz: true }); x.restore(); }
        x.save(); x.translate(cx, 655); DDKK.yakala(x, _yakala.tip, u, Object.assign({}, st.v.s[st.v.h], { _maske: st.vid === 'tilki' }), t); x.restore();
        x.restore(); yaz(x, 'YAKALADIK!', cx, 250, 66 + Math.sin(t / 120) * 4, '#ffd34a');
    }
    function tiklama(e) {
        if (_film) { filmBitir(); return; }
        const st = durum(); if (st.faz !== 'oyun' || !st.v) return;
        const r = _cv.getBoundingClientRect(); const qx = (e.clientX - r.left - _ox) / _olcek, qy = (e.clientY - r.top - _oy) / _olcek;
        if (qx < SIRA_X0 - 10 || qy < 200 || qy > AYAK + 20) return;
        let i = -1; const sira = st.v.s.map((_, j) => j).sort((a, b) => poz(st, b).ayak - poz(st, a).ayak); // öndeki önce
        for (const j of sira) { const p = poz(st, j), h = boyH(st.v.s[j]) * p.s; if (Math.abs(qx - p.x) < 64 * p.s && qy > p.ayak - h - 40 * p.s && qy < p.ayak + 14) { i = j; break; } }
        if (i < 0 || st.masum[i] || (st.yak || [])[i]) return;
        if (st.karanlik) { fxYazi(SIRA_X0 + 372, 420, ortu(st) === 'gazete' ? 'Gazeteden göremiyoruz!' : ortu(st) === 'sis' ? 'Dumandan göremiyoruz!' : 'Karanlıkta göremiyoruz!', '#ffd34a', 32, 60); return; }
        if (_suclaMod) { if (!st.x[i]) suclaSor(i); return; }
        st.x[i] = st.x[i] ? 0 : 1; kaydet(); ses('sec'); if (st.x[i]) fxYazi(SX(st, i), supheliY(st, i, .5), 'BU DEĞİL!', '#ff8a8a', 34, 50);
    }

    /* ---------------- ŞİMDİ ATIYOR KARTI + SEÇİM + ROZET ---------------- */
    // v446 (kullanıcı: "sporcu seçme işini kolaylaştır, kim atıyor görmekte zor"): sahnenin sol üstünde kart (v466: kullanıcı "çok büyük, ekranı kaplıyor" → ince şerit; fotoğraf, ad,
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
        const r = rutbeS(s), sonra = []; for (let k = 1; k <= Math.min(2, n - 1); k++) { const j = (i + k) % n; sonra.push('<button type="button" class="ddk-sonra-k" data-j="' + j + '" title="' + kacis(ilkAd(l[j].ad)) + '" aria-label="Sonra: ' + kacis(ilkAd(l[j].ad)) + '">' + avatarHTML(l[j], j) + '</button>'); }
        el.innerHTML = '<div class="ddk-kim-kutu"><button type="button" class="ddk-kim-ana" id="ddk-kim-btn"><span class="ddk-kim-sat">' + avatarHTML(s, i) + '<span class="ddk-kim-ad"><span class="ddk-kim-et">🏹 ŞİMDİ ATIYOR' + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + '</span><span class="ddk-kim-isim"><b>' + kacis(ilkAd(s.ad)) + '</b><small title="' + kacis(r[2]) + '">' + r[1] + '<em>' + rozetIkon(st, s) + '</em></small></span></span></span></button>'
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
        if (_hamle || _yakala) { _rozetZ = setTimeout(() => { _rozetZ = 0; rozetOynat(); }, 500); return; } // hırsızın hamlesi bandı bitsin
        const r = _rozetKuyruk.shift(); if (!r) { el.hidden = true; return; }
        const l = liste(), j = l.findIndex((o) => o.g === r.s.g && o.ad === r.s.ad), s = j >= 0 ? l[j] : r.s;
        el.innerHTML = avatarHTML(s, Math.max(0, j)) + '<span><b>' + kacis(ilkAd(s.ad)) + '</b>' + (r.rutbe ? '<i>' + r.rutbe[1] + ' artık ' + kacis(r.rutbe[2].toLocaleUpperCase('tr-TR')) + '!</i>' : '<i>' + ROZET[r.id][0] + ' ' + kacis(ROZET[r.id][1].toLocaleUpperCase('tr-TR')) + ' rozeti!</i>') + '</span>';
        el.classList.toggle('rutbe', !!r.rutbe); el.hidden = false; el.classList.remove('oyna'); void el.offsetWidth; el.classList.add('oyna');
        _rozetZ = setTimeout(() => { _rozetZ = 0; el.hidden = true; rozetOynat(); }, 2000);
    }

    /* ---------------- PERDELER (kartlar) ---------------- */
    function perde(html, bag) { const p = $('ddk-perde'); if (!p) return; p.innerHTML = html; p.hidden = false; if (bag) bag(p); }
    function perdeKapat() { const p = $('ddk-perde'); if (p) { p.hidden = true; p.innerHTML = ''; } }
    function zorSecHTML(aktif) { return '<p><b>Seviye seç:</b>' + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + '</p><div class="ddk-zorsec">' + Object.keys(DZ).map((k) => '<button type="button" data-z="' + k + '" class="' + (k === aktif ? 'on' : '') + '"><span class="n">' + DZ[k].ad + '</span><span class="d">' + DZ[k].d + '</span></button>').join('') + '</div>'; }
    function haritaHTML(parca, yeni) { let h = '<div class="ddk-harita">'; for (let i = 0; i < 5; i++) h += '<span class="' + (i < parca ? 'dolu' : '') + (yeni && i === parca - 1 ? ' yeni' : '') + '">' + (i < parca ? '🧩' : '?') + '</span>'; return h + '<b>🦊</b></div>'; }
    function perdeCiz(st) {
        _perdeFaz = st.faz; const V = vakaBul(st.vid), K = kal();
        if (st.faz === 'oyun' || st.faz === 'kovala') { perdeKapat(); return; }
        if (st.faz === 'zarf') {
            // v446 💌 zarf: sınıf seçer (koç dokunur); seri girilirse ok rastgele birini açar
            perde('<div class="ddk-kart"><span class="ddk-etiket">Komiser Baykuş\'un masası · Vaka ' + (st.vaka + 1) + ' · Harita ' + (K.parca || 0) + '/5</span><h2>Hangi dosyayı açalım?' + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + '</h2><p>Sınıf seçsin: <b>A mı, B mi, C mi?</b></p><div class="ddk-zarflar">' + st.zarflar.map((id, k) => { const v = vakaBul(id), T = TIP[(st.zarfTip || [])[k]] || TIP.klasik; return '<button type="button" data-v="' + id + '"><span class="z-ust">ZARF ' + 'ABC'[k] + '</span><span class="z-ik">' + (SAHNE_IKON[v.sahne] || '📁') + '</span><span class="z-yer">' + kacis(v.yer) + '</span><span class="z-tip">' + T.ik + ' ' + kacis(T.ad) + '</span></button>'; }).join('') + '</div>'
                + haritaHTML(K.parca || 0) + zorSecHTML(st.zor) + '<p class="ddk-not">Seri girilirse ok rastgele bir zarf açar ve soruşturma başlar.</p></div>', (p) => {
                p.querySelectorAll('[data-v]').forEach((b) => b.onclick = () => { const s2 = durum(); vakaSec(s2, b.dataset.v); kaydet(); ses('kart'); _filmIstek = true; ddkGuncelle(); });
                p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => { const s2 = durum(); s2.zor = b.dataset.z; s2.esikEl = 0; kal().zor = s2.zor; kal().ust = 0; kalKaydet(); zarfTipleri(s2); kaydet(); ses('sec'); _perdeFaz = null; ddkGuncelle(); });
            });
        } else if (st.faz === 'basla') {
            const til = st.vid === 'tilki', T = TIP[st.tip] || TIP.klasik;
            if (_filmIstek && gorunur()) { _filmIstek = false; _film = { t: performance.now() }; perdeKapat(); ses('dudu'); return; } _filmIstek = false;
            perde('<div class="ddk-kart' + (til ? ' tilki' : '') + '"><span class="ddk-etiket">' + (til ? '🦊 BÜYÜK VAKA' : 'Gizli dosya · Vaka ' + (st.vaka + 1)) + ' · ' + (SAHNE_IKON[st.sahne] || '') + ' ' + kacis(V.yer) + '</span><h2>' + kacis(V.ad) + '</h2><p>' + (st.rovans ? 'Hırsız yine aynı numarayı yaptı! ' : '') + kacis(V.hikaye.replace('{n}', st.n)) + '</p><p class="ddk-anlat">' + kacis(V.anlat) + '</p><div class="ddk-kural"><span>' + T.ik + '</span><b>' + kacis(T.ad) + (typeof yeniRozet === 'function' && st.tip !== 'klasik' ? ' ' + yeniRozet() : '') + '</b><i>' + kacis(T.kural) + '</i></div><p class="ddk-not">Dikkat: hırsız ' + ((st.olaylar || []).length > 1 ? (st.olaylar || []).length + ' numara' : 'bir numara') + ' yapacak! 🦊</p><div class="ddk-butonlar"><button class="ddk-b" id="ddk-bas">🔍 Soruşturmayı başlat</button></div><p class="ddk-not">İlk seri girilince soruşturma kendiliğinden başlar.</p></div>', (p) => {
                p.querySelector('#ddk-bas').onclick = () => { const s2 = durum(); s2.faz = 'oyun'; _giris = performance.now(); kaydet(); ses('kart'); ddkGuncelle(); };
            });
        } else if (st.faz === 'cozuldu') {
            const kz = st.parcaKazandi, til = st.vid === 'tilki', ust = kz && (K.ust || 0) >= 2 ? DZ_SIRA[DZ_SIRA.indexOf(st.zor) + 1] : null;
            perde('<div class="ddk-kart">' + (kz && st.yakAd ? '<div class="ddk-sabika"><canvas id="ddk-port" width="300" height="300"></canvas><span><i>SABIKA FOTOĞRAFI</i><b>' + kacis(st.yakAd) + '</b><i>' + TIP[st.tip || 'klasik'].ik + ' ' + kacis(V.ad) + '</i></span></div>' : '<div class="ddk-buyuk">' + (kz ? '🔒✅' : '💨🎒') + '</div>') + '<span class="ddk-etiket">Vaka kapandı · ' + kacis(V.yer) + '</span><h2>' + (kz ? 'Hırsız yakalandı!' : til ? 'Gölge Tilki kaçtı!' : 'Ganimet bizde, hırsız kaçtı!') + '</h2>'
                + '<p>' + (kz ? 'Hırsızın cebinden haritanın bir parçası çıktı: <b>' + (K.parca || 0) + '/5</b>' + ((K.parca || 0) >= 5 ? ' — Gölge Tilki\'nin yeri bulundu!' : '') : til ? 'Ama haritası bizde. Bir dahaki sefere kaçamayacak!' : 'Bu sefer harita parçası yok. Sıradaki vakada yakalayalım!') + '</p>' + haritaHTML(K.parca || 0, kz)
                + '<p>Bu vakanın dedektifleri:</p>' + adlarHTML(siraliAdlar(st.vakaAtan), st) + '<div class="ddk-butonlar"><button class="ddk-b" id="ddk-dev">' + ((K.parca || 0) >= 5 ? '🦊 Gölge Tilki vakası →' : '💌 Sıradaki zarflar →') + '</button>' + (ust ? '<button class="ddk-b kirmizi" id="ddk-ust">⬆️ Üst seviye: ' + DZ[ust].ad + '</button>' : '') + '</div></div>', (p) => {
                if (p.querySelector('#ddk-port') && st.v) portre(p.querySelector('#ddk-port'), st.v.s[st.v.h]); if (ust) p.querySelector('#ddk-ust').onclick = () => { const s2 = durum(); s2.zor = ust; s2.esikEl = 0; kal().zor = ust; kal().ust = 0; kalKaydet(); ses('dogru'); zarfHazirla(s2); kaydet(); ddkGuncelle(); };
                p.querySelector('#ddk-dev').onclick = () => { zarfHazirla(durum()); kaydet(); ddkGuncelle(); };
            });
        } else if (st.faz === 'kacti') {
            const h = st.v.s[st.v.h];
            perde('<div class="ddk-kart"><div class="ddk-buyuk">🚂💨</div><h2>Tren kalktı!</h2><p>Hırsız ' + h.no + (st.v.h2 != null ? ' ve ' + st.v.s[st.v.h2].no : '') + ' numaraydı ve kaçtı… Ama Komiser Baykuş izini sürüyor.</p><p class="ddk-anlat">Komiser Baykuş: "Bir sonraki trene yetişiriz! Bu sefer daha hızlı ipucu toplayalım."</p><div class="ddk-butonlar"><button class="ddk-b kirmizi" id="ddk-rov">🔁 Rövanş: bu vakayı yeniden</button></div></div>', (p) => {
                p.querySelector('#ddk-rov').onclick = () => { const s2 = durum(); vakaKur(s2); s2.rovans = true; s2.faz = 'basla'; kaydet(); ddkGuncelle(); };
            });
        } else if (st.faz === 'final') {
            const hep = siraliAdlar(st.hepAtan);
            perde('<div class="ddk-kart tilki"><div class="ddk-buyuk">🦊🔒👑</div><h2>GÖLGE TİLKİ YAKALANDI!</h2><p>Şehir kurtuldu! ' + (K.sezon - 1 || 1) + '. sezonun kahramanları ' + hep.length + ' okçunun hepsi:</p>' + adlarHTML(hep, st) + '<p>Toplam ' + st.toplamOk + ' ok</p><p class="ddk-anlat">Komiser Baykuş: "Ama duydum ki Tilki\'nin bir kardeşi var… Yeni harita, yeni sezon!"</p><div class="ddk-butonlar"><button class="ddk-b" id="ddk-yeni">🗺️ Yeni sezon</button></div></div>', (p) => {
                p.querySelector('#ddk-yeni').onclick = () => { _st = bosDurum(st.zor); kaydet(); ddkGuncelle(); };
            });
        }
    }
    function zorAyarla(z) { const st = durum(); st.zor = z; st.esikEl = 0; kal().zor = z; kalKaydet(); if (st.vid && st.faz !== 'zarf') { vakaKur(st); st.faz = 'basla'; } kaydet(); ses('sec'); _perdeFaz = null; ddkGuncelle(); }
    function zorlukAc() {
        const st = durum();
        perde('<div class="ddk-kart"><h2>⚙️ Zorluk</h2><p>Değiştirirsen bu vaka yeni şüphelilerle baştan başlar.</p>' + zorSecHTML(st.zor) + '<p><b>İpucu için gereken puan:</b></p><div class="ddk-esik">' + [5, 6, 7, 8, 9].map((v) => '<button type="button" data-e="' + v + '" class="' + (v === st.esik ? 'on' : '') + '">' + v + '+</button>').join('') + '</div><div class="ddk-butonlar"><button class="ddk-b ikincil" id="ddk-kapat">Kapat</button></div></div>', (p) => {
            p.querySelectorAll('[data-z]').forEach((b) => b.onclick = () => zorAyarla(b.dataset.z));
            p.querySelectorAll('[data-e]').forEach((b) => b.onclick = () => { const s = durum(); s.esik = +b.dataset.e; s.esikEl = s.esik; kaydet(); ses('sec'); zorlukAc(); });
            p.querySelector('#ddk-kapat').onclick = () => { _perdeFaz = null; ddkGuncelle(); };
        });
        _perdeFaz = 'ayar';
    }
    function nasil() {
        perde('<div class="ddk-kart"><h2>🕵️ Nasıl oynanır?</h2><p class="ddk-sol">📣 <b>Koç söyler:</b> "Her kart kilitli. İyi oklarla kilidi kırın, tren kalkmadan hırsızı hep birlikte bulun!"<br>💌 Her vaka 3 zarftan biri: sınıf seçer, her gün başka yer ve dizilim.<br>🏹 Eşiği geçen ok karttaki kilitten bir nokta kırar, noktalar bitince ipucu açılır. <b>10/X</b>: Kolay ve Normal\'de kart açarsa Komiser Baykuş bir masumu eler, Zor ve üstünde iki nokta birden kırar.<br>🙋 Sınıf "bu değil!" derse şüpheliye dokun, üstü çizilir. Hazır olunca <b>🫵 Suçla</b>.<br>⚠️ Yanlış suçlama 2–4 seri kaybettirir (seviyeye göre). Saat dolarsa tren kalkar, hırsız kaçar.<br>🦊 Hırsız bir numara yapar: ışıkları söndürür, yer değiştirir ya da bir ipucunu uçurur.<br>🏃 Doğru suçlayınca hırsız kaçar: her iyi ok bir atlayış, yakalarsak haritanın bir parçası. 5 parça = Gölge Tilki vakası.<br>🏅 Rozetler: ipucu, 10/X, üçü de iyi, önceki serisinden iyi, ışık yakmak, atlayış.<br>📂 <b>Vaka türleri:</b> 🔍 ipucu avı · 📸 yırtık fotoğraf · 🤥 kim yalan söylüyor (masumlar doğru, hırsız yalan) · 👥 iki hırsız · 🎭 bir kart yalan (10/X yalanı bulur).<br>⚙️ <b>Seviyeler:</b> 🐣 Kolay · 🦊 Normal · 🧠 Zor · 🧩 Karmaşık · 💀 Efsane. Üst üste 2 hırsız yakalayınca üst seviye teklif edilir.<br>📖 Yakalanan her hırsız suçlular albümüne girer.</p><div class="ddk-butonlar"><button class="ddk-b" id="ddk-tamam">Tamam</button></div></div>', (p) => { p.querySelector('#ddk-tamam').onclick = () => { _perdeFaz = null; ddkGuncelle(); }; });
        _perdeFaz = 'nasil';
    }
    function yeniSor() {
        perde('<div class="ddk-kart"><h2>🔄 Bu vaka baştan mı?</h2><p>Yeni şüpheliler ve yeni ipuçları gelir. Vaka numarası aynı kalır.</p><div class="ddk-butonlar"><button class="ddk-b kirmizi" id="ddk-evet">Evet, baştan</button><button class="ddk-b ikincil" id="ddk-hayir">Vazgeç</button></div></div>', (p) => {
            p.querySelector('#ddk-evet').onclick = () => { const s = durum(); if (s.vid && s.faz !== 'zarf') { vakaKur(s); s.faz = 'basla'; } kaydet(); _perdeFaz = null; ddkGuncelle(); };
            p.querySelector('#ddk-hayir').onclick = () => { _perdeFaz = null; ddkGuncelle(); };
        });
        _perdeFaz = 'yeni';
    }
    function portre(cv, o) { try { const q = cv.getContext('2d'), n = cv.width, H2 = boyH(o); q.setTransform(1, 0, 0, 1, 0, 0); const g = q.createLinearGradient(0, 0, 0, n); g.addColorStop(0, '#b8c6d6'); g.addColorStop(1, '#8a9ab0'); q.fillStyle = g; q.fillRect(0, 0, n, n); q.strokeStyle = 'rgba(255,255,255,.5)'; q.lineWidth = n / 150; for (let i = 1; i < 6; i++) { q.beginPath(); q.moveTo(0, i * n / 6); q.lineTo(n, i * n / 6); q.stroke(); } const s2 = n / 215; q.translate(n / 2, n * .98); q.scale(s2, s2); q.translate(0, H2 - 150); DDKK.kisi(q, o, 900, { nosuz: true, korku: false, hareket: 0, bak: 0, maske: o._maske }); } catch (e) { } }
    // 📖 Suçlular albümü: yakalanan her hırsızın portresi (kalıcı, en çok 30)
    function albumAc() {
        const A = kal().album || [];
        perde('<div class="ddk-kart"><h2>📖 Suçlular albümü' + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + '</h2><p>' + (A.length ? 'Bu sınıf <b>' + (kal().yakSay || A.length) + '</b> hırsız yakaladı!' : 'Henüz kimse yok. İlk hırsızı yakalayın, portresi buraya gelsin!') + '</p><div class="ddk-album">' + A.map((a, i) => '<span><canvas width="180" height="180" data-a="' + i + '"></canvas><b>' + kacis(a.ad) + '</b><i>' + kacis(vakaBul(a.vid).ad) + '</i></span>').reverse().join('') + '</div><div class="ddk-butonlar"><button class="ddk-b ikincil" id="ddk-kapat">Kapat</button></div></div>', (p) => {
            p.querySelectorAll('[data-a]').forEach((c) => portre(c, A[+c.dataset.a].o)); p.querySelector('#ddk-kapat').onclick = () => { _perdeFaz = null; ddkGuncelle(); };
        });
        _perdeFaz = 'album';
    }
    const LAKAP = { canavar: ['Gece Yarısı', 'Sargı Bezi', 'Soğuk Nefes', 'Kırık Tabut', 'Ay Işığı', 'Dişlek', 'Tıkırtı', 'Sis Adam'], insan: ['Kara Şapka', 'Sessiz Adım', 'Gece Gölgesi', 'Cebi Delik', 'Bay Fısıltı', 'Kıvrık Bıyık', 'Duman', 'Yan Cep'], hayvan: ['Yumuşak Pati', 'Kaçak Kuyruk', 'Gizli Pençe', 'Uykusuz', 'Bal Hırsızı', 'Çizgili Gölge', 'Tüy Gibi', 'Sinsi Burun'], robot: ['Paslı Cıvata', 'Kısa Devre', 'Bip-13', 'Kırık Anten', 'Yıldız Tozu', 'Sıfır-Bir', 'Mıknatıs', 'Vızır'] };
    function albumEkle(S) {
        const K = kal(), o = Object.assign({}, S.v.s[S.v.h]); delete o.no; if (S.vid === 'tilki') o._maske = true; const l = LAKAP[DDKK.grup(o)] || LAKAP.insan, kul = K.album.map((a) => a.ad), bos = l.filter((a) => kul.indexOf(a) === -1);
        S.yakAd = S.vid === 'tilki' ? 'GÖLGE TİLKİ' : bos.length ? sec(bos) : sec(l) + ' ' + ((K.yakSay || 0) + 1); K.yakSay = (K.yakSay || K.album.length) + 1; K.album = K.album.concat([{ o, ad: S.yakAd, vid: S.vid }]).slice(-30); K.ust = S.hata ? 0 : (K.ust || 0) + 1; kalKaydet();
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
        const st = durum(), gs = gorunur(), p0 = poz(st, i); ses('davul'); st.sonuc = { i: i, dogru: null }; if (gs) kamera(Math.max(762, Math.min(1028, p0.x)), p0.ayak - boyH(st.v.s[i]) * p0.s * .6, 1.55); await bekle(1300);
        if (hirsizMi(st.v, i)) {
            st.sonuc.dogru = true; kaydet(); ses('dogru'); FX.shake = 12; fxParca(SIRA_X0 + 372, 360, 80, ['#ffd34a', '#ff7a5a', '#8fe0ff', '#fff'], 12, 7);
            const s0 = durum(), kalanH = [s0.v.h, s0.v.h2].filter((q) => q != null && q !== i && !(s0.yak || [])[q]);
            s0.yak = s0.yak || Array(s0.n).fill(0); s0.yak[i] = 1; kaydet();
            if (kalanH.length) { fxYazi(SIRA_X0 + 372, 250, '1. HIRSIZ YAKALANDI!', '#ffd34a', 50, 120); await bekle(1400); kamera(0, 0, 1); fxYazi(SIRA_X0 + 372, 330, 'Şimdi suç ortağını bulun!', '#8fe0ff', 40, 120); const s1 = durum(); s1.sonuc = null; kaydet(); return; }
            if (s0.vid === 'tilki') { fxYazi(SIRA_X0 + 372, 250, 'KILIĞI DÜŞTÜ: GÖLGE TİLKİ!', '#ff9a5a', 46, 130); Object.assign(s0.v.s[s0.v.h], { cins: 'tilki', post: '#e8762a', elRenk: '#e8762a', sapka: null, gozluk: false, biyik: false }); kaydet(); } else fxYazi(SIRA_X0 + 372, 250, 'BULDUK!', '#ffd34a', 64, 120);
            await bekle(1500); kamera(0, 0, 1);
            // v446 🏃 bulduk ama ganimeti kapıp kaçıyor → final (kovalamaca / kapılar / balonlar)
            const s = durum(); fxYazi(SIRA_X0 + 372, 420, 'GANİMETİ KAPIP KAÇIYOR!', '#ff8a6a', 46, 110); ses('dudu'); kovalaKur(s); kaydet(); ddkGuncelle();
        } else {
            st.sonuc = null; st.masum[i] = 1; st.hata = (st.hata || 0) + 1; const cz = (DZ[st.zor] || DZ.normal).ceza || 2; st.saat = Math.min(st.maxSaat, st.saat + cz); kaydet(); _sevinc[st.v.s[i].no] = performance.now();
            ses('yanlis'); FX.flash = .6; FX.shake = 14; kamera(0, 0, 1); fxYazi(SX(st, i), 260, 'MASUM!', '#5ee39b', 56, 100); fxYazi(SIRA_X0 + 372, 260, '⏰ ' + cz + ' seri kaybettik!', '#ff8a8a', 40, 110);
            if (st.saat >= st.maxSaat) { await bekle(800); kacti(); }
        }
    }
    function kovalaKur(st) {
        const til = st.vid === 'tilki', z = DZ_SIRA.indexOf(st.zor), mod = til ? 'kos' : st.finalTip || 'kos'; _kovGor = null; _kir = [];
        if (mod !== 'kos') st.kov = { mod, N: [3, 5, 6, 6, 6][z] || 5, k: 0, kalan: st.zor === 'kolay' ? 4 : 2, sure: st.zor === 'kolay' ? 4 : 2 };
        else st.kov = { tip: KOV_TIP[st.sahne] || 'cati', L: til || sertMi(st.zor) ? 8 : 7, d: 0, h: st.zor === 'kolay' ? 2 : sertMi(st.zor) ? 5 : 4, her: st.zor === 'kolay' ? 2 : 1, sayac: 0, muzlu: st.zor === 'karmasik' || st.zor === 'efsane' };
        st.sonuc = null; st.faz = 'kovala';
    }
    let _sonYakala = null;
    async function yakaladik(S, gorsel) {
        if (gorsel) { ses('dogru'); FX.shake = 12; _yakala = { t: performance.now(), tip: sec(['kafes', 'ag', 'kopek', 'araba'].filter((q) => q !== _sonYakala)) }; _sonYakala = _yakala.tip; fxParca(SIRA_X0 + 372, 400, 90, ['#ffd34a', '#ff7a5a', '#8fe0ff', '#fff'], 12, 7); await bekle(YAKALA_MS); _yakala = null; }
        albumEkle(S);
        const K = kal(); S.parcaKazandi = true; S.vaka++;
        if (S.vid === 'tilki') { K.parca = 0; K.sezon = (K.sezon || 1) + 1; K.tilki = (K.tilki || 0) + 1; S.faz = 'final'; } else { K.parca = Math.min(5, (K.parca || 0) + 1); S.faz = 'cozuldu'; }
        kalKaydet(); kaydet(); ddkGuncelle();
    }
    async function kacisBitti(S, gorsel) {
        if (gorsel) { ses('yanlis'); fxYazi(SIRA_X0 + 372, 330, S.vid === 'tilki' ? 'GÖLGE TİLKİ KAÇTI!' : 'HIRSIZ KAÇTI…', '#ff8a6a', 56, 110); await bekle(1700); }
        kal().ust = 0; kalKaydet(); S.parcaKazandi = false; S.vaka++; S.faz = 'cozuldu'; kaydet(); ddkGuncelle();
    }
    // 🦊 Hırsızın hamlesi
    function olayUygula(S, tip, gorsel) {
        if ((tip === 'ruzgar' || tip === 'fare') && S.acik < 1) tip = 'yer';
        if (tip === 'saat' && S.saat >= S.maxSaat - 2) tip = 'yer';
        if (ORTU[tip]) S.karanlik = tip;
        else if (tip === 'ruzgar' || tip === 'fare') { S.acik--; S.dolu = 0; _kartAnim[S.acik] = 0; if (gorsel) _ucan = { t: performance.now(), tip, x: kartX(S, S.acik) + 120 }; }
        else if (tip === 'saat') S.saat++;
        else yerDegistir(S, gorsel);
        kaydet();
        if (gorsel) { ses('dudu'); FX.flash = .35; FX.shake = 6; _hamle = { t: performance.now(), tip }; }
    }
    function yerDegistir(S, gorsel) {
        const eski = {}; S.v.s.forEach((o, i) => { eski[o.no] = poz(S, i); });
        let perm; do { perm = karistir(S.v.s.map((_, i) => i)); } while (S.n > 1 && perm.every((p, i) => p === i));
        const hNo = S.v.s[S.v.h].no, h2No = S.v.h2 != null ? S.v.s[S.v.h2].no : null;
        S.v.s = perm.map((j) => S.v.s[j]); S.x = perm.map((j) => S.x[j]); S.masum = perm.map((j) => S.masum[j]); S.yak = perm.map((j) => (S.yak || [])[j] || 0); S.v.h = S.v.s.findIndex((o) => o.no === hNo); if (h2No != null) S.v.h2 = S.v.s.findIndex((o) => o.no === h2No);
        if (gorsel) _yerAnim = { t: performance.now(), eski };
    }
    async function kacti() { const st = durum(); kal().ust = 0; kalKaydet(); ses('dudu'); _tren = .0001; await bekle(2300); st.faz = 'kacti'; kaydet(); ddkGuncelle(); }

    /* ---------------- SERİ ---------------- */
    function ddkSeri(s, i, kaydedilecek, done) {
        let bitti = false; const bitir = () => { if (!bitti) { bitti = true; try { done(); } catch (e) { } } };
        let st = durum();
        // Kart açıkken seri girildiyse sıradaki adıma geç (koç kartı kapatmayı unuttu)
        if (st.faz === 'final') { _st = bosDurum(st.zor); st = _st; }
        if (st.faz === 'cozuldu') zarfHazirla(st);
        if (st.faz === 'zarf') vakaSec(st, sec(st.zarflar)); // ok rastgele bir zarf açar
        if (st.faz === 'kacti') { vakaKur(st); st.rovans = false; }
        _film = null; _filmIstek = false; const S = durum(); if (S.faz !== 'kovala') { if (S.faz === 'basla' && _cv) _giris = performance.now(); S.faz = 'oyun'; } _suclaMod = false; _giris = _giris || 0; _perdeFaz = null; kaydet(); perdeKapat(); hudCiz();
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
                    if (p >= S.esik) { const bitenOrtu = ortu(S); S.karanlik = false; rozetVer(S, s, 'isik'); if (gorsel) { ses('kritik'); FX.flash = 0; fxParca(SIRA_X0 + 372, 380, 60, bitenOrtu === 'gazete' ? ['#ece4d0', '#fff'] : bitenOrtu === 'sis' ? ['#d8dde6', '#b8c0cc'] : ['#ffe27a', '#fff'], 14, 9); fxYazi(SIRA_X0 + 372, 300, ORTU[bitenOrtu][3], '#ffd34a', 52, 110); } }
                    else if (gorsel) { fxYazi(SIRA_X0 + 372, 420, p === 0 ? 'ISKA' : ortu(S) === 'sis' ? 'dumanda…' : ortu(S) === 'gazete' ? 'gazeteye çarptı…' : 'karanlıkta…', '#e8d8c0', 36); ses('iska'); }
                    kaydet(); if (gorsel) await bekle(120); continue;
                }
                const hedefIp = S.acik < S.v.ipucu.length; const tx = hedefIp ? kartX(S, S.acik) + kartGen(S) / 2 : 640, ty = hedefIp ? 136 : 160;
                const isabet = p >= S.esik && hedefIp, Z0 = DZ[S.zor] || DZ.normal;
                if (gorsel) { ses('cek'); await fxOk(SIRA_X0 + 372, 660, isabet ? tx : tx + rnd(-140, 140), isabet ? ty : ty + rnd(40, 90), 520); }
                if (isabet) {
                    const cift = p === 10 && Z0.altin === 'cift'; S.dolu = (S.dolu || 0) + (cift ? 2 : 1); S.katki[key] = (S.katki[key] || 0) + 1; rozetVer(S, s, 'iz'); ipucuSay(s); // kilide vuran herkes katkı alır
                    const kn = kilitN(S, S.acik); _kilitAnim = performance.now();
                    if (S.dolu < kn) { if (gorsel) { ses('vur'); FX.shake = Math.max(FX.shake, 4); fxParca(tx, ty, 12, ['#ffd34a', '#c8ccd8'], 6, 4); fxYazi(tx, ty + 90, (cift ? '⚡ ÇİFT! ' : '🔓 ') + (kn - S.dolu) + ' KALDI', '#ffe9a8', 38, 70); await bekle(120); } kaydet(); continue; }
                    _kartAnim[S.acik] = 0; S.acik++; S.dolu = 0;
                    if (gorsel) { ses('kart'); fxParca(tx, ty, 24, ['#ffd34a', '#fff3c4'], 7, 5); fxYazi(tx, ty + 90, S.tip === 'foto' ? '📸 PARÇA!' : S.tip === 'sorgu' ? '💬 KONUŞTU!' : '🔍 İPUCU!', '#ffd34a', 46, 80); _bakT = performance.now(); const c9 = S.v.ipucu[S.acik - 1]; if (c9.no != null) _balon = { no: c9.no, t: performance.now(), sure: 2600, m: 'Ben biliyorum!' }; }
                    if ((DZ[S.zor] || DZ.normal).oto) { const c = S.v.ipucu[S.acik - 1]; S.v.s.forEach((o, j) => { if (!eslesir(o, c) && !S.x[j] && !S.masum[j]) { S.x[j] = 1; if (gorsel) fxYazi(SX(S, j), supheliY(S, j, .5), 'UYMUYOR', '#ff8a8a', 30, 80); } }); }
                    const yi = S.tip === 'yalanci' && !S.yalanAcik ? S.v.ipucu.findIndex((c) => c.yalan) : -1;
                    if (p === 10 && yi >= 0 && yi < S.acik) { S.yalanAcik = true; if (gorsel) { ses('kritik'); FX.shake = 8; fxYazi(SIRA_X0 + 372, 300, 'ALTIN İPUCU! Yalan kart bulundu', '#ffd34a', 36, 120); } }
                    else if (p === 10 && Z0.altin === 'masum' && (S.altinSay || 0) < Z0.altinMax) { S.altinSay = (S.altinSay || 0) + 1; const aday = S.v.s.map((_, j) => j).filter((j) => !hirsizMi(S.v, j) && !S.x[j] && !S.masum[j]); if (aday.length) { const m = sec(aday); S.masum[m] = 1; if (gorsel) { ses('kritik'); _kopek = performance.now(); _sevinc[S.v.s[m].no] = performance.now(); fxYazi(SX(S, m), supheliY(S, m, .8), '🦉 MASUM!', '#5ee39b', 44, 110); fxYazi(SIRA_X0 + 372, 300, 'ALTIN İPUCU! Komiser birini eledi', '#ffd34a', 36, 120); } } }
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
            if (S.saat >= S.maxSaat) { if (gorsel) kacti(); else { kal().ust = 0; kalKaydet(); S.faz = 'kacti'; kaydet(); } }
        })().catch(() => bitir());
        setTimeout(bitir, 6000); // emniyet: animasyon takılırsa dock kilitli kalmasın
    }
    function kovalaSeri(S, s, oklar, gorsel, bitir) {
        const K = S.kov;
        if (K.mod) { // 🚪 kapı / 🎈 balon
            (async () => {
                for (const p of oklar) {
                    if (S.faz !== 'kovala' || K.k >= K.N) break; const iyi = p >= S.esik, q = K.mod === 'kapi' ? { x: kapiX(K, K.k), y: 470 } : balonXY(K, K.k, _kovGor && _kovGor.y != null ? 690 - _kovGor.y * 170 : 690);
                    if (gorsel) { ses('cek'); await fxOk(SIRA_X0 + 372, 690, iyi ? q.x : q.x + rnd(-120, 120), iyi ? q.y : 300, 460); }
                    if (iyi) {
                        const ad = Math.min(K.N - K.k, p === 10 ? 2 : 1); for (let j = 0; j < ad; j++) _kir[K.k + j] = performance.now(); K.k += ad; rozetVer(S, s, 'atla');
                        if (gorsel) { if (K.mod === 'kapi') { ses('vur'); FX.shake = 10; fxYazi(q.x, 380, ad === 2 ? 'İKİ KAPI! GÜM!' : 'GÜM!', '#ffd34a', 48, 70); } else { ses('kart'); fxParca(q.x, q.y, 34, ['#ff5a5a', '#ffb02e', '#5ab4ff', '#fff'], 10, 6); fxYazi(q.x, q.y - 50, ad === 2 ? 'İKİ BALON! PAT!' : 'PAT!', '#ffd34a', 48, 70); } }
                        if (K.k >= K.N) { kaydet(); bitir(); if (gorsel) await bekle(350); await yakaladik(S, gorsel); return; }
                    } else if (gorsel) { fxYazi(SIRA_X0 + 372, 330, p === 0 ? 'ISKA' : 'olmadı…', '#e8d8c0', 36); ses('iska'); }
                    kaydet(); if (gorsel) await bekle(140);
                }
                K.kalan--; kaydet(); bitir(); if (gorsel) { ses('tik'); if (K.kalan > 0) fxYazi(SIRA_X0 + 372, 310, K.mod === 'kapi' ? 'Kapıya koşuyor!' : 'Yükseliyor!', '#ff8a6a', 38, 90); }
                if (K.kalan <= 0) await kacisBitti(S, gorsel);
            })().catch(() => bitir());
            setTimeout(bitir, 6000); return;
        }
        (async () => {
            for (const p of oklar) {
                if (S.faz !== 'kovala') break;
                const iyi = p >= S.esik, hd = kovPoz(K, Math.min(K.L - 1, K.d + 1));
                if (gorsel) { ses('cek'); await fxOk(SIRA_X0 + 372, 660, iyi ? hd.x : hd.x + rnd(-80, 80), iyi ? hd.y - 40 : 600, 460); }
                if (iyi && K.muz) { K.muz = false; if (gorsel) { ses('vur'); fxParca(hd.x, hd.y - 30, 30, ['#ffe26a', '#fff3c4'], 8, 6); fxYazi(hd.x, hd.y - 120, '🍌 MUZ GİTTİ!', '#ffd34a', 40, 80); } }
                else if (iyi) {
                    const adim = p === 10 ? 2 : 1; K.d = Math.min(K.L - 1, K.d + adim); rozetVer(S, s, 'atla');
                    if (gorsel) { ses('vur'); const q = kovPoz(K, K.d); fxYazi(q.x, q.y - 160, adim === 2 ? 'ÇİFT ATLAYIŞ!' : 'HOP!', '#ffd34a', 44, 70); }
                    if (K.d >= K.h) { kaydet(); bitir(); await yakaladik(S, gorsel); return; }
                } else if (gorsel) { const q = kovPoz(K, K.d); fxYazi(q.x, q.y - 150, p === 0 ? 'ISKA' : 'kaydı!', '#e8d8c0', 34); ses('iska'); }
                kaydet(); if (gorsel) await bekle(160);
            }
            if (S.faz === 'kovala') {
                K.sayac++; if (K.muzlu && K.sayac % 2 === 1 && K.h - K.d > 1) { K.muz = true; if (gorsel) fxYazi(SIRA_X0 + 372, 320, '🍌 Muz kabuğu attı!', '#ffe26a', 38, 90); }
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
    function ddkGeriYukle(k) { if (!k) return; zamanTemizle(); k = JSON.parse(JSON.stringify(k)); if (k._kal) { _kal = k._kal; _kalKonum = konum(); kalKaydet(); delete k._kal; } _st = k; _stKonum = konum(); kaydet(); _perdeFaz = null; _yerAnim = null; _hamle = null; _kovGor = null; animTemizle(); if (panel()) ddkGuncelle(); }
    function ddkSporcu(g, ad) { const st = durum(); const n = st.katki[g + '|' + ad] || 0; return n ? '🔍' + n : '-'; }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('ddk-css')) return;
        if (!$('ddk-font')) { const l = document.createElement('link'); l.id = 'ddk-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Lilita+One&family=Special+Elite&display=swap'; document.head.appendChild(l); }
        const st = document.createElement('style'); st.id = 'ddk-css';
        st.textContent = `
.km-oyun-panel-dedektif{padding:0;background:#07080c;overflow:hidden}
.ddk-kap{position:absolute;inset:0}
.ddk-kap #ddk-cv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation;cursor:pointer}
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
.ddk-zorsec{display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px}
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
.ddk-zarflar .z-tip{position:relative;background:#4a1f7a;color:#ffe27a;border-radius:99px;padding:4px 12px;font-family:"Lilita One","Baloo 2",sans-serif;font-size:clamp(14px,1.7vw,18px);line-height:1.15}
.ddk-kural{display:grid;grid-template-columns:auto 1fr;gap:0 14px;align-items:center;text-align:left;background:#4a1f7a;color:#fff;border-radius:16px;padding:10px 18px;width:fit-content;max-width:100%;margin:0 auto}
.ddk-kural span{grid-row:1/3;font-size:clamp(34px,5vw,52px);line-height:1}.ddk-kural b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:clamp(18px,2.4vw,27px);color:#ffe27a}.ddk-kural i:not(.dag-yeni){font-style:normal;font-weight:800;font-size:clamp(15px,1.9vw,21px)}
.ddk-sabika{display:flex;align-items:center;justify-content:center;gap:16px}.ddk-sabika canvas{width:clamp(96px,15vw,150px);height:auto;border:6px solid #fff;border-radius:6px;box-shadow:0 6px 16px rgba(0,0,0,.35);transform:rotate(-4deg);animation:ddkDamga .5s ease}.ddk-sabika span{display:flex;flex-direction:column;text-align:left}.ddk-sabika b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:clamp(24px,3.6vw,40px);color:#a8202a;line-height:1.1}.ddk-sabika i{font-style:normal;font-weight:800;font-size:clamp(13px,1.6vw,17px);color:#6a4a2a}
@keyframes ddkDamga{0%{transform:scale(2.2) rotate(10deg);opacity:0}100%{transform:rotate(-4deg);opacity:1}}
.ddk-album{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(96px,13vw,130px),1fr));gap:10px;max-height:56vh;overflow:auto;padding:4px}.ddk-album span{background:#fff8e6;border-radius:10px;padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:3px;box-shadow:0 3px 8px rgba(0,0,0,.25)}.ddk-album canvas{width:100%;height:auto;border-radius:6px}.ddk-album b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:17px;line-height:1.1}.ddk-album i{font-style:normal;font-size:13px;font-weight:700;opacity:.75;line-height:1.15}
.ddk-harita{display:flex;gap:6px;justify-content:center;align-items:center}
.ddk-harita span{width:clamp(34px,4.5vw,48px);height:clamp(34px,4.5vw,48px);border-radius:8px;border:2px dashed #a8874c;display:grid;place-items:center;font-size:clamp(18px,2.6vw,26px);color:#a8874c;font-weight:900}
.ddk-harita span.dolu{border-style:solid;background:#ffe2a0;color:#2a1708}.ddk-harita span.yeni{animation:ddkParca 1.2s ease 2}
.ddk-harita b{font-size:clamp(24px,3.4vw,34px);margin-left:6px}
@keyframes ddkParca{0%,100%{transform:scale(1)}40%{transform:scale(1.3) rotate(-8deg);box-shadow:0 0 0 6px rgba(255,201,74,.5)}}
.ddk-kim{position:absolute;z-index:3;display:flex;flex-direction:column;gap:.6em}
.ddk-kim[hidden]{display:none}
.ddk-kim-kutu{display:flex;align-items:stretch;background:linear-gradient(160deg,rgba(28,36,70,.95),rgba(14,18,36,.95));border:.2em solid #ffc94a;border-radius:99em;box-shadow:0 .4em 1.1em rgba(0,0,0,.45);overflow:hidden}
.ddk-kim-ana{flex:1;min-width:0;cursor:pointer;text-align:left;font:inherit;color:#fff;background:none;border:0;padding:.45em 1.2em .45em .5em}
.ddk-kim-ana:hover{background:rgba(255,255,255,.06)}
.ddk-kim-sat{display:flex;align-items:center;gap:.9em;min-width:0}
.ddk-av{flex:none;border-radius:50%;display:grid;place-items:center;overflow:hidden;color:#10131c;font-weight:900;border:3px solid rgba(255,255,255,.85)}
.ddk-av img{width:100%;height:100%;object-fit:cover}
.ddk-kim .ddk-kim-sat .ddk-av{flex:none;font-size:1.9em;width:2.6em;height:2.6em;border-width:.12em}
.ddk-kim-ad{display:flex;flex-direction:column;min-width:0;line-height:1.1}
.ddk-kim-et{font-weight:900;letter-spacing:.1em;font-size:1.2em;color:#ffc94a;white-space:nowrap;display:flex;align-items:center;gap:.6em}.ddk-kim-et .dag-yeni{font-size:.8em;line-height:1.2;padding:.1em .5em;margin:0;letter-spacing:0}
.ddk-kim-isim{display:flex;align-items:baseline;gap:.6em;min-width:0}
.ddk-kim-ad b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:2.9em;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ddk-kim-ad small{flex:none;font-size:1.6em;white-space:nowrap}.ddk-kim-ad em{font-style:normal;margin-left:.2em}
.ddk-kim-sonra{flex:none;display:flex;align-items:center;gap:.5em;padding:.4em 1em .4em .9em;border-left:.12em solid rgba(255,255,255,.14)}
.ddk-kim-sl{font-weight:900;letter-spacing:.08em;font-size:1.05em;color:#b8c0e0}
.ddk-sonra-k{cursor:pointer;background:none;border:0;padding:.2em;font:inherit;border-radius:99em}
.ddk-kim .ddk-sonra-k .ddk-av{font-size:1.4em;width:2.4em;height:2.4em;border-width:.12em}
.ddk-kim.dar .ddk-kim-sonra,.ddk-kim.dar .dag-yeni{display:none}
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
@media (max-width:600px){.ddk-hud{top:auto;bottom:8px;right:auto;left:8px}.ddk-zorsec{grid-template-columns:1fr}.ddk-zorsec .d{display:none}.ddk-btn{height:36px;min-width:36px;font-size:15px}}`;
        document.head.appendChild(st);
    }

    window.ddkSahneKur = ddkSahneKur;
    window.ddkGuncelle = ddkGuncelle;
    window.ddkSeri = ddkSeri;
    window.ddkAnlik = ddkAnlik;
    window.ddkGeriYukle = ddkGeriYukle;
    window.ddkSporcu = ddkSporcu;
    // e2e: i. şüphelinin ekrandaki (client) gövde noktası
    window.ddkUretTest = (zor, tip, kadro) => { const Z = DZ[zor], n = tip === 'sorgu' ? (Z.karma ? 6 : 5) : tip === 'ortak' ? Math.max(6, Z.n) : Z.n; return vakaUret(n, Z, tip, kadro); }; window.ddkEslesTest = eslesir; window.ddkMetinTest = ipucuMetni; window.ddkTipler = () => Object.keys(DZ).map((z) => [z, DZ[z].tip]);
    window.ddkVakaTest = (zor, tip, vid, ek) => { const st = durum(); st.zor = zor; st.tip = tip; st.vid = vid; vakaKur(st); Object.assign(st, { faz: 'oyun' }, ek || {}); kaydet(); animTemizle(); _perdeFaz = null; ddkGuncelle(); return st; }; window.ddkOlayTest = (tip) => olayUygula(durum(), tip, true); window.ddkFinalTest = (mod) => { const st = durum(); st.finalTip = mod; kovalaKur(st); kaydet(); ddkGuncelle(); }; window.ddkYakalaTest = (tip) => { _yakala = { t: performance.now(), tip }; };
    window.ddkPozTest = (st, i) => poz(st, i); // e2e: olay yerine göre şüpheli yeri
    window.ddkSupheliNokta = (i) => { if (!_cv) return null; const r = _cv.getBoundingClientRect(), st = durum(); return { x: r.left + _ox + SX(st, i) * _olcek, y: r.top + _oy + supheliY(st, i, .45) * _olcek }; };
})();
