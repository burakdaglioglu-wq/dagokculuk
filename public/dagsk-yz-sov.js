/* ================================================================================================
   🎤 DAĞ YETENEK ŞOVU — Sıralama turunun çocuklar için TV ekranı (2026-11-01, v363).
   Kullanıcı 6 taslaktan "D · Yetenek Şovu"nu seçti: "sıralama rastgele olsun — puan sıralamasında alt sırada kalan küçük
   çocuk kendini kötü hissediyor, karışık sıralama olsun".
   KURAL: tur boyunca PUAN SIRALAMASI HİÇ GÖSTERİLMEZ. Sağdaki liste kura (sahne) sırasıdır. Törende yalnız ilk 3 podyuma
   çıkar; diğer herkes KARIŞIK sırada kendi unvanıyla (ıskasız, en çok gelişen, sarı avcısı…) sahneye gelir — "sonuncu" yok.
   AKIŞ: her serinin başında şapkadan kura → sıradaki çocuk sahnede → koç okları girince (yzGirisAc, aynı skor kaydı) üç hayvan
   jüri okları kart kart kaldırır, alkış ölçer dolar → sıradaki → tur bitince (asama 'bitti') ödül töreni: 3., 2., 1.
   KURA: sporcular hash(tur id | seri | sporcu) ile karışır → her cihaz aynı sırayı görür, kayıt gerekmez. Önceki seride ilk
   çıkan bu seride başa düşmez. Gruplar ayrı açıksa (yzGorunum().grup) tören her yaş grubu için ayrı.
   Veri yalnız okunur (yzOku); yazma yok. Ekran 0,7 sn'de bir yerel kaydı yoklar (TV ile aynı yöntem).
   ================================================================================================ */
(function () {
    'use strict';
    const S = { acik: false, poll: null, ham: null, seri: null, asama: null, goruldu: null, kuyruk: [], mesgul: false, zaman: [], torenGrup: 0, torenAdim: 0, ses: true };
    const $ = (id) => document.getElementById(id);
    const esc_ = (t) => (typeof esc === 'function' ? esc(t) : String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])));
    const hash = (m) => { let h = 2166136261; m = String(m); for (let i = 0; i < m.length; i++) { h ^= m.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
    const ilk = (ad) => (typeof yzKisaAd === 'function' ? yzKisaAd(ad) : String(ad).split(' ')[0]);
    const kAd = (k) => k.slice(k.indexOf('|') + 1);
    const deger = (v) => (v === 'X' ? 10 : v === 'M' ? 0 : +v || 0);
    const renk = (v) => { const d = deger(v); return v === 'M' ? 'g' : d >= 9 ? 's' : d >= 7 ? 'r' : d >= 5 ? 'm' : 'g'; };
    const sonra = (fn, ms) => { const t = setTimeout(fn, ms); S.zaman.push(t); return t; };
    const zamanTemizle = () => { S.zaman.forEach(clearTimeout); S.zaman = []; };
    const sessiz = () => { try { return localStorage.getItem('dag_yz_sov_ses') === '0'; } catch (e) { return false; } };

    // ---- karakterler: çocuğun oyunlarda seçtiği hayvan (yoksa oyunlar bir tane atar); jüri sabit
    function karakterSrc(k) {
        try {
            const i = k.indexOf('|'), s = { g: k.slice(0, i), ad: k.slice(i + 1) };
            if (typeof kmOyunHayvanKarakterAta === 'function' && typeof kmOyunKarakterBilgi === 'function') return kmOyunKarakterBilgi(kmOyunHayvanKarakterAta(s)).src;
        } catch (e) {}
        return '/hayvankarakter/parcalar/hayvan-' + (1 + hash(k) % 9) + '.png';
    }
    const JURI = [{ ad: 'Jüri Hav', src: '/hayvankarakter/parcalar/hayvan-4.png' }, { ad: 'Jüri Boylu', src: '/hayvankarakter/parcalar/hayvan-7.png' }, { ad: 'Jüri Paytak', src: '/hayvankarakter/parcalar/hayvan-9.png' }];

    // ---- kura: belirlenimci karışık sıra
    function kura(d, seri) {
        const s = d.katilimci.slice().sort((a, b) => hash(d.id + '|' + seri + '|' + a) - hash(d.id + '|' + seri + '|' + b) || a.localeCompare(b));
        if (seri > 0 && s.length > 1) { const once = kura(d, seri - 1)[0]; if (s[0] === once) { s[0] = s[1]; s[1] = once; } }
        return s;
    }
    function hal(o) {
        const d = o.durum; if (!d || !d.asama || d.asama === 'kurulum') return { faz: 'yok' };
        if (d.asama === 'bitti') return { faz: 'toren', d };
        if (d.asama === 'eleme') return { faz: 'eleme', d };
        const f = yzFormat(d), seri = Math.min(d.seri, f.seri - 1), sira = kura(d, seri);
        const bitti = sira.filter((k) => yzSkor(o, k)[seri]), bekle = sira.filter((k) => !yzSkor(o, k)[seri]);
        return { faz: bekle.length ? 'sahne' : 'tamam', d, f, seri, sira, bitti, simdi: bekle[0] || null, sonraki: bekle[1] || null };
    }

    // ---- ses (yalnız Web Audio; şovun kendi ses düğmesi)
    let AC = null;
    function ac() { if (sessiz()) return null; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch (e) { return null; } }
    function ton(f, sure, tip, vol, gec) { const a = ac(); if (!a) return; const t = a.currentTime + (gec || 0), o = a.createOscillator(), g = a.createGain(); o.type = tip || 'triangle'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .12, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + sure); o.connect(g).connect(a.destination); o.start(t); o.stop(t + sure + .05); }
    function gurultu(sure, vol, gec, filtre) { const a = ac(); if (!a) return; const t = a.currentTime + (gec || 0), n = Math.floor(a.sampleRate * sure), b = a.createBuffer(1, n, a.sampleRate), c = b.getChannelData(0); for (let i = 0; i < n; i++) c[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = a.createBufferSource(), g = a.createGain(), fl = a.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = filtre || 1800; s.buffer = b; g.gain.value = vol || .2; s.connect(fl).connect(g).connect(a.destination); s.start(t); }
    const SES = {
        davul(ms) { for (let i = 0; i < ms / 70; i++) gurultu(.06, .14 + i * .004, i * .07, 220); },
        bom() { ton(90, .5, 'sine', .3); gurultu(.25, .2, 0, 160); },
        kart(i) { ton(660 + i * 110, .14, 'triangle', .1); },
        alkis(n) { for (let i = 0; i < (n || 14); i++) gurultu(.05, .16, i * .09 + Math.random() * .05, 2400); },
        fanfar() { [523, 659, 784, 1047].forEach((f, i) => ton(f, .35, 'triangle', .1, i * .13)); }
    };

    // ---- iskelet
    function iskelet() {
        let el = $('yz-sov'); if (el) return el;
        el = document.createElement('div'); el.id = 'yz-sov';
        el.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
              <linearGradient id="sov-kat" x1="0" x2="1"><stop offset="0" stop-color="#5c2531"/><stop offset=".18" stop-color="#9a4552"/><stop offset=".32" stop-color="#6d2c38"/><stop offset=".5" stop-color="#a24c5a"/><stop offset=".66" stop-color="#6a2a36"/><stop offset=".82" stop-color="#9a4552"/><stop offset="1" stop-color="#4e1f2a"/></linearGradient>
              <symbol id="sov-perde" viewBox="0 0 100 400" preserveAspectRatio="none"><path d="M0 0 H100 V250 C88 300 70 330 40 345 C24 352 10 370 0 400 Z" fill="url(#sov-kat)"/><path d="M78 250 C70 262 62 270 52 274" stroke="#e9c45a" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="80" cy="249" r="5" fill="#e9c45a"/></symbol>
              <symbol id="sov-valans" viewBox="0 0 1000 60" preserveAspectRatio="none"><path d="M0 0 H1000 V36 ${Array.from({ length: 20 }, (_, i) => 'Q' + (975 - i * 50) + ' 60 ' + (950 - i * 50) + ' 36').join(' ')} Z" fill="#7a3340"/><path d="M0 30 H1000" stroke="#e9c45a" stroke-width="3"/></symbol>
            </defs></svg>
            <div class="sv-isik"></div><div class="sv-isik-yer"></div>
            <svg class="sv-perde sol"><use href="#sov-perde"/></svg><svg class="sv-perde sag"><use href="#sov-perde"/></svg>
            <svg class="sv-valans"><use href="#sov-valans"/></svg>
            <div class="sv-tabela" id="sv-tabela">🎤 DAĞ YETENEK ŞOVU</div>
            <div class="sv-zemin"></div>
            <div class="sv-on-isik">${'<i></i>'.repeat(10)}</div>
            <div id="sv-orta"></div>
            <div class="sv-sira" id="sv-sira"></div>
            <div class="sv-hedef" id="sv-hedef"></div>
            <div class="sv-seyirci" id="sv-seyirci">${Array.from({ length: 14 }, (_, i) => '<i' + (i % 2 ? ' class="el"' : '') + '></i>').join('')}</div>
            <div class="sv-konfeti" id="sv-konfeti"></div>
            <div class="sv-arac"><button id="sv-gir" title="Sahnedeki sporcunun skorunu gir">✏️ Skor gir</button><button id="sv-kura" title="Kurayı yeniden göster">🎩</button><button id="sv-ses" title="Ses"></button><button id="sv-tam" title="Tam ekran">⛶</button><button id="sv-kapat" title="Kapat">✕</button></div>`;
        document.body.appendChild(el);
        $('sv-kapat').onclick = window.yzSovKapat;
        $('sv-tam').onclick = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {} };
        $('sv-ses').onclick = () => { try { localStorage.setItem('dag_yz_sov_ses', sessiz() ? '1' : '0'); } catch (e) {} sesDugme(); if (!sessiz()) SES.kart(0); };
        $('sv-kura').onclick = () => { const h = hal(yzOku()); if (h.faz === 'sahne' || h.faz === 'tamam') { zamanTemizle(); S.mesgul = false; S.kuyruk = []; kuraGoster(h); } };
        $('sv-gir').onclick = () => { const h = hal(yzOku()); if (h.faz === 'sahne' && h.simdi && typeof yzGirisAc === 'function') yzGirisAc(yzEnc(h.simdi), h.seri); };
        sesDugme(); css();
        return el;
    }
    function sesDugme() { const b = $('sv-ses'); if (b) b.textContent = sessiz() ? '🔇' : '🔊'; }

    // ---- yardımcı parçalar
    const kImg = (k, cls) => `<img class="${cls || 'sv-k'}" src="${esc_(karakterSrc(k))}" alt="${esc_(ilk(kAd(k)))}">`;
    function konfeti(n) {
        const c = $('sv-konfeti'); if (!c) return; const r = ['#e9c45a', '#e0796b', '#7cb7e8', '#6ccf96', '#f59e5b'];
        c.innerHTML = Array.from({ length: n || 26 }, (_, i) => `<i style="left:${(i * 37 + 7) % 96 + 2}%;background:${r[i % r.length]};animation-delay:${-(i * 0.29 % 3.4).toFixed(2)}s"></i>`).join('');
        sonra(() => { c.innerHTML = ''; }, 5200);
    }
    function alkisSeyirci(on) { const s = $('sv-seyirci'); if (s) s.classList.toggle('alkis', !!on); }
    function hedefCiz(o, h) {
        const e = $('sv-hedef'); if (!e) return;
        if (!h.d || h.faz === 'toren' || h.faz === 'yok') { e.innerHTML = ''; return; }
        const f = yzFormat(h.d), top = h.d.katilimci.reduce((a, k) => a + (yzSkor(o, k) || []).reduce((b, s) => b + (s ? s.reduce((c, v) => c + deger(v), 0) : 0), 0), 0);
        const hedef = Math.max(50, Math.round(h.d.katilimci.length * f.seri * f.ok * 7 / 50) * 50);
        e.innerHTML = `<span>🤝 Sınıfça ${hedef} puan</span><span class="sv-bar"><i style="width:${Math.min(100, top / hedef * 100).toFixed(1)}%"></i></span><span>${top}</span>`;
    }
    function siraCiz(o, h) {
        const e = $('sv-sira'); if (!e) return;
        if (h.faz !== 'sahne' && h.faz !== 'tamam') { e.innerHTML = ''; e.hidden = true; return; }
        e.hidden = false;
        const sat = (k, i) => {
            const s = yzSkor(o, k)[h.seri], top = s ? s.reduce((a, v) => a + deger(v), 0) : null, cls = s ? 'bitti' : k === h.simdi ? 'simdi' : k === h.sonraki ? 'sonra' : 'sonra gizli';
            const sag = s ? top : k === h.simdi ? '🎤 sahnede' : k === h.sonraki ? 'sıradaki' : 'kura';
            return `<div class="sv-sr ${cls}"><span class="n">${i + 1}</span>${kImg(k)}<span class="a">${cls.indexOf('gizli') >= 0 ? '?' : esc_(ilk(kAd(k)))}</span><span class="p">${sag}</span></div>`;
        };
        e.innerHTML = `<h4>Sahne sırası <small>kura · seri ${h.seri + 1}/${h.f.seri}</small></h4>` + h.sira.map(sat).join('');
    }

    // ---- sahneler
    function kuraGoster(h) {
        S.mesgul = true; alkisSeyirci(false);
        const o = $('sv-orta'), k = h.simdi || h.sira[0];
        o.innerHTML = `<div class="sv-kura-yazi"><small>Seri ${h.seri + 1} · kura çekiliyor</small>Sıradaki yıldız…</div>
            <div class="sv-ucan" style="left:30%;top:42%;--r:-14deg">?</div><div class="sv-ucan" style="left:63%;top:38%;--r:12deg">?</div><div class="sv-ucan" style="left:68%;top:56%;--r:-6deg">?</div>
            <div class="sv-sapka"><svg viewBox="0 0 200 150"><ellipse cx="100" cy="136" rx="98" ry="14" fill="#14101a"/><path d="M45 132 L52 30 Q100 18 148 30 L155 132 Z" fill="#2a2333"/><path d="M50 96 Q100 108 150 96 L151 118 Q100 130 49 118 Z" fill="#8a3b47"/><ellipse cx="100" cy="30" rx="48" ry="11" fill="#1a1520"/></svg></div>
            <div class="sv-davul"><svg viewBox="0 0 100 100"><ellipse cx="50" cy="40" rx="40" ry="12" fill="#f4e6cf"/><path d="M10 40 V76 Q50 92 90 76 V40 Q50 56 10 40Z" fill="#8a3b47"/><path d="M14 44 L30 80 M30 48 L46 84 M50 50 L62 84 M70 48 L78 82" stroke="#e9c45a" stroke-width="3"/><g class="t"><path d="M88 6 L52 36" stroke="#c9a37a" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="38" r="6" fill="#f4e6cf"/></g></svg></div>`;
        SES.davul(1700);
        sonra(() => {
            if (!k) return;
            o.insertAdjacentHTML('beforeend', `<div class="sv-cikan">${kImg(k)}<span class="sv-ad">${esc_(ilk(kAd(k)))}!</span></div>`);
            SES.bom(); SES.alkis(10); alkisSeyirci(true);
        }, 1800);
        sonra(() => { S.mesgul = false; alkisSeyirci(false); S.kuraBitti = h.seri; ciz(true); }, 4300);
    }
    function sahneGoster(h) {
        const o = $('sv-orta');
        if (!h.simdi) return;
        o.innerHTML = `<div class="sv-sanatci giris">${kImg(h.simdi)}<span class="sv-ad">${esc_(ilk(kAd(h.simdi)))}</span><small>Seri ${h.seri + 1} · ${h.f.ok} ok</small></div>
            <div class="sv-juri"><div class="sv-hakemler">${JURI.map((j) => `<div class="sv-hakem"><img class="sv-k" src="${j.src}" alt="${j.ad}"><span class="sv-plaka">${j.ad}</span></div>`).join('')}</div><div class="sv-masa"></div></div>
            <div class="sv-bekle">🎯 Atış yapıyor…</div>`;
    }
    function tamamGoster(h) {
        alkisSeyirci(true);
        $('sv-orta').innerHTML = `<div class="sv-tamam"><b>👏 Seri ${h.seri + 1} tamam!</b><span>Herkes sahneye çıktı. Sıradaki seri için kura birazdan…</span></div>
            <div class="sv-grup-foto">${h.sira.map((k) => kImg(k)).join('')}</div>`;
    }
    // Koç bir sporcunun serisini girdi → jüri kartları
    function sonucGoster(o, k, seri, sonrakiFn) {
        S.mesgul = true; alkisSeyirci(false);
        const d = o.durum, oklar = (yzSkor(o, k)[seri] || []).slice(), top = oklar.reduce((a, v) => a + deger(v), 0), f = yzFormat(d);
        const r = (typeof yzSiralama === 'function' ? yzSiralama(o) : []).find((x) => x.k === k), bek = r && r.ortOk ? r.ortOk * oklar.length : null;
        const iyi = bek ? top >= bek : top >= oklar.length * 7, oran = Math.max(.08, Math.min(1, top / (oklar.length * 10 || 1)));
        const or = $('sv-orta');
        or.innerHTML = `<div class="sv-sanatci">${kImg(k)}<span class="sv-ad">${esc_(ilk(kAd(k)))}</span><small>Seri ${seri + 1} · ${oklar.length} ok</small></div>
            <div class="sv-juri"><div class="sv-hakemler">${JURI.map((j, i) => `<div class="sv-hakem" id="sv-h${i}"><img class="sv-k" src="${j.src}" alt="${j.ad}"><span class="sv-plaka">${j.ad}</span></div>`).join('')}</div><div class="sv-masa"></div></div>
            <div class="sv-alkis"><svg viewBox="0 0 100 60"><path d="M10 54 A40 40 0 0 1 90 54" stroke="#00000066" stroke-width="12" fill="none" stroke-linecap="round"/><path id="sv-alkis-yay" d="M10 54 A40 40 0 0 1 90 54" stroke="#f59e5b" stroke-width="12" fill="none" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100"/></svg><b id="sv-alkis-yazi">👏</b></div>`;
        const tur = Math.ceil(oklar.length / 3);
        let t = 400;
        for (let p = 0; p < tur; p++) {
            const parca = oklar.slice(p * 3, p * 3 + 3);
            sonra(() => { JURI.forEach((_, i) => { const e = $('sv-h' + i); if (e) { const eski = e.querySelector('.sv-kart'); if (eski) eski.remove(); } }); }, t - 50);
            parca.forEach((v, i) => sonra(() => {
                const e = $('sv-h' + i); if (!e) return;
                e.insertAdjacentHTML('afterbegin', `<span class="sv-kart ${renk(v)}${v === 'X' ? ' x' : ''}" style="--r:${[-7, 2, 8][i]}deg">${v === 'M' ? '–' : v}</span>`);
                SES.kart(i); if (v === 'M') sonra(() => juriKonus(i, 'Olsun, sonraki oka!'), 250);
            }, t + i * 650));
            t += parca.length * 650 + 900;
        }
        sonra(() => {
            or.insertAdjacentHTML('beforeend', `<div class="sv-toplam">${top}!<small>bu seri</small></div>`);
            const y = $('sv-alkis-yay'); if (y) y.setAttribute('stroke-dasharray', (oran * 100).toFixed(0) + ' 100');
            const yz = $('sv-alkis-yazi'); if (yz) yz.textContent = oran >= .85 ? '👏 Ayakta alkış!' : oran >= .7 ? '👏 Harika!' : oran >= .5 ? '👏 Süper!' : '👏 Aferin!';
            alkisSeyirci(true); SES.alkis(iyi ? 22 : 12);
            if (iyi) { konfeti(); SES.fanfar(); juriKonus(1, oklar.some((v) => v === 'X') ? 'X! Tam ortadan!' : 'Kendi rekoruna yakın, bravo!'); }
            else juriKonus(0, 'Her ok daha iyi, devam!');
        }, t);
        sonra(() => { alkisSeyirci(false); S.mesgul = false; if (sonrakiFn) sonrakiFn(); }, t + 3600);
    }
    function juriKonus(i, metin) { const e = $('sv-h' + i); if (!e) return; const b = document.createElement('span'); b.className = 'sv-balon'; b.textContent = metin; e.appendChild(b); sonra(() => b.remove(), 2600); }

    // ---- tören
    function unvanlar(o, liste) {
        const sat = liste.map((r) => {
            const s = (yzSkor(o, r.k) || []).filter(Boolean), oklar = [].concat.apply([], s), tops = s.map((x) => x.reduce((a, v) => a + deger(v), 0));
            const ort = tops.length ? tops.reduce((a, b) => a + b, 0) / tops.length : 0, sapma = tops.length > 1 ? Math.sqrt(tops.reduce((a, b) => a + (b - ort) * (b - ort), 0) / tops.length) : 99;
            return { r, iska: oklar.filter((v) => v === 'M').length, sari: oklar.filter((v) => deger(v) >= 9).length, enIyi: Math.max(0, ...tops), sapma, gel: r.gelisim == null ? -1e9 : r.gelisim, ok: oklar.length };
        });
        const kural = [
            ['🎯 Iskasız', (x) => x.ok && !x.iska ? 1000 - x.ok : -1],
            ['📈 En çok gelişen', (x) => x.gel > 0 ? x.gel : -1],
            ['⭐ Sarı avcısı', (x) => x.sari > 0 ? x.sari : -1],
            ['🧊 Sabit nişancı', (x) => x.sapma < 99 ? 100 - x.sapma : -1],
            ['🔥 En iyi seri', (x) => x.enIyi || -1]
        ], ver = {}, kalan = sat.slice();
        kural.forEach(([ad, f]) => { const e = kalan.filter((x) => f(x) >= 0).sort((a, b) => f(b) - f(a))[0]; if (e) { ver[e.r.k] = ad; kalan.splice(kalan.indexOf(e), 1); } });
        const yedek = ['💪 Pes etmeyen', '😊 Sahnenin neşesi', '🌱 Her seri daha iyi', '🤝 Takım ruhu', '🎵 Ritmi yakalayan'];
        kalan.forEach((x, i) => { ver[x.r.k] = yedek[i % yedek.length]; });
        return ver;
    }
    function torenGruplar(o) {
        const sira = yzSiralama(o), gr = typeof yzGruplar === 'function' ? yzGruplar(o, sira) : [{ ad: null, liste: sira }];
        return gr.filter((g) => g.liste.some((r) => r.toplam > 0));
    }
    function torenGoster(o, yeniden) {
        const gruplar = torenGruplar(o); if (!gruplar.length) { $('sv-orta').innerHTML = '<div class="sv-tamam"><b>🎤 Şov bitti!</b><span>Puan girilmedi.</span></div>'; return; }
        if (S.torenGrup >= gruplar.length) S.torenGrup = 0;
        const g = gruplar[S.torenGrup], d = o.durum, ilk3 = g.liste.filter((r) => r.toplam > 0).slice(0, 3), digerleri = g.liste.filter((r) => ilk3.indexOf(r) < 0);
        // karışık sıra: diğerleri puana göre değil, tura özel karışık
        digerleri.sort((a, b) => hash(d.id + '|t|' + a.k) - hash(d.id + '|t|' + b.k));
        const unv = unvanlar(o, digerleri);
        $('sv-tabela').textContent = '🏆 GECENİN YILDIZLARI' + (g.ad ? ' · ' + g.ad.replace(/^[^\wÇĞİÖŞÜçğıöşü]+\s*/, '') : '');
        const bas = (r, n) => r ? `<div class="sv-bas b${n}" id="sv-b${n}"><span class="sv-madalya">${['', '🥇', '🥈', '🥉'][n]}</span>${kImg(r.k)}<div class="sv-blok"><b>${n}</b><span>${esc_(ilk(r.ad))} · ${r.toplam}</span></div></div>` : `<div class="sv-bas b${n} bos"></div>`;
        $('sv-orta').innerHTML = `<div class="sv-perde-kapali" id="sv-pk"></div>
            <div class="sv-podyum">${bas(ilk3[1], 2)}${bas(ilk3[0], 1)}${bas(ilk3[2], 3)}</div>
            <div class="sv-herkes" id="sv-herkes">${digerleri.map((r) => `<div>${kImg(r.k)}<b>${esc_(ilk(r.ad))}</b><small>${esc_(unv[r.k])}</small></div>`).join('')}</div>
            ${gruplar.length > 1 ? `<button class="sv-sonraki" id="sv-sonraki">${S.torenGrup + 1}/${gruplar.length} · Sonraki grup ▶</button>` : ''}`;
        const sb = $('sv-sonraki'); if (sb) sb.onclick = () => { zamanTemizle(); S.torenGrup = (S.torenGrup + 1) % gruplar.length; torenGoster(o, true); };
        const or = $('sv-orta'); or.classList.remove('acik3', 'acik2', 'acik1', 'acikh'); void or.offsetWidth;
        SES.davul(1200);
        sonra(() => { or.classList.add('acik3'); SES.bom(); SES.alkis(10); }, 1400);
        sonra(() => { SES.davul(1200); }, 2600);
        sonra(() => { or.classList.add('acik2'); SES.bom(); SES.alkis(12); }, 4000);
        sonra(() => { SES.davul(1600); }, 5200);
        sonra(() => { or.classList.add('acik1'); SES.bom(); SES.fanfar(); SES.alkis(26); konfeti(34); alkisSeyirci(true); }, 7000);
        sonra(() => { or.classList.add('acikh'); }, 8600);
        if (gruplar.length > 1) sonra(() => { S.torenGrup = (S.torenGrup + 1) % gruplar.length; torenGoster(o, true); }, 20000);
    }

    // ---- ana çizim + değişiklik izleme
    function ciz(zorla) {
        if (!S.acik) return;
        const o = yzOku(), h = hal(o);
        hedefCiz(o, h);
        if (S.mesgul && !zorla) { siraCiz(o, h); return; }
        // yeni girilen seri(ler)i sıraya al
        // (tur|seri|sporcu) bir kez gösterilir; önceki seriye de bakılır — koç son skoru girip hemen sonraki seriye geçerse kaçmasın
        if (h.d && h.f) {
            const yeni = [];
            [h.seri - 1, h.seri].filter((s) => s >= 0).forEach((s) => kura(h.d, s).forEach((k) => { if (yzSkor(o, k)[s]) yeni.push({ k, seri: s, a: h.d.id + '|' + s + '|' + k }); }));
            if (!S.goruldu) S.goruldu = new Set(yeni.map((x) => x.a));
            else yeni.forEach((x) => { if (!S.goruldu.has(x.a)) { S.goruldu.add(x.a); S.kuyruk.push(x); } });
        }
        if (S.kuyruk.length) { const q = S.kuyruk.shift(); siraCiz(o, h); return sonucGoster(o, q.k, q.seri, () => ciz(true)); }
        siraCiz(o, h);
        const or = $('sv-orta');
        if (h.faz !== 'toren') { $('sv-tabela').textContent = '🎤 DAĞ YETENEK ŞOVU'; or.classList.remove('acik3', 'acik2', 'acik1', 'acikh'); }
        if (h.faz === 'yok') { or.innerHTML = '<div class="sv-tamam"><b>🎤 Şov birazdan başlıyor</b><span>Yarışma ekranından bir sıralama turu başlatınca perde açılır.</span></div>'; S.asama = 'yok'; return; }
        if (h.faz === 'eleme') { if (S.asama !== 'eleme') or.innerHTML = '<div class="sv-tamam"><b>⚔️ Eleme maçları</b><span>Maçlar yarışma ekranında. Tur bitince tören burada.</span></div>'; S.asama = 'eleme'; return; }
        if (h.faz === 'toren') { if (S.asama !== 'toren') { S.asama = 'toren'; S.torenGrup = 0; zamanTemizle(); S.mesgul = false; torenGoster(o); } return; }
        S.asama = h.faz;
        if (S.kuraBitti !== h.seri && h.faz === 'sahne' && h.bitti.length === 0) return kuraGoster(h);
        S.kuraBitti = h.seri;
        if (h.faz === 'tamam') return tamamGoster(h);
        const cur = or.querySelector('.sv-sanatci .sv-ad');
        if (!cur || cur.textContent !== ilk(kAd(h.simdi)) || or.querySelector('.sv-toplam')) sahneGoster(h);
    }

    window.yzSovAc = function () {
        if (typeof yzOku !== 'function') { if (typeof showToast === 'function') showToast('Önce Yarışma ekranını aç.', 'warning'); return; }
        iskelet(); S.acik = true; S.ham = null; S.asama = null; S.goruldu = null; S.kuyruk = []; S.mesgul = false; S.kuraBitti = null;
        document.documentElement.classList.add('yz-sov-acik');
        try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); } catch (e) {}
        ac();
        ciz();
        clearInterval(S.poll);
        S.poll = setInterval(() => { let h = null; try { h = localStorage.getItem(yzAnahtar()); } catch (e) {} if (h !== S.ham) { S.ham = h; ciz(); } }, 700);
        S.ham = localStorage.getItem(yzAnahtar());
    };
    window.yzSovKapat = function () {
        S.acik = false; clearInterval(S.poll); S.poll = null; zamanTemizle();
        const el = $('yz-sov'); if (el) el.remove();
        document.documentElement.classList.remove('yz-sov-acik');
        try { if (document.fullscreenElement && !(typeof _yz !== 'undefined' && _yz.tv)) document.exitFullscreen(); } catch (e) {}
    };
    // test/geliştirme için
    window.yzSovKura = kura; window.yzSovHal = hal; window.yzSovUnvanlar = unvanlar;

    function css() {
        if ($('yz-sov-css')) return;
        const st = document.createElement('style'); st.id = 'yz-sov-css';
        st.textContent = `
#yz-sov{position:fixed;inset:0;z-index:31600;overflow:hidden;font-family:"Baloo 2","Nunito","Trebuchet MS",system-ui,sans-serif;color:#f4ece4;font-size:min(1.15vw,2.05vh);background:radial-gradient(ellipse 60% 70% at 46% 30%,#2b1d25,#1a1218);user-select:none}
#yz-sov .sv-k{display:block;object-fit:contain}
.sv-perde{position:absolute;top:0;height:82%;width:15%;z-index:3}.sv-perde.sol{left:0}.sv-perde.sag{right:0;transform:scaleX(-1)}
.sv-valans{position:absolute;left:0;top:0;width:100%;height:9%;z-index:4}
.sv-zemin{position:absolute;left:0;right:0;bottom:0;height:26%;background:repeating-linear-gradient(90deg,#7a5236 0 9%,#5b3c27 9% 9.3%),#7a5236;z-index:1}
.sv-zemin::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),transparent 40%,rgba(0,0,0,.25))}
.sv-on-isik{position:absolute;left:12%;right:12%;bottom:25%;height:2.4%;display:flex;justify-content:space-between;z-index:2}
.sv-on-isik i{width:1.4%;aspect-ratio:1;border-radius:50%;background:#ffe7a3;box-shadow:0 0 10px 3px #ffe7a38c}
.sv-tabela{position:absolute;top:10.5%;left:50%;transform:translateX(-50%);z-index:5;padding:.5em 1.6em .4em;border-radius:1.2em;background:#3a2531;border:.22em solid #b98f2e;font-weight:800;font-size:1.7em;letter-spacing:.04em;color:#e9c45a;white-space:nowrap}
.sv-isik{position:absolute;top:0;left:50%;width:46%;height:82%;transform:translateX(-50%);background:linear-gradient(180deg,#ffe7a357,#ffe7a31a);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);z-index:2;pointer-events:none}
.sv-isik-yer{position:absolute;left:50%;bottom:20%;width:34%;height:9%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse,#ffe7a373,transparent 70%);z-index:2}
.sv-seyirci{position:absolute;left:0;right:0;bottom:-4%;height:10%;z-index:5;display:flex;justify-content:space-around;align-items:flex-end;padding:0 2%;pointer-events:none}
.sv-seyirci i{width:4.2%;aspect-ratio:1/1.25;border-radius:50% 50% 30% 30%;background:#0f0c11;position:relative}
.sv-seyirci i::after{content:"";position:absolute;width:60%;aspect-ratio:1;border-radius:50%;background:#0f0c11;left:20%;top:-48%}
.sv-seyirci i.el::before{content:"";position:absolute;width:22%;height:90%;background:#0f0c11;border-radius:99px;left:-12%;top:-78%;transform:rotate(-18deg);opacity:0;transition:opacity .3s}
.sv-seyirci.alkis i.el::before{opacity:1;animation:sv-el .45s ease-in-out infinite}
@keyframes sv-el{0%,100%{transform:rotate(-18deg) translateY(0)}50%{transform:rotate(-8deg) translateY(-12%)}}
.sv-konfeti{position:absolute;inset:0;z-index:12;pointer-events:none;overflow:hidden}
.sv-konfeti i{position:absolute;top:-4%;width:.7%;aspect-ratio:1/1.8;border-radius:2px;animation:sv-dus 3.4s linear infinite}
@keyframes sv-dus{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(1100%) rotate(540deg)}}
@keyframes sv-zipla{0%,100%{transform:translateY(0)}50%{transform:translateY(-5%)}}
@keyframes sv-kalk{0%{transform:translateY(40%) rotate(0);opacity:0}70%{opacity:1}100%{transform:translateY(0) rotate(var(--r));opacity:1}}
@keyframes sv-gir{0%{transform:translateX(160%)}100%{transform:translateX(0)}}
@keyframes sv-cik{0%{transform:translate(-50%,60%) scale(.5);opacity:0}60%{opacity:1}100%{transform:translate(-50%,0) scale(1);opacity:1}}
@keyframes sv-tokmak{0%,100%{transform:rotate(-20deg)}50%{transform:rotate(10deg)}}
@keyframes sv-ucan{0%{transform:translateY(60%) rotate(0) scale(.6);opacity:0}100%{transform:translateY(0) rotate(var(--r)) scale(1);opacity:1}}
#sv-orta{position:absolute;inset:0;z-index:6}
.sv-ad{margin-top:-.3em;font-weight:800;font-size:1.9em;line-height:1;background:#e9c45a;color:#2a1a10;border-radius:.5em;padding:.15em .6em .05em;box-shadow:0 .2em 0 #b98f2e;white-space:nowrap}
.sv-sanatci{position:absolute;left:50%;bottom:34%;width:13%;transform:translateX(-50%);z-index:6;display:grid;grid-template-columns:100%;justify-items:center}
.sv-sanatci>.sv-k{width:100%;aspect-ratio:1;animation:sv-zipla 1.1s ease-in-out infinite;filter:drop-shadow(0 .6em .5em rgba(0,0,0,.35))}
.sv-sanatci.giris{animation:sv-gir .9s cubic-bezier(.3,1.3,.5,1) both}
.sv-sanatci small{margin-top:.35em;font-weight:800;font-size:.95em;background:rgba(0,0,0,.35);border-radius:999px;padding:.1em .7em;font-family:"Nunito",system-ui,sans-serif}
.sv-bekle{position:absolute;left:59%;bottom:60%;z-index:7;font-weight:800;font-size:1.2em;background:rgba(0,0,0,.4);border-radius:1em;padding:.2em .8em}
.sv-juri{position:absolute;left:14%;right:30%;bottom:5%;height:22%;z-index:9}
.sv-masa{position:absolute;left:0;right:0;bottom:0;height:46%;border-radius:.8em .8em .3em .3em;background:linear-gradient(180deg,#4a3040,#36222f);border-top:.25em solid #b98f2e}
.sv-hakemler{position:absolute;left:0;right:0;bottom:30%;display:flex;justify-content:space-around}
.sv-hakem{position:relative;width:22%;display:grid;justify-items:center}
.sv-hakem>.sv-k{width:70%;aspect-ratio:1}
.sv-plaka{position:absolute;bottom:-44%;font-size:.8em;font-weight:800;background:#1d1418;color:#e9c45a;border-radius:.4em;padding:.1em .6em;white-space:nowrap;z-index:2;font-family:"Nunito",system-ui,sans-serif}
.sv-kart{position:absolute;bottom:86%;width:54%;aspect-ratio:3/2.3;display:grid;place-items:center;border-radius:.45em;font-weight:800;font-size:2.4em;color:#241812;border:.14em solid #fff8;animation:sv-kalk .8s cubic-bezier(.3,1.4,.5,1) both}
.sv-kart::after{content:"";position:absolute;left:46%;width:8%;top:100%;height:40%;background:#c9a37a;border-radius:0 0 3px 3px}
.sv-kart.s{background:#e9c45a}.sv-kart.r{background:#e0796b}.sv-kart.m{background:#7cb7e8}.sv-kart.g{background:#cfc6bd}
.sv-kart.x{background:linear-gradient(135deg,#f6dc85,#e9c45a 45%,#fff3c4 55%,#e9c45a);box-shadow:0 0 1.2em #ffe7a3}
.sv-balon{position:absolute;bottom:180%;left:50%;transform:translateX(-50%);white-space:nowrap;background:#fff3dd;color:#2a1a10;font-weight:800;font-size:.95em;border-radius:1em;padding:.2em .8em;z-index:3;font-family:"Nunito",system-ui,sans-serif}
.sv-toplam{position:absolute;left:59%;bottom:60%;z-index:7;font-weight:800;background:#fff3dd;color:#2a1a10;border-radius:1em;padding:.25em .9em;font-size:1.8em;box-shadow:0 .2em 0 #0004;animation:sv-ucan .5s ease-out both;--r:0deg}
.sv-toplam small{display:block;font-size:.45em;color:#7a5a40}
.sv-alkis{position:absolute;left:3.5%;top:26%;width:10%;z-index:6;display:grid;justify-items:center;gap:.3em}
.sv-alkis svg{width:100%;overflow:visible}.sv-alkis b{font-size:1.1em;text-align:center;line-height:1.1}
#sv-alkis-yay{transition:stroke-dasharray 1.2s ease-out}
.sv-sira{position:absolute;right:2.2%;top:24%;width:22%;z-index:7;display:grid;gap:.35em;background:rgba(20,14,18,.78);border-radius:1em;padding:.7em;max-height:52%;overflow:hidden}
.sv-sira[hidden]{display:none}
.sv-sira h4{margin:0 0 .2em;font-size:1.1em;color:#e9c45a;display:flex;justify-content:space-between;align-items:baseline;gap:.5em}
.sv-sira h4 small{font-family:"Nunito",system-ui,sans-serif;font-size:.72em;color:#a99f97;font-weight:700}
.sv-sr{display:grid;grid-template-columns:1.5em 2.1em minmax(0,1fr) auto;gap:.4em;align-items:center;background:#ffffff0d;border-radius:.6em;padding:.2em .45em;font-weight:800;font-size:.95em}
.sv-sr .n{color:#a99f97;text-align:center}.sv-sr .sv-k{width:2.1em;height:2.1em}.sv-sr .a{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sv-sr .p{font-size:1.15em}.sv-sr.simdi{background:#e9c45a42;outline:.12em solid #e9c45a}.sv-sr.simdi .p{font-size:.8em;color:#e9c45a}
.sv-sr.sonra .p{font-size:.8em;color:#a99f97}.sv-sr.gizli .sv-k{filter:brightness(0) opacity(.45)}
.sv-hedef{position:absolute;left:16%;right:32%;top:22.5%;z-index:5;display:grid;grid-template-columns:auto 1fr auto;gap:.6em;align-items:center;font-weight:800;font-size:.9em;font-family:"Nunito",system-ui,sans-serif}
.sv-hedef:empty{display:none}
.sv-hedef>span:first-child,.sv-hedef>span:last-child{background:rgba(0,0,0,.35);border-radius:99px;padding:.05em .6em}
.sv-bar{height:.7em;border-radius:99px;background:rgba(0,0,0,.4);overflow:hidden}.sv-bar i{display:block;height:100%;background:#6ccf96;border-radius:inherit;transition:width 1s}
.sv-kura-yazi{position:absolute;left:50%;top:27%;transform:translateX(-50%);z-index:6;text-align:center;font-weight:800;font-size:2.2em;line-height:1.05;white-space:nowrap}
.sv-kura-yazi small{display:block;font-family:"Nunito",system-ui,sans-serif;font-weight:800;font-size:.42em;color:#a99f97;letter-spacing:.08em;text-transform:uppercase}
.sv-ucan{position:absolute;z-index:5;width:7.5%;aspect-ratio:3/4;border-radius:.5em;background:#fff3dd;color:#6a4a35;display:grid;place-items:center;font-weight:800;font-size:1.7em;box-shadow:0 .3em .4em #0005;animation:sv-ucan .7s ease-out both}
.sv-ucan:nth-of-type(3){animation-delay:.25s}.sv-ucan:nth-of-type(4){animation-delay:.5s}
.sv-sapka{position:absolute;left:50%;bottom:22%;width:22%;transform:translateX(-50%);z-index:6}.sv-sapka svg{width:100%;display:block}
.sv-cikan{position:absolute;left:50%;bottom:39%;width:11%;z-index:7;transform:translate(-50%,0);animation:sv-cik 1.2s cubic-bezier(.3,1.5,.5,1) both;display:grid;grid-template-columns:100%;justify-items:center}
.sv-cikan .sv-k{width:100%;aspect-ratio:1}
.sv-davul{position:absolute;left:4%;bottom:24%;width:10%;z-index:6}.sv-davul svg{width:100%;display:block;overflow:visible}
.sv-davul .t{transform-origin:85% 90%;animation:sv-tokmak .25s ease-in-out infinite}
.sv-tamam{position:absolute;left:50%;top:38%;transform:translateX(-50%);z-index:7;display:grid;gap:.3em;text-align:center;background:rgba(20,14,18,.7);border-radius:1.2em;padding:1em 2em;max-width:60%}
.sv-tamam b{font-size:2.4em;line-height:1.1}.sv-tamam span{font-family:"Nunito",system-ui,sans-serif;font-weight:700;color:#d8cfc6;font-size:1.1em}
.sv-grup-foto{position:absolute;left:50%;bottom:22%;transform:translateX(-50%);z-index:6;display:flex;gap:.4em;max-width:62%;flex-wrap:wrap;justify-content:center}
.sv-grup-foto .sv-k{width:5.2em;height:5.2em;animation:sv-zipla 1.2s ease-in-out infinite}
.sv-grup-foto .sv-k:nth-child(2n){animation-delay:-.4s}.sv-grup-foto .sv-k:nth-child(3n){animation-delay:-.8s}
.sv-podyum{position:absolute;left:50%;bottom:21%;width:52%;transform:translateX(-50%);z-index:6;display:grid;grid-template-columns:1fr 1.1fr 1fr;align-items:end;gap:.4em}
.sv-bas{display:grid;grid-template-columns:100%;justify-items:center;opacity:0;transform:translateY(30%);transition:opacity .6s,transform .8s cubic-bezier(.3,1.4,.5,1)}
.sv-bas .sv-k{width:72%;aspect-ratio:1}.sv-bas.bos{visibility:hidden}
#sv-orta.acik3 .b3,#sv-orta.acik2 .b2,#sv-orta.acik1 .b1{opacity:1;transform:none}
.sv-blok{width:100%;display:grid;place-items:center;align-content:start;padding-top:.3em;border-radius:.6em .6em 0 0;font-weight:800;color:#2a1a10}
.sv-blok b{font-size:2.2em;line-height:1}.sv-blok span{font-size:1.05em;padding:0 .3em;text-align:center}
.b1 .sv-blok{height:7.5em;background:linear-gradient(180deg,#e9c45a,#b98f2e)}.b1 .sv-k{width:86%;animation:sv-zipla 1s ease-in-out infinite}
.b2 .sv-blok{height:5.4em;background:linear-gradient(180deg,#d8dce4,#a5abb8)}.b3 .sv-blok{height:4.2em;background:linear-gradient(180deg,#e2a77a,#b9774c)}
.sv-madalya{font-size:2.6em;line-height:1;margin-bottom:-.2em}
.sv-herkes{position:absolute;left:50%;bottom:3.5%;transform:translateX(-50%);z-index:13;display:flex;flex-wrap:wrap;justify-content:center;gap:.5em .8em;background:rgba(20,14,18,.82);border-radius:1em;padding:.5em 1em;max-width:84%;opacity:0;transition:opacity .8s}
#sv-orta.acikh .sv-herkes{opacity:1}.sv-herkes:empty{display:none}
.sv-herkes div{display:grid;justify-items:center;font-weight:800;font-size:.9em;line-height:1.15;text-align:center}
.sv-herkes .sv-k{width:3em;height:3em}.sv-herkes small{color:#e9c45a;font-size:.85em;font-family:"Nunito",system-ui,sans-serif}
.sv-sonraki{position:absolute;right:2.5%;bottom:30%;z-index:14;font:inherit;font-weight:800;font-size:1em;border:0;border-radius:999px;padding:.4em 1em;background:#e9c45a;color:#2a1a10;cursor:pointer}
.sv-arac{position:absolute;right:max(1%,env(safe-area-inset-right,0px));top:max(1%,env(safe-area-inset-top,0px));z-index:15;display:flex;gap:.4em;opacity:.35;transition:opacity .3s}
.sv-arac:hover,.sv-arac:focus-within{opacity:1}
.sv-arac button{font:inherit;font-weight:800;font-size:max(13px,.95em);border:0;border-radius:999px;padding:.35em .8em;background:#000a;color:#f4ece4;cursor:pointer;min-height:36px}
.sv-arac button:focus-visible,.sv-sonraki:focus-visible{outline:2px solid #e9c45a;outline-offset:2px}
html.yz-sov-acik #onay-modal{z-index:32500!important}
@media (prefers-reduced-motion:reduce){#yz-sov *{animation:none!important;transition:none!important}}
`;
        document.head.appendChild(st);
    }
})();
