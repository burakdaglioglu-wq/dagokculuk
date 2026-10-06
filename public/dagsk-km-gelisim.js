/* ================================================================================================
   📊 GELİŞİM ARAÇLARI — Karışık Sınıf (2026-10-02, araştırma sonrası "hepsini yavaştan yap")
   1) Antrenman Yükü: haftalık ok hedefi (gruba göre), kayıtlı + SKORSUZ ok (ısınma/boş hedef — meta skorsuz_ok,
      anahtar g|ad|tarih), haftanın günleri, sporcunun güncel atış MESAFESİ (meta sporcu_mesafe; yeni seriler bu
      mesafeyle damgalanır — app.js sporcuMesafe, series.mesafe sütunu, migration 0042).
   2) Seviye Testi: ayda bir, yaşa göre sabit protokol (mesafe + hedef kâğıdı + 30 ok) → karşılaştırılabilir gelişim.
      Kayıtlar meta seviye_testi {id: {...}}; karneye/skora yazılmaz (ayrı ölçüm).
   Depo: kyDepoOku/kyDepoYazYerel/kyDepoSenkron (dagsk-kisi-yonetimi.js) — kayıt başına en yeni kazanır.
   ================================================================================================ */
const GL_GRUPLAR = ['minikler', 'kucukler', 'yildizlar', 'buyukler'];
const GL_GRUP_AD = { minikler: 'Minikler', kucukler: 'Küçükler', yildizlar: 'Yıldızlar', buyukler: 'Büyükler' };
const GL_HEDEF_VARSAYILAN = { minikler: 60, kucukler: 100, yildizlar: 150, buyukler: 200 };
const GL_MESAFELER = [10, 15, 18, 20, 25, 30, 40, 50, 60, 70];
const GL_PROTOKOL_VARSAYILAN = { minikler: { m: 10, hedef: '122 cm', ok: 30 }, kucukler: { m: 18, hedef: '80 cm', ok: 30 }, yildizlar: { m: 18, hedef: '60 cm', ok: 30 }, buyukler: { m: 18, hedef: '40 cm', ok: 30 } };
const GL_PAD = ['X', '10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'M'];
const GL_DEGER = { X: 10, M: 0 };
let _gl = { sekme: 'bu', ayar: false, sonEkle: {}, giris: null, detay: null };

function glEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function glJs(s) { return encodeURIComponent(s).replace(/'/g, '%27'); }
function glKey(kk) { let [g, ...r] = decodeURIComponent(kk).split('|'); return { g, ad: r.join('|') }; }
function glRoster() { return (typeof _kmListe !== 'undefined' ? _kmListe : []).filter(k => turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]); }
function glBugun() { return bsIsoTarih(new Date()); }
function glHaftaBas(ofset) { let d = new Date(), gun = (d.getDay() + 6) % 7; return new Date(d.getFullYear(), d.getMonth(), d.getDate() - gun - (ofset || 0) * 7); }
function glHaftaGunleri() { let b = glHaftaBas(0); return Array.from({ length: 7 }, (_, i) => bsIsoTarih(new Date(b.getFullYear(), b.getMonth(), b.getDate() + i))); }
function glOkDeger(o) { return GL_DEGER[o] !== undefined ? GL_DEGER[o] : (parseInt(o, 10) || 0); }
function glSenk(anahtar, sonra) { return kyDepoSenkron(anahtar, () => kyDepoOku(anahtar), true).then(() => { if (sonra) sonra(); }).catch(() => {}); }
function glAvatar(g, ad) { return `<span class="gl-avatar g-${g}" aria-hidden="true">${glEsc(String(ad).trim().charAt(0))}</span>`; }

// ---- ayarlar (meta)
function glHedef(g) { let o = kyDepoOku('antrenman_hedef')[g]; return o && o.n > 0 ? o.n : GL_HEDEF_VARSAYILAN[g] || 100; }
function glHedefYaz(g, n) { n = Math.max(0, Math.min(5000, parseInt(n, 10) || 0)); let d = kyDepoOku('antrenman_hedef'); d[g] = { n, t: Date.now() }; kyDepoYazYerel('antrenman_hedef', d); glSenk('antrenman_hedef'); }
function glProtokol(g) { let o = kyDepoOku('seviye_protokol')[g]; return o && o.m ? o : GL_PROTOKOL_VARSAYILAN[g]; }
function glProtokolYaz(g, alan, v) { let d = kyDepoOku('seviye_protokol'), p = Object.assign({}, glProtokol(g)); p[alan] = alan === 'hedef' ? String(v).slice(0, 20) : Math.max(1, Math.min(alan === 'm' ? 100 : 144, parseInt(v, 10) || 0)); p.t = Date.now(); d[g] = p; kyDepoYazYerel('seviye_protokol', d); glSenk('seviye_protokol'); }
function glMesafeYaz(kk, m) {
    let k = glKey(kk), d = kyDepoOku('sporcu_mesafe'); m = parseInt(m, 10) || 0;
    d[k.g + '|' + k.ad] = m ? { m, t: Date.now() } : { t: Date.now(), sil: true };
    kyDepoYazYerel('sporcu_mesafe', d); glSenk('sporcu_mesafe');
    showToast(m ? '📏 ' + k.ad.split(' ')[0] + ': ' + m + ' m — yeni seriler bu mesafeyle kaydedilir' : 'Mesafe kaldırıldı', 'success');
}

// ---- skorsuz ok
function glSkorsuzEkle(kk, n) {
    let k = glKey(kk), anahtar = k.g + '|' + k.ad + '|' + glBugun(), d = kyDepoOku('skorsuz_ok'), e = d[anahtar] && !d[anahtar].sil ? d[anahtar].n || 0 : 0;
    let yeni = Math.max(0, e + n);
    d[anahtar] = yeni ? { n: yeni, t: Date.now() } : { t: Date.now(), sil: true };
    // 180 günden eski kayıtları buda
    let sinir = bsIsoTarih(new Date(Date.now() - 180 * 864e5)); Object.keys(d).forEach(x => { if (x.split('|').pop() < sinir) delete d[x]; });
    kyDepoYazYerel('skorsuz_ok', d); glSenk('skorsuz_ok');
    if (n > 0) _gl.sonEkle[k.g + '|' + k.ad] = n; else delete _gl.sonEkle[k.g + '|' + k.ad];
    kmYukCiz();
}
function glSkorsuzGeriAl(kk) { let k = glKey(kk), n = _gl.sonEkle[k.g + '|' + k.ad]; if (n) glSkorsuzEkle(kk, -n); }

// ---- haftalık yük
function glYuk(k) {
    let sp = turnuvaDB[k.g][k.ad], gunler = glHaftaGunleri(), bas = gunler[0], son = gunler[6], kayitli = 0, gunSet = new Set();
    let say = x => { let t = x.tarih || ''; if (t >= bas && t <= son) { kayitli += (x.oklar || []).length; gunSet.add(t); } };
    (sp.seriler || []).forEach(say); (sp.kartGecmisi || []).forEach(kt => (kt.seriler || []).forEach(say));
    let sk = typeof skorsuzOk === 'function' ? skorsuzOk(k.g, k.ad).gun : {}, skorsuz = 0;
    Object.keys(sk).forEach(t => { if (t >= bas && t <= son) { skorsuz += sk[t]; gunSet.add(t); } });
    let hedef = glPerfMi(k.g, k.ad) ? glPerfHedef() : glHedef(k.g), top = kayitli + skorsuz;
    return { sp, kayitli, skorsuz, top, hedef, yuzde: hedef ? Math.round(top / hedef * 100) : 0, gunler: gunler.map(t => gunSet.has(t)), mesafe: typeof sporcuMesafe === 'function' ? sporcuMesafe(k.g, k.ad) : null };
}
function glDurum(y) { return y >= 100 ? ['iyi', 'Hedefte'] : y >= 60 ? ['orta', 'Yaklaşıyor'] : ['dusuk', 'Düşük']; }

function kmYukCiz() {
    glCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    if (!_gl.senkY) { _gl.senkY = true; Promise.all(['skorsuz_ok', 'antrenman_hedef', 'sporcu_mesafe'].map(a => kyDepoSenkron(a, () => kyDepoOku(a), false).catch(() => {}))).then(() => { if (_kmAktifSekme === 'yuk') kmYukCiz(); }); }
    let L = glRoster().map(k => Object.assign({ k }, glYuk(k))).sort((a, b) => a.yuzde - b.yuzde);
    let topOk = L.reduce((a, x) => a + x.top, 0), topHedef = L.reduce((a, x) => a + x.hedef, 0), hedefte = L.filter(x => x.yuzde >= 100).length;
    let gunAd = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'], bugunI = (new Date().getDay() + 6) % 7;
    let ayar = _gl.ayar ? `<div class="gl-kart"><div class="gl-etiket">Haftalık ok hedefi (kişi başı)</div><div class="gl-hedefler">${GL_GRUPLAR.map(g => `<label class="gl-hedef-ayar"><span>${GL_GRUP_AD[g]}</span><input type="number" min="0" max="5000" step="10" value="${glHedef(g)}" onchange="glHedefYaz('${g}', this.value); kmYukCiz()" aria-label="${GL_GRUP_AD[g]} haftalık hedef"></label>`).join('')}</div>
        <div class="gl-mini">Araştırma: Kore ilkokul kulübü haftada 1.500+ ok, ABD JOAD kulübü 150–300. Hedefi gerçekçi başlatıp her ay biraz artırın.</div></div>` : '';
    el.innerHTML = `<div class="gl">
        <div class="gl-hero"><div class="gl-hero-m"><div class="gl-ust">KARIŞIK SINIF · ANTRENMAN YÜKÜ</div><div class="gl-baslik">Bu hafta kaç ok attık?</div><div class="gl-alt">Skorlu oklar otomatik sayılır. Isınma ve boş hedef oklarını <b>+</b> düğmeleriyle ekle — hacim ancak böyle doğru görünür.</div></div>
            <div class="gl-hero-sayi"><b>${hedefte}<span>/${L.length}</span></b><small>sporcu hedefte</small></div></div>
        <div class="gl-ozet"><div class="gl-ozet-bar" role="progressbar" aria-valuenow="${topHedef ? Math.min(100, Math.round(topOk / topHedef * 100)) : 0}" aria-valuemin="0" aria-valuemax="100" aria-label="Sınıf haftalık hedef"><i style="width:${topHedef ? Math.min(100, topOk / topHedef * 100) : 0}%"></i></div>
            <span><b>${topOk.toLocaleString('tr-TR')}</b> / ${topHedef.toLocaleString('tr-TR')} ok · sınıf hedefinin %${topHedef ? Math.round(topOk / topHedef * 100) : 0}'i</span>
            <button class="gl-btn" onclick="_gl.ayar=!_gl.ayar; kmYukCiz()" aria-expanded="${_gl.ayar}">⚙️ Hedefler</button></div>
        ${ayar}
        <div class="gl-liste">${L.map(x => {
            let kk = glJs(x.k.g + '|' + x.k.ad), d = glDurum(x.yuzde), olcek = Math.max(x.hedef, x.top) || 1;
            let mesafeSec = `<select class="gl-mesafe" onchange="glMesafeYaz('${kk}', this.value); kmYukCiz()" aria-label="${glEsc(x.k.ad)} atış mesafesi"><option value="0"${x.mesafe ? '' : ' selected'}>📏 mesafe?</option>${GL_MESAFELER.map(m => `<option value="${m}"${x.mesafe === m ? ' selected' : ''}>${m} m</option>`).join('')}</select>`;
            return `<div class="gl-sp">
                <div class="gl-sp-ust">${glAvatar(x.k.g, x.k.ad)}<span class="gl-sp-ad"><b>${glEsc(x.k.ad)}</b><small>${GL_GRUP_AD[x.k.g] || x.k.g}${glPerfMi(x.k.g, x.k.ad) ? ' · ⭐ performans' : ''} · hedef ${x.hedef}</small></span>${mesafeSec}<span class="gl-durum ${d[0]}">${d[1]}</span></div>
                <div class="gl-yuk"><div class="gl-yuk-bar" aria-label="${x.kayitli} skorlu, ${x.skorsuz} skorsuz ok; hedef ${x.hedef}"><i class="k" style="width:${x.kayitli / olcek * 100}%"></i><i class="s" style="width:${x.skorsuz / olcek * 100}%"></i><span class="gl-yuk-hedef" style="left:${x.hedef / olcek * 100}%"></span></div>
                    <span class="gl-yuk-sayi"><b>${x.top}</b>/${x.hedef}</span></div>
                <div class="gl-sp-alt"><span class="gl-gunler" aria-label="Bu hafta atış yapılan günler">${x.gunler.map((v, i) => `<span class="${v ? 'var' : ''}${i === bugunI ? ' bugun' : ''}" title="${gunAd[i]}">${gunAd[i].charAt(0)}</span>`).join('')}</span>
                    <span class="gl-lejant"><i class="k"></i>${x.kayitli} skorlu <i class="s"></i>${x.skorsuz} skorsuz</span>
                    <span class="gl-ekle">${[6, 12, 30].map(n => `<button class="gl-btn kucuk" onclick="glSkorsuzEkle('${kk}', ${n})" aria-label="${glEsc(x.k.ad)} için ${n} skorsuz ok ekle">+${n}</button>`).join('')}${_gl.sonEkle[x.k.g + '|' + x.k.ad] ? `<button class="gl-btn kucuk" onclick="glSkorsuzGeriAl('${kk}')" aria-label="Son eklemeyi geri al">↶</button>` : ''}</span></div>
            </div>`;
        }).join('') || '<div class="gl-bos">Derste sporcu yok.</div>'}</div></div>`;
}

// ---------------------------------------------------------------- 📈 Seviye Testi
function glTestler() { let d = kyDepoOku('seviye_testi'); return Object.keys(d).map(id => Object.assign({ id }, d[id])).filter(x => !x.sil && x.oklar); }
function glSporcuTestleri(g, ad) { return glTestler().filter(x => x.g === g && x.ad === ad).sort((a, b) => (a.tarih || '').localeCompare(b.tarih || '')); }
function glOrt(t) { return t && t.n ? t.puan / t.n : 0; }
function glTarihYaz(iso) { return iso ? new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''; }
function glAy() { return glBugun().slice(0, 7); }
function glTestBaslat(kk) { let k = glKey(kk), p = glProtokol(k.g); _gl.giris = { g: k.g, ad: k.ad, oklar: [], p: { m: p.m, hedef: p.hedef, ok: p.ok } }; kmSeviyeCiz(); }
function glTestOk(v) { let gi = _gl.giris; if (!gi || gi.oklar.length >= gi.p.ok) return; gi.oklar.push(v); kmSeviyeCiz(); }
function glTestSil() { let gi = _gl.giris; if (gi && gi.oklar.length) { gi.oklar.pop(); kmSeviyeCiz(); } }
function glTestKaydet() {
    let gi = _gl.giris; if (!gi || !gi.oklar.length) return;
    let kaydet = () => {
        let id = 'st_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), d = kyDepoOku('seviye_testi');
        d[id] = { g: gi.g, ad: gi.ad, tarih: glBugun(), ay: glAy(), m: gi.p.m, hedef: gi.p.hedef, oklar: gi.oklar.slice(), n: gi.oklar.length, puan: gi.oklar.reduce((a, o) => a + glOkDeger(o), 0), t: Date.now(), kim: (typeof _oturum !== 'undefined' && _oturum && _oturum.ad) || '' };
        kyDepoYazYerel('seviye_testi', d); glSenk('seviye_testi');
        showToast('📈 ' + gi.ad.split(' ')[0] + ' — seviye testi kaydedildi', 'success');
        _gl.giris = null; kmSeviyeCiz();
    };
    if (gi.oklar.length < gi.p.ok) onayIste(`Test ${gi.p.ok} ok, ${gi.oklar.length} ok girildi.<br><span style="font-size:12px;color:var(--text-muted)">Ortalama ok başına puanla kıyaslanır; yine de eksik test daha az güvenilir.</span>`, kaydet, 'Yine de kaydet');
    else kaydet();
}
function glTestSilKayit(id) {
    onayIste('Bu test kaydı silinsin mi?', () => { let d = kyDepoOku('seviye_testi'); d[id] = { t: Date.now(), sil: true }; kyDepoYazYerel('seviye_testi', d); glSenk('seviye_testi'); kmSeviyeCiz(); }, 'Sil');
}
function glCizgi(testler) {
    if (testler.length < 2) return '';
    let W = 260, H = 70, v = testler.map(glOrt), mn = Math.min(...v) - 0.3, mx = Math.max(...v) + 0.3, x = i => 26 + i * (W - 52) / (testler.length - 1), y = val => H - 10 - (val - mn) / (mx - mn || 1) * (H - 22);
    let yol = v.map((val, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(val).toFixed(1)).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="gl-cizgi" role="img" aria-label="Seviye testi ortalamaları"><path d="${yol}" fill="none" stroke="var(--accent-orange)" stroke-width="2.5" stroke-linejoin="round"/>${v.map((val, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(val).toFixed(1)}" r="4" fill="var(--accent-orange)"/><text x="${x(i).toFixed(1)}" y="${(y(val) - 8).toFixed(1)}" text-anchor="middle" font-size="9.5" font-weight="800" fill="currentColor">${val.toFixed(1).replace('.', ',')}</text><text x="${x(i).toFixed(1)}" y="${H - 1}" text-anchor="middle" font-size="8.5" fill="currentColor" opacity=".55">${glEsc((testler[i].tarih || '').slice(5).split('-').reverse().join('.'))}</text>`).join('')}</svg>`;
}
function kmSeviyeCiz() {
    glCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    if (!_gl.senkS) { _gl.senkS = true; Promise.all(['seviye_testi', 'seviye_protokol'].map(a => kyDepoSenkron(a, () => kyDepoOku(a), false).catch(() => {}))).then(() => { if (_kmAktifSekme === 'seviye') kmSeviyeCiz(); }); }
    let gi = _gl.giris;
    if (gi) {
        let top = gi.oklar.reduce((a, o) => a + glOkDeger(o), 0), seriler = [];
        for (let i = 0; i < gi.p.ok; i += 3) seriler.push(gi.oklar.slice(i, i + 3));
        el.innerHTML = `<div class="gl"><div class="gl-kart gl-giris">
            <div class="gl-giris-ust"><div><div class="gl-ust">SEVİYE TESTİ · ${gi.p.m} m · ${glEsc(gi.p.hedef)}</div><div class="gl-baslik">${glEsc(gi.ad)}</div></div>
                <div class="gl-hero-sayi"><b>${top}</b><small>${gi.oklar.length}/${gi.p.ok} ok · ort ${gi.oklar.length ? (top / gi.oklar.length).toFixed(2).replace('.', ',') : '–'}</small></div></div>
            <div class="gl-seriler">${seriler.map((s, i) => `<span class="gl-seri${s.length === 3 ? ' tamam' : ''}${Math.floor(gi.oklar.length / 3) === i ? ' simdi' : ''}"><small>${i + 1}</small>${[0, 1, 2].map(j => `<i class="${s[j] ? 'o-' + s[j] : ''}">${s[j] || ''}</i>`).join('')}</span>`).join('')}</div>
            <div class="gl-pad">${GL_PAD.map(v => `<button class="o-${v}" onclick="glTestOk('${v}')"${gi.oklar.length >= gi.p.ok ? ' disabled' : ''}>${v}</button>`).join('')}</div>
            <div class="gl-butonlar"><button class="gl-btn" onclick="_gl.giris=null; kmSeviyeCiz()">Vazgeç</button><button class="gl-btn" onclick="glTestSil()"${gi.oklar.length ? '' : ' disabled'}>⌫ Sil</button><button class="gl-btn birincil" onclick="glTestKaydet()"${gi.oklar.length ? '' : ' disabled'}>✓ Testi kaydet</button></div>
        </div></div>`;
        return;
    }
    let ay = glAy(), L = glRoster(), tum = glTestler();
    let satirlar = L.map(k => {
        let t = glSporcuTestleri(k.g, k.ad), buAy = t.filter(x => x.ay === ay).pop(), onceki = buAy ? t.filter(x => x.tarih < buAy.tarih && x.m === buAy.m && x.hedef === buAy.hedef).pop() : null;
        let fark = buAy && onceki ? glOrt(buAy) - glOrt(onceki) : null;
        return { k, t, buAy, fark };
    });
    let yapilan = satirlar.filter(x => x.buAy).length;
    let ayAd = new Date().toLocaleDateString('tr-TR', { month: 'long' });
    let protokolHTML = `<div class="gl-protokoller">${GL_GRUPLAR.map(g => { let p = glProtokol(g); return `<div class="gl-protokol"><b>${GL_GRUP_AD[g]}</b>${_gl.ayar ? `<span class="gl-protokol-ayar"><input type="number" min="1" max="100" value="${p.m}" onchange="glProtokolYaz('${g}','m',this.value); kmSeviyeCiz()" aria-label="${GL_GRUP_AD[g]} mesafe"> m <input type="text" value="${glEsc(p.hedef)}" onchange="glProtokolYaz('${g}','hedef',this.value); kmSeviyeCiz()" aria-label="${GL_GRUP_AD[g]} hedef kâğıdı"> <input type="number" min="3" max="144" step="3" value="${p.ok}" onchange="glProtokolYaz('${g}','ok',this.value); kmSeviyeCiz()" aria-label="${GL_GRUP_AD[g]} ok sayısı"> ok</span>` : `<span>${p.m} m · ${glEsc(p.hedef)} · ${p.ok} ok</span>`}</div>`; }).join('')}</div>`;
    el.innerHTML = `<div class="gl">
        <div class="gl-hero"><div class="gl-hero-m"><div class="gl-ust">KARIŞIK SINIF · SEVİYE TESTİ</div><div class="gl-baslik">Gerçekten gelişiyor muyuz?</div><div class="gl-alt">Ayda bir, herkes kendi yaş grubunun <b>aynı mesafe ve hedefinde</b> 30 ok atar. Aynı koşulda atıldığı için aylar arası kıyas gerçektir.</div></div>
            <div class="gl-hero-sayi"><b>${yapilan}<span>/${L.length}</span></b><small>${ayAd} testini yaptı</small></div></div>
        <div class="gl-kart"><div class="gl-kart-ust"><span class="gl-etiket">Test protokolü</span><button class="gl-btn kucuk" onclick="_gl.ayar=!_gl.ayar; kmSeviyeCiz()" aria-expanded="${_gl.ayar}">⚙️ ${_gl.ayar ? 'Tamam' : 'Düzenle'}</button></div>${protokolHTML}</div>
        <div class="gl-liste">${satirlar.map(x => {
            let kk = glJs(x.k.g + '|' + x.k.ad), acik = _gl.detay === x.k.g + '|' + x.k.ad;
            let sag = x.buAy ? `<span class="gl-test-sonuc"><b>${x.buAy.puan}</b><small>ort ${glOrt(x.buAy).toFixed(2).replace('.', ',')}${x.fark != null ? ` · <span class="${x.fark >= 0 ? 'artis' : 'dusus'}">${x.fark >= 0 ? '▲' : '▼'} ${Math.abs(x.fark).toFixed(2).replace('.', ',')}</span>` : ''}</small></span>`
                : `<button class="gl-btn birincil" onclick="glTestBaslat('${kk}')">▶ Teste başla</button>`;
            let detay = acik ? `<div class="gl-detay">${x.t.length >= 2 ? glCizgi(x.t.filter(t => t.m === x.t[x.t.length - 1].m && t.hedef === x.t[x.t.length - 1].hedef).slice(-8)) : '<div class="gl-mini">Gelişim çizgisi için en az 2 test gerekli.</div>'}
                <div class="gl-test-gecmis">${x.t.slice().reverse().slice(0, 8).map(t => `<div><span>${glEsc(glTarihYaz(t.tarih))} · ${t.m} m · ${glEsc(t.hedef)}</span><b>${t.puan}</b><small>${t.n} ok · ort ${glOrt(t).toFixed(2).replace('.', ',')}</small><button class="gl-btn kucuk" onclick="glTestSilKayit('${t.id}')" aria-label="Test kaydını sil">✕</button></div>`).join('') || '<div class="gl-mini">Henüz test yok.</div>'}</div>
                ${x.buAy ? `<button class="gl-btn" onclick="glTestBaslat('${kk}')">↻ Bu ay tekrar test et</button>` : ''}</div>` : '';
            return `<div class="gl-sp"><div class="gl-sp-ust">${glAvatar(x.k.g, x.k.ad)}<button class="gl-sp-ad gl-link" onclick="_gl.detay=${acik ? 'null' : `decodeURIComponent('${kk}')`}; kmSeviyeCiz()" aria-expanded="${acik}"><b>${glEsc(x.k.ad)}</b><small>${GL_GRUP_AD[x.k.g] || x.k.g} · ${x.t.length} test ${acik ? '▴' : '▾'}</small></button>${sag}</div>${detay}</div>`;
        }).join('') || '<div class="gl-bos">Derste sporcu yok.</div>'}</div>
        <div class="gl-mini">Test sonuçları karneye ve skor sıralamasına yazılmaz; yalnızca gelişim ölçümüdür. Önceki testle kıyas, aynı mesafe ve hedefte yapıldıysa gösterilir.</div></div>`;
}

function glCss() {
    if (document.getElementById('gl-css')) return;
    let st = document.createElement('style'); st.id = 'gl-css';
    st.textContent = [
        '.gl{--gl-yuzey:color-mix(in srgb,var(--text-main) 4%,var(--bg-main));--gl-vurgu:var(--accent-orange);display:flex;flex-direction:column;gap:12px}',
        '.gl-hero{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:18px 20px;border-radius:20px;border:1px solid color-mix(in srgb,var(--gl-vurgu) 40%,var(--border-color));background:radial-gradient(420px 160px at 0% 0%,color-mix(in srgb,var(--aurora-cyan,#00f0ff) 14%,transparent),transparent 70%),radial-gradient(420px 180px at 100% 100%,color-mix(in srgb,var(--neon-green,#4FB07A) 14%,transparent),transparent 70%),var(--gl-yuzey)}',
        '.gl-hero-m{flex:1 1 260px;min-width:0}.gl-ust{font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--text-muted)}.gl-baslik{font-size:22px;font-weight:900;margin-top:2px;text-wrap:balance}.gl-alt{font-size:12.5px;color:var(--text-muted);margin-top:3px;line-height:1.45;max-width:62ch}',
        '.gl-hero-sayi{display:flex;flex-direction:column;align-items:flex-end}.gl-hero-sayi b{font-size:36px;font-weight:900;line-height:1;color:var(--gl-vurgu);font-variant-numeric:tabular-nums}.gl-hero-sayi b span{font-size:17px;color:var(--text-muted)}.gl-hero-sayi small{font-size:11px;color:var(--text-muted)}',
        '.gl-ozet{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:12.5px;color:var(--text-muted)}.gl-ozet b{color:var(--text-main)}',
        '.gl-ozet-bar{flex:1 1 200px;height:10px;border-radius:99px;background:color-mix(in srgb,var(--text-main) 12%,transparent);overflow:hidden}.gl-ozet-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--aurora-cyan,#00f0ff),var(--neon-green,#4FB07A))}',
        '.gl-kart,.gl-sp{border:1px solid var(--border-color);border-radius:16px;background:var(--gl-yuzey);padding:12px 14px;display:flex;flex-direction:column;gap:9px}',
        '.gl-kart-ust{display:flex;justify-content:space-between;align-items:center;gap:8px}.gl-etiket{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted)}',
        '.gl-hedefler{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}.gl-hedef-ayar{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;font-weight:700}',
        '.gl input{width:76px;min-height:38px;padding:0 8px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;font-size:13px}.gl input[type=text]{width:90px}',
        '.gl-liste{display:flex;flex-direction:column;gap:8px}',
        '.gl-sp-ust{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.gl-sp-ad{flex:1;min-width:120px;display:flex;flex-direction:column;text-align:left}.gl-sp-ad b{font-size:14px}.gl-sp-ad small{font-size:11px;color:var(--text-muted)}',
        '.gl-link{border:0;background:transparent;color:var(--text-main);font:inherit;cursor:pointer;padding:0}',
        '.gl-avatar{flex-shrink:0;width:32px;height:32px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:900;color:#fff;background:#64748b}.gl-avatar.g-buyukler{background:#3b82f6}.gl-avatar.g-yildizlar{background:#f59e0b}.gl-avatar.g-kucukler{background:#10b981}.gl-avatar.g-minikler{background:#a78bfa}',
        '.gl-mesafe{min-height:36px;padding:0 8px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;font-size:12px;font-weight:700}',
        '.gl-durum{font-size:10.5px;font-weight:900;letter-spacing:.04em;padding:4px 10px;border-radius:99px}.gl-durum.iyi{background:color-mix(in srgb,var(--neon-green) 18%,transparent);color:var(--neon-green)}.gl-durum.orta{background:color-mix(in srgb,var(--gold) 18%,transparent);color:var(--gold)}.gl-durum.dusuk{background:color-mix(in srgb,var(--neon-red) 16%,transparent);color:color-mix(in srgb,var(--neon-red) 80%,var(--text-main))}',
        '.gl-yuk{display:flex;align-items:center;gap:10px}.gl-yuk-bar{position:relative;flex:1;height:14px;border-radius:99px;background:color-mix(in srgb,var(--text-main) 10%,transparent);display:flex;overflow:visible}',
        '.gl-yuk-bar i{display:block;height:100%}.gl-yuk-bar i.k{background:linear-gradient(90deg,#f6c929,#ff9f1a);border-radius:99px 0 0 99px}.gl-yuk-bar i.s{background:repeating-linear-gradient(45deg,#8b7fff,#8b7fff 5px,#a99fff 5px,#a99fff 10px)}',
        '.gl-yuk-hedef{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--text-main);border-radius:2px;transform:translateX(-1px)}',
        '.gl-yuk-sayi{min-width:74px;text-align:right;font-size:12px;color:var(--text-muted);font-variant-numeric:tabular-nums}.gl-yuk-sayi b{font-size:16px;color:var(--text-main)}',
        '.gl-sp-alt{display:flex;align-items:center;gap:12px;flex-wrap:wrap}',
        '.gl-gunler{display:flex;gap:3px}.gl-gunler span{width:22px;height:22px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:var(--text-muted);border:1px solid var(--border-color)}.gl-gunler span.var{background:var(--neon-green);border-color:var(--neon-green);color:#fff}.gl-gunler span.bugun{outline:2px solid var(--gl-vurgu);outline-offset:1px}',
        '.gl-lejant{font-size:11px;color:var(--text-muted);display:flex;align-items:center;gap:5px}.gl-lejant i{display:inline-block;width:10px;height:10px;border-radius:3px}.gl-lejant i.k{background:#f6c929}.gl-lejant i.s{background:#8b7fff;margin-left:6px}',
        '.gl-ekle{margin-left:auto;display:flex;gap:5px}',
        '.gl-btn{min-height:40px;padding:0 13px;border-radius:11px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}.gl-btn.kucuk{min-height:36px;padding:0 10px}.gl-btn:hover{border-color:var(--gl-vurgu)}.gl-btn:disabled{opacity:.4;cursor:default}',
        '.gl-btn.birincil{background:var(--gl-vurgu);border-color:var(--gl-vurgu);color:var(--bg-main)}',
        '.gl-btn:focus-visible,.gl-link:focus-visible,.gl-pad button:focus-visible,.gl select:focus-visible,.gl input:focus-visible{outline:2px solid var(--gl-vurgu);outline-offset:2px}',
        '.gl-mini{font-size:11.5px;color:var(--text-muted)}.gl-bos{padding:20px;text-align:center;color:var(--text-muted)}',
        '.gl-protokoller{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:8px}.gl-protokol{display:flex;flex-direction:column;gap:3px;padding:9px 12px;border-radius:12px;border:1px solid var(--border-color)}.gl-protokol b{font-size:13px}.gl-protokol span{font-size:12px;color:var(--text-muted)}.gl-protokol-ayar{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.gl-protokol-ayar input{width:58px}',
        '.gl-test-sonuc{display:flex;flex-direction:column;align-items:flex-end}.gl-test-sonuc b{font-size:20px;font-weight:900;color:var(--gl-vurgu)}.gl-test-sonuc small{font-size:11px;color:var(--text-muted)}.artis{color:var(--neon-green);font-weight:800}.dusus{color:color-mix(in srgb,var(--neon-red) 80%,var(--text-main));font-weight:800}',
        '.gl-detay{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--border-color);padding-top:8px}.gl-cizgi{width:100%;max-width:420px;height:auto;color:var(--text-main)}',
        '.gl-test-gecmis{display:flex;flex-direction:column}.gl-test-gecmis>div{display:grid;grid-template-columns:1fr auto auto auto;gap:10px;align-items:center;padding:6px 0;border-top:1px solid var(--border-color);font-size:12px}.gl-test-gecmis>div:first-child{border-top:0}.gl-test-gecmis span{color:var(--text-muted)}.gl-test-gecmis b{font-size:15px}.gl-test-gecmis small{color:var(--text-muted)}',
        '.gl-giris{gap:14px}.gl-giris-ust{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}',
        '.gl-seriler{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:6px}.gl-seri{display:flex;align-items:center;gap:4px;padding:6px 8px;border-radius:10px;border:1px solid var(--border-color)}.gl-seri small{width:16px;font-size:10px;color:var(--text-muted);font-weight:800}.gl-seri.simdi{border-color:var(--gl-vurgu)}.gl-seri.tamam{background:color-mix(in srgb,var(--text-main) 4%,transparent)}',
        '.gl-seri i{width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-size:11px;font-weight:900;border:1px dashed var(--border-color)}',
        '.gl-pad{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.gl-pad button{min-height:54px;border-radius:12px;border:0;font:inherit;font-size:19px;font-weight:900;cursor:pointer}.gl-pad button:disabled{opacity:.35}',
        '.o-X,.o-10,.o-9{background:#f6c929;color:#1a1a1a;border-style:solid!important}.o-8,.o-7{background:#e0393e;color:#fff;border-style:solid!important}.o-6,.o-5{background:#2f8fd8;color:#fff;border-style:solid!important}.o-4,.o-3{background:#2b2b2b;color:#fff;border-style:solid!important}.o-2,.o-1{background:#f2f2f2;color:#111;border-style:solid!important}.o-M{background:#475569;color:#fff;border-style:solid!important}',
        '.gl-butonlar{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}',
        '@media (max-width:520px){.gl-ekle{margin-left:0;width:100%}.gl-ekle .gl-btn{flex:1}.gl-pad{grid-template-columns:repeat(4,1fr)}}',
        '.gl-donem{gap:10px}.gl-donem-bar{height:10px;border-radius:99px;background:color-mix(in srgb,var(--text-main) 10%,transparent);overflow:hidden}.gl-donem-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#f59e0b,#fbbf24)}',
        '.gl-donem-alt{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:13px}.gl-donem-alt span{color:var(--text-muted)}.gl-donem.bitti{border-color:#fbbf24}',
        '.gl-donem label{display:inline-flex;align-items:center;gap:5px}.gl-donem input[type=checkbox]{-webkit-appearance:checkbox!important;appearance:auto!important;width:16px;height:16px;accent-color:#f59e0b}.gl-donem input[type=date]{min-height:34px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);padding:0 6px}'
    ].concat(GL_CSS_ADIM2, GL_CSS_ADIM34).join('\n');
    document.head.appendChild(st);
}

// ================================================================================================
// 🏆 KULÜP LİGİ (adım 2a) — araştırma: Kore'de sporcular ayda 2 kez yarışıyor. Takvim kuralı (varsayılan ayın 1. ve
// 3. Cumartesi) + ek/iptal günler; sonuçlar Sıralama Turu arşivinden (meta yz_arsiv, dagsk-km-yarisma-pro.js) gelir:
// lig gününde atılan tur otomatik sayılır, başka tur elle eklenir. Puan: kategori (yaş grubu × yay) içinde sıraya göre
// 25-18-15-12-10-8-6-4-2-1 + katılım 2. Meta kulup_lig: 'ayar' {haftalar,gun,sezonBas}, 'gun|iso' {ek|iptal},
// 'tur|id' {say}.
// ================================================================================================
const GL_LIG_PUAN = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1], GL_LIG_KATILIM = 2;
const GL_GUN_AD = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
function glLigDepo() { return kyDepoOku('kulup_lig'); }
function glLigAyar() {
    let a = glLigDepo().ayar, y = new Date().getFullYear(), m = new Date().getMonth();
    let d = glDonemVarsayilan(y, m);
    let o = Object.assign({ haftalar: [1, 3], gun: 6, sezonBas: d.bas, sezonBit: d.bit, devamPuani: true }, a && !a.sil ? a : {});
    if (!o.sezonBit || o.sezonBit < o.sezonBas) o.sezonBit = glDonemVarsayilan(+o.sezonBas.slice(0, 4), +o.sezonBas.slice(5, 7) - 1).bit;
    return o;
}
// Dönem ligi (2026-10-07, kullanıcı: "dönem boyunca puanlar toplansın, dönem sonunda kupa töreni"):
// Güz = 1 Eylül – 31 Ocak, Bahar = 1 Şubat – 30 Haziran, Yaz = 1 Temmuz – 31 Ağustos (ayardan değiştirilebilir).
function glDonemVarsayilan(y, m) {
    if (m >= 8) return { ad: 'Güz', bas: y + '-09-01', bit: (y + 1) + '-01-31' };
    if (m === 0) return { ad: 'Güz', bas: (y - 1) + '-09-01', bit: y + '-01-31' };
    if (m <= 5) return { ad: 'Bahar', bas: y + '-02-01', bit: y + '-06-30' };
    return { ad: 'Yaz', bas: y + '-07-01', bit: y + '-08-31' };
}
function glDonemAd(a) { let m = +a.sezonBas.slice(5, 7); return (m === 9 ? 'Güz' : m === 2 ? 'Bahar' : m === 7 ? 'Yaz' : 'Dönem') + ' ' + a.sezonBas.slice(0, 4) + (a.sezonBit.slice(0, 4) !== a.sezonBas.slice(0, 4) ? '–' + a.sezonBit.slice(2, 4) : ''); }
function glDonemSec(tur) {
    let a = glLigAyar(), y = new Date().getFullYear(), m = new Date().getMonth(), d;
    if (tur === 'simdi') d = glDonemVarsayilan(y, m);
    else if (tur === 'guz') d = glDonemVarsayilan(m >= 8 || m === 0 ? (m === 0 ? y - 1 : y) : y - 1, 8);
    else if (tur === 'bahar') d = glDonemVarsayilan(m >= 1 && m <= 7 ? y : y + (m >= 8 ? 1 : 0), 1);
    if (d) { a.sezonBas = d.bas; a.sezonBit = d.bit; glLigYaz('ayar', a); }
    kmLigCiz();
}
// Devam puanı: dönem içinde antrenmana gelinen her gün +1 (yoklama "geldi" ya da o gün seri girilmiş). Lig günü
// gelmeyen ama düzenli antrenmana gelen çocuk da tabloda görünsün diye.
const GL_DEVAM_PUAN = 1;
function glDevamGunleri(g, ad, bas, bit) {
    let gunler = new Set(), sp = turnuvaDB[g] && turnuvaDB[g][ad];
    Object.keys(otomatikYoklamaDB || {}).forEach(t => { if (t < bas || t > bit) return; let r = otomatikYoklamaDB[t][ad]; if (r && r.geldi !== false && (!r.grup || r.grup === g)) gunler.add(t); });
    ((sp && sp.seriler) || []).forEach(x => { let t = x && (x.tarih || '').slice(0, 10); if (t && t >= bas && t <= bit) gunler.add(t); });
    return gunler.size;
}
function glLigYaz(anahtar, deger) { let d = glLigDepo(); d[anahtar] = Object.assign({ t: Date.now() }, deger); kyDepoYazYerel('kulup_lig', d); glSenk('kulup_lig'); }
function glLigAyarYaz(alan, v) { let a = glLigAyar(); a[alan] = v; glLigYaz('ayar', a); kmLigCiz(); }
// Ayın n. <gün>ü
function glAyinGunu(y, m, gun, n) { let d = new Date(y, m, 1), fark = (gun - d.getDay() + 7) % 7; let g = new Date(y, m, 1 + fark + (n - 1) * 7); return g.getMonth() === m ? bsIsoTarih(g) : null; }
function glLigGunleri(basIso, sonIso) {
    let a = glLigAyar(), d = glLigDepo(), out = new Set();
    let b = new Date(basIso + 'T12:00'), s = new Date(sonIso + 'T12:00');
    for (let y = b.getFullYear(), m = b.getMonth(); new Date(y, m, 1) <= s; m++) { if (m > 11) { m = 0; y++; } (a.haftalar || []).forEach(n => { let t = glAyinGunu(y, m, a.gun, n); if (t && t >= basIso && t <= sonIso) out.add(t); }); }
    Object.keys(d).forEach(k => { if (!k.startsWith('gun|')) return; let t = k.slice(4), v = d[k]; if (v.sil) return; if (v.ek && t >= basIso && t <= sonIso) out.add(t); if (v.iptal) out.delete(t); });
    return [...out].sort();
}
function glLigTurlari() {
    let a = glLigAyar(), d = glLigDepo(), bugun = glBugun(), gunler = new Set(glLigGunleri(a.sezonBas, bugun < a.sezonBit ? bugun : a.sezonBit));
    let arsiv = []; try { arsiv = JSON.parse(localStorage.getItem('dag_yz_arsiv') || '[]') || []; } catch (e) {}
    return arsiv.filter(r => r && r.tarih >= a.sezonBas && r.tarih <= a.sezonBit && Array.isArray(r.sporcular) && r.sporcular.length).map(r => {
        let el = d['tur|' + r.id], otomatik = gunler.has(r.tarih), say = el && !el.sil ? !!el.say : otomatik;
        return Object.assign({}, r, { say, otomatik });
    }).sort((x, y) => (x.t || 0) - (y.t || 0));
}
function glKategori(g, ad) { let sp = turnuvaDB[g] && turnuvaDB[g][ad], mak = /makaral/i.test((sp && sp.yay) || ''); return g + '|' + (mak ? 'makarali' : 'klasik'); }
function glKategoriAd(k) { let [g, y] = k.split('|'); return (GL_GRUP_AD[g] || g) + ' · ' + (y === 'makarali' ? 'Makaralı' : 'Klasik'); }
function glLigTablo() {
    let tablo = {}, turlar = glLigTurlari().filter(t => t.say);
    turlar.forEach((tur, ti) => {
        let kat = {};
        tur.sporcular.forEach(s => { let [g, ...r] = String(s.k || '').split('|'), ad = r.join('|') || s.ad; if (!g || !turnuvaDB[g] || !turnuvaDB[g][ad]) return; (kat[glKategori(g, ad)] = kat[glKategori(g, ad)] || []).push({ g, ad, toplam: s.toplam || 0 }); });
        Object.keys(kat).forEach(k => kat[k].sort((a, b) => b.toplam - a.toplam).forEach((s, i) => {
            let sira = i > 0 && s.toplam === kat[k][i - 1].toplam ? kat[k][i - 1].sira : i + 1; s.sira = sira;
            let tk = (tablo[k] = tablo[k] || {}), e = tk[s.g + '|' + s.ad] = tk[s.g + '|' + s.ad] || { g: s.g, ad: s.ad, puan: 0, katilim: 0, enIyi: 99, son: [] };
            e.puan += (GL_LIG_PUAN[sira - 1] || 0) + GL_LIG_KATILIM; e.katilim++; e.enIyi = Math.min(e.enIyi, sira); e.son.push({ ti, sira });
        }));
    });
    let a = glLigAyar();
    if (a.devamPuani !== false) {
        let bit = glBugun() < a.sezonBit ? glBugun() : a.sezonBit;
        GL_GRUPLAR.forEach(g => Object.keys(turnuvaDB[g] || {}).forEach(ad => {
            let sp = turnuvaDB[g][ad]; if (!sp || sp.pasif) return;
            try { if (typeof kisiTuru === 'function' && kisiTuru(g, ad) !== 'sporcu') return; } catch (e) {}
            let n = glDevamGunleri(g, ad, a.sezonBas, bit); if (!n) return;
            let k = glKategori(g, ad), tk = (tablo[k] = tablo[k] || {}), e = tk[g + '|' + ad] = tk[g + '|' + ad] || { g, ad, puan: 0, katilim: 0, enIyi: 99, son: [] };
            e.devam = n; e.puan += n * GL_DEVAM_PUAN;
        }));
    }
    return { tablo, turSay: turlar.length };
}
function glLigTurSay(id, say) { glLigYaz('tur|' + id, { say }); kmLigCiz(); }
function glLigGunDegis(iso, alan) { let d = glLigDepo(), e = d['gun|' + iso]; glLigYaz('gun|' + iso, alan === 'iptal' ? { iptal: !(e && e.iptal) } : { ek: true }); kmLigCiz(); }
function glLigGunEkle() { let el = document.getElementById('gl-lig-ek'); if (el && el.value) glLigGunDegis(el.value, 'ek'); }
function glLigBaslat() { try { kmAracSec('yarisma'); } catch (e) {} showToast('🏆 Lig günü — Yarışma › Sıralama Turu ile başlat; sonuç lige otomatik sayılır', 'info'); }
function glDonemKartHTML(a, tablo) {
    let bugun = glBugun(), kalan = Math.round((new Date(a.sezonBit + 'T12:00') - new Date(bugun + 'T12:00')) / 864e5), bitti = kalan < 0;
    let topGun = Math.max(1, Math.round((new Date(a.sezonBit + 'T12:00') - new Date(a.sezonBas + 'T12:00')) / 864e5)), gecen = Math.min(topGun, Math.max(0, topGun - Math.max(0, kalan)));
    let tarih = t => new Date(t + 'T12:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    let kisi = Object.keys(tablo).reduce((n, k) => n + Object.keys(tablo[k]).length, 0);
    return `<div class="gl-kart gl-donem${bitti ? ' bitti' : ''}">
        <div class="gl-kart-ust"><span class="gl-etiket">🗓 Dönem · ${glEsc(glDonemAd(a))}</span><span class="gl-mini">${tarih(a.sezonBas)} – ${tarih(a.sezonBit)}</span></div>
        <div class="gl-donem-bar"><i style="width:${(gecen / topGun * 100).toFixed(1)}%"></i></div>
        <div class="gl-donem-alt"><b>${bitti ? 'Dönem bitti — kupa zamanı! 🏆' : kalan === 0 ? 'Dönemin son günü' : 'Dönem sonuna ' + kalan + ' gün'}</b><span>${kisi} sporcu puan topladı</span></div>
        <div class="gl-butonlar" style="justify-content:flex-start">
            <button class="gl-btn birincil" onclick="glDonemToreni()" ${kisi ? '' : 'disabled'}>🏆 Dönem kupa töreni</button>
            <button class="gl-btn kucuk" onclick="glDonemSec('simdi')">Bu dönem</button><button class="gl-btn kucuk" onclick="glDonemSec('guz')">Güz</button><button class="gl-btn kucuk" onclick="glDonemSec('bahar')">Bahar</button>
            <label class="gl-mini">Başlangıç <input type="date" value="${a.sezonBas}" onchange="glLigAyarYaz('sezonBas', this.value)"></label>
            <label class="gl-mini">Bitiş <input type="date" value="${a.sezonBit}" onchange="glLigAyarYaz('sezonBit', this.value)"></label>
            <label class="gl-mini"><input type="checkbox" ${a.devamPuani !== false ? 'checked' : ''} onchange="glLigAyarYaz('devamPuani', this.checked)"> Antrenman günü +1</label>
        </div></div>`;
}
// 🏆 Dönem kupa töreni — Sıralama Turu'nun madalya töreni görselleri/sesleri (dagsk-km-yarisma-pro.js), her kategori bir sahne.
function glDonemToreni() {
    let a = glLigAyar(), { tablo } = glLigTablo();
    let kat = Object.keys(tablo).sort((x, y) => GL_GRUPLAR.indexOf(x.split('|')[0]) - GL_GRUPLAR.indexOf(y.split('|')[0]) || x.localeCompare(y));
    let sahne = kat.map(k => {
        let l = Object.values(tablo[k]).filter(s => s.puan > 0).sort((x, y) => y.puan - x.puan || x.enIyi - y.enIyi).slice(0, 3);
        return { ad: glKategoriAd(k), liste: l.map((s, i) => ({ k: s.g + '|' + s.ad, ad: s.ad, sira: i + 1, puan: s.puan, alt: (s.katilim ? s.katilim + ' lig turu' : '') + (s.devam ? (s.katilim ? ' · ' : '') + s.devam + ' gün antrenman' : '') })) };
    }).filter(x => x.liste.length);
    if (!sahne.length) return showToast('Törende gösterilecek puan yok.', 'warning');
    let katilimci = [];
    kat.forEach(k => Object.values(tablo[k]).sort((x, y) => y.puan - x.puan).forEach(s => katilimci.push(s.g + '|' + s.ad)));
    dagskEkYukle('dagsk-km-yarisma-pro.js').then(() => yzOzelToren({ ust: 'DAĞ S.K. · ' + glDonemAd(a) + ' DÖNEMİ', baslik: 'DÖNEM KUPASI', sahne, katilimci, puanEtiket: 'puan' }))
        .catch(() => showToast('Tören açılamadı — bağlantını kontrol et.', 'error'));
}
function kmLigCiz() {
    glCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    if (!_gl.senkL) { _gl.senkL = true; kyDepoSenkron('kulup_lig', () => kyDepoOku('kulup_lig'), false).catch(() => {}).then(() => fetch('/api/meta/yz_arsiv')).then(r => r && r.json ? r.json() : null).then(d => {
        if (d && d.value) { try { let uzak = JSON.parse(d.value) || [], yerel = JSON.parse(localStorage.getItem('dag_yz_arsiv') || '[]') || [], m = {}; yerel.concat(uzak).forEach(r => { if (r && r.id) m[r.id] = r; }); localStorage.setItem('dag_yz_arsiv', JSON.stringify(Object.values(m))); } catch (e) {} }
        if (_kmAktifSekme === 'lig') kmLigCiz(); }).catch(() => {}); }
    let a = glLigAyar(), bugun = glBugun(), ileri = bsIsoTarih(new Date(Date.now() + 70 * 864e5));
    let yakin = glLigGunleri(bsIsoTarih(new Date(Date.now() - 35 * 864e5)), ileri), turlar = glLigTurlari(), { tablo, turSay } = glLigTablo();
    let turTarih = new Set(turlar.filter(t => t.say).map(t => t.tarih)), siradaki = yakin.find(t => t >= bugun);
    let kalanGun = siradaki ? Math.round((new Date(siradaki + 'T12:00') - new Date(bugun + 'T12:00')) / 864e5) : null;
    let iptaller = Object.keys(glLigDepo()).filter(k => k.startsWith('gun|') && glLigDepo()[k].iptal).map(k => k.slice(4)).filter(t => t >= bugun);
    let takvim = yakin.concat(iptaller).sort().map(t => {
        let gecmis = t < bugun, iptal = iptaller.includes(t), yapildi = turTarih.has(t), gun = new Date(t + 'T12:00');
        return `<div class="gl-lig-gun${t === bugun ? ' bugun' : ''}${iptal ? ' iptal' : ''}${gecmis ? ' gecmis' : ''}"><b>${gun.getDate()}</b><span>${gun.toLocaleDateString('tr-TR', { month: 'short' })} · ${['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'][gun.getDay()]}</span><small>${iptal ? 'iptal' : yapildi ? '✓ yapıldı' : gecmis ? 'tur yok' : t === bugun ? 'BUGÜN' : Math.round((gun - new Date(bugun + 'T12:00')) / 864e5) + ' gün'}</small>${!gecmis ? `<button class="gl-btn kucuk" onclick="glLigGunDegis('${t}','iptal')">${iptal ? 'Geri al' : 'İptal'}</button>` : ''}</div>`;
    }).join('');
    let kategoriler = Object.keys(tablo).sort((x, y) => GL_GRUPLAR.indexOf(x.split('|')[0]) - GL_GRUPLAR.indexOf(y.split('|')[0]) || x.localeCompare(y));
    if (!_gl.ligKat || !tablo[_gl.ligKat]) _gl.ligKat = kategoriler[0] || null;
    let satirlar = _gl.ligKat ? Object.values(tablo[_gl.ligKat]).sort((x, y) => y.puan - x.puan || x.enIyi - y.enIyi) : [];
    let madalya = s => s === 1 ? 'a' : s === 2 ? 'g' : s === 3 ? 'b' : '';
    el.innerHTML = `<div class="gl">
        <div class="gl-hero lig"><div class="gl-hero-m"><div class="gl-ust">KARIŞIK SINIF · KULÜP LİGİ</div><div class="gl-baslik">${siradaki ? (kalanGun === 0 ? 'Bugün lig günü!' : 'Sıradaki lig günü: ' + new Date(siradaki + 'T12:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })) : 'Takvimde yaklaşan lig günü yok'}</div>
            <div class="gl-alt">Kore'de sporcular ayda 2 kez yarışıyor. Lig gününde <b>Yarışma › Sıralama Turu</b> at — sonuç sezon tablosuna kendiliğinden işlenir.</div>
            ${kalanGun === 0 ? '<button class="gl-btn birincil" style="margin-top:8px" onclick="glLigBaslat()">🏹 Sıralama Turu\'nu aç</button>' : ''}</div>
            <div class="gl-hero-sayi"><b>${turSay}</b><small>sezonda lige sayılan tur</small></div></div>
        <div class="gl-kart"><div class="gl-kart-ust"><span class="gl-etiket">Takvim</span><span class="gl-lig-kural">
            <select onchange="glLigAyarYaz('haftalar', this.value.split(',').map(Number))" aria-label="Ayın hangi haftaları">${[['1,3', '1. ve 3.'], ['2,4', '2. ve 4.'], ['1,2,3,4', 'Her'], ['1', 'Yalnız 1.'], ['2', 'Yalnız 2.']].map(o => `<option value="${o[0]}"${(a.haftalar || []).join(',') === o[0] ? ' selected' : ''}>${o[1]}</option>`).join('')}</select>
            <select onchange="glLigAyarYaz('gun', Number(this.value))" aria-label="Haftanın günü">${[1, 2, 3, 4, 5, 6, 0].map(g => `<option value="${g}"${a.gun === g ? ' selected' : ''}>${GL_GUN_AD[g]}</option>`).join('')}</select>
            <input id="gl-lig-ek" type="date" aria-label="Ek lig günü"><button class="gl-btn kucuk" onclick="glLigGunEkle()">+ Gün ekle</button></span></div>
            <div class="gl-lig-takvim">${takvim || '<div class="gl-mini">Takvim boş.</div>'}</div></div>
        ${glDonemKartHTML(a, tablo)}
        <div class="gl-kart"><div class="gl-kart-ust"><span class="gl-etiket">Dönem tablosu · ${glEsc(glDonemAd(a))}</span><span class="gl-mini">Lig turu: 25-18-15-12-10-8-6-4-2-1 · katılım +2${a.devamPuani !== false ? ' · antrenman günü +1' : ''}</span></div>
            ${kategoriler.length ? `<div class="gl-cipler">${kategoriler.map(k => `<button class="${_gl.ligKat === k ? 'aktif' : ''}" onclick="_gl.ligKat='${k}'; kmLigCiz()">${glEsc(glKategoriAd(k))}</button>`).join('')}</div>
            <div class="gl-lig-tablo">${satirlar.map((s, i) => `<div class="gl-lig-satir"><span class="gl-lig-sira ${i < 3 ? 's' + (i + 1) : ''}">${i + 1}</span>${glAvatar(s.g, s.ad)}<span class="gl-sp-ad"><b>${glEsc(s.ad)}</b><small>${s.katilim ? s.katilim + ' tur · en iyi ' + s.enIyi + '.' : 'lig turu yok'}${s.devam ? ' · ' + s.devam + ' gün antrenman' : ''}</small></span><span class="gl-lig-son">${s.son.slice(-6).map(x => `<i class="${madalya(x.sira)}" title="${x.sira}.">${x.sira}</i>`).join('')}</span><b class="gl-lig-puan">${s.puan}</b></div>`).join('')}</div>`
            : '<div class="gl-bos">Henüz lige sayılan tur yok. İlk lig gününde Sıralama Turu atın.</div>'}</div>
        <div class="gl-kart"><div class="gl-etiket">Sezondaki Sıralama Turları — lige sayılsın mı?</div>${turlar.length ? turlar.slice().reverse().slice(0, 12).map(t => `<label class="gl-lig-tur"><input type="checkbox" ${t.say ? 'checked' : ''} onchange="glLigTurSay('${t.id}', this.checked)"><span><b>${glEsc(glTarihYaz(t.tarih))}</b><small>${t.sporcular.length} sporcu · ${glEsc(t.mesafe || '')} ${t.otomatik ? '· lig günü' : ''}</small></span></label>`).join('') : '<div class="gl-mini">Bu sezon Sıralama Turu atılmamış.</div>'}</div>
    </div>`;
}

// ================================================================================================
// 💪 YAY & KUVVET (adım 2b) — libre/çekiş geçmişi + SPT (ankrajda tutuş) kronometresi. Kural (Teknik Koçluk ile aynı):
// ankrajda 10 sn titremeden tutamayan çocuğun yayı ağırdır; 90 gündür libresi değişmemiş ve rahat tutan → artırmayı
// düşün (birkaç ayda bir 2-5 lb). Meta yay_libre {g|ad: {k:[{tarih,lb,cekis}]}}, spt_kayit {g|ad|tarih: {sn, tekrar}}.
// ================================================================================================
function glLibre(g, ad) { let o = kyDepoOku('yay_libre')[g + '|' + ad]; return o && !o.sil && Array.isArray(o.k) ? o.k : []; }
function glLibreEkle(kk) {
    let k = glKey(kk), lb = parseFloat((document.getElementById('gl-lb-' + kk) || {}).value), ce = parseFloat((document.getElementById('gl-ce-' + kk) || {}).value);
    if (!(lb > 5 && lb < 90)) return showToast('Libre 6-89 arası olmalı', 'warning');
    let d = kyDepoOku('yay_libre'), l = glLibre(k.g, k.ad).concat([{ tarih: glBugun(), lb, cekis: ce > 10 && ce < 40 ? ce : null }]);
    d[k.g + '|' + k.ad] = { k: l.slice(-20), t: Date.now() }; kyDepoYazYerel('yay_libre', d); glSenk('yay_libre');
    showToast('💪 ' + k.ad.split(' ')[0] + ': ' + lb + ' lb kaydedildi', 'success'); kmKuvvetCiz();
}
function glSpt(g, ad) { let d = kyDepoOku('spt_kayit'), p = g + '|' + ad + '|', out = []; Object.keys(d).forEach(x => { if (x.startsWith(p) && !d[x].sil && d[x].sn) out.push({ tarih: x.slice(p.length), sn: d[x].sn, tekrar: d[x].tekrar || 1 }); }); return out.sort((a, b) => a.tarih.localeCompare(b.tarih)); }
function glSptKaydet(kk, sn) {
    let k = glKey(kk), anahtar = k.g + '|' + k.ad + '|' + glBugun(), d = kyDepoOku('spt_kayit'), e = d[anahtar] && !d[anahtar].sil ? d[anahtar] : { sn: 0, tekrar: 0 };
    d[anahtar] = { sn: Math.max(e.sn || 0, Math.round(sn * 10) / 10), tekrar: (e.tekrar || 0) + 1, t: Date.now() };
    let sinir = bsIsoTarih(new Date(Date.now() - 200 * 864e5)); Object.keys(d).forEach(x => { if (x.split('|').pop() < sinir) delete d[x]; });
    kyDepoYazYerel('spt_kayit', d); glSenk('spt_kayit');
    showToast('⏱️ ' + k.ad.split(' ')[0] + ': ' + (Math.round(sn * 10) / 10).toString().replace('.', ',') + ' sn tutuş', 'success'); kmKuvvetCiz();
}
function glSptBasla(kk) {
    if (_gl.spt && _gl.spt.kk === kk) { let sn = (Date.now() - _gl.spt.bas) / 1000; clearInterval(_gl.spt.iv); _gl.spt = null; if (sn >= 1) glSptKaydet(kk, sn); else kmKuvvetCiz(); return; }
    if (_gl.spt) clearInterval(_gl.spt.iv);
    _gl.spt = { kk, bas: Date.now(), iv: setInterval(() => { let e = document.getElementById('gl-spt-sure'); if (e && _gl.spt) e.textContent = ((Date.now() - _gl.spt.bas) / 1000).toFixed(1).replace('.', ','); else if (_gl.spt) { clearInterval(_gl.spt.iv); _gl.spt = null; } }, 100) };
    kmKuvvetCiz();
}
function glKuvvetDurum(lib, spt) {
    let son = spt.slice(-3), enIyi = son.length ? Math.max(...son.map(x => x.sn)) : null, lbSon = lib[lib.length - 1];
    let gun = lbSon ? Math.round((new Date(glBugun() + 'T12:00') - new Date(lbSon.tarih + 'T12:00')) / 864e5) : null;
    if (enIyi != null && enIyi < 6) return ['dusuk', 'Yay ağır olabilir', 'Son tutuşlar 6 sn altında — libreyi düşürmeyi ya da SPT\'ye ağırlık vermeyi düşün.'];
    if (lbSon && gun >= 90 && enIyi != null && enIyi >= 10) return ['orta', 'Libre artırılabilir', gun + ' gündür ' + lbSon.lb + ' lb ve ' + enIyi.toString().replace('.', ',') + ' sn rahat tutuyor — 2-4 lb artırmayı değerlendir.'];
    if (!lbSon) return ['bos', 'Libre girilmedi', 'Yayın libresini gir — ilerleme buradan izlenir.'];
    if (enIyi == null) return ['bos', 'SPT ölçülmedi', 'Ankrajda tutuş süresini ölç: yayı çek, ankrajda tut, kronometreyi durdur.'];
    return ['iyi', 'Uygun', lbSon.lb + ' lb · son en iyi tutuş ' + enIyi.toString().replace('.', ',') + ' sn'];
}
function glSptGrafik(spt) {
    if (spt.length < 2) return '';
    let s = spt.slice(-10), W = 150, H = 40, mx = Math.max(15, ...s.map(x => x.sn)), bw = W / s.length;
    return `<svg viewBox="0 0 ${W} ${H}" class="gl-spt-grafik" role="img" aria-label="Son SPT tutuş süreleri"><line x1="0" x2="${W}" y1="${(H - 10 / mx * (H - 4)).toFixed(1)}" y2="${(H - 10 / mx * (H - 4)).toFixed(1)}" stroke="currentColor" stroke-dasharray="3 3" opacity=".35"/>${s.map((x, i) => { let h = x.sn / mx * (H - 4); return `<rect x="${(i * bw + bw * .2).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${(bw * .6).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${x.sn >= 10 ? 'var(--neon-green)' : x.sn >= 6 ? 'var(--gold)' : 'var(--neon-red)'}"/>`; }).join('')}</svg>`;
}
function kmKuvvetCiz() {
    glCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    if (!_gl.senkK) { _gl.senkK = true; Promise.all(['yay_libre', 'spt_kayit'].map(a => kyDepoSenkron(a, () => kyDepoOku(a), false).catch(() => {}))).then(() => { if (_kmAktifSekme === 'kuvvet' && !_gl.spt) kmKuvvetCiz(); }); }
    let L = glRoster().map(k => { let lib = glLibre(k.g, k.ad), spt = glSpt(k.g, k.ad); return { k, lib, spt, d: glKuvvetDurum(lib, spt) }; });
    let sira = { dusuk: 0, orta: 1, bos: 2, iyi: 3 }; L.sort((a, b) => sira[a.d[0]] - sira[b.d[0]]);
    let uyari = L.filter(x => x.d[0] === 'dusuk' || x.d[0] === 'orta').length;
    el.innerHTML = `<div class="gl">
        <div class="gl-hero kuvvet"><div class="gl-hero-m"><div class="gl-ust">KARIŞIK SINIF · YAY & KUVVET</div><div class="gl-baslik">Yay çocuğa uygun mu?</div><div class="gl-alt">SPT: yayı çek, ankrajda tut. <b>10 saniye titremeden</b> tutabiliyorsa yay uygun; 6 saniyenin altındaysa ağır. Rahat tutan çocukta libre birkaç ayda bir 2-5 lb artar.</div></div>
            <div class="gl-hero-sayi"><b>${uyari}</b><small>sporcu için öneri var</small></div></div>
        <div class="gl-liste">${L.map(x => {
            let kk = glJs(x.k.g + '|' + x.k.ad), son = x.lib[x.lib.length - 1], aktif = _gl.spt && _gl.spt.kk === kk;
            return `<div class="gl-sp"><div class="gl-sp-ust">${glAvatar(x.k.g, x.k.ad)}<span class="gl-sp-ad"><b>${glEsc(x.k.ad)}</b><small>${GL_GRUP_AD[x.k.g] || x.k.g}${son ? ' · ' + son.lb + ' lb' + (son.cekis ? ' · ' + son.cekis + '"' : '') : ''}</small></span><span class="gl-durum ${x.d[0] === 'bos' ? '' : x.d[0]}">${glEsc(x.d[1])}</span></div>
                <div class="gl-mini">${glEsc(x.d[2])}</div>
                <div class="gl-kuvvet-alt">
                    <button class="gl-spt-btn${aktif ? ' aktif' : ''}" onclick="glSptBasla('${kk}')" aria-label="${aktif ? 'Tutuşu bitir ve kaydet' : 'SPT kronometresini başlat'}"><span>${aktif ? '■ Bırak' : '▶ Çek & tut'}</span><b id="${aktif ? 'gl-spt-sure' : ''}">${aktif ? '0,0' : (x.spt.length ? x.spt[x.spt.length - 1].sn.toString().replace('.', ',') : '–')}</b><small>sn</small></button>
                    <span class="gl-spt-hizli">${[5, 10, 15, 20].map(s => `<button class="gl-btn kucuk" onclick="glSptKaydet('${kk}', ${s})" aria-label="${s} saniye kaydet">${s} sn</button>`).join('')}</span>
                    ${glSptGrafik(x.spt)}
                    <span class="gl-libre-gir"><input id="gl-lb-${kk}" type="number" step="1" min="6" max="89" placeholder="lb" value="${son ? son.lb : ''}" aria-label="${glEsc(x.k.ad)} libre"><input id="gl-ce-${kk}" type="number" step="0.5" min="10" max="40" placeholder="çekiş&quot;" value="${son && son.cekis ? son.cekis : ''}" aria-label="${glEsc(x.k.ad)} çekiş uzunluğu (inç)"><button class="gl-btn kucuk" onclick="glLibreEkle('${kk}')">Kaydet</button></span>
                </div>
                ${x.lib.length > 1 ? `<div class="gl-libre-gecmis">${x.lib.slice(-6).map(l => `<span>${glEsc(glTarihYaz(l.tarih).replace(/ \d{4}$/, ''))}<b>${l.lb} lb</b></span>`).join('<i>→</i>')}</div>` : ''}
            </div>`;
        }).join('') || '<div class="gl-bos">Derste sporcu yok.</div>'}</div></div>`;
}
const GL_CSS_ADIM2 = [
    '.gl-hero.lig{background:radial-gradient(420px 160px at 0% 0%,color-mix(in srgb,var(--gold) 16%,transparent),transparent 70%),radial-gradient(420px 180px at 100% 100%,color-mix(in srgb,var(--aurora-magenta,#ff2fd0) 12%,transparent),transparent 70%),var(--gl-yuzey)}',
    '.gl-hero.kuvvet{background:radial-gradient(420px 160px at 0% 0%,color-mix(in srgb,var(--neon-red) 14%,transparent),transparent 70%),radial-gradient(420px 180px at 100% 100%,color-mix(in srgb,var(--gold) 12%,transparent),transparent 70%),var(--gl-yuzey)}',
    '.gl-lig-kural{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.gl select{min-height:38px;padding:0 8px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;font-size:12.5px}.gl input[type=date]{width:auto}',
    '.gl-lig-takvim{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin}',
    '.gl-lig-gun{flex:0 0 auto;min-width:96px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:10px 8px;border-radius:14px;border:1px solid var(--border-color)}.gl-lig-gun b{font-size:24px;font-weight:900;line-height:1}.gl-lig-gun span{font-size:11px;color:var(--text-muted)}.gl-lig-gun small{font-size:11px;font-weight:800}',
    '.gl-lig-gun.bugun{border-color:var(--gold);background:color-mix(in srgb,var(--gold) 14%,transparent)}.gl-lig-gun.gecmis{opacity:.6}.gl-lig-gun.iptal b{text-decoration:line-through;opacity:.5}',
    '.gl-cipler{display:flex;gap:6px;flex-wrap:wrap}.gl-cipler button{min-height:38px;padding:0 12px;border-radius:11px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;font-size:12px;font-weight:700;cursor:pointer}.gl-cipler button.aktif{background:var(--gl-vurgu);border-color:var(--gl-vurgu);color:var(--bg-main)}',
    '.gl-lig-tablo{display:flex;flex-direction:column}.gl-lig-satir{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border-color)}.gl-lig-satir:first-child{border-top:0}',
    '.gl-lig-sira{width:26px;height:26px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;background:color-mix(in srgb,var(--text-main) 8%,transparent);color:var(--text-muted)}.gl-lig-sira.s1{background:#f6c929;color:#3a2a00}.gl-lig-sira.s2{background:#cbd5e1;color:#1e293b}.gl-lig-sira.s3{background:#d4915a;color:#2a1405}',
    '.gl-lig-son{display:flex;gap:3px}.gl-lig-son i{width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-size:9.5px;font-weight:900;background:color-mix(in srgb,var(--text-main) 10%,transparent);color:var(--text-muted)}.gl-lig-son i.a{background:#f6c929;color:#3a2a00}.gl-lig-son i.g{background:#cbd5e1;color:#1e293b}.gl-lig-son i.b{background:#d4915a;color:#2a1405}',
    '.gl-lig-puan{font-size:20px;font-weight:900;color:var(--gold);min-width:44px;text-align:right;font-variant-numeric:tabular-nums}',
    '.gl-lig-tur{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border-color);cursor:pointer}.gl-lig-tur:first-of-type{border-top:0}.gl-lig-tur input{width:20px;height:20px;min-height:0;accent-color:var(--gl-vurgu)}.gl-lig-tur span{display:flex;flex-direction:column}.gl-lig-tur small{font-size:11px;color:var(--text-muted)}',
    '.gl-kuvvet-alt{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
    '.gl-spt-btn{display:inline-flex;align-items:baseline;gap:6px;min-height:46px;padding:0 14px;border-radius:12px;border:1px solid var(--gl-vurgu);background:color-mix(in srgb,var(--gl-vurgu) 12%,transparent);color:var(--text-main);font:inherit;cursor:pointer}.gl-spt-btn span{font-size:12px;font-weight:800}.gl-spt-btn b{font-size:20px;font-weight:900;font-variant-numeric:tabular-nums}.gl-spt-btn small{font-size:11px;color:var(--text-muted)}',
    '.gl-spt-btn.aktif{background:var(--neon-red);border-color:var(--neon-red);color:#fff}.gl-spt-btn.aktif small{color:#fff}',
    '.gl-spt-hizli{display:flex;gap:4px}.gl-spt-grafik{width:150px;height:40px;color:var(--text-main)}',
    '.gl-libre-gir{display:flex;gap:4px;align-items:center;margin-left:auto}.gl-libre-gir input{width:64px}',
    '.gl-libre-gecmis{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11px;color:var(--text-muted)}.gl-libre-gecmis span{display:flex;flex-direction:column;align-items:center}.gl-libre-gecmis b{color:var(--text-main);font-size:13px}.gl-libre-gecmis i{font-style:normal;opacity:.5}',
    '@media (max-width:520px){.gl-libre-gir{margin-left:0}.gl-spt-grafik{width:100%}}'
];

// ================================================================================================
// ⭐ PERFORMANS TAKIMI (adım 3a) — araştırma: Kore her kademede eleyip az sayıda sporcuya çok yükleniyor; Archery GB
// yetenek programı. Meta performans_takimi {g|ad: {aktif}}; hedef: antrenman_hedef['performans'] (varsayılan 400).
// ================================================================================================
const GL_PERF_HEDEF = 400;
function glPerfUyeler() { let d = kyDepoOku('performans_takimi'); return Object.keys(d).filter(k => d[k] && d[k].aktif && !d[k].sil).map(k => { let [g, ...r] = k.split('|'); return { g, ad: r.join('|') }; }).filter(k => turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]); }
function glPerfMi(g, ad) { let o = kyDepoOku('performans_takimi')[g + '|' + ad]; return !!(o && o.aktif && !o.sil); }
function glPerfHedef() { let o = kyDepoOku('antrenman_hedef').performans; return o && o.n > 0 ? o.n : GL_PERF_HEDEF; }
function glPerfDegis(kk) { let k = glKey(kk), d = kyDepoOku('performans_takimi'), a = !glPerfMi(k.g, k.ad); d[k.g + '|' + k.ad] = { aktif: a, t: Date.now() }; kyDepoYazYerel('performans_takimi', d); glSenk('performans_takimi'); kmPerformansCiz(); }
function glPerfRaporMetni() {
    let L = glPerfUyeler(), hafta = glHaftaGunleri();
    let s = '⭐ PERFORMANS TAKIMI — haftalık rapor (' + glTarihYaz(hafta[0]).replace(/ \d{4}$/, '') + ' – ' + glTarihYaz(hafta[6]) + ')\n\n';
    L.forEach(k => {
        let y = glYuk(k), t = glSporcuTestleri(k.g, k.ad).pop(), spt = glSpt(k.g, k.ad).pop(), od = kyDepoOku('teknik_odak')[k.g + '|' + k.ad];
        s += '• ' + k.ad + ': ' + y.top + '/' + y.hedef + ' ok, ' + y.gunler.filter(Boolean).length + ' gün' + (t ? ' · test ort ' + glOrt(t).toFixed(2).replace('.', ',') : '') + (spt ? ' · SPT ' + String(spt.sn).replace('.', ',') + ' sn' : '') + (od && od.hata && !od.sil ? ' · odak: ' + od.hataAd : '') + '\n';
    });
    return s + '\nDAĞ Spor Kulübü';
}
function glPerfRaporKopyala() { let t = glPerfRaporMetni(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => showToast('Rapor kopyalandı 📋', 'success')).catch(() => prompt('Kopyala:', t)); }
function glPerfRaporWa() { window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(glPerfRaporMetni()), '_blank'); }
function kmPerformansCiz() {
    glCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    if (!_gl.senkP) { _gl.senkP = true; Promise.all(['performans_takimi', 'antrenman_hedef', 'seviye_testi', 'spt_kayit', 'skorsuz_ok'].map(a => kyDepoSenkron(a, () => kyDepoOku(a), false).catch(() => {}))).then(() => { if (_kmAktifSekme === 'performans') kmPerformansCiz(); }); }
    let L = glPerfUyeler(), q = (_gl.perfAra || '').toLocaleLowerCase('tr-TR');
    let adaylar = [];
    if (_gl.perfSec) GL_GRUPLAR.forEach(g => Object.keys(turnuvaDB[g] || {}).forEach(ad => { let sp = turnuvaDB[g][ad]; if (sp && !sp.pasif && (!q || ad.toLocaleLowerCase('tr-TR').includes(q))) adaylar.push({ g, ad }); }));
    adaylar.sort((a, b) => glPerfMi(b.g, b.ad) - glPerfMi(a.g, a.ad) || a.ad.localeCompare(b.ad, 'tr'));
    let gunAd = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];
    el.innerHTML = `<div class="gl">
        <div class="gl-hero perf"><div class="gl-hero-m"><div class="gl-ust">KARIŞIK SINIF · PERFORMANS TAKIMI</div><div class="gl-baslik">Çekirdek grup, yüksek hedef</div><div class="gl-alt">Kore her kademede eleyip az sayıda sporcuya çok yükleniyor. Takımdakilerin haftalık hedefi <b>${glPerfHedef()} ok</b>; seriler yarışmadaki gibi <b>6 oklu</b> atılır.</div></div>
            <div class="gl-hero-sayi"><b>${L.length}</b><small>takımda sporcu</small></div></div>
        <div class="gl-butonlar" style="justify-content:flex-start"><button class="gl-btn${_gl.perfSec ? ' birincil' : ''}" onclick="_gl.perfSec=!_gl.perfSec; kmPerformansCiz()">👥 Üyeleri ${_gl.perfSec ? 'kapat' : 'seç'}</button>
            <label class="gl-hedef-ayar" style="gap:6px">Haftalık hedef <input type="number" min="50" max="5000" step="50" value="${glPerfHedef()}" onchange="glHedefYaz('performans', this.value); kmPerformansCiz()" aria-label="Performans takımı haftalık hedef"></label>
            ${L.length ? '<button class="gl-btn" onclick="glPerfRaporKopyala()">📋 Haftalık rapor</button><button class="gl-btn" onclick="glPerfRaporWa()">💬 WhatsApp</button>' : ''}</div>
        ${_gl.perfSec ? `<div class="gl-kart"><input class="gl-ara" type="search" placeholder="🔍 Sporcu ara" value="${glEsc(_gl.perfAra || '')}" oninput="_gl.perfAra=this.value; kmPerformansCiz(); let e=document.querySelector('.gl-ara'); if(e){e.focus(); e.setSelectionRange(e.value.length,e.value.length);}" aria-label="Sporcu ara">
            <div class="gl-perf-sec">${adaylar.slice(0, 60).map(k => `<button class="${glPerfMi(k.g, k.ad) ? 'aktif' : ''}" onclick="glPerfDegis('${glJs(k.g + '|' + k.ad)}')" aria-pressed="${glPerfMi(k.g, k.ad)}">${glPerfMi(k.g, k.ad) ? '⭐ ' : ''}${glEsc(k.ad)} <small>${GL_GRUP_AD[k.g] || k.g}</small></button>`).join('')}</div></div>` : ''}
        <div class="gl-perf-izgara">${L.map(k => {
            let y = glYuk(k), tl = glSporcuTestleri(k.g, k.ad), t = tl[tl.length - 1], t0 = tl.filter(x => t && x.tarih < t.tarih && x.m === t.m && x.hedef === t.hedef).pop(), spt = glSpt(k.g, k.ad).pop(), od = kyDepoOku('teknik_odak')[k.g + '|' + k.ad], d = glDurum(y.yuzde);
            let fark = t && t0 ? glOrt(t) - glOrt(t0) : null;
            return `<div class="gl-perf-kart"><div class="gl-sp-ust">${glAvatar(k.g, k.ad)}<span class="gl-sp-ad"><b>${glEsc(k.ad)}</b><small>${GL_GRUP_AD[k.g] || k.g}</small></span><span class="gl-durum ${d[0]}">%${y.yuzde}</span></div>
                <div class="gl-yuk"><div class="gl-yuk-bar"><i class="k" style="width:${Math.min(100, y.kayitli / Math.max(y.hedef, y.top) * 100)}%"></i><i class="s" style="width:${Math.min(100, y.skorsuz / Math.max(y.hedef, y.top) * 100)}%"></i><span class="gl-yuk-hedef" style="left:${y.hedef / Math.max(y.hedef, y.top) * 100}%"></span></div><span class="gl-yuk-sayi"><b>${y.top}</b>/${y.hedef}</span></div>
                <div class="gl-perf-olcu">
                    <div><small>Günler</small><span class="gl-gunler">${y.gunler.map((v, i) => `<span class="${v ? 'var' : ''}">${gunAd[i]}</span>`).join('')}</span></div>
                    <div><small>Seviye testi</small><b>${t ? glOrt(t).toFixed(2).replace('.', ',') : '–'}</b>${fark != null ? `<span class="${fark >= 0 ? 'artis' : 'dusus'}">${fark >= 0 ? '▲' : '▼'}${Math.abs(fark).toFixed(2).replace('.', ',')}</span>` : ''}</div>
                    <div><small>SPT</small><b>${spt ? String(spt.sn).replace('.', ',') + ' sn' : '–'}</b></div>
                </div>
                ${od && od.hata && !od.sil ? `<div class="gl-perf-odak">🗣️ “${glEsc(od.cumle)}”</div>` : ''}
            </div>`;
        }).join('') || '<div class="gl-bos">Takım boş. "Üyeleri seç" ile 6-10 sporcu seçin — düzenli gelen, hedefi tutturan ve istekli olanlar.</div>'}</div></div>`;
}

// ================================================================================================
// 🏠 EVDE ÖDEV (adım 3b) — eğitmen ekranı. Görev tanımları + sporcunun "Yaptım" kartı app.js çekirdeğinde
// (EV_ODEV_GOREVLER, evOdevGorevleri, evOdevWidgetCiz). Meta ev_odev {'grup|g'|'sp|g|ad': {gorevler}},
// ev_odev_yapti {g|ad|tarih}.
// ================================================================================================
function glEvGorevDegis(g, id) {
    let d = kyDepoOku('ev_odev'), e = d['grup|' + g], l = (e && !e.sil && e.gorevler) ? e.gorevler.slice() : EV_ODEV_VARSAYILAN.slice();
    l = l.includes(id) ? l.filter(x => x !== id) : l.concat(id);
    d['grup|' + g] = { gorevler: l, t: Date.now() }; kyDepoYazYerel('ev_odev', d); glSenk('ev_odev'); kmEvOdevCiz();
}
function glEvMesaj(kk) {
    let k = glKey(kk), sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad], gorev = evOdevGorevleri(k.g, k.ad);
    let ilk = String(k.ad).trim().split(/\s+/)[0], ilkB = ilk.charAt(0) + ilk.slice(1).toLocaleLowerCase('tr-TR');
    let m = "Merhaba 🌟 DAĞ Spor Kulübü'nden yazıyoruz.\n\n" + ilkB + "'in evde her gün 10 dakikalık okçuluk ödevi:\n\n" + gorev.map(x => '🏹 ' + x.ad + ' — ' + x.miktar + '\n   ' + x.aciklama).join('\n') + "\n\nYaptığında uygulamada kendi ekranından \"✅ Yaptım\"a basabilir. Salona gelmediği günler de böylece gelişir 💪\n\nDAĞ Spor Kulübü";
    let n = typeof telefonWaFormat === 'function' && sp ? telefonWaFormat(sp.acilTelefon) : '';
    window.open((n ? 'https://api.whatsapp.com/send?phone=' + n + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(m), '_blank');
}
function kmEvOdevCiz() {
    glCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    if (!_gl.senkE) { _gl.senkE = true; Promise.all(['ev_odev', 'ev_odev_yapti'].map(a => kyDepoSenkron(a, () => kyDepoOku(a), false).catch(() => {}))).then(() => { if (_kmAktifSekme === 'evodev') kmEvOdevCiz(); }); }
    let L = glRoster(), gunler = Array.from({ length: 14 }, (_, i) => bsIsoTarih(new Date(Date.now() - (13 - i) * 864e5))), bugun = glBugun();
    let bugunYapan = L.filter(k => evOdevYaptiMi(k.g, k.ad, bugun)).length;
    let gruplar = [...new Set(L.map(k => k.g))].sort((a, b) => GL_GRUPLAR.indexOf(a) - GL_GRUPLAR.indexOf(b));
    el.innerHTML = `<div class="gl">
        <div class="gl-hero ev"><div class="gl-hero-m"><div class="gl-ust">KARIŞIK SINIF · EVDE ÖDEV</div><div class="gl-baslik">Salona gelmediği gün de gelişsin</div><div class="gl-alt">Kore'de yeni başlayanlar aylarca lastik bantla temel çalışıyor. Her gün 10 dakika — çocuk kendi ekranından <b>"✅ Yaptım"</b> der, siz burada görürsünüz.</div></div>
            <div class="gl-hero-sayi"><b>${bugunYapan}<span>/${L.length}</span></b><small>bugün yaptı</small></div></div>
        <div class="gl-kart"><div class="gl-etiket">Gruplara verilen görevler — dokun, ekle/çıkar</div>${gruplar.map(g => { let ids = evOdevGorevleri(g, null).map(x => x.id); return `<div class="gl-ev-grup"><b>${GL_GRUP_AD[g] || g}</b><span class="gl-cipler">${EV_ODEV_GOREVLER.map(x => `<button class="${ids.includes(x.id) ? 'aktif' : ''}" onclick="glEvGorevDegis('${g}','${x.id}')" aria-pressed="${ids.includes(x.id)}" title="${glEsc(x.aciklama)}">${x.ikon} ${glEsc(x.ad)} <small>${glEsc(x.miktar)}</small></button>`).join('')}</span></div>`; }).join('') || '<div class="gl-mini">Derste sporcu yok.</div>'}</div>
        <div class="gl-liste">${L.map(k => {
            let seri = evOdevSeri(k.g, k.ad), son14 = gunler.filter(t => evOdevYaptiMi(k.g, k.ad, t)).length;
            return `<div class="gl-sp"><div class="gl-sp-ust">${glAvatar(k.g, k.ad)}<span class="gl-sp-ad"><b>${glEsc(k.ad)}</b><small>son 14 günde ${son14} gün${seri > 1 ? ' · 🔥 ' + seri + ' gün üst üste' : ''}</small></span>
                <span class="gl-ev-gunler" aria-label="Son 14 gün">${gunler.map(t => `<i class="${evOdevYaptiMi(k.g, k.ad, t) ? 'var' : ''}${t === bugun ? ' bugun' : ''}" title="${glEsc(glTarihYaz(t))}"></i>`).join('')}</span>
                <button class="gl-btn kucuk" onclick="glEvMesaj('${glJs(k.g + '|' + k.ad)}')">💬 Veliye gönder</button></div></div>`;
        }).join('')}</div></div>`;
}

// ================================================================================================
// ⚙️ MAKARALI YOL HARİTASI (adım 4a) — araştırma + kendi verimiz: makaralıcılar klasikçilerin 2 katı hacimde ve ok
// başına daha yüksek puanda. Kıyas (son 8 hafta, kulüp), geçiş adayları (gerekçeli), kontrol listesi, makaralı sıralaması.
// ================================================================================================
const GL_MAK_LISTE = ['Bırakıcı (release aid) seçimi — çocuğa uygun, menteşe/tetik', 'Çekiş uzunluğu ölçümü (kol açıklığı ÷ 2,5)', 'Libre: düşük başla, holding weight rahat olsun', 'Peep yüksekliği ve D-loop ayarı', 'Nişangâh kabarcığı (su terazisi) kontrolü', 'Emniyet: boş atış yok, bırakıcı her zaman kirişte'];
const GL_MAK_PLAN = ['1. hafta: yakın mesafe (5-10 m), bırakıcıyla sürpriz bırakış, boş hedef', '2. hafta: 10-18 m, atış döngüsüne kabarcık + peep eklenir', '3. hafta: 18 m skorlu seriler, 6 oklu seri temposu', '4. hafta: seviye testi (makaralı protokolü) — klasik dönemindeki son testle karşılaştır'];
function glYas(sp) { let y = sp && (sp.dogumTarihi ? parseInt(String(sp.dogumTarihi).slice(0, 4), 10) : sp.dogumYili); return y ? new Date().getFullYear() - y : null; }
function glMakMi(sp) { return /makaral/i.test((sp && sp.yay) || ''); }
function glSon8Hafta(g, ad) {
    let sp = turnuvaDB[g][ad], sinir = bsIsoTarih(new Date(Date.now() - 56 * 864e5)), ok = 0, puan = 0, gun = new Set();
    let say = x => { if ((x.tarih || '') >= sinir) { (x.oklar || []).forEach(o => { ok++; puan += glOkDeger(o); }); gun.add(x.tarih); } };
    (sp.seriler || []).forEach(say); (sp.kartGecmisi || []).forEach(k => (k.seriler || []).forEach(say));
    return { ok, puan, ort: ok ? puan / ok : null, gun: gun.size };
}
function glMakGecir(kk) {
    let k = glKey(kk), sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; if (!sp) return;
    onayIste('<b>' + glEsc(k.ad) + '</b> makaralı yaya geçiyor olarak işaretlensin mi?<br><span style="font-size:12px;color:var(--text-muted)">Sporcunun yay türü "Makaralı" olur; lig ve sıralamalarda makaralı kategorisine geçer. Skorları korunur.</span>', () => {
        sp.yay = 'Makaralı'; sp.lastModified = Date.now();
        try { yoneticiKaydet(); } catch (e) { try { localStorage.setItem('okculuk_premium_data', JSON.stringify(turnuvaDB)); bekleyenGonderim = true; bulutaGonderKontrol(); } catch (e2) {} }
        showToast('⚙️ ' + k.ad.split(' ')[0] + ' artık makaralı', 'success'); kmMakaraliCiz();
    }, '⚙️ Evet, geçti');
}
function kmMakaraliCiz() {
    glCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    let tum = []; GL_GRUPLAR.forEach(g => Object.keys(turnuvaDB[g] || {}).forEach(ad => { let sp = turnuvaDB[g][ad]; if (sp && !sp.pasif && !sp.donduruldu) tum.push(Object.assign({ g, ad, sp, mak: glMakMi(sp), yas: glYas(sp) }, glSon8Hafta(g, ad))); }));
    let med = a => { a = a.filter(x => x != null).sort((p, q) => p - q); return a.length ? a[Math.floor(a.length / 2)] : null; };
    let grup = m => { let l = tum.filter(x => x.mak === m && x.ok > 0); return { n: tum.filter(x => x.mak === m).length, hafta: med(l.map(x => x.ok / 8)), ort: med(l.map(x => x.ort)) }; };
    let K = grup(false), M = grup(true);
    let adaylar = tum.filter(x => !x.mak && (x.yas == null ? x.g === 'buyukler' || x.g === 'yildizlar' : x.yas >= 12)).map(x => {
        let gerekce = [], puan = 0, t = glSporcuTestleri(x.g, x.ad), dur = t.length >= 2 && glOrt(t[t.length - 1]) - glOrt(t[t.length - 2]) <= 0;
        if (x.yas != null) { gerekce.push(x.yas + ' yaş'); puan += 1; }
        if (x.gun >= 6) { gerekce.push('düzenli geliyor (' + x.gun + ' gün/8 hafta)'); puan += 2; }
        if (dur) { gerekce.push('seviye testinde yerinde sayıyor'); puan += 2; }
        if (x.ort != null && x.ort < 6.5) { gerekce.push('klasikte ok başı ' + x.ort.toFixed(1).replace('.', ',')); puan += 1; }
        if (x.g === 'buyukler') puan += 1;
        return Object.assign(x, { gerekce, puan });
    }).filter(x => x.puan >= 3).sort((a, b) => b.puan - a.puan).slice(0, 10);
    let makSira = tum.filter(x => x.mak && x.ok >= 12).sort((a, b) => b.ort - a.ort);
    let kutu = (et, k, m, bicim) => `<div class="gl-mak-kiyas"><small>${et}</small><span><i class="k">Klasik</i><b>${k == null ? '–' : bicim(k)}</b></span><span><i class="m">Makaralı</i><b>${m == null ? '–' : bicim(m)}</b></span></div>`;
    el.innerHTML = `<div class="gl">
        <div class="gl-hero mak"><div class="gl-hero-m"><div class="gl-ust">KARIŞIK SINIF · MAKARALI YOL HARİTASI</div><div class="gl-baslik">En verimli grubunuz makaralıcılar</div><div class="gl-alt">Kulübün son 8 haftası: makaralıcılar hem daha çok atıyor hem ok başına daha yüksek puan alıyor. Türkiye makaralıda dünyanın önde gelen ülkelerinden — bu yol büyük yaş grubunda daha hızlı sonuç verir.</div></div>
            <div class="gl-hero-sayi"><b>${M.n}<span>/${K.n + M.n}</span></b><small>aktif sporcu makaralı</small></div></div>
        <div class="gl-mak-kiyaslar">${kutu('Haftalık kayıtlı ok (ortanca)', K.hafta, M.hafta, v => Math.round(v))}${kutu('Ok başına puan (ortanca)', K.ort, M.ort, v => v.toFixed(2).replace('.', ','))}</div>
        <div class="gl-kart"><div class="gl-etiket">Geçiş adayları — gerekçeleriyle</div>${adaylar.map(x => `<div class="gl-mak-aday">${glAvatar(x.g, x.ad)}<span class="gl-sp-ad"><b>${glEsc(x.ad)}</b><small>${x.gerekce.map(glEsc).join(' · ')}</small></span><button class="gl-btn kucuk" onclick="glMakGecir('${glJs(x.g + '|' + x.ad)}')">⚙️ Geçti</button></div>`).join('') || '<div class="gl-mini">Şu an belirgin aday yok (12 yaş üstü, düzenli gelen ya da testte yerinde sayan klasikçiler burada çıkar).</div>'}
            <div class="gl-mini">Öneri; kararı sporcu, veli ve antrenör birlikte verir. Geçen sporcunun klasik dönemi skorları korunur.</div></div>
        <div class="gl-mak-izgara"><div class="gl-kart"><div class="gl-etiket">Geçiş kontrol listesi</div><ul class="gl-tik">${GL_MAK_LISTE.map(x => `<li>${glEsc(x)}</li>`).join('')}</ul></div>
            <div class="gl-kart"><div class="gl-etiket">İlk 4 hafta</div><ul class="gl-plan">${GL_MAK_PLAN.map(x => `<li>${glEsc(x)}</li>`).join('')}</ul></div></div>
        <div class="gl-kart"><div class="gl-etiket">Makaralı sıralaması — son 8 hafta ok başı puan</div>${makSira.map((x, i) => `<div class="gl-lig-satir"><span class="gl-lig-sira ${i < 3 ? 's' + (i + 1) : ''}">${i + 1}</span>${glAvatar(x.g, x.ad)}<span class="gl-sp-ad"><b>${glEsc(x.ad)}</b><small>${x.ok} ok · ${x.gun} gün</small></span><b class="gl-lig-puan">${x.ort.toFixed(2).replace('.', ',')}</b></div>`).join('') || '<div class="gl-mini">Son 8 haftada en az 12 ok atan makaralıcı yok.</div>'}</div>
    </div>`;
}
const GL_CSS_ADIM34 = [
    '.gl-hero.perf{background:radial-gradient(420px 160px at 0% 0%,color-mix(in srgb,var(--gold) 16%,transparent),transparent 70%),radial-gradient(420px 180px at 100% 100%,color-mix(in srgb,var(--accent-orange) 16%,transparent),transparent 70%),var(--gl-yuzey)}',
    '.gl-hero.ev{background:radial-gradient(420px 160px at 0% 0%,color-mix(in srgb,var(--neon-green) 14%,transparent),transparent 70%),radial-gradient(420px 180px at 100% 100%,color-mix(in srgb,var(--aurora-cyan,#00f0ff) 12%,transparent),transparent 70%),var(--gl-yuzey)}',
    '.gl-hero.mak{background:radial-gradient(420px 160px at 0% 0%,color-mix(in srgb,var(--neon-blue,#4d8dff) 16%,transparent),transparent 70%),radial-gradient(420px 180px at 100% 100%,color-mix(in srgb,var(--aurora-violet,#9b3bff) 14%,transparent),transparent 70%),var(--gl-yuzey)}',
    '.gl-ara{width:100%!important;min-height:42px!important}',
    '.gl-perf-sec{display:flex;flex-wrap:wrap;gap:6px;max-height:260px;overflow-y:auto}.gl-perf-sec button{min-height:38px;padding:0 12px;border-radius:11px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}.gl-perf-sec button small{color:var(--text-muted);font-weight:600}.gl-perf-sec button.aktif{border-color:var(--gold);background:color-mix(in srgb,var(--gold) 14%,transparent)}',
    '.gl-perf-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}.gl-perf-kart{border:1px solid color-mix(in srgb,var(--gold) 35%,var(--border-color));border-radius:16px;background:var(--gl-yuzey);padding:12px 14px;display:flex;flex-direction:column;gap:9px}',
    '.gl-perf-olcu{display:grid;grid-template-columns:auto 1fr 1fr;gap:10px;align-items:end}.gl-perf-olcu>div{display:flex;flex-direction:column;gap:2px}.gl-perf-olcu small{font-size:10px;font-weight:800;letter-spacing:.06em;color:var(--text-muted);text-transform:uppercase}.gl-perf-olcu b{font-size:16px}.gl-perf-olcu .gl-gunler span{width:18px;height:18px;font-size:9px}',
    '.gl-perf-odak{font-size:12.5px;font-weight:700;padding:8px 10px;border-radius:10px;background:color-mix(in srgb,var(--gl-vurgu) 10%,transparent)}',
    '.gl-ev-grup{display:flex;flex-direction:column;gap:6px;padding:8px 0;border-top:1px solid var(--border-color)}.gl-ev-grup:first-of-type{border-top:0}.gl-ev-grup b{font-size:13px}.gl-ev-grup .gl-cipler button small{color:var(--text-muted);font-weight:600;margin-left:3px}.gl-ev-grup .gl-cipler button.aktif small{color:inherit}',
    '.gl-ev-gunler{display:flex;gap:3px}.gl-ev-gunler i{width:12px;height:22px;border-radius:4px;background:color-mix(in srgb,var(--text-main) 10%,transparent)}.gl-ev-gunler i.var{background:var(--neon-green)}.gl-ev-gunler i.bugun{outline:2px solid var(--gl-vurgu);outline-offset:1px}',
    '.gl-mak-kiyaslar{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px}.gl-mak-kiyas{border:1px solid var(--border-color);border-radius:16px;background:var(--gl-yuzey);padding:12px 14px;display:flex;flex-direction:column;gap:6px}.gl-mak-kiyas small{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted)}',
    '.gl-mak-kiyas span{display:flex;justify-content:space-between;align-items:center}.gl-mak-kiyas i{font-style:normal;font-size:12.5px;font-weight:700}.gl-mak-kiyas i.k{color:var(--text-muted)}.gl-mak-kiyas i.m{color:var(--neon-blue,#4d8dff)}.gl-mak-kiyas b{font-size:22px;font-weight:900;font-variant-numeric:tabular-nums}.gl-mak-kiyas span:last-child b{color:var(--neon-blue,#4d8dff)}',
    '.gl-mak-aday{display:flex;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border-color)}.gl-mak-aday:first-of-type{border-top:0}',
    '.gl-mak-izgara{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px}.gl-tik,.gl-plan{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:13px;line-height:1.45}'
];
