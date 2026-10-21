// 🏠 Yönetim paneli (yonetim-panel.js) — DAĞ (app.js) ve Milo (milo/app.js) ortak: 📊 aidat paneli (AP) + Genel Bakış, sporcu kartı,
// ekran PDF'i (YN, dosyanın sonunda). Tasarım tek yerde: koyu grafit "Gece Kontrol" (.ap belirteçleri).
// 📊 Aidat paneli (2026-10-21). Kullanıcı: "bir sürü sporcu ismi düşünce kasıyor,
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
    const borclu = s => s.d === 'bekliyor' || s.d === 'takipsiz'; // bu ay ödenebilir (takipsiz: ödeme kaydı/katılma tarihi yok)
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
    window.apCss = css;

    // ---- hesap ----
    function hesapla(a, ay, grupSec) {
        if (a.hazirla) a.hazirla(ay);
        let hepsi = a.kisiler(), gruplar = [];
        hepsi.forEach(k => { if (!gruplar.some(g => g[0] === k.grup)) gruplar.push([k.grup, k.grupAd || k.grup]); });
        let kisiler = grupSec === 'tumu' ? hepsi : hepsi.filter(k => k.grup === grupSec);
        let simdi = buAy(), gecmisAy = ay < simdi, gelecekAy = ay > simdi;
        let uygun = (k, m) => !k.muaf && !(k.katilma && k.katilma > aySonu(m));
        let satirlar = kisiler.map(k => {
            let rec = a.kayit(k.ad, ay), aylik = a.aylik(k) || 0, d;
            if (rec && rec.odendi) d = 'odedi'; else if (k.muaf) d = 'muaf'; else if (k.katilma && k.katilma > aySonu(ay)) d = 'yeni'; else d = 'bekliyor';
            let gec = 0, gecAylar = [];
            for (let i = 1; i <= 6; i++) { let m = ayEkle(ay, -i); if (!uygun(k, m)) break; let r = a.kayit(k.ad, m); if (r && r.odendi) break; gec++; gecAylar.push(m); }
            let son = null; for (let i = 0; i <= 12 && !son; i++) { let m = ayEkle(ay, -i), r = a.kayit(k.ad, m); if (r && r.odendi) son = { ay: m, gun: odemeGunu(r) }; }
            // katılma tarihi yok + son 12 ayda hiç ödemesi yok = aidatı takip edilmiyor (eski kayıt) → eski borç sayılmaz
            if (!k.katilma && !son) { gec = 0; gecAylar = []; if (d === 'bekliyor') d = 'takipsiz'; } // ödemeyen sayılmaz, "Muaf / takipsiz" listesinde
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
        let takipsiz = {}; satirlar.forEach(s => { if (s.d === 'takipsiz') takipsiz[s.k.id] = 1; });
        let grafik = [-5, -4, -3, -2, -1, 0].map(n => {
            let m = ayEkle(ay, n), t = 0, b = 0;
            kisiler.forEach(k => { if (takipsiz[k.id]) return; let r = a.kayit(k.ad, m); if (r && r.odendi) { t += r.tutar || 0; b += r.tutar || 0; } else if (uygun(k, m)) b += a.aylik(k) || 0; });
            return { m, t, b };
        });
        if (!gecmisAy && !gelecekAy) grafik[5].tahmin = tahmin;
        let yok = bek.filter(s => s.devam === 0);
        return { ay, kisiler, gruplar, satirlar, bek, od, muaf: satirlar.filter(s => s.d === 'muaf'), takipsiz: satirlar.filter(s => s.d === 'takipsiz'), yeni: satirlar.filter(s => s.d === 'yeni'), toplanan, bekTL, kacan, kacanKisi, tahmin, oran, gecenOran, grafik, yok, gecmisAy, gelecekAy,
            olabilir: bek.filter(s => s.olabilir), geciken: satirlar.filter(s => s.d !== 'muaf' && s.gec > 0) };
    }

    // Ekran çizmeden aynı hesap — Genel Bakış, kenar rozeti ve yapılacaklar listesi bunu kullanır (sayılar her yerde aynı)
    window.apOzet = (a, ay, grup) => hesapla(a, ay || buAy(), grup || 'tumu');

    // ---- çizim ----
    window.apCiz = function (el, adaptor) {
        css(); AP.el = el; AP.a = adaptor; if (!AP.ay) AP.ay = buAy();
        // arka plan yenilemesi açık formu / yazılan aramayı silmesin
        let odak = document.activeElement, formAcik = AP.acik && el.querySelector('.ap-form');
        if (formAcik && odak && formAcik.contains(odak)) { AP.bekleyen = true; return; }
        let aramaOdak = odak && odak.id === 'ap-ara', imlec = aramaOdak ? odak.selectionStart : 0;
        let v = AP.v = hesapla(AP.a, AP.ay, AP.grup);
        if (AP.grup !== 'tumu' && !v.gruplar.some(g => g[0] === AP.grup)) { AP.grup = 'tumu'; v = AP.v = hesapla(AP.a, AP.ay, AP.grup); }
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
        el.innerHTML = `<div class="ap" id="ap-kok" role="region" aria-label="Aidat paneli">
            <div class="ap-bas">
                <div><h2>Aidat · ${ayAd(v.ay)}</h2><small>${esc(grupAd)} · ${aktifSay} aktif sporcu${ortAylik ? ' · ort. aylık ' + tl(ortAylik) : ''}</small></div>
                <div class="ap-arac"><button class="ap-btn" onclick="apAyKaydir(-1)" aria-label="Önceki ay">◀ ${ayKisa(ayEkle(v.ay, -1))}</button>${v.ay !== buAy() ? `<button class="ap-btn" onclick="AP.ay=null; AP.sayfa=0; apYenile()">Bu ay</button>` : ''}<button class="ap-btn" onclick="apAyKaydir(1)" aria-label="Sonraki ay">${ayKisa(ayEkle(v.ay, 1))} ▶</button>${ms}${AP.a.pdf ? `<button class="ap-btn" onclick="AP.a.pdf(AP.ay, AP.grup)">📄 Liste PDF</button>` : ''}<button class="ap-btn ana" onclick="ynPdf(document.getElementById('ap-kok'), 'aidat')">📄 Ekran PDF</button></div>
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
        let L = { bekleyen: v.bek, olabilir: v.olabilir, geciken: v.geciken, odedi: v.od, muaf: v.muaf.concat(v.takipsiz, v.yeni) }[AP.liste] || v.bek;
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
            satir = `<div class="ap-sat od bas"><span>Sporcu</span><span>Ödeme günü</span><span class="sag">Tutar</span><span>Not</span><span></span></div>` + parca.map(s => `<div class="ap-sat od"><div class="ad"><b title="${esc(s.k.ad)}">${esc(s.k.ad)}</b><small>${esc(s.k.grupAd || '')}</small></div><span class="tar ap-num">${gunGoster(odemeGunu(s.rec))}</span><span class="tut sag ap-num">${s.rec.tutar ? tl(s.rec.tutar) : 'paket'}</span><span class="not" title="${esc(s.rec.notMetin || '')}">${esc(s.rec.notMetin || '—')}</span><span class="isl"><button class="ap-btn" onclick="apDetay('${esc(s.k.id)}')">Kart</button></span></div>`).join('');
        } else {
            satir = `<div class="ap-sat bas"><span></span><span>Sporcu</span><span>Durum</span><span class="sag">Borç</span><span>Son ödeme</span><span>Ders</span><span class="sag">İşlem</span></div>` + parca.map(s => {
                let id = esc(s.k.id), borc = muafMi ? 0 : s.aylik * ((borclu(s) ? 1 : 0) + s.gec);
                let durum = s.d === 'muaf' ? '<span class="ap-etk m">Muaf</span>' : s.d === 'takipsiz' ? '<span class="ap-etk m">Aidat takibi yok</span>' : s.d === 'yeni' ? '<span class="ap-etk m">Henüz kayıtlı değildi</span>' : s.d === 'odedi' ? `<span class="ap-etk i">Bu ay ödedi</span>${s.gec ? ` <span class="ap-etk k">${s.gec} ay eski borç</span>` : ''}` : s.olabilir ? '<span class="ap-etk i">Ödemiş olabilir</span>' : s.gec >= 1 ? `<span class="ap-etk k">${s.gec + 1} aydır yok</span>` : s.devam === 0 ? '<span class="ap-etk u">Derse gelmiyor</span>' : '<span class="ap-etk u">Bu ay</span>';
                let odenebilir = borclu(s) || (s.d === 'odedi' && s.gec > 0);
                let r = `<div class="ap-sat"><span class="c">${odenebilir ? `<input type="checkbox" ${AP.sec[s.k.id] ? 'checked' : ''} onchange="AP.sec['${id}']=this.checked; apSecimYaz()" aria-label="${esc(s.k.ad)} seç">` : ''}</span>
                    <div class="ad"><b title="${esc(s.k.ad)}" style="cursor:pointer" onclick="apDetay('${id}')">${esc(s.k.ad)}</b><small>${esc(s.k.grupAd || '')}${s.k.tel ? '' : ' · tel yok'}</small></div>
                    <span class="durum">${durum}</span><span class="borc sag ap-num">${borc ? tl(borc) : '—'}</span>
                    <span class="son ap-num">${s.son ? gunGoster(s.son.gun) : 'hiç'}</span><span class="ders ap-num">${s.devam == null ? '—' : s.devam + ' gün'}</span>
                    <span class="isl">${odenebilir ? `<button class="ap-btn iyi" onclick="apFormAc('${id}')">✓ Ödendi</button>` : ''}${odenebilir && AP.a.hatirlat ? `<button class="ap-btn" onclick="apHatirlat('${id}')"${s.k.tel ? '' : ' disabled title="Veli telefonu yok"'}>Hatırlat</button>` : ''}<button class="ap-btn" onclick="apDetay('${id}')" aria-label="${esc(s.k.ad)} sporcu kartı">Kart</button></span></div>`;
                if (AP.acik === s.k.id) r += apFormHTML(s);
                return r;
            }).join('');
        }
        kap.innerHTML = `<h3 style="margin:0 0 10px;font-size:13.5px;font-weight:800;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">Sporcular <span style="font-weight:500;color:var(--ap-soluk);font-size:12px">${ayAd(v.ay)}</span></h3>
            <div class="ap-sekmeler" role="group" aria-label="Liste">${sek('bekleyen', 'Ödemeyenler', v.bek.length)}${sek('olabilir', 'Ödemiş olabilir', v.olabilir.length)}${sek('geciken', 'Eski borçlu', v.geciken.length)}${sek('odedi', 'Ödeyenler', v.od.length)}${sek('muaf', 'Muaf / takipsiz', v.muaf.length + v.takipsiz.length + v.yeni.length)}</div>
            <div class="ap-filtre"><input type="search" id="ap-ara" placeholder="Sporcu ara" value="${esc(AP.arama)}" oninput="apAra(this.value)" aria-label="Sporcu ara">${odediMi || muafMi ? '' : `<label><input type="checkbox" onchange="apHepsiniSec(this.checked)" ${parca.length && parca.every(s => AP.sec[s.k.id]) ? 'checked' : ''}> Sayfadakileri seç</label><button class="ap-btn" id="ap-toplu" onclick="apToplu()" ${secSay ? '' : 'disabled'}>✓ Seçilenler ödendi${secSay ? ' (' + secSay + ')' : ''}</button>`}</div>
            <div class="ap-satirlar">${parca.length ? satir : `<div class="ap-bos">${AP.arama ? 'Aramaya uyan sporcu yok.' : AP.liste === 'bekleyen' ? 'Bu ay ödemeyen yok.' : 'Bu listede kimse yok.'}</div>`}</div>
            <div class="ap-alt"><span>${L.length ? (AP.sayfa * SAYFA + 1) + '–' + Math.min(L.length, AP.sayfa * SAYFA + SAYFA) + ' / ' + L.length : ''}</span>${sayfaSay > 1 ? `<span style="display:flex;gap:6px;align-items:center"><button class="ap-btn" onclick="AP.sayfa--; AP.acik=null; apTabloCiz()" ${AP.sayfa ? '' : 'disabled'}>‹ Önceki</button><span class="ap-num">${AP.sayfa + 1} / ${sayfaSay}</span><button class="ap-btn" onclick="AP.sayfa++; AP.acik=null; apTabloCiz()" ${AP.sayfa < sayfaSay - 1 ? '' : 'disabled'}>Sonraki ›</button></span>` : ''}</div>`;
    };
    window.apAra = function (q) { AP.arama = q; AP.sayfa = 0; clearTimeout(AP.z); AP.z = setTimeout(function () { let e = document.getElementById('ap-ara'), p = e ? e.selectionStart : 0; apTabloCiz(); let n = document.getElementById('ap-ara'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (x) {} } }, 160); };
    window.apSecimYaz = function () { let n = Object.keys(AP.sec).filter(id => AP.sec[id]).length, b = document.getElementById('ap-toplu'); if (b) { b.disabled = !n; b.textContent = '✓ Seçilenler ödendi' + (n ? ' (' + n + ')' : ''); } };
    window.apHepsiniSec = function (on) { let L = liste(AP.v).slice(AP.sayfa * SAYFA, AP.sayfa * SAYFA + SAYFA); L.forEach(s => { if (borclu(s) || (s.d === 'odedi' && s.gec > 0)) AP.sec[s.k.id] = on; }); apTabloCiz(); };
    const bul = id => AP.v && AP.v.satirlar.find(s => s.k.id === id);
    function apFormHTML(s) {
        let eskiAylar = s.gecAylar.slice().reverse(), buAyBorc = borclu(s);
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
        if (borclu(s)) { if (!tutar) return apTost('Tutarı yaz.', 'warning'); isler.push({ kisi: s.k, ay: AP.ay, tutar, odemeTarihi: gun, notMetin }); }
        if (eski) s.gecAylar.forEach(m => isler.push({ kisi: s.k, ay: m, tutar: s.aylik, odemeTarihi: gun, notMetin: notMetin || ('Geç ödeme · ' + gunGoster(gun)) }));
        if (!isler.length) return apTost('Kaydedilecek ay seçilmedi.', 'warning');
        await apKaydet(isler, s.k.ad + ' · ' + isler.length + ' ay ödendi olarak kaydedildi');
    };
    window.apToplu = async function () {
        let L = AP.v.satirlar.filter(s => AP.sec[s.k.id] && (borclu(s) || (s.d === 'odedi' && s.gec > 0))); if (!L.length) return;
        let isler = [], gun = bugun();
        L.forEach(s => { if (borclu(s)) isler.push({ kisi: s.k, ay: AP.ay, tutar: s.aylik, odemeTarihi: gun, notMetin: null }); });
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
    window.apDetay = function (id) { if (typeof ynKartAc === 'function') ynKartAc(id, AP.ay); };
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

// =====================================================================================================================
// 🏠 YÖNETİM — Genel Bakış + Sporcu kartı + ekran PDF'i (2026-10-21, kullanıcı: "aidattaki panel gibi bütün yönetici panelini
// düzelt; bir yöneticinin istediği her şey olsun · sporcu kartına tıklayınca halledeyim (ör. pasife aldığım sporcunun geldiği
// aylardaki ödemesini düzelteyim) · raporlar ekranda nasıl görünüyorsa PDF'i de öyle · hem Milo hem DAĞ").
// Aidat sayıları TEK kaynaktan: apOzet() — aidat paneliyle aynı hesap. Kulüp adaptörü (ynKulup ile kaydedilir):
//   ad, aidat (aidat paneli adaptörü), aidatAcik() → bool, aidatKilitAc(pin) → Promise<bool>
//   kisiler()   — TÜM sporcular (pasif dahil): { id, ad, grup, grupAd, pasif, muaf, tel, katilma, dogum, not }
//   gelisler()  — { ad: ['YYYY-MM-DD', …] } derse geldiği günler (sıralı)
//   dersler()   — Promise<[{ saat, bitis, ad, kisi, simdi }]> bugünün kalan dersleri (isteğe bağlı)
//   git(hedef, ops) — 'aidat' (ops.liste) · 'yoklama' · 'uyeler' · 'program'
//   pasifYap(kisi, pasif) → Promise · duzenle(kisi) · aidatTemizle(kisi, ay) → Promise · dersBaslat(i) (isteğe bağlı)
//   ekDikkat() — [{ renk, baslik, alt, dugme: [etiket, 'onclick'] }] kulübe özel yapılacaklar (isteğe bağlı)
(function () {
    const YN = window.YN = { Y: null, el: null, kart: null, kartYil: null, kartAy: null, gelmeyenTum: false, z: null };
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const js = s => esc(String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));
    const tl = n => Math.round(n || 0).toLocaleString('tr-TR') + '₺';
    const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const bugun = () => iso(new Date());
    const gunFark = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
    const ayEkle = (ay, n) => { let p = ay.split('-').map(Number), d = new Date(p[0], p[1] - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
    const AY_K = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const ayKisa = ay => AY_K[+ay.slice(5, 7) - 1];
    const gunYaz = g => g === 0 ? 'bugün' : g === 1 ? 'dün' : g + ' gün önce';
    const telNo = t => { let d = String(t || '').replace(/\D/g, ''); if (d.startsWith('0')) d = '9' + d; else if (d.length === 10) d = '90' + d; return d; };
    window.ynKulup = function (Y) { YN.Y = Y; css(); };
    function css() {
        if (typeof apCss === 'function') apCss();
        if (document.getElementById('yn-css')) return;
        let s = document.createElement('style'); s.id = 'yn-css';
        s.textContent = `
.ap .yn-ara{position:relative;flex:1 1 240px;max-width:360px}.ap .yn-ara input{width:100%}
.ap .yn-ara-liste{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:5;background:var(--ap-kart2);border:1px solid var(--ap-cizgi);border-radius:10px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,.45)}
.ap .yn-ara-liste button{display:flex;width:100%;justify-content:space-between;gap:8px;padding:9px 12px;border:0;border-top:1px solid var(--ap-cizgi);background:transparent;color:var(--ap-yazi);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.ap .yn-ara-liste button:first-child{border-top:0}.ap .yn-ara-liste button:hover,.ap .yn-ara-liste button:focus-visible{background:var(--ap-kart)}
.ap .yn-ara-liste small{color:var(--ap-soluk);white-space:nowrap}
.ap .ap-kpi>button{font:inherit;text-align:left;cursor:pointer;background:var(--ap-kart);border:1px solid var(--ap-cizgi);border-radius:10px;padding:11px 13px;display:flex;flex-direction:column;gap:2px;min-width:0;color:var(--ap-yazi);transform:none!important}
.ap .ap-kpi>button:hover{border-color:var(--ap-soluk)}
.ap .ap-kpi>button small{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ap-soluk)}
.ap .ap-kpi>button b{font-size:21px;font-weight:700}.ap .ap-kpi>button span{font-size:12px;color:var(--ap-soluk)}
.ap .ap-kpi>button.iyi b{color:var(--ap-iyi)}.ap .ap-kpi>button.kotu b{color:var(--ap-kotu)}.ap .ap-kpi>button.uyari b{color:var(--ap-uyari)}.ap .ap-kpi>button.kilit b{color:var(--ap-soluk)}
.ap .yn-is{display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--ap-cizgi)}
.ap .yn-is:first-of-type{border-top:0}.ap .yn-is i{width:8px;height:8px;border-radius:50%;display:block}
.ap .yn-is b{display:block;font-size:13.5px}.ap .yn-is small{display:block;color:var(--ap-soluk);font-size:12px;line-height:1.35}
.ap .yn-is .isl{display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end}.ap .yn-is .ap-btn{padding:6px 9px;font-size:12px}
.ap .yn-ad{background:none;border:0;padding:0;color:inherit;font:inherit;font-weight:700;cursor:pointer;text-align:left;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block}
.ap .yn-ad:hover{text-decoration:underline}
.ap .yn-ders{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:10px;align-items:center;padding:9px 0;border-top:1px solid var(--ap-cizgi)}
.ap .yn-ders:first-of-type{border-top:0}.ap .yn-ders .s{font-weight:800;font-variant-numeric:tabular-nums}.ap .yn-ders .s small{display:block;color:var(--ap-soluk);font-weight:500;font-size:11.5px}
.ap .yn-ders.simdi .s{color:var(--ap-vurgu)}.ap .yn-ders b{display:block}.ap .yn-ders small{color:var(--ap-soluk);font-size:12px}
.ap .yn-tablo{width:100%;border-collapse:collapse;font-size:13px}.ap .yn-tablo-kap{overflow-x:auto}
.ap .yn-tablo th{text-align:left;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ap-soluk);padding:6px 8px;border-bottom:1px solid var(--ap-cizgi);white-space:nowrap}
.ap .yn-tablo td{padding:8px;border-bottom:1px solid var(--ap-cizgi);white-space:nowrap}.ap .yn-tablo tr:last-child td{border-bottom:0}
.ap .yn-tablo .sag{text-align:right}.ap .yn-tablo tbody tr{cursor:pointer}.ap .yn-tablo tbody tr:hover td{background:var(--ap-kart2)}
.ap .yn-mini{display:inline-block;width:56px;height:6px;border-radius:9px;background:var(--ap-cizgi);overflow:hidden;vertical-align:middle;margin-left:6px}.ap .yn-mini i{display:block;height:100%}
.ap .yn-bos{color:var(--ap-soluk);font-size:13px;padding:10px 0}
.yn-profil-arka{position:fixed;inset:0;z-index:26000;background:#0f1216;overflow-y:auto;-webkit-overflow-scrolling:touch}
.yn-profil-arka>.ap.yn-profil{border:0;border-radius:0;min-height:100%;padding:0 0 40px;gap:0}
.ap .yn-p-ust{position:sticky;top:0;z-index:3;display:flex;align-items:center;gap:10px;padding:10px 16px;background:rgba(15,18,22,.97);border-bottom:1px solid var(--ap-cizgi);flex-wrap:wrap}
.ap .yn-p-yol{flex:1 1 140px;min-width:0;color:var(--ap-soluk);font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ap .yn-p-yol b{color:var(--ap-yazi)}
.ap .yn-p-sag{display:flex;gap:6px}
.ap .yn-p-izgara{display:grid;grid-template-columns:290px minmax(0,1fr);gap:16px;padding:16px;max-width:1240px;margin:0 auto;width:100%;align-items:start}
@media (max-width:860px){.ap .yn-p-izgara{grid-template-columns:1fr;padding:12px}}
.ap .yn-p-kimlik{display:flex;flex-direction:column;gap:12px;position:sticky;top:64px}
@media (max-width:860px){.ap .yn-p-kimlik{position:static}}
.ap .yn-p-kart{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:20px 14px}
.ap .yn-av{width:84px;height:84px;border-radius:20px;display:grid;place-items:center;font-weight:700;font-size:30px;background:#3a3020;color:#f0c860;position:relative}
.ap .yn-av-foto{position:absolute;right:-8px;bottom:-8px;width:32px;height:32px;border-radius:50%;border:1px solid var(--ap-cizgi);background:var(--ap-kart2);cursor:pointer;font-size:14px;display:grid;place-items:center;padding:0;transform:none!important}
.ap .yn-p-kart h2{margin:4px 0 0;font-size:19px;line-height:1.25;overflow-wrap:anywhere}
.ap .yn-p-alt{color:var(--ap-soluk);font-size:13px}
.ap .yn-dl{margin:0;display:grid;grid-template-columns:auto 1fr;gap:8px 10px;font-size:13px}.ap .yn-dl dt{color:var(--ap-soluk)}.ap .yn-dl dd{margin:0;text-align:right;overflow-wrap:anywhere}
.ap .yn-p-hizli{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.ap .yn-p-icerik{display:flex;flex-direction:column;gap:12px;min-width:0}
.ap .yn-p-bant{padding:10px 14px;border-radius:10px;background:rgba(212,167,58,.12);border:1px solid rgba(212,167,58,.4);font-size:13px;line-height:1.45}
.ap .yn-alanlar{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px}
@media (max-width:600px){.ap .yn-alanlar{grid-template-columns:1fr}}
.ap .yn-alan{display:flex;flex-direction:column;gap:4px;min-width:0}.ap .yn-alan.tam{grid-column:1/-1}
.ap .yn-alan label{font-size:11.5px;color:var(--ap-soluk);font-weight:600}
.ap .yn-alan .deger{font-size:14px;padding:7px 0;border-bottom:1px dashed var(--ap-cizgi);min-height:34px;overflow-wrap:anywhere;white-space:pre-wrap}
.ap .yn-alan input,.ap .yn-alan select,.ap .yn-alan textarea{font:inherit;font-size:14px;padding:8px 10px;border-radius:8px;border:1px solid var(--ap-cizgi);background:var(--ap-zemin);color:var(--ap-yazi);width:100%;min-height:38px;color-scheme:dark}
.ap .yn-alan textarea{min-height:70px;resize:vertical}
.ap .yn-alan small{color:var(--ap-soluk);font-size:11.5px}
.ap .seg{display:flex;gap:4px;flex-wrap:wrap}
.ap .seg button{font:inherit;font-size:13px;padding:7px 11px;border-radius:8px;border:1px solid var(--ap-cizgi);background:var(--ap-zemin);color:var(--ap-yazi);cursor:pointer;transform:none!important}
.ap .seg button[aria-pressed=true]{border-color:var(--ap-vurgu);background:rgba(212,167,58,.14);color:#f0c860}
.ap .yn-gecmis{display:flex;flex-direction:column}
.ap .yn-olay{display:grid;grid-template-columns:82px 1fr;gap:10px;padding:7px 0;border-top:1px solid var(--ap-cizgi);font-size:12.5px}.ap .yn-olay:first-child{border-top:0}.ap .yn-olay time{color:var(--ap-soluk)}
.ap .yn-tehlike{border:1px solid var(--ap-cizgi);border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.ap .yn-tehlike h4{margin:0;font-size:13px;color:var(--ap-yazi)}
.ap .yn-tehlike .satir{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
.ap .yn-tehlike small{display:block;color:var(--ap-soluk);font-size:12px}
.ap .ap-btn.tehlike{color:var(--ap-kotu);border-color:rgba(239,100,97,.45)}
.yn-mav{display:inline-grid;place-items:center;width:24px;height:24px;border-radius:7px;background:#3a3020;color:#f0c860;font-size:10px;font-weight:700;vertical-align:middle;margin-right:7px}
.yn-isim{cursor:pointer;text-decoration:underline dotted rgba(240,200,96,.55);text-underline-offset:3px}
.yn-profil-ikon{border:0;background:none;padding:0 4px;cursor:pointer;font-size:14px;vertical-align:middle}
.ap .yn-aylar{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}
@media (max-width:480px){.ap .yn-aylar{grid-template-columns:repeat(4,minmax(0,1fr))}}
.ap .yn-aylar button{font:inherit;cursor:pointer;border-radius:9px;border:1px solid var(--ap-cizgi);background:var(--ap-kart2);color:var(--ap-yazi);padding:7px 4px;display:grid;gap:1px;justify-items:center;min-height:62px;transform:none!important}
.ap .yn-aylar button small{font-size:11px;color:var(--ap-soluk);font-weight:700}.ap .yn-aylar button b{font-size:12.5px;font-variant-numeric:tabular-nums}
.ap .yn-aylar button em{font-style:normal;font-size:10.5px;color:var(--ap-soluk)}
.ap .yn-aylar .od{background:var(--ap-iyi-z);border-color:rgba(63,191,127,.45)}.ap .yn-aylar .od b{color:var(--ap-iyi)}
.ap .yn-aylar .bor{background:var(--ap-kotu-z);border-color:rgba(239,100,97,.45)}.ap .yn-aylar .bor b{color:var(--ap-kotu)}
.ap .yn-aylar .muaf b{color:var(--ap-mor)}.ap .yn-aylar .bos{opacity:.55}
.ap .yn-aylar .sec{outline:2px solid var(--ap-vurgu);outline-offset:1px}
.ap .yn-devam{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;align-items:end;height:86px}
.ap .yn-devam div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px;height:100%}
.ap .yn-devam i{display:block;width:100%;max-width:34px;border-radius:4px 4px 0 0;background:var(--ap-iyi);min-height:2px}
.ap .yn-devam small{font-size:11px;color:var(--ap-soluk)}.ap .yn-devam b{font-size:11px}
.ap.yn-pdf-cekim .yn-pdf-gizle{display:none!important}
.ap #yn-ek-yuva .adm-card{background:transparent;border:0;box-shadow:none;padding:0;margin:8px 0 0}
@media print{.yn-profil-arka{position:static}}`;
        document.head.appendChild(s);
    }
    const tost = (m, t) => { if (typeof showToast === 'function') showToast(m, t || 'info'); };

    // ---- veri ----
    function veri() {
        let Y = YN.Y, b = bugun(), ay = b.slice(0, 7), kis = Y.kisiler(), G = Y.gelisler() || {};
        let aktif = kis.filter(k => !k.pasif), son = k => { let l = G[k.ad]; return l && l.length ? l[l.length - 1] : null; };
        let bugunGelen = kis.filter(k => (G[k.ad] || []).indexOf(b) !== -1);
        let yedi = iso(new Date(Date.now() - 6 * 864e5)), son7 = aktif.filter(k => (G[k.ad] || []).some(t => t >= yedi && t <= b)).length;
        // son 8 hafta (pazartesi başlangıç): farklı sporcu sayısı
        let pzt = new Date(); pzt.setHours(12, 0, 0, 0); pzt.setDate(pzt.getDate() - ((pzt.getDay() + 6) % 7));
        let haftalar = []; for (let i = 7; i >= 0; i--) { let a = new Date(pzt); a.setDate(a.getDate() - i * 7); let z = new Date(a); z.setDate(z.getDate() + 6); haftalar.push({ a: iso(a), z: iso(z), n: 0 }); }
        kis.forEach(k => { let l = G[k.ad] || []; haftalar.forEach(h => { if (l.some(t => t >= h.a && t <= h.z)) h.n++; }); });
        let gelmeyen = aktif.map(k => { let s = son(k), ref = s || k.katilma || null; return { k, son: s, gun: ref ? gunFark(ref, b) : null }; })
            .filter(x => x.gun != null && x.gun >= 14).sort((x, y) => x.gun - y.gun);
        let g28 = iso(new Date(Date.now() - 28 * 864e5)), g56 = iso(new Date(Date.now() - 56 * 864e5)), kopan = {};
        gelmeyen.forEach(x => { kopan[x.k.id] = 1; });
        let dusen = aktif.filter(k => !kopan[k.id]).map(k => { let l = G[k.ad] || []; return { k, son: l.filter(t => t > g28).length, once: l.filter(t => t > g56 && t <= g28).length }; })
            .filter(x => x.once >= 4 && x.son <= x.once / 2).sort((x, y) => x.son / x.once - y.son / y.once);
        let dogum = aktif.filter(k => k.dogum).map(k => { let d = new Date(k.dogum + 'T12:00:00'), s = new Date(); s.setHours(12, 0, 0, 0); let bu = new Date(s.getFullYear(), d.getMonth(), d.getDate(), 12); if (bu < s) bu.setFullYear(bu.getFullYear() + 1); return { k, kalan: Math.round((bu - s) / 864e5), yas: bu.getFullYear() - d.getFullYear() }; })
            .filter(x => x.kalan <= 7).sort((x, y) => x.kalan - y.kalan);
        let aidatAcik = Y.aidatAcik ? Y.aidatAcik() : true, v = null;
        if (Y.aidat && typeof apOzet === 'function' && (!Y.aidatHazir || Y.aidatHazir())) { try { v = apOzet(Y.aidat, ay); } catch (e) { v = null; } }
        let gruplar = [];
        kis.forEach(k => { if (!gruplar.some(g => g.id === k.grup)) gruplar.push({ id: k.grup, ad: k.grupAd || k.grup, aktif: 0, gelen: 0, od: 0, bek: 0 }); });
        aktif.forEach(k => { let g = gruplar.find(x => x.id === k.grup); g.aktif++; if ((G[k.ad] || []).some(t => t.slice(0, 7) === ay)) g.gelen++; });
        if (v) { v.od.forEach(s => { let g = gruplar.find(x => x.id === s.k.grup); if (g) g.od++; }); v.bek.forEach(s => { let g = gruplar.find(x => x.id === s.k.grup); if (g) g.bek++; }); }
        return { b, ay, kis, aktif, pasif: kis.length - aktif.length, yeni: aktif.filter(k => k.katilma && k.katilma.slice(0, 7) === ay).length, bugunGelen, son7, haftalar, gelmeyen, dusen, dogum, eksikTel: aktif.filter(k => !k.tel), v, aidatAcik, gruplar: gruplar.filter(g => g.aktif) };
    }

    // ---- Genel Bakış ----
    window.ynCiz = function (el) {
        css(); if (!YN.Y || !el) return;
        let od = document.activeElement; if (od && el.contains(od) && od.id === 'yn-ara-girdi' && od.value) return; // aramada yazarken yenileme silmesin
        YN.el = el;
        let d = YN.d = veri(), Y = YN.Y, v = d.v, saat = new Date().getHours();
        let selam = saat < 12 ? 'Günaydın' : saat < 18 ? 'İyi günler' : 'İyi akşamlar';
        let tarih = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
        let kpi = (cls, et, deger, alt, fn) => `<button class="${cls}" onclick="${fn}"><small>${et}</small><b class="ap-num">${deger}</b><span>${alt}</span></button>`;
        let kilit = !d.aidatAcik, aidatGit = l => `ynGit('aidat',{liste:'${l}'})`;
        let kpiler = kpi('', 'Aktif sporcu', d.aktif.length, (d.yeni ? '+' + d.yeni + ' bu ay katıldı · ' : '') + d.pasif + ' pasif', "ynGit('uyeler')")
            + kpi('iyi', 'Bugün gelen', d.bugunGelen.length, 'Son 7 günde ' + d.son7 + ' farklı sporcu', "ynGit('yoklama')")
            + (!v ? kpi('kilit', 'Aidat', '–', 'Aidat bilgisi henüz yüklenmedi', "ynGit('aidat')")
                : kilit ? kpi('uyari', 'Ödemeyen · ' + ayKisa(d.ay), v.bek.length, '🔒 tutarlar kilitli · dokun, PIN ile aç', aidatGit('bekleyen')) + kpi('', 'Tahsilat · ' + ayKisa(d.ay), '%' + v.oran, v.od.length + ' / ' + (v.od.length + v.bek.length) + ' sporcu ödedi', aidatGit('odedi'))
                : kpi('', 'Tahsilat · ' + ayKisa(d.ay), '%' + v.oran, tl(v.toplanan) + ' / ' + tl(v.toplanan + v.bekTL), aidatGit('odedi'))
                    + kpi('uyari', 'Ödemeyen', v.bek.length, tl(v.bekTL) + ' bekliyor' + (v.olabilir.length ? ' · ' + v.olabilir.length + ' ödemiş olabilir' : ''), aidatGit('bekleyen'))
                    + kpi('kotu', 'Kaçan (eski aylar)', tl(v.kacan), v.kacanKisi + ' sporcunun eski borcu', aidatGit('geciken')))
            + kpi(d.gelmeyen.length ? 'kotu' : '', '14+ gün gelmeyen', d.gelmeyen.length, d.gelmeyen.length ? 'Geri kazanmak için ara' : 'Uzun süredir gelmeyen yok', "document.getElementById('yn-gelmeyen').scrollIntoView({behavior:'smooth',block:'start'})");
        // grafikler
        let hm = Math.max(1, ...d.haftalar.map(h => h.n));
        let katilim = d.haftalar.map((h, i) => `<div class="${i === d.haftalar.length - 1 ? 'on' : ''}" title="${h.a.split('-').reverse().join('.')} haftası: ${h.n} sporcu"><b class="ap-num">${h.n}</b><div class="s"><i style="height:${h.n / hm * 100}%;background:var(--ap-iyi)"></i></div><small>${+h.a.slice(8)} ${ayKisa(h.a)}</small></div>`).join('');
        let aidatGrafik = '';
        if (v && !kilit) { let mx = Math.max(1, ...v.grafik.map(g => Math.max(g.b, g.t, g.tahmin || 0))); aidatGrafik = v.grafik.map(g => `<div class="${g.m === d.ay ? 'on' : ''}" title="${ayKisa(g.m)}: ${tl(g.t)} / ${tl(g.b)}"><b class="ap-num">${g.t >= 1000 ? (Math.round(g.t / 100) / 10).toLocaleString('tr-TR') + 'B' : g.t}</b><div class="s"><em style="height:${g.b / mx * 100}%"></em>${g.tahmin ? `<i class="t" style="height:${g.tahmin / mx * 100}%"></i>` : ''}<i style="height:${g.t / mx * 100}%"></i></div><small>${ayKisa(g.m)}</small></div>`).join(''); }
        // yapılacaklar
        let is = (renk, baslik, alt, dugmeler) => `<div class="yn-is"><i style="background:${renk}"></i><div style="min-width:0"><b>${baslik}</b><small>${alt}</small></div><div class="isl">${(dugmeler || []).map(x => `<button class="ap-btn" onclick="${x[1]}">${x[0]}</button>`).join('')}</div></div>`;
        let isler = '';
        if (v && v.olabilir.length) isler += is('var(--ap-iyi)', v.olabilir.length + ' sporcu ödemiş olabilir', 'Derse geliyor, son aylarda hep ödemiş — girmeyi unutmuş olabilirsin', [['Kontrol et', aidatGit('olabilir')]]);
        if (v && v.bek.length) isler += is('var(--ap-uyari)', v.bek.length + ' sporcu bu ay ödemedi', (kilit ? '' : tl(v.bekTL) + ' bekliyor · ') + 'tek tıkla ödendi ya da WhatsApp hatırlatma', [['Listeyi aç', aidatGit('bekleyen')]]);
        if (v && v.kacanKisi) isler += is('var(--ap-kotu)', v.kacanKisi + ' sporcunun eski aylardan borcu var', kilit ? 'önceki aylardan ödenmemiş' : tl(v.kacan) + ' kaçan para', [['Gör', aidatGit('geciken')]]);
        if (!Y.ekYuva) d.dogum.slice(0, 3).forEach(x => { isler += is('var(--ap-mor)', esc(x.k.ad) + ' · ' + (x.kalan === 0 ? 'bugün' : x.kalan === 1 ? 'yarın' : x.kalan + ' gün sonra') + ' doğum günü', x.yas + ' yaşına giriyor', x.k.tel ? [['🎉 Kutla', `ynWa('${js(x.k.id)}','dogum')`]] : []); });
        if (d.eksikTel.length) isler += is('var(--ap-uyari)', d.eksikTel.length + ' sporcunun veli telefonu yok', d.eksikTel.slice(0, 4).map(k => esc(k.ad.split(' ')[0])).join(', ') + (d.eksikTel.length > 4 ? '…' : '') + ' · hatırlatma gönderilemez', [['İlkini aç', `ynKartAc('${js(d.eksikTel[0].id)}')`]]);
        (Y.ekDikkat ? Y.ekDikkat() : []).forEach(x => { isler += is(x.renk, x.baslik, x.alt, x.dugme ? [x.dugme] : []); });
        if (!isler) isler = '<div class="yn-bos">✓ Bekleyen iş yok.</div>';
        // gelmeyenler
        let gl = YN.gelmeyenTum ? d.gelmeyen : d.gelmeyen.slice(0, 8);
        let gelmeyen = d.gelmeyen.length ? `<div class="yn-tablo-kap"><table class="yn-tablo"><thead><tr><th>Sporcu</th><th>Grup</th><th>Son geliş</th><th class="sag">Gün</th><th class="sag yn-pdf-gizle">İşlem</th></tr></thead><tbody>${gl.map(x => `<tr onclick="ynKartAc('${js(x.k.id)}')"><td style="max-width:220px;overflow:hidden;text-overflow:ellipsis">${Y.avatar ? Y.avatar(x.k) : ''}<b class="yn-isim">${esc(x.k.ad)}</b></td><td>${esc(x.k.grupAd || '')}</td><td class="ap-num">${x.son ? x.son.split('-').reverse().join('.') : 'hiç gelmedi'}</td><td class="sag ap-num" style="color:${x.gun >= 45 ? 'var(--ap-kotu)' : 'var(--ap-uyari)'}">${x.gun}</td><td class="sag yn-pdf-gizle" onclick="event.stopPropagation()">${x.k.tel ? `<button class="ap-btn" onclick="ynWa('${js(x.k.id)}','ozledik')">💬 Yaz</button> ` : ''}<button class="ap-btn" onclick="ynKartAc('${js(x.k.id)}')">Kart</button></td></tr>`).join('')}</tbody></table></div>${d.gelmeyen.length > 8 ? `<div class="ap-alt yn-pdf-gizle"><span>${gl.length} / ${d.gelmeyen.length}</span><button class="ap-btn" onclick="YN.gelmeyenTum=!YN.gelmeyenTum; ynCiz(YN.el)">${YN.gelmeyenTum ? 'Daha az göster' : 'Tümünü göster'}</button></div>` : ''}<div class="yn-bos">45+ gündür gelmeyeni kartından pasife alabilirsin; ödemeyenler listesinden düşer.</div>` : '<div class="yn-bos">✓ 14 günden uzun süredir gelmeyen aktif sporcu yok.</div>';
        // gruplar
        let mini = (o, r) => `<span class="yn-mini"><i style="width:${o}%;background:${r}"></i></span>`;
        let gruplar = `<div class="yn-tablo-kap"><table class="yn-tablo"><thead><tr><th>Grup</th><th class="sag">Aktif</th><th>Bu ay gelen</th>${v ? '<th>Tahsilat</th><th class="sag">Ödemeyen</th>' : ''}</tr></thead><tbody>${d.gruplar.map(g => { let go = Math.round(g.gelen / g.aktif * 100), to = g.od + g.bek ? Math.round(g.od / (g.od + g.bek) * 100) : 0; return `<tr onclick="ynGit('aidat',{liste:'bekleyen',grup:'${js(g.id)}'})"><td><b>${esc(g.ad)}</b></td><td class="sag ap-num">${g.aktif}</td><td class="ap-num">%${go}${mini(go, 'var(--ap-iyi)')}</td>${v ? `<td class="ap-num">%${to}${mini(to, 'var(--ap-vurgu)')}</td><td class="sag ap-num">${g.bek}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>`;
        el.innerHTML = `<div class="ap" id="yn-genel" role="region" aria-label="Genel bakış">
            <div class="ap-bas"><div><h2>${selam}${Y.kullanici ? ', ' + esc(Y.kullanici) : ''}</h2><small>${tarih} · ${esc(Y.ad || '')}</small></div>
                <div class="ap-arac yn-pdf-gizle"><div class="yn-ara"><input type="search" id="yn-ara-girdi" placeholder="Sporcu ara (pasifler dahil)" aria-label="Sporcu ara" autocomplete="off" oninput="ynAra(this.value)" onkeydown="if(event.key==='Enter'){let b=document.querySelector('.yn-ara-liste button'); if(b) b.click();} if(event.key==='Escape'){this.value=''; ynAra('');}"><div id="yn-ara-liste"></div></div>
                ${(Y.araclar || []).map(x => `<button class="ap-btn" onclick="${x[1]}">${x[0]}</button>`).join('')}<button class="ap-btn ana" onclick="ynPdf(document.getElementById('yn-genel'), 'genel-bakis')">📄 PDF</button></div></div>
            <div class="ap-kpi">${kpiler}</div>
            <div class="ap-iki">
                <div class="ap-panel"><h3>Katılım · son 8 hafta <span>haftada derse gelen farklı sporcu</span></h3><div class="ap-grafik" style="grid-template-columns:repeat(${d.haftalar.length},minmax(0,1fr))">${katilim}</div></div>
                <div class="ap-panel"><h3>Aidat · son 6 ay <span>toplanan / beklenen</span></h3>${v && !kilit ? `<div class="ap-grafik">${aidatGrafik}</div><div class="ap-leje"><span><i style="background:var(--ap-vurgu)"></i>Toplanan</span><span><i style="background:var(--ap-bek)"></i>Beklenen</span></div>` : `<div class="yn-bos">${kilit ? '🔒 Aidat kilitli. Görmek için aidatı PIN ile aç.' : 'Aidat bilgisi yükleniyor…'}</div>`}</div>
            </div>
            <div class="ap-iki">
                <div class="ap-panel"><h3>Yapılacaklar <span>öncelik sırasıyla</span></h3>${isler}<div id="yn-ek-yuva"></div></div>
                <div class="ap-panel"><h3>Bugünün dersleri</h3><div id="yn-dersler"><div class="yn-bos">Yükleniyor…</div></div></div>
            </div>
            <div class="ap-panel" id="yn-gelmeyen"><h3>14+ gündür gelmeyenler <span>${d.gelmeyen.length} sporcu · en yeni kopanlar üstte</span></h3>${gelmeyen}</div>
            ${d.dusen.length ? `<div class="ap-panel"><h3>Katılımı düşenler <span>${d.dusen.length} sporcu · son 4 hafta, önceki 4 haftanın yarısı ya da altı — kopmadan önce ara</span></h3><div class="yn-tablo-kap"><table class="yn-tablo"><thead><tr><th>Sporcu</th><th>Grup</th><th class="sag">Önceki 4 hafta</th><th class="sag">Son 4 hafta</th><th class="sag yn-pdf-gizle">İşlem</th></tr></thead><tbody>${d.dusen.slice(0, 10).map(x => `<tr onclick="ynKartAc('${js(x.k.id)}')"><td>${Y.avatar ? Y.avatar(x.k) : ''}<b class="yn-isim">${esc(x.k.ad)}</b></td><td>${esc(x.k.grupAd || '')}</td><td class="sag ap-num">${x.once} ders</td><td class="sag ap-num" style="color:var(--ap-uyari)">${x.son} ders</td><td class="sag yn-pdf-gizle" onclick="event.stopPropagation()">${x.k.tel ? `<button class="ap-btn" onclick="ynWa('${js(x.k.id)}','ozledik')">💬 Yaz</button> ` : ''}<button class="ap-btn" onclick="ynKartAc('${js(x.k.id)}')">Kart</button></td></tr>`).join('')}</tbody></table></div></div>` : ''}
            <div class="ap-panel"><h3>Gruplar <span>${esc(ayKisa(d.ay))} · satıra dokun → o grubun ödemeyenleri</span></h3>${gruplar}</div>
        </div>`;
        if (Y.dersler) Y.dersler().then(l => {
            let e = document.getElementById('yn-dersler'); if (!e) return;
            YN.dersler = l || [];
            e.innerHTML = YN.dersler.length ? YN.dersler.slice(0, 6).map((x, i) => `<div class="yn-ders${x.simdi ? ' simdi' : ''}"><span class="s">${esc(x.saat)}<small>${esc(x.bitis || '')}</small></span><span style="min-width:0"><b>${esc(x.ad)}</b><small>${x.kisi ? x.kisi + ' kayıtlı sporcu' : 'kayıtlı sporcu yok'}${x.simdi ? ' · şimdi' : ''}</small></span>${Y.dersBaslat && x.kisi ? `<button class="ap-btn${x.simdi ? ' ana' : ''} yn-pdf-gizle" onclick="YN.Y.dersBaslat(${i})">▶ Başlat</button>` : '<span></span>'}</div>`).join('') : '<div class="yn-bos">Bugün için kalan ders yok.</div>';
        }).catch(() => { let e = document.getElementById('yn-dersler'); if (e) e.innerHTML = '<div class="yn-bos">Ders programı alınamadı.</div>'; });
        else { let e = document.getElementById('yn-dersler'); if (e) e.innerHTML = '<div class="yn-bos">Ders programı yok.</div>'; }
        if (Y.ekYuva) try { Y.ekYuva(document.getElementById('yn-ek-yuva')); } catch (e) {}
    };
    window.ynGit = function (h, o) { if (YN.Y && YN.Y.git) YN.Y.git(h, o || {}); };
    window.ynAra = function (q) {
        clearTimeout(YN.z); YN.z = setTimeout(function () {
            let kap = document.getElementById('yn-ara-liste'); if (!kap) return;
            q = String(q || '').trim().toLocaleLowerCase('tr'); if (!q) { kap.innerHTML = ''; kap.className = ''; return; }
            let l = YN.Y.kisiler().filter(k => k.ad.toLocaleLowerCase('tr').includes(q)).sort((a, b) => (a.pasif - b.pasif) || a.ad.localeCompare(b.ad, 'tr')).slice(0, 8);
            kap.className = 'yn-ara-liste';
            kap.innerHTML = l.length ? l.map(k => `<button onclick="ynKartAc('${js(k.id)}')"><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(k.ad)}</span><small>${esc(k.grupAd || '')}${k.pasif ? ' · pasif' : ''}</small></button>`).join('') : '<button disabled><span>Sonuç yok</span></button>';
        }, 120);
    };
    window.ynWa = function (id, tip) {
        let k = YN.Y.kisiler().find(x => x.id === id); if (k && tip === 'dogum' && YN.Y.dogumKarti) return YN.Y.dogumKarti(k); // fotoğraflı kart (DAĞ)
        if (!k || !k.tel) return tost('Veli telefonu yok.', 'warning');
        let ilk = k.ad.split(' ')[0]; ilk = ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr');
        let m = tip === 'dogum' ? `Merhaba 🎉 ${YN.Y.ad || ''} ailesi olarak ${ilk}'in doğum gününü kutlarız! Nice mutlu, sağlıklı yıllara 🎂`
            : `Merhaba 🌟 ${YN.Y.ad || ''}'nden yazıyoruz. ${ilk}'i bir süredir derslerde göremedik, onu özledik! Her şey yolunda mı? Uygun olduğunuzda tekrar bekliyoruz 🧡`;
        window.open('https://api.whatsapp.com/send?phone=' + telNo(k.tel) + '&text=' + encodeURIComponent(m), '_blank');
    };

    // ---- Sporcu profili (B · tam sayfa; 2026-10-21, kullanıcı: "nerede bir sporcu adı yazıyorsa üstüne tıklayınca bilgilerini,
    // kategorisini, yaşını, her şeyini düzeltebileyim ve kim bu diye bakabileyim — her yerde"). Solda kimlik, sağda özet · bilgiler
    // (✏️ Düzenle → tüm alanlar) · aidat (aidat PIN'i ile) · devam + geçmiş · kayıt işlemleri. Alanlar/kaydetme kulüp adaptöründen:
    //   kisiBul(id) · alanlar(k) → [{ id, et, tip: metin|tarih|tel|sayi|secim|not, deger, secenekler:[[değer, etiket]], ipucu }]
    //   kaydet(k, degisen) → Promise<yeni id> · ozet(k) → [[etiket, değer]] · kpiEk(k) → [{ et, deger, alt }] · islemler(k) → [{ et, alt, btn, fn, tehlike }]
    window.ynKartAc = function (id, ay) {
        css(); if (!YN.Y) return;
        let l = document.getElementById('yn-ara-liste'); if (l) { l.innerHTML = ''; l.className = ''; }
        YN.kart = id; YN.kartAy = ay || null; YN.kartYil = (ay || bugun()).slice(0, 4); YN.duzen = false;
        let a = document.getElementById('yn-kart'); if (!a) { a = document.createElement('div'); a.id = 'yn-kart'; a.className = 'yn-profil-arka'; document.body.appendChild(a); }
        document.addEventListener('keydown', ynKartEsc);
        ynKartCiz(); a.scrollTop = 0;
    };
    function ynKartEsc(e) { if (e.key === 'Escape' && !YN.duzen) ynKartKapat(); }
    window.ynKartKapat = function () { let a = document.getElementById('yn-kart'); if (a) a.remove(); YN.kart = null; YN.duzen = false; document.removeEventListener('keydown', ynKartEsc); };
    window.ynKartYenile = function () { if (YN.kart && document.getElementById('yn-kart') && !YN.duzen) ynKartCiz(); };
    const ynKisi = () => YN.Y.kisiBul ? YN.Y.kisiBul(YN.kart) : YN.Y.kisiler().find(x => x.id === YN.kart);
    window.ynKisi = ynKisi; // profil düğmeleri (📷 fotoğraf) açık kişiyi alır
    function alanDeger(a) { if (a.tip === 'secim') { let s = (a.secenekler || []).find(x => String(x[0]) === String(a.deger)); return s ? s[1] : (a.deger || '—'); } if (a.tip === 'tarih') return a.deger ? String(a.deger).split('-').reverse().join('.') : '—'; return a.deger === '' || a.deger == null ? '—' : esc(a.deger); }
    function alanGirdi(a) {
        let d = a.deger == null ? '' : String(a.deger);
        if (a.tip === 'secim' && (a.secenekler || []).length <= 5) return `<div class="seg" data-alan="${a.id}" data-tip="seg">${a.secenekler.map(x => `<button type="button" data-v="${esc(x[0])}" aria-pressed="${String(x[0]) === d}" onclick="this.parentNode.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b===this))">${esc(x[1])}</button>`).join('')}</div>`;
        if (a.tip === 'secim') return `<select data-alan="${a.id}">${a.secenekler.map(x => `<option value="${esc(x[0])}"${String(x[0]) === d ? ' selected' : ''}>${esc(x[1])}</option>`).join('')}</select>`;
        if (a.tip === 'not') return `<textarea data-alan="${a.id}" maxlength="500">${esc(d)}</textarea>`;
        return `<input data-alan="${a.id}" type="${a.tip === 'tarih' ? 'date' : a.tip === 'sayi' ? 'number' : a.tip === 'tel' ? 'tel' : 'text'}" value="${esc(d)}"${a.tip === 'tarih' ? ` max="${bugun()}"` : ''}>`;
    }
    function ynKartCiz() {
        let a = document.getElementById('yn-kart'), Y = YN.Y; if (!a) return;
        let k = ynKisi();
        if (!k) { a.innerHTML = '<div class="ap yn-profil"><div class="yn-p-ust"><button class="ap-btn" onclick="ynKartKapat()">← Geri</button></div><div class="yn-bos">Sporcu bulunamadı (silinmiş ya da adı değişmiş olabilir).</div></div>'; return; }
        let G = (Y.gelisler() || {})[k.ad] || [], b = bugun(), ay = b.slice(0, 7), sonG = G.length ? G[G.length - 1] : null;
        let ayGelis = m => G.filter(t => t.slice(0, 7) === m).length, son3 = [0, -1, -2].reduce((t, n) => t + ayGelis(ayEkle(ay, n)), 0);
        let aidatHazir = !Y.aidatHazir || Y.aidatHazir(), aidatAcik = (Y.aidatAcik ? Y.aidatAcik() : true) && aidatHazir, A = Y.aidat;
        if (aidatAcik && A && A.hazirla) A.hazirla(ay);
        let yas = k.yas != null ? k.yas : k.dogum ? Math.floor((Date.now() - new Date(k.dogum + 'T12:00:00')) / (365.25 * 864e5)) : null;
        let durum = (k.pasif ? '<span class="ap-etk k">Pasif</span>' : '<span class="ap-etk i">Aktif</span>') + (k.turAd ? ` <span class="ap-etk m">${esc(k.turAd)}</span>` : '') + (k.muaf ? ' <span class="ap-etk m">Aidattan muaf</span>' : '');
        // aidat: bu yıl ödenmemiş (borç sayılan) aylar
        let acikAy = 0, hucre = '', yil = YN.kartYil;
        let ayDurum = m => { let r = A.kayit(k.ad, m), n = ayGelis(m); if (r && r.odendi) return ['od', r.tutar ? tl(r.tutar) : 'paket']; if (k.muaf) return ['muaf', 'muaf']; if ((k.katilma && k.katilma.slice(0, 7) > m) || m > ay) return ['bos', '—']; if (k.pasif && !n) return ['bos', 'pasif']; if (!k.katilma && !n) return ['bos', '—']; return ['bor', 'yok']; };
        if (aidatAcik) [0, -1, -2, -3, -4, -5].forEach(n => { if (ayDurum(ayEkle(ay, n))[0] === 'bor') acikAy++; });
        if (aidatAcik) for (let i = 1; i <= 12; i++) { let m = yil + '-' + String(i).padStart(2, '0'), d = ayDurum(m), n = ayGelis(m); hucre += `<button class="${d[0]}${YN.kartAy === m ? ' sec' : ''}" onclick="ynKartAySec('${m}')" aria-label="${ayKisa(m)} ${yil}: ${d[1]}${n ? ', ' + n + ' ders' : ''}"><small>${ayKisa(m)}</small><b>${d[1]}</b><em>${n ? n + ' ders' : '·'}</em></button>`; }
        let tile = (cls, et, deger, alt) => `<div class="${cls}"><small>${et}</small><b class="ap-num">${deger}</b><span>${alt}</span></div>`;
        let tiles = tile('', 'Son geliş', sonG ? gunYaz(gunFark(sonG, b)) : '—', sonG ? sonG.split('-').reverse().join('.') : 'yoklama kaydı yok')
            + tile('iyi', 'Bu ay', ayGelis(ay) + ' ders', 'son 3 ayda ' + son3 + ' ders')
            + (!aidatAcik ? tile('', 'Aidat', '🔒', aidatHazir ? 'aidat PIN\'i ile görünür' : 'yükleniyor') : k.muaf ? tile('', 'Aidat', 'Muaf', 'ödeme beklenmiyor') : acikAy ? tile('kotu', 'Aidat · açık', tl(acikAy * A.aylik(k)), acikAy + ' ay ödenmemiş (son 6 ay)') : tile('iyi', 'Aidat', 'Güncel', 'son 6 ayda açık yok'))
            + (Y.kpiEk ? Y.kpiEk(k) : []).map(x => tile('', x.et, x.deger, x.alt)).join('');
        // aidat paneli
        let aidat;
        if (!aidatHazir) aidat = '<div class="yn-bos">Aidat bilgisi yükleniyor…</div>';
        else if (!aidatAcik) aidat = `<div class="yn-bos">🔒 Aidat bilgileri aidat PIN'i ile görünür.</div><div class="ap-filtre yn-pdf-gizle"><input type="password" id="yn-kart-pin" placeholder="Aidat PIN'i" autocomplete="off" style="max-width:180px" onkeydown="if(event.key==='Enter') ynKartPin()"><button class="ap-btn ana" onclick="ynKartPin()">🔓 Göster</button></div>`;
        else {
            let form = '';
            if (YN.kartAy && YN.kartAy.slice(0, 4) === yil) {
                let m = YN.kartAy, r = A.kayit(k.ad, m) || {}, gun = apOdemeGunu(r) || (m === ay ? b : m + '-' + String(Math.min(28, new Date().getDate())).padStart(2, '0'));
                if (gun > b) gun = b;
                form = `<div class="ap-form" style="margin-top:10px" role="group" aria-label="${ayKisa(m)} ödeme">
                    <label>${ayKisa(m)} ${yil} · ödeme günü<input type="date" id="yn-k-gun" value="${gun}" max="${b}"></label>
                    <label>Tutar<input type="number" id="yn-k-tutar" value="${r.tutar || A.aylik(k) || ''}" inputmode="numeric" style="width:110px"></label>
                    <label class="genis">Not<input type="text" id="yn-k-not" value="${esc(r.notMetin || '')}" maxlength="200" placeholder="ör. geç ödedi, elden"></label>
                    <button class="ap-btn iyi" onclick="ynKartKaydet()">✓ Ödendi kaydet</button>${r.odendi || r.notMetin ? `<button class="ap-btn" onclick="ynKartTemizle()">Ödenmedi yap</button>` : ''}<button class="ap-btn" onclick="YN.kartAy=null; ynKartCiz()">Vazgeç</button></div>`;
            }
            aidat = `<div class="ap-alt yn-pdf-gizle" style="margin:0 0 8px"><span>Bir aya dokun → ödendi / ödenmedi</span><span style="display:flex;gap:6px;align-items:center"><button class="ap-btn" onclick="YN.kartYil=String(+YN.kartYil-1); YN.kartAy=null; ynKartCiz()" aria-label="Önceki yıl">‹</button><b class="ap-num">${yil}</b><button class="ap-btn" onclick="YN.kartYil=String(+YN.kartYil+1); YN.kartAy=null; ynKartCiz()" aria-label="Sonraki yıl">›</button></span></div><div class="yn-aylar">${hucre}</div>${form}`;
        }
        // devam + geçmiş (yoklama, ödemeler, katılma — en yeni üstte)
        let aylar6 = [-5, -4, -3, -2, -1, 0].map(n => ayEkle(ay, n)), dm = Math.max(1, ...aylar6.map(ayGelis));
        let devam = aylar6.map(m => `<div><b class="ap-num">${ayGelis(m)}</b><i style="height:${ayGelis(m) / dm * 100}%"></i><small>${ayKisa(m)}</small></div>`).join('');
        let olay = G.slice(-6).map(t => ({ t, m: 'Derse geldi' }));
        if (aidatAcik) for (let n = 0; n < 12; n++) { let m = ayEkle(ay, -n), r = A.kayit(k.ad, m); if (r && r.odendi) olay.push({ t: apOdemeGunu(r) || m + '-01', m: AY_UZUN_TR[+m.slice(5, 7) - 1] + ' aidatı ödendi' + (r.tutar ? ' · ' + tl(r.tutar) : '') + (r.notMetin ? ' · ' + r.notMetin : '') }); }
        if (k.katilma) olay.push({ t: k.katilma, m: 'Kulübe katıldı' });
        olay.sort((x, y) => y.t.localeCompare(x.t));
        let gecmis = olay.length ? olay.slice(0, 10).map(o => `<div class="yn-olay"><time class="ap-num">${o.t.split('-').reverse().join('.')}</time><span>${esc(o.m)}</span></div>`).join('') : '<div class="yn-bos">Kayıt yok.</div>';
        // bilgiler
        let alanlar = Y.alanlar ? Y.alanlar(k) : [];
        let bilgi = `<div class="yn-alanlar">${alanlar.map(x => `<div class="yn-alan${x.tip === 'not' ? ' tam' : ''}"><label>${esc(x.et)}</label>${YN.duzen ? alanGirdi(x) : `<div class="deger">${alanDeger(x)}</div>`}${YN.duzen && x.ipucu ? `<small>${esc(x.ipucu)}</small>` : ''}</div>`).join('')}</div>`;
        let islemler = (Y.islemler ? Y.islemler(k) : []).map(x => `<div class="satir"><span><b>${esc(x.et)}</b><small>${esc(x.alt || '')}</small></span><button class="ap-btn${x.tehlike ? ' tehlike' : ''}" onclick="${x.fn}">${x.btn}</button></div>`).join('');
        let tel = k.tel ? telNo(k.tel) : '', bas = k.ad.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('');
        let ozet = (Y.ozet ? Y.ozet(k) : []).filter(x => x[1] !== '' && x[1] != null);
        let alt = [k.grupAd, yas != null ? yas + ' yaş' : '', k.cinsiyetAd, k.yay].filter(Boolean).map(esc).join(' · ');
        a.innerHTML = `<div class="ap yn-profil" id="yn-kart-ic" role="dialog" aria-modal="true" aria-label="${esc(k.ad)} profili">
            <div class="yn-p-ust yn-pdf-gizle"><button class="ap-btn" onclick="ynKartKapat()">← Geri</button><span class="yn-p-yol">${esc(k.grupAd || '')} › <b>${esc(k.ad)}</b></span>
                <span class="yn-p-sag">${YN.duzen ? `<button class="ap-btn" onclick="YN.duzen=false; ynKartCiz()">Vazgeç</button><button class="ap-btn ana" onclick="ynKartBilgiKaydet()">💾 Kaydet</button>` : `${Y.kaydet ? '<button class="ap-btn ana" onclick="YN.duzen=true; ynKartCiz()">✏️ Düzenle</button>' : ''}<button class="ap-btn" onclick="ynPdf(document.getElementById('yn-kart-ic'), 'sporcu-' + ${JSON.stringify(k.ad).replace(/"/g, '&quot;')})">📄 PDF</button>`}</span></div>
            <div class="yn-p-izgara">
                <aside class="yn-p-kimlik">
                    <div class="ap-panel yn-p-kart"><div class="yn-av"${k.fotoK ? ` data-foto-k="${esc(k.fotoK)}" data-foto-y="1"` : ""}${k.foto ? ` style="background:url('${esc(k.foto)}') center/cover;color:transparent"` : ""}>${esc(bas)}${Y.fotoDegistir ? `<button class="yn-av-foto yn-pdf-gizle" onclick="YN.Y.fotoDegistir(ynKisi())" aria-label="Fotoğrafı değiştir">📷</button>` : ""}</div><h2>${esc(k.ad)}</h2><div class="yn-p-alt">${alt}</div><div>${durum}</div></div>
                    ${ozet.length ? `<div class="ap-panel"><dl class="yn-dl">${ozet.map(x => `<dt>${esc(x[0])}</dt><dd>${esc(x[1])}</dd>`).join('')}</dl></div>` : ''}
                    <div class="yn-p-hizli yn-pdf-gizle">${tel ? `<a class="ap-btn" href="tel:+${tel}" style="text-decoration:none;text-align:center">📞 Ara</a><button class="ap-btn" onclick="window.open('https://api.whatsapp.com/send?phone=${tel}','_blank')">💬 WhatsApp</button>` : '<span class="ap-etk u" style="grid-column:1/-1;text-align:center">Veli telefonu yok</span>'}
                        ${Y.pasifYap ? `<button class="ap-btn${k.pasif ? ' iyi' : ''}" style="grid-column:1/-1" onclick="ynKartPasif(${k.pasif ? 'false' : 'true'})">${k.pasif ? '▶ Aktif et' : '⏸ Pasife al'}</button>` : ''}</div>
                </aside>
                <main class="yn-p-icerik">
                    ${YN.duzen ? '<div class="yn-p-bant">✏️ Düzenleme modu — alanları değiştir, sonra üstten <b>💾 Kaydet</b>. İsim ya da kategori değişirse tüm geçmişi (skor, yoklama, aidat) taşınır.</div>' : ''}
                    <div class="ap-kpi">${tiles}</div>
                    <div class="ap-panel"><h3>Bilgiler <span>${YN.duzen ? 'değiştir → Kaydet' : 'düzeltmek için ✏️ Düzenle'}</span></h3>${bilgi}</div>
                    <div class="ap-iki">
                        <div class="ap-panel"><h3>Aidat · ${yil} <span>yeşil ödendi · kırmızı ödenmedi</span></h3>${aidat}</div>
                        <div class="ap-panel"><h3>Devam · son 6 ay <span>ayda geldiği gün</span></h3><div class="yn-devam">${devam}</div><h3 style="margin-top:14px">Geçmiş <span>son olaylar</span></h3><div class="yn-gecmis">${gecmis}</div></div>
                    </div>
                    ${islemler ? `<div class="yn-tehlike yn-pdf-gizle"><h4>Kayıt işlemleri</h4>${islemler}</div>` : ''}
                </main>
            </div>
        </div>`;
    }
    window.ynKartCiz = ynKartCiz; // profil düğmeleri (Düzenle, yıl, Vazgeç) çağırır
    const AY_UZUN_TR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    window.ynKartAySec = function (m) { YN.kartAy = YN.kartAy === m ? null : m; ynKartCiz(); setTimeout(() => { let e = document.getElementById('yn-k-not'); if (e) e.focus(); }, 30); };
    async function sonra() { try { if (typeof apYenile === 'function' && AP.el && document.body.contains(AP.el)) apYenile(); } catch (e) {} try { if (YN.el && document.body.contains(YN.el)) ynCiz(YN.el); } catch (e) {} try { if (YN.Y.sonra) YN.Y.sonra(); } catch (e) {} ynKartCiz(); }
    window.ynKartBilgiKaydet = async function () {
        let k = ynKisi(), Y = YN.Y; if (!k || !Y.kaydet) return;
        let eski = {}; (Y.alanlar(k) || []).forEach(x => { eski[x.id] = x.deger == null ? '' : String(x.deger); });
        let yeni = {}, kap = document.getElementById('yn-kart-ic');
        kap.querySelectorAll('[data-alan]').forEach(e => { let v = e.dataset.tip === 'seg' ? ((e.querySelector('[aria-pressed="true"]') || {}).dataset || {}).v : e.value; if (v == null) v = ''; v = String(v).trim(); if (v !== eski[e.dataset.alan]) yeni[e.dataset.alan] = v; });
        if (!Object.keys(yeni).length) { YN.duzen = false; return ynKartCiz(); }
        if (yeni.dogum && yeni.dogum > bugun()) return tost('Doğum tarihi gelecekte olamaz.', 'error');
        let btn = kap.querySelector('.yn-p-sag .ana'); if (btn) { btn.disabled = true; btn.textContent = 'Kaydediliyor…'; }
        try { let id = await Y.kaydet(k, yeni); if (id) YN.kart = id; YN.duzen = false; tost('✓ Bilgiler kaydedildi', 'success'); }
        catch (e) { tost('Kaydedilemedi: ' + (e && e.message ? e.message : 'bağlantıyı kontrol et') + ' — hiçbir şey değişmedi.', 'error'); if (btn) { btn.disabled = false; btn.textContent = '💾 Kaydet'; } return; }
        sonra();
    };
    window.ynKartKaydet = async function () {
        let k = ynKisi(); if (!k || !YN.kartAy) return;
        let gun = (document.getElementById('yn-k-gun') || {}).value || bugun(), tutar = parseInt((document.getElementById('yn-k-tutar') || {}).value, 10) || 0, notMetin = ((document.getElementById('yn-k-not') || {}).value || '').trim() || null;
        if (gun > bugun()) return tost('Ödeme günü gelecekte olamaz.', 'error');
        if (!tutar) return tost('Tutarı yaz.', 'warning');
        try { await YN.Y.aidat.kaydet([{ kisi: k, ay: YN.kartAy, tutar, odemeTarihi: gun, notMetin }]); tost('✓ ' + ayKisa(YN.kartAy) + ' ödendi olarak kaydedildi', 'success'); YN.kartAy = null; }
        catch (e) { tost('Kaydedilemedi: bağlantıyı kontrol et.', 'error'); }
        sonra();
    };
    window.ynKartTemizle = async function () {
        let k = ynKisi(); if (!k || !YN.kartAy || !YN.Y.aidatTemizle) return;
        if (!confirm(k.ad + ' · ' + ayKisa(YN.kartAy) + ' ' + YN.kartAy.slice(0, 4) + ' ödemesi silinsin mi (ödenmedi olur)?')) return;
        try { await YN.Y.aidatTemizle(k, YN.kartAy); tost(ayKisa(YN.kartAy) + ' ödenmedi yapıldı', 'warning'); YN.kartAy = null; }
        catch (e) { tost('Kaydedilemedi: bağlantıyı kontrol et.', 'error'); }
        sonra();
    };
    window.ynKartPasif = async function (pasif) {
        let k = ynKisi(); if (!k) return;
        if (!confirm(pasif ? k.ad + ' pasife alınsın mı?\n\nDerslere eklenmez, ödemeyenler listesinden düşer. Aidat geçmişi ve kayıtları silinmez; istediğin zaman "Aktif et" ile geri alırsın.' : k.ad + ' tekrar aktif edilsin mi?')) return;
        try { await YN.Y.pasifYap(k, pasif); tost(pasif ? k.ad + ' pasife alındı' : k.ad + ' tekrar aktif', pasif ? 'warning' : 'success'); }
        catch (e) { tost('Kaydedilemedi: bağlantıyı kontrol et.', 'error'); }
        sonra();
    };
    window.ynKartPin = async function () {
        let e = document.getElementById('yn-kart-pin'), pin = e ? e.value.trim() : ''; if (!pin) return tost('PIN gir.', 'warning');
        let ok = await YN.Y.aidatKilitAc(pin).catch(() => false);
        if (!ok) { if (e) { e.value = ''; e.focus(); } return; }
        sonra();
    };
    // Her yerden: sporcu adı taşıyan öğe data-sporcu="grup|ad" → dokununca profil (satırın kendi tıklamasından önce yakalanır)
    document.addEventListener('click', function (e) {
        if (window.ynDisDelege) return; // DAĞ: app.js kendi yakalar (modül geç yüklenir)
        let el = e.target && e.target.closest ? e.target.closest('[data-sporcu]') : null; if (!el || !YN.Y) return;
        e.preventDefault(); e.stopPropagation(); ynKartAc(el.getAttribute('data-sporcu'));
    }, true);

    // ---- ekran PDF'i: ekranda nasıl görünüyorsa öyle (html2canvas → jsPDF, A4 sayfalara bölünür) ----
    const yukle = src => new Promise((ok, hata) => { let s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = hata; document.head.appendChild(s); });
    window.ynPdf = async function (el, dosya) {
        if (!el) return;
        tost('PDF hazırlanıyor…', 'info');
        try {
            if (typeof html2canvas !== 'function') await yukle('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
            let J = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
            if (!J) { await yukle('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'); J = window.jspdf.jsPDF; }
            el.classList.add('yn-pdf-cekim'); el.setAttribute('data-yn-pdf', '1');
            let gen = Math.max(el.scrollWidth, 360), zemin = getComputedStyle(el).backgroundColor || '#14171c';
            let c = await html2canvas(el, { scale: 2, backgroundColor: zemin, useCORS: true, logging: false, windowWidth: Math.max(gen + 40, document.documentElement.clientWidth),
                onclone: function (doc) { let e = doc.querySelector('[data-yn-pdf="1"]'), p = e; while (p && p !== doc.body) { p.style.overflow = 'visible'; p.style.maxHeight = 'none'; if (p !== e) p.style.height = 'auto'; p = p.parentElement; } } });
            el.classList.remove('yn-pdf-cekim'); el.removeAttribute('data-yn-pdf');
            let pdf = new J({ orientation: 'p', unit: 'mm', format: 'a4' }), W = 210, H = 297, k = c.width / W, sayfaPx = Math.floor(H * k);
            for (let y = 0, i = 0; y < c.height; y += sayfaPx, i++) {
                let h = Math.min(sayfaPx, c.height - y), p = document.createElement('canvas'); p.width = c.width; p.height = h;
                let g = p.getContext('2d'); g.fillStyle = zemin; g.fillRect(0, 0, p.width, h); g.drawImage(c, 0, y, c.width, h, 0, 0, c.width, h);
                if (i) pdf.addPage();
                pdf.setFillColor(20, 23, 28); pdf.rect(0, 0, W, H, 'F');
                pdf.addImage(p.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, W, h / k);
            }
            let ad = (YN.Y && YN.Y.ad ? YN.Y.ad.replace(/[^\wğüşöçıİĞÜŞÖÇ]+/g, '-') + '-' : '') + dosya + '-' + bugun() + '.pdf';
            pdf.save(ad);
            tost('PDF indirildi', 'success');
        } catch (e) { el.classList.remove('yn-pdf-cekim'); el.removeAttribute('data-yn-pdf'); tost('PDF oluşturulamadı.', 'error'); }
    };
})();
