/* Milo · Sporcu seçici, grup adları ve haftalık program (2026-10-08, kullanıcı: "sporcu seç ve ata bölümü berbat oldu,
   daha aktif ve iyi hale getir; hazır grupların isimlerini ve yaş gruplarını değiştirme imkânı sun; atamaları serbest
   bırak, kullanıcı ayarlasın; Antrenman Programı — Haftalık görüntüsü amatör, profesyonel ve kolay yap").
   1) msp*: TEK sporcu seçici üç yerde (Yeni ders › 4. adım, Yaş/Grup › Sporcu ata, Ders penceresi): arama (isim + veli),
      filtre çipleri (Tümü / 🎂 Yaşı uyanlar / gruplar / doğum tarihi yok), "Görünenleri seç", seçili sayısı. Hiçbir şey
      kendiliğinden seçilmez. Aramada yalnız liste yeniden çizilir (yazarken odak kaybolmaz).
   2) Grup adı değiştirme: POST /api/milo/grup-yeniden-adlandir — üyeler, dersler, katılımcılar, yoklama tek seferde.
      Grup atama artık /rename ile (eski yol yeni üye açıp eskisini siliyordu: ders kayıtları kopuyordu).
   3) mpg*: haftalık program saat eksenli takvim (süreye orantılı bloklar, çakışan dersler yan yana, bugün + şimdi
      çizgisi, yaş rengi, boş yere dokununca o gün/saatte yeni ders), telefonda gün gün ajanda. */

// ============ 1) ORTAK SPORCU SEÇİCİ ============
let _msp = {};
function mspAnahtar(u) { return u.grup + '|' + u.ad; }
function mspYasYazi(u) { return typeof mdsYasYazi === 'function' ? mdsYasYazi(u) : ''; }
function mspUygun(u, o) { return o.yas && typeof mdsUygunMu === 'function' ? mdsUygunMu(u, o.yas.min, o.yas.max) : false; }
// o: { adaylar: () => [üye], secili: () => {anahtar:true}, yas: {min,max}|null, uyari: (u) => metin, degisti: () => void, bos: metin }
function mspKur(id, o) {
    let eski = _msp[id] || {};
    _msp[id] = Object.assign({ q: eski.q || '', filtre: eski.filtre || (o.yas ? 'yas' : 'hepsi') }, o);
    if (_msp[id].filtre === 'yas' && !o.yas) _msp[id].filtre = 'hepsi';
    return `<div class="msp" id="msp-${id}"><input class="milo-input msp-ara" type="search" placeholder="🔍 İsim ya da veli adı ara…" value="${miloEsc(_msp[id].q)}" oninput="mspAra('${id}', this.value)" autocomplete="off"><div id="msp-${id}-govde">${mspGovdeHTML(id)}</div></div>`;
}
function mspListe(id) {
    let o = _msp[id], q = (o.q || '').trim().toLocaleLowerCase('tr');
    let hepsi = o.adaylar();
    let f = o.filtre, l = hepsi.filter(u => f === 'hepsi' ? true : f === 'yas' ? mspUygun(u, o) : f === '_dogumsuz' ? !u.dogumTarihi : f === '_secili' ? !!o.secili()[mspAnahtar(u)] : u.grup === f.slice(2));
    if (q) l = l.filter(u => u.ad.toLocaleLowerCase('tr').includes(q) || (u.acilKisi || '').toLocaleLowerCase('tr').includes(q));
    return { hepsi, l: l.sort((a, b) => a.ad.localeCompare(b.ad, 'tr')) };
}
function mspGovdeHTML(id) {
    let o = _msp[id], { hepsi, l } = mspListe(id), sec = o.secili(), secSay = hepsi.filter(u => sec[mspAnahtar(u)]).length;
    let gruplar = [...new Set(hepsi.map(u => u.grup))].sort((a, b) => a.localeCompare(b, 'tr'));
    let cip = (k, yazi, n) => `<button type="button" class="${o.filtre === k ? 'aktif' : ''}" onclick="mspFiltre('${id}', this.dataset.k)" data-k="${miloEsc(k)}">${yazi} <i>${n}</i></button>`;
    let cipler = cip('hepsi', 'Tümü', hepsi.length)
        + (o.yas ? cip('yas', '🎂 Yaşı uyanlar', hepsi.filter(u => mspUygun(u, o)).length) : '')
        + (secSay ? cip('_secili', '✓ Seçili', secSay) : '')
        + (gruplar.length > 1 ? gruplar.map(g => cip('g:' + g, miloEsc(g), hepsi.filter(u => u.grup === g).length)).join('') : '')
        + (hepsi.some(u => !u.dogumTarihi) ? cip('_dogumsuz', 'Doğum tarihi yok', hepsi.filter(u => !u.dogumTarihi).length) : '');
    let gorunenSec = l.length && l.every(u => sec[mspAnahtar(u)]);
    let kart = u => {
        let k = mspAnahtar(u), s = !!sec[k], uy = o.uyari ? o.uyari(u) : '', yas = mspYasYazi(u);
        return `<button type="button" class="msp-uye${s ? ' sec' : ''}${mspUygun(u, o) ? ' uygun' : ''}" data-k="${miloEsc(k)}" onclick="mspSec('${id}', this.dataset.k)" aria-pressed="${s}"><span class="msp-tik">${s ? '✓' : ''}</span><span class="msp-ad"><b>${miloAdVeliHTML(u)}</b><small>${[yas || 'doğum tarihi yok', u.grup].map(miloEsc).join(' · ')}${uy ? ' · <em>⚠️ ' + miloEsc(uy) + '</em>' : ''}</small></span></button>`;
    };
    return `<div class="msp-cipler">${cipler}</div>
        <div class="msp-arac"><span><b>${secSay}</b> seçili${l.length !== hepsi.length ? ' · ' + l.length + ' görünüyor' : ''}</span>${l.length ? `<button type="button" onclick="mspHepsi('${id}', ${gorunenSec ? 'false' : 'true'})">${gorunenSec ? 'Görünenleri bırak' : 'Görünenleri seç (' + l.length + ')'}</button>` : ''}${secSay ? `<button type="button" onclick="mspTemizle('${id}')">Temizle</button>` : ''}</div>
        <div class="msp-liste">${l.length ? l.map(kart).join('') : `<div class="msp-bos">${miloEsc(hepsi.length ? 'Bu filtrede kimse yok.' : (o.bos || 'Eklenecek sporcu yok.'))}</div>`}</div>`;
}
function mspYenile(id) { let e = document.getElementById('msp-' + id + '-govde'); if (e && _msp[id]) { let l = e.querySelector('.msp-liste'), y = l ? l.scrollTop : 0; e.innerHTML = mspGovdeHTML(id); let l2 = e.querySelector('.msp-liste'); if (l2) l2.scrollTop = y; } }
function mspAra(id, v) { if (!_msp[id]) return; _msp[id].q = v; mspYenile(id); }
function mspFiltre(id, k) { if (!_msp[id]) return; _msp[id].filtre = _msp[id].filtre === k && k !== 'hepsi' ? 'hepsi' : k; mspYenile(id); }
function mspSec(id, k) { let o = _msp[id]; if (!o) return; let s = o.secili(); if (s[k]) delete s[k]; else s[k] = true; mspYenile(id); if (o.degisti) o.degisti(); }
function mspHepsi(id, sec) { let o = _msp[id]; if (!o) return; let s = o.secili(); mspListe(id).l.forEach(u => { if (sec) s[mspAnahtar(u)] = true; else delete s[mspAnahtar(u)]; }); mspYenile(id); if (o.degisti) o.degisti(); }
function mspTemizle(id) { let o = _msp[id]; if (!o) return; let s = o.secili(); Object.keys(s).forEach(k => delete s[k]); mspYenile(id); if (o.degisti) o.degisti(); }
function mspSecilenler(id) { let o = _msp[id]; if (!o) return []; let s = o.secili(); return o.adaylar().filter(u => s[mspAnahtar(u)]); }

// ---- Yaş/Grup › Sporcu ata (kayıpsız: /rename)
let _mspGrupSec = {};
miloGrupAtamaFormHTML = function (g) {
    return `<div class="msp-kutu">${mspKur('grup', {
        adaylar: () => miloUyeler.filter(u => !u.pasif && u.grup !== g.ad), secili: () => _mspGrupSec,
        degisti: () => { let b = document.getElementById('msp-grup-btn'); if (b) b.textContent = mspGrupBtnYazi(g.ad); }, bos: 'Bu gruba atanabilecek başka sporcu yok.'
    })}<button id="msp-grup-btn" class="milo-btn-full" style="margin:8px 0 0;" onclick="miloGrupAtamaOnayla('${miloJsEsc(g.ad)}')">${mspGrupBtnYazi(g.ad)}</button></div>`;
};
function mspGrupBtnYazi(g) { let n = mspSecilenler('grup').length; return n ? '✅ ' + n + ' sporcuyu "' + g + '" grubuna taşı' : 'Taşınacak sporcuları seç'; }
miloSporcuyuGrubaAta = async function (eskiGrup, ad, yeniGrupAdi) {
    let r = await fetch('/api/milo/members/' + encodeURIComponent(eskiGrup) + '/' + encodeURIComponent(ad) + '/rename', { method: 'POST', headers: { 'content-type': 'application/json', 'X-Dagsk-Oturum': miloOturumToken || '' }, body: JSON.stringify({ yeniGrup: yeniGrupAdi }) });
    if (!r.ok) { let t = ''; try { t = (await r.json()).error || ''; } catch (e) {} throw new Error(t === 'target-exists' ? ad + ' bu grupta zaten var' : t || 'HTTP ' + r.status); }
    try { if (typeof maTurTasi === 'function') maTurTasi(eskiGrup, ad, yeniGrupAdi, ad); } catch (e) {}
};
miloGrupAtamaOnayla = async function (yeniGrupAdi) {
    let l = mspSecilenler('grup');
    if (!l.length) return showToast('Önce sporcu seç.', 'warning');
    let ok = 0, hata = [];
    for (let u of l) { try { await miloSporcuyuGrubaAta(u.grup, u.ad, yeniGrupAdi); ok++; } catch (e) { hata.push(e.message); } }
    _mspGrupSec = {};
    miloUyeler = (await miloApi('/members')).members;
    try { miloProgram = (await miloApi('/antrenman-programi')).slots; } catch (e) {}
    miloGrupAtamaAcik = false; miloGrupDetayCiz();
    showToast(hata.length ? ok + ' taşındı, ' + hata.length + ' taşınamadı: ' + hata[0] : '✅ ' + ok + ' sporcu "' + yeniGrupAdi + '" grubuna taşındı (aidat, yoklama, ders kayıtlarıyla)', hata.length ? 'warning' : 'success');
};

// ---- Ders penceresi: aday listesi → çoklu seçici
let _mspDersSec = {};
(function () {
    if (typeof miloDersRosterCiz !== 'function') return;
    let eski = miloDersRosterCiz;
    miloDersRosterCiz = function () {
        let s = _miloDrmSlot(); if (!s) return eski.apply(this, arguments);
        if (_mspDersSec._slot !== s.id) { _mspDersSec = { }; Object.defineProperty(_mspDersSec, '_slot', { value: s.id, enumerable: false }); }
        eski.apply(this, arguments);
        let ara = document.getElementById('milo-drm-ara'); if (ara) ara.style.display = 'none';
        let liste = document.getElementById('milo-drm-aday-liste'); if (!liste) return;
        let y = typeof mdsSlotYas === 'function' ? mdsSlotYas(s.id) : null;
        let mevcut = {}; (s.katilimcilar || []).forEach(k => { mevcut[k.grup + '|' + k.ad] = 1; });
        liste.innerHTML = mspKur('ders', {
            adaylar: () => miloUyeler.filter(u => !u.pasif && !mevcut[mspAnahtar(u)]), secili: () => _mspDersSec,
            yas: y ? { min: y.minAy, max: y.maxAy } : null,
            uyari: u => { try { let c = _miloDersCakismaBul(u.grup, u.ad, s); return c.length ? 'aynı saatte ' + c.map(x => x.grup).join(', ') : ''; } catch (e) { return ''; } },
            degisti: () => { let b = document.getElementById('msp-ders-btn'); if (b) { let n = mspSecilenler('ders').length; b.disabled = !n; b.textContent = n ? '➕ ' + n + ' sporcuyu derse ekle' : 'Eklenecek sporcuları seç'; } },
            bos: 'Tüm aktif üyeler bu derste.'
        }) + '<button id="msp-ders-btn" class="milo-btn-full" style="margin:8px 0 0;" disabled onclick="mspDerseEkle()">Eklenecek sporcuları seç</button>';
        if (_msp.ders) _msp.ders.degisti();
        // kayıtlı listede veli adı
        document.querySelectorAll('#milo-drm-roster-liste > div').forEach((d, i) => {
            let k = (s.katilimcilar || []).slice().sort((a, b) => a.ad.localeCompare(b.ad, 'tr'))[i], u = k && miloUyeler.find(x => x.grup === k.grup && x.ad === k.ad), b = d.querySelector('div > div');
            if (u && u.acilKisi && b && !b.querySelector('.muf-veli')) b.firstChild.after(Object.assign(document.createElement('span'), { className: 'muf-veli', textContent: ' (' + u.acilKisi + ')' }));
        });
    };
})();
async function mspDerseEkle() {
    let s = _miloDrmSlot(), l = mspSecilenler('ders'); if (!s || !l.length) return;
    let mevcut = (s.katilimcilar || []).length;
    if (s.kapasite && mevcut + l.length > s.kapasite && !confirm('Kapasite ' + s.kapasite + ', eklenince ' + (mevcut + l.length) + ' kişi olacak. Yine de eklensin mi?')) return;
    let b = document.getElementById('msp-ders-btn'); if (b) { b.disabled = true; b.textContent = 'Ekleniyor…'; }
    let ok = 0;
    for (let u of l) {
        try { await miloApi('/antrenman-programi/' + s.id + '/katilimci', { method: 'POST', body: JSON.stringify({ grup: u.grup, ad: u.ad }) }); (s.katilimcilar = s.katilimcilar || []).push({ grup: u.grup, ad: u.ad }); ok++; } catch (e) {}
    }
    _mspDersSec = {}; Object.defineProperty(_mspDersSec, '_slot', { value: s.id, enumerable: false });
    miloDersRosterCiz(); miloProgramIzgaraCiz();
    showToast('✅ ' + ok + ' sporcu derse eklendi', ok === l.length ? 'success' : 'warning');
}

// ============ 2) GRUP / YAŞ KATEGORİSİ ADI DEĞİŞTİRME ============
async function mspGrupAdDegistir(eski) {
    let yeni = prompt('"' + eski + '" grubunun yeni adı:\n(Sporcular, dersler ve yoklama kayıtları da yeni ada taşınır.)', eski);
    if (yeni === null) return; yeni = yeni.replace(/\s+/g, ' ').trim();
    if (!yeni || yeni === eski) return;
    let r = await fetch('/api/milo/grup-yeniden-adlandir', { method: 'POST', headers: { 'content-type': 'application/json', 'X-Dagsk-Oturum': miloOturumToken || '' }, body: JSON.stringify({ eski, yeni }) });
    let d = {}; try { d = await r.json(); } catch (e) {}
    if (r.status === 409) return showToast('Değiştirilemedi: ' + (d.adlar || []).slice(0, 3).join(', ') + ' iki grupta da var. Önce Çift Kayıt\'tan birleştir.', 'error');
    if (!r.ok) return showToast('Değiştirilemedi: ' + (d.error || 'HTTP ' + r.status), 'error');
    [miloUyeler, miloProgram, miloGruplar] = await Promise.all([miloApi('/members').then(x => x.members), miloApi('/antrenman-programi').then(x => x.slots), miloApi('/gruplar').then(x => x.gruplar)]);
    try { if (typeof MA !== 'undefined' && MA.tur && typeof maMetaYaz === 'function') { let ek = {}; Object.keys(MA.tur).forEach(k => { if (k.startsWith(eski + '|')) { ek[yeni + k.slice(eski.length)] = MA.tur[k]; } }); if (Object.keys(ek).length) maMetaYaz('kisi_turleri', ek).then(m => { MA.tur = m; }).catch(() => {}); } } catch (e) {}
    showToast('✏️ "' + eski + '" → "' + yeni + '" · ' + (d.uye || 0) + ' sporcu, ' + (d.ders || 0) + ' ders taşındı', 'success');
    miloGruplarGorunumCiz();
}
async function mspYasAdDegistir(id) {
    let y = miloYasKategorileri.find(x => x.id === id); if (!y) return;
    let yeni = prompt('Yaş kategorisinin yeni adı:', y.ad); if (yeni === null) return; yeni = yeni.trim(); if (!yeni || yeni === y.ad) return;
    try { await miloApi('/yas-kategorileri/' + id, { method: 'PUT', body: JSON.stringify({ ad: yeni }) }); } catch (e) { return showToast('Kaydedilemedi.', 'error'); }
    y.ad = yeni; miloGruplarGorunumCiz(); showToast('✏️ ' + yeni, 'success');
}
(function () {
    if (typeof miloGruplarGorunumCiz !== 'function') return;
    let eski = miloGruplarGorunumCiz;
    miloGruplarGorunumCiz = function () {
        eski.apply(this, arguments);
        let alan = document.getElementById('milo-grup-alt-alani'); if (!alan) return;
        let duzBtn = (onclick) => `<button type="button" class="msp-duz" onclick="event.stopPropagation(); ${onclick}" title="Adını değiştir">✏️</button>`;
        if (miloSeciliGrupId) {
            let g = miloGruplar.find(x => x.id === miloSeciliGrupId), bas = alan.children[1];
            if (g && bas && !bas.querySelector('.msp-duz')) bas.insertAdjacentHTML('beforeend', ' ' + duzBtn(`mspGrupAdDegistir('${miloJsEsc(g.ad)}')`));
            return;
        }
        if (miloSeciliYasId) {
            alan.querySelectorAll('.milo-card[onclick^="miloGrupAc("]').forEach(c => {
                let id = +(c.getAttribute('onclick').match(/\d+/) || [0])[0], g = miloGruplar.find(x => x.id === id), sil = c.querySelector('button');
                if (g && sil) sil.insertAdjacentHTML('beforebegin', duzBtn(`mspGrupAdDegistir('${miloJsEsc(g.ad)}')`));
            });
            let y = miloYasKategorileri.find(x => x.id === miloSeciliYasId), bas = alan.children[1];
            if (y && bas) bas.insertAdjacentHTML('beforeend', ' ' + duzBtn(`mspYasAdDegistir(${y.id})`));
            return;
        }
        alan.querySelectorAll('.milo-card[onclick^="miloSeciliYasId="]').forEach(c => {
            let id = +(c.getAttribute('onclick').match(/\d+/) || [0])[0], sil = c.querySelector('button');
            if (sil) sil.insertAdjacentHTML('beforebegin', duzBtn(`mspYasAdDegistir(${id})`));
        });
        // katalogda olmasa da üyelerde kullanılan tüm grup adları — tek yerden yeniden adlandırma
        let say = {}; miloUyeler.forEach(u => { say[u.grup] = (say[u.grup] || 0) + 1; });
        let dersSay = {}; (miloProgram || []).forEach(s => { dersSay[s.grup] = (dersSay[s.grup] || 0) + 1; });
        let adlar = Object.keys(say).sort((a, b) => a.localeCompare(b, 'tr'));
        if (adlar.length) alan.insertAdjacentHTML('beforeend', `<div class="milo-card msp-grupad"><div class="msp-grupad-bas">🏷️ Kullanılan grup adları <small>Adı değiştirince sporcular, dersler ve yoklama da yeni ada geçer.</small></div>
            ${adlar.map(g => `<div class="msp-grupad-sat"><b>${miloEsc(g)}</b><span>${say[g]} sporcu${dersSay[g] ? ' · ' + dersSay[g] + ' ders' : ''}</span><button type="button" onclick="mspGrupAdDegistir(this.dataset.g)" data-g="${miloEsc(g)}">✏️ Adını değiştir</button></div>`).join('')}</div>`);
    };
})();

// ============ 3) HAFTALIK PROGRAM ============
const MPG_GUN_SIRA = [1, 2, 3, 4, 5, 6, 0];
// yaş renkleri temanın vurgu renginden türetilir (renk çarkında eşit aralık) — temada sabit renk yok; eski tarayıcıda token'ların kendisi
const MPG_RENK = CSS.supports('color', 'oklch(from red l c h)') ? [0, 60, 120, 180, 240, 300].map(d => 'oklch(from var(--milo-teal) l c calc(h + ' + d + '))') : ['var(--milo-coral)', 'var(--milo-sun)', 'var(--milo-teal)', 'var(--milo-grape)', 'var(--milo-ink-dim)', 'var(--milo-coral)'];
let _mpg = { gorunum: null };
function mpgDk(s) { let [h, m] = String(s || '0:0').split(':').map(Number); return h * 60 + (m || 0); }
function mpgRenk(s) {
    let y = typeof mdsSlotYas === 'function' ? mdsSlotYas(s.id) : null;
    if (!y) return 'var(--milo-ink-dim)';
    let p = typeof mdsPresetler === 'function' ? mdsPresetler() : [], i = p.findIndex(x => y.minAy >= x.min && y.minAy < x.max);
    return MPG_RENK[(i < 0 ? 2 : i) % MPG_RENK.length];
}
function mpgGorunum() { return _mpg.gorunum || (window.innerWidth < 720 ? 'ajanda' : 'takvim'); }
function mpgSlotBilgi(s, gun) {
    let tarih = _miloGunSonrakiTarihISO(gun, s.baslangicSaat), iptal = (s.istisnalar || []).some(i => i.tarih === tarih);
    let n = (s.katilimcilar || []).length, y = typeof mdsSlotYas === 'function' ? mdsSlotYas(s.id) : null;
    return { iptal, n, dolu: s.kapasite && n >= s.kapasite, yas: y ? mdsAralikEtiket(y.minAy, y.maxAy) : '', renk: mpgRenk(s) };
}
miloProgramIzgaraCiz = function () {
    let ic = document.getElementById('milo-program-izgara'); if (!ic) return;
    let prog = miloProgram || [], bugun = new Date().getDay(), simdi = new Date(), simdiDk = simdi.getHours() * 60 + simdi.getMinutes();
    let gunSlot = g => prog.filter(s => (s.gunler || [s.gun]).includes(g)).sort((a, b) => a.baslangicSaat.localeCompare(b.baslangicSaat));
    let haftaDers = prog.reduce((a, s) => a + (s.gunler || [s.gun]).length, 0), kisiler = new Set(), kap = 0, dolu = 0;
    prog.forEach(s => { (s.katilimcilar || []).forEach(k => kisiler.add(k.grup + '|' + k.ad)); if (s.kapasite) { kap += s.kapasite; dolu += Math.min((s.katilimcilar || []).length, s.kapasite); } });
    let g = mpgGorunum();
    let ust = `<div class="mpg-ust"><div class="mpg-ozet"><span><b>${haftaDers}</b> ders/hafta</span><span><b>${prog.length}</b> ders</span><span><b>${kisiler.size}</b> kayıtlı çocuk</span>${kap ? `<span><b>%${Math.round(dolu / kap * 100)}</b> doluluk</span>` : ''}</div>
        <div class="mpg-sec"><button type="button" class="${g === 'takvim' ? 'aktif' : ''}" onclick="_mpg.gorunum='takvim'; miloProgramIzgaraCiz()">🗓 Takvim</button><button type="button" class="${g === 'ajanda' ? 'aktif' : ''}" onclick="_mpg.gorunum='ajanda'; miloProgramIzgaraCiz()">☰ Liste</button></div></div>`;
    let yaslar = typeof mdsPresetler === 'function' ? mdsPresetler() : [];
    let lejant = yaslar.length ? `<div class="mpg-lejant">${yaslar.map((p, i) => `<span><i style="background:${MPG_RENK[i % MPG_RENK.length]}"></i>${miloEsc(mdsAralikEtiket(p.min, p.max))}</span>`).join('')}<span><i style="background:var(--milo-ink-dim)"></i>yaş aralığı yok</span></div>` : '';
    if (!prog.length) { ic.innerHTML = ust + `<div class="mpg-bos">Henüz ders yok. Aşağıdan <b>✨ Yeni ders oluştur</b> ile ilk dersi ekle.</div>`; return; }
    if (g === 'ajanda') {
        ic.innerHTML = ust + lejant + `<div class="mpg-ajanda">${MPG_GUN_SIRA.map(gun => {
            let l = gunSlot(gun);
            return `<div class="mpg-ag-gun${gun === bugun ? ' bugun' : ''}"><div class="mpg-ag-bas"><b>${MILO_GUN_ADI[gun]}</b>${gun === bugun ? '<em>bugün</em>' : ''}<span>${l.length ? l.length + ' ders' : 'ders yok'}</span><button type="button" onclick="mpgYeniDers(${gun}, null)">+ ders</button></div>
                ${l.map(s => { let b = mpgSlotBilgi(s, gun), oran = s.kapasite ? Math.min(100, b.n / s.kapasite * 100) : 0, gecti = gun === bugun && mpgDk(s.bitisSaat) < simdiDk, su = gun === bugun && mpgDk(s.baslangicSaat) <= simdiDk && simdiDk < mpgDk(s.bitisSaat);
                    return `<button type="button" class="mpg-ag-ders${b.iptal ? ' iptal' : ''}${gecti ? ' gecti' : ''}${su ? ' simdi' : ''}" style="--r:${b.renk}" onclick="miloDersRosterAc(${s.id})"><span class="mpg-ag-saat"><b>${s.baslangicSaat}</b><small>${s.bitisSaat}</small></span><span class="mpg-ag-ic"><b>${miloEsc(s.grup)}${s.dersPlani ? ' 📋' : ''}</b><small>${b.yas ? '<i class="mpg-yas">' + miloEsc(b.yas) + '</i>' : ''}${b.iptal ? '<i class="mpg-iptal">iptal</i>' : ''}${su ? '<i class="mpg-su">şu an</i>' : ''}</small></span><span class="mpg-ag-kisi${b.dolu ? ' dolu' : ''}"><b>${b.n}${s.kapasite ? '/' + s.kapasite : ''}</b>${s.kapasite ? `<i><u style="width:${oran}%"></u></i>` : '<small>kişi</small>'}</span></button>`; }).join('')}</div>`;
        }).join('')}</div>`;
        return;
    }
    // takvim: saat ekseni
    let min = Math.min(...prog.map(s => mpgDk(s.baslangicSaat))), max = Math.max(...prog.map(s => mpgDk(s.bitisSaat)));
    let bas = Math.max(0, Math.floor(Math.min(min, 9 * 60) / 60) * 60), son = Math.min(24 * 60, Math.ceil(Math.max(max, 18 * 60) / 60) * 60), PX = 1.5, H = (son - bas) * PX;
    let saatler = ''; for (let t = bas; t <= son; t += 60) saatler += `<div class="mpg-saat" style="top:${(t - bas) * PX}px">${String(t / 60).padStart(2, '0')}:00</div>`;
    let cizgiler = ''; for (let t = bas; t < son; t += 30) cizgiler += `<div class="mpg-cizgi${t % 60 ? ' yarim' : ''}" style="top:${(t - bas) * PX}px"></div>`;
    let sutunlar = MPG_GUN_SIRA.map(gun => {
        let l = gunSlot(gun).map(s => ({ s, a: mpgDk(s.baslangicSaat), b: mpgDk(s.bitisSaat) }));
        // çakışan dersler yan yana (şerit)
        let seritSon = []; l.forEach(x => { let i = seritSon.findIndex(v => v <= x.a); if (i < 0) { i = seritSon.length; seritSon.push(0); } seritSon[i] = x.b; x.serit = i; });
        l.forEach(x => { x.top = l.filter(y => y.a < x.b && x.a < y.b).reduce((m, y) => Math.max(m, y.serit + 1), 1); });
        let bloklar = l.map(x => {
            let b = mpgSlotBilgi(x.s, gun), h = Math.max(22, (x.b - x.a) * PX - 2), w = 100 / x.top, kisa = h < 40;
            return `<button type="button" class="mpg-blok${b.iptal ? ' iptal' : ''}${kisa ? ' kisa' : ''}" style="--r:${b.renk};top:${(x.a - bas) * PX + 1}px;height:${h}px;left:calc(${x.serit * w}% + 2px);width:calc(${w}% - 4px)" onclick="event.stopPropagation(); miloDersRosterAc(${x.s.id})" title="${miloEsc(x.s.grup + ' · ' + x.s.baslangicSaat + '–' + x.s.bitisSaat + (b.yas ? ' · ' + b.yas : '') + ' · ' + b.n + (x.s.kapasite ? '/' + x.s.kapasite : '') + ' kişi')}">
                <span class="mpg-b-saat">${x.s.baslangicSaat}${kisa ? '' : '–' + x.s.bitisSaat}</span><span class="mpg-b-ad">${miloEsc(x.s.grup)}${x.s.dersPlani ? ' 📋' : ''}</span>${kisa ? (b.yas ? '<span class="mpg-b-alt"><i>' + miloEsc(b.yas) + '</i></span>' : '') : `<span class="mpg-b-alt">${b.yas ? '<i>' + miloEsc(b.yas) + '</i>' : ''}<em class="${b.dolu ? 'dolu' : ''}">👥 ${b.n}${x.s.kapasite ? '/' + x.s.kapasite : ''}</em></span>`}${b.iptal ? '<span class="mpg-b-iptal">İPTAL</span>' : ''}</button>`;
        }).join('');
        let simdiCizgi = gun === bugun && simdiDk >= bas && simdiDk <= son ? `<div class="mpg-simdi" style="top:${(simdiDk - bas) * PX}px"></div>` : '';
        return `<div class="mpg-gun${gun === bugun ? ' bugun' : ''}" style="height:${H}px" onclick="mpgBosTik(event, ${gun}, ${bas}, ${PX})" title="Boş yere dokun: bu gün ve saatte yeni ders">${bloklar}${simdiCizgi}</div>`;
    }).join('');
    ic.innerHTML = ust + lejant + `<div class="mpg-takvim"><div class="mpg-ic">
        <div class="mpg-bas-sat"><div></div>${MPG_GUN_SIRA.map(gun => `<div class="${gun === bugun ? 'bugun' : ''}"><b>${MILO_GUN_KISA_TR[gun]}</b><small>${gunSlot(gun).length || ''}</small></div>`).join('')}</div>
        <div class="mpg-govde"><div class="mpg-saatler" style="height:${H}px">${saatler}</div><div class="mpg-alan" style="height:${H}px">${cizgiler}<div class="mpg-sutunlar">${sutunlar}</div></div></div>
    </div></div><div class="mpg-ipucu">Derse dokun: katılımcılar, plan, iptal · Boş yere dokun: o gün ve saatte yeni ders</div>`;
};
function mpgBosTik(e, gun, bas, px) {
    let r = e.currentTarget.getBoundingClientRect(), dk = bas + Math.round((e.clientY - r.top) / px / 15) * 15;
    mpgYeniDers(gun, String(Math.floor(dk / 60)).padStart(2, '0') + ':' + String(dk % 60).padStart(2, '0'));
}
function mpgYeniDers(gun, saat) {
    if (typeof _miloGunSeciciState !== 'undefined') _miloGunSeciciState['mds-gun'] = new Set([gun]);
    if (saat && typeof _mds !== 'undefined') _mds.bas = saat;
    if (typeof mdsCiz === 'function') mdsCiz();
    let k = document.getElementById('mds-kap'); if (k) k.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('📅 ' + MILO_GUN_ADI[gun] + (saat ? ' ' + saat : '') + ' — şimdi kimin için olduğunu seç', 'info');
}
// başlık kartı
(function () {
    if (typeof miloProgramCiz !== 'function') return;
    let eski = miloProgramCiz;
    miloProgramCiz = function () {
        eski.apply(this, arguments);
        let iz = document.getElementById('milo-program-izgara'), kart = iz && iz.closest('.milo-card'); if (!kart) return;
        kart.classList.add('mpg-kart');
        let bas = kart.firstElementChild; if (bas && bas !== iz) bas.outerHTML = '<div class="mpg-baslik"><div><b>📅 Haftalık Program</b><small>' + new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }) + '</small></div><button type="button" class="mpg-yeni" onclick="mpgYeniDers(new Date().getDay(), null)">✨ Yeni ders</button></div>';
    };
})();

(function () {
    let st = document.createElement('style'); st.id = 'msp-css';
    st.textContent = `
.msp{display:flex;flex-direction:column;gap:8px}.msp .milo-input{margin-bottom:0}
.msp-kutu{border:1px solid var(--milo-teal);border-radius:14px;padding:12px;margin-top:8px;background:color-mix(in srgb,var(--milo-teal) 6%,transparent)}
.msp-cipler{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:thin}
.msp-cipler button{flex:0 0 auto;min-height:34px;padding:0 12px;border-radius:999px;border:1.3px solid var(--milo-line);background:var(--milo-card-raised);color:var(--milo-ink);font:inherit;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap}
.msp-cipler button i{font-style:normal;font-weight:700;color:var(--milo-ink-dim);margin-left:2px}
.msp-cipler button.aktif{border-color:var(--milo-teal);background:color-mix(in srgb,var(--milo-teal) 16%,transparent);color:var(--milo-teal)}.msp-cipler button.aktif i{color:inherit}
.msp-arac{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--milo-ink-dim)}.msp-arac span{flex:1}.msp-arac b{color:var(--milo-ink);font-size:14px}
.msp-arac button{background:none;border:0;color:var(--milo-teal);font:inherit;font-size:12px;font-weight:800;cursor:pointer;padding:6px 4px}
.msp-liste{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;max-height:340px;overflow:auto;padding:1px}
.msp-uye{display:flex;align-items:center;gap:9px;text-align:left;padding:9px 10px;border-radius:12px;border:1.3px solid var(--milo-line);background:var(--milo-card-raised);color:var(--milo-ink);font:inherit;cursor:pointer;min-height:48px}
.msp-uye:hover{border-color:color-mix(in srgb,var(--milo-teal) 60%,var(--milo-line))}
.msp-uye.uygun{box-shadow:inset 3px 0 0 var(--milo-sun)}
.msp-uye.sec{border-color:var(--milo-teal);background:color-mix(in srgb,var(--milo-teal) 12%,var(--milo-card-raised))}
.msp-tik{flex:0 0 22px;height:22px;border-radius:7px;border:1.5px solid var(--milo-line);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:var(--milo-bg)}.msp-uye.sec .msp-tik{background:var(--milo-teal);border-color:var(--milo-teal)}
.msp-ad{display:flex;flex-direction:column;min-width:0}.msp-ad b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.msp-ad small{font-size:10.5px;color:var(--milo-ink-dim)}.msp-ad em{font-style:normal;color:var(--milo-coral);font-weight:700}
.msp-bos{grid-column:1/-1;font-size:12px;color:var(--milo-ink-dim);text-align:center;padding:14px;border:1px dashed var(--milo-line);border-radius:12px}
.msp-duz{background:color-mix(in srgb,var(--milo-teal) 12%,transparent);border:1px solid var(--milo-teal);color:var(--milo-teal);border-radius:6px;padding:4px 8px;font-size:11px;cursor:pointer;vertical-align:middle}
.msp-grupad-bas{font-weight:900;font-size:13.5px;color:var(--milo-ink);margin-bottom:8px;display:flex;flex-direction:column;gap:2px}.msp-grupad-bas small{font-weight:600;font-size:11px;color:var(--milo-ink-dim)}
.msp-grupad-sat{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--milo-line)}.msp-grupad-sat b{font-size:13px;color:var(--milo-ink)}.msp-grupad-sat span{flex:1;font-size:11.5px;color:var(--milo-ink-dim)}
.msp-grupad-sat button{background:none;border:1px solid var(--milo-line);color:var(--milo-ink);border-radius:8px;padding:6px 10px;font:inherit;font-size:11.5px;font-weight:800;cursor:pointer}
#milo-drm-aday-liste .msp-liste{grid-template-columns:minmax(0,1fr);max-height:300px}

.mpg-kart{padding-bottom:12px}
.mpg-baslik{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.mpg-baslik b{display:block;font-size:17px;font-weight:900;color:var(--milo-ink)}.mpg-baslik small{font-size:11.5px;color:var(--milo-ink-dim)}
.mpg-yeni{border:0;border-radius:12px;padding:10px 14px;background:var(--milo-teal);color:var(--milo-bg);font:inherit;font-weight:900;font-size:12.5px;cursor:pointer;white-space:nowrap}
.mpg-ust{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.mpg-ozet{display:flex;gap:6px;flex-wrap:wrap}.mpg-ozet span{font-size:11.5px;color:var(--milo-ink-dim);background:var(--milo-card-raised);border:1px solid var(--milo-line);border-radius:999px;padding:4px 10px}.mpg-ozet b{color:var(--milo-ink);font-variant-numeric:tabular-nums}
.mpg-sec{display:inline-flex;border:1px solid var(--milo-line);border-radius:10px;overflow:hidden}.mpg-sec button{border:0;background:transparent;color:var(--milo-ink-dim);font:inherit;font-size:12px;font-weight:800;padding:7px 12px;cursor:pointer}.mpg-sec button.aktif{background:var(--milo-teal);color:var(--milo-bg)}
.mpg-lejant{display:flex;gap:4px 12px;flex-wrap:wrap;font-size:10.5px;color:var(--milo-ink-dim);margin-bottom:10px}.mpg-lejant span{display:inline-flex;align-items:center;gap:5px}.mpg-lejant i{width:10px;height:10px;border-radius:3px;display:inline-block}
.mpg-bos{padding:24px;text-align:center;font-size:13px;color:var(--milo-ink-dim);border:1px dashed var(--milo-line);border-radius:14px}
.mpg-takvim{overflow-x:auto;border:1px solid var(--milo-line);border-radius:14px;background:var(--milo-card)}
.mpg-ic{min-width:640px}
.mpg-bas-sat{display:grid;grid-template-columns:48px repeat(7,minmax(0,1fr));border-bottom:1px solid var(--milo-line);position:sticky;top:0;background:var(--milo-card);z-index:2}
.mpg-bas-sat>div{padding:8px 4px;text-align:center;display:flex;flex-direction:column;gap:1px}.mpg-bas-sat b{font-size:11.5px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;color:var(--milo-ink-dim)}.mpg-bas-sat small{font-size:10px;color:var(--milo-ink-dim);min-height:12px}
.mpg-bas-sat .bugun b{color:var(--milo-coral)}.mpg-bas-sat .bugun{box-shadow:inset 0 -2px 0 var(--milo-coral)}
.mpg-govde{display:grid;grid-template-columns:48px minmax(0,1fr)}
.mpg-saatler{position:relative}.mpg-saat{position:absolute;right:6px;transform:translateY(-50%);font-size:10px;font-weight:700;color:var(--milo-ink-dim);font-variant-numeric:tabular-nums}.mpg-saat:first-child{transform:none}
.mpg-alan{position:relative}.mpg-cizgi{position:absolute;left:0;right:0;border-top:1px solid var(--milo-line)}.mpg-cizgi.yarim{border-top-style:dashed;opacity:.5}
.mpg-sutunlar{position:absolute;inset:0;display:grid;grid-template-columns:repeat(7,minmax(0,1fr))}
.mpg-gun{position:relative;border-left:1px solid var(--milo-line);cursor:copy}.mpg-gun.bugun{background:color-mix(in srgb,var(--milo-coral) 5%,transparent)}
.mpg-blok{position:absolute;display:flex;flex-direction:column;gap:1px;align-items:flex-start;text-align:left;overflow:hidden;border:0;border-left:3px solid var(--r);border-radius:8px;padding:4px 6px;background:color-mix(in srgb,var(--r) 18%,var(--milo-card));color:var(--milo-ink);font:inherit;cursor:pointer;box-shadow:0 1px 0 color-mix(in srgb,var(--r) 30%,transparent);transition:transform .12s,box-shadow .12s;z-index:1}
.mpg-blok:hover,.mpg-blok:focus-visible{transform:translateY(-1px);box-shadow:0 6px 16px -8px var(--r);z-index:3}
.mpg-b-saat{font-size:10px;font-weight:800;color:var(--milo-ink-dim);font-variant-numeric:tabular-nums}.mpg-b-ad{font-size:11.5px;font-weight:900;line-height:1.15;color:var(--milo-ink);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.mpg-blok.kisa{flex-direction:row;align-items:center;gap:5px}.mpg-blok.kisa .mpg-b-ad{-webkit-line-clamp:1;font-size:10.5px}
.mpg-b-alt{display:flex;gap:4px;flex-wrap:wrap;margin-top:auto;font-size:9.5px}.mpg-b-alt i{font-style:normal;font-weight:900;padding:1px 6px;border-radius:999px;background:color-mix(in srgb,var(--r) 30%,transparent);color:var(--milo-ink)}.mpg-b-alt em{font-style:normal;color:var(--milo-ink-dim);font-weight:700}.mpg-b-alt em.dolu{color:var(--milo-coral)}
.mpg-blok.iptal{opacity:.55;background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--milo-coral) 12%,var(--milo-card)) 0 6px,var(--milo-card) 6px 12px)}.mpg-b-iptal{position:absolute;top:3px;right:4px;font-size:8.5px;font-weight:900;color:var(--milo-coral)}
.mpg-simdi{position:absolute;left:-1px;right:0;border-top:2px solid var(--milo-coral);z-index:4;pointer-events:none}.mpg-simdi::before{content:'';position:absolute;left:-4px;top:-5px;width:8px;height:8px;border-radius:50%;background:var(--milo-coral)}
.mpg-ipucu{font-size:10.5px;color:var(--milo-ink-dim);margin-top:6px;text-align:center}
.mpg-ajanda{display:flex;flex-direction:column;gap:10px}
.mpg-ag-bas{display:flex;align-items:center;gap:8px;padding:2px 2px 6px}.mpg-ag-bas b{font-size:13.5px;color:var(--milo-ink)}.mpg-ag-bas em{font-style:normal;font-size:10px;font-weight:900;color:var(--milo-bg);background:var(--milo-coral);padding:2px 7px;border-radius:999px}.mpg-ag-bas span{flex:1;font-size:11px;color:var(--milo-ink-dim)}
.mpg-ag-bas button{border:1px dashed var(--milo-line);background:none;color:var(--milo-ink-dim);border-radius:8px;padding:5px 10px;font:inherit;font-size:11px;font-weight:800;cursor:pointer}
.mpg-ag-gun.bugun{padding:8px;border-radius:14px;background:color-mix(in srgb,var(--milo-coral) 6%,transparent)}
.mpg-ag-ders{width:100%;display:flex;align-items:center;gap:12px;text-align:left;padding:10px 12px;margin-bottom:6px;border-radius:12px;border:1px solid var(--milo-line);border-left:4px solid var(--r);background:var(--milo-card-raised);color:var(--milo-ink);font:inherit;cursor:pointer}
.mpg-ag-ders.gecti{opacity:.55}.mpg-ag-ders.simdi{border-color:var(--milo-coral);box-shadow:0 0 0 1px var(--milo-coral)}.mpg-ag-ders.iptal{opacity:.6}
.mpg-ag-saat{display:flex;flex-direction:column;min-width:44px;font-variant-numeric:tabular-nums}.mpg-ag-saat b{font-size:14px;font-weight:900}.mpg-ag-saat small{font-size:10.5px;color:var(--milo-ink-dim)}
.mpg-ag-ic{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.mpg-ag-ic b{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mpg-ag-ic small{display:flex;gap:4px;flex-wrap:wrap}
.mpg-ag-ic i{font-style:normal;font-size:10px;font-weight:900;padding:2px 7px;border-radius:999px}.mpg-yas{background:color-mix(in srgb,var(--r) 25%,transparent);color:var(--milo-ink)}.mpg-iptal{background:color-mix(in srgb,var(--milo-coral) 18%,transparent);color:var(--milo-coral)}.mpg-su{background:var(--milo-coral);color:var(--milo-bg)}
.mpg-ag-kisi{display:flex;flex-direction:column;align-items:flex-end;gap:4px;min-width:52px}.mpg-ag-kisi b{font-size:13px;font-variant-numeric:tabular-nums}.mpg-ag-kisi.dolu b{color:var(--milo-coral)}.mpg-ag-kisi small{font-size:10px;color:var(--milo-ink-dim)}
.mpg-ag-kisi i{display:block;width:52px;height:5px;border-radius:3px;background:var(--milo-line);overflow:hidden}.mpg-ag-kisi u{display:block;height:100%;background:var(--r);text-decoration:none}.mpg-ag-kisi.dolu u{background:var(--milo-coral)}
@media (prefers-reduced-motion:reduce){.mpg-blok{transition:none}}`;
    document.head.appendChild(st);
})();
// 15 sn otomatik yenileme: sporcu seçerken / bir kutuya yazarken ekran baştan çizilmesin
function mspMesgul() {
    let ic = document.getElementById('milo-icerik'), a = document.activeElement;
    if (ic && a && ic.contains(a) && /INPUT|SELECT|TEXTAREA/.test(a.tagName)) return true;
    if (typeof miloGrupAtamaAcik !== 'undefined' && miloGrupAtamaAcik && miloAktifSekme === 'ders') return true;
    let m = document.getElementById('milo-ders-roster-modal'); return !!(m && m.style.display === 'flex');
}
