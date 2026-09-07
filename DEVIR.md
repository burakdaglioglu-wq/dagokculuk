# DEVİR — DAĞ Spor Kulübü Tasarım Sistemi Geçişi

Bu dosya, bağlam penceresi dolduğu için yeni bir oturuma aktarılan işin durumunu özetler.
Yeni oturum bu dosyayı okuyup, önceki oturumun tamamını bilmeden devam edebilmeli.

## 1. Proje ve hedef

DAĞ Spor Kulübü (okçuluk) için Cloudflare Workers üzerinde çalışan bir yönetim/skor
uygulaması var. **Canlı olan dosyalar**: `public/app.html` (1.357 satır, tek `<style>`
bloğu yok, CSS'i `public/styles.css`'e link'liyor) + `public/app.js` (~20.500 satır,
tüm mantık burada) + `public/styles.css` (~980+ satır). Veri katmanı **tamamen Cloudflare
D1** (`turnuvaDB`, `bulutaGonderKontrol()`, `_skorKaydetCekirdek()`) — app.js içinde geçen
"Firestore" kelimeleri (14 yer) sadece migration-öncesi kalma **bayat yorumlar**, gerçek
kod değil. Projenin kökündeki `index.html` (9.329 satır) ise **ölü kod** — eski,
Firebase tabanlı, migration-öncesi tek-dosya sürüm; Worker routing'inde hiç referans
edilmiyor, dokunulmuyor, sadece `yedek/index-20260906-122638.html` olarak güvenlik
kopyası alındı. Hedef: kullanıcının verdiği bir tasarım-sistemi promptunu (orijinal metin
artık elde yok, ama kuralları ve fazları bu dosyada özetli) app.html+app.js+styles.css'e
faz faz, ekranı bozmadan uygulamak.

## 2. Tamamlanan fazlar ve commit'ler

- `55d8093` — WIP: Ders Programı, yarım *(bu tasarım işinden ÖNCEKİ, ilgisiz, bilerek yarım bırakılmış bir özellik — ayrı commit'e alındı ki tasarım commit'leriyle karışmasın)*
- `562199b` — Tasarım sistemi Faz 0-2: token katmanı, PALETLER düzeltmeleri, bileşen kütüphanesi *(Faz 0 envanteri + Faz 1 tokenler + Faz 2 PALETLER/bileşen kütüphanesi — üçü de aralarında commit atılmadan tek commit'te toplandı)*
- `c221721` — DEVIR.md ekle — tasarım sistemi geçiş belgesi
- `69c097f` — Tasarım sistemi Faz 3: navigasyon
- `109188d` — Tasarım sistemi Faz 4: Skor ekranı (4a/4b/4c)
- `3c75e63` — Tasarım sistemi Faz 5 grup 1: Sayaç, Canlı Takip, Liderlik
- `4ccb205` — Faz 5 düzeltme: `!important` yerine doğru kural sırası
- `276fa1f` — Tasarım sistemi Faz 5 grup 2: Gelişim, Ders İçerikleri, Teknik Çalışma
- `1c1fcf7` — Tasarım sistemi Faz 5 grup 3: Klasman, Başarılar
- `f51cb68` — Tasarım sistemi Faz 5 grup 4: Yarışmalar, Düello, Video
- Faz 5 grup 5 (Mağaza, `#duello-modal`, Reaksiyon) — bu commit'te, aşağıda anlatılıyor

**Faz 3'ten itibaren: her faz onaylandığında HEMEN ayrı commit atılıyor** — bu kurala bu turda uyuldu.

## 2a. Faz 3 — Navigasyon (tamamlandı)

**Ne yapıldı:** `sekmeAc()`'in (app.js:15216 civarı) mevcut satırlarına ve hiçbir `tab-*`/`icerik-*`
id'sine dokunmadan, görünür kabuk yenilendi:
- Üst bar (masaüstü/tablet, `#tabs-ana`) 6 birincile indi: **Ana Ekran, Skor, Sayaç, Canlı Takip,
  Gelişim, Liderlik** + sağda "Daha" (`#daha-tab-btn`).
- **6'lık liste gerekçesi** (kullanıcının düzeltmesiyle): Sayaç öne alındı çünkü atış çizgisinde her
  antrenmanda kullanılıyor. Klasman ÖNE ÇIKARILMADI (idari ekran, ayda birkaç kez açılıyor) — yerine
  Canlı Takip geldi (antrenman/yarışma sırasında sürekli açık).
- "Daha" paneli (`#daha-panel`, `.modal-overlay` + id-seçici `z-index:30950 !important`) kalan 9
  sekmeyi 3 grupta topluyor: **Antrenman** (Teknik Çalışma, Ders İçerikleri, Video), **Yarışma**
  (Yarışmalar, Düello), **Kayıt** (Klasman, Başarılar, Mağaza, Reaksiyon).
- Mobil (`≤680px`): üst bar tamamen gizli (`#tabs-ana{display:none!important}`), sabit alt bar
  (`#alt-bar`, 5 buton: Ana/Skor/Sayaç/Gelişim/Daha) — `env(safe-area-inset-bottom)` payı var,
  `.sekme-icerik`e ekstra `padding-bottom` eklendi ki içerik barın altında kalmasın (360px'te
  ekranın en altına kaydırılarak doğrulandı).
- **Mobil grup düzeni kararı**: "Daha" panelinde Canlı Takip/Liderlik için AYRI bir görsel sistem
  (kısayol satırı) YOK — diğer 3 grupla birebir aynı kalıpta 4. bir grup ("Sık kullanılan"),
  `.daha-grup-mobil` class'ıyla sadece `≤680px`'te görünür. İlk tasarımda ayrı bir `.daha-kisayol-satir`
  vardı, kullanıcı "tek kalıp, dört grup" diye düzeltti.
- 15 ikon tek ailede: `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`,
  `stroke-width="1.7"`, `stroke-linecap/linejoin="round"` — hepsi app.html'e doğrudan inline
  yazıldı (repo'da ikon kütüphanesi/CDN yok). Liderlik ve Klasman AYNI ikonu (kupa) paylaşıyor —
  grup için ortak ikon kullanma izniyle.
- Tüm butonlar (üst bar, alt bar, Daha paneli) hâlâ AYNI `sekmeAc('id')`/`dahaPanelAc()` çağrısını
  kullanıyor — ayrı bir yönlendirme mantığı yazılmadı.

**Rol senkron testi (3 gerçek rol taranıp doğrulandı — ⚠️ önemli düzeltme aşağıda):**
`tablariPlatformaGoreAyarla()` (app.js ~9393) bazı sekmeleri role göre `style.display='none'` ile
gizliyor (`g('tab-X', bool)` yardımcı fonksiyonuyla). Yeni alt bar/Daha-kısayol butonları AYRI
elementler olduğu için (id çakışması olmasın diye — `tab-timer` iki yerde birden id olamaz), bu
fonksiyonun sonuna küçük bir senkron bloğu eklendi: her kısayolun görünürlüğü kendi gerçek `tab-*`
karşılığından okunuyor. **3 rol test edildi, TAMAMI doğru senkronize:**
- **eğitmen** (antrenör) — 15 sekmenin 15'i de görünür, tüm alt bar/kısayol eşleşmeleri doğru.
- **sporcu** — `tab-timer` (Sayaç) ve `tab-takimlar` (Yarışmalar) role göre gizli; `altbar-sayac`
  bunu doğru izliyor (ikisi de `display:none`). Diğer 13 sekme görünür, hepsi senkron.
- **"veli" rolü YOK** — kullanıcı "veli ve antrenör rollerinde test et" dedi ama kodda ana
  navigasyona bağlı böyle bir platform/rol bulunmuyor (`grep`'le doğrulandı — "veli" sadece
  Karışık Sınıf'ın kendi iç sekmesi `kmSekme('veli')`, bu Faz 3'ün değiştirdiği sistemle ilgisiz).
  Gerçekte var olan 3. giriş türü **"yönetici"** de bu nav sistemine HİÇ GİRMİYOR — PIN doğru
  girilince `sifreMod==='yonetici'` dalı doğrudan `yoneticiPaneliAc()` çağırıp `return` ediyor
  (app.js:6562), `aktifPlatform`'u hiç set etmiyor, `tablariPlatformaGoreAyarla()`'ı hiç çağırmıyor.
  Yani bu nav'ı gerçekten kullanan SADECE 2 rol var: sporcu ve eğitmen — ikisi de test edildi ve
  doğru. Kullanıcıya bu düzeltme raporlandı, üçüncü bir rol icat edip test etmedim.

**Faz 6 temizlik listesine eklenenler** (bkz. §6):
- `#alt-menu` id'li ölü kod satırı (app.js ~9437: `document.getElementById('alt-menu')` — böyle bir
  element hiç yok, no-op). Bu turda SİLİNMEDİ, sadece not edildi — Faz 3'ün yeni alt barına bilerek
  bu id verilmedi (çakışsaydı her rol değişiminde sessizce gizlenirdi).
- Eski `.sekme-grubu`/`.sekme-btn.aktif` kuralları (styles.css ~248, ~1027-1038, ~1090 — gradyan/
  glow'lu eski görünüm) artık hiçbir elemente uygulanmıyor (yeni `#tabs-ana .sekme-btn`/`#daha-panel
  .sekme-btn` id-seçicileri daha spesifik, her zaman kazanıyor) — silinmedi, ölü kod olarak duruyor.
- 560px medya sorgusundaki eski `.sekme-grubu{gap:3px}`/`.sekme-btn{font-size:11px}` (styles.css
  ~481-482) artık `#tabs-ana` zaten `display:none` olduğu için etkisiz.

## 2b. Faz 4 — Skor Ekranı (tamamlandı, en kritik ekran)

Üç alt adımda yapıldı, her adım sonunda ekran görüntüsüyle onaylandı. **Puan hesaplama, seri
toplama, kaydetme, D1 yazma mantığının (`skorKaydet()`, `efektifOklar()`, `puanDeger()`,
`_skorKaydetCekirdek()`) HİÇBİRİNE dokunulmadı** — sadece görsel/yerleşim.

**4a — Yerleşim**: Mevcut `850px` kırılımı korundu (`.skor-split-layout` zaten `flex-direction:
column`'a dönüyordu). `≤850px`'te `.skor-right-panel` (tuş takımı) `position:STICKY` (fixed
DEĞİL — kapsayıcı `overflow-y:auto` alanın içinde kalır) ile ekranın altına sabitlendi. `bottom`
değeri sabit piksel DEĞİL — yeni `--alt-bar-h` CSS değişkeninden geliyor, bu da yeni
`altBarYukseklikSenkron()` (app.js) fonksiyonuyla `#alt-bar`'ın GERÇEK `offsetHeight`'ından
(`resize`/`load`'da) okunuyor; `.alt-bar`'ın kendi padding'i `env(safe-area-inset-bottom)`'u zaten
içerdiği için ayrıca eklenmedi (iki kere sayılmasın diye). Ölçülen gerçek değer: **55px**.

**4b — Seri şeridi + tek kaydet düğmesi**:
- Yeni `#seri-seridi` (app.html, tuş takımının hemen üstünde) **SADECE OKUYAN** bir bileşen —
  kendi state'i yok, `hedefGorseliGuncelle()`'in (app.js ~15751, zaten HER ok ekleme/silme/
  kaydetmede çalışan tek render fonksiyonu) zaten hesapladığı `oklar`/`okAdet`/`toplam`
  değişkenlerini okuyup çiziyor. Renkler `getRenkForPuan()`'dan (tuş takımıyla AYNI kaynak).
- `#yuzen-kaydet-btn` (eski, `position:fixed`, ikinci bir "SERİYİ KAYDET" düğmesi) **kaldırıldı**
  — önce arandı, hiçbir event listener/CSS kuralı/başka referansı yoktu. Artık TEK kaydet
  düğmesi var: `#skor-kaydet-btn` (header'da), `.btn.btn-primary`, boşken `disabled` + "Seriyi
  kaydet", dolarken "Seriyi kaydet (3/6)" — cümle düzeninde, büyük harf/emoji yok.
- "İyi bir okçu, dürüst olandır" metni kaldırıldı.
- `#ok-rozetleri` (eski, aynı bilgiyi farklı bir görselle — yuvarlak rozet — gösteren bileşen)
  **kaldırıldı** — ama önce kontrol edildi: 3'lü spot cezası alan bir ok, eski rozette orijinal
  puanı üstü çizili + "M" gösteriyordu, seri şeridi bunu YAPMIYORDU. Bu bilgi kaybolmasın diye
  önce şeride taşındı (`<s>9</s>M` deseni, `.seri-cip-cezali`), SONRA `#ok-rozetleri` silindi.

**4c — Katlanır "Seri ayarları" paneli**: Ciddi Yarışma Modu, DAĞCAN, "kaç ok", "hangi fiziksel
ok", "Görünümü Sıfırla" → `<details id="seri-ayarlari-panel" class="card">`, **varsayılan
kapalı**. Faz 2'nin `.settings-row`/`.switch`/`.seg`/`.btn` bileşenleri kullanıldı, yeni stil
YAZILMADI:
- Ciddi Mod'un eski elle-boyanan özel switch DOM'u (`#ciddi-mod-switch`/`#ciddi-mod-knob`/
  `#ciddi-mod-btn`) tamamen kaldırıldı, gerçek `.switch`+checkbox ile değiştirildi.
  `ciddiModGorunumGuncelle()` artık sadece `checkbox.checked` + etiket metnini senkronluyor —
  **`ciddiModAcik` değişkenine ve onu okuyan oyun mantığına (konfeti/ödül vb.) dokunulmadı.**
- "Kaç ok" segmenti `.seg`/`.seg-btn.aktif` oldu, `okSayisiGorunumGuncelle()` artık elle renk
  boyamıyor, sadece `classList.toggle('aktif',...)`.
- Dokunma ipucu metni ("İki parmağınızla...") artık panel kapalıyken hiç görünmüyor — kalıcı
  değil, sadece "Görünümü Sıfırla" satırının `.settings-hint`'i olarak, panel açılınca görünür.
- Panel açık/kapalı durumu **`localStorage['dag_seri_ayarlari_acik']`'a yazılıyor, D1'e DEĞİL**
  — bu görsel/cihaz tercihi, senkronize edilecek veri değil (kullanıcının kararı).
- **360×640 doğrulaması**: 4a'da hedef yüzeyi bu boyutta hiç görünmüyordu (Ciddi Mod/DAĞCAN/ok-
  sayısı/fiziksel-ok/dokunma-ipucu içeriği tek başına ekranı dolduruyordu). 4c'nin panel-toplama
  işlemiyle bu içerik ekrandan kalkınca hedef artık panel KAPALIYKEN tam görünür oldu —
  `getBoundingClientRect()` ile ölçülüp ekran görüntüsüyle doğrulandı.

**Faz 4'te öğrenilen/uygulanan yeni kurallar** (bkz. §7'ye de eklendi):
- Var olan bir render fonksiyonuna (state tutmayan, sadece DOM'a yazan) yeni bir görsel özelliği
  eklemek, YENİ bir state kurmaktan çok daha güvenli — `hedefGorseliGuncelle()` örneği.
- Aynı bilgiyi iki farklı görselle göstermek sadeleştirmenin tersi — biri kaldırılacaksa önce
  ikisinin de gerçekten AYNI bilgiyi taşıdığından emin ol (bkz. `#ok-rozetleri`'nin cezalı-ok
  nüansı örneği).
- Bir UI tercihinin (panel açık/kapalı gibi) D1'e mi yoksa localStorage'a mı yazılacağı önceden
  netleştirilmeli — "bu veri cihazlar arası senkronize olmalı mı" sorusu cevaptır.

## 2c. Faz 5, Grup 1 — Sayaç, Canlı Takip, Liderlik (tamamlandı)

Üç ekran sırayla yapıldı, hiçbiri hesaplama/veri fonksiyonuna dokunmadı. Hepsi 360px'te
yatay kaydırmasız doğrulandı.

**Sayaç**: Süre/oto-toplama/sıfırla → katlanır `#sayac-ayarlari-panel` (`.card`+`.settings-row`),
varsayılan kapalı, `localStorage['dag_sayac_ayarlari_acik']`. Büyük `#sayac` rakamı tek birincil
etkileşim olarak kaldı, `toggleTimer()`/`kronometreSifirla()`'ya dokunulmadı.

**Canlı Takip**: Katlanacak bir ayar YOKTU (kullanıcının onayladığı gibi) — sadece `canliTakipCiz()`'in
ürettiği kart şablonu `.card` (eski ad-hoc inline kart stilinin yerine) ve `.seri-cip` (Faz 4b'nin
ok-rozeti — Skor ekranıyla AYNI class, üçüncü bir stil icat edilmedi) kullanacak şekilde güncellendi.
Boş/hata durumları da `.empty` bileşenine taşındı (Faz 2'de tanımlanmış ama hiç kullanılmamıştı).
`_canliTakipVerisiTopla()`'ya dokunulmadı.

**Liderlik**: 7 yönetim butonu katlanır `#liderlik-yonetim-panel`e taşındı (`.card`, varsayılan kapalı,
`localStorage['dag_liderlik_yonetim_acik']`), **kullanıcının düzeltmesiyle İKİ ayrı gruba bölündü**:
"Rapor ve yedek" (PDF Rapor, Yedekle, Geri Yükle, Buluta Yükle, Buluttan Çek — düz `.btn`) ile
"Tehlikeli işlemler" (Sıfırla, Acil Kurtarma — `.btn-danger`), aralarında bir ayraç çizgisi + boşluk.
Gerekçe: Sıfırla/Yedekle yan yana durursa yanlış tuşa basma riski gerçek ve sonuçları geri
dönülemez biçimde farklı. `veriSifirla()`/`acilKurtarma()`'nın kendi `confirm()` diyalogları zaten
vardı (kontrol edildi) — hiçbiri eklenmedi/değiştirilmedi, sadece buton class'ı ve grubu değişti.

**⚠️ Bu grupta bulunan gerçek bug (Faz 3'ten kalma, şimdi düzeltildi — KALICI çözümle)**: Sayaç
ekranının alt metni (`#timer-alt`, "ATIŞA HAZIR") mobilde alt barın ARKASINA giriyordu. Sebep:
Faz 3'te eklenen `@media(max-width:680px){.sekme-icerik{padding-bottom:calc(...)}}` kuralı,
styles.css'te KENDİSİNDEN SONRA gelen eski `.sekme-icerik{padding:15px;...}` (satır ~316)
tarafından eziliyordu — ikisi de aynı özgüllükte olduğu için kaynak sırası kazanıyordu, media
sorgusu içinde olması onu korumuyordu. **İlk düzeltme `!important` ile yapılmıştı, kullanıcı bunu
geri aldırdı** ("borcu Faz 6'ya erteler") — DOĞRU çözüm uygulandı: padding-bottom kuralı fiziksel
olarak dosyada `.sekme-icerik`in asıl kuralından (satır ~316) SONRAYA taşındı, artık doğal kaynak
sırasıyla kazanıyor, `!important` YOK. Bu bug Faz 4'te (Skor ekranı) fark edilmedi çünkü o ekranın
sticky tuş takımı `--alt-bar-h`'a bağımsız bağlıydı, bu genel padding-bottom kuralına hiç
güvenmiyordu — yani "bir ekranda çalışıyor" başka bir ekranda da çalıştığı anlamına gelmiyor.

**Test notu**: `#hizli-otokaydet` ("Seri dolunca otomatik kaydet") varsayılan İŞARETLİ — son oku
girince seri KENDİLİĞİNDEN kaydediliyor. Test scriptlerinde son oktan sonra AYRICA manuel
`#skor-kaydet-btn`'e basmak, zaten boşalmış bir seriye ikinci kez basmak anlamına gelip yanlışlıkla
"EKSİK SKOR" hatası gibi görünüyor — gerçek bir regresyon değildi, test tasarımı hatasıydı.

## 2d. Faz 5, Grup 2 — Gelişim, Ders İçerikleri, Teknik Çalışma (tamamlandı)

Üç ekran sırayla yapıldı, hiçbiri hesaplama/veri fonksiyonuna dokunmadı. 360/1280px'te,
koyu VE açık temada (12 kombinasyon) yatay kaydırma yok, konsol hatası yok — doğrulandı.

**Gelişim** (`sporcuGelisimDoldur()`): zaten var olan 4 katlanır bölüm (🩺 Analiz & Teşhis,
💪 Fiziksel Takip, 🏹 Ekipman & Nişangah, 📋 Geçmiş & Rozetler — hepsi varsayılan kapalı)
`.card` kabuğuna, özet satırları Faz 4c'nin özet deseniyle (`list-style:none` + sağa yaslı
`▾`) hizalandı. Tek CTA ("🎯 Antrenman Başlat") `.btn.btn-primary` oldu. `gelisimGrafigiHTML`/
`ritimGrafigiHTML`/`biyomotorGrafikleriCiz` gibi grafik/veri fonksiyonlarına dokunulmadı.

**Ders İçerikleri** (`dersIcerikleriRenderla()`/`dersKartHTML()`): arama+filtre paneli `.card`,
tip filtresi (Tümü/Teknik/Eğlenceli/Oyun) düz butonlardan `.seg`/`.seg-btn`'e taşındı, birincil
eylem ("🎲 Rastgele Bir Ders Seç") `.btn.btn-primary`, eğitmen-özel "Yeni Ders Ekle"/"Kullanım
Raporu" aç/kapa düğmeleri `.btn`, açılınca gösterdikleri panellerin (`dersEkleFormCiz()`,
`dersKullanimRaporuCiz()`) dış kabukları `.card`. Her ders kartı (`<details class="adm-card">`)
`.card`'a, aksiyon satırı (✅ İşledim/🖨️ Yazdır/✏️ Düzenle/🗑️ Sil) `.btn`/`.btn-sm`'e taşındı —
**🗑️ Sil `.btn-danger`** (Liderlik'teki yıkıcı-eylem ayrımıyla aynı prensip). Boş sonuç durumu
`.empty` bileşenine taşındı. `dersIcerikFiltreliListe()`, cache/fetch/CRUD fonksiyonlarının
hiçbirine dokunulmadı; form içindeki çizim tuvali (`#ders-cizim-canvas`) ve tekil metin
girişleri (henüz bir Faz 2 input bileşeni yok) olduğu gibi bırakıldı.

**Teknik Çalışma** (`public/dagsk-teknik-calisma.js`, `DAGSK_TEKNIK.mount()`) — bu grubun en
öğretici parçası. Modül kendi `.tk-` paletini kullanan, uygulamadan tamamen bağımsız,
kendi CSS'ini enjekte eden bir kütüphane (bkz. hafıza `dagsk-teknik-calisma-modulu-2026-08`).
**Kullanıcının sorusu üzerine** (bkz. §7) önce Gelişim ile Teknik Çalışma sekmeleri yan yana
ekran görüntüsüyle karşılaştırıldı: uygulama koyu temadayken Teknik Çalışma sabit beyaz
kartlarla açılıyordu — üst gezinme çubuğunun hemen altında "yabancı bir site yapıştırılmış"
gibi duruyordu. Bu, sadece `--tk-orange`'ı bağlamanın (ilk teklif) sorunu ÇÖZMEYİP ERTELEYECEĞİNİ
doğruladı; kart arkaplanlarını da `--surface-1`'e taşımaya (kapsam genişletme, kullanıcı onayıyla)
karar verildi.

**Asıl bulgu**: `--tk-navy` TEK bir hex ile ÜÇ farklı görsel rol oynuyordu — (1) başlık/etiket
metni (kartın üstünde okunan "ink"), (2) opak, sabit koyu rozet arkaplanı (stat çipleri, 4 günlük
plan paneli, alt video butonu — hepsi sabit beyaz metinle eşleşiyor). Kart `--surface-1`'e
(temaya duyarlı) taşınınca, `--tk-navy`'yi TEK bir Faz 1 tokenına bağlamak imkansız hale geldi:
metin rolü `--text-primary`'ye ihtiyaç duyarken, rozet-arkaplanı rolü SABİT kalmalıydı — çünkü
o rozetler kendi içinde kapalı bir kontrast sistemi taşıyor (koyu zemin + beyaz metin, HER
ZAMAN okunur, kartın rengi ne olursa olsun). **Karar**: `--tk-navy` → `var(--text-primary)`
(sadece metin rolü), rozet arkaplanları (`.tk-stat`, `.tk-plan`, `.tk-vid.tk-alt`) modülün
zaten var olan ikinci sabit tonuna (`--tk-navy2`, `#143A5E`, daha önce sadece hover'da
kullanılıyordu) yönlendirildi — YENİ hex icat edilmedi, temaya BAĞLANMADI (bilerek — kendi
kendine yetiyor). Aynı mantıkla 4 metin literali (`.tk-intro p`, `.tk-mat p`, `.tk-amac`,
`.tk-steps li` — hiçbiri adlı `.tk-*` değişken kullanmıyordu, o yüzden ilk tabloda
görünmemişlerdi) `--text-primary`/`--text-secondary`'ye taşındı, yoksa kart koyulaşınca bu
metinler de okunmaz kalırdı. Toplam: 8 palet değişkeninden 7'si Faz 1 tokenına bağlandı
(`--tk-navy2` bilerek sabit bırakıldı), 3 kart arkaplanı + 4 metin literali + 3 rozet-arkaplanı
yönlendirmesi değişti. `DATA`/`PLAN`/`MALZEME` içerikleri, `mount()`/`render()`/`injectCSS()`
mantığı, SVG çizimleri/ikonlar HİÇ dokunulmadı. `teknikCalismaDoldur()`'daki (app.js) hata
mesajı rengi de `--neon-red` → `--status-danger` oldu.

**Doğrulama**: koyu temada rozetlerin kart üstünde ayrıştığı hem gözle (ekran görüntüsü) hem
ölçülerek (`getComputedStyle` ile okunan gerçek `backgroundColor` değerleri: kart
`rgba(28,28,32,.86)`, rozetler `rgb(20,58,94)` — belirgin farklı ton, ek `--surface-border`
kenarlığına gerek kalmadı) doğrulandı.

**Kalan not**: proje kökündeki `./dagsk-teknik-calisma.js` (canlı `public/` kopyasının önceden
BİREBİR AYNISI olan, hiçbir yerden yüklenmeyen ölü bir kopya) artık bu değişikliklerle
UYUŞMUYOR — Faz 6 temizlik listesine eklendi (bkz. §6).

## 2e. Faz 5, Grup 3 — Klasman, Başarılar (tamamlandı, bilerek dar kapsamlı)

Bu grup, önceki gruplardan FARKLI bir prensiple ilerledi: **iki ekranın da içeriğinin büyük
kısmı anlam taşıyan renk kullanıyor** (madalya sıralaması, "bu sen" vurgusu, canlı-atış parıltısı,
kazanılmış/kilitli rozet durumu, mağazadan satın alınmış çerçeve rengi) — kullanıcının Reaksiyon/
Video için verdiği "oyun mekaniği renklerine dokunma" kuralı, aynı gerekçeyle burada da uygulandı
(kullanıcı bu iki ekranı adıyla anmadı ama prensip birebir aynı, bkz. §7). Sonuç: bu grubun diffi
Gelişim/Ders İçerikleri'ne göre kasıtlı olarak küçük.

**Klasman** (`klasmanDoldur()`): sadece DIŞ ÇERÇEVE değişti — Yay filtresi (Tümü/Klasik/Makaralı)
düz butonlardan `.seg`/`.seg-btn`'e taşındı, her ligin `<details>` grup başlığı Faz 4c/5'in
kurulu özet desenine (`.card` + sağa yaslı `▾`) hizalandı. **Dokunulmadı**: her sporcu satırının
madalya rengi/rozet/gradyanı, "SEN"/"LİDER"/"YAKLAŞIYOR"/"PODİUM" rozetleri, canlı-atış parıltısı
(`canliAtisAktifMi`/`canliAtisRozetiHTML`), `gmRingHTML()` skor halkası — hepsi sıralama/durum
anlamı taşıyor.

**Başarılar** (`rozetVitrinDoldur()`): tek değişiklik "▼ Diğer N rozeti göster" aç/kapa butonunun
`.btn`'e taşınması. Geri kalanı zaten ya token-tabanlıydı (`.bs-card`/`.bs-title`/`.bs-sub`/
`.bs-select` — incelendi, `.card`/`.btn` ile FONKSİYONEL OLARAK ZATEN AYNI kaynaklardan besleniyor,
yeniden adlandırmaya gerek yok) ya da anlamlı içerik rengiydi (kazanılan rozet altın parıltısı,
kilitli rozet grileşmesi, çerçeve rengi `CERCEVE_RENK` — mağazadan satın alınan bir kozmetik,
vitrin seçim durumu). `profilRender()`/`rekorTahtaDoldur()`/satın-alma mantığına dokunulmadı.

**Doğrulama**: 5 sahte sporcu (`kartGecmisi` ile gerçekçi skor) + 1 seçili sporcu tohumlanarak
360/1280px, koyu/açık temada (8 kombinasyon) ekran görüntüsü alındı, yatay taşma/konsol hatası yok.

## 2f. Faz 5, Grup 4 — Yarışmalar, Düello, Video (tamamlandı)

**Yarışmalar** (`#icerik-takimlar`) — üç değişiklik: (1) 3 `.glass-panel` bölümü `.card`'a taşındı;
(2) Klasik/Makaralı kategori sekmesi (`#tree-tab-klasik`/`#tree-tab-makarali`) `.seg`/`.seg-btn`'e
taşındı — `setTreeCategory()` artık iki ayrı class (`aktif-klasik`/`aktif-makarali`) yerine tek
`aktif` class'ı toggle'lıyor, `aktifTreeCat` durum değişkenine (bracket filtrelemeyi süren gerçek
mantık) dokunulmadı; (3) **"🔄 Yarışmaları Sıfırla"** — kullanıcının özellikle işaret ettiği buton.
`yarismalarSifirla()` içinde `confirm()` zaten VARDI ve ne silineceğini açıkça yazıyordu
(`"Tüm takımlar ve eleme ağaçları (bireysel + takım) silinir. Sporcular ve skorlar SİLİNMEZ."`) —
eklemeye gerek kalmadı, sadece doğrulandı (Playwright `dialog` event'iyle metnin ekrana geldiği
teyit edildi). Buton ekranın EN ALTINA, kendi "Tehlikeli işlemler" başlıklı `.card`'ına taşındı,
`.btn-danger` oldu — artık ne yapıcı akışların arasında ne de ekranın ilk göze çarpan öğesi.
Bireysel/takım eleme ağaçları (`#eleme-agaci-alani`/`#takim-eleme-agaci-alani`, `elemeAgaciOlustur`/
`takimElemeAgaciOlustur`/`maclariCiz`/`takimMaclariCiz`) HİÇ dokunulmadı — bunlar hesaplama/bracket
katmanı. Bölüm başlıklarının rengi (BİREYSEL=mavi, TAKIM=gold) bilerek korundu — ekranı tararken
"hangi bölümdeyim" ayrımını taşıyan bir kategorileme rengi, chrome değil.

**Bulunan yan bug (bu turda düzeltildi)**: iki boş-durum metni doğrudan buton RENGİNE atıfta
bulunuyordu — `"...yukarıdaki mavi butona basınız"` ve `"...yukarıdaki altın renkli butona basınız"`
(`maclariCiz()`/`takimMaclariCiz()`). Butonlar `.btn-primary` (turuncu) olunca bu metinler yanlış
hale geldi. Düzeltme: renk yerine buton METNİNE atıfta bulunacak şekilde yeniden yazıldı
(`"...yukarıdaki 'Bireysel Ağacı Başlat / Yenile' butonuna basınız."` vb.) — **genel ders**: bir
butonun rengini değiştirmeden önce, o rengi/o butonu SÖZLE anan başka bir metin var mı diye ara
(bkz. §7).

**Düello** (`#icerik-duello`, `duelloTabDoldur()`) ve **Video** (`#icerik-video`, `vaInit()`) —
**hiçbir markup/stil değişikliği yapılmadı**. İkisi de zaten `.va-*` sınıf ailesini (`.va-card`,
`.va-title`, `.va-sub`, `.va-btn` + renk varyantları) kullanıyor; styles.css'te incelendiğinde bu
ailenin `.card`/`.btn` ile TAM OLARAK AYNI Faz 1 tokenlarından (`--bg-panel`, `--border-color`,
`--text-muted`, `--accent-orange`, `--neon-*`) beslendiği görüldü — yeniden adlandırma saf çalışma
olurdu. **Kullanıcının uyardığı mekanik renk** somut olarak bulundu: `aynaSekliCiz()` (Gecikmeli
Ayna'nın çizim katmanı) `ctx.strokeStyle = '#fbbf24'` ile canvas'a SABİT bir renk çiziyor — bu,
uygulamanın temasıyla değil, kamera görüntüsünün üzerinde HER ZAMAN görünür kalması gereken bir
çizim rengi (video arka planı ne renk olursa olsun okunabilir kalmalı). Dokunulmadı. Düello'nun
`.duello-davet-satir` turuncu vurgusu da (gelen davet = "aksiyon bekliyor") anlamlı bir durum rengi
olarak bırakıldı — giden davetler zaten kendi satırında nötr renge çevriliyor (`duelloTabDoldur()`).
`#duello-modal` (aktif düello sırasında açılan tam ekran maç arayüzü) bu ekranın bir PARÇASI değil,
ayrı, çoklu giriş noktalı bir modal sistemi — bu grupta Faz 5 kapsamı dışında bırakılmıştı.
**Kullanıcı bunu düzeltti**: modal, kullanıcı için "düellonun kendisi" — Faz 5 grup 5'te ele alındı,
bkz. §2g.

**Doğrulama**: 360/1280px, koyu/açık temada (8 kombinasyon) ekran görüntüsü + `.btn-danger` class
kontrolü + `confirm()` metni okuma + `.seg-btn.aktif` geçiş testi — hepsi Playwright ile gerçek
`.click()` üzerinden, yatay taşma/konsol hatası yok.

## 2g. Faz 5, Grup 5 — Mağaza, `#duello-modal`, Reaksiyon (tamamlandı, Faz 5'in son grubu)

Bu gruptan sonra Faz 5'te sadece **Ana Ekran** kalıyor.

**Mağaza** (`#icerik-oyun`, `oyunPaneliDoldur()`): incelemede `.oy-coin-bar`/`.oy-bolum`/`.magaza-tab`
ailesinin de (Başarılar/Düello/Video'daki gibi) `.card`/`.seg-btn` ile TAM OLARAK AYNI Faz 1
tokenlarından beslendiği görüldü — dokunulmadı. `magazaGridDoldur()`'un rozet nadirlik renkleri
(nadir/epik/efsanevi/dağ), sahiplik/aktif durum renkleri (`.magaza-kart.sahip/.aktif`,
`.magaza-btn.al/uygula/aktif`), `uyariListeDoldur()`'un uyarı-şiddeti renkleri (`.uyari-kart.dusus/
tutarsiz/iyi`) hepsi Başarılar'daki rozet sistemiyle AYNI kategori — anlamlı durum rengi, dokunulmadı.
**Tek değişiklik**: `gorevListeDoldur()`'daki "▼ Diğer N görevi göster" aç/kapa butonu `.btn` oldu
(Ders İçerikleri/Başarılar'daki aynı desenin üçüncü tekrarı).

**`#duello-modal`** — kullanıcının istediği gibi kapsama alındı. Önce **tüm giriş noktaları** bulundu:
1. Ana Ekran'ın "⚔️ DÜELLO MODU — Baskı Altında Yarış!" CTA'sı (`sporcuAnaDoldur()`, `.duello-cta-btn`) — **Ana Ekran'ın kendisi Faz 5'te henüz sırada, bu CTA'ya dokunulmadı**, sadece modalın kendisi işlendi.
2. Düello sekmesinin "⚔️ Düello Başlat" butonu (`duelloSekmesindenBaslat()`, Faz 5 grup 4'te zaten `.va-btn` olarak bırakılmıştı).
3. Gelen davet anlık bildirimi (`#duello-davet-banner`, `dueloDavetGoster()`) — uygulamanın HERHANGİ bir ekranında üstte belirebilir.
4. Düello sekmesinin kalıcı davet listesi (`duelloTabDavetYanitla()`, WS bildirimini kaçıran cihazlar için yedek).
5. Modalın kendi "🔄 Tekrar Oyna" butonu (`dueloTekrarOyna()`) — dıştan değil, sonuç ekranından kendi kendine yeniden başlatma.

**Ne değişti (sadece dış çerçeve/butonlar)**: kurulum ekranının (`dueloSecimCiz()`) rakip tipi/zorluk/
seri sayısı/ok sayısı/süre saniyesi seçici buton gruplarının hepsi `.seg`/`.seg-btn`'e taşındı (süre
AÇIK/KAPALI ikili anahtarı tek bir küçük `.btn`/`.btn-primary` kaldı — tek boolean için `.switch`'e
çevirmek orantısız bulundu). Dört ekrandaki (seçim/bekleme/devam/sonuç) navigasyon butonları (✕ kapat,
🔽 küçült, İptal Et, Tekrar Oyna, Kapat, "değiştir") `.btn`/`.btn-primary`/`.btn-ghost`'a taşındı.
Gelen davet banner'ının "✅ Kabul"/"✕" butonları da aynı diline (`.btn-primary`/`.btn`) çekildi — eskiden
banner yeşil, sekme kalıcı listesi mavi kullanıyordu, artık ikisi de tutarlı.

**Ne DOKUNULMADI (kullanıcının açıkça işaret ettiği kategoriler)**: `.duello-skor-satir`/
`.duello-skor-kutu`/`.duello-skor-deger`/`.duello-vs` (skor karşılaştırması — SEN yeşil, rakip
kırmızı, önde olan kenarlıkla vurgulanıyor), `.duello-sonuc-banner`/`banner.renk` (kazandın yeşil/
kaybettin kırmızı/berabere gold + zıplama animasyonu — kazanan/kaybeden rengi), `.duello-ok-pad`/
`.duello-ok-btn`/`.duello-anlik-oklar` (skor giriş klavyesi, Skor ekranıyla AYNI `getRenkForPuan()`
kaynağı), `.duello-sayac`/`.duello-sayac.tehlike` (geri sayım + son-10-saniye kırmızı nabız animasyonu),
`#duello-modal`/`#duello-davet-banner`/`#duello-mini-widget`'ın SABİT koyu kırmızı-siyah radyal gradyan
arka planı (temayı takip ETMİYOR — bilerek, "düello arenası" atmosferi; bu Teknik Çalışma'nın kazara
sabit-açık kalması gibi bir hata DEĞİL, kasıtlı bir tasarım kararı, bkz. §7). `dueloSeriTamamla()`/
`dueloBitir()`/`dueloRakipOkGeldi()` gibi hiçbir hesaplama/skor/senkron fonksiyonuna dokunulmadı.

**Reaksiyon** (`#icerik-refleks`, `rfxPaneliDoldur()`) — en büyük alt sistem (103 fonksiyon), ama
"dış çerçeve" yüzeyi aslında küçük: `#rfx-profil`'in kabuğu `.card`'a taşındı (zaten birebir aynı
tokenlerle stilliydi), "🏆 Lider Tablosu & Rozetler" butonu `.btn.btn-primary` oldu (bu Faz'daki her
ekranın birincil CTA'sıyla aynı muamele), ve EN DEĞERLİ değişiklik: `rfxBaslikHtml()` — Lider Tablosu
VE her bir oyunun kendi ekranı dahil TÜM alt-ekranların PAYLAŞTIĞI "← Geri" başlığı — `.btn`'e taşındı,
yani tek bir küçük değişiklik onlarca oyun ekranına birden yayıldı. **Dokunulmadı**: kategori
başlıklarının renk kodlaması (⚡ kırmızı, 🧠 mor, 🏹 turuncu, 🫁 yeşil — hangi oyun grubunda olduğunu
gösteren kasıtlı bir yön bulma rengi), her oyun kutusunun kategori rengine göre kenarlığı, "MONOPOLY
AYI" özel/parlayan promosyon kutusu (rozet nadirlik sistemiyle aynı `.rozet-kart.dag` class'ını
yeniden kullanıyor), Lider Tablosu'nun madalya/sıralama renkleri, ve `#rfx-oyun-alani` içindeki HİÇBİR
oyunun kendi mekaniği/canvas'ı/rengi (103 fonksiyonun tamamı).

**Doğrulama**: 360/1280px, koyu/açık (8 kombinasyon, Mağaza+Reaksiyon menü+lider) + Düello modalının
gerçek `.click()` akışı (kurulum → sanal rakip düellosu → 3 seri × 3 ok → sonuç ekranı) + gelen davet
banner'ının veri-önizlemesi, hepsinde yatay taşma yok. **Not**: testler sırasında bazı bağlamlarda
"Failed to fetch" konsol hatası gözlendi — kök neden arka planda 25 saniyede bir çalışan periyodik
düello-yoklama/senkron isteği; bu turun HİÇBİR değişikliğiyle ilgisiz olduğu, hiçbir etkileşim
yapılmadan sadece oturum açıp beklemekle de aynı hatanın oluştuğu ayrı bir temel-çizgi testiyle
doğrulandı. Sunucu loglarında (`wrangler dev`) karşılık gelen hiçbir hata yok — istemci tarafı, muhtemelen
yerel geliştirme sunucusunun art arda çok sayıda test bağlamı altında ara sıra bağlantı reddetmesi.
Gerçek bir regresyon değil, ama Faz 6'ya bir not olarak eklendi (bkz. §6).

## 3. Token mimarisi (styles.css, tam liste)

Hepsi `:root` içinde, aksi belirtilmedikçe. **Eski değişkenlerin hiçbiri silinmedi** —
yenileri onların üstüne, tutarlı isimlendirmeyle eklendi.

### Eski/temel tokenlar (Faz 1 öncesinden, hâlâ canlı kullanımda)
| Token | Değer (koyu tema) | Not |
|---|---|---|
| `--bg-main` | `#0a0a0c` | Açık temada `#eef1f6` |
| `--bg-panel` | `rgba(28,28,32,.86)` | Açık temada `#ffffff` |
| `--text-main` | `#f5f5f6` | Açık temada `#111827` |
| `--text-muted` | `#9a9aa3` | Açık temada `#4b5563` |
| `--border-color` | `rgba(255,255,255,.12)` | Açık temada `#d3dae6` |
| `--accent-orange` | **`#F26B1D`** | Bu turda rebrand edildi (eskiden `#ff6a1a`, app.js'te ayrıca yanlış yazılmış `#ff6200` de buna birleşti) |
| `--accent-grey` | `#6b7280` | |
| `--neon-blue` | `#4d8dff` | |
| `--neon-pink` | `#ec4899` | Cinsiyet rengi olarak da kullanılıyor, dikkat |
| `--neon-red` | `#ef4444` | |
| `--gold` | `#fbbf24` | PALETLER sistemi tarafından runtime'da değiştirilebilir (bkz. §7) |
| `--neon-green` | **`#4FB07A`** | Bu turda rebrand edildi (eskiden `#22c55e`) |
| `--ring-yellow/red/blue/black/white` | `#fbbf24/#ef4444/#3b82f6/#1e293b/#f8fafc` | WA skor halkası renkleri, ASLA değişmeyecek |
| `--tapu-sari/kirmizi/mavi` | `#fbbf24/#ef4444/#4d8dff` | Monopoly/Tapu mini-oyunu — bilerek `--ring-*`/`--neon-*`'a ALIAS DEĞİL, bağımsız |
| `--aurora-cyan/magenta/violet/gold` | `#00F0FF/#FF2FD0/#9B3BFF/#FFD23F` | "Aurora Sahne" aksanı, `--neon-blue/pink`'ten kasıtlı ayrı |

### Faz 1'de eklenen tasarım token katmanı
| Token | Kaynak/değer | Alias mı? |
|---|---|---|
| `--font-sans` | `'Archivo','Poppins',system-ui,-apple-system,sans-serif` | — |
| `--surface-0` | `var(--bg-main)` | Evet — **hem `:root` hem `body.light-theme`'de ayrı tanımlı** (aşağıya bkz: alias-tema tuzağı) |
| `--surface-1` | `var(--bg-panel)` | Evet, aynı şekilde iki yerde |
| `--surface-2` | `rgba(255,255,255,.06)` (açıkta `rgba(0,0,0,.04)`) | Hayır, iki temada da ayrı literal |
| `--surface-border` | `var(--border-color)` | Evet, iki yerde |
| `--text-primary` | `var(--text-main)` | Evet, iki yerde |
| `--text-secondary` | `var(--text-muted)` | Evet, iki yerde |
| `--text-tertiary` | `rgba(245,245,246,.45)` (açıkta `rgba(17,24,39,.45)`) | Hayır, iki temada ayrı literal |
| `--text-on-accent` | `#fff` | Hayır (tema-bağımsız) |
| `--text-on-accent-dark` | `#000` | Hayır |
| `--accent` | `var(--accent-orange)` | Evet — ama tema-bağımsız kaynak, `body.light-theme`'de TEKRARA GEREK YOK |
| `--accent-strong` | `#ff9152` | Hayır |
| `--accent-soft` | `rgba(242,107,29,.15)` (açıkta `.12`) | Hayır, iki temada ayrı literal |
| `--status-success` | `var(--neon-green)` | Evet, tema-bağımsız kaynak |
| `--status-success-strong` | `#059669` | Hayır (bu turda eklendi, DAĞCAN/haftalık-rapor gradyan ortağı için) |
| `--status-warning` | `var(--gold)` | Evet, tema-bağımsız kaynak |
| `--status-danger` | `var(--neon-red)` | Evet, tema-bağımsız kaynak |
| `--status-info` | `var(--neon-blue)` | Evet, tema-bağımsız kaynak |
| `--score-ring-yellow/red/blue/black/white` | `var(--ring-*)` | Evet, tema-bağımsız kaynak — WA renkleri, sadece isimlendirildi |
| `--space-1..8` | `4/8/12/16/24/32/48/64px` | — |
| `--radius-sm/md/lg/pill` | `6/10/16/999px` | — |
| `--text-xs/sm/base/md/lg/xl/2xl` | `11/13/15/17/20/26/34px` | — |
| `--weight-regular/medium/bold/black` | `400/600/800/900` | — |
| `--leading-tight/normal` | `1.2/1.5` | — |

**⚠️ Alias-tema tuzağı (gerçek bug, bu turda bulundu — bkz. [[css-alias-token-theme-gap-bug]] hafıza kaydı):**
`:root`'ta `var(--other)` şeklinde tanımlı bir token, DEĞERİNİ tanımlandığı yerde (yani
`:root`'ta, koyu tema değerleriyle) bir kere hesaplayıp donduruyor. `body.light-theme`
sadece `--other`'ı değiştirmek bunu geriye dönük GÜNCELLEMİYOR. Bu yüzden kaynağı
temaya göre değişen her alias (`--surface-0/1/border`, `--text-primary/secondary`)
`body.light-theme` içinde AYRICA tekrar tanımlandı. Kaynağı tema-bağımsız olanlar
(`--accent`, `--status-*`, `--score-ring-*`) buna gerek duymuyor. **Yeni bir alias token
eklerken kaynağının iki temada da aynı olup olmadığını kontrol et.**

### `.baski` isim alanı (PDF/yazdırma, `:root`'ta DEĞİL)
```
.baski { --print-bg:#ffffff; --print-ink:#1b2a4a; --print-line:#e2e8f0;
         --print-muted:#64748b; --print-accent:#F26B1D; --print-warn:#78350f; }
```
**Neden ayrı:** Karne/rapor/PDF ekranları (Gelişim Karnesi, Aidat Raporu, Turnuva
Raporu vb.) kağıda basılıyor, uygulamanın koyu/açık temasından TAMAMEN BAĞIMSIZ kalması
gerekiyor — kullanıcı koyu temadayken bile rapor hep "kağıt" renklerinde olmalı. `:root`'a
konursa tema değişince rapor da yanlışlıkla değişirdi. Henüz hiçbir print ekranına
`.baski` class'ı eklenmedi — bu, o ekranların çıplak hex'leri taşınırken (ileride) olacak.

## 4. İsim eşleme tablosu (prompt adı → korunan mevcut ad → yeni değer)

| Promptun önerdiği ad | Korunan mevcut ad | Yeni değer |
|---|---|---|
| `--text` | `--text-main` (+ `--text-primary` alias) | değişmedi |
| `--accent` | `--accent-orange` | `#F26B1D` |
| `--s-gold` | `--gold` | değişmedi (`#fbbf24`) |
| `--ok` | `--neon-green` | `#4FB07A` |

İki isim sistemi (eski `--text-main` vb. / promptun `--text` vb.) yan yana durmuyor —
her zaman ESKİ AD korunuyor, sadece değeri güncelleniyor. `--surface-*`/`--space-*`/
`--text-xs..2xl`/`--weight-*` gibi Faz 1 eklemeleri promptla isim çakışması yaşamıyor.

## 5. Faz 2 bileşen kütüphanesi

Hepsi styles.css'te, sadece Faz 1 tokenlarından besleniyor, gradyan/neon-gölge/
büyük-harf yok. **Faz 3-5'te `.tabs`/`.btn`/`.card`/`.settings-row`/`.switch`/`.seg`/
`.empty` gerçek ekranlarda kullanılmaya başlandı** — geri kalanı (`.table`, `.chip`)
hâlâ hiçbir ekrana uygulanmadı, Faz 5'te ekran ekran olacak.

- **`.btn`** (+ `.btn-primary`, `.btn-danger`, `.btn-ghost`, `.btn-sm`) — her tıklanabilir aksiyon butonu. **Kullanımda**: "Daha" panelinin "Kapat" butonu, Skor ekranının tek "Seriyi kaydet" düğmesi, Liderlik'in yönetim butonları (`.btn-danger` dahil), Gelişim'in "Antrenman Başlat" CTA'sı, Ders İçerikleri'nin "Rastgele Seç"/"Yeni Ders Ekle"/"Kullanım Raporu"/kart aksiyonları (Sil → `.btn-danger`).
- **`.card`** — bir bilgi/özet bloğunu diğerlerinden ayırmak için. Tekdüze gölge yok, sadece kenarlık. **Kullanımda**: "Daha" paneli, Skor/Sayaç/Liderlik'in katlanır ayar panelleri, Canlı Takip'in sporcu kartları, Gelişim'in 4 katlanır bölümü, Ders İçerikleri'nin filtre paneli + ders kartları + admin panelleri.
- **`.chip`** (+ `.chip-success/-warning/-danger`) — küçük durum/etiket rozeti. Henüz kullanılmadı (karıştırma: Skor ekranının `.seri-cip`'i ayrı, kendi ok-rengi mantığı olan Faz 4b bileşeni).
- **`.seg`** + `.seg-btn` — 2-4 seçenekli segmentli seçici. **Kullanımda**: Skor ekranının "Bu seride kaç ok" seçici (Faz 4c), Ders İçerikleri'nin tip filtresi (Faz 5 grup 2).
- **`.switch`** + `.slider` — açık/kapalı anahtar. **Faz 4c'de uygulandı**: Skor ekranının "Ciddi yarışma modu" anahtarı (eski elle-boyanan özel switch'in yerini aldı).
- **`.settings-row`** + `.settings-label`/`.settings-hint` — bir ayarlar panelindeki her satır. **Faz 4c'de uygulandı**: "Seri ayarları" panelinin 5 satırı.
- **`.tabs`** + `.tabs-btn` — üst-seviye navigasyon deseni. **Faz 3'te uygulandı**: `#tabs-ana` (masaüstü üst bar) ve `#daha-tab-btn` bunu kullanıyor. Eski `.sekme-grubu`/`.sekme-btn.aktif` (gradyan/glow'lu) artık hiçbir elemente uygulanmıyor (id-seçiciler kazanıyor) — silinmedi, Faz 6'da temizlenecek.
- **`.table`** — düzenli veri tablosu. Henüz kullanılmadı — app.js'te onlarca ayrı inline-style'lı `<table>` var, zamanla buna taşınabilir.
- **`.empty`** + `.empty-icon`/`.empty-title`/`.empty-hint` — "henüz veri yok" durumları. **Kullanımda**: Canlı Takip'in boş/hata durumları (Faz 5 grup 1), Ders İçerikleri'nin "sonuç yok" durumu (Faz 5 grup 2).

**Faz 4b'de EKLENEN yeni class'lar** (Skor ekranına özel, orijinal Faz 2 listesinde yoktu):
`.seri-seridi`/`.seri-cip-satir`/`.seri-cip`/`.seri-cip-cezali`/`.seri-cip-toplam` — okuyan
seri-şeridi bileşeni, `getRenkForPuan()`'dan renk alıyor, kendi state'i yok.

**Faz 3'te EKLENEN yeni class'lar** (bunlar orijinal Faz 2 listesinde yoktu, navigasyona özel):
`.alt-bar`/`.alt-bar-btn` (mobil sabit alt bar), `.daha-grup`/`.daha-grup-baslik`/`.daha-grup-mobil`
(Daha panelindeki gruplar — sonuncusu sadece ≤680px'te görünür), `#daha-panel .sekme-btn`/`#tabs-ana
.sekme-btn` (id-seçici override'lar, eski `.sekme-btn` görselini geçersiz kılıyor).

Görsel kanıt: `component-preview-dark.png`/`component-preview-light.png` (Faz 2, kullanıcıya
SendUserFile ile gönderildi, repo'da değil) + Faz 3'ün 1280px/360px üst bar+Daha paneli
ekran görüntüleri (aynı şekilde gönderildi, repo'da değil).

## 6. Kalan iş

- **Faz 3 — Navigasyon: TAMAMLANDI** (bkz. §2a). 15 sekme → 6 ana (`#tabs-ana`) + "Daha" paneli
  (3 grup + mobilde 4. "Sık kullanılan" grubu), mobil sabit alt bar, 15 tek-aile SVG ikon,
  rol senkronu (sporcu/eğitmen) test edildi ve doğru.
- **Faz 4 — Skor ekranı: TAMAMLANDI** (bkz. §2b). Sticky tuş takımı, okuyan seri şeridi, tek
  kaydet düğmesi, katlanır "Seri ayarları" paneli. 360×640'ta hedef artık görünür.
- **Faz 5 — Diğer 14 ekran**: aşağıdaki durum tablosuna bakılacak. Her biri için önce tek
  cümlelik plan sun, onay bekle, sonra uygula (promptun kendi yöntemi).
- **Faz 6 — Temizlik/doğrulama**: kalan çıplak hex tarama (ana rapor + `renk-envanteri-uzun-kuyruk-2026-09.md`
  zaten hazır), kalan emoji ikon taraması, kontrast kontrolü, 360/768/1280px ekran görüntüleri,
  özet rapor. Ölü CSS/JS listesi (şimdiye kadar birikenler):
  - `#alt-menu` id'li ölü kod satırı (app.js ~9437, `document.getElementById('alt-menu')` — element yok, no-op).
  - Eski `.sekme-grubu`/`.sekme-btn.aktif` gradyan/glow kuralları (styles.css ~248, ~1027-1038, ~1090).
  - 560px medya sorgusundaki eski `.sekme-grubu`/`.sekme-btn` boyut override'ı (styles.css ~481-482).
  - Faz 1'in "token geçişinden sonra ölü kalan eski CSS kurallarını tespit et" maddesi genel olarak geçerli, yukarıdakiler ilk somut örnekler.
  - (4b'de zaten SİLİNDİ, listeye eklenmesi GEREKMİYOR ama tarih için not: `#yuzen-kaydet-btn`, `#ok-rozetleri`/`.ok-rozet-alani`. `.ok-rozet` CSS class'ı — sadece bu iki elementi biçimlendiriyordu, styles.css:410-411'de hâlâ duruyor, artık kullanılmıyor, Faz 6'da silinebilir.)
  - **styles.css'teki TÜM `!important` kurallarını tara ve raporla** — şu an 64 tane var (`grep -c
    "!important" public/styles.css`). Hangileri gerçekten gerekli (ör. id-seçici modal z-index
    deseni, `#tabs-ana{display:none!important}` gibi tema/durum zorlamaları) hangileri aslında bir
    kaynak-sırası sorununu geçici olarak örtüyor (bu turda bulunan `.sekme-icerik` örneği gibi) —
    ayrıştırılıp, ikincisi varsa kural taşınarak `!important` kaldırılmalı.
  - **Faz 3-5'te eklenen kuralların dosyadaki konumu doğru mu kontrol et** — yani ezip ezilmedikleri
    (kaynak-sırası çakışması) var mı. Bu turda `.sekme-icerik` padding-bottom'da TAM BÖYLE bir bug
    bulunup düzeltildi (kuralı doğru yere taşıyarak, `!important` KULLANMADAN) — aynı sınıfın başka
    örnekleri olabilir, sistemli taranmadı.
  - **Proje kökündeki `./dagsk-teknik-calisma.js`** — `public/dagsk-teknik-calisma.js`'in (canlı,
    `app.html`'in yüklediği kopya) Faz 5 grup 2'den ÖNCE birebir aynısı olan, hiçbir yerden
    yüklenmeyen ölü bir kopyaydı (bkz. §2d). Artık iki dosya UYUŞMUYOR — ya silinmeli ya da
    (daha az riskli ama gereksiz) yeniden senkronlanmalı.
  - `.tree-cat-btn`/`.aktif-klasik`/`.aktif-makarali` (styles.css ~449-451) — Faz 5 grup 4'te
    Yarışmalar'ın kategori sekmesi `.seg`/`.seg-btn`'e taşınınca kullanımdan kalktı (grep ile
    doğrulandı, başka hiçbir yerde referans yok), silinebilir.
  - **Periyodik arka plan isteklerinin ara sıra "Failed to fetch" atması** — Faz 5 grup 5 testlerinde
    gözlendi, HİÇBİR kod değişikliğiyle ilgisiz olduğu doğrulandı (bkz. §2g) — muhtemelen düello
    yoklama/senkron `setInterval`'ının yerel `wrangler dev` altında ara sıra bağlantı reddi alması.
    Prod'da (gerçek Workers ortamı) tekrar eder mi kontrol edilmemiş — Faz 6'da bakılabilir.

### Faz 5 ekran durum tablosu

Sıralama **kullanım sıklığına göre** (sık kullanılanlar önce) — istisna: **Ana Ekran bilerek EN
SONA kondu**, çünkü içinde Ders Programı'nın sporcuya baktığı canlı bir bileşen var (aşağıya bkz).
Sıklık tahminleri kod sinyallerinden çıkarıldı (varsayılan iniş ekranları, rol-görünürlük
listeleri, kullanıcının Faz 3'te Klasman için söylediği "ayda birkaç kez") — gerçek kullanım
analitiği değil, kabaca bir tahmin; yanlışsa düzeltilebilir.

| # | Ekran | Durum | Not |
|---|---|---|---|
| — | Skor | ✅ bitti (Faz 4) | — |
| 1 | Sayaç | ✅ bitti (Faz 5 grup 1) | Katlanır "Sayaç ayarları" paneli eklendi. |
| 2 | Canlı Takip | ✅ bitti (Faz 5 grup 1) | Ayar yoktu, sadece `.card`/`.seri-cip`/`.empty`'ye taşındı. |
| 3 | Liderlik | ✅ bitti (Faz 5 grup 1) | Katlanır "Yönetim" paneli, 2 alt grup (zararsız/tehlikeli, ayrı). |
| 4 | Gelişim | ✅ bitti (Faz 5 grup 2) | 4 katlanır bölüm `.card`'a taşındı, CTA `.btn-primary` oldu. |
| 5 | Ders İçerikleri | ✅ bitti (Faz 5 grup 2) | Filtre `.seg`, kartlar `.card`, Sil `.btn-danger`. `Ders Programı` İLE KARIŞTIRILMAMIŞTIR — ayrı özellik. |
| 6 | Teknik Çalışma | ✅ bitti (Faz 5 grup 2) | Kendi `.tk-` paleti Faz 1 tokenlarına bağlandı (bkz. §2d) — yapıya dokunulmadı. |
| 9 | Başarılar | ✅ bitti (Faz 5 grup 3) | Sadece "Diğer N rozeti göster" `.btn` oldu — gerisi ya zaten token-tabanlıydı ya anlamlı rozet/çerçeve rengiydi (bkz. §2e). |
| 12 | Klasman | ✅ bitti (Faz 5 grup 3) | Yay filtresi `.seg`, grup başlığı `.card`. Madalya/canlı-parıltı renklerine dokunulmadı (bkz. §2e). |
| 7 | Yarışmalar | ✅ bitti (Faz 5 grup 4) | `.card`/`.seg`, "Yarışmaları Sıfırla" ayrı `.btn-danger` grubuna taşındı (confirm() zaten vardı, sadece doğrulandı — bkz. §2f). |
| 8 | Düello | ✅ bitti (Faz 5 grup 4) | Değişiklik YOK — `.va-*` ailesi zaten Faz 1 tokenlarından besleniyordu (bkz. §2f). |
| 13 | Video | ✅ bitti (Faz 5 grup 4) | Değişiklik YOK — aynı `.va-*` ailesi. Gecikmeli Ayna'nın çizim rengi (`#fbbf24`, canvas üzerinde sabit) mekanik olduğu için dokunulmadı. |
| 10 | Mağaza | ✅ bitti (Faz 5 grup 5) | Tek değişiklik: "Diğer N görevi göster" `.btn`. Rozet nadirlik/sahiplik/uyarı renkleri dokunulmadı (bkz. §2g). |
| 11 | Reaksiyon | ✅ bitti (Faz 5 grup 5) | `#rfx-profil` `.card`, Lider Tablosu butonu `.btn-primary`, paylaşılan "← Geri" başlığı (`rfxBaslikHtml`) `.btn` — 103 fonksiyonun tamamı ve kategori renkleri dokunulmadı. |
| — | `#duello-modal` | ✅ bitti (Faz 5 grup 5) | Düello ekranının (madde 8) PARÇASI, ayrı satır yok — kullanıcının isteğiyle grup 5'e eklendi. Kurulum ekranı `.seg`/`.seg-btn`, navigasyon butonları `.btn` — skor/kazanan renkleri, ok pad, sayaç, atmosferik koyu arka plan dokunulmadı (bkz. §2g). |
| 14 | **Ana Ekran** | ⏳ bekliyor, **EN SON** | ⚠️ İçinde `#sonraki-ders-widget` var — `loggedInSporcu` için `/api/antrenman-programi`'den canlı veri çeken, **Ders Programı'na bağlı** bir bileşen (app.js:274, `sonrakiDersWidgetGuncelle()`). Ders Programı yarım bir özellik (bkz. §7) — bu widget'a dokunurken ekstra dikkat. Ayrıca `#canli-takip-widget-ana` da burada gömülü (Canlı Takip ekranıyla karışık bağımlılık). En sık kullanılan ekran olmasına rağmen en kırılgan bağımlılıklara sahip olduğu için en sona bırakıldı. |

**Sıralama güncellemesi (Faz 5 grup 3 sonrası)**: kalan 7 ekranın gruplanışı kullanıcı tarafından
zorluk/risk gözetilerek yeniden belirlendi — Grup 4: Yarışmalar + Düello + Video, Grup 5: Mağaza +
Reaksiyon (Reaksiyon bilerek en son, Ana Ekran hariç en riskli/en büyük ekran). Tablodaki orijinal
sıra numaraları (7-13) korundu, sadece grup ataması güncellendi.

**Araştırma notu**: "Ders Programı" 15 ekranın hiçbirinin KENDİSİ değil — asıl CRUD'u (`yoneticiProgramCiz`,
`sporcuProgramCiz`) Yönetici Paneli'nin kendi modallarında yaşıyor, o panel Faz 3'te doğrulandığı gibi
sekme-tab navigasyonuna hiç girmiyor. Ana Ekran'daki `#sonraki-ders-widget` bu veriye SADECE OKUYARAK
bakan tek sekme-içi bağlantı — kullanıcının "Ders Programı'nın olduğu ekran" ifadesi bunu işaret ediyor.

## 7. Kurallar ve tuzaklar

- **Dokunulmayacaklar**: Firestore/D1 fark etmez, veri katmanı çağrıları (`turnuvaDB`,
  `bulutaGonderKontrol()`, `_skorKaydetCekirdek()`); `_vT` zaman damgası senkron mantığı;
  sürüm kilidi sistemi; SHA-256 PIN doğrulama; puan hesaplama fonksiyonları; JS'in
  `getElementById`/`querySelector`/`classList` ile referans verdiği HER id/class adı —
  bir class'ı değiştirmeden önce JS'te geçip geçmediğini ara, geçiyorsa adı koru, sadece
  CSS kuralını değiştir.
- **Ders Programı** (`antrenman_programi*`, migration 0035) kasıtlı olarak yarım bırakılmış
  bir özellik (WIP commit `55d8093`) — silme veya "tamamlama", sadece diğer ekranlarla aynı
  token/bileşen setini uygula, fonksiyonel dokunma.
- **CSS yorumlarına ASLA `*/` veya backtick koyma** — ikisi de bu turda gerçek bug'a yol
  açtı (`*/`: bir yorumun içinde "--ring-*/--neon-*" yazmak yorumu erken kapatıp
  `:root`'un geri kalanını tarayıcıda sessizce sildi; backtick: `KM_OYUN_CSS` bir JS
  template literal olduğu için içine backtick koymak app.js'i bozar).
- **Aynı hex birden fazla iş yapıyorsa iş sayısı kadar tokena bölünür**, tek tona
  indirilmez (ör. `#ef4444` hem skor-halkası-kırmızısı hem `TEAM_COLORS` paleti hem
  `CERCEVE_RENK.alev` — üçü ayrı token/kavram, aynı hex olması tesadüf).
- **Baskı/PDF ekranları koyu/açık temadan bağımsız**, `.baski` isim alanı altında kalır,
  `:root`'a asla karışmaz.
- **app.js'te toplu bul-değiştir YASAK** — renkler tek tek, bağlamı OKUNARAK değiştirilir.
  Bu turda `#059669`'un 5 kullanımından sadece 3'ü (gerçek gradyan-ortağı) `var(--status-success-strong)`'a
  bağlandı, diğer 2'si (`egitmenKarnePDF` ~1846, Gelişim Karnesi raporu ~7524) print
  bağlamında olduğu için DOKUNULMADI — tam da bu kuralın canlı örneği.
- **Her faz sonunda dur, özetle, onay bekle.** Tek seferde tüm dosyayı yeniden yazma.
- **Görsel değişikliklerde ekran görüntüsü al** — sayısal doğrulama (`getComputedStyle`
  vb.) tek başına yeterli değil. Bu turda `body.light-theme` alias bug'ı SADECE ekran
  görüntüsüyle yakalandı, sayısal kontrol (`documentElement` üzerinde) onu kaçırmıştı.
- **Faz onaylanır onaylanmaz hemen commit at** — bu turda atlanan bir adım, bir daha
  atlanmayacak (bkz. §2).
- **Bir id role göre `style.display` ile gizleniyorsa (`tablariPlatformaGoreAyarla()`, `g('tab-X',bool)`)
  ve o sekme için YENİ bir kısayol/kopya buton eklersen (ör. mobil alt bar), kısayolun görünürlüğünü
  gerçek elemandan MANUEL senkronize et** — otomatik gelmiyor, ayrı bir DOM elemanı ayrı görünürlük
  demektir. Faz 3'te bu gözden kaçırılabilirdi, `tablariPlatformaGoreAyarla()`'ın sonuna eklenen
  senkron bloğuyla çözüldü. Yeni bir kısayol/kopya buton eklerken bu listeyi güncellemeyi unutma.
- **Kullanıcının bahsettiği bir "rol" koddaki gerçek bir role karşılık gelmeyebilir** — bu turda
  "veli" rolü diye bir şey navigasyon sisteminde yoktu (kod grep'lenerek doğrulandı), "yönetici" de
  aslında bu nav'a hiç girmiyor (`yoneticiPaneliAc()`'a ayrı bir dal). Varsayılan/tahmini rol icat
  edip test etmek yerine önce kodda gerçekten kaç rol/dal olduğunu doğrula, sonra ona göre test et.
- Genel proje kuralları (bu tasarım işine özel olmayan ama geçerli olmaya devam eden):
  yerel D1 `egitmen_hash` test-giriş takası her zaman iş bitince geri alınır; `wrangler dev`
  oturumlar arası hayatta kalmaz, önce curl-healthcheck; PowerShell `-Raw`/`-replace`/
  `Set-Content` app.js/styles.css için YASAK (Türkçe karakter bozulması) — Edit tool kullan.
- **Var olan, state tutmayan bir render fonksiyonuna (ör. `hedefGorseliGuncelle()`) yeni bir
  görsel özellik eklemek, YENİ bir state kurmaktan çok daha güvenli** — fonksiyon zaten doğru
  anda (her veri değişiminde) çağrılıyor, sen sadece aynı zaten-hesaplanmış değişkenleri okuyup
  ek bir DOM güncellemesi ekliyorsun. Faz 4b'nin seri şeridi bunun örneği.
- **Bir eski bileşeni yeni bir bileşenle değiştirirken, ikisinin GERÇEKTEN aynı bilgiyi taşıyıp
  taşımadığını kontrol et** — aynı görünen iki gösterim küçük ama önemli bir nüans farkı
  taşıyabilir (Faz 4b: `#ok-rozetleri`'nin cezalı-ok için "orijinal puan üstü çizili + M"
  göstermesi, yeni seri şeridinin bunu başta göstermemesi).
- **Bir UI tercihinin (panel açık/kapalı, tema, vb.) D1'e mi yoksa localStorage'a mı yazılacağı
  net bir soruya indirgeniyor: bu veri cihazlar/kullanıcılar arası senkronize olmalı mı?**
  Hayırsa localStorage (Faz 4c: "Seri ayarları" panelinin açık/kapalı durumu).
- **`Ders Programı` gibi yarım bırakılmış bir özelliğin başka ekranlara SIZINTISI olabilir** —
  doğrudan "Ders Programı ekranı" diye bir şey yoksa bile, başka bir ekranın içine gömülü canlı-
  veri-okuyan bir widget üzerinden bağlı olabilir (bkz. §6 Faz 5 tablosu, Ana Ekran/
  `#sonraki-ders-widget`). Bir ekranı "bitti" ilan etmeden önce böyle gömülü bağımlılık var mı
  diye ara.
- **Bir media sorgusu içindeki kural, media sorgusu DIŞINDAKİ aynı özgüllükte bir kuralı sadece
  "media sorgusunda olduğu için" otomatik yenmez** — kazanan, ikisinden hangisi dosyada DAHA SONRA
  geliyorsa o. Faz 3'te `@media(max-width:680px){.sekme-icerik{padding-bottom:...}}` bunun tam
  önüne (satır numarası olarak) düşen, media sorgusuz eski bir `.sekme-icerik{padding:15px}`
  tarafından eziliyordu — Faz 5'e kadar (Sayaç ekranının metni alt barın arkasına girene kadar)
  fark edilmedi. Aynı selector'ı birden fazla yerde tanımlıyorsan (özellikle bir tasarım-sistemi
  geçişinde eskisi/yenisi bir arada dururken) kazananın kim olduğunu VARSAYMA, ölç.
- **Bir ekranda çalışan bir CSS/JS mekanizması başka bir ekranda da çalışıyor anlamına gelmez** —
  Faz 4'ün Skor ekranı, sticky tuş takımını `--alt-bar-h`'a DOĞRUDAN bağladığı için yukarıdaki
  padding-bottom bug'ından etkilenmedi; bu yüzden bug Faz 4'te değil Faz 5'te ortaya çıktı. Genel
  bir CSS kuralı eklerken/değiştirirken, "bir ekranda test ettim, çalıştı" o kuralı kullanan HER
  ekranı kapsamıyor — özellikle farklı ekranlar aynı genel kuralı farklı şekillerde kullanıyorsa.
- **`#hizli-otokaydet` ("Seri dolunca otomatik kaydet") varsayılan İŞARETLİ** — test scriptinde son
  oku girdikten hemen sonra AYRICA manuel kaydet butonuna basma, seri zaten otomatik kaydedilmiş
  olabileceğinden yanlış "eksik skor" hatası gibi görünen ama gerçek bir regresyon OLMAYAN bir test
  tuzağı yaratır. Skor ekranıyla ilgili test yazarken bunu hesaba kat.
- **Bir kaynak-sırası (source-order) çakışmasını `!important` ile "çözmek" borcu ertelemek, çözmek
  değil** — kısa vadede işe yarar ama styles.css'te `!important` sayısını artırır, her yeni eklenen
  biraz daha az öngörülebilir bir kaskad bırakır (bu dosyada zaten 64 tane var, bkz. §6 Faz 6
  listesi). Doğru çözüm kuralı fiziksel olarak onu ezen kuraldan SONRAYA taşımak — bu genelde
  mümkün, çünkü CSS'te iki kural arasındaki ilişkiyi SADECE ikisinin göreli konumu belirliyor,
  aralarındaki başka kod önemli değil. Taşımak gerçekten mümkün değilse (ör. iki kuralın SIRASI,
  ÜÇÜNCÜ bir kuralla olan ilişkisini bozacaksa) o zaman `!important` düşünülür — ama önce taşımayı
  dene, `!important`'ı ilk çare yapma.
- **Bir CSS değişkeni yeniden adlandırmadan/bağlamadan önce ONU KULLANAN HER KURALI grep'le** —
  aynı değişken görünüşte tek bir "renk" gibi dursa da, kodda farklı GÖRSEL ROLLER oynayabilir
  (Faz 5 grup 2: `--tk-navy` hem kart üstünde okunan metin rengi hem de kendi içinde kapalı,
  sabit beyaz metinle eşleşen bir rozet arkaplanıydı). Değişkeni tek bir yeni tokena bağlamak,
  rollerden birini doğru yaparken diğerini kırabilir — önce her kullanım yerini listele, hangi
  rollerin gerçekten temaya duyarlı olması GEREKTİĞİNİ (kartın üstünde duran metin/kenarlık) ve
  hangilerinin kendi başına yeterli, sabit kalması gerektiğini (opak, kendi zıt-renkli metniyle
  gelen rozet/buton) ayır, sonra taşı.
- **Opak, kendi ön-plan rengiyle birlikte gelen bir rozet/buton arkaplanının temayı takip etmesine
  GEREK YOK** — ör. koyu lacivert zemin + sabit beyaz metin, altındaki kart ister koyu ister açık
  olsun okunur kalır, çünkü kontrastı KENDİ İÇİNDE taşıyor. Bunu bir tema-tokenına (`--surface-*`
  gibi, kartın kendisiyle birlikte değişen) bağlamak aslında YANLIŞ hedef — kart karardığında rozet
  de kararıp kendi zemini üstünde kaybolabilir (Faz 5 grup 2, Teknik Çalışma). Sadece kartın
  YÜZEYİNDE duran düz metin/kenarlık temayı takip etmeli.
- **Kendi CSS'ini enjekte eden, "bağımsız" diye tasarlanmış bir modül bile uygulamayla görsel
  çakışabilir** — modülün kendi içinde tutarlı olması (Teknik Çalışma'nın .tk- paleti kendi
  içinde gayet düzgündü) uygulamanın GENELİNE uyduğu anlamına gelmez. Böyle bir modülü
  değerlendirirken, uygulamanın normal bir ekranıyla YAN YANA ekran görüntüsü almak (aynı üst
  bar, farklı içerik zemini) "yabancı duruyor mu" sorusunu göz kararı tartışmaktan çok daha
  hızlı ve kesin cevaplıyor.
- **Bir rengin "eski/ad-hoc" görünmesi, onun ANLAMSIZ olduğu anlamına gelmez** — Faz 5 grup 3'te
  netleşen genel prensip: madalya/sıralama renkleri (Klasman), kazanılmış/kilitli rozet durumu ve
  satın alınan çerçeve rengi (Başarılar), oyun mekaniği renkleri (kullanıcının Reaksiyon/Video için
  verdiği kural) hepsi AYNI KATEGORİ — içerik durumunu/anlamını taşıyan renkler, kart/buton chrome'u
  değil. Bir ekranı restyling yaparken önce rengin neyi TEMSİL ettiğini sor: "bu bir durumu mu
  gösteriyor (sıra, kazanım, mekanik sonuç) yoksa sadece bir kutunun zemin rengi mi?" Öncekiyse
  dokunma, sonrakiyse Faz 2 bileşenine taşı. Şüpheli bir renk çıkarsa varsayma, sor.
- **Bir ekranın kendi `.xx-card`/`.xx-btn` gibi özel class ailesi olması, onu Faz 2 öncesi/eksik
  yapmaz** — Faz 5 grup 3'te Başarılar'ın `.bs-*`'ı ve daha önce Düello/Video'nun `.va-*`'ı
  incelendiğinde ikisinin de `.card`/`.btn` ile TAM OLARAK AYNI Faz 1 tokenlarından (`--bg-panel`,
  `--border-color`, `--text-muted` vb.) beslendiği görüldü — yani zaten "Faz 2 uyumlu", sadece
  farklı isimle. Böyle bir aileyi bulunca önce styles.css'te tanımını oku; gerçekten eski/hardcoded
  renklere dayanıyorsa (Teknik Çalışma gibi) taşı, tokenlardan besleniyorsa yeniden adlandırma SAF
  ÇALIŞMA OLUR — dokunma.
- **Bir butonun rengini değiştirmeden önce, o rengi SÖZLE anan başka bir metin var mı diye ara** —
  Faz 5 grup 4'te Yarışmalar'ın iki boş-durum mesajı "yukarıdaki mavi butona" / "yukarıdaki altın
  renkli butona" diyordu; butonlar `.btn-primary` (turuncu) olunca bu metinler YANLIŞ hale geldi
  (bkz. §2f). Ekran görüntüsüyle yakalandı, kod okumakla değil — bu yüzden her rengi değiştirdiğin
  ekranın gerçek ekran görüntüsünü al ve OKU, sadece "yatay taşma var mı" diye bakma.
- **Sabit (temayı takip etmeyen) bir arka plan her zaman bir bug değildir — bazen kasıtlı atmosfer
  tasarımıdır, ikisini birbirinden ayırt et.** Teknik Çalışma'nın sabit beyaz kartları (Faz 5 grup 2)
  KAZAYDI — modül aslında uygulamanın geri kalanıyla aynı yüzeyde durması gerekirken yanlışlıkla hep
  açık kalmıştı. `#duello-modal`'ın sabit koyu kırmızı-siyah radyal gradyanı (Faz 5 grup 5) ise
  KASITLI — "düello arenası" hissi için bilinçli bir tasarım kararı, CSS yorumunda da açıkça
  belgeli. Ayırt etme testi: modül/ekran kendi içinde tutarlı, dramatik bir atmosfer taşıyor mu
  (glow/pulse animasyonları, "arena" temalı metin, iddialı gradyanlar) yoksa sadece "unutulmuş,
  varsayılan" mı görünüyor? Şüpheliyse sor — ama önce CSS'in yanındaki yorumu oku, çoğu zaman niyet
  zaten yazılı duruyor.
- **Bir modalin "hangi ekranın parçası" olduğuna karar verirken kullanıcıya sor, kendi başına
  sınıflandırma** — `#duello-modal` ilk turda "ayrı, çoklu giriş noktalı bir sistem" diye Faz 5
  kapsamı dışında bırakılmıştı; kullanıcı bunu düzeltti: "kullanıcı için düellonun kendisi bu."
  Structural olarak ayrı bir dosya/id olması, kullanıcı deneyiminde ayrı bir şey olduğu anlamına
  gelmiyor. Böyle bir modal bulunca, önce TÜM giriş noktalarını bulup listele (bkz. §2g) — bu hem
  kapsam kararını daha bilgili verdirir hem de kullanıcının gördüğü gerçek resmi ortaya çıkarır.

## 8. Çözülmemiş konular ve açık sorular

- ~~Faz 3'ün 6'lık liste ve ikon seti~~ — **ÇÖZÜLDÜ**, bkz. §2a.
- ~~Faz 4'ün Skor ekranı tasarımı~~ — **ÇÖZÜLDÜ**, bkz. §2b.
- ~~Faz 5 grup 2 (Gelişim, Ders İçerikleri, Teknik Çalışma)~~ — **ÇÖZÜLDÜ**, bkz. §2d.
- ~~Faz 5 grup 3 (Klasman, Başarılar)~~ — **ÇÖZÜLDÜ**, bkz. §2e.
- ~~Faz 5 grup 4 (Yarışmalar, Düello, Video)~~ — **ÇÖZÜLDÜ**, bkz. §2f.
- ~~Faz 5 grup 5 (Mağaza, `#duello-modal`, Reaksiyon)~~ — **ÇÖZÜLDÜ**, bkz. §2g. `#duello-modal`
  ilk turda kapsam dışı bırakılmıştı, kullanıcının düzeltmesiyle bu grupta ele alındı.
- **Faz 5'te sadece Ana Ekran kaldı** (bkz. §6 tablosu, madde 14) — bir sonraki oturumun tek işi bu.
  Ana Ekran'ın kendi `.duello-cta-btn`'i (aynı `#duello-modal`'ı açan) HENÜZ dokunulmadı — Ana Ekran
  sırası gelince ele alınacak.
- `renk-envanteri-uzun-kuyruk-2026-09.md`'deki 372 düşük-frekans hex OTOMATİK/bağlam
  okunmadan ön-sınıflandırıldı — Faz 6'ya kadar gerçek bir onay/işlem beklemiyor, ama
  o dosyanın "düşük güven" etiketi unutulmamalı.
- **Faz 5 ekran sıralaması (§6 tablosu) bir TAHMİN** — gerçek kullanım analitiği yok, kod
  sinyallerinden (varsayılan iniş ekranları, kullanıcının Klasman hakkında söylediği söz) ve
  genel muhakemeden çıkarıldı. Yeni oturum bu sıraya körü körüne bağlı kalmak zorunda değil,
  kullanıcı isterse değiştirilebilir.
- Faz 5'in her ekranı için henüz somut bir plan yok — her birine başlarken promptun kendi
  yöntemiyle (tek cümlelik plan → onay → uygula) ayrı ayrı başlanacak.
- Bu tasarım işiyle ilgisiz ama proje genelinde açık kalan eski maddeler (KM Oyunlar
  Fullscreen-API taşma raporu, Yıldız Seferi/Dağ Tırmanışı içerik zenginleştirme) bu
  devrin kapsamı DIŞINDA — ayrı hafıza dosyasında (`dagsk-km-oyunlar-2026-09.md`) duruyor,
  karıştırılmamalı.

## 9. Sonraki iş (Faz 6 SONRASI — bu bir tasarım işi DEĞİL, veri katmanı işi, ayrı ele alınacak)

**Bağlam**: Faz 5 grup 5 testlerinde (bkz. §2g) periyodik arka plan isteklerinin ara sıra
"Failed to fetch" / `net::ERR_INSUFFICIENT_RESOURCES` verdiği gözlendi. Kullanıcının isteğiyle
kök nedeni tam teşhis edildi (bu bölüm o teşhisin özeti) — **düzeltme YAPILMADI, bilerek**:
tasarım işi bitmeden ikinci bir cepheye girilmiyor.

**Sorun**: `bulutaGonderKontrol()` (app.js:6168), `setInterval` ile **10 saniyede bir** çalışıyor
ve `fanOutMasterPayload()` (public/sync.js:219) üzerinden **kulübün TAMAMININ anlık görüntüsünü**
— her sporcu (3 istek: `/api/athletes` POST + PATCH + `/gamification` PATCH), her aidat hücresi
(`/api/dues/:ad/:ay` PUT), her yoklama kaydı (`/api/attendance/auto` POST), her personel/personel-
yoklama/özel-sınıf kaydı — **toplu işlem yapmadan, eşzamanlılık sınırı olmadan**, hepsini aynı anda
`Promise.all(jobs)` ile gönderiyor. Bu tasarım DEĞİŞENİ değil TÜMÜNÜ her seferinde yeniden gönderdiği
için hacim sporcu/aidat/yoklama kaydı sayısıyla DOĞRUSAL büyüyor — ve aidat/yoklama kayıtları hiç
silinmediğinden (arşivlenmiyor) hacim zamanla SADECE artar, asla küçülmez.

**Riskli yanı**: `fanOutMasterPayload()`'daki HER job kendi `.catch(() => {})`'ine sahip — bir istek
başarısız olunca sessizce yutuluyor, ne konsola uncaught hata düşüyor ne kullanıcıya bildiriliyor.
Tek "kurtarma" bir sonraki 10 saniyelik döngünün aynı alanı yeniden göndermesi — bu bir retry
TASARIMI değil, tesadüf. (İyi haber: skor kaydı — `seriBulutaYaz()` — bu kütleden tamamen ayrı,
kendi write-ahead kuyruğuyla korumalı; bkz. teşhis raporu / bu oturumun sohbet geçmişi.)

**Ölçüm (gerçek kulüp verisiyle)**: Bu oturumdan `wrangler d1 execute --remote` ile prod D1'i
sorgulamayı denedim — **başarısız**: mevcut OAuth token'ın izin kapsamında (`wrangler whoami`
çıktısı: account/user/workers/workers_kv/workers_routes/workers_scripts/workers_tail) **D1 hiç
yok**, `code: 7403` ("account not authorized") döndü. Yerel `--local` D1'de onlarca oturumdan
biriken test verisi var (gerçek sayıyı yansıtmıyor), o yüzden ORADAN da sayı üretmedim — kullanıcı
özellikle "test verisini sayma" dedi. Bunun yerine `fanOutMasterPayload()`'ın kodundan **birim
maliyet formülünü** çıkardım — gerçek sayılar elde edilince (D1 izni eklenip sorgulanarak ya da
kullanıcının kendi bildiği rakamla) doğrudan yerine konabilir:

```
istek sayısı ≈ 3 × (aktif+pasif TÜM sporcu sayısı, 4 grup toplamı)
             + 1 × (aidatDB hücre sayısı = dolu ay × sporcu, genelde sporcu×~12)
             + 1 × (otomatikYoklamaDB kayıt sayısı = gün × o gün gelen sporcu)
             + 1 × (personelDB sayısı)
             + 1 × (personelYoklamaDB'deki gelen+gelmeyen personel-gün sayısı)
             + 1 × (ozelSiniflar sayısı)
             + 3 (credentials + min-surum + extra_blob — sabit)
```
Örnek: 60 sporculuk gerçek bir kulüpte SADECE sporcu+aidat kısmı bile 60×3 + 60×12 ≈ **900 isteğe**
yakın olur — `ERR_INSUFFICIENT_RESOURCES`'a yol açan yerel testteki 500+ isteklik hacimle AYNI
mertebede. **Bu riskin sanıldığından çok daha yakın olabileceğini gösteriyor** — küçük-orta
büyüklükte gerçek bir kulüp bile bu sınıra yaklaşabilir. Kesin sayı için gerçek `athletes`/`dues`/
`attendance_auto`/`personnel`/`personnel_attendance`/`custom_classes` satır sayıları prod D1'den
çekilmeli (D1 izni olan bir hesapla `wrangler d1 execute dagsk-db --remote --command "SELECT
(SELECT COUNT(*) FROM athletes) a, (SELECT COUNT(*) FROM dues) d, (SELECT COUNT(*) FROM
attendance_auto) y, (SELECT COUNT(*) FROM personnel) p, (SELECT COUNT(*) FROM
personnel_attendance) py, (SELECT COUNT(*) FROM custom_classes) o;"`) ya da kullanıcı kendi
rakamını verirse formüle yerine konur.

**Olası yön (uygulanmadı, sadece not)**: (1) değişen alanları gönder (tam anlık görüntü değil,
delta), (2) eşzamanlılık sınırı (ör. aynı anda en fazla N istek, kalan kuyrukta), (3) hata sayacı —
art arda başarısız olan job sayısı bir eşiği aşınca kullanıcıya görünür bir uyarı (mevcut
`bulutDurum()` göstergesine benzer), (4) aidat/yoklama gibi büyümeye devam eden koleksiyonlar için
arşivleme/budama stratejisi.
