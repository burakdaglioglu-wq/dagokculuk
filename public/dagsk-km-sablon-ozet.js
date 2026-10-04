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
    window.open((n ? 'https://api.whatsapp.com/send?phone=' + n + '&text=' : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(metin), '_blank');
}
function kmOzetVeliyeGonder(i) { let D = _kmOzetSon, s = D && D.satirlar[i]; if (!s) return; kmOzetWa(s.sp.acilTelefon, kmOzetVeliMetni(s, D)); }
function kmOzetGrubaGonder() { if (_kmOzetSon) kmOzetWa(null, kmOzetGrupMetni(_kmOzetSon)); }
function kmOzetKopyala() {
    if (!_kmOzetSon) return; let t = kmOzetGrupMetni(_kmOzetSon);
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { showToast('Özet kopyalandı 📋', 'success'); }).catch(function () { prompt('Kopyala:', t); });
}

// ============================================================================================
// 📅 DERS PROGRAMINDAN TEK DOKUNUŞLA DERS (2026-09-29, "sporcuları tek tek seçmek de şablon da gerekmesin")
// Yeni ders ekranının en üstünde bugünün dersleri (şu an süren ya da 30 dk içinde başlayan "şimdi" diye
// vurgulu). Dokununca o dersin kayıtlı sporcuları (Ders Programı katılımcıları; pasifler hariç) seçilir ve
// ders başlar. Hangi dersten başladığı konuma kaydedilir (dag_km_dersslot_<konum> — ortak ders senkronuyla
// tüm cihazlara gider) → ders kapanışında "programda olup gelmeyenler" bilinir.
// ============================================================================================
let _kmProgramOnbellek = { t: 0, slotlar: [] }, _kmProgramdanBasliyor = false;
function kmProgramSlotlariGetir() {
    if (Date.now() - _kmProgramOnbellek.t < 120000) return Promise.resolve(_kmProgramOnbellek.slotlar);
    return fetch('/api/antrenman-programi').then(function (r) { return r.json(); }).then(function (d) {
        _kmProgramOnbellek = { t: Date.now(), slotlar: d.slots || [] };
        try { _programSlotlar = _kmProgramOnbellek.slotlar; } catch (e) {}
        return _kmProgramOnbellek.slotlar;
    }).catch(function () { return _kmProgramOnbellek.slotlar; });
}
function kmDkSaat(s) { let p = String(s || '0:0').split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
function kmBugunDersleri(slotlar) {
    let d = new Date(), gd = d.getDay(), iso = bugunISO(), dk = d.getHours() * 60 + d.getMinutes();
    return slotlar.filter(function (s) { return (s.gunler && s.gunler.length ? s.gunler : [s.gun]).map(Number).indexOf(gd) >= 0 && !(s.istisnalar || []).some(function (i) { return i.tarih === iso; }); })
        .map(function (s) { let bas = kmDkSaat(s.baslangicSaat), bit = kmDkSaat(s.bitisSaat); return { s: s, bas: bas, bit: bit, simdi: dk >= bas - 30 && dk < bit }; })
        .filter(function (x) { return x.bit > dk - 15; }).sort(function (a, b) { return a.bas - b.bas; });
}
function kmDersSporculari(s) { return (s.katilimcilar || []).filter(function (k) { let sp = turnuvaDB[k.grup] && turnuvaDB[k.grup][k.ad]; return sp && !sp.pasif && !sp.donduruldu; }).map(function (k) { return { g: k.grup, ad: k.ad }; }); }
function kmDersSlotAnahtar() { return 'dag_km_dersslot_' + (_kmAktifKonum || 'varsayilan'); }
function kmDersSlot() { try { let v = JSON.parse(localStorage.getItem(kmDersSlotAnahtar()) || 'null'); return v && v.tarih === bugunISO() ? v : null; } catch (e) { return null; } }
function kmProgramDersleriCiz() {
    let el = document.getElementById('km-program-dersler'); if (!el) return;
    // ders sürerken (programdan başlatılmış): bugünün ders listesi yerine bu dersin bilgisi + 📌 açıklaması
    if (kmProgramOrtaDersMi()) { let sl = kmDersSlot(); el.innerHTML = '<div class="kmp-ortaders">📌 <b>' + kmSablonEsc(kmProgramDersAd(sl)) + '</b> dersi sürüyor. Sporcuları seçip onaylarsan bugünkü derse eklenir/çıkarılır; satırdaki <b>📌 Programda / ＋ Programa</b> düğmesi kişiyi <b>ders programına kalıcı</b> olarak ekler ya da çıkarır.</div>'; return; }
    kmProgramSlotlariGetir().then(function (sl) {
        let liste = kmBugunDersleri(sl).slice(0, 3);
        if (!liste.length) { el.innerHTML = ''; return; }
        el.innerHTML = '<div class="kms-baslik">📅 Bugünün dersleri — dokun, kayıtlı sporcularla başlasın</div><div class="kmp-liste">' + liste.map(function (x) {
            let n = kmDersSporculari(x.s).length;
            return '<button class="kmp-ders' + (x.simdi ? ' simdi' : '') + '" onclick="kmProgramDersBaslat(' + JSON.stringify(x.s.id).replace(/"/g, '&quot;') + ')"' + (n ? '' : ' disabled') + '><span class="kmp-saat">' + kmSablonEsc(x.s.baslangicSaat) + '<small>' + kmSablonEsc(x.s.bitisSaat) + '</small></span><span class="kmp-ad"><b>' + kmSablonEsc(x.s.grup || 'Ders') + '</b><small>' + (n ? n + ' kayıtlı sporcu' : 'kayıtlı sporcu yok') + (x.simdi ? ' · şimdi' : '') + '</small></span><span class="kmp-git">▶ Başlat</span></button>';
        }).join('') + '</div>';
    });
}
async function kmProgramDersBaslat(id) {
    let s = (_kmProgramOnbellek.slotlar || []).find(function (x) { return x.id === id; }); if (!s) return;
    let sp = kmDersSporculari(s); if (!sp.length) return showToast("Bu derse kayıtlı sporcu yok — Ders Programı'ndan ekleyebilirsin.", 'warning');
    _kmSecimler = {}; sp.forEach(function (k) { _kmSecimler[k.g + '_' + k.ad] = k; });
    try { localStorage.setItem(kmDersSlotAnahtar(), JSON.stringify({ id: s.id, grup: s.grup, bas: s.baslangicSaat, bit: s.bitisSaat, tarih: bugunISO(), katilimcilar: sp })); } catch (e) {}
    _kmProgramdanBasliyor = true;
    try { await kmBaslat(); } finally { _kmProgramdanBasliyor = false; }
}
(function () {
    function kanca() {
        if (typeof kmModalDoldur !== 'function' || typeof kmBaslat !== 'function') return setTimeout(kanca, 300);
        let eskiDoldur = kmModalDoldur, eskiBaslat = kmBaslat;
        kmModalDoldur = function () { let r = eskiDoldur.apply(this, arguments); kmProgramDersleriCiz(); return r; };
        // Elle (programdan değil) başlatılan derste eski ders bağlantısı kalmasın.
        // 2026-10-04: ders SÜRERKEN "Sporcu ekle" penceresinden onaylanınca ders bağlantısı korunur ve program farkı sorulur
        // (eskiden silinirdi → kapanış ekranı ve programa ekleme sorusu dersi bilmiyordu).
        kmBaslat = function () {
            let slot = kmDersSlot(), onceki = (typeof _kmListe !== 'undefined' ? _kmListe : []).slice(), ortaDers = !!(slot && onceki.length && !_kmProgramdanBasliyor);
            if (!_kmProgramdanBasliyor && !ortaDers) { try { localStorage.removeItem(kmDersSlotAnahtar()); } catch (e) {} }
            let r = eskiBaslat.apply(this, arguments);
            if (ortaDers) Promise.resolve(r).then(function () { try { kmProgramFarkSor(slot, onceki); } catch (e) {} });
            return r;
        };
    }
    kanca();
    let st = document.createElement('style');
    st.textContent = '.kmp-liste{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}'
        + '.kmp-ders{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid var(--border-color);border-radius:12px;background:var(--surface-1,var(--bg-panel));color:var(--text-primary,var(--text-main));padding:9px 12px;cursor:pointer;font:inherit;min-height:52px}'
        + '.kmp-ders.simdi{border-color:var(--accent-orange);background:color-mix(in srgb,var(--accent-orange) 12%,transparent)}'
        + '.kmp-ders:disabled{opacity:.5;cursor:default}.kmp-ders:focus-visible{outline:2px solid var(--accent-orange);outline-offset:2px}'
        + '.kmp-saat{display:flex;flex-direction:column;font-weight:900;font-size:15px;font-variant-numeric:tabular-nums;min-width:48px}.kmp-saat small{font-size:10px;font-weight:600;color:var(--text-muted)}'
        + '.kmp-ad{flex:1;min-width:0;display:flex;flex-direction:column}.kmp-ad b{font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kmp-ad small{font-size:10.5px;color:var(--text-muted)}'
        + '.kmp-git{font-weight:900;font-size:12px;color:var(--accent-orange);white-space:nowrap}'
        + '.kmk-not-ac{border:0;background:transparent;color:var(--accent-orange);font:inherit;font-weight:800;cursor:pointer}.kmk-not-sat{display:flex;flex-direction:column;gap:6px;padding:8px 0;border-top:1px solid var(--border-color)}.kmk-not-cipler{display:flex;flex-wrap:wrap;gap:5px}'
        + '.kmk-not-cipler button{min-height:34px;padding:0 10px;border-radius:99px;border:1px solid var(--border-color);background:transparent;color:var(--text-primary,var(--text-main));font:inherit;font-size:12px;font-weight:700;cursor:pointer}.kmk-not-cipler button.aktif{background:var(--accent-orange);border-color:var(--accent-orange);color:#fff}'
        + '.kmk-not-yazi{min-height:38px;padding:0 10px;border-radius:10px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);font:inherit;font-size:13px}'
        + '.kmk-bolum{border:1px solid var(--border-color);border-radius:12px;padding:10px 12px;background:var(--surface-1,var(--bg-panel));display:flex;flex-direction:column;gap:6px}'
        + '.kmk-bolum h4{margin:0;font-size:13px;font-weight:900;display:flex;align-items:center;gap:8px;flex-wrap:wrap}.kmk-bolum h4 small{font-weight:600;color:var(--text-muted);font-size:11px}'
        + '.kmk-sat{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:5px 0;border-top:1px solid var(--border-color)}'
        + '.kmk-ad{flex:1;min-width:120px;font-weight:800;font-size:12.5px}.kmk-ad small{display:block;font-weight:600;font-size:10.5px;color:var(--text-muted)}'
        + '.kmk-sec{display:flex;gap:4px}.kmk-sec button{border:1.5px solid var(--border-color);background:transparent;color:var(--text-secondary,var(--text-muted));border-radius:8px;padding:5px 10px;font-weight:800;font-size:11.5px;cursor:pointer;min-height:36px}'
        + '.kmk-sec button.g.aktif{border-color:var(--status-success,#4FB07A);color:var(--status-success,#4FB07A);background:color-mix(in srgb,var(--status-success,#4FB07A) 16%,transparent)}'
        + '.kmk-sec button.y.aktif{border-color:var(--status-danger,#ef4444);color:var(--status-danger,#ef4444);background:color-mix(in srgb,var(--status-danger,#ef4444) 16%,transparent)}'
        + '.kmk-sat.gonderildi{opacity:.55}.kmk-not{font-size:11px;color:var(--text-muted)}';
    document.head.appendChild(st);
})();

// ============================================================================================
// 🏁 DERS KAPANIŞI (2026-09-29, "gelmeyenler işaretli gelsin, velilerine mesaj ve özet aynı ekranda")
// "Dersi Bitir" artık tek ekran açar: (1) yoklama — skor giren/işaretli olan "geldi", programdan başlatılan
// derste kayıtlı olup derse hiç eklenmeyen "gelmedi" hazır; koç düzeltip kaydeder → otomatikYoklamaDB (her
// yerdeki yoklamayla aynı kayıt); (2) gelmeyenlerin velilerine hazır mesaj; (3) skor girenlerin veli raporları;
// (4) sınıf özeti (veli grubu). Özet ve durum, skorlar sıfırlanmadan ÖNCE alınır (kmKapanisHazirla).
// ============================================================================================
let _kmKapanis = null;
function kmKapanisHazirla() {
    let bugun = bugunISO(), gun = otomatikYoklamaDB[bugun] || {}, slot = kmDersSlot(), D = null;
    try { D = kmOzetVeri(); } catch (e) {}
    let isaret = function (g, ad) { let r = gun[ad]; return r && (!r.grup || r.grup === g) ? (r.geldi === false ? 'gelmedi' : 'geldi') : null; };
    let kisiler = {};
    _kmListe.forEach(function (k) {
        let sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad], atti = !!(sp && (sp.seriler || []).length), i = isaret(k.g, k.ad);
        kisiler[k.g + '|' + k.ad] = { g: k.g, ad: k.ad, durum: i || 'geldi', atti: atti };
    });
    if (slot) (slot.katilimcilar || []).forEach(function (k) {
        let key = k.g + '|' + k.ad; if (kisiler[key]) return;
        kisiler[key] = { g: k.g, ad: k.ad, durum: isaret(k.g, k.ad) || 'gelmedi', atti: false, disarida: true };
    });
    let liste = Object.keys(kisiler).map(function (k) { return kisiler[k]; }).sort(function (a, b) { return (a.durum === 'gelmedi') - (b.durum === 'gelmedi') || a.ad.localeCompare(b.ad, 'tr'); });
    return { tarih: bugun, slot: slot, D: D, kisiler: liste, onaylandi: false, gonderilen: {} };
}
// 📝 KOÇ NOTU (2026-10-02, araştırma: Archery GB "uyumlu koçluk" — sporcunun gelişimi eğitmenler arasında aktarılsın).
// Ders kapanışında gelen her sporcuya hızlı çip + kısa not. Meta koc_notu {g|ad|tarih: {cipler, not, kim}}; karnede ve
// Teknik Koçluk kartında son not görünür.
const KOC_NOT_CIPLER = ['👍 Odaklıydı', '🎯 Gruplama iyi', '🦾 Takip iyi', '📏 Ankraj sabit', '⭐ Çok gelişti', '😴 Yorgundu', '🌀 Dağınıktı', '⚠️ Ankraj kaydı', '🤕 Ağrı / sakatlık'];
function kocNotuOku(g, ad, tarih) { let o = kyDepoOku('koc_notu')[g + '|' + ad + '|' + tarih]; return o && !o.sil ? o : null; }
function kocNotuYaz(g, ad, tarih, degis) {
    let d = kyDepoOku('koc_notu'), k = g + '|' + ad + '|' + tarih, e = d[k] && !d[k].sil ? d[k] : { cipler: [], not: '' };
    let yeni = Object.assign({}, e, degis, { t: Date.now(), kim: (typeof _oturum !== 'undefined' && _oturum && _oturum.ad) || e.kim || '' });
    d[k] = (yeni.cipler || []).length || (yeni.not || '').trim() ? yeni : { t: Date.now(), sil: true };
    let sinir = bsIsoTarih(new Date(Date.now() - 400 * 864e5)); Object.keys(d).forEach(x => { if (x.split('|').pop() < sinir) delete d[x]; });
    kyDepoYazYerel('koc_notu', d); kyDepoSenkron('koc_notu', () => kyDepoOku('koc_notu'), true).catch(() => {});
}
function kmKapanisNotCip(i, c) {
    let x = _kmKapanis && _kmKapanis.kisiler[i]; if (!x) return;
    let o = kocNotuOku(x.g, x.ad, _kmKapanis.tarih) || { cipler: [] }, l = (o.cipler || []).slice();
    l = l.includes(c) ? l.filter(y => y !== c) : l.concat(c);
    kocNotuYaz(x.g, x.ad, _kmKapanis.tarih, { cipler: l }); kmKapanisCiz();
}
function kmKapanisNotYazi(i, v) { let x = _kmKapanis && _kmKapanis.kisiler[i]; if (!x) return; kocNotuYaz(x.g, x.ad, _kmKapanis.tarih, { not: String(v || '').slice(0, 300) }); }
function kmKapanisAc(K, arsivlenenler) {
    _kmKapanis = K; K.arsiv = arsivlenenler || [];
    try { localStorage.removeItem(kmDersSlotAnahtar()); } catch (e) {}
    kmKapanisCiz();
}
function kmKapanisTel(g, ad) { let sp = turnuvaDB[g] && turnuvaDB[g][ad]; return sp && sp.acilTelefon; }
function kmKapanisCiz() {
    let K = _kmKapanis; if (!K) return;
    let m = document.getElementById('kmk-modal');
    if (!m) { m = document.createElement('div'); m.id = 'kmk-modal'; m.className = 'kmoz-bg'; document.body.appendChild(m); }
    let gelen = K.kisiler.filter(function (x) { return x.durum === 'geldi'; }).length, gelmeyen = K.kisiler.filter(function (x) { return x.durum === 'gelmedi'; });
    let baslik = K.slot ? kmSablonEsc(K.slot.bas + ' ' + (K.slot.grup || 'Ders')) : 'Karışık Sınıf';
    let yoklama = '<div class="kmk-bolum"><h4>✅ Yoklama <small>' + gelen + ' geldi · ' + gelmeyen.length + ' gelmedi' + (K.onaylandi ? ' · kaydedildi ✓' : '') + '</small></h4>'
        + (K.slot ? '' : '<div class="kmk-not">Ders Programı\'ndan başlatılan derslerde, kayıtlı olup gelmeyenler de burada hazır çıkar.</div>')
        + K.kisiler.map(function (x, i) {
            return '<div class="kmk-sat"><div class="kmk-ad">' + kmSablonEsc(x.ad) + '<small>' + (x.atti ? 'skor girdi' : x.disarida ? 'programda kayıtlı, derse gelmedi' : 'derste') + '</small></div>'
                + '<div class="kmk-sec"><button class="g' + (x.durum === 'geldi' ? ' aktif' : '') + '" onclick="kmKapanisDurum(' + i + ',\'geldi\')">✅ Geldi</button><button class="y' + (x.durum === 'gelmedi' ? ' aktif' : '') + '" onclick="kmKapanisDurum(' + i + ',\'gelmedi\')">❌ Gelmedi</button></div></div>';
        }).join('')
        + '<button class="kmoz-btn ana" onclick="kmKapanisYoklamaKaydet()">' + (K.onaylandi ? '✓ Kaydedildi — tekrar kaydet' : '💾 Yoklamayı kaydet') + '</button></div>';
    let veliGelmeyen = gelmeyen.length ? '<div class="kmk-bolum"><h4>💬 Gelmeyenlerin velileri <small>' + gelmeyen.length + ' kişi</small></h4>' + gelmeyen.map(function (x) {
        let i = K.kisiler.indexOf(x), tel = kmKapanisTel(x.g, x.ad), k = 'y' + i;
        return '<div class="kmk-sat' + (K.gonderilen[k] ? ' gonderildi' : '') + '"><div class="kmk-ad">' + kmSablonEsc(x.ad) + '<small>' + (tel ? '📞 ' + kmSablonEsc(tel) : 'telefon kayıtlı değil') + '</small></div><button class="kmoz-wa" onclick="kmKapanisGelmeyenMesaj(' + i + ')">' + (K.gonderilen[k] ? '✓ Gönderildi' : '💬 WhatsApp') + '</button></div>';
    }).join('') + '</div>' : '';
    let raporlar = K.arsiv.length ? '<div class="kmk-bolum"><h4>📋 Veli raporları <small>bugün skor giren ' + K.arsiv.length + ' sporcu</small></h4>' + K.arsiv.map(function (x, i) {
        let tel = kmKapanisTel(x.g, x.ad), k = 'r' + i;
        return '<div class="kmk-sat' + (K.gonderilen[k] ? ' gonderildi' : '') + '"><div class="kmk-ad">' + kmSablonEsc(x.ad) + '<small>' + (tel ? '📞 ' + kmSablonEsc(tel) : 'telefon kayıtlı değil') + '</small></div><button class="kmoz-btn" onclick="kmKapanisRaporKopyala(' + i + ')" aria-label="Kopyala">📋</button><button class="kmoz-wa" onclick="kmKapanisRaporGonder(' + i + ')">' + (K.gonderilen[k] ? '✓ Gönderildi' : '💬 WhatsApp') + '</button></div>';
    }).join('') + '</div>' : '';
    let gelenler = K.kisiler.map(function (x, i) { return { x: x, i: i }; }).filter(function (o) { return o.x.durum === 'geldi'; });
    let kocNot = gelenler.length && typeof kyDepoOku === 'function' ? '<div class="kmk-bolum"><h4>📝 Koç notu <small>isteğe bağlı · karneye ve Teknik Koçluk\'a gider · ' + (K.notAcik ? '' : '<button class="kmk-not-ac" onclick="_kmKapanis.notAcik=true; kmKapanisCiz()">yaz ▾</button>') + '</small></h4>'
        + (K.notAcik ? gelenler.map(function (o) {
            let n = kocNotuOku(o.x.g, o.x.ad, K.tarih) || { cipler: [], not: '' };
            return '<div class="kmk-not-sat"><div class="kmk-ad">' + kmSablonEsc(o.x.ad) + '</div><div class="kmk-not-cipler">' + KOC_NOT_CIPLER.map(function (c) { let a = (n.cipler || []).includes(c); return '<button class="' + (a ? 'aktif' : '') + '" aria-pressed="' + a + '" onclick="kmKapanisNotCip(' + o.i + ',' + JSON.stringify(c).replace(/"/g, '&quot;') + ')">' + kmSablonEsc(c) + '</button>'; }).join('') + '</div>'
                + '<input class="kmk-not-yazi" type="text" maxlength="300" placeholder="Kısa not (isteğe bağlı)" value="' + kmSablonEsc(n.not || '') + '" onchange="kmKapanisNotYazi(' + o.i + ', this.value)" aria-label="' + kmSablonEsc(o.x.ad) + ' koç notu"></div>';
        }).join('') : '') + '</div>' : '';
    let ozetVar = K.D && (K.D.atanlar.length || K.D.satirlar.some(function (s) { return s.deger > 0; }));
    let ozet = ozetVar ? '<div class="kmk-bolum"><h4>🏅 Sınıf özeti <small>veli grubuna tek mesaj</small></h4><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="kmoz-btn ana" onclick="kmOzetWa(null, kmOzetGrupMetni(_kmKapanis.D))">💬 Veli grubuna gönder</button><button class="kmoz-btn" onclick="kmKapanisOzetKopyala()">📋 Metni kopyala</button></div></div>' : '';
    m.innerHTML = '<div class="kmoz" role="dialog" aria-label="Ders Kapanışı"><div class="kmoz-ust"><div style="flex:1;min-width:0"><h3>🏁 Ders Kapanışı</h3><p>' + baslik + ' · ' + formatTarih(K.tarih) + ' · ' + K.kisiler.length + ' kişi</p></div><button class="kmoz-btn" onclick="kmKapanisKapat()" aria-label="Kapat">✕</button></div>'
        + '<div class="kmoz-govde">' + yoklama + kocNot + veliGelmeyen + raporlar + ozet + '</div></div>';
}
function kmKapanisDurum(i, durum) { let x = _kmKapanis && _kmKapanis.kisiler[i]; if (!x) return; x.durum = durum; _kmKapanis.onaylandi = false; kmKapanisCiz(); }
function kmKapanisYoklamaKaydet() {
    let K = _kmKapanis; if (!K) return;
    let t = K.tarih, saat = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }), n = 0;
    if (!otomatikYoklamaDB[t]) otomatikYoklamaDB[t] = {};
    K.kisiler.forEach(function (x) {
        let r = otomatikYoklamaDB[t][x.ad], mevcut = r && (!r.grup || r.grup === x.g) ? (r.geldi === false ? 'gelmedi' : 'geldi') : null;
        if (mevcut === x.durum) return;
        otomatikYoklamaDB[t][x.ad] = { saat: (r && r.saat) || saat, grup: x.g, elle: true, geldi: x.durum === 'geldi' }; n++;
    });
    try { otomatikYoklamaKaydet(); } catch (e) {}
    try { bekleyenGonderim = true; bulutaGonderKontrol(); } catch (e) {}
    try { yoneticiDevamsizlikWidgetCiz(); } catch (e) {}
    K.onaylandi = true; showToast('✅ Yoklama kaydedildi' + (n ? ' (' + n + ' değişiklik)' : ''), 'success'); kmKapanisCiz();
}
function kmKapanisGelmeyenMesaj(i) {
    let x = _kmKapanis && _kmKapanis.kisiler[i]; if (!x) return;
    let ders = _kmKapanis.slot ? ' ' + _kmKapanis.slot.bas + ' dersimizde' : ' bugünkü dersimizde';
    kmOzetWa(kmKapanisTel(x.g, x.ad), "Merhaba 🌟 DAĞ Spor Kulübü'nden yazıyoruz.\n\n" + kmOzetIlkAd(x.ad) + "'i" + ders + ' göremedik, umarız her şey yolundadır 🧡 Bir sonraki antrenmanda görüşmek dileğiyle!\n\nDAĞ Spor Kulübü');
    _kmKapanis.gonderilen['y' + i] = true; kmKapanisCiz();
}
function kmKapanisRaporMetni(i) {
    let K = _kmKapanis, x = K && K.arsiv[i]; if (!x) return '';
    let s = K.D && K.D.satirlar.find(function (r) { return r.g === x.g && r.ad === x.ad; });
    if (s) return kmOzetVeliMetni(s, K.D);
    try { return _dersSonuOzetMetni(x.g, x.ad); } catch (e) { return ''; }
}
function kmKapanisRaporGonder(i) { let x = _kmKapanis && _kmKapanis.arsiv[i]; if (!x) return; kmOzetWa(kmKapanisTel(x.g, x.ad), kmKapanisRaporMetni(i)); _kmKapanis.gonderilen['r' + i] = true; kmKapanisCiz(); }
function kmKapanisKopyala(t, mesaj) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { showToast(mesaj, 'success'); }).catch(function () { prompt('Kopyala:', t); }); }
function kmKapanisRaporKopyala(i) { kmKapanisKopyala(kmKapanisRaporMetni(i), 'Rapor kopyalandı 📋'); }
function kmKapanisOzetKopyala() { kmKapanisKopyala(kmOzetGrupMetni(_kmKapanis.D), 'Özet kopyalandı 📋'); }
function kmKapanisKapat() {
    let K = _kmKapanis;
    let bitir = function () { let m = document.getElementById('kmk-modal'); if (m) m.remove(); _kmKapanis = null; };
    if (K && !K.onaylandi && K.kisiler.length) return onayIste('Yoklama henüz kaydedilmedi. Kaydetmeden kapatılsın mı?<br><span style="font-size:12px;color:var(--text-muted)">Skor giren sporcular zaten "geldi" sayıldı; sadece gelmeyenler işaretlenmemiş kalır.</span>', bitir, 'Kaydetmeden kapat');
    bitir();
}

// ---------------------------------------------------------------- DERS PROGRAMINA KALICI EKLE / ÇIKAR (2026-10-04)
// Kullanıcı: "Karışık Sınıf'ı Pazar 11 dersinden başlatıp derste olmayan birini eklediğimde, bu kişiyi kalıcı olarak ders
// programına yazayım mı diye sor; ekle-kaldır ekranında da kalıcı olarak programa ekleyip çıkarabileyim". Programdan
// başlatılmış ders sürerken: (1) "Sporcu ekle" penceresinde her satırda 📌 düğmesi (programda / programa ekle) — dokununca
// ders programı hemen güncellenir; (2) pencere onaylanınca programda olmayan yeni eklenenler (ve çıkarılıp programda kalanlar)
// için "programa da kaydedeyim mi?" sorulur. Ders sürerken pencere onaylanınca ders bağlantısı artık silinmez.
const KM_PROGRAM_GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
let _kmPinProgram = null, _kmPinYukleniyor = false;
function kmProgramDersAd(slot) { return KM_PROGRAM_GUN[new Date().getDay()] + ' ' + (slot.bas || '') + ' · ' + (slot.grup || 'Ders'); }
function kmProgramSlotTaze(id) { _kmProgramOnbellek.t = 0; return kmProgramSlotlariGetir().then(function (sl) { return (sl || []).find(function (x) { return x.id === id; }) || null; }); }
function kmProgramOrtaDersMi() { return !!(kmDersSlot() && typeof _kmListe !== 'undefined' && _kmListe.length); }
function kmProgramPinYukle() {
    let slot = kmDersSlot(); if (!slot || _kmPinYukleniyor) return; _kmPinYukleniyor = true;
    kmProgramSlotTaze(slot.id).then(function (s) {
        let set = {}; ((s && s.katilimcilar) || (slot.katilimcilar || []).map(function (k) { return { grup: k.g, ad: k.ad }; })).forEach(function (k) { set[k.grup + '|' + k.ad] = 1; });
        _kmPinProgram = { id: slot.id, set: set };
    }).catch(function () { _kmPinProgram = { id: slot.id, set: {} }; }).then(function () {
        _kmPinYukleniyor = false;
        let m = document.getElementById('karisik-modal'); if (m && m.style.display === 'flex') kmModalDoldur();
    });
}
function kmProgramPinHTML(g, ad) {
    if (!kmProgramOrtaDersMi()) return '';
    let slot = kmDersSlot(), p = _kmPinProgram && _kmPinProgram.id === slot.id ? _kmPinProgram.set : null;
    if (!p) { kmProgramPinYukle(); return ''; }
    let var_ = !!p[g + '|' + ad];
    return '<button type="button" class="kmp-pin' + (var_ ? ' var' : '') + '" onclick="event.stopPropagation(); kmProgramPinDegis(\'' + encodeURIComponent(g) + '\',\'' + encodeURIComponent(ad).replace(/'/g, '%27') + '\')" title="' + (var_ ? 'Ders programında kayıtlı — dokun: programdan çıkar' : 'Ders programında yok — dokun: kalıcı olarak programa ekle') + '">' + (var_ ? '📌 Programda' : '＋ Programa') + '</button>';
}
function kmProgramPinDegis(gE, adE) {
    let g = decodeURIComponent(gE), ad = decodeURIComponent(adE), slot = kmDersSlot(); if (!slot || !_kmPinProgram) return;
    if (_kmPinProgram.set[g + '|' + ad]) onayIste('<b>' + kmSablonEsc(ad) + '</b>, <b>' + kmSablonEsc(kmProgramDersAd(slot)) + '</b> dersinin programından kalıcı olarak çıkarılsın mı?<br><span style="font-size:12px;color:var(--text-muted)">Bugünkü dersteki yeri ve geçmiş yoklamaları değişmez.</span>', function () { kmProgramKatilimci(slot, g, ad, false); }, 'Programdan çıkar');
    else kmProgramKatilimci(slot, g, ad, true);
}
function kmProgramKatilimci(slot, g, ad, ekle) {
    let url = '/api/antrenman-programi/' + slot.id + '/katilimci', cihaz = typeof _cihazId !== 'undefined' ? _cihazId : null;
    let istek = ekle ? fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ grup: g, ad: ad, deviceId: cihaz }) })
        : fetch(url + '?grup=' + encodeURIComponent(g) + '&ad=' + encodeURIComponent(ad) + '&deviceId=' + encodeURIComponent(cihaz || ''), { method: 'DELETE' });
    return istek.then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); }).then(function (d) {
        if (!d.applied) throw 0;
        if (_kmPinProgram && _kmPinProgram.id === slot.id) { if (ekle) _kmPinProgram.set[g + '|' + ad] = 1; else delete _kmPinProgram.set[g + '|' + ad]; }
        // ders kapanışındaki "programda olup gelmeyen" listesi de güncel olsun
        try { let v = kmDersSlot(); if (v && v.id === slot.id) { v.katilimcilar = (v.katilimcilar || []).filter(function (k) { return !(k.g === g && k.ad === ad); }); if (ekle) v.katilimcilar.push({ g: g, ad: ad }); localStorage.setItem(kmDersSlotAnahtar(), JSON.stringify(v)); } } catch (e) {}
        _kmProgramOnbellek.t = 0;
        showToast((ekle ? '📌 ' + ad + ' ders programına eklendi: ' : ad + ' ders programından çıkarıldı: ') + kmProgramDersAd(slot), 'success');
        let m = document.getElementById('karisik-modal'); if (m && m.style.display === 'flex') kmModalDoldur();
        return true;
    }).catch(function (st) { showToast(st === 401 || st === 403 ? 'Ders programını değiştirmek için yetkin yok.' : ad + ': ders programı güncellenemedi (bağlantı?)', 'error'); return false; });
}
// pencere onaylanınca: programda olmayan yeni eklenenler + çıkarılıp programda kalanlar için sor
function kmProgramFarkSor(slot, onceki) {
    let key = function (k) { return k.g + '|' + k.ad; }, oncekiSet = {}, simdiSet = {};
    onceki.forEach(function (k) { oncekiSet[key(k)] = 1; }); (_kmListe || []).forEach(function (k) { simdiSet[key(k)] = 1; });
    let yeni = (_kmListe || []).filter(function (k) { return !oncekiSet[key(k)]; }), cikan = onceki.filter(function (k) { return !simdiSet[key(k)]; });
    if (!yeni.length && !cikan.length) return;
    kmProgramSlotTaze(slot.id).then(function (s) {
        let prog = {}; ((s && s.katilimcilar) || (slot.katilimcilar || []).map(function (k) { return { grup: k.g, ad: k.ad }; })).forEach(function (k) { prog[k.grup + '|' + k.ad] = 1; });
        let ekle = yeni.filter(function (k) { return !prog[key(k)]; }), cikar = cikan.filter(function (k) { return prog[key(k)]; });
        if (!ekle.length && !cikar.length) return;
        let kutu = function (id, k, isaretli) { return '<label style="display:flex;align-items:center;gap:10px;padding:7px 0;font-size:14px;cursor:pointer"><input type="checkbox" id="' + id + '"' + (isaretli ? ' checked' : '') + ' style="appearance:auto!important;-webkit-appearance:checkbox!important;width:20px;height:20px;flex-shrink:0"><span><b>' + kmSablonEsc(k.ad) + '</b> <small style="color:var(--text-muted)">' + kmSablonEsc((typeof LIG_ETIKET !== 'undefined' && LIG_ETIKET[k.g]) || k.g) + '</small></span></label>'; };
        let html = '<div style="text-align:left"><b>📌 ' + kmSablonEsc(kmProgramDersAd(slot)) + ' · ders programı</b>'
            + (ekle.length ? '<div style="margin-top:10px;font-size:13px;color:var(--text-muted)">Bu derste <b>kayıtlı olmayan</b> eklediğin sporcular. <b>Kalıcı olarak ders programına</b> da yazayım mı?</div>' + ekle.map(function (k, i) { return kutu('kmpf-e-' + i, k, true); }).join('') : '')
            + (cikar.length ? '<div style="margin-top:10px;font-size:13px;color:var(--text-muted)">Bugün çıkardığın ama programda kayıtlı olanlar. <b>Programdan da</b> çıkarayım mı?</div>' + cikar.map(function (k, i) { return kutu('kmpf-c-' + i, k, false); }).join('') : '')
            + '<div style="margin-top:10px;font-size:12px;color:var(--text-muted)">İşaretsiz olanlar sadece bugünkü derste değişir.</div></div>';
        onayIste(html, function () {
            let ise = []; ekle.forEach(function (k, i) { let c = document.getElementById('kmpf-e-' + i); if (c && c.checked) ise.push([k, true]); }); cikar.forEach(function (k, i) { let c = document.getElementById('kmpf-c-' + i); if (c && c.checked) ise.push([k, false]); });
            ise.reduce(function (p, x) { return p.then(function () { return kmProgramKatilimci(slot, x[0].g, x[0].ad, x[1]); }); }, Promise.resolve());
        }, 'Programa kaydet', 'Sadece bugün');
    });
}
(function () {
    let st = document.createElement('style');
    st.textContent = '.kmp-pin{flex-shrink:0;min-height:32px;padding:0 10px;border-radius:99px;border:1px dashed var(--border-color);background:transparent;color:var(--text-muted);font:inherit;font-size:11.5px;font-weight:800;cursor:pointer;white-space:nowrap}'
        + '.kmp-pin.var{border-style:solid;border-color:var(--accent-orange);color:var(--accent-orange);background:color-mix(in srgb,var(--accent-orange) 10%,transparent)}'
        + '.kmp-ortaders{border:1px solid var(--accent-orange);border-radius:12px;padding:10px 12px;margin-bottom:10px;font-size:12.5px;line-height:1.45;background:color-mix(in srgb,var(--accent-orange) 8%,transparent)}';
    document.head.appendChild(st);
})();
