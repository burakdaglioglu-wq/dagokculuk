/* ================================================================================================
   🥚 YUMURTA YUVASI — Karışık Sınıf › Oyunlar (2026-10-11, kullanıcı 8 yaş için iki oyun fikrinden "yumurta güzelmiş,
   önce onu yapalım" dedi). Araştırma notu: 6-8 yaşta koleksiyon merakı başlar; sporda kalmayı en iyi "kendini geçme"
   (ustalık) ortamı sağlar → çocuk başkasıyla değil KENDİ ortalamasıyla yarışır, zayıf çocuk da ilerler.

   Kural: her çocuğun bir yumurtası var. Her gerçek seri (Skor Gir, Oyunlar, Ok Partisi — nereden girilirse) ısı verir:
     🔥 her seri +1 · 🎯 bütün oklar hedefte (M yok) +1 · ⭐ ok başına ortalaması KENDİ son 30 serisinin ortalamasını
     geçerse +2.  Yumurta 10'da çatlar, 22'de yavru çıkar, 40'ta büyür → albüme girer, çocuk yeni yumurta seçer.
   İlerleme SAKLANMAZ, HESAPLANIR: sporcunun serilerinden (seriler + kartGecmisi, yuva.basla sonrası) her açılışta
   yeniden hesaplanır → seri silme / geri alma / cihaz değişikliği kendiliğinden doğru. Saklanan tek şey seçimler:
   sp.oyun.yuva = { basla, sira: [{ no, renk, t }] } — sp.oyun gamification yoluyla sunucuya gider (coinDamga ile
   coinT ilerletilir, yoksa sunucu yazmayı reddeder). Hayvanlar KM_OYUN_KARAKTERLER'den (İzci/Tırmanıcı figürleri hariç).
   Kancalar: app.js _skorKaydetCekirdek → window.yuvaSeriSonrasi (çatladı/çıktı/büyüdü bildirimi).
   ================================================================================================ */
const YUVA_ESIK = { catla: 10, yavru: 22, buyu: 40 };
const YUVA_RENK = [
    { id: 'pembe', ana: '#FF8FB8', ben: '#FFD3E4' }, { id: 'mavi', ana: '#6EC6FF', ben: '#D2EEFF' }, { id: 'yesil', ana: '#7BD88F', ben: '#D7F5DD' },
    { id: 'mor', ana: '#B18CFF', ben: '#E6DAFF' }, { id: 'turuncu', ana: '#FFB067', ben: '#FFE3C7' }, { id: 'sari', ana: '#FFDA5C', ben: '#FFF3C2' },
];
const yuvaRenkBul = (id) => YUVA_RENK.find((r) => r.id === id) || YUVA_RENK[0];
function yuvaHayvanlar() { return (typeof KM_OYUN_KARAKTERLER !== 'undefined' ? KM_OYUN_KARAKTERLER : []).filter((k) => k.no <= 9 || k.no >= 13); }
function yuvaHayvan(no) { return yuvaHayvanlar().find((k) => k.no === no) || yuvaHayvanlar()[0]; }
function yuvaSp(g, ad) { return turnuvaDB[g] && turnuvaDB[g][ad]; }
function yuvaKayit(sp) { const o = sp && sp.oyun; return (o && o.yuva) || null; }
const yuvaDeger = (v) => v === 'X' ? 10 : v === 'M' ? 0 : (+v || 0);

// Sporcunun bütün serileri (güncel kart + geçmiş kartlar), zamana göre sıralı, tekrarsız.
function yuvaSeriler(sp) {
    const tum = [], gorulen = new Set();
    const ekle = (s) => { if (!s || !Array.isArray(s.oklar) || !s.oklar.length) return; const k = s.seriId || ((s.t || '') + '|' + s.oklar.join(',')); if (gorulen.has(k)) return; gorulen.add(k); tum.push(s); };
    (sp.kartGecmisi || []).forEach((k) => (k.seriler || []).forEach(ekle));
    (sp.seriler || []).forEach(ekle);
    const zaman = (s) => s.t || (s.tarih ? Date.parse(s.tarih + 'T12:00:00') : 0);
    return tum.sort((a, b) => zaman(a) - zaman(b)).map((s) => ({ ...s, _t: zaman(s) }));
}
// Bir serinin ısısı ve hangi kuralların tuttuğu. onceki = bu seriden önceki seriler (kişisel ortalama için).
function yuvaSeriIsi(s, onceki) {
    const n = s.oklar.length, ort = s.oklar.reduce((a, v) => a + yuvaDeger(v), 0) / n;
    const son = onceki.slice(-30); let p = 0, ok = 0; son.forEach((x) => { p += x.oklar.reduce((a, v) => a + yuvaDeger(v), 0); ok += x.oklar.length; });
    const kisisel = ok >= 6 ? p / ok : null;
    const hepsi = !s.oklar.some((v) => v === 'M'), gecti = kisisel !== null && ort > kisisel;
    return { isi: 1 + (hepsi ? 1 : 0) + (gecti ? 2 : 0), hepsi, gecti };
}
// Durum: haric = sondan kaç seri sayılmasın (bildirim için "önceki hal").
function yuvaDurum(g, ad, haric) {
    const sp = yuvaSp(g, ad), y = yuvaKayit(sp);
    if (!sp || !y) return { yok: true, toplam: 0, album: [], sira: [] };
    let seriler = yuvaSeriler(sp); if (haric) seriler = seriler.slice(0, Math.max(0, seriler.length - haric));
    // Her yumurta YALNIZ kendi penceresindeki serilerle ısınır: [seçildiği an, sonraki yumurtanın seçildiği an) — ilk
    // yumurta için pencere y.basla'dan (o günün başı) başlar. 40'ta durur, artan ısı sonraki yumurtaya TAŞINMAZ
    // (yoksa çok seri atmış çocuğun yeni yumurtası anında çatlıyordu — sürprizin tadı kaçıyordu).
    const sira = y.sira || [], isilar = sira.map(() => 0);
    let toplam = 0, bugunIsi = 0, bugunKural = { seri: 0, hepsi: 0, gecti: 0 }; const bugun = typeof bugunISO === 'function' ? bugunISO() : '';
    seriler.forEach((s, i) => {
        if (s._t < y.basla) return;
        const r = yuvaSeriIsi(s, seriler.slice(0, i)); toplam += r.isi;
        if (s.tarih === bugun) { bugunIsi += r.isi; bugunKural.seri++; if (r.hepsi) bugunKural.hepsi++; if (r.gecti) bugunKural.gecti++; }
        for (let e = sira.length - 1; e >= 0; e--) { const bas = e === 0 ? y.basla : sira[e].t; if (s._t >= bas) { isilar[e] += r.isi; break; } }
    });
    let tamam = 0; while (tamam < sira.length && isilar[tamam] >= YUVA_ESIK.buyu) tamam++;
    const album = sira.slice(0, tamam);
    const aktif = sira[tamam] || null, ilerleme = aktif ? Math.min(YUVA_ESIK.buyu, isilar[tamam]) : 0;
    const evre = !aktif ? -1 : ilerleme >= YUVA_ESIK.yavru ? 2 : ilerleme >= YUVA_ESIK.catla ? 1 : 0;
    return { toplam, album, aktif, ilerleme, evre, secimGerek: !aktif, tamam, bugunIsi, bugunKural, sira, adim: tamam * 4 + (evre + 1) };
}
function yuvaKaydet(sp) { try { if (typeof coinDamga === 'function') coinDamga(sp); else sp.lastModified = Date.now(); } catch (e) {} try { oyVeriKaydet(); } catch (e) {} }
function yuvaBaslat(g, ad) {
    const sp = yuvaSp(g, ad); if (!sp) return;
    const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {});
    if (!o.yuva) { const b = new Date(); b.setHours(0, 0, 0, 0); o.yuva = { basla: b.getTime(), sira: [] }; } // bugünün serileri de sayılır
    return o.yuva;
}
// Yeni yumurta: renk çocuğun seçimi; içindeki hayvan sürpriz — albümde olmayanlardan rastgele.
function yuvaYumurtaSec(g, ad, renk) {
    const sp = yuvaSp(g, ad); if (!sp) return; const y = yuvaBaslat(g, ad), d = yuvaDurum(g, ad);
    if (!d.secimGerek && y.sira.length) return;
    const sahip = new Set(y.sira.map((x) => x.no)); let aday = yuvaHayvanlar().filter((k) => !sahip.has(k.no)); if (!aday.length) aday = yuvaHayvanlar();
    y.sira.push({ no: aday[Math.floor(Math.random() * aday.length)].no, renk, t: Date.now() });
    yuvaKaydet(sp);
}

// ---------------- görseller ----------------
function yuvaYumurtaSVG(renkId, evre, boy) {
    const r = yuvaRenkBul(renkId), id = 'yg' + Math.random().toString(36).slice(2, 7);
    const catlak = evre >= 1 ? `<path d="M22 46 L31 40 L37 48 L45 41 L52 49 L60 42 L70 47" fill="none" stroke="#5A3A2A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>${evre >= 1 ? '<path d="M45 41 L47 33 M60 42 L63 35" stroke="#5A3A2A" stroke-width="2" stroke-linecap="round"/>' : ''}` : '';
    return `<svg viewBox="0 0 92 110" width="${boy}" height="${boy * 1.2}" aria-hidden="true"><defs><radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".35" stop-color="${r.ana}"/><stop offset="1" stop-color="${r.ana}" stop-opacity=".92"/></radialGradient></defs>
      <ellipse cx="46" cy="104" rx="30" ry="5" fill="rgba(0,0,0,.18)"/>
      <path d="M46 4 C70 4 86 44 86 68 C86 90 68 104 46 104 C24 104 6 90 6 68 C6 44 22 4 46 4 Z" fill="url(#${id})" stroke="rgba(0,0,0,.12)" stroke-width="2"/>
      <circle cx="30" cy="62" r="7" fill="${r.ben}"/><circle cx="60" cy="74" r="9" fill="${r.ben}"/><circle cx="52" cy="28" r="5" fill="${r.ben}"/><circle cx="24" cy="86" r="4" fill="${r.ben}"/>${catlak}</svg>`;
}
// Yavru: kabuğun alt yarısında, başı dışarıda. Büyük: tam boy, yıldızlı.
function yuvaYavruHTML(g, renkId, no, boy) {
    const r = yuvaRenkBul(renkId), h = yuvaHayvan(no);
    return `<div class="yv-yavru" style="width:${boy}px;height:${boy * 1.2}px"><img src="${h.src}" alt="${esc(h.ad)}" style="width:${boy * 0.86}px;height:${boy * 0.86}px">
      <svg viewBox="0 0 92 60" width="${boy}" height="${boy * 0.65}" class="yv-kabuk" aria-hidden="true"><path d="M8 4 L18 14 L28 4 L38 14 L48 4 L58 14 L68 4 L78 14 L86 6 C88 30 72 56 46 56 C20 56 4 30 8 4 Z" fill="${r.ana}" stroke="rgba(0,0,0,.14)" stroke-width="2"/><circle cx="26" cy="34" r="5" fill="${r.ben}"/><circle cx="62" cy="40" r="6" fill="${r.ben}"/></svg></div>`;
}
function yuvaGorselHTML(d, boy) {
    if (d.secimGerek) return `<div class="yv-bos" style="width:${boy}px;height:${boy * 1.2}px">❔</div>`;
    if (d.evre === 2) return yuvaYavruHTML('', d.aktif.renk, d.aktif.no, boy);
    return `<div class="yv-yumurta ${d.evre === 1 ? 'sallan' : 'nefes'}">${yuvaYumurtaSVG(d.aktif.renk, d.evre, boy)}</div>`;
}
const YUVA_EVRE_AD = ['Yumurta', 'Çatlıyor!', 'Yavru çıktı!'];

// ---------------- ekran ----------------
const YUVA_CSS = `
.yv{--zemin:#FFF6E6;--zemin2:#FFE9C7;--yazi:#4A2E1C;--soluk:#9A7458;--vurgu:#FF7A45;--ates:#FF5A1F;--cim:#7CC86E;
  --yvf-b:'Baloo 2','Trebuchet MS',system-ui,sans-serif;--yvf-g:'Nunito',system-ui,sans-serif;
  color:var(--yazi);font-family:var(--yvf-g);background:radial-gradient(900px 500px at 50% -20%,#FFFDF7,var(--zemin) 60%),var(--zemin);border-radius:22px;padding:18px;display:grid;gap:14px;position:relative;overflow:hidden}
.yv:fullscreen{border-radius:0;overflow:auto}
.yv button{font-family:inherit;cursor:pointer}.yv button:focus-visible{outline:3px solid var(--vurgu);outline-offset:2px}
.yv-ust{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between}
.yv-logo{font:800 32px/1 var(--yvf-b);display:flex;align-items:center;gap:10px}.yv-logo small{display:block;font:800 11.5px var(--yvf-g);letter-spacing:.14em;color:var(--soluk);text-transform:uppercase;margin-top:4px}
.yv-btn{border:0;border-radius:999px;padding:9px 16px;font:900 14px var(--yvf-g);background:#fff;color:var(--yazi);box-shadow:0 3px 0 rgba(74,46,28,.15),inset 0 0 0 2px rgba(74,46,28,.1)}
.yv-btn.birincil{background:var(--vurgu);color:#fff;box-shadow:0 5px 0 #C8501F}
.yv-kurallar{display:flex;flex-wrap:wrap;gap:8px}
.yv-kural{background:#fff;border-radius:16px;padding:8px 14px;font-weight:900;font-size:15px;box-shadow:inset 0 0 0 2px rgba(74,46,28,.08);display:flex;gap:8px;align-items:center}
.yv-kural b{font:800 20px var(--yvf-b);color:var(--ates)}
.yv-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px}
.yv-kart{position:relative;border:0;background:linear-gradient(#fff,#FFF9EE);border-radius:24px;padding:12px 10px 12px;display:flex;flex-direction:column;align-items:center;gap:6px;box-shadow:0 6px 0 rgba(74,46,28,.10),inset 0 0 0 2px rgba(74,46,28,.06);color:var(--yazi)}
.yv-kart:hover{transform:translateY(-2px)}
.yv-kart .yv-ad{font:800 18px/1.1 var(--yvf-b);text-align:center;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.yv-kart .yv-evre{font-weight:900;font-size:12.5px;color:var(--soluk)}
.yv-cubuk{width:100%;height:12px;border-radius:999px;background:#F3E3CC;overflow:hidden;position:relative}
.yv-cubuk i{position:absolute;inset:0 auto 0 0;border-radius:999px;background:linear-gradient(90deg,#FFB067,var(--ates));transition:width .6s ease}
.yv-cubuk span{position:absolute;top:0;bottom:0;width:2px;background:rgba(74,46,28,.25)}
.yv-alt{display:flex;justify-content:space-between;width:100%;font-weight:900;font-size:12.5px;font-variant-numeric:tabular-nums}
.yv-bugun{position:absolute;top:8px;right:8px;background:var(--ates);color:#fff;font:900 12px var(--yvf-g);border-radius:999px;padding:3px 8px}
.yv-yumurta.nefes svg{animation:yvNefes 2.6s ease-in-out infinite;transform-origin:50% 90%}
.yv-yumurta.sallan svg{animation:yvSallan 1.1s ease-in-out infinite;transform-origin:50% 90%}
@keyframes yvNefes{50%{transform:scale(1.03)}}
@keyframes yvSallan{0%,60%,100%{transform:rotate(0)}70%{transform:rotate(-7deg)}80%{transform:rotate(6deg)}90%{transform:rotate(-3deg)}}
.yv-yavru{position:relative;display:flex;justify-content:center}
.yv-yavru img{position:absolute;bottom:22%;object-fit:contain;animation:yvZipla 1.8s ease-in-out infinite;filter:drop-shadow(0 4px 4px rgba(0,0,0,.18))}
.yv-yavru .yv-kabuk{position:absolute;bottom:0;left:0}
@keyframes yvZipla{50%{transform:translateY(-6%)}}
.yv-bos{display:flex;align-items:center;justify-content:center;font-size:40px;border-radius:50% 50% 46% 46%;border:4px dashed #E8CFA8;color:#D2AE7C}
.yv-kart.yeni{animation:yvPatla .9s ease}
@keyframes yvPatla{20%{transform:scale(1.12) rotate(-3deg)}40%{transform:scale(.96) rotate(3deg)}60%{transform:scale(1.05)}}
.yv-katman{position:fixed;inset:0;z-index:9500;background:rgba(60,35,15,.45);display:flex;align-items:center;justify-content:center;padding:16px}
.yv-pencere{width:min(640px,100%);max-height:100%;overflow:auto;background:linear-gradient(#FFFDF8,#FFF3DE);border-radius:28px;padding:22px;box-shadow:0 30px 80px rgba(60,35,15,.35);display:grid;gap:14px;text-align:center;color:var(--yazi);animation:yvGel .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes yvGel{from{transform:scale(.75);opacity:0}}
.yv-pencere h2{margin:0;font:800 clamp(26px,5vw,38px)/1.05 var(--yvf-b)}.yv-pencere p{margin:0;font-weight:700;color:var(--soluk)}
.yv-buyuk{display:flex;justify-content:center;padding:6px 0}
.yv-secim{display:flex;justify-content:center;gap:clamp(8px,3vw,26px);flex-wrap:wrap}
.yv-secim button{border:0;background:transparent;border-radius:24px;padding:8px}
.yv-secim button:hover svg{animation:yvSallan 1s ease-in-out infinite;transform-origin:50% 90%}
.yv-album{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px}
.yv-album div{aspect-ratio:1;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 2px rgba(74,46,28,.06)}
.yv-album img{width:80%;height:80%;object-fit:contain}.yv-album .kapali img{filter:brightness(0) opacity(.12)}
.yv-satir{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.yv-satir div{background:#fff;border-radius:16px;padding:10px 6px;font-weight:900;font-size:13px}.yv-satir b{display:block;font:800 26px var(--yvf-b);color:var(--ates)}
.yv-uc{position:fixed;left:50%;top:34%;transform:translate(-50%,-50%);z-index:9600;font:800 clamp(26px,5.5vw,48px) var(--yvf-b);color:#fff;text-shadow:0 4px 0 #C8501F,0 8px 24px rgba(0,0,0,.25);pointer-events:none;animation:yvUc 1.6s ease forwards;white-space:nowrap}
@keyframes yvUc{0%{transform:translate(-50%,-30%) scale(.6);opacity:0}20%{transform:translate(-50%,-50%) scale(1.08);opacity:1}80%{opacity:1}100%{transform:translate(-50%,-85%);opacity:0}}
@media (max-width:600px){.yv{padding:12px}.yv-logo{font-size:26px}.yv-izgara{grid-template-columns:repeat(2,minmax(0,1fr))}.yv-kural{font-size:13px}}
@media (prefers-reduced-motion:reduce){.yv *{animation:none!important;transition:none!important}}
`;
function yuvaKaynakYukle() {
    if (!document.getElementById('kp-font') && !document.getElementById('yv-font')) { const l = document.createElement('link'); l.id = 'yv-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;800&family=Nunito:wght@600;800;900&display=swap'; document.head.appendChild(l); }
    if (document.getElementById('yv-stil')) return;
    const st = document.createElement('style'); st.id = 'yv-stil'; st.textContent = YUVA_CSS; document.head.appendChild(st);
}
// Bu cihazda en son görülen adım — ekran açılınca ilerleyen kartlar "patlar".
function yuvaGorulenAl() { try { return JSON.parse(localStorage.getItem('dag_yuva_gorulen') || '{}'); } catch (e) { return {}; } }
function yuvaGorulenYaz(m) { try { localStorage.setItem('dag_yuva_gorulen', JSON.stringify(m)); } catch (e) {} }

function kmYuvaCiz() {
    yuvaKaynakYukle();
    const ic = document.getElementById('km-icerik'); if (!ic) return;
    const liste = (_kmListe || []).map((k, i) => ({ ...k, i })).filter((k) => yuvaSp(k.g, k.ad)); // i = _kmListe sırası (detay/seçim onu kullanır)
    const gorulen = yuvaGorulenAl(), yeniler = [];
    const kartlar = liste.map((k) => { const i = k.i;
        const d = yuvaDurum(k.g, k.ad), anahtar = k.g + '|' + k.ad;
        if (!d.yok && gorulen[anahtar] !== undefined && d.adim > gorulen[anahtar]) yeniler.push(i);
        if (!d.yok) gorulen[anahtar] = d.adim;
        const yuzde = d.aktif ? Math.round(d.ilerleme / YUVA_ESIK.buyu * 100) : 0;
        const evreYazi = d.yok || d.secimGerek ? '🥚 Yumurta seç!' : YUVA_EVRE_AD[d.evre];
        return `<button class="yv-kart" id="yv-kart-${i}" onclick="yuvaDetay(${i})">${d.bugunIsi ? `<span class="yv-bugun">🔥 +${d.bugunIsi}</span>` : ''}
          ${d.yok ? `<div class="yv-bos" style="width:84px;height:100px">🥚</div>` : yuvaGorselHTML(d, 84)}
          <div class="yv-ad">${esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad)}</div><div class="yv-evre">${evreYazi}</div>
          <div class="yv-cubuk"><i style="width:${yuzde}%"></i><span style="left:${YUVA_ESIK.catla / YUVA_ESIK.buyu * 100}%"></span><span style="left:${YUVA_ESIK.yavru / YUVA_ESIK.buyu * 100}%"></span></div>
          <div class="yv-alt"><span>🔥 ${d.aktif ? d.ilerleme : 0}/${YUVA_ESIK.buyu}</span><span>🐾 ${d.album ? d.album.length : 0}</span></div></button>`;
    }).join('');
    yuvaGorulenYaz(gorulen);
    ic.innerHTML = `<div class="yv" id="yv-kok">
      <div class="yv-ust"><div class="yv-logo">🥚<div>Yumurta Yuvası<small>Kendi rekorunu geç, yumurtan çatlasın</small></div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="yv-btn" onclick="yuvaNasil()">❓ Nasıl oynanır?</button><button class="yv-btn" onclick="yuvaTamEkran()">🖥️ Tam ekran</button><button class="yv-btn" onclick="kmSekme('oyunlar')">← Oyunlar</button></div></div>
      <div class="yv-kurallar"><div class="yv-kural">🔥 Her seri <b>+1</b></div><div class="yv-kural">🎯 3 ok da hedefte <b>+1</b></div><div class="yv-kural">⭐ Kendi ortalamanı geç <b>+2</b></div></div>
      ${liste.length ? `<div class="yv-izgara">${kartlar}</div>` : '<p style="font-weight:800">Bu derste sporcu yok. Önce derse sporcu ekle.</p>'}
      <p style="margin:0;font-weight:700;color:var(--soluk);font-size:13px">Seriler nereden girilirse girilsin (Skor Gir, Oyunlar, Ok Partisi) yumurtayı ısıtır. Kartına dokun: yumurtanı seç, albümünü gör.</p></div>`;
    yeniler.forEach((i, j) => setTimeout(() => { const el = document.getElementById('yv-kart-' + i); if (el) { el.classList.add('yeni'); yuvaSes(880 + j * 60); } }, 300 + j * 350));
    if (yeniler.length) yuvaUcan(yeniler.length > 1 ? '🐣 Yumurtalar ısındı!' : '🐣 Yumurta ilerledi!');
}
function yuvaTamEkran() { const el = document.getElementById('yv-kok'); if (!el) return; if (document.fullscreenElement) { document.exitFullscreen(); return; } const f = el.requestFullscreen || el.webkitRequestFullscreen; if (f) { const r = f.call(el); if (r && r.catch) r.catch(() => {}); } }
function yuvaPencere(html) { const kok = document.getElementById('yv-kok') || document.body, k = document.createElement('div'); k.className = 'yv-katman'; k.innerHTML = `<div class="yv-pencere">${html}</div>`; k.addEventListener('click', (e) => { if (e.target === k) k.remove(); }); kok.appendChild(k); return k; }
let _yvSes = null; function yuvaSes(f = 700, d = 0.12) { try { _yvSes = _yvSes || new (window.AudioContext || window.webkitAudioContext)(); const o = _yvSes.createOscillator(), g = _yvSes.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.1, _yvSes.currentTime); g.gain.exponentialRampToValueAtTime(0.001, _yvSes.currentTime + d); o.connect(g).connect(_yvSes.destination); o.start(); o.stop(_yvSes.currentTime + d); } catch (e) {} }
function yuvaUcan(m) { const kok = document.getElementById('yv-kok'); if (!kok) return; const e = document.createElement('div'); e.className = 'yv-uc'; e.textContent = m; kok.appendChild(e); setTimeout(() => e.remove(), 1600); }
function yuvaNasil() {
    const k = yuvaPencere(`<h2>🥚 Nasıl oynanır?</h2>
      <div class="yv-buyuk">${yuvaYumurtaSVG('pembe', 0, 70)}${yuvaYumurtaSVG('mavi', 1, 70)}${yuvaYavruHTML('', 'yesil', 18, 70)}</div>
      <p style="font:800 19px var(--yvf-b);color:var(--yazi)">Ok attıkça yumurtan ısınır. Çatlar, içinden bir yavru çıkar, yavru büyüyünce albümüne girer!</p>
      <div class="yv-kurallar" style="justify-content:center"><div class="yv-kural">🔥 Her seri <b>+1</b></div><div class="yv-kural">🎯 3 ok da hedefte <b>+1</b></div><div class="yv-kural">⭐ Kendi ortalamanı geç <b>+2</b></div></div>
      <p>Başkasıyla değil, kendinle yarışırsın. Dünkü halini geçersen yumurtan daha hızlı ısınır. Albümde toplanacak ${yuvaHayvanlar().length} hayvan var!</p>
      <div><button class="yv-btn birincil" data-kapat="1">Tamam!</button></div>`);
    k.querySelector('[data-kapat]').onclick = () => k.remove();
}
function yuvaDetay(i) {
    const k = (_kmListe || [])[i]; if (!k) return;
    const d = yuvaDurum(k.g, k.ad), ad = esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad);
    if (d.yok || d.secimGerek) return yuvaSecimAc(i);
    const sahip = new Set(d.album.map((a) => a.no));
    const album = yuvaHayvanlar().map((h) => `<div class="${sahip.has(h.no) ? '' : 'kapali'}" title="${sahip.has(h.no) ? esc(h.ad) : '?'}"><img src="${h.src}" alt=""></div>`).join('');
    const kalan = YUVA_ESIK[d.evre === 0 ? 'catla' : d.evre === 1 ? 'yavru' : 'buyu'] - d.ilerleme;
    const sonraki = d.evre === 0 ? 'çatlamasına' : d.evre === 1 ? 'yavru çıkmasına' : 'büyümesine';
    const p = yuvaPencere(`<h2>${ad}${d.evre === 2 ? ' · ' + esc(yuvaHayvan(d.aktif.no).ad) : ''}</h2>
      <div class="yv-buyuk">${yuvaGorselHTML(d, 130)}</div>
      <p style="font:800 20px var(--yvf-b);color:var(--yazi)">${YUVA_EVRE_AD[d.evre]} · ${sonraki} <span style="color:var(--ates)">🔥 ${kalan}</span> kaldı</p>
      <div class="yv-satir"><div><b>${d.bugunKural.seri}</b>bugün seri</div><div><b>${d.bugunKural.hepsi}</b>hepsi hedefte</div><div><b>${d.bugunKural.gecti}</b>rekorunu geçti</div></div>
      <p style="font:800 16px var(--yvf-b);color:var(--yazi)">🐾 Albüm · ${d.album.length}/${yuvaHayvanlar().length}</p>
      <div class="yv-album">${album}</div>
      <div><button class="yv-btn birincil" data-kapat="1">Kapat</button></div>`);
    p.querySelector('[data-kapat]').onclick = () => p.remove();
}
function yuvaSecimAc(i) {
    const k = (_kmListe || [])[i]; if (!k) return;
    const d = yuvaDurum(k.g, k.ad), ad = esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad);
    const uc = YUVA_RENK.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const yeniGelen = d.album && d.album.length ? yuvaHayvan(d.album[d.album.length - 1].no) : null;
    const p = yuvaPencere(`${yeniGelen ? `<div class="yv-buyuk"><img src="${yeniGelen.src}" alt="" style="width:120px;height:120px;object-fit:contain"></div><h2>🎉 ${esc(yeniGelen.ad)} büyüdü!</h2><p>Albümüne girdi. Şimdi yeni bir yumurta seç.</p>` : `<h2>${ad}, yumurtanı seç!</h2><p>İçinden hangi hayvan çıkacak? Sürpriz! 🤫</p>`}
      <div class="yv-secim">${uc.map((r) => `<button data-renk="${r.id}" aria-label="${r.id} yumurta">${yuvaYumurtaSVG(r.id, 0, 90)}</button>`).join('')}</div>`);
    p.querySelectorAll('[data-renk]').forEach((b) => b.onclick = () => { yuvaYumurtaSec(k.g, k.ad, b.dataset.renk); yuvaSes(990); p.remove(); kmYuvaCiz(); yuvaUcan('🥚 Yumurta yuvada!'); });
}
// Her gerçek seriden sonra (app.js _skorKaydetCekirdek): evre değiştiyse kutla.
function yuvaSeriSonrasi(g, ad) {
    const sp = yuvaSp(g, ad); if (!sp || !yuvaKayit(sp)) return;
    const once = yuvaDurum(g, ad, 1), simdi = yuvaDurum(g, ad);
    if (simdi.adim === once.adim) { if (_kmAktifSekme === 'yuva') kmYuvaCiz(); return; }
    const isim = typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : ad;
    let m = '';
    if (simdi.tamam > once.tamam) m = `🎉 ${isim}: ${yuvaHayvan(simdi.album[simdi.album.length - 1].no).ad} büyüdü, albüme girdi!`;
    else if (simdi.evre === 2) m = `🐣 ${isim}'in yumurtasından ${yuvaHayvan(simdi.aktif.no).ad} çıktı!`;
    else if (simdi.evre === 1) m = `🥚 ${isim}'in yumurtası çatlıyor!`;
    if (m) { try { showToast(m, 'success'); } catch (e) {} yuvaSes(1046, 0.18); }
    if (_kmAktifSekme === 'yuva') kmYuvaCiz();
}
window.yuvaSeriSonrasi = yuvaSeriSonrasi;
