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

// ---- görsel katman v2 (2026-10-02, kullanıcı: "çok güzel olmuş, daha da geliştirelim, güzel görselleştirelim")
// Atış döngüsü: her hata bir adıma bağlı; şeritte o adım yanar. Desen: hedefteki tipik iz (mini hedefte noktalar).
const KC_DONGU = [['durus', 'Duruş'], ['kavrama', 'Kavrama'], ['cekis', 'Çekiş'], ['ankraj', 'Ankraj'], ['nisan', 'Nişan'], ['birakis', 'Bırakış'], ['takip', 'Takip']];
const KC_EK = {
    'kol-dusme': { adim: 'takip', desen: [0, 30, 10, 20] }, 'sikma': { adim: 'kavrama', desen: [-6, 4, 26, 9] },
    'ankraj': { adim: 'ankraj', desen: [0, 2, 8, 28] }, 'parmak': { adim: 'birakis', desen: [-26, -6, 18, 10] },
    'kolla-cekme': { adim: 'cekis', desen: [0, 22, 14, 16] }, 'omuz': { adim: 'cekis', desen: [2, -24, 12, 18] },
    'donma': { adim: 'nisan', desen: [0, 0, 30, 30] }, 'ayak': { adim: 'durus', desen: [16, 0, 24, 11] },
    'tetik': { adim: 'birakis', desen: [-8, 22, 15, 13] }, 'egim': { adim: 'nisan', desen: [18, 20, 15, 11] }
};
const KC_HALKA = ['#f2f2f2', '#f2f2f2', '#2b2b2b', '#2b2b2b', '#2f8fd8', '#2f8fd8', '#e0393e', '#e0393e', '#f6c929', '#f6c929'];
// Tohumlu rastgele (aynı hata hep aynı deseni çizsin)
function kcTohum(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
function kcDesenNoktalari(id) {
    let d = (KC_EK[id] || {}).desen || [0, 0, 15, 15], r = kcTohum(id), out = [];
    for (let i = 0; i < 12; i++) { let u = Math.max(1e-6, r()), v = r(), z = Math.sqrt(-2 * Math.log(u)); out.push({ x: d[0] + d[2] * z * Math.cos(2 * Math.PI * v), y: d[1] + d[3] * z * Math.sin(2 * Math.PI * v) }); }
    return out;
}
function kcMiniHedef(noktalar, s) {
    s = s || {};
    let halka = KC_HALKA.map((c, i) => `<circle r="${100 - i * 10}" fill="${c}" stroke="${i < 2 ? '#c8c8c8' : 'rgba(0,0,0,.25)'}" stroke-width="0.6"/>`).join('');
    let n = (noktalar || []).filter(o => isFinite(o.x) && isFinite(o.y));
    let renk = s.renk || '#7c3aed';
    let dot = n.map(o => `<circle cx="${Math.max(-104, Math.min(104, o.x)).toFixed(1)}" cy="${Math.max(-104, Math.min(104, o.y)).toFixed(1)}" r="${s.kucuk ? 4.2 : 5}" fill="${o.renk || renk}" stroke="#fff" stroke-width="1.2" opacity="${o.soluk ? 0.35 : 0.95}"/>`).join('');
    let mx = 0, my = 0; if (n.length) { mx = n.reduce((a, o) => a + o.x, 0) / n.length; my = n.reduce((a, o) => a + o.y, 0) / n.length; }
    let arti = n.length >= 3 && !s.artisiz ? `<g stroke="#0b0f1c" stroke-width="2.4" stroke-linecap="round"><path d="M${(mx - 9).toFixed(1)} ${my.toFixed(1)}H${(mx + 9).toFixed(1)}M${mx.toFixed(1)} ${(my - 9).toFixed(1)}V${(my + 9).toFixed(1)}"/></g>` : '';
    return `<svg viewBox="-110 -110 220 220" class="kc-hedef" role="img" aria-label="${kcEsc(s.etiket || 'Hedefteki iz')}">${halka}<path d="M-3 0H3M0 -3V3" stroke="#7a5a05" stroke-width="0.8"/>${dot}${arti}</svg>`;
}
function kcDonguHTML(aktifAdim, tiklanir, kompakt) {
    if (kompakt) {
        let i = KC_DONGU.findIndex(a => a[0] === aktifAdim);
        return `<div class="kc-dongu-k" role="img" aria-label="Atış döngüsü: ${i + 1}. adım ${i >= 0 ? KC_DONGU[i][1] : ''}">${KC_DONGU.map((a, j) => `<span class="${j === i ? 'aktif' : j < i ? 'once' : ''}"></span>`).join('')}<b>${i >= 0 ? (i + 1) + '/7 · ' + KC_DONGU[i][1] : ''}</b></div>`;
    }
    return `<div class="kc-dongu" role="${tiklanir ? 'group' : 'img'}" aria-label="Atış döngüsü">${KC_DONGU.map((a, i) => {
        let ic = `<span class="kc-dongu-no">${i + 1}</span><span>${a[1]}</span>`;
        return tiklanir ? `<button class="kc-dongu-adim${aktifAdim === a[0] ? ' aktif' : ''}" onclick="_kc.adim=${aktifAdim === a[0] ? 'null' : `'${a[0]}'`}; _kc.acik=null; kmKoclukCiz()" aria-pressed="${aktifAdim === a[0]}">${ic}</button>`
            : `<span class="kc-dongu-adim${aktifAdim === a[0] ? ' aktif' : ''}">${ic}</span>`;
    }).join('<span class="kc-dongu-ok" aria-hidden="true">›</span>')}</div>`;
}
// Sporcunun gerçek okları (son 30) + odaktan önce/sonra grup sıkılığı (ağırlık merkezine ortalama uzaklık)
function kcOklari(sp) { return ((sp && sp.detayliOklar) || []).filter(o => typeof o.x === 'number' && typeof o.y === 'number'); }
function kcCap(l) { if (l.length < 2) return null; let mx = l.reduce((a, o) => a + o.x, 0) / l.length, my = l.reduce((a, o) => a + o.y, 0) / l.length; return l.reduce((a, o) => a + Math.hypot(o.x - mx, o.y - my), 0) / l.length; }
function kcOncesiSonrasi(sp, tarih) {
    if (!tarih) return null;
    let ok = kcOklari(sp).filter(o => o.tarih), once = ok.filter(o => o.tarih < tarih).slice(-30), sonra = ok.filter(o => o.tarih >= tarih).slice(-30);
    if (once.length < 8 || sonra.length < 8) return { once: once.length, sonra: sonra.length };
    let a = kcCap(once), b = kcCap(sonra);
    return { once: once.length, sonra: sonra.length, a, b, fark: Math.round((a - b) / a * 100) };
}

function kmKoclukCiz() {
    kcCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    if (typeof rhOkcu !== 'function' && typeof dagskEkYukle === 'function' && !_kc.rehberIstendi) { _kc.rehberIstendi = true; dagskEkYukle('dagsk-km-rehber.js').then(() => { if (_kmAktifSekme === 'kocluk') kmKoclukCiz(); }).catch(() => {}); }
    if (!_kc.senk) { _kc.senk = true; kyDepoSenkron('teknik_odak', () => kcOdaklar(), false).then(() => { if (_kmAktifSekme === 'kocluk') kmKoclukCiz(); }).catch(() => {}); }
    let L = kcRoster(), od = kcOdaklar(), odakli = L.filter(k => { let o = od[k.g + '|' + k.ad]; return o && !o.sil && o.hata; }).length;
    let sek = (id, ikon, ad) => `<button class="${_kc.sekme === id ? 'aktif' : ''}" role="tab" aria-selected="${_kc.sekme === id}" onclick="_kc.sekme='${id}'; _kc.secim=null; kmKoclukCiz()"><span aria-hidden="true">${ikon}</span>${ad}</button>`;
    let govde = _kc.sekme === 'rehber' ? kcRehberHTML() : _kc.sekme === 'kural' ? kcKuralHTML() : kcOdakHTML();
    el.innerHTML = `<div class="kc">
        <div class="kc-hero"><div class="kc-hero-m"><div class="kc-ust-etiket">KARIŞIK SINIF · TEKNİK KOÇLUK</div><div class="kc-baslik">Doğru cümle, doğru zamanda</div><div class="kc-alt">Her çocuğun bu haftaki <b>tek</b> hatası ve ona söylenecek cümle. Kim ders verirse versin aynı kelimeler.</div></div>
            <div class="kc-hero-sayi"><b>${odakli}<span>/${L.length}</span></b><small>sporcunun odağı belli</small></div></div>
        <div class="kc-sekmeler" role="tablist">${sek('odak', '👥', 'Sınıf')}${sek('rehber', '📖', 'Hata rehberi')}${sek('kural', '💬', 'İkna kuralları')}</div>
        ${govde}</div>`;
}
function kcOdakHTML() {
    let L = kcRoster(), od = kcOdaklar();
    if (!L.length) return '<div class="kc-bos">Derste sporcu yok.</div>';
    return '<div class="kc-izgara">' + L.map(k => {
        let sp = turnuvaDB[k.g][k.ad], key = k.g + '|' + k.ad, kk = kcJs(key), o = od[key], aktif = o && !o.sil && o.hata;
        let secimAcik = _kc.secim === key, oklar = kcOklari(sp).slice(-30), h = aktif ? kcHata(o.hata) : null;
        let ilk = String(k.ad).trim().split(/\s+/)[0];
        let ust = `<div class="kc-sp-ust"><span class="kc-avatar g-${k.g}" aria-hidden="true">${kcEsc(ilk.charAt(0))}</span><span class="kc-sp-ad"><b>${kcEsc(k.ad)}</b><small>${kcEsc((typeof LIG_ETIKET !== 'undefined' && LIG_ETIKET[k.g]) || k.g)} · ${kcYayTur(sp) === 'makarali' ? 'Makaralı' : 'Klasik'}</small></span></div>`;
        let govde;
        if (aktif) {
            let ks = kcOncesiSonrasi(sp, o.tarih), gun = o.tarih ? Math.max(0, Math.round((new Date(bsIsoTarih(new Date()) + 'T12:00') - new Date(o.tarih + 'T12:00')) / 864e5)) : null;
            let kanit = ks && ks.fark != null ? `<div class="kc-kanit ${ks.fark >= 0 ? 'iyi' : 'kotu'}"><b>${ks.fark >= 0 ? '▼ %' + ks.fark + ' daha sıkı' : '▲ %' + (-ks.fark) + ' daha dağınık'}</b><small>odaktan önce ${ks.once} ok / sonra ${ks.sonra} ok</small></div>`
                : `<div class="kc-kanit"><small>${ks && (ks.once || ks.sonra) ? 'Önce/sonra kıyası için iki tarafta da 8 ok konumu gerekli (' + (ks.once || 0) + ' / ' + (ks.sonra || 0) + ').' : 'Ok konumları girildikçe burada önce/sonra kanıtı çıkacak.'}</small></div>`;
            govde = `<div class="kc-odak-kart">${h ? kcDonguHTML((KC_EK[h.id] || {}).adim, false, true) : ''}
                <div class="kc-odak-ad">${kcEsc(o.hataAd)}${gun != null ? ` · <span>${gun === 0 ? 'bugün seçildi' : gun + ' gündür çalışılıyor'}</span>` : ''}</div>
                <div class="kc-soz buyuk">“${kcEsc(o.cumle)}”</div>
                <div class="kc-odak-alt">${oklar.length ? `<div class="kc-mini-hedef">${kcMiniHedef(oklar, { kucuk: true, etiket: k.ad + ' son okları' })}<small>son ${oklar.length} ok</small></div>` : ''}${kanit}</div>
                <div class="kc-butonlar"><button class="kc-btn" onclick="kcGoster('${kk}')">📺 Çocuğa göster</button><button class="kc-btn" onclick="kcOdakBitir('${kk}')">✅ Düzeltti</button><button class="kc-btn" onclick="_kc.secim=${secimAcik ? 'null' : `decodeURIComponent('${kk}')`}; kmKoclukCiz()">Değiştir</button></div></div>`;
        } else govde = `<div class="kc-odak-bos"><span>Bu hafta için odak seçilmedi.</span><button class="kc-btn birincil" onclick="_kc.secim=${secimAcik ? 'null' : `decodeURIComponent('${kk}')`}; kmKoclukCiz()">🎯 Odak seç</button></div>`;
        let secim = '';
        if (secimAcik) {
            let mak = kcYayTur(sp) === 'makarali', uygun = KC_HATALAR.filter(x => x.yay === 'hepsi' || x.yay === (mak ? 'makarali' : 'klasik')), iz = kcIzAnalizi(sp);
            let izHTML = iz ? `<div class="kc-iz">${kcMiniHedef(oklar, { kucuk: true })}<div><b>Hedefteki iz (son ${iz.n} ok)</b><span>${iz.aciklama.length ? kcEsc(iz.aciklama.join(' · ')) : 'belirgin bir sapma yok'}</span>${iz.oneri.length ? `<span>Olası: <b>${iz.oneri.map(id => kcEsc(kcHata(id).ad)).join(', ')}</b></span>` : ''}<small>Kesin teşhis değil — gözünle doğrula.</small></div></div>` : '<div class="kc-mini">Hedefteki iz önerisi için en az 10 okun konumu gerekli (Ok Analizi ya da hedefe dokunarak giriş).</div>';
            secim = `<div class="kc-secim">${izHTML}<div class="kc-secenekler">${uygun.map(x => `<button class="kc-secenek${iz && iz.oneri.includes(x.id) ? ' oneri' : ''}" onclick="kcOdakSec('${kk}','${x.id}')">${kcMiniHedef(kcDesenNoktalari(x.id), { kucuk: true, artisiz: true, renk: '#64748b' })}<span><b>${kcEsc(x.ad)}</b><span>“${kcEsc(x.cumle[kcYasGrubu(k.g)])}”</span></span></button>`).join('')}</div></div>`;
        }
        return `<div class="kc-sp${aktif ? ' odakli' : ''}">${ust}${govde}${secim}</div>`;
    }).join('') + '</div>';
}
function kcRehberHTML() {
    let yas = _kc.yas || 'kucuk';
    let cip = (alan, deger, ad) => `<button class="${(_kc[alan] || (alan === 'yas' ? 'kucuk' : 'hepsi')) === deger ? 'aktif' : ''}" onclick="_kc.${alan}='${deger}'; kmKoclukCiz()">${ad}</button>`;
    let liste = KC_HATALAR.filter(h => (_kc.yay === 'hepsi' || h.yay === 'hepsi' || h.yay === _kc.yay) && (!_kc.adim || (KC_EK[h.id] || {}).adim === _kc.adim));
    return `<div class="kc-kart"><div class="kc-etiket">Atış döngüsü — bir adıma dokun, o adımın hataları kalsın</div>${kcDonguHTML(_kc.adim, true)}</div>
        <div class="kc-filtre"><div class="kc-cipler">${cip('yay', 'hepsi', 'Hepsi')}${cip('yay', 'klasik', 'Klasik')}${cip('yay', 'makarali', 'Makaralı')}</div><div class="kc-cipler">${KC_YAS.map(y => cip('yas', y[0], y[1])).join('')}</div></div>
        <div class="kc-liste">${liste.map(h => {
            let acik = _kc.acik === h.id, adim = KC_DONGU.find(a => a[0] === (KC_EK[h.id] || {}).adim);
            return `<div class="kc-hata${acik ? ' acik' : ''}"><button class="kc-hata-bas" onclick="_kc.acik=${acik ? 'null' : `'${h.id}'`}; kmKoclukCiz()" aria-expanded="${acik}">
                <span class="kc-hata-ikon">${kcMiniHedef(kcDesenNoktalari(h.id), { kucuk: true, artisiz: true, renk: '#7c3aed' })}</span>
                <span class="kc-hata-m"><span class="kc-hata-ust">${adim ? `<span class="kc-adim-cip">${adim[1]}</span>` : ''}${h.yay !== 'hepsi' ? `<span class="kc-cip">${h.yay === 'makarali' ? 'Makaralı' : 'Klasik'}</span>` : ''}</span><b>${kcEsc(h.ad)}</b><span class="kc-soz kucuk">“${kcEsc(h.cumle[yas])}”</span></span>
                <span class="kc-ok" aria-hidden="true">${acik ? '▴' : '▾'}</span></button>
            ${acik ? `<div class="kc-hata-ic"><div class="kc-gorseller"><div class="kc-ciz">${kcIllustrasyon(h)}</div><div class="kc-ciz-hedef">${kcMiniHedef(kcDesenNoktalari(h.id), { etiket: 'Tipik iz' })}<small>Tipik iz: ${kcEsc(h.iz)}</small></div></div><div class="kc-bilgi">
                <div><small>NE GÖRÜRSÜN</small>${kcEsc(h.belirti)}</div>
                <div><small>NEDEN ÖNEMLİ — ÇOCUĞU İKNA EDEN KISIM</small>${kcEsc(h.neden)}</div>
                <div class="kc-soyle"><small>SÖYLE · ${kcEsc(KC_YAS.find(y => y[0] === yas)[1])}</small><div class="kc-soz">“${kcEsc(h.cumle[yas])}”</div></div>
                <div class="kc-soyle ikna"><small>İKNA CÜMLESİ — KANITLA BİRLİKTE</small><div class="kc-soz">“${kcEsc(h.ikna)}”</div></div>
                <div><small>ÇALIŞMALAR</small><ol class="kc-adimlar">${h.calisma.map(c => `<li>${kcEsc(c)}</li>`).join('')}</ol></div>
                <div class="kc-olcut"><small>NE ZAMAN GEÇİLİR</small>${kcEsc(h.olcut)}</div></div></div>` : ''}</div>`;
        }).join('') || '<div class="kc-bos">Bu adımda bu yay türü için hata yok.</div>'}</div>`;
}
function kcKuralHTML() {
    return `<div class="kc-kurallar-izgara">${KC_KURALLAR.map((k, i) => `<div class="kc-kural"><span class="kc-kural-no">${i + 1}</span><div><b>${kcEsc(k[0])}</b><span>${kcEsc(k[1])}</span></div></div>`).join('')}</div>
        <div class="kc-kart"><div class="kc-etiket">Bunu deme → bunu de</div><div class="kc-donustur">${KC_KACIN.map(k => `<div class="kc-don"><span class="kc-deme">✗ ${kcEsc(k[0])}</span><span class="kc-don-ok" aria-hidden="true">→</span><span class="kc-de">✓ ${kcEsc(k[1])}</span></div>`).join('')}</div></div>`;
}
// 📺 Çocuğa göster — tam ekran, büyük cümle + çizim + tipik iz (tablet/TV)
function kcGoster(kk) {
    let [g, ...r] = decodeURIComponent(kk).split('|'), ad = r.join('|'), o = kcOdaklar()[g + '|' + ad]; if (!o || o.sil) return;
    let h = kcHata(o.hata), sp = turnuvaDB[g] && turnuvaDB[g][ad], ok = kcOklari(sp).slice(-30);
    let el = document.getElementById('kc-goster'); if (!el) { el = document.createElement('div'); el.id = 'kc-goster'; document.body.appendChild(el); }
    el.className = 'kc-goster'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Teknik odak');
    el.innerHTML = `<button class="kc-goster-kapat" onclick="document.getElementById('kc-goster').remove()" aria-label="Kapat">✕</button>
        <div class="kc-goster-ad">${kcEsc(ad)}</div>${h ? kcDonguHTML((KC_EK[h.id] || {}).adim, false, true) : ''}
        <div class="kc-goster-soz">“${kcEsc(o.cumle)}”</div>
        <div class="kc-goster-gorsel">${h ? `<div>${kcIllustrasyon(h)}</div>` : ''}<div>${kcMiniHedef(ok.length ? ok : (h ? kcDesenNoktalari(h.id) : []), { etiket: ok.length ? 'Son okların' : 'Tipik iz' })}<small>${ok.length ? 'Son ' + ok.length + ' okun' : 'Tipik iz'}</small></div></div>`;
}

// ---------------------------------------------------------------- 🏹 Milyon Ok (sınıf) v2
let KC_YOL_W = 1000, KC_YOL_H = 230;
function kcBinYaz(e) { return e >= 1000000 ? '1 MİLYON' : e >= 1000 ? (e / 1000).toLocaleString('tr-TR') + ' bin' : String(e); }
function kcYolT(n) { return Math.max(0, Math.min(1, Math.log10(Math.max(1, n)) / 6)); } // 1 → 0, 1.000.000 → 1
function kcYolNokta(t) { return { x: 40 + t * (KC_YOL_W - 80), y: 128 - 62 * Math.sin(t * Math.PI * 2.2 + 0.4) * (0.55 + 0.45 * t) }; }
function kcYolPath(t1) { let p = [], n = 120; for (let i = 0; i <= n; i++) { let q = kcYolNokta(i / n * t1); p.push((i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1)); } return p.join(''); }
function kcHaftalar(sp, adet) {
    let bugun = new Date(), gun = (bugun.getDay() + 6) % 7, pzt = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() - gun), out = [];
    for (let i = adet - 1; i >= 0; i--) { let b = new Date(pzt); b.setDate(b.getDate() - i * 7); let s = new Date(b); s.setDate(s.getDate() + 7); out.push({ bas: bsIsoTarih(b), son: bsIsoTarih(s), n: 0 }); }
    let ekle = x => { let t = x.tarih || ''; let w = out.find(w => t >= w.bas && t < w.son); if (w) w.n += (x.oklar || []).length; };
    (sp.seriler || []).forEach(ekle); (sp.kartGecmisi || []).forEach(k => (k.seriler || []).forEach(ekle));
    return out;
}
function kcCubuk(haftalar, s) {
    s = s || {}; let max = Math.max(1, ...haftalar.map(w => w.n)), W = s.w || 160, H = s.h || 40, bw = W / haftalar.length, ust = s.etiket ? 12 : 0;
    return `<svg viewBox="0 ${-ust} ${W} ${H + ust + (s.etiket ? 14 : 0)}" class="kc-cubuk" role="img" aria-label="Son ${haftalar.length} haftanın ok sayısı">${haftalar.map((w, i) => {
        let h = Math.max(w.n ? 2 : 0.8, w.n / max * (H - 4)), son = i === haftalar.length - 1;
        return `<rect x="${(i * bw + bw * 0.18).toFixed(1)}" y="${(H - h).toFixed(1)}" width="${(bw * 0.64).toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${son ? 'var(--gold)' : 'color-mix(in srgb, var(--gold) 45%, transparent)'}"/>`
            + (s.etiket && (son || w.n === max) && w.n ? `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${(H - h - 3).toFixed(1)}" text-anchor="middle" font-size="9" font-weight="800" fill="currentColor">${w.n}</text>` : '')
            + (s.etiket ? `<text x="${(i * bw + bw / 2).toFixed(1)}" y="${H + 11}" text-anchor="middle" font-size="8.5" fill="currentColor" opacity=".6">${son ? 'bu h.' : (haftalar.length - 1 - i) + 'h'}</text>` : '');
    }).join('')}</svg>`;
}
const KC_MADALYA = [1000, 2500, 5000, 10000, 25000, 50000, 100000, 1000000];
function kcMadalya(e, kazandi) {
    let ad = e >= 1000000 ? '1 milyon' : e >= 1000 ? (e / 1000).toLocaleString('tr-TR') + ' bin' : e;
    return `<span class="kc-madalya${kazandi ? ' var' : ''}" title="${milyonOkSayiYaz(e)} ok${kazandi ? ' — kazanıldı' : ' — kilitli'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h4l1 5-3 2zM17 2h-4l-1 5 3 2z" fill="${kazandi ? '#e0393e' : '#64748b'}"/><circle cx="12" cy="15" r="7" fill="${kazandi ? '#f6c929' : '#334155'}" stroke="${kazandi ? '#b8860b' : '#475569'}" stroke-width="1.2"/></svg><b>${ad}</b></span>`;
}
function kmMilyonOkCiz() {
    kcCss();
    let el = document.getElementById('km-icerik'); if (!el) return;
    let L = kcRoster().map(k => { let sp = turnuvaDB[k.g][k.ad]; return { k, sp, n: milyonOkSay(sp), h: milyonOkHafta(sp), w: kcHaftalar(sp, 8) }; }).sort((a, b) => b.n - a.n);
    let topN = L.reduce((a, x) => a + x.n, 0), topH = L.reduce((a, x) => a + x.h, 0);
    let sinifHafta = (L[0] ? L[0].w : kcHaftalar({}, 8)).map((w, i) => ({ bas: w.bas, n: L.reduce((a, x) => a + x.w[i].n, 0) }));
    let maxT = L.length ? kcYolT(L[0].n) : 0, dar = window.innerWidth < 700;
    KC_YOL_W = dar ? 520 : 1000; KC_YOL_H = dar ? 260 : 230;
    let fs = dar ? 17 : 11, yr = dar ? 15 : 10.5, gosterEtiket = e => !dar || [100, 1000, 10000, 100000, 1000000].includes(e);
    // yol: duraklar + sporcular (yakın olanlar dikeyde kaydırılır)
    let duraklar = MILYON_OK_ESIKLER.map(e => { let p = kcYolNokta(kcYolT(e)), ulasildi = L.some(x => x.n >= e); return `<g class="kc-durak${ulasildi ? ' var' : ''}"><circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(e >= 1000000 ? 13 : 8) * (dar ? 1.25 : 1)}"/>${gosterEtiket(e) ? `<text x="${p.x.toFixed(1)}" y="${(e >= 1000000 ? p.y - 22 * (dar ? 1.35 : 1) : p.y + 24 * (dar ? 1.35 : 1)).toFixed(1)}" text-anchor="${e >= 1000000 ? 'end' : 'middle'}" font-size="${fs}">${kcBinYaz(e)}</text>` : ''}</g>`; }).join('');
    let yerlesik = [], sporcular = L.slice().reverse().map(x => {
        let p = kcYolNokta(kcYolT(x.n)), kat = 0;
        while (yerlesik.some(q => Math.abs(q.x - p.x) < yr * 2.1 && q.kat === kat)) kat++;
        yerlesik.push({ x: p.x, kat });
        let y = p.y - yr * 2.5 - kat * yr * 2.3, ilk = String(x.k.ad).trim().split(/\s+/)[0];
        return `<g class="kc-yolcu g-${x.k.g}"><line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${p.x.toFixed(1)}" y2="${(y + yr).toFixed(1)}"/><circle cx="${p.x.toFixed(1)}" cy="${y.toFixed(1)}" r="${yr}"/><text x="${p.x.toFixed(1)}" y="${(y + yr * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fs}">${kcEsc(ilk.charAt(0))}</text><title>${kcEsc(x.k.ad)} — ${milyonOkSayiYaz(x.n)} ok</title></g>`;
    }).join('');
    let yol = `<svg viewBox="0 0 ${KC_YOL_W} ${KC_YOL_H}" class="kc-yol" role="img" aria-label="Milyon ok yolu: sınıfın yoldaki yerleri">
        <defs><linearGradient id="kc-yol-isik" x1="0" x2="1"><stop offset="0" stop-color="#f6c929"/><stop offset="1" stop-color="#ff7a1a"/></linearGradient></defs>
        <path d="${kcYolPath(1)}" class="kc-yol-zemin"/><path d="${kcYolPath(1)}" class="kc-yol-serit"/>
        ${maxT > 0 ? `<path d="${kcYolPath(maxT)}" class="kc-yol-isik"/>` : ''}${duraklar}${sporcular}</svg>`;
    el.innerHTML = `<div class="kc">
        <div class="kc-hero altin"><div class="kc-hero-m"><div class="kc-ust-etiket">KARIŞIK SINIF · MİLYON OK YOLCULUĞU</div><div class="kc-baslik">Her ok bir adım</div><div class="kc-alt">Kore'de bir olimpiyat şampiyonu sahneye çıkana kadar yaklaşık <b>1.000.000 ok</b> atıyor. Bir durak geçilince kutlama çıkar.</div></div>
            <div class="kc-hero-sayi"><b>${milyonOkSayiYaz(topH)}</b><small>sınıf bu hafta</small></div></div>
        <div class="kc-kart kc-yol-kap">${yol}<div class="kc-yol-not">Yol logaritmik: 100'den 1.000'e, 1.000'den 10.000'e… her durak öncekinin katları.</div></div>
        <div class="kc-ozet"><div><b>${milyonOkSayiYaz(topN)}</b><span>sınıfın toplam yolu</span></div><div><b>${L.length ? milyonOkSayiYaz(Math.round(topH / L.length)) : 0}</b><span>kişi başı bu hafta</span></div>
            <div class="kc-ozet-grafik"><span>Sınıf · son 8 hafta</span>${kcCubuk(sinifHafta, { w: 440, h: 64, etiket: true })}</div></div>
        <div class="kc-liste">${L.map((x, i) => { let d = milyonOkDurak(x.n); return `<div class="kc-mo">
            <span class="kc-mo-sira${i < 3 ? ' s' + (i + 1) : ''}">${i + 1}</span><span class="kc-avatar g-${x.k.g}" aria-hidden="true">${kcEsc(String(x.k.ad).trim().charAt(0))}</span>
            <span class="kc-mo-m"><b>${kcEsc(x.k.ad)}</b><span class="kc-mo-bar" role="progressbar" aria-valuenow="${d.yuzde}" aria-valuemin="0" aria-valuemax="100" aria-label="Sonraki durağa ilerleme"><i style="width:${d.yuzde}%"></i></span>
                <small>sonraki durak ${milyonOkSayiYaz(d.son)} · ${milyonOkSayiYaz(Math.max(0, d.son - x.n))} kaldı · bu hafta ${milyonOkSayiYaz(x.h)}</small>
                <span class="kc-madalyalar">${KC_MADALYA.filter(e => e <= Math.max(10000, x.n * 4)).map(e => kcMadalya(e, x.n >= e)).join('')}</span></span>
            <span class="kc-mo-sag"><span class="kc-mo-n">${milyonOkSayiYaz(x.n)}</span>${kcCubuk(x.w, { w: 96, h: 26 })}</span></div>`; }).join('') || '<div class="kc-bos">Derste sporcu yok.</div>'}</div>
        <div class="kc-mini">Yalnızca uygulamaya girilen oklar sayılır — ısınma ve boş hedef okları kayda girmez.</div></div>`;
}

function kcCss() {
    if (document.getElementById('kc-css')) return;
    let st = document.createElement('style'); st.id = 'kc-css';
    st.textContent = [
        '.kc{--kc-yuzey:color-mix(in srgb,var(--text-main) 4%,var(--bg-main));--kc-vurgu:var(--accent-orange);--kc-altin:var(--gold,#fbbf24);display:flex;flex-direction:column;gap:14px}',
        // hero
        '.kc-hero{position:relative;overflow:hidden;display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:18px 20px;border-radius:20px;border:1px solid color-mix(in srgb,var(--kc-vurgu) 40%,var(--border-color));background:radial-gradient(420px 160px at 0% 0%,color-mix(in srgb,var(--aurora-cyan,#00f0ff) 16%,transparent),transparent 70%),radial-gradient(420px 180px at 100% 100%,color-mix(in srgb,var(--aurora-magenta,#ff2fd0) 14%,transparent),transparent 70%),var(--kc-yuzey)}',
        '.kc-hero.altin{border-color:color-mix(in srgb,var(--kc-altin) 45%,var(--border-color));background:radial-gradient(420px 160px at 0% 0%,color-mix(in srgb,var(--kc-altin) 18%,transparent),transparent 70%),radial-gradient(420px 180px at 100% 100%,color-mix(in srgb,#ff7a1a 14%,transparent),transparent 70%),var(--kc-yuzey)}',
        '.kc-hero-m{flex:1 1 280px;min-width:0}.kc-ust-etiket{font-size:10px;font-weight:800;letter-spacing:.14em;color:var(--text-muted)}',
        '.kc-baslik{font-size:22px;font-weight:900;letter-spacing:-.01em;margin-top:2px;text-wrap:balance}.kc-alt{font-size:12.5px;color:var(--text-muted);margin-top:3px;line-height:1.45;max-width:62ch}',
        '.kc-hero-sayi{display:flex;flex-direction:column;align-items:flex-end}.kc-hero-sayi b{font-size:38px;font-weight:900;line-height:1;font-variant-numeric:tabular-nums;color:var(--kc-vurgu)}.kc-hero.altin .kc-hero-sayi b{color:var(--kc-altin)}.kc-hero-sayi b span{font-size:18px;color:var(--text-muted)}.kc-hero-sayi small{font-size:11px;color:var(--text-muted)}',
        // sekmeler / çipler
        '.kc-sekmeler,.kc-cipler{display:flex;gap:6px;flex-wrap:wrap}',
        '.kc-sekmeler button,.kc-cipler button{display:inline-flex;align-items:center;gap:7px;min-height:42px;padding:0 15px;border-radius:12px;border:1px solid var(--border-color);background:var(--kc-yuzey);color:var(--text-main);font:inherit;font-size:13px;font-weight:700;cursor:pointer}',
        '.kc-sekmeler button.aktif,.kc-cipler button.aktif{background:var(--kc-vurgu);border-color:var(--kc-vurgu);color:var(--bg-main);box-shadow:0 6px 20px -8px var(--kc-vurgu)}',
        '.kc-filtre{display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between}',
        // döngü şeridi
        '.kc-dongu{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.kc-dongu-ok{color:var(--text-muted);opacity:.5;font-weight:900}',
        '.kc-dongu-adim{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 10px;border-radius:99px;border:1px solid var(--border-color);background:transparent;color:var(--text-muted);font:inherit;font-size:12px;font-weight:700}',
        'button.kc-dongu-adim{cursor:pointer;min-height:40px}.kc-dongu-no{width:18px;height:18px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:900;background:color-mix(in srgb,var(--text-main) 10%,transparent)}',
        '.kc-dongu-adim.aktif{color:var(--text-main);border-color:var(--kc-vurgu);background:color-mix(in srgb,var(--kc-vurgu) 18%,transparent)}.kc-dongu-adim.aktif .kc-dongu-no{background:var(--kc-vurgu);color:var(--bg-main)}',
        // kartlar
        '.kc-kart,.kc-sp,.kc-hata{border:1px solid var(--border-color);border-radius:16px;background:var(--kc-yuzey);padding:14px 16px;display:flex;flex-direction:column;gap:10px}',
        '.kc-etiket{font-size:10.5px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:var(--text-muted)}',
        '.kc-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px;align-items:start}@media (max-width:420px){.kc-izgara{grid-template-columns:1fr}}',
        '.kc-sp.odakli{border-color:color-mix(in srgb,var(--kc-vurgu) 45%,var(--border-color))}',
        '.kc-sp-ust{display:flex;align-items:center;gap:10px}.kc-sp-ad{display:flex;flex-direction:column;min-width:0}.kc-sp-ad b{font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kc-sp-ad small{font-size:11px;color:var(--text-muted)}',
        '.kc-avatar{flex-shrink:0;width:34px;height:34px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#fff;background:#64748b;box-shadow:0 0 0 2px color-mix(in srgb,currentColor 0%,transparent)}',
        '.g-buyukler{--g:#3b82f6}.g-yildizlar{--g:#f59e0b}.g-kucukler{--g:#10b981}.g-minikler{--g:#a78bfa}.kc-avatar.g-buyukler,.kc-avatar.g-yildizlar,.kc-avatar.g-kucukler,.kc-avatar.g-minikler{background:var(--g)}',
        '.kc-odak-kart{display:flex;flex-direction:column;gap:9px;padding:12px;border-radius:14px;background:linear-gradient(135deg,color-mix(in srgb,var(--kc-vurgu) 14%,transparent),color-mix(in srgb,var(--aurora-cyan,#00f0ff) 6%,transparent))}',
        '.kc-odak-ad{font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--text-muted)}.kc-odak-ad span{text-transform:none;letter-spacing:0;font-weight:700}',
        '.kc-soz{font-size:16px;font-weight:800;line-height:1.35;text-wrap:pretty}.kc-soz.buyuk{font-size:18px}.kc-soz.kucuk{font-size:12.5px;font-weight:600;color:var(--text-muted)}',
        '.kc-odak-alt{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.kc-mini-hedef{display:flex;flex-direction:column;align-items:center;gap:2px}.kc-mini-hedef .kc-hedef{width:92px;height:92px}.kc-mini-hedef small{font-size:10px;color:var(--text-muted)}',
        '.kc-kanit{flex:1;min-width:150px;display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:12px;border:1px dashed var(--border-color)}.kc-kanit b{font-size:17px;font-weight:900}.kc-kanit small{font-size:11px;color:var(--text-muted)}',
        '.kc-kanit.iyi{border-style:solid;border-color:color-mix(in srgb,var(--neon-green) 50%,transparent);background:color-mix(in srgb,var(--neon-green) 10%,transparent)}.kc-kanit.iyi b{color:var(--neon-green)}',
        '.kc-kanit.kotu{border-style:solid;border-color:color-mix(in srgb,var(--gold) 50%,transparent)}.kc-kanit.kotu b{color:var(--gold)}',
        '.kc-butonlar{display:flex;gap:6px;flex-wrap:wrap}',
        '.kc-odak-bos{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;font-size:12.5px;color:var(--text-muted);padding:10px 12px;border-radius:12px;border:1px dashed var(--border-color)}',
        '.kc-btn{min-height:40px;padding:0 13px;border-radius:11px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}.kc-btn:hover{border-color:var(--kc-vurgu)}',
        '.kc-btn.birincil{background:var(--kc-vurgu);border-color:var(--kc-vurgu);color:var(--bg-main)}',
        '.kc-btn:focus-visible,.kc-secenek:focus-visible,.kc-hata-bas:focus-visible,.kc-sekmeler button:focus-visible,.kc-cipler button:focus-visible,.kc-dongu-adim:focus-visible{outline:2px solid var(--kc-vurgu);outline-offset:2px}',
        '.kc-mini{font-size:11.5px;color:var(--text-muted)}',
        // odak seçimi
        '.kc-secim{display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--border-color);padding-top:10px}',
        '.kc-iz{display:flex;gap:12px;align-items:center;padding:10px;border-radius:12px;background:color-mix(in srgb,var(--gold) 8%,transparent);border:1px solid color-mix(in srgb,var(--gold) 35%,transparent)}.kc-iz .kc-hedef{width:84px;height:84px;flex-shrink:0}',
        '.kc-iz>div{display:flex;flex-direction:column;gap:3px;font-size:12.5px;line-height:1.4}.kc-iz small{font-size:11px;color:var(--text-muted)}',
        '.kc-secenekler{display:grid;grid-template-columns:1fr;gap:6px}',
        '.kc-secenek{display:flex;align-items:center;gap:10px;text-align:left;padding:8px 10px;border-radius:12px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font:inherit;cursor:pointer}.kc-secenek:hover{border-color:var(--kc-vurgu)}',
        '.kc-secenek .kc-hedef{width:44px;height:44px;flex-shrink:0}.kc-secenek>span{display:flex;flex-direction:column;gap:2px;min-width:0}.kc-secenek b{font-size:12.5px}.kc-secenek>span>span{font-size:11.5px;color:var(--text-muted)}',
        '.kc-secenek.oneri{border-color:var(--gold);background:color-mix(in srgb,var(--gold) 10%,transparent)}',
        // rehber
        '.kc-liste{display:flex;flex-direction:column;gap:8px}',
        '.kc-hata{padding:0;overflow:hidden}.kc-hata.acik{border-color:var(--kc-vurgu);box-shadow:0 10px 30px -18px var(--kc-vurgu)}',
        '.kc-hata-bas{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 14px;border:0;background:transparent;color:var(--text-main);font:inherit;cursor:pointer}',
        '.kc-hata-ikon .kc-hedef{width:52px;height:52px}.kc-hata-m{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}.kc-hata-m b{font-size:14.5px}.kc-hata-ust{display:flex;gap:6px}.kc-ok{color:var(--text-muted);font-size:14px}',
        '.kc-adim-cip,.kc-cip{font-size:10px;font-weight:800;letter-spacing:.04em;padding:2px 8px;border-radius:99px;border:1px solid var(--border-color);color:var(--text-muted)}.kc-adim-cip{border-color:color-mix(in srgb,var(--kc-vurgu) 45%,transparent);color:var(--kc-vurgu)}',
        '.kc-hata-ic{display:grid;grid-template-columns:200px minmax(0,1fr);gap:16px;padding:2px 16px 16px}@media (max-width:640px){.kc-hata-ic{grid-template-columns:1fr}}',
        '.kc-gorseller{display:flex;flex-direction:column;gap:10px;align-items:center}.kc-ciz{width:100%;border-radius:12px;background:#f8fafc;padding:6px}.kc-ciz svg{width:100%;height:auto;display:block}',
        '.kc-ciz-hedef{display:flex;flex-direction:column;align-items:center;gap:4px}.kc-ciz-hedef .kc-hedef{width:140px;height:140px}.kc-ciz-hedef small{font-size:10.5px;color:var(--text-muted);text-align:center;line-height:1.35}',
        '.kc-bilgi{display:flex;flex-direction:column;gap:11px;font-size:13px;line-height:1.5}.kc-bilgi small{display:block;font-size:10px;font-weight:800;letter-spacing:.1em;color:var(--text-muted);margin-bottom:3px}',
        '.kc-soyle{border-radius:12px;padding:11px 13px;background:color-mix(in srgb,var(--kc-vurgu) 12%,transparent);border-left:0}.kc-soyle.ikna{background:color-mix(in srgb,var(--neon-green) 11%,transparent)}',
        '.kc-adimlar{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px}.kc-olcut{padding:9px 12px;border-radius:12px;border:1px dashed var(--border-color)}',
        // kurallar
        '.kc-kurallar-izgara{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px}',
        '.kc-kural{display:flex;gap:12px;padding:13px 14px;border-radius:14px;border:1px solid var(--border-color);background:var(--kc-yuzey)}.kc-kural>div{display:flex;flex-direction:column;gap:3px}.kc-kural b{font-size:13.5px}.kc-kural span{font-size:12.5px;color:var(--text-muted);line-height:1.45}',
        '.kc-kural-no{flex-shrink:0;width:32px;height:32px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:15px;background:linear-gradient(135deg,#5b21b6,#a21caf);color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.35)}',
        '.kc-donustur{display:flex;flex-direction:column}.kc-don{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;font-size:13px;padding:9px 0;border-top:1px solid var(--border-color)}.kc-don:first-child{border-top:0}.kc-don-ok{color:var(--text-muted)}@media (max-width:640px){.kc-don{grid-template-columns:1fr}.kc-don-ok{display:none}}',
        '.kc-deme{color:color-mix(in srgb,var(--neon-red) 80%,var(--text-main));text-decoration:line-through;text-decoration-thickness:1px}.kc-de{color:color-mix(in srgb,var(--neon-green) 85%,var(--text-main));font-weight:700}',
        '.kc-bos{padding:20px;text-align:center;color:var(--text-muted)}',
        // çocuğa göster (tam ekran)
        '.kc-goster{--kc-vurgu:#8b7fff;position:fixed;inset:0;z-index:30000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.4vh;padding:4vh 5vw;background:radial-gradient(900px 500px at 20% 0%,rgba(0,240,255,.16),transparent 60%),radial-gradient(900px 500px at 80% 100%,rgba(255,47,208,.14),transparent 60%),#0b0a14;color:#f1eef7;text-align:center}',
        '.kc-goster-kapat{position:absolute;top:16px;right:16px;width:48px;height:48px;border-radius:14px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#fff;font-size:20px;cursor:pointer}',
        '.kc-goster-ad{font-size:clamp(18px,2.4vw,30px);font-weight:800;opacity:.75}.kc-goster .kc-dongu-adim{color:rgba(255,255,255,.6);border-color:rgba(255,255,255,.18)}.kc-goster .kc-dongu-adim.aktif{color:#fff}',
        '.kc-goster-soz{font-size:clamp(26px,4.4vw,64px);font-weight:900;line-height:1.2;max-width:24ch;text-wrap:balance}',
        '.kc-goster-gorsel{display:flex;gap:4vw;align-items:center;justify-content:center;flex-wrap:wrap}.kc-goster-gorsel>div{display:flex;flex-direction:column;align-items:center;gap:6px}.kc-goster-gorsel svg{width:min(30vh,260px);height:auto}.kc-goster-gorsel>div:first-child svg{background:#f8fafc;border-radius:16px;padding:8px}.kc-goster-gorsel small{opacity:.6}',
        // milyon ok
        '.kc-yol-kap{padding:10px 8px 8px}.kc-yol{width:100%;height:auto;display:block;color:var(--text-main)}',
        '.kc-yol-zemin{fill:none;stroke:color-mix(in srgb,var(--text-main) 10%,transparent);stroke-width:22;stroke-linecap:round;stroke-linejoin:round}',
        '.kc-yol-serit{fill:none;stroke:color-mix(in srgb,var(--text-main) 30%,transparent);stroke-width:1.6;stroke-dasharray:6 8}',
        '.kc-yol-isik{fill:none;stroke:url(#kc-yol-isik);stroke-width:8;stroke-linecap:round;filter:drop-shadow(0 0 6px rgba(246,201,41,.6))}',
        '.kc-durak circle{fill:var(--bg-main);stroke:color-mix(in srgb,var(--text-main) 35%,transparent);stroke-width:2.5}.kc-durak.var circle{fill:#f6c929;stroke:#b8860b}',
        '.kc-durak text{font-size:11px;font-weight:800;fill:var(--text-muted)}.kc-durak.var text{fill:var(--text-main)}',
        '.kc-yolcu line{stroke:var(--g,#64748b);stroke-width:1.5;opacity:.7}.kc-yolcu circle{fill:var(--g,#64748b);stroke:#fff;stroke-width:2}.kc-yolcu text{font-size:11px;font-weight:900;fill:#fff}',
        '.kc-yol-not{font-size:11px;color:var(--text-muted);padding:0 8px}',
        '.kc-ozet{display:grid;grid-template-columns:1fr 1fr 2fr;gap:10px}@media (max-width:640px){.kc-ozet{grid-template-columns:1fr 1fr}.kc-ozet-grafik{grid-column:1/-1}}',
        '.kc-ozet>div{border:1px solid var(--border-color);border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;justify-content:center;background:var(--kc-yuzey)}.kc-ozet b{font-size:24px;font-weight:900;color:var(--kc-altin);font-variant-numeric:tabular-nums}.kc-ozet span{font-size:11px;color:var(--text-muted)}',
        '.kc-ozet-grafik .kc-cubuk{width:100%;margin-top:4px;color:var(--text-main)}',
        '.kc-mo{display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid var(--border-color);border-radius:14px;background:var(--kc-yuzey)}',
        '.kc-mo-sira{width:26px;height:26px;flex-shrink:0;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:var(--text-muted);background:color-mix(in srgb,var(--text-main) 7%,transparent)}',
        '.kc-mo-sira.s1{background:#f6c929;color:#3a2a00}.kc-mo-sira.s2{background:#cbd5e1;color:#1e293b}.kc-mo-sira.s3{background:#d4915a;color:#2a1405}',
        '.kc-mo-m{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}.kc-mo-m b{font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.kc-mo-m small{font-size:11px;color:var(--text-muted)}',
        '.kc-mo-bar{display:block;height:7px;border-radius:99px;background:color-mix(in srgb,var(--text-main) 12%,transparent);overflow:hidden}.kc-mo-bar i{display:block;height:100%;background:linear-gradient(90deg,#f6c929,#ff7a1a);border-radius:99px}',
        '.kc-mo-sag{display:flex;flex-direction:column;align-items:flex-end;gap:3px}.kc-mo-n{font-size:18px;font-weight:900;color:var(--kc-altin);font-variant-numeric:tabular-nums}.kc-mo-sag .kc-cubuk{width:96px;height:26px}',
        '.kc-madalyalar{display:flex;gap:4px;flex-wrap:wrap}.kc-madalya{display:inline-flex;align-items:center;gap:2px;font-size:10px;font-weight:800;color:var(--text-muted);opacity:.55}.kc-madalya svg{width:16px;height:16px}.kc-madalya.var{opacity:1;color:var(--kc-altin)}',
        '@media (max-width:520px){.kc-mo-sag .kc-cubuk{display:none}.kc-hero-sayi{align-items:flex-start}}',
        '.kc-hedef{display:block}',
        '.kc-dongu-k{display:flex;align-items:center;gap:3px}.kc-dongu-k span{flex:1;max-width:34px;height:6px;border-radius:99px;background:color-mix(in srgb,var(--text-main) 14%,transparent)}.kc-dongu-k span.once{background:color-mix(in srgb,var(--kc-vurgu,#8b7fff) 40%,transparent)}.kc-dongu-k span.aktif{background:var(--kc-vurgu,#8b7fff);box-shadow:0 0 10px var(--kc-vurgu,#8b7fff)}',
        '.kc-dongu-k b{margin-left:8px;font-size:11.5px;font-weight:800;white-space:nowrap}',
        '.kc-goster .kc-dongu-k{width:min(520px,90vw)}.kc-goster .kc-dongu-k span{max-width:none;height:9px;background:rgba(255,255,255,.18)}.kc-goster .kc-dongu-k span.aktif{background:var(--kc-vurgu)}.kc-goster .kc-dongu-k b{font-size:clamp(13px,1.6vw,18px)}',
        '.kc-ozet-grafik .kc-cubuk{height:96px}'
    ].join('\n');
    document.head.appendChild(st);
}
