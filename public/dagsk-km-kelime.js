/* ================================================================================================
   🔤 KELİME HEDEFİ — Karışık Sınıf (app.js'ten ayrıldı, 2026-09-29 "kademeli hafifletme").
   Yalnızca araç ilk açıldığında yüklenir (app.js kmSekme → kmEkCalistir). app.js genellerini kullanır.
   ================================================================================================ */
// ===== KARIŞIK SINIF — 🔤 KELİME HEDEFİ (2026-09-25) =====
// Kullanıcı Scrabble benzeri bir oyun ekran görüntüsü gönderdi, sonra "okçulukla bağlantılı,
// Mete Gazoz gibi falan yap, bakalım nasıl bir şey çıkacak" dedi. Kelime havuzu SADECE okçuluk
// terimleri (dev bir Türkçe sözlük gerekmiyor) → tahta bir bulmaca: kelimelerin yerleri ve
// ipuçları görünür, harfler gizli. Okçuluk bağı: sıradaki takım/sporcu GERÇEK serisini atar,
// eğitmen okları girer, seri yüzdesi kaç harf çekileceğini belirler; harf doğru kareye konur,
// kelimeyi tamamlayan bonus alır. v1 PROTOTİP: girilen oklar gerçek skor kayıtlarına YAZILMAZ
// (sadece oyun içi), durum localStorage'da konum başına. Tamamen ayrı araç — Oyunlar'ın tema
// dağıtım zincirlerine dokunmuyor.
const KM_KELIME_HAVUZ = [
    { k: 'OK', i: 'Yayla fırlatılan uçlu çubuk', b: 'Bir okun ucu, gövdesi (şaft), tüyleri ve çentiği vardır.' },
    { k: 'YAY', i: 'Oku fırlatan, kirişi gerilen alet', b: 'Yay, çekişte biriken enerjiyi bırakışta oka aktarır.' },
    { k: 'KİRİŞ', i: 'Yayın iki ucunu bağlayan, çekilen ip', b: 'Modern kirişler çoğunlukla sentetik liflerden yapılır.' },
    { k: 'SADAK', i: 'Okların taşındığı kılıf', b: 'Sadak belde, sırtta ya da yerde durabilir.' },
    { k: 'HEDEF', i: 'Renkli halkalardan oluşan atış yüzü', b: 'Olimpik hedef yüzünde 10 halka vardır; en içteki sarı halka 10 puandır.' },
    { k: 'NİŞAN', i: '… almak: yayı hedefe yöneltmek', b: 'Nişan alırken nişangahın hep aynı noktaya oturması gerekir.' },
    { k: 'TÜY', i: 'Okun arkasında uçuşu dengeleyen parça', b: 'Modern oklarda çoğunlukla gerçek tüy yerine plastik kanatçıklar kullanılır.' },
    { k: 'ÇENTİK', i: 'Okun kirişe takılan arka ucu', b: 'Çentik oku kirişe oturtur; kırık bir çentikle atış yapılmaz.' },
    { k: 'KABZA', i: 'Yayın elle tutulan orta kısmı', b: 'Kabzaya uygulanan baskı her atışta aynı olmalıdır.' },
    { k: 'ONLUK', i: 'Hedefin tam ortasındaki en değerli halka', b: 'Onluğun da içinde X halkası vardır; eşitlikte X sayısı belirleyicidir.' },
    { k: 'İSABET', i: 'Okun hedefi tam bulması', b: 'İsabet için gereken şey her atışı aynı şekilde tekrarlamaktır.' },
    { k: 'MENZİL', i: 'Atış mesafesi', b: 'Olimpiyatlarda klasik yayla 70 metreden atılır.' },
    { k: 'DURUŞ', i: 'Atışa başlarken ayakların ve gövdenin konumu', b: 'İyi atışın temeli sağlam bir duruştur: ağırlık iki ayağa dengeli dağılır.' },
    { k: 'ÇEKİŞ', i: 'Kirişi yüze kadar geri getirme hareketi', b: 'Kiriş her seferinde yüzde aynı noktaya getirilmelidir.' },
    { k: 'BIRAKIŞ', i: 'Kirişin parmaklardan salındığı an', b: 'İyi bir bırakışta parmaklar gevşer, el geriye doğru devam eder.' },
    { k: 'METEGAZOZ', g: 'METE GAZOZ', i: "Tokyo 2020'de olimpiyat şampiyonu olan okçumuz (ad soyad, bitişik)", b: "Mete Gazoz, 2021'de yapılan Tokyo 2020 Olimpiyatları'nda erkekler klasik yay bireyselde altın madalya kazandı — Türk okçuluğunun ilk olimpiyat madalyası." },
    { k: 'TOKYO', i: "Mete Gazoz'un altın kazandığı olimpiyat şehri", b: 'Tokyo 2020 Oyunları salgın nedeniyle 2021 yazında yapıldı.' },
    { k: 'KEMANKEŞ', i: "Osmanlı'da usta okçuya verilen ad", b: "Farsça 'keman' (yay) ve 'keş' (çeken) kelimelerinden: yay çeken, yani okçu." },
    { k: 'OKMEYDANI', i: "İstanbul'daki tarihi okçuluk alanı", b: "Okmeydanı'nda rekor atışların düştüğü yerler taşlarla işaretlenirdi." },
    { k: 'PUTA', i: 'Osmanlı okçuluğunda hedefe verilen ad', b: "Osmanlı okçuları hedefe 'puta' derdi." },
    { k: 'KLASİK', i: 'Olimpiyatlarda kullanılan yay türü', b: "Uçları hedefe doğru geriye kıvrık olduğu için bu yaya 'recurve' de denir." },
    { k: 'MAKARALI', i: 'Uçlarında makaraları olan modern yay', b: 'Makaralar sayesinde tam çekişte okçunun tuttuğu yük azalır.' },
    { k: 'NİŞANGAH', i: 'Yaya takılan, hedefe hizalanan aparat', b: 'Klasik yayda nişangah yayın önüne takılır ve hedefin ortasına hizalanır.' },
    { k: 'KOLLUK', i: 'Ön kolu kirişten koruyan aksesuar', b: 'Kolluk, bırakışta kirişin ön kola çarpmasını önler.' },
    { k: 'PARMAKLIK', i: 'Kirişi çeken parmakları koruyan deri', b: 'Parmaklık hem parmakları korur hem de bırakışı temizler.' },
    { k: 'ŞAFT', i: 'Okun gövdesi', b: 'Şaft karbon ya da alüminyum olabilir.' },
    { k: 'UÇ', i: 'Okun hedefe giren ön kısmı', b: 'Uç, okun ağırlık dengesini de belirler.' },
    { k: 'SERİ', i: 'Arka arkaya atılan ok grubu', b: 'Yarışmalarda bir seri genellikle 3 ya da 6 oktan oluşur.' },
    { k: 'ALTIN', i: 'Hedefin sarı merkezine verilen ad', b: "Hedefin sarı merkezine İngilizcede de 'gold', yani altın denir." },
    { k: 'MADALYA', i: 'Kürsüde boyuna takılan ödül', b: 'Bir gün kürsüde sen de olabilirsin! 🥇' },
    { k: 'OLİMPİYAT', i: 'Dört yılda bir yapılan büyük spor oyunları', b: 'Okçuluk olimpiyat programında yer alan sporlardandır.' },
    { k: 'RÜZGAR', i: 'Açık alanda oku yana sürükleyen hava hareketi', b: 'Okçular rüzgara göre nişan noktalarını ayarlar.' },
    { k: 'ODAK', i: 'Atış anında zihnin toplandığı nokta', b: 'Bir önceki oku düşünmeden yalnızca şimdiki atışa odaklanmak en zor becerilerden biridir.' },
    { k: 'NEFES', i: 'Atıştan önce kontrol edilen soluk', b: 'Sakin ve düzenli nefes, çekişi sabitler.' },
    { k: 'DAĞ', i: 'Kulübümüzün adı', b: 'DAĞ Spor Kulübü — tam burası! 🏹' },
    { k: 'EMNİYET', i: 'Atış hattında her şeyden önemli olan kural', b: "Atış hattında 'dur' komutu verildiğinde herkes yayını indirir." },
    { k: 'HAT', i: 'Okçuların dizildiği atış çizgisi', b: 'Herkes aynı hattan atar, oklar birlikte toplanır.' },
    { k: 'ATIŞ', i: 'Oku yaydan salma', b: 'Her atış bir öncekinin tekrarı olmalıdır.' },
    { k: 'SKOR', i: 'Seri sonunda toplanan sayı', b: 'Oklar en yüksekten en düşüğe doğru sırayla okunur.' },
    { k: 'ANTRENÖR', i: 'Sporcuya teknik öğreten kişi', b: 'Teknik hataları dışarıdan en iyi antrenör görür.' },
    { k: 'OKÇU', i: 'Ok atan sporcu', b: 'Okçuluk Türkiye’nin en köklü geleneksel sporlarındandır.' }
];
const KM_KELIME_PUAN = { A:1, E:1, 'İ':1, I:1, K:1, L:1, N:1, R:1, T:1, B:2, D:2, M:2, O:2, S:2, U:2, Y:2, C:3, 'Ç':3, G:3, H:3, P:3, 'Ş':3, Z:3, 'Ü':3, F:4, 'Ö':4, V:4, 'Ğ':5, J:5 };
const KM_KELIME_N = 13;
const KM_KELIME_TAKIM = [{ ad: 'Mavi', renk: '#38bdf8' }, { ad: 'Kırmızı', renk: '#fb7185' }, { ad: 'Sarı', renk: '#fbbf24' }, { ad: 'Mor', renk: '#a78bfa' }];
const KM_KELIME_RENK = ['#38bdf8', '#fb7185', '#fbbf24', '#a78bfa', '#34d399', '#f97316', '#22d3ee', '#e879f9'];
let _kmKelime = null, _kmKelimeYuklenenKonum = '__yuklenmedi__', _kmKelimeSeciliHarf = null, _kmKelimeOklar = [];
let _kmKelimeKurulum = { mod: 't2', ok: 3 };
const KM_KELIME_CSS = `
.km-kh-ust{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;flex-wrap:wrap}
.km-kh-baslik{font-weight:800;font-size:15px}
.km-kh-alt{font-size:11px;color:var(--text-secondary)}
.km-kh-yerlesim{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(290px,1fr);gap:14px;align-items:start}
@media (max-width:900px){.km-kh-yerlesim{grid-template-columns:minmax(0,1fr)}}
.km-kh-tahta-kutu{background:#15213b;border-radius:16px;padding:10px;box-shadow:0 14px 34px -18px rgba(0,0,0,.6)}
.km-kh-tahta{display:grid;gap:3px;width:100%;margin:0 auto;container-type:inline-size;max-width:min(100%,calc(620px * var(--oran,1)))}
.km-kh-h{aspect-ratio:1;border-radius:5px;position:relative;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:clamp(11px,2.2vw,21px);font-size:calc(100cqw / var(--kol,13) * .56);user-select:none;-webkit-user-select:none}
.km-kh-bos{background:rgba(255,255,255,.035)}
.km-kh-slot{background:#f3efe6}
.km-kh-slot.x2{background:#fcd34d}
.km-kh-slot.x3{background:#f9a8d4}
.km-kh-crp{font-size:clamp(6px,.85vw,9px);font-size:calc(100cqw / var(--kol,13) * .2);font-weight:800;color:rgba(50,35,10,.55)}
.km-kh-no{position:absolute;top:1px;left:3px;font-size:clamp(6px,.85vw,9px);font-size:calc(100cqw / var(--kol,13) * .2);font-weight:800;color:rgba(20,20,40,.6);line-height:1}
.km-kh-slot.aday{outline:3px solid #22d3ee;outline-offset:-2px;cursor:pointer;animation:kmKhAday 1s ease-in-out infinite}
@keyframes kmKhAday{50%{outline-color:#a5f3fc}}
.km-kh-tas{background:linear-gradient(180deg,#fbe7a8,#f2cf74);color:#2b2112;box-shadow:inset 0 -4px 0 var(--kc,#b58a2a)}
.km-kh-p{position:absolute;right:3px;bottom:3px;font-size:clamp(6px,.85vw,9px);font-size:calc(100cqw / var(--kol,13) * .2);font-weight:800;color:#5a4418}
.km-kh-tas.yeni{animation:kmKhYeni .45s cubic-bezier(.3,1.5,.4,1)}
@keyframes kmKhYeni{0%{transform:scale(.4)}100%{transform:scale(1)}}
.km-kh-panel{background:var(--bg-panel);border:1px solid var(--border-color);border-radius:14px;padding:12px;margin-bottom:10px}
.km-kh-panel-baslik{font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px}
.km-kh-oyuncu{display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:10px;border:1.5px solid transparent;margin-bottom:4px}
.km-kh-oyuncu.sirada{border-color:var(--kc);background:color-mix(in srgb,var(--kc) 14%,transparent)}
.km-kh-nokta{width:12px;height:12px;border-radius:50%;background:var(--kc);flex-shrink:0;display:inline-block}
.km-kh-oyuncu-ic{flex:1;min-width:0}
.km-kh-oyuncu-ad{font-weight:800;font-size:13px}
.km-kh-oyuncu-uye{font-size:10px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.km-kh-puan{font-weight:900;font-size:18px;font-variant-numeric:tabular-nums}
.km-kh-oklar{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px}
.km-kh-okbtn{min-height:44px;border-radius:9px;border:none;font-family:inherit;font-weight:900;font-size:14px;cursor:pointer}
.km-kh-girilen{display:flex;gap:5px;margin:8px 0;min-height:34px;align-items:center;flex-wrap:wrap}
.km-kh-girilen span{min-width:32px;height:32px;padding:0 4px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;background:var(--surface-2);font-size:13px}
.km-kh-btn{min-height:44px;border-radius:11px;border:none;font-family:inherit;font-weight:800;font-size:13.5px;padding:0 14px;cursor:pointer;background:var(--accent);color:#fff}
.km-kh-btn:disabled{opacity:.4;cursor:not-allowed}
.km-kh-btn.ikincil{background:var(--surface-2);color:var(--text-main);border:1px solid var(--border-color)}
.km-kh-raf{display:flex;gap:6px;flex-wrap:wrap;min-height:48px;align-items:center}
.km-kh-rtas{width:44px;height:46px;border-radius:8px;border:none;position:relative;font-family:inherit;font-weight:900;font-size:20px;cursor:pointer;background:linear-gradient(180deg,#fbe7a8,#f2cf74);color:#2b2112;box-shadow:inset 0 -4px 0 #b58a2a;transition:transform .12s}
.km-kh-rtas.secili{outline:3px solid #22d3ee;transform:translateY(-4px)}
.km-kh-rtas small{position:absolute;right:4px;bottom:4px;font-size:9px}
.km-kh-ipucu{font-size:12px;line-height:1.45;padding:5px 0;border-bottom:1px dashed var(--border-color);display:flex;gap:6px;align-items:baseline}
.km-kh-ipucu.tamam{opacity:.62}
.km-kh-bilgi{border-left:4px solid var(--accent);padding:9px 11px;border-radius:8px;background:var(--surface-2);font-size:12px;line-height:1.5}
.km-kh-log{font-size:11px;color:var(--text-muted);line-height:1.6}
.km-kh-secim{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.km-kh-secbtn{min-height:44px;padding:0 14px;border-radius:11px;border:1.5px solid var(--border-color);background:var(--bg-panel);color:var(--text-main);font-family:inherit;font-weight:800;font-size:13px;cursor:pointer}
.km-kh-secbtn.aktif{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
@media (prefers-reduced-motion: reduce){.km-kh-slot.aday,.km-kh-tas.yeni{animation:none}}
.km-kh-boyut{display:inline-flex;gap:2px;background:var(--surface-2);border:1px solid var(--border-color);border-radius:11px;padding:3px}
.km-kh-boyut button{min-height:38px;min-width:40px;border:none;border-radius:8px;background:transparent;color:var(--text-secondary);font-family:inherit;font-weight:900;cursor:pointer}
.km-kh-boyut button.aktif{background:var(--accent);color:#fff}
.km-kh-bil{margin-left:auto;flex-shrink:0;min-height:30px;padding:0 9px;border-radius:8px;border:1px solid var(--accent);background:var(--accent-soft);color:var(--accent);font-family:inherit;font-weight:800;font-size:11px;cursor:pointer}
.km-kh-atan{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-bottom:8px}.km-kh-atan button{min-height:32px;padding:0 10px;border-radius:999px;border:1px solid var(--border-color);background:transparent;color:var(--text-main);font-family:inherit;font-weight:800;font-size:12px;cursor:pointer}.km-kh-atan button.aktif{border-color:var(--accent);background:var(--accent-soft);color:var(--accent)}
.km-kh.boyut-tv .km-kh-atan button{font-size:15px;min-height:40px}
.km-kh-bonus{display:inline-flex;gap:4px;align-items:center;font-size:11px;font-weight:800;padding:3px 8px;border-radius:999px;background:rgba(255,210,63,.18);color:#e8b400;margin:2px 4px 2px 0}
.km-kh-tahmin-kutu{display:flex;gap:4px;flex-wrap:wrap;justify-content:center;margin:10px 0}
.km-kh-tahmin-kutu span{width:34px;height:38px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;background:#f3efe6;color:#2b2112}
.km-kh-tahmin-kutu span.acik{background:linear-gradient(180deg,#fbe7a8,#f2cf74)}
.km-kh-tahmin-input{width:100%;min-height:48px;font-family:inherit;font-weight:900;font-size:20px;letter-spacing:.12em;text-transform:uppercase;text-align:center;border-radius:11px;border:2px solid var(--border-color);background:var(--surface-2);color:var(--text-main)}
.km-kh-tahmin-input:focus{outline:none;border-color:var(--accent)}
/* Büyük ve TV modları — tahta ve harfler büyür, yan panel yazıları da okunur hale gelir. */
.km-kh.boyut-buyuk .km-kh-tahta{max-width:min(100%,calc(900px * var(--oran,1)))}
.km-kh.boyut-tv .km-kh-tahta{max-width:min(100%,calc((100vh - 240px) * var(--oran,1)))}
#km-icerik:fullscreen .km-kh.boyut-tv .km-kh-tahta{max-width:min(100%,calc((100vh - 130px) * var(--oran,1)))}
.km-kh.boyut-tv .km-kh-bil{font-size:14px;min-height:38px;padding:0 12px}
.km-kh.boyut-buyuk .km-kh-bil{font-size:12.5px;min-height:34px}
.km-kh.boyut-tv .km-kh-yerlesim{grid-template-columns:minmax(0,1.9fr) minmax(330px,1fr)}
.km-kh.boyut-buyuk .km-kh-ipucu{font-size:14.5px}
.km-kh.boyut-tv .km-kh-ipucu{font-size:17px;padding:7px 0}
.km-kh.boyut-buyuk .km-kh-oyuncu-ad{font-size:15px}
.km-kh.boyut-tv .km-kh-oyuncu-ad{font-size:19px}
.km-kh.boyut-buyuk .km-kh-puan{font-size:24px}
.km-kh.boyut-tv .km-kh-puan{font-size:32px}
.km-kh.boyut-tv .km-kh-oyuncu-uye{font-size:12px}
.km-kh.boyut-buyuk .km-kh-rtas{width:56px;height:58px;font-size:26px}
.km-kh.boyut-tv .km-kh-rtas{width:70px;height:72px;font-size:34px}
.km-kh.boyut-tv .km-kh-rtas small{font-size:12px}
.km-kh.boyut-buyuk .km-kh-okbtn{min-height:52px;font-size:17px}
.km-kh.boyut-tv .km-kh-okbtn{min-height:60px;font-size:20px}
.km-kh.boyut-tv .km-kh-panel{font-size:16px}
.km-kh.boyut-tv .km-kh-alt,.km-kh.boyut-tv .km-kh-log{font-size:14px}
.km-kh.boyut-tv .km-kh-bilgi{font-size:16px}
.km-kh.boyut-tv .km-kh-baslik{font-size:22px}
.km-kh.boyut-tv .km-kh-btn{min-height:52px;font-size:16px}
.km-kh.boyut-tv .km-kh-panel-baslik{font-size:13px}
#km-icerik:fullscreen{background:var(--bg-main,#15121F);padding:16px;overflow:auto}
`;
let _kmKelimeCssYuklendi = false;
function kmKelimeKaynaklarYukle() {
    if(_kmKelimeCssYuklendi) return; _kmKelimeCssYuklendi = true;
    let st = document.createElement('style'); st.id = 'km-kelime-style'; st.textContent = KM_KELIME_CSS;
    document.head.appendChild(st);
}
function kmKelimeAnahtar() { return 'dag_km_kelime_' + (_kmAktifKonum || 'varsayilan'); }
function kmKelimeKaydet() {
    try { if(_kmKelime) localStorage.setItem(kmKelimeAnahtar(), JSON.stringify(_kmKelime)); else localStorage.removeItem(kmKelimeAnahtar()); } catch(e) {}
}
function kmKelimeDurumEmin() {
    if(_kmKelimeYuklenenKonum === _kmAktifKonum) return;
    _kmKelimeYuklenenKonum = _kmAktifKonum; _kmKelime = null; _kmKelimeSeciliHarf = null; _kmKelimeOklar = [];
    try { let v = JSON.parse(localStorage.getItem(kmKelimeAnahtar()) || 'null'); if(v && v.v === 1 && v.hucre) _kmKelime = v; } catch(e) {}
}
function kmKelimeKaristir(a) { for(let i = a.length - 1; i > 0; i--) { let j = Math.floor(Math.random() * (i + 1)); let t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function kmKelimeHucreler(w) { let out = []; for(let k = 0; k < w.k.length; k++) out.push((w.r + (w.yon === 'd' ? k : 0)) + ',' + (w.c + (w.yon === 'y' ? k : 0))); return out; }
// Bulmaca üretimi — klasik açgözlü çapraz bulmaca yerleşimi: her kelime mevcut bir harften
// dik kesişerek yerleşir; yanyana değme/uç uca eklenme yasak (yanlış "kelime" oluşmasın).
function kmKelimeSigar(grid, w, sr, sc, yon) {
    const N = KM_KELIME_N, dr = yon === 'd' ? 1 : 0, dc = yon === 'y' ? 1 : 0;
    let ic = function(r, c) { return r >= 0 && c >= 0 && r < N && c < N; };
    let er = sr + dr * (w.length - 1), ec = sc + dc * (w.length - 1);
    if(!ic(sr, sc) || !ic(er, ec)) return 0;
    if(ic(sr - dr, sc - dc) && grid[sr - dr][sc - dc]) return 0;
    if(ic(er + dr, ec + dc) && grid[er + dr][ec + dc]) return 0;
    let kes = 0;
    for(let k = 0; k < w.length; k++) {
        let r = sr + dr * k, c = sc + dc * k, h = grid[r][c];
        if(h) { if(h.h !== w[k] || h[yon]) return 0; kes++; }
        else {
            if(ic(r + dc, c + dr) && grid[r + dc][c + dr]) return 0;
            if(ic(r - dc, c - dr) && grid[r - dc][c - dr]) return 0;
        }
    }
    return kes === w.length ? 0 : kes;
}
function kmKelimeYerlestir(grid, w, sr, sc, yon) {
    let dr = yon === 'd' ? 1 : 0, dc = yon === 'y' ? 1 : 0;
    for(let k = 0; k < w.length; k++) { let r = sr + dr * k, c = sc + dc * k; if(!grid[r][c]) grid[r][c] = { h: w[k], y: false, d: false }; grid[r][c][yon] = true; }
}
function kmKelimeBulmacaUret() {
    const N = KM_KELIME_N; let enIyi = null;
    for(let deneme = 0; deneme < 80; deneme++) {
        let aday = kmKelimeKaristir(KM_KELIME_HAVUZ.filter(function(w) { return Array.from(w.k).length <= 11; }).slice());
        let grid = []; for(let r = 0; r < N; r++) grid.push(new Array(N).fill(null));
        let ilk = aday.slice(0, 6).reduce(function(a, b) { return Array.from(b.k).length > Array.from(a.k).length ? b : a; });
        aday.splice(aday.indexOf(ilk), 1);
        let ilkH = Array.from(ilk.k), r0 = Math.floor(N / 2), c0 = Math.floor((N - ilkH.length) / 2);
        kmKelimeYerlestir(grid, ilkH, r0, c0, 'y');
        let yer = [{ w: ilk, r: r0, c: c0, yon: 'y' }];
        for(let a = 0; a < aday.length && yer.length < 10; a++) {
            let w = Array.from(aday[a].k), en = null;
            for(let r = 0; r < N; r++) for(let c = 0; c < N; c++) {
                let hc = grid[r][c]; if(!hc) continue;
                for(let i = 0; i < w.length; i++) {
                    if(w[i] !== hc.h) continue;
                    ['y', 'd'].forEach(function(yon) {
                        let sr = yon === 'y' ? r : r - i, sc = yon === 'y' ? c - i : c;
                        let kes = kmKelimeSigar(grid, w, sr, sc, yon); if(!kes) return;
                        let mr = sr + (yon === 'd' ? w.length / 2 : 0), mc = sc + (yon === 'y' ? w.length / 2 : 0);
                        let skor = kes * 10 - Math.abs(mr - N / 2) - Math.abs(mc - N / 2) + Math.random();
                        if(!en || skor > en.skor) en = { sr: sr, sc: sc, yon: yon, skor: skor };
                    });
                }
            }
            if(en) { kmKelimeYerlestir(grid, w, en.sr, en.sc, en.yon); yer.push({ w: aday[a], r: en.sr, c: en.sc, yon: en.yon }); }
        }
        if(!enIyi || yer.length > enIyi.yer.length) enIyi = { grid: grid, yer: yer };
        if(yer.length >= 9) break;
    }
    return enIyi && enIyi.yer.length >= 5 ? enIyi : null;
}
function kmKelimeOyunculariKur(mod) {
    let roster = (_kmListe || []).map(function(k) { return k.ad; });
    if(mod === 'b') return roster.map(function(ad, i) { return { ad: ad, renk: KM_KELIME_RENK[i % KM_KELIME_RENK.length], puan: 0, raf: [], uyeler: [] }; });
    let n = parseInt(mod.slice(1), 10) || 2;
    let takimlar = KM_KELIME_TAKIM.slice(0, n).map(function(t) { return { ad: t.ad + ' Takım', renk: t.renk, puan: 0, raf: [], uyeler: [] }; });
    roster.forEach(function(ad, i) { takimlar[i % n].uyeler.push(ad); });
    return takimlar;
}
function kmKelimeBaslat() {
    let oyuncular = kmKelimeOyunculariKur(_kmKelimeKurulum.mod);
    if(!oyuncular.length) { showToast('Bu derste sporcu yok — takım modunu seç ya da derse sporcu ekle.', 'warning'); return; }
    let b = kmKelimeBulmacaUret();
    if(!b) { showToast('Bulmaca üretilemedi, tekrar dene.', 'error'); return; }
    let hucre = {}, sinir = { minR: 99, maxR: -1, minC: 99, maxC: -1 };
    for(let r = 0; r < KM_KELIME_N; r++) for(let c = 0; c < KM_KELIME_N; c++) {
        let g = b.grid[r][c]; if(!g) continue;
        hucre[r + ',' + c] = { h: g.h, carpan: 1, acik: false, koyan: null };
        sinir.minR = Math.min(sinir.minR, r); sinir.maxR = Math.max(sinir.maxR, r); sinir.minC = Math.min(sinir.minC, c); sinir.maxC = Math.max(sinir.maxC, c);
    }
    let kelimeler = b.yer.map(function(p) { return { k: Array.from(p.w.k), g: p.w.g || p.w.k, i: p.w.i, b: p.w.b, r: p.r, c: p.c, yon: p.yon, tamamlayan: null, no: 0 }; });
    let baslar = []; kelimeler.forEach(function(w) { let key = w.r + ',' + w.c; if(baslar.indexOf(key) === -1) baslar.push(key); });
    baslar.sort(function(a, b2) { let pa = a.split(',').map(Number), pb = b2.split(',').map(Number); return pa[0] - pb[0] || pa[1] - pb[1]; });
    let numara = {}; baslar.forEach(function(k, i) { numara[k] = i + 1; });
    kelimeler.forEach(function(w) { w.no = numara[w.r + ',' + w.c]; });
    let anahtarlar = kmKelimeKaristir(Object.keys(hucre).slice());
    anahtarlar.slice(0, 5).forEach(function(k) { hucre[k].carpan = 2; });
    anahtarlar.slice(5, 7).forEach(function(k) { hucre[k].carpan = 3; });
    _kmKelime = {
        v: 1, hucre: hucre, kelimeler: kelimeler, numara: numara, sinir: sinir,
        torba: kmKelimeKaristir(Object.keys(hucre).map(function(k) { return hucre[k].h; })),
        oyuncular: oyuncular, sira: 0, tur: 1, faz: 'atis', ok: _kmKelimeKurulum.ok,
        log: ['🧩 Bulmaca hazır — ' + kelimeler.length + ' okçuluk kelimesi saklı!'], sonKelime: null, sonKoyulan: null
    };
    _kmKelimeSeciliHarf = null; _kmKelimeOklar = [];
    kmKelimeKaydet(); kmKelimeCiz();
}
function kmKelimeHarfSayisi(toplam, ok) {
    if(toplam <= 0) return 0;
    let p = toplam / (ok * 10);
    return p >= 0.9 ? 4 : p >= 0.7 ? 3 : p >= 0.45 ? 2 : 1;
}
function kmKelimeOkRenk(v) {
    if(v === 'X' || v === 10 || v === 9) return 'background:#ffd23f;color:#1a1400';
    if(v === 8 || v === 7) return 'background:#ef4444;color:#fff';
    if(v === 6 || v === 5) return 'background:#3b82f6;color:#fff';
    if(v === 4 || v === 3) return 'background:#1f2937;color:#fff;border:1px solid #475569';
    if(v === 2 || v === 1) return 'background:#f3f4f6;color:#111';
    return 'background:#64748b;color:#fff';
}
function kmKelimeOkDeger(v) { return v === 'X' ? 10 : (v === 'M' ? 0 : v); }
function kmKelimeOkEkle(v) {
    if(!_kmKelime || _kmKelime.faz !== 'atis') return;
    if(_kmKelimeOklar.length >= _kmKelime.ok) return;
    _kmKelimeOklar.push(v); kmKelimeCiz();
}
function kmKelimeOkSil() { _kmKelimeOklar.pop(); kmKelimeCiz(); }
// Bonus harfler (2026-09-25, kullanıcı: "X atan ya da 2 sarı atan ekipte ekstra harf ver"):
// seride en az bir X → +1, en az iki sarı (X/10/9) → +1; ikisi birden olursa +2.
function kmKelimeCekimHesap(oklar, ok) {
    let toplam = oklar.reduce(function(a, v) { return a + kmKelimeOkDeger(v); }, 0);
    let taban = kmKelimeHarfSayisi(toplam, ok);
    let xVar = oklar.indexOf('X') !== -1;
    let sari = oklar.filter(function(v) { return v === 'X' || v === 10 || v === 9; }).length;
    let bonuslar = [];
    if(xVar) bonuslar.push('🎯 X');
    if(sari >= 2) bonuslar.push('🟡 ' + sari + ' sarı');
    return { toplam: toplam, taban: taban, bonus: bonuslar.length, bonuslar: bonuslar, adet: taban + bonuslar.length };
}
// Gerçek skora yazma (2026-09-25, "Kelime Hedefi'ndeki oklar sporcunun kayıtlarına geçmiyor"):
// bireyselde atan = oyuncunun kendisi; takımda atan, takım üyeleri arasında sırayla döner (o.atan
// indeksi), koç "Atan" çiplerinden değiştirebilir. Kayıt Oyunlar'ın İlerlet'iyle AYNI çekirdekten
// (_skorKaydetCekirdek) geçer — klasman, yoklama, senkron aynı şekilde güncellenir.
function kmKelimeAtanAd(o) {
    if(!o) return null;
    if(!o.uyeler || !o.uyeler.length) return o.ad;
    let idx = (o.atan || 0) % o.uyeler.length;
    return o.uyeler[idx];
}
function kmKelimeAtanSec(idx) {
    let s = _kmKelime; if(!s) return;
    let o = s.oyuncular[s.sira]; if(!o || !o.uyeler || !o.uyeler.length) return;
    o.atan = idx; kmKelimeKaydet(); kmKelimeCiz();
}
function kmKelimeGercekKaydet(ad, oklar) {
    let kisi = (_kmListe || []).find(function(k) { return k.ad === ad; });
    if(!kisi) return { ok: false, mesaj: ad + ' bu derste bulunamadı — skor kayda yazılmadı.' };
    let sonuc;
    try { sonuc = _skorKaydetCekirdek(kisi.g, kisi.ad, oklar.map(function(v) { return { puan: String(v) }; })); }
    catch(e) { return { ok: false, mesaj: 'Skor kayda yazılamadı: ' + e.message }; }
    if(!sonuc || !sonuc.ok) return { ok: false, mesaj: sonuc && sonuc.sebep === 'limit-doldu' ? kmOyunIlkAd(ad) + ' için günlük seri limiti dolu — oyun devam ediyor ama skor kayda yazılmadı.' : ad + ' kaydı bulunamadı — skor kayda yazılmadı.' };
    try { klasmanDoldur(); } catch(e) {}
    try { otomatikYoklamaIsaretle(kisi.ad); } catch(e) {}
    try { kmKusakPuanEkle(kisi.g, kisi.ad, sonuc.seriPuan); } catch(e) {}
    return { ok: true };
}
function kmKelimeHarfCek() {
    let s = _kmKelime; if(!s || s.faz !== 'atis' || _kmKelimeOklar.length < s.ok) return;
    let o = s.oyuncular[s.sira];
    let atan = kmKelimeAtanAd(o);
    let kayit = kmKelimeGercekKaydet(atan, _kmKelimeOklar);
    if(!kayit.ok) showToast(kayit.mesaj, 'warning');
    if(o.uyeler && o.uyeler.length) o.atan = ((o.atan || 0) + 1) % o.uyeler.length; // takımda sıradaki üye
    let h = kmKelimeCekimHesap(_kmKelimeOklar, s.ok);
    let n = Math.min(h.adet, s.torba.length);
    let cekilen = s.torba.splice(0, n);
    Array.prototype.push.apply(o.raf, cekilen);
    s.log.unshift(o.ad + (o.uyeler && o.uyeler.length ? ' (' + kmOyunIlkAd(atan) + ')' : '') + ': ' + h.toplam + ' puan' + (kayit.ok ? ' ✓' : '') + ' → ' + (n ? n + ' harf' + (h.bonus ? ' (' + h.bonuslar.join(', ') + ' bonusu dahil)' : '') + ': ' + cekilen.join(' ') : 'harf yok, ıska!'));
    s.faz = 'yerlestir'; _kmKelimeOklar = []; _kmKelimeSeciliHarf = null;
    if(h.bonus) showToast('✨ Bonus! ' + h.bonuslar.join(' + ') + ' → toplam ' + n + ' harf', 'success');
    else if(n >= 4) showToast('🎯 Altın seri! ' + n + ' harf çekildi', 'success');
    kmKelimeKaydet(); kmKelimeCiz();
}
function kmKelimeHarfSec(i) { _kmKelimeSeciliHarf = (_kmKelimeSeciliHarf === i) ? null : i; kmKelimeCiz(); }
// Tamamlanan kelimeleri kredilendir + oyun bitti mi — hem harf yerleştirme hem "Kelimeyi Bil" kullanıyor.
function kmKelimeTamamlamaKontrol(ekBonus) {
    let s = _kmKelime, o = s.oyuncular[s.sira], tamamlanan = [];
    s.kelimeler.forEach(function(w, wi) {
        if(w.tamamlayan !== null) return;
        if(kmKelimeHucreler(w).every(function(k) { return s.hucre[k].acik; })) { w.tamamlayan = s.sira; o.puan += 10; tamamlanan.push(wi); }
    });
    if(tamamlanan.length) {
        s.sonKelime = tamamlanan[tamamlanan.length - 1];
        let adlar = tamamlanan.map(function(wi) { return s.kelimeler[wi].g; }).join(', ');
        let kazanc = 10 * tamamlanan.length + (ekBonus || 0);
        s.log.unshift('🎯 ' + o.ad + ' tamamladı: ' + adlar + ' (+' + kazanc + ')');
        showToast('🎯 ' + adlar + ' tamamlandı! +' + kazanc, 'success');
        try { sesCal(880, 0.12); } catch(e) {}
    }
    if(Object.keys(s.hucre).every(function(k) { return s.hucre[k].acik; })) {
        s.faz = 'bitti';
        let enY = Math.max.apply(null, s.oyuncular.map(function(x) { return x.puan; }));
        let kaz = s.oyuncular.filter(function(x) { return x.puan === enY; }).map(function(x) { return x.ad; }).join(' & ');
        s.log.unshift('🏆 Bulmaca bitti! Kazanan: ' + kaz + ' (' + enY + ' puan)');
    }
}
function kmKelimeHucreTikla(key) {
    let s = _kmKelime; if(!s || s.faz === 'bitti') return;
    let o = s.oyuncular[s.sira], i = _kmKelimeSeciliHarf; if(i === null || i === undefined) return;
    let harf = o.raf[i], h = s.hucre[key];
    if(!h || h.acik || h.h !== harf) return;
    h.acik = true; h.koyan = s.sira; o.raf.splice(i, 1); _kmKelimeSeciliHarf = null; s.sonKoyulan = key;
    o.puan += (KM_KELIME_PUAN[harf] || 1) * (h.carpan || 1);
    kmKelimeTamamlamaKontrol(0);
    kmKelimeKaydet(); kmKelimeCiz();
}
function kmKelimeSiraBitir() {
    let s = _kmKelime; if(!s || s.faz === 'bitti') return;
    let n = s.oyuncular.length;
    for(let adim = 0; adim < n; adim++) {
        s.sira = (s.sira + 1) % n; if(s.sira === 0) s.tur++;
        if(s.torba.length || s.oyuncular[s.sira].raf.length) break;
    }
    s.faz = s.torba.length ? 'atis' : 'yerlestir';
    s.tahminYapildi = false;
    _kmKelimeOklar = []; _kmKelimeSeciliHarf = null;
    kmKelimeKaydet(); kmKelimeCiz();
}
// 💡 KELİMEYİ BİL (2026-09-25): sıradaki takım bir ipucunun cevabını yazar. Doğruysa kelimenin
// kalan harfleri anında açılır (harf puanları + kelime +10 + bilgi bonusu +5); yanlışsa sıra geçer.
// Sırada bir kere. Açılan hücrelerin harfleri torbadan (yoksa raflardan) düşülür — "her raf
// harfinin tahtada boş bir yeri var" kuralı bozulmasın, kimse takılı kalmasın.
function kmKelimeTahminAc(wi) {
    let s = _kmKelime; if(!s || s.faz === 'bitti' || s.tahminYapildi) return;
    let w = s.kelimeler[wi]; if(!w || w.tamamlayan !== null) return;
    let kutu = kmKelimeHucreler(w).map(function(k) { let h = s.hucre[k]; return `<span class="${h.acik ? 'acik' : ''}">${h.acik ? h.h : ''}</span>`; }).join('');
    let eski = document.getElementById('km-kh-tahmin-modal'); if(eski) eski.remove();
    let m = document.createElement('div');
    m.id = 'km-kh-tahmin-modal'; m.className = 'modal-overlay'; m.style.display = 'flex';
    m.innerHTML = `<div class="modal-content glass-panel" style="max-width:460px; width:100%;">
        <div style="font-size:16px; font-weight:900; margin-bottom:4px;">💡 Kelimeyi Bil — ${esc(s.oyuncular[s.sira].ad)}</div>
        <div style="font-size:13px; color:var(--text-secondary);"><b>${w.no}. ${w.yon === 'y' ? 'Yatay' : 'Dikey'}:</b> ${esc(w.i)} (${w.k.length} harf)</div>
        <div class="km-kh-tahmin-kutu">${kutu}</div>
        <input id="km-kh-tahmin-input" class="km-kh-tahmin-input" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="${w.k.length + 4}" placeholder="Cevabı yaz" onkeydown="if(event.key==='Enter') kmKelimeTahminKontrol(${wi})">
        <div style="font-size:11px; color:var(--text-muted); margin:8px 0 12px;">Doğru: kalan harfler açılır, +5 bilgi bonusu. Yanlış: sıra geçer. Sırada bir kez kullanılabilir.</div>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button class="km-kh-btn ikincil" onclick="document.getElementById('km-kh-tahmin-modal').remove()">Vazgeç</button>
            <button class="km-kh-btn" onclick="kmKelimeTahminKontrol(${wi})">Kontrol Et</button>
        </div>
    </div>`;
    m.addEventListener('click', function(ev) { if(ev.target === m) m.remove(); });
    (document.getElementById('km-icerik') || document.body).appendChild(m);
    setTimeout(function() { let inp = document.getElementById('km-kh-tahmin-input'); if(inp) inp.focus(); }, 30);
}
function kmKelimeTahminKontrol(wi) {
    let s = _kmKelime; if(!s || s.faz === 'bitti' || s.tahminYapildi) return;
    let w = s.kelimeler[wi]; if(!w || w.tamamlayan !== null) return;
    let inp = document.getElementById('km-kh-tahmin-input'); if(!inp) return;
    let tahmin = inp.value.toLocaleUpperCase('tr-TR').replace(/[^A-ZÇĞİIÖŞÜ]/g, '');
    if(!tahmin) { inp.focus(); return; }
    let modal = document.getElementById('km-kh-tahmin-modal'); if(modal) modal.remove();
    let o = s.oyuncular[s.sira];
    s.tahminYapildi = true;
    if(tahmin === w.k.join('')) {
        let kazanc = 0;
        kmKelimeHucreler(w).forEach(function(k) {
            let h = s.hucre[k]; if(h.acik) return;
            h.acik = true; h.koyan = s.sira; s.sonKoyulan = k;
            kazanc += (KM_KELIME_PUAN[h.h] || 1) * (h.carpan || 1);
            let ti = s.torba.indexOf(h.h);
            if(ti !== -1) { s.torba.splice(ti, 1); return; }
            let sahip = [s.sira].concat(s.oyuncular.map(function(_, pi) { return pi; }).filter(function(pi) { return pi !== s.sira; }));
            for(let q = 0; q < sahip.length; q++) { let raf = s.oyuncular[sahip[q]].raf, ri = raf.indexOf(h.h); if(ri !== -1) { raf.splice(ri, 1); break; } }
        });
        o.puan += kazanc + 5;
        s.log.unshift('💡 ' + o.ad + ' kelimeyi bildi: ' + w.g + ' (+' + (kazanc + 5) + ' harf ve bilgi puanı)');
        _kmKelimeSeciliHarf = null;
        kmKelimeTamamlamaKontrol(kazanc + 5);
        kmKelimeKaydet(); kmKelimeCiz();
    } else {
        s.log.unshift('❌ ' + o.ad + ' yanlış tahmin (' + tahmin + ') — sıra geçti');
        showToast('❌ Yanlış tahmin — sıra geçiyor', 'warning');
        kmKelimeSiraBitir();
    }
}
let _kmKelimeBoyut = (function() { try { return localStorage.getItem('dag_km_kelime_boyut') || 'normal'; } catch(e) { return 'normal'; } })();
function kmKelimeBoyutSec(b) { _kmKelimeBoyut = b; try { localStorage.setItem('dag_km_kelime_boyut', b); } catch(e) {} kmKelimeCiz(); }
// Tam ekran #km-icerik'e uygulanıyor (her çizimde yeniden kurulan iç kök değil) — yoksa ilk
// yeniden çizimde tam ekrandan düşerdi. Tam ekrana girerken boyut "normal"se TV'ye geçer.
function kmKelimeTamEkran() {
    let el = document.getElementById('km-icerik'); if(!el) return;
    if(document.fullscreenElement) { try { document.exitFullscreen(); } catch(e) {} return; }
    if(_kmKelimeBoyut === 'normal') kmKelimeBoyutSec('tv');
    try { let p = el.requestFullscreen ? el.requestFullscreen() : (el.webkitRequestFullscreen ? el.webkitRequestFullscreen() : null); if(p && p.catch) p.catch(function() {}); } catch(e) {}
}
function kmKelimeYeniOyun() {
    onayIste('Bulmaca sıfırlansın mı?<br><br>Bu oyunun puanları ve tahtası silinir. Gerçek skor/klasman ETKİLENMEZ.', function() {
        _kmKelime = null; _kmKelimeSeciliHarf = null; _kmKelimeOklar = []; kmKelimeKaydet(); kmKelimeCiz();
    }, 'Evet, Yeni Oyun');
}
function kmKelimeKurulumSec(alan, deger) { _kmKelimeKurulum[alan] = deger; kmKelimeCiz(); }
function kmKelimeBilgiGoster(wi) { if(_kmKelime && _kmKelime.kelimeler[wi] && _kmKelime.kelimeler[wi].tamamlayan !== null) { _kmKelime.sonKelime = wi; kmKelimeKaydet(); kmKelimeCiz(); } }
function kmKelimeCiz() {
    kmKelimeKaynaklarYukle(); kmKelimeDurumEmin();
    let ic = document.getElementById('km-icerik'); if(!ic) return;
    if(!_kmKelime) { ic.innerHTML = kmKelimeKurulumHTML(); return; }
    ic.innerHTML = kmKelimeOyunHTML();
}
function kmKelimeKurulumHTML() {
    let k = _kmKelimeKurulum;
    let modlar = [['t2', '2 Takım'], ['t3', '3 Takım'], ['t4', '4 Takım'], ['b', 'Herkes Tek']].map(function(m) {
        return `<button class="km-kh-secbtn${k.mod === m[0] ? ' aktif' : ''}" onclick="kmKelimeKurulumSec('mod','${m[0]}')">${m[1]}</button>`;
    }).join('');
    let oklar = [3, 6].map(function(n) { return `<button class="km-kh-secbtn${k.ok === n ? ' aktif' : ''}" onclick="kmKelimeKurulumSec('ok',${n})">${n} ok</button>`; }).join('');
    let onizleme = kmKelimeOyunculariKur(k.mod).map(function(o) {
        return `<div class="km-kh-oyuncu" style="--kc:${o.renk}"><span class="km-kh-nokta"></span><div class="km-kh-oyuncu-ic"><div class="km-kh-oyuncu-ad">${esc(o.ad)}</div>${o.uyeler.length ? `<div class="km-kh-oyuncu-uye">${esc(o.uyeler.join(', '))}</div>` : ''}</div></div>`;
    }).join('') || '<div class="km-kh-alt">Bu derste henüz sporcu yok.</div>';
    return `<div class="km-kh boyut-${_kmKelimeBoyut}">
        <button class="km-kh-btn ikincil" style="margin-bottom:12px;" onclick="kmSekme('oyunlar')">← Oyunlar</button>
        <div class="km-kh-baslik">🔤 Kelime Hedefi — Okçuluk Bulmacası</div>
        <div class="km-kh-alt" style="margin:4px 0 14px; max-width:640px;">Tahtada okçuluk kelimeleri saklı (Mete Gazoz, sadak, kiriş…). Sıradaki takım gerçek serisini atar, okları buraya girersin; seri ne kadar iyiyse o kadar harf çekerler. Harfleri ipuçlarına bakarak doğru karelere koyarlar — kelimeyi tamamlayan +10 alır. X atan ve en az 2 sarı atan ekstra harf kazanır; cevabı bilen takım 💡 Bil ile kelimeyi tek hamlede açabilir. Oyun içi puanlar gerçek skora yazılmaz.</div>
        <div class="km-kh-panel-baslik">Kim oynuyor?</div>
        <div class="km-kh-secim">${modlar}</div>
        <div class="km-kh-panel-baslik">Seri kaç ok?</div>
        <div class="km-kh-secim">${oklar}</div>
        <div class="km-kh-panel" style="max-width:520px;">${onizleme}</div>
        <button class="km-kh-btn" onclick="kmKelimeBaslat()">▶ Bulmacayı Oluştur ve Başla</button>
    </div>`;
}
function kmKelimeOyunHTML() {
    let s = _kmKelime, o = s.oyuncular[s.sira], sn = s.sinir;
    let secHarf = (_kmKelimeSeciliHarf !== null && o.raf[_kmKelimeSeciliHarf] !== undefined) ? o.raf[_kmKelimeSeciliHarf] : null;
    let hucreHTML = '';
    for(let r = sn.minR; r <= sn.maxR; r++) for(let c = sn.minC; c <= sn.maxC; c++) {
        let key = r + ',' + c, h = s.hucre[key];
        if(!h) { hucreHTML += '<div class="km-kh-h km-kh-bos"></div>'; continue; }
        let no = s.numara[key] ? `<span class="km-kh-no">${s.numara[key]}</span>` : '';
        if(h.acik) {
            let renk = s.oyuncular[h.koyan] ? s.oyuncular[h.koyan].renk : '#b58a2a';
            hucreHTML += `<div class="km-kh-h km-kh-tas${key === s.sonKoyulan ? ' yeni' : ''}" style="--kc:${renk}">${no}${h.h}<span class="km-kh-p">${KM_KELIME_PUAN[h.h] || 1}</span></div>`;
        } else {
            let aday = secHarf !== null && h.h === secHarf;
            let crp = h.carpan > 1 ? `<span class="km-kh-crp">H×${h.carpan}</span>` : '';
            hucreHTML += `<div class="km-kh-h km-kh-slot${h.carpan > 1 ? ' x' + h.carpan : ''}${aday ? ' aday' : ''}"${aday ? ` onclick="kmKelimeHucreTikla('${key}')"` : ''}>${no}${crp}</div>`;
        }
    }
    let kolon = sn.maxC - sn.minC + 1, satir = sn.maxR - sn.minR + 1;
    let oyuncuHTML = s.oyuncular.map(function(p, pi) {
        return `<div class="km-kh-oyuncu${pi === s.sira && s.faz !== 'bitti' ? ' sirada' : ''}" style="--kc:${p.renk}"><span class="km-kh-nokta"></span><div class="km-kh-oyuncu-ic"><div class="km-kh-oyuncu-ad">${pi === s.sira && s.faz !== 'bitti' ? '▶ ' : ''}${esc(p.ad)}</div>${p.uyeler.length ? `<div class="km-kh-oyuncu-uye">${esc(p.uyeler.map(kmOyunIlkAd).join(', '))}</div>` : ''}</div><div class="km-kh-puan">${p.puan}</div></div>`;
    }).join('');
    let sira = '';
    if(s.faz === 'bitti') {
        sira = `<div style="font-weight:900; font-size:16px; margin-bottom:8px;">🏆 Bulmaca tamamlandı!</div><div class="km-kh-alt" style="margin-bottom:10px;">${esc(s.log[0] || '')}</div><button class="km-kh-btn" onclick="kmKelimeYeniOyun()">🔄 Yeni Bulmaca</button>`;
    } else if(s.faz === 'atis' && s.torba.length) {
        let tamamMi = _kmKelimeOklar.length >= s.ok;
        let hesap = kmKelimeCekimHesap(_kmKelimeOklar, s.ok), toplam = hesap.toplam;
        let harfN = Math.min(hesap.adet, s.torba.length);
        let bonusRozet = hesap.bonuslar.map(function(b) { return `<span class="km-kh-bonus">+1 ${b}</span>`; }).join('');
        let girilen = _kmKelimeOklar.map(function(v) { return `<span style="${kmKelimeOkRenk(v)}">${v}</span>`; }).join('') + (tamamMi ? '' : `<span style="opacity:.45;">${_kmKelimeOklar.length + 1}. ok</span>`);
        let pad = ['X', 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 'M'].map(function(v) { return `<button class="km-kh-okbtn" style="${kmKelimeOkRenk(v)}" onclick="kmKelimeOkEkle(${typeof v === 'string' ? "'" + v + "'" : v})"${tamamMi ? ' disabled' : ''}>${v}</button>`; }).join('');
        let atanAd = kmKelimeAtanAd(o);
        let atanHTML = (o.uyeler && o.uyeler.length) ? `<div class="km-kh-atan"><span class="km-kh-alt">Atan:</span>${o.uyeler.map(function(u, ui) { return `<button class="${u === atanAd ? 'aktif' : ''}" onclick="kmKelimeAtanSec(${ui})">${esc(kmOyunIlkAd(u))}</button>`; }).join('')}</div>` : '';
        sira = `<div style="font-weight:800; margin-bottom:6px;">🏹 ${esc(o.uyeler && o.uyeler.length ? kmOyunIlkAd(atanAd) + ' (' + o.ad + ')' : o.ad)} serisini atsın — okları gir</div>
            ${atanHTML}
            <div class="km-kh-girilen">${girilen}${_kmKelimeOklar.length ? `<button class="km-kh-btn ikincil" style="min-height:32px; padding:0 10px;" onclick="kmKelimeOkSil()">⌫</button>` : ''}</div>
            <div class="km-kh-oklar">${pad}</div>
            ${bonusRozet ? `<div style="margin-top:8px;">${bonusRozet}</div>` : ''}
            <div style="display:flex; gap:8px; margin-top:10px; flex-wrap:wrap;">
                <button class="km-kh-btn" onclick="kmKelimeHarfCek()"${tamamMi ? '' : ' disabled'}>🔤 ${tamamMi ? (harfN ? harfN + ' Harf Çek (' + toplam + ' puan)' : 'Iska — Harf Yok') : 'Harf Çek'}</button>
                <button class="km-kh-btn ikincil" onclick="kmKelimeSiraBitir()">Pas ➜</button>
            </div>
            <div class="km-kh-alt" style="margin-top:8px;">Seri %90+ → 4 harf · %70+ → 3 · %45+ → 2 · altı → 1 · <b>X atan +1</b> · <b>2+ sarı (X/10/9) +1</b></div>
            <div class="km-kh-alt" style="margin-top:4px;">✓ Girilen oklar ${esc(kmOyunIlkAd(atanAd))} adına gerçek seri olarak kaydedilir (klasman ve yoklama dahil).</div>`;
    } else {
        sira = `<div style="font-weight:800; margin-bottom:4px;">🧩 ${esc(o.ad)} harflerini yerleştirsin</div>
            <div class="km-kh-alt" style="margin-bottom:10px;">${s.torba.length ? '' : 'Torba boşaldı — raftaki harfleri yerleştirin. '}Raftan bir taşa dokun, tahtada parlayan kareye koy. Kelimeyi tamamlayan +10 alır.${s.tahminYapildi ? '' : ' Cevabı bilen varsa ipucunun yanındaki 💡 Bil düğmesini kullanın.'}</div>
            <button class="km-kh-btn" onclick="kmKelimeSiraBitir()">Sırayı Bitir ➜</button>`;
    }
    let rafHTML = o.raf.length ? o.raf.map(function(h, i) { return `<button class="km-kh-rtas${_kmKelimeSeciliHarf === i ? ' secili' : ''}" onclick="kmKelimeHarfSec(${i})">${h}<small>${KM_KELIME_PUAN[h] || 1}</small></button>`; }).join('') : '<span class="km-kh-alt">Rafta harf yok.</span>';
    let ipucuListe = function(yon) {
        return s.kelimeler.map(function(w, wi) { return { w: w, wi: wi }; }).filter(function(x) { return x.w.yon === yon; }).sort(function(a, b) { return a.w.no - b.w.no; }).map(function(x) {
            let w = x.w, tamam = w.tamamlayan !== null, renk = tamam ? s.oyuncular[w.tamamlayan].renk : 'transparent';
            let bilBtn = (!tamam && s.faz !== 'bitti' && !s.tahminYapildi) ? `<button class="km-kh-bil" onclick="kmKelimeTahminAc(${x.wi})">💡 Bil</button>` : '';
            return `<div class="km-kh-ipucu${tamam ? ' tamam' : ''}"${tamam ? ` onclick="kmKelimeBilgiGoster(${x.wi})" style="cursor:pointer;"` : ''}><span class="km-kh-nokta" style="--kc:${renk}; ${tamam ? '' : 'border:1px solid var(--border-color);'}"></span><span><b>${w.no}.</b> ${esc(w.i)} <span style="color:var(--text-muted);">(${w.k.length})</span>${tamam ? ` — <b>${esc(w.g)}</b>` : ''}</span>${bilBtn}</div>`;
        }).join('');
    };
    let sonK = (s.sonKelime !== null && s.kelimeler[s.sonKelime]) ? s.kelimeler[s.sonKelime] : null;
    let bilgiHTML = sonK ? `<div class="km-kh-panel"><div class="km-kh-panel-baslik">📜 Biliyor muydun?</div><div class="km-kh-bilgi"><b>${esc(sonK.g)}</b> — ${esc(sonK.b)}</div></div>` : '';
    let tamamSay = s.kelimeler.filter(function(w) { return w.tamamlayan !== null; }).length;
    let boyutBtn = [['normal', 'A', 'Normal'], ['buyuk', 'A+', 'Büyük'], ['tv', 'TV', 'TV / projeksiyon']].map(function(b) {
        return `<button class="${_kmKelimeBoyut === b[0] ? 'aktif' : ''}" title="${b[2]}" onclick="kmKelimeBoyutSec('${b[0]}')">${b[1]}</button>`;
    }).join('');
    return `<div class="km-kh boyut-${_kmKelimeBoyut}">
        <div class="km-kh-ust">
            <div><div class="km-kh-baslik">🔤 Kelime Hedefi</div><div class="km-kh-alt">${tamamSay}/${s.kelimeler.length} kelime · torbada ${s.torba.length} harf · ${s.tur}. tur</div></div>
            <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                <div class="km-kh-boyut" title="Yazı ve tahta boyutu">${boyutBtn}</div>
                <button class="km-kh-btn ikincil" onclick="kmKelimeTamEkran()">⛶ Tam Ekran</button>
                <button class="km-kh-btn ikincil" onclick="kmSekme('oyunlar')">← Oyunlar</button>
                <button class="km-kh-btn ikincil" onclick="kmKelimeYeniOyun()">🔄 Yeni Bulmaca</button>
            </div>
        </div>
        <div class="km-kh-yerlesim">
            <div>
                <div class="km-kh-tahta-kutu"><div class="km-kh-tahta" style="grid-template-columns:repeat(${kolon}, minmax(0,1fr)); --kol:${kolon}; --oran:${(kolon / satir).toFixed(3)};">${hucreHTML}</div></div>
                <div class="km-kh-panel" style="margin-top:10px;"><div class="km-kh-panel-baslik">${esc(o.ad)} — Raf</div><div class="km-kh-raf">${rafHTML}</div></div>
            </div>
            <div>
                <div class="km-kh-panel">${oyuncuHTML}</div>
                <div class="km-kh-panel">${sira}</div>
                ${bilgiHTML}
                <div class="km-kh-panel"><div class="km-kh-panel-baslik">➡️ Yatay</div>${ipucuListe('y')}<div class="km-kh-panel-baslik" style="margin-top:10px;">⬇️ Dikey</div>${ipucuListe('d')}</div>
                <div class="km-kh-panel"><div class="km-kh-panel-baslik">Olaylar</div><div class="km-kh-log">${s.log.slice(0, 6).map(function(l) { return esc(l); }).join('<br>')}</div></div>
            </div>
        </div>
    </div>`;
}
