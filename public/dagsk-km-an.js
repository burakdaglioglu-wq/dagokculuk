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
    // v475 — seri sonu spiker (kullanıcı: "oyun içi ses hâlâ eski, her sporcu için farklı cümleler kursun"):
    // ad ayrı kayıt (/ses/ad/<adSlug>.mp3, "Burak!") + oyunun 3 kademesinden (iyi/orta/zayıf) rastgele cümle (/ses/an/<tema>-<k>-<j>.mp3).
    // Sesler Gemini "Fenrir" (scripts/an-ses-gemini.mjs bu bloğu okur — JSON kalmalı). Zayıf seri cümleleri yüreklendirir, utandırmaz.
    /*AN_CUMLE*/const AN_CUMLE = {
"topsavasi": [["Korsan gemisine tam isabet!", "Toplar patlıyor, korsan sarsıldı!", "Ne atış! Korsanın direği yıkıldı!", "Gemi su alıyor, harika seri!", "Korsan kaptan şaşkın, müthiş vuruş!", "Top üstüne top, korsan batıyor!"], ["Topu gemiye ulaştırdı!", "Güzel isabet, korsan hissetti!", "Korsan gemisinde bir delik daha!", "Sağlam bir atış!", "Korsana bir top daha!", "İyi gidiyor, devam!"], ["Bu sefer olmadı, korsan barut topluyor!", "Korsan gülüyor, sıradaki gösterecek!", "Toplar suya düştü, dikkat!", "Korsan yaklaşıyor, hep birlikte toparlanalım!", "Ucu ucuna kaçtı, bir dahakine!", "Barut fıçısı doluyor, acele edelim!"]],
"kacis": [["Fırtına gibi esti, gemi uçuyor!", "Yelkenler patladı, ne hız!", "Korsanlar toz yuttu!", "Rüzgârın kralı geldi!", "Gemi dalgaların üstünden uçuyor!", "Müthiş seri, korsanlar geride kaldı!"], ["Yelkenleri doldurdu!", "Gemi ilerliyor, güzel!", "Rüzgâr arkamızda!", "Bir adım daha uzaklaştık!", "Sağlam bir seri!", "Rotada ilerliyoruz!"], ["Rüzgâr zayıf, korsanlar yaklaşıyor!", "Yelkenler sarktı, dikkat!", "Korsan dürbünle bakıyor, hızlanalım!", "Bu sefer rüzgâr küstü, sıradaki üflesin!", "Korsanlar kürek çekiyor, acele!", "Az kaldı yakalanıyorduk!"]],
"filo": [["Arkadan rüzgâr aldı, uçuyor!", "Gemisi roket gibi!", "Rakip gemiler şaşkın!", "Adaya doğru dev bir sıçrama!", "Muhteşem seri, yelkenler dolu!", "Dalgaları yararak geçiyor!"], ["İlerliyor!", "Gemisi yol aldı!", "Güzel bir rüzgâr!", "Adaya biraz daha yaklaştı!", "Sakin ama emin adımlarla!", "Rotayı koruyor!"], ["Yavaşladı, rüzgâr bekliyor!", "Yelkenler biraz boş kaldı!", "Bir sonraki seride rüzgâr onun!", "Dalgalar zorladı ama pes yok!", "Gemi demir attı, kısa bir mola!", "Sabır, rüzgâr geri gelecek!"]],
"catikosu": [["Çatıların üstünden uçuyor!", "Ninja gibi sessiz, ninja gibi hızlı!", "Ne sıçrayış! Çatı arası geçildi!", "Gölge gibi kayıp gitti!", "Kiremitler bile duymadı!", "Muhteşem ninja koşusu!"], ["Koşuyor!", "Çatıdan çatıya ilerliyor!", "Güzel bir adım!", "Ninja yolda!", "Sağlam ilerleme!", "Kapıya biraz daha yaklaştı!"], ["Yavaşladı, çatı arası tehlikeli!", "Ayağı kaydı ama düşmedi!", "Kiremitler tıngırdadı, dikkat!", "Bekçiler duymasın, toparlan!", "Bu sefer tökezledi, sıradaki atlasın!", "Derin nefes, ninja geri döner!"]],
"ejderkule": [["Muhafızı sarstı!", "Shurikenler yağmur gibi!", "Muhafızın kalkanı titriyor!", "Ne atış! Muhafız sendeledi!", "Kuleye giden yol açılıyor!", "Ejder bile duydu bu vuruşu!"], ["İsabet ettirdi!", "Shuriken hedefte!", "Muhafız bir adım geriledi!", "Güzel vuruş!", "Kalkana bir çizik daha!", "Devam, muhafız yoruluyor!"], ["Muhafız gülüyor, daha sert vurun!", "Shurikenler kalkana çarptı!", "Muhafız esniyor, hadi uyandıralım!", "Bu sefer olmadı, sıradaki göstersin!", "Kule hâlâ uzak, hep birlikte!", "Muhafız rahatladı, hemen toparlanalım!"]],
"zombi": [["Zombileri geri püskürttü!", "Zombiler kaçışıyor!", "Barikat sağlam, harika seri!", "Zombi sürüsü dağıldı!", "Ne cesaret! Zombiler korktu!", "Panzehir gibi seri!"], ["Dayandı!", "Barikatı tuttu!", "Zombileri durdurdu!", "Sağlam bekçi!", "Bir zombi daha geri döndü!", "İyi savunma!"], ["Dikkat, zombiler yaklaşıyor!", "Barikat sallanıyor!", "Zombiler homurdanıyor, toparlanalım!", "Bir arkadaş kurtarmaya hazır olsun!", "Kapı gıcırdıyor, acele!", "Zombiler kokuyu aldı, dikkat!"]],
"tahta": [["Takımını ileri fırlattı!", "Dev adımlar atıldı!", "Takım uçuyor!", "Kareler birer birer geçiliyor!", "Ne seri! Takım şaha kalktı!", "Dev taşa bir adım daha!"], ["Adım attırdı!", "Takım ilerliyor!", "Güzel bir ilerleme!", "Bir kare daha!", "Sağlam seri!", "Yol devam ediyor!"], ["Bu sefer yerinde saydı!", "Takım bekliyor, sıradaki koştursun!", "Bu sefer tutmadı ama oyun bitmedi!", "Kısa bir mola, sonra hücum!", "Dikkat, kötü sürpriz kapıda!", "Takım sana güveniyor, bir dahakine!"]],
"timsah": [["Kovayı balıkla doldurdu!", "Balıklar uçuşuyor!", "Dev mışıl mışıl, taşlar yerinde!", "Nehre taş üstüne taş!", "Sessiz ve kusursuz!", "Karşıya yaklaştık, harika!"], ["Balık topladı!", "Kovaya bir balık daha!", "Bir taş daha nehirde!", "Sessizce ilerliyor!", "Güzel, dev hâlâ uyuyor!", "Yavaş ama emin!"], ["Şşşt! Çok gürültü, dev uyanıyor!", "Dev bir gözünü açtı!", "Horlama durdu, dikkat!", "Balıklar kaçtı, sessiz olalım!", "Dev kıpırdandı, parmak uçlarında!", "Az kaldı uyanıyordu!"]],
"bomba": [["Fitili uzattı, bomba sakin!", "Süre kazandık, harika!", "İmha ekibinin yıldızı!", "Fitil söndü sanki, müthiş!", "Ne soğukkanlılık!", "Kablo kesildi, bravo!"], ["Biraz zaman kazandı!", "Fitil yavaşladı!", "Güzel seri, saniyeler bizde!", "Bir nefes aldık!", "Bomba biraz sakinledi!", "Devam, süre lehimize!"], ["Fitil kısalıyor, acele edin!", "Tik tak, tik tak!", "Kıvılcımlar yaklaşıyor!", "Sıradaki kurtarsın bizi!", "Bomba ısınıyor, dikkat!", "Saniyeler azalıyor, odaklanalım!"]],
"blok": [["Canavara güçlü vurdu!", "Canavar sendeledi!", "Bloklar uçuşuyor!", "Ne darbe! Canavar sallanıyor!", "Kritik vuruş geliyor!", "Canavarın zırhı çatladı!"], ["İsabet ettirdi!", "Canavara bir darbe daha!", "Güzel vuruş!", "Canavar hissetti!", "Bir blok daha düştü!", "Devam, canavar yoruluyor!"], ["Canavar kükrüyor, daha güçlü vurun!", "Canavar güldü, intikam zamanı!", "Bu sefer olmadı, sıradaki vursun!", "Canavar dişlerini gösteriyor!", "Bloklar sağlam, hep birlikte kıralım!", "Canavar sinirlendi, dikkat!"]],
"canavar": [["Canavarı sarstı!", "Arena sallanıyor!", "Zayıf noktaya tam isabet!", "Ne vuruş! Canavar dizlerinin üstünde!", "Seyirciler ayakta!", "Canavarın canı eriyor!"], ["İsabet ettirdi!", "Canavara bir darbe!", "Güzel atış!", "Canavar geriledi!", "Arena alkışlıyor!", "Devam, az kaldı!"], ["Canavar kükrüyor, daha güçlü vurun!", "Canavar kalkanını kaldırdı!", "Arena sessiz, sıradaki coştursun!", "Canavar sırıtıyor, gösterelim ona!", "Bu sefer kaçtı, bir dahakine!", "Parlayan renge nişan alalım!"]],
"hapsirik": [["Süper gıdıkladı!", "Yaratık kahkahadan yerlere yattı!", "Hapşırık geliyor!", "Burnu kıpır kıpır!", "Ne gıdıklama! Kitap sayfası yakın!", "Yaratık gözyaşları içinde gülüyor!"], ["Gıdıkladı!", "Yaratık kıkırdadı!", "Burnu kaşınıyor!", "Güzel bir tüy darbesi!", "Çubuk doluyor!", "Biraz daha, hapşırmak üzere!"], ["Yaratık kıkırdamadı bile!", "Tüy havada kaldı!", "Yaratık esniyor, daha çok gıdıklayalım!", "Burnu rahat, bir dahakine!", "Yaratık bekliyor, sıradaki gıdıklasın!", "Hapşırık kaçtı, tekrar deneyelim!"]],
"genel": [["Muhteşem bir seri!", "Tam on ikiden!", "Oklar hedefin kalbinde!", "Ne seri ama!", "Şampiyon gibi atış!", "Hedef alev aldı!"], ["Güzel bir seri!", "İsabetler geliyor!", "Sağlam atışlar!", "İyi gidiyor!", "Hedefe yaklaşıyor!", "Devam, böyle!"], ["Bu sefer olmadı, sıradaki seride!", "Derin nefes, bir dahakine!", "Pes yok, devam!", "Odaklan, hedef seni bekliyor!", "Her ok bir ders, devam!", "Sakin ol, yeniden dene!"]]
}/*AN_CUMLE_SON*/;
    const AN_SES_V = 1, AD_SES_V = 1;
    // ad → dosya adı (Türkçe harfler sadeleşir). v476 (kullanıcı: "soy isimlerini de söyle"): spiker AD SOYAD söyler →
    // "Çağrı Şükrü Yılmaz" → "cagri-sukru-yilmaz". Ad-soyad kaydı yoksa eski ilk ad kaydına ("cagri") düşer. scripts/an-ses-gemini.mjs aynısını kullanır.
    const sadele = (w) => w.toLocaleLowerCase('tr-TR').replace(/[çğıöşüâîû]/g, (c) => ({ 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' }[c])).replace(/[^a-z0-9]/g, '');
    const adSlug = (ad) => String(ad || '').trim().split(/\s+/).map(sadele).filter(Boolean).join('-');
    const ilkAdSlug = (ad) => sadele(String(ad || '').trim().split(/\s+/)[0] || '');
    const tamAdTR = (ad) => String(ad || '').trim().split(/\s+/).filter(Boolean).map((w) => w.toLocaleLowerCase('tr-TR').replace(/^./, (c) => c.toLocaleUpperCase('tr-TR'))).join(' ');
    // Hangi cümlelerin sesi hazır: /ses/an/var.json (üretim betiği yazar). Hazır olan varsa yalnız onlardan seçilir;
    // o oyunun sesi henüz yoksa yine 6 farklı cümleden seçilir, tarayıcı sesiyle okunur.
    let AN_VAR = {};
    try { fetch('/ses/an/var.json?v=' + AN_SES_V).then((r) => (r.ok ? r.json() : {})).then((j) => { AN_VAR = j || {}; }).catch(() => { }); } catch (e) { }
    const sesVarMi = (tema, k, j) => !!(AN_VAR[tema] && AN_VAR[tema][k] && AN_VAR[tema][k].indexOf(j) >= 0);
    const _sonCumle = {}; // tema-kademe → son seçilen cümle sıraları (aynısı üst üste gelmesin)
    function cumleSec(tema, k) {
        const h = AN_CUMLE[tema] && AN_CUMLE[tema][k]; if (!h || !h.length) return -1;
        const sesli = (AN_VAR[tema] && AN_VAR[tema][k] || []).filter((i) => i < h.length);
        const havuz = sesli.length ? sesli : h.map((_, i) => i);
        const a = tema + '-' + k, son = _sonCumle[a] || [], uygun = havuz.filter((i) => son.indexOf(i) < 0);
        const l = uygun.length ? uygun : havuz, j = l[Math.floor(Math.random() * l.length)];
        son.push(j); if (son.length > Math.min(3, havuz.length - 1)) son.shift(); _sonCumle[a] = son; return j;
    }
    let _spiker = [];
    function spikerDur() { _spiker.forEach((a) => { try { a.onended = a.onerror = null; a.pause(); } catch (e) { } }); _spiker = []; }
    // Önceden yükle; cal() çağrılınca önce ad, bitince cümle. Ad dosyası yoksa yalnız cümle; cümle de yoksa yedek (tarayıcı sesi).
    function spikerHazirla(tema, k, j, ad, yedekMetin) {
        let adA = null, cA = null;
        try { if (ad) { // önce ad-soyad kaydı, yoksa ilk ad kaydı
                const tam = adSlug(ad), ilk = ilkAdSlug(ad);
                adA = new Audio('/ses/ad/' + tam + '.mp3?v=' + AD_SES_V); adA.preload = 'auto';
                adA.onerror = () => { if (!adA._ilk && ilk && ilk !== tam) { adA._ilk = true; adA.src = '/ses/ad/' + ilk + '.mp3?v=' + AD_SES_V; adA.load(); } else adA._yok = true; }; }
            cA = new Audio('/ses/an/' + tema + '-' + k + '-' + j + '.mp3?v=' + AN_SES_V); cA.preload = 'auto'; cA.onerror = () => { cA._yok = true; }; } catch (e) { }
        return function cal() {
            if (sessiz()) return;
            spikerDur(); try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
            if (!cA || cA._yok) { soyle(yedekMetin, true); return; }
            _spiker = [adA, cA].filter(Boolean);
            const cumleCal = () => { cA.onerror = () => { soyle(yedekMetin, true); }; const p = cA.play(); if (p && p.catch) p.catch(() => soyle(yedekMetin, true)); };
            if (!adA || adA._yok) return cumleCal();
            adA.onended = () => setTimeout(cumleCal, 60); adA.onerror = cumleCal;
            const p = adA.play(); if (p && p.catch) p.catch(cumleCal);
        };
    }
    window.anAdSlug = adSlug; window.AN_CUMLE = AN_CUMLE;
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
        filo: { okOzel: (v) => { const st = typeof h3Durum === 'function' ? h3Durum('filo') : null; return st && st.baskin && st.baskin.n > 0 && (kademe(v) === 'sari' || kademe(v) === 'kirmizi') ? 'KORSAN DENİZE!' : null; },
            simdi: () => { const st = typeof h3Durum === 'function' ? h3Durum('filo') : null; if (st && st.kayip === 'soyuldu') return 'Bu sefer <b class="kirmizi">korsanlar sandığı boşalttı.</b> Rövanş!'; if (st && st.baskin && st.baskin.n > 0) return 'ŞİMDİ: <b class="kirmizi">☠️ ' + st.baskin.n + ' KORSAN</b> sandığa yürüyor! <b>7 ve üstü</b> her ok birini denize atar.'; const sf = typeof h3Sefer === 'function' ? h3Sefer('filo') : null; return 'ŞİMDİ: Gemini <b>' + (sf ? sf.ad : 'adaya') + '</b> sür! ' + (sf ? '(' + (sf.adim + 1) + '/' + sf.toplam + ') ' : '') + '9-10 atan arkadan rüzgâr alır.'; },
            ok: { sari: 'ARKADAN RÜZGÂR!', kirmizi: 'TAM YELKEN', mavi: 'İLERİ', siyah: 'AZ İLERİ', beyaz: 'AZ İLERİ', iska: 'YELKEN BOŞ' },
            ozet: ['{ad} arkadan rüzgâr aldı, uçuyor!', '{ad} ilerliyor.', '{ad} yavaşladı, rüzgâr bekliyor.'] },
        catikosu: { okOzel: (v) => { const st = typeof n3Durum === 'function' ? n3Durum('catikosu') : null; return st && st.klan && st.klan.n > 0 && (kademe(v) === 'sari' || kademe(v) === 'kirmizi') ? 'KIZIL NİNJA DÜŞTÜ!' : null; },
            simdi: () => { const st = typeof n3Durum === 'function' ? n3Durum('catikosu') : null; if (st && st.kayip) return 'Bu sefer <b class="kirmizi">Kızıl Klan kazandı.</b> Rövanş!'; if (st && st.klan && st.klan.n > 0) return 'ŞİMDİ: <b class="kirmizi">🥷 ' + st.klan.n + ' KIZIL NİNJA</b> tapınağa tırmanıyor! <b>7 ve üstü</b> her ok birini düşürür.'; return 'ŞİMDİ: Ninjanı <b>kapıya</b> koştur! Çatı arasını atlamak için seride yarı puan gerek.'; },
            ok: { sari: 'UÇUŞ!', kirmizi: 'HIZLI KOŞU', mavi: 'KOŞU', siyah: 'YAVAŞ', beyaz: 'YAVAŞ', iska: 'TÖKEZLEDİ!' },
            ozet: ['{ad} çatıların üstünden uçuyor!', '{ad} koşuyor.', '{ad} yavaşladı, çatı arası tehlikeli!'] },
        ejderkule: { simdi: () => 'ŞİMDİ: Hep birlikte <b>muhafızı düşür</b>, kuleye tırman!',
            ok: { sari: 'KRİTİK SHURIKEN!', kirmizi: 'İSABET!', mavi: 'SIYIRDI', siyah: 'ZAYIF', beyaz: 'ZAYIF', iska: 'ISKA' },
            ozet: ['{ad} muhafızı sarstı!', '{ad} isabet ettirdi.', 'Muhafız gülüyor, daha sert vurun!'] },
        zombi: { simdi: () => 'ŞİMDİ: Zombilere karşı <b>dayan!</b> Kırmızı ve sarı ok panzehir taşır.',
            ok: { sari: 'PANZEHİR OKU!', kirmizi: 'PANZEHİR OKU!', mavi: 'İSABET', siyah: 'İSABET', beyaz: 'SIYIRDI', iska: 'ISKA!' },
            ozet: ['{ad} zombileri geri püskürttü!', '{ad} dayandı.', 'Dikkat! Zombiler yaklaşıyor!'] },
        tahta: { simdi: () => { let d = null; try { const st = JSON.parse(localStorage.getItem('dag_km_tahta_' + ((typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) || 'varsayilan')) || 'null'); d = st && st.dev; } catch (e) { } if (d && d.yikildi) return '<b>🗿💥 Dev Taş yıkıldı!</b> Herkes atınca kazanan takım belli olur.'; if (d) return 'ŞİMDİ: <b class="kirmizi">🗿 DEV TAŞ UYANDI</b> (' + d.can + ' can) — her takımın her adımı devi vurur, hep birlikte yıkın!'; return 'ŞİMDİ: Takımını <b>bitişe</b> taşı! İyi ok adım attırır. Bitişte <b>Dev Taş</b> bekliyor.'; },
            ok: { sari: 'SÜPER OK!', kirmizi: 'İSABET', mavi: 'İSABET', siyah: 'İSABET', beyaz: 'İSABET', iska: 'ISKA' },
            ozet: ['{ad} takımını ileri fırlattı!', '{ad} adım attırdı.', '{ad} bu sefer yerinde saydı.'] },
        timsah: { simdi: () => 'ŞİMDİ: Devi <b>uyandırmadan</b> taş yolu <b>karşıya</b> ulaştır! İyi ok taş koyar.',
            ok: { sari: '🐟🐟 İKİ BALIK!', kirmizi: '🐟🐟 İKİ BALIK!', mavi: '🐟 BALIK', siyah: '🐟 BALIK', beyaz: '🔊 GÜRÜLTÜ', iska: '🔊🔊 ÇOK GÜRÜLTÜ!' },
            ozet: ['{ad} kovayı balıkla doldurdu!', '{ad} balık topladı.', 'Şşşt! Çok gürültü, dev uyanıyor!'] },
        bomba: { simdi: () => 'ŞİMDİ: Fitili <b>uzat</b>! <b>✂️ Sarı · kırmızı · mavi</b>: renge atan o kabloyu keser, 3 kablo = bomba söner.',
            ok: { sari: '+6 SN!', kirmizi: '+6 SN!', mavi: '+2 SN', siyah: '+2 SN', beyaz: '−2 SN', iska: '−5 SN!' },
            ozet: ['{ad} fitili uzattı, bomba sakin!', '{ad} biraz zaman kazandı.', 'Fitil kısalıyor, acele edin!'] },
        blok: { simdi: () => 'ŞİMDİ: Hep birlikte <b>canavarı yık!</b>',
            ok: { sari: 'KRİTİK!', kirmizi: 'GÜÇLÜ VURUŞ', mavi: 'VURUŞ', siyah: 'SIYIRDI', beyaz: 'SIYIRDI', iska: 'ISKA' },
            ozet: ['{ad} canavara güçlü vurdu!', '{ad} isabet ettirdi.', 'Canavar kükrüyor, daha güçlü vurun!'] },
        canavar: { simdi: () => { const z = zayif(); return z ? 'ŞİMDİ: Zayıf nokta <b style="color:' + z.renk + '">' + z.ikon + ' ' + buyukTR(z.ad) + '</b> (' + z.okl + ') — o renge giren ok <b>2 KAT</b> vurur!' : 'ŞİMDİ: Hep birlikte <b>canavarı devir!</b>'; },
            okOzel: (v) => { const z = zayif(); return z && typeof KM_OYUN_PAD_RENK !== 'undefined' && KM_OYUN_PAD_RENK[String(v).toUpperCase()] === z.id ? 'ZAYIF NOKTA ×2!' : null; },
            ok: { sari: 'KRİTİK!', kirmizi: 'GÜÇLÜ VURUŞ', mavi: 'VURUŞ', siyah: 'SIYIRDI', beyaz: 'SIYIRDI', iska: 'ISKA' },
            ozet: ['{ad} canavarı sarstı!', '{ad} isabet ettirdi.', 'Canavar kükrüyor, daha güçlü vurun!'] },
        hapsirik: { simdi: () => 'ŞİMDİ: Yaratığı <b>gıdıkla</b>, hapşırt!',
            ok: { sari: 'SÜPER GIDIK!', kirmizi: 'GIDIK!', mavi: 'GIDIK', siyah: 'HAFİF GIDIK', beyaz: 'HAFİF GIDIK', iska: 'ISKA' },
            ozet: ['{ad} süper gıdıkladı!', '{ad} gıdıkladı.', 'Yaratık kıkırdamadı bile!'] }
    };
    // Ortak Canavar zayıf nokta rengi (app.js) — v434
    function zayif() { try { return typeof _kmCanavar !== 'undefined' && _kmCanavar && _kmCanavar.aktif && typeof kmCanavarZayifRenk === 'function' ? kmCanavarZayifRenk(_kmCanavar.aktif) : null; } catch (e) { return null; } }
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
    function soyle(metin, sp) { // sp=true: seri sonu spikeri (başka konuşma onu kesmez, v477)
        if (sessiz() || !metin) return;
        if (typeof kmOyunSesliSoyle === 'function') { kmOyunSesliSoyle(metin, !!sp); return; }
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
            // v437 (kullanıcı: "bunu isteğe göre kapatayım") — büyük anın köşesinde kalıcı kapatma; tam ekranda da ulaşılır
            '.an-perde .an-kapat{position:absolute;right:12px;top:12px;z-index:3;pointer-events:auto;font:800 14px Nunito,Inter,system-ui,sans-serif;padding:10px 14px;min-height:44px;border-radius:99px;border:1px solid rgba(255,255,255,.35);background:rgba(0,6,16,.7);color:#f4f8ff;cursor:pointer}',
            '.an-perde .an-kapat:hover{background:rgba(0,6,16,.9)}',
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
        const ik = s ? dolapIkon(s.g, s.ad) : '';
        p.innerHTML = '<div class="an-ic"><div class="an-ad">' + (ik ? '<span class="an-ik">' + ik + '</span> ' : '') + esc(buyukTR(ad)) + '</div><div class="an-okl">' + liste.map(() => '<span></span>').join('') + '</div><div class="an-etiket"></div><div class="an-alt"></div></div><button type="button" class="an-kapat" title="Seri sonrası büyük anı kapat (cihaz hatırlar; şeritteki 🎬 An ile geri açılır)">🎬 Bu ekranı kapat' + (typeof yeniRozet === 'function' ? ' ' + yeniRozet() : '') + '</button>';
        sahne.appendChild(p);
        requestAnimationFrame(() => p.classList.add('ac'));
        SES.ad();
        const zl = []; let bitirildi = false;
        const sonla = () => { if (bitirildi) return; bitirildi = true; zl.forEach(clearTimeout); _calisan = null; p.classList.remove('ac'); setTimeout(() => p.remove(), 250); bitti(); };
        _calisan = sonla;
        p.querySelector('.an-kapat').onclick = (ev) => { ev.stopPropagation(); try { localStorage.setItem('dag_km_an_kapali', '1'); } catch (e) { } sonla(); try { anTazele(tema); } catch (e) { } if (typeof showToast === 'function') showToast('🎬 Büyük an kapatıldı. Geri açmak için şeritteki 🎬 An düğmesi.', 'info'); };
        const adim = 640, bas = 420;
        const daireler = p.querySelectorAll('.an-okl span'), et = p.querySelector('.an-etiket'), alt = p.querySelector('.an-alt');
        // seri kademesi baştan bilinir → spiker sesi oklar düşerken önceden yüklenir
        let iyi = 0, orta = 0;
        liste.forEach((v) => { const k = kademe(v); if (IYI[k]) iyi++; else if (k === 'mavi') orta++; });
        const sk = iyi / Math.max(1, liste.length) >= 0.6 ? 0 : (iyi >= 1 || orta >= 2) ? 1 : 2;
        const cj = cumleSec(tema, sk), spikerCumle = cj >= 0 ? AN_CUMLE[tema][sk][cj] : '';
        const tamAd = tamAdTR(s && s.ad) || ad; // spiker ad soyad söyler (v476)
        const ekranCumle = spikerCumle ? (tamAd ? tamAd + '! ' : '') + spikerCumle : T.ozet[sk].replace('{ad}', ad);
        const spikerCal = cj >= 0 && sesVarMi(tema, sk, cj) ? spikerHazirla(tema, sk, cj, s && s.ad, ekranCumle) : null;
        liste.forEach((v, j) => zl.push(setTimeout(() => {
            const k = kademe(v);
            const d = daireler[j]; d.textContent = String(v).toUpperCase(); d.style.background = RENK[k]; d.style.borderColor = '#fff'; if (k === 'siyah') { d.style.background = '#1d222b'; d.style.color = '#fff'; } if (k === 'iska') { d.style.background = '#2b3a48'; d.style.color = '#fff'; } d.classList.add('on');
            const oz = T.okOzel ? T.okOzel(v) : null; et.textContent = oz || T.ok[k]; et.style.color = oz ? '#ffd23f' : k === 'siyah' || k === 'beyaz' ? '#e9eef5' : RENK[k]; et.classList.remove('pat'); void et.offsetWidth; et.classList.add('pat');
            try { SES[k](); } catch (e) { }
        }, bas + j * adim)));
        zl.push(setTimeout(() => {
            const ye = _yeniEsya; alt.textContent = ekranCumle + (ye ? '  ' + ye[1] + ' YENİ: ' + ye[2] + '!' : '');
            if (spikerCal) spikerCal(); else soyle(ekranCumle + (ye ? ' ' + ad + ' derse ' + ye[0] + '. kez geldi, ' + ye[2] + ' kazandı!' : ''), true);
        }, bas + liste.length * adim + 80));
        zl.push(setTimeout(sonla, bas + liste.length * adim + 1050));
    }

    /* ---------------------------------------------------------------- 📜 20 saniyede kural (v434, fikir 12) */
    // Kullanıcı (11 Kasım): "kuralları anlamadılar". Her oyun cihazda o gün ilk açılışta 3 resimli kart + anlatıcı; ŞİMDİ şeridinde 📜 ile tekrar.
    const KURAL = {
        topsavasi: { s: 'Her iyi ok korsan gemisine top atar. Gemiyi batırın, sıradaki korsan gelir. Zayıf seri korsana barut verir, dört turda bize çarpar!',
            k: [['🏹', 'Ok at', 'İyi ok gemiye top atar'], ['🚢', 'Gemiyi batır', '5 korsan gemisi sırayla gelir'], ['🧨', 'Dikkat!', 'Zayıf seri korsana barut verir']] },
        kacis: { s: 'Her ok yelkenleri doldurur. Zayıf seride korsan yaklaşır. Yakalanmadan adaya kaçın!',
            k: [['💨', 'Rüzgâr ol', 'Her ok yelkeni doldurur'], ['🏴‍☠️', 'Korsan peşimizde', 'Zayıf seride yaklaşır'], ['🏝️', 'Adaya kaç', '5 ada, her biri daha zor']] },
        filo: { s: 'Herkesin kendi gemisi var. Dokuz ve on atan arkadan rüzgâr alır. Adaya varan yıldız kazanır!',
            k: [['⛵', 'Senin gemin', 'Her çocuğun gemisi var'], ['💨', '9-10 = rüzgâr', 'Arkadan rüzgârla uçarsın'], ['⭐', 'Adaya var', 'Varan yıldız alır']] },
        catikosu: { s: 'Her ok ninjanı koşturur. Çatı arasını atlamak için yarı puan gerek. Kapıya varın!',
            k: [['🥷', 'Ninjanı koştur', 'Her ok ileri götürür'], ['🕳️', 'Çatı arası', 'Yarı puan yoksa tökezlersin'], ['🚪', 'Kapıya var', 'Bölüm bölüm ilerle']] },
        ejderkule: { s: 'Her ok muhafıza shuriken atar. Hep birlikte muhafızı düşürün, kuleye tırmanın!',
            k: [['⭐', 'Shuriken at', 'Her ok muhafıza vurur'], ['🛡️', 'Hep birlikte', 'Muhafızın canı ortak'], ['🐉', 'Kuleye tırman', 'Tepede ejder bekliyor']] },
        zombi: { s: 'Zayıf seri zombiye yem olur. Kırmızı ve sarı ok panzehirdir. İki arkadaş birlikte ısırılanı kurtarabilir!',
            k: [['🧟', 'Zombiler geliyor', 'Zayıf seri ısırılır'], ['💉', 'Kırmızı + sarı', 'Panzehir oku, zombiyi iter'], ['🤝', 'İkili kurtarma', 'İki arkadaş birlikte kurtarır']] },
        tahta: { s: 'İyi ok takımını ileri götürür. Sonunda dev taş bekliyor, onu bütün takımlar birlikte yıkar!',
            k: [['🎲', 'Takımın ilerler', 'İyi ok adım attırır'], ['🃏', 'Sürpriz kare', 'Bazı kareler kart açar'], ['🗿', 'Son karede dev', 'Hep birlikte yıkılır']] },
        timsah: { s: 'İyi ok kovaya balık atar ve nehre taş koyar. Kötü ok gürültü yapar, dev uyanır. Dev uyanmadan karşıya geçin!',
            k: [['🐟', 'Balık topla', 'İyi ok kovaya balık'], ['🪨', 'Taş yol', 'Her taş seni karşıya yaklaştırır'], ['😴', 'Şşşt!', 'Kötü ok devi uyandırır']] },
        bomba: { s: 'Fitil yanıyor. İyi ok süre kazandırır. İmha ekibi renge atar, o renkteki kablo kesilir. Bütün kablolar kesilince bomba söner!',
            k: [['🧨', 'Fitil yanıyor', 'İyi ok süre kazandırır'], ['✂️', 'İmha ekibi', 'Hangi renge atarsan o kablo kesilir'], ['✅', 'Bomba söner', 'Bütün kablolar kesilince']] },
        blok: { s: 'Hep birlikte canavara vurun. Sarı ok kritik vuruştur. Herkes atınca canavar yıkılır!',
            k: [['👹', 'Canavar', 'Canı hepimizin ortak düşmanı'], ['🏹', 'Herkes vurur', 'Sarı ok kritik vuruş'], ['🏆', 'Birlikte yıkarız', 'Herkes atınca biter']] },
        canavar: { s: 'Hep birlikte canavarı devirin. Canavarın göğsünde parlayan renge giren ok iki kat vurur!',
            k: [['👹', 'Canavar', 'Canı ortak'], ['🎯', 'Zayıf nokta', 'Parlayan renk iki kat vurur'], ['🏆', 'Birlikte devir', 'Herkes atınca biter']] },
        hapsirik: { s: 'Her ok yaratığı gıdıklar. Çubuk dolunca hapşırır ve masal kitabına yeni sayfa eklenir!',
            k: [['🪶', 'Gıdıkla', 'Her ok gıdıklar'], ['🤧', 'Hapşırık', 'Çubuk dolunca hapşırır'], ['📖', 'Sınıfın kitabı', 'Her ders bir sayfa']] }
    };
    const bugunAnahtar = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const testMi = () => { try { return !!navigator.webdriver && !window.__anTest; } catch (e) { return false; } };
    function kuralCss() {
        if ($('an-kural-css')) return;
        const st = document.createElement('style'); st.id = 'an-kural-css';
        st.textContent = [
            '.an-kural{position:fixed;inset:0;z-index:2147483000;display:flex;overflow:auto;background:rgba(3,8,18,.86);padding:16px;animation:anGir .25s ease-out}',
            '.an-kural-ic{margin:auto;width:min(1000px,100%);display:grid;gap:clamp(10px,2vh,22px);text-align:center;color:#fff}',
            '.an-kural-bas{font-family:"Bungee","Barlow Condensed",Impact,system-ui,sans-serif;font-size:clamp(22px,3.6vw,48px);line-height:1.05;text-shadow:0 4px 0 #000}',
            '.an-kartlar{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(8px,1.6vw,22px)}',
            '.an-kart{background:linear-gradient(180deg,#1b2a48,#111a2e);border:3px solid rgba(255,255,255,.14);border-radius:22px;padding:clamp(10px,2vw,24px) clamp(8px,1.4vw,18px);opacity:.25;transform:translateY(14px) scale(.94);transition:all .35s}',
            '.an-kart.on{opacity:1;transform:none;border-color:#ffd23f}',
            '.an-kart i{display:block;font-style:normal;font-size:clamp(40px,7vw,96px);line-height:1.1}',
            '.an-kart b{display:block;margin-top:6px;font-family:"Bungee","Barlow Condensed",Impact,system-ui,sans-serif;font-weight:400;font-size:clamp(15px,2.2vw,30px);color:#ffd23f;line-height:1.1}',
            '.an-kart span{display:block;margin-top:6px;font:800 clamp(12px,1.5vw,20px)/1.25 Nunito,Inter,system-ui,sans-serif;color:#dbe7f5}',
            '.an-kart em{display:inline-grid;place-items:center;width:1.6em;height:1.6em;border-radius:50%;background:#ffd23f;color:#1a1200;font:900 clamp(13px,1.4vw,18px) Nunito,system-ui,sans-serif;font-style:normal;margin-bottom:4px}',
            '.an-kural-alt{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}',
            '.an-kural-alt button{font:900 clamp(15px,1.6vw,20px) Nunito,Inter,system-ui,sans-serif;min-height:52px;padding:0 26px;border-radius:16px;border:0;cursor:pointer;background:#ffd23f;color:#1a1200}',
            '.an-kural-alt button.ikinci{background:rgba(255,255,255,.12);color:#fff}',
            '.an-sure{height:6px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden}.an-sure i{display:block;height:100%;background:#ffd23f;width:100%;transition:width linear}',
            '@media (max-width:600px){.an-kartlar{grid-template-columns:1fr}.an-kart{display:grid;grid-template-columns:auto 1fr;align-items:center;text-align:left;gap:4px 12px;padding:10px 14px}.an-kart i{grid-row:span 3;font-size:44px}.an-kart b,.an-kart span{margin:0}}',
            '.an-anlar .an-kartlar{grid-template-columns:repeat(5,minmax(0,1fr))}',
            '.an-anlar .an-kart i{font-size:clamp(30px,4.6vw,60px)}.an-anlar .an-kart b{font-size:clamp(13px,1.6vw,22px)}',
            '.an-anlar .an-kart{min-width:0}.an-anlar .an-kart .ad{overflow-wrap:anywhere;display:block;margin-top:8px;font-family:"Bungee","Barlow Condensed",Impact,system-ui,sans-serif;font-size:clamp(16px,2.4vw,34px);color:#fff;line-height:1}',
            '.an-dolap-acik{margin:0;font:800 clamp(12px,1.4vw,17px) Nunito,system-ui,sans-serif;color:#cfe0f5}',
            '.an-dolap-liste{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:8px;max-height:56vh;overflow:auto;text-align:left}',
            '.an-dolap-k{background:#16223b;border:2px solid rgba(255,255,255,.1);border-radius:14px;padding:8px 12px;display:grid;gap:2px}.an-dolap-k{min-width:0}.an-dolap-k b{font:900 16px Nunito,system-ui,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.an-dolap-k .es{font-size:24px;letter-spacing:2px}.an-dolap-k .es i{font-style:normal}.an-dolap-k .es .bos{opacity:.35}.an-dolap-k small{font:800 12px Nunito,system-ui,sans-serif;color:#9fb2c4}',
            '.an-ad .an-ik{font-size:.8em;vertical-align:.05em}',
            '@media (max-width:900px){.an-anlar .an-kartlar{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (max-width:600px){.an-anlar .an-kartlar{grid-template-columns:1fr}}'
        ].join('\n');
        document.head.appendChild(st);
    }
    const kok = () => document.fullscreenElement || document.getElementById('karisik-platform') || document.body; // sahnenin atalarında transform var: pencere sayfanın kökünde
    let _kuralZ = [];
    // v473: kullanıcı "seslendirme çok kötü, heceleyerek söylüyor, ses gerçek değil" → kural cümleleri sabit olduğu için
    // önceden kaydedildi: /ses/kural/<tema>.mp3. v474: kullanıcı "daha iyi spiker" → Gemini TTS "Fenrir" (scripts/kural-ses-gemini.mjs). Her cihazda aynı ses.
    // Dosya yüklenemezse (çevrimdışı vb.) eski tarayıcı sesine düşer. Yeniden üretmek: DEVIR.md §188.
    const KURAL_SES_V = 2;
    let _kuralSes = null;
    function kuralSesDur() { try { if (_kuralSes) { _kuralSes.pause(); _kuralSes = null; } } catch (e) { } }
    function kuralSoyle(tema, metin) {
        if (sessiz() || !metin) return;
        kuralSesDur(); try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
        let dustu = false; const yedek = () => { if (dustu) return; dustu = true; _kuralSes = null; soyle(metin); };
        try {
            const a = new Audio('/ses/kural/' + tema + '.mp3?v=' + KURAL_SES_V); _kuralSes = a;
            a.onerror = yedek; const p = a.play(); if (p && p.catch) p.catch(yedek);
        } catch (e) { yedek(); }
    }
    function kuralKapat() { _kuralZ.forEach(clearTimeout); _kuralZ = []; document.querySelectorAll('.an-kural').forEach((x) => x.remove()); kuralSesDur(); try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { } }
    function anKural(tema, zorla) {
        const K = KURAL[tema]; if (!K) return false;
        const sahne = document.querySelector('#km-oyun-wrap .km-oyun-scene'); if (!sahne) return false;
        const an = 'dag_km_kural_' + tema;
        if (!zorla) { if (testMi()) return false; try { if (localStorage.getItem(an) === bugunAnahtar()) return false; } catch (e) { } }
        try { localStorage.setItem(an, bugunAnahtar()); } catch (e) { }
        css(); kuralCss(); kuralKapat();
        const p = document.createElement('div'); p.className = 'an-kural'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Oyunun kuralı');
        p.innerHTML = '<div class="an-kural-ic"><div class="an-kural-bas">NASIL OYNANIR?</div><div class="an-kartlar">' + K.k.map((x, i) => '<div class="an-kart"><i>' + x[0] + '</i><b><em>' + (i + 1) + '</em><br>' + esc(x[1]) + '</b><span>' + esc(x[2]) + '</span></div>').join('') + '</div>'
            + '<div class="an-sure"><i></i></div><div class="an-kural-alt"><button type="button" class="an-k-basla">▶ Başlayalım</button><button type="button" class="ikinci an-k-tekrar">🔊 Tekrar dinle' + (typeof window.yeniRozet === 'function' ? ' ' + window.yeniRozet('2026-12-12') : '') + '</button></div></div>';
        kok().appendChild(p);
        const kartlar = p.querySelectorAll('.an-kart'), sure = 20000;
        kartlar.forEach((k, i) => _kuralZ.push(setTimeout(() => { k.classList.add('on'); SES.ad(); }, 300 + i * 1500)));
        _kuralZ.push(setTimeout(() => kuralSoyle(tema, K.s), 500));
        const bar = p.querySelector('.an-sure i'); requestAnimationFrame(() => { bar.style.transitionDuration = sure + 'ms'; bar.style.width = '0%'; });
        _kuralZ.push(setTimeout(kuralKapat, sure));
        p.querySelector('.an-k-basla').onclick = kuralKapat;
        p.querySelector('.an-k-tekrar').onclick = () => kuralSoyle(tema, K.s);
        return true;
    }

    /* ---------------------------------------------------------------- 🎬 Günün 5 anı (v434, fikir 11) */
    // Her seri (an kapalı olsa da) cihazda o günün listesine yazılır; "Günün anları" 5 ayrı çocuğu 5 farklı başarıyla gösterir.
    const ANLAR_A = () => 'dag_km_anlar_' + bugunAnahtar();
    const puanSay = (v) => { const p = String(v == null ? '' : v).toUpperCase(); return p === 'X' ? 10 : p === 'M' || p === '' ? 0 : (parseInt(p, 10) || 0); };
    function anKaydet(tema, s, liste) {
        if (!s || !s.ad || !liste || !liste.length) return;
        try { const a = ANLAR_A(), l = JSON.parse(localStorage.getItem(a) || '[]'); l.push({ t: tema, k: (s.g || '') + '|' + s.ad, ad: s.ad, o: liste.map((v) => String(v).toUpperCase()), z: Date.now() }); while (l.length > 400) l.shift(); localStorage.setItem(a, JSON.stringify(l));
            Object.keys(localStorage).forEach((x) => { if (x.indexOf('dag_km_anlar_') === 0 && x !== a) localStorage.removeItem(x); }); } catch (e) { }
    }
    const OYUN_AD = { topsavasi: 'Top Savaşı', kacis: 'Korsandan Kaçış', filo: 'Filo', catikosu: 'Çatı Koşusu', ejderkule: 'Ejder Kulesi', zombi: 'Zombi', tahta: 'Dev Tahta', timsah: 'Uyuyan Dev', bomba: 'Fitil Hattı', blok: 'Blok', canavar: 'Epik Arena', hapsirik: 'Hapşırık' };
    function anGununSec(l) {
        const kisi = {};
        (l || []).forEach((r) => { const x = kisi[r.k] = kisi[r.k] || { k: r.k, ad: r.ad, seriler: [], sari: 0, x: 0, temiz: 0 }; const top = r.o.reduce((a, v) => a + puanSay(v), 0); x.seriler.push({ top, o: r.o, t: r.t }); r.o.forEach((v) => { const k = kademe(v); if (k === 'sari') x.sari++; if (v === 'X') x.x++; }); if (r.o.every((v) => v !== 'M' && puanSay(v) > 0)) x.temiz++; });
        const L = Object.keys(kisi).map((k) => kisi[k]), kul = {}, sonuc = [];
        const sec = (ikon, baslik, puan, yazi, esik) => { let en = null, ep = -Infinity; L.forEach((x) => { if (kul[x.k]) return; const p = puan(x); if (p != null && p > ep && p >= (esik || 0)) { ep = p; en = x; } }); if (en) { kul[en.k] = 1; sonuc.push({ ikon, baslik, ad: en.ad, yazi: yazi(en) }); } };
        const enIyi = (x) => x.seriler.reduce((a, b) => (b.top > a.top ? b : a), x.seriler[0]);
        sec('💪', 'En güçlü seri', (x) => enIyi(x).top, (x) => { const b = enIyi(x); return b.o.join(' · ') + ' — ' + (OYUN_AD[b.t] || ''); }, 1);
        sec('🟡', 'Sarı ustası', (x) => x.sari, (x) => x.sari + ' sarı ok', 2);
        sec('📈', 'En büyük gelişme', (x) => (x.seriler.length >= 2 ? x.seriler[x.seriler.length - 1].top - x.seriler[0].top : null), (x) => x.seriler[0].top + ' → ' + x.seriler[x.seriler.length - 1].top, 1);
        sec('🎯', 'Hiç ıskalamadı', (x) => (x.temiz >= 2 && x.temiz === x.seriler.length ? x.temiz : null), (x) => x.temiz + ' seri, hepsi hedefte', 2);
        sec('❌', 'X avcısı', (x) => x.x, (x) => x.x + ' kez tam merkez', 1);
        // eksik kalırsa: en çok seri atan (emek) ve en yüksek ortalama
        sec('🔥', 'Durmadı', (x) => x.seriler.length, (x) => x.seriler.length + ' seri attı', 2);
        sec('⭐', 'İstikrar', (x) => x.seriler.reduce((a, b) => a + b.top, 0) / x.seriler.length, (x) => 'seri ortalaması ' + Math.round(x.seriler.reduce((a, b) => a + b.top, 0) / x.seriler.length), 1);
        // aynı ilk ada sahip iki çocuk: soyadın ilk harfi eklenir
        const ilkler = {}; L.forEach((x) => { const a = ilkAd(x.ad); ilkler[a] = (ilkler[a] || 0) + 1; });
        sonuc.forEach((x) => { const a = ilkAd(x.ad), p = String(x.ad).trim().split(/s+/); x.kisa = ilkler[a] > 1 && p.length > 1 ? a + ' ' + p[p.length - 1].charAt(0) + '.' : a; });
        return sonuc.slice(0, 5);
    }
    function anGununAnlari() {
        let l = []; try { l = JSON.parse(localStorage.getItem(ANLAR_A()) || '[]'); } catch (e) { }
        const sec = anGununSec(l);
        const sahne = document.querySelector('#km-oyun-wrap .km-oyun-scene');
        if (!sahne) return sec;
        css(); kuralCss(); kuralKapat();
        const p = document.createElement('div'); p.className = 'an-kural an-anlar'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Günün anları');
        p.innerHTML = '<div class="an-kural-ic"><div class="an-kural-bas">🎬 GÜNÜN ' + (sec.length || '') + ' ANI</div>'
            + (sec.length ? '<div class="an-kartlar">' + sec.map((x) => '<div class="an-kart"><i>' + x.ikon + '</i><b>' + esc(x.baslik) + '</b><span class="ad">' + esc(buyukTR(x.kisa || ilkAd(x.ad))) + '</span><span>' + esc(x.yazi) + '</span></div>').join('') + '</div>' : '<div class="an-kart on"><span>Bugün henüz seri atılmadı.</span></div>')
            + '<div class="an-kural-alt"><button type="button" class="an-k-basla">Kapat</button></div></div>';
        kok().appendChild(p);
        const kartlar = p.querySelectorAll('.an-kartlar .an-kart');
        kartlar.forEach((k, i) => _kuralZ.push(setTimeout(() => { k.classList.add('on'); try { SES.sari(); } catch (e) { } }, 400 + i * 1600)));
        if (sec.length) _kuralZ.push(setTimeout(() => soyle('Günün anları! ' + sec.map((x) => x.baslik + ': ' + ilkAd(x.ad)).join('. ') + '. Hepinizi alkışlıyoruz!'), 500));
        p.querySelector('.an-k-basla').onclick = kuralKapat;
        return sec;
    }

    /* ---------------------------------------------------------------- 👕 Karakter dolabı (v434, fikir 10) */
    // Puana değil KATILIMA göre: çocuğun oyunlarda seri attığı her gün sp.oyun.dolap.gun +1 (sporcu kaydında → sunucuya gider, her cihazda aynı).
    const DOLAP = [[3, '🧢', 'Şapka'], [6, '🦸', 'Pelerin'], [10, '🏹', 'Altın ok kılıfı'], [15, '🎖️', 'Madalya'], [20, '👑', 'Taç'], [30, '🐉', 'Ejder pelerini']];
    function sporcuKayit(g, ad) { try { return typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad] || null; } catch (e) { return null; } }
    function dolapGun(g, ad) { const sp = sporcuKayit(g, ad); return (sp && sp.oyun && sp.oyun.dolap && sp.oyun.dolap.gun) || 0; }
    function dolapEsyalar(gun) { return DOLAP.filter((x) => gun >= x[0]); }
    function dolapIkon(g, ad) { const e = dolapEsyalar(dolapGun(g, ad)); return e.length ? e[e.length - 1][1] : ''; }
    function dolapSay(g, ad) { // bugün ilk seri → +1 gün; yeni eşya açıldıysa döner
        const sp = sporcuKayit(g, ad); if (!sp) return null;
        const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.dolap = o.dolap || { gun: 0, son: '' };
        const t = bugunAnahtar(); if (o.dolap.son === t) return null;
        const once = dolapEsyalar(o.dolap.gun).length; o.dolap.gun++; o.dolap.son = t; sp.lastModified = Date.now();
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
        const sonra = dolapEsyalar(o.dolap.gun); return sonra.length > once ? sonra[sonra.length - 1] : null;
    }
    function dolapAc() {
        const sahne = document.querySelector('#km-oyun-wrap .km-oyun-scene'); if (!sahne) return;
        css(); kuralCss(); kuralKapat();
        const l = (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache || []).filter((x) => sporcuKayit(x.g, x.ad));
        const p = document.createElement('div'); p.className = 'an-kural an-dolap'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Karakter dolabı');
        p.innerHTML = '<div class="an-kural-ic"><div class="an-kural-bas">👕 KARAKTER DOLABI</div><p class="an-dolap-acik">Derse geldikçe açılır, puana bakmaz: ' + DOLAP.map((x) => x[1] + ' ' + x[0] + '. gün').join(' · ') + '</p><div class="an-dolap-liste">'
            + l.map((x) => { const gun = dolapGun(x.g, x.ad), e = dolapEsyalar(gun), sonraki = DOLAP.find((d) => gun < d[0]); return '<div class="an-dolap-k"><b>' + esc(ilkAd(x.ad)) + '</b><span class="es">' + (e.length ? e.map((d) => '<i title="' + esc(d[2]) + '">' + d[1] + '</i>').join('') : '<i class="bos">—</i>') + '</span><small>' + gun + ' gün' + (sonraki ? ' · ' + (sonraki[0] - gun) + ' gün sonra ' + sonraki[1] : ' · hepsi açık!') + '</small></div>'; }).join('')
            + '</div><div class="an-kural-alt"><button type="button" class="an-k-basla">Kapat</button></div></div>';
        kok().appendChild(p); p.querySelector('.an-k-basla').onclick = kuralKapat;
    }
    window.kmDolapIkon = dolapIkon;

    // ŞİMDİ şeridine 📜 Kural + 🎬 Günün anları düğmeleri; kural ilk açılışta kendiliğinden
    const _anTazeleEski = anTazele;
    anTazele = function (tema) {
        _anTazeleEski(tema);
        const el = $('an-simdi'); if (!el || !AN[tema]) return;
        let say = 0; try { const l = JSON.parse(localStorage.getItem(ANLAR_A()) || '[]'), k = {}; l.forEach((r) => { k[r.k] = 1; }); say = Object.keys(k).length; } catch (e) { }
        const d = $('an-dug');
        if (d && !$('an-kural-dug')) {
            const b = document.createElement('button'); b.type = 'button'; b.className = 'an-dug'; b.id = 'an-kural-dug'; b.textContent = '📜 Kural'; b.title = 'Kuralı 3 kartla göster ve sesli anlat'; b.onclick = () => anKural(tema, true); d.parentNode.insertBefore(b, d);
            { const db = document.createElement('button'); db.type = 'button'; db.className = 'an-dug'; db.id = 'an-dolap-dug'; db.textContent = '👕 Dolap'; db.title = 'Derse geldikçe açılan kıyafetler'; db.onclick = dolapAc; d.parentNode.insertBefore(db, d); }
            if (say >= 3) { const g = document.createElement('button'); g.type = 'button'; g.className = 'an-dug'; g.id = 'an-gun-dug'; g.textContent = '🎬 Günün anları'; g.title = 'Bugünün 5 anı: 5 farklı çocuk'; g.onclick = anGununAnlari; d.parentNode.insertBefore(g, d); }
        }
        if (!document.querySelector('.an-kural')) anKural(tema, false);
    };
    const _anSeriEski = anSeriGoster;
    let _yeniEsya = null;
    anSeriGoster = function (tema, s, oklar, devam) {
        try { anKaydet(tema, s, (oklar || []).map((k) => (k && typeof k === 'object' ? k.puan : k))); } catch (e) { }
        _yeniEsya = null; try { const y = s ? dolapSay(s.g, s.ad) : null; if (y) { _yeniEsya = y; if (kapali() && typeof showToast === 'function') showToast(y[1] + ' ' + ilkAd(s.ad) + ' derse ' + y[0] + '. kez geldi: ' + y[2] + ' kazandı!', 'success'); } } catch (e) { }
        return _anSeriEski(tema, s, oklar, devam);
    };

    window.anTazele = anTazele;
    window.anSeriGoster = anSeriGoster;
    // v476 (kullanıcı: "bütün oyunlarda ses geçerli olsun"): büyük an gösterilmeyen her durumda (diğer oyunlar, takım/çoklu mod,
    // "An: kapalı") yalnız spiker sesi: ad soyad + oyunun kendi cümlesi, oyunun cümlesi yoksa "genel" havuz. app.js kmOyunIlerlet çağırır.
    function anSpikerSoyle(tema, s, oklar) {
        if (sessiz() || !s) return false;
        const liste = (oklar || []).map((k) => (k && typeof k === 'object' ? k.puan : k)); if (!liste.length) return false;
        let iyi = 0, orta = 0; liste.forEach((v) => { const k = kademe(v); if (IYI[k]) iyi++; else if (k === 'mavi') orta++; });
        const sk = iyi / liste.length >= 0.6 ? 0 : (iyi >= 1 || orta >= 2) ? 1 : 2, t = AN_CUMLE[tema] ? tema : 'genel';
        const j = cumleSec(t, sk); if (j < 0) return false;
        const tamAd = tamAdTR(s.ad), metin = (tamAd ? tamAd + '! ' : '') + AN_CUMLE[t][sk][j];
        if (sesVarMi(t, sk, j)) { const cal = spikerHazirla(t, sk, j, s.ad, metin); setTimeout(cal, 350); } else soyle(metin, true);
        return true;
    }
    window.anSpikerSoyle = anSpikerSoyle;
    window.anSpikerMesgul = () => _spiker.some((a) => a && !a.paused && !a.ended);
    window.anKural = anKural;
    window.anGununAnlari = anGununAnlari;
    window.anKuralKapat = kuralKapat;
    window.AN_TEMALAR = Object.keys(AN);
    window._anIc = { DOLAP: DOLAP, dolapSay: dolapSay, dolapGun: dolapGun, dolapIkon: dolapIkon, kademe: kademe, AN: AN, KURAL: KURAL, anGununSec: anGununSec, anKaydet: anKaydet };
})();
