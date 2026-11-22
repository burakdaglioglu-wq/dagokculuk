/* ================================================================================================
   🧰 OYUN KİTİ — Karışık Sınıf oyunlarının ortak parçaları (v447, 2026-11-23).
   Dedektif 2.0'da sevilen üç parça yeni oyunlara (Resim Avı, Hayalet Avcıları) buradan gelir:
     • ŞİMDİ ATIYOR kartı: fotoğraf/baş harf, ad, rütbe, bu turun rozetleri, SONRA 2 kişi (dokun → o atar)
     • Kim atıyor? yüz ızgarası: karta dokun → bütün sınıf; yüze dokun → o atar (2 dokunuş)
     • Rozet / rütbe bandı: "ADA · ⭐ KARTAL GÖZ rozeti!" (sıralama değil, çocuğun kendi atışı)
   Boyutlar "em": kartı taşıyan kap font-size'ı sahne ölçeğiyle verir (1em = 10 sahne pikseli).
   kmKit.kim(el, {...}) · kmKit.secHTML(...) / kmKit.secBagla(...) · kmKit.pop(el, ...) · kmKit.rutbe(n, tablo) · kmKit.av(s, j)
   ================================================================================================ */
(function () {
    'use strict';
    if (window.kmKit) return;
    const $ = (id) => document.getElementById(id);
    function kacis(t) { return typeof esc === 'function' ? esc(t) : String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
    function ilkAd(ad) { return typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]; }
    function liste() { return (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || []; }
    function ai() { return typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : 0; }
    function yeni() { return typeof yeniRozet === 'function' ? ' ' + yeniRozet() : ''; }
    function av(s, j, tema) { const r = typeof kmOyunRenk === 'function' ? kmOyunRenk(tema || (typeof _kmOyunAktifTema !== 'undefined' ? _kmOyunAktifTema : ''), j) : '#5a6ab0'; return '<span class="kk-av" style="background:' + r + '">' + (s.foto ? '<img src="' + kacis(s.foto) + '" alt="">' : kacis(s.kisa || String(s.ad).slice(0, 2).toLocaleUpperCase('tr-TR'))) + '</span>'; }
    function rutbe(n, tablo) { let r = tablo[0]; tablo.forEach((x) => { if (n >= x[0]) r = x; }); return r; }
    function sec(j) { if (typeof kmOyunSporcuSec === 'function') kmOyunSporcuSec(j); else _kmOyunAktifIndex = j; }

    // ŞİMDİ ATIYOR kartı. o: { goster, etiket, alt(s) → html (rütbe vb.), rozet(s) → html, secAc(), tema }
    const _imza = new WeakMap();
    function kim(el, o) {
        if (!el) return; css(); const l = liste(), n = l.length, i = ai(), s = l[i], goster = !!s && o.goster !== false;
        const alt = s && o.alt ? o.alt(s) : '', rz = s && o.rozet ? o.rozet(s) : '';
        const im = [goster, i, s && s.ad, n, s && s.foto, alt, rz, n > 1 && l[(i + 1) % n].ad, n > 2 && l[(i + 2) % n].ad].join('|');
        if (!o.zorla && _imza.get(el) === im) return; _imza.set(el, im);
        el.hidden = !goster; if (!goster) return;
        const sonra = []; for (let k = 1; k <= Math.min(2, n - 1); k++) { const j = (i + k) % n; sonra.push('<button type="button" class="kk-sonra-k" data-j="' + j + '">' + av(l[j], j, o.tema) + '<span>' + kacis(ilkAd(l[j].ad)) + '</span></button>'); }
        el.innerHTML = '<div class="kk-kutu"><button type="button" class="kk-ana"><span class="kk-et">' + (o.etiket || '🏹 ŞİMDİ ATIYOR') + yeni() + ' <i>👆</i></span><span class="kk-sat">' + av(s, i, o.tema) + '<span class="kk-ad"><b>' + kacis(ilkAd(s.ad)) + '</b><small>' + alt + ' <em>' + rz + '</em></small></span></span></button>'
            + (sonra.length ? '<div class="kk-sonra"><span class="kk-sl">SONRA</span>' + sonra.join('') + '</div>' : '') + '</div>';
        el.querySelector('.kk-ana').onclick = () => { if (o.secAc) o.secAc(); };
        el.querySelectorAll('[data-j]').forEach((b) => b.onclick = () => { sec(+b.dataset.j); if (o.sonra) o.sonra(); kim(el, Object.assign({}, o, { zorla: true })); });
    }
    // Yüz ızgarası (oyunun kendi perde/kart kabuğunun içine konur). atti(s) → bu turda attı mı, ek(s) → küçük not (rütbe ikonu)
    function secHTML(atti, ek, tema) {
        const l = liste(), i0 = ai(), sira = l.map((s, j) => ({ s, j, a: !!(atti && atti(s)) })).sort((a, b) => (a.a - b.a) || (a.j - b.j));
        return '<h2>Kim atıyor?</h2><p>Çocuğa dokun. Önce bu turda henüz atmayanlar · ✓ = attı</p><div class="kk-yuzler">' + sira.map((o) => '<button type="button" data-j="' + o.j + '" class="' + (o.j === i0 ? 'on' : '') + (o.a ? ' atti' : '') + '">' + av(o.s, o.j, tema) + '<b>' + kacis(ilkAd(o.s.ad)) + '</b><i>' + (ek ? ek(o.s) : '') + (o.a ? ' ✓' : '') + '</i></button>').join('') + '</div>';
    }
    function secBagla(p, kapat) { css(); p.querySelectorAll('.kk-yuzler [data-j]').forEach((b) => b.onclick = () => { sec(+b.dataset.j); kapat(); }); }

    // Rozet / rütbe bandı (kuyruklu, 2 sn). el: bandın kabı. bekle(): true ise (ör. büyük olay bandı) yarım sn sonra dener
    const _kuyruk = new WeakMap();
    function pop(el, s, metin, rutbeMi, bekle) {
        if (!el) return; css(); let q = _kuyruk.get(el); if (!q) { q = { l: [], z: 0, bekle }; _kuyruk.set(el, q); }
        q.l.push({ s: { g: s.g, ad: s.ad }, metin, rutbeMi }); if (q.l.length > 6) q.l.shift(); oyna(el, q);
    }
    function oyna(el, q) {
        if (q.z) return; if (!document.body.contains(el)) { q.l = []; return; }
        if (q.bekle && q.bekle()) { q.z = setTimeout(() => { q.z = 0; oyna(el, q); }, 500); return; }
        const r = q.l.shift(); if (!r) { el.hidden = true; return; }
        const l = liste(), j = l.findIndex((o) => o.g === r.s.g && o.ad === r.s.ad), s = j >= 0 ? l[j] : r.s;
        el.classList.add('kk-pop'); el.classList.toggle('rutbe', !!r.rutbeMi); el.classList.remove('oyna'); // oyunun kendi konum sınıfı korunur
        el.innerHTML = av(s, Math.max(0, j)) + '<span><b>' + kacis(ilkAd(s.ad)) + '</b><i>' + kacis(r.metin) + '</i></span>';
        el.hidden = false; void el.offsetWidth; el.classList.add('oyna');
        q.z = setTimeout(() => { q.z = 0; el.hidden = true; oyna(el, q); }, 2000);
    }

    function css() {
        if ($('kk-css')) return;
        const st = document.createElement('style'); st.id = 'kk-css';
        st.textContent = `
.kk-kutu{display:flex;align-items:stretch;background:linear-gradient(160deg,rgba(28,36,70,.97),rgba(14,18,36,.97));border:.3em solid #ffc94a;border-radius:1.6em;box-shadow:0 .6em 1.6em rgba(0,0,0,.5);overflow:hidden}
.kk-ana{flex:1;min-width:0;cursor:pointer;text-align:left;font:inherit;color:#fff;background:none;border:0;padding:.8em 1em .9em 1.2em;display:flex;flex-direction:column;gap:.5em}
.kk-ana:hover{background:rgba(255,255,255,.06)}
.kk-et{font-weight:900;letter-spacing:.12em;font-size:1.6em;color:#ffc94a;display:flex;justify-content:space-between;gap:1em;font-family:Nunito,system-ui,sans-serif}
.kk-et i:not(.dag-yeni){font-style:normal;letter-spacing:0;color:#b8c0e0;font-size:.85em;font-weight:800}
.kk-sat{display:flex;align-items:center;gap:1.1em;min-width:0}
.kk-av{flex:none;border-radius:50%;display:grid;place-items:center;overflow:hidden;color:#10131c;font-weight:900;border:3px solid rgba(255,255,255,.85);font-family:Nunito,system-ui,sans-serif}
.kk-av img{width:100%;height:100%;object-fit:cover}
.kk-sat .kk-av{font-size:2.8em;width:2.7em;height:2.7em}
.kk-ad{display:flex;flex-direction:column;min-width:0;line-height:1.05}
.kk-ad b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:4em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kk-ad small{font-size:1.8em;font-weight:800;color:#ffe2a0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:Nunito,system-ui,sans-serif}.kk-ad em{font-style:normal}
.kk-sonra{flex:none;width:13em;display:flex;flex-direction:column;justify-content:center;gap:.6em;padding:.8em;border-left:.15em solid rgba(255,255,255,.12)}
.kk-sl{font-weight:900;letter-spacing:.12em;font-size:1.3em;color:#b8c0e0;font-family:Nunito,system-ui,sans-serif}
.kk-sonra-k{cursor:pointer;display:flex;align-items:center;gap:.5em;background:rgba(255,255,255,.06);border:.15em solid #3b4680;color:#fff;border-radius:99em;padding:.2em .8em .2em .25em;font:inherit;font-weight:900;font-size:1.6em;min-width:0;font-family:Nunito,system-ui,sans-serif}
.kk-sonra-k span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.kk-sonra-k .kk-av{width:1.8em;height:1.8em;font-size:.8em;border-width:2px}
.kk-yuzler{display:grid;grid-template-columns:repeat(auto-fill,minmax(clamp(84px,11vw,120px),1fr));gap:8px;max-height:52vh;overflow:auto;padding:4px}
.kk-yuzler button{cursor:pointer;border-radius:14px;border:3px solid transparent;background:#fff8e6;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;color:#2a2014}
.kk-yuzler button.on{border-color:#ff9a1a;background:#ffe2a8}.kk-yuzler button.atti{opacity:.6}
.kk-yuzler .kk-av{width:clamp(50px,6.4vw,72px);height:clamp(50px,6.4vw,72px);font-size:clamp(18px,2.4vw,26px)}
.kk-yuzler b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:clamp(15px,1.9vw,20px)}.kk-yuzler i{font-style:normal;font-size:13px;font-weight:800}
.kk-pop{position:absolute;z-index:6;display:flex;align-items:center;justify-content:center;gap:1.2em;background:linear-gradient(90deg,rgba(24,60,40,.96),rgba(14,40,28,.96));border:.35em solid #5ee39b;border-radius:99em;padding:.8em 2em;color:#fff;pointer-events:none;box-shadow:0 1em 3em rgba(0,0,0,.5)}
.kk-pop[hidden]{display:none}.kk-pop.rutbe{background:linear-gradient(90deg,rgba(80,50,10,.96),rgba(50,30,6,.96));border-color:#ffc94a}
.kk-pop .kk-av{font-size:2.4em;width:2.5em;height:2.5em}
.kk-pop span{display:flex;flex-direction:column;line-height:1.05}.kk-pop b{font-family:"Lilita One","Baloo 2",sans-serif;font-weight:400;font-size:3.6em}.kk-pop i{font-style:normal;font-weight:900;font-size:2.6em;color:#ffe27a;font-family:Nunito,system-ui,sans-serif}
.kk-pop.oyna{animation:kkPop 2s ease forwards}
@keyframes kkPop{0%{opacity:0;transform:scale(.5)}10%{opacity:1;transform:scale(1.08)}16%{transform:scale(1)}85%{opacity:1}100%{opacity:0;transform:translateY(-1em)}}
@media (prefers-reduced-motion:reduce){.kk-pop.oyna{animation:none}}`;
        document.head.appendChild(st);
    }
    window.kmKit = { kim, secHTML, secBagla, pop, rutbe, av, sec, css, ilkAd, kacis, liste, ai };
})();
