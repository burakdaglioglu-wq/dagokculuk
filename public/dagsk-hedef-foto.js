/**
 * DAĞ SPOR KULÜBÜ — 📷 HEDEF HARİTASI · Fotoğrafla puanla (v354)
 * Kullanıcı bir okçuluk uygulamasının "fotoğraftan otomatik puan" videosunu gösterip "böyle bir şey yapabilir miyiz" dedi;
 * 4 taslaktan A · Skorbord (siyah zemin, kehribar LED rakamlar) seçildi.
 *
 * Akış (Skor Gir › 📷 Fotoğrafla puanla → hfAc):
 *  ① Kamera: canlı görüntüde sarı + kırmızı halkadan spotlar bulunur ("3/3 SPOT BULUNDU") → çek. Kamera yoksa/izin
 *     verilmezse telefonun kendi kamerası (input capture) ya da galeri. Spot bulunamazsa elle: merkez + dış kenar.
 *  ② Düzelt: her spot fotoğraftan kesilip düzleştirilir (elips → daire, hfDuzle). Gerçek fotoğraf üstünde oka dokun = koy,
 *     sürükle = taşı, kısa dokun = sil; sürüklerken büyüteç + canlı puan. Önceki serinin fotoğrafı varsa fark alınır ve
 *     yeni oklar ÖNERİLİR (turuncu kesikli) — ilk fotoğrafta öneri yok. "SERİYE YAZ" → anlikAtilanOklar + skorKaydet()
 *     (Skor Gir'in kendi kayıt yolu: limit, klasman, yoklama, KM dönüşü hepsi aynı).
 *  ③ Analiz: detayliOklar (x, y, t) → grup merkezi / grup çapı (HALKA cinsinden — yüz boyu bilinmiyor), seri seri,
 *     nişangâh önerisi, veliye WhatsApp.
 * Koordinatlar Skor Gir hedef SVG'siyle aynı: halka genişliği 10 birim, X yarıçapı 5; 3'lü spot merkezleri y = -140/0/140.
 * Fotoğraf hiçbir yere yüklenmez, yalnız bu ekranın belleğinde durur.
 */
(function () {
    'use strict';
    const SPOT_Y = [-140, 0, 140];
    const AKS = '#FD8E01';
    let _hf = null;

    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tost = (m, t) => { try { showToast(m, t || 'info'); } catch (e) { } };
    function spotSayisi(tip) { return tip === '3spot' ? 3 : 1; }
    function yuzR(tip) { return tip === '10ring' ? 100 : 60; } // görünen yüzün yarıçapı (birim)
    function tipAd(tip) { return tip === '3spot' ? "3'LÜ SPOT" : (tip === '10ring' ? 'TAM HEDEF' : '6 HALKA'); }
    function maksOk() { try { return getMaksOk(); } catch (e) { return 3; } }
    function spotBasina() { return _hf.tip === '3spot' ? Math.ceil(maksOk() / 3) : maksOk(); }
    function makarali() { const sp = hfSp(); return !!(sp && sp.yay === 'Makaralı'); }
    function hfSp() { try { return turnuvaDB[_hf.g] && turnuvaDB[_hf.g][_hf.ad]; } catch (e) { return null; } }
    function puanUV(u, v) { try { return hedefeMesafePuan(Math.hypot(u, v), makarali(), _hf.tip).puan; } catch (e) { return 'M'; } }
    function pDeger(p) { return p === 'X' ? 10 : (p === 'M' || p == null ? 0 : (parseInt(p) || 0)); }
    function bugun() { try { return bugunISO(); } catch (e) { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); } }
    function gunAnahtar(t) { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
    function seriNo() { const sp = hfSp(); let n = 0; try { n = bugunkuSeriSayisi(sp); } catch (e) { n = (sp && sp.seriler || []).length; } return n + 1; }
    function seriLimit() { const el = $('toplam-seri-ayar'); return (el && parseInt(el.value)) || 12; }

    /* ================= renk + spot bulma ================= */
    // 1 sarı · 2 kırmızı · 3 mavi · 0 diğer (ışık sarıyı turuncuya, kırmızıyı pembeye kaydırabilir — aralıklar geniş)
    function renk(r, g, b) {
        const mx = r > g ? (r > b ? r : b) : (g > b ? g : b), mn = r < g ? (r < b ? r : b) : (g < b ? g : b), d = mx - mn;
        if (mx < 55 || d < 0.3 * mx) return 0;
        let h; if (mx === r) h = ((g - b) / d + 6) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60;
        if (h >= 36 && h <= 74 && mx > 95) return 1;
        if (h <= 20 || h >= 328) return 2;
        if (h >= 185 && h <= 250) return 3;
        return 0;
    }
    function momentElips(m) {
        const mx = m.sx / m.n, my = m.sy / m.n, cxx = m.sxx / m.n - mx * mx, cyy = m.syy / m.n - my * my, cxy = m.sxy / m.n - mx * my;
        const tr = cxx + cyy, det = cxx * cyy - cxy * cxy, k = Math.sqrt(Math.max(0, tr * tr / 4 - det));
        const l1 = tr / 2 + k, l2 = Math.max(1e-6, tr / 2 - k);
        return { x: mx, y: my, a: 2 * Math.sqrt(l1), b: 2 * Math.sqrt(l2), th: 0.5 * Math.atan2(2 * cxy, cxx - cyy), n: m.n };
    }
    // Elips (yarıçapı rBirim birime karşılık gelen) → piksel/birim matrisi M (simetrik: kamera dönmesi yokmuş gibi "yukarı" korunur)
    function elipsM(e, rBirim) {
        const c = Math.cos(e.th), s = Math.sin(e.th), A = e.a / rBirim, B = e.b / rBirim;
        return [A * c * c + B * s * s, (A - B) * c * s, (A - B) * c * s, A * s * s + B * c * c]; // [m00, m01, m10, m11]
    }
    function ters(M) { const d = M[0] * M[3] - M[1] * M[2]; return [M[3] / d, -M[1] / d, -M[2] / d, M[0] / d]; }
    function pikselUV(sp, x, y) { const I = sp.Mi, dx = x - sp.x, dy = y - sp.y; return [I[0] * dx + I[1] * dy, I[2] * dx + I[3] * dy]; }
    function uvPiksel(sp, u, v) { const M = sp.M; return [sp.x + M[0] * u + M[1] * v, sp.y + M[2] * u + M[3] * v]; }

    // img: ImageData. n: beklenen spot sayısı. Dönüş: piksel koordinatında spotlar [{x,y,M,Mi}] (yukarıdan aşağı, soldan sağa)
    function spotBul(img, n) {
        const w = img.width, h = img.height, d = img.data, N = w * h, k = new Uint8Array(N);
        for (let i = 0, j = 0; i < N; i++, j += 4) k[i] = renk(d[j], d[j + 1], d[j + 2]);
        const lab = new Int32Array(N).fill(-1), q = new Int32Array(N); let comps = [];
        for (let i = 0; i < N; i++) {
            if (k[i] !== 1 || lab[i] >= 0) continue;
            const id = comps.length, m = { n: 0, sx: 0, sy: 0, sxx: 0, syy: 0, sxy: 0 }; let qh = 0, qt = 0; q[qt++] = i; lab[i] = id;
            while (qh < qt) {
                const p = q[qh++], x = p % w, y = (p / w) | 0;
                m.n++; m.sx += x; m.sy += y; m.sxx += x * x; m.syy += y * y; m.sxy += x * y;
                if (x > 0 && k[p - 1] === 1 && lab[p - 1] < 0) { lab[p - 1] = id; q[qt++] = p - 1; }
                if (x < w - 1 && k[p + 1] === 1 && lab[p + 1] < 0) { lab[p + 1] = id; q[qt++] = p + 1; }
                if (y > 0 && k[p - w] === 1 && lab[p - w] < 0) { lab[p - w] = id; q[qt++] = p - w; }
                if (y < h - 1 && k[p + w] === 1 && lab[p + w] < 0) { lab[p + w] = id; q[qt++] = p + w; }
            }
            if (m.n >= 12) comps.push(m);
        }
        // ok gövdesi sarıyı ikiye bölebilir → merkezleri birbirinin içinde kalan parçaları birleştir
        let es = comps.map((m) => ({ m, e: momentElips(m) }));
        for (let i = 0; i < es.length; i++) for (let j = i + 1; j < es.length; j++) {
            const A = es[i], B = es[j]; if (!A || !B) continue;
            if (Math.hypot(A.e.x - B.e.x, A.e.y - B.e.y) < Math.max(A.e.a, B.e.a) * 1.15) {
                ['n', 'sx', 'sy', 'sxx', 'syy', 'sxy'].forEach((f) => { A.m[f] += B.m[f]; }); A.e = momentElips(A.m); es[j] = null;
            }
        }
        es = es.filter(Boolean).filter((o) => o.m.n >= N * 0.0006 && o.e.b > 3 && o.e.a / o.e.b < 2.6 && o.m.n / (Math.PI * o.e.a * o.e.b) > 0.55);
        const sonuc = [];
        es.forEach((o) => {
            // doğrulama: sarının 1,5 katı uzaklıkta halka kırmızı olmalı (sarı tüy/raptiye gibi şeyler elenir)
            const M1 = elipsM(o.e, 1); let kirmizi = 0, olcu = 0;
            for (let t = 0; t < 16; t++) {
                const a = t * Math.PI / 8, x = Math.round(o.e.x + (M1[0] * Math.cos(a) + M1[1] * Math.sin(a)) * 1.5), y = Math.round(o.e.y + (M1[2] * Math.cos(a) + M1[3] * Math.sin(a)) * 1.5);
                if (x < 0 || y < 0 || x >= w || y >= h) continue; olcu++; if (k[y * w + x] === 2) kirmizi++;
            }
            if (olcu < 8 || kirmizi < olcu * 0.45) return;
            // incelt: sarı ∪ kırmızı (yarıçap 40 birim) → daha büyük, daha kararlı elips
            const Mi1 = ters(M1), R = Math.ceil(Math.max(o.e.a, o.e.b) * 2.4), m = { n: 0, sx: 0, sy: 0, sxx: 0, syy: 0, sxy: 0 };
            for (let y = Math.max(0, Math.floor(o.e.y - R)); y < Math.min(h, o.e.y + R); y++) for (let x = Math.max(0, Math.floor(o.e.x - R)); x < Math.min(w, o.e.x + R); x++) {
                const c = k[y * w + x]; if (c !== 1 && c !== 2) continue;
                const dx = x - o.e.x, dy = y - o.e.y, u = Mi1[0] * dx + Mi1[1] * dy, v = Mi1[2] * dx + Mi1[3] * dy;
                if (u * u + v * v > 2.3 * 2.3) continue;
                m.n++; m.sx += x; m.sy += y; m.sxx += x * x; m.syy += y * y; m.sxy += x * y;
            }
            const e2 = m.n > o.m.n * 1.8 ? momentElips(m) : null;
            const e = e2 && e2.a / e2.b < 2.6 ? e2 : o.e, rB = e2 && e === e2 ? 40 : 20;
            const M = elipsM(e, rB); sonuc.push({ x: e.x, y: e.y, M, Mi: ters(M), alan: m.n, r: e.a / rB });
        });
        sonuc.sort((a, b) => b.alan - a.alan);
        let sec = sonuc.slice(0, n);
        if (sec.length) { const enb = sec[0].r; sec = sec.filter((s) => s.r > enb * 0.55); }
        // aynı spotu iki kez sayma
        sec = sec.filter((s, i) => !sec.slice(0, i).some((t) => Math.hypot(s.x - t.x, s.y - t.y) < t.r * 50));
        const ortR = sec.length ? sec.reduce((t, s) => t + s.r, 0) / sec.length : 1;
        sec.sort((a, b) => (Math.abs(a.y - b.y) > ortR * 25 ? a.y - b.y : a.x - b.x));
        return sec;
    }
    function olcekle(sp, f) { const M = sp.M.map((v) => v * f); return { x: sp.x * f, y: sp.y * f, M, Mi: ters(M), r: sp.r * f, elle: sp.elle }; }

    /* ================= düzleştirme ================= */
    // Spotu S×S kanvasa düzleştir: kanvas merkezi = spot merkezi, kenar = ±(yuzR+8) birim
    function hfDuzle(sp, S) {
        const cv = document.createElement('canvas'); cv.width = cv.height = S;
        const ctx = cv.getContext('2d'), R = yuzR(_hf.tip) + 8, kk = S / (2 * R), I = sp.Mi;
        ctx.fillStyle = '#111'; ctx.fillRect(0, 0, S, S);
        ctx.setTransform(kk * I[0], kk * I[2], kk * I[1], kk * I[3], S / 2 - kk * (I[0] * sp.x + I[1] * sp.y), S / 2 - kk * (I[2] * sp.x + I[3] * sp.y));
        ctx.imageSmoothingQuality = 'high'; ctx.drawImage(_hf.foto, 0, 0); ctx.setTransform(1, 0, 0, 1, 0, 0);
        return cv;
    }
    const GRI_S = 120;
    function griAl(cv) {
        const t = document.createElement('canvas'); t.width = t.height = GRI_S; const c = t.getContext('2d'); c.drawImage(cv, 0, 0, GRI_S, GRI_S);
        const d = c.getImageData(0, 0, GRI_S, GRI_S).data, g = new Float32Array(GRI_S * GRI_S); let top = 0;
        for (let i = 0; i < g.length; i++) { g[i] = d[i * 4] * 0.3 + d[i * 4 + 1] * 0.59 + d[i * 4 + 2] * 0.11; top += g[i]; }
        const ort = top / g.length || 1; for (let i = 0; i < g.length; i++) g[i] /= ort;
        // 3×3 bulanıklaştır (titreşim/çözünürlük farkı)
        const b = new Float32Array(g.length);
        for (let y = 1; y < GRI_S - 1; y++) for (let x = 1; x < GRI_S - 1; x++) { let s = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) s += g[(y + j) * GRI_S + x + i]; b[y * GRI_S + x] = s / 9; }
        return b;
    }
    // Önceki serinin fotoğrafıyla fark → yeni ok önerileri (spot birimiyle). Eski okların çekildiği yerler (önceki seride
    // onaylanan noktalara değen farklar) elenir. Hizalama kayması (halka çizgileri) için önceki görüntü ±2 piksel
    // toleransla karşılaştırılır: piksel, önceki görüntünün 5×5 komşuluğundaki en açık/en koyu aralığın dışındaysa fark sayılır.
    // (Halka çizgisini maskelemek ok gövdesi halkaya paralel gidince deliği siliyordu.)
    function oneriBul(s, gri) {
        const on = _hf.onceki && _hf.onceki[s]; if (!on) return [];
        const R = yuzR(_hf.tip) + 8, bp = (2 * R) / GRI_S, yR = yuzR(_hf.tip), N = GRI_S * GRI_S, mask = new Uint8Array(N), P = on.gri;
        for (let y = 2; y < GRI_S - 2; y++) for (let x = 2; x < GRI_S - 2; x++) {
            const u = (x + 0.5) * bp - R, v = (y + 0.5) * bp - R; if (Math.hypot(u, v) > yR - 1) continue;
            let mn = 1e9, mx = -1e9; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const q = P[(y + j) * GRI_S + x + i]; if (q < mn) mn = q; if (q > mx) mx = q; }
            const c = gri[y * GRI_S + x]; if (c < mn - 0.2 || c > mx + 0.2) mask[y * GRI_S + x] = 1;
        }
        const lab = new Int32Array(N).fill(-1), q = new Int32Array(N), adaylar = [];
        for (let i = 0; i < N; i++) {
            if (!mask[i] || lab[i] >= 0) continue; let qh = 0, qt = 0; q[qt++] = i; lab[i] = i; const pix = [];
            // 3 piksel komşuluk: halka çizgisi maskesi ok gövdesini bölmesin (bölünürse dış parça "giriş" sanılıyordu)
            while (qh < qt) { const p = q[qh++]; pix.push(p); const x = p % GRI_S, y = (p / GRI_S) | 0;
                for (let j = -3; j <= 3; j++) for (let ii = -3; ii <= 3; ii++) { const xx = x + ii, yy = y + j; if (xx < 0 || yy < 0 || xx >= GRI_S || yy >= GRI_S) continue; const pp = yy * GRI_S + xx; if (mask[pp] && lab[pp] < 0) { lab[pp] = i; q[qt++] = pp; } } }
            if (pix.length < 5) continue;
            const uv = pix.map((p) => [((p % GRI_S) + 0.5) * bp - R, (((p / GRI_S) | 0) + 0.5) * bp - R]);
            // ana eksen (PCA) → iki uç; uzunsa ok gövdesi, kısaysa yalnız delik
            const mu = uv.reduce((t, a) => t + a[0], 0) / uv.length, mv = uv.reduce((t, a) => t + a[1], 0) / uv.length;
            let cuu = 0, cvv = 0, cuv = 0; uv.forEach((a) => { const du = a[0] - mu, dv = a[1] - mv; cuu += du * du; cvv += dv * dv; cuv += du * dv; });
            const th = 0.5 * Math.atan2(2 * cuv, cuu - cvv), ex = [Math.cos(th), Math.sin(th)];
            let lo = 1e9, hi = -1e9, aLo = null, aHi = null; uv.forEach((a) => { const t = (a[0] - mu) * ex[0] + (a[1] - mv) * ex[1]; if (t < lo) { lo = t; aLo = a; } if (t > hi) { hi = t; aHi = a; } });
            adaylar.push({ s, uv, boy: pix.length, mu, mv, ex, uzun: hi - lo > 9, a: aLo, b: aHi });
        }
        return adaylar;
    }
    // Bütün spotların adayları birlikte: kamera hedefe karşıdan bakmıyorsa bütün ok gövdeleri fotoğrafta AYNI yöne uzanır →
    // gövde yönleri hizalanır, ortak işaret "kuyruk ucu merkezden daha uzak" toplamıyla seçilir; giriş = öteki uç.
    // (Yalnız "merkeze en yakın uç" kuralı, gövde merkeze doğru eğik gidince gövdenin ortasını seçiyordu.)
    function oneriler() {
        const hepsi = []; _hf.spotlar.forEach((x, s) => { oneriBul(s, _hf.gri[s]).forEach((a) => hepsi.push(a)); });
        const uzun = hepsi.filter((a) => a.uzun);
        let ref = null, oy = 0;
        uzun.forEach((a) => {
            if (!ref) ref = a.ex; else if (a.ex[0] * ref[0] + a.ex[1] * ref[1] < 0) { a.ex = [-a.ex[0], -a.ex[1]]; const t = a.a; a.a = a.b; a.b = t; }
            oy += Math.hypot(a.b[0], a.b[1]) - Math.hypot(a.a[0], a.a[1]); // + ise b (ex yönü) kuyruk
        });
        const sonuc = {};
        hepsi.forEach((a) => {
            const uc = !a.uzun ? [a.mu, a.mv] : (oy >= 0 ? a.a : a.b);
            const yakin = a.uv.filter((p) => Math.hypot(p[0] - uc[0], p[1] - uc[1]) < 5);
            const e = { u: yakin.reduce((t, p) => t + p[0], 0) / yakin.length, v: yakin.reduce((t, p) => t + p[1], 0) / yakin.length, boy: a.boy };
            const on = _hf.onceki[a.s];
            if (on.oklar.some((o) => Math.hypot(e.u - o.u, e.v - o.v) < 6 || Math.hypot(a.mu - o.u, a.mv - o.v) < 4)) return; // çekilen eski ok (ucu eski noktada)
            (sonuc[a.s] = sonuc[a.s] || []).push(e);
        });
        Object.keys(sonuc).forEach((s) => { sonuc[s].sort((a, b) => b.boy - a.boy); sonuc[s] = sonuc[s].slice(0, spotBasina()); });
        return sonuc;
    }

    /* ================= ekran iskeleti ================= */
    function hfCss() {
        if ($('hf-css')) return;
        const st = document.createElement('style'); st.id = 'hf-css';
        st.textContent = `
#hf{position:fixed;inset:0;z-index:100001;background:#060606;color:#f4e6d0;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:"Segoe UI",system-ui,sans-serif}
#hf *{box-sizing:border-box}
#hf .hf-ic{max-width:520px;margin:0 auto;padding:0 0 28px;min-height:100%;display:flex;flex-direction:column}
#hf .mono,#hf .hf-ust b,#hf .hf-btn,#hf .hf-etk,#hf .hf-lbl,#hf .hf-n{font-family:Consolas,"Courier New",monospace}
#hf .hf-ust{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:8px;padding:12px 14px;background:#060606;border-bottom:1px solid #1d1d1d}
#hf .hf-ust b{flex:1;font-size:15px;font-weight:800;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#hf .hf-geri{background:none;border:1px solid #333;color:#ddd;width:36px;height:36px;border-radius:6px;font-size:18px;cursor:pointer;flex:none}
#hf .hf-etk{font-size:11px;font-weight:900;padding:5px 8px;border-radius:3px;background:${AKS};color:#120800;border:none;cursor:pointer;white-space:nowrap;flex:none}
#hf .hf-etk.koyu{background:#1a1a1a;color:${AKS};border:1px solid #3a2a12}
#hf .hf-kart{margin:10px 14px 0;padding:12px;background:#0f0f0f;border:1px solid #2c2c2c;border-radius:6px}
#hf .hf-lbl{font-size:11px;font-weight:800;letter-spacing:.6px;color:#bfae95;margin-bottom:6px;text-transform:uppercase}
#hf .hf-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px;border:none;border-radius:6px;background:${AKS};color:#120800;font-weight:900;font-size:16px;letter-spacing:.5px;cursor:pointer}
#hf .hf-btn2{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:12px;border-radius:6px;background:none;border:1px solid #444;color:#ddd;font-weight:700;font-size:14px;cursor:pointer}
#hf .hf-btn:disabled{opacity:.45}
#hf .hf-sat{display:flex;gap:8px}
#hf .hf-muted{font-size:12.5px;color:#a8998a;line-height:1.45}
#hf .hf-vizor{position:relative;margin:10px 14px 0;background:#000;border:1px solid #2c2c2c;border-radius:6px;overflow:hidden;aspect-ratio:3/4;max-height:62vh}
#hf .hf-vizor video,#hf .hf-vizor canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
#hf .hf-ipucu{position:absolute;left:10px;right:10px;bottom:10px;padding:9px 11px;font:800 13px Consolas,monospace;border-radius:4px;background:rgba(0,0,0,.8);color:${AKS};border:1px solid ${AKS}}
#hf .hf-ipucu.tamam{color:#4ade80;border-color:#4ade80}
#hf .hf-deklansor{width:76px;height:76px;border-radius:50%;margin:16px auto 6px;border:5px solid #fff;background:none;display:flex;align-items:center;justify-content:center;cursor:pointer}
#hf .hf-deklansor i{width:56px;height:56px;border-radius:50%;background:${AKS};display:block}
#hf .hf-deklansor:disabled{opacity:.4}
#hf .hf-ikili{display:grid;grid-template-columns:1.2fr 1fr;gap:10px;align-items:start}
#hf .hf-spotlar{display:grid;gap:8px}
#hf .hf-spot{position:relative;background:#121212;border:1px solid #2c2c2c;border-radius:4px;padding:5px;text-align:center;cursor:pointer}
#hf .hf-spot canvas{width:100%;display:block;border-radius:3px}
#hf .hf-spot small{position:absolute;left:8px;top:6px;font:900 11px Consolas,monospace;color:#fff;text-shadow:0 0 3px #000}
#hf .hf-spot .hf-sp-p{display:flex;justify-content:center;gap:4px;margin-top:5px;min-height:24px;flex-wrap:wrap}
#hf .hf-chip{min-width:30px;padding:3px 6px;border-radius:3px;font:900 15px Consolas,monospace;text-align:center}
#hf .hf-chip.oneri{outline:2px dashed ${AKS};outline-offset:1px}
#hf .hf-toplam{display:flex;align-items:center;justify-content:space-between;gap:8px}
#hf .hf-n{font-size:40px;font-weight:900;line-height:1;color:${AKS};text-shadow:0 0 12px rgba(253,142,1,.55)}
#hf .hf-istat{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#hf .hf-istat div{padding:10px;background:#121212;border:1px solid #2a2a2a;border-radius:4px}
#hf .hf-istat b{display:block;font:900 19px Consolas,monospace;color:${AKS};margin:2px 0}
#hf .hf-istat span{font-size:12px;color:#a8998a}
#hf .yesil{color:#4ade80 !important;font-weight:800}#hf .kirmizi{color:#f87171 !important;font-weight:800}
#hf .hf-cubuk{display:flex;align-items:flex-end;gap:4px;height:70px}
#hf .hf-cubuk span{flex:1;background:${AKS};border-radius:1px;position:relative;min-height:3px}
#hf .hf-cubuk span i{position:absolute;top:-15px;left:0;right:0;text-align:center;font:800 10px Consolas,monospace;color:#d9c7ad;font-style:normal}
#hf-buyuk{position:fixed;inset:0;z-index:100002;background:rgba(0,0,0,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px;gap:10px}
#hf-buyuk canvas{width:min(96vw,74vh,620px);height:min(96vw,74vh,620px);touch-action:none;border-radius:6px;border:2px solid ${AKS}}
#hf-buyuk .hf-b-ust{width:min(96vw,620px);display:flex;align-items:center;gap:8px;color:#f4e6d0;font:800 14px Consolas,monospace}
#hf-buyuk .hf-b-ust b{flex:1}
#hf-lup{position:fixed;z-index:100003;width:140px;height:140px;border-radius:50%;border:4px solid #fff;overflow:hidden;pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,.6)}
#hf-lup b{position:absolute;right:6px;bottom:6px;min-width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:#111;color:#fff;border:2px solid #fff;font:900 15px Consolas,monospace}
#hf .hf-elle{position:relative;margin:10px 14px 0;border:1px solid ${AKS};border-radius:6px;overflow:hidden}
#hf .hf-elle canvas{width:100%;display:block;touch-action:manipulation}
`;
        document.head.appendChild(st);
    }
    function kabuk(baslik, sag, govde) {
        let el = $('hf'); if (!el) { el = document.createElement('div'); el.id = 'hf'; document.body.appendChild(el); }
        el.innerHTML = `<div class="hf-ic"><div class="hf-ust"><button class="hf-geri" onclick="hfGeri()" aria-label="Geri">‹</button><b>${baslik}</b>${sag || ''}</div>${govde}</div>`;
        return el;
    }
    function ustBaslik() { return `<span class="mono">SERİ ${seriNo()}/${seriLimit()}</span> · ${esc(_hf.ad)}`; }
    function chipRenk(p) { let r = { bg: '#333', c: '#fff' }; try { r = getRenkForPuan(p); } catch (e) { } return `background:${r.bg === 'transparent' ? '#2a2a2a' : r.bg};color:${r.c && r.c.indexOf('var(') === 0 ? '#ccc' : r.c}`; }

    /* ================= ① kamera ================= */
    window.hfAc = function () {
        if (typeof secilenSporcu === 'undefined' || !secilenSporcu) return tost('Önce sporcuyu seç.', 'warning');
        hfCss();
        _hf = { ad: secilenSporcu, g: aktifGrup, tip: aktifHedefTipi || '6ring', km: window._kmSkorAktif ? Object.assign({}, window._kmSkorAktif) : null, oklar: [], gecmis: [], onceki: {}, foto: null, spotlar: [] };
        hfKamera();
    };
    function kameraDurdur() {
        if (!_hf) return; if (_hf.zm) { clearInterval(_hf.zm); _hf.zm = null; }
        if (_hf.stream) { try { _hf.stream.getTracks().forEach((t) => t.stop()); } catch (e) { } _hf.stream = null; }
    }
    function hfKamera() {
        _hf.akis = 'kamera'; _hf.oklar = []; _hf.gecmis = []; _hf.spotlar = []; _hf.mSay = 0;
        const n = spotSayisi(_hf.tip);
        kabuk(ustBaslik(), `<span class="hf-etk">${tipAd(_hf.tip)}</span>`, `
<div class="hf-vizor" id="hf-vizor"><video id="hf-video" playsinline muted autoplay></video><canvas id="hf-ortu"></canvas>
  <div class="hf-ipucu" id="hf-ipucu">KAMERA AÇILIYOR…</div></div>
<div class="hf-kart"><div class="hf-muted">💡 Okları <b>çekmeden önce</b> fotoğrafla. Bir adım geri çık, ${n > 1 ? 'üç spot da' : 'hedef'} çerçeveye girsin, mümkün olduğunca karşıdan çek. Önceki serinin fotoğrafı varsa yeni oklar kendiliğinden önerilir.</div></div>
<button class="hf-deklansor" id="hf-cek" onclick="hfCek()" disabled aria-label="Fotoğraf çek"><i></i></button>
<div class="hf-sat" style="margin:6px 14px 0">
  <label class="hf-btn2" style="flex:1">📷 Telefon kamerası<input type="file" accept="image/*" capture="environment" style="display:none" onchange="hfDosya(event)"></label>
  <label class="hf-btn2" style="flex:1">🖼️ Galeriden<input type="file" accept="image/*" style="display:none" onchange="hfDosya(event)"></label>
</div>
<div style="margin:8px 14px 0"><button class="hf-btn2" onclick="hfAnaliz()">📊 Grup analizi</button></div>`);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { ipucu('CANLI KAMERA YOK — "Telefon kamerası" ile çek', false); return; }
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false }).then((st) => {
            if (!_hf || _hf.akis !== 'kamera') { st.getTracks().forEach((t) => t.stop()); return; }
            _hf.stream = st; const v = $('hf-video'); v.srcObject = st; v.play().catch(() => { });
            $('hf-cek').disabled = false; ipucu('HEDEFİ ÇERÇEVEYE AL', false);
            _hf.zm = setInterval(canliTara, 450);
        }).catch(() => ipucu('KAMERA İZNİ YOK — "Telefon kamerası" ile çek', false));
    }
    function ipucu(t, tamam) { const el = $('hf-ipucu'); if (el) { el.textContent = (tamam ? '✓ ' : '') + t; el.classList.toggle('tamam', !!tamam); } }
    function canliTara() {
        const v = $('hf-video'), o = $('hf-ortu'); if (!v || !o || !v.videoWidth) return;
        const W = 320, H = Math.round(W * v.videoHeight / v.videoWidth);
        const c = canliTara.cv || (canliTara.cv = document.createElement('canvas')); c.width = W; c.height = H;
        const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(v, 0, 0, W, H);
        const n = spotSayisi(_hf.tip), sp = spotBul(x.getImageData(0, 0, W, H), n);
        // örtü: video "contain" ile kutuya oturuyor → aynı yerleşimi hesapla
        const r = o.getBoundingClientRect(); o.width = r.width; o.height = r.height;
        const f = Math.min(r.width / W, r.height / H), ox = (r.width - W * f) / 2, oy = (r.height - H * f) / 2, g = o.getContext('2d');
        g.clearRect(0, 0, o.width, o.height); g.lineWidth = 3; g.strokeStyle = AKS; g.fillStyle = AKS; g.font = '900 15px Consolas,monospace';
        sp.forEach((s, i) => {
            g.beginPath();
            for (let t = 0; t <= 40; t++) { const a = t / 40 * Math.PI * 2, p = uvPiksel(s, Math.cos(a) * yuzR(_hf.tip), Math.sin(a) * yuzR(_hf.tip)); t ? g.lineTo(ox + p[0] * f, oy + p[1] * f) : g.moveTo(ox + p[0] * f, oy + p[1] * f); }
            g.stroke(); if (n > 1) { const p = uvPiksel(s, yuzR(_hf.tip) * 0.8, -yuzR(_hf.tip) * 0.8); g.fillText(String(i + 1), ox + p[0] * f, oy + p[1] * f); }
        });
        if (sp.length >= n) ipucu(n > 1 ? `${sp.length}/${n} SPOT BULUNDU — ÇEKEBİLİRSİN` : 'HEDEF BULUNDU — ÇEKEBİLİRSİN', true);
        else ipucu(n > 1 ? `${sp.length}/${n} SPOT — BİR ADIM GERİ ÇIK` : 'HEDEF ARANIYOR — SARI ORTA GÖRÜNSÜN', false);
    }
    window.hfCek = function () {
        const v = $('hf-video'); if (!v || !v.videoWidth) return;
        const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d').drawImage(v, 0, 0);
        try { sesCal(1200, 0.06); } catch (e) { }
        kameraDurdur(); fotoIsle(c);
    };
    window.hfDosya = function (ev) {
        const f = ev.target.files && ev.target.files[0]; ev.target.value = ''; if (!f) return;
        const url = URL.createObjectURL(f), img = new Image();
        img.onload = function () {
            const k = Math.min(1, 2400 / Math.max(img.width, img.height)), c = document.createElement('canvas');
            c.width = Math.round(img.width * k); c.height = Math.round(img.height * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            URL.revokeObjectURL(url); kameraDurdur(); fotoIsle(c);
        };
        img.onerror = function () { URL.revokeObjectURL(url); tost('Fotoğraf açılamadı.', 'error'); };
        img.src = url;
    };
    function fotoIsle(c) {
        _hf.foto = c;
        const W = Math.min(900, c.width), f = c.width / W, H = Math.round(c.height / f), t = document.createElement('canvas'); t.width = W; t.height = H;
        const x = t.getContext('2d', { willReadFrequently: true }); x.drawImage(c, 0, 0, W, H);
        const n = spotSayisi(_hf.tip), sp = spotBul(x.getImageData(0, 0, W, H), n).map((s) => olcekle(s, f));
        if (sp.length < n) { _hf.spotlar = sp; return hfElleBasla(sp.length ? 'Bazı spotlar bulunamadı.' : 'Hedef otomatik bulunamadı.'); }
        _hf.spotlar = sp; duzeltHazirla();
    }

    /* ---- elle işaretleme (otomatik bulunamazsa ya da yanlışsa) ---- */
    window.hfElleBasla = hfElleBasla;
    function hfElleBasla(neden) {
        _hf.akis = 'elle'; _hf.elle = { spotlar: [], adim: 0, merkez: null };
        const n = spotSayisi(_hf.tip);
        kabuk(ustBaslik(), `<span class="hf-etk koyu" onclick="hfKamera()">↺ Yeniden çek</span>`, `
<div class="hf-kart"><div class="hf-muted">${neden ? '⚠️ ' + esc(neden) + ' ' : ''}Elle işaretle: <b id="hf-elle-yaz"></b></div></div>
<div class="hf-elle"><canvas id="hf-elle-cv" onclick="hfElleTik(event)"></canvas></div>
<div style="margin:10px 14px 0" class="hf-sat"><button class="hf-btn2" onclick="hfElleBasla()">↶ Baştan</button></div>`);
        elleCiz();
        void n;
    }
    function elleYazi() {
        const n = spotSayisi(_hf.tip), e = _hf.elle, no = e.spotlar.length + 1, dis = _hf.tip === '10ring' ? 'BEYAZIN dış kenarına' : 'MAVİNİN dış kenarına';
        return (n > 1 ? `Spot ${no}/${n} (yukarıdan aşağı) — ` : '') + (e.merkez ? dis + ' dokun' : 'sarının tam ORTASINA dokun');
    }
    function elleCiz() {
        const cv = $('hf-elle-cv'); if (!cv || !_hf.foto) return;
        const W = Math.min(1100, _hf.foto.width), k = W / _hf.foto.width; cv.width = W; cv.height = Math.round(_hf.foto.height * k);
        const g = cv.getContext('2d'); g.drawImage(_hf.foto, 0, 0, cv.width, cv.height); g.lineWidth = 3; g.strokeStyle = AKS;
        _hf.elle.spotlar.forEach((s) => { g.beginPath(); g.arc(s.x * k, s.y * k, s.M[0] * yuzR(_hf.tip) * k, 0, Math.PI * 2); g.stroke(); });
        if (_hf.elle.merkez) { const m = _hf.elle.merkez; g.beginPath(); g.moveTo(m.x * k - 14, m.y * k); g.lineTo(m.x * k + 14, m.y * k); g.moveTo(m.x * k, m.y * k - 14); g.lineTo(m.x * k, m.y * k + 14); g.stroke(); }
        const y = $('hf-elle-yaz'); if (y) y.textContent = elleYazi();
    }
    window.hfElleTik = function (ev) {
        const cv = $('hf-elle-cv'), r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * _hf.foto.width, y = (ev.clientY - r.top) / r.height * _hf.foto.height, e = _hf.elle;
        if (!e.merkez) { e.merkez = { x, y }; return elleCiz(); }
        const rp = Math.hypot(x - e.merkez.x, y - e.merkez.y); if (rp < 8) return;
        const s = rp / yuzR(_hf.tip), M = [s, 0, 0, s]; e.spotlar.push({ x: e.merkez.x, y: e.merkez.y, M, Mi: ters(M), r: s, elle: 1 }); e.merkez = null;
        if (e.spotlar.length >= spotSayisi(_hf.tip)) { _hf.spotlar = e.spotlar; return duzeltHazirla(); }
        elleCiz();
    };

    /* ================= ② düzelt ================= */
    function duzeltHazirla() {
        _hf.akis = 'duzelt'; _hf.kucuk = []; _hf.gri = []; _hf.oklar = []; _hf.gecmis = []; _hf.mSay = 0;
        _hf.spotlar.forEach((sp, s) => {
            const cv = hfDuzle(sp, 640); _hf.kucuk[s] = cv; _hf.gri[s] = griAl(cv);
        });
        const onr = oneriler(); Object.keys(onr).forEach((s) => onr[s].forEach((o) => _hf.oklar.push({ s: +s, u: o.u, v: o.v, oneri: true })));
        hfDuzeltCiz();
        const on = _hf.oklar.length;
        if (on) tost(`🎯 ${on} ok önerildi — kontrol et, yanlışsa sürükle.`, 'info');
    }
    function yuzSvg(oklar, boyut, ops) {
        ops = ops || {}; const tip = ops.tip || _hf.tip, R = ops.R || yuzR(tip), s = boyut / 2 / (R + 2); // ops.R: yakınlaştır (analiz)
        const hk = tip === '10ring'
            ? [[100, '#f4f4f0', '#999'], [90, '#f4f4f0', '#999'], [80, '#1a1a1a', '#666'], [70, '#1a1a1a', '#666'], [60, '#2f7fd6', '#1d5aa0'], [50, '#2f7fd6', '#1d5aa0'], [40, '#e23b2e', '#a02317'], [30, '#e23b2e', '#a02317'], [20, '#f5d32a', '#b39a12'], [10, '#f5d32a', '#b39a12'], [5, '#f5d32a', '#b39a12']]
            : [[60, '#2f7fd6', '#1d5aa0'], [50, '#2f7fd6', '#1d5aa0'], [40, '#e23b2e', '#a02317'], [30, '#e23b2e', '#a02317'], [20, '#f5d32a', '#b39a12'], [10, '#f5d32a', '#b39a12'], [5, '#f5d32a', '#b39a12']];
        let g = hk.map(([r, f, c]) => `<circle r="${r * s}" fill="${f}" stroke="${c}" stroke-width=".8"/>`).join('');
        if (ops.elips) { const e = ops.elips; g += `<circle cx="${e.u * s}" cy="${e.v * s}" r="${Math.max(3, e.r * s)}" fill="rgba(253,142,1,.16)" stroke="#fff" stroke-width="2" stroke-dasharray="5 4"/>`; }
        oklar.forEach((o) => {
            if (o.eski) g += `<circle cx="${o.u * s}" cy="${o.v * s}" r="${Math.max(1.6, boyut / 110)}" fill="#111" opacity=".55"/>`;
            else g += `<circle cx="${o.u * s}" cy="${o.v * s}" r="${boyut / 40 + 2.5}" fill="none" stroke="#fff" stroke-width="1.5"/><circle cx="${o.u * s}" cy="${o.v * s}" r="${boyut / 40}" fill="#111"/>`;
        });
        if (ops.elips) { const e = ops.elips, x = e.u * s, y = e.v * s; g += `<g stroke="${AKS}" stroke-width="2.5"><line x1="${x - 9}" y1="${y}" x2="${x + 9}" y2="${y}"/><line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}"/></g>`; }
        return `<svg width="${boyut}" height="${boyut}" viewBox="${-boyut / 2} ${-boyut / 2} ${boyut} ${boyut}" style="display:block;max-width:100%;height:auto">${g}</svg>`;
    }
    // detayliOklar → spot birimine indirilmiş noktalar
    function kayitliNoktalar(filtre) {
        const sp = hfSp(); if (!sp || !Array.isArray(sp.detayliOklar)) return [];
        return sp.detayliOklar.filter((o) => o && o.x != null && o.y != null && (!filtre || filtre(o))).map((o) => {
            const ust = o.tip === '3spot' && o.spot != null ? SPOT_Y[o.spot] || 0 : 0;
            return { u: o.x, v: o.y - ust, p: o.puan, t: o.t || 0, tip: o.tip };
        });
    }
    function grup(noktalar) {
        if (!noktalar.length) return null;
        const u = noktalar.reduce((t, o) => t + o.u, 0) / noktalar.length, v = noktalar.reduce((t, o) => t + o.v, 0) / noktalar.length;
        const r = noktalar.reduce((t, o) => t + Math.hypot(o.u - u, o.v - v), 0) / noktalar.length;
        return { u, v, r, cap: 2 * r };
    }
    function yonYazi(u, v) {
        const yat = Math.abs(u) >= 3 ? (u > 0 ? 'sağ' : 'sol') : '', dik = Math.abs(v) >= 3 ? (v > 0 ? 'alt' : 'üst') : '';
        if (!yat && !dik) return { ok: '•', yazi: 'ortada' };
        const ok = { 'sağ-üst': '↗', 'sağ-alt': '↘', 'sol-üst': '↖', 'sol-alt': '↙', 'sağ': '→', 'sol': '←', 'üst': '↑', 'alt': '↓' }[[yat, dik].filter(Boolean).join('-')];
        return { ok, yazi: [yat, dik].filter(Boolean).join('-') };
    }
    const halka = (b) => (b / 10).toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });

    function hfDuzeltCiz() {
        const n = spotSayisi(_hf.tip), oklar = _hf.oklar.map((o) => Object.assign({}, o, { p: puanUV(o.u, o.v) }));
        const bugunN = kayitliNoktalar((o) => o.t && gunAnahtar(o.t) === bugun()).map((o) => ({ u: o.u, v: o.v, eski: true }));
        const hepsi = bugunN.concat(oklar.map((o) => ({ u: o.u, v: o.v })));
        const gr = hepsi.length >= 3 ? grup(hepsi) : null, yon = gr ? yonYazi(gr.u, gr.v) : null;
        const M = _hf.oklar.filter((o) => o.M).length, toplam = oklar.reduce((t, o) => t + pDeger(o.p), 0);
        const eksik = maksOk() - _hf.oklar.length - (_hf.mSay || 0);
        const spotHTML = _hf.spotlar.map((sp, s) => {
            const sp_o = oklar.filter((o) => o.s === s);
            return `<div class="hf-spot" onclick="hfBuyukAc(${s})">${n > 1 ? `<small>${s + 1}</small>` : ''}<canvas id="hf-k-${s}" width="300" height="300"></canvas>
<div class="hf-sp-p">${sp_o.map((o) => `<span class="hf-chip${o.oneri ? ' oneri' : ''}" style="${chipRenk(o.p)}">${o.p}</span>`).join('') || '<span class="hf-muted">dokun, ok koy</span>'}</div></div>`;
        }).join('');
        const tumChip = oklar.map((o) => `<span class="hf-chip${o.oneri ? ' oneri' : ''}" style="${chipRenk(o.p)}">${o.p}</span>`).join('') + Array.from({ length: _hf.mSay || 0 }, () => `<span class="hf-chip" style="${chipRenk('M')}">M</span>`).join('');
        kabuk(ustBaslik(), `<button class="hf-etk" onclick="hfGeriAl()" ${_hf.gecmis.length ? '' : 'disabled style="opacity:.4"'}>↶ GERİ AL</button>`, `
<div class="hf-kart"><div class="hf-ikili">
  <div><div class="hf-lbl">Bu seri</div>${yuzSvg(oklar, 190)}</div>
  <div><div class="hf-lbl">Bugün hepsi</div>${yuzSvg(hepsi.map((o) => o.eski ? o : Object.assign({}, o, { eski: false })), 150)}
   <div class="hf-muted" style="margin-top:6px">Grup merkezi<br><b style="font-size:14px;color:#f4e6d0">${gr ? `${yon.ok} ${yon.yazi}` : '—'}</b></div></div>
</div></div>
<div class="hf-kart"><div class="hf-lbl">${n > 1 ? 'Spotlar — dokun, büyüt, düzelt' : 'Hedef — dokun, büyüt, düzelt'}</div>
  <div class="hf-spotlar" style="grid-template-columns:repeat(${n > 1 ? 3 : 1},1fr)">${spotHTML}</div>
  <div class="hf-muted" style="margin-top:8px">${_hf.oklar.some((o) => o.oneri) ? '🟧 Kesikli çerçeve = önerilen ok, kontrol et. ' : ''}Büyük ekranda: boş yere dokun = ok koy · oku sürükle = taşı · oka kısa dokun = sil. Çizgiye değen üst puanı alır.</div>
</div>
<div class="hf-kart hf-toplam"><div style="display:flex;gap:5px;flex-wrap:wrap">${tumChip || '<span class="hf-muted">Henüz ok yok</span>'}</div><div style="display:flex;align-items:baseline;gap:6px"><span class="hf-muted">Seri</span><span class="hf-n">${toplam}</span></div></div>
<div class="hf-kart" style="border-color:${eksik === 0 ? '#2c2c2c' : '#5a3a10'}"><div class="hf-muted mono" style="font-weight:800;color:${eksik === 0 ? '#4ade80' : AKS}">${eksik === 0 ? `✓ ${maksOk()}/${maksOk()} OK TAMAM` : (eksik > 0 ? `${maksOk() - eksik}/${maksOk()} OK — ${eksik} eksik (hedefi ıskaladıysa M ekle)` : `${-eksik} OK FAZLA — birini sil`)}</div></div>
<div style="margin:12px 14px 0;display:flex;flex-direction:column;gap:8px">
  <button class="hf-btn" onclick="hfSeriyeYaz()" ${eksik === 0 ? '' : 'disabled'}>✓ SERİYE YAZ · SIRADAKİ</button>
  <div class="hf-sat"><button class="hf-btn2" onclick="hfM(1)">＋ M (ıska)</button>${_hf.mSay ? '<button class="hf-btn2" onclick="hfM(-1)">－ M</button>' : ''}<button class="hf-btn2" onclick="hfKamera()">↺ Yeniden çek</button></div>
  <button class="hf-btn2" onclick="hfElleBasla()">✋ Spotları elle işaretle</button>
</div>`);
        void M;
        _hf.spotlar.forEach((sp, s) => spotCiz($('hf-k-' + s), s, 300));
    }
    function spotCiz(cv, s, S) {
        if (!cv) return; const g = cv.getContext('2d'); cv.width = cv.height = S;
        g.drawImage(_hf.kucuk[s], 0, 0, S, S);
        const R = yuzR(_hf.tip) + 8, k = S / (2 * R), c = S / 2;
        g.lineWidth = Math.max(1, S / 400); g.strokeStyle = 'rgba(255,255,255,.55)';
        for (let r = 10; r <= yuzR(_hf.tip); r += 10) { g.beginPath(); g.arc(c, c, r * k, 0, Math.PI * 2); g.stroke(); }
        g.beginPath(); g.arc(c, c, 5 * k, 0, Math.PI * 2); g.stroke();
        _hf.oklar.forEach((o, i) => {
            if (o.s !== s) return; const x = c + o.u * k, y = c + o.v * k, rr = Math.max(4, S / 42), p = puanUV(o.u, o.v);
            g.lineWidth = Math.max(2, S / 160);
            if (o.oneri) { g.setLineDash([S / 70, S / 110]); g.strokeStyle = AKS; g.beginPath(); g.arc(x, y, rr * 1.9, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
            g.fillStyle = 'rgba(0,0,0,.55)'; g.strokeStyle = '#fff'; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); g.stroke();
            g.beginPath(); g.moveTo(x - rr * 0.5, y); g.lineTo(x + rr * 0.5, y); g.moveTo(x, y - rr * 0.5); g.lineTo(x, y + rr * 0.5); g.stroke();
            if (S > 400) { g.font = `900 ${Math.round(S / 26)}px Consolas,monospace`; g.fillStyle = AKS; g.fillText(p, x + rr * 1.5, y - rr * 1.2); }
            void i;
        });
    }
    function kaydetGecmis() { _hf.gecmis.push(JSON.stringify({ o: _hf.oklar, m: _hf.mSay || 0 })); if (_hf.gecmis.length > 40) _hf.gecmis.shift(); }
    window.hfGeriAl = function () { const g = _hf.gecmis.pop(); if (!g) return; const d = JSON.parse(g); _hf.oklar = d.o; _hf.mSay = d.m; hfDuzeltCiz(); };
    window.hfM = function (d) { kaydetGecmis(); _hf.mSay = Math.max(0, (_hf.mSay || 0) + d); hfDuzeltCiz(); };

    /* ---- büyük düzenleyici ---- */
    window.hfBuyukAc = function (s) {
        _hf.buyuk = s; let b = $('hf-buyuk'); if (!b) { b = document.createElement('div'); b.id = 'hf-buyuk'; document.body.appendChild(b); }
        b.innerHTML = `<div class="hf-b-ust"><b>${spotSayisi(_hf.tip) > 1 ? 'SPOT ' + (s + 1) + ' · ' : ''}<span id="hf-b-p"></span></b><button class="hf-etk koyu" onclick="hfBuyukGeriAl()">↶</button><button class="hf-etk" onclick="hfBuyukKapat()">✓ TAMAM</button></div>
<canvas id="hf-b-cv"></canvas><div class="hf-muted" style="color:#a8998a;font-size:12.5px;text-align:center;max-width:620px">Boş yere dokun = ok koy · oku sürükle = taşı · oka kısa dokun = sil</div>`;
        buyukCiz(); buyukBagla($('hf-b-cv'));
    };
    window.hfBuyukGeriAl = function () { const g = _hf.gecmis.pop(); if (!g) return; const d = JSON.parse(g); _hf.oklar = d.o; _hf.mSay = d.m; buyukCiz(); };
    window.hfBuyukKapat = function () { const b = $('hf-buyuk'); if (b) b.remove(); lupKapat(); hfDuzeltCiz(); };
    function buyukCiz() {
        const cv = $('hf-b-cv'); if (!cv) return; const S = 900; spotCiz(cv, _hf.buyuk, S);
        const p = $('hf-b-p'); if (p) p.textContent = _hf.oklar.filter((o) => o.s === _hf.buyuk).map((o) => puanUV(o.u, o.v)).join(' · ') || 'ok yok';
    }
    function cvUV(cv, cx, cy) { const r = cv.getBoundingClientRect(), R = yuzR(_hf.tip) + 8; return [((cx - r.left) / r.width * 2 - 1) * R, ((cy - r.top) / r.height * 2 - 1) * R]; }
    function buyukBagla(cv) {
        let tut = null;
        cv.addEventListener('pointerdown', (e) => {
            e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) { }
            const [u, v] = cvUV(cv, e.clientX, e.clientY), s = _hf.buyuk, rTut = (yuzR(_hf.tip) + 8) / 14;
            let en = -1, ed = 1e9; _hf.oklar.forEach((o, i) => { if (o.s !== s) return; const d = Math.hypot(o.u - u, o.v - v); if (d < ed) { ed = d; en = i; } });
            tut = { id: e.pointerId, x0: e.clientX, y0: e.clientY, i: ed < rTut ? en : -1, tasindi: false, gecmisAlindi: false };
            if (tut.i < 0) lupGoster(cv, e.clientX, e.clientY);
        });
        cv.addEventListener('pointermove', (e) => {
            if (!tut || e.pointerId !== tut.id) return; e.preventDefault();
            if (tut.i >= 0) {
                if (!tut.tasindi && Math.hypot(e.clientX - tut.x0, e.clientY - tut.y0) < 8) return;
                if (!tut.gecmisAlindi) { kaydetGecmis(); tut.gecmisAlindi = true; }
                tut.tasindi = true; const [u, v] = cvUV(cv, e.clientX, e.clientY); Object.assign(_hf.oklar[tut.i], { u, v, oneri: false }); buyukCiz();
            }
            lupGoster(cv, e.clientX, e.clientY);
        });
        const bit = (e, iptal) => {
            if (!tut || e.pointerId !== tut.id) return; const t = tut; tut = null; lupKapat(); if (iptal) return;
            const r = cv.getBoundingClientRect(), icerde = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
            if (t.i >= 0) { if (!t.tasindi) { kaydetGecmis(); _hf.oklar.splice(t.i, 1); } else if (!icerde) { _hf.oklar.splice(t.i, 1); } buyukCiz(); return; }
            if (!icerde) return;
            const [u, v] = cvUV(cv, e.clientX, e.clientY); kaydetGecmis(); _hf.oklar.push({ s: _hf.buyuk, u, v }); buyukCiz();
            try { sesCal(880, 0.05); } catch (er) { }
        };
        cv.addEventListener('pointerup', (e) => bit(e, false)); cv.addEventListener('pointercancel', (e) => bit(e, true));
    }
    function lupGoster(cv, cx, cy) {
        let l = $('hf-lup'); if (!l) { l = document.createElement('div'); l.id = 'hf-lup'; l.innerHTML = '<canvas width="140" height="140"></canvas><b></b>'; document.body.appendChild(l); }
        const r = cv.getBoundingClientRect(), px = (cx - r.left) / r.width * cv.width, py = (cy - r.top) / r.height * cv.height, z = cv.width / r.width / 3;
        const g = l.querySelector('canvas').getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 140, 140);
        g.drawImage(cv, px - 70 * z, py - 70 * z, 140 * z, 140 * z, 0, 0, 140, 140);
        g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(52, 70); g.lineTo(64, 70); g.moveTo(76, 70); g.lineTo(88, 70); g.moveTo(70, 52); g.lineTo(70, 64); g.moveTo(70, 76); g.lineTo(70, 88); g.stroke();
        const [u, v] = cvUV(cv, cx, cy); l.querySelector('b').textContent = puanUV(u, v);
        let x = cx - 70, y = cy - 140 - 50; if (y < 8) y = cy + 50; x = Math.max(8, Math.min(window.innerWidth - 148, x)); l.style.left = x + 'px'; l.style.top = y + 'px';
    }
    function lupKapat() { const l = $('hf-lup'); if (l) l.remove(); }

    /* ---- seriye yaz ---- */
    window.hfSeriyeYaz = function () {
        if (_hf.oklar.length + (_hf.mSay || 0) !== maksOk()) return tost(`Bu seride ${maksOk()} ok olmalı.`, 'warning');
        // Skor Gir bu sporcuda ve bu hedefte açık olsun (KM'de kayıttan sonra platforma dönülüyor, sonraki seride yeniden açılır)
        try {
            const panel = $('skor-grid-paneli-baba'), acik = panel && panel.style.display !== 'none';
            if (secilenSporcu !== _hf.ad || aktifGrup !== _hf.g || !acik) {
                if (_hf.km) { window._kmSkorAktif = { g: _hf.km.g, ad: _hf.km.ad }; const kp = $('karisik-platform'); if (kp) kp.style.display = 'none'; }
                aktifGrup = _hf.g; skorEkraniniAc(_hf.ad);
            }
            if (aktifHedefTipi !== _hf.tip) setHedefTipi(_hf.tip);
        } catch (e) { return tost('Skor ekranı açılamadı.', 'error'); }
        const sp = hfSp(); if (!sp) return tost('Sporcu bulunamadı.', 'error');
        const once = (sp.seriler || []).length, t = Date.now();
        anlikAtilanOklar = _hf.oklar.map((o) => {
            const p = puanUV(o.u, o.v), r = getRenkForPuan(p);
            return { x: Math.round(o.u * 10) / 10, y: Math.round((o.v + (_hf.tip === '3spot' ? SPOT_Y[o.s] : 0)) * 10) / 10, puan: p, bg: r.bg, color: r.c, tip: _hf.tip, spot: _hf.tip === '3spot' ? o.s : null, t, foto: 1 };
        });
        for (let i = 0; i < (_hf.mSay || 0); i++) { const r = getRenkForPuan('M'); anlikAtilanOklar.push({ x: null, y: null, puan: 'M', bg: r.bg, color: r.c, tip: _hf.tip, spot: null, t, foto: 1 }); }
        try { hedefGorseliGuncelle(false); } catch (e) { }
        try { skorKaydet(); } catch (e) { console.error(e); }
        const sp2 = hfSp(), sonra = (sp2 && sp2.seriler || []).length;
        if (sonra <= once) { tost('Seri kaydedilemedi — Skor Gir ekranına bak.', 'error'); return hfKapat(); }
        // bu seriyi bir sonrakinin "önceki"si yap (fark → öneri)
        _hf.onceki = {}; _hf.spotlar.forEach((x, s) => { _hf.onceki[s] = { gri: _hf.gri[s], oklar: _hf.oklar.filter((o) => o.s === s).map((o) => ({ u: o.u, v: o.v })) }; });
        _hf.mSay = 0;
        const tm = $('seri-tamamlandi-modal');
        if (tm && tm.style.display === 'flex') { hfKapat(); return; } // seri limiti: Skor Gir'in kendi penceresi karar versin
        hfKamera();
    };

    /* ================= ③ analiz ================= */
    window.hfAnaliz = function () {
        kameraDurdur(); _hf.akis = 'analiz';
        const tumu = kayitliNoktalar(), zamanli = tumu.filter((o) => o.t), b = bugun();
        let bugunN = zamanli.filter((o) => gunAnahtar(o.t) === b), etiket = 'BUGÜN';
        if (bugunN.length < 3) { bugunN = tumu.slice(-30); etiket = 'SON ' + bugunN.length + ' OK'; }
        const hafta = zamanli.filter((o) => gunAnahtar(o.t) !== b && Date.now() - o.t < 8 * 864e5);
        const gr = grup(bugunN), gh = hafta.length >= 6 ? grup(hafta) : null;
        const sp = hfSp(), seriler = (sp && sp.seriler || []).filter((s) => s.tarih === b);
        const ort = bugunN.length ? bugunN.reduce((t, o) => t + pDeger(o.p), 0) / bugunN.length : 0, ortH = hafta.length ? hafta.reduce((t, o) => t + pDeger(o.p), 0) / hafta.length : null;
        const x10 = bugunN.filter((o) => o.p === 'X' || o.p === '10').length;
        const yon = gr ? yonYazi(gr.u, gr.v) : null, tipGor = bugunN.some((o) => o.tip === '10ring') ? '10ring' : (_hf.tip || '6ring');
        const fark = (a, b2, ters2) => { if (b2 == null) return ''; const d = a - b2; if (Math.abs(d) < 0.05) return '<span class="hf-muted">geçen haftayla aynı</span>'; const iyi = ters2 ? d < 0 : d > 0; return `<span class="${iyi ? 'yesil' : 'kirmizi'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} geçen hafta</span>`; };
        const enb = Math.max(30, ...seriler.map((s) => s.puan || 0));
        const oneri = !gr ? 'Analiz için okların hedefte işaretlenmiş olması gerekir (📷 fotoğraf ya da Skor Gir\'de hedefe dokunarak).'
            : (yon.yazi === 'ortada' ? `Grup ortada 👏 Şimdi hedef grubu sıkılaştırmak: grup çapı ${halka(gr.cap)} halka.`
                : `Grup ${yon.yazi} tarafa ${halka(Math.hypot(gr.u, gr.v))} halka kayık. Grup sıkıysa nişangâhı ${yon.yazi.replace('üst', 'yukarı').replace('alt', 'aşağı')} yönüne al (nişangâh grubu takip eder); dağınıksa önce bırakış ve duruşa bak.`);
        _hf.analizMetin = gr ? `🎯 ${_hf.ad} — ${b.split('-').reverse().join('.')} antrenman özeti\n` +
            `• ${bugunN.length} ok · ortalama ${ort.toLocaleString('tr-TR', { maximumFractionDigits: 1 })} · X+10: ${x10}\n` +
            `• Grup çapı: ${halka(gr.cap)} halka${gh ? ` (geçen hafta ${halka(gh.cap)})` : ''}\n` +
            `• Grup merkezi: ${yon.yazi}\n` + (seriler.length ? `• Seriler: ${seriler.map((s) => s.puan).join(', ')}\n` : '') + `\nDAĞ Spor Kulübü 🏹` : '';
        kabuk(`<span class="mono">GRUP ANALİZİ</span> · ${esc(_hf.ad)}`, `<span class="hf-etk">${etiket} · ${bugunN.length} OK</span>`, `
<div class="hf-kart" style="display:flex;justify-content:center">${yuzSvg(bugunN.map((o) => ({ u: o.u, v: o.v, eski: true })), 260, { tip: tipGor, elips: gr ? { u: gr.u, v: gr.v, r: gr.r } : null, R: Math.min(yuzR(tipGor), Math.max(32, Math.ceil(Math.max(0, ...bugunN.map((o) => Math.hypot(o.u, o.v))) * 1.25 / 10) * 10)) })}</div>
<div class="hf-kart"><div class="hf-istat">
  <div><span>Grup merkezi</span><b>${gr ? `${yon.ok} ${halka(Math.hypot(gr.u, gr.v))}` : '—'}</b><span>${gr ? (yon.yazi === 'ortada' ? 'ortada' : yon.yazi + ' · halka') : ''}</span></div>
  <div><span>Grup çapı</span><b>${gr ? halka(gr.cap) + ' halka' : '—'}</b>${gr && gh ? fark(gr.cap / 10, gh.cap / 10, true) : '<span>daha küçük = daha iyi</span>'}</div>
  <div><span>Ortalama</span><b>${bugunN.length ? ort.toLocaleString('tr-TR', { maximumFractionDigits: 1 }) : '—'}</b>${ortH != null && bugunN.length ? fark(ort, ortH) : ''}</div>
  <div><span>X + 10</span><b>${x10} / ${bugunN.length}</b><span>${bugunN.length ? '%' + Math.round(x10 / bugunN.length * 100) : ''}</span></div>
</div></div>
${seriler.length ? `<div class="hf-kart"><div class="hf-lbl">Seri seri · bugün</div><div class="hf-cubuk" style="margin-top:16px">${seriler.map((s) => `<span style="height:${Math.max(4, (s.puan || 0) / enb * 100)}%"><i>${s.puan}</i></span>`).join('')}</div></div>` : ''}
<div class="hf-kart"><div class="hf-muted">💬 ${esc(oneri)}</div></div>
<div style="margin:12px 14px 0;display:flex;gap:8px">
  <button class="hf-btn2" style="flex:1" onclick="hfKamera()">📷 Sıradaki seri</button>
  <button class="hf-btn" style="flex:1;font-size:14px;white-space:nowrap" onclick="hfVeli()" ${gr ? '' : 'disabled'}>💬 VELİYE GÖNDER</button>
</div>`);
    };
    window.hfVeli = function () {
        if (!_hf.analizMetin) return; const sp = hfSp(); let n = '';
        try { n = sp && sp.acilTelefon && typeof telefonWaFormat === 'function' ? telefonWaFormat(sp.acilTelefon) : ''; } catch (e) { }
        window.open((n ? 'https://api.whatsapp.com/send?phone=' + n + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(_hf.analizMetin), '_blank');
    };

    /* ================= çıkış ================= */
    function hfKapat() { kameraDurdur(); lupKapat(); ['hf', 'hf-buyuk'].forEach((id) => { const e = $(id); if (e) e.remove(); }); _hf = null; }
    window.hfKapat = hfKapat;
    window.hfKamera = function () { if (_hf) { kameraDurdur(); hfKamera(); } };
    window.hfGeri = function () {
        if (!_hf) return hfKapat();
        if (_hf.akis === 'duzelt' && _hf.oklar.length && !confirm('İşaretlenen oklar kaydedilmedi. Çıkılsın mı?')) return;
        if (_hf.akis === 'kamera') return hfKapat();
        hfKamera();
    };
    // test/iç kullanım
    window._hfIc = { spotBul, renk, olcekle, durum: () => _hf, fotoIsle: (c) => fotoIsle(c) };
})();
