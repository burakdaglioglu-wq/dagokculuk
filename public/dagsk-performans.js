/* ================================================================================================
   PERFORMANS ARAÇLARI — Karışık Sınıf (2026-09-27)
   Performans sporcuları için üç araç:
     🏅 Resmi Tur     — WA formatı: süreli sıralama turu (72/36 ok), set sistemli eleme, shoot-off, karne
     🏹 Ok Analizi    — numaralı + hedefte konumlu ok kaydı; "5 numaralı ok sola kaçıyor", grup merkezi kayması
     🧠 Baskı Görevleri — "son ok 9+", "3 seri 27+", X düellosu… başarı oranı zamanla izlenir
   app.js'in genel fonksiyonlarını kullanır (esc, showToast, sesCal, _skorKaydetCekirdek, hedefeMesafePuan,
   onayIste, turnuvaDB, _kmListe, _yeniPdfAl, _kurumsalBaslikCiz, _trTranslit). app.js'ten SONRA yüklenir.
   Hedef koordinatları: merkez (0,0), her halka 10 birim (X yarıçapı 5, dış çizgi 100) — bireysel skor
   ekranı ve Oyunlar'daki hedef girişiyle aynı birim.
   ================================================================================================ */

// ---------------------------------------------------------------- ortak: stil
function kmPfCssYukle() {
    if (document.getElementById('km-pf-css')) return;
    let st = document.createElement('style');
    st.id = 'km-pf-css';
    st.textContent = `
.pf { display:flex; flex-direction:column; gap:12px; }
.pf-ust { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
.pf-baslik { font-size:18px; font-weight:900; color:var(--text-primary); }
.pf-alt { font-size:12px; color:var(--text-secondary); line-height:1.45; }
.pf-kart { border:1px solid var(--border-color); border-radius:14px; background:var(--surface-1); padding:12px; display:flex; flex-direction:column; gap:10px; }
.pf-etiket { font-size:11px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; color:var(--text-secondary); }
.pf-secim { display:flex; gap:6px; flex-wrap:wrap; }
.pf-secim button { min-height:36px; padding:0 12px; border-radius:10px; border:1px solid var(--border-color); background:transparent; color:var(--text-secondary); font-weight:800; font-size:12.5px; cursor:pointer; }
.pf-secim button.aktif { background:color-mix(in srgb, var(--accent) 22%, transparent); border-color:var(--accent); color:var(--text-primary); }
.pf-btn { min-height:42px; padding:0 16px; border-radius:11px; border:1px solid var(--border-color); background:transparent; color:var(--text-primary); font-weight:800; font-size:13px; cursor:pointer; }
.pf-btn.birincil { background:var(--accent); border-color:var(--accent); color:var(--text-on-accent-dark, #0b0f1c); }
.pf-btn.basari { background:var(--status-success); border-color:var(--status-success); color:#fff; }
.pf-btn.tehlike { border-color:var(--status-danger); color:var(--status-danger); }
.pf-btn:disabled { opacity:.45; cursor:default; }
.pf-btnler { display:flex; gap:8px; flex-wrap:wrap; }
.pf-sayac { font-size:34px; font-weight:900; font-variant-numeric:tabular-nums; color:var(--text-primary); letter-spacing:.02em; }
.pf-sayac.uyari { color:var(--status-warning); }
.pf-sayac.bitti { color:var(--status-danger); animation:pfNabiz 1s ease-in-out infinite; }
@keyframes pfNabiz { 50% { opacity:.45; } }
.pf-tablo { width:100%; border-collapse:collapse; font-size:13px; font-variant-numeric:tabular-nums; }
.pf-tablo th { text-align:left; font-size:10.5px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--text-secondary); padding:6px 6px; border-bottom:1px solid var(--border-color); }
.pf-tablo td { padding:8px 6px; border-bottom:1px solid color-mix(in srgb, var(--border-color) 60%, transparent); color:var(--text-primary); }
.pf-tablo tr.tik { cursor:pointer; }
.pf-tablo tr.tik:hover td { background:color-mix(in srgb, var(--accent) 8%, transparent); }
.pf-tablo td.sag, .pf-tablo th.sag { text-align:right; }
.pf-kaydir { overflow-x:auto; }
.pf-chip { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:800; border:1px solid var(--border-color); color:var(--text-secondary); }
.pf-chip.ok { border-color:var(--status-success); color:var(--status-success); }
.pf-chip.bek { border-color:var(--status-warning); color:var(--status-warning); }
.pf-chip.pb { border-color:#eab308; color:#eab308; }
.pf-giris { display:grid; grid-template-columns:minmax(0, 320px) minmax(0, 1fr); gap:14px; align-items:start; }
.pf-hedef { width:100%; max-width:320px; aspect-ratio:1; touch-action:manipulation; cursor:crosshair; display:block; }
.pf-slotlar { display:flex; gap:6px; flex-wrap:wrap; }
.pf-slot { min-width:40px; height:40px; padding:0 6px; border-radius:10px; border:1.5px dashed var(--border-color); display:flex; align-items:center; justify-content:center; flex-direction:column; font-weight:900; font-size:15px; color:var(--text-primary); background:transparent; }
.pf-slot.dolu { border-style:solid; cursor:pointer; }
.pf-slot small { font-size:9px; font-weight:800; color:var(--text-secondary); line-height:1; }
.pf-pad { display:grid; grid-template-columns:repeat(6, minmax(0,1fr)); gap:6px; }
.pf-pad button { min-height:42px; border-radius:10px; border:none; font-weight:900; font-size:15px; cursor:pointer; }
.pf-okno { display:flex; gap:5px; flex-wrap:wrap; }
.pf-okno button { min-width:34px; min-height:34px; border-radius:9px; border:1px solid var(--border-color); background:transparent; color:var(--text-primary); font-weight:900; cursor:pointer; }
.pf-okno button.aktif { background:var(--accent); border-color:var(--accent); color:var(--text-on-accent-dark, #0b0f1c); }
.pf-okno button.kullanildi { opacity:.35; }
.pf-sonuc { text-align:center; padding:18px 12px; border-radius:14px; font-size:22px; font-weight:900; }
.pf-sonuc.evet { background:color-mix(in srgb, var(--status-success) 18%, transparent); color:var(--status-success); }
.pf-sonuc.hayir { background:color-mix(in srgb, var(--status-danger) 14%, transparent); color:var(--status-danger); }
.pf-sonuc small { display:block; font-size:12.5px; font-weight:700; color:var(--text-secondary); margin-top:4px; }
.pf-mac { display:grid; grid-template-columns:1fr auto 1fr; gap:8px; align-items:center; text-align:center; }
.pf-mac b { font-size:15px; color:var(--text-primary); }
.pf-mac .skor { font-size:30px; font-weight:900; font-variant-numeric:tabular-nums; color:var(--text-primary); }
.pf-setler { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; font-size:12px; color:var(--text-secondary); }
.pf-setler span { padding:3px 8px; border-radius:8px; background:var(--surface-2); font-variant-numeric:tabular-nums; }
.pf-bracket { display:flex; gap:14px; overflow-x:auto; padding-bottom:4px; }
.pf-bracket > div { display:flex; flex-direction:column; justify-content:space-around; gap:8px; min-width:160px; }
.pf-bmac { border:1px solid var(--border-color); border-radius:10px; padding:6px 8px; font-size:12px; background:var(--surface-2); cursor:pointer; }
.pf-bmac.aktif { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent); }
.pf-bmac div { display:flex; justify-content:space-between; gap:6px; color:var(--text-primary); }
.pf-bmac div.kaz { font-weight:900; }
.pf-bmac div.kay { opacity:.5; }
.pf-gorevler { display:grid; grid-template-columns:repeat(auto-fill, minmax(190px, 1fr)); gap:8px; }
.pf-gorev { text-align:left; border:1px solid var(--border-color); border-radius:12px; background:var(--surface-2); padding:10px; cursor:pointer; color:var(--text-primary); display:flex; flex-direction:column; gap:4px; }
.pf-gorev b { font-size:13.5px; }
.pf-gorev small { font-size:11.5px; color:var(--text-secondary); line-height:1.35; }
.pf-gorev.aktif { border-color:var(--accent); box-shadow:0 0 0 1px var(--accent); }
.pf-isi td.hucre { text-align:center; font-weight:800; border-radius:6px; }
.pf-bulgu { display:flex; gap:10px; padding:10px 12px; border-radius:12px; border:1px solid var(--border-color); background:var(--surface-2); font-size:13px; line-height:1.45; color:var(--text-primary); }
.pf-bulgu.uyari { border-color:color-mix(in srgb, var(--status-warning) 60%, transparent); background:color-mix(in srgb, var(--status-warning) 9%, transparent); }
.pf-bulgu .ik { font-size:20px; }
@media (max-width: 700px) { .pf-giris { grid-template-columns:1fr; } .pf-hedef { max-width:300px; margin:0 auto; } .pf-sayac { font-size:28px; } }
@media (prefers-reduced-motion: reduce) { .pf-sayac.bitti { animation:none; } }
`;
    document.head.appendChild(st);
}

// ---------------------------------------------------------------- ortak: yardımcılar
const KM_PF_DEGER = { X: 10, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1, M: 0 };
const KM_PF_SIRA = { X: 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1, M: 0 };
function kmPfDeger(p) { return KM_PF_DEGER[p] || 0; }
function kmPfToplam(oklar) { return oklar.reduce((a, o) => a + kmPfDeger(o.puan), 0); }
// Kısa ad: ilk ad — ama sınıfta aynı ilk adı taşıyan başka biri varsa (iki "Ahmet") tam ad.
function kmPfIlkAd(ad) {
    ad = String(ad || ''); let ilk = ad.split(' ')[0];
    if (ilk === ad || ad.indexOf('🤖') === 0) return ad;
    let cakisma = (typeof _kmListe !== 'undefined' ? _kmListe : []).some(k => k.ad !== ad && String(k.ad).split(' ')[0].toLocaleLowerCase('tr-TR') === ilk.toLocaleLowerCase('tr-TR'));
    return cakisma ? ad : ilk;
}
function kmPfKey(k) { return k.g + '|' + k.ad; }
function kmPfSaat(sn) { sn = Math.max(0, Math.ceil(sn)); return Math.floor(sn / 60) + ':' + String(sn % 60).padStart(2, '0'); }
function kmPfRenk(p) {
    let v = kmPfDeger(p);
    if (p === 'M') return ['#6b7280', '#fff'];
    if (v >= 9) return ['#ffcc33', '#111'];
    if (v >= 7) return ['#e53939', '#fff'];
    if (v >= 5) return ['#2f8fe0', '#fff'];
    if (v >= 3) return ['#1f1f24', '#fff'];
    return ['#f5f5f5', '#111'];
}
function kmPfOkRozet(p, okNo) {
    let r = kmPfRenk(p);
    return `<span class="pf-slot dolu" style="background:${r[0]}; color:${r[1]}; border-color:${r[0]}; cursor:default;">${p}${okNo ? `<small style="color:${r[1]}; opacity:.8;">#${okNo}</small>` : ''}</span>`;
}
function kmPfKonumdanPuan(x, y) { return hedefeMesafePuan(Math.hypot(x, y), false, '10ring').puan; }
// Puana uygun rastgele bir konum (sanal rakip okları ve konumsuz girişlerin gösterimi için).
function kmPfPuandanKonum(p) {
    let v = kmPfDeger(p), r;
    if (p === 'X') r = Math.random() * 4.5;
    else if (p === 'M') r = 102 + Math.random() * 3;
    else r = (10 - v) * 10 + 0.8 + Math.random() * 8.4;
    let a = Math.random() * Math.PI * 2;
    return { x: Math.round(Math.cos(a) * r * 10) / 10, y: Math.round(Math.sin(a) * r * 10) / 10 };
}
function kmPfSes(tur) {
    try {
        if (tur === 'basari') { sesCal(660, 0.09); setTimeout(() => sesCal(880, 0.09), 110); setTimeout(() => sesCal(1320, 0.16), 220); }
        else if (tur === 'basarisiz') { sesCal(330, 0.12); setTimeout(() => sesCal(220, 0.25), 150); }
        else if (tur === 'uyari') sesCal(990, 0.12);
        else if (tur === 'bitti') { sesCal(440, 0.6); }
        else if (tur === 'bip') sesCal(1200, 0.05);
    } catch (e) {}
}
function kmPfRoster() { return (typeof _kmListe !== 'undefined' ? _kmListe : []).filter(k => turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]); }

// ---------------------------------------------------------------- ortak: hedef SVG
// oklar: [{x,y,puan,okNo,renk}]; merkezler: [{x,y,etiket,renk}] (ok-no grup merkezleri için)
function kmPfHedefSVG(id, oklar, secenek) {
    secenek = secenek || {};
    let halkalar = [['#f5f5f5', '#c9c9c9'], ['#f5f5f5', '#c9c9c9'], ['#1f1f24', '#6b7280'], ['#1f1f24', '#6b7280'], ['#2f8fe0', '#1d5f99'], ['#2f8fe0', '#1d5f99'], ['#e53939', '#9b2020'], ['#e53939', '#9b2020'], ['#ffcc33', '#b88a0f'], ['#ffcc33', '#b88a0f']];
    let h = halkalar.map((c, i) => `<circle cx="0" cy="0" r="${100 - i * 10}" fill="${c[0]}" stroke="${c[1]}" stroke-width="0.6"/>`).join('');
    h += `<circle cx="0" cy="0" r="5" fill="none" stroke="#b88a0f" stroke-width="0.5"/><path d="M-2 0H2M0 -2V2" stroke="#7a5a05" stroke-width="0.5"/>`;
    let isaret = (oklar || []).map((o, i) => {
        if (o.x == null) return '';
        let renk = o.renk || '#0ea5e9';
        let yazi = o.okNo ? String(o.okNo) : (secenek.sira ? String(i + 1) : '');
        return `<g><circle cx="${o.x}" cy="${o.y}" r="${secenek.kucuk ? 2.6 : 5.2}" fill="${renk}" stroke="#fff" stroke-width="${secenek.kucuk ? 0.6 : 1}" opacity="${secenek.kucuk ? 0.75 : 1}"/>${yazi && !secenek.kucuk ? `<text x="${o.x}" y="${o.y + 2.1}" text-anchor="middle" font-size="5.8" font-weight="900" fill="#fff" style="pointer-events:none">${yazi}</text>` : ''}</g>`;
    }).join('');
    let merkez = (secenek.merkezler || []).map(m => `<g><circle cx="${m.x}" cy="${m.y}" r="7.5" fill="${m.renk}" stroke="#fff" stroke-width="1.6"/><text x="${m.x}" y="${m.y + 2.8}" text-anchor="middle" font-size="7.5" font-weight="900" fill="#fff" style="pointer-events:none">${m.etiket}</text></g>`).join('');
    let arti = secenek.genelMerkez ? `<g stroke="#0b0f1c" stroke-width="1.4"><path d="M${secenek.genelMerkez.x - 7} ${secenek.genelMerkez.y}H${secenek.genelMerkez.x + 7}M${secenek.genelMerkez.x} ${secenek.genelMerkez.y - 7}V${secenek.genelMerkez.y + 7}"/></g>` : '';
    let iz = secenek.iz && secenek.iz.length > 1 ? `<polyline points="${secenek.iz.map(p => p.x + ',' + p.y).join(' ')}" fill="none" stroke="#0b0f1c" stroke-width="1.2" stroke-dasharray="2 1.5"/>` + secenek.iz.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="${i === secenek.iz.length - 1 ? 3.6 : 2.2}" fill="${i === secenek.iz.length - 1 ? '#0b0f1c' : '#475569'}" stroke="#fff" stroke-width="0.7"/>`).join('') : '';
    let tik = secenek.tik ? ` onclick="${secenek.tik}(event)"` : '';
    return `<svg id="${id}" class="pf-hedef" viewBox="-105 -105 210 210" preserveAspectRatio="xMidYMid meet"${tik} role="img" aria-label="Hedef">${h}${isaret}${iz}${arti}${merkez}</svg>`;
}
function kmPfSvgNokta(ev, svg) {
    let rect = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
    let k = Math.min(rect.width / vb.width, rect.height / vb.height);
    let ox = rect.left + (rect.width - vb.width * k) / 2, oy = rect.top + (rect.height - vb.height * k) / 2;
    return { x: Math.round((vb.x + (ev.clientX - ox) / k) * 10) / 10, y: Math.round((vb.y + (ev.clientY - oy) / k) * 10) / 10 };
}

// ---------------------------------------------------------------- ortak: ok giriş paneli
// Tek panel, üç araç kullanır. cfg: { ok, baslik, okNo:bool, okSeti:n, tamamYazi, onKaydet(oklar), onIptal }
let _pfG = null;
function kmPfGirisAc(kapId, cfg) {
    let modTercih = 'hedef'; try { modTercih = localStorage.getItem('dag_pf_giris_mod') || 'hedef'; } catch (e) {}
    _pfG = Object.assign({ kapId, oklar: [], mod: modTercih, secili: -1, okSeti: 6 }, cfg);
    kmPfGirisCiz();
}
function kmPfGirisCiz() {
    let g = _pfG; if (!g) return;
    let kap = document.getElementById(g.kapId); if (!kap) return;
    let slotlar = '';
    for (let i = 0; i < g.ok; i++) {
        let o = g.oklar[i];
        if (o) { let r = kmPfRenk(o.puan); slotlar += `<button class="pf-slot dolu${g.secili === i ? ' secili' : ''}" style="background:${r[0]}; color:${r[1]}; border-color:${g.secili === i ? 'var(--accent)' : r[0]};${g.secili === i ? ' box-shadow:0 0 0 2px var(--accent);' : ''}" onclick="kmPfGirisSlot(${i})" title="Seç / sil">${o.puan}${g.okNo ? `<small style="color:${r[1]}">${o.okNo ? '#' + o.okNo : '#?'}</small>` : ''}</button>`; }
        else slotlar += `<span class="pf-slot">${i + 1}</span>`;
    }
    let pad = '';
    if (g.mod === 'rakam') {
        pad = `<div class="pf-pad">${['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'].map(p => { let r = kmPfRenk(p); return `<button style="background:${r[0]}; color:${r[1]};" onclick="kmPfGirisPad('${p}')">${p}</button>`; }).join('')}</div>`;
    }
    let okNoPanel = '';
    if (g.okNo && g.oklar.length) {
        let hedefIdx = g.secili >= 0 ? g.secili : g.oklar.length - 1, kullanilan = g.oklar.map(o => o.okNo);
        okNoPanel = `<div><div class="pf-etiket">${hedefIdx + 1}. okun numarası</div><div class="pf-okno">${Array.from({ length: g.okSeti }, (_, i) => i + 1).map(n => `<button class="${g.oklar[hedefIdx] && g.oklar[hedefIdx].okNo === n ? 'aktif' : (kullanilan.indexOf(n) !== -1 ? 'kullanildi' : '')}" onclick="kmPfGirisOkNo(${n})">${n}</button>`).join('')}</div></div>`;
    }
    let dolu = g.oklar.length >= g.ok, eksikNo = g.okNo && g.oklar.some(o => !o.okNo);
    kap.innerHTML = `<div class="pf-kart">
        <div class="pf-ust"><b style="color:var(--text-primary)">${g.baslik || ''}</b>
            <div class="pf-secim"><button class="${g.mod === 'hedef' ? 'aktif' : ''}" onclick="kmPfGirisMod('hedef')">🎯 Hedefe dokun</button><button class="${g.mod === 'rakam' ? 'aktif' : ''}" onclick="kmPfGirisMod('rakam')">🔢 Rakam</button></div></div>
        <div class="pf-giris">
            <div>${kmPfHedefSVG('pf-giris-hedef', g.oklar.map(o => Object.assign({ renk: '#0ea5e9' }, o)), { tik: g.mod === 'hedef' && !dolu ? 'kmPfGirisTik' : null, sira: !g.okNo })}</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
                <div class="pf-slotlar">${slotlar}</div>
                <div class="pf-alt">Toplam: <b style="color:var(--text-primary); font-size:16px;">${kmPfToplam(g.oklar)}</b> · ${g.oklar.length}/${g.ok} ok${g.mod === 'hedef' ? ' · okun düştüğü yere dokun' : ''}${g.oklar.length ? ' · silmek için kutuya dokun' : ''}</div>
                ${pad}${okNoPanel}
                <div class="pf-btnler"><button class="pf-btn basari" ${dolu && !eksikNo ? '' : 'disabled'} onclick="kmPfGirisKaydet()">${g.tamamYazi || '✓ Kaydet'}</button>${g.onIptal ? `<button class="pf-btn" onclick="kmPfGirisIptal()">Vazgeç</button>` : ''}</div>
                ${eksikNo && dolu ? '<div class="pf-alt">Her okun numarasını seç.</div>' : ''}
            </div>
        </div></div>`;
}
function kmPfGirisMod(m) { if (!_pfG) return; _pfG.mod = m; try { localStorage.setItem('dag_pf_giris_mod', m); } catch (e) {} kmPfGirisCiz(); }
function kmPfSiradakiOkNo() {
    let g = _pfG, kullanilan = g.oklar.map(o => o.okNo);
    for (let n = 1; n <= g.okSeti; n++) if (kullanilan.indexOf(n) === -1) return n;
    return null;
}
function kmPfGirisEkle(o) {
    let g = _pfG; if (!g || g.oklar.length >= g.ok) return;
    if (g.okNo) o.okNo = kmPfSiradakiOkNo();
    g.oklar.push(o); g.secili = -1;
    kmPfSes('bip');
    kmPfGirisCiz();
}
function kmPfGirisTik(ev) {
    let svg = document.getElementById('pf-giris-hedef'); if (!svg || !_pfG) return;
    let p = kmPfSvgNokta(ev, svg);
    if (Math.hypot(p.x, p.y) > 104) return;
    kmPfGirisEkle({ puan: kmPfKonumdanPuan(p.x, p.y), x: p.x, y: p.y });
}
function kmPfGirisPad(p) { kmPfGirisEkle({ puan: p }); }
function kmPfGirisSlot(i) {
    let g = _pfG; if (!g) return;
    if (g.okNo && g.secili !== i) { g.secili = i; kmPfGirisCiz(); return; }
    g.oklar.splice(i, 1); g.secili = -1; kmPfGirisCiz();
}
function kmPfGirisOkNo(n) {
    let g = _pfG; if (!g) return;
    let idx = g.secili >= 0 ? g.secili : g.oklar.length - 1; if (idx < 0) return;
    let digeri = g.oklar.findIndex((o, j) => j !== idx && o.okNo === n);
    if (digeri !== -1) g.oklar[digeri].okNo = g.oklar[idx].okNo || null;
    g.oklar[idx].okNo = n; g.secili = -1;
    kmPfGirisCiz();
}
function kmPfGirisKaydet() {
    let g = _pfG; if (!g || g.oklar.length < g.ok) return;
    let oklar = g.oklar.slice(); _pfG = null;
    g.onKaydet(oklar);
}
function kmPfGirisIptal() { let g = _pfG; _pfG = null; if (g && g.onIptal) g.onIptal(); }

// ---------------------------------------------------------------- ortak: gerçek skor kaydı
// Yarışma/Oyunlar ile aynı çekirdek; ok konumu, ok numarası, mesafe ve kaynak detaylı oklara işlenir.
function kmPfSeriKaydet(k, oklar, ek, bitti) {
    let kaydedilecek = oklar.map(o => Object.assign({ puan: o.puan }, o.x != null ? { x: o.x, y: o.y, tip: '10ring' } : {}, o.okNo ? { okNo: o.okNo } : {}, { tarih: bugunISO() }, ek || {}));
    let sonuc = _skorKaydetCekirdek(k.g, k.ad, kaydedilecek);
    let devam = () => {
        if (!sonuc.ok) { showToast(k.ad + ': kayıt yapılamadı (' + (sonuc.sebep || '?') + ').', 'error'); if (bitti) bitti(false); return; }
        try { klasmanDoldur(); } catch (e) {}
        try { otomatikYoklamaIsaretle(k.ad, k.g); } catch (e) {}
        if (bitti) bitti(true);
    };
    if (!sonuc.ok && sonuc.sebep === 'limit-doldu') {
        onayIste(esc(k.ad) + ' için günlük seri limiti (' + sonuc.limit + ') doldu.<br><br>Seriyi uzatıp bu skoru kaydetmek ister misin?', function () {
            sonuc.grupData.devamModu = true; sonuc.grupData.lastModified = Date.now();
            try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
            sonuc = _skorKaydetCekirdek(k.g, k.ad, kaydedilecek);
            devam();
        }, 'Devam Et');
        return;
    }
    devam();
}

// ---------------------------------------------------------------- ortak: kalıcı kayıt (localStorage + /api/meta, id ile birleşir)
function kmPfDepoOku(anahtar) { try { return JSON.parse(localStorage.getItem('dag_' + anahtar) || '[]') || []; } catch (e) { return []; } }
function kmPfDepoBirlestir(a, b) {
    let m = {}; (a || []).concat(b || []).forEach(r => { if (r && r.id) m[r.id] = r; });
    return Object.values(m).sort((x, y) => (x.t || 0) - (y.t || 0)).slice(-600);
}
function kmPfDepoYaz(anahtar, kayit) {
    let liste = kmPfDepoBirlestir(kmPfDepoOku(anahtar), [kayit]);
    try { localStorage.setItem('dag_' + anahtar, JSON.stringify(liste)); } catch (e) {}
    fetch('/api/meta/' + anahtar).then(r => r.json()).catch(() => ({})).then(d => {
        let uzak = []; try { uzak = d && d.value ? JSON.parse(d.value) : []; } catch (e) {}
        let tum = kmPfDepoBirlestir(uzak, kmPfDepoOku(anahtar));
        try { localStorage.setItem('dag_' + anahtar, JSON.stringify(tum)); } catch (e) {}
        return fetch('/api/meta/' + anahtar, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: JSON.stringify(tum) }) });
    }).catch(() => {});
}
function kmPfDepoCek(anahtar, sonra) {
    fetch('/api/meta/' + anahtar).then(r => r.json()).then(d => {
        let uzak = []; try { uzak = d && d.value ? JSON.parse(d.value) : []; } catch (e) {}
        let once = kmPfDepoOku(anahtar).length;
        let tum = kmPfDepoBirlestir(kmPfDepoOku(anahtar), uzak);
        try { localStorage.setItem('dag_' + anahtar, JSON.stringify(tum)); } catch (e) {}
        if (tum.length !== once && sonra) sonra();
    }).catch(() => {});
}

// ================================================================================================
// 🏅 RESMİ TUR — WA formatı. Sıralama turu (süreli 6'lı seriler) → set sistemli eleme (3 ok/set, kazanan
// set 2 puan, beraberlik 1-1, 6 set puanı alan kazanır, 5-5'te tek ok shoot-off: yüksek puan, eşitse
// merkeze en yakın) → karne. Tek sporcu varsa elemeler sanal rakiplere karşı (çeyrek → yarı → final).
// Durum konuma özel localStorage'da tutulur: sayfa yenilense de tur kaldığı yerden sürer.
// ================================================================================================
const KM_RT_FORMATLAR = { tam: { ad: '72 ok (12 × 6)', seri: 12, ok: 6 }, yarim: { ad: '36 ok (6 × 6)', seri: 6, ok: 6 }, kisa: { ad: '18 ok (6 × 3)', seri: 6, ok: 3 } };
const KM_RT_SEVIYE = { kolay: { ad: 'Kolay', ort: 8.1 }, orta: { ad: 'Orta', ort: 8.8 }, zor: { ad: 'Zor', ort: 9.25 }, elit: { ad: 'Elit', ort: 9.55 } };
let _kmRt = null, _kmRtTimer = null, _kmRtGiris = null, _kmRtKarneKey = null;
function kmRtAnahtar() { return 'dag_km_resmitur_' + (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum ? _kmAktifKonum : 'varsayilan'); }
function kmRtYukle() {
    if (_kmRt) return _kmRt;
    try { _kmRt = JSON.parse(localStorage.getItem(kmRtAnahtar()) || 'null'); } catch (e) { _kmRt = null; }
    if (!_kmRt) _kmRt = kmRtYeni();
    return _kmRt;
}
function kmRtYeni() { return { asama: 'kurulum', ayar: { mesafe: '70m', format: 'tam', kayit: true, seviye: 'otomatik' }, katilimci: [], seri: 0, skor: {}, sayac: null, eleme: null, bitis: null, id: null }; }
function kmRtKaydet() { try { localStorage.setItem(kmRtAnahtar(), JSON.stringify(_kmRt)); } catch (e) {} }
function kmRtFormat() { return KM_RT_FORMATLAR[kmRtYukle().ayar.format] || KM_RT_FORMATLAR.tam; }
function kmRtSeriSure(ok) { return ok >= 6 ? 240 : 120; }

function kmResmiTurCiz() {
    kmPfCssYukle();
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    let d = kmRtYukle();
    if (d.asama === 'kurulum') ic.innerHTML = kmRtKurulumHTML();
    else if (d.asama === 'siralama') ic.innerHTML = kmRtSiralamaHTML();
    else if (d.asama === 'eleme') ic.innerHTML = kmRtElemeHTML();
    else ic.innerHTML = kmRtKarneHTML();
    if (_kmRtGiris) kmPfGirisAc('pf-rt-giris', _kmRtGiris);
    kmRtSayacTik();
}
// ---- kurulum
function kmRtKurulumHTML() {
    let d = kmRtYukle(), roster = kmPfRoster();
    if (!d.katilimci.length) d.katilimci = roster.map(kmPfKey);
    let secim = (ad, deger, fn, aktif) => `<button class="${aktif ? 'aktif' : ''}" onclick="${fn}('${deger}')">${ad}</button>`;
    let arsiv = kmPfDepoOku('km_pf_resmi').slice(-6).reverse();
    return `<div class="pf">
        <div class="pf-ust"><div><div class="pf-baslik">🏅 Resmi Tur</div><div class="pf-alt">Gerçek yarışma provası: süreli sıralama turu, set sistemli eleme maçları, shoot-off ve karne. Atılan her ok sporcunun gerçek skoruna işlenir.</div></div></div>
        <div class="pf-kart">
            <div class="pf-etiket">Katılanlar (${d.katilimci.length})</div>
            <div class="pf-secim">${roster.length ? roster.map((k, i) => `<button class="${d.katilimci.indexOf(kmPfKey(k)) !== -1 ? 'aktif' : ''}" onclick="kmRtKatilimciDegis(${i})">${esc(kmPfIlkAd(k.ad))}</button>`).join('') : '<span class="pf-alt">Önce Karışık Sınıf listesine sporcu ekle.</span>'}</div>
            <div class="pf-etiket">Mesafe</div>
            <div class="pf-secim">${['18m', '30m', '50m', '70m'].map(m => secim(m, m, 'kmRtMesafe', d.ayar.mesafe === m)).join('')}</div>
            <div class="pf-etiket">Sıralama turu</div>
            <div class="pf-secim">${Object.keys(KM_RT_FORMATLAR).map(f => secim(KM_RT_FORMATLAR[f].ad, f, 'kmRtFormatSec', d.ayar.format === f)).join('')}</div>
            <div class="pf-alt">Seri süresi: ${kmPfSaat(kmRtSeriSure(kmRtFormat().ok))} · eleme setleri 2:00 · shoot-off 0:40</div>
            ${d.katilimci.length === 1 ? `<div class="pf-etiket">Sanal rakip seviyesi</div><div class="pf-secim">${secim('Otomatik (ortalamana göre)', 'otomatik', 'kmRtSeviye', d.ayar.seviye === 'otomatik')}${Object.keys(KM_RT_SEVIYE).map(s => secim(KM_RT_SEVIYE[s].ad, s, 'kmRtSeviye', d.ayar.seviye === s)).join('')}</div>` : `<div class="pf-alt">${d.katilimci.length >= 2 ? 'Elemeler sıralamaya göre kurulur (1–8, 4–5, 2–7, 3–6 düzeni); eksik yerler BAY geçer.' : ''}</div>`}
            <label class="pf-alt" style="display:flex; gap:8px; align-items:center;"><input type="checkbox" ${d.ayar.kayit ? 'checked' : ''} onchange="kmRtKayitDegis(this.checked)" style="width:18px; height:18px; appearance:auto !important; -webkit-appearance:checkbox !important;"> Okları sporcuların gerçek skoruna / karnesine işle</label>
            <div class="pf-btnler"><button class="pf-btn birincil" ${d.katilimci.length ? '' : 'disabled'} onclick="kmRtBaslat()">🏁 Sıralama turunu başlat</button></div>
        </div>
        ${arsiv.length ? `<div class="pf-kart"><div class="pf-etiket">Son resmi turlar</div>${arsiv.map(r => `<div class="pf-alt">📅 ${r.tarih} · ${r.mesafe} · ${KM_RT_FORMATLAR[r.format] ? KM_RT_FORMATLAR[r.format].ad : r.format} — ${r.sporcular.slice().sort((a, b) => (a.yer || 99) - (b.yer || 99)).slice(0, 3).map(s => `${s.yer === 1 ? '🥇' : s.yer === 2 ? '🥈' : s.yer === 3 ? '🥉' : ''} ${esc(kmPfIlkAd(s.ad))} ${s.toplam}`).join(' · ')}</div>`).join('')}</div>` : ''}
    </div>`;
}
function kmRtKatilimciDegis(i) { let d = kmRtYukle(), k = kmPfKey(kmPfRoster()[i]), j = d.katilimci.indexOf(k); if (j === -1) d.katilimci.push(k); else d.katilimci.splice(j, 1); kmRtKaydet(); kmResmiTurCiz(); }
function kmRtMesafe(m) { kmRtYukle().ayar.mesafe = m; kmRtKaydet(); kmResmiTurCiz(); }
function kmRtFormatSec(f) { kmRtYukle().ayar.format = f; kmRtKaydet(); kmResmiTurCiz(); }
function kmRtSeviye(s) { kmRtYukle().ayar.seviye = s; kmRtKaydet(); kmResmiTurCiz(); }
function kmRtKayitDegis(v) { kmRtYukle().ayar.kayit = !!v; kmRtKaydet(); }
function kmRtBaslat() {
    let d = kmRtYukle();
    d.katilimci = d.katilimci.filter(k => { let [g, ...r] = k.split('|'); return turnuvaDB[g] && turnuvaDB[g][r.join('|')]; });
    if (!d.katilimci.length) return showToast('Katılan sporcu seç.', 'error');
    d.asama = 'siralama'; d.seri = 0; d.skor = {}; d.eleme = null; d.bitis = null; d.sayac = null;
    d.id = 'rt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    d.katilimci.forEach(k => { d.skor[k] = []; });
    // 72 okluk tur tek başına 12 seri — günlük seri limiti koçu her seride "uzatayım mı?" diye durdurmasın.
    if (d.ayar.kayit) {
        d.katilimci.forEach(k => { let o = kmRtKeyObj(k), sp = turnuvaDB[o.g] && turnuvaDB[o.g][o.ad]; if (sp && !sp.devamModu) { sp.devamModu = true; sp.lastModified = Date.now(); } });
        try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); } catch (e) {}
        try { if (typeof bulutaGonderKontrol === 'function') bulutaGonderKontrol(); } catch (e) {}
    }
    kmRtKaydet(); kmResmiTurCiz();
}
function kmRtKeyAd(k) { return k === 'BOT' ? '🤖 Sanal Rakip' : k.slice(k.indexOf('|') + 1); }
function kmRtKeyObj(k) { let i = k.indexOf('|'); return { g: k.slice(0, i), ad: k.slice(i + 1) }; }
function kmRtIstatistik(k) {
    let seriler = kmRtYukle().skor[k] || [], oklar = [].concat(...seriler);
    return { toplam: kmPfToplam(oklar), on: oklar.filter(o => o.puan === '10' || o.puan === 'X').length, x: oklar.filter(o => o.puan === 'X').length, ok: oklar.length, seriler };
}
function kmRtSiralama() {
    let d = kmRtYukle();
    return d.katilimci.map(k => Object.assign({ k }, kmRtIstatistik(k))).sort((a, b) => b.toplam - a.toplam || b.on - a.on || b.x - a.x);
}
// ---- süre sayacı (dokununca başlar — Yarışma'daki kural)
// Sayaç düğmeleri yalnızca sayaç alanını yeniden çizer — açık ok giriş paneli (girilmiş oklar) kaybolmasın.
function kmRtSayacYenile(sure) { let kap = document.getElementById('pf-rt-sayac-kap'); if (kap) kap.outerHTML = kmRtSayacHTML(sure); kmRtSayacTik(); }
function kmRtSayacBaslat(sure) { let d = kmRtYukle(); d.sayac = { bitis: Date.now() + sure * 1000, sure, uyarildi: false, bitti: false }; kmRtKaydet(); kmPfSes('bip'); kmRtSayacYenile(sure); }
function kmRtSayacDurdur(sure) { let d = kmRtYukle(); d.sayac = null; kmRtKaydet(); kmRtSayacYenile(sure); }
function kmRtSayacTik() {
    clearInterval(_kmRtTimer); _kmRtTimer = null;
    let el = document.getElementById('pf-rt-sayac'), d = kmRtYukle();
    if (!el) return;
    let ciz = () => {
        let el2 = document.getElementById('pf-rt-sayac'); if (!el2) { clearInterval(_kmRtTimer); _kmRtTimer = null; return; }
        if (!d.sayac) { el2.textContent = kmPfSaat(el2.dataset.sure || 240); el2.className = 'pf-sayac'; return; }
        let kalan = (d.sayac.bitis - Date.now()) / 1000;
        el2.textContent = kmPfSaat(kalan);
        el2.className = 'pf-sayac' + (kalan <= 0 ? ' bitti' : (kalan <= 30 ? ' uyari' : ''));
        if (kalan <= 30 && !d.sayac.uyarildi) { d.sayac.uyarildi = true; kmPfSes('uyari'); kmRtKaydet(); }
        if (kalan <= 0 && !d.sayac.bitti) { d.sayac.bitti = true; kmPfSes('bitti'); kmRtKaydet(); showToast('⏱ Süre doldu — atılmayan oklar M sayılır.', 'warning'); }
    };
    ciz();
    if (d.sayac) _kmRtTimer = setInterval(ciz, 250);
}
function kmRtSayacHTML(sure) {
    let d = kmRtYukle();
    return `<div id="pf-rt-sayac-kap" style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;"><span id="pf-rt-sayac" class="pf-sayac" data-sure="${sure}">${kmPfSaat(sure)}</span>
        ${d.sayac ? `<button class="pf-btn" onclick="kmRtSayacDurdur(${sure})">⏹ Sıfırla</button>` : `<button class="pf-btn birincil" onclick="kmRtSayacBaslat(${sure})">▶ Süreyi başlat</button>`}</div>`;
}
// ---- sıralama turu
function kmRtSiralamaHTML() {
    let d = kmRtYukle(), f = kmRtFormat(), sira = kmRtSiralama(), seriNo = d.seri + 1;
    let bekleyen = d.katilimci.filter(k => (d.skor[k] || []).length <= d.seri);
    let yari = f.seri >= 6 && d.seri === Math.floor(f.seri / 2) && bekleyen.length === d.katilimci.length;
    let satirlar = sira.map((s, i) => {
        let bu = s.seriler[d.seri], ad = kmRtKeyAd(s.k);
        return `<tr class="tik" onclick="kmRtSeriGir('${encodeURIComponent(s.k)}')"><td>${i + 1}</td><td><b>${esc(kmPfIlkAd(ad))}</b></td>
            <td>${bu ? `<span class="pf-chip ok">✓ ${kmPfToplam(bu)}</span>` : '<span class="pf-chip bek">atış bekliyor</span>'}</td>
            <td class="sag"><b>${s.toplam}</b></td><td class="sag">${s.on}</td><td class="sag">${s.x}</td><td class="sag">${s.ok ? (s.toplam / s.ok).toFixed(2) : '—'}</td></tr>`;
    }).join('');
    return `<div class="pf">
        <div class="pf-ust"><div><div class="pf-baslik">🏅 Sıralama Turu · Seri ${Math.min(seriNo, f.seri)}/${f.seri}</div><div class="pf-alt">${d.ayar.mesafe} · ${f.ad}${yari ? ' · <b>1. yarı bitti — kısa mola</b>' : ''}</div></div>${kmRtSayacHTML(kmRtSeriSure(f.ok))}</div>
        <div id="pf-rt-giris"></div>
        <div class="pf-kart pf-kaydir"><table class="pf-tablo"><thead><tr><th>#</th><th>Sporcu</th><th>Bu seri</th><th class="sag">Toplam</th><th class="sag">10+X</th><th class="sag">X</th><th class="sag">Ok ort.</th></tr></thead><tbody>${satirlar}</tbody></table>
            <div class="pf-alt">Sporcuya dokun → bu serinin ${f.ok} okunu gir. Beraberlikte önce 10+X, sonra X sayısı belirler.</div></div>
        <div class="pf-btnler">
            ${bekleyen.length === 0 && d.seri + 1 < f.seri ? `<button class="pf-btn birincil" onclick="kmRtSonrakiSeri()">➡ ${seriNo + 1}. seriye geç</button>` : ''}
            ${bekleyen.length === 0 && d.seri + 1 >= f.seri ? `<button class="pf-btn birincil" onclick="kmRtElemeyeGec()">🏆 Sıralama bitti — elemelere geç</button>` : ''}
            ${bekleyen.length ? `<span class="pf-alt">${bekleyen.length} sporcu bu seriyi bekliyor.</span>` : ''}
            <button class="pf-btn tehlike" onclick="kmRtIptal()">Turu iptal et</button>
        </div></div>`;
}
function kmRtSeriGir(kEnc) {
    let k = decodeURIComponent(kEnc), d = kmRtYukle(), f = kmRtFormat();
    if ((d.skor[k] || []).length > d.seri) {
        onayIste(esc(kmRtKeyAd(k)) + ' bu seriyi zaten girdi. Yeniden girilsin mi?<br><small>(Önceki giriş listeden kalkar; karneye işlenmiş okları geri almak için skor ekranını kullan.)</small>', () => { d.skor[k].splice(d.seri); kmRtKaydet(); kmRtSeriGir(kEnc); }, 'Yeniden gir');
        return;
    }
    _kmRtGiris = { ok: f.ok, baslik: `${esc(kmRtKeyAd(k))} — ${d.seri + 1}. seri`, onKaydet: oklar => kmRtSeriKaydet(k, oklar), onIptal: () => { _kmRtGiris = null; kmResmiTurCiz(); } };
    kmResmiTurCiz();
    let el = document.getElementById('pf-rt-giris'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function kmRtSeriKaydet(k, oklar) {
    let d = kmRtYukle();
    _kmRtGiris = null;
    let sirali = oklar.slice().sort((a, b) => KM_PF_SIRA[b.puan] - KM_PF_SIRA[a.puan]);
    d.skor[k] = d.skor[k] || []; d.skor[k][d.seri] = sirali;
    kmRtKaydet();
    if (d.ayar.kayit) kmPfSeriKaydet(kmRtKeyObj(k), oklar, { mesafe: d.ayar.mesafe, kaynak: 'resmitur' });
    kmResmiTurCiz();
}
function kmRtSonrakiSeri() { let d = kmRtYukle(); d.seri++; d.sayac = null; kmRtKaydet(); kmResmiTurCiz(); }
function kmRtIptal() { onayIste('Resmi tur iptal edilsin mi? Girilen skorlar karnede kalır, bu turun tablosu silinir.', () => { _kmRt = kmRtYeni(); _kmRtGiris = null; kmRtKaydet(); kmResmiTurCiz(); }, 'İptal et'); }
// ---- eleme
function kmRtTohumSirasi(n) { if (n <= 1) return [1]; let onceki = kmRtTohumSirasi(n / 2), out = []; onceki.forEach(s => out.push(s, n + 1 - s)); return out; }
function kmRtElemeyeGec() {
    let d = kmRtYukle(), sira = kmRtSiralama().map(s => s.k);
    d.sayac = null;
    if (sira.length === 1) {
        // Tek sporcu: sanal rakiplere karşı çeyrek → yarı → final, her tur rakip biraz güçlenir.
        let ort = kmRtIstatistik(sira[0]), okOrt = ort.ok ? ort.toplam / ort.ok : 8.6;
        let taban = d.ayar.seviye !== 'otomatik' ? KM_RT_SEVIYE[d.ayar.seviye].ort : Math.max(7.2, Math.min(9.6, okOrt - 0.15));
        d.eleme = { tek: true, turlar: ['Çeyrek Final', 'Yarı Final', 'Final'], maclar: [0, 1, 2].map(t => ({ id: 'm' + t, tur: t, a: sira[0], b: 'BOT', botOrt: Math.min(9.8, taban + t * 0.18), setler: [], puanA: 0, puanB: 0, shoot: null, kazanan: null })), aktif: 'm0' };
    } else {
        let n = 1; while (n < sira.length) n *= 2;
        let tohum = kmRtTohumSirasi(n), turSay = Math.log2(n), turAd = t => { let kalan = n / Math.pow(2, t); return kalan === 2 ? 'Final' : kalan === 4 ? 'Yarı Final' : kalan === 8 ? 'Çeyrek Final' : '1/' + (kalan / 2) + ' Final'; };
        let maclar = [];
        for (let t = 0; t < turSay; t++) {
            let adet = n / Math.pow(2, t + 1);
            for (let i = 0; i < adet; i++) maclar.push({ id: 't' + t + 'm' + i, tur: t, i, a: null, b: null, setler: [], puanA: 0, puanB: 0, shoot: null, kazanan: null });
        }
        for (let i = 0; i < n / 2; i++) {
            let m = maclar.find(x => x.tur === 0 && x.i === i), sa = tohum[2 * i], sb = tohum[2 * i + 1];
            m.a = sira[sa - 1] || null; m.b = sira[sb - 1] || null;
        }
        d.eleme = { tek: false, turlar: Array.from({ length: turSay }, (_, t) => turAd(t)), maclar, aktif: null };
        kmRtByeIlerlet();
    }
    d.asama = 'eleme';
    kmRtKaydet(); kmResmiTurCiz();
}
function kmRtByeIlerlet() {
    let e = kmRtYukle().eleme; if (!e || e.tek) return;
    let degisti = true;
    while (degisti) {
        degisti = false;
        e.maclar.forEach(m => {
            if (m.kazanan) return;
            let onceTamam = m.tur === 0 || e.maclar.filter(x => x.tur === m.tur - 1 && (x.i === 2 * m.i || x.i === 2 * m.i + 1)).every(x => x.kazanan);
            if (!onceTamam) return;
            if (m.a && !m.b) { m.kazanan = 'a'; m.bay = true; degisti = true; }
            else if (m.b && !m.a) { m.kazanan = 'b'; m.bay = true; degisti = true; }
            else if (!m.a && !m.b && m.tur > 0) { m.kazanan = 'yok'; degisti = true; }
            if (m.kazanan) kmRtKazananIlerlet(m);
        });
    }
}
function kmRtKazananIlerlet(m) {
    let e = kmRtYukle().eleme; if (e.tek) return;
    let sonraki = e.maclar.find(x => x.tur === m.tur + 1 && x.i === Math.floor(m.i / 2)); if (!sonraki) return;
    let k = m.kazanan === 'a' ? m.a : (m.kazanan === 'b' ? m.b : null);
    if (m.i % 2 === 0) sonraki.a = k; else sonraki.b = k;
}
function kmRtMacBul(id) { return kmRtYukle().eleme.maclar.find(m => m.id === id); }
function kmRtOynanabilir(m) { return m && !m.kazanan && m.a && m.b; }
function kmRtElemeHTML() {
    let d = kmRtYukle(), e = d.eleme;
    if (!e.aktif || !kmRtOynanabilir(kmRtMacBul(e.aktif))) { let s = e.maclar.find(kmRtOynanabilir); e.aktif = s ? s.id : null; }
    let m = e.aktif ? kmRtMacBul(e.aktif) : null;
    let agac = e.tek ? '' : `<div class="pf-kart"><div class="pf-etiket">Eleme tablosu</div><div class="pf-bracket">${e.turlar.map((ad, t) => `<div><div class="pf-etiket" style="text-align:center">${ad}</div>${e.maclar.filter(x => x.tur === t).map(x => `<div class="pf-bmac${x.id === e.aktif ? ' aktif' : ''}" onclick="kmRtMacSec('${x.id}')">
        <div class="${x.kazanan === 'a' ? 'kaz' : (x.kazanan === 'b' ? 'kay' : '')}"><span>${x.a ? esc(kmPfIlkAd(kmRtKeyAd(x.a))) : (x.tur === 0 ? 'BAY' : '…')}</span><b>${x.bay ? '' : x.puanA}</b></div>
        <div class="${x.kazanan === 'b' ? 'kaz' : (x.kazanan === 'a' ? 'kay' : '')}"><span>${x.b ? esc(kmPfIlkAd(kmRtKeyAd(x.b))) : (x.tur === 0 ? 'BAY' : '…')}</span><b>${x.bay ? '' : x.puanB}</b></div></div>`).join('')}</div>`).join('')}</div></div>`;
    let tekYol = e.tek ? `<div class="pf-secim">${e.maclar.map(x => `<button class="${x.id === e.aktif ? 'aktif' : ''}" disabled>${e.turlar[x.tur]} ${x.kazanan ? (x.kazanan === 'a' ? '✅' : '❌') : ''}</button>`).join('')}</div>` : '';
    let macPanel = m ? kmRtMacPanelHTML(m) : `<div class="pf-kart"><div class="pf-sonuc evet">🏆 Elemeler tamamlandı<small>Karneye geçebilirsin.</small></div><div class="pf-btnler"><button class="pf-btn birincil" onclick="kmRtBitir()">📋 Karneleri göster</button></div></div>`;
    return `<div class="pf"><div class="pf-ust"><div><div class="pf-baslik">🏆 Eleme Maçları</div><div class="pf-alt">Set sistemi: her sette 3 ok · seti kazanan 2, beraberlikte 1'er puan · 6 puan alan kazanır · 5–5'te tek ok shoot-off.</div></div></div>
        ${tekYol}${macPanel}<div id="pf-rt-giris"></div>${agac}
        <div class="pf-btnler"><button class="pf-btn tehlike" onclick="kmRtIptal()">Turu iptal et</button></div></div>`;
}
function kmRtMacSec(id) { let m = kmRtMacBul(id); if (!kmRtOynanabilir(m)) return; kmRtYukle().eleme.aktif = id; kmRtKaydet(); _kmRtGiris = null; kmResmiTurCiz(); }
function kmRtMacPanelHTML(m) {
    let d = kmRtYukle(), e = d.eleme;
    let setNo = m.setler.length, sonSet = m.setler[setNo - 1], acikSet = sonSet && (!sonSet.a || !sonSet.b);
    let shootoffSira = !m.kazanan && m.puanA === 5 && m.puanB === 5 && !acikSet;
    let kimBekliyor = [];
    if (shootoffSira) { if (!m.shoot || !m.shoot.a) kimBekliyor.push('a'); if (m.b !== 'BOT' && (!m.shoot || !m.shoot.b)) kimBekliyor.push('b'); }
    else { let s = acikSet ? sonSet : null; if (!s || !s.a) kimBekliyor.push('a'); if (m.b !== 'BOT' && (!s || !s.b)) kimBekliyor.push('b'); }
    let setler = m.setler.map((s, i) => `<span>S${i + 1}: ${s.a ? kmPfToplam(s.a) : '·'}–${s.b ? kmPfToplam(s.b) : '·'}</span>`).join('');
    let shootTxt = m.shoot ? `<span>SO: ${m.shoot.a ? m.shoot.a.puan : '·'}–${m.shoot.b ? m.shoot.b.puan : '·'}</span>` : '';
    let btn = side => `<button class="pf-btn birincil" onclick="kmRtMacGir('${m.id}','${side}')">${esc(kmPfIlkAd(kmRtKeyAd(m[side])))} ${shootoffSira ? 'shoot-off okunu' : 'setini'} gir</button>`;
    return `<div class="pf-kart">
        <div class="pf-ust"><b style="color:var(--text-primary)">${e.turlar[m.tur]}${shootoffSira ? ' · 🎯 SHOOT-OFF' : ` · Set ${Math.min(setNo + (acikSet ? 0 : 1), 5)}`}</b>${kmRtSayacHTML(shootoffSira ? 40 : 120)}</div>
        <div class="pf-mac"><div><b>${esc(kmRtKeyAd(m.a))}</b></div><div class="skor">${m.puanA} – ${m.puanB}</div><div><b>${esc(kmRtKeyAd(m.b))}</b>${m.b === 'BOT' ? `<div class="pf-alt">ok ort. ~${m.botOrt.toFixed(1)}</div>` : ''}</div></div>
        <div class="pf-setler">${setler}${shootTxt}</div>
        ${m.shootEsit ? `<div class="pf-etiket">Shoot-off okları eşit — merkeze hangisi daha yakın?</div><div class="pf-btnler"><button class="pf-btn birincil" onclick="kmRtShootSec('${m.id}','a')">${esc(kmPfIlkAd(kmRtKeyAd(m.a)))}</button><button class="pf-btn birincil" onclick="kmRtShootSec('${m.id}','b')">${esc(kmPfIlkAd(kmRtKeyAd(m.b)))}</button></div>` : `<div class="pf-btnler">${kimBekliyor.map(btn).join('')}</div>`}
        ${shootoffSira ? '<div class="pf-alt">Tek ok. Yüksek puan kazanır; eşitse merkeze en yakın ok (hedefe dokunarak girilirse otomatik ölçülür).</div>' : ''}
    </div>`;
}
function kmRtBotOklar(ort, adet) {
    let out = [];
    for (let i = 0; i < adet; i++) {
        let u1 = Math.random() || 1e-6, u2 = Math.random(), z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        let v = Math.round(ort + z * 0.95); v = Math.max(0, Math.min(10, v));
        let p = v === 0 ? 'M' : (v === 10 && Math.random() < 0.4 ? 'X' : String(v));
        out.push(Object.assign({ puan: p }, kmPfPuandanKonum(p)));
    }
    return out.sort((a, b) => KM_PF_SIRA[b.puan] - KM_PF_SIRA[a.puan]);
}
function kmRtMacGir(id, side) {
    let m = kmRtMacBul(id), d = kmRtYukle(), shoot = m.puanA === 5 && m.puanB === 5 && !(m.setler.length && (!m.setler[m.setler.length - 1].a || !m.setler[m.setler.length - 1].b));
    _kmRtGiris = { ok: shoot ? 1 : 3, baslik: `${esc(kmRtKeyAd(m[side]))} — ${shoot ? 'shoot-off' : (m.setler.length + (m.setler.length && (!m.setler[m.setler.length - 1].a || !m.setler[m.setler.length - 1].b) ? 0 : 1)) + '. set'}`,
        onKaydet: oklar => kmRtMacKaydet(id, side, oklar, shoot), onIptal: () => { _kmRtGiris = null; kmResmiTurCiz(); } };
    kmResmiTurCiz();
    let el = document.getElementById('pf-rt-giris'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function kmRtMacKaydet(id, side, oklar, shoot) {
    let d = kmRtYukle(), m = kmRtMacBul(id);
    _kmRtGiris = null;
    if (d.ayar.kayit && m[side] !== 'BOT') kmPfSeriKaydet(kmRtKeyObj(m[side]), oklar, { mesafe: d.ayar.mesafe, kaynak: 'resmitur-eleme' });
    if (shoot) {
        m.shoot = m.shoot || {}; m.shoot[side] = oklar[0];
        if (m.b === 'BOT' && !m.shoot.b) m.shoot.b = kmRtBotOklar(m.botOrt, 1)[0];
        if (m.shoot.a && m.shoot.b) {
            let va = KM_PF_SIRA[m.shoot.a.puan], vb = KM_PF_SIRA[m.shoot.b.puan];
            if (va !== vb) m.kazanan = va > vb ? 'a' : 'b';
            else if (m.shoot.a.x != null && m.shoot.b.x != null) m.kazanan = Math.hypot(m.shoot.a.x, m.shoot.a.y) <= Math.hypot(m.shoot.b.x, m.shoot.b.y) ? 'a' : 'b';
            else m.shootEsit = true;
            if (m.kazanan) { m.puanA += m.kazanan === 'a' ? 1 : 0; m.puanB += m.kazanan === 'b' ? 1 : 0; }
        }
    } else {
        let s = m.setler[m.setler.length - 1];
        if (!s || (s.a && s.b)) { s = { a: null, b: null }; m.setler.push(s); }
        s[side] = oklar.slice().sort((a, b) => KM_PF_SIRA[b.puan] - KM_PF_SIRA[a.puan]);
        if (m.b === 'BOT' && !s.b) s.b = kmRtBotOklar(m.botOrt, 3);
        if (s.a && s.b) {
            let ta = kmPfToplam(s.a), tb = kmPfToplam(s.b);
            if (ta > tb) m.puanA += 2; else if (tb > ta) m.puanB += 2; else { m.puanA += 1; m.puanB += 1; }
            if (m.puanA >= 6) m.kazanan = 'a'; else if (m.puanB >= 6) m.kazanan = 'b';
            d.sayac = null;
        }
    }
    kmRtMacBitisKontrol(m);
    kmRtKaydet(); kmResmiTurCiz();
}
function kmRtShootSec(id, side) { let m = kmRtMacBul(id); m.shootEsit = false; m.kazanan = side; if (side === 'a') m.puanA += 1; else m.puanB += 1; kmRtMacBitisKontrol(m); kmRtKaydet(); kmResmiTurCiz(); }
function kmRtMacBitisKontrol(m) {
    if (!m.kazanan) return;
    let d = kmRtYukle(), e = d.eleme;
    d.sayac = null;
    let kaz = kmRtKeyAd(m[m.kazanan]);
    kmPfSes(m.b === 'BOT' ? (m.kazanan === 'a' ? 'basari' : 'basarisiz') : 'basari');
    showToast(`🏆 ${e.turlar[m.tur]}: ${kmPfIlkAd(kaz)} kazandı (${m.puanA}–${m.puanB})`, 'success');
    if (e.tek) {
        if (m.kazanan === 'b') e.maclar.filter(x => x.tur > m.tur).forEach(x => { x.kazanan = 'yok'; });
    } else { kmRtKazananIlerlet(m); kmRtByeIlerlet(); }
}
// ---- karne
function kmRtYerler() {
    let d = kmRtYukle(), e = d.eleme, yer = {};
    if (!e) return yer;
    if (e.tek) {
        let k = e.maclar[0].a, kaybedilen = e.maclar.find(m => m.kazanan === 'b');
        yer[k] = !kaybedilen ? 1 : (kaybedilen.tur === 2 ? 2 : kaybedilen.tur === 1 ? 3 : 5);
        return yer;
    }
    let son = e.turlar.length - 1, fin = e.maclar.find(m => m.tur === son);
    if (fin && fin.kazanan && fin.kazanan !== 'yok') { yer[fin[fin.kazanan]] = 1; let kay = fin.kazanan === 'a' ? fin.b : fin.a; if (kay) yer[kay] = 2; }
    e.maclar.filter(m => m.tur < son && m.kazanan && m.kazanan !== 'yok' && !m.bay).forEach(m => { let kay = m.kazanan === 'a' ? m.b : m.a; if (kay && !yer[kay]) yer[kay] = Math.pow(2, son - m.tur) + 1; });
    return yer;
}
function kmRtBitir() {
    let d = kmRtYukle(), yer = kmRtYerler(), sira = kmRtSiralama();
    d.asama = 'bitti'; d.bitis = Date.now(); d.sayac = null;
    let onceki = kmPfDepoOku('km_pf_resmi');
    let kayit = { id: d.id, t: Date.now(), tarih: bugunISO(), mesafe: d.ayar.mesafe, format: d.ayar.format,
        sporcular: sira.map((s, i) => {
            let pbOnce = Math.max(0, ...onceki.filter(r => r.mesafe === d.ayar.mesafe && r.format === d.ayar.format).map(r => ((r.sporcular.find(x => x.key === s.k) || {}).toplam) || 0));
            return { key: s.k, ad: kmRtKeyAd(s.k), toplam: s.toplam, on: s.on, x: s.x, ok: s.ok, sira: i + 1, yer: yer[s.k] || null, seriler: s.seriler.map(kmPfToplam), pb: s.toplam > pbOnce && pbOnce > 0, pbOnce };
        }),
        eleme: d.eleme ? d.eleme.maclar.filter(m => m.a && m.b && !m.bay).map(m => ({ tur: d.eleme.turlar[m.tur], a: kmRtKeyAd(m.a), b: kmRtKeyAd(m.b), puanA: m.puanA, puanB: m.puanB, setler: m.setler.map(s => [s.a ? kmPfToplam(s.a) : null, s.b ? kmPfToplam(s.b) : null]), shoot: m.shoot ? [m.shoot.a ? m.shoot.a.puan : null, m.shoot.b ? m.shoot.b.puan : null] : null, kazanan: m.kazanan })) : [] };
    kmPfDepoYaz('km_pf_resmi', kayit);
    d.sonKayit = kayit;
    kmRtKaydet(); kmResmiTurCiz();
    kmPfSes('basari');
}
function kmRtKarneHTML() {
    let d = kmRtYukle(), r = d.sonKayit; if (!r) { _kmRt = kmRtYeni(); kmRtKaydet(); return kmRtKurulumHTML(); }
    let f = KM_RT_FORMATLAR[r.format] || KM_RT_FORMATLAR.tam, maks = f.seri * f.ok * 10;
    let kartlar = r.sporcular.slice().sort((a, b) => (a.yer || 99) - (b.yer || 99) || a.sira - b.sira).map(s => {
        let yari = Math.floor(s.seriler.length / 2), y1 = s.seriler.slice(0, yari).reduce((a, b) => a + b, 0), y2 = s.seriler.slice(yari).reduce((a, b) => a + b, 0);
        let enIyi = Math.max(...s.seriler), enKotu = Math.min(...s.seriler);
        // En iyi / en zayıf yalnızca TEK bir seriyse renklenir; yükseklik min–max aralığına göre (farklar görünsün).
        let tekIyi = s.seriler.filter(v => v === enIyi).length === 1 && enIyi !== enKotu, tekKotu = s.seriler.filter(v => v === enKotu).length === 1 && enIyi !== enKotu;
        let alt = enKotu - 2, aralik = Math.max(1, enIyi - alt);
        let cubuk = s.seriler.map((v, i) => `<div title="${i + 1}. seri: ${v}" style="flex:1; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:2px; height:70px;"><div style="width:100%; border-radius:4px 4px 0 0; background:${v === enIyi && tekIyi ? 'var(--status-success)' : v === enKotu && tekKotu ? 'var(--status-danger)' : 'var(--accent)'}; height:${Math.round(10 + (v - alt) / aralik * 48)}px;"></div><small style="font-size:9px; color:var(--text-secondary)">${v}</small></div>`).join('');
        let maclar = r.eleme.filter(m => m.a === s.ad || m.b === s.ad).map(m => { let benA = m.a === s.ad, kazandi = (m.kazanan === 'a') === benA; return `<div class="pf-alt">${kazandi ? '✅' : '❌'} ${m.tur}: ${benA ? m.puanA : m.puanB}–${benA ? m.puanB : m.puanA} · ${esc(benA ? m.b : m.a)} <small>(${m.setler.map(x => benA ? x[0] + '-' + x[1] : x[1] + '-' + x[0]).join(', ')}${m.shoot ? ' · SO ' + (benA ? m.shoot[0] + '-' + m.shoot[1] : m.shoot[1] + '-' + m.shoot[0]) : ''})</small></div>`; }).join('');
        let madalya = s.yer === 1 ? '🥇' : s.yer === 2 ? '🥈' : s.yer === 3 ? '🥉' : '';
        return `<div class="pf-kart">
            <div class="pf-ust"><div><div class="pf-baslik">${madalya} ${esc(s.ad)}</div><div class="pf-alt">Sıralama ${s.sira}.${s.yer ? ` · Final derecesi: <b>${s.yer}.</b>` : ''}${s.pb ? ` · <span class="pf-chip pb">🏆 Kişisel rekor (önceki ${s.pbOnce})</span>` : ''}</div></div>
                <div style="text-align:right"><div class="pf-sayac">${s.toplam}<small style="font-size:14px; color:var(--text-secondary)"> / ${maks}</small></div><div class="pf-alt">10+X: ${s.on} · X: ${s.x} · ok ort. ${(s.toplam / Math.max(1, s.ok)).toFixed(2)}</div></div></div>
            <div style="display:flex; gap:4px; align-items:flex-end;">${cubuk}</div>
            <div class="pf-alt">1. yarı <b>${y1}</b> · 2. yarı <b>${y2}</b> ${y2 < y1 - 4 ? '· ⚠️ ikinci yarıda düşüş (dayanıklılık / odak)' : (y2 > y1 + 4 ? '· 📈 ikinci yarıda yükseliş' : '')} · en iyi seri ${enIyi}, en zayıf ${enKotu}</div>
            ${maclar}
            <div class="pf-btnler"><button class="pf-btn" onclick="kmRtPdf('${encodeURIComponent(s.key)}')">📄 Bu karneyi PDF indir</button></div>
        </div>`;
    }).join('');
    return `<div class="pf"><div class="pf-ust"><div><div class="pf-baslik">📋 Resmi Tur Karnesi</div><div class="pf-alt">${r.tarih} · ${r.mesafe} · ${f.ad} · karneler kulüp arşivine kaydedildi.</div></div>
        <div class="pf-btnler"><button class="pf-btn" onclick="kmRtPdf('')">📄 Hepsini PDF indir</button><button class="pf-btn birincil" onclick="kmRtYeniTur()">🏁 Yeni tur</button></div></div>${kartlar}</div>`;
}
function kmRtYeniTur() { _kmRt = kmRtYeni(); _kmRtGiris = null; kmRtKaydet(); kmResmiTurCiz(); }
function kmRtPdf(keyEnc) {
    let r = kmRtYukle().sonKayit; if (!r) return;
    let key = keyEnc ? decodeURIComponent(keyEnc) : '';
    let liste = r.sporcular.filter(s => !key || s.key === key).sort((a, b) => (a.yer || 99) - (b.yer || 99) || a.sira - b.sira);
    let f = KM_RT_FORMATLAR[r.format] || KM_RT_FORMATLAR.tam, T = _trTranslit;
    showToast('PDF hazırlanıyor...', 'warning');
    _yeniPdfAl().then(pdf => {
        let pageW = 210, pageH = 297, mx = 16, uw = pageW - mx * 2;
        liste.forEach((s, si) => {
            if (si > 0) { pdf.addPage(); pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, pageW, pageH, 'F'); }
            let y = _kurumsalBaslikCiz(pdf, mx, uw, 14, 'RESMI TUR KARNESI', r.mesafe + ' - ' + f.ad + ' - ' + r.tarih);
            pdf.setTextColor(15, 23, 42); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.text(T(s.ad), mx, y + 6);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(71, 85, 105);
            pdf.text(T('Siralama: ' + s.sira + '.' + (s.yer ? '   Final derecesi: ' + s.yer + '.' : '') + (s.pb ? '   KISISEL REKOR' : '')), mx, y + 13);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(26); pdf.setTextColor(15, 23, 42); pdf.text(String(s.toplam), pageW - mx, y + 8, { align: 'right' });
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(71, 85, 105); pdf.text(T('/ ' + (f.seri * f.ok * 10) + '   10+X: ' + s.on + '   X: ' + s.x + '   Ok ort.: ' + (s.toplam / Math.max(1, s.ok)).toFixed(2)), pageW - mx, y + 14, { align: 'right' });
            y += 24;
            pdf.setFillColor(241, 245, 249); pdf.rect(mx, y, uw, 8, 'F'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
            pdf.text(T('Seri'), mx + 3, y + 5.5); pdf.text(T('Seri puani'), mx + 40, y + 5.5); pdf.text(T('Kumulatif'), mx + 80, y + 5.5);
            y += 8; let kum = 0;
            pdf.setFont('helvetica', 'normal');
            s.seriler.forEach((v, i) => { kum += v; pdf.setDrawColor(226, 232, 240); pdf.line(mx, y + 7, mx + uw, y + 7); pdf.text(String(i + 1), mx + 3, y + 5); pdf.text(String(v), mx + 40, y + 5); pdf.text(String(kum), mx + 80, y + 5);
                let bw = Math.max(1, (v / (f.ok * 10)) * 60); pdf.setFillColor(56, 189, 248); pdf.rect(mx + 110, y + 1.5, bw, 4, 'F'); y += 7; });
            y += 6;
            let maclar = r.eleme.filter(m => m.a === s.ad || m.b === s.ad);
            if (maclar.length) {
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.text(T('Eleme maclari'), mx, y); y += 6; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9.5);
                maclar.forEach(m => { let benA = m.a === s.ad, kaz = (m.kazanan === 'a') === benA;
                    pdf.text(T((kaz ? 'Kazandi  ' : 'Kaybetti  ') + m.tur + ':  ' + (benA ? m.puanA : m.puanB) + '-' + (benA ? m.puanB : m.puanA) + '  vs ' + (benA ? m.b : m.a).replace(/[^\w\sçğıöşüÇĞİÖŞÜ.-]/g, '').trim() + '   (setler: ' + m.setler.map(x => benA ? x[0] + '-' + x[1] : x[1] + '-' + x[0]).join(', ') + (m.shoot ? '  SO ' + (benA ? m.shoot[0] + '-' + m.shoot[1] : m.shoot[1] + '-' + m.shoot[0]) : '') + ')'), mx, y); y += 6; });
            }
        });
        _kurumsalAltBilgiCiz(pdf, pageW, pageH);
        pdf.save('Resmi_Tur_' + r.tarih + (key && liste[0] ? '_' + T(liste[0].ad).replace(/\s+/g, '_') : '') + '.pdf');
    }).catch(() => showToast('PDF oluşturulamadı.', 'error'));
}

// ================================================================================================
// 🏹 OK ANALİZİ — okları numarasıyla ve hedefteki yeriyle kaydet; birkaç antrenman sonra hangi okun
// gruptan kaçtığını ve grup merkezinin günden güne nereye kaydığını gösterir. Veri: sporcunun detaylı
// okları (bugünkü kart + kart geçmişi) — bireysel skor ekranı, Oyunlar hedef girişi ve Resmi Tur'dan
// gelen konumlu oklar da dahil. Ok numarası yalnızca bu araçla (ve bireysel ekrandaki seçiciyle) gelir.
// ================================================================================================
let _kmOa = { sec: null, okSeti: 6, ok: 6, mesafe: '18m', filtre: 'hepsi', giris: false };
try { Object.assign(_kmOa, JSON.parse(localStorage.getItem('dag_km_okanaliz_ayar') || '{}'), { giris: false }); } catch (e) {}
function kmOaAyarKaydet() { try { localStorage.setItem('dag_km_okanaliz_ayar', JSON.stringify({ okSeti: _kmOa.okSeti, ok: _kmOa.ok, mesafe: _kmOa.mesafe })); } catch (e) {} }
function kmOaOklar(sp) {
    let out = [];
    (sp.kartGecmisi || []).forEach(k => (k.detayliOklar || []).forEach(o => out.push(Object.assign({ _tarih: o.tarih || k.tarih || '' }, o))));
    (sp.detayliOklar || []).forEach(o => out.push(Object.assign({ _tarih: o.tarih || bugunISO() }, o)));
    return out.filter(o => o && o.x != null && o.y != null && typeof o.x === 'number');
}
function kmOaMerkez(liste) { let n = liste.length || 1; return { x: liste.reduce((a, o) => a + o.x, 0) / n, y: liste.reduce((a, o) => a + o.y, 0) / n }; }
function kmOaYayilim(liste, m) { return liste.reduce((a, o) => a + Math.hypot(o.x - m.x, o.y - m.y), 0) / (liste.length || 1); }
function kmOaYonMetni(dx, dy) {
    let p = [];
    if (Math.abs(dy) >= 3.5) p.push(dy < 0 ? 'yukarısında' : 'aşağısında');
    if (Math.abs(dx) >= 3.5) p.push(dx < 0 ? 'solunda' : 'sağında');
    return p.join(' ve ') || 'merkezinde';
}
function kmOaYonKisa(dx, dy) { let p = []; if (Math.abs(dy) >= 3.5) p.push(dy < 0 ? 'yukarı' : 'aşağı'); if (Math.abs(dx) >= 3.5) p.push(dx < 0 ? 'sol' : 'sağ'); return p.join('-') || '—'; }
function kmOaYonYone(dx, dy) { let p = []; if (Math.abs(dy) >= 3.5) p.push(dy < 0 ? 'yukarı' : 'aşağı'); if (Math.abs(dx) >= 3.5) p.push(dx < 0 ? 'sola' : 'sağa'); return p.join(' ve ') || 'yerinde'; }
function kmOkAnaliziCiz() {
    kmPfCssYukle();
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    let roster = kmPfRoster();
    if (!_kmOa.sec || !roster.some(k => kmPfKey(k) === _kmOa.sec)) _kmOa.sec = roster[0] ? kmPfKey(roster[0]) : null;
    let k = _kmOa.sec ? kmRtKeyObj(_kmOa.sec) : null, sp = k && turnuvaDB[k.g] ? turnuvaDB[k.g][k.ad] : null;
    let secim = (ad, deger, fn, aktif) => `<button class="${aktif ? 'aktif' : ''}" onclick="${fn}(${JSON.stringify(deger).replace(/"/g, '&quot;')})">${ad}</button>`;
    let ust = `<div class="pf-ust"><div><div class="pf-baslik">🏹 Ok Analizi</div><div class="pf-alt">Okları numarasıyla ve hedefte düştüğü yerle kaydet. Birkaç antrenman sonra hangi okun gruptan kaçtığı ve grubun nereye kaydığı burada çıkar.</div></div></div>
        <div class="pf-kart"><div class="pf-etiket">Sporcu</div><div class="pf-secim">${roster.map(r => secim(esc(kmPfIlkAd(r.ad)), kmPfKey(r), 'kmOaSporcu', kmPfKey(r) === _kmOa.sec)).join('') || '<span class="pf-alt">Karışık Sınıf listesi boş.</span>'}</div>
            <div class="pf-etiket">Ok seti · seri başına ok · mesafe</div>
            <div class="pf-secim">${[6, 8, 10, 12].map(n => secim(n + ' ok', n, 'kmOaSet', _kmOa.okSeti === n)).join('')}<span style="width:10px"></span>${[3, 6].map(n => secim(n + '/seri', n, 'kmOaOk', _kmOa.ok === n)).join('')}<span style="width:10px"></span>${['18m', '30m', '50m', '70m'].map(m => secim(m, m, 'kmOaMesafe', _kmOa.mesafe === m)).join('')}</div>
            ${sp ? `<div class="pf-btnler"><button class="pf-btn birincil" onclick="kmOaGirisAc()">➕ Numaralı seri kaydet</button></div>` : ''}</div>
        <div id="pf-oa-giris"></div>`;
    if (!sp) { ic.innerHTML = `<div class="pf">${ust}</div>`; return; }
    let tum = kmOaOklar(sp), mesafeler = Array.from(new Set(tum.map(o => o.mesafe).filter(Boolean)));
    if (_kmOa.filtre !== 'hepsi' && mesafeler.indexOf(_kmOa.filtre) === -1) _kmOa.filtre = 'hepsi';
    let oklar = _kmOa.filtre === 'hepsi' ? tum : tum.filter(o => o.mesafe === _kmOa.filtre);
    let filtre = mesafeler.length ? `<div class="pf-secim">${secim('Tüm mesafeler', 'hepsi', 'kmOaFiltre', _kmOa.filtre === 'hepsi')}${mesafeler.map(m => secim(m, m, 'kmOaFiltre', _kmOa.filtre === m)).join('')}</div>` : '';
    ic.innerHTML = `<div class="pf">${ust}${filtre}${kmOaNumaraHTML(oklar)}${kmOaKaymaHTML(oklar)}</div>`;
    if (_kmOa.giris) kmOaGirisAc();
}
const KM_OA_RENK = ['#0ea5e9', '#f97316', '#22c55e', '#a855f7', '#ef4444', '#eab308', '#14b8a6', '#ec4899', '#6366f1', '#84cc16', '#f43f5e', '#06b6d4'];
function kmOaNumaraHTML(oklar) {
    let numarali = oklar.filter(o => o.okNo);
    if (numarali.length < 6) return `<div class="pf-kart"><div class="pf-etiket">Ok numarasına göre</div><div class="pf-alt">Henüz yeterli numaralı ok yok (${numarali.length}). Birkaç seri "Numaralı seri kaydet" ile girildiğinde her okun kendi grubu burada çıkar. Güvenilir bir sonuç için ok başına en az 5 atış gerekir.</div></div>`;
    let C = kmOaMerkez(numarali), genelYay = kmOaYayilim(numarali, C);
    let gruplar = {}; numarali.forEach(o => { (gruplar[o.okNo] = gruplar[o.okNo] || []).push(o); });
    let satirlar = Object.keys(gruplar).map(Number).sort((a, b) => a - b).map(no => {
        let l = gruplar[no], m = kmOaMerkez(l);
        return { no, n: l.length, m, dx: m.x - C.x, dy: m.y - C.y, kay: Math.hypot(m.x - C.x, m.y - C.y), yay: kmOaYayilim(l, m), ort: kmPfToplam(l) / l.length };
    });
    let bulgular = [];
    satirlar.filter(s => s.n >= 5).forEach(s => {
        let kacik = s.kay >= 7 && s.kay >= genelYay * 0.5, dagink = s.yay > genelYay * 1.4 && s.yay - genelYay >= 4;
        if (!kacik && !dagink) return;
        let neden = kacik ? (Math.abs(s.dx) >= Math.abs(s.dy)
            ? 'Yana kaçma genelde tüy hasarı/yapışması, nock\'un ipe oturuşu ya da gövde eğriliğinden olur — nock\'u çevirip tekrar dene, tüyleri kontrol et.'
            : 'Yukarı/aşağı kaçma genelde uç ya da nock ağırlığı farkından olur — okları tartıp diğerleriyle karşılaştır, nock\'u değiştir.')
            : 'Bu ok diğerlerinden belirgin dağınık — gövde düzlüğünü (eğrilik) ve ucun sıkılığını kontrol et.';
        bulgular.push(`<div class="pf-bulgu uyari"><span class="ik">⚠️</span><div><b>Ok #${s.no}</b> ${kacik ? `grubun <b>${(s.kay / 10).toFixed(1)} halka ${kmOaYonMetni(s.dx, s.dy)}</b>` : 'olağandan dağınık'} (${s.n} atış, ort. ${s.ort.toFixed(1)}).<br><small>${neden}</small></div></div>`);
    });
    let enIyi = satirlar.filter(s => s.n >= 5).sort((a, b) => b.ort - a.ort)[0];
    if (!bulgular.length) bulgular.push(`<div class="pf-bulgu"><span class="ik">✅</span><div>Numaralı okların hepsi aynı grupta — belirgin kaçan ok yok.${satirlar.some(s => s.n < 5) ? '<br><small>Bazı oklarda henüz 5 atış yok; kesin sonuç için biraz daha veri gerekiyor.</small>' : ''}</div></div>`);
    let merkezler = satirlar.map(s => ({ x: Math.round(s.m.x * 10) / 10, y: Math.round(s.m.y * 10) / 10, etiket: s.no, renk: KM_OA_RENK[(s.no - 1) % KM_OA_RENK.length] }));
    let noktalar = numarali.map(o => ({ x: o.x, y: o.y, renk: KM_OA_RENK[(o.okNo - 1) % KM_OA_RENK.length] }));
    let tablo = satirlar.map(s => `<tr><td><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background:${KM_OA_RENK[(s.no - 1) % KM_OA_RENK.length]}; margin-right:6px;"></span><b>#${s.no}</b></td><td class="sag">${s.n}</td><td class="sag">${s.ort.toFixed(2)}</td><td class="sag">${(s.kay / 10).toFixed(1)}</td><td>${s.kay >= 3.5 ? kmOaYonKisa(s.dx, s.dy) : '—'}</td><td class="sag">${(s.yay / 10).toFixed(1)}</td></tr>`).join('');
    return `<div class="pf-kart"><div class="pf-etiket">Ok numarasına göre · ${numarali.length} numaralı ok</div>
        <div class="pf-giris"><div>${kmPfHedefSVG('pf-oa-hedef', noktalar, { kucuk: true, merkezler, genelMerkez: { x: Math.round(C.x * 10) / 10, y: Math.round(C.y * 10) / 10 } })}<div class="pf-alt" style="text-align:center">Büyük daire = o okun grup merkezi · artı = tüm okların merkezi</div></div>
        <div style="display:flex; flex-direction:column; gap:8px;">${bulgular.join('')}${enIyi ? `<div class="pf-alt">⭐ En yüksek ortalama: Ok #${enIyi.no} (${enIyi.ort.toFixed(2)}) — yarışmada ilk tercih.</div>` : ''}
            <div class="pf-kaydir"><table class="pf-tablo"><thead><tr><th>Ok</th><th class="sag">Atış</th><th class="sag">Ort.</th><th class="sag">Kayma (halka)</th><th>Yön</th><th class="sag">Dağılım</th></tr></thead><tbody>${tablo}</tbody></table></div></div></div></div>`;
}
function kmOaKaymaHTML(oklar) {
    let gunler = {}; oklar.forEach(o => { if (o._tarih) (gunler[o._tarih] = gunler[o._tarih] || []).push(o); });
    let seans = Object.keys(gunler).sort().filter(t => gunler[t].length >= 6).map(t => ({ t, m: kmOaMerkez(gunler[t]), n: gunler[t].length, yay: kmOaYayilim(gunler[t], kmOaMerkez(gunler[t])) })).slice(-8);
    if (seans.length < 2) return `<div class="pf-kart"><div class="pf-etiket">Grup merkezi kayması</div><div class="pf-alt">En az 2 antrenman gününde 6+ konumlu ok gerekiyor (şu an ${seans.length}). Hedefe dokunarak girilen her ok buraya sayılır.</div></div>`;
    let son = seans[seans.length - 1], onceki = seans.slice(0, -1), oM = kmOaMerkez(onceki.map(s => s.m));
    let dx = son.m.x - oM.x, dy = son.m.y - oM.y, kay = Math.hypot(dx, dy), mutlak = Math.hypot(son.m.x, son.m.y);
    let bulgu = [];
    if (kay >= 5) bulgu.push(`<div class="pf-bulgu uyari"><span class="ik">↗️</span><div>Son antrenmanda (${son.t}) grup merkezi öncekilere göre <b>${(kay / 10).toFixed(1)} halka ${kmOaYonYone(dx, dy)}</b> kaydı.<br><small>Tek günse form/rüzgâr olabilir; 2–3 antrenman üst üste aynı yöndeyse ekipman ya da teknik değişimi araştır.</small></div></div>`);
    if (mutlak >= 10) bulgu.push(`<div class="pf-bulgu"><span class="ik">🎯</span><div>Son antrenmanda grup merkezden <b>${(mutlak / 10).toFixed(1)} halka ${kmOaYonMetni(son.m.x, son.m.y)}</b>. Grup tutarlıysa nişangahı <b>okların gittiği yöne</b> ${son.m.x < -3.5 ? 'sola' : son.m.x > 3.5 ? 'sağa' : ''}${Math.abs(son.m.x) > 3.5 && Math.abs(son.m.y) > 3.5 ? ' ve ' : ''}${son.m.y < -3.5 ? 'yukarı' : son.m.y > 3.5 ? 'aşağı' : ''} al.</div></div>`);
    if (!bulgu.length) bulgu.push(`<div class="pf-bulgu"><span class="ik">✅</span><div>Grup merkezi son ${seans.length} antrenmanda sabit — nişangah ayarı yerinde.</div></div>`);
    let yayTrend = seans.map(s => `<span class="pf-chip" title="${s.t}: ${s.n} ok">${s.t.slice(5)} · ${(s.yay / 10).toFixed(1)}</span>`).join(' ');
    return `<div class="pf-kart"><div class="pf-etiket">Grup merkezi kayması · son ${seans.length} antrenman${_kmOa.filtre !== 'hepsi' ? ' · ' + _kmOa.filtre : ''}</div>
        <div class="pf-giris"><div>${kmPfHedefSVG('pf-oa-kayma', [], { iz: seans.map(s => ({ x: Math.round(s.m.x * 10) / 10, y: Math.round(s.m.y * 10) / 10 })) })}<div class="pf-alt" style="text-align:center">Kesik çizgi günden güne grup merkezinin yolu · koyu nokta en son antrenman</div></div>
        <div style="display:flex; flex-direction:column; gap:8px;">${bulgu.join('')}<div class="pf-etiket">Grup dağılımı (halka, küçük = sıkı)</div><div>${yayTrend}</div></div></div></div>`;
}
function kmOaSporcu(k) { _kmOa.sec = k; _kmOa.giris = false; kmOkAnaliziCiz(); }
function kmOaSet(n) { _kmOa.okSeti = n; kmOaAyarKaydet(); kmOkAnaliziCiz(); }
function kmOaOk(n) { _kmOa.ok = n; kmOaAyarKaydet(); kmOkAnaliziCiz(); }
function kmOaMesafe(m) { _kmOa.mesafe = m; kmOaAyarKaydet(); kmOkAnaliziCiz(); }
function kmOaFiltre(m) { _kmOa.filtre = m; kmOkAnaliziCiz(); }
function kmOaGirisAc() {
    let k = kmRtKeyObj(_kmOa.sec); _kmOa.giris = true;
    kmPfGirisAc('pf-oa-giris', { ok: _kmOa.ok, okNo: true, okSeti: _kmOa.okSeti, baslik: `${esc(kmPfIlkAd(k.ad))} — numaralı seri (${_kmOa.mesafe})`,
        onKaydet: oklar => { _kmOa.giris = false; kmPfSeriKaydet(k, oklar, { mesafe: _kmOa.mesafe, kaynak: 'okanaliz' }, ok => { if (ok) showToast('🏹 Seri kaydedildi (' + kmPfToplam(oklar) + ').', 'success'); kmOkAnaliziCiz(); }); },
        onIptal: () => { _kmOa.giris = false; kmOkAnaliziCiz(); } });
    let el = document.getElementById('pf-oa-giris'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ================================================================================================
// 🧠 BASKI GÖREVLERİ — ölçülebilir mental hazırlık. Her görev bir kural; sonuç sporcunun geçmişine yazılır,
// başarı oranı zamanla izlenir (kulüp geneli: /api/meta/km_pf_baski). Oklar varsayılan olarak karneye
// işlenmez (kısa tatbikatlar seri ortalamalarını bozmasın) — istenirse açılır.
// ================================================================================================
const KM_BASKI_GOREVLER = [
    { id: 'sonok9', ikon: '🎯', ad: 'Son Ok 9+', ok: 6, acik: '6 ok at; 6. ok 9 ya da üstü olmalı. Serinin sonunda baskı altında kalite.', kontrol: o => kmPfDeger(o[5].puan) >= 9, detay: o => '6. ok: ' + o[5].puan },
    { id: 'temiz6', ikon: '🧼', ad: 'Temiz Seri', ok: 6, acik: '6 okun hiçbiri 8\'in altına düşmeyecek. Tek hata = görev kaçar.', kontrol: o => o.every(x => kmPfDeger(x.puan) >= 8), detay: o => 'En düşük: ' + o.map(x => x.puan).sort((a, b) => KM_PF_SIRA[a] - KM_PF_SIRA[b])[0] },
    { id: 'seri27', ikon: '🔥', ad: '3 Seri 27+', ok: 9, parca: 3, acik: '3 okluk 3 seri üst üste; her seri 27 ya da üstü olmalı.', kontrol: o => [0, 3, 6].every(i => kmPfToplam(o.slice(i, i + 3)) >= 27), detay: o => [0, 3, 6].map(i => kmPfToplam(o.slice(i, i + 3))).join(' · ') },
    { id: 'shoot10', ikon: '⚡', ad: 'Shoot-off 10', ok: 1, sure: 40, acik: 'Tek ok, 40 saniye içinde. 10 ya da X olmalı — yarışmanın en sıkışık anı.', kontrol: o => kmPfDeger(o[0].puan) >= 10, detay: o => o[0].puan },
    { id: 'kurtaris', ikon: '🛟', ad: 'Kurtarış', ok: 3, acik: 'İlk ok ne olursa olsun, sonraki 2 ok toplam 19+ olmalı. Kötü oku unutup devam etme becerisi.', kontrol: o => kmPfDeger(o[1].puan) + kmPfDeger(o[2].puan) >= 19, detay: o => o[1].puan + ' + ' + o[2].puan },
    { id: 'saat30', ikon: '⏱', ad: '30 Saniyede 26+', ok: 3, sure: 30, acik: '3 ok 30 saniyede; toplam 26 ya da üstü. Süre dolarsa görev kaçar.', kontrol: o => kmPfToplam(o) >= 26, detay: o => 'Toplam ' + kmPfToplam(o) },
    { id: 'cift10', ikon: '✌️', ad: 'Çift Onluk', ok: 3, acik: '3 okta en az iki tane 10 ya da X.', kontrol: o => o.filter(x => kmPfDeger(x.puan) >= 10).length >= 2, detay: o => o.map(x => x.puan).join(' ') },
    { id: 'xduello', ikon: '🤺', ad: 'X Düellosu', ok: 1, cok: true, acik: '2+ sporcu tek ok atar, merkeze en yakın kazanır. Hedefe dokunarak girilir.', kontrol: null }
];
let _kmBk = { gorev: 'sonok9', secili: [], sira: [], sonuc: null, kayit: false, sureBitis: null, sureAsildi: false, duello: [] };
let _kmBkTimer = null;
function kmBaskiCiz() {
    kmPfCssYukle();
    let ic = document.getElementById('km-icerik'); if (!ic) return;
    kmPfDepoCek('km_pf_baski', () => { let el = document.getElementById('pf-bk-istatistik'); if (el) el.innerHTML = kmBkIstatistikHTML(kmPfRoster()); });
    let roster = kmPfRoster(), g = KM_BASKI_GOREVLER.find(x => x.id === _kmBk.gorev);
    _kmBk.secili = _kmBk.secili.filter(k => roster.some(r => kmPfKey(r) === k));
    let gorevler = KM_BASKI_GOREVLER.map(x => `<button class="pf-gorev${x.id === _kmBk.gorev ? ' aktif' : ''}" onclick="kmBkGorev('${x.id}')"><b>${x.ikon} ${x.ad}</b><small>${x.acik}</small></button>`).join('');
    let sporcu = roster.map((r, i) => `<button class="${_kmBk.secili.indexOf(kmPfKey(r)) !== -1 ? 'aktif' : ''}" onclick="kmBkSporcu(${i})">${esc(kmPfIlkAd(r.ad))}</button>`).join('');
    let sonuc = '';
    if (_kmBk.sonuc) {
        let s = _kmBk.sonuc;
        sonuc = s.duello ? `<div class="pf-sonuc evet">🤺 ${esc(kmPfIlkAd(s.kazanan))} kazandı<small>${s.detay}</small></div>`
            : `<div class="pf-sonuc ${s.basari ? 'evet' : 'hayir'}">${s.basari ? '✅ BAŞARDI' : '❌ KAÇTI'} — ${esc(kmPfIlkAd(s.ad))}<small>${s.detay}${s.seri > 1 ? ` · 🔥 üst üste ${s.seri}. başarı` : ''}</small></div>`;
    }
    let bekleyen = _kmBk.sira.length ? kmRtKeyAd(_kmBk.sira[0]) : null;
    ic.innerHTML = `<div class="pf">
        <div class="pf-ust"><div><div class="pf-baslik">🧠 Baskı Görevleri</div><div class="pf-alt">Mental hazırlığın ölçülebilir hali: her görev bir başarı/başarısızlık kaydı bırakır, oran zamanla izlenir.</div></div></div>
        <div class="pf-gorevler">${gorevler}</div>
        <div class="pf-kart"><div class="pf-etiket">Katılanlar ${g.cok ? '(en az 2)' : '— sırayla denerler'}</div><div class="pf-secim">${sporcu || '<span class="pf-alt">Karışık Sınıf listesi boş.</span>'}</div>
            <label class="pf-alt" style="display:flex; gap:8px; align-items:center;"><input type="checkbox" ${_kmBk.kayit ? 'checked' : ''} onchange="_kmBk.kayit = this.checked" style="width:18px; height:18px; appearance:auto !important; -webkit-appearance:checkbox !important;"> Okları karneye de işle</label>
            <div class="pf-btnler"><button class="pf-btn birincil" ${_kmBk.secili.length >= (g.cok ? 2 : 1) ? '' : 'disabled'} onclick="kmBkBaslat()">▶ ${g.ikon} ${g.ad} — başlat</button>${_kmBk.sira.length ? `<span class="pf-alt">Sırada: <b>${esc(kmPfIlkAd(bekleyen))}</b> (${_kmBk.sira.length} kişi kaldı)</span>` : ''}</div>
            ${g.sure && _kmBk.sira.length ? `<div style="display:flex; gap:10px; align-items:center;"><span id="pf-bk-sayac" class="pf-sayac">${kmPfSaat(g.sure)}</span>${_kmBk.sureBitis ? '' : `<button class="pf-btn birincil" onclick="kmBkSureBaslat()">▶ Süreyi başlat</button>`}</div>` : ''}
        </div>
        ${sonuc}<div id="pf-bk-giris"></div>
        <div id="pf-bk-istatistik">${kmBkIstatistikHTML(roster)}</div></div>`;
    if (_kmBk.sira.length) kmBkGirisAc();
    kmBkSayacTik();
}
function kmBkGorev(id) { _kmBk.gorev = id; _kmBk.sira = []; _kmBk.sonuc = null; _kmBk.sureBitis = null; kmBaskiCiz(); }
function kmBkSporcu(i) { let k = kmPfKey(kmPfRoster()[i]), j = _kmBk.secili.indexOf(k); if (j === -1) _kmBk.secili.push(k); else _kmBk.secili.splice(j, 1); kmBaskiCiz(); }
function kmBkBaslat() {
    let g = KM_BASKI_GOREVLER.find(x => x.id === _kmBk.gorev);
    _kmBk.sonuc = null; _kmBk.sureBitis = null; _kmBk.sureAsildi = false; _kmBk.duello = [];
    _kmBk.sira = _kmBk.secili.slice();
    kmBaskiCiz();
    let el = document.getElementById('pf-bk-giris'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function kmBkGirisAc() {
    let g = KM_BASKI_GOREVLER.find(x => x.id === _kmBk.gorev), k = _kmBk.sira[0]; if (!k) return;
    kmPfGirisAc('pf-bk-giris', { ok: g.ok, baslik: `${g.ikon} ${esc(kmPfIlkAd(kmRtKeyAd(k)))} — ${g.ad}${g.cok ? ' (hedefe dokun)' : ''}`, tamamYazi: '✓ Sonucu gör',
        onKaydet: oklar => kmBkSonuc(k, oklar), onIptal: () => { _kmBk.sira = []; _kmBk.sureBitis = null; kmBaskiCiz(); } });
    if (g.cok && _pfG) { _pfG.mod = 'hedef'; kmPfGirisCiz(); }
}
function kmBkSureBaslat() { let g = KM_BASKI_GOREVLER.find(x => x.id === _kmBk.gorev); _kmBk.sureBitis = Date.now() + g.sure * 1000; _kmBk.sureAsildi = false; kmPfSes('bip'); let b = document.querySelector('#km-icerik .pf-kart button.pf-btn.birincil[onclick="kmBkSureBaslat()"]'); if (b) b.remove(); kmBkSayacTik(); }
function kmBkSayacTik() {
    clearInterval(_kmBkTimer); _kmBkTimer = null;
    if (!_kmBk.sureBitis) return;
    _kmBkTimer = setInterval(() => {
        let el = document.getElementById('pf-bk-sayac'); if (!el) { clearInterval(_kmBkTimer); _kmBkTimer = null; return; }
        let kalan = (_kmBk.sureBitis - Date.now()) / 1000;
        el.textContent = kmPfSaat(kalan); el.className = 'pf-sayac' + (kalan <= 0 ? ' bitti' : kalan <= 10 ? ' uyari' : '');
        if (kalan <= 0 && !_kmBk.sureAsildi) { _kmBk.sureAsildi = true; kmPfSes('bitti'); }
    }, 200);
}
function kmBkBasariSerisi(key, gorev) {
    let l = kmPfDepoOku('km_pf_baski').filter(r => r.key === key && r.gorev === gorev).sort((a, b) => b.t - a.t), n = 0;
    for (let r of l) { if (r.basari) n++; else break; }
    return n;
}
function kmBkSonuc(k, oklar) {
    let g = KM_BASKI_GOREVLER.find(x => x.id === _kmBk.gorev);
    if (_kmBk.kayit) kmPfSeriKaydet(kmRtKeyObj(k), oklar, { kaynak: 'baski' });
    _kmBk.sira.shift();
    if (g.cok) {
        _kmBk.duello.push({ k, ok: oklar[0] });
        if (_kmBk.sira.length) { _kmBk.sonuc = null; kmBaskiCiz(); return; }
        let sirali = _kmBk.duello.slice().sort((a, b) => (a.ok.x == null ? 999 : Math.hypot(a.ok.x, a.ok.y)) - (b.ok.x == null ? 999 : Math.hypot(b.ok.x, b.ok.y)));
        let t = Date.now();
        sirali.forEach((d, i) => kmPfDepoYaz('km_pf_baski', { id: 'bk_' + t.toString(36) + '_' + i + Math.random().toString(36).slice(2, 5), t: t + i, tarih: bugunISO(), key: d.k, ad: kmRtKeyAd(d.k), gorev: g.id, basari: i === 0, oklar: [d.ok.puan] }));
        _kmBk.sonuc = { duello: true, kazanan: kmRtKeyAd(sirali[0].k), detay: sirali.map((d, i) => `${i + 1}. ${esc(kmPfIlkAd(kmRtKeyAd(d.k)))} (${d.ok.puan}${d.ok.x != null ? ', merkeze ' + (Math.hypot(d.ok.x, d.ok.y) / 10).toFixed(2) + ' halka' : ''})`).join(' · ') };
        kmPfSes('basari');
    } else {
        let basari = !!g.kontrol(oklar) && !(g.sure && _kmBk.sureAsildi);
        kmPfDepoYaz('km_pf_baski', { id: 'bk_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), t: Date.now(), tarih: bugunISO(), key: k, ad: kmRtKeyAd(k), gorev: g.id, basari, oklar: oklar.map(o => o.puan) });
        _kmBk.sonuc = { ad: kmRtKeyAd(k), basari, detay: g.detay(oklar) + (g.sure && _kmBk.sureAsildi ? ' · süre aşıldı' : ''), seri: basari ? kmBkBasariSerisi(k, g.id) : 0 };
        kmPfSes(basari ? 'basari' : 'basarisiz');
    }
    _kmBk.sureBitis = null; _kmBk.sureAsildi = false;
    kmBaskiCiz();
}
function kmBkIstatistikHTML(roster) {
    let kayitlar = kmPfDepoOku('km_pf_baski'), sinir = Date.now() - 30 * 24 * 3600 * 1000;
    let keyler = roster.map(kmPfKey).filter(k => kayitlar.some(r => r.key === k));
    if (!keyler.length) return `<div class="pf-kart"><div class="pf-etiket">Başarı oranları</div><div class="pf-alt">Henüz kayıt yok. Görevler denendikçe her sporcunun başarı oranı burada birikir.</div></div>`;
    let renk = o => o === null ? 'transparent' : `color-mix(in srgb, ${o >= 0.6 ? 'var(--status-success)' : o >= 0.35 ? 'var(--status-warning)' : 'var(--status-danger)'} ${Math.round(18 + o * 30)}%, transparent)`;
    let satirlar = keyler.map(k => {
        let benim = kayitlar.filter(r => r.key === k), son = benim.filter(r => r.t >= sinir);
        let hucreler = KM_BASKI_GOREVLER.map(g => {
            let l = son.filter(r => r.gorev === g.id); if (!l.length) return `<td class="hucre" style="color:var(--text-secondary)">—</td>`;
            let o = l.filter(r => r.basari).length / l.length;
            return `<td class="hucre" style="background:${renk(o)}" title="${l.filter(r => r.basari).length}/${l.length} (son 30 gün)">%${Math.round(o * 100)}<small style="display:block; font-size:9px; font-weight:600; color:var(--text-secondary)">${l.length} deneme</small></td>`;
        }).join('');
        let yari = Math.floor(benim.length / 2), ilk = benim.slice(0, yari), ikinci = benim.slice(yari);
        let oran = l => l.length ? l.filter(r => r.basari).length / l.length : null, o1 = oran(ilk), o2 = oran(ikinci);
        let trend = benim.length >= 8 && o1 !== null && o2 !== null ? (o2 - o1 >= 0.1 ? ' 📈' : o1 - o2 >= 0.1 ? ' 📉' : '') : '';
        let genel = oran(son);
        return `<tr><td><b>${esc(kmPfIlkAd(kmRtKeyAd(k)))}</b>${trend}</td><td class="hucre" style="background:${renk(genel)}">${genel === null ? '—' : '%' + Math.round(genel * 100)}</td>${hucreler}</tr>`;
    }).join('');
    return `<div class="pf-kart pf-kaydir"><div class="pf-etiket">Başarı oranları · son 30 gün (📈/📉 = tüm kayıtların ilk ve ikinci yarısına göre eğilim)</div>
        <table class="pf-tablo pf-isi"><thead><tr><th>Sporcu</th><th>Genel</th>${KM_BASKI_GOREVLER.map(g => `<th title="${g.ad}" style="text-align:center">${g.ikon}</th>`).join('')}</tr></thead><tbody>${satirlar}</tbody></table>
        <div class="pf-alt">${KM_BASKI_GOREVLER.map(g => g.ikon + ' ' + g.ad).join(' · ')}</div></div>`;
}
