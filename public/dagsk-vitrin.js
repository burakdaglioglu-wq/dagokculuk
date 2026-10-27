// 📺 Tanıtım Ekranı (2026-10-27, v327) — Yönetici › Kulüp İşleri › Tanıtım Ekranı. Salondaki bilgisayar boştayken açılır,
// tam ekranda kendi kendine döner: "B · Oyun Kanalı" düzeni — solda büyük oyun ekranı + alt bant başlığı, sağda oyun listesi
// (oynayan vurgulu, dolan çizgi), üstte logo + saat, altta sabit tanıtım şeridi; araya "nasıl çalışır" ve "ücretsiz deneme
// dersi" kartları girer. Kullanıcı seçimi: rakam YOK, yalnız sabit tanıtım yazıları (gerçek veri/çocuk adı gösterilmez).
// Görüntüler public/vitrin/<tema>.webp — sahne yalnız, örnek adlarla çekildi (gerçek sporcu adı içermez; yenilerken de öyle).
// Çıkış: Esc ya da fareyi oynatınca çıkan ✕ Kapat. Ekran kararmasın diye Wake Lock istenir.
(function () {
    const OYUNLAR = [
        { id: 'hapsirik', ik: '🤧', ad: 'Hapşırık!', kat: 'Takım ruhu', m: 'Her ok bir tüy olur. Halkanın rengi uyuyan yaratığın neresini gıdıklayacağını seçer. Gıdık dolunca… HAPŞUUU! Sonra hep birlikte: ÇOK YAŞA!' },
        { id: 'canavar', ik: '🐉', ad: 'Ortak Canavar', kat: 'Birlikte başarmak', m: 'Tüm sınıf tek bir canavara karşı. Her seri hasar verir, çok iyi seri KRİTİK vuruş olur. Canavar yenilince daha güçlüsü gelir.' },
        { id: 'yildiz', ik: '🚀', ad: 'Roket Fırlatma', kat: 'Hedef koyma', m: 'Her iyi seri roketi bir katman yukarı taşır: bulutlar, stratosfer, uzay istasyonu, Ay… ve Mars.' },
        { id: 'zirve', ik: '🏔️', ad: 'Zirve Yolu', kat: 'Azim', m: 'Her puan bir metre. Kaya duvarını, buzul yarığını, çığ bölgesini geç; zirveye bayrağı dik.' },
        { id: 'ninja', ik: '🥷', ad: 'Ninja Oyunu', kat: 'Disiplin', m: 'Sisli bambu ormanında kapıdan kapıya koş. Hedef: dağdaki tapınak.' },
        { id: 'hazine', ik: '🏝️', ad: 'Hazine Adası', kat: 'Merak', m: 'Tekneler şamandıradan şamandıraya ilerler. Hazine sandığına ilk kim varacak?' },
        { id: 'balon', ik: '🎈', ad: 'Balon Yarışı', kat: 'Sakinlik', m: 'Her seri sıcak hava balonunu bir bulut katmanı yukarı taşır. Sakin nefes, düzgün atış, yüksek balon.' },
        { id: 'sisharita', ik: '🗺️', ad: 'Sis Haritası', kat: 'Keşif', m: 'Kayıp Ada sisle kaplı. Fenerler ilerledikçe sis açılır; 7 gizli yeri ilk bulanın adı haritaya yazılır.' }
    ];
    // ara kartlar: "sonra" = o sıradaki oyundan sonra gösterilir
    const ARALAR = [
        { sonra: 2, tip: 'nasil' },
        { sonra: 5, tip: 'davet' },
        { sonra: 7, tip: 'neden' }
    ];
    const SERIT = ['🏹 Gerçek yay, gerçek hedef, antrenör eşliğinde', '🎮 Her derste farklı bir oyun macerası', '🌱 <b>Ücretsiz deneme dersi</b> için resepsiyona sorun',
        '👧 Küçük yaş gruplarından yetişkinlere', '🏅 Kuşak sistemi, rozetler, yarışmalar', '📱 WhatsApp <b>0546 910 78 93</b>', '📸 Instagram <b>@dagokculuk</b>'];
    const OYUN_SN = 9000, ARA_SN = 8500;
    let V = null; // { el, nesil, zaman[], kilit, saat }

    function css() {
        if (document.getElementById('vt-css')) return;
        const st = document.createElement('style'); st.id = 'vt-css';
        st.textContent = `
#vt{position:fixed;inset:0;z-index:2147483000;background:#0d0f14;color:#eef1f6;font-family:Poppins,system-ui,sans-serif;overflow:hidden;cursor:none;--vt-acc:#ff6a1a;--vt-gold:#ffd166;--vt-soft:#8f98a8}
#vt.fare{cursor:default}
#vt *{box-sizing:border-box}
.vt-kabuk{position:absolute;inset:0;display:grid;grid-template-columns:minmax(0,1fr) 24vw;grid-template-rows:9vh minmax(0,1fr) 8vh;gap:1.4vh 1.4vw;padding:2vh 1.6vw 0}
.vt-ust{grid-column:1/3;display:flex;align-items:center;gap:1.2vw;min-width:0}
.vt-ust img{height:6vh}
.vt-ad{font:900 2vw/1.15 Archivo,sans-serif;letter-spacing:.03em}
.vt-ad small{display:block;font:600 .95vw Poppins,sans-serif;color:var(--vt-soft);letter-spacing:0}
.vt-rozet{font:800 .95vw Archivo,sans-serif;letter-spacing:.14em;background:var(--vt-acc);color:#1a0d05;padding:.6vh .8vw;border-radius:6px}
.vt-saat{margin-left:auto;font:700 2vw 'Roboto Mono',monospace;color:#cfd6e2}
.vt-ekran{position:relative;border-radius:22px;overflow:hidden;background:#000;box-shadow:0 0 0 2px rgba(255,255,255,.07),0 30px 80px rgba(0,0,0,.6)}
.vt-r{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transform:scale(1.02);transition:opacity .9s,transform 9.5s linear}
.vt-r.on{opacity:1;transform:scale(1.1)}
.vt-alt3{position:absolute;left:2vw;bottom:3vh;right:2vw;display:flex;align-items:stretch;transform:translateX(-115%);transition:transform .7s cubic-bezier(.2,.9,.2,1)}
.vt-alt3.on{transform:none}
.vt-alt3 .ik{flex:none;width:11vh;display:flex;align-items:center;justify-content:center;font-size:6vh;background:var(--vt-acc);border-radius:18px 0 0 18px}
.vt-alt3 .gv{background:rgba(13,15,20,.92);backdrop-filter:blur(8px);padding:1.8vh 1.8vw;border-radius:0 18px 18px 0;max-width:48vw}
.vt-alt3 h2{margin:0;font:900 3.2vw/1 Archivo,sans-serif;text-transform:uppercase}
.vt-alt3 p{margin:.8vh 0 0;font-size:1.25vw;color:#c8cfdb;line-height:1.4}
.vt-ara{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;padding:4vh 3vw;background:radial-gradient(circle at 70% 20%,rgba(255,106,26,.28),transparent 60%),#0d0f14;opacity:0;pointer-events:none;transition:opacity .8s}
.vt-ara.on{opacity:1}
.vt-ara .et{font:700 1vw 'Roboto Mono',monospace;letter-spacing:.24em;color:var(--vt-gold);text-transform:uppercase}
.vt-ara h2{margin:1.4vh 0 0;font:900 4.4vw/1 Archivo,sans-serif;text-transform:uppercase}
.vt-ara h2 em{font-style:normal;color:var(--vt-acc)}
.vt-ara p{margin:2vh 0 0;font-size:1.5vw;color:#c8cfdb}
.vt-adimlar{display:flex;gap:2vw;margin-top:4.5vh}
.vt-adim{width:16vw;padding:3vh 1.4vw;border:2px solid rgba(255,255,255,.1);border-radius:22px;background:rgba(255,255,255,.04);opacity:0;transform:translateY(24px);transition:.7s}
.vt-ara.on .vt-adim{opacity:1;transform:none}
.vt-ara.on .vt-adim:nth-child(2){transition-delay:.45s}.vt-ara.on .vt-adim:nth-child(3){transition-delay:.9s}
.vt-adim .i{font-size:3.6vw}.vt-adim b{display:block;font:900 1.6vw Archivo,sans-serif;text-transform:uppercase;margin:1.2vh 0 .6vh}.vt-adim span{font-size:1vw;color:var(--vt-soft);line-height:1.4}
.vt-iletisim{display:flex;gap:3vw;margin-top:4.5vh}
.vt-iletisim div{padding:2.4vh 2vw;border-radius:20px;border:2px solid rgba(255,106,26,.5);background:rgba(255,106,26,.1);font:900 2.6vw Archivo,sans-serif}
.vt-iletisim small{display:block;font:700 .9vw 'Roboto Mono',monospace;letter-spacing:.2em;color:var(--vt-soft);margin-bottom:.6vh}
.vt-liste{display:flex;flex-direction:column;gap:1vh;overflow:hidden;min-height:0}
.vt-liste h4{margin:.6vh 0 .4vh;font:700 .9vw 'Roboto Mono',monospace;letter-spacing:.2em;color:#7f8899}
.vt-oge{position:relative;flex:1 1 0;min-height:0;max-height:11vh;display:flex;align-items:center;gap:.9vw;padding:.9vh .9vw;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);transition:.4s;overflow:hidden}
.vt-oge .k{height:100%;aspect-ratio:16/10;border-radius:9px;background-size:cover;background-position:center;flex:none;filter:saturate(.6) brightness(.7);transition:.4s}
.vt-oge b{display:block;font:800 1.15vw Archivo,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.vt-oge span{font-size:.85vw;color:var(--vt-soft)}
.vt-oge.on{background:rgba(255,106,26,.13);border-color:rgba(255,106,26,.55)}
.vt-oge.on .k{filter:none}
.vt-oge .dol{position:absolute;left:0;bottom:0;height:3px;background:var(--vt-acc);width:0}
.vt-oge.on .dol{animation:vtDol var(--vt-sn,9s) linear forwards}
@keyframes vtDol{to{width:100%}}
.vt-serit{grid-column:1/3;display:flex;align-items:center;margin:0 -1.6vw;background:#161a22;border-top:1px solid rgba(255,255,255,.08);overflow:hidden}
.vt-serit .rz{position:relative;z-index:2;flex:none;height:100%;display:flex;align-items:center;padding:0 1.4vw;background:var(--vt-gold);color:#241a04;font:900 1.1vw Archivo,sans-serif;letter-spacing:.06em}
.vt-serit .ak{white-space:nowrap;font-size:1.3vw;animation:vtKay 60s linear infinite;padding-left:100%}
.vt-serit .ak span{margin-right:4vw}.vt-serit .ak b{color:var(--vt-gold)}
@keyframes vtKay{to{transform:translateX(-100%)}}
.vt-kontrol{position:absolute;top:2vh;left:50%;transform:translate(-50%,-150%);display:flex;gap:8px;padding:8px;border-radius:14px;background:rgba(0,0,0,.75);transition:transform .3s;z-index:5}
#vt.fare .vt-kontrol{transform:translate(-50%,0)}
.vt-kontrol button{border:0;border-radius:10px;padding:10px 16px;font:700 14px Poppins,sans-serif;cursor:pointer;background:#2a2f3a;color:#fff}
.vt-kontrol button.kapat{background:#e5484d}
@media (max-width:900px){.vt-kabuk{grid-template-columns:1fr;grid-template-rows:auto minmax(0,1fr) 7vh;padding:12px 16px 0}.vt-liste,.vt-rozet{display:none}.vt-serit{grid-column:1}.vt-ust{grid-column:1}
 .vt-ad{font-size:18px}.vt-ad small{font-size:11px}.vt-saat{font-size:18px}.vt-alt3 h2{font-size:22px}.vt-alt3 p{font-size:13px}.vt-alt3 .gv{max-width:none}.vt-ara h2{font-size:30px}.vt-ara p,.vt-serit .ak{font-size:14px}
 .vt-adimlar,.vt-iletisim{flex-direction:column;gap:10px}.vt-adim{width:auto}.vt-adim .i{font-size:28px}.vt-adim b{font-size:16px}.vt-adim span{font-size:12px}.vt-iletisim div{font-size:20px}.vt-iletisim small,.vt-ara .et{font-size:10px}.vt-serit .rz{font-size:12px}}
@media (prefers-reduced-motion:reduce){.vt-r,.vt-r.on{transform:none}.vt-serit .ak{animation-duration:120s}}`;
        document.head.appendChild(st);
    }

    function araHTML(tip) {
        if (tip === 'nasil') return `<div class="et">Okçuluk + oyun</div><h2>Gerçek ok. <em>Gerçek macera.</em></h2>
            <div class="vt-adimlar"><div class="vt-adim"><div class="i">🏹</div><b>Çocuk atar</b><span>Gerçek yay, gerçek hedef, antrenör eşliğinde.</span></div>
            <div class="vt-adim"><div class="i">🎯</div><b>Puan girilir</b><span>Antrenör seriyi tek dokunuşla girer.</span></div>
            <div class="vt-adim"><div class="i">🎮</div><b>Oyun ilerler</b><span>Roket kalkar, canavar sallanır, yaratık hapşırır!</span></div></div>`;
        if (tip === 'davet') return `<div class="et">Siz de gelin</div><h2>Ücretsiz <em>deneme dersi</em></h2><p>Bir ders gelin, oyunu çocuğunuz kendisi oynasın.</p>
            <div class="vt-iletisim"><div><small>WHATSAPP</small>0546 910 78 93</div><div><small>INSTAGRAM</small>@dagokculuk</div></div>`;
        return `<div class="et">Neden oyun?</div><h2>Odak, sabır, <em>takım ruhu</em></h2>
            <div class="vt-adimlar"><div class="vt-adim"><div class="i">🧘</div><b>Odak</b><span>Her ok bir nefes, bir karar.</span></div>
            <div class="vt-adim"><div class="i">🤝</div><b>Birlikte</b><span>Ortak oyunlarda sınıf tek takım olur.</span></div>
            <div class="vt-adim"><div class="i">📈</div><b>Gelişim</b><span>Kuşaklar ve rozetlerle ilerlemeyi görür.</span></div></div>`;
    }

    function kur() {
        css();
        const el = document.createElement('div'); el.id = 'vt';
        el.innerHTML = `<div class="vt-kabuk">
            <div class="vt-ust"><img src="/logo-k.webp" alt=""><div class="vt-ad">DAĞ OKÇULUK<small>Okçuluğu oyunla öğreniyoruz · Pendik</small></div><div class="vt-rozet">OYUNLA OKÇULUK</div><div class="vt-saat" id="vt-saat"></div></div>
            <div class="vt-ekran" id="vt-ekran">${OYUNLAR.map((o) => `<div class="vt-r" data-id="${o.id}" style="background-image:url('/vitrin/${o.id}.webp')"></div>`).join('')}
                <div class="vt-alt3" id="vt-alt3"><div class="ik" id="vt-ik"></div><div class="gv"><h2 id="vt-bas"></h2><p id="vt-acik"></p></div></div>
                <div class="vt-ara" id="vt-ara"></div></div>
            <div class="vt-liste" id="vt-liste"><h4>OYUN LİSTESİ</h4>${OYUNLAR.map((o) => `<div class="vt-oge" data-id="${o.id}"><div class="k" style="background-image:url('/vitrin/${o.id}.webp')"></div><div style="min-width:0"><b>${o.ik} ${o.ad}</b><span>${o.kat}</span></div><div class="dol"></div></div>`).join('')}</div>
            <div class="vt-serit"><div class="rz">DAĞ OKÇULUK</div><div class="ak">${SERIT.concat(SERIT).map((s) => '<span>● ' + s + '</span>').join('')}</div></div>
        </div>
        <div class="vt-kontrol"><button type="button" id="vt-tam">⛶ Tam ekran</button><button type="button" class="kapat" id="vt-kapat">✕ Kapat</button></div>`;
        el.style.setProperty('--vt-sn', OYUN_SN / 1000 + 's');
        document.body.appendChild(el);
        return el;
    }

    function zamanla(fn, ms) { const n = V.nesil; V.zaman.push(setTimeout(function () { if (V && V.nesil === n) fn(); }, ms)); }

    function oyunGoster(i) {
        const o = OYUNLAR[i], el = V.el;
        el.querySelector('#vt-ara').classList.remove('on');
        el.querySelectorAll('.vt-r,.vt-oge').forEach((x) => x.classList.toggle('on', x.dataset.id === o.id));
        const a3 = el.querySelector('#vt-alt3'); a3.classList.remove('on');
        zamanla(function () { el.querySelector('#vt-ik').textContent = o.ik; el.querySelector('#vt-bas').textContent = o.ad; el.querySelector('#vt-acik').textContent = o.m; a3.classList.add('on'); }, 700);
        zamanla(function () { a3.classList.remove('on'); }, OYUN_SN - 600);
        const ara = ARALAR.find((x) => x.sonra === i);
        zamanla(function () { if (ara) araGoster(ara, i); else oyunGoster((i + 1) % OYUNLAR.length); }, OYUN_SN);
    }
    function araGoster(ara, i) {
        const k = V.el.querySelector('#vt-ara'); k.innerHTML = araHTML(ara.tip);
        V.el.querySelectorAll('.vt-oge').forEach((x) => x.classList.remove('on'));
        requestAnimationFrame(function () { k.classList.add('on'); });
        zamanla(function () { oyunGoster((i + 1) % OYUNLAR.length); }, ARA_SN);
    }

    function saat() { const e = V && V.el.querySelector('#vt-saat'), d = new Date(); if (e) e.textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
    function tamEkran() { const e = V && V.el; if (e && !document.fullscreenElement && e.requestFullscreen) e.requestFullscreen().catch(function () {}); }
    async function uyanikTut() { try { if (V && navigator.wakeLock && document.visibilityState === 'visible') V.kilit = await navigator.wakeLock.request('screen'); } catch (e) {} }
    function fareHareket() {
        if (!V) return; V.el.classList.add('fare'); clearTimeout(V.fareZ);
        V.fareZ = setTimeout(function () { if (V) V.el.classList.remove('fare'); }, 3000);
    }
    function tus(e) { if (e.key === 'Escape' && !document.fullscreenElement) vtKapat(); }
    function gorunurluk() { if (document.visibilityState === 'visible') uyanikTut(); }

    window.vtAc = function () {
        if (V) return;
        V = { el: kur(), nesil: 1, zaman: [], kilit: null };
        V.el.querySelector('#vt-kapat').onclick = vtKapat;
        V.el.querySelector('#vt-tam').onclick = tamEkran;
        V.el.addEventListener('mousemove', fareHareket); V.el.addEventListener('touchstart', fareHareket, { passive: true });
        document.addEventListener('keydown', tus); document.addEventListener('visibilitychange', gorunurluk);
        saat(); V.saatZ = setInterval(saat, 15000);
        tamEkran(); uyanikTut(); fareHareket();
        oyunGoster(0);
    };
    window.vtKapat = function () {
        if (!V) return;
        V.zaman.forEach(clearTimeout); clearInterval(V.saatZ); clearTimeout(V.fareZ);
        try { if (V.kilit) V.kilit.release(); } catch (e) {}
        document.removeEventListener('keydown', tus); document.removeEventListener('visibilitychange', gorunurluk);
        if (document.fullscreenElement === V.el && document.exitFullscreen) document.exitFullscreen().catch(function () {});
        V.el.remove(); V = null;
    };
    window.vtOyunlar = OYUNLAR;
})();
