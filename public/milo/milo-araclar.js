/* ================================================================================================
   📊 MILO ARAÇLARI (2026-09-29) — Dağ'daki Yoklama analizi / eğitmen yoklaması / çift kayıt / misafir takibi /
   veli rapor linkinin Milo karşılıkları. Milo sunucu-öncelikli çalışır (yerel senkron yok): her ekran veriyi
   /api/milo/* üzerinden okur, yazmalar doğrudan sunucuya gider. Milo yoklaması iki durumludur (geldi/gelmedi).
   Kişi türleri, eğitmen ders yoklaması ve bekleme gibi ek veriler girişli /api/milo/meta/:key deposunda.
   ================================================================================================ */
const MA_GUN = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const MA_GUN_KISA = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
let MA = { alt: 'ders', mod: 'hafta', hafta: 0, ay: 0, gun: null, filtre: 'hepsi', ara: '', ekran: null, uyeler: [], att: {}, slotlar: [], personel: [], tur: {}, egDers: {}, yuklendi: false, rapor: {}, ciftAra: '', secili: [], hedef: null, duzenle: null, misForm: false, mesajAcik: false, not: {} };

// ---------------------------------------------------------------- yardımcılar
function maIso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function maBugun() { return maIso(new Date()); }
function maHaftaGunleri(o) { let d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7 + o * 7); return Array.from({ length: 7 }, (_, i) => { let x = new Date(d); x.setDate(d.getDate() + i); return x; }); }
function maAyGunleri(o) { let b = new Date(); b.setHours(12, 0, 0, 0); b.setDate(1); b.setMonth(b.getMonth() + o); let out = [], d = new Date(b); while (d.getMonth() === b.getMonth()) { out.push(new Date(d)); d.setDate(d.getDate() + 1); } return out; }
function maTarih(iso) { return iso ? new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : '—'; }
function maDk(s) { let p = String(s || '0:0').split(':'); return (+p[0]) * 60 + (+p[1] || 0); }
function maKey(g, ad) { return encodeURIComponent(g + '|' + ad).replace(/'/g, '%27'); }
function maCoz(k) { let [g, ...r] = decodeURIComponent(k).split('|'); return { g, ad: r.join('|') }; }
function maIlk(ad) { return String(ad || '?').trim().split(/\s+/).map(x => x[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR'); }
function maTel(t) { let r = String(t || '').replace(/\D/g, ''); if (!r) return ''; if (r.startsWith('90')) return r; if (r.startsWith('0')) return '90' + r.slice(1); return '90' + r; }
function maWa(tel, msg) { let n = maTel(tel); window.open((n ? `https://api.whatsapp.com/send?phone=${n}&text=` : 'https://api.whatsapp.com/send?text=') + encodeURIComponent(msg), '_blank'); }
function maIlkAd(ad) { let i = String(ad).split(' ')[0]; return i.charAt(0) + i.slice(1).toLocaleLowerCase('tr-TR'); }
function maSlotGunler(s) { return (s.gunler && s.gunler.length ? s.gunler : [s.gun]).map(Number); }
function maIptal(s, iso) { return (s.istisnalar || []).some(i => i.tarih === iso); }
function maUye(g, ad) { return MA.uyeler.find(u => u.grup === g && u.ad === ad); }
function maAktifler() { return MA.uyeler.filter(u => !u.pasif); }
function maSlotUyeler(s) { return (s.katilimcilar || []).map(k => maUye(k.grup, k.ad)).filter(u => u && !u.pasif); }
function maTur(u) { let t = MA.tur[u.grup + '|' + u.ad]; return t && t.tur === 'misafir' ? 'misafir' : 'sporcu'; }
function maDurum(u, iso) { let r = (MA.att[iso] || {})[u.ad]; if (!r) return null; if (r.grup && r.grup !== u.grup && MA.uyeler.some(x => x.grup === r.grup && x.ad === u.ad)) return null; return r.geldi ? 'g' : 'y'; }
function maSonGelis(u) { let t = Object.keys(MA.att).filter(i => maDurum(u, i) === 'g').sort(); return t[t.length - 1] || null; }
async function maMeta(key) { try { let r = await miloApi('/meta/' + key); return r && r.value ? JSON.parse(r.value) : {}; } catch (e) { return {}; } }
// meta: kayıt başına son yazan kazanır (t); PUT öncesi sunucudakiyle birleştir
async function maMetaYaz(key, yerel) {
    let uzak = await maMeta(key), m = Object.assign({}, uzak);
    Object.keys(yerel).forEach(k => { if (!m[k] || (yerel[k].t || 0) >= (m[k].t || 0)) m[k] = yerel[k]; });
    await miloApi('/meta/' + key, { method: 'PUT', body: JSON.stringify({ value: JSON.stringify(m) }) });
    return m;
}
async function maYukle(zorla) {
    if (MA.yuklendi && !zorla) return;
    let [u, a, p, per, tur, eg] = await Promise.all([miloApi('/members'), miloApi('/attendance/auto'), miloApi('/antrenman-programi'), miloApi('/personnel'), maMeta('kisi_turleri'), maMeta('egitmen_ders_yoklama')]);
    MA.uyeler = u.members || []; MA.slotlar = p.slots || []; MA.personel = per.personnel || []; MA.tur = tur; MA.egDers = eg;
    MA.att = {}; (a.attendance || []).forEach(r => { (MA.att[r.tarih] = MA.att[r.tarih] || {})[r.ad] = { geldi: r.geldi !== 0 && r.geldi !== false, saat: r.saat, grup: r.grup }; });
    try { miloUyeler = MA.uyeler; } catch (e) {}
    MA.yuklendi = true;
}

// ---------------------------------------------------------------- stil
function maCss() {
    if (document.getElementById('ma-css')) return;
    let st = document.createElement('style'); st.id = 'ma-css';
    st.textContent = `
.ma { display:flex; flex-direction:column; gap:12px; color:var(--milo-ink); }
.ma-ust { display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; }
.ma-baslik { font-size:19px; font-weight:900; }
.ma-alt { font-size:12px; color:var(--milo-ink-dim); line-height:1.45; }
.ma-seg { display:flex; gap:4px; padding:3px; border-radius:12px; background:var(--milo-card); }
.ma-seg button { flex:1; min-height:38px; padding:0 12px; border:none; border-radius:9px; background:none; color:var(--milo-ink-dim); font-weight:800; font-size:12.5px; cursor:pointer; font-family:inherit; }
.ma-seg button.aktif { background:var(--milo-teal); color:#fff; }
.ma-nav { display:flex; align-items:center; gap:6px; }
.ma-nav button { width:40px; height:40px; border-radius:11px; border:none; background:var(--milo-card); color:var(--milo-ink); font-weight:900; font-size:17px; cursor:pointer; }
.ma-nav button:disabled { opacity:.3; }
.ma-nav span { min-width:120px; text-align:center; font-weight:800; font-size:13px; }
.ma-nav small { display:block; color:var(--milo-ink-dim); font-weight:600; font-size:11px; }
.ma-gunler { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:5px; }
.ma-gunler button { display:flex; flex-direction:column; align-items:center; padding:7px 2px; border-radius:12px; border:1.5px solid var(--milo-line); background:var(--milo-card); color:var(--milo-ink); cursor:pointer; font-family:inherit; }
.ma-gunler button b { font-size:12px; } .ma-gunler button span { font-size:16px; font-weight:900; } .ma-gunler button em { font-style:normal; font-size:10px; color:var(--milo-ink-dim); }
.ma-gunler button.aktif { background:var(--milo-teal); border-color:var(--milo-teal); color:#fff; } .ma-gunler button.aktif em { color:#fff; }
.ma-gunler button.bugun { border-color:var(--milo-sun); }
.ma-kart { background:var(--milo-card); border-radius:18px; padding:14px; display:flex; flex-direction:column; gap:10px; box-shadow:0 4px 14px rgba(0,0,0,.3); }
.ma-kart.simdi { box-shadow:0 0 0 2px var(--milo-teal); }
.ma-dbas { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.ma-saat { font-weight:900; font-size:18px; background:var(--milo-card-raised); border-radius:12px; padding:6px 10px; text-align:center; line-height:1.1; }
.ma-saat small { display:block; font-size:10.5px; color:var(--milo-ink-dim); font-weight:700; }
.ma-dad { font-weight:900; font-size:16px; flex:1; min-width:0; }
.ma-say { font-size:12px; color:var(--milo-ink-dim); font-weight:700; } .ma-say b { font-size:18px; color:var(--milo-teal); }
.ma-kisiler { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:6px; }
.ma-kisi { display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:9px; align-items:center; padding:7px 8px 7px 10px; border-radius:12px; background:var(--milo-card-raised); }
.ma-kisi.g { box-shadow:inset 3px 0 0 var(--milo-teal); } .ma-kisi.y { box-shadow:inset 3px 0 0 var(--milo-coral); }
.ma-av { width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:12px; color:#fff; background:var(--milo-grape); flex-shrink:0; }
.ma-kisi b { display:block; font-size:13.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ma-kisi small { font-size:11px; color:var(--milo-ink-dim); }
.ma-sec { display:flex; gap:4px; }
.ma-sec button, .ma-btn { min-height:36px; padding:0 11px; border-radius:10px; border:1.5px solid var(--milo-line); background:var(--milo-card); color:var(--milo-ink); font-weight:800; font-size:12px; cursor:pointer; white-space:nowrap; font-family:inherit; }
.ma-sec button.g.aktif { background:var(--milo-teal); border-color:var(--milo-teal); color:#fff; }
.ma-sec button.y.aktif { background:var(--milo-coral); border-color:var(--milo-coral); color:#fff; }
.ma-btn.ana { background:var(--milo-teal); border-color:var(--milo-teal); color:#fff; } .ma-btn.coral { background:var(--milo-coral); border-color:var(--milo-coral); color:#fff; }
.ma-eg { display:flex; gap:6px; flex-wrap:wrap; align-items:center; padding:8px 10px; border-radius:12px; background:var(--milo-card-raised); }
.ma-eg span { font-size:11.5px; font-weight:800; color:var(--milo-ink-dim); }
.ma-eg button { min-height:32px; padding:0 12px; border-radius:999px; border:1.5px solid var(--milo-line); background:var(--milo-card); color:var(--milo-ink); font-weight:800; font-size:12.5px; cursor:pointer; font-family:inherit; }
.ma-eg button.on { background:var(--milo-grape); border-color:var(--milo-grape); color:#fff; }
.ma-tablo { display:flex; flex-direction:column; gap:6px; }
.ma-satir { display:grid; grid-template-columns:minmax(140px,1.2fr) minmax(0,1.6fr) 110px 90px; gap:10px; align-items:center; padding:9px 10px; border-radius:12px; background:var(--milo-card-raised); border:none; color:var(--milo-ink); text-align:left; font-family:inherit; cursor:pointer; }
.ma-satir b { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.ma-cip { display:inline-block; padding:2px 8px; border-radius:8px; font-size:11px; font-weight:700; background:var(--milo-card); border:1px solid var(--milo-line); margin:1px; }
.ma-durum { font-size:12px; font-weight:800; } .ma-durum.g { color:var(--milo-teal); } .ma-durum.y { color:var(--milo-coral); }
.ma-sayilar { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; }
.ma-sayi { background:var(--milo-card); border-radius:14px; padding:12px; } .ma-sayi small { display:block; font-size:11px; color:var(--milo-ink-dim); font-weight:700; } .ma-sayi b { font-size:26px; font-weight:900; } .ma-sayi span { font-size:11px; color:var(--milo-ink-dim); }
.ma-bar { height:8px; border-radius:4px; background:var(--milo-card-raised); overflow:hidden; } .ma-bar i { display:block; height:100%; border-radius:4px; }
.ma-grafik { display:flex; align-items:flex-end; gap:3px; height:120px; padding-top:16px; }
.ma-grafik div { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; gap:3px; cursor:pointer; }
.ma-grafik i { width:100%; max-width:34px; background:var(--milo-teal); border-radius:5px 5px 2px 2px; position:relative; min-height:3px; }
.ma-grafik em { font-style:normal; font-size:10px; font-weight:900; } .ma-grafik small { font-size:9.5px; color:var(--milo-ink-dim); }
.ma-takvim { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:4px; }
.ma-takvim .b { text-align:center; font-size:11px; font-weight:800; color:var(--milo-ink-dim); }
.ma-hucre { min-height:56px; border-radius:10px; border:1px solid var(--milo-line); background:var(--milo-card); padding:5px; display:flex; flex-direction:column; gap:1px; color:var(--milo-ink); cursor:pointer; text-align:left; font-family:inherit; }
.ma-hucre b { font-size:13px; } .ma-hucre span { font-size:11px; font-weight:800; } .ma-hucre small { font-size:10px; color:var(--milo-ink-dim); }
.ma-hucre.bugun { box-shadow:0 0 0 2px var(--milo-sun); } .ma-hucre.bos { visibility:hidden; }
.ma-ara { width:100%; box-sizing:border-box; min-height:44px; padding:0 14px; border-radius:12px; border:1.5px solid var(--milo-line); background:var(--milo-card-raised); color:var(--milo-ink); font-size:14px; font-family:inherit; }
.ma-form { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:8px; }
.ma-form input, .ma-form select, .ma-form textarea { min-height:42px; padding:0 12px; border-radius:11px; border:1.5px solid var(--milo-line); background:var(--milo-card-raised); color:var(--milo-ink); font-size:14px; font-family:inherit; box-sizing:border-box; width:100%; }
.ma-form textarea { grid-column:1/-1; min-height:56px; padding:10px 12px; }
@media (max-width:640px) { .ma-satir { grid-template-columns:minmax(0,1fr) auto; } .ma-satir .ders, .ma-satir .son { grid-column:1/-1; } .ma-kisiler { grid-template-columns:1fr; } .ma-hucre small { display:none; } }
`;
    document.head.appendChild(st);
}

// ---------------------------------------------------------------- 📊 ANALİZ SEKMESİ
async function maAnalizAc() {
    maCss();
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    if (!MA.yuklendi) { alan.innerHTML = '<div class="ma-alt">Yükleniyor…</div>'; try { await maYukle(); } catch (e) { alan.innerHTML = '<div class="ma-alt">Veri yüklenemedi — bağlantıyı kontrol et.</div>'; return; } }
    maCiz();
}
function maDonem() {
    let ay = MA.mod === 'ay', gunler = ay ? maAyGunleri(MA.ay) : maHaftaGunleri(MA.hafta);
    let yazi = ay ? (MA.ay === 0 ? 'Bu ay' : MA.ay === -1 ? 'Geçen ay' : Math.abs(MA.ay) + ' ay önce') : (MA.hafta === 0 ? 'Bu hafta' : MA.hafta === -1 ? 'Geçen hafta' : Math.abs(MA.hafta) + ' hafta önce');
    let alt = ay ? gunler[0].toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : maTarih(maIso(gunler[0])) + ' – ' + maTarih(maIso(gunler[6]));
    return { ay, gunler, isoler: gunler.map(maIso), yazi, alt };
}
function maCiz() {
    let alan = document.getElementById('milo-icerik'); if (!alan) return;
    if (MA.ekran === 'cift') return maCiftCiz();
    if (MA.ekran === 'misafir') return maMisafirCiz();
    let D = maDonem(), seg = (v, id, ad) => `<button class="${v === id ? 'aktif' : ''}" onclick="${ad}">`;
    let govde = MA.alt === 'sporcu' ? maSporcuHTML(D) : MA.alt === 'sayilar' ? maSayilarHTML(D) : D.ay ? maAyTakvimHTML(D) : maDerslerHTML();
    alan.innerHTML = `<div class="ma">
        <div class="ma-ust"><div><div class="ma-baslik">📋 Yoklama</div><div class="ma-alt">Hangi derste kim var, kim geldi, kim gelmedi.</div></div>
            <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap"><div class="ma-seg">${seg(MA.mod, 'hafta', "MA.mod='hafta'; maCiz()")}Hafta</button>${seg(MA.mod, 'ay', "MA.mod='ay'; maCiz()")}Ay</button></div>
            <div class="ma-nav"><button onclick="maKaydir(-1)" aria-label="Önceki">‹</button><span>${D.yazi}<small>${D.alt}</small></span><button onclick="maKaydir(1)" aria-label="Sonraki" ${(D.ay ? MA.ay : MA.hafta) >= 0 ? 'disabled' : ''}>›</button></div></div></div>
        <div class="ma-seg">${seg(MA.alt, 'ders', "MA.alt='ders'; maCiz()")}📅 Dersler</button>${seg(MA.alt, 'sporcu', "MA.alt='sporcu'; maCiz()")}👥 Sporcular</button>${seg(MA.alt, 'sayilar', "MA.alt='sayilar'; maCiz()")}📊 Sayılar</button></div>
        ${govde}</div>`;
}
function maKaydir(f) { if (MA.mod === 'ay') MA.ay = Math.min(0, Math.max(-12, MA.ay + f)); else { MA.hafta = Math.min(0, Math.max(-26, MA.hafta + f)); MA.gun = null; } maCiz(); }
function maGunAc(iso) {
    let d = new Date(iso + 'T12:00:00'), pzt = new Date(d); pzt.setDate(d.getDate() - (d.getDay() + 6) % 7);
    MA.mod = 'hafta'; MA.hafta = Math.max(-26, Math.min(0, Math.round((pzt - maHaftaGunleri(0)[0]) / (7 * 86400000)))); MA.gun = (d.getDay() + 6) % 7; MA.alt = 'ders'; maCiz();
}
// ---- Dersler (hafta): gün seç → dersler, kayıtlılar, geldi/gelmedi, eğitmen, gelmeyenlere mesaj
function maDerslerHTML() {
    let gunler = maHaftaGunleri(MA.hafta), isoler = gunler.map(maIso), bugun = maBugun();
    if (MA.gun === null) { let i = isoler.indexOf(bugun); MA.gun = i >= 0 ? i : 0; }
    let d = gunler[MA.gun], iso = isoler[MA.gun], gd = d.getDay(), dk = new Date().getHours() * 60 + new Date().getMinutes();
    let cip = gunler.map((g, i) => `<button class="${MA.gun === i ? 'aktif' : ''}${isoler[i] === bugun ? ' bugun' : ''}" onclick="MA.gun=${i}; maCiz()"><b>${MA_GUN_KISA[g.getDay()]}</b><span>${g.getDate()}</span><em>${MA.slotlar.filter(s => maSlotGunler(s).includes(g.getDay())).length || '—'} ders</em></button>`).join('');
    let dersler = MA.slotlar.filter(s => maSlotGunler(s).includes(gd)).sort((a, b) => maDk(a.baslangicSaat) - maDk(b.baslangicSaat));
    let kayitliTum = [], gelmeyen = [];
    let kartlar = dersler.map(s => {
        let uy = maSlotUyeler(s); kayitliTum.push(...uy);
        let iptal = maIptal(s, iso), simdi = iso === bugun && dk >= maDk(s.baslangicSaat) && dk < maDk(s.bitisSaat), alinir = !iptal && iso <= bugun;
        let gel = uy.filter(u => maDurum(u, iso) === 'g').length, yok = uy.filter(u => maDurum(u, iso) === 'y').length;
        if (alinir && !(iso === bugun && dk < maDk(s.baslangicSaat))) uy.forEach(u => { if (maDurum(u, iso) !== 'g' && !gelmeyen.some(x => x.u === u)) gelmeyen.push({ u, s }); });
        let isaretsiz = uy.filter(u => !maDurum(u, iso));
        return `<div class="ma-kart${simdi ? ' simdi' : ''}">
            <div class="ma-dbas"><div class="ma-saat">${s.baslangicSaat}<small>${s.bitisSaat}</small></div><div class="ma-dad">${miloEsc(s.grup || 'Ders')}${simdi ? ' · <span style="color:var(--milo-teal)">ŞU AN</span>' : ''}${s.dersPlani ? `<div class="ma-alt">📝 ${miloEsc(s.dersPlani)}</div>` : ''}</div>
                ${iptal ? '<span class="ma-durum y">İptal</span>' : !uy.length ? '' : iso > bugun ? `<span class="ma-say">${uy.length} kayıtlı${s.kapasite ? ' / ' + s.kapasite : ''}</span>` : `<span class="ma-say"><b>${gel}</b>/${uy.length} geldi${yok ? ' · ' + yok + ' gelmedi' : ''}</span>`}
                ${alinir && isaretsiz.length ? `<button class="ma-btn ana" onclick="maKalanlarGeldi(${s.id}, '${iso}')">✅ ${isaretsiz.length === uy.length ? 'Hepsi' : 'Kalanlar (' + isaretsiz.length + ')'} geldi</button>` : ''}</div>
            ${alinir ? maEgitmenHTML(s.id, iso) : ''}
            ${uy.length ? `<div class="ma-kisiler">${uy.sort((a, b) => a.ad.localeCompare(b.ad, 'tr')).map(u => maKisiHTML(u, iso, alinir)).join('')}</div>` : '<div class="ma-alt">Bu derse kayıtlı üye yok — Program sekmesinden ekleyebilirsin.</div>'}</div>`;
    }).join('');
    let kayitsiz = maAktifler().filter(u => maDurum(u, iso) === 'g' && !kayitliTum.includes(u));
    let mesaj = gelmeyen.length ? `<div><button class="ma-btn" onclick="MA.mesajAcik=!MA.mesajAcik; maCiz()">💬 Gelmeyenlere veli mesajı (${gelmeyen.length}) ${MA.mesajAcik ? '▴' : '▾'}</button></div>
        ${MA.mesajAcik ? `<div class="ma-kart"><div class="ma-alt">WhatsApp'a dokununca veliye hazır mesaj açılır (telefon üye kartından).</div><div class="ma-kisiler">${gelmeyen.map(x => `<div class="ma-kisi"><span class="ma-av">${miloEsc(maIlk(x.u.ad))}</span><span style="min-width:0"><b>${miloEsc(x.u.ad)}</b><small>${miloEsc(x.s.baslangicSaat)} · ${x.u.acilTelefon ? '📞 ' + miloEsc(x.u.acilTelefon) : 'telefon yok'}</small></span><button class="ma-btn ana" onclick="maVeliMesaj('${maKey(x.u.grup, x.u.ad)}', '${iso}', ${x.s.id})">💬 WhatsApp</button></div>`).join('')}</div></div>` : ''}` : '';
    return `<div class="ma-gunler">${cip}</div><div class="ma-alt" style="font-weight:800; letter-spacing:.05em; text-transform:uppercase">${MA_GUN[gd]} ${maTarih(iso)}${iso === bugun ? ' · bugün' : ''}</div>
        ${iso <= bugun ? maNotHTML(iso) : ''}${mesaj}${kartlar || '<div class="ma-kart"><div class="ma-alt">Bu gün ders yok.</div></div>'}
        ${kayitsiz.length ? `<div class="ma-kart"><div class="ma-dad">Derse kayıtlı olmadan gelenler (${kayitsiz.length})</div><div class="ma-kisiler">${kayitsiz.map(u => maKisiHTML(u, iso, true)).join('')}</div></div>` : ''}`;
}
function maKisiHTML(u, iso, alinir) {
    let st = maDurum(u, iso), r = (MA.att[iso] || {})[u.ad], k = maKey(u.grup, u.ad), mis = maTur(u) === 'misafir';
    return `<div class="ma-kisi ${st || ''}"><span class="ma-av">${miloEsc(maIlk(u.ad))}</span><span style="min-width:0"><b>${miloEsc(u.ad)}</b><small>${miloEsc(u.grup)}${mis ? ' · 🎟️ Misafir' : ''}${st === 'g' && r && r.saat ? ' · ' + miloEsc(r.saat) : ''}</small></span>
        ${alinir ? `<span class="ma-sec"><button class="g${st === 'g' ? ' aktif' : ''}" onclick="maYoklama('${k}', '${iso}', true)">✅ Geldi</button><button class="y${st === 'y' ? ' aktif' : ''}" onclick="maYoklama('${k}', '${iso}', false)">❌ Gelmedi</button></span>` : ''}</div>`;
}
async function maYoklama(key, iso, geldi) {
    let k = maCoz(key), u = maUye(k.g, k.ad); if (!u) return;
    if (iso > maBugun()) return showToast('İleri bir tarihin yoklaması alınamaz.', 'error');
    let saat = iso === maBugun() ? new Date().toTimeString().slice(0, 5) : ((MA.att[iso] || {})[u.ad] || {}).saat || '00:00';
    try {
        await miloApi('/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: iso, ad: u.ad, grup: u.grup, saat, elle: true, geldi }) });
        (MA.att[iso] = MA.att[iso] || {})[u.ad] = { geldi, saat, grup: u.grup };
        maCiz();
    } catch (e) { showToast('Kaydedilemedi — bağlantıyı kontrol et.', 'error'); }
}
async function maKalanlarGeldi(slotId, iso) {
    let s = MA.slotlar.find(x => x.id === slotId); if (!s) return;
    let liste = maSlotUyeler(s).filter(u => !maDurum(u, iso));
    for (let u of liste) await maYoklama(maKey(u.grup, u.ad), iso, true);
    showToast(`${liste.length} üye geldi işaretlendi ✅`, 'success');
}
function maVeliMesaj(key, iso, slotId) {
    let k = maCoz(key), u = maUye(k.g, k.ad) || {}, s = MA.slotlar.find(x => x.id === slotId);
    let gunYazi = iso === maBugun() ? 'bugünkü' : new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }) + ' günkü';
    maWa(u.acilTelefon, `Merhaba${u.acilKisi ? ' ' + u.acilKisi : ''} 🌟 MILO FITT KIDS'ten yazıyoruz.\n\n${maIlkAd(k.ad)} ${gunYazi}${s ? ' ' + s.baslangicSaat : ''} dersimize katılamadı. Her şeyin yolunda olduğunu umuyoruz 🧡\n\nBir engel ya da sorunuz varsa bize buradan yazabilirsiniz.\nMILO FITT KIDS`);
}
// ---- eğitmen ders yoklaması (personel = eğitmen); meta egitmen_ders_yoklama {iso|slot|pid: {d, t}}
function maEgitmenHTML(slotId, iso) {
    if (!MA.personel.length) return '';
    return `<div class="ma-eg"><span>👔 Derse giren eğitmen</span>${MA.personel.map(p => { let on = (MA.egDers[iso + '|' + slotId + '|' + p.id] || {}).d === 1; return `<button class="${on ? 'on' : ''}" aria-pressed="${on}" onclick="maEgitmen('${iso}', ${slotId}, '${String(p.id).replace(/['"\\]/g, '')}')">${on ? '✓ ' : ''}${miloEsc(p.ad)}</button>`; }).join('')}</div>`;
}
async function maEgitmen(iso, slotId, pid) {
    let k = iso + '|' + slotId + '|' + pid, on = (MA.egDers[k] || {}).d === 1;
    MA.egDers[k] = { iso, slot: slotId, pid, d: on ? 0 : 1, t: Date.now() };
    maCiz();
    try { MA.egDers = await maMetaYaz('egitmen_ders_yoklama', { [k]: MA.egDers[k] }); if (!on) await miloApi('/attendance/personnel', { method: 'POST', body: JSON.stringify({ tarih: iso, personelId: pid, elle: true, geldi: true }) }).catch(() => {}); }
    catch (e) { showToast('Eğitmen kaydedilemedi.', 'error'); }
}
// ---- Dersler (ay): takvim
function maAyTakvimHTML(D) {
    let bugun = maBugun(), sayilan = maAktifler(), max = 1;
    let h = D.isoler.map((iso, i) => { let n = iso <= bugun ? sayilan.filter(u => maDurum(u, iso) === 'g').length : null; if (n > max) max = n; return { iso, d: D.gunler[i], n, ders: MA.slotlar.filter(s => maSlotGunler(s).includes(D.gunler[i].getDay()) && !maIptal(s, iso)).length }; });
    let bos = (D.gunler[0].getDay() + 6) % 7;
    return `<div class="ma-kart"><div class="ma-alt">Güne dokun — o günün dersleri ve yoklaması açılır.</div><div class="ma-takvim">${[1, 2, 3, 4, 5, 6, 0].map(g => `<span class="b">${MA_GUN_KISA[g]}</span>`).join('')}${'<span class="ma-hucre bos"></span>'.repeat(bos)}${h.map(x => `<button class="ma-hucre${x.iso === bugun ? ' bugun' : ''}" style="${x.n ? `background:color-mix(in srgb, var(--milo-teal) ${Math.round(12 + 50 * x.n / max)}%, var(--milo-card))` : ''}${x.iso > bugun ? ';opacity:.5' : ''}" onclick="maGunAc('${x.iso}')"><b>${x.d.getDate()}</b>${x.n !== null ? `<span>${x.n ? x.n + ' kişi' : '—'}</span>` : ''}<small>${x.ders ? x.ders + ' ders' : ''}</small></button>`).join('')}</div></div>`;
}
// ---- Sporcular
function maSporcuHTML(D) {
    let bugun = maBugun(), ara = MA.ara.toLocaleLowerCase('tr-TR'), iki = new Date(); iki.setDate(iki.getDate() - 14); let iki14 = maIso(iki);
    let liste = maAktifler().map(u => {
        let dersler = MA.slotlar.filter(s => (s.katilimcilar || []).some(k => k.grup === u.grup && k.ad === u.ad));
        let dg = 0, kt = 0; D.isoler.forEach(iso => { if (iso > bugun) return; let gd = new Date(iso + 'T12:00:00').getDay(); if (dersler.some(s => maSlotGunler(s).includes(gd) && !maIptal(s, iso))) { dg++; if (maDurum(u, iso) === 'g') kt++; } });
        return { u, dersler, gel: D.isoler.filter(i => maDurum(u, i) === 'g').length, son: maSonGelis(u), dg, kt };
    }).filter(x => (!ara || x.u.ad.toLocaleLowerCase('tr-TR').includes(ara)) && (MA.filtre === 'hepsi' || (MA.filtre === 'geldi' ? x.gel : MA.filtre === 'gelmedi' ? !x.gel : (!x.son || x.son < iki14))));
    let f = (id, ad) => `<button class="ma-btn${MA.filtre === id ? ' ana' : ''}" onclick="MA.filtre='${id}'; maCiz()">${ad}</button>`;
    let gruplar = [...new Set(liste.map(x => x.u.grup))].sort((a, b) => a.localeCompare(b, 'tr'));
    return `<div class="ma-kart"><input class="ma-ara" id="ma-ara" type="search" placeholder="🔍 Üye ara" value="${miloEsc(MA.ara)}" oninput="MA.ara=this.value; maCiz(); let e=document.getElementById('ma-ara'); e.focus(); e.setSelectionRange(e.value.length, e.value.length)">
        ${MA.filtre === 'uzun' ? maOzledikHTML(liste) : ''}
        <div style="display:flex; gap:6px; flex-wrap:wrap">${f('hepsi', 'Hepsi')}${f('geldi', '✓ ' + D.yazi + ' geldi')}${f('gelmedi', '✗ ' + D.yazi + ' gelmedi')}${f('uzun', '⏳ 2+ haftadır yok')}</div>
        ${gruplar.map(g => { let ic = liste.filter(x => x.u.grup === g).sort((a, b) => a.u.ad.localeCompare(b.u.ad, 'tr')); return `<div class="ma-dad" style="font-size:14px; margin-top:4px">${miloEsc(g)} <span class="ma-alt">${ic.length} kişi · ${ic.filter(x => x.gel).length} geldi</span></div><div class="ma-tablo">${ic.map(x => { let k = maKey(x.u.grup, x.u.ad);
            return `<button class="ma-satir" onclick="maRaporAc('${k}')"><b>${miloEsc(x.u.ad)}${maTur(x.u) === 'misafir' ? ' 🎟️' : ''}</b><span class="ders">${x.dersler.length ? x.dersler.map(s => `<span class="ma-cip">${maSlotGunler(s).map(g => MA_GUN_KISA[g]).join('·')} ${s.baslangicSaat}</span>`).join('') : '<span class="ma-alt">derse kayıtlı değil</span>'}</span><span class="ma-durum ${x.gel ? 'g' : 'y'}">${x.gel ? '✓ ' + x.gel + ' gün' : '✗ gelmedi'}${x.dg ? `<br><small class="ma-alt">${x.kt} / ${x.dg} derse</small>` : ''}</span><span class="son ma-alt">son: ${maTarih(x.son)}</span></button>${MA.rapor[k] ? maRaporPanelHTML(k) : ''}`; }).join('')}</div>`; }).join('') || '<div class="ma-alt">Bu filtrede üye yok.</div>'}
        <div class="ma-alt">Bir üyeye dokun → veliye aylık rapor linki.</div></div>`;
}
// ---- Günün notu (eski Yoklama sekmesinden taşındı, 2026-09-29) — /gunluk-not/:tarih, gün başına tek not
function maNotHTML(iso) {
    if (MA.not[iso] === undefined) { MA.not[iso] = null; miloApi('/gunluk-not/' + encodeURIComponent(iso)).then(r => { MA.not[iso] = (r && r.notMetin) || ''; if (MA.alt === 'ders' && !MA.ekran) maCiz(); }).catch(() => { delete MA.not[iso]; }); }
    if (MA.not[iso] === null) return '';
    return `<textarea class="ma-ara" id="ma-not" rows="2" placeholder="📝 Bu gün ne işlendi? (isteğe bağlı not)" onblur="maNotKaydet('${iso}', this.value)" style="min-height:48px; resize:vertical">${miloEsc(MA.not[iso])}</textarea>`;
}
async function maNotKaydet(iso, metin) {
    if ((MA.not[iso] || '') === metin) return;
    try { await miloApi('/gunluk-not/' + encodeURIComponent(iso), { method: 'PUT', body: JSON.stringify({ notMetin: metin || null }) }); MA.not[iso] = metin; showToast('✅ Not kaydedildi.', 'success'); }
    catch (e) { showToast('Not kaydedilemedi — bağlantıyı kontrol et.', 'error'); }
}
// ---- 2+ haftadır gelmeyenler → veliye "sizi özledik" mesajı (eski Devamsızlık Radarı, 2026-09-29)
function maOzledikHTML(liste) {
    if (!liste.length) return '';
    let bugun = new Date(maBugun() + 'T12:00:00');
    return `<div class="ma-kart" style="background:var(--milo-card-raised)"><div class="ma-alt"><b style="color:var(--milo-ink)">💬 Bir süredir gelmeyenler (${liste.length})</b> · WhatsApp'a dokununca veliye hazır "sizi özledik" mesajı açılır.</div><div class="ma-kisiler">${liste.map(x => { let gun = x.son ? Math.round((bugun - new Date(x.son + 'T12:00:00')) / 86400000) : null;
        return `<div class="ma-kisi"><span class="ma-av">${miloEsc(maIlk(x.u.ad))}</span><span style="min-width:0"><b>${miloEsc(x.u.ad)}</b><small>${gun === null ? 'hiç gelmedi' : gun + ' gündür yok'} · ${x.u.acilTelefon ? '📞 ' + miloEsc(x.u.acilTelefon) : 'telefon yok'}</small></span><button class="ma-btn ana" onclick="maOzledik('${maKey(x.u.grup, x.u.ad)}')">💬 WhatsApp</button></div>`; }).join('')}</div></div>`;
}
function maOzledik(key) { let k = maCoz(key), u = maUye(k.g, k.ad) || {}; maWa(u.acilTelefon, `Merhaba 🌟 MILO FITT KIDS'ten yazıyoruz.

${maIlkAd(k.ad)}'ı bir süredir antrenmanlarımızda göremedik, sizi özledik! Uygun olduğunuzda bize haber verirseniz seviniriz 🩷

Her zaman buradayız.
MILO FITT KIDS`); }
// ---- Sayılar: özet, günlük grafik, doluluk, eğitmen
function maSayilarHTML(D) {
    let bugun = maBugun(), akt = maAktifler(), gs = D.isoler.map(i => akt.filter(u => maDurum(u, i) === 'g').length), max = Math.max(1, ...gs);
    let gelen = akt.filter(u => D.isoler.some(i => maDurum(u, i) === 'g')).length;
    let son8 = []; for (let i = 0; i < 56; i++) { let d = new Date(); d.setDate(d.getDate() - i); son8.push(d); }
    let doluluk = MA.slotlar.map(s => { let uy = maSlotUyeler(s), gsl = maSlotGunler(s), yap = 0, gel = 0; son8.forEach(d => { let iso = maIso(d); if (!gsl.includes(d.getDay()) || maIptal(s, iso) || iso > bugun) return; yap++; gel += uy.filter(u => maDurum(u, iso) === 'g').length; }); return { s, n: uy.length, kap: Number(s.kapasite) || 0, ort: yap ? gel / yap : 0, yap }; }).sort((a, b) => (b.kap ? b.n / b.kap : 0) - (a.kap ? a.n / a.kap : 0));
    let eg = MA.personel.map(p => ({ p, n: Object.values(MA.egDers).filter(x => x.d === 1 && x.pid === p.id && D.isoler.includes(x.iso)).length }));
    return `<div class="ma-sayilar"><div class="ma-sayi"><small>Aktif üye</small><b>${akt.length}</b><span>${akt.filter(u => maTur(u) === 'misafir').length} misafir dahil</span></div>
        <div class="ma-sayi"><small>${D.yazi} gelen</small><b>${gelen}</b><span>%${akt.length ? Math.round(gelen / akt.length * 100) : 0}</span></div>
        <div class="ma-sayi"><small>${D.yazi} hiç gelmeyen</small><b>${akt.length - gelen}</b></div>
        <div class="ma-sayi"><small>Toplam giriş</small><b>${gs.reduce((a, b) => a + b, 0)}</b></div></div>
        <div class="ma-kart"><div class="ma-alt" style="font-weight:800">Günlere göre gelen — güne dokun</div><div class="ma-grafik">${D.gunler.map((d, i) => `<div onclick="maGunAc('${D.isoler[i]}')"><em>${D.isoler[i] <= bugun && (gs[i] || !D.ay) ? gs[i] : ''}</em><i style="height:${D.isoler[i] > bugun ? 3 : Math.max(3, gs[i] / max * 100)}%${D.isoler[i] === bugun ? '; background:var(--milo-sun)' : ''}"></i><small>${D.ay ? d.getDate() : MA_GUN_KISA[d.getDay()]}</small></div>`).join('')}</div></div>
        ${doluluk.length ? `<div class="ma-kart"><div class="ma-alt" style="font-weight:800">📈 Ders doluluğu — son 8 hafta</div>${doluluk.map(o => { let dz = o.kap ? Math.round(o.n / o.kap * 100) : null, renk = dz === null ? 'var(--milo-ink-dim)' : dz >= 100 ? 'var(--milo-coral)' : dz >= 80 ? 'var(--milo-sun)' : 'var(--milo-teal)';
            return `<div class="ma-dbas"><div class="ma-saat" style="font-size:14px">${o.s.baslangicSaat}<small>${maSlotGunler(o.s).map(g => MA_GUN_KISA[g]).join(',')}</small></div><div style="flex:1; min-width:0"><b>${miloEsc(o.s.grup || 'Ders')}</b><div class="ma-alt">${o.n} kayıtlı${o.kap ? ' / ' + o.kap + ' kapasite' : ''}${o.yap ? ' · derste ort. ' + o.ort.toFixed(1).replace('.', ',') + ' kişi' : ''}</div>${dz !== null ? `<div class="ma-bar" style="margin-top:4px"><i style="width:${Math.min(100, dz)}%; background:${renk}"></i></div>` : ''}</div><b style="color:${renk}">${dz !== null ? '%' + dz : '—'}</b></div>`; }).join('')}</div>` : ''}
        ${eg.length ? `<div class="ma-kart"><div class="ma-alt" style="font-weight:800">👔 Eğitmenler — ${D.yazi.toLocaleLowerCase('tr-TR')} girdikleri ders</div>${eg.map(x => `<div class="ma-dbas"><b style="flex:1">${miloEsc(x.p.ad)}</b><span class="ma-say"><b>${x.n}</b> ders</span></div>`).join('')}</div>` : ''}`;
}
// ---- veli rapor linki (sporcular satırından)
async function maRaporAc(key) {
    if (MA.rapor[key]) { delete MA.rapor[key]; return maCiz(); }
    let k = maCoz(key);
    try { let d = await miloApi(`/members/${encodeURIComponent(k.g)}/${encodeURIComponent(k.ad)}/izle-kodu`, { method: 'POST' }); MA.rapor[key] = location.origin + '/rapor.html?kulup=milo&kod=' + d.kod + '&ay=' + maIso(new Date()).slice(0, 7); maCiz(); }
    catch (e) { showToast('Rapor linki oluşturulamadı.', 'error'); }
}
function maRaporPanelHTML(key) {
    let link = MA.rapor[key], k = maCoz(key);
    return `<div class="ma-kart" style="background:var(--milo-card-raised)"><div class="ma-alt"><b style="color:var(--milo-ink)">📤 ${miloEsc(k.ad)} — aylık rapor linki</b> · veli devam takvimini, katılımı ve beceri gelişimini görür (telefon, not, sağlık bilgisi yok).</div>
        <input class="ma-ara" readonly value="${miloEsc(link)}" onclick="this.select()"><div style="display:flex; gap:6px; flex-wrap:wrap"><button class="ma-btn ana" onclick="maRaporGonder('${key}')">💬 WhatsApp ile gönder</button><button class="ma-btn" onclick="navigator.clipboard && navigator.clipboard.writeText(MA.rapor['${key}']).then(() => showToast('Link kopyalandı 📋'))">📋 Kopyala</button><button class="ma-btn" onclick="window.open(MA.rapor['${key}'], '_blank')">👁️ Önizle</button></div></div>`;
}
function maRaporGonder(key) {
    let k = maCoz(key), u = maUye(k.g, k.ad) || {}, ay = new Date().toLocaleDateString('tr-TR', { month: 'long' });
    maWa(u.acilTelefon, `Merhaba${u.acilKisi ? ' ' + u.acilKisi : ''} 🌟 MILO FITT KIDS'ten yazıyoruz.\n\n${maIlkAd(k.ad)}'in ${ay} ayı raporu hazır 🤸 Devam takvimini ve beceri gelişimini buradan görebilirsiniz:\n${MA.rapor[key]}\n\nMILO FITT KIDS`);
}

// ---------------------------------------------------------------- 🧹 ÇİFT KAYIT / İSİM DÜZELT
function maKatla(s) { return String(s || '').toLocaleLowerCase('tr-TR').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function maMesafe(a, b, sinir) {
    if (a === b) return 0; if (Math.abs(a.length - b.length) > sinir) return sinir + 1;
    let p2 = null, p = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) { let r = [i], m = i; for (let j = 1; j <= b.length; j++) { let v = Math.min(p[j] + 1, r[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); if (p2 && i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, p2[j - 2] + 1); r.push(v); if (v < m) m = v; } if (m > sinir) return sinir + 1; p2 = p; p = r; }
    return p[b.length];
}
function maEslesir(q, n) {
    if (!q) return true; if (n.includes(q)) return true;
    return q.split(' ').every(t => n.split(' ').some(x => x.startsWith(t) || maMesafe(t, x.slice(0, Math.max(t.length, Math.min(x.length, t.length + 1))), t.length >= 6 ? 2 : t.length >= 3 ? 1 : 0) <= (t.length >= 6 ? 2 : t.length >= 3 ? 1 : 0)));
}
function maBenzer(a, b) {
    if (a === b || a.split(' ').sort().join(' ') === b.split(' ').sort().join(' ')) return true;
    let ta = a.split(' '), tb = b.split(' '); if (ta.length !== tb.length) return false;
    let top = 0; for (let i = 0; i < ta.length; i++) { if (ta[i] === tb[i]) continue; if (Math.min(ta[i].length, tb[i].length) < 4) return false; let d = maMesafe(ta[i], tb[i], 1); if (d > 1) return false; top += d; }
    return top > 0 && top <= 2;
}
async function maCiftAc() { MA.ekran = 'cift'; maCss(); await maYukle(true); maCiz(); }
function maOzet(u) { return { yok: Object.keys(MA.att).filter(i => MA.att[i][u.ad] && MA.att[i][u.ad].geldi).length, ders: MA.slotlar.filter(s => (s.katilimcilar || []).some(k => k.grup === u.grup && k.ad === u.ad)).length }; }
function maCiftCiz() {
    let alan = document.getElementById('milo-icerik'), q = maKatla(MA.ciftAra);
    let kisiSatir = (u, sec) => { let k = maKey(u.grup, u.ad), o = maOzet(u), s = MA.secili.includes(u.grup + '|' + u.ad);
        return `<div class="ma-kisi" style="${s ? 'box-shadow:0 0 0 2px var(--milo-teal)' : ''}">${sec ? `<button class="ma-btn${s ? ' ana' : ''}" style="min-width:36px; padding:0" onclick="maCiftSec('${k}')">${s ? '✓' : ''}</button>` : `<span class="ma-av">${miloEsc(maIlk(u.ad))}</span>`}<span style="min-width:0"><b>${miloEsc(u.ad)}</b><small>${miloEsc(u.grup)} · ${o.yok} yoklama · ${o.ders} ders kaydı${u.pasif ? ' · pasif' : ''}</small></span><button class="ma-btn" onclick="maDuzenleAc('${k}')">✏️ Adını düzelt</button></div>
        ${MA.duzenle === u.grup + '|' + u.ad ? `<div class="ma-form"><input id="ma-duz-ad" value="${miloEsc(u.ad)}"><select id="ma-duz-grup">${[...new Set(MA.uyeler.map(x => x.grup))].map(g => `<option ${g === u.grup ? 'selected' : ''}>${miloEsc(g)}</option>`).join('')}</select><button class="ma-btn ana" onclick="maDuzenleKaydet('${k}')">💾 Kaydet</button></div><div class="ma-alt">Aidat, yoklama, beceri ve ders kayıtları yeni isme taşınır — veri kaybolmaz.</div>` : ''}`; };
    let sonuc = q ? MA.uyeler.filter(u => maEslesir(q, maKatla(u.ad))) : [];
    let oneri = []; for (let i = 0; i < MA.uyeler.length; i++) for (let j = i + 1; j < MA.uyeler.length; j++) if (maBenzer(maKatla(MA.uyeler[i].ad), maKatla(MA.uyeler[j].ad))) oneri.push([MA.uyeler[i], MA.uyeler[j]]);
    let panel = '';
    if (MA.secili.length >= 2) {
        let sec = MA.secili.map(x => { let [g, ...r] = x.split('|'); return maUye(g, r.join('|')); }).filter(Boolean);
        if (!MA.hedef || !MA.secili.includes(MA.hedef)) MA.hedef = MA.secili[0];
        panel = `<div class="ma-kart" style="box-shadow:0 0 0 2px var(--milo-teal); position:sticky; bottom:8px"><b>🧹 ${sec.length} kayıt tek kişide birleşecek — hangi isim kalsın?</b>${sec.map(u => `<label class="ma-alt" style="display:flex; gap:8px; align-items:center"><input type="radio" name="ma-hedef" ${MA.hedef === u.grup + '|' + u.ad ? 'checked' : ''} onchange="MA.hedef='${(u.grup + '|' + u.ad).replace(/'/g, "\\'")}'; maCiz()" style="appearance:auto !important; -webkit-appearance:radio !important; width:18px; height:18px"><b style="color:var(--milo-ink)">${miloEsc(u.ad)}</b> · ${miloEsc(u.grup)}</label>`).join('')}
            <div class="ma-alt">Diğer kayıtların aidatı, yoklaması, becerileri ve ders kayıtları kalan kayda taşınır; boş bilgileri (telefon, doğum tarihi…) doldurulur.</div><button class="ma-btn coral" onclick="maBirlestir()">✔ Birleştir</button></div>`;
    }
    alan.innerHTML = `<div class="ma"><div><button class="ma-btn" onclick="MA.ekran=null; MA.secili=[]; miloSekme('uyeler')">← Üyeler</button></div>
        <div><div class="ma-baslik">🧹 Çift Kayıt & İsim Düzelt</div><div class="ma-alt">İsim yaz; o isimdeki ve ona benzeyen (bir-iki harf farklı, ı/i, ş/s) tüm kayıtları görürsün. Yanlış yazılanı düzelt ya da aynı kişiye ait kayıtları seçip birleştir.</div></div>
        <input class="ma-ara" id="ma-cift-ara" type="search" placeholder="🔍 İsim yaz — ör. elif" value="${miloEsc(MA.ciftAra)}" oninput="MA.ciftAra=this.value; maCiz(); let e=document.getElementById('ma-cift-ara'); e.focus(); e.setSelectionRange(e.value.length, e.value.length)">
        ${q ? `<div class="ma-kart"><div class="ma-alt">${sonuc.length} kayıt</div><div class="ma-kisiler">${sonuc.map(u => kisiSatir(u, true)).join('') || '<div class="ma-alt">Bu isimde kayıt yok.</div>'}</div></div>` : ''}
        ${panel}
        <div class="ma-kart"><div class="ma-alt" style="font-weight:800">Şüpheli kayıtlar — ${oneri.length || 'yok'}</div>${oneri.map(([a, b]) => `<div class="ma-kisiler">${kisiSatir(a, false)}${kisiSatir(b, false)}</div><div><button class="ma-btn ana" onclick="MA.secili=['${(a.grup + '|' + a.ad).replace(/'/g, "\\'")}','${(b.grup + '|' + b.ad).replace(/'/g, "\\'")}']; MA.ciftAra=''; maCiz()">🧹 Birleştirmeye al</button></div>`).join('<hr style="border:none; border-top:1px dashed var(--milo-line)">') || '<div class="ma-alt">✅ Aynı ya da çok benzer isimle birden fazla kayıt yok.</div>'}</div></div>`;
}
function maCiftSec(key) { let k = maCoz(key), id = k.g + '|' + k.ad; MA.secili = MA.secili.includes(id) ? MA.secili.filter(x => x !== id) : MA.secili.concat(id); maCiz(); }
function maDuzenleAc(key) { let k = maCoz(key), id = k.g + '|' + k.ad; MA.duzenle = MA.duzenle === id ? null : id; maCiz(); }
async function maMiloPost(yol, govde) {
    let r = await fetch('/api/milo' + yol, { method: 'POST', headers: { 'content-type': 'application/json', 'X-Dagsk-Oturum': miloOturumToken || '' }, body: JSON.stringify(govde) });
    if (!r.ok) { let t = ''; try { t = (await r.json()).error || ''; } catch (e) {} throw new Error(t === 'target-exists' ? 'bu isim o grupta zaten var' : t || 'HTTP ' + r.status); }
    return r.json();
}
async function maDuzenleKaydet(key) {
    let k = maCoz(key), ad = (document.getElementById('ma-duz-ad').value || '').replace(/\s+/g, ' ').trim().toLocaleUpperCase('tr-TR'), g = document.getElementById('ma-duz-grup').value;
    if (!ad) return showToast('İsim boş olamaz.', 'error');
    try { await maMiloPost(`/members/${encodeURIComponent(k.g)}/${encodeURIComponent(k.ad)}/rename`, { yeniAd: ad, yeniGrup: g }); maTurTasi(k.g, k.ad, g, ad); MA.duzenle = null; await maYukle(true); showToast(`✏️ ${k.ad} → ${ad} (tüm kayıtlarıyla)`, 'success'); maCiz(); }
    catch (e) { showToast('Düzeltilemedi: ' + e.message + ' — hiçbir şey değişmedi.', 'error'); }
}
async function maBirlestir() {
    let [hg, ...hr] = MA.hedef.split('|'), ha = hr.join('|'), kaynak = MA.secili.filter(x => x !== MA.hedef);
    if (!confirm(`${kaynak.length} kayıt "${ha}" altında birleştirilsin mi? Geri alınamaz.`)) return;
    let ok = 0, hata = [];
    for (let x of kaynak) { let [g, ...r] = x.split('|'); try { await maMiloPost(`/members/${encodeURIComponent(g)}/${encodeURIComponent(r.join('|'))}/merge`, { toGrup: hg, toAd: ha }); maTurTasi(g, r.join('|'), hg, ha); ok++; } catch (e) { hata.push(r.join('|') + ': ' + e.message); } }
    MA.secili = []; MA.hedef = null; await maYukle(true);
    showToast(hata.length ? 'Bazıları birleştirilemedi: ' + hata.join('; ') : `🧹 ${ok} kayıt "${ha}" altında birleştirildi.`, hata.length ? 'error' : 'success');
    maCiz();
}
// kişi türü (misafir) kaydını yeni anahtara taşı
function maTurTasi(eG, eA, yG, yA) {
    let e = MA.tur[eG + '|' + eA]; if (!e || (eG === yG && eA === yA)) return;
    let t = Date.now(); MA.tur[yG + '|' + yA] = Object.assign({}, e, { t }); MA.tur[eG + '|' + eA] = { tur: 'sporcu', t };
    maMetaYaz('kisi_turleri', { [yG + '|' + yA]: MA.tur[yG + '|' + yA], [eG + '|' + eA]: MA.tur[eG + '|' + eA] }).then(m => { MA.tur = m; }).catch(() => {});
}

// ---------------------------------------------------------------- 🎟️ MİSAFİRLER (takip + üye yap)
async function maMisafirAc() { MA.ekran = 'misafir'; maCss(); await maYukle(true); maCiz(); }
function maMisafirCiz() {
    let alan = document.getElementById('milo-icerik'), bugun = maBugun();
    let mis = MA.uyeler.filter(u => maTur(u) === 'misafir').map(u => ({ u, b: MA.tur[u.grup + '|' + u.ad] || {}, son: maSonGelis(u), n: Object.keys(MA.att).filter(i => maDurum(u, i) === 'g').length }));
    let s90 = new Date(); s90.setDate(s90.getDate() - 90); let s90i = maIso(s90);
    let donusen = Object.keys(MA.tur).filter(k => MA.tur[k].aktifOldu && MA.tur[k].aktifOldu >= s90i && MA.tur[k].tur === 'sporcu');
    let aranacak = mis.filter(x => !(x.b.takip && x.b.takip.durum) && (x.son || x.b.eklenme) && (x.son || x.b.eklenme) < bugun);
    let gruplar = [...new Set(MA.uyeler.map(u => u.grup))];
    let karti = x => { let k = maKey(x.u.grup, x.u.ad), t = x.b.takip && x.b.takip.durum;
        return `<div class="ma-kisi"><span class="ma-av" style="background:var(--milo-coral)">${miloEsc(maIlk(x.u.ad))}</span><span style="min-width:0"><b>${miloEsc(x.u.ad)}</b><small>${miloEsc(x.u.grup)} · ${x.n} kez geldi · son ${maTarih(x.son)}${x.u.acilTelefon ? ' · 📞 ' + miloEsc(x.u.acilTelefon) : ''} · ${t === 'arandi' ? 'Arandı' : t === 'ilgilenmiyor' ? 'İlgilenmiyor' : 'Aranmadı'}</small></span>
            <span class="ma-sec"><button onclick="maMisafirWa('${k}')">💬</button><button onclick="maTakip('${k}','arandi')">✓ Arandı</button><button onclick="maTakip('${k}','ilgilenmiyor')">✕</button><button class="g aktif" onclick="maUyeYap('${k}')">⭐ Üye yap</button></span></div>`; };
    alan.innerHTML = `<div class="ma"><div><button class="ma-btn" onclick="MA.ekran=null; miloSekme('uyeler')">← Üyeler</button></div>
        <div><div class="ma-baslik">🎟️ Misafirler</div><div class="ma-alt">Deneme / günlük gelenler. Sürekli gelmeye başlayınca ⭐ Üye yap — tüm geçmişiyle normal üye olur.</div></div>
        <div class="ma-sayilar"><div class="ma-sayi"><small>Misafir</small><b>${mis.length}</b></div><div class="ma-sayi"><small>Son 90 günde üye oldu</small><b style="color:var(--milo-teal)">${donusen.length}</b></div><div class="ma-sayi"><small>Aranacak</small><b style="color:var(--milo-sun)">${aranacak.length}</b></div></div>
        ${MA.misForm ? `<div class="ma-kart"><div class="ma-form" id="ma-mis-form"><input name="ad" placeholder="Ad Soyad"><select name="grup">${gruplar.map(g => `<option>${miloEsc(g)}</option>`).join('')}</select><input name="tel" placeholder="Veli telefonu" inputmode="tel"><textarea name="not" placeholder="Kim? Nereden geldi?"></textarea></div><div style="display:flex; gap:6px"><button class="ma-btn ana" onclick="maMisafirEkle()">✅ Kaydet ve bugün geldi</button><button class="ma-btn" onclick="MA.misForm=false; maCiz()">Vazgeç</button></div></div>` : `<div><button class="ma-btn coral" onclick="MA.misForm=true; maCiz()">➕ Yeni misafir</button></div>`}
        ${aranacak.length ? `<div class="ma-kart"><b>📞 Aranmayı bekleyenler (${aranacak.length})</b><div class="ma-kisiler">${aranacak.map(karti).join('')}</div></div>` : ''}
        <div class="ma-kart"><b>Tüm misafirler</b><div class="ma-kisiler">${mis.map(karti).join('') || '<div class="ma-alt">Misafir yok.</div>'}</div></div>
        <div class="ma-kart"><b>Mevcut bir üyeyi misafir yap</b><select class="ma-ara" onchange="if(this.value) maMisafirYap(this.value)"><option value="">Üye seç…</option>${MA.uyeler.filter(u => maTur(u) !== 'misafir' && !u.pasif).map(u => `<option value="${maKey(u.grup, u.ad)}">${miloEsc(u.ad)} · ${miloEsc(u.grup)}</option>`).join('')}</select></div></div>`;
}
async function maTurYaz(g, ad, alanlar) { let k = g + '|' + ad; MA.tur[k] = Object.assign({}, MA.tur[k] || { tur: 'sporcu' }, alanlar, { t: Date.now() }); try { MA.tur = await maMetaYaz('kisi_turleri', { [k]: MA.tur[k] }); } catch (e) { showToast('Kaydedilemedi.', 'error'); } }
async function maTakip(key, durum) { let k = maCoz(key); await maTurYaz(k.g, k.ad, { takip: { durum, tarih: maBugun() } }); maCiz(); }
async function maMisafirYap(key) { let k = maCoz(key); await maTurYaz(k.g, k.ad, { tur: 'misafir', eklenme: maBugun() }); maCiz(); }
async function maUyeYap(key) { let k = maCoz(key); await maTurYaz(k.g, k.ad, { tur: 'sporcu', aktifOldu: maBugun(), takip: { durum: 'uye', tarih: maBugun() } }); showToast(`⭐ ${k.ad} artık üye.`, 'success'); maCiz(); }
function maMisafirWa(key) { let k = maCoz(key), u = maUye(k.g, k.ad) || {}; maWa(u.acilTelefon, `Merhaba 🌟 MILO FITT KIDS'ten yazıyoruz.\n\n${maIlkAd(k.ad)} dersimize katıldığı için teşekkür ederiz! 🤸 Nasıl buldu, devam etmek ister mi? Ders saatleri ve kayıt için buradan yazabilirsiniz.\n\nMILO FITT KIDS`); maTakip(key, 'arandi'); }
async function maMisafirEkle() {
    let f = document.getElementById('ma-mis-form'), ad = f.querySelector('[name=ad]').value.replace(/\s+/g, ' ').trim().toLocaleUpperCase('tr-TR'), g = f.querySelector('[name=grup]').value, tel = f.querySelector('[name=tel]').value.trim(), not = f.querySelector('[name=not]').value.trim();
    if (!ad || !g) return showToast('Ad ve grup gerekli.', 'error');
    if (maUye(g, ad)) return showToast('Bu isim o grupta zaten kayıtlı.', 'warning');
    try {
        await miloApi('/members', { method: 'POST', body: JSON.stringify({ grup: g, ad, acilTelefon: tel || null, genelNot: not || null, katilmaTarihi: maBugun() }) });
        await miloApi('/attendance/auto', { method: 'POST', body: JSON.stringify({ tarih: maBugun(), ad, grup: g, saat: new Date().toTimeString().slice(0, 5), elle: true, geldi: true }) });
        await maTurYaz(g, ad, { tur: 'misafir', eklenme: maBugun() });
        MA.misForm = false; await maYukle(true); showToast(`🎟️ ${ad} misafir olarak kaydedildi.`, 'success'); maCiz();
    } catch (e) { showToast('Misafir kaydedilemedi.', 'error'); }
}

// ---------------------------------------------------------------- Üyeler sekmesine kısayollar
(function () {
    if (typeof miloUyelerCiz !== 'function') return;
    const orijinal = miloUyelerCiz;
    miloUyelerCiz = function () {
        orijinal.apply(this, arguments);
        let alan = document.getElementById('milo-icerik'); if (!alan) return;
        let mis = Object.keys(MA.tur).filter(k => MA.tur[k].tur === 'misafir').length;
        alan.insertAdjacentHTML('afterbegin', `<div style="display:flex; gap:8px; margin-bottom:10px; flex-wrap:wrap"><button class="milo-toggle" style="flex:1" onclick="maCiftAc()">🧹 Çift Kayıt & İsim Düzelt</button><button class="milo-toggle" style="flex:1" onclick="maMisafirAc()">🎟️ Misafirler${mis ? ' (' + mis + ')' : ''}</button></div>`);
    };
})();
