/* MILO FITT KIDS — bagimsiz, kucuk istemci. Okculugun app.js/sync.js'ine hic bagli degil;
   duz fetch() + periyodik yenileme (basit senkron karari). PIN dogrulanana kadar HICBIR
   /api/milo/* veri cagrisi yapilmaz (sadece PIN dogrulama anında credentials hash'i cekilir). */

// ===== TEMA (okculukla ayni localStorage anahtari — tercih paylasilir) =====
if (localStorage.getItem('dag_sk_theme') === 'light') document.body.classList.add('light-theme');
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    localStorage.setItem('dag_sk_theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast'); if (!toast) return;
    toast.innerText = message;
    toast.style.borderLeftColor = type === 'error' ? 'var(--neon-red)' : (type === 'warning' ? 'var(--accent-orange)' : 'var(--neon-green)');
    toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 3000);
}
function miloEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function bugunISO() { return new Date().toISOString().slice(0, 10); }

// ===== PIN — okculuktakiyle ayni SHA-256/kilit deseni, tamamen ayri localStorage anahtarlari =====
let miloSifreBuffer = '';
async function miloSifreOzet(metin) {
    try {
        let buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(metin));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        let h = 5381; for (let i = 0; i < metin.length; i++) h = ((h << 5) + h + metin.charCodeAt(i)) >>> 0;
        return 'f_' + h.toString(16);
    }
}
function miloSifreDisplayGuncelle() {
    let el = document.getElementById('milo-sifre-display'); if (!el) return; let dots = '';
    for (let i = 0; i < 4; i++) dots += `<span style="display:inline-block; width:16px; height:16px; border-radius:50%; margin:0 6px; background:${i < miloSifreBuffer.length ? 'var(--neon-pink)' : 'transparent'}; border:2px solid var(--neon-pink);"></span>`;
    el.innerHTML = dots;
}
function miloSifreKilitSaniye() {
    let k = parseInt(localStorage.getItem('milo_sifre_kilit')) || 0;
    return k > Date.now() ? Math.ceil((k - Date.now()) / 1000) : 0;
}
function miloSifreYanlisDeneme() {
    let n = (parseInt(localStorage.getItem('milo_sifre_deneme')) || 0) + 1;
    if (n >= 5) {
        localStorage.setItem('milo_sifre_kilit', String(Date.now() + 60000));
        localStorage.setItem('milo_sifre_deneme', '0');
        showToast('🔒 5 yanlış deneme — 60 saniye kilitlendi', 'error');
    } else {
        localStorage.setItem('milo_sifre_deneme', String(n));
        showToast(`Hatalı PIN! (${5 - n} hak kaldı)`, 'error');
    }
}
function miloSifreSil() { miloSifreBuffer = miloSifreBuffer.slice(0, -1); miloSifreDisplayGuncelle(); }
function miloSifreTemizle() { miloSifreBuffer = ''; miloSifreDisplayGuncelle(); }

function miloSifreRakam(n) {
    if (miloSifreBuffer.length >= 4) return;
    miloSifreBuffer += n; miloSifreDisplayGuncelle();
    if (miloSifreBuffer.length === 4) setTimeout(miloGirisDene, 150);
}

async function miloGirisDene() {
    let kilit = miloSifreKilitSaniye();
    if (kilit > 0) { showToast(`🔒 Kilitli — ${kilit} sn bekle`, 'error'); miloSifreTemizle(); return; }
    let girilenOzet = await miloSifreOzet(miloSifreBuffer);
    miloSifreTemizle();
    let dogru = false;
    try {
        // PIN dogrulamasi icin TEK istisna: sadece hash degeri cekilir, hicbir uye/aidat/yoklama verisi yok.
        let res = await fetch('/api/milo/credentials');
        let data = await res.json();
        dogru = !!data.credentials && girilenOzet === data.credentials.yonetici_hash;
    } catch (e) { showToast('Sunucuya ulaşılamadı, tekrar deneyin.', 'error'); return; }

    if (dogru) {
        localStorage.setItem('milo_sifre_deneme', '0');
        miloYetkiHash = girilenOzet;
        document.getElementById('milo-giris').style.display = 'none';
        document.getElementById('milo-app').style.display = 'flex';
        miloOturumAcik = true;
        miloSekme('uyeler');
        miloPollingBaslat();
    } else {
        miloSifreYanlisDeneme();
    }
}

function miloCikisYap() {
    miloOturumAcik = false;
    miloYetkiHash = null;
    if (miloPollingId) clearInterval(miloPollingId);
    document.getElementById('milo-app').style.display = 'none';
    document.getElementById('milo-giris').style.display = 'flex';
}

function miloAyarlarAc() { document.getElementById('milo-ayarlar-modal').style.display = 'flex'; }
async function miloSifreDegistir() {
    let mevcut = (document.getElementById('milo-sfd-mevcut') || {}).value || '';
    let yeni = (document.getElementById('milo-sfd-yeni') || {}).value || '';
    if (!/^\d{4}$/.test(yeni)) return showToast('Yeni PIN 4 haneli rakam olmalı.', 'error');
    let mevcutOzet = await miloSifreOzet(mevcut);
    let res = await fetch('/api/milo/credentials'); let data = await res.json();
    if (!data.credentials || mevcutOzet !== data.credentials.yonetici_hash) return showToast('Mevcut PIN hatalı!', 'error');
    let yeniOzet = await miloSifreOzet(yeni);
    await fetch('/api/milo/credentials', {
        method: 'PUT', headers: { 'content-type': 'application/json', 'X-Dagsk-Auth': mevcutOzet },
        body: JSON.stringify({ yoneticiHash: yeniOzet, egitmenHash: yeniOzet, degisim: Date.now() }),
    });
    miloYetkiHash = yeniOzet;
    document.getElementById('milo-sfd-mevcut').value = ''; document.getElementById('milo-sfd-yeni').value = '';
    document.getElementById('milo-ayarlar-modal').style.display = 'none';
    showToast('🔑 PIN değişti.', 'success');
}

// ===== VERİ KATMANI — düz fetch(), merge/senkron motoru yok =====
// Sunucu artık yazma isteklerinde bir yetki başlığı istiyor (bkz. src/index.ts) — eskiden PIN
// sadece ekranda bir kilitti. miloGirisDene() başarılı girişte miloYetkiHash'i dolduruyor,
// miloCikisYap() temizliyor; burada TEK yerden ekleniyor, her çağrı noktasını değiştirmeye gerek yok.
let miloYetkiHash = null;
async function miloApi(path, opts) {
    let secenekler = opts ? { headers: { 'content-type': 'application/json' }, ...opts } : undefined;
    let metod = ((secenekler && secenekler.method) || 'GET').toUpperCase();
    if(metod !== 'GET' && miloYetkiHash) {
        secenekler = secenekler || {};
        secenekler.headers = Object.assign({}, secenekler.headers, { 'X-Dagsk-Auth': miloYetkiHash });
    }
    let res = await fetch('/api/milo' + path, secenekler);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
}

let miloOturumAcik = false;
let miloPollingId = null;
let miloAktifSekme = 'uyeler';
let miloUyeler = [];
let miloDuesTum = [];
let miloPersonel = [];
let miloProgram = [];
let miloDersler = [];
let miloAidatYil = new Date().getFullYear();
let miloYoklamaTarih = bugunISO();
let miloUyeAramaFiltre = '';
let miloUyeFormAcikMi = false;
let miloAidatVarsayilanTutar = parseInt(localStorage.getItem('milo_aidat_tutar') || '0') || 0;
let miloAidatAy = bugunISO().slice(0, 7);
let miloAidatAramaFiltre = '';
let miloAidatAcikAd = null;
let miloAidatAcikAy = null;
let miloAidatIstatistikAcik = false;
let miloAidatIstatistikMuafDahil = false;
let miloAidatBorcRaporuAcik = false;
let miloAidatBorcEsikAy = 2;
let miloMemberSkills = [];
let miloAttendanceTum = [];
let miloBeceriAramaFiltre = '';
let miloBeceriAcikAd = null;
let miloGunlukNot = '';
let miloYoklamaKayitlariSon = [];
let miloDevamsizlikAcik = false;
let miloDevamsizlikEsikGun = 14;
let miloDersKategoriFiltre = null;
let miloDersSeciliIdler = new Set();
let miloDersGrupNotu = '';
let miloDerslerAltGorunum = 'icerik';
let miloYasKategorileri = [];
let miloGruplar = [];
let miloSeciliYasId = null;
let miloSeciliGrupId = null;
let miloGrupDetayProgram = [];
let miloGrupAtamaAcik = false;
let miloGrupAtamaAramaFiltre = '';
let miloDersAtamaAcikId = null;
let miloDersAtamaAramaFiltre = '';
const MILO_DERS_KATEGORI_ONERI = ['Temel Cimnastik', 'Isınma', 'Kondisyon', 'Denge', 'Esneklik', 'Güç', 'Yuvarlanma', 'Takla', 'Amut', 'Sıçrama', 'Dönüş', 'Oyun-Temelli', 'Koordinasyon'];
const MILO_SEVIYE_ETIKET = { baslangic: 'Başlangıç', gelisen: 'Gelişen', ileri: 'İleri' };
function miloJsEsc(s) { return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }

function miloPollingBaslat() {
    if (miloPollingId) clearInterval(miloPollingId);
    miloPollingId = setInterval(() => { if (miloOturumAcik && !miloUyeFormAcikMi) miloSekmeYenile(); }, 15000);
}

function miloYasHesapla(dogumTarihi) {
    if (!dogumTarihi) return null;
    let d = new Date(dogumTarihi + 'T00:00:00'); if (isNaN(d.getTime())) return null;
    let simdi = new Date(); let yas = simdi.getFullYear() - d.getFullYear();
    let ayFark = simdi.getMonth() - d.getMonth();
    if (ayFark < 0 || (ayFark === 0 && simdi.getDate() < d.getDate())) yas--;
    return yas;
}

function miloSekme(k) {
    miloAktifSekme = k;
    [...document.querySelectorAll('#milo-tab-bar button')].forEach((b, i) => {
        let keys = ['uyeler', 'aidat', 'yoklama', 'personel', 'program', 'ders', 'beceri'];
        b.classList.toggle('aktif', keys[i] === k);
    });
    miloSekmeYenile();
}

async function miloSekmeYenile() {
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    try {
        if (miloAktifSekme === 'uyeler') { miloUyeler = (await miloApi('/members')).members; miloUyelerCiz(); }
        else if (miloAktifSekme === 'aidat') {
            if (!miloUyeler.length) miloUyeler = (await miloApi('/members')).members;
            miloDuesTum = (await miloApi('/dues')).dues; miloAidatCiz();
        } else if (miloAktifSekme === 'yoklama') {
            if (!miloUyeler.length) miloUyeler = (await miloApi('/members')).members;
            let att = (await miloApi('/attendance/auto?tarih=' + encodeURIComponent(miloYoklamaTarih))).attendance;
            miloGunlukNot = (await miloApi('/gunluk-not/' + encodeURIComponent(miloYoklamaTarih))).notMetin || '';
            miloYoklamaCiz(att);
        } else if (miloAktifSekme === 'personel') { miloPersonel = (await miloApi('/personnel')).personnel; miloPersonelCiz(); }
        else if (miloAktifSekme === 'program') { miloProgram = (await miloApi('/antrenman-programi')).slots; miloProgramCiz(); }
        else if (miloAktifSekme === 'ders') {
            miloDersler = (await miloApi('/ders-icerikleri')).dersler;
            if (!miloUyeler.length) miloUyeler = (await miloApi('/members')).members;
            miloMemberSkills = (await miloApi('/member-skills')).skills;
            miloYasKategorileri = (await miloApi('/yas-kategorileri')).yasKategorileri;
            miloGruplar = (await miloApi('/gruplar')).gruplar;
            miloDerslerCiz();
        }
        else if (miloAktifSekme === 'beceri') {
            if (!miloUyeler.length) miloUyeler = (await miloApi('/members')).members;
            if (!miloDersler.length) miloDersler = (await miloApi('/ders-icerikleri')).dersler;
            miloMemberSkills = (await miloApi('/member-skills')).skills;
            miloAttendanceTum = (await miloApi('/attendance/auto')).attendance;
            miloBeceriCiz();
        }
    } catch (e) { showToast('Veri yüklenemedi, bağlantıyı kontrol edin.', 'error'); }
}

// ===== ÜYELER =====
function miloUyelerCiz() {
    let alan = document.getElementById('milo-icerik');
    let filtre = miloUyeAramaFiltre.trim().toLocaleLowerCase('tr');
    let liste = miloUyeler.filter(u => !filtre || u.ad.toLocaleLowerCase('tr').includes(filtre));
    let gruplar = [...new Set(miloUyeler.map(u => u.grup))].sort();
    alan.innerHTML = `
        <input class="milo-input" placeholder="🔍 Üye ara..." value="${miloEsc(miloUyeAramaFiltre)}" oninput="miloUyeAramaFiltre=this.value; miloUyelerCiz();">
        <button class="milo-btn-full" style="margin-bottom:10px;" onclick="miloUyeFormAc()">➕ Yeni Üye Ekle</button>
        <div id="milo-uye-form-alani"></div>
        <div style="font-size:12px; color:var(--text-muted); margin:6px 0;">${liste.length} üye</div>
        ${liste.map(u => {
            let yas = miloYasHesapla(u.dogumTarihi);
            return `<div class="milo-card">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                    <div>
                        <b>${miloEsc(u.ad)}</b> <span style="color:var(--text-muted); font-size:12px;">· ${miloEsc(u.grup)}</span>
                        ${yas !== null ? `<span style="color:var(--text-muted); font-size:12px;"> · 🎂 ${yas} yaş</span>` : ''}
                        ${u.pasif ? ' <span style="color:var(--neon-red); font-size:11px; font-weight:bold;">DONDURULDU</span>' : ''}
                        ${u.aidatMuaf ? ' <span style="color:#8b5cf6; font-size:11px; font-weight:bold;">🎗️ MUAF</span>' : ''}
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button onclick="miloProfilAc('${miloJsEsc(u.grup)}','${miloJsEsc(u.ad)}')" style="background:rgba(59,130,246,0.12); border:1px solid var(--neon-blue); color:var(--neon-blue); border-radius:6px; padding:5px 10px; font-size:11px; font-weight:bold;">📋 Profil</button>
                        <button onclick="miloUyeFormAc('${miloEsc(u.grup)}','${miloEsc(u.ad)}')" style="background:var(--bg-main); border:1px solid var(--border-color); color:var(--text-main); border-radius:6px; padding:5px 10px; font-size:11px; font-weight:bold;">✏️ Düzenle</button>
                        <button onclick="miloUyeSil('${miloEsc(u.grup)}','${miloEsc(u.ad)}')" style="background:var(--neon-red); border:none; color:#fff; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:bold;">🗑️</button>
                    </div>
                </div>
            </div>`;
        }).join('') || '<div style="color:var(--text-muted); font-size:13px;">Henüz üye yok.</div>'}
        <datalist id="milo-grup-list">${gruplar.map(g => `<option value="${miloEsc(g)}">`).join('')}</datalist>
    `;
}

function miloUyeFormAc(grup, ad) {
    miloUyeFormAcikMi = true;
    let u = (grup && ad) ? miloUyeler.find(x => x.grup === grup && x.ad === ad) : null;
    let alan = document.getElementById('milo-uye-form-alani');
    alan.innerHTML = `
        <div class="milo-card" style="border-color:var(--neon-pink);">
            <div style="font-weight:900; color:var(--neon-pink); margin-bottom:8px;">${u ? '✏️ Üyeyi Düzenle' : '➕ Yeni Üye'}</div>
            <input class="milo-input" id="milo-uf-ad" placeholder="Ad Soyad" value="${miloEsc(u ? u.ad : '')}" ${u ? 'disabled' : ''}>
            <input class="milo-input" id="milo-uf-grup" list="milo-grup-list" placeholder="Grup / Seviye (örn: Başlangıç)" value="${miloEsc(u ? u.grup : '')}">
            <div style="display:flex; gap:6px; margin-bottom:8px;">
                <button type="button" id="milo-uf-kiz" onclick="miloUfCinsiyet('K')" style="flex:1; padding:9px; border-radius:8px; font-weight:800; font-size:12px; cursor:pointer; border:1px solid #ec4899; background:${(u ? u.cinsiyet : 'K') === 'K' ? 'rgba(236,72,153,0.15)' : 'var(--bg-panel)'}; color:#ec4899;">👧 Kız</button>
                <button type="button" id="milo-uf-erkek" onclick="miloUfCinsiyet('E')" style="flex:1; padding:9px; border-radius:8px; font-weight:800; font-size:12px; cursor:pointer; border:1px solid var(--neon-blue); background:${(u ? u.cinsiyet : '') === 'E' ? 'rgba(59,130,246,0.15)' : 'var(--bg-panel)'}; color:var(--neon-blue);">👦 Erkek</button>
            </div>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">🎂 Doğum Tarihi</div>
            <input type="date" class="milo-input" id="milo-uf-dogum" max="${bugunISO()}" value="${miloEsc(u ? u.dogumTarihi || '' : '')}">
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">📅 Katıldığı Tarih</div>
            <input type="date" class="milo-input" id="milo-uf-katilma" max="${bugunISO()}" value="${miloEsc(u ? u.katilmaTarihi || '' : (u ? '' : bugunISO()))}">
            <input class="milo-input" id="milo-uf-aileMeslek" placeholder="Aile iş/meslek" value="${miloEsc(u ? u.aileMeslek || '' : '')}">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                <input class="milo-input" id="milo-uf-acilKisi" placeholder="Acil durum kişi" value="${miloEsc(u ? u.acilKisi || '' : '')}">
                <input class="milo-input" id="milo-uf-acilTelefon" placeholder="Acil durum telefon" value="${miloEsc(u ? u.acilTelefon || '' : '')}">
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
                <input type="number" class="milo-input" id="milo-uf-boy" placeholder="Boy (cm)" value="${u && u.boy != null ? u.boy : ''}">
                <input type="number" step="0.1" class="milo-input" id="milo-uf-kilo" placeholder="Kilo (kg)" value="${u && u.kilo != null ? u.kilo : ''}">
            </div>
            <input class="milo-input" id="milo-uf-antrenmanNotu" placeholder="Antrenman günü/saati notu" value="${miloEsc(u ? u.antrenmanNotu || '' : '')}">
            <textarea class="milo-input" id="milo-uf-genelNot" placeholder="Genel not" style="min-height:50px;">${miloEsc(u ? u.genelNot || '' : '')}</textarea>
            <textarea class="milo-input" id="milo-uf-saglikNotu" placeholder="🏥 Sağlık / özel durum notu (varsa: alerji, astım vb.)" style="min-height:40px; border-color:var(--neon-red);">${miloEsc(u ? u.saglikNotu || '' : '')}</textarea>
            ${u ? `<label style="display:flex; align-items:center; gap:8px; font-size:12px; margin-bottom:8px;"><input type="checkbox" id="milo-uf-pasif" ${u.pasif ? 'checked' : ''}> Dondurulmuş (pasif)</label>
                   <label style="display:flex; align-items:center; gap:8px; font-size:12px; margin-bottom:8px;"><input type="checkbox" id="milo-uf-muaf" ${u.aidatMuaf ? 'checked' : ''}> 🎗️ Aidattan Muaf</label>` : ''}
            <div style="display:flex; gap:8px;">
                <button class="milo-btn-full" onclick="miloUyeKaydet(${u ? `'${miloEsc(u.grup)}','${miloEsc(u.ad)}'` : ''})">✅ Kaydet</button>
                <button onclick="miloUyeFormKapat()" style="flex:1; background:var(--bg-panel); border:1px solid var(--border-color); color:var(--text-main); border-radius:10px; font-weight:bold;">İptal</button>
            </div>
        </div>`;
    if (!u) miloUfCinsiyet('K');
    alan.scrollIntoView({ behavior: 'smooth' });
}
function miloUfCinsiyet(c) {
    let kiz = document.getElementById('milo-uf-kiz'), erkek = document.getElementById('milo-uf-erkek');
    if (kiz) { kiz.dataset.sec = c === 'K' ? '1' : ''; kiz.style.background = c === 'K' ? 'rgba(236,72,153,0.15)' : 'var(--bg-panel)'; }
    if (erkek) { erkek.dataset.sec = c === 'E' ? '1' : ''; erkek.style.background = c === 'E' ? 'rgba(59,130,246,0.15)' : 'var(--bg-panel)'; }
    let form = document.getElementById('milo-uf-grup'); if (form) form.dataset.cinsiyet = c;
}
function miloUyeFormKapat() { miloUyeFormAcikMi = false; document.getElementById('milo-uye-form-alani').innerHTML = ''; }

async function miloUyeKaydet(eskiGrup, eskiAd) {
    let ad = (document.getElementById('milo-uf-ad').value || '').trim().toUpperCase();
    let grup = (document.getElementById('milo-uf-grup').value || '').trim();
    if (!ad || !grup) return showToast('Ad ve grup zorunlu.', 'error');
    let cinsiyet = (document.getElementById('milo-uf-grup').dataset.cinsiyet) || (document.getElementById('milo-uf-kiz').dataset.sec ? 'K' : 'E');
    let dogumTarihi = document.getElementById('milo-uf-dogum').value || null;
    let katilmaTarihi = document.getElementById('milo-uf-katilma').value || null;
    let aileMeslek = document.getElementById('milo-uf-aileMeslek').value || null;
    let acilKisi = document.getElementById('milo-uf-acilKisi').value || null;
    let acilTelefon = document.getElementById('milo-uf-acilTelefon').value || null;
    let antrenmanNotu = document.getElementById('milo-uf-antrenmanNotu').value || null;
    let genelNot = document.getElementById('milo-uf-genelNot').value || null;
    let boy = parseInt(document.getElementById('milo-uf-boy').value) || null;
    let kilo = parseFloat(document.getElementById('milo-uf-kilo').value) || null;
    let saglikNotu = document.getElementById('milo-uf-saglikNotu').value || null;

    if (eskiGrup && eskiAd) {
        let fields = { grup, sinif: null, cinsiyet, dogumTarihi, katilmaTarihi, aileMeslek, acilKisi, acilTelefon, antrenmanNotu, genelNot, boy, kilo, saglikNotu };
        let pasifEl = document.getElementById('milo-uf-pasif'); if (pasifEl) fields.pasif = pasifEl.checked ? 1 : 0;
        let muafEl = document.getElementById('milo-uf-muaf'); if (muafEl) fields.aidatMuaf = muafEl.checked ? 1 : 0;
        if (grup !== eskiGrup) {
            // basit senkron: grup degisimi upsert+delete olarak uygulanir (offline kuyruk yok, tek adimda)
            await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup, ad, cinsiyet, dogumTarihi, katilmaTarihi, aileMeslek, acilKisi, acilTelefon, antrenmanNotu, genelNot, boy, kilo, saglikNotu }) });
            await miloApi(`/members/${encodeURIComponent(eskiGrup)}/${encodeURIComponent(eskiAd)}`, { method: 'DELETE' });
        } else {
            await miloApi(`/members/${encodeURIComponent(eskiGrup)}/${encodeURIComponent(eskiAd)}`, { method: 'PATCH', body: JSON.stringify(fields) });
        }
    } else {
        if (miloUyeler.some(u => u.grup === grup && u.ad === ad)) return showToast(`${ad} zaten ${grup} grubunda kayıtlı.`, 'warning');
        await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup, ad, cinsiyet, dogumTarihi, katilmaTarihi, aileMeslek, acilKisi, acilTelefon, antrenmanNotu, genelNot, boy, kilo, saglikNotu }) });
    }
    showToast('✅ Kaydedildi.', 'success');
    miloUyeFormKapat();
    miloUyeler = (await miloApi('/members')).members;
    miloUyelerCiz();
}

async function miloUyeSil(grup, ad) {
    if (!confirm(`${ad} silinsin mi? Bu işlem geri alınamaz.`)) return;
    await miloApi(`/members/${encodeURIComponent(grup)}/${encodeURIComponent(ad)}`, { method: 'DELETE' });
    miloUyeler = miloUyeler.filter(u => !(u.grup === grup && u.ad === ad));
    miloUyelerCiz();
    showToast('Silindi.', 'success');
}

// ===== ÖĞRENCİ PROFİLİ / TANIMA-ANALİZ EKRANI — Üyeler kartına eklenen tek buton, salt-okunur,
// mevcut veriden (member + member-skills) derlenir, yeni backend uç noktası gerektirmez. =====
async function miloProfilAc(grup, ad) {
    let u = miloUyeler.find(x => x.grup === grup && x.ad === ad); if (!u) return;
    if (!miloAttendanceTum.length) miloAttendanceTum = (await miloApi('/attendance/auto')).attendance;
    let skills = (await miloApi('/member-skills?ad=' + encodeURIComponent(ad))).skills;
    miloProfilCiz(u, skills);
    document.getElementById('milo-profil-modal').style.display = 'flex';
}

function miloProfilKapat() { document.getElementById('milo-profil-modal').style.display = 'none'; }

function miloProfilCiz(u, skills) {
    let alan = document.getElementById('milo-profil-icerik');
    let yas = miloYasHesapla(u.dogumTarihi);
    let ogrenilen = skills.filter(s => s.durum === 'ogrendi');
    let gelisen = skills.filter(s => s.durum === 'gelisiyor');
    let seviye = miloSeviyeHesapla(ogrenilen.length);
    let rozetler = miloRozetleriHesapla(ogrenilen.length, seviye);
    let devamSayisi = miloDevamSayisiHesapla(u);
    let tarihFormat = (t) => t ? new Date(t).toLocaleDateString('tr-TR') : '-';

    alan.innerHTML = `
        <div style="text-align:center; margin-bottom:14px;">
            <div style="font-size:20px; font-weight:900;">${miloEsc(u.ad)}</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">${miloEsc(u.grup)}${yas !== null ? ' · ' + yas + ' yaş' : ''}</div>
            <div style="margin-top:8px; display:inline-block; font-size:12px; font-weight:800; padding:4px 12px; border-radius:20px; background:rgba(236,72,153,0.12); border:1px solid var(--neon-pink); color:var(--neon-pink);">${seviye}</div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:12px;">
            <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center;"><div style="font-size:16px; font-weight:800;">${u.boy != null ? u.boy : '-'}</div><div style="font-size:9px; color:var(--text-muted);">Boy (cm)</div></div>
            <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center;"><div style="font-size:16px; font-weight:800;">${u.kilo != null ? u.kilo : '-'}</div><div style="font-size:9px; color:var(--text-muted);">Kilo (kg)</div></div>
            <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center;"><div style="font-size:16px; font-weight:800; color:var(--neon-green);">${devamSayisi}</div><div style="font-size:9px; color:var(--text-muted);">Devam</div></div>
        </div>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:10px;">📅 Katıldığı tarih: ${miloEsc(u.katilmaTarihi ? u.katilmaTarihi.split('-').reverse().join('.') : '-')}</div>
        ${u.saglikNotu ? `<div style="background:rgba(239,68,68,0.1); border:1px solid var(--neon-red); border-radius:10px; padding:10px; margin-bottom:10px;"><b style="color:var(--neon-red); font-size:12px;">🏥 Sağlık / Özel Durum:</b><div style="font-size:12px; margin-top:4px;">${miloEsc(u.saglikNotu)}</div></div>` : ''}
        <div style="font-size:12px; margin-bottom:10px;"><b>İletişim:</b> ${miloEsc(u.acilKisi || '-')} ${u.acilTelefon ? '· 📞 ' + miloEsc(u.acilTelefon) : ''}${u.aileMeslek ? ' · ' + miloEsc(u.aileMeslek) : ''}</div>
        ${rozetler.length ? `<div style="margin-bottom:10px;"><b style="font-size:12px;">🏅 Rozetler:</b><div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">${rozetler.map(r => `<span style="background:rgba(234,179,8,0.12); border:1px solid var(--gold); border-radius:20px; padding:4px 10px; font-size:11px; font-weight:700;">${r}</span>`).join('')}</div></div>` : ''}
        <div style="font-weight:800; color:var(--neon-green); font-size:12px; margin-bottom:6px;">✅ Öğrendiği Beceriler (${ogrenilen.length})</div>
        ${ogrenilen.length ? ogrenilen.map(s => `<div style="font-size:12px; padding:4px 0; border-bottom:1px solid var(--border-color);">${miloEsc(s.baslik)} <span style="color:var(--text-muted); font-size:10px;">— ${tarihFormat(s.guncelleme)}</span></div>`).join('') : '<div style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">Henüz yok.</div>'}
        <div style="font-weight:800; color:var(--gold); font-size:12px; margin:10px 0 6px;">🌱 Gelişmekte Olan Beceriler (${gelisen.length})</div>
        ${gelisen.length ? gelisen.map(s => `<div style="font-size:12px; padding:4px 0; border-bottom:1px solid var(--border-color);">${miloEsc(s.baslik)}</div>`).join('') : '<div style="font-size:11px; color:var(--text-muted); margin-bottom:8px;">Yok.</div>'}
        ${u.genelNot ? `<div style="margin-top:10px;"><b style="font-size:12px;">📝 Genel Not:</b><div style="font-size:12px; margin-top:4px;">${miloEsc(u.genelNot)}</div></div>` : ''}
    `;
}

// ===== AİDAT =====
const MILO_AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function miloAidatDuesKayit(ad, ay) { return miloDuesTum.find(d => d.ad === ad && d.ay === ay) || null; }
function miloAidatAyToplamHesapla(ayStr) { return miloDuesTum.filter(d => d.ay === ayStr && d.odendi).reduce((a, d) => a + (d.tutar || 0), 0); }
function miloAidatAyStrOfset(ofset) {
    let simdi = new Date();
    let d = new Date(simdi.getFullYear(), simdi.getMonth() + ofset, 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}
function miloAidatSonBilinenTutar(ad) {
    let kayitlar = miloDuesTum.filter(d => d.ad === ad && d.odendi && d.tutar);
    if (!kayitlar.length) return miloAidatVarsayilanTutar;
    kayitlar.sort((a, b) => (b.tarih || '').localeCompare(a.tarih || ''));
    return kayitlar[0].tutar || miloAidatVarsayilanTutar;
}
function miloAidatTutarDegis(d) {
    miloAidatVarsayilanTutar = parseInt(d) || 0;
    try { localStorage.setItem('milo_aidat_tutar', String(miloAidatVarsayilanTutar)); } catch (e) {}
}

function miloAidatKartHTML(u) {
    let ad = u.ad, grup = u.grup;
    let aylikChipler = [];
    for (let ay = 1; ay <= 12; ay++) {
        let ayStr = `${miloAidatYil}-${String(ay).padStart(2, '0')}`;
        let rec = miloAidatDuesKayit(ad, ayStr);
        let odendi = rec && rec.odendi;
        let notVar = rec && rec.notMetin;
        let renk = odendi ? 'var(--neon-green)' : (notVar ? 'var(--gold)' : 'var(--border-color)');
        let bg = odendi ? 'rgba(16,185,129,0.12)' : (notVar ? 'rgba(234,179,8,0.12)' : 'var(--bg-panel)');
        let acik = miloAidatAcikAd === ad && miloAidatAcikAy === ayStr;
        let odemeTarihiIpucu = (odendi && rec.odemeTarihi) ? ' — ödendi: ' + rec.odemeTarihi : '';
        aylikChipler.push(`<div onclick="miloAidatAyDuzenleAc('${miloJsEsc(ad)}','${ayStr}')" title="${miloEsc(MILO_AY_KISA[ay - 1] + ' ' + miloAidatYil + (notVar ? ' — ' + notVar : '') + odemeTarihiIpucu)}" style="flex:0 0 auto; min-width:50px; padding:6px 3px; border-radius:8px; border:1px solid ${acik ? 'var(--neon-blue)' : renk}; background:${bg}; text-align:center; cursor:pointer;">
            <div style="font-size:10px; font-weight:700; color:var(--text-muted);">${MILO_AY_KISA[ay - 1]}</div>
            <div style="font-size:11px; font-weight:800;">${odendi ? (rec.tutar || 0) + '₺' : (notVar ? '📝' : '-')}</div>
        </div>`);
    }
    let yas = miloYasHesapla(u.dogumTarihi);
    let acikMi = miloAidatAcikAd === ad;
    return `<details class="milo-card" style="${u.aidatMuaf ? 'opacity:0.85; border-color:#8b5cf6;' : ''}" ${acikMi ? 'open' : ''}>
        <summary style="cursor:pointer; list-style:none; display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="font-weight:700; font-size:13px;">${miloEsc(ad)} <span style="color:var(--text-muted); font-size:11px; font-weight:400;">· ${miloEsc(grup)}</span>${yas !== null ? ` <span style="color:var(--text-muted); font-size:11px; font-weight:400;">(${yas} yaş)</span>` : ''}</span>
            <span onclick="event.preventDefault(); event.stopPropagation(); miloAidatMuafToggle('${miloJsEsc(grup)}','${miloJsEsc(ad)}', ${u.aidatMuaf ? 'false' : 'true'});" style="cursor:pointer; font-size:10px; font-weight:800; padding:3px 8px; border-radius:6px; white-space:nowrap; background:${u.aidatMuaf ? '#8b5cf622' : 'var(--bg-panel)'}; border:1px solid ${u.aidatMuaf ? '#8b5cf6' : 'var(--border-color)'}; color:${u.aidatMuaf ? '#a78bfa' : 'var(--text-muted)'};">🎗️ ${u.aidatMuaf ? 'Muaf' : 'Muaf İşaretle'}</span>
        </summary>
        <div style="margin-top:10px;">
            <div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:6px;">${aylikChipler.join('')}</div>
            ${miloAidatAcikAd === ad && miloAidatAcikAy ? miloAidatAyDuzenleFormHTML(ad, miloAidatAcikAy) : ''}
        </div>
    </details>`;
}

async function miloAidatMuafToggle(grup, ad, checked) {
    await miloApi(`/members/${encodeURIComponent(grup)}/${encodeURIComponent(ad)}`, { method: 'PATCH', body: JSON.stringify({ aidatMuaf: checked ? 1 : 0 }) });
    let u = miloUyeler.find(x => x.grup === grup && x.ad === ad); if (u) u.aidatMuaf = checked;
    miloAidatCiz();
}

function miloAidatAyDuzenleFormHTML(ad, ay) {
    let rec = miloAidatDuesKayit(ad, ay) || {};
    return `<div style="background:rgba(236,72,153,0.08); border:1px solid var(--neon-pink); border-radius:10px; padding:10px; margin-top:6px;">
        <div style="font-weight:700; font-size:12px; margin-bottom:6px;">${miloEsc(ay)} düzenle</div>
        <div style="display:flex; gap:6px; margin-bottom:6px; align-items:center;">
            <input type="number" id="milo-aidat-tutar" value="${rec.tutar || ''}" placeholder="Tutar ₺" oninput="if(this.value && parseInt(this.value)>0) document.getElementById('milo-aidat-odendi').checked = true;" style="flex:1; padding:8px; background:var(--bg-main); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px;">
            <label style="display:flex; align-items:center; gap:4px; font-size:11px; font-weight:800; white-space:nowrap; cursor:pointer; background:rgba(16,185,129,0.1); border:1px solid var(--neon-green); border-radius:8px; padding:8px 10px;"><input type="checkbox" id="milo-aidat-odendi" ${rec.odendi ? 'checked' : ''}> ✅ Ödendi</label>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:3px;">💰 Ödendiği Tarih:</div>
        <input type="date" id="milo-aidat-odemeTarihi" max="${bugunISO()}" value="${rec.odemeTarihi || bugunISO()}" style="width:100%; box-sizing:border-box; padding:8px; margin-bottom:8px; background:var(--bg-main); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px;">
        <input type="text" id="milo-aidat-not" value="${miloEsc(rec.notMetin || '')}" placeholder="Not (ör. ara verecek...)" style="width:100%; box-sizing:border-box; padding:8px; margin-bottom:8px; background:var(--bg-main); color:var(--text-main); border:1px solid var(--border-color); border-radius:8px;">
        <div style="display:flex; gap:6px;">
            <button onclick="miloAidatAySave('${miloJsEsc(ad)}','${ay}')" style="flex:1; background:var(--neon-green); color:#fff; border:none; padding:9px; border-radius:8px; font-weight:700; font-size:12px; cursor:pointer;">Kaydet</button>
            <button onclick="miloAidatAyTemizle('${miloJsEsc(ad)}','${ay}')" style="flex:1; background:rgba(239,68,68,0.12); color:var(--neon-red); border:1px solid var(--neon-red); padding:9px; border-radius:8px; font-weight:700; font-size:12px; cursor:pointer;">Temizle</button>
            <button onclick="miloAidatAcikAd=null; miloAidatAcikAy=null; miloAidatCiz();" style="flex:1; background:var(--bg-panel); border:1px solid var(--border-color); color:var(--text-main); padding:9px; border-radius:8px; font-weight:700; font-size:12px; cursor:pointer;">Kapat</button>
        </div>
    </div>`;
}

function miloAidatAyDuzenleAc(ad, ay) {
    miloAidatAcikAd = ad; miloAidatAcikAy = ay;
    miloAidatCiz();
    setTimeout(() => { let el = document.getElementById('milo-aidat-tutar'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
}

async function miloAidatAySave(ad, ay) {
    let tutar = parseInt(document.getElementById('milo-aidat-tutar').value) || null;
    let odendi = document.getElementById('milo-aidat-odendi').checked;
    let odemeTarihi = document.getElementById('milo-aidat-odemeTarihi').value || null;
    let notMetin = document.getElementById('milo-aidat-not').value || null;
    if (odemeTarihi && odemeTarihi > bugunISO()) return showToast('Ödeme tarihi gelecekte olamaz.', 'error');
    if (tutar && !odendi) {
        if (!confirm(`Tutar (${tutar}₺) girdiniz ama "✅ Ödendi" kutusu işaretli değil.\n\nBu şekilde kaydedilirse bu ay ÖDENMEMİŞ sayılır, gelir raporlarına ve istatistiklere dahil edilmez.\n\nGerçekten ödendiyse İptal'e basıp kutucuğu işaretleyin.\n\nYine de böyle (ödenmemiş) kaydetmek istiyor musunuz?`)) return;
    }
    await miloApi(`/dues/${encodeURIComponent(ad)}/${encodeURIComponent(ay)}`, {
        method: 'PUT', body: JSON.stringify({ odendi, tutar, tarih: bugunISO(), notMetin, odemeTarihi }),
    });
    miloAidatAcikAd = null; miloAidatAcikAy = null;
    miloDuesTum = (await miloApi('/dues')).dues;
    miloAidatCiz();
    showToast('✅ Kaydedildi.', 'success');
}

async function miloAidatAyTemizle(ad, ay) {
    await miloApi(`/dues/${encodeURIComponent(ad)}/${encodeURIComponent(ay)}`, {
        method: 'PUT', body: JSON.stringify({ odendi: false, tutar: null, notMetin: null, odemeTarihi: null, tarih: bugunISO() }),
    });
    miloAidatAcikAd = null; miloAidatAcikAy = null;
    miloDuesTum = (await miloApi('/dues')).dues;
    miloAidatCiz();
    showToast('Temizlendi.', 'success');
}

function miloAidatCiz() {
    let alan = document.getElementById('milo-icerik');
    let aramaNorm = miloAidatAramaFiltre.trim().toLocaleLowerCase('tr');
    let isimler = miloUyeler.filter(u => !u.pasif && (!aramaNorm || u.ad.toLocaleLowerCase('tr').includes(aramaNorm)));
    let odemeBekleneler = isimler.filter(u => !u.aidatMuaf);
    let odeyen = 0, toplam = 0;
    isimler.forEach(u => { let rec = miloAidatDuesKayit(u.ad, miloAidatAy); if (rec && rec.odendi) { odeyen++; toplam += (rec.tutar || 0); } });
    let beklenen = odemeBekleneler.length * miloAidatVarsayilanTutar;
    let kartlar = isimler.map(u => miloAidatKartHTML(u)).join('');

    alan.innerHTML = `
        <input class="milo-input" id="milo-aidat-arama" placeholder="🔍 Üye ara..." value="${miloEsc(miloAidatAramaFiltre)}" oninput="miloAidatAramaFiltre=this.value; miloAidatCiz(); let el=document.getElementById('milo-aidat-arama'); if(el){el.focus(); el.setSelectionRange(el.value.length,el.value.length);}">
        <div style="display:flex; gap:8px; margin-bottom:10px;">
            <input type="month" class="milo-input" style="margin-bottom:0; flex:1;" value="${miloAidatAy}" onchange="miloAidatAy=this.value; miloAidatCiz();">
            <input type="number" class="milo-input" style="margin-bottom:0; width:110px;" value="${miloAidatVarsayilanTutar || ''}" placeholder="Aidat ₺" oninput="miloAidatTutarDegis(this.value)">
        </div>
        <div style="display:flex; gap:8px; margin-bottom:12px;">
            <div style="flex:1; background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center;"><div style="font-size:17px; font-weight:800; color:var(--neon-green);">${toplam}₺</div><div style="font-size:10px; color:var(--text-muted);">Toplanan (${miloAidatAy})</div></div>
            <div style="flex:1; background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center;"><div style="font-size:17px; font-weight:800; color:var(--accent-orange);">${odeyen}/${odemeBekleneler.length}</div><div style="font-size:10px; color:var(--text-muted);">Ödeyen</div></div>
            <div style="flex:1; background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center;"><div style="font-size:17px; font-weight:800; color:var(--neon-blue);">${beklenen}₺</div><div style="font-size:10px; color:var(--text-muted);">Beklenen</div></div>
        </div>
        <button onclick="miloAidatIstatistikToggle()" style="width:100%; margin-bottom:10px; background:rgba(236,72,153,0.12); color:var(--neon-pink); border:1px solid var(--neon-pink); padding:11px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer;">${miloAidatIstatistikAcik ? '✕ İstatistikleri Kapat' : '📊 Gelir İstatistikleri'}</button>
        <div id="milo-aidat-istatistik-alani"></div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <button onclick="miloAidatYil--; miloAidatCiz();" style="background:var(--bg-panel); border:1px solid var(--border-color); color:var(--text-main); width:32px; height:32px; border-radius:8px; cursor:pointer; font-weight:800;">‹</button>
            <div style="flex:1; text-align:center; font-weight:800; font-size:13px;">${miloAidatYil} Ay Tablosu</div>
            <button onclick="miloAidatYil++; miloAidatCiz();" style="background:var(--bg-panel); border:1px solid var(--border-color); color:var(--text-main); width:32px; height:32px; border-radius:8px; cursor:pointer; font-weight:800;">›</button>
        </div>
        <div style="max-height:480px; overflow-y:auto;">${kartlar || '<div style="color:var(--text-muted); font-size:12px;">Üye yok.</div>'}</div>
        <div style="display:flex; gap:8px; margin-top:12px;">
            <button onclick="miloAidatGelirRaporu()" style="flex:1; background:var(--neon-pink); color:#fff; border:none; padding:11px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer;">📄 Gelir Raporu</button>
            <button onclick="miloAidatBorcRaporuToggle()" style="flex:1; background:rgba(239,68,68,0.12); color:var(--neon-red); border:1px solid var(--neon-red); padding:11px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer;">${miloAidatBorcRaporuAcik ? '✕ Borç Raporunu Kapat' : '⚠️ Borç Raporu'}</button>
        </div>
        <div id="milo-aidat-borc-raporu-alani" style="margin-top:12px;"></div>
    `;
    if (miloAidatIstatistikAcik) miloAidatIstatistikCiz();
    if (miloAidatBorcRaporuAcik) miloAidatBorcRaporuCiz();
}

// ===== AİDAT — GELİR İSTATİSTİKLERİ =====
function miloAidatGrupIstatistikleriHesapla(buAyStr, muafDahil) {
    let gruplar = [...new Set(miloUyeler.map(u => u.grup))];
    return gruplar.map(g => {
        let aktifler = miloUyeler.filter(u => u.grup === g && !u.pasif && (muafDahil || !u.aidatMuaf));
        let yaslar = aktifler.map(u => miloYasHesapla(u.dogumTarihi)).filter(y => y !== null);
        let ortYas = yaslar.length ? Math.round(yaslar.reduce((a, b) => a + b, 0) / yaslar.length) : null;
        let odeyen = aktifler.filter(u => { let r = miloAidatDuesKayit(u.ad, buAyStr); return r && r.odendi; }).length;
        let tahsilat = aktifler.length ? Math.round((odeyen / aktifler.length) * 100) : 0;
        return { g, sayi: aktifler.length, ortYas, tahsilat, odeyen };
    });
}

function miloAidatSporcuOdemeDokumu() {
    let liste = [];
    miloUyeler.forEach(u => {
        if (u.pasif) return;
        let tumKayitlar = miloDuesTum.filter(d => d.ad === u.ad);
        let kayitlar = tumKayitlar.filter(r => r.odendi);
        let toplamOdenen = kayitlar.reduce((a, r) => a + (r.tutar || 0), 0);
        let sirali = kayitlar.slice().sort((a, b) => (b.odemeTarihi || b.tarih || b.ay || '').localeCompare(a.odemeTarihi || a.tarih || a.ay || ''));
        let son = sirali[0] || null;
        let notlar = tumKayitlar.filter(r => r.notMetin).sort((a, b) => a.ay.localeCompare(b.ay)).map(r => `${r.notMetin} (${r.ay})`);
        liste.push({
            grup: u.grup, ad: u.ad, toplamOdenen, odemeSayisi: kayitlar.length,
            sonOdemeTarihi: son ? (son.odemeTarihi || son.tarih || null) : null,
            sonOdemeAy: son ? son.ay : null,
            muaf: !!u.aidatMuaf, dogumTarihi: u.dogumTarihi || null, yas: miloYasHesapla(u.dogumTarihi),
            notlar,
        });
    });
    return liste.sort((a, b) => b.toplamOdenen - a.toplamOdenen);
}

function miloAidatIstatistikToggle() { miloAidatIstatistikAcik = !miloAidatIstatistikAcik; miloAidatCiz(); }

function miloSparklineSVG(degerler, renk) {
    renk = renk || 'var(--neon-pink)';
    let w = 90, h = 26, pad = 2;
    if (!degerler || !degerler.length || degerler.every(v => v === 0)) return `<svg width="${w}" height="${h}"></svg>`;
    let maks = Math.max(...degerler, 1);
    let step = degerler.length > 1 ? (w - pad * 2) / (degerler.length - 1) : 0;
    let pts = degerler.map((v, i) => `${(pad + i * step).toFixed(1)},${(h - pad - (v / maks) * (h - pad * 2)).toFixed(1)}`).join(' ');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><polyline points="${pts}" fill="none" stroke="${renk}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function miloAidatIstatistikCiz() {
    let alan = document.getElementById('milo-aidat-istatistik-alani'); if (!alan) return;
    let buAyStr = miloAidatAyStrOfset(0), gecenAyStr = miloAidatAyStrOfset(-1);
    let buAy = miloAidatAyToplamHesapla(buAyStr);
    let gecenAy = miloAidatAyToplamHesapla(gecenAyStr);
    let son3AyDegerler = [miloAidatAyStrOfset(-2), miloAidatAyStrOfset(-1), miloAidatAyStrOfset(0)].map(miloAidatAyToplamHesapla);
    let son3AyToplam = son3AyDegerler.reduce((a, b) => a + b, 0);
    let son3AyOrtalama = Math.round(son3AyToplam / 3);
    let son6AyDegerler = []; for (let i = 5; i >= 0; i--) son6AyDegerler.push(miloAidatAyToplamHesapla(miloAidatAyStrOfset(-i)));

    let grupIstatistik = miloAidatGrupIstatistikleriHesapla(buAyStr, miloAidatIstatistikMuafDahil);
    let aktifSayi = grupIstatistik.reduce((a, x) => a + x.sayi, 0);
    let buAyOdeyenSayisi = grupIstatistik.reduce((a, x) => a + x.odeyen, 0);
    let gelecekAyBeklenti = aktifSayi * miloAidatVarsayilanTutar;
    let tahsilatOrani = aktifSayi ? Math.round((buAyOdeyenSayisi / aktifSayi) * 100) : 0;
    let arpu = buAyOdeyenSayisi ? Math.round(buAy / buAyOdeyenSayisi) : 0;

    let toplamAktifTum = miloUyeler.filter(u => !u.pasif).length;
    let muafSayiTum = miloUyeler.filter(u => !u.pasif && u.aidatMuaf).length;

    let bekleyenAlacak = 0;
    miloUyeler.forEach(u => {
        if (u.pasif) return;
        if (u.aidatMuaf && !miloAidatIstatistikMuafDahil) return;
        let rec = miloAidatDuesKayit(u.ad, buAyStr);
        if (!rec || !rec.odendi) bekleyenAlacak += miloAidatSonBilinenTutar(u.ad);
    });

    let simdikiYil = new Date().getFullYear();
    let yillikToplam = 0; for (let ay = 1; ay <= 12; ay++) yillikToplam += miloAidatAyToplamHesapla(simdikiYil + '-' + String(ay).padStart(2, '0'));

    let degisim = gecenAy > 0 ? Math.round(((buAy - gecenAy) / gecenAy) * 100) : null;
    let degisimHTML = degisim === null ? '' : ` <span style="font-size:11px; font-weight:700; color:${degisim >= 0 ? 'var(--neon-green)' : 'var(--neon-red)'};">${degisim >= 0 ? '▲' : '▼'}%${Math.abs(degisim)}</span>`;

    let dolu = grupIstatistik.filter(x => x.sayi > 0);
    let enKucukGrup = dolu.length ? dolu.slice().sort((a, b) => a.sayi - b.sayi)[0] : null;
    let enIyiTahsilatGrup = dolu.length ? dolu.slice().sort((a, b) => b.tahsilat - a.tahsilat)[0] : null;

    let grupSatirlari = grupIstatistik.map(x => {
        let yuzde = aktifSayi ? Math.round((x.sayi / aktifSayi) * 100) : 0;
        return `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <div style="width:80px; font-size:11px; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${miloEsc(x.g)}</div>
            <div style="flex:1; background:var(--bg-panel); border-radius:6px; height:16px; overflow:hidden;"><div style="width:${yuzde}%; height:100%; background:var(--neon-pink);"></div></div>
            <div style="width:120px; text-align:right; font-size:10px; color:var(--text-muted);">${x.sayi} kişi (%${yuzde})${x.ortYas !== null ? ' · ort ' + x.ortYas + ' yaş' : ''}</div>
        </div>`;
    }).join('');

    let oneriHTML = !enKucukGrup ? '' : `<div style="background:rgba(234,179,8,0.08); border:1px solid var(--gold); border-radius:8px; padding:10px; margin-top:8px; font-size:11px; line-height:1.6;">
        <b style="color:var(--gold);">💡 Büyüme Önerisi:</b> En az üye <b>${miloEsc(enKucukGrup.g)}</b> grubunda (${enKucukGrup.sayi} kişi, toplamın %${aktifSayi ? Math.round(enKucukGrup.sayi / aktifSayi * 100) : 0}'i) — büyüme/tanıtım için en çok fırsat burada olabilir.
        ${enIyiTahsilatGrup ? ` En yüksek ödeme düzenliliği <b>${miloEsc(enIyiTahsilatGrup.g)}</b> grubunda (%${enIyiTahsilatGrup.tahsilat} tahsilat) — en istikrarlı gelir kaynağınız.` : ''}
    </div>`;

    alan.innerHTML = `<div class="milo-card">
        <div style="padding-bottom:10px; margin-bottom:6px; border-bottom:1px solid var(--border-color);">
            <div style="font-weight:900; color:var(--gold); font-size:14px;">📊 Aidat Gelir İstatistikleri</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">👥 Toplam Aktif: ${toplamAktifTum} · 💳 Ödeme Bekleyen: ${toplamAktifTum - muafSayiTum} · 🎗️ Muaf: ${muafSayiTum}</div>
        </div>
        <label style="display:flex; align-items:center; gap:6px; font-size:11px; margin-bottom:10px; cursor:pointer; color:var(--text-muted);">
            <input type="checkbox" ${miloAidatIstatistikMuafDahil ? 'checked' : ''} onchange="miloAidatIstatistikMuafDahil=this.checked; miloAidatIstatistikCiz();"> Muaf üyeleri de istatistiklere dahil et
        </label>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center;"><div style="font-size:16px; font-weight:800; color:var(--neon-green);">${buAy}₺</div><div style="font-size:10px; color:var(--text-muted);">Bu Ay</div></div>
            <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center;"><div style="font-size:16px; font-weight:800; color:var(--accent-orange);">${gecenAy}₺${degisimHTML}</div><div style="font-size:10px; color:var(--text-muted);">Geçen Ay</div></div>
            <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center;"><div style="font-size:16px; font-weight:800; color:var(--neon-blue);">${son3AyToplam}₺</div><div style="font-size:10px; color:var(--text-muted);">Son 3 Ay (ort. ${son3AyOrtalama}₺/ay)</div></div>
            <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; text-align:center;"><div style="font-size:16px; font-weight:800; color:var(--gold);">${gelecekAyBeklenti}₺</div><div style="font-size:10px; color:var(--text-muted);">Gelecek Ay Beklenti</div></div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:10px;">
            <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:8px; text-align:center;"><div style="font-size:14px; font-weight:800; color:${tahsilatOrani >= 70 ? 'var(--neon-green)' : (tahsilatOrani >= 40 ? 'var(--gold)' : 'var(--neon-red)')};">%${tahsilatOrani}</div><div style="font-size:9px; color:var(--text-muted);">Tahsilat Oranı</div></div>
            <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:8px; text-align:center;"><div style="font-size:14px; font-weight:800; color:var(--neon-blue);">${arpu}₺</div><div style="font-size:9px; color:var(--text-muted);">Üye Başı Ort.</div></div>
            <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:8px; text-align:center;"><div style="font-size:14px; font-weight:800; color:var(--neon-red);">${bekleyenAlacak}₺</div><div style="font-size:9px; color:var(--text-muted);">Bekleyen Alacak (tah.)</div></div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:6px;">Son 6 Ay Eğilimi · ${simdikiYil} Yıl Toplamı: <b style="color:var(--text-main);">${yillikToplam}₺</b></div>
        <div style="background:var(--bg-panel); border:1px solid var(--border-color); border-radius:10px; padding:10px; display:flex; justify-content:center; margin-bottom:12px;">${miloSparklineSVG(son6AyDegerler)}</div>
        <div style="font-weight:800; color:var(--neon-pink); font-size:13px; margin-bottom:8px;">👥 Grup Dağılımı</div>
        ${grupSatirlari || '<div style="color:var(--text-muted); font-size:12px;">Henüz grup yok.</div>'}
        ${oneriHTML}
        <button onclick="miloAidatDetayliAnalizPDF()" style="width:100%; margin-top:12px; background:var(--gold); color:#1b1b1b; border:none; padding:11px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer;">📄 Detaylı Analiz Raporu — PDF İndir</button>
    </div>`;
}

// ===== AİDAT — BORÇ RAPORU =====
function miloAidatBorcListesi(esikAy) {
    let liste = [];
    let simdi = new Date();
    miloUyeler.forEach(u => {
        if (u.pasif || u.aidatMuaf) return;
        let borcAy = 0;
        let d = new Date(simdi.getFullYear(), simdi.getMonth(), 1);
        for (let i = 0; i < 6; i++) {
            let ayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
            let rec = miloAidatDuesKayit(u.ad, ayStr);
            if (rec && rec.odendi) break;
            borcAy++;
            d.setMonth(d.getMonth() - 1);
        }
        if (borcAy >= esikAy) liste.push({ ad: u.ad, grup: u.grup, borcAy, telefon: u.acilTelefon || null });
    });
    return liste.sort((a, b) => b.borcAy - a.borcAy);
}

function miloTelefonWaFormat(telefon) {
    let rakam = (telefon || '').replace(/[^\d]/g, '');
    if (!rakam) return '';
    if (rakam.startsWith('90')) return rakam;
    if (rakam.startsWith('0')) return '90' + rakam.slice(1);
    return '90' + rakam;
}

function miloAidatBorcWhatsApp(ad, telefon) {
    let ilkAd = ad.split(' ')[0];
    let ilkAdB = ilkAd.charAt(0) + ilkAd.slice(1).toLocaleLowerCase('tr');
    let msg = `Merhaba 🌟 MILO FITT KIDS'ten yazıyoruz.\n\n${ilkAdB} için bu ayki aidat ödemesini henüz göremedik. Uygun olduğunuzda tamamlarsanız çok seviniriz 🩷 Ödemeyi yaptıysanız bize bildirmeniz yeterli.\n\nBir sorunuz olursa her zaman buradayız.\nMILO FITT KIDS`;
    let numara = miloTelefonWaFormat(telefon);
    let url = numara ? `https://wa.me/${numara}?text=` : 'https://wa.me/?text=';
    window.open(url + encodeURIComponent(msg), '_blank');
}

function miloAidatBorcRaporuToggle() { miloAidatBorcRaporuAcik = !miloAidatBorcRaporuAcik; miloAidatCiz(); }

function miloAidatBorcRaporuCiz() {
    let alan = document.getElementById('milo-aidat-borc-raporu-alani'); if (!alan) return;
    let liste = miloAidatBorcListesi(miloAidatBorcEsikAy);
    let html = `<div class="milo-card">
        <div style="padding-bottom:10px; margin-bottom:10px; border-bottom:1px solid var(--border-color);">
            <div style="font-weight:900; color:var(--neon-red); font-size:14px;">⚠️ Aidat Borç Raporu</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${liste.length} üye ${miloAidatBorcEsikAy}+ aydır ödemedi</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <span style="font-size:12px; color:var(--text-muted); white-space:nowrap;">Eşik:</span>
            <input type="number" min="1" max="6" value="${miloAidatBorcEsikAy}" onchange="miloAidatBorcEsikAy=isNaN(parseInt(this.value))?1:parseInt(this.value); miloAidatBorcRaporuCiz();" class="milo-input" style="width:70px; margin-bottom:0; padding:8px 10px;">
            <span style="font-size:12px; color:var(--text-muted);">aydır ödemeyenler</span>
        </div>`;
    if (!liste.length) {
        html += `<div style="background:rgba(16,185,129,0.07); border:1px solid rgba(16,185,129,0.35); border-radius:8px; padding:10px; font-size:12px; font-weight:700; color:var(--neon-green); text-align:center;">✅ Temiz — bu eşikte borçlu üye yok.</div></div>`;
        alan.innerHTML = html; return;
    }
    html += liste.map(x => `<div style="display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid var(--border-color);">
        <div style="font-size:18px; flex-shrink:0;">🔴</div>
        <div style="flex:1; min-width:0;"><div style="font-weight:800; font-size:13px;">${miloEsc(x.ad)} <span style="color:var(--text-muted); font-weight:400; font-size:11px;">· ${miloEsc(x.grup)}</span></div><div style="font-size:10px; color:var(--text-muted);">${x.borcAy} aydır ödenmemiş${x.telefon ? ' · 📞 ' + miloEsc(x.telefon) : ''}</div></div>
        <button onclick="miloAidatBorcWhatsApp('${miloJsEsc(x.ad)}','${miloJsEsc(x.telefon || '')}')" style="background:rgba(16,185,129,0.12); color:var(--neon-green); border:1px solid var(--neon-green); border-radius:8px; padding:7px 10px; font-size:11px; font-weight:800; flex-shrink:0;">💬 Veliye Yaz</button>
    </div>`).join('') + '</div>';
    alan.innerHTML = html;
}

// ===== AİDAT — RAPORLAR (yazdır / PDF) =====
function miloAidatGelirRaporu() {
    let isimler = miloUyeler.filter(u => !u.pasif);
    let satir = '', toplam = 0, odeyen = 0;
    isimler.forEach(u => {
        let rec = miloAidatDuesKayit(u.ad, miloAidatAy);
        let odendi = rec && rec.odendi;
        if (odendi) { toplam += (rec.tutar || 0); odeyen++; }
        let durumYazi = odendi ? 'ÖDENDİ' : (rec && rec.notMetin ? miloEsc(rec.notMetin) : 'Ödenmedi');
        satir += `<tr><td>${miloEsc(u.ad)}</td><td>${miloEsc(u.grup)}</td><td style="text-align:center; color:${odendi ? 'green' : '#c00'}; font-weight:bold;">${durumYazi}</td><td style="text-align:right;">${odendi ? (rec.tutar || 0) + '₺' : '-'}</td><td style="text-align:center;">${odendi && rec.odemeTarihi ? miloEsc(rec.odemeTarihi) : '-'}</td></tr>`;
    });
    let w = window.open('', '_blank'); if (!w) { showToast('Açılır pencere engellendi.', 'error'); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Aidat Raporu ${miloAidatAy}</title><link rel="icon" href="/favicon.png"></head><body style="font-family:Arial; padding:24px;">
        <h2 style="text-align:center; color:#831843; margin:0;">MILO FITT KIDS</h2>
        <h3 style="text-align:center; color:#ec4899; margin:4px 0 2px;">Aidat Gelir Raporu</h3>
        <p style="text-align:center; color:#555; margin:0 0 16px;">${miloAidatAy}</p>
        <table style="width:100%; border-collapse:collapse; font-size:13px;" border="1" cellpadding="7">
            <tr style="background:#831843; color:#fff;"><th align="left">Üye</th><th align="left">Grup</th><th>Durum</th><th>Tutar</th><th>Ödeme Tarihi</th></tr>
            ${satir}
            <tr style="font-weight:bold; background:#f0f0f0;"><td colspan="2">TOPLAM (${odeyen}/${isimler.length} ödedi)</td><td></td><td style="text-align:right; color:green;">${toplam}₺</td><td></td></tr>
        </table>
        <p style="text-align:center; color:#999; font-size:10px; margin-top:20px;">MILO FITT KIDS ile oluşturuldu · ${new Date().toLocaleString('tr-TR')}</p>
    </body></html>`);
    w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 500);
}

function miloAidatDetayliAnalizPDF() {
    let buAyStr = miloAidatAyStrOfset(0), gecenAyStr = miloAidatAyStrOfset(-1);
    let buAy = miloAidatAyToplamHesapla(buAyStr);
    let gecenAy = miloAidatAyToplamHesapla(gecenAyStr);
    let son3AyToplam = [miloAidatAyStrOfset(-2), miloAidatAyStrOfset(-1), miloAidatAyStrOfset(0)].map(miloAidatAyToplamHesapla).reduce((a, b) => a + b, 0);
    let grupIstatistik = miloAidatGrupIstatistikleriHesapla(buAyStr, miloAidatIstatistikMuafDahil);
    let aktifSayi = grupIstatistik.reduce((a, x) => a + x.sayi, 0);
    let toplamAktifTum = miloUyeler.filter(u => !u.pasif).length;
    let muafSayiTum = miloUyeler.filter(u => !u.pasif && u.aidatMuaf).length;
    let buAyOdeyenSayisi = grupIstatistik.reduce((a, x) => a + x.odeyen, 0);
    let tahsilatOrani = aktifSayi ? Math.round((buAyOdeyenSayisi / aktifSayi) * 100) : 0;
    let arpu = buAyOdeyenSayisi ? Math.round(buAy / buAyOdeyenSayisi) : 0;
    let gelecekAyBeklenti = aktifSayi * miloAidatVarsayilanTutar;
    let simdikiYil = new Date().getFullYear();
    let yillikToplam = 0; for (let ay = 1; ay <= 12; ay++) yillikToplam += miloAidatAyToplamHesapla(simdikiYil + '-' + String(ay).padStart(2, '0'));

    let esc = miloEsc;
    let grupSatir = grupIstatistik.map(x => {
        let yuzde = aktifSayi ? Math.round((x.sayi / aktifSayi) * 100) : 0;
        return `<tr><td>${esc(x.g)}</td><td style="text-align:center;">${x.sayi}</td><td style="text-align:center;">%${yuzde}</td><td style="text-align:center;">${x.ortYas !== null ? x.ortYas : '-'}</td><td style="text-align:center;">%${x.tahsilat}</td></tr>`;
    }).join('');

    let dokum = miloAidatSporcuOdemeDokumu();
    let gruplar = [...new Set(miloUyeler.map(u => u.grup))];
    let dokumSatir = gruplar.map(g => {
        let grupListe = dokum.filter(x => x.grup === g);
        if (!grupListe.length) return '';
        let baslikSatir = `<tr><td colspan="5" style="background:#fce7f3; color:#831843; font-weight:bold; font-size:12px; padding:6px 8px;">${esc(g)}</td></tr>`;
        let satirlar = grupListe.map(x => {
            let dogumMetin = x.dogumTarihi ? `${x.dogumTarihi.split('-').reverse().join('.')}${x.yas !== null ? ' (' + x.yas + ')' : ''}` : '-';
            let anaSatir = `<tr><td>${esc(x.ad)}${x.muaf ? ' <span style="color:#8b5cf6; font-size:11px;">(Muaf)</span>' : ''}</td><td style="text-align:center;">${esc(dogumMetin)}</td><td style="text-align:right;">${x.toplamOdenen}₺</td><td style="text-align:center;">${x.odemeSayisi}</td><td style="text-align:center;">${esc(x.sonOdemeTarihi || x.sonOdemeAy || '-')}</td></tr>`;
            let notSatiri = x.notlar && x.notlar.length ? `<tr><td colspan="5" style="font-size:10px; color:#777; font-style:italic; padding-top:0;">📝 Notlar: ${esc(x.notlar.join(' · '))}</td></tr>` : '';
            return anaSatir + notSatiri;
        }).join('');
        return baslikSatir + satirlar;
    }).join('');
    let dokumToplam = dokum.reduce((a, x) => a + x.toplamOdenen, 0);

    let dolu = grupIstatistik.filter(x => x.sayi > 0);
    let enKucukGrup = dolu.length ? dolu.slice().sort((a, b) => a.sayi - b.sayi)[0] : null;
    let enIyiTahsilatGrup = dolu.length ? dolu.slice().sort((a, b) => b.tahsilat - a.tahsilat)[0] : null;

    let w = window.open('', '_blank'); if (!w) { showToast('Açılır pencere engellendi.', 'error'); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Aidat Analiz Raporu</title><link rel="icon" href="/favicon.png"></head><body style="font-family:Arial; padding:24px; color:#222;">
        <h2 style="text-align:center; color:#831843; margin:0;">MILO FITT KIDS</h2>
        <h3 style="text-align:center; color:#ec4899; margin:4px 0 2px;">Aidat Gelir ve Üyelik Analiz Raporu</h3>
        <p style="text-align:center; color:#555; margin:0 0 20px; font-size:12px;">Oluşturulma: ${new Date().toLocaleString('tr-TR')}</p>

        <h4 style="color:#831843; border-bottom:2px solid #831843; padding-bottom:4px;">Özet Göstergeler</h4>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:20px;" border="1" cellpadding="8">
            <tr><td>Bu Ay Toplanan</td><td style="text-align:right; font-weight:bold;">${buAy}₺</td></tr>
            <tr><td>Geçen Ay Toplanan</td><td style="text-align:right;">${gecenAy}₺</td></tr>
            <tr><td>Son 3 Ay Toplam</td><td style="text-align:right;">${son3AyToplam}₺</td></tr>
            <tr><td>${simdikiYil} Yıl Toplamı</td><td style="text-align:right; font-weight:bold;">${yillikToplam}₺</td></tr>
            <tr><td>Gelecek Ay Beklentisi</td><td style="text-align:right;">${gelecekAyBeklenti}₺</td></tr>
            <tr><td>Tahsilat Oranı (bu ay)</td><td style="text-align:right;">%${tahsilatOrani}</td></tr>
            <tr><td>Üye Başı Ortalama Gelir (ARPU)</td><td style="text-align:right;">${arpu}₺</td></tr>
            <tr><td>Toplam Aktif Üye</td><td style="text-align:right;">${toplamAktifTum}</td></tr>
            <tr><td>Ödeme Bekleyen Üye</td><td style="text-align:right;">${toplamAktifTum - muafSayiTum}</td></tr>
            <tr><td>Aidattan Muaf Üye</td><td style="text-align:right;">${muafSayiTum}</td></tr>
        </table>

        <h4 style="color:#831843; border-bottom:2px solid #831843; padding-bottom:4px;">Grup Dağılımı</h4>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:8px;" border="1" cellpadding="7">
            <tr style="background:#831843; color:#fff;"><th align="left">Grup</th><th>Üye Sayısı</th><th>Oran</th><th>Ort. Yaş</th><th>Tahsilat</th></tr>
            ${grupSatir}
        </table>
        ${enKucukGrup ? `<p style="font-size:12px; background:#fff8e1; border:1px solid #f0c419; border-radius:6px; padding:10px; line-height:1.6;"><b>💡 Büyüme Önerisi:</b> En az üye ${esc(enKucukGrup.g)} grubunda (${enKucukGrup.sayi} kişi) — büyüme/tanıtım için en çok fırsat burada olabilir.${enIyiTahsilatGrup ? ` En yüksek ödeme düzenliliği ${esc(enIyiTahsilatGrup.g)} grubunda (%${enIyiTahsilatGrup.tahsilat}).` : ''}</p>` : ''}

        <h4 style="color:#831843; border-bottom:2px solid #831843; padding-bottom:4px; margin-top:20px;">Üye Bazlı Ödeme Dökümü (Tüm Zamanlar)</h4>
        <table style="width:100%; border-collapse:collapse; font-size:12px;" border="1" cellpadding="6">
            <tr style="background:#831843; color:#fff;"><th align="left">Üye</th><th>Doğum Tarihi (Yaş)</th><th>Toplam Ödenen</th><th>Ödeme Sayısı</th><th>Son Ödeme</th></tr>
            ${dokumSatir}
            <tr style="font-weight:bold; background:#f0f0f0;"><td colspan="2">TOPLAM</td><td style="text-align:right; color:green;">${dokumToplam}₺</td><td></td><td></td></tr>
        </table>

        <p style="text-align:center; color:#999; font-size:10px; margin-top:24px;">MILO FITT KIDS ile oluşturuldu · ${new Date().toLocaleString('tr-TR')}</p>
    </body></html>`);
    w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 500);
}

// ===== YOKLAMA =====
function miloYoklamaCiz(kayitlar) {
    miloYoklamaKayitlariSon = kayitlar;
    let alan = document.getElementById('milo-icerik');
    let aktifler = miloUyeler.filter(u => !u.pasif);
    alan.innerHTML = `
        <input type="date" class="milo-input" value="${miloYoklamaTarih}" max="${bugunISO()}" onchange="miloYoklamaTarih=this.value; miloSekmeYenile();">
        <textarea class="milo-input" id="milo-gunluk-not" placeholder="📝 Bugün ne işlendi? (opsiyonel not)" onblur="miloGunlukNotKaydet()" style="min-height:50px;">${miloEsc(miloGunlukNot)}</textarea>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">${miloYoklamaTarih} — dokunarak geldi/gelmedi işaretleyin</div>
        ${aktifler.map(u => {
            let k = kayitlar.find(r => r.ad === u.ad);
            let geldi = k ? !!k.geldi : false;
            return `<div class="milo-card" style="display:flex; justify-content:space-between; align-items:center;">
                <div><b>${miloEsc(u.ad)}</b> <span style="color:var(--text-muted); font-size:12px;">· ${miloEsc(u.grup)}</span></div>
                <button onclick="miloYoklamaIsaretle('${miloEsc(u.ad)}','${miloEsc(u.grup)}',${!geldi})" style="border:none; border-radius:8px; padding:8px 14px; font-weight:800; font-size:12px; color:#fff; background:${geldi ? 'var(--neon-green)' : 'var(--accent-grey)'};">${geldi ? '✅ Geldi' : '⬜ Gelmedi'}</button>
            </div>`;
        }).join('') || '<div style="color:var(--text-muted); font-size:13px;">Aktif üye yok.</div>'}
        <button onclick="miloDevamsizlikToggle()" style="width:100%; margin-top:12px; background:rgba(239,68,68,0.12); color:var(--neon-red); border:1px solid var(--neon-red); padding:11px; border-radius:10px; font-weight:800; font-size:13px; cursor:pointer;">${miloDevamsizlikAcik ? '✕ Devamsızlık Radarını Kapat' : '⚠️ Devamsızlık Radarı'}</button>
        <div id="milo-devamsizlik-alani" style="margin-top:12px;">${miloDevamsizlikAcik ? miloDevamsizlikRaporuHTML() : ''}</div>
    `;
}
async function miloYoklamaIsaretle(ad, grup, geldi) {
    await miloApi('/attendance/auto', {
        method: 'POST',
        body: JSON.stringify({ tarih: miloYoklamaTarih, ad, grup, saat: new Date().toTimeString().slice(0, 5), elle: true, geldi }),
    });
    let att = (await miloApi('/attendance/auto?tarih=' + encodeURIComponent(miloYoklamaTarih))).attendance;
    miloYoklamaCiz(att);
}

async function miloGunlukNotKaydet() {
    let metin = document.getElementById('milo-gunluk-not').value || null;
    await miloApi('/gunluk-not/' + encodeURIComponent(miloYoklamaTarih), { method: 'PUT', body: JSON.stringify({ notMetin: metin }) });
    miloGunlukNot = metin || '';
    showToast('✅ Not kaydedildi.', 'success');
}

// ===== YOKLAMA — DEVAMSIZLIK RADARI =====
function miloDevamsizlikListesi(esikGun) {
    let simdi = new Date();
    let liste = [];
    miloUyeler.filter(u => !u.pasif).forEach(u => {
        let tarihler = miloAttendanceTum.filter(a => a.ad === u.ad && a.geldi).map(a => a.tarih).sort();
        let sonTarih = tarihler.length ? tarihler[tarihler.length - 1] : null;
        let gun = sonTarih ? Math.floor((simdi - new Date(sonTarih + 'T00:00:00')) / 86400000) : null;
        if (gun === null || gun >= esikGun) liste.push({ ad: u.ad, grup: u.grup, gun, telefon: u.acilTelefon || null });
    });
    return liste.sort((a, b) => (b.gun ?? 9999) - (a.gun ?? 9999));
}

function miloDevamsizlikWhatsApp(ad, telefon) {
    let ilkAd = ad.split(' ')[0];
    let ilkAdB = ilkAd.charAt(0) + ilkAd.slice(1).toLocaleLowerCase('tr');
    let msg = `Merhaba 🌟 MILO FITT KIDS'ten yazıyoruz.\n\n${ilkAdB}'ı bir süredir antrenmanlarımızda göremedik, sizi özledik! Uygun olduğunuzda bize haber verirseniz seviniriz 🩷\n\nHer zaman buradayız.\nMILO FITT KIDS`;
    let numara = miloTelefonWaFormat(telefon);
    let url = numara ? `https://wa.me/${numara}?text=` : 'https://wa.me/?text=';
    window.open(url + encodeURIComponent(msg), '_blank');
}

async function miloDevamsizlikToggle() {
    miloDevamsizlikAcik = !miloDevamsizlikAcik;
    if (miloDevamsizlikAcik && !miloAttendanceTum.length) miloAttendanceTum = (await miloApi('/attendance/auto')).attendance;
    miloYoklamaCiz(miloYoklamaKayitlariSon);
}

function miloDevamsizlikRaporuHTML() {
    let liste = miloDevamsizlikListesi(miloDevamsizlikEsikGun);
    let html = `<div class="milo-card">
        <div style="padding-bottom:10px; margin-bottom:10px; border-bottom:1px solid var(--border-color);">
            <div style="font-weight:900; color:var(--neon-red); font-size:14px;">⚠️ Devamsızlık Radarı</div>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${liste.length} üye ${miloDevamsizlikEsikGun}+ gündür gelmiyor</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <span style="font-size:12px; color:var(--text-muted); white-space:nowrap;">Eşik:</span>
            <input type="number" min="1" max="180" value="${miloDevamsizlikEsikGun}" onchange="miloDevamsizlikEsikGun=isNaN(parseInt(this.value))?1:parseInt(this.value); miloYoklamaCiz(miloYoklamaKayitlariSon);" class="milo-input" style="width:70px; margin-bottom:0; padding:8px 10px;">
            <span style="font-size:12px; color:var(--text-muted);">gündür gelmeyenler</span>
        </div>`;
    if (!liste.length) {
        return html + `<div style="background:rgba(16,185,129,0.07); border:1px solid rgba(16,185,129,0.35); border-radius:8px; padding:10px; font-size:12px; font-weight:700; color:var(--neon-green); text-align:center;">✅ Temiz — bu eşikte devamsız üye yok.</div></div>`;
    }
    html += liste.map(x => `<div style="display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid var(--border-color);">
        <div style="font-size:18px; flex-shrink:0;">🔴</div>
        <div style="flex:1; min-width:0;"><div style="font-weight:800; font-size:13px;">${miloEsc(x.ad)} <span style="color:var(--text-muted); font-weight:400; font-size:11px;">· ${miloEsc(x.grup)}</span></div><div style="font-size:10px; color:var(--text-muted);">${x.gun === null ? 'Hiç kayıt yok' : x.gun + ' gündür gelmiyor'}${x.telefon ? ' · 📞 ' + miloEsc(x.telefon) : ''}</div></div>
        <button onclick="miloDevamsizlikWhatsApp('${miloJsEsc(x.ad)}','${miloJsEsc(x.telefon || '')}')" style="background:rgba(16,185,129,0.12); color:var(--neon-green); border:1px solid var(--neon-green); border-radius:8px; padding:7px 10px; font-size:11px; font-weight:800; flex-shrink:0;">💬 Veliye Yaz</button>
    </div>`).join('') + '</div>';
    return html;
}

// ===== PERSONEL =====
function miloPersonelCiz() {
    let alan = document.getElementById('milo-icerik');
    alan.innerHTML = `
        <div class="milo-card">
            <input class="milo-input" id="milo-pf-ad" placeholder="Ad Soyad">
            <input class="milo-input" id="milo-pf-ucret" placeholder="Ücret (opsiyonel)">
            <button class="milo-btn-full" onclick="miloPersonelEkle()">➕ Ekle</button>
        </div>
        ${miloPersonel.map(p => `<div class="milo-card" style="display:flex; justify-content:space-between; align-items:center;">
            <div><b>${miloEsc(p.ad)}</b>${p.ucret ? ` <span style="color:var(--text-muted); font-size:12px;">· ${miloEsc(p.ucret)}</span>` : ''}</div>
            <button onclick="miloPersonelSil('${miloEsc(p.id)}')" style="background:var(--neon-red); border:none; color:#fff; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:bold;">🗑️</button>
        </div>`).join('') || '<div style="color:var(--text-muted); font-size:13px;">Henüz personel yok.</div>'}
    `;
}
async function miloPersonelEkle() {
    let ad = (document.getElementById('milo-pf-ad').value || '').trim();
    let ucret = document.getElementById('milo-pf-ucret').value || null;
    if (!ad) return showToast('Ad zorunlu.', 'error');
    await miloApi('/personnel', { method: 'POST', body: JSON.stringify({ id: 'p_' + Date.now(), ad, ucret }) });
    miloPersonel = (await miloApi('/personnel')).personnel;
    miloPersonelCiz();
    showToast('✅ Eklendi.', 'success');
}
async function miloPersonelSil(id) {
    if (!confirm('Silinsin mi?')) return;
    await miloApi('/personnel/' + encodeURIComponent(id), { method: 'DELETE' });
    miloPersonel = miloPersonel.filter(p => p.id !== id);
    miloPersonelCiz();
}

// ===== ANTRENMAN PROGRAMI =====
const MILO_GUN_ADI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
function miloProgramCiz() {
    let alan = document.getElementById('milo-icerik');
    alan.innerHTML = `
        <div class="milo-card">
            <input class="milo-input" id="milo-prf-grup" list="milo-grup-list" placeholder="Grup / Seviye">
            <select class="milo-input" id="milo-prf-gun">${MILO_GUN_ADI.map((g, i) => `<option value="${i}">${g}</option>`).join('')}</select>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:8px;">
                <input type="time" class="milo-input" id="milo-prf-bas" style="margin-bottom:0;">
                <input type="time" class="milo-input" id="milo-prf-bit" style="margin-bottom:0;">
            </div>
            <button class="milo-btn-full" onclick="miloProgramEkle()">➕ Ekle</button>
        </div>
        <datalist id="milo-grup-list">${[...new Set(miloUyeler.map(u => u.grup))].map(g => `<option value="${miloEsc(g)}">`).join('')}</datalist>
        ${miloProgram.map(s => `<div class="milo-card" style="display:flex; justify-content:space-between; align-items:center;">
            <div><b>${miloEsc(s.grup)}</b> <span style="color:var(--text-muted); font-size:12px;">· ${MILO_GUN_ADI[s.gun]} ${s.baslangicSaat}-${s.bitisSaat}</span></div>
            <button onclick="miloProgramSil(${s.id})" style="background:var(--neon-red); border:none; color:#fff; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:bold;">🗑️</button>
        </div>`).join('') || '<div style="color:var(--text-muted); font-size:13px;">Henüz program yok.</div>'}
    `;
}
async function miloProgramEkle() {
    let grup = (document.getElementById('milo-prf-grup').value || '').trim();
    let gun = Number(document.getElementById('milo-prf-gun').value);
    let bas = document.getElementById('milo-prf-bas').value, bit = document.getElementById('milo-prf-bit').value;
    if (!grup || !bas || !bit) return showToast('Grup, başlangıç ve bitiş saati zorunlu.', 'error');
    await miloApi('/antrenman-programi', { method: 'POST', body: JSON.stringify({ grup, gun, baslangicSaat: bas, bitisSaat: bit }) });
    miloProgram = (await miloApi('/antrenman-programi')).slots;
    miloProgramCiz();
    showToast('✅ Eklendi.', 'success');
}
async function miloProgramSil(id) {
    if (!confirm('Silinsin mi?')) return;
    await miloApi('/antrenman-programi/' + id, { method: 'DELETE' });
    miloProgram = miloProgram.filter(s => s.id !== id);
    miloProgramCiz();
}

// ===== DERS İÇERİKLERİ =====
function miloDerslerAltAnahtarHTML() {
    return `<div style="display:flex; gap:6px; margin-bottom:10px;">
        <button onclick="miloDerslerAltGorunum='icerik'; miloDerslerCiz();" style="flex:1; padding:9px; border-radius:8px; border:1px solid ${miloDerslerAltGorunum === 'icerik' ? 'var(--neon-pink)' : 'var(--border-color)'}; background:${miloDerslerAltGorunum === 'icerik' ? 'rgba(236,72,153,0.12)' : 'var(--bg-panel)'}; color:${miloDerslerAltGorunum === 'icerik' ? 'var(--neon-pink)' : 'var(--text-muted)'}; font-weight:800; font-size:12px; cursor:pointer;">📚 Ders İçerikleri</button>
        <button onclick="miloDerslerAltGorunum='grup'; miloSeciliYasId=null; miloSeciliGrupId=null; miloDerslerCiz();" style="flex:1; padding:9px; border-radius:8px; border:1px solid ${miloDerslerAltGorunum === 'grup' ? 'var(--neon-pink)' : 'var(--border-color)'}; background:${miloDerslerAltGorunum === 'grup' ? 'rgba(236,72,153,0.12)' : 'var(--bg-panel)'}; color:${miloDerslerAltGorunum === 'grup' ? 'var(--neon-pink)' : 'var(--text-muted)'}; font-weight:800; font-size:12px; cursor:pointer;">🗂️ Yaş/Grup Yapısı</button>
    </div>`;
}

function miloDerslerCiz() {
    let alan = document.getElementById('milo-icerik');
    if (miloDerslerAltGorunum === 'grup') {
        alan.innerHTML = miloDerslerAltAnahtarHTML() + '<div id="milo-grup-alt-alani"></div>';
        miloGruplarGorunumCiz();
        return;
    }
    let kategoriler = [...new Set(miloDersler.map(d => d.kategori).filter(Boolean))].sort();
    let liste = miloDersler.filter(d => !miloDersKategoriFiltre || d.kategori === miloDersKategoriFiltre);
    alan.innerHTML = miloDerslerAltAnahtarHTML() + `
        <div class="milo-card">
            <input class="milo-input" id="milo-df-baslik" placeholder="Başlık (örn: Öne Takla)">
            <input class="milo-input" id="milo-df-tip" placeholder="Tip (örn: hareket, esneme)">
            <select class="milo-input" id="milo-df-seviye">
                <option value="baslangic">Başlangıç</option>
                <option value="gelisen">Gelişen</option>
                <option value="ileri">İleri</option>
            </select>
            <input class="milo-input" id="milo-df-kategori" list="milo-kategori-list" placeholder="Kategori (örn: Denge)">
            <datalist id="milo-kategori-list">${MILO_DERS_KATEGORI_ONERI.map(k => `<option value="${k}">`).join('')}</datalist>
            <textarea class="milo-input" id="milo-df-aciklama" placeholder="Açıklama" style="min-height:50px;"></textarea>
            <input class="milo-input" id="milo-df-kazanim" placeholder="Kazanım (örn: Denge kontrolü, özgüven)">
            <button class="milo-btn-full" onclick="miloDersEkle()">➕ Ekle</button>
        </div>
        ${kategoriler.length ? `<div style="display:flex; gap:6px; overflow-x:auto; padding-bottom:8px; margin-bottom:6px;">
            <button onclick="miloDersKategoriFiltre=null; miloDerslerCiz();" style="flex:0 0 auto; padding:6px 12px; border-radius:20px; border:1px solid ${!miloDersKategoriFiltre ? 'var(--neon-pink)' : 'var(--border-color)'}; background:${!miloDersKategoriFiltre ? 'rgba(236,72,153,0.12)' : 'var(--bg-panel)'}; color:${!miloDersKategoriFiltre ? 'var(--neon-pink)' : 'var(--text-muted)'}; font-size:11px; font-weight:700; white-space:nowrap; cursor:pointer;">Tümü</button>
            ${kategoriler.map(k => `<button onclick="miloDersKategoriFiltre='${miloJsEsc(k)}'; miloDerslerCiz();" style="flex:0 0 auto; padding:6px 12px; border-radius:20px; border:1px solid ${miloDersKategoriFiltre === k ? 'var(--neon-pink)' : 'var(--border-color)'}; background:${miloDersKategoriFiltre === k ? 'rgba(236,72,153,0.12)' : 'var(--bg-panel)'}; color:${miloDersKategoriFiltre === k ? 'var(--neon-pink)' : 'var(--text-muted)'}; font-size:11px; font-weight:700; white-space:nowrap; cursor:pointer;">${miloEsc(k)}</button>`).join('')}
        </div>` : ''}
        ${miloDersSeciliIdler.size ? `<div class="milo-card" style="border-color:var(--neon-blue);">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
                <div style="font-weight:800; font-size:12px; color:var(--neon-blue);">${miloDersSeciliIdler.size} ders seçildi</div>
                <button onclick="miloDersSeciliIdler.clear(); miloDerslerCiz();" style="background:var(--bg-panel); border:1px solid var(--border-color); color:var(--text-muted); border-radius:6px; padding:5px 10px; font-size:11px;">Seçimi Temizle</button>
            </div>
            <input class="milo-input" id="milo-ders-toplu-grup" placeholder="Grup (opsiyonel, örn: Başlangıç Grubu)" value="${miloEsc(miloDersGrupNotu)}" oninput="miloDersGrupNotu=this.value;" style="margin-top:8px;">
            <button onclick="miloDerslerTopluYazdir()" class="milo-btn-full" style="margin-bottom:0;">🖨️ Seçilenleri Tek PDF'te Yazdır</button>
        </div>` : ''}
        ${liste.map(d => miloDersKartHTML(d)).join('') || '<div style="color:var(--text-muted); font-size:13px;">Henüz ders içeriği yok.</div>'}
    `;
}

function miloDersSecimToggle(id, checked) {
    if (checked) miloDersSeciliIdler.add(id); else miloDersSeciliIdler.delete(id);
    miloDerslerCiz();
}

function miloDersKartHTML(d) {
    let seviyeEtiket = MILO_SEVIYE_ETIKET[d.seviye] || miloEsc(d.seviye);
    return `<div class="milo-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <input type="checkbox" class="milo-ders-sec-chk" ${miloDersSeciliIdler.has(d.id) ? 'checked' : ''} onchange="miloDersSecimToggle('${miloEsc(d.id)}', this.checked)" style="margin-top:3px; width:18px; height:18px; accent-color:var(--neon-blue); flex-shrink:0; cursor:pointer;">
            <div style="min-width:0; flex:1;">
                <b>${miloEsc(d.baslik)}</b> <span style="color:var(--text-muted); font-size:12px;">· ${seviyeEtiket}</span>
                ${d.kategori ? `<div style="margin-top:4px;"><span style="font-size:10px; font-weight:800; padding:2px 8px; border-radius:10px; background:rgba(236,72,153,0.12); border:1px solid var(--neon-pink); color:var(--neon-pink);">${miloEsc(d.kategori)}</span></div>` : ''}
                ${d.aciklama ? `<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">${miloEsc(d.aciklama)}</div>` : ''}
                ${d.kazanim ? `<div style="font-size:12px; color:var(--neon-green); margin-top:4px;">🎯 Kazanım: ${miloEsc(d.kazanim)}</div>` : ''}
                <div style="font-size:11px; color:var(--text-muted); margin-top:6px;">📊 ${d.kullanimSayisi || 0} kez işlendi ${d.ortalamaPuan ? `· ⭐ ${Number(d.ortalamaPuan).toFixed(1)} (${d.degerlendirmeSayisi})` : ''}</div>
            </div>
            <button onclick="miloDersSil('${miloEsc(d.id)}')" style="background:var(--neon-red); border:none; color:#fff; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:bold; flex-shrink:0;">🗑️</button>
        </div>
        <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
            <button onclick="miloDersIsledim('${miloEsc(d.id)}')" style="flex:1; min-width:100px; background:var(--bg-main); border:1px solid var(--border-color); color:var(--text-main); border-radius:6px; padding:7px; font-size:11px; font-weight:bold;">✅ Bugün İşledim</button>
            <button onclick="miloDersYazdir('${miloEsc(d.id)}')" style="flex:1; min-width:100px; background:var(--bg-main); border:1px solid var(--border-color); color:var(--text-main); border-radius:6px; padding:7px; font-size:11px; font-weight:bold;">🖨️ Yazdır/PDF</button>
            <button onclick="miloDersAtamaAc('${miloEsc(d.id)}')" style="flex:1; min-width:100px; background:rgba(59,130,246,0.12); border:1px solid var(--neon-blue); color:var(--neon-blue); border-radius:6px; padding:7px; font-size:11px; font-weight:bold;">🎯 Sporculara Ata</button>
        </div>
        <div style="display:flex; gap:5px; margin-top:8px;">
            ${[1, 2, 3, 4, 5].map(p => `<button onclick="miloDersDegerlendir('${miloEsc(d.id)}',${p})" style="flex:1; background:var(--milo-card-raised); border:none; color:var(--milo-sun); border-radius:10px; padding:7px; font-size:12px; font-weight:700; box-shadow:0 2px 6px rgba(35,48,46,0.06);">⭐${p}</button>`).join('')}
        </div>
        ${miloDersAtamaAcikId === d.id ? miloDersAtamaFormHTML(d) : ''}
    </div>`;
}

function miloDersAtamaAc(dersId) {
    miloDersAtamaAcikId = miloDersAtamaAcikId === dersId ? null : dersId;
    miloDersAtamaAramaFiltre = '';
    miloDerslerCiz();
}

function miloDersAtamaFormHTML(d) {
    let filtre = miloDersAtamaAramaFiltre.trim().toLocaleLowerCase('tr');
    let aktifler = miloUyeler.filter(u => !u.pasif && (!filtre || u.ad.toLocaleLowerCase('tr').includes(filtre)));
    let atanmislar = new Set(miloMemberSkills.filter(s => s.dersId === d.id).map(s => s.ad));
    return `<div style="background:rgba(31,173,160,0.08); border:1px solid var(--milo-teal); border-radius:14px; padding:12px; margin-top:8px;">
        <div style="font-weight:800; font-size:12px; margin-bottom:6px;">Sporcu seç ve ata:</div>
        <input class="milo-input" placeholder="🔍 Sporcu ara..." value="${miloEsc(miloDersAtamaAramaFiltre)}" oninput="miloDersAtamaAramaFiltre=this.value; miloDerslerCiz();">
        <div style="max-height:180px; overflow-y:auto; margin-bottom:8px;">
            ${aktifler.map(u => {
                let zatenAtanmis = atanmislar.has(u.ad);
                return `<label style="display:flex; align-items:center; gap:8px; padding:5px 0; font-size:12px; ${zatenAtanmis ? 'opacity:0.5;' : ''}">
                    <input type="checkbox" class="milo-atama-chk" value="${miloEsc(u.ad)}" ${zatenAtanmis ? 'checked disabled' : ''}>
                    ${miloEsc(u.ad)} <span style="color:var(--text-muted);">· ${miloEsc(u.grup)}</span>${zatenAtanmis ? ' <span style="color:var(--neon-green); font-size:10px;">(zaten atanmış)</span>' : ''}
                </label>`;
            }).join('') || '<div style="font-size:11px; color:var(--text-muted);">Üye yok.</div>'}
        </div>
        <button onclick="miloDersAtamaOnayla('${miloEsc(d.id)}')" class="milo-btn-full" style="margin-bottom:0;">✅ Seçilenlere Ata</button>
    </div>`;
}

async function miloDersAtamaOnayla(dersId) {
    let secilenler = [...document.querySelectorAll('.milo-atama-chk:checked:not(:disabled)')].map(el => el.value);
    if (!secilenler.length) return showToast('En az bir sporcu seç.', 'warning');
    for (const ad of secilenler) {
        // Zaten bir member_skills kaydı olan sporcu ASLA ezilmez (ozellikle "ogrendi" durumundakiler) —
        // toplu atama sadece hic kaydi olmayanlara "gelisiyor" olarak baslangic durumu ekler.
        let mevcut = miloMemberSkills.find(s => s.ad === ad && s.dersId === dersId);
        if (mevcut) continue;
        await miloApi(`/member-skills/${encodeURIComponent(ad)}/${encodeURIComponent(dersId)}`, { method: 'PUT', body: JSON.stringify({ durum: 'gelisiyor' }) });
    }
    miloMemberSkills = (await miloApi('/member-skills')).skills;
    miloDersAtamaAcikId = null;
    miloDerslerCiz();
    showToast(`✅ ${secilenler.length} sporcuya atandı.`, 'success');
}

function miloDersYazdir(id) {
    let d = miloDersler.find(x => x.id === id); if (!d) return;
    let seviyeEtiket = MILO_SEVIYE_ETIKET[d.seviye] || d.seviye;
    let w = window.open('', '_blank'); if (!w) { showToast('Açılır pencere engellendi.', 'error'); return; }
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${miloEsc(d.baslik)}</title><link rel="icon" href="/favicon.png"></head><body style="font-family:Arial; padding:24px; color:#222;">
        <h2 style="text-align:center; color:#831843; margin:0;">MILO FITT KIDS</h2>
        <h3 style="text-align:center; color:#ec4899; margin:4px 0 16px;">${miloEsc(d.baslik)}</h3>
        <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:16px;" border="1" cellpadding="8">
            <tr><td style="width:140px; font-weight:bold;">Kategori</td><td>${miloEsc(d.kategori || '-')}</td></tr>
            <tr><td style="font-weight:bold;">Seviye</td><td>${miloEsc(seviyeEtiket)}</td></tr>
            <tr><td style="font-weight:bold;">Açıklama</td><td>${miloEsc(d.aciklama || '-')}</td></tr>
            <tr><td style="font-weight:bold;">Kazanım</td><td>${miloEsc(d.kazanim || '-')}</td></tr>
        </table>
        <p style="text-align:center; color:#999; font-size:10px; margin-top:24px;">MILO FITT KIDS ile oluşturuldu · ${new Date().toLocaleString('tr-TR')}</p>
    </body></html>`);
    w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 500);
}

// Secili birden fazla dersi TEK bir yazdirma/PDF ciktisinda toplar — gunluk ders planinda israf
// edilen sayfalari onlemek icin (her ders icin ayri "Yazdir" yerine).
function miloDerslerTopluYazdir() {
    let secili = miloDersler.filter(d => miloDersSeciliIdler.has(d.id));
    if (!secili.length) return showToast('En az bir ders seç.', 'warning');
    let grupMetni = (document.getElementById('milo-ders-toplu-grup') || {}).value || miloDersGrupNotu || '';
    let bugun = new Date().toLocaleDateString('tr-TR');
    let w = window.open('', '_blank'); if (!w) { showToast('Açılır pencere engellendi.', 'error'); return; }
    let icerik = secili.map(d => {
        let seviyeEtiket = MILO_SEVIYE_ETIKET[d.seviye] || d.seviye;
        return `<div style="margin-bottom:18px; padding-bottom:14px; border-bottom:1px dashed #ccc;">
            <h4 style="color:#831843; margin:0 0 4px;">${miloEsc(d.baslik)}</h4>
            <div style="font-size:11px; color:#666; margin-bottom:6px;">${d.kategori ? miloEsc(d.kategori) + ' · ' : ''}${miloEsc(seviyeEtiket)}</div>
            ${d.aciklama ? `<div style="font-size:13px; margin-bottom:4px;">${miloEsc(d.aciklama)}</div>` : ''}
            ${d.kazanim ? `<div style="font-size:12px; color:#059669;">🎯 Kazanım: ${miloEsc(d.kazanim)}</div>` : ''}
        </div>`;
    }).join('');
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Günlük Ders Planı</title><link rel="icon" href="/favicon.png"></head><body style="font-family:Arial; padding:24px; color:#222;">
        <h2 style="text-align:center; color:#831843; margin:0;">MILO FITT KIDS</h2>
        <h3 style="text-align:center; color:#ec4899; margin:4px 0 2px;">Günlük Ders Planı</h3>
        <p style="text-align:center; color:#555; margin:0 0 20px; font-size:12px;">${miloEsc(bugun)}${grupMetni ? ' · ' + miloEsc(grupMetni) : ''} · ${secili.length} ders</p>
        ${icerik}
        <p style="text-align:center; color:#999; font-size:10px; margin-top:24px;">MILO FITT KIDS ile oluşturuldu · ${new Date().toLocaleString('tr-TR')}</p>
    </body></html>`);
    w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (e) {} }, 500);
}

async function miloDersEkle() {
    let baslik = (document.getElementById('milo-df-baslik').value || '').trim();
    let tip = (document.getElementById('milo-df-tip').value || '').trim() || 'genel';
    let seviye = document.getElementById('milo-df-seviye').value || 'baslangic';
    let kategori = (document.getElementById('milo-df-kategori').value || '').trim() || null;
    let aciklama = document.getElementById('milo-df-aciklama').value || null;
    let kazanim = (document.getElementById('milo-df-kazanim').value || '').trim() || null;
    if (!baslik) return showToast('Başlık zorunlu.', 'error');
    await miloApi('/ders-icerikleri', { method: 'POST', body: JSON.stringify({ tip, baslik, seviye, kategori, kazanim, gruplar: ['genel'], aciklama }) });
    miloDersler = (await miloApi('/ders-icerikleri')).dersler;
    miloDerslerCiz();
    showToast('✅ Eklendi.', 'success');
}
async function miloDersSil(id) {
    if (!confirm('Silinsin mi?')) return;
    await miloApi('/ders-icerikleri/' + encodeURIComponent(id), { method: 'DELETE' });
    miloDersler = miloDersler.filter(d => d.id !== id);
    miloDerslerCiz();
}
async function miloDersIsledim(id) {
    await miloApi(`/ders-icerikleri/${encodeURIComponent(id)}/kullanim`, { method: 'POST', body: JSON.stringify({}) });
    miloDersler = (await miloApi('/ders-icerikleri')).dersler;
    miloDerslerCiz();
    showToast('✅ İşaretlendi.', 'success');
}
async function miloDersDegerlendir(id, puan) {
    await miloApi(`/ders-icerikleri/${encodeURIComponent(id)}/degerlendir`, { method: 'POST', body: JSON.stringify({ puan }) });
    miloDersler = (await miloApi('/ders-icerikleri')).dersler;
    miloDerslerCiz();
    showToast('⭐ Değerlendirildi.', 'success');
}

// ===== YAŞ / GRUP YAPISI — Dersler sekmesinin "🗂️ Yaş/Grup Yapısı" alt-görünümü. Gün/saat icin
// mevcut antrenman_programi (Program sekmesi), uye rosteri icin mevcut members.grup AYNEN yeniden
// kullanilir (tek kaynak) — yasKategorileri/gruplar sadece gezinme katalogu, hicbir FK/CHECK yok. =====
function miloGruplarGorunumCiz() {
    let alan = document.getElementById('milo-grup-alt-alani'); if (!alan) return;
    if (miloSeciliGrupId) { miloGrupDetayCiz(); return; }
    if (miloSeciliYasId) { miloYasDetayCiz(); return; }
    alan.innerHTML = `
        <div class="milo-card">
            <input class="milo-input" id="milo-yas-yeni-ad" placeholder="Yeni yaş kategorisi (örn: 3 Yaş)" style="margin-bottom:8px;">
            <button class="milo-btn-full" onclick="miloYasKategorisiEkle()">➕ Yaş Kategorisi Ekle</button>
        </div>
        ${miloYasKategorileri.map(y => {
            let grupSayisi = miloGruplar.filter(g => g.yasKategorisiId === y.id).length;
            return `<div class="milo-card" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="miloSeciliYasId=${y.id}; miloGruplarGorunumCiz();">
                <div><b>${miloEsc(y.ad)}</b> <span style="color:var(--text-muted); font-size:12px;">· ${grupSayisi} grup</span></div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <span style="color:var(--text-muted);">→</span>
                    <button onclick="event.stopPropagation(); miloYasKategorisiSil(${y.id},'${miloJsEsc(y.ad)}')" style="background:var(--neon-red); border:none; color:#fff; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:bold;">🗑️</button>
                </div>
            </div>`;
        }).join('') || '<div style="color:var(--text-muted); font-size:13px;">Henüz yaş kategorisi yok.</div>'}
    `;
}

async function miloYasKategorisiEkle() {
    let ad = (document.getElementById('milo-yas-yeni-ad').value || '').trim();
    if (!ad) return showToast('Ad zorunlu.', 'error');
    await miloApi('/yas-kategorileri', { method: 'POST', body: JSON.stringify({ ad }) });
    miloYasKategorileri = (await miloApi('/yas-kategorileri')).yasKategorileri;
    miloGruplarGorunumCiz();
    showToast('✅ Eklendi.', 'success');
}

async function miloYasKategorisiSil(id, ad) {
    let altGruplar = miloGruplar.filter(g => g.yasKategorisiId === id);
    let grupAdlari = new Set(altGruplar.map(g => g.ad));
    let etkilenenSporcuSayisi = miloUyeler.filter(u => grupAdlari.has(u.grup)).length;
    let mesaj = `"${ad}" yaş kategorisi silinsin mi?`;
    if (etkilenenSporcuSayisi > 0) mesaj += `\n\n⚠️ ${etkilenenSporcuSayisi} sporcu bu gruplardan birini kullanıyor. Sporcuların kendi kaydı, beceri ve devam verisi ETKİLENMEZ — sadece bu gezinme ekranından kaldırılır.`;
    if (!confirm(mesaj)) return;
    await miloApi('/yas-kategorileri/' + id, { method: 'DELETE' });
    miloYasKategorileri = miloYasKategorileri.filter(y => y.id !== id);
    miloGruplar = miloGruplar.filter(g => g.yasKategorisiId !== id);
    miloGruplarGorunumCiz();
    showToast('Silindi.', 'success');
}

function miloYasDetayCiz() {
    let alan = document.getElementById('milo-grup-alt-alani'); if (!alan) return;
    let yas = miloYasKategorileri.find(y => y.id === miloSeciliYasId);
    if (!yas) { miloSeciliYasId = null; miloGruplarGorunumCiz(); return; }
    let gruplar = miloGruplar.filter(g => g.yasKategorisiId === yas.id);
    alan.innerHTML = `
        <button onclick="miloSeciliYasId=null; miloGruplarGorunumCiz();" style="background:var(--bg-panel); border:1px solid var(--border-color); color:var(--text-main); border-radius:8px; padding:6px 14px; font-size:12px; font-weight:bold; margin-bottom:10px;">← Yaş Kategorileri</button>
        <div style="font-weight:900; font-size:15px; margin-bottom:10px;">${miloEsc(yas.ad)}</div>
        <div class="milo-card">
            <input class="milo-input" id="milo-grup-yeni-ad" placeholder="Yeni grup (örn: 1. Grup)" style="margin-bottom:8px;">
            <button class="milo-btn-full" onclick="miloGrupEkle(${yas.id})">➕ Grup Ekle</button>
        </div>
        ${gruplar.map(g => {
            let uyeSayisi = miloUyeler.filter(u => u.grup === g.ad).length;
            return `<div class="milo-card" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="miloGrupAc(${g.id})">
                <div><b>${miloEsc(g.ad)}</b> <span style="color:var(--text-muted); font-size:12px;">· ${uyeSayisi} sporcu</span></div>
                <div style="display:flex; gap:6px; align-items:center;">
                    <span style="color:var(--text-muted);">→</span>
                    <button onclick="event.stopPropagation(); miloGrupSil(${g.id})" style="background:var(--neon-red); border:none; color:#fff; border-radius:6px; padding:5px 10px; font-size:11px; font-weight:bold;">🗑️</button>
                </div>
            </div>`;
        }).join('') || '<div style="color:var(--text-muted); font-size:13px;">Henüz grup yok.</div>'}
    `;
}

async function miloGrupEkle(yasKategorisiId) {
    let ad = (document.getElementById('milo-grup-yeni-ad').value || '').trim();
    if (!ad) return showToast('Ad zorunlu.', 'error');
    await miloApi('/gruplar', { method: 'POST', body: JSON.stringify({ yasKategorisiId, ad }) });
    miloGruplar = (await miloApi('/gruplar')).gruplar;
    miloGruplarGorunumCiz();
    showToast('✅ Eklendi.', 'success');
}

async function miloGrupSil(id) {
    let g = miloGruplar.find(x => x.id === id); if (!g) return;
    let uyeSayisi = miloUyeler.filter(u => u.grup === g.ad).length;
    let mesaj = `"${g.ad}" silinsin mi?`;
    if (uyeSayisi > 0) mesaj += `\n\n⚠️ ${uyeSayisi} sporcu bu grubu kullanıyor. Sporcuların kaydı ETKİLENMEZ — sadece bu gezinme ekranından kaldırılır.`;
    if (!confirm(mesaj)) return;
    await miloApi('/gruplar/' + id, { method: 'DELETE' });
    miloGruplar = miloGruplar.filter(x => x.id !== id);
    miloGruplarGorunumCiz();
    showToast('Silindi.', 'success');
}

async function miloGrupAc(id) {
    miloSeciliGrupId = id;
    miloGrupAtamaAcik = false;
    let g = miloGruplar.find(x => x.id === id); if (!g) return;
    miloGrupDetayProgram = (await miloApi('/antrenman-programi?grup=' + encodeURIComponent(g.ad))).slots;
    miloGruplarGorunumCiz();
}

function miloGrupDetayCiz() {
    let alan = document.getElementById('milo-grup-alt-alani'); if (!alan) return;
    let g = miloGruplar.find(x => x.id === miloSeciliGrupId);
    if (!g) { miloSeciliGrupId = null; miloGruplarGorunumCiz(); return; }
    let yas = miloYasKategorileri.find(y => y.id === g.yasKategorisiId);
    let roster = miloUyeler.filter(u => u.grup === g.ad);
    alan.innerHTML = `
        <button onclick="miloSeciliGrupId=null; miloGruplarGorunumCiz();" style="background:var(--bg-panel); border:1px solid var(--border-color); color:var(--text-main); border-radius:8px; padding:6px 14px; font-size:12px; font-weight:bold; margin-bottom:10px;">← ${miloEsc(yas ? yas.ad : '')}</button>
        <div style="font-weight:900; font-size:15px; margin-bottom:10px;">${miloEsc(g.ad)}</div>
        <div class="milo-card">
            <div style="font-weight:800; font-size:12px; margin-bottom:6px;">📅 Gün / Saat</div>
            ${miloGrupDetayProgram.length ? miloGrupDetayProgram.map(p => `<div style="font-size:13px; padding:4px 0;">${MILO_GUN_ADI[p.gun]} ${p.baslangicSaat}-${p.bitisSaat}</div>`).join('') : '<div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">Henüz saat eklenmedi.</div>'}
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px; margin-top:8px;">
                <select class="milo-input" id="milo-grup-prog-gun" style="margin-bottom:0;">${MILO_GUN_ADI.map((gAdi, i) => `<option value="${i}">${gAdi}</option>`).join('')}</select>
                <input type="time" class="milo-input" id="milo-grup-prog-bas" style="margin-bottom:0;">
                <input type="time" class="milo-input" id="milo-grup-prog-bit" style="margin-bottom:0;">
            </div>
            <button onclick="miloGrupProgramEkle('${miloJsEsc(g.ad)}')" class="milo-btn-full" style="margin-top:8px; margin-bottom:0;">➕ Saat Ekle</button>
        </div>
        <div class="milo-card">
            <div style="font-weight:800; font-size:12px; margin-bottom:6px;">👥 Bu Gruptaki Sporcular (${roster.length})</div>
            ${roster.map(u => `<div style="font-size:13px; padding:4px 0;">${miloEsc(u.ad)}</div>`).join('') || '<div style="font-size:12px; color:var(--text-muted); margin-bottom:8px;">Henüz sporcu yok.</div>'}
            <button onclick="miloGrupAtamaAcikToggle()" style="width:100%; margin-top:8px; background:rgba(59,130,246,0.12); border:1px solid var(--neon-blue); color:var(--neon-blue); border-radius:8px; padding:9px; font-weight:800; font-size:12px; cursor:pointer;">➕ Sporcu Ata</button>
            ${miloGrupAtamaAcik ? miloGrupAtamaFormHTML(g) : ''}
        </div>
    `;
}

async function miloGrupProgramEkle(grupAdi) {
    let gun = Number(document.getElementById('milo-grup-prog-gun').value);
    let bas = document.getElementById('milo-grup-prog-bas').value, bit = document.getElementById('milo-grup-prog-bit').value;
    if (!bas || !bit) return showToast('Başlangıç ve bitiş saati zorunlu.', 'error');
    await miloApi('/antrenman-programi', { method: 'POST', body: JSON.stringify({ grup: grupAdi, gun, baslangicSaat: bas, bitisSaat: bit }) });
    miloGrupDetayProgram = (await miloApi('/antrenman-programi?grup=' + encodeURIComponent(grupAdi))).slots;
    miloGrupDetayCiz();
    showToast('✅ Eklendi.', 'success');
}

function miloGrupAtamaAcikToggle() {
    miloGrupAtamaAcik = !miloGrupAtamaAcik;
    miloGrupAtamaAramaFiltre = '';
    miloGrupDetayCiz();
}

function miloGrupAtamaFormHTML(g) {
    let filtre = miloGrupAtamaAramaFiltre.trim().toLocaleLowerCase('tr');
    let adaylar = miloUyeler.filter(u => !u.pasif && u.grup !== g.ad && (!filtre || u.ad.toLocaleLowerCase('tr').includes(filtre)));
    return `<div style="background:rgba(31,173,160,0.08); border:1px solid var(--milo-teal); border-radius:14px; padding:12px; margin-top:8px;">
        <input class="milo-input" placeholder="🔍 Sporcu ara..." value="${miloEsc(miloGrupAtamaAramaFiltre)}" oninput="miloGrupAtamaAramaFiltre=this.value; miloGrupDetayCiz();">
        <div style="max-height:180px; overflow-y:auto; margin-bottom:8px;">
            ${adaylar.map(u => `<label style="display:flex; align-items:center; gap:8px; padding:5px 0; font-size:12px;">
                <input type="checkbox" class="milo-grup-atama-chk" value="${miloEsc(u.grup)}||${miloEsc(u.ad)}">
                ${miloEsc(u.ad)} <span style="color:var(--text-muted);">· şu an: ${miloEsc(u.grup)}</span>
            </label>`).join('') || '<div style="font-size:11px; color:var(--text-muted);">Uygun sporcu yok.</div>'}
        </div>
        <button onclick="miloGrupAtamaOnayla('${miloJsEsc(g.ad)}')" class="milo-btn-full" style="margin-bottom:0;">✅ Seçilenleri Bu Gruba Ata</button>
    </div>`;
}

// miloUyeKaydet'teki grup-degisim deseniyle BIREBIR ayni: upsert yeni grup + delete eski satir.
// member_skills/attendance_auto/dues SADECE ad ile anahtarli oldugundan hic etkilenmez (veri kaybi yok).
async function miloSporcuyuGrubaAta(eskiGrup, ad, yeniGrupAdi) {
    let u = miloUyeler.find(x => x.grup === eskiGrup && x.ad === ad);
    await miloApi('/members', {
        method: 'POST', body: JSON.stringify({
            grup: yeniGrupAdi, ad, cinsiyet: u ? u.cinsiyet : null, dogumTarihi: u ? u.dogumTarihi : null,
            katilmaTarihi: u ? u.katilmaTarihi : null, aileMeslek: u ? u.aileMeslek : null, acilKisi: u ? u.acilKisi : null,
            acilTelefon: u ? u.acilTelefon : null, antrenmanNotu: u ? u.antrenmanNotu : null, genelNot: u ? u.genelNot : null,
            boy: u ? u.boy : null, kilo: u ? u.kilo : null, saglikNotu: u ? u.saglikNotu : null,
        })
    });
    await miloApi(`/members/${encodeURIComponent(eskiGrup)}/${encodeURIComponent(ad)}`, { method: 'DELETE' });
}

async function miloGrupAtamaOnayla(yeniGrupAdi) {
    let secilenler = [...document.querySelectorAll('.milo-grup-atama-chk:checked')].map(el => el.value.split('||'));
    if (!secilenler.length) return showToast('En az bir sporcu seç.', 'warning');
    for (const [eskiGrup, ad] of secilenler) {
        await miloSporcuyuGrubaAta(eskiGrup, ad, yeniGrupAdi);
    }
    miloUyeler = (await miloApi('/members')).members;
    miloGrupAtamaAcik = false;
    miloGrupDetayCiz();
    showToast(`✅ ${secilenler.length} sporcu atandı.`, 'success');
}

// ===== BECERİ & GELİŞİM — Dersler sekmesindeki hareketleri uyeye bagliyor (salt-okunur JOIN,
// Dersler sekmesinin kendi route/fonksiyonlarina hic dokunulmuyor) =====
function miloSeviyeHesapla(ogrenilenSayisi) {
    if (ogrenilenSayisi >= 8) return 'İleri';
    if (ogrenilenSayisi >= 3) return 'Gelişen';
    return 'Başlangıç';
}
function miloRozetleriHesapla(ogrenilenSayisi, seviye) {
    let rozetler = [];
    if (ogrenilenSayisi >= 1) rozetler.push('🥉 İlk Beceri');
    if (seviye === 'Gelişen' || seviye === 'İleri') rozetler.push('🥈 Gelişen Sporcu');
    if (seviye === 'İleri') rozetler.push('🥇 İleri Seviye');
    if (ogrenilenSayisi >= 5) rozetler.push('⭐ 5 Beceri Ustası');
    return rozetler;
}
function miloDevamSayisiHesapla(u) {
    return miloAttendanceTum.filter(a => a.ad === u.ad && a.geldi).length + (u.devamDuzeltme || 0);
}

// Sıradaki Hedefler — bir üst seviyeye gecmek icin eksik beceriler. Yeni tablo GEREKTIRMEZ,
// miloDersler + member_skills'ten turetilir. src/routes/milo/sporcuGirisi.ts'teki
// siradakiHedefleriHesapla ile BIREBIR ayni esik/mantik (iki yerde senkron tutulur).
const MILO_SEVIYE_KOD = { 'Başlangıç': 'baslangic', 'Gelişen': 'gelisen', 'İleri': 'ileri' };
const MILO_SONRAKI_SEVIYE = { 'Başlangıç': 'Gelişen', 'Gelişen': 'İleri' };
const MILO_SEVIYE_ESIK = { 'Başlangıç': 3, 'Gelişen': 8 };
function miloSiradakiHedefler(ad) {
    let kayitlar = miloMemberSkills.filter(s => s.ad === ad);
    let ogrenilenSayisi = kayitlar.filter(s => s.durum === 'ogrendi').length;
    let seviye = miloSeviyeHesapla(ogrenilenSayisi);
    if (seviye === 'İleri') return { mesaj: '🏆 En üst seviyedesin! Yeni beceriler eklemeye devam et.', dersler: [] };
    let ogrenilenDersIdleri = new Set(kayitlar.filter(s => s.durum === 'ogrendi').map(s => s.dersId));
    let seviyeKodu = MILO_SEVIYE_KOD[seviye];
    let dersler = miloDersler.filter(d => d.seviye === seviyeKodu && !ogrenilenDersIdleri.has(d.id)).slice(0, 6);
    let gerekenSayi = Math.max((MILO_SEVIYE_ESIK[seviye] || 0) - ogrenilenSayisi, 0);
    return { mesaj: `${MILO_SONRAKI_SEVIYE[seviye]} seviyeye geçmek için ${gerekenSayi} beceri daha tamamlaman gerekiyor.`, dersler };
}
function miloSiradakiHedeflerHTML(hedef) {
    return `<div style="background:rgba(31,173,160,0.08); border:1px solid var(--milo-teal); border-radius:14px; padding:12px; margin-bottom:10px;">
        <div style="font-weight:800; font-size:12px; color:var(--milo-teal); margin-bottom:6px;">🎯 Sıradaki Hedefler</div>
        <div style="font-size:12px; margin-bottom:${hedef.dersler.length ? '6px' : '0'};">${miloEsc(hedef.mesaj)}</div>
        ${hedef.dersler.length ? hedef.dersler.map(d => `<div style="font-size:12px; padding:3px 0;">🔸 ${miloEsc(d.baslik)}</div>`).join('') : ''}
    </div>`;
}

function miloBeceriCiz() {
    let alan = document.getElementById('milo-icerik');
    let filtre = miloBeceriAramaFiltre.trim().toLocaleLowerCase('tr');
    let liste = miloUyeler.filter(u => !u.pasif && (!filtre || u.ad.toLocaleLowerCase('tr').includes(filtre)));
    alan.innerHTML = `
        <div style="font-weight:800; font-size:15px; color:var(--milo-teal);">🤸 Beceri Takibi</div>
        <div class="milo-ribbon" style="margin:6px 0 14px;"></div>
        <input class="milo-input" placeholder="🔍 Üye ara..." value="${miloEsc(miloBeceriAramaFiltre)}" oninput="miloBeceriAramaFiltre=this.value; miloBeceriCiz();">
        ${miloDersler.length ? '' : '<div style="color:var(--text-muted); font-size:12px; margin-bottom:10px;">Henüz Dersler sekmesinde tanımlı beceri yok — önce oradan ekleyin.</div>'}
        ${liste.map(u => miloBeceriKartHTML(u)).join('') || '<div style="color:var(--text-muted); font-size:12px;">Üye yok.</div>'}
    `;
}

function miloBeceriKartHTML(u) {
    let kayitlar = miloMemberSkills.filter(s => s.ad === u.ad);
    let ogrenilenSayisi = kayitlar.filter(s => s.durum === 'ogrendi').length;
    let seviye = miloSeviyeHesapla(ogrenilenSayisi);
    let rozetler = miloRozetleriHesapla(ogrenilenSayisi, seviye);
    let devamSayisi = miloDevamSayisiHesapla(u);
    let acikMi = miloBeceriAcikAd === u.ad;
    return `<details class="milo-card" data-ad="${miloEsc(u.ad)}" ${acikMi ? 'open' : ''} ontoggle="miloBeceriAcikAd = this.open ? this.dataset.ad : null;">
        <summary style="cursor:pointer; list-style:none; display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <span style="font-weight:700; font-size:13px;">${miloEsc(u.ad)} <span style="color:var(--text-muted); font-size:11px; font-weight:400;">· ${miloEsc(u.grup)}</span></span>
            <span style="font-size:10px; font-weight:800; padding:3px 8px; border-radius:6px; background:rgba(236,72,153,0.12); border:1px solid var(--neon-pink); color:var(--neon-pink);">${seviye}</span>
        </summary>
        <div style="margin-top:10px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
                <span style="font-size:12px; color:var(--text-muted);">Devam sayısı:</span>
                <b>${devamSayisi}</b>
                <button onclick="miloDevamDuzeltmeAc('${miloJsEsc(u.grup)}','${miloJsEsc(u.ad)}', ${u.devamDuzeltme || 0})" style="font-size:11px; background:var(--bg-panel); border:1px solid var(--border-color); color:var(--text-main); border-radius:6px; padding:4px 8px;">✏️ Düzelt</button>
            </div>
            ${rozetler.length ? `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">${rozetler.map(r => `<span style="background:rgba(234,179,8,0.12); border:1px solid var(--gold); border-radius:20px; padding:4px 10px; font-size:11px; font-weight:700;">${r}</span>`).join('')}</div>` : ''}
            ${miloSiradakiHedeflerHTML(miloSiradakiHedefler(u.ad))}
            <div style="font-weight:800; font-size:12px; margin-bottom:6px;">Beceriler</div>
            ${miloDersler.map(d => {
                let kayit = kayitlar.find(s => s.dersId === d.id);
                let durum = kayit ? kayit.durum : 'henuz_degil';
                return `<div style="display:flex; justify-content:space-between; align-items:center; gap:6px; padding:8px 0; border-bottom:1px solid var(--milo-line);">
                    <div style="font-size:12px; flex:1; min-width:0;">${miloEsc(d.baslik)}</div>
                    <div class="milo-toggle-row" style="margin-top:0; flex-wrap:nowrap;">
                        <button class="milo-toggle sm ${durum === 'henuz_degil' ? 'aktif-degil' : ''}" onclick="miloBeceriDurumDegistir('${miloJsEsc(u.ad)}','${miloEsc(d.id)}','henuz_degil')">Henüz Değil</button>
                        <button class="milo-toggle sm ${durum === 'gelisiyor' ? 'aktif-gelisiyor' : ''}" onclick="miloBeceriDurumDegistir('${miloJsEsc(u.ad)}','${miloEsc(d.id)}','gelisiyor')">Gelişiyor</button>
                        <button class="milo-toggle sm ${durum === 'ogrendi' ? 'aktif-ogrendi' : ''}" onclick="miloBeceriDurumDegistir('${miloJsEsc(u.ad)}','${miloEsc(d.id)}','ogrendi')">Öğrendi</button>
                    </div>
                </div>`;
            }).join('') || '<div style="font-size:11px; color:var(--text-muted);">Dersler sekmesinde henüz beceri tanımlı değil.</div>'}
            <button onclick="miloVeliOzetiKopyala('${miloJsEsc(u.grup)}','${miloJsEsc(u.ad)}')" style="width:100%; margin-top:10px; background:var(--milo-teal); color:#fff; border:none; padding:11px; border-radius:12px; font-weight:800; font-size:12px; cursor:pointer;">📋 Veli Özeti Kopyala</button>
        </div>
    </details>`;
}

async function miloBeceriDurumDegistir(ad, dersId, durum) {
    await miloApi(`/member-skills/${encodeURIComponent(ad)}/${encodeURIComponent(dersId)}`, { method: 'PUT', body: JSON.stringify({ durum }) });
    let kayit = miloMemberSkills.find(s => s.ad === ad && s.dersId === dersId);
    if (kayit) {
        kayit.durum = durum;
    } else {
        let d = miloDersler.find(x => x.id === dersId);
        miloMemberSkills.push({ ad, dersId, durum, guncelleme: Date.now(), baslik: d ? d.baslik : '', tip: d ? d.tip : '', seviye: d ? d.seviye : '' });
    }
    miloBeceriCiz();
}

async function miloDevamDuzeltmeAc(grup, ad, mevcut) {
    let girilen = prompt(`${ad} için devam sayısı düzeltmesi (mevcut: ${mevcut}). Otomatik sayıma eklenecek/çıkarılacak sayıyı gir (örn. 2 veya -1):`, mevcut);
    if (girilen === null) return;
    let deger = parseInt(girilen);
    if (isNaN(deger)) return showToast('Geçerli bir sayı girin.', 'error');
    await miloApi(`/members/${encodeURIComponent(grup)}/${encodeURIComponent(ad)}`, { method: 'PATCH', body: JSON.stringify({ devamDuzeltme: deger }) });
    let u = miloUyeler.find(x => x.grup === grup && x.ad === ad); if (u) u.devamDuzeltme = deger;
    miloBeceriCiz();
    showToast('✅ Devam sayısı güncellendi.', 'success');
}

function miloPanoyaKopyala(metin) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(metin).then(() => showToast('📋 Panoya kopyalandı — WhatsApp\'a yapıştırabilirsiniz.', 'success')).catch(() => miloKopyalaYedek(metin));
    } else {
        miloKopyalaYedek(metin);
    }
}
function miloKopyalaYedek(metin) {
    let ta = document.createElement('textarea');
    ta.value = metin; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); showToast('📋 Panoya kopyalandı.', 'success'); } catch (e) { showToast('Kopyalanamadı.', 'error'); }
    document.body.removeChild(ta);
}

function miloVeliOzetiKopyala(grup, ad) {
    let u = miloUyeler.find(x => x.grup === grup && x.ad === ad); if (!u) return;
    let kayitlar = miloMemberSkills.filter(s => s.ad === ad);
    let ogrenilen = kayitlar.filter(s => s.durum === 'ogrendi').map(s => s.baslik);
    let gelisen = kayitlar.filter(s => s.durum === 'gelisiyor').map(s => s.baslik);
    let devamSayisi = miloDevamSayisiHesapla(u);
    let seviye = miloSeviyeHesapla(ogrenilen.length);
    let metin = `🤸 MILO FITT KIDS — ${ad} Gelişim Özeti\n\n` +
        `Seviye: ${seviye}\n` +
        `Toplam katılım: ${devamSayisi} gün\n` +
        (ogrenilen.length ? `\n✅ Öğrendiği beceriler:\n${ogrenilen.map(b => '- ' + b).join('\n')}\n` : '') +
        (gelisen.length ? `\n🌱 Gelişmekte olduğu beceriler:\n${gelisen.map(b => '- ' + b).join('\n')}\n` : '') +
        (u.genelNot ? `\n📝 Not: ${u.genelNot}\n` : '');
    miloPanoyaKopyala(metin);
}

// ===== SPORCU GİRİŞİ — PIN gerekmez, isim + doğum yılı. Admin #milo-app'tan tamamen bağımsız. =====
function miloSporcuHatirlaKaydet(ad, yil) {
    try { localStorage.setItem('milo_sporcu_hatirla', JSON.stringify({ ad, yil })); } catch (e) {}
}
function miloSporcuHatirlaTemizle() {
    try { localStorage.removeItem('milo_sporcu_hatirla'); } catch (e) {}
}
function miloSporcuHatirlaOku() {
    try {
        let veri = JSON.parse(localStorage.getItem('milo_sporcu_hatirla') || 'null');
        if (veri && veri.ad && veri.yil) {
            document.getElementById('milo-sporcu-giris-ad').value = veri.ad;
            document.getElementById('milo-sporcu-giris-yil').value = veri.yil;
            let btn = document.getElementById('milo-sporcu-hizli-giris-btn'); if (btn) btn.style.display = 'block';
        }
    } catch (e) {}
}
function miloSporcuHizliGiris() { miloSporcuGirisDene(); }

async function miloSporcuGirisDene() {
    let ad = (document.getElementById('milo-sporcu-giris-ad').value || '').trim();
    let yil = (document.getElementById('milo-sporcu-giris-yil').value || '').trim();
    if (!ad || !yil) return showToast('Ad ve doğum yılını gir.', 'warning');
    let veri;
    try {
        let res = await fetch('/api/milo/sporcu-girisi', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ad, dogumYili: yil }) });
        veri = await res.json();
    } catch (e) { return showToast('Sunucuya ulaşılamadı.', 'error'); }
    if (!veri.found) return showToast('Bulunamadı — adını ve doğum yılını kontrol et.', 'error');
    if (document.getElementById('milo-sporcu-hatirla-chk').checked) miloSporcuHatirlaKaydet(ad, yil); else miloSporcuHatirlaTemizle();
    document.getElementById('milo-sporcu-giris').style.display = 'none';
    document.getElementById('milo-sporcu-app').style.display = 'flex';
    miloSporcuProfilCiz(veri.sporcu);
}

function miloSporcuCikisYap() {
    document.getElementById('milo-sporcu-app').style.display = 'none';
    document.getElementById('milo-platform-secim').style.display = 'flex';
}

function miloSporcuProfilCiz(s) {
    let alan = document.getElementById('milo-sporcu-icerik');
    alan.innerHTML = `
        <div style="text-align:center; margin-bottom:14px;">
            <div class="milo-logo" style="font-size:24px;">Merhaba ${miloEsc(s.ad.split(' ')[0])}! 👋</div>
            <div style="font-size:13px; color:var(--milo-ink-dim); margin-top:2px;">${miloEsc(s.grup)}</div>
            <div class="milo-ribbon"></div>
        </div>
        <div class="milo-stat-card" style="background:var(--milo-grape); margin-bottom:10px;">
            <div style="font-size:13px; opacity:0.85; margin-bottom:2px;">Seviyeniz</div>
            <b style="font-size:24px;">${miloEsc(s.seviye)}</b>
        </div>
        <div class="milo-stat-card" style="background:var(--milo-coral); margin-bottom:10px;">
            <b>${s.devamSayisi}</b>
            <div style="font-size:12px; opacity:0.9;">gün antrenmana geldin 🎉</div>
        </div>
        ${s.grupBilgisi ? `<div class="milo-card">
            <div style="font-weight:800; margin-bottom:8px;">📅 Grubun</div>
            <div style="font-size:13px;">${miloEsc(s.grupBilgisi.yasKategorisi)} · ${miloEsc(s.grupBilgisi.grup)}</div>
            ${s.grupBilgisi.program.length ? `<div style="font-size:13px; color:var(--text-muted); margin-top:4px;">${s.grupBilgisi.program.map(p => `${MILO_GUN_ADI[p.gun]} ${p.baslangicSaat}-${p.bitisSaat}`).join(' · ')}</div>` : ''}
        </div>` : ''}
        ${s.rozetler && s.rozetler.length ? `<div class="milo-card">
            <div style="font-weight:800; margin-bottom:8px;">🏅 Rozetlerin</div>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">${s.rozetler.map(r => `<span style="background:rgba(236,72,153,0.12); border:1px solid var(--neon-pink); border-radius:20px; padding:6px 12px; font-size:12px; font-weight:700;">${miloEsc(r)}</span>`).join('')}</div>
        </div>` : ''}
        ${s.siradakiHedefler ? `<div class="milo-card">
            <div style="font-weight:800; color:var(--neon-blue); margin-bottom:8px;">🎯 Sıradaki Hedeflerin</div>
            <div style="font-size:13px; margin-bottom:${s.siradakiHedefler.dersler.length ? '8px' : '0'};">${miloEsc(s.siradakiHedefler.mesaj)}</div>
            ${s.siradakiHedefler.dersler.map(d => `<div style="padding:4px 0; font-size:13px;">🔸 ${miloEsc(d.baslik)}</div>`).join('')}
        </div>` : ''}
        <div class="milo-card">
            <div style="font-weight:800; color:var(--neon-green); margin-bottom:8px;">✅ Öğrendiğin Beceriler</div>
            ${s.ogrenilenBeceriler && s.ogrenilenBeceriler.length ? s.ogrenilenBeceriler.map(b => `<div style="padding:6px 0; font-size:14px;">🌟 ${miloEsc(b)}</div>`).join('') : '<div style="font-size:12px; color:var(--text-muted);">Henüz yok — çalışmaya devam! 💪</div>'}
        </div>
        <div class="milo-card">
            <div style="font-weight:800; color:var(--gold); margin-bottom:8px;">🌱 Gelişmekte Olduğun Beceriler</div>
            ${s.gelisenBeceriler && s.gelisenBeceriler.length ? s.gelisenBeceriler.map(b => `<div style="padding:6px 0; font-size:14px;">🔸 ${miloEsc(b)}</div>`).join('') : '<div style="font-size:12px; color:var(--text-muted);">Yok.</div>'}
        </div>
        ${s.antrenorNotu ? `<div class="milo-card">
            <div style="font-weight:800; color:var(--neon-blue); margin-bottom:8px;">📝 Antrenörünün Notu</div>
            <div style="font-size:13px;">${miloEsc(s.antrenorNotu)}</div>
        </div>` : ''}
    `;
}
