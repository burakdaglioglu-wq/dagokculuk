# Uçtan uca testler

Yayından önce uygulamanın gerçekten çalıştığını tarayıcıda (Playwright) ve API üzerinden kontrol eder.

## Çalıştırma

1. Yerel sunucuyu başlat: `npm run dev`
2. Yerel test hesabının PIN'ini ortam değişkenine ver ve testleri çalıştır:

```bash
DAGSK_TEST_PIN=xxxxxx npm run test:e2e            # hepsi
DAGSK_TEST_PIN=xxxxxx npm run test:e2e -- yoklama # adında "yoklama" geçenler
```

PowerShell: `$env:DAGSK_TEST_PIN='xxxxxx'; npm run test:e2e`

| Değişken | Varsayılan | Anlamı |
|---|---|---|
| `DAGSK_TEST_PIN` | — (zorunlu) | Yerel test hesabının PIN'i. Koda yazılmaz. |
| `DAGSK_TEST_KULLANICI` | `Burak` | Yerel test hesabının adı. |
| `DAGSK_TEST_URL` | `http://localhost:8787` | Test edilen adres. |
| `DAGSK_TEST_CANLI` | — | Testler veri oluşturup siler; yerel olmayan adrese karşı ancak `1` verilirse çalışır. |

Her test kendi verisini benzersiz isimlerle oluşturur ve sonunda siler. Başarısız test olursa çıkış kodu 1'dir.

## Testler

| Dosya | Ne kontrol eder |
|---|---|
| `01-guvenlik` | Girişli okumalar 401, silme/isim değiştirme girişsiz yapılamaz, KVKK alan gizleme, `null` koruması |
| `02-kvkk-senkron` | Girişsiz açılıp sonra giriş yapan cihaz gerçek kişisel veriyi silmez |
| `03-isim-birlestir` | İsim düzeltme, grup değişimi, birleştirme ve eski taşıma onarımında veri kaybı yok |
| `04-yoklama` | Karışık Sınıf › Yoklama: geç yükleme, sekmeler, geldi/gelmedi, ay takvimi, iki PDF, telefon genişliği |
| `05-kisi-yonetimi` | Çift Kayıt hata toleranslı arama + birleştirme, misafir takibi |
| `06-veli-rapor` | Veli rapor kodu, rapor verisi (kişisel veri yok), rapor sayfası |
| `07-oyunlar` | Oyunlar'daki her tema bireysel + takım modunda açılır; Kelime Hedefi ayrı dosyadan yüklenir |
| `08-milo` | Milo: veri kaybısız isim/grup düzeltme + birleştirme, girişli meta, veli raporu, Analiz / Çift Kayıt / Misafir ekranları |
| `66-hapsirik` | Oyunlar › Hapşırık: gerçek seri, gizli nokta, geri al, hapşırık → sıradaki yaratık, 4 yaratık; adil başlangıç (hiç ilk başlamamış başlar) |
| `67-gunluk-seri-limiti` | Günlük seri limiti yalnız bugünün serilerini sayar (eski kart serileri limiti doldurmaz) |
| `68-vitrin` | Yönetici › Tanıtım Ekranı: ilk oyun + alt bant, görüntüler sunucudan gelir, ara kart, 390 px taşma yok, Esc kapatır |
| `69-akvaryum` | Oyunlar › Sınıf Akvaryumu: gerçek seri, her isabet bir canlı (iska yok), X nadir + rozet, geri al, dolunca tören → sıradaki akvaryum, 5 akvaryum, çocuğa dokununca sıra, Akvaryum seviyesi |
| `70-kale` | Oyunlar › Kale Savunması: gerçek seri, ok en öndeki düşmana hasar (ıska vermez), düşmanlar yaklaşır, geri al, dalga temiz → 2. dalga + rozet, kapıya varan can alır, kale düşerse aynı dalga baştan, 5 düşman tipi (domuz yok), çocuğa dokununca sıra, Kale seviyesi |
| `71-fener` | Oyunlar › Fener Alayı (29 Ekim): hedef = Cumhuriyet'in yaşı, halka → fener sayısı (ıska 0, X 5), 1923 bilgi kartı, geri al, hepsi yanınca tören → 2. tur + rozet, çocuğa dokununca sıra |
| `72-halat` | Oyunlar › Dev Halat Çekme: dengeli AL/AK, raunt HERKES atmadan bitmez (önce atan avantajı yok), herkes atınca önde olan alır, geri al, ⏭️ atanlarla bitirme, 2 raunt → maç + rozet, çocuğa dokununca sıra |
| `73-il` | Oyunlar › 81 İl: 81 petek (yalnız il yok), eşik/kaçtı, bayrak, savundu (eşitlik yetmez), ÇALDI + X komşu il, Ankara ×5, geri al, 🏁 adil bitiş (herkes eşit atınca) |
| `74-dogrudan-eleme` | Yarışma › Doğrudan eleme: tür seçimi, 8'li tablo + 3 bay (en üst tohumlara), İlk 4, elle ▲▼ tohum, toplam puan (5×3) + eşitlikte shoot-off, bronz, sonuç ekranı + TV; sıralama sonrası eleme sistemi/bronz ayarı, set sistemi 6-0 |

Yeni bir özellik eklerken `testler/` altına aynı biçimde (varsayılan dışa aktarılan `async function ({ log })`) bir dosya ekle.
