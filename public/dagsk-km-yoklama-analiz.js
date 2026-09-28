/* ================================================================================================
   📊 YOKLAMA ANALİZİ — Karışık Sınıf (2026-09-28)
   Kullanıcı: "bu hafta kimler gelmiş, kaç kişi var kulüpte, kim hangi derste, şu an hangi ders işleniyor
   gibi analizleri de yapan bir geliştirme yap karışık sınıfa."
   Veri: otomatikYoklamaDB (son ~90 gün; eskisi sunucu arşivinde), turnuvaDB (sporcular), ders programı
   (/api/antrenman-programi: günler, saat, kayıtlı sporcular, kapasite, iptal günleri, ders planı notu).
   Tamamen okuma amaçlı — hiçbir kayıt değiştirmez. app.js genellerini kullanır (esc, turnuvaDB,
   otomatikYoklamaDB, kmAracSec).
   ================================================================================================ */
const KM_YA_GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const KM_YA_GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const KM_YA_GRUP_AD = { buyukler: 'Büyükler', yildizlar: 'Yıldızlar', kucukler: 'Küçükler', minikler: 'Minikler' };
let _kmYa = { hafta: 0, gun: null, gorunum: 'ders', filtre: 'hepsi', ara: '', secili: null, slotlar: null, yukleniyor: false, duzenle: null, ekleAra: '', misafirAra: '' };
let _kmYaTimer = null;

function kmYaCss() {
    if (document.getElementById('km-ya-css')) return;
    let st = document.createElement('style'); st.id = 'km-ya-css';
    st.textContent = `
.ya { display:flex; flex-direction:column; gap:14px; }
.ya-ust { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.ya-baslik { font-size:20px; font-weight:900; color:var(--text-primary); }
.ya-alt { font-size:12.5px; color:var(--text-secondary); line-height:1.45; }
.ya-kart { border:1px solid var(--border-color); border-radius:16px; background:var(--surface-1); padding:14px; display:flex; flex-direction:column; gap:10px; }
.ya-etiket { font-size:11px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--text-secondary); }
.ya-hafta { display:flex; align-items:center; gap:6px; }
.ya-hafta button { min-width:40px; min-height:40px; border-radius:10px; border:1px solid var(--border-color); background:var(--surface-1); color:var(--text-primary); font-weight:900; cursor:pointer; }
.ya-hafta button:disabled { opacity:.35; cursor:default; }
.ya-hafta span { font-weight:800; color:var(--text-primary); font-size:13.5px; min-width:150px; text-align:center; }
.ya-simdi { border-radius:18px; padding:16px; display:flex; flex-direction:column; gap:10px; border:1.5px solid var(--status-success); background:color-mix(in srgb, var(--status-success) 9%, var(--surface-1)); }
.ya-simdi.bos { border-color:var(--border-color); background:var(--surface-1); }
.ya-canli { display:inline-flex; align-items:center; gap:6px; font-size:11.5px; font-weight:900; letter-spacing:.08em; color:var(--status-success); }
.ya-canli::before { content:''; width:9px; height:9px; border-radius:50%; background:var(--status-success); animation:yaNabiz 1.4s ease-in-out infinite; }
@keyframes yaNabiz { 50% { opacity:.3; } }
.ya-simdi-ad { font-size:22px; font-weight:900; color:var(--text-primary); line-height:1.2; }
.ya-bar { height:8px; border-radius:4px; background:var(--surface-2); overflow:hidden; }
.ya-bar i { display:block; height:100%; background:var(--status-success); border-radius:4px; }
.ya-sayilar { display:grid; grid-template-columns:repeat(auto-fill, minmax(150px, 1fr)); gap:10px; }
.ya-sayi { border-radius:14px; background:var(--surface-2); padding:12px; display:flex; flex-direction:column; gap:2px; }
.ya-sayi b { font-size:28px; font-weight:900; color:var(--text-primary); font-variant-numeric:tabular-nums; line-height:1.1; }
.ya-sayi small { font-size:11.5px; color:var(--text-secondary); font-weight:700; }
.ya-sayi span { font-size:11.5px; color:var(--text-secondary); }
.ya-cipler { display:flex; gap:6px; flex-wrap:wrap; }
.ya-cip { display:inline-flex; align-items:center; gap:5px; padding:5px 11px; border-radius:999px; font-size:12.5px; font-weight:700; border:1px solid var(--border-color); color:var(--text-primary); background:var(--surface-2); }
.ya-cip.geldi { border-color:color-mix(in srgb, var(--status-success) 60%, transparent); background:color-mix(in srgb, var(--status-success) 14%, transparent); }
.ya-cip.gelmedi { border-color:color-mix(in srgb, var(--status-danger) 50%, transparent); background:color-mix(in srgb, var(--status-danger) 10%, transparent); }
.ya-cip.bos { opacity:.65; }
.ya-cip small { color:var(--text-secondary); font-weight:600; }
.ya-grafik { display:flex; gap:8px; align-items:flex-end; height:150px; padding-top:18px; }
.ya-gun { flex:1; display:flex; flex-direction:column; align-items:center; gap:6px; height:100%; justify-content:flex-end; cursor:pointer; background:none; border:none; padding:0; color:var(--text-primary); }
.ya-gun .sut { width:100%; max-width:56px; border-radius:8px 8px 3px 3px; background:color-mix(in srgb, var(--accent) 55%, transparent); position:relative; min-height:4px; }
.ya-gun .sut em { position:absolute; top:-18px; left:0; right:0; text-align:center; font-style:normal; font-size:12px; font-weight:900; color:var(--text-primary); }
.ya-gun.bugun .sut { background:var(--accent); box-shadow:0 0 14px color-mix(in srgb, var(--accent) 50%, transparent); }
.ya-gun.secili .sut { outline:2px solid var(--text-primary); outline-offset:2px; }
.ya-gun small { font-size:11.5px; font-weight:800; color:var(--text-secondary); }
.ya-gun.gelecek .sut { background:var(--surface-2); }
.ya-ders { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:12px; align-items:center; padding:10px 12px; border-radius:14px; background:var(--surface-2); }
.ya-ders .saat { font-size:13px; font-weight:900; color:var(--text-primary); font-variant-numeric:tabular-nums; text-align:center; min-width:62px; }
.ya-ders .saat small { display:block; font-size:10.5px; color:var(--text-secondary); font-weight:700; }
.ya-ders b { font-size:14px; color:var(--text-primary); }
.ya-ders .ya-alt { font-size:11.5px; }
.ya-ders .oran { font-size:18px; font-weight:900; color:var(--text-primary); font-variant-numeric:tabular-nums; text-align:right; }
.ya-ders .oran small { display:block; font-size:10.5px; color:var(--text-secondary); font-weight:700; }
.ya-ders.simdi { box-shadow:0 0 0 2px var(--status-success); }
.ya-ders.gecti { opacity:.75; }
.ya-filtre { display:flex; gap:6px; flex-wrap:wrap; }
.ya-filtre button { min-height:36px; padding:0 12px; border-radius:999px; border:1.5px solid var(--border-color); background:var(--surface-1); color:var(--text-primary); font-weight:800; font-size:12.5px; cursor:pointer; }
.ya-filtre button.aktif { background:var(--accent); border-color:var(--accent); color:var(--text-on-accent-dark, #0b0f1c); }
.ya-ara { min-height:40px; padding:0 14px; border-radius:12px; border:1px solid var(--border-color); background:var(--surface-1); color:var(--text-primary); font-size:14px; width:100%; max-width:320px; box-sizing:border-box; }
.ya-liste { display:flex; flex-direction:column; gap:6px; }
.ya-sporcu { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:10px; align-items:center; padding:9px 12px; border-radius:12px; background:var(--surface-2); border:none; text-align:left; cursor:pointer; color:var(--text-primary); width:100%; }
.ya-sporcu:hover { outline:1.5px solid var(--accent); }
.ya-av { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:13px; color:#fff; }
.ya-sporcu b { font-size:13.5px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ya-sporcu small { font-size:11.5px; color:var(--text-secondary); }
.ya-simdi-satir { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; font-size:15px; color:var(--text-primary); }
.ya-simdi-satir b { font-size:17px; font-weight:900; }
.ya-sekmeler { display:flex; gap:6px; padding:4px; border-radius:14px; background:var(--surface-2); }
.ya-sekmeler button { flex:1; min-height:42px; border:none; border-radius:10px; background:none; color:var(--text-secondary); font-weight:800; font-size:13.5px; cursor:pointer; }
.ya-sekmeler button.aktif { background:var(--surface-1); color:var(--text-primary); box-shadow:0 0 0 1.5px var(--accent); }
.ya-gunler { display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:6px; }
.ya-gunler button { display:flex; flex-direction:column; align-items:center; gap:1px; padding:8px 2px; border-radius:12px; border:1.5px solid var(--border-color); background:var(--surface-1); color:var(--text-primary); cursor:pointer; }
.ya-gunler button b { font-size:13px; font-weight:900; }
.ya-gunler button small { font-size:16px; font-weight:900; font-variant-numeric:tabular-nums; }
.ya-gunler button em { font-style:normal; font-size:10.5px; font-weight:700; color:var(--text-secondary); }
.ya-gunler button.bugun { border-color:color-mix(in srgb, var(--accent) 60%, transparent); }
.ya-gunler button.aktif { background:var(--accent); border-color:var(--accent); color:var(--text-on-accent-dark, #0b0f1c); }
.ya-gunler button.aktif em { color:inherit; opacity:.8; }
.ya-dkart { border:1px solid var(--border-color); border-radius:16px; background:var(--surface-1); padding:12px; display:flex; flex-direction:column; gap:10px; }
.ya-dkart.simdi { border:1.5px solid var(--status-success); background:color-mix(in srgb, var(--status-success) 7%, var(--surface-1)); }
.ya-dkart.iptal { opacity:.7; }
.ya-kisi.ya-yk { cursor:default; padding:6px 6px 6px 10px; }
.ya-kisi.ya-yk.geldi { box-shadow:inset 3px 0 0 var(--status-success); }
.ya-kisi.ya-yk.gelmedi { box-shadow:inset 3px 0 0 var(--status-danger); }
.ya-kisi-ad { grid-column:1 / 3; display:flex; align-items:center; gap:10px; min-width:0; padding:0; background:none; border:none; color:inherit; font:inherit; cursor:pointer; text-align:left; }
.ya-yk-sec { display:flex; gap:4px; }
.ya-kisiler:has(.ya-yk) { grid-template-columns:repeat(auto-fill, minmax(380px, 1fr)); }
.ya-av { flex-shrink:0; }
.ya-yk-sec button { min-height:38px; padding:0 10px; border-radius:10px; border:1.5px solid var(--border-color); background:var(--surface-1); color:var(--text-secondary); font-weight:800; font-size:12.5px; cursor:pointer; white-space:nowrap; }
.ya-yk-sec button.g.aktif { background:var(--status-success); border-color:var(--status-success); color:#fff; }
.ya-yk-sec button.y.aktif { background:var(--status-danger); border-color:var(--status-danger); color:#fff; }
.ya-dkart.duzenle { border:1.5px solid var(--accent); opacity:1; }
.ya-ekle { display:flex; flex-direction:column; gap:8px; padding:10px; border-radius:12px; background:color-mix(in srgb, var(--accent) 8%, var(--surface-1)); border:1px dashed color-mix(in srgb, var(--accent) 50%, transparent); }
.ya-ekle .ya-ara { max-width:none; }
.ya-cikar { min-height:32px; padding:0 10px; border-radius:999px; border:1px solid color-mix(in srgb, var(--status-danger) 50%, transparent); background:color-mix(in srgb, var(--status-danger) 12%, transparent); color:var(--status-danger); font-weight:800; font-size:12px; cursor:pointer; white-space:nowrap; }
.ya-dders-ekle { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.ya-dders-ekle select { min-height:40px; padding:0 10px; border-radius:11px; border:1px solid var(--border-color); background:var(--surface-1); color:var(--text-primary); font-size:13.5px; max-width:100%; }
.ya-dbas { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.ya-dsaat { font-size:20px; font-weight:900; color:var(--text-primary); font-variant-numeric:tabular-nums; line-height:1.1; text-align:center; padding:6px 10px; border-radius:12px; background:var(--surface-2); }
.ya-dsaat small { display:block; font-size:11px; font-weight:700; color:var(--text-secondary); }
.ya-dad { font-size:17px; font-weight:900; color:var(--text-primary); display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.ya-sayac { font-size:13px; font-weight:700; color:var(--text-secondary); white-space:nowrap; }
.ya-sayac b { font-size:20px; font-weight:900; color:var(--status-success); font-variant-numeric:tabular-nums; }
.ya-kisiler { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:6px; }
.ya-kisi { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:10px; align-items:center; padding:7px 10px; border-radius:12px; background:var(--surface-2); border:none; text-align:left; cursor:pointer; color:var(--text-primary); width:100%; }
.ya-kisi:hover, .ya-trow:hover { outline:1.5px solid var(--accent); }
.ya-kisi b { font-size:14px; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ya-kisi small { font-size:11px; color:var(--text-secondary); }
.ya-durum { display:inline-flex; align-items:center; padding:4px 9px; border-radius:999px; font-size:12px; font-weight:800; white-space:nowrap; }
.ya-durum.g { color:var(--status-success); background:color-mix(in srgb, var(--status-success) 15%, transparent); }
.ya-durum.y { color:var(--status-danger); background:color-mix(in srgb, var(--status-danger) 13%, transparent); }
.ya-durum.b { color:var(--text-secondary); background:var(--surface-1); }
.ya-thead, .ya-trow { display:grid; grid-template-columns:minmax(150px,1.2fr) minmax(0,2fr) 100px 110px; gap:10px; align-items:center; }
.ya-thead { padding:0 10px; font-size:11px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--text-secondary); }
.ya-trow { padding:8px 10px; border-radius:12px; background:var(--surface-2); border:none; text-align:left; cursor:pointer; color:var(--text-primary); width:100%; }
.ya-tad { display:flex; align-items:center; gap:10px; min-width:0; }
.ya-tad b { font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ya-tders { display:flex; gap:4px; flex-wrap:wrap; min-width:0; }
.ya-dcip { padding:3px 8px; border-radius:8px; font-size:12px; font-weight:700; background:var(--surface-1); border:1px solid var(--border-color); }
.ya-tson { font-size:12.5px; font-weight:700; }
.ya-tson small { display:none; color:var(--text-secondary); font-weight:600; }
.ya-tgrup { display:flex; align-items:center; gap:8px; margin-top:6px; font-size:14px; font-weight:900; color:var(--text-primary); }
.ya-tgrup i { width:10px; height:10px; border-radius:50%; }
.ya-tgrup small { font-weight:600; color:var(--text-secondary); font-size:12px; }
.ya-takvim { display:grid; grid-template-columns:auto repeat(7, minmax(0,1fr)); gap:4px; font-size:11px; color:var(--text-secondary); align-items:center; }
.ya-takvim span { text-align:center; font-weight:800; }
.ya-takvim i { aspect-ratio:1; border-radius:6px; background:var(--surface-2); display:block; max-width:34px; width:100%; justify-self:center; }
.ya-takvim i.g { background:var(--status-success); }
.ya-takvim i.y { background:color-mix(in srgb, var(--status-danger) 55%, transparent); }
.ya-takvim i.d { box-shadow:inset 0 0 0 2px color-mix(in srgb, var(--accent) 70%, transparent); }
.ya-trend { display:flex; gap:6px; align-items:flex-end; height:110px; padding-top:16px; }
.ya-trend div { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:4px; height:100%; }
.ya-trend .sut { width:100%; max-width:40px; border-radius:6px 6px 2px 2px; background:color-mix(in srgb, var(--status-info, #0ea5e9) 60%, transparent); position:relative; min-height:3px; }
.ya-trend .sut.bu { background:var(--status-info, #0ea5e9); }
.ya-trend .sut em { position:absolute; top:-16px; left:0; right:0; text-align:center; font-style:normal; font-size:11px; font-weight:900; color:var(--text-primary); }
.ya-trend small { font-size:10px; font-weight:700; color:var(--text-secondary); }
.ya-btn { min-height:40px; padding:0 14px; border-radius:11px; border:1.5px solid var(--border-color); background:var(--surface-1); color:var(--text-primary); font-weight:800; font-size:13px; cursor:pointer; }
.ya-btn.birincil { background:var(--status-success); border-color:var(--status-success); color:#fff; }
@media (max-width: 640px) { .ya-grafik { gap:4px; } .ya-ders { grid-template-columns:auto minmax(0,1fr); } .ya-ders .oran { grid-column:1 / -1; text-align:left; } .ya-hafta span { min-width:120px; font-size:12.5px; }
    .ya-thead { display:none; } .ya-trow { grid-template-columns:minmax(0,1fr) auto; } .ya-tders { grid-column:1 / -1; order:3; } .ya-tson { grid-column:1 / -1; order:4; } .ya-tson small { display:inline; }
    .ya-gunler { gap:3px; } .ya-gunler button em { font-size:9.5px; } .ya-sekmeler button { font-size:12px; } .ya-kisiler, .ya-kisiler:has(.ya-yk) { grid-template-columns:1fr; } .ya-yk-sec button { padding:0 8px; font-size:12px; } }
@media (prefers-reduced-motion: reduce) { .ya-canli::before { animation:none; } }
`;
    document.head.appendChild(st);
}

// ---------------------------------------------------------------- tarih yardımcıları (yerel saat, UTC'ye kaymaz)
function kmYaIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function kmYaHaftaBasi(ofset) { let d = new Date(); d.setHours(12, 0, 0, 0); let gun = (d.getDay() + 6) % 7; d.setDate(d.getDate() - gun + ofset * 7); return d; }
function kmYaHaftaGunleri(ofset) { let b = kmYaHaftaBasi(ofset); return Array.from({ length: 7 }, (_, i) => { let d = new Date(b); d.setDate(b.getDate() + i); return d; }); }
function kmYaDk(saat) { let p = String(saat || '0:0').split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
function kmYaTarihYazi(d) { return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }); }

// ---------------------------------------------------------------- veri
function kmYaSporcular() {
    let out = [];
    Object.keys(turnuvaDB || {}).forEach(g => {
        let db = turnuvaDB[g]; if (!db || typeof db !== 'object') return;
        Object.keys(db).forEach(ad => { let sp = db[ad]; if (!sp || sp.pasif || sp.donduruldu) return; out.push({ g, ad }); });
    });
    return out;
}
// Bir sporcunun o günkü kaydı: 'g' geldi, 'y' gelmedi işaretli, null yok. Aynı isim başka grupta varsa grup eşleşmesi aranır.
function kmYaDurum(k, iso) {
    let gun = otomatikYoklamaDB && otomatikYoklamaDB[iso]; if (!gun) return null;
    let r = gun[k.ad]; if (!r) return null;
    if (r.grup && r.grup !== k.g && turnuvaDB[r.grup] && turnuvaDB[r.grup][k.ad]) return null;
    return r.geldi === false ? 'y' : 'g';
}
function kmYaSlotYukle(sonra) {
    if (_kmYa.yukleniyor) return;
    _kmYa.yukleniyor = true;
    fetch('/api/antrenman-programi').then(r => r.json()).then(d => { _kmYa.slotlar = d.slots || []; try { _programSlotlar = _kmYa.slotlar; } catch (e) {} })
        .catch(() => { if (!_kmYa.slotlar) _kmYa.slotlar = []; }).then(() => { _kmYa.yukleniyor = false; if (sonra) sonra(); });
}
function kmYaSlotAd(s) { return (s.grup || 'Ders'); }
function kmYaSlotGunler(s) { return (s.gunler && s.gunler.length ? s.gunler : [s.gun]).map(Number); }
function kmYaIptalMi(s, iso) { return (s.istisnalar || []).some(i => i.tarih === iso); }
function kmYaSlotSporcu(s) { return (s.katilimcilar || []).filter(k => turnuvaDB[k.grup] && turnuvaDB[k.grup][k.ad]).map(k => ({ g: k.grup, ad: k.ad })); }
function kmYaRenk(g) { return { buyukler: '#2563eb', yildizlar: '#f59e0b', kucukler: '#16a34a', minikler: '#8b5cf6' }[g] || '#64748b'; }
function kmYaIlkHarf(ad) { return String(ad || '?').trim().split(/\s+/).map(x => x[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR'); }

// ---------------------------------------------------------------- çizim
// 2026-09-28 sadeleştirme — kullanıcı: "karışık olmuş, kimin kim olduğu, hangi derste olduğu anlaşılır olsun".
// Üç sekme: 📅 Dersler (varsayılan: seçili günün her dersi + o derse kayıtlı sporcuların isim listesi ve geldi/gelmedi),
// 👥 Sporcular (grup grup tablo: kim, hangi derste, bu hafta kaç gün, son geliş), 📊 Sayılar (özet + grafikler).
function kmYoklamaAnalizCiz() {
    kmYaCss();
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    clearInterval(_kmYaTimer); _kmYaTimer = null;
    if (_kmYa.slotlar === null) { ic.innerHTML = '<div class="ya"><div class="ya-baslik">📊 Yoklama</div><div class="ya-alt">Ders programı yükleniyor…</div></div>'; kmYaSlotYukle(kmYoklamaAnalizCiz); return; }
    if (_kmYa.secili) { ic.innerHTML = kmYaSporcuDetayHTML(); return; }
    let gunler = kmYaHaftaGunleri(_kmYa.hafta), bugun = kmYaIso(new Date());
    let isoler = gunler.map(kmYaIso), sporcular = kmYaSporcular();
    if (_kmYa.gun === null) { let i = isoler.indexOf(bugun); _kmYa.gun = i >= 0 ? i : 0; }
    let gor = _kmYa.gorunum || 'ders';
    let haftaYazi = _kmYa.hafta === 0 ? 'Bu hafta' : (_kmYa.hafta === -1 ? 'Geçen hafta' : Math.abs(_kmYa.hafta) + ' hafta önce');
    let sekme = (id, ad) => `<button class="${gor === id ? 'aktif' : ''}" onclick="kmYaGorunum('${id}')">${ad}</button>`;
    let govde = gor === 'sporcu' ? kmYaSporcuTabloHTML(sporcular, isoler) : gor === 'sayilar' ? kmYaSayilarHTML(sporcular, gunler, isoler, bugun) : kmYaGunDersleriHTML(sporcular, gunler, isoler, bugun);
    ic.innerHTML = `<div class="ya">
        <div class="ya-ust"><div><div class="ya-baslik">📊 Yoklama</div><div class="ya-alt">Hangi derste kim var, kim geldi, kim gelmedi.</div></div>
            <div class="ya-hafta"><button onclick="kmYaHafta(-1)" aria-label="Önceki hafta" ${_kmYa.hafta <= -12 ? 'disabled' : ''}>‹</button><span>${haftaYazi}<br><small style="font-weight:600; color:var(--text-secondary)">${kmYaTarihYazi(gunler[0])} – ${kmYaTarihYazi(gunler[6])}</small></span><button onclick="kmYaHafta(1)" aria-label="Sonraki hafta" ${_kmYa.hafta >= 0 ? 'disabled' : ''}>›</button></div></div>
        ${_kmYa.hafta === 0 ? kmYaSimdiHTML(sporcular) : ''}
        <div class="ya-sekmeler" role="tablist">${sekme('ders', '📅 Dersler')}${sekme('sporcu', '👥 Sporcular')}${sekme('sayilar', '📊 Sayılar')}</div>
        ${govde}
    </div>`;
    if (_kmYa.hafta === 0) _kmYaTimer = setInterval(() => { let el = document.getElementById('ya-simdi'); if (!el) { clearInterval(_kmYaTimer); _kmYaTimer = null; return; } el.outerHTML = kmYaSimdiHTML(kmYaSporcular()); }, 30000);
}
// Üstte tek satırlık "şu an" şeridi — ayrıntılı isim listesi Dersler sekmesinde.
function kmYaSimdiHTML(sporcular) {
    let now = new Date(), bugun = kmYaIso(now), dk = now.getHours() * 60 + now.getMinutes(), g = now.getDay();
    let slotlar = (_kmYa.slotlar || []);
    let aktif = slotlar.filter(s => kmYaSlotGunler(s).includes(g) && !kmYaIptalMi(s, bugun) && dk >= kmYaDk(s.baslangicSaat) && dk < kmYaDk(s.bitisSaat));
    if (aktif.length) {
        return `<div class="ya-simdi" id="ya-simdi">${aktif.map(s => {
            let kayitli = kmYaSlotSporcu(s), geldi = kayitli.filter(k => kmYaDurum(k, bugun) === 'g').length;
            return `<div class="ya-simdi-satir"><span class="ya-canli">ŞU AN</span><b>${esc(kmYaSlotAd(s))}</b><span>${s.baslangicSaat}–${s.bitisSaat}</span><span class="ya-alt">${geldi}/${kayitli.length} geldi · ${kmYaDk(s.bitisSaat) - dk} dk kaldı</span></div>`;
        }).join('')}<div style="display:flex; gap:8px; flex-wrap:wrap"><button class="ya-btn birincil" onclick="kmYaBugun(true)">✅ Yoklamayı al</button></div></div>`;
    }
    let sonraki = null;
    for (let i = 0; i < 8 && !sonraki; i++) {
        let d = new Date(now); d.setDate(now.getDate() + i); let iso = kmYaIso(d), gd = d.getDay();
        slotlar.filter(s => kmYaSlotGunler(s).includes(gd) && !kmYaIptalMi(s, iso) && (i > 0 || kmYaDk(s.baslangicSaat) > dk)).sort((a, b) => kmYaDk(a.baslangicSaat) - kmYaDk(b.baslangicSaat)).slice(0, 1).forEach(s => { sonraki = { s, i, d }; });
    }
    let bugunGelen = sporcular.filter(k => kmYaDurum(k, bugun) === 'g').length;
    return `<div class="ya-simdi bos" id="ya-simdi"><div class="ya-simdi-satir"><b>Şu an ders yok</b>${bugunGelen ? `<span class="ya-alt">bugün ${bugunGelen} kişi geldi</span>` : ''}</div>
        ${sonraki ? `<div class="ya-alt">Sıradaki: <b style="color:var(--text-primary)">${esc(kmYaSlotAd(sonraki.s))}</b> — ${sonraki.i === 0 ? 'bugün' : sonraki.i === 1 ? 'yarın' : KM_YA_GUN[sonraki.d.getDay()]} ${sonraki.s.baslangicSaat} · ${kmYaSlotSporcu(sonraki.s).length} kayıtlı sporcu</div>` : ''}</div>`;
}
// Bir sporcu satırı: yuvarlak baş harf + ad + grup + sağda durum etiketi.
// cikarSlot verilirse (düzenleme modu) satır profil açmaz, sağda kalıcı "Çıkar" düğmesi çıkar.
function kmYaKisiHTML(k, durum, saat, cikarSlot, yIso) {
    let etiket = durum === 'g' ? `<span class="ya-durum g">✓ Geldi${saat ? ' · ' + esc(saat) : ''}</span>`
        : durum === 'y' ? '<span class="ya-durum y">✗ Gelmedi</span>'
        : durum === 'bekle' ? '<span class="ya-durum b">Bekleniyor</span>'
        : durum === 'isaretsiz' ? '<span class="ya-durum b">İşaretlenmedi</span>' : '';
    if (cikarSlot != null) return `<div class="ya-kisi"><span class="ya-av" style="background:${kmYaRenk(k.g)}">${esc(kmYaIlkHarf(k.ad))}</span>
        <span style="min-width:0"><b>${esc(k.ad)}</b><small>${KM_YA_GRUP_AD[k.g] || esc(k.g)}</small></span><button class="ya-cikar" onclick="kmYaCikar(${cikarSlot}, '${kmYaKey(k.g, k.ad)}')">✕ Çıkar</button></div>`;
    // yIso verilirse: satırda açık "✅ Geldi / ❌ Gelmedi" düğmeleri (etkin olana tekrar dokunmak işareti kaldırır).
    if (yIso) {
        let key = kmYaKey(k.g, k.ad), c = y => `kmYaYoklama('${yIso}', '${key}', '${durum === y ? 'sil' : y}')`;
        return `<div class="ya-kisi ya-yk ${durum === 'g' ? 'geldi' : durum === 'y' ? 'gelmedi' : ''}"><button class="ya-kisi-ad" onclick="kmYaSporcuAc('${key}')"><span class="ya-av" style="background:${kmYaRenk(k.g)}">${esc(kmYaIlkHarf(k.ad))}</span>
            <span style="min-width:0"><b>${esc(k.ad)}</b><small>${KM_YA_GRUP_AD[k.g] || esc(k.g)}${durum === 'g' && saat ? ' · ' + esc(saat) : ''}</small></span></button>
            <span class="ya-yk-sec" role="group" aria-label="${esc(k.ad)} yoklama"><button class="g${durum === 'g' ? ' aktif' : ''}" aria-pressed="${durum === 'g'}" onclick="${c('g')}">✅ Geldi</button><button class="y${durum === 'y' ? ' aktif' : ''}" aria-pressed="${durum === 'y'}" onclick="${c('y')}">❌ Gelmedi</button></span></div>`;
    }
    return `<button class="ya-kisi" onclick="kmYaSporcuAc('${kmYaKey(k.g, k.ad)}')"><span class="ya-av" style="background:${kmYaRenk(k.g)}">${esc(kmYaIlkHarf(k.ad))}</span>
        <span style="min-width:0"><b>${esc(k.ad)}</b><small>${KM_YA_GRUP_AD[k.g] || esc(k.g)}</small></span>${etiket}</button>`;
}
function kmYaGunDersleriHTML(sporcular, gunler, isoler, bugun) {
    let slotlar = _kmYa.slotlar || [], dk = new Date().getHours() * 60 + new Date().getMinutes();
    let gunCip = gunler.map((d, i) => {
        let n = slotlar.filter(s => kmYaSlotGunler(s).includes(d.getDay())).length;
        return `<button class="${_kmYa.gun === i ? 'aktif' : ''}${isoler[i] === bugun ? ' bugun' : ''}" onclick="kmYaGunSec(${i})"><b>${KM_YA_GUN_KISA[d.getDay()]}</b><small>${d.getDate()}</small><em>${n ? n + ' ders' : '—'}</em></button>`;
    }).join('');
    let d = gunler[_kmYa.gun], iso = isoler[_kmYa.gun], gd = d.getDay();
    let dersler = slotlar.filter(s => kmYaSlotGunler(s).includes(gd)).sort((a, b) => kmYaDk(a.baslangicSaat) - kmYaDk(b.baslangicSaat));
    let kayitliler = [];
    let kartlar = dersler.map(s => {
        let kayitli = kmYaSlotSporcu(s); kayitliler.push(...kayitli);
        let bas = kmYaDk(s.baslangicSaat), bit = kmYaDk(s.bitisSaat);
        let gelecek = iso > bugun || (iso === bugun && dk < bas), simdi = iso === bugun && dk >= bas && dk < bit;
        let iptal = (s.istisnalar || []).find(x => x.tarih === iso);
        let kayit = otomatikYoklamaDB && otomatikYoklamaDB[iso] || {};
        let satirlar = kayitli.map(k => {
            let st = kmYaDurum(k, iso);
            return { k, st: st || (gelecek ? '' : simdi ? 'bekle' : 'isaretsiz'), saat: st === 'g' && kayit[k.ad] ? kayit[k.ad].saat : '' };
        });
        let sira = { g: 0, bekle: 1, isaretsiz: 2, y: 3, '': 4 };
        satirlar.sort((a, b) => sira[a.st] - sira[b.st] || a.k.ad.localeCompare(b.k.ad, 'tr'));
        let gel = satirlar.filter(x => x.st === 'g').length, yok = satirlar.filter(x => x.st === 'y').length;
        let ozet = iptal ? `<span class="ya-durum y">İptal${iptal.sebep ? ' · ' + esc(iptal.sebep) : ''}</span>`
            : !kayitli.length ? '' : iso > bugun ? `<span class="ya-alt">${kayitli.length} kayıtlı${s.kapasite ? ' / ' + s.kapasite + ' kapasite' : ''}</span>`
            : `<span class="ya-sayac"><b>${gel}</b>/${kayitli.length} geldi${yok ? ` · ${yok} gelmedi` : ''}</span>`;
        let duz = _kmYa.duzenle === s.id, yAl = !iptal && iso <= bugun && !duz;
        let isaretsiz = satirlar.filter(x => x.st !== 'g' && x.st !== 'y').length;
        let kalan = yAl && kayitli.length ? (isaretsiz ? `<button class="ya-btn birincil" onclick="kmYaKalanlarGeldi(${s.id}, '${iso}')">✅ ${isaretsiz === kayitli.length ? 'Hepsi' : 'Kalanlar (' + isaretsiz + ')'} geldi</button>` : '<span class="ya-durum g">✔ Yoklama tamam</span>') : '';
        return `<div class="ya-dkart${simdi ? ' simdi' : ''}${iptal ? ' iptal' : ''}${duz ? ' duzenle' : ''}">
            <div class="ya-dbas"><div class="ya-dsaat">${s.baslangicSaat}<small>${s.bitisSaat}</small></div>
                <div style="min-width:0; flex:1"><div class="ya-dad">${esc(kmYaSlotAd(s))}${simdi ? ' <span class="ya-canli">ŞU AN</span>' : ''}</div>${s.dersPlani ? `<div class="ya-alt">📝 ${esc(s.dersPlani)}</div>` : ''}</div>${ozet}${kalan}
                <button class="ya-btn${duz ? ' birincil' : ''}" onclick="kmYaDuzenle(${s.id})">${duz ? '✓ Bitti' : '✏️ Sporcu ekle / çıkar'}</button></div>
            ${duz ? kmYaEklePanelHTML(s, iso) : ''}
            ${kayitli.length ? `<div class="ya-kisiler">${satirlar.map(x => kmYaKisiHTML(x.k, iptal ? '' : x.st, x.saat, duz ? s.id : null, yAl ? iso : null)).join('')}</div>` : `<div class="ya-alt">Bu derse kayıtlı sporcu yok${duz ? '' : ' — "✏️ Sporcu ekle / çıkar" ile ekleyebilirsin'}.</div>`}
        </div>`;
    }).join('');
    // O gün gelip o günün hiçbir dersine kayıtlı olmayanlar
    let kayitsiz = sporcular.filter(k => kmYaDurum(k, iso) === 'g' && !kayitliler.some(x => x.g === k.g && x.ad === k.ad));
    let kayit = otomatikYoklamaDB && otomatikYoklamaDB[iso] || {};
    let kayitsizKart = kayitsiz.length ? `<div class="ya-dkart"><div class="ya-dbas"><div style="flex:1"><div class="ya-dad">${dersler.length ? 'Derse kayıtlı olmadan gelenler' : 'Bu gün gelenler'}</div><div class="ya-alt">${dersler.length ? 'Bugünkü derslerin listesinde yoklar ama yoklamada geldi görünüyorlar.' : 'Ders programında bu güne ders yok.'}</div></div><span class="ya-sayac"><b>${kayitsiz.length}</b> kişi</span></div>
        <div class="ya-kisiler">${kayitsiz.map(k => kmYaKisiHTML(k, 'g', kayit[k.ad] && kayit[k.ad].saat, null, iso <= bugun ? iso : null)).join('')}</div></div>` : '';
    return `<div class="ya-gunler" role="tablist" aria-label="Gün seç">${gunCip}</div>
        <div class="ya-etiket">${KM_YA_GUN[gd]} ${kmYaTarihYazi(d)}${iso === bugun ? ' · bugün' : ''}</div>
        ${kartlar}${kayitsizKart}${iso <= bugun ? kmYaMisafirHTML(iso) : ''}
        ${!dersler.length && !kayitsiz.length ? '<div class="ya-kart"><div class="ya-alt">Bu gün ders yok ve kimse gelmemiş.</div></div>' : ''}`;
}
function kmYaSporcuDersleri(k) { return (_kmYa.slotlar || []).filter(s => (s.katilimcilar || []).some(x => x.grup === k.g && x.ad === k.ad)); }
function kmYaSonGelis(k) {
    let tarihler = Object.keys(otomatikYoklamaDB || {}).sort().reverse();
    for (let t of tarihler) if (kmYaDurum(k, t) === 'g') return t;
    return null;
}
function kmYaDersEtiket(s) { return `${kmYaSlotGunler(s).map(x => KM_YA_GUN_KISA[x]).join('·')} ${s.baslangicSaat} · ${kmYaSlotAd(s)}`; }
function kmYaSporcuTabloHTML(sporcular, isoler) {
    let ara = _kmYa.ara ? _kmYa.ara.toLocaleLowerCase('tr-TR') : '';
    let ikiHaftaOnce = kmYaIso(kmYaHaftaBasi(_kmYa.hafta - 1)), bugun = kmYaIso(new Date());
    let liste = sporcular.map(k => Object.assign({ gel: isoler.filter(i => kmYaDurum(k, i) === 'g').length, son: kmYaSonGelis(k), dersler: kmYaSporcuDersleri(k) }, k)).filter(x => {
        if (ara && !x.ad.toLocaleLowerCase('tr-TR').includes(ara)) return false;
        if (_kmYa.filtre === 'geldi') return x.gel > 0;
        if (_kmYa.filtre === 'gelmedi') return x.gel === 0;
        if (_kmYa.filtre === 'uzun') return !x.son || x.son < ikiHaftaOnce;
        if (_kmYa.filtre === 'derssiz') return !x.dersler.length;
        return true;
    });
    let f = (id, ad) => `<button class="${_kmYa.filtre === id ? 'aktif' : ''}" onclick="kmYaFiltre('${id}')">${ad}</button>`;
    let sira = Object.keys(KM_YA_GRUP_AD), gruplar = [...new Set(liste.map(x => x.g))].sort((a, b) => (sira.indexOf(a) + 1 || 99) - (sira.indexOf(b) + 1 || 99));
    let satir = x => {
        let son = x.son ? (x.son === bugun ? 'bugün' : kmYaTarihYazi(new Date(x.son + 'T12:00:00'))) : '—';
        return `<button class="ya-trow" onclick="kmYaSporcuAc('${kmYaKey(x.g, x.ad)}')">
            <span class="ya-tad"><span class="ya-av" style="background:${kmYaRenk(x.g)}">${esc(kmYaIlkHarf(x.ad))}</span><b>${esc(x.ad)}</b></span>
            <span class="ya-tders">${x.dersler.length ? x.dersler.map(s => `<span class="ya-dcip">${esc(kmYaDersEtiket(s))}</span>`).join('') : '<span class="ya-alt">derse kayıtlı değil</span>'}</span>
            <span class="ya-thafta">${x.gel ? `<span class="ya-durum g">✓ ${x.gel} gün</span>` : '<span class="ya-durum y">✗ gelmedi</span>'}</span>
            <span class="ya-tson"><small>son geliş</small> ${son}</span></button>`;
    };
    return `<div class="ya-kart">
        <input class="ya-ara" type="search" placeholder="🔍 Sporcu ara" value="${esc(_kmYa.ara)}" oninput="kmYaAra(this.value)">
        <div class="ya-filtre">${f('hepsi', 'Hepsi')}${f('geldi', '✓ Bu hafta geldi')}${f('gelmedi', '✗ Bu hafta gelmedi')}${f('uzun', '⏳ 2+ haftadır yok')}${f('derssiz', 'Derse kayıtsız')}</div>
        <div class="ya-thead" aria-hidden="true"><span>Sporcu</span><span>Hangi derste</span><span>Bu hafta</span><span>Son geliş</span></div>
        ${gruplar.map(g => { let ic = liste.filter(x => x.g === g).sort((a, b) => a.ad.localeCompare(b.ad, 'tr')); return `<div class="ya-tgrup"><i style="background:${kmYaRenk(g)}"></i>${KM_YA_GRUP_AD[g] || esc(g)} <small>${ic.length} kişi · bu hafta ${ic.filter(x => x.gel).length} geldi</small></div>${ic.map(satir).join('')}`; }).join('') || '<div class="ya-alt">Bu filtrede sporcu yok.</div>'}
    </div>`;
}
function kmYaSayilarHTML(sporcular, gunler, isoler, bugun) {
    let gunSayilari = isoler.map(i => sporcular.filter(k => kmYaDurum(k, i) === 'g').length);
    let gelen = sporcular.filter(k => isoler.some(i => kmYaDurum(k, i) === 'g')).length;
    let toplam = gunSayilari.reduce((a, b) => a + b, 0), max = Math.max(1, ...gunSayilari);
    let grupSay = {}; sporcular.forEach(k => { grupSay[k.g] = (grupSay[k.g] || 0) + 1; });
    let grafik = gunler.map((d, i) => { let iso = isoler[i], n = gunSayilari[i]; return `<button class="ya-gun${iso === bugun ? ' bugun' : ''}${iso > bugun ? ' gelecek' : ''}" onclick="kmYaGunSec(${i})" aria-label="${KM_YA_GUN[d.getDay()]}: ${n} kişi"><div class="sut" style="height:${iso > bugun ? 4 : Math.max(4, n / max * 100)}%">${iso <= bugun ? `<em>${n}</em>` : ''}</div><small>${KM_YA_GUN_KISA[d.getDay()]}</small></button>`; }).join('');
    return `<div class="ya-sayilar">
            <div class="ya-sayi"><small>Kulüpte aktif sporcu</small><b>${sporcular.length}</b><span>${Object.keys(grupSay).map(g => (KM_YA_GRUP_AD[g] || g) + ' ' + grupSay[g]).join(' · ')}</span></div>
            <div class="ya-sayi"><small>Bu hafta gelen</small><b>${gelen}</b><span>aktiflerin %${sporcular.length ? Math.round(gelen / sporcular.length * 100) : 0}'i</span></div>
            <div class="ya-sayi"><small>Bu hafta hiç gelmeyen</small><b>${sporcular.length - gelen}</b><span>${_kmYa.hafta === 0 ? 'hafta henüz bitmedi' : ''}</span></div>
            <div class="ya-sayi"><small>Toplam giriş</small><b>${toplam}</b><span>tüm günler toplamı</span></div>
        </div>
        <div class="ya-kart"><div class="ya-etiket">Günlere göre gelen kişi — güne dokun, o günün derslerini aç</div><div class="ya-grafik">${grafik}</div></div>
        ${kmYaTrendHTML(sporcular)}`;
}
function kmYaTrendHTML(sporcular) {
    let haftalar = [];
    for (let h = -7; h <= 0; h++) {
        let isoler = kmYaHaftaGunleri(h).map(kmYaIso);
        haftalar.push({ h, n: sporcular.filter(k => isoler.some(i => kmYaDurum(k, i) === 'g')).length, bas: kmYaHaftaBasi(h) });
    }
    let max = Math.max(1, ...haftalar.map(x => x.n));
    let son = haftalar[7].n, onceki = haftalar.slice(3, 7).reduce((a, x) => a + x.n, 0) / 4;
    let yorum = onceki ? (son >= onceki * 1.1 ? '📈 Son 4 haftanın ortalamasının üstünde' : son <= onceki * 0.85 ? '📉 Son 4 haftanın ortalamasının altında' : 'Son haftalarla benzer') : '';
    return `<div class="ya-kart"><div class="ya-etiket">Son 8 hafta — haftada gelen farklı sporcu sayısı</div>
        <div class="ya-trend">${haftalar.map(x => `<div><div class="sut${x.h === _kmYa.hafta ? ' bu' : ''}" style="height:${Math.max(3, x.n / max * 100)}%"><em>${x.n}</em></div><small>${kmYaTarihYazi(x.bas)}</small></div>`).join('')}</div>
        ${yorum ? `<div class="ya-alt">${yorum} (ortalama ${Math.round(onceki)}).</div>` : ''}</div>`;
}
function kmYaSporcuDetayHTML() {
    let [g, ...r] = decodeURIComponent(_kmYa.secili).split('|'), k = { g, ad: r.join('|') };
    if (!turnuvaDB[g] || !turnuvaDB[g][k.ad]) { _kmYa.secili = null; return ''; }
    let dersler = kmYaSporcuDersleri(k), bugun = kmYaIso(new Date());
    let takvim = '<span></span>' + [1, 2, 3, 4, 5, 6, 0].map(d => `<span>${KM_YA_GUN_KISA[d]}</span>`).join('');
    let toplam8 = 0;
    for (let h = -7; h <= 0; h++) {
        let gun = kmYaHaftaGunleri(h);
        takvim += `<span style="text-align:right; font-weight:700">${kmYaTarihYazi(gun[0])}</span>` + gun.map(d => {
            let iso = kmYaIso(d), st = kmYaDurum(k, iso), dersGunu = dersler.some(s => kmYaSlotGunler(s).includes(d.getDay()));
            if (st === 'g') toplam8++;
            return `<i class="${st || ''}${dersGunu && !st && iso <= bugun ? ' d' : ''}" title="${iso}${st === 'g' ? ' · geldi' : st === 'y' ? ' · gelmedi' : ''}"></i>`;
        }).join('');
    }
    let tum = Object.keys(otomatikYoklamaDB || {}).filter(t => kmYaDurum(k, t) === 'g').sort().reverse();
    let dersGunleri = 0, katildi = 0;
    for (let i = 0; i < 28; i++) { let d = new Date(); d.setDate(d.getDate() - i); let iso = kmYaIso(d); if (dersler.some(s => kmYaSlotGunler(s).includes(d.getDay()) && !kmYaIptalMi(s, iso))) { dersGunleri++; if (kmYaDurum(k, iso) === 'g') katildi++; } }
    return `<div class="ya">
        <div><button class="ya-btn" onclick="_kmYa.secili=null; kmYoklamaAnalizCiz()">← Tüm analiz</button></div>
        <div class="ya-ust"><div style="display:flex; gap:12px; align-items:center"><span class="ya-av" style="width:48px; height:48px; font-size:17px; background:${kmYaRenk(g)}">${esc(kmYaIlkHarf(k.ad))}</span><div><div class="ya-baslik">${esc(k.ad)}</div><div class="ya-alt">${KM_YA_GRUP_AD[g] || g}</div></div></div></div>
        <div class="ya-sayilar">
            <div class="ya-sayi"><small>Son 8 haftada geldiği gün</small><b>${toplam8}</b><span>haftada ort. ${(toplam8 / 8).toFixed(1)}</span></div>
            <div class="ya-sayi"><small>Son geliş</small><b style="font-size:20px">${tum[0] ? (tum[0] === bugun ? 'Bugün' : kmYaTarihYazi(new Date(tum[0] + 'T12:00:00'))) : '—'}</b><span>${tum[0] ? Math.round((new Date(bugun) - new Date(tum[0])) / 86400000) + ' gün önce' : 'kayıt yok'}</span></div>
            <div class="ya-sayi"><small>Ders günlerine katılım (4 hafta)</small><b>${dersGunleri ? '%' + Math.round(katildi / dersGunleri * 100) : '—'}</b><span>${dersGunleri ? katildi + ' / ' + dersGunleri + ' ders günü' : 'derse kayıtlı değil'}</span></div>
        </div>
        <div class="ya-kart"><div class="ya-etiket">Kayıtlı olduğu dersler</div>${dersler.length ? dersler.map(s => `<div class="ya-ders"><div class="saat">${s.baslangicSaat}<small>${kmYaSlotGunler(s).map(x => KM_YA_GUN_KISA[x]).join(', ')}</small></div><div><b>${esc(kmYaSlotAd(s))}</b><div class="ya-alt">${s.baslangicSaat}–${s.bitisSaat} · ${kmYaSlotSporcu(s).length} kişilik ders${s.kapasite ? ' (kapasite ' + s.kapasite + ')' : ''}</div></div><button class="ya-cikar" onclick="kmYaCikar(${s.id}, '${kmYaKey(g, k.ad)}')">✕ Çıkar</button></div>`).join('') : '<div class="ya-alt">Ders programında hiçbir derse kayıtlı değil.</div>'}
            ${(() => { let diger = (_kmYa.slotlar || []).filter(s => !dersler.includes(s)).sort((a, b) => kmYaSlotGunler(a)[0] - kmYaSlotGunler(b)[0] || kmYaDk(a.baslangicSaat) - kmYaDk(b.baslangicSaat)); return diger.length ? `<div class="ya-dders-ekle"><select id="ya-dders-sec" aria-label="Eklenecek ders"><option value="">Bir ders seç…</option>${diger.map(s => `<option value="${s.id}">${esc(kmYaDersYazi(s))}</option>`).join('')}</select><button class="ya-btn birincil" onclick="let v = +document.getElementById('ya-dders-sec').value; if (v) kmYaEkle(v, '${kmYaKey(g, k.ad)}')">➕ Derse ekle</button></div>` : ''; })()}</div>
        <div class="ya-kart"><div class="ya-etiket">Son 8 hafta devam takvimi</div><div class="ya-takvim">${takvim}</div>
            <div class="ya-alt">🟩 geldi · 🟥 gelmedi olarak işaretlendi · çerçeveli kare = ders günüydü ama kayıt yok</div></div>
        <div class="ya-kart"><div class="ya-etiket">Son gelişleri</div><div class="ya-cipler">${tum.slice(0, 10).map(t => { let rr = otomatikYoklamaDB[t][k.ad]; return `<span class="ya-cip geldi">${kmYaTarihYazi(new Date(t + 'T12:00:00'))}${rr && rr.saat ? ' <small>' + esc(rr.saat) + '</small>' : ''}</span>`; }).join('') || '<span class="ya-alt">Kayıt yok.</span>'}</div></div>
    </div>`;
}
function kmYaHafta(f) { _kmYa.hafta = Math.min(0, Math.max(-12, _kmYa.hafta + f)); _kmYa.gun = null; kmYoklamaAnalizCiz(); }
function kmYaGunSec(i) { _kmYa.gun = i; _kmYa.duzenle = null; _kmYa.gorunum = 'ders'; kmYoklamaAnalizCiz(); }
function kmYaGorunum(g) { _kmYa.gorunum = g; kmYoklamaAnalizCiz(); }
function kmYaBugun(kaydir) { _kmYa.hafta = 0; _kmYa.gun = null; _kmYa.gorunum = 'ders'; _kmYa.duzenle = null; kmYoklamaAnalizCiz(); if (kaydir) { let el = document.querySelector('#km-icerik .ya-dkart.simdi'); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); } }
function kmYaFiltre(f) { _kmYa.filtre = f; kmYoklamaAnalizCiz(); }
function kmYaAra(v) {
    _kmYa.ara = v; kmYoklamaAnalizCiz();
    let el = document.querySelector('#km-icerik .ya-ara'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
}
function kmYaSporcuAc(key) { _kmYa.secili = key; kmYoklamaAnalizCiz(); let ic = document.getElementById('km-icerik'); if (ic) ic.scrollIntoView({ block: 'start' }); }

// ---------------------------------------------------------------- kalıcı ders kaydı: sporcu ekle / çıkar (2026-09-28)
// Ders Programı'nın kullandığı AYNI uç noktalar (/api/antrenman-programi/:id/katilimci) ve aynı uyarılar
// (kapasite dolu, aynı saatte başka derse kayıtlı). Kayıt kalıcıdır; geçmiş yoklama kayıtlarına dokunmaz.
function kmYaSlotBul(id) { return (_kmYa.slotlar || []).find(s => s.id === id); }
function kmYaKey(g, ad) { return encodeURIComponent(g + '|' + ad).replace(/'/g, '%27'); }
function kmYaAnahtar(key) { let [g, ...r] = decodeURIComponent(key).split('|'); return { g, ad: r.join('|') }; }
function kmYaEklePanelHTML(s, iso) {
    return `<div class="ya-ekle"><input class="ya-ara" id="ya-ekle-ara" type="search" placeholder="➕ Eklenecek sporcunun adını yaz" value="${esc(_kmYa.ekleAra || '')}" oninput="kmYaEkleAra(this.value)" autocomplete="off">
        <div id="ya-ekle-sonuc" data-slot="${s.id}" data-iso="${iso}">${kmYaEkleSonucHTML(s, iso)}</div></div>`;
}
function kmYaEkleSonucHTML(s, iso) {
    let kayitli = s.katilimcilar || [], ara = (_kmYa.ekleAra || '').trim().toLocaleLowerCase('tr-TR');
    let adaylar = kmYaSporcular().filter(k => !kayitli.some(x => x.grup === k.g && x.ad === k.ad));
    let baslik;
    if (ara) { adaylar = adaylar.filter(k => k.ad.toLocaleLowerCase('tr-TR').includes(ara)); baslik = adaylar.length ? '' : 'Bu isimde, bu derse kayıtlı olmayan aktif sporcu yok.'; }
    else { adaylar = adaylar.filter(k => kmYaDurum(k, iso) === 'g'); baslik = adaylar.length ? 'Öneri: o gün gelip bu derse kayıtlı olmayanlar' : 'Yazmaya başla — ad ile ara.'; }
    adaylar.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    return `${baslik ? `<div class="ya-alt">${baslik}</div>` : ''}<div class="ya-kisiler">${adaylar.slice(0, 12).map(k => `<button class="ya-kisi" onclick="kmYaEkle(${s.id}, '${kmYaKey(k.g, k.ad)}')"><span class="ya-av" style="background:${kmYaRenk(k.g)}">${esc(kmYaIlkHarf(k.ad))}</span><span style="min-width:0"><b>${esc(k.ad)}</b><small>${KM_YA_GRUP_AD[k.g] || esc(k.g)}</small></span><span class="ya-durum g">+ Ekle</span></button>`).join('')}</div>${adaylar.length > 12 ? `<div class="ya-alt">+${adaylar.length - 12} kişi daha — aramayı daralt.</div>` : ''}`;
}
function kmYaEkleAra(v) {
    _kmYa.ekleAra = v;
    let el = document.getElementById('ya-ekle-sonuc'); if (!el) return;
    let s = kmYaSlotBul(+el.dataset.slot); if (s) el.innerHTML = kmYaEkleSonucHTML(s, el.dataset.iso);
}
function kmYaDuzenle(id) { _kmYa.duzenle = _kmYa.duzenle === id ? null : id; _kmYa.ekleAra = ''; kmYoklamaAnalizCiz(); }
function kmYaDersYazi(s) { return `${kmYaSlotAd(s)} (${kmYaSlotGunler(s).map(x => KM_YA_GUN_KISA[x]).join('·')} ${s.baslangicSaat})`; }
function kmYaEkle(slotId, key) {
    let s = kmYaSlotBul(slotId), k = kmYaAnahtar(key); if (!s) return;
    let n = (s.katilimcilar || []).length;
    if (s.kapasite && n >= s.kapasite && !confirm(`Bu ders dolu (${n}/${s.kapasite}). Yine de ${k.ad} eklensin mi?`)) return;
    try {
        let cak = typeof _dersCakismaBul === 'function' ? _dersCakismaBul(k.g, k.ad, s) : [];
        if (cak.length && !confirm(`⚠️ ${k.ad} aynı saatte başka bir derse kayıtlı: ${cak.map(kmYaDersYazi).join(', ')}.\n\nYine de eklensin mi?`)) return;
    } catch (e) {}
    fetch('/api/antrenman-programi/' + s.id + '/katilimci', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ grup: k.g, ad: k.ad, deviceId: typeof _cihazId !== 'undefined' ? _cihazId : null }) })
        .then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => {
            if (!d.applied) return showToast('Eklenemedi.', 'error');
            if (!s.katilimcilar) s.katilimcilar = [];
            if (!s.katilimcilar.some(x => x.grup === k.g && x.ad === k.ad)) s.katilimcilar.push({ grup: k.g, ad: k.ad });
            showToast(`✓ ${k.ad} → ${kmYaDersYazi(s)} dersine eklendi`, 'success');
            _kmYa.ekleAra = ''; kmYaYenidenCiz(true);
        }).catch(st => showToast(st === 401 || st === 403 ? 'Bu işlem için yetkin yok.' : 'Bağlantı hatası — eklenemedi.', 'error'));
}
function kmYaCikar(slotId, key) {
    let s = kmYaSlotBul(slotId), k = kmYaAnahtar(key); if (!s) return;
    if (!confirm(`${k.ad}, ${kmYaDersYazi(s)} dersinden çıkarılsın mı?\n\nGeçmiş yoklama kayıtları silinmez.`)) return;
    fetch('/api/antrenman-programi/' + s.id + '/katilimci?grup=' + encodeURIComponent(k.g) + '&ad=' + encodeURIComponent(k.ad) + '&deviceId=' + encodeURIComponent(typeof _cihazId !== 'undefined' ? _cihazId : ''), { method: 'DELETE' })
        .then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => {
            if (!d.applied) return showToast('Çıkarılamadı.', 'error');
            s.katilimcilar = (s.katilimcilar || []).filter(x => !(x.grup === k.g && x.ad === k.ad));
            showToast(`${k.ad} dersten çıkarıldı`, 'success');
            kmYaYenidenCiz();
        }).catch(st => showToast(st === 401 || st === 403 ? 'Bu işlem için yetkin yok.' : 'Bağlantı hatası — çıkarılamadı.', 'error'));
}
// Yeniden çiz; ekleme aramasındaysa odağı ve kaydırma konumunu koru.
function kmYaYenidenCiz(odakZorla) {
    let odak = odakZorla || (document.activeElement && document.activeElement.id === 'ya-ekle-ara'), y = window.scrollY;
    kmYoklamaAnalizCiz();
    window.scrollTo(0, y);
    if (odak) { let el = document.getElementById('ya-ekle-ara'); if (el) { el.focus({ preventScroll: true }); el.setSelectionRange(el.value.length, el.value.length); } }
}

// ---------------------------------------------------------------- yoklama burada alınır (2026-09-28)
// KM "✅ Yoklama" sekmesi (kmYoklamaAyarla) ile AYNI kayıt biçimi ve aynı senkron: otomatikYoklamaDB[iso][ad] =
// {saat, grup, elle:true, geldi}. Fark: seçili GÜNE yazar (geçmiş bir dersin yoklaması da sonradan girilebilir).
function kmYaYoklamaYaz(iso, k, yeni, saat) {
    if (iso > kmYaIso(new Date())) return showToast('İleri bir tarihin yoklaması alınamaz.', 'error');
    if (!otomatikYoklamaDB[iso]) otomatikYoklamaDB[iso] = {};
    let m = otomatikYoklamaDB[iso][k.ad];
    if (yeni === 'sil') { if (m && (!m.grup || m.grup === k.g)) delete otomatikYoklamaDB[iso][k.ad]; return; }
    // saat: bugün için şimdiki saat; geçmiş gün için varsa eski saat korunur
    otomatikYoklamaDB[iso][k.ad] = { saat: saat || (m && m.saat) || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), grup: k.g, elle: true, geldi: yeni === 'g' };
}
function kmYaYoklamaBitir() {
    otomatikYoklamaKaydet();
    bekleyenGonderim = true; try { bulutaGonderKontrol(); } catch (e) {}
    try { kmSinifKartiCiz(); } catch (e) {}
    try { yoneticiDevamsizlikWidgetCiz(); } catch (e) {}
    kmYaYenidenCiz();
}
function kmYaYoklama(iso, key, yeni) {
    let k = kmYaAnahtar(key), bugunMu = iso === kmYaIso(new Date());
    kmYaYoklamaYaz(iso, k, yeni, bugunMu ? new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : '');
    kmYaYoklamaBitir();
}
// Kayıtlı ama henüz işaretlenmemiş herkes "geldi" — elle "gelmedi" işaretliler değişmez.
function kmYaKalanlarGeldi(slotId, iso) {
    let s = kmYaSlotBul(slotId); if (!s) return;
    let bugunMu = iso === kmYaIso(new Date()), n = 0;
    kmYaSlotSporcu(s).forEach(k => { if (!kmYaDurum(k, iso)) { kmYaYoklamaYaz(iso, k, 'g', bugunMu ? '' : (s.baslangicSaat || '')); n++; } });
    showToast(n ? `${n} sporcu geldi işaretlendi ✅` : 'Herkes zaten işaretli.', 'success');
    kmYaYoklamaBitir();
}
// Derse kayıtlı olmayan biri geldiyse: adını yaz → o gün için "geldi" (ders kaydına dokunmaz).
function kmYaMisafirHTML(iso) {
    return `<div class="ya-dkart"><div class="ya-dad" style="font-size:15px">➕ Listede olmayan biri mi geldi?</div>
        <input class="ya-ara" id="ya-misafir-ara" type="search" style="max-width:none" placeholder="Adını yaz — derse kaydetmeden sadece bugün için geldi işaretlenir" value="${esc(_kmYa.misafirAra || '')}" oninput="kmYaMisafirAra(this.value)" autocomplete="off">
        <div id="ya-misafir-sonuc" data-iso="${iso}">${kmYaMisafirSonucHTML(iso)}</div></div>`;
}
function kmYaMisafirSonucHTML(iso) {
    let ara = (_kmYa.misafirAra || '').trim().toLocaleLowerCase('tr-TR');
    if (!ara) return '';
    let adaylar = kmYaSporcular().filter(k => k.ad.toLocaleLowerCase('tr-TR').includes(ara) && kmYaDurum(k, iso) !== 'g').sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    if (!adaylar.length) return '<div class="ya-alt">Eşleşen (henüz gelmemiş) aktif sporcu yok.</div>';
    return `<div class="ya-kisiler">${adaylar.slice(0, 12).map(k => `<button class="ya-kisi" onclick="kmYaMisafirGeldi('${iso}', '${kmYaKey(k.g, k.ad)}')"><span class="ya-av" style="background:${kmYaRenk(k.g)}">${esc(kmYaIlkHarf(k.ad))}</span><span style="min-width:0"><b>${esc(k.ad)}</b><small>${KM_YA_GRUP_AD[k.g] || esc(k.g)}</small></span><span class="ya-durum g">✅ Geldi</span></button>`).join('')}</div>`;
}
function kmYaMisafirAra(v) { _kmYa.misafirAra = v; let el = document.getElementById('ya-misafir-sonuc'); if (el) el.innerHTML = kmYaMisafirSonucHTML(el.dataset.iso); }
function kmYaMisafirGeldi(iso, key) {
    let k = kmYaAnahtar(key);
    kmYaYoklamaYaz(iso, k, 'g');
    _kmYa.misafirAra = '';
    showToast(`${k.ad} geldi işaretlendi ✅`, 'success');
    kmYaYoklamaBitir();
}
