/* ================================================================================================
   🎬 ÇOK AÇILI KAYIT + ANALİZ STÜDYOSU (2026-11-18, v426). Kullanıcı: "4'lü kamera sisteminin amacı yok, kaydet düğmesi yok;
   onları kaydedip tek bir ekranda ya da 4'lüye bölünmüş ekranda analiz etmek, yan yana koymak istiyorum. Bir sporcunun tam
   analizini yapacağız." Çok Açılı Kamera (dagsk-coklu-kamera.js) kaydı buraya verir: caKlipKaydet(meta, veriler).
   KAYIT: her açı kendi videosu (MediaRecorder, tam kalite) ya da "son 12 sn" kareleri (JPEG dizisi). Bu cihazda IndexedDB
     'dagsk-cokaci' (klip = bilgi, veri = açı başına video/kare). Sunucuya video GİTMEZ; analiz (karne + kareler) gider.
   STÜDYO: 4'lü / tek / yan yana düzen; tüm açılar tek zaman çizgisinde (açı başına ofset, "Hizala" ile kare kare kaydırma);
     1× ½× ¼× ⅛×, kare kare, döngü; ANLAR (Duruş, Çekiş, Çapa, Bırakış, Takip) → çekiş ve nişan süresi; çizim (çizgi, açı°,
     daire, dikey kılavuz, serbest), yakınlaştır, ayna; 📸 kare (PNG), 🎞️ video olarak indir (düzen + çizimler + ad, istenen hızda);
     ⚖️ karşılaştır (iki kayıt yan yana, bırakış anına göre hizalı); 📋 TAM ANALİZ: Teknik Analiz'in 8 fazı (KM_TA_FAZLAR) — puan,
     madde madde doğru/hatalı, not, fazın karesi — kaydedince sporcunun saha karnesine (/api/teknik-analiz) yazılır, her cihazdan görünür;
     🔬 tek açıyı Form Lab'a ver; 📁 telefondan çekilmiş videolardan yeni kayıt (açı başına dosya).
   v427 (2026-11-18, kullanıcı tarayıcı taslağından 2, 4, 5, 6, 7, 10'u seçti):
     📱 ÇEK (10): telefonun kendi kamerasıyla tek açı; durunca puan çipleri (X…M) — dokunmak = kaydet, kamera sonraki atışa hazır.
     PUAN (2): her kaydın puanı (çek, ✏️, Çok Açılı Kamera'da kaydederken); kütüphanede ⚖️ En iyi ↔ en kötü (seçili sporcu).
     💥 BIRAKIŞ SESTEN: kayıtta ses varsa ipin sesi (en sert ani yükselme) bırakış anı olur — karşılaştırma ve seri hizası bununla.
     🦴 İSKELET (4): MediaPipe PoseLandmarker (Form Lab'ın modeli, 10 kare/sn) açı başına bir kez çıkarılır, kayda yazılır;
       ekranda kemikler + çekiş dirseği / yay kolu açısı / omuz eğimi; alt satırda şimdi + bırakıştan hemen önce + nişanda oynama.
     👥 SERİ ÜST ÜSTE (6): 2–6 kayıt bırakışa göre hizalı, her atış kendi renginde iskelet; 📏 tablo: ortanca, sapan atış kırmızı.
     ⭐ ÖRNEK ATIŞ (7): kayıt "örnek" yapılır; her kayıtta ⭐ Örnekle kıyasla (üst üste, iskeletli). 📺 TV ayna (5) Çok Açılı Kamera'da.
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tost = (m, t) => { try { showToast(m, t || 'info'); } catch (e) { } };
    const ACILAR = { on: 'Önden', yan: 'Yandan', arka: 'Arkadan', hedef: 'Hedef', v1: 'Video 1', v2: 'Video 2', v3: 'Video 3', v4: 'Video 4' };
    const ACI_RENK = { on: '#38bdf8', yan: '#a78bfa', arka: '#4ade80', hedef: '#facc15', v1: '#38bdf8', v2: '#a78bfa', v3: '#4ade80', v4: '#facc15' };
    const ANLAR = [['durus', 'Duruş', '🧍'], ['cekis', 'Çekiş', '🏹'], ['capa', 'Çapa', '⚓'], ['birakis', 'Bırakış', '💥'], ['takip', 'Takip', '👁️']];
    const HIZLAR = [[1, '1×'], [0.5, '½×'], [0.25, '¼×'], [0.125, '⅛×']];
    const KARE = 1000 / 30;
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toLocaleDateString('sv-SE'));
    const sn = (ms) => (Math.max(0, ms) / 1000).toFixed(2).replace('.', ',');
    const sn1 = (ms) => (Math.max(0, ms) / 1000).toFixed(1).replace('.', ',');
    const ilkAd = (ad) => String(ad || '').split(' ')[0];
    const sureYaz = (ms) => { const t = Math.floor(Math.max(0, ms) / 1000); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
    const yeni = () => { try { return typeof yeniRozet === 'function' ? yeniRozet() : ''; } catch (e) { return ''; } };
    // v427 puan (hedef renkleri)
    const PUANLAR = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
    const puanSayi = (p) => (p == null || p === '' ? null : p === 'X' ? 10.5 : p === 'M' ? 0 : +p);
    function puanRenk(p) { const n = puanSayi(p); return n == null ? '#475569' : n >= 9 ? '#facc15' : n >= 7 ? '#ef4444' : n >= 5 ? '#38bdf8' : n >= 3 ? '#111827' : n >= 1 ? '#f1f5f9' : '#475569'; }
    function puanYazi(p) { const n = puanSayi(p); return n != null && n >= 9 ? '#1a1200' : n != null && n >= 1 && n < 3 ? '#0f172a' : '#fff'; }
    const puanRozet = (p) => (p ? '<b class="ca-puan" style="background:' + puanRenk(p) + ';color:' + puanYazi(p) + '">' + esc(p) + '</b>' : '');
    const SERI_RENK = ['#4ade80', '#38bdf8', '#facc15', '#f472b6', '#fb923c', '#a78bfa'];
    const KAR_RENK = ['#4ade80', '#f472b6'];

    /* ------------------------------------------------------------ depolama (IndexedDB, bu cihaz) */
    let _idbP = null;
    function idb() {
        return _idbP || (_idbP = new Promise((ok, no) => {
            const r = indexedDB.open('dagsk-cokaci', 1);
            r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('klip')) d.createObjectStore('klip', { keyPath: 'id' }); if (!d.objectStoreNames.contains('veri')) d.createObjectStore('veri'); };
            r.onsuccess = () => { const d = r.result; d.onversionchange = () => { try { d.close(); } catch (e) { } _idbP = null; }; ok(d); }; r.onerror = () => { _idbP = null; no(r.error); };
        }));
    }
    function istek(depo, mod, fn) { return idb().then((d) => new Promise((ok, no) => { const tx = d.transaction(depo, mod), r = fn(tx.objectStore(depo)); tx.oncomplete = () => ok(r && r.result); tx.onerror = () => no(tx.error); tx.onabort = () => no(tx.error); })); }
    const klipListe = () => istek('klip', 'readonly', (s) => s.getAll()).then((l) => (l || []).sort((a, b) => b.t - a.t));
    const klipOku = (id) => istek('klip', 'readonly', (s) => s.get(id));
    const klipYaz = (k) => istek('klip', 'readwrite', (s) => s.put(k));
    const veriOku = (id, aci) => istek('veri', 'readonly', (s) => s.get(id + '|' + aci));
    async function klipSil(id) { const k = await klipOku(id); await istek('veri', 'readwrite', (s) => { (k && k.acilar || []).forEach((a) => s.delete(id + '|' + a.id)); }); await istek('klip', 'readwrite', (s) => s.delete(id)); }
    function yeniId() { return 'k' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
    // veriler: { aci: { tip:'video', blob, mime } | { tip:'kare', kareler:[{t, b}] } }
    window.caKlipKaydet = async function (meta, veriler) {
        const id = meta.id || yeniId();
        const k = Object.assign({ id, t: Date.now(), tarih: bugun(), ad: '', sporcu: null, sure: 0, acilar: [], anlar: {}, cizim: {}, ayna: {}, analiz: null }, meta, { id });
        await istek('veri', 'readwrite', (s) => { Object.keys(veriler).forEach((a) => s.put(veriler[a], id + '|' + a)); });
        await klipYaz(k);
        try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
        return id;
    };
    window.caKlipSayisi = () => klipListe().then((l) => l.length).catch(() => 0);

    /* ------------------------------------------------------------ kaynaklar (video ya da kare dizisi) */
    function bir(el, olaylar, ms) { return new Promise((ok) => { let bitti = false; const f = () => { if (bitti) return; bitti = true; olaylar.forEach((o) => el.removeEventListener(o, f)); ok(); }; olaylar.forEach((o) => el.addEventListener(o, f)); setTimeout(f, ms); }); }
    async function videoKaynak(blob) {
        const v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto'; v.setAttribute('playsinline', ''); v.className = 'ca-medya';
        const url = URL.createObjectURL(blob); v.src = url;
        await bir(v, ['loadedmetadata', 'error'], 8000);
        if (!isFinite(v.duration) || !v.duration) { // MediaRecorder webm: süre yok → sona sar, süre gelsin
            try { v.currentTime = 1e7; } catch (e) { }
            await bir(v, ['durationchange', 'timeupdate'], 4000);
            try { v.currentTime = 0; } catch (e) { } await bir(v, ['seeked'], 2000);
        }
        if (v.readyState < 2) await bir(v, ['loadeddata', 'canplay'], 4000);
        return { tip: 'video', el: v, url, sure: isFinite(v.duration) ? v.duration * 1000 : 0, vw: v.videoWidth || 1280, vh: v.videoHeight || 720 };
    }
    async function kareKaynak(kareler) {
        const c = document.createElement('canvas'); c.className = 'ca-medya';
        const l = (kareler || []).slice().sort((a, b) => a.t - b.t), t0 = l.length ? l[0].t : 0;
        const fr = l.map((k) => ({ t: k.t - t0, b: k.b }));
        let vw = 640, vh = 360; try { const bm = await createImageBitmap(fr[0].b); vw = bm.width; vh = bm.height; c.width = vw; c.height = vh; c.getContext('2d').drawImage(bm, 0, 0); bm.close && bm.close(); } catch (e) { }
        const s = { tip: 'kare', el: c, fr, sure: fr.length ? fr[fr.length - 1].t : 0, vw, vh, son: null, cozuyor: false };
        s.ciz = (yerel) => {
            if (!fr.length) return; let lo = 0, hi = fr.length - 1, i = 0; const t = Math.max(0, Math.min(s.sure, yerel));
            while (lo <= hi) { const m = (lo + hi) >> 1; if (fr[m].t <= t) { i = m; lo = m + 1; } else hi = m - 1; }
            const k = fr[i]; if (k === s.son || s.cozuyor) return; s.cozuyor = true; s.son = k;
            createImageBitmap(k.b).then((bm) => { s.cozuyor = false; if (c.width !== bm.width) { c.width = bm.width; c.height = bm.height; } c.getContext('2d').drawImage(bm, 0, 0); bm.close && bm.close(); }).catch(() => { s.cozuyor = false; });
        };
        return s;
    }
    async function kaynakAc(klip, aci) {
        const v = await veriOku(klip.id, aci.id); if (!v) return null;
        if (v.tip === 'kare') return kareKaynak(v.kareler);
        return videoKaynak(v.blob || v);
    }
    function kaynakKapat(s) { if (!s) return; try { if (s.tip === 'video') { s.el.pause(); s.el.removeAttribute('src'); s.el.load(); URL.revokeObjectURL(s.url); } } catch (e) { } }

    /* ------------------------------------------------------------ durum */
    let _ca = null; // { klipler, klip, karsi, kareler:[{klip, aci, src, kaydirma}], T, bas, son, oynuyor, hiz, duzen, secili, arac, hizala, panel, dongu }
    function css() {
        if ($('ca-stil')) return;
        const st = document.createElement('style'); st.id = 'ca-stil';
        st.textContent = [
            '.ca{position:fixed;inset:0;z-index:99650;background:#06080b;color:#eef2f7;display:grid;grid-template-rows:auto minmax(0,1fr) auto;font-family:inherit;--tur:#ff7a2e}',
            '.ca [hidden]{display:none!important}.ca button{font:inherit}',
            '.ca-ust{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:max(8px,env(safe-area-inset-top,0px)) max(12px,env(safe-area-inset-right,0px)) 8px max(12px,env(safe-area-inset-left,0px));border-bottom:1px solid #161d27}',
            '.ca-ust h1{margin:0 auto 0 0;font-size:17px;font-weight:900;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ca-ust h1 small{color:#8b98aa;font-weight:600;font-size:13px;margin-left:6px}',
            '.ca-b{min-height:40px;padding:6px 13px;border-radius:999px;border:1px solid #263142;background:#10161e;color:inherit;font-weight:800;font-size:13.5px;cursor:pointer;white-space:nowrap}',
            '.ca-b.on{background:var(--tur);border-color:var(--tur);color:#fff}.ca-b.ana{background:var(--tur);border-color:var(--tur);color:#fff}.ca-b:disabled{opacity:.4;cursor:default}.ca-b.kirmizi{border-color:#7f1d1d;color:#fecaca}',
            '.ca-gr{display:inline-flex;gap:2px;background:#10161e;border:1px solid #263142;border-radius:999px;padding:2px}.ca-gr .ca-b{border:0;background:transparent;min-height:34px;padding:4px 11px}.ca-gr .ca-b.on{background:var(--tur)}',
            '.ca-orta{display:grid;grid-template-columns:minmax(0,1fr) auto;min-height:0}',
            '.ca-izgara{display:grid;gap:5px;padding:5px;min-height:0;min-width:0}',
            '.ca-kare{position:relative;background:#000;border-radius:10px;overflow:hidden;min-height:0;min-width:0;touch-action:none}',
            '.ca-ic{position:absolute;inset:0;transform-origin:50% 50%;transition:transform .2s}',
            '.ca-medya{position:absolute;display:block;background:#000}.ca-cizim{position:absolute;z-index:2}.ca-kare.arac .ca-cizim{cursor:crosshair}',
            '.ca-et{position:absolute;left:8px;top:8px;z-index:3;background:rgba(0,0,0,.62);border-radius:999px;padding:3px 11px;font-weight:900;font-size:13px;border-left:4px solid var(--r);pointer-events:none}',
            '.ca-ka{position:absolute;right:6px;top:6px;z-index:3;display:flex;gap:4px}.ca-ka button{width:34px;height:34px;border-radius:50%;border:0;background:rgba(0,0,0,.6);color:#fff;font-size:15px;cursor:pointer}',
            '.ca-hz{position:absolute;left:50%;bottom:8px;transform:translateX(-50%);z-index:3;display:flex;gap:4px;align-items:center;background:rgba(0,0,0,.75);border-radius:999px;padding:4px 8px;font-size:12px;font-weight:800;white-space:nowrap}.ca-hz button{min-height:32px;padding:2px 9px;border-radius:999px;border:1px solid #334155;background:#111827;color:#fff;font-weight:800;cursor:pointer}',
            '.ca-yok{position:absolute;inset:0;display:grid;place-items:center;color:#64748b;font-weight:700;font-size:13px}',
            '.ca-alt{padding:8px max(12px,env(safe-area-inset-right,0px)) max(8px,env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));border-top:1px solid #161d27;display:grid;gap:8px}',
            '.ca-sat{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
            '.ca-cubuk{position:relative;flex:1 1 260px;min-width:200px;height:46px}.ca-cubuk input{position:absolute;left:0;right:0;top:24px;width:100%;margin:0;accent-color:var(--tur)}',
            '.ca-im{position:absolute;top:0;transform:translateX(-50%);font-size:10.5px;font-weight:900;padding:1px 5px;border-radius:6px;background:#1f2937;color:#fde68a;white-space:nowrap;cursor:pointer;border:0;line-height:1.3;z-index:1}.ca-im:after{content:"";position:absolute;left:50%;top:100%;width:2px;height:8px;background:#fde68a;transform:translateX(-50%)}',
            '.ca-zaman{font-variant-numeric:tabular-nums;font-weight:900;min-width:92px;text-align:right;font-size:15px}',
            '.ca-anlar{display:flex;gap:4px;flex-wrap:wrap}.ca-anlar .ca-b{min-height:36px;padding:4px 10px}.ca-anlar .ca-b.var{border-color:#fde68a;color:#fde68a}',
            '.ca-ist{display:flex;gap:6px;flex-wrap:wrap;font-size:12.5px;font-weight:800}.ca-ist span{background:#10161e;border:1px solid #263142;border-radius:999px;padding:4px 10px}.ca-ist b{color:#fde68a;font-variant-numeric:tabular-nums}',
            '.ca-araclar{display:flex;gap:4px;flex-wrap:wrap;margin-left:auto}.ca-araclar .ca-b{min-height:36px;padding:4px 10px}',
            // kütüphane
            '.ca-liste{overflow:auto;padding:14px max(14px,env(safe-area-inset-right,0px)) 30px max(14px,env(safe-area-inset-left,0px))}',
            '.ca-l-bas{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px}.ca-l-bas input,.ca-l-bas select{min-height:40px;border-radius:12px;border:1px solid #263142;background:#10161e;color:inherit;padding:0 12px;font:inherit}',
            '.ca-kartlar{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}',
            '.ca-kart{background:#0d1219;border:1px solid #1c2633;border-radius:16px;overflow:hidden;display:flex;flex-direction:column}.ca-kart.sec{border-color:var(--tur);box-shadow:0 0 0 2px var(--tur)}',
            '.ca-kart-resim{aspect-ratio:16/9;background:#000 center/cover no-repeat;position:relative;cursor:pointer;border:0;padding:0;display:block;width:100%}.ca-kart-resim span{position:absolute;right:6px;bottom:6px;background:rgba(0,0,0,.7);border-radius:8px;padding:2px 8px;font-weight:900;font-size:12px}',
            '.ca-kart-ic{padding:10px 12px;display:grid;gap:6px}.ca-kart-ic b{font-size:15px}.ca-kart-ic small{color:#8b98aa;font-size:12.5px}.ca-kart-alt{display:flex;gap:4px;flex-wrap:wrap}.ca-kart-alt .ca-b{min-height:34px;padding:3px 10px;font-size:12.5px}',
            '.ca-bos{color:#94a3b8;text-align:center;padding:50px 16px;font-size:15px;line-height:1.6;max-width:60ch;margin:0 auto}',
            '.ca-dolu{font-size:12.5px;color:#8b98aa}',
            // tam analiz paneli
            '.ca-panel{width:min(420px,46vw);border-left:1px solid #161d27;background:#0a0e14;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px}',
            '.ca-panel select{min-height:38px;border-radius:10px;border:1px solid #263142;background:#06080b;color:inherit;padding:0 10px;font:inherit;max-width:100%}.ca-panel .ca-sat label{display:flex;align-items:center;gap:6px}',
            '.ca-panel h2{margin:0;font-size:18px;font-weight:900}.ca-panel p{margin:0;color:#94a3b8;font-size:13px;line-height:1.45}',
            '.ca-faz{border:1px solid #1c2633;border-radius:14px;background:#0d1219}.ca-faz>button{width:100%;display:flex;align-items:center;gap:8px;padding:10px 12px;background:transparent;border:0;color:inherit;cursor:pointer;text-align:left}',
            '.ca-faz>button b{flex:1;font-size:14.5px}.ca-faz>button i{font-style:normal;font-size:12px;color:#fde68a;font-weight:900}.ca-faz.acik>button{border-bottom:1px solid #1c2633}',
            '.ca-faz-ic{padding:10px 12px;display:grid;gap:8px}.ca-yildiz{display:flex;gap:4px}.ca-yildiz button{width:36px;height:36px;border-radius:10px;border:1px solid #263142;background:#10161e;color:#94a3b8;font-weight:900;cursor:pointer}.ca-yildiz button.on{background:#ca8a04;border-color:#ca8a04;color:#fff}',
            '.ca-madde{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:center;font-size:13px}.ca-madde span:first-child{line-height:1.35}.ca-dh{display:flex;gap:3px}.ca-dh button{min-width:38px;height:32px;border-radius:9px;border:1px solid #263142;background:#10161e;color:#cbd5e1;font-weight:900;cursor:pointer}.ca-dh button.d{background:#166534;border-color:#16a34a;color:#fff}.ca-dh button.h{background:#7f1d1d;border-color:#dc2626;color:#fff}',
            '.ca-faz-ic textarea{width:100%;box-sizing:border-box;min-height:54px;border-radius:10px;border:1px solid #263142;background:#06080b;color:inherit;padding:8px;font:inherit;font-size:13px}',
            '.ca-foto{width:100%;border-radius:10px;display:block}.ca-faz-alt{display:flex;gap:6px;flex-wrap:wrap}.ca-faz-alt .ca-b{min-height:34px;padding:3px 10px;font-size:12.5px}',
            '.ca-kaydet{position:sticky;bottom:0;background:#0a0e14;padding-top:6px}.ca-kaydet .ca-b{width:100%;min-height:48px;font-size:15px}',
            // modal + ilerleme
            '.ca-modal{position:absolute;inset:0;z-index:20;background:rgba(3,5,8,.78);display:grid;place-items:center;padding:16px}.ca-modal>div{width:min(520px,100%);max-height:100%;overflow:auto;background:#0d1219;border:1px solid #263142;border-radius:18px;padding:16px;display:grid;gap:10px}',
            '.ca-modal h3{margin:0;font-size:18px;font-weight:900}.ca-modal label{display:grid;gap:4px;font-size:13px;font-weight:800;color:#cbd5e1}.ca-modal input,.ca-modal select{min-height:42px;border-radius:12px;border:1px solid #263142;background:#06080b;color:inherit;padding:0 12px;font:inherit}',
            '.ca-modal .ca-sat .ca-b{flex:1}.ca-ilerle{height:10px;border-radius:99px;background:#1f2937;overflow:hidden}.ca-ilerle i{display:block;height:100%;background:var(--tur);width:0}',
            // v427: puan, örnek, seri seçimi, iskelet, ölçüm, telefon kamerası
            '.ca-puan{display:inline-grid;place-items:center;min-width:26px;height:26px;padding:0 6px;border-radius:999px;font-weight:900;font-size:13px;border:2px solid rgba(255,255,255,.3);box-sizing:border-box;line-height:1}',
            '.ca-kart-resim .ca-puan{position:absolute;left:6px;top:6px;min-width:36px;height:36px;font-size:16px}',
            '.ca-kart-resim .ca-yildizi{position:absolute;right:6px;top:6px;background:rgba(0,0,0,.72);border-radius:999px;padding:3px 9px;font-size:12.5px;font-weight:900;color:#facc15;font-style:normal}',
            '.ca-kart-resim .ca-sec{position:absolute;left:6px;bottom:6px;width:32px;height:32px;border-radius:50%;background:rgba(0,0,0,.65);border:2px solid #fff;display:grid;place-items:center;font-weight:900;font-style:normal;color:#fff}.ca-kart.sec .ca-sec{background:var(--tur);border-color:var(--tur)}',
            '.ca-bolum{font-size:12.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#8b98aa;margin:16px 0 8px}',
            '.ca-b.cek{background:#dc2626;border-color:#dc2626;color:#fff}',
            '.ca-isk{position:absolute;z-index:1;pointer-events:none}',
            '.ca-olc{display:flex;gap:6px;flex-wrap:wrap;font-size:12.5px;font-weight:800;align-items:center}.ca-olc span{background:#0d1a12;border:1px solid #1f5135;border-radius:999px;padding:4px 10px}.ca-olc b{color:#4ade80;font-variant-numeric:tabular-nums}.ca-olc i{font-style:normal;color:#8b98aa;font-weight:900;padding:0 2px}',
            '.ca-lej{display:flex;gap:6px;flex-wrap:wrap;font-size:12.5px;font-weight:800;align-items:center}.ca-lej span{display:inline-flex;align-items:center;gap:6px;background:#10161e;border:1px solid #263142;border-radius:999px;padding:3px 10px 3px 4px}.ca-lej i{width:16px;height:16px;border-radius:50%;background:var(--r)}',
            '.ca-tablo{width:100%;border-collapse:collapse;font-size:13px;font-variant-numeric:tabular-nums}.ca-tablo th,.ca-tablo td{padding:7px 5px;border-bottom:1px solid #1c2633;text-align:right;white-space:nowrap}.ca-tablo th:first-child,.ca-tablo td:first-child{text-align:left}.ca-tablo th{color:#8b98aa;font-size:11.5px;font-weight:800;white-space:normal}.ca-tablo td.kac{color:#fca5a5;font-weight:900}.ca-tablo tr.med td{color:#8b98aa}.ca-tablo td i{display:inline-block;width:11px;height:11px;border-radius:50%;background:var(--r);margin-right:6px;vertical-align:-1px}',
            '.ca-ozet{background:#0d1219;border:1px solid #263142;border-radius:12px;padding:10px 12px;font-size:14.5px;line-height:1.5}.ca-ozet b{color:#fde68a}.ca-ozet .kac{color:#fca5a5}.ca-ozet .iyi{color:#86efac}',
            '.ca-cek{grid-row:1/-1;position:relative;background:#000;overflow:hidden;min-height:0}',
            '.ca-cek video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}',
            '.ca-cek-ust{position:absolute;left:0;right:0;top:0;z-index:2;display:flex;gap:6px;flex-wrap:wrap;align-items:center;padding:max(10px,env(safe-area-inset-top,0px)) max(10px,env(safe-area-inset-right,0px)) 14px max(10px,env(safe-area-inset-left,0px));background:linear-gradient(rgba(0,0,0,.75),transparent)}',
            '.ca-cek-ust select{min-height:40px;border-radius:999px;border:1px solid #334155;background:rgba(0,0,0,.6);color:#fff;padding:0 12px;font:inherit;font-weight:800;max-width:44vw}',
            '.ca-cek-alt{position:absolute;left:0;right:0;bottom:0;z-index:2;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;padding:16px max(16px,env(safe-area-inset-right,0px)) max(20px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));background:linear-gradient(transparent,rgba(0,0,0,.8))}',
            '.ca-cek-dug{width:80px;height:80px;border-radius:50%;border:5px solid #fff;background:transparent;display:grid;place-items:center;cursor:pointer;padding:0}.ca-cek-dug i{width:60px;height:60px;border-radius:50%;background:#dc2626;transition:all .2s}.ca-cek-dug.surer i{width:30px;height:30px;border-radius:8px}',
            '.ca-cek-sure{font-variant-numeric:tabular-nums;font-weight:900;font-size:19px;justify-self:start}.ca-cek-sure.surer{color:#fca5a5}',
            '.ca-cek-son{justify-self:end;font-size:13px;font-weight:800;color:#e2e8f0;text-align:right;line-height:1.5}.ca-cek-son small{color:#94a3b8}',
            '.ca-cek-puan{position:absolute;left:0;right:0;bottom:0;z-index:3;background:#0d1219;border-top:1px solid #263142;border-radius:20px 20px 0 0;padding:16px max(16px,env(safe-area-inset-right,0px)) max(18px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));display:grid;gap:12px;max-width:640px;margin:0 auto}',
            '.ca-cek-puan h3{margin:0;font-size:19px;font-weight:900}.ca-cek-puan p{margin:0;color:#94a3b8;font-size:13px}.ca-cek-puan .ca-sat .ca-b{flex:1}',
            '.ca-puanlar{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}.ca-puanlar button{min-height:54px;border-radius:14px;border:2px solid rgba(255,255,255,.18);font-weight:900;font-size:20px;cursor:pointer;font-family:inherit}',
            '.ca-modal .ca-puanlar button{min-height:44px;font-size:16px}.ca-modal .ca-puanlar button.on{outline:3px solid #fff;outline-offset:1px}',
            '@media (max-width:600px){.ca-araclar .ca-b .ca-y,.ca-ka button[aria-label="Form Lab"]{display:none}.ca-alt{gap:5px;padding-top:6px}.ca-alt .ca-b{min-height:34px;padding:3px 9px;font-size:12.5px}.ca-ist{font-size:11.5px}.ca-ust .ca-b{min-height:34px;padding:3px 10px;font-size:12.5px}.ca-ka button{width:28px;height:28px;font-size:13px}}',
            '@media (max-width:820px){.ca-orta{grid-template-columns:1fr;grid-template-rows:minmax(0,1fr) auto}.ca-panel{width:auto;max-height:46vh;border-left:0;border-top:1px solid #161d27}.ca-araclar{margin-left:0}.ca-ust h1{flex-basis:100%}}'
        ].join('\n');
        document.head.appendChild(st);
    }

    /* ------------------------------------------------------------ kütüphane */
    function kok() {
        let el = $('ca'); if (el) return el;
        el = document.createElement('div'); el.id = 'ca'; el.className = 'ca'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Çok açılı kayıtlar ve analiz');
        (document.fullscreenElement || document.body).appendChild(el); return el;
    }
    function sporcuListesi() {
        const l = [], gor = {};
        const ekle = (g, ad) => { const k = g + '|' + ad; if (gor[k] || !ad) return; gor[k] = 1; l.push({ g, ad }); };
        try { (typeof _kmListe !== 'undefined' && _kmListe || []).forEach((s) => ekle(s.g, s.ad)); } catch (e) { }
        try { Object.keys(turnuvaDB || {}).forEach((g) => { const o = turnuvaDB[g]; if (!o || typeof o !== 'object' || Array.isArray(o)) return; Object.keys(o).forEach((ad) => { const s = o[ad]; if (s && typeof s === 'object' && !s.pasif && (s.seriler || s.toplamSkor != null || s.yay)) ekle(g, ad); }); }); } catch (e) { }
        return l;
    }
    function sporcuSecHTML(id, secili) {
        const l = sporcuListesi(), d = secili ? secili.g + '|' + secili.ad : '';
        return '<select id="' + id + '"><option value="">— sporcu seç —</option>' + l.map((s) => '<option value="' + esc(s.g + '|' + s.ad) + '"' + (d === s.g + '|' + s.ad ? ' selected' : '') + '>' + esc(s.ad) + '</option>').join('') + '</select>';
    }
    const sporcuOku = (id) => { const v = ($(id) || {}).value || ''; if (!v) return null; const i = v.indexOf('|'); return { g: v.slice(0, i), ad: v.slice(i + 1) }; };

    async function listeCiz(filtre) {
        const el = kok(); kapatOynatici();
        _ca = _ca || {}; _ca.mod = 'liste'; if (filtre !== undefined) _ca.filtre = filtre;
        let l = []; try { l = await klipListe(); } catch (e) { tost('Kayıtlar okunamadı: bu tarayıcı yerel depolamaya izin vermiyor olabilir.', 'error'); }
        _ca.klipler = l;
        const f = _ca.filtre || '', gor = f ? l.filter((k) => k.sporcu && (k.sporcu.g + '|' + k.sporcu.ad) === f) : l;
        const sporcular = []; l.forEach((k) => { if (k.sporcu && !sporcular.some((s) => s.g === k.sporcu.g && s.ad === k.sporcu.ad)) sporcular.push(k.sporcu); });
        let dolu = ''; try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); dolu = 'Bu cihazda ' + Math.round((e.usage || 0) / 1048576) + ' MB kullanılıyor' + (e.quota ? ' · yer: ' + Math.round(e.quota / 1073741824) + ' GB' : ''); } } catch (e) { }
        const kar = _ca.karsiSec, ss = _ca.seriSec, ornekler = l.filter((k) => k.ornek), anaListe = gor.filter((k) => !k.ornek || ss || kar);
        // ⚖️ en iyi ↔ en kötü: tek sporcunun puanlı kayıtları arasında en az 2 puan fark varsa
        let iyiKotu = '';
        if (!kar && !ss) {
            const tek = f ? gor : (sporcular.length === 1 ? l : []), puanli = tek.filter((k) => puanSayi(k.puan) != null).sort((a, b) => puanSayi(b.puan) - puanSayi(a.puan) || b.t - a.t);
            if (puanli.length >= 2) { const iyi = puanli[0], kot = puanli[puanli.length - 1]; if (puanSayi(iyi.puan) - puanSayi(kot.puan) >= 2) iyiKotu = '<button type="button" class="ca-b ana" onclick="caIyiKotu(\'' + iyi.id + '\',\'' + kot.id + '\')" title="İki atışı bırakış anına göre yan yana koy, farkı ölç">⚖️ En iyi ' + puanRozet(iyi.puan) + ' ↔ en kötü ' + puanRozet(kot.puan) + yeni() + '</button>'; }
            else if (sporcular.length > 1 && !f && l.some((k) => k.puan)) iyiKotu = '<span class="ca-dolu">⚖️ En iyi ↔ en kötü için sporcu seç</span>';
        }
        el.innerHTML = '<div class="ca-ust"><h1>🎬 Kayıtlar & Analiz <small>' + l.length + ' kayıt</small></h1>'
            + (ss ? '<span class="ca-b on">👥 Üst üste konacak atışları seç (2–6)</span><button type="button" class="ca-b ana" onclick="caSeriGoster()"' + (ss.length >= 2 ? '' : ' disabled') + '>Üst üste göster (' + ss.length + ')</button><button type="button" class="ca-b" onclick="caSeriIptal()">Vazgeç</button>'
                : kar ? '<span class="ca-b on">⚖️ Karşılaştırılacak ikinci kaydı seç</span><button type="button" class="ca-b" onclick="caKarsiIptal()">Vazgeç</button>'
                    : '<button type="button" class="ca-b cek" onclick="caCek()" title="Bu cihazın kamerasıyla tek açıdan çek">📱 Çek' + yeni() + '</button>'
                    + '<button type="button" class="ca-b" onclick="caSeriBasla()" title="Bir serinin atışlarını bırakış anına göre üst üste koy">👥 Seri üst üste' + yeni() + '</button>'
                    + '<label class="ca-b" style="display:inline-flex;align-items:center;gap:6px">📁 Videolardan<input type="file" accept="video/*" multiple hidden onchange="caDosyadan(this)"></label>')
            + '<button type="button" class="ca-b" onclick="caKapat()" aria-label="Kapat">✕</button></div>'
            + '<div class="ca-liste"><div class="ca-l-bas"><select onchange="caFiltre(this.value)" aria-label="Sporcuya göre"><option value="">Bütün sporcular</option>' + sporcular.map((s) => '<option value="' + esc(s.g + '|' + s.ad) + '"' + (f === s.g + '|' + s.ad ? ' selected' : '') + '>' + esc(s.ad) + '</option>').join('') + '</select>' + iyiKotu + '<span class="ca-dolu">' + esc(dolu) + '</span></div>'
            + (ornekler.length && !ss && !kar ? '<div class="ca-bolum">⭐ Örnek atışlar</div><div class="ca-kartlar">' + ornekler.map(kartHTML).join('') + '</div><div class="ca-bolum">Kayıtlar</div>' : '')
            + (anaListe.length ? '<div class="ca-kartlar">' + anaListe.map(kartHTML).join('') + '</div>'
                : '<div class="ca-bos">' + (l.length ? 'Bu sporcunun kaydı yok.' : 'Henüz kayıt yok.') + '<br><b>📱 Çek</b> ile bu cihazın kamerasından çek: atış bitince puana dokun, kaydedilir.<br>Çok Açılı Kamera\'da telefonlar bağlıyken <b>⏺ Kaydet</b>\'e bas ya da <b>📌 Son 12 sn\'yi sakla</b>.<br>Telefonla çekilmiş videoların varsa <b>📁 Videolardan</b> ile ekle.</div>')
            + '</div>';
    }
    function kartHTML(k) {
        const kar = _ca.karsiSec, ss = _ca.seriSec, sira = ss ? ss.indexOf(k.id) : -1, ornekVar = (_ca.klipler || []).some((x) => x.ornek && x.id !== k.id);
        const ac = ss ? 'caSeriSec(\'' + k.id + '\')' : kar && kar !== k.id ? 'caKarsilastir(\'' + kar + '\',\'' + k.id + '\')' : 'caOynat(\'' + k.id + '\')';
        const an = k.anlar || {};
        return '<div class="ca-kart' + (kar === k.id || sira >= 0 ? ' sec' : '') + '"><button type="button" class="ca-kart-resim" style="background-image:url(' + (k.kucuk || '') + ')" onclick="' + ac + '" aria-label="' + (ss ? 'Seç' : 'Aç') + '">' + puanRozet(k.puan) + (k.ornek ? '<i class="ca-yildizi">⭐ Örnek</i>' : '') + (ss ? '<i class="ca-sec">' + (sira >= 0 ? sira + 1 : '') + '</i>' : '') + '<span>' + sn1(k.sure) + ' sn · ' + k.acilar.length + ' açı</span></button>'
            + '<div class="ca-kart-ic"><b>' + esc(k.sporcu ? k.sporcu.ad : 'Sporcu seçilmedi') + '</b><small>' + esc(k.tarih) + (k.ad ? ' · ' + esc(k.ad) : '') + (k.analiz ? ' · ✅ analiz kaydedildi' : '') + (an.birakis != null ? (an.birakisOto ? ' · 💥 bırakış sesten' : ' · 💥 bırakış işaretli') : '') + (k.iskelet && Object.keys(k.iskelet).length ? ' · 🦴' : '') + '</small>'
            + '<div class="ca-kart-alt">' + (ss ? '<button type="button" class="ca-b' + (sira >= 0 ? ' ana' : '') + '" onclick="' + ac + '">' + (sira >= 0 ? '✓ ' + (sira + 1) + '. atış' : 'Seç') + '</button>'
                : kar ? (kar === k.id ? '<span class="ca-dolu">1. kayıt</span>' : '<button type="button" class="ca-b ana" onclick="caKarsilastir(\'' + kar + '\',\'' + k.id + '\')">⚖️ Bununla karşılaştır</button>')
                    : '<button type="button" class="ca-b ana" onclick="caOynat(\'' + k.id + '\')">▶︎ Analiz et</button><button type="button" class="ca-b" onclick="caKarsiBasla(\'' + k.id + '\')">⚖️ Karşılaştır</button>'
                    + (ornekVar && !k.ornek ? '<button type="button" class="ca-b" onclick="caOrnekKiyas(\'' + k.id + '\')" title="Örnek atışın üstüne koy">⭐ Örnekle kıyasla</button>' : '')
                    + '<button type="button" class="ca-b" onclick="caOrnek(\'' + k.id + '\')" title="' + (k.ornek ? 'Örnek atış olmaktan çıkar' : 'Örnek atış yap: diğer atışlar bununla kıyaslanır') + '" aria-label="Örnek atış">' + (k.ornek ? '★' : '☆') + '</button>'
                    + '<button type="button" class="ca-b" onclick="caBilgi(\'' + k.id + '\')" aria-label="Düzenle">✏️</button><button type="button" class="ca-b kirmizi" onclick="caSil(\'' + k.id + '\')" aria-label="Sil">🗑</button>')
            + '</div></div></div>';
    }
    window.caFiltre = (v) => listeCiz(v);
    window.caKarsiBasla = (id) => { _ca.karsiSec = id; _ca.seriSec = null; listeCiz(); };
    window.caKarsiIptal = () => { _ca.karsiSec = null; listeCiz(); };
    // 👥 seri seçimi
    window.caSeriBasla = () => { _ca.seriSec = []; _ca.karsiSec = null; listeCiz(); };
    window.caSeriIptal = () => { _ca.seriSec = null; listeCiz(); };
    window.caSeriSec = (id) => { const s = _ca.seriSec; if (!s) return; const i = s.indexOf(id); if (i >= 0) s.splice(i, 1); else if (s.length >= 6) return tost('En çok 6 atış üst üste konur.', 'warning'); else s.push(id); listeCiz(); };
    window.caSeriGoster = () => { const s = (_ca.seriSec || []).slice(); if (s.length < 2) return; _ca.seriSec = null; window.caSeriOynat(s); };
    // ⭐ örnek atış
    window.caOrnek = async function (id) {
        const k = _ca && _ca.klip && _ca.klip.id === id ? _ca.klip : await klipOku(id); if (!k) return;
        k.ornek = !k.ornek; await klipYaz(k);
        tost(k.ornek ? '⭐ Örnek atış yapıldı: diğer kayıtlarda "Örnekle kıyasla" çıkar.' : 'Örnek atış olmaktan çıktı.', 'success');
        if (_ca.mod === 'oynat') ustCiz(); else listeCiz();
    };
    window.caOrnekKiyas = async function (id, ornekId) {
        const l = (await klipListe()).filter((k) => k.ornek && k.id !== id); if (!l.length) return tost('Önce bir kaydı ☆ ile örnek atış yap.', 'warning');
        const ac = (oid) => window.caOynat(id, oid, null, { hayalet: true });
        if (ornekId || l.length === 1) return ac(ornekId || l[0].id);
        const el = kok(), m = document.createElement('div'); m.className = 'ca-modal'; m.id = 'ca-modal';
        m.innerHTML = '<div><h3>⭐ Hangi örnek atışla?</h3>' + l.map((k) => '<button type="button" class="ca-b" style="justify-content:flex-start;display:flex;gap:8px;align-items:center" onclick="document.getElementById(\'ca-modal\').remove();caOrnekKiyas(\'' + id + '\',\'' + k.id + '\')">' + puanRozet(k.puan) + esc(k.sporcu ? k.sporcu.ad : 'Örnek') + ' · ' + esc(k.tarih) + (k.ad ? ' · ' + esc(k.ad) : '') + '</button>').join('') + '<div class="ca-sat"><button type="button" class="ca-b" onclick="document.getElementById(\'ca-modal\').remove()">Vazgeç</button></div></div>';
        el.appendChild(m);
    };
    window.caIyiKotu = (a, b) => window.caOynat(a, b, null, { olcum: true });
    window.caSil = function (id) {
        const f = async () => { await klipSil(id); tost('Kayıt silindi.', 'success'); listeCiz(); };
        if (typeof onayIste === 'function') onayIste('Bu kayıt bu cihazdan silinsin mi?<br><small>Kaydedilmiş analiz karnesi silinmez.</small>', f, 'Sil', 'Vazgeç'); else f();
    };
    window.caBilgi = async function (id) {
        const k = await klipOku(id); if (!k) return; const el = kok();
        const m = document.createElement('div'); m.className = 'ca-modal'; m.id = 'ca-modal';
        let puan = k.puan || '';
        m.innerHTML = '<div><h3>✏️ Kayıt bilgisi</h3><label>Sporcu' + sporcuSecHTML('ca-b-sp', k.sporcu) + '</label><label>Not / başlık<input id="ca-b-ad" value="' + esc(k.ad || '') + '" placeholder="ör. 18 m, 3. seri"></label>'
            + '<label>Puan (yeniden dokununca kalkar)</label><div class="ca-puanlar" id="ca-b-puan">' + PUANLAR.map((p) => '<button type="button" data-p="' + p + '" class="' + (p === puan ? 'on' : '') + '" style="background:' + puanRenk(p) + ';color:' + puanYazi(p) + '">' + p + '</button>').join('') + '</div>'
            + '<div class="ca-sat"><button type="button" class="ca-b" onclick="document.getElementById(\'ca-modal\').remove()">Vazgeç</button><button type="button" class="ca-b ana" id="ca-b-tamam">Kaydet</button></div></div>';
        el.appendChild(m);
        m.querySelectorAll('#ca-b-puan button').forEach((b) => { b.onclick = () => { puan = puan === b.dataset.p ? '' : b.dataset.p; m.querySelectorAll('#ca-b-puan button').forEach((x) => x.classList.toggle('on', x.dataset.p === puan)); }; });
        $('ca-b-tamam').onclick = async () => {
            const hedef = _ca && _ca.mod === 'oynat' ? [_ca.klip, _ca.karsi].concat(_ca.seri || []).find((x) => x && x.id === id) : null, kk = hedef || k;
            kk.sporcu = sporcuOku('ca-b-sp'); kk.ad = $('ca-b-ad').value.trim(); kk.puan = puan || null; await klipYaz(kk); m.remove();
            if (_ca && _ca.mod === 'oynat') { ustCiz(); izgaraKur(); altCiz(); } else listeCiz();
        };
    };

    /* ------------------------------------------------------------ telefondan çekilmiş videolardan kayıt */
    window.caDosyadan = async function (inp) {
        const dosyalar = Array.from(inp.files || []).slice(0, 4); inp.value = ''; if (!dosyalar.length) return;
        const el = kok(), m = document.createElement('div'); m.className = 'ca-modal'; m.id = 'ca-modal';
        const sec = ['on', 'yan', 'arka', 'hedef'];
        m.innerHTML = '<div><h3>📁 Videolardan yeni kayıt</h3><p class="ca-dolu">Her videonun hangi açı olduğunu seç. Aynı atışın farklı telefonlardan çekimleri olmalı. Açıldıktan sonra <b>⏱ Hizala</b> ile her açıyı bırakış anına getir.</p>'
            + dosyalar.map((d, i) => '<label>' + esc(d.name) + ' <small>(' + Math.round(d.size / 1048576) + ' MB)</small><select id="ca-d-' + i + '">' + sec.map((a, j) => '<option value="' + a + '"' + (j === i ? ' selected' : '') + '>' + ACILAR[a] + '</option>').join('') + '</select></label>').join('')
            + '<label>Sporcu' + sporcuSecHTML('ca-d-sp', null) + '</label>'
            + '<div class="ca-sat"><button type="button" class="ca-b" onclick="document.getElementById(\'ca-modal\').remove()">Vazgeç</button><button type="button" class="ca-b ana" id="ca-d-tamam">Kaydı oluştur</button></div></div>';
        el.appendChild(m);
        $('ca-d-tamam').onclick = async () => {
            const veriler = {}, acilar = [], kul = {};
            for (let i = 0; i < dosyalar.length; i++) { let a = $('ca-d-' + i).value; if (kul[a]) a = 'v' + (i + 1); kul[a] = 1; veriler[a] = { tip: 'video', blob: dosyalar[i], mime: dosyalar[i].type }; acilar.push({ id: a, ad: ACILAR[a], ofset: 0 }); }
            m.querySelector('div').innerHTML = '<h3>Kayıt hazırlanıyor…</h3>';
            let sure = 0, kucuk = '';
            try { const s = await videoKaynak(dosyalar[0]); sure = s.sure; kucuk = await kucukResim(s); kaynakKapat(s); } catch (e) { }
            for (let i = 1; i < dosyalar.length; i++) { try { const s = await videoKaynak(dosyalar[i]); sure = Math.max(sure, s.sure); kaynakKapat(s); } catch (e) { } }
            const id = await window.caKlipKaydet({ sporcu: sporcuOku('ca-d-sp'), sure, acilar, kucuk, kaynak: 'dosya' }, veriler);
            m.remove(); window.caOynat(id);
        };
    };
    async function kucukResim(s) {
        try { const c = document.createElement('canvas'), w = 360, h = Math.round(w * s.vh / s.vw); c.width = w; c.height = h; if (s.tip === 'video' && s.el.readyState < 2) await bir(s.el, ['loadeddata'], 2000); c.getContext('2d').drawImage(s.el, 0, 0, w, h); return c.toDataURL('image/jpeg', 0.6); } catch (e) { return ''; }
    }
    window.caKucukResim = kucukResim;

    /* ------------------------------------------------------------ oynatıcı */
    function kapatOynatici() {
        if (!_ca) return; cancelAnimationFrame(_ca.raf); _ca.raf = 0;
        if (_ca.cek) { kameraKapat(_ca.cek); _ca.cek = null; }
        (_ca.kareler || []).forEach((k) => kaynakKapat(k.src)); _ca.kareler = [];
        if (_ca.ro) { try { _ca.ro.disconnect(); } catch (e) { } _ca.ro = null; }
        clearTimeout(_ca.yazZ);
    }
    window.caOynat = async function (id, karsiId, karAci, ops) {
        css(); const el = kok(); kapatOynatici(); _ca = _ca || {}; ops = ops || {};
        const klip = await klipOku(id); if (!klip) return tost('Kayıt bulunamadı.', 'error');
        const karsi = karsiId ? await klipOku(karsiId) : null;
        Object.assign(_ca, { mod: 'oynat', klip, karsi, seri: null, kareler: [], T: 0, oynuyor: false, hiz: 0.5, duzen: karsi ? 'kar' : (klip.acilar.length > 1 ? '4' : '1'), secili: null, arac: null, hizala: false, panel: null, panelTur: null, dongu: false, karsiSec: null, seriSec: null, karAci: karAci || (klip.acilar[0] && klip.acilar[0].id) });
        if (ops.hayalet != null) _ca.hayalet = !!ops.hayalet;
        el.innerHTML = '<div class="ca-ust" id="ca-ust"></div><div class="ca-orta"><div class="ca-izgara" id="ca-izgara"><div class="ca-yok">Açılıyor…</div></div><aside class="ca-panel" id="ca-panel" hidden></aside></div><div class="ca-alt" id="ca-alt"></div>';
        // kaynaklar
        const ekle = async (k, a, kaydirma) => { try { const s = await kaynakAc(k, a); if (s) _ca.kareler.push({ klip: k, aci: a, src: s, kaydirma: kaydirma || 0 }); } catch (e) { } };
        if (karsi) {
            await birakisHazirla(klip); await birakisHazirla(karsi); // hizalama için iki kayıtta da bırakış (yoksa ipin sesinden)
            const aA = klip.acilar.find((a) => a.id === _ca.karAci) || klip.acilar[0], aB = karsi.acilar.find((a) => a.id === (aA && aA.id)) || karsi.acilar[0];
            const bA = klip.anlar && klip.anlar.birakis != null ? klip.anlar.birakis : 0, bB = karsi.anlar && karsi.anlar.birakis != null ? karsi.anlar.birakis : 0;
            await ekle(klip, aA, 0); await ekle(karsi, aB, bA - bB);
        } else for (const a of klip.acilar) await ekle(klip, a, 0);
        if (!_ca || _ca.klip !== klip) return;
        if (!_ca.kareler.length) { $('ca-izgara').innerHTML = '<div class="ca-yok">Bu kaydın videoları bu cihazda bulunamadı.</div>'; return; }
        oynaticiBaslat();
        if (!klip.kucuk) { klip.kucuk = await kucukResim(_ca.kareler[0].src); kaydet(); }
        if (ops.olcum) window.caPanel('olcum');
        if (!karsi && klip.anlar.birakis == null && !klip.sesBakildi) birakisHazirla(klip).then(() => { if (_ca && _ca.klip === klip && klip.anlar.birakis != null) { altCiz(); tost('💥 Bırakış anı ipin sesinden bulundu. Yanlışsa doğru karede 💥 Bırakış\'a bas.', 'info'); } }).catch(() => { });
    };
    function oynaticiBaslat() {
        const klip = _ca.klip; klip.anlar = klip.anlar || {};
        _ca.bas = 0; _ca.son = Math.max.apply(null, _ca.kareler.map((k) => k.src.sure + (k.aci.ofset || 0) + k.kaydirma).concat([_ca.seri ? 0 : (klip.sure || 0)]));
        if (klip.anlar.durus != null && !_ca.seri) _ca.T = Math.max(0, klip.anlar.durus);
        else if (_ca.seri || _ca.karsi) { const b = klip.anlar.birakis; _ca.T = b != null ? Math.max(0, b - 1500) : 0; }
        // iskelet açıkken açılan kayıtta veri yoksa kapat (kendiliğinden uzun analiz başlamasın)
        if (_ca.iskelet && !gorunenler().some((k) => iskVeri(k.klip, k.aci.id))) _ca.iskelet = false;
        izgaraKur(); ustCiz(); altCiz();
        if (window.ResizeObserver) { _ca.ro = new ResizeObserver(() => yerlestir()); _ca.ro.observe($('ca-izgara')); }
        _ca.onceki = null; _ca.raf = requestAnimationFrame(dongu);
    }
    window.caKarsilastir = (a, b) => window.caOynat(a, b);

    /* ------------------------------------------------------------ 👥 seri üst üste (v427) */
    function ortakAcilar(l) { const ilk = (l[0] && l[0].acilar || []).map((a) => a.id); return ilk.filter((a) => l.every((k) => k.acilar.some((x) => x.id === a))); }
    window.caSeriOynat = async function (ids, aciId) {
        css(); const el = kok(); kapatOynatici(); _ca = _ca || {};
        const l = []; for (const id of ids) { const k = await klipOku(id); if (k) l.push(k); }
        if (l.length < 2) return tost('Üst üste koymak için en az 2 kayıt gerekli.', 'warning');
        const ortak = ortakAcilar(l), aci = aciId && ortak.indexOf(aciId) >= 0 ? aciId : ortak[0] || null;
        Object.assign(_ca, { mod: 'oynat', klip: l[0], karsi: null, seri: l, seriAci: aci, ustUste: _ca.ustUste !== false, kareler: [], T: 0, oynuyor: false, hiz: 0.5, duzen: 'seri', secili: null, arac: null, hizala: false, panel: null, panelTur: null, dongu: false, karsiSec: null, seriSec: null });
        el.innerHTML = '<div class="ca-ust" id="ca-ust"></div><div class="ca-orta"><div class="ca-izgara" id="ca-izgara"><div class="ca-yok">Atışlar bırakış anına göre hizalanıyor…</div></div><aside class="ca-panel" id="ca-panel" hidden></aside></div><div class="ca-alt" id="ca-alt"></div>';
        for (const k of l) await birakisHazirla(k);
        if (!_ca || _ca.seri !== l) return;
        const b0 = l[0].anlar.birakis != null ? l[0].anlar.birakis : 0;
        for (const k of l) {
            const a = k.acilar.find((x) => x.id === aci) || k.acilar[0], b = k.anlar.birakis != null ? k.anlar.birakis : b0;
            try { const s = await kaynakAc(k, a); if (s) _ca.kareler.push({ klip: k, aci: a, src: s, kaydirma: b0 - b }); } catch (e) { }
        }
        if (!_ca.kareler.length) { $('ca-izgara').innerHTML = '<div class="ca-yok">Bu kayıtların videoları bu cihazda bulunamadı.</div>'; return; }
        // hizalamadan sonra en erken başlayan atış 0'dan başlasın
        const enKucuk = Math.min.apply(null, _ca.kareler.map((k) => (k.aci.ofset || 0) + k.kaydirma));
        if (enKucuk < 0) _ca.kareler.forEach((k) => { k.kaydirma -= enKucuk; });
        _ca.seriKaydir = enKucuk < 0 ? -enKucuk : 0;
        oynaticiBaslat(); _ca.T = Math.max(0, b0 + _ca.seriKaydir - 1500);
        window.caPanel('olcum');
    };
    window.caSeriAci = (a) => { if (_ca && _ca.seri) window.caSeriOynat(_ca.seri.map((k) => k.id), a); };
    window.caSeriGorunum = (ust) => { _ca.ustUste = !!ust; izgaraKur(); ustCiz(); };
    const seriBirakis = (k) => (k.klip.anlar && k.klip.anlar.birakis != null ? k.klip.anlar.birakis : null);

    /* ------------------------------------------------------------ 💥 bırakış ipin sesinden (v427) */
    // En sert ani yükselme: 5 ms'lik pencerelerin RMS zarfı; önceki 100 ms ortalamasına oranı en büyük olan tepe (en az 3×).
    async function sesBirakis(blob) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC || !blob || !blob.size) return null;
        let ac = null;
        try {
            ac = new AC(); const ab = await blob.arrayBuffer();
            const buf = await new Promise((ok, no) => { try { const p = ac.decodeAudioData(ab, ok, no); if (p && p.then) p.then(ok, no); } catch (e) { no(e); } });
            if (!buf || !buf.length) return null;
            const d = buf.getChannelData(0), sr = buf.sampleRate, W = Math.max(1, Math.round(sr * 0.005)), n = Math.floor(d.length / W);
            if (n < 60) return null;
            const env = new Float32Array(n); let tepe = 0;
            for (let i = 0; i < n; i++) { let s = 0; for (let j = i * W, e = j + W; j < e; j++) s += d[j] * d[j]; env[i] = Math.sqrt(s / W); if (i > 20 && env[i] > tepe) tepe = env[i]; }
            if (tepe < 0.01) return null; // sessiz kayıt
            let en = -1, enOran = 0;
            for (let i = 22; i < n; i++) {
                if (env[i] < tepe * 0.45) continue;
                let o = 0; const bas = Math.max(0, i - 22); for (let j = bas; j < i - 2; j++) o += env[j]; o /= Math.max(1, i - 2 - bas);
                const oran = env[i] / (o + tepe * 0.02);
                if (oran > enOran) { enOran = oran; en = i; }
            }
            if (en < 0 || enOran < 3) return null;
            return Math.round(en * W / sr * 1000);
        } catch (e) { return null; } finally { try { ac && ac.close && ac.close(); } catch (e) { } }
    }
    async function birakisHazirla(klip) {
        const an = klip.anlar = klip.anlar || {};
        if (an.birakis != null || klip.sesBakildi) return klip;
        klip.sesBakildi = true;
        for (const a of klip.acilar || []) {
            let v = null; try { v = await veriOku(klip.id, a.id); } catch (e) { }
            const b = v && v.tip !== 'kare' ? (v.blob || v) : null; if (!(b instanceof Blob)) continue;
            const ms = await sesBirakis(b); if (ms != null) { an.birakis = Math.round(ms + (a.ofset || 0)); an.birakisOto = true; break; }
        }
        try { await klipYaz(klip); } catch (e) { }
        return klip;
    }
    function kaydet() { if (!_ca || !_ca.klip) return; clearTimeout(_ca.yazZ); _ca.yazZ = setTimeout(() => { klipYaz(_ca.klip).catch(() => { }); }, 400); }
    function gorunenler() {
        const l = _ca.kareler;
        if (_ca.duzen === 'kar') return l;
        if (_ca.duzen === '1') { const s = l.find((k) => k.aci.id === _ca.secili) || l[0]; return [s]; }
        if (_ca.duzen === '2') { const s = (_ca.ikili || []).map((id) => l.find((k) => k.aci.id === id)).filter(Boolean); return s.length === 2 ? s : l.slice(0, 2); }
        return l;
    }
    // karşılaştırma / seri: kaydın sırası ve rengi (etiket, iskelet, efsane)
    function klipSira(k) { if (_ca.seri) return _ca.seri.indexOf(k.klip); if (_ca.karsi) return k.klip === _ca.klip ? 0 : 1; return 0; }
    function kareRengi(k) { if (_ca.seri) return SERI_RENK[klipSira(k) % SERI_RENK.length]; if (_ca.karsi) return KAR_RENK[klipSira(k)]; return '#4ade80'; }
    function klipBaslik(kl, i) {
        const ad = kl.sporcu ? ilkAd(kl.sporcu.ad) : '';
        if (_ca.seri) return (i + 1) + '. atış' + (kl.puan ? ' · ' + kl.puan : '') + (_ca.seri.some((x) => x.sporcu && kl.sporcu && x.sporcu.ad !== kl.sporcu.ad) && ad ? ' · ' + ad : '');
        return (i === 0 ? '① ' : '② ') + (kl.ornek ? '⭐ Örnek · ' : '') + (kl.puan ? kl.puan + ' · ' : '') + ((_ca.klip.sporcu && kl.sporcu && _ca.klip.sporcu.ad !== kl.sporcu.ad) || (_ca.karsi && _ca.karsi.sporcu && _ca.klip.sporcu && _ca.karsi.sporcu.ad !== _ca.klip.sporcu.ad) ? ad + ' · ' : '') + kl.tarih;
    }
    function izgaraKur() {
        const iz = $('ca-izgara'), g = gorunenler(), n = g.length, hay = hayaletMi();
        const kol = n === 1 || hay ? 1 : n <= 4 ? 2 : 3, sat = hay ? 1 : Math.ceil(n / kol);
        iz.style.gridTemplateColumns = 'repeat(' + kol + ', minmax(0,1fr))';
        iz.style.gridTemplateRows = 'repeat(' + sat + ', minmax(0,1fr))';
        iz.innerHTML = '';
        _ca.kareler.forEach((k) => { k.el = null; });
        g.forEach((k, i) => {
            const kid = 'k' + _ca.kareler.indexOf(k), cok = !!(_ca.karsi || _ca.seri);
            const d = document.createElement('div'); d.className = 'ca-kare' + (_ca.arac ? ' arac' : ''); d.dataset.k = kid;
            const etiket = (cok ? esc(klipBaslik(k.klip, klipSira(k))) + ' · ' : '') + esc(k.aci.ad || ACILAR[k.aci.id] || k.aci.id);
            d.innerHTML = '<div class="ca-ic"></div><span class="ca-et" style="--r:' + (cok ? kareRengi(k) : (ACI_RENK[k.aci.id] || '#94a3b8')) + '">' + etiket + '</span><div class="ca-ka"></div><div class="ca-hz" hidden></div>';
            const ic = d.querySelector('.ca-ic'); ic.appendChild(k.src.el);
            const ik = document.createElement('canvas'); ik.className = 'ca-isk'; ic.appendChild(ik); k.ik = ik; k.ikSon = null;
            const cz = document.createElement('canvas'); cz.className = 'ca-cizim'; ic.appendChild(cz); k.cz = cz; k.el = d;
            k.src.el.style.opacity = ''; k.src.el.style.background = '';
            if (hay) {
                d.style.gridArea = '1 / 1';
                if (i > 0) { // üstteki kayıtlar: yalnız görüntü saydam, iskelet ve çizim tam renk
                    d.style.pointerEvents = 'none'; d.style.background = 'transparent'; d.querySelector('.ca-et').hidden = true; d.querySelector('.ca-ka').hidden = true;
                    k.src.el.style.opacity = _ca.seri ? (_ca.iskelet ? '0' : '.3') : '.5'; k.src.el.style.background = 'transparent';
                }
            }
            iz.appendChild(d); karecikCiz(k); cizimBagla(k);
        });
        yerlestir();
    }
    function karecikCiz(k) {
        const d = k.el; if (!d) return; const tek = _ca.duzen === '1', ayna = !!(_ca.klip.ayna || {})[k.aci.id];
        d.querySelector('.ca-ka').innerHTML = (_ca.kareler.length > 1 && _ca.duzen !== 'kar' && _ca.duzen !== 'seri' ? '<button type="button" onclick="caTek(\'' + k.aci.id + '\')" aria-label="' + (tek ? 'Dörtlüye dön' : 'Büyüt') + '" title="' + (tek ? 'Dörtlüye dön' : 'Bu açıyı büyüt') + '">' + (tek ? '⤡' : '⤢') + '</button>' : '')
            + '<button type="button" onclick="caAyna(\'' + k.aci.id + '\')" aria-label="Ayna" title="Sağ-sol çevir"' + (ayna ? ' style="background:#ff7a2e"' : '') + '>⇆</button>'
            + (k.src.tip === 'video' && k.klip === _ca.klip ? '<button type="button" onclick="caFormLab(\'' + k.aci.id + '\')" aria-label="Form Lab" title="Bu açıyı Form Lab\'da iskeletle analiz et">🔬</button>' : '');
        const hz = d.querySelector('.ca-hz'); hz.hidden = !_ca.hizala;
        if (_ca.hizala) { const o = (k.aci.ofset || 0) + k.kaydirma; hz.innerHTML = '<button type="button" onclick="caKaydir(\'' + d.dataset.k + '\',-500)">−½ sn</button><button type="button" onclick="caKaydir(\'' + d.dataset.k + '\',' + (-KARE) + ')">−1 kare</button><span>' + (o >= 0 ? '+' : '−') + sn(Math.abs(o)) + '</span><button type="button" onclick="caKaydir(\'' + d.dataset.k + '\',' + KARE + ')">+1 kare</button><button type="button" onclick="caKaydir(\'' + d.dataset.k + '\',500)">+½ sn</button>'; }
    }
    const hayaletMi = () => !!(_ca && ((_ca.duzen === 'kar' && _ca.hayalet && _ca.kareler.length === 2) || (_ca.duzen === 'seri' && _ca.ustUste && _ca.kareler.length > 1)));
    window.caHayalet = () => { _ca.hayalet = !_ca.hayalet; izgaraKur(); ustCiz(); altCiz(); };
    const kareBul = (kid) => _ca.kareler.find((k) => k.el && k.el.dataset.k === kid);
    function kutu(k) {
        const d = k.el; if (!d) return null; const W = d.clientWidth, H = d.clientHeight, s = Math.min(W / k.src.vw, H / k.src.vh), w = k.src.vw * s, h = k.src.vh * s;
        return { x: (W - w) / 2, y: (H - h) / 2, w, h };
    }
    function yerlestir() {
        if (!_ca || _ca.mod !== 'oynat') return;
        _ca.kareler.forEach((k) => {
            if (!k.el) return; const b = kutu(k); if (!b) return;
            [k.src.el, k.cz, k.ik].forEach((e) => { if (!e) return; e.style.left = b.x + 'px'; e.style.top = b.y + 'px'; e.style.width = b.w + 'px'; e.style.height = b.h + 'px'; });
            const dpr = Math.min(2, window.devicePixelRatio || 1); k.cz.width = Math.round(b.w * dpr); k.cz.height = Math.round(b.h * dpr);
            if (k.ik) { k.ik.width = k.cz.width; k.ik.height = k.cz.height; k.ikSon = null; }
            donusum(k); cizimCiz(k);
        });
    }
    function donusum(k) {
        if (!k.el) return; const ic = k.el.querySelector('.ca-ic'), z = (k.zoom || 1), ayna = !!(_ca.klip.ayna || {})[k.aci.id] && k.klip === _ca.klip;
        ic.style.transformOrigin = (k.zx != null ? k.zx * 100 : 50) + '% ' + (k.zy != null ? k.zy * 100 : 50) + '%';
        ic.style.transform = 'scale(' + (ayna ? -z : z) + ',' + z + ')';
    }

    /* ------------------------------------------------------------ zaman + eşzamanlama */
    function yerel(k) { return _ca.T - (k.aci.ofset || 0) - k.kaydirma; }
    function dongu(simdi) {
        if (!_ca || _ca.mod !== 'oynat') return;
        const dt = _ca.onceki ? Math.min(100, simdi - _ca.onceki) : 0; _ca.onceki = simdi;
        if (_ca.oynuyor) {
            _ca.T += dt * _ca.hiz;
            const [b, s] = aralik();
            if (_ca.T >= s) { if (_ca.dongu || _ca.disaAktar) { if (_ca.disaAktar) { _ca.T = s; disaBitir(); } else _ca.T = b; } else { _ca.T = s; _ca.oynuyor = false; altCiz(); } }
        }
        _ca.kareler.forEach((k) => {
            if (!k.el) return; const l = yerel(k), s = k.src;
            if (s.tip === 'kare') { s.ciz(l); return; }
            const v = s.el, oyna = _ca.oynuyor && l >= 0 && l <= s.sure;
            try {
                if (oyna) {
                    if (v.playbackRate !== _ca.hiz) v.playbackRate = _ca.hiz;
                    if (v.paused) { v.currentTime = l / 1000; const p = v.play(); if (p && p.catch) p.catch(() => { }); }
                    else if (Math.abs(v.currentTime * 1000 - l) > 140 && !v.seeking) v.currentTime = l / 1000;
                } else {
                    if (!v.paused) v.pause();
                    const hedef = Math.max(0, Math.min(s.sure - 1, l));
                    if (!v.seeking && Math.abs(v.currentTime * 1000 - hedef) > 12) v.currentTime = hedef / 1000;
                }
            } catch (e) { }
            if (!hayaletMi() || k === _ca.kareler[0]) k.el.style.opacity = l < -40 || l > s.sure + 40 ? '.45' : '1';
        });
        if (_ca.iskelet) { iskeletleriCiz(); if (simdi - (_ca.olcZ || 0) > 180) { _ca.olcZ = simdi; olcumSatirYaz(); } }
        if (_ca.disaAktar) disaKare();
        const sl = $('ca-surgu'); if (sl && document.activeElement !== sl) sl.value = Math.round(_ca.T);
        const z = $('ca-zaman'); if (z) { const t = sn(_ca.T) + ' sn'; if (z.textContent !== t) z.textContent = t; }
        _ca.raf = requestAnimationFrame(dongu);
    }
    function aralik() { // döngü: Duruş→Takip arası işaretliyse orası, değilse bütün kayıt
        const a = _ca.klip.anlar || {}, bas = _ca.dongu && a.durus != null ? a.durus : 0, son = _ca.dongu && a.takip != null && a.takip > bas ? a.takip : _ca.son;
        if (_ca.disaAktar) return [_ca.disaAktar.bas, _ca.disaAktar.son];
        return [bas, son];
    }
    function git(t) { _ca.T = Math.max(0, Math.min(_ca.son, t)); }

    /* ------------------------------------------------------------ üst + alt çubuk */
    function ustCiz() {
        const k = _ca.klip, u = $('ca-ust'); if (!u) return; const n = _ca.kareler.length;
        const iskB = '<button type="button" class="ca-b' + (_ca.iskelet ? ' on' : '') + '" onclick="caIskelet()" title="Yapay zekâ vücut iskeletini çıkarır: kol ve omuz açıları">🦴 İskelet' + yeni() + '</button>';
        const olcB = '<button type="button" class="ca-b' + (_ca.panel && _ca.panelTur === 'olcum' ? ' on' : '') + '" onclick="caPanel(\'olcum\')" title="Atışların açılarını yan yana karşılaştır">📏 Ölçümler' + yeni() + '</button>';
        if (_ca.seri) {
            const acilar = ortakAcilar(_ca.seri), sp = []; _ca.seri.forEach((x) => { const a = x.sporcu ? ilkAd(x.sporcu.ad) : ''; if (a && sp.indexOf(a) < 0) sp.push(a); });
            u.innerHTML = '<button type="button" class="ca-b" onclick="caListe()">← Kayıtlar</button>'
                + '<h1>👥 Seri üst üste<small>' + esc(sp.join(', ')) + ' · ' + _ca.seri.length + ' atış</small></h1>'
                + (acilar.length > 1 ? '<div class="ca-gr" role="group" aria-label="Açı">' + acilar.map((a) => '<button type="button" class="ca-b' + (_ca.seriAci === a ? ' on' : '') + '" onclick="caSeriAci(\'' + a + '\')">' + esc(ACILAR[a] || a) + '</button>').join('') + '</div>' : '')
                + '<div class="ca-gr" role="group" aria-label="Görünüm"><button type="button" class="ca-b' + (_ca.ustUste ? ' on' : '') + '" onclick="caSeriGorunum(true)">👻 Üst üste</button><button type="button" class="ca-b' + (!_ca.ustUste ? ' on' : '') + '" onclick="caSeriGorunum(false)">▦ Izgara</button></div>'
                + iskB + olcB
                + '<button type="button" class="ca-b" onclick="caKareKaydet()" title="Bu anı resim olarak indir">📸 Kare</button>'
                + '<button type="button" class="ca-b" onclick="caDisaAktarSor()" title="Bu düzeni video olarak indir">🎞️ Video indir</button>'
                + '<button type="button" class="ca-b" onclick="caKapat()" aria-label="Kapat">✕</button>';
            return;
        }
        u.innerHTML = '<button type="button" class="ca-b" onclick="caListe()">← Kayıtlar</button>'
            + '<h1>' + (k.puan && !_ca.karsi ? puanRozet(k.puan) + ' ' : '') + esc(k.sporcu ? k.sporcu.ad : 'Sporcu seçilmedi') + '<small>' + esc(k.tarih) + (k.ad ? ' · ' + esc(k.ad) : '') + (_ca.karsi ? ' ⚖️ ' + esc(_ca.karsi.ornek ? '⭐ örnek' : _ca.karsi.tarih) : '') + '</small></h1>'
            + iskB + (_ca.karsi ? olcB : '<button type="button" class="ca-b' + (k.ornek ? ' on' : '') + '" onclick="caOrnek(\'' + k.id + '\')" title="Örnek atış: diğer kayıtlar bununla kıyaslanır">' + (k.ornek ? '★ Örnek' : '☆ Örnek yap') + '</button>')
            + (_ca.karsi ? '<div class="ca-gr" role="group" aria-label="Açı">' + _ca.klip.acilar.map((a) => '<button type="button" class="ca-b' + (_ca.karAci === a.id ? ' on' : '') + '" onclick="caKarAci(\'' + a.id + '\')">' + esc(a.ad || ACILAR[a.id]) + '</button>').join('') + '</div>'
                : (n > 1 ? '<div class="ca-gr" role="group" aria-label="Düzen"><button type="button" class="ca-b' + (_ca.duzen === '4' ? ' on' : '') + '" onclick="caDuzen(\'4\')">▦ ' + (n > 2 ? '4\'lü' : 'Hepsi') + '</button><button type="button" class="ca-b' + (_ca.duzen === '1' ? ' on' : '') + '" onclick="caDuzen(\'1\')">▢ Tek</button>' + (n > 2 ? '<button type="button" class="ca-b' + (_ca.duzen === '2' ? ' on' : '') + '" onclick="caDuzen(\'2\')">▥ Yan yana</button>' : '') + '</div>' : ''))
            + (!_ca.karsi ? '<button type="button" class="ca-b" onclick="caBilgi(\'' + k.id + '\')" title="Sporcu ve not">✏️ Sporcu</button><button type="button" class="ca-b" onclick="caKarsiBasla(\'' + k.id + '\');caListe()" title="Başka bir kayıtla yan yana">⚖️ Karşılaştır</button>' : '<button type="button" class="ca-b' + (_ca.hayalet ? ' on' : '') + '" onclick="caHayalet()" title="İki atışı aynı karede üst üste göster">👻 Üst üste</button><button type="button" class="ca-b" onclick="caOynat(\'' + k.id + '\')">Karşılaştırmadan çık</button>')
            + '<button type="button" class="ca-b" onclick="caKareKaydet()" title="Bu anı resim olarak indir">📸 Kare</button>'
            + '<button type="button" class="ca-b" onclick="caDisaAktarSor()" title="Bu düzeni çizimlerle video olarak indir">🎞️ Video indir</button>'
            + (!_ca.karsi ? '<button type="button" class="ca-b' + (_ca.panel && _ca.panelTur === 'analiz' ? ' on' : '') + '" onclick="caPanel()">📋 Tam analiz</button>' : '')
            + '<button type="button" class="ca-b" onclick="caKapat()" aria-label="Kapat">✕</button>';
    }
    function altCiz() {
        const a = $('ca-alt'); if (!a || !_ca) return; const an = _ca.klip.anlar || {}; _ca.olcSon = null;
        const imler = ANLAR.filter(([id]) => an[id] != null).map(([id, ad]) => '<button type="button" class="ca-im" style="left:' + (an[id] / Math.max(1, _ca.son) * 100) + '%" onclick="caGit(' + an[id] + ')" title="' + ad + '\'a git">' + ad + '</button>').join('');
        const ist = [];
        if (an.cekis != null && an.capa != null && an.capa > an.cekis) ist.push('Çekiş <b>' + sn(an.capa - an.cekis) + ' sn</b>');
        if (an.capa != null && an.birakis != null && an.birakis > an.capa) ist.push('Nişan <b>' + sn(an.birakis - an.capa) + ' sn</b>');
        if (an.birakis != null && an.takip != null && an.takip > an.birakis) ist.push('Takip <b>' + sn(an.takip - an.birakis) + ' sn</b>');
        if (an.durus != null && an.birakis != null && an.birakis > an.durus) ist.push('Toplam atış <b>' + sn(an.birakis - an.durus) + ' sn</b>');
        a.innerHTML = '<div class="ca-sat"><button type="button" class="ca-b" onclick="caAdim(-10)" aria-label="10 kare geri">⏪</button><button type="button" class="ca-b" onclick="caAdim(-1)" aria-label="Bir kare geri">◀︎ kare</button>'
            + '<button type="button" class="ca-b ana" onclick="caOynatDurdur()" style="min-width:64px" aria-label="Oynat/Durdur">' + (_ca.oynuyor ? '⏸' : '▶︎') + '</button>'
            + '<button type="button" class="ca-b" onclick="caAdim(1)" aria-label="Bir kare ileri">kare ▶︎</button><button type="button" class="ca-b" onclick="caAdim(10)" aria-label="10 kare ileri">⏩</button>'
            + '<div class="ca-cubuk">' + imler + '<input type="range" id="ca-surgu" min="0" max="' + Math.round(_ca.son) + '" value="' + Math.round(_ca.T) + '" step="1" oninput="caSurgu(this.value)" aria-label="Zaman"></div>'
            + '<span class="ca-zaman" id="ca-zaman">' + sn(_ca.T) + ' sn</span>'
            + '<div class="ca-gr" role="group" aria-label="Hız">' + HIZLAR.map(([h, ad]) => '<button type="button" class="ca-b' + (_ca.hiz === h ? ' on' : '') + '" onclick="caHiz(' + h + ')">' + ad + '</button>').join('') + '</div>'
            + '<button type="button" class="ca-b' + (_ca.dongu ? ' on' : '') + '" onclick="caDongu()" title="Duruş→Takip arasını tekrar tekrar oynat">🔁</button></div>'
            + (_ca.iskelet ? '<div class="ca-sat ca-olc" id="ca-olc"></div>' : '')
            + '<div class="ca-sat">' + (_ca.karsi || _ca.seri ? lejantHTML()
                : '<div class="ca-anlar" role="group" aria-label="Anlar">' + ANLAR.map(([id, ad, ik]) => '<button type="button" class="ca-b' + (an[id] != null ? ' var' : '') + '" onclick="caAn(\'' + id + '\')" title="' + ad + ' anını şu kareye koy (yeniden basınca kalkar)">' + ik + ' ' + ad + '</button>').join('') + '</div>'
                + '<div class="ca-ist">' + ist.map((x) => '<span>' + x + '</span>').join('') + '</div>')
            + '<div class="ca-araclar" role="group" aria-label="Çizim araçları">' + [['cizgi', '✏️', 'Çizgi'], ['aci', '📐', 'Açı'], ['daire', '◯', 'Daire'], ['dikey', '│', 'Dikey'], ['serbest', '〰', 'Serbest'], ['zoom', '🔍', 'Yakınlaştır']].map(([id, ik, ad]) => '<button type="button" class="ca-b' + (_ca.arac === id ? ' on' : '') + '" onclick="caArac(\'' + id + '\')" aria-label="' + ad + '">' + ik + '<span class="ca-y"> ' + ad + '</span></button>').join('')
            + '<button type="button" class="ca-b" onclick="caTemizle()" title="Bu kayıttaki çizimleri sil">🧹</button>'
            + (_ca.kareler.length > 1 ? '<button type="button" class="ca-b' + (_ca.hizala ? ' on' : '') + '" onclick="caHizala()" title="Açıları kare kare kaydırarak aynı ana getir">⏱ Hizala</button>' : '') + '</div></div>';
    }
    window.caListe = () => listeCiz();
    window.caKapat = function () { kapatOynatici(); const el = $('ca'); if (el) el.remove(); _ca = null; };
    window.caAc = function (ops) { css(); _ca = { filtre: ops && ops.sporcu ? ops.sporcu.g + '|' + ops.sporcu.ad : '' }; if (ops && ops.id) return window.caOynat(ops.id); listeCiz(); };
    window.caOynatDurdur = () => { if (!_ca) return; const [b, s] = aralik(); if (!_ca.oynuyor && _ca.T >= s - 5) _ca.T = b; _ca.oynuyor = !_ca.oynuyor; _ca.onceki = null; altCiz(); };
    window.caAdim = (n) => { if (!_ca) return; _ca.oynuyor = false; git(_ca.T + n * KARE); altCiz(); };
    window.caSurgu = (v) => { if (!_ca) return; _ca.oynuyor = false; git(+v); const b = document.querySelector('.ca-alt .ca-b.ana'); if (b) b.textContent = '▶︎'; };
    window.caGit = (t) => { if (!_ca) return; _ca.oynuyor = false; git(t); altCiz(); };
    window.caHiz = (h) => { if (!_ca) return; _ca.hiz = h; altCiz(); };
    window.caDongu = () => { _ca.dongu = !_ca.dongu; altCiz(); };
    window.caDuzen = (d) => { _ca.duzen = d; if (d === '2' && !_ca.ikili) _ca.ikili = _ca.kareler.slice(0, 2).map((k) => k.aci.id); if (d === '2') return ikiliSor(); izgaraKur(); ustCiz(); };
    function ikiliSor() {
        const el = kok(), m = document.createElement('div'); m.className = 'ca-modal'; m.id = 'ca-modal';
        const sec = (n) => '<select id="ca-ik-' + n + '">' + _ca.kareler.map((k) => '<option value="' + k.aci.id + '"' + (_ca.ikili[n] === k.aci.id ? ' selected' : '') + '>' + esc(k.aci.ad || ACILAR[k.aci.id]) + '</option>').join('') + '</select>';
        m.innerHTML = '<div><h3>▥ Yan yana hangi iki açı?</h3><label>Sol' + sec(0) + '</label><label>Sağ' + sec(1) + '</label><div class="ca-sat"><button type="button" class="ca-b ana" id="ca-ik-tamam">Göster</button></div></div>';
        el.appendChild(m); $('ca-ik-tamam').onclick = () => { _ca.ikili = [$('ca-ik-0').value, $('ca-ik-1').value]; m.remove(); izgaraKur(); ustCiz(); };
    }
    window.caTek = (id) => { _ca.duzen = _ca.duzen === '1' ? '4' : '1'; _ca.secili = id; izgaraKur(); ustCiz(); };
    window.caAyna = (id) => { _ca.klip.ayna = _ca.klip.ayna || {}; _ca.klip.ayna[id] = !_ca.klip.ayna[id]; kaydet(); _ca.kareler.forEach((k) => { if (k.aci.id === id) { donusum(k); karecikCiz(k); } }); };
    window.caKarAci = (id) => window.caOynat(_ca.klip.id, _ca.karsi.id, id);
    window.caAn = (id) => {
        const an = _ca.klip.anlar = _ca.klip.anlar || {};
        if (an[id] != null && Math.abs(an[id] - _ca.T) < 60) delete an[id]; else an[id] = Math.round(_ca.T);
        if (id === 'birakis') delete an.birakisOto;
        kaydet(); altCiz();
    };
    window.caHizala = () => { _ca.hizala = !_ca.hizala; _ca.kareler.forEach(karecikCiz); altCiz(); };
    window.caKaydir = (kid, ms) => {
        const k = kareBul(kid); if (!k) return;
        if (k.klip === _ca.klip && !_ca.karsi && !_ca.seri) { const a = _ca.klip.acilar.find((x) => x.id === k.aci.id); a.ofset = Math.round((a.ofset || 0) + ms); k.aci = a; kaydet(); }
        else k.kaydirma += ms;
        _ca.son = Math.max.apply(null, _ca.kareler.map((x) => x.src.sure + (x.aci.ofset || 0) + x.kaydirma)); karecikCiz(k); altCiz();
    };
    window.caFormLab = function (aciId) {
        const k = _ca.kareler.find((x) => x.aci.id === aciId && x.klip === _ca.klip); if (!k || k.src.tip !== 'video') return;
        veriOku(_ca.klip.id, aciId).then((v) => {
            const b = v && (v.blob || v); if (!b) return; const sp = _ca.klip.sporcu;
            const dosya = b instanceof File ? b : new File([b], (sp ? ilkAd(sp.ad) : 'video') + '-' + aciId + (/mp4/.test(b.type) ? '.mp4' : '.webm'), { type: b.type || 'video/webm' });
            window.caKapat(); try { if (typeof ckKapat === 'function') ckKapat(); } catch (e) { }
            if (typeof kmAracSec !== 'function') return; kmAracSec('formlab');
            let n = 0; const bekle = () => { if (typeof flDosyaSecildi === 'function' && typeof _fl !== 'undefined' && document.querySelector('#km-icerik .fl')) { if (sp) _fl.secili = sp.g + '|' + sp.ad; flDosyaSecildi({ files: [dosya], value: '' }); } else if (n++ < 100) setTimeout(bekle, 150); };
            bekle();
        });
    };

    /* ------------------------------------------------------------ çizim (açının içerik kutusuna göre 0..1) */
    const RENK = '#facc15';
    function noktaOf(k, e) {
        const r = k.cz.getBoundingClientRect(); let x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        if ((_ca.klip.ayna || {})[k.aci.id] && k.klip === _ca.klip) x = 1 - x;
        return [Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y))];
    }
    function sekiller(k) { if (k.klip !== _ca.klip) { k.yerelCizim = k.yerelCizim || []; return k.yerelCizim; } const c = _ca.klip.cizim = _ca.klip.cizim || {}; return c[k.aci.id] = c[k.aci.id] || []; }
    function aciDerece(p, w, h) { const [a, b, c] = p; const v1 = [(a[0] - b[0]) * w, (a[1] - b[1]) * h], v2 = [(c[0] - b[0]) * w, (c[1] - b[1]) * h]; const d = Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1)))); return Math.round(d * 180 / Math.PI); }
    function sekilCiz(x, s, w, h, olcek, aynaYazi) {
        const P = (p) => [p[0] * w, p[1] * h]; olcek = olcek || 1;
        x.strokeStyle = s.renk || RENK; x.fillStyle = s.renk || RENK; x.lineWidth = 3 * olcek; x.lineCap = 'round'; x.lineJoin = 'round';
        x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowBlur = 4 * olcek;
        const nokta = (p) => { const [a, b] = P(p); x.beginPath(); x.arc(a, b, 4.5 * olcek, 0, 7); x.fill(); };
        if (s.tip === 'cizgi' && s.p.length > 1) { x.beginPath(); x.moveTo(...P(s.p[0])); x.lineTo(...P(s.p[1])); x.stroke(); s.p.forEach(nokta); }
        else if (s.tip === 'dikey') { const [a] = P(s.p[0]); x.setLineDash([10 * olcek, 8 * olcek]); x.beginPath(); x.moveTo(a, 0); x.lineTo(a, h); x.stroke(); x.setLineDash([]); }
        else if (s.tip === 'daire' && s.p.length > 1) { const [a, b] = P(s.p[0]), [c, d] = P(s.p[1]); x.beginPath(); x.arc(a, b, Math.hypot(c - a, d - b), 0, 7); x.stroke(); }
        else if (s.tip === 'serbest' && s.p.length > 1) { x.beginPath(); x.moveTo(...P(s.p[0])); s.p.forEach((p) => x.lineTo(...P(p))); x.stroke(); }
        else if (s.tip === 'aci') {
            x.beginPath(); x.moveTo(...P(s.p[0])); s.p.slice(1).forEach((p) => x.lineTo(...P(p))); x.stroke(); s.p.forEach(nokta);
            if (s.p.length === 3) {
                const deg = aciDerece(s.p, w, h), [bx, by] = P(s.p[1]), t = deg + '°';
                x.shadowBlur = 0; x.font = '900 ' + Math.round(20 * olcek) + 'px system-ui,sans-serif'; const tw = x.measureText(t).width;
                x.save(); x.translate(bx, by); if (aynaYazi) x.scale(-1, 1); // aynalı görüntüde yazı ters okunmasın
                x.fillStyle = 'rgba(0,0,0,.75)'; x.fillRect(10 * olcek, -30 * olcek, tw + 14 * olcek, 28 * olcek); x.fillStyle = s.renk || RENK; x.fillText(t, 17 * olcek, -9 * olcek); x.restore();
            }
        }
        x.shadowBlur = 0;
    }
    function cizimCiz(k) {
        if (!k.cz) return; const x = k.cz.getContext('2d'), w = k.cz.width, h = k.cz.height, dpr = w / Math.max(1, parseFloat(k.cz.style.width) || w);
        x.clearRect(0, 0, w, h); const ay = aynaMi(k); sekiller(k).forEach((s) => sekilCiz(x, s, w, h, dpr, ay));
        if (k.taslak) sekilCiz(x, k.taslak, w, h, dpr, ay);
    }
    const aynaMi = (k) => !!(_ca.klip.ayna || {})[k.aci.id] && k.klip === _ca.klip;
    function cizimBagla(k) {
        const cz = k.cz;
        cz.onpointerdown = (e) => {
            if (!_ca.arac) return; e.preventDefault(); const p = noktaOf(k, e), a = _ca.arac;
            if (a === 'zoom') { if ((k.zoom || 1) >= 3) { k.zoom = 1; k.zx = k.zy = null; } else { k.zoom = (k.zoom || 1) + 1; k.zx = p[0]; k.zy = p[1]; } donusum(k); return; }
            if (a === 'dikey') { sekiller(k).push({ tip: 'dikey', p: [p] }); kaydet(); cizimCiz(k); return; }
            if (a === 'aci') { if (!k.taslak || k.taslak.tip !== 'aci') k.taslak = { tip: 'aci', p: [p] }; else k.taslak.p.push(p); if (k.taslak.p.length === 3) { sekiller(k).push(k.taslak); k.taslak = null; kaydet(); } cizimCiz(k); return; }
            k.taslak = { tip: a, p: [p, p] }; if (a === 'serbest') k.taslak.p = [p]; try { cz.setPointerCapture(e.pointerId); } catch (er) { }
        };
        cz.onpointermove = (e) => {
            if (!k.taslak) return; const p = noktaOf(k, e);
            if (k.taslak.tip === 'aci') { const t = k.taslak; t.onizle = p; const gecici = { tip: 'aci', p: t.p.concat([p]) }; const x = k.cz.getContext('2d'); cizimCiz(k); const dpr = k.cz.width / Math.max(1, parseFloat(k.cz.style.width) || k.cz.width); if (gecici.p.length <= 3) sekilCiz(x, gecici, k.cz.width, k.cz.height, dpr, aynaMi(k)); return; }
            if (k.taslak.tip === 'serbest') k.taslak.p.push(p); else k.taslak.p[1] = p; cizimCiz(k);
        };
        cz.onpointerup = () => {
            if (!k.taslak || k.taslak.tip === 'aci') return; const t = k.taslak; k.taslak = null;
            const uz = t.tip === 'serbest' ? t.p.length > 2 : Math.hypot(t.p[1][0] - t.p[0][0], t.p[1][1] - t.p[0][1]) > 0.01;
            if (uz) { if (t.tip === 'serbest') t.p = t.p.filter((_, i) => i % 2 === 0 || i === t.p.length - 1); sekiller(k).push(t); kaydet(); }
            cizimCiz(k);
        };
    }
    window.caArac = (a) => { _ca.arac = _ca.arac === a ? null : a; _ca.kareler.forEach((k) => { k.taslak = null; if (k.el) k.el.classList.toggle('arac', !!_ca.arac); }); altCiz(); };
    window.caTemizle = () => { _ca.klip.cizim = {}; _ca.kareler.forEach((k) => { k.yerelCizim = []; k.zoom = 1; k.zx = k.zy = null; donusum(k); cizimCiz(k); }); kaydet(); };

    /* ------------------------------------------------------------ bileşik görüntü (kare + video dışa aktarma) */
    function kompozit(c, W, H) {
        const x = c.getContext('2d'), g = gorunenler(), n = g.length, ust = Math.round(H * 0.075), alt = Math.round(H * 0.045);
        x.fillStyle = '#05070a'; x.fillRect(0, 0, W, H);
        const hay = hayaletMi(), kol = n === 1 || hay ? 1 : n <= 4 ? 2 : 3, sat = hay ? 1 : Math.ceil(n / kol), pad = Math.round(W * 0.004), tw = (W - pad * (kol + 1)) / kol, th = (H - ust - alt - pad * (sat + 1)) / sat;
        g.forEach((k, i) => {
            const j = hay ? 0 : i, cx = pad + (j % kol) * (tw + pad), cy = ust + pad + Math.floor(j / kol) * (th + pad), s = Math.min(tw / k.src.vw, th / k.src.vh), w = k.src.vw * s, h = k.src.vh * s, ox = cx + (tw - w) / 2, oy = cy + (th - h) / 2;
            if (!(hay && i > 0)) { x.fillStyle = '#000'; x.fillRect(cx, cy, tw, th); }
            const alfa = hay && i > 0 ? (_ca.seri ? (_ca.iskelet ? 0 : 0.3) : 0.5) : 1;
            x.save(); x.beginPath(); x.rect(cx, cy, tw, th); x.clip();
            const z = k.zoom || 1, zx = k.zx != null ? k.zx : 0.5, zy = k.zy != null ? k.zy : 0.5, ayna = !!(_ca.klip.ayna || {})[k.aci.id] && k.klip === _ca.klip;
            x.translate(ox + w * zx, oy + h * zy); x.scale(ayna ? -z : z, z); x.translate(-w * zx, -h * zy);
            if (alfa > 0) { x.globalAlpha = alfa; try { x.drawImage(k.src.el, 0, 0, w, h); } catch (e) { } x.globalAlpha = 1; }
            const c2 = document.createElement('canvas'); c2.width = Math.round(w); c2.height = Math.round(h); const x2 = c2.getContext('2d');
            if (_ca.iskelet) iskeletKareCiz(x2, k, w, h, Math.max(1, w / 640), ayna);
            sekiller(k).forEach((sk) => sekilCiz(x2, sk, w, h, Math.max(1, w / 640), ayna));
            x.drawImage(c2, 0, 0); x.restore(); // çizimler görüntüyle aynı dönüşümde: ekrandakiyle birebir
            const cok = !!(_ca.karsi || _ca.seri), et = (cok ? klipBaslik(k.klip, klipSira(k)) + ' · ' : '') + (k.aci.ad || ACILAR[k.aci.id] || ''), fs = Math.round(Math.max(14, H * 0.024));
            x.font = '900 ' + fs + 'px system-ui,sans-serif'; const ew = x.measureText(et).width;
            const ey = cy + 8 + (hay ? i * (fs + 18) : 0); x.fillStyle = 'rgba(0,0,0,.65)'; x.fillRect(cx + 8, ey, ew + 20, fs + 12); x.fillStyle = cok ? kareRengi(k) : (ACI_RENK[k.aci.id] || '#fff'); x.fillRect(cx + 8, ey, 5, fs + 12); x.fillStyle = '#fff'; x.fillText(et, cx + 20, ey + fs + 1);
        });
        const k = _ca.klip, an = k.anlar || {}, yakin = ANLAR.find(([id]) => an[id] != null && Math.abs(an[id] - _ca.T) < 120);
        x.fillStyle = '#0b1018'; x.fillRect(0, 0, W, ust); x.fillStyle = '#ff7a2e'; x.fillRect(0, ust - 3, W, 3);
        x.fillStyle = '#fff'; x.font = '900 ' + Math.round(ust * 0.42) + 'px system-ui,sans-serif'; x.fillText((k.sporcu ? k.sporcu.ad : 'Çok açılı analiz') + '  ·  ' + k.tarih, ust * 0.35, ust * 0.64);
        x.textAlign = 'right'; x.fillStyle = '#fde68a'; x.fillText((yakin ? yakin[2] + ' ' + yakin[1] + '   ' : '') + sn(_ca.T) + ' sn' + (_ca.hiz !== 1 && _ca.disaAktar ? '  ·  ' + HIZLAR.find((h) => h[0] === _ca.hiz)[1] : ''), W - ust * 0.35, ust * 0.64); x.textAlign = 'left';
        x.fillStyle = '#8b98aa'; x.font = '700 ' + Math.round(alt * 0.5) + 'px system-ui,sans-serif'; x.fillText('DAĞ S.K. · Çok Açılı Analiz', ust * 0.35, H - alt * 0.32);
    }
    window.caKareKaydet = function () {
        const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; kompozit(c, 1920, 1080);
        c.toBlob((b) => { if (!b) return; indir(b, dosyaAdi('kare', 'png')); tost('📸 Kare indirildi.', 'success'); }, 'image/png');
    };
    function dosyaAdi(tur, uz) { const k = _ca.klip; return ((k.sporcu ? k.sporcu.ad : 'analiz') + '-' + k.tarih + '-' + tur + '-' + sn1(_ca.T) + 'sn').replace(/[^\wçğıöşüÇĞİÖŞÜ.-]+/g, '_') + '.' + uz; }
    function indir(blob, ad) {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = ad; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    }
    window.caDisaAktarSor = function () {
        if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return tost('Bu tarayıcı video oluşturamıyor; 📸 Kare ile resim indirebilirsin.', 'warning');
        const an = _ca.klip.anlar || {}, el = kok(), m = document.createElement('div'); m.className = 'ca-modal'; m.id = 'ca-modal';
        const atis = an.durus != null && an.takip != null && an.takip > an.durus;
        m.innerHTML = '<div><h3>🎞️ Video olarak indir</h3><p class="ca-dolu">Ekrandaki düzen, çizimler ve sporcunun adıyla tek video. Video gerçek zamanlı oluşur (½× seçersen süre iki katı).</p>'
            + '<label>Bölüm<select id="ca-v-bol"><option value="atis"' + (atis ? ' selected' : '') + (atis ? '' : ' disabled') + '>Duruş → Takip (işaretli atış)' + (atis ? '' : ' · önce Duruş ve Takip anlarını işaretle') + '</option><option value="hepsi"' + (atis ? '' : ' selected') + '>Bütün kayıt</option></select></label>'
            + '<label>Hız<select id="ca-v-hiz">' + HIZLAR.slice(0, 3).map(([h, ad]) => '<option value="' + h + '"' + (h === 0.5 ? ' selected' : '') + '>' + ad + '</option>').join('') + '</select></label>'
            + '<div class="ca-sat"><button type="button" class="ca-b" onclick="document.getElementById(\'ca-modal\').remove()">Vazgeç</button><button type="button" class="ca-b ana" id="ca-v-tamam">Oluştur</button></div></div>';
        el.appendChild(m);
        $('ca-v-tamam').onclick = () => { const bol = $('ca-v-bol').value, h = +$('ca-v-hiz').value; m.remove(); disaBasla(bol === 'atis' ? [an.durus, an.takip] : [0, _ca.son], h); };
    };
    function disaBasla(ar, hiz) {
        const c = document.createElement('canvas'); c.width = 1280; c.height = 720; kompozit(c, 1280, 720);
        const akis = c.captureStream(30), turler = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'], tur = turler.find((t) => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || '';
        let kayit; try { kayit = new MediaRecorder(akis, tur ? { mimeType: tur, videoBitsPerSecond: 6e6 } : undefined); } catch (e) { return tost('Video oluşturulamadı.', 'error'); }
        const parcalar = []; kayit.ondataavailable = (e) => { if (e.data && e.data.size) parcalar.push(e.data); };
        const el = kok(), m = document.createElement('div'); m.className = 'ca-modal'; m.id = 'ca-disa';
        m.innerHTML = '<div><h3>🎞️ Video oluşuyor…</h3><div class="ca-ilerle"><i id="ca-v-il"></i></div><p class="ca-dolu">Bu pencere açık kalsın.</p><div class="ca-sat"><button type="button" class="ca-b" id="ca-v-iptal">Vazgeç</button></div></div>';
        el.appendChild(m);
        _ca.disaAktar = { c, kayit, parcalar, bas: ar[0], son: ar[1], eskiHiz: _ca.hiz, iptal: false, tur: tur || 'video/webm' };
        $('ca-v-iptal').onclick = () => { _ca.disaAktar.iptal = true; disaBitir(); };
        _ca.hiz = hiz; _ca.T = ar[0]; _ca.oynuyor = true; _ca.onceki = null;
        kayit.onstop = () => {
            const d = _ca && _ca.disaAktar; if (!d) return; _ca.disaAktar = null; m.remove(); _ca.hiz = d.eskiHiz; altCiz();
            if (d.iptal) return; const b = new Blob(d.parcalar, { type: d.tur.split(';')[0] });
            const ad = dosyaAdi('video', /mp4/.test(d.tur) ? 'mp4' : 'webm'), f = new File([b], ad, { type: b.type });
            if (navigator.canShare && /iPhone|iPad|Android/i.test(navigator.userAgent) && navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: ad }).catch(() => indir(b, ad)); else indir(b, ad);
            tost('🎞️ Video hazır (' + Math.round(b.size / 1048576 * 10) / 10 + ' MB).', 'success');
        };
        setTimeout(() => { try { kayit.start(500); } catch (e) { } }, 150);
    }
    function disaKare() { const d = _ca.disaAktar; if (!d) return; kompozit(d.c, 1280, 720); const i = $('ca-v-il'); if (i) i.style.width = Math.min(100, (_ca.T - d.bas) / Math.max(1, d.son - d.bas) * 100) + '%'; }
    function disaBitir() { const d = _ca && _ca.disaAktar; if (!d) return; _ca.oynuyor = false; try { if (d.kayit.state !== 'inactive') d.kayit.stop(); else d.kayit.onstop(); } catch (e) { } }

    /* ------------------------------------------------------------ 📋 tam analiz (Teknik Analiz saha karnesi) */
    const FAZ_AN = [['durus'], ['durus', 'cekis'], ['cekis'], ['capa'], ['capa'], ['capa', 'birakis'], ['birakis'], ['takip']];
    function yayOf() { try { const s = _ca.klip.sporcu, sp = s && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; return sp && /makaral/i.test(sp.yay || '') ? 'makarali' : 'klasik'; } catch (e) { return 'klasik'; } }
    function fazlarOf(yay) { try { if (typeof KM_TA_FAZLAR !== 'undefined') return KM_TA_FAZLAR[yay] || KM_TA_FAZLAR.klasik; } catch (e) { } return [{ ad: 'Duruş', k: ['Ayak duruşu aynı'] }, { ad: 'Çekiş', k: ['Dirsek ok hizasında'] }, { ad: 'Çapa', k: ['Çene altı teması sabit'] }, { ad: 'Bırakış', k: ['Parmaklar gevşiyor'] }]; }
    function taslak() {
        const k = _ca.klip; if (!k.taslak || !k.taslak.fazlar) { const yay = yayOf(); k.taslak = { yay, fazlar: fazlarOf(yay).map((f) => ({ puan: 0, k: f.k.map(() => null), kNot: f.k.map(() => ''), not: '', foto: null })), acik: 0 }; }
        return k.taslak;
    }
    window.caPanel = (tur) => {
        tur = tur === 'olcum' ? 'olcum' : 'analiz';
        if (_ca.panel && _ca.panelTur === tur) _ca.panel = false; else { _ca.panel = true; _ca.panelTur = tur; }
        const p = $('ca-panel'); p.hidden = !_ca.panel; ustCiz(); if (_ca.panel) panelCiz(); setTimeout(yerlestir, 50);
    };
    function panelCiz() {
        if (_ca.panelTur === 'olcum') return olcumPanelCiz();
        const p = $('ca-panel'); if (!p || !_ca.panel) return; const t = taslak(), F = fazlarOf(t.yay), k = _ca.klip;
        p.innerHTML = '<h2>📋 Tam analiz</h2><p>Her fazı ilgili ana getir (faz adına dokun), maddeleri işaretle, 📸 ile o anın 4 açılı karesini ekle. <b>Saha karnesine kaydet</b> deyince sporcunun Teknik Analiz geçmişine yazılır, telefondan da görünür.</p>'
            + '<div class="ca-sat"><label style="font-size:13px;font-weight:800">Sporcu ' + sporcuSecHTML('ca-p-sp', k.sporcu) + '</label><div class="ca-gr"><button type="button" class="ca-b' + (t.yay === 'klasik' ? ' on' : '') + '" onclick="caYay(\'klasik\')">Klasik</button><button type="button" class="ca-b' + (t.yay === 'makarali' ? ' on' : '') + '" onclick="caYay(\'makarali\')">Makaralı</button></div></div>'
            + F.map((f, i) => {
                const d = t.fazlar[i], dolu = d.puan || d.k.some(Boolean) || d.not || d.foto, acik = t.acik === i;
                return '<div class="ca-faz' + (acik ? ' acik' : '') + '"><button type="button" onclick="caFazAc(' + i + ')"><b>' + (i + 1) + '. ' + esc(f.ad) + '</b><i>' + (d.puan ? '★'.repeat(d.puan) : '') + (d.foto ? ' 📸' : '') + (dolu ? ' ✓' : '') + '</i></button>'
                    + (acik ? '<div class="ca-faz-ic">'
                        + '<div class="ca-yildiz" role="group" aria-label="Puan">' + [1, 2, 3, 4, 5].map((n) => '<button type="button" class="' + (d.puan >= n ? 'on' : '') + '" onclick="caFazPuan(' + i + ',' + n + ')">' + n + '</button>').join('') + '</div>'
                        + f.k.map((m, j) => '<div class="ca-madde"><span>' + esc(m) + '</span><span class="ca-dh"><button type="button" class="' + (d.k[j] === 'dogru' ? 'd' : '') + '" onclick="caMadde(' + i + ',' + j + ',\'dogru\')" aria-label="Doğru">✓</button><button type="button" class="' + (d.k[j] === 'hatali' ? 'h' : '') + '" onclick="caMadde(' + i + ',' + j + ',\'hatali\')" aria-label="Hatalı">✗</button></span></div>').join('')
                        + '<textarea placeholder="Not: ne görüyorsun, ne çalışılmalı?" oninput="caFazNot(' + i + ',this.value)">' + esc(d.not || '') + '</textarea>'
                        + (d.foto ? '<img class="ca-foto" src="' + d.foto + '" alt="' + esc(f.ad) + ' karesi">' : '')
                        + '<div class="ca-faz-alt"><button type="button" class="ca-b" onclick="caFazFoto(' + i + ')">📸 ' + (d.foto ? 'Kareyi yenile' : 'Bu anın karesini ekle') + '</button>' + (d.foto ? '<button type="button" class="ca-b" onclick="caFazFoto(' + i + ',true)">Kareyi kaldır</button>' : '') + '</div>'
                        + '</div>' : '') + '</div>';
            }).join('')
            + '<div class="ca-kaydet">' + (k.analiz ? '<p style="margin-bottom:6px">✅ ' + esc(k.analiz.tarih) + ' saha karnesine kaydedildi' + (k.analiz.skor != null ? ' · ' + k.analiz.skor + ' puan' : '') + '. Yeniden kaydedersen yeni bir karne olur.</p>' : '')
            + '<button type="button" class="ca-b ana" onclick="caAnalizKaydet()">💾 Saha karnesine kaydet</button></div>';
        const s = $('ca-p-sp'); if (s) s.onchange = () => { k.sporcu = sporcuOku('ca-p-sp'); kaydet(); ustCiz(); };
    }
    window.caYay = (y) => { const t = taslak(); if (t.yay === y) return; const eski = t.fazlar; t.yay = y; t.fazlar = fazlarOf(y).map((f, i) => ({ puan: (eski[i] || {}).puan || 0, k: f.k.map(() => null), kNot: f.k.map(() => ''), not: (eski[i] || {}).not || '', foto: (eski[i] || {}).foto || null })); kaydet(); panelCiz(); };
    window.caFazAc = (i) => {
        const t = taslak(); t.acik = t.acik === i ? -1 : i; kaydet(); panelCiz();
        const an = _ca.klip.anlar || {}, l = (FAZ_AN[i] || []).map((x) => an[x]).filter((v) => v != null);
        if (t.acik === i && l.length) { _ca.oynuyor = false; git(l.reduce((a, b) => a + b, 0) / l.length); altCiz(); }
    };
    window.caFazPuan = (i, n) => { const d = taslak().fazlar[i]; d.puan = d.puan === n ? 0 : n; kaydet(); panelCiz(); };
    window.caMadde = (i, j, v) => { const d = taslak().fazlar[i]; d.k[j] = d.k[j] === v ? null : v; kaydet(); panelCiz(); };
    window.caFazNot = (i, v) => { taslak().fazlar[i].not = v; kaydet(); };
    window.caFazFoto = (i, sil) => {
        const d = taslak().fazlar[i]; if (sil) { d.foto = null; kaydet(); return panelCiz(); }
        const c = document.createElement('canvas'); c.width = 1280; c.height = 720; kompozit(c, 1280, 720);
        d.foto = c.toDataURL('image/jpeg', 0.72); kaydet(); panelCiz(); tost('📸 Kare ' + (i + 1) + '. faza eklendi.', 'success');
    };
    window.caAnalizKaydet = async function () {
        const k = _ca.klip, t = taslak(); if (!k.sporcu) { tost('Önce sporcuyu seç.', 'warning'); const s = $('ca-p-sp'); if (s) s.focus(); return; }
        const F = fazlarOf(t.yay); let top = 0, adet = 0;
        const fazlar = F.map((f, i) => {
            const d = t.fazlar[i], dogru = d.k.filter((v) => v === 'dogru').length / Math.max(1, f.k.length);
            if (d.puan) { top += (d.puan / 5) * 70 + dogru * 30; adet++; }
            return { ad: f.ad, puan: d.puan || 0, k: d.k.slice(), kNot: d.kNot.slice(), not: d.not || '', foto: d.foto || null };
        });
        if (!fazlar.some((f) => f.puan || f.k.some(Boolean) || f.not || f.foto)) return tost('En az bir fazda puan, madde, not ya da kare olmalı.', 'warning');
        const an = k.anlar || {}, sureler = [];
        if (an.cekis != null && an.capa != null && an.capa > an.cekis) sureler.push('çekiş ' + sn(an.capa - an.cekis) + ' sn');
        if (an.capa != null && an.birakis != null && an.birakis > an.capa) sureler.push('nişan ' + sn(an.birakis - an.capa) + ' sn');
        if (sureler.length) { const s = fazlar[Math.min(5, fazlar.length - 1)]; s.not = (s.not ? s.not + ' · ' : '') + 'Çok açılı ölçüm: ' + sureler.join(', '); }
        // 🦴 iskelet varsa bırakıştan hemen önceki açılar Çapa fazının notuna
        if (an.birakis != null) {
            const yaz = []; (k.acilar || []).forEach((a) => { const o = klipOlcum(k, a); if (!o || !o.b) return; const l = olcumMaddeleri(o.b).map(([ad, d]) => ad.toLowerCase() + ' ' + d); if (l.length) yaz.push((a.ad || ACILAR[a.id]) + ': ' + l.join(', ')); });
            if (yaz.length) { const s = fazlar[Math.min(4, fazlar.length - 1)]; s.not = (s.not ? s.not + ' · ' : '') + 'İskelet ölçümü (bırakıştan hemen önce) — ' + yaz.join(' | '); }
        }
        const skor = adet ? Math.round(top / adet) : null;
        try {
            const r = await fetch('/api/teknik-analiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grup: k.sporcu.g, ad: k.sporcu.ad, yay: t.yay, tarih: bugun(), skor, fazlar, olusturan: 'cokaci:' + k.id }) });
            const d = await r.json().catch(() => ({}));
            if (!r.ok || !d.applied) return tost(r.status === 401 || r.status === 403 ? 'Karne kaydı için eğitmen girişi gerekiyor.' : 'Karne kaydedilemedi, tekrar dene.', 'error');
            k.analiz = { id: d.id, tarih: bugun(), skor }; kaydet(); panelCiz();
            tost('✅ ' + ilkAd(k.sporcu.ad) + ' için çok açılı saha karnesi kaydedildi' + (skor != null ? ' — ' + skor + ' puan' : '') + '.', 'success');
        } catch (e) { tost('Karne kaydedilemedi (bağlantı yok). Analiz bu cihazda duruyor, sonra tekrar kaydet.', 'error'); }
    };

    /* ------------------------------------------------------------ 🦴 iskelet (v427) */
    // Saklanan 13 nokta (x, y 0..1, görünürlük): 0 burun, 1 sol omuz, 2 sağ omuz, 3 sol dirsek, 4 sağ dirsek, 5 sol bilek, 6 sağ bilek,
    // 7 sol kalça, 8 sağ kalça, 9 sol diz, 10 sağ diz, 11 sol ayak, 12 sağ ayak. Kayıt başına açı başına: { fps, w, h, t0, k:[39 sayı | null] }.
    const ISK_MP = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
    const KEMIK = [[1, 2], [1, 3], [3, 5], [2, 4], [4, 6], [1, 7], [2, 8], [7, 8], [7, 9], [9, 11], [8, 10], [10, 12]];
    const ISK_FPS = 10, GOR = 0.35, MP_TV = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
    let _poz = null;
    function pozHazir() {
        if (_poz) return _poz;
        return _poz = (async () => {
            const v = await import(MP_TV + '/vision_bundle.mjs');
            const fs = await v.FilesetResolver.forVisionTasks(MP_TV + '/wasm');
            const tur = /iPhone|iPad|Android|Mobile/i.test(navigator.userAgent) ? 'lite' : 'full';
            const model = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_' + tur + '/float16/1/pose_landmarker_' + tur + '.task';
            const yap = (d) => v.PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: model, delegate: d }, runningMode: 'VIDEO', numPoses: 3, minPoseDetectionConfidence: 0.4, minPosePresenceConfidence: 0.4, minTrackingConfidence: 0.4 });
            let tercih = 'GPU';
            try { if (window.FL_DELEGATE) tercih = window.FL_DELEGATE; else if (localStorage.getItem('dagsk_formlab_delegate')) tercih = localStorage.getItem('dagsk_formlab_delegate'); else if (typeof flGpuYazilimsalMi === 'function' && flGpuYazilimsalMi()) tercih = 'CPU'; } catch (e) { }
            let lm; try { lm = await yap(tercih); } catch (e) { if (tercih === 'CPU') throw e; lm = await yap('CPU'); }
            return { lm, ts: 0 };
        })().catch((e) => { _poz = null; throw e; });
    }
    function kisiSec(l, onceki) { // salonda birden çok kişi: ilk karede en büyük, sonra bir önceki kareye en yakın kişi
        if (!l || !l.length) return null;
        const merkez = (p) => [(p[11].x + p[12].x + p[23].x + p[24].x) / 4, (p[11].y + p[12].y + p[23].y + p[24].y) / 4];
        if (onceki && l.length > 1) { const m0 = merkez(onceki); let en = null, ed = 1e9; l.forEach((p) => { const m = merkez(p), d = Math.hypot(m[0] - m0[0], m[1] - m0[1]); if (d < ed) { ed = d; en = p; } }); return en; }
        let en = null, eb = -1;
        l.forEach((p) => { let x0 = 1, x1 = 0, y0 = 1, y1 = 0; ISK_MP.forEach((i) => { const q = p[i]; if ((q.visibility == null ? 1 : q.visibility) < GOR) return; x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }); const b = Math.max(0, x1 - x0) * Math.max(0, y1 - y0); if (b > eb) { eb = b; en = p; } });
        return en;
    }
    const r3 = (v) => Math.round(v * 1000) / 1000;
    function sikistir(p) { const o = []; ISK_MP.forEach((i) => { const q = p[i]; o.push(r3(q.x), r3(q.y), Math.round((q.visibility == null ? 1 : q.visibility) * 100) / 100); }); return o; }
    function kareAn(s, t) { const fr = s.fr; if (!fr || !fr.length) return null; let lo = 0, hi = fr.length - 1, i = 0; while (lo <= hi) { const m = (lo + hi) >> 1; if (fr[m].t <= t) { i = m; lo = m + 1; } else hi = m - 1; } return fr[i]; }
    async function iskeletCikar(k, ar, ilerle, iptalMi) {
        const P = await pozHazir(), s = k.src, t0 = Math.max(0, ar[0]), t1 = Math.max(t0, Math.min(s.sure, ar[1])), N = Math.max(1, Math.floor((t1 - t0) / 1000 * ISK_FPS));
        const kar = []; let el = null, c = null, onceki = null;
        if (s.tip === 'video') {
            el = document.createElement('video'); el.muted = true; el.playsInline = true; el.setAttribute('playsinline', ''); el.preload = 'auto';
            el.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;z-index:-1';
            document.body.appendChild(el); el.src = s.url; await bir(el, ['loadeddata', 'error'], 10000);
            try { await el.play(); } catch (e) { } try { el.pause(); } catch (e) { }
        } else c = document.createElement('canvas');
        try {
            for (let i = 0; i <= N; i++) {
                if (iptalMi && iptalMi()) return null;
                const t = Math.min(t1, t0 + i * 1000 / ISK_FPS); let kaynak = el;
                if (el) { if (Math.abs(el.currentTime - t / 1000) > 0.001) { const b = bir(el, ['seeked'], 4000); el.currentTime = t / 1000; await b; } }
                else { const fr = kareAn(s, t); if (!fr) { kar.push(null); continue; } const bm = await createImageBitmap(fr.b); c.width = bm.width; c.height = bm.height; c.getContext('2d').drawImage(bm, 0, 0); if (bm.close) bm.close(); kaynak = c; }
                let r = null; try { P.ts = Math.max(P.ts + 1, Math.round(performance.now())); r = P.lm.detectForVideo(kaynak, P.ts); } catch (e) { }
                const p = kisiSec(r && r.landmarks, onceki); if (p) onceki = p;
                kar.push(p ? sikistir(p) : null);
                if (ilerle) ilerle((i + 1) / (N + 1));
                if (i % 3 === 2) await new Promise((ok) => setTimeout(ok, 0));
            }
        } finally { if (el) { try { el.removeAttribute('src'); el.load(); } catch (e) { } el.remove(); } }
        return { fps: ISK_FPS, w: s.vw, h: s.vh, t0: Math.round(t0), k: kar };
    }
    const iskVeri = (klip, aciId) => (klip && klip.iskelet && klip.iskelet[aciId]) || null;
    function iskKare(d, ms) { // ms: açının kendi videosunun zamanı → 13 nokta (iki kare arası doğrusal)
        if (!d || !d.k || !d.k.length) return null; const f = (ms - (d.t0 || 0)) / 1000 * d.fps;
        if (f < -1 || f > d.k.length) return null;
        const i = Math.max(0, Math.min(d.k.length - 1, Math.floor(f))), r = Math.max(0, Math.min(1, f - i)), a = d.k[i], b = d.k[Math.min(i + 1, d.k.length - 1)];
        const A = a || b, B = b || a; if (!A) return null; const w = a && b ? r : 0, o = [];
        for (let j = 0; j < 13; j++) o.push([A[j * 3] + (B[j * 3] - A[j * 3]) * w, A[j * 3 + 1] + (B[j * 3 + 1] - A[j * 3 + 1]) * w, Math.min(A[j * 3 + 2], B[j * 3 + 2])]);
        return o;
    }
    function aci3(a, b, c) { if (!a || !b || !c || a[2] < GOR || b[2] < GOR || c[2] < GOR) return null; const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]], n = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]); if (!n) return null; return Math.round(Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / n))) * 180 / Math.PI); }
    function cekisYonu(d) { // düz duran kol yay kolu; çekiş kolu öbürü ('D' = sağ, sağ elini kullanan)
        if (d.yon) return d.yon; let sol = 0, sag = 0; const W = d.w || 1, H = d.h || 1;
        (d.k || []).forEach((f) => { if (!f) return; const p = (j) => [f[j * 3] * W, f[j * 3 + 1] * H, f[j * 3 + 2]]; const L = aci3(p(1), p(3), p(5)), R = aci3(p(2), p(4), p(6)); if (L == null || R == null) return; if (L > R + 20) sol++; else if (R > L + 20) sag++; });
        return d.yon = sag > sol ? 'S' : 'D';
    }
    function olc(pts, d) {
        if (!pts || !d) return null; const W = d.w || 1, H = d.h || 1, P = (j) => [pts[j][0] * W, pts[j][1] * H, pts[j][2]], yon = cekisYonu(d);
        const c = yon === 'S' ? [1, 3, 5] : [2, 4, 6], y = yon === 'S' ? [2, 4, 6] : [1, 3, 5], o = { yon };
        o.dirsek = aci3(P(c[0]), P(c[1]), P(c[2])); o.yay = aci3(P(y[0]), P(y[1]), P(y[2]));
        const e = P(c[1]), w = P(c[2]); if (e[2] >= GOR && w[2] >= GOR && Math.hypot(e[0] - w[0], e[1] - w[1]) > 3) o.hiza = Math.round(Math.atan2(e[1] - w[1], Math.abs(e[0] - w[0])) * 180 / Math.PI);
        const sL = P(1), sR = P(2), hL = P(7), hR = P(8);
        if (sL[2] >= GOR && sR[2] >= GOR) { const dx = sR[0] - sL[0], dy = sR[1] - sL[1], gen = Math.hypot(dx, dy); o.omuzG = gen; if (Math.abs(dx) > gen * 0.5) { let t = Math.atan2(dy, dx) * 180 / Math.PI; if (t > 90) t -= 180; if (t < -90) t += 180; o.omuz = Math.round(Math.abs(t)); } }
        if ([sL, sR, hL, hR].every((q) => q[2] >= GOR)) { const sx = (sL[0] + sR[0]) / 2, sy = (sL[1] + sR[1]) / 2, hx = (hL[0] + hR[0]) / 2, hy = (hL[1] + hR[1]) / 2; o.govde = Math.round(Math.abs(Math.atan2(sx - hx, hy - sy) * 180 / Math.PI)); }
        if (pts[0][2] >= GOR) o.burun = [pts[0][0] * W, pts[0][1] * H];
        return o;
    }
    function klipOlcum(klip, a) { // b: bırakıştan 0,1 sn önce (tam çekiş); nişan: çapadan (yoksa bırakıştan 1,5 sn önceden) bırakışa oynama
        const d = iskVeri(klip, a.id), an = klip.anlar || {}; if (!d || an.birakis == null) return null;
        const ofs = a.ofset || 0, o = { b: olc(iskKare(d, an.birakis - ofs - 100), d) };
        const bas = an.capa != null && an.capa < an.birakis ? an.capa : an.birakis - 1500, dl = [], bl = []; let omuzG = null;
        for (let t = bas; t <= an.birakis - 100; t += 1000 / ISK_FPS) { const m = olc(iskKare(d, t - ofs), d); if (!m) continue; if (m.dirsek != null) dl.push(m.dirsek); if (m.burun) bl.push(m.burun); if (m.omuzG && !omuzG) omuzG = m.omuzG; }
        if (dl.length >= 3) o.dirsekOyna = Math.round((Math.max.apply(null, dl) - Math.min.apply(null, dl)) / 2);
        if (bl.length >= 3 && omuzG) { const mx = bl.reduce((s, p) => s + p[0], 0) / bl.length, my = bl.reduce((s, p) => s + p[1], 0) / bl.length; o.basOyna = Math.round(Math.max.apply(null, bl.map((p) => Math.hypot(p[0] - mx, p[1] - my))) / omuzG * 100); }
        return o;
    }
    const hizaYazi = (h) => (Math.abs(h) <= 1 ? 'düz' : Math.abs(h) + '° ' + (h > 0 ? 'aşağı' : 'yukarı'));
    function olcumMaddeleri(o) {
        if (!o) return []; const l = [];
        if (o.dirsek != null) l.push(['Çekiş dirseği', o.dirsek + '°']);
        if (o.hiza != null) l.push(['Dirsek hizası', hizaYazi(o.hiza)]);
        if (o.yay != null) l.push(['Yay kolu', o.yay + '°']);
        if (o.omuz != null) l.push(['Omuz eğimi', o.omuz + '°']);
        if (o.govde != null) l.push(['Gövde eğimi', o.govde + '°']);
        return l;
    }
    function iskeletKareCiz(x, k, w, h, olcek, ayna) {
        const d = iskVeri(k.klip, k.aci.id); if (!d) return;
        const pts = iskKare(d, yerel(k)); if (!pts) return;
        const P = (j) => [pts[j][0] * w, pts[j][1] * h], ok = (j) => pts[j][2] >= GOR, renk = kareRengi(k);
        x.save(); x.lineCap = 'round'; x.lineJoin = 'round'; x.shadowColor = 'rgba(0,0,0,.85)'; x.shadowBlur = 4 * olcek;
        x.strokeStyle = renk; x.lineWidth = 4 * olcek;
        KEMIK.forEach(([a, b]) => { if (!ok(a) || !ok(b)) return; x.beginPath(); x.moveTo(P(a)[0], P(a)[1]); x.lineTo(P(b)[0], P(b)[1]); x.stroke(); });
        x.fillStyle = '#fff'; for (let j = 1; j < 13; j++) if (ok(j)) { const q = P(j); x.beginPath(); x.arc(q[0], q[1], 4 * olcek, 0, 7); x.fill(); }
        if (ok(0)) { const q = P(0); x.beginPath(); x.arc(q[0], q[1], 7 * olcek, 0, 7); x.lineWidth = 3 * olcek; x.stroke(); }
        if (!hayaletMi() || klipSira(k) === 0) { // açı yazıları: üst üste görünümde yalnız ilk atışta (kalabalık olmasın)
            const o = olc(pts, d), c = o.yon === 'S' ? [1, 3, 5] : [2, 4, 6], y = o.yon === 'S' ? [2, 4, 6] : [1, 3, 5];
            const etiket = (j, t, dx, dy) => { if (!ok(j)) return; const q = P(j); x.shadowBlur = 0; x.font = '900 ' + Math.round(15 * olcek) + 'px system-ui,sans-serif'; const tw = x.measureText(t).width; x.save(); x.translate(q[0], q[1]); if (ayna) x.scale(-1, 1); x.fillStyle = 'rgba(0,0,0,.78)'; x.fillRect(dx * olcek, dy * olcek, tw + 12 * olcek, 22 * olcek); x.fillStyle = '#fde68a'; x.fillText(t, (dx + 6) * olcek, (dy + 16) * olcek); x.restore(); };
            if (o.omuz != null && ok(1) && ok(2)) { const a = P(1), b = P(2), dx = b[0] - a[0], dy = b[1] - a[1]; x.setLineDash([8 * olcek, 6 * olcek]); x.strokeStyle = 'rgba(253,230,138,.85)'; x.lineWidth = 2 * olcek; x.shadowBlur = 0; x.beginPath(); x.moveTo(a[0] - dx * 0.5, a[1] - dy * 0.5); x.lineTo(b[0] + dx * 0.5, b[1] + dy * 0.5); x.stroke(); x.setLineDash([]); }
            if (o.dirsek != null) etiket(c[1], o.dirsek + '°', 8, -30);
            if (o.yay != null) etiket(y[1], o.yay + '°', 8, 6);
        }
        x.restore();
    }
    function iskeletleriCiz() {
        _ca.kareler.forEach((k) => {
            if (!k.el || !k.ik) return; const t = Math.round(yerel(k)); if (k.ikSon === t) return; k.ikSon = t;
            const x = k.ik.getContext('2d'), w = k.ik.width, h = k.ik.height; x.clearRect(0, 0, w, h);
            iskeletKareCiz(x, k, w, h, w / Math.max(1, parseFloat(k.ik.style.width) || w), aynaMi(k));
        });
    }
    function iskeletTemizle() { _ca.kareler.forEach((k) => { if (k.ik) { k.ik.getContext('2d').clearRect(0, 0, k.ik.width, k.ik.height); k.ikSon = null; } }); }
    window.caIskelet = async function () {
        if (!_ca || _ca.mod !== 'oynat' || _ca.iskIsliyor) return;
        if (_ca.iskelet) { _ca.iskelet = false; iskeletTemizle(); izgaraKur(); ustCiz(); altCiz(); if (_ca.panel) panelCiz(); return; }
        const eksik = gorunenler().filter((k) => !iskVeri(k.klip, k.aci.id));
        if (eksik.length && !(await iskeletleriCikar(eksik))) return;
        if (!_ca || _ca.mod !== 'oynat') return;
        _ca.iskelet = true; izgaraKur(); ustCiz(); altCiz(); if (_ca.panel) panelCiz();
    };
    async function iskeletleriCikar(l) {
        const el = kok(), m = document.createElement('div'); m.className = 'ca-modal'; m.id = 'ca-isk-m';
        m.innerHTML = '<div><h3>🦴 İskelet çıkarılıyor…</h3><p class="ca-dolu" id="ca-isk-y">Yapay zekâ hazırlanıyor (ilk seferde ~10 MB iner).</p><div class="ca-ilerle"><i id="ca-isk-il"></i></div><p class="ca-dolu">Her açıda bir kez yapılır, kayda yazılır.</p><div class="ca-sat"><button type="button" class="ca-b" id="ca-isk-iptal">Vazgeç</button></div></div>';
        el.appendChild(m); let iptal = false; $('ca-isk-iptal').onclick = () => { iptal = true; };
        const durum = _ca; _ca.iskIsliyor = true;
        try {
            await pozHazir();
            for (let i = 0; i < l.length; i++) {
                const k = l[i], y = $('ca-isk-y'); if (y) y.textContent = (l.length > 1 ? (i + 1) + '/' + l.length + ' · ' : '') + (_ca.seri ? klipBaslik(k.klip, klipSira(k)) + ' · ' : '') + (k.aci.ad || ACILAR[k.aci.id] || '');
                const an = k.klip.anlar || {}, ofs = k.aci.ofset || 0;
                const ar = an.birakis != null ? [an.birakis - ofs - 6000, an.birakis - ofs + 2000] : [0, 30000]; // bırakış biliniyorsa yalnız atışın çevresi
                const d = await iskeletCikar(k, ar, (o) => { const il = $('ca-isk-il'); if (il) il.style.width = ((i + o) / l.length * 100) + '%'; }, () => iptal || _ca !== durum);
                if (!d) return false;
                k.klip.iskelet = k.klip.iskelet || {}; k.klip.iskelet[k.aci.id] = d; try { await klipYaz(k.klip); } catch (e) { }
                if (!d.k.some(Boolean)) tost((k.aci.ad || ACILAR[k.aci.id] || 'Bu açı') + ': görüntüde kimse bulunamadı.', 'warning');
            }
            return true;
        } catch (e) { tost(navigator.onLine === false ? 'İskelet için bir kez internet gerekli (yapay zekâ modeli iner).' : 'Yapay zekâ açılamadı: ' + ((e && e.message) || e), 'error'); return false; }
        finally { if (durum) durum.iskIsliyor = false; m.remove(); }
    }
    // alt satır: şimdi + bırakıştan önce + nişanda oynama (tek kayıtta)
    window.caOlcAci = () => { const g = gorunenler().filter((k) => iskVeri(k.klip, k.aci.id)); if (g.length < 2) return; const i = g.findIndex((k) => k.aci.id === _ca.olcAci); _ca.olcAci = g[(i + 1) % g.length].aci.id; _ca.olcSon = null; olcumSatirYaz(); };
    function olcumSatirYaz() {
        const el = $('ca-olc'); if (!el) return;
        const g = gorunenler().filter((k) => iskVeri(k.klip, k.aci.id)); let h;
        if (!g.length) h = '<span>🦴 Bu açıda iskelet yok</span>';
        else {
            const k = g.find((x) => x.aci.id === _ca.olcAci && x.klip === _ca.klip) || g[0], d = iskVeri(k.klip, k.aci.id), simdi = olcumMaddeleri(olc(iskKare(d, yerel(k)), d)), cok = _ca.seri || _ca.karsi;
            h = '<i>🦴 ' + esc(cok ? klipBaslik(k.klip, klipSira(k)) : (k.aci.ad || ACILAR[k.aci.id])) + (g.length > 1 && !cok ? ' <button type="button" class="ca-b" style="min-height:28px;padding:2px 9px" onclick="caOlcAci()" title="Başka açının ölçümü">⇄</button>' : '') + ' · şimdi</i>'
                + (simdi.length ? simdi.map(([a, v]) => '<span>' + a + ' <b>' + v + '</b></span>').join('') : '<span>kimse görünmüyor</span>');
            if (!cok) {
                const o = klipOlcum(k.klip, k.aci), l = o ? olcumMaddeleri(o.b) : [];
                if (l.length) h += '<i>💥 bırakıştan önce</i>' + l.map(([a, v]) => '<span>' + a + ' <b>' + v + '</b></span>').join('');
                if (o && (o.dirsekOyna != null || o.basOyna != null)) h += '<i>🎯 nişanda oynama</i>' + (o.dirsekOyna != null ? '<span>Dirsek <b>±' + o.dirsekOyna + '°</b></span>' : '') + (o.basOyna != null ? '<span>Baş <b>%' + o.basOyna + '</b></span>' : '');
                if (!o) h += '<i>💥 Bırakışı işaretleyince bırakış anı ve nişan ölçülür</i>';
            }
        }
        if (_ca.olcSon !== h) { _ca.olcSon = h; el.innerHTML = h; }
    }
    function lejantHTML() {
        const klipler = _ca.seri || [_ca.klip, _ca.karsi], eksik = [], oto = klipler.filter((kl) => kl.anlar && kl.anlar.birakisOto).length;
        klipler.forEach((kl, i) => { if (!(kl.anlar && kl.anlar.birakis != null)) eksik.push(i); });
        return '<div class="ca-lej">' + klipler.map((kl, i) => '<span style="--r:' + (_ca.seri ? SERI_RENK[i % SERI_RENK.length] : KAR_RENK[i]) + '"><i></i>' + esc(klipBaslik(kl, i)) + '</span>').join('') + '</div>'
            + '<span class="ca-dolu">' + (eksik.length ? '⚠️ ' + eksik.map((i) => (_ca.seri ? (i + 1) + '. atışta' : (i ? '②' : '①') + ' kayıtta')).join(', ') + ' bırakış bulunamadı: <b>⏱ Hizala</b> ile elle kaydır ya da o kayıtta 💥 Bırakış işaretle.'
                : 'Atışlar <b>💥 bırakış</b> anına göre hizalı' + (oto ? ' (' + oto + ' tanesi ipin sesinden bulundu)' : '') + '.') + '</span>';
    }
    // 📏 ölçüm paneli (karşılaştırma + seri)
    const OLC_KOL = [['dirsek', 'Çekiş dirseği', 8], ['hiza', 'Dirsek hizası', 5], ['yay', 'Yay kolu', 6], ['omuz', 'Omuz eğimi', 4], ['govde', 'Gövde', 4]];
    function farkCumle(kol, f) {
        const m = Math.abs(f);
        if (kol === 'hiza') return 'dirsek ' + m + '° daha ' + (f > 0 ? 'aşağıda' : 'yukarıda');
        if (kol === 'dirsek') return 'çekiş dirseği ' + m + '° daha ' + (f > 0 ? 'açık' : 'kapalı');
        if (kol === 'yay') return 'yay kolu ' + m + '° daha ' + (f > 0 ? 'düz' : 'bükük');
        if (kol === 'omuz') return 'omuz ' + m + '° daha ' + (f > 0 ? 'eğik' : 'düz');
        return 'gövde ' + m + '° daha ' + (f > 0 ? 'eğik' : 'dik');
    }
    function seriOlcumleri() {
        const klipler = _ca.seri || [_ca.klip, _ca.karsi];
        return klipler.map((kl, i) => { const k = _ca.kareler.find((x) => x.klip === kl), o = k ? klipOlcum(kl, k.aci) : null, an = kl.anlar || {}; return { kl, i, o: o && o.b, var: !!(k && iskVeri(kl, k.aci.id)), nisan: an.capa != null && an.birakis != null && an.birakis > an.capa ? an.birakis - an.capa : null }; });
    }
    const ortanca = (l) => { const s = l.slice().sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
    function seriOzet(r) { // ortancadan eşiğin üstünde sapan atışlar (her atış için en belirgin sapma)
        const med = {}, kacan = [];
        OLC_KOL.forEach(([id]) => { const l = r.filter((x) => x.o && x.o[id] != null).map((x) => x.o[id]); if (l.length >= 2) med[id] = ortanca(l); });
        if (r.length >= 3) r.forEach((x) => { if (!x.o) return; let en = null; OLC_KOL.forEach(([id, , esik]) => { if (med[id] == null || x.o[id] == null) return; const f = Math.round(x.o[id] - med[id]); if (Math.abs(f) > esik && (!en || Math.abs(f) / esik > Math.abs(en.fark) / en.esik)) en = { i: x.i, kol: id, fark: f, esik }; }); if (en) kacan.push(en); });
        return { med, kacan };
    }
    const hucre = (id, v) => (v == null ? '–' : id === 'hiza' ? (Math.abs(v) <= 1 ? '0°' : Math.abs(Math.round(v)) + '° ' + (v > 0 ? '↓' : '↑')) : Math.round(v) + '°');
    function olcumPanelCiz() {
        const p = $('ca-panel'); if (!p || !_ca.panel) return;
        const r = seriOlcumleri(), seri = !!_ca.seri, varMi = r.some((x) => x.var), renk = (i) => (seri ? SERI_RENK[i % SERI_RENK.length] : KAR_RENK[i]);
        const ad = (x) => '<td><i style="--r:' + renk(x.i) + '"></i>' + esc(klipBaslik(x.kl, x.i)) + '</td>';
        let h = '<h2>📏 Ölçümler</h2><p>' + (seri ? 'Her atışta bırakıştan hemen önceki açılar. Ortancadan çok uzaklaşan değer kırmızı.' : 'İki atışta bırakıştan hemen önceki açılar ve aradaki fark.') + ' Açılar kameraya göre ölçülür: aynı açıdan çekilmiş atışları kıyasla.</p>';
        if (!varMi) h += '<div class="ca-ozet">🦴 Önce iskeleti çıkar: yapay zekâ her atışta kolları ve omuzları bulur, açıları ölçer.<div style="margin-top:8px"><button type="button" class="ca-b ana" onclick="caIskelet()">🦴 İskeletleri çıkar</button></div></div>';
        else {
            const kolon = OLC_KOL.filter(([id]) => r.some((x) => x.o && x.o[id] != null)), nisanVar = r.some((x) => x.nisan != null);
            const bas = '<table class="ca-tablo"><tr><th></th>' + kolon.map(([, a]) => '<th>' + a + '</th>').join('') + (nisanVar ? '<th>Nişan</th>' : '') + '</tr>';
            if (seri) {
                const oz = seriOzet(r), kac = {}; oz.kacan.forEach((k) => { kac[k.i + '|' + k.kol] = 1; });
                const yakin = r.filter((x) => x.o && !oz.kacan.some((k) => k.i === x.i)).length;
                h += '<div class="ca-ozet">' + r.length + ' atış · <span class="iyi">' + yakin + ' tanesi birbirine yakın</span>'
                    + (oz.kacan.length ? oz.kacan.map((k) => '<br><span class="kac">' + (k.i + 1) + '. atış kaçtı: ' + farkCumle(k.kol, k.fark) + '</span>' + (r[k.i].kl.puan ? ' · ' + esc(r[k.i].kl.puan) + ' puan' : '')).join('') : (r.length >= 3 ? '<br>Sapan atış yok: form tutarlı.' : '<br>Sapan atışı bulmak için en az 3 atış seç.')) + '</div>'
                    + bas + r.map((x) => '<tr>' + ad(x) + kolon.map(([id]) => '<td class="' + (kac[x.i + '|' + id] ? 'kac' : '') + '">' + hucre(id, x.o && x.o[id]) + '</td>').join('') + (nisanVar ? '<td>' + (x.nisan != null ? sn1(x.nisan) + ' sn' : '–') + '</td>' : '') + '</tr>').join('')
                    + '<tr class="med"><td>Ortanca</td>' + kolon.map(([id]) => '<td>' + hucre(id, oz.med[id]) + '</td>').join('') + (nisanVar ? '<td></td>' : '') + '</tr></table>';
            } else {
                const A = r[0], B = r[1]; let en = null;
                if (A.o && B.o) OLC_KOL.forEach(([id, , esik]) => { if (A.o[id] == null || B.o[id] == null) return; const f = Math.round(B.o[id] - A.o[id]); if (Math.abs(f) >= Math.max(2, esik / 2) && (!en || Math.abs(f) / esik > Math.abs(en.f) / en.esik)) en = { id, f, esik }; });
                h += '<div class="ca-ozet">' + (en ? 'En büyük fark: <b>' + esc(klipBaslik(B.kl, 1)) + '</b> atışında <span class="kac">' + farkCumle(en.id, en.f) + '</span>.' : A.o && B.o ? '<span class="iyi">İki atışta açılar birbirine yakın.</span>' : 'Bir kayıtta bırakış anında kimse bulunamadı ya da bırakış işaretli değil.') + '</div>'
                    + bas + [A, B].map((x) => '<tr>' + ad(x) + kolon.map(([id]) => '<td>' + hucre(id, x.o && x.o[id]) + '</td>').join('') + (nisanVar ? '<td>' + (x.nisan != null ? sn1(x.nisan) + ' sn' : '–') + '</td>' : '') + '</tr>').join('')
                    + '<tr class="med"><td>Fark (② − ①)</td>' + kolon.map(([id]) => { const f = A.o && B.o && A.o[id] != null && B.o[id] != null ? Math.round(B.o[id] - A.o[id]) : null; return '<td class="' + (en && en.id === id ? 'kac' : '') + '">' + (f == null ? '–' : (f > 0 ? '+' : '') + f + '°') + '</td>'; }).join('') + (nisanVar ? '<td></td>' : '') + '</tr></table>';
            }
            if (!_ca.iskelet) h += '<p><button type="button" class="ca-b" onclick="caIskelet()">🦴 İskeleti ekranda göster</button></p>';
        }
        const yok = r.filter((x) => !(x.kl.anlar && x.kl.anlar.birakis != null));
        if (yok.length) h += '<p>⚠️ ' + yok.map((x) => esc(klipBaslik(x.kl, x.i))).join(', ') + ': bırakış yok. Kaydı tek başına açıp 💥 Bırakış\'ı işaretle.</p>';
        p.innerHTML = h;
    }

    /* ------------------------------------------------------------ 📱 telefonla tek açı çekim (v427) */
    const CEK_EN_UZUN = 60000;
    function kayitTuru() { const l = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4;codecs=avc1', 'video/mp4']; return l.find((t) => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || ''; }
    function kameraKapat(c) { if (!c) return; clearInterval(c.z); try { if (c.rec && c.rec.state !== 'inactive') c.rec.stop(); } catch (e) { } if (c.akis) c.akis.getTracks().forEach((t) => { try { t.stop(); } catch (e) { } }); c.akis = null; try { if (c.kilit) c.kilit.release(); } catch (e) { } c.kilit = null; }
    function kareResmi(v) { try { const c = document.createElement('canvas'), w = 360; c.width = w; c.height = Math.round(w * (v.videoHeight || 720) / (v.videoWidth || 1280)); c.getContext('2d').drawImage(v, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.6); } catch (e) { return ''; } }
    window.caCek = async function () {
        css(); const el = kok(); kapatOynatici(); _ca = _ca || {};
        let son = ''; try { son = localStorage.getItem('dagsk_cokaci_son_sporcu') || ''; } catch (e) { }
        const fv = _ca.filtre || son, i = fv.indexOf('|'), sp = fv && i > 0 ? { g: fv.slice(0, i), ad: fv.slice(i + 1) } : null;
        let aci = 'yan'; try { aci = localStorage.getItem('dagsk_cokaci_tel_aci') || 'yan'; } catch (e) { }
        const c = { yon: 'environment', say: 0 }; _ca.mod = 'cek'; _ca.cek = c;
        el.innerHTML = '<div class="ca-cek" id="ca-cek"><video id="ca-cek-v" muted playsinline autoplay></video>'
            + '<div class="ca-cek-ust"><button type="button" class="ca-b" onclick="caListe()">← Kayıtlar</button>' + sporcuSecHTML('ca-cek-sp', sp)
            + '<select id="ca-cek-aci" aria-label="Açı">' + ['on', 'yan', 'arka', 'hedef'].map((a) => '<option value="' + a + '"' + (a === aci ? ' selected' : '') + '>' + ACILAR[a] + '</option>').join('') + '</select>'
            + '<button type="button" class="ca-b" onclick="caCekCevir()" aria-label="Kamerayı çevir" title="Ön / arka kamera">🔄</button><button type="button" class="ca-b" onclick="caKapat()" aria-label="Kapat">✕</button></div>'
            + '<div class="ca-cek-alt"><span class="ca-cek-sure" id="ca-cek-sure">Kamera açılıyor…</span><button type="button" class="ca-cek-dug" id="ca-cek-dug" onclick="caCekDugme()" aria-label="Kaydı başlat"><i></i></button><span class="ca-cek-son" id="ca-cek-son">Atışı çek, bitince durdur:<br><small>puana dokununca kaydedilir</small></span></div>'
            + '<div class="ca-cek-puan" id="ca-cek-puan" hidden></div></div>';
        await kameraAc(c);
        try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then((k) => { if (_ca && _ca.cek === c) c.kilit = k; else k.release(); }).catch(() => { }); } catch (e) { }
    };
    async function kameraAc(c) {
        if (!_ca || _ca.cek !== c) return; if (c.akis) { c.akis.getTracks().forEach((t) => { try { t.stop(); } catch (e) { } }); c.akis = null; }
        const yaz = (t) => { const s = $('ca-cek-sure'); if (s) s.textContent = t; };
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { yaz('Bu tarayıcı video çekemiyor'); return; }
        const v = { facingMode: { ideal: c.yon }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } };
        let akis = null;
        try { akis = await navigator.mediaDevices.getUserMedia({ video: v, audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); } // ses: bırakış anı ipin sesinden bulunur
        catch (e) { try { akis = await navigator.mediaDevices.getUserMedia({ video: v }); } catch (e2) { yaz('Kameraya izin verilmedi'); tost('Kamera açılamadı: tarayıcı ayarlarından kameraya izin ver.', 'error'); return; } }
        if (!_ca || _ca.cek !== c) { akis.getTracks().forEach((t) => t.stop()); return; }
        c.akis = akis; const ve = $('ca-cek-v'); ve.srcObject = akis; ve.play().catch(() => { }); ve.style.transform = c.yon === 'user' ? 'scaleX(-1)' : '';
        yaz('Hazır');
    }
    window.caCekCevir = () => { const c = _ca && _ca.cek; if (!c || c.rec) return; c.yon = c.yon === 'user' ? 'environment' : 'user'; kameraAc(c); };
    window.caCekDugme = function () {
        const c = _ca && _ca.cek; if (!c || !c.akis || c.bekleyen) return;
        if (c.rec) return cekDurdur(c);
        const tur = kayitTuru(); let rec;
        try { rec = new MediaRecorder(c.akis, tur ? { mimeType: tur, videoBitsPerSecond: 5e6 } : undefined); } catch (e) { try { rec = new MediaRecorder(c.akis); } catch (e2) { return tost('Bu cihaz video kaydedemiyor.', 'error'); } }
        c.parca = []; c.rec = rec; c.tur = rec.mimeType || tur || 'video/webm';
        rec.ondataavailable = (e) => { if (e.data && e.data.size) c.parca.push(e.data); };
        c.bitti = new Promise((ok) => { rec.onstop = ok; });
        c.bas = performance.now(); rec.onstart = () => { c.bas = performance.now(); };
        rec.start(500);
        const d = $('ca-cek-dug'), s = $('ca-cek-sure'); d.classList.add('surer'); d.setAttribute('aria-label', 'Kaydı durdur'); s.classList.add('surer');
        c.z = setInterval(() => { const ms = performance.now() - c.bas, x = $('ca-cek-sure'); if (x) x.textContent = '● ' + sureYaz(ms); if (ms > CEK_EN_UZUN) cekDurdur(c); }, 200);
    };
    async function cekDurdur(c) {
        if (!c.rec) return; clearInterval(c.z); const sure = performance.now() - c.bas, kucuk = kareResmi($('ca-cek-v'));
        try { c.rec.stop(); } catch (e) { } await Promise.race([c.bitti, new Promise((ok) => setTimeout(ok, 4000))]);
        const blob = new Blob(c.parca, { type: c.tur.split(';')[0] }); c.rec = null; c.parca = [];
        const d = $('ca-cek-dug'), s = $('ca-cek-sure'); if (d) { d.classList.remove('surer'); d.setAttribute('aria-label', 'Kaydı başlat'); } if (s) { s.classList.remove('surer'); s.textContent = 'Hazır'; }
        if (!blob.size) return tost('Kayıtta görüntü yok.', 'warning');
        c.bekleyen = { blob, sure: Math.round(sure), kucuk, mime: c.tur };
        const sp = sporcuOku('ca-cek-sp'), el = $('ca-cek-puan'); el.hidden = false;
        el.innerHTML = '<h3>' + (sp ? esc(ilkAd(sp.ad)) + ' · ' : '') + 'Kaç puan?</h3><p>Puana dokununca kaydedilir, kamera bir sonraki atışa hazır olur.</p>'
            + '<div class="ca-puanlar">' + PUANLAR.map((p) => '<button type="button" style="background:' + puanRenk(p) + ';color:' + puanYazi(p) + '" onclick="caCekKaydet(\'' + p + '\')">' + p + '</button>').join('') + '</div>'
            + '<div class="ca-sat"><button type="button" class="ca-b kirmizi" onclick="caCekSil()">🗑 Sil</button><button type="button" class="ca-b" onclick="caCekKaydet(\'\')">Puansız kaydet</button><button type="button" class="ca-b ana" onclick="caCekKaydet(\'\',true)">▶︎ Kaydet ve incele</button></div>';
    }
    window.caCekSil = () => { const c = _ca && _ca.cek; if (c) c.bekleyen = null; const el = $('ca-cek-puan'); if (el) el.hidden = true; };
    window.caCekKaydet = async function (p, ac) {
        const c = _ca && _ca.cek, b = c && c.bekleyen; if (!b) return; c.bekleyen = null; $('ca-cek-puan').hidden = true;
        const sp = sporcuOku('ca-cek-sp'), aci = ($('ca-cek-aci') || {}).value || 'yan';
        try { localStorage.setItem('dagsk_cokaci_son_sporcu', sp ? sp.g + '|' + sp.ad : ''); localStorage.setItem('dagsk_cokaci_tel_aci', aci); } catch (e) { }
        let sira = 1; try { sira = 1 + (await klipListe()).filter((k) => k.tarih === bugun() && k.sporcu && sp && k.sporcu.g === sp.g && k.sporcu.ad === sp.ad).length; } catch (e) { }
        let id; try { id = await window.caKlipKaydet({ sporcu: sp, sure: b.sure, acilar: [{ id: aci, ad: ACILAR[aci], ofset: 0 }], kucuk: b.kucuk, kaynak: 'telefon', puan: p || null, ad: sira + '. atış' }, { [aci]: { tip: 'video', blob: b.blob, mime: b.mime } }); }
        catch (e) { return tost('Kaydedilemedi: cihazda yer kalmamış olabilir.', 'error'); }
        c.say++; const s = $('ca-cek-son'); if (s) s.innerHTML = '✓ ' + (sp ? esc(ilkAd(sp.ad)) + ' · ' : '') + sira + '. atış ' + puanRozet(p) + '<br><small>Bu çekimde ' + c.say + ' kayıt</small>';
        tost('💾 Kaydedildi' + (p ? ' · ' + p : ''), 'success');
        if (ac) return window.caOynat(id);
        klipOku(id).then((k) => k && birakisHazirla(k)).catch(() => { }); // ipin sesinden bırakış (arka planda)
    };

    // klavye: boşluk oynat, ←/→ kare, Shift ile 10 kare
    document.addEventListener('keydown', (e) => {
        if (!_ca || _ca.mod !== 'oynat' || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
        if (e.key === ' ') { e.preventDefault(); window.caOynatDurdur(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); window.caAdim(e.shiftKey ? 10 : 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); window.caAdim(e.shiftKey ? -10 : -1); }
        else if (e.key === 'Escape' && !$('ca-modal')) window.caListe();
    });
    window._caIc = { klipListe, klipOku, klipSil, klipYaz, aciDerece, durum: () => _ca, sesBirakis, birakisHazirla, iskKare, olc, klipOlcum, olcumMaddeleri, seriOlcumleri, seriOzet, pozHazir, iskeletCikar };
})();
