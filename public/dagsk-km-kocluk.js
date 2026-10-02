/* ================================================================================================
   🗣️ TEKNİK KOÇLUK + 🏹 MİLYON OK — Karışık Sınıf araçları (2026-10-02)
   Kullanıcı (dünya kıyaslamasından sonra): "bizimkilerin tekniğini düzeltemiyoruz, eğitmenlere doğru cümlelerle
   ikna alanı yapman lazım" + "Milyon Ok Yolculuğu".
   - Hata rehberi: 10 yaygın teknik hata (klasik + makaralı) → ne görürsün, hedefteki iz, NEDEN (ikna), yaşa göre
     söylenecek cümle, düzeltme çalışmaları, geçme ölçütü. Çizimler dagsk-km-rehber.js'teki rhOkcu() ile.
   - Sporcu odağı: her çocuğun ŞU AN çalıştığı tek hata + kararlaştırılmış cümle — bütün eğitmenler aynı cümleyi
     söylesin (Archery GB "uyumlu koçluk"). Meta "teknik_odak" (kyDepoSenkron, kayıt başına en yeni kazanır).
     Karnede de görünür (app.js teknikOdakKarneHTML).
   - Hedefteki ize göre öneri: Ok Analizi / hedefe dokunarak girilen okların konumlarından (detayliOklar x,y;
     merkez 0,0, dış halka 100, y aşağı +) ortalama sapma ve dağılım → OLASI hatalar (kesin teşhis değil).
   - Milyon Ok: sınıfın kariyer ok sayacı ve bu haftaki ok sayısı (çekirdek app.js: milyonOkSay/milyonOkHafta).
   ================================================================================================ */
const KC_YAS = [['minik', 'Minik (6-9)'], ['kucuk', 'Küçük (10-12)'], ['buyuk', 'Yıldız / Büyük']];
const KC_HATALAR = [
    {
        id: 'kol-dusme', ad: 'Bırakışta yay kolu düşüyor / kafa kalkıyor', yay: 'hepsi', vurgu: 'birakis',
        belirti: 'Ok çıkar çıkmaz yay kolu aşağı iniyor ya da sporcu oku görmek için başını kaldırıyor.',
        iz: 'Oklar hedefin altında toplanır, yukarı-aşağı dağılım büyür.',
        neden: 'Ok yaydan tamamen çıkana kadar yay hâlâ çalışıyor. O anda kol oynarsa ok yönünü kaybediyor.',
        cumle: { minik: 'Ok gittikten sonra üçe kadar say, heykel ol! Bakalım en uzun kim heykel kalacak?', kucuk: 'Bırakınca kolunu fotoğraf çekiliyormuş gibi iki saniye hedefte tut.', buyuk: 'Takip: bırakıştan sonra nişangâh hedefte kalsın, ok vurana kadar pozisyonu bozma.' },
        ikna: 'Şu iki okuna bak: aralarındaki tek fark kolunun yeri. Heykel kaldığın oklar hep sarıda.',
        calisma: ['Heykel oyunu: her bırakıştan sonra 3 say, eğitmen "tamam" diyene kadar poz', '3 metreden boş hedefe gözler kapalı 10 ok — sadece takibi hisset', 'Telefonla yavaş çekim: bırakıştan sonraki bir saniyeyi birlikte izleyin'],
        olcut: '10 okun 8\'inde eğitmen "heykel" onayı veriyorsa sıradaki hataya geç.'
    },
    {
        id: 'sikma', ad: 'Yay elini sıkıyor (tutuş)', yay: 'hepsi', vurgu: 'tutus',
        belirti: 'Parmaklar sapı kavrıyor, eklemler beyazlıyor; bırakışta yay yana dönüyor.',
        iz: 'Oklar sağa-sola yayılır.',
        neden: 'Sıkan el yayı her seferinde farklı döndürüyor. Gevşek el yayı hep aynı noktadan itiyor.',
        cumle: { minik: 'Elinde bir kuş var: sıkarsan ezilir, açarsan uçar. Sadece yasla.', kucuk: 'Yayı tutma, avucunun yumuşak yerine yasla; parmakların gevşek dursun.', buyuk: 'Baskı başparmak kasında; parmaklar pasif, bilek gevşek. Yayı askı yakalasın, sen yakalama.' },
        ikna: 'Sıktığında yay çeyrek tur dönüyor, ok da onunla dönüyor. Gevşek elle attığın oklara bak.',
        calisma: ['Parmak askısı takılı, parmaklar açık 10 ok', 'Avuçtaki baskı noktası her okta aynı mı — eğitmen kontrol eder', 'Lastik bantla sapı itme hissi: 5 × 10 saniye'],
        olcut: 'Bırakıştan sonra yay askıda öne düşüyor ve parmaklar açık kalıyorsa tamam.'
    },
    {
        id: 'ankraj', ad: 'Ankraj (çene) noktası değişiyor', yay: 'hepsi', vurgu: 'cene',
        belirti: 'Çekiş eli her okta çenenin farklı yerine geliyor; kiriş bazen burna değmiyor.',
        iz: 'Oklar yukarı-aşağı dağılır: biri yüksek, biri alçak.',
        neden: 'Ankraj gözün arkasındaki ikinci nişangâh. O kayarsa nişangâh doğru olsa bile ok başka yere gider.',
        cumle: { minik: 'İp her seferinde burnunu öpecek, elin de çenenin altındaki gizli düğmeye basacak.', kucuk: 'Kiriş burnunun ucuna, işaret parmağın çenenin altına — her okta aynı iki nokta.', buyuk: 'İki temas noktası sabit: kiriş burun ucunda, işaret parmağı çene altında. Önce ankraj, sonra nişan; tersi değil.' },
        ikna: 'Ankrajın bir santim kayınca 18 metrede ok bir halka kayıyor. En iyi oklarında ip burnuna değiyordu.',
        calisma: ['Ayna karşısında çek – ankraj – dur: 10 × 5 saniye', 'Kirişe burun işareti (kisser) — her okta hissedecek', 'Gözler kapalı ankraj bulma: 10 tekrar'],
        olcut: 'Videoda ya da eğitmen gözüyle 10 okta aynı ankraj.'
    },
    {
        id: 'parmak', ad: 'Kirişi parmakla koparıyor (bırakış)', yay: 'klasik', vurgu: 'el',
        belirti: 'Bırakışta çekiş eli yüzden yana savruluyor ya da parmaklar açılıp kirişi itiyor.',
        iz: 'Sağ elle atanlarda oklar sola (bazen yukarı) gider; yatay dağılım büyür.',
        neden: 'Kiriş parmaklardan kayarak çıkmalı. El savrulursa kiriş yana itiliyor, ok da yana gidiyor.',
        cumle: { minik: 'Parmakların kapı gibi açılmasın, perde gibi gevşesin. Elin boynunun yanından geriye kaysın.', kucuk: 'Bırakmak yok, gevşemek var: sırtınla çekmeye devam et, parmaklar kendiliğinden açılsın.', buyuk: 'Aktif bırakış: kürek kemiği hareketi sürerken parmaklar gevşer, el boyun hizasında geriye gider.' },
        ikna: 'Bırakışta elin dışarı gittiğinde ok da sola gidiyor. Videoda birlikte bakalım.',
        calisma: ['Lastik bantla bırakış: 20 tekrar, el omuz hizasında geriye', '3 metreden boş hedefe 20 ok, sadece bırakış', 'Bırakıştan sonra el kulağın arkasında mı — eğitmen sorar'],
        olcut: 'Bırakıştan sonra el kulak/omuz hizasında geride kalıyorsa.'
    },
    {
        id: 'kolla-cekme', ad: 'Kolla çekiyor, sırtı kullanmıyor', yay: 'hepsi', vurgu: 'dirsek',
        belirti: 'Çekiş dirseği düşük ve önde; omuz kalkık; ankrajda titreme, ok beklemeden bırakılıyor.',
        iz: 'Alçak oklar; serinin sonuna doğru puan düşüyor (yorgunluk).',
        neden: 'Kol kasları küçük ve çabuk yorulur; sırt kasları büyük ve sabittir. Sırtla çeken her okta aynı kuvveti üretir.',
        cumle: { minik: 'Dirseğin arkadaki duvara dokunmaya çalışsın, kanatların birbirine yaklaşsın.', kucuk: 'Dirseğini okun hizasının arkasına getir; çekişi elin değil dirseğin yapsın.', buyuk: 'Dirsek ok hattının arkasında, kürek kemiği sıkışıyor; tutuşta sırtla açılmaya devam et.' },
        ikna: 'Kolla çekince son serilerde puanın düşüyor. Sırtla çekince yorgunluk gelmiyor — dene, farkı gör.',
        calisma: ['SPT: yayı çek, ankrajda 10-20 saniye tut, 5 tekrar', 'Lastik bant: kürek kemiği sıkma 3 × 15', 'Duvar oturuşu + kolları yana açma 3 × 30 saniye'],
        olcut: 'Ankrajda 10 saniye titremeden duruyorsa. Duramıyorsa yay ağır olabilir — libreyi kontrol et.'
    },
    {
        id: 'omuz', ad: 'Yay omzu kalkıyor', yay: 'hepsi', vurgu: 'omuz',
        belirti: 'Yay tarafındaki omuz kulağa yaklaşıyor, boyun geriliyor.',
        iz: 'Yüksek ve tutarsız oklar; zamanla omuz ağrısı.',
        neden: 'Kalkık omuz yayı her seferinde farklı yükseklikten itiyor ve sakatlık riski getiriyor.',
        cumle: { minik: 'Omzun cebinde! Kulağından uzak dursun.', kucuk: 'Önce omzunu aşağı ve geriye koy, sonra yayı kaldır.', buyuk: 'Yay omzu düşük ve sabit; kasla değil kemik hizasıyla it.' },
        ikna: 'Omzun kalkınca yay daha ağır geliyor ve ok yukarı kaçıyor. Aşağıdayken daha hafif, değil mi?',
        calisma: ['Ayna karşısında yay kaldırma, omuz aşağıda: 10 tekrar', 'Hafif yayla ya da bantla çekiş, omuz kontrolü', 'Omuz kalkması çoğu zaman yayın ağır olduğunu gösterir — libreyi düşür'],
        olcut: 'Çekişin her anında omuz kulaktan uzaksa.'
    },
    {
        id: 'donma', ad: 'Nişanda donuyor ya da acele ediyor', yay: 'hepsi', vurgu: 'goz',
        belirti: 'Ankrajda 8-10 saniye bekliyor, bırakamıyor — ya da tam tersi nişan almadan bırakıyor.',
        iz: 'Dağınık oklar, bazen hedef dışı; seriden seriye büyük fark.',
        neden: 'Uzun tutuşta kaslar yorulur, nişangâh dalgalanır. En iyi oklar ritimle atılanlardır.',
        cumle: { minik: 'Çek, bir-iki-üç, bırak! Üçe kadar olmadıysa indir, hiç sorun değil.', kucuk: 'Nişan 3-4 saniye. Olmuyorsa yayı indirmek de bir beceri.', buyuk: 'Atış döngün sabit: ankraj → 3-5 saniye nişan → bırakış. Süre dolarsa indir; hedefi kovalama.' },
        ikna: 'En iyi on okunun süresine bakalım: hepsi dört saniyenin altında.',
        calisma: ['Ritim & Tıkır aracıyla sesli sayım', '"İndir" oyunu: eğitmen rastgele "indir" der, sporcu indirir', 'Boş hedefte süre tutmadan sadece döngü'],
        olcut: '10 okun 8\'i hedef sürede atılıyorsa.'
    },
    {
        id: 'ayak', ad: 'Duruş / ayak yeri değişiyor', yay: 'hepsi', vurgu: 'ayak',
        belirti: 'Her seride ayaklar farklı yerde; gövde hedefe dönük ya da fazla kapalı.',
        iz: 'Oklar seriden seriye sağa-sola kayar.',
        neden: 'Duruş temeldir. Ayak iki santim kayarsa bütün vücut hizası değişir.',
        cumle: { minik: 'Ayakların kendi evinde! Bant işaretlerine bas.', kucuk: 'Ayaklar omuz genişliğinde, atış çizgisinin iki yanında; her seride aynı iz.', buyuk: 'Duruşu işaretle ve her seri başında kontrol et; değişken sadece bilerek değişsin.' },
        ikna: 'Ayağının yeri değiştiği serilerde oklar sağa kaydı. Aynı izde durduğunda gruplandı.',
        calisma: ['Atış çizgisine bantla ayak izi', 'Her seri başında 5 saniye duruş kontrolü'],
        olcut: '5 seri boyunca aynı ayak izi.'
    },
    {
        id: 'tetik', ad: 'Tetiğe vuruyor (makaralı)', yay: 'makarali', vurgu: 'el',
        belirti: 'Nişangâh sarıya girince tetiğe hızla basıyor; bırakışta el ya da kafa irkiliyor.',
        iz: 'Oklar çoğunlukla aşağı ve yana kaçar.',
        neden: 'Makaralıda en iyi bırakış sürpriz bırakıştır: sırttaki gerginlik arttıkça bırakıcı kendiliğinden ateşler.',
        cumle: { minik: 'Tetiğe basma; parmağın tetikte dursun, sırtınla çekmeye devam et.', kucuk: 'Tetiğe basma; parmağın tetikte, sırtınla çekmeye devam et, ne zaman patladığını bilme.', buyuk: 'Sürpriz bırakış: nişan sürerken sırt gerginliği artsın, bırakıcı kendiliğinden ateşlesin.' },
        ikna: 'Tetiğe vurduğun oklar hep aşağıda. Sürprizle çıkanlar ortada toplandı.',
        calisma: ['3 metreden boş hedefe gözler kapalı, sırtla ateşleme: 20 ok', 'Bırakıcıyı emniyet ipiyle çalışma', 'Nişan sırasında "patlamasın" hissiyle 5 saniye tutup indirme'],
        olcut: 'Sporcu ateşleme anını önceden bilmiyorsa (sürpriz).'
    },
    {
        id: 'egim', ad: 'Yayı yatırıyor (makaralı)', yay: 'makarali', vurgu: 'yaykolu',
        belirti: 'Nişangâhtaki su terazisinin kabarcığı ortada değil; yay sağa ya da sola eğik.',
        iz: 'Uzun mesafede oklar yana ve aşağı kaçar.',
        neden: 'Yatık yayda okun yolu ile nişan hattı aynı değil; mesafe uzadıkça hata büyür.',
        cumle: { minik: 'Önce kabarcığı ortala, sonra nişan al.', kucuk: 'Önce kabarcığı ortala, sonra nişan al.', buyuk: 'Döngüye ekle: ankraj → peep ortala → kabarcık → nişan → bırakış.' },
        ikna: '18 metrede fark etmiyor ama 50 metrede kabarcık kaydığında ok hedeften çıkıyor.',
        calisma: ['Her okta kabarcık kontrolü — eğitmen sorar: "kabarcık?"', 'Uzun mesafede 6 ok: önce kabarcık, sonra atış'],
        olcut: 'Her okta kabarcık ortada.'
    }
];
const KC_KURALLAR = [
    ['Tek seferde TEK ipucu', 'Aynı anda üç şey söylenen çocuk hiçbirini yapamaz. Bu hafta tek hata, tek cümle.'],
    ['"Yapma" değil "yap" de', '"Kolunu düşürme" yerine "kolun heykel olsun". Beyin olumsuzu atlar, yapılacak şeyi duyar.'],
    ['Önce göster, sonra yaptır, sonra öv', 'Doğru olduğu an hemen söyle: "İşte bu!" Doğru tekrar, hatanın düzeltilmesinden daha çok öğretir.'],
    ['Nedeni tek cümleyle anlat', 'Çocuk neden değiştirdiğini anlarsa direnmez: "Kolun oynayınca ok yönünü kaybediyor."'],
    ['Kanıt göster', 'Hedefteki iki oku yan yana gösterin ya da videoyu birlikte izleyin. Göz görünce ikna gelir.'],
    ['Bütün eğitmenler aynı cümleyi söylesin', 'Çocuğun odağı uygulamaya kaydedilir; kim ders verirse versin aynı kelimeler kullanılır.'],
    ['Puanı değil süreci öv', '"9 attın" yerine "takibin çok iyiydi". Puan sonuçtur; teknik öğrenilir.'],
    ['Küçüklerde hatayı oyuna çevir', 'Heykel, kuş, gizli düğme: benzetme bir talimattan daha çok akılda kalır.'],
    ['3 doğru → ilerle, 3 yanlış → bir adım geri', 'Olmuyorsa bant ya da boş hedefe dön; başarıyla bitir.'],
    ['Yay ağırsa teknik düzelmez', 'Ankrajda 10 saniye titremeden duramayan çocuğun yayı ağırdır. Önce libreyi uygun hale getir.']
];
const KC_KACIN = [
    ['"Yine mi?" / "Kaç kere söyledim"', '"Bir daha deneyelim, bu sefer sadece heykele odaklan."'],
    ['"Yanlış yapıyorsun"', '"Şunu dene: …" — tek bir şey söyle.'],
    ['Aynı anda 3-4 düzeltme', 'Bu haftanın tek odağı neyse sadece onu söyle.'],
    ['Sadece puan konuşmak', 'Önce teknik: "Bu okta ankrajın yerindeydi, harika."'],
    ['Başka çocukla kıyaslamak', 'Kendi geçen haftasıyla kıyasla: "Geçen hafta 3 saniye heykeldin, bugün 5."']
];

let _kc = { sekme: 'odak', yay: 'hepsi', yas: null, acik: null, secim: null };
function kcEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function kcJs(s) { return encodeURIComponent(s).replace(/'/g, '%27'); }
function kcYasGrubu(g) { return g === 'minikler' ? 'minik' : g === 'kucukler' ? 'kucuk' : 'buyuk'; }
function kcRoster() { return (typeof _kmListe !== 'undefined' ? _kmListe : []).filter(k => turnuvaDB[k.g] && turnuvaDB[k.g][k.ad]); }
function kcYayTur(sp) { return /makaral/i.test((sp && sp.yay) || '') ? 'makarali' : 'klasik'; }
function kcHata(id) { return KC_HATALAR.find(h => h.id === id); }
function kcIllustrasyon(h) { return typeof rhOkcu === 'function' ? rhOkcu(h.vurgu) : ''; }

// ---- hedefteki iz → olası hatalar (kesin teşhis değil)
function kcIzAnalizi(sp) {
    let o = ((sp && sp.detayliOklar) || []).filter(x => typeof x.x === 'number' && typeof x.y === 'number').slice(-30);
    if (o.length < 10) return null;
    let n = o.length, mx = o.reduce((a, x) => a + x.x, 0) / n, my = o.reduce((a, x) => a + x.y, 0) / n;
    let sx = Math.sqrt(o.reduce((a, x) => a + (x.x - mx) ** 2, 0) / n), sy = Math.sqrt(o.reduce((a, x) => a + (x.y - my) ** 2, 0) / n);
    let oneri = [], ac = [];
    if (my > 12) { oneri.push('kol-dusme', 'kolla-cekme'); ac.push('oklar ortalamada ' + (my / 10).toFixed(1) + ' halka aşağıda'); }
    if (my < -12) { oneri.push('omuz', 'ankraj'); ac.push('oklar ortalamada ' + (-my / 10).toFixed(1) + ' halka yukarıda'); }
    if (sy > 15 && sy > sx * 1.35) { oneri.push('ankraj', 'kolla-cekme'); ac.push('dağılım dikey (yukarı-aşağı)'); }
    if (sx > 15 && sx > sy * 1.35) { oneri.push('sikma', 'parmak', 'ayak'); ac.push('dağılım yatay (sağa-sola)'); }
    if (Math.abs(mx) > 12) { oneri.push(mx < 0 ? 'parmak' : 'sikma'); ac.push('oklar ortalamada ' + (Math.abs(mx) / 10).toFixed(1) + ' halka ' + (mx < 0 ? 'solda' : 'sağda')); }
    if (sx > 25 && sy > 25) { oneri.push('donma', 'ayak'); ac.push('her yöne geniş dağılım'); }
    let mak = kcYayTur(sp) === 'makarali';
    oneri = [...new Set(oneri)].filter(id => { let h = kcHata(id); return h && (h.yay === 'hepsi' || h.yay === (mak ? 'makarali' : 'klasik')); });
    return { n, aciklama: ac, oneri: oneri.slice(0, 3) };
}

// ---- sporcu odağı (meta teknik_odak)
function kcOdaklar() { return kyDepoOku('teknik_odak'); }
function kcOdakYaz(g, ad, kayit) {
    let d = kcOdaklar(); d[g + '|' + ad] = kayit ? Object.assign({ t: Date.now() }, kayit) : { t: Date.now(), sil: true };
    kyDepoYazYerel('teknik_odak', d);
    kyDepoSenkron('teknik_odak', () => kcOdaklar(), true).then(() => { if (_kmAktifSekme === 'kocluk') kmKoclukCiz(); }).catch(() => {});
}
function kcOdakSec(kk, hataId) {
    let [g, ...r] = decodeURIComponent(kk).split('|'), ad = r.join('|'), h = kcHata(hataId); if (!h) return;
    let yas = kcYasGrubu(g), kim = (typeof _oturum !== 'undefined' && _oturum && _oturum.ad) || '';
    kcOdakYaz(g, ad, { hata: h.id, hataAd: h.ad, cumle: h.cumle[yas], tarih: bsIsoTarih(new Date()), kim: kim });
    _kc.secim = null; showToast('🗣️ ' + ad.split(' ')[0] + ' için odak kaydedildi — bütün eğitmenler bu cümleyi görecek', 'success');
    kmKoclukCiz();
}
function kcOdakBitir(kk) {
    let [g, ...r] = decodeURIComponent(kk).split('|'), ad = r.join('|');
    onayIste('<b>' + kcEsc(ad) + '</b> bu hatayı düzeltti mi?<br><span style="font-size:12px;color:var(--text-muted)">Odak kaldırılır; sıradaki hatayı seçebilirsin.</span>', () => { kcOdakYaz(g, ad, null); showToast('🎉 Harika — sıradaki hataya geçebilirsiniz', 'success'); kmKoclukCiz(); }, '✅ Evet, düzeltti');
}

// ---- çizim
function kmKoclukCiz() {
    kcCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    if (typeof rhOkcu !== 'function' && typeof dagskEkYukle === 'function' && !_kc.rehberIstendi) { _kc.rehberIstendi = true; dagskEkYukle('dagsk-km-rehber.js').then(() => { if (_kmAktifSekme === 'kocluk') kmKoclukCiz(); }).catch(() => {}); }
    if (!_kc.senk) { _kc.senk = true; kyDepoSenkron('teknik_odak', () => kcOdaklar(), false).then(() => { if (_kmAktifSekme === 'kocluk') kmKoclukCiz(); }).catch(() => {}); }
    let sek = (id, ad) => `<button class="${_kc.sekme === id ? 'aktif' : ''}" onclick="_kc.sekme='${id}'; _kc.secim=null; kmKoclukCiz()">${ad}</button>`;
    let govde = _kc.sekme === 'rehber' ? kcRehberHTML() : _kc.sekme === 'kural' ? kcKuralHTML() : kcOdakHTML();
    el.innerHTML = `<div class="kc">
        <div><div class="kc-baslik">🗣️ Teknik Koçluk</div><div class="kc-alt">Doğru cümle, doğru zamanda. Her çocuğun bu haftaki <b>tek</b> hatası ve ona söylenecek cümle burada — kim ders verirse versin aynı kelimeler.</div></div>
        <div class="kc-sekmeler" role="tablist">${sek('odak', '👥 Sınıfta kim neye çalışıyor')}${sek('rehber', '📖 Hata rehberi')}${sek('kural', '💬 İkna kuralları')}</div>
        ${govde}</div>`;
}
function kcOdakHTML() {
    let L = kcRoster(), od = kcOdaklar();
    if (!L.length) return '<div class="kc-bos">Derste sporcu yok.</div>';
    return '<div class="kc-liste">' + L.map(k => {
        let sp = turnuvaDB[k.g][k.ad], kk = kcJs(k.g + '|' + k.ad), o = od[k.g + '|' + k.ad], aktif = o && !o.sil && o.hata;
        let iz = kcIzAnalizi(sp), secimAcik = _kc.secim === k.g + '|' + k.ad;
        let ust = `<div class="kc-sp-ust"><b>${kcEsc(k.ad)}</b><span class="kc-cip">${kcEsc((typeof LIG_ETIKET !== 'undefined' && LIG_ETIKET[k.g]) || k.g)} · ${kcYayTur(sp) === 'makarali' ? 'Makaralı' : 'Klasik'}</span>
            <span style="margin-left:auto; display:flex; gap:6px;">${aktif ? `<button class="kc-btn" onclick="kcOdakBitir('${kk}')">✅ Düzeltti</button>` : ''}<button class="kc-btn birincil" onclick="_kc.secim=${secimAcik ? 'null' : `decodeURIComponent('${kk}')`}; kmKoclukCiz()">${aktif ? 'Değiştir' : '🎯 Odak seç'}</button></span></div>`;
        let odak = aktif ? `<div class="kc-odak"><div class="kc-odak-ad">${kcEsc(o.hataAd)}</div><div class="kc-soz">“${kcEsc(o.cumle)}”</div><div class="kc-mini">${o.tarih ? 'Seçildi: ' + kcEsc(o.tarih) : ''}${o.kim ? ' · ' + kcEsc(o.kim) : ''}</div></div>` : '<div class="kc-mini">Bu hafta için odak seçilmedi.</div>';
        let secim = '';
        if (secimAcik) {
            let mak = kcYayTur(sp) === 'makarali', uygun = KC_HATALAR.filter(h => h.yay === 'hepsi' || h.yay === (mak ? 'makarali' : 'klasik'));
            let izHTML = iz ? `<div class="kc-iz">🎯 Hedefteki ize göre (son ${iz.n} ok): ${iz.aciklama.length ? kcEsc(iz.aciklama.join(', ')) : 'belirgin bir sapma yok'}.${iz.oneri.length ? ' Olası: <b>' + iz.oneri.map(id => kcEsc(kcHata(id).ad)).join(', ') + '</b>' : ''} <span class="kc-mini">— kesin teşhis değil, gözünle doğrula.</span></div>` : '<div class="kc-mini">Hedefteki iz önerisi için en az 10 okun konumu gerekli (Ok Analizi ya da hedefe dokunarak giriş).</div>';
            secim = `<div class="kc-secim">${izHTML}<div class="kc-secenekler">${uygun.map(h => `<button class="kc-secenek${iz && iz.oneri.includes(h.id) ? ' oneri' : ''}" onclick="kcOdakSec('${kk}','${h.id}')"><b>${kcEsc(h.ad)}</b><span>“${kcEsc(h.cumle[kcYasGrubu(k.g)])}”</span></button>`).join('')}</div></div>`;
        }
        return `<div class="kc-sp">${ust}${odak}${secim}</div>`;
    }).join('') + '</div>';
}
function kcRehberHTML() {
    let yas = _kc.yas || 'kucuk';
    let cip = (alan, deger, ad) => `<button class="${_kc[alan] === deger || (alan === 'yas' && !_kc.yas && deger === 'kucuk') ? 'aktif' : ''}" onclick="_kc.${alan}='${deger}'; kmKoclukCiz()">${ad}</button>`;
    let liste = KC_HATALAR.filter(h => _kc.yay === 'hepsi' || h.yay === 'hepsi' || h.yay === _kc.yay);
    return `<div class="kc-filtre"><div class="kc-cipler">${cip('yay', 'hepsi', 'Hepsi')}${cip('yay', 'klasik', 'Klasik')}${cip('yay', 'makarali', 'Makaralı')}</div>
        <div class="kc-cipler">${KC_YAS.map(y => cip('yas', y[0], y[1])).join('')}</div></div>
        <div class="kc-liste">${liste.map(h => {
            let acik = _kc.acik === h.id;
            return `<div class="kc-hata${acik ? ' acik' : ''}"><button class="kc-hata-bas" onclick="_kc.acik=${acik ? 'null' : `'${h.id}'`}; kmKoclukCiz()" aria-expanded="${acik}"><span><b>${kcEsc(h.ad)}</b>${h.yay !== 'hepsi' ? `<span class="kc-cip">${h.yay === 'makarali' ? 'Makaralı' : 'Klasik'}</span>` : ''}</span><span class="kc-soz kucuk">“${kcEsc(h.cumle[yas])}”</span></button>
            ${acik ? `<div class="kc-hata-ic"><div class="kc-ciz">${kcIllustrasyon(h)}</div><div class="kc-bilgi">
                <div><small>NE GÖRÜRSÜN</small>${kcEsc(h.belirti)}</div>
                <div><small>HEDEFTEKİ İZ</small>${kcEsc(h.iz)}</div>
                <div><small>NEDEN ÖNEMLİ — ÇOCUĞU İKNA EDEN KISIM</small>${kcEsc(h.neden)}</div>
                <div class="kc-soyle"><small>SÖYLE (${kcEsc(KC_YAS.find(y => y[0] === yas)[1])})</small><div class="kc-soz">“${kcEsc(h.cumle[yas])}”</div></div>
                <div class="kc-soyle ikna"><small>İKNA CÜMLESİ — KANITLA BİRLİKTE</small><div class="kc-soz">“${kcEsc(h.ikna)}”</div></div>
                <div><small>ÇALIŞMALAR</small><ul>${h.calisma.map(c => `<li>${kcEsc(c)}</li>`).join('')}</ul></div>
                <div><small>NE ZAMAN GEÇİLİR</small>${kcEsc(h.olcut)}</div></div></div>` : ''}</div>`;
        }).join('')}</div>`;
}
function kcKuralHTML() {
    return `<div class="kc-kart"><div class="kc-etiket">10 kural — çocuğu ikna eden eğitmen</div><ol class="kc-kurallar">${KC_KURALLAR.map(k => `<li><b>${kcEsc(k[0])}</b><span>${kcEsc(k[1])}</span></li>`).join('')}</ol></div>
        <div class="kc-kart"><div class="kc-etiket">Bunu deme → bunu de</div><div class="kc-donustur">${KC_KACIN.map(k => `<div class="kc-don"><span class="kc-deme">✗ ${kcEsc(k[0])}</span><span class="kc-de">✓ ${kcEsc(k[1])}</span></div>`).join('')}</div></div>`;
}

// ---------------------------------------------------------------- 🏹 Milyon Ok (sınıf)
function kmMilyonOkCiz() {
    kcCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    let L = kcRoster().map(k => { let sp = turnuvaDB[k.g][k.ad]; return { k, n: milyonOkSay(sp), h: milyonOkHafta(sp) }; }).sort((a, b) => b.n - a.n);
    let topN = L.reduce((a, x) => a + x.n, 0), topH = L.reduce((a, x) => a + x.h, 0);
    el.innerHTML = `<div class="kc">
        <div><div class="kc-baslik">🏹 Milyon Ok Yolculuğu</div><div class="kc-alt">Kore'de bir olimpiyat şampiyonu sahneye çıkana kadar yaklaşık <b>1.000.000 ok</b> atıyor. Her kayıtlı okun bu yolda bir adım. Bir durak geçilince kutlama çıkar.</div></div>
        <div class="kc-ozet"><div><b>${milyonOkSayiYaz(topH)}</b><span>sınıf bu hafta</span></div><div><b>${milyonOkSayiYaz(topN)}</b><span>sınıfın toplam yolu</span></div><div><b>${L.length ? milyonOkSayiYaz(Math.round(topH / L.length)) : 0}</b><span>kişi başı bu hafta</span></div></div>
        <div class="kc-liste">${L.map((x, i) => { let d = milyonOkDurak(x.n); return `<div class="kc-mo"><span class="kc-mo-sira">${i + 1}</span><span class="kc-mo-m"><b>${kcEsc(x.k.ad)}</b><span class="kc-mo-bar" role="progressbar" aria-valuenow="${d.yuzde}" aria-valuemin="0" aria-valuemax="100" aria-label="Sonraki durağa ilerleme"><i style="width:${d.yuzde}%"></i></span><small>sonraki durak ${milyonOkSayiYaz(d.son)} · ${milyonOkSayiYaz(Math.max(0, d.son - x.n))} kaldı · bu hafta ${milyonOkSayiYaz(x.h)}</small></span><span class="kc-mo-n">${milyonOkSayiYaz(x.n)}</span></div>`; }).join('') || '<div class="kc-bos">Derste sporcu yok.</div>'}</div>
        <div class="kc-mini">Yalnızca uygulamaya girilen oklar sayılır — ısınma ve boş hedef okları kayda girmez.</div></div>`;
}

function kcCss() {
    if (document.getElementById('kc-css')) return;
    let st = document.createElement('style'); st.id = 'kc-css';
    st.textContent = [
        '.kc{display:flex;flex-direction:column;gap:12px}',
        '.kc-baslik{font-size:17px;font-weight:900}.kc-alt{font-size:12.5px;color:var(--text-muted);margin-top:2px;line-height:1.45}',
        '.kc-sekmeler,.kc-cipler{display:flex;gap:6px;flex-wrap:wrap}',
        '.kc-sekmeler button,.kc-cipler button{min-height:40px;padding:0 14px;border-radius:12px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}',
        '.kc-sekmeler button.aktif,.kc-cipler button.aktif{background:var(--accent-orange);border-color:var(--accent-orange);color:var(--bg-main)}',
        '.kc-filtre{display:flex;flex-direction:column;gap:8px}',
        '.kc-liste{display:flex;flex-direction:column;gap:8px}',
        '.kc-sp,.kc-hata,.kc-kart{border:1px solid var(--border-color);border-radius:14px;background:color-mix(in srgb,var(--text-main) 4%,var(--bg-main));padding:12px 14px;display:flex;flex-direction:column;gap:8px}',
        '.kc-sp-ust{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.kc-sp-ust b{font-size:14px}',
        '.kc-cip{font-size:10.5px;font-weight:700;color:var(--text-muted);padding:2px 8px;border:1px solid var(--border-color);border-radius:99px;margin-left:6px}',
        '.kc-btn{min-height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;font-size:12px;font-weight:800;cursor:pointer}',
        '.kc-btn.birincil{border-color:var(--accent-orange);color:var(--accent-orange)}',
        '.kc-btn:focus-visible,.kc-secenek:focus-visible,.kc-hata-bas:focus-visible,.kc-sekmeler button:focus-visible,.kc-cipler button:focus-visible{outline:2px solid var(--accent-orange);outline-offset:2px}',
        '.kc-odak{border-left:0;border-radius:10px;background:color-mix(in srgb,var(--accent-orange) 10%,transparent);padding:10px 12px}',
        '.kc-odak-ad{font-size:11.5px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em}',
        '.kc-soz{font-size:16px;font-weight:800;line-height:1.35;margin-top:3px;text-wrap:pretty}.kc-soz.kucuk{font-size:12.5px;font-weight:600;color:var(--text-muted);margin-top:4px}',
        '.kc-mini{font-size:11.5px;color:var(--text-muted)}',
        '.kc-secim{display:flex;flex-direction:column;gap:8px;border-top:1px solid var(--border-color);padding-top:8px}',
        '.kc-iz{font-size:12.5px;line-height:1.45}',
        '.kc-secenekler{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px}',
        '.kc-secenek{display:flex;flex-direction:column;gap:3px;text-align:left;padding:10px 12px;border-radius:12px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;cursor:pointer}',
        '.kc-secenek b{font-size:12.5px}.kc-secenek span{font-size:11.5px;color:var(--text-muted)}.kc-secenek.oneri{border-color:var(--gold);background:color-mix(in srgb,var(--gold) 10%,transparent)}',
        '.kc-hata{padding:0;overflow:hidden}.kc-hata-bas{display:flex;flex-direction:column;align-items:flex-start;gap:2px;width:100%;text-align:left;padding:12px 14px;border:0;background:transparent;color:var(--text-main);font:inherit;cursor:pointer}',
        '.kc-hata-bas b{font-size:14px}.kc-hata.acik{border-color:var(--accent-orange)}',
        '.kc-hata-ic{display:grid;grid-template-columns:150px minmax(0,1fr);gap:14px;padding:0 14px 14px}@media (max-width:640px){.kc-hata-ic{grid-template-columns:1fr}}',
        '.kc-ciz svg{width:100%;height:auto;max-width:150px}',
        '.kc-bilgi{display:flex;flex-direction:column;gap:10px;font-size:13px;line-height:1.45}.kc-bilgi small{display:block;font-size:10px;font-weight:800;letter-spacing:.08em;color:var(--text-muted);margin-bottom:2px}',
        '.kc-bilgi ul{margin:0;padding-left:18px}.kc-soyle{border-radius:10px;padding:10px 12px;background:color-mix(in srgb,var(--accent-orange) 10%,transparent)}.kc-soyle.ikna{background:color-mix(in srgb,var(--neon-green) 10%,transparent)}',
        '.kc-etiket{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted)}',
        '.kc-kurallar{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px}.kc-kurallar li b{display:block;font-size:13.5px}.kc-kurallar li span{font-size:12.5px;color:var(--text-muted)}',
        '.kc-donustur{display:flex;flex-direction:column;gap:6px}.kc-don{display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12.5px;padding:6px 0;border-top:1px solid var(--border-color)}.kc-don:first-child{border-top:0}@media (max-width:640px){.kc-don{grid-template-columns:1fr}}',
        '.kc-deme{color:color-mix(in srgb,var(--neon-red) 80%,var(--text-main))}.kc-de{color:color-mix(in srgb,var(--neon-green) 85%,var(--text-main));font-weight:700}',
        '.kc-bos{padding:20px;text-align:center;color:var(--text-muted)}',
        '.kc-ozet{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.kc-ozet div{border:1px solid var(--border-color);border-radius:12px;padding:10px 12px;display:flex;flex-direction:column}.kc-ozet b{font-size:22px;font-weight:900;color:var(--gold);font-variant-numeric:tabular-nums}.kc-ozet span{font-size:11px;color:var(--text-muted)}',
        '.kc-mo{display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid var(--border-color);border-radius:12px}',
        '.kc-mo-sira{width:22px;font-weight:900;color:var(--text-muted);text-align:center}.kc-mo-m{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.kc-mo-m b{font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kc-mo-m small{font-size:11px;color:var(--text-muted)}',
        '.kc-mo-bar{display:block;height:6px;border-radius:99px;background:rgba(148,163,184,.18);overflow:hidden}.kc-mo-bar i{display:block;height:100%;background:var(--gold)}',
        '.kc-mo-n{font-size:16px;font-weight:900;color:var(--gold);font-variant-numeric:tabular-nums}'
    ].join('\n');
    document.head.appendChild(st);
}
