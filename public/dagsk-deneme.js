/* Deneme Dersleri (2026-10-05) — yönetici › Kulüp İşleri › 🌱 Deneme Dersleri.
   Sitedeki "ücretsiz deneme dersi" formu hiçbir şey saklamaz, mesajı WhatsApp'ta hazır açar. Bu ekran o mesajlardan
   gelen adayları takip eder: Yeni → Arandı → Deneme günü verildi → Denemeye geldi → Kayıt oldu (ya da Vazgeçti).
   Veri: meta deneme_adaylari (kyDepo, kayıt başına son-yazan-kazanır; oturumlu — telefon içerir). Sitedeki talep
   SAYISI ayrıca /api/tanitim/ziyaret-ozet'ten gelir (huni: ziyaret → talep → aday → deneme → kayıt).
   dd* adları bu dosyanındır. */
const DD_DURUMLAR = [
    ['yeni', 'Yeni', 'Henüz dönüş yapılmadı'],
    ['arandi', 'Arandı', 'Konuşuldu, gün bekleniyor'],
    ['planlandi', 'Deneme günü verildi', 'Gelmesi bekleniyor'],
    ['geldi', 'Denemeye geldi', 'Kayıt kararı bekleniyor'],
    ['kayit', 'Kayıt oldu', ''],
    ['vazgecti', 'Vazgeçti', '']
];
const DD_KAYNAK = [['site', 'Site formu'], ['whatsapp', 'WhatsApp'], ['tavsiye', 'Tavsiye'], ['telefon', 'Telefon'], ['diger', 'Diğer']];
let _dd = { senk: false, form: null, kapaliAcik: false, site: null, kayitAc: null };

function ddKayitlar() { try { return kyDepoOku('deneme_adaylari'); } catch (e) { return {}; } }
function ddListe() { let d = ddKayitlar(); return Object.keys(d).filter(k => d[k] && !d[k].sil).map(k => Object.assign({ id: k }, d[k])); }
function ddBugun() { return typeof bsIsoTarih === 'function' ? bsIsoTarih(new Date()) : new Date().toISOString().slice(0, 10); }
function ddGunFark(iso) { if (!iso) return null; return Math.round((new Date(iso + 'T12:00:00') - new Date(ddBugun() + 'T12:00:00')) / 86400000); }
function ddTarihYaz(iso) {
    let f = ddGunFark(iso); if (f == null) return '';
    if (f === 0) return 'bugün'; if (f === 1) return 'yarın'; if (f === -1) return 'dün';
    let t = new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', weekday: 'short' });
    return t;
}
function ddKaydet(id, degisim) {
    let d = ddKayitlar(), eski = d[id] || {};
    let yeni = Object.assign({}, eski, degisim, { t: Date.now() });
    if (degisim.durum && degisim.durum !== eski.durum) yeni.gecmis = (eski.gecmis || []).concat([{ d: degisim.durum, z: Date.now(), kim: (typeof _oturum !== 'undefined' && _oturum && _oturum.ad) || '' }]).slice(-20);
    d[id] = degisim.sil ? { sil: true, t: Date.now() } : yeni; // silinende telefon vb. hiçbir alan kalmaz
    kyDepoYazYerel('deneme_adaylari', d);
    kyDepoSenkron('deneme_adaylari', () => ddKayitlar(), true).catch(() => {});
    try { yoneticiSidebarCiz(); } catch (e) {}
}
// Bir yıldan eski kapanmış (kayıt / vazgeçti) adaylar silinir — telefon numarası gereğinden uzun tutulmasın (KVKK).
function ddBuda(tum) {
    let sinir = Date.now() - 365 * 86400000;
    Object.keys(tum).forEach(k => { let x = tum[k]; if (x && !x.sil && (x.durum === 'kayit' || x.durum === 'vazgecti') && (x.t || 0) < sinir) tum[k] = { sil: true, t: Date.now() }; });
    return tum;
}

// Dikkat: aksiyon bekleyenler (sidebar rozeti de bunu sayar — app.js denemeDikkatSayisi)
function ddDikkat(x) {
    let simdi = Date.now();
    if (x.durum === 'yeni') return (simdi - (x.olusturma || x.t || simdi)) > 86400000 ? 'Bir günden uzun süredir dönüş bekliyor' : 'Yeni — ara ya da yaz';
    if (x.durum === 'arandi') return (simdi - ddSonDegisim(x)) > 3 * 86400000 ? '3 günden uzun süredir gün verilmedi' : '';
    if (x.durum === 'planlandi') { let f = ddGunFark(x.denemeTarihi); if (f == null) return 'Deneme günü girilmedi'; if (f === 0) return 'Deneme dersi bugün'; if (f === 1) return 'Yarın deneme dersi — hatırlat'; if (f < 0) return 'Deneme günü geçti — geldi mi?'; return ''; }
    if (x.durum === 'geldi') return (simdi - ddSonDegisim(x)) > 3 * 86400000 ? 'Denemeden sonra 3 gün geçti — sonucu sor' : '';
    return '';
}
function ddSonDegisim(x) { let g = x.gecmis || []; return g.length ? g[g.length - 1].z : (x.olusturma || x.t || 0); }

// Sitedeki formun hazırladığı mesajı çözer: "- Çocuğum için (8 yaş)", "- Branş: Okçuluk", "- Uygun zaman: …", "- Ad: …"
function ddMesajCoz(m) {
    let s = String(m || ''), r = {};
    let kim = s.match(/-\s*(Çocuğum|Kendim) için(?:\s*\((\d{1,2})\s*yaş\))?/i);
    if (kim) { r.kim = /çocu/i.test(kim[1]) ? 'cocuk' : 'kendi'; if (kim[2]) r.yas = kim[2]; }
    let b = s.match(/Branş:\s*([^\n]+)/i); if (b) r.brans = b[1].trim();
    let z = s.match(/Uygun zaman:\s*([^\n]+)/i); if (z && !/fark etmez/i.test(z[1])) r.saat = z[1].trim();
    let a = s.match(/-\s*Ad:\s*([^\n]+)/i); if (a) r.ad = a[1].trim();
    let tel = s.replace(/[\s()-]/g, '').match(/(?:\+?90|0)?5\d{9}/); if (tel) r.tel = tel[0];
    if (/deneme dersi almak istiyorum/i.test(s)) r.kaynak = 'site';
    return r;
}

function ddWaMetin(x) {
    let ilk = String(x.ad || '').split(' ')[0], ilkB = ilk ? ilk.charAt(0).toLocaleUpperCase('tr-TR') + ilk.slice(1).toLocaleLowerCase('tr-TR') : '';
    let kim = x.kim === 'kendi' ? 'sizi' : (ilkB ? ilkB + "'i" : 'sizi');
    if (x.durum === 'planlandi' && x.denemeTarihi) return 'Merhaba 🌟 DAĞ Spor Kulübü\'nden yazıyorum. ' + kim.charAt(0).toUpperCase() + kim.slice(1) + ' ' + ddTarihYaz(x.denemeTarihi) + (x.saat ? ' ' + x.saat : '') + ' deneme dersimize bekliyoruz 🏹 Rahat kıyafet ve spor ayakkabı yeterli, ekipman bizden. Görüşmek üzere!';
    if (x.durum === 'geldi') return 'Merhaba 🌟 Deneme dersimize geldiğiniz için teşekkürler! ' + (x.kim === 'kendi' ? 'Nasıl buldunuz?' : (ilkB || 'Çocuğunuz') + ' nasıl buldu?') + ' Kayıt ve ders saatleri için sorularınızı buradan yanıtlayabilirim 🙂';
    return 'Merhaba 🌟 DAĞ Spor Kulübü\'nden yazıyorum, ücretsiz deneme dersi talebiniz için teşekkürler! ' + (x.saat ? x.saat + ' sizin için uygun mu? ' : 'Hangi gün ve saat sizin için uygun? ') + 'Size en uygun dersi birlikte belirleyelim 🏹';
}
function ddWa(id) {
    let x = ddKayitlar()[id]; if (!x) return;
    let numara = typeof telefonWaFormat === 'function' ? telefonWaFormat(x.tel || '') : '';
    window.open((numara ? 'https://api.whatsapp.com/send?phone=' + numara + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(ddWaMetin(x)), '_blank');
    if (x.durum === 'yeni') ddKaydet(id, { durum: 'arandi' });
    else { ddKaydet(id, { sonMesaj: Date.now() }); }
    ddCiz();
}

function ddHuni() {
    let l = ddListe(), sinir = Date.now() - 90 * 86400000, son = l.filter(x => (x.olusturma || x.t || 0) >= sinir);
    let gecti = (x, d) => x.durum === d || (x.gecmis || []).some(g => g.d === d);
    let deneme = son.filter(x => gecti(x, 'geldi') || x.durum === 'kayit').length, kayit = son.filter(x => x.durum === 'kayit').length;
    return { aday: son.length, deneme, kayit, site: _dd.site };
}
function ddHuniHTML() {
    let h = ddHuni(), yuzde = (a, b) => b ? Math.round(a / b * 100) + '%' : '—';
    let adim = (n, l, alt) => `<div class="dd-huni-adim"><b>${n == null ? '…' : n}</b><span>${l}</span>${alt ? `<small>${alt}</small>` : ''}</div>`;
    return `<div class="dd-huni">
        ${h.site ? adim(h.site.ziyaret, 'site ziyareti') + adim(h.site.talep, 'sitede talep', yuzde(h.site.talep, h.site.ziyaret) + ' ziyaretten') : ''}
        ${adim(h.aday, 'aday kaydı')}
        ${adim(h.deneme, 'denemeye geldi', yuzde(h.deneme, h.aday) + ' adaydan')}
        ${adim(h.kayit, 'kayıt oldu', yuzde(h.kayit, h.deneme) + ' denemeden')}
    </div><div class="dd-not">Son 90 gün. Sitedeki talep sayısı formu gönderen ya da "deneme dersi" WhatsApp düğmesine basanları sayar; kişi bilgisi saklanmaz.</div>`;
}

function ddFormHTML() {
    let f = _dd.form; if (!f) return '';
    let v = k => esc(f[k] || '');
    return `<div class="dd-form">
        <label class="dd-tam">WhatsApp mesajını yapıştır <span>(isteğe bağlı — sitedeki formdan gelen mesaj alanları kendisi doldurur)</span>
            <textarea id="dd-yapistir" rows="3" placeholder="Merhaba, ücretsiz deneme dersi almak istiyorum…" oninput="ddYapistir(this.value)">${v('mesaj')}</textarea></label>
        <label>Ad Soyad<input id="dd-ad" value="${v('ad')}" autocomplete="off" oninput="_dd.form.ad=this.value"></label>
        <label>Telefon<input id="dd-tel" type="tel" inputmode="tel" value="${v('tel')}" placeholder="05xx xxx xx xx" oninput="_dd.form.tel=this.value"></label>
        <label>Kimin için<select id="dd-kim" onchange="_dd.form.kim=this.value"><option value="cocuk"${f.kim !== 'kendi' ? ' selected' : ''}>Çocuğu için</option><option value="kendi"${f.kim === 'kendi' ? ' selected' : ''}>Kendisi için</option></select></label>
        <label>Yaş<input id="dd-yas" type="number" min="3" max="90" value="${v('yas')}" oninput="_dd.form.yas=this.value"></label>
        <label>Uygun zaman<input id="dd-saat" value="${v('saat')}" placeholder="ör. Cmt 11:00" oninput="_dd.form.saat=this.value"></label>
        <label>Nereden<select id="dd-kaynak" onchange="_dd.form.kaynak=this.value">${DD_KAYNAK.map(([k, l]) => `<option value="${k}"${(f.kaynak || 'whatsapp') === k ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
        <label class="dd-tam">Not<input id="dd-not" value="${v('not')}" oninput="_dd.form.not=this.value"></label>
        <div class="dd-tam dd-form-btn"><button class="dd-btn" onclick="_dd.form=null; ddCiz()">Vazgeç</button><button class="dd-btn ana" onclick="ddEkle()">Adayı kaydet</button></div>
    </div>`;
}
function ddYapistir(m) {
    let r = ddMesajCoz(m); _dd.form.mesaj = m;
    ['ad', 'tel', 'yas', 'saat', 'kim', 'kaynak'].forEach(k => { if (r[k]) _dd.form[k] = r[k]; });
    if (r.brans && !/okçuluk/i.test(r.brans)) _dd.form.not = (_dd.form.not ? _dd.form.not + ' · ' : '') + 'Branş: ' + r.brans;
    let o = document.activeElement && document.activeElement.id; ddCiz();
    let e = document.getElementById(o || 'dd-yapistir'); if (e) { e.focus(); try { e.setSelectionRange(e.value.length, e.value.length); } catch (x) {} }
}
function ddEkle() {
    let f = _dd.form; if (!f) return;
    let ad = String(f.ad || '').trim();
    if (!ad && !String(f.tel || '').trim()) return showToast('Ad ya da telefon yaz.', 'error');
    let id = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    ddKaydet(id, { ad: ad || 'İsimsiz aday', tel: String(f.tel || '').trim(), kim: f.kim || 'cocuk', yas: f.yas ? parseInt(f.yas, 10) : null, saat: String(f.saat || '').trim(), kaynak: f.kaynak || 'whatsapp', not: String(f.not || '').trim(), olusturma: Date.now(), durum: 'yeni' });
    _dd.form = null; showToast('Aday kaydedildi', 'success'); ddCiz();
}

function ddKartHTML(x) {
    let dk = ddDikkat(x), yas = x.yas ? x.yas + ' yaş' : '', kim = x.kim === 'kendi' ? 'kendisi' : 'çocuk';
    let idx = DD_DURUMLAR.findIndex(d => d[0] === x.durum), sonraki = DD_DURUMLAR[idx + 1] && idx < 3 ? DD_DURUMLAR[idx + 1] : null;
    let ileriEtiket = { arandi: 'Arandı', planlandi: 'Gün verildi', geldi: 'Geldi', kayit: 'Kayıt oldu' };
    let id = esc(x.id);
    return `<div class="dd-kart${dk ? ' dikkat' : ''}" data-id="${id}">
        <div class="dd-kart-ust"><b>${esc(x.ad)}</b><span class="dd-etiket">${[yas, kim].filter(Boolean).join(' · ')}</span></div>
        <div class="dd-kart-alt">${x.saat ? '🕒 ' + esc(x.saat) + ' · ' : ''}${x.tel ? esc(x.tel) + ' · ' : ''}${esc((DD_KAYNAK.find(k => k[0] === x.kaynak) || ['', ''])[1])} · ${new Date(x.olusturma || x.t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</div>
        ${x.durum === 'planlandi' ? `<label class="dd-tarih">Deneme günü <input type="date" value="${esc(x.denemeTarihi || '')}" onchange="ddKaydet('${id}', { denemeTarihi: this.value }); ddCiz()">${x.denemeTarihi ? `<span>${ddTarihYaz(x.denemeTarihi)}</span>` : ''}</label>` : ''}
        ${x.not ? `<div class="dd-kart-not">${esc(x.not)}</div>` : ''}
        ${x.durum === 'geldi' && x.sporcu ? `<div class="dd-kart-not">🎯 ${x.gelisTarihi ? new Date(x.gelisTarihi + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) + ' · ' : ''}Karışık Sınıf'ta derse girdi${x.dusunuyor ? ' · 🤔 kayıt için düşünüyor' : ''}</div>` : ''}
        ${x.durum === 'kayit' && x.sporcu ? `<div class="dd-kart-not">✓ ${esc(x.sporcu.ad)} · ${esc(typeof grupAd === 'function' ? grupAd(x.sporcu.g) : x.sporcu.g)} grubuna eklendi</div>` : ''}
        ${dk ? `<div class="dd-uyari">${esc(dk)}</div>` : ''}
        ${_dd.kayitAc === x.id ? ddSporcuEkleHTML(x) : ''}
        <div class="dd-kart-btn">
            ${x.durum !== 'kayit' && x.durum !== 'vazgecti' ? `<button class="dd-btn wa" onclick="ddWa('${id}')" title="WhatsApp'ta hazır mesaj aç">WhatsApp</button>` : ''}
            ${sonraki ? `<button class="dd-btn ana" onclick="ddIleri('${id}', '${sonraki[0]}')">→ ${ileriEtiket[sonraki[0]]}</button>` : ''}
            ${x.durum === 'geldi' ? `<button class="dd-btn ana" onclick="ddIleri('${id}', 'kayit')">✓ Kayıt oldu</button>` : ''}
            ${x.durum === 'kayit' && !x.sporcu ? `<button class="dd-btn ana" onclick="_dd.kayitAc='${id}'; ddCiz()">+ Sporcu olarak ekle</button>` : ''}
            <select class="dd-sec" aria-label="Durumu değiştir" onchange="ddIleri('${id}', this.value)">${DD_DURUMLAR.map(([k, l]) => `<option value="${k}"${k === x.durum ? ' selected' : ''}>${l}</option>`).join('')}<option value="__sil">Sil…</option></select>
        </div>
    </div>`;
}
function ddIleri(id, durum) {
    let x = ddKayitlar()[id]; if (!x) return;
    if (durum === '__sil') return onayIste('<b>' + esc(x.ad) + '</b> aday listesinden silinsin mi?', () => { ddKaydet(id, { sil: true }); ddCiz(); }, 'Sil', 'Vazgeç');
    let ek = { durum };
    if (durum === 'planlandi' && !x.denemeTarihi) ek.denemeTarihi = '';
    ddKaydet(id, ek);
    if (durum === 'kayit' && !x.sporcu) _dd.kayitAc = id;
    ddCiz();
}
function ddSporcuEkleHTML(x) {
    let gruplar = [['buyukler', 'Büyükler'], ['yildizlar', 'Yıldızlar'], ['kucukler', 'Küçükler'], ['minikler', 'Minikler']];
    let oneri = x.yas ? (x.yas >= 15 ? 'buyukler' : x.yas >= 12 ? 'yildizlar' : x.yas >= 9 ? 'kucukler' : 'minikler') : (typeof aktifGrup !== 'undefined' ? aktifGrup : 'buyukler');
    return `<div class="dd-ekle">
        <input id="dd-sp-ad" value="${esc(String(x.ad || '').toLocaleUpperCase('tr-TR'))}" aria-label="Sporcunun adı soyadı">
        <select id="dd-sp-grup" aria-label="Grup">${gruplar.map(([k, l]) => `<option value="${k}"${k === oneri ? ' selected' : ''}>${l}</option>`).join('')}</select>
        <button class="dd-btn ana" onclick="ddSporcuEkle('${esc(x.id)}')">Ekle</button><button class="dd-btn" onclick="_dd.kayitAc=null; ddCiz()">Sonra</button>
        <div class="dd-not" style="flex-basis:100%">Telefon veli telefonu olarak yazılır. Yaşa göre grup önerildi — gerekirse değiştir.</div>
    </div>`;
}
function ddSporcuEkle(id) {
    let x = ddKayitlar()[id]; if (!x) return;
    let ad = String((document.getElementById('dd-sp-ad') || {}).value || '').trim().toLocaleUpperCase('tr-TR'), g = (document.getElementById('dd-sp-grup') || {}).value || 'buyukler';
    if (!ad) return showToast('Ad Soyad yaz.', 'error');
    if (turnuvaDB[g] && turnuvaDB[g][ad]) { ddKaydet(id, { sporcu: { g, ad } }); _dd.kayitAc = null; ddCiz(); return showToast(ad + ' zaten bu grupta kayıtlı — adaya bağlandı.', 'info'); }
    let yil = x.yas ? new Date().getFullYear() - x.yas : '';
    _yoneticiSporcuEkleGerceklestir(ad, yil, g);
    let sp = turnuvaDB[g] && turnuvaDB[g][ad];
    if (sp) {
        if (x.tel && !sp.acilTelefon) sp.acilTelefon = x.tel;
        if (!sp.katilmaTarihi) sp.katilmaTarihi = ddBugun();
        sp.lastModified = Date.now();
        try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); bekleyenGonderim = true; } catch (e) {}
    }
    ddKaydet(id, { sporcu: { g, ad } }); _dd.kayitAc = null; ddCiz();
}

function ddCiz() {
    let alan = document.getElementById('yonetici-liste'); if (!alan) return;
    if (!_dd.senk && typeof kyDepoSenkron === 'function') { _dd.senk = true; kyDepoSenkron('deneme_adaylari', () => ddKayitlar(), false, ddBuda).then(() => { if (yoneticiSekmeAktif === 'deneme') ddCiz(); }).catch(() => {}); }
    if (!_dd.site) fetch('/api/tanitim/ziyaret-ozet').then(r => r.ok ? r.json() : null).then(d => { if (d && d.son90) { _dd.site = d.son90; if (yoneticiSekmeAktif === 'deneme') { let h = document.getElementById('dd-huni-kap'); if (h) h.innerHTML = ddHuniHTML(); } } }).catch(() => {});
    let l = ddListe(), acik = l.filter(x => x.durum !== 'kayit' && x.durum !== 'vazgecti');
    let dikkat = acik.filter(x => ddDikkat(x)).length;
    let sirala = (a, b) => (a.durum === 'planlandi' && b.durum === 'planlandi' ? String(a.denemeTarihi || '9').localeCompare(String(b.denemeTarihi || '9')) : (b.olusturma || 0) - (a.olusturma || 0));
    let bolum = ([k, l2, alt]) => { let xs = l.filter(x => x.durum === k).sort(sirala); return `<section class="dd-sutun"><div class="dd-sutun-bas"><b>${l2}</b><span>${xs.length}</span></div>${alt ? `<div class="dd-not">${alt}</div>` : ''}${xs.length ? xs.map(ddKartHTML).join('') : '<div class="dd-bos">—</div>'}</section>`; };
    let kapali = l.filter(x => x.durum === 'kayit' || x.durum === 'vazgecti');
    alan.innerHTML = `<div class="dd">
        <div class="dd-ust"><div><div class="dd-baslik">🌱 Deneme Dersleri</div><div class="dd-not">${acik.length} açık aday${dikkat ? ` · <b style="color:var(--accent-orange)">${dikkat} tanesi seni bekliyor</b>` : ''}</div></div>
            ${_dd.form ? '' : `<button class="dd-btn ana" onclick="_dd.form={kaynak:'whatsapp', kim:'cocuk'}; ddCiz(); setTimeout(()=>{let e=document.getElementById('dd-yapistir'); if(e) e.focus();},30)">+ Yeni aday</button>`}</div>
        ${ddFormHTML()}
        <div id="dd-huni-kap">${ddHuniHTML()}</div>
        <div class="dd-pano">${DD_DURUMLAR.slice(0, 4).map(bolum).join('')}</div>
        <details class="dd-kapali"${_dd.kapaliAcik || _dd.kayitAc ? ' open' : ''} ontoggle="_dd.kapaliAcik=this.open"><summary>Sonuçlananlar · ${kapali.filter(x => x.durum === 'kayit').length} kayıt, ${kapali.filter(x => x.durum === 'vazgecti').length} vazgeçti</summary>
            <div class="dd-pano iki">${DD_DURUMLAR.slice(4).map(bolum).join('')}</div></details>
    </div>`;
}

(function () {
    let st = document.createElement('style');
    st.textContent = '.dd{display:flex;flex-direction:column;gap:12px}'
        + '.dd-ust{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}.dd-baslik{font-weight:900;font-size:17px}'
        + '.dd-not{font-size:11.5px;color:var(--text-muted);line-height:1.45}'
        + '.dd-btn{min-height:36px;padding:7px 12px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);font-weight:800;font-size:12.5px;cursor:pointer}'
        + '.dd-btn.ana{background:var(--accent-orange);border-color:var(--accent-orange);color:#fff}.dd-btn.wa{border-color:rgba(37,211,102,.55);color:#25d366}'
        + '.dd-huni{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px}'
        + '.dd-huni-adim{border:1px solid var(--border-color);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:1px}'
        + '.dd-huni-adim b{font-size:24px;font-weight:900;font-variant-numeric:tabular-nums}.dd-huni-adim span{font-size:11.5px;font-weight:800;color:var(--text-muted)}.dd-huni-adim small{font-size:11px;color:var(--accent-orange);font-weight:800}'
        + '@media (max-width:640px){.dd-huni{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.dd-huni-adim{padding:7px 8px}.dd-huni-adim b{font-size:19px}.dd-huni-adim span,.dd-huni-adim small{font-size:10.5px}}'
        + '.dd-pano{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;align-items:start}.dd-pano.iki{grid-template-columns:repeat(2,minmax(0,1fr));margin-top:10px}'
        + '@media (max-width:1100px){.dd-pano{grid-template-columns:repeat(2,minmax(0,1fr))}}@media (max-width:640px){.dd-pano,.dd-pano.iki{grid-template-columns:minmax(0,1fr)}}'
        + '.dd-sutun{display:flex;flex-direction:column;gap:8px;background:rgba(127,127,127,.06);border-radius:14px;padding:10px}'
        + '.dd-sutun-bas{display:flex;justify-content:space-between;align-items:center;font-size:13px}.dd-sutun-bas span{font-weight:900;color:var(--text-muted);font-variant-numeric:tabular-nums}'
        + '.dd-bos{font-size:12px;color:var(--text-muted);text-align:center;padding:6px}'
        + '.dd-kart{background:var(--bg-panel);border:1px solid var(--border-color);border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:6px}'
        + '.dd-kart.dikkat{border-color:var(--accent-orange)}'
        + '.dd-kart-ust{display:flex;justify-content:space-between;gap:8px;align-items:baseline}.dd-kart-ust b{font-size:14px;overflow-wrap:anywhere}.dd-etiket{font-size:11px;color:var(--text-muted);white-space:nowrap}'
        + '.dd-kart-alt,.dd-kart-not{font-size:11.5px;color:var(--text-muted);overflow-wrap:anywhere}.dd-kart-not{color:var(--text-main)}'
        + '.dd-uyari{font-size:11.5px;font-weight:800;color:var(--accent-orange)}'
        + '.dd-kart-btn{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.dd-sec{min-height:36px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font-size:12px;padding:0 6px;max-width:100%}'
        + '.dd-tarih{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:800;flex-wrap:wrap}.dd-tarih input{min-height:34px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);padding:0 6px}.dd-tarih span{color:var(--accent-orange)}'
        + '.dd-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;border:1px solid var(--accent-orange);border-radius:14px;padding:12px}'
        + '@media (max-width:640px){.dd-form{grid-template-columns:minmax(0,1fr)}}'
        + '.dd-form label{display:flex;flex-direction:column;gap:4px;font-size:11.5px;font-weight:800;color:var(--text-muted)}.dd-form label span{font-weight:600}.dd-tam{grid-column:1/-1}'
        + '.dd-form input,.dd-form select,.dd-form textarea,.dd-ekle input,.dd-ekle select{min-height:38px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);padding:7px 10px;font-size:13px;font-family:inherit;box-sizing:border-box;width:100%}'
        + '.dd-form-btn{display:flex;justify-content:flex-end;gap:8px}'
        + '.dd-ekle{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.dd-ekle input{flex:1 1 140px;width:auto}.dd-ekle select{flex:0 1 120px;width:auto}'
        + '.dd-kapali summary{cursor:pointer;font-weight:800;font-size:13px;padding:6px 0}';
    document.head.appendChild(st);
})();
