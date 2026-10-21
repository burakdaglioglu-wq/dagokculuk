/* 📈 Gelişimim (2026-10-22). Kullanıcı taslaktaki üç parçayı beğendi, "bunları harmanlayamaz mısın" → tek yapı:
   - Sporcunun ana ekranında TEK kart (#gelisim-widget): bugün seri attıysa üstte "Bugün nasıldı?" (his · odak · yorgunluk),
     altında 4 haftalık plan ilerlemesi, en altta grup / nişangah önerisi (mini hedef).
   - Koçun sporcu profilinde TEK panel (yonetim-panel.js Y.ekPanel): plan tablosu (hedefi değiştir, not), grup analizi, his–skor grafiği;
     parçalar birbirini besler: grup çapı plana hedef olur, "yorgun günlerde ortalama düşüyor" tespiti plan notunun yanında çıkar.
   Plan: sabit 4 haftalık bloklar (2026-10-19 Pazartesi'den itibaren); her bloğun önerisi bloktan ÖNCEKİ 28 günden hesaplanır (blok boyunca
   sabit), sporcu başına kayıt yazılmaz. Koç bir hedefi değiştirir / not yazarsa meta gelisim_plani[g|ad] = { blok, hedef, not, t }.
   Öz-değerlendirme: meta oz_degerlendirme[g|ad|tarih] = { his 1-4, odak 1-5, yorgun 0-2, t } — sporcu telefonundan (oturumsuz) yazılır.
   Grup: hedefe dokunarak girilen okların konumu (detayliOklar x/y, _okKonumu; 100 birim = hedef yarıçapı = 10 halka). */
const GP_EPOK = new Date(2026, 9, 19).getTime(), GP_BLOK = 28 * 864e5;
const GP_HIS = ['', '😟', '😐', '🙂', '😄'], GP_YORGUN = ['Hiç', 'Biraz', 'Çok'];
const gpEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const gpV = n => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
const gpIso = d => bsIsoTarih(d);
let _gpSenk = false, _gpOz = null;

// ---- blok / veri ----
function gpBlok(t) { let b = Math.floor(((t || Date.now()) - GP_EPOK) / GP_BLOK); let bas = new Date(GP_EPOK + b * GP_BLOK); return { no: b, bas: gpIso(bas), bit: gpIso(new Date(bas.getTime() + GP_BLOK - 864e5)), basT: bas.getTime() }; }
function gpHaftaBas() { let d = new Date(), g = (d.getDay() + 6) % 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - g); return d; }
function gpSeriler(sp) { return (typeof _ysSeriler === 'function' ? _ysSeriler(sp) : (sp.seriler || [])).filter(x => x && x.tarih && (x.oklar || []).length).map(x => ({ t: String(x.tarih).slice(0, 10), puan: Number(x.puan) || 0, ok: x.oklar.length })); }
function gpGunler(g, ad, sp, bas, bit) {
    let s = new Set();
    Object.keys(otomatikYoklamaDB || {}).forEach(t => { if (t < bas || t > bit) return; let r = otomatikYoklamaDB[t][ad]; if (r && r.geldi !== false && (!r.grup || r.grup === g)) s.add(t); });
    gpSeriler(sp).forEach(x => { if (x.t >= bas && x.t <= bit) s.add(x.t); });
    return s;
}
function gpOrt(l) { let ok = l.reduce((a, x) => a + x.ok, 0); return ok ? l.reduce((a, x) => a + x.puan, 0) / ok : null; }
function gpPlanDepo() { return typeof kyDepoOku === 'function' ? kyDepoOku('gelisim_plani') : {}; }
function gpOzDepo() { return typeof kyDepoOku === 'function' ? kyDepoOku('oz_degerlendirme') : {}; }
// konumlu oklar: aktif kart (bugün) + geçmiş kartlar (kart tarihiyle)
function gpKonumlar(sp) {
    let l = [], bugun = gpIso(new Date());
    let ekle = (arr, t) => (arr || []).forEach(o => { if (o && o.x != null && o.y != null && !o.duello) { let k = _okKonumu(o); l.push({ x: k.x, y: k.y, t: t }); } });
    (sp.kartGecmisi || []).forEach(k => ekle(k.detayliOklar, String(k.tarih || '').slice(0, 10)));
    ekle(sp.detayliOklar, bugun);
    return l;
}
// grup: merkez kayması + çap (ok merkezinden ortalama uzaklık × 2), halka cinsinden (10 birim = 1 halka)
function gpGrup(oklar) {
    let n = oklar.length; if (n < 12) return null;
    let cx = oklar.reduce((a, o) => a + o.x, 0) / n, cy = oklar.reduce((a, o) => a + o.y, 0) / n;
    let cap = 2 * oklar.reduce((a, o) => a + Math.hypot(o.x - cx, o.y - cy), 0) / n / 10, ofset = Math.hypot(cx, cy) / 10;
    let saat = Math.round(((Math.atan2(cx, -cy) * 180 / Math.PI + 360) % 360) / 30) || 12;
    let yon = [], ok = '';
    if (Math.abs(cx) >= 6) yon.push(cx > 0 ? 'sağa' : 'sola');
    if (Math.abs(cy) >= 6) yon.push(cy < 0 ? 'yukarı' : 'aşağı');
    if (ofset >= 0.8) ok = (cy < -6 ? '↑' : cy > 6 ? '↓' : '') + (cx > 6 ? '→' : cx < -6 ? '←' : '');
    ok = { '↑→': '↗', '↑←': '↖', '↓→': '↘', '↓←': '↙' }[ok] || ok;
    return { n, cx, cy, cap, ofset, saat, kayik: ofset >= 0.8, oneri: ofset >= 0.8 ? 'Nişangahı ' + yon.join(' ve ') + ' kaydır' : 'Grup ortada', okIsaret: ok || '◎',
        aciklama: ofset >= 0.8 ? 'Grup merkezi saat ' + saat + ' yönünde, ' + gpV(ofset) + ' halka uzakta — pim oku takip eder.' : 'Grup merkeze yakın (' + gpV(ofset) + ' halka) — nişangaha dokunma.' };
}
function gpCapTrend(oklar) {
    let hb = gpHaftaBas().getTime(), l = [];
    for (let w = 5; w >= 0; w--) { let a = gpIso(new Date(hb - w * 7 * 864e5)), b = gpIso(new Date(hb - (w - 1) * 7 * 864e5 - 864e5)); let o = oklar.filter(x => x.t >= a && x.t <= b); let gr = o.length >= 6 ? gpGrup(o.length >= 12 ? o : o.concat(o)) : null; l.push(gr ? gr.cap : null); }
    return l;
}
// ---- plan ----
function gpPlan(g, ad) {
    let sp = turnuvaDB[g] && turnuvaDB[g][ad]; if (!sp) return null;
    let B = gpBlok(), once = { bas: gpIso(new Date(B.basT - GP_BLOK)), bit: gpIso(new Date(B.basT - 864e5)) };
    let ser = gpSeriler(sp), onceSer = ser.filter(x => x.t >= once.bas && x.t <= once.bit), blokSer = ser.filter(x => x.t >= B.bas && x.t <= B.bit);
    let hb = gpIso(gpHaftaBas()), hSer = ser.filter(x => x.t >= hb);
    let ort0 = gpOrt(onceSer), gun0 = gpGunler(g, ad, sp, once.bas, once.bit).size / 4, ok0 = onceSer.reduce((a, x) => a + x.ok, 0) / 4;
    let kon = gpKonumlar(sp), grupOnce = gpGrup(kon.filter(x => x.t < B.bas).slice(-30)), grupSimdi = gpGrup(kon.slice(-30));
    let hedef = {};
    if (ort0 != null && onceSer.length >= 3) hedef.ort = { ad: 'Ok başı ortalama', ikon: '🎯', bas: ort0, oneri: Math.min(10, Math.round((ort0 + Math.max(0.2, Math.min(0.5, (10 - ort0) * 0.06))) * 10) / 10), simdi: gpOrt(blokSer), bicim: gpV };
    hedef.gun = { ad: 'Haftada gün', ikon: '📅', bas: gun0, oneri: Math.min(3, Math.max(1, Math.floor(gun0) + 1)), simdi: gpGunler(g, ad, sp, hb, gpIso(new Date())).size, bicim: v => String(Math.round(v * 10) / 10).replace('.', ','), hafta: true };
    if (ok0 > 0 || hSer.length) hedef.ok = { ad: 'Haftada ok', ikon: '🏹', bas: ok0, oneri: Math.max(30, Math.round(ok0 * 1.2 / 10) * 10), simdi: hSer.reduce((a, x) => a + x.ok, 0), bicim: v => String(Math.round(v)), hafta: true };
    if (grupOnce || grupSimdi) hedef.cap = { ad: 'Grup çapı (halka)', ikon: '📍', bas: (grupOnce || grupSimdi).cap, oneri: Math.round((grupOnce || grupSimdi).cap * 0.9 * 10) / 10, simdi: grupSimdi ? grupSimdi.cap : null, bicim: gpV, kucuk: true };
    let kayit = gpPlanDepo()[g + '|' + ad], koc = kayit && !kayit.sil && kayit.blok === B.no ? kayit : null;
    Object.keys(hedef).forEach(k => { let h = hedef[k]; h.hedef = koc && koc.hedef && koc.hedef[k] != null && koc.hedef[k] !== '' ? Number(koc.hedef[k]) : h.oneri; h.koc = !!(koc && koc.hedef && koc.hedef[k] != null && koc.hedef[k] !== ''); h.tamam = h.simdi != null && (h.kucuk ? h.simdi <= h.hedef : h.simdi >= h.hedef); h.yuzde = h.simdi == null ? 0 : h.kucuk ? Math.max(0, Math.min(100, (h.bas - h.simdi) / Math.max(0.1, h.bas - h.hedef) * 100)) : Math.max(0, Math.min(100, (h.simdi - (k === 'ort' ? h.bas : 0)) / Math.max(0.1, h.hedef - (k === 'ort' ? h.bas : 0)) * 100)); });
    let hafta = Math.min(4, Math.floor((Date.now() - B.basT) / (7 * 864e5)) + 1);
    return { B, hafta, hedef, not: koc ? koc.not || '' : '', grup: grupSimdi, kon, sp };
}
function gpPlanYaz(g, ad, alan) {
    let d = gpPlanDepo(), k = g + '|' + ad, B = gpBlok(), e = d[k] && d[k].blok === B.no && !d[k].sil ? d[k] : { blok: B.no, hedef: {} };
    d[k] = Object.assign({}, e, alan, { blok: B.no, t: Date.now() });
    kyDepoYazYerel('gelisim_plani', d);
    kyDepoSenkron('gelisim_plani', () => kyDepoOku('gelisim_plani'), true).catch(() => {});
}
// ---- öz-değerlendirme ----
function gpOzYaz(g, ad, kayit) {
    let d = gpOzDepo(), sinir = gpIso(new Date(Date.now() - 400 * 864e5));
    Object.keys(d).forEach(k => { if (k.slice(-10) < sinir) delete d[k]; });
    d[g + '|' + ad + '|' + gpIso(new Date())] = Object.assign({}, kayit, { t: Date.now() });
    kyDepoYazYerel('oz_degerlendirme', d);
    kyDepoSenkron('oz_degerlendirme', () => kyDepoOku('oz_degerlendirme'), true).catch(() => {});
}
function gpOzListe(g, ad) { let d = gpOzDepo(), on = g + '|' + ad + '|'; return Object.keys(d).filter(k => k.startsWith(on) && !d[k].sil).map(k => Object.assign({ tarih: k.slice(on.length) }, d[k])).sort((a, b) => a.tarih.localeCompare(b.tarih)); }
// his/yorgunluk ile skor ilişkisi (en az 2'şer gün varsa)
function gpOzTespit(g, ad, sp) {
    let oz = gpOzListe(g, ad), ser = gpSeriler(sp), gunOrt = t => gpOrt(ser.filter(x => x.t === t));
    let grup = f => { let a = oz.filter(f).map(o => gunOrt(o.tarih)).filter(v => v != null); return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; };
    let l = [];
    let yA = grup(o => o.yorgun === 2), yB = grup(o => o.yorgun !== 2), nY = oz.filter(o => o.yorgun === 2).length;
    if (nY >= 2 && yA != null && yB != null && yB - yA >= 0.3) l.push('“Çok yorgun” olduğu ' + nY + ' günde ok başı ' + gpV(yB - yA) + ' düşük — o günlerde ok sayısını azalt, tekniğe odaklan.');
    let hA = grup(o => o.his <= 2), hB = grup(o => o.his >= 3), nH = oz.filter(o => o.his <= 2).length;
    if (nH >= 2 && hA != null && hB != null && hB - hA >= 0.3) l.push('Keyifsiz olduğu günlerde ok başı ' + gpV(hB - hA) + ' düşük — derse başlamadan kısa sohbet iyi gelebilir.');
    let son3 = oz.slice(-3);
    if (son3.length === 3 && son3.every(o => o.his <= 1 || o.yorgun === 2)) l.push('⚠️ Son 3 değerlendirmede hep keyifsiz / çok yorgun — konuşmak gerekebilir.');
    return l;
}
// ---- çizimler ----
function gpHedefSVG(gr, kon, boyut) {
    let s = '';
    [['#fff', 100], ['#fff', 90], ['#2b2b2b', 80], ['#2b2b2b', 70], ['#3fa9f5', 60], ['#3fa9f5', 50], ['#e53935', 40], ['#e53935', 30], ['#fdd835', 20], ['#fdd835', 10]].forEach(r => { s += `<circle r="${r[1]}" fill="${r[0]}" stroke="#666" stroke-width=".6"/>`; });
    (kon || []).slice(-30).forEach(o => { s += `<circle cx="${Math.max(-108, Math.min(108, o.x)).toFixed(1)}" cy="${Math.max(-108, Math.min(108, o.y)).toFixed(1)}" r="3" fill="#0b0f16" stroke="#fff" stroke-width=".8"/>`; });
    if (gr) s += `<circle cx="${gr.cx.toFixed(1)}" cy="${gr.cy.toFixed(1)}" r="${(gr.cap * 5).toFixed(1)}" fill="none" stroke="#f0c860" stroke-width="2.4" stroke-dasharray="5 3"/><circle cx="${gr.cx.toFixed(1)}" cy="${gr.cy.toFixed(1)}" r="4" fill="#f0c860"/>` + (gr.kayik ? `<line x1="0" y1="0" x2="${gr.cx.toFixed(1)}" y2="${gr.cy.toFixed(1)}" stroke="#f0c860" stroke-width="2.4"/>` : '');
    return `<svg viewBox="-112 -112 224 224" width="${boyut}" height="${boyut}" role="img" aria-label="Ok grubu">${s}</svg>`;
}
function gpHedefSatir(h, renk) {
    let d = h.tamam ? ['✓ tamam', 'i'] : h.simdi == null ? ['veri yok', 't'] : h.yuzde >= 50 ? ['yolda', 't'] : ['devam', 'u'];
    return `<div class="gp-h"><span class="gp-ik">${h.ikon}</span><div><b>${gpEsc(h.ad)} ${h.kucuk ? '≤ ' : ''}${h.bicim(h.hedef)}</b><small>şimdi ${h.simdi == null ? '—' : h.bicim(h.simdi)}${h.hafta ? ' (bu hafta)' : ''} · başlangıç ${h.bicim(h.bas)}</small><div class="gp-bar"><i class="${h.tamam ? '' : h.yuzde >= 50 ? '' : 'u'}" style="width:${Math.round(h.tamam ? 100 : h.yuzde)}%"></i></div></div><span class="gp-d ${d[1]}">${d[0]}</span></div>`;
}
function gpCss() {
    if (document.getElementById('gp-css')) return;
    let s = document.createElement('style'); s.id = 'gp-css';
    s.textContent = '.gp-h{display:grid;grid-template-columns:26px 1fr auto;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--border-color,#2c323c)}.gp-h:first-child{border-top:0}'
        + '.gp-ik{font-size:19px;text-align:center}.gp-h b{display:block;font-size:13.5px}.gp-h small{color:var(--text-muted,#97a0ae);font-size:11.5px}'
        + '.gp-bar{height:7px;border-radius:99px;background:rgba(127,127,127,.2);overflow:hidden;margin-top:5px}.gp-bar i{display:block;height:100%;border-radius:99px;background:#3fbf7f}.gp-bar i.u{background:#e8a33d}'
        + '.gp-d{font-size:11.5px;font-weight:800;padding:3px 8px;border-radius:99px;white-space:nowrap}.gp-d.i{background:rgba(63,191,127,.15);color:#3fbf7f}.gp-d.u{background:rgba(232,163,61,.15);color:#e8a33d}.gp-d.t{background:rgba(90,169,255,.15);color:#5aa9ff}'
        + '.gp-segler{display:flex;gap:4px;margin:6px 0 4px}.gp-segler i{flex:1;height:6px;border-radius:99px;background:rgba(127,127,127,.22)}.gp-segler i.d{background:#3fbf7f}.gp-segler i.b{background:#f0c860}'
        + '.gp-oz{border:1px solid rgba(240,200,96,.45);background:rgba(240,200,96,.08);border-radius:14px;padding:10px 12px;margin-bottom:10px}'
        + '.gp-oz .lbl{font-size:12.5px;font-weight:800;margin-top:6px}.gp-sec{display:flex;gap:5px;margin-top:4px}.gp-sec button{flex:1;font:inherit;font-weight:900;padding:7px 0;border-radius:10px;border:2px solid var(--border-color,#2c323c);background:var(--bg-panel,#1b1f26);color:var(--text-main,#eceff4);cursor:pointer;transform:none!important}'
        + '.gp-sec.his button{font-size:24px;padding:4px 0}.gp-sec button[aria-pressed=true]{border-color:#f0c860;background:rgba(240,200,96,.18)}'
        + '.gp-grup{display:flex;gap:12px;align-items:center;padding-top:10px;margin-top:6px;border-top:1px solid var(--border-color,#2c323c)}.gp-grup b{display:block;font-size:13.5px}.gp-grup small{color:var(--text-muted,#97a0ae);font-size:12px;line-height:1.4;display:block}'
        + '.gp-trend{display:flex;align-items:flex-end;gap:5px;height:70px;margin-top:6px}.gp-trend div{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10.5px;color:var(--ap-soluk,#97a0ae)}.gp-trend i{width:100%;max-width:26px;border-radius:5px 5px 0 0;background:#5aa9ff}'
        + '.gp-tablo{width:100%;border-collapse:collapse;font-size:13px}.gp-tablo th{text-align:left;font-size:11px;letter-spacing:.05em;color:var(--ap-soluk,#97a0ae);padding:6px;border-bottom:1px solid var(--ap-cizgi,#2c323c)}.gp-tablo td{padding:7px 6px;border-bottom:1px solid var(--ap-cizgi,#2c323c)}'
        + '.gp-tablo input{width:72px;font:inherit;padding:5px 7px;border-radius:8px;border:1px solid var(--ap-cizgi,#2c323c);background:var(--ap-zemin,#14171c);color:var(--ap-yazi,#e8ebf0)}'
        + '.gp-tespit{font-size:12.5px;line-height:1.45;padding:7px 10px;border-radius:9px;background:rgba(232,163,61,.12);margin-top:6px}';
    document.head.appendChild(s);
}
// ---- 📱 sporcu ana ekranı: tek kart ----
function gelisimWidgetCiz() {
    let el = document.getElementById('gelisim-widget'); if (!el) return;
    let ad = typeof loggedInSporcu !== 'undefined' ? loggedInSporcu : '', g = typeof aktifGrup !== 'undefined' ? aktifGrup : '';
    if (!ad || !g || !turnuvaDB[g] || !turnuvaDB[g][ad] || typeof kyDepoOku !== 'function') { el.innerHTML = ''; return; }
    gpCss();
    if (!_gpSenk) { _gpSenk = true; Promise.all(['gelisim_plani', 'oz_degerlendirme'].map(a => kyDepoSenkron(a, () => kyDepoOku(a), false).catch(() => {}))).then(gelisimWidgetCiz); }
    let P = gpPlan(g, ad); if (!P) { el.innerHTML = ''; return; }
    let bugun = gpIso(new Date()), bugunSeri = gpSeriler(P.sp).some(x => x.t === bugun), oz = gpOzDepo()[g + '|' + ad + '|' + bugun];
    let ozHTML = '';
    if (bugunSeri && !oz) {
        _gpOz = _gpOz && _gpOz.k === g + '|' + ad ? _gpOz : { k: g + '|' + ad, his: 0, odak: 0, yorgun: -1 };
        let s = _gpOz, b = (alan, v, yazi) => `<button aria-pressed="${s[alan] === v}" onclick="_gpOz.${alan}=${v}; gelisimWidgetCiz()">${yazi}</button>`;
        ozHTML = `<div class="gp-oz"><b style="font-size:14px">Bugün nasıldı, ${gpEsc(ad.split(' ')[0].charAt(0) + ad.split(' ')[0].slice(1).toLocaleLowerCase('tr-TR'))}?</b>
            <div class="lbl">Kendimi…</div><div class="gp-sec his">${[1, 2, 3, 4].map(v => b('his', v, GP_HIS[v])).join('')}</div>
            <div class="lbl">Odaklanabildim</div><div class="gp-sec">${[1, 2, 3, 4, 5].map(v => b('odak', v, v)).join('')}</div>
            <div class="lbl">Yorgunluk</div><div class="gp-sec">${[0, 1, 2].map(v => b('yorgun', v, GP_YORGUN[v])).join('')}</div>
            <button class="gp-kaydet" style="width:100%;margin-top:10px;padding:10px;border-radius:12px;border:0;font:inherit;font-weight:900;background:${s.his && s.odak && s.yorgun >= 0 ? '#f0c860' : 'rgba(127,127,127,.25)'};color:#1a1405;cursor:pointer" ${s.his && s.odak && s.yorgun >= 0 ? '' : 'disabled'} onclick="gpOzKaydet('${gpEsc(g)}')">✓ Kaydet</button></div>`;
    } else if (oz) ozHTML = `<div style="font-size:12.5px;color:var(--text-muted);margin-bottom:8px">Bugün: ${GP_HIS[oz.his] || ''} · odak ${oz.odak} · ${GP_YORGUN[oz.yorgun] ? GP_YORGUN[oz.yorgun].toLocaleLowerCase('tr-TR') + ' yorgun' : ''} ✓</div>`;
    let hedefler = Object.values(P.hedef);
    let segler = [1, 2, 3, 4].map(i => `<i class="${i < P.hafta ? 'd' : i === P.hafta ? 'b' : ''}"></i>`).join('');
    let grup = P.grup ? `<div class="gp-grup">${gpHedefSVG(P.grup, P.kon, 64)}<div><b>${P.grup.okIsaret} ${gpEsc(P.grup.oneri)}</b><small>${gpEsc(P.grup.aciklama)} Grup çapı ${gpV(P.grup.cap)} halka.</small></div></div>` : '';
    el.innerHTML = `<div class="card" style="margin-bottom:14px">${ozHTML}
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><b style="font-size:14px">📈 Gelişimim</b><span style="font-size:11.5px;color:var(--text-muted)">${P.hafta}. hafta / 4</span></div>
        <div class="gp-segler">${segler}</div>
        ${hedefler.length ? hedefler.map(h => gpHedefSatir(h)).join('') : '<div style="font-size:12.5px;color:var(--text-muted);padding:6px 0">Birkaç antrenman sonra hedeflerin burada çıkacak.</div>'}
        ${P.not ? `<div style="font-size:12.5px;margin-top:8px;padding:8px 10px;border-radius:10px;background:rgba(90,169,255,.1)">💬 Koçun notu: ${gpEsc(P.not)}</div>` : ''}
        ${grup}</div>`;
}
function gpOzKaydet(g) {
    let s = _gpOz, ad = loggedInSporcu; if (!s || !ad || !s.his || !s.odak || s.yorgun < 0) return;
    gpOzYaz(g, ad, { his: s.his, odak: s.odak, yorgun: s.yorgun }); _gpOz = null;
    showToast('✓ Teşekkürler — koçun görecek', 'success'); gelisimWidgetCiz();
}
// ---- 🧑‍🏫 koç: sporcu profilinde tek panel (yonetim-panel.js ekPanel) ----
function gelisimPanelHTML(g, ad) {
    gpCss();
    let P = gpPlan(g, ad); if (!P) return '';
    let hedefler = Object.keys(P.hedef);
    let tablo = hedefler.length ? `<table class="gp-tablo"><thead><tr><th>Hedef</th><th>Başlangıç</th><th>Öneri</th><th>Plan</th><th>Şimdi</th><th></th></tr></thead><tbody>${hedefler.map(k => { let h = P.hedef[k];
        return `<tr><td>${h.ikon} ${gpEsc(h.ad)}</td><td>${h.bicim(h.bas)}</td><td>${h.bicim(h.oneri)}</td><td><input data-gp="${k}" inputmode="decimal" value="${h.koc ? h.bicim(h.hedef) : ''}" placeholder="${h.bicim(h.oneri)}"></td><td>${h.simdi == null ? '—' : h.bicim(h.simdi)}${h.hafta ? ' <small style="color:var(--ap-soluk)">hf</small>' : ''}</td><td>${h.tamam ? '<span class="gp-d i">✓</span>' : ''}</td></tr>`; }).join('')}</tbody></table>` : '<div class="yn-bos">Son 4 haftada yeterli seri yok — birkaç antrenman sonra hedefler önerilir.</div>';
    let trend = gpCapTrend(P.kon), trendMaks = Math.max(1, ...trend.filter(v => v != null));
    let grup = P.grup ? `<div style="display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">${gpHedefSVG(P.grup, P.kon, 150)}<div style="flex:1;min-width:180px"><b style="font-size:15px">${P.grup.okIsaret} ${gpEsc(P.grup.oneri)}</b><div style="font-size:12.5px;color:var(--ap-soluk);margin:4px 0 8px">${gpEsc(P.grup.aciklama)}</div>
            <div class="ap-kpi" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><small>Grup çapı</small><b>${gpV(P.grup.cap)}</b><span>halka</span></div><div><small>Kayma</small><b>${gpV(P.grup.ofset)}</b><span>halka</span></div><div><small>Ok</small><b>${P.grup.n}</b><span>son 30</span></div></div>
            <div class="gp-trend">${trend.map((v, i) => `<div>${v == null ? '·' : '<b style="color:var(--ap-yazi)">' + gpV(v) + '</b><i style="height:' + Math.round(v / trendMaks * 50) + 'px"></i>'}<span>${i === 5 ? 'bu hf' : (5 - i) + ' hf'}</span></div>`).join('')}</div></div></div>`
        : '<div class="yn-bos">Grup analizi için en az 12 ok <b>hedefe dokunarak</b> girilmeli (sayı tuşlarıyla girilen okların konumu yok).</div>';
    let oz = gpOzListe(g, ad).slice(-8), ser = gpSeriler(P.sp), tespit = gpOzTespit(g, ad, P.sp);
    let grafik = oz.length ? (function () {
        let pts = oz.map((o, i) => ({ x: 20 + i * (360 / Math.max(1, oz.length - 1 || 1)), o, ort: gpOrt(ser.filter(s => s.t === o.tarih)) }));
        let ortlar = pts.filter(p => p.ort != null), mn = Math.min(...ortlar.map(p => p.ort), 10), mx = Math.max(...ortlar.map(p => p.ort), 0);
        let y = v => 170 - (mx > mn ? (v - mn) / (mx - mn) : 0.5) * 130;
        let s = pts.map(p => p.o.yorgun === 2 ? `<rect x="${p.x - 16}" y="0" width="32" height="200" fill="rgba(239,100,97,.14)"/>` : '').join('');
        if (ortlar.length > 1) s += `<polyline fill="none" stroke="#3fbf7f" stroke-width="3" points="${ortlar.map(p => p.x.toFixed(0) + ',' + y(p.ort).toFixed(0)).join(' ')}"/>`;
        s += ortlar.map(p => `<circle cx="${p.x.toFixed(0)}" cy="${y(p.ort).toFixed(0)}" r="4" fill="#3fbf7f"/><text x="${p.x.toFixed(0)}" y="${(y(p.ort) - 9).toFixed(0)}" font-size="11" fill="#9aa5b1" text-anchor="middle">${gpV(p.ort)}</text>`).join('');
        s += pts.map(p => `<text x="${p.x.toFixed(0)}" y="195" font-size="17" text-anchor="middle">${GP_HIS[p.o.his] || ''}</text>`).join('');
        return `<svg viewBox="0 0 400 200" style="width:100%;height:180px">${s}</svg><div style="display:flex;gap:12px;font-size:11.5px;color:var(--ap-soluk);flex-wrap:wrap"><span>🟢 ok başı ortalama</span><span>😟→😄 his</span><span style="color:#ef6461">▮ çok yorgun gün</span></div>`;
    })() : '<div class="yn-bos">Henüz öz-değerlendirme yok. Sporcu günün serilerinden sonra kendi telefonunda “Bugün nasıldı?” kartını doldurur.</div>';
    let kk = encodeURIComponent(g + '|' + ad);
    return `<div class="ap-panel" id="gp-panel"><h3>📈 Gelişim <span>4 haftalık plan · ${gpEsc(P.B.bas.split('-').reverse().join('.'))} – ${gpEsc(P.B.bit.split('-').reverse().join('.'))} · ${P.hafta}. hafta</span></h3>
        ${tablo}
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px"><input id="gp-not" maxlength="200" placeholder="Sporcuya not (ana ekranında görünür)" value="${gpEsc(P.not)}" style="flex:1;min-width:200px;font:inherit;padding:8px 10px;border-radius:8px;border:1px solid var(--ap-cizgi);background:var(--ap-zemin);color:var(--ap-yazi)"><button class="ap-btn ana" onclick="gpPlanKaydet('${kk}')">💾 Planı kaydet</button></div>
        ${tespit.map(t => `<div class="gp-tespit">${gpEsc(t)}</div>`).join('')}
        <div class="ap-iki" style="margin-top:12px"><div><h3 style="margin:0 0 8px">📍 Grup / nişangah <span>hedefe dokunarak girilen son 30 ok</span></h3>${grup}</div>
            <div><h3 style="margin:0 0 8px">🙂 His ve skor <span>son ${oz.length || 0} değerlendirme</span></h3>${grafik}</div></div></div>`;
}
function gpPlanKaydet(kk) {
    let k = decodeURIComponent(kk), i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1), hedef = {};
    document.querySelectorAll('#gp-panel [data-gp]').forEach(e => { let v = String(e.value || '').replace(',', '.').trim(); if (v !== '' && !isNaN(Number(v))) hedef[e.getAttribute('data-gp')] = Number(v); });
    gpPlanYaz(g, ad, { hedef: hedef, not: ((document.getElementById('gp-not') || {}).value || '').trim() });
    showToast('💾 Plan kaydedildi — sporcunun ana ekranında', 'success');
    try { ynKartYenile(); } catch (e) {}
}
