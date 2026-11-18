/* ================================================================================================
   🎥 ÇOK AÇILI KAMERA (2026-11-09, v391) — 4 telefona kadar, bilgisayarda 2×2 ızgara.
   Kaynak fikir: CapTarget Instagram (DfKDi6EgU2F, "Video Delay Régie": bilgisayar + 4 telefon, önden/yandan/arkadan/hedef).
   Kullanıcı "1 ve 3" seçti (1 = Ok Hızı Ölçer).
   Altyapı: Form Lab'ın telefon yayını (/api/yayin oda + /kamera sayfası + WebRTC) aynen kullanılır; HER AÇI KENDİ ODASI.
     Sunucu değişmez. Odalar bu bilgisayarda saklanır (dagsk_cokaci_odalar): telefon bir kez QR okutur, sonraki derslerde
     /kamera ana ekran simgesinden açılınca aynı açıya kendiliğinden bağlanır. Telefondan yalnız görüntü istenir
     ({analiz:'kapat', kalite:'720'}), iskelet analizi telefonda çalışmaz → 4 akış akıcı kalır.
   Gecikme: her açının kareleri (≈12 kare/sn, 640 px JPEG) son 12 sn tutulur. Gecikmeli modda ekranda N sn önceki kare
     gösterilir. TEKRAR: tampon dondurulur, 4 açı aynı zaman çizgisinde birlikte oynar (1× / ¼×, sürgü, kare ileri-geri).
     Video sunucuya gitmez.
   v426 KAYIT (2026-11-18, kullanıcı: "4'lü kameranın amacı yok, kaydet düğmesi yok; kaydedip tek ekranda ya da 4'lüde analiz etmek,
     yan yana koymak istiyorum"): ⏺ Kaydet → bağlı her açı kendi videosu (MediaRecorder, telefonun 720p görüntüsü), ⏹ Durdur → sporcu
     seçilir, bu cihazda saklanır (IndexedDB). 📌 Son 12 sn'yi sakla → tampondaki kareler kayıt olur (atıştan sonra basılır).
     🎬 Kayıtlar → analiz stüdyosu (dagsk-cokaci-analiz.js, ca*): 4'lü/tek/yan yana, kare kare, anlar, çizim, tam analiz karnesi.
   v427 📺 TV AYNA (kullanıcı taslaktan 5'i seçti): ekranda yalnız bağlı açılar, büyük "⏪ 8 sn önce" rozeti ve o anda atan sporcunun adı
     (kare yakalanırken oyunun sıradaki sporcusu kareye yazılır); denetimler fare oynayınca görünür. 📷 Bu cihazın kamerası: telefonsuz
     (dizüstü / tablet kamerası) bir açı — ayna, tekrar ve ⏺ kayıt onunla da çalışır, kayıtta ses de olur (bırakış ipin sesinden).
   ================================================================================================ */
(function () {
    'use strict';
    const YERLER = [{ id: 'on', ad: 'Önden' }, { id: 'yan', ad: 'Yandan' }, { id: 'arka', ad: 'Arkadan' }, { id: 'hedef', ad: 'Hedef' }];
    const ICE = [{ urls: 'stun:stun.cloudflare.com:3478' }, { urls: 'stun:stun.l.google.com:19302' }];
    const TAMPON_SN = 12, KARE_MS = 83, KARE_EN = 640, GECIKMELER = [0, 3, 5, 8, 10];
    let _ck = null;
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tost = (m, t) => { try { showToast(m, t || 'info'); } catch (e) { } };
    const yeni = () => { try { return typeof yeniRozet === 'function' ? yeniRozet() : ''; } catch (e) { return ''; } };
    function odalarOku() { try { return JSON.parse(localStorage.getItem('dagsk_cokaci_odalar') || '{}') || {}; } catch (e) { return {}; } }
    function odalarYaz() { try { const o = {}; _ck.yer.forEach((y) => { if (y.oda) o[y.id] = { kod: y.oda.kod, gizli: y.oda.gizli }; }); localStorage.setItem('dagsk_cokaci_odalar', JSON.stringify(o)); } catch (e) { } }

    function css() {
        if ($('ck-stil')) return;
        const st = document.createElement('style'); st.id = 'ck-stil';
        st.textContent = '.ck{position:fixed;inset:0;z-index:99600;background:#07090c;color:#f1f5f9;display:grid;grid-template-rows:auto 1fr auto;font-family:inherit}'
            + '.ck-ust{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:max(10px,env(safe-area-inset-top,0px)) max(14px,env(safe-area-inset-right,0px)) 10px max(14px,env(safe-area-inset-left,0px))}'
            + '.ck-ust h1{font-size:18px;margin:0 auto 0 0;font-weight:900}.ck-ust .ck-gr{display:flex;gap:4px;background:#11161d;border-radius:999px;padding:3px}'
            + '.ck-btn{min-height:40px;padding:6px 14px;border-radius:999px;border:1px solid #273140;background:#11161d;color:inherit;font-weight:800;font-size:14px;cursor:pointer}'
            + '.ck-btn.on{background:#ff7a2e;border-color:#ff7a2e;color:#fff}.ck-btn:disabled{opacity:.4;cursor:default}.ck-gr .ck-btn{border:0;background:transparent}.ck-gr .ck-btn.on{background:#ff7a2e}'
            + '.ck-izgara{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6px;padding:0 6px;min-height:0}'
            + '.ck-izgara.tek{grid-template-columns:1fr;grid-template-rows:1fr}.ck-izgara.tek .ck-kare:not(.buyuk){display:none}'
            + '.ck-kare{position:relative;background:#0e1319;border-radius:12px;overflow:hidden;min-height:0;min-width:0;display:grid;place-items:center}'
            + '.ck-kare video,.ck-kare canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}'
            + '.ck-etiket{position:absolute;left:10px;top:10px;z-index:2;background:rgba(0,0,0,.6);border-radius:999px;padding:4px 12px;font-weight:900;font-size:14px;display:flex;align-items:center;gap:6px}'
            + '.ck-etiket i{width:8px;height:8px;border-radius:50%;background:#64748b}.ck-etiket i.bagli{background:#22c55e}.ck-etiket i.bekliyor{background:#facc15}'
            + '.ck-araclar{position:absolute;right:8px;top:8px;z-index:2;display:flex;gap:6px}.ck-araclar button{width:36px;height:36px;border-radius:50%;border:0;background:rgba(0,0,0,.6);color:#fff;font-size:16px;cursor:pointer}'
            + '.ck-bos{position:relative;z-index:1;text-align:center;padding:14px;display:grid;gap:8px;justify-items:center;font-size:13px;color:#94a3b8;max-width:100%}'
            + '.ck-bos img{width:min(210px,32vh);height:auto;aspect-ratio:1;background:#fff;border-radius:10px;padding:6px}.ck-bos b{color:#f1f5f9;font-size:15px}'
            + '.ck-alt{padding:10px max(14px,env(safe-area-inset-right,0px)) max(10px,env(safe-area-inset-bottom,0px)) max(14px,env(safe-area-inset-left,0px));display:flex;gap:10px;align-items:center;flex-wrap:wrap}'
            + '.ck-alt input[type=range]{flex:1;min-width:160px;accent-color:#ff7a2e}.ck-alt .ck-zaman{font-variant-numeric:tabular-nums;font-weight:800;min-width:64px;text-align:right}'
            + '.ck-not{font-size:12px;color:#94a3b8;flex:1}.ck [hidden]{display:none!important}'
            + '.ck-btn.kayit{background:#dc2626;border-color:#dc2626;color:#fff}.ck-btn.kayit.surer{animation:ck-nabiz 1.2s ease-in-out infinite;font-variant-numeric:tabular-nums}@keyframes ck-nabiz{50%{box-shadow:0 0 0 6px rgba(220,38,38,.35)}}'
            + '.ck-kayit-isik{position:absolute;left:50%;top:10px;transform:translateX(-50%);z-index:3;background:#dc2626;color:#fff;border-radius:999px;padding:3px 12px;font-weight:900;font-size:13px}'
            + '.ck-modal{position:absolute;inset:0;z-index:8;background:rgba(3,5,8,.8);display:grid;place-items:center;padding:16px}.ck-modal>div{width:min(500px,100%);background:#0e1319;border:1px solid #273140;border-radius:18px;padding:16px;display:grid;gap:10px}'
            + '.ck-modal h3{margin:0;font-size:19px;font-weight:900}.ck-modal p{margin:0;color:#94a3b8;font-size:14px}.ck-modal label{display:grid;gap:4px;font-size:13px;font-weight:800;color:#cbd5e1}.ck-modal select,.ck-modal input{min-height:44px;border-radius:12px;border:1px solid #273140;background:#07090c;color:inherit;padding:0 12px;font:inherit;font-size:15px}'
            + '.ck-modal .ck-sat{display:flex;gap:6px;flex-wrap:wrap}.ck-modal .ck-sat .ck-btn{flex:1;min-height:48px}'
            + '.ck-yz{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 12px;background:#11161d;border:1px solid var(--r);font-size:14px;font-variant-numeric:tabular-nums}.ck-yz b{color:var(--r);font-size:16px}'
            // ⧉ köşe penceresi: skor girişi altta sürer
            + '.ck.mini{inset:auto max(12px,env(safe-area-inset-right,0px)) max(12px,env(safe-area-inset-bottom,0px)) auto;width:min(480px,calc(100vw - 24px));height:min(340px,55vh);border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.55);border:1px solid #273140;overflow:hidden}'
            + '.ck.mini .ck-ust{padding:6px 8px;gap:6px}.ck.mini .ck-ust h1{margin-right:auto}.ck.mini .ck-btn{min-height:32px;padding:4px 10px;font-size:12px}.ck.mini .ck-yz{padding:3px 8px;font-size:12px}.ck.mini .ck-yz b{font-size:13px}'
            + '.ck.mini .ck-izgara{gap:3px;padding:0 3px 3px}.ck.mini .ck-kare{border-radius:8px}.ck.mini .ck-etiket{font-size:11px;padding:2px 8px;left:5px;top:5px}.ck.mini .ck-araclar,.ck.mini .ck-alt,.ck.mini .ck-rh{display:none}'
            + '.ck.mini .ck-bos img{display:none}.ck.mini .ck-bos{font-size:11px;padding:4px}'
            // 📖 kurulum rehberi (v392)
            + '.ck-rh{position:absolute;inset:0;z-index:5;background:#07090c;overflow:auto;-webkit-overflow-scrolling:touch}'
            + '.ck-rh-ic{max-width:980px;margin:0 auto;padding:max(14px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 96px max(16px,env(safe-area-inset-left,0px))}'
            + '.ck-rh-bas{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:6px}.ck-rh h2{font-size:clamp(26px,4vw,38px);line-height:1.08;margin:0;font-weight:900}'
            + '.ck-rh-alt{color:#94a3b8;margin:6px 0 18px;font-size:16px;max-width:62ch}'
            + '.ck-rh-adimlar{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:14px}'
            + '.ck-rh-adim{background:#0e1319;border:1px solid #1d2632;border-radius:18px;padding:16px;display:grid;gap:10px;align-content:start;min-width:0}'
            + '.ck-rh-adim.genis{grid-column:1/-1}.ck-rh-adim.genis svg{max-width:640px;margin:0 auto}.ck-rh-no{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#ff7a2e;color:#fff;font-weight:900;margin-right:8px;flex:none}'
            + '.ck-rh-adim h3{display:flex;align-items:center;font-size:19px;margin:0;font-weight:900}.ck-rh-adim p{margin:0;color:#cbd5e1;font-size:15px;line-height:1.5}'
            + '.ck-rh-adim svg{display:block;width:100%;height:auto;background:#0a0e13;border-radius:12px}.ck-rh-adim ul{margin:0;padding-left:18px;color:#cbd5e1;font-size:15px;line-height:1.55}'
            + '.ck-rh-aci{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}.ck-rh-aci div{border-radius:12px;padding:10px 12px;background:#121a23;font-size:14px;line-height:1.4;border-left:4px solid var(--r)}'
            + '.ck-rh-aci b{display:block;font-size:15px;margin-bottom:2px}.ck-rh-uyari{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.45);border-radius:12px;padding:10px 12px;font-size:15px;color:#fecaca}'
            + '.ck-rh-bar{position:fixed;left:0;right:0;bottom:0;z-index:6;display:flex;justify-content:center;padding:12px max(16px,env(safe-area-inset-right,0px)) max(12px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));background:linear-gradient(transparent,#07090c 35%)}'
            + '.ck-rh-bar button{min-height:54px;min-width:min(100%,320px);border-radius:16px;border:0;background:#ff7a2e;color:#fff;font-weight:900;font-size:17px;cursor:pointer}'
            // 📺 TV ayna (v427)
            + '.ck.tv{grid-template-rows:minmax(0,1fr)}.ck.tv .ck-ust,.ck.tv .ck-alt,.ck.tv .ck-araclar,.ck.tv .ck-etiket,.ck.tv .ck-kare.bos-aci{display:none}.ck.tv .ck-izgara{padding:0;gap:4px;height:100%}.ck.tv .ck-kare{border-radius:0}'
            + '.ck-tv{position:absolute;inset:0;z-index:4;pointer-events:none}.ck-tv-rozet{position:absolute;right:max(18px,env(safe-area-inset-right,0px));top:max(18px,env(safe-area-inset-top,0px));background:#dc2626;color:#fff;border-radius:999px;padding:8px 22px;font-weight:900;font-size:clamp(20px,2.8vw,44px);box-shadow:0 8px 30px rgba(0,0,0,.45)}.ck-tv-rozet.canli{background:#16a34a}'
            + '.ck-tv-ad{position:absolute;left:max(18px,env(safe-area-inset-left,0px));top:max(18px,env(safe-area-inset-top,0px));background:rgba(0,0,0,.66);color:#fff;border-radius:16px;padding:8px 20px;font-weight:900;font-size:clamp(22px,3.4vw,56px);max-width:60vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ck-tv-ad:empty{display:none}'
            + '.ck-tv-cubuk{position:absolute;left:0;right:0;bottom:0;height:8px;background:rgba(255,255,255,.12)}.ck-tv-cubuk i{display:block;height:100%;width:0;background:#dc2626}'
            + '.ck-tv-alt{position:absolute;left:50%;bottom:max(22px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;opacity:0;transition:opacity .3s;pointer-events:auto;background:rgba(7,9,12,.85);border:1px solid #273140;border-radius:999px;padding:6px}.ck.tv.hareket .ck-tv-alt,.ck-tv-alt:focus-within{opacity:1}'
            + '.ck-tv-bos{position:absolute;inset:0;display:grid;place-items:center;color:#94a3b8;font-size:22px;font-weight:800;text-align:center;padding:20px}';
        document.head.appendChild(st);
    }
    function iskelet() {
        let el = $('ck'); if (el) el.remove();
        el = document.createElement('div'); el.id = 'ck'; el.className = 'ck'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Çok Açılı Kamera');
        el.innerHTML = '<div class="ck-ust" id="ck-ust"></div><div class="ck-izgara" id="ck-izgara">'
            + _ck.yer.map((y) => '<div class="ck-kare bos-aci" id="ck-k-' + y.id + '"><video muted playsinline autoplay></video><canvas hidden></canvas><div class="ck-etiket"><i></i><span>' + esc(y.ad) + '</span></div><div class="ck-araclar"></div><div class="ck-bos"></div></div>').join('')
            + '</div><div class="ck-alt" id="ck-alt"></div>';
        document.body.appendChild(el);
        _ck.yer.forEach((y) => { const k = $('ck-k-' + y.id); y.v = k.querySelector('video'); y.cv = k.querySelector('canvas'); });
    }
    // 🏆 yarışmadan açıldıysa: süren turun serisi + süre sayacı (yarışma modülünün kendi durumu, her 0,5 sn)
    function yzSerit() {
        try {
            if (!_ck || !_ck.yarisma || typeof yzOku !== 'function') return '';
            const o = yzOku(), d = o.durum; if (!d || !d.asama || d.asama === 'kurulum' || d.asama === 'bitti') return '';
            const f = yzFormat(d), s = typeof yzSayacDurum === 'function' ? yzSayacDurum(o) : null;
            const renk = s && s.faz === 'atis' ? '#22c55e' : s && s.faz === 'hazirlik' ? '#facc15' : s && s.faz === 'bitti' ? '#ef4444' : '#94a3b8';
            return '<span class="ck-yz" style="--r:' + renk + '">🏹 ' + (d.asama === 'eleme' ? 'Eleme' : 'Seri ' + Math.min(d.seri + 1, f.seri) + '/' + f.seri) + (s && o.sayac ? ' · ' + esc(s.alt) + ' <b>' + esc(s.metin) + '</b>' : '') + '</span>';
        } catch (e) { return ''; }
    }
    function ustCiz() {
        const bagli = _ck.yer.filter((y) => y.durum === 'bagli').length;
        if (_ck.mini) {
            $('ck-ust').innerHTML = '<h1 style="font-size:14px">🎥 ' + bagli + '/4</h1><span id="ck-yz-yer">' + yzSerit() + '</span>'
                + kayitDugme(bagli) + '<button type="button" class="ck-btn" onclick="ckMini(false)" aria-label="Büyüt">⤢ Büyüt</button><button type="button" class="ck-btn" onclick="ckKapat()" aria-label="Kapat">✕</button>';
            return;
        }
        $('ck-ust').innerHTML = '<h1>🎥 Çok Açılı Kamera <small style="font-weight:600;color:#94a3b8;font-size:13px">' + bagli + '/4 bağlı</small></h1>'
            + '<span id="ck-yz-yer">' + yzSerit() + '</span>'
            + (_ck.yarisma ? '<button type="button" class="ck-btn" onclick="ckMini(true)">⧉ Köşeye al · skor gir</button>' : '')
            + '<div class="ck-gr" role="group" aria-label="Gecikme">' + GECIKMELER.map((g) => '<button type="button" class="ck-btn' + (_ck.gecikme === g ? ' on' : '') + '" onclick="ckGecikme(' + g + ')"' + (_ck.tekrar ? ' disabled' : '') + '>' + (g ? g + ' sn' : 'Canlı') + '</button>').join('') + '</div>'
            + kayitDugme(bagli)
            + '<button type="button" class="ck-btn" onclick="ckSonSakla()"' + (bagli && !_ck.kayit ? '' : ' disabled') + ' title="Az önceki atışı (son 12 sn, dört açı) kayıtlara ekle">📌 Son 12 sn\'yi sakla</button>'
            + '<button type="button" class="ck-btn' + (_ck.tekrar ? ' on' : '') + '" onclick="ckTekrar()"' + (bagli && !_ck.kayit ? '' : ' disabled') + '>⏪ ' + (_ck.tekrar ? 'Tekrardan çık' : 'Son 12 sn tekrar') + '</button>'
            + '<button type="button" class="ck-btn" onclick="ckKayitlar()" title="Kayıtlı çekimler: 4\'lü / tek / yan yana analiz">🎬 Kayıtlar' + (_ck.klipSay ? ' (' + _ck.klipSay + ')' : '') + '</button>'
            + '<button type="button" class="ck-btn" onclick="ckTv(true)"' + (bagli ? '' : ' disabled') + ' title="TV için sade tam ekran: gecikmeli ayna, sporcunun adı">📺 TV ayna' + yeni() + '</button>'
            + '<button type="button" class="ck-btn" onclick="ckRehber(true)">❔ Nasıl kurulur?</button>'
            + '<button type="button" class="ck-btn" onclick="ckTamEkran()" aria-label="Tam ekran">⛶</button>'
            + '<button type="button" class="ck-btn" onclick="ckKapat()" aria-label="Kapat">✕</button>';
    }
    function kayitDugme(bagli) {
        if (_ck.kayit) return '<button type="button" class="ck-btn kayit surer" onclick="ckKayitDurdur()" aria-label="Kaydı durdur">⏹ Durdur · ' + sureYaz(performance.now() - _ck.kayit.bas) + '</button>';
        return '<button type="button" class="ck-btn kayit" onclick="ckKayitBaslat()"' + (bagli && !_ck.tekrar && window.MediaRecorder ? '' : ' disabled') + ' title="Bağlı bütün açıları birlikte kaydet">⏺ Kaydet</button>';
    }
    const sureYaz = (ms) => { const t = Math.floor(ms / 1000); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
    function altCiz() {
        const a = $('ck-alt'); if (!a) return;
        if (!_ck.tekrar) { a.innerHTML = '<span class="ck-not">' + (_ck.gecikme ? 'Görüntü ' + _ck.gecikme + ' sn geriden geliyor: sporcu atar, döner, kendini dört açıdan izler.' : 'Bir açıya dokununca büyür. Telefonlar aynı Wi-Fi\'de olursa görüntü en akıcı olur.') + ' <b>⏺ Kaydet</b> ile dört açı birlikte kaydedilir, <b>🎬 Kayıtlar</b>\'da kare kare analiz edilir.</span>'; return; }
        const r = _ck.tekrar, uz = (r.son - r.bas) / 1000, poz = (r.poz - r.bas) / 1000;
        a.innerHTML = '<button type="button" class="ck-btn" onclick="ckKare(-1)" aria-label="Bir kare geri">◀︎</button>'
            + '<button type="button" class="ck-btn on" onclick="ckOynat()">' + (r.oynuyor ? '⏸' : '▶︎') + '</button>'
            + '<button type="button" class="ck-btn" onclick="ckKare(1)" aria-label="Bir kare ileri">▶︎|</button>'
            + '<input type="range" id="ck-surgu" min="0" max="' + Math.round(uz * 1000) + '" value="' + Math.round(poz * 1000) + '" oninput="ckSurgu(this.value)" aria-label="Tekrar zamanı">'
            + '<span class="ck-zaman" id="ck-zaman">' + poz.toFixed(1).replace('.', ',') + ' sn</span>'
            + '<div class="ck-gr" role="group" aria-label="Hız">' + [1, 0.5, 0.25].map((h) => '<button type="button" class="ck-btn' + (r.hiz === h ? ' on' : '') + '" onclick="ckHiz(' + h + ')">' + (h === 1 ? '1×' : h === 0.5 ? '½×' : '¼×') + '</button>').join('') + '</div>';
    }
    function kareCiz(y) {
        const k = $('ck-k-' + y.id); if (!k) return;
        const i = k.querySelector('.ck-etiket i'); i.className = y.durum === 'bagli' ? 'bagli' : y.oda ? 'bekliyor' : '';
        const goster = y.durum === 'bagli' && y.akis;
        k.querySelector('.ck-araclar').innerHTML = (goster ? '<button type="button" onclick="ckBuyut(\'' + y.id + '\')" aria-label="' + esc(y.ad) + ' büyüt">' + (_ck.buyuk === y.id ? '⤡' : '⤢') + '</button>' : '')
            + (y.oda || y.yerel ? '<button type="button" onclick="ckCikar(\'' + y.id + '\')" aria-label="' + esc(y.ad) + ' kamerasını çıkar">✕</button>' : '');
        const bos = k.querySelector('.ck-bos');
        if (goster) { bos.hidden = true; bos.innerHTML = ''; }
        else {
            bos.hidden = false;
            if (!y.oda) bos.innerHTML = '<b>' + esc(y.ad) + '</b><span>Bu açıya bir telefon bağla.</span><button type="button" class="ck-btn on" onclick="ckBagla(\'' + y.id + '\')">📱 Telefon bağla</button>' + (navigator.mediaDevices && !_ck.yer.some((x) => x.yerel) ? '<button type="button" class="ck-btn" onclick="ckYerel(\'' + y.id + '\')" title="Telefonsuz: bu bilgisayarın / tabletin kamerası">📷 Bu cihazın kamerası' + yeni() + '</button>' : '');
            else if (y.link && y.durum !== 'baglaniyor') bos.innerHTML = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=6&data=' + encodeURIComponent(y.link) + '" alt="' + esc(y.ad) + ' telefonunun okutacağı QR kod"><b>' + esc(y.ad) + ': QR\'ı telefonla okut</b><span>Kod ' + esc(y.oda.kod) + (y.durum === 'koptu' ? ' · bağlantı koptu, telefon yeniden deniyor' : ' · telefon bekleniyor') + '</span>';
            else bos.innerHTML = '<b>' + esc(y.ad) + '</b><span>' + (y.durum === 'baglaniyor' ? 'Telefon bulundu, görüntü bağlanıyor…' : 'Hazırlanıyor…') + '</span>';
        }
        const gecikmeli = goster && (_ck.gecikme > 0 || _ck.tekrar);
        y.v.hidden = !goster || gecikmeli; y.cv.hidden = !gecikmeli;
        k.classList.toggle('buyuk', _ck.buyuk === y.id); k.classList.toggle('bos-aci', !goster);
        let isik = k.querySelector('.ck-kayit-isik'); const kayitta = !!(_ck.kayit && _ck.kayit.r[y.id]);
        if (kayitta && !isik) { isik = document.createElement('span'); isik.className = 'ck-kayit-isik'; isik.textContent = '● KAYIT'; k.appendChild(isik); } else if (!kayitta && isik) isik.remove();
    }
    function hepsiniCiz() {
        ustCiz(); altCiz(); _ck.yer.forEach(kareCiz); const iz = $('ck-izgara'); iz.classList.toggle('tek', !!_ck.buyuk);
        // 📺 TV: yalnız bağlı açılar ekranı doldurur (1 → tam, 2 → yan yana, 3–4 → 2×2)
        const n = _ck.yer.filter((y) => y.durum === 'bagli' && y.akis).length;
        if (_ck.tv && !_ck.buyuk) { iz.style.gridTemplateColumns = n <= 1 ? '1fr' : '1fr 1fr'; iz.style.gridTemplateRows = n <= 2 ? '1fr' : '1fr 1fr'; } else { iz.style.gridTemplateColumns = ''; iz.style.gridTemplateRows = ''; }
        tvCiz();
    }

    // ---- WebRTC (Form Lab flTelSorgu / flTelCevapla ile aynı akış, açı başına)
    async function odaAc(y) {
        const r = await fetch('/api/yayin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
        if (!r.ok) throw new Error('http ' + r.status);
        const d = await r.json(); y.oda = { kod: d.kod, gizli: d.gizli }; odalarYaz();
    }
    function linkYap(y) { y.link = location.origin + '/kamera#k=' + y.oda.kod + '&g=' + y.oda.gizli; }
    async function sorgu(y) {
        if (!_ck || !y.oda || y.bitti) return;
        try {
            const r = await fetch('/api/yayin/' + y.oda.kod + '?g=' + y.oda.gizli, { cache: 'no-store' });
            if (r.status === 404) { kes(y); y.oda = null; odalarYaz(); kareCiz(y); ustCiz(); return; }
            const d = r.ok ? await r.json() : null;
            if (y.ilk && d) { y.ilk = false; if (d.teklif && (d.cevapSurum === d.teklifSurum || !d.zaman || Date.now() - d.zaman > 60000)) y.surum = d.teklifSurum; }
            if (d && d.teklif && d.teklifSurum > (y.surum || 0)) await cevapla(y, d.teklif, d.teklifSurum);
        } catch (e) { }
        if (_ck && y.oda && !y.bitti) y.zaman = setTimeout(() => sorgu(y), y.durum === 'bagli' ? 4000 : 1000);
    }
    async function cevapla(y, sdp, surum) {
        y.surum = surum;
        try { if (y.pc) y.pc.close(); } catch (e) { }
        const pc = y.pc = new RTCPeerConnection({ iceServers: ICE });
        pc.ontrack = (e) => { if (pc !== y.pc) return; y.akis = (e.streams && e.streams[0]) || new MediaStream([e.track]); y.v.srcObject = y.akis; y.v.play().catch(() => { }); };
        pc.ondatachannel = (e) => {
            if (pc !== y.pc || e.channel.label !== 'komut') return;
            const k = y.kanal = e.channel, gonder = () => { try { k.send(JSON.stringify({ analiz: 'kapat', kalite: '720' })); } catch (er) { } };
            if (k.readyState === 'open') gonder(); else k.onopen = gonder;
        };
        pc.onconnectionstatechange = () => {
            if (pc !== y.pc || !_ck) return;
            const s = pc.connectionState, once = y.durum;
            y.durum = s === 'connected' ? 'bagli' : (s === 'failed' || s === 'disconnected' || s === 'closed') ? 'koptu' : 'baglaniyor';
            if (y.durum !== once) { kareCiz(y); ustCiz(); if (y.durum === 'bagli') tost(y.ad + ' telefonu bağlandı', 'success'); }
            try { pc.getReceivers().forEach((r) => { if (r.track && r.track.kind === 'video') { if ('jitterBufferTarget' in r) r.jitterBufferTarget = 150; else r.playoutDelayHint = 0.15; } }); } catch (e) { }
        };
        await pc.setRemoteDescription({ type: 'offer', sdp });
        await pc.setLocalDescription(await pc.createAnswer());
        await new Promise((r) => { if (pc.iceGatheringState === 'complete') return r(); const z = setTimeout(r, 3000); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(z); r(); } }); });
        await fetch('/api/yayin/' + y.oda.kod + '/cevap?g=' + y.oda.gizli, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sdp: pc.localDescription.sdp, surum }) });
        if (y.durum !== 'bagli') { y.durum = 'baglaniyor'; kareCiz(y); }
    }
    function kes(y) {
        clearTimeout(y.zaman); y.bitti = true;
        try { if (y.pc) y.pc.close(); } catch (e) { }
        if (y.yerel && y.akis) y.akis.getTracks().forEach((t) => { try { t.stop(); } catch (e) { } });
        y.pc = null; y.akis = null; y.kanal = null; y.durum = null; y.kareler = []; y.yerel = false;
        try { y.v.srcObject = null; } catch (e) { }
    }
    function baslat(y) { y.bitti = false; y.ilk = true; y.surum = 0; y.durum = 'bekliyor'; linkYap(y); kareCiz(y); sorgu(y); }

    // ---- kare tamponu (gecikme + tekrar)
    function kareYakala() {
        if (!_ck || _ck.tekrar) return;
        const simdi = performance.now();
        _ck.yer.forEach((y) => {
            if (y.durum !== 'bagli' || !y.v.videoWidth || y.yakaliyor) return;
            const o = KARE_EN / y.v.videoWidth, w = KARE_EN, h = Math.round(y.v.videoHeight * o);
            const c = _ck.tuval || (_ck.tuval = document.createElement('canvas')); c.width = w; c.height = h;
            try { c.getContext('2d').drawImage(y.v, 0, 0, w, h); } catch (e) { return; }
            y.yakaliyor = true;
            const ad = aktifAd(); c.toBlob((b) => { y.yakaliyor = false; if (!b || !_ck) return; y.kareler.push({ t: simdi, b, ad }); while (y.kareler.length && simdi - y.kareler[0].t > TAMPON_SN * 1000 + 500) y.kareler.shift(); }, 'image/jpeg', 0.7);
        });
    }
    // o anda atan sporcu (Karışık Sınıf oyununun sıradaki sporcusu); yoksa boş
    function aktifAd() { try { if (!document.getElementById('km-oyun-wrap')) return ''; const r = _kmOyunRosterCache && _kmOyunRosterCache[_kmOyunAktifIndex]; return r && r.ad ? String(r.ad) : ''; } catch (e) { return ''; } }
    function kareBul(y, t) { let en = null; for (let i = 0; i < y.kareler.length; i++) { if (y.kareler[i].t <= t) en = y.kareler[i]; else break; } return en || y.kareler[0] || null; }
    function goster(y, k) {
        if (!k || y.son === k || y.cozuyor) return;
        y.cozuyor = true; y.son = k;
        if (_ck) _ck.tvAd = k.ad || ''; createImageBitmap(k.b).then((bm) => { y.cozuyor = false; if (!_ck) return; if (y.cv.width !== bm.width) { y.cv.width = bm.width; y.cv.height = bm.height; } y.cv.getContext('2d').drawImage(bm, 0, 0); bm.close && bm.close(); }).catch(() => { y.cozuyor = false; });
    }
    function cizimDongu() {
        if (!_ck) return;
        const simdi = performance.now(), r = _ck.tekrar;
        if (r && r.oynuyor) {
            r.poz += (simdi - (r.onceki || simdi)) * r.hiz;
            if (r.poz >= r.son) { r.poz = r.son; r.oynuyor = false; altCiz(); }
            const s = $('ck-surgu'), z = $('ck-zaman'); if (s) s.value = Math.round(r.poz - r.bas); if (z) z.textContent = ((r.poz - r.bas) / 1000).toFixed(1).replace('.', ',') + ' sn';
        }
        if (r) r.onceki = simdi;
        if (r || _ck.gecikme > 0) { const t = r ? r.poz : simdi - _ck.gecikme * 1000; _ck.yer.forEach((y) => { if (y.durum === 'bagli' && y.kareler.length) goster(y, kareBul(y, t)); }); }
        if (_ck.tv) tvGuncelle(simdi);
        _ck.raf = requestAnimationFrame(cizimDongu);
    }
    // ---- 📺 TV ayna (v427)
    function tvCiz() {
        const el = $('ck'); if (!el) return; let t = $('ck-tv');
        if (!_ck.tv) { if (t) t.remove(); return; }
        if (!t) { t = document.createElement('div'); t.id = 'ck-tv'; t.className = 'ck-tv'; el.appendChild(t); }
        const n = _ck.yer.filter((y) => y.durum === 'bagli' && y.akis).length;
        t.innerHTML = (n ? '' : '<div class="ck-tv-bos">Kamera bekleniyor…</div>')
            + '<div class="ck-tv-ad" id="ck-tv-ad"></div><div class="ck-tv-rozet' + (_ck.gecikme ? '' : ' canli') + '" id="ck-tv-rozet">' + (_ck.gecikme ? '⏪ ' + _ck.gecikme + ' sn önce' : '● CANLI') + '</div>'
            + (_ck.gecikme ? '<div class="ck-tv-cubuk"><i id="ck-tv-cubuk"></i></div>' : '')
            + '<div class="ck-tv-alt"><div class="ck-gr" role="group" aria-label="Gecikme">' + GECIKMELER.map((g) => '<button type="button" class="ck-btn' + (_ck.gecikme === g ? ' on' : '') + '" onclick="ckGecikme(' + g + ')">' + (g ? g + ' sn' : 'Canlı') + '</button>').join('') + '</div>'
            + '<button type="button" class="ck-btn" onclick="ckTv(false)">✕ TV modundan çık</button></div>';
        _ck.tvAdSon = null;
    }
    function tvGuncelle(simdi) {
        const a = $('ck-tv-ad'); if (a) { const ad = _ck.gecikme ? (_ck.tvAd || '') : aktifAd(); if (ad !== _ck.tvAdSon) { _ck.tvAdSon = ad; a.textContent = ad ? '🏹 ' + ad : ''; } }
        const c = $('ck-tv-cubuk'); if (c && _ck.gecikme) { const p = ((simdi / 1000) % _ck.gecikme) / _ck.gecikme; c.style.width = (p * 100).toFixed(1) + '%'; }
    }

    // ---- 📖 kurulum rehberi (v392, kullanıcı: "çoklu kamerayı fotoğraf ile nasıl yapılacağını uygulamada anlat").
    // Çizimler SVG (gerçek fotoğraf yok): kuşbakışı salon + açıların gördüğü alan, sehpadaki telefon, QR okutma, tekrar.
    // Sağ elini kullanan sporcuya göre: yüzü (göğsü) atış çizgisi boyunca bir yana bakar; solaklarda Önden/Arkadan yer değiştirir.
    const RH_RENK = { on: '#38bdf8', yan: '#a78bfa', arka: '#4ade80', hedef: '#facc15' };
    function rhTelefon(x, y, aci, renk, ad, koni, etiketDx, etiketDy) {
        // koni: [uzunluk, yarı açı derece]; aci: bakış yönü (derece, 0 = sağ, -90 = yukarı)
        const r = (d) => d * Math.PI / 180, L = koni[0], a1 = r(aci - koni[1]), a2 = r(aci + koni[1]);
        return '<path d="M' + x + ' ' + y + ' L' + (x + L * Math.cos(a1)).toFixed(1) + ' ' + (y + L * Math.sin(a1)).toFixed(1) + ' A' + L + ' ' + L + ' 0 0 1 ' + (x + L * Math.cos(a2)).toFixed(1) + ' ' + (y + L * Math.sin(a2)).toFixed(1) + ' Z" fill="' + renk + '" opacity=".16"/>'
            + '<g transform="translate(' + x + ' ' + y + ') rotate(' + (aci + 90) + ')"><rect x="-9" y="-5" width="18" height="10" rx="2.5" fill="#0a0e13" stroke="' + renk + '" stroke-width="2.2"/><circle cx="0" cy="-2" r="1.6" fill="' + renk + '"/></g>'
            + '<text x="' + (x + etiketDx) + '" y="' + (y + etiketDy) + '" fill="' + renk + '" font-size="13" font-weight="800" text-anchor="middle">' + ad + '</text>';
    }
    function rhSalonSVG() {
        const sx = 230, sy = 250; // sporcu
        return '<svg viewBox="0 0 460 330" role="img" aria-label="Salonun kuşbakışı çizimi: sporcu, hedef ve dört telefonun yeri">'
            + '<rect x="20" y="20" width="420" height="' + (sy - 42) + '" fill="#ef4444" opacity=".08"/>'
            + '<text x="34" y="132" fill="#fca5a5" font-size="12" font-weight="700">OK YOLU</text><text x="34" y="148" fill="#fca5a5" font-size="12">buraya telefon koyma</text>'
            + '<circle cx="' + sx + '" cy="44" r="22" fill="none" stroke="#e2e8f0" stroke-width="2"/><circle cx="' + sx + '" cy="44" r="13" fill="#ef4444" opacity=".8"/><circle cx="' + sx + '" cy="44" r="6" fill="#facc15"/>'
            + '<text x="' + (sx + 30) + '" y="40" fill="#e2e8f0" font-size="12">Hedef</text>'
            + '<line x1="' + sx + '" y1="' + (sy - 16) + '" x2="' + sx + '" y2="70" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="5 6" opacity=".6"/>'
            + '<line x1="20" y1="' + (sy - 22) + '" x2="440" y2="' + (sy - 22) + '" stroke="#f8fafc" stroke-width="2.5"/>'
            + '<text x="436" y="' + (sy - 28) + '" fill="#e2e8f0" font-size="11" text-anchor="end">ATIŞ ÇİZGİSİ</text>'
            // sporcu kuşbakışı: omuzlar ok yönünde, yüz sağa (sağ elini kullanan)
            + '<ellipse cx="' + sx + '" cy="' + sy + '" rx="8" ry="17" fill="#fb923c"/><circle cx="' + (sx + 3) + '" cy="' + sy + '" r="7" fill="#fdba74"/>'
            + '<path d="M' + (sx - 2) + ' ' + (sy - 30) + ' q 14 -4 0 -14" fill="none" stroke="#fb923c" stroke-width="3"/>'
            + '<text x="' + sx + '" y="' + (sy + 34) + '" fill="#fdba74" font-size="12" text-anchor="middle">Sporcu (yüzü →)</text>'
            + rhTelefon(sx + 120, sy, 180, RH_RENK.on, 'ÖNDEN', [95, 20], 0, 26)
            + rhTelefon(sx - 120, sy, 0, RH_RENK.arka, 'ARKADAN', [95, 20], 0, 26)
            + rhTelefon(sx, sy + 62, -90, RH_RENK.yan, 'YANDAN', [70, 16], -48, 4)
            + rhTelefon(sx + 52, sy + 50, -100, RH_RENK.hedef, 'HEDEF', [185, 5], 44, 14)
            + '<text x="' + (sx + 120) + '" y="' + (sy - 14) + '" fill="#94a3b8" font-size="11" text-anchor="middle">≈3 m</text>'
            + '<text x="' + (sx - 120) + '" y="' + (sy - 14) + '" fill="#94a3b8" font-size="11" text-anchor="middle">≈3 m</text>'
            + '</svg>';
    }
    function rhSehpaSVG() {
        return '<svg viewBox="0 0 460 230" role="img" aria-label="Sehpaya yatay konmuş telefon, sporcunun omuz hizasında">'
            + '<line x1="20" y1="212" x2="440" y2="212" stroke="#334155" stroke-width="2"/>'
            // sehpa + yatay telefon
            + '<path d="M110 212 L130 112 L150 212 M130 112 L130 212" stroke="#94a3b8" stroke-width="3" fill="none" stroke-linecap="round"/>'
            + '<rect x="100" y="86" width="60" height="32" rx="6" fill="#0a0e13" stroke="#38bdf8" stroke-width="3"/><circle cx="152" cy="102" r="3" fill="#38bdf8"/>'
            + '<text x="130" y="72" fill="#38bdf8" font-size="13" font-weight="800" text-anchor="middle">YATAY</text>'
            // sporcu yandan
            + '<circle cx="350" cy="62" r="13" fill="#fdba74"/><path d="M350 76 L350 150 M350 150 L334 210 M350 150 L366 210 M350 92 L300 96 M350 92 L318 100" stroke="#fb923c" stroke-width="7" stroke-linecap="round" fill="none"/>'
            + '<path d="M296 50 Q 276 96 296 142" stroke="#e2e8f0" stroke-width="3" fill="none"/>'
            + '<line x1="160" y1="102" x2="336" y2="92" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 5"/>'
            + '<text x="248" y="88" fill="#94a3b8" font-size="12" text-anchor="middle">omuz hizası</text>'
            + '<path d="M130 196 L350 196" stroke="#64748b" stroke-width="1" marker-end="url(#ok)"/>'
            + '<text x="240" y="190" fill="#94a3b8" font-size="12" text-anchor="middle">2–3 m</text>'
            + '<defs><marker id="ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#64748b"/></marker></defs>'
            + '</svg>';
    }
    function rhQrSVG() {
        let qr = ''; const kod = [1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1];
        kod.forEach((v, i) => { if (v) qr += '<rect x="' + (128 + (i % 5) * 9) + '" y="' + (58 + Math.floor(i / 5) * 9) + '" width="8" height="8" fill="#0a0e13"/>'; });
        return '<svg viewBox="0 0 460 210" role="img" aria-label="Bilgisayardaki QR kodu telefonla okutma">'
            + '<rect x="40" y="30" width="230" height="140" rx="8" fill="#0e1319" stroke="#475569" stroke-width="3"/><path d="M20 178 H290 L276 168 H34z" fill="#475569"/>'
            + '<rect x="50" y="40" width="102" height="58" rx="4" fill="#121a23"/><rect x="158" y="40" width="102" height="58" rx="4" fill="#121a23"/><rect x="50" y="104" width="102" height="58" rx="4" fill="#121a23"/><rect x="158" y="104" width="102" height="58" rx="4" fill="#121a23"/>'
            + '<rect x="123" y="53" width="56" height="56" fill="#fff" rx="3"/>' + qr
            + '<text x="101" y="138" fill="#94a3b8" font-size="10" text-anchor="middle">Telefon bağla</text>'
            + '<g transform="translate(350 104) rotate(-12)"><rect x="-34" y="-62" width="68" height="124" rx="12" fill="#0a0e13" stroke="#e2e8f0" stroke-width="3"/><rect x="-24" y="-40" width="48" height="48" fill="none" stroke="#facc15" stroke-width="2" stroke-dasharray="6 4"/><text x="0" y="34" fill="#e2e8f0" font-size="10" text-anchor="middle">QR\'ı okut</text></g>'
            + '<path d="M300 92 L190 82" stroke="#facc15" stroke-width="1.5" stroke-dasharray="4 4"/>'
            + '</svg>';
    }
    function rhTekrarSVG() {
        let k = ''; [RH_RENK.on, RH_RENK.yan, RH_RENK.arka, RH_RENK.hedef].forEach((r, i) => { const x = 30 + (i % 2) * 205, y = 20 + Math.floor(i / 2) * 70; k += '<rect x="' + x + '" y="' + y + '" width="195" height="60" rx="8" fill="#121a23" stroke="' + r + '" stroke-width="2"/><circle cx="' + (x + 97) + '" cy="' + (y + 30) + '" r="12" fill="' + r + '" opacity=".35"/>'; });
        return '<svg viewBox="0 0 460 200" role="img" aria-label="Dört açının aynı anda yavaş tekrarı">' + k
            + '<rect x="30" y="170" width="400" height="6" rx="3" fill="#1e293b"/><rect x="30" y="170" width="250" height="6" rx="3" fill="#ff7a2e"/><circle cx="280" cy="173" r="9" fill="#ff7a2e"/>'
            + '<text x="430" y="196" fill="#94a3b8" font-size="12" text-anchor="end">son 12 sn · ½× · kare kare</text></svg>';
    }
    function rehberHTML() {
        return '<div class="ck-rh-ic"><div class="ck-rh-bas"><div><h2>Dört açıdan çekim nasıl kurulur?</h2><p class="ck-rh-alt">Bilgisayar ve TV bir yerde, telefonlar sporcunun çevresinde. Kurulum bir kez yapılır, sonraki derslerde telefonlar kendiliğinden bağlanır.</p></div>'
            + '<button type="button" class="ck-btn" onclick="ckRehber(false)" aria-label="Rehberi kapat">✕</button></div>'
            + '<div class="ck-rh-adimlar">'
            + '<section class="ck-rh-adim"><h3><span class="ck-rh-no">1</span>Hazırla</h3><ul><li>Bilgisayar (TV\'ye bağlıysa daha iyi)</li><li>1–4 telefon: eski telefonlar da olur</li><li>Her telefona sehpa ya da sağlam bir dayanak</li><li>Hepsi <b>aynı Wi-Fi</b>\'de</li><li>Telefonlar şarjda ya da dolu (yayın pil yer)</li></ul></section>'
            + '<section class="ck-rh-adim"><h3><span class="ck-rh-no">2</span>Telefonu yatay, omuz hizasına koy</h3>' + rhSehpaSVG() + '<p>Telefon yan (yatay) dursun, kamera sporcunun omuz yüksekliğinde olsun. Sporcunun tamamı ve yayı kadraja girsin: genelde 2–3 metre uzaklık yeter.</p></section>'
            + '<section class="ck-rh-adim genis"><h3><span class="ck-rh-no">3</span>Dört telefonun yeri</h3>' + rhSalonSVG()
            + '<div class="ck-rh-aci">'
            + '<div style="--r:' + RH_RENK.on + '"><b>Önden</b>Sporcunun yüzünün baktığı tarafta, atış çizgisinde, 3 m. Çapa, çene, ip hizası görünür.</div>'
            + '<div style="--r:' + RH_RENK.arka + '"><b>Arkadan</b>Sırtının tarafında, 3 m. Çekiş dirseği, sırt ve omuz görünür.</div>'
            + '<div style="--r:' + RH_RENK.yan + '"><b>Yandan</b>Sporcunun gerisinde, hedefe doğru bakar. Yay kolu, ok hizası ve duruş profilden görünür.</div>'
            + '<div style="--r:' + RH_RENK.hedef + '"><b>Hedef</b>Atış çizgisinin gerisinden hedefe bakar, telefonda yakınlaştır (2x–3x). Okların nereye gittiği görünür.</div>'
            + '</div><p>Solak sporcuda Önden ile Arkadan yer değiştirir. Tek telefonun varsa önce <b>Önden</b> ya da <b>Arkadan</b> başla.</p>'
            + '<div class="ck-rh-uyari">⚠️ Atış çizgisinin önüne, ok yoluna asla telefon ya da sehpa koyma. Hedef telefonu atış çizgisinin gerisinde kalır.</div></section>'
            + '<section class="ck-rh-adim"><h3><span class="ck-rh-no">4</span>Her telefonu bağla</h3>' + rhQrSVG() + '<ul><li>Bilgisayarda bir açıda <b>Telefon bağla</b>\'ya bas.</li><li>O telefonun kamerasını QR\'a tut, çıkan bağlantıya dokun.</li><li>Kameraya izin ver, telefonu yatay çevirip yerine koy.</li><li>Sonraki açılar için aynısını yap.</li></ul><p>iPhone\'da telefon sayfasında Paylaş › <b>Ana Ekrana Ekle</b> de: sonraki derslerde QR okutmadan simgeye dokunman yeter.</p></section>'
            + '<section class="ck-rh-adim"><h3><span class="ck-rh-no">5</span>İzle ve tekrar oynat</h3>' + rhTekrarSVG() + '<ul><li><b>Canlı</b>: dört açı anında.</li><li><b>3–10 sn</b>: sporcu atar, döner, kendini geriden izler.</li><li><b>Son 12 sn tekrar</b>: dört açı aynı anda; ½×, ¼× ya da kare kare.</li><li>Bir açıya dokununca büyür.</li></ul></section>'
            + '<section class="ck-rh-adim"><h3><span class="ck-rh-no">6</span>Sorun olursa</h3><ul><li><b>Bağlanmıyor:</b> telefon ve bilgisayar aynı Wi-Fi\'de mi? Olmuyorsa bir telefonun internet paylaşımını açıp bilgisayarı ona bağla.</li><li><b>Görüntü takılıyor:</b> telefon sayısını azalt ya da telefonları modeme yaklaştır.</li><li><b>Telefon ekranı karardı:</b> yayın sürer; açmak için dokun.</li><li><b>Açıyı değiştirmek:</b> o açıda ✕ ile telefonu çıkar, yeniden bağla.</li></ul></section>'
            + '</div></div><div class="ck-rh-bar"><button type="button" onclick="ckRehber(false)">Anladım, telefonları bağla</button></div>';
    }
    window.ckRehber = function (ac) {
        if (!_ck) return; let el = $('ck-rh');
        if (!ac) { if (el) el.remove(); return; }
        if (!el) { el = document.createElement('div'); el.id = 'ck-rh'; el.className = 'ck-rh'; el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Kurulum rehberi'); $('ck').appendChild(el); }
        el.innerHTML = rehberHTML(); el.scrollTop = 0;
    };

    // ---- ⏺ kayıt (v426)
    const KAYIT_EN_UZUN = 120000;
    function analizHazir() { return typeof dagskEkYukle === 'function' ? dagskEkYukle('dagsk-cokaci-analiz.js?v=2') : Promise.reject(); }
    function kayitTuru() { const l = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4;codecs=avc1', 'video/mp4']; return l.find((t) => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || ''; }
    function kucukYap() {
        try { const y = _ck.yer.find((x) => x.durum === 'bagli' && x.v.videoWidth); if (!y) return ''; const c = document.createElement('canvas'), w = 360; c.width = w; c.height = Math.round(w * y.v.videoHeight / y.v.videoWidth); c.getContext('2d').drawImage(y.v, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.6); } catch (e) { return ''; }
    }
    window.ckKayitBaslat = function () {
        if (!_ck || _ck.kayit) return; const tur = kayitTuru(), r = {}, bas = performance.now();
        _ck.yer.forEach((y) => {
            if (y.durum !== 'bagli' || !y.akis) return;
            try {
                const rec = new MediaRecorder(y.akis, tur ? { mimeType: tur, videoBitsPerSecond: 4e6 } : undefined), o = { rec, parca: [], bas: bas, tur: rec.mimeType || tur || 'video/webm' };
                rec.ondataavailable = (e) => { if (e.data && e.data.size) o.parca.push(e.data); };
                rec.onstart = () => { o.bas = performance.now(); };
                o.bitti = new Promise((ok) => { rec.onstop = ok; });
                rec.start(1000); r[y.id] = o;
            } catch (e) { }
        });
        if (!Object.keys(r).length) return tost('Kayıt başlatılamadı: bu tarayıcı canlı görüntüyü kaydedemiyor.', 'error');
        _ck.kayit = { bas, r, kucuk: kucukYap() };
        _ck.kayitZ = setInterval(() => { if (!_ck || !_ck.kayit) return; if (performance.now() - _ck.kayit.bas > KAYIT_EN_UZUN) return window.ckKayitDurdur(); const b = document.querySelector('#ck-ust .ck-btn.kayit'); if (b) b.textContent = '⏹ Durdur · ' + sureYaz(performance.now() - _ck.kayit.bas); }, 250);
        analizHazir().catch(() => { });
        hepsiniCiz(); tost('⏺ Kayıt başladı: ' + Object.keys(r).length + ' açı.', 'success');
    };
    window.ckKayitDurdur = async function () {
        if (!_ck || !_ck.kayit) return; const k = _ck.kayit; clearInterval(_ck.kayitZ); const son = performance.now();
        Object.values(k.r).forEach((o) => { try { o.rec.stop(); } catch (e) { } });
        await Promise.all(Object.values(k.r).map((o) => Promise.race([o.bitti, new Promise((ok) => setTimeout(ok, 4000))])));
        _ck.kayit = null; hepsiniCiz();
        const ilk = Math.min.apply(null, Object.values(k.r).map((o) => o.bas)), veriler = {}, acilar = [];
        _ck.yer.forEach((y) => { const o = k.r[y.id]; if (!o || !o.parca.length) return; veriler[y.id] = { tip: 'video', blob: new Blob(o.parca, { type: o.tur.split(';')[0] }), mime: o.tur }; acilar.push({ id: y.id, ad: y.ad, ofset: Math.round(o.bas - ilk) }); });
        if (!acilar.length) return tost('Kayıtta görüntü yok.', 'warning');
        kaydetSor({ sure: Math.round(son - ilk), acilar, kucuk: k.kucuk, kaynak: 'canli' }, veriler);
    };
    window.ckSonSakla = function () {
        if (!_ck || _ck.kayit) return; const veriler = {}, acilar = []; let ilk = Infinity, son = 0;
        _ck.yer.forEach((y) => { if (y.kareler.length > 2) { ilk = Math.min(ilk, y.kareler[0].t); son = Math.max(son, y.kareler[y.kareler.length - 1].t); } });
        if (!(son > ilk)) return tost('Saklamak için birkaç saniye görüntü birikmesi gerekiyor.', 'warning');
        _ck.yer.forEach((y) => { if (y.kareler.length > 2) { veriler[y.id] = { tip: 'kare', kareler: y.kareler.map((x) => ({ t: x.t, b: x.b })) }; acilar.push({ id: y.id, ad: y.ad, ofset: Math.round(y.kareler[0].t - ilk) }); } });
        kaydetSor({ sure: Math.round(son - ilk), acilar, kucuk: kucukYap(), kaynak: 'tampon' }, veriler);
    };
    function sporcuSecenek() {
        const l = [], gor = {}, ekle = (g, ad) => { const k = g + '|' + ad; if (!ad || gor[k]) return; gor[k] = 1; l.push([k, ad]); };
        try { (typeof _kmListe !== 'undefined' && _kmListe || []).forEach((s) => ekle(s.g, s.ad)); } catch (e) { }
        try { Object.keys(turnuvaDB || {}).forEach((g) => { const o = turnuvaDB[g]; if (o && typeof o === 'object' && !Array.isArray(o)) Object.keys(o).forEach((ad) => { const s = o[ad]; if (s && typeof s === 'object' && !s.pasif && (s.seriler || s.yay || s.toplamSkor != null)) ekle(g, ad); }); }); } catch (e) { }
        let son = ''; try { son = localStorage.getItem('dagsk_cokaci_son_sporcu') || ''; } catch (e) { }
        return '<option value="">— sporcu seç —</option>' + l.map(([k, ad]) => '<option value="' + esc(k) + '"' + (k === son ? ' selected' : '') + '>' + esc(ad) + '</option>').join('');
    }
    function kaydetSor(meta, veriler) {
        const el = $('ck'); if (!el) return; let m = $('ck-modal'); if (m) m.remove();
        m = document.createElement('div'); m.className = 'ck-modal'; m.id = 'ck-modal';
        m.innerHTML = '<div><h3>💾 Kaydı sakla</h3><p>' + meta.acilar.length + ' açı · ' + (meta.sure / 1000).toFixed(1).replace('.', ',') + ' sn. Bu bilgisayarda saklanır, sunucuya video gitmez.</p>'
            + '<label>Kimin atışı?<select id="ck-m-sp">' + sporcuSecenek() + '</select></label><label>Not (isteğe bağlı)<input id="ck-m-ad" placeholder="ör. 18 m · 2. seri · 3. ok"></label>'
            + '<div class="ck-sat"><button type="button" class="ck-btn" id="ck-m-sil">🗑 Kaydetme</button><button type="button" class="ck-btn" id="ck-m-kay">💾 Kaydet</button><button type="button" class="ck-btn on" id="ck-m-anl">💾 Kaydet ve analiz et</button></div></div>';
        el.appendChild(m);
        const bitir = async (ac) => {
            const v = $('ck-m-sp').value, i = v.indexOf('|'); meta.sporcu = v ? { g: v.slice(0, i), ad: v.slice(i + 1) } : null; meta.ad = $('ck-m-ad').value.trim();
            try { localStorage.setItem('dagsk_cokaci_son_sporcu', v); } catch (e) { }
            m.querySelector('div').innerHTML = '<h3>Kaydediliyor…</h3>';
            try { await analizHazir(); const id = await window.caKlipKaydet(meta, veriler); m.remove(); _ck && (_ck.klipSay = await window.caKlipSayisi()); ustCiz(); tost('💾 Kayıt saklandı' + (meta.sporcu ? ': ' + meta.sporcu.ad : '') + '.', 'success'); if (ac) window.caAc({ id }); }
            catch (e) { m.remove(); tost('Kayıt saklanamadı: cihazda yer kalmamış olabilir.', 'error'); }
        };
        $('ck-m-sil').onclick = () => { if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Bu çekim silinsin mi?', () => m.remove(), 'Sil', 'Vazgeç'); else m.remove(); };
        $('ck-m-kay').onclick = () => bitir(false); $('ck-m-anl').onclick = () => bitir(true);
    }
    window.ckKayitlar = function () { analizHazir().then(() => window.caAc()).catch(() => tost('Kayıtlar açılamadı — bağlantıyı kontrol et.', 'error')); };

    // ---- dışa açık
    window.ckMini = function (ac) {
        if (!_ck) return; _ck.mini = !!ac; const el = $('ck'); if (el) el.classList.toggle('mini', _ck.mini);
        if (_ck.mini) window.ckRehber(false);
        hepsiniCiz();
    };
    window.ckAc = async function (ops) {
        ops = ops || {};
        if (!window.RTCPeerConnection) return tost('Bu tarayıcı canlı yayını desteklemiyor.', 'error');
        if (_ck) { if (ops.yarisma) { _ck.yarisma = true; } window.ckMini(false); return; }
        let g = 0; try { g = +localStorage.getItem('dagsk_cokaci_gecikme') || 0; } catch (e) { }
        _ck = { yer: YERLER.map((y) => Object.assign({}, y, { oda: null, kareler: [] })), gecikme: GECIKMELER.indexOf(g) >= 0 ? g : 0, buyuk: null, tekrar: null, yarisma: !!ops.yarisma, mini: false };
        css(); iskelet(); hepsiniCiz();
        const kayit = odalarOku();
        _ck.yer.forEach((y) => { if (kayit[y.id] && kayit[y.id].kod) { y.oda = kayit[y.id]; baslat(y); } });
        if (!Object.keys(kayit).length) window.ckRehber(true); // hiç telefon kurulmamışsa önce rehber
        _ck.yakala = setInterval(kareYakala, KARE_MS);
        if (_ck.yarisma) _ck.yzZaman = setInterval(() => { const y = $('ck-yz-yer'); if (y) y.innerHTML = yzSerit(); }, 500);
        _ck.raf = requestAnimationFrame(cizimDongu);
        analizHazir().then(() => window.caKlipSayisi()).then((n) => { if (_ck) { _ck.klipSay = n; ustCiz(); } }).catch(() => { });
        // ekran kararmasın — beklenmez (arka plandaki sekmede söz hiç dönmeyebilir)
        try { if (navigator.wakeLock) { const d = _ck; navigator.wakeLock.request('screen').then((k) => { if (_ck === d) d.kilit = k; else k.release(); }).catch(() => { }); } } catch (e) { }
    };
    window.ckKapat = function () {
        if (!_ck) return;
        if (_ck.kayit) { Object.values(_ck.kayit.r).forEach((o) => { try { o.rec.stop(); } catch (e) { } }); clearInterval(_ck.kayitZ); _ck.kayit = null; }
        _ck.yer.forEach(kes); clearInterval(_ck.yakala); clearInterval(_ck.yzZaman); cancelAnimationFrame(_ck.raf);
        try { if (_ck.kilit) _ck.kilit.release(); } catch (e) { } clearTimeout(_ck.tvGizle);
        try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { }
        const el = $('ck'); if (el) el.remove(); _ck = null;
    };
    window.ckBagla = async function (id) {
        const y = _ck && _ck.yer.find((x) => x.id === id); if (!y) return;
        try { await odaAc(y); baslat(y); ustCiz(); }
        catch (e) { tost(navigator.onLine === false ? 'Telefon bağlamak için internet gerekir.' : 'Bağlantı odası açılamadı, tekrar dene.', 'error'); }
    };
    window.ckCikar = function (id) {
        const y = _ck && _ck.yer.find((x) => x.id === id); if (!y) return;
        kes(y); y.oda = null; y.link = null; odalarYaz(); if (_ck.buyuk === id) _ck.buyuk = null; hepsiniCiz();
    };
    window.ckTv = function (ac) {
        if (!_ck) return; _ck.tv = ac == null ? !_ck.tv : !!ac; const el = $('ck'); if (!el) return;
        el.classList.toggle('tv', _ck.tv);
        if (_ck.tv) {
            if (_ck.tekrar) { _ck.tekrar = null; _ck.yer.forEach((y) => { y.son = null; }); }
            if (_ck.mini) window.ckMini(false); window.ckRehber(false);
            if (!_ck.gecikme) window.ckGecikme(8);
            if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => { });
            el.onmousemove = el.ontouchstart = () => { el.classList.add('hareket'); clearTimeout(_ck.tvGizle); _ck.tvGizle = setTimeout(() => { if ($('ck')) $('ck').classList.remove('hareket'); }, 2500); };
        } else { el.classList.remove('hareket'); el.onmousemove = el.ontouchstart = null; if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); }
        hepsiniCiz();
    };
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && _ck && _ck.tv) window.ckTv(false); });
    document.addEventListener('fullscreenchange', () => { if (_ck && _ck.tv && !document.fullscreenElement && _ck.tvTam) window.ckTv(false); if (_ck) _ck.tvTam = !!document.fullscreenElement; });
    window.ckYerel = async function (id) {
        const y = _ck && _ck.yer.find((x) => x.id === id); if (!y || !navigator.mediaDevices) return;
        const v = { width: { ideal: 1280 }, height: { ideal: 720 } }; let s = null;
        try { s = await navigator.mediaDevices.getUserMedia({ video: v, audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }); }
        catch (e) { try { s = await navigator.mediaDevices.getUserMedia({ video: v }); } catch (e2) { return tost('Bu cihazın kamerası açılamadı: tarayıcıdan kameraya izin ver.', 'error'); } }
        if (!_ck) { s.getTracks().forEach((t) => t.stop()); return; }
        kes(y); y.bitti = false; y.akis = s; y.yerel = true; y.v.srcObject = s; y.v.muted = true; y.v.play().catch(() => { }); y.durum = 'bagli';
        hepsiniCiz(); tost(y.ad + ': bu cihazın kamerası', 'success');
    };
    window.ckBuyut = function (id) { if (!_ck) return; _ck.buyuk = _ck.buyuk === id ? null : id; hepsiniCiz(); };
    window.ckGecikme = function (g) { if (!_ck) return; _ck.gecikme = g; try { localStorage.setItem('dagsk_cokaci_gecikme', String(g)); } catch (e) { } _ck.yer.forEach((y) => { y.son = null; }); hepsiniCiz(); };
    window.ckTekrar = function () {
        if (!_ck || _ck.kayit) return;
        if (_ck.tekrar) { _ck.tekrar = null; _ck.yer.forEach((y) => { y.son = null; }); hepsiniCiz(); return; }
        let bas = Infinity, son = 0; _ck.yer.forEach((y) => { if (y.kareler.length) { bas = Math.min(bas, y.kareler[0].t); son = Math.max(son, y.kareler[y.kareler.length - 1].t); } });
        if (!(son > bas)) return tost('Tekrar için birkaç saniye görüntü birikmesi gerekiyor.', 'warning');
        _ck.tekrar = { bas, son, poz: Math.max(bas, son - 4000), hiz: 0.5, oynuyor: true, onceki: null };
        _ck.yer.forEach((y) => { y.son = null; }); hepsiniCiz();
    };
    window.ckOynat = function () { const r = _ck && _ck.tekrar; if (!r) return; if (r.poz >= r.son) r.poz = r.bas; r.oynuyor = !r.oynuyor; r.onceki = null; altCiz(); };
    window.ckHiz = function (h) { const r = _ck && _ck.tekrar; if (!r) return; r.hiz = h; altCiz(); };
    window.ckSurgu = function (v) { const r = _ck && _ck.tekrar; if (!r) return; r.poz = r.bas + (+v); r.oynuyor = false; const z = $('ck-zaman'); if (z) z.textContent = (+v / 1000).toFixed(1).replace('.', ',') + ' sn'; };
    window.ckKare = function (d) { const r = _ck && _ck.tekrar; if (!r) return; r.oynuyor = false; r.poz = Math.max(r.bas, Math.min(r.son, r.poz + d * KARE_MS)); altCiz(); };
    window.ckTamEkran = function () { const el = $('ck'); if (!el) return; if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); else if (el.requestFullscreen) el.requestFullscreen().catch(() => { }); };
})();
