/* ================================================================================================
   🗂️ FİZİKSEL DOSYA + KAYIT FORMU (2026-11-05, v378). Kullanıcı: "sporcuların fiziksel bilgilerini dolduruyorum, fotoların kalacağı bir yer
   yapalım; buna göre kayıt listesi PDF, velilerin mesleğini de öğren, yazıyı okuyarak otomatik kaydet". Taslak (A + B + C birleşimi):
   https://claude.ai/artifact/EGwr1DdUZNJnc3vNWiHwqy
   - Liste: tüm sporcular, son ölçüm, fotoğraf sayısı, "Yalnız eksikler". Satır → dosya.
   - Dosya: son biyomotor ölçümleri + tarihe göre fotoğraflar (Duruş / Form). Duruş fotoğrafı veli onayı işareti olmadan yüklenmez.
   - Karşılaştır: iki tarihin fotoğrafı yan yana + ölçüm farkları (en yakın biyomotor kaydı).
   - Kayıt formu PDF: kişiye özel (bilinenler basılı) + boş form. Rakamlar kutu kutu, el yazısı kolay okunsun.
   - Formu oku: fotoğraf /api/form-oku ile okunur, hoca alanları kontrol eder, ONAYLAYINCA normal yollarla kaydedilir. Mevcut farklı değerin üstüne
     varsayılan olarak yazılmaz; belirsiz ve geçersiz alanlar işaretlenir. Form fotoğrafı dosyaya "Form" olarak eklenir (imzalı kağıdın kaydı).
   Görseller yalnız oturumla, blob olarak çekilir; hiçbir ekrana (TV, oyun, veli linki) gitmez. Ölçümler mevcut sp.biyomotorTestleri.
   ================================================================================================ */
(function () {
    'use strict';
    const GR = [['buyukler', 'Büyükler'], ['yildizlar', 'Yıldızlar'], ['kucukler', 'Küçükler'], ['minikler', 'Minikler']], GAD = Object.fromEntries(GR);
    const OL = [['boy', 'Boy', 'cm'], ['kilo', 'Kilo', 'kg'], ['kavramaGucu', 'Kavrama', 'kg'], ['esneklik', 'Esneklik', 'cm'], ['denge', 'Denge', 'sn'], ['plank', 'Plank', 'sn']];
    const TUR = { on: 'Duruş ön', yan: 'Duruş yan', form: 'Form', diger: 'Diğer' };
    const $ = (id) => document.getElementById(id);
    const e = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const K = (x) => encodeURIComponent(x).replace(/'/g, '%27');
    const tost = (m, t) => { try { showToast(m, t || 'info'); } catch (er) { } };
    const bugun = () => { try { return bugunISO(); } catch (er) { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); } };
    const tarihY = (t) => { if (!t) return ''; const p = t.split('-'); return +p[2] + ' ' + ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'][+p[1] - 1] + ' ' + p[0]; };
    const katla = (s) => String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/\s+/g, ' ').trim();
    const IK = { kapat: '<path d="M6 6l12 12M18 6 6 18"/>', geri: '<path d="M15 6l-6 6 6 6"/>', foto: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>', sil: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', sag: '<path d="M9 6l6 6-6 6"/>' };
    const svg = (k, b) => '<svg width="' + (b || 18) + '" height="' + (b || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IK[k] + '</svg>';
    let L = { ara: '', grup: 'hepsi', eksik: false, ozet: {} }, D = null, _blob = {};

    function sporcular() {
        const r = [];
        GR.forEach(([g]) => Object.keys(turnuvaDB[g] || {}).forEach((ad) => { const sp = turnuvaDB[g][ad]; if (sp && typeof sp === 'object' && !sp.pasif) r.push({ g, ad, sp }); }));
        return r.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
    }
    function sonOlcum(sp) { return (sp.biyomotorTestleri || []).slice().sort((a, b) => (a.tarih < b.tarih ? 1 : a.tarih > b.tarih ? -1 : 0))[0] || null; }
    function birim(v, b) { return v == null ? '—' : String(v).replace('.', ',') + ' ' + b; }

    /* ---------------- liste ---------------- */
    window.fzCiz = function () {
        const la = $('yonetici-liste'); if (!la) return; fzCss();
        la.innerHTML = '<div class="fz" id="fz-liste"><div class="fz-bas"><div><span class="fz-et">Kulüp · Fiziksel dosyalar</span><h2 class="fz-h">Sporcular</h2></div>'
            + '<div class="fz-is"><button type="button" class="fz-btn acik" onclick="fzFormMenu()">Kayıt formu PDF</button><button type="button" class="fz-btn ana" onclick="fzFormSec()">Formu fotoğrafla oku</button></div></div>'
            + '<div class="fz-suz"><label class="fz-gizli" for="fz-ara">Sporcu ara</label><input id="fz-ara" class="fz-gir" placeholder="Sporcu adı" value="' + e(L.ara) + '" oninput="fzAra(this.value)" autocomplete="off">'
            + '<select class="fz-gir kisa" aria-label="Grup" onchange="fzGrup(this.value)"><option value="hepsi">Tüm gruplar</option>' + GR.map(([g, a]) => '<option value="' + g + '"' + (L.grup === g ? ' selected' : '') + '>' + a + '</option>').join('') + '</select>'
            + '<button type="button" class="fz-cip' + (L.eksik ? ' on' : '') + '" aria-pressed="' + L.eksik + '" onclick="fzEksik()">Yalnız eksikler</button></div><div id="fz-satirlar"></div></div>';
        satirlarCiz();
        fetch('/api/fiziksel-ozet').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) { L.ozet = d.ozet || {}; satirlarCiz(); } }).catch(() => { });
    };
    window.fzAra = (v) => { L.ara = v; satirlarCiz(); };
    window.fzGrup = (v) => { L.grup = v; satirlarCiz(); };
    window.fzEksik = () => { L.eksik = !L.eksik; fzCiz(); };
    function satirlarCiz() {
        const kap = $('fz-satirlar'); if (!kap) return; const q = katla(L.ara);
        const l = sporcular().filter((x) => (L.grup === 'hepsi' || x.g === L.grup) && (!q || katla(x.ad).includes(q))).map((x) => ({ ...x, o: sonOlcum(x.sp), f: L.ozet[x.g + '|' + x.ad] })).filter((x) => !L.eksik || !x.o || !x.f);
        kap.innerHTML = l.length ? '<div class="fz-tablo" role="list">' + l.map((x) => '<button type="button" role="listitem" class="fz-sat" onclick="fzDosya(\'' + K(x.g) + '\',\'' + K(x.ad) + '\')"><b>' + e(x.ad) + '</b><span class="fz-sol">' + e(GAD[x.g]) + '</span><span>' + birim(x.o && x.o.boy, 'cm') + ' · ' + birim(x.o && x.o.kilo, 'kg') + '</span><span class="' + (x.o ? '' : 'fz-eks') + '">' + (x.o ? e(tarihY(x.o.tarih)) : 'Ölçüm yok') + '</span><span class="' + (x.f ? '' : 'fz-eks') + '">' + (x.f ? x.f.n + ' fotoğraf' : 'Fotoğraf yok') + '</span></button>').join('') + '</div>' : '<p class="fz-bos">Bu aramayla sporcu yok.</p>';
    }

    /* ---------------- dosya ---------------- */
    function kabuk(ic) {
        let el = $('fz-ekran'); if (!el) { el = document.createElement('div'); el.id = 'fz-ekran'; el.className = 'fz'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Fiziksel dosya'); document.body.appendChild(el); }
        el.innerHTML = '<div class="fz-sayfa">' + ic + '</div>'; return el;
    }
    function ust(fn, et) { return '<div class="fz-ust"><button type="button" class="fz-yuv" onclick="' + fn + '" aria-label="' + (fn === 'fzKapat()' ? 'Kapat' : 'Geri') + '">' + svg(fn === 'fzKapat()' ? 'kapat' : 'geri') + '</button><span class="fz-et">' + e(et) + '</span></div>'; }
    window.fzKapat = function () { const el = $('fz-ekran'); if (el) el.remove(); Object.values(_blob).forEach((u) => URL.revokeObjectURL(u)); _blob = {}; D = null; if ($('fz-liste')) window.fzCiz(); };
    window.fzDosya = function (gE, aE) {
        fzCss(); D = { g: decodeURIComponent(gE), ad: decodeURIComponent(aE), fotolar: [], suz: 'hepsi' };
        kabuk('<div class="fz-yuk">Yükleniyor…</div>');
        return fotolarCek().then(dosyaCiz).catch(() => { tost('Dosya açılamadı. Bağlantıyı kontrol et.', 'error'); window.fzKapat(); });
    };
    function fotolarCek() { return fetch('/api/fiziksel/' + encodeURIComponent(D.g) + '/' + encodeURIComponent(D.ad)).then((r) => { if (!r.ok) throw new Error('liste'); return r.json(); }).then((d) => { D.fotolar = d.fotolar || []; }); }
    function gorselYukle() {
        document.querySelectorAll('#fz-ekran [data-foto]').forEach((b) => {
            const id = b.getAttribute('data-foto'); const koy = (u) => { b.style.backgroundImage = 'url("' + u + '")'; b.classList.add('dolu'); };
            if (_blob[id]) return koy(_blob[id]);
            fetch('/api/fiziksel-foto/' + id).then((r) => (r.ok ? r.blob() : Promise.reject())).then((bl) => { _blob[id] = URL.createObjectURL(bl); koy(_blob[id]); }).catch(() => { });
        });
    }
    function dosyaCiz() {
        const sp = (turnuvaDB[D.g] || {})[D.ad] || {}, o = sonOlcum(sp);
        const l = D.fotolar.filter((f) => D.suz === 'hepsi' || (D.suz === 'durus' ? f.tur === 'on' || f.tur === 'yan' : f.tur === D.suz));
        const gunler = {}; l.forEach((f) => { (gunler[f.tarih] = gunler[f.tarih] || []).push(f); });
        const cip = (k, a) => '<button type="button" class="fz-cip' + (D.suz === k ? ' on' : '') + '" aria-pressed="' + (D.suz === k) + '" onclick="fzSuz(\'' + k + '\')">' + a + '</button>';
        kabuk(ust('fzKapat()', 'Fiziksel dosya · ' + (GAD[D.g] || '')) + '<h2 class="fz-h" id="fz-ad">' + e(D.ad) + '</h2>'
            + '<div class="fz-olcum">' + OL.map(([k, a, b]) => '<div><span>' + a + '</span><b>' + birim(o && o[k], b) + '</b></div>').join('') + '</div>'
            + '<p class="fz-not">' + (o ? 'Son ölçüm: ' + e(tarihY(o.tarih)) : 'Ölçüm yok. Eğitmen › Biyomotor sekmesinden ya da formdan eklenir.') + '</p>'
            + '<div class="fz-fbas"><span class="fz-et">Fotoğraflar · ' + D.fotolar.length + '</span><div class="fz-cipler">' + cip('hepsi', 'Hepsi') + cip('durus', 'Duruş') + cip('form', 'Form') + '</div></div>'
            + (Object.keys(gunler).length ? Object.keys(gunler).sort().reverse().map((t) => '<section><h3 class="fz-gun">' + e(tarihY(t)) + '</h3><div class="fz-izgara">' + gunler[t].map((f) => '<button type="button" class="fz-foto" data-foto="' + f.id + '" onclick="fzBak(' + f.id + ')" aria-label="' + e(TUR[f.tur] || '') + ' fotoğrafını aç"><span>' + e(TUR[f.tur] || '') + '</span></button>').join('') + '</div></section>').join('') : '<p class="fz-bos">Henüz fotoğraf yok.</p>')
            + '<div class="fz-alt"><button type="button" class="fz-btn acik" onclick="fzKarsilastir()"' + (tarihler().length < 2 ? ' disabled' : '') + '>Karşılaştır</button><button type="button" class="fz-btn ana" onclick="fzEkleAc()">Fotoğraf ekle</button></div>');
        gorselYukle();
    }
    function tarihler() { return [...new Set(D.fotolar.map((f) => f.tarih))].sort().reverse(); }
    window.fzSuz = (k) => { D.suz = k; dosyaCiz(); };
    window.fzBak = function (id) {
        const f = D.fotolar.find((x) => x.id === id); if (!f) return;
        kabuk(ust('fzDosyaDon()', TUR[f.tur] + ' · ' + tarihY(f.tarih)) + '<div class="fz-buyuk" data-foto="' + id + '" role="img" aria-label="' + e(TUR[f.tur]) + ' fotoğrafı"></div><div class="fz-alt"><button type="button" class="fz-btn tehlike" onclick="fzFotoSil(' + id + ')">' + svg('sil', 16) + 'Fotoğrafı sil</button></div>');
        gorselYukle();
    };
    window.fzDosyaDon = () => dosyaCiz();
    window.fzFotoSil = function (id) {
        if (!confirm('Bu fotoğraf kalıcı olarak silinsin mi?')) return;
        fetch('/api/fiziksel-foto/' + id, { method: 'DELETE' }).then((r) => { if (!r.ok) throw 0; return fotolarCek(); }).then(() => { tost('Fotoğraf silindi.', 'success'); dosyaCiz(); }).catch(() => tost('Silinemedi.', 'error'));
    };

    /* ---------------- fotoğraf ekle ---------------- */
    function kucult(dosya, maks, kalite) {
        return new Promise((ok, no) => {
            const u = URL.createObjectURL(dosya), im = new Image();
            im.onload = () => { const o = Math.min(1, maks / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * o); c.height = Math.round(im.height * o); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', kalite)); };
            im.onerror = () => { URL.revokeObjectURL(u); no(new Error('foto')); }; im.src = u;
        });
    }
    let E = null;
    window.fzEkleAc = function () { E = { tur: 'on', tarih: bugun(), onay: false, veri: null }; ekleCiz(); };
    function ekleCiz() {
        const durus = E.tur === 'on' || E.tur === 'yan';
        kabuk(ust('fzDosyaDon()', 'Fotoğraf ekle · ' + D.ad) + '<p class="fz-et">Tür</p><div class="fz-cipler">' + Object.keys(TUR).map((k) => '<button type="button" class="fz-cip' + (E.tur === k ? ' on' : '') + '" aria-pressed="' + (E.tur === k) + '" onclick="fzEkleAyar(\'tur\',\'' + k + '\')">' + TUR[k] + '</button>').join('') + '</div>'
            + '<label class="fz-et" for="fz-tarih">Tarih</label><input id="fz-tarih" type="date" class="fz-gir" value="' + e(E.tarih) + '" max="' + bugun() + '" onchange="fzEkleTarih(this.value)">'
            + '<label class="fz-sec" for="fz-dosya">' + (E.veri ? '<img src="' + E.veri + '" alt="Seçilen fotoğraf">' : svg('foto', 28) + '<span>Fotoğraf çek ya da seç</span>') + '</label><input id="fz-dosya" class="fz-gizli" type="file" accept="image/*" onchange="fzEkleDosya(this)">'
            + (durus ? '<label class="fz-onay"><input type="checkbox" id="fz-onay"' + (E.onay ? ' checked' : '') + ' onchange="fzEkleOnay(this.checked)"><span>Bu fotoğraf için velinin onayını aldım.</span></label>' : '')
            + '<p class="fz-not">Yalnız giriş yapmış yönetici ve eğitmenler görür. TV, oyun ve veli linkinde görünmez.</p><div class="fz-alt"><button type="button" class="fz-btn ana" id="fz-kaydet" onclick="fzEkleKaydet()"' + (E.veri && (!durus || E.onay) ? '' : ' disabled') + '>Kaydet</button></div>');
    }
    window.fzEkleAyar = (k, v) => { E[k] = v; ekleCiz(); };
    window.fzEkleTarih = (v) => { E.tarih = v; };
    window.fzEkleOnay = (v) => { E.onay = v; ekleCiz(); };
    window.fzEkleDosya = function (i) { const f = i.files && i.files[0]; if (!f) return; kucult(f, 1600, 0.78).then((v) => { E.veri = v; ekleCiz(); }).catch(() => tost('Fotoğraf açılamadı.', 'error')); };
    window.fzEkleKaydet = function () {
        const b = $('fz-kaydet'); if (b) b.disabled = true;
        fotoYolla(D.g, D.ad, E.tur, E.tarih, E.veri, E.onay).then(fotolarCek).then(() => { tost('Fotoğraf kaydedildi.', 'success'); dosyaCiz(); }).catch(() => { if (b) b.disabled = false; tost('Kaydedilemedi. Bağlantıyı kontrol et.', 'error'); });
    };
    function fotoYolla(g, ad, tur, tarih, veri, onay) { return fetch('/api/fiziksel/' + encodeURIComponent(g) + '/' + encodeURIComponent(ad), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tur, tarih, veri, veliOnayi: !!onay }) }).then((r) => { if (!r.ok) throw new Error('foto'); return r.json(); }); }

    /* ---------------- karşılaştır ---------------- */
    let C = null;
    window.fzKarsilastir = function () { const t = tarihler(); C = { a: t[t.length - 1], b: t[0], tur: 'on' }; karsCiz(); };
    function enYakinOlcum(t) { const l = ((turnuvaDB[D.g] || {})[D.ad] || {}).biyomotorTestleri || []; let en = null, ef = Infinity; l.forEach((o) => { const f = Math.abs(Date.parse(o.tarih) - Date.parse(t)); if (f < ef) { ef = f; en = o; } }); return en; }
    function karsCiz() {
        const secim = (k) => '<select class="fz-gir" aria-label="Tarih" onchange="fzKarsAyar(\'' + k + '\',this.value)">' + tarihler().map((t) => '<option value="' + t + '"' + (C[k] === t ? ' selected' : '') + '>' + e(tarihY(t)) + '</option>').join('') + '</select>';
        const kutu = (t) => { const f = D.fotolar.find((x) => x.tarih === t && x.tur === C.tur); return f ? '<div class="fz-yan" data-foto="' + f.id + '" role="img" aria-label="' + e(TUR[C.tur] + ' ' + tarihY(t)) + '"></div>' : '<div class="fz-yan bos">Bu tarihte yok</div>'; };
        const A = enYakinOlcum(C.a), B = enYakinOlcum(C.b);
        kabuk(ust('fzDosyaDon()', 'Karşılaştır · ' + D.ad) + '<div class="fz-iki"><div>' + secim('a') + kutu(C.a) + '</div><div>' + secim('b') + kutu(C.b) + '</div></div>'
            + '<div class="fz-cipler">' + ['on', 'yan', 'form'].map((k) => '<button type="button" class="fz-cip' + (C.tur === k ? ' on' : '') + '" aria-pressed="' + (C.tur === k) + '" onclick="fzKarsAyar(\'tur\',\'' + k + '\')">' + TUR[k] + '</button>').join('') + '</div>'
            + '<div class="fz-fark"><p class="fz-not">Ölçümler bu tarihlere en yakın kayıtlar' + (A && B ? ': ' + e(tarihY(A.tarih)) + ' ve ' + e(tarihY(B.tarih)) : '') + '.</p>' + OL.map(([k, a, br]) => { const x = A && A[k], y = B && B[k], d = x != null && y != null ? Math.round((y - x) * 10) / 10 : null; return '<div class="fz-fs"><b>' + a + '</b><span>' + birim(x, br) + '</span><span>' + birim(y, br) + '</span><i>' + (d == null ? '—' : (d > 0 ? '+' : '') + String(d).replace('.', ',') + ' ' + br) + '</i></div>'; }).join('') + '</div>');
        gorselYukle();
    }
    window.fzKarsAyar = (k, v) => { C[k] = v; karsCiz(); };

    /* ---------------- kayıt formu PDF ---------------- */
    window.fzFormMenu = function () {
        fzCss();
        kabuk(ust('fzKapat()', 'Kayıt formu') + '<h2 class="fz-h">Kayıt formu PDF</h2><p class="fz-not">A4, sporcu başına bir sayfa. Kişiye özel formda bilinen bilgiler basılı gelir, veli yalnız eksikleri yazar veya düzeltir.</p>'
            + '<div class="fz-liste-btn"><button type="button" class="fz-btn ana" onclick="fzFormPdf(\'bos\')">Boş form</button>' + GR.map(([g, a]) => '<button type="button" class="fz-btn acik" onclick="fzFormPdf(\'' + g + '\')">' + a + ' · ' + sporcular().filter((x) => x.g === g).length + ' sporcu</button>').join('') + '<button type="button" class="fz-btn acik" onclick="fzFormPdf(\'hepsi\')">Tüm sporcular · ' + sporcular().length + '</button></div>'
            + '<p class="fz-not">Formdaki onay metinleri taslaktır. Kullanmadan önce KVKK danışmanına göstermeni öneririm.</p>');
    };
    window.fzFormPdf = function (kapsam) {
        const l = kapsam === 'bos' ? [null] : sporcular().filter((x) => kapsam === 'hepsi' || x.g === kapsam);
        if (!l.length) return tost('Bu grupta sporcu yok.', 'warning');
        tost('PDF hazırlanıyor…', 'info');
        return _yeniPdfAl('portrait').then((pdf) => {
            l.forEach((x, i) => { if (i) pdf.addPage(); formSayfa(pdf, x); });
            pdf.save(kapsam === 'bos' ? 'kayit-formu-bos.pdf' : 'kayit-formlari-' + kapsam + '.pdf');
            return pdf.getNumberOfPages();
        }).catch((er) => { console.error(er); tost('PDF oluşturulamadı.', 'error'); });
    };
    function formSayfa(pdf, x) {
        const sp = x ? x.sp : {}, S = 14, W = 182; let y = 15;
        const yaz = (t, xx, yy, b, kal) => { pdf.setFont('helvetica', kal ? 'bold' : 'normal'); pdf.setFontSize(b); pdf.text(String(t), xx, yy); };
        const baslik = (t) => { pdf.setFillColor(23, 18, 14); pdf.rect(S, y, W, 7, 'F'); pdf.setTextColor(255, 255, 255); yaz(t, S + 2, y + 5, 10.5, true); pdf.setTextColor(23, 18, 14); y += 11; };
        const satir = (et, deger, gen) => { yaz(et, S, y, 8.5, true); pdf.setDrawColor(120); pdf.rect(S, y + 1.5, gen || W, 9); if (deger) yaz(deger, S + 2, y + 7.8, 11); y += 14; };
        const kutular = (et, deger, n, xx) => { const k = 6.6; yaz(et, xx, y, 8.5, true); let i = 0; for (let j = 0; j < n; j++) { const bx = xx + j * k; pdf.rect(bx, y + 1.5, k, 9); if (deger && deger[i]) { yaz(deger[i], bx + 1.9, y + 7.8, 11); } i++; } };
        pdf.setTextColor(23, 18, 14); yaz('DAĞ Spor Kulübü', S, y + 4, 16, true); yaz('Sporcu Kayıt Formu', S, y + 10, 10.5); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8.5);
        const nt = 'Lütfen büyük harfle, her kutuya bir rakam yazın.'; pdf.text(nt, S + W - pdf.getTextWidth(nt), y + 10); y += 16;
        baslik('SPORCU');
        satir('Ad Soyad', x ? x.ad : '');
        const dt = (sp.dogumTarihi || '').split('-'); kutular('Doğum tarihi (GG AA YYYY)', dt.length === 3 ? dt[2] + dt[1] + dt[0] : '', 8, S);
        yaz('Cinsiyet', S + 66, y, 8.5, true); [['K', 'Kız'], ['E', 'Erkek']].forEach(([c, a], i) => { const bx = S + 66 + i * 24; pdf.rect(bx, y + 3, 6, 6); if (sp.cinsiyet === c) { yaz('X', bx + 1.6, y + 7.6, 11, true); } yaz(a, bx + 8, y + 7.6, 10); }); y += 15;
        const veli = (no, ad, tel) => { baslik(no + '. VELİ' + (no === 2 ? ' (varsa)' : '')); satir('Ad Soyad', ad); kutular('Cep telefonu', String(tel || '').replace(/\D/g, ''), 11, S); y += 14; satir('Mesleği', no === 1 ? (sp.aileMeslek || '') : ''); };
        veli(1, sp.acilKisi, sp.acilTelefon); veli(2, sp.veli2Kisi, sp.veli2Telefon);
        baslik('FİZİKSEL BİLGİLER (kulüp doldurur)');
        const o = sonOlcum(sp) || {}, gen = (W - 10) / 3; OL.forEach(([k, a, b], i) => { const xx = S + (i % 3) * (gen + 5), yy = y + Math.floor(i / 3) * 14; yaz(a + ' (' + b + ')', xx, yy, 8.5, true); pdf.rect(xx, yy + 1.5, gen, 9); if (o[k] != null) yaz(String(o[k]).replace('.', ','), xx + 2, yy + 7.8, 11); }); y += 28;
        kutular('Ölçüm tarihi (GG AA YYYY)', '', 8, S); y += 15;
        baslik('ONAYLAR');
        ['Bu formdaki bilgilerin kulüp tarafından kayıt ve antrenman takibi için işlenmesini onaylıyorum.', 'Bu formun fotoğrafının, yazıların okunması için yurt dışındaki yapay zekâ hizmetine (Anthropic) iletilmesini onaylıyorum.', 'Çocuğumun duruş ve ölçüm fotoğraflarının yalnız kulüp antrenörlerinin göreceği şekilde saklanmasını onaylıyorum.'].forEach((t) => { pdf.rect(S, y - 3.6, 4.5, 4.5); yaz(t, S + 7, y, 8.8); y += 7; });
        y += 2; yaz('Tarih', S, y, 8.5, true); pdf.rect(S, y + 1.5, 50, 9); yaz('Veli adı ve imzası', S + 58, y, 8.5, true); pdf.rect(S + 58, y + 1.5, W - 58, 12);
    }

    /* ---------------- formu oku ---------------- */
    let O = null;
    const ALAN = [['sporcuAd', 'Ad Soyad', null, 'metin'], ['dogumTarihi', 'Doğum tarihi', 'dogumTarihi', 'tarih'], ['cinsiyet', 'Cinsiyet (K/E)', 'cinsiyet', 'metin'], ['veli1Ad', '1. veli', 'acilKisi', 'metin'], ['veli1Telefon', '1. veli telefon', 'acilTelefon', 'tel'], ['veli2Ad', '2. veli', 'veli2Kisi', 'metin'], ['veli2Telefon', '2. veli telefon', 'veli2Telefon', 'tel'], ['meslek', 'Veli mesleği', 'aileMeslek', 'metin']];
    window.fzFormSec = function () {
        fzCss(); O = { onay: false };
        kabuk(ust('fzKapat()', 'Formu oku') + '<h2 class="fz-h">Formu fotoğrafla oku</h2><p class="fz-not">Yazılar okunur, sen kontrol edip onaylayınca kaydedilir. Fotoğraf okuma için Anthropic\'e gider; orada kulübün sakladığı bir kayıt olarak tutulmaz, dosyaya yalnız onayladığında eklenir.</p>'
            + '<label class="fz-onay"><input type="checkbox" onchange="fzOkuOnay(this.checked)"><span>Veli, formdaki yapay zekâ onay kutusunu işaretledi.</span></label>'
            + '<label class="fz-sec' + '" id="fz-oku-etiket" for="fz-form-dosya">' + svg('foto', 28) + '<span>Formun fotoğrafını çek ya da seç</span></label><input id="fz-form-dosya" class="fz-gizli" type="file" accept="image/*" disabled onchange="fzOkuDosya(this)"><p class="fz-not" id="fz-oku-not">Önce onayı işaretle. Veli işaretlemediyse bilgileri Hızlı Düzenle\'den elle gir.</p>');
    };
    window.fzOkuOnay = function (v) { O.onay = v; const i = $('fz-form-dosya'); if (i) i.disabled = !v; const n = $('fz-oku-not'); if (n) n.textContent = v ? 'Tüm sayfa görünsün, yazılar net ve düz olsun.' : 'Önce onayı işaretle. Veli işaretlemediyse bilgileri Hızlı Düzenle\'den elle gir.'; };
    const HATA = { 'anahtar-yok': 'Form okuma henüz açılmadı: Anthropic API anahtarı eklenmemiş.', 'anahtar-gecersiz': 'Anthropic API anahtarı geçersiz.', 'gunluk-sinir': 'Bugünkü okuma sınırı doldu.', yogun: 'Servis şu an yoğun. Biraz sonra tekrar dene.', okunamadi: 'Form okunamadı. Daha net bir fotoğraf dene ya da elle gir.', servis: 'Okuma servisine ulaşılamadı. Biraz sonra tekrar dene.' };
    window.fzOkuDosya = function (i) {
        const f = i.files && i.files[0]; if (!f || !O.onay) return;
        kabuk(ust('fzFormSec()', 'Formu oku') + '<div class="fz-yuk" role="status">Form okunuyor, bu birkaç saniye sürebilir…</div>');
        let veri;
        return kucult(f, 2000, 0.85).then((v) => { veri = v; return fetch('/api/form-oku', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ veri }) }); })
            .then((r) => r.json().catch(() => ({})).then((d) => ({ ok: r.ok, d })))
            .then(({ ok, d }) => { if (!ok || !d.alanlar) { tost(HATA[d.error] || 'Form okunamadı.', 'error'); return window.fzFormSec(); } kontrolHazirla(d.alanlar, veri); })
            .catch(() => { tost('Bağlantı kurulamadı.', 'error'); window.fzFormSec(); });
    };
    function eslestir(ad) { const q = katla(ad); if (!q) return null; const l = sporcular(); return l.find((x) => katla(x.ad) === q) || (function () { const p = l.filter((x) => { const a = katla(x.ad); return a.includes(q) || q.includes(a); }); return p.length === 1 ? p[0] : null; })(); }
    function telGecerli(t) { const d = String(t || '').replace(/\D/g, ''); return !d || /^0?5\d{9}$/.test(d); }
    function kontrolHazirla(a, veri) {
        const m = [a.veli1Meslek, a.veli2Meslek].filter(Boolean).join(' / ');
        const k = eslestir(a.sporcuAd);
        O = Object.assign({}, O, { a, veri, deger: Object.assign({}, a, { meslek: m }), hedef: k ? k.g + '|' + k.ad : (a.sporcuAd ? 'yeni' : ''), yeniGrup: 'yildizlar', yaz: {}, olcumYaz: OL.some(([id]) => a[id] != null), belirsiz: a.belirsiz || [] });
        ALAN.forEach(([id, , alan]) => { if (!alan) return; const sp = hedefSp(), mev = sp && sp[alan], y = O.deger[id]; O.yaz[id] = !!y && (!mev || String(mev) === String(y)) && (alan.indexOf('Telefon') < 0 || telGecerli(y)); });
        kontrolCiz();
    }
    function hedefSp() { if (!O.hedef || O.hedef === 'yeni') return null; const i = O.hedef.indexOf('|'); return (turnuvaDB[O.hedef.slice(0, i)] || {})[O.hedef.slice(i + 1)] || null; }
    function kontrolCiz() {
        const sp = hedefSp(), a = O.a;
        const uyari = []; if (!a.kvkkOnay) uyari.push('KVKK onay kutusu işaretli görünmüyor.'); if (!a.imzaVar) uyari.push('İmza görünmüyor.'); if (!a.yapayZekaOnay) uyari.push('Yapay zekâ onay kutusu işaretli görünmüyor.');
        kabuk(ust('fzFormSec()', 'Kontrol et') + '<h2 class="fz-h">Okunanları kontrol et</h2><p class="fz-not">Hiçbir şey henüz kaydedilmedi. Sarı alanlarda okuma belirsiz, kırmızı alanda numara geçersiz. Kaydedilmiş bilgiden farklı olan alanlar kendiliğinden işaretlenmez.</p>'
            + (uyari.length ? '<div class="fz-uyari" id="fz-uyari">' + uyari.map(e).join('<br>') + '</div>' : '')
            + '<label class="fz-et" for="fz-hedef">Sporcu</label><select id="fz-hedef" class="fz-gir" onchange="fzHedef(this.value)"><option value="">Seç…</option><option value="yeni"' + (O.hedef === 'yeni' ? ' selected' : '') + '>Yeni sporcu oluştur</option>' + sporcular().map((x) => { const v = x.g + '|' + x.ad; return '<option value="' + e(v) + '"' + (O.hedef === v ? ' selected' : '') + '>' + e(x.ad) + ' · ' + e(GAD[x.g]) + '</option>'; }).join('') + '</select>'
            + (O.hedef === 'yeni' ? '<label class="fz-et" for="fz-yeni-g">Grup</label><select id="fz-yeni-g" class="fz-gir" onchange="fzYeniGrup(this.value)">' + GR.map(([g, n]) => '<option value="' + g + '"' + (O.yeniGrup === g ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' : '')
            + '<div class="fz-kontrol">' + ALAN.map(([id, et, alan, tip]) => {
                const v = O.deger[id] == null ? '' : O.deger[id], mev = alan && sp ? sp[alan] : '', bel = O.belirsiz.includes(id) || (id === 'meslek' && (O.belirsiz.includes('veli1Meslek') || O.belirsiz.includes('veli2Meslek'))), yanlis = tip === 'tel' && !telGecerli(v);
                if (!alan) return '<div class="fz-ks' + (bel ? ' bel' : '') + '"><label for="fz-a-' + id + '">' + et + '</label><input id="fz-a-' + id + '" class="fz-gir" value="' + e(v) + '" oninput="fzDeger(\'' + id + '\',this.value)"></div>';
                return '<div class="fz-ks' + (yanlis ? ' yanlis' : bel ? ' bel' : '') + '"><label for="fz-a-' + id + '">' + et + '</label><div class="fz-ks-sat"><input type="checkbox" id="fz-y-' + id + '" aria-label="' + et + ' kaydedilsin"' + (O.yaz[id] ? ' checked' : '') + (yanlis ? ' disabled' : '') + ' onchange="fzYaz(\'' + id + '\',this.checked)"><input id="fz-a-' + id + '" class="fz-gir" ' + (tip === 'tel' ? 'inputmode="tel" ' : tip === 'tarih' ? 'type="date" ' : '') + 'value="' + e(v) + '" onchange="fzDeger(\'' + id + '\',this.value,true)"></div>' + (mev && String(mev) !== String(v) ? '<small>Kayıtlı: ' + e(mev) + '</small>' : '') + '</div>';
            }).join('') + '</div>'
            + (OL.some(([id]) => a[id] != null) ? '<label class="fz-onay"><input type="checkbox" id="fz-olcum-yaz"' + (O.olcumYaz ? ' checked' : '') + ' onchange="fzOlcumYaz(this.checked)"><span>Ölçümleri ekle: ' + OL.filter(([id]) => a[id] != null).map(([id, n, b]) => n + ' ' + birim(a[id], b)).map(e).join(' · ') + (a.olcumTarihi ? ' · ' + e(tarihY(a.olcumTarihi)) : '') + '</span></label>' : '')
            + '<div class="fz-alt"><button type="button" class="fz-btn ana" id="fz-oku-kaydet" onclick="fzOkuKaydet()"' + (O.hedef && (O.hedef !== 'yeni' || String(O.deger.sporcuAd || '').trim()) ? '' : ' disabled') + '>Onayla ve kaydet</button></div>');
    }
    window.fzHedef = (v) => { O.hedef = v; kontrolHazirlaYaz(); kontrolCiz(); };
    function kontrolHazirlaYaz() { ALAN.forEach(([id, , alan]) => { if (!alan) return; const sp = hedefSp(), mev = sp && sp[alan], y = O.deger[id]; O.yaz[id] = !!y && (!mev || String(mev) === String(y)) && (alan.indexOf('Telefon') < 0 || telGecerli(y)); }); }
    window.fzYeniGrup = (v) => { O.yeniGrup = v; };
    window.fzDeger = (id, v, ciz) => { O.deger[id] = v; if (ciz) { if (v) O.yaz[id] = true; if (O.belirsiz.includes(id)) O.belirsiz = O.belirsiz.filter((x) => x !== id); kontrolCiz(); } else if (id === 'sporcuAd') { const b = $('fz-oku-kaydet'); if (b && O.hedef === 'yeni') b.disabled = !v.trim(); } };
    window.fzYaz = (id, v) => { O.yaz[id] = v; };
    window.fzOlcumYaz = (v) => { O.olcumYaz = v; };
    window.fzOkuKaydet = async function () {
        const b = $('fz-oku-kaydet'); if (b) b.disabled = true;
        try {
            let g, ad, yeni = O.hedef === 'yeni';
            if (yeni) {
                g = O.yeniGrup; ad = String(O.deger.sporcuAd || '').trim();
                if (!ad) throw new Error('ad'); if (turnuvaDB[g] && turnuvaDB[g][ad]) { tost('Bu adla sporcu zaten var, listeden seç.', 'warning'); if (b) b.disabled = false; return; }
                const c = await fetch('/api/athletes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ grup: g, ad, lastModified: Date.now() }) }); if (!c.ok) throw new Error('yeni');
                turnuvaDB[g] = turnuvaDB[g] || {}; turnuvaDB[g][ad] = { toplamSkor: 0, xAdet: 0, yay: 'Klasik', seriler: [], detayliOklar: [], lastModified: Date.now(), dogumYili: null };
                try { silinenlerDB = silinenlerDB.filter((s) => !(s.grup === g && s.ad === ad)); silinenlerKaydet(); } catch (er) { }
            } else { const i = O.hedef.indexOf('|'); g = O.hedef.slice(0, i); ad = O.hedef.slice(i + 1); }
            const sp = turnuvaDB[g][ad], alan = {};
            ALAN.forEach(([id, , a, tip]) => { if (!a || !O.yaz[id]) return; let v = String(O.deger[id] || '').trim(); if (!v) return; if (tip === 'tel') { if (!telGecerli(v)) return; v = v.replace(/\D/g, ''); if (v.length === 10) v = '0' + v; } alan[a] = v; });
            if (alan.dogumTarihi && /^\d{4}/.test(alan.dogumTarihi)) alan.dogumYili = parseInt(alan.dogumTarihi, 10);
            const zaman = Date.now();
            if (O.olcumYaz) {
                const k = { id: (typeof _cihazId !== 'undefined' && _cihazId ? _cihazId : 'lokal') + '_' + zaman, tarih: /^\d{4}-\d{2}-\d{2}$/.test(O.a.olcumTarihi || '') ? O.a.olcumTarihi : bugun(), not: 'Kayıt formundan', t: zaman };
                OL.forEach(([id]) => { k[id] = O.a[id] == null ? null : O.a[id]; });
                sp.biyomotorTestleri = (sp.biyomotorTestleri || []).concat([k]);
                alan.biyomotorTestleri_json = JSON.stringify(sp.biyomotorTestleri); // sunucu alan adı
            }
            if (Object.keys(alan).length) {
                const r = await fetch('/api/athletes/' + encodeURIComponent(g) + '/' + encodeURIComponent(ad), { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fields: alan, lastModified: zaman }) });
                if (!r.ok) throw new Error('patch');
                const yerel = Object.assign({}, alan); delete yerel.biyomotorTestleri_json; Object.assign(sp, yerel); sp.lastModified = zaman;
                try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); bekleyenGonderim = true; } catch (er) { }
            }
            await fotoYolla(g, ad, 'form', bugun(), O.veri.length > 1800000 ? await kucultVeri(O.veri) : O.veri, true);
            tost(ad + ' kaydedildi.', 'success'); O = null;
            await window.fzDosya(encodeURIComponent(g), encodeURIComponent(ad));
        } catch (er) { console.error(er); if (b) b.disabled = false; tost('Kaydedilemedi. Girdiklerin duruyor, tekrar dene.', 'error'); }
    };
    function kucultVeri(v) { return fetch(v).then((r) => r.blob()).then((bl) => kucult(bl, 1600, 0.72)); }
    window._fzIc = { telGecerli, eslestir, formSayfa };

    function fzCss() {
        if ($('fz-css')) return; const st = document.createElement('style'); st.id = 'fz-css';
        st.textContent = '.fz{color:var(--ks-yazi);font-family:inherit}#fz-liste{background:var(--ks-zemin);padding:16px;border-radius:16px;display:flex;flex-direction:column;gap:12px}'
            + '#fz-ekran{position:fixed;inset:0;z-index:26500;background:var(--ks-zemin);overflow-y:auto}.fz-sayfa{width:min(640px,100%);margin:0 auto;box-sizing:border-box;padding:16px 16px 110px;display:flex;flex-direction:column;gap:12px}'
            + '.fz-ust{display:flex;align-items:center;gap:10px;min-height:44px}.fz-yuv{width:44px;height:44px;flex-shrink:0;border-radius:22px;border:0;background:var(--ks-kart);color:inherit;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}'
            + '.fz-et{margin:0;font-size:12px;font-weight:700;letter-spacing:.1em;color:var(--ks-soluk);text-transform:uppercase}.fz-h{margin:0;font-family:var(--ks-baslik-font,sans-serif);font-weight:800;font-size:38px;line-height:1;text-transform:uppercase;overflow-wrap:anywhere;color:var(--ks-yazi)}'
            + '.fz-bas{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:12px}.fz-is{display:flex;flex-wrap:wrap;gap:8px}.fz-suz{display:flex;flex-wrap:wrap;gap:8px;align-items:center}'
            + '.fz-gir{min-height:44px;box-sizing:border-box;width:100%;padding:0 14px;border-radius:14px;border:1px solid var(--ks-cizgi);background:var(--ks-kart);color:var(--ks-yazi);font:inherit;font-size:15px}.fz-suz .fz-gir{flex:1 1 180px;width:auto}.fz-suz .fz-gir.kisa{flex:0 1 160px}'
            + '.fz-btn{min-height:48px;padding:0 18px;border-radius:24px;border:0;font:inherit;font-size:14.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:8px;cursor:pointer}.fz-btn.ana{background:var(--ks-vurgu);color:var(--ks-vurgu-yazi)}.fz-btn.acik{background:var(--ks-acik);color:var(--ks-acik-yazi)}.fz-btn.tehlike{background:transparent;border:1px solid var(--ks-kirmizi,#FF7A5C);color:var(--ks-kirmizi,#FF7A5C)}.fz-btn:disabled{opacity:.45;cursor:default}'
            + '.fz-cip{min-height:44px;padding:0 14px;border-radius:22px;border:1px solid var(--ks-cizgi);background:var(--ks-kart);color:inherit;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer}.fz-cip.on{background:var(--ks-acik);border-color:var(--ks-acik);color:var(--ks-acik-yazi);font-weight:800}.fz-cipler{display:flex;flex-wrap:wrap;gap:6px}'
            + '.fz-tablo{display:flex;flex-direction:column;border-radius:16px;background:var(--ks-kart);padding:2px 14px}.fz-sat{display:grid;grid-template-columns:minmax(0,1.7fr) .8fr 1.1fr 1fr .8fr;gap:10px;align-items:center;min-height:56px;border:0;border-bottom:1px solid var(--ks-cizgi);background:transparent;color:inherit;font:inherit;font-size:13.5px;text-align:left;cursor:pointer;padding:6px 0}.fz-sat b{font-weight:800;overflow-wrap:anywhere}.fz-sol{color:var(--ks-soluk)}.fz-eks{color:var(--ks-kirmizi,#FF7A5C);font-weight:700}'
            + '@media(max-width:720px){.fz-sat{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.fz-sat b{grid-column:1/-1}}'
            + '.fz-bos,.fz-yuk{margin:16px 0;text-align:center;color:var(--ks-soluk);font-size:14px}.fz-not{margin:0;font-size:13px;line-height:1.45;color:var(--ks-soluk)}.fz-gizli{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden}'
            + '.fz-olcum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.fz-olcum div{padding:10px 12px;border-radius:14px;background:var(--ks-kart);display:flex;flex-direction:column;gap:1px;min-width:0}.fz-olcum span{font-size:12px;color:var(--ks-soluk)}.fz-olcum b{font-size:16px;font-weight:800}'
            + '.fz-fbas{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-top:4px}.fz-gun{margin:6px 0;font-size:14px;font-weight:800;color:var(--ks-yazi)}.fz-izgara{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}'
            + '.fz-foto{aspect-ratio:3/4;border-radius:14px;border:1px solid var(--ks-cizgi);background:var(--ks-kart2) center/cover no-repeat;color:var(--ks-soluk);font:inherit;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:flex-end;padding:0;overflow:hidden}.fz-foto span{width:100%;padding:6px;background:rgba(0,0,0,.65);color:#fff}'
            + '.fz-alt{position:fixed;left:0;right:0;bottom:0;padding:12px max(16px,calc(50% - 304px)) calc(14px + env(safe-area-inset-bottom));background:var(--ks-zemin);border-top:1px solid var(--ks-cizgi);display:flex;gap:8px}.fz-alt .fz-btn{flex:1}'
            + '.fz-buyuk{height:70vh;border-radius:16px;background:var(--ks-kart2) center/contain no-repeat}.fz-sec{min-height:150px;border-radius:18px;border:1.5px dashed var(--ks-vurgu2);color:var(--ks-vurgu2);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:14px;cursor:pointer;overflow:hidden}.fz-sec img{max-width:100%;max-height:320px;display:block}'
            + '.fz-onay{display:flex;align-items:center;gap:10px;min-height:44px;font-size:14px;font-weight:600;cursor:pointer}.fz-onay input,.fz-ks-sat input[type=checkbox]{appearance:auto !important;-webkit-appearance:checkbox !important;width:22px;height:22px;flex-shrink:0;accent-color:var(--ks-vurgu)}'
            + '.fz-iki{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fz-iki>div{display:flex;flex-direction:column;gap:6px;min-width:0}.fz-yan{aspect-ratio:3/4;border-radius:14px;background:var(--ks-kart2) center/cover no-repeat}.fz-yan.bos{display:flex;align-items:center;justify-content:center;color:var(--ks-soluk);font-size:13px;text-align:center;padding:8px}'
            + '.fz-fark{border-radius:16px;background:var(--ks-kart);padding:12px 14px;display:flex;flex-direction:column;gap:6px}.fz-fs{display:grid;grid-template-columns:minmax(0,1fr) 62px 62px 66px;gap:6px;align-items:center;min-height:36px;border-top:1px solid var(--ks-cizgi);font-size:13px}.fz-fs b{font-weight:800}.fz-fs span{color:var(--ks-soluk)}.fz-fs i{font-style:normal;font-weight:800;text-align:right;color:var(--ks-vurgu2)}'
            + '.fz-liste-btn{display:flex;flex-direction:column;gap:8px}.fz-uyari{padding:10px 12px;border-radius:12px;background:rgba(255,122,92,.14);color:var(--ks-kirmizi,#FF7A5C);font-size:13.5px;font-weight:700;line-height:1.45}'
            + '.fz-kontrol{display:flex;flex-direction:column;gap:8px}.fz-ks{padding:10px 12px;border-radius:14px;background:var(--ks-kart);border:1px solid transparent;display:flex;flex-direction:column;gap:5px}.fz-ks label{font-size:12px;font-weight:700;color:var(--ks-soluk)}.fz-ks small{font-size:12px;color:var(--ks-vurgu2);font-weight:700}.fz-ks.bel{border-color:#E8B93C;background:rgba(232,185,60,.1)}.fz-ks.yanlis{border-color:var(--ks-kirmizi,#FF7A5C);background:rgba(255,122,92,.1)}.fz-ks-sat{display:flex;align-items:center;gap:10px}.fz-ks-sat .fz-gir{flex:1;min-width:0}'
            + '#fz-ekran button:focus-visible,.fz button:focus-visible,.fz input:focus-visible,.fz select:focus-visible{outline:3px solid var(--ks-vurgu2);outline-offset:2px}';
        document.head.appendChild(st);
    }
})();
