/* ================================================================================================
   🧭 DERS PANELİ — Karışık Sınıf (2026-10-14, kullanıcı: "tek ekrandan ders yönetimi — önemli bir buton olsun").
   Bugün derste yaşanan karmaşa (sporcu eklerken Yarışma'dan atma, kim nerede belli değil) için tek ekran:
   her sporcunun yoklaması (geldi / gelmedi / işaretsiz), hattı (🎮 Oyun / 🏆 Yarışma), Yarışma'dayken Yumurta'da da
   oynayıp oynamadığı, bugünkü serisi, Yarışma turunda olup olmadığı ve dersten çıkarma — hepsi tek satırda.
   Üstte büyük işler: sporcu ekle, hepsi geldi, yaşa göre hatlar, Yarışma / Oyunlar / Yumurta'ya git, dersi bitir.
   Veri değişmez, mevcut kayıtlar kullanılır: otomatikYoklamaDB (yoklama), dag_km_hat_<konum> (hat), dag_km_yuvaliste_<konum>
   (yumurta), _kmListe (ders listesi, _kmListeKaydet ile sunucuya). Açıkken 3 sn'de bir başka cihazdan gelen değişikliğe bakar.
   ================================================================================================ */
let _kmDp = { ara: '', poll: null, imza: '' };
function kmDpKonum() { return (typeof _kmAktifKonum !== 'undefined' && _kmAktifKonum) ? _kmAktifKonum : 'varsayilan'; }
function kmDpYoklama(k) { let y = (otomatikYoklamaDB[bugunISO()] || {})[k.ad]; if (!y || y.grup !== k.g) return null; return y.geldi === false ? 'gelmedi' : 'geldi'; }
function kmDpYoklamaYaz(gEnc, adEnc, durum) {
    let g = decodeURIComponent(gEnc), ad = decodeURIComponent(adEnc), tarih = bugunISO();
    if (!otomatikYoklamaDB[tarih]) otomatikYoklamaDB[tarih] = {};
    let saat = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (durum === 'geldi') otomatikYoklamaDB[tarih][ad] = { saat: saat, grup: g, elle: true, geldi: true };
    else if (durum === 'gelmedi') otomatikYoklamaDB[tarih][ad] = { saat: saat, grup: g, elle: true, geldi: false };
    else delete otomatikYoklamaDB[tarih][ad];
    try { otomatikYoklamaKaydet(); } catch (e) {}
    try { bekleyenGonderim = true; bulutaGonderKontrol(); } catch (e) {}
    kmDpYan(); kmDpCiz();
}
function kmDpHepsiGeldi() {
    let tarih = bugunISO(), n = 0; if (!otomatikYoklamaDB[tarih]) otomatikYoklamaDB[tarih] = {};
    let saat = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    (_kmListe || []).forEach(function (k) { if (!kmDpYoklama(k)) { otomatikYoklamaDB[tarih][k.ad] = { saat: saat, grup: k.g, elle: true, geldi: true }; n++; } });
    try { otomatikYoklamaKaydet(); } catch (e) {} try { bekleyenGonderim = true; bulutaGonderKontrol(); } catch (e) {}
    showToast(n ? '✅ ' + n + ' sporcu "geldi" işaretlendi' : 'İşaretsiz sporcu yok', 'success'); kmDpYan(); kmDpCiz();
}
function kmDpHat(k) { return typeof kmHat === 'function' ? kmHat(k.g, k.ad) : 'oyun'; }
function kmDpHatYaz(kEnc, hat) {
    let k = decodeURIComponent(kEnc), h = kmHatlar(); h[k] = hat === 'yarisma' ? 'yarisma' : 'oyun';
    kmHatKaydet(h); try { kmHatHafizaKaydet([k], h); } catch (e) {}
    kmDpYan(); kmDpCiz();
}
function kmDpYuvaAnahtar() { return 'dag_km_yuvaliste_' + kmDpKonum(); }
function kmDpYuvada(k) { let a = {}; try { a = JSON.parse(localStorage.getItem(kmDpYuvaAnahtar()) || '{}') || {}; } catch (e) {} let v = a[k.g + '|' + k.ad]; return v === 'ek' ? true : v === 'cik' ? false : kmDpHat(k) !== 'yarisma'; }
function kmDpYuvaYaz(kEnc, acik) { let a = {}; try { a = JSON.parse(localStorage.getItem(kmDpYuvaAnahtar()) || '{}') || {}; } catch (e) {} a[decodeURIComponent(kEnc)] = acik ? 'ek' : 'cik'; try { localStorage.setItem(kmDpYuvaAnahtar(), JSON.stringify(a)); } catch (e) {} kmDpYan(); kmDpCiz(); }
function kmDpCikar(kEnc) {
    let k = decodeURIComponent(kEnc), i = k.indexOf('|'), g = k.slice(0, i), ad = k.slice(i + 1);
    onayIste('<b>' + esc(ad) + '</b> bugünkü dersten çıkarılsın mı?<br><small>Skorları ve karnesi silinmez; sadece ders listesinden çıkar.</small>', function () {
        _kmListe = (_kmListe || []).filter(function (s) { return !(s.g === g && s.ad === ad); });
        try { _kmListeKaydet(); } catch (e) {}
        showToast(ad + ' dersten çıkarıldı', 'warning'); kmDpYan(); kmDpCiz();
    }, 'Çıkar', 'Vazgeç');
}
function kmDpBugunSeri(k) { let sp = turnuvaDB[k.g] && turnuvaDB[k.g][k.ad], b = bugunISO(), l = ((sp && sp.seriler) || []).filter(function (s) { return s && s.tarih === b; }); return { n: l.length, puan: l.reduce(function (a, s) { return a + (typeof s.puan === 'number' ? s.puan : 0); }, 0) }; }
function kmDpYas(k) { try { return typeof kmSporcuYasi === 'function' ? kmSporcuYasi(k.g, k.ad) : null; } catch (e) { return null; } }
function kmDpTur() { try { if (typeof yzOku !== 'function') return null; let d = yzOku().durum; return d && d.asama && d.asama !== 'kurulum' && d.asama !== 'bitti' ? d : null; } catch (e) { return null; } }
function kmDpTuraEkle(kEnc) { if (typeof yzYenileriEkle === 'function') { yzYenileriEkle(kEnc); kmDpCiz(); } }
// Panelden bir araca geçilir: panel kapanır, platform görünür, araç açılır.
function kmDpGit(arac) { kmDpKapat(); try { document.getElementById('karisik-platform').style.display = 'flex'; } catch (e) {} if (arac === 'yuva') { try { kmAracSec('oyunlar'); } catch (e) {} kmSekme('yuva'); } else kmAracSec(arac); }
function kmDpYan() { try { kmSinifKartiCiz(); } catch (e) {} try { kmAracIzgaraCiz(); } catch (e) {} }

function kmDersPaneliAc() {
    kmDpCss();
    let kap = document.getElementById('km-dp');
    if (!kap) { kap = document.createElement('div'); kap.id = 'km-dp'; kap.className = 'km-dp-arka'; kap.addEventListener('click', function (e) { if (e.target === kap) kmDpKapat(); }); document.body.appendChild(kap); document.addEventListener('keydown', kmDpTus, true); }
    if (document.getElementById('yz-tv')) kap.style.zIndex = '33600'; // Yarışma TV'si açıksa onun üstünde
    _kmDp.ara = ''; kmDpCiz(true);
    clearInterval(_kmDp.poll);
    _kmDp.poll = setInterval(function () { if (!document.getElementById('km-dp')) { clearInterval(_kmDp.poll); return; } let i = kmDpImza(); if (i !== _kmDp.imza && !document.activeElement.closest('#km-dp input')) kmDpCiz(); }, 3000);
}
function kmDpKapat() { let k = document.getElementById('km-dp'); if (k) k.remove(); clearInterval(_kmDp.poll); document.removeEventListener('keydown', kmDpTus, true); kmDpYan(); }
function kmDpTus(e) { if (e.key === 'Escape' && document.getElementById('km-dp') && getComputedStyle(document.getElementById('onay-modal')).display === 'none') { e.preventDefault(); kmDpKapat(); } }
function kmDpImza() { let t = bugunISO(); return JSON.stringify(_kmListe || []) + '|' + JSON.stringify(otomatikYoklamaDB[t] || {}) + '|' + (localStorage.getItem('dag_km_hat_' + kmDpKonum()) || '') + '|' + (localStorage.getItem(kmDpYuvaAnahtar()) || '') + '|' + (typeof yzAnahtar === 'function' ? (localStorage.getItem(yzAnahtar()) || '').length : 0); }
function kmDpKatla(x) { return String(x || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u'); }

function kmDpCiz(odak) {
    let kap = document.getElementById('km-dp'); if (!kap) return;
    _kmDp.imza = kmDpImza();
    let liste = (_kmListe || []).filter(function (k) { return turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]; }).slice().sort(function (a, b) { return a.ad.localeCompare(b.ad, 'tr'); });
    let say = { geldi: 0, gelmedi: 0, bos: 0, yarisma: 0, oyun: 0 };
    liste.forEach(function (k) { let y = kmDpYoklama(k); say[y || 'bos']++; say[kmDpHat(k)]++; });
    let karma = say.yarisma > 0, tur = kmDpTur(), turK = tur ? tur.katilimci : [];
    let konum = (typeof _kmKonumlar !== 'undefined' && _kmKonumlar || []).find(function (k) { return k.id === kmDpKonum(); });
    let slot = null; try { slot = typeof kmDersSlot === 'function' ? kmDersSlot() : null; } catch (e) {}
    let dk = typeof _kmBaslangicZamani !== 'undefined' && _kmBaslangicZamani ? Math.floor((Date.now() - _kmBaslangicZamani) / 60000) : 0;
    let q = kmDpKatla(_kmDp.ara.trim());
    let gorunen = q ? liste.filter(function (k) { return kmDpKatla(k.ad).indexOf(q) !== -1; }) : liste;
    let lig = function (g) { return typeof LIG_ETIKET !== 'undefined' && LIG_ETIKET[g] ? LIG_ETIKET[g] : g; };
    let satirlar = gorunen.map(function (k) {
        let kEnc = encodeURIComponent(k.g + '|' + k.ad), gE = encodeURIComponent(k.g), aE = encodeURIComponent(k.ad).replace(/'/g, '%27'), kE = kEnc.replace(/'/g, '%27');
        let y = kmDpYoklama(k), hat = kmDpHat(k), yas = kmDpYas(k), bs = kmDpBugunSeri(k), turda = turK.indexOf(k.g + '|' + k.ad) !== -1;
        let seg = function (aktif, deger, yazi, cls, fn) { return '<button class="' + (aktif ? 'aktif ' + cls : '') + '" onclick="' + fn + '" aria-pressed="' + (aktif ? 'true' : 'false') + '">' + yazi + '</button>'; };
        return '<div class="km-dp-sat' + (y === 'gelmedi' ? ' gelmedi' : '') + '">'
            + '<div class="km-dp-kim"><b>' + esc(k.ad) + '</b><small>' + esc(lig(k.g)) + (yas != null ? ' · ' + yas + ' yaş' : '') + (bs.n ? ' · bugün ' + bs.n + ' seri · ' + bs.puan + ' p' : ' · bugün seri yok') + '</small></div>'
            + '<div class="km-dp-seg yok">' + seg(y === 'geldi', 'geldi', '✓ Geldi', 'yesil', 'kmDpYoklamaYaz(\'' + gE + '\',\'' + aE + '\',' + (y === 'geldi' ? 'null' : '\'geldi\'') + ')') + seg(y === 'gelmedi', 'gelmedi', '✕ Yok', 'kirmizi', 'kmDpYoklamaYaz(\'' + gE + '\',\'' + aE + '\',' + (y === 'gelmedi' ? 'null' : '\'gelmedi\'') + ')') + '</div>'
            + '<div class="km-dp-seg hat">' + seg(hat === 'oyun', 'oyun', '🎮 Oyun', 'mavi', 'kmDpHatYaz(\'' + kE + '\',\'oyun\')') + seg(hat === 'yarisma', 'yarisma', '🏆 Yarışma', 'turuncu', 'kmDpHatYaz(\'' + kE + '\',\'yarisma\')') + '</div>'
            + '<div class="km-dp-ek">' + (hat === 'yarisma' ? '<label title="Yarışmadayken Yumurta Yuvası\'nda da oynasın (yarışma serileri yumurtasını ısıtır)"><input type="checkbox"' + (kmDpYuvada(k) ? ' checked' : '') + ' onchange="kmDpYuvaYaz(\'' + kE + '\', this.checked)"> 🥚 Yumurtada da</label>' : '')
            + (tur && hat === 'yarisma' ? (turda ? '<span class="km-dp-rozet">turda · ' + esc((tur.hedefler || {})[k.g + '|' + k.ad] || '') + '</span>' : '<button class="km-dp-mini" onclick="kmDpTuraEkle(\'' + kE + '\')">+ Tura ekle</button>') : '') + '</div>'
            + '<button class="km-dp-cik" onclick="kmDpCikar(\'' + kE + '\')" title="Dersten çıkar" aria-label="' + esc(k.ad) + ' dersten çıkar">✕</button>'
            + '</div>';
    }).join('');
    let isler = '<div class="km-dp-isler">'
        + '<button class="km-dp-is ana" onclick="kmDpKapat(); kmSporcuEkle()">➕ Sporcu ekle</button>'
        + '<button class="km-dp-is" onclick="kmDpHepsiGeldi()"' + (say.bos ? '' : ' disabled') + '>✅ İşaretsizler geldi (' + say.bos + ')</button>'
        + '<button class="km-dp-is" onclick="kmHatToplu(\'yas\'); kmDpYan(); kmDpCiz()" title="12 yaş ve üstü Yarışma, küçükler Oyun">🔀 Yaşa göre hatlar</button>'
        + '<button class="km-dp-is" onclick="kmDpGit(\'yarisma\')">🏆 Yarışma' + (tur ? ' <small>tur sürüyor</small>' : '') + '</button>'
        + '<button class="km-dp-is" onclick="kmDpGit(\'oyunlar\')">🎮 Oyunlar</button>'
        + '<button class="km-dp-is" onclick="kmDpGit(\'yuva\')">🥚 Yumurta</button>'
        + '<button class="km-dp-is" onclick="kmDpGit(\'yoklamaanaliz\')">📊 Yoklama</button>'
        + '<button class="km-dp-is tehlike" onclick="kmDpKapat(); kmDersiBitir()">🏁 Dersi bitir</button>'
        + '</div>';
    kap.innerHTML = '<div class="km-dp" role="dialog" aria-modal="true" aria-label="Ders paneli">'
        + '<div class="km-dp-bas"><div><div class="km-dp-baslik">🧭 Ders Paneli</div><div class="km-dp-alt">' + esc(konum ? konum.ad : 'Ana Salon') + (slot && slot.grup ? ' · ' + esc(slot.grup) + (slot.bas ? ' ' + esc(slot.bas) : '') : '') + ' · ' + dk + ' dk</div></div><button class="km-dp-kapat" onclick="kmDpKapat()" aria-label="Kapat">✕</button></div>'
        + '<div class="km-dp-ozet"><span><b>' + liste.length + '</b>sporcu</span><span class="yesil"><b>' + say.geldi + '</b>geldi</span><span class="kirmizi"><b>' + say.gelmedi + '</b>yok</span><span><b>' + say.bos + '</b>işaretsiz</span>'
        + (karma ? '<span class="mavi"><b>' + say.oyun + '</b>🎮 oyun</span><span class="turuncu"><b>' + say.yarisma + '</b>🏆 yarışma</span>' : '<span><b>—</b>hat yok (herkes ikisini de görür)</span>') + '</div>'
        + isler
        + (tur ? '<div class="km-dp-tur">🎯 Yarışma turu sürüyor · seri ' + (Math.min(tur.seri, (typeof yzFormat === 'function' ? yzFormat(tur).seri : 99) - 1) + 1) + ' · turda ' + tur.katilimci.length + ' sporcu</div>' : '')
        + '<input class="km-dp-ara" id="km-dp-ara" type="search" placeholder="Sporcu ara…" value="' + esc(_kmDp.ara) + '" oninput="_kmDp.ara=this.value; kmDpCiz(true)">'
        + '<div class="km-dp-liste">' + (satirlar || '<div class="km-dp-bos">' + (liste.length ? 'Bu isimde sporcu yok.' : 'Derste henüz kimse yok — ➕ Sporcu ekle.') + '</div>') + '</div>'
        + '<div class="km-dp-not">Yoklama: skor girilen sporcu kendiliğinden "geldi" olur. Hat: 🏆 Yarışma\'dakiler Oyunlar\'da görünmez (🥚 kutusu işaretliyse Yumurta\'da da oynar). ✕ yalnız bugünkü dersten çıkarır.</div>'
        + '</div>';
    if (odak) { let a = document.getElementById('km-dp-ara'); if (a && _kmDp.ara) { a.focus(); try { a.setSelectionRange(a.value.length, a.value.length); } catch (e) {} } }
}
function kmDpCss() {
    if (document.getElementById('km-dp-css')) return;
    let st = document.createElement('style'); st.id = 'km-dp-css';
    st.textContent = '.km-dp-arka{position:fixed;inset:0;z-index:26500;background:rgba(8,3,1,.72);display:flex;align-items:flex-start;justify-content:center;padding:12px;overflow:auto;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}'
        + '.km-dp{width:min(980px,100%);background:linear-gradient(180deg,#2A1208,#170803);color:#FFF1E6;border-radius:20px;box-shadow:0 30px 80px rgba(0,0,0,.6),inset 0 0 0 1.5px rgba(253,142,1,.3);padding:16px;display:grid;gap:12px;font-family:inherit}'
        + '.km-dp-bas{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.km-dp-baslik{font-size:22px;font-weight:900;letter-spacing:-.01em}.km-dp-alt{font-size:12.5px;color:#D6A88A;font-weight:700;margin-top:2px}'
        + '.km-dp-kapat{min-width:44px;min-height:44px;border-radius:12px;border:1px solid rgba(253,142,1,.35);background:transparent;color:#FFF1E6;font-size:18px;cursor:pointer}'
        + '.km-dp-ozet{display:flex;flex-wrap:wrap;gap:6px}.km-dp-ozet span{display:flex;align-items:baseline;gap:5px;padding:6px 12px;border-radius:999px;background:rgba(255,241,230,.07);font-size:12px;font-weight:700;color:#D6A88A}.km-dp-ozet b{font-size:18px;color:#FFF1E6;font-variant-numeric:tabular-nums}'
        + '.km-dp-ozet .yesil b{color:#4ade80}.km-dp-ozet .kirmizi b{color:#f87171}.km-dp-ozet .mavi b{color:#60a5fa}.km-dp-ozet .turuncu b{color:#FD8E01}'
        + '.km-dp-isler{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}'
        + '.km-dp-is{min-height:48px;border-radius:14px;border:1px solid rgba(253,142,1,.3);background:rgba(255,241,230,.06);color:#FFF1E6;font:inherit;font-weight:800;font-size:14px;cursor:pointer;padding:8px 10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}'
        + '.km-dp-is small{font-size:10.5px;color:#FD8E01;font-weight:800}.km-dp-is:hover:not(:disabled){border-color:#FD8E01}.km-dp-is:disabled{opacity:.45;cursor:default}'
        + '.km-dp-is.ana{background:linear-gradient(180deg,#FD8E01,#FC5B01);color:#1A0700;border-color:#FD8E01}.km-dp-is.tehlike{border-color:rgba(248,113,113,.5);color:#fca5a5}'
        + '.km-dp-tur{padding:8px 12px;border-radius:12px;background:rgba(215,50,4,.22);border:1px solid rgba(253,142,1,.45);font-weight:800;font-size:13px}'
        + '.km-dp-ara{width:100%;box-sizing:border-box;min-height:44px;border-radius:12px;border:1px solid rgba(253,142,1,.3);background:rgba(0,0,0,.25);color:#FFF1E6;padding:8px 12px;font:inherit;font-size:15px}'
        + '.km-dp-liste{display:grid;gap:6px}'
        + '.km-dp-sat{display:grid;grid-template-columns:minmax(150px,1.4fr) auto auto minmax(110px,1fr) 40px;gap:8px;align-items:center;padding:8px 10px;border-radius:14px;background:rgba(255,241,230,.05);border:1px solid rgba(253,142,1,.14)}'
        + '.km-dp-sat.gelmedi{opacity:.6}.km-dp-kim{min-width:0}.km-dp-kim b{display:block;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.km-dp-kim small{display:block;font-size:11.5px;color:#D6A88A;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
        + '.km-dp-seg{display:inline-flex;border-radius:12px;overflow:hidden;border:1px solid rgba(255,241,230,.15)}.km-dp-seg button{min-height:40px;padding:0 12px;border:0;background:transparent;color:#D6A88A;font:inherit;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap}'
        + '.km-dp-seg button+button{border-left:1px solid rgba(255,241,230,.12)}.km-dp-seg button.aktif.yesil{background:#16a34a;color:#fff}.km-dp-seg button.aktif.kirmizi{background:#dc2626;color:#fff}.km-dp-seg button.aktif.mavi{background:#2563eb;color:#fff}.km-dp-seg button.aktif.turuncu{background:#FC5B01;color:#1A0700}'
        + '.km-dp-ek{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700}.km-dp-ek label{display:flex;align-items:center;gap:6px;cursor:pointer}.km-dp-ek input{width:18px;height:18px;accent-color:#FD8E01}'
        + '.km-dp-rozet{align-self:flex-start;padding:2px 8px;border-radius:999px;background:rgba(253,142,1,.18);color:#FD8E01;font-size:11px;font-weight:900}'
        + '.km-dp-mini{align-self:flex-start;min-height:30px;padding:0 10px;border-radius:10px;border:1px solid #FD8E01;background:transparent;color:#FD8E01;font:inherit;font-size:12px;font-weight:800;cursor:pointer}'
        + '.km-dp-cik{min-width:40px;min-height:40px;border-radius:12px;border:1px solid rgba(248,113,113,.35);background:transparent;color:#fca5a5;font-size:15px;cursor:pointer}'
        + '.km-dp-bos{padding:18px;text-align:center;color:#D6A88A;font-weight:700}.km-dp-not{font-size:11.5px;color:#B98A6E;line-height:1.45}'
        + '.km-dp button:focus-visible,.km-dp input:focus-visible{outline:2px solid #FD8E01;outline-offset:2px}'
        + '@media (max-width:760px){.km-dp-sat{grid-template-columns:1fr 40px;}.km-dp-kim{grid-column:1}.km-dp-cik{grid-column:2;grid-row:1}.km-dp-seg,.km-dp-ek{grid-column:1 / -1}.km-dp-seg{display:flex}.km-dp-seg button{flex:1}}';
    document.head.appendChild(st);
}
window.kmDersPaneliAc = kmDersPaneliAc;
