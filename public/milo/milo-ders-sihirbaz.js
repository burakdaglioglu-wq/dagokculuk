/* Milo · Yaşa göre ders oluşturma (2026-10-07, kullanıcı: "ders programı oluştururken problem yaşıyoruz, küçük çocuklar
   geliyor, belki 12 aylık; sorunu bul çöz, kolay ama görsel güzel bir yapı kur").
   SORUN: yaş yalnız tam yıl hesaplanıyordu (12 aylık = "0/1 yaş"), ders oluştururken yaş aralığı yoktu (serbest grup adı)
   ve uygun çocukları tek tek isimle arayıp eklemek gerekiyordu.
   ÇÖZÜM: 1) "Kimin için?" yaş kutuları (12–24 ay, 2–3 yaş …, özel aralık ay/yaş) — süre ve kapasite yaşa göre önerilir;
   2) gün + başlangıç saati + süre çipleri; 3) yaşı uyan üyeler hazır işaretli gelir (çakışan dersi olan uyarılır);
   4) canlı önizleme. Yaş aralığı DB'ye değil Milo meta 'ders_yas' {slotId: {minAy, maxAy, t}} kaydına yazılır.
   Izgara kartlarında yaş rozeti, ders penceresinde "Yaşı uyanlar" önerisi. mds* önekli. */
const MDS_PRESET = [
    { id: 'bebek', ikon: '👶', ad: 'Bebek', min: 12, max: 24, sure: 30, kap: 6, not: 'Veliyle birlikte' },
    { id: 'minik', ikon: '🧸', ad: 'Minik', min: 24, max: 36, sure: 40, kap: 8, not: 'Oyunla hareket' },
    { id: 'y34', ikon: '🎈', ad: 'Küçük', min: 36, max: 48, sure: 45, kap: 10, not: 'Temel beceriler' },
    { id: 'y46', ikon: '🤸', ad: 'Okul öncesi', min: 48, max: 72, sure: 50, kap: 12, not: 'Denge, koordinasyon' },
    { id: 'y69', ikon: '⭐', ad: 'İlkokul', min: 72, max: 108, sure: 60, kap: 12, not: 'Cimnastik temeli' },
    { id: 'y9', ikon: '🏅', ad: 'Büyük', min: 108, max: 216, sure: 60, kap: 14, not: 'İleri beceriler' }
];
const MDS_SURELER = [30, 40, 45, 50, 60, 90], MDS_KAPASITE = [4, 6, 8, 10, 12, 15, 0];
let _mds = { preset: null, min: null, max: null, ad: '', adElle: false, bas: '10:00', sure: 45, kap: 10, secili: {}, ozelBirim: 'ay', yasMeta: null };

// ---- yaş (ay) yardımcıları
function mdsAy(dogum) {
    if (!dogum) return null; let d = new Date(dogum + 'T00:00:00'); if (isNaN(d.getTime())) return null;
    let s = new Date(), ay = (s.getFullYear() - d.getFullYear()) * 12 + (s.getMonth() - d.getMonth()); if (s.getDate() < d.getDate()) ay--;
    return Math.max(0, ay);
}
function mdsAralikEtiket(min, max) {
    if (min == null || max == null) return '';
    if (max <= 24) return min + '–' + max + ' ay';
    if (max >= 216) return (min < 24 ? min + ' ay' : Math.floor(min / 12)) + '+ yaş';
    if (min < 24) return min + ' ay – ' + (max % 12 ? Math.floor(max / 12) + ',5' : max / 12) + ' yaş';
    let y = v => (v % 12 === 0 ? String(v / 12) : (v / 12).toFixed(1).replace('.', ','));
    return y(min) + '–' + y(max) + ' yaş';
}
function mdsUygunMu(u, min, max) { let a = mdsAy(u.dogumTarihi); return a != null && a >= min && a < max; }
function mdsAktifUyeler() { return (typeof miloUyeler !== 'undefined' ? miloUyeler : []).filter(u => !u.pasif); }

// ---- meta: ders_yas
async function mdsYasMetaYukle(zorla) {
    if (_mds.yasMeta && !zorla) return _mds.yasMeta;
    try { let r = await miloApi('/meta/ders_yas'); _mds.yasMeta = r && r.value ? JSON.parse(r.value) : {}; } catch (e) { _mds.yasMeta = _mds.yasMeta || {}; }
    return _mds.yasMeta;
}
async function mdsYasMetaYaz(slotId, min, max) {
    let uzak = await mdsYasMetaYukle(true), m = Object.assign({}, uzak);
    m[slotId] = min == null ? { sil: true, t: Date.now() } : { minAy: min, maxAy: max, t: Date.now() };
    await miloApi('/meta/ders_yas', { method: 'PUT', body: JSON.stringify({ value: JSON.stringify(m) }) });
    _mds.yasMeta = m;
}
function mdsSlotYas(id) { let m = _mds.yasMeta || {}, x = m[id]; return x && !x.sil && x.minAy != null ? x : null; }

// 15 sn'lik otomatik yenileme (app.js) ders sekmesini baştan çiziyordu: eski formda yazılan grup/saat/kapasite yazarken
// SİLİNİYORDU. Ders oluşturulurken, bir alana yazılırken ya da ders penceresi açıkken yenileme atlanır.
function mdsDuzenleniyor() {
    let ic = document.getElementById('milo-icerik'), a = document.activeElement, m = document.getElementById('milo-ders-roster-modal');
    if (_mds.min != null) return true;
    if (m && m.style.display === 'flex') return true;
    if (ic && a && ic.contains(a) && /INPUT|SELECT|TEXTAREA/.test(a.tagName)) return true;
    let eski = document.getElementById('milo-prf-grup'); return !!(eski && (eski.value || (document.getElementById('milo-prf-bas') || {}).value));
}
// ---- form
function mdsPresetSec(id) {
    let p = MDS_PRESET.find(x => x.id === id);
    _mds.preset = id;
    if (p) { _mds.min = p.min; _mds.max = p.max; _mds.sure = p.sure; _mds.kap = p.kap; }
    else if (_mds.min == null) { _mds.min = 12; _mds.max = 36; }
    if (!_mds.adElle) _mds.ad = p ? p.ad + ' (' + mdsAralikEtiket(p.min, p.max) + ')' : 'Özel grup (' + mdsAralikEtiket(_mds.min, _mds.max) + ')';
    mdsSeciliHazirla(); mdsCiz();
}
function mdsOzelAyarla() {
    let b = _mds.ozelBirim === 'yas' ? 12 : 1;
    let mn = parseFloat((document.getElementById('mds-ozel-min') || {}).value), mx = parseFloat((document.getElementById('mds-ozel-max') || {}).value);
    if (!(mn >= 0) || !(mx > mn)) return;
    _mds.min = Math.round(mn * b); _mds.max = Math.round(mx * b);
    if (!_mds.adElle) _mds.ad = 'Özel grup (' + mdsAralikEtiket(_mds.min, _mds.max) + ')';
    mdsSeciliHazirla(); mdsCiz(true);
}
function mdsBitis() { let [h, m] = (_mds.bas || '10:00').split(':').map(Number), t = h * 60 + m + _mds.sure; return String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }
function mdsTaslakSlot() { return { id: -1, gunler: _miloGunSeciciOku('mds-gun'), baslangicSaat: _mds.bas, bitisSaat: mdsBitis() }; }
function mdsCakisma(u) { try { return _miloDersCakismaBul(u.grup, u.ad, mdsTaslakSlot()); } catch (e) { return []; } }
function mdsSeciliHazirla() {
    _mds.secili = {};
    if (_mds.min == null) return;
    mdsAktifUyeler().filter(u => mdsUygunMu(u, _mds.min, _mds.max)).forEach(u => { if (!mdsCakisma(u).length) _mds.secili[u.grup + '|' + u.ad] = true; });
}
function mdsUyeSec(k) { if (_mds.secili[k]) delete _mds.secili[k]; else _mds.secili[k] = true; mdsCiz(); }
function mdsHepsi(sec) { if (sec) mdsAktifUyeler().filter(u => mdsUygunMu(u, _mds.min, _mds.max)).forEach(u => { _mds.secili[u.grup + '|' + u.ad] = true; }); else _mds.secili = {}; mdsCiz(); }
function mdsYasYazi(u) { let a = mdsAy(u.dogumTarihi); return a == null ? '' : a < 24 ? a + ' ay' : Math.floor(a / 12) + ' yaş' + (a < 72 && a % 12 ? ' ' + (a % 12) + ' ay' : ''); }

function mdsHTML() {
    let uyeler = mdsAktifUyeler(), say = p => uyeler.filter(u => mdsUygunMu(u, p.min, p.max)).length;
    let kutular = MDS_PRESET.map(p => `<button type="button" class="mds-yas${_mds.preset === p.id ? ' aktif' : ''}" onclick="mdsPresetSec('${p.id}')">
        <span class="mds-yas-ikon">${p.ikon}</span><b>${miloEsc(mdsAralikEtiket(p.min, p.max))}</b><small>${miloEsc(p.ad)} · ${miloEsc(p.not)}</small><i>${say(p)} çocuk</i></button>`).join('')
        + `<button type="button" class="mds-yas${_mds.preset === 'ozel' ? ' aktif' : ''}" onclick="mdsPresetSec('ozel')"><span class="mds-yas-ikon">✏️</span><b>Özel aralık</b><small>Ay ya da yaş olarak</small><i>kendin belirle</i></button>`;
    let secildi = _mds.min != null;
    let ozel = _mds.preset === 'ozel' ? `<div class="mds-ozel"><input id="mds-ozel-min" type="number" min="0" step="1" value="${_mds.ozelBirim === 'yas' ? +(_mds.min / 12).toFixed(1) : _mds.min}" oninput="mdsOzelAyarla()"><span>–</span><input id="mds-ozel-max" type="number" min="1" step="1" value="${_mds.ozelBirim === 'yas' ? +(_mds.max / 12).toFixed(1) : _mds.max}" oninput="mdsOzelAyarla()">
        <select onchange="_mds.ozelBirim=this.value; mdsCiz()"><option value="ay"${_mds.ozelBirim === 'ay' ? ' selected' : ''}>ay</option><option value="yas"${_mds.ozelBirim === 'yas' ? ' selected' : ''}>yaş</option></select></div>` : '';
    let adim = (n, baslik, ic, kapali) => `<div class="mds-adim${kapali ? ' kapali' : ''}"><div class="mds-adim-bas"><span class="mds-no">${n}</span><b>${baslik}</b></div>${kapali ? '' : ic}</div>`;
    let uygun = secildi ? uyeler.filter(u => mdsUygunMu(u, _mds.min, _mds.max)).sort((a, b) => (mdsAy(a.dogumTarihi) || 0) - (mdsAy(b.dogumTarihi) || 0)) : [];
    let dogumsuz = uyeler.filter(u => mdsAy(u.dogumTarihi) == null);
    let seciliSay = Object.keys(_mds.secili).length;
    let liste = uygun.map(u => {
        let k = u.grup + '|' + u.ad, c = mdsCakisma(u), sec = !!_mds.secili[k];
        return `<button type="button" class="mds-uye${sec ? ' sec' : ''}" onclick="mdsUyeSec('${miloJsEsc(k)}')" aria-pressed="${sec}"><span class="mds-tik">${sec ? '✓' : ''}</span><span class="mds-uye-ad"><b>${miloEsc(u.ad)}</b><small>${miloEsc(mdsYasYazi(u))} · ${miloEsc(u.grup)}${c.length ? ' · ⚠️ aynı saatte ' + miloEsc(c.map(x => x.grup).join(', ')) : ''}</small></span></button>`;
    }).join('');
    let gunler = _miloGunSeciciOku('mds-gun'), gunYazi = gunler.length ? _miloGunlerEtiketUzun(gunler) : '—';
    return `<div class="milo-card mds">
        <div class="mds-ust"><div><div class="mds-baslik">✨ Yeni ders oluştur</div><div class="mds-alt">Önce kimin için olduğunu seç; süre, kapasite ve uygun çocuklar kendiliğinden gelir.</div></div></div>
        ${adim(1, 'Kimin için?', `<div class="mds-yaslar">${kutular}</div>${ozel}`)}
        ${adim(2, 'Ne zaman?', `<div class="mds-etiket">Gün(ler)</div><div id="mds-gun-kap">${_miloGunSeciciHTML('mds-gun', _miloGunSeciciOku('mds-gun').length ? _miloGunSeciciOku('mds-gun') : [new Date().getDay()])}</div>
            <div class="mds-zaman"><label><span class="mds-etiket">Başlangıç</span><input type="time" class="milo-input" value="${_mds.bas}" onchange="_mds.bas=this.value||'10:00'; mdsSeciliHazirla(); mdsCiz()"></label>
            <div><span class="mds-etiket">Süre</span><div class="mds-cipler">${MDS_SURELER.map(d => `<button type="button" class="${_mds.sure === d ? 'aktif' : ''}" onclick="_mds.sure=${d}; mdsSeciliHazirla(); mdsCiz()">${d} dk</button>`).join('')}</div></div></div>`, !secildi)}
        ${adim(3, 'Ders adı ve kapasite', `<input class="milo-input" list="mds-grup-list" value="${miloEsc(_mds.ad)}" oninput="_mds.ad=this.value; _mds.adElle=true; mdsOnizlemeGuncelle()" placeholder="Ders / grup adı">
            <datalist id="mds-grup-list">${[...new Set((miloProgram || []).map(s => s.grup).concat(mdsAktifUyeler().map(u => u.grup)))].map(g => `<option value="${miloEsc(g)}">`).join('')}</datalist>
            <div class="mds-etiket">Kapasite</div><div class="mds-cipler">${MDS_KAPASITE.map(k => `<button type="button" class="${_mds.kap === k ? 'aktif' : ''}" onclick="_mds.kap=${k}; mdsCiz()">${k || 'Sınırsız'}</button>`).join('')}</div>`, !secildi)}
        ${adim(4, 'Kimler katılacak? <small>' + seciliSay + ' seçili' + (uygun.length ? ' / ' + uygun.length + ' uygun' : '') + '</small>', uygun.length
            ? `<div class="mds-hepsi"><button type="button" onclick="mdsHepsi(true)">Hepsini seç</button><button type="button" onclick="mdsHepsi(false)">Hiçbiri</button></div><div class="mds-uyeler">${liste}</div>`
            : `<div class="mds-bos">Bu yaş aralığında doğum tarihi girilmiş üye yok. Dersi yine oluşturabilir, çocukları sonra ekleyebilirsin.</div>`, !secildi)}
        ${secildi && dogumsuz.length ? `<div class="mds-uyari">ℹ️ ${dogumsuz.length} üyenin doğum tarihi girilmemiş, bu yüzden önerilere girmiyor: ${dogumsuz.slice(0, 5).map(u => miloEsc(u.ad)).join(', ')}${dogumsuz.length > 5 ? '…' : ''}</div>` : ''}
        ${secildi ? `<div class="mds-onizleme" id="mds-onizleme">${mdsOnizlemeHTML(gunYazi, seciliSay)}</div>
        <button class="milo-btn-full mds-olustur" onclick="mdsOlustur()">✅ Dersi oluştur${seciliSay ? ' · ' + seciliSay + ' çocuk' : ''}</button>` : ''}
    </div>`;
}
function mdsOnizlemeHTML(gunYazi, seciliSay) {
    let dolu = _mds.kap && seciliSay > _mds.kap;
    return `<div class="mds-kart-on"><div class="mds-kart-saat">${_mds.bas}–${mdsBitis()}</div><div class="mds-kart-ad">${miloEsc(_mds.ad || 'Ders')}</div><div class="mds-kart-rozet">${miloEsc(mdsAralikEtiket(_mds.min, _mds.max))}</div><div class="mds-kart-kisi${dolu ? ' dolu' : ''}">👥 ${seciliSay}${_mds.kap ? '/' + _mds.kap : ''}</div></div>
        <div class="mds-ozet"><b>${miloEsc(gunYazi)}</b> · ${_mds.bas}–${mdsBitis()} (${_mds.sure} dk)<br>${miloEsc(_mds.ad || '')} · ${miloEsc(mdsAralikEtiket(_mds.min, _mds.max))}${dolu ? '<br><span class="mds-kirmizi">Seçilen çocuk sayısı kapasiteyi aşıyor.</span>' : ''}</div>`;
}
function mdsOnizlemeGuncelle() { let e = document.getElementById('mds-onizleme'); if (e) e.innerHTML = mdsOnizlemeHTML(_miloGunlerEtiketUzun(_miloGunSeciciOku('mds-gun')) || '—', Object.keys(_mds.secili).length); }
function mdsCiz(odakOzel) {
    let kap = document.getElementById('mds-kap'); if (!kap) return;
    let odak = document.activeElement && document.activeElement.id;
    kap.innerHTML = mdsHTML();
    if (odakOzel && odak) { let e = document.getElementById(odak); if (e) { e.focus(); try { e.setSelectionRange(e.value.length, e.value.length); } catch (x) {} } }
}
async function mdsOlustur() {
    let gunler = _miloGunSeciciOku('mds-gun'), ad = (_mds.ad || '').trim();
    if (!gunler.length) return showToast('En az bir gün seç.', 'error');
    if (!ad) return showToast('Ders adını yaz.', 'error');
    let btn = document.querySelector('.mds-olustur'); if (btn) { btn.disabled = true; btn.textContent = 'Oluşturuluyor…'; }
    try {
        let r = await miloApi('/antrenman-programi', { method: 'POST', body: JSON.stringify({ grup: ad, gunler, baslangicSaat: _mds.bas, bitisSaat: mdsBitis(), kapasite: _mds.kap || null }) });
        let id = r && r.id;
        if (id) {
            await mdsYasMetaYaz(id, _mds.min, _mds.max);
            for (let k of Object.keys(_mds.secili)) { let i = k.indexOf('|'); await miloApi('/antrenman-programi/' + id + '/katilimci', { method: 'POST', body: JSON.stringify({ grup: k.slice(0, i), ad: k.slice(i + 1) }) }); }
        }
        miloProgram = (await miloApi('/antrenman-programi')).slots;
        let say = Object.keys(_mds.secili).length;
        _mds = Object.assign(_mds, { preset: null, min: null, max: null, ad: '', adElle: false, secili: {} });
        miloProgramCiz();
        showToast('✅ Ders oluşturuldu' + (say ? ' · ' + say + ' çocuk eklendi' : ''), 'success');
    } catch (e) { showToast('Ders oluşturulamadı — bağlantını kontrol et.', 'error'); if (btn) { btn.disabled = false; btn.textContent = '✅ Dersi oluştur'; } }
}

// ---- mevcut ekranlara bağlanma
(function () {
    if (typeof miloProgramCiz !== 'function') return;
    let eskiProgram = miloProgramCiz;
    miloProgramCiz = function () {
        eskiProgram.apply(this, arguments);
        let kartlar = document.querySelectorAll('#milo-icerik > .milo-card');
        let form = kartlar[1]; if (form && form.querySelector('#milo-prf-grup')) {
            let kap = document.createElement('div'); kap.id = 'mds-kap'; form.replaceWith(kap);
            mdsCiz();
            // eski tek satırlık form, hızlı ekleme isteyenler için katlanmış
            let det = document.createElement('details'); det.className = 'milo-card mds-eski'; det.innerHTML = '<summary>Hızlı ekle (eski form)</summary>'; det.appendChild(form); kap.after(det);
        }
        mdsYasMetaYukle().then(() => { try { miloProgramIzgaraCiz(); } catch (e) {} if (document.getElementById('mds-kap') && !_mds.min) mdsCiz(); });
    };
    let eskiIzgara = miloProgramIzgaraCiz;
    miloProgramIzgaraCiz = function () {
        eskiIzgara.apply(this, arguments);
        document.querySelectorAll('#milo-program-izgara button[onclick^="miloDersRosterAc("]').forEach(b => {
            let id = +(b.getAttribute('onclick').match(/\d+/) || [0])[0], y = mdsSlotYas(id);
            if (y && !b.querySelector('.mds-rozet')) { let r = document.createElement('div'); r.className = 'mds-rozet'; r.textContent = mdsAralikEtiket(y.minAy, y.maxAy); b.appendChild(r); }
        });
    };
    if (typeof miloDersRosterCiz === 'function') {
        let eskiRoster = miloDersRosterCiz;
        miloDersRosterCiz = function () {
            eskiRoster.apply(this, arguments);
            let s = _miloDrmSlot(); if (!s) return;
            let y = mdsSlotYas(s.id), alan = document.getElementById('milo-drm-plan-alani');
            if (alan) {
                let eski = document.getElementById('mds-drm-yas'); if (eski) eski.remove();
                let d = document.createElement('div'); d.id = 'mds-drm-yas'; d.className = 'mds-drm-yas';
                d.innerHTML = '<span>🎂 Yaş aralığı:</span>' + MDS_PRESET.map(p => `<button type="button" class="${y && y.minAy === p.min && y.maxAy === p.max ? 'aktif' : ''}" onclick="mdsSlotYasAyarla(${s.id}, ${p.min}, ${p.max})">${miloEsc(mdsAralikEtiket(p.min, p.max))}</button>`).join('')
                    + (y && !MDS_PRESET.some(p => p.min === y.minAy && p.max === y.maxAy) ? `<button type="button" class="aktif">${miloEsc(mdsAralikEtiket(y.minAy, y.maxAy))}</button>` : '')
                    + (y ? `<button type="button" onclick="mdsSlotYasAyarla(${s.id}, null, null)">Kaldır</button>` : '');
                alan.after(d);
            }
            // isim yazılmadıysa: yaşı uyan ve bu derste olmayanlar
            let liste = document.getElementById('milo-drm-aday-liste'), q = ((document.getElementById('milo-drm-ara') || {}).value || '').trim();
            if (liste && y && !q) {
                let mevcut = {}; (s.katilimcilar || []).forEach(k => { mevcut[k.grup + '|' + k.ad] = 1; });
                let ad = mdsAktifUyeler().filter(u => !mevcut[u.grup + '|' + u.ad] && mdsUygunMu(u, y.minAy, y.maxAy));
                if (ad.length) liste.innerHTML = '<div class="mds-oneri-bas">🎂 Yaşı uyanlar (' + ad.length + ')</div>' + ad.slice(0, 20).map(a => `<div class="mds-oneri"><span><b>${miloEsc(a.ad)}</b><small>${miloEsc(mdsYasYazi(a))} · ${miloEsc(a.grup)}</small></span><button onclick="miloDersRosterKatilimciEkle('${miloJsEsc(a.grup)}','${miloJsEsc(a.ad)}')">+ Ekle</button></div>`).join('');
            }
        };
    }
})();
// gün değişince önizleme/çakışma güncellensin; gün seçici başlangıçta bugün
if (typeof _miloGunSeciciState !== 'undefined' && !_miloGunSeciciState['mds-gun']) _miloGunSeciciState['mds-gun'] = new Set([new Date().getDay()]);
if (typeof _miloGunSeciciToggle === 'function') {
    let eskiToggle = _miloGunSeciciToggle;
    _miloGunSeciciToggle = function (idOnEki) { eskiToggle.apply(this, arguments); if (idOnEki === 'mds-gun') mdsOnizlemeGuncelle(); };
}
async function mdsSlotYasAyarla(id, min, max) {
    try { await mdsYasMetaYaz(id, min, max); } catch (e) { return showToast('Kaydedilemedi.', 'error'); }
    try { miloDersRosterCiz(); miloProgramIzgaraCiz(); } catch (e) {}
    showToast(min == null ? 'Yaş aralığı kaldırıldı' : '🎂 Yaş aralığı: ' + mdsAralikEtiket(min, max), 'success');
}

(function () {
    let st = document.createElement('style'); st.id = 'mds-css';
    st.textContent = `
.mds{display:flex;flex-direction:column;gap:14px}
.mds-baslik{font-weight:900;font-size:17px;color:var(--milo-ink)}.mds-alt{font-size:12px;color:var(--milo-ink-dim);margin-top:2px}
.mds-adim{display:flex;flex-direction:column;gap:8px}.mds-adim.kapali{opacity:.45}
.mds-adim-bas{display:flex;align-items:center;gap:8px}.mds-adim-bas b{font-size:13.5px;color:var(--milo-ink)}.mds-adim-bas small{font-weight:600;color:var(--milo-ink-dim);font-size:11.5px}
.mds-no{width:24px;height:24px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;background:var(--milo-teal);color:var(--milo-bg)}
.mds-yaslar{display:grid;grid-template-columns:repeat(auto-fill,minmax(132px,1fr));gap:8px}
.mds-yas{display:flex;flex-direction:column;align-items:flex-start;gap:2px;text-align:left;padding:10px 11px;border-radius:14px;border:1.5px solid var(--milo-line);background:var(--milo-card-raised);color:var(--milo-ink);font:inherit;cursor:pointer;min-height:96px;transition:border-color .15s,transform .15s}
.mds-yas:hover{border-color:var(--milo-teal)}.mds-yas.aktif{border-color:var(--milo-teal);background:color-mix(in srgb,var(--milo-teal) 14%,var(--milo-card-raised));transform:translateY(-1px)}
.mds-yas-ikon{font-size:24px;line-height:1}.mds-yas b{font-size:14px;font-weight:900}.mds-yas small{font-size:10.5px;color:var(--milo-ink-dim);line-height:1.3}.mds-yas i{font-style:normal;font-size:10.5px;font-weight:800;color:var(--milo-teal);margin-top:auto}
.mds-ozel{display:flex;align-items:center;gap:6px}.mds-ozel input,.mds-ozel select{width:80px;min-height:38px;border-radius:10px;border:1px solid var(--milo-line);background:var(--milo-card-raised);color:var(--milo-ink);padding:0 8px;font:inherit}
.mds-etiket{display:block;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--milo-ink-dim);margin:2px 0 4px}
.mds-zaman{display:grid;grid-template-columns:140px 1fr;gap:10px;align-items:end}.mds-zaman .milo-input{margin-bottom:0}
@media (max-width:560px){.mds-zaman{grid-template-columns:1fr}}
.mds-cipler{display:flex;flex-wrap:wrap;gap:6px}.mds-cipler button,.mds-hepsi button,.mds-drm-yas button{min-height:36px;padding:0 12px;border-radius:999px;border:1.3px solid var(--milo-line);background:var(--milo-card-raised);color:var(--milo-ink);font:inherit;font-size:12px;font-weight:800;cursor:pointer}
.mds-cipler button.aktif,.mds-drm-yas button.aktif{border-color:var(--milo-teal);background:color-mix(in srgb,var(--milo-teal) 16%,transparent);color:var(--milo-teal)}
.mds-hepsi{display:flex;gap:6px}
.mds-uyeler{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px;max-height:320px;overflow:auto}
.mds-uye{display:flex;align-items:center;gap:8px;text-align:left;padding:8px 10px;border-radius:12px;border:1.3px solid var(--milo-line);background:var(--milo-card-raised);color:var(--milo-ink);font:inherit;cursor:pointer}
.mds-uye.sec{border-color:var(--milo-teal);background:color-mix(in srgb,var(--milo-teal) 10%,var(--milo-card-raised))}
.mds-tik{flex:0 0 22px;height:22px;border-radius:7px;border:1.5px solid var(--milo-line);display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:var(--milo-bg)}.mds-uye.sec .mds-tik{background:var(--milo-teal);border-color:var(--milo-teal)}
.mds-uye-ad{display:flex;flex-direction:column;min-width:0}.mds-uye-ad b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mds-uye-ad small{font-size:10.5px;color:var(--milo-ink-dim)}
.mds-bos,.mds-uyari{font-size:12px;color:var(--milo-ink-dim);padding:10px 12px;border-radius:12px;border:1px dashed var(--milo-line)}
.mds-onizleme{display:flex;align-items:center;gap:14px;padding:12px;border-radius:16px;background:color-mix(in srgb,var(--milo-grape) 10%,var(--milo-card-raised))}
.mds-kart-on{flex:0 0 120px;border-radius:12px;border:1.5px solid var(--milo-teal);padding:8px 9px;background:var(--milo-card)}
.mds-kart-saat{font-size:11.5px;font-weight:900;color:var(--milo-ink)}.mds-kart-ad{font-size:10px;font-weight:800;color:var(--milo-teal);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mds-kart-rozet,.mds-rozet{display:inline-block;margin-top:3px;font-size:9px;font-weight:900;padding:2px 6px;border-radius:999px;background:color-mix(in srgb,var(--milo-sun) 22%,transparent);color:var(--milo-sun)}
.mds-kart-kisi{font-size:9.5px;color:var(--milo-ink-dim);margin-top:3px}.mds-kart-kisi.dolu,.mds-kirmizi{color:var(--milo-coral);font-weight:800}
.mds-ozet{font-size:12.5px;color:var(--milo-ink);line-height:1.5}
.mds-olustur{font-size:15px;padding:13px}
.mds-eski summary{cursor:pointer;font-size:12px;font-weight:800;color:var(--milo-ink-dim)}.mds-eski .milo-card{box-shadow:none;padding:10px 0 0;margin:0;background:transparent}
.mds-drm-yas{display:flex;flex-wrap:wrap;gap:5px;align-items:center;margin:8px 0;font-size:11.5px;font-weight:800;color:var(--milo-ink-dim)}.mds-drm-yas button{min-height:30px;font-size:11px;padding:0 9px}
.mds-oneri-bas{font-size:11px;font-weight:900;color:var(--milo-teal);margin:2px 0 6px}
.mds-oneri{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:10px;background:var(--milo-card-raised);border:1px solid var(--milo-line);margin-bottom:5px}.mds-oneri span{flex:1;min-width:0;display:flex;flex-direction:column}.mds-oneri b{font-size:12px}.mds-oneri small{font-size:10px;color:var(--milo-ink-dim)}
.mds-oneri button{background:color-mix(in srgb,var(--milo-teal) 12%,transparent);color:var(--milo-teal);border:1px solid var(--milo-teal);padding:5px 11px;border-radius:8px;cursor:pointer;font:inherit;font-size:11.5px;font-weight:800}
@media (prefers-reduced-motion:reduce){.mds-yas{transition:none}}`;
    document.head.appendChild(st);
})();
