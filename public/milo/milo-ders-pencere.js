/* Milo · Ders penceresi — "Liste" tasarımı (2026-10-08, kullanıcı: "ders programı düzelt kısmı çok eski kafa, düzenleyesi
   gelmiyor; modern, basit, güzel olsun" → 3 öneriden "1 · Liste" seçildi).
   Takvimde derse dokununca alttan açılan sade pencere: üstte yaş rozeti + ders adı (dokun → değiştir), altında iPhone
   Ayarlar gibi satırlar (Günler · Saat · Kapasite · Yaş aralığı · Plan · İptaller) — satıra dokununca altında açılır,
   her değişiklik anında kaydolur. Sonra öğrenci listesi (veli adı, devam noktası, ✕) ve "+ Öğrenci ekle" (ortak seçici).
   Eski pencerenin işlevleri (iptal, plan, PDF, sil, çoklu ekleme, yaş aralığı) korunur. mdp* önekli.
   Not: miloDersRosterCiz burada TAMAMEN yeniden yazılır (eski sarmalayıcılar milo-ders-sihirbaz/milo-duzen'de kalır ama
   bu dosya en son yüklendiği için devre dışı); ekleme/çıkarma/iptal fonksiyonları onu çağırmaya devam eder. */
let _mdp = { acik: null, adDuzen: false };
const MDP_GUN = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'], MDP_SIRA = [1, 2, 3, 4, 5, 6, 0];
function mdpDk(t) { let [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); }
function mdpSaat(d) { d = ((d % 1440) + 1440) % 1440; return String(Math.floor(d / 60)).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0'); }
function mdpISO(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function mdpGunler(s) { return (s.gunler && s.gunler.length ? s.gunler : [s.gun]).map(Number); }
function mdpGunYazi(s) { let g = mdpGunler(s); return MDP_SIRA.filter(x => g.includes(x)).map(x => MDP_GUN[x]).join(', '); }
function mdpYaklasan(s, n) {
    let g = mdpGunler(s), l = [], d = new Date(), simdi = d.getHours() * 60 + d.getMinutes();
    for (let i = 0; i < 60 && l.length < n; i++) {
        let t = new Date(d.getFullYear(), d.getMonth(), d.getDate() + i);
        if (!g.includes(t.getDay())) continue;
        if (i === 0 && mdpDk(s.bitisSaat) < simdi) continue;
        let iso = mdpISO(t); l.push({ iso, t, iptal: (s.istisnalar || []).find(x => x.tarih === iso) });
    }
    return l;
}
function mdpAvatar(ad) {
    let h = 0; for (let c of ad) h = (h * 31 + c.charCodeAt(0)) % 360;
    let ini = ad.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0]).join('');
    return `<span class="mdp-av" style="--h:${h}">${miloEsc(ini)}</span>`;
}

function mdpKap() {
    let m = document.getElementById('milo-ders-roster-modal'); if (!m) return null;
    let k = document.getElementById('mdp-ic');
    if (!k) {
        m.innerHTML = '<div class="mdp" role="dialog" aria-modal="true" aria-label="Ders"><div class="mdp-tut"></div><div id="mdp-ic"></div></div>';
        m.classList.add('mdp-arka');
        m.addEventListener('click', e => { if (e.target === m) miloDersRosterKapat(); });
        k = document.getElementById('mdp-ic');
    }
    return k;
}
miloDersRosterAc = function (slotId) {
    _miloDrmAcikSlotId = slotId; _mdp = { acik: null, adDuzen: false };
    try { _mspDersSec = {}; } catch (e) {}
    mdpKap(); miloDersRosterCiz();
    let m = document.getElementById('milo-ders-roster-modal'); m.style.display = 'flex';
    let ic = m.querySelector('.mdp'); if (ic) ic.scrollTop = 0;
};
function mdpSatir(id, etiket, deger, ic) {
    let a = _mdp.acik === id;
    return `<button type="button" class="mdp-row${a ? ' acik' : ''}" aria-expanded="${a}" onclick="mdpAc('${id}')"><span>${etiket}</span><b>${deger}<i class="mdp-chev">›</i></b></button>${a ? `<div class="mdp-duz">${ic}</div>` : ''}`;
}
function mdpAc(id) { _mdp.acik = _mdp.acik === id ? null : id; miloDersRosterCiz(); }

miloDersRosterCiz = function () {
    let s = _miloDrmSlot(), k = mdpKap(); if (!s || !k) return;
    let kat = (s.katilimcilar || []).slice().sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    let y = typeof mdsSlotYas === 'function' ? mdsSlotYas(s.id) : null, yasYazi = y ? mdsAralikEtiket(y.minAy, y.maxAy) : '';
    let sure = mdpDk(s.bitisSaat) - mdpDk(s.baslangicSaat);
    let yak = mdpYaklasan(s, 6), iptalSay = yak.filter(x => x.iptal).length;
    let gun = mdpGunler(s);
    let presetler = typeof mdsPresetler === 'function' ? mdsPresetler() : [];

    let satirlar = mdpSatir('gun', 'Günler', miloEsc(mdpGunYazi(s)),
            `<div class="mdp-gunler">${MDP_SIRA.map(g => `<button type="button" class="${gun.includes(g) ? 'on' : ''}" onclick="mdpGunDegis(${g})">${MDP_GUN[g]}</button>`).join('')}</div>`)
        + mdpSatir('saat', 'Saat', s.baslangicSaat + ' – ' + s.bitisSaat,
            `<div class="mdp-saat"><input type="time" value="${s.baslangicSaat}" onchange="mdpSaatDegis(this.value, null)" aria-label="Başlangıç"><span>–</span><input type="time" value="${s.bitisSaat}" onchange="mdpSaatDegis(null, this.value)" aria-label="Bitiş"></div>
             <div class="mdp-cipler">${[30, 40, 45, 50, 60, 90].map(d => `<button type="button" class="${sure === d ? 'on' : ''}" onclick="mdpSaatDegis(null, '${mdpSaat(mdpDk(s.baslangicSaat) + d)}')">${d} dk</button>`).join('')}</div>`)
        + mdpSatir('kap', 'Kapasite', s.kapasite ? s.kapasite + ' kişi' : 'Sınırsız',
            `<div class="mdp-cipler">${[4, 6, 8, 10, 12, 15, 0].map(n => `<button type="button" class="${(s.kapasite || 0) === n ? 'on' : ''}" onclick="mdpKapasite(${n})">${n || 'Sınırsız'}</button>`).join('')}</div>`)
        + mdpSatir('yas', 'Yaş aralığı', yasYazi ? miloEsc(yasYazi) : '<em>yok</em>',
            `<div class="mdp-cipler">${presetler.map(p => `<button type="button" class="${y && y.minAy === p.min && y.maxAy === p.max ? 'on' : ''}" onclick="mdsSlotYasAyarla(${s.id}, ${p.min}, ${p.max})">${miloEsc(p.ikon || '')} ${miloEsc(mdsAralikEtiket(p.min, p.max))}</button>`).join('')}${y ? `<button type="button" onclick="mdsSlotYasAyarla(${s.id}, null, null)">Kaldır</button>` : ''}</div>`)
        + mdpSatir('plan', 'Plan', s.dersPlani ? `<span class="mdp-kisa">${miloEsc(s.dersPlani)}</span>` : '<em>ekle</em>',
            `<textarea id="mdp-plan" class="mdp-plan" placeholder="Bugün ne çalışılacak?">${miloEsc(s.dersPlani || '')}</textarea><div class="mdp-sag"><button type="button" class="mdp-kucuk" onclick="mdpPlanKaydet()">Kaydet</button></div>`)
        + mdpSatir('iptal', 'İptaller', iptalSay ? `<span class="mdp-kirmizi">${iptalSay} iptal</span>` : '<em>yok</em>',
            `<div class="mdp-tarihler">${yak.map(x => `<button type="button" class="${x.iptal ? 'off' : ''}" onclick="mdpIptal('${x.iso}')" title="${x.iptal ? 'İptali geri al' : 'Bu tarihi iptal et'}"><small>${MDP_GUN[x.t.getDay()]}</small><b>${x.t.getDate()}</b><small>${x.t.toLocaleDateString('tr-TR', { month: 'short' })}</small></button>`).join('')}</div><div class="mdp-ipucu">Tarihe dokun: o günün dersi iptal olur, tekrar dokun: geri gelir.</div>`);

    let ogr = kat.map(kk => {
        let u = (miloUyeler || []).find(x => x.grup === kk.grup && x.ad === kk.ad), oran = null;
        try { oran = _miloDersDevamOraniHesapla(s, kk.grup, kk.ad, 6); } catch (e) {}
        let renk = oran === null ? 'transparent' : oran >= 80 ? 'var(--milo-ok, #3DD68C)' : oran >= 50 ? 'var(--milo-sun)' : 'var(--milo-kirmizi, #FF6369)';
        let alt = [u && u.acilKisi ? u.acilKisi : '', u && u.dogumTarihi && typeof miloYasMetin === 'function' ? miloYasMetin(u.dogumTarihi) : ''].filter(Boolean).join(' · ');
        return `<div class="mdp-kisi">${mdpAvatar(kk.ad)}<div><b>${miloEsc(kk.ad)}</b>${alt ? `<small>${miloEsc(alt)}</small>` : ''}</div>${oran !== null ? `<span class="mdp-nokta" style="background:${renk}" title="Son 6 derste devam %${oran}"></span>` : ''}<button type="button" class="mdp-x" aria-label="${miloEsc(kk.ad)} dersten çıkar" data-g="${miloEsc(kk.grup)}" data-a="${miloEsc(kk.ad)}" onclick="mdpCikar(this.dataset.g, this.dataset.a)">✕</button></div>`;
    }).join('');
    let ekle = _mdp.acik === 'ekle'
        ? `<div class="mdp-ekle-ic">${mdpEkleHTML(s, y)}</div>`
        : `<button type="button" class="mdp-ekle" onclick="mdpAc('ekle')"><i>+</i>Öğrenci ekle</button>`;

    k.innerHTML = `<div class="mdp-hd">
            ${yasYazi ? `<button type="button" class="mdp-pill" onclick="mdpAc('yas')">${miloEsc(yasYazi)}</button>` : ''}
            ${_mdp.adDuzen
                ? `<input id="mdp-ad" class="mdp-ad-in" value="${miloEsc(s.grup)}" onkeydown="if(event.key==='Enter'){this.blur()} if(event.key==='Escape'){_mdp.adDuzen=false; miloDersRosterCiz()}" onblur="mdpAdKaydet(this.value)" aria-label="Ders adı">`
                : `<h3 class="mdp-h" onclick="_mdp.adDuzen=true; miloDersRosterCiz(); setTimeout(()=>{let e=document.getElementById('mdp-ad'); if(e){e.focus(); e.select();}},20)" title="Dokun: adını değiştir">${miloEsc(s.grup)}</h3>`}
            <div class="mdp-sub">${kat.length}${s.kapasite ? ' / ' + s.kapasite : ''} kişi · ${miloEsc(mdpGunYazi(s))} · ${s.baslangicSaat}</div>
        </div>
        <div class="mdp-grp">${satirlar}</div>
        <div class="mdp-lbl">Öğrenciler</div>
        <div class="mdp-grp">${ogr || '<div class="mdp-bos">Henüz öğrenci yok.</div>'}${ekle}</div>
        <div class="mdp-ft"><button type="button" class="mdp-bitti" onclick="miloDersRosterKapat()">Bitti</button>
            <div class="mdp-ft2"><button type="button" onclick="miloDersRosterPdfIndir()">Yoklama PDF</button><button type="button" class="mdp-sil" onclick="miloDersRosterSil()">Dersi sil</button></div></div>`;
};
function mdpEkleHTML(s, y) {
    if (typeof mspKur !== 'function') return '';
    let mevcut = {}; (s.katilimcilar || []).forEach(k => { mevcut[k.grup + '|' + k.ad] = 1; });
    return mspKur('ders', {
        adaylar: () => miloUyeler.filter(u => !u.pasif && !mevcut[u.grup + '|' + u.ad]), secili: () => _mspDersSec,
        yas: y ? { min: y.minAy, max: y.maxAy } : null,
        uyari: u => { try { let c = _miloDersCakismaBul(u.grup, u.ad, s); return c.length ? 'aynı saatte ' + c.map(x => x.grup).join(', ') : ''; } catch (e) { return ''; } },
        degisti: () => { let b = document.getElementById('msp-ders-btn'), n = mspSecilenler('ders').length; if (b) { b.disabled = !n; b.textContent = n ? n + ' öğrenciyi ekle' : 'Öğrenci seç'; } },
        bos: 'Tüm aktif üyeler bu derste.'
    }) + `<div class="mdp-ekle-alt"><button type="button" class="mdp-kucuk2" onclick="_mspDersSec={}; mdpAc('ekle')">Vazgeç</button><button type="button" id="msp-ders-btn" class="mdp-kucuk" disabled onclick="mspDerseEkle()">Öğrenci seç</button></div>`;
}

// ---- anında kaydetme
async function mdpPut(alan, mesaj) {
    let s = _miloDrmSlot(); if (!s) return false;
    try { await miloApi('/antrenman-programi/' + s.id, { method: 'PUT', body: JSON.stringify(alan) }); }
    catch (e) { showToast('Kaydedilemedi — bağlantını kontrol et.', 'error'); return false; }
    Object.assign(s, alan); if (alan.gunler) s.gun = Math.min.apply(null, alan.gunler);
    miloDersRosterCiz(); try { miloProgramIzgaraCiz(); } catch (e) {}
    if (mesaj) showToast('✓ ' + mesaj, 'success');
    return true;
}
function mdpGunDegis(g) {
    let s = _miloDrmSlot(); if (!s) return;
    let l = mdpGunler(s); l = l.includes(g) ? l.filter(x => x !== g) : l.concat(g);
    if (!l.length) return showToast('En az bir gün kalmalı.', 'warning');
    mdpPut({ gunler: l.sort((a, b) => a - b) }, 'Günler: ' + MDP_SIRA.filter(x => l.includes(x)).map(x => MDP_GUN[x]).join(', '));
}
function mdpSaatDegis(bas, bit) {
    let s = _miloDrmSlot(); if (!s) return;
    let sure = mdpDk(s.bitisSaat) - mdpDk(s.baslangicSaat);
    if (bas && !bit) bit = mdpSaat(mdpDk(bas) + (sure > 0 ? sure : 45)); // başlangıç kayınca süre korunur
    bas = bas || s.baslangicSaat; bit = bit || s.bitisSaat;
    if (mdpDk(bit) <= mdpDk(bas)) return showToast('Bitiş başlangıçtan sonra olmalı.', 'warning');
    mdpPut({ baslangicSaat: bas, bitisSaat: bit }, bas + ' – ' + bit);
}
function mdpKapasite(n) { mdpPut({ kapasite: n || null }, n ? 'Kapasite ' + n : 'Kapasite sınırsız'); }
function mdpPlanKaydet() { let e = document.getElementById('mdp-plan'); if (!e) return; _mdp.acik = null; mdpPut({ dersPlani: e.value.trim() || null }, 'Plan kaydedildi'); }
function mdpAdKaydet(v) {
    let s = _miloDrmSlot(); v = String(v || '').replace(/\s+/g, ' ').trim(); _mdp.adDuzen = false;
    if (!s || !v || v === s.grup) return miloDersRosterCiz();
    mdpPut({ grup: v }, 'Ders adı: ' + v);
}
async function mdpIptal(iso) {
    let s = _miloDrmSlot(); if (!s) return;
    let var_ = (s.istisnalar || []).some(x => x.tarih === iso);
    try {
        if (var_) await miloApi('/antrenman-programi/' + s.id + '/istisna?tarih=' + encodeURIComponent(iso), { method: 'DELETE' });
        else await miloApi('/antrenman-programi/' + s.id + '/istisna', { method: 'POST', body: JSON.stringify({ tarih: iso, sebep: null }) });
    } catch (e) { return showToast('Kaydedilemedi.', 'error'); }
    s.istisnalar = (s.istisnalar || []).filter(x => x.tarih !== iso); if (!var_) s.istisnalar.push({ tarih: iso, sebep: null });
    miloDersRosterCiz(); try { miloProgramIzgaraCiz(); } catch (e) {}
    let t = new Date(iso + 'T12:00'); showToast(var_ ? '✓ ' + t.getDate() + ' ' + t.toLocaleDateString('tr-TR', { month: 'long' }) + ' dersi geri geldi' : t.getDate() + ' ' + t.toLocaleDateString('tr-TR', { month: 'long' }) + ' dersi iptal', var_ ? 'success' : 'warning');
}
function mdpCikar(g, a) { if (confirm(a + ' bu dersten çıkarılsın mı?')) miloDersRosterKatilimciSil(g, a); }

(function () {
    let st = document.createElement('style'); st.id = 'mdp-css';
    st.textContent = `
#milo-ders-roster-modal.mdp-arka{background:rgba(0,0,0,.6)!important;align-items:flex-end!important;padding:0!important}
@media (min-width:640px){#milo-ders-roster-modal.mdp-arka{align-items:center!important;padding:20px!important}}
.mdp{width:100%;max-width:460px;max-height:92vh;overflow-y:auto;background:var(--milo-card-solid,var(--milo-opak,var(--milo-card)));color:var(--milo-ink);border-radius:28px 28px 0 0;border:1px solid var(--milo-line);border-bottom:0;padding-bottom:max(12px,env(safe-area-inset-bottom));animation:mdpGir .22s ease-out;overscroll-behavior:contain}
@media (min-width:640px){.mdp{border-radius:28px;border-bottom:1px solid var(--milo-line)}}
@keyframes mdpGir{from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1}}
.mdp-tut{width:38px;height:4px;border-radius:2px;background:var(--milo-line);margin:10px auto 0}
.mdp-hd{padding:16px 22px 4px;display:flex;flex-direction:column;align-items:flex-start;gap:4px}
.mdp-pill{border:0;background:color-mix(in srgb,var(--milo-teal) 16%,transparent);color:var(--milo-teal);font:inherit;font-weight:700;font-size:12px;padding:4px 10px;border-radius:999px;cursor:pointer;margin-bottom:4px}
.mdp-h{margin:0;font-size:24px;font-weight:800;letter-spacing:-.025em;line-height:1.15;cursor:text}
.mdp-ad-in{width:100%;font:inherit;font-size:22px;font-weight:800;letter-spacing:-.02em;background:var(--milo-card-raised);border:1px solid var(--milo-teal);border-radius:12px;color:var(--milo-ink);padding:6px 10px}
.mdp-sub{color:var(--milo-ink-dim);font-size:13.5px}
.mdp-grp{margin:14px 16px;background:var(--milo-card-raised);border-radius:18px;overflow:hidden}
.mdp-row{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;font:inherit;font-size:14.5px;color:var(--milo-ink);background:none;border:0;cursor:pointer;text-align:left;min-height:50px}
.mdp-grp>*+*{border-top:1px solid var(--milo-line)}
.mdp-row>span{color:var(--milo-ink-dim);flex-shrink:0}.mdp-row>b{font-weight:700;display:flex;align-items:center;gap:8px;min-width:0;justify-content:flex-end}
.mdp-row em{font-style:normal;font-weight:600;color:var(--milo-ink-dim)}
.mdp-chev{font-style:normal;color:var(--milo-ink-dim);font-size:18px;line-height:1;transition:transform .15s}.mdp-row.acik .mdp-chev{transform:rotate(90deg)}
.mdp-kisa{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}
.mdp-kirmizi{color:var(--milo-kirmizi,#FF6369)}
.mdp-duz{padding:4px 16px 16px;border-top:0!important;display:flex;flex-direction:column;gap:10px}
.mdp-gunler{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.mdp-gunler button,.mdp-cipler button{border:0;font:inherit;cursor:pointer;font-weight:700;color:var(--milo-ink-dim);background:var(--milo-card-solid,var(--milo-opak,var(--milo-card)));transition:background .15s,color .15s}
.mdp-gunler button{height:40px;border-radius:12px;font-size:13px}
.mdp-gunler button.on{background:var(--milo-ink);color:var(--milo-bg)}
.mdp-cipler{display:flex;flex-wrap:wrap;gap:6px}.mdp-cipler button{height:36px;padding:0 13px;border-radius:999px;font-size:13px}
.mdp-cipler button.on{background:var(--milo-teal);color:#fff}
.mdp-saat{display:flex;align-items:center;gap:10px}.mdp-saat span{color:var(--milo-ink-dim)}
.mdp-saat input{flex:1;min-width:0;height:46px;border-radius:12px;border:0;background:var(--milo-card-solid,var(--milo-opak,var(--milo-card)));color:var(--milo-ink);font:inherit;font-size:17px;font-weight:800;padding:0 12px;font-variant-numeric:tabular-nums;color-scheme:dark}
.mdp-plan{width:100%;min-height:90px;border:0;border-radius:14px;background:var(--milo-card-solid,var(--milo-opak,var(--milo-card)));color:var(--milo-ink);padding:12px 14px;font:inherit;font-size:14px;resize:vertical;box-sizing:border-box}
.mdp-sag{display:flex;justify-content:flex-end}
.mdp-kucuk,.mdp-kucuk2{height:38px;padding:0 16px;border-radius:12px;border:0;font:inherit;font-weight:800;font-size:13px;cursor:pointer;background:var(--milo-teal);color:#fff}
.mdp-kucuk:disabled{opacity:.45;cursor:default}.mdp-kucuk2{background:transparent;color:var(--milo-ink-dim)}
.mdp-tarihler{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}
.mdp-tarihler button{flex:0 0 58px;height:66px;border-radius:14px;border:1.5px solid transparent;background:var(--milo-card-solid,var(--milo-opak,var(--milo-card)));color:var(--milo-ink);font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px}
.mdp-tarihler b{font-size:18px;font-weight:800}.mdp-tarihler small{font-size:10.5px;color:var(--milo-ink-dim);font-weight:700}
.mdp-tarihler button.off{background:transparent;border:1.5px dashed var(--milo-kirmizi,#FF6369)}.mdp-tarihler button.off b{color:var(--milo-kirmizi,#FF6369);text-decoration:line-through}
.mdp-ipucu{font-size:12px;color:var(--milo-ink-dim)}
.mdp-lbl{padding:6px 22px 0;font-size:12px;font-weight:700;color:var(--milo-ink-dim);text-transform:uppercase;letter-spacing:.06em}
.mdp-kisi{display:flex;align-items:center;gap:12px;padding:10px 12px 10px 16px}
.mdp-kisi>div{flex:1;min-width:0}.mdp-kisi b{display:block;font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mdp-kisi small{display:block;color:var(--milo-ink-dim);font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mdp-av{width:36px;height:36px;flex:0 0 36px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:800;background:hsl(var(--h) 45% 22%);color:hsl(var(--h) 80% 82%)}
.mdp-nokta{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.mdp-x{width:34px;height:34px;border-radius:50%;border:0;background:none;color:var(--milo-ink-dim);font-size:15px;cursor:pointer;flex-shrink:0}.mdp-x:hover{background:var(--milo-card-solid,var(--milo-opak))}
.mdp-ekle{width:100%;display:flex;align-items:center;gap:12px;padding:12px 16px;border:0;background:none;color:var(--milo-teal);font:inherit;font-weight:700;font-size:14.5px;cursor:pointer;text-align:left}
.mdp-ekle i{width:36px;height:36px;border-radius:50%;background:color-mix(in srgb,var(--milo-teal) 15%,transparent);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-size:20px}
.mdp-ekle-ic{padding:12px}.mdp-ekle-ic .msp-liste{grid-template-columns:minmax(0,1fr);max-height:280px}
.mdp-ekle-alt{display:flex;justify-content:flex-end;gap:6px;margin-top:10px}
.mdp-bos{padding:16px;color:var(--milo-ink-dim);font-size:13.5px}
.mdp-ft{padding:6px 16px 14px;display:flex;flex-direction:column;gap:6px;align-items:stretch}
.mdp-bitti{height:52px;border-radius:16px;border:0;background:var(--milo-teal);color:#fff;font:inherit;font-weight:800;font-size:15px;cursor:pointer}
.mdp-ft2{display:flex;justify-content:space-between}.mdp-ft2 button{border:0;background:none;font:inherit;font-weight:700;font-size:14px;color:var(--milo-ink-dim);padding:10px 6px;cursor:pointer}
.mdp-ft2 .mdp-sil{color:var(--milo-kirmizi,#FF6369)}
.mdp button:focus-visible,.mdp input:focus-visible,.mdp textarea:focus-visible{outline:2px solid var(--milo-teal);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.mdp{animation:none}.mdp-chev{transition:none}}`;
    document.head.appendChild(st);
})();
