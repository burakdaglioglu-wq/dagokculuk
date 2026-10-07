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
let _kmYa = { mesajAcik: false, mod: 'hafta', ay: 0, hafta: 0, gun: null, gorunum: 'ders', filtre: 'hepsi', ara: '', secili: null, slotlar: null, yukleniyor: false, duzenle: null, ekleAra: '', misafirAra: '' };
let _kmYaTimer = null;
// 90 günden eski yoklamalar sunucuda arşiv tablosunda — aylık/eski görünümler için salt-okunur katman
// (otomatikYoklamaDB'ye YAZILMAZ, senkronu etkilemez). kmYaDurum yerelde kayıt yoksa buraya bakar.
let _kmYaArsiv = {}, _kmYaArsivYuklu = {};

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
.ya-eg { display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding:8px 10px; border-radius:12px; background:color-mix(in srgb, #0ea5e9 8%, var(--surface-1)); border:1px solid color-mix(in srgb, #0ea5e9 30%, transparent); }
.ya-eg-bas { font-size:11.5px; font-weight:800; color:var(--text-secondary); margin-right:4px; }
.ya-eg-bas em { font-style:normal; font-weight:600; }
.ya-eg-cip { min-height:34px; padding:0 12px; border-radius:999px; border:1.5px solid var(--border-color); background:var(--surface-1); color:var(--text-primary); font-weight:800; font-size:13px; cursor:pointer; }
.ya-eg-cip.on { background:#0ea5e9; border-color:#0ea5e9; color:#fff; }
.ya-eg-cip.ek { color:var(--text-secondary); border-style:dashed; }
.ya-yeni-mis { display:flex; flex-direction:column; gap:6px; margin-top:8px; padding:10px; border-radius:12px; border:1px dashed color-mix(in srgb, #f472b6 55%, transparent); font-size:12.5px; color:var(--text-secondary); }
.ya-mod { display:flex; padding:3px; border-radius:11px; background:var(--surface-2); }
.ya-mod button { min-height:38px; min-width:58px; padding:0 12px; border:none; border-radius:8px; background:none; color:var(--text-secondary); font-weight:800; font-size:13px; cursor:pointer; }
.ya-mod button.aktif { background:var(--accent); color:var(--text-on-accent-dark, #0b0f1c); }
.ya-grafik.ay { gap:2px; }
.ya-grafik.ay .ya-gun small { font-size:9.5px; }
.ya-grafik.ay .ya-gun .sut em { font-size:9.5px; }
.ya-kat { display:block; font-size:10.5px; font-weight:700; color:var(--text-secondary); margin-top:3px; }
.ya-takvim-ay { display:grid; grid-template-columns:repeat(7, minmax(0,1fr)); gap:5px; }
.ya-takvim-ay .bas { text-align:center; font-size:11px; font-weight:800; color:var(--text-secondary); padding-bottom:2px; }
.ya-gunhucre { position:relative; min-height:68px; border-radius:11px; border:1px solid var(--border-color); background:var(--surface-1); padding:6px 7px; display:flex; flex-direction:column; align-items:flex-start; gap:2px; cursor:pointer; color:var(--text-primary); text-align:left; overflow:hidden; }
.ya-gunhucre .dol { position:absolute; inset:0; background:var(--status-success); pointer-events:none; }
.ya-gunhucre > b, .ya-gunhucre > span { position:relative; }
.ya-gunhucre > b { font-size:14px; font-weight:900; }
.ya-gunhucre .kisi { font-size:12.5px; font-weight:800; }
.ya-gunhucre .ders { font-size:10.5px; color:var(--text-secondary); font-weight:700; }
.ya-gunhucre.bugun { box-shadow:0 0 0 2px var(--accent); }
.ya-gunhucre.gelecek { opacity:.55; }
.ya-gunhucre.bos { visibility:hidden; }
.ya-gunhucre.iptal .ders { color:var(--status-danger); }
@media (max-width: 640px) { .ya-gunhucre { min-height:54px; padding:4px 5px; } .ya-gunhucre > b { font-size:12px; } .ya-gunhucre .kisi { font-size:11px; } .ya-gunhucre .ders { display:none; } .ya-mod button { min-width:48px; padding:0 8px; } }
.ya-isi { border-collapse:separate; border-spacing:4px; width:100%; min-width:420px; font-variant-numeric:tabular-nums; }
.ya-isi th { font-size:11px; font-weight:800; color:var(--text-secondary); padding:2px 4px; text-align:center; }
.ya-isi tbody th { text-align:right; white-space:nowrap; }
.ya-isi td { border-radius:8px; padding:5px 4px; text-align:center; color:var(--text-primary); min-width:44px; }
.ya-isi td b { display:block; font-size:13px; font-weight:900; }
.ya-isi td small { display:block; font-size:9.5px; color:var(--text-secondary); font-weight:700; }
.ya-isi td.bos { background:transparent; }
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
.ya-gs { display:grid; grid-template-columns:44px 22px 1fr auto; gap:8px; align-items:baseline; padding:7px 0; border-top:1px solid var(--border-color); font-size:13px; color:var(--text-primary); }
.ya-gs-z { font-weight:800; color:var(--text-secondary); font-variant-numeric:tabular-nums; } .ya-gs-k { font-size:11.5px; color:var(--text-secondary); white-space:nowrap; }
.ya-gs.cikar .ya-gs-m { color:var(--text-secondary); } .ya-gs-ad { border:0; background:none; padding:0; font:inherit; font-weight:800; color:var(--text-primary); cursor:pointer; text-decoration:underline; text-decoration-color:var(--border-color); }
.ya-ozet summary { display:flex; align-items:center; gap:10px; flex-wrap:wrap; cursor:pointer; list-style:none; }
.ya-ozet summary::-webkit-details-marker { display:none; }
.ya-ozet summary::after { content:'▾'; margin-left:auto; color:var(--text-secondary); }
.ya-ozet:not([open]) summary::after { content:'▸'; }
.ya-oz-sayi { font-size:14px; color:var(--text-secondary); } .ya-oz-sayi b { font-size:20px; color:var(--status-success); }
.ya-oz-dersler { display:flex; flex-direction:column; gap:4px; }
.ya-oz-ders { display:grid; grid-template-columns:56px 1fr auto; gap:10px; align-items:center; padding:7px 10px; border-radius:10px; background:var(--surface-2); font-size:13.5px; }
.ya-oz-ders span { font-weight:800; color:var(--text-secondary); font-variant-numeric:tabular-nums; } .ya-oz-ders b { color:var(--text-primary); } .ya-oz-ders em { font-style:normal; font-weight:800; color:var(--status-success); }
.ya-oz-grup { display:flex; flex-direction:column; gap:6px; }
.ya-oz-grup-bas { display:flex; align-items:center; gap:8px; font-size:13.5px; } .ya-oz-grup-bas i { width:10px; height:10px; border-radius:50%; } .ya-oz-grup-bas b { color:var(--text-primary); } .ya-oz-grup-bas span { color:var(--text-secondary); font-size:12.5px; }
.ya-oz-grup .ya-cip { cursor:pointer; border:0; font:inherit; }
.ya-kac-sonuc { display:flex; align-items:baseline; gap:10px; } .ya-kac-sonuc b { font-size:34px; font-weight:900; color:var(--text-primary); } .ya-kac-sonuc span { font-size:14px; color:var(--text-secondary); }
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
// Kişi türü (dagsk-kisi-yonetimi.js): öğrenci / eğitmen / misafir. Eğitmenler öğrenci sayılarına katılmaz.
function kmYaTur(k) { try { return typeof kisiTuru === 'function' ? kisiTuru(k.g, k.ad) : 'sporcu'; } catch (e) { return 'sporcu'; } }
function kmYaGrupEtiket(k) { let t = kmYaTur(k); return (KM_YA_GRUP_AD[k.g] || esc(k.g)) + (t === 'egitmen' ? ' · 👔 Eğitmen' : t === 'misafir' ? ' · 🎟️ Misafir' : ''); }
const KM_YA_TUR_GRUP = { __egitmen: '👔 Eğitmenler', __misafir: '🎟️ Misafirler' };
function kmYaGrupAnahtar(k) { let t = kmYaTur(k); return t === 'sporcu' ? k.g : '__' + t; }
function kmYaGrupSira(a, b) { let sira = Object.keys(KM_YA_GRUP_AD).concat(Object.keys(KM_YA_TUR_GRUP)); return (sira.indexOf(a) + 1 || 99) - (sira.indexOf(b) + 1 || 99); }
// Bir sporcunun o günkü kaydı: 'g' geldi, 'y' gelmedi işaretli, null yok. Aynı isim başka grupta varsa grup eşleşmesi aranır.
function kmYaDurum(k, iso) {
    let gun = otomatikYoklamaDB && otomatikYoklamaDB[iso], ar = _kmYaArsiv[iso];
    let r = (gun && gun[k.ad]) || (ar && ar[k.ad]); if (!r) return null;
    if (r.grup && r.grup !== k.g && turnuvaDB[r.grup] && turnuvaDB[r.grup][k.ad]) return null;
    return r.geldi === false ? 'y' : 'g';
}
function kmYaSlotYukle(sonra) {
    if (_kmYa.yukleniyor) return;
    _kmYa.yukleniyor = true;
    fetch('/api/antrenman-programi').then(r => r.json()).then(d => { _kmYa.slotlar = d.slots || []; try { _programSlotlar = _kmYa.slotlar; } catch (e) {} })
        .catch(() => { if (!_kmYa.slotlar) _kmYa.slotlar = []; }).then(() => { _kmYa.yukleniyor = false; _kmYa.slotZaman = Date.now(); if (sonra) sonra(); });
    try { kisiTurCek(kmYaYenidenCiz); egDersCek(kmYaYenidenCiz); } catch (e) {}
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
    // ders programı her açılışta tazelenir (en çok 20 sn'de bir) — Ders Programı'nda derse eklenen sporcu hemen görünsün
    if (!_kmYa.yukleniyor && Date.now() - (_kmYa.slotZaman || 0) > 20000) kmYaSlotYukle(() => kmYaYenidenCiz());
    if (_kmYa.secili) { ic.innerHTML = kmYaSporcuDetayHTML(); return; }
    let ayMod = kmYaAyMi(), bugun = kmYaIso(new Date()), sporcular = kmYaSporcular();
    let hGunler = kmYaHaftaGunleri(_kmYa.hafta), hIso = hGunler.map(kmYaIso);
    let gunler = ayMod ? kmYaAyGunleri(_kmYa.ay) : hGunler, isoler = gunler.map(kmYaIso);
    if (_kmYa.gun === null) { let i = hIso.indexOf(bugun); _kmYa.gun = i >= 0 ? i : 0; }
    let gor = _kmYa.gorunum || 'ders';
    // eski dönem (ya da aylık 6-ay eğilimi) arşivde olabilir → bir kez çek, gelince yeniden çiz
    let arsivBas = ayMod && gor === 'sayilar' ? kmYaIso(kmYaAyBasi(_kmYa.ay - 5)) : isoler[0];
    let arsivYukleniyor = kmYaArsivGerekli(arsivBas) && kmYaArsivYukle(arsivBas, isoler[isoler.length - 1]);
    let haftaYazi = ayMod ? (_kmYa.ay >= -1 ? kmYaBuyukIlk(kmYaDonemYazi()) : Math.abs(_kmYa.ay) + ' ay önce') : (_kmYa.hafta === 0 ? 'Bu hafta' : (_kmYa.hafta === -1 ? 'Geçen hafta' : Math.abs(_kmYa.hafta) + ' hafta önce'));
    let altYazi = ayMod ? kmYaAyAd(gunler[0]) : kmYaTarihYazi(gunler[0]) + ' – ' + kmYaTarihYazi(gunler[6]);
    let geriSinir = ayMod ? _kmYa.ay <= -12 : _kmYa.hafta <= -60, ileriSinir = ayMod ? _kmYa.ay >= 0 : _kmYa.hafta >= 0;
    let sekme = (id, ad) => `<button class="${gor === id ? 'aktif' : ''}" onclick="kmYaGorunum('${id}')">${ad}</button>`;
    let govde = gor === 'gecmis' ? kmYaGecmisHTML() : gor === 'sporcu' ? kmYaSporcuTabloHTML(sporcular, isoler) : gor === 'sayilar' ? kmYaSayilarHTML(sporcular, gunler, isoler, bugun) : ayMod ? kmYaAyTakvimHTML(sporcular, gunler, isoler, bugun) : kmYaGunDersleriHTML(sporcular, gunler, isoler, bugun);
    let simdiGoster = ayMod ? _kmYa.ay === 0 : _kmYa.hafta === 0;
    ic.innerHTML = `<div class="ya">
        <div class="ya-ust"><div><div class="ya-baslik">📊 Yoklama</div><div class="ya-alt">Hangi derste kim var, kim geldi, kim gelmedi.</div></div>
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap"><button class="ya-btn" onclick="kmYaPdfIndir()">📄 PDF rapor</button><div class="ya-mod" role="group" aria-label="Dönem"><button class="${ayMod ? '' : 'aktif'}" aria-pressed="${!ayMod}" onclick="kmYaMod('hafta')">Hafta</button><button class="${ayMod ? 'aktif' : ''}" aria-pressed="${ayMod}" onclick="kmYaMod('ay')">Ay</button></div><div class="ya-hafta"><button onclick="kmYaDonemKaydir(-1)" aria-label="${ayMod ? 'Önceki ay' : 'Önceki hafta'}" ${geriSinir ? 'disabled' : ''}>‹</button><span>${haftaYazi}<br><small style="font-weight:600; color:var(--text-secondary)">${altYazi}</small></span><button onclick="kmYaDonemKaydir(1)" aria-label="${ayMod ? 'Sonraki ay' : 'Sonraki hafta'}" ${ileriSinir ? 'disabled' : ''}>›</button></div></div></div>
        ${arsivYukleniyor ? '<div class="ya-alt">⏳ Eski yoklama kayıtları sunucu arşivinden yükleniyor…</div>' : ''}
        ${simdiGoster ? kmYaSimdiHTML(sporcular) : ''}
        <div class="ya-sekmeler" role="tablist">${sekme('ders', '📅 Dersler')}${sekme('sporcu', '👥 Sporcular')}${sekme('sayilar', '📊 Sayılar')}${sekme('gecmis', '🕓 Geçmiş')}</div>
        ${govde}
    </div>`;
    // açık/kapalı durumu satır içi ontoggle ile DEĞİL burada bağlanır: PDF aracı sayfanın kopyasını _kmYa olmayan bir
    // ortamda çiziyor, satır içi olay orada "_kmYa is not defined" fırlatıyordu (2026-10-05).
    ic.querySelectorAll('.ya-ozet').forEach(d => d.addEventListener('toggle', () => { _kmYa.ozetKapali = !d.open; }));
    if (simdiGoster) _kmYaTimer = setInterval(() => { let el = document.getElementById('ya-simdi'); if (!el) { clearInterval(_kmYaTimer); _kmYaTimer = null; return; } el.outerHTML = kmYaSimdiHTML(kmYaSporcular()); }, 30000);
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
        <span style="min-width:0"><b>${esc(k.ad)}</b><small>${kmYaGrupEtiket(k)}</small></span><button class="ya-cikar" onclick="kmYaCikar(${cikarSlot}, '${kmYaKey(k.g, k.ad)}')">✕ Çıkar</button></div>`;
    // yIso verilirse: satırda açık "✅ Geldi / ❌ Gelmedi" düğmeleri (etkin olana tekrar dokunmak işareti kaldırır).
    if (yIso) {
        let key = kmYaKey(k.g, k.ad), c = y => `kmYaYoklama('${yIso}', '${key}', '${durum === y ? 'sil' : y}')`;
        return `<div class="ya-kisi ya-yk ${durum === 'g' ? 'geldi' : durum === 'y' ? 'gelmedi' : ''}"><button class="ya-kisi-ad" onclick="kmYaSporcuAc('${key}')"><span class="ya-av" style="background:${kmYaRenk(k.g)}">${esc(kmYaIlkHarf(k.ad))}</span>
            <span style="min-width:0"><b>${esc(k.ad)}</b><small>${kmYaGrupEtiket(k)}${durum === 'g' && saat ? ' · ' + esc(saat) : ''}</small></span></button>
            <span class="ya-yk-sec" role="group" aria-label="${esc(k.ad)} yoklama"><button class="g${durum === 'g' ? ' aktif' : ''}" aria-pressed="${durum === 'g'}" onclick="${c('g')}">✅ Geldi</button><button class="y${durum === 'y' ? ' aktif' : ''}" aria-pressed="${durum === 'y'}" onclick="${c('y')}">❌ Gelmedi</button></span></div>`;
    }
    return `<button class="ya-kisi" onclick="kmYaSporcuAc('${kmYaKey(k.g, k.ad)}')"><span class="ya-av" style="background:${kmYaRenk(k.g)}">${esc(kmYaIlkHarf(k.ad))}</span>
        <span style="min-width:0"><b>${esc(k.ad)}</b><small>${kmYaGrupEtiket(k)}</small></span>${etiket}</button>`;
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
            let st0 = kmYaGeldiMi(k, iso), st = st0 === 's' ? 'g' : st0;
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
            ${!iptal && iso <= bugun ? kmYaEgitmenSatirHTML(s.id, iso) : ''}
            ${duz ? kmYaEklePanelHTML(s, iso) + kmYaBeklemeHTML(s) : kmYaBekleyenler(s.id).length ? `<div class="ya-alt">⏳ ${kmYaBekleyenler(s.id).length} kişi bu dersin bekleme listesinde${s.kapasite && kmYaSlotSporcu(s).length < s.kapasite ? ' — <b style="color:var(--status-success)">yer var!</b>' : ''}</div>` : ''}
            ${kayitli.length ? `<div class="ya-kisiler">${satirlar.map(x => kmYaKisiHTML(x.k, iptal ? '' : x.st, x.saat, duz ? s.id : null, yAl ? iso : null)).join('')}</div>` : `<div class="ya-alt">Bu derse kayıtlı sporcu yok${duz ? '' : ' — "✏️ Sporcu ekle / çıkar" ile ekleyebilirsin'}.</div>`}
        </div>`;
    }).join('');
    // O gün gelip o günün hiçbir dersine kayıtlı olmayanlar
    let kayitsiz = sporcular.filter(k => kmYaGeldiMiBool(k, iso) && !kayitliler.some(x => x.g === k.g && x.ad === k.ad));
    let kayit = otomatikYoklamaDB && otomatikYoklamaDB[iso] || {};
    let kayitsizKart = kayitsiz.length ? kmYaKayitsizKartHTML(kayitsiz, dersler, kayit, iso, bugun) : '';
    return `<div class="ya-gunler" role="tablist" aria-label="Gün seç">${gunCip}</div>
        <div class="ya-etiket">${KM_YA_GUN[gd]} ${kmYaTarihYazi(d)}${iso === bugun ? ' · bugün' : ''}</div>
        ${iso <= bugun ? kmYaGunOzetHTML(iso, d, dersler) : ''}
        ${iso <= bugun ? kmYaGelmeyenHTML(dersler, iso, d) : ''}
        ${kartlar}${kayitsizKart}${iso <= bugun ? kmYaMisafirHTML(iso) : ''}
        ${!dersler.length && !kayitsiz.length ? '<div class="ya-kart"><div class="ya-alt">Bu gün ders yok ve kimse gelmemiş.</div></div>' : ''}`;
}
function kmYaSporcuDersleri(k) { return (_kmYa.slotlar || []).filter(s => (s.katilimcilar || []).some(x => x.grup === k.g && x.ad === k.ad)); }
function kmYaSonGelis(k) {
    let tarihler = Object.keys(otomatikYoklamaDB || {}).sort().reverse();
    let son = null;
    for (let t of tarihler) if (kmYaDurum(k, t) === 'g') { son = t; break; }
    // skor girilen son gün yoklamadan yeniyse o (yoklamaya işlenmemiş geliş)
    let bugun = kmYaIso(new Date()), sk = Object.keys(kmYaSeriGunleri(k)).filter(t => t <= bugun).sort().pop();
    return sk && (!son || sk > son) ? sk : son;
}
function kmYaDersEtiket(s) { return `${kmYaSlotGunler(s).map(x => KM_YA_GUN_KISA[x]).join('·')} ${s.baslangicSaat} · ${kmYaSlotAd(s)}`; }
function kmYaSporcuTabloHTML(sporcular, isoler) {
    let ara = _kmYa.ara ? _kmYa.ara.toLocaleLowerCase('tr-TR') : '';
    let ikiHaftaOnce = kmYaIso(kmYaHaftaBasi(_kmYa.hafta - 1)), bugun = kmYaIso(new Date());
    let sAr = kmYaSayimAraligi(_kmYa.sayim || 'donem'), sIso = sAr ? kmYaGunAraligi(sAr.bas, sAr.son) : isoler;
    if (sAr && kmYaArsivGerekli(sAr.bas)) kmYaArsivYukle(sAr.bas, sAr.son);
    let donem = sAr ? sAr.ad : kmYaDonemYazi(), ayMod = kmYaAyMi() && !sAr;
    let liste = sporcular.map(k => { let dersler = kmYaSporcuDersleri(k); return Object.assign({ gel: sIso.filter(i => kmYaGeldiMiBool(k, i)).length, son: kmYaSonGelis(k), dersler, kat: ayMod ? kmYaAralikKatilim(k, dersler, isoler) : null }, k); }).filter(x => {
        if (ara && !x.ad.toLocaleLowerCase('tr-TR').includes(ara)) return false;
        if (_kmYa.filtre === 'geldi') return x.gel > 0;
        if (_kmYa.filtre === 'gelmedi') return x.gel === 0;
        if (_kmYa.filtre === 'uzun') return !x.son || x.son < ikiHaftaOnce;
        if (_kmYa.filtre === 'derssiz') return !x.dersler.length;
        return true;
    });
    let f = (id, ad) => `<button class="${_kmYa.filtre === id ? 'aktif' : ''}" onclick="kmYaFiltre('${id}')">${ad}</button>`;
    let gruplar = [...new Set(liste.map(kmYaGrupAnahtar))].sort(kmYaGrupSira);
    let satir = x => {
        let son = x.son ? (x.son === bugun ? 'bugün' : kmYaTarihYazi(new Date(x.son + 'T12:00:00'))) : '—';
        return `<button class="ya-trow" onclick="kmYaSporcuAc('${kmYaKey(x.g, x.ad)}')">
            <span class="ya-tad"><span class="ya-av" style="background:${kmYaRenk(x.g)}">${esc(kmYaIlkHarf(x.ad))}</span><b>${esc(x.ad)}</b></span>
            <span class="ya-tders">${x.dersler.length ? x.dersler.map(s => `<span class="ya-dcip">${esc(kmYaDersEtiket(s))}</span>`).join('') : '<span class="ya-alt">derse kayıtlı değil</span>'}</span>
            <span class="ya-thafta">${x.gel ? `<span class="ya-durum g">✓ ${x.gel} ${sAr ? 'kez' : 'gün'}</span>` : '<span class="ya-durum y">✗ gelmedi</span>'}${x.kat ? `<small class="ya-kat">${x.kat.kt} / ${x.kat.dg} derse geldi · %${Math.round(x.kat.kt / x.kat.dg * 100)}</small>` : ''}</span>
            <span class="ya-tson"><small>son geliş</small> ${son}</span></button>`;
    };
    return `<div class="ya-kart">
        <input class="ya-ara" type="search" placeholder="🔍 Sporcu ara (örn. Elif)" value="${esc(_kmYa.ara)}" oninput="kmYaAra(this.value)">
        <div class="ya-alt">Kaç kez geldi? Dönemi seç:</div>${kmYaSayimCipler(_kmYa.sayim || 'donem', 'kmYaSayimSec')}
        <div class="ya-filtre">${f('hepsi', 'Hepsi')}${f('geldi', '✓ ' + kmYaBuyukIlk(donem) + ' geldi')}${f('gelmedi', '✗ ' + kmYaBuyukIlk(donem) + ' gelmedi')}${f('uzun', '⏳ 2+ haftadır yok')}${f('derssiz', 'Derse kayıtsız')}</div>
        <div class="ya-thead" aria-hidden="true"><span>Sporcu</span><span>Hangi derste</span><span>${kmYaBuyukIlk(donem)}</span><span>Son geliş</span></div>
        ${gruplar.map(g => { let ic = liste.filter(x => kmYaGrupAnahtar(x) === g).sort((a, b) => a.ad.localeCompare(b.ad, 'tr')); return `<div class="ya-tgrup"><i style="background:${g === '__egitmen' ? '#38bdf8' : g === '__misafir' ? '#f472b6' : kmYaRenk(g)}"></i>${KM_YA_TUR_GRUP[g] || KM_YA_GRUP_AD[g] || esc(g)} <small>${ic.length} kişi · ${donem} ${ic.filter(x => x.gel).length} geldi</small></div>${ic.map(satir).join('')}`; }).join('') || '<div class="ya-alt">Bu filtrede sporcu yok.</div>'}
    </div>`;
}
function kmYaSayilarHTML(tumKisiler, gunler, isoler, bugun) {
    let sporcular = tumKisiler.filter(k => kmYaTur(k) === 'sporcu'), egSay = tumKisiler.filter(k => kmYaTur(k) === 'egitmen').length, misSay = tumKisiler.length - sporcular.length - egSay;
    let gunSayilari = isoler.map(i => sporcular.filter(k => kmYaDurum(k, i) === 'g').length);
    let gelen = sporcular.filter(k => isoler.some(i => kmYaDurum(k, i) === 'g')).length;
    let toplam = gunSayilari.reduce((a, b) => a + b, 0), max = Math.max(1, ...gunSayilari);
    let grupSay = {}; sporcular.forEach(k => { grupSay[k.g] = (grupSay[k.g] || 0) + 1; });
    let ayMod = kmYaAyMi(), donem = kmYaDonemYazi();
    let grafik = gunler.map((d, i) => { let iso = isoler[i], n = gunSayilari[i]; return `<button class="ya-gun${iso === bugun ? ' bugun' : ''}${iso > bugun ? ' gelecek' : ''}" onclick="kmYaTarihAc('${iso}')" aria-label="${d.getDate()} ${KM_YA_GUN[d.getDay()]}: ${n} kişi"><div class="sut" style="height:${iso > bugun ? 4 : Math.max(4, n / max * 100)}%">${iso <= bugun && (n || !ayMod) ? `<em>${n}</em>` : ''}</div><small>${ayMod ? d.getDate() : KM_YA_GUN_KISA[d.getDay()]}</small></button>`; }).join('');
    return `<div class="ya-sayilar">
            <div class="ya-sayi"><small>Kulüpte aktif sporcu</small><b>${sporcular.length}</b><span>${Object.keys(grupSay).map(g => (KM_YA_GRUP_AD[g] || g) + ' ' + grupSay[g]).join(' · ')}${misSay || egSay ? `<br>ayrıca ${[misSay ? misSay + ' misafir' : '', egSay ? egSay + ' eğitmen' : ''].filter(Boolean).join(' · ')}` : ''}</span></div>
            <div class="ya-sayi"><small>${kmYaBuyukIlk(donem)} gelen</small><b>${gelen}</b><span>aktiflerin %${sporcular.length ? Math.round(gelen / sporcular.length * 100) : 0}'i</span></div>
            <div class="ya-sayi"><small>${kmYaBuyukIlk(donem)} hiç gelmeyen</small><b>${sporcular.length - gelen}</b><span>${(ayMod ? _kmYa.ay === 0 : _kmYa.hafta === 0) ? (ayMod ? 'ay' : 'hafta') + ' henüz bitmedi' : ''}</span></div>
            <div class="ya-sayi"><small>Toplam giriş</small><b>${toplam}</b><span>tüm günler toplamı</span></div>
        </div>
        <div class="ya-kart"><div class="ya-etiket">Günlere göre gelen kişi — güne dokun, o günün derslerini aç</div><div class="ya-grafik${ayMod ? ' ay' : ''}">${grafik}</div></div>
        ${kmYaDolulukHTML()}
        ${kmYaAidatDevamHTML(tumKisiler, isoler)}
        ${kmYaEgitmenHaftaHTML(gunler, isoler)}
        ${ayMod ? kmYaAyTrendHTML(sporcular) : kmYaTrendHTML(sporcular)}`;
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
            let iso = kmYaIso(d), st0 = kmYaGeldiMi(k, iso), st = st0 === 's' ? 'g' : st0, dersGunu = dersler.some(s => kmYaSlotGunler(s).includes(d.getDay()));
            if (st === 'g') toplam8++;
            return `<i class="${st || ''}${dersGunu && !st && iso <= bugun ? ' d' : ''}" title="${iso}${st === 'g' ? ' · geldi' : st === 'y' ? ' · gelmedi' : ''}"></i>`;
        }).join('');
    }
    let tum = Object.keys(otomatikYoklamaDB || {}).filter(t => kmYaDurum(k, t) === 'g').sort().reverse();
    let dersGunleri = 0, katildi = 0;
    for (let i = 0; i < 28; i++) { let d = new Date(); d.setDate(d.getDate() - i); let iso = kmYaIso(d); if (dersler.some(s => kmYaSlotGunler(s).includes(d.getDay()) && !kmYaIptalMi(s, iso))) { dersGunleri++; if (kmYaDurum(k, iso) === 'g') katildi++; } }
    return `<div class="ya">
        <div style="display:flex; gap:8px; flex-wrap:wrap"><button class="ya-btn" onclick="_kmYa.secili=null; kmYoklamaAnalizCiz()">← Tüm analiz</button><button class="ya-btn birincil" onclick="kmYaVeliRapor('${kmYaKey(g, k.ad)}')">📤 Veliye aylık rapor</button></div>
        ${kmYaVeliRaporPanelHTML(g, k.ad)}
        <div class="ya-ust"><div style="display:flex; gap:12px; align-items:center"><span class="ya-av" style="width:48px; height:48px; font-size:17px; background:${kmYaRenk(g)}">${esc(kmYaIlkHarf(k.ad))}</span><div><div class="ya-baslik">${esc(k.ad)}</div><div class="ya-alt">${KM_YA_GRUP_AD[g] || g}</div></div></div></div>
        <div class="ya-sayilar">
            <div class="ya-sayi"><small>Son 8 haftada geldiği gün</small><b>${toplam8}</b><span>haftada ort. ${(toplam8 / 8).toFixed(1)}</span></div>
            <div class="ya-sayi"><small>Son geliş</small><b style="font-size:20px">${tum[0] ? (tum[0] === bugun ? 'Bugün' : kmYaTarihYazi(new Date(tum[0] + 'T12:00:00'))) : '—'}</b><span>${tum[0] ? Math.round((new Date(bugun) - new Date(tum[0])) / 86400000) + ' gün önce' : 'kayıt yok'}</span></div>
            <div class="ya-sayi"><small>Ders günlerine katılım (4 hafta)</small><b>${dersGunleri ? '%' + Math.round(katildi / dersGunleri * 100) : '—'}</b><span>${dersGunleri ? katildi + ' / ' + dersGunleri + ' ders günü' : 'derse kayıtlı değil'}</span></div>
        </div>
        ${kmYaSporcuSayimHTML(k)}
        <div class="ya-kart"><div class="ya-etiket">Kayıtlı olduğu dersler</div>${dersler.length ? dersler.map(s => `<div class="ya-ders"><div class="saat">${s.baslangicSaat}<small>${kmYaSlotGunler(s).map(x => KM_YA_GUN_KISA[x]).join(', ')}</small></div><div><b>${esc(kmYaSlotAd(s))}</b><div class="ya-alt">${s.baslangicSaat}–${s.bitisSaat} · ${kmYaSlotSporcu(s).length} kişilik ders${s.kapasite ? ' (kapasite ' + s.kapasite + ')' : ''}</div></div><button class="ya-cikar" onclick="kmYaCikar(${s.id}, '${kmYaKey(g, k.ad)}')">✕ Çıkar</button></div>`).join('') : '<div class="ya-alt">Ders programında hiçbir derse kayıtlı değil.</div>'}
            ${(() => { let diger = (_kmYa.slotlar || []).filter(s => !dersler.includes(s)).sort((a, b) => kmYaSlotGunler(a)[0] - kmYaSlotGunler(b)[0] || kmYaDk(a.baslangicSaat) - kmYaDk(b.baslangicSaat)); return diger.length ? `<div class="ya-dders-ekle"><select id="ya-dders-sec" aria-label="Eklenecek ders"><option value="">Bir ders seç…</option>${diger.map(s => `<option value="${s.id}">${esc(kmYaDersYazi(s))}</option>`).join('')}</select><button class="ya-btn birincil" onclick="let v = +document.getElementById('ya-dders-sec').value; if (v) kmYaEkle(v, '${kmYaKey(g, k.ad)}')">➕ Derse ekle</button></div>` : ''; })()}</div>
        ${kmYaSporcuGecmisHTML(k)}
        <div class="ya-kart"><div class="ya-etiket">Son 8 hafta devam takvimi</div><div class="ya-takvim">${takvim}</div>
            <div class="ya-alt">🟩 geldi · 🟥 gelmedi olarak işaretlendi · çerçeveli kare = ders günüydü ama kayıt yok</div></div>
        <div class="ya-kart"><div class="ya-etiket">Son gelişleri</div><div class="ya-cipler">${tum.slice(0, 10).map(t => { let rr = otomatikYoklamaDB[t][k.ad]; return `<span class="ya-cip geldi">${kmYaTarihYazi(new Date(t + 'T12:00:00'))}${rr && rr.saat ? ' <small>' + esc(rr.saat) + '</small>' : ''}</span>`; }).join('') || '<span class="ya-alt">Kayıt yok.</span>'}</div></div>
    </div>`;
}
function kmYaHafta(f) { _kmYa.hafta = Math.min(0, Math.max(-60, _kmYa.hafta + f)); _kmYa.gun = null; kmYoklamaAnalizCiz(); }
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
    let dolu = s.kapasite && kmYaSlotSporcu(s).length >= s.kapasite, bekleyen = kmYaBekleyenler(s.id);
    if (dolu) baslik = `⚠️ Ders dolu (${kmYaSlotSporcu(s).length}/${s.kapasite}) — yeni gelenleri bekleme listesine alabilirsin.` + (baslik ? ' ' + baslik : '');
    return `${baslik ? `<div class="ya-alt">${baslik}</div>` : ''}<div class="ya-kisiler">${adaylar.slice(0, 12).map(k => { let kk = kmYaKey(k.g, k.ad), av = `<span class="ya-av" style="background:${kmYaRenk(k.g)}">${esc(kmYaIlkHarf(k.ad))}</span><span style="min-width:0"><b>${esc(k.ad)}</b><small>${kmYaGrupEtiket(k)}</small></span>`;
        if (!dolu) return `<button class="ya-kisi" onclick="kmYaEkle(${s.id}, '${kk}')">${av}<span class="ya-durum g">+ Ekle</span></button>`;
        let bekliyor = bekleyen.some(b => b.g === k.g && b.ad === k.ad);
        return `<div class="ya-kisi ya-yk">${av}<span class="ya-yk-sec">${bekliyor ? '<span class="ya-durum b">⏳ Bekliyor</span>' : `<button class="g" onclick="kmYaBekleEkle(${s.id}, '${kk}')">⏳ Beklemeye al</button>`}<button onclick="kmYaEkle(${s.id}, '${kk}')" title="Kapasite dolu olsa da derse ekle">+ Ekle</button></span></div>`; }).join('')}</div>${adaylar.length > 12 ? `<div class="ya-alt">+${adaylar.length - 12} kişi daha — aramayı daralt.</div>` : ''}`;
}
function kmYaEkleAra(v) {
    _kmYa.ekleAra = v;
    let el = document.getElementById('ya-ekle-sonuc'); if (!el) return;
    let s = kmYaSlotBul(+el.dataset.slot); if (s) el.innerHTML = kmYaEkleSonucHTML(s, el.dataset.iso);
}
function kmYaDuzenle(id) { _kmYa.duzenle = _kmYa.duzenle === id ? null : id; _kmYa.ekleAra = ''; kmYoklamaAnalizCiz(); }
function kmYaDersYazi(s) { return `${kmYaSlotAd(s)} (${kmYaSlotGunler(s).map(x => KM_YA_GUN_KISA[x]).join('·')} ${s.baslangicSaat})`; }
// ================================================================================================
// Derse kayıtlı olmadan gelenler (2026-10-08, kullanıcı: "girdikleri saat dilimlerine eklensin mi diye düzenleme yapabileyim;
// misafir sporcu, eğitmen atışı gibi seçenekler de olsun, ona göre işaretleyeyim").
// Her kişi için: (1) kim — Öğrenci / 🎟️ Misafir / 👔 Eğitmen atışı (kişi türü, dagsk-kisi-yonetimi.js kisiTurAyarla);
// (2) öğrenciyse giriş saatine göre o günün dersi önerilir → "＋ 17:00 X dersine ekle" (ders programına KALICI ekler),
// başka ders seçilebilir; (3) geldi/gelmedi düğmeleri aynen. Başlıkta: öğrencileri tek seferde saatlerine göre ekle.
// ================================================================================================
function kmYaSaatDersi(saat, dersler) {
    if (!dersler.length) return null;
    if (!saat) return dersler.length === 1 ? dersler[0] : null;
    let t = kmYaDk(saat);
    let icinde = dersler.filter(s => t >= kmYaDk(s.baslangicSaat) - 30 && t <= kmYaDk(s.bitisSaat));
    if (icinde.length) return icinde.sort((a, b) => Math.abs(kmYaDk(a.baslangicSaat) - t) - Math.abs(kmYaDk(b.baslangicSaat) - t))[0];
    let en = dersler.slice().sort((a, b) => Math.abs(kmYaDk(a.baslangicSaat) - t) - Math.abs(kmYaDk(b.baslangicSaat) - t))[0];
    return Math.abs(kmYaDk(en.baslangicSaat) - t) <= 90 ? en : null;
}
function kmYaKayitsizKartHTML(kayitsiz, dersler, kayit, iso, bugun) {
    let yIso = iso <= bugun ? iso : null;
    let oneriler = kayitsiz.filter(k => kmYaTur(k) === 'sporcu').map(k => ({ k, s: kmYaSaatDersi(kayit[k.ad] && kayit[k.ad].saat, dersler) })).filter(x => x.s);
    let toplu = dersler.length && oneriler.length > 1 ? `<button class="ya-btn birincil" onclick="kmYaKayitsizTopluEkle('${iso}')">＋ ${oneriler.length} öğrenciyi saatine göre ekle</button>` : '';
    return `<div class="ya-dkart ya-kayitsiz"><div class="ya-dbas"><div style="flex:1"><div class="ya-dad">${dersler.length ? 'Derse kayıtlı olmadan gelenler' : 'Bu gün gelenler'}</div><div class="ya-alt">${dersler.length ? 'Kim olduklarını işaretle; öğrenciyi girdiği saatteki derse kalıcı ekleyebilirsin.' : 'Ders programında bu güne ders yok.'}</div></div><span class="ya-sayac"><b>${kayitsiz.length}</b> kişi</span>${toplu}</div>
        <div class="ya-ks-liste">${kayitsiz.map(k => kmYaKayitsizSatirHTML(k, dersler, kayit[k.ad] && kayit[k.ad].saat, yIso)).join('')}</div></div>`;
}
function kmYaKayitsizSatirHTML(k, dersler, saat, yIso) {
    let key = kmYaKey(k.g, k.ad), tur = kmYaTur(k), oneri = kmYaSaatDersi(saat, dersler);
    let turBtn = (t, yazi) => `<button class="${tur === t ? 'aktif ' + t : ''}" aria-pressed="${tur === t}" onclick="kmYaKayitsizTur('${key}', '${t}')">${yazi}</button>`;
    let ders = '';
    if (tur === 'sporcu' && dersler.length) {
        let sec = `<select class="ya-ks-sec" aria-label="Başka derse ekle" onchange="if(this.value) kmYaEkle(+this.value, '${key}')"><option value="">${oneri ? 'Başka ders…' : 'Derse ekle…'}</option>${dersler.filter(s => !oneri || s.id !== oneri.id).map(s => `<option value="${s.id}">${esc(s.baslangicSaat + ' · ' + kmYaSlotAd(s))}</option>`).join('')}</select>`;
        ders = `<div class="ya-ks-ders">${oneri ? `<button class="ya-btn birincil" onclick="kmYaEkle(${oneri.id}, '${key}')">＋ ${esc(oneri.baslangicSaat)} ${esc(kmYaSlotAd(oneri))} dersine ekle</button>` : '<span class="ya-alt">Giriş saatine uyan ders yok</span>'}${sec}</div>`;
    } else if (tur === 'misafir') ders = '<div class="ya-alt">🎟️ Misafir — derse eklenmez, öğrenci sayılarına katılmaz. Eğitmen & Misafir ekranında takip edilir.</div>';
    else if (tur === 'egitmen') ders = '<div class="ya-alt">👔 Eğitmen atışı — öğrenci yoklamasına ve sayılara katılmaz.</div>';
    let yk = yIso ? (() => { let d = kmYaDurum(k, yIso), c = y => `kmYaYoklama('${yIso}', '${key}', '${d === y ? 'sil' : y}')`;
        return `<span class="ya-yk-sec" role="group" aria-label="${esc(k.ad)} yoklama"><button class="g${d === 'g' ? ' aktif' : ''}" onclick="${c('g')}">✅ Geldi</button><button class="y${d === 'y' ? ' aktif' : ''}" onclick="${c('y')}">❌ Gelmedi</button></span>`; })() : '';
    return `<div class="ya-ks">
        <div class="ya-ks-ust"><button class="ya-kisi-ad" onclick="kmYaSporcuAc('${key}')"><span class="ya-av" style="background:${kmYaRenk(k.g)}">${esc(kmYaIlkHarf(k.ad))}</span><span style="min-width:0"><b>${esc(k.ad)}</b><small>${kmYaGrupEtiket(k)}${saat ? ' · 🕒 ' + esc(saat) : ''}</small></span></button>${yk}</div>
        <div class="ya-ks-tur" role="group" aria-label="${esc(k.ad)} kim?">${turBtn('sporcu', '🎯 Öğrenci')}${turBtn('misafir', '🎟️ Misafir')}${turBtn('egitmen', '👔 Eğitmen atışı')}</div>
        ${ders}</div>`;
}
function kmYaKayitsizTur(key, tur) {
    let k = kmYaAnahtar(key), eski = kmYaTur(k);
    if (eski === tur) return;
    if (typeof kisiTurAyarla !== 'function') return showToast('Kişi türü değiştirilemedi.', 'error');
    let ek = { tur };
    if (tur === 'misafir' && typeof kisiBilgi === 'function' && !(kisiBilgi(k.g, k.ad) || {}).eklenme) ek.eklenme = kmYaIso(new Date());
    if (tur === 'sporcu' && eski === 'misafir') ek.aktifOldu = kmYaIso(new Date());
    kisiTurAyarla(k.g, k.ad, ek);
    showToast(k.ad + ' → ' + (tur === 'misafir' ? '🎟️ misafir' : tur === 'egitmen' ? '👔 eğitmen' : '🎯 öğrenci'), 'success');
    kmYaYenidenCiz();
}
function kmYaKayitsizTopluEkle(iso) {
    let d = new Date(iso + 'T12:00'), gd = d.getDay(), kayit = (otomatikYoklamaDB && otomatikYoklamaDB[iso]) || {};
    let dersler = (_kmYa.slotlar || []).filter(s => kmYaSlotGunler(s).includes(gd) && !(s.istisnalar || []).some(x => x.tarih === iso));
    let kayitli = [].concat(...dersler.map(kmYaSlotSporcu));
    let liste = kmYaSporcular().filter(k => kmYaGeldiMiBool(k, iso) && kmYaTur(k) === 'sporcu' && !kayitli.some(x => x.g === k.g && x.ad === k.ad))
        .map(k => ({ k, s: kmYaSaatDersi(kayit[k.ad] && kayit[k.ad].saat, dersler) })).filter(x => x.s);
    if (!liste.length) return showToast('Saatine uyan ders bulunamadı.', 'warning');
    let ozet = liste.map(x => '• ' + x.k.ad + ' → ' + x.s.baslangicSaat + ' ' + kmYaSlotAd(x.s)).join('\n');
    if (!confirm('Bu öğrenciler ders programına KALICI eklensin mi?\n\n' + ozet)) return;
    let say = 0;
    Promise.all(liste.map(x => fetch('/api/antrenman-programi/' + x.s.id + '/katilimci', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ grup: x.k.g, ad: x.k.ad, deviceId: typeof _cihazId !== 'undefined' ? _cihazId : null }) })
        .then(r => r.ok ? r.json() : null).then(d => { if (d && d.applied) { say++; if (!x.s.katilimcilar) x.s.katilimcilar = []; if (!x.s.katilimcilar.some(y => y.grup === x.k.g && y.ad === x.k.ad)) x.s.katilimcilar.push({ grup: x.k.g, ad: x.k.ad }); } }).catch(() => {})))
        .then(() => { showToast('✓ ' + say + ' öğrenci derslerine eklendi', say ? 'success' : 'error'); kmYaYenidenCiz(true); });
}
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
            let bk = kmYaBekleyenler(s.id);
            if (s.kapasite && bk.length && kmYaSlotSporcu(s).length < s.kapasite) showToast(`${k.ad} çıkarıldı — yer açıldı! Bekleme listesinde ilk sırada: ${bk[0].ad}`, 'warning');
            else showToast(`${k.ad} dersten çıkarıldı`, 'success');
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
// Eski KM "✅ Yoklama" sekmesiyle (2026-09-29 kaldırıldı) AYNI kayıt biçimi ve aynı senkron: otomatikYoklamaDB[iso][ad] =
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
    let yeni = typeof kyMisafirOlustur === 'function' ? `<div class="ya-yeni-mis"><span>Kaydı yok mu? <b>${esc(ara.toLocaleUpperCase('tr-TR'))}</b> için yeni misafir kaydı aç ve geldi işaretle:</span><span class="ya-filtre">${Object.keys(KM_YA_GRUP_AD).map(g => `<button onclick="kmYaYeniMisafir('${iso}', '${g}')">🎟️ ${KM_YA_GRUP_AD[g]}</button>`).join('')}</span></div>` : '';
    if (!adaylar.length) return '<div class="ya-alt">Eşleşen (henüz gelmemiş) aktif sporcu yok.</div>' + yeni;
    return `<div class="ya-kisiler">${adaylar.slice(0, 12).map(k => `<button class="ya-kisi" onclick="kmYaMisafirGeldi('${iso}', '${kmYaKey(k.g, k.ad)}')"><span class="ya-av" style="background:${kmYaRenk(k.g)}">${esc(kmYaIlkHarf(k.ad))}</span><span style="min-width:0"><b>${esc(k.ad)}</b><small>${kmYaGrupEtiket(k)}</small></span><span class="ya-durum g">✅ Geldi</span></button>`).join('')}</div>${yeni}`;
}
function kmYaMisafirAra(v) { _kmYa.misafirAra = v; let el = document.getElementById('ya-misafir-sonuc'); if (el) el.innerHTML = kmYaMisafirSonucHTML(el.dataset.iso); }
function kmYaMisafirGeldi(iso, key) {
    let k = kmYaAnahtar(key);
    kmYaYoklamaYaz(iso, k, 'g');
    _kmYa.misafirAra = '';
    showToast(`${k.ad} geldi işaretlendi ✅`, 'success');
    kmYaYoklamaBitir();
}

// ---------------------------------------------------------------- 📄 Haftalık yoklama PDF raporu (2026-09-28)
// Kullanıcı: "bunların düzgün bir analizli pdf çıktısını alabileceğim bir şey hazırla". Seçili HAFTA için:
// özet kutuları + otomatik yorumlar + gün/8-hafta grafikleri + ders bazında katılım tablosu + ders ders isim
// listesi + sporcu devam tablosu (7 gün kutucuklu) + dikkat listesi. Native jsPDF (_yeniPdfAl) — bu projede
// html2pdf-from-DOM boş PDF üretiyor. Helvetica emoji ve İ/ı/Ğ/ğ/Ş/ş basamaz → metin _trTranslit'ten geçer,
// durumlar renkli kutu/etiketle gösterilir.
function kmYaDersKatilim(k, dersler, bitIso) {
    let dg = 0, kt = 0, bit = new Date(bitIso + 'T12:00:00');
    for (let i = 0; i < 28; i++) {
        let d = new Date(bit); d.setDate(bit.getDate() - i); let iso = kmYaIso(d);
        if (dersler.some(s => kmYaSlotGunler(s).includes(d.getDay()) && !kmYaIptalMi(s, iso))) { dg++; if (kmYaDurum(k, iso) === 'g') kt++; }
    }
    return dg ? { oran: Math.round(kt / dg * 100), kt, dg } : null;
}
function kmYaPdfIndir() {
    if (kmYaAyMi()) return kmYaAylikPdfIndir();
    if (typeof _yeniPdfAl !== 'function') return showToast('PDF altyapısı yüklenemedi.', 'error');
    if (_kmYa.slotlar === null) return showToast('Ders programı henüz yüklenmedi.', 'error');
    showToast('PDF hazırlanıyor...', 'warning');
    const T = s => _trTranslit(String(s == null ? '' : s));
    let gunler = kmYaHaftaGunleri(_kmYa.hafta), isoler = gunler.map(kmYaIso), bugun = kmYaIso(new Date());
    let bitIso = isoler[6] < bugun ? isoler[6] : bugun;
    let tumKisiler = kmYaSporcular(), sporcular = tumKisiler.filter(k => kmYaTur(k) === 'sporcu'), slotlar = _kmYa.slotlar || [];
    let aralik = kmYaTarihYazi(gunler[0]) + ' - ' + kmYaTarihYazi(gunler[6]) + ' ' + gunler[6].getFullYear();
    // ---- veri
    let gunSay = isoler.map(i => sporcular.filter(k => kmYaDurum(k, i) === 'g').length);
    let haftalik = tumKisiler.map(k => { let dersler = kmYaSporcuDersleri(k); return { k, dersler, gel: isoler.filter(i => kmYaDurum(k, i) === 'g').length, son: kmYaSonGelis(k), kat: kmYaDersKatilim(k, dersler, bitIso) }; });
    let ogrHaftalik = haftalik.filter(x => kmYaTur(x.k) === 'sporcu');
    let gelen = ogrHaftalik.filter(x => x.gel).length, toplamGiris = gunSay.reduce((a, b) => a + b, 0);
    let olus = [];
    isoler.forEach((iso, i) => {
        let gd = gunler[i].getDay();
        slotlar.filter(s => kmYaSlotGunler(s).includes(gd)).sort((a, b) => kmYaDk(a.baslangicSaat) - kmYaDk(b.baslangicSaat)).forEach(s => {
            let kayitli = kmYaSlotSporcu(s), iptal = (s.istisnalar || []).find(x => x.tarih === iso), kayit = (otomatikYoklamaDB && otomatikYoklamaDB[iso]) || {};
            let st = kayitli.map(k => { let d = kmYaDurum(k, iso); return { k, d, saat: d === 'g' && kayit[k.ad] ? kayit[k.ad].saat : '' }; });
            let sr = d => d === 'g' ? 0 : d === 'y' ? 2 : 1;
            st.sort((a, b) => sr(a.d) - sr(b.d) || a.k.ad.localeCompare(b.k.ad, 'tr'));
            olus.push({ s, iso, i, kayitli, iptal, yapildi: iso <= bugun && !iptal, st, gel: st.filter(x => x.d === 'g').length, yok: st.filter(x => x.d === 'y').length, bos: st.filter(x => !x.d).length });
        });
    });
    let yapilan = olus.filter(o => o.yapildi && o.kayitli.length);
    let topKayit = yapilan.reduce((a, o) => a + o.kayitli.length, 0), topGel = yapilan.reduce((a, o) => a + o.gel, 0), topBos = yapilan.reduce((a, o) => a + o.bos, 0);
    let trend = [];
    for (let h = _kmYa.hafta - 7; h <= _kmYa.hafta; h++) { let is = kmYaHaftaGunleri(h).map(kmYaIso); trend.push({ h, bas: kmYaHaftaBasi(h), n: sporcular.filter(k => is.some(i => kmYaDurum(k, i) === 'g')).length }); }
    let onceki = trend[6].n, ikiHaftaOnce = kmYaIso(kmYaHaftaBasi(_kmYa.hafta - 1));
    let uzun = ogrHaftalik.filter(x => !x.son || x.son < ikiHaftaOnce).sort((a, b) => String(b.son || '').localeCompare(String(a.son || '')) || a.k.ad.localeCompare(b.k.ad, 'tr'));
    let derssiz = ogrHaftalik.filter(x => !x.dersler.length);
    // ---- otomatik yorumlar
    let yorum = [];
    let gecmisGun = isoler.map((iso, i) => ({ iso, i, n: gunSay[i] })).filter(x => x.iso <= bugun);
    if (gecmisGun.length) { let m = gecmisGun.reduce((a, b) => b.n > a.n ? b : a); if (m.n) yorum.push(`En kalabalik gun ${KM_YA_GUN[gunler[m.i].getDay()]} (${m.n} kisi).`); }
    yorum.push(gelen >= onceki ? `Bu hafta ${gelen} farkli sporcu geldi; bir onceki haftaya gore +${gelen - onceki}.` : `Bu hafta ${gelen} farkli sporcu geldi; bir onceki haftadan ${onceki - gelen} kisi az.`);
    let oranli = yapilan.filter(o => o.kayitli.length >= 2).map(o => Object.assign({ oran: o.gel / o.kayitli.length }, o));
    if (oranli.length > 1) {
        let en = oranli.reduce((a, b) => b.oran > a.oran ? b : a), dus = oranli.reduce((a, b) => b.oran < a.oran ? b : a);
        let ad = o => `${kmYaSlotAd(o.s)} (${KM_YA_GUN_KISA[gunler[o.i].getDay()]} ${o.s.baslangicSaat})`;
        yorum.push(`En yuksek katilim: ${ad(en)} %${Math.round(en.oran * 100)}. En dusuk: ${ad(dus)} %${Math.round(dus.oran * 100)}.`);
    }
    if (topBos) yorum.push(`Yapilan derslerde ${topBos} kayitli sporcu icin yoklama isaretlenmemis - bu, katilim oranlarini oldugundan dusuk gosterir.`);
    if (uzun.length) yorum.push(`${uzun.length} aktif sporcu son 2 haftadir hic gelmedi (liste son bolumde).`);
    if (derssiz.length) yorum.push(`${derssiz.length} aktif sporcu ders programinda hicbir derse kayitli degil.`);

    _yeniPdfAl('portrait').then(pdf => {
        const W = 210, H = 297, M = 14, UW = W - M * 2;
        const LACI = [9, 22, 43], ALTIN = [251, 191, 36], YESIL = [22, 163, 74], KIRMIZI = [220, 38, 38], TURUNCU = [180, 83, 9], GRI = [100, 116, 139], ACIK = [241, 245, 249], YAZI = [15, 23, 42], CIZGI = [226, 232, 240];
        const dolgu = c => pdf.setFillColor(c[0], c[1], c[2]);
        const kalem = c => pdf.setDrawColor(c[0], c[1], c[2]);
        const font = (stil, boy, c) => { pdf.setFont('helvetica', stil); pdf.setFontSize(boy); c = c || YAZI; pdf.setTextColor(c[0], c[1], c[2]); };
        const yaz = (t, x, yy, o) => pdf.text(T(t), x, yy, o || {});
        const kisalt = (t, w) => { t = T(t); if (pdf.getTextWidth(t) <= w) return t; while (t.length > 1 && pdf.getTextWidth(t + '..') > w) t = t.slice(0, -1); return t + '..'; };
        let y;
        const yeniSayfa = () => { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, 'F'); y = 14; };
        const yer = (h, basFn) => { if (y + h > H - 16) { yeniSayfa(); if (basFn) basFn(); } };
        const bolum = (baslik, sag) => {
            yer(24); dolgu(LACI); pdf.rect(M, y, UW, 8, 'F');
            font('bold', 10, [255, 255, 255]); yaz(baslik, M + 3, y + 5.6);
            if (sag) { font('normal', 7.5, ALTIN); yaz(sag, M + UW - 3, y + 5.6, { align: 'right' }); }
            y += 11;
        };
        y = _kurumsalBaslikCiz(pdf, M, UW, 8, 'HAFTALIK YOKLAMA RAPORU', 'Karisik Sinif - ' + aralik);

        // 1) özet kutuları
        let kutular = [
            ['Aktif sporcu', String(sporcular.length), 'kulupte kayitli ve aktif'],
            ['Bu hafta gelen', String(gelen), (sporcular.length ? '%' + Math.round(gelen / sporcular.length * 100) : '') + ' - onceki hafta ' + onceki],
            ['Derslere katilim', topKayit ? '%' + Math.round(topGel / topKayit * 100) : '-', topKayit ? topGel + ' / ' + topKayit + ' kayitli yer dolu' : 'yapilan ders yok'],
            ['Toplam giris', String(toplamGiris), (sporcular.length - gelen) + ' kisi hic gelmedi']
        ];
        let kw = (UW - 9) / 4;
        kutular.forEach((kt, i) => {
            let x = M + i * (kw + 3);
            dolgu(ACIK); pdf.roundedRect(x, y, kw, 21, 2, 2, 'F');
            dolgu(i === 2 ? YESIL : ALTIN); pdf.rect(x, y + 3, 1.2, 15, 'F');
            font('normal', 7, GRI); yaz(kt[0].toLocaleUpperCase('tr-TR'), x + 4, y + 5.5);
            font('bold', 17, YAZI); yaz(kt[1], x + 4, y + 13.5);
            font('normal', 6.5, GRI); yaz(kisalt(kt[2], kw - 6), x + 4, y + 18.3);
        });
        y += 27;

        // 2) yorumlar
        font('bold', 9, YAZI); yaz('Bu haftanin ozeti', M, y); y += 5;
        yorum.forEach(t => {
            font('normal', 8.5, [51, 65, 85]);
            let sat = pdf.splitTextToSize(T(t), UW - 6); yer(sat.length * 4.2 + 1);
            dolgu(ALTIN); pdf.circle(M + 1.3, y - 1.1, 0.9, 'F'); pdf.text(sat, M + 4, y); y += sat.length * 4.2 + 0.8;
        });
        y += 4;

        // 3) grafikler
        let gw = (UW - 6) / 2, gh = 56;
        yer(gh + 8);
        const grafik = (x, baslik, veri, etiket, vurgu) => {
            kalem(CIZGI); pdf.setLineWidth(0.3); pdf.roundedRect(x, y, gw, gh, 2, 2, 'S');
            font('bold', 8.5, YAZI); yaz(baslik, x + 4, y + 6);
            let max = Math.max(1, ...veri.map(v => v == null ? 0 : v)), ax = x + 5, aw = gw - 10, ay = y + gh - 9, ah = gh - 22, bw = aw / veri.length;
            kalem(CIZGI); pdf.setLineWidth(0.2); pdf.line(ax, ay, ax + aw, ay);
            veri.forEach((v, i) => {
                let bx = ax + i * bw + bw * 0.18, w = bw * 0.64;
                if (v != null) {
                    let bh = Math.max(0.6, v / max * ah);
                    dolgu(vurgu(i) ? ALTIN : LACI); pdf.rect(bx, ay - bh, w, bh, 'F');
                    font('bold', 7, YAZI); yaz(String(v), bx + w / 2, ay - bh - 1.5, { align: 'center' });
                }
                font('normal', 6.3, GRI); yaz(etiket(i), bx + w / 2, ay + 4.5, { align: 'center' });
            });
        };
        grafik(M, 'Gunlere gore gelen kisi', isoler.map((iso, i) => iso > bugun ? null : gunSay[i]), i => KM_YA_GUN_KISA[gunler[i].getDay()], i => isoler[i] === bugun);
        grafik(M + gw + 6, 'Son 8 hafta - haftada gelen farkli sporcu', trend.map(t => t.n), i => kmYaTarihYazi(trend[i].bas), i => i === 7);
        y += gh + 8;

        // 4) ders bazında katılım tablosu
        bolum('Ders bazinda katilim', olus.length + ' ders');
        let sut = [[0, 'GUN'], [20, 'SAAT'], [40, 'DERS'], [96, 'KAYITLI'], [112, 'GELDI'], [126, 'GELMEDI'], [142, 'ISARETSIZ'], [160, 'ORAN']];
        const dersBaslik = () => { dolgu(ACIK); pdf.rect(M, y, UW, 6.5, 'F'); font('bold', 6.8, GRI); sut.forEach(([x, t]) => yaz(t, M + 2 + x, y + 4.5)); y += 7.5; };
        dersBaslik();
        if (!olus.length) { font('italic', 8.5, GRI); yaz('Bu hafta ders programinda ders yok.', M + 2, y + 3); y += 8; }
        olus.forEach((o, n) => {
            yer(7, dersBaslik);
            if (n % 2) { pdf.setFillColor(250, 251, 253); pdf.rect(M, y - 1, UW, 6.5, 'F'); }
            let yy = y + 3.4, gd = gunler[o.i];
            font('bold', 8, YAZI); yaz(KM_YA_GUN_KISA[gd.getDay()] + ' ' + gd.getDate(), M + 2, yy);
            font('normal', 8, YAZI); yaz(o.s.baslangicSaat + '-' + o.s.bitisSaat, M + 22, yy);
            yaz(kisalt(kmYaSlotAd(o.s), 53), M + 42, yy);
            if (o.iptal) { font('bold', 7.5, KIRMIZI); yaz('IPTAL' + (o.iptal.sebep ? ' - ' + kisalt(o.iptal.sebep, 60) : ''), M + 98, yy); }
            else if (!o.yapildi) { font('italic', 7.5, GRI); yaz(o.kayitli.length + ' kayitli - henuz yapilmadi', M + 98, yy); }
            else {
                font('normal', 8, YAZI); yaz(String(o.kayitli.length), M + 98, yy);
                font('bold', 8, YESIL); yaz(String(o.gel), M + 114, yy);
                font('bold', 8, o.yok ? KIRMIZI : GRI); yaz(String(o.yok), M + 128, yy);
                font('normal', 8, o.bos ? TURUNCU : GRI); yaz(String(o.bos), M + 144, yy);
                if (o.kayitli.length) {
                    let oran = o.gel / o.kayitli.length, bx = M + 161, bw = 11;
                    dolgu(CIZGI); pdf.rect(bx, yy - 2.4, bw, 2.6, 'F');
                    dolgu(oran >= 0.75 ? YESIL : oran >= 0.5 ? ALTIN : KIRMIZI); pdf.rect(bx, yy - 2.4, Math.max(0.3, bw * oran), 2.6, 'F');
                    font('bold', 7.5, YAZI); yaz('%' + Math.round(oran * 100), M + UW - 1, yy, { align: 'right' });
                } else { font('italic', 7, GRI); yaz('kayitli yok', M + 162, yy); }
            }
            y += 6.5;
        });
        y += 5;

        // 4b) eğitmenler — bu hafta girdikleri dersler
        let egOzet = kmYaEgitmenHaftaOzet(gunler, isoler);
        if (egOzet.length) {
            bolum('Egitmenler', 'bu hafta girdikleri dersler');
            egOzet.forEach(o => {
                font('normal', 7.5, GRI);
                let sat = pdf.splitTextToSize(T(o.dersler.length ? o.dersler.map(x => KM_YA_GUN_KISA[gunler[x.i].getDay()] + ' ' + x.s.baslangicSaat + ' ' + kmYaSlotAd(x.s)).join(', ') : 'derse girdi isaretlenmedi'), UW - 60);
                yer(sat.length * 3.8 + 3);
                font('bold', 8.5, YAZI); yaz(kisalt(o.p.ad, 40), M + 2, y + 3);
                font('bold', 8.5, o.dersler.length ? YESIL : GRI); yaz(o.dersler.length + ' ders', M + 46, y + 3);
                font('normal', 7.5, GRI); pdf.text(sat, M + 60, y + 3);
                y += sat.length * 3.8 + 2.5;
            });
            y += 4;
        }

        // 5) ders ders yoklama listesi (yapılan dersler)
        bolum('Ders ders yoklama listesi', 'kim hangi derste, geldi mi');
        font('normal', 7, GRI);
        let lx = M;
        [[YESIL, 'Geldi (saat)'], [KIRMIZI, 'Gelmedi'], [[203, 213, 225], 'Isaretlenmedi']].forEach(([c, t]) => { dolgu(c); pdf.roundedRect(lx, y - 2.4, 3, 3, 0.6, 0.6, 'F'); font('normal', 7, GRI); yaz(t, lx + 4.2, y); lx += pdf.getTextWidth(T(t)) + 10; });
        y += 5;
        let listelenen = olus.filter(o => o.yapildi);
        if (!listelenen.length) { font('italic', 8.5, GRI); yaz('Bu hafta henuz yapilan ders yok.', M + 2, y + 2); y += 8; }
        const kayitsizYaz = i => {
            let iso = isoler[i], kay = new Set(olus.filter(o => o.i === i).flatMap(o => o.kayitli.map(k => k.g + '|' + k.ad)));
            let ks = sporcular.filter(k => kmYaDurum(k, iso) === 'g' && !kay.has(k.g + '|' + k.ad));
            if (!ks.length) return;
            font('italic', 7.5, GRI);
            let sat = pdf.splitTextToSize(T(`${KM_YA_GUN[gunler[i].getDay()]}: derse kayitli olmadan gelenler (${ks.length}): ` + ks.map(k => k.ad).join(', ')), UW - 4);
            yer(sat.length * 3.8 + 3); pdf.text(sat, M + 2, y + 2); y += sat.length * 3.8 + 3;
        };
        let sonGun = -1;
        listelenen.forEach(o => {
            if (sonGun !== -1 && sonGun !== o.i) kayitsizYaz(sonGun);
            sonGun = o.i;
            let gd = gunler[o.i], satirSay = Math.ceil(o.st.length / 2);
            const basCiz = devam => {
                dolgu(ACIK); pdf.roundedRect(M, y, UW, 7.5, 1.5, 1.5, 'F');
                font('bold', 8.8, YAZI); yaz(kisalt(`${KM_YA_GUN[gd.getDay()]} ${kmYaTarihYazi(gd)} - ${o.s.baslangicSaat}-${o.s.bitisSaat} - ${kmYaSlotAd(o.s)}${devam ? ' (devami)' : ''}`, UW - 70), M + 3, y + 5.1);
                font('bold', 8, o.kayitli.length ? YESIL : GRI); yaz(o.kayitli.length ? `${o.gel}/${o.kayitli.length} geldi${o.yok ? ' - ' + o.yok + ' gelmedi' : ''}${o.bos ? ' - ' + o.bos + ' isaretsiz' : ''}` : 'kayitli sporcu yok', M + UW - 3, y + 5.1, { align: 'right' });
                y += 9.5;
            };
            yer(14 + Math.min(3, Math.max(1, satirSay)) * 6); basCiz(false);
            let egAd = typeof egDersGirenler === 'function' ? egDersGirenler(o.iso, o.s.id).map(egEgitmenAd) : [];
            font('italic', 7.5, GRI); yaz(kisalt('Egitmen: ' + (egAd.length ? egAd.join(', ') : 'isaretlenmedi'), UW - 6), M + 3, y + 0.5); y += 4.5;
            let cw = UW / 2;
            for (let r = 0; r < satirSay; r++) {
                yer(6, () => basCiz(true));
                [o.st[r * 2], o.st[r * 2 + 1]].forEach((x, c) => {
                    if (!x) return;
                    let cx = M + c * cw + 2, yy = y + 3.2;
                    dolgu(x.d === 'g' ? YESIL : x.d === 'y' ? KIRMIZI : [203, 213, 225]); pdf.roundedRect(cx, yy - 2.6, 3.2, 3.2, 0.6, 0.6, 'F');
                    font(x.d === 'g' ? 'bold' : 'normal', 8.3, x.d ? YAZI : GRI); yaz(kisalt(x.k.ad, cw - 52), cx + 5, yy);
                    font('normal', 6.8, GRI); yaz(kisalt(KM_YA_GRUP_AD[x.k.g] || x.k.g, 16), cx + cw - 44, yy);
                    font('bold', 7, x.d === 'g' ? YESIL : x.d === 'y' ? KIRMIZI : GRI); yaz(x.d === 'g' ? 'GELDI' + (x.saat ? ' ' + x.saat : '') : x.d === 'y' ? 'GELMEDI' : 'ISARETSIZ', cx + cw - 5, yy, { align: 'right' });
                });
                kalem(ACIK); pdf.setLineWidth(0.15); pdf.line(M + 2, y + 5.2, M + UW - 2, y + 5.2);
                y += 6;
            }
            y += 3;
        });
        if (sonGun !== -1) kayitsizYaz(sonGun);
        y += 4;

        // 6) sporcu devam tablosu (gruplara göre)
        bolum('Sporcu devam tablosu', 'bu hafta + son 4 haftanin ders gunleri');
        let SX = { ad: 0, ders: 46, gun: 98, hafta: 143, kat: 156, son: 172 };
        const spBaslik = () => {
            dolgu(ACIK); pdf.rect(M, y, UW, 6.5, 'F'); font('bold', 6.6, GRI);
            yaz('SPORCU', M + 2 + SX.ad, y + 4.5); yaz('HANGI DERSTE', M + 2 + SX.ders, y + 4.5);
            gunler.forEach((d, i) => yaz(KM_YA_GUN_KISA[d.getDay()], M + SX.gun + i * 6.2 + 2.9, y + 4.5, { align: 'center' }));
            yaz('HAFTA', M + SX.hafta, y + 4.5); yaz('4 HAFTA', M + SX.kat, y + 4.5); yaz('SON GELIS', M + UW - 2, y + 4.5, { align: 'right' });
            y += 7.5;
        };
        lx = M;
        [[YESIL, true, 'geldi'], [KIRMIZI, true, 'gelmedi'], [[148, 163, 184], false, 'ders gunuydu, isaret yok']].forEach(([c, dolu, s]) => {
            if (dolu) { dolgu(c); pdf.roundedRect(lx, y - 2.6, 3.2, 3.2, 0.5, 0.5, 'F'); } else { kalem(c); pdf.setLineWidth(0.4); pdf.roundedRect(lx, y - 2.6, 3.2, 3.2, 0.5, 0.5, 'S'); }
            font('normal', 7, GRI); yaz(s, lx + 4.5, y); lx += pdf.getTextWidth(T(s)) + 11;
        });
        font('normal', 7, GRI); yaz('4 HAFTA = son 4 haftada kayitli oldugu ders gunlerinin kacina geldi (oran ve gun sayisi)', M, y + 4.5);
        y += 9;
        let gruplar = [...new Set(haftalik.map(x => kmYaGrupAnahtar(x.k)))].sort(kmYaGrupSira);
        gruplar.forEach(g => {
            let ic = haftalik.filter(x => kmYaGrupAnahtar(x.k) === g).sort((a, b) => a.k.ad.localeCompare(b.k.ad, 'tr'));
            yer(24); font('bold', 9.5, YAZI); yaz(g === '__egitmen' ? 'Egitmenler' : g === '__misafir' ? 'Misafirler' : (KM_YA_GRUP_AD[g] || g), M, y + 3);
            font('normal', 7.5, GRI); yaz(`${ic.length} sporcu - bu hafta ${ic.filter(x => x.gel).length} geldi`, M + 28, y + 3); y += 5.5;
            spBaslik();
            ic.forEach((x, n) => {
                yer(6, spBaslik);
                if (n % 2) { pdf.setFillColor(250, 251, 253); pdf.rect(M, y - 1, UW, 6, 'F'); }
                let yy = y + 3.1;
                font('bold', 8, YAZI); yaz(kisalt(x.k.ad, 44), M + 2 + SX.ad, yy);
                font('normal', 7, x.dersler.length ? [51, 65, 85] : GRI); yaz(kisalt(x.dersler.length ? x.dersler.map(kmYaDersEtiket).join(', ') : 'derse kayitli degil', 49), M + 2 + SX.ders, yy);
                isoler.forEach((iso, i) => {
                    let st = kmYaDurum(x.k, iso), cx = M + SX.gun + i * 6.2 + 1, dersGunu = x.dersler.some(s => kmYaSlotGunler(s).includes(gunler[i].getDay()) && !kmYaIptalMi(s, iso));
                    if (st) { dolgu(st === 'g' ? YESIL : KIRMIZI); pdf.roundedRect(cx, yy - 2.8, 3.8, 3.8, 0.6, 0.6, 'F'); }
                    else if (dersGunu && iso <= bugun) { kalem([148, 163, 184]); pdf.setLineWidth(0.4); pdf.roundedRect(cx, yy - 2.8, 3.8, 3.8, 0.6, 0.6, 'S'); }
                    else { dolgu(ACIK); pdf.roundedRect(cx, yy - 2.8, 3.8, 3.8, 0.6, 0.6, 'F'); }
                });
                font('bold', 8, x.gel ? YESIL : KIRMIZI); yaz(x.gel ? x.gel + ' gun' : 'yok', M + SX.hafta, yy);
                if (x.kat) { let o = x.kat.oran; font('bold', 8, o >= 75 ? YESIL : o >= 50 ? TURUNCU : KIRMIZI); yaz('%' + o, M + SX.kat, yy); font('normal', 6.3, GRI); yaz(x.kat.kt + '/' + x.kat.dg, M + SX.kat + 9, yy); }
                else { font('normal', 7.5, GRI); yaz('-', M + SX.kat, yy); }
                font('normal', 7.5, YAZI); yaz(x.son ? (x.son === bugun ? 'bugun' : kmYaTarihYazi(new Date(x.son + 'T12:00:00'))) : '-', M + UW - 2, yy, { align: 'right' });
                y += 6;
            });
            y += 4;
        });

        // 7) dikkat listesi
        bolum('Dikkat listesi', 'takip edilmesi gerekenler');
        const liste = (baslik, arr, satirFn) => {
            yer(14); font('bold', 8.8, YAZI); yaz(`${baslik} (${arr.length})`, M, y + 3); y += 6;
            if (!arr.length) { font('italic', 8, GRI); yaz('Yok.', M + 2, y + 2); y += 7; return; }
            let cw = UW / 2;
            for (let r = 0; r < Math.ceil(arr.length / 2); r++) {
                yer(5.5);
                [arr[r * 2], arr[r * 2 + 1]].forEach((x, c) => {
                    if (!x) return; let [sol, sag] = satirFn(x);
                    font('normal', 8, YAZI); yaz(kisalt(sol, cw - 42), M + 2 + c * cw, y + 3);
                    font('normal', 7, GRI); yaz(sag, M + c * cw + cw - 4, y + 3, { align: 'right' });
                });
                y += 5.2;
            }
            y += 4;
        };
        liste('Son 2 haftadir hic gelmeyenler', uzun, x => [x.k.ad + ' - ' + (KM_YA_GRUP_AD[x.k.g] || x.k.g), x.son ? 'son: ' + kmYaTarihYazi(new Date(x.son + 'T12:00:00')) + ' (' + Math.round((new Date(bugun + 'T12:00:00') - new Date(x.son + 'T12:00:00')) / 86400000) + ' gun once)' : 'hic kayit yok']);
        liste('Hicbir derse kayitli olmayanlar', derssiz, x => [x.k.ad + ' - ' + (KM_YA_GRUP_AD[x.k.g] || x.k.g), x.gel ? 'bu hafta ' + x.gel + ' gun geldi' : '']);

        _kurumsalAltBilgiCiz(pdf, W, H);
        pdf.save('Yoklama_Raporu_' + isoler[0] + '.pdf');
        showToast('PDF indirildi! 📄', 'success');
    }).catch(e => { console.error(e); showToast('PDF oluşturulamadı.', 'error'); });
}

// ---------------------------------------------------------------- 👔 derse göre eğitmen yoklaması (2026-09-28)
// Kullanıcı: "yoklama kısmında öğrenci gibi eğitmen yoklaması da olsun, o derse hangi eğitmenler girdi
// göreyim, düzeltebileyim". Eğitmen listesi = Yönetici › Personel (personelDB). Kayıt: dagsk-kisi-yonetimi.js
// egDers* (meta "egitmen_ders_yoklama"); derse girdi işaretlenince o günün personel girişine de yazılır.
function kmYaEgitmenSatirHTML(slotId, iso) {
    if (typeof egEgitmenler !== 'function') return '';
    let eg = egEgitmenler(), giren = egDersGirenler(iso, slotId);
    if (!eg.length) return `<div class="ya-eg"><span class="ya-eg-bas">👔 Derse giren eğitmen</span><span class="ya-alt">Eğitmen listesi boş.</span><button class="ya-eg-cip ek" onclick="egEgitmenHizliEkle(kmYaYenidenCiz)">+ Eğitmen ekle</button></div>`;
    return `<div class="ya-eg"><span class="ya-eg-bas">👔 Derse giren eğitmen${giren.length ? '' : ' <em>— dokunarak işaretle</em>'}</span>${eg.map(p => { let on = giren.includes(p.id); return `<button class="ya-eg-cip${on ? ' on' : ''}" aria-pressed="${on}" onclick="kmYaEgitmen('${iso}', ${slotId}, '${String(p.id).replace(/'/g, '')}')">${on ? '✓ ' : ''}${esc(p.ad)}</button>`; }).join('')}<button class="ya-eg-cip ek" onclick="egEgitmenHizliEkle(kmYaYenidenCiz)" title="Listede olmayan eğitmeni ekle" aria-label="Yeni eğitmen ekle">+</button></div>`;
}
function kmYaEgitmen(iso, slotId, pid) {
    if (iso > kmYaIso(new Date())) return showToast('İleri bir tarihin yoklaması alınamaz.', 'error');
    let on = egDersGirenler(iso, slotId).includes(pid);
    egDersIsaretle(iso, slotId, pid, !on);
    let s = kmYaSlotBul(slotId);
    showToast(`👔 ${egEgitmenAd(pid)} ${on ? '— işaret kaldırıldı' : '→ ' + (s ? kmYaSlotAd(s) + ' ' + s.baslangicSaat : 'derse') + ' dersine girdi'}`, 'success');
    kmYaYenidenCiz();
}
// Sayılar sekmesi: bu hafta hangi eğitmen hangi derslere girdi
function kmYaEgitmenHaftaOzet(gunler, isoler) {
    if (typeof egEgitmenler !== 'function') return [];
    let slotlar = _kmYa.slotlar || [];
    return egEgitmenler().map(p => {
        let dersler = [];
        isoler.forEach((iso, i) => slotlar.filter(s => kmYaSlotGunler(s).includes(gunler[i].getDay())).forEach(s => { if (egDersGirenler(iso, s.id).includes(p.id)) dersler.push({ i, s }); }));
        return { p, dersler };
    });
}
function kmYaEgitmenHaftaHTML(gunler, isoler) {
    let ozet = kmYaEgitmenHaftaOzet(gunler, isoler);
    if (!ozet.length) return '';
    let ayMod = kmYaAyMi(), donem = kmYaDonemYazi();
    let liste = o => o.dersler.map(x => `${ayMod ? gunler[x.i].getDate() + ' ' : ''}${KM_YA_GUN_KISA[gunler[x.i].getDay()]} ${x.s.baslangicSaat} ${esc(kmYaSlotAd(x.s))}`).join(' · ');
    return `<div class="ya-kart"><div class="ya-etiket">👔 Eğitmenler — ${donem} girdikleri dersler</div>
        ${ozet.map(o => `<div class="ya-ders"><div class="saat" style="font-size:20px">${o.dersler.length}<small>ders</small></div><div><b>${esc(o.p.ad)}</b>${o.dersler.length ? (ayMod ? `<details class="ya-alt"><summary>${new Set(o.dersler.map(x => x.i)).size} farklı gün · dersleri göster</summary>${liste(o)}</details>` : `<div class="ya-alt">${liste(o)}</div>`) : `<div class="ya-alt">${kmYaBuyukIlk(donem)} derse girdi işaretlenmedi</div>`}</div><div></div></div>`).join('')}
        <div class="ya-alt">Dersler sekmesinde her dersin altındaki eğitmen adına dokunarak işaretlenir.</div></div>`;
}
// "Listede olmayan biri mi geldi?" — hiç kaydı yoksa: yeni misafir kaydı aç + o gün geldi işaretle
function kmYaYeniMisafir(iso, g) {
    let ad = (_kmYa.misafirAra || '').replace(/\s+/g, ' ').trim().toLocaleUpperCase('tr-TR');
    if (!ad || typeof kyMisafirOlustur !== 'function') return;
    if (turnuvaDB[g] && turnuvaDB[g][ad]) return showToast(`${ad} zaten ${KM_YA_GRUP_AD[g] || g} grubunda kayıtlı.`, 'warning');
    if (!kyMisafirOlustur(g, ad, {}, iso)) return showToast('Misafir kaydı açılamadı.', 'error');
    _kmYa.misafirAra = '';
    showToast(`🎟️ ${ad} misafir olarak kaydedildi ve geldi işaretlendi. Bilgilerini Yönetici › Eğitmen & Misafir'den ekleyebilirsin.`, 'success');
    kmYaYenidenCiz();
}

// ---------------------------------------------------------------- 🗓️ AYLIK GÖRÜNÜM (2026-09-28)
// Kullanıcı: "yoklama kısmına aylık da veri getir". Başlıktaki Hafta/Ay anahtarı: Ay modunda Dersler sekmesi
// ay takvimi + ders bazında aylık katılım, Sporcular/Sayılar ayın tüm günleri üzerinden, PDF yatay aylık rapor.
function kmYaAyMi() { return _kmYa.mod === 'ay'; }
function kmYaAyBasi(ofset) { let d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(1); d.setMonth(d.getMonth() + ofset); return d; }
function kmYaAyGunleri(ofset) { let b = kmYaAyBasi(ofset), out = [], d = new Date(b); while (d.getMonth() === b.getMonth()) { out.push(new Date(d)); d.setDate(d.getDate() + 1); } return out; }
function kmYaAyAd(d) { return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }); }
function kmYaBuyukIlk(s) { s = String(s || ''); return s.charAt(0).toLocaleUpperCase('tr-TR') + s.slice(1); }
function kmYaDonemYazi() {
    if (kmYaAyMi()) return _kmYa.ay === 0 ? 'bu ay' : _kmYa.ay === -1 ? 'geçen ay' : kmYaAyAd(kmYaAyBasi(_kmYa.ay));
    return _kmYa.hafta === 0 ? 'bu hafta' : _kmYa.hafta === -1 ? 'geçen hafta' : Math.abs(_kmYa.hafta) + ' hafta önce';
}
function kmYaMod(m) {
    if (_kmYa.mod === m) return;
    // dönem değişince aynı zaman noktasında kal: haftadan aya geçince o haftanın ayı, aydan haftaya geçince o ayın (bugün ya da son) haftası
    if (m === 'ay') { let d = kmYaHaftaBasi(_kmYa.hafta), n = new Date(); _kmYa.ay = Math.max(-12, (d.getFullYear() - n.getFullYear()) * 12 + d.getMonth() - n.getMonth()); }
    else { let g = kmYaAyGunleri(_kmYa.ay), hedef = _kmYa.ay === 0 ? new Date() : g[g.length - 1]; kmYaTarihAc(kmYaIso(hedef), true); return; }
    _kmYa.mod = m; _kmYa.duzenle = null; kmYoklamaAnalizCiz();
}
function kmYaDonemKaydir(f) {
    if (kmYaAyMi()) { _kmYa.ay = Math.min(0, Math.max(-12, _kmYa.ay + f)); kmYoklamaAnalizCiz(); }
    else kmYaHafta(f);
}
// Bir tarihi haftalık Dersler görünümünde aç (takvim günü / grafik sütunu).
// ---------------------------------------------------------------- GÜN SONU ÖZETİ + KAÇ KEZ GELDİ (2026-10-04)
// Kullanıcı: "skor girince otomatik yoklama alıyordun, neden son 2 aydır yoklamaya yazılmadı; bugün derslere bazılarını
// ekledim, o derste olanları gösteren bir şey göremedim; kim hangi gruba gelmişse ona göre gün sonu yoklama özeti;
// Elif Kahraman son iki ayda kaç kez gelmiş?". Canlı veride Ağustos'ta 82 skor gününün 54'ünde yoklama yazılmamıştı.
// Artık o gün skoru olan sporcu yoklamada yoksa da GELDİ sayılır (🎯 "skorla"), "kaç kez geldi" sorusu dönem seçerek
// cevaplanır, günün en üstünde grup grup / ders ders özet çıkar. Ders programı her açılışta tazelenir.
let _kmYaSeriOnbellek = {};
function kmYaSeriGunleri(k) {
    let anahtar = k.g + '|' + k.ad, c = _kmYaSeriOnbellek[anahtar];
    if (c && Date.now() - c.t < 20000) return c.g;
    let sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad], g = {};
    if (sp) [].concat(sp.seriler || [], ...(sp.kartGecmisi || []).map(x => x.seriler || [])).forEach(s => { if (s && s.tarih && !s.iptal) g[s.tarih] = (g[s.tarih] || 0) + 1; });
    _kmYaSeriOnbellek[anahtar] = { t: Date.now(), g };
    return g;
}
// 'g' geldi (yoklama) · 's' yoklamada yok ama o gün skoru var → geldi · 'y' gelmedi işaretli · null kayıt yok
function kmYaGeldiMi(k, iso) { let st = kmYaDurum(k, iso); if (st === 'g') return 'g'; if (kmYaSeriGunleri(k)[iso]) return 's'; return st; }
function kmYaGeldiMiBool(k, iso) { let st = kmYaGeldiMi(k, iso); return st === 'g' || st === 's'; }
function kmYaGunAraligi(bas, son) { let out = [], d = new Date(bas + 'T12:00:00'), e = new Date(son + 'T12:00:00'); while (d <= e && out.length < 400) { out.push(kmYaIso(d)); d.setDate(d.getDate() + 1); } return out; }
const KM_YA_SAYIM = { donem: null, g30: 30, g60: 60, g90: 90 };
function kmYaSayimAraligi(sec) { let n = KM_YA_SAYIM[sec]; if (!n) return null; let s = new Date(), b = new Date(); b.setDate(s.getDate() - (n - 1)); return { bas: kmYaIso(b), son: kmYaIso(s), ad: 'son ' + n + ' gün' }; }
function kmYaSayimSec(sec) { _kmYa.sayim = sec; kmYoklamaAnalizCiz(); }
function kmYaSayimCipler(secili, fn) {
    return `<div class="ya-filtre ya-sayim" role="group" aria-label="Sayım dönemi">${[['donem', kmYaBuyukIlk(kmYaDonemYazi())], ['g30', 'Son 30 gün'], ['g60', 'Son 60 gün'], ['g90', 'Son 90 gün']].map(([id, ad]) => `<button class="${secili === id ? 'aktif' : ''}" onclick="${fn}('${id}')">${ad}</button>`).join('')}</div>`;
}
// ---- gün sonu özeti
function kmYaGunOzetVeri(iso, dersler) {
    let kisiler = kmYaSporcular().map(k => ({ k, st: kmYaGeldiMi(k, iso) }));
    let gelen = kisiler.filter(x => x.st === 'g' || x.st === 's'), gelmedi = kisiler.filter(x => x.st === 'y');
    let gruplar = {}; gelen.forEach(x => { let a = kmYaGrupAnahtar(x.k); (gruplar[a] = gruplar[a] || []).push(x); });
    let dersOzet = dersler.filter(s => !kmYaIptalMi(s, iso)).map(s => { let kayitli = kmYaSlotSporcu(s); return { s, kayitli: kayitli.length, geldi: kayitli.filter(k => kmYaGeldiMiBool(k, iso)).length }; });
    let kayitlilar = [].concat(...dersler.map(kmYaSlotSporcu)), kayitsiz = gelen.filter(x => !kayitlilar.some(y => y.g === x.k.g && y.ad === x.k.ad));
    return { gelen, gelmedi, gruplar, dersOzet, kayitsiz, ogrenci: gelen.filter(x => kmYaTur(x.k) === 'sporcu').length };
}
function kmYaGunOzetHTML(iso, d, dersler) {
    let v = kmYaGunOzetVeri(iso, dersler); if (!v.gelen.length && !v.gelmedi.length) return '';
    let skorla = v.gelen.filter(x => x.st === 's').length;
    let grupHTML = Object.keys(v.gruplar).sort(kmYaGrupSira).map(a => `<div class="ya-oz-grup"><div class="ya-oz-grup-bas"><i style="background:${a === '__egitmen' ? '#38bdf8' : a === '__misafir' ? '#f472b6' : kmYaRenk(a)}"></i><b>${KM_YA_TUR_GRUP[a] || KM_YA_GRUP_AD[a] || esc(a)}</b><span>${v.gruplar[a].length} kişi</span></div>
        <div class="ya-cipler">${v.gruplar[a].sort((x, y) => x.k.ad.localeCompare(y.k.ad, 'tr')).map(x => `<button class="ya-cip geldi" onclick="kmYaSporcuAc('${kmYaKey(x.k.g, x.k.ad)}')">${esc(x.k.ad)}${x.st === 's' ? ' <small title="Yoklamada yok, o gün skoru var">🎯</small>' : ''}</button>`).join('')}</div></div>`).join('');
    let dersHTML = v.dersOzet.length ? `<div class="ya-oz-dersler">${v.dersOzet.map(x => `<div class="ya-oz-ders"><span>${x.s.baslangicSaat}</span><b>${esc(kmYaSlotAd(x.s))}</b><em>${x.geldi}/${x.kayitli} geldi</em></div>`).join('')}${v.kayitsiz.length ? `<div class="ya-oz-ders"><span>—</span><b>Derse kayıtsız gelen</b><em>${v.kayitsiz.length} kişi</em></div>` : ''}</div>` : '';
    return `<details class="ya-kart ya-ozet" ${_kmYa.ozetKapali ? '' : 'open'}>
        <summary><span class="ya-etiket">📋 Gün sonu özeti</span><span class="ya-oz-sayi"><b>${v.ogrenci}</b> sporcu geldi${v.gelen.length > v.ogrenci ? ' · ' + (v.gelen.length - v.ogrenci) + ' eğitmen/misafir' : ''}${v.gelmedi.length ? ' · ' + v.gelmedi.length + ' gelmedi' : ''}</span></summary>
        ${dersHTML}${grupHTML}
        ${skorla ? `<div class="ya-alt">🎯 ${skorla} kişi yoklamaya işlenmemiş ama o gün skoru var; geldi sayıldı.</div>` : ''}
        <div style="display:flex; gap:8px; flex-wrap:wrap"><button class="ya-btn" onclick="kmYaGunOzetPaylas('${iso}', false)">📋 Kopyala</button><button class="ya-btn" onclick="kmYaGunOzetPaylas('${iso}', true)">💬 WhatsApp</button></div>
    </details>`;
}
function kmYaGunOzetPaylas(iso, wa) {
    let d = new Date(iso + 'T12:00:00'), dersler = (_kmYa.slotlar || []).filter(s => kmYaSlotGunler(s).includes(d.getDay())).sort((a, b) => kmYaDk(a.baslangicSaat) - kmYaDk(b.baslangicSaat));
    let v = kmYaGunOzetVeri(iso, dersler), satir = ['DAĞ S.K. · Yoklama özeti · ' + KM_YA_GUN[d.getDay()] + ' ' + d.toLocaleDateString('tr-TR'), v.ogrenci + ' sporcu geldi' + (v.gelmedi.length ? ' · ' + v.gelmedi.length + ' gelmedi' : ''), ''];
    v.dersOzet.forEach(x => satir.push(x.s.baslangicSaat + ' ' + kmYaSlotAd(x.s) + ': ' + x.geldi + '/' + x.kayitli + ' geldi'));
    if (v.dersOzet.length) satir.push('');
    Object.keys(v.gruplar).sort(kmYaGrupSira).forEach(a => { satir.push((KM_YA_TUR_GRUP[a] || KM_YA_GRUP_AD[a] || a) + ' (' + v.gruplar[a].length + '): ' + v.gruplar[a].map(x => x.k.ad).sort((p, q) => p.localeCompare(q, 'tr')).join(', ')); });
    if (v.gelmedi.length) satir.push('', 'Gelmedi: ' + v.gelmedi.map(x => x.k.ad).join(', '));
    let metin = satir.join('\n');
    if (wa) { window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(metin), '_blank', 'noopener'); return; }
    try { navigator.clipboard.writeText(metin).then(() => showToast('Özet kopyalandı', 'success'), () => showToast('Kopyalanamadı', 'error')); } catch (e) { showToast('Kopyalanamadı', 'error'); }
}
// ---- sporcu: dönemde kaç kez geldi
function kmYaSporcuSayimHTML(k) {
    let sec = _kmYa.detaySayim || 'g60', ar = kmYaSayimAraligi(sec) || kmYaSayimAraligi('g60');
    if (kmYaArsivGerekli(ar.bas)) kmYaArsivYukle(ar.bas, ar.son);
    let gunler = kmYaGunAraligi(ar.bas, ar.son).map(iso => ({ iso, st: kmYaGeldiMi(k, iso) })), gelen = gunler.filter(x => x.st === 'g' || x.st === 's'), gelmedi = gunler.filter(x => x.st === 'y');
    let c = (id, ad) => `<button class="${sec === id ? 'aktif' : ''}" onclick="_kmYa.detaySayim='${id}'; kmYoklamaAnalizCiz()">${ad}</button>`;
    return `<div class="ya-kart ya-kac"><div class="ya-etiket">Kaç kez geldi?</div>
        <div class="ya-filtre">${c('g30', 'Son 30 gün')}${c('g60', 'Son 60 gün')}${c('g90', 'Son 90 gün')}</div>
        <div class="ya-kac-sonuc"><b>${gelen.length}</b><span>kez geldi · ${ar.ad}${gelmedi.length ? ' · ' + gelmedi.length + ' kez gelmedi işaretli' : ''}</span></div>
        <div class="ya-cipler">${gelen.slice().reverse().map(x => `<span class="ya-cip geldi">${kmYaTarihYazi(new Date(x.iso + 'T12:00:00'))}${x.st === 's' ? ' <small title="Yoklamada yok, o gün skoru var">🎯</small>' : ''}</span>`).join('') || '<span class="ya-alt">Bu dönemde kayıt yok.</span>'}</div>
        ${gelen.some(x => x.st === 's') ? '<div class="ya-alt">🎯 = yoklamaya işlenmemiş ama o gün skoru girilmiş (geldi sayıldı).</div>' : ''}</div>`;
}

// ---------------------------------------------------------------- DERS PROGRAMI GEÇMİŞİ (2026-10-04)
// Sunucu her katılımcı ekleme/çıkarmayı meta 'program_gecmis'e yazar (antrenmanProgrami.ts) — burada salt okunur gösterilir.
let _kmYaGecmis = { t: 0, l: null, yuk: false, hata: null };
function kmYaGecmisYukle(sonra) {
    if (_kmYaGecmis.yuk || (_kmYaGecmis.l && Date.now() - _kmYaGecmis.t < 30000)) return;
    _kmYaGecmis.yuk = true;
    fetch('/api/meta/program_gecmis', { cache: 'no-store' }).then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => {
        let o = {}; try { o = d && d.value ? JSON.parse(d.value) : {}; } catch (e) {}
        _kmYaGecmis.l = Object.values(o).filter(x => x && x.t).sort((a, b) => b.t - a.t); _kmYaGecmis.hata = null;
    }).catch(st => { _kmYaGecmis.l = _kmYaGecmis.l || []; _kmYaGecmis.hata = st === 401 || st === 403 ? 'Geçmişi görmek için giriş yapmalısın.' : 'Geçmiş yüklenemedi (bağlantı?).'; })
        .then(() => { _kmYaGecmis.t = Date.now(); _kmYaGecmis.yuk = false; if (sonra) sonra(); });
}
function kmYaGecmisSatirHTML(x, adGoster) {
    let d = new Date(x.t);
    return `<div class="ya-gs ${x.islem === 'ekle' ? 'ekle' : 'cikar'}"><span class="ya-gs-z">${d.toTimeString().slice(0, 5)}</span><span class="ya-gs-i">${x.islem === 'ekle' ? '➕' : '➖'}</span>
        <span class="ya-gs-m">${adGoster ? `<button class="ya-gs-ad" onclick="kmYaSporcuAc('${kmYaKey(x.grup, x.ad)}')">${esc(x.ad)}</button> ` : ''}${x.islem === 'ekle' ? 'eklendi →' : 'çıkarıldı ←'} <b>${esc(x.ders)}</b></span><span class="ya-gs-k">${x.kim ? '👤 ' + esc(x.kim) : ''}</span></div>`;
}
function kmYaGecmisGunlu(l, adGoster) {
    let gruplar = {}; l.forEach(x => { let g = kmYaIso(new Date(x.t)); (gruplar[g] = gruplar[g] || []).push(x); });
    return Object.keys(gruplar).sort().reverse().map(g => `<div class="ya-etiket">${KM_YA_GUN[new Date(g + 'T12:00:00').getDay()]} ${kmYaTarihYazi(new Date(g + 'T12:00:00'))}</div>${gruplar[g].map(x => kmYaGecmisSatirHTML(x, adGoster)).join('')}`).join('');
}
function kmYaGecmisHTML() {
    kmYaGecmisYukle(kmYaYenidenCiz);
    if (!_kmYa.gecmisIlk) _kmYa.gecmisIlk = true;
    let l = _kmYaGecmis.l; if (!l) return '<div class="ya-kart"><div class="ya-alt">Geçmiş yükleniyor…</div></div>';
    let ara = _kmYa.ara ? _kmYa.ara.toLocaleLowerCase('tr-TR') : '';
    let s = l.filter(x => !ara || String(x.ad).toLocaleLowerCase('tr-TR').includes(ara) || String(x.ders).toLocaleLowerCase('tr-TR').includes(ara)).slice(0, 300);
    return `<div class="ya-kart">
        <input class="ya-ara" type="search" placeholder="🔍 Sporcu ya da ders ara" value="${esc(_kmYa.ara)}" oninput="kmYaAra(this.value)">
        <div class="ya-alt">Ders programına kim, ne zaman, hangi derse eklendi ya da çıkarıldı. Kayıt 4 Ekim 2026'dan itibaren tutuluyor; Ders Programı, Yoklama ve Karışık Sınıf'taki 📌 düğmesinden yapılan değişikliklerin hepsi buraya düşer.</div>
        ${_kmYaGecmis.hata ? `<div class="ya-alt" style="color:var(--status-danger)">${esc(_kmYaGecmis.hata)}</div>` : ''}
        ${s.length ? kmYaGecmisGunlu(s, true) : '<div class="ya-alt">Henüz kayıt yok.</div>'}
    </div>`;
}
function kmYaSporcuGecmisHTML(k) {
    kmYaGecmisYukle(kmYaYenidenCiz);
    let l = (_kmYaGecmis.l || []).filter(x => x.ad === k.ad && x.grup === k.g);
    return `<div class="ya-kart"><div class="ya-etiket">Ders programı geçmişi</div>${_kmYaGecmis.l ? (l.length ? kmYaGecmisGunlu(l, false) : '<div class="ya-alt">Bu sporcu için kayıtlı değişiklik yok (kayıt 4 Ekim 2026\'dan itibaren).</div>') : '<div class="ya-alt">Yükleniyor…</div>'}</div>`;
}
function kmYaTarihAc(iso, sekmeyiKoru) {
    let d = new Date(iso + 'T12:00:00'), pzt = new Date(d); pzt.setDate(d.getDate() - (d.getDay() + 6) % 7);
    let fark = Math.round((pzt - kmYaHaftaBasi(0)) / (7 * 86400000));
    _kmYa.mod = 'hafta'; _kmYa.hafta = Math.max(-60, Math.min(0, fark)); _kmYa.gun = (d.getDay() + 6) % 7; _kmYa.duzenle = null;
    if (!sekmeyiKoru) _kmYa.gorunum = 'ders';
    kmYoklamaAnalizCiz();
    let ic = document.getElementById('km-icerik'); if (ic && !sekmeyiKoru) ic.scrollIntoView({ block: 'start' });
}
// ---- arşiv katmanı
function kmYaArsivEsik() { let d = new Date(); d.setDate(d.getDate() - 85); return kmYaIso(d); }
function kmYaArsivGerekli(basIso) { return basIso < kmYaArsivEsik(); }
// true = yükleniyor (ekrana not düşülür), false = zaten yüklü
function kmYaArsivYukle(bas, son) {
    let anahtar = bas + '|' + son;
    if (_kmYaArsivYuklu[anahtar] === true) return false;
    if (_kmYaArsivYuklu[anahtar] === 'yukleniyor') return true;
    _kmYaArsivYuklu[anahtar] = 'yukleniyor';
    fetch('/api/attendance/auto?from=' + bas + '&to=' + son).then(r => r.json()).then(d => {
        (d.attendance || []).forEach(a => { (_kmYaArsiv[a.tarih] = _kmYaArsiv[a.tarih] || {})[a.ad] = { saat: a.saat, grup: a.grup, elle: !!a.elle, geldi: a.geldi !== 0 }; });
        _kmYaArsivYuklu[anahtar] = true;
    }).catch(() => { _kmYaArsivYuklu[anahtar] = true; }).then(() => { if (document.querySelector('#km-icerik .ya')) kmYoklamaAnalizCiz(); });
    return true;
}
// Dönem içindeki (bugüne kadarki, iptal olmayan) kayıtlı ders günlerinin kaçına geldi
function kmYaAralikKatilim(k, dersler, isoler) {
    let bugun = kmYaIso(new Date()), dg = 0, kt = 0;
    isoler.forEach(iso => { if (iso > bugun) return; let gd = new Date(iso + 'T12:00:00').getDay(); if (dersler.some(s => kmYaSlotGunler(s).includes(gd) && !kmYaIptalMi(s, iso))) { dg++; if (kmYaDurum(k, iso) === 'g') kt++; } });
    return dg ? { dg, kt } : null;
}
// ---- ders bazında dönem özeti (her ders programı satırı için)
function kmYaDonemDersOzet(gunler, isoler) {
    let bugun = kmYaIso(new Date());
    return (_kmYa.slotlar || []).map(s => {
        let kayitli = kmYaSlotSporcu(s), gunSet = kmYaSlotGunler(s), yapilan = 0, iptal = 0, planli = 0, gel = 0, egSay = {};
        isoler.forEach((iso, i) => {
            if (!gunSet.includes(gunler[i].getDay())) return;
            if (kmYaIptalMi(s, iso)) { iptal++; return; }
            if (iso > bugun) { planli++; return; }
            yapilan++;
            gel += kayitli.filter(k => kmYaDurum(k, iso) === 'g').length;
            if (typeof egDersGirenler === 'function') egDersGirenler(iso, s.id).forEach(p => { egSay[p] = (egSay[p] || 0) + 1; });
        });
        let egitmen = Object.keys(egSay).sort((a, b) => egSay[b] - egSay[a]).map(p => ({ ad: typeof egEgitmenAd === 'function' ? egEgitmenAd(p) : p, n: egSay[p] }));
        return { s, kayitli: kayitli.length, yapilan, iptal, planli, gel, ort: yapilan ? gel / yapilan : 0, oran: yapilan && kayitli.length ? gel / (yapilan * kayitli.length) : null, egitmen };
    }).filter(o => o.yapilan || o.iptal || o.planli).sort((a, b) => kmYaSlotGunler(a.s)[0] - kmYaSlotGunler(b.s)[0] || kmYaDk(a.s.baslangicSaat) - kmYaDk(b.s.baslangicSaat));
}
function kmYaAyTakvimHTML(tumKisiler, gunler, isoler, bugun) {
    let sayilan = tumKisiler.filter(k => kmYaTur(k) !== 'egitmen'), slotlar = _kmYa.slotlar || [];
    let hucreler = isoler.map((iso, i) => {
        let gd = gunler[i].getDay(), dersler = slotlar.filter(s => kmYaSlotGunler(s).includes(gd)), iptal = dersler.filter(s => kmYaIptalMi(s, iso)).length;
        return { iso, d: gunler[i], ders: dersler.length - iptal, iptal, n: iso <= bugun ? sayilan.filter(k => kmYaDurum(k, iso) === 'g').length : null };
    });
    let max = Math.max(1, ...hucreler.map(h => h.n || 0)), bosluk = (gunler[0].getDay() + 6) % 7;
    let toplamGiris = hucreler.reduce((a, h) => a + (h.n || 0), 0), dersGunu = hucreler.filter(h => h.iso <= bugun && h.ders).length;
    let izgara = [1, 2, 3, 4, 5, 6, 0].map(g => `<span class="bas">${KM_YA_GUN_KISA[g]}</span>`).join('')
        + Array.from({ length: bosluk }, () => '<span class="ya-gunhucre bos"></span>').join('')
        + hucreler.map(h => `<button class="ya-gunhucre${h.iso === bugun ? ' bugun' : ''}${h.iso > bugun ? ' gelecek' : ''}${h.iptal && !h.ders ? ' iptal' : ''}" onclick="kmYaTarihAc('${h.iso}')" aria-label="${h.d.getDate()} ${KM_YA_GUN[h.d.getDay()]}: ${h.n === null ? 'henüz gelmedi' : h.n + ' kişi geldi'}, ${h.ders} ders">
            ${h.n ? `<i class="dol" style="opacity:${(0.1 + 0.4 * h.n / max).toFixed(2)}"></i>` : ''}<b>${h.d.getDate()}</b>${h.n !== null ? `<span class="kisi">${h.n ? h.n + ' kişi' : '—'}</span>` : ''}<span class="ders">${h.ders ? h.ders + ' ders' : h.iptal ? 'iptal' : ''}</span></button>`).join('');
    return `<div class="ya-kart"><div class="ya-etiket">${esc(kmYaAyAd(gunler[0]))} — güne dokun, o günün derslerini ve yoklamasını aç</div>
        <div class="ya-takvim-ay">${izgara}</div>
        <div class="ya-alt">Bu ay şimdiye kadar <b style="color:var(--text-primary)">${dersGunu}</b> ders günü · toplam <b style="color:var(--text-primary)">${toplamGiris}</b> giriş. Renk koyulaştıkça o gün gelen kişi artar.</div></div>
        ${kmYaDonemDersOzetHTML(gunler, isoler)}`;
}
function kmYaDonemDersOzetHTML(gunler, isoler) {
    let ozet = kmYaDonemDersOzet(gunler, isoler), donem = kmYaDonemYazi();
    if (!ozet.length) return `<div class="ya-kart"><div class="ya-etiket">Ders bazında</div><div class="ya-alt">Bu dönemde ders programında ders yok.</div></div>`;
    return `<div class="ya-kart"><div class="ya-etiket">Ders bazında katılım — ${donem}</div>
        ${ozet.map(o => { let yz = o.oran === null ? null : Math.round(o.oran * 100);
            return `<div class="ya-ders"><div class="saat">${o.s.baslangicSaat}<small>${kmYaSlotGunler(o.s).map(x => KM_YA_GUN_KISA[x]).join(', ')}</small></div>
            <div><b>${esc(kmYaSlotAd(o.s))}</b><div class="ya-alt">${o.yapilan} ders yapıldı${o.iptal ? ` · ${o.iptal} iptal` : ''}${o.planli ? ` · ${o.planli} ders kaldı` : ''} · ${o.kayitli} kayıtlı${o.yapilan && o.kayitli ? ` · derste ort. ${o.ort.toFixed(1).replace('.', ',')} kişi` : ''}</div>
                ${o.egitmen.length ? `<div class="ya-alt">👔 ${o.egitmen.map(e => esc(e.ad) + ' (' + e.n + ')').join(', ')}</div>` : ''}
                ${yz !== null ? `<div class="ya-bar" style="margin-top:6px"><i style="width:${yz}%; background:${yz >= 75 ? 'var(--status-success)' : yz >= 50 ? 'var(--status-warning, #d97706)' : 'var(--status-danger)'}"></i></div>` : ''}</div>
            <div class="oran">${yz !== null ? '%' + yz + '<small>katılım</small>' : '<small>—</small>'}</div></div>`; }).join('')}
        <div class="ya-alt">Katılım = yapılan derslerde, o derse kayıtlı sporcuların geldiği oran.</div></div>`;
}
function kmYaAyTrendHTML(sporcular) {
    let aylar = [];
    for (let a = _kmYa.ay - 5; a <= _kmYa.ay; a++) { let is = kmYaAyGunleri(a).map(kmYaIso); aylar.push({ a, bas: kmYaAyBasi(a), n: sporcular.filter(k => is.some(i => kmYaDurum(k, i) === 'g')).length }); }
    let max = Math.max(1, ...aylar.map(x => x.n));
    return `<div class="ya-kart"><div class="ya-etiket">Son 6 ay — ayda gelen farklı sporcu sayısı</div>
        <div class="ya-trend">${aylar.map(x => `<div><div class="sut${x.a === _kmYa.ay ? ' bu' : ''}" style="height:${Math.max(3, x.n / max * 100)}%"><em>${x.n}</em></div><small>${x.bas.toLocaleDateString('tr-TR', { month: 'short' })}</small></div>`).join('')}</div></div>`;
}

// ---------------------------------------------------------------- 📄 AYLIK PDF RAPORU (yatay A4)
function kmYaAylikPdfIndir() {
    if (typeof _yeniPdfAl !== 'function') return showToast('PDF altyapısı yüklenemedi.', 'error');
    if (_kmYa.slotlar === null) return showToast('Ders programı henüz yüklenmedi.', 'error');
    showToast('Aylık PDF hazırlanıyor...', 'warning');
    const T = s => _trTranslit(String(s == null ? '' : s));
    let gunler = kmYaAyGunleri(_kmYa.ay), isoler = gunler.map(kmYaIso), bugun = kmYaIso(new Date()), ayAdi = kmYaAyAd(gunler[0]);
    let tumKisiler = kmYaSporcular(), ogr = tumKisiler.filter(k => kmYaTur(k) === 'sporcu');
    let gunSay = isoler.map(i => ogr.filter(k => kmYaDurum(k, i) === 'g').length);
    let haftalik = tumKisiler.map(k => { let dersler = kmYaSporcuDersleri(k); return { k, dersler, gel: isoler.filter(i => kmYaDurum(k, i) === 'g').length, son: kmYaSonGelis(k), kat: kmYaAralikKatilim(k, dersler, isoler) }; });
    let ogrH = haftalik.filter(x => kmYaTur(x.k) === 'sporcu'), gelen = ogrH.filter(x => x.gel).length, toplamGiris = gunSay.reduce((a, b) => a + b, 0);
    let dersOzet = kmYaDonemDersOzet(gunler, isoler);
    let yapilanDers = dersOzet.reduce((a, o) => a + o.yapilan, 0), iptalDers = dersOzet.reduce((a, o) => a + o.iptal, 0);
    let yer = dersOzet.reduce((a, o) => a + o.yapilan * o.kayitli, 0), dolu = dersOzet.reduce((a, o) => a + o.gel, 0);
    let oncekiIso = kmYaAyGunleri(_kmYa.ay - 1).map(kmYaIso), onceki = ogr.filter(k => oncekiIso.some(i => kmYaDurum(k, i) === 'g')).length;
    let trend = []; for (let a = _kmYa.ay - 5; a <= _kmYa.ay; a++) { let is = kmYaAyGunleri(a).map(kmYaIso); trend.push({ bas: kmYaAyBasi(a), n: ogr.filter(k => is.some(i => kmYaDurum(k, i) === 'g')).length }); }
    let hicGelmeyen = ogrH.filter(x => !x.gel).sort((a, b) => String(b.son || '').localeCompare(String(a.son || '')) || a.k.ad.localeCompare(b.k.ad, 'tr'));
    let derssiz = ogrH.filter(x => !x.dersler.length);
    let egOzet = kmYaEgitmenHaftaOzet(gunler, isoler);
    // yorumlar
    let yorum = [];
    let gg = isoler.map((iso, i) => ({ iso, i, n: gunSay[i] })).filter(x => x.iso <= bugun);
    if (gg.length) { let m = gg.reduce((a, b) => b.n > a.n ? b : a); if (m.n) yorum.push(`En kalabalik gun ${gunler[m.i].getDate()} ${KM_YA_GUN[gunler[m.i].getDay()]} (${m.n} kisi).`); }
    yorum.push(gelen >= onceki ? `Bu ay ${gelen} farkli ogrenci geldi; bir onceki aya gore +${gelen - onceki}.` : `Bu ay ${gelen} farkli ogrenci geldi; bir onceki aydan ${onceki - gelen} kisi az.`);
    let oranli = dersOzet.filter(o => o.oran !== null && o.kayitli >= 2 && o.yapilan >= 2);
    if (oranli.length > 1) { let en = oranli.reduce((a, b) => b.oran > a.oran ? b : a), dus = oranli.reduce((a, b) => b.oran < a.oran ? b : a); let ad = o => `${kmYaSlotAd(o.s)} (${kmYaSlotGunler(o.s).map(x => KM_YA_GUN_KISA[x]).join('-')} ${o.s.baslangicSaat})`; yorum.push(`En yuksek katilim: ${ad(en)} %${Math.round(en.oran * 100)}. En dusuk: ${ad(dus)} %${Math.round(dus.oran * 100)}.`); }
    if (iptalDers) yorum.push(`${iptalDers} ders iptal edildi.`);
    if (hicGelmeyen.length) yorum.push(`${hicGelmeyen.length} aktif ogrenci bu ay hic gelmedi (liste son bolumde).`);
    if (_kmYa.ay === 0) yorum.push('Ay henuz bitmedi - sayilar bugune kadarki kayitlari gosterir.');

    _yeniPdfAl('landscape').then(pdf => {
        const W = 297, H = 210, M = 12, UW = W - M * 2;
        const LACI = [9, 22, 43], ALTIN = [251, 191, 36], YESIL = [22, 163, 74], KIRMIZI = [220, 38, 38], TURUNCU = [180, 83, 9], GRI = [100, 116, 139], ACIK = [241, 245, 249], YAZI = [15, 23, 42], CIZGI = [226, 232, 240];
        const dolgu = c => pdf.setFillColor(c[0], c[1], c[2]), kalem = c => pdf.setDrawColor(c[0], c[1], c[2]);
        const font = (stil, boy, c) => { pdf.setFont('helvetica', stil); pdf.setFontSize(boy); c = c || YAZI; pdf.setTextColor(c[0], c[1], c[2]); };
        const yaz = (t, x, yy, o) => pdf.text(T(t), x, yy, o || {});
        const kisalt = (t, w) => { t = T(t); if (pdf.getTextWidth(t) <= w) return t; while (t.length > 1 && pdf.getTextWidth(t + '..') > w) t = t.slice(0, -1); return t + '..'; };
        let y;
        const yeniSayfa = () => { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, W, H, 'F'); y = 12; };
        const yerAc = (h, basFn) => { if (y + h > H - 14) { yeniSayfa(); if (basFn) basFn(); } };
        const bolum = (baslik, sag) => { yerAc(24); dolgu(LACI); pdf.rect(M, y, UW, 8, 'F'); font('bold', 10, [255, 255, 255]); yaz(baslik, M + 3, y + 5.6); if (sag) { font('normal', 7.5, ALTIN); yaz(sag, M + UW - 3, y + 5.6, { align: 'right' }); } y += 11; };
        y = _kurumsalBaslikCiz(pdf, M, UW, 8, 'AYLIK YOKLAMA RAPORU', 'Karisik Sinif - ' + ayAdi);

        // 1) özet kutuları (5)
        let kutular = [
            ['Aktif ogrenci', String(ogr.length), (tumKisiler.length - ogr.length) ? 'ayrica ' + (tumKisiler.length - ogr.length) + ' egitmen/misafir' : 'kulupte aktif'],
            ['Bu ay gelen', String(gelen), (ogr.length ? '%' + Math.round(gelen / ogr.length * 100) : '') + ' - onceki ay ' + onceki],
            ['Derslere katilim', yer ? '%' + Math.round(dolu / yer * 100) : '-', yer ? dolu + ' / ' + yer + ' kayitli yer dolu' : 'yapilan ders yok'],
            ['Yapilan ders', String(yapilanDers), iptalDers ? iptalDers + ' ders iptal' : 'iptal yok'],
            ['Toplam giris', String(toplamGiris), (ogr.length - gelen) + ' ogrenci hic gelmedi']
        ];
        let kw = (UW - 12) / 5;
        kutular.forEach((kt, i) => {
            let x = M + i * (kw + 3);
            dolgu(ACIK); pdf.roundedRect(x, y, kw, 20, 2, 2, 'F'); dolgu(i === 2 ? YESIL : ALTIN); pdf.rect(x, y + 3, 1.2, 14, 'F');
            font('normal', 7, GRI); yaz(kt[0].toLocaleUpperCase('tr-TR'), x + 4, y + 5.5);
            font('bold', 16, YAZI); yaz(kt[1], x + 4, y + 13);
            font('normal', 6.5, GRI); yaz(kisalt(kt[2], kw - 6), x + 4, y + 17.5);
        });
        y += 25;
        // 2) yorumlar (sol) + 6 ay eğilimi (sağ)
        let solW = UW * 0.52, sagX = M + solW + 6, sagW = UW - solW - 6, yBas = y;
        font('bold', 9, YAZI); yaz('Bu ayin ozeti', M, y); y += 5;
        yorum.forEach(t => { font('normal', 8.3, [51, 65, 85]); let sat = pdf.splitTextToSize(T(t), solW - 5); dolgu(ALTIN); pdf.circle(M + 1.3, y - 1.1, 0.9, 'F'); pdf.text(sat, M + 4, y); y += sat.length * 4 + 0.8; });
        let gh = 44; kalem(CIZGI); pdf.setLineWidth(0.3); pdf.roundedRect(sagX, yBas - 4, sagW, gh, 2, 2, 'S');
        font('bold', 8.5, YAZI); yaz('Son 6 ay - ayda gelen farkli ogrenci', sagX + 4, yBas + 1.5);
        let tmax = Math.max(1, ...trend.map(t => t.n)), tax = sagX + 6, taw = sagW - 12, tay = yBas + gh - 10, tah = gh - 22, tbw = taw / trend.length;
        trend.forEach((t, i) => { let bx = tax + i * tbw + tbw * 0.2, w = tbw * 0.6, bh = Math.max(0.6, t.n / tmax * tah); dolgu(i === trend.length - 1 ? ALTIN : LACI); pdf.rect(bx, tay - bh, w, bh, 'F'); font('bold', 7, YAZI); yaz(String(t.n), bx + w / 2, tay - bh - 1.5, { align: 'center' }); font('normal', 6.5, GRI); yaz(t.bas.toLocaleDateString('tr-TR', { month: 'short' }), bx + w / 2, tay + 4.5, { align: 'center' }); });
        y = Math.max(y, yBas + gh - 2) + 4;
        // 3) günlük grafik (tam genişlik)
        yerAc(46);
        let dh = 42; kalem(CIZGI); pdf.roundedRect(M, y, UW, dh, 2, 2, 'S');
        font('bold', 8.5, YAZI); yaz('Gunlere gore gelen ogrenci', M + 4, y + 6);
        let dmax = Math.max(1, ...gunSay), dax = M + 5, daw = UW - 10, day = y + dh - 9, dah = dh - 20, dbw = daw / gunler.length;
        kalem(CIZGI); pdf.setLineWidth(0.2); pdf.line(dax, day, dax + daw, day);
        gunler.forEach((d, i) => {
            let iso = isoler[i], bx = dax + i * dbw + dbw * 0.15, w = dbw * 0.7, haftaSonu = d.getDay() === 0 || d.getDay() === 6;
            if (iso <= bugun && gunSay[i]) { let bh = Math.max(0.6, gunSay[i] / dmax * dah); dolgu(iso === bugun ? ALTIN : LACI); pdf.rect(bx, day - bh, w, bh, 'F'); font('bold', 6, YAZI); yaz(String(gunSay[i]), bx + w / 2, day - bh - 1.2, { align: 'center' }); }
            font(haftaSonu ? 'bold' : 'normal', 6, haftaSonu ? TURUNCU : GRI); yaz(String(d.getDate()), bx + w / 2, day + 4, { align: 'center' });
        });
        y += dh + 6;
        // 4) ders bazında aylık katılım
        bolum('Ders bazinda aylik katilim', dersOzet.length + ' ders programi');
        let DX = [0, 60, 96, 116, 132, 150, 170, 196, 214];
        const dBas = () => { dolgu(ACIK); pdf.rect(M, y, UW, 6.5, 'F'); font('bold', 6.8, GRI); ['DERS', 'GUN / SAAT', 'YAPILAN', 'IPTAL', 'KAYITLI', 'ORT. GELEN', 'ORAN', '', 'EGITMEN(LER)'].forEach((t, i) => yaz(t, M + 2 + DX[i], y + 4.5)); y += 7.5; };
        dBas();
        dersOzet.forEach((o, n) => {
            yerAc(7, dBas);
            if (n % 2) { pdf.setFillColor(250, 251, 253); pdf.rect(M, y - 1, UW, 6.5, 'F'); }
            let yy = y + 3.4, yz = o.oran === null ? null : Math.round(o.oran * 100);
            font('bold', 8, YAZI); yaz(kisalt(kmYaSlotAd(o.s), 56), M + 2, yy);
            font('normal', 7.8, YAZI); yaz(kmYaSlotGunler(o.s).map(x => KM_YA_GUN_KISA[x]).join('-') + ' ' + o.s.baslangicSaat, M + 2 + DX[1], yy);
            font('bold', 8, YAZI); yaz(String(o.yapilan) + (o.planli ? ' (+' + o.planli + ')' : ''), M + 2 + DX[2], yy);
            font('normal', 8, o.iptal ? KIRMIZI : GRI); yaz(String(o.iptal), M + 2 + DX[3], yy);
            font('normal', 8, YAZI); yaz(String(o.kayitli), M + 2 + DX[4], yy);
            yaz(o.yapilan ? o.ort.toFixed(1).replace('.', ',') : '-', M + 2 + DX[5], yy);
            if (yz !== null) { let bx = M + 2 + DX[6], bw = 22; dolgu(CIZGI); pdf.rect(bx, yy - 2.4, bw, 2.6, 'F'); dolgu(yz >= 75 ? YESIL : yz >= 50 ? ALTIN : KIRMIZI); pdf.rect(bx, yy - 2.4, Math.max(0.3, bw * yz / 100), 2.6, 'F'); font('bold', 7.5, YAZI); yaz('%' + yz, M + 2 + DX[7], yy); }
            font('normal', 7.3, GRI); yaz(kisalt(o.egitmen.length ? o.egitmen.map(e => e.ad + ' (' + e.n + ')').join(', ') : '-', UW - DX[8] - 4), M + 2 + DX[8], yy);
            y += 6.5;
        });
        font('italic', 6.8, GRI); yaz('YAPILAN (+N) = ayin kalan gunlerinde N ders daha planli. ORAN = yapilan derslerde kayitli sporcularin gelme orani.', M, y + 2.5); y += 7;
        // 5) eğitmenler
        if (egOzet.length) {
            bolum('Egitmenler', 'bu ay girdikleri dersler ve gunler');
            egOzet.forEach(o => {
                let gunSet = new Set(o.dersler.map(x => x.i)), pyGun = (typeof personelYoklamaDB !== 'undefined' ? personelYoklamaDB : []).filter(r => (r.gelenler || []).includes(o.p.id) && isoler.includes(r.tarih)).length;
                yerAc(6.5);
                font('bold', 8.5, YAZI); yaz(kisalt(o.p.ad, 60), M + 2, y + 3);
                font('bold', 8.5, o.dersler.length ? YESIL : GRI); yaz(o.dersler.length + ' ders', M + 70, y + 3);
                font('normal', 8, YAZI); yaz(gunSet.size + ' farkli gun', M + 95, y + 3);
                font('normal', 7.5, GRI); yaz('personel girisi: ' + pyGun + ' gun', M + 130, y + 3);
                y += 6;
            });
            y += 4;
        }
        // 5b) aidat & devam (yalnızca aidat verisi olan — giriş yapılmış — cihazda)
        let ad2 = kmYaAidatDevam(tumKisiler, isoler);
        if (ad2) {
            bolum('Aidat ve devam', ad2.ay + ' aidati');
            const aListe = (baslik, arr, sag) => {
                yerAc(12); font('bold', 8.8, YAZI); yaz(baslik + ' (' + arr.length + ')', M, y + 3); y += 6;
                if (!arr.length) { font('italic', 8, GRI); yaz('Yok.', M + 2, y + 2); y += 7; return; }
                let cw = UW / 3;
                for (let r2 = 0; r2 < Math.ceil(arr.length / 3); r2++) { yerAc(5.4); [0, 1, 2].forEach(c => { let x = arr[r2 * 3 + c]; if (!x) return; font('normal', 7.8, YAZI); yaz(kisalt(x.ad, cw - 36), M + 2 + c * cw, y + 3); font('normal', 6.8, GRI); yaz(sag(x), M + c * cw + cw - 4, y + 3, { align: 'right' }); }); y += 5.1; }
                y += 3;
            };
            aListe('Derse geliyor, bu ayin aidati odenmemis', ad2.odenmemis, x => x.gel + ' gun geldi');
            aListe('Aidati odenmis, 2+ haftadir gelmiyor', ad2.gelmiyor, x => x.son ? 'son: ' + kmYaTarihYazi(new Date(x.son + 'T12:00:00')) : 'hic gelmedi');
        }
        // 6) sporcu devam tablosu — her gün bir kutu
        bolum('Sporcu devam tablosu', ayAdi);
        let adW = 50, gunX = M + adW + 2, hucre = Math.min(4.6, (UW - adW - 2 - 62) / gunler.length), gunBit = gunX + hucre * gunler.length + 2;
        const sBas = () => {
            dolgu(ACIK); pdf.rect(M, y, UW, 6.5, 'F'); font('bold', 6.4, GRI); yaz('SPORCU', M + 2, y + 4.5);
            gunler.forEach((d, i) => { let hs = d.getDay() === 0 || d.getDay() === 6; font(hs ? 'bold' : 'normal', 5.6, hs ? TURUNCU : GRI); yaz(String(d.getDate()), gunX + i * hucre + hucre / 2, y + 4.5, { align: 'center' }); });
            font('bold', 6.4, GRI); yaz('GUN', gunBit, y + 4.5); yaz('DERS KATILIMI', gunBit + 13, y + 4.5); yaz('SON GELIS', M + UW - 2, y + 4.5, { align: 'right' });
            y += 7.5;
        };
        let lx = M;
        [[YESIL, true, 'geldi'], [KIRMIZI, true, 'gelmedi'], [[148, 163, 184], false, 'ders gunuydu, isaret yok']].forEach(([c, d, t]) => { if (d) { dolgu(c); pdf.roundedRect(lx, y - 2.6, 3.2, 3.2, 0.5, 0.5, 'F'); } else { kalem(c); pdf.setLineWidth(0.4); pdf.roundedRect(lx, y - 2.6, 3.2, 3.2, 0.5, 0.5, 'S'); } font('normal', 7, GRI); yaz(t, lx + 4.5, y); lx += pdf.getTextWidth(T(t)) + 11; });
        font('normal', 7, GRI); yaz('DERS KATILIMI = bu ay kayitli oldugu ders gunlerinin kacina geldi', lx + 4, y);
        y += 5;
        let gruplar = [...new Set(haftalik.map(x => kmYaGrupAnahtar(x.k)))].sort(kmYaGrupSira);
        gruplar.forEach(g => {
            let ic = haftalik.filter(x => kmYaGrupAnahtar(x.k) === g).sort((a, b) => a.k.ad.localeCompare(b.k.ad, 'tr'));
            yerAc(22); font('bold', 9.5, YAZI); yaz(g === '__egitmen' ? 'Egitmenler' : g === '__misafir' ? 'Misafirler' : (KM_YA_GRUP_AD[g] || g), M, y + 3);
            font('normal', 7.5, GRI); yaz(`${ic.length} kisi - bu ay ${ic.filter(x => x.gel).length} geldi`, M + 30, y + 3); y += 5.5;
            sBas();
            ic.forEach((x, n) => {
                yerAc(5.6, sBas);
                if (n % 2) { pdf.setFillColor(250, 251, 253); pdf.rect(M, y - 1, UW, 5.6, 'F'); }
                let yy = y + 2.9;
                font('bold', 7.6, YAZI); yaz(kisalt(x.k.ad, adW - 2), M + 2, yy);
                isoler.forEach((iso, i) => {
                    let st = kmYaDurum(x.k, iso), cx = gunX + i * hucre + (hucre - 3.4) / 2, dg = x.dersler.some(s => kmYaSlotGunler(s).includes(gunler[i].getDay()) && !kmYaIptalMi(s, iso));
                    if (st) { dolgu(st === 'g' ? YESIL : KIRMIZI); pdf.roundedRect(cx, yy - 2.6, 3.4, 3.4, 0.5, 0.5, 'F'); }
                    else if (dg && iso <= bugun) { kalem([148, 163, 184]); pdf.setLineWidth(0.35); pdf.roundedRect(cx, yy - 2.6, 3.4, 3.4, 0.5, 0.5, 'S'); }
                    else { dolgu(ACIK); pdf.roundedRect(cx, yy - 2.6, 3.4, 3.4, 0.5, 0.5, 'F'); }
                });
                font('bold', 7.6, x.gel ? YESIL : KIRMIZI); yaz(x.gel ? String(x.gel) : '0', gunBit, yy);
                if (x.kat) { let o = Math.round(x.kat.kt / x.kat.dg * 100); font('bold', 7.6, o >= 75 ? YESIL : o >= 50 ? TURUNCU : KIRMIZI); yaz('%' + o, gunBit + 13, yy); font('normal', 6.3, GRI); yaz(x.kat.kt + '/' + x.kat.dg, gunBit + 23, yy); }
                else { font('normal', 7, GRI); yaz('-', gunBit + 13, yy); }
                font('normal', 7.2, YAZI); yaz(x.son ? (x.son === bugun ? 'bugun' : kmYaTarihYazi(new Date(x.son + 'T12:00:00'))) : '-', M + UW - 2, yy, { align: 'right' });
                y += 5.6;
            });
            y += 4;
        });
        // 7) dikkat listesi
        bolum('Dikkat listesi', 'takip edilmesi gerekenler');
        const liste = (baslik, arr, fn) => {
            yerAc(14); font('bold', 8.8, YAZI); yaz(`${baslik} (${arr.length})`, M, y + 3); y += 6;
            if (!arr.length) { font('italic', 8, GRI); yaz('Yok.', M + 2, y + 2); y += 7; return; }
            let cw = UW / 3;
            for (let r = 0; r < Math.ceil(arr.length / 3); r++) {
                yerAc(5.4);
                [0, 1, 2].forEach(c => { let x = arr[r * 3 + c]; if (!x) return; let [sol, sag] = fn(x); font('normal', 7.8, YAZI); yaz(kisalt(sol, cw - 34), M + 2 + c * cw, y + 3); font('normal', 6.8, GRI); yaz(sag, M + c * cw + cw - 4, y + 3, { align: 'right' }); });
                y += 5.1;
            }
            y += 4;
        };
        liste('Bu ay hic gelmeyen ogrenciler', hicGelmeyen, x => [x.k.ad + ' - ' + (KM_YA_GRUP_AD[x.k.g] || x.k.g), x.son ? 'son: ' + kmYaTarihYazi(new Date(x.son + 'T12:00:00')) : 'kayit yok']);
        liste('Hicbir derse kayitli olmayan ogrenciler', derssiz, x => [x.k.ad + ' - ' + (KM_YA_GRUP_AD[x.k.g] || x.k.g), x.gel ? 'bu ay ' + x.gel + ' gun' : '']);

        _kurumsalAltBilgiCiz(pdf, W, H);
        pdf.save('Aylik_Yoklama_Raporu_' + isoler[0].slice(0, 7) + '.pdf');
        showToast('Aylık PDF indirildi! 📄', 'success');
    }).catch(e => { console.error(e); showToast('PDF oluşturulamadı.', 'error'); });
}

// ---------------------------------------------------------------- 💬 gelmeyenlere veli mesajı (2026-09-28)
// Seçili günün başlamış/bitmiş derslerinde kayıtlı olup "gelmedi" ya da işaretsiz kalanlar; her biri için veli
// telefonuna (sporcu kartı / aidat ekranındaki acilTelefon) hazır WhatsApp mesajı. Gönderilenler cihazda işaretlenir.
function kmYaMesajKayit() { try { return JSON.parse(localStorage.getItem('dag_ya_mesaj') || '{}'); } catch (e) { return {}; } }
function kmYaGelmeyenler(dersler, iso) {
    let bugun = kmYaIso(new Date()), dk = new Date().getHours() * 60 + new Date().getMinutes(), gordu = {}, out = [];
    dersler.forEach(s => {
        if (kmYaIptalMi(s, iso) || (iso === bugun && dk < kmYaDk(s.baslangicSaat))) return;
        kmYaSlotSporcu(s).forEach(k => {
            let st = kmYaDurum(k, iso), key = k.g + '|' + k.ad;
            if (st === 'g' || gordu[key]) return;
            // aynı gün başka dersinde geldiyse gelmemiş sayılmaz (yoklama gün bazında)
            gordu[key] = true;
            out.push(Object.assign({ s, st, sp: (turnuvaDB[k.g] || {})[k.ad] || {} }, k));
        });
    });
    return out.sort((a, b) => kmYaDk(a.s.baslangicSaat) - kmYaDk(b.s.baslangicSaat) || a.ad.localeCompare(b.ad, 'tr'));
}
function kmYaGelmeyenHTML(dersler, iso, d) {
    let liste = kmYaGelmeyenler(dersler, iso); if (!liste.length) return '';
    let kayit = kmYaMesajKayit(), gonderilen = liste.filter(x => kayit[iso + '|' + x.g + '|' + x.ad]).length;
    let bas = `<button class="ya-btn" onclick="_kmYa.mesajAcik=!_kmYa.mesajAcik; kmYaYenidenCiz()" aria-expanded="${_kmYa.mesajAcik}">💬 Gelmeyenlere veli mesajı (${liste.length})${gonderilen ? ` · ${gonderilen} gönderildi` : ''} ${_kmYa.mesajAcik ? '▴' : '▾'}</button>`;
    if (!_kmYa.mesajAcik) return `<div>${bas}</div>`;
    return `<div class="ya-kart"><div>${bas}</div>
        <div class="ya-alt">Derse kayıtlı olup ${iso === kmYaIso(new Date()) ? 'bugün' : 'o gün'} gelmeyen ya da işaretlenmeyenler. WhatsApp'a dokununca veliye hazır mesaj açılır; telefon sporcunun kartından (Aidat ekranı) gelir.</div>
        <div class="ya-kisiler">${liste.map(x => {
            let tel = x.sp.acilTelefon, gonder = kayit[iso + '|' + x.g + '|' + x.ad], kk = kmYaKey(x.g, x.ad);
            return `<div class="ya-kisi ya-yk${gonder ? ' geldi' : ''}"><span class="ya-av" style="background:${kmYaRenk(x.g)}">${esc(kmYaIlkHarf(x.ad))}</span>
                <span style="min-width:0"><b>${esc(x.ad)}</b><small>${esc(x.s.baslangicSaat + ' ' + kmYaSlotAd(x.s))} · ${x.st === 'y' ? 'gelmedi' : 'işaretsiz'}${tel ? ' · 📞 ' + esc(tel) : ' · telefon yok'}${x.sp.acilKisi ? ' (' + esc(x.sp.acilKisi) + ')' : ''}</small></span>
                <span class="ya-yk-sec"><button class="${gonder ? 'g aktif' : 'g'}" onclick="kmYaVeliMesaj('${iso}', '${kk}', ${x.s.id})">${gonder ? '✓ Gönderildi' : '💬 WhatsApp'}</button></span></div>`;
        }).join('')}</div></div>`;
}
function kmYaVeliMesaj(iso, key, slotId) {
    let k = kmYaAnahtar(key), sp = (turnuvaDB[k.g] || {})[k.ad] || {}, s = kmYaSlotBul(slotId);
    let ilk = k.ad.split(' ')[0], ilkB = ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr-TR');
    let gunYazi = iso === kmYaIso(new Date()) ? 'bugünkü' : new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }) + ' günkü';
    let veli = sp.acilKisi ? ' ' + String(sp.acilKisi).trim() : '';
    let msg = `Merhaba${veli} 🌟 DAĞ Spor Kulübü'nden yazıyoruz.\n\n${ilkB} ${gunYazi}${s ? ' ' + s.baslangicSaat : ''} okçuluk dersimize katılamadı. Her şeyin yolunda olduğunu umuyoruz 🧡\n\nBir engel ya da sorunuz varsa bize buradan yazabilirsiniz. Bir sonraki derste görüşmek dileğiyle!\nDAĞ Spor Kulübü`;
    let numara = typeof telefonWaFormat === 'function' ? telefonWaFormat(sp.acilTelefon) : '';
    window.open((numara ? `https://api.whatsapp.com/send?phone=${numara}&text=` : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(msg), '_blank');
    let kayit = kmYaMesajKayit(); kayit[iso + '|' + k.g + '|' + k.ad] = Date.now();
    // 120 günden eski işaretleri at
    let sinir = new Date(); sinir.setDate(sinir.getDate() - 120); let s120 = kmYaIso(sinir);
    Object.keys(kayit).forEach(x => { if (x.slice(0, 10) < s120) delete kayit[x]; });
    try { localStorage.setItem('dag_ya_mesaj', JSON.stringify(kayit)); } catch (e) {}
    kmYaYenidenCiz();
}

// ---------------------------------------------------------------- 💳 aidat & devam (2026-09-28)
// "Düzenli geliyor ama aidatı gecikmiş" / "aidatı ödüyor ama gelmiyor". aidatDB yalnızca giriş yapılmış cihazda
// dolu (sunucu aidat okumasını oturuma bağladı) — boşsa bölüm hiç çizilmez. Aidattan muaf olanlar hariç.
function kmYaAidatVar() { try { return typeof aidatDB !== 'undefined' && aidatDB && Object.keys(aidatDB).length > 0; } catch (e) { return false; } }
function kmYaAidatDevam(tumKisiler, isoler) {
    if (!kmYaAidatVar()) return null;
    let bugun = kmYaIso(new Date()), ay = (isoler[0] <= bugun ? isoler[0] : bugun).slice(0, 7);
    if (ay > bugun.slice(0, 7)) return null;
    let ayIso = isoler.filter(i => i.slice(0, 7) === ay && i <= bugun);
    let iki = new Date(); iki.setDate(iki.getDate() - 14); let iki14 = kmYaIso(iki);
    let ogr = tumKisiler.filter(k => kmYaTur(k) === 'sporcu' && !((turnuvaDB[k.g] || {})[k.ad] || {}).aidatMuaf);
    let odendi = k => !!(aidatDB[k.ad] && aidatDB[k.ad][ay] && aidatDB[k.ad][ay].odendi);
    let liste = ogr.map(k => Object.assign({ gel: ayIso.filter(i => kmYaDurum(k, i) === 'g').length, son: kmYaSonGelis(k), ode: odendi(k) }, k));
    return {
        ay,
        odenmemis: liste.filter(x => x.gel > 0 && !x.ode).sort((a, b) => b.gel - a.gel || a.ad.localeCompare(b.ad, 'tr')),
        gelmiyor: liste.filter(x => x.ode && (!x.son || x.son < iki14)).sort((a, b) => String(a.son || '').localeCompare(String(b.son || '')) || a.ad.localeCompare(b.ad, 'tr')),
    };
}
function kmYaAidatDevamHTML(tumKisiler, isoler) {
    let v = kmYaAidatDevam(tumKisiler, isoler); if (!v) return '';
    let ayAd = new Date(v.ay + '-15T12:00:00').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    let satir = (x, sag, btn) => `<div class="ya-kisi"><span class="ya-av" style="background:${kmYaRenk(x.g)}">${esc(kmYaIlkHarf(x.ad))}</span><span style="min-width:0"><b>${esc(x.ad)}</b><small>${kmYaGrupEtiket(x)} · ${sag}</small></span>${btn}</div>`;
    return `<div class="ya-kart"><div class="ya-etiket">💳 Aidat & devam — ${esc(ayAd)}</div>
        <div class="ya-alt"><b style="color:var(--text-primary)">Derse geliyor, bu ayın aidatı ödenmemiş (${v.odenmemis.length})</b></div>
        <div class="ya-kisiler">${v.odenmemis.map(x => satir(x, `bu ay ${x.gel} gün geldi`, `<button class="ya-btn" onclick="kmYaAidatHatirlat('${kmYaKey(x.g, x.ad)}')">💬 Hatırlat</button>`)).join('') || '<div class="ya-alt">✅ Yok.</div>'}</div>
        <div class="ya-alt" style="margin-top:6px"><b style="color:var(--text-primary)">Aidatı ödenmiş, 2+ haftadır gelmiyor (${v.gelmiyor.length})</b></div>
        <div class="ya-kisiler">${v.gelmiyor.map(x => satir(x, x.son ? 'son geliş ' + kmYaTarihYazi(new Date(x.son + 'T12:00:00')) : 'hiç gelmedi', `<button class="ya-btn" onclick="kmYaVeliDavet('${kmYaKey(x.g, x.ad)}')">💬 Veliye yaz</button>`)).join('') || '<div class="ya-alt">✅ Yok.</div>'}</div>
        <div class="ya-alt">Aidattan muaf olanlar ve eğitmen/misafirler bu listelere girmez.</div></div>`;
}
function kmYaAidatHatirlat(key) { let k = kmYaAnahtar(key); if (typeof aidatBorcWhatsApp === 'function') aidatBorcWhatsApp(k.ad, ((turnuvaDB[k.g] || {})[k.ad] || {}).acilTelefon || ''); }
function kmYaVeliDavet(key) {
    let k = kmYaAnahtar(key), sp = (turnuvaDB[k.g] || {})[k.ad] || {};
    let ilk = k.ad.split(' ')[0], ilkB = ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr-TR');
    let msg = `Merhaba${sp.acilKisi ? ' ' + String(sp.acilKisi).trim() : ''} 🌟 DAĞ Spor Kulübü'nden yazıyoruz.\n\n${ilkB}'i son antrenmanlarda göremedik ve çok özledik! 🏹 Antrenmanlarımız her zamanki programında devam ediyor — kendisini yeniden aramızda görmekten büyük mutluluk duyarız.\n\nBir engel ya da sorunuz varsa her zaman buradayız. 🧡\nDAĞ Spor Kulübü`;
    let numara = typeof telefonWaFormat === 'function' ? telefonWaFormat(sp.acilTelefon) : '';
    window.open((numara ? `https://api.whatsapp.com/send?phone=${numara}&text=` : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(msg), '_blank');
}

// ---------------------------------------------------------------- ⏳ dolu derse bekleme listesi (2026-09-28)
// meta "ders_bekleme": {"slotId|grup|ad": {slot, g, ad, t, d:1|0}} (d:0 = listeden çıktı), kayıt başına son yazan
// kazanır (kyDepoSenkron — dagsk-kisi-yonetimi.js). Sadece isim tutar (kişisel bilgi yok).
let _kmYaBekle = typeof kyDepoOku === 'function' ? kyDepoOku('ders_bekleme') : {}, _kmYaBekleCekildi = false;
function kmYaBekleyenler(slotId) {
    if (!_kmYaBekleCekildi && typeof kyDepoSenkron === 'function') { _kmYaBekleCekildi = true; kyDepoSenkron('ders_bekleme', () => _kmYaBekle).then(t => { let y = kyDepoBirlestir(t, _kmYaBekle), d = JSON.stringify(y) !== JSON.stringify(_kmYaBekle); _kmYaBekle = y; if (d && document.querySelector('#km-icerik .ya')) kmYoklamaAnalizCiz(); }).catch(() => {}); }
    return Object.values(_kmYaBekle).filter(x => x.d === 1 && x.slot === slotId && turnuvaDB[x.g] && turnuvaDB[x.g][x.ad]).sort((a, b) => (a.eklenme || a.t) - (b.eklenme || b.t));
}
function kmYaBekleYaz(slotId, g, ad, d) {
    let k = slotId + '|' + g + '|' + ad, eski = _kmYaBekle[k];
    _kmYaBekle[k] = { slot: slotId, g, ad, d, t: Date.now(), eklenme: d && eski && eski.d === 1 ? eski.eklenme : Date.now() };
    kyDepoYazYerel('ders_bekleme', _kmYaBekle);
    kyDepoSenkron('ders_bekleme', () => _kmYaBekle, true).then(t => { _kmYaBekle = kyDepoBirlestir(t, _kmYaBekle); });
}
function kmYaBekleEkle(slotId, key) {
    let k = kmYaAnahtar(key), s = kmYaSlotBul(slotId);
    kmYaBekleYaz(slotId, k.g, k.ad, 1);
    showToast(`⏳ ${k.ad} → ${s ? kmYaDersYazi(s) : 'ders'} bekleme listesine alındı (${kmYaBekleyenler(slotId).length}. sırada)`, 'success');
    kmYaYenidenCiz(true);
}
function kmYaBekleCikar(slotId, key) { let k = kmYaAnahtar(key); kmYaBekleYaz(slotId, k.g, k.ad, 0); kmYaYenidenCiz(); }
function kmYaBekleDerseAl(slotId, key) {
    let k = kmYaAnahtar(key), s = kmYaSlotBul(slotId); if (!s) return;
    let once = kmYaSlotSporcu(s).length;
    kmYaEkle(slotId, key);
    // kmYaEkle başarılı olunca kayıtlı listesine girer — o zaman bekleme listesinden düş
    let n = 0, iv = setInterval(() => { n++; if ((s.katilimcilar || []).some(x => x.grup === k.g && x.ad === k.ad)) { clearInterval(iv); kmYaBekleYaz(slotId, k.g, k.ad, 0); kmYaYenidenCiz(); } if (n > 40) clearInterval(iv); }, 300);
}
function kmYaBeklemeHTML(s) {
    let bk = kmYaBekleyenler(s.id), n = kmYaSlotSporcu(s).length;
    if (!s.kapasite && !bk.length) return '';
    return `<div class="ya-ekle" style="border-color:color-mix(in srgb, var(--status-warning, #d97706) 55%, transparent); background:color-mix(in srgb, var(--status-warning, #d97706) 7%, var(--surface-1));">
        <div class="ya-alt"><b style="color:var(--text-primary)">Doluluk: ${n}${s.kapasite ? ' / ' + s.kapasite : ''}</b>${s.kapasite ? (n >= s.kapasite ? ' — ders dolu' : ` — ${s.kapasite - n} yer boş`) : ''} · ⏳ Bekleme listesi: <b style="color:var(--text-primary)">${bk.length}</b></div>
        ${bk.length ? `<div class="ya-kisiler">${bk.map((b, i) => { let kk = kmYaKey(b.g, b.ad); return `<div class="ya-kisi"><span class="ya-av" style="background:${kmYaRenk(b.g)}">${i + 1}</span><span style="min-width:0"><b>${esc(b.ad)}</b><small>${kmYaGrupEtiket(b)} · ${new Date(b.eklenme || b.t).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}'den beri</small></span><span class="ya-yk-sec"><button class="g" onclick="kmYaBekleDerseAl(${s.id}, '${kk}')">✓ Derse al</button><button onclick="kmYaBekleCikar(${s.id}, '${kk}')">✕</button></span></div>`; }).join('')}</div>` : '<div class="ya-alt">Bekleyen yok. Ders dolunca, eklemek istediğin kişiyi aramada "⏳ Beklemeye al" ile sıraya koyabilirsin.</div>'}
    </div>`;
}

// ---------------------------------------------------------------- 📤 veliye aylık rapor linki (2026-09-28)
// Canlı İzleme ile aynı tahmin edilemez sporcu kodu (POST /api/athletes/:g/:ad/izle-kodu, giriş ister) →
// public/rapor.html?kod=…&ay=YYYY-MM. Sayfa yalnızca o sporcunun o ayki devamını/serilerini gösterir.
let _kmYaRaporLink = {};
function kmYaRaporAy() { return kmYaAyMi() ? kmYaIso(kmYaAyBasi(_kmYa.ay)).slice(0, 7) : kmYaIso(new Date()).slice(0, 7); }
function kmYaVeliRapor(key) {
    let k = kmYaAnahtar(key);
    fetch('/api/athletes/' + encodeURIComponent(k.g) + '/' + encodeURIComponent(k.ad) + '/izle-kodu', { method: 'POST' })
        .then(r => r.ok ? r.json() : Promise.reject(r.status)).then(d => {
            if (!d.kod) throw 0;
            _kmYaRaporLink[k.g + '|' + k.ad] = location.origin + '/rapor.html?kod=' + d.kod + '&ay=' + kmYaRaporAy();
            kmYoklamaAnalizCiz();
        }).catch(st => showToast(st === 401 ? 'Rapor linki için giriş yapmalısın.' : 'Link oluşturulamadı — bağlantıyı kontrol et.', 'error'));
}
function kmYaVeliRaporPanelHTML(g, ad) {
    let link = _kmYaRaporLink[g + '|' + ad]; if (!link) return '';
    let sp = (turnuvaDB[g] || {})[ad] || {}, ayAd = new Date(kmYaRaporAy() + '-15T12:00:00').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }), kk = kmYaKey(g, ad);
    return `<div class="ya-ekle"><div class="ya-alt"><b style="color:var(--text-primary)">📤 ${esc(ayAd)} raporu hazır</b> — veli bu linkten çocuğunun devam takvimini, son 6 ayını, seri ortalamalarını ve Form Lab karnesini görür. Aidat yalnız "ödendi / bekleniyor" olarak görünür; tutar, telefon, not yoktur.</div>
        <input class="ya-ara" style="max-width:none; font-size:12.5px" readonly value="${esc(link)}" onclick="this.select()">
        <div style="display:flex; gap:8px; flex-wrap:wrap"><button class="ya-btn birincil" onclick="kmYaVeliRaporGonder('${kk}')">💬 WhatsApp ile gönder${sp.acilTelefon ? '' : ' (numara seç)'}</button><button class="ya-btn" onclick="kmYaVeliRaporKopyala('${kk}')">📋 Linki kopyala</button><button class="ya-btn" onclick="kmYaVeliRaporOnizle('${kk}')">👁️ Önizle</button></div></div>`;
}
function kmYaVeliRaporGonder(key) {
    let k = kmYaAnahtar(key), sp = (turnuvaDB[k.g] || {})[k.ad] || {}, link = _kmYaRaporLink[k.g + '|' + k.ad]; if (!link) return;
    let ilk = k.ad.split(' ')[0], ilkB = ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr-TR');
    let ayAd = new Date(kmYaRaporAy() + '-15T12:00:00').toLocaleDateString('tr-TR', { month: 'long' });
    let msg = `Merhaba${sp.acilKisi ? ' ' + String(sp.acilKisi).trim() : ''} 🌟 DAĞ Spor Kulübü'nden yazıyoruz.\n\n${ilkB}'in ${ayAd} ayı okçuluk raporu hazır 🏹 Devam takvimini, ders günlerine katılımını ve seri ortalamalarını buradan görebilirsiniz:\n${link}\n\nSorularınız için her zaman buradayız 🧡\nDAĞ Spor Kulübü`;
    let numara = typeof telefonWaFormat === 'function' ? telefonWaFormat(sp.acilTelefon) : '';
    window.open((numara ? `https://api.whatsapp.com/send?phone=${numara}&text=` : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(msg), '_blank');
}
function kmYaVeliRaporOnizle(key) { let k = kmYaAnahtar(key), link = _kmYaRaporLink[k.g + '|' + k.ad]; if (link) window.open(link, '_blank'); }
function kmYaVeliRaporKopyala(key) {
    let k = kmYaAnahtar(key), link = _kmYaRaporLink[k.g + '|' + k.ad]; if (!link) return;
    (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => showToast('Link kopyalandı 📋', 'success')).catch(() => showToast('Kopyalanamadı — linki kutudan seçip kopyala.', 'warning'));
}

// ---------------------------------------------------------------- 📈 ders doluluk analizi (2026-09-29)
// Kullanıcı: "hangi ders sürekli dolu, hangisi yarı boş; hangi gün ve saatte talep fazla — yeni ders açma ya da
// birleştirme kararı". Son 8 hafta (seçili dönemden bağımsız, bugüne kadar): her ders için kayıtlı/kapasite,
// yapılan derslerde ortalama gelen, bekleme listesi; buna göre sade bir öneri. Altta gün × saat yoğunluğu.
function kmYaDoluluk() {
    let bugun = kmYaIso(new Date()), gunler = [];
    for (let i = 0; i < 56; i++) { let d = new Date(); d.setDate(d.getDate() - i); gunler.push(d); }
    return (_kmYa.slotlar || []).map(s => {
        let kayitli = kmYaSlotSporcu(s), gs = kmYaSlotGunler(s), yapilan = 0, gel = 0;
        gunler.forEach(d => { let iso = kmYaIso(d); if (!gs.includes(d.getDay()) || kmYaIptalMi(s, iso) || iso > bugun) return; yapilan++; gel += kayitli.filter(k => kmYaDurum(k, iso) === 'g').length; });
        let ort = yapilan ? gel / yapilan : 0, kap = Number(s.kapasite) || 0, bekleyen = typeof kmYaBekleyenler === 'function' ? kmYaBekleyenler(s.id).length : 0;
        let doluluk = kap ? kayitli.length / kap : null, katilim = yapilan && kayitli.length ? gel / (yapilan * kayitli.length) : null;
        let oneri, seviye;
        if (kap && kayitli.length >= kap && bekleyen) { oneri = `Dolu ve ${bekleyen} kişi bekliyor — aynı saate yeni bir ders açmayı düşün`; seviye = 'y'; }
        else if (kap && kayitli.length >= kap) { oneri = 'Kontenjan dolu'; seviye = 'y'; }
        else if (kap && kayitli.length / kap >= 0.8) { oneri = 'Dolmak üzere'; seviye = 't'; }
        else if (yapilan >= 3 && kap && ort < kap * 0.4) { oneri = 'Derse gelen az — benzer saatteki bir dersle birleştirilebilir'; seviye = 'b'; }
        else if (yapilan >= 3 && katilim !== null && katilim < 0.5) { oneri = 'Kayıtlı çok ama gelen az — devamsızlık var'; seviye = 't'; }
        else { oneri = kap ? 'Yer var' : 'Kapasite girilmemiş'; seviye = 'g'; }
        return { s, kayitli: kayitli.length, kap, doluluk, yapilan, ort, katilim, bekleyen, oneri, seviye };
    }).sort((a, b) => (b.doluluk ?? -1) - (a.doluluk ?? -1) || b.ort - a.ort);
}
function kmYaDolulukHTML() {
    let liste = kmYaDoluluk(); if (!liste.length) return '';
    let renk = { y: 'var(--status-danger)', t: 'var(--status-warning, #d97706)', b: 'var(--status-info, #0ea5e9)', g: 'var(--status-success)' };
    // gün × saat yoğunluğu: satır = ders başlangıç saati, sütun = gün, hücre = o saatteki derslerde ortalama gelen
    let saatler = [...new Set(liste.map(o => o.s.baslangicSaat))].sort((a, b) => kmYaDk(a) - kmYaDk(b)), gunSira = [1, 2, 3, 4, 5, 6, 0];
    let hucre = {}; liste.forEach(o => kmYaSlotGunler(o.s).forEach(g => { let k = o.s.baslangicSaat + '|' + g; (hucre[k] = hucre[k] || { ort: 0, kayitli: 0, n: 0 }); hucre[k].ort += o.ort; hucre[k].kayitli += o.kayitli; hucre[k].n++; }));
    let hmax = Math.max(1, ...Object.values(hucre).map(h => h.ort));
    let isi = `<div style="overflow-x:auto"><table class="ya-isi"><thead><tr><th></th>${gunSira.map(g => `<th>${KM_YA_GUN_KISA[g]}</th>`).join('')}</tr></thead><tbody>${saatler.map(sa => `<tr><th>${sa}</th>${gunSira.map(g => { let h = hucre[sa + '|' + g]; return h ? `<td style="background:color-mix(in srgb, var(--accent) ${Math.round(12 + 70 * h.ort / hmax)}%, var(--surface-2))" title="${h.n} ders · ${h.kayitli} kayıtlı · derste ort. ${h.ort.toFixed(1)} kişi"><b>${h.ort.toFixed(1).replace('.', ',')}</b><small>${h.kayitli} kayıtlı</small></td>` : '<td class="bos"></td>'; }).join('')}</tr>`).join('')}</tbody></table></div>`;
    return `<div class="ya-kart"><div class="ya-etiket">📈 Ders doluluğu — son 8 hafta</div>
        ${(() => { let satir = o => { let dz = o.doluluk === null ? null : Math.round(o.doluluk * 100);
            return `<div class="ya-ders"><div class="saat">${o.s.baslangicSaat}<small>${kmYaSlotGunler(o.s).map(x => KM_YA_GUN_KISA[x]).join(', ')}</small></div>
            <div><b>${esc(kmYaSlotAd(o.s))}</b><div class="ya-alt">${o.kayitli} kayıtlı${o.kap ? ' / ' + o.kap + ' kapasite' : ''}${o.yapilan ? ` · derste ort. ${o.ort.toFixed(1).replace('.', ',')} kişi` : ' · son 8 haftada ders yapılmadı'}${o.bekleyen ? ` · ⏳ ${o.bekleyen} bekliyor` : ''}</div>
                ${dz !== null ? `<div class="ya-bar" style="margin-top:6px"><i style="width:${Math.min(100, dz)}%; background:${renk[o.seviye]}"></i></div>` : ''}
                <div class="ya-alt" style="margin-top:4px; color:${renk[o.seviye]}; font-weight:800">${esc(o.oneri)}</div></div>
            <div class="oran">${dz !== null ? '%' + dz + '<small>dolu</small>' : '<small>—</small>'}</div></div>`; };
            return liste.slice(0, 6).map(satir).join('') + (liste.length > 6 ? `<details class="ya-alt"><summary style="cursor:pointer; font-weight:800; padding:6px 0">Tüm dersler (${liste.length - 6} tane daha)</summary><div style="display:flex; flex-direction:column; gap:8px; margin-top:6px">${liste.slice(6).map(satir).join('')}</div></details>` : ''); })()}
        <div class="ya-etiket" style="margin-top:6px">Gün × saat — derste ortalama gelen kişi</div>${isi}
        <div class="ya-alt">Doluluk = kayıtlı / kapasite. Renk yoğunlaştıkça o saat daha kalabalık; yeni ders açacaksan önce oralara bak. Kapasiteyi Ders Programı'ndan girebilirsin.</div></div>`;
}

(function () {
    let st = document.createElement('style'); st.id = 'ya-ks-css';
    st.textContent = '.ya-ks-liste{display:flex;flex-direction:column;gap:8px}'
        + '.ya-ks{display:flex;flex-direction:column;gap:7px;padding:10px;border-radius:12px;border:1px solid var(--border-color);background:var(--bg-main)}'
        + '.ya-ks .ya-kisi-ad{display:flex;align-items:center;gap:10px;background:none;border:0;padding:0;color:inherit;font:inherit;text-align:left;cursor:pointer}.ya-ks .ya-kisi-ad>span:last-child{display:flex;flex-direction:column;min-width:0}.ya-ks .ya-kisi-ad small{color:var(--text-muted);font-size:11.5px}'
        + '.ya-ks-ust{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.ya-ks-ust .ya-kisi-ad{flex:1;min-width:180px}'
        + '.ya-ks-tur{display:flex;flex-wrap:wrap;gap:6px}.ya-ks-tur button{min-height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;font-size:12px;font-weight:800;cursor:pointer}'
        + '.ya-ks-tur button.aktif.sporcu{border-color:var(--status-success,#16a34a);background:color-mix(in srgb,var(--status-success,#16a34a) 14%,transparent)}'
        + '.ya-ks-tur button.aktif.misafir{border-color:#f472b6;background:color-mix(in srgb,#f472b6 16%,transparent)}'
        + '.ya-ks-tur button.aktif.egitmen{border-color:#38bdf8;background:color-mix(in srgb,#38bdf8 16%,transparent)}'
        + '.ya-ks-ders{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.ya-ks-sec{min-height:34px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);font:inherit;font-size:12px;padding:0 8px;max-width:100%}';
    document.head.appendChild(st);
})();
