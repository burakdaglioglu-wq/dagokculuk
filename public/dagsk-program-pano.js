/* DAĞ · Haftalık Program "Pano" + sade "Liste" ders penceresi (2026-10-08, kullanıcı Milo için seçtiği iki tasarımı
   "hem Milo'ya hem DAĞ'a entegre et, bir önceki değişiklikle birlikte" dedi).
   1) programIzgaraCiz → Pano: her gün bir sütun (Pzt→Paz, bu haftanın tarihleri), dersler kart: büyük saat, bitiş, sporcu
      yuvarlakları, n/kapasite + doluluk çubuğu, 🔕 hatırlatma kapalıysa simge, o haftaki iptal çizili. Bugünün sütunu
      vurgulu, geçen dersler soluk. Telefonda günler yana kaydırılır (bugüne kayar). Sütun altındaki "+ ders" yeni ders
      formunda o günü seçer.
   2) dersRosterAc/Ciz → alttan açılan sade pencere: satırlar (Günler · Saat · Kapasite · Hatırlatma · Plan · İptaller)
      dokununca açılır ve anında kaydolur; sporcu listesinde bugünkü yoklama yuvarlağı, devam noktası, not, çıkar;
      "+ Sporcu ekle" araması (pasifler "Aktif et ve ekle" ile). Eski fonksiyonlar (ekle/çıkar/yoklama/not/PDF/sil)
      aynen kullanılır. Renkler DAĞ temasının token'larından (açık/koyu tema ikisinde de çalışır). dpk* önekli. */
const DPK_GUN = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'], DPK_GUNU = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'], DPK_SIRA = [1, 2, 3, 4, 5, 6, 0];
let _dpk = { acik: null, q: '' };
function dpkDk(t) { let [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); }
function dpkSaat(d) { d = ((d % 1440) + 1440) % 1440; return String(Math.floor(d / 60)).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0'); }
function dpkISO(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dpkGunler(s) { return (s.gunler && s.gunler.length ? s.gunler : [s.gun]).map(Number); }
function dpkGunYazi(s) { let g = dpkGunler(s); return DPK_SIRA.filter(x => g.includes(x)).map(x => DPK_GUN[x]).join(', '); }
function dpkHafta() { let b = new Date(), fark = (b.getDay() + 6) % 7, p = new Date(b.getFullYear(), b.getMonth(), b.getDate() - fark), o = {}; DPK_SIRA.forEach((g, i) => { o[g] = new Date(p.getFullYear(), p.getMonth(), p.getDate() + i); }); return o; }
function dpkIni(ad) { return String(ad).split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join(''); }
function dpkHue(ad) { let h = 0; for (let c of String(ad)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function dpkAt(v) { return esc(v).replace(/"/g, '&quot;'); }

// ============ 1) PANO ============
programIzgaraCiz = function () {
    try { dersOneriCiz(); } catch (e) {}
    let ic = document.getElementById('program-izgara-ic'); if (!ic) return;
    let hafta = dpkHafta(), bugun = new Date().getDay(), simdi = new Date(), sDk = simdi.getHours() * 60 + simdi.getMinutes();
    let gunSlot = g => _programSlotlar.filter(s => dpkGunler(s).includes(g)).sort((a, b) => a.baslangicSaat.localeCompare(b.baslangicSaat));
    let topDers = _programSlotlar.reduce((a, s) => a + dpkGunler(s).length, 0), kisi = new Set(), kap = 0, dolu = 0;
    _programSlotlar.forEach(s => { (s.katilimcilar || []).forEach(k => kisi.add(k.grup + '|' + k.ad)); if (s.kapasite) { kap += s.kapasite; dolu += Math.min((s.katilimcilar || []).length, s.kapasite); } });
    let kol = g => {
        let t = hafta[g], iso = dpkISO(t), l = gunSlot(g);
        let kartlar = l.map(s => {
            let n = (s.katilimcilar || []).length, dl = s.kapasite && n >= s.kapasite, ipt = (s.istisnalar || []).some(i => i.tarih === iso);
            let gecti = g === bugun && dpkDk(s.bitisSaat) < sDk, su = g === bugun && dpkDk(s.baslangicSaat) <= sDk && sDk < dpkDk(s.bitisSaat);
            let av = (s.katilimcilar || []).slice(0, 3).map(k => `<i style="--h:${dpkHue(k.ad)}">${esc(dpkIni(k.ad))}</i>`).join('') + (n > 3 ? `<i class="fazla">+${n - 3}</i>` : '');
            return `<button type="button" class="pno-kart${ipt ? ' iptal' : ''}${gecti ? ' gecti' : ''}${su ? ' simdi' : ''}" onclick="dersRosterAc(${s.id})" title="${dpkAt(s.baslangicSaat + '–' + s.bitisSaat + ' · ' + n + (s.kapasite ? '/' + s.kapasite : '') + ' sporcu')}">
                <span class="pno-s">${s.baslangicSaat}${su ? '<em>şu an</em>' : ''}${ipt ? '<em class="k">iptal</em>' : ''}</span><span class="pno-b">– ${s.bitisSaat}${s.dersPlani ? ' · 📋' : ''}</span>
                <span class="pno-alt"><span class="pno-av">${av || '<small>sporcu yok</small>'}</span><b class="${dl ? 'dolu' : ''}">${n}${s.kapasite ? '/' + s.kapasite : ''}</b></span>
                ${s.kapasite ? `<span class="pno-bar${dl ? ' dolu' : ''}"><u style="width:${Math.min(100, n / s.kapasite * 100)}%"></u></span>` : ''}</button>`;
        }).join('');
        return `<div class="pno-kol${g === bugun ? ' bugun' : ''}" data-gun="${g}"><div class="pno-kb"><b>${DPK_GUNU[g]}</b><small>${t.getDate()}</small></div><div class="pno-yigin">${kartlar}<button type="button" class="pno-ekle" onclick="dpkYeniDers(${g})">+ ders</button></div></div>`;
    };
    ic.innerHTML = `<div class="pno dpk-renk"><div class="pno-ozet"><span><b>${topDers}</b> ders</span><span><b>${kisi.size}</b> sporcu</span>${kap ? `<span><b>%${Math.round(dolu / kap * 100)}</b> dolu</span>` : ''}<span class="pno-tarih">${hafta[1].getDate()} – ${hafta[0].toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span></div>
        <div class="pno-izgara">${DPK_SIRA.map(kol).join('')}</div></div>`;
    let iz = ic.querySelector('.pno-izgara'), b = ic.querySelector('.pno-kol.bugun');
    if (iz && b && iz.scrollWidth > iz.clientWidth + 4) iz.scrollLeft += b.getBoundingClientRect().left - iz.getBoundingClientRect().left - 4;
};
function dpkYeniDers(g) {
    try { _gunSeciciState['program-gun'] = new Set([g]); let c = document.getElementById('program-gun-container'); if (c) c.innerHTML = _gunSeciciIcerikHTML('program-gun'); } catch (e) {}
    let c = document.getElementById('program-gun-container'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
    showToast('📅 ' + DPK_GUNU[g] + ' seçildi — saati ayarlayıp "Ekle"ye bas', 'info');
}

// ============ 2) DERS PENCERESİ ============
function dpkKap() {
    let m = document.getElementById('ders-roster-modal'); if (!m) return null;
    let k = document.getElementById('dpk-ic');
    if (!k) {
        m.innerHTML = '<div class="dpk dpk-renk" role="dialog" aria-modal="true" aria-label="Ders"><div class="dpk-tut"></div><div id="dpk-ic"></div></div>';
        m.classList.add('dpk-arka');
        m.addEventListener('click', e => { if (e.target === m) dersRosterKapat(); });
        k = document.getElementById('dpk-ic');
    }
    return k;
}
dersRosterAc = function (slotId) {
    _drmAcikSlotId = slotId; _drmDuzenleAcik = false; _dpk = { acik: null, q: '' };
    dpkKap(); dersRosterCiz();
    let m = document.getElementById('ders-roster-modal'); m.style.display = 'flex';
    let d = m.querySelector('.dpk'); if (d) d.scrollTop = 0;
};
function dpkSatir(id, etiket, deger, ic) {
    let a = _dpk.acik === id;
    return `<button type="button" class="dpk-row${a ? ' acik' : ''}" aria-expanded="${a}" onclick="dpkAc('${id}')"><span>${etiket}</span><b>${deger}<i class="dpk-chev">›</i></b></button>${a ? `<div class="dpk-duz">${ic}</div>` : ''}`;
}
function dpkAc(id) { _dpk.acik = _dpk.acik === id ? null : id; dersRosterCiz(); if (id === 'ekle' && _dpk.acik) setTimeout(() => { let e = document.getElementById('dpk-ara'); if (e) e.focus(); }, 30); }
function dpkYaklasan(s, n) {
    let g = dpkGunler(s), l = [], d = new Date(), sDk = d.getHours() * 60 + d.getMinutes();
    for (let i = 0; i < 60 && l.length < n; i++) {
        let t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
        if (!g.includes(t.getDay()) || (i === 0 && dpkDk(s.bitisSaat) < sDk)) continue;
        let iso = dpkISO(t); l.push({ iso, t, iptal: (s.istisnalar || []).find(x => x.tarih === iso) });
    }
    return l;
}
dersRosterCiz = function () {
    let s = _drmSlot(), k = dpkKap(); if (!s || !k) return;
    let roster = (s.katilimcilar || []).slice().sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    let gun = dpkGunler(s), sure = dpkDk(s.bitisSaat) - dpkDk(s.baslangicSaat), yak = dpkYaklasan(s, 6), iptSay = yak.filter(x => x.iptal).length;
    let hdk = s.hatirlatmaDakika || 30;
    let satirlar = dpkSatir('gun', 'Günler', esc(dpkGunYazi(s)),
            `<div class="dpk-gunler">${DPK_SIRA.map(g => `<button type="button" class="${gun.includes(g) ? 'on' : ''}" onclick="dpkGunDegis(${g})">${DPK_GUN[g]}</button>`).join('')}</div>`)
        + dpkSatir('saat', 'Saat', s.baslangicSaat + ' – ' + s.bitisSaat,
            `<div class="dpk-saat"><input type="time" value="${s.baslangicSaat}" onchange="dpkSaatDegis(this.value, null)" aria-label="Başlangıç"><span>–</span><input type="time" value="${s.bitisSaat}" onchange="dpkSaatDegis(null, this.value)" aria-label="Bitiş"></div>
             <div class="dpk-cipler">${[45, 60, 75, 90, 120].map(d => `<button type="button" class="${sure === d ? 'on' : ''}" onclick="dpkSaatDegis(null, '${dpkSaat(dpkDk(s.baslangicSaat) + d)}')">${d} dk</button>`).join('')}</div>`)
        + dpkSatir('kap', 'Kapasite', s.kapasite ? s.kapasite + ' sporcu' : 'Sınırsız',
            `<div class="dpk-cipler">${[6, 8, 10, 12, 15, 20, 0].map(n => `<button type="button" class="${(s.kapasite || 0) === n ? 'on' : ''}" onclick="dpkPut({ kapasite: ${n || 'null'} }, '${n ? 'Kapasite ' + n : 'Kapasite sınırsız'}')">${n || 'Sınırsız'}</button>`).join('')}</div>`)
        + dpkSatir('zil', 'Hatırlatma', s.hatirlatmaAktif ? hdk + ' dk önce' : '<em>kapalı</em>',
            `<div class="dpk-cipler"><button type="button" class="${s.hatirlatmaAktif ? '' : 'on'}" onclick="dpkPut({ hatirlatmaAktif: false }, 'Hatırlatma kapalı')">Kapalı</button>${[15, 30, 60, 120].map(d => `<button type="button" class="${s.hatirlatmaAktif && hdk === d ? 'on' : ''}" onclick="dpkPut({ hatirlatmaAktif: true, hatirlatmaDakika: ${d} }, 'Ders başlamadan ${d} dk önce')">${d} dk önce</button>`).join('')}</div>
             <div class="dpk-ipucu">Bildirim bu derse kayıtlı sporcuların telefonuna gider.${s.sonHatirlatmaTarihi ? ' Son gönderim: ' + esc(formatTarih(s.sonHatirlatmaTarihi)) + '.' : ''}</div>`)
        + dpkSatir('plan', 'Plan', s.dersPlani ? `<span class="dpk-kisa">${esc(s.dersPlani)}</span>` : '<em>ekle</em>',
            `<textarea id="dpk-plan" class="dpk-plan" placeholder="Bugün ne çalışılacak?">${esc(s.dersPlani || '')}</textarea><div class="dpk-sag"><button type="button" class="dpk-kucuk" onclick="dpkPlanKaydet()">Kaydet</button></div>`)
        + dpkSatir('iptal', 'İptaller', iptSay ? `<span class="dpk-kirmizi">${iptSay} iptal</span>` : '<em>yok</em>',
            `<div class="dpk-tarihler">${yak.map(x => `<button type="button" class="${x.iptal ? 'off' : ''}" onclick="dpkIptal('${x.iso}')" title="${x.iptal ? 'İptali geri al' : 'Bu tarihi iptal et'}"><small>${DPK_GUN[x.t.getDay()]}</small><b>${x.t.getDate()}</b><small>${x.t.toLocaleDateString('tr-TR', { month: 'short' })}</small></button>`).join('')}</div><div class="dpk-ipucu">Tarihe dokun: o günün dersi iptal olur (sporculara hatırlatma gitmez), tekrar dokun: geri gelir.</div>`);

    let yb = (otomatikYoklamaDB || {})[bugunISO()] || {}, bugunDersi = gun.includes(new Date().getDay());
    let sporcular = roster.map(kk => {
        let kayit = yb[kk.ad] && yb[kk.ad].grup === kk.grup ? yb[kk.ad] : null, durum = !kayit ? '' : kayit.geldi === false ? 'yok' : 'var';
        let sp = turnuvaDB[kk.grup] && turnuvaDB[kk.grup][kk.ad], oran = null; try { oran = _dersDevamOraniHesapla(s, kk.grup, kk.ad, 6); } catch (e) {}
        let diger = _programSlotlar.filter(x => x.id !== s.id && (x.katilimcilar || []).some(z => z.grup === kk.grup && z.ad === kk.ad)).map(x => _gunlerEtiketKisa(x.gunler) + ' ' + x.baslangicSaat);
        let alt = [PROGRAM_GRUP_AD[kk.grup] || kk.grup, diger.length ? 'ayrıca ' + diger.join(', ') : '', sp && sp.genelNot ? '📝 ' + sp.genelNot : ''].filter(Boolean).join(' · ');
        let renk = oran === null ? '' : oran >= 80 ? 'var(--status-success, var(--neon-green))' : oran >= 50 ? 'var(--status-warning, var(--gold))' : 'var(--status-danger, var(--neon-red))';
        return `<div class="dpk-kisi"><button type="button" class="dpk-yok ${durum}" data-g="${dpkAt(kk.grup)}" data-a="${dpkAt(kk.ad)}" onclick="dersRosterYoklamaToggle(this.dataset.g, this.dataset.a)" title="Bugünkü yoklama: ${durum === 'var' ? 'geldi' : durum === 'yok' ? 'gelmedi' : 'işaretlenmedi'} — dokun: değiştir" aria-label="${dpkAt(kk.ad)} yoklama">${durum === 'var' ? '✓' : durum === 'yok' ? '✕' : ''}</button>
            <div><b>${esc(kk.ad)}</b><small>${esc(alt)}</small></div>${oran !== null ? `<span class="dpk-nokta" style="background:${renk}" title="Son 6 derste devam %${oran}"></span>` : ''}
            <button type="button" class="dpk-ik" data-g="${dpkAt(kk.grup)}" data-a="${dpkAt(kk.ad)}" onclick="dersRosterNotDuzenle(this.dataset.g, this.dataset.a)" title="Özel not" aria-label="Not">✎</button>
            <button type="button" class="dpk-ik" data-g="${dpkAt(kk.grup)}" data-a="${dpkAt(kk.ad)}" onclick="dpkCikar(this.dataset.g, this.dataset.a)" title="Dersten çıkar" aria-label="Çıkar">✕</button></div>`;
    }).join('');
    let ekle = _dpk.acik === 'ekle'
        ? `<div class="dpk-ekle-ic"><input id="dpk-ara" class="dpk-ara" type="search" placeholder="Sporcu ara…" value="${dpkAt(_dpk.q)}" oninput="_dpk.q=this.value; dpkAdayCiz()" autocomplete="off"><div id="dpk-adaylar"></div></div>`
        : `<button type="button" class="dpk-ekle" onclick="dpkAc('ekle')"><i>+</i>Sporcu ekle</button>`;
    k.innerHTML = `<div class="dpk-hd"><h3 class="dpk-h">${esc(dpkGunYazi(s))} · ${s.baslangicSaat}</h3><div class="dpk-sub">${roster.length}${s.kapasite ? ' / ' + s.kapasite : ''} sporcu · ${s.baslangicSaat}–${s.bitisSaat}${s.hatirlatmaAktif ? '' : ' · 🔕'}</div></div>
        <div class="dpk-grp">${satirlar}</div>
        <div class="dpk-lbl"><span>Sporcular</span>${roster.length && bugunDersi ? '<button type="button" onclick="dersRosterYoklamaHepsi()">Hepsi geldi</button>' : ''}</div>
        <div class="dpk-grp">${sporcular || '<div class="dpk-bos">Henüz sporcu yok.</div>'}${ekle}</div>
        ${roster.length ? '<div class="dpk-not">Soldaki yuvarlak bugünkü yoklama: dokun → geldi ✓ / gelmedi ✕.</div>' : ''}
        <div class="dpk-ft"><button type="button" class="dpk-bitti" onclick="dersRosterKapat()">Bitti</button>
            <div class="dpk-ft2"><button type="button" onclick="dersRosterPdfIndir()">Yoklama PDF</button><button type="button" class="dpk-sil" onclick="dersRosterSil()">Dersi sil</button></div></div>`;
    if (_dpk.acik === 'ekle') dpkAdayCiz();
};
function dpkAdayCiz() {
    let el = document.getElementById('dpk-adaylar'), s = _drmSlot(); if (!el || !s) return;
    let q = (_dpk.q || '').trim().toLocaleLowerCase('tr');
    if (!q) { el.innerHTML = '<div class="dpk-ipucu" style="padding:8px 4px">İsim yazınca sporcular çıkar.</div>'; return; }
    let var_ = new Set((s.katilimcilar || []).map(k => k.grup + '|' + k.ad)), akt = [], pas = [];
    ['buyukler', 'yildizlar', 'kucukler', 'minikler'].forEach(g => Object.keys(turnuvaDB[g] || {}).forEach(ad => {
        if (var_.has(g + '|' + ad) || !ad.toLocaleLowerCase('tr').includes(q)) return;
        (turnuvaDB[g][ad].pasif ? pas : akt).push({ g, ad });
    }));
    let sat = (a, p) => `<div class="dpk-aday"><div><b>${esc(a.ad)}</b><small>${esc(PROGRAM_GRUP_AD[a.g] || a.g)}${p ? ' · pasif' : ''}</small></div><button type="button" class="${p ? 'pas' : ''}" data-g="${dpkAt(a.g)}" data-a="${dpkAt(a.ad)}" onclick="${p ? 'dersRosterAktifEtVeEkle' : 'dersRosterKatilimciEkle'}(this.dataset.g, this.dataset.a)">${p ? 'Aktif et ve ekle' : 'Ekle'}</button></div>`;
    let srt = (a, b) => a.ad.localeCompare(b.ad, 'tr');
    el.innerHTML = akt.sort(srt).slice(0, 25).map(a => sat(a, false)).join('') + pas.sort(srt).slice(0, 8).map(a => sat(a, true)).join('') || '<div class="dpk-ipucu" style="padding:8px 4px">Eşleşen sporcu yok.</div>';
}
function dpkPut(alan, mesaj) {
    let s = _drmSlot(); if (!s) return;
    return fetch('/api/antrenman-programi/' + s.id, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.assign({}, alan, { deviceId: _cihazId })) })
        .then(r => r.json()).then(d => {
            if (!d.applied) return showToast('Kaydedilemedi.', 'error');
            Object.assign(s, alan); if (alan.gunler) s.gun = Math.min.apply(null, alan.gunler);
            if ('hatirlatmaAktif' in alan) s.hatirlatmaAktif = alan.hatirlatmaAktif ? 1 : 0;
            dersRosterCiz(); programIzgaraCiz(); if (mesaj) showToast('✓ ' + mesaj, 'success');
        }).catch(() => showToast('Bağlantı hatası.', 'error'));
}
function dpkGunDegis(g) {
    let s = _drmSlot(); if (!s) return;
    let l = dpkGunler(s); l = l.includes(g) ? l.filter(x => x !== g) : l.concat(g);
    if (!l.length) return showToast('En az bir gün kalmalı.', 'warning');
    dpkPut({ gunler: l.sort((a, b) => a - b) }, 'Günler: ' + DPK_SIRA.filter(x => l.includes(x)).map(x => DPK_GUN[x]).join(', '));
}
function dpkSaatDegis(bas, bit) {
    let s = _drmSlot(); if (!s) return;
    let sure = dpkDk(s.bitisSaat) - dpkDk(s.baslangicSaat);
    if (bas && !bit) bit = dpkSaat(dpkDk(bas) + (sure > 0 ? sure : 90));
    bas = bas || s.baslangicSaat; bit = bit || s.bitisSaat;
    if (dpkDk(bit) <= dpkDk(bas)) return showToast('Bitiş başlangıçtan sonra olmalı.', 'warning');
    dpkPut({ baslangicSaat: bas, bitisSaat: bit }, bas + ' – ' + bit);
}
function dpkPlanKaydet() { let e = document.getElementById('dpk-plan'); if (!e) return; _dpk.acik = null; dpkPut({ dersPlani: e.value.trim() || null }, 'Plan kaydedildi'); }
function dpkIptal(iso) {
    let s = _drmSlot(); if (!s) return;
    let var_ = (s.istisnalar || []).some(x => x.tarih === iso);
    let istek = var_ ? fetch('/api/antrenman-programi/' + s.id + '/istisna?tarih=' + encodeURIComponent(iso) + '&deviceId=' + encodeURIComponent(_cihazId), { method: 'DELETE' })
        : fetch('/api/antrenman-programi/' + s.id + '/istisna', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tarih: iso, sebep: null, deviceId: _cihazId }) });
    istek.then(r => r.json()).then(d => {
        if (!d.applied) return showToast('Kaydedilemedi.', 'error');
        s.istisnalar = (s.istisnalar || []).filter(x => x.tarih !== iso); if (!var_) s.istisnalar.push({ tarih: iso, sebep: null });
        dersRosterCiz(); programIzgaraCiz();
        showToast(var_ ? '✓ ' + formatTarih(iso) + ' dersi geri geldi' : formatTarih(iso) + ' dersi iptal', var_ ? 'success' : 'warning');
    }).catch(() => showToast('Bağlantı hatası.', 'error'));
}
function dpkCikar(g, a) { if (confirm(a + ' bu dersten çıkarılsın mı?')) dersRosterKatilimciSil(g, a); }

(function () {
    let st = document.createElement('style'); st.id = 'dpk-css';
    st.textContent = `
.dpk-renk{--p-yuzey:var(--bg-main);--p-kart:color-mix(in srgb,var(--text-main) 6%,var(--bg-main));--p-kart2:color-mix(in srgb,var(--text-main) 10%,var(--bg-main));--p-ink:var(--text-main);--p-dim:var(--text-muted);--p-cizgi:var(--border-color);--p-acc:var(--accent,var(--accent-orange));--p-ok:var(--status-success,var(--neon-green));--p-bad:var(--status-danger,var(--neon-red))}
/* --- pano --- */
.pno{display:flex;flex-direction:column;gap:12px}
.pno-ozet{display:flex;gap:16px;flex-wrap:wrap;color:var(--p-dim);font-size:13px}.pno-ozet b{color:var(--p-ink);font-weight:800}.pno-tarih{margin-left:auto}
.pno-izgara{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
@media (max-width:1100px){.pno-izgara{grid-template-columns:repeat(7,minmax(150px,1fr));overflow-x:auto;padding-bottom:6px;scroll-snap-type:x proximity}}
@media (max-width:720px){.pno-izgara{grid-template-columns:repeat(7,78%);scroll-snap-type:x mandatory;scrollbar-width:none}.pno-kol{scroll-snap-align:start}}
.pno-kb{display:flex;align-items:baseline;justify-content:space-between;padding:0 4px 8px;font-size:13px}.pno-kb b{font-weight:800;color:var(--p-ink)}.pno-kb small{color:var(--p-dim);font-weight:700}
.pno-kol.bugun .pno-kb b,.pno-kol.bugun .pno-kb small{color:var(--p-acc)}
.pno-yigin{display:flex;flex-direction:column;gap:7px;min-height:110px;padding:6px;border-radius:16px;background:color-mix(in srgb,var(--p-ink) 3%,transparent)}
.pno-kol.bugun .pno-yigin{background:color-mix(in srgb,var(--p-acc) 9%,transparent)}
.pno-kart{display:flex;flex-direction:column;align-items:stretch;gap:2px;text-align:left;width:100%;padding:10px 11px;border-radius:13px;border:1px solid transparent;background:var(--p-kart2);color:var(--p-ink);font:inherit;cursor:pointer;transition:border-color .12s,transform .12s}
.pno-kart:hover{border-color:var(--p-cizgi);transform:translateY(-1px)}
.pno-kart.simdi{border-color:var(--p-acc)}.pno-kart.gecti{opacity:.5}.pno-kart.iptal{opacity:.55}.pno-kart.iptal .pno-s{text-decoration:line-through}
.pno-s{font-size:17px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.pno-s em{font-style:normal;font-size:10px;font-weight:800;padding:2px 7px;border-radius:999px;background:var(--p-acc);color:#fff;letter-spacing:0}.pno-s em.k{background:color-mix(in srgb,var(--p-bad) 20%,transparent);color:var(--p-bad)}
.pno-b{font-size:11.5px;color:var(--p-dim);font-variant-numeric:tabular-nums}
.pno-alt{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-top:7px}.pno-alt b{font-size:12.5px;font-weight:800;font-variant-numeric:tabular-nums;flex-shrink:0}.pno-alt b.dolu{color:var(--p-bad)}.pno-alt small{font-size:11px;color:var(--p-dim)}
.pno-av{display:flex;min-width:0;overflow:hidden}.pno-av i{width:22px;height:22px;border-radius:50%;margin-left:-6px;border:2px solid var(--p-kart2);font-style:normal;font-size:8.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;background:hsl(var(--h) 45% 30%);color:hsl(var(--h) 85% 88%);flex-shrink:0}.pno-av i:first-child{margin-left:0}.pno-av i.fazla{background:var(--p-cizgi);color:var(--p-ink);width:auto;min-width:22px;padding:0 4px;border-radius:999px}
.pno-bar{display:block;height:4px;border-radius:2px;background:var(--p-cizgi);overflow:hidden;margin-top:7px}.pno-bar u{display:block;height:100%;background:var(--p-acc)}.pno-bar.dolu u{background:var(--p-bad)}
.pno-ekle{border:1.5px dashed var(--p-cizgi);border-radius:12px;padding:9px;background:none;color:var(--p-dim);font:inherit;font-weight:700;font-size:12.5px;cursor:pointer}.pno-ekle:hover{color:var(--p-acc);border-color:var(--p-acc)}
/* --- ders penceresi --- */
#ders-roster-modal.dpk-arka{background:rgba(0,0,0,.6)!important;align-items:flex-end!important;justify-content:center!important;padding:0!important}
@media (min-width:640px){#ders-roster-modal.dpk-arka{align-items:center!important;padding:20px!important}}
.dpk{width:100%;max-width:460px;max-height:92vh;overflow-y:auto;background:var(--p-yuzey);color:var(--p-ink);border-radius:28px 28px 0 0;border:1px solid var(--p-cizgi);border-bottom:0;padding-bottom:max(12px,env(safe-area-inset-bottom));animation:dpkGir .22s ease-out;overscroll-behavior:contain;box-shadow:0 -20px 60px -30px rgba(0,0,0,.6)}
@media (min-width:640px){.dpk{border-radius:28px;border-bottom:1px solid var(--p-cizgi)}}
@keyframes dpkGir{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
.dpk-tut{width:38px;height:4px;border-radius:2px;background:var(--p-cizgi);margin:10px auto 0}
.dpk-hd{padding:16px 22px 4px}.dpk-h{margin:0;font-size:23px;font-weight:800;letter-spacing:-.025em;line-height:1.15}.dpk-sub{color:var(--p-dim);font-size:13.5px;margin-top:4px}
.dpk-grp{margin:14px 16px;background:var(--p-kart);border-radius:18px;overflow:hidden}.dpk-grp>*+*{border-top:1px solid var(--p-cizgi)}
.dpk-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;min-height:50px;font:inherit;font-size:14.5px;color:var(--p-ink);background:none;border:0;cursor:pointer;text-align:left}
.dpk-row>span{color:var(--p-dim);flex-shrink:0}.dpk-row>b{font-weight:700;display:flex;align-items:center;gap:8px;min-width:0;justify-content:flex-end}.dpk-row em{font-style:normal;font-weight:600;color:var(--p-dim)}
.dpk-chev{font-style:normal;color:var(--p-dim);font-size:18px;line-height:1;transition:transform .15s}.dpk-row.acik .dpk-chev{transform:rotate(90deg)}
.dpk-kisa{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}.dpk-kirmizi{color:var(--p-bad)}
.dpk-duz{padding:4px 16px 16px;border-top:0!important;display:flex;flex-direction:column;gap:10px}
.dpk-gunler{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.dpk-gunler button,.dpk-cipler button{border:0;font:inherit;cursor:pointer;font-weight:700;color:var(--p-dim);background:var(--p-kart2);transition:background .15s,color .15s}
.dpk-gunler button{height:40px;border-radius:12px;font-size:13px}.dpk-gunler button.on{background:var(--p-ink);color:var(--p-yuzey)}
.dpk-cipler{display:flex;flex-wrap:wrap;gap:6px}.dpk-cipler button{height:36px;padding:0 13px;border-radius:999px;font-size:13px}.dpk-cipler button.on{background:var(--p-acc);color:#fff}
.dpk-saat{display:flex;align-items:center;gap:10px}.dpk-saat span{color:var(--p-dim)}
.dpk-saat input{flex:1;min-width:0;height:46px;border-radius:12px;border:0;background:var(--p-kart2);color:var(--p-ink);font:inherit;font-size:17px;font-weight:800;padding:0 12px;font-variant-numeric:tabular-nums}
.dpk-plan{width:100%;min-height:90px;border:0;border-radius:14px;background:var(--p-kart2);color:var(--p-ink);padding:12px 14px;font:inherit;font-size:14px;resize:vertical;box-sizing:border-box}
.dpk-sag{display:flex;justify-content:flex-end}
.dpk-kucuk{height:38px;padding:0 16px;border-radius:12px;border:0;font:inherit;font-weight:800;font-size:13px;cursor:pointer;background:var(--p-acc);color:#fff}
.dpk-tarihler{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}
.dpk-tarihler button{flex:0 0 58px;height:66px;border-radius:14px;border:1.5px solid transparent;background:var(--p-kart2);color:var(--p-ink);font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
.dpk-tarihler b{font-size:18px;font-weight:800}.dpk-tarihler small{font-size:10.5px;color:var(--p-dim);font-weight:700}
.dpk-tarihler button.off{background:transparent;border-color:var(--p-bad);border-style:dashed}.dpk-tarihler button.off b{color:var(--p-bad);text-decoration:line-through}
.dpk-ipucu{font-size:12px;color:var(--p-dim)}
.dpk-lbl{display:flex;justify-content:space-between;align-items:center;padding:6px 22px 0;font-size:12px;font-weight:700;color:var(--p-dim);text-transform:uppercase;letter-spacing:.06em}
.dpk-lbl button{border:0;background:none;color:var(--p-acc);font:inherit;font-size:12.5px;font-weight:800;text-transform:none;letter-spacing:0;cursor:pointer;padding:6px 0}
.dpk-kisi{display:flex;align-items:center;gap:10px;padding:9px 8px 9px 14px}
.dpk-kisi>div{flex:1;min-width:0}.dpk-kisi b{display:block;font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dpk-kisi small{display:block;color:var(--p-dim);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dpk-yok{width:32px;height:32px;flex:0 0 32px;border-radius:50%;border:2px solid var(--p-cizgi);background:none;color:#fff;font:inherit;font-weight:900;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.dpk-yok.var{background:var(--p-ok);border-color:var(--p-ok)}.dpk-yok.yok{background:var(--p-bad);border-color:var(--p-bad)}
.dpk-nokta{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.dpk-ik{width:34px;height:34px;border-radius:50%;border:0;background:none;color:var(--p-dim);font-size:15px;cursor:pointer;flex-shrink:0}.dpk-ik:hover{background:var(--p-kart2)}
.dpk-ekle{width:100%;display:flex;align-items:center;gap:12px;padding:12px 16px;border:0;background:none;color:var(--p-acc);font:inherit;font-weight:700;font-size:14.5px;cursor:pointer;text-align:left}
.dpk-ekle i{width:32px;height:32px;border-radius:50%;background:color-mix(in srgb,var(--p-acc) 16%,transparent);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-size:19px}
.dpk-ekle-ic{padding:12px}.dpk-ara{width:100%;height:44px;border-radius:12px;border:1px solid transparent;background:var(--p-kart2);color:var(--p-ink);font:inherit;padding:0 14px;box-sizing:border-box}.dpk-ara:focus{outline:none;border-color:var(--p-acc)}
#dpk-adaylar{max-height:300px;overflow-y:auto;margin-top:6px}
.dpk-aday{display:flex;align-items:center;gap:10px;padding:8px 4px}.dpk-aday+.dpk-aday{border-top:1px solid var(--p-cizgi)}.dpk-aday>div{flex:1;min-width:0}.dpk-aday b{display:block;font-size:13.5px;font-weight:700}.dpk-aday small{color:var(--p-dim);font-size:12px}
.dpk-aday button{height:34px;padding:0 14px;border-radius:10px;border:0;background:var(--p-acc);color:#fff;font:inherit;font-weight:800;font-size:12.5px;cursor:pointer;flex-shrink:0}.dpk-aday button.pas{background:transparent;border:1px solid var(--p-ok);color:var(--p-ok)}
.dpk-bos{padding:16px;color:var(--p-dim);font-size:13.5px}.dpk-not{padding:0 22px;font-size:12px;color:var(--p-dim)}
.dpk-ft{padding:10px 16px 14px;display:flex;flex-direction:column;gap:6px}
.dpk-bitti{height:52px;border-radius:16px;border:0;background:var(--p-acc);color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
.dpk-ft2{display:flex;justify-content:space-between}.dpk-ft2 button{border:0;background:none;font:inherit;font-weight:700;font-size:14px;color:var(--p-dim);padding:10px 6px;cursor:pointer}.dpk-ft2 .dpk-sil{color:var(--p-bad)}
.dpk button:focus-visible,.dpk input:focus-visible,.dpk textarea:focus-visible,.pno button:focus-visible{outline:2px solid var(--p-acc);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.dpk{animation:none}.pno-kart,.dpk-chev{transition:none}}`;
    document.head.appendChild(st);
})();
