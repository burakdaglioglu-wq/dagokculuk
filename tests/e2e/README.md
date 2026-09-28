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

Yeni bir özellik eklerken `testler/` altına aynı biçimde (varsayılan dışa aktarılan `async function ({ log })`) bir dosya ekle.
