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

    /* ------------------------------------------------------------ depolama (IndexedDB, bu cihaz) */
    let _idbP = null;
    function idb() {
        return _idbP || (_idbP = new Promise((ok, no) => {
            const r = indexedDB.open('dagsk-cokaci', 1);
            r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains('klip')) d.createObjectStore('klip', { keyPath: 'id' }); if (!d.objectStoreNames.contains('veri')) d.createObjectStore('veri'); };
            r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
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
        const kar = _ca.karsiSec;
        el.innerHTML = '<div class="ca-ust"><h1>🎬 Kayıtlar & Analiz <small>' + l.length + ' kayıt</small></h1>'
            + (kar ? '<span class="ca-b on">⚖️ Karşılaştırılacak ikinci kaydı seç</span><button type="button" class="ca-b" onclick="caKarsiIptal()">Vazgeç</button>' : '')
            + '<label class="ca-b" style="display:inline-flex;align-items:center;gap:6px">📁 Videolardan yeni kayıt<input type="file" accept="video/*" multiple hidden onchange="caDosyadan(this)"></label>'
            + '<button type="button" class="ca-b" onclick="caKapat()" aria-label="Kapat">✕</button></div>'
            + '<div class="ca-liste"><div class="ca-l-bas"><select onchange="caFiltre(this.value)" aria-label="Sporcuya göre"><option value="">Bütün sporcular</option>' + sporcular.map((s) => '<option value="' + esc(s.g + '|' + s.ad) + '"' + (f === s.g + '|' + s.ad ? ' selected' : '') + '>' + esc(s.ad) + '</option>').join('') + '</select><span class="ca-dolu">' + esc(dolu) + '</span></div>'
            + (gor.length ? '<div class="ca-kartlar">' + gor.map(kartHTML).join('') + '</div>'
                : '<div class="ca-bos">Henüz kayıt yok.<br>Çok Açılı Kamera\'da telefonlar bağlıyken <b>⏺ Kaydet</b>\'e bas ya da <b>📌 Son 12 sn\'yi sakla</b>.<br>Telefonla çekilmiş videoların varsa yukarıdaki <b>📁 Videolardan yeni kayıt</b> ile açıları birleştir.</div>')
            + '</div>';
    }
    function kartHTML(k) {
        const kar = _ca.karsiSec;
        return '<div class="ca-kart' + (kar === k.id ? ' sec' : '') + '"><button type="button" class="ca-kart-resim" style="background-image:url(' + (k.kucuk || '') + ')" onclick="' + (kar && kar !== k.id ? 'caKarsilastir(\'' + kar + '\',\'' + k.id + '\')' : 'caOynat(\'' + k.id + '\')') + '" aria-label="Aç"><span>' + sn1(k.sure) + ' sn · ' + k.acilar.length + ' açı</span></button>'
            + '<div class="ca-kart-ic"><b>' + esc(k.sporcu ? k.sporcu.ad : 'Sporcu seçilmedi') + '</b><small>' + esc(k.tarih) + (k.ad ? ' · ' + esc(k.ad) : '') + (k.analiz ? ' · ✅ analiz kaydedildi' : '') + (k.anlar && k.anlar.birakis != null ? ' · 💥 bırakış işaretli' : '') + '</small>'
            + '<div class="ca-kart-alt">' + (kar ? (kar === k.id ? '<span class="ca-dolu">1. kayıt</span>' : '<button type="button" class="ca-b ana" onclick="caKarsilastir(\'' + kar + '\',\'' + k.id + '\')">⚖️ Bununla karşılaştır</button>')
                : '<button type="button" class="ca-b ana" onclick="caOynat(\'' + k.id + '\')">▶︎ Analiz et</button><button type="button" class="ca-b" onclick="caKarsiBasla(\'' + k.id + '\')">⚖️ Karşılaştır</button><button type="button" class="ca-b" onclick="caBilgi(\'' + k.id + '\')">✏️</button><button type="button" class="ca-b kirmizi" onclick="caSil(\'' + k.id + '\')" aria-label="Sil">🗑</button>')
            + '</div></div></div>';
    }
    window.caFiltre = (v) => listeCiz(v);
    window.caKarsiBasla = (id) => { _ca.karsiSec = id; listeCiz(); };
    window.caKarsiIptal = () => { _ca.karsiSec = null; listeCiz(); };
    window.caSil = function (id) {
        const f = async () => { await klipSil(id); tost('Kayıt silindi.', 'success'); listeCiz(); };
        if (typeof onayIste === 'function') onayIste('Bu kayıt bu cihazdan silinsin mi?<br><small>Kaydedilmiş analiz karnesi silinmez.</small>', f, 'Sil', 'Vazgeç'); else f();
    };
    window.caBilgi = async function (id) {
        const k = await klipOku(id); if (!k) return; const el = kok();
        const m = document.createElement('div'); m.className = 'ca-modal'; m.id = 'ca-modal';
        m.innerHTML = '<div><h3>✏️ Kayıt bilgisi</h3><label>Sporcu' + sporcuSecHTML('ca-b-sp', k.sporcu) + '</label><label>Not / başlık<input id="ca-b-ad" value="' + esc(k.ad || '') + '" placeholder="ör. 18 m, 3. seri"></label>'
            + '<div class="ca-sat"><button type="button" class="ca-b" onclick="document.getElementById(\'ca-modal\').remove()">Vazgeç</button><button type="button" class="ca-b ana" id="ca-b-tamam">Kaydet</button></div></div>';
        el.appendChild(m);
        $('ca-b-tamam').onclick = async () => { k.sporcu = sporcuOku('ca-b-sp'); k.ad = $('ca-b-ad').value.trim(); await klipYaz(k); m.remove(); if (_ca && _ca.mod === 'oynat' && _ca.klip && _ca.klip.id === id) { _ca.klip = k; ustCiz(); } else listeCiz(); };
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
        (_ca.kareler || []).forEach((k) => kaynakKapat(k.src)); _ca.kareler = [];
        if (_ca.ro) { try { _ca.ro.disconnect(); } catch (e) { } _ca.ro = null; }
        clearTimeout(_ca.yazZ);
    }
    window.caOynat = async function (id, karsiId, karAci) {
        css(); const el = kok(); kapatOynatici(); _ca = _ca || {};
        const klip = await klipOku(id); if (!klip) return tost('Kayıt bulunamadı.', 'error');
        const karsi = karsiId ? await klipOku(karsiId) : null;
        Object.assign(_ca, { mod: 'oynat', klip, karsi, kareler: [], T: 0, oynuyor: false, hiz: 0.5, duzen: karsi ? 'kar' : (klip.acilar.length > 1 ? '4' : '1'), secili: null, arac: null, hizala: false, panel: null, dongu: false, karsiSec: null, karAci: karAci || (klip.acilar[0] && klip.acilar[0].id) });
        el.innerHTML = '<div class="ca-ust" id="ca-ust"></div><div class="ca-orta"><div class="ca-izgara" id="ca-izgara"><div class="ca-yok">Açılıyor…</div></div><aside class="ca-panel" id="ca-panel" hidden></aside></div><div class="ca-alt" id="ca-alt"></div>';
        // kaynaklar
        const ekle = async (k, a, kaydirma) => { try { const s = await kaynakAc(k, a); if (s) _ca.kareler.push({ klip: k, aci: a, src: s, kaydirma: kaydirma || 0 }); } catch (e) { } };
        if (karsi) {
            const aA = klip.acilar.find((a) => a.id === _ca.karAci) || klip.acilar[0], aB = karsi.acilar.find((a) => a.id === (aA && aA.id)) || karsi.acilar[0];
            const bA = klip.anlar && klip.anlar.birakis != null ? klip.anlar.birakis : 0, bB = karsi.anlar && karsi.anlar.birakis != null ? karsi.anlar.birakis : 0;
            await ekle(klip, aA, 0); await ekle(karsi, aB, bA - bB);
        } else for (const a of klip.acilar) await ekle(klip, a, 0);
        if (!_ca.kareler.length) { $('ca-izgara').innerHTML = '<div class="ca-yok">Bu kaydın videoları bu cihazda bulunamadı.</div>'; return; }
        _ca.bas = 0; _ca.son = Math.max.apply(null, _ca.kareler.map((k) => k.src.sure + (k.aci.ofset || 0) + k.kaydirma).concat([klip.sure || 0]));
        if (klip.anlar && klip.anlar.durus != null) _ca.T = Math.max(0, klip.anlar.durus);
        if (!klip.kucuk) { klip.kucuk = await kucukResim(_ca.kareler[0].src); kaydet(); }
        izgaraKur(); ustCiz(); altCiz();
        if (window.ResizeObserver) { _ca.ro = new ResizeObserver(() => yerlestir()); _ca.ro.observe($('ca-izgara')); }
        _ca.onceki = null; _ca.raf = requestAnimationFrame(dongu);
    };
    window.caKarsilastir = (a, b) => window.caOynat(a, b);
    function kaydet() { if (!_ca || !_ca.klip) return; clearTimeout(_ca.yazZ); _ca.yazZ = setTimeout(() => { klipYaz(_ca.klip).catch(() => { }); }, 400); }
    function gorunenler() {
        const l = _ca.kareler;
        if (_ca.duzen === 'kar') return l;
        if (_ca.duzen === '1') { const s = l.find((k) => k.aci.id === _ca.secili) || l[0]; return [s]; }
        if (_ca.duzen === '2') { const s = (_ca.ikili || []).map((id) => l.find((k) => k.aci.id === id)).filter(Boolean); return s.length === 2 ? s : l.slice(0, 2); }
        return l;
    }
    function izgaraKur() {
        const iz = $('ca-izgara'), g = gorunenler(), n = g.length, hay = hayaletMi();
        iz.style.gridTemplateColumns = n === 1 || hay ? '1fr' : 'repeat(2, minmax(0,1fr))';
        iz.style.gridTemplateRows = n <= 2 ? '1fr' : 'repeat(2, minmax(0,1fr))';
        iz.innerHTML = '';
        _ca.kareler.forEach((k) => { k.el = null; });
        g.forEach((k, i) => {
            const kid = (k.klip === _ca.klip ? 'A' : 'B') + k.aci.id;
            const d = document.createElement('div'); d.className = 'ca-kare' + (_ca.arac ? ' arac' : ''); d.dataset.k = kid;
            const etiket = (_ca.duzen === 'kar' ? (k.klip === _ca.klip ? '① ' : '② ') + esc(k.klip.tarih) + ' · ' : '') + esc(k.aci.ad || ACILAR[k.aci.id] || k.aci.id);
            d.innerHTML = '<div class="ca-ic"></div><span class="ca-et" style="--r:' + (ACI_RENK[k.aci.id] || '#94a3b8') + '">' + etiket + '</span><div class="ca-ka"></div><div class="ca-hz" hidden></div>';
            const ic = d.querySelector('.ca-ic'); ic.appendChild(k.src.el);
            const cz = document.createElement('canvas'); cz.className = 'ca-cizim'; ic.appendChild(cz); k.cz = cz; k.el = d;
            if (hay) { d.style.gridArea = '1 / 1'; if (i === 1) { d.style.opacity = '.5'; d.style.pointerEvents = 'none'; d.style.background = 'transparent'; d.querySelector('.ca-et').style.top = '44px'; } }
            iz.appendChild(d); karecikCiz(k); cizimBagla(k);
        });
        yerlestir();
    }
    function karecikCiz(k) {
        const d = k.el; if (!d) return; const tek = _ca.duzen === '1', ayna = !!(_ca.klip.ayna || {})[k.aci.id];
        d.querySelector('.ca-ka').innerHTML = (_ca.kareler.length > 1 && _ca.duzen !== 'kar' ? '<button type="button" onclick="caTek(\'' + k.aci.id + '\')" aria-label="' + (tek ? 'Dörtlüye dön' : 'Büyüt') + '" title="' + (tek ? 'Dörtlüye dön' : 'Bu açıyı büyüt') + '">' + (tek ? '⤡' : '⤢') + '</button>' : '')
            + '<button type="button" onclick="caAyna(\'' + k.aci.id + '\')" aria-label="Ayna" title="Sağ-sol çevir"' + (ayna ? ' style="background:#ff7a2e"' : '') + '>⇆</button>'
            + (k.src.tip === 'video' && k.klip === _ca.klip ? '<button type="button" onclick="caFormLab(\'' + k.aci.id + '\')" aria-label="Form Lab" title="Bu açıyı Form Lab\'da iskeletle analiz et">🔬</button>' : '');
        const hz = d.querySelector('.ca-hz'); hz.hidden = !_ca.hizala;
        if (_ca.hizala) { const o = (k.aci.ofset || 0) + k.kaydirma; hz.innerHTML = '<button type="button" onclick="caKaydir(\'' + d.dataset.k + '\',-500)">−½ sn</button><button type="button" onclick="caKaydir(\'' + d.dataset.k + '\',' + (-KARE) + ')">−1 kare</button><span>' + (o >= 0 ? '+' : '−') + sn(Math.abs(o)) + '</span><button type="button" onclick="caKaydir(\'' + d.dataset.k + '\',' + KARE + ')">+1 kare</button><button type="button" onclick="caKaydir(\'' + d.dataset.k + '\',500)">+½ sn</button>'; }
    }
    const hayaletMi = () => !!(_ca && _ca.duzen === 'kar' && _ca.hayalet && _ca.kareler.length === 2);
    window.caHayalet = () => { _ca.hayalet = !_ca.hayalet; izgaraKur(); ustCiz(); };
    const kareBul = (kid) => _ca.kareler.find((k) => k.el && k.el.dataset.k === kid);
    function kutu(k) {
        const d = k.el; if (!d) return null; const W = d.clientWidth, H = d.clientHeight, s = Math.min(W / k.src.vw, H / k.src.vh), w = k.src.vw * s, h = k.src.vh * s;
        return { x: (W - w) / 2, y: (H - h) / 2, w, h };
    }
    function yerlestir() {
        if (!_ca || _ca.mod !== 'oynat') return;
        _ca.kareler.forEach((k) => {
            if (!k.el) return; const b = kutu(k); if (!b) return;
            [k.src.el, k.cz].forEach((e) => { e.style.left = b.x + 'px'; e.style.top = b.y + 'px'; e.style.width = b.w + 'px'; e.style.height = b.h + 'px'; });
            const dpr = Math.min(2, window.devicePixelRatio || 1); k.cz.width = Math.round(b.w * dpr); k.cz.height = Math.round(b.h * dpr);
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
            if (!(hayaletMi() && k === _ca.kareler[1])) k.el.style.opacity = l < -40 || l > s.sure + 40 ? '.45' : '1';
        });
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
        u.innerHTML = '<button type="button" class="ca-b" onclick="caListe()">← Kayıtlar</button>'
            + '<h1>' + esc(k.sporcu ? k.sporcu.ad : 'Sporcu seçilmedi') + '<small>' + esc(k.tarih) + (k.ad ? ' · ' + esc(k.ad) : '') + (_ca.karsi ? ' ⚖️ ' + esc(_ca.karsi.tarih) : '') + '</small></h1>'
            + (_ca.karsi ? '<div class="ca-gr" role="group" aria-label="Açı">' + _ca.klip.acilar.map((a) => '<button type="button" class="ca-b' + (_ca.karAci === a.id ? ' on' : '') + '" onclick="caKarAci(\'' + a.id + '\')">' + esc(a.ad || ACILAR[a.id]) + '</button>').join('') + '</div>'
                : (n > 1 ? '<div class="ca-gr" role="group" aria-label="Düzen"><button type="button" class="ca-b' + (_ca.duzen === '4' ? ' on' : '') + '" onclick="caDuzen(\'4\')">▦ ' + (n > 2 ? '4\'lü' : 'Hepsi') + '</button><button type="button" class="ca-b' + (_ca.duzen === '1' ? ' on' : '') + '" onclick="caDuzen(\'1\')">▢ Tek</button>' + (n > 2 ? '<button type="button" class="ca-b' + (_ca.duzen === '2' ? ' on' : '') + '" onclick="caDuzen(\'2\')">▥ Yan yana</button>' : '') + '</div>' : ''))
            + (!_ca.karsi ? '<button type="button" class="ca-b" onclick="caBilgi(\'' + k.id + '\')" title="Sporcu ve not">✏️ Sporcu</button><button type="button" class="ca-b" onclick="caKarsiBasla(\'' + k.id + '\');caListe()" title="Başka bir kayıtla yan yana">⚖️ Karşılaştır</button>' : '<button type="button" class="ca-b' + (_ca.hayalet ? ' on' : '') + '" onclick="caHayalet()" title="İki atışı aynı karede üst üste göster">👻 Üst üste</button><button type="button" class="ca-b" onclick="caOynat(\'' + k.id + '\')">Karşılaştırmadan çık</button>')
            + '<button type="button" class="ca-b" onclick="caKareKaydet()" title="Bu anı resim olarak indir">📸 Kare</button>'
            + '<button type="button" class="ca-b" onclick="caDisaAktarSor()" title="Bu düzeni çizimlerle video olarak indir">🎞️ Video indir</button>'
            + (!_ca.karsi ? '<button type="button" class="ca-b' + (_ca.panel ? ' on' : '') + '" onclick="caPanel()">📋 Tam analiz</button>' : '')
            + '<button type="button" class="ca-b" onclick="caKapat()" aria-label="Kapat">✕</button>';
    }
    function altCiz() {
        const a = $('ca-alt'); if (!a || !_ca) return; const an = _ca.klip.anlar || {};
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
            + '<div class="ca-sat">' + (_ca.karsi ? '<span class="ca-dolu">İki kayıt <b>💥 bırakış</b> anına göre hizalı. Her kayıtta bırakışı işaretlersen hizalama tam olur.</span>'
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
        kaydet(); altCiz();
    };
    window.caHizala = () => { _ca.hizala = !_ca.hizala; _ca.kareler.forEach(karecikCiz); altCiz(); };
    window.caKaydir = (kid, ms) => {
        const k = kareBul(kid); if (!k) return;
        if (k.klip === _ca.klip && _ca.duzen !== 'kar') { const a = _ca.klip.acilar.find((x) => x.id === k.aci.id); a.ofset = Math.round((a.ofset || 0) + ms); k.aci = a; kaydet(); }
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
        const hay = hayaletMi(), kol = n === 1 || hay ? 1 : 2, sat = n <= 2 ? 1 : 2, pad = Math.round(W * 0.004), tw = (W - pad * (kol + 1)) / kol, th = (H - ust - alt - pad * (sat + 1)) / sat;
        g.forEach((k, i) => {
            const j = hay ? 0 : i, cx = pad + (j % kol) * (tw + pad), cy = ust + pad + Math.floor(j / kol) * (th + pad), s = Math.min(tw / k.src.vw, th / k.src.vh), w = k.src.vw * s, h = k.src.vh * s, ox = cx + (tw - w) / 2, oy = cy + (th - h) / 2;
            if (!(hay && i === 1)) { x.fillStyle = '#000'; x.fillRect(cx, cy, tw, th); }
            x.save(); if (hay && i === 1) x.globalAlpha = 0.5; x.beginPath(); x.rect(cx, cy, tw, th); x.clip();
            const z = k.zoom || 1, zx = k.zx != null ? k.zx : 0.5, zy = k.zy != null ? k.zy : 0.5, ayna = !!(_ca.klip.ayna || {})[k.aci.id] && k.klip === _ca.klip;
            x.translate(ox + w * zx, oy + h * zy); x.scale(ayna ? -z : z, z); x.translate(-w * zx, -h * zy);
            try { x.drawImage(k.src.el, 0, 0, w, h); } catch (e) { }
            const c2 = document.createElement('canvas'); c2.width = Math.round(w); c2.height = Math.round(h); const x2 = c2.getContext('2d');
            sekiller(k).forEach((sk) => sekilCiz(x2, sk, w, h, Math.max(1, w / 640), ayna));
            x.drawImage(c2, 0, 0); x.restore(); // çizimler görüntüyle aynı dönüşümde: ekrandakiyle birebir
            const et = (_ca.duzen === 'kar' ? (k.klip === _ca.klip ? '① ' : '② ') + k.klip.tarih + ' · ' : '') + (k.aci.ad || ACILAR[k.aci.id] || ''), fs = Math.round(Math.max(14, H * 0.024));
            x.font = '900 ' + fs + 'px system-ui,sans-serif'; const ew = x.measureText(et).width;
            const ey = cy + 8 + (hay && i === 1 ? fs + 18 : 0); x.fillStyle = 'rgba(0,0,0,.65)'; x.fillRect(cx + 8, ey, ew + 20, fs + 12); x.fillStyle = ACI_RENK[k.aci.id] || '#fff'; x.fillRect(cx + 8, ey, 5, fs + 12); x.fillStyle = '#fff'; x.fillText(et, cx + 20, ey + fs + 1);
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
    window.caPanel = () => { _ca.panel = !_ca.panel; const p = $('ca-panel'); p.hidden = !_ca.panel; ustCiz(); if (_ca.panel) panelCiz(); setTimeout(yerlestir, 50); };
    function panelCiz() {
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
        const skor = adet ? Math.round(top / adet) : null;
        try {
            const r = await fetch('/api/teknik-analiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grup: k.sporcu.g, ad: k.sporcu.ad, yay: t.yay, tarih: bugun(), skor, fazlar, olusturan: 'cokaci:' + k.id }) });
            const d = await r.json().catch(() => ({}));
            if (!r.ok || !d.applied) return tost(r.status === 401 || r.status === 403 ? 'Karne kaydı için eğitmen girişi gerekiyor.' : 'Karne kaydedilemedi, tekrar dene.', 'error');
            k.analiz = { id: d.id, tarih: bugun(), skor }; kaydet(); panelCiz();
            tost('✅ ' + ilkAd(k.sporcu.ad) + ' için çok açılı saha karnesi kaydedildi' + (skor != null ? ' — ' + skor + ' puan' : '') + '.', 'success');
        } catch (e) { tost('Karne kaydedilemedi (bağlantı yok). Analiz bu cihazda duruyor, sonra tekrar kaydet.', 'error'); }
    };

    // klavye: boşluk oynat, ←/→ kare, Shift ile 10 kare
    document.addEventListener('keydown', (e) => {
        if (!_ca || _ca.mod !== 'oynat' || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
        if (e.key === ' ') { e.preventDefault(); window.caOynatDurdur(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); window.caAdim(e.shiftKey ? 10 : 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); window.caAdim(e.shiftKey ? -10 : -1); }
        else if (e.key === 'Escape' && !$('ca-modal')) window.caListe();
    });
    window._caIc = { klipListe, klipOku, klipSil, aciDerece, durum: () => _ca };
})();
