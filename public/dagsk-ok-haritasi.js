/* ================================================================================================
   🏹 OK HARİTASI (v452, 2026-11-23) — sporcu profilinde "Oklar" bölümü. Kullanıcı: "sporcunun şu ana kadar attığı oklar, ısı
   haritası, puan ortalaması, okları genelde en fazla nereye doğru gitmiş, en çok yapabileceği hataları büyük yazılarla yazmak".
   - Konum: hedefe dokunarak / yön seçerek girilen oklar (detayliOklar x,y; 10 birim = 1 halka, x sağ, y AŞAĞI pozitif; 3'lü yüz
     _okKonumu ile tek yüze iner) + yarışma arşivindeki oklar (yz_arsiv kon, yarıçap 1 → halka × 10). Aynı ok iki kez sayılmaz.
   - Puan ortalaması BÜTÜN serilerden (konumu olmayan oklar dahil); kaç okta yer bilgisi olduğu ekranda yazar.
   - Olası hata: KC_HATALAR (dagsk-km-kocluk.js) metinleri; her hata ekrandaki bir kanıta dayanır. Kesin teşhis DEĞİL.
     Grup sıkı ama kayıksa önce NİŞANGAH önerilir (teknik hata sayılmaz). Sağ-sol yorumu sağ elle atana göredir.
   ================================================================================================ */
(function () {
    const O = { donem: 'hepsi', gor: 'isi', suz: null, kim: null };
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const v1 = n => n == null || !isFinite(n) ? '—' : n.toFixed(1).replace('.', ',');
    const deger = p => { let s = String(p == null ? '' : p).toUpperCase(); return s === 'X' ? 10 : s === 'M' ? 0 : +s || 0; };
    // 8 yön + orta. d: bakış açısı (0 = sağ, saat yönünde 45°'lik dilimler; y aşağı pozitif)
    const YON = [['sağ', 'SAĞA', '→'], ['sağ alt', 'SAĞ ALTA', '↘'], ['alt', 'AŞAĞIYA', '↓'], ['sol alt', 'SOL ALTA', '↙'], ['sol', 'SOLA', '←'], ['sol üst', 'SOL ÜSTE', '↖'], ['üst', 'YUKARIYA', '↑'], ['sağ üst', 'SAĞ ÜSTE', '↗']];
    const IZGARA = [5, 6, 7, 4, 'o', 0, 3, 2, 1];
    const sektor = p => Math.hypot(p.x, p.y) <= 10 ? 'o' : ((Math.round(Math.atan2(p.y, p.x) / (Math.PI / 4)) % 8) + 8) % 8;

    // ---------------- veri
    function noktalar(g, ad) {
        let sp = turnuvaDB[g] && turnuvaDB[g][ad], l = [], gor = {}; if (!sp) return l;
        let ekle = (arr, t) => (arr || []).forEach(o => {
            if (!o || typeof o.x !== 'number' || typeof o.y !== 'number' || o.duello) return;
            let k = typeof _okKonumu === 'function' ? _okKonumu(o) : o, im = (o.t || t) + '|' + o.x + '|' + o.y + '|' + o.puan; if (o.t && gor[im]) return; gor[im] = 1;
            l.push({ x: k.x, y: k.y, p: o.puan == null ? null : deger(o.puan), t: o.tarih || (o.t ? bugunISO(new Date(o.t)) : t), z: o.t || 0 });
        });
        (sp.kartGecmisi || []).forEach(k => ekle(k.detayliOklar, String(k.tarih || '').slice(0, 10)));
        ekle(sp.detayliOklar, bugunISO());
        let ars = []; try { ars = JSON.parse(localStorage.getItem('dag_yz_arsiv') || '[]') || []; } catch (e) {}
        ars.forEach(r => { let s = (r.sporcular || []).find(x => x.k === g + '|' + ad), c = (r.yuz === '10' || r.yuz === '10k') ? 100 : 60; if (s && s.kon) s.kon.forEach(k => { let x = k[0] * c, y = k[1] * c, h = Math.hypot(x, y) / 10; l.push({ x, y, p: h > c / 10 ? 0 : Math.max(1, 10 - Math.floor(h)), t: r.tarih || '', z: r.t || 0 }); }); });
        return l.sort((a, b) => a.t.localeCompare(b.t) || a.z - b.z);
    }
    function seriler(g, ad) {
        let sp = turnuvaDB[g] && turnuvaDB[g][ad], gor = {}; if (!sp) return [];
        return [].concat(sp.seriler || [], ...(sp.kartGecmisi || []).map(k => (k.seriler || []).map(s => s.tarih ? s : Object.assign({ tarih: k.tarih }, s))))
            .filter(s => s && !s.iptal && (s.oklar || []).length && !(s.seriId && gor[s.seriId]) && (s.seriId ? (gor[s.seriId] = 1) : 1))
            .map(s => ({ t: String(s.tarih || '').slice(0, 10), z: s.t || 0, o: s.oklar.map(deger), m: s.oklar.filter(x => String(x).toUpperCase() === 'M').length })).sort((a, b) => a.t.localeCompare(b.t) || a.z - b.z);
    }
    const bas90 = () => { let d = new Date(); d.setDate(d.getDate() - 90); return bugunISO(d); };
    function veri(g, ad) {
        let N = noktalar(g, ad), S = seriler(g, ad), n = N, s = S;
        if (O.donem === '30') { n = N.slice(-30); let k = 0; s = S.slice().reverse().filter(x => { if (k >= 30) return false; k += x.o.length; return true; }).reverse(); }
        else if (O.donem === '90') { let b = bas90(); n = N.filter(x => x.t >= b); s = S.filter(x => x.t >= b); }
        return { N, S, n, s };
    }
    function grup(n) {
        if (!n.length) return null;
        let k = n.length, mx = n.reduce((a, p) => a + p.x, 0) / k, my = n.reduce((a, p) => a + p.y, 0) / k;
        let sx = Math.sqrt(n.reduce((a, p) => a + (p.x - mx) ** 2, 0) / k), sy = Math.sqrt(n.reduce((a, p) => a + (p.y - my) ** 2, 0) / k), say = {};
        n.forEach(p => { let d = sektor(p); say[d] = (say[d] || 0) + 1; });
        let en = null; for (let i = 0; i < 8; i++) if (say[i] && (en == null || say[i] > say[en])) en = i;
        return { n: k, mx, my, sx, sy, say, en, ofset: Math.hypot(mx, my) / 10, yay: n.reduce((a, p) => a + Math.hypot(p.x - mx, p.y - my), 0) / k / 10 };
    }
    // aynı günün ilk üçte biri ile son üçte biri (en az 6 serilik günler)
    function yorulma(s) {
        let gun = {}; s.forEach(x => { (gun[x.t] = gun[x.t] || []).push(x); });
        let f = []; Object.keys(gun).forEach(t => { let l = gun[t]; if (l.length < 6) return; let u = Math.floor(l.length / 3), o = a => { let q = [].concat(...a.map(x => x.o)); return q.reduce((x, y) => x + y, 0) / q.length; }; f.push(o(l.slice(0, u)) - o(l.slice(-u))); });
        return f.length >= 2 ? { fark: f.reduce((a, b) => a + b, 0) / f.length, gun: f.length } : null;
    }
    function puanOzet(s) {
        let o = [].concat(...s.map(x => x.o)), m = s.reduce((a, x) => a + x.m, 0), dag = {}; o.forEach(x => { dag[x] = (dag[x] || 0) + 1; });
        return { n: o.length, ort: o.length ? o.reduce((a, b) => a + b, 0) / o.length : null, sari: o.length ? Math.round(o.filter(x => x >= 9).length / o.length * 100) : null, iska: o.length ? Math.round(m / o.length * 100) : null, dag };
    }
    // ---------------- olası hatalar: { id → puan, kanıt[] }
    function hatalar(g, ad, gr, ps, yor) {
        let sp = (turnuvaDB[g] || {})[ad] || {}, mak = /makaral/i.test(sp.yay || ''), h = {};
        let e = (id, p, k) => { if (p <= 0) return; let x = h[id] = h[id] || { id, p: 0, k: [] }; x.p += p; if (x.k.indexOf(k) < 0) x.k.push(k); };
        if (gr && gr.n >= 10) {
            let a = gr.mx / 10, b = gr.my / 10, ks = gr.yay < 2.2 && gr.ofset >= 1 && gr.ofset > gr.yay * 0.6 ? 0.35 : 1; // grup sıkıysa önce nişangah: teknik puanı düşer
            if (b >= 0.8) { let k = 'Okların ortası ' + v1(b) + ' halka aşağıda'; e('kol-dusme', b * 1.2 * ks, k); e('kolla-cekme', b * ks, k); if (mak) e('tetik', b * 1.3 * ks, k); }
            if (b <= -0.8) { let k = 'Okların ortası ' + v1(-b) + ' halka yukarıda'; e('omuz', -b * 1.2 * ks, k); e('ankraj', -b * ks, k); }
            if (a <= -0.8) { let k = 'Okların ortası ' + v1(-a) + ' halka solda'; e('parmak', -a * 1.2 * ks, k); e('sikma', -a * 0.8 * ks, k); if (mak) e('egim', -a * ks, k); }
            if (a >= 0.8) { let k = 'Okların ortası ' + v1(a) + ' halka sağda'; e('sikma', a * 1.2 * ks, k); e('ayak', a * 0.8 * ks, k); if (mak) e('egim', a * ks, k); }
            if (gr.sy >= 12 && gr.sy > gr.sx * 1.3) { let k = 'Yukarı-aşağı dağılım, sağa-sola göre ' + v1(gr.sy / gr.sx) + ' kat fazla'; e('ankraj', (gr.sy / gr.sx) * 1.1, k); e('kolla-cekme', gr.sy / gr.sx * 0.8, k); }
            if (gr.sx >= 12 && gr.sx > gr.sy * 1.3) { let k = 'Sağa-sola dağılım, yukarı-aşağıya göre ' + v1(gr.sx / gr.sy) + ' kat fazla'; e('sikma', (gr.sx / gr.sy) * 1.1, k); e('parmak', gr.sx / gr.sy * 0.9, k); e('ayak', gr.sx / gr.sy * 0.8, k); }
            if (gr.sx > 25 && gr.sy > 25) { let k = 'Oklar her yöne geniş dağılıyor (ortalama ' + v1(gr.yay) + ' halka)'; e('donma', 1.6, k); e('ayak', 1, k); }
        }
        if (yor && yor.fark >= 0.5) e('kolla-cekme', yor.fark * 1.6, 'Dersin son serilerinde ok başı ' + v1(yor.fark) + ' puan düşüyor (' + yor.gun + ' gün)');
        if (ps.n >= 30 && ps.iska >= 10) e('donma', ps.iska / 10, 'Her 100 okun ' + ps.iska + ' tanesi ıska');
        let L = typeof KC_HATALAR !== 'undefined' ? KC_HATALAR : [];
        return Object.values(h).map(x => Object.assign(x, { h: L.find(y => y.id === x.id) })).filter(x => x.h && x.p >= 0.9 && (x.h.yay === 'hepsi' || x.h.yay === (mak ? 'makarali' : 'klasik'))).sort((a, b) => b.p - a.p).slice(0, 3);
    }
    function nisangah(gr) {
        if (!gr || gr.n < 10 || gr.ofset < 1 || gr.yay >= 2.2 || gr.ofset <= gr.yay * 0.6) return null;
        let y = []; if (Math.abs(gr.my) >= 5) y.push(gr.my > 0 ? 'aşağı' : 'yukarı'); if (Math.abs(gr.mx) >= 5) y.push(gr.mx > 0 ? 'sağa' : 'sola');
        return { yon: y.join(' ve '), k: 'Oklar birbirine yakın (' + v1(gr.yay) + ' halka) ama ortaları ' + v1(gr.ofset) + ' halka kayık.' };
    }
    // ---------------- çizim
    const RENKLI = [['#f4f4f2', 100], ['#f4f4f2', 90], ['#2b2b2b', 80], ['#2b2b2b', 70], ['#3f97dd', 60], ['#3f97dd', 50], ['#d9413c', 40], ['#d9413c', 30], ['#f3c92f', 20], ['#f3c92f', 10]];
    let isiKey = '', isiUrl = '';
    function isiGorsel(n) { // tek renk (amber) yoğunluk: koyudan açığa
        let key = n.length + '|' + n.map(p => (p.x | 0) + ',' + (p.y | 0)).join(';'); if (key === isiKey) return isiUrl;
        const B = 120, S = 240 / B, r = n.length >= 60 ? 9 : n.length >= 25 ? 12 : 15; let z = new Float32Array(B * B), mx = 0;
        n.forEach(p => { let cx = Math.max(-114, Math.min(114, p.x)), cy = Math.max(-114, Math.min(114, p.y)), u = Math.ceil(r * 3 / S), ix = Math.round((cx + 120) / S), iy = Math.round((cy + 120) / S); for (let j = iy - u; j <= iy + u; j++) for (let i = ix - u; i <= ix + u; i++) { if (i < 0 || j < 0 || i >= B || j >= B) continue; let dx = i * S - 120 - cx, dy = j * S - 120 - cy, w = Math.exp(-(dx * dx + dy * dy) / (2 * r * r)); let q = z[j * B + i] += w; if (q > mx) mx = q; } });
        let c = document.createElement('canvas'); c.width = c.height = B; let x = c.getContext('2d'), im = x.createImageData(B, B), D = [[0, 120, 62, 4, 0], [0.12, 138, 72, 6, 90], [0.4, 196, 110, 14, 190], [0.7, 242, 166, 40, 235], [1, 255, 240, 190, 255]];
        for (let i = 0; i < B * B; i++) { let t = z[i] / (mx || 1), k = 1; while (k < D.length - 1 && t > D[k][0]) k++; let a = D[k - 1], b = D[k], f = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))); for (let q = 0; q < 4; q++) im.data[i * 4 + q] = a[q + 1] + (b[q + 1] - a[q + 1]) * f; }
        x.putImageData(im, 0, 0); isiKey = key; isiUrl = c.toDataURL(); return isiUrl;
    }
    function hedefSVG(n, gr, hepsi) {
        let isi = O.gor === 'isi', s = '';
        RENKLI.forEach(r => { s += `<circle r="${r[1]}" fill="${isi ? '#191d24' : r[0]}" stroke="${isi ? (r[1] === 20 || r[1] === 10 ? '#b8932f' : '#4a525f') : 'rgba(0,0,0,.35)'}" stroke-width="${isi ? 0.9 : 0.6}"/>`; });
        if (isi && n.length) s += `<image href="${isiGorsel(n)}" x="-120" y="-120" width="240" height="240" preserveAspectRatio="none"/>` + [100, 80, 60, 40, 20].map(r => `<circle r="${r}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width=".7"/>`).join('') + '<path d="M-5 0H5M0 -5V5" stroke="#fff" stroke-width="1"/>';
        if (!isi) { let o = n.length > 150 ? 0.55 : 0.9; s += n.map(p => `<circle cx="${Math.max(-115, Math.min(115, p.x)).toFixed(1)}" cy="${Math.max(-115, Math.min(115, p.y)).toFixed(1)}" r="3.4" fill="#111" fill-opacity="${o}" stroke="#fff" stroke-width="1"><title>${esc(p.t.split('-').reverse().join('.'))}${p.p == null ? '' : ' · ' + p.p}</title></circle>`).join(''); }
        if (gr && gr.n >= 5) {
            if (gr.ofset >= 0.6) s += `<line x1="0" y1="0" x2="${gr.mx.toFixed(1)}" y2="${gr.my.toFixed(1)}" stroke="#3fe08f" stroke-width="2" stroke-dasharray="4 3"/>`;
            s += `<circle cx="${gr.mx.toFixed(1)}" cy="${gr.my.toFixed(1)}" r="6.5" fill="none" stroke="#0f1216" stroke-width="5.5"/><circle cx="${gr.mx.toFixed(1)}" cy="${gr.my.toFixed(1)}" r="6.5" fill="none" stroke="#3fe08f" stroke-width="3"/>`;
        }
        return `<svg viewBox="-120 -120 240 240" class="okh-hedef" role="img" aria-label="${isi ? 'Isı haritası' : 'Okların yeri'}: ${n.length} ok">${s}</svg>`;
    }
    function panel(g, ad) {
        css(); if (O.kim !== g + '|' + ad) { O.kim = g + '|' + ad; O.suz = null; O.donem = 'hepsi'; }
        let D = veri(g, ad), ps = puanOzet(D.s), sp30 = puanOzet(D.S.slice(-Math.max(1, (() => { let k = 0, i = D.S.length; while (i > 0 && k < 30) { i--; k += D.S[i].o.length; } return D.S.length - i; })()))), gr = grup(D.n), tum = puanOzet(D.S);
        if (!D.S.length && !D.N.length) return '';
        let yor = yorulma(D.s), hl = hatalar(g, ad, gr, ps, yor), nis = nisangah(gr);
        let n = D.n; if (O.suz != null) n = O.suz.y != null ? n.filter(p => sektor(p) === O.suz.y) : n.filter(p => p.p === O.suz.p);
        let seg = (grp, dz) => `<div class="okh-seg yn-pdf-gizle" role="group">${dz.map(x => `<button type="button" aria-pressed="${O[grp] === x[0]}" onclick="okhAyar('${grp}','${x[0]}')">${x[1]}</button>`).join('')}</div>`;
        let kutu = (et, dg, alt, fn) => `<button type="button" onclick="${fn}"><small>${et}</small><b>${dg}</b><span>${alt}</span></button>`;
        let fark = tum.ort != null && sp30.ort != null && tum.n > 60 ? sp30.ort - tum.ort : null;
        let kutular = `<div class="okh-kutu">${kutu('Ok başı ortalama', v1(ps.ort), ps.n + ' ok', "ynBolum('skor')")}${kutu('Son 30 ok', v1(sp30.ort), fark == null ? 'son atışları' : Math.abs(fark) < 0.15 ? 'ortalamasıyla aynı' : (fark > 0 ? '▲ ' : '▼ ') + v1(Math.abs(fark)) + (fark > 0 ? ' yükseldi' : ' düştü'), "okhAyar('donem','30')")}${kutu('Sarı (9–10)', ps.sari == null ? '—' : '%' + ps.sari, 'okların', "okhPuan('sari')")}${kutu('Iska', ps.iska == null ? '—' : '%' + ps.iska, 'okların', "okhPuan(0)")}</div>`;
        // yön
        let yonHTML;
        if (!gr || gr.n < 10) yonHTML = `<div class="okh-az"><b>${D.N.length ? 'Yön için en az 10 ok yeri gerekli' : 'Okların yeri henüz girilmemiş'}</b><span>${D.n.length} / 10 ok. Skoru <b>hedefe dokunarak</b> ya da <b>Puan + yön</b> ile girince ısı haritası ve hatalar burada çıkar. Yalnız sayı girilen okların yeri bilinmez.</span></div>`;
        else {
            let pay = Math.round((gr.say[gr.en] || 0) / gr.n * 100), orta = Math.round((gr.say.o || 0) / gr.n * 100), belirgin = gr.en != null && pay >= 20 && pay > orta * 0.6;
            let mk = gr.ofset >= 0.6 ? 'Okların ortası ' + v1(gr.ofset) + ' halka ' + YON[sektorYon(gr)][0] + ' tarafta' : 'Okların ortası hedefin merkezinde';
            yonHTML = `<div class="okh-yon">${belirgin ? `<small>Okları en çok</small><b><i aria-hidden="true">${YON[gr.en][2]}</i> ${YON[gr.en][1]} GİDİYOR</b><span>her 100 oktan ${pay} tanesi · ${gr.say[gr.en]} ok</span>` : orta >= 35 ? `<small>Okları</small><b>ORTAYA TOPLANIYOR</b><span>her 100 oktan ${orta} tanesi ortadaki 10’da</span>` : `<small>Okları</small><b>HER YÖNE DAĞILIYOR</b><span>belirgin bir yön yok</span>`}<em>${mk} · grup genişliği ${v1(gr.yay * 2)} halka</em></div>
            <div class="okh-9" role="group" aria-label="Yönlere göre ok oranı">${IZGARA.map(d => { let a = gr.say[d] || 0, y = Math.round(a / gr.n * 100), sec = O.suz && O.suz.y === d; return `<button type="button" aria-pressed="${!!sec}" onclick="okhYon(${d === 'o' ? "'o'" : d})" aria-label="${d === 'o' ? 'orta' : YON[d][0]}: yüzde ${y}" style="background:rgba(212,167,58,${(0.06 + 0.6 * a / Math.max(1, ...Object.values(gr.say))).toFixed(2)})"><i aria-hidden="true">${d === 'o' ? '◎' : YON[d][2]}</i><b>%${y}</b></button>`; }).join('')}</div>`;
        }
        let suzYazi = O.suz ? `<div class="okh-suz"><span>${O.suz.y != null ? (O.suz.y === 'o' ? 'Ortadaki' : YON[O.suz.y][0][0].toLocaleUpperCase('tr') + YON[O.suz.y][0].slice(1) + ' taraftaki') : O.suz.p === 0 ? 'Iska' : O.suz.p + ' puanlık'} ${n.length} ok${n.length ? ' · ok başı ' + v1(n.filter(p => p.p != null).reduce((a, p) => a + p.p, 0) / Math.max(1, n.filter(p => p.p != null).length)) : ''}</span><button type="button" class="ap-btn" onclick="okhSifirla()">Hepsini göster</button></div>` : '';
        // puan dağılımı
        let dm = Math.max(1, ...Object.values(ps.dag)), dag = ps.n ? `<h4>Hangi puandan kaç ok</h4><div class="okh-dag">${[10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(p => { let a = ps.dag[p] || 0; return `<button type="button" aria-pressed="${!!O.suz && O.suz.p === p}" onclick="okhPuan(${p})" aria-label="${p || 'ıska'}: ${a} ok"><b>${a || ''}</b><i style="height:${Math.round(a / dm * 64)}px"></i><small>${p || 'M'}</small></button>`; }).join('')}</div>` : '';
        // hatalar
        let yas = g === 'minikler' ? 'minik' : g === 'kucukler' ? 'kucuk' : 'buyuk', od = typeof kyDepoOku === 'function' ? (kyDepoOku('teknik_odak') || {})[g + '|' + ad] : null; od = od && !od.sil ? od : null;
        let hk = (nis ? `<article class="okh-h nis"><div class="okh-h-ust"><span>1</span><h4>Önce nişangahı ${esc(nis.yon)} al</h4></div><p class="kanit">${esc(nis.k)} Bu, teknikten çok nişangah ayarına benziyor.</p><p><b>Ne yap:</b> Nişangahı oklarının gittiği yöne çevir: ${esc(nis.yon)}. Azar azar çevir, 6 ok at, tekrar bak.</p></article>` : '')
            + hl.slice(0, nis ? 2 : 3).map((x, i) => { let h = x.h, sec = od && od.hata === h.id; return `<article class="okh-h"><div class="okh-h-ust"><span>${i + 1 + (nis ? 1 : 0)}</span><h4>${esc(h.ad)}</h4></div><p class="kanit">${x.k.map(esc).join('. ')}.</p><p class="soyle">“${esc(h.cumle[yas] || h.cumle.buyuk)}”</p><details><summary>Nedeni ve çalışmalar</summary><p><b>Nasıl görünür:</b> ${esc(h.belirti)}</p><p><b>Neden:</b> ${esc(h.neden)}</p><ul>${h.calisma.map(c => '<li>' + esc(c) + '</li>').join('')}</ul><p><b>Düzeldi sayılır:</b> ${esc(h.olcut)}</p></details><div class="yn-pdf-gizle">${sec ? '<button type="button" class="ap-btn" disabled>✓ Bu haftanın odağı</button>' : `<button type="button" class="ap-btn ana" onclick="okhOdak('${h.id}')">Bu haftanın odağı yap</button>`}</div></article>`; }).join('');
        let hataHTML = hk || `<div class="okh-az"><b>${gr && gr.n >= 10 ? 'Belirgin bir hata izi yok' : 'Hata tahmini için ok yeri gerekli'}</b><span>${gr && gr.n >= 10 ? 'Oklar ne kayık ne de bir yöne dağınık.' : 'En az 10 okun yeri girilince olası hatalar burada yazar.'}</span></div>`;
        return `<div class="ap-panel okh" id="yn-b-oklar"><h3><b>🏹 Oklar${typeof yeniRozet === 'function' ? ' ' + yeniRozet() : ''}</b><span>yöne ve puana dokun</span></h3>
            <div class="okh-ust">${seg('donem', [['30', 'Son 30 ok'], ['90', '3 ay'], ['hepsi', 'Tümü']])}${seg('gor', [['isi', 'Isı haritası'], ['nokta', 'Oklar']])}</div>
            ${kutular}
            <div class="okh-iki"><div class="okh-sol">${D.n.length ? hedefSVG(n, O.suz ? null : gr) + suzYazi + `<p class="okh-not">${O.suz ? '' : gr && gr.n >= 5 ? '○ yeşil halka = okların ortası. ' : ''}${tum.n} okun ${D.N.length > tum.n ? tum.n : D.N.length} tanesinin yeri biliniyor.</p>` : ''}</div><div>${yonHTML}${dag}</div></div>
            <div class="okh-bas" role="heading" aria-level="3">En çok yapabileceği hatalar</div>${hataHTML}
            <p class="okh-not">Okların yerine ve puanlara bakarak yapılan tahmindir, kesin teşhis değildir; atışı izleyerek doğrula. Sağ-sol yorumu sağ elle atan sporcuya göredir.</p></div>`;
    }
    const sektorYon = gr => ((Math.round(Math.atan2(gr.my, gr.mx) / (Math.PI / 4)) % 8) + 8) % 8;
    // ---------------- dokunma
    function ciz() { let e = document.getElementById('yn-b-oklar'), k = window.ynKisi && ynKisi(); if (e && k) e.outerHTML = panel(k.grup, k.ad); }
    window.okhPanelHTML = panel;
    window.okhAyar = function (a, v) { O[a] = v; if (a === 'donem') O.suz = null; ciz(); };
    window.okhYon = function (d) { O.suz = O.suz && O.suz.y === d ? null : { y: d }; ciz(); };
    window.okhPuan = function (p) { if (p === 'sari') { O.suz = null; O.gor = 'nokta'; ciz(); return; } O.suz = O.suz && O.suz.p === p ? null : { p }; O.gor = 'nokta'; ciz(); };
    window.okhSifirla = function () { O.suz = null; ciz(); };
    window.okhOdak = function (id) {
        let k = window.ynKisi && ynKisi(), h = k && KC_HATALAR.find(x => x.id === id); if (!h || typeof kcOdakYaz !== 'function') return;
        let yas = k.grup === 'minikler' ? 'minik' : k.grup === 'kucukler' ? 'kucuk' : 'buyuk';
        kcOdakYaz(k.grup, k.ad, { hata: h.id, hataAd: h.ad, cumle: h.cumle[yas], tarih: bugunISO(), kim: (typeof _oturum !== 'undefined' && _oturum && _oturum.ad) || '' });
        showToast('Odak kaydedildi: Karışık Sınıf › Teknik Koçluk\'ta bütün eğitmenler görür', 'success'); ciz();
    };
    window.okhTest = { noktalar, seriler, grup, hatalar, nisangah, sektor, puanOzet, yorulma, O };
    function css() {
        if (document.getElementById('okh-css')) return; let st = document.createElement('style'); st.id = 'okh-css';
        st.textContent = `.okh .okh-ust{display:flex;flex-wrap:wrap;gap:8px 14px;justify-content:space-between;margin-bottom:10px}
.okh .okh-seg{display:flex;gap:4px}.okh .okh-seg button{font:inherit;font-size:12.5px;font-weight:700;min-height:40px;padding:6px 11px;border-radius:8px;border:1px solid var(--ap-cizgi);background:transparent;color:var(--ap-soluk);cursor:pointer;transform:none!important}
.okh .okh-seg button[aria-pressed=true]{background:var(--ap-kart2);border-color:var(--ap-vurgu);color:var(--ap-yazi)}
.okh .okh-kutu{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:14px}@media (max-width:600px){.okh .okh-kutu{grid-template-columns:1fr 1fr}}
.okh .okh-kutu button{font:inherit;text-align:left;border:1px solid transparent;border-radius:10px;background:var(--ap-kart2);color:var(--ap-yazi);padding:10px 12px;display:grid;gap:1px;cursor:pointer;transform:none!important}
.okh .okh-kutu small{font-size:12px;color:var(--ap-soluk)}.okh .okh-kutu b{font-size:28px;font-weight:800;line-height:1.1}.okh .okh-kutu span{font-size:12px;color:var(--ap-soluk)}
.okh .okh-iki{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:start}@media (max-width:860px){.okh .okh-iki{grid-template-columns:minmax(0,1fr)}}
.okh .okh-hedef{display:block;width:100%;max-width:460px;margin:0 auto;height:auto}
.okh .okh-not{margin:8px 0 0;font-size:12px;line-height:1.45;color:var(--ap-soluk);text-align:left}.okh .okh-sol .okh-not{text-align:center}
.okh .okh-suz{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px;font-size:13.5px;font-weight:700}.okh .okh-suz .ap-btn{min-height:40px}
.okh .okh-yon{display:grid;gap:2px;margin-bottom:12px}.okh .okh-yon small{font-size:14px;color:var(--ap-soluk)}.okh .okh-yon b{font-size:clamp(25px,7.4vw,36px);font-weight:900;line-height:1.1;letter-spacing:-.01em;color:#f0c860}.okh .okh-yon b i{font-style:normal}.okh .okh-yon span{font-size:15px;font-weight:700}.okh .okh-yon em{font-style:normal;font-size:13px;color:var(--ap-soluk);margin-top:2px}
.okh .okh-9{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;max-width:330px;margin-bottom:16px}.okh .okh-9 button{font:inherit;min-height:56px;border:1px solid transparent;border-radius:10px;color:var(--ap-yazi);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transform:none!important}.okh .okh-9 i{font-style:normal;font-size:18px}.okh .okh-9 b{font-size:17px;font-weight:800;font-variant-numeric:tabular-nums}.okh .okh-9 button[aria-pressed=true]{border-color:#fff}
.okh h4{margin:0 0 6px;font-size:13px;font-weight:800;color:var(--ap-yazi)}
.okh .okh-dag{display:flex;gap:4px;align-items:flex-end}.okh .okh-dag button{flex:1 1 0;min-width:0;height:108px;font:inherit;background:none;border:0;border-radius:6px;padding:0;color:var(--ap-yazi);cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;transform:none!important}.okh .okh-dag i{display:block;width:100%;max-width:24px;min-height:2px;border-radius:4px 4px 0 0;background:var(--ap-vurgu)}.okh .okh-dag b{font-size:11px;font-weight:700}.okh .okh-dag small{font-size:12px;font-weight:700;color:var(--ap-soluk)}.okh .okh-dag button[aria-pressed=true]{background:var(--ap-kart2)}.okh .okh-dag button[aria-pressed=true] small{color:#f0c860}
.okh .okh-bas{margin:20px 0 10px;font-size:clamp(21px,5.6vw,26px);font-weight:900;line-height:1.2;color:var(--ap-yazi)}
.okh .okh-h{border:1px solid var(--ap-cizgi);border-radius:14px;background:var(--ap-kart2);padding:14px;margin-bottom:10px;display:grid;gap:9px}.okh .okh-h p{margin:0;font-size:14px;line-height:1.5}
.okh .okh-h-ust{display:flex;gap:12px;align-items:flex-start}.okh .okh-h-ust span{flex:none;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;font-size:19px;font-weight:900;background:rgba(239,100,97,.18);color:#ff8f8c}.okh .okh-h.nis .okh-h-ust span{background:rgba(63,191,127,.16);color:#3fbf7f}
.okh .okh-h-ust h4{margin:0;font-size:clamp(20px,5.4vw,24px);font-weight:900;line-height:1.2;color:var(--ap-yazi);text-wrap:balance}
.okh .okh-h .kanit{color:var(--ap-soluk)}.okh .okh-h .soyle{font-size:16px;font-weight:700;color:#f0c860}
.okh .okh-h summary{cursor:pointer;font-size:13.5px;font-weight:700;min-height:36px;display:list-item;padding:7px 0;color:var(--ap-soluk)}.okh .okh-h details p{margin:6px 0}.okh .okh-h ul{margin:6px 0;padding-left:20px;font-size:14px;line-height:1.5}.okh .okh-h .ap-btn{min-height:44px}
.okh .okh-az{border:1px dashed var(--ap-cizgi);border-radius:12px;padding:14px;display:grid;gap:5px;margin-bottom:14px}.okh .okh-az b{font-size:18px}.okh .okh-az span{font-size:13.5px;line-height:1.5;color:var(--ap-soluk)}.okh .okh-az span b{font-size:inherit;color:var(--ap-yazi)}`;
        document.head.appendChild(st);
    }
})();
