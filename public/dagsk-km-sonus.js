/* ================================================================================================
   🛰️ SON ÜS — Karışık Sınıf › Oyunlar teması 'sonus' (2026-11-05, v379). Kullanıcı: "çocuklar oyunlardan sıkıldı gibi, 8 yaş için ne yapalım",
   ekran taslağına "yap bakalım, bunu sevdim". Taslak: https://claude.ai/artifact/Jq49VDJq1ZPfkxzL6S3g4Z
   FARK: tek derslik oyun değil, haftalarca süren hikâye. Her ders bir bölüm: geçen ders ne oldu → gizli görevler → hep birlikte savaş →
     sınıf el kaldırarak karar verir (hoca dokunur) → merak bırakan son. Karar sonraki bölümü gerçekten değiştirir.
   KURALLAR (STANDING): düşman herkes atmadan düşmez, koçta "Hep birlikte bitir"; finalde herkesin adı, tek kahraman yok; tur sırasında puan sıralaması yok.
   GİZLİ GÖREV: çocuğun ortalamasına göre (kmCanavarSporcuOrtalama); yalnız "Gizli görev" düğmesiyle görünür, hoca kulağına söyler. Yapınca herkes görür, kalkan +1.
   12 SAAT İSTİSNASI (kullanıcı onaylı): hikâye 'dag_km_sonus_<konum>' KM_OYUN_SIFIR_ONEK'te DEĞİL, bu yüzden sıfırlanmaz; sınıf başına ayrıdır, km-ortak ile
     cihazlara gider. Gün değişince yarım kalan savaşın ilerlemesi sıfırlanır, bölüm ve kararlar kalır (derse gelmeyen de "Geçen ders" ekranıyla yetişir).
   KABUK: skor girişi Oyunlar'ın dock'u. suSahneKur · suGuncelle · suSeri(s, i, kaydedilecek, done) · suAnlik · suGeriYukle · suSporcu · suAyarUygula · suFinalZorla.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const KALKAN_MAKS = 15;
    const SEKIL = {
        suru: '<rect x="20" y="130" width="70" height="60" rx="8" fill="R"/><rect x="34" y="146" width="14" height="10" fill="#FFB02E"/><rect x="62" y="146" width="14" height="10" fill="#FFB02E"/><rect x="110" y="60" width="90" height="74" rx="10" fill="R"/><rect x="126" y="84" width="18" height="12" fill="#FF4B3E"/><rect x="166" y="84" width="18" height="12" fill="#FF4B3E"/><rect x="190" y="150" width="70" height="60" rx="8" fill="R"/><rect x="204" y="166" width="14" height="10" fill="#FFB02E"/><rect x="232" y="166" width="14" height="10" fill="#FFB02E"/><rect x="120" y="200" width="60" height="50" rx="8" fill="R"/><rect x="132" y="214" width="12" height="9" fill="#FFB02E"/><rect x="156" y="214" width="12" height="9" fill="#FFB02E"/>',
        orumcek: '<ellipse cx="140" cy="130" rx="70" ry="52" fill="R"/><circle cx="116" cy="118" r="11" fill="#FF4B3E"/><circle cx="164" cy="118" r="11" fill="#FF4B3E"/><path d="M78 110 20 60M72 134 8 134M80 160 22 220M202 110 260 60M208 134 272 134M200 160 258 220" stroke="R" stroke-width="16" stroke-linecap="round" fill="none"/>',
        kol: '<rect x="80" y="20" width="120" height="84" rx="10" fill="R"/><rect x="102" y="50" width="30" height="16" fill="#FF4B3E"/><rect x="148" y="50" width="30" height="16" fill="#FF4B3E"/><rect x="60" y="112" width="160" height="120" rx="12" fill="#2B3450"/><rect x="112" y="142" width="56" height="56" rx="8" fill="#FF4B3E"/><rect x="4" y="112" width="48" height="150" rx="12" fill="R"/><rect x="228" y="112" width="48" height="150" rx="12" fill="R"/><rect x="82" y="240" width="48" height="76" rx="8" fill="R"/><rect x="150" y="240" width="48" height="76" rx="8" fill="R"/>',
        drone: '<ellipse cx="140" cy="140" rx="84" ry="40" fill="R"/><circle cx="140" cy="132" r="22" fill="#5FD4FF"/><path d="M60 110 20 70M220 110 260 70M60 170 20 210M220 170 260 210" stroke="R" stroke-width="14" stroke-linecap="round"/><ellipse cx="20" cy="66" rx="30" ry="7" fill="#9BA7C4"/><ellipse cx="260" cy="66" rx="30" ry="7" fill="#9BA7C4"/><ellipse cx="20" cy="214" rx="30" ry="7" fill="#9BA7C4"/><ellipse cx="260" cy="214" rx="30" ry="7" fill="#9BA7C4"/>',
        titan: '<path d="M140 10 230 70 250 220 180 310H100L30 220 50 70Z" fill="R"/><path d="M92 92h36l-10 26H92zM188 92h-36l10 26h26z" fill="#FFB02E"/><path d="M140 140 172 196 140 262 108 196Z" fill="#FF7A2F"/>',
        komutan: '<path d="M60 40 100 76H180L220 40 210 120H70Z" fill="#FFB02E"/><rect x="72" y="76" width="136" height="88" rx="14" fill="R"/><rect x="90" y="106" width="100" height="18" rx="4" fill="#FF4B3E"/><path d="M40 170H240L262 310H18Z" fill="#2B3450"/><path d="M140 186 170 230 140 286 110 230Z" fill="#FF4B3E"/>'
    };
    // Hikâye. Her kararın sonucu hem sayıyı (kalkan, sıradaki düşmanın gücü, ekip) hem de sonraki bölümün "Geçen ders" yazısını değiştirir.
    const BOLUMLER = [
        { baslik: 'Alarm', dusman: 'Paslı Sürü', sekil: 'suru', renk: '#9C6A3C', giris: 'Sirenler çalıyor. Paslı robot sürüsü son üsse doğru geliyor. Bütün ekip görev başına!', soru: 'Sürü dağıldı. Şimdi ne yapalım?',
          a: { ad: 'Duvarları güçlendir', ac: 'Üs sağlamlaşır, ama düşman toparlanır.', kalkan: 3, ozet: 'Ekip duvarları güçlendirdi. Üs artık daha sağlam.' },
          b: { ad: 'Sürünün peşine düş', ac: 'Riskli, ama sıradaki düşman zayıf yakalanır.', kalkan: -1, zayif: 0.15, ozet: 'Ekip sürünün peşine düştü ve yuvasını buldu. Sıradaki düşman zayıf.' }, merak: 'Kaçan robotlar tünele girdi... ve karanlıkta bir şey parlıyor.' },
        { baslik: 'Karanlık Tünel', dusman: 'Örümcek Bot', sekil: 'orumcek', renk: '#3F4A6B', giris: 'Tünelin içi zifiri karanlık. Duvarlarda bir şey hareket ediyor. Örümcek Bot yolu kesti!', soru: 'Örümcek Bot kaçtı. Tünelde iki yol var.',
          a: { ad: 'Işığı takip et', ac: 'Biri yardım çağırıyor. Yeni bir dost olabilir.', muttefik: 'Volt', ozet: 'Ekip ışığı takip etti ve kapana kısılmış robot Volt\'u kurtardı. Volt artık bizimle!' },
          b: { ad: 'Tüneli patlat', ac: 'Düşmanın yolu kapanır, üs güvene girer.', kalkan: 3, ozet: 'Ekip tüneli patlattı. Düşmanın kısa yolu kapandı.' }, merak: 'Ama yerin altından dev adımlar geliyor. Üssün kapısına doğru...' },
        { baslik: 'Kapıyı Tut', dusman: 'Demir Kol', sekil: 'kol', renk: '#39435E', giris: 'Dev Demir Kol üssün kapısına ulaştı. Kapı yıkılırsa üs düşer. Kapıyı tutmak zorundayız!', soru: 'Demir Kol geriledi. Şimdi ne yapalım?',
          a: { ad: 'Kalkanı onar', ac: 'Daha güvendeyiz, ama Demir Kol iyileşir.', kalkan: 3, ozet: 'Ekip kalkanı onardı. Kapı artık çok daha güçlü.' },
          b: { ad: 'Zayıf noktasını bul', ac: 'Riskli, ama büyük ödül kapılabilir.', kalkan: -1, zayif: 0.2, ozet: 'Ekip Demir Kol\'un peşine düştü ve düşmanın planını ele geçirdi.' }, merak: 'Kapıyı tuttunuz. Ama radarda yeni bir sinyal var...' },
        { baslik: 'Hayalet Sinyal', dusman: 'Hayalet Drone', sekil: 'drone', renk: '#2E5C74', giris: 'Radar çıldırdı. Görünmez bir drone üssün üstünde dolaşıyor. Onu indirmeden kimse uyuyamaz!', soru: 'Drone düştü. İçinden bir harita çıktı.',
          a: { ad: 'Haritayı çöz', ac: 'Düşmanın nereden geldiğini öğreniriz.', zayif: 0.15, ozet: 'Ekip haritayı çözdü ve düşmanın Kor Çekirdek\'ten beslendiğini buldu.' },
          b: { ad: 'Drone\'u tamir et', ac: 'Düşman makinesi bizim için çalışır.', muttefik: 'Gölge', ozet: 'Ekip drone\'u tamir etti. Adı artık Gölge ve bizim için uçuyor!' }, merak: 'Yer sarsılıyor. Bir şey uyandı...' },
        { baslik: 'Kor Çekirdek', dusman: 'Kor Titan', sekil: 'titan', renk: '#7A2E1C', giris: 'Yerin altından Kor Titan yükseldi. Düşmanın bütün gücü onda. Tüm ekip aynı anda vurmalı!', soru: 'Titan parçalandı. Çekirdek hâlâ yanıyor.',
          a: { ad: 'Çekirdeği üsse al', ac: 'Üs muazzam güçlenir.', kalkan: 4, ozet: 'Ekip çekirdeği üsse taşıdı. Kalkanlar hiç olmadığı kadar güçlü.' },
          b: { ad: 'Çekirdeği yok et', ac: 'Düşman büyük güç kaybeder.', zayif: 0.25, ozet: 'Ekip çekirdeği yok etti. Düşman komutanı gücünün çoğunu kaybetti.' }, merak: 'Ekranda bir yüz belirdi: "Beni buraya getirmeniz güzel. Sıra bende."' },
        { baslik: 'Son Savaş', dusman: 'Komutan Zero', sekil: 'komutan', renk: '#30264F', giris: 'Her şeyin arkasındaki Komutan Zero karşınızda. Bu savaşı hep birlikte bitireceğiz!', merak: 'Üs kurtuldu. Ama gökyüzünde daha önce görülmemiş bir gemi var...' }
    ];
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10));
    const konum = () => ((typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan');
    const ilkAd = (ad) => (typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]);
    const liste = () => (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || [];
    const ic = (k) => { try { return typeof kmOyunIcerik !== 'function' || kmOyunIcerik('sonus', k); } catch (e) { return true; } };
    const renk = (i) => (typeof kmOyunRenk === 'function' ? kmOyunRenk('sonus', i) : '#5FD4FF');
    const azHareket = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const puan = (v) => { v = String(v); return v === 'X' ? 10 : (v === 'M' ? 0 : (+v || 0)); };
    const hasar = (v) => { const p = puan(v); return String(v) === 'X' ? 4 : p >= 9 ? 3 : p >= 7 ? 2 : p >= 1 ? 1 : 0; };

    /* ---- gizli görevler: seviyeye göre, ok dizisi üzerinde saf kontrol ---- */
    const GOREVLER = {
        yeni: [{ id: 'hepsi', yazi: 'Bütün okları hedefe değdir', ok: (l) => l.length > 0 && l.every((p) => p > 0) }, { id: 'mavi1', yazi: 'Bir oku maviye ya da daha içeri vur', ok: (l) => l.some((p) => p >= 5) }],
        orta: [{ id: 'kirmizi1', yazi: 'Bir oku kırmızıya ya da daha içeri vur', ok: (l) => l.some((p) => p >= 7) }, { id: 'mavi2', yazi: 'İki oku maviye ya da daha içeri vur', ok: (l) => l.filter((p) => p >= 5).length >= 2 }],
        iyi: [{ id: 'kirmizi2', yazi: 'İki oku kırmızıya ya da daha içeri vur', ok: (l) => l.filter((p) => p >= 7).length >= 2 }, { id: 'sari1', yazi: 'Bir oku sarıya vur', ok: (l) => l.some((p) => p >= 9) }]
    };
    function ortalama(s) { try { if (typeof kmCanavarSporcuOrtalama === 'function') return kmCanavarSporcuOrtalama(s.g, s.ad) || 0; } catch (e) { } return 0; }
    function seviyeOf(o) { return o >= 7 ? 'iyi' : o >= 5 ? 'orta' : 'yeni'; }
    function gorevBul(s, st) {
        const k = s.g + '|' + s.ad; let h = st.bolum + st.sezon * 7; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
        const l = GOREVLER[seviyeOf(ortalama(s))]; return l[h % l.length];
    }

    /* ---- durum ---- */
    function anahtar() { return 'dag_km_sonus_' + konum(); }
    let _st = null, _ham = null, _kn = null, _gorevAcik = false, _zaman = [], _yazi = null;
    function seviye() { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a.sonusSeri > 0) ? a.sonusSeri : 1; } catch (e) { return 1; } }
    function toplamHesapla(st) {
        let top = 0; liste().forEach((s) => { const o = ortalama(s) || 6; top += 3 * (o >= 9 ? 2.6 : o >= 7 ? 2 : o >= 5 ? 1.4 : 1.1); });
        return Math.round(Math.max(14, top * seviye()) * (1 + 0.08 * (st.bolum + (st.sezon - 1) * BOLUMLER.length)) * (1 - (st.zayif || 0)));
    }
    function savasSifirla(st) { st.toplam = 0; st.can = 0; st.atanlar = {}; st.seri = 0; st.katki = {}; st.gorevOk = {}; st.faz = 'hikaye'; st.finalAdlar = null; }
    function yeniKampanya() { const st = { sezon: 1, bolum: 0, kalkan: 5, ekip: [], gecmis: [], zayif: 0, ozetSon: null, merakSon: null, tarih: bugun(), bitenBugun: 0 }; savasSifirla(st); return st; }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_kn !== konum() || ham !== _ham || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _kn = konum(); _ham = ham; }
        if (!_st || !BOLUMLER[_st.bolum]) { _st = yeniKampanya(); kaydet(); }
        if (_st.tarih !== bugun()) { // yeni ders: hikâye kalır, yarım savaş sıfırlanır; biten bölüm sıradakine geçer
            if (_st.faz === 'son') ilerle(_st); else if (_st.faz !== 'karar') savasSifirla(_st);
            _st.tarih = bugun(); _st.bitenBugun = 0; kaydet();
        }
        return _st;
    }
    function kaydet() { try { _ham = JSON.stringify(_st); localStorage.setItem(anahtar(), _ham); } catch (e) { } }
    function ilerle(st) {
        if (st.bolum >= BOLUMLER.length - 1) { st.bolum = 0; st.sezon = (st.sezon || 1) + 1; st.zayif = 0; } else st.bolum++;
        const ek = (st.ekip || []).length; st.kalkan = Math.min(KALKAN_MAKS, Math.max(0, st.kalkan + ek)); // her dost bölüm başına +1 kalkan getirir
        savasSifirla(st);
    }
    const atabilenler = () => liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]));
    const herkesAtti = (st) => { const l = atabilenler(); return l.length > 0 && l.every((s) => st.atanlar[s.g + '|' + s.ad]); };
    const atanSayi = (st) => atabilenler().filter((s) => st.atanlar[s.g + '|' + s.ad]).length;
    function savasBasla(st) { st.toplam = toplamHesapla(st); st.can = st.toplam; st.zayif = 0; st.faz = 'savas'; }
    function rozetToplu(anahtarlar) {
        anahtarlar.forEach((k) => { const i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1), sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return; const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.sonus = o.sonus || {}; o.sonus.bolum = (o.sonus.bolum || 0) + 1; sp.lastModified = Date.now(); });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }
    function bitir(st) {
        const k = liste().map((x) => x.g + '|' + x.ad).filter((a) => st.atanlar[a]);
        st.finalAdlar = k.map((a) => ilkAd(a.slice(a.indexOf('|') + 1))); rozetToplu(k); st.bitenBugun = (st.bitenBugun || 0) + 1;
        st.faz = BOLUMLER[st.bolum].soru ? 'karar' : 'son';
        if (st.faz === 'son') { st.merakSon = BOLUMLER[st.bolum].merak; st.ozetSon = 'Ekip Komutan Zero\'yu hep birlikte yendi. Üs kurtuldu!'; }
    }

    /* ---- ses ---- */
    let AC = null;
    const sesAcik = () => { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1'; } catch (e) { return true; } };
    function ton(f, sure, gec, tip, gur) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (gec || 0); o.type = tip || 'square'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(gur || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + sure); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + sure); } catch (e) { } }
    const SES = { vur: () => { ton(160, 0.14, 0, 'sawtooth', 0.09); ton(90, 0.2, 0.05, 'square', 0.07); }, gorev: () => [523, 659, 784].forEach((f, i) => ton(f, 0.16, i * 0.09, 'square', 0.06)), saldiri: () => { ton(70, 0.5, 0, 'sawtooth', 0.12); ton(50, 0.6, 0.15, 'square', 0.1); }, zafer: () => [392, 523, 659, 784, 1047].forEach((f, i) => ton(f, 0.28, i * 0.14, 'square', 0.07)) };

    /* ---- çizim ---- */
    const panel = () => $('km-oyun-panel-sonus');
    function dusmanSvg(b, boy) { return '<svg class="su-dusman" width="' + boy + '" height="' + boy + '" viewBox="0 0 280 320" role="img" aria-label="' + esc(b.dusman) + '">' + SEKIL[b.sekil].replace(/fill="R"/g, 'fill="' + b.renk + '"').replace(/stroke="R"/g, 'stroke="' + b.renk + '"') + '</svg>'; }
    function kutucuklar(st) {
        const ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1;
        return '<div class="su-kids" id="su-kids">' + liste().map((s, i) => { const k = s.g + '|' + s.ad, at = st.atanlar[k], gok = st.gorevOk[k]; return '<button type="button" class="su-kid' + (i === ai ? ' aktif' : '') + (at ? ' atti' : '') + '" data-km-sporcu="' + i + '" style="--r:' + renk(i) + '" aria-label="' + esc(ilkAd(s.ad)) + (at ? ', attı' : '') + (gok ? ', görevi yaptı' : '') + '"><i>' + (gok ? '★' : (at ? '✓' : '')) + '</i><span>' + esc(ilkAd(s.ad)) + '</span></button>'; }).join('') + '</div>';
    }
    function aktifSporcu() { const i = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0; return liste()[i] || null; }
    function savasHTML(st) {
        const b = BOLUMLER[st.bolum], o = st.toplam ? Math.max(0, st.can / st.toplam) : 1, n = atabilenler().length, a = atanSayi(st), sa = 5 - (st.seri % 5), akt = aktifSporcu();
        return '<div class="su-ust"><div><span class="su-et">Bölüm ' + (st.bolum + 1) + ' · ' + esc(b.baslik) + '</span><b class="su-baslik" id="su-dusman-ad">' + esc(b.dusman) + '</b></div><div class="su-ust-sag">' + (akt ? '<b class="su-sira" id="su-sira">Sıra: ' + esc(ilkAd(akt.ad)) + '</b>' : '') + '<span id="su-sayac">' + a + ' / ' + n + ' çocuk attı</span>'
            + (ic('gorev') && akt ? '<button type="button" class="su-btn acik" id="su-gorev-ac">Gizli görev: ' + esc(ilkAd(akt.ad)) + '</button>' : '') + '</div></div>'
            + '<div class="su-arena"><div class="su-kapi"><b>Üs</b><span id="su-kalkan">Kalkan ' + st.kalkan + '</span></div><div class="su-orta" id="su-orta">' + (_yazi ? '<b class="su-vurus" style="color:' + _yazi.r + '">' + esc(_yazi.m) + '</b>' + (_yazi.alt ? '<span>' + esc(_yazi.alt) + '</span>' : '') : '') + '</div>'
            + '<div class="su-rakip" id="su-rakip">' + dusmanSvg(b, 170) + '<div class="su-can" role="img" aria-label="' + esc(b.dusman) + ' gücü yüzde ' + Math.round(o * 100) + '"><i id="su-can-ic" style="width:' + (o * 100) + '%"></i></div></div></div>'
            + '<div class="su-alt"><span>' + (st.can <= 0 ? 'Son vuruşa hazır! ' + (n - a) + ' çocuk daha atınca hep birlikte bitireceğiz.' : (ic('saldiri') ? 'Düşman saldırısına ' + sa + ' seri' : 'Herkes atmadan bölüm bitmez')) + '</span>'
            + (st.can <= 0 ? '<button type="button" class="su-btn ana" id="su-bitir">Hep birlikte bitir</button>' : '') + ((st.ekip || []).length ? '<span class="su-ekip">Ekip: ' + st.ekip.map(esc).join(', ') + '</span>' : '') + '</div>' + kutucuklar(st);
    }
    function ciz() {
        const kap = $('su-icerik'); if (!kap) return; const st = durum(), b = BOLUMLER[st.bolum];
        const ad = (l) => l.map(esc).join(' · ');
        if (st.faz === 'hikaye') {
            kap.innerHTML = '<div class="su-tam su-iki"><div class="su-metin"><span class="su-et">' + (st.sezon > 1 ? st.sezon + '. sezon · ' : '') + 'Son Üs · ' + (st.bolum + 1) + '. bölüm</span>'
                + (st.ozetSon ? '<h2 class="su-buyuk">Geçen ders<br>ne oldu?</h2><p class="su-p">' + esc(st.ozetSon) + (st.merakSon ? ' ' + esc(st.merakSon) : '') + '</p>' : '<h2 class="su-buyuk">' + esc(b.baslik) + '</h2>')
                + '<p class="su-p vurgu">' + esc(b.giris) + '</p><div class="su-sat"><button type="button" class="su-btn ana" id="su-basla">Bölümü başlat</button></div></div><div class="su-gorsel">' + dusmanSvg(b, 280) + '<b class="su-dusman-ad">' + esc(b.dusman) + '</b></div></div>';
        } else if (st.faz === 'savas') {
            kap.innerHTML = savasHTML(st);
        } else if (st.faz === 'karar') {
            const sec = (k, s, cl) => '<button type="button" class="su-secim ' + cl + '" data-karar="' + k + '"><b>' + k.toUpperCase() + ' · ' + esc(s.ad) + '</b><span>' + esc(s.ac) + '</span></button>';
            kap.innerHTML = '<div class="su-tam"><span class="su-et">Karar sizin · el kaldırın, hoca dokunsun</span><h2 class="su-orta-b">' + esc(b.soru) + '</h2><div class="su-secimler" id="su-secimler">' + sec('a', b.a, 'mavi') + sec('b', b.b, 'kizil') + '</div></div>';
        } else {
            kap.innerHTML = '<div class="su-tam su-son"><span class="su-et yesil">' + (st.bolum + 1) + '. bölüm bitti</span><h2 class="su-buyuk">' + esc(b.merak || '') + '</h2><p class="su-p vurgu">Gelecek ders devam ediyor!</p><div class="su-ad" id="su-adlar"><small>Bu bölümü hep birlikte bitirdiniz</small><span>' + ad(st.finalAdlar || []) + '</span></div><div class="su-sat"><button type="button" class="su-btn acik" id="su-devam">Bugün devam et: sıradaki bölüm</button></div></div>';
        }
        if (_gorevAcik && st.faz === 'savas') gorevCiz(kap);
    }
    function gorevCiz(kap) {
        const s = aktifSporcu(); if (!s) return; const st = durum(), g = gorevBul(s, st), yapti = st.gorevOk[s.g + '|' + s.ad];
        const d = document.createElement('div'); d.className = 'su-gorev'; d.id = 'su-gorev'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Gizli görev');
        d.innerHTML = '<div class="su-gorev-kart"><span class="su-et koyu">Kulağına söyle · ' + esc(ilkAd(s.ad)) + '</span><b>' + esc(yapti ? 'Görevini yaptı!' : g.yazi) + '</b><span>Yaparsa kalkan +1</span><button type="button" class="su-btn koyu" id="su-gorev-kapat">Gizle</button></div>';
        kap.appendChild(d);
    }
    function guncelle() { ciz(); }

    /* ---- olaylar ---- */
    function basla() { const st = durum(); if (st.faz !== 'hikaye') return; savasBasla(st); kaydet(); ciz(); }
    function kararVer(k) {
        const st = durum(), b = BOLUMLER[st.bolum], s = b[k]; if (st.faz !== 'karar' || !s) return;
        st.kalkan = Math.min(KALKAN_MAKS, Math.max(0, st.kalkan + (s.kalkan || 0))); st.zayif = s.zayif || 0;
        if (s.muttefik && !st.ekip.includes(s.muttefik)) st.ekip.push(s.muttefik);
        st.ozetSon = s.ozet; st.merakSon = b.merak; st.gecmis.push({ b: st.bolum, s: st.sezon, k, t: Date.now() }); st.faz = 'son'; kaydet(); ciz();
    }
    function suFinalZorla() {
        const st = durum(); if (st.faz !== 'savas' || st.can > 0) return;
        const f = () => { const s = durum(); if (s.faz !== 'savas') return; bitir(s); kaydet(); SES.zafer(); ciz(); };
        const kalan = atabilenler().length - atanSayi(st);
        if (kalan > 0 && typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Bölüm şimdi bitsin mi?<br><small>' + kalan + ' çocuk henüz atmadı. Atanların hepsi adıyla görünür.</small>', f, 'Hep birlikte bitir', 'Bekle'); else f();
    }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }
    function sonra(fn, ms) { const t = setTimeout(fn, ms); _zaman.push(t); }
    function yazi(m, r, alt, ms) { _yazi = { m, r, alt }; const o = $('su-orta'); if (o) o.innerHTML = '<b class="su-vurus" style="color:' + r + '">' + esc(m) + '</b>' + (alt ? '<span>' + esc(alt) + '</span>' : ''); sonra(() => { _yazi = null; const x = $('su-orta'); if (x) x.innerHTML = ''; }, ms || 1500); }
    function suSeri(s, i, kaydedilecek, done) {
        zamanTemizle(); _yazi = null; _gorevAcik = false;
        const st = durum(); if (st.faz === 'hikaye') savasBasla(st);
        if (st.faz !== 'savas') { kaydet(); ciz(); try { done(); } catch (e) { } return; } // karar/son ekranında girilen seri kayda geçer, hikâyeyi etkilemez
        const key = s.g + '|' + s.ad, puanlar = (kaydedilecek || []).map((k) => k.puan);
        let top = 0; puanlar.forEach((v) => { top += hasar(v); });
        const gercek = Math.min(st.can, top); st.can -= gercek; st.katki[key] = (st.katki[key] || 0) + top; st.atanlar[key] = 1; st.seri = (st.seri || 0) + 1;
        let gorev = null;
        if (ic('gorev') && !st.gorevOk[key]) { const g = gorevBul(s, st); if (g.ok(puanlar.map(puan))) { st.gorevOk[key] = 1; st.kalkan = Math.min(KALKAN_MAKS, st.kalkan + 1); gorev = g; } }
        let saldiri = false;
        if (ic('saldiri') && st.seri % 5 === 0 && st.can > 0) { saldiri = true; st.kalkan = Math.max(0, st.kalkan - 1); }
        const final = st.can <= 0 && herkesAtti(st);
        if (final) bitir(st);
        kaydet();
        if (!panel()) { try { done(); } catch (e) { } return; }
        const adi = ilkAd(s.ad);
        if (final) { ciz(); SES.zafer(); try { if (typeof kmOyunBanner === 'function') kmOyunBanner('🛰️ ' + BOLUMLER[st.bolum].dusman.toLocaleUpperCase('tr-TR') + ' YENİLDİ!', 'Hep birlikte: ' + (st.finalAdlar || []).slice(0, 14).join(', ') + ((st.finalAdlar || []).length > 14 ? ' ve tüm ekip' : ''), 'bitis'); } catch (e) { } try { done(); } catch (e) { } return; }
        ciz();
        const r = $('su-rakip'); if (r && !azHareket()) { r.classList.remove('vuruldu'); void r.offsetWidth; r.classList.add('vuruldu'); }
        if (top) SES.vur();
        yazi(top ? (top >= 7 ? 'MÜTHİŞ VURUŞ!' : 'VURDU!') : 'Iskaladı, sıradaki vuracak!', top ? '#FFB02E' : '#A9B3C9', top ? adi : '', 1100);
        let bek = 1000;
        if (gorev) { sonra(() => { SES.gorev(); yazi(adi.toLocaleUpperCase('tr-TR') + ' GÖREVİ YAPTI!', '#FFB02E', gorev.yazi + ' · Kalkan +1', 1500); }, bek); bek += 1400; }
        if (saldiri) { sonra(() => { SES.saldiri(); const kp = document.querySelector('.su-kapi'); if (kp && !azHareket()) kp.classList.add('sarsil'); yazi('DÜŞMAN SALDIRDI!', '#FF7A70', 'Kalkan -1', 1400); }, bek); bek += 1300; }
        sonra(() => { try { done(); } catch (e) { } ciz(); }, bek);
    }
    function nasil() {
        const m = 'Her ders hikâyenin bir bölümü. Çocuklar atar, oklar düşmanın gücünü düşürür: sarı 3, kırmızı 2, diğerleri 1, X 4.<br>Her çocuğa gizli görev: "Gizli görev" düğmesine bas, kulağına söyle. Yaparsa kalkan +1.<br>Herkes atmadan bölüm bitmez. Sonunda sınıf el kaldırarak karar verir, karar sonraki bölümü değiştirir.';
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste(m, () => { }, 'Tamam', 'Kapat'); else yazi('Herkes atar, sınıf karar verir', '#5FD4FF', '', 2500);
    }
    function yeniSor() {
        const f = () => { const st = durum(); savasSifirla(st); kaydet(); zamanTemizle(); _yazi = null; ciz(); try { showToast('Bölüm baştan başladı. Hikâye yerinde duruyor.', 'success'); } catch (e) { } };
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Bu bölüm baştan başlasın mı?<br><small>Hikâye ve kararlar kalır, serileri silinmez.</small>', f, 'Baştan başlat', 'Vazgeç'); else f();
    }
    function hikayeSifirSor() {
        const f = () => { _st = yeniKampanya(); kaydet(); zamanTemizle(); _yazi = null; ciz(); try { showToast('Hikâye 1. bölümden başladı.', 'success'); } catch (e) { } };
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Hikâye 1. bölümden başlasın mı?<br><small>Bu sınıfın kararları ve ekibi silinir. Sporcu serileri silinmez.</small>', f, 'Baştan başlat', 'Vazgeç');
    }
    function suSahneKur() {
        const p = panel(); if (!p) return; css(); zamanTemizle(); _yazi = null; _gorevAcik = false;
        p.innerHTML = '<div class="su-sahne"><div id="su-icerik"></div><div class="su-arac"><button type="button" class="su-kucuk" id="su-nasil" aria-label="Nasıl oynanır">?</button><button type="button" class="su-kucuk" id="su-yeni-btn" aria-label="Bölümü baştan başlat">↻</button><button type="button" class="su-kucuk genis" id="su-hikaye-sifir">Hikâyeyi sıfırla</button></div></div>';
        p.onclick = (e) => {
            const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.id === 'su-basla') basla();
            else if (t.id === 'su-gorev-ac') { _gorevAcik = true; ciz(); }
            else if (t.id === 'su-gorev-kapat') { _gorevAcik = false; ciz(); }
            else if (t.id === 'su-bitir') suFinalZorla();
            else if (t.id === 'su-devam') { const st = durum(); ilerle(st); kaydet(); ciz(); }
            else if (t.id === 'su-nasil') nasil();
            else if (t.id === 'su-yeni-btn') yeniSor();
            else if (t.id === 'su-hikaye-sifir') hikayeSifirSor();
            else if (t.dataset && t.dataset.karar) kararVer(t.dataset.karar);
        };
        ciz();
    }
    function css() {
        if ($('su-css')) return; const st = document.createElement('style'); st.id = 'su-css';
        st.textContent = '.km-oyun-panel-sonus{padding:0;background:#0B1020;overflow:hidden;font-family:"Manrope",system-ui,sans-serif}'
            + '.su-sahne{position:absolute;inset:0;color:#F4F6FB;overflow-y:auto;background:#0B1020}#su-icerik{min-height:100%;box-sizing:border-box;padding:16px min(430px,40%) 16px 20px;display:flex;flex-direction:column;gap:10px;position:relative}'
            + '.su-et{font-size:clamp(12px,1.4vw,16px);font-weight:800;letter-spacing:.12em;color:#5FD4FF;text-transform:uppercase}.su-et.yesil{color:#7EDC9E}.su-et.koyu{color:#3A2600}'
            + '.su-baslik,.su-dusman-ad,.su-buyuk,.su-orta-b,.su-vurus{font-family:"Barlow Condensed","Impact",sans-serif;font-weight:800;text-transform:uppercase;line-height:1}.su-baslik{display:block;font-size:clamp(26px,3.6vw,44px)}.su-buyuk{margin:6px 0;font-size:clamp(34px,4.8vw,70px);line-height:.95}.su-orta-b{margin:6px 0 12px;font-size:clamp(30px,4.6vw,58px)}.su-dusman-ad{font-size:clamp(24px,3vw,36px);color:#FF9A92}'
            + '.su-p{margin:0;font-size:clamp(16px,2vw,23px);line-height:1.4;font-weight:600}.su-p.vurgu{font-weight:800;color:#FFB02E;margin-top:8px}.su-sat{margin-top:14px;display:flex;flex-wrap:wrap;gap:8px}'
            + '.su-tam{flex:1;display:flex;flex-direction:column;justify-content:center}.su-iki{display:grid;grid-template-columns:minmax(0,1fr) minmax(160px,34%);gap:20px;align-items:center}.su-gorsel{display:flex;flex-direction:column;align-items:center;gap:8px}.su-gorsel .su-dusman{max-width:100%;height:auto}'
            + '.su-btn{min-height:50px;padding:0 20px;border-radius:25px;border:0;font:inherit;font-size:clamp(14px,1.6vw,17px);font-weight:800;cursor:pointer}.su-btn.ana{background:#FF7A2F;color:#1C0B00}.su-btn.acik{background:#F4F6FB;color:#0B1020}.su-btn.koyu{background:#0B1020;color:#F4F6FB}'
            + '.su-ust{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px}.su-ust-sag{display:flex;flex-wrap:wrap;align-items:center;gap:10px;font-weight:800;color:#5FD4FF;font-size:clamp(14px,1.6vw,18px)}'
            + '.su-sira{font-family:"Barlow Condensed",sans-serif;font-size:clamp(22px,2.8vw,34px);color:#FFB02E;text-transform:uppercase}.su-arena{flex:1;min-height:210px;border-radius:18px;background:#151C31;display:grid;grid-template-columns:minmax(90px,20%) minmax(0,1fr) minmax(120px,28%);gap:12px;align-items:center;padding:12px 16px}.su-kapi{min-height:150px;border-radius:12px;background:#2A3452;border:4px solid #5FD4FF;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;text-align:center}.su-kapi b{font-family:"Barlow Condensed",sans-serif;font-size:clamp(22px,3vw,36px);text-transform:uppercase}.su-kapi span{font-weight:800;color:#5FD4FF;font-size:clamp(13px,1.5vw,17px)}'
            + '.su-orta{display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;min-width:0}.su-vurus{font-size:clamp(26px,4.2vw,50px)}.su-orta span{font-weight:800;font-size:clamp(14px,1.7vw,19px)}.su-rakip{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}.su-rakip .su-dusman{max-width:100%;height:auto}.su-can{width:100%;height:18px;border-radius:9px;background:#39435E;overflow:hidden}.su-can i{display:block;height:100%;background:#FF4B3E;transition:width .4s}'
            + '.su-alt{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;font-size:clamp(13px,1.5vw,16px);font-weight:800;color:#C4CCDD}.su-ekip{color:#7EDC9E}'
            + '.su-kids{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:5px}.su-kid{min-height:44px;border-radius:12px;border:1px solid #2C3654;border-left:5px solid var(--r);background:#151C31;color:#C4CCDD;font:inherit;font-size:13px;font-weight:800;display:flex;align-items:center;gap:4px;padding:0 6px;cursor:pointer;min-width:0}.su-kid span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.su-kid i{font-style:normal;color:#7EDC9E;flex-shrink:0}.su-kid.aktif{background:#F4F6FB;color:#0B1020}.su-kid.aktif i{color:#0B7A3A}.su-kid.atti{opacity:.92}'
            + '.su-secimler{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.su-secim{min-height:190px;border:0;border-radius:20px;color:#F4F6FB;font:inherit;text-align:left;padding:20px;display:flex;flex-direction:column;gap:12px;cursor:pointer}.su-secim b{font-family:"Barlow Condensed",sans-serif;font-size:clamp(26px,3.6vw,46px);line-height:1;text-transform:uppercase}.su-secim span{font-size:clamp(15px,1.9vw,21px);font-weight:600;line-height:1.35}.su-secim.mavi{background:#16365A}.su-secim.mavi b{color:#5FD4FF}.su-secim.kizil{background:#5A2118}.su-secim.kizil b{color:#FFA98C}'
            + '.su-ad{margin-top:18px;display:flex;flex-direction:column;gap:6px}.su-ad small{font-size:13px;font-weight:800;letter-spacing:.1em;color:#A9B3C9;text-transform:uppercase}.su-ad span{font-size:clamp(15px,1.9vw,20px);font-weight:700;line-height:1.5}'
            + '.su-gorev{position:absolute;inset:0;background:rgba(5,8,18,.82);display:flex;align-items:center;justify-content:center;padding:16px min(430px,40%) 16px 16px;z-index:3}.su-gorev-kart{width:min(460px,100%);padding:22px;border-radius:22px;background:#FFB02E;color:#1C1200;display:flex;flex-direction:column;gap:10px}.su-gorev-kart b{font-family:"Barlow Condensed",sans-serif;font-size:clamp(34px,5vw,54px);line-height:1;text-transform:uppercase}.su-gorev-kart>span:not(.su-et){font-weight:800}'
            + '.su-arac{position:absolute;right:10px;top:10px;display:none;gap:6px}.su-kucuk{min-width:44px;height:44px;border-radius:22px;border:1px solid #2C3654;background:#151C31;color:#F4F6FB;font:inherit;font-weight:800;cursor:pointer}.su-kucuk.genis{padding:0 14px;font-size:13px}#su-icerik:has(.su-tam)+.su-arac{display:flex}'
            + '.su-sahne button:focus-visible{outline:3px solid #FFB02E;outline-offset:2px}'
            + '@media(prefers-reduced-motion:no-preference){.su-rakip.vuruldu .su-dusman{animation:su-vur .4s}.su-kapi.sarsil{animation:su-vur .4s}.su-vurus{animation:su-gel .22s ease-out}@keyframes su-vur{20%{transform:translateX(9px)}45%{transform:translateX(-8px)}70%{transform:translateX(5px)}}@keyframes su-gel{from{transform:scale(.6);opacity:.2}to{transform:none;opacity:1}}}'
            + '@media(max-width:760px){#su-icerik{padding:56px 12px 12px}.su-gorev{padding:16px}.su-iki{grid-template-columns:1fr}.su-gorsel{display:none}.su-secimler{grid-template-columns:1fr}.su-secim{min-height:120px}.su-arena{grid-template-columns:70px minmax(0,1fr) 96px;padding:8px}.su-kapi{min-height:110px}}';
        document.head.appendChild(st);
    }
    window.suSahneKur = suSahneKur;
    window.suGuncelle = guncelle;
    window.suSeri = suSeri;
    window.suAnlik = () => JSON.parse(JSON.stringify(durum()));
    window.suGeriYukle = (k) => { if (!k) return; zamanTemizle(); _yazi = null; _st = k; _kn = konum(); kaydet(); if (panel()) ciz(); };
    window.suSporcu = (g, ad) => Math.round((durum().katki || {})[g + '|' + ad] || 0);
    window.suAyarUygula = () => { const st = durum(); if (st.faz !== 'savas' || !st.toplam) return; const o = st.can / st.toplam, y = toplamHesapla(st); if (!y || y === st.toplam) return; st.toplam = y; st.can = Math.round(o * y); kaydet(); ciz(); };
    window.suFinalZorla = suFinalZorla;
    window.suDurum = durum;
    window._suIc = { GOREVLER, BOLUMLER, seviyeOf, hasar, puan };
})();
