/* ================================================================================================
   🏰 KALE SAVUNMASI — Karışık Sınıf › Oyunlar teması 'kale' (2026-10-28).
   Kullanıcı üç taslak turundan sonra (heyecan / ödül / koleksiyon) "Kale Savunması"nı seçti: "yap ama domuz olmasın"
   (taslaktaki 🐗 yok). Düşmanlar emoji değil, burada çizilen sevimli SVG'ler (eski tablette emoji kare görünüyordu):
   goblin · yarasa · ork · taş golem · her 3. dalgada ejderha (boss).
   OYUN: Çocuklar kale burçlarında okçu. Düşmanlar sağdan yolda kaleye yürür. Her ok en öndeki düşmana gider: puan = hasar,
   9/10/X kritik ×1,5, X ateşli ok (arkadakine de +5). Her seriden sonra düşmanlar bir adım yaklaşır; kapıya varan kalenin bir
   canını alır (❤️×3). Dalga temizlenince kutlama (son düşüreni 👑) ve daha güçlü dalga gelir. Kale düşerse aynı dalga
   baştan (ceza yok — "hep birlikte tekrar!").
   Denge: dalganın toplam canı = sınıfın beklenen hasarı (her sporcu ~1 seri × Oyun Ayarları › Kale seviyesi); adım boyu
   sınıf kalabalığına göre ölçeklenir (öndeki düşman ~1,6 tur seride kapıya varır).
   KABUK: skor girişi Oyunlar'ın ortak dock'u (app.js). Bu dosya yalnız oyun durumunu ve çizimi yönetir:
     kaleSahneKur(panel) · kaleGuncelle() · kaleSeri(s, i, kaydedilecek, done) · kaleAnlik() · kaleGeriYukle(kopya) · kaleSporcuHasar(g, ad)
   DURUM 'dag_km_kale_<konum>' (km-ortak ile her cihaza gider), GÜNE ÖZEL:
     { tarih, dalga, can, dusmanlar[{id,tip,can,max,x,y}], sonId, adim, katki{'g|ad':hasar}, dusuren{'g|ad':adet}, temizlenen, dustu, seri }
   Rozet: sp.oyun.kale = { temizledi, ejderha }.
   v338 HEYECAN (kullanıcı: "çocuklar çok sevdi; biraz daha zor, korkutucu, kaybetme hissi — ayarlardan seviyeye göre açayım;
   goblinler, ejderhalar konuşsun: 'sarı atamazsan beni düşüremezsin'"): Oyun Ayarları › Kale heyecanı (kaleMod)
     1 🙂 Tatlı      — eski oyun: konuşma yok, kale düşerse aynı dalga baştan.
     2 ⚔️ Heyecanlı — düşmanlar konuşur (balon), 🛡️ Altın Zırhlı Goblin (yalnız 9-10-X işler), Kalkanlı Trol (7 ve üstü),
                      Yavru Ejderha (uçar, hızlı), kapıya bir adım kala tehlike uyarısı + kalp atışı, ejderha öfkesi (sarısız
                      4 seri → ateş, -1 can; sarı atılınca sakinleşir), kale yıkılır ve 1 dalga geri.
     3 😈 Korkutucu — gece sahnesi + kızıl gözler, daha kalabalık/hızlı dalga, 2 can, ejderha 3 seride ateşler, 2 dalga geri.
   Durumda ek alanlar: mod (dalga hangi seviyeyle kuruldu), boss düşmanda ofke.
   v342 HEP BİRLİKTE (kullanıcı: "en son atan sanki kaleyi kurtarmış hissi veriyorsun; aslında toplu yapıyorlar, bu hissiyatı
   vermek lazım"): son düşüreni öne çıkaran 👑 / "son düşüren" kalktı. Dalga temizlenince o dalgada vuran HERKES parlar,
   aralarına altın bir bağ çizilir, adları birlikte yazılır; 'temizledi' rozeti hepsine, 'ejderha' rozeti ejderhaya vuran
   herkese. Düşman başına d.vuran (anahtarlar), dalga başına st.dalgaKatki.
     ⚡/❄️/🎯 Özel oklar (serinin tamamı): 10-10-10 yıldırım (bütün düşmanlara −10) · üçü de sarı buz (düşmanlar 2 adım donar,
       st.donma) · üçü aynı 7/8 delici (bu seride zırh/kalkan işlemez).
     🛡️ Son anda: kapıya bir adım kalmış düşman düşerse "SON ANDA DURDURDUK" — o düşmana vuran herkes adıyla.
     🔨 Kale Atölyesi: dalga = 1 altın (ejderha dalgası 2). st.altin ile st.atolye {mancinik, hendek, kule} (en çok 3) alınır;
       Sur Onarımı +1 ❤️ (kalp sayısının 1 fazlasına kadar). Mancınık her seriden sonra en arkadakine 3×sv taş (kimsenin
       hanesine yazılmaz), hendek adımı %15×sv kısaltır, okçu kulesi isabet eden her oka +sv.
     📜 Kale Defteri: günün ortak özeti (dalga, düşman, ejderha, son anda kurtarış, ortak hasar, okçular) + WhatsApp.
   v359 GELİŞEN CANAVARLAR (kullanıcı: "bir noktaya kadar güzel, bir noktadan sonra sıkıyor; canavarlar değişerek gelsin, belki
   gelişsin — çocuklar yakından attığı için yüksek skor atıyorlar"):
     ✨ Evre: dalga 1-3 normal · 4-6 🪖 Savaşçı (miğfer + boynuz) · 7+ 👑 Kral (taç + parıltı, biraz büyük). Evre değişince
       "CANAVARLAR GELİŞTİ" kartı (önce → sonra çizimi, günde bir kez: st.evreGor). ⚔️+: Kalkanlı Trol 7+/8+/9+, Zırhlı 9+/9+/10.
     Yeni düşmanlar (her seviyede): 🟢 Balçık (dalga 5; düşünce iki minik balçığa bölünür) · 👻 Hayalet (dalga 6; bir seri
       görünür bir seri görünmez — görünmezken oklar içinden geçip arkadakine gider; hepsi görünmezse ok boşa). ⚔️+: 🧙 Goblin
       Şaman (dalga 8; arkada yavaş yürür, her 2 seride öndeki bir düşmanı bir evre geliştirir +%30 can — X/mancınık arkayı vurur).
     🐲 Ejderha yarı canına inince bir kez 2 yardımcı çağırır (⚔️+ yavru ejderha, 🙂 yarasa).
     Dalga sırası artık dalgaya bağlı karışık (her cihazda aynı), aynı desen tekrar etmez.
     ⚖️ Gerçek atışa göre denge: st.olcum {n seri, h ham hasar = puan × kritik}. 4 seriden sonra yeni dalganın canı, sınıfın
       bugün gerçekten attığı seri hasarı beklenenden yüksekse o oranda artar (en çok ×2,2, asla kolaylaşmaz) — yakın mesafe.
   v360 🎯 SAPANCI GOBLİN (kullanıcı: "onlar da bir şey fırlatsa"): dalga 3'ten (her seviyede). Her 2 seride kaleye bir şey
     fırlatır, şey havada asılı kalır (st.mermi {tur, kaynak, x, y}, aynı anda tek). Sonraki serinin ilk 8+ oku onu havada
     vurur (o ok düşmana gitmez; sınıfa 💰 +1, st.havada). Vurulamazsa çarpar: 🙂 domates (zararsız leke) · ⚔️ taş (st.catlak,
     3 çatlak = −1 ❤️; Sur Onarımı çatlakları da kapatır) · 😈 ateş topu (−1 ❤️). Çocuğa değil hep kaleye atar.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const NS = 'http://www.w3.org/2000/svg';
    const rnd = (a) => a[Math.floor(Math.random() * a.length)];
    function bugun() { return typeof bugunISO === 'function' ? bugunISO() : new Date().toISOString().slice(0, 10); }
    function konum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function kacis(t) { return typeof esc === 'function' ? esc(t) : String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function okDeger(v) { v = String(v); return v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0); }

    /* ---------------- SES (WebAudio sentezi; cihaza özel aç/kapa) ---------------- */
    let AC = null;
    function sesAcik() { try { return localStorage.getItem('dag_kale_ses') !== '0'; } catch (e) { return true; } }
    function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
    function ton(f1, f2, dur, tip, vol, gec) {
        const a = ac(); if (!a || !sesAcik()) return; const t = a.currentTime + (gec || 0), o = a.createOscillator(), g = a.createGain();
        o.type = tip || 'sine'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .15, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + dur);
        o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .05);
    }
    function hisirti(dur, f1, f2, vol, gec, q) {
        const a = ac(); if (!a || !sesAcik()) return; const t = a.currentTime + (gec || 0), n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        const s = a.createBufferSource(); s.buffer = buf; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q || 1;
        f.frequency.setValueAtTime(f1, t); f.frequency.exponentialRampToValueAtTime(f2 || f1, t + dur);
        const g = a.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .1, t + dur * .15); g.gain.exponentialRampToValueAtTime(.001, t + dur);
        s.connect(f).connect(g).connect(a.destination); s.start(t); s.stop(t + dur + .05);
    }
    const SES = {
        vin() { hisirti(.3, 3000, 900, .06, 0, 2); },
        buyu() { ton(420, 1500, .5, 'sine', .1); ton(640, 1900, .45, 'triangle', .07, .15); },
        vur(k) { ton(k ? 260 : 200, 90, .14, 'square', k ? .12 : .08); hisirti(.1, 1200, 600, .08, 0, 1); },
        iska() { ton(180, 120, .1, 'sine', .06); },
        dus() { ton(520, 140, .3, 'triangle', .1); hisirti(.3, 900, 300, .06, .05, .7); },
        adim() { for (let i = 0; i < 4; i++) ton(90, 70, .07, 'sine', .07, i * .14); },
        kapi() { ton(110, 40, .6, 'sawtooth', .16); hisirti(.5, 400, 100, .2, 0, .6); },
        tink() { ton(1900, 1500, .12, 'triangle', .1); ton(2600, 2200, .1, 'sine', .06, .03); },
        kalp() { ton(70, 50, .14, 'sine', .22); ton(70, 50, .14, 'sine', .18, .22); },
        gulus() { [330, 300, 270].forEach((f, i) => ton(f, f * .85, .12, 'square', .06, i * .16)); },
        ates() { hisirti(.9, 600, 150, .16, 0, .6); ton(120, 50, .8, 'sawtooth', .1); },
        fanfar() { [523, 659, 784, 1046].forEach((f, i) => ton(f, f, .3, 'triangle', .13, i * .13)); ton(1046, 1046, .6, 'triangle', .12, .55); },
        boru() { [392, 392, 523].forEach((f, i) => ton(f, f, .22, 'sawtooth', .07, i * .2)); },
        ejder() { ton(160, 60, 1.1, 'sawtooth', .12); hisirti(1, 800, 200, .1, 0, .5); }
    };

    /* ---------------- DÜŞMANLAR — (0,0) ayak hizası; sevimli (😈 Korkutucu'da gece + kızıl gözler) ---------------- */
    let _gece = false; // 😈 Korkutucu: sahne çizilirken ayarlanır, gözler ve ejderha rengi buna bakar
    function gozler(x1, x2, y, r, gz) { return [x1, x2].map((x) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${gz || (_gece ? '#ff6b5a' : '#fff')}"/><circle cx="${x + r * .2}" cy="${y + r * .15}" r="${r * .5}" fill="#1b1b24"/><circle cx="${x - r * .15}" cy="${y - r * .3}" r="${r * .18}" fill="#fff"/>`).join(''); }
    const D = {
        goblin: {
            ad: 'Goblin', agirlik: 1, olcek: 1, ucar: false, bas: [0, -48, 17],
            svg() {
                return `<ellipse cx="0" cy="-2" rx="16" ry="4" fill="#0004"/><rect x="-10" y="-14" width="7" height="14" rx="3" fill="#4f8f3e"/><rect x="3" y="-14" width="7" height="14" rx="3" fill="#4f8f3e"/>
                  <ellipse cx="0" cy="-26" rx="17" ry="16" fill="#8b5a33"/><ellipse cx="0" cy="-22" rx="11" ry="7" fill="#a8743f"/>
                  <path d="M-15 -50 L-34 -60 L-18 -40Z M15 -50 L34 -60 L18 -40Z" fill="#6fbf5a"/><circle cx="0" cy="-48" r="17" fill="#7fcf66"/>
                  ${gozler(-6, 7, -51, 5)}<path d="M-5 -40 q5 4 10 0" fill="none" stroke="#2d5a24" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M17 -30 l14 -22" stroke="#6b4a2a" stroke-width="6" stroke-linecap="round"/><circle cx="31" cy="-53" r="7" fill="#6b4a2a"/>`;
            }
        },
        yarasa: {
            ad: 'Yarasa', agirlik: .7, olcek: 1, ucar: true, bas: [0, -2, 14],
            svg() {
                return `<ellipse cx="0" cy="70" rx="12" ry="3" fill="#0003"/><g class="kale-kanat"><path d="M-8 -6 Q-30 -26 -44 -6 Q-34 -10 -30 0 Q-22 -8 -16 2Z M8 -6 Q30 -26 44 -6 Q34 -10 30 0 Q22 -8 16 2Z" fill="#6a4aa0"/></g>
                  <ellipse cx="0" cy="-2" rx="14" ry="13" fill="#8a66c4"/><path d="M-10 -12 l-3 -12 l9 7Z M10 -12 l3 -12 l-9 7Z" fill="#8a66c4"/>${gozler(-5, 5, -4, 4, '#fff6a8')}
                  <path d="M-3 5 l2 3 l2 -3 M2 5 l2 3 l2 -3" fill="#fff"/>`;
            }
        },
        ork: {
            ad: 'Ork', agirlik: 1.5, olcek: 1.25, ucar: false, bas: [0, -58, 18],
            svg() {
                return `<ellipse cx="0" cy="-2" rx="20" ry="5" fill="#0004"/><rect x="-13" y="-16" width="10" height="16" rx="4" fill="#5b6e34"/><rect x="3" y="-16" width="10" height="16" rx="4" fill="#5b6e34"/>
                  <rect x="-20" y="-46" width="40" height="34" rx="12" fill="#6f5a48"/><rect x="-20" y="-32" width="40" height="6" fill="#4a3b2e"/>
                  <circle cx="0" cy="-58" r="18" fill="#93b05a"/><path d="M-19 -62 a19 17 0 0 1 38 0Z" fill="#9aa2ad"/><path d="M-18 -66 l-10 -12 l14 4Z M18 -66 l10 -12 l-14 4Z" fill="#e8e0c8"/>
                  ${gozler(-6, 7, -56, 4.5)}<path d="M-8 -46 l3 -5 l3 5 M5 -46 l3 -5 l3 5" fill="#fff"/><path d="M-9 -46 h18" stroke="#3d4d22" stroke-width="2.5" stroke-linecap="round"/>
                  <rect x="-34" y="-46" width="16" height="22" rx="5" fill="#8a6a3a" stroke="#5a4426" stroke-width="2"/>`;
            }
        },
        golem: {
            ad: 'Taş Golem', agirlik: 2, olcek: 1.35, ucar: false, bas: [0, -66, 14],
            svg() {
                return `<ellipse cx="0" cy="-2" rx="24" ry="5" fill="#0004"/><rect x="-18" y="-18" width="14" height="18" rx="5" fill="#7a7f8c"/><rect x="4" y="-18" width="14" height="18" rx="5" fill="#7a7f8c"/>
                  <path d="M-24 -20 Q-28 -52 -8 -58 Q16 -62 24 -44 Q28 -24 20 -18Z" fill="#9aa0ad"/><circle cx="-34" cy="-32" r="10" fill="#8a909c"/><circle cx="34" cy="-34" r="11" fill="#8a909c"/>
                  <path d="M-10 -40 l6 6 l-4 8 M12 -30 l-4 -6" stroke="#6a6f7c" stroke-width="2" fill="none"/><rect x="-14" y="-78" width="28" height="24" rx="8" fill="#a8aebb"/>
                  <circle cx="-6" cy="-67" r="4" fill="#7ff6ff"/><circle cx="6" cy="-67" r="4" fill="#7ff6ff"/><path d="M-12 -40 q12 6 24 0" fill="none" stroke="#5f9e6a" stroke-width="5" opacity=".6"/>`;
            }
        },
        // ⚔️ Heyecanlı ve üstü: kurallı düşmanlar. min = bu puanın altındaki ok zırhta seker (hasar yok); tavan = can üst sınırı
        // (yalnız sarı işleyen düşman sınıfın tüm hasar payını almasın — ~2 sarı okla düşer).
        zirhli: {
            ad: 'Altın Zırhlı Goblin', agirlik: .8, olcek: 1.05, ucar: false, min: 9, minEvre: [9, 9, 10], tavan: 32, blokPop: 'TINN!', bas: [0, -48, 17],
            svg() {
                return `<ellipse cx="0" cy="-2" rx="16" ry="4" fill="#0004"/><rect x="-10" y="-14" width="7" height="14" rx="3" fill="#4f8f3e"/><rect x="3" y="-14" width="7" height="14" rx="3" fill="#4f8f3e"/>
                  <ellipse cx="0" cy="-26" rx="17" ry="16" fill="#e0a92e"/><path d="M-12 -34 h24 M-14 -26 h28 M-12 -18 h24" stroke="#b07d12" stroke-width="2"/><circle cx="0" cy="-26" r="4" fill="#fff3b0"/>
                  <path d="M-15 -50 L-34 -60 L-18 -40Z M15 -50 L34 -60 L18 -40Z" fill="#6fbf5a"/><circle cx="0" cy="-48" r="17" fill="#7fcf66"/>
                  <path d="M-18 -49 a18 18 0 0 1 36 0 v3 h-36Z" fill="#ffd23f" stroke="#b07d12" stroke-width="2"/><path d="M0 -66 v-9" stroke="#ff6b6b" stroke-width="5" stroke-linecap="round"/>
                  ${gozler(-6, 7, -41, 4.5)}<path d="M-5 -34 q5 3 10 0" fill="none" stroke="#2d5a24" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M17 -30 l12 -22" stroke="#b07d12" stroke-width="5" stroke-linecap="round"/><path d="M25 -56 l9 -9 l-1 13Z" fill="#e8eef5"/>`;
            }
        },
        kalkanci: {
            ad: 'Kalkanlı Trol', agirlik: 1.3, olcek: 1.2, ucar: false, min: 7, minEvre: [7, 8, 9], tavan: 48, blokPop: 'TAK! Kalkan!', bas: [0, -58, 17],
            svg() {
                return `<ellipse cx="0" cy="-2" rx="20" ry="5" fill="#0004"/><rect x="-13" y="-16" width="10" height="16" rx="4" fill="#4d7f8c"/><rect x="3" y="-16" width="10" height="16" rx="4" fill="#4d7f8c"/>
                  <rect x="-18" y="-46" width="36" height="32" rx="12" fill="#5e9aa8"/>
                  <circle cx="0" cy="-58" r="17" fill="#79b8c4"/><path d="M-10 -73 l-4 -9 l9 5Z M10 -73 l4 -9 l-9 5Z" fill="#e8e0c8"/>
                  ${gozler(-6, 6, -60, 4.5)}<path d="M-7 -49 q7 4 14 0" fill="none" stroke="#2f5a63" stroke-width="2.5" stroke-linecap="round"/><path d="M-5 -49 l2 4 l2 -4 M3 -49 l2 4 l2 -4" fill="#fff"/>
                  <circle cx="-24" cy="-32" r="20" fill="#9a6b3a" stroke="#6b4a26" stroke-width="3"/><circle cx="-24" cy="-32" r="12" fill="none" stroke="#c9ced9" stroke-width="3"/><circle cx="-24" cy="-32" r="4" fill="#c9ced9"/>`;
            }
        },
        yavruejder: {
            ad: 'Yavru Ejderha', agirlik: .6, olcek: .95, ucar: true, bas: [-14, -12, 10],
            svg() {
                return `<ellipse cx="0" cy="70" rx="12" ry="3" fill="#0003"/><g class="kale-kanat"><path d="M-4 -10 Q-26 -34 -38 -12 Q-28 -14 -24 -6Z M4 -10 Q26 -34 38 -12 Q28 -14 24 -6Z" fill="#ff9f43"/></g>
                  <path d="M10 4 Q26 10 30 -2" fill="none" stroke="#2fae6a" stroke-width="6" stroke-linecap="round"/>
                  <ellipse cx="0" cy="0" rx="15" ry="12" fill="#3cc47c"/><ellipse cx="-1" cy="3" rx="8" ry="7" fill="#f5d27a"/>
                  <ellipse cx="-14" cy="-12" rx="11" ry="9" fill="#3cc47c"/><path d="M-18 -20 l-2 -7 l5 4Z M-10 -20 l1 -7 l3 6Z" fill="#ffd23f"/>${gozler(-17, -9, -14, 3.2)}<circle cx="-24" cy="-10" r="1.4" fill="#1b1b24"/>`;
            }
        },
        // v359 yeni düşmanlar (dosya başı): balçık bölünür, hayalet bir seri görünmez, şaman diğerlerini geliştirir
        balcik: {
            ad: 'Balçık', agirlik: 1.2, olcek: 1.05, ucar: false, bas: [0, -24, 18],
            svg() {
                return `<ellipse cx="0" cy="-2" rx="22" ry="4" fill="#0004"/><path d="M-22 0 Q-25 -38 0 -42 Q25 -38 22 0 Q15 5 8 -1 Q0 5 -8 -1 Q-15 5 -22 0Z" fill="#5fd36a" stroke="#3ea84b" stroke-width="2"/>
                  <ellipse cx="-9" cy="-30" rx="6" ry="4" fill="#e3ffe0" opacity=".75"/><circle cx="9" cy="-10" r="3" fill="#3ea84b" opacity=".6"/><circle cx="-13" cy="-9" r="2.2" fill="#3ea84b" opacity=".6"/>
                  ${gozler(-7, 7, -22, 5)}<path d="M-5 -11 q5 4 10 0" fill="none" stroke="#24702e" stroke-width="2.5" stroke-linecap="round"/>`;
            }
        },
        minibalcik: {
            ad: 'Minik Balçık', agirlik: .35, olcek: .62, ucar: false, bas: [0, -24, 18],
            svg() { return D.balcik.svg(); }
        },
        hayalet: {
            ad: 'Hayalet', agirlik: .9, olcek: 1, ucar: true, hiz: 1, bas: [0, -10, 18],
            svg() {
                const gz = _gece ? '#ff6b5a' : '#2a2f45';
                return `<ellipse cx="0" cy="70" rx="12" ry="3" fill="#0003"/><path d="M-18 0 q-11 2 -13 -7 M18 0 q11 2 13 -7" stroke="#eef2ff" stroke-width="6" stroke-linecap="round" fill="none"/>
                  <path d="M-18 16 L-18 -8 A18 18 0 0 1 18 -8 L18 16 L12 10 L6 16 L0 10 L-6 16 L-12 10Z" fill="#eef2ff" stroke="#b9c3e6" stroke-width="2"/>
                  <ellipse cx="-6.5" cy="-8" rx="3.6" ry="5.2" fill="${gz}"/><ellipse cx="6.5" cy="-8" rx="3.6" ry="5.2" fill="${gz}"/><circle cx="-5.5" cy="-10" r="1.3" fill="#fff"/><circle cx="7.5" cy="-10" r="1.3" fill="#fff"/>
                  <ellipse cx="0" cy="4" rx="3.6" ry="4.6" fill="${gz}"/><ellipse cx="-12" cy="0" rx="3" ry="2" fill="#ffb3c6" opacity=".7"/><ellipse cx="12" cy="0" rx="3" ry="2" fill="#ffb3c6" opacity=".7"/>`;
            }
        },
        saman: {
            ad: 'Goblin Şaman', agirlik: .8, olcek: 1.05, ucar: false, hiz: .7, bas: [0, -50, 15],
            svg() {
                return `<ellipse cx="0" cy="-2" rx="18" ry="4" fill="#0004"/><path d="M-15 0 L-11 -34 L11 -34 L15 0Z" fill="#6a4aa0"/><path d="M-13 -16 h26" stroke="#ffd23f" stroke-width="2.5"/>
                  <path d="M-14 -50 L-31 -59 L-17 -42Z M14 -50 L31 -59 L17 -42Z" fill="#6fbf5a"/><circle cx="0" cy="-48" r="15" fill="#7fcf66"/>
                  <path d="M-17 -48 Q-17 -72 0 -80 Q17 -72 17 -48 Q8 -60 0 -60 Q-8 -60 -17 -48Z" fill="#7d55c0"/><circle cx="0" cy="-80" r="3.5" fill="#ffd23f"/>
                  ${gozler(-5, 6, -47, 4.2)}<path d="M-4 -38 q4 3 8 0" fill="none" stroke="#2d5a24" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M-24 4 L-24 -64" stroke="#6b4a2a" stroke-width="4" stroke-linecap="round"/><circle class="kale-kure" cx="-24" cy="-70" r="8" fill="#c77dff"/><circle cx="-26.5" cy="-72.5" r="2.6" fill="#fff"/>`;
            }
        },
        // v360 🎯 Sapancı Goblin: her 2 seride kaleye bir şey fırlatır; havada asılı kalır, sıradaki okçu 8+ atarsa havada vurulur
        sapanci: {
            ad: 'Sapancı Goblin', agirlik: .9, olcek: 1, ucar: false, bas: [0, -48, 16],
            svg() {
                return `<ellipse cx="0" cy="-2" rx="16" ry="4" fill="#0004"/><rect x="-10" y="-14" width="7" height="14" rx="3" fill="#4f8f3e"/><rect x="3" y="-14" width="7" height="14" rx="3" fill="#4f8f3e"/>
                  <ellipse cx="0" cy="-26" rx="16" ry="15" fill="#c0612b"/><path d="M-14 -30 h28" stroke="#ffd23f" stroke-width="3"/><circle cx="9" cy="-20" r="5" fill="#e8413c"/><circle cx="12" cy="-26" r="4" fill="#e8413c"/>
                  <path d="M-15 -50 L-33 -58 L-18 -41Z M15 -50 L33 -58 L18 -41Z" fill="#6fbf5a"/><circle cx="0" cy="-48" r="16" fill="#7fcf66"/>
                  <path d="M-16 -53 Q0 -67 16 -53 L16 -49 Q0 -58 -16 -49Z" fill="#e8413c"/><path d="M15 -52 l10 -3 l-3 8Z" fill="#e8413c"/>
                  ${gozler(-6, 7, -45, 4.5)}<path d="M-5 -36 q5 3 10 0" fill="none" stroke="#2d5a24" stroke-width="2.5" stroke-linecap="round"/>
                  <path d="M-18 -14 L-24 -34 M-24 -34 L-31 -48 M-24 -34 L-17 -48" stroke="#8b5a2b" stroke-width="4" stroke-linecap="round" fill="none"/>
                  <path d="M-31 -48 Q-24 -40 -17 -48" stroke="#f0d9a8" stroke-width="2" fill="none"/><circle cx="-24" cy="-43" r="3.5" fill="#9aa0ad"/>`;
            }
        },
        ejderha: {
            ad: 'Ejderha', agirlik: 5, olcek: 2.1, ucar: false, boss: true, bas: [-14, -64, 18],
            svg() {
                const s = this.govde(); if (!_gece) return s;
                // 😈 gece: kara-kızıl ejderha
                return s.replace(/#9b59b6/g, '#5a1f2e').replace(/#b45ad6/g, '#7a1f2e').replace(/#8e44ad/g, '#4a1622').replace(/#7d3c98/g, '#3d121b').replace(/#a96bc4/g, '#6e2a38').replace(/#f5d27a/g, '#e0864a');
            },
            govde() {
                return `<ellipse cx="0" cy="-2" rx="34" ry="6" fill="#0005"/><g class="kale-kanat"><path d="M-6 -48 Q-46 -96 -66 -64 Q-50 -66 -48 -54 Q-36 -62 -28 -50Z M6 -48 Q46 -96 66 -64 Q50 -66 48 -54 Q36 -62 28 -50Z" fill="#b45ad6" opacity=".9"/></g>
                  <path d="M20 -18 Q46 -10 52 -28 Q54 -36 46 -34" fill="none" stroke="#8e44ad" stroke-width="9" stroke-linecap="round"/><path d="M44 -38 l10 -4 l-4 10Z" fill="#ffd23f"/>
                  <rect x="-16" y="-14" width="11" height="14" rx="4" fill="#7d3c98"/><rect x="5" y="-14" width="11" height="14" rx="4" fill="#7d3c98"/>
                  <ellipse cx="0" cy="-30" rx="24" ry="22" fill="#9b59b6"/><ellipse cx="-2" cy="-26" rx="13" ry="13" fill="#f5d27a"/>
                  <ellipse cx="-14" cy="-62" rx="20" ry="17" fill="#9b59b6"/><ellipse cx="-28" cy="-56" rx="12" ry="9" fill="#a96bc4"/><circle cx="-33" cy="-58" r="2" fill="#4a1f5c"/>
                  <path d="M-20 -77 l-4 -12 l9 8Z M-6 -77 l2 -13 l6 10Z" fill="#ffd23f"/>${gozler(-16, -4, -66, 5)}<path d="M-34 -50 q8 4 14 0" fill="none" stroke="#4a1f5c" stroke-width="2.5" stroke-linecap="round"/>`;
            }
        }
    };

    /* ---------------- DURUM ---------------- */
    function anahtar() { return 'dag_km_kale_' + konum(); }
    let _st = null, _stKonum = null, _stHam = null;
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    function seviye() { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a.kaleSeri > 0) ? a.kaleSeri : 1; } catch (e) { return 1; } }
    // Dalganın toplam canı: her sporcunun beklenen seri hasarı (ok ortalaması — Canavar'la aynı ölçü; kaydı yoksa 6) × seviye,
    // her dalga %12 daha güçlü. Adım boyu: öndeki düşman ~1,6 × (sınıf × seviye) seride kapıya varır.
    // v359: yakından atınca gerçek seri hasarı beklenenin üstüne çıkar → bugünkü ölçüme göre güçlenir (asla kolaylaşmaz).
    function toplamCan(dalga, st) {
        let top = 0; const k = seviye();
        liste().forEach((s) => { let o = 6; try { if (typeof kmCanavarSporcuOrtalama === 'function') { const a = kmCanavarSporcuOrtalama(s.g, s.ad); if (a > 0) o = a; } } catch (e) { } top += 3 * o * 1.1; });
        const ol = st && st.olcum, n = Math.max(1, liste().length);
        if (ol && ol.n >= 4 && top > 0) { const fk = Math.min(2.2, (ol.h / ol.n) / (top / n)); if (fk > 1) top *= fk; }
        return Math.round(Math.max(40, top) * k * (1 + .12 * (dalga - 1)));
    }
    // Kale heyecanı (Oyun Ayarları › kaleMod): 1 Tatlı · 2 Heyecanlı · 3 Korkutucu — dosya başındaki açıklama
    function kmod() { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && [1, 2, 3].indexOf(a.kaleMod) >= 0) ? a.kaleMod : 1; } catch (e) { return 1; } }
    function kalpSayisi() { return kmod() === 3 ? 2 : 3; }
    const OFKE_SINIR = { 2: 4, 3: 3 };           // ejderha kaç sarısız seride ateş püskürtür
    const GERI_DALGA = { 1: 0, 2: 1, 3: 2 };     // kale düşünce kaç dalga geri
    // ilk göründüğü dalga (tanıtım kartı): [tip, en düşük kaleMod]
    const YENI_DUSMAN = { 2: [['zirhli', 2]], 3: [['kalkanci', 2], ['sapanci', 1]], 4: [['yavruejder', 2]], 5: [['balcik', 1]], 6: [['hayalet', 1]], 8: [['saman', 2]] };
    // v360 🎯 Fırlatılan şey seviyeye göre: 🙂 domates (zararsız, şlap!) · ⚔️ taş (3 çatlak = −1 ❤️) · 😈 ateş topu (−1 ❤️)
    const MERMI = { 1: { tur: 'domates', ad: 'DOMATES', ikon: '🍅' }, 2: { tur: 'tas', ad: 'TAŞ', ikon: '🪨' }, 3: { tur: 'ates', ad: 'ATEŞ TOPU', ikon: '🔥' } };
    const MERMI_ESIK = 8, CATLAK_SINIR = 3;
    function mermiSVG(tur) {
        if (tur === 'tas') return '<path d="M-15 4 Q-17 -10 -4 -15 Q12 -17 16 -2 Q15 12 0 14 Q-12 14 -15 4Z" fill="#8a8f9c" stroke="#4a4f5c" stroke-width="2.5"/><path d="M-6 -4 l5 3 M4 4 l4 -3" stroke="#5e6370" stroke-width="2" fill="none"/>';
        if (tur === 'ates') return '<circle r="21" fill="#ff5f1f" opacity=".45"/><circle r="14" fill="#ff9f43"/><circle r="7" fill="#ffd23f"/><path d="M-10 -12 q4 -12 10 -16 q-2 8 4 12" fill="#ff9f43"/>';
        return '<circle r="15" fill="#e8413c"/><circle cx="-5" cy="-5" r="4" fill="#ff9a8f" opacity=".85"/><path d="M0 -13 l-7 -6 M0 -13 l7 -6 M0 -13 v-8" stroke="#3fae4a" stroke-width="4" stroke-linecap="round"/>';
    }
    // Havada asılı: sallanır, çevresinde dönen hedef halkası, "8+ ile vur!"
    function mermiAsili(m) {
        return `<g transform="translate(${m.x} ${m.y})"><circle class="kale-mermi-halka" r="34" fill="none" stroke="#ffd23f" stroke-width="4" stroke-dasharray="10 8"/>
          <g class="kale-mermi-sal"><g transform="scale(1.45)">${mermiSVG(m.tur)}</g></g><text y="-46" text-anchor="middle" font-size="17" font-weight="900" fill="#ffd23f" stroke="#1b1230" stroke-width="4" paint-order="stroke">${MERMI_ESIK}+ ile vur!</text></g>`;
    }
    // Ön surdaki çatlaklar (⚔️ taş)
    function catlakSVG(n) {
        const C = ['M327 170 l-9 14 l7 10 l-8 16 l5 12', 'M300 224 l10 12 l-8 12 l9 14', 'M333 246 l-11 14 l8 12 l-6 14'];
        return C.slice(0, n).map((d) => `<path d="${d}" fill="none" stroke="#2a2030" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    }

    // v359 ✨ evre: 1 normal · 2 🪖 Savaşçı · 3 👑 Kral
    function evreDalga(dalga) { return dalga >= 7 ? 3 : dalga >= 4 ? 2 : 1; }
    const EVRE = [null, { ad: '', ikon: '' }, { ad: 'Savaşçı', ikon: '🪖' }, { ad: 'Kral', ikon: '👑' }];
    function dusmanAd(tip, evre) { const e = EVRE[evre || 1]; return (e && e.ad ? e.ad + ' ' : '') + D[tip].ad; }
    function hiz(tip) { return D[tip].hiz || (D[tip].ucar ? 1.3 : 1); }
    function minPuan(d) { const c = D[d.tip]; return c.min ? (c.minEvre ? c.minEvre[Math.min(3, d.evre || 1) - 1] : c.min) : 0; }
    // Evre aksesuarı: baş noktasına (D[tip].bas = [x, y, yarıçap]) miğfer + boynuz ya da taç
    function aksesuar(tip, evre) {
        const b = D[tip].bas; if (!b || !(evre >= 2)) return '';
        const [x, y, r] = b;
        if (evre === 2) {
            const a = y - r * .45, w = r * 1.04;
            return `<path d="M${x - w} ${a} A${w} ${r * .95} 0 0 1 ${x + w} ${a}Z" fill="#8f98a8" stroke="#4d5462" stroke-width="2"/><path d="M${x - w} ${a} H${x + w}" stroke="#4d5462" stroke-width="3.5" stroke-linecap="round"/>
              <path d="M${x - r * .7} ${a - r * .6} Q${x - r * 1.6} ${a - r * .9} ${x - r * 1.45} ${a - r * 1.9} Q${x - r * 1.05} ${a - r * 1.15} ${x - r * .35} ${a - r * .95}Z M${x + r * .7} ${a - r * .6} Q${x + r * 1.6} ${a - r * .9} ${x + r * 1.45} ${a - r * 1.9} Q${x + r * 1.05} ${a - r * 1.15} ${x + r * .35} ${a - r * .95}Z" fill="#f2ead2" stroke="#8a7f62" stroke-width="1.5"/>`;
        }
        const t = y - r * .78, w = r * .9;
        return `<path d="M${x - w} ${t} L${x - w} ${t - r * .8} L${x - w * .5} ${t - r * .38} L${x} ${t - r} L${x + w * .5} ${t - r * .38} L${x + w} ${t - r * .8} L${x + w} ${t}Z" fill="#ffd23f" stroke="#b07d12" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="${x}" cy="${t - r * .22}" r="${r * .15}" fill="#ff5f8a"/><circle cx="${x - w * .62}" cy="${t - r * .2}" r="${r * .1}" fill="#5fd3ff"/><circle cx="${x + w * .62}" cy="${t - r * .2}" r="${r * .1}" fill="#5fd3ff"/>`;
    }
    // Kart içi küçük çizim (tanıtım / evrim kartı)
    function miniSVG(tip, evre) {
        const c = D[tip], o = Math.min(1, 1.25 / c.olcek) * (evre === 3 ? 1.08 : 1), u = c.ucar;
        return `<svg class="kale-mini${evre === 3 ? ' kale-e3' : ''}" viewBox="-55 ${u ? -50 : -110} 110 ${u ? 85 : 115}" width="92" height="${u ? 72 : 96}"><g transform="scale(${o})"><g class="kale-govde${u ? ' kale-uc' : ' kale-yuru'}">${c.svg()}${aksesuar(tip, evre)}</g></g></svg>`;
    }
    const SOZ = {
        goblin: ['Hı hı! Beni vuramazsın!', 'Kapıyı açın, geldik!', 'Okların beni gıdıklıyor!'],
        yarasa: ['Vız vız! Yakala beni!', 'Yukarıdayım, görmedin bile!'],
        ork: ['Ork gücü! Kapı benim!', 'Bu ok mu? Kürdan sandım!'],
        sapanci: ['Sapanım hazır, nişan aldım!', 'Bir tane daha atayım mı?'],
        golem: ['Taşım... çok... sert...', 'Yavaşım ama hiç durmam!'],
        balcik: ['Blop blop! Vur beni, ikiye olurum!', 'Yapış yapış geliyorum!'], minibalcik: ['Blop!', 'Biz de geldik!'],
        hayalet: ['Hu huuu! Göremezsin beni!', 'Okların içimden geçer!'], saman: ['Güçlenin kardeşlerim!', 'Büyüm sizi geliştirir!'],
        zirhli: ['Sarı atamazsan beni düşüremezsin!', 'Zırhım altın, okun teneke!'],
        kalkanci: ['Kırmızı ya da sarı at, yoksa geçemezsin!', 'Kalkanım her oku durdurur!'],
        yavruejder: ['Annem de geliyor!', 'Pıf pıf, küçük ateş!'],
        ejderha: ['GROOAR! Kale benim olacak!', 'Sarı atmazsanız kaleyi yakarım!']
    };
    const TEHLIKE = ['Kapıya bir adım kaldı!', 'Kapı neredeyse bizim!', 'Toc toc! Geldik bile!'];
    const GULUS = ['Hahaha! Hiç değmedi!', 'Iska! Hı hı hı!', 'Bize ok yetişmez!'];
    // v342 Özel oklar — serinin tamamına bakar
    function ozelOk(oklar) {
        const v = (oklar || []).map((k) => okDeger(k.puan));
        if (v.length < 3) return null;
        if (v.every((d) => d === 10)) return 'yildirim';
        if (v.every((d) => d >= 9)) return 'buz';
        if (v[0] >= 7 && v.every((d) => d === v[0])) return 'delici';
        return null;
    }
    const OZEL = {
        yildirim: ['⚡ YILDIRIM OKU!', '10-10-10 — gökten yıldırım: bütün düşmanlara −10'],
        buz: ['❄️ BUZ OKU!', 'Üç ok da sarı — düşmanlar 2 adım donuyor'],
        delici: ['🎯 DELİCİ OK!', 'Üç ok aynı halkada — bu seride zırh ve kalkan işlemez']
    };
    // v342 Kale Atölyesi — dalga temizleyince kazanılan altınla sınıfça seçilir
    const ATOLYE = [
        { id: 'mancinik', ikon: '🪨', ad: 'Mancınık', acik: (n) => `Her seriden sonra en arkadaki düşmana taş: −${3 * n}` },
        { id: 'hendek', ikon: '🌊', ad: 'Hendek', acik: (n) => `Düşmanlar %${15 * n} yavaş yürür` },
        { id: 'kule', ikon: '🏹', ad: 'Okçu Kulesi', acik: (n) => `İsabet eden her ok +${n} hasar` },
        { id: 'sur', ikon: '🧱', ad: 'Sur Onarımı', acik: () => '+1 ❤️ — kale bir fazla canla savaşır' }
    ];
    const ATOLYE_UST = 3;
    function hizCarpan(st) { return 1 - .15 * ((st.atolye && st.atolye.hendek) || 0); }
    function adimHesapla() { return Math.max(18, Math.min(160, 600 / (Math.max(3, liste().length) * 1.6 * seviye()) * (kmod() === 3 ? 1.15 : 1))); }
    function dalgaTipleri(dalga) {
        const m = kmod(), havuz = ['goblin']; if (dalga >= 2) havuz.push('yarasa'); if (dalga >= 3) havuz.push('ork', 'sapanci'); if (dalga >= 4) havuz.push('golem');
        if (dalga >= 5) havuz.push('balcik'); if (dalga >= 6) havuz.push('hayalet');
        if (m >= 2) { if (dalga >= 2) havuz.push('zirhli'); if (dalga >= 3) havuz.push('kalkanci'); if (dalga >= 4) havuz.push('yavruejder'); }
        const n = Math.min(m === 3 ? 9 : 8, 3 + Math.floor(dalga / 2) + (m === 3 ? 1 : 0)), t = [];
        // v359 dalgaya bağlı karışık sıra (her cihazda aynı dalga) — ilk dalgalar iki goblinle başlar
        let tohum = dalga * 7919 + m * 131; const rs = () => (tohum = (tohum * 9301 + 49297) % 233280) / 233280;
        for (let i = 0; i < n; i++) t.push(dalga < 4 && i < 2 ? 'goblin' : havuz[Math.floor(rs() * havuz.length)]);
        (YENI_DUSMAN[dalga] || []).filter((y) => m >= y[1]).forEach((y, k) => { if (t.indexOf(y[0]) < 0) t[n - 1 - k] = y[0]; });
        // 🧙 şaman (⚔️+, dalga 8+): en arkada, dalgada bir tane
        if (m >= 2 && dalga >= 8) t.push('saman');
        if (dalga % 3 === 0) t.push('ejderha');
        return t;
    }
    function dusmanCan(t, top, ag) { return Math.max(6, Math.min(D[t].tavan || 1e9, Math.round(top * D[t].agirlik / ag))); }
    function yeniDalga(st, dalga) {
        st.dalga = dalga; st.adim = adimHesapla(); st.mod = kmod(); st.dalgaKatki = {}; st.donma = 0; st.mermi = null;
        const tipler = dalgaTipleri(dalga), top = toplamCan(dalga, st), ag = tipler.reduce((a, t) => a + D[t].agirlik, 0), ev = evreDalga(dalga);
        st.dusmanlar = tipler.map((t, i) => { const c = dusmanCan(t, top, ag), d = { id: ++st.sonId, tip: t, can: c, max: c, evre: ev, x: 800 + i * 52 + (D[t].boss ? 70 : 0), y: D[t].ucar ? 360 + (i % 2) * 24 : 486 + (i % 2) * 12 }; if (D[t].boss && OFKE_SINIR[st.mod]) d.ofke = 0; return d; });
    }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_stKonum !== konum() || ham !== _stHam || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _stKonum = konum(); _stHam = ham; }
        if (!_st || _st.tarih !== bugun() || !Array.isArray(_st.dusmanlar)) { _st = { tarih: bugun(), can: kalpSayisi(), sonId: 0, katki: {}, dusuren: {}, temizlenen: 0, dustu: 0, seri: 0 }; yeniDalga(_st, 1); kaydet(); }
        return _st;
    }
    function kaydet() { try { _stHam = JSON.stringify(_st); localStorage.setItem(anahtar(), _stHam); } catch (e) { } }
    function rozetYaz(g, ad, alan) {
        const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return;
        const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
        o.kale = o.kale || {}; o.kale[alan] = (o.kale[alan] || 0) + 1; sp.lastModified = Date.now();
    }
    // Rozet o işi BİRLİKTE yapan herkese ('g|ad' anahtarları)
    function rozetToplu(anahtarlar, alan) {
        (anahtarlar || []).forEach((k) => { const j = k.indexOf('|'); rozetYaz(k.slice(0, j), k.slice(j + 1), alan); });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }
    function sporcuIndex(k) { return liste().findIndex((s) => s.g + '|' + s.ad === k); }
    function isimler(anahtarlar, ust) {
        const ad = anahtarlar.map((k) => { const s = liste()[sporcuIndex(k)]; return s ? kacis(ilkAd(s.ad)) : null; }).filter(Boolean);
        ust = ust || 10; return ad.length > ust ? ad.slice(0, ust).join(' · ') + ` ve ${ad.length - ust} kişi daha` : ad.join(' · ');
    }

    /* ---------------- ÇİZİM ---------------- */
    let _zaman = [], _toren = false;
    function sonra(fn, ms) { const t = setTimeout(() => { _zaman = _zaman.filter((x) => x !== t); fn(); }, ms); _zaman.push(t); return t; }
    function zamanTemizle() { _zaman.forEach(clearTimeout); _zaman = []; }
    function panel() { return $('km-oyun-panel-kale'); }
    const KAPI_X = 360;
    // Çocuklar burçlarda: ön sur (y 210), arkasında daha yüksek iç sur (y 160), en arkada kule (y 110). 6'şarlı sıralar.
    function cocukXY(i) { const satir = Math.floor(i / 6), sutun = i % 6; return { x: 34 + sutun * 50 + (satir % 2) * 25, y: 205 - satir * 50 }; }
    function dusmanSVG(d) {
        const c = D[d.tip], oran = Math.max(0, d.can / d.max), ev = d.evre || 1, mn = minPuan(d);
        return `<g class="kale-dusman${ev === 3 ? ' kale-e3' : ''}${d.gorunmez ? ' kale-gorunmez' : ''}" id="kale-d${d.id}" data-tip="${d.tip}" data-evre="${ev}" style="transform:translate(${d.x}px,${d.y}px)"><g transform="scale(${c.olcek * (ev === 3 ? 1.12 : 1)})"><g class="kale-govde${c.ucar ? ' kale-uc' : ' kale-yuru'}">${c.svg()}${aksesuar(d.tip, ev)}</g></g>
          <g transform="translate(0 ${c.ucar ? -30 : -84 * c.olcek})"><rect x="-22" y="0" width="44" height="7" rx="3.5" fill="#0008"/><rect class="kale-can" x="-22" y="0" width="${44 * oran}" height="7" rx="3.5" fill="${oran > .5 ? '#7cf29a' : oran > .25 ? '#ffd23f' : '#ff6b6b'}"/>
          ${d.ofke != null ? `<g class="kale-ofke" transform="translate(0 -14)">${ofkeSVG(d.ofke)}</g>` : ''}${mn ? `<text y="-8" text-anchor="middle" font-size="13" font-weight="900" fill="${mn >= 9 ? '#ffd23f' : '#ff8f6b'}" stroke="#1b1230" stroke-width="3" paint-order="stroke">${mn}+</text>` : ''}</g></g>`;
    }
    // Ejderha öfkesi: sarısız her seride bir alev dolar; hepsi dolunca kaleye ateş
    function ofkeSVG(n) {
        const S = OFKE_SINIR[kmod()] || 4; let m = '';
        for (let k = 0; k < S; k++) m += `<circle cx="${(k - (S - 1) / 2) * 15}" cy="0" r="5.5" fill="${k < n ? '#ff5f1f' : '#0007'}" stroke="${k < n ? '#ffd23f' : '#ffffff55'}" stroke-width="1.5"/>`;
        return m;
    }
    function surHTML() {
        const dis = (y, renk, koyu) => { let m = ''; for (let x = -400; x < 335; x += 30) m += `<rect x="${x}" y="${y - 16}" width="18" height="18" fill="${renk}"/>`; return `<rect x="-400" y="${y}" width="735" height="${560 - y}" fill="${renk}"/>${m}<path d="M-400 ${y + 1} H335" stroke="${koyu}" stroke-width="3"/>`; };
        let tas = ''; for (let y = 240; y < 500; y += 26) for (let x = -400 + ((y / 26) % 2) * 22; x < 293; x += 44) tas += `<rect x="${x}" y="${y}" width="42" height="24" rx="3" fill="none" stroke="#00000018" stroke-width="2"/>`;
        return dis(110, '#5d6478', '#4a5063') + dis(160, '#6f7790', '#5a6178') + dis(210, '#858da6', '#6c7390') + tas
            + '<path d="M250 500 v-64 a36 36 0 0 1 72 0 v64Z" fill="#3a2a1e"/><path d="M256 500 v-60 M268 500 v-70 M280 500 v-72 M292 500 v-72 M304 500 v-70 M316 500 v-60" stroke="#24180f" stroke-width="3"/>'
            + '<rect x="-10" y="40" width="6" height="74" fill="#5a4030"/><path id="kale-bayrak" class="kale-bayrak" d="M-4 42 l46 14 l-46 14Z" fill="#ffd23f"/>';
    }
    function sahneHTML(st) {
        let cocuk = '';
        liste().map((s, i) => [s, i]).reverse().forEach(([s, i]) => {
            const p = cocukXY(i), renk = typeof kmOyunRenk === 'function' ? kmOyunRenk('kale', i) : '#ffd23f';
            const kar = typeof kmOyunHayvanKarakterSVG === 'function' ? kmOyunHayvanKarakterSVG(s, renk, 40) : `<circle cy="-18" r="16" fill="${renk}"/>`;
            cocuk += `<g class="kale-cocuk" id="kale-c${i}" data-km-sporcu="${i}"><g transform="translate(${p.x} ${p.y})"><g class="kale-ci">${kar}</g>
                <circle class="kale-halka" cx="0" cy="-20" r="25" fill="none" stroke="#ffd23f" stroke-width="3" opacity="0"/>
                <text class="kale-ad-yazi" y="15" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" stroke="#1b2233" stroke-width="3.5" stroke-linejoin="round" paint-order="stroke">${kacis(ilkAd(s.ad)).slice(0, 8)}</text></g></g>`;
        });
        const g = _gece; // 😈 Korkutucu: gece göğü, kızıl ay, koyu çimen
        return `<svg id="kale-svg" class="${g ? 'kale-gece' : ''}" viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid meet" style="overflow:visible">
          <defs><linearGradient id="kale-gok" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${g ? '#0d0818' : '#3b2d63'}"/><stop offset=".55" stop-color="${g ? '#2e0f24' : '#a0527a'}"/><stop offset="1" stop-color="${g ? '#6a1e22' : '#ffb06b'}"/></linearGradient></defs>
          <rect x="-400" y="-200" width="1800" height="960" fill="url(#kale-gok)"/>
          <circle cx="800" cy="210" r="70" fill="${g ? '#ff7a5c' : '#ffd9a0'}" opacity="${g ? '.6' : '.75'}"/>
          ${g ? '<g fill="#fff" opacity=".7"><circle cx="120" cy="60" r="1.6"/><circle cx="460" cy="40" r="1.4"/><circle cx="620" cy="110" r="1.8"/><circle cx="930" cy="70" r="1.5"/><circle cx="700" cy="30" r="1.2"/><circle cx="1100" cy="130" r="1.6"/></g>' : ''}
          <path d="M300 420 L470 260 L580 360 L700 240 L860 400 L1000 300 L1400 420Z" fill="${g ? '#24101e' : '#5a3f6e'}" opacity=".7"/>
          <path d="M-400 440 Q300 400 600 430 T1400 420 V760 H-400Z" fill="${g ? '#22381f' : '#4f7a44'}"/>
          <path d="M330 492 Q600 470 1400 486" fill="none" stroke="#b08a5a" stroke-width="46" stroke-linecap="round" opacity=".85"/>
          ${atolyeSahne(st, 'hendek')}
          <g id="kale-dusmanlar" class="${st.donma > 0 ? 'kale-donuk' : ''}">${st.dusmanlar.map(dusmanSVG).join('')}</g>
          <g id="kale-sur">${surHTML()}<g id="kale-catlak">${catlakSVG(st.catlak || 0)}</g>${atolyeSahne(st, 'mancinik')}</g>
          <g id="kale-cocuklar">${cocuk}</g>
          <g id="kale-mermi">${st.mermi ? mermiAsili(st.mermi) : ''}</g><g id="kale-bag"></g><g id="kale-ucan"></g><g id="kale-pop"></g>
        </svg>
        <div class="kale-hud"><div class="kale-hud-ust"><span class="kale-ad" id="kale-ad"></span><span class="kale-cip" id="kale-canlar"></span>
          <button class="kale-btn kale-btn-genis" id="kale-atolye-btn" title="Kale Atölyesi — altınla kaleyi güçlendirin">🔨</button><button class="kale-btn" id="kale-defter-btn" title="Bugünün Kale Defteri">📜</button>
          <button class="kale-btn" id="kale-ses-btn" title="Ses">🔊</button><button class="kale-btn" id="kale-nasil-btn" title="Nasıl oynanır?">❓</button><button class="kale-btn" id="kale-yeni-btn" title="Baştan başla">🔄</button></div>
          <div class="kale-bar"><i id="kale-bar-ic"></i><span id="kale-bar-yazi"></span></div><div class="kale-guc" id="kale-guc"></div></div>
        <div class="kale-vinyet" id="kale-vinyet"></div><div class="kale-dev" id="kale-dev"></div><div class="kale-atolye" id="kale-atolye"></div>`;
    }
    function kaleSahneKur(p) {
        p = p || panel(); if (!p) return; css();
        zamanTemizle(); _toren = false;
        const st = durum(); _gece = kmod() === 3;
        p.innerHTML = sahneHTML(st);
        $('kale-ses-btn').onclick = () => { try { localStorage.setItem('dag_kale_ses', sesAcik() ? '0' : '1'); } catch (e) { } hudCiz(); if (sesAcik()) SES.boru(); };
        $('kale-nasil-btn').onclick = nasil;
        $('kale-yeni-btn').onclick = yeniOyunSor;
        $('kale-atolye-btn').onclick = () => { const a = $('kale-atolye'); if (a && a.classList.contains('goster')) atolyeKapat(); else atolyeAc(); };
        $('kale-defter-btn').onclick = defter;
        _sonAi = -1; hudCiz(); kaleGuncelle();
    }
    // Atölyede alınanlar sahnede de görünür: kapının önünde hendek, kapının üstünde mancınık (sol sur skor paneliyle örtülür)
    function atolyeSahne(st, id) {
        const n = (st.atolye && st.atolye[id]) || 0; if (!n) return '';
        if (id === 'hendek') return `<g class="kale-hendek"><path d="M332 508 Q380 ${520 + n * 4} 470 508 Q420 ${500 - n * 2} 332 508Z" fill="#3fa7d6" opacity=".85"/><path d="M350 509 q10 -4 20 0 M392 511 q10 -4 20 0 M430 509 q10 -4 20 0" stroke="#bfe9ff" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
        let m = ''; for (let k = 0; k < n; k++) m += `<g transform="translate(${268 + k * 26} 404) scale(.75)"><rect x="-18" y="-6" width="36" height="10" rx="3" fill="#7a5233"/><circle cx="-11" cy="6" r="6" fill="#4a3020"/><circle cx="11" cy="6" r="6" fill="#4a3020"/>
            <path d="M-4 -6 L16 -30" stroke="#8b6240" stroke-width="5" stroke-linecap="round"/><circle cx="17" cy="-32" r="6" fill="#8a8f9c"/></g>`;
        return `<g class="kale-mancinik">${m}</g>`;
    }
    let _ekranHud = null; // tören sırasında HUD ekrandaki (eski) dalgayı gösterir
    function hudCiz() {
        if (!$('kale-ad')) return;
        const st = _ekranHud || durum(), kalan = st.dusmanlar.length, top = st.dusmanlar.reduce((a, d) => a + d.max, 0) || 1, can = st.dusmanlar.reduce((a, d) => a + Math.max(0, d.can), 0);
        const m = kmod();
        $('kale-ad').textContent = '🏰 Dalga ' + st.dalga + (EVRE[evreDalga(st.dalga)].ikon ? ' ' + EVRE[evreDalga(st.dalga)].ikon : '') + (dalgaTipleri(st.dalga).indexOf('ejderha') >= 0 ? ' · 🐲' : '') + (m === 3 ? ' · 😈' : m === 2 ? ' · ⚔️' : '');
        $('kale-canlar').textContent = kalpler(st.can);
        const y = Math.round((1 - can / top) * 100);
        $('kale-bar-ic').style.width = y + '%'; $('kale-bar-yazi').textContent = kalan ? `Kalan düşman ${kalan} · %${y}` : 'Dalga temiz!';
        $('kale-ses-btn').textContent = sesAcik() ? '🔊' : '🔇';
        const gs = durum(), altin = gs.altin || 0, at = gs.atolye || {};
        const ab = $('kale-atolye-btn'); if (ab) { ab.textContent = '🔨' + (altin ? ' 💰' + altin : ''); ab.classList.toggle('kale-btn-parla', altin > 0); }
        const gc = $('kale-guc'); if (gc) gc.innerHTML = ATOLYE.filter((a) => at[a.id]).map((a) => `<span title="${a.ad}">${a.ikon} ${at[a.id]}</span>`).join('') + (gs.donma > 0 ? '<span>❄️ donuk</span>' : '') + (gs.catlak ? `<span title="3 çatlakta sur yıkılır: -1 ❤️">🧱 çatlak ${gs.catlak}/${CATLAK_SINIR}</span>` : '');
    }
    function kalpler(can) { let s = ''; for (let i = 0; i < Math.max(kalpSayisi(), can); i++) s += i < can ? (i >= kalpSayisi() ? '🧡' : '❤️') : '🖤'; return s; }
    let _sonAi = -1;
    function kaleGuncelle() {
        const ai = typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0;
        document.querySelectorAll('#kale-cocuklar .kale-cocuk').forEach((g) => { const aktif = +g.id.slice(6) === ai, h = g.querySelector('.kale-halka'); if (h) h.setAttribute('opacity', aktif ? 1 : 0); g.classList.toggle('kale-aktif', aktif); });
        if (ai !== _sonAi && !_toren) { const c = $('kale-c' + ai), e = c && c.querySelector('.kale-ci'); if (e) { e.classList.remove('kale-sira-geldi'); void e.getBoundingClientRect(); e.classList.add('kale-sira-geldi'); } }
        _sonAi = ai;
        if (!_toren) hudCiz();
    }
    function svgEl(t, a, p) { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
    function pop(t, x, y, boy, renk) {
        const g = $('kale-pop'); if (!g) return;
        const e = svgEl('text', { x: x, y: y, 'text-anchor': 'middle', 'font-size': boy || 24, 'font-weight': 900, fill: renk || '#fff', stroke: '#1b1230', 'stroke-width': 4, 'paint-order': 'stroke', class: 'kale-pop' }, g);
        e.textContent = t; setTimeout(() => e.remove(), 1500);
    }
    function dev(html, ms) { const d = $('kale-dev'); if (!d) return; d.innerHTML = html; d.classList.add('goster'); if (ms) sonra(() => d.classList.remove('goster'), ms); }
    function anim(e, cls) { if (!e) return; e.classList.remove(cls); void e.getBoundingClientRect(); e.classList.add(cls); }
    function hedefNokta(d) { const c = D[d.tip]; return { x: d.x, y: d.y - (c.ucar ? 0 : 34 * c.olcek) }; }
    // Ok: çocuğun yerinden yay çizerek hedefe uçar; ucu gidiş yönüne döner (SVG birimleriyle, ölçek gerekmez)
    function okUcur(i, x, y, ates, cb) {
        const g = $('kale-ucan'); if (!g) { cb(); return; }
        const a = cocukXY(i); a.y -= 26;
        const o = svgEl('g', {}, g), ic = svgEl('g', {}, o);
        svgEl('path', { d: 'M-22 0 H14', stroke: ates ? '#ff9f43' : '#f4e2c0', 'stroke-width': 4, 'stroke-linecap': 'round' }, ic);
        svgEl('path', { d: 'M14 -6 L26 0 L14 6Z', fill: ates ? '#ff5f1f' : '#c9ced9' }, ic); svgEl('path', { d: 'M-22 0 l-8 -6 M-22 0 l-8 6', stroke: '#ff8fa8', 'stroke-width': 3 }, ic);
        if (ates) svgEl('circle', { cx: 22, cy: 0, r: 9, fill: '#ffb347', opacity: .6 }, ic);
        const tep = Math.min(a.y, y) - 90 - Math.abs(x - a.x) * .08, n = 14, kare = [];
        for (let k = 0; k <= n; k++) {
            const t = k / n, px = a.x + (x - a.x) * t, py = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * tep + t * t * y;
            const dx = (x - a.x), dy = 2 * (1 - t) * (tep - a.y) + 2 * t * (y - tep);
            kare.push({ transform: `translate(${px}px,${py}px) rotate(${Math.atan2(dy, dx) * 180 / Math.PI}deg)` });
        }
        const an = o.animate(kare, { duration: 560, easing: 'linear' });
        an.onfinish = () => { o.remove(); cb(); };
    }

    /* ---------------- SERİ İŞLEME ---------------- */
    // Önce DURUM hesaplanır ve kaydedilir (geri al / yenile / diğer cihaz tutarlı), sonra görsel oynar.
    function kaleSeri(s, i, kaydedilecek, done) {
        if (_toren) { zamanTemizle(); kaleSahneKur(); }
        atolyeKapat();
        const st = durum(), key = s.g + '|' + s.ad, olaylar = [], at = st.atolye || {};
        st.seri = (st.seri || 0) + 1; st.dalgaKatki = st.dalgaKatki || {};
        const ozel = ozelOk(kaydedilecek);
        if (ozel) { st.ozel = st.ozel || {}; st.ozel[ozel] = (st.ozel[ozel] || 0) + 1; }
        // kapıya bir adım kalmış olanlar — bu seride düşerse "son anda, hep birlikte durdurduk"
        const tehlikede = st.dusmanlar.filter((d) => d.x - KAPI_X <= st.adim * hizCarpan(st) * hiz(d.tip)).map((d) => d.id);
        st.olcum = st.olcum || { n: 0, h: 0 }; // ⚖️ gerçek atış (kule/özel ok hariç ham hasar)
        if ((kaydedilecek || []).length) { st.olcum.n++; (kaydedilecek || []).forEach((k) => { const d = okDeger(k.puan); st.olcum.h += d * (d >= 9 ? 1.5 : 1); }); }
        let temiz = null, dustu = false;
        const ejderDalga = dalgaTipleri(st.dalga).indexOf('ejderha') >= 0;
        // 👻 görünmez hayalet hedef olmaz — ok arkadakine gider
        const onDusman = (hepsi) => st.dusmanlar.filter((d) => hepsi || !d.gorunmez).sort((a, b) => a.x - b.x)[0];
        const vur = (d, h) => { d.can -= h; d.vuran = d.vuran || []; if (d.vuran.indexOf(key) < 0) d.vuran.push(key); st.katki[key] = (st.katki[key] || 0) + h; st.dalgaKatki[key] = (st.dalgaKatki[key] || 0) + h; };
        // ölenleri ayıkla; son düşman da gittiyse dalga HEP BİRLİKTE temizlenmiştir
        const ayikla = (o, kim) => {
            const olen = st.dusmanlar.filter((x) => x.can <= 0);
            olen.forEach((x) => {
                o.oldu.push(x.id); st.dusen = (st.dusen || 0) + 1;
                if (kim) st.dusuren[kim] = (st.dusuren[kim] || 0) + 1;
                if (x.tip === 'ejderha') { o.ejder = (x.vuran || []).slice(); st.ejderha = (st.ejderha || 0) + 1; rozetToplu(o.ejder, 'ejderha'); }
                if (tehlikede.indexOf(x.id) >= 0) { o.kurtar = { tip: x.tip, vuran: (x.vuran || []).slice() }; st.kurtarma = (st.kurtarma || 0) + 1; }
            });
            st.dusmanlar = st.dusmanlar.filter((x) => x.can > 0);
            const dogur = (tip, can, x, y, ev) => { const z = { id: ++st.sonId, tip: tip, can: can, max: can, evre: ev, x: x, y: y, vuran: [] }; st.dusmanlar.push(z); (o.yeni = o.yeni || []).push(z); };
            // 🟢 balçık düşünce ikiye bölünür
            olen.filter((x) => x.tip === 'balcik').forEach((x) => { const c = Math.max(4, Math.round(x.max * .3)); dogur('minibalcik', c, x.x, 486, x.evre); dogur('minibalcik', c, x.x + 36, 498, x.evre); o.bolundu = x.id; st.bolunen = (st.bolunen || 0) + 1; });
            // 🐲 ejderha yarı canına inince bir kez yardımcı çağırır
            st.dusmanlar.filter((x) => D[x.tip].boss && !x.cagirdi && x.can <= x.max / 2).forEach((x) => {
                x.cagirdi = true; const t = (st.mod || 1) >= 2 ? 'yavruejder' : 'yarasa', c = Math.max(5, Math.round(x.max * .12));
                dogur(t, c, x.x + 50, 360, x.evre); dogur(t, c, x.x + 100, 384, x.evre); o.cagri = x.id;
            });
            o.durum = st.dusmanlar.map((x) => ({ id: x.id, can: x.can, max: x.max }));
            if (!st.dusmanlar.length && !temiz) {
                const okcular = liste().map((x) => x.g + '|' + x.ad).filter((k) => st.dalgaKatki[k] > 0), altin = ejderDalga ? 2 : 1;
                temiz = { dalga: st.dalga, okcular: okcular, altin: altin, ejder: ejderDalga };
                st.temizlenen = (st.temizlenen || 0) + 1; st.altin = (st.altin || 0) + altin; rozetToplu(okcular, 'temizledi');
                _ekranHud = { dalga: st.dalga, can: st.can, dusmanlar: [] };
                yeniDalga(st, st.dalga + 1);
            }
        };
        (kaydedilecek || []).forEach((k) => {
            const v = String(k.puan), d = okDeger(v);
            if (temiz) return;
            // 🎯 havadaki şey: sıradaki okçunun ilk 8+ oku onu havada vurur (sınıfa 💰 +1)
            if (st.mermi && d >= MERMI_ESIK) { olaylar.push({ tur: 'mermi', m: st.mermi }); st.mermi = null; st.havada = (st.havada || 0) + 1; st.altin = (st.altin || 0) + 1; return; }
            if (!st.dusmanlar.length) return;
            const on = onDusman();
            if (!on) { if (d) olaylar.push({ tur: 'gecti', id: onDusman(true).id }); else olaylar.push({ tur: 'iska', id: onDusman(true).id }); return; } // 👻 hepsi görünmez
            if (!d) { olaylar.push({ tur: 'iska', id: on.id }); return; }
            const mn = minPuan(on);
            if (ozel !== 'delici' && mn && d < mn) { olaylar.push({ tur: 'blok', id: on.id, min: mn }); return; } // ⚔️ zırh/kalkan: ok seker
            const kritik = d >= 9, hasar = Math.round(d * (kritik ? 1.5 : 1)) + (at.kule || 0);
            vur(on, hasar);
            const o = { tur: 'ok', id: on.id, hasar: hasar, kritik: kritik, ates: v === 'X', oldu: [] };
            if (o.ates) { const arka = st.dusmanlar.filter((x) => x !== on && !x.gorunmez).sort((a, b) => a.x - b.x)[0]; if (arka) { vur(arka, 5); o.arka = arka.id; } }
            ayikla(o, key); olaylar.push(o);
        });
        // ⚡ yıldırım: serinin üç oku da 10 → bütün düşmanlara −10
        if (ozel === 'yildirim' && !temiz && st.dusmanlar.length) {
            const o = { tur: 'yildirim', ids: st.dusmanlar.map((x) => x.id), oldu: [] };
            st.dusmanlar.forEach((x) => vur(x, 10)); ayikla(o, key); olaylar.push(o);
        }
        // 🪨 mancınık (sınıfın — kimsenin hanesine yazılmaz): en arkadaki düşmana taş
        if (at.mancinik && !temiz && st.dusmanlar.length) {
            const arka = st.dusmanlar.slice().sort((a, b) => b.x - a.x)[0], h = 3 * at.mancinik;
            arka.can -= h; const o = { tur: 'tas', id: arka.id, hasar: h, oldu: [] }; ayikla(o, null); olaylar.push(o);
        }
        // dalga sürüyorsa düşmanlar bir adım yaklaşır; kapıya varan kalenin canını alır
        let adim = null, ates = null;
        if (!temiz) {
            // 🎯 havada vurulamayan şey kaleye çarpar
            if (st.mermi) {
                const mm = st.mermi, c = { tur: 'carpti', m: mm }; st.mermi = null;
                if (mm.tur === 'tas') { st.catlak = (st.catlak || 0) + 1; if (st.catlak >= CATLAK_SINIR) { st.catlak = 0; st.can -= 1; c.can = true; } c.catlak = st.catlak; }
                else if (mm.tur === 'ates') { st.can -= 1; c.can = true; }
                olaylar.push(c);
            }

            // ⚔️/😈 ejderha öfkesi: bu seride sarı (9-10-X) yoksa bir alev dolar, sarı gelince söner; dolunca kaleye ateş (-1 can)
            const sinir = OFKE_SINIR[st.mod || 1], ej = sinir ? st.dusmanlar.find((d) => d.ofke != null) : null;
            if (ej) {
                const sari = (kaydedilecek || []).some((k) => okDeger(k.puan) >= 9);
                ej.ofke = sari ? 0 : ej.ofke + 1;
                if (ej.ofke >= sinir) { ej.ofke = 0; st.can -= 1; ates = { id: ej.id }; }
            }
            const varan = [], hz = hizCarpan(st);
            // ❄️ buz oku: bu adım ve sonraki adım donar
            if (ozel === 'buz') st.donma = 2;
            const donuk = st.donma > 0; if (donuk) st.donma--;
            if (!donuk) st.dusmanlar.forEach((d) => { d.x = Math.max(KAPI_X, d.x - st.adim * hz * hiz(d.tip)); if (d.x <= KAPI_X) varan.push(d.id); });
            st.dusmanlar = st.dusmanlar.filter((d) => varan.indexOf(d.id) < 0);
            st.can -= varan.length;
            // 👻 hayalet her seri görünür ↔ görünmez · 🧙 şaman her 2 seride öndeki bir düşmanı geliştirir
            const hay = []; st.dusmanlar.forEach((d) => { if (d.tip === 'hayalet') { d.gorunmez = !d.gorunmez; hay.push({ id: d.id, g: d.gorunmez }); } });
            let gelisti = null; const sm = st.dusmanlar.find((d) => d.tip === 'saman');
            if (sm && st.seri % 2 === 0) {
                const h = st.dusmanlar.filter((d) => d.tip !== 'saman' && !D[d.tip].boss && (d.evre || 1) < 3).sort((a, b) => a.x - b.x)[0];
                if (h) { const ek = Math.round(h.max * .3); h.evre = (h.evre || 1) + 1; h.max += ek; h.can += ek; st.gelisen = (st.gelisen || 0) + 1; gelisti = { kaynak: sm.id, d: JSON.parse(JSON.stringify(h)) }; }
            }
            // 🎯 sapancı her 2 seride fırlatır (havada aynı anda tek şey; donukken atamaz)
            let firlat = null;
            if (!donuk) st.dusmanlar.forEach((d) => { if (d.tip === 'sapanci') d.sayac = (d.sayac || 0) + 1; });
            const sp = st.mermi || donuk ? null : st.dusmanlar.filter((d) => d.tip === 'sapanci' && d.sayac >= 2 && d.x < 1000).sort((a, b) => a.x - b.x)[0];
            if (sp) { sp.sayac = 0; st.mermi = { tur: MERMI[st.mod || 1].tur, kaynak: sp.id, x: Math.round(Math.max(470, Math.min(680, sp.x - 140))), y: 250 }; firlat = Object.assign({}, st.mermi); st.atilan = (st.atilan || 0) + 1; }
            adim = { firlat: firlat, hayalet: hay, gelisti: gelisti, konum: st.dusmanlar.map((d) => ({ id: d.id, x: d.x, y: d.y })), varan: varan, ofke: ej && st.dusmanlar.indexOf(ej) >= 0 ? { id: ej.id, n: ej.ofke, sinir: sinir } : null, donuk: donuk, buzKalan: st.donma };
            // kapıya bir adım kalan var mı (⚔️ tehlike uyarısı) — sonraki adım donuksa tehlike yok
            const onT = onDusman(true);
            if (onT && !st.donma && onT.x - KAPI_X <= st.adim * hz * hiz(onT.tip)) adim.tehlike = onT.id;
            adim.hasarli = olaylar.some((o) => o.tur === 'ok');
            if (st.can <= 0) {
                const yd = Math.max(1, st.dalga - (GERI_DALGA[kmod()] || 0));
                dustu = { dalga: st.dalga, yeni: yd }; st.dustu = (st.dustu || 0) + 1; st.can = kalpSayisi(); _ekranHud = { dalga: st.dalga, can: 0, dusmanlar: [] }; yeniDalga(st, yd);
            }
        }
        kaydet();
        if (!panel() || !$('kale-svg')) { _ekranHud = null; try { done(); } catch (e) { } return; }
        let n = 0; const hepsi = olaylar.length;
        const bitti = () => {
            if (temiz || dustu) _toren = true;
            const gec = ates ? 1000 : 0;
            if (ates) atesGoster(ates, !!dustu);
            if (adim) sonra(() => adimGoster(adim, !!dustu), gec);
            sonra(() => { try { done(); } catch (e) { } if (temiz) temizGoster(temiz); else if (dustu) dustuGoster(dustu); }, (adim ? 700 : 100) + gec);
        };
        if (!hepsi) { bitti(); return; }
        if (ozel) { SES.boru(); dev(`${OZEL[ozel][0]}<small>${kacis(ilkAd(s.ad))}: ${OZEL[ozel][1]}</small>`, 1700); }
        const tek = () => { n++; if (n === hepsi) setTimeout(bitti, 350); };
        olaylar.forEach((o, k) => {
            setTimeout(() => {
                if (o.tur === 'yildirim') { yildirimGoster(o); setTimeout(tek, 700); return; }
                if (o.tur === 'tas') { tasUcur(o, tek); return; }
                if (o.tur === 'carpti') { mermiCarp(o, tek); return; }
                if (o.tur === 'mermi') { SES.vin(); okUcur(i, o.m.x, o.m.y, false, () => { mermiPatla(o); tek(); }); return; }
                // hedefin EKRANDAKİ yeri (durum çoktan adım atmış / düşman ölmüş olabilir)
                const e = $('kale-d' + o.id), m = e ? /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(e.style.transform) : null;
                const h = hedefNokta({ x: m ? +m[1] : 700, y: m ? +m[2] : 486, tip: (e && e.dataset.tip) || 'goblin' });
                SES.vin();
                const tx = o.tur === 'iska' ? h.x - 40 - Math.random() * 60 : h.x, ty = o.tur === 'iska' ? 500 : h.y;
                okUcur(i, tx, ty, o.ates, () => { okTepki(o, h, tx, ty); tek(); });
            }, k * 420);
        });
    }
    function okTepki(o, h, x, y) {
        if (o.tur === 'blok') { // zırh/kalkan: ok seker, düşman kuralını söyler
            SES.tink(); const e = $('kale-d' + o.id), c = D[(e && e.dataset.tip) || 'zirhli'] || D.zirhli;
            if (e) anim(e.querySelector('.kale-govde'), 'kale-sek');
            pop(`${c.blokPop || 'TINN!'} ${o.min || c.min}+ lazım!`, h.x, h.y - 40, 24, '#c9ced9');
            const g = $('kale-ucan'); if (g) { const t = svgEl('path', { d: `M${x - 10} ${y - 4} l-26 -22`, stroke: '#f4e2c0', 'stroke-width': 4, 'stroke-linecap': 'round', class: 'kale-sekok' }, g); setTimeout(() => t.remove(), 900); }
            konus(o.id, rnd(SOZ[e && e.dataset.tip] || SOZ.zirhli));
            return;
        }
        if (o.tur === 'gecti') { SES.iska(); pop('👻 içinden geçti!', x, y - 20, 22, '#e8ecff'); konus(o.id, rnd(SOZ.hayalet)); return; }
        if (o.tur === 'iska') { SES.iska(); pop('ıska', x, y - 20, 20, '#e0d6f0'); const g = $('kale-ucan'); if (g) { const t = svgEl('path', { d: `M${x - 14} ${y} l24 -10`, stroke: '#f4e2c0', 'stroke-width': 4, 'stroke-linecap': 'round' }, g); setTimeout(() => t.remove(), 1500); } return; }
        SES.vur(o.kritik);
        const e = $('kale-d' + o.id); if (e) anim(e.querySelector('.kale-govde'), 'kale-vurul');
        pop((o.kritik ? '💥 ' : '') + '-' + o.hasar, h.x, h.y - 40, o.kritik ? 30 : 24, o.kritik ? '#ffd23f' : '#fff');
        if (o.ates) { pop('🔥 ATEŞLİ OK!', h.x, h.y - 80, 22, '#ff9f43'); if (o.arka) { const a = $('kale-d' + o.arka); if (a) anim(a.querySelector('.kale-govde'), 'kale-vurul'); } }
        sonucGoster(o);
    }
    // can çubukları + düşenler + birlikte anları (ok, yıldırım ve taş için ortak)
    function sonucGoster(o) {
        (o.durum || []).forEach((d) => { const b = document.querySelector('#kale-d' + d.id + ' .kale-can'); if (b) { const r = Math.max(0, d.can / d.max); b.setAttribute('width', 44 * r); b.setAttribute('fill', r > .5 ? '#7cf29a' : r > .25 ? '#ffd23f' : '#ff6b6b'); } });
        o.oldu.forEach((id) => { const d = $('kale-d' + id); if (!d) return; SES.dus(); d.classList.add('kale-ol'); setTimeout(() => d.remove(), 600); });
        // 🟢 bölünen balçık / 🐲 çağrılan yardımcılar sahneye doğar
        const dg = $('kale-dusmanlar');
        if (dg && o.yeni) o.yeni.forEach((d) => { if ($('kale-d' + d.id)) return; dg.insertAdjacentHTML('beforeend', dusmanSVG(d)); const e = $('kale-d' + d.id); if (e) e.classList.add('kale-dogdu'); });
        if (o.bolundu && o.yeni) { const z = o.yeni.find((d) => d.tip === 'minibalcik'); if (z) { pop('🟢 İKİYE BÖLÜNDÜ!', z.x + 18, z.y - 70, 24, '#9dff9a'); sonra(() => konus(z.id, rnd(SOZ.minibalcik)), 500); } }
        if (o.cagri && !o.ejder) { SES.ejder(); konus(o.cagri, 'Yavrularım, yardım edin!'); }
        if (o.ejder) { SES.ejder(); birlikParlat(o.ejder, 2600); dev(`🐲 EJDERHA DÜŞTÜ!<small>${o.ejder.length > 1 ? o.ejder.length + ' okçu birlikte devirdi: ' : ''}${isimler(o.ejder)}</small>`, 2600); }
        else if (o.kurtar && !_ekranHud) kurtarGoster(o.kurtar);
        if (!_ekranHud) hudCiz(); else ekranHudGuncelle(o);
    }
    // 🛡️ Son anda: kapının dibindeki düşmanı düşüren tek kişi değil — ona vuran herkes
    function kurtarGoster(k) {
        SES.boru(); birlikParlat(k.vuran, 2600);
        const ad = (D[k.tip] || D.goblin).ad, n = k.vuran.length;
        dev(`🛡️ SON ANDA DURDURDUK!<small>${n > 1 ? `${ad}'i ${n} okçu birlikte vurdu: ` : `${ad} kapıdan döndü: `}${isimler(k.vuran)}</small>`, 2600);
    }
    // Birlikte vuranlar parlar, aralarına altın bir bağ çizilir
    function birlikParlat(anahtarlar, ms) {
        const idx = (anahtarlar || []).map(sporcuIndex).filter((x) => x >= 0).sort((a, b) => a - b);
        idx.forEach((x) => { const c = $('kale-c' + x); if (c) { c.classList.add('kale-birlik'); setTimeout(() => c.classList.remove('kale-birlik'), ms); } });
        const g = $('kale-bag'); if (!g || idx.length < 2) return;
        const p = idx.map((x) => { const q = cocukXY(x); return `${q.x},${q.y - 22}`; }).join(' ');
        const e = svgEl('polyline', { points: p, fill: 'none', stroke: '#ffd23f', 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'kale-bag-cizgi' }, g);
        setTimeout(() => e.remove(), ms);
    }
    // ⚡ Yıldırım: her düşmana gökten şimşek
    function yildirimGoster(o) {
        SES.ates(); SES.vur(true);
        const w = document.getElementById('km-oyun-sahne') || panel(); anim(w, 'kale-flas');
        const g = $('kale-ucan');
        o.ids.forEach((id) => {
            const e = $('kale-d' + id), m = e && /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(e.style.transform); if (!m || !g) return;
            const x = +m[1], y = +m[2] - 40;
            const s = svgEl('path', { d: `M${x + 20} -20 L${x - 6} ${y * .45} L${x + 12} ${y * .5} L${x - 4} ${y}`, fill: 'none', stroke: '#fff7b0', 'stroke-width': 6, 'stroke-linejoin': 'round', class: 'kale-simsek' }, g);
            setTimeout(() => s.remove(), 600);
            anim(e.querySelector('.kale-govde'), 'kale-vurul'); pop('⚡-10', x, y - 30, 24, '#fff7b0');
        });
        sonucGoster(o);
    }
    // 🪨 Mancınık taşı: surdan en arkadaki düşmana
    function tasUcur(o, cb) {
        const e = $('kale-d' + o.id), m = e && /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(e.style.transform), g = $('kale-ucan');
        const bitir = () => { SES.vur(false); if (e) anim(e.querySelector('.kale-govde'), 'kale-vurul'); if (m) pop('🪨 -' + o.hasar, +m[1], +m[2] - 70, 22, '#e6e0d0'); sonucGoster(o); cb(); };
        if (!m || !g || !g.animate) { bitir(); return; }
        const x = +m[1], y = +m[2] - 30, t = svgEl('circle', { r: 9, fill: '#8a8f9c', stroke: '#4a4f5c', 'stroke-width': 2 }, g);
        const an = t.animate([{ transform: 'translate(281px,380px)' }, { transform: `translate(${(281 + x) / 2}px,${Math.min(380, y) - 180}px)` }, { transform: `translate(${x}px,${y}px)` }], { duration: 700, easing: 'ease-in-out' });
        an.onfinish = () => { t.remove(); bitir(); };
    }
    function ekranHudGuncelle(o) {
        const bar = $('kale-bar-ic'); if (bar && !(o.durum || []).length) { bar.style.width = '100%'; $('kale-bar-yazi').textContent = 'Dalga temiz!'; }
    }
    function adimGoster(a, dustu) {
        const dg = $('kale-dusmanlar'); if (dg) dg.classList.toggle('kale-donuk', a.buzKalan > 0);
        if (a.donuk) { SES.tink(); pop('❄️ Donup kaldılar!', 640, 380, 26, '#bfe9ff'); }
        else SES.adim();
        a.konum.forEach((d) => { const e = $('kale-d' + d.id); if (e) e.style.transform = `translate(${d.x}px,${d.y}px)`; });
        a.varan.forEach((id) => { const e = $('kale-d' + id); if (!e) return; e.style.transform = `translate(${KAPI_X}px,${e.style.transform.match(/,\s*([-\d.]+)px/)[1]}px)`; setTimeout(() => { e.classList.add('kale-ol'); setTimeout(() => e.remove(), 600); }, 650); });
        if (a.varan.length) {
            setTimeout(() => {
                SES.kapi(); const w = document.getElementById('km-oyun-sahne') || panel(); anim(w, 'kale-salla');
                pop(a.varan.length > 1 ? `Kapıya ${a.varan.length} düşman! 💔` : 'Kapıya ulaştı! 💔', 360, 330, 28, '#ff8fa8');
                if (!dustu) hudCiz(); else { const c = $('kale-canlar'); if (c) c.textContent = kalpler(0); }
            }, 650);
        } else if (!dustu) setTimeout(hudCiz, 650);
        if (a.ofke) { const e = document.querySelector('#kale-d' + a.ofke.id + ' .kale-ofke'); if (e) e.innerHTML = ofkeSVG(a.ofke.n); }
        (a.hayalet || []).forEach((h) => { const e = $('kale-d' + h.id); if (e) e.classList.toggle('kale-gorunmez', h.g); });
        if (a.firlat && !dustu) sonra(() => mermiFirlat(a.firlat), 900);
        if (a.gelisti && !dustu) { sonra(() => gelisimGoster(a.gelisti), 750); }
        // ⚔️ düşmanlar konuşur: tehlike > ejderha öfkesi > hiç değmedi > rastgele laf
        const vin = $('kale-vinyet'); if (vin) vin.classList.toggle('on', kmod() >= 2 && !!a.tehlike && !dustu);
        if (kmod() < 2 || dustu) return;
        setTimeout(() => {
            if (_toren || a.gelisti || a.firlat) return;
            if (a.tehlike) { SES.kalp(); konus(a.tehlike, rnd(TEHLIKE)); return; }
            if (a.ofke && a.ofke.n === a.ofke.sinir - 1) { SES.ejder(); konus(a.ofke.id, 'Bir seri daha sarı gelmezse... ATEŞ!'); return; }
            if (!a.hasarli) { SES.gulus(); konus(null, rnd(GULUS)); return; }
            if (Math.random() < .6) { const l = a.konum.filter((d) => d.x < 960); const d = l.length ? rnd(l) : null, e = d && $('kale-d' + d.id); if (e) konus(d.id, rnd(SOZ[e.dataset.tip] || SOZ.goblin)); }
        }, 800);
    }
    /* ---------------- 🎯 SAPANCI: fırlat · havada vur · çarp ---------------- */
    function mermiFirlat(f) {
        const g = $('kale-ucan'), mg = $('kale-mermi'), e = $('kale-d' + f.kaynak), m = e && /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(e.style.transform);
        const M = Object.values(MERMI).find((x) => x.tur === f.tur) || MERMI[1];
        SES.vin(); if (e) konus(f.kaynak, f.tur === 'domates' ? 'Domates geliyor! Hi hi!' : f.tur === 'tas' ? 'Taş geliyor, kaçın!' : 'Ateş topu! Yanacaksınız!');
        const yerles = () => { if (mg) mg.innerHTML = mermiAsili(f); pop(`${M.ikon} ${M.ad} GELİYOR! Sıradaki okçu ${MERMI_ESIK}+ atsın!`, 500, 170, 22, '#ffd23f'); };
        if (!m || !g || !g.animate) { yerles(); return; }
        const t = svgEl('g', {}, g); t.innerHTML = mermiSVG(f.tur);
        const sx = +m[1] - 28, sy = +m[2] - 44;
        const an = t.animate([{ transform: `translate(${sx}px,${sy}px) scale(.5)` }, { transform: `translate(${(sx + f.x) / 2}px,${Math.min(sy, f.y) - 130}px) scale(1)` }, { transform: `translate(${f.x}px,${f.y}px) scale(1)` }], { duration: 750, easing: 'ease-out' });
        an.onfinish = () => { t.remove(); yerles(); };
    }
    function mermiPatla(o) {
        const mg = $('kale-mermi'); if (mg) mg.innerHTML = '';
        SES.vur(true); SES.fanfar();
        const g = $('kale-ucan');
        if (g) for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, p = svgEl('circle', { cx: o.m.x, cy: o.m.y, r: 6, fill: o.m.tur === 'domates' ? '#e8413c' : o.m.tur === 'ates' ? '#ffb347' : '#a8aebb', class: 'kale-parca' }, g); p.style.setProperty('--dx', Math.cos(a) * 60 + 'px'); p.style.setProperty('--dy', Math.sin(a) * 60 + 'px'); setTimeout(() => p.remove(), 800); }
        pop('💥 HAVADA VURDUNUZ! +💰1', o.m.x, o.m.y - 40, 26, '#ffd23f');
        if (!_ekranHud) hudCiz();
    }
    function mermiCarp(o, cb) {
        const mg = $('kale-mermi'), g = $('kale-ucan'); if (mg) mg.innerHTML = '';
        const hx = 316, hy = 228; // skor paneli sol alt suru örter — kapı üstü görünür
        const bitir = () => {
            const w = document.getElementById('km-oyun-sahne') || panel();
            if (o.m.tur === 'domates') {
                SES.iska(); SES.gulus(); pop('ŞLAP! 🍅 Hiç zararı yok!', hx, hy - 30, 24, '#ff9a8f');
                const s = $('kale-sur'); if (s) { const l = svgEl('g', { class: 'kale-leke' }, s); l.innerHTML = `<g transform="translate(${hx} ${hy})"><path d="M-22 -6 q-6 -14 8 -16 q6 -12 16 -2 q14 -4 12 10 q12 8 0 16 q2 14 -12 10 q-8 12 -16 0 q-14 2 -10 -10 q-12 -6 2 -18Z" fill="#e8413c" opacity=".9"/><circle cx="-26" cy="16" r="4" fill="#e8413c"/><circle cx="26" cy="-18" r="3" fill="#e8413c"/></g>`; setTimeout(() => l.remove(), 6000); }
            } else {
                SES.kapi(); if (o.m.tur === 'ates') SES.ates(); anim(w, 'kale-salla');
                const c = $('kale-catlak'); if (c && o.m.tur === 'tas') c.innerHTML = catlakSVG(o.can ? CATLAK_SINIR : o.catlak);
                pop(o.can ? (o.m.tur === 'tas' ? '🧱 Sur yıkıldı! -1 ❤️' : '🔥 Kaleye çarptı! -1 ❤️') : `🧱 Sur çatladı! ${o.catlak}/${CATLAK_SINIR}`, hx, hy - 30, 26, '#ff8fa8');
                if (o.can && c) setTimeout(() => { c.innerHTML = ''; }, 1600);
            }
            if (!_ekranHud) hudCiz();
            cb();
        };
        if (!g || !g.animate) { bitir(); return; }
        const t = svgEl('g', {}, g); t.innerHTML = mermiSVG(o.m.tur);
        const an = t.animate([{ transform: `translate(${o.m.x}px,${o.m.y}px)` }, { transform: `translate(${hx}px,${hy}px) scale(1.3)` }], { duration: 450, easing: 'ease-in' });
        an.onfinish = () => { t.remove(); bitir(); };
    }
    // 🧙 Şaman bir düşmanı geliştirir: mor büyü çizgisi, düşman yeni evresiyle yeniden çizilir
    function gelisimGoster(g) {
        const sm = $('kale-d' + g.kaynak), e = $('kale-d' + g.d.id), dg = $('kale-dusmanlar'); if (!e || !dg) return;
        const yer = (x) => { const m = x && /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(x.style.transform); return m ? { x: +m[1], y: +m[2] } : null; };
        const a = yer(sm), b = yer(e), u = $('kale-ucan');
        SES.buyu(); if (sm) konus(g.kaynak, 'Güçlen kardeşim!');
        if (a && b && u) { const c = svgEl('path', { d: `M${a.x - 24} ${a.y - 76} Q${(a.x + b.x) / 2} ${Math.min(a.y, b.y) - 170} ${b.x} ${b.y - 50}`, fill: 'none', stroke: '#c77dff', 'stroke-width': 6, 'stroke-linecap': 'round', class: 'kale-buyu' }, u); setTimeout(() => c.remove(), 1100); }
        sonra(() => {
            const yeni = $('kale-d' + g.d.id); if (!yeni) return;
            yeni.insertAdjacentHTML('afterend', dusmanSVG(g.d)); yeni.remove();
            const n = $('kale-d' + g.d.id); if (n) n.classList.add('kale-dogdu');
            if (b) pop(`✨ ${dusmanAd(g.d.tip, g.d.evre)}!`, b.x, b.y - 110, 24, '#e7c6ff');
            hudCiz();
        }, 600);
    }
    // Konuşma balonu: düşmanın başının üstünde, ~2,8 sn (aynı anda tek balon). id yoksa en öndeki konuşur.
    function konus(id, metin) {
        const g = $('kale-pop'); if (!g) return;
        let e = id != null ? $('kale-d' + id) : null;
        if (!e) { let enOn = null, ex = 1e9; document.querySelectorAll('#kale-dusmanlar .kale-dusman:not(.kale-ol)').forEach((x) => { const m = /translate\(([-\d.]+)px/.exec(x.style.transform); if (m && +m[1] < ex) { ex = +m[1]; enOn = x; } }); e = enOn; }
        const m = e && /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(e.style.transform); if (!m) return;
        const c = D[e.dataset.tip] || D.goblin, ex = +m[1], w = Math.min(460, metin.length * 9.2 + 30);
        const x = Math.max(w / 2 + 6, Math.min(994 - w / 2, ex)), y = +m[2] - (c.ucar ? 96 : 104 * c.olcek + 46); // vuruş yazılarının (pop) üstünde
        const eski = $('kale-balon'); if (eski) eski.remove();
        const b = svgEl('g', { id: 'kale-balon', class: 'kale-balon' }, g), zemin = _gece ? '#2a0f1c' : '#fff', cizgi = _gece ? '#ff6b5a' : '#1b1230';
        const kx = Math.max(x - w / 2 + 16, Math.min(x + w / 2 - 22, ex));
        svgEl('path', { d: `M${kx - 7} ${y - 3} L${kx + 2} ${y + 12} L${kx + 9} ${y - 3}Z`, fill: zemin, stroke: cizgi, 'stroke-width': 3, 'stroke-linejoin': 'round' }, b);
        svgEl('rect', { x: x - w / 2, y: y - 36, width: w, height: 34, rx: 15, fill: zemin, stroke: cizgi, 'stroke-width': 3 }, b);
        svgEl('rect', { x: kx - 6, y: y - 5, width: 13, height: 5, fill: zemin }, b);
        const t = svgEl('text', { x: x, y: y - 13, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 900, fill: _gece ? '#ffd9d0' : '#1b1230' }, b); t.textContent = metin;
        setTimeout(() => b.remove(), 2800);
    }
    // Ejderha ateşi: ağzından kaleye alev topu, kale sallanır, -1 can
    function atesGoster(a, dustu) {
        const e = $('kale-d' + a.id), m = e && /translate\(([-\d.]+)px,\s*([-\d.]+)px\)/.exec(e.style.transform), g = $('kale-ucan');
        SES.ejder(); konus(a.id, 'Sarı atmadınız... ATEŞ!');
        const bitir = () => {
            SES.ates(); SES.kapi(); anim(document.getElementById('km-oyun-sahne') || panel(), 'kale-salla');
            pop('🔥 Ejderha ateş püskürttü! -1 ❤️', 330, 300, 26, '#ffb347');
            const c = $('kale-canlar'); if (c) c.textContent = kalpler(dustu ? 0 : durum().can);
        };
        if (!m || !g || !g.animate) { bitir(); return; }
        const sx = +m[1] - 70, sy = +m[2] - 120, top = svgEl('g', {}, g);
        svgEl('circle', { r: 26, fill: '#ff5f1f', opacity: .55 }, top); svgEl('circle', { r: 15, fill: '#ffd23f' }, top);
        const an = top.animate([{ transform: `translate(${sx}px,${sy}px) scale(.4)` }, { transform: `translate(${(sx + 300) / 2}px,${sy - 80}px) scale(1)` }, { transform: 'translate(300px,300px) scale(1.5)' }], { duration: 850, easing: 'ease-in' });
        an.onfinish = () => { top.remove(); bitir(); };
    }
    // Yeni dalgada ilk kez görünen düşmanı / öfkeli ejderhayı tanıt (⚔️ ve üstü)
    function tanit() {
        const m = kmod(), st = durum(), var_ = (t) => st.dusmanlar.some((d) => d.tip === t), ev = evreDalga(st.dalga), kart = [];
        const K = {
            zirhli: '🛡️ YENİ DÜŞMAN: Altın Zırhlı Goblin<small>Zırhına sadece <b>SARI</b> (9-10-X) işler! Sarı atamazsanız onu düşüremezsiniz.</small>',
            kalkanci: '🛡️ YENİ DÜŞMAN: Kalkanlı Trol<small>Kalkanını sadece <b>KIRMIZI ya da SARI</b> (7 ve üstü) deler!</small>',
            yavruejder: '🐉 YENİ DÜŞMAN: Yavru Ejderha<small>Uçar ve çok hızlıdır — çabuk düşürün!</small>',
            balcik: '🟢 YENİ DÜŞMAN: Balçık<small>Düşünce <b>ikiye bölünür</b> — iki minik balçık daha gelir! Hepsini durdurun.</small>',
            hayalet: '👻 YENİ DÜŞMAN: Hayalet<small>Bir seri görünür, bir seri <b>görünmez</b> olur — görünmezken oklar içinden geçip arkadakine gider!</small>',
            sapanci: `🎯 YENİ DÜŞMAN: Sapancı Goblin<small>Kaleye ${MERMI[m].ikon} <b>${MERMI[m].ad.toLocaleLowerCase('tr-TR')}</b> fırlatır — havada asılı kalır! Sıradaki okçu <b>${MERMI_ESIK} ve üstü</b> atarsa havada vurur (💰 +1). ${m === 1 ? 'Vuramazsanız sura yapışır, zararı yok!' : m === 2 ? 'Vuramazsanız sur çatlar — 3 çatlakta -1 ❤️' : 'Vuramazsanız kale yanar: -1 ❤️'}</small>`,
            saman: '🧙 YENİ DÜŞMAN: Goblin Şaman<small>En arkada büyü yapar: her 2 seride bir düşmanı <b>geliştirir</b>! 🔥 X ve 🪨 mancınık arkayı vurur.</small>'
        };
        // ✨ evre değişti: günde bir kez "CANAVARLAR GELİŞTİ"
        if (ev > 1 && (st.evreGor || 1) < ev && st.dusmanlar.some((d) => (d.evre || 1) >= ev)) {
            st.evreGor = ev; kaydet();
            const kural = m < 2 ? '' : ev === 2 ? '<br>⚔️ Kalkanlı Trol artık <b>8 ve üstü</b> ister!' : '<br>⚔️ Kalkanlı Trol <b>9+</b>, Altın Zırhlı Goblin yalnız <b>10</b>!';
            kart.push([`✨ CANAVARLAR GELİŞTİ!<small><span class="kale-evrim">${miniSVG('goblin', ev - 1)}<b>➜</b>${miniSVG('goblin', ev)}</span>Artık hepsi ${EVRE[ev].ikon} <b>${EVRE[ev].ad}</b> — ${ev === 2 ? 'miğferli ve boynuzlu! Daha dikkatli nişan alın.' : 'taçlı krallar geldi! Hep birlikte durduralım.'}${kural}</small>`, 5200]);
        }
        const yk = (YENI_DUSMAN[st.dalga] || []).filter((y) => m >= y[1] && K[y[0]] && var_(y[0]));
        yk.forEach((y) => kart.push([K[y[0]].replace('<small>', `<small><span class="kale-evrim">${miniSVG(y[0], ev)}</span>`), 4600]));
        if (!yk.length && m >= 2 && st.dusmanlar.some((d) => d.ofke != null)) kart.push([`🐲 EJDERHA GELİYOR!<small>Sarı atılmayan her seride öfkelenir 🔥 — ${OFKE_SINIR[m]} seri üst üste sarı gelmezse kaleye ateş püskürtür! Sarı atın, sakinleşsin.</small>`, 4600]);
        let t = 0; kart.forEach(([h, ms]) => { sonra(() => dev(h, ms), t); t += ms + 350; });
    }
    function temizGoster(h) {
        _toren = true; SES.fanfar();
        dev(`DALGA ${h.dalga} TEMİZ! 🎉`, 2200);
        const b = $('kale-bayrak'); if (b) anim(b, 'kale-bayrak-sevin');
        document.querySelectorAll('#kale-cocuklar .kale-ci').forEach((e, k) => { e.style.animationDelay = (k % 6) * .07 + 's'; e.classList.add('kale-zipla'); });
        // v342: son düşüren değil — o dalgada vuran herkes birlikte (kullanıcı: "aslında toplu yapıyorlar")
        sonra(() => {
            const st = durum(), n = h.okcular.length; birlikParlat(h.okcular, 4000);
            dev(`🤝 HEP BİRLİKTE BAŞARDINIZ!<small>${n > 1 ? n + ' okçu birlikte savundu: ' : ''}${isimler(h.okcular, 14)}<br>💰 +${h.altin} altın — 🔨 Atölye'de kaleyi güçlendirin · Sıradaki: Dalga ${st.dalga}${dalgaTipleri(st.dalga).indexOf('ejderha') >= 0 ? ' — 🐲 EJDERHA geliyor!' : ''}</small>`, 3800);
        }, 2500);
        sonra(() => { _toren = false; _ekranHud = null; kaleSahneKur(); SES.boru(); const g = $('kale-dusmanlar'); if (g) anim(g, 'kale-geliyor'); sonra(tanit, 1200); if (durum().altin > 0) sonra(atolyeAc, 400); }, 6600);
    }
    /* ---------------- 🔨 KALE ATÖLYESİ ---------------- */
    function atolyeAc() {
        const a = $('kale-atolye'); if (!a) return;
        const st = durum(), altin = st.altin || 0, at = st.atolye || {};
        a.innerHTML = `<div class="kale-at-bas"><b>🔨 Kale Atölyesi</b><span class="kale-at-altin">💰 ${altin} altın</span><button class="kale-at-x" data-at="x" title="Kapat">✕</button></div>
          <div class="kale-at-not">${altin ? 'Sınıfça seçin — hepimizin kalesi! (her biri 1 altın)' : 'Altın yok — dalga temizleyin, altın kazanın (🐲 ejderha dalgası 2 altın).'}</div>
          <div class="kale-at-liste">${ATOLYE.map((x) => {
            const sv = at[x.id] || 0, dolu = x.id === 'sur' ? st.can >= kalpSayisi() + 1 : sv >= ATOLYE_UST, kapali = dolu || altin < 1;
            const etiket = x.id === 'sur' ? (dolu ? 'kale tam güçte' : x.acik()) : (dolu ? 'en üst seviye' : x.acik(sv + 1));
            return `<button class="kale-at-btn" data-at="${x.id}"${kapali ? ' disabled' : ''}><span class="kale-at-ikon">${x.ikon}</span><span><b>${x.ad}${x.id !== 'sur' ? ` <i>${'●'.repeat(sv)}${'○'.repeat(ATOLYE_UST - sv)}</i>` : ''}</b><small>${etiket}</small></span></button>`;
          }).join('')}</div>`;
        a.onclick = (e) => { const b = e.target.closest('[data-at]'); if (!b || b.disabled) return; if (b.dataset.at === 'x') atolyeKapat(); else atolyeAl(b.dataset.at); };
        a.classList.add('goster');
    }
    function atolyeKapat() { const a = $('kale-atolye'); if (a) a.classList.remove('goster'); }
    function atolyeAl(id) {
        const st = durum(), x = ATOLYE.find((y) => y.id === id); if (!x || (st.altin || 0) < 1) return;
        st.atolye = st.atolye || {};
        if (id === 'sur') { if (st.can >= kalpSayisi() + 1) return; st.can++; st.catlak = 0; }
        else { if ((st.atolye[id] || 0) >= ATOLYE_UST) return; st.atolye[id] = (st.atolye[id] || 0) + 1; }
        st.altin--; kaydet(); SES.fanfar();
        if (!_toren) kaleSahneKur(); else hudCiz();
        pop(`${x.ikon} ${x.ad}${id !== 'sur' ? ' ' + st.atolye[id] + '. seviye' : ''}!`, 330, 300, 30, '#ffd23f');
        atolyeAc(); if (!st.altin) sonra(atolyeKapat, 1400);
    }
    /* ---------------- 📜 KALE DEFTERİ — günün ortak özeti ---------------- */
    function defter() {
        const st = durum(), okcular = liste().map((x) => x.g + '|' + x.ad).filter((k) => st.katki[k] > 0);
        const hasar = Object.keys(st.katki || {}).reduce((a, k) => a + st.katki[k], 0), oz = st.ozel || {};
        const satir = [`🏰 ${st.temizlenen || 0} dalga temizlendi`, `👹 ${st.dusen || 0} düşman düştü`, st.ejderha ? `🐲 ${st.ejderha} ejderha` : '', st.kurtarma ? `🛡️ ${st.kurtarma} kez son anda` : '', `⚔️ ${hasar} ortak hasar`,
            oz.yildirim ? `⚡ ${oz.yildirim} yıldırım` : '', oz.buz ? `❄️ ${oz.buz} buz oku` : '', oz.delici ? `🎯 ${oz.delici} delici ok` : '', st.bolunen ? `🟢 ${st.bolunen} balçık bölündü` : '', st.gelisen ? `🧙 ${st.gelisen} canavar geliştirildi` : '', st.havada ? `🎯 ${st.havada} kez havada vurduk` : ''].filter(Boolean);
        dev(`📜 Bugünün Kale Defteri<small>${satir.join(' · ')}<br>🤝 ${okcular.length} okçu hep birlikte: ${isimler(okcular, 30) || '—'}<br>
          <button class="kale-wa" id="kale-wa">💬 WhatsApp'ta paylaş</button><br><i>(kapatmak için dokun)</i></small>`);
        const d = $('kale-dev'); if (!d) return;
        d.style.pointerEvents = 'auto'; d.onclick = () => { d.classList.remove('goster'); d.style.pointerEvents = ''; d.onclick = null; };
        const w = $('kale-wa'); if (w) w.onclick = (e) => {
            e.stopPropagation();
            const adlar = okcular.map((k) => { const s = liste()[sporcuIndex(k)]; return s ? ilkAd(s.ad) : ''; }).filter(Boolean).join(', ');
            const metin = `🏰 *Kale Savunması — bugün hep birlikte!*\n${satir.join('\n')}\n\n🤝 ${okcular.length} okçu birlikte savundu: ${adlar}\n\n🏹 DAĞ Spor Kulübü`;
            window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(metin), '_blank');
        };
    }
    function dustuGoster(h) {
        _toren = true; SES.kapi();
        const m = kmod(), geri = h ? h.dalga - h.yeni : 0;
        // ⚔️/😈 kaybetme hissi: surlar yıkılır, bayrak düşer, düşmanlar güler
        if (m >= 2) { const s = $('kale-sur'), b = $('kale-bayrak'); if (s) s.classList.add('kale-yikil'); if (b) b.classList.add('kale-bayrak-dus'); setTimeout(() => { SES.gulus(); konus(null, 'Kale bizim! Hahaha!'); }, 500); }
        dev('KALE DÜŞTÜ! 😱<small>' + (geri > 0 ? `Düşmanlar bizi ${geri} dalga geri itti — Dalga ${h.yeni}'den tekrar! Kaleyi geri alalım!` : `Hep birlikte tekrar — aynı dalga baştan, kale yine ${kalpSayisi()} canlı!`) + '</small>', m >= 2 ? 4400 : 3200);
        sonra(() => { _toren = false; _ekranHud = null; kaleSahneKur(); SES.boru(); const g = $('kale-dusmanlar'); if (g) anim(g, 'kale-geliyor'); if (geri > 0) sonra(tanit, 1200); }, m >= 2 ? 4800 : 3600);
    }
    function nasil() {
        dev(`🏰 Kaleyi koruyun!<small style="text-align:left;display:inline-block;max-width:580px">
          Düşmanlar yoldan kaleye yürüyor. Her ok <b>en öndeki</b> düşmana gider: puan = hasar.<br>
          🟡 9-10 kritik ×1,5 💥 · X ateşli ok 🔥 (arkadakine de vurur) · Iska → ok yere saplanır<br>
          Her seriden sonra düşmanlar bir adım yaklaşır. Kapıya varan kalenin bir canını alır ❤️❤️❤️<br>
          Dalga temizlenince daha güçlüsü gelir — her 3. dalgada 🐲 ejderha!<br>
          ⚡ 10-10-10 yıldırım (bütün düşmanlara) · ❄️ üçü de sarı: düşmanlar 2 adım donar · 🎯 üçü aynı 7 ya da 8: zırh/kalkan işlemez<br>
          🤝 Kaleyi hep birlikte koruyoruz: her dalga 💰 altın → 🔨 Atölye'de mancınık, hendek, okçu kulesi, sur onarımı<br>
          ✨ Canavarlar gelişir: 4. dalgadan 🪖 Savaşçı, 7. dalgadan 👑 Kral · 🟢 Balçık ikiye bölünür · 👻 Hayalet bir seri görünmez<br>
          🎯 Sapancı Goblin kaleye bir şey fırlatır, havada asılı kalır — sıradaki okçu ${MERMI_ESIK}+ atarsa havada vurur (💰 +1)<br>
          ⚖️ Dalgalar sınıfın bugünkü atışına göre güçlenir — yakından çok puan atınca canavarlar da güçlü gelir<br>
          ${kmod() >= 2 ? `<b>${kmod() === 3 ? '😈 Korkutucu' : '⚔️ Heyecanlı'}:</b> 🛡️ Zırhlı Goblin'e yalnız sarı, Kalkanlı Trol'e 7 ve üstü işler (canavarlar geliştikçe eşik yükselir) · 🧙 Şaman düşmanları geliştirir ·
          ejderha sarısız ${OFKE_SINIR[kmod()]} seride ateş püskürtür · kale düşerse ${GERI_DALGA[kmod()]} dalga geri${kmod() === 3 ? ' · kalenin 2 canı var' : ''}<br>` : ''}<i>(kapatmak için dokun)</i></small>`);
        const d = $('kale-dev'); if (d) { d.style.pointerEvents = 'auto'; d.onclick = () => { d.classList.remove('goster'); d.style.pointerEvents = ''; d.onclick = null; }; }
    }
    function yeniOyunSor() {
        const f = () => { const st = durum(); st.can = kalpSayisi(); st.evreGor = 1; st.catlak = 0; yeniDalga(st, 1); kaydet(); kaleSahneKur(); if (typeof showToast === 'function') showToast('🔄 Kale savunması baştan başladı!', 'success'); };
        if (typeof onayIste === 'function') onayIste('Kale savunması 1. dalgadan yeniden başlasın mı?<br><small>Sporcuların serileri silinmez.</small>', f, 'Baştan başla', 'Vazgeç'); else f();
    }

    /* ---------------- GERİ AL / CHIP ---------------- */
    function kaleAnlik() { return JSON.parse(JSON.stringify(durum())); }
    function kaleGeriYukle(k) { if (!k) return; zamanTemizle(); _toren = false; _ekranHud = null; _st = k; _stKonum = konum(); kaydet(); if (panel()) kaleSahneKur(); }
    function kaleSporcuHasar(g, ad) { const st = durum(); return st.katki[g + '|' + ad] || 0; }

    /* ---------------- STİL ---------------- */
    function css() {
        if ($('kale-css')) return;
        const st = document.createElement('style'); st.id = 'kale-css';
        st.textContent = `
.km-oyun-panel-kale{padding:0;background:#3b2d63;overflow:hidden}
.kale-hud{position:absolute;right:12px;top:10px;z-index:1;width:min(440px,52%);display:grid;gap:6px;pointer-events:none}
.kale-hud-ust{display:flex;gap:6px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.kale-ad,.kale-cip{background:rgba(20,14,36,.74);color:#f6efff;border-radius:999px;padding:6px 12px;font-weight:800;font-size:14px;white-space:nowrap}
.kale-btn{pointer-events:auto;background:rgba(20,14,36,.74);border:0;color:#fff;border-radius:999px;width:34px;height:34px;font-size:16px;cursor:pointer}
.kale-bar{position:relative;height:18px;border-radius:999px;background:rgba(20,14,36,.74);overflow:hidden}
.kale-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff9f43,#ffd23f);transition:width .5s}
.kale-bar span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;text-shadow:0 1px 2px #000}
/* çocuğa dokununca sıra ona geçer: kabuğun ortak data-km-sporcu dinleyicisi (app.js kmOyunSahneSporcuBul) */
.kale-cocuk{cursor:pointer}.kale-cocuk:hover .kale-ci{filter:brightness(1.15)}
.kale-halka{transition:opacity .3s}.kale-cocuk.kale-aktif .kale-ad-yazi{fill:#ffd23f}
.kale-sira-geldi,.kale-zipla{transform-box:fill-box;transform-origin:50% 100%}
.kale-sira-geldi{animation:kaleSiraGeldi .7s cubic-bezier(.3,1.6,.5,1)}
@keyframes kaleSiraGeldi{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-16px) scale(1.18)}100%{transform:translateY(0) scale(1)}}
.kale-zipla{animation:kaleZipla .45s ease-in-out 6}@keyframes kaleZipla{50%{transform:translateY(-14px)}}
/* düşman konumu dış g'nin CSS transform'unda (adım geçişi), iç .kale-govde yürür/sallanır — CSS transform özniteliği ezerdi */
.kale-dusman{transition:transform .6s ease-in-out}
.kale-govde{transform-box:fill-box;transform-origin:50% 100%}
.kale-yuru{animation:kaleYuru .6s ease-in-out infinite}@keyframes kaleYuru{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg) translateY(-3px)}}
.kale-uc{animation:kaleUc 1.6s ease-in-out infinite}@keyframes kaleUc{50%{transform:translateY(-12px)}}
.kale-kanat{animation:kaleKanat .25s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 80%}@keyframes kaleKanat{to{transform:scaleY(.55)}}
.kale-govde.kale-vurul{animation:kaleVurul .35s ease-out}@keyframes kaleVurul{0%{transform:none;filter:none}25%{transform:translateX(12px) rotate(10deg);filter:brightness(2.2)}100%{transform:none;filter:none}}
.kale-ol{animation:kaleOl .55s ease-in forwards}@keyframes kaleOl{to{opacity:0;filter:brightness(3)}}
.kale-geliyor{animation:kaleGeliyor 1.1s ease-out}@keyframes kaleGeliyor{from{transform:translateX(320px);opacity:0}}
.kale-bayrak{transform-box:fill-box;transform-origin:0 50%;animation:kaleBayrak 1.8s ease-in-out infinite}@keyframes kaleBayrak{50%{transform:scaleX(.82) skewY(4deg)}}
.kale-bayrak-sevin{animation:kaleBayrak .3s ease-in-out 10}
/* ⚔️/😈 heyecan */
.kale-bayrak.kale-bayrak-dus{animation:kaleBayrakDus 1.2s ease-in forwards}@keyframes kaleBayrakDus{to{transform:translateY(64px) rotate(80deg);opacity:.35}}
#kale-sur.kale-yikil{animation:kaleYikil 1.8s ease-in forwards;transform-box:fill-box;transform-origin:50% 100%}
@keyframes kaleYikil{20%{transform:rotate(-1deg)}40%{transform:rotate(1.2deg)}100%{transform:translateY(70px) rotate(2.5deg);filter:grayscale(1) brightness(.55)}}
.kale-govde.kale-sek{animation:kaleSek .35s ease-out}@keyframes kaleSek{30%{filter:brightness(1.8) drop-shadow(0 0 8px #fff)}}
.kale-balon{animation:kaleBalon 2.8s ease-out forwards;transform-box:fill-box;transform-origin:50% 100%}
@keyframes kaleBalon{0%{opacity:0;transform:scale(.4)}10%{opacity:1;transform:scale(1.06)}16%{transform:scale(1)}85%{opacity:1}100%{opacity:0}}
.kale-vinyet{position:absolute;inset:0;pointer-events:none;z-index:1;opacity:0;transition:opacity .5s;box-shadow:inset 0 0 120px 30px rgba(255,30,30,.55)}
.kale-vinyet.on{opacity:1;animation:kaleVinyet 1s ease-in-out infinite}@keyframes kaleVinyet{50%{opacity:.45}}
.kale-gece .kale-govde{filter:drop-shadow(0 0 5px rgba(255,70,60,.45))}
.kale-gece~.kale-hud .kale-ad,.kale-gece~.kale-hud .kale-cip,.kale-gece~.kale-hud .kale-btn,.kale-gece~.kale-hud .kale-bar{background:rgba(70,16,28,.88);box-shadow:0 0 0 1.5px rgba(255,107,90,.55)}
.kale-pop{animation:kalePop 1.4s ease-out forwards;transform-box:fill-box;transform-origin:center}
@keyframes kalePop{0%{opacity:0;transform:translateY(10px) scale(.5)}20%{opacity:1;transform:scale(1.1)}100%{opacity:0;transform:translateY(-50px)}}
.kale-salla{animation:kaleSalla .1s linear 8}@keyframes kaleSalla{0%,100%{transform:translate(0,0)}25%{transform:translate(-6px,3px)}75%{transform:translate(6px,-3px)}}
.kale-dev{position:absolute;left:50%;top:45%;transform:translate(-50%,-50%) scale(.4);opacity:0;font-weight:900;font-size:clamp(28px,6vw,80px);color:#fff;text-shadow:0 6px 0 rgba(0,0,0,.35);text-align:center;pointer-events:none;transition:.35s cubic-bezier(.3,1.6,.5,1);z-index:3;line-height:1.05;width:92%}
.kale-dev small{display:block;font-size:.3em;font-weight:800;margin-top:8px;color:#ffe9b8;line-height:1.35}
.kale-dev.goster{opacity:1;transform:translate(-50%,-50%) scale(1)}
/* v342 hep birlikte · özel oklar · atölye */
.kale-btn-genis{width:auto;min-width:34px;padding:0 10px;font-size:14px;font-weight:900;white-space:nowrap}
.kale-btn-parla{box-shadow:0 0 0 2px #ffd23f;animation:kaleParla 1.4s ease-in-out infinite}@keyframes kaleParla{50%{box-shadow:0 0 0 2px #ffd23f,0 0 16px #ffd23f}}
.kale-guc{display:flex;gap:5px;justify-content:flex-end;flex-wrap:wrap}.kale-guc:empty{display:none}
.kale-guc span{background:rgba(20,14,36,.74);color:#ffe9b8;border-radius:999px;padding:3px 9px;font-size:12px;font-weight:900}
.kale-birlik .kale-ci{filter:drop-shadow(0 0 10px #ffd860) drop-shadow(0 0 4px #fff)}.kale-birlik .kale-ad-yazi{fill:#ffd23f}
.kale-bag-cizgi{stroke-dasharray:14 10;animation:kaleBag .8s linear infinite;filter:drop-shadow(0 0 6px #ffd23f);opacity:.9}@keyframes kaleBag{to{stroke-dashoffset:-24}}
.kale-donuk .kale-govde{filter:saturate(.3) brightness(1.15) drop-shadow(0 0 6px #9fe0ff);animation-play-state:paused}
.kale-simsek{filter:drop-shadow(0 0 10px #fff7b0)}
/* v359 gelişen canavarlar */
.kale-dusman{transition:transform .6s ease-in-out,opacity .5s}
.kale-dusman.kale-gorunmez{opacity:.22}
.kale-e3 .kale-govde,.kale-gece .kale-e3 .kale-govde{filter:drop-shadow(0 0 7px rgba(255,210,63,.8)) saturate(1.15)}
.kale-dogdu{animation:kaleDogdu .7s ease-out}@keyframes kaleDogdu{0%{opacity:0;filter:brightness(3) drop-shadow(0 0 12px #e7c6ff)}60%{opacity:1}}
.kale-buyu{stroke-dasharray:12 10;animation:kaleBag .5s linear infinite;filter:drop-shadow(0 0 8px #c77dff)}
.kale-kure{animation:kaleKure 1.2s ease-in-out infinite}@keyframes kaleKure{50%{opacity:.55}}
.kale-evrim{display:flex;justify-content:center;align-items:center;gap:6px;margin:4px 0 6px}.kale-evrim b{font-size:1.6em;color:#ffd23f}
.kale-mini{overflow:visible;filter:drop-shadow(0 4px 0 rgba(0,0,0,.3))}
.kale-mermi-sal{animation:kaleMermiSal 1s ease-in-out infinite;transform-box:fill-box;transform-origin:center}@keyframes kaleMermiSal{50%{transform:translateY(-8px) rotate(14deg)}}
.kale-mermi-halka{animation:kaleMermiHalka 2s linear infinite;transform-box:fill-box;transform-origin:center;filter:drop-shadow(0 0 6px #ffd23f)}@keyframes kaleMermiHalka{to{transform:rotate(360deg)}}
.kale-parca{animation:kaleParca .7s ease-out forwards;transform-box:fill-box}@keyframes kaleParca{to{transform:translate(var(--dx),var(--dy)) scale(.3);opacity:0}}
.kale-leke{animation:kaleLeke 6s ease-in forwards}@keyframes kaleLeke{0%{opacity:0}5%{opacity:1}80%{opacity:1}100%{opacity:0}}
.kale-flas{animation:kaleFlas .45s ease-out}@keyframes kaleFlas{0%{filter:brightness(2.4)}100%{filter:none}}
.kale-wa{pointer-events:auto;margin:10px 0 4px;border:0;border-radius:999px;background:#25d366;color:#08311a;font-weight:900;font-size:16px;padding:9px 18px;cursor:pointer}
.kale-atolye{position:absolute;right:12px;top:84px;z-index:4;width:min(400px,calc(100% - 24px));background:rgba(20,14,36,.93);color:#f6efff;border-radius:18px;padding:12px;box-shadow:0 10px 30px rgba(0,0,0,.45),0 0 0 2px #ffd23f55;transform:translateY(-14px);opacity:0;pointer-events:none;transition:.3s cubic-bezier(.3,1.4,.5,1)}
.kale-atolye.goster{transform:none;opacity:1;pointer-events:auto}
.kale-at-bas{display:flex;align-items:center;gap:8px}.kale-at-bas b{font-size:17px;flex:1}
.kale-at-altin{background:#ffd23f;color:#3a2600;border-radius:999px;padding:3px 10px;font-weight:900;font-size:13px}
.kale-at-x{border:0;background:transparent;color:#c9bde3;font-size:18px;cursor:pointer;width:32px;height:32px}
.kale-at-not{font-size:12px;color:#c9bde3;margin:4px 0 8px}
.kale-at-liste{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.kale-at-btn{display:flex;gap:8px;align-items:center;text-align:left;border:0;border-radius:12px;background:#2e2452;color:#f6efff;padding:8px;cursor:pointer;font:inherit;min-height:56px}
.kale-at-btn:not(:disabled):hover{background:#3d3070;box-shadow:0 0 0 2px #ffd23f}
.kale-at-btn:disabled{opacity:.45;cursor:default}
.kale-at-ikon{font-size:24px}.kale-at-btn b{display:block;font-size:13px}.kale-at-btn b i{font-style:normal;color:#ffd23f;font-size:10px;letter-spacing:1px}
.kale-at-btn small{display:block;font-size:11px;color:#c9bde3;line-height:1.25}
@media (max-width:700px){.kale-hud{width:62%}.kale-ad,.kale-cip{font-size:12px;padding:4px 9px}.kale-atolye{top:auto;bottom:12px;right:12px}.kale-at-liste{grid-template-columns:1fr}.kale-at-btn{min-height:44px}}
@media (prefers-reduced-motion:reduce){.km-oyun-panel-kale *{animation-duration:.01ms!important;animation-iteration-count:1!important}}`;
        document.head.appendChild(st);
    }

    window.kaleSahneKur = kaleSahneKur;
    window.kaleGuncelle = kaleGuncelle;
    window.kaleSeri = kaleSeri;
    window.kaleAnlik = kaleAnlik;
    window.kaleGeriYukle = kaleGeriYukle;
    window.kaleSporcuHasar = kaleSporcuHasar;
    window.kaleDusmanlar = D;
    // Oyun Ayarları › Kale seviyesi değişince sahnedeki dalganın canı ve adım boyu yeniden hesaplanır (kalan can oranı korunur).
    window.kaleAyarUygula = function () {
        if (_toren) return; const st = durum();
        // Kale heyecanı değişti: dalga yeni seviyenin düşmanlarıyla baştan kurulur (dalga numarası korunur, can yeni üst sınıra iner)
        if ((st.mod || 1) !== kmod()) { st.can = Math.max(1, Math.min(st.can, kalpSayisi())); if (kmod() === 1 && st.can < 3) st.can = 3; yeniDalga(st, st.dalga); kaydet(); if (panel() && $('kale-svg')) { kaleSahneKur(); tanit(); } return; }
        const top = toplamCan(st.dalga, st), tipler = dalgaTipleri(st.dalga), ag = tipler.reduce((a, t) => a + D[t].agirlik, 0);
        st.dusmanlar.forEach((d) => { const yeni = dusmanCan(d.tip, top, ag), oran = d.can / (d.max || 1); d.max = yeni; d.can = Math.max(1, Math.round(oran * yeni)); });
        st.adim = adimHesapla(); kaydet();
        if (panel() && $('kale-svg')) kaleSahneKur();
    };
})();
