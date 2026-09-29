// ============================================================================================
// Karışık Sınıf — SINIF ŞABLONLARI + DERS SONU ÖZETİ (2026-09-29)
//
// 📋 Sınıf Şablonları: sık kullanılan sporcu listesi + oyun teması bir isimle kaydedilir ("Salı 17:00
//    Küçükler"). Yeni ders ekranında şablona dokununca o sporcular seçilir, "▶ Başlat" ile ders tek dokunuşta
//    başlar ve kayıtlı oyun açılır. Şablonlar sunucuda (meta "km_sablonlar", kayıt başına en yeni kazanır —
//    dagsk-kisi-yonetimi.js'teki kyDepoSenkron) → her cihazda aynı.
// 🏅 Ders Sonu Özeti: bu dersin oyunda kim ne kadar ilerledi, bugünkü seriler, kim kişisel rekor kırdı, en çok
//    gelişen kim — ekranda sıralı; her sporcu için veliye hazır WhatsApp mesajı, velilerin grubuna tek mesaj.
//    Veri yeni değil: oyun durumu (_kmOyunDurum), bugünkü kart (sp.seriler), geçmiş kartlar (sp.kartGecmisi).
// ============================================================================================

// ---------------------------------------------------------------- 📋 ŞABLONLAR
const KM_SABLON_ANAHTAR = 'km_sablonlar';
function kmSablonlar() {
    let d = kyDepoOku(KM_SABLON_ANAHTAR);
    return Object.keys(d).map(function (id) { return Object.assign({ id: id }, d[id]); }).filter(function (s) { return !s.sil; })
        .sort(function (a, b) { return (b.kullanim || 0) - (a.kullanim || 0) || a.ad.localeCompare(b.ad, 'tr'); });
}
function kmSablonYaz(id, alanlar) {
    let d = kyDepoOku(KM_SABLON_ANAHTAR);
    d[id] = Object.assign({}, d[id] || {}, alanlar, { t: Date.now() });
    kyDepoYazYerel(KM_SABLON_ANAHTAR, d);
    return kyDepoSenkron(KM_SABLON_ANAHTAR, function () { return kyDepoOku(KM_SABLON_ANAHTAR); }, true);
}
function kmSablonEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
// Şablondaki sporculardan hâlâ kayıtlı ve aktif olanlar (silinen/pasif olan sessizce atlanır).
function kmSablonGecerli(s) { return (s.liste || []).filter(function (k) { let sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; return sp && !sp.pasif && !sp.donduruldu; }); }
function kmSablonlarCiz() {
    let el = document.getElementById('km-sablonlar'); if (!el) return;
    let liste = kmSablonlar();
    if (!liste.length) { el.innerHTML = ''; return; }
    el.innerHTML = '<div class="kms-baslik">📋 Şablonlar</div><div class="kms-satir">' + liste.map(function (s) {
        let n = kmSablonGecerli(s).length, th = s.tema && typeof KM_OYUN_TEMALAR !== 'undefined' && KM_OYUN_TEMALAR[s.tema];
        return '<div class="kms-kart"><button class="kms-sec" onclick="kmSablonSec(\'' + s.id + '\')" title="Bu sporcuları seç"><b>' + kmSablonEsc(s.ad) + '</b><small>' + n + ' sporcu' + (th ? ' · ' + th.ikon + ' ' + kmSablonEsc(th.ad) : '') + '</small></button>'
            + '<button class="kms-basla" onclick="kmSablonBaslat(\'' + s.id + '\')" title="Seç ve dersi başlat">▶</button>'
            + '<button class="kms-sil" onclick="kmSablonSil(\'' + s.id + '\')" title="Şablonu sil" aria-label="Şablonu sil">✕</button></div>';
    }).join('') + '</div>';
}
function kmSablonSec(id) {
    let s = kmSablonlar().find(function (x) { return x.id === id; }); if (!s) return;
    _kmSecimler = {};
    kmSablonGecerli(s).forEach(function (k) { _kmSecimler[k.g + '_' + k.ad] = { g: k.g, ad: k.ad }; });
    kmModalDoldur();
    let eksik = (s.liste || []).length - Object.keys(_kmSecimler).length;
    showToast('📋 ' + s.ad + ': ' + Object.keys(_kmSecimler).length + ' sporcu seçildi' + (eksik > 0 ? ' (' + eksik + ' kişi artık kayıtlı/aktif değil)' : '') + ' — eklemek/çıkarmak için dokun.', 'success');
}
async function kmSablonBaslat(id) {
    let s = kmSablonlar().find(function (x) { return x.id === id; }); if (!s) return;
    kmSablonSec(id);
    if (!Object.keys(_kmSecimler).length) return;
    kmSablonYaz(id, { kullanim: (s.kullanim || 0) + 1 });
    await kmBaslat();
    let p = document.getElementById('karisik-platform');
    if (s.tema && p && p.style.display === 'flex') { try { kmAracSec('oyunlar'); kmOyunTemaSec(s.tema); } catch (e) {} }
}
function kmSablonSil(id) {
    let s = kmSablonlar().find(function (x) { return x.id === id; }); if (!s) return;
    onayIste('<b>' + kmSablonEsc(s.ad) + '</b> şablonu silinsin mi?<br><span style="font-size:12px;color:var(--text-muted)">Sporculara ve derslere dokunulmaz, sadece kayıtlı liste gider.</span>', function () {
        kmSablonYaz(id, { sil: true }).then(kmSablonlarCiz); kmSablonlarCiz();
    }, 'Sil');
}
function kmSablonKaydetAc() {
    if (!_kmListe.length) return showToast('Derste sporcu yok.', 'warning');
    let tema = typeof _kmOyunAktifTema !== 'undefined' ? _kmOyunAktifTema : null, th = tema && KM_OYUN_TEMALAR[tema];
    let gun = new Date().toLocaleDateString('tr-TR', { weekday: 'long' }), saat = new Date().toTimeString().slice(0, 5);
    let varsayilan = gun.charAt(0).toLocaleUpperCase('tr-TR') + gun.slice(1) + ' ' + saat;
    let ad = prompt('Şablon adı (' + _kmListe.length + ' sporcu' + (th ? ', oyun: ' + th.ad : '') + '):', varsayilan);
    if (ad === null) return; ad = ad.trim(); if (!ad) return;
    let ayni = kmSablonlar().find(function (x) { return x.ad.toLocaleLowerCase('tr-TR') === ad.toLocaleLowerCase('tr-TR'); });
    let id = ayni ? ayni.id : 's' + Date.now().toString(36);
    kmSablonYaz(id, { ad: ad, liste: _kmListe.map(function (k) { return { g: k.g, ad: k.ad }; }), tema: tema, sil: false });
    showToast('📋 "' + ad + '" ' + (ayni ? 'güncellendi' : 'kaydedildi') + ' — yeni ders açarken listede çıkar.', 'success');
}
// Yeni ders ekranı açıldığında şablonları sunucudan tazele ve listenin üstüne çiz.
(function () {
    function kanca() {
        if (typeof kmModalDoldur !== 'function' || typeof kyDepoSenkron !== 'function') return setTimeout(kanca, 300);
        let eski = kmModalDoldur, sonTazele = 0;
        kmModalDoldur = function () {
            let r = eski.apply(this, arguments);
            kmSablonlarCiz();
            if (Date.now() - sonTazele > 20000) { sonTazele = Date.now(); kyDepoSenkron(KM_SABLON_ANAHTAR, function () { return kyDepoOku(KM_SABLON_ANAHTAR); }, false).then(kmSablonlarCiz).catch(function () {}); }
            return r;
        };
    }
    kanca();
    let st = document.createElement('style');
    st.textContent = '.kms-baslik{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin:2px 0 6px}'
        + '.kms-satir{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px;scrollbar-width:thin}'
        + '.kms-kart{display:flex;align-items:stretch;flex-shrink:0;border:1px solid var(--border-color);border-radius:10px;background:var(--surface-1,var(--bg-panel));overflow:hidden}'
        + '.kms-kart button{border:none;background:transparent;color:var(--text-primary,var(--text-main));cursor:pointer;font:inherit}'
        + '.kms-sec{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:7px 10px;text-align:left;max-width:190px}'
        + '.kms-sec b{font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:170px}.kms-sec small{font-size:10px;color:var(--text-muted)}'
        + '.kms-basla{padding:0 12px;font-size:14px;font-weight:900;background:var(--accent-orange)!important;color:#1a0d05!important}'
        + '.kms-sil{padding:0 8px;font-size:11px;color:var(--text-muted)!important;border-left:1px solid var(--border-color)!important}'
        + '.kms-kart button:focus-visible{outline:2px solid var(--accent-orange);outline-offset:-2px}'
        + '.kmoz-bg{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:26000;display:flex;align-items:center;justify-content:center;padding:12px}'
        + '.kmoz{background:var(--bg-main);border:1px solid var(--border-color);border-radius:16px;width:min(640px,100%);max-height:90vh;display:flex;flex-direction:column;overflow:hidden}'
        + '.kmoz-ust{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border-color)}.kmoz-ust h3{margin:0;font-size:16px;font-weight:900}.kmoz-ust p{margin:3px 0 0;font-size:11.5px;color:var(--text-muted)}'
        + '.kmoz-govde{overflow-y:auto;padding:10px 16px 14px;display:flex;flex-direction:column;gap:8px}'
        + '.kmoz-vurgu{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px}'
        + '.kmoz-v{border:1px solid var(--border-color);border-radius:12px;padding:9px 11px;background:var(--surface-1,var(--bg-panel))}.kmoz-v small{display:block;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}.kmoz-v{min-width:0}.kmoz-v b{font-size:14px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
        + '.kmoz-sat{display:grid;grid-template-columns:26px 1fr auto;gap:4px 10px;align-items:center;border:1px solid var(--border-color);border-radius:12px;padding:9px 11px;background:var(--surface-1,var(--bg-panel))}'
        + '.kmoz-sira{font-size:15px;font-weight:900;text-align:center;font-variant-numeric:tabular-nums}.kmoz-ad{font-weight:800;font-size:13.5px;min-width:0}.kmoz-ad small{display:block;font-weight:600;font-size:10.5px;color:var(--text-muted)}'
        + '.kmoz-bar{grid-column:2/4;height:6px;border-radius:4px;background:var(--border-color);overflow:hidden}.kmoz-bar i{display:block;height:100%;background:var(--accent-orange);border-radius:4px}'
        + '.kmoz-rozet{grid-column:2/4;display:flex;flex-wrap:wrap;gap:5px}.kmoz-rozet span{font-size:10.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:var(--surface-2,rgba(255,255,255,.06));color:var(--text-secondary,var(--text-muted))}'
        + '.kmoz-rozet .rekor{background:color-mix(in srgb,var(--status-warning,#f5c451) 22%,transparent);color:var(--status-warning,#f5c451)}.kmoz-rozet .yildiz{background:color-mix(in srgb,var(--status-success,#4FB07A) 20%,transparent);color:var(--status-success,#4FB07A)}'
        + '.kmoz-alt{display:flex;gap:8px;flex-wrap:wrap;padding:12px 16px;border-top:1px solid var(--border-color)}'
        + '.kmoz-btn{border:1px solid var(--border-color);background:transparent;color:var(--text-primary,var(--text-main));border-radius:10px;padding:9px 13px;font-weight:800;font-size:12.5px;cursor:pointer;min-height:40px}'
        + '.kmoz-btn.ana{background:var(--accent-orange);border-color:var(--accent-orange);color:#1a0d05}.kmoz-wa{border:1px solid var(--status-success,#4FB07A);color:var(--status-success,#4FB07A);background:transparent;border-radius:9px;padding:6px 10px;font-weight:800;font-size:11.5px;cursor:pointer;min-height:36px}';
    document.head.appendChild(st);
})();

// ---------------------------------------------------------------- 🏅 DERS SONU ÖZETİ
function kmOzetIlkAd(ad) { let i = String(ad || '').trim().split(/\s+/)[0] || ''; return i.charAt(0) + i.slice(1).toLocaleLowerCase('tr-TR'); }
// Ortak Canavar'ın BUGÜNKÜ kaydı (bu konum) — varsa sporcu başına hasar/kritik/son vuruş ve yenilen canavarlar.
// Doğrudan yerel kayıttan okunur (kmCanavarDurumEmin yeni kayıt oluşturup yazabileceği için çağrılmaz).
function kmOzetCanavar() {
    try {
        let v = JSON.parse(localStorage.getItem(kmCanavarAnahtari()) || 'null');
        if (!v || v.tarih !== bugunISO() || !(v.toplamHasar > 0)) return null;
        let h = v.hasarlar || {}, liste = Object.keys(h).map(function (k) { return Object.assign({ k: k }, h[k]); });
        let mvp = liste.slice().sort(function (a, b) { return b.hasar - a.hasar; })[0] || null;
        return { hasarlar: h, mvp: mvp && mvp.hasar > 0 ? mvp.k : null, yenilenler: v.yenilenler || [], toplamHasar: v.toplamHasar || 0 };
    } catch (e) { return null; }
}
function kmOzetVeri() {
    try { kmOyunDurumEmin(); kmOyunRosterYenile(); kmOyunBaslangicSkorEmin(); } catch (e) {}
    let tema = typeof _kmOyunAktifTema !== 'undefined' ? _kmOyunAktifTema : null, th = (tema && KM_OYUN_TEMALAR[tema]) || null;
    let CNV = kmOzetCanavar();
    let satirlar = _kmListe.map(function (k) {
        let sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; if (!sp) return null;
        let seriler = sp.seriler || [], puanlar = seriler.map(function (s) { return s.puan || 0; });
        let toplam = puanlar.reduce(function (a, b) { return a + b; }, 0), enIyi = puanlar.length ? Math.max.apply(null, puanlar) : 0;
        let x = seriler.reduce(function (a, s) { return a + (s.oklar || []).filter(function (o) { return o === 'X'; }).length; }, 0);
        let eski = []; (sp.kartGecmisi || []).forEach(function (kart) { (kart.seriler || []).forEach(function (s) { eski.push(s.puan || 0); }); });
        let oncekiEnIyi = eski.length ? Math.max.apply(null, eski) : 0;
        let sezonOrt = eski.length ? eski.reduce(function (a, b) { return a + b; }, 0) / eski.length : 0, bugunOrt = puanlar.length ? toplam / puanlar.length : 0;
        let d = (_kmOyunDurum || {})[k.g + '|' + k.ad] || {};
        let bas = (_kmOyunBaslangicSkor || {})[k.g + '|' + k.ad] || 0;
        return { g: k.g, ad: k.ad, sp: sp, seri: puanlar.length, toplam: toplam, enIyi: enIyi, x: x, oncekiEnIyi: oncekiEnIyi,
            rekor: puanlar.length > 0 && eski.length > 0 && enIyi > oncekiEnIyi, gelisim: puanlar.length && eski.length ? bugunOrt - sezonOrt : null,
            ilerleme: Math.max(0, Math.min(1, d.frac || 0)), oyunPuan: Math.max(0, (d.toplamSkor || 0) - bas),
            canavar: (CNV && CNV.hasarlar[k.g + '|' + k.ad]) || null, canavarMvp: !!(CNV && CNV.mvp === k.g + '|' + k.ad) };
    }).filter(Boolean);
    // Sıralama ölçüsü: yollu oyunlarda ilerleme, Ortak Canavar'da verilen hasar, yol olmayan oyunlarda (Kule, Kehanet…) puan.
    let olcu = tema === 'canavar' && CNV ? 'hasar' : (satirlar.some(function (s) { return s.ilerleme > 0; }) ? 'ilerleme' : 'puan');
    let deger = function (s) { return olcu === 'hasar' ? (s.canavar ? s.canavar.hasar : 0) : olcu === 'ilerleme' ? s.ilerleme : s.toplam; };
    satirlar.forEach(function (s) { s.deger = deger(s); });
    satirlar.sort(function (a, b) { return b.deger - a.deger || b.toplam - a.toplam || b.x - a.x; });
    satirlar.forEach(function (s, i) { s.sira = i + 1; });
    let atanlar = satirlar.filter(function (s) { return s.seri > 0; });
    let enCokGelisen = atanlar.filter(function (s) { return s.gelisim !== null && s.gelisim > 0; }).sort(function (a, b) { return b.gelisim - a.gelisim; })[0] || null;
    let enYuksek = atanlar.slice().sort(function (a, b) { return b.toplam - a.toplam; })[0] || null;
    return { tema: th, olcu: olcu, canavar: CNV, satirlar: satirlar, atanlar: atanlar, rekorlar: atanlar.filter(function (s) { return s.rekor; }), enCokGelisen: enCokGelisen, enYuksek: enYuksek, tarih: formatTarih(bugunISO()) };
}
function kmOzetOlcuYazi(s, D) { return D.olcu === 'ilerleme' ? '%' + Math.round(s.ilerleme * 100) + ' ilerledi' : D.olcu === 'hasar' ? (s.canavar ? s.canavar.hasar : 0) + ' hasar' : s.toplam + ' puan'; }
function kmOzetVeliMetni(s, D) {
    let satir = ['🏹 *DAĞ SPOR KULÜBÜ*', '📋 _' + kmOzetIlkAd(s.ad) + '\'in bugünkü dersi_ — ' + D.tarih, ''];
    if (D.tema) satir.push('🎮 Oyun: *' + D.tema.ad + '*' + (D.olcu === 'ilerleme' ? ' — %' + Math.round(s.ilerleme * 100) + ' ilerledi' : '') + ' (' + s.sira + '. sırada)');
    if (s.seri) satir.push('🎯 ' + s.seri + ' seri · *' + s.toplam + ' puan* · en iyi seri ' + s.enIyi + (s.x ? ' · ' + s.x + ' X' : ''));
    if (s.rekor) satir.push('🏆 *Kişisel rekor kırdı!* (önceki en iyi serisi ' + s.oncekiEnIyi + ')');
    if (s.canavar && s.canavar.hasar > 0) {
        satir.push('🐉 Ortak Canavar\'a *' + s.canavar.hasar + ' hasar* verdi' + (s.canavar.kritik ? ' (' + s.canavar.kritik + ' kritik vuruş)' : ''));
        if (s.canavar.sonVurus) satir.push('🗡️ ' + (s.canavar.sonVurus > 1 ? s.canavar.sonVurus + ' canavarı' : 'Bir canavarı') + ' son vuruşuyla o yendi!');
        if (s.canavar.gorev) satir.push('📜 ' + s.canavar.gorev + ' canavar görevini tamamladı!');
        if (s.canavarMvp) satir.push('👑 Bugün canavara en çok hasar veren sporcu oldu!');
    }
    if (D.enCokGelisen && D.enCokGelisen.ad === s.ad) satir.push('⭐ Bugün sınıfın en çok gelişen sporcusu oldu!');
    satir.push('', kmOzetIlkAd(s.ad) + ' bugün de emek verdi — desteğiniz için teşekkür ederiz! 🧡');
    return satir.join('\n');
}
function kmOzetGrupMetni(D) {
    let satir = ['🏹 *DAĞ SPOR KULÜBÜ* — Ders Özeti, ' + D.tarih, ''];
    if (D.tema) satir.push('🎮 Bugünün oyunu: *' + D.tema.ad + '*');
    satir.push('👥 ' + D.satirlar.length + ' sporcu · ' + D.atanlar.reduce(function (a, s) { return a + s.seri; }, 0) + ' seri atıldı', '');
    let ilk3 = D.satirlar.slice(0, 3).filter(function (s) { return s.deger > 0; });
    if (ilk3.length) { satir.push(D.olcu === 'hasar' ? '🐉 *Canavara en çok hasar:*' : D.olcu === 'ilerleme' ? '🏁 *Oyunda en önde:*' : '🏁 *Günün en yüksekleri:*'); ilk3.forEach(function (s, i) { satir.push(['🥇', '🥈', '🥉'][i] + ' ' + kmOzetIlkAd(s.ad) + ' — ' + kmOzetOlcuYazi(s, D)); }); satir.push(''); }
    if (D.rekorlar.length) satir.push('🏆 *Kişisel rekor kıranlar:* ' + D.rekorlar.map(function (s) { return kmOzetIlkAd(s.ad) + ' (' + s.enIyi + ')'; }).join(', '));
    if (D.enCokGelisen) satir.push('⭐ *En çok gelişen:* ' + kmOzetIlkAd(D.enCokGelisen.ad));
    if (D.canavar) {
        let y = D.canavar.yenilenler, mvp = D.satirlar.find(function (s) { return s.canavarMvp; });
        satir.push('', '🐉 *Ortak Canavar:* sınıf toplam ' + D.canavar.toplamHasar + ' hasar verdi' + (y.length ? ', ' + y.length + ' canavar yendi (' + y.map(function (c) { return c.ad; }).join(', ') + ')' : ''));
        if (mvp && D.olcu !== 'hasar') satir.push('👑 En çok hasar: ' + kmOzetIlkAd(mvp.ad) + ' (' + mvp.canavar.hasar + ')');
        let sv = D.satirlar.filter(function (s) { return s.canavar && s.canavar.sonVurus; });
        if (sv.length) satir.push('🗡️ Son vuruşlar: ' + sv.map(function (s) { return kmOzetIlkAd(s.ad) + (s.canavar.sonVurus > 1 ? ' ×' + s.canavar.sonVurus : ''); }).join(', '));
    }
    satir.push('', 'Hepsine emekleri için teşekkürler! 🧡');
    return satir.join('\n');
}
let _kmOzetSon = null;
function kmDersOzetiAc() {
    if (!_kmListe.length) return showToast('Derste sporcu yok.', 'warning');
    let D = _kmOzetSon = kmOzetVeri();
    if (!D.atanlar.length && !D.satirlar.some(function (s) { return s.ilerleme > 0; })) return showToast('Henüz skor girilmedi — özet ders ilerledikçe dolar.', 'warning');
    let eski = document.getElementById('kmoz-modal'); if (eski) eski.remove();
    let vurgu = [];
    if (D.satirlar[0] && D.satirlar[0].deger > 0) vurgu.push(['🥇 ' + (D.olcu === 'hasar' ? 'En çok hasar' : D.olcu === 'ilerleme' ? 'Oyunda önde' : 'En yüksek'), kmSablonEsc(D.satirlar[0].ad)]);
    if (D.rekorlar.length) vurgu.push(['🏆 Kişisel rekor', D.rekorlar.map(function (s) { return kmSablonEsc(kmOzetIlkAd(s.ad)); }).join(', ')]);
    if (D.enCokGelisen) vurgu.push(['⭐ En çok gelişen', kmSablonEsc(D.enCokGelisen.ad)]);
    if (D.canavar) { let mvp = D.satirlar.find(function (s) { return s.canavarMvp; }); vurgu.push(['🐉 Canavar', D.canavar.yenilenler.length + ' yenildi' + (mvp ? ' · 👑 ' + kmSablonEsc(kmOzetIlkAd(mvp.ad)) : '')]); }
    vurgu.push(['🎯 Atılan seri', String(D.atanlar.reduce(function (a, s) { return a + s.seri; }, 0))]);
    let m = document.createElement('div'); m.id = 'kmoz-modal'; m.className = 'kmoz-bg';
    m.onclick = function (e) { if (e.target === m) m.remove(); };
    m.innerHTML = '<div class="kmoz" role="dialog" aria-label="Ders Sonu Özeti"><div class="kmoz-ust"><div style="flex:1;min-width:0"><h3>🏅 Ders Sonu Özeti</h3><p>' + D.tarih + (D.tema ? ' · ' + D.tema.ikon + ' ' + kmSablonEsc(D.tema.ad) : '') + ' · ' + D.satirlar.length + ' sporcu</p></div><button class="kmoz-btn" onclick="document.getElementById(\'kmoz-modal\').remove()" aria-label="Kapat">✕</button></div>'
        + '<div class="kmoz-govde"><div class="kmoz-vurgu">' + vurgu.map(function (v) { return '<div class="kmoz-v"><small>' + v[0] + '</small><b>' + v[1] + '</b></div>'; }).join('') + '</div>'
        + D.satirlar.map(function (s, i) {
            let rozet = [];
            if (s.rekor) rozet.push('<span class="rekor">🏆 Rekor ' + s.enIyi + ' (önce ' + s.oncekiEnIyi + ')</span>');
            if (D.enCokGelisen === s) rozet.push('<span class="yildiz">⭐ En çok gelişen</span>');
            if (s.canavarMvp) rozet.push('<span class="rekor">👑 Canavar MVP</span>');
            if (s.canavar && s.canavar.sonVurus) rozet.push('<span class="rekor">🗡️ Son vuruş' + (s.canavar.sonVurus > 1 ? ' ×' + s.canavar.sonVurus : '') + '</span>');
            if (s.canavar && s.canavar.hasar > 0) rozet.push('<span>🐉 ' + s.canavar.hasar + ' hasar' + (s.canavar.kritik ? ' · ⚡' + s.canavar.kritik : '') + (s.canavar.gorev ? ' · 📜' + s.canavar.gorev : '') + '</span>');
            if (s.seri) rozet.push('<span>' + s.seri + ' seri · ' + s.toplam + ' puan · en iyi ' + s.enIyi + (s.x ? ' · ' + s.x + ' X' : '') + '</span>'); else rozet.push('<span>Bugün seri yok</span>');
            return '<div class="kmoz-sat"><div class="kmoz-sira">' + (s.sira <= 3 && s.deger > 0 ? ['🥇', '🥈', '🥉'][s.sira - 1] : s.sira) + '</div><div class="kmoz-ad">' + kmSablonEsc(s.ad) + '<small>' + kmOzetOlcuYazi(s, D) + '</small></div>'
                + '<button class="kmoz-wa" onclick="kmOzetVeliyeGonder(' + i + ')">💬 Veliye</button>'
                + (D.olcu === 'ilerleme' ? '<div class="kmoz-bar"><i style="width:' + Math.round(s.ilerleme * 100) + '%"></i></div>' : '') + '<div class="kmoz-rozet">' + rozet.join('') + '</div></div>';
        }).join('') + '</div>'
        + '<div class="kmoz-alt"><button class="kmoz-btn ana" onclick="kmOzetGrubaGonder()">💬 Veli grubuna gönder</button><button class="kmoz-btn" onclick="kmOzetKopyala()">📋 Metni kopyala</button><button class="kmoz-btn" onclick="kmSonucKartiPaylas()">📸 Sonuç kartı</button></div></div>';
    document.body.appendChild(m);
}
function kmOzetWa(tel, metin) {
    let n = ''; try { n = tel ? telefonWaFormat(tel) : ''; } catch (e) {}
    window.open((n ? 'https://wa.me/' + n + '?text=' : 'https://wa.me/?text=') + encodeURIComponent(metin), '_blank');
}
function kmOzetVeliyeGonder(i) { let D = _kmOzetSon, s = D && D.satirlar[i]; if (!s) return; kmOzetWa(s.sp.acilTelefon, kmOzetVeliMetni(s, D)); }
function kmOzetGrubaGonder() { if (_kmOzetSon) kmOzetWa(null, kmOzetGrupMetni(_kmOzetSon)); }
function kmOzetKopyala() {
    if (!_kmOzetSon) return; let t = kmOzetGrupMetni(_kmOzetSon);
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { showToast('Özet kopyalandı 📋', 'success'); }).catch(function () { prompt('Kopyala:', t); });
}
