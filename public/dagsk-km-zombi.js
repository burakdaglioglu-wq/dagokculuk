/* ================================================================================================
   🧟 ZOMBİ SALGINI — Karışık Sınıf › Oyunlar teması 'zombi' (2026-11-06, v381). Son Üs'ün yerine. Kullanıcı Son Üs için "çok kötü, yeni oyun yap" dedi,
   dört farklı oyundan bunu seçti. Teşhis: bütün oyunlar "ok at, can düşsün"; burada can barı yok, ekrandaki kalabalık değişir.
   OYUN: herkes ekranda kendi karakteriyle. Birkaç çocuk zombi başlar. Ok "panzehir" ise (çocuğun KENDİ seviyesine göre) bir zombi iyileşir; zombi çocuk
     önce kendini iyileştirir. Belirli aralıkla zombiler ısırır. Herkes atınca sağlam çoğunluktaysa salgın durur.
   KURALLAR (STANDING): sonuç herkes atmadan belli olmaz (zombi kalmazsa yeni dalga gelir); suç çocuğa yüklenmez: ısırık atan çocuğa değil, sırası gelen kalabalığa;
     tur sırasında puan sıralaması yok; finalde herkesin adı, son atan kahraman değil; koçta "Hep birlikte bitir".
   KABUK: skor girişi Oyunlar'ın dock'u. zbSahneKur · zbGuncelle · zbSeri(s, i, kaydedilecek, done) · zbAnlik · zbGeriYukle · zbSporcu · zbAyarUygula · zbFinalZorla.
   Durum 'dag_km_zombi_<konum>' km-ortak ile cihazlara gider, 12 saat kuralıyla sıfırlanır (KM_OYUN_SIFIR_ONEK).
   ================================================================================================ */
(function () {
    'use strict';
    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const bugun = () => (typeof bugunISO === 'function' ? bugunISO() : new Date().toLocaleDateString('sv-SE'));
    const konum = () => ((typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan');
    const ilkAd = (ad) => (typeof kmOyunIlkAd === 'function' ? kmOyunIlkAd(ad) : String(ad).split(' ')[0]);
    const liste = () => (typeof _kmOyunRosterCache !== 'undefined' && _kmOyunRosterCache) || [];
    const ic = (k) => { try { return typeof kmOyunIcerik !== 'function' || kmOyunIcerik('zombi', k); } catch (e) { return true; } };
    const renk = (i) => (typeof kmOyunRenk === 'function' ? kmOyunRenk('zombi', i) : '#5FD4FF');
    const azHareket = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    const puan = (v) => { v = String(v); return v === 'X' ? 10 : (v === 'M' ? 0 : (+v || 0)); };
    const anahtar = () => 'dag_km_zombi_' + konum();
    const kimlik = (s) => s.g + '|' + s.ad;
    const buyuk = (x) => String(x).toLocaleUpperCase('tr-TR');

    /* ---- kurallar (saf) ---- */
    const ISIRIK_ARALIK = 1; // simülasyon: her atışta 1 ısırık, 8-24 çocukta aynı dengeyi veriyor (ok başı %40 iyi atış: ~%80 kazanma, kalabalığın ~%40'ı zombi; kötü gün ~%20)
    function esikOf(ort) { return ort >= 7 ? 9 : ort >= 5 ? 7 : 5; } // yeni başlayan maviye, orta kırmızıya, iyi sarıya vurunca panzehir
    function panzehirSay(puanlar, esik) { return puanlar.filter((p) => p >= esik).length; }
    function baslangicSay(n) { return Math.max(1, Math.round(n / 6)); }
    function isirikSay() { return 1; }
    function kazandi(z, n) { return z < n - z; }
    // Seri sonucu: { iyilesen: [...], isirilan: [...], dalga: bool }. secici(dizi) rastgele seçim (test sabitler).
    function adimHesapla(st, key, puanlar, esik, herkes, secici, dalgaAcik) {
        const r = { iyilesen: [], isirilan: [], dalga: false, panzehir: panzehirSay(puanlar, esik) };
        let hak = r.panzehir > 0 ? 1 : 0; // bir seride en çok bir kişi: oyunu tek çocuk bitiremesin
        if (hak && st.zombi[key]) { r.iyilesen.push(key); hak--; }
        else if (hak) { const adaylar = herkes.filter((k) => st.zombi[k]); if (adaylar.length) r.iyilesen.push(adaylar.slice().sort((a, b) => (st.zamani[a] || 0) - (st.zamani[b] || 0))[0]); }
        r.iyilesen.forEach((k) => { delete st.zombi[k]; delete st.zamani[k]; });
        st.seri = (st.seri || 0) + 1;
        if (st.seri % ISIRIK_ARALIK === 0) {
            const z = herkes.filter((k) => st.zombi[k]).length;
            if (z === 0) { if (dalgaAcik && herkes.length > 1) { r.dalga = true; const a = herkes.filter((k) => !r.iyilesen.includes(k)); const k = secici(a.length ? a : herkes); if (k) { r.isirilan.push(k); st.zombi[k] = 1; st.zamani[k] = st.seri; st.isirik[k] = (st.isirik[k] || 0) + 1; } } }
            else {
                let bos = herkes.filter((k) => !st.zombi[k] && !r.iyilesen.includes(k));
                for (let i = isirikSay(z); i > 0 && bos.length; i--) { // en az ısırılan öncelikli: hep aynı çocuk zombi olmasın
                    const en = Math.min(...bos.map((k) => st.isirik[k] || 0)), k = secici(bos.filter((x) => (st.isirik[x] || 0) === en));
                    st.zombi[k] = 1; st.zamani[k] = st.seri; st.isirik[k] = (st.isirik[k] || 0) + 1; r.isirilan.push(k); bos = bos.filter((x) => x !== k);
                }
            }
        }
        return r;
    }
    const rastgele = (l) => l[Math.floor(Math.random() * l.length)];

    /* ---- durum ---- */
    let _st = null, _ham = null, _kn = null, _z = [], _kilit = false, _kur = '';
    function yeniOyun() { return { tarih: bugun(), zombi: {}, zamani: {}, isirik: {}, atan: {}, kurtardi: {}, seri: 0, faz: 'oyun', basladi: false, finalAdlar: null, kazandi: null }; }
    function durum() {
        let ham = null; try { ham = localStorage.getItem(anahtar()); } catch (e) { }
        if (_kn !== konum() || ham !== _ham || !_st) { try { _st = JSON.parse(ham || 'null'); } catch (e) { _st = null; } _kn = konum(); _ham = ham; }
        if (!_st || _st.tarih !== bugun()) { _st = yeniOyun(); kaydet(); }
        return _st;
    }
    function kaydet() { try { _ham = JSON.stringify(_st); localStorage.setItem(anahtar(), _ham); } catch (e) { } }
    const atabilenler = () => liste().filter((s) => typeof turnuvaDB === 'undefined' || (turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]));
    const turSay = () => { try { const a = typeof kmOyunAyar === 'function' ? kmOyunAyar() : null; return (a && a.zombiTur > 0) ? a.zombiTur : 1; } catch (e) { return 1; } };
    function ortalama(s) { try { if (typeof kmCanavarSporcuOrtalama === 'function') return kmCanavarSporcuOrtalama(s.g, s.ad) || 0; } catch (e) { } return 0; }
    const herkesAtti = (st) => { const l = atabilenler(); return l.length > 0 && l.every((s) => (st.atan[kimlik(s)] || 0) >= turSay()); };
    const atanSay = (st) => atabilenler().filter((s) => (st.atan[kimlik(s)] || 0) >= turSay()).length;
    const zombiSay = (st) => atabilenler().filter((s) => st.zombi[kimlik(s)]).length;
    function salginBaslat(st) {
        const l = atabilenler().map(kimlik); if (!l.length) return [];
        const z = [], kalan = l.slice();
        for (let i = baslangicSay(l.length); i > 0 && kalan.length; i--) { const k = rastgele(kalan); z.push(k); st.zombi[k] = 1; st.zamani[k] = 0; kalan.splice(kalan.indexOf(k), 1); }
        st.basladi = true; return z;
    }
    function bitir(st) {
        const l = atabilenler();
        st.finalAdlar = l.map((s) => ilkAd(s.ad)); st.kazandi = kazandi(zombiSay(st), l.length); st.faz = 'son';
        l.forEach((s) => { const sp = typeof turnuvaDB !== 'undefined' && turnuvaDB[s.g] && turnuvaDB[s.g][s.ad]; if (!sp) return; const o = typeof rfxOyunStat === 'function' ? rfxOyunStat(sp) : (sp.oyun = sp.oyun || {}); o.zombi = o.zombi || {}; o.zombi.oyun = (o.zombi.oyun || 0) + 1; if (st.kazandi) o.zombi.kurtulus = (o.zombi.kurtulus || 0) + 1; sp.lastModified = Date.now(); });
        try { if (typeof oyVeriKaydet === 'function') oyVeriKaydet(); } catch (e) { }
    }

    /* ---- ses ---- */
    let AC = null;
    const sesAcik = () => { try { return localStorage.getItem('dag_km_oyun_sessiz') !== '1'; } catch (e) { return true; } };
    function ton(f, sure, gec, tip, gur) { if (!sesAcik()) return; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime + (gec || 0); o.type = tip || 'square'; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(gur || 0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + sure); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + sure); } catch (e) { } }
    const SES = { kurtar: () => [523, 659, 880].forEach((f, i) => ton(f, 0.16, i * 0.08, 'triangle', 0.09)), isir: () => { ton(110, 0.28, 0, 'sawtooth', 0.12); ton(70, 0.4, 0.12, 'sawtooth', 0.12); }, kacti: () => ton(180, 0.16, 0, 'triangle', 0.06), zafer: () => [392, 523, 659, 784, 1047].forEach((f, i) => ton(f, 0.28, i * 0.14, 'square', 0.07)), yenilgi: () => [220, 185, 147, 110].forEach((f, i) => ton(f, 0.34, i * 0.2, 'sawtooth', 0.09)) };

    /* ---- çizim: kalabalık bir kez kurulur, sınıflar değişir (animasyon ve performans için) ---- */
    const panel = () => $('km-oyun-panel-zombi');
    const SAC = ['#2B1B12', '#5A3417', '#8A5A2B', '#C99A4B', '#1C1C24', '#6E2F1E'];
    const sacOf = (k) => { let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0; return SAC[h % SAC.length]; };
    function kisiSvg(k, r) {
        return '<svg class="zb-svg" viewBox="0 0 60 82" aria-hidden="true" style="--sac:' + sacOf(k) + ';--gom:' + r + '">'
            + '<rect class="zb-g" x="17" y="34" width="26" height="28"/><rect class="zb-yirtik" x="17" y="54" width="9" height="8"/><rect class="zb-yirtik" x="34" y="48" width="9" height="8"/>'
            + '<rect class="zb-b" x="19" y="62" width="9" height="18"/><rect class="zb-b" x="32" y="62" width="9" height="18"/>'
            + '<g class="zb-kol-n"><rect class="zb-g" x="8" y="35" width="8" height="22"/><rect class="zb-g" x="44" y="35" width="8" height="22"/><rect class="zb-t" x="8" y="57" width="8" height="6"/><rect class="zb-t" x="44" y="57" width="8" height="6"/></g>'
            + '<g class="zb-kol-z"><rect class="zb-t" x="-6" y="35" width="24" height="8"/><rect class="zb-t" x="42" y="35" width="24" height="8"/></g>'
            + '<rect class="zb-t" x="15" y="8" width="30" height="26"/><rect class="zb-s" x="13" y="4" width="34" height="9"/><rect class="zb-s" x="13" y="10" width="5" height="10"/>'
            + '<g class="zb-yuz-n"><rect x="22" y="18" width="5" height="6" fill="#141018"/><rect x="33" y="18" width="5" height="6" fill="#141018"/><rect x="25" y="28" width="10" height="2" fill="#141018"/></g>'
            + '<g class="zb-yuz-z"><rect x="20" y="16" width="8" height="8" fill="#FF3B30"/><rect x="33" y="18" width="6" height="5" fill="#141018"/><rect x="23" y="27" width="15" height="5" fill="#141018"/><rect x="26" y="27" width="3" height="3" fill="#EDE6C8"/><rect x="33" y="27" width="3" height="3" fill="#EDE6C8"/></g></svg>';
    }
    const SEHIR = '<svg class="zb-sehir" viewBox="0 0 900 240" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><circle cx="720" cy="56" r="34" fill="#E9E3B4"/><g fill="#1B2725"><rect x="0" y="90" width="110" height="150"/><rect x="120" y="50" width="80" height="190"/><rect x="210" y="110" width="130" height="130"/><rect x="350" y="70" width="70" height="170"/><rect x="430" y="120" width="120" height="120"/><rect x="560" y="60" width="90" height="180"/><rect x="660" y="100" width="110" height="140"/><rect x="780" y="70" width="120" height="170"/></g><path d="M250 110l14-22 8 22zM470 120l10-26 12 26z" fill="#0E1513"/></svg>';
    function kalabalikKur() {
        const l = liste(), st = durum(), kp = $('zb-kalabalik'); if (!kp) return;
        const n = Math.max(1, l.length), r = $('zb-oyun') ? $('zb-oyun').getBoundingClientRect() : { width: 800, height: 500 };
        let en = 1, enBoy = 0; for (let c = 1; c <= n; c++) { const sat = Math.ceil(n / c), w = (r.width - 24) / c, h = Math.max(240, r.height - 130) / sat, b = Math.min(w * 0.82, h - 26); if (b > enBoy) { enBoy = b; en = c; } } // en büyük karakteri veren sütun sayısı
        kp.style.setProperty('--kol', en);
        kp.innerHTML = l.map((s, i) => { const k = kimlik(s); return '<button type="button" class="zb-kisi" data-km-sporcu="' + i + '" data-k="' + esc(k) + '"><span class="zb-kafa">' + kisiSvg(k, renk(i)) + '<i class="zb-sira">SIRA</i></span><span class="zb-ad"><b class="zb-tik" aria-hidden="true"></b>' + esc(ilkAd(s.ad)) + '</span></button>'; }).join('');
        _kur = l.map(kimlik).join('\u0001') + '|' + st.tarih;
    }
    function aktifIndeks() { return typeof _kmOyunAktifIndex !== 'undefined' ? _kmOyunAktifIndex : -1; }
    function guncelle() {
        const kok = $('zb-icerik'); if (!kok) return; const st = durum();
        if (st.faz === 'son') return sonCiz(st);
        if (!$('zb-oyun')) oyunIskelet();
        if ((liste().map(kimlik).join('\u0001') + '|' + st.tarih) !== _kur) kalabalikKur();
        if (!st.basladi && atabilenler().length) { const z = salginBaslat(st); kaydet(); if (z.length && !_kilit) acilis(z); }
        const ai = aktifIndeks(), n = atabilenler().length;
        document.querySelectorAll('#zb-kalabalik .zb-kisi').forEach((b, i) => {
            const k = b.getAttribute('data-k'), z = !!st.zombi[k], at = (st.atan[k] || 0) >= turSay(), akt = i === ai;
            b.classList.toggle('zombi', z); b.classList.toggle('atti', at); b.classList.toggle('aktif', akt);
            const ad = b.querySelector('.zb-ad').textContent; b.setAttribute('aria-label', ad + (z ? ', zombi' : ', sağlam') + (at ? ', attı' : ''));
        });
        const zs = zombiSay(st), saglam = n - zs, a = atanSay(st), akt = liste()[ai];
        const yaz = (id, v) => { const e = $(id); if (e && e.textContent !== String(v)) e.textContent = v; };
        yaz('zb-z', zs); yaz('zb-s', saglam); yaz('zb-at', a + ' / ' + n + ' attı'); yaz('zb-kim', akt ? buyuk(ilkAd(akt.ad)) : '');
        const b = $('zb-bar'); if (b) b.style.width = (n ? zs / n * 100 : 0) + '%';
        if (akt) { const es = esikOf(ortalama(akt)), h = $('zb-yan-hedef'); if (h) h.setAttribute('data-esik', es); yaz('zb-yan-ad', buyuk(ilkAd(akt.ad))); yaz('zb-yan-esik', (st.zombi[kimlik(akt)] ? 'Kendini kurtar: ' : 'Panzehir: ') + (es >= 9 ? 'sarıya vur' : es >= 7 ? 'kırmızıya ya da sarıya vur' : 'maviye ya da içine vur')); }
        const bit = $('zb-bitir'); if (bit) bit.hidden = !(a > 0 && a < n && a >= Math.ceil(n / 2));
    }
    function oyunIskelet() {
        $('zb-icerik').innerHTML = '<div class="zb-oyun" id="zb-oyun"><div class="zb-ust"><div class="zb-say z"><b id="zb-z">0</b><span>ZOMBİ</span></div><div class="zb-orta"><div class="zb-cubuk" role="img" aria-label="Zombi ve sağlam oranı"><i id="zb-bar"></i></div><div class="zb-bilgi"><span class="zb-sira-hud">Sıra: <b id="zb-kim"></b></span><span id="zb-at"></span><span class="zb-kl">Her atıştan sonra ısırık</span></div></div><div class="zb-say s"><b id="zb-s">0</b><span>SAĞLAM</span></div></div>'
            + '<div class="zb-duyuru" id="zb-duyuru" aria-live="polite"></div><div class="zb-kalabalik" id="zb-kalabalik"></div>'
            + '<div class="zb-yan" id="zb-yan"><div class="zb-yan-hedef" id="zb-yan-hedef" data-esik="7"><svg viewBox="0 0 120 120" role="img" aria-label="Hedefte panzehir bölgesi"><circle class="m" cx="60" cy="60" r="58"/><circle class="k" cx="60" cy="60" r="39"/><circle class="s" cx="60" cy="60" r="20"/></svg></div><div class="zb-yan-yazi"><small>SIRADA</small><b id="zb-yan-ad"></b><span id="zb-yan-esik"></span></div>'
            + '<div class="zb-arac"><button type="button" class="zb-kucuk" id="zb-nasil" aria-label="Nasıl oynanır">?</button><button type="button" class="zb-kucuk" id="zb-yeni-btn" aria-label="Yeni salgın">↻</button><button type="button" class="zb-kucuk genis" id="zb-bitir" hidden>Hep birlikte bitir</button></div></div></div>';
        kalabalikKur();
    }
    function sonCiz(st) {
        const k = st.kazandi, l = st.finalAdlar || [], n = l.length, z = st.sonZ != null ? st.sonZ : zombiSay(st);
        $('zb-icerik').innerHTML = '<div class="zb-son ' + (k ? 'kazandi' : 'kaybetti') + '" id="zb-son"><span class="zb-et">Herkes attı</span><h2>' + (k ? 'SALGIN DURDU!' : 'ŞEHİR DÜŞTÜ!') + '</h2><p class="zb-sonuc"><b>' + (n - z) + '</b> sağlam · <b>' + z + '</b> zombi</p><p class="zb-cumle">' + (k ? 'Hep birlikte kurtardınız.' : 'Bir dahaki sefere hep birlikte. Rövanş?') + '</p><div class="zb-adlar"><small>Bu salgında savaşanlar</small><span>' + l.map(esc).join(' · ') + '</span></div><button type="button" class="zb-buyuk" id="zb-yeni-son">Yeni salgın</button></div>';
        _kur = '';
    }
    function duyur(metin, sinif) { const d = $('zb-duyuru'); if (!d) return; d.className = 'zb-duyuru ac ' + (sinif || ''); d.textContent = metin; }
    function duyuruKapa() { const d = $('zb-duyuru'); if (d) d.className = 'zb-duyuru'; }
    function zamanTemizle() { _z.forEach(clearTimeout); _z = []; }
    function sonra(fn, ms) { const t = setTimeout(fn, ms); _z.push(t); }
    function kisiEl(k) { return document.querySelector('#zb-kalabalik .zb-kisi[data-k="' + (window.CSS && CSS.escape ? CSS.escape(k) : k) + '"]'); }
    function isaretle(k, sinif, ms) { const e = kisiEl(k); if (!e) return; e.classList.remove(sinif); void e.offsetWidth; e.classList.add(sinif); sonra(() => { const x = kisiEl(k); if (x) x.classList.remove(sinif); }, ms || 900); }
    // Ok: atan çocuktan iyileşene uçar
    function okUcur(kaynak, hedef) {
        if (azHareket()) return; const a = kisiEl(kaynak), b = kisiEl(hedef), kok = $('zb-oyun'); if (!a || !b || !kok || a === b) return;
        const r0 = kok.getBoundingClientRect(), ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(), ok = document.createElement('i'); ok.className = 'zb-ok';
        const x0 = ra.left - r0.left + ra.width / 2, y0 = ra.top - r0.top + ra.height / 3, x1 = rb.left - r0.left + rb.width / 2, y1 = rb.top - r0.top + rb.height / 3, ac = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
        ok.style.cssText = 'left:' + x0 + 'px;top:' + y0 + 'px;transform:rotate(' + ac + 'deg)'; kok.appendChild(ok);
        try { ok.animate([{ transform: 'translate(0,0) rotate(' + ac + 'deg)' }, { transform: 'translate(' + (x1 - x0) + 'px,' + (y1 - y0) + 'px) rotate(' + ac + 'deg)' }], { duration: 280, easing: 'ease-in' }); } catch (e) { }
        sonra(() => ok.remove(), 290);
    }
    function acilis(z) {
        _kilit = true; const adlar = z.map((k) => buyuk(ilkAd(k.slice(k.indexOf('|') + 1)))).join(', ');
        duyur('SALGIN BAŞLADI! ' + adlar + ' ZOMBİ OLDU!', 'kotu'); SES.isir(); z.forEach((k) => isaretle(k, 'isirildi', 900));
        sonra(() => { duyuruKapa(); _kilit = false; }, 2200);
    }

    /* ---- seri ---- */
    function zbSeri(s, i, kaydedilecek, done) {
        zamanTemizle(); duyuruKapa(); _kilit = true;
        const bit = () => { _kilit = false; try { done(); } catch (e) { } if (panel()) guncelle(); };
        const st = durum();
        if (st.faz !== 'oyun') { _kilit = false; kaydet(); try { done(); } catch (e) { } return; } // sonuç ekranında girilen seri kayda geçer, oyunu etkilemez
        if (!st.basladi) salginBaslat(st);
        const key = kimlik(s), puanlar = (kaydedilecek || []).map((k) => puan(k.puan)), esik = esikOf(ortalama(s)), herkes = atabilenler().map(kimlik);
        const r = adimHesapla(st, key, puanlar, esik, herkes, rastgele, ic('dalga'));
        st.atan[key] = (st.atan[key] || 0) + 1;
        if (r.iyilesen.length) st.kurtardi[key] = (st.kurtardi[key] || 0) + 1;
        const final = herkesAtti(st);
        if (final) { st.sonZ = herkes.filter((k) => st.zombi[k]).length; bitir(st); }
        kaydet();
        if (!panel()) return bit();
        const adi = buyuk(ilkAd(s.ad)), adOf = (k) => buyuk(ilkAd(k.slice(k.indexOf('|') + 1)));
        if (!$('zb-oyun')) oyunIskelet();
        // kalabalık önce iyileşeni gösterir, ısırık sonra gelir
        const goster = (zombiler) => { document.querySelectorAll('#zb-kalabalik .zb-kisi').forEach((b) => b.classList.toggle('zombi', !!zombiler[b.getAttribute('data-k')])); const zs = herkes.filter((k) => zombiler[k]).length, bar = $('zb-bar'); if ($('zb-z')) $('zb-z').textContent = zs; if ($('zb-s')) $('zb-s').textContent = herkes.length - zs; if (bar) bar.style.width = (herkes.length ? zs / herkes.length * 100 : 0) + '%'; };
        const ara = Object.assign({}, st.zombi); r.isirilan.forEach((k) => delete ara[k]); goster(ara);
        let bek = 0;
        if (r.iyilesen.length) {
            const h = r.iyilesen[0]; okUcur(key, h); SES.kurtar();
            sonra(() => isaretle(h, 'kurtuldu', 1000), 280);
            duyur(h === key ? adi + ' PANZEHİRİ VURDU, İYİLEŞTİ!' : adi + ' PANZEHİR ATTI, ' + adOf(h) + ' KURTULDU!', 'iyi'); bek = 1200;
        } else if (r.panzehir) { duyur(adi + ' PANZEHİR ATTI! ZOMBİ KALMADI!', 'iyi'); SES.kurtar(); bek = 1100; }
        else { duyur(adi + ': AZ KALDI!', ''); SES.kacti(); bek = 900; }
        if (r.isirilan.length) {
            sonra(() => { goster(st.zombi); SES.isir(); r.isirilan.forEach((k) => isaretle(k, 'isirildi', 1000)); const sah = $('zb-kalabalik'); if (sah && !azHareket()) { sah.classList.remove('sars'); void sah.offsetWidth; sah.classList.add('sars'); } duyur((r.dalga ? 'YENİ DALGA! ' : 'ZOMBİLER SALDIRDI! ') + r.isirilan.map(adOf).join(', ') + ' ISIRILDI!', 'kotu'); }, bek); bek += 1300;
        }
        sonra(() => {
            duyuruKapa();
            if (final) { sonCiz(st); (st.kazandi ? SES.zafer : SES.yenilgi)(); try { if (typeof kmOyunBanner === 'function') kmOyunBanner(st.kazandi ? '🧟 SALGIN DURDU!' : '🧟 ŞEHİR DÜŞTÜ!', 'Hep birlikte: ' + (st.finalAdlar || []).slice(0, 14).join(', ') + ((st.finalAdlar || []).length > 14 ? ' ve tüm sınıf' : ''), 'bitis'); } catch (e) { } _kilit = false; try { done(); } catch (e) { } return; }
            bit();
        }, bek);
    }
    function zbFinalZorla() {
        const st = durum(); if (st.faz !== 'oyun') return;
        const f = () => { const s = durum(); if (s.faz !== 'oyun') return; s.sonZ = zombiSay(s); bitir(s); kaydet(); (s.kazandi ? SES.zafer : SES.yenilgi)(); guncelle(); };
        const kalan = atabilenler().length - atanSay(st);
        if (kalan > 0 && typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Salgın şimdi bitsin mi?<br><small>' + kalan + ' çocuk henüz atmadı. Sonuçta herkesin adı görünür.</small>', f, 'Hep birlikte bitir', 'Bekle'); else f();
    }
    function nasil() {
        const m = 'Ekrandakiler bu sınıf. Birkaç kişi zombi başlar.<br>Atış iyiyse panzehir olur: bir zombi kurtulur, zombi çocuk önce kendini kurtarır. "İyi atış" çocuğun kendi seviyesine göre: yeni başlayana mavi, ortaya kırmızı, iyiye sarı.<br>Her atıştan sonra zombiler bir kişiyi ısırır.<br>Herkes atınca sağlam çoğunluktaysa salgın durur.';
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste(m, () => { }, 'Tamam', 'Kapat');
    }
    function yeniSor() {
        const f = () => { zamanTemizle(); _kilit = false; _st = yeniOyun(); kaydet(); _kur = ''; $('zb-icerik').innerHTML = ''; guncelle(); };
        if (durum().faz !== 'oyun' || !durum().seri) return f();
        if (typeof onayIste === 'function' && !document.fullscreenElement) onayIste('Yeni salgın başlasın mı?<br><small>Sporcu serileri silinmez.</small>', f, 'Yeni salgın', 'Vazgeç'); else f();
    }
    function zbSahneKur() {
        const p = panel(); if (!p) return; css(); zamanTemizle(); _kilit = false; _kur = '';
        p.innerHTML = '<div class="zb-sahne">' + SEHIR + '<div id="zb-icerik"></div></div>';
        p.onclick = (e) => {
            const t = e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.id === 'zb-nasil') nasil(); else if (t.id === 'zb-yeni-btn' || t.id === 'zb-yeni-son') yeniSor(); else if (t.id === 'zb-bitir') zbFinalZorla();
        };
        guncelle();
    }
    function css() {
        if ($('zb-css')) return; const st = document.createElement('style'); st.id = 'zb-css';
        st.textContent = '.km-oyun-panel-zombi{padding:0;background:#0C1412;overflow:hidden;font-family:"Manrope",system-ui,sans-serif}'
            + '.zb-sahne{position:absolute;inset:0;color:#F2F6EE;overflow:hidden;background:#101A22}.zb-sehir{position:absolute;left:0;right:0;bottom:0;width:100%;height:62%;opacity:.9}.zb-sahne:after{content:"";position:absolute;left:0;right:0;bottom:0;height:16%;background:#1A231E}'
            + '#zb-icerik{position:absolute;inset:0;z-index:1;box-sizing:border-box;padding:10px min(440px,41%) 10px 14px}'
            + '.zb-oyun{position:relative;height:100%;display:flex;flex-direction:column;gap:6px;min-height:0}'
            + '.zb-ust{flex:none;display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding-right:0}'
            + '.zb-say{display:flex;flex-direction:column;align-items:center;min-width:76px;line-height:1}.zb-say b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(44px,6vw,68px);font-weight:800;font-variant-numeric:tabular-nums}.zb-say span{font-size:13px;font-weight:800;letter-spacing:.08em}.zb-say.z b,.zb-say.z span{color:#9BEA5A}.zb-say.s b,.zb-say.s span{color:#7CCBFF}'
            + '.zb-cubuk{height:18px;border-radius:9px;background:#3A7FB8;overflow:hidden}.zb-cubuk i{display:block;height:100%;background:#7FD63F;transition:width .5s}'
            + '.zb-bilgi{display:flex;flex-wrap:wrap;gap:2px 14px;margin-top:6px;font-size:clamp(13px,1.45vw,17px);font-weight:700;color:#DCE6D6;align-items:baseline}.zb-bilgi b{font-family:"Barlow Condensed",sans-serif;font-size:clamp(22px,2.6vw,32px);font-weight:800;color:#FFC24B}.zb-kl{color:#FFB199}'
            + '.zb-kalabalik{flex:1;min-height:0;display:grid;grid-template-columns:repeat(var(--kol,6),minmax(0,1fr));grid-auto-rows:minmax(0,1fr);gap:2px 4px;align-items:end}.zb-kalabalik.sars{animation:zb-sars .4s}'
            + '.zb-kisi{min-width:0;min-height:44px;height:100%;padding:0;border:0;background:transparent;color:#F2F6EE;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:1px;position:relative}'
            + '.zb-kafa{position:relative;flex:1;min-height:0;width:100%;display:flex;align-items:flex-end;justify-content:center}.zb-svg{height:100%;max-width:100%;overflow:visible;display:block;filter:drop-shadow(0 3px 0 rgba(0,0,0,.45))}'
            + '.zb-t{fill:#EBBB93}.zb-s{fill:var(--sac)}.zb-g{fill:var(--gom)}.zb-b{fill:#26324A}.zb-yirtik,.zb-kol-z,.zb-yuz-z{display:none}'
            + '.zb-kisi.zombi .zb-t{fill:#7FD63F}.zb-kisi.zombi .zb-s{fill:#3D5A22}.zb-kisi.zombi .zb-g{fill:#4B5A52}.zb-kisi.zombi .zb-b{fill:#2A332E}.zb-kisi.zombi .zb-yirtik{display:block;fill:#101A22}.zb-kisi.zombi .zb-kol-n,.zb-kisi.zombi .zb-yuz-n{display:none}.zb-kisi.zombi .zb-kol-z,.zb-kisi.zombi .zb-yuz-z{display:block}'
            + '.zb-ad{max-width:100%;font-size:clamp(12px,1.3vw,15px);font-weight:800;line-height:1.15;padding:1px 6px;border-radius:7px;background:rgba(8,12,12,.78);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zb-kisi.zombi .zb-ad{color:#BDF58C}'
            + '.zb-tik:empty{display:none}.zb-kisi.atti .zb-ad:before{content:"✓ ";color:#FFC24B}'
            + '.zb-sira{display:none;position:absolute;top:-2px;left:50%;transform:translateX(-50%);padding:1px 8px;border-radius:6px;background:#FFC24B;color:#1A1000;font-style:normal;font-size:12px;font-weight:800;z-index:2}.zb-kisi.aktif .zb-sira{display:block}.zb-kisi.aktif .zb-ad{background:#FFC24B;color:#1A1000}.zb-kisi.aktif .zb-svg{filter:drop-shadow(0 0 7px #FFC24B)}'
            + '.zb-duyuru{position:absolute;left:0;right:0;top:44%;z-index:4;text-align:center;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(28px,4.6vw,60px);line-height:1;padding:12px 16px;background:rgba(6,10,10,.86);color:#fff;opacity:0;pointer-events:none;transform:translateY(-50%) scale(.92);transition:opacity .12s,transform .12s}.zb-duyuru.ac{opacity:1;transform:translateY(-50%)}.zb-duyuru.iyi{color:#FFD86B}.zb-duyuru.kotu{color:#9BEA5A}'
            + '.zb-ok{position:absolute;z-index:3;width:44px;height:5px;margin:-2px 0 0 -22px;background:#FFE9B0;border-radius:2px;transform-origin:center;pointer-events:none}'
            + '.zb-yan{position:absolute;left:100%;top:0;margin-left:16px;width:min(390px,56vw);display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center}.zb-yan-hedef{flex:none;width:112px}.zb-yan-hedef svg{display:block;width:100%}.zb-yan-hedef .m{fill:#2F7FD6}.zb-yan-hedef .k{fill:#E23B2E}.zb-yan-hedef .s{fill:#F5D32A}.zb-yan-hedef[data-esik="7"] .m,.zb-yan-hedef[data-esik="9"] .m,.zb-yan-hedef[data-esik="9"] .k{fill:#2A3430}'
            + '.zb-yan-yazi{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}.zb-yan-yazi small{font-size:13px;font-weight:800;letter-spacing:.1em;color:#C9D4C4}.zb-yan-yazi b{font-family:"Barlow Condensed",Impact,sans-serif;font-size:clamp(34px,4.4vw,56px);font-weight:800;line-height:1;color:#FFC24B;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zb-yan-yazi span{font-size:clamp(15px,1.5vw,19px);font-weight:800;line-height:1.25}.zb-sira-hud{display:none}'
            + '.zb-arac{display:flex;flex-wrap:wrap;gap:6px;width:100%}.zb-kucuk{min-width:44px;height:44px;border-radius:22px;border:1px solid #3B4A44;background:#17211E;color:#F2F6EE;font:inherit;font-weight:800;cursor:pointer}.zb-kucuk[hidden]{display:none}.zb-kucuk.genis{padding:0 14px;font-size:13px}'
            + '.zb-son{height:100%;overflow-y:auto;display:flex;flex-direction:column;justify-content:flex-start;gap:8px;box-sizing:border-box;padding:4px 10px}.zb-et{font-size:clamp(13px,1.5vw,17px);font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#DCE6D6}.zb-son h2{margin:0;font-family:"Barlow Condensed",Impact,sans-serif;font-weight:800;font-size:clamp(44px,6vw,80px);line-height:.92}.zb-son.kazandi h2{color:#FFD86B}.zb-son.kaybetti h2{color:#9BEA5A}.zb-sonuc{margin:0;font-size:clamp(20px,2.6vw,32px);font-weight:700}.zb-sonuc b{font-family:"Barlow Condensed",sans-serif;font-size:1.3em}.zb-cumle{margin:0;font-size:clamp(17px,2vw,24px);font-weight:700;color:#DCE6D6}'
            + '.zb-adlar{display:flex;flex-direction:column;gap:4px;padding:10px 12px;border-radius:12px;background:rgba(8,12,12,.72)}.zb-adlar small{font-size:12.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#B9C6B3}.zb-adlar span{font-size:clamp(14px,1.45vw,18px);font-weight:700;line-height:1.4}.zb-buyuk{flex:none;align-self:flex-start;min-height:60px;padding:0 30px;border-radius:30px;border:0;background:#FFC24B;color:#1A1000;font:inherit;font-size:18px;font-weight:800;cursor:pointer}'
            + '.zb-sahne button:focus-visible{outline:3px solid #FFC24B;outline-offset:2px}'
            + '@media(prefers-reduced-motion:no-preference){.zb-kisi.zombi .zb-svg{animation:zb-sal 1.5s ease-in-out infinite;transform-origin:50% 100%}.zb-kisi.isirildi .zb-svg{animation:zb-isir .9s}.zb-kisi.kurtuldu .zb-svg{animation:zb-kurtul .9s}.zb-kisi.aktif:not(.zombi) .zb-svg{animation:zb-zipla .9s ease-in-out infinite}@keyframes zb-sal{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}@keyframes zb-zipla{0%,100%{transform:none}50%{transform:translateY(-6%)}}@keyframes zb-isir{0%{transform:scale(1)}20%{transform:scale(1.28) rotate(-8deg)}40%{transform:scale(1.1) rotate(8deg)}60%{transform:scale(1.22) rotate(-5deg)}100%{transform:none}}@keyframes zb-kurtul{0%{transform:scale(.8)}35%{transform:scale(1.35) translateY(-12%)}100%{transform:none}}@keyframes zb-sars{20%{transform:translateX(9px)}45%{transform:translateX(-8px)}70%{transform:translateX(5px)}}}'
            + '.zb-kisi.kurtuldu .zb-svg{filter:drop-shadow(0 0 14px #FFD86B)}.zb-kisi.isirildi .zb-svg{filter:drop-shadow(0 0 14px #9BEA5A)}'
            + '@media(max-width:860px){#zb-icerik{padding:8px 8px 8px}.zb-say{min-width:58px}.zb-sira-hud{display:inline}.zb-yan{position:static;margin:0;width:100%;flex:none;gap:6px 10px}.zb-yan-hedef{width:52px}.zb-yan-yazi small,.zb-yan-yazi b{display:none}.zb-yan-yazi span{font-size:14px}.zb-arac{width:auto}}';
        document.head.appendChild(st);
    }
    window.zbSahneKur = zbSahneKur;
    window.zbGuncelle = guncelle;
    window.zbSeri = zbSeri;
    window.zbAnlik = () => JSON.parse(JSON.stringify(durum()));
    window.zbGeriYukle = (k) => { if (!k) return; zamanTemizle(); duyuruKapa(); _kilit = false; _st = k; _kn = konum(); kaydet(); if ($('zb-icerik')) { if (k.faz === 'oyun' && !$('zb-oyun')) $('zb-icerik').innerHTML = ''; guncelle(); } };
    window.zbSporcu = (g, ad) => (durum().kurtardi || {})[g + '|' + ad] || 0;
    window.zbAyarUygula = () => { if ($('zb-icerik')) guncelle(); };
    window.zbFinalZorla = zbFinalZorla;
    window.zbDurum = durum;
    window._zbIc = { esikOf, panzehirSay, baslangicSay, isirikSay, kazandi, adimHesapla, ISIRIK_ARALIK };
})();
