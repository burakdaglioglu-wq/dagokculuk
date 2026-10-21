// 📊 Aidat paneli (2026-10-21) — DAĞ (app.js) ve Milo (milo/app.js) ortak. Kullanıcı: "bir sürü sporcu ismi düşünce kasıyor,
// basit bir site dashboard'u olsun: tahminler, istatistikler, kaçan / ödenmemiş ödemeler; belki ödendi ben girmedim, tıklayıp
// donmadan halledeyim" → tema B · Gece Kontrol (koyu grafit). Liste sayfalı (20 satır), arama yalnız tabloyu yeniden çizer.
// Adaptör (kulüp tarafı verir):
//   hazirla(ay)            — her çizimden önce bir kez (indeks kurmak için)
//   kisiler()              — [{ id, ad, grup, grupAd, muaf, tel, katilma }] aktif sporcular
//   kayit(ad, ay)          — { odendi, tutar, odemeTarihi, tarih, notMetin } | null
//   aylik(kisi)            — aylık tutar (₺)
//   devam(kisi, ay)        — o ay geldiği gün sayısı | null (bilinmiyor)
//   kaydet([{ kisi, ay, tutar, odemeTarihi, notMetin }]) — Promise
//   hatirlat(kisi, ay)     — WhatsApp hatırlatma
//   detay(kisi)            — sporcunun ayrıntılı kartını aç
//   pdf(ay, grup)          — liste PDF'i
//   araclar                — [[etiket, 'onclick kodu']] alt araç düğmeleri
(function () {
    const AP = window.AP = { ay: null, grup: 'tumu', arama: '', liste: 'bekleyen', sayfa: 0, acik: null, sec: {}, el: null, a: null, v: null, z: null };
    const SAYFA = 20;
    const AY_UZUN = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const AY_KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const tl = n => Math.round(n || 0).toLocaleString('tr-TR') + '₺';
    const ayEkle = (ay, n) => { let p = ay.split('-').map(Number), d = new Date(p[0], p[1] - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
    const buAy = () => { let d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
    const bugun = () => { let d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const ayAd = ay => AY_UZUN[+ay.slice(5, 7) - 1] + ' ' + ay.slice(0, 4);
    const ayKisa = ay => AY_KISA[+ay.slice(5, 7) - 1];
    const aySonu = ay => { let p = ay.split('-').map(Number), d = new Date(p[0], p[1], 0); return ay + '-' + String(d.getDate()).padStart(2, '0'); };
    // ödeme günü: odemeTarihi (gerçek gün) yoksa tarih (kayıt anı, bazen saatli damga) → yerel gün
    function odemeGunu(r) {
        if (!r) return '';
        if (r.odemeTarihi) return String(r.odemeTarihi).slice(0, 10);
        let t = String(r.tarih || ''); if (!t) return '';
        if (t.length > 10 && t.indexOf('T') === 10) { let d = new Date(t); if (!isNaN(d)) return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
        return t.slice(0, 10);
    }
    const gunGoster = iso => iso ? iso.split('-').reverse().join('.') : '—';
    window.apOdemeGunu = odemeGunu;

    function css() {
        if (document.getElementById('ap-css')) return;
        let s = document.createElement('style'); s.id = 'ap-css';
        s.textContent = `
.ap{--ap-zemin:#14171c;--ap-kart:#1c2027;--ap-kart2:#222833;--ap-yazi:#e8ebf0;--ap-soluk:#8f98a7;--ap-cizgi:#2b313b;--ap-vurgu:#d4a73a;--ap-vurgu-yazi:#17130a;--ap-bek:#2e3540;--ap-iyi:#3fbf7f;--ap-iyi-z:rgba(63,191,127,.13);--ap-kotu:#ef6461;--ap-kotu-z:rgba(239,100,97,.13);--ap-uyari:#e8a33d;--ap-uyari-z:rgba(232,163,61,.13);--ap-mor:#a78bfa;--ap-mor-z:rgba(167,139,250,.13);
 background:var(--ap-zemin);color:var(--ap-yazi);border:1px solid var(--ap-cizgi);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:12px;font-size:14px;text-align:left}
.ap *{box-sizing:border-box}
.ap .ap-num{font-variant-numeric:tabular-nums}
.ap .ap-bas{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
.ap .ap-bas h2{margin:0;font-size:18px;font-weight:800;color:var(--ap-yazi)}
.ap .ap-bas small{display:block;color:var(--ap-soluk);font-size:12.5px;font-weight:500;margin-top:2px}
.ap .ap-arac{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.ap .ap-btn{font:inherit;font-weight:700;font-size:13px;padding:8px 12px;border-radius:8px;border:1px solid var(--ap-cizgi);background:var(--ap-kart);color:var(--ap-yazi);cursor:pointer;line-height:1.2;transform:none!important}
.ap .ap-btn:hover{border-color:var(--ap-soluk)}
.ap .ap-btn:disabled{opacity:.45;cursor:default}
.ap .ap-btn.ana{background:var(--ap-vurgu);border-color:var(--ap-vurgu);color:var(--ap-vurgu-yazi)}
.ap .ap-btn.iyi{background:var(--ap-iyi);border-color:var(--ap-iyi);color:#06140c}
.ap .ap-btn:focus-visible,.ap input:focus-visible,.ap select:focus-visible{outline:2px solid var(--ap-vurgu);outline-offset:2px}
.ap select,.ap input[type=text],.ap input[type=date],.ap input[type=number],.ap input[type=search]{font:inherit;font-size:13px;padding:8px 10px;border-radius:8px;border:1px solid var(--ap-cizgi);background:var(--ap-kart);color:var(--ap-yazi);min-height:36px}
.ap .ap-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}
.ap .ap-kpi>div{background:var(--ap-kart);border:1px solid var(--ap-cizgi);border-radius:10px;padding:11px 13px;display:flex;flex-direction:column;gap:2px;min-width:0}
.ap .ap-kpi small{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ap-soluk)}
.ap .ap-kpi b{font-size:21px;font-weight:700;color:var(--ap-yazi)}
.ap .ap-kpi span{font-size:12px;color:var(--ap-soluk)}
.ap .ap-kpi .iyi b{color:var(--ap-iyi)}.ap .ap-kpi .kotu b{color:var(--ap-kotu)}.ap .ap-kpi .uyari b{color:var(--ap-uyari)}
.ap .ap-cubuk{height:6px;border-radius:9px;background:var(--ap-cizgi);overflow:hidden;margin-top:5px}
.ap .ap-cubuk i{display:block;height:100%;background:var(--ap-iyi)}
.ap .ap-iki{display:grid;grid-template-columns:1.35fr 1fr;gap:10px}
@media (max-width:820px){.ap .ap-iki{grid-template-columns:1fr}}
.ap .ap-panel{background:var(--ap-kart);border:1px solid var(--ap-cizgi);border-radius:10px;padding:12px 14px;min-width:0}
.ap .ap-panel h3{margin:0 0 10px;font-size:13.5px;font-weight:800;color:var(--ap-yazi);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap}
.ap .ap-panel h3 span{font-weight:500;color:var(--ap-soluk);font-size:12px}
.ap .ap-grafik{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;align-items:end;height:150px}
.ap .ap-grafik>div{display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end;min-width:0}
.ap .ap-grafik .s{width:100%;max-width:42px;position:relative;height:108px}
.ap .ap-grafik .s em{position:absolute;left:0;right:0;bottom:0;border-radius:4px 4px 0 0;background:var(--ap-bek)}
.ap .ap-grafik .s i{position:absolute;left:0;right:0;bottom:0;border-radius:4px 4px 0 0;background:var(--ap-vurgu)}
.ap .ap-grafik .s i.t{background:repeating-linear-gradient(45deg,rgba(212,167,58,.55) 0 4px,transparent 4px 8px);border:1px solid var(--ap-vurgu)}
.ap .ap-grafik small{font-size:11.5px;color:var(--ap-soluk)}
.ap .ap-grafik b{font-size:11px;font-weight:700;color:var(--ap-yazi)}
.ap .ap-grafik .on small{color:var(--ap-vurgu);font-weight:800}
.ap .ap-leje{display:flex;gap:14px;font-size:12px;color:var(--ap-soluk);margin-top:8px;flex-wrap:wrap}
.ap .ap-leje i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.ap .ap-yas{display:flex;flex-direction:column;gap:9px}
.ap .ap-yas>div{display:grid;grid-template-columns:96px 1fr 92px;gap:8px;align-items:center;font-size:13px}
.ap .ap-yas .bar{height:10px;border-radius:9px;background:var(--ap-cizgi);overflow:hidden}
.ap .ap-yas .bar i{display:block;height:100%}
.ap .ap-yas .sag{text-align:right}
.ap .ap-ipucu{margin-top:12px;padding:10px 12px;border-radius:8px;background:var(--ap-uyari-z);color:var(--ap-yazi);font-size:13px;line-height:1.45}
.ap .ap-ipucu+.ap-ipucu{margin-top:6px}
.ap .ap-ipucu.mavi{background:var(--ap-iyi-z)}
.ap .ap-ipucu button{margin-left:6px;padding:4px 9px;font-size:12px}
.ap .ap-sekmeler{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.ap .ap-sekmeler button{font:inherit;font-size:12.5px;font-weight:700;padding:7px 11px;border-radius:99px;border:1px solid var(--ap-cizgi);background:transparent;color:var(--ap-soluk);cursor:pointer;transform:none!important}
.ap .ap-sekmeler button[aria-pressed=true]{background:var(--ap-kart2);border-color:var(--ap-vurgu);color:var(--ap-yazi)}
.ap .ap-sekmeler b{font-variant-numeric:tabular-nums;margin-left:4px}
.ap .ap-filtre{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:8px}
.ap .ap-filtre input[type=search]{flex:1 1 200px}
.ap .ap-filtre label{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--ap-soluk);cursor:pointer}
.ap .ap-satirlar{display:flex;flex-direction:column}
.ap .ap-sat{display:grid;grid-template-columns:26px minmax(0,1.6fr) 130px 90px 96px 70px minmax(190px,auto);gap:8px;align-items:center;padding:9px 4px;border-top:1px solid var(--ap-cizgi);font-size:13.5px}
.ap .ap-sat.bas{border-top:0;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ap-soluk);padding-top:2px}
.ap .ap-sat.od{grid-template-columns:minmax(0,1.4fr) 100px 90px minmax(0,1.6fr) 90px}
.ap .ap-sat .ad{min-width:0}
.ap .ap-sat .ad b{display:block;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ap .ap-sat .ad small{display:block;color:var(--ap-soluk);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ap .ap-sat .sag{text-align:right}
.ap .ap-sat .not{color:var(--ap-soluk);font-size:12.5px;min-width:0;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.ap .ap-sat .isl{display:flex;gap:5px;justify-content:flex-end;flex-wrap:wrap}
.ap .ap-sat .isl .ap-btn{padding:6px 9px;font-size:12px}
.ap .ap-sat input[type=checkbox]{width:17px;height:17px;accent-color:var(--ap-vurgu);appearance:auto;-webkit-appearance:checkbox;margin:0}
.ap .ap-etk{font-size:11.5px;font-weight:700;padding:3px 8px;border-radius:99px;white-space:nowrap;display:inline-block}
.ap .ap-etk.k{background:var(--ap-kotu-z);color:var(--ap-kotu)}.ap .ap-etk.u{background:var(--ap-uyari-z);color:var(--ap-uyari)}.ap .ap-etk.i{background:var(--ap-iyi-z);color:var(--ap-iyi)}.ap .ap-etk.m{background:var(--ap-mor-z);color:var(--ap-mor)}
.ap .ap-form{grid-column:1/-1;background:var(--ap-kart2);border-radius:8px;padding:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}
.ap .ap-form label{font-size:12px;color:var(--ap-soluk);display:flex;flex-direction:column;gap:3px}
.ap .ap-form label.yan{flex-direction:row;align-items:center;gap:6px;color:var(--ap-yazi);font-size:12.5px;padding-bottom:8px}
.ap .ap-form input[type=checkbox]{width:17px;height:17px;accent-color:var(--ap-vurgu);appearance:auto;-webkit-appearance:checkbox;margin:0}
.ap .ap-form .genis{min-width:220px;flex:1}
.ap .ap-alt{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:10px;font-size:12.5px;color:var(--ap-soluk);flex-wrap:wrap}
.ap .ap-bos{padding:18px 4px;color:var(--ap-soluk);font-size:13px}
.ap .ap-araclar{display:flex;gap:6px;flex-wrap:wrap}
@media (max-width:760px){
 .ap{padding:12px}
 .ap .ap-sat{grid-template-columns:24px minmax(0,1fr) auto;grid-template-areas:"c ad borc" "c durum durum" "c isl isl";row-gap:5px}
 .ap .ap-sat>.c{grid-area:c;align-self:start;margin-top:3px}.ap .ap-sat>.ad{grid-area:ad}.ap .ap-sat>.borc{grid-area:borc}.ap .ap-sat>.durum{grid-area:durum;display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--ap-soluk)}
 .ap .ap-sat>.son,.ap .ap-sat>.ders{display:none}.ap .ap-sat>.isl{grid-area:isl;justify-content:flex-start}
 .ap .ap-sat.bas{display:none}
 .ap .ap-sat.od{grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"ad tut" "tar tar" "not not" "isl isl"}
 .ap .ap-sat.od>.ad{grid-area:ad}.ap .ap-sat.od>.tut{grid-area:tut}.ap .ap-sat.od>.tar{grid-area:tar;font-size:12px;color:var(--ap-soluk)}.ap .ap-sat.od>.not{grid-area:not}.ap .ap-sat.od>.isl{grid-area:isl;justify-content:flex-start}
 .ap .ap-yas>div{grid-template-columns:84px 1fr 84px}
}
@media (prefers-reduced-motion:reduce){.ap *{transition:none!important}}`;
        document.head.appendChild(s);
    }

    // ---- hesap ----
    function hesapla() {
        let a = AP.a, ay = AP.ay; if (a.hazirla) a.hazirla(ay);
        let hepsi = a.kisiler(), gruplar = [];
        hepsi.forEach(k => { if (!gruplar.some(g => g[0] === k.grup)) gruplar.push([k.grup, k.grupAd || k.grup]); });
        let kisiler = AP.grup === 'tumu' ? hepsi : hepsi.filter(k => k.grup === AP.grup);
        let simdi = buAy(), gecmisAy = ay < simdi, gelecekAy = ay > simdi;
        let uygun = (k, m) => !k.muaf && !(k.katilma && k.katilma > aySonu(m));
        let satirlar = kisiler.map(k => {
            let rec = a.kayit(k.ad, ay), aylik = a.aylik(k) || 0, d;
            if (rec && rec.odendi) d = 'odedi'; else if (k.muaf) d = 'muaf'; else if (k.katilma && k.katilma > aySonu(ay)) d = 'yeni'; else d = 'bekliyor';
            let gec = 0, gecAylar = [];
            for (let i = 1; i <= 6; i++) { let m = ayEkle(ay, -i); if (!uygun(k, m)) break; let r = a.kayit(k.ad, m); if (r && r.odendi) break; gec++; gecAylar.push(m); }
            let son = null; for (let i = 0; i <= 12 && !son; i++) { let m = ayEkle(ay, -i), r = a.kayit(k.ad, m); if (r && r.odendi) son = { ay: m, gun: odemeGunu(r) }; }
            // katılma tarihi yok + son 12 ayda hiç ödemesi yok = aidatı takip edilmiyor (eski kayıt) → eski borç sayılmaz
            if (!k.katilma && !son) { gec = 0; gecAylar = []; }
            let son3 = 0, son3Uygun = 0; for (let i = 1; i <= 3; i++) { let m = ayEkle(ay, -i); if (!uygun(k, m)) continue; son3Uygun++; let r = a.kayit(k.ad, m); if (r && r.odendi) son3++; }
            return { k, rec, aylik, d, gec, gecAylar, son, son3, son3Uygun, devam: null };
        });
        let bek = satirlar.filter(s => s.d === 'bekliyor');
        bek.forEach(s => { s.devam = a.devam ? a.devam(s.k, ay) : null; s.olabilir = !gelecekAy && s.son3Uygun >= 2 && s.son3 >= s.son3Uygun - (s.son3Uygun >= 3 ? 1 : 0) && (s.devam == null ? s.son3 === s.son3Uygun : s.devam > 0); });
        let od = satirlar.filter(s => s.d === 'odedi'), toplanan = od.reduce((t, s) => t + (s.rec.tutar || 0), 0);
        let bekTL = bek.reduce((t, s) => t + s.aylik, 0);
        let kacan = satirlar.filter(s => s.d !== 'muaf').reduce((t, s) => t + s.gec * s.aylik, 0), kacanKisi = satirlar.filter(s => s.d !== 'muaf' && s.gec > 0).length;
        let tahmin = toplanan + (gecmisAy ? 0 : bek.reduce((t, s) => t + s.aylik * (s.son3Uygun ? s.son3 / s.son3Uygun : 0.5), 0));
        let oran = (od.length + bek.length) ? Math.round(od.length / (od.length + bek.length) * 100) : 0;
        // geçen ay bugünkü güne kadarki tahsilat (yalnız içinde bulunulan ay için karşılaştırma)
        let gecenOran = null;
        if (ay === simdi) {
            let gm = ayEkle(ay, -1), gun = String(new Date().getDate()).padStart(2, '0'), sinir = gm + '-' + gun, say = 0, top = 0;
            kisiler.forEach(k => { if (!uygun(k, gm)) return; top++; let r = a.kayit(k.ad, gm); if (r && r.odendi) { let g = odemeGunu(r); if (!g || g <= sinir || g.slice(0, 7) < gm) say++; } });
            if (top) gecenOran = Math.round(say / top * 100);
        }
        let grafik = [-5, -4, -3, -2, -1, 0].map(n => {
            let m = ayEkle(ay, n), t = 0, b = 0;
            kisiler.forEach(k => { let r = a.kayit(k.ad, m); if (r && r.odendi) { t += r.tutar || 0; b += r.tutar || 0; } else if (uygun(k, m)) b += a.aylik(k) || 0; });
            return { m, t, b };
        });
        if (!gecmisAy && !gelecekAy) grafik[5].tahmin = tahmin;
        let yok = bek.filter(s => s.devam === 0);
        return { ay, kisiler, gruplar, satirlar, bek, od, muaf: satirlar.filter(s => s.d === 'muaf'), yeni: satirlar.filter(s => s.d === 'yeni'), toplanan, bekTL, kacan, kacanKisi, tahmin, oran, gecenOran, grafik, yok, gecmisAy, gelecekAy,
            olabilir: bek.filter(s => s.olabilir), geciken: satirlar.filter(s => s.d !== 'muaf' && s.gec > 0) };
    }

    // ---- çizim ----
    window.apCiz = function (el, adaptor) {
        css(); AP.el = el; AP.a = adaptor; if (!AP.ay) AP.ay = buAy();
        // arka plan yenilemesi açık formu / yazılan aramayı silmesin
        let odak = document.activeElement, formAcik = AP.acik && el.querySelector('.ap-form');
        if (formAcik && odak && formAcik.contains(odak)) { AP.bekleyen = true; return; }
        let aramaOdak = odak && odak.id === 'ap-ara', imlec = aramaOdak ? odak.selectionStart : 0;
        let v = AP.v = hesapla();
        if (AP.grup !== 'tumu' && !v.gruplar.some(g => g[0] === AP.grup)) { AP.grup = 'tumu'; v = AP.v = hesapla(); }
        let ms = v.gruplar.length > 1 ? `<select id="ap-grup" aria-label="Grup" onchange="AP.grup=this.value; AP.sayfa=0; AP.sec={}; apYenile()"><option value="tumu">Tüm gruplar</option>${v.gruplar.map(g => `<option value="${esc(g[0])}"${AP.grup === g[0] ? ' selected' : ''}>${esc(g[1])}</option>`).join('')}</select>` : '';
        let aktifSay = v.kisiler.length, ortAylik = v.satirlar.length ? Math.round(v.satirlar.reduce((t, s) => t + s.aylik, 0) / v.satirlar.length) : 0;
        let grupAd = AP.grup === 'tumu' ? 'Tüm gruplar' : ((v.gruplar.find(g => g[0] === AP.grup) || [])[1] || AP.grup);
        let kpi = `
            <div class="iyi"><small>Toplanan</small><b class="ap-num">${tl(v.toplanan)}</b><span>${v.od.length} ödeme · beklenen ${tl(v.toplanan + v.bekTL)}</span><div class="ap-cubuk"><i style="width:${Math.min(100, v.oran)}%"></i></div></div>
            <div><small>Tahsilat oranı</small><b class="ap-num">%${v.oran}</b><span>${v.gecenOran != null ? 'Geçen ay bu tarihte %' + v.gecenOran : v.od.length + ' / ' + (v.od.length + v.bek.length) + ' sporcu'}</span></div>
            <div class="uyari"><small>Bu ay bekleyen</small><b class="ap-num">${tl(v.bekTL)}</b><span>${v.bek.length} sporcu ödemedi</span></div>
            <div class="kotu"><small>Kaçan (eski aylar)</small><b class="ap-num">${tl(v.kacan)}</b><span>${v.kacanKisi ? v.kacanKisi + ' sporcunun önceki ay borcu' : 'Eski aydan borç yok'}</span></div>
            <div><small>${v.gecmisAy ? 'Ay kapandı' : 'Ay sonu tahmini'}</small><b class="ap-num">${tl(Math.round(v.tahmin / 50) * 50)}</b><span>${v.gecmisAy ? 'Bu ay toplanan' : 'Son 3 ayın ödeme alışkanlığına göre'}</span></div>`;
        let mx = Math.max(1, ...v.grafik.map(g => Math.max(g.b, g.t, g.tahmin || 0)));
        let grafik = v.grafik.map(g => `<div class="${g.m === v.ay ? 'on' : ''}" title="${ayAd(g.m)}: toplanan ${tl(g.t)} / beklenen ${tl(g.b)}${g.tahmin ? ' · tahmin ' + tl(g.tahmin) : ''}"><b class="ap-num">${g.t >= 1000 ? (Math.round(g.t / 100) / 10).toLocaleString('tr-TR') + 'B' : g.t}</b><div class="s"><em style="height:${g.b / mx * 100}%"></em>${g.tahmin ? `<i class="t" style="height:${g.tahmin / mx * 100}%"></i>` : ''}<i style="height:${g.t / mx * 100}%"></i></div><small>${ayKisa(g.m)}</small></div>`).join('');
        let g0 = v.bek.filter(s => s.gec === 0), g1 = v.geciken.filter(s => s.gec === 1), g2 = v.geciken.filter(s => s.gec >= 2), gm = Math.max(1, g0.length, g1.length, g2.length);
        let yas = [['Bu ay', g0.length, 'var(--ap-uyari)', g0.reduce((t, s) => t + s.aylik, 0)], ['1 ay gecikme', g1.length, 'var(--ap-kotu)', g1.reduce((t, s) => t + s.aylik, 0)], ['2+ ay gecikme', g2.length, 'var(--ap-kotu)', g2.reduce((t, s) => t + s.aylik * s.gec, 0)]]
            .map(r => `<div><span>${r[0]}</span><span class="bar"><i style="width:${r[1] / gm * 100}%;background:${r[2]}"></i></span><span class="sag ap-num">${r[1]} · ${tl(r[3])}</span></div>`).join('');
        let ipucu = '';
        if (v.olabilir.length) ipucu += `<div class="ap-ipucu mavi"><b>${v.olabilir.length} kişi ödemiş olabilir:</b> derse geliyor ve son aylarda hep ödemiş. Girmeyi unuttuysan listeden tek tıkla işaretle.<button class="ap-btn" onclick="AP.liste='olabilir'; AP.sayfa=0; apTabloCiz(); apTabloGit()">Göster</button></div>`;
        let tutarsiz = v.bek.filter(s => !s.aylik).length;
        if (tutarsiz) ipucu += `<div class="ap-ipucu"><b>${tutarsiz} sporcunun aylık tutarı belli değil</b> (hiç ödemesi yok, varsayılan tutar boş); bekleyen ve tahmin eksik görünür. Aşağıda Diğer araçlar › ⚙️ Varsayılan tutar.</div>`;
        if (v.yok.length) ipucu +=`<div class="ap-ipucu"><b>${v.yok.length} kişi</b> ödemedi ve bu ay hiç derse gelmedi; ayrılmış olabilir, arayın.</div>`;
        if (!ipucu) ipucu = `<div class="ap-ipucu mavi">${v.bek.length ? 'Ödemiş olabilecek kimse görünmüyor.' : 'Bu ay herkes ödedi.'}</div>`;
        let araclar = (AP.a.araclar || []).map(x => `<button class="ap-btn" onclick="${x[1]}">${x[0]}</button>`).join('');
        el.innerHTML = `<div class="ap" role="region" aria-label="Aidat paneli">
            <div class="ap-bas">
                <div><h2>Aidat · ${ayAd(v.ay)}</h2><small>${esc(grupAd)} · ${aktifSay} aktif sporcu${ortAylik ? ' · ort. aylık ' + tl(ortAylik) : ''}</small></div>
                <div class="ap-arac"><button class="ap-btn" onclick="apAyKaydir(-1)" aria-label="Önceki ay">◀ ${ayKisa(ayEkle(v.ay, -1))}</button>${v.ay !== buAy() ? `<button class="ap-btn" onclick="AP.ay=null; AP.sayfa=0; apYenile()">Bu ay</button>` : ''}<button class="ap-btn" onclick="apAyKaydir(1)" aria-label="Sonraki ay">${ayKisa(ayEkle(v.ay, 1))} ▶</button>${ms}${AP.a.pdf ? `<button class="ap-btn ana" onclick="AP.a.pdf(AP.ay, AP.grup)">📄 Liste PDF</button>` : ''}</div>
            </div>
            <div class="ap-kpi">${kpi}</div>
            <div class="ap-iki">
                <div class="ap-panel"><h3>Son 6 ay · toplanan / beklenen <span>${v.grafik[5].tahmin ? ayKisa(v.ay) + ' = tahminli' : ''}</span></h3><div class="ap-grafik">${grafik}</div>
                    <div class="ap-leje"><span><i style="background:var(--ap-vurgu)"></i>Toplanan</span><span><i style="background:var(--ap-bek)"></i>Beklenen</span>${v.grafik[5].tahmin ? '<span><i style="border:1px solid var(--ap-vurgu)"></i>Ay sonu tahmini</span>' : ''}</div></div>
                <div class="ap-panel"><h3>Ödemeyenler · gecikme süresi <span>${v.bek.length} kişi</span></h3><div class="ap-yas">${yas}</div>${ipucu}</div>
            </div>
            <div class="ap-panel" id="ap-tablo-panel"><div id="ap-tablo"></div></div>
            ${araclar ? `<div class="ap-panel"><h3>Diğer araçlar</h3><div class="ap-araclar">${araclar}</div></div>` : ''}
        </div>`;
        apTabloCiz();
        if (aramaOdak) { let e = document.getElementById('ap-ara'); if (e) { e.focus(); try { e.setSelectionRange(imlec, imlec); } catch (x) {} } }
    };
    window.apYenile = function () { if (AP.el && AP.a) { AP.acik = null; apCiz(AP.el, AP.a); } };
    window.apAyKaydir = function (n) { AP.ay = ayEkle(AP.ay || buAy(), n); AP.sayfa = 0; AP.sec = {}; AP.acik = null; apYenile(); };
    window.apTabloGit = function () { let e = document.getElementById('ap-tablo-panel'); if (e) e.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

    function liste(v) {
        let L = { bekleyen: v.bek, olabilir: v.olabilir, geciken: v.geciken, odedi: v.od, muaf: v.muaf.concat(v.yeni) }[AP.liste] || v.bek;
        let q = AP.arama.trim().toLocaleLowerCase('tr');
        if (q) L = L.filter(s => (s.k.ad + ' ' + (s.k.grupAd || '')).toLocaleLowerCase('tr').includes(q));
        let sira = AP.liste === 'odedi' ? (x, y) => (odemeGunu(y.rec) || '').localeCompare(odemeGunu(x.rec) || '') : (x, y) => (y.gec - x.gec) || (y.olabilir - x.olabilir) || x.k.ad.localeCompare(y.k.ad, 'tr');
        return L.slice().sort(sira);
    }
    window.apTabloCiz = function () {
        let kap = document.getElementById('ap-tablo'), v = AP.v; if (!kap || !v) return;
        let L = liste(v), sayfaSay = Math.max(1, Math.ceil(L.length / SAYFA)); if (AP.sayfa >= sayfaSay) AP.sayfa = sayfaSay - 1;
        let parca = L.slice(AP.sayfa * SAYFA, AP.sayfa * SAYFA + SAYFA);
        let sek = (k, et, n) => `<button aria-pressed="${AP.liste === k}" onclick="AP.liste='${k}'; AP.sayfa=0; AP.acik=null; apTabloCiz()">${et}<b>${n}</b></button>`;
        let odediMi = AP.liste === 'odedi', muafMi = AP.liste === 'muaf';
        let secSay = Object.keys(AP.sec).filter(id => AP.sec[id]).length;
        let satir;
        if (odediMi) {
            satir = `<div class="ap-sat od bas"><span>Sporcu</span><span>Ödeme günü</span><span class="sag">Tutar</span><span>Not</span><span></span></div>` + parca.map(s => `<div class="ap-sat od"><div class="ad"><b title="${esc(s.k.ad)}">${esc(s.k.ad)}</b><small>${esc(s.k.grupAd || '')}</small></div><span class="tar ap-num">${gunGoster(odemeGunu(s.rec))}</span><span class="tut sag ap-num">${s.rec.tutar ? tl(s.rec.tutar) : 'paket'}</span><span class="not" title="${esc(s.rec.notMetin || '')}">${esc(s.rec.notMetin || '—')}</span><span class="isl">${AP.a.detay ? `<button class="ap-btn" onclick="apDetay('${esc(s.k.id)}')">Düzenle</button>` : ''}</span></div>`).join('');
        } else {
            satir = `<div class="ap-sat bas"><span></span><span>Sporcu</span><span>Durum</span><span class="sag">Borç</span><span>Son ödeme</span><span>Ders</span><span class="sag">İşlem</span></div>` + parca.map(s => {
                let id = esc(s.k.id), borc = muafMi ? 0 : s.aylik * ((s.d === 'bekliyor' ? 1 : 0) + s.gec);
                let durum = s.d === 'muaf' ? '<span class="ap-etk m">Muaf</span>' : s.d === 'yeni' ? '<span class="ap-etk m">Henüz kayıtlı değildi</span>' : s.d === 'odedi' ? `<span class="ap-etk i">Bu ay ödedi</span>${s.gec ? ` <span class="ap-etk k">${s.gec} ay eski borç</span>` : ''}` : s.olabilir ? '<span class="ap-etk i">Ödemiş olabilir</span>' : s.gec >= 1 ? `<span class="ap-etk k">${s.gec + 1} aydır yok</span>` : s.devam === 0 ? '<span class="ap-etk u">Derse gelmiyor</span>' : '<span class="ap-etk u">Bu ay</span>';
                let odenebilir = s.d === 'bekliyor' || (s.d === 'odedi' && s.gec > 0);
                let r = `<div class="ap-sat"><span class="c">${odenebilir ? `<input type="checkbox" ${AP.sec[s.k.id] ? 'checked' : ''} onchange="AP.sec['${id}']=this.checked; apSecimYaz()" aria-label="${esc(s.k.ad)} seç">` : ''}</span>
                    <div class="ad"><b title="${esc(s.k.ad)}">${esc(s.k.ad)}</b><small>${esc(s.k.grupAd || '')}${s.k.tel ? '' : ' · tel yok'}</small></div>
                    <span class="durum">${durum}</span><span class="borc sag ap-num">${borc ? tl(borc) : '—'}</span>
                    <span class="son ap-num">${s.son ? gunGoster(s.son.gun) : 'hiç'}</span><span class="ders ap-num">${s.devam == null ? '—' : s.devam + ' gün'}</span>
                    <span class="isl">${odenebilir ? `<button class="ap-btn iyi" onclick="apFormAc('${id}')">✓ Ödendi</button>` : ''}${odenebilir && AP.a.hatirlat ? `<button class="ap-btn" onclick="apHatirlat('${id}')"${s.k.tel ? '' : ' disabled title="Veli telefonu yok"'}>Hatırlat</button>` : ''}${AP.a.detay ? `<button class="ap-btn" onclick="apDetay('${id}')" aria-label="${esc(s.k.ad)} ayrıntı">⋯</button>` : ''}</span></div>`;
                if (AP.acik === s.k.id) r += apFormHTML(s);
                return r;
            }).join('');
        }
        kap.innerHTML = `<h3 style="margin:0 0 10px;font-size:13.5px;font-weight:800;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">Sporcular <span style="font-weight:500;color:var(--ap-soluk);font-size:12px">${ayAd(v.ay)}</span></h3>
            <div class="ap-sekmeler" role="group" aria-label="Liste">${sek('bekleyen', 'Ödemeyenler', v.bek.length)}${sek('olabilir', 'Ödemiş olabilir', v.olabilir.length)}${sek('geciken', 'Eski borçlu', v.geciken.length)}${sek('odedi', 'Ödeyenler', v.od.length)}${sek('muaf', 'Muaf / yeni', v.muaf.length + v.yeni.length)}</div>
            <div class="ap-filtre"><input type="search" id="ap-ara" placeholder="Sporcu ara" value="${esc(AP.arama)}" oninput="apAra(this.value)" aria-label="Sporcu ara">${odediMi || muafMi ? '' : `<label><input type="checkbox" onchange="apHepsiniSec(this.checked)" ${parca.length && parca.every(s => AP.sec[s.k.id]) ? 'checked' : ''}> Sayfadakileri seç</label><button class="ap-btn" id="ap-toplu" onclick="apToplu()" ${secSay ? '' : 'disabled'}>✓ Seçilenler ödendi${secSay ? ' (' + secSay + ')' : ''}</button>`}</div>
            <div class="ap-satirlar">${parca.length ? satir : `<div class="ap-bos">${AP.arama ? 'Aramaya uyan sporcu yok.' : AP.liste === 'bekleyen' ? 'Bu ay ödemeyen yok.' : 'Bu listede kimse yok.'}</div>`}</div>
            <div class="ap-alt"><span>${L.length ? (AP.sayfa * SAYFA + 1) + '–' + Math.min(L.length, AP.sayfa * SAYFA + SAYFA) + ' / ' + L.length : ''}</span>${sayfaSay > 1 ? `<span style="display:flex;gap:6px;align-items:center"><button class="ap-btn" onclick="AP.sayfa--; AP.acik=null; apTabloCiz()" ${AP.sayfa ? '' : 'disabled'}>‹ Önceki</button><span class="ap-num">${AP.sayfa + 1} / ${sayfaSay}</span><button class="ap-btn" onclick="AP.sayfa++; AP.acik=null; apTabloCiz()" ${AP.sayfa < sayfaSay - 1 ? '' : 'disabled'}>Sonraki ›</button></span>` : ''}</div>`;
    };
    window.apAra = function (q) { AP.arama = q; AP.sayfa = 0; clearTimeout(AP.z); AP.z = setTimeout(function () { let e = document.getElementById('ap-ara'), p = e ? e.selectionStart : 0; apTabloCiz(); let n = document.getElementById('ap-ara'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (x) {} } }, 160); };
    window.apSecimYaz = function () { let n = Object.keys(AP.sec).filter(id => AP.sec[id]).length, b = document.getElementById('ap-toplu'); if (b) { b.disabled = !n; b.textContent = '✓ Seçilenler ödendi' + (n ? ' (' + n + ')' : ''); } };
    window.apHepsiniSec = function (on) { let L = liste(AP.v).slice(AP.sayfa * SAYFA, AP.sayfa * SAYFA + SAYFA); L.forEach(s => { if (s.d === 'bekliyor' || (s.d === 'odedi' && s.gec > 0)) AP.sec[s.k.id] = on; }); apTabloCiz(); };
    const bul = id => AP.v && AP.v.satirlar.find(s => s.k.id === id);
    function apFormHTML(s) {
        let eskiAylar = s.gecAylar.slice().reverse(), buAyBorc = s.d === 'bekliyor';
        return `<div class="ap-form" role="group" aria-label="${esc(s.k.ad)} ödeme">
            <label>Ödeme günü<input type="date" id="ap-f-gun" value="${bugun()}" max="${bugun()}"></label>
            ${buAyBorc ? `<label>${ayKisa(AP.ay)} tutarı<input type="number" id="ap-f-tutar" value="${s.aylik || ''}" inputmode="numeric" style="width:110px"></label>` : ''}
            <label class="genis">Not<input type="text" id="ap-f-not" placeholder="ör. havale, dekont alındı" maxlength="200"></label>
            ${eskiAylar.length ? `<label class="yan"><input type="checkbox" id="ap-f-eski" ${buAyBorc ? '' : 'checked'}> Eski borç da ödendi: ${eskiAylar.map(ayKisa).join(', ')} (${tl(s.aylik * eskiAylar.length)})</label>` : ''}
            <button class="ap-btn ana" onclick="apFormKaydet('${esc(s.k.id)}')">Kaydet</button><button class="ap-btn" onclick="AP.acik=null; apTabloCiz()">Vazgeç</button></div>`;
    }
    window.apFormAc = function (id) { AP.acik = id; apTabloCiz(); setTimeout(function () { let e = document.getElementById('ap-f-not'); if (e) e.focus(); }, 30); };
    window.apFormKaydet = async function (id) {
        let s = bul(id); if (!s) return;
        let gun = (document.getElementById('ap-f-gun') || {}).value || bugun(), notMetin = ((document.getElementById('ap-f-not') || {}).value || '').trim() || null;
        if (gun > bugun()) return apTost('Ödeme günü gelecekte olamaz.', 'error');
        let tEl = document.getElementById('ap-f-tutar'), tutar = tEl ? (parseInt(tEl.value, 10) || 0) : 0, eski = (document.getElementById('ap-f-eski') || {}).checked;
        let isler = [];
        if (s.d === 'bekliyor') { if (!tutar) return apTost('Tutarı yaz.', 'warning'); isler.push({ kisi: s.k, ay: AP.ay, tutar, odemeTarihi: gun, notMetin }); }
        if (eski) s.gecAylar.forEach(m => isler.push({ kisi: s.k, ay: m, tutar: s.aylik, odemeTarihi: gun, notMetin: notMetin || ('Geç ödeme · ' + gunGoster(gun)) }));
        if (!isler.length) return apTost('Kaydedilecek ay seçilmedi.', 'warning');
        await apKaydet(isler, s.k.ad + ' · ' + isler.length + ' ay ödendi olarak kaydedildi');
    };
    window.apToplu = async function () {
        let L = AP.v.satirlar.filter(s => AP.sec[s.k.id] && (s.d === 'bekliyor' || (s.d === 'odedi' && s.gec > 0))); if (!L.length) return;
        let isler = [], gun = bugun();
        L.forEach(s => { if (s.d === 'bekliyor') isler.push({ kisi: s.k, ay: AP.ay, tutar: s.aylik, odemeTarihi: gun, notMetin: null }); });
        let eskiSay = L.filter(s => s.gec > 0).length, eskiDahil = false;
        if (eskiSay) eskiDahil = confirm(L.length + ' sporcu bu ay için ödendi işaretlenecek.\n\n' + eskiSay + ' kişinin eski aylardan da borcu var. Eski borçlar da ödendi sayılsın mı?\n\nTamam = eski borçlar da · İptal = yalnız ' + ayAd(AP.ay));
        else if (!confirm(L.length + ' sporcu ' + ayAd(AP.ay) + ' için ödendi işaretlensin mi? (tutar: her birinin aylık tutarı, ödeme günü bugün)')) return;
        if (eskiDahil) L.forEach(s => s.gecAylar.forEach(m => isler.push({ kisi: s.k, ay: m, tutar: s.aylik, odemeTarihi: gun, notMetin: 'Geç ödeme · ' + gunGoster(gun) })));
        if (!isler.length) return apTost('Kaydedilecek ödeme yok.', 'warning');
        await apKaydet(isler, isler.length + ' ödeme kaydedildi');
    };
    async function apKaydet(isler, mesaj) {
        let b = AP.el && AP.el.querySelectorAll('.ap-form .ap-btn, #ap-toplu'); if (b) b.forEach(x => x.disabled = true);
        try { await AP.a.kaydet(isler); AP.sec = {}; AP.acik = null; apTost('✓ ' + mesaj, 'success'); }
        catch (e) { apTost('Kaydedilemedi: bağlantıyı kontrol et.', 'error'); }
        apYenile();
    }
    window.apHatirlat = function (id) { let s = bul(id); if (s && AP.a.hatirlat) AP.a.hatirlat(s.k, AP.ay); };
    window.apDetay = function (id) { let s = bul(id); if (s && AP.a.detay) AP.a.detay(s.k, AP.ay); };
    function apTost(m, t) { if (typeof showToast === 'function') showToast(m, t || 'info'); else alert(m); }
    // PDF'i olmayan kulüp için: yazdırılabilir liste (tarayıcıda "PDF olarak kaydet")
    window.apYazdir = function (baslik) {
        let v = AP.v; if (!v) return;
        let sat = [].concat(v.bek.map(s => [s, 'ÖDEMEDİ']), v.od.slice().sort((x, y) => (odemeGunu(x.rec) || '').localeCompare(odemeGunu(y.rec) || '')).map(s => [s, 'ÖDEDİ']), v.muaf.map(s => [s, 'MUAF']));
        let w = window.open('', '_blank'); if (!w) return apTost('Açılır pencere engellendi.', 'warning');
        w.document.write(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>${esc(baslik)} · ${ayAd(v.ay)}</title><style>body{font-family:system-ui,sans-serif;color:#111;margin:24px}h1{font-size:18px;margin:0}p{color:#555;font-size:12px;margin:4px 0 14px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#0f172a;color:#fff;text-align:left;padding:6px}td{padding:6px;border-bottom:1px solid #e2e8f0;vertical-align:top}.k{color:#c62828;font-weight:700}.i{color:#15803d;font-weight:700}.m{color:#7c3aed;font-weight:700}.r{text-align:right}</style></head><body>
            <h1>${esc(baslik)} · Aidat ${ayAd(v.ay)}</h1><p>Ödedi ${v.od.length} · Ödemedi ${v.bek.length} · Tahsilat %${v.oran} · Toplanan ${tl(v.toplanan)} · Hazırlanma ${gunGoster(bugun())}</p>
            <table><thead><tr><th>#</th><th>Sporcu</th><th>Grup</th><th>Durum</th><th>Ödeme günü</th><th class="r">Tutar</th><th>Not</th></tr></thead><tbody>${sat.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(x[0].k.ad)}</td><td>${esc(x[0].k.grupAd || '')}</td><td class="${x[1] === 'ÖDEDİ' ? 'i' : x[1] === 'MUAF' ? 'm' : 'k'}">${x[1]}${x[0].gec ? ' · ' + x[0].gec + ' ay eski borç' : ''}</td><td>${x[1] === 'ÖDEDİ' ? gunGoster(odemeGunu(x[0].rec)) : ''}</td><td class="r">${x[1] === 'ÖDEDİ' ? tl(x[0].rec.tutar) : ''}</td><td>${esc((x[0].rec && x[0].rec.notMetin) || '')}</td></tr>`).join('')}</tbody></table>
            <script>setTimeout(function(){print()},300)<\/script></body></html>`);
        w.document.close();
    };
})();
