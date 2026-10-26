// 🃏 Sporcu ana ekranı · B "Sporcu kartı" (v321). Kullanıcı (2026-10-26): giriş sonrası ekranın "dizayn temasını değiştir"
// → 3 taslaktan B: en üstte parlayan kişisel kart (fotoğraf, seviye, 4 sayı), koç notu konuşma balonu, renkli ikonlu
// düğme ızgarası. Önceki 15+ alt alta kartın yerine geçti; widget kutuları (ders, program, canlı takip…) altta kalır.
// Prefix spk*. Çağıran: app.js sporcuAnaDoldur().

function spkCss() {
    if (document.getElementById('spk-css')) return;
    let s = document.createElement('style'); s.id = 'spk-css';
    s.textContent = `
.spk-kart,.spk-balon,.spk-izg,.spk-kur{flex-shrink:0} /* #icerik-ana sabit yükseklikli flex sütun: overflow:hidden kart ezilmesin */
.spk-kart{position:relative;margin:2px 2px 16px;border-radius:24px;padding:16px 16px 14px;background:linear-gradient(155deg,#ffb35c,#ff7a2f 45%,#a8380b);color:#2a1405;box-shadow:0 16px 30px -14px rgba(255,122,47,.65);overflow:hidden;transition:transform .5s cubic-bezier(.2,.8,.2,1)}
.spk-kart::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.35) 45%,transparent 60%);transform:translateX(-100%);animation:spkParla 5s ease-in-out infinite;pointer-events:none}
@keyframes spkParla{45%,100%{transform:translateX(100%)}}
.spk-kart.oynat{transform:rotateY(8deg) rotateX(4deg) scale(1.02)}
.spk-ust{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.spk-sv{font-family:"Baloo 2",inherit;font-size:40px;font-weight:900;line-height:.9;min-width:62px}
.spk-sv small{display:block;font-size:10.5px;font-weight:900;letter-spacing:.08em}
.spk-foto-kap{position:relative;flex:none}
.spk-foto{width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:40px;overflow:hidden;background:radial-gradient(circle at 35% 30%,#fff1e2,#ffb35c 50%,#c85414);border:4px solid rgba(255,255,255,.45)}
.spk-foto img{width:100%;height:100%;object-fit:cover}
.spk-foto-btn{position:absolute;left:-2px;bottom:-2px;width:30px;height:30px;border-radius:50%;border:2px solid #fff;background:#2a1405;color:#fff;font-size:13px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;transform:none!important}
.spk-aks{position:absolute;right:-2px;bottom:-2px;font-size:18px}
.spk-sag{text-align:right;font-weight:900;font-size:14px;min-width:62px}
.spk-sag small{display:block;font-size:11px;opacity:.8;margin-top:2px}
.spk-isim{font-family:"Baloo 2",inherit;font-size:24px;font-weight:900;margin:8px 0 0;line-height:1.05;overflow-wrap:anywhere}
.spk-grup{font-size:12px;font-weight:800;opacity:.78;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.spk-ist{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:12px;background:rgba(42,20,5,.14);border:0;border-radius:14px;padding:8px 4px;width:100%;color:inherit;font:inherit;cursor:pointer;transform:none!important}
.spk-ist div{text-align:center;min-width:0}
.spk-ist b{display:block;font-family:"Baloo 2",inherit;font-size:20px;line-height:1.1}
.spk-ist small{font-size:9px;font-weight:900;letter-spacing:.03em}
.spk-xp{height:6px;border-radius:9px;background:rgba(42,20,5,.2);margin-top:10px;overflow:hidden}
.spk-xp i{display:block;height:100%;background:#2a1405;border-radius:9px}
.spk-xp-yazi{font-size:10.5px;font-weight:800;opacity:.75;margin-top:3px;display:flex;justify-content:space-between}
.spk-balon{position:relative;background:#fff6ea;color:#2a1d14;border-radius:18px 18px 18px 6px;padding:11px 13px;font-size:13px;line-height:1.45;margin:0 0 14px 42px;white-space:pre-wrap}
.spk-balon::before{content:"👨‍🏫";position:absolute;left:-42px;bottom:-2px;width:34px;height:34px;border-radius:50%;background:var(--bg-card,#2b201a);border:1px solid var(--border-color,transparent);display:flex;align-items:center;justify-content:center;font-size:18px}
.spk-balon b{display:block;font-size:11px;color:#c2410c;letter-spacing:.04em;white-space:normal}
.spk-izg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.spk-tus{position:relative;border:1px solid var(--border-color,rgba(127,127,127,.2));border-radius:18px;background:rgba(127,127,127,.08);padding:12px 4px 10px;display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;font-weight:800;color:var(--text-main,inherit);cursor:pointer;min-width:0;transition:background .2s}
.spk-tus:active{background:rgba(255,122,47,.18)}
.spk-ik{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:21px}
.spk-rozet{position:absolute;top:6px;right:6px;font-size:10px;font-weight:900;border-radius:999px;padding:2px 6px;background:#f59e0b;color:#2a1405}
.spk-rozet.tamam{background:#16a374;color:#fff}
.spk-ana{grid-column:span 3;flex-direction:row;justify-content:center;gap:10px;font-size:17px;font-family:"Baloo 2",inherit;font-weight:900;background:linear-gradient(90deg,#ff7a2f,#ffa04a);color:#2a1405;border:0;padding:14px}
.spk-ana .spk-ik{background:rgba(42,20,5,.14);width:34px;height:34px;font-size:18px}
.spk-ana:active{background:linear-gradient(90deg,#f06a20,#f5923c)}
.spk-kur{width:100%;margin-bottom:14px}
@media (prefers-reduced-motion:reduce){.spk-kart::after{animation:none}.spk-kart{transition:none}}
`;
    document.head.appendChild(s);
}

function spkAd(ad) { // TOPRAK YILMAZ → Toprak Yılmaz; elle yazılmış ad olduğu gibi
    let s = String(ad || '');
    return s === s.toLocaleUpperCase('tr-TR') ? s.toLocaleLowerCase('tr-TR').replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toLocaleUpperCase('tr-TR')) : s;
}

function spkOynat(el) { el.classList.add('oynat'); setTimeout(() => el.classList.remove('oynat'), 450); }

// o: { g, ad, sp, sv, xp, coin, streak, foto, fotoDegis, avatarEmoji, cerceveRenk, aksEmoji, vitrinHtml, sonNot, gorevTamam, gorevMetin, rutinYapildi, kurBtn }
function spkKartHTML(o) {
    spkCss();
    let sp = o.sp || {}, adJs = String(o.ad).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    let oz = null; try { if (typeof istVeri === 'function') oz = istVeri(sp, 30).oz; } catch (e) {}
    let sayi = (v) => v == null || isNaN(v) ? '—' : (+v).toFixed(1).replace('.', ',');
    let ist = oz && oz.ok
        ? [[sayi(oz.okOrt), 'OK ORT.'], [oz.enIyi ? oz.enIyi.puan : '—', 'EN İYİ SERİ'], [oz.ok, 'OK · 30 GÜN'], [oz.antrenman, 'ANTRENMAN']]
        : [['—', 'OK ORT.'], ['—', 'EN İYİ SERİ'], [0, 'OK · 30 GÜN'], [0, 'ANTRENMAN']];
    let xpIc = (o.xp || 0) % 50;
    let grup = [{ buyukler: 'Büyükler', yildizlar: 'Yıldızlar', kucukler: 'Küçükler', minikler: 'Minikler' }[o.g] || '', sp.yay || '', sp.sinif || ''].filter(Boolean).map(esc).join(' · ');
    let tus = (ik, renk, yazi, js, rozet) => `<button type="button" class="spk-tus" onclick="${js}">${rozet || ''}<span class="spk-ik" style="background:${renk}">${ik}</span>${yazi}</button>`;
    return `
    <div class="spk-kart" onclick="if(!event.target.closest('button'))spkOynat(this)">
        <div class="spk-ust">
            <div class="spk-sv">${o.sv}<small>SEVİYE</small></div>
            <div class="spk-foto-kap">
                <div class="spk-foto" style="border-color:${o.cerceveRenk || 'rgba(255,255,255,.45)'}">${o.foto ? `<img src="${esc(o.foto)}" alt="">` : esc(o.avatarEmoji || '🎯')}</div>
                ${o.fotoDegis ? `<button type="button" class="spk-foto-btn" onclick="sporcuFotoDegistir()" aria-label="Profil fotoğrafımı değiştir" title="Profil fotoğrafımı değiştir">📷</button>` : ''}
                ${o.aksEmoji ? `<div class="spk-aks">${o.aksEmoji}</div>` : ''}
            </div>
            <div class="spk-sag">💎 ${o.coin || 0}<small>${o.streak > 0 ? '🔥 ' + o.streak + ' gün' : 'elmas'}</small></div>
        </div>
        <div class="spk-isim">${esc(spkAd(o.ad))}</div>
        <div class="spk-grup">${grup}${o.vitrinHtml || ''}</div>
        <button type="button" class="spk-ist" onclick="sekmeAc('gelisim')" aria-label="İstatistiklerimi aç">${ist.map(x => `<div><b>${x[0]}</b><small>${x[1]}</small></div>`).join('')}</button>
        <div class="spk-xp"><i style="width:${xpIc / 50 * 100}%"></i></div>
        <div class="spk-xp-yazi"><span>${xpIc}/50 XP</span><span>Seviye ${o.sv + 1}'e ${50 - xpIc} XP</span></div>
    </div>
    ${o.sonNot ? `<div class="spk-balon"><b>KOÇUN NOTU${o.sonNot.tarih ? ' · ' + esc(o.sonNot.tarih) : ''}</b>${esc(o.sonNot.not)}</div>` : ''}
    <div class="spk-izg">
        <button type="button" class="spk-tus spk-ana" onclick="sekmeAc('skor')"><span class="spk-ik">🎯</span>Skor gir</button>
        ${tus('📈', 'rgba(59,130,246,.2)', 'Gelişim', "sekmeAc('gelisim')")}
        ${tus('🏅', 'rgba(245,158,11,.2)', 'Rozetler', "sekmeAc('basari')")}
        ${tus('🏆', 'rgba(232,70,110,.2)', 'Sıralama', "sekmeAc('liderlik')")}
        ${tus('🧘', 'rgba(22,163,116,.2)', 'Rutin', o.rutinYapildi ? "showToast('Bugünkü rutin tamam ✅','success')" : `rutinBaslat('${adJs}')`, o.rutinYapildi ? '<span class="spk-rozet tamam">✓</span>' : '')}
        ${tus('🧠', 'rgba(139,92,246,.2)', 'Günlük görev', "sekmeAc('refleks')", o.gorevTamam ? '<span class="spk-rozet tamam">✓</span>' : '<span class="spk-rozet">+5💎</span>')}
        ${tus('⚔️', 'rgba(239,68,68,.2)', 'Düello', `dueloBaslat('${adJs}')`)}
        ${tus('🛍️', 'rgba(6,182,212,.2)', 'Mağaza', "sekmeAc('oyun')")}
        ${tus('🏹', 'rgba(255,122,47,.2)', 'Yarışmalar', "sekmeAc('yarisma')")}
        ${tus('💬', 'rgba(148,163,184,.22)', 'Bize yaz', 'ihtiyacBildirAc()')}
    </div>
    ${o.kurBtn ? `<button type="button" onclick="kurulumRehberiAc(true)" class="btn spk-kur">📲 Uygulamayı telefonuma kur</button>` : ''}`;
}
