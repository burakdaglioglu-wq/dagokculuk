/* ================================================================================================
   📊 İSTATİSTİKLERİM (2026-10-26). Kullanıcı: "kendi skorlarını, istatistiklerini görmesini istiyorum, kendi sayfasına
   girdiğinde". İki taslaktan A · Sayı panosu. Sporcunun ana ekranında küçük kart (#ist-ana), Gelişim sekmesinin en üstünde
   tam pano (#ist-gelisim): dönem (7 gün / 30 gün / sezon) → 6 kutucuk (önceki aynı uzunluktaki döneme göre ▲▼), antrenman
   antrenman ok ortalaması çizgisi, puan dağılımı, rekorlar, son antrenmanlar, yarışmalar (yrsKarneVeri varsa).
   - Farklı mesafe / hedef yüzü karışmasın diye her şey OK BAŞI ortalama (eski Gelişim Grafiği toplam puan çiziyordu →
     27 ile 7064 aynı grafikte). Seri ortalaması = ok ort. × o dönemin tipik seri ok sayısı değil, gerçek seri puanları.
   - Kaynak: sp.seriler (açık kart) + sp.kartGecmisi[].seriler, iptal edilenler hariç; antrenman = aynı tarihli seriler.
   ================================================================================================ */
const IST = { donem: 30 };
const IST_DEGER = { X: 10, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1, M: 0 };
const IST_DAG = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
const IST_DAG_RENK = { X: '#fbbf24', '10': '#fbbf24', '9': '#f59e0b', '8': '#ef4444', '7': '#ef4444', '6': '#60a5fa', '5': '#60a5fa', '4': '#9ca3af', '3': '#9ca3af', '2': '#e5e7eb', '1': '#e5e7eb', M: '#6b7280' };

function istGunEkle(iso, n) { let p = iso.split('-').map(Number), d = new Date(p[0], p[1] - 1, p[2] + n); return bugunISO(d); }
function istTarihKisa(iso) { let p = iso.split('-'); return +p[2] + ' ' + ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][+p[1] - 1]; }
function istSayi(v, h) { return v == null || isNaN(v) ? '—' : (+v).toFixed(h == null ? 1 : h).replace('.', ','); }

// tüm geçerli seriler → [{ tarih, oklar, puan, mesafe, t }]
function istSeriler(sp) {
    let l = [];
    [].concat(sp.seriler || [], ...(sp.kartGecmisi || []).map(k => (k.seriler || []).map(s => Object.assign({ _kt: k.tarih }, s)))).forEach(s => {
        if (!s || s.iptal || !Array.isArray(s.oklar) || !s.oklar.length) return;
        let tarih = String(s.tarih || s._kt || '').slice(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(tarih)) return;
        let oklar = s.oklar.map(String).filter(o => IST_DEGER[o] !== undefined); if (!oklar.length) return;
        l.push({ tarih, oklar, puan: oklar.reduce((a, o) => a + IST_DEGER[o], 0), mesafe: s.mesafe || null, t: s.t || 0 });
    });
    return l.sort((a, b) => a.tarih.localeCompare(b.tarih) || a.t - b.t);
}
function istOzet(l) {
    let ok = 0, top = 0, enIyi = null, m = 0, on = 0, dag = {}, gun = {};
    IST_DAG.forEach(k => dag[k] = 0);
    l.forEach(s => { ok += s.oklar.length; top += s.puan; if (!enIyi || s.puan > enIyi.puan) enIyi = s; s.oklar.forEach(o => { dag[o]++; if (o === 'M') m++; if (o === 'X' || o === '10') on++; }); gun[s.tarih] = 1; });
    return { seri: l.length, ok, okOrt: ok ? top / ok : null, seriOrt: l.length ? top / l.length : null, enIyi, karavana: ok ? m / ok * 100 : null, on, dag, antrenman: Object.keys(gun).length };
}
// antrenmanlar (gün gün): ok ort, ok sayısı, mesafe
function istAntrenmanlar(l) {
    let g = {};
    l.forEach(s => { let x = g[s.tarih] = g[s.tarih] || { tarih: s.tarih, ok: 0, top: 0, seri: 0, mesafe: {} }; x.ok += s.oklar.length; x.top += s.puan; x.seri++; if (s.mesafe) x.mesafe[s.mesafe] = 1; });
    return Object.values(g).sort((a, b) => a.tarih.localeCompare(b.tarih)).map(x => Object.assign(x, { ort: x.top / x.ok, mesafe: Object.keys(x.mesafe).join(', ') }));
}
function istVeri(sp, donem) {
    let tum = istSeriler(sp), bugun = bugunISO();
    let bas = donem ? istGunEkle(bugun, -donem + 1) : null, onceBas = donem ? istGunEkle(bugun, -2 * donem + 1) : null;
    let simdi = donem ? tum.filter(s => s.tarih >= bas) : tum, once = donem ? tum.filter(s => s.tarih >= onceBas && s.tarih < bas) : [];
    return { tum, simdi, oz: istOzet(simdi), once: istOzet(once), ant: istAntrenmanlar(simdi), tumAnt: istAntrenmanlar(tum) };
}
function istFark(a, b, ters, h) {
    if (a == null || b == null) return '';
    let f = a - b; if (Math.abs(f) < (h === 0 ? 0.5 : 0.05)) return '<div class="ist-f n">= aynı</div>';
    let iyi = ters ? f < 0 : f > 0;
    return '<div class="ist-f ' + (iyi ? 'i' : 'k') + '">' + (f > 0 ? '▲ ' : '▼ ') + istSayi(Math.abs(f), h) + '</div>';
}

function istCss() {
    if (document.getElementById('ist-css')) return;
    let s = document.createElement('style'); s.id = 'ist-css';
    s.textContent = `
.ist{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.ist-k{background:var(--bg-panel);border:1px solid var(--border-color);border-radius:16px;padding:12px}
.ist-k h3{margin:0 0 8px;font-size:14px;font-weight:800;display:flex;justify-content:space-between;align-items:center;gap:8px}.ist-k h3 small{color:var(--text-muted);font-weight:600;font-size:11.5px}
.ist-cip{display:flex;gap:6px}.ist-cip button{font:inherit;font-size:12.5px;font-weight:800;padding:6px 12px;border-radius:999px;border:1px solid var(--border-color);background:transparent;color:var(--text-muted);cursor:pointer;transform:none}
.ist-cip button[aria-pressed=true]{background:var(--accent-orange);border-color:var(--accent-orange);color:#fff}
.ist-kpi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.ist-kpi div{background:var(--bg-main);border-radius:11px;padding:9px 6px;text-align:center;min-width:0}
.ist-kpi b{display:block;font-size:20px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1.15}.ist-kpi small{display:block;font-size:10px;color:var(--text-muted);font-weight:800;letter-spacing:.03em}
.ist-f{font-size:11px;font-weight:800;margin-top:2px}.ist-f.i{color:var(--neon-green,#22c55e)}.ist-f.k{color:var(--neon-red,#ef4444)}.ist-f.n{color:var(--text-muted)}
.ist-dag{display:flex;gap:4px;align-items:flex-end;height:86px}.ist-dag div{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:2px;font-size:10.5px;color:var(--text-muted);font-weight:800;height:100%;min-width:0}
.ist-dag i{width:100%;border-radius:4px 4px 0 0;min-height:2px}.ist-dag em{font-style:normal;font-size:9.5px;color:var(--text-main)}
.ist-rek{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}.ist-rek div{background:var(--bg-main);border-radius:10px;padding:8px 10px;font-size:11.5px;color:var(--text-muted);min-width:0}.ist-rek b{display:block;color:var(--gold,#fbbf24);font-size:17px;font-weight:900}
.ist-lst>div{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-color);font-size:13px}.ist-lst>div:last-child{border:0}.ist-lst small{color:var(--text-muted)}.ist-lst b{font-variant-numeric:tabular-nums}
.ist-bos{color:var(--text-muted);font-size:13px;text-align:center;padding:14px 6px}
.ist-ana{display:flex;align-items:center;gap:12px;width:100%;font:inherit;color:inherit;text-align:left;cursor:pointer;background:var(--bg-panel);border:1px solid var(--border-color);border-radius:16px;padding:12px 14px;margin-bottom:14px;transform:none}
.ist-ana .n{font-size:30px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1}.ist-ana small{display:block;color:var(--text-muted);font-size:12px;margin-top:2px}.ist-ana .ok{margin-left:auto;font-size:20px;color:var(--text-muted)}
.ist svg text{font-family:inherit}`;
    document.head.appendChild(s);
}

// ana ekran kartı (dokun → Gelişim sekmesi)
function istAnaKartHTML(sp) {
    istCss();
    let v = istVeri(sp, 30), o = v.oz;
    if (!o.ok) return '<button type="button" class="ist-ana" onclick="sekmeAc(\'gelisim\')"><span style="font-size:26px">📊</span><span><b>İstatistiklerim</b><small>Son 30 günde skor yok — skor girdikçe burada ortalaman, rekorların görünür.</small></span><span class="ok">›</span></button>';
    return '<button type="button" class="ist-ana" onclick="sekmeAc(\'gelisim\')" aria-label="İstatistiklerimi aç"><span class="n">' + istSayi(o.okOrt) + '</span><span><b>📊 İstatistiklerim</b> ' + istFark(o.okOrt, v.once.okOrt).replace('<div', '<span').replace('</div>', '</span>') + '<small>son 30 gün ok ortalaman · ' + o.ok + ' ok · en iyi seri ' + (o.enIyi ? o.enIyi.puan : '—') + '</small></span><span class="ok">›</span></button>';
}

// tam pano
function istPanoHTML(g, ad, sp) {
    istCss();
    let d = IST.donem, v = istVeri(sp, d), o = v.oz, p = v.once, fk = d && p.ok > 0; // önceki dönemde skor yoksa ▲▼ anlamsız
    let cip = '<div class="ist-k"><div class="ist-cip" role="group" aria-label="Dönem">' + [[7, '7 gün'], [30, '30 gün'], [0, 'Sezon']].map(x => '<button type="button" aria-pressed="' + (d === x[0]) + '" onclick="IST.donem=' + x[0] + ';istYenile()">' + x[1] + '</button>').join('') + '</div></div>';
    if (!o.ok) return '<div class="ist" id="ist-pano">' + cip + '<div class="ist-k"><h3>📊 İstatistiklerim</h3><div class="ist-bos">Bu dönemde skor yok. Skor girdikçe ortalaman, rekorların ve gelişimin burada görünür.</div></div></div>';
    let kar = fk ? ' <small>önceki ' + (d === 7 ? '7 güne' : '30 güne') + ' göre</small>' : '';
    let kpi = '<div class="ist-k"><h3>📊 İstatistiklerim' + kar + '</h3><div class="ist-kpi">'
        + '<div><b>' + istSayi(o.okOrt) + '</b><small>OK ORT.</small>' + (fk ? istFark(o.okOrt, p.okOrt) : '') + '</div>'
        + '<div><b>' + istSayi(o.seriOrt) + '</b><small>SERİ ORT.</small>' + (fk ? istFark(o.seriOrt, p.seriOrt) : '') + '</div>'
        + '<div><b>' + (o.enIyi ? o.enIyi.puan : '—') + '</b><small>EN İYİ SERİ' + (o.enIyi ? ' · ' + o.enIyi.oklar.length + ' OK' : '') + '</small></div>'
        + '<div><b>' + o.ok + '</b><small>OK</small>' + (fk ? istFark(o.ok, p.ok, false, 0) : '') + '</div>'
        + '<div><b>' + o.antrenman + '</b><small>ANTRENMAN</small>' + (fk ? istFark(o.antrenman, p.antrenman, false, 0) : '') + '</div>'
        + '<div><b>%' + istSayi(o.karavana, 0) + '</b><small>KARAVANA</small>' + (fk ? istFark(o.karavana, p.karavana, true, 0) : '') + '</div>'
        + '</div></div>';
    // ok ortalaması çizgisi: dönemdeki antrenmanlar (sezon: son 20)
    let a = d ? v.ant : v.ant.slice(-20), cizgi = '';
    if (a.length >= 2) {
        let W = 340, H = 120, sol = 26, mn = Math.min(...a.map(x => x.ort)), mx = Math.max(...a.map(x => x.ort));
        mn = Math.floor(mn * 2) / 2 - 0.25; mx = Math.ceil(mx * 2) / 2 + 0.25; if (mx - mn < 1) { mn -= 0.5; mx += 0.5; }
        let x = i => sol + 6 + i * (W - sol - 14) / (a.length - 1), y = val => 12 + (H - 34) * (1 - (val - mn) / (mx - mn));
        let izgara = [mn + 0.25, (mn + mx) / 2, mx - 0.25].map(val => '<line x1="' + sol + '" x2="' + W + '" y1="' + y(val) + '" y2="' + y(val) + '" stroke="currentColor" stroke-opacity=".12"/><text x="0" y="' + (y(val) + 3) + '" font-size="10" fill="currentColor" fill-opacity=".55">' + istSayi(val) + '</text>').join('');
        let son = a[a.length - 1], enIyiI = a.reduce((b, z, i) => z.ort > a[b].ort ? i : b, 0);
        cizgi = '<div class="ist-k"><h3>Ok ortalaması <small>antrenman antrenman · ' + a.length + ' antrenman</small></h3><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Antrenmanlara göre ok ortalaması">' + izgara
            + '<polyline points="' + a.map((z, i) => x(i) + ',' + y(z.ort)).join(' ') + '" fill="none" stroke="var(--accent-orange)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
            + a.map((z, i) => '<circle cx="' + x(i) + '" cy="' + y(z.ort) + '" r="' + (i === a.length - 1 ? 5 : 3) + '" fill="var(--accent-orange)"><title>' + istTarihKisa(z.tarih) + ': ' + istSayi(z.ort, 2) + ' (' + z.ok + ' ok)</title></circle>').join('')
            + '<text x="' + Math.min(x(a.length - 1), W - 24) + '" y="' + (y(son.ort) - 9) + '" font-size="11" font-weight="800" fill="currentColor" text-anchor="middle">' + istSayi(son.ort) + '</text>'
            + (enIyiI !== a.length - 1 ? '<text x="' + x(enIyiI) + '" y="' + (y(a[enIyiI].ort) - 9) + '" font-size="10" fill="currentColor" fill-opacity=".7" text-anchor="middle">' + istSayi(a[enIyiI].ort) + '</text>' : '')
            + '<text x="' + sol + '" y="' + (H - 4) + '" font-size="10" fill="currentColor" fill-opacity=".55">' + istTarihKisa(a[0].tarih) + '</text><text x="' + W + '" y="' + (H - 4) + '" font-size="10" fill="currentColor" fill-opacity=".55" text-anchor="end">' + istTarihKisa(son.tarih) + '</text></svg></div>';
    }
    // puan dağılımı (yalnız görülen değerler + 10/9/M her zaman)
    let gor = IST_DAG.filter(k => o.dag[k] || k === '10' || k === '9' || k === 'M'), dmx = Math.max(1, ...gor.map(k => o.dag[k]));
    let dag = '<div class="ist-k"><h3>Oklar nereye gitti <small>' + o.ok + ' ok · ' + o.on + ' tanesi 10/X (%' + Math.round(o.on / o.ok * 100) + ')</small></h3><div class="ist-dag">' + gor.map(k => '<div><em>' + (o.dag[k] || '') + '</em><i style="height:' + Math.round(o.dag[k] / dmx * 62) + 'px;background:' + IST_DAG_RENK[k] + '"></i>' + k + '</div>').join('') + '</div></div>';
    // rekorlar (tüm zamanlar)
    let tumOz = istOzet(v.tum), enIyiAnt = v.tumAnt.filter(x => x.ok >= 12).reduce((b, x) => !b || x.ort > b.ort ? x : b, null);
    let yrs = typeof yrsKarneVeri === 'function' ? yrsKarneVeri(g, ad) : [], enIyiYrs = yrs.reduce((b, x) => !b || x.puan > b.puan ? x : b, null);
    let seriGun = 0; try { if (typeof devamSerisiHesapla === 'function') seriGun = devamSerisiHesapla(g, ad) || 0; } catch (e) {}
    let rek = '<div class="ist-k"><h3>🏅 Rekorlarım <small>tüm zamanlar</small></h3><div class="ist-rek">'
        + '<div><b>' + (tumOz.enIyi ? tumOz.enIyi.puan : '—') + '</b>en iyi seri' + (tumOz.enIyi ? ' (' + tumOz.enIyi.oklar.length + ' ok) · ' + istTarihKisa(tumOz.enIyi.tarih) : '') + '</div>'
        + '<div><b>' + (enIyiAnt ? istSayi(enIyiAnt.ort) : '—') + '</b>en iyi antrenman ort.' + (enIyiAnt ? ' · ' + istTarihKisa(enIyiAnt.tarih) : '') + '</div>'
        + (enIyiYrs ? '<div><b>' + enIyiYrs.puan + '</b>en iyi yarışma · ' + istTarihKisa(enIyiYrs.y.tarih) + '</div>' : '<div><b>' + tumOz.ok + '</b>toplam ok</div>')
        + '<div><b>' + (seriGun ? seriGun + ' hafta' : tumOz.antrenman) + '</b>' + (seriGun ? 'üst üste geldi' : 'toplam antrenman') + '</div>'
        + '</div></div>';
    let son = v.ant.slice(-6).reverse(), dun = istGunEkle(bugunISO(), -1);
    let lst = '<div class="ist-k"><h3>Son antrenmanlar <small>ok ortalaması</small></h3><div class="ist-lst">' + son.map(x => '<div><span>' + (x.tarih === bugunISO() ? 'Bugün' : x.tarih === dun ? 'Dün' : istTarihKisa(x.tarih)) + ' <small>· ' + (x.mesafe ? esc(x.mesafe) + ' · ' : '') + x.ok + ' ok · ' + x.seri + ' seri</small></span><b>' + istSayi(x.ort, 2) + '</b></div>').join('') + '</div></div>';
    let yar = yrs.length ? '<div class="ist-k"><h3>🏆 Yarışmalarım <small>' + yrs.length + ' yarışma</small></h3><div class="ist-lst">' + yrs.slice(-5).reverse().map(x => '<div><span>' + esc(String(x.y.ad || '').trim()) + ' <small>· ' + istTarihKisa(x.y.tarih) + (x.madalya ? ' · ' + x.madalya : '') + (x.sira ? ' · ' + x.sira + '.' : '') + '</small></span><b>' + x.puan + '</b></div>').join('') + '</div></div>' : '';
    return '<div class="ist" id="ist-pano">' + cip + kpi + cizgi + dag + rek + lst + yar + '</div>';
}
function istYenile() {
    let el = document.getElementById('ist-gelisim'); if (!el) return;
    let ad = el.getAttribute('data-ad'), f = typeof basariSporcuBul === 'function' ? basariSporcuBul(ad) : null; if (!f) return;
    el.innerHTML = istPanoHTML(f.grup, ad, f.sp);
}
