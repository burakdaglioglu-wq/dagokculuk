/* 🪪 Eğitmen & Misafir · personel (2026-10-21) — Yönetici › PERSONEL. Kullanıcı: "Eğitmen & Misafir'de isme tıklayınca
   bilgilerini düzeltebileyim, eğitmen için ne gerekliyse onu koy, eğitmene verilen / alınan parayı da girebileyim ama para
   mevzularında şifre iste; Eğitmen Panosu'nu kaldır ya da eğitmen takibine dönüştür (dünyada nasıl yapılıyorsa)".
   Kulüp yazılımlarının (Mindbody, TeamUp, Glofox) personel düzeni: kadro listesi → kişi profili (rol, çalışma şekli, belgeler
   ve bitiş uyarısı, verdiği dersler, ücret modeli, ödeme defteri). Eski "Personel" (günlük giriş + bordro) 💰 sekmesine katıldı.
   Veri:
     personelDB                  [{ id, ad, ucret(günlük ₺) }]   — mevcut kadro listesi (bulut yükü + /api/personnel)
     meta personel_bilgi         { pid: { rol, tel, eposta, calisma, baslama, gruplar, acil, durum, izinBitis, not, sporcu, belgeler, aylik, iban, t } }
     meta personel_odeme         { oid: { pid, tarih, tutar, tur: verilen|alinan, aciklama, t, sil } }
     meta personel_ders_ucret    { pid: { ucret, t } } (dagsk-kisi-yonetimi.js) · egitmen_ders_yoklama → verdiği dersler
   personel_bilgi / personel_odeme oturumlu meta (src/routes/meta.ts); para alanları ekranda aidat PIN'i ile açılır. */
const PS = { sekme: 'egitmen', profil: null, duzen: false, ay: null, belgeForm: false, odemeForm: false, cekildi: false, slotlar: null };
// sekme, eski ekranın _ky.kisiSekme'siyle tek değer (misafir/tür işlemleri ve eski çağrılar onu ayarlıyor)
delete PS.sekme;
Object.defineProperty(PS, 'sekme', { get() { let s = typeof _ky !== 'undefined' ? _ky.kisiSekme : ''; return ['misafir', 'ata', 'para'].includes(s) ? s : 'egitmen'; }, set(v) { if (typeof _ky !== 'undefined') _ky.kisiSekme = v; } });
let _psBilgi = kyDepoOku('personel_bilgi'), _psOdeme = kyDepoOku('personel_odeme');
const PS_ROL = [['bas', 'Baş antrenör'], ['antrenor', 'Antrenör'], ['yardimci', 'Yardımcı antrenör'], ['stajyer', 'Stajyer'], ['ofis', 'Yönetim / ofis']];
const PS_CALISMA = [['tam', 'Tam zamanlı'], ['yari', 'Yarı zamanlı'], ['ders', 'Ders başı'], ['gonullu', 'Gönüllü']];
const PS_DURUM = [['aktif', 'Aktif'], ['izinli', 'İzinli'], ['ayrildi', 'Ayrıldı']];
const PS_GUN = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const psEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const psJs = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const psTl = n => (Math.round((n || 0) * 100) / 100).toLocaleString('tr-TR') + ' ₺';
const psIso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const psTR = iso => iso ? String(iso).slice(0, 10).split('-').reverse().join('.') : '—';
const psSecAd = (l, v) => { let x = l.find(y => y[0] === v); return x ? x[1] : ''; };
const psParaAcik = () => typeof _aidatKilitAcikMi !== 'undefined' && !!_aidatKilitAcikMi;

// ---- veri ----
function psListe() { return (typeof personelDB !== 'undefined' ? personelDB : []).filter(p => p && p.id && p.ad); }
function psBul(pid) { return psListe().find(p => p.id === pid) || null; }
function psB(pid) { let b = _psBilgi[pid]; return b && !b.sil ? b : {}; }
function psBilgiYaz(pid, alanlar) {
    _psBilgi[pid] = Object.assign({}, psB(pid), alanlar, { t: Date.now() });
    kyDepoYazYerel('personel_bilgi', _psBilgi);
    if (kyOturumVar()) kyDepoSenkron('personel_bilgi', () => _psBilgi, true).then(t => { _psBilgi = kyDepoBirlestir(t, _psBilgi); }).catch(() => {});
}
function psOdemeler(pid) { return Object.keys(_psOdeme).map(id => Object.assign({ id }, _psOdeme[id])).filter(o => !o.sil && (!pid || o.pid === pid)).sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)) || (b.t || 0) - (a.t || 0)); }
function psOdemeYaz(id, kayit) {
    _psOdeme[id] = Object.assign({}, kayit, { t: Date.now() });
    kyDepoYazYerel('personel_odeme', _psOdeme);
    if (kyOturumVar()) kyDepoSenkron('personel_odeme', () => _psOdeme, true).then(t => { _psOdeme = kyDepoBirlestir(t, _psOdeme); }).catch(() => {});
}
function psCek() {
    if (!kyOturumVar()) return;
    let yen = () => { if (typeof yoneticiSekmeAktif !== 'undefined' && yoneticiSekmeAktif === 'kisiler') psCiz(); };
    kyDepoSenkron('personel_bilgi', () => _psBilgi).then(t => { let y = kyDepoBirlestir(t, _psBilgi), d = JSON.stringify(y) !== JSON.stringify(_psBilgi); _psBilgi = y; if (d) yen(); }).catch(() => {});
    kyDepoSenkron('personel_odeme', () => _psOdeme).then(t => { let y = kyDepoBirlestir(t, _psOdeme), d = JSON.stringify(y) !== JSON.stringify(_psOdeme); _psOdeme = y; if (d) yen(); }).catch(() => {});
    try { egUcretCek(yen); egDersCek(yen); } catch (e) {}
}
function psBuAy() { return psIso(new Date()).slice(0, 7); }
function psHaftaGunleri() { let d = new Date(), g = (d.getDay() + 6) % 7; d.setDate(d.getDate() - g); let l = []; for (let i = 0; i < 7; i++) { l.push(psIso(d)); d.setDate(d.getDate() + 1); } return l; }
function psDersSay(pid, gunler) { return Object.values(typeof _egDers !== 'undefined' ? _egDers : {}).filter(x => x && x.d === 1 && x.pid === pid && gunler.indexOf(x.iso) !== -1).length; }
// belge durumu: bitişi geçmiş / 30 gün içinde / geçerli
function psBelgeDurum(b) {
    if (!b.bitis) return { cls: 'i', metin: 'var', gun: null };
    let gun = Math.round((new Date(b.bitis + 'T12:00:00') - new Date(psIso(new Date()) + 'T12:00:00')) / 864e5);
    if (gun < 0) return { cls: 'k', metin: 'süresi geçti', gun };
    if (gun <= 30) return { cls: 'u', metin: psTR(b.bitis) + ' · ' + gun + ' gün', gun };
    return { cls: 'i', metin: psTR(b.bitis) + "'e kadar", gun };
}
function psBelgeOzet(pid) {
    let l = (psB(pid).belgeler || []).filter(b => b && !b.sil);
    if (!l.length) return { cls: 'k', metin: 'Belge yok', uyari: 0 };
    let d = l.map(psBelgeDurum), kotu = d.filter(x => x.cls === 'k').length, yakin = d.filter(x => x.cls === 'u');
    if (kotu) return { cls: 'k', metin: kotu + ' belgenin süresi geçti', uyari: kotu };
    if (yakin.length) return { cls: 'u', metin: yakin.length + ' bitiyor · ' + Math.min(...yakin.map(x => x.gun)) + ' gün', uyari: yakin.length };
    return { cls: 'i', metin: l.length + ' geçerli', uyari: 0 };
}
// hakediş: ders başı × verdiği ders + günlük × geldiği gün + aylık sabit
function psHakedis(p, ay) {
    let dersler = typeof egAyDersleri === 'function' ? egAyDersleri(p.id, ay) : [];
    let gun = typeof personelStats === 'function' ? personelStats(p.id, ay).ay : 0;
    let u = typeof _egUcret !== 'undefined' && _egUcret[p.id] && _egUcret[p.id].ucret !== '' ? Number(_egUcret[p.id].ucret) || 0 : 0;
    let gU = Number(p.ucret) || 0, aylik = Number(psB(p.id).aylik) || 0;
    let od = psOdemeler(p.id).filter(o => String(o.tarih).slice(0, 7) === ay);
    let verilen = od.filter(o => o.tur !== 'alinan').reduce((a, o) => a + (Number(o.tutar) || 0), 0), alinan = od.filter(o => o.tur === 'alinan').reduce((a, o) => a + (Number(o.tutar) || 0), 0);
    let top = dersler.length * u + gun * gU + aylik;
    return { dersler, gun, u, gU, aylik, top, verilen, alinan, kalan: top - verilen };
}
function psDurumEtk(b) {
    if (b.durum === 'ayrildi') return '<span class="ap-etk k">Ayrıldı</span>';
    if (b.durum === 'izinli') return '<span class="ap-etk u">İzinli' + (b.izinBitis ? ' · ' + psTR(b.izinBitis) + "'e kadar" : '') + '</span>';
    return '<span class="ap-etk i">Aktif</span>' + (b.calisma && b.calisma !== 'tam' ? ' <span class="ap-etk m">' + psEsc(psSecAd(PS_CALISMA, b.calisma)) + '</span>' : '');
}
function psBas(ad) { return String(ad || '?').trim().split(/\s+/).slice(0, 2).map(x => x.charAt(0)).join('').toLocaleUpperCase('tr-TR'); }
function psTel(t) { return typeof telefonWaFormat === 'function' ? telefonWaFormat(t) : String(t || '').replace(/\D/g, ''); }

// ---- ekran ----
function psCss() {
    if (document.getElementById('ps-css')) return;
    let s = document.createElement('style'); s.id = 'ps-css';
    s.textContent = `
.ap .ps-sekmeler{display:flex;gap:4px;border-bottom:1px solid var(--ap-cizgi);flex-wrap:wrap}
.ap .ps-sekmeler button{font:inherit;background:none;border:0;border-bottom:2px solid transparent;padding:9px 12px;cursor:pointer;color:var(--ap-soluk);font-weight:700;font-size:13px;transform:none!important}
.ap .ps-sekmeler button[aria-pressed=true]{color:#f0c860;border-color:var(--ap-vurgu)}
.ap .ps-av{width:30px;height:30px;border-radius:9px;display:inline-grid;place-items:center;font-weight:700;font-size:12px;background:#1d2c40;color:#5aa9ff;flex:none}
.ap .ps-kisi{display:flex;align-items:center;gap:8px;min-width:0}
.ap .ps-hafta{display:grid;grid-template-columns:58px repeat(7,minmax(0,1fr));gap:3px;font-size:11.5px;min-width:560px}
.ap .ps-hafta>div{padding:5px;border-radius:6px;background:var(--ap-kart2);min-height:30px;overflow:hidden}
.ap .ps-hafta .h{background:none;color:var(--ap-soluk);font-weight:700;text-align:center;min-height:0}
.ap .ps-hafta .h.bugun{color:#f0c860}
.ap .ps-hafta .s{background:none;color:var(--ap-soluk);font-variant-numeric:tabular-nums}
.ap .ps-hafta .d{background:rgba(90,169,255,.13);color:#5aa9ff;font-weight:600}
.ap .ps-hafta .bos{background:transparent}
.ap .ps-satir{display:flex;gap:8px;align-items:center;padding:8px 0;border-top:1px solid var(--ap-cizgi);font-size:13px;flex-wrap:wrap}.ap .ps-satir:first-child{border-top:0}
.ap .ps-satir .sag{margin-left:auto;display:flex;gap:6px;align-items:center}
.ap .ps-form{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;background:var(--ap-kart2);border-radius:8px;padding:10px;margin-top:8px}
.ap .ps-form label{font-size:12px;color:var(--ap-soluk);display:flex;flex-direction:column;gap:3px}
.ap .ps-form input,.ap .ps-form select{font:inherit;font-size:13px;padding:8px 10px;border-radius:8px;border:1px solid var(--ap-cizgi);background:var(--ap-zemin);color:var(--ap-yazi);min-height:36px;color-scheme:dark}
.ap .ps-kilit{display:flex;flex-direction:column;align-items:center;gap:8px;padding:18px 10px;text-align:center;color:var(--ap-soluk)}
.ap .ps-kilit input{font:inherit;padding:8px 10px;border-radius:8px;border:1px solid var(--ap-cizgi);background:var(--ap-zemin);color:var(--ap-yazi);width:150px}
.ap .ps-para td.g{color:var(--ap-kotu)}.ap .ps-para td.a{color:var(--ap-iyi)}
.ap .ps-not{font-size:12.5px;color:var(--ap-soluk);line-height:1.45}
.ap input[type=month],.ap .ap-filtre label input{font:inherit;font-size:13px;padding:7px 10px;border-radius:8px;border:1px solid var(--ap-cizgi);background:var(--ap-kart);color:var(--ap-yazi);min-height:36px;color-scheme:dark}
.ap .ap-filtre>label{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--ap-soluk)}`;
    document.head.appendChild(s);
}
function psKap() { return document.getElementById('yonetici-liste'); }
function psCiz() {
    let alan = psKap(); if (!alan) return;
    if (typeof ynKulup !== 'function' && typeof dagskEkYukle === 'function') { alan.innerHTML = '<div style="padding:30px;text-align:center;color:var(--text-muted)">Yükleniyor…</div>'; dagskEkYukle(YN_DOSYA).then(psCiz).catch(() => {}); return; }
    try { ynKulup(dagYonetimAdaptor()); } catch (e) {}
    psCss(); try { kyCss(); } catch (e) {}
    renderHedefId = 'ps-bordro'; // eski Personel kodu (egitmenRenderPersonel) değişiklikten sonra buraya çizer — sekme dışındayken gizli kutuya
    if (!PS.cekildi) { PS.cekildi = true; psCek(); try { kisiTurCek(() => { if (yoneticiSekmeAktif === 'kisiler') psCiz(); }); } catch (e) {} }
    let tum = typeof kyTumKisiler === 'function' ? kyTumKisiler() : [];
    let mis = tum.filter(x => kisiTuru(x.g, x.ad) === 'misafir');
    let s = PS.sekme, kadro = psListe();
    let sek = (id, ad) => `<button aria-pressed="${s === id}" onclick="PS.sekme='${id}'; psCiz()">${ad}</button>`;
    let govde = s === 'misafir' ? `<div class="ky">${kyMisafirHTML(mis)}</div>` : s === 'ata' ? `<div class="ky">${kyTurAtaHTML(tum)}</div>` : s === 'para' ? psParaHTML() : psEgitmenHTML(kadro, tum);
    alan.innerHTML = `<div class="ap ps" id="ps-ekran">
        <div class="ap-bas"><div><h2>🪪 Eğitmen &amp; Misafir</h2><small>İsme dokun → profil (bilgiler, belgeler, dersler, ücret). Para bilgileri aidat PIN'i ile açılır.</small></div>
            <div class="ap-araclar"><button class="ap-btn ana" onclick="psEkle()">＋ Eğitmen ekle</button><button class="ap-btn" onclick="PS.sekme='misafir'; _ky.misafirForm=true; psCiz()">＋ Misafir ekle</button></div></div>
        <div class="ps-sekmeler">${sek('egitmen', `👔 Eğitmenler (${kadro.length})`)}${sek('misafir', `🎟️ Misafirler (${mis.length})`)}${sek('para', '💰 Ödemeler & bordro ' + (psParaAcik() ? '🔓' : '🔒'))}${sek('ata', '🔎 Tür ata')}</div>
        ${govde}
    </div>`;
    if (!document.getElementById('ps-bordro')) alan.insertAdjacentHTML('beforeend', '<div id="ps-bordro" hidden></div>');
    if (s === 'para' && psParaAcik()) psBordroCiz();
    if (s === 'egitmen') psHaftaCiz();
}
function psEgitmenHTML(kadro, tum) {
    let hafta = psHaftaGunleri(), ay = psBuAy(), acik = psParaAcik();
    let aktif = kadro.filter(p => psB(p.id).durum !== 'ayrildi');
    let haftaDers = aktif.reduce((a, p) => a + psDersSay(p.id, hafta), 0);
    let belgeUyari = aktif.filter(p => psBelgeOzet(p.id).uyari).length;
    let hak = acik ? aktif.reduce((a, p) => a + psHakedis(p, ay).top, 0) : null;
    let kpi = `<div class="ap-kpi">
        <div><small>Eğitmen</small><b>${aktif.length}</b><span>${aktif.filter(p => psB(p.id).durum === 'izinli').length} izinli · ${kadro.length - aktif.length} ayrıldı</span></div>
        <div><small>Bu hafta ders</small><b>${haftaDers}</b><span>Yoklama'da işaretlenen</span></div>
        <div class="${belgeUyari ? 'uyari' : ''}"><small>Belge uyarısı</small><b>${belgeUyari}</b><span>eksik ya da 30 gün içinde bitiyor</span></div>
        <div><small>Bu ay hakediş</small><b>${acik ? psTl(hak) : '🔒'}</b><span>${acik ? 'ders + gün + aylık' : 'aidat PIN\'i ile görünür'}</span></div></div>`;
    let satir = kadro.slice().sort((a, b) => (psB(a.id).durum === 'ayrildi') - (psB(b.id).durum === 'ayrildi') || a.ad.localeCompare(b.ad, 'tr')).map(p => {
        let b = psB(p.id), bo = psBelgeOzet(p.id);
        return `<tr onclick="psProfilAc('${psJs(p.id)}')"><td><span class="ps-kisi"><span class="ps-av">${psEsc(psBas(p.ad))}</span><b class="yn-isim">${psEsc(p.ad)}</b></span></td><td>${psEsc(psSecAd(PS_ROL, b.rol) || '—')}</td><td>${psEsc(b.tel || '—')}</td><td class="sag ap-num">${psDersSay(p.id, hafta)}</td><td><span class="ap-etk ${bo.cls}">${psEsc(bo.metin)}</span></td><td>${psDurumEtk(b)}</td></tr>`;
    }).join('');
    let liste = kadro.length ? `<div class="yn-tablo-kap"><table class="yn-tablo"><thead><tr><th>Ad</th><th>Rol</th><th>Telefon</th><th class="sag">Bu hafta</th><th>Belgeler</th><th>Durum</th></tr></thead><tbody>${satir}</tbody></table></div>`
        : '<div class="yn-bos">Henüz eğitmen yok. Üstten <b>＋ Eğitmen ekle</b>.</div>';
    // sporcu kaydıyla atış yapan eğitmenler (kişi türü: eğitmen) — adına dokununca sporcu profili
    let atan = tum.filter(x => kisiTuru(x.g, x.ad) === 'egitmen').sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    let atanHTML = atan.length ? atan.map(x => `<div class="ps-satir"><span class="ps-av">${psEsc(psBas(x.ad))}</span><span class="yn-isim" data-sporcu="${psEsc(x.g + '|' + x.ad)}">${psEsc(x.ad)}</span><span class="ps-not">${psEsc(typeof kyGrupAd === 'function' ? kyGrupAd(x.g) : x.g)}</span><span class="sag"><button class="ap-btn" onclick="kyTurDegistir('${kyKaydirKey(x.g, x.ad)}','sporcu')">🎯 Öğrenci yap</button></span></div>`).join('')
        : '<div class="yn-bos">Eğitmen olarak işaretlenmiş sporcu kaydı yok. <b>🔎 Tür ata</b> sekmesinden kendi kaydını eğitmen yap.</div>';
    return `${kpi}<div class="ap-panel"><h3>Kadro <span>satıra dokun → profil</span></h3>${liste}</div>
        <div class="ap-panel"><h3>Bu hafta kim hangi derste <span>Yoklama'da “derse giren eğitmen” işaretlenince dolar</span></h3><div class="yn-tablo-kap" id="ps-hafta"><div class="yn-bos">Ders programı yükleniyor…</div></div></div>
        <div class="ap-panel"><h3>🎯 Atış kaydı olan eğitmenler <span>sporcu kaydıyla ok atanlar · öğrenci sayısına katılmaz · adına dokun → profil</span></h3>${atanHTML}</div>`;
}
function psSlotlar() {
    if (typeof _programSlotlar !== 'undefined' && _programSlotlar && _programSlotlar.length) return Promise.resolve(_programSlotlar);
    if (PS.slotlar) return Promise.resolve(PS.slotlar);
    return fetch('/api/antrenman-programi').then(r => r.json()).then(d => { PS.slotlar = d.slots || []; try { if (!_programSlotlar.length) _programSlotlar = PS.slotlar; } catch (e) {} return PS.slotlar; }).catch(() => []);
}
function psHaftaCiz() {
    psSlotlar().then(sl => {
        let el = document.getElementById('ps-hafta'); if (!el) return;
        if (!sl.length) { el.innerHTML = '<div class="yn-bos">Ders programında ders yok.</div>'; return; }
        let gunler = psHaftaGunleri(), bugun = psIso(new Date());
        let saatler = [...new Set(sl.map(s => s.baslangicSaat))].sort();
        let h = '<div class="ps-hafta"><div class="h"></div>' + gunler.map((g, i) => `<div class="h${g === bugun ? ' bugun' : ''}">${PS_GUN[i]} ${+g.slice(8)}</div>`).join('');
        saatler.forEach(saat => {
            h += `<div class="s">${psEsc(saat)}</div>`;
            gunler.forEach(iso => {
                let gn = new Date(iso + 'T12:00:00').getDay();
                let o = sl.filter(s => s.baslangicSaat === saat && (s.gunler || [s.gun]).includes(gn));
                if (!o.length) { h += '<div class="bos"></div>'; return; }
                let ic = o.map(s => { let ad = (typeof egDersGirenler === 'function' ? egDersGirenler(iso, s.id) : []).map(pid => (psBul(pid) || {}).ad).filter(Boolean); return `<div title="${psEsc(s.grup || '')}">${psEsc(s.grup || 'Ders')}${ad.length ? ' · <b>' + ad.map(a => psEsc(a.split(' ')[0])).join(', ') + '</b>' : iso <= bugun ? ' · <i style="opacity:.6">işaretsiz</i>' : ''}</div>`; }).join('');
                h += `<div class="${o.some(s => (typeof egDersGirenler === 'function' ? egDersGirenler(iso, s.id) : []).length) ? 'd' : ''}">${ic}</div>`;
            });
        });
        el.innerHTML = h + '</div>';
    });
}
function psEkle() {
    girdiIste('👔 Yeni eğitmenin adı soyadı:', '', ad => {
        ad = String(ad || '').replace(/\s+/g, ' ').trim(); if (!ad) return;
        if (psListe().some(p => p.ad.toLocaleLowerCase('tr') === ad.toLocaleLowerCase('tr'))) return showToast(ad + ' zaten kadroda.', 'warning');
        let id = 'psn_' + Date.now();
        personelDB.push({ id, ad, ucret: '' });
        try { personeliKaydet(); } catch (e) {}
        bekleyenGonderim = true; try { bulutaGonderKontrol(); } catch (e) {}
        psBilgiYaz(id, { durum: 'aktif', baslama: psIso(new Date()) });
        PS.sekme = 'egitmen'; psCiz(); psProfilAc(id, true);
        showToast('👔 ' + ad + ' kadroya eklendi — bilgilerini doldur', 'success');
    });
}

// ---- 💰 ödemeler & bordro (PIN) ----
function psKilitHTML(ne) {
    return `<div class="ps-kilit"><div style="font-size:26px">🔒</div><div>${ne} kilitli. Aidat PIN'i ile aç (sekme değişince yeniden kilitlenir).</div>
        <div class="ap-araclar"><input type="password" id="ps-pin" placeholder="PIN" autocomplete="off" inputmode="numeric" onkeydown="if(event.key==='Enter') psPinAc()"><button class="ap-btn ana" onclick="psPinAc()">🔓 Göster</button></div></div>`;
}
async function psPinAc() {
    let el = document.getElementById('ps-pin'), pin = el ? el.value.trim() : '';
    if (!pin) return showToast('PIN gir.', 'error');
    if (await aidatKilitAc(pin)) { if (PS.profil) psProfilCiz(); psCiz(); }
    else if (el) { el.value = ''; el.focus(); }
}
function psParaHTML() {
    if (!psParaAcik()) return `<div class="ap-panel">${psKilitHTML('Ödemeler ve bordro')}</div>`;
    let ay = PS.ay || psBuAy(), kadro = psListe().filter(p => psB(p.id).durum !== 'ayrildi' || psOdemeler(p.id).some(o => String(o.tarih).slice(0, 7) === ay));
    let sat = kadro.map(p => ({ p, h: psHakedis(p, ay) }));
    let top = sat.reduce((a, x) => ({ hak: a.hak + x.h.top, ver: a.ver + x.h.verilen, al: a.al + x.h.alinan }), { hak: 0, ver: 0, al: 0 });
    let od = psOdemeler().filter(o => String(o.tarih).slice(0, 7) === ay);
    return `<div class="ap-filtre"><label>Ay <input type="month" value="${ay}" onchange="PS.ay=this.value; psCiz()"></label><span class="ps-not">Hakediş = ders başı × Yoklama'da girdiği ders + günlük × geldiği gün + aylık sabit</span></div>
        <div class="ap-kpi"><div><small>Hakediş</small><b>${psTl(top.hak)}</b><span>${sat.length} eğitmen</span></div><div class="iyi"><small>Ödenen</small><b>${psTl(top.ver)}</b><span>verilen</span></div>
            <div class="${top.hak - top.ver > 0 ? 'kotu' : ''}"><small>Kalan</small><b>${psTl(top.hak - top.ver)}</b><span>ay sonu</span></div><div><small>Alınan</small><b>${psTl(top.al)}</b><span>eğitmenden kulübe</span></div></div>
        <div class="ap-panel"><h3>Eğitmen bazında <span>satıra dokun → profil</span></h3>${sat.length ? `<div class="yn-tablo-kap"><table class="yn-tablo"><thead><tr><th>Eğitmen</th><th class="sag">Ders</th><th class="sag">Gün</th><th class="sag">Hakediş</th><th class="sag">Ödenen</th><th class="sag">Kalan</th></tr></thead><tbody>
            ${sat.map(x => `<tr onclick="psProfilAc('${psJs(x.p.id)}')"><td><b class="yn-isim">${psEsc(x.p.ad)}</b></td><td class="sag ap-num">${x.h.dersler.length}</td><td class="sag ap-num">${x.h.gun}</td><td class="sag ap-num">${psTl(x.h.top)}</td><td class="sag ap-num">${psTl(x.h.verilen)}</td><td class="sag ap-num" style="color:${x.h.kalan > 0 ? 'var(--ap-kotu)' : 'var(--ap-iyi)'}">${psTl(x.h.kalan)}</td></tr>`).join('')}</tbody></table></div>` : '<div class="yn-bos">Eğitmen yok.</div>'}</div>
        <div class="ap-panel"><h3>Ödeme defteri · ${psEsc(new Date(ay + '-15T12:00:00').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }))} <span>ödeme eklemek için eğitmenin profiline gir</span></h3>${psDefterHTML(od, true)}</div>
        <div class="ap-panel"><h3>Günlük giriş &amp; bordro <span>eski Personel ekranı · geldiği günler ve günlük/ders ücreti</span></h3><div id="ps-bordro"></div></div>`;
}
function psDefterHTML(od, adli) {
    if (!od.length) return '<div class="yn-bos">Bu dönemde ödeme kaydı yok.</div>';
    return `<div class="yn-tablo-kap"><table class="yn-tablo ps-para"><thead><tr><th>Tarih</th>${adli ? '<th>Eğitmen</th>' : ''}<th>Açıklama</th><th>Tür</th><th class="sag">Tutar</th><th class="sag yn-pdf-gizle"></th></tr></thead><tbody>
        ${od.map(o => `<tr style="cursor:default"><td class="ap-num">${psTR(o.tarih)}</td>${adli ? `<td>${psEsc((psBul(o.pid) || {}).ad || '?')}</td>` : ''}<td style="white-space:normal">${psEsc(o.aciklama || '')}</td><td>${o.tur === 'alinan' ? '<span class="ap-etk i">Alınan</span>' : '<span class="ap-etk k">Verilen</span>'}</td><td class="sag ap-num ${o.tur === 'alinan' ? 'a' : 'g'}">${o.tur === 'alinan' ? '+' : '−'}${psTl(o.tutar)}</td><td class="sag yn-pdf-gizle"><button class="ap-btn" onclick="psOdemeSil('${psJs(o.id)}')" aria-label="Ödemeyi sil">🗑</button></td></tr>`).join('')}</tbody></table></div>`;
}
function psBordroCiz() {
    if (!document.getElementById('ps-bordro') || typeof egitmenRenderPersonel !== 'function') return;
    renderHedefId = 'ps-bordro';
    try { egitmenRenderPersonel(); } catch (e) {}
}
function psOdemeSil(id) {
    let o = _psOdeme[id]; if (!o) return;
    onayIste(`${psTR(o.tarih)} · ${psTl(o.tutar)} ${o.tur === 'alinan' ? 'alınan' : 'verilen'} ödeme silinsin mi?`, () => {
        psOdemeYaz(id, Object.assign({}, o, { sil: true })); showToast('Ödeme silindi.', 'success');
        if (PS.profil) psProfilCiz(); if (yoneticiSekmeAktif === 'kisiler') psCiz();
    }, '🗑 Sil');
}

// ---- 👤 eğitmen profili (sporcu profiliyle aynı düzen: solda kimlik, sağda özet · bilgiler · belgeler · dersler · ücret) ----
function psProfilAc(pid, duzen) {
    PS.profil = pid; PS.duzen = !!duzen; PS.belgeForm = false; PS.odemeForm = false; PS.ay = PS.ay || psBuAy();
    let a = document.getElementById('ps-profil');
    if (!a) { a = document.createElement('div'); a.id = 'ps-profil'; a.className = 'yn-profil-arka'; document.body.appendChild(a); }
    document.addEventListener('keydown', psEsc2);
    psProfilCiz(); a.scrollTop = 0;
}
function psEsc2(e) { if (e.key === 'Escape' && !PS.duzen && !document.querySelector('#onay-modal[style*="flex"]')) psProfilKapat(); }
function psProfilKapat() { let a = document.getElementById('ps-profil'); if (a) a.remove(); PS.profil = null; PS.duzen = false; document.removeEventListener('keydown', psEsc2); if (yoneticiSekmeAktif === 'kisiler') psCiz(); }
function psAlanlar(p, b) {
    return [
        { id: 'ad', et: 'Ad soyad', tip: 'metin', deger: p.ad },
        { id: 'rol', et: 'Rol', tip: 'secim', deger: b.rol || '', secenekler: PS_ROL },
        { id: 'tel', et: 'Telefon', tip: 'tel', deger: b.tel || '' },
        { id: 'eposta', et: 'E-posta', tip: 'metin', deger: b.eposta || '' },
        { id: 'calisma', et: 'Çalışma şekli', tip: 'seg', deger: b.calisma || '', secenekler: PS_CALISMA },
        { id: 'durum', et: 'Durum', tip: 'seg', deger: b.durum || 'aktif', secenekler: PS_DURUM },
        { id: 'baslama', et: 'İşe başlama', tip: 'tarih', deger: b.baslama || '' },
        { id: 'izinBitis', et: 'İzin bitişi', tip: 'tarih', deger: b.izinBitis || '', ipucu: 'yalnız İzinli iken' },
        { id: 'gruplar', et: 'Verdiği gruplar', tip: 'metin', deger: b.gruplar || '' },
        { id: 'acil', et: 'Acil durum kişisi', tip: 'metin', deger: b.acil || '', ipucu: 'ad · telefon' },
        { id: 'not', et: 'Not', tip: 'not', deger: b.not || '', tam: true }
    ];
}
function psGirdi(a) {
    let d = a.deger == null ? '' : String(a.deger);
    if (a.tip === 'seg') return `<div class="seg" data-alan="${a.id}" data-tip="seg">${a.secenekler.map(x => `<button type="button" data-v="${psEsc(x[0])}" aria-pressed="${x[0] === d}" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===this))">${psEsc(x[1])}</button>`).join('')}</div>`;
    if (a.tip === 'secim') return `<select data-alan="${a.id}"><option value="">—</option>${a.secenekler.map(x => `<option value="${psEsc(x[0])}"${x[0] === d ? ' selected' : ''}>${psEsc(x[1])}</option>`).join('')}</select>`;
    if (a.tip === 'not') return `<textarea data-alan="${a.id}" maxlength="600">${psEsc(d)}</textarea>`;
    return `<input data-alan="${a.id}" type="${a.tip === 'tarih' ? 'date' : a.tip === 'tel' ? 'tel' : 'text'}" value="${psEsc(d)}">`;
}
function psDeger(a) { if (a.secenekler) return psEsc(psSecAd(a.secenekler, a.deger) || '—'); if (a.tip === 'tarih') return psTR(a.deger); return a.deger ? psEsc(a.deger) : '—'; }
function psProfilCiz() {
    let a = document.getElementById('ps-profil'); if (!a) return;
    let p = psBul(PS.profil);
    if (!p) { a.innerHTML = '<div class="ap yn-profil"><div class="yn-p-ust"><button class="ap-btn" onclick="psProfilKapat()">← Geri</button></div><div class="yn-bos" style="padding:20px">Eğitmen bulunamadı (silinmiş olabilir).</div></div>'; return; }
    let b = psB(p.id), ay = PS.ay || psBuAy(), acik = psParaAcik(), hafta = psHaftaGunleri();
    let tel = b.tel ? psTel(b.tel) : '';
    let bo = psBelgeOzet(p.id), ayDers = typeof egAyDersleri === 'function' ? egAyDersleri(p.id, psBuAy()) : [];
    let gun = typeof personelStats === 'function' ? personelStats(p.id, psBuAy()).ay : 0;
    let h = acik ? psHakedis(p, ay) : null;
    let ozet = [['Rol', psSecAd(PS_ROL, b.rol)], ['Telefon', b.tel], ['E-posta', b.eposta], ['Çalışma', psSecAd(PS_CALISMA, b.calisma)], ['Gruplar', b.gruplar], ['Başlama', b.baslama ? psTR(b.baslama) : ''], ['Acil durum', b.acil]].filter(x => x[1]);
    let tile = (cls, et, deger, alt) => `<div class="${cls}"><small>${et}</small><b>${deger}</b><span>${alt}</span></div>`;
    let alanlar = psAlanlar(p, b);
    let bilgi = `<div class="yn-alanlar">${alanlar.map(x => `<div class="yn-alan${x.tam ? ' tam' : ''}"><label>${x.et}</label>${PS.duzen ? psGirdi(x) : `<div class="deger">${psDeger(x)}</div>`}${PS.duzen && x.ipucu ? `<small>${psEsc(x.ipucu)}</small>` : ''}</div>`).join('')}</div>`;
    // belgeler
    let belgeler = (b.belgeler || []).filter(x => x && !x.sil);
    let belgeHTML = (belgeler.length ? belgeler.map(x => { let d = psBelgeDurum(x); return `<div class="ps-satir"><span>📄 ${psEsc(x.ad)}${x.not ? ` <span class="ps-not">· ${psEsc(x.not)}</span>` : ''}</span><span class="sag"><span class="ap-etk ${d.cls}">${psEsc(d.metin)}</span><button class="ap-btn yn-pdf-gizle" onclick="psBelgeSil('${psJs(x.id)}')" aria-label="Belgeyi sil">🗑</button></span></div>`; }).join('') : '<div class="yn-bos">Belge eklenmemiş (antrenör belgesi, ilk yardım, adli sicil…).</div>')
        + (PS.belgeForm ? `<div class="ps-form"><label style="flex:1 1 180px">Belge<input id="ps-b-ad" list="ps-b-oneri" placeholder="ör. İlk yardım sertifikası"><datalist id="ps-b-oneri"><option>Okçuluk antrenör belgesi</option><option>İlk yardım sertifikası</option><option>Adli sicil kaydı</option><option>Sağlık raporu</option><option>Spor lisansı</option></datalist></label><label>Bitiş (yoksa boş)<input type="date" id="ps-b-bitis"></label><label style="flex:1 1 140px">Not<input id="ps-b-not" placeholder="kademe, numara…"></label><button class="ap-btn iyi" onclick="psBelgeKaydet()">✓ Ekle</button><button class="ap-btn" onclick="PS.belgeForm=false; psProfilCiz()">Vazgeç</button></div>`
            : `<div style="margin-top:8px" class="yn-pdf-gizle"><button class="ap-btn" onclick="PS.belgeForm=true; psProfilCiz(); setTimeout(()=>{let e=document.getElementById('ps-b-ad'); if(e) e.focus();},30)">＋ Belge ekle</button></div>`);
    // dersler
    let dersHTML = ayDers.length ? ayDers.slice(-12).reverse().map(d => `<div class="ps-satir"><b class="ap-num" style="width:70px">${psTR(d.iso).slice(0, 5)}</b><span>${d.s ? psEsc(d.s.baslangicSaat + ' ' + (d.s.grup || '')) : 'ders'}</span></div>`).join('') : '<div class="yn-bos">Bu ay işaretli ders yok. Karışık Sınıf › Yoklama\'da derse giren eğitmeni işaretle.</div>';
    // ücret ve ödemeler
    let para;
    if (!acik) para = psKilitHTML('Ücret, IBAN ve ödemeler');
    else {
        let model = [h.u ? `ders başı ${psTl(h.u)}` : '', h.gU ? `günlük ${psTl(h.gU)}` : '', h.aylik ? `aylık ${psTl(h.aylik)}` : ''].filter(Boolean).join(' + ') || 'ücret girilmemiş';
        let du = typeof _egUcret !== 'undefined' && _egUcret[p.id] ? _egUcret[p.id].ucret : '';
        para = `<div class="ap-filtre"><label>Ay <input type="month" value="${ay}" onchange="PS.ay=this.value; psProfilCiz()"></label></div>
            <div class="ap-kpi">${tile('', 'Ücret', psEsc(model.split(' + ')[0]), psEsc(model.indexOf(' + ') > 0 ? model : 'değiştirmek için aşağıda'))}${tile('', 'Hakediş', psTl(h.top), h.dersler.length + ' ders · ' + h.gun + ' gün')}${tile('iyi', 'Ödenen', psTl(h.verilen), psOdemeler(p.id).filter(o => String(o.tarih).slice(0, 7) === ay && o.tur !== 'alinan').length + ' ödeme')}${tile(h.kalan > 0 ? 'kotu' : '', 'Kalan', psTl(h.kalan), h.alinan ? 'alınan ' + psTl(h.alinan) : 'ay sonu')}</div>
            <div class="ps-form"><label>Ders başı ₺<input type="number" min="0" step="10" inputmode="decimal" id="ps-u-ders" value="${psEsc(du)}" style="width:110px"></label><label>Günlük ₺<input type="number" min="0" step="10" inputmode="decimal" id="ps-u-gun" value="${psEsc(p.ucret || '')}" style="width:110px"></label><label>Aylık sabit ₺<input type="number" min="0" step="100" inputmode="decimal" id="ps-u-ay" value="${psEsc(b.aylik || '')}" style="width:120px"></label><label style="flex:1 1 200px">IBAN<input id="ps-u-iban" value="${psEsc(b.iban || '')}" placeholder="TR.."></label><button class="ap-btn" onclick="psUcretKaydet()">💾 Ücreti kaydet</button></div>
            <div class="ap-araclar yn-pdf-gizle" style="margin:10px 0 6px"><button class="ap-btn iyi" onclick="PS.odemeForm='verilen'; psProfilCiz()">＋ Ödeme yaptım (verilen)</button><button class="ap-btn" onclick="PS.odemeForm='alinan'; psProfilCiz()">＋ Para aldım (alınan)</button></div>
            ${PS.odemeForm ? `<div class="ps-form"><b style="width:100%;font-size:13px">${PS.odemeForm === 'alinan' ? '＋ Eğitmenden kulübe alınan para' : '＋ Eğitmene yapılan ödeme'}</b><label>Tarih<input type="date" id="ps-o-tarih" value="${psIso(new Date())}" max="${psIso(new Date())}"></label><label>Tutar ₺<input type="number" min="0" step="50" inputmode="decimal" id="ps-o-tutar" style="width:120px" value="${PS.odemeForm === 'verilen' && h.kalan > 0 ? Math.round(h.kalan) : ''}"></label><label style="flex:1 1 200px">Açıklama<input id="ps-o-acik" placeholder="${PS.odemeForm === 'alinan' ? 'ör. özel ders komisyonu' : 'ör. Ekim maaşı, avans'}"></label><button class="ap-btn iyi" onclick="psOdemeKaydet()">✓ Kaydet</button><button class="ap-btn" onclick="PS.odemeForm=false; psProfilCiz()">Vazgeç</button></div>` : ''}
            <h3 style="margin:12px 0 6px;font-size:13px">Ödeme geçmişi</h3>${psDefterHTML(psOdemeler(p.id).slice(0, 40), false)}`;
    }
    // atış kaydı bağlantısı
    let egKayit = (typeof kyTumKisiler === 'function' ? kyTumKisiler() : []).filter(x => kisiTuru(x.g, x.ad) === 'egitmen');
    let bagli = b.sporcu && egKayit.find(x => x.g + '|' + x.ad === b.sporcu);
    let islem = (et, alt, btn, tehlike) => `<div class="satir"><div><b>${et}</b><small>${alt}</small></div>${btn}</div>`;
    let islemler = islem('🎯 Atış kaydı', bagli ? `Bağlı: <span class="yn-isim" data-sporcu="${psEsc(b.sporcu)}">${psEsc(bagli.ad)}</span> — skorları sporcu profilinde` : 'Kendi ok atışları skor tablosunda görünsün (öğrenci sayısına katılmaz)',
            egKayit.length ? `<select onchange="psSporcuBagla(this.value)" style="max-width:220px"><option value="">${bagli ? 'Bağlantıyı kaldır' : 'Kayıt seç…'}</option>${egKayit.map(x => `<option value="${psEsc(x.g + '|' + x.ad)}"${x.g + '|' + x.ad === b.sporcu ? ' selected' : ''}>${psEsc(x.ad)}</option>`).join('')}</select>` : '<span class="ps-not">Önce Tür ata\'dan bir kaydı Eğitmen yap</span>')
        + islem(b.durum === 'ayrildi' ? '▶ Yeniden aktif' : '⏸ İşten ayrıldı', 'Geçmiş dersleri ve ödemeleri korunur', `<button class="ap-btn" onclick="psDurum('${b.durum === 'ayrildi' ? 'aktif' : 'ayrildi'}')">${b.durum === 'ayrildi' ? 'Aktif et' : 'Ayrıldı yap'}</button>`)
        + islem('<span style="color:var(--ap-kotu)">🗑 Sil</span>', 'Kadro listesinden ve günlük giriş kayıtlarından silinir', `<button class="ap-btn tehlike" onclick="psSil()">Sil</button>`);
    a.innerHTML = `<div class="ap yn-profil" id="ps-profil-ic" role="dialog" aria-modal="true" aria-label="${psEsc(p.ad)} profili">
        <div class="yn-p-ust yn-pdf-gizle"><button class="ap-btn" onclick="psProfilKapat()">← Geri</button><span class="yn-p-yol">Eğitmenler › <b>${psEsc(p.ad)}</b></span>
            <span class="yn-p-sag">${PS.duzen ? `<button class="ap-btn" onclick="PS.duzen=false; psProfilCiz()">Vazgeç</button><button class="ap-btn ana" onclick="psBilgiKaydet()">💾 Kaydet</button>` : `<button class="ap-btn ana" onclick="PS.duzen=true; psProfilCiz()">✏️ Düzenle</button><button class="ap-btn" onclick="ynPdf(document.getElementById('ps-profil-ic'), 'egitmen')">📄 PDF</button>`}</span></div>
        <div class="yn-p-izgara">
            <aside class="yn-p-kimlik">
                <div class="ap-panel yn-p-kart"><div class="yn-av" style="background:#1d2c40;color:#5aa9ff">${psEsc(psBas(p.ad))}</div><h2>${psEsc(p.ad)}</h2><div class="yn-p-alt">${psEsc(psSecAd(PS_ROL, b.rol) || 'Eğitmen')}${b.baslama ? ' · ' + psTR(b.baslama) + "'den beri" : ''}</div><div>${psDurumEtk(b)}</div></div>
                ${ozet.length ? `<div class="ap-panel"><dl class="yn-dl">${ozet.map(x => `<dt>${x[0]}</dt><dd>${psEsc(x[1])}</dd>`).join('')}</dl></div>` : ''}
                <div class="yn-p-hizli yn-pdf-gizle">${tel ? `<a class="ap-btn" href="tel:+${tel}" style="text-decoration:none;text-align:center">📞 Ara</a><button class="ap-btn" onclick="window.open('https://api.whatsapp.com/send?phone=${tel}','_blank')">💬 WhatsApp</button>` : '<span class="ap-etk u" style="grid-column:1/-1;text-align:center">Telefon yok · ✏️ Düzenle</span>'}</div>
            </aside>
            <main class="yn-p-icerik">
                ${PS.duzen ? '<div class="yn-p-bant">✏️ Düzenleme modu — alanları değiştir, sonra üstten <b>💾 Kaydet</b>. Ücret ve IBAN aşağıdaki 🔒 bölümde.</div>' : ''}
                <div class="ap-kpi">${tile('', 'Bu hafta', psDersSay(p.id, hafta) + ' ders', 'Yoklama\'dan')}${tile('', 'Bu ay', ayDers.length + ' ders', gun + ' gün geldi')}${tile(bo.cls === 'i' ? 'iyi' : bo.cls === 'u' ? 'uyari' : 'kotu', 'Belgeler', psEsc(bo.metin.split(' · ')[0]), bo.metin.indexOf(' · ') > 0 ? psEsc(bo.metin.split(' · ')[1]) : 'bitişten 30 gün önce uyarır')}${tile('', 'Bu ay hakediş', acik ? psTl(psHakedis(p, psBuAy()).top) : '🔒', acik ? 'ders + gün + aylık' : 'PIN ile')}</div>
                <div class="ap-panel"><h3>Bilgiler <span>${PS.duzen ? 'değiştir → Kaydet' : 'düzeltmek için ✏️ Düzenle'}</span></h3>${bilgi}</div>
                <div class="ap-iki">
                    <div class="ap-panel"><h3>Belgeler <span>bitişten 30 gün önce uyarır</span></h3>${belgeHTML}</div>
                    <div class="ap-panel"><h3>Bu ay verdiği dersler <span>${ayDers.length} ders</span></h3>${dersHTML}</div>
                </div>
                <div class="ap-panel"><h3>💰 Ücret ve ödemeler <span>${acik ? 'açık — sekme değişince kilitlenir' : 'aidat PIN\'i ile'}</span></h3>${para}</div>
                <div class="yn-tehlike yn-pdf-gizle" style="border-color:var(--ap-cizgi)"><h4 style="color:var(--ap-yazi)">Kayıt işlemleri</h4>${islemler}</div>
            </main>
        </div>
    </div>`;
}
function psBilgiKaydet() {
    let p = psBul(PS.profil), kap = document.getElementById('ps-profil-ic'); if (!p || !kap) return;
    let yeni = {};
    kap.querySelectorAll('[data-alan]').forEach(e => { let v = e.dataset.tip === 'seg' ? ((e.querySelector('[aria-pressed="true"]') || {}).dataset || {}).v : e.value; yeni[e.dataset.alan] = String(v == null ? '' : v).trim(); });
    let ad = (yeni.ad || '').replace(/\s+/g, ' ').trim();
    if (!ad) return showToast('İsim boş olamaz.', 'error');
    if (ad !== p.ad) { p.ad = ad; try { personeliKaydet(); } catch (e) {} bekleyenGonderim = true; try { bulutaGonderKontrol(); } catch (e) {} }
    delete yeni.ad;
    if (yeni.durum !== 'izinli') yeni.izinBitis = '';
    psBilgiYaz(p.id, yeni);
    PS.duzen = false; showToast('✓ ' + ad + ' kaydedildi', 'success'); psProfilCiz();
}
function psBelgeKaydet() {
    let ad = (document.getElementById('ps-b-ad') || {}).value || ''; ad = ad.trim();
    if (!ad) return showToast('Belgenin adını yaz.', 'error');
    let b = psB(PS.profil), l = (b.belgeler || []).slice();
    l.push({ id: 'blg_' + Date.now(), ad, bitis: (document.getElementById('ps-b-bitis') || {}).value || '', not: ((document.getElementById('ps-b-not') || {}).value || '').trim() });
    psBilgiYaz(PS.profil, { belgeler: l }); PS.belgeForm = false; showToast('📄 Belge eklendi', 'success'); psProfilCiz();
}
function psBelgeSil(id) {
    let b = psB(PS.profil), x = (b.belgeler || []).find(y => y.id === id); if (!x) return;
    onayIste(`<b>${psEsc(x.ad)}</b> belgesi silinsin mi?`, () => { psBilgiYaz(PS.profil, { belgeler: (b.belgeler || []).filter(y => y.id !== id) }); psProfilCiz(); }, '🗑 Sil');
}
function psUcretKaydet() {
    if (!psParaAcik()) return;
    let p = psBul(PS.profil); if (!p) return;
    let sayi = id => { let v = String((document.getElementById(id) || {}).value || '').replace(',', '.').trim(); return v === '' ? '' : Math.max(0, Number(v) || 0); };
    let du = sayi('ps-u-ders'), gu = sayi('ps-u-gun'), au = sayi('ps-u-ay'), iban = String((document.getElementById('ps-u-iban') || {}).value || '').replace(/\s+/g, ' ').trim().toUpperCase();
    let eskiDu = typeof _egUcret !== 'undefined' && _egUcret[p.id] ? _egUcret[p.id].ucret : '';
    if (String(du) !== String(eskiDu)) egDersUcretAyarla(p.id, du); // personel_ders_ucret (aynı değer bordroda da)
    if (String(gu) !== String(p.ucret || '')) { p.ucret = gu === '' ? '' : String(gu); try { personeliKaydet(); } catch (e) {} bekleyenGonderim = true; try { bulutaGonderKontrol(); } catch (e) {} }
    psBilgiYaz(p.id, { aylik: au, iban });
    showToast('💾 Ücret kaydedildi', 'success'); psProfilCiz();
}
function psOdemeKaydet() {
    if (!psParaAcik() || !PS.odemeForm) return;
    let tutar = Number(String((document.getElementById('ps-o-tutar') || {}).value || '').replace(',', '.'));
    let tarih = (document.getElementById('ps-o-tarih') || {}).value || psIso(new Date());
    if (!(tutar > 0)) return showToast('Tutarı yaz.', 'error');
    psOdemeYaz('pod_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), { pid: PS.profil, tarih, tutar, tur: PS.odemeForm, aciklama: ((document.getElementById('ps-o-acik') || {}).value || '').trim() });
    showToast(PS.odemeForm === 'alinan' ? '✓ Alınan para kaydedildi' : '✓ Ödeme kaydedildi', 'success');
    PS.odemeForm = false; PS.ay = tarih.slice(0, 7); psProfilCiz();
}
function psSporcuBagla(v) { psBilgiYaz(PS.profil, { sporcu: v || '' }); psProfilCiz(); }
function psDurum(d) { psBilgiYaz(PS.profil, { durum: d, izinBitis: '' }); showToast(d === 'ayrildi' ? 'Ayrıldı olarak işaretlendi' : 'Yeniden aktif', 'success'); psProfilCiz(); }
function psSil() {
    let p = psBul(PS.profil); if (!p) return;
    onayIste(`<b>${psEsc(p.ad)}</b> kadrodan silinsin mi?<br><span style="font-size:12px;color:var(--text-muted)">Günlük giriş kayıtları da silinir. Ödeme defteri kayıtları kalır.</span>`, () => {
        let id = p.id, c = window.confirm; window.confirm = () => true; // personelSil kendi onayını soruyor — burada zaten onaylandı
        try { personelSil(id); } finally { window.confirm = c; }
        psBilgiYaz(id, { sil: true }); psProfilKapat(); showToast(p.ad + ' silindi', 'success');
    }, '🗑 Sil');
}
setTimeout(psCek, 3000);
