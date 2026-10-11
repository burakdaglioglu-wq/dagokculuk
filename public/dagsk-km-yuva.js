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
// Eşikler (2026-10-11 v237: 10/22/40 → çok uzun bulundu). 10+ yaş temel 8/18/30; küçükler daha çabuk:
// 8-9 yaş ×0.8 (6/14/24), 7 ve altı ×0.6 (5/11/18). Yaş bilinmiyorsa grup: minikler ×0.6, küçükler ×0.8.
const YUVA_ESIK_TEMEL = { catla: 8, yavru: 18, buyu: 30 };
function yuvaYasCarpan(sp, g) {
    let yas = null; try { if (typeof yasHesapla === 'function') yas = yasHesapla(sp); } catch (e) {}
    if (yas !== null && yas > 2 && yas < 80) return yas <= 7 ? 0.6 : yas <= 9 ? 0.8 : 1;
    return g === 'minikler' ? 0.6 : g === 'kucukler' ? 0.8 : 1;
}
function yuvaEsik(sp, g) { const c = yuvaYasCarpan(sp, g) * ((typeof kmOyunAyar === 'function' && kmOyunAyar().yuvaCarpan) || 1); /* ⚙️ Oyun Ayarları hız çarpanı */ return { catla: Math.round(YUVA_ESIK_TEMEL.catla * c), yavru: Math.round(YUVA_ESIK_TEMEL.yavru * c), buyu: Math.round(YUVA_ESIK_TEMEL.buyu * c), carpan: c }; }
const YUVA_ESIK = YUVA_ESIK_TEMEL; // (eski adla erişen kalmasın diye)
const YUVA_RENK = [
    { id: 'pembe', ana: '#FF8FB8', ben: '#FFD3E4' }, { id: 'mavi', ana: '#6EC6FF', ben: '#D2EEFF' }, { id: 'yesil', ana: '#7BD88F', ben: '#D7F5DD' },
    { id: 'mor', ana: '#B18CFF', ben: '#E6DAFF' }, { id: 'turuncu', ana: '#FFB067', ben: '#FFE3C7' }, { id: 'sari', ana: '#FFDA5C', ben: '#FFF3C2' },
];
// NADİR YUMURTALAR (2026-10-11, kullanıcı "geliştir" → "Nadir yumurtalar" seçti). Haklar da serilerden HESAPLANIR:
//   ⭐ Altın: yeni kişisel rekor seri (ok başına ortalaması önceki bütün serilerinden yüksek, en az 5 eski seri varken).
//   💎 Elmas: kendi ortalamasını ÜST ÜSTE 3 seri geçmek. (v239'a kadar 'gokkusagi' idi — kullanıcı istemedi; eski kayıtlar elmas sayılır.)
// Nadir yumurta daha hızlı ısınır (altın ×1.5, elmas ×2) ve içinden PARLAK hayvan çıkar (albümde altın çerçeve).
const YUVA_NADIR = {
    altin: { id: 'altin', ana: '#F4B731', ben: '#FFF1B8', ad: 'Altın yumurta', ikon: '⭐', carpan: 1.5, nasil: 'Yeni rekor seri at' },
    elmas: { id: 'elmas', ana: '#7FD8F5', ben: '#FFFFFF', ad: 'Elmas yumurta', ikon: '💎', carpan: 2, nasil: 'Ortalamanı üst üste 3 kez geç' },
};
const yuvaNadirMi = (renk) => !!YUVA_NADIR[yuvaEskiRenk(renk)];
const yuvaEskiRenk = (id) => id === 'gokkusagi' ? 'elmas' : id;
const yuvaRenkBul = (id) => (id = yuvaEskiRenk(id), false) || YUVA_NADIR[id] || YUVA_RENK.find((r) => r.id === id) || YUVA_RENK[0];
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
    const E = yuvaEsik(sp, g);
    const sira = (y.sira || []).map((x) => x.renk === 'gokkusagi' ? { ...x, renk: 'elmas' } : x), isilar = sira.map(() => 0), kazanc = { altin: 0, elmas: 0 };
    let enIyiOrt = -1, oncekiSay = 0, zincir = 0;
    let toplam = 0, bugunIsi = 0, bugunKural = { seri: 0, hepsi: 0, gecti: 0 }; const bugun = typeof bugunISO === 'function' ? bugunISO() : '';
    seriler.forEach((s, i) => {
        const ort = s.oklar.reduce((a, v) => a + yuvaDeger(v), 0) / s.oklar.length;
        const rekor = oncekiSay >= 5 && ort > enIyiOrt;
        enIyiOrt = Math.max(enIyiOrt, ort); oncekiSay++;
        if (s._t < y.basla) return;
        const r = yuvaSeriIsi(s, seriler.slice(0, i)); toplam += r.isi;
        if (rekor) kazanc.altin++;
        if (r.gecti) { zincir++; if (zincir >= 3) { kazanc.elmas++; zincir = 0; } } else zincir = 0;
        if (s.tarih === bugun) { bugunIsi += r.isi; bugunKural.seri++; if (r.hepsi) bugunKural.hepsi++; if (r.gecti) bugunKural.gecti++; }
        for (let e = sira.length - 1; e >= 0; e--) { const bas = e === 0 ? y.basla : sira[e].t; if (s._t >= bas) { isilar[e] += r.isi * ((YUVA_NADIR[sira[e].renk] || {}).carpan || 1); break; } }
    });
    let tamam = 0; while (tamam < sira.length && isilar[tamam] >= E.buyu) tamam++;
    const album = sira.slice(0, tamam);
    const aktif = sira[tamam] || null, ilerleme = aktif ? Math.floor(Math.min(E.buyu, isilar[tamam])) : 0;
    const kullanilan = (r) => sira.filter((x) => x.renk === r).length;
    const hak = { altin: Math.max(0, kazanc.altin - kullanilan('altin')), elmas: Math.max(0, kazanc.elmas - kullanilan('elmas')) };
    const evre = !aktif ? -1 : ilerleme >= E.yavru ? 2 : ilerleme >= E.catla ? 1 : 0;
    return { toplam, album, aktif, ilerleme, evre, secimGerek: !aktif, tamam, bugunIsi, bugunKural, sira, adim: tamam * 4 + (evre + 1), hak, zincir, esik: E };
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
    if (yuvaNadirMi(renk) && !(d.hak && d.hak[renk] > 0)) return;
    const ayniTur = y.sira.filter((x) => yuvaNadirMi(x.renk) === yuvaNadirMi(renk)), sahip = new Set(ayniTur.map((x) => x.no).concat(ayniTur.map((x) => x.ikiz).filter(Boolean)));
    let aday = yuvaHayvanlar().filter((k) => !sahip.has(k.no)); if (!aday.length) aday = yuvaHayvanlar();
    const no = aday[Math.floor(Math.random() * aday.length)].no, kalan = aday.filter((k) => k.no !== no);
    const ikiz = Math.random() < YUVA_IKIZ_OLASILIK && kalan.length ? kalan[Math.floor(Math.random() * kalan.length)].no : null;
    y.sira.push({ no, renk, t: Date.now(), ikiz, hediye: YUVA_HEDIYELER[Math.floor(Math.random() * YUVA_HEDIYELER.length)] });
    yuvaKaydet(sp);
}

// ---- SÜRPRİZLER (2026-10-11, kullanıcı: "sürprizler çok hoş oldu, yumurtaları geliştir")
// 👯 İkiz: yumurtaların ~%15'inden iki hayvan çıkar (ikincisi de albüme girer).
// 🔍 İpucu: yumurta çatlayınca içinden ses gelir — hayvanın yaşadığı yere göre tahmin ettirir.
// 🎁 Hediye: büyüyen hayvan bir hediye getirir; albümde hayvanın üstünde görünür.
const YUVA_IKIZ_OLASILIK = 0.15;
const YUVA_HEDIYELER = ['👑', '🎩', '🕶️', '🎀', '⭐', '🌸', '🏅', '🎈', '🍀', '🧢'];
const YUVA_IPUCU = {
    'Kaplumbağa': '🐢 Tık tık… çok yavaş bir şey kıpırdıyor!', 'Kurbağa': '💧 Vıraak! Islak bir ses geliyor…', 'Kirpi': '🍂 İçeriden dikenli bir hışırtı geliyor…',
    'Köpek': '🦴 Hav! Kuyruk sallama sesi mi o?', 'Ayı': '🍯 Bal kokusu geliyor…', 'Tembel Hayvan': '😴 Biri çok uykulu… esniyor!', 'Zürafa': '🌳 Bu yumurtada uzun bir şey var!',
    'Arı': '🌼 Vızzz… çiçek kokusu!', 'Penguen': '❄️ Yumurta buz gibi soğuk!', 'Zebra': '🦓 Çizgili bir şey görünüyor…', 'Ahtapot': '🌊 Dalga sesi… çok kollu bir şey!',
    'Yılan': '〰️ Tıss… kıvrılan bir ses!', 'Bukalemun': '🎨 Yumurtanın rengi değişiyor!', 'Bal Arısı': '🍯 Vızzz… bal kokusu!', 'Tilki': '🍂 Orman kokusu… kurnaz bir göz!',
    'Yunus': '🌊 Deniz sesi… neşeli bir ıslık!', 'Salyangoz': '🐌 İçeriden sümüklü bir iz…', 'Istakoz': '🦞 Çıt çıt… kıskaç sesi!', 'Balon Balığı': '🎈 Yumurta şişiyor gibi!',
    'Kedi': '🐾 Miyav… tırmalama sesi!', 'Deniz Kaplumbağası': '🏖️ Kum ve deniz kokusu…', 'Timsah': '🐊 Şap şap… büyük dişler!', 'Yeşil Timsah': '🌿 Bataklık kokusu… şap!',
};
function yuvaIpucu(no) { const h = yuvaHayvan(no); return YUVA_IPUCU[h.ad] || '👂 İçeriden bir ses geliyor…'; }
// Albümdeki bütün hayvanlar (ikizler dahil): { no, renk, hediye }
function yuvaAlbumHayvanlar(album) { const l = []; (album || []).forEach((a) => { l.push({ no: a.no, renk: a.renk, hediye: a.hediye }); if (a.ikiz) l.push({ no: a.ikiz, renk: a.renk, hediye: a.hediye }); }); return l; }

// ---------------- görseller ----------------
function yuvaYumurtaSVG(renkId, evre, boy) {
    const r = yuvaRenkBul(renkId), id = 'yg' + Math.random().toString(36).slice(2, 7);
    renkId = yuvaEskiRenk(renkId);
    const grad = renkId === 'elmas'
        ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".3" stop-color="#BDEFFF"/><stop offset=".55" stop-color="#7FD8F5"/><stop offset=".8" stop-color="#D9F6FF"/><stop offset="1" stop-color="#5BC4EA"/></linearGradient>`
        : `<radialGradient id="${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".35" stop-color="${r.ana}"/><stop offset="1" stop-color="${renkId === 'altin' ? '#C98A0B' : r.ana}" stop-opacity=".92"/></radialGradient>`;
    const yildiz = yuvaNadirMi(renkId) ? '<g class="yv-pirilti"><path d="M20 30 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" fill="#fff"/><path d="M70 22 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="#fff"/><path d="M74 80 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="#fff"/></g>' : '';
    const catlak = evre >= 1 ? `<path d="M22 46 L31 40 L37 48 L45 41 L52 49 L60 42 L70 47" fill="none" stroke="#5A3A2A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>${evre >= 1 ? '<path d="M45 41 L47 33 M60 42 L63 35" stroke="#5A3A2A" stroke-width="2" stroke-linecap="round"/>' : ''}` : '';
    return `<svg viewBox="0 0 92 110" width="${boy}" height="${boy * 1.2}" aria-hidden="true"${yuvaNadirMi(renkId) ? ' class="yv-nadir-svg"' : ''}><defs>${grad}</defs>
      <ellipse cx="46" cy="104" rx="30" ry="5" fill="rgba(0,0,0,.18)"/>
      <path d="M46 4 C70 4 86 44 86 68 C86 90 68 104 46 104 C24 104 6 90 6 68 C6 44 22 4 46 4 Z" fill="url(#${id})" stroke="rgba(0,0,0,.12)" stroke-width="2"/>
      <circle cx="30" cy="62" r="7" fill="${r.ben}"/><circle cx="60" cy="74" r="9" fill="${r.ben}"/><circle cx="52" cy="28" r="5" fill="${r.ben}"/><circle cx="24" cy="86" r="4" fill="${r.ben}"/>${yildiz}${catlak}</svg>`;
}
// Yavru: kabuğun alt yarısında, başı dışarıda. Büyük: tam boy, yıldızlı.
function yuvaYavruHTML(g, renkId, no, boy, ikizNo) {
    const r = yuvaRenkBul(renkId), h = yuvaHayvan(no), h2 = ikizNo ? yuvaHayvan(ikizNo) : null;
    return `<div class="yv-yavru${yuvaNadirMi(renkId) ? ' parlak' : ''}${h2 ? ' ikiz' : ''}" style="width:${boy}px;height:${boy * 1.2}px"><img src="${h.src}" alt="${esc(h.ad)}" style="width:${boy * (h2 ? 0.62 : 0.86)}px;height:${boy * (h2 ? 0.62 : 0.86)}px">${h2 ? `<img class="yv-ikiz2" src="${h2.src}" alt="${esc(h2.ad)}" style="width:${boy * 0.6}px;height:${boy * 0.6}px">` : ''}
      <svg viewBox="0 0 92 60" width="${boy}" height="${boy * 0.65}" class="yv-kabuk" aria-hidden="true"><path d="M8 4 L18 14 L28 4 L38 14 L48 4 L58 14 L68 4 L78 14 L86 6 C88 30 72 56 46 56 C20 56 4 30 8 4 Z" fill="${r.ana}" stroke="rgba(0,0,0,.14)" stroke-width="2"/><circle cx="26" cy="34" r="5" fill="${r.ben}"/><circle cx="62" cy="40" r="6" fill="${r.ben}"/></svg></div>`;
}
function yuvaGorselHTML(d, boy) {
    if (d.secimGerek) return `<div class="yv-bos" style="width:${boy}px;height:${boy * 1.2}px">❔</div>`;
    if (d.evre === 2) return yuvaYavruHTML('', d.aktif.renk, d.aktif.no, boy, d.aktif.ikiz);
    return `<div class="yv-yumurta${yuvaNadirMi(d.aktif.renk) ? ' nadir' : ''} ${d.evre === 1 ? 'sallan' : 'nefes'}">${yuvaYumurtaSVG(d.aktif.renk, d.evre, boy)}</div>`;
}
const YUVA_EVRE_AD = ['Yumurta', 'Çatlıyor!', 'Yavru çıktı!'];
function yuvaHakCipHTML(hak) { return Object.keys(YUVA_NADIR).filter((k) => hak && hak[k] > 0).map((k) => `<span class="yv-hak ${k}">${YUVA_NADIR[k].ikon}${hak[k] > 1 ? '×' + hak[k] : ''}</span>`).join(''); }

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
.yv-nadir-svg{filter:drop-shadow(0 0 10px rgba(255,200,60,.75))}
.yv-yumurta.nadir svg{filter:drop-shadow(0 0 12px rgba(255,200,60,.8))}
.yv-pirilti{animation:yvPirilti 1.6s ease-in-out infinite;transform-origin:50% 50%}
@keyframes yvPirilti{50%{opacity:.25}}
.yv-yavru.parlak img,.yv-parlak img{filter:drop-shadow(0 0 6px #FFD54A) drop-shadow(0 0 14px rgba(255,200,60,.8)) saturate(1.25)}
.yv-yavru.parlak::after,.yv-parlak::after{content:'✨';position:absolute;top:-4px;right:-2px;font-size:22px;animation:yvPirilti 1.4s infinite}
.yv-parlak{position:relative;display:inline-flex}
.yv-hak{display:inline-flex;align-items:center;gap:2px;border-radius:999px;padding:2px 7px;font:900 12px var(--yvf-g);background:linear-gradient(135deg,#FFE27A,#F4B731);color:#5A3A00;box-shadow:0 2px 0 rgba(0,0,0,.12)}
.yv-hak.elmas{background:linear-gradient(135deg,#E6FAFF,#7FD8F5);color:#0B4A63}
.yv-haklar{position:absolute;top:8px;left:8px;display:flex;gap:4px}
.yv-album .parlak{background:radial-gradient(circle,#FFF6CF,#fff);box-shadow:inset 0 0 0 3px #F4B731,0 0 12px rgba(244,183,49,.45)}
.yv-album .parlak img{filter:drop-shadow(0 0 4px #FFD54A) saturate(1.25)}
.yv-secim .yv-nadir-etk{display:block;font:900 12px var(--yvf-g);color:#8A5A00;margin-top:2px}
.yv-kural.nadir{background:linear-gradient(135deg,#FFF6D6,#FFF)}
.yv-ped-kutu{background:#fff;border-radius:22px;padding:14px;display:grid;gap:10px;box-shadow:inset 0 0 0 2px rgba(255,122,69,.25)}
.yv-ped-baslik{font:800 19px var(--yvf-b);color:var(--ates)}
.yv-slotlar{display:flex;gap:8px;justify-content:center}
.yv-slotlar span{width:52px;height:52px;border-radius:14px;border:3px dashed #E8CFA8;display:flex;align-items:center;justify-content:center;font:800 24px var(--yvf-b)}
.yv-ped{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;max-width:420px;width:100%;margin:0 auto}
.yv-ped button{border:0;border-radius:12px;padding:12px 0;font:800 20px var(--yvf-b);box-shadow:inset 0 -4px 0 rgba(0,0,0,.2)}
.yv-ped button:disabled{opacity:.4;cursor:not-allowed}
.yv .yv-btn:disabled{opacity:.45;cursor:not-allowed}
.yv-sahne{position:fixed;inset:0;z-index:99999;background:radial-gradient(circle at 50% 45%,rgba(255,236,190,.97),rgba(255,176,103,.93) 60%,rgba(200,80,31,.92));display:flex;align-items:center;justify-content:center;cursor:pointer;animation:yvSahneGel .25s ease}
.yv-sahne.kapan{animation:yvSahneGit .3s ease forwards}
@keyframes yvSahneGel{from{opacity:0}}@keyframes yvSahneGit{to{opacity:0}}
.yv-sahne-ic{position:relative;width:260px;height:300px;display:flex;align-items:center;justify-content:center}
.yv-sahne-yazi{position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:18px;white-space:nowrap;font:800 clamp(30px,7vw,54px)/1 'Baloo 2',system-ui,sans-serif;color:#fff;text-shadow:0 4px 0 #C8501F,0 10px 30px rgba(120,40,0,.35);opacity:0;animation:yvYaziGel .5s 1.15s cubic-bezier(.2,1.6,.4,1) forwards}
.yv-sahne-isim{position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:10px;white-space:nowrap;font:800 28px 'Baloo 2',system-ui,sans-serif;color:#7A3A10}
@keyframes yvYaziGel{from{opacity:0;transform:translateX(-50%) scale(.4)}to{opacity:1;transform:translateX(-50%) scale(1)}}
.yv-kirik{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;animation:yvTitre .12s linear 8}
.yv-kirik.ust{clip-path:polygon(0 0,100% 0,100% 44%,88% 40%,76% 46%,64% 39%,52% 46%,40% 38%,30% 45%,18% 39%,0 44%)}
.yv-kirik.alt{clip-path:polygon(0 44%,18% 39%,30% 45%,40% 38%,52% 46%,64% 39%,76% 46%,88% 40%,100% 44%,100% 100%,0 100%)}
.yv-sahne.yv-s-yavru .yv-kirik.ust{animation:yvTitre .12s linear 8,yvUstUc .7s 1s cubic-bezier(.3,.6,.4,1) forwards}
.yv-sahne.yv-s-yavru .yv-kirik.alt{animation:yvTitre .12s linear 8,yvAltDus .7s 1s ease-in forwards}
.yv-sahne.yv-s-catla .yv-kirik{animation:yvTitre .12s linear 8,yvSallanBuyuk 1s 1s ease-in-out 2}
@keyframes yvTitre{25%{transform:translateX(-4px) rotate(-3deg)}75%{transform:translateX(4px) rotate(3deg)}}
@keyframes yvSallanBuyuk{25%{transform:rotate(-9deg)}75%{transform:rotate(9deg)}}
@keyframes yvUstUc{to{transform:translate(-90px,-170px) rotate(-55deg);opacity:0}}
@keyframes yvAltDus{to{transform:translate(40px,140px) rotate(25deg);opacity:0}}
.yv-catlak-ciz{position:absolute;stroke-dasharray:1;stroke-dashoffset:1;animation:yvCiz .35s 1s ease forwards}
.yv-catlak-ciz path{stroke-dasharray:1;stroke-dashoffset:1;animation:yvCiz .35s 1s ease forwards}
@keyframes yvCiz{to{stroke-dashoffset:0}}
.yv-firla{position:absolute;opacity:0;transform:scale(.2) translateY(60px);animation:yvFirla .7s 1.1s cubic-bezier(.2,1.7,.4,1) forwards}
.yv-sahne.yv-s-buyu .yv-firla{animation-delay:.15s}
.yv-firla img{width:220px;height:220px;object-fit:contain;filter:drop-shadow(0 10px 18px rgba(120,40,0,.35))}
@keyframes yvFirla{to{opacity:1;transform:scale(1) translateY(0)}}
.yv-isinlar{position:absolute;width:520px;height:520px;left:50%;top:50%;margin:-260px 0 0 -260px;border-radius:50%;background:repeating-conic-gradient(rgba(255,255,255,.35) 0 10deg,transparent 10deg 22deg);opacity:0;animation:yvIsin .6s 1.05s ease forwards,yvDon 8s 1.05s linear infinite;pointer-events:none}
.yv-sahne.yv-s-catla .yv-isinlar{display:none}
@keyframes yvIsin{to{opacity:1}}@keyframes yvDon{to{transform:rotate(360deg)}}
.yv-yildiz{position:absolute;left:50%;top:50%;font-style:normal;font-size:26px;opacity:0;animation:yvYildiz 1s 1.1s ease-out forwards}
.yv-sahne.yv-s-catla .yv-yildiz{display:none}
@keyframes yvYildiz{0%{opacity:1;transform:translate(-50%,-50%) rotate(var(--a)) translateY(0)}100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--a)) translateY(calc(var(--d) * -1))}}
@media (prefers-reduced-motion:reduce){.yv-sahne *{animation-duration:.01s!important;animation-delay:0s!important}}
.yv-ipucu{font:800 12px var(--yvf-g);color:#7A4A1A;background:#FFF1D6;border-radius:10px;padding:4px 8px;text-align:center;line-height:1.25}
.yv-ipucu.buyuk{font:800 17px var(--yvf-b);padding:10px 14px;margin:0}.yv-ipucu.buyuk small{font:700 13px var(--yvf-g);color:var(--soluk)}
.yv-yavru.ikiz img{left:2%}.yv-yavru .yv-ikiz2{position:absolute;bottom:22%;right:0;left:auto!important;object-fit:contain;animation:yvZipla 1.8s .5s ease-in-out infinite}
.yv-album div{position:relative}.yv-hediye{position:absolute;top:-6px;right:-4px;font-style:normal;font-size:18px;filter:drop-shadow(0 2px 2px rgba(0,0,0,.2))}
.yv-hediye.buyuk{position:static;font-size:44px;align-self:flex-start}
.yv-firla.ikiz{display:flex;gap:0}.yv-firla.ikiz img{width:170px;height:170px}
.yv-sahne-yazi small{display:block;font:800 clamp(16px,3.4vw,24px)/1.2 'Nunito',system-ui,sans-serif;text-shadow:0 2px 0 #C8501F;margin-top:10px;white-space:normal;max-width:90vw}
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
        const yuzde = d.aktif ? Math.round(d.ilerleme / (d.esik || YUVA_ESIK).buyu * 100) : 0;
        const evreYazi = d.yok || d.secimGerek ? '🥚 Yumurta seç!' : YUVA_EVRE_AD[d.evre];
        return `<button class="yv-kart" id="yv-kart-${i}" onclick="yuvaDetay(${i})">${!d.yok && yuvaHakCipHTML(d.hak) ? `<span class="yv-haklar">${yuvaHakCipHTML(d.hak)}</span>` : ''}${d.bugunIsi ? `<span class="yv-bugun">🔥 +${d.bugunIsi}</span>` : ''}
          ${d.yok ? `<div class="yv-bos" style="width:84px;height:100px">🥚</div>` : yuvaGorselHTML(d, 84)}
          <div class="yv-ad">${esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad)}</div><div class="yv-evre">${evreYazi}${!d.yok && !d.secimGerek && d.evre === 2 && d.aktif.ikiz ? ' 👯 İkiz!' : ''}</div>${!d.yok && !d.secimGerek && d.evre === 1 ? `<div class="yv-ipucu">${esc(yuvaIpucu(d.aktif.no))}</div>` : ''}
          <div class="yv-cubuk"><i style="width:${yuzde}%"></i><span style="left:${(d.esik || YUVA_ESIK).catla / (d.esik || YUVA_ESIK).buyu * 100}%"></span><span style="left:${(d.esik || YUVA_ESIK).yavru / (d.esik || YUVA_ESIK).buyu * 100}%"></span></div>
          <div class="yv-alt"><span>🔥 ${d.aktif ? d.ilerleme : 0}/${(d.esik || YUVA_ESIK).buyu}</span><span>🐾 ${d.album ? yuvaAlbumHayvanlar(d.album).length : 0}</span></div></button>`;
    }).join('');
    yuvaGorulenYaz(gorulen);
    ic.innerHTML = `<div class="yv" id="yv-kok">
      <div class="yv-ust"><div class="yv-logo">🥚<div>Yumurta Yuvası<small>Kendi rekorunu geç, yumurtan çatlasın</small></div></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap"><button class="yv-btn" onclick="yuvaNasil()">❓ Nasıl oynanır?</button><button class="yv-btn" onclick="yuvaTamEkran()">🖥️ Tam ekran</button><button class="yv-btn" onclick="kmSekme('oyunlar')">← Oyunlar</button></div></div>
      <div class="yv-kurallar"><div class="yv-kural">🔥 Her seri <b>+1</b></div><div class="yv-kural">🎯 3 ok da hedefte <b>+1</b></div><div class="yv-kural">⭐ Kendi ortalamanı geç <b>+2</b></div><div class="yv-kural nadir">⭐ Rekor seri → <b style="font-size:16px">Altın yumurta</b></div><div class="yv-kural nadir">💎 Ortalamanı 3 kez üst üste geç → <b style="font-size:16px">Elmas yumurta</b></div></div>
      ${liste.length ? `<div class="yv-izgara">${kartlar}</div>` : '<p style="font-weight:800">Bu derste sporcu yok. Önce derse sporcu ekle.</p>'}
      <p style="margin:0;font-weight:700;color:var(--soluk);font-size:13px">👆 Kartına dokun → serini buradan gir, yumurtan ısınsın. Skor Gir, Oyunlar ya da Ok Partisi'nden girilen seriler de sayılır.</p></div>`;
    yeniler.forEach((i, j) => setTimeout(() => { const el = document.getElementById('yv-kart-' + i); if (el) { el.classList.add('yeni'); yuvaSes(880 + j * 60); } }, 300 + j * 350));
    if (yeniler.length) yuvaUcan(yeniler.length > 1 ? '🐣 Yumurtalar ısındı!' : '🐣 Yumurta ilerledi!');
}
function yuvaTamEkran() { const el = document.getElementById('yv-kok'); if (!el) return; if (document.fullscreenElement) { document.exitFullscreen(); return; } const f = el.requestFullscreen || el.webkitRequestFullscreen; if (f) { const r = f.call(el); if (r && r.catch) r.catch(() => {}); } }
function yuvaPencere(html) { document.querySelectorAll('.yv-katman').forEach((x) => x.remove()); /* aynı anda tek pencere */ const kok = document.getElementById('yv-kok') || document.body, k = document.createElement('div'); k.className = 'yv-katman'; k.innerHTML = `<div class="yv-pencere">${html}</div>`; k.addEventListener('click', (e) => { if (e.target === k) k.remove(); }); kok.appendChild(k); return k; }
let _yvSes = null; function yuvaSes(f = 700, d = 0.12) { try { _yvSes = _yvSes || new (window.AudioContext || window.webkitAudioContext)(); const o = _yvSes.createOscillator(), g = _yvSes.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.1, _yvSes.currentTime); g.gain.exponentialRampToValueAtTime(0.001, _yvSes.currentTime + d); o.connect(g).connect(_yvSes.destination); o.start(); o.stop(_yvSes.currentTime + d); } catch (e) {} }
function yuvaUcan(m) { const kok = document.getElementById('yv-kok'); if (!kok) return; const e = document.createElement('div'); e.className = 'yv-uc'; e.textContent = m; kok.appendChild(e); setTimeout(() => e.remove(), 1600); }
function yuvaNasil() {
    const k = yuvaPencere(`<h2>🥚 Nasıl oynanır?</h2>
      <div class="yv-buyuk">${yuvaYumurtaSVG('pembe', 0, 70)}${yuvaYumurtaSVG('mavi', 1, 70)}${yuvaYavruHTML('', 'yesil', 18, 70)}</div>
      <p style="font:800 19px var(--yvf-b);color:var(--yazi)">Ok attıkça yumurtan ısınır. Çatlar, içinden bir yavru çıkar, yavru büyüyünce albümüne girer!</p>
      <div class="yv-kurallar" style="justify-content:center"><div class="yv-kural">🔥 Her seri <b>+1</b></div><div class="yv-kural">🎯 3 ok da hedefte <b>+1</b></div><div class="yv-kural">⭐ Kendi ortalamanı geç <b>+2</b></div></div>
      <p style="font-weight:800;color:#8A5A00">✨ Nadir yumurtalar: ⭐ rekor seri atarsan <b>altın yumurta</b>, ortalamanı 3 kez üst üste geçersen 💎 <b>elmas yumurta</b> kazanırsın. Daha hızlı ısınır, içinden PARLAK hayvan çıkar!</p>
      <p style="font-weight:800">🎁 Sürprizler: bazen yumurtadan <b>ikiz</b> çıkar 👯, çatlayınca içinden <b>ipucu sesi</b> gelir 🔍, büyüyen hayvan sana <b>hediye</b> getirir 👑</p>
      <p style="font-size:13px">Küçükler daha çabuk: 7 yaş ve altında yumurta en hızlı, 10 yaş ve üstünde biraz daha geç çatlar.</p>
      <p>Başkasıyla değil, kendinle yarışırsın. Dünkü halini geçersen yumurtan daha hızlı ısınır. Albümde toplanacak ${yuvaHayvanlar().length} hayvan var!</p>
      <div><button class="yv-btn birincil" data-kapat="1">Tamam!</button></div>`);
    k.querySelector('[data-kapat]').onclick = () => k.remove();
}
function yuvaDetay(i) {
    const k = (_kmListe || [])[i]; if (!k) return;
    const d = yuvaDurum(k.g, k.ad), ad = esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad);
    if (d.yok || d.secimGerek) return yuvaSecimAc(i);
    const ah = yuvaAlbumHayvanlar(d.album), sahip = new Set(ah.map((a) => a.no)), parlak = new Set(ah.filter((a) => yuvaNadirMi(a.renk)).map((a) => a.no));
    const hediye = {}; ah.forEach((a) => { if (a.hediye && !hediye[a.no]) hediye[a.no] = a.hediye; });
    const album = yuvaHayvanlar().map((h) => `<div class="${parlak.has(h.no) ? 'parlak' : sahip.has(h.no) ? '' : 'kapali'}" title="${sahip.has(h.no) ? esc(h.ad) : '?'}"><img src="${h.src}" alt="">${hediye[h.no] ? `<em class="yv-hediye">${hediye[h.no]}</em>` : ''}</div>`).join('');
    const kalan = d.esik[d.evre === 0 ? 'catla' : d.evre === 1 ? 'yavru' : 'buyu'] - d.ilerleme;
    const sonraki = d.evre === 0 ? 'çatlamasına' : d.evre === 1 ? 'yavru çıkmasına' : 'büyümesine';
    const p = yuvaPencere(`<h2>${ad}${d.evre === 2 ? ' · ' + esc(yuvaHayvan(d.aktif.no).ad) : ''}</h2>
      <div class="yv-buyuk" id="yv-detay-gorsel">${yuvaGorselHTML(d, 130)}</div>
      <p style="font:800 20px var(--yvf-b);color:var(--yazi)">${YUVA_EVRE_AD[d.evre]}${d.evre === 2 && d.aktif.ikiz ? ' · 👯 İKİZ!' : ''} · ${sonraki} <span style="color:var(--ates)">🔥 ${kalan}</span> kaldı</p>
      ${d.evre === 1 ? `<p class="yv-ipucu buyuk">${esc(yuvaIpucu(d.aktif.no))}<br><small>Hangi hayvan olabilir? Tahmin et!</small></p>` : ''}
      ${yuvaPedHTML()}
      ${yuvaHakCipHTML(d.hak) ? `<p style="font:800 15px var(--yvf-g);color:#8A5A00">Kazandığın nadir yumurta: ${yuvaHakCipHTML(d.hak)} · bu yumurta büyüyünce seçebilirsin!</p>` : `<p style="font-size:13px">💎 Elmas yumurtaya ${3 - (d.zincir || 0)} seri kaldı (ortalamanı üst üste geç) · ⭐ Rekor seri atarsan altın yumurta!</p>`}
      <div class="yv-satir"><div><b>${d.bugunKural.seri}</b>bugün seri</div><div><b>${d.bugunKural.hepsi}</b>hepsi hedefte</div><div><b>${d.bugunKural.gecti}</b>rekorunu geçti</div></div>
      <p style="font:800 16px var(--yvf-b);color:var(--yazi)">🐾 Albüm · ${sahip.size}/${yuvaHayvanlar().length}${parlak.size ? ` · ✨ parlak ${parlak.size}` : ''}</p>
      <div class="yv-album">${album}</div>
      <div><button class="yv-btn birincil" data-kapat="1">Kapat</button></div>`);
    p.querySelector('[data-kapat]').onclick = () => p.remove();
    yuvaPedBagla(p, k, i);
}
// ---- KIRILMA ANİMASYONU (kullanıcı: "animasyon ile kırılabilir"). tip: 'catla' | 'yavru' | 'buyu'.
// Tam ekranda da görünsün diye fullscreenElement'e (yoksa body'ye) eklenir; dokununca ya da süre bitince kapanır.
function yuvaKirilma(tip, renk, no, isim, bitince, ikizNo, hediye) {
    const kok = document.fullscreenElement || document.body, h = yuvaHayvan(no), parlak = yuvaNadirMi(renk), h2 = ikizNo ? yuvaHayvan(ikizNo) : null;
    const yumurta = yuvaYumurtaSVG(renk, tip === 'catla' ? 0 : 1, 180);
    const adlar = h.ad.toLocaleUpperCase('tr-TR') + (h2 ? ' VE ' + h2.ad.toLocaleUpperCase('tr-TR') : '');
    const yazi = tip === 'catla' ? '🥚 ÇATLIYOR!' : tip === 'yavru' ? (h2 ? `👯 İKİZ! ${adlar} ÇIKTI!` : `🐣 ${parlak ? 'PARLAK ' : ''}${adlar} ÇIKTI!`) : `🎉 ${adlar} BÜYÜDÜ!`;
    const altYazi = tip === 'catla' ? yuvaIpucu(no) : tip === 'buyu' && hediye ? `🎁 Hediye getirdi: ${hediye}` : '';
    const e = document.createElement('div'); e.className = 'yv-sahne yv-s-' + tip;
    e.innerHTML = `<div class="yv-sahne-ic">
        <div class="yv-isinlar"></div>
        ${tip === 'buyu' ? '' : `<div class="yv-kirik ust">${yumurta}</div><div class="yv-kirik alt">${yumurta}</div>`}
        ${tip === 'catla' ? '<svg class="yv-catlak-ciz" viewBox="0 0 92 110" width="180" height="216"><path d="M22 46 L31 40 L37 48 L45 41 L52 49 L60 42 L70 47" fill="none" stroke="#5A3A2A" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/></svg>' : `<div class="yv-firla${parlak ? ' yv-parlak' : ''}${h2 ? ' ikiz' : ''}"><img src="${h.src}" alt="">${h2 ? `<img src="${h2.src}" alt="">` : ''}</div>`}
        <div class="yv-sahne-yazi">${esc(yazi)}${altYazi ? `<small>${esc(altYazi)}</small>` : ''}</div><div class="yv-sahne-isim">${esc(isim)}</div>
        ${Array.from({ length: 14 }, (_, j) => `<i class="yv-yildiz" style="--a:${j * 360 / 14}deg;--d:${120 + (j % 3) * 50}px">${['⭐', '✨', '💛'][j % 3]}</i>`).join('')}
      </div>`;
    kok.appendChild(e);
    [0, 140, 280].forEach((t, j) => setTimeout(() => yuvaSes(520 + j * 90, 0.06), t));
    setTimeout(() => { yuvaSes(tip === 'catla' ? 330 : 990, 0.18); setTimeout(() => yuvaSes(tip === 'catla' ? 440 : 1318, 0.25), 140); }, 1100);
    let kapandi = false; const kapat = () => { if (kapandi) return; kapandi = true; e.classList.add('kapan'); setTimeout(() => { e.remove(); if (bitince) bitince(); }, 300); };
    e.addEventListener('click', kapat); setTimeout(kapat, tip === 'catla' ? 2600 : 3600);
}
// ---- Skor pedi: 3 ok gir → gerçek seri (_skorKaydetCekirdek; limit dolarsa onayIste ile uzatma) → yumurta ısınır.
const YUVA_PED = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
const YUVA_PED_RENK = { X: '#FFD23F', '10': '#FFD23F', '9': '#FFD23F', '8': '#EF3B4A', '7': '#EF3B4A', '6': '#3D8BFF', '5': '#3D8BFF', '4': '#1E1B2E', '3': '#1E1B2E', '2': '#F2F0F7', '1': '#F2F0F7', M: '#8A8699' };
const yuvaPedYazi = (v) => ['X', '10', '9', '2', '1'].includes(v) ? '#2A1E00' : '#fff';
function yuvaPedHTML() {
    return `<div class="yv-ped-kutu"><div class="yv-ped-baslik">🏹 Serini gir, yumurtanı ısıt!</div>
      <div class="yv-slotlar" data-slotlar>${[0, 1, 2].map(() => '<span></span>').join('')}</div>
      <div class="yv-ped">${YUVA_PED.map((v) => `<button data-ok="${v}" style="background:${YUVA_PED_RENK[v]};color:${yuvaPedYazi(v)}">${v}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button class="yv-btn" data-sil="1">Son oku sil</button><button class="yv-btn birincil" data-kaydet="1" disabled>🔥 Kaydet</button></div></div>`;
}
function yuvaPedBagla(p, k, i) {
    const oklar = [], slot = p.querySelector('[data-slotlar]'), kaydet = p.querySelector('[data-kaydet]');
    const ciz = () => { slot.innerHTML = [0, 1, 2].map((j) => oklar[j] !== undefined ? `<span style="background:${YUVA_PED_RENK[oklar[j]]};color:${yuvaPedYazi(oklar[j])};border-style:solid">${oklar[j]}</span>` : '<span></span>').join(''); kaydet.disabled = oklar.length < 3; p.querySelectorAll('[data-ok]').forEach((b) => b.disabled = oklar.length >= 3); };
    p.querySelectorAll('[data-ok]').forEach((b) => b.onclick = () => { if (oklar.length >= 3) return; oklar.push(b.dataset.ok); yuvaSes(500 + yuvaDeger(b.dataset.ok) * 40, 0.05); ciz(); });
    p.querySelector('[data-sil]').onclick = () => { oklar.pop(); ciz(); };
    kaydet.onclick = () => {
        if (oklar.length < 3) return;
        const once = yuvaDurum(k.g, k.ad), kayit = oklar.map((v) => ({ puan: v }));
        window._yuvaPedKayitT = Date.now(); // kanca (yuvaSeriSonrasi) animasyonu ikinci kez oynatmasın
        let sonuc = _skorKaydetCekirdek(k.g, k.ad, kayit);
        const bitti = () => {
            if (!sonuc.ok) { showToast('Seri kaydedilemedi.', 'error'); return; }
            try { klasmanDoldur(); } catch (e) {}
            try { otomatikYoklamaIsaretle(k.ad, k.g); } catch (e) {}
            const simdi = yuvaDurum(k.g, k.ad), kazanc = simdi.toplam - once.toplam, isim = typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad;
            p.remove();
            if (simdi.adim !== once.adim && once.aktif) {
                const tip = simdi.tamam > once.tamam ? 'buyu' : simdi.evre === 2 ? 'yavru' : 'catla';
                setTimeout(() => yuvaKirilma(tip, once.aktif.renk, once.aktif.no, isim, () => yuvaDetay(i), once.aktif.ikiz, once.aktif.hediye), 150);
            } else setTimeout(() => { yuvaDetay(i); yuvaUcan(`🔥 +${kazanc}`); }, 120);
        };
        if (!sonuc.ok && sonuc.sebep === 'limit-doldu') {
            onayIste(esc(k.ad) + ' için günlük seri limiti (' + sonuc.limit + ') doldu.<br><br>Seriyi uzatıp bu skoru kaydedeyim mi?', () => {
                sonuc.grupData.devamModu = true; sonuc.grupData.lastModified = Date.now();
                try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
                try { if (typeof bulutaGonderKontrol === 'function') bulutaGonderKontrol(); } catch (e) {}
                sonuc = _skorKaydetCekirdek(k.g, k.ad, kayit); bitti();
            }, 'Devam Et');
            return;
        }
        bitti();
    };
    ciz();
}
function yuvaSecimAc(i) {
    const k = (_kmListe || [])[i]; if (!k) return;
    const d = yuvaDurum(k.g, k.ad), ad = esc(typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(k.ad) : k.ad);
    const uc = YUVA_RENK.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    const sonAlbum = d.album && d.album.length ? d.album[d.album.length - 1] : null, yeniGelen = sonAlbum ? yuvaHayvan(sonAlbum.no) : null, yeniParlak = sonAlbum && yuvaNadirMi(sonAlbum.renk), yeniIkiz = sonAlbum && sonAlbum.ikiz ? yuvaHayvan(sonAlbum.ikiz) : null;
    const nadirler = Object.keys(YUVA_NADIR).filter((k) => d.hak && d.hak[k] > 0);
    const p = yuvaPencere(`${yeniGelen ? `<div class="yv-buyuk"><span class="${yeniParlak ? 'yv-parlak' : ''}"><img src="${yeniGelen.src}" alt="" style="width:120px;height:120px;object-fit:contain"></span>${yeniIkiz ? `<span class="${yeniParlak ? 'yv-parlak' : ''}"><img src="${yeniIkiz.src}" alt="" style="width:110px;height:110px;object-fit:contain"></span>` : ''}${sonAlbum.hediye ? `<em class="yv-hediye buyuk">${sonAlbum.hediye}</em>` : ''}</div><h2>🎉 ${yeniParlak ? 'Parlak ' : ''}${esc(yeniGelen.ad)}${yeniIkiz ? ' ve ' + esc(yeniIkiz.ad) : ''} büyüdü!</h2><p>${sonAlbum.hediye ? `🎁 Sana bir hediye getirdi: <b style="font-size:22px">${sonAlbum.hediye}</b> · ` : ''}Albümüne girdi. Şimdi yeni bir yumurta seç.</p>` : `<h2>${ad}, yumurtanı seç!</h2><p>İçinden hangi hayvan çıkacak? Sürpriz! 🤫</p>`}
      ${nadirler.length ? '<p style="font:800 16px var(--yvf-b);color:#8A5A00">✨ Nadir yumurta hakkın var! İçinden PARLAK hayvan çıkar.</p>' : ''}<div class="yv-secim">${nadirler.map((k) => `<button data-renk="${k}" aria-label="${YUVA_NADIR[k].ad}">${yuvaYumurtaSVG(k, 0, 100)}<span class="yv-nadir-etk">${YUVA_NADIR[k].ikon} ${YUVA_NADIR[k].ad}</span></button>`).join('')}${uc.map((r) => `<button data-renk="${r.id}" aria-label="${r.id} yumurta">${yuvaYumurtaSVG(r.id, 0, 90)}</button>`).join('')}</div>`);
    p.querySelectorAll('[data-renk]').forEach((b) => b.onclick = () => { yuvaYumurtaSec(k.g, k.ad, b.dataset.renk); yuvaSes(990); p.remove(); kmYuvaCiz(); yuvaUcan('🥚 Yumurta yuvada!'); setTimeout(() => yuvaDetay(i), 700); });
}
// Her gerçek seriden sonra (app.js _skorKaydetCekirdek): evre değiştiyse kutla.
function yuvaSeriSonrasi(g, ad) {
    const sp = yuvaSp(g, ad); if (!sp || !yuvaKayit(sp)) return;
    const once = yuvaDurum(g, ad, 1), simdi = yuvaDurum(g, ad);
    const isim = typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : ad;
    Object.keys(YUVA_NADIR).forEach((k, j) => { if ((simdi.hak[k] || 0) > (once.hak[k] || 0)) setTimeout(() => { try { showToast(`${YUVA_NADIR[k].ikon} ${isim} ${YUVA_NADIR[k].ad.toLocaleLowerCase('tr-TR')} kazandı!`, 'success'); } catch (e) {} yuvaSes(1318, 0.2); }, 900 + j * 900); });
    if (simdi.adim === once.adim) { if (_kmAktifSekme === 'yuva') kmYuvaCiz(); return; }
    let m = '';
    if (simdi.tamam > once.tamam) { const sa = simdi.album[simdi.album.length - 1]; m = `🎉 ${isim}: ${yuvaNadirMi(sa.renk) ? '✨ parlak ' : ''}${yuvaHayvan(sa.no).ad} büyüdü, albüme girdi!`; }
    else if (simdi.evre === 2) m = simdi.aktif.ikiz ? `👯 İKİZ! ${isim}'in yumurtasından ${yuvaHayvan(simdi.aktif.no).ad} ve ${yuvaHayvan(simdi.aktif.ikiz).ad} çıktı!` : `🐣 ${isim}'in yumurtasından ${yuvaHayvan(simdi.aktif.no).ad} çıktı!`;
    else if (simdi.evre === 1) m = `🥚 ${isim}'in yumurtası çatlıyor!`;
    if (m) { try { showToast(m, 'success'); } catch (e) {} yuvaSes(1046, 0.18); }
    if (_kmAktifSekme === 'yuva' && !document.querySelector('.yv-katman,.yv-sahne') && once.aktif && !(Date.now() - (window._yuvaPedKayitT || 0) < 3000)) {
        const tip = simdi.tamam > once.tamam ? 'buyu' : simdi.evre === 2 ? 'yavru' : 'catla';
        setTimeout(() => yuvaKirilma(tip, once.aktif.renk, once.aktif.no, isim, null, once.aktif.ikiz, once.aktif.hediye), 250);
    }
    if (_kmAktifSekme === 'yuva') kmYuvaCiz();
}
window.yuvaSeriSonrasi = yuvaSeriSonrasi;
