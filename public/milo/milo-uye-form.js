/* Milo · Üye ekle / düzenle (2026-10-08, kullanıcı: "sporcu ekle kısmını geliştir ve kolaylaştır, özelleştirme ekle;
   üye ismi değiştirmede problem; çocuğun kim olduğunu anlamak için isteğe bağlı küçük parantez içinde anne/veli adı").
   SORUN: düzenleme formunda Ad Soyad kutusu KİLİTLİYDİ (isim hiç değiştirilemiyordu), büyük harfe çevirme Türkçe değildi
   (i → I), düzenle/sil düğmeleri adında ' olan üyede bozuluyordu (miloEsc ≠ miloJsEsc).
   YENİ: üstte hızlı alanlar (ad, veli adı, telefon, doğum tarihi + canlı yaş, cinsiyet, grup çipleri + yaşa göre öneri);
   isteğe bağlı alanlar "⚙️ Formu özelleştir" ile seçilir (bu cihazda saklanır), düzenlemede dolu alanlar her zaman görünür.
   Veli adı = acilKisi alanı (aidat hatırlatmaları zaten "Veli" diye kullanıyor) → listelerde "AD (Veli)". muf* önekli. */
const MUF_ALANLAR = [
    ['katilma', '📅 Katılma tarihi', true], ['veli2', '👥 2. veli', false], ['saglik', '🏥 Sağlık notu', true],
    ['meslek', '💼 Aile mesleği', false], ['boykilo', '📏 Boy / kilo', false], ['antrenman', '🗓 Antrenman notu', false], ['genel', '📝 Genel not', false]
];
let _muf = { u: null, cins: 'K', grup: '', ozellestir: false };
function mufAyar() { let a = {}; try { a = JSON.parse(localStorage.getItem('milo_uye_form_alanlar') || '{}') || {}; } catch (e) {} MUF_ALANLAR.forEach(x => { if (a[x[0]] === undefined) a[x[0]] = x[2]; }); return a; }
function mufAyarDegis(k, v) { let a = mufAyar(); a[k] = v; try { localStorage.setItem('milo_uye_form_alanlar', JSON.stringify(a)); } catch (e) {} mufFormCiz(); }
function mufGruplar() {
    let s = new Set();
    (miloUyeler || []).forEach(u => u.grup && s.add(u.grup));
    (typeof miloProgram !== 'undefined' ? miloProgram : []).forEach(x => x.grup && s.add(x.grup));
    (typeof miloGruplar !== 'undefined' ? miloGruplar : []).forEach(g => g.ad && s.add(g.ad));
    return [...s].sort((a, b) => a.localeCompare(b, 'tr'));
}
function mufYasOneri(dogum) {
    if (!dogum || typeof mdsAy !== 'function' || typeof mdsPresetler !== 'function') return null;
    let a = mdsAy(dogum); if (a == null) return null;
    let p = mdsPresetler().find(x => a >= x.min && a < x.max); return p ? p.ad + ' (' + mdsAralikEtiket(p.min, p.max) + ')' : null;
}
function mufDeger(id) { let e = document.getElementById(id); return e ? e.value : ''; }
function miloAdVeliHTML(u) { return miloEsc(u.ad) + (u.acilKisi ? ' <span class="muf-veli">(' + miloEsc(u.acilKisi) + ')</span>' : ''); }

miloUyeFormAc = function (grup, ad) {
    miloUyeFormAcikMi = true;
    let u = (grup && ad) ? miloUyeler.find(x => x.grup === grup && x.ad === ad) : null;
    _muf = { u, cins: u ? (u.cinsiyet || 'K') : 'K', grup: u ? u.grup : '', ozellestir: false };
    mufFormCiz(true);
    let alan = document.getElementById('milo-uye-form-alani'); if (alan) alan.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { let e = document.getElementById('muf-ad'); if (e && !u) e.focus(); }, 60);
};
function mufFormCiz(ilk) {
    let alan = document.getElementById('milo-uye-form-alani'); if (!alan) return;
    // yeniden çizimde yazılanlar korunsun
    let onceki = {}; if (!ilk) alan.querySelectorAll('[data-muf]').forEach(e => { onceki[e.id] = e.type === 'checkbox' ? e.checked : e.value; });
    let u = _muf.u, ayar = mufAyar(), d = (id, alan2) => onceki[id] !== undefined ? onceki[id] : (u ? (u[alan2] == null ? '' : u[alan2]) : '');
    let goster = (k, alanlar) => ayar[k] || (u && alanlar.some(a => u[a] != null && u[a] !== ''));
    let dogum = d('muf-dogum', 'dogumTarihi'), yasYazi = dogum && typeof miloYasMetin === 'function' ? miloYasMetin(dogum) : '';
    let oneri = mufYasOneri(dogum);
    let gruplar = mufGruplar(), grup = onceki['muf-grup'] !== undefined ? onceki['muf-grup'] : _muf.grup;
    let alanHTML = '';
    if (goster('katilma', ['katilmaTarihi'])) alanHTML += `<label class="muf-alan"><span>📅 Katılma tarihi</span><input type="date" data-muf id="muf-katilma" class="milo-input" max="${bugunISO()}" value="${miloEsc(onceki['muf-katilma'] !== undefined ? onceki['muf-katilma'] : (u ? u.katilmaTarihi || '' : bugunISO()))}"></label>`;
    if (goster('veli2', ['veli2Kisi', 'veli2Telefon'])) alanHTML += `<label class="muf-alan"><span>👥 2. veli adı</span><input data-muf id="muf-veli2" class="milo-input" value="${miloEsc(d('muf-veli2', 'veli2Kisi'))}" placeholder="ör. Baba / anneanne"></label><label class="muf-alan"><span>📞 2. veli telefonu</span><input data-muf id="muf-veli2tel" type="tel" inputmode="tel" class="milo-input" value="${miloEsc(d('muf-veli2tel', 'veli2Telefon'))}"></label>`;
    if (goster('meslek', ['aileMeslek'])) alanHTML += `<label class="muf-alan"><span>💼 Aile mesleği</span><input data-muf id="muf-meslek" class="milo-input" value="${miloEsc(d('muf-meslek', 'aileMeslek'))}"></label>`;
    if (goster('boykilo', ['boy', 'kilo'])) alanHTML += `<label class="muf-alan"><span>📏 Boy (cm)</span><input data-muf id="muf-boy" type="number" class="milo-input" value="${miloEsc(d('muf-boy', 'boy'))}"></label><label class="muf-alan"><span>⚖️ Kilo (kg)</span><input data-muf id="muf-kilo" type="number" step="0.1" class="milo-input" value="${miloEsc(d('muf-kilo', 'kilo'))}"></label>`;
    if (goster('antrenman', ['antrenmanNotu'])) alanHTML += `<label class="muf-alan muf-tam"><span>🗓 Antrenman günü/saati notu</span><input data-muf id="muf-antrenman" class="milo-input" value="${miloEsc(d('muf-antrenman', 'antrenmanNotu'))}"></label>`;
    if (goster('saglik', ['saglikNotu'])) alanHTML += `<label class="muf-alan muf-tam"><span>🏥 Sağlık / özel durum (alerji, astım…)</span><textarea data-muf id="muf-saglik" class="milo-input">${miloEsc(d('muf-saglik', 'saglikNotu'))}</textarea></label>`;
    if (goster('genel', ['genelNot'])) alanHTML += `<label class="muf-alan muf-tam"><span>📝 Genel not</span><textarea data-muf id="muf-genel" class="milo-input">${miloEsc(d('muf-genel', 'genelNot'))}</textarea></label>`;
    alan.innerHTML = `<div class="milo-card muf">
        <div class="muf-ust"><div class="muf-baslik">${u ? '✏️ Üyeyi düzenle' : '➕ Yeni üye'}</div><button type="button" class="muf-link" onclick="_muf.ozellestir=!_muf.ozellestir; mufFormCiz()">⚙️ Formu özelleştir</button></div>
        ${_muf.ozellestir ? `<div class="muf-ozel"><div class="muf-ozel-bas">Formda hangi alanlar görünsün? <small>(bu cihazda hatırlanır)</small></div><div class="muf-ozel-l">${MUF_ALANLAR.map(x => `<label><input type="checkbox" ${ayar[x[0]] ? 'checked' : ''} onchange="mufAyarDegis('${x[0]}', this.checked)"> ${x[1]}</label>`).join('')}</div></div>` : ''}
        <div class="muf-izgara">
            <label class="muf-alan muf-tam"><span>Ad Soyad *</span><input data-muf id="muf-ad" class="milo-input muf-buyuk" value="${miloEsc(d('muf-ad', 'ad'))}" placeholder="Çocuğun adı soyadı" autocomplete="off"></label>
            <label class="muf-alan"><span>Veli adı <small>(isimde parantez içinde görünür)</small></span><input data-muf id="muf-veli" class="milo-input" value="${miloEsc(d('muf-veli', 'acilKisi'))}" placeholder="ör. Ayşe (anne)"></label>
            <label class="muf-alan"><span>📞 Veli telefonu</span><input data-muf id="muf-tel" type="tel" inputmode="tel" class="milo-input" value="${miloEsc(d('muf-tel', 'acilTelefon'))}" placeholder="05xx xxx xx xx"></label>
            <label class="muf-alan"><span>🎂 Doğum tarihi ${yasYazi ? '<b class="muf-yas">' + miloEsc(yasYazi) + '</b>' : ''}</span><input data-muf id="muf-dogum" type="date" class="milo-input" max="${bugunISO()}" value="${miloEsc(dogum)}" onchange="mufFormCiz()"></label>
            <div class="muf-alan"><span>Cinsiyet</span><div class="muf-cipler"><button type="button" class="${_muf.cins === 'K' ? 'aktif k' : ''}" onclick="_muf.cins='K'; mufFormCiz()">👧 Kız</button><button type="button" class="${_muf.cins === 'E' ? 'aktif e' : ''}" onclick="_muf.cins='E'; mufFormCiz()">👦 Erkek</button></div></div>
            <div class="muf-alan muf-tam"><span>Grup *${oneri && oneri !== grup ? ` <button type="button" class="muf-oneri" onclick="mufGrupSec(this.dataset.g)" data-g="${miloEsc(oneri)}">✨ Yaşına göre: ${miloEsc(oneri)}</button>` : ''}</span>
                <div class="muf-cipler">${gruplar.slice(0, 14).map(g => `<button type="button" class="${g === grup ? 'aktif' : ''}" data-g="${miloEsc(g)}" onclick="mufGrupSec(this.dataset.g)">${miloEsc(g)}</button>`).join('')}</div>
                <input data-muf id="muf-grup" class="milo-input" list="muf-grup-list" value="${miloEsc(grup)}" placeholder="Grup seç ya da yeni grup adı yaz" oninput="_muf.grup=this.value">
                <datalist id="muf-grup-list">${gruplar.map(g => `<option value="${miloEsc(g)}">`).join('')}</datalist></div>
            ${alanHTML}
            ${u ? `<label class="muf-onay"><input type="checkbox" data-muf id="muf-pasif" ${(onceki['muf-pasif'] !== undefined ? onceki['muf-pasif'] : u.pasif) ? 'checked' : ''}> Dondurulmuş (pasif)</label><label class="muf-onay"><input type="checkbox" data-muf id="muf-muaf" ${(onceki['muf-muaf'] !== undefined ? onceki['muf-muaf'] : u.aidatMuaf) ? 'checked' : ''}> 🎗️ Aidattan muaf</label>` : ''}
        </div>
        ${u ? '<div class="muf-not">İsim ya da grup değişirse aidat, yoklama ve ders kayıtları da yeni isme taşınır.</div>' : ''}
        <div class="muf-btnler"><button class="milo-btn-full" onclick="mufKaydet(false)">✅ Kaydet</button>${u ? '' : '<button class="muf-ikincil" onclick="mufKaydet(true)">Kaydet ve yeni ekle</button>'}<button class="muf-ikincil" onclick="miloUyeFormKapat()">İptal</button></div>
    </div>`;
}
function mufGrupSec(g) { _muf.grup = g; let e = document.getElementById('muf-grup'); if (e) e.value = g; mufFormCiz(); }
async function mufKaydet(yeniden) {
    let u = _muf.u;
    let ad = mufDeger('muf-ad').replace(/\s+/g, ' ').trim().toLocaleUpperCase('tr-TR');
    let grup = mufDeger('muf-grup').replace(/\s+/g, ' ').trim();
    if (!ad) return showToast('Ad Soyad yaz.', 'error');
    if (!grup) return showToast('Grup seç ya da yaz.', 'error');
    let bos = v => { v = String(v == null ? '' : v).trim(); return v === '' ? null : v; };
    let has = id => !!document.getElementById(id);
    let f = { cinsiyet: _muf.cins, dogumTarihi: bos(mufDeger('muf-dogum')), acilKisi: bos(mufDeger('muf-veli')), acilTelefon: bos(mufDeger('muf-tel')) };
    if (has('muf-katilma')) f.katilmaTarihi = bos(mufDeger('muf-katilma'));
    if (has('muf-veli2')) { f.veli2Kisi = bos(mufDeger('muf-veli2')); f.veli2Telefon = bos(mufDeger('muf-veli2tel')); }
    if (has('muf-meslek')) f.aileMeslek = bos(mufDeger('muf-meslek'));
    if (has('muf-boy')) { f.boy = parseInt(mufDeger('muf-boy')) || null; f.kilo = parseFloat(mufDeger('muf-kilo')) || null; }
    if (has('muf-antrenman')) f.antrenmanNotu = bos(mufDeger('muf-antrenman'));
    if (has('muf-saglik')) f.saglikNotu = bos(mufDeger('muf-saglik'));
    if (has('muf-genel')) f.genelNot = bos(mufDeger('muf-genel'));
    try {
        if (u) {
            if (has('muf-pasif')) f.pasif = document.getElementById('muf-pasif').checked ? 1 : 0;
            if (has('muf-muaf')) f.aidatMuaf = document.getElementById('muf-muaf').checked ? 1 : 0;
            if (grup !== u.grup || ad !== u.ad) {
                if (miloUyeler.some(x => x.grup === grup && x.ad === ad)) return showToast(ad + ' zaten ' + grup + ' grubunda kayıtlı — Çift Kayıt\'tan birleştir.', 'warning');
                let r = await fetch('/api/milo/members/' + encodeURIComponent(u.grup) + '/' + encodeURIComponent(u.ad) + '/rename', { method: 'POST', headers: { 'content-type': 'application/json', 'X-Dagsk-Oturum': miloOturumToken || '' }, body: JSON.stringify({ yeniAd: ad, yeniGrup: grup }) });
                if (!r.ok) { let t = ''; try { t = (await r.json()).error || ''; } catch (e) {} return showToast('Kaydedilemedi: ' + (t === 'target-exists' ? 'bu isim o grupta zaten var' : t || ('HTTP ' + r.status)) + ' — hiçbir şey değişmedi.', 'error'); }
                try { if (typeof maTurTasi === 'function') maTurTasi(u.grup, u.ad, grup, ad); } catch (e) {}
            }
            await miloApi('/members/' + encodeURIComponent(grup) + '/' + encodeURIComponent(ad), { method: 'PATCH', body: JSON.stringify(f) });
        } else {
            if (miloUyeler.some(x => x.grup === grup && x.ad === ad)) return showToast(ad + ' zaten ' + grup + ' grubunda kayıtlı.', 'warning');
            let { veli2Kisi, veli2Telefon, ...post } = f;
            if (!('katilmaTarihi' in post)) post.katilmaTarihi = bugunISO();
            await miloApi('/members', { method: 'POST', body: JSON.stringify(Object.assign({ grup, ad }, post)) });
            if (veli2Kisi || veli2Telefon) await miloApi('/members/' + encodeURIComponent(grup) + '/' + encodeURIComponent(ad), { method: 'PATCH', body: JSON.stringify({ veli2Kisi: veli2Kisi || null, veli2Telefon: veli2Telefon || null }) });
        }
    } catch (e) { return showToast('Kaydedilemedi — bağlantını kontrol et.', 'error'); }
    showToast('✅ ' + ad + (u ? ' kaydedildi' : ' eklendi'), 'success');
    miloUyeler = (await miloApi('/members')).members;
    if (yeniden) { let g = grup; miloUyelerCiz(); miloUyeFormAc(); _muf.grup = g; mufFormCiz(); return; }
    miloUyeFormKapat(); miloUyelerCiz();
}
// eski kaydet (başka yerden çağrılırsa) yeni forma yönlensin
miloUyeKaydet = function () { return mufKaydet(false); };

(function () {
    let st = document.createElement('style'); st.id = 'muf-css';
    st.textContent = `
.muf{display:flex;flex-direction:column;gap:12px;border:1.5px solid var(--milo-teal)}
.muf-ust{display:flex;justify-content:space-between;align-items:center;gap:8px}.muf-baslik{font-weight:900;font-size:16px;color:var(--milo-ink)}
.muf-link{background:none;border:0;color:var(--milo-teal);font:inherit;font-size:12px;font-weight:800;cursor:pointer;padding:6px}
.muf-ozel{border:1px dashed var(--milo-line);border-radius:12px;padding:10px 12px}.muf-ozel-bas{font-size:12px;font-weight:800;color:var(--milo-ink);margin-bottom:6px}.muf-ozel-bas small{color:var(--milo-ink-dim);font-weight:600}
.muf-ozel-l{display:flex;flex-wrap:wrap;gap:6px 14px}.muf-ozel-l label{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--milo-ink)}
.muf-ozel input[type=checkbox],.muf-onay input{-webkit-appearance:checkbox!important;appearance:auto!important;width:16px;height:16px;accent-color:var(--milo-teal)}
.muf-izgara{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px}@media (max-width:560px){.muf-izgara{grid-template-columns:minmax(0,1fr)}}
.muf-alan{display:flex;flex-direction:column;gap:4px;min-width:0}.muf-alan>span{font-size:11px;font-weight:800;color:var(--milo-ink-dim);display:flex;align-items:center;gap:6px;flex-wrap:wrap}.muf-alan>span small{font-weight:600}
.muf-alan .milo-input{margin-bottom:0}.muf-tam{grid-column:1/-1}.muf-buyuk{font-size:16px;font-weight:800}
.muf-yas{font-size:11px;color:var(--milo-teal);background:color-mix(in srgb,var(--milo-teal) 14%,transparent);padding:2px 8px;border-radius:999px}
.muf-cipler{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}.muf-cipler button{min-height:36px;padding:0 13px;border-radius:999px;border:1.3px solid var(--milo-line);background:var(--milo-card-raised);color:var(--milo-ink);font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
.muf-cipler button.aktif{border-color:var(--milo-teal);background:color-mix(in srgb,var(--milo-teal) 16%,transparent);color:var(--milo-teal)}
.muf-cipler button.aktif.k{border-color:var(--milo-coral);color:var(--milo-coral);background:color-mix(in srgb,var(--milo-coral) 14%,transparent)}.muf-cipler button.aktif.e{border-color:var(--milo-grape);color:var(--milo-grape);background:color-mix(in srgb,var(--milo-grape) 14%,transparent)}
.muf-oneri{border:1px solid var(--milo-sun);background:color-mix(in srgb,var(--milo-sun) 14%,transparent);color:var(--milo-sun);border-radius:999px;padding:3px 10px;font:inherit;font-size:11px;font-weight:800;cursor:pointer}
.muf-onay{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--milo-ink)}
.muf-not{font-size:11.5px;color:var(--milo-ink-dim)}
.muf-btnler{display:flex;gap:8px;flex-wrap:wrap}.muf-btnler .milo-btn-full{flex:2;margin-bottom:0;min-width:160px}
.muf-ikincil{flex:1;min-width:120px;min-height:44px;border-radius:12px;border:1px solid var(--milo-line);background:var(--milo-card-raised);color:var(--milo-ink);font:inherit;font-weight:800;cursor:pointer}
.muf-veli{font-weight:600;color:var(--milo-ink-dim);font-size:.88em}`;
    document.head.appendChild(st);
})();
// Üye listesi aramada her harfte baştan çiziliyordu: açık form siliniyor, arama kutusu odağı kaybediyordu.
(function () {
    if (typeof miloUyelerCiz !== 'function') return;
    let eski = miloUyelerCiz;
    miloUyelerCiz = function () {
        let a = document.activeElement, ara = a && a.tagName === 'INPUT' && a.closest('#milo-icerik') && !a.closest('#milo-uye-form-alani') ? a.selectionStart : null;
        let formAlan = document.getElementById('milo-uye-form-alani'), form = miloUyeFormAcikMi && formAlan && formAlan.firstElementChild;
        if (form) form.remove();
        eski.apply(this, arguments);
        if (form) { let y = document.getElementById('milo-uye-form-alani'); if (y) y.appendChild(form); }
        if (ara !== null) { let e = document.querySelector('#milo-icerik > input.milo-input'); if (e) { e.focus(); try { e.setSelectionRange(ara, ara); } catch (x) {} } }
    };
})();
