/* ================================================================================================
   🪪 KİŞİ YÖNETİMİ (2026-09-28)
   Kullanıcı: "Çift Kayıt bölümünü geliştirmemiz lazım... sare yazdığımda sare isminde kimler kayıtlı onları
   göreyim, bir harfle yanlış yazmış olabilirim, düzeltebilmeli, veri kaybı olmadan birleştirmeliyim" +
   "biz eğitmenler kendimizi sporcu olarak gösterip atış yapıyoruz, eğitmenleri ayrı kategoride sırala, seçme
   imkânı ver" + "bazı sporcular günlük gelebiliyor, kim olduğunu yönetmemi sağla, misafir ileride aktif
   sporcum olabilir" + "yoklamada öğrenci gibi eğitmen yoklaması da olsun, derse hangi eğitmenler girdi".

   1) Kişi türü (öğrenci / eğitmen / misafir) — sporcu kaydının kendisine DOKUNMAZ; ayrı bir meta kaydında
      ("kisi_turleri", kayıt başına son yazan kazanır). Sporcu kaydı, serileri, aidatı aynen kalır.
   2) Çift Kayıt v2 — Türkçe harf/yazım hatası toleranslı arama, benzer isim önerileri, isim düzelt
      (sunucuda /rename = birleştirme yolu, veri kaybı yok), çoklu seçip tek onayla birleştir.
   3) Eğitmen & Misafir sekmesi — türleri yönet, misafir ekle/notla, misafiri öğrenciye çevir.
   4) Derse göre eğitmen yoklaması ("egitmen_ders_yoklama" meta kaydı) — personelDB eğitmenleri; derse
      girdi işaretlenince o günün personel girişine de yazılır (bordro sayımı bozulmasın).
   ================================================================================================ */

// ---------------------------------------------------------------- ortak: meta deposu (kayıt başına LWW)
function kyDepoOku(anahtar) { try { return JSON.parse(localStorage.getItem('dag_' + anahtar) || '{}') || {}; } catch (e) { return {}; } }
function kyDepoYazYerel(anahtar, v) { try { localStorage.setItem('dag_' + anahtar, JSON.stringify(v)); } catch (e) {} }
function kyDepoBirlestir(a, b) {
    let m = Object.assign({}, a || {});
    Object.keys(b || {}).forEach(k => { let x = b[k]; if (x && (!m[k] || (x.t || 0) > (m[k].t || 0))) m[k] = x; });
    return m;
}
// Sunucudakini çek, yerelle birleştir; yerelde daha yeni bir şey varsa geri yaz. Aynı anahtarın senkronları
// SIRAYLA çalışır (hızlı aç-kapa'da eski içerikli bir PUT'un yenisinin üstüne yazmaması için) ve her adım
// yereli o anki haliyle okur (yerelAl).
let _kySenkronZincir = {};
function kyDepoSenkron(anahtar, yerelAl, yazmaGerek, buda) {
    let al = typeof yerelAl === 'function' ? yerelAl : () => yerelAl;
    let adim = () => fetch('/api/meta/' + anahtar).then(r => r.json()).catch(() => null).then(d => {
        let uzak = {}; try { uzak = d && d.value ? JSON.parse(d.value) : {}; } catch (e) {}
        let tum = kyDepoBirlestir(uzak, al());
        if (buda) tum = buda(tum);
        kyDepoYazYerel(anahtar, tum);
        let fark = JSON.stringify(tum) !== JSON.stringify(uzak);
        if (d === null) { if (yazmaGerek || kyBekleyenler().includes(anahtar)) kyBekleyenEkle(anahtar); return tum; } // internet yok → sonra gönder
        if (fark || yazmaGerek) return fetch('/api/meta/' + anahtar, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: JSON.stringify(tum) }) })
            .then(r => { if (r && r.ok) kyBekleyenSil(anahtar); else kyBekleyenEkle(anahtar); }, () => kyBekleyenEkle(anahtar)).then(() => tum);
        kyBekleyenSil(anahtar);
        return tum;
    });
    let p = (_kySenkronZincir[anahtar] || Promise.resolve()).then(adim, adim);
    _kySenkronZincir[anahtar] = p.catch(() => {});
    return p;
}
// İnternetsiz yazılan meta kayıtları (2026-10-03, kullanıcı: "internet olmazsa nasıl çalışacak"): gönderilemeyen
// anahtarlar kalıcı bir listede tutulur; internet gelince ve uygulama açılınca sırayla gönderilir. Yerel veri zaten
// localStorage'da — kayıp yok, yalnız sunucuya geç gider.
function kyBekleyenler() { try { return JSON.parse(localStorage.getItem('dag_meta_bekleyen') || '[]'); } catch (e) { return []; } }
function kyBekleyenEkle(a) { let l = kyBekleyenler(); if (!l.includes(a)) { l.push(a); try { localStorage.setItem('dag_meta_bekleyen', JSON.stringify(l)); } catch (e) {} } }
function kyBekleyenSil(a) { let l = kyBekleyenler(), y = l.filter(x => x !== a); if (y.length !== l.length) try { localStorage.setItem('dag_meta_bekleyen', JSON.stringify(y)); } catch (e) {} }
function kyBekleyenGonder() {
    if (navigator.onLine === false) return;
    kyBekleyenler().forEach(a => kyDepoSenkron(a, () => kyDepoOku(a), true).catch(() => {}));
}
window.addEventListener('online', () => setTimeout(kyBekleyenGonder, 1500));
setTimeout(kyBekleyenGonder, 5000);

// ---------------------------------------------------------------- 1) kişi türü
let _kisiTur = kyDepoOku('kisi_turleri');
const KY_TUR = { sporcu: { ad: 'Öğrenci', ikon: '🎯', renk: '#94a3b8' }, egitmen: { ad: 'Eğitmen', ikon: '👔', renk: '#38bdf8' }, misafir: { ad: 'Misafir', ikon: '🎟️', renk: '#f472b6' } };
function kyAnahtar(g, ad) { return g + '|' + ad; }
// Kişisel notlar (misafir telefonu, not) AYRI ve oturumlu meta kaydında ("kisi_notlari" — sunucu okuma+yazma için
// giriş ister). Kişi türü kaydı PIN'siz Karışık Sınıf'ta da okunduğu için telefon/not ORAYA yazılmaz.
let _kisiNot = kyDepoOku('kisi_notlari');
const KY_NOT_ALANLARI = ['tel', 'not', 'takip'];
function kyOturumVar() { try { return typeof _oturumToken !== 'undefined' && !!_oturumToken; } catch (e) { return false; } }
function kisiBilgi(g, ad) {
    let k = kyAnahtar(g, ad), a = _kisiTur[k], b = _kisiNot[k];
    return a || b ? Object.assign({}, a || {}, b ? { tel: b.tel, not: b.not, takip: b.takip } : {}) : null;
}
function kisiTuru(g, ad) { let b = _kisiTur[kyAnahtar(g, ad)]; return b && KY_TUR[b.tur] ? b.tur : 'sporcu'; }
function kyNotSenkron(yaz) {
    if (!kyOturumVar()) return Promise.resolve(_kisiNot);
    return kyDepoSenkron('kisi_notlari', () => _kisiNot, yaz).then(t => { _kisiNot = kyDepoBirlestir(t, _kisiNot); return _kisiNot; }).catch(() => _kisiNot);
}
function kisiTurCek(sonra) {
    let once = JSON.stringify([_kisiTur, _kisiNot]);
    kyDepoSenkron('kisi_turleri', () => _kisiTur).then(t => { _kisiTur = kyDepoBirlestir(t, _kisiTur); return kyNotTasi(); }).then(() => kyNotSenkron(false))
        .then(() => { if (sonra && JSON.stringify([_kisiTur, _kisiNot]) !== once) sonra(); }).catch(() => {});
}
// Geçiş: kişi türü kaydında telefon/not kalmışsa (ilk sürüm) oturumlu not kaydına taşı ve türden sil.
function kyNotTasi() {
    if (!kyOturumVar()) return Promise.resolve();
    let simdi = Date.now(), tasindi = false;
    Object.keys(_kisiTur).forEach(k => {
        let e = _kisiTur[k]; if (!e || !KY_NOT_ALANLARI.some(f => e[f] !== undefined)) return;
        if (KY_NOT_ALANLARI.some(f => e[f])) _kisiNot[k] = Object.assign({}, _kisiNot[k] || {}, { tel: e.tel || '', not: e.not || '', t: simdi });
        let y = Object.assign({}, e); KY_NOT_ALANLARI.forEach(f => delete y[f]); y.t = simdi; _kisiTur[k] = y; tasindi = true;
    });
    if (!tasindi) return Promise.resolve();
    kyDepoYazYerel('kisi_turleri', _kisiTur); kyDepoYazYerel('kisi_notlari', _kisiNot);
    return kyNotSenkron(true).then(() => kyDepoSenkron('kisi_turleri', () => _kisiTur, true)).then(t => { _kisiTur = kyDepoBirlestir(t, _kisiTur); });
}
function kisiTurAyarla(g, ad, alanlar) {
    let k = kyAnahtar(g, ad), simdi = Date.now(), tur = {}, not = {};
    Object.keys(alanlar || {}).forEach(f => { (KY_NOT_ALANLARI.includes(f) ? not : tur)[f] = alanlar[f]; });
    if (Object.keys(not).length) {
        _kisiNot[k] = Object.assign({}, _kisiNot[k] || {}, not, { t: simdi });
        kyDepoYazYerel('kisi_notlari', _kisiNot); kyNotSenkron(true);
    }
    if (Object.keys(tur).length || !_kisiTur[k]) {
        _kisiTur[k] = Object.assign({}, _kisiTur[k] || { tur: 'sporcu' }, tur, { t: simdi });
        kyDepoYazYerel('kisi_turleri', _kisiTur);
        kyDepoSenkron('kisi_turleri', () => _kisiTur, true).then(t => { _kisiTur = kyDepoBirlestir(t, _kisiTur); });
    }
}
// Birleştirme / isim düzeltme sonrası türü ve notları yeni anahtara taşı (hedefin kendi türü varsa o kalır).
function kisiTurTasi(eG, eAd, yG, yAd) {
    if (eG === yG && eAd === yAd) return;
    let ek = kyAnahtar(eG, eAd), yk = kyAnahtar(yG, yAd), simdi = Date.now();
    let e = _kisiTur[ek];
    if (e) {
        let h = _kisiTur[yk];
        if (!h || h.tur === 'sporcu') _kisiTur[yk] = Object.assign({}, e, { t: simdi });
        _kisiTur[ek] = { tur: 'sporcu', t: simdi };
        kyDepoYazYerel('kisi_turleri', _kisiTur);
        kyDepoSenkron('kisi_turleri', () => _kisiTur, true).then(t => { _kisiTur = kyDepoBirlestir(t, _kisiTur); });
    }
    let n = _kisiNot[ek];
    if (n && (n.tel || n.not)) {
        let h = _kisiNot[yk] || {};
        _kisiNot[yk] = { tel: h.tel || n.tel || '', not: [h.not, n.not].filter(Boolean).join(' · '), t: simdi };
        _kisiNot[ek] = { tel: '', not: '', t: simdi };
        kyDepoYazYerel('kisi_notlari', _kisiNot); kyNotSenkron(true);
    }
}
function kyRozetHTML(g, ad) {
    let t = kisiTuru(g, ad); if (t === 'sporcu') return '';
    let r = KY_TUR[t];
    return ` <span style="display:inline-flex; align-items:center; gap:3px; margin-left:6px; padding:2px 8px; border-radius:999px; font-size:10px; font-weight:800; vertical-align:middle; color:${r.renk}; background:${r.renk}22; border:1px solid ${r.renk}66;">${r.ikon} ${r.ad}</span>`;
}
// Yönetici sporcu kartındaki "Kişi türü" seçici
function kyTurSeciciHTML(g, ad) {
    let t = kisiTuru(g, ad), a = kyKaydirKey(g, ad);
    return `<div style="margin-bottom:10px;"><div style="font-size:10px; color:var(--text-muted); margin-bottom:4px;">Kişi türü — eğitmen ve misafirler listelerde ayrı gösterilir, öğrenci sayılarına katılmaz</div>
        <div style="display:flex; gap:6px;">${Object.keys(KY_TUR).map(k => { let r = KY_TUR[k], s = k === t; return `<button type="button" onclick="kyTurDegistir('${a}','${k}', true)" class="adm-btn adm-btn-sm" style="flex:1; font-weight:800; ${s ? `background:${r.renk}26; color:${r.renk}; border-color:${r.renk};` : 'background:var(--bg-panel); color:var(--text-muted);'}">${r.ikon} ${r.ad}</button>`; }).join('')}</div></div>`;
}
function kyKaydirKey(g, ad) { return encodeURIComponent(g + '|' + ad).replace(/'/g, '%27'); }
function kyKeyCoz(key) { let [g, ...r] = decodeURIComponent(key).split('|'); return { g, ad: r.join('|') }; }
function kyTurDegistir(key, tur, yoneticiListe) {
    let k = kyKeyCoz(key);
    let ek = { tur };
    if (tur === 'misafir' && !(kisiBilgi(k.g, k.ad) || {}).eklenme) ek.eklenme = bugunISO();
    kisiTurAyarla(k.g, k.ad, ek);
    showToast(`${k.ad} → ${KY_TUR[tur].ikon} ${KY_TUR[tur].ad}`, 'success');
    if (yoneticiListe) { try { yoneticiPaneliCiz(); } catch (e) {} } else kyYenidenCiz();
}

// ---------------------------------------------------------------- yardımcılar: Türkçe katlama + yazım mesafesi
function kyKatla(s) {
    return String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/[âà]/g, 'a').replace(/[îì]/g, 'i').replace(/[ûù]/g, 'u')
        .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}
// Yazım mesafesi — iki komşu harfin yer değiştirmesi ("SAER" ↔ "SARE") TEK hata sayılır (en sık yazım
// hatası bu). sinir aşılınca erken çıkar.
function kyMesafe(a, b, sinir) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > sinir) return sinir + 1;
    let ikiOnce = null, onceki = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let sat = [i], enAz = i;
        for (let j = 1; j <= b.length; j++) {
            let v = Math.min(onceki[j] + 1, sat[j - 1] + 1, onceki[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
            if (ikiOnce && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, ikiOnce[j - 2] + 1);
            sat.push(v); if (v < enAz) enAz = v;
        }
        if (enAz > sinir) return sinir + 1;
        ikiOnce = onceki; onceki = sat;
    }
    return onceki[b.length];
}
function kyTumKisiler() {
    let out = [];
    ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach(g => Object.keys(turnuvaDB[g] || {}).forEach(ad => { let sp = turnuvaDB[g][ad]; if (sp && typeof sp === 'object') out.push({ g, ad, sp, k: kyKatla(ad) }); }));
    return out;
}
// Aramaya uygunluk puanı (küçük = daha iyi), uymuyorsa null. "sare" → SARE, SARE NUR, SERA?, ŞARE...
function kyAramaPuan(q, n) {
    if (!q) return 0;
    if (n.includes(q)) return n.startsWith(q) || n.includes(' ' + q) ? 0 : 1;
    let qt = q.split(' '), nt = n.split(' '), top = 0;
    for (let t of qt) {
        let en = 99;
        nt.forEach(x => { let sinir = t.length >= 6 ? 2 : t.length >= 3 ? 1 : 0; let d = x.startsWith(t) ? 0 : kyMesafe(t, x.slice(0, Math.max(t.length, Math.min(x.length, t.length + 1))), sinir); if (d > sinir) d = kyMesafe(t, x, sinir); if (d <= sinir && d < en) en = d; });
        if (en === 99) return null;
        top += en;
    }
    return 2 + top;
}
function kyGrupAd(g) { return (typeof LIG_ETIKET !== 'undefined' && LIG_ETIKET[g]) || { buyukler: 'Büyükler', yildizlar: 'Yıldızlar', kucukler: 'Küçükler', minikler: 'Minikler' }[g] || g; }
function kyGrupRenk(g) { return { buyukler: '#2563eb', yildizlar: '#f59e0b', kucukler: '#16a34a', minikler: '#8b5cf6' }[g] || '#64748b'; }
function kyIlkHarf(ad) { return String(ad || '?').trim().split(/\s+/).map(x => x[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR'); }
function kyTarih(iso) { return iso ? new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'; }
// Bir kaydın taşıdığı veri özeti — birleştirmede neyin taşınacağını göstermek için.
function kyOzet(g, ad) {
    let sp = (turnuvaDB[g] || {})[ad] || {};
    let yok = Object.keys(otomatikYoklamaDB || {}).filter(t => { let r = otomatikYoklamaDB[t][ad]; return r && (!r.grup || r.grup === g) && r.geldi !== false; }).sort();
    let aidat = (typeof aidatDB !== 'undefined' && aidatDB[ad]) ? Object.keys(aidatDB[ad]).length : 0;
    let seri = (sp.seriler || []).length + (sp.kartGecmisi || []).reduce((a, k) => a + ((k.seriler || []).length || 1), 0);
    let ders = (typeof _programSlotlar !== 'undefined' ? _programSlotlar : []).filter(s => (s.katilimcilar || []).some(x => x.grup === g && x.ad === ad)).length;
    return { sp, seri, yoklama: yok.length, ilk: yok[0] || null, son: yok[yok.length - 1] || null, aidat, ders, gunler: yok };
}

// ---------------------------------------------------------------- stil
function kyCss() {
    if (document.getElementById('ky-css')) return;
    let st = document.createElement('style'); st.id = 'ky-css';
    st.textContent = `
.ky { display:flex; flex-direction:column; gap:12px; color:var(--text-primary, var(--text-main)); }
.ky-baslik { font-size:18px; font-weight:900; }
.ky-alt { font-size:12px; color:var(--text-secondary, var(--text-muted)); line-height:1.5; }
.ky-kart { border:1px solid var(--border-color); border-radius:14px; background:var(--surface-1, var(--bg-panel)); padding:12px; display:flex; flex-direction:column; gap:10px; }
.ky-etiket { font-size:10.5px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:var(--text-secondary, var(--text-muted)); }
.ky-ara { width:100%; box-sizing:border-box; min-height:46px; padding:0 14px; border-radius:12px; border:1.5px solid var(--border-color); background:var(--surface-2, var(--bg-main)); color:var(--text-primary, var(--text-main)); font-size:15px; font-weight:600; }
.ky-ara:focus { outline:none; border-color:var(--accent, var(--accent-orange)); }
.ky-sekmeler { display:flex; gap:6px; padding:4px; border-radius:12px; background:var(--surface-2, var(--bg-main)); }
.ky-sekmeler button { flex:1; min-height:40px; border:none; border-radius:9px; background:none; color:var(--text-secondary, var(--text-muted)); font-weight:800; font-size:13px; cursor:pointer; }
.ky-sekmeler button.aktif { background:var(--surface-1, var(--bg-panel)); color:var(--text-primary, var(--text-main)); box-shadow:0 0 0 1.5px var(--accent, var(--accent-orange)); }
.ky-liste { display:flex; flex-direction:column; gap:8px; }
.ky-kisi { display:grid; grid-template-columns:auto auto minmax(0,1fr) auto; gap:10px; align-items:center; padding:10px 12px; border-radius:12px; background:var(--surface-2, var(--bg-main)); border:1.5px solid transparent; }
.ky-kisi.secili { border-color:var(--accent, var(--accent-orange)); background:color-mix(in srgb, var(--accent, #ff6200) 9%, var(--surface-2, #111)); }
.ky-kisi.hedef { border-color:var(--status-success, #16a34a); }
.ky-sec { width:24px; height:24px; border-radius:7px; border:2px solid var(--border-color); background:none; cursor:pointer; color:#fff; font-weight:900; font-size:14px; display:flex; align-items:center; justify-content:center; padding:0; }
.ky-kisi.secili .ky-sec { background:var(--accent, var(--accent-orange)); border-color:var(--accent, var(--accent-orange)); }
.ky-av { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13px; color:#fff; flex-shrink:0; overflow:hidden; }
.ky-av img { width:100%; height:100%; object-fit:cover; }
.ky-ad { font-size:14.5px; font-weight:900; word-break:break-word; }
.ky-ad mark { background:color-mix(in srgb, var(--accent, #ff6200) 30%, transparent); color:inherit; border-radius:3px; padding:0 1px; }
.ky-bilgi { font-size:11.5px; color:var(--text-secondary, var(--text-muted)); margin-top:2px; display:flex; flex-wrap:wrap; gap:4px 10px; }
.ky-bilgi b { color:var(--text-primary, var(--text-main)); }
.ky-cip { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:999px; font-size:10.5px; font-weight:800; border:1px solid var(--border-color); white-space:nowrap; }
.ky-btn { min-height:36px; padding:0 12px; border-radius:10px; border:1.5px solid var(--border-color); background:var(--surface-1, var(--bg-panel)); color:var(--text-primary, var(--text-main)); font-weight:800; font-size:12.5px; cursor:pointer; white-space:nowrap; }
.ky-btn.birincil { background:var(--accent, var(--accent-orange)); border-color:var(--accent, var(--accent-orange)); color:var(--text-on-accent-dark, #0b0f1c); }
.ky-btn.yesil { background:var(--status-success, #16a34a); border-color:var(--status-success, #16a34a); color:#fff; }
.ky-btn.tehlike { color:var(--status-danger, #dc2626); border-color:color-mix(in srgb, var(--status-danger, #dc2626) 50%, transparent); }
.ky-btn:disabled { opacity:.45; cursor:default; }
.ky-eylem { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
.ky-duz { grid-column:1 / -1; display:flex; gap:6px; flex-wrap:wrap; align-items:center; padding-top:4px; }
.ky-duz input, .ky-duz select, .ky-form input, .ky-form select, .ky-form textarea { min-height:40px; padding:0 12px; border-radius:10px; border:1.5px solid var(--border-color); background:var(--surface-1, var(--bg-panel)); color:var(--text-primary, var(--text-main)); font-size:14px; font-weight:700; box-sizing:border-box; }
.ky-duz input { flex:1; min-width:180px; text-transform:uppercase; }
.ky-panel { position:sticky; bottom:8px; z-index:5; border-radius:16px; padding:14px; display:flex; flex-direction:column; gap:10px; border:1.5px solid var(--accent, var(--accent-orange)); background:var(--surface-1, var(--bg-panel)); box-shadow:0 12px 32px rgba(0,0,0,.35); }
.ky-hedef-sec { display:flex; flex-direction:column; gap:6px; }
.ky-hedef-sec label { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:10px; background:var(--surface-2, var(--bg-main)); cursor:pointer; font-size:13px; }
.ky-hedef-sec input { width:18px; height:18px; accent-color:var(--status-success, #16a34a); appearance:auto !important; -webkit-appearance:radio !important; }
.ky-oneri { border:1px dashed var(--border-color); border-radius:12px; padding:10px; display:flex; flex-direction:column; gap:8px; }
.ky-oneri-bas { display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; }
.ky-form { display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:8px; }
.ky-form textarea { grid-column:1 / -1; min-height:60px; padding:10px 12px; font-weight:500; font-family:inherit; }
.ky-form input[name=ad] { text-transform:uppercase; }
.ky-gunler { display:flex; flex-wrap:wrap; gap:4px; }
.ky-gunler span { font-size:10.5px; font-weight:700; padding:2px 7px; border-radius:6px; background:color-mix(in srgb, var(--status-success, #16a34a) 15%, transparent); color:var(--status-success, #16a34a); }
.ky-bos { text-align:center; padding:22px 12px; color:var(--text-secondary, var(--text-muted)); font-size:13px; }
@media (max-width: 640px) { .ky-kisi { grid-template-columns:auto auto minmax(0,1fr); } .ky-eylem { grid-column:1 / -1; justify-content:flex-start; } }
`;
    document.head.appendChild(st);
}
function kyAvatar(g, ad, sp) {
    let foto = sp && sp.fotoUrl;
    return `<span class="ky-av" style="background:${kyGrupRenk(g)}">${foto ? `<img src="${esc(foto)}" alt="">` : esc(kyIlkHarf(ad))}</span>`;
}
function kyVurgula(ad, q) {
    if (!q) return esc(ad);
    let k = kyKatla(ad); let i = k.indexOf(q);
    // katlama harf sayısını korur (tek harf → tek harf); indeks eşleşiyorsa orijinalde işaretle
    if (i < 0 || k.length !== ad.length) return esc(ad);
    return esc(ad.slice(0, i)) + '<mark>' + esc(ad.slice(i, i + q.length)) + '</mark>' + esc(ad.slice(i + q.length));
}
function kyYenidenCiz() {
    let s = (typeof yoneticiSekmeAktif !== 'undefined') ? yoneticiSekmeAktif : '';
    if (s === 'ciftkayit') kyCiftKayitCiz(); else if (s === 'kisiler') kyKisilerCiz();
}

// ---------------------------------------------------------------- 2) Çift Kayıt v2
let _ky = { kopuk: null, notCekildi: false, ara: '', secili: [], hedef: null, duzenle: null, kisiSekme: 'egitmen', kisiAra: '', misafirForm: false, calisiyor: false };
function kyFarkliOku() { try { return new Set(JSON.parse(localStorage.getItem('dag_cift_farkli') || '[]')); } catch (e) { return new Set(); } }
function kyCiftAnahtar(a, b) { return [a, b].sort().join('~'); }
// Otomatik öneriler: aynı isim (harf/boşluk/Türkçe karakter farkı, ad-soyad yer değişimi) + 1-2 harf farkı.
// Kelime kelime benzerlik: her kelimede en fazla 1 harf farkı (4 harften kısa kelimede fark yok), toplam ≤2 —
// "SARE/SAER YILMAZ" benzer, ama "ALİ YILMAZ"/"ELİF YILMAZ" (kardeşler) benzer DEĞİL. Ayrıca ikinci ad eksikliği:
// "SARE YILMAZ" / "SARE NUR YILMAZ" (ilk ve son kelime aynı, kısanın tüm kelimeleri uzunda var).
function kyBenzerMi(a, b) {
    let ta = a.split(' '), tb = b.split(' ');
    if (ta.length !== tb.length) {
        let [k, u] = ta.length < tb.length ? [ta, tb] : [tb, ta];
        return k.length >= 2 && k[0] === u[0] && k[k.length - 1] === u[u.length - 1] && k.every(t => u.includes(t));
    }
    let top = 0;
    for (let i = 0; i < ta.length; i++) {
        let x = ta[i], y = tb[i];
        if (x === y) continue;
        if (Math.min(x.length, y.length) < 4 || /\d/.test(x + y)) return false;
        let d = kyMesafe(x, y, 1); if (d > 1) return false;
        top += d;
    }
    return top > 0 && top <= 2;
}
function kyOneriler() {
    let kisiler = kyTumKisiler(), farkli = kyFarkliOku(), n = kisiler.length;
    let ata = kisiler.map((_, i) => i), bul = i => ata[i] === i ? i : (ata[i] = bul(ata[i]));
    let tur = {};
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        let a = kisiler[i], b = kisiler[j];
        if (farkli.has(kyCiftAnahtar(kyAnahtar(a.g, a.ad), kyAnahtar(b.g, b.ad)))) continue;
        let tip = null;
        if (a.k === b.k) tip = 'ayni';
        else if (a.k.split(' ').sort().join(' ') === b.k.split(' ').sort().join(' ')) tip = 'ayni';
        else if (kyBenzerMi(a.k, b.k)) tip = 'benzer';
        if (tip) { let ra = bul(i), rb = bul(j); if (ra !== rb) ata[rb] = ra; tur[bul(i)] = (tur[bul(i)] === 'benzer' || tip === 'benzer') ? 'benzer' : 'ayni'; }
    }
    let kume = {};
    kisiler.forEach((x, i) => { let r = bul(i); (kume[r] = kume[r] || []).push(x); });
    let sonuc = Object.keys(kume).filter(r => kume[r].length > 1).map(r => ({ tip: tur[r] || 'benzer', liste: kume[r] }));
    let kisaAday = {};
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (i === j || bul(i) === bul(j)) continue;
        let a = kisiler[i], b = kisiler[j], at = a.k.split(' '), bt = b.k.split(' ');
        if (at.length >= bt.length || at[0] !== bt[0] || !at.every(t => bt.includes(t))) continue; // a, b'nin kısaltması mı
        if (farkli.has(kyCiftAnahtar(kyAnahtar(a.g, a.ad), kyAnahtar(b.g, b.ad)))) continue;
        (kisaAday[i] = kisaAday[i] || []).push(j);
    }
    Object.keys(kisaAday).forEach(i => {
        let l = kisaAday[i], a = kisiler[i];
        // Tek kelimelik isim ("Deniz") birden çok uzun isme uyuyorsa hangisi olduğu belirsiz — yine de her birini ayrı çift göster
        l.forEach(j => sonuc.push({ tip: 'kisa', liste: [a, kisiler[j]] }));
    });
    const sira = { ayni: 0, benzer: 1, kisa: 2 };
    return sonuc.sort((a, b) => sira[a.tip] - sira[b.tip] || a.liste[0].ad.localeCompare(b.liste[0].ad, 'tr'));
}
function kyKisiSatir(x, q, secilebilir) {
    let key = kyAnahtar(x.g, x.ad), kk = kyKaydirKey(x.g, x.ad), o = kyOzet(x.g, x.ad), sec = _ky.secili.includes(key), sp = x.sp || o.sp;
    let durum = sp.pasif ? '<span class="ky-cip" style="color:var(--status-danger,#dc2626)">pasif</span>' : sp.donduruldu ? '<span class="ky-cip" style="color:var(--status-warning,#d97706)">dondurulmuş</span>' : '';
    let duz = _ky.duzenle === key;
    return `<div class="ky-kisi${sec ? ' secili' : ''}${sec && _ky.hedef === key ? ' hedef' : ''}">
        ${secilebilir ? `<button class="ky-sec" onclick="kySec('${kk}')" aria-pressed="${sec}" aria-label="${esc(x.ad)} seç">${sec ? '✓' : ''}</button>` : '<span></span>'}
        ${kyAvatar(x.g, x.ad, sp)}
        <div style="min-width:0"><div class="ky-ad">${kyVurgula(x.ad, q)}${kyRozetHTML(x.g, x.ad)}</div>
            <div class="ky-bilgi"><span class="ky-cip" style="color:${kyGrupRenk(x.g)}; border-color:${kyGrupRenk(x.g)}66">${esc(kyGrupAd(x.g))}</span>${durum}
                <span><b>${o.seri}</b> seri</span><span><b>${o.yoklama}</b> yoklama günü</span>${o.aidat ? `<span><b>${o.aidat}</b> aidat ayı</span>` : ''}${o.ders ? `<span><b>${o.ders}</b> ders kaydı</span>` : ''}
                <span>son geliş: <b>${kyTarih(o.son)}</b></span>${sp.dogumYili ? `<span>${esc(String(sp.dogumTarihi || sp.dogumYili))}</span>` : ''}</div></div>
        <div class="ky-eylem"><button class="ky-btn" onclick="kyDuzenleAc('${kk}')">✏️ Adını düzelt</button></div>
        ${duz ? `<div class="ky-duz"><input id="ky-duz-ad" value="${esc(x.ad)}" aria-label="Yeni isim" onkeydown="if(event.key==='Enter') kyDuzenleKaydet('${kk}'); if(event.key==='Escape') kyDuzenleAc(null);">
            <button class="ky-btn yesil" onclick="kyDuzenleKaydet('${kk}')">💾 Kaydet</button><button class="ky-btn" onclick="kyDuzenleAc(null)">Vazgeç</button>
            <span class="ky-alt" style="flex-basis:100%">Seriler, yoklama, aidat ve ders kayıtları yeni isme taşınır — hiçbir veri kaybolmaz.</span></div>` : ''}
    </div>`;
}
function kyCiftKayitCiz() {
    kyCss();
    let alan = document.getElementById('yonetici-liste'); if (!alan) return;
    let q = kyKatla(_ky.ara);
    let tum = kyTumKisiler();
    _ky.secili = _ky.secili.filter(k => { let [g, ...r] = k.split('|'); return turnuvaDB[g] && turnuvaDB[g][r.join('|')]; });
    if (_ky.hedef && !_ky.secili.includes(_ky.hedef)) _ky.hedef = null;
    let sonuc = '';
    if (q) {
        let es = tum.map(x => Object.assign({ p: kyAramaPuan(q, x.k) }, x)).filter(x => x.p !== null).sort((a, b) => a.p - b.p || a.ad.localeCompare(b.ad, 'tr'));
        let tam = es.filter(x => x.p <= 1).length;
        sonuc = `<div class="ky-kart"><div class="ky-etiket">"${esc(_ky.ara)}" için ${es.length} kayıt${es.length > tam ? ` · ${es.length - tam} tanesi yazım farkıyla benzer` : ''}</div>
            <div class="ky-liste">${es.slice(0, 40).map(x => kyKisiSatir(x, q, true)).join('') || '<div class="ky-bos">Bu isimde ya da buna benzeyen kayıt yok.</div>'}</div>
            ${es.length >= 2 ? '<div class="ky-alt">Aynı kişiye ait kayıtları ☐ ile seç — altta birleştirme paneli açılır.</div>' : ''}</div>`;
    }
    let oneriler = kyOneriler();
    let oneriHTML = `<div class="ky-kart"><div class="ky-etiket">Şüpheli kayıtlar — ${oneriler.length ? oneriler.length + ' grup' : 'bulunamadı'}</div>
        ${oneriler.length ? '' : '<div class="ky-bos">✅ Aynı ya da çok benzer isimle birden fazla kayıt görünmüyor.</div>'}
        ${oneriler.slice(0, 30).map((o, i) => `<div class="ky-oneri"><div class="ky-oneri-bas"><span class="ky-cip" style="color:${o.tip === 'ayni' ? 'var(--status-danger,#dc2626)' : 'var(--status-warning,#d97706)'}">${o.tip === 'ayni' ? 'Aynı isim' : o.tip === 'kisa' ? 'Kısaltma olabilir — ikinci ad eksik ya da fazla' : 'Benzer isim — yazım farkı olabilir'}</span>
            <span style="display:flex; gap:6px;"><button class="ky-btn birincil" onclick="kyOneriSec(${i})">🧹 Birleştirmeye al</button><button class="ky-btn" onclick="kyOneriFarkli(${i})">Farklı kişiler</button></span></div>
            <div class="ky-liste">${o.liste.map(x => kyKisiSatir(x, '', false)).join('')}</div></div>`).join('')}</div>`;
    window._kyOneriCache = oneriler;
    alan.innerHTML = `<div class="ky">
        <div><div class="ky-baslik">🧹 Çift Kayıt</div><div class="ky-alt">İsim yaz; o isimde ve ona benzeyen (bir-iki harf farklı, ı/i, ş/s gibi) tüm kayıtları görürsün. Yanlış yazılmış ismi <b>Adını düzelt</b> ile düzelt ya da aynı kişiye ait kayıtları seçip <b>tek kayıtta birleştir</b>. Seriler, yoklama, aidat ve ders kayıtları taşınır — veri kaybolmaz.</div></div>
        ${kyKopukHTML()}
        <input class="ky-ara" id="ky-ara" type="search" placeholder="🔍 İsim yaz — ör. sare" value="${esc(_ky.ara)}" oninput="kyAra(this.value)" autocomplete="off">
        ${sonuc}
        ${kyPanelHTML()}
        ${kyKayitsizHTML()}
        ${oneriHTML}
    </div>`;
}
function kyKayitsizlar() {
    let var_ = new Set(); ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach(g => Object.keys(turnuvaDB[g] || {}).forEach(ad => var_.add(ad)));
    let silinmis = new Set((typeof silinenlerDB !== 'undefined' ? silinenlerDB : []).map(x => x.ad));
    let m = {};
    Object.keys(otomatikYoklamaDB || {}).forEach(t => Object.keys(otomatikYoklamaDB[t] || {}).forEach(ad => {
        if (var_.has(ad) || silinmis.has(ad)) return;
        let x = m[ad] = m[ad] || { ad, grup: null, yoklama: 0, aidat: 0 }; x.yoklama++; if (!x.grup) x.grup = (otomatikYoklamaDB[t][ad] || {}).grup || null;
    }));
    Object.keys((typeof aidatDB !== 'undefined' && aidatDB) || {}).forEach(ad => {
        if (var_.has(ad) || silinmis.has(ad)) return;
        let x = m[ad] = m[ad] || { ad, grup: null, yoklama: 0, aidat: 0 }; x.aidat += Object.keys(aidatDB[ad] || {}).length;
    });
    let tum = kyTumKisiler();
    return Object.values(m).filter(x => x.yoklama + x.aidat > 0).map(x => {
        let k = kyKatla(x.ad), ilk = k.split(' ')[0];
        let adaylar = tum.map(y => { let p = kyAramaPuan(k, y.k); if (p === null && y.k.split(' ')[0] === ilk) p = 50; return { y, p }; })
            .filter(z => z.p !== null).sort((a, b) => a.p - b.p).slice(0, 6).map(z => z.y);
        return Object.assign(x, { adaylar });
    }).sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
}
function kyKayitsizHTML() {
    let l = kyKayitsizlar(); window._kyKayitsizCache = l;
    if (!l.length) return '';
    return `<div class="ky-kart"><div class="ky-etiket">Sporcu kaydı olmayan isimler — ${l.length}</div>
        <div class="ky-alt">Bu isimlerle yoklama ya da aidat girilmiş ama bu isimde bir sporcu yok (çoğunlukla farklı yazım: I/İ, eksik ikinci ad). Doğru sporcuyu seç → <b>Bağla</b>: o isimdeki tüm kayıtlar seçtiğin sporcuya taşınır.</div>
        <div class="ky-liste">${l.map((x, i) => `<div class="ky-bilgi" style="margin:0; display:flex; gap:8px; align-items:center; flex-wrap:wrap;"><span style="flex:1; min-width:150px"><b>${esc(x.ad)}</b> <span class="ky-alt">· ${[x.yoklama && x.yoklama + ' yoklama', x.aidat && x.aidat + ' aidat ayı'].filter(Boolean).join(', ')}</span></span>
            <select id="ky-kayitsiz-${i}" class="ky-ara" style="width:auto; min-width:220px; max-width:100%; padding:8px 10px; font-size:13px; font-weight:600;" aria-label="${esc(x.ad)} hangi sporcu">${x.adaylar.length ? '' : '<option value="">— sporcu seç —</option>'}${x.adaylar.map(y => `<option value="${esc(kyAnahtar(y.g, y.ad))}">${esc(y.ad)} (${esc(kyGrupAd(y.g))})</option>`).join('')}<optgroup label="Diğer sporcular">${kyTumKisiler().filter(y => !x.adaylar.includes(y)).sort((p, q) => p.ad.localeCompare(q.ad, 'tr')).map(y => `<option value="${esc(kyAnahtar(y.g, y.ad))}">${esc(y.ad)} (${esc(kyGrupAd(y.g))})</option>`).join('')}</optgroup></select>
            <button class="ky-btn birincil" ${!_ky.calisiyor ? '' : 'disabled'} onclick="kyKayitsizBagla(${i})">🔗 Bağla</button></div>`).join('')}</div></div>`;
}
function kyKayitsizBagla(i) {
    let x = (window._kyKayitsizCache || [])[i], sel = document.getElementById('ky-kayitsiz-' + i); if (!x || !sel || _ky.calisiyor) return;
    if (!sel.value) return showToast('Önce bu kayıtların ait olduğu sporcuyu seç.', 'warning');
    let [hg, ...hr] = sel.value.split('|'), ha = hr.join('|'), kg = x.grup || hg;
    onayIste(`<b>${esc(x.ad)}</b> adıyla girilmiş ${[x.yoklama && x.yoklama + ' yoklama', x.aidat && x.aidat + ' aidat ayı'].filter(Boolean).join(', ')} → <b>${esc(ha)}</b> sporcusuna taşınsın mı?`, async () => {
        _ky.calisiyor = true; kyCiftKayitCiz();
        try {
            let r = await fetch('/api/athletes/' + encodeURIComponent(kg) + '/' + encodeURIComponent(x.ad) + '/merge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ toGrup: hg, toAd: ha, deviceId: typeof _cihazId !== 'undefined' ? _cihazId : null }) });
            if (!r.ok) { let t = ''; try { t = (await r.json()).error || ''; } catch (e) {} throw new Error(t || ('HTTP ' + r.status)); }
            try { _sporcuYerelAnahtarTasi(kg, x.ad, hg, ha); } catch (e) {}
            try { yoneticiKaydet(); } catch (e) {}
            showToast(`🔗 "${x.ad}" kayıtları ${ha} sporcusuna bağlandı.`, 'success');
            try { bulutManuelYenile(); } catch (e) {}
        } catch (e) { showToast('Bağlanamadı (' + (e && e.message ? e.message : 'bağlantı') + ') — hiçbir şey değişmedi.', 'error'); }
        _ky.calisiyor = false; kyCiftKayitCiz();
    }, '🔗 Evet, bağla');
}
// ---- eski Kategori Taşı onarımı: sunucuda eski (grup, ad) anahtarında kalmış seri/ders/yoklama/aidat
function kyKopukHTML() {
    if (_ky.kopuk === null) {
        _ky.kopuk = 'yukleniyor';
        fetch('/api/athlete-moves/kopuk').then(r => r.ok ? r.json() : { kopuk: [] }).then(d => { _ky.kopuk = d.kopuk || []; }).catch(() => { _ky.kopuk = []; })
            .then(() => { if (typeof yoneticiSekmeAktif !== 'undefined' && yoneticiSekmeAktif === 'ciftkayit') kyCiftKayitCiz(); });
        return '';
    }
    if (!Array.isArray(_ky.kopuk) || !_ky.kopuk.length) return '';
    let top = _ky.kopuk.reduce((a, k) => ({ seri: a.seri + k.seri, ders: a.ders + k.ders, yoklama: a.yoklama + k.yoklama, aidat: a.aidat + k.aidat, atis: a.atis + k.atis }), { seri: 0, ders: 0, yoklama: 0, aidat: 0, atis: 0 });
    let parcalar = k => [k.seri && k.seri + ' seri', k.yoklama && k.yoklama + ' yoklama', k.aidat && k.aidat + ' aidat ayı', k.ders && k.ders + ' ders kaydı', k.atis && k.atis + ' atış kaydı'].filter(Boolean).join(', ');
    return `<div class="ky-kart" style="border-color:var(--status-warning,#d97706); background:color-mix(in srgb, var(--status-warning,#d97706) 8%, var(--surface-1,#111));">
        <div style="font-weight:900; font-size:15px;">🛠️ Eski kategori taşımalarında kopuk kalmış veri var</div>
        <div class="ky-alt">Eskiden "Kategori Taşı" ve isim değiştirme sadece sporcunun kendisini taşıyordu; aşağıdaki ${_ky.kopuk.length} sporcunun <b>${parcalar(top)}</b> sunucuda eski grupta/isimde kaldı ve sayfa yenilenince görünmüyor. <b>Onar</b> hepsini doğru kayda bağlar — hiçbir şey silinmez.</div>
        <div class="ky-liste">${_ky.kopuk.map(k => `<div class="ky-bilgi" style="margin:0"><b>${esc(k.hedefAd)}</b><span>${esc(kyGrupAd(k.eskiGrup))}${k.eskiAd !== k.hedefAd ? ' (eski adı: ' + esc(k.eskiAd) + ')' : ''} → ${esc(kyGrupAd(k.hedefGrup))}</span><span>${parcalar(k)}</span></div>`).join('')}</div>
        <div><button class="ky-btn yesil" ${_ky.calisiyor ? 'disabled' : ''} onclick="kyKopukOnar()">${_ky.calisiyor ? 'Onarılıyor…' : '🛠️ Onar — verileri doğru kayda bağla'}</button></div></div>`;
}
function kyKopukOnar() {
    if (_ky.calisiyor) return;
    _ky.calisiyor = true; kyCiftKayitCiz();
    fetch('/api/athlete-moves/onar', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ deviceId: typeof _cihazId !== 'undefined' ? _cihazId : null }) })
        .then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => {
            let liste = d.onarilan || [], n = liste.reduce((a, k) => a + k.seri, 0);
            showToast(`🛠️ ${liste.length} sporcunun verisi onarıldı (${n} seri geri bağlandı).`, 'success');
            _ky.kopuk = null;
            try { bulutManuelYenile(); } catch (e) {}
        }).catch(st => showToast(st === 401 ? 'Bu işlem için giriş yapmalısın.' : 'Onarım yapılamadı — bağlantıyı kontrol edip tekrar dene. Hiçbir şey değişmedi.', 'error'))
        .then(() => { _ky.calisiyor = false; kyCiftKayitCiz(); });
}
function kyPanelHTML() {
    if (_ky.secili.length < 2) return _ky.secili.length === 1 ? `<div class="ky-panel"><div class="ky-alt">1 kayıt seçildi — birleştirmek için aynı kişiye ait en az bir kayıt daha seç.</div><div><button class="ky-btn" onclick="kySecimTemizle()">Seçimi temizle</button></div></div>` : '';
    let kayitlar = _ky.secili.map(k => { let [g, ...r] = k.split('|'); let ad = r.join('|'); return Object.assign({ key: k, g, ad }, kyOzet(g, ad)); });
    if (!_ky.hedef) { let en = kayitlar.slice().sort((a, b) => (b.seri + b.yoklama + b.aidat) - (a.seri + a.yoklama + a.aidat))[0]; _ky.hedef = en.key; }
    let hedef = kayitlar.find(x => x.key === _ky.hedef), digerleri = kayitlar.filter(x => x.key !== _ky.hedef);
    let tasinan = digerleri.reduce((a, x) => ({ seri: a.seri + x.seri, yoklama: a.yoklama + x.yoklama, aidat: a.aidat + x.aidat, ders: a.ders + x.ders }), { seri: 0, yoklama: 0, aidat: 0, ders: 0 });
    return `<div class="ky-panel" id="ky-panel">
        <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; flex-wrap:wrap;"><b style="font-size:15px;">🧹 ${kayitlar.length} kayıt tek kişide birleşecek</b><button class="ky-btn" onclick="kySecimTemizle()">Seçimi temizle</button></div>
        <div class="ky-etiket">Hangi isim kalsın?</div>
        <div class="ky-hedef-sec">${kayitlar.map(x => `<label><input type="radio" name="ky-hedef" ${x.key === _ky.hedef ? 'checked' : ''} onchange="kyHedef('${kyKaydirKey(x.g, x.ad)}')"><span style="flex:1; min-width:0"><b>${esc(x.ad)}</b>${kyRozetHTML(x.g, x.ad)} <span class="ky-alt">· ${esc(kyGrupAd(x.g))} · ${x.seri} seri · ${x.yoklama} yoklama</span></span></label>`).join('')}</div>
        <div class="ky-alt">Kalan kayda taşınacak: <b>${tasinan.seri}</b> seri, <b>${tasinan.yoklama}</b> yoklama günü, <b>${tasinan.aidat}</b> aidat ayı, <b>${tasinan.ders}</b> ders kaydı. Diğer ${digerleri.length} kayıt kaldırılır; boş bilgileri (doğum tarihi, telefon…) kalan kayda eklenir. Yanlış isim seçtiysen birleştirmeden sonra <b>Adını düzelt</b> ile düzeltebilirsin.</div>
        <button class="ky-btn yesil" style="min-height:46px; font-size:14px;" ${_ky.calisiyor ? 'disabled' : ''} onclick="kyBirlestir()">${_ky.calisiyor ? 'Birleştiriliyor…' : `✔ "${esc(hedef.ad)}" olarak birleştir`}</button>
    </div>`;
}
function kyAra(v) {
    _ky.ara = v; kyCiftKayitCiz();
    let el = document.getElementById('ky-ara'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
}
function kySec(kk) { let k = kyKeyCoz(kk), key = kyAnahtar(k.g, k.ad); _ky.secili = _ky.secili.includes(key) ? _ky.secili.filter(x => x !== key) : _ky.secili.concat(key); if (_ky.hedef === key && !_ky.secili.includes(key)) _ky.hedef = null; kyCiftKayitCiz(); }
function kyHedef(kk) { let k = kyKeyCoz(kk); _ky.hedef = kyAnahtar(k.g, k.ad); kyCiftKayitCiz(); }
function kySecimTemizle() { _ky.secili = []; _ky.hedef = null; kyCiftKayitCiz(); }
function kyOneriSec(i) {
    let o = (window._kyOneriCache || [])[i]; if (!o) return;
    _ky.secili = o.liste.map(x => kyAnahtar(x.g, x.ad)); _ky.hedef = null;
    kyCiftKayitCiz();
    let p = document.getElementById('ky-panel'); if (p) p.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function kyOneriFarkli(i) {
    let o = (window._kyOneriCache || [])[i]; if (!o) return;
    let s = kyFarkliOku();
    o.liste.forEach((a, x) => o.liste.forEach((b, y) => { if (x < y) s.add(kyCiftAnahtar(kyAnahtar(a.g, a.ad), kyAnahtar(b.g, b.ad))); }));
    try { localStorage.setItem('dag_cift_farkli', JSON.stringify([...s])); } catch (e) {}
    showToast('Tamam — bunlar bir daha şüpheli olarak gösterilmeyecek.', 'success');
    kyCiftKayitCiz();
}
function kyBirlestir() {
    if (_ky.secili.length < 2 || !_ky.hedef || _ky.calisiyor) return;
    let [hg, ...hr] = _ky.hedef.split('|'), ha = hr.join('|');
    let kaynaklar = _ky.secili.filter(k => k !== _ky.hedef).map(k => { let [g, ...r] = k.split('|'); return { g, ad: r.join('|') }; });
    onayIste(`<b>${kaynaklar.map(x => esc(x.ad)).join(', ')}</b> → <b>${esc(ha)}</b> kaydında birleştirilsin mi?<br><span style="font-size:12px; color:var(--text-muted);">Tüm seriler, yoklama, aidat ve ders kayıtları ${esc(ha)}'a taşınır. Geri alınamaz.</span>`, async () => {
        _ky.calisiyor = true; kyCiftKayitCiz();
        let ok = 0, hata = [];
        for (let x of kaynaklar) {
            try { await _ciftKayitBirlestirCekirdek(x.g, x.ad, hg, ha); ok++; }
            catch (e) { hata.push(x.ad + ': ' + (e && e.message ? e.message : 'hata')); }
        }
        _ky.calisiyor = false;
        if (ok) { _ky.secili = []; _ky.hedef = null; }
        if (hata.length) showToast('Bazı kayıtlar birleştirilemedi (' + hata.join('; ') + ') — onlarda hiçbir şey değişmedi.', 'error');
        else showToast(`🧹 ${ok} kayıt "${ha}" altında birleştirildi.`, 'success');
        kyCiftKayitCiz();
    }, '🧹 Evet, birleştir');
}
function kyDuzenleAc(kk) {
    if (!kk) { _ky.duzenle = null; kyYenidenCiz(); return; }
    let k = kyKeyCoz(kk); _ky.duzenle = kyAnahtar(k.g, k.ad); kyYenidenCiz();
    let el = document.getElementById('ky-duz-ad'); if (el) { el.focus(); el.select(); }
}
function kyDuzenleKaydet(kk) {
    let k = kyKeyCoz(kk), el = document.getElementById('ky-duz-ad');
    let yeni = (el ? el.value : '').replace(/\s+/g, ' ').trim().toLocaleUpperCase('tr-TR');
    if (!yeni) return showToast('İsim boş olamaz.', 'error');
    if (yeni === k.ad) { _ky.duzenle = null; kyYenidenCiz(); return; }
    if (turnuvaDB[k.g] && turnuvaDB[k.g][yeni]) {
        // Aynı isim zaten var → ikisini birleştirmeye hazırla
        _ky.duzenle = null; _ky.secili = [kyAnahtar(k.g, k.ad), kyAnahtar(k.g, yeni)]; _ky.hedef = kyAnahtar(k.g, yeni);
        if (yoneticiSekmeAktif !== 'ciftkayit') { yoneticiSekme('ciftkayit'); } else kyCiftKayitCiz();
        showToast(`"${yeni}" zaten kayıtlı — ikisini birleştirmek için paneli onayla.`, 'warning');
        let p = document.getElementById('ky-panel'); if (p) p.scrollIntoView({ block: 'center', behavior: 'smooth' });
        return;
    }
    if (el) el.disabled = true;
    _sporcuYenidenAdlandir(k.g, k.ad, yeni).then(() => {
        _ky.duzenle = null;
        _ky.secili = _ky.secili.map(x => x === kyAnahtar(k.g, k.ad) ? kyAnahtar(k.g, yeni) : x);
        if (_ky.hedef === kyAnahtar(k.g, k.ad)) _ky.hedef = kyAnahtar(k.g, yeni);
        if (_ky.ara && kyAramaPuan(kyKatla(_ky.ara), kyKatla(yeni)) === null) _ky.ara = yeni;
        showToast(`✏️ ${k.ad} → ${yeni} (tüm kayıtlarıyla)`, 'success');
        kyYenidenCiz();
    }).catch(e => { if (el) el.disabled = false; showToast('İsim değiştirilemedi: ' + (e && e.message ? e.message : 'bağlantı hatası') + ' — hiçbir şey değişmedi.', 'error'); });
}

// ---------------------------------------------------------------- 3) Eğitmen & Misafir
function kyKisilerCiz() {
    kyCss();
    if (!_ky.notCekildi) { _ky.notCekildi = true; kisiTurCek(() => { if (typeof yoneticiSekmeAktif !== "undefined" && yoneticiSekmeAktif === "kisiler") kyKisilerCiz(); }); }
    let alan = document.getElementById('yonetici-liste'); if (!alan) return;
    let tum = kyTumKisiler();
    let egit = tum.filter(x => kisiTuru(x.g, x.ad) === 'egitmen'), mis = tum.filter(x => kisiTuru(x.g, x.ad) === 'misafir');
    let s = _ky.kisiSekme;
    let sekme = (id, ad) => `<button class="${s === id ? 'aktif' : ''}" onclick="_ky.kisiSekme='${id}'; _ky.duzenle=null; kyKisilerCiz()">${ad}</button>`;
    let govde = s === 'misafir' ? kyMisafirHTML(mis) : s === 'ata' ? kyTurAtaHTML(tum) : kyEgitmenHTML(egit);
    alan.innerHTML = `<div class="ky">
        <div><div class="ky-baslik">🪪 Eğitmen & Misafir</div><div class="ky-alt">Sporcu kaydıyla atış yapan <b>eğitmenleri</b> ve günlük gelen <b>misafirleri</b> öğrencilerden ayır. Kayıtları, serileri ve atış verileri aynen korunur; sadece listelerde ayrı bölümde görünürler ve yoklama raporlarında öğrenci sayılarına katılmazlar.</div></div>
        <div class="ky-sekmeler">${sekme('egitmen', `👔 Eğitmenler (${egit.length})`)}${sekme('misafir', `🎟️ Misafirler (${mis.length})`)}${sekme('ata', '🔎 Tür ata')}</div>
        ${govde}
    </div>`;
}
function kyEgitmenHTML(liste) {
    liste.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    return `<div class="ky-kart"><div class="ky-alt">Eğitmen olarak işaretli sporcu kayıtları. Karışık Sınıf'ta sporcu seçerken en altta <b>👔 Eğitmenler</b> bölümünde çıkarlar — atış yapıp verilerini kaydetmeye devam edebilirsiniz.</div>
        <div class="ky-liste">${liste.map(x => { let o = kyOzet(x.g, x.ad), kk = kyKaydirKey(x.g, x.ad); let son = x.sp.sonSkorZamani ? new Date(x.sp.sonSkorZamani).toLocaleDateString('tr-TR') : '—';
            return `<div class="ky-kisi"><span></span>${kyAvatar(x.g, x.ad, x.sp)}<div style="min-width:0"><div class="ky-ad">${esc(x.ad)}</div><div class="ky-bilgi"><span class="ky-cip" style="color:${kyGrupRenk(x.g)}">${esc(kyGrupAd(x.g))}</span><span><b>${o.seri}</b> seri</span><span>son atış: <b>${son}</b></span></div></div>
                <div class="ky-eylem"><button class="ky-btn" onclick="kyTurDegistir('${kk}','sporcu')">🎯 Öğrenci yap</button></div></div>`; }).join('') || '<div class="ky-bos">Henüz eğitmen olarak işaretlenmiş kayıt yok.<br>Üstteki <b>🔎 Tür ata</b> sekmesinden kendi kaydınızı bulup <b>👔 Eğitmen</b> yapın.</div>'}</div></div>`;
}
function kyMisafirHTML(liste) {
    let takipHTML = kyMisafirTakipHTML(liste);
    liste = liste.map(x => Object.assign({ o: kyOzet(x.g, x.ad), b: kisiBilgi(x.g, x.ad) || {} }, x)).sort((a, b) => String(b.o.son || b.b.eklenme || '').localeCompare(String(a.o.son || a.b.eklenme || '')));
    let form = _ky.misafirForm ? `<div class="ky-kart"><div class="ky-etiket">Yeni misafir kaydı</div>
        <div class="ky-form" id="ky-mis-form"><input name="ad" placeholder="Ad Soyad" autocomplete="off"><select name="grup">${['buyukler', 'yildizlar', 'kucukler', 'minikler'].map(g => `<option value="${g}">${esc(kyGrupAd(g))}</option>`).join('')}</select>
            <input name="tel" placeholder="Telefon (isteğe bağlı)" inputmode="tel"><textarea name="not" placeholder="Kim? Nereden geldi, kimin yakını, hangi gün deneme dersi… (isteğe bağlı)"></textarea></div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;"><button class="ky-btn yesil" onclick="kyMisafirEkle()">✅ Misafiri kaydet</button><button class="ky-btn" onclick="kyMisafirEkle(true)">✅ Kaydet ve bugün geldi işaretle</button><button class="ky-btn" onclick="_ky.misafirForm=false; kyKisilerCiz()">Vazgeç</button></div></div>`
        : `<div><button class="ky-btn birincil" onclick="_ky.misafirForm=true; kyKisilerCiz(); setTimeout(()=>{let i=document.querySelector('#ky-mis-form [name=ad]'); if(i) i.focus();},30)">➕ Yeni misafir kaydı</button></div>`;
    return `${form}${takipHTML}<div class="ky-kart"><div class="ky-alt">Günlük / deneme dersine gelenler. Geldiği günler yoklamadan otomatik görünür. Sürekli gelmeye başlayınca <b>⭐ Aktif sporcu yap</b> — tüm geçmişiyle öğrenci olur.</div>
        <div class="ky-liste">${liste.map(x => {
            let kk = kyKaydirKey(x.g, x.ad), key = kyAnahtar(x.g, x.ad), duz = _ky.duzenle === 'mis:' + key;
            return `<div class="ky-kisi"><span></span>${kyAvatar(x.g, x.ad, x.sp)}<div style="min-width:0"><div class="ky-ad">${esc(x.ad)}</div>
                <div class="ky-bilgi"><span class="ky-cip" style="color:${kyGrupRenk(x.g)}">${esc(kyGrupAd(x.g))}</span>${x.b.eklenme ? `<span>kayıt: <b>${kyTarih(x.b.eklenme)}</b></span>` : ''}<span><b>${x.o.yoklama}</b> kez geldi</span><span>son: <b>${kyTarih(x.o.son)}</b></span>${x.b.tel ? `<span>📞 <b>${esc(x.b.tel)}</b></span>` : ''}</div>
                ${x.b.not ? `<div class="ky-alt" style="margin-top:4px">📝 ${esc(x.b.not)}</div>` : ''}
                ${x.o.gunler.length ? `<div class="ky-gunler" style="margin-top:6px">${x.o.gunler.slice(-8).reverse().map(t => `<span>${kyTarih(t)}</span>`).join('')}</div>` : ''}</div>
                <div class="ky-eylem">${kyTakipCipHTML(x.b.takip)}<button class="ky-btn" onclick="kyMisafirBilgiAc('${kk}')">📝 Bilgi</button><button class="ky-btn yesil" onclick="kyMisafirAktifYap('${kk}')">⭐ Aktif sporcu yap</button></div>
                ${duz ? `<div class="ky-duz ky-form" style="display:grid"><input id="ky-mis-tel" placeholder="Telefon" value="${esc(x.b.tel || '')}" style="text-transform:none"><textarea id="ky-mis-not" placeholder="Kim? Nereden geldi?">${esc(x.b.not || '')}</textarea>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; grid-column:1/-1"><button class="ky-btn yesil" onclick="kyMisafirBilgiKaydet('${kk}')">💾 Kaydet</button><button class="ky-btn" onclick="kyDuzenleAc('${kk}'); _ky.kisiSekme='misafir'">✏️ Adını düzelt</button><button class="ky-btn tehlike" onclick="kyMisafirSil('${kk}')">🗑️ Kaydı sil</button></div></div>` : ''}
                ${_ky.duzenle === key ? kyAdDuzenleSatiri(kk, x.ad) : ''}</div>`;
        }).join('') || '<div class="ky-bos">Misafir kaydı yok. Günlük gelen biri için yukarıdan <b>➕ Yeni misafir kaydı</b> aç, ya da mevcut bir kaydı <b>🔎 Tür ata</b> sekmesinden misafir yap.</div>'}</div></div>`;
}
// ---- 📈 Misafirden üyeye takip (2026-09-28): deneme dersine gelenlerin kaçı üye oldu, kimi henüz aramadın.
// Takip durumu oturumlu not kaydında (takip: {durum:'arandi'|'ilgilenmiyor'|'uye', tarih}); yoksa "aranmadı".
const KY_TAKIP = { arandi: { ad: 'Arandı', renk: '#38bdf8' }, ilgilenmiyor: { ad: 'İlgilenmiyor', renk: '#94a3b8' }, uye: { ad: 'Üye oldu', renk: '#16a34a' } };
function kyGunFark(iso) { return iso ? Math.round((new Date(bugunISO() + 'T12:00:00') - new Date(iso + 'T12:00:00')) / 86400000) : null; }
function kyTakipCipHTML(t) {
    let d = t && KY_TAKIP[t.durum];
    return d ? `<span class="ky-cip" style="color:${d.renk}; border-color:${d.renk}66">${d.ad}${t.tarih ? ' · ' + kyTarih(t.tarih) : ''}</span>` : '<span class="ky-cip" style="color:var(--status-warning,#d97706)">Aranmadı</span>';
}
function kyMisafirTakipHTML(misafirler) {
    let sinir = new Date(); sinir.setDate(sinir.getDate() - 90); let s90 = sinir.getFullYear() + '-' + String(sinir.getMonth() + 1).padStart(2, '0') + '-' + String(sinir.getDate()).padStart(2, '0');
    // son 90 günde gelen tüm misafirler: hâlâ misafir olanlar + misafirken üye olanlar (kişi türünde aktifOldu)
    let donusen = kyTumKisiler().filter(x => { let b = kisiBilgi(x.g, x.ad); return b && b.aktifOldu && b.aktifOldu >= s90 && kisiTuru(x.g, x.ad) === 'sporcu'; });
    let toplam = misafirler.filter(x => { let b = kisiBilgi(x.g, x.ad) || {}, o = kyOzet(x.g, x.ad); return (b.eklenme || o.son || '') >= s90; }).length + donusen.length;
    let aranacak = misafirler.map(x => Object.assign({ b: kisiBilgi(x.g, x.ad) || {}, o: kyOzet(x.g, x.ad) }, x))
        .filter(x => !(x.b.takip && KY_TAKIP[x.b.takip.durum]) && (x.o.son || x.b.eklenme))
        .map(x => Object.assign({ gun: kyGunFark(x.o.son || x.b.eklenme) }, x)).filter(x => x.gun >= 1).sort((a, b) => b.gun - a.gun);
    let oran = toplam ? Math.round(donusen.length / toplam * 100) : null;
    return `<div class="ky-kart"><div class="ky-etiket">📈 Misafirden üyeye — son 90 gün</div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:8px;">
            <div class="ky-oneri" style="border-style:solid"><span class="ky-alt">Gelen misafir</span><b style="font-size:24px">${toplam}</b></div>
            <div class="ky-oneri" style="border-style:solid"><span class="ky-alt">Üye oldu</span><b style="font-size:24px; color:var(--status-success,#16a34a)">${donusen.length}</b></div>
            <div class="ky-oneri" style="border-style:solid"><span class="ky-alt">Dönüşüm</span><b style="font-size:24px">${oran === null ? '—' : '%' + oran}</b></div>
            <div class="ky-oneri" style="border-style:solid"><span class="ky-alt">Aranacak</span><b style="font-size:24px; color:${aranacak.length ? 'var(--status-warning,#d97706)' : 'inherit'}">${aranacak.length}</b></div>
        </div>
        ${aranacak.length ? `<div class="ky-etiket" style="margin-top:4px">📞 Aranmayı bekleyenler</div><div class="ky-liste">${aranacak.map(x => { let kk = kyKaydirKey(x.g, x.ad);
            return `<div class="ky-kisi"><span></span>${kyAvatar(x.g, x.ad, x.sp)}<div style="min-width:0"><div class="ky-ad">${esc(x.ad)}</div><div class="ky-bilgi"><span>${x.o.yoklama ? `<b>${x.o.yoklama}</b> kez geldi · son geliş <b>${x.gun} gün önce</b>` : `kayıt <b>${x.gun} gün önce</b>`}</span>${x.b.tel ? `<span>📞 <b>${esc(x.b.tel)}</b></span>` : '<span>telefon yok</span>'}</div></div>
                <div class="ky-eylem"><button class="ky-btn yesil" onclick="kyMisafirWhatsApp('${kk}')">💬 WhatsApp</button><button class="ky-btn" onclick="kyTakip('${kk}','arandi')">✓ Arandı</button><button class="ky-btn" onclick="kyTakip('${kk}','ilgilenmiyor')">İlgilenmiyor</button></div></div>`; }).join('')}</div>` : '<div class="ky-alt">✅ Aranmayı bekleyen misafir yok.</div>'}
        ${donusen.length ? `<div class="ky-alt">⭐ Üye olanlar: ${donusen.map(x => `<b>${esc(x.ad)}</b> (${kyTarih(kisiBilgi(x.g, x.ad).aktifOldu)})`).join(', ')}</div>` : ''}</div>`;
}
function kyTakip(kk, durum) {
    let k = kyKeyCoz(kk);
    kisiTurAyarla(k.g, k.ad, { takip: { durum, tarih: bugunISO() } });
    showToast(`${k.ad} → ${KY_TAKIP[durum].ad}`, 'success'); kyKisilerCiz();
}
function kyMisafirWhatsApp(kk) {
    let k = kyKeyCoz(kk), b = kisiBilgi(k.g, k.ad) || {};
    let ilk = k.ad.split(' ')[0], ilkB = ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr-TR');
    let msg = `Merhaba 🌟 DAĞ Spor Kulübü'nden yazıyoruz.\n\n${ilkB} okçuluk dersimize katıldığı için çok teşekkür ederiz! 🏹 Nasıl buldu, devam etmek ister mi?\n\nDers günlerimizi, saatlerimizi ve kayıt bilgilerini paylaşmaktan memnuniyet duyarız — buradan yazmanız yeterli.\n\nDAĞ Spor Kulübü`;
    let numara = typeof telefonWaFormat === 'function' ? telefonWaFormat(b.tel) : '';
    window.open((numara ? `https://api.whatsapp.com/send?phone=${numara}&text=` : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(msg), '_blank');
    // mesaj açıldıysa "arandı" say (yanlışsa kartta tek dokunuşla değiştirilebilir)
    kisiTurAyarla(k.g, k.ad, { takip: { durum: 'arandi', tarih: bugunISO(), kanal: 'whatsapp' } });
    kyKisilerCiz();
}
function kyAdDuzenleSatiri(kk, ad) {
    return `<div class="ky-duz"><input id="ky-duz-ad" value="${esc(ad)}" aria-label="Yeni isim" onkeydown="if(event.key==='Enter') kyDuzenleKaydet('${kk}'); if(event.key==='Escape') kyDuzenleAc(null);">
        <button class="ky-btn yesil" onclick="kyDuzenleKaydet('${kk}')">💾 Kaydet</button><button class="ky-btn" onclick="kyDuzenleAc(null)">Vazgeç</button></div>`;
}
function kyTurAtaHTML(tum) {
    let q = kyKatla(_ky.kisiAra);
    let liste = q ? tum.map(x => Object.assign({ p: kyAramaPuan(q, x.k) }, x)).filter(x => x.p !== null).sort((a, b) => a.p - b.p || a.ad.localeCompare(b.ad, 'tr')).slice(0, 30) : [];
    return `<div class="ky-kart"><input class="ky-ara" id="ky-tur-ara" type="search" placeholder="🔍 Kişi ara — ör. burak" value="${esc(_ky.kisiAra)}" oninput="_ky.kisiAra=this.value; kyKisilerCiz(); let e=document.getElementById('ky-tur-ara'); if(e){e.focus(); e.setSelectionRange(e.value.length,e.value.length);}" autocomplete="off">
        <div class="ky-liste">${q ? (liste.map(x => { let t = kisiTuru(x.g, x.ad), kk = kyKaydirKey(x.g, x.ad);
            return `<div class="ky-kisi"><span></span>${kyAvatar(x.g, x.ad, x.sp)}<div style="min-width:0"><div class="ky-ad">${kyVurgula(x.ad, q)}</div><div class="ky-bilgi"><span class="ky-cip" style="color:${kyGrupRenk(x.g)}">${esc(kyGrupAd(x.g))}</span>${x.sp.pasif ? '<span>pasif</span>' : ''}</div></div>
                <div class="ky-eylem">${Object.keys(KY_TUR).map(k => { let r = KY_TUR[k]; return `<button class="ky-btn" style="${k === t ? `background:${r.renk}26; color:${r.renk}; border-color:${r.renk};` : ''}" aria-pressed="${k === t}" onclick="kyTurDegistir('${kk}','${k}')">${r.ikon} ${r.ad}</button>`; }).join('')}</div></div>`; }).join('') || '<div class="ky-bos">Eşleşen kayıt yok.</div>') : '<div class="ky-bos">İsim yaz, kişiyi bul, türünü seç.</div>'}</div></div>`;
}
function kyMisafirEkle(geldi) {
    let f = document.getElementById('ky-mis-form'); if (!f) return;
    let ad = f.querySelector('[name=ad]').value.replace(/\s+/g, ' ').trim().toLocaleUpperCase('tr-TR'), g = f.querySelector('[name=grup]').value;
    let tel = f.querySelector('[name=tel]').value.trim(), not = f.querySelector('[name=not]').value.trim();
    if (!ad) return showToast('Misafirin adını yaz.', 'error');
    if (turnuvaDB[g] && turnuvaDB[g][ad]) return showToast(`${ad} zaten ${kyGrupAd(g)} grubunda kayıtlı — Tür ata sekmesinden misafir yapabilirsin.`, 'warning');
    let k = kyKatla(ad), benzer = kyTumKisiler().filter(x => x.k === k || kyMesafe(x.k, k, 1) <= 1);
    let devam = () => {
        kyMisafirOlustur(g, ad, { tel, not }, geldi ? bugunISO() : null);
        _ky.misafirForm = false;
        showToast(`🎟️ ${ad} misafir olarak kaydedildi${geldi ? ' ve bugün geldi işaretlendi' : ''}.`, 'success');
        try { sporcuListesiniYenile(); } catch (e) {}
        kyKisilerCiz();
    };
    if (benzer.length) {
        onayIste(`Benzer isimde kayıt var: <b>${benzer.slice(0, 4).map(x => esc(x.ad) + ' (' + esc(kyGrupAd(x.g)) + ')').join(', ')}</b>.<br>Aynı kişiyse yeni kayıt açma — <b>Tür ata</b> sekmesinden onu misafir yap.<br><br>Yine de <b>${esc(ad)}</b> için yeni kayıt açılsın mı?`, devam, '✅ Evet, yeni kayıt');
    } else devam();
}
// Misafir kaydı oluştur (Yönetici › Eğitmen & Misafir ve Yoklama › "Listede olmayan biri mi geldi?" ortak).
// geldiIso verilirse o gün için "geldi" de işaretlenir.
function kyMisafirOlustur(g, ad, ek, geldiIso) {
    if (!turnuvaDB[g]) turnuvaDB[g] = {};
    if (turnuvaDB[g][ad]) return false;
    if (silinenlerDB.some(s => !s.tasindi && s.grup === g && s.ad === ad) && typeof _sporcuSunucudaGeriAl === 'function') _sporcuSunucudaGeriAl(g, ad).then(() => { try { bulutaGonderKontrol(); } catch (e) {} }).catch(() => {});
    silinenlerDB = silinenlerDB.filter(s => !(s.grup === g && s.ad === ad)); silinenlerKaydet();
    turnuvaDB[g][ad] = { toplamSkor: 0, xAdet: 0, seriler: [], detayliOklar: [], lastModified: Date.now() };
    yoneticiKaydet();
    kisiTurAyarla(g, ad, Object.assign({ tur: 'misafir', eklenme: bugunISO() }, ek || {}));
    if (geldiIso) {
        if (!otomatikYoklamaDB[geldiIso]) otomatikYoklamaDB[geldiIso] = {};
        otomatikYoklamaDB[geldiIso][ad] = { saat: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), grup: g, elle: true, geldi: true };
        otomatikYoklamaKaydet(); bekleyenGonderim = true; try { bulutaGonderKontrol(); } catch (e) {}
    }
    try { sporcuListesiniYenile(); } catch (e) {}
    return true;
}
function kyMisafirBilgiAc(kk) { let k = kyKeyCoz(kk), key = 'mis:' + kyAnahtar(k.g, k.ad); _ky.duzenle = _ky.duzenle === key ? null : key; kyKisilerCiz(); }
function kyMisafirBilgiKaydet(kk) {
    let k = kyKeyCoz(kk);
    kisiTurAyarla(k.g, k.ad, { tel: (document.getElementById('ky-mis-tel') || {}).value || '', not: (document.getElementById('ky-mis-not') || {}).value || '' });
    _ky.duzenle = null; showToast('Misafir bilgisi kaydedildi.', 'success'); kyKisilerCiz();
}
// yoneticiSil onaydan sonra Sporcular listesini çiziyor — silme tamamlanınca bu sekmeye geri dön.
function kyMisafirSil(kk) {
    let k = kyKeyCoz(kk), n = 0;
    yoneticiSil(k.g, k.ad);
    let iv = setInterval(() => { n++; if (!(turnuvaDB[k.g] || {})[k.ad]) { clearInterval(iv); _ky.duzenle = null; if (yoneticiSekmeAktif === 'kisiler') kyKisilerCiz(); } if (n > 120) clearInterval(iv); }, 400);
}
function kyMisafirAktifYap(kk) {
    let k = kyKeyCoz(kk);
    let secenek = ['buyukler', 'yildizlar', 'kucukler', 'minikler'].map(g => `<button onclick="onayKapat(); kyMisafirAktifYapGrup('${kk}','${g}')" style="background:${g === k.g ? kyGrupRenk(g) + '33' : 'var(--bg-panel)'}; border:1.5px solid ${g === k.g ? kyGrupRenk(g) : 'var(--border-color)'}; color:var(--text-main); padding:11px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer;">${esc(kyGrupAd(g))}${g === k.g ? ' (şu anki)' : ''}</button>`).join('');
    onayIste(`⭐ <b>${esc(k.ad)}</b> aktif sporcu olsun — hangi grupta?<br><span style="font-size:12px; color:var(--text-muted);">Geldiği günler, serileri ve notları aynen korunur.</span><div style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">${secenek}</div>`, null, null);
    setTimeout(() => { let b = document.getElementById('onay-evet-btn'); if (b) b.style.display = 'none'; }, 50);
}
function kyMisafirAktifYapGrup(kk, yeniGrup) {
    let k = kyKeyCoz(kk);
    let bitir = (g, ad) => { kisiTurAyarla(g, ad, { tur: 'sporcu', aktifOldu: bugunISO(), takip: { durum: 'uye', tarih: bugunISO() } }); showToast(`⭐ ${ad} artık aktif sporcu (${kyGrupAd(g)}).`, 'success'); try { sporcuListesiniYenile(); siralamaListesiDoldur(); } catch (e) {} kyKisilerCiz(); };
    if (yeniGrup === k.g) return bitir(k.g, k.ad);
    if (turnuvaDB[yeniGrup] && turnuvaDB[yeniGrup][k.ad]) return showToast(`${k.ad} zaten ${kyGrupAd(yeniGrup)} grubunda var — Çift Kayıt'tan birleştir.`, 'warning');
    // Grup değişimi de veri kaybı olmayan yoldan (sunucuda /rename = birleştirme: seriler/yoklama/aidat taşınır)
    _sporcuYenidenAdlandir(k.g, k.ad, k.ad, yeniGrup).then(() => bitir(yeniGrup, k.ad))
        .catch(e => showToast('Grup değiştirilemedi: ' + (e && e.message ? e.message : 'bağlantı hatası') + ' — hiçbir şey değişmedi.', 'error'));
}

// ---------------------------------------------------------------- 4) derse göre eğitmen yoklaması
let _egDers = kyDepoOku('egitmen_ders_yoklama');
// 400 günden eski ders-eğitmen kayıtlarını at (meta kaydı sınırsız büyümesin).
function egDersBuda(m) {
    let d = new Date(); d.setDate(d.getDate() - 400);
    let sinir = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    let out = {}; Object.keys(m || {}).forEach(k => { if ((m[k].iso || '') >= sinir) out[k] = m[k]; }); return out;
}
function egDersAnahtar(iso, slotId, pid) { return iso + '|' + slotId + '|' + pid; }
function egDersCek(sonra) { kyDepoSenkron('egitmen_ders_yoklama', () => _egDers, false, egDersBuda).then(t => { let yeni = kyDepoBirlestir(t, _egDers), degisti = JSON.stringify(yeni) !== JSON.stringify(_egDers); _egDers = yeni; if (degisti && sonra) sonra(); }).catch(() => {}); }
function egDersGirenler(iso, slotId) {
    let on = iso + '|' + slotId + '|';
    return Object.keys(_egDers).filter(k => k.startsWith(on) && _egDers[k].d === 1).map(k => _egDers[k].pid);
}
function egDersIsaretle(iso, slotId, pid, girdi) {
    _egDers[egDersAnahtar(iso, slotId, pid)] = { iso, slot: slotId, pid, d: girdi ? 1 : 0, t: Date.now() };
    _egDers = egDersBuda(_egDers);
    kyDepoYazYerel('egitmen_ders_yoklama', _egDers);
    kyDepoSenkron('egitmen_ders_yoklama', () => _egDers, true, egDersBuda).then(t => { _egDers = kyDepoBirlestir(t, _egDers); });
    // Derse girdiyse o günün personel girişine de yaz (bordro / Personel sekmesi aynı günü görsün). Çıkarınca
    // günlük kayda dokunulmaz — aynı gün başka derse girmiş ya da Personel'den elle işaretlenmiş olabilir.
    if (girdi && typeof personelYoklamaDB !== 'undefined') {
        let kayit = personelYoklamaDB.find(r => r.tarih === iso);
        if (!kayit) { kayit = { id: 'pyok_' + Date.now(), tarih: iso, gelenler: [], gelmediler: [] }; personelYoklamaDB.push(kayit); }
        kayit.gelenler = kayit.gelenler || []; kayit.gelmediler = (kayit.gelmediler || []).filter(x => x !== pid);
        if (!kayit.gelenler.includes(pid)) kayit.gelenler.push(pid);
        try { personeliKaydet(); } catch (e) {}
        bekleyenGonderim = true; try { bulutaGonderKontrol(); } catch (e) {}
    }
}
function egEgitmenler() { return (typeof personelDB !== 'undefined' ? personelDB : []).filter(p => p && p.id && p.ad); }
function egEgitmenAd(pid) { let p = egEgitmenler().find(x => x.id === pid); return p ? p.ad : '?'; }
function egEgitmenHizliEkle(sonra) {
    let ad = prompt('Eğitmenin adı:'); if (!ad || !ad.trim()) return;
    personelDB.push({ id: 'psn_' + Date.now(), ad: ad.trim(), ucret: '' });
    try { personeliKaydet(); } catch (e) {}
    bekleyenGonderim = true; try { bulutaGonderKontrol(); } catch (e) {}
    showToast(`👔 ${ad.trim()} eğitmen listesine eklendi.`, 'success');
    if (sonra) sonra();
}

// açılışta sunucudan tazele
setTimeout(() => { kisiTurCek(); egDersCek(); }, 2500);

// ---------------------------------------------------------------- 📚 ders başı eğitmen ücreti + bordro (2026-09-28)
// Yönetici › Personel sekmesinin altına eklenir (egitmenRenderPersonel → egBordroHTML). Ders sayısı = Yoklama'da
// "derse giren eğitmen" olarak işaretlenen dersler (egitmen_ders_yoklama); gün sayısı = mevcut personel girişi.
// Ders başı ücret maaş bilgisi → oturumlu meta "personel_ders_ucret" ({pid: {ucret, t}}).
let _egUcret = kyDepoOku('personel_ders_ucret'), _egUcretCekildi = false;
function egUcretCek(sonra) {
    if (!kyOturumVar()) return;
    kyDepoSenkron('personel_ders_ucret', () => _egUcret).then(t => { let y = kyDepoBirlestir(t, _egUcret), d = JSON.stringify(y) !== JSON.stringify(_egUcret); _egUcret = y; if (d && sonra) sonra(); }).catch(() => {});
}
function egDersUcretAyarla(pid, deger) {
    let v = String(deger || '').replace(',', '.').trim();
    _egUcret[pid] = { ucret: v === '' ? '' : Math.max(0, Number(v) || 0), t: Date.now() };
    kyDepoYazYerel('personel_ders_ucret', _egUcret);
    if (kyOturumVar()) kyDepoSenkron('personel_ders_ucret', () => _egUcret, true).then(t => { _egUcret = kyDepoBirlestir(t, _egUcret); });
    try { egitmenRenderPersonel(); } catch (e) {}
}
function egAyDersleri(pid, ay) {
    let slotlar = (typeof _programSlotlar !== 'undefined' && _programSlotlar && _programSlotlar.length) ? _programSlotlar : ((typeof _kmYa !== 'undefined' && _kmYa.slotlar) || []);
    return Object.values(_egDers).filter(x => x.d === 1 && x.pid === pid && (x.iso || '').slice(0, 7) === ay)
        .map(x => ({ iso: x.iso, s: slotlar.find(s => s.id === x.slot) || null }))
        .sort((a, b) => a.iso.localeCompare(b.iso) || String(a.s && a.s.baslangicSaat).localeCompare(String(b.s && b.s.baslangicSaat)));
}
function egBordroSatirlari(ay) {
    return egEgitmenler().map(p => {
        let dersler = egAyDersleri(p.id, ay), gun = typeof personelStats === 'function' ? personelStats(p.id, ay).ay : 0;
        let dUcret = _egUcret[p.id] && _egUcret[p.id].ucret !== '' ? Number(_egUcret[p.id].ucret) || 0 : 0, gUcret = Number(p.ucret) || 0;
        return { p, dersler, gun, dUcret, gUcret, gunTop: gun * gUcret, dersTop: dersler.length * dUcret, top: gun * gUcret + dersler.length * dUcret };
    });
}
function egPara(n, tl) { return (Math.round(n * 100) / 100).toLocaleString('tr-TR') + (tl ? ' TL' : '₺'); }
function egBordroHTML(ay) {
    if (!_egUcretCekildi) { _egUcretCekildi = true; let yen = () => { try { if (yoneticiSekmeAktif === 'personel') egitmenRenderPersonel(); } catch (e) {} }; egUcretCek(yen); egDersCek(yen); }
    let satir = egBordroSatirlari(ay), genel = satir.reduce((a, x) => a + x.top, 0);
    let ayAd = new Date(ay + '-15T12:00:00').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    return `<details open style="margin-top:6px; margin-bottom:8px;">
        <summary style="cursor:pointer; list-style:none; background:var(--bg-panel); border:1px solid var(--border-color); border-radius:14px; padding:12px 14px; font-weight:800; font-size:13px;">📚 Ders bazlı ücret — ${esc(ayAd)} <span style="float:right; color:var(--text-muted);">▾</span></summary>
        <div class="adm-card" style="border-radius:0 0 14px 14px; margin-top:-2px; margin-bottom:0;">
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:10px; line-height:1.5;">Ders sayısı, <b>Karışık Sınıf › Yoklama</b>'da derse giren eğitmen olarak işaretlenen derslerden gelir. Günlük ücret ve ders başı ücret birlikte kullanılabilir; kullanmadığını boş bırak.</div>
            ${satir.map(x => `<div style="display:grid; grid-template-columns:minmax(0,1.3fr) auto auto; gap:8px 12px; align-items:center; padding:10px 0; border-top:1px solid var(--border-color);">
                <div style="min-width:0"><div style="font-weight:800;">${esc(x.p.ad)}</div><div style="font-size:11px; color:var(--text-muted);">${x.dersler.length} ders · ${x.gun} gün${x.gUcret ? ' · günlük ' + egPara(x.gUcret) : ''}</div></div>
                <label style="display:flex; flex-direction:column; gap:2px; font-size:10px; color:var(--text-muted);">Ders başı ₺<input type="number" min="0" step="10" inputmode="decimal" value="${_egUcret[x.p.id] ? esc(String(_egUcret[x.p.id].ucret)) : ''}" onchange="egDersUcretAyarla('${String(x.p.id).replace(/['"\\]/g, '')}', this.value)" class="adm-input" style="width:100px; padding:8px;"></label>
                <div style="text-align:right;"><div style="font-weight:900; font-size:15px; color:var(--neon-green);">${egPara(x.top)}</div><div style="font-size:10px; color:var(--text-muted);">${x.gunTop ? egPara(x.gunTop) + ' gün' : ''}${x.gunTop && x.dersTop ? ' + ' : ''}${x.dersTop ? egPara(x.dersTop) + ' ders' : ''}</div></div>
            </div>`).join('') || '<div style="font-size:12px; color:var(--text-muted);">Önce yukarıdan eğitmen ekle.</div>'}
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; padding-top:10px; border-top:1px solid var(--border-color);">
                <b>Genel toplam: <span style="color:var(--neon-green);">${egPara(genel)}</span></b>
                <button onclick="egBordroPdf('${ay}')" class="adm-btn" style="background:var(--accent-orange); color:#fff; border:none;">📄 Ders bazlı bordro PDF</button>
            </div></div></details>`;
}
function egBordroPdf(ay) {
    if (typeof _yeniPdfAl !== 'function') return showToast('PDF altyapısı yüklenemedi.', 'error');
    const T = s => _trTranslit(String(s == null ? '' : s));
    let satir = egBordroSatirlari(ay), ayAd = new Date(ay + '-15T12:00:00').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    _yeniPdfAl('portrait').then(pdf => {
        const W = 210, H = 297, M = 14, UW = W - M * 2;
        const font = (st, b, c) => { pdf.setFont('helvetica', st); pdf.setFontSize(b); c = c || [15, 23, 42]; pdf.setTextColor(c[0], c[1], c[2]); };
        const yaz = (t, x, yy, o) => pdf.text(T(t), x, yy, o || {});
        let y = _kurumsalBaslikCiz(pdf, M, UW, 8, 'EGITMEN BORDROSU', 'Ders bazli - ' + ayAd);
        const yeni = () => { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, 'F'); y = 16; };
        const bas = () => {
            pdf.setFillColor(241, 245, 249); pdf.rect(M, y, UW, 7, 'F'); font('bold', 7.5, [71, 85, 105]);
            yaz('EGITMEN', M + 2, y + 4.8); yaz('GUN', M + 64, y + 4.8); yaz('GUNLUK', M + 80, y + 4.8); yaz('DERS', M + 106, y + 4.8); yaz('DERS BASI', M + 122, y + 4.8); yaz('TOPLAM', M + UW - 2, y + 4.8, { align: 'right' });
            y += 9;
        };
        bas();
        satir.forEach((x, n) => {
            if (y > H - 30) { yeni(); bas(); }
            if (n % 2) { pdf.setFillColor(250, 251, 253); pdf.rect(M, y - 1.5, UW, 7.5, 'F'); }
            font('bold', 9); yaz(x.p.ad, M + 2, y + 3.5);
            font('normal', 9); yaz(String(x.gun), M + 64, y + 3.5); yaz(x.gUcret ? egPara(x.gUcret, 1) : '-', M + 80, y + 3.5); yaz(String(x.dersler.length), M + 106, y + 3.5); yaz(x.dUcret ? egPara(x.dUcret, 1) : '-', M + 122, y + 3.5);
            font('bold', 9.5, [22, 163, 74]); yaz(egPara(x.top, 1), M + UW - 2, y + 3.5, { align: 'right' });
            y += 7.5;
        });
        pdf.setDrawColor(203, 213, 225); pdf.line(M, y, M + UW, y); y += 6;
        font('bold', 11); yaz('Genel toplam', M + 2, y); font('bold', 11, [22, 163, 74]); yaz(egPara(satir.reduce((a, x) => a + x.top, 0), 1), M + UW - 2, y, { align: 'right' }); y += 10;
        satir.filter(x => x.dersler.length).forEach(x => {
            if (y > H - 30) yeni();
            font('bold', 9.5); yaz(x.p.ad + ' - girdigi dersler (' + x.dersler.length + ')', M, y); y += 5;
            font('normal', 8, [71, 85, 105]);
            let metin = x.dersler.map(d => new Date(d.iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + (d.s ? ' ' + d.s.baslangicSaat + ' ' + (d.s.grup || '') : '')).join(', ');
            pdf.splitTextToSize(T(metin), UW - 4).forEach(l => { if (y > H - 18) yeni(); pdf.text(l, M + 2, y); y += 4; });
            y += 3;
        });
        _kurumsalAltBilgiCiz(pdf, W, H);
        pdf.save('Egitmen_Bordrosu_Ders_' + ay + '.pdf');
        showToast('Bordro PDF indirildi! 📄', 'success');
    }).catch(() => showToast('PDF oluşturulamadı.', 'error'));
}
