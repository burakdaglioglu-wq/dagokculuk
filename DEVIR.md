# DEVİR — DAĞ Spor Kulübü Tasarım Sistemi Geçişi

Bu dosya, bağlam penceresi dolduğu için yeni bir oturuma aktarılan işin durumunu özetler.
Yeni oturum bu dosyayı okuyup, önceki oturumun tamamını bilmeden devam edebilmeli.

## 0. KAPANIŞ — Tasarım Sistemi Geçişi + origin/main Merge TAMAMLANDI (2026-09-08)

**GÜNCELLEME**: Bu kapanıştan SONRA, aynı gün içinde **Faz 7 — Karışık Sınıf yeniden tasarımı** da
tamamlandı (sekme şeridi kalktı, sınıf kartı + araç ızgarası geldi) — bkz. §11. Aşağıdaki özet
Faz 0-6 + merge'i kapsıyor, Faz 7 dahil değil.

**Kullanıcı onayladı: tasarım geçişi bitti VE origin/main ile birleştirildi, main'e alındı.** 15
ekranın hepsi (Skor dahil), navigasyon, bileşen kütüphanesi ve renk/tipografi/boşluk token katmanı
uygulandı; bir temizlik (Faz 6) ve bir kontrast düzeltme turu yapıldı; ardından GitHub'daki
`origin/main`'in bu tasarım işinden habersiz ilerlemiş 26 commit'i (başka bir katkıcı, "Hasan"
tarafından) elle birleştirildi. **Skor hesaplama, seri kaydetme, D1 senkron mantığının HİÇBİRİNE
dokunulmadı** — bu proje boyunca hiçbir fazda, merge dahil.

### Faz özeti

| Aşama | Kapsam | Commit(ler) |
|---|---|---|
| 0-2 | Envanter, token katmanı (renk/boşluk/tipografi), PALETLER düzeltmeleri, bileşen kütüphanesi (`.btn`, `.card`, `.settings-row`, `.switch`, `.seg`, `.tabs`, `.empty`) | `562199b` |
| 3 | Navigasyon: 15 sekme → 6 ana + "Daha" paneli, tek-aile SVG ikon seti, mobil alt bar | `69c097f` |
| 4 | Skor ekranı (en kritik, 3 alt adım: yerleşim/sticky tuş takımı/seri şeridi) | `109188d` |
| 5 | Kalan 14 ekran, 6 grup halinde (Sayaç/Canlı Takip/Liderlik → Gelişim/Ders İçerikleri/Teknik Çalışma → Klasman/Başarılar → Yarışmalar/Düello/Video → Mağaza/Reaksiyon/`#duello-modal` → Ana Ekran/SON) | `3c75e63`, `4ccb205`, `276fa1f`, `1c1fcf7`, `f51cb68`, `5cacd2c`, `5e9c53d` |
| 6 | Temizlik/doğrulama: hex denetimi (`--score-ring-*` tokenizasyonu + Chart.js canvas bug'ı düzeltildi), ölü CSS/JS silme (`.sekme-grubu`, `.cins-btn`/`.yay-btn`, `.ok-rozet`, `#alt-menu`, `.tree-cat-btn`), `!important` azaltma (64→44), 21 ekran görüntüsüyle regresyon doğrulaması | `6a807d2`, `de0a085`, `cecee0c` |
| 6 sonrası | Kontrast düzeltmesi: `.btn-primary`/`.btn-danger` koyu metin (8 mağaza paletinin hepsinde AA geçiyor), `--text-tertiary` alfa düzeltmesi | `2c05e38` |
| Merge | `origin/main`'in 26 commit'i alındı (`merge-origin` dalında hazırlandı, sonra main'e fast-forward) + post-merge 2 düzeltme | `9841c1a` (main'in şu anki HEAD'i) |

Detaylar için §2-§2j; token mimarisi §3; isim eşleme §4; bileşen kütüphanesi §5; kurallar ve
tuzaklar §7; merge'in tam detayı (çakışma çözümleri, macera arkeolojisi, test bulguları) §10.

### origin/main merge'i — özet

**Gelen özellikler** (origin'in 26 commit'inden, bu tasarım işinden tamamen bağımsız geliştirilmiş):
Video AI Duruş Analizi (MediaPipe `pose.js` ile canlı/kayıtlı video üzerinde yay kolu/çekiş
dirseği/omuz açısı analizi), İkili Video Karşılaştırma (iki atışı yan yana/bindirmeli karşılaştırma),
Ritim & Tıkır Koçluk Modülü (Karışık Sınıf'a özel sesli atış-ritmi metronomu). Üçü de yeni dosyalar
olarak geldi: `public/dagsk-ai-pose.js`, `public/dagsk-ai-pose.stable.js`, `public/dagsk-video-compare.js`,
`public/dagsk-cadence-coach.js`.

**Çözülen çakışmalar** (3 dosya, 6 blok — tam detay §10): `styles.css` (3× `font-family`, bizim
`var(--font-sans)` tokenimiz kaldı), `app.html` (1× Karışık Sınıf nav — Oyunlar/Reaksiyon/Ritim & Tıkır
üçü de yan yana tutuldu), `app.js` (2× `kmSekme()` dizisi+dispatch — `kmYoklamaCiz` bizim + `kmRitimCiz`
origin'in, ikisi de tutuldu).

**Macera Modu kasıtlı olarak GERİ GETİRİLMEDİ**: Karışık Sınıf'ın eski "Macera Modu" özelliği bu
tasarım işinden önce, `55d8093` commit'inde (BURAK, 6 Eylül 2026, "WIP: Ders Programı, yarım" başlıklı
ama aslında Karışık Sınıf'a Yoklama/Oyunlar/Reaksiyon ekleyen büyük bir commit) tamamen kaldırılmıştı.
`origin/main` bu özelliği hâlâ taşıyordu (`'macera'` sekme girişi + `kmMaceraCiz()` ve ~15 yardımcı
fonksiyon). Kullanıcı arkeolojiyi (bkz. §10) inceledikten sonra "bilerek kaldırdım, geri gelmesin"
dedi — merge çözümünde origin'in `'macera'` girişi ALINMADI, kod main'de yok. İleride biri origin'in
tarihini tekrar inceleyip bunu sorgularsa: kaldırma kasıtlıydı, tekrar tartışmaya AÇIK değil.

**Merge sonrası 2 düzeltme** (main'e almadan önce, `merge-origin` dalında yapıldı — tam detay §10):
(1) `vaInit()`'in `#va-dropzone`/`#va-api-key` null-reference crash'i — hem kök neden (app.html'e
`id="va-dropzone"` eklendi, `#va-api-key` null-guard'landı) hem savunma (`sekmeAc()`'teki `video`
dalı da fonksiyonun geri kalanı gibi `try/catch`'e alındı) düzeltildi; bu crash bizim Faz 3
`dahaPanelKapat()` temizliğini engelliyordu. (2) `--accent-sand` tanımlandı (`#a89a8c`,
`--text-muted`'ın sıcak kardeşi, yeni bir marka rengi değil) — origin'in kendi kodu (Ritim özelliği)
bu tokeni kullanıyordu ama origin KENDİSİ sonradan `:root`'tan silmişti.

### Kalan iş kalemleri — öncelik sırasıyla

Bunların HİÇBİRİ tasarım geçişinin/merge'in bir parçası değil — hepsi bilerek kapsam dışı bırakıldı,
hiçbiri kullanıcı onayı olmadan başlanmayacak. Sıralama risk/etkiye göre:

1. ~~**`fanOutMasterPayload()` sessiz başarı hatası**~~ — **DÜZELTİLDİ 2026-09-10 (bkz. §9c)**: artık
   kısmi/tam başarısızlıkta gerçekten reddediyor, kalıcı hatada üstel geri çekilme var, 401'e özel
   uyarı var — sorun artık SESSİZCE değil, GÖRÜNÜR şekilde başarısız oluyor (aciliyeti düşürür,
   ORTADAN KALDIRMAZ). **İstek hacmi işi başladı** (bkz. §9d analiz, §9e Adım 1/3): aidat
   `fanOutMasterPayload`'tan düşürüldü (kendi kalıcı kuyruğu zaten vardı, saf tekrardı) — 771→**696**
   istek/döngü. **Eşik: 1000'i geçerse bu madde öncelik 1 olur** (§9'daki trend tablosuna bkz.).
   Sıradaki adımlar (2/3 yoklama arşivleme, 3/3 opsiyonel yoklama kuyruğu) kullanıcı onayı bekliyor.
2. **Mobil Skor paneli `!important` override'ları test edilmedi** (~10-15 kural, bkz. §2i/§6) — en
   sık kullanılan ekranın (Skor) mobil görünümünde, henüz doğrulanmamış bir kaynak-sırası sorununu
   gizliyor olabilirler. Test edilmeden silinmemeli veya değiştirilmemeli.
3. **`#10b981` tokenizasyonu** (34 kullanım, bkz. §9b) — kullanıcının açık isteğiyle Faz 6'da hiç
   dokunulmadı. Bir sonraki turda önce her kullanım yeri TOKEN-ADAYI / ANLAMLI-KORUNAN olarak
   sınıflandırılmalı, sonra onay alınmalı.
4. **`.sekme-btn` özellik-farkı analizi** (bkz. §2i/§6) — eski `.sekme-grubu` ailesi silindi ama
   `.sekme-btn`'in kendisi, `#daha-panel .sekme-btn`'in tam olarak hangi özelliklerini gölgelediği
   karşılaştırılmadan dokunulmadı bırakıldı. Düşük risk, kozmetik.
5. **`./dagsk-teknik-calisma.js` kök kopya senkronsuzluğu** (bkz. §2d/§6) — `public/` içindeki
   canlı kopyadan Faz 5'ten önce ayrışmış, hiçbir yerden yüklenmeyen ölü bir dosya. Sıfır kullanıcı
   etkisi — saf hijyen.
6. **`deploy_output.txt` ve kökteki `dagsk-ai-pose.js`** (merge'le geldi, bkz. §10) — `deploy_output.txt`
   muhtemelen kazayla commit'lenmiş bir deploy komut çıktısı; kökteki `dagsk-ai-pose.js`,
   `public/dagsk-ai-pose.js`'ten (canlı, route edilen kopya) AYRI bir dosya, hiçbir yerden
   yüklenmediği doğrulanmadı. İkisi de main'e girdi, kullanıcının kararı bekleniyor (silinsin mi,
   kalsın mı). Düşük öncelik, sıfır işlevsel etki.
7. **`camera_utils.js` kırılgan yedek-dal bağımlılığı** (bkz. §10) — şu an AI Video özelliğini
   ETKİLEMİYOR (asıl motor `pose.js` üzerinden çalışıyor, o başarıyla yükleniyor), ama
   `ensureMediaPipeLoaded()`'ın yedek dalı hâlâ 404 veren bir CDN adresine bağlı. En düşük öncelik
   — bir gün `pose.js`'in kendisi yüklenemezse (ağ sorunu, ad-blocker) o zaman gerçek bir etkisi olur.

### Yayına alma adımları

Kod GitHub'a push edildi, artık sadece Cloudflare'e deploy adımı kaldı:

1. **Ön kontroller**: `node --check public/app.js`, `npx tsc --noEmit`, `npm test` (vitest) — hepsi
   bu merge sonrası zaten çalıştırıldı ve temiz çıktı.
2. **D1 migration**: bu tasarım/merge turunda YENİ bir migration YOK — `db:migrate:remote` adımı
   atlanabilir (genel süreçte kod deploy'undan ÖNCE çalıştırılması gereken bir adım, sadece şu an
   için gerekmiyor).
3. **Deploy**: `npm run deploy` (= `wrangler deploy`) — `src/index.ts`'i Worker olarak, `public/`
   klasörünü statik varlık olarak yükler. Cloudflare içerik-hash'li önbellek kullanıyor, elle
   cache-busting gerekmiyor.
4. **Sürüm kilidi notu** (app.js, `SURUM_KODU`/`MIN_SURUM_GEREKSINIMI`): sadece SENKRON/VERİ
   mantığı değişince bump edilir. Bu merge senkron mantığına dokunmadı (sadece UI/CSS/yeni bağımsız
   video-analiz özellikleri), bump GEREKMİYOR.
5. **Deploy sonrası duman testi**: prod URL'de sert yenileme, `/app.html` aç, PIN ile giriş yap,
   Skor ekranını aç (hedef renkleri + buton metinleri doğru mu), Karışık Sınıf'ta Ritim & Tıkır
   sekmesini aç (yeni özellik canlıda ilk kez), Video sekmesini aç (crash olmamalı), konsolda
   yeni bir hata olmadığını doğrula.

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
- `5cacd2c` — Tasarım sistemi Faz 5 grup 5: Mağaza, `#duello-modal`, Reaksiyon
- `6a807d2` — DEVIR.md: fanOutMasterPayload veri-katmanı riski, Faz 6 sonrası iş kalemi (sadece belge, kod değişikliği yok)
- `5e9c53d` — Tasarım sistemi Faz 5 grup 6 / SON: Ana Ekran — **FAZ 5 TAMAMLANDI**
- `de0a085` — Faz 6 temizlik: `#ff6200` kaçağı + hedef SVG'leri `var(--score-ring-*)`'e bağlandı (madde 6a/6b)
- `cecee0c` — Faz 6 temizlik (madde 1-5): ölü CSS/JS silme, gereksiz `!important` kaldırma — **bu commit ile Faz 6 TAMAMLANDI**
- Faz 6 SONRASI — kontrast düzeltmesi (`.btn-primary`/`.btn-danger`/`--text-tertiary`) — bu commit'te, aşağıda anlatılıyor (bkz. §2j).

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

**Faz 6 temizlik listesine eklenenler** (bkz. §6) — **HEPSİ Faz 6'da uygulandı, bkz. §2i "Madde
1-5 — kullanıcı onayıyla uygulandı"**:
- `#alt-menu` id'li ölü kod satırı (app.js ~9437: `document.getElementById('alt-menu')` — böyle bir
  element hiç yok, no-op). **SİLİNDİ** (Faz 6).
- Eski `.sekme-grubu`/`.sekme-btn.aktif` kuralları (styles.css ~248, ~1027-1038, ~1090 — gradyan/
  glow'lu eski görünüm) artık hiçbir elemente uygulanmıyordu (yeni `#tabs-ana .sekme-btn`/`#daha-panel
  .sekme-btn` id-seçicileri daha spesifik, her zaman kazanıyor). **3 blok da SİLİNDİ** (Faz 6),
  `.sekme-btn`'in kendisi dokunulmadan kaldı (hâlâ canlı, bkz. §6/§2i "sonraki iş").
- 560px medya sorgusundaki eski `.sekme-grubu{gap:3px}` (styles.css ~481-482) **SİLİNDİ** (Faz 6);
  `.sekme-btn{font-size:11px}` kardeş kuralı dokunulmadan kaldı (hâlâ canlı).

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
"Failed to fetch" konsol hatası gözlendi, bu turun HİÇBİR değişikliğiyle ilgisiz olduğu doğrulandı.
**Düzeltme (bir sonraki turda)**: buradaki ilk kök-neden tahmini ("25sn'lik düello yoklaması") YANLIŞTI —
kullanıcının isteğiyle yapılan tam teşhis gerçek nedeni buldu: `bulutaGonderKontrol()`'ün 10 saniyede
bir tetiklediği `fanOutMasterPayload()`, bkz. §9. Doğru teşhis ve ölçüm orada.

## 2h. Faz 5, Grup 6 / SON — Ana Ekran (tamamlandı) — **FAZ 5 BİTTİ**

En içerik-yoğun ekran: profil kartı + 3'lü istatistik + 4 gömülü widget (canlı takip özeti, sıradaki
ders, haftalık program, sezon sayacı) + 6 durum kartı (haftalık/bugünkü ortalama, günlük görev, atış
rutini, koç notu, duyuru/Google yorum slaytı) + 6 aksiyon butonu. Bir "tek birincil eylem" görev
ekranı değil, bir dashboard — o kural buraya zorlanmadı.

**Ne değişti**: profil kartı, 3'lü istatistik grid'i, tüm durum kartları (`.glass-panel` →`.card`,
kendi koşullu vurgu renkleri — görev tamam yeşili, rutin mavisi, koç notu turuncusu — AYNEN
korunarak, sadece taban `.card` üstüne inline override olarak bindirildi), canlı takip özeti
(`canliTakipOzetHTML`, "Tümünü Gör →" `.btn-ghost btn-sm`), duyuru + Google yorum slaytları (`.card`,
yıldız/puan renkleri dokunulmadı) — hepsi `.card`'a taşındı. **6 aksiyon butonu, kullanıcının isteğiyle
EŞİT AĞIRLIKTA değil**: "🎯 Skor Gir" tek `.btn-primary`, diğer beşi (İhtiyaç Bildir, Düello, Rozetlerim,
Mağaza, Sıralama) düz `.btn` — dashboard'da "tek birincil eylem" kuralı geçmiyor ama görsel hiyerarşi
gerekiyordu, sporcunun bu ekranı en çok skor girmek için açtığı gerekçesiyle. Düello'nun eski
`.duello-cta-btn` (pulse animasyonlu gradyan) ve İhtiyaç Bildir'in mor-pembe gradyanı, Faz 5'in geri
kalanında her ekranın CTA'sını düzleştirdiği gibi düzleştirildi.

**Sıradaki ders + haftalık program widget'ları (`sonrakiDersRenderla`, `haftalikProgramWidgetGuncelle`)
— EN KIRILGAN NOKTA, kullanıcının özellikle istediği ekstra testle doğrulandı**: SADECE dış kabuk
(`background/border/radius` → `.card`) değişti, `_sporcuKendiDersleriCache`/fetch/`birSonrakiDersHesapla`/
"benimMi" (SENİN DERSİN rozeti) mantığının TEK SATIRINA dokunulmadı. Ayrıca test edildi:
- **Boş durum** (sporcunun ders programında hiç slotu yok): iki widget de `el.innerHTML=''` ile
  TAMAMEN kayboluyor — boş kart, kesik kenarlık, artefakt YOK. 4 kombinasyonda (360/1280 × koyu/açık)
  doğrulandı.
- **Dolu durum** (sahte `_sporcuKendiDersleriCache` ile 3 slot, biri başka sporcuya ait): "Sıradaki
  Dersin" doğru günü/saati/"Bugün" etiketini gösterdi, "Haftalık Program" 3 satırı da listeledi ve
  SADECE gerçekten bu sporcunun katıldığı 2 slotta "★ SENİN DERSİN" rozetini gösterdi (üçüncüsü,
  başka sporcuya ait slot, rozetsiz kaldı) — filtreleme mantığının restyling'den etkilenmediğinin
  kanıtı. 360 ve 1280'de ayrı ayrı doğrulandı.

**Sezon sayacı** (`sezonWidgetHTML`, `#sezon-sayac-ana`) — **dokunulmadı**. Klasman'ın `#sezon-sayac-
widget`'ıyla AYNI fonksiyon (bkz. §2e); kalan-gün rengi (yeşil>30, amber 8-30, kırmızı≤7) anlamlı bir
aciliyet göstergesi, zaten özenle tasarlanmış bespoke bir widget — Faz 5 boyunca hiçbir yerde
dokunulmadı.

**Doğrulama**: 360/1280px, koyu/açık (4 temel kombinasyon) + boş/dolu ders-widget durumları (6 ek
ekran görüntüsü) + buton class'larının programatik kontrolü (`.btn-primary` sadece Skor Gir'de),
hepsinde yatay taşma yok, konsol hatası yok. Ekranda görünen "`<script>alert(1)</script>`" başlıklı
duyuru, eski bir güvenlik-testi turundan kalan yerel test verisi — `esc()` onu doğru şekilde düz
metne çeviriyor, ÇALIŞTIRMIYOR; bu turun bir bulgusu/regresyonu değil, sadece görsel gürültü.

**FAZ 5 TAMAMLANDI** — 15 ekranın hepsi (Skor dahil, Faz 4'te) bitti. Kalan iş Faz 6 (temizlik/
doğrulama, bkz. §6) ve §9'daki veri-katmanı iş kalemi.

## 2i. Faz 6 — Temizlik (tamamlandı)

Faz 6'nın 9 maddelik listesi (bkz. §6) önce TAMAMEN araştırılıp raporlandı, hiçbir şey onaysız
silinmedi/değiştirilmedi. Madde 6 (çıplak hex) için ayrı bir arka-plan ajanı tüm app.js/app.html/
styles.css'i yeniden taradı (2026-09'daki bayat rapor değil, güncel kod) — 437 farklı hex, ~2.150
kullanım; büyük kısmı zaten izole alt sistemlerde (KM Oyunlar, Reaksiyon, Düello arenası, PDF'ler,
madalya/nadirlik) — bunlara dokunulmadı, kullanıcı da onayladı.

**Uygulanan (kullanıcı onayıyla, madde 6a/6b):**

1. **`#ff6200` → `var(--accent-orange)`** — ama TÜM 25 değil, sadece **3 gerçekten canlı UI
   kullanımı**: `sezonWidgetHTML()` (sezon ilerleme çubuğu gradyanı), `hedefGorseliGuncelle()`'nin
   ok-işareti noktası, `cizKarneModalOklar()`'ın heat-map noktası. **Kalan ~22 kullanım BİLEREK
   dokunulmadan bırakıldı** — hepsi ya print/PDF üretim fonksiyonları (`egitmenKarnePDF`,
   `personelPDF`, `aidatGelirRaporu`, `aidatDetayliAnalizPDF`, `raporOnizlemeAc`, `dersIcerikYazdir`)
   ya da korumalı kategoriler (foto-hedef çizim aracı `fotoCiz()`, konfeti). Rapor üreten
   fonksiyonların bir kısmı `window.open()+document.write()` ile TAMAMEN AYRI bir belge açıyor — o
   belgenin ana sayfanın `:root` CSS değişkenlerine HİÇ erişimi yok, `var(--accent-orange)` orada
   sessizce geçersiz kalırdı. Diğerleri (`html2pdf().from(tempDiv)`) teknik olarak erişebilirdi
   ama bu kod tabanında `html2pdf`/tempDiv'in daha önce başka yerlerde güvenilmez çıktığı
   belgelenmiş (bkz. hafıza) — raporları kasıtlı olarak `.baski` felsefesiyle (temadan bağımsız,
   kendi kendine yeten) tutarlı bırakmak, teorik bir kazanç için o riski almaktan daha güvenli
   bulundu.

2. **Hedef SVG'leri + `HALKA_RENK` + `RENK_GRUP` → `var(--score-ring-*)`** — en değerli düzeltme.
   Kapsam: canlı Skor ekranının hedefi (`app.html` `#hedef-svg-10ring/6ring/3spot`, ~30 `fill`/
   `stroke` değeri) + Karne/heat-map modalının aynı 3 hedef diyagramı (~30 değer daha) + iki
   kanonik renk-eşleme sabiti `HALKA_RENK`/`RENK_GRUP` (app.js). **"Beyaz" (2/1) rengi bu sırada
   `#e5e7eb`'den gerçek `--score-ring-white` (`#f8fafc`) değerine düzeltildi** — çok küçük ama
   kasıtlı bir yan-iyileştirme, artık hedefin kendi beyazıyla birebir aynı.
   - **SVG'lerde `fill="#hex"` yerine `style="fill:var(--score-ring-x)"` kullanıldı** — çıplak SVG
     sunum niteliği (`fill="var(...)"`) yerine gerçek bir CSS `style` bildirimi tercih edildi, çünkü
     tarayıcı desteği daha güvenilir.
   - **Gerçek bug bulundu ve düzeltildi (uygulama SIRASINDA, onay beklemeden — aksi halde grafikler
     kırılırdı)**: `HALKA_RENK`, Skor/Karne ekranlarındaki HTML dizeleri dışında Gelişim/Karne'nin
     "Ok Analizi" Chart.js grafiklerinde (`okAnaliziCiz()`, bar+pasta) `backgroundColor` olarak da
     kullanılıyor. **Canvas'ın `fillStyle`'ı CSS `var()`'ı çözemez** — bar/pasta dilimleri sessizce
     yanlış (muhtemelen siyah) renk alırdı. Çözüm: `_canvasRenkCoz()` adlı küçük bir yardımcı
     eklendi (`var(--x)` dizesini `getComputedStyle` ile gerçek değere çeviriyor), SADECE bu 2
     Chart.js çağrısında kullanıldı — SVG/HTML tarafına dokunulmadı, onlar zaten `var()`'ı
     doğrudan doğru çözüyor.
   - **`--score-ring-*`'ın PALETLER'den yalıtık olduğu YAPISAL OLARAK doğrulandı, varsayıma
     dayanmadı**: `temaPaletUygula()` SADECE `--accent-orange`/`--gold`'u `documentElement.style.
     setProperty` ile eziyor, `--ring-*`/`--score-ring-*`'a hiç dokunmuyor — kod okunarak
     doğrulandı. Sonra ampirik olarak da kanıtlandı: `temaPaletUygula('orman')` VE `('okyanus')`
     gerçekten çağrılıp `--accent-orange`'ın değiştiği (kanıt: `#F26B1D`→`#10b981`→`#0ea5e9`)
     ama hedefin 5 halka rengi ile skor klavyesinin 12 tuşunun TAMAMEN AYNI kaldığı hem
     `getComputedStyle` ölçümüyle hem ekran görüntüsüyle (turuncu her yerde yeşile döndü, hedef
     ve klavye hiç değişmedi) gösterildi. `getRenkForPuan()` (skor klavyesi/ok çipleri kaynağı)
     zaten `var(--ring-*)` kullanıyordu, dokunulmadı — hedefle klavye artık aynı kaynaktan besleniyor.

**Bilerek dokunulmayanlar (kullanıcı kararı):**
- **`#10b981`** (34 kullanım, "başarı yeşili" ama hiçbir mevcut tokenla birebir eşleşmiyor) — HİÇBİR
  tokena bağlanmadı, `HALKA_RENK`/`RENK_GRUP`'taki "Karavana/M" rengi dahil olduğu gibi bırakıldı.
  Ayrı bir iş kalemi olarak burada not ediliyor (bkz. §9'a benzer, ayrı ele alınacak — bir sonraki
  oturumda insan kararı gerekiyor: `--status-success`'e eşitle (görsel kayma kabul edilir) mi, yoksa
  gerçek `--status-success-strong` değeri mi olsun).
- **5 belirsiz nokta** (3-spot/6-ring hedef arkaplanı `#e2e8f0`/`#2a2a2c`, kutlama kutusu `#2a2a33`/
  `#16161b`, düello/rfx sonuç ekranı zeminleri `#1f2937`/`#111827`) — hiçbiri değiştirilmedi.
- İzole alt sistemler (KM Oyunlar, Reaksiyon, Düello arenası, takım/mağaza kozmetikleri, madalya/
  nadirlik, PDF'ler, WhatsApp yeşili) — dokunulmadı, tespit doğru bulundu.
- Madde 7 (emoji): dokunulmadı — navigasyon ikonları zaten Faz 3'te SVG ailesine taşınmıştı, içerik
  emojileri (rozet/oyun/kutlama) kasıtlı bırakıldı.
- Madde 8 (kontrast): sadece rapor edildi, düzeltme YAPILMADI — bkz. aşağıdaki kontrast bulguları.

**Doğrulama**: `node --check` (sözdizimi), Playwright ile gerçek hedef/klavye renk ölçümü + palet
değişimi öncesi/sonrası karşılaştırma (2 farklı palet, orman ve okyanus) + `_canvasRenkCoz()` birim
testi + ekran görüntüsü (varsayılan ve orman paleti, yan yana karşılaştırılabilir).

**Henüz karar bekleyen (madde 1-5)**: `!important` sayımı, ölü CSS kapsamı, `#alt-menu`/
`.tree-cat-btn` — kullanıcıya kısa bir özet sunuldu, hangilerinin uygulanacağına dair onay bekleniyor.
Detaylar bir önceki oturum turunda (bu commit'ten önce) verildi, tekrar edilmedi.

### Madde 1-5 — kullanıcı onayıyla uygulandı

**Silinenler** (hepsi grep ile "gerçekten sıfır referans" doğrulanarak):
- `.sekme-grubu` — 3 blok (styles.css ~313, ~586 medya sorgusu, ~1131) tamamen silindi. `.sekme-btn`/
  `.sekme-btn.aktif`/`.sekme-btn:hover` HİÇ DOKUNULMADI (hâlâ canlı, özellik-farkı analizi Faz 6'nın
  ayrı bir sonraki adımı — aşağıya bkz).
- `.cins-btn`/`.yay-btn` + `.secili-kiz`/`.secili-erkek`/`.secili-klasik`/`.secili-makarali` — 6 kural
  tamamen silindi (0 kullanım doğrulandı).
- `.ok-rozet`/`.ok-rozet-alani` (styles.css) + `app.js:6330`'daki ölü `.ok-rozet` seçici string'i
  silindi. `.hedef-kontrol-btn`/`.skor-gir-btn` (aynı bölgede, CANLI) dokunulmadı.
- `#alt-menu` ölü satırı (app.js, `tablariPlatformaGoreAyarla()` içinde) silindi.
- `.tree-cat-btn`/`.aktif-klasik`/`.aktif-makarali` — 3 kural tamamen silindi.
- **`.switch`/`.slider`'ın eski tanımı silindi** (styles.css'te Faz 2'ninkinden SONRA duran, kaynak
  sırasıyla kazanan ikinci tanım) — Faz 2'nin kanonik tanımı (`--surface-2`/`--surface-border`/
  `--text-secondary` kullanan) artık gerçekten tek başına geçerli.

**Kaldırılan `!important`'lar** (rule SİLİNMEDİ, sadece anahtar kelime kaldırıldı — kaynak sırası
zaten doğru olduğu için görsel etki YOK): `.giris-secim-btn` (ana kural + `body.light-theme`
override'ı + `:hover`'ı, HER İKİ tekrarında da — toplam 2 blok), `.pin-btn`, `.rozet-kart`
padding-top, `.rozet-emoji` font-size. Sayaç: 64 → 44 (`grep -c "!important" public/styles.css`).
Kalan 44'ün ~20-25'i meşru (modal z-index, universal reset, fullscreen zorlama), geri kalanı henüz
tek tek doğrulanmadı.

**Bilerek dokunulmayanlar (kullanıcı kararı, DEVIR.md'ye not düşüldü):**
- Mobil Skor paneli override'ları (`.skor-left-panel`/`.svg-hedef`/`#hizli-giris-pad`, styles.css
  ~580-585, `@media(max-width:560px)`) — muhtemelen aynı "kaynak sırası zaten yeterli" kalıbı ama
  **TEST EDİLMEDİ** — silinmeden/değiştirilmeden önce ampirik doğrulama gerekiyor. **SONRAKİ İŞ.**
- `.sekme-btn`'in kendi tanımı (styles.css ~314, ~1137) — hâlâ canlı bir class, `#tabs-ana .sekme-btn`/
  `#daha-panel .sekme-btn` tarafından çoğunlukla gölgelenmiş ama örtüşmeyen özellikler (ör.
  `box-shadow`, `.sekme-btn.aktif`'te) sızıyor olabilir. Özellik-özellik karşılaştırma yapılmadan
  silinmeyecek. **SONRAKİ İŞ.**

**Tam regresyon doğrulaması** (kullanıcının istediği gibi, gerçek Playwright `.click()` ile):
giriş ekranı → EĞİTMEN PLATFORMU → PIN (1234) → Büyükler ligi → **15 sekmenin hepsi** (6 ana +
Daha panelindeki 9) tek tek açıldı → Skor ekranında 6 oklu bir seri gerçek tıklamayla girildi ve
otomatik kaydedildi (`turnuvaDB[...].seriler.length > 0` doğrulandı) → **Ciddi Yarışma Modu
anahtarı gerçek `.click()` ile** (checkbox'ın kendisi değil, görünür `.slider`'a — checkbox
tasarım gereği `opacity:0`) iki yönde de test edildi, slider boyutu ölçüldü (36×20, Faz 2 spesine
birebir uyuyor), etiket metni doğru güncellendi ("Ciddi yarışma modu" ↔ "Eğlence modu"). **Yatay
taşma yok. Bu turun değişikliklerinden kaynaklanan SIFIR yeni konsol hatası** — testte görülen
tüm hatalar (`ERR_INSUFFICIENT_RESOURCES` / "Failed to fetch") §9'da zaten teşhis edilmiş,
etkileşimsiz bile tekrarlayan arka-plan senkron gürültüsü; hiçbiri bu commit'in değişiklikleriyle
ilgili değil (aynı iki hata mesajı, başka hiçbir hata yok — kontrol edildi).

**Madde 8 — kontrast raporu** (sadece rapor, düzeltme YAPILMADI, kullanıcı talimatı): sadece
`--dim` değil TÜM metin/zemin çiftleri tarandı.
| Çift | Oran | Durum | Kullanım |
|---|---|---|---|
| Beyaz metin / `--accent-orange` (`.btn-primary`) | 3.05:1 | **AA FAIL** (normal metin eşiği 4.5:1; AA-large/buton eşiği 3:1'i geçiyor) | 13 yer |
| Beyaz metin / `--status-danger` (`.btn-danger`) | 3.76:1 | **AA FAIL** | 4 yer |
| `--text-tertiary` / kart zemini | 4.21:1 | **AA FAIL** (kıl payı) | 1 yer, düşük etki |
| Diğer tüm metin/zemin çiftleri | 6.3:1 – 18:1 | GEÇTİ | — |

En kritik ikisi `.btn-primary`/`.btn-danger` — Faz 5'te "Skor Gir tek `.btn-primary` olsun" kararıyla
en sık görülecek buton tam bu grupta. **Faz 6 SONRASI ayrı bir turda düzeltildi, bkz. §2j.**

**Madde 9 — ekran görüntüleri** (360/768/1280px, gerçek Playwright test, sonra gerçek PIN hash
geri yüklendi): giriş ekranı, platform seçimi (`.giris-secim-btn`), PIN girişi (`.pin-btn`), Skor
ekranı (hedef SVG `var(--score-ring-*)` + `HIZLI GİRİŞ` tuş takımı + Ciddi Yarışma Modu paneli/
`.switch`), Yarışmalar (eski `.cins-btn`/`.tree-cat-btn`'in yerini alan `.seg`/`.seg-btn`),
Başarılar (`.rozet-kart`/`.rozet-emoji`) — 3 genişlik × 7 ekran = 21 görüntü. Sonuç: hedef
halkaları ve HIZLI GİRİŞ tuşları üç genişlikte de birebir aynı renkte (sarı/kırmızı/mavi/beyaz/
siyah, "M" ayrı gri) — token bağlama sızıntı yaratmamış. Switch/slider Faz 2 pill görünümünde
(36×20), eski tanımın kalıntısı yok. Rozet kartlarında üst boşluk düzgün (`!important` kaldırma
`.rozet-kart`'ı bozmadı). `.seg`/`.seg-btn` (Tümü/Klasik/Makaralı) sorunsuz. 768px ilk kez bu
turda test edilen bir genişlikti — regresyon yok. Hiçbir ekranda yatay taşma veya görsel bozulma
gözlenmedi.

## 2j. Faz 6 SONRASI — kontrast düzeltmesi (`.btn-primary`/`.btn-danger`/`--text-tertiary`)

Faz 6 onaylandıktan sonra kullanıcı madde 8'in (kontrast) düzeltmesini istedi — en kritik ikisi
`.btn-primary` (3.05:1) ve `.btn-danger` (3.76:1), ikisi de AA'yı (4.5:1) geçemiyordu. Kullanıcı 3
seçenek istedi: (1) turuncu/kırmızı üstündeki metni koyulaştır (`--accent-ink`/`#1A0B02` — **not:
kullanıcı bu tokenin zaten var olduğunu düşünüyordu, `grep` ile doğrulandı, YOKTU**, kullanıcıya
söylendi, `#1A0B02` DEĞERİ verdiği gibi yeni bir token olarak eklendi), (2) turuncuyu/kırmızıyı
koyulaştır beyaz metin kalsın, (3) ikisinin ortası.

**Üç seçenek de gerçek Playwright testiyle (Skor ekranı "Seriyi kaydet" + Yarışmalar ekranı
"Yarışmaları Sıfırla") görsel olarak karşılaştırıldı, ekran görüntüleriyle.** Sonuç ve seçilen:
**Seçenek 1 (koyu metin, marka rengi DEĞİŞMEDEN)** — gerekçe:

- `.btn-primary`'nin zemini sabit değil — `background: var(--accent)` → `var(--accent-orange)`,
  ve bu token **Mağaza'nın 7 satın alınabilir paletinden** (`okyanus`/`orman`/`gece`/`alev`/
  `altin`/`buz`/`pembe`, bkz. app.js `PALETLER` ~19002) her biri tarafından `temaPaletUygula()`
  ile ÇALIŞMA ZAMANINDA `document.documentElement.style.setProperty('--accent-orange', ...)`
  ile değiştiriliyor. Bu 8 rengin (varsayılan dahil) HEPSİNE karşı hem beyaz metin hem koyu ink
  metin test edildi (gerçek Playwright'ta `temaPaletUygula()` çağrılıp `.15s` geçiş bitişi
  beklenip ölçüldü — ilk denemede geçiş animasyonu bitmeden ölçüp yanlış pozitif almıştım, düzeltildi):
  | Palet | Hex | Beyaz metin | Koyu ink metin |
  |---|---|---|---|
  | varsayılan | `#F26B1D` | 3.05:1 FAIL | 6.31:1 PASS |
  | okyanus | `#0ea5e9` | 2.77:1 FAIL | 6.93:1 PASS |
  | orman | `#10b981` | 2.54:1 FAIL | 7.58:1 PASS |
  | gece | `#a855f7` | 3.96:1 FAIL | 4.86:1 PASS |
  | alev | `#ef4444` | 3.76:1 FAIL | 5.11:1 PASS |
  | altın | `#d4a017` | 2.38:1 FAIL | 8.09:1 PASS |
  | buz | `#38bdf8` | 2.14:1 FAIL | 8.97:1 PASS |
  | pembe | `#ff2d95` | 3.46:1 FAIL | 5.55:1 PASS |

  **Beyaz metin 8 paletin HİÇBİRİNDE AA'yı geçmiyor; koyu ink metin HEPSİNDE geçiyor.** Bu tek
  başına Seçenek 1'i zorunlu kılıyor — Seçenek 2 (turuncuyu koyulaştır) seçilseydi marka rengini
  DEĞİL, 8 farklı paleti ayrı ayrı koyulaştırmak gerekirdi (kapsamı kullanıcının sorduğundan çok
  daha büyük bir iş, üstelik her mağaza temasının görünümünü değiştirir).
- `--status-danger` (`.btn-danger`, `#ef4444`, palet DEĞİŞTİRMİYOR) için de koyu ink metin
  5.11:1 ile rahat geçiyor — aynı token, tek kural, iki yerde kullanılabiliyor.
- Görsel karşılaştırma: Seçenek 2 (turuncuyu koyulaştırma) sadece `.btn-primary`'nin KENDİ
  `background`'ını değiştirdiği için (token'ın kendisini değil), ekrandaki DİĞER turuncu
  öğelerle (ör. "6 Halkalı" segment düğmesi, "TAKIM YARIŞMASI" başlığı) yan yana durunca gözle
  görülür şekilde donuk/uyumsuz kaldı. Seçenek 3 (hafif koyulaştırma + ink metin) Seçenek 1'den
  görsel olarak neredeyse ayırt edilemezdi — ekstra karmaşıklığı haklı çıkaracak bir fayda
  sağlamadı (ink metin zaten hem turuncuda hem kırmızıda 1.8-4.5 puan pay bırakıyor, zemin
  koyulaştırmaya gerek yok).
- **Önemli, beklenmedik teknik bulgu**: kırmızı gibi orta parlaklıktaki bir zemin üstünde beyaz
  ile koyu ink metin arasında düz bir RGB karışımı (%50 gri gibi) "orta yol" DEĞİL — kontrast
  eğrisi U-şeklinde, tam ortada beyaz VEYA ink'in herhangi birinden daha KÖTÜ (test edilen bir
  noktada 1.03:1'e kadar düştü). Metin rengi için "ortası" diye bir şey yok, sadece iki uç
  (açık/koyu) işe yarıyor. Zemin koyulaştırmanın da ink metinle birlikte KULLANILAMAYACAĞI
  ortaya çıktı — zemini koyulaştırmak ink (zaten koyu) metnin kontrastını ARTIRMAZ, AZALTIR
  (ikisi de karanlığa yaklaşınca fark kapanıyor); koyulaştırma sadece BEYAZ metinle birlikte işe
  yarıyor. Bu yüzden "gerçek bir orta yol" hem zemin hem metni kısmen değiştirmek değil, sadece
  görsel zenginlik için isteğe bağlı hafif zemin koyulaştırması + ink metin (Seçenek 3) oluyor.

**Uygulama** (`public/styles.css`, sadece bu dosya):
- `--text-on-accent-dark` (Faz 1'den beri VARDI ama hiç kullanılmıyordu, değeri `#000`'dı) →
  `#1A0B02` yapıldı ve `.btn-primary`/`.btn-danger`'ın `color`'una bağlandı (`.btn-primary`
  eskiden `var(--text-on-accent, #fff)`, `.btn-danger` eskiden düz `#fff` idi).
- `--accent-orange`, `--status-danger` ve PALETLER'in HİÇBİRİNE dokunulmadı — marka rengi
  sözü tutuldu.
- `--text-tertiary`: koyu temada alfa `0.45`→`0.6` (4.21:1 → 6.46:1), açık temada `0.45`→`0.65`
  (**2.92:1 → 5.52:1** — açık temanın gerçek değeri madde 8 raporunda hiç ölçülmemişti, bu turda
  fark edildi: aynı 0.45 alfa açık temada koyu temadan çok daha kötü sonuç veriyormuş, ikisi de
  düzeltildi).

**Doğrulama**: Gerçek uygulamada (Playwright, PIN ile giriş, geçici hash sonra geri yüklendi)
`getComputedStyle` ile ölçülen gerçek renderlanan kontrast — "Seriyi kaydet" 6.31:1, "Yarışmaları
Sıfırla" 5.11:1, `--text-tertiary` 0.6 alfa doğru uygulanmış. 8 paletin hepsinde ve açık temada
tekrar ölçüldü, hepsi PASS. Sıfır konsol hatası. 360px ekran görüntüsü alındı (Skor ekranı).

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
| `--text-tertiary` | `rgba(245,245,246,.6)` (açıkta `rgba(17,24,39,.65)`) | Hayır, iki temada ayrı literal — Faz 6 SONRASI kontrast turunda alfa yükseltildi (eskiden `.45`/`.45`), bkz. §2j |
| `--text-on-accent` | `#fff` | Hayır (tema-bağımsız) — artık hiçbir yerde kullanılmıyor (bkz. `--text-on-accent-dark`) |
| `--text-on-accent-dark` | `#1A0B02` | Hayır — Faz 6 SONRASI `.btn-primary`/`.btn-danger` metin rengi olarak devreye alındı (eskiden tanımlıydı ama `#000` değeriyle hiç kullanılmıyordu), bkz. §2j |
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
- **`.tabs`** + `.tabs-btn` — üst-seviye navigasyon deseni. **Faz 3'te uygulandı**: `#tabs-ana` (masaüstü üst bar) ve `#daha-tab-btn` bunu kullanıyor. **DÜZELTME (Faz 6 araştırmasında netleşti)**: `.sekme-grubu` (sarmalayıcı div) gerçekten TAMAMEN ölü — hiçbir elemente uygulanmıyor, 0 kullanım. Ama `.sekme-btn` (tek başına) YANLIŞ ANLAŞILMASIN — hâlâ gerçek düğmelerde kullanılan CANLI bir class (`#tabs-ana`'nın kendi butonları `class="sekme-btn tabs-btn"`), sadece kendi başına tanımlı kuralı (`.sekme-btn{...}`, `.sekme-btn.aktif{...}`) çoğunlukla daha özgül `#tabs-ana .sekme-btn`/`#daha-panel .sekme-btn` kuralları tarafından gölgeleniyor — ÖRTÜŞMEYEN özellikler (varsa) hâlâ sızabilir. Silmeden önce özellik özellik karşılaştırma gerekir, blanket silme YAPILMAMALI.
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
- **Faz 6 — Temizlik/doğrulama: TAMAMLANDI, bkz. §2i.** Madde 6 (çıplak hex) tamamen araştırıldı ve
  kısmen uygulandı (`#ff6200`'ün 3 canlı kullanımı + hedef SVG'leri/`HALKA_RENK`/`RENK_GRUP` →
  `var(--score-ring-*)`, gerçek bir canvas/Chart.js bug'ı yakalanıp düzeltildi; `#10b981` bilerek
  dokunulmadı, bkz. §9). Madde 7 (emoji) ve 8 (kontrast) karara bağlandı (7: dokunma, 8: rapor
  edildi düzeltilmedi). **Madde 1-5 (`!important`, ölü CSS, `#alt-menu`, `.tree-cat-btn`) kullanıcı
  onayıyla UYGULANDI** — bkz. §2i "Madde 1-5 — kullanıcı onayıyla uygulandı" bölümü. `renk-envanteri-
  uzun-kuyruk-2026-09.md` artık BAYAT — güncel envanter §2i'de. Ölü CSS/JS listesi (şimdiye kadar
  birikenler, hepsi çözüldü tersi belirtilmedikçe):
  - `#alt-menu` id'li ölü kod satırı (app.js ~9437, `document.getElementById('alt-menu')` — element yok, no-op). **SİLİNDİ** (Faz 6).
  - Eski `.sekme-grubu`/`.sekme-btn.aktif` gradyan/glow kuralları (styles.css ~248, ~1027-1038, ~1090). **3 blok da SİLİNDİ** (Faz 6); `.sekme-btn`'in kendisi dokunulmadan kaldı (canlı, özellik-farkı analizi gerekiyor — bkz. §2i "sonraki iş").
  - 560px medya sorgusundaki eski `.sekme-grubu{gap:3px}` boyut override'ı (styles.css ~481-482). **SİLİNDİ** (Faz 6); kardeş `.sekme-btn{font-size:11px}` kuralı dokunulmadan kaldı (canlı).
  - Faz 1'in "token geçişinden sonra ölü kalan eski CSS kurallarını tespit et" maddesi Faz 6'da sistemli olarak ele alındı (bkz. §2i) — yukarıdakiler + `.cins-btn`/`.yay-btn`/`.secili-*`/`.ok-rozet`/`.tree-cat-btn` ailesi + eski `.switch`/`.slider` tanımı da bu turda silindi.
  - (4b'de zaten SİLİNDİ, listeye eklenmesi GEREKMİYOR ama tarih için not: `#yuzen-kaydet-btn`, `#ok-rozetleri`/`.ok-rozet-alani`. `.ok-rozet` CSS class'ı da Faz 6'da SİLİNDİ.)
  - **styles.css'teki TÜM `!important` kuralları tarandı ve raporlandı** (Faz 6, bkz. §2i) — 64
    tane vardı, ~10'u gereksizdi (kaynak-sırası zaten kazandırıyordu — `.giris-secim-btn`/
    `.pin-btn`/`.rozet-kart`/`.rozet-emoji`), kaldırıldı; ~6'sı ölü class'larla (`.cins-btn` vb.)
    birlikte silindi; kalan ~20-25 meşru (id-seçici modal z-index deseni, tema/durum zorlamaları)
    dokunulmadı. Sonuç: 44 (bkz. §2i sayım). Mobil Skor paneli override'ları (~10-15) test
    edilmedi, **SONRAKİ İŞ**.
  - **Faz 3-5'te eklenen kuralların dosyadaki konumu Faz 6'da kontrol edildi** — bu turda `.sekme-
    icerik` padding-bottom'daki kaynak-sırası bug'ı (daha önce, Faz 5'te bulunup düzeltilmişti)
    dışında yeni bir örnek bulunmadı. `.switch`/`.slider`'ın eski/yeni iki tanımının aynı anda var
    olması (eskisi sonda olduğu için kazanıyordu) bu kontrolün bulduğu YENİ ve en ciddi örnekti —
    düzeltildi (bkz. §2i).
  - **Proje kökündeki `./dagsk-teknik-calisma.js`** — `public/dagsk-teknik-calisma.js`'in (canlı,
    `app.html`'in yüklediği kopya) Faz 5 grup 2'den ÖNCE birebir aynısı olan, hiçbir yerden
    yüklenmeyen ölü bir kopyaydı (bkz. §2d). Artık iki dosya UYUŞMUYOR — ya silinmeli ya da
    (daha az riskli ama gereksiz) yeniden senkronlanmalı. **Faz 6 kapsamına girmedi, hâlâ açık.**
  - `.tree-cat-btn`/`.aktif-klasik`/`.aktif-makarali` (styles.css ~449-451) — Faz 5 grup 4'te
    Yarışmalar'ın kategori sekmesi `.seg`/`.seg-btn`'e taşınınca kullanımdan kalktı. **SİLİNDİ** (Faz 6).
  - **Periyodik arka plan isteklerinin ara sıra "Failed to fetch" atması** — Faz 5 grup 5 testlerinde
    gözlendi, HİÇBİR kod değişikliğiyle ilgisiz olduğu doğrulandı (bkz. §2g) — muhtemelen düello
    yoklama/senkron `setInterval`'ının yerel `wrangler dev` altında ara sıra bağlantı reddi alması.
    Faz 6 regresyon testinde de aynı, kod değişikliğiyle ilgisiz olarak tekrar gözlendi (bkz. §2i).
    Prod'da (gerçek Workers ortamı) tekrar eder mi kontrol edilmemiş, ayrıca bkz. §9 `fanOutMasterPayload`.

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
| 14 | **Ana Ekran** | ✅ bitti (Faz 5 grup 6, SON) | `.card` + buton hiyerarşisi (Skor Gir tek `.btn-primary`). `#sonraki-ders-widget`/`#haftalik-program-widget` sadece dış kabuk değişti, boş/dolu durumları ayrıca test edildi (bkz. §2h) — Ders Programı bağımlılığı sağlam. |

**Sıralama güncellemesi (Faz 5 grup 3 sonrası)**: kalan 7 ekranın gruplanışı kullanıcı tarafından
zorluk/risk gözetilerek yeniden belirlendi — Grup 4: Yarışmalar + Düello + Video, Grup 5: Mağaza +
Reaksiyon (Reaksiyon bilerek en son, Ana Ekran hariç en riskli/en büyük ekran). Tablodaki orijinal
sıra numaraları (7-13) korundu, sadece grup ataması güncellendi.

**Araştırma notu**: "Ders Programı" 15 ekranın hiçbirinin KENDİSİ değil — asıl CRUD'u (`yoneticiProgramCiz`,
`sporcuProgramCiz`) Yönetici Paneli'nin kendi modallarında yaşıyor, o panel Faz 3'te doğrulandığı gibi
sekme-tab navigasyonuna hiç girmiyor. Ana Ekran'daki `#sonraki-ders-widget` bu veriye SADECE OKUYARAK
bakan tek sekme-içi bağlantı — kullanıcının "Ders Programı'nın olduğu ekran" ifadesi bunu işaret ediyor.

## 7. Kurallar ve tuzaklar

- **KALICI İŞ AKIŞI KURALI (2026-09-10, kullanıcının kendi ifadesiyle)**: "bir iş onaylandığında
  commit + push + deploy, üçü birlikte, ayrıca söylememe gerek yok. Sonucu raporla." Yani bir
  aşama/iş kullanıcı tarafından onaylanıp o onayın doğal sonucu işin bittiğiyse (yeni bir aşamaya
  geçiş istenmiyorsa) — SORULMADAN: (1) DEVIR.md güncellenir, (2) `git commit` atılır, (3)
  `git push origin main` yapılır (push'tan ÖNCE `git fetch origin` + `git rev-list --count
  main..origin/main` ile origin'de yerelde olmayan commit var mı kontrol edilir — 0 değilse
  KÖRLEMESİNE push edilmez, kullanıcıya sorulur; bu kontrol 2026-09-10'a kadar HİÇ push
  yapılmamış olmasından, yani yerel `main`'in haftalarca origin'den habersiz ilerlemiş
  olabileceğinden kaynaklı bir gerçek risk), (4) `npm run deploy` ile canlıya alınır, (5) sonuç
  (commit hash, push durumu, deploy version ID, canlı URL sağlık kontrolü) kısaca raporlanır.
  Cloudflare Workers'ın GitHub Git-entegrasyonu (push'ta otomatik build+deploy) BİLEREK
  KURULMADI — kullanıcı iki gerekçeyle reddetti: (a) D1 migration'ları (`migrations/`,
  `migrations_milo/`) deploy'un parçası değil, otomatik akış migration'sız kod deploy edebilir,
  (b) push→production arasında hiçbir onay adımı yok, sahadan çalışırken bu ikisi tehlikeli.
  Mevcut akış (Claude commit+push+deploy yapar, kullanıcı ekran görüntüsüyle onaylar) BİLEREK
  korunuyor.
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
- **Sıfır-etkili bir seri (ör. M-M-M, ya da hasarı/ilerlemeyi sıfır çıkan başka bir kombinasyon) TEK
  BAŞINA bir mekaniği doğrulamaz — yanlış bir yön/hedef/index hesabını GİZLEYEBİLİR.** Faz 11'de
  (Düello Arena, §15d) tam bu şekilde yakalandı: `bitirOrtak()`'ın paylaşılan otomatik-sıradaki-geçiş
  satırı Arena'nın kendi senkronunu 3. girişten itibaren sessizce eziyordu, ama Stage 3'ün test
  sırasının 3. girişi tesadüfen M-M-M idi (0 hasar) — yön yanlış olsa bile hasar hep 0 olduğu için
  fark edilmedi, Stage 3 "doğrulandı" diye raporlandı. Gerçek hata ancak Stage 4'te ART ARDA GERÇEKTEN
  ETKİLİ (X/10/9 gibi) girişlerle adım adım iz sürülünce ortaya çıktı. **Kural**: bir mekaniği (hasar,
  ilerleme, hasar yönü, hedef seçimi vb.) test ederken en az BİR gerçek etkili giriş/seri ZORUNLU —
  "sıfır sonuç" veren bir test senaryosu sadece "hata vermedi" kanıtı, "doğru çalışıyor" kanıtı DEĞİL.
  Ardışık birden fazla GERÇEK etkili girişle (en az 2-3, art arda) adım adım durum izlenmeli, sadece
  tek bir girişten sonraki tek bir okumaya güvenilmemeli (asenkron/animasyonlu akışlarda tek okuma
  yanlışlıkla "tesadüfen doğru" görünebilir — bkz. Faz 11'in `_kmOyunAktifIndex` örneği, ilk girişte
  paylaşılan formül ile Arena'nın kendi senkronu TESADÜFEN aynı değeri üretmişti).

## 8. Çözülmemiş konular ve açık sorular

- ~~Faz 3'ün 6'lık liste ve ikon seti~~ — **ÇÖZÜLDÜ**, bkz. §2a.
- ~~Faz 4'ün Skor ekranı tasarımı~~ — **ÇÖZÜLDÜ**, bkz. §2b.
- ~~Faz 5 grup 2 (Gelişim, Ders İçerikleri, Teknik Çalışma)~~ — **ÇÖZÜLDÜ**, bkz. §2d.
- ~~Faz 5 grup 3 (Klasman, Başarılar)~~ — **ÇÖZÜLDÜ**, bkz. §2e.
- ~~Faz 5 grup 4 (Yarışmalar, Düello, Video)~~ — **ÇÖZÜLDÜ**, bkz. §2f.
- ~~Faz 5 grup 5 (Mağaza, `#duello-modal`, Reaksiyon)~~ — **ÇÖZÜLDÜ**, bkz. §2g. `#duello-modal`
  ilk turda kapsam dışı bırakılmıştı, kullanıcının düzeltmesiyle bu grupta ele alındı.
- ~~Faz 5 grup 6 / SON (Ana Ekran)~~ — **ÇÖZÜLDÜ**, bkz. §2h. **FAZ 5 TAMAMEN BİTTİ** — 15 ekranın
  hepsi (Skor dahil) tasarım sistemine geçirildi. Sıradaki iş Faz 6 (bkz. §6) ve §9'daki veri-katmanı
  iş kalemi — ikisi de yeni bir onay/başlama kararı bekliyor, otomatik başlanmayacak.
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

## 9. Sessiz başarı hatası — DÜZELTİLDİ (2026-09-10, bkz. §9c)

**GÜNCELLEME**: Bu bölümün asıl veri-kaybı riski (§9'un "Riskli yanı"/"DÜZELTME" alt bölümleri —
`fanOutMasterPayload`'ın HER zaman başarılı dönmesi) düzeltildi, test edildi, deploy edildi. Tam
detay §9c'de. Aşağıdaki orijinal teşhis (hacim/istek-sayısı analizi) hâlâ geçerli ve AYRI, ele
alınmamış bir iş olarak duruyor — SADECE sessiz-başarı kısmı çözüldü, istek hacmi/toplu-işlem
sorunu değil (kullanıcı özellikle bunu ayrı bir iş olarak bıraktı, bkz. §9c).

**Aciliyet notu (kullanıcının kendi değerlendirmesi)**: istek hacmi sorununun KENDİSİ hâlâ duruyor
(aşağıdaki "Ölçüm" — gerçek prod verisiyle 771 istek/döngü, bkz. güncellenmiş bölüm) ama artık
SESSİZCE başarısız olmuyor — §9c'nin düzeltmesinden sonra bir fan-out gerçekten tıkanırsa (ör.
`ERR_INSUFFICIENT_RESOURCES`) `bekleyenGonderim` true kalır, backoff'a düşer, ve eğer neden 401 ise
kullanıcı görünür bir uyarı görür; diğer başarısızlık türlerinde de en azından veri sessizce
"gönderilmiş" SANILMAZ, `bulutDurum()`/`bekleyenGonderim` durumu gerçeği yansıtır. **Bu, sorunun
ortaya çıktığı anda fark edilmesini sağlıyor — aciliyeti düşürüyor ama sorunu ORTADAN KALDIRMIYOR.**
İstek hacmi kendisi (§9'un asıl konusu) hâlâ ayrı, çözülmemiş bir madde.

**Bağlam (orijinal teşhis, Faz 6 SONRASI)**: Faz 5 grup 5 testlerinde (bkz. §2g) periyodik arka plan
isteklerinin ara sıra "Failed to fetch" / `net::ERR_INSUFFICIENT_RESOURCES` verdiği gözlendi.
Kullanıcının isteğiyle kök nedeni tam teşhis edildi (bu bölüm o teşhisin özeti).

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

**DÜZELTME (2026-09-09, PIN'siz oturum "401 fırtınası" teşhisinde bulundu — bkz. §13c)**: yukarıdaki
"bir sonraki döngü yeniden dener" varsayımı **YANLIŞ** çıktı. `fanOutMasterPayload()`'daki HER job'ın
`.catch(() => {})`'i olması, sadece "sessizce yutuluyor" değil — `Promise.all(jobs)` bu yüzden ASLA
reddedilmiyor, yani `bulutaGonderKontrol()`'ün `.then()` (BAŞARI) dalı yazmalar %100 başarısız olsa
BİLE çalışıyor: `sonBulutJSON = json` yazılıyor, `guvenlikYedegiAl()` çağrılıyor — sanki her şey
gönderildi gibi. Gerçek testte doğrulandı: PIN'siz (auth başlıksız) bir oturumda ~700 istek TEK bir
patlamada 401 alıyor, ama `bekleyenGonderim` `false` kalıyor ve fonksiyon MANUEL tekrar çağrılınca bir
DAHA istek atmıyor — çünkü "başarılı" sandığı için `sonBulutJSON` zaten güncel görünüyor. Yani gerçek
risk "sürekli tekrar eden bir fırtına" değil, **"tek seferlik, sessiz, kalıcı bir yedekleme
başarısızlığı"** — cihaz o oturumda hangi frac/yoklama olursa olsun bir daha denemez, ve bunu
raporlayacak hiçbir mekanizma yok.

**Ölçüm (GERÇEK prod verisiyle, 2026-09-10 — güncellendi)**: Bu oturumun başında `wrangler d1
execute --remote` denendiğinde OAuth token'ın izin kapsamında D1 yoktu (`code: 7403`). Faz 13
sonrasında AYNI komut TEKRAR denendi — bu kez **çalıştı** (`wrangler whoami` artık `d1 (write)`
listeliyor; token izinleri sohbetler arası büyümüş/yenilenmiş olmalı — gelecekteki oturumlar önce
`wrangler whoami`'yle kontrol etsin, artık uzak D1'e doğrudan erişim MÜMKÜN). Gerçek prod sayıları:

```
$ wrangler d1 execute dagsk-db --remote --command "SELECT (SELECT COUNT(*) FROM athletes) sporcu,
  (SELECT COUNT(*) FROM dues) aidat, (SELECT COUNT(*) FROM attendance_auto) yoklama,
  (SELECT COUNT(*) FROM personnel) personel, (SELECT COUNT(*) FROM personnel_attendance) personel_yoklama,
  (SELECT COUNT(*) FROM custom_classes) ozel_sinif;"

sporcu: 95 (hepsi aktif, pasif=0)   aidat: 75   yoklama: 406   personel: 2   personel_yoklama: 0   ozel_sinif: 0
```

Formüle yerine konunca:

```
istek sayısı ≈ 3×95 (sporcu) + 1×75 (aidat) + 1×406 (yoklama) + 1×2 (personel) + 1×0 + 1×0 + 3 (sabit)
             = 285 + 75 + 406 + 2 + 0 + 0 + 3
             = 771 istek / tam fan-out döngüsü
```

**771 gerçek, GÜNCEL bir sayı — tahmin değil.** Bu, yerel testte `ERR_INSUFFICIENT_RESOURCES`'a yol
açan hacimle AYNI mertebede. Kulüp büyüdükçe (özellikle `yoklama` — 406 kayıt, günlük biriken tek
koleksiyon, hiç arşivlenmiyor) bu sayı SADECE büyüyecek. Bu ölçüm için kullanılan komut, gelecekte
tekrar ölçmek isteyen biri için: yukarıdaki `wrangler d1 execute dagsk-db --remote --command "..."`
tek satırı yeniden çalıştırılabilir. **D1 izni OLMASAYDI** alternatif: kullanıcı Cloudflare
dashboard'unda (dash.cloudflare.com → Workers & Pages → D1 → `dagsk-db` → Console) aynı SQL'i elle
çalıştırıp sonucu buraya yapıştırabilir — komut satırı erişimi gerekmez.

**📏 EŞİK (kullanıcı belirledi, 2026-09-10): bu sayı 1000'i geçerse istek hacmi işi ÖNCELİK 1 olur.**
Ayda bir yukarıdaki tek satır komut tekrar çalıştırılıp sonuç buraya (yeni bir tarih damgasıyla)
eklenerek trend izlenebilir. **2026-09-11 GÜNCELLEMESİ (bkz. §9e)**: aidat artık fan-out'ta
SAYILMIYOR (kendi kalıcı kuyruğuna bırakıldı) — "Toplam istek" sütunu bu tarihten sonra
`3×sporcu + yoklama + personel + 3` formülünü kullanıyor, `aidat` sütunu SADECE referans/trend için
tutulmaya devam ediyor (o kolon büyürse dues kuyruğunun kendi hacmi artar, ama fan-out'u etkilemez):

| Tarih | sporcu | aidat (fan-out'a dahil DEĞİL) | yoklama | personel | Toplam istek (fan-out) | Eşiğe uzaklık |
|---|---|---|---|---|---|---|
| 2026-09-10 | 95 | 75 | 406 | 2 | 771 (aidat dahil, eski formül) | 1000 − 771 = 229 |
| 2026-09-11 | 95 | 75 | 406 | 2 | **696** (aidat düşürüldü) | 1000 − 696 = 304 |

(Yeni ölçümler bu tabloya SATIR olarak eklensin, üzerine yazılmasın — trend görünür kalsın.)

**Olası yön (uygulanmadı, sadece not)**: (1) değişen alanları gönder (tam anlık görüntü değil,
delta), (2) eşzamanlılık sınırı (ör. aynı anda en fazla N istek, kalan kuyrukta), (3) hata sayacı —
art arda başarısız olan job sayısı bir eşiği aşınca kullanıcıya görünür bir uyarı (mevcut
`bulutDurum()` göstergesine benzer — **BU MADDE §9c'de UYGULANDI**, sadece istek-hacmi azaltma (1)/(2)
hâlâ AYRI, ele alınmamış bir iş), (4) aidat/yoklama gibi büyümeye devam eden koleksiyonlar için
arşivleme/budama stratejisi.

## 9c. Sessiz başarı hatasının düzeltilmesi (2026-09-10, TAMAMLANDI)

**Kapsam (kullanıcı tarafından bilerek dar tutuldu)**: SADECE §9'un "sessiz başarı" riski — istek
hacmini azaltma (yukarıdaki (1)/(2)) AYRI bir iş, `/api/series` yazma yoluna dokunulmadı (zaten
korumalı), auth mantığına dokunulmadı (doğru kurulmuş, sadece `res.status` okunuyor).

**Değişiklik 1 — `fanOutMasterPayload()` (public/sync.js:225) artık GERÇEKTEN reddediyor**: her job'ın
kendi `.catch(() => {})`'i kaldırıldı, `Promise.all` yerine `Promise.allSettled` ile hepsi denenip kaç
tanesinin başarısız olduğu sayılıyor; en az biri başarısızsa fonksiyon bir `Error` fırlatıyor
(`err.basarisizSayisi`/`err.toplamSayisi`/`err.bazi401Mi`). **Fonksiyonu yeniden yazmadan** — sadece
hata yutma kaldırıldı — bu tek değişiklik, app.js'teki `.doc('master').set()`'in 8 çağrı noktasının
ZATEN doğru yazılmış `.catch()` işleyicilerini (hepsi `bekleyenGonderim=true` yapıyor) ilk kez
gerçekten tetikler; sekizi de tek tek okunup doğrulandı (hiçbiri catch'inde yıkıcı bir şey yapmıyor —
hepsi ya sadece durum bayrağı/toast, ya da yerel veri zaten cloud denemesinden ÖNCE localStorage'a
yazılmış oluyor). `api()` (sync.js:21) fırlattığı Error'a `.status` ekledi — mevcut hiçbir kod bunu
okumuyordu, saf ekleme.

**Değişiklik 2 — kalıcı hatada sonsuz istek fırtınası riski (kullanıcı endişesi)**: `bulutaGonderKontrol`
(app.js:6179) 10sn'lik `setInterval`le (app.js:5730) SONSUZA dek çalışıyor; düzeltme 1 olmadan bu,
kalıcı bir 401'de her turda YÜZLERCE isteğin sonsuza dek tekrarlanması demekti. Çözüm: sync.js'nin
KENDİ WebSocket yeniden-bağlanma deseniyle (`wsBackoff`, ×1.5 büyüme/120sn tavan/±%25 jitter) AYNI
mekanizma, `bulutaGonderKontrol()`'e eklendi (`_bulutFanOutBackoffMs`/`_bulutFanOutSonrakiDeneme`).
Tek bir merkezi kapı (`.set()` çağrısından hemen önce) — hem 10sn'lik periyodik tetikleyiciyi hem de
onlarca eylem-tetiklemeli çağrıyı (`bulutaGonderKontrol()`'ün diğer ~15 çağrı noktası) TEK yerden
korur. Başarıda tabana (10sn) sıfırlanır.

**Değişiklik 3 — 401'e özel uyarı**: `bulutaGonderKontrol()`'ün catch'i `err.bazi401Mi` görürse
(sadece BU site'de — diğer 7 çağrı noktasına dokunulmadı, onlar zaten kendi geri bildirimini
gösteriyor) bir kerelik `showToast('Yedekleme için PIN girişi gerekiyor', 'error')` gösterir
(`_bulut401UyariGosterildi` bayrağıyla, her 10sn'de tekrar etmez; başarıda sıfırlanır).

**Gerçek senaryolarla test edildi** (sıfır-etkili test YETERSİZ sayıldı, üç gerçek senaryo da
doğrulandı): yerel test D1'inde 740 sporcu birikmiş olduğu için (haftalardır süren test oturumları)
GERÇEK `turnuvaDB` ile tam bir fan-out denemesi tek başına yerel `wrangler dev`'i tıkayıp yanıltıcı
"Failed to fetch" hataları üretiyordu — bu AYRI, zaten bilinen istek-hacmi sorunuydu (kapsam dışı).
Testler bu yüzden `turnuvaDB`'yi (SADECE bellek-içi, D1'e hiç yazılmadan) tek bir test sporcusuna
küçülterek izole edildi:
1. **PIN'siz oturum (`_dagskYetkiHash=null`)** → gerçek istekler gerçek 401 aldı → `bekleyenGonderim=true`,
   backoff 10sn→15sn büyüdü, **"Yedekleme için PIN girişi gerekiyor" toast'ı gerçekten göründü**.
2. **Backoff aktifken hemen tekrar çağrıldığında** → yeni bir `/api/athletes` isteği ATILMADI (ağ
   sekmesi izlenerek doğrulandı) — kapı çalışıyor.
3. **PIN geri "girilip" (`_dagskYetkiHash` gerçek hash'e döndürülüp) backoff süresi dolunca tekrar
   çağrıldığında** → gerçek bir istek atıldı, `bekleyenGonderim=false`'a döndü, backoff tabana
   sıfırlandı, hata toast'ı YOKTU — ve en kritik kanıt: **test sporcusu gerçekten yerel D1'e yazıldı**
   (`SELECT ... FROM athletes WHERE ad LIKE '__fot%'` ile doğrulandı, sonra silindi). Bu üçü birlikte
   "kalıcı hata → geri çekilme → düzelince gerçekten tekrar deneyip başarma" döngüsünün uçtan uca
   çalıştığını kanıtlıyor.

`node --check` (her iki dosya), `npx tsc --noEmit` temiz. `npm test` bu projede hiç yazılmış test
dosyası yok, çalıştırılamadı (önceden var olan durum, bu değişiklikle ilgisiz).

## 9d. İstek hacmi — iki yön değerlendirmesi (2026-09-10, SADECE ANALİZ, uygulanmadı)

Kullanıcı iki yönün risk/kazanç dengesini sordu: (a) sadece değişeni gönderme (delta senkron), (b)
yoklama arşivleme. Kod okunarak (uygulama yapılmadan) şu bulundu — **bu bulgu değerlendirmeyi
değiştiriyor**: `aidatDB` (75 kayıt) ZATEN kendi kalıcı, tekrar-denemeli kuyruğuna sahip
(`_aidatBekleyenPutler`/`_aidatDuesGonder`, app.js:5866 — dues bir hücre her değiştiğinde ANINDA ve
bağımsız gönderiliyor, tıpkı §9c'de fanOut için yapılan düzeltmenin AYNI deseniyle, ZATEN önceden
yapılmış). Yani fan-out'un aidat kısmı (771'in 75'i) **saf tekrar** — zaten güvenilir şekilde
senkronlanan veriyi 10 saniyede bir gereksiz yere tekrar gönderiyor. `otomatikYoklamaDB` (406 kayıt,
771'in en büyük dilimi) için ise böyle bir kuyruk YOK — sadece fan-out'ta yaşıyor.

**Değerlendirme**:
- **(b) Yoklama arşivleme daha az riskli.** İzole bir veri-yaşam-döngüsü değişikliği — çekirdek
  senkron doğruluğuna hiç dokunmuyor, sadece `otomatikYoklamaDB`'nin BOYUTUNU sınırlıyor. Kapsamı dar
  (sadece yoklama okuma yolları — aylık rapor, devamsızlık radarı vb. — eski kayıtlara nasıl
  erişeceğini yeniden düşünmek gerekir) ama hatası da o kadar dar kalır.
- **(a) tam/genel hali ("bütün kulübü diff'le") daha riskli ve kullanıcının sezgisi doğru** — en çok
  kod dokunuşu bu. Skor/veri katmanına EN yakın değişiklik, kısmi başarısızlıkta HANGİ alanların
  gönderildiğini doğru izlemek zorunda (yoksa §9'un aynı sınıfı bir sessiz-kayıp riski yeniden
  doğar), ve "cihaz günlerce kapalıydı" soğuk-başlangıç senaryosu için YİNE tam bir senkron yoluna
  ihtiyaç var — yani tam diff motoru ASLA fan-out'un yerini tamamen almaz, üstüne eklenir.
- **Ama (a)'nın DAR bir dilimi neredeyse bedava**: `aidatDB`'yi (ve muhtemelen km-liste alanlarını)
  fan-out'un job listesinden ÇIKARMAK — zaten var, ZATEN test edilmiş, ZATEN §9c'yle aynı deseni
  taşıyan bir kuyruğa güvenmek — yeni senkron mantığı İCAT ETMEDEN 75 isteği anında düşürür. Bu,
  kullanıcının "en çok kod dokunuşu" endişesinin haklı olduğu GENEL diff motorundan tamamen farklı,
  çok daha küçük bir değişiklik.
- **`otomatikYoklamaDB` için böyle bir kısayol YOK** (kendi kuyruğu yok) — bu yüzden onun için gerçek
  seçenek ya (b) arşivleme ya da dues'unkiyle AYNI deseni taşıyan YENİ bir yoklama kuyruğu kurmak
  (bu da (a)'nın dar, düşük riskli bir dilimi olurdu — dues'ta zaten kanıtlanmış bir kalıbı kopyalamak,
  genel bir diff motoru icat etmek değil).

**Sonuç**: (b) ve (a)'nın DAR dilimi (aidat'ı fan-out'tan düşürmek + yoklama için dues'unkiyle aynı
kalıpta bir kuyruk) BİRLİKTE yapılmalı — ikisi FARKLI sorunları çözüyor (biri her-10-saniyelik hacmi,
diğeri sınırsız büyümeyi/soğuk-başlangıç ağırlığını). (a)'nın GENEL/tam hali ("bütün kulübü diff'le")
şimdilik ÖNERİLMİYOR — daha yüksek risk, ve dues+yoklama çözülünce muhtemelen hiç gerekmeyecek (kalan
en büyük kalem sporcu profilleri, 285/771, roster büyüklüğüyle orantılı ve YAVAŞ büyüyor — ders başına
değil, yeni kayıt başına). Öncelik sırası önerisi: önce (b) (izole, hızlı, "yeni sporcu almasak bile
büyür" endişesini doğrudan öldürür), sonra dues'u fan-out'tan düşürmek (neredeyse bedava), sonra
(isteğe bağlı) yoklama için dues-benzeri bir kuyruk.

## 9e. İş 1/3 — Aidatı fan-out'tan düşürme (2026-09-11, TAMAMLANDI, deploy edildi)

**Önce kanıt (kullanıcı istedi)**: `aidatDB`'ye yazan HER kod yolu tek tek bulunup okundu:
`aidatAySave`/`aidatAyTemizle` (coach hücre düzenler/temizler) → ikisi de `_aidatDuesPut`'u çağırıyor,
tam kapsama. `aidatMuafToggle`/`aidatDogumTarihiKaydet`/`aidatKatilmaTarihiKaydet`/`aidatAlanKaydet` →
bunlar `aidatDB`'ye HİÇ dokunmuyor, `turnuvaDB[grup][ad]` (sporcu alanı) yazıyorlar — ayrı, dokunulmayan
bir yol (sporcu PATCH'i, hâlâ fan-out'ta). `_aidatSporcuEkleGerceklestir` (Aidat ekranından yeni sporcu)
→ sadece sporcu kaydı oluşturuyor, `aidatDB` hücresi YOK. **Toplu içe aktarma canlı kodda YOK** (2026-07
Excel içe aktarımı uygulama dışında, bir kereliğine yapılmıştı). **Ay değişimi/rollover YOK** — aylar
tembel oluşuyor, sadece coach bir hücreye dokununca. **Bulunan tek gerçek boşluk, ÖNCEDEN VAR OLAN bir
hata**: `yoneticiSil()` (app.js:9222) `aidatDB[g]` (g=grup adı) siliyor ama `aidatDB` DÜZ `aidatDB[ad]`
şeklinde anahtarlanıyor (grup katmanı YOK) — bu satır hep `undefined` üzerinde çalışıp hiçbir şey
silmiyordu (muhtemelen hemen üstündeki `otomatikYoklamaDB[t][ad].grup===g` satırından kopyalanmış,
farklı bir veri şekli). Sporcu silindiğinde `aidatDB` hücreleri zaten temizlenmiyordu — bu değişiklik bu
davranışı DEĞİŞTİRMEDİ, sadece tekrar-gönderimi kaldırdı. Ayrı, ele alınmamış bir hata olarak not
düşüldü, bu işin kapsamı dışı.

**Değişiklik**: `fanOutMasterPayload()`'ın (public/sync.js) aidat job-oluşturma döngüsü SİLİNDİ —
`p.aidatDB` artık hiç okunmuyor/gönderilmiyor. Fonksiyonun geri kalanı (§9c'nin allSettled/hata-sayma
mantığı dahil) DOKUNULMADI.

**Gerçek test**: (1) `_aidatDuesPut` çağrılınca gerçek bir `/api/dues/...` PUT isteği ANINDA, fan-out'tan
bağımsız olarak atıldığı doğrulandı; (2) hemen ardından tam bir `bulutaGonderKontrol()` döngüsü
tetiklendi — `/api/athletes` isteği (kıyas için) atıldı ama `/api/dues/...` isteği HİÇ atılmadı; (3) uçtan
uca kanıt: test hücresi (`odendi:1, tutar:500`) gerçekten yerel D1'e yazıldı — SADECE kuyruktan, fan-out
hiç katkı yapmadan. Test verisi silindi, PIN geri alındı. `node --check public/sync.js` temiz.

**Sonuç**: 771 → **696** istek/döngü (75 aidat isteği düştü). Sonraki adım (kullanıcı onayı bekliyor):
İş 2/3, yoklama arşivleme.

**Ölçüm (2026-09-11, kullanıcı istedi, sadece SAY — silme YAPILMADI)**: `yoneticiSil()`'in bu hatası
gerçek prod verisinde ne kadar öksüz kayıt bırakmış? Gerçek D1'e karşı `NOT EXISTS (SELECT 1 FROM
athletes WHERE ad=...)` ile ölçüldü:

| | Toplam | Öksüz | Oran |
|---|---|---|---|
| Aidat (dues) | 75 | 2 | %2.7 |
| Yoklama (attendance_auto) | 406 | 11 | %2.7 |

Kullanıcının kendi "%20 olsaydı anlamlı olurdu" eşiğinin çok altında — **anlamsız, ayrı bir temizlik
turu gerektirmiyor**. Örneklem incelendi: aidat'taki 2 kayıt ("Ali Veli", "BABABABA") ve yoklamadaki
bazıları ("BABABABA", "DENEME") kullanıcının kendi eski TEST kayıtları (bkz. aşağıdaki not); ama
yoklamadaki bazı isimler (CAN GÖKTAŞ, İLYA, EYMEN YAVUZ — 3 farklı `grup` değeriyle, DENIZ TUNA
YILMAZ, GÖKTUĞ) gerçek/silinmiş sporcular gibi görünüyor — **ölçüm `yoneticiSil()`'in aidat YANINDA
yoklamayı da bıraktığını doğruluyor**. Yan bulgu: `attendance_auto.grup`'ta `athletes.grup`'un CHECK
kısıtlamasının kapsamadığı bir değer (`'karisik'`) bulundu — kısıtlama olmadığı için mümkün, ayrı ve
düşük öncelikli bir veri-kalitesi notu.

**`yoneticiSil()` hatasının kendisi — KÜÇÜK, SONRAKİ İŞ olarak not düşüldü (henüz düzeltilmedi)**:
`app.js:9222`'deki `if(typeof aidatDB !== 'undefined' && aidatDB[g]) delete aidatDB[g][ad];` satırı
YANLIŞ anahtar şekliyle çalışıyor (`aidatDB` düz `aidatDB[ad]`, `aidatDB[grup][ad]` DEĞİL) — bu yüzden
hem aidat HEM yoklama (yoklama tarafı ayrıca kontrol edilmeli, aynı fonksiyonun içinde benzer bir satır
var) bir sporcu silindiğinde temizlenmiyor. Ucuz bir düzeltme (doğru anahtarla silme + sunucuya da
haber verme) ama kapsamı KARIŞTIRILMASIN diye arşivleme işinden SONRAYA bırakıldı — kullanıcı talimatı.

**Prod'daki test kayıtları (BABABABA, DENEME, "Ali Veli") — SİLİNMEDİ, kullanıcı karar verecek**:
kullanıcı bunların kendi eski denemeleri olduğunu doğruladı ve silinmelerinin etkisini sordu. Etki
analizi: `athletes` tablosunda bu adlarla eşleşen GERÇEK bir satır zaten yok (tam da bu yüzden
"öksüz" sayıldılar) — yani bu isimler `turnuvaDB`'de aktif olarak GÖRÜNMÜYOR, hiçbir ekranda
listelenmiyor, hiçbir raporun/istatistiğin toplamına girmiyor (aidat geliri, devamsızlık, klasman —
hepsi `turnuvaDB`/`athletes` üzerinden hesaplanıyor, bu öksüz satırlar zaten dışarıda). Silmenin
tek etkisi: `dues`/`attendance_auto` tablolarındaki birkaç fazlalık satırın kalıcı olarak temizlenmesi
— ölçülebilir bir davranış değişikliği YOK, sadece hijyen. Silinirse geri alınamaz (D1'de tombstone/
`deleted_athletes` mekanizması SADECE `athletes` silmeleri için var, `dues`/`attendance_auto` için
yok) ama zaten kullanılmayan veri olduğu için pratik risk yok. Silme işlemi istenirse ayrı, açık bir
onayla yapılacak.

## 9f. İş 2/3 — Yoklama arşivleme, GÜVENLİK BAYRAKLI (2026-09-11, gece görevi, TAMAMLANDI, deploy edildi)

**Bağlam**: kullanıcı gece için üç iş bıraktı, ara onay istemeden bitirilip sabah tek raporla
sunulacak şekilde. Bu iş, önceden sunulan ve onaylanan plandı — TEK fark, kullanıcının son eklediği
güvenlik bayrağı (aşağıda).

**Neden bir güvenlik bayrağı gerekti**: plan sunulurken `_raporKatilimAy`/`_raporKatilimSezon`
fonksiyonlarının "3 yer"den çağrıldığı düşünülüyordu — kod adım adım okunduğunda gerçekte **7 farklı
rapor fonksiyonundan** (`_aylikBultenMetni`, `sporcuAylikRaporPdfIndir`, `aylikBultenCiz`,
`aileRaporuPDF`, `aileRaporuMetin`, `_dersSonuOzetMetni`, `yoneticiAylikKatilimCiz`) çağrıldığı
bulundu — hepsini AYNI gece arşiv-farkında hale getirmek çok daha büyük bir değişiklik yüzeyi
olurdu. Kullanıcı bunun yerine bir güvenlik bayrağı istedi: mekanizmanın kendisi (tablo, cron, log)
BUGÜN kurulsun ama gerçek veri taşıma o 7 fonksiyon hazır olana kadar kapalı kalsın.

**Kurulan mekanizma**:
1. **Migration `0036_attendance_archive.sql`**: `attendance_auto_archive` (aynı şema) + `archive_runs`
   (log) tabloları. SIFIR veri taşır — sadece boş tablo oluşturur. Yerel D1'de uygulanıp test edildi.
2. **`src/lib/attendanceArchive.ts`** — yeni modül, `export const ARSIV_RAPORLAR_HAZIR = false`.
   `archiveOldAttendance(env)`: 90 günlük eşiği Türkiye saatiyle hesaplar (`reminders.ts`'teki
   `turkiyeSaatBilgisi`'i export edip REUSE etti — proje genelindeki "Workers runtime'ında Date yerel
   getter'ları UTC döner" uyarısına uyularak, yeni bir tarih hesaplama deseni İCAT EDİLMEDİ).
   Bayrak `false` iken: eski satır sayısını SAYAR ama TAŞIMAZ, sayı bir önceki "kuru" log'dan
   FARKLIYSA `archive_runs`'a `bayrak_durumu='kuru'` bir satır yazar (aynı sayıyı tekrar tekrar
   loglamaz — yoksa bu log tablosu kendisi her 5 dakikada büyüyen bir koleksiyon olurdu). Bayrak
   `true` olduğunda: satırları arşive kopyalar + canlı tablodan siler + sonucu loglar, hepsi TEK bir
   `env.DB.batch()` içinde (atomik — yarım kalmış bir taşıma riski yok).
3. **`src/index.ts`**: `scheduled()`'a `archiveOldAttendance(env)` eklendi — YENİ bir cron değil, VAR
   OLAN 5 dakikalık tetikleyiciye (hatırlatmalarla birlikte) eklendi.
4. **`GET /api/attendance/auto`** genişletildi: `?from=&to=` verilirse `attendance_auto` ∪
   `attendance_auto_archive`'ı birleştirip döner (7 fonksiyon hazır olunca kullanacağı yol) —
   parametresiz/`?tarih=` eski davranış BİREBİR aynı kaldı, geriye dönük tam uyumlu.
5. **Devamsızlık Radarı "yaklaşık" işareti**: `_sonGelisGun()` artık `{gun, yaklasikMi}` döndürüyor —
   gerçek bir yoklama/antrenman kaydı yerine `sp.sonSkorZamani`'ye (bir skor girişi, yoklamanın
   kendisi değil) düşüldüyse `yaklasikMi=true`. 3 render noktası (`yoneticiDevamsizlikWidgetCiz`,
   `yoneticiOzetCiz`, `yoneticiDevamsizlikSekmesiCiz` — ikincisi ve üçüncüsü birebir aynı satırdı,
   tek `replace_all` ile ikisi de düzeltildi) artık `~14 gündür yok (yaklaşık)` gibi gösteriyor.
   Bugün itibariyle bu SADECE hiç yoklama kaydı olmayan ama skor girmiş biri için tetikleniyor;
   bayrak `true` olup gerçek taşıma başlayınca 90 günden eski gerçek bir yoklama kaydı da bu duruma
   düşebilir — TASARLANDIĞI gibi.

**Gerçek testle doğrulandı** (yerel D1, migration uygulanmış haliyle): cron tetiklendi (`wrangler dev`
+ `/cdn-cgi/handler/scheduled`), `archive_runs`'a `cutoff_tarih:'2026-06-13'` (bugünden 90 gün önce,
doğru), `tasinan_satir:20`, `bayrak_durumu:'kuru'` yazıldığı görüldü — AMA `attendance_auto_archive`
HÂLÂ BOŞ, o 20 satır HÂLÂ `attendance_auto`'da (gerçekten taşınmadı, bayrak doğru çalışıyor). Cron
ikinci kez tetiklenince YENİ bir log satırı YAZILMADI (dedup doğru çalışıyor). Yeni `?from=&to=`
sorgusu gerçek veri döndürdü, parametresiz eski çağrı hâlâ 200 dönüyor.

**Geri alma (kullanıcı istedi — "aylar sonra bakacağım, hatırlamayacağım")**: bayrak `false` kaldığı
sürece hiçbir şey taşınmadığı için "geri alma" pratik olarak GEREKMEZ. Ama bayrak bir gün `true`
yapılıp gerçek taşıma başladıktan SONRA bir şey ters giderse, arşivlenmiş satırları canlı tabloya
geri taşımak için:
```sql
-- TÜM arşivi geri taşı (dikkat: attendance_auto'da bugün aynı (tarih,ad) satırı varsa ÜZERİNE YAZAR)
INSERT OR REPLACE INTO attendance_auto (tarih, ad, grup, saat, elle, geldi)
  SELECT tarih, ad, grup, saat, elle, geldi FROM attendance_auto_archive;
DELETE FROM attendance_auto_archive;

-- SADECE belirli bir tarihten sonrasını geri taşı (daha güvenli, kısmi geri alma):
INSERT OR REPLACE INTO attendance_auto (tarih, ad, grup, saat, elle, geldi)
  SELECT tarih, ad, grup, saat, elle, geldi FROM attendance_auto_archive WHERE tarih >= '2026-XX-XX';
DELETE FROM attendance_auto_archive WHERE tarih >= '2026-XX-XX';
```
Şema geri alma (tabloları tamamen kaldırmak istenirse, veri kaybı YARATIR, sadece tablolar boşsa/
kullanılmıyorsa güvenli): `DROP TABLE attendance_auto_archive; DROP TABLE archive_runs;`

**Ne zaman izlenmeli**: `SELECT * FROM archive_runs ORDER BY id DESC LIMIT 20;` — `bayrak_durumu='kuru'`
satırları "arşivlenecekti ama bayrak kapalı" anlamına gelir, `tasinan_satir` sütunu büyüdükçe gerçek
veri 90 günü ne kadar aştığını gösterir (bugün: 0, veri sadece 77 gün — bkz. §9 trend tablosu, ~1 ay
içinde ilk gerçek adaylar oluşacak).

## 9g. Sonraki iş — 7 rapor fonksiyonunu arşiv-farkında yapmak, SONRA `ARSIV_RAPORLAR_HAZIR = true`

**Bayrağın yeri**: `src/lib/attendanceArchive.ts`, `export const ARSIV_RAPORLAR_HAZIR = false;` —
gerçek taşımayı açmak için bu TEK satır `true` yapılır (kod başka hiçbir yerde değişmez).

**Önce yapılması gereken**: aşağıdaki 7 fonksiyon şu an SADECE `otomatikYoklamaDB` (bellek-içi, sıcak
pencere) okuyor — bayrak `true` yapılıp gerçek taşıma başladıktan sonra, bu fonksiyonlardan biri
90 günden eski bir ay/sezon için çağrılırsa o eski günleri SESSİZCE eksik sayar (veri kaybolmaz,
D1'de güvende kalır, ama EKRANDA/PDF'te eksik görünür):

1. `_aylikBultenMetni(g, ad, ay)` — aylık veli bülteni metni
2. `sporcuAylikRaporPdfIndir()` — sporcu bazlı aylık PDF rapor
3. `aylikBultenCiz()` — aylık bülten ekran render'ı
4. `aileRaporuPDF(ad, g)` — aile/veli PDF raporu (sezon bazlı)
5. `aileRaporuMetin(ad, g)` — aile raporu metni (WhatsApp kopyala)
6. `_dersSonuOzetMetni(g, ad)` — ders sonu özet metni (sezon bazlı)
7. `yoneticiAylikKatilimCiz()` — yönetici aylık katılım listesi ekranı

**Yapılacak değişiklik şekli** (henüz uygulanmadı): bu 7 fonksiyon değil, SADECE `_raporKatilimAy`/
`_raporKatilimSezon`/`_sonGelisGun`/`devamsizlikListesi` "arşiv verisi" alan OPSİYONEL bir parametre
alacak şekilde genişletilecek (varsayılan boş/`null` — mevcut TÜM çağrılar davranış değişikliği
OLMADAN çalışmaya devam eder). Bu 7 üst-seviye fonksiyon kendi başında `async` olup, ihtiyaç duyduğu
aralık 90 günün dışına taşıyorsa YENİ `GET /api/attendance/auto?from=&to=` uç noktasını bir kez
çağırıp sonucu bu parametre üzerinden geçirecek — hesaplama fonksiyonlarının KENDİSİ değişmeyecek,
sadece bir veri kaynağı daha kabul edecek. `otomatikYoklamaDB` (paylaşılan global) hiçbir zaman
arşiv verisiyle KİRLETİLMEYECEK (aksi halde fan-out'a geri sızma riski olurdu — tam çözülen sorunun
aynısı). Bu iş kullanıcı onayı bekliyor, henüz BAŞLANMADI.

## 9b. Sonraki iş — `#10b981` tokenizasyonu (Faz 6'da bilerek ele alınmadı)

**Bağlam**: Madde 6 (çıplak hex) taramasında `#10b981` 34 yerde bulundu. Kullanıcı açık talimat
verdi: **"hiçbir tokena bağlama, olduğu gibi bırak — 34 yerde ne olacağını bilmediğimiz renk
kayması istemiyorum."** Faz 6'da bu hex koda HİÇ dokunulmadı (`HALKA_RENK`'in `'M'` anahtarı dahil,
bilerek literal `'#10b981'` olarak bırakıldı — bkz. §2i).

**Neden ayrı bir iş kalemi**: `#10b981` şu an "genel yeşil" gibi görünüyor ama 34 kullanımın hangi
alt sistemlere ait olduğu (başarı/rozet rengi mi, "M" — miss/hata göstergesi mi, buton durumu mu,
başka bir anlamlı-renk mi) Faz 6 kapsamında tek tek izlenmedi — Faz 5/6'da defalarca karşılaşılan
"anlamlı renk vs. jenerik chrome" ayrımı (bkz. §7) bu hex için henüz yapılmadı. Bir sonraki oturumda
ele alınacaksa önce her kullanım yeri tek tek sınıflandırılmalı (TOKEN-ADAYI / ANLAMLI-KORUNAN),
sonra kullanıcıya rapor edilip onay alınmalı — Faz 6'nın 6a/6b'de izlediği yöntemin birebir aynısı.

## 10. `merge-origin` dalı — origin/main ile birleştirme (main'e ALINDI ✅)

**Bağlam**: Faz 6 + kontrast düzeltmesi bittikten sonra, `origin/main`'in (GitHub, "Hasan" adlı başka
bir katkıcı tarafından, bu tasarım işinden habersiz) 26 farklı commit'le ayrıştığı keşfedildi —
video AI duruş/açı analizi, İkili Video Karşılaştırma, Ritim & Tıkır Koçluk Modülü (Karışık Sınıf'a
özel) ve ayrı bir "modern renk paleti" denemesi (`65ab859`/`ede7aa2`, sonradan origin'in KENDİSİ
tarafından `1c71557`'de büyük ölçüde geri alındı). Kullanıcı onayıyla `merge-origin` adlı ayrı bir
dal açıldı, `git merge origin/main` yapıldı, 6 çakışma blok (3 dosyada) elle çözüldü — **main hâlâ
`3865dbb`'de, bu dal main'e hiç alınmadı.**

**Çakışma çözümleri**: `styles.css` (3 blok, hepsi `font-family` — bizim `var(--font-sans)` kaldı);
`app.html` (1 blok — Oyunlar/Reaksiyon/Ritim & Tıkır butonlarının üçü de yan yana tutuldu);
`app.js` (2 blok — `kmSekme()` dizisi birleştirildi: yoklama/skor/lider/klasman/canli/yarisma/veli/
disiplin/pozitif/oyunlar/reaksiyon/ritim, **origin'in `'macera'` girişi kullanıcının açık talimatıyla
ALINMADI** — `kmYoklamaCiz` (bizim) ve `kmRitimCiz` (origin'in) fonksiyon gövdelerinin ikisi de
tutuldu). Çözüm sırasında elle bir parantez hatası yapıldı (`kmYoklamaPdfIndir()`'in kendi kapanışı
yanlışlıkla silinmişti), `node --check`'in "Unexpected end of input" uyarısıyla yakalanıp
düzeltildi. Doğrulama: "macera" kelimesi app.js/app.html'de 0 kez; `kmSekme` dizisindeki 12 girişin
(yoklama/skor/lider/klasman/canli/yarisma/veli/disiplin/pozitif/oyunlar/reaksiyon/ritim) hepsi için
karşılık gelen fonksiyon tanımı tek tek doğrulandı (12/12); `node --check` + `npx tsc --noEmit` temiz.

**`macera` kaldırma arkeolojisi** (main'e almadan önce kullanıcı istedi): Macera Modu `55d8093`
(WIP: Ders Programı, yarım) commit'inde kaldırıldı — commit'i **BURAK** (burakdaglioglu@gmail.com)
6 Eylül 2026'da attı. `git log --all -S"macera"` taraması, yerel `main`'in TÜM tarihinde (ve origin'in
her branch/tag'i dahil) bu string'in geçiş sayısını değiştiren sadece 2 commit olduğunu gösterdi:
`30b3edd` "ilk kayıt" (EKLEDİ) ve `55d8093` (KALDIRDI) — arada hiç dokunulmamış, daha önce kaldırılıp
geri getirilmiş bir örüntü YOK. Kullanıcı bunu "bilerek kaldırdım, geri gelmesin" diye teyit etti.

**Bu turun görsel/kod testi** (merge-origin dalında, `wrangler dev` + Playwright, PIN ile giriş,
sonra gerçek hash geri yüklendi):

1. **Origin'in yeni ekranları bizim tokenlarla nasıl duruyor** (360/1280px ekran görüntüsü): Video
   AI Duruş Analizi, İkili Video Karşılaştırma, Ritim & Tıkır — üçü de HER İKİ genişlikte de tam
   okunaklı, hiçbir görünmez metin/kayıp kenarlık yok. Ritim & Tıkır'a ulaşmak Karışık Sınıf'ın
   konum-seçici + sporcu-seçici modallerinden geçmeyi gerektirdi (`kmKonumaBaglan`/`kmBaslat`) —
   ekstra adımdı, ekran kendisi sorunsuz.
2. **`.va-*`/`.ai-config-dock`/`.ai-pill-*` token çakışması**: **çakışma yok, ama origin'in KENDİ
   kodunda önceden var olan bir kırıklık taşınıyor** — `kmRitimCiz()` içinde `var(--accent-sand)` 3
   yerde kullanılıyor ama `--accent-sand` merge SONRASI styles.css'te TANIMLI DEĞİL. Nedeni: origin
   bu tokeni `65ab859`'da (v120) eklemiş, sonra KENDİSİ `1c71557`'de (v127) `:root`'u sadeleştirirken
   silmiş — ama `6be850d`'deki (v126, daha SONRAKİ) Ritim özelliği o tokeni hâlâ kullanıyor. Yani
   **origin/main'in KENDİ, hiç merge edilmemiş hâlinde de bu üç `var(--accent-sand)` referansı
   tanımsız** (doğrulandı: `git show origin/main:public/styles.css` içinde `--accent-sand` sıfır
   kez geçiyor, `app.js`'te ise 3 kullanım var). Görünürde bozuk durmuyor çünkü `color` inherit
   edilen bir özellik — tanımsız değişken ebeveynin metin rengini miras alıyor, bu da bu dark temada
   tesadüfen okunaklı bir renk. Merge bunu DEĞİŞTİRMEDİ, sadece taşıdı.
3. **Faz 6'da silinen ölü class'lar (`.sekme-grubu`, `.cins-btn`, `.yay-btn`, `.ok-rozet`,
   `.tree-cat-btn`)**: origin'in getirdiği hiçbir dosyada (app.html, app.js, milo dosyaları) bu
   class'lar element'e ATANMIŞ olarak kullanılmıyor — sıfır isabet. Tek isim çakışması `.ok-rozet`
   — ama bu `public/izle.html`'de (canlı-izleme sayfası, `styles.css`'i hiç yüklemiyor) TAMAMEN
   BAĞIMSIZ, kendi `<style>` bloğunda tanımlı bir class, bizim sildiğimizle hiçbir ilgisi yok.
4. **`!important` sayısı**: merge sonrası styles.css'te **55** (bizim 44 + origin'in `.ai-config-dock`/
   `.ai-pill-*`/`.cadence-*` gibi yeni eklentilerinin bir kısmı `!important` kullanıyor). Bizim 44'ten
   yüksek ama origin'in kendi 70'inden düşük — beklenen bir ara değer, alarm verici değil.
5. **Tam regresyon** (giriş→PIN→15 sekme→Skor seri girişi+otomatik kayıt): hepsi başarılı, yatay
   taşma yok. Konsol hata TÜRÜ sadece 4 farklı mesaj (toplam ~5550 satır, çoğu tek bir tekrarlayan
   mesajdan): `ERR_INSUFFICIENT_RESOURCES`/"Failed to fetch" (zaten teşhis edilmiş `fanOutMasterPayload`
   arka plan gürültüsü, bkz. §9 — merge'den TAMAMEN bağımsız), `vaInit()`'in `addEventListener`
   hatası (madde 2'deki gibi origin'in KENDİ önceden var olan hatası — `app.html`'de `#va-dropzone`
   diye bir ID YOK, sadece `class="va-dropzone"` var; `vaInit()` bunu `getElementById` ile arıyor,
   `null` dönüyor, `try/catch` YOK, throw ediyor), ve MediaPipe `camera_utils.js`'in jsdelivr'den
   404 vermesi (yine origin'in kendi CDN referansı, merge'den bağımsız — bu ortamda internet erişimi
   olsa bile pinlenen versiyon yolu 404 veriyor).
   - **Merge-spesifik, yeni bir etkileşim bulundu**: `vaInit()`'in bu throw'u, bizim Faz 3'te
     `sekmeAc()`'in SONUNA eklediğimiz `dahaPanelKapat()` çağrısının hiç ÇALIŞMAMASINA yol açıyor —
     çünkü `if(sekmeAd === 'video') { vaInit(); }` satırı (origin'de de AYNI, try/catch'siz) hatayı
     fırlatınca fonksiyonun geri kalanı (bizim FAZ 3 bloğumuz dahil) atlanıyor. Origin'in kendi
     sürümünde bu fonksiyon `refleks` satırından hemen sonra bitiyor, ONLARDA bu sonradan-eklenen
     temizlik adımı hiç yok — yani bu SEMPTOM (Video sekmesi "Daha" panelinden açılınca panelin
     kapanmaması) sadece bizim navigasyon mimarimizle origin'in önceden var olan hatası birleşince
     ORTAYA ÇIKIYOR. Kod DEĞİŞTİRİLMEDİ — muhtemel düzeltme, origin'in `vaInit();` çağrısını (o
     satırdaki TEK korumasız çağrı, fonksiyondaki her diğer dal `try/catch` içinde) bir `try/catch`'e
     almak, ama bu bilerek yapılmadı.

**main'e almadan önce dikkat**: kökteki `deploy_output.txt` (muhtemelen kazayla commit'lenmiş bir
deploy komut çıktısı) ve kökteki `dagsk-ai-pose.js` (public/ İÇİNDEKİ aynı adlı, canlı dosyadan AYRI
— `public/dagsk-ai-pose.js` zaten route ediliyor, kök kopyasının hiçbir yerden yüklenmediği
doğrulanmadı) kullanıcının isteğiyle bu turda ELLENMEDİ, sadece bu not düşüldü. main'e alınmadan
önce ele alınıp alınmayacağına karar verilmeli.

### Üç düzeltme (main'e almadan önce, kullanıcı onayıyla)

**1) `vaInit()` throw'u — hem kök neden hem savunma, ikisi de yapıldı**:
- **Kök neden** (`public/app.html`): `<div class="va-dropzone" ...>` elementine `id="va-dropzone"`
  eklendi (class kaldı, CSS ona bağlı). Bu, `vaInit()`'in `getElementById('va-dropzone')` ile aradığı
  elementin GERÇEKTEN bulunmasını sağlıyor — sürükle-bırak video yükleme özelliği önceden TAMAMEN
  çalışmıyordu (event listener'lar hiç bağlanamıyordu), şimdi çalışıyor.
- **İkinci, ayrı bir kök neden daha bulundu**: `vaInit()` içinde `document.getElementById('va-api-key')`
  de vardı — bu id'li/class'lı hiçbir element `app.html`'de YOK (muhtemelen origin'in eski bir API-key
  giriş arayüzünden kalma ölü referans). `localStorage`'da eski bir cihazdan kalma anahtar varsa
  (`k` truthy) bu satır da aynı şekilde throw ederdi. `if (k && keyInput)` ile korumaya alındı —
  yeni bir UI eklenmedi, sadece var olmayan elemente yazma girişimi güvenli hale getirildi.
- **Savunma** (`sekmeAc()`, app.js): `if(sekmeAd === 'video') { vaInit(); }` → `{ try { vaInit(); }
  catch(e) {} }`. Gerekçe: bu fonksiyondaki `video` DIŞINDAKİ HER dal zaten `try/catch` içinde
  (`sporcuGelisimDoldur`, `dersIcerikleriTabDoldur`, `teknikCalismaDoldur`, `rfxPaneliDoldur`, ...) —
  `vaInit()` bu fonksiyonun kendi kuralına uymayan TEK istisnaydı. Kök neden düzeltmesi bilinen iki
  hatayı gideriyor ama `vaInit()`'in İÇİNDE gelecekte çıkabilecek başka bir hata yine bizim Faz 3
  `dahaPanelKapat()` temizliğini engelleyebilirdi — bu yüzden HEM kök nedeni düzelttim HEM bu
  fonksiyonun kendi kuralına uydurdum, sadece biri değil.
- **Doğrulama**: gerçek `.click()` ile (workaround YOK) "Daha" panelinden Video sekmesi açıldı,
  panel doğru kapandı, `PAGEERROR` tamamen kayboldu.

**2) `--accent-sand` tanımlandı** (`public/styles.css`, `:root`): `#a89a8c` — `--text-muted`
(`#9a9aa3`) ile AYNI parlaklıkta (kontrast bg-main üzerinde 7.22:1 vs 7.09:1), sadece sıcak/kum
tonuna kaydırılmış. Yeni bir marka rengi DEĞİL, `--text-muted`'ın sıcak kardeşi olarak eklendi —
origin'in orijinal değeri (`#e8d7c5`, çok daha parlak/canlı) kasıtlı olarak kullanılmadı, o kendi
başına bir aksan rengi gibi duruyordu. Gerçek renderlanan değer doğrulandı (`rgb(168,154,140)`),
Ritim & Tıkır ekranında ekran görüntüsüyle kontrol edildi — okunaklı, dikkat çekmeden ayırt edici.

**3) jsdelivr `camera_utils.js` 404 — incelendi, ETKİLEMİYOR, dokunulmadı**: `dagsk-ai-pose.js`
kamera erişimi için düz `navigator.mediaDevices.getUserMedia()` kullanıyor, MediaPipe'ın `Camera`
sınıfını (camera_utils.js'in sağladığı) HİÇBİR yerde çağırmıyor (`grep` ile doğrulandı). Asıl AI
motoru `window.Pose` (ayrı paket, `pose.js`) üzerinden çalışıyor — bu URL gerçekten 200 dönüyor ve
sayfa yüklendiğinde `window.Pose` gerçekten tanımlı oluyor (Playwright ile doğrulandı). `camera_utils.js`
SADECE `ensureMediaPipeLoaded()`'ın bir YEDEK dalında (`window.Pose` zaten yoksa devreye giren
dinamik script-yükleme) kullanılıyor — normal koşulda bu dal hiç çalışmıyor. **Sonuç: şu an hiçbir
etkisi yok, ama kırılgan bir gizli bağımlılık** — `pose.js`'in statik yüklemesi HERHANGİ bir nedenle
(ağ sorunu, reklam engelleyici, yarış durumu) başarısız olursa yedek dal devreye girer ve orada da
`camera_utils.js` 404 vereceği için AI motoru tamamen başlatılamaz hale gelir. Kullanıcının talimatı
gereği ("etkilenmiyorsa not düş ve geç") CDN adresi DEĞİŞTİRİLMEDİ — origin'in kodu, şu an gerçek bir
etkisi olmayan bir şeyi düzeltmek kapsam dışı bırakıldı.

**Son regresyon** (üç düzeltmeden sonra, `merge-origin` dalında, gerçek `.click()` ile — hiçbir
workaround kullanılmadan): giriş→PIN→15 sekme (Video dahil, "Daha" panelinden gerçek tıklamayla)→
Skor seri girişi+otomatik kayıt, hepsi başarılı. Konsol hata türü **4'ten 3'e düştü** — `vaInit()`
`PAGEERROR`'ı tamamen kayboldu. Kalan 3 tür: `fanOutMasterPayload` arka plan gürültüsü (ilgisiz,
bkz. §9) ve `camera_utils.js`'in zararsız 404'ü (madde 3, bilerek dokunulmadı) — ikisi de zaten
teşhis edilmiş, yeni bir şey yok. Yatay taşma yok. `node --check` temiz.

**main'e ALINDI**: kullanıcı onayladı, `git checkout main && git merge merge-origin` çalıştırıldı —
`main` `merge-origin` ile aynı noktada olduğu için (aradan hiç commit atılmamış) düz bir
fast-forward oldu, yeni bir merge-commit YARATILMADI. `main`'in şu anki HEAD'i `9841c1a`. Merge
sonrası `node --check public/app.js` ve `npx tsc --noEmit` main üzerinde de tekrar çalıştırıldı,
ikisi de temiz. Özet ve kalan iş kalemleri için §0'a bakılmalı — bu bölüm (§10) sadece merge
sürecinin arkeolojik/teknik detayını taşıyor.

## 11. Faz 7 — Karışık Sınıf yeniden tasarımı (tamamlandı)

**Bağlam**: Karışık Sınıf, Faz 0-6'nın hiç dokunmadığı tek büyük ekrandı — 12 alt aracı
(yoklama/skor/lider/klasman/canli/yarisma/veli/disiplin/pozitif/oyunlar/reaksiyon/ritim) tek sırada
yatay bir sekme şeridinde diziyordu. Kullanıcı harici bir prompt dosyasıyla (`karisik-sinif-
uygulama-promptu.md`) yeni bir düzen istedi: şerit kalkıp yerine bir "sınıf kartı" (o dersteki
sporcular + yoklama durumu) ve bir "araç ızgarası" (12 aracın hepsi kart olarak) geliyor. **Dispatch
mantığı (`kmSekme()`), 12 çizim fonksiyonunun içi, `KM_OYUN_CSS`, `DAGSK_CADENCE`, yoklama/puan/
disiplin/pozitif hesaplama ve D1 yazma yolları, konum/sporcu seçici modallerinin mantığı — HİÇBİRİNE
dokunulmadı.** Adım adım (plan → onay → uygula → ekran görüntüsü → dur) ilerlendi, kullanıcı her
adımı ayrı onayladı.

### Sınıf kartı ("Bugün salonda")

Yeni `#km-sinif-karti` (`.card`), yeni `kmSinifKartiCiz()` çiziyor. **Tek kaynak kuralı**: `_kmListe`
ve `otomatikYoklamaDB[bugunISO()]` HER ÇAĞRIDA taze okunuyor, kendi kopyası tutulmuyor. Sporcular
`.chip`/`.chip-success` (Faz 2) + baş-harf dairesi olarak gösteriliyor; tıklanınca **aynen mevcut**
`kmYoklamaToggle(grup, ad)` çağrılıyor, yeni bir yazma mantığı yok. Üstte ince bir satırda: konum
adı, gün+saat, geçen süre, sporcu sayısı.

- **Kendi bulduğum bir hata**: `.chip-success` metni de yeşile boyuyordu — spec "yeşil daire, NORMAL
  metin rengi" istiyordu. İlk ekran görüntüsünde fark edilip düzeltildi: daire yeşil kalıyor, isim
  `--text-primary` (işaretsizde `--text-secondary`).
- **"Geçen süre" için veri yoktu** — `kmBaslat()`'ta ders başlangıcı hiç kaydedilmiyordu. Kullanıcı
  onayıyla yeni, SADECE yerel bir `_kmBaslangicZamani` değişkeni eklendi (D1'e/localStorage'a
  YAZILMIYOR, sayfa yenilenince sıfırlanması kasıtlı). Kullanıcı "kmBaslat()'a ekle" dedi ama
  platforma girişin ÜÇ farklı yolu olduğu (yeni ders/`kmBaslat`, yerelden devam/`kmAcYerel`,
  sunucudan devam/`kmKonumaGir`'in fetch callback'i) fark edilince, üçünün ORTAK birleşim noktası
  olan `kmPlatformGoster()`'a kondu — bu sapma kullanıcıya açıkça bildirildi, itiraz gelmedi.
  Gösterim "42 dk" formatında, dakikada bir (`setInterval(...,60000)`) güncelleniyor, saniye YOK.

### Araç ızgarası (12 kart)

Yeni `#km-arac-izgara`, yeni `kmAracIzgaraCiz()` çiziyor. `.km-arac-izgara` grid CSS'i (`styles.css`)
sadece YERLEŞİM — telefonda 2, ≥600px'te 4 sütun (`@media (min-width:600px)`), yeni bir renk
tanımlamıyor. Skor Gir 2 sütun kaplıyor, `var(--accent)` dolgulu, `var(--text-on-accent-dark)`
metinli (promptun istediği `--accent-ink` bu kod tabanında hiç yoktu — Faz 6 sonrası kontrast
turunda kurulan gerçek token bu, kullanıcı "kodda ne varsa onu kullan" dedi). İkonlar: 4 tanesi
mevcut ana navdan birebir aynı path'lerle (Skor, Liderlik, Canlı, Reaksiyon), 8 tanesi aynı kurala
göre (viewBox 24, stroke-width 1.7, round cap/join, fill yok) yeni çizildi. İkon kutusu rengi
grubu anlatıyor — `--status-success` (Yoklama, Pozitif), `--status-warning` (Lider, Klasman,
Reaksiyon), `--status-info` (Ritim, Oyunlar, Veli, Canlı, Yarışma), `--status-danger` (Disiplin) —
dördü de MEVCUT semantik tokenlar, yeni renk yok.

**Durum satırları — kısmen canlı, kısmen sabit, kullanıcı onayladı**: Yoklama ("N/M işaretlendi",
`otomatikYoklamaDB`'den), Liderlik ("X önde", `turnuvaDB[..].toplamSkor`'dan — `kmLiderCiz()`'in
AYNEN okuduğu alan, hesaplama tekrarlanmadı) ve Skor Gir ("N sporcu hazır", `_kmListe.length`) canlı
veri. Kalan 9 tanesi (Klasman, Herkes, Yarışma, Veli, Disiplin, Pozitif, Oyunlar, Reaksiyon, Ritim)
sabit, açıklayıcı metin — o araçların kendi hesaplama mantığına dokunmadan güvenle tek satıra
indirilemedi, tahmin edilmedi. Kullanıcı bunun böyle KALMASINI istedi, canlıya bağlanmaya çalışılmadı.

### Geri dönüş yolu ve eski şeridin kaldırılması

Eski 12 butonluk `.adm-nav-row` **tamamen silindi**. Yeni `kmAracSec(id)` (ızgara+kartı gizler,
`#km-icerik`+geri barını gösterir, **aynen** `kmSekme(id)` çağırır) ve `kmIzgaraGeriDon()` (tersi,
`kmGeri()` DEĞİL — o tüm platformu kapatır) eklendi. `kmPlatformGoster()` her çağrıldığında görünür
başlangıç durumunu ızgaraya sıfırlıyor (`kmSekme('skor')` yine de arka planda çalışıyor —
`_kmAktifSekme` ve `#km-icerik`'in içeriği doğru/güncel kalsın diye, sadece görünmüyor).

- **Kritik, kullanıcının özellikle sorduğu bir bug potansiyeli bulundu ve düzeltildi**: `kmSekme(s)`
  normalde Reaksiyon'dan çıkarken `kmRfxTemizle()`, Ritim'den çıkarken `DAGSK_CADENCE.stopCadence()`
  çağırıyor — ama SADECE `kmSekme()` başka bir `s` ile tekrar çağrıldığında. `kmIzgaraGeriDon()`
  `kmSekme()`'yi HİÇ çağırmıyor (sadece görünürlük değiştiriyor), yani bu iki temizlik hiç
  tetiklenmeyip metronom/zamanlayıcı arka planda sessizce çalışmaya devam ederdi. Düzeltme:
  `kmIzgaraGeriDon()` `_kmAktifSekme`'ye bakıp AYNI iki temizliği kendisi de yapıyor, sonra
  `_kmAktifSekme = null` ile sıfırlıyor. Gerçek casus-fonksiyon testiyle doğrulandı (`DAGSK_CADENCE.
  stopCadence`/`kmRfxTemizle` sarmalanıp çağrılıp çağrılmadığı ölçüldü) — ikisi de **true**.

### Tam regresyon (gerçek `.click()`, hiçbir workaround yok)

Giriş → PIN → **`#km-giris-btn`** ("ya da → Karışık Sınıf", `#tab-takimlar` DEĞİL — o ayrı bir özellik,
Yarışmalar/turnuva ağacı ekranı, ilk denemede yanlışlıkla karıştırıldı, düzeltildi) → konum seç →
sporcu seç → "Dersi Başlat" → **ızgara** (doğrulandı: ızgara görünür, içerik gizli) → **12 aracın
HEPSİ** tek tek gerçek tıklamayla açıldı VE "← Karışık Sınıf" ile geri dönüldü (12/12 başarılı) →
Oyunlar ("Zirve Yolu" — kendi `KM_OYUN_CSS` aurora temasıyla tam render, sporcu seçici/sıralama
paneli sağlam) ve Reaksiyon (14 mini-oyun kartı, "Kim oynuyor?" seçici) **kendi izole sistemleriyle
sorunsuz açıldı** → Ritim'den çıkışta `stopCadence` çağrıldı (yukarıya bkz.) → sınıf kartından
gerçek tıklamayla yoklama işaretlendi, `.chip` → `.chip.chip-success` değişimi doğrulandı (kart
kendini tazeledi) → Skor Gir'e girilip gerçek bir sporcu kartına tıklanıp 3 ok (X, 10, 9) gerçek
tıklamayla girildi, "Seri Kaydedildi! (+29)" ile otomatik kaydedildi, ekran görüntüsüyle doğrulandı.
Yatay taşma yok (360/768/1280 üçünde de, adım 2-3'te ayrıca test edilmişti).

**Konsol hatası**: toplamda birkaç bin satır ama **5 farklı tür**, hepsi ÖNCEDEN teşhis edilmiş,
Faz 7'yle ilgisiz: `fanOutMasterPayload` arka plan gürültüsü (`ERR_INSUFFICIENT_RESOURCES`, "Failed
to fetch" tarzı — bkz. §9, bu turda 409 Conflict olarak da göründü, aynı kök neden, sadece D1'in o
anki durumuna göre farklı HTTP kodu), konum/liste fetch'lerinin sentetik test verisiyle ürettiği
`ERR_INVALID_URL` (daha önce de görülmüştü), ve zararsız `camera_utils.js` 404/MIME hatası (bkz.
§10 madde 3). Hiçbiri Faz 7'nin yeni kodundan kaynaklanmıyor.

### Bilerek yapılmayan/ertelenen

- **Gereksiz render optimizasyonu** (kullanıcı notu, adım 2'de verildi): `kmYoklamaToggle()` kendi
  işi bitince `kmYoklamaCiz()`'i çağırıp `#km-icerik`'i yeniden çiziyor — sınıf kartından tıklanınca
  bu render `#km-icerik` GÖRÜNMÜYORKEN (ızgara açıkken) boşuna oluyor. Aynı kategori: yeni eklenen
  60 saniyelik interval de platform kapalıyken/ızgaradayken `kmSinifKartiCiz`/`kmAracIzgaraCiz`'i
  gereksiz yere tetikliyor (görünmeyen elementleri boşuna yeniden çiziyor). İkisi de zararsız ama
  optimize edilebilir — **şimdi dokunulmadı**, ileride ele alınabilir.
- **9 aracın durum satırı canlı veriye bağlanmadı** — kullanıcı açıkça "öyle kalsın" dedi (yukarıya bkz).
- `kmGeri()` (platformu tamamen kapatan buton) Reaksiyon'dan çıkarken `kmRfxTemizle()` çağırmıyor —
  bu Faz 7'den ÖNCE de böyleydi, bu turda dokunulmadı (kullanıcı sadece "geri dönüş yolu" — yani
  `kmIzgaraGeriDon()` — için bu kontrolü istedi, `kmGeri()` ayrı ve dokunulmayacaklar listesindeki
  platform kapatma mantığının bir parçası).

## 12. Oyunlar bölümü incelemesi + 3 düzeltme (tamamlandı)

**Bağlam**: Faz 7 sonrası kullanıcı "Oyunlar" bölümünü (11 tema, `KM_OYUN_TEMALAR`/`KM_OYUN_CSS`)
salt inceleme istedi — kaç oyun var, ne yapıyorlar, konsol hatası/yarım kalmış oyun var mı, 360px'te
bozulan var mı, `KM_OYUN_CSS`'in kapsamı ne (Reaksiyon'un 14 mini-oyununu da beslediği bulundu),
oyunların ortak bir yapısı mı var yoksa her biri kendi başına mı. Rapor onaylandıktan sonra üç somut
bulgu sırayla düzeltildi — **her düzeltmeden sonra Reaksiyon ayrıca açılıp kontrol edildi** (kullanıcı
talimatı, KM_OYUN_CSS'in paylaşılan olması yüzünden).

### Düzeltme 1 — Tema şeridi → oyun seçici ızgara

Eski yatay `.km-oyun-modes` şeridi (360px'te 9/11 sekmeyi kaydırma-ipucusuz gizliyordu) tamamen
kaldırıldı. Yerine: üst satırda oyun adı + "🔀 Değiştir" düğmesi; basınca `#km-oyun-secici`
(`.km-arac-izgara`/`.card`, Faz 2/7'den — yeni stil yazılmadı) 11 oyunun tamamını (Futbol/Takım
Futbolu dahil) kart olarak açıyor. Kart seçilince ızgara kapanıp mevcut `kmOyunTemaSec(tid)` AYNEN
çağrılıyor (`kmOyunKartSec` sarmalayıcısı üzerinden) — dispatch mantığına dokunulmadı.

**Bu adımda kendiliğinden bulunup düzeltilen 2 yan etki**:
- "Değiştir" düğmesi başlığın yanına eklenince 360px'te sağdaki 4 ikon butonu (ses/dramatik/zar/
  Tam Ekran) sıkışıp sonuncusu kırpılıyordu — `.km-oyun-topbar`'a `flex-wrap:wrap` eklendi.
- Izgara ilk açıldığında kartlar tek sütuna yığılıyordu — sebep `.km-arac-izgara`'nın `1fr`
  sütunlarının, oyun açıklamalarındaki `white-space:nowrap` metnin İÇERİK genişliğine göre
  şişmesiydi (312px konteynerde 890px/792px sütun hesaplanmıştı, gerçek ölçümle bulundu).
  `repeat(2, minmax(0,1fr))`/`repeat(4, minmax(0,1fr))` ile düzeltildi — bu, Faz 7'nin ORİJİNAL
  araç ızgarasını da aynı riske karşı sağlamlaştırıyor (bonus, aynı class kullanılıyor).

Eski `.km-oyun-modes`/`.km-oyun-mode-btn` CSS kuralları (3 medya sorgusu dahil, ~10 satır) ve
`kmOyunTemaSec`/`kmOyunIlerlet` içindeki 3 `querySelectorAll('.km-oyun-mode-btn')` çağrısı artık
hiçbir elementi bulamıyor — zararsız (boş NodeList üzerinde no-op), silinmedi, **düşük öncelikli
ölü kod olarak not düşülüyor** (Faz 6'nın "sil ama önce raporla" disiplinine göre, bu turda
kapsam dışı bırakıldı).

### Düzeltme 2 — Hedef Tahtası kontrastı

Kök neden bulundu: diğer 10 temanın hepsinin `#km-oyun-wrap[data-tema="X"]{ --bg:...; --panel:...;
--ink:...; --a1..--a5:...; }` bloğu varken, **Hedef Tahtası'nın (2026-09-06'da eklenmiş) böyle bir
bloğu HİÇ YOKTU**. `--bg`/`--ink` vb. tanımsız kalınca `.km-oyun-tam-btn` gibi bu değişkenlere bağlı
her şeyin arka planı/rengi geçersiz değere düşüp neredeyse görünmez oluyordu. Eksik blok eklendi —
renkler `KM_OYUN_TEMALAR.hedef.renkler` (oyunun kendi hedef halkası renkleri) ile aynı, yapı diğer
10 blokla birebir aynı (aynı 11 CSS değişkeni, mevcut fontlardan bir çift — Exo 2/Rajdhani, yeni
font eklenmedi). Sadece bu temaya özel, başka hiçbir yere sızmıyor. Gerçek renderlanan renklerle
doğrulandı (`--bg:#120c08`, buton arka planı artık `rgb(42,29,19)`, metin `rgb(255,248,240)`).

### Düzeltme 3 — Dokunma hedefleri (sporcu seçme daireleri)

`.km-oyun-chip-av` (asıl "sporcuyu seç" dairesi, eskiden 26px sabit) artık `min-width:44px;
min-height:44px;` — WCAG 2.5.5 tabanı. Aynı satırdaki ikincil ikonlar (`.km-oyun-chip-alkis` "👏
alkışla", `.km-oyun-chip-sev` "seviye değiştir") de aynı tabana çıkarıldı, ÇÜNKÜ ilk denemede bunlar
zaten kendi audit'imde `<30px` olarak ölçülmüştü.

**"Viewport'a göre daralan mantığı koru" nasıl uygulandı**: üçü aynı anda 44px'te bir satıra
sığmaz — bu yüzden rayın zaten var olan İKİ "dar/ikon modu" (360px'te otomatik zorlanan +
▶/◀ ile manuel açılan "küçük mod") artık alkış/seviye ikonlarını da gizliyor (isim/durum metniyle
AYNI gizleme listesine eklendi), sadece 44px avatar dairesi kalıyor. Rayın kendi genişliği
(`--km-rail-w`/`--km-rail-w-kucuk`) bu 44px daireye + dolgusuna tam oturacak şekilde büyütüldü
(360px'te dar mod: 50px→64px; manuel küçük mod: 56px→70px — fullscreen'in kendi küçük-mod değeri
zaten 70px'ti, dokunulmadı). Geniş/masaüstü modda üçü de (avatar+alkış+seviye) görünür kalıyor,
her biri kendi 44px tabanında.

**Doğrulama**: gerçek testte 360px'te 8 sporculu bir listede avatar `44×44px` ölçüldü, yatay taşma
YOK (sayfa da rayın kendisi de) — ray zaten var olan `overflow-y:auto` sayesinde gerekirse dikey
kaydırıyor (bu turda 8 sporcu rayın mevcut yüksekliğine sığdı, kaydırmaya gerek kalmadı ama mekanizma
zaten hazır ve dokunulmadı). 768px'te manuel "küçük mod" da ayrıca test edildi, aynı sonuç. 11
oyunun tamamı tek tek yeniden tarandı: `<30px` dokunma hedefi sayısı oyun başına 7-26'dan 1-10'a
düştü — kalanlar (`.km-oyun-tam-btn` üst araç çubuğu, Bireysel/Takım anahtarı, `.km-oyun-geri-al-btn`
sıfırla ikonu) bu turun kapsamı DIŞINDAydı ("sporcu seçme daireleri" değiller), dokunulmadı.

**Genel sonuç**: 3 düzeltme sonrası 11 oyunun hepsi + Reaksiyon'un 14 mini-oyunu tek tek yeniden
açıldı — sıfır yeni konsol hatası (gözlenen tüm hatalar zaten teşhis edilmiş `fanOutMasterPayload`/
konum-fetch sentetik veri/zararsız `camera_utils.js` 404 kümesinden), sıfır yatay taşma. `node --check`
temiz.

## 13. Faz 8 — Oyunlar "yarış deneyimi" (8a tamamlandı + 3 ek iş, HENÜZ COMMIT EDİLMEDİ)

**Genel bağlam ve kural**: §12'nin 3 düzeltmesinden sonra kullanıcı, 9 frac-tabanlı oyunun (Bireysel
Futbol/Takım Futbolu hariç — ayrı mekanik) **ortak kabuğuna** bir dizi iyileştirme istedi — kural
baştan nettti: **"Bu iyileştirmeler tek tek oyunlara yazılmayacak, hepsi ortak kabuğa bir kez
yazılacak, 9 oyunda birden çalışacak."** Dokunmayacaklar listesi her aşamada aynı kaldı: puan
hesaplama/frac ilerleme/seri toplama, takım kurma/sporcu seçme/sıra yönetimi mantığı, `KM_OYUN_CSS`
içindeki `.km-rfx-*` sınıfları (Reaksiyon'un 14 mini-oyunu), 11 oyunun sahne çizim fonksiyonlarının
İÇİ (sadece kabuk değişti), D1 yazma yolları. **Ciddi Yarışma Modu** (`ciddiModAcik`, var olan
değişken, YENİ ayar eklenmedi) açıkken bu fazda eklenen HER animasyon/vurgu/kutlama sessiz/anında
çalışıyor. Her aşama sonunda: Reaksiyon'un 14 mini-oyunu + 11 oyunun hepsi tek tek açılıp konsol
hatası/yatay taşma (360/1280/1920px) + Tam Ekran kontrolü yapıldı — hiçbirinde bulunan bir konu YOK
(hepsi bu bölümde ayrıca not düşülüyor).

**⚠️ DURUM**: Bu bölümdeki TÜM işler kod olarak tamamlandı ve test edildi ama **commit edilmedi** —
`public/app.js` çalışma alanında değişiklik olarak duruyor (`git status` ile doğrulanabilir). Yeni bir
oturum bu dosyayı devralırsa önce `git diff public/app.js` ile neyin henüz commit'lenmediğini görmeli.

### 13a. Kabuk: yarışı görünür kıl (8a)

Amaç: koç sadece sırası gelen sporcuyu değil, tüm sınıfın/takımların yolda nerede olduğunu görsün.

- **Takım tek-disk gösterimi** — Çoklu Takım (Yarış) açıkken bir takımın 4-5 üyesi aynı paylaşılan
  frac'a eşitlenince sahnede tam üst üste biniyordu. Kullanıcıya **iki seçenek** (a: tek disk + takım
  adı/sayısı, b: kademeli küçülen küme) canlı ekran görüntüsüyle sunuldu, kullanıcı ikisini
  karşılaştırıp **(a)'yı seçti** — "5 kişilik takımda etiket yığılması kabul edilemez, (a) daha
  temiz" gerekçesiyle. Uygulama: `kmOyunTakimTemsilciUygula()` — her takımdan SADECE bir temsilci
  (mümkünse o an SIRADAKİ olan üye) görünür kalır, üzerindeki ad etiketi "🦅 Takım Adı ×N" olur,
  diğer üyelerin zaten var olan sahne elemanı (`s.zirveEl` vb.) gizlenir. Sahne fonksiyonlarının
  İÇİ hiç değişmedi — bu, onların dışa açtığı elemanlar üzerinde çalışan bir kabuk son-işlemi.
- **Gerçek bug bulundu ve düzeltildi**: `kmOyunSahneKurAktif()` SADECE o an ekranda görünen temayı
  yeniden kuruyordu — koç bir temada takım kurup başka temaya geçince, o tema HÂLÂ takım-öncesi
  bireysel renklerle kalıyordu (gerçek testte yakalandı: Pist'te takım renkleri hiç uygulanmamış
  görünüyordu). Yeni `kmOyunSahneKurHepsi()` — `kmOyunlarCiz()`'in ilk kurulumdaki AYNI 11 çağrıyı
  tekrar kullanıyor, `kmOyunCokluDegistir()`/`kmOyunTakimEditorKaydet()` artık BUNU çağırıyor.
- **Kontrol noktası rayı** (`.km-oyun-cp-rail`, `kmOyunCpRailCiz()`) — sahnenin üstünde, Yarış modunda
  her takım için ayrı bir ilerleme çubuğu + checkpoint tik işaretleri. `kmOyunLiderCiz()`'in başında
  çağrılıyor, aynı zamanlamada güncel kalıyor.
- **Fark rozeti** (`.km-oyun-fark-rozet`, `kmOyunTakimYarisCiz()` içinde) — "Yarış Sıralaması"
  panelinde her takımın lidere göre farkı, **gerçek puan** biriminde ("+38p önde" / "38p geride") —
  frac/checkpoint birimi değil, takım üyelerinin `toplamSkor` toplamı.
- **Genişletilmiş sıra kartı** (`kmOyunSiradaGuncelle()` genişletildi) — "SIRADA" kartı artık
  sadece o anki değil, ondan sonraki 2 sporcuyu da küçük avatarlarla gösteriyor.
- **Sıradaki figür vurgusu** (`kmOyunSiradakiVurguUygula()`, `.km-oyun-siradaki-vurgu[-canli]`) —
  aktif sporcunun diskine/aracına/tahtasına parıltılı bir halka. Ciddi moddayken `-canli` (nabız
  animasyonu) class'ı hiç eklenmiyor — durağan halka kalıyor, "kimin sırası" bilgisi kaybolmuyor ama
  kutlama hissi yok.
- **Kamera dispatcher'ın temeli** — `KM_OYUN_KAMERA_NOKTA_TEMALAR`/`KM_OYUN_KAMERA_SVG_ID` (7 SVG
  teması, AYNI 1200×440 viewBox), `kmOyunKameraGuncelle()`, `kmOyunKameraHedefeGit()` (rAF tabanlı
  yumuşak viewBox tween'i). Kullanıcının istediği gibi 9 temanın nokta fonksiyonu TEK TEK doğrulandı:
  5'i `nokta(frac)=>{x,y}` (Zirve/Hazine/Ninja/Monopoly/Dağ), 2'si `poz(i,n,frac)=>{x,y,heading}`
  (Yıldız/Balon — roster indeksi/toplam sayı da gerekiyor, çakışmayı önleyen yörünge/yayılma mantığı
  için), Pist'in kendi ayrı DOM/left:% düzeni var (kamera kavramı farklı — bkz. §13d), Hedef
  Tahtası'nda mekansal konum kavramı hiç yok. Pist için ayrı `kmOyunPistKameraGuncelle()` (scale+
  translateX ile şeritleri yakınlaştırma) — bu aşamada her zaman "yakın" kalıyordu (koreografi §13d'ye
  kadar yoktu).
- **`kmOyunKabukGuncelle()`** — bu fazın TEK giriş noktası: temsilci disk, sıradaki vurgusu, kamera
  (SVG + Pist) hep BİRLİKTE, aynı zamanlamada güncellensin diye buradan çağrılıyor. Sonraki alt
  fazların (§13d-13f) hepsi bu fonksiyona yeni adımlar ekleyerek büyüdü.

Doğrulama: takım/kamera aktifken 9 oyunun hepsinde ekran görüntüsü alındı, sıfır yeni konsol hatası.

### 13b. Tam Ekran çöküşü düzeltmesi

**Bulgu (kullanıcı "bir sorun var ama ne olduğu belirtilmedi" dedi, önce teşhis edildi)**: Tam Ekran
moduna girince sahne (SVG/Pist/Hedef, hepsi) **2px'e çöküyordu** — tamamen boş görünüyordu. 11 oyunun
hepsinde birebir aynı, çıkışta tamamen düzeliyordu (kalıcı değil).

**Kök neden**: `#km-oyun-wrap:fullscreen .km-oyun-scene{ flex:1; aspect-ratio:auto; }` kuralı sahnenin
büyümesini `flex:1`'e bağlıyordu ama sahnenin GERÇEK ebeveyni `#km-oyun-govde` hiç `display:flex`
değildi (varsayılan `block` — grep'le doğrulandı, HİÇ tanımı yoktu). Normal modda sorun görünmüyordu
çünkü sahnenin boyutu flex'ten değil kendi `aspect-ratio:2.3/1`'inden geliyordu; fullscreen kuralı TAM
o aspect-ratio'yu kapatıp yerine hiç işlemeyen `flex:1`'i koyuyordu.

**Düzeltme (iki adım — ilk deneme TEK BAŞINA yetmedi, gerçek testte yakalandı)**:
1. `#km-oyun-govde{ display:flex; flex-direction:column; min-height:0; }` — kullanıcının istediği
   seçenek (elle yükseklik hesabı yerine).
2. `#km-oyun-wrap:fullscreen #km-oyun-govde{ flex:1; min-height:0; }` — `#km-oyun-govde`'nin KENDİSİ
   de `#km-oyun-wrap`'in flex çocuğu, o büyümezse (varsayılan `flex:0 1 auto`) sahnenin `flex:1`'inin
   büyüyeceği boş alan hiç oluşmuyordu.

**Yan düzeltme**: `.km-oyun-tam-btn` metni hep "🖥️ Tam Ekran" diyordu, tıklayınca çıksa bile — artık
`document.fullscreenElement`'e göre "Tam Ekran" ↔ "Tam Ekrandan Çık" (`kmOyunTamEkranEtiketGuncelle()`,
`fullscreenchange`/`webkitfullscreenchange` dinleyicisi — Esc tuşuyla çıkışı da yakalıyor).

**Doğrulama**: 11 oyunun hepsinde fullscreen'e girip çıkıldı — sahne 700-800px'e genişliyor (öncesi
2px), çıkışta hepsi birebir aynı boyuta (1232×535.64 @1280px) dönüyor. Normal mod boyutu hiç
değişmedi (ilk denemede `#km-oyun-govde`'ye eklenen `gap:10px`'in gereksiz bir yan etki olduğu fark
edilip kaldırıldı — normal moddaki eleman aralığı öncekiyle bit-bit aynı kaldı, 0px).

### 13c. "401 fırtınası" teşhisi (SADECE teşhis, düzeltme YAPILMADI)

Kullanıcı Faz 8a sırasında rastlanan (ve zaten §9'da genel hatlarıyla bilinen) arka plan
gürültüsünü 7 somut soruyla teşhis ettirdi — **kod değişikliği istenmedi, sadece rapor**. Tam
teşhis raporu bu oturumun sohbet geçmişinde; özet ve §9'un düzeltilmesi için bkz. yukarıdaki
§9 "DÜZELTME" notu. Kısaca: `bulutaGonderKontrol()` (10sn'de bir) neredeyse HER sayfa açılışında bir
kez tetikleniyor (yerel `bulutVeriJSON()` ile sunucudan yeniden kurulan JSON asla bit-bit eşleşmiyor),
`fanOutMasterPayload()` ile TÜM kulübü (bu test ortamında 731 sporcu) tek seferde gönderiyor. PIN
girilmemiş (yetkisiz) bir oturumda bu ~700 istek TEK patlamada 401 alıyor ama giriş yapılmış bir
oturumda AYNI patlama sorunsuz 200 dönüyor — yani "401" kimlik doğrulamanın kendisinin bir hatası
değil, doğru çalıştığının kanıtı; asıl mesele PIN'siz cihazların o oturumda hiç yedeklenememesi ve
`fanOutMasterPayload`'ın per-job `.catch()`'i yüzünden bunun sessizce "başarılı" sanılması (bkz. §9
düzeltmesi). Bu, Faz 8'den TAMAMEN bağımsız, önceden var olan bir bulgu — dokunulmadı.

### 13d. Kamera koreografisi — otomatik geniş↔yakın döngüsü

**Değişen yön**: 8a'nın kamerası SÜREKLİ sıradaki sporcuya yakın duruyordu — kullanıcı bunun hem
"büyük görünme anı"nın değerini kaybettirdiğini hem koçun genel tabloyu (kim önde/geride, hedefe ne
kadar kaldı) hiç göremediğini, bu yüzden sıradaki DIŞINDAKİ çocukların oyundan koptuğunu belirtti.
Çözüm manuel bir düğme DEĞİL, otomatik bir döngü istendi — önceki turda planlanan (ama hiç
uygulanmayan) "Geniş Görünüm düğmesi" fikri kullanıcı tarafından resmen İPTAL edilip yerine bu
döngü kondu.

**Durum makinesi** (`_kmOyunKameraDurum`: `'genis'|'yakin'`, varsayılan `'genis'`):
1. **Varsayılan GENİŞ** — tam `0 0 1200 440` viewBox, tüm yol ve figürler görünür.
2. **Sıra birine gelince → YAKIN** — hem elle seçim (`kmOyunSporcuSec`) hem `bitirOrtak()`'ın
   otomatik ilerlemesinin 1.5sn SONRAKİ tetiklemesi (aşağıya bkz.) bu geçişi başlatıyor. 700ms yumuşak
   viewBox tween'i (`kmOyunKameraHedefeGit`, kübik ease-out).
3. **İlerlet'e basılınca ("hareket" adımı)** — `baslatAnimasyon()`'ın en başında kamera `yeniFrac`'a
   (henüz yazılmamış, HENÜZ olacak konuma) doğru kaymaya başlıyor — `kmOyunKameraGuncelle(hedefFrac)`
   yeni bir opsiyonel parametre aldı, figürün gerçek hareket animasyonuyla (protected, dokunulmadı)
   yaklaşık eş zamanlı.
4. **Hareket bitince (`bitirOrtak()`) → GENİŞ** — anında genişliyor, 1.5sn "genel tabloyu izle"
   molasından sonra (2)'ye dönüyor — döngü kendini tekrarlıyor.

**Kilit düğmesi** ("🔒 Geniş Görünümde Kal" / "🔓 Otomatik Kamera") — `_kmOyunKameraKilitli`,
localStorage'da (`dag_km_kamerakilit_<konum>`, D1'e YAZILMIYOR). Açıkken kamera koreografiyi tamamen
atlayıp hep geniş kalıyor. Sadece kameranın GERÇEKTEN çalıştığı 7 SVG temasında görünür — Pist/Hedef/
Futbol/Takım Futbolu'nda gizli (bu kavram onlarda yok).

**Pist ve Hedef döngü DIŞI bırakıldı** — kullanıcı bunları kendi mesajında "kamera olmayan iki tema"
diye gruplamıştı (Pist'in kendi yatay-kaydırma mekanizması var ama koreografi kapsamına alınmadı,
Hedef'te zaten hiç kamera yok). Bu, en muhafazakâr okuma: Pist'e ayrıca özel bir geniş/yakın mantığı
İCAT ETMEK yerine onun mevcut (her zaman "yakın") davranışı hiç değiştirilmedi.

**Ciddi Mod / `prefers-reduced-motion`** — `kmOyunKameraHedefeGit()` ikisini de okuyor (yeni ayar
EKLENMEDİ), açıksa 700ms'lik tween yerine viewBox ANINDA hedefe atlıyor — konum hesabı hâlâ doğru,
sadece animasyonsuz.

**Doğrulama**: `requestAnimationFrame` bazlı örnekleme ile tween'in GERÇEKTEN 1200→600 genişliğe
kübik-ease ile ~700ms'de yumuşak geçtiği (ciddi mod kapalıyken) ve ciddi mod açıkken ANINDA hedefe
atladığı sayısal olarak doğrulandı. Gerçek bir seri girilip İlerlet'e basılarak TÜM döngü uçtan uca
test edildi: +300ms (hareket sırasında) kamera "yakın" kalıp hedefe kayıyor, ~1500ms sonra
(`bitirOrtak`) "genis"e dönüyor, +1700ms sonra tekrar "yakin"e geçiyor — dört zaman noktasında da
JS durumu (`_kmOyunKameraDurum`) ve gerçek `viewBox` niteliği ölçülerek doğrulandı. Fullscreen
modunda da (§13b'nin düzelttiği büyümüş sahne alanında) kamera doğru viewBox üretiyor — viewBox
matematiği çözünürlükten bağımsız olduğu için ayrı bir hesap GEREKMEDİ.

### 13e. Etiket ve panel çakışmaları

Ekran görüntüsünde 3 somut sorun bulundu: sahnedeki isim etiketleri sağ paneldeki sıralama/sporcu
listesinin ÜSTÜNE biniyordu (okunmaz), sağ panel sahnenin üzerine binmiş durumdaydı (sahne alanı
onun ALTINA uzuyordu — ikisi aynı bölgeyi paylaşıyordu), yakın figürlerin etiketleri üst üste
gelebiliyordu.

**Sahne/panel ayrımı** — `.km-oyun-panel` (her temanın SVG/DOM kapsayıcısı) eskiden `inset:0` ile
sahnenin TAMAMINI kaplıyordu, sağ panel bunun ÜSTÜNE yarı saydam bir katman olarak biniyordu
(BİLEREK — skor dok'u için hâlâ geçerli bir tasarım, ona dokunulmadı). Artık
`right:var(--km-rail-w, 200px)` (küçük modda `--km-rail-w-kucuk`, `.km-oyun-scene:has(.km-oyun-
rightpanel-kucuk)` ile) — sahne İÇERİĞİ baştan panelin payı kadar dar çiziliyor, üst üste binme yok.
Kamera hesabı viewBox tabanlı olduğu için bu daralmış genişliğe otomatik uyuyor, AYRI bir hesap
gerekmedi.

**Beklenmedik, kapsamı genişleten bulgu**: `kmOyunJitter()` (paylaşılan, 8a'dan önce de var olan bir
fonksiyon) bir figürü kendi "temiz" noktasından ±160 dünya-birimine kadar kaydırabiliyor (çok sporcu
aynı yerde kümelenince ayırmak için, KASITLI bir tasarım). 8 sporculu bir sınıfta bu, path'in UÇ
noktalarına yakın sporcuları 1200 birimlik dünyanın DIŞINA (panelin/sahnenin ötesine) itebiliyordu.
Standart CSS `overflow:hidden` + `clip-path:inset(0)` BEKLENDİĞİ gibi bunu kesmedi — gerçek testte
(sağ panel gizlenip karakterin GERÇEKTEN sahne dışına taştığı doğrulandı) defalarca denendi, NEDENİ
tam çözülemedi. **Kesin çözüm**: sadece etiketi değil, karakterin KENDİSİNİ de (Resync'in zaten
yazdığı `translate(x,y)`'yi okuyup) güvenli dünya sınırına (`KM_OYUN_KARAKTER_SINIR_PAY=26` birim
kenar payıyla) kelepçelemek (`kmOyunKarakterSinirKisitla()`) — frac/ilerleme/sıra mantığına hiç
dokunmadan, SADECE görsel konum. Kapsamı "sadece etiket" yerine "etiket + karakter"e genişletmek
bilinçli bir karar oldu (en güvenli/en kapsayıcı çözüm), raporda belirtildi.

**Etiket kenar/çakışma düzeltmesi** (`kmOyunEtiketKenarDuzelt()`) — her etiketin dünya-x'i ARTIK
karakterin fn(o,idx,n) ile yeniden hesaplanan "temiz" noktasından DEĞİL (ilk sürümde bu farklı bir
kaynaktı, tutarsızlık yarattı — gerçek testte, kelepçelenmiş karakterin etiketi hâlâ dışarıda
hesaplanıyordu, düzeltildi), karakterin KENDİ gerçek transform'undan (jitter+kelepçe UYGULANMIŞ nihai
konum) okunuyor. (a) Kenara yakınsa (`KM_OYUN_ETIKET_KENAR_PAY=70` birim) içeri kayıyor. (b) Yatayda
birbirine yakın (`KM_OYUN_ETIKET_YAKINLIK_ESIK=60` birim) etiketler basit 3 kademeli dikey kaydırmayla
ayrılıyor (karmaşık bir yerleşim algoritması DEĞİL — sıralayıp sırayla kademe atayan basit bir geçiş).

**Yan düzeltme**: Zirve/Ninja/Dağ'ın `preserveAspectRatio`si "slice"tan "meet"e çevrildi — daralan
sahne kutusunda "slice" kenarlardan kırpma yapacağı (bir kısım sporcuyu tamamen görünmez kılacağı)
için, "meet" (letterbox, hiçbir şey kaybetmeden sığdırma) Task 1'in "herkes görünsün" hedefiyle daha
tutarlı bulundu.

**Doğrulama**: 7-8 sporculu (bazıları path'in uçlarına, bazıları birbirine yakın frac'larla) dolu bir
sahne 1280px VE 1920px'te ekran görüntüsüyle doğrulandı — sağ panel gizlenip TEKRAR gösterilerek
karakterlerin gerçekten sahne sınırında kaldığı, sidebar'a hiç taşmadığı iki kez teyit edildi.

### 13f. Skor girme paneli — esnek ve animasyonlu

Panel eskiden sabit, sahnenin ALT KISMINDA tam genişlik bir şerit olarak büyük yer kaplıyordu.

**Küçült/aç** — panel artık tek satıra inebiliyor: "🎯 Skor Gir N/M" özet satırı (`#km-oyun-dok-ozet-
btn`, `kmOyunSlotlariCiz()` her ok girişinde/silinişinde `N/M`'yi güncelliyor). Tıklanınca tam haliyle
açılıyor. Açılış/kapanış `.km-oyun-dok-icerik`'in `max-height`+`opacity` geçişiyle yumuşak (klasik CSS
accordion — gerçek `auto` yükseklik animasyonu güvenilir değil). Kapalıyken sahne bütün alanı
kullanıyor, kamera (viewBox tabanlı olduğu için) otomatik uyuyor.

**Konum** — 3 seçenek: sol alt / alt orta (varsayılan) / sağ alt (`_kmOyunDokKonum`,
`.km-oyun-dok-konum-sol/-sag`). Serbest sürükleme YOK (kullanıcının açık isteğiyle). Panel artık tam
genişlik değil, içeriğine göre daralan (`width:fit-content; max-width:min(94%,480px)`) kompakt bir
kutu — "orta"da `left:0;right:var(--km-rail-w);margin:0 auto` ile ortalanmış, köşelerde kendi
kenarına yaslanmış. Sağ panelin payını (§13e'nin AYNI kuralı) hep hesaba katıyor.

**Boyut** — küçük/normal (`_kmOyunDokBoyut`). Eski "🔍 Büyüt/🔎 Küçült" (54px, TV-uzaklığı) tek düğmesi
KALDIRILDI, yerini bu ikili sisteme bıraktı — **bilinçli davranış değişikliği**: gerçek Tam Ekran'ın
kendi ayrı büyütmesi (`#km-oyun-wrap:fullscreen .km-oyun-padbtn`, bu değişiklikten TAMAMEN bağımsız)
hâlâ duruyor, TV-mesafesi ihtiyacı hâlâ o yoldan karşılanıyor. "Normal" = önceki varsayılan boyut
(taban `min-height` 42px'ten 44px'e çıkarıldı — bu arada 360px medya sorgusundaki eski 36px'lik alt
kırılım da bu tabanın ALTINDA kalıyordu, dolaylı olarak düzeltilmiş oldu). "Küçük" = daha dar pad
(`max-width:300px`, daha dar padding/font) ama min-height'i **44px'in ALTINA HİÇ düşürmüyor** —
gerçek testte `46.66×44px` ölçülerek doğrulandı.

**Ayarlar** — panelin kendi üstündeki ⚙️'den açılan menüde (`#km-oyun-dok-ayar-menu`), ayrı bir ekrana
gitmeye gerek yok. Konum/boyut/otomatik-davranış üçü de localStorage'da (`kmOyunDokAyarYukle/Kaydet`,
`dag_km_dok<ad>_<konum>` anahtar kalıbı — D1'e YAZILMIYOR).

**Otomatik davranış** (`_kmOyunDokOtomatikMi`, varsayılan açık) — kamera koreografisiyle (§13d) AYNI
iki tetikleme noktasını paylaşıyor: `bitirOrtak()`'ta kamera "genis"e dönerken panel de
`kmOyunDokOtomatikKapat()` ile kapanıyor; kameranın 1.5sn sonra "yakin"e dönüşünde (VE elle sporcu
seçiminde, `kmOyunSporcuSec`) panel de `kmOyunDokOtomatikAc()` ile açılıyor — "tek bir hareket" hissi
için. Panelin kendi `_kmOyunDokOtomatikMi` anahtarı kamera kilidinden BİLEREK BAĞIMSIZ (kullanıcı
ikisini iki ayrı ayar olarak istedi — koç kamerayı genişte kilitleyip panel otomatiğini ayrıca açık/
kapalı tutabilmeli). Otomatik açma/kapama `_kmOyunDokAcikMi`'yi localStorage'a YAZMIYOR (bilinçli —
geçici bir oto-kapanış koçun kalıcı tercihini ezmesin diye, sadece elle değiştirme kalıcı oluyor).

**Doğrulama**: gerçek bir seri girilip İlerlet'e basılarak tüm döngü ölçüldü — İlerlet sonrası +300ms
panel hâlâ açık (kamera hedefe kayarken), ~1500ms sonra (`bitirOrtak`) panel kapanmış + kamera geniş,
+1700ms sonra ikisi birlikte tekrar açık/yakın. 3 konum × normal boyut × küçük boyut × açık/kapalı
hepsi ekran görüntüsüyle (1280px), ayrıca 360px ve fullscreen'de ayrı ayrı doğrulandı.

### 13g. Genel doğrulama (13a-13f, hepsi için ortak)

Her alt-iş sonunda: 11 oyunun hepsi (Futbol/Takım Futbolu dahil) 360/1280/1920px'te **sıfır yatay
taşma**, **sıfır yeni konsol hatası** (gözlenen tüm hatalar zaten bilinen `fanOutMasterPayload`/
`camera_utils.js` 404/`ERR_INVALID_URL` kümesinden — bkz. §13c); gerçek Tam Ekran modunda ayrıca
kontrol edildi; Reaksiyon'un 14 mini-oyunu (gerçek bir oyun açılıp) etkilenmediği doğrulandı. `node
--check public/app.js` her adımdan sonra temiz. Test PIN'i (`03ac674216f3e15c761ee1a5e255f067953623c
8b388b4459e13f978d7c846f4`) her test turunun sonunda gerçek `egitmen_hash`'e (`d88e4a72af6b2d5e7c737
813df9e499a7acb92c308b62dc0ae7f429b154b4da4`) geri alındı — bkz. §7'nin yerel test deseni.

**Kalan iş / açık notlar**: `_kmOyunKarakterSinirKisitla`/`kmOyunEtiketKenarDuzelt`'in CSS
`overflow:hidden`/`clip-path` NEDEN çalışmadığı hâlâ tam anlaşılmadı (JS-tabanlı kelepçe işlevsel
olarak sorunu çözdü ama kök neden not olarak açık kalıyor — ileride biri bu CSS davranışını gerçekten
anlamak isterse burada bir bulmaca var).

**GÜNCELLEME (2026-09-10)**: Bu bölümün TAMAMI `b95a043` ile commit edildi ("Oyunlar: kamera
koreografisi, etiket/panel çakışması düzeltmesi, esnek skor paneli + Tam Ekran çökme düzeltmesi").
Faz 9 (Pist Yarışı yeniden tasarımı) bu commit'in üzerine, AYRI bir fazda yapıldı — bkz. §14.

## 14. Faz 9 — Pist Yarışı yeniden tasarımı (tek pist, gerçek yarış)

**Neden değişti**: eski Pist 7 ayrı DOM şeridiydi (`.km-lane`/`.km-vehicle`, `left:%` bazlı) —
sollama/çarpışma yoktu, hız farkı zar zor görünüyordu, ve diğer 7 "ortak yol" temasının paylaştığı
`frac→{x,y}` kalıbına uymadığı için Faz 8'in kamera koreografisi/kabuk iyileştirmelerinden hiç
faydalanamıyordu (kendi ayrı `kmOyunPistKameraGuncelle()` hack'i vardı). Kullanıcı 5 aşamalı bir
yeniden tasarım istedi: (1) kapalı devre + konumlandırma, (2) tur sistemi, (3) hız eğrisi, (4) sıra
rozetleri + sollama, (5) bitiş sekansı. Her aşamadan sonra ekran görüntüsü + onay ile ilerlendi.
**Skor girme paneli, ortak kabuk fonksiyonları (`kmOyunKabukGuncelle` ve içindekiler), diğer 9 temanın
frac artış formülü, ve `kmOyunJitter()` hiç değiştirilmedi** — kullanıcının en katı kuralıydı ("Pist
kabuğa uyacak, kabuk Pist'e değil").

### 14a. Stage 1 — Kapalı devre + konumlandırma

Eski `.km-lane*`/`.km-vehicle*`/`.km-kart*`/`.km-startline`/eski `.km-cp*`/`.km-finish`/
`.km-speedlines*`/`.km-flood*`/`.km-grandstand`/`.km-oyun-lanes` tamamen silindi (grep ile diğer hiçbir
temanın bu class'ları paylaşmadığı doğrulandı). Yerine 1200×440 viewBox'ta (diğer 6 "ortak yol"
temasıyla AYNI alan) kapalı bir SVG devre: `KM_OYUN_PIST_YOL_D` (yuvarlak köşeli dikdörtgen, başlangıç/
bitiş noktası BİREBİR aynı — `Z` kapanışının görünmez bir "kısayol" segmenti üretmemesi için).

**`kmOyunPistNokta(frac)`** diğer temaların `kmOyunZirveNokta` imzasını birebir taklit ediyor,
içeride `((frac%1)+1)%1` ile SARIYOR — 2. aşamanın çok-turlu frac'ına (>1) baştan hazır. **`kmOyunPistTeget(frac)`**
modülo-sarımlı epsilon örneklemesiyle (clamp DEĞİL) teğeti hesaplıyor — kullanıcının 3. dikkat
noktasıydı ("virajlarda normal ters dönebilir"), clamp yerine modülo seçilmesinin sebebi tam bu.
**`kmOyunPistKonum(frac,i,n)`** ikisini birleştirip sabit (rastgele DEĞİL) yanal ofseti uyguluyor.

**Playwright ile ölçülerek doğrulanan 3 nokta** (kullanıcı bunları özellikle istedi):
1. Sarım sıçramasız: frac 0.90→1.10 arası 0.002 adımla örneklendi, ardışık nokta mesafesi hep
   ~4.78 birim (beklenen adım mesafesiyle birebir) — sıçrama yok.
2. Teğet ters dönmüyor: tüm tur boyunca ardışık teğetlerin iç çarpımı en kötü 0.977 (1'e çok yakın).
3. İki sütunun (iç/dış) işareti tüm turda HİÇ değişmedi (`signFlips=0`).

**Gerçek testte bulunan ve düzeltilen bir kalabalık hatası**: 8 sporcuyu TEK bir enine çizgide 46
birime sığdırmak (kişi başı ~6.5 birim) araba gövdelerini/sürücü dairelerini iç içe geçiriyordu (tek
büyük renkli yığın gibi görünüyordu). Gerçek yarış ızgaralarındaki gibi **2 sütuna** bölünüp, aynı
sütundaki arabalar teğet yönünde sabit küçük bir frac kaymasıyla (`kmOyunPistSiraKaymasi`,
`KM_OYUN_PIST_SIRA_ADIMI=0.014`) öne/arkaya kaydırıldı — hâlâ tamamen deterministik (jitter/rastgele
DEĞİL).

Kamera dispatcher'ına (`KM_OYUN_KAMERA_SVG_ID`/`KM_OYUN_KAMERA_NOKTA_TEMALAR`) BİLEREK eklenmedi —
kapalı devre her zaman tam görünür. Eski `kmOyunPistKameraGuncelle()`/`KM_OYUN_PIST_KAMERA_ZOOM` ve
`kmOyunKabukGuncelle()`'daki çağrısı silindi. `pist:'pistEl'` artık `KM_OYUN_TAKIM_TEMSILCI_TEMALAR`'da
da (`KM_OYUN_VURGU_TEMALAR` zaten 8a'dan beri içeriyordu).

### 14b. Stage 2+3 — Tur sistemi + hız eğrisi (birlikte yapıldı)

**"Yarış uzunluğu"**: 8 set → 2 tur, 12 set → 3 tur (`KM_OYUN_PIST_SET_TUR`), SADECE localStorage'da
(`dag_km_pistuzunluk_<konum>`, D1'e YAZILMIYOR), üst yardımcı buton sırasında (skor paneline hiç
dokunmadan) bir toggle butonu. Ortak `Math.min(1, eskiFrac+artis)` satırı `Math.min(pistToplamTur,
...)` olarak genelleştirildi — diğer 9 temada `pistToplamTur` hep 1 olduğu için davranış AYNI kaldı
(Zirve'de tek girişle regresyon testi: 26 puanlık aynı seri hâlâ eskisi gibi 0.13 artış veriyor).

**Hız eğrisi**: okun DEĞERİNE göre katsayı (`KM_OYUN_PIST_HIZ_KATSAYI`) — NİTRO(X,10)=2.0/1.8,
HIZLI(9)=1.5, GAZ(8,7)=1.0, YAVAŞ(6,5)=0.5, SAVRUL(M,1-4)=0.15. Set içindeki oklar TOPLANIYOR
(ortalanmıyor) — bu yüzden 6 ok otomatik 3 okun TAM 2 katı ilerliyor (ölçüldü: 0.28→0.56, oran
2.000), ayrı bir ayar gerekmedi. Artış SADECE `_kmOyunAktifTema==='pist'` dalında override ediliyor
(futbol'un `artis=1/8` override'ıyla AYNI kalıp) — diğer temaların ortak formülüne dokunulmadı.

**Kalibrasyon — İKİ TUR yapıldı** (ilk tur kullanıcıya sunuldu, "24-25 ortalaması hiç bitiremiyor,
bitirememek kaybetmekten kötü bir his" geri bildirimiyle KISALTILDI):

| Set ortalaması | İlk kalibrasyon (BİRİM=0.07), 8 set | Son kalibrasyon (BİRİM=1/12≈0.0833), 8 set | Son kalibrasyon, 12 set |
|---|---|---|---|
| 22p (7-8-7) | — | 8. set | 12. set |
| 24p (8-8-8) | bitiremiyor (10 set gerekir) | **tam 8. set** | 12. set |
| 25p (9-8-8) | bitiremiyor (9 set gerekir) | 7. set | 11. set |
| 26p (9-9-8) | 8. set | 7. set | 9. set |
| 27p (9-9-9) | 7. set | 6. set | 8. set |
| 28p (10-9-9) | — | 6. set | 8. set |

Son değer `KM_OYUN_PIST_BIRIM = 2/24` (tam kesir, ondalık yuvarlama HATASI yaşandı — `0.0833`
yazınca 24p tam 8. sette DEĞİL 9. sette bitiyordu, `2/24` ifadesiyle çözüldü). Gerçek arayüzden tek
girişle doğrulandı (8-8-8 → frac tam 0.25).

**"Kimse bitiremeden set hakkı dolarsa en öndeki kazanır"**: bireysel modda kişi başı `pistSetSayaci`
sayacı (`kmOyunSporcuSifirla`'da sıfırlanıyor). HERKES set hakkını tüketip kimse `pistToplamTur`'a
ulaşmadıysa en yüksek frac'lı sporcu `_kmOyunPistYarisSonucu` guard'ıyla BİR KEZ ilan ediliyor (14d'de
sonuç ekranına bağlandı).

### 14c. Stage 4 — Sıra rozetleri, sıradaki büyütme, sollama, yüzdeli sıralama

**Rozetler** (`kmOyunPistSiralamaHesapla`) TÜM roster'ın frac'ına göre holistik hesaplanıyor — tek
kişi skor girse bile HERKESİN sırası yeniden çiziliyor. Ölçerek doğrulandı: index2 baştan 1.'ken,
index0 26 puanlık seri girip index2'yi geçince rozetler doğru yer değiştirdi, ilgisiz index1
etkilenmedi.

**Sıradaki araba büyütme**: halka zaten paylaşılan `.km-oyun-siradaki-vurgu` sisteminden geliyordu
(8a'dan beri Pist dahildi). "Büyük" kısmı **CSS class DEĞİL**, doğrudan JS transform string'ine
(`kmOyunPistGovdeTransform`, `scale(1.18)`) eklendi — çünkü arabanın gövde transform'u zaten JS ile
(rotate) yazılıyor; SVG'de bir CSS `transform` kuralı öznitelik `transform`'unu SESSİZCE geçersiz
kılar, pozisyonu bozardı. Kullanıcı bu kararı özellikle onayladı.

**Sağdaki liste**: Çoklu Takım'ın kendi ayrı görünümüyle (`kmOyunTakimYarisCiz`) AYNI önceliktte,
bireysel Pist için ayrı bir dallanma (`kmOyunPistYarisCiz`) — `kmOyunLiderCiz`'in diğer 9 temaya ait
gövdesine dokunulmadı. Liste artık gerçek toplamSkor yerine yarış yüzdesi (`frac/toplamTur`) ve
"X% geride" rozetleri gösteriyor.

**Sollama bildirimi**: girişten önce önümdeyken artık arkamda kalan sporcular varsa "🏎️ [isim(ler)]'i
geçtin!" toast'ı (birden fazla kişiyi aynı anda geçmek de test edildi, isimler virgülle listeleniyor).
**Ciddi modda sessiz** — ölçerek doğrulandı: ciddi kapalıyken toast çıktı, açıkken (varsayılan durum)
hiç çıkmadı.

### 14d. Stage 5 — Bitiş sekansı

**"Son tur" işareti**: LİDERİN (frac'ı en yüksek sporcu, aktif/SIRADAN BAĞIMSIZ) son tura girip
girmediği her resync'te hesaplanıyor (`kmOyunPistTurHudGuncelle` içinde), `#km-oyun-pist-sontur`
SVG rozeti gösterilip gizleniyor.

**Sonuç ekranı** (`kmOyunPistSonucGoster`, `.km-pist-sonuc`) — Monopoly'nin Şans Kartı overlay'iyle
(`.km-sans-karti`) AYNI kalıp: sahnenin İÇİNDE, mutlak konumlu, `.goster` class'ıyla açılıp kapanan
bir kart, kapatma (✕) butonu var. Kısa sonuç: kazananın adı, "🎯 N ok attı" (`pistOkSayaci` — BU
yarışa özel sayaç, genel kişisel rekordan AYRI), "⭐ En iyi seri: [isim] — Np" (`pistEnIyiSeriBuYaris`
— yine bu yarışa özel, TÜM roster'dan en yükseği). Hem GERÇEK bitiş (bayrağı geçmek) hem "set süresi
doldu" (14b) AYNI `_kmOyunPistYarisSonucu` guard'ı ve AYNI `kmOyunPistSonucGoster` çağrısına bağlandı
— hangi yoldan gelirse gelsin bir yarış SADECE BİR KEZ sonuçlanıyor. Bireysel Pist'in GERÇEK bitişi
diğer temaların ortak banner/surpriz/ses akışını BİLEREK atlıyor (ciddi modda bu eski akış zaten
çalışmaya devam ederdi, "kaçak kutlama" olurdu) — takım modunda (Pist dahil) eski akış DEĞİŞMEDEN
duruyor. Zirve'de gerçek bitişin hâlâ eski banner'ı kullandığı ayrıca doğrulandı (regresyon yok).

**Ciddi modda kutlama yok, sadece sonuç tablosu**: `.km-pist-sonuc.ciddi` class'ı SADECE giriş
animasyonunu (`kmPistSonucFlipIn`, çift-küp-eksenli flip) durduruyor — kart yine de TAM içerikle
gösteriliyor, sadece düz beliriyor. Konfeti/kutlama sesi de `if(!ciddi)` ile atlanıyor. İKİ ayrı
mekanizma ölçülerek doğrulandı: ciddi AÇIKKEN `getComputedStyle(...).animationName === 'none'`,
`prefers-reduced-motion: reduce` altında (ciddi KAPALI olsa bile) AYNI sonuç — paylaşılan genel
`#km-oyun-wrap *{animation:none!important}` kuralı zaten kapsıyor, ayrı bir iş gerekmedi.

### 14e. Genel doğrulama + kalan notlar

Her aşamadan sonra: diğer 10 oyun + Reaksiyon döngüyle açıldı (hata yok), 360/1280/1920px + gerçek
Tam Ekran'da taşma yok, `prefers-reduced-motion` altında Pist'in yeni hiçbir öğesinde aktif animasyon
yok. `node --check` her adımdan sonra temiz. Test PIN'i her tur sonunda gerçek `egitmen_hash`'e geri
alındı.

**Test sırasında karşılaşılan, Pist'le İLGİSİZ bir arka plan sorunu**: hızlı art arda gerçek tıklama
gerektiren kalibrasyon testlerinde (12 set art arda), önceki fazlardan bilinen "401 fırtınası"
`/api/athletes`'i bombalayıp tarayıcıyı `ERR_INSUFFICIENT_RESOURCES` ile zorladı. Zirve'de tek girişle
regresyon testi sorunsuz çalıştığı için Pist koduyla İLİŞKİSİ YOK — kalibrasyon tabloları bu yüzden
gerçek arayüz yerine doğrudan `kmOyunPistSetArtis` formülüyle (ağ isteği olmadan) simüle edilip
raporlandı, sadece TEK gerçek girişlerle çapraz doğrulandı.

**Bilinen sınır**: aşırı uzun test-sporcu adları (`CanliTakipGoster_1788732305561` gibi, 30+ karakter)
araba etiket kutusunu genişletip komşu etiketlerle çakışabiliyor — Pist, `kmOyunEtiketKenarDuzelt`'in
çakışma-giderme sistemine BİLEREK dahil değil (o sistem `KM_OYUN_KAMERA_SVG_ID` varlığına bağlı,
Pist'in kamerası yok). Gerçek sporcu adlarında (kısa Türkçe isimler) sorun oluşturmuyor, sadece
pathological test verisinde görülüyor — bilinçli olarak Stage 1-5 kapsamı dışında bırakıldı.

**Sonraya bırakılanlar** (kullanıcı talimatıyla bu fazda yapılmadı, sadece not): Slipstream (öndekinin
arkasındayken ek hız), Nitro barı (üst üste iyi atışla biriken, istenen anda harcanan boost).

**Ortak kabuğa dokunulmadı**: `kmOyunKabukGuncelle()` içindeki 5 fonksiyonun (`kmOyunTakimTemsilciUygula`,
`kmOyunSiradakiVurguUygula`, `kmOyunKameraGuncelle`, `kmOyunKarakterSinirKisitla`,
`kmOyunEtiketKenarDuzelt`) HİÇBİRİNİN gövdesi değişmedi — sadece `kmOyunPistKameraGuncelle()` çağrısı
silindi (Pist artık kameraya girmiyor). `kmOyunSporcuSec`/`kmOyunIlerlet`/`kmOyunLiderCiz` gibi zaten
tema-koşullu dallanması olan (Monopoly/futbol örnekleri gibi) fonksiyonlara Pist'in KENDİ dalı eklendi
— bu, mevcut kod stiliyle tutarlı, "kabuğa dokunma" kuralının kapsamı dışında.

## 15. Faz 11 — Düello Arena (çoklu eşleşme, yeni tema)

**Ne yapıyor**: Oyunlar'a 12. tema. Karşılıklı ok atışlı çoklu düello — koç eşleştirmeyi kendisi
yapıyor, TÜM düellolar aynı anda ekranda; kimse sıra beklemiyor, koç hangi karta dokunursa skor girişi
ONA bağlanıyor. Mekaniği diğer 9 temadan farklı: frac/yol YOK, can (HP) var (Bireysel/Takım
Futbolu'nun "kendi mekaniği" emsaliyle aynı kategori). **Kritik kural, baştan sona**: otomatik/
rastgele/yapay rakip hasarı YOK — hasar SADECE koçun girdiği gerçek skordan, o eşleşmenin GERÇEKTEN
atan tarafından karşı tarafa. Fonksiyon/id öneki BİLEREK "arena" — mevcut `#duello-modal` (davet-
tabanlı, SİMÜLE rakipli, tamamen ayrı bir özellik, bkz. §2g/§7) ile karışmasın diye "duello"/"duelo"
hiç kullanılmadı. Her aşama sonunda: diğer 11 oyun + Reaksiyon'un 14 mini-oyunu döngüyle açıldı,
360/1280/1920px + gerçek Tam Ekran'da taşma yok, `prefers-reduced-motion`'da aktif animasyon yok, skor
girme paneli (tuş yerleri/boyutları/esnek panel davranışı) hiç değişmedi — Zirve ile piksel piksel
karşılaştırıldı.

### 15a. Stage 1 — Eşleştirme ekranı

Eşleştirme ekranı Takım Editörü'ndeki gibi ayrı bir `.modal-overlay` DEĞİL — panelin kendi varsayılan
içeriği (`_kmOyunArenaGorunum`: `'eslestirme'|'oyun'`, `kmOyunPanelHTML('arena')`'nın govde div'i
`kmOyunArenaCiz()` ile dinamik değiştiriliyor). Üstte sporcu havuzu (TÜM roster her zaman görünür,
eşleşmiş olanlar soluklaşır — kaybolmaz), altta eşleşme listesi (kaldırma düğmeli), "🎲 Otomatik
Eşleştir" (kalanı karıştırıp ikişerli dağıtır), "🗑️ Temizle", "▶ Turu Başlat".

**Kullanıcı notu 1 uygulandı**: eşleştirme ekranındayken "İlerlet" düğmesi boş görünmesin diye üzerinde
"Önce eşleştirme yapın" yazıyor (disabled), panelin boyutuna hiç dokunulmadan.

**Kullanıcı notu 2 uygulandı**: tek sayıda sporcu kalırsa "⚠️ [İsim] bu turda açıkta — eşi yok,
bekleyecek." net bir satır (hem manuel eşleştirmede hem Otomatik Eşleştir'de aynı).

**Gerçek testte bulunan 2 çakışma**:
1. Paylaşılan `#km-oyun-sirada` rozeti (position:absolute, top:8px, left:8px) diğer temalarda sahnenin
   dekoratif pikselleri ÜZERİNE biniyor, sorun olmuyordu — burada gerçek metinle çakışıyordu, üst
   boşlukla düzeltildi.
2. Skor dok'u panelin ALT KISMINA sabit (`position:absolute; bottom:12px`), içeriğin kaydırılmasıyla
   YER DEĞİŞTİRMEZ — "Turu Başlat" ilk denemede dok'un ARKASINDA kalıp tıklamayı yutuyordu.
   **Kullanıcı geri bildirimiyle** (sabit piksel boşluk kırılgan olur) düzeltildi: Faz 4a'nın
   `--alt-bar-h` deseninin AYNISı — `ResizeObserver` dok'u (`#km-oyun-dok`) izliyor, gerçek
   `offsetHeight`'ı `--km-arena-dok-h` CSS değişkenine yazıyor (`kmOyunArenaDokYukseklikSenkron`),
   panelin alt boşluğu `calc(var(--km-arena-dok-h,300px) + 40px)`. Dok "Küçük" boyuta geçince (297px→
   429px, bu özel durumda küçültme paradoksal şekilde dok'u UZATTI — pad'in kendi 44px taban kuralı
   yüzünden, Arena'yla ilgisiz) değişken de otomatik güncellendi, "Turu Başlat" iki durumda da gerçek
   tıklamayla erişilebilir kaldı.

### 15b. Stage 2 — Çoklu arena ızgarası

Her eşleşme bir kart, ızgara dar ekranda tek sütun / ≥620px'te iki sütun. Kart: başlık (kaçıncı
eşleşme + ETKİN/BEKLİYOR/BİTTİ rozeti), iki can barı (portre+isim+yüzde), küçük SVG saha (iki okçu
karşılıklı, degrade gövde+kenar aydınlığı+zemin gölgesiyle derinlik, yay+sadak görünür), "Diğer okçuya
geç" düğmesi. Karta dokununca `kmOyunArenaMacSec` o eşleşmeyi etkinleştirir — ortak
`kmOyunIlerlet`/`kmOyunPadCiz`/SIRADA rozeti HÂLÂ `_kmOyunAktifIndex` okuduğu için (kabuğa dokunmadan
yeniden kullanım), sadece "hangi maç/hangi okçu etkin" değiştiğinde `_kmOyunAktifIndex`
`kmOyunArenaAktifIndexGuncelle()` ile senkronize ediliyor.

**Gerçek testte bulunan 2 hata**:
1. Paylaşılan `.km-oyun-panel svg{ position:absolute; inset:0; width:100%; height:100%; }` kuralı
   (tek-parça tam-sahne SVG'li diğer temalar için) her kartın KENDİ küçük SVG'sini panelin TAMAMINA
   yayıp "Diğer okçuya geç" düğmesinin tıklamasını yutuyordu. Paylaşılan kurala dokunmadan, SADECE
   `.km-arena-mac-kart svg.km-arena-saha-svg` (daha yüksek özgüllük — iki class+element) ile geçersiz
   kılındı.
2. Okçu gövdesine yanlışlıkla panel kapsayıcısıyla AYNI class adı (`km-arena-govde`) verilmişti —
   `km-arena-okcu-govde` olarak yeniden adlandırıldı. (Bu hata bir Playwright arka plan görevinin GEÇ
   gelen hata bildirimiyle bir sonraki oturumda tekrar gündeme geldi — aslında AYNI turda zaten
   yakalanıp düzeltilmişti, sadece bildirim gecikmişti; DEVIR güncellemesi bu tekrar-teyit anını da
   kapsıyor, bkz. §7'nin yeni "tek okuma yeterli değil" kuralı ile aynı ruh: geç/asenkron sinyalleri
   körü körüne yeni bir sorun sanmadan önce mevcut düzeltmeye karşı kontrol et.)

### 15c. Stage 3 — Ok uçuşu ve hasar

Her ok ayrı uçuyor (`kmOyunAnimateArena`'nın `birOkIsle` özyinelemesi, sırayla — hepsi bir arada
DEĞİL). Uçuş kademesi (`KM_OYUN_ARENA_UCUS_TIER`): X/10 hızlı+altın iz, 9/8/7 normal, 6-1 alçalan
("zar zor ulaşır"), M havada sönüp hasar vermiyor. Hasar `KM_OYUN_ARENA_HASAR`'dan geliyor (girilen
PUANIN KENDİSİNİ değiştirmiyor — `_skorKaydetCekirdek` her zamanki gibi GERÇEK kayda gidiyor). Üç ok
da "altın" (X/10/9, `KM_OYUN_PAD_RENK`'in mevcut kategorisi) ise +bonus hasar ve "🎯 MÜKEMMEL SERİ!"
banner'ı.

**Mimari kararlar (gerçek testle doğrulandı)**:
- Uçan ok/hasar sayısı **SVG öznitelik transform'u DEĞİL, düz HTML div** (`kmOyunBurst`'ün AYNI,
  kanıtlanmış deseni) — WAAPI'nin SVG transform üzerinde bu kod tabanında hiç denenmemiş davranışına
  girmemek için. `.km-arena-saha-wrap{position:relative}` bu div'lerin konumlandığı yer.
- Sarsıntı efekti **ayrı bir İÇ `<g>`'ye** uygulandı — dış `<g>`'nin `translate/scale` ÖZNİTELİĞİNE
  bir CSS `animation` doğrudan uygulansaydı (Pist'in araba-ölçekleme dersiyle AYNI risk) SESSİZCE
  ezip pozisyonu/yönü bozardı.
- Sarsıntı CSS `@keyframes` (WAAPI DEĞİL) — paylaşılan genel
  `@media(prefers-reduced-motion:reduce){#km-oyun-wrap *{animation:none!important}}` kuralı OTOMATİK
  kapatıyor. Ama uçan ok/hasar sayısı WAAPI (`.animate()`) kullandığı için bu genel kural onları
  KAPSAMIYOR — `kmOyunKameraAzaltilmisHareketMi()` (mevcut, kamera için yazılmış ama tamamen jenerik
  bir fonksiyon) + `ciddiModAcik` AYRICA kontrol edilip WAAPI çağrıları manuel atlandı; ölçüldü,
  `reduced-motion` altında uçan ok/hasar sayısı DOM'da hiç oluşmadı (0/0), hasar yine de anında
  uygulandı.
- `baslatAnimasyon()`/`bitirOrtak()`'taki genel banner/checkpoint/"HARİKA SERİ" dalına Arena BİLEREK
  hiç girmiyor (`_kmOyunAktifTema !== 'arena'` eklendi) — kendi "MÜKEMMEL SERİ" kutlaması var,
  ikisi birden çalışsaydı ciddi modda "kaçak kutlama" olurdu (Pist'in Stage 5'teki AYNI dersi).

### 15d. Stage 4 — Bitiş ve yeniden eşleştirme

Can 0 olunca kart "BİTTİ" olur, kartta "🏆 [İsim] kazandı!" görünür. Sıra değişimi SADECE maç hâlâ
sürüyorsa oluyor. Tüm eşleşmeler bitince "🏆 Tur Sonu" ekranı (Pist'in `.km-pist-sonuc`'uyla — Faz 9
§14d — AYNI kalıp: sahnenin içinde, mutlak konumlu, `.goster`/`.ciddi` class'ları) her eşleşme için
kazanan/kaybeden + kaç ok atıldı + en iyi seri kimin listeler; koç bunu görüp kazananları
karşılaştırıp eleme yapabilir. "🔄 Yeniden Eşleştir" eşleştirmeyi TAMAMEN temizleyip boş eşleştirme
ekranına döner (otomatik bir sonraki tur ÜRETMİYOR — kullanıcı talimatı: "koç ... kurabilsin").

**KRİTİK bulgu — bu turun en ciddi hatası**: `bitirOrtak()`'ın paylaşılan otomatik-sıradaki-geçiş
satırı (`_kmOyunAktifIndex = (i+1)%n`, TÜM temalar için sırayla bir sonraki roster üyesine geçmek
üzere yazılmış) Arena'yı hiç dışlamıyordu. Arena'nın kendi `kmOyunArenaAktifIndexGuncelle()`'i
`kmOyunAnimateArena`'nın `bitir()`'inde `_kmOyunAktifIndex`'i doğru okçuya ayarlıyordu, ama HEMEN
ARDINDAN çağrılan `bitirOrtak()` bu satırla onu SESSİZCE eziyordu — 3. gerçek girişten itibaren
`_kmOyunAktifIndex` maçın gerçek iki okçusundan tamamen kopuyor, bir SONRAKİ girişin hasarı YANLIŞ
tarafa gidiyordu (roster'da rastgele bir 3. kişiye). **Stage 3'ün kendi testleri bunu YAKALAMAMIŞTI**
çünkü test sırasının 3. girişi tesadüfen M-M-M idi — M hep 0 hasar verdiği için, hangi tarafa
uygulandığının önemi yoktu, hata GÖRÜNMEDEN kaldı. Gerçek hata ancak Stage 4'ün ART ARDA GERÇEKTEN
ETKİLİ girişlerle bir maçı tam bitirmeye çalışırken (adım adım `aktifIndex`/can izlenerek) ortaya
çıktı. **Düzeltme**: tek satır — `if(_kmOyunAktifTema !== 'arena') _kmOyunAktifIndex = (i+1)%n;`.
Düzeltmeden SONRA 5 girişlik bir maç adım adım yeniden izlendi (`aktifIndex` her girişte doğru
alternatif okçuyla eşleşti, hasar hep doğru tarafa gitti), Zirve'nin kendi otomatik-geçişi AYRICA test
edilip bozulmadığı doğrulandı. **Bu olay §7'ye yeni bir kalıcı test kuralı olarak eklendi** (bkz. §7,
sıfır-etkili seri kuralı).

**Kalibrasyon** (`KM_OYUN_ARENA_HASAR`, formülle simüle edildi): hızlı=14, normal=10, zayıf=5,
mükemmel bonus=12, can=100. 20-27 puan/set gerçekçi aralığın TAMAMINDA (simetrik/eşit seviyeli iki
okçu varsayımıyla) bir eşleşme 3-4 sette bitiyor (20p→4, 24-25p→4, 27p→3) — kullanıcının "koç 8-12
set atıyor" bütçesinin rahat içinde, sarkma riski yok.

**Ciddi mod, iki ayrı ekranda ayrı ayrı doğrulandı**: "EŞLEŞME BİTTİ!" banner'ı VE "Tur Sonu"
ekranının giriş animasyonu/konfetisi ciddi modda atlanıyor (`animationName:'none'` ölçüldü), ama HER
İKİSİNDE de hasar/sonuç/liste HER ZAMAN uygulanıyor+gösteriliyor, "Yeniden Eşleştir" ciddi modda da
tıklanabilir kaldı (`pointer-events` sadece `.goster`'a bağlı, `.ciddi`'ye değil).

**Kritik izolasyon testi** (bu fazın temel kuralı): 3 eşleşmeli bir turda SADECE 1. eşleşme 5 gerçek
girişle tam bitirildi — 2. ve 3. eşleşme bu süre boyunca HİÇ dokunulmadan `100/100 · bekliyor` kaldı.

Test PIN'i her tur sonunda gerçek `egitmen_hash`'e geri alındı. `node --check` her adımdan sonra
temiz.

## 15e. Canlıda "oklar uçmuyor" bulgusu — DÜZELTİLDİ (2026-09-11, gece görevi, henüz DEPLOY EDİLMEDİ)

**Bağlam**: kullanıcı canlı ortamda skor girildiğinde okun uçmadığını bildirdi ("yerel testte
çalışıyordu, canlıda farklı"). Görsel bir değişiklik (Faz 13'ün turnuva ağacı, aidat/yoklama işi vb.
DEĞİL) olduğu için kullanıcı sabah kendi gözüyle onaylayana kadar DEPLOY EDİLMEDİ — sadece commit +
push. **İKİ ayrı, birbirinden bağımsız kök neden bulundu, ikisi de gerçek testle doğrulandı.**

**1. neden — `ciddiModAcik` varsayılan AÇIK (app.js:18293) ok görselinin KENDİSİNİ de kapatıyordu**:
`kmOyunAnimateArena`'daki `kapali` bayrağı (`kmOyunKameraAzaltilmisHareketMi() || ciddiModAcik`)
`kmOyunArenaOkUcurGorsel()`'in HİÇ çağrılmamasına yol açıyordu — ok uçuşu bir "kutlama" değil, Arena'nın
kimin vurduğunu/ıskaladığını GÖSTEREN çekirdek mekaniği. Ciddi Mod varsayılan açık olduğu için (bkz.
"CİDDİ YARIŞMA MODU: ... varsayılan AÇIK") HİÇBİR koç bunu bilerek kapatmadıkça (ki "ok görmekle" alakası
yokmuş gibi görünen bir ayar) arenanın çekirdek görsel geri bildirimi HİÇ görünmüyordu — bu neredeyse
KESİN olarak canlıdaki asıl şikayetin nedeni. **Düzeltme**: ok görselini SADECE gerçek
`prefers-reduced-motion` (meşru erişilebilirlik sinyali) kapatıyor artık; `ciddiModAcik` hâlâ SADECE
ekstra kutlamaları (banner/ses/hasar sayısı patlaması/mükemmel-seri bonus banner'ı) susturuyor.

**2. neden (bağımsız, İKİNCİ bir gerçek hata — hızlı/çoklu maç kullanımında tetiklenir)**:
`kmOyunArenaCiz()` TÜM ızgarayı `innerHTML` ile yeniden kuruyor. Bir maçın oku HÂLÂ uçarken (WAAPI/
setTimeout zinciri sürerken) koç BAŞKA bir maça dokunursa (`kmOyunArenaMacSec`/
`kmOyunArenaDigerOkcuyaGec` — Arena'nın TAM amacı: birden fazla düelloyu aynı anda yürütmek) bu tam
redraw uçmakta olan okun DOM düğümünü SESSİZCE siliyordu — hasar yine uygulanıyordu (state DOM'a bağlı
değil), sadece görsel kayboluyordu. **Düzeltme**: `_kmOyunArenaMesgulSayisi` sayacı + `_kmOyunArenaCizErtele`
bayrağı eklendi (`kmOyunArenaCizGuvenli()`) — bir animasyon sürerken (`kmOyunAnimateArena` başında
sayaç artar, `bitir()`'de azalır) BAŞKA bir maça dokunmanın tetiklediği redraw ERTELENİYOR (en fazla
~700ms, tek bir okun süresi); animasyonu biten maçın KENDİ `bitir()`'i HER ZAMAN direkt çizer (hem
kendi sonucunu gösterir hem ertelenmiş isteği karşılar).

**Neden yerel testte hiç yakalanmamıştı**: Stage 3'ün orijinal testleri tek tek, aralarda bekleyerek
(`waitForTimeout`) yapılmıştı — ne varsayılan `ciddiModAcik=true` durumunda test edilmiş (hep açıkça
`false`'a çekilmişti) ne de GERÇEKÇİ hızlı/çok-maçlı bir senaryo denenmişti. İkisi de gerçek testle
DOĞRULANDI (aşağıda).

**Gerçek testle doğrulandı** (yerel D1, sıfır etkili senaryo kullanılmadı):
- `ciddiModAcik` varsayılan (`true`) haliyle: DÜZELTMEDEN ÖNCE ok hiç görünmüyordu (`false`);
  DÜZELTMEDEN SONRA görünüyor (`true`), banner hâlâ gizli kalıyor (ciddi mod kutlamaları hâlâ susuyor).
- `prefers-reduced-motion: reduce` (gerçek Playwright context emülasyonu) + ciddi mod KAPALI: ok
  GÖRÜNMÜYOR (doğru, erişilebilirlik korundu), hasar YİNE DE uygulanıyor.
- Hızlı, beklemesiz, 3 FARKLI maça art arda seri girişi (gerçek "birden fazla düelloyu yöneten koç"
  davranışı): DÜZELTMEDEN ÖNCE ok hiç görünmüyordu; DÜZELTMEDEN SONRA görünüyor, hasar üç maça da
  doğru uygulandı.
- Regresyon: 12 Oyunlar teması + Reaksiyon hatasız gezildi, konsol hatası yok.

**Deploy durumu**: SADECE commit + push yapıldı, `npm run deploy` YAPILMADI — kullanıcı görsel/davranış
değişikliği olduğu için sabah kendi gözüyle bakıp onaylayacak.

## 15f. Gerçek okçu karakterleri — TAMAMLANDI, deploy edildi (2026-09-11, gece görevi + sabah devamı)

**Bağlam**: gece görevinin 3. işi, Arena'daki SVG okçu figürlerini 6 hazır WebP karaktere
(`okcu-kirmizi-genc.webp`, `okcu-orman-elfi.webp`, `okcu-elf-kadin.webp`, `okcu-tilki.webp`,
`okcu-pelerinli.webp`, `okcu-sari-sacli.webp`) çevirmekti.

**Gece bulgusu**: kaynak `okcu-karakterler.zip` dosyası gece boyunca dosya sisteminde HİÇBİR YERDE
bulunamadı (Desktop/dagsk, Desktop, Downloads'taki tüm zip'ler tek tek, OneDrive, scratchpad). En
yakın isim eşleşen iki zip (`archer-2.zip`, `sf_archery_black.zip`) açılıp kontrol edildi — ikisi de
font dosyası, ilgisiz. Kullanıcının kendi talimatı gereği ("emin olmadığın bir karar çıkarsa en
muhafazakâr seçeneği uygula") hiçbir kod değişikliği yapılmadan durulup sabah raporunda bildirildi.

**Sabah**: kullanıcı 6 WebP'yi bizzat `public/okcu-karakterler/` klasörüne koydu (toplam 208KB,
hepsi 440px yükseklik, farklı genişlik — `okcu-kirmizi-genc` 402px'den `okcu-orman-elfi` 296px'e).
Yol kararını kullanıcıya bıraktı ("public/assets/okcu/ altına taşı, istersen olduğu yerden kullan").

**Karar — dosya yolu**: `public/okcu-karakterler/` OLDUĞU YERDE bırakıldı, `public/assets/` klasörü
AÇILMADI. Gerekçe: projede `public/assets/` diye bir klasör hiç yok — tüm statik görseller şimdiye
kadar `public/galeri/` gibi düz, tek-seviye klasörlerde tutulmuş (`/galeri/okculuk-1.jpg` şeklinde
kök-göreli yol). Yeni bir `assets/` iç-içe katmanı açmak sadece bu 6 dosya için tek seferlik bir
istisna olurdu, mevcut desenle (`/okcu-karakterler/...`) taşımadan kullanmak hem daha tutarlı hem
sıfır ekstra iş.

**Uygulama** (`public/app.js`, `kmOyunArenaOkcuSVG` ve çevresi):
- `KM_OYUN_ARENA_KARAKTERLER` (6 isim) + `KM_OYUN_ARENA_KARAKTER_EN` (her birinin gerçek piksel
  genişliği, WebP header'ından Node ile okunup sabitlendi — SVG `<image>` en-boy oranını KENDİSİ
  korumadığı için bu olmadan karakterler gerilip deforme görünürdü).
- `_kmOyunArenaKarakterAta(ad)`: bir sporcu Arena'da ilk görüldüğünde sırayla (0'dan başlayıp 6'da
  bir başa dönerek) bir karaktere atanır, `_kmOyunArenaKarakterMap` (bellek + `localStorage`,
  `_kmYarismaKurulumKaydet`'le AYNI "bugünün tarihi değilse sıfırla" deseni) içinde saklanır — D1'e/
  buluta HİÇ yazılmıyor, gün/ders değişince sıfırlanıyor.
- Eski elle-çizilmiş SVG (gövde/yay/sadak/kafa-daire + `kmOyunAvatarSVG` yüz) tamamen kaldırıldı,
  yerine tek bir `<image href="/okcu-karakterler/${karakter}.webp" .../>` kondu — zemin gölgesi
  (`km-arena-golge` ellipse) korundu. Görsellerin ÜZERİNDE takım rengi YOK (eski govde'nin
  `kmArenaGrad-${uid}` degrade dolgusu ve artık kullanılmayan `<defs>` blokları kaldırıldı) — takım/
  sporcu rengi SADECE isim etiketi + can barında (değişmedi, zaten HTML tarafındaydı).
- Yön çevirme İÇİN YENİ KOD YAZILMADI: dış `<g transform="translate(x,55) scale(yon,1)">` Faz 11'den
  beri var olan mekanizma — soldaki okçu (`sagaBakiyorMu=true`, yon=1) olduğu gibi kalıyor, sağdaki
  (`yon=-1`) otomatik `scaleX(-1)` ile çevriliyor. Karakterler zaten sağa bakıp ok çektiği için bu
  BİREBİR kullanıcının istediği sonucu veriyor.
- Sarsıntı (`.sarsiliyor`, hedef isabet aldığında) ve ok uçuşu (`kmOyunArenaOkUcurGorsel`) hiç
  dokunulmadı — ikisi de aynı `.km-arena-okcu-a`/`.km-arena-okcu-b` iç `<g>`'ye ve `#km-arena-saha-N`
  wrapper'ına bağlı, sadece bu g'nin İÇERİĞİ (path'ler → image) değişti, YAPI aynı kaldı.
- Artık kullanılmayan CSS (`.km-arena-okcu-govde`, `.km-arena-kafa-bg`, `.km-arena-yay`,
  `.km-arena-sadak`) silindi.

**Gerçek testle doğrulandı** (yerel D1 + gerçek Playwright `.click()`, 8 sporculu bir sınıfla):
8 sporcu 6 karaktere doğru sırayla atandı (0,1,2,3,4,5,0,1 — 6'da biri başa döndü); tüm 6 WebP
`/okcu-karakterler/...` yolundan 200 döndü; SVG `<image>` boyutları her karakterin gerçek en/boy
oranına göre doğru hesaplandı (deforme yok); ekran görüntüsünde soldaki karakter sağa, sağdaki
karakter (aynı karakter türü olsa bile) sola bakıyor — flip doğru çalışıyor; küçük maç kartına
taşmadan sığıyor (1280px VE 360px'te ayrıca doğrulandı, mobilde tek sütuna düşüyor, karakter yine
düzgün); gerçek bir seri (9-8-7) girilip can barının doğru yüzdeye düştüğü görüldü (hasar mekaniği
etkilenmemiş); ok uçuşu animasyonu hâlâ çalışıyor (`.km-arena-ucan-ok` DOM'da görüldü); 12 Oyun
teması + Reaksiyon regresyon taraması temiz, `node --check` temiz.

**Deploy durumu**: kullanıcı ekran görüntülerine bakıp onayladıktan sonra deploy edildi —
`de00e8d2-6a3b-4a09-ad68-1e0cad8d4eb1` (2026-09-11). WebP'ler zaten iş 2'nin deploy'unda statik
asset olarak yüklenmişti, bu deploy sadece `app.js`'i güncelledi.

## 15g. KURAL — Ciddi Mod SADECE ekstraları susturur, mekaniğin görünürlüğünü ASLA kapatmaz (2026-09-11)

**Kural** (§15e'nin Arena bulgusundan genelleştirildi, kullanıcı talimatıyla buraya yazılıyor):
`ciddiModAcik` (varsayılan AÇIK, kullanıcıya "Ciddi yarışma modu" / "Kutlamalar kapalı, ödüller
sessizce verilir" olarak gösteriliyor) SADECE şunları susturabilir: banner, ses (`sesCal`), konfeti/
patlama (`kmOyunBurst`), animasyonlu vurgu/nabız efekti, "kutlama kuyruğu" (`kutlamaKuyrukEkle`),
sosyal/motivasyonel yorum metni (ör. "arkandaki sana çok yakın!"). **ASLA** şunu kapatamaz: bir olayın
GERÇEKTEN olup olmadığını gösteren görsel/mekanik geri bildirim (ok uçuşu, çarpışma, skor/sıralama
değişimi, sonuç ekranının KENDİSİ), gerçek veri/skor/rozet/geçmiş kaydı. Ayrım testi: **"Bunu
kapatırsam kullanıcı hâlâ ne olduğunu anlayabilir mi?"** — cevap hayırsa (Arena'daki ok gibi) bu bir
mekanik, ciddiModAcik'e asla bağlanmaz; cevap evetse (sonuç zaten metin/skor olarak ekranda) bu bir
ekstra, güvenle susturulabilir. `prefers-reduced-motion` ile karıştırılmasın: o gerçek bir erişilebilirlik
sinyali, `ciddiModAcik` ise bir koç tercihi — ikisi aynı OR ifadesinde SADECE sonucu etkilemeyen saf
zamanlama/animasyon değişikliklerinde (ör. kamera aninda mı yumuşak mı gitsin) birleştirilebilir,
görsel/mekanik varlığın kendisini kapatan bir ifadede asla birleştirilmemeli.

**2026-09-11 taraması** (kullanıcı istedi: "başka yerlerde de aynı hata olabilir, özellikle Pist ve
diğer oyunlarda listele") — `ciddiModAcik`'in app.js'teki TÜM kullanım yerleri (tanım/toggle hariç 9
site) tek tek okunup sınıflandırıldı:

| Yer | Ne susturuyor | Sınıf |
|---|---|---|
| `kmOyunSiradakiVurguUygula` (11533) | Sıradaki sporcunun halkasının NABIZ animasyonu (halkanın kendisi hep kalıyor) | Ekstra ✅ |
| `kmOyunKameraHedefeGit` (11612, reduced-motion ile OR'lu) | Kamera geçişinin YUMUŞAKLIĞI (hedefe hep doğru gidiyor, sadece anında) | Ekstra ✅ |
| `kmOyunPistSonucGoster` (13496, Pist bitiş) | SADECE konfeti+ses (`.ciddi` CSS'i sadece giriş animasyonunu kapatıyor, `opacity:1` koşulsuz — kazanan/ok sayısı/en iyi seri metni HER ZAMAN yazılıyor) | Ekstra ✅ |
| Pist "sollama" toastı (14033) | Sadece "X'i geçtin!" bildirimi — gerçek sıra rozetleri (`kmOyunPistSiralamaHesapla`) ayrı, hiç gizlenmiyor | Ekstra ✅ |
| `kmOyunAnimateArena` (14966) | **DÜZELTİLDİ (§15e) — ESKİDEN ok görselini de kapatıyordu, ŞİMDİ sadece banner/ses/hasar-patlaması/mükemmel-bonus** | Düzeltildi ✅ |
| `kmOyunArenaTurSonucGoster` (15035) | SADECE konfeti+ses — eşleşme sonuçları listesi (`innerHTML`) koşulsuz yazılıyor | Ekstra ✅ |
| `kmYarismaBracketTurKontrolEt` şampiyon kutlaması (16734) | SADECE `kutlamaKuyrukEkle` banner'ı — şampiyonun geçmiş/PDF kaydı (`_gecmisGirdisi`) ciddiModAcik'ten TAMAMEN bağımsız, hep yazılıyor (bu, önceki bir oturumda `kutlamalarSessiz` yerine doğru bayrağa taşınarak zaten düzeltilmişti) | Ekstra ✅ |
| `tavsanVeTakipGoster` "yakın takip" satırı (18140) | Sadece sıralama-karşılaştırma yorum metni (tavşan sonucunun kendisi HER modda gösteriliyor, gerçek puanlar zaten Klasman'da her zaman görünür) | Ekstra ✅ (bilinçli tasarım) |
| `_seriSonrasiOdulVeLog` (18365 civarı) | `kutlamalarSessiz=true` + kuyruk temizleme — ödül/rozet/coin YİNE VERİLİYOR, sadece sessizce | Ekstra ✅ |

**Sonuç**: Arena'nın ok görseli (§15e, düzeltildi) DIŞINDA, mevcut 9 kullanım yerinin hepsi kuralı
doğru uyguluyor — hiçbiri gerçek bir mekaniği/sonucu gizlemiyor. Pist'te (2 site) ve turnuva/bracket
şampiyonluğunda ayrıca dikkatli kontrol edildi, iki yerde de sorun yok. Yeni bir `ciddiModAcik` kontrolü
eklenirken yukarıdaki ayrım testi uygulanmalı.

## 15h. Bitmiş eşleşme için "Yeni Oyun" (2026-09-13, gece işi)

**Bağlam**: kullanıcı bildirdi — Arena'da bir düello bitince tekrar/yeniden başlama seçeneği yok;
birden fazla eşleşme aynı anda sürerken (normal kullanım — "çoklu düello: eşleştirin, herkes aynı
anda kendi hedefine atar") bir ikili bitirdiğinde SADECE o ikiliye yeni bir oyun sunulmalı, TÜM
turun bitmesini beklemeden.

**Ayrım (önemli)**: bu, var olan `kmOyunArenaYenidenEslestir` (Stage 4, TÜM maçlar bitince açılan tur
sonu ekranındaki "yeniden eşleştir") ile KARIŞTIRILMAMALI — o TÜM eşleşmeleri sıfırlayıp yeni bir
eşleştirme ekranına dönüyor. Yeni `kmOyunArenaMacYenile(idx)` SADECE tek bir eşleşmeyi (aynı iki
sporcu, `aIndex`/`bIndex` DEĞİŞMEDEN) `kmOyunArenaTuruBaslat`'ın oluşturduğu şekille BİREBİR aynı
taze bir nesneyle değiştirip `kmOyunArenaMacSec(idx)` ile hemen aktif hale getiriyor — diğer devam
eden eşleşmelere HİÇ dokunmuyor.

**Arayüz**: `kmOyunArenaMacKartHTML`'de, `bittiMi` iken eski boş buton alanı yerine
"🆕 Yeni Oyun (A vs B)" butonu — devam eden eşleşmelerdeki "🔁 Diğer okçuya geç" butonuyla AYNI yerde,
sadece durum farklı olduğu için içeriği değişiyor.

**Gerçek testle doğrulandı**: 4 eşleşmeli bir turda 1. eşleşme GERÇEK X'lerle bitirildi (diğer 3
`bekliyor`/100-100 can, hiç dokunulmadı). "Yeni Oyun" butonuna GERÇEK `.click()` ile basıldı — 1.
eşleşme can/ok/en-iyi-seri sıfırlandı, `etkin` oldu, AYNI iki sporcu (aIndex/bIndex değişmedi), diğer
3 eşleşme YİNE hiç etkilenmedi. Ardından GERÇEK bir seri (9-8-7) girilip hasarın doğru uygulandığı
(100→90) doğrulandı — sıfırlama sonrası maç GERÇEKTEN oynanabilir durumda. 12 tema + Reaksiyon
regresyon taraması temiz.

**Deploy durumu**: commit + push + DEPLOY edildi (kullanıcının aynı gece talimatı kapsamında).
Commit `a17f5ec`, deploy version `0d5fab8b-187b-4f12-90b6-b1e9a6e24c5b`.

## 16. KAPANIŞ — Faz 13, Karışık Sınıf → Yarışma sekmesi TAMAMLANDI (2026-09-10)

**Ne yapıyor**: Karışık Sınıf'ın kendi "🏆 Yarışma Modu" sekmesi (`kmSekme('yarisma')` →
`kmYarismaCiz()`, `_kmTakimlar`/`kmYarisma*`, §2f'deki AYRI/farklı main-app "Yarışmalar" eleme
ağacından — `#icerik-takimlar`/`elemeAgaciOlustur` — kesin biçimde farklı, KARIŞTIRILMADI, ikisi de
hâlâ ayrı ayrı yaşıyor) — kalıcılık kazandı, takım boyutu 2-5'e çıktı, gerçek bir turnuva/eleme ağacı
mekaniği SIFIRDAN kuruldu.

### Aşama özeti

| Aşama | Kapsam | Commit(ler) |
|---|---|---|
| 1 | Teşhis (kod değişikliği yok) — "eşleşmeler kayboluyor" şikayetiyle "eleme ağacı" beklentisinin AYNI ekrana ait olmadığı bulundu, `AskUserQuestion` ile hedef netleştirildi | — |
| 2 | Kalıcılık — `_kmTakimlar` konum bazlı+tarih damgalı localStorage'a taşındı, maç-bitince-otomatik-sıfırlama kaldırıldı ("Yeni Turnuva" düğmesiyle değiştirildi) | `5661a73` |
| 3 | Takım boyutları — 2-5 takım (5. renk: `--aurora-violet`), takım başı 5 kişiye kadar, round-robin "Otomatik Dağıt" (seviyeye göre denge YOK), düzenlenebilir isim/renk + bunun açtığı gerçek bir XSS yüzeyinin kapatılması | `8c59937` |
| 4 | Turnuva ağacı — Arena'nın eşleştirme kalıbı kopyalanıp takımlara uyarlandı, tur tur ilerleyen eleme ağacı, bay geçme, finale-uzaklık bazlı tur adlandırma (Çeyrek Final/Yarı Final/Final), "↩️ Düzelt" ile geri alma, gerçek bir ciddi-mod bayrak hatasının yakalanıp düzeltilmesi | `b66e0ce` (elle atılmış, içerik doğrulandı — bkz. 16f) + `d8af076` |
| 4 eki | Turnuva şampiyonu → `_kmYarismaGecmisi`/PDF raporu (eskiden sadece Hayali Rakip besliyordu); bu sırada `kmYarismaRaporuPDF()`'in sert 2-takım varsayımı bulundu ve düzeltildi (3+ takımlı bir turnuva PDF'i eskiden takımları sessizce keserdi) | `1ceb09c` |

### Kalıcı kararlar (gelecekte "neden böyle yapılmış" diye sorulursa)

- **Arena'yla ortak bileşene ZORLANMADI** — eşleştirme kalıbı bilerek KOPYALANDI (`kmYarismaBracket*`,
  Arena'nın `_kmOyunArena*`sine hiç dokunulmadı). Gerekçe: Arena üretimde çalışan, test edilmiş bir
  özellik, ortak soyutlama o kodu riske atardı. Bedeli: aynı desen iki yerde ayrı yaşıyor.
- **"Hayali Rakip" tamamen ayrı, eski akışında kaldı** — turnuva kavramı 1 simüle rakibe uymuyor.
  `kmYarismaBaslat`/`kmYarismaSkorbordCiz`/`kmYarismaBitir`'e HİÇ dokunulmadı.
- **Maç sonucunu SADECE koç belirler** — otomatik/timer'lı bitirme YOK, mevcut skor state machine'ine
  dokunulmadı (proje kuralı: skor/veri katmanı onaysız değiştirilmez). Canlı puan salt-okunur bilgi.
- **Kalıcılık için ayrı bir yol AÇILMADI** — turnuva ağacı da Stage 2'nin AYNI konum-bazlı, tarih-
  damgalı localStorage paketine eklendi.

### Bilerek ele ALINMAYAN / kalan iş kalemleri

1. Eski "gerçek çok-takımlı" düz skorbord dalı (`kmYarismaSkorbordCiz` içinde) koddan SİLİNMEDİ ama
   artık hiçbir UI yolundan ulaşılamıyor — çalışan kodu silmenin riskine girilmedi, gerekirse geri
   açmak kolay.
2. Turnuva girdilerinde MVP hesaplanmıyor (`mvpAd` hep `null`) — Hayali Rakip/eski düz mod MVP
   hesaplıyor, turnuva modunda bu kavram henüz karşılığı olmayan bir iş.
3. "📋 Geçmiş" (turnuva PDF'leri dahil) SADECE kurulum ekranında görünüyor — şampiyon olduktan sonra
   koç oraya dönmek için "🔄 Yeni Turnuva"ya basmak zorunda (turnuva zaten geçmişe kaydedildiği için
   veri kaybı yok, ama akış küçük bir sürtünme). Kullanıcı istemedi, dokunulmadı.
4. Main-app "Yarışmalar" (§2f, `#icerik-takimlar`/`elemeAgaciOlustur`) tamamen ayrı, dokunulmadı —
   iki sistem kasıtlı olarak birleştirilmedi.

### 16a. Stage 1 — Teşhis (kod değişikliği yok)

Kullanıcının "eşleşmeler kayboluyor" şikayeti ile "eleme ağacı/Çeyrek Final-Yarı Final-Final" beklentisi
AYNI ekrana ait değildi — kod okumasıyla doğrulandı: Karışık Sınıf'ın Yarışma sekmesinde hiçbir zaman
eşleşme/bracket YOKTU (düz çok-takımlı puan farkı), o yüzden hem "kayboluyor" hem "eleme ağacı" aynı
anda doğru olamazdı. Asıl bracket+tur-adlandırma (§2f'deki main-app Yarışmalar) zaten iyi kalıcıydı
(`bracketleriKaydet()` → localStorage + bulut senkron birleştirme) — kullanıcıya İKİ ekranın da gerçek
durumu ayrı ayrı raporlandı, `AskUserQuestion` ile hangisinin hedef olduğu netleştirildi: **Karışık
Sınıf'ın KENDİ Yarışma sekmesi, mevcut haliyle** (bracket'sız) — yani Stage 3-4 mevcut bir mekanizmayı
GENİŞLETMEK değil, eşleşme/tur fikrini SIFIRDAN kurmak anlamına geliyor.

Teşhis sonucu: `_kmTakimlar` ([app.js:16377] civarı) salt bellekte yaşayan bir `let`, HİÇ
localStorage'a yazılmıyordu (tek istisna: `_kmYarismaGecmisi`, o da sadece BİTMİŞ maç geçmişi).
Sekme içi geçiş `_kmTakimlar`'a dokunmuyordu (`kmSekme`/`kmIzgaraGeriDon` temiz), ama TAM SAYFA
YENİLEME (tablet arkaplanda kapatılması/PWA yeniden başlaması dahil) garanti sıfırlıyordu — gerçek
şikayetin en olası kaynağı buydu.

### 16b. Stage 2 — Kalıcılık düzeltmesi (tamamlandı, deploy edildi)

**Depolama kararı** (kullanıcı onaylı): localStorage, konum bazlı (`dag_km_yarisma_kurulum_<konum>`,
`dag_km_liste_<konum>` ile AYNI isimlendirme deseni), main-app Yarışmalar'ın `bracketleriKaydet()`
deseniyle birebir — yeni migration/route/senkron döngüsü YOK. Kayıt tarih damgalı: farklı güne aitse
geri yüklenmez VE anahtar silinir, böylece eski bir dersin kurulumu farkında olmadan geri gelmez, ayrı
bir temizlik görevi de gerekmez (bir sonraki girişte kendiliğinden temizlenir).

**Davranış değişikliği (kullanıcı onaylı, bilerek)**: eskiden `kmYarismaSifirla()` hem ders bitişinde
HEM DE her maç bitişinde otomatik çağrılıyordu — kalıcılık eklense bile kurulum saniyeler içinde
silinirdi. `kmYarismaSifirla()` ikiye ayrıldı: `_kmYarismaAktifMaciTemizle()` (SADECE aktif maçı
kapatır — zamanlayıcı/can/hayali-rakip geçici state, takıma DOKUNMAZ) artık maç bitişinde çağrılıyor;
TAM `kmYarismaSifirla()` (takımları da sıfırlar + localStorage anahtarını siler) sadece ders bitişinde
(`kmDersiBitir`) ve yeni "🔄 Yeni Turnuva" düğmesinde (`kmYarismaYeniTurnuva()`, kurulum ekranının
başlığında, sadece dolu bir takım varsa görünür, `confirm()` korumalı).

**Gerçek Playwright testiyle doğrulandı** (5 senaryo): (1) gerçek sporcularla takım kurulup maç
başlatılıp bitirildi — kurulum SİLİNMEDİ; (2) sekmeden çıkıp geri girildi — kurulum durdu; (3) **tam
sayfa yenileme + yeniden PIN girişi + Karışık Sınıf'a yeniden giriş** (asıl şikayet senaryosu) —
takımlar/üyeler AYNEN geri geldi; (4) "Yeni Turnuva" — kurulum boşaldı; (5) bir gün önceki tarihle
elle bayatlatılmış kayıt — geri yüklenmedi, boş kaldı (öz-temizlik kuralı doğrulandı). Ayrıca: diğer
10 Karışık Sınıf aracı + Oyunlar hatasız çizildi, skor girme paneli piksel piksel aynı kaldı,
360/1280/1920px hepsi temiz. Test PIN'i sonrasında gerçek `egitmen_hash`'e geri alındı.

Sıradaki: Stage 3 (takım boyutları — 2-5 takım, takım başına 5 kişiye kadar, açıkta kalan mesajı,
otomatik dağıtım, düzenlenebilir isim/renk) ve Stage 4 (görsel — eşleşme/eleme ağacı arayüzü, SIFIRDAN
kurulacak, 16a'daki netleştirmeye göre).

### 16c. Stage 3 — Takım boyutları (tamamlandı, deploy edildi)

**Önce mevcut sınır raporlandı**: 2-4 takım (`KM_TAKIM_RENKLERI` 4 renkli), takım başına 1-4 kişi
(`formatBtn` `[1,2,3,4]`). Genişletme: 2-5 takım + 5. renk (`--aurora-violet`), takım başına 5 kişiye
kadar — sadece iki dizi sınırı değişti (`[2,3,4,5]`/`[1,2,3,4,5]`), kurulum akışının geri kalanı
AYNEN kaldı ("mevcut kurulum mantığını genişlet, yeniden yazma" talimatına uyularak).

**Otomatik dağıtım** — YENİ bir buton yerine var olan "🎲 Rastgele Karıştır" GENİŞLETİLDİ (etiketi
"🎲 Otomatik Dağıt" oldu, fonksiyon adı `kmYarismaRastgeleKaristir` aynı kaldı — iki ayrı, örtüşen
buton olmasın diye bilinçli tercih). Eski hali havuzu karıştırıp `slice(idx*format,(idx+1)*format)`
ile blok blok bölüyordu — havuz format×takım sayısından küçükse İLK takımlar dolup SONRAKİLER aç
kalabiliyordu (eşit değildi). Yeni hali: karıştır, sonra TEK TEK DÖNGÜSEL (round-robin) dağıt — her
takım format sınırına ulaşana kadar sırayla dolar, sayılar en fazla 1 farkla eşitlenir. Kullanıcı
isteği gereği hiçbir yerde sporcu ortalamasına göre denge YOK, sadece rastgelelik + round-robin.
Havuz kapasiteyi aşarsa kalan "açıkta" — hem bir toast (`"N sporcu açıkta kaldı — takımlar dolu."`)
hem kurulum ekranında kalıcı bir satır (`havuz.length===1` tekil/`>1` çoğul cümle, Arena Stage 1'in
"[İsim] bu turda açıkta" üslubuyla aynı) gösteriyor — sadece en az bir takım doluyken (`doluTakimSayisi
> 0`) görünüyor, boş bir ekranda yanlışlıkla alarm vermesin diye.

**İsim/renk düzenleme**: isim artık serbest metin bir `<input>` (onchange → `kmYarismaTakimAdiDegis`),
renk sabit `KM_TAKIM_RENKLERI` listesinden tıkla-seç bir nokta sırası (`kmYarismaTakimRenkSec`) —
renk SERBEST metin değil, enjeksiyon riski yok. Kalıcılık için AYRI bir kayıt yolu AÇILMADI — isim/
renk zaten `_kmTakimlar` nesnesinin bir parçası, Stage 2'nin `_kmYarismaKurulumKaydet()`'i tüm diziyi
zaten JSON olarak kaydediyor.

**Gerçek bir güvenlik bulgusu, kendiliğinden düzeltildi**: takım isimleri bugüne kadar HEP makine
üretimliydi ("Takım 1", zorluk adı) — hiçbir render noktası kaçırma (esc()) yapmıyordu çünkü hiç
gerek yoktu. Serbest metin olunca bu ~12 render noktası (kurulum kartı, gerçek/hayali skorbord,
geçmiş listesi, PDF raporu, Oturum Arşivi modalı) gerçek bir HTML-enjeksiyon yüzeyi haline geldi.
Hepsi `esc()` ile kaçırıldı (paylaşılan `esc()`, app.js:584 — bkz. [[dagsk-genel-kontrol-2026-08]]'in
"3 gerçek XSS açığı" kalıbı, AYNI sınıf hata). **Gerçek bir `<b>XSS</b>` payload'ıyla test edildi**:
takım adı olarak girildi, ekran görüntüsünde `<input>` alanında DÜZ METİN olarak (`&lt;b&gt;` kaçmış
halde) göründü, kalın yazılmadı — DOM'da gerçek bir `<b>` etiketi OLUŞMADI, sadece görüntülendi.

**Playwright ile doğrulandı**: 2/3/5 takım kurulumları (ekran görüntüsü alındı, 8 kişilik gerçek
roster'la 3 takımda 3/3/2 — round-robin'in eşitliği; 5 takım+1v1'de 5 atandı/3 açıkta — hem toast hem
kalıcı satır göründü), isim+renk değişikliği aynı anda test edildi, 360/1280px temiz, diğer sekmeler
ve skor paneli piksel piksel aynı kaldı, `node --check` temiz. Test PIN'i sonrasında gerçek
`egitmen_hash`'e geri alındı.

Sıradaki: Stage 4 — görsel eşleşme/eleme ağacı arayüzü. Kullanıcı talimatı: Düello Arena'nın (§15)
eşleştirme ekranını (sporcuya dokun→eşleş, otomatik eşleştir, eşleşme listesi) buraya uyarla — AYNI
kalıp iki yerde iki farklı arayüz olarak tekrarlanmasın. Fark: Arena bire-bir düello (tur kavramı yok),
burası turnuva (tur tur ilerler, kazanan üst tura çıkar, görünür eleme ağacı — Çeyrek Final/Yarı
Final/Final adlandırmasıyla, dallar finale birleşir). Takım renkleri ağaç+liste+sonuç ekranında HEP
aynı olacak.

### 16d. Stage 4 — Turnuva ağacı (tamamlandı, deploy edildi)

**Mimari karar — kopyala/uyarla, ortak bileşene ZORLAMA**: Düello Arena'nın Stage 1 eşleştirme kalıbı
(dokun→seç, tekrar dokun→eşleş, 🎲 Otomatik Eşleştir, kaldırılabilir eşleşme listesi) YENİ, PARALEL
bir fonksiyon setine (`kmYarismaBracket*`) KOPYALANDI, Arena'nın kendi state'ine (`_kmOyunArena*`) hiç
dokunulmadı. Gerekçe (kullanıcı onaylı): Arena üretimde çalışan, 4 aşama boyunca test edilmiş bir
özellik — ortak bir soyutlamaya zorlamak o kodu riske atardı. Bedeli: aynı etkileşim deseni iki yerde
ayrı ayrı yaşıyor, ileride biri değişirse öbürü otomatik takip etmez — bu bilinçli bir ödünleşim.

**"Gerçek Takım" modu artık turnuvaya gidiyor, "Hayali Rakip" HİÇ değişmedi**: turnuva kavramı 1
simüle rakibe uymadığı için Hayali Rakip eski akışında (`kmYarismaBaslat`/`kmYarismaSkorbordCiz`/
`kmYarismaBitir`, hiç dokunulmadı) kaldı. Gerçek Takım'da "Yarışmayı Başlat" düğmesi
"▶ Turnuvayı Başlat (Eşleştir)" oldu ve `kmYarismaBracketEslestirmeyeGec()`'e gidiyor. Eski "gerçek
çok-takımlı" skorbord dalı (`kmYarismaSkorbordCiz` içinde) SİLİNMEDİ ama artık hiçbir UI yolundan
ULAŞILAMIYOR — bilinçli olarak: çalışan kodu silmek yeni bir risk, gerekirse geri açmak kolay.
"Ortak Tur Süresi" seçici de artık sadece Hayali Rakip'te görünüyor (turnuvada süre/timer YOK, kazananı
SADECE koç seçiyor — aşağıya bkz).

**Maç sonucunu SADECE koç belirler, otomatik/canlı-bitirme YOK**: her aktif maç kartında iki takım
adına dokunmak o takımı kazanan ilan eder — ana uygulamanın mevcut bracket'inin (`setSonucu`, §2f)
elle-sonuç kalıbıyla AYNI, ama mevcut `kmYarismaBaslat/Bitir`/zamanlayıcı state machine'ine HİÇ
dokunulmadı (proje kuralı: skor/veri katmanı onaysız değiştirilmez). "Canlı puan" yine de gösteriliyor
— Stage 2/3'ün AYNI skor-farkı formülüyle (`Math.max(0, toplam-baz)`), ama `baz` her MAÇA ÖZEL bir
anlık görüntü (maç kurulurken alınıyor, `_kmYarismaBracketBaslangicSnapshot`) — global
`_kmYarismaBaslangicPuan`'a hiç dokunmuyor, salt okunur.

**İstek #1 — bay geçme açıkça gösteriliyor**: takım sayısı 2'nin katı olmadığında (3, 5) eşleştirme
ekranında havuzda TEK takım kalırsa turuncu bir uyarı satırı çıkıyor ("⚠️ [Takım] bu turda açıkta — eşi
yok, otomatik bir üst tura çıkacak (bay)."), "Turnuvayı Başlat"a basılınca o takım için otomatik
`durum:'bitti'` bir "bay" maçı üretiliyor ve ağaçta KENDİNE ÖZGÜ, kesikli çerçeveli bir kart olarak
("🎫 [Takım] bay geçti — otomatik üst tura çıktı.") ayrı gösteriliyor — normal bir maç gibi GÖRÜNMÜYOR,
koç nedenini görüyor. 5 takımda bu zincirleme iki kez de olabiliyor (round1'de 1 bay, round2'de 1 bay)
— gerçek testte doğrulandı.

**İstek #2 — kalıcılık, Stage 2'nin AYNI mekanizması, yeni bir yol AÇILMADI**: `_kmYarismaBracketGorunum/
Eslesmeler/Maclar/ToplamTur` Stage 2'nin `_kmYarismaKurulumKaydet/Yukle()`'sindeki AYNI pakete, AYNI
tarih damgasına eklendi. Bir gün önceki tarihle bayatlatılmış bir turnuva verisi gerçek testte
doğrulandı: geri yüklenmedi, temiz kurulum ekranına düştü.

**İstek #3 — geri alma (küçük düzelt, tam sıfırlama değil)**: bitmiş her maçın altında "↩️ Düzelt"
var. Basınca SADECE o maç `devam`'a döner VE bu takımın kazandığı varsayımıyla ÜRETİLMİŞ bir sonraki
tur (henüz oynanmamışsa) tamamen silinir — ağaç o sonuca göre kurulmuştu, yanlış kazananla üretilmiş
bir sonraki tur anlamsız kalırdı. O sonraki maç ZATEN bitmişse (koç orada da ilerlemişse) geri alma
engellenir ("önce o sonucu geri al" uyarısı) — sessizce ağacı bozmasın diye. Gerçek testte doğrulandı:
3 takımlı bir turnuvada round1 geri alındı, round2 (finale) tamamen silindiği görüldü, yeniden
oynanıp şampiyona ulaşıldı.

**Tur adları — maç sayısına göre DEĞİL, finale olan uzaklığa göre**: bay'lı turlarda maç sayısı
yanıltıcı olurdu (3 takımda 1. tur sadece 1 gerçek maç içeriyor ama Final DEĞİL, Yarı Final'dir — 2.
tur hâlâ var). `_kmYarismaTurAdi(tur, toplamTur)`, `toplamTur = Math.ceil(log2(takımSayısı))`
üzerinden "finale kaç tur kaldığı"na bakıyor: 0→FİNAL, 1→YARI FİNAL, 2→ÇEYREK FİNAL. 2/3/4/5 takımın
hepsinde gerçek oynatılarak doğrulandı (2→direkt FİNAL, 3 ve 4→YARI FİNAL sonra FİNAL, 5→ÇEYREK FİNAL
sonra YARI FİNAL sonra FİNAL, 3 tur boyunca zincirleme bay dahil).

**Renk tutarlılığı**: hiçbir yerde renk KOPYALANMIYOR — eşleştirme ekranı, maç kartları, şampiyon
kutusu HEP `_kmTakimlar[idx].renk`'i canlı okuyor (indeks referanslı model). Stage 3'te bir takımın
rengi değiştirilirse ağaçtaki HER görünüm otomatik takip eder, ayrı senkron gerekmez.

**Gerçek bir ikinci güvenlik/mantık bulgusu, kendiliğinden yakalandı**: ilk yazımda şampiyon
kutlamasını `kutlamaKuyrukEkle`'nin kendi `kutlamalarSessiz` bayrağına güvenerek tetikliyordum — ama
o bayrak SADECE `_seriSonrasiOdulVeLog`'un geçici bir sarmalayıcısı (finally'de hep `false`'a dönüyor),
Ciddi Mod'un GERÇEK göstergesi değil. Test ciddi modu doğrularken bu fark edildi: Oyunlar/Arena'nın
HER YERDE kullandığı gerçek desen (`typeof ciddiModAcik !== 'undefined' && ciddiModAcik`) yerine
konuldu, ciddi modda kutlama/konfeti KAPALI ama şampiyon kutusu (sonuç) YİNE görünür olduğu gerçek
testle doğrulandı.

**XSS**: takım adları serbest metin olduğu için (Stage 3'ten miras) eşleştirme ekranı, maç kartları,
şampiyon kutusu — hepsi `esc()` ile kaçırıyor. Gerçek `<img src=x onerror=...>` payload'ıyla test
edildi, hem eşleştirme hem ağaç ekranında `innerHTML`'de gerçek bir `<img>` etiketi OLUŞMADI.

Test PIN'i sonrasında gerçek `egitmen_hash`'e geri alındı, `node --check` temiz, diğer 10 Karışık
Sınıf aracı + Oyunlar hatasız çizildi, skor paneli piksel piksel aynı kaldı, 360/1280px temiz.

**Faz 13 bu noktada durumu**: Stage 1-4 tamamlandı.

### 16e. Turnuva şampiyonu → geçmiş/PDF (tamamlandı, deploy edildi)

16d'de bilinçli olarak ele alınmamıştı — kullanıcı istedi: "yarısı Hayali Rakip yarısı Gerçek Takım
olmasın." `kmYarismaBracketTurKontrolEt()`'in final dalı artık şampiyon belli olunca `_kmYarismaGecmisi`ye
`tur:true` işaretli bir girdi ekliyor (`takimlar[].puan` bu girdilerde skor farkı DEĞİL, turnuvada
kazanılan GERÇEK maç sayısı — bay'lar hariç, alan adı mevcut renderer'la uyumlu kalsın diye aynı
bırakıldı). Girdi, kazanan maça (`finalMac._gecmisGirdisi`) asılı tutuluyor: koç finali "↩️ Düzelt"le
geri alırsa (yanlış şampiyon işaretlemişse) o kayıt geçmişten/PDF'ten de SİLİNİYOR, yeniden karar
verilince DOĞRU sonuçla tekrar ekleniyor — yarım/yanlış bir kayıt kalıcı kalmıyor.

`kmYarismaRaporuPDF()` eskiden `let [ta,tb]=k.takimlar` ile SERT 2 takım varsayıyordu (3+ takımlı bir
turnuva girdisinde takım 3+ sessizce KAYBOLURDU) — `k.tur` kontrolüyle ayrıldı: turnuva girdileri esnek
bir `flex-wrap` ızgarada TÜM takımları gösteriyor (sabit `KM_YARISMA_PDF_RENKLERI`, 5 renk — canlı
ekranın koyu-zemin `KM_TAKIM_RENKLERI`si beyaz PDF'te düşük kontrast kalırdı, PDF'e özel ayrı palet),
rozet "TURNUVA RAPORU — NvN · X Takım", yorum metni "turnuvayı kazandı" diline geçiyor. Eski 2 takımlı
(Hayali Rakip) dal HİÇ değişmedi. Gerçek testte doğrulandı: 3 takımlı bir turnuva sonuna kadar
oynatıldı, `kmYarismaGecmisiHTML()` çıktısında "undefined" YOK, PDF şablonu (html2pdf'in save()'i
stub'lanıp temp div canlı tutularak) ekran görüntüsüyle doğrulandı — şampiyon altın çerçeveli, 3 takım
da düzgün ızgarada, "KAZANILAN MAÇ SAYISI" etiketi doğru. Final geri alınınca geçmiş kaydının da
silindiği (1→0) ayrıca doğrulandı.

### 16f. "perşembe 22:00" commit soruşturması (2026-09-10)

Bu fazın ortasında yerel `main`'de kullanıcının ATMADIĞINI belirttiği bir commit bulundu:
`b66e0ce "perşembe 22:00"`, yazar/committer BURAK <burakdaglioglu@gmail.com>, Thu Sep 10 21:40:34
2026 +0300, imzasız. İçeriği tam olarak o an yazılmakta olan Stage 4 bracket kodu (245 satır ekleme) —
zararlı/yabancı bir şey YOK, ama kaynağı bilinmiyordu. Kullanıcı isteğiyle 5 noktadan araştırıldı:

1. `.git/hooks/` — SADECE `.sample` dosyalar var, hiçbiri aktif değil. Hook DEĞİL.
2. `.git/config` — `core.hooksPath` override yok, şüpheli alias yok.
3. VS Code — kullanıcı `settings.json`'da (`%APPDATA%\Code\User\settings.json`) tek satır var
   (`claudeCode.preferredLocation`), hiçbir `git.*` ayarı YOK; zaten VS Code'un varsayılan/yerleşik bir
   "periyodik otomatik commit" özelliği hiç yok. Kurulu eklentiler sadece 2 tane: Claude Code'un kendisi
   + bir PDF görüntüleyici — commit otomasyonuyla ilgili hiçbir eklenti YOK.
4. `package.json`/repo scriptleri — `git commit`/`git add` çağıran hiçbir script yok.
5. Başka bir Claude oturumu — `ListAgents` o an ulaşılabilir başka bir oturum göstermedi; süreç listesi
   tüm gün boyunca TEK bir `claude` süreci gösterdi (12:18'de başlamış, commit saatinden çok önce).
   Windows Görev Zamanlayıcı'da da git/backup ile ilgili özel bir görev yok (sadece standart Windows
   sistem görevleri).

**Bulunan tek somut ipucu**: bir `cmd.exe` (PID 4716) + `WindowsTerminal` (PID 23896) çifti tam
**21:40:02-03**'te başlamış — commit'ten SADECE 32 saniye önce. PowerShell (PSReadLine) geçmişinde bu
saate ait bir `git commit` komutu YOK (cmd.exe'nin kendi geçmişi diske kalıcı yazılmıyor, bu yüzden
kanıt bekleniyordu değil). **Sonuç**: 4 otomasyon yolu da (hook/config, VS Code, proje scripti,
zamanlanmış görev) NEGATİF — kapatılacak bir şey bulunamadı. Kanıtlar (yeni açılan bir terminal
penceresi, hemen ardından gelen commit) elle, bir terminalden atılmış bir commit'e işaret ediyor,
otomatik bir mekanizmaya değil. Kim attığı OS kayıtlarından çıkarılamadı — kullanıcıya "sizin
bilgisayarınızda o saatte başka biri/bir şey olabilir mi" sorusu açık bırakıldı.

## 17. Faz 14 — Zirve Yolu gerçek tırmanış (5 adım, gece görevi 2026-09-12/13)

**Bağlam**: kullanıcı "Zirve Yolu" temasının adına rağmen düz/yatay bir yol olduğunu, tırmanış
hissi vermediğini bildirdi. 5 aşamalı bir plan onaylandı (1-3 aşama akşam onaylı yapıldı, kullanıcı
sonra "uyuyacağım, sen bu oyunu tamamla, yayına çık, bana sorma" diyerek 4-5. adımları VE deploy'u
onay beklemeden tamamlamamı istedi — bu bölüm o gece işinin TAMAMINI belgeliyor).

### 17a. Adım 1 — Serpantin patika + dikey kamera takibi

`<path id="km-oyun-trail">`'in `d`'si tek seferlik elle yeniden çizilmedi — 20 noktalık bir dizi
(`KM_OYUN_ZIRVE_YOL_NOKTALARI`) + bir orta-nokta yumuşatma algoritması (`kmOyunZirveYolDStr`) ile
üretiliyor, aşağıdan yukarı 5 bacaklı gerçek bir switchback. `kmOyunZirveNokta(frac)` imzası
DEĞİŞMEDİ. Kamera dikey takibi YENİ bir mekanizma GEREKTİRMEDİ — `kmOyunKameraGuncelle`'in var olan
zum penceresi zaten hem x hem y'yi merkezliyordu, sadece patikanın kendisi dikey olunca otomatik
çalışmaya başladı.

**Bulgu ve düzeltme (kullanıcı istedi)**: dik bacaklarda eski `kmOyunJitter` (küresel x/y ofseti)
karakterleri artık doğru ayrıştırmıyordu. Pist'in teğet+normal tekniğinin Zirve'ye özel bir ikizi
yazıldı: `kmOyunZirveTeget`/`kmOyunZirveJitter`/`kmOyunZirveKonum` — AYRICA yeni bir risk ortaya
çıktı (büyük yayılma payı artık dikey eksene düşüp karakterleri kanvas dışına taşırabilirdi),
Zirve'ye özel bir dikey kelepçe (`KM_OYUN_ZIRVE_Y_PAY`) eklendi.

**360px "geniş" görünüm — iki aşamalı düzeltme**: (1) önce SADECE "yakın" kameranın zum penceresi
kutunun gerçek oranına göre daraltıldı (`kmOyunZirveKutuOrani`/`kmOyunZirveGenisKutu`) — dikey alan
kullanılmaya başladı ama en dıştaki bacaklar kırpılıyordu. (2) kullanıcı "kırpılmayı kabul etmeden
önce dene" dedi — patikanın KENDİSİ dar kutularda x=600 etrafında sıkıştırılıyor
(`kmOyunZirveYolSenkron`, AYNI 20 nokta + AYNI yumuşatma, sadece x'ler ölçekli), 0.22 tabanlı (altı
okunaksız olurdu). Sonuç: 360px'te artık hiçbir bacak kayboluyor, en dar durumda bile sadece
birkaç dünya-biriminlik (gözle fark edilmeyen) bir pay kalıyor. Gerçek pencere yeniden boyutlandırma
için `#km-oyun-panel-zirve` üzerinde bir `ResizeObserver` kuruldu.

### 17b. Adım 2 — Dağ arka planı + dikey parallax

Sky gradyanı (koyu altta/açık üstte), 3 derinlik katmanı (`km-oyun-zirve-dag-uzak/orta/yakin`, hız
0.15/0.35/0.6 — `kmOyunZirveParallaxUygula`, formül: `ty = kameraY*(1-hiz)`, `kmOyunKameraHedefeGit`
tween'inin HER karesinde SADECE `svg.id==='km-oyun-svg-zirve'` iken çağrılıyor). Eski 3 prosedürel
silüet (kmMtn1/2/3) ATILMADI — daha uzun ölçeklendi + koyu kaya/orman yeşili→beyaz kar/buz gradyanına
çevrildi. `zirve-dag-mavi.webp`'in 7 kopyası (uzak: küçük/soluk/bulanık, yakın: büyük/net) üç
katmana dağıtıldı. Yıldızlar artık sadece alt/koyu banda (y 250-440).

### 17c. Adım 3 — Gerçek karakterler + kamp isimleri

**Cinsiyet kontrolü** (kullanıcı istedi): `athletes.cinsiyet` GERÇEKTEN var (migration 0003, 'K'/'E',
2026-07'den beri dolduruluyor, 12 kullanım yeri) — "sırayla dağıt" yedek planı hiç gerekmedi. Atama
deterministik: K→`zirve-tirmanici-kiz`, E→`zirve-izci-erkek`, boş/nadir eski kayıt→`zirve-buz-tirmanici`
(kullanıcının kendi "üçüncü seçenek"i). Cinsiyet sabit olduğu için ayrı bir localStorage hafızası
GEREKMEDİ (Arena'nın sıralı atamasından farklı). `_kmOyunRosterCache`'e SADECE Zirve'nin okuduğu
saf-katkısal bir `cinsiyet` alanı eklendi (`kmOyunRosterYenile`).

Eski paylaşılan `kmOyunKarakterSVG` (6 temalık soyut maskot) yerine Zirve'ye özel
`kmOyunZirveKarakterSVG` — takım rozeti/kilit-çerçevesi/nefes animasyonu KORUNDU, sporcu fotoğrafı/baş
harfi ARTIK YOK (Arena'nın okçu kararıyla AYNI gerekçe: gerçek illüstrasyonun yüzü yok). Dağ
Tırmanışı (`kmOyunSahneKurDag`/`kmOyunKarakterSVG(...,'dagci',...)`) AYRI bir tema, hiç dokunulmadı —
doğrulandı.

**Kamp isimleri**: 7 durak (Orman Kapısı→Son Kamp) + Zirve (statik metin, `#km-oyun-summit` içinde).
Eski numaralı bayrak yerine `zirve-ahsap-tabela.webp` + isim metni; "geçildi" göstergesi artık
sporcunun rengiyle parlayan küçük bir rozet halkası (`kmOyunZirveBayrakGuncelle`).

### 17d. Adım 4-5 — Yükseklik, kar fırtınası, ekipman (gece, ONAY BEKLENMEDEN tamamlandı)

**SAYI UYUŞMAZLIĞI bulundu, EN MUHAFAZAKÂR şekilde çözüldü, ONAY BEKLİYOR**: "her kontrol noktası
bir ekipman açsın" dendi ama 7 durağa karşı SADECE 5 ekipman kalemi (halat/kramponlar/buz baltası/
oksijen tüpü/telsiz) verildi. Kullanıcı uyuduğu için sorulamadı. 5 kalem EN DOĞAL 5 durağa
yerleştirildi — `KM_OYUN_ZIRVE_CP_EKIPMAN = {0:'telsiz', 1:'halat', 3:'buzbaltasi', 4:'kramponlar',
5:'oksijen'}` (Şelale ve Son Kamp'ta YENİ ekipman yok, sadece dinlenme noktası — gerçek dağcılıkta da
her kamp malzeme vermez). Oksijen BİLEREK fırtına bölgesinden (frac .8) ÖNCEKİ durağa (Rüzgâr Sırtı,
.75) değil, "ince hava" cezasının BAŞLADIĞI yerden (Buzul, .625) SONRAKİ bir durağa kondu — böylece
"oksijensiz ince hava" cezasının GERÇEK bir penceresi (.625→.75 arası) oluşuyor; ekipman hep BİR
ÖNCEKİ durakta açılsaydı ceza asla ELE GEÇMEZ bir duruma düşerdi (frac tek yönlü arttığı için bir
durağı geçmeden geriye o durağın ekipmanı olmadan "yüksek irtifada" bulunmak imkansız olurdu).

**Yükseklik**: `Math.round(frac*3000)` m, `#km-oyun-zirve-hud` — SVG dünya-koordinatlarının DIŞINDA,
`#km-oyun-sahne`'nin paylaşılan overlay katmanında (`#km-oyun-sirada` ile AYNI konum deseni) —
SVG içinde olsaydı kamera "yakın" zum yaptığında dünya-sabit bir HUD ekrandan kayıp giderdi.

**Kar fırtınası**: frac ≥ .8 (Rüzgâr Sırtı sonrası, Son Kamp'a doğru son çıkış). `zirve-kar-tabelasi.webp`
girişte duruyor (`kmOyunZirveNokta(0.8)`'de dinamik konumlanıyor — sıkıştırılmış patikada da doğru
yerde kalır). O bölgede her 'M' EKSTRA `KM_OYUN_ZIRVE_STORM_CEZA_ISKALAMA=0.025` frac kaybettiriyor
— ilerleme durmakla kalmıyor, gerçekten GERİ KAYABİLİYOR (`yeniFrac` alt sınırı olmayan tek satıra
`Math.max(0,...)` eklendi — diğer 9 temada artis hep ≥0 olduğu için bu davranışlarını DEĞİŞTİRMEDİ).
Kar görseli — Dağ Tırmanışı'nın `kmKayaDusme` deseninin AYNISI (düşen parçacık, reduced-motion
otomatik kapatıyor), "aşırıya kaçmasın" (kullanıcı talimatı): ciddi modda 7, normalde 14 parçacık.

**Ekipman**: durak geçilince `kmOyunZirveEkipmanKontrol` — durum (`d0.zirveEkipman`, D1'e YAZILMIYOR)
ve HUD şeridi HER ZAMAN güncellenir; SADECE banner+ses ciddi modda susuyor (DEVIR §15g kuralıyla
BİREBİR aynı ayrım). Oksijen tüpü kazanılmadan (frac .625-.75 arası) ilerleme ×0.55 yavaş — GERÇEK
bir mekanik etki, süs değil (gerçek testte doğrulandı: 0.07425 vs 0.135 artis, oran tam 0.55).

**Kullanılmayan asset**: `zirve-rota-ikon.webp` hiçbir adımda kullanılmadı — orijinal 8 asset
listesinde vardı ama hiçbir adımın açıklamasında bir işlevi belirtilmemişti, bir amaç UYDURULMADI.
Kullanıcının nereye koymak istediğini sabah sorması gerekiyor.

**Ortak frac formülüne dokunulmadı**: `kmOyunZirveArtisHesapla`, Pist'in `kmOyunPistSetArtis`
EMSALİYLE birebir aynı desen (kullanıcının kendi talimatı: "gerekirse kendi dalında override et").
GERÇEK skora (`_skorKaydetCekirdek`, toplam) hiç dokunulmuyor — SADECE bu eğlence katmanının görsel
frac'ı etkileniyor.

### 17e. Doğrulama (5 adımın TAMAMI için)

Gerçek testle (sıfır etkili senaryo değil): ince hava oranı (0.55, sayısal doğrulandı), fırtına
cezası (temiz seri +0.135, 2 ıskalamalı seri -0.005 — GERÇEK bir `kmOyunOkGir`+`kmOyunIlerlet` akışıyla
frac 0.85→0.845 GERİ KAYDI doğrulandı), ekipman sıralı kazanımı (6 ardışık gerçek seri, 5 kalemin
hepsi doğru duraklarda, çoklu-durak-atlayan tek seride BİRDEN FAZLA ekipman doğru kazanılıyor), kar
parçacık sayısı (ciddi mod açık/kapalı 7/14, doğrulandı). 12 tema + Reaksiyon regresyon taraması ve
`node --check` her adımdan sonra temiz. 360/1280/1920/tam ekran hepsinde hatasız. Skor paneline
hiç dokunulmadığı `git diff`'te anahtar kelime taramasıyla teyit edildi.

**Bilinen küçük pürüz (düzeltilmedi, düşük öncelik)**: 360px'te `#km-oyun-sirada` (SIRADA kartı) ile
yeni `#km-oyun-zirve-hud` üst üste biniyor gibi görünüyor — işlevsel değil, sadece kozmetik, dar
ekranda iki üst-bar aynı köşede sıkışıyor.

**Deploy durumu**: TAMAMI (adım 1-5) commit + push + DEPLOY edildi — kullanıcının açık talimatı
("sen bu oyunu tamamla, yayına çık, bana sorma"). Commit `bd23ddc`, deploy version
`84cdb0b4-5c25-4eac-9123-ea2f52b006c3` (2026-09-12/13 gece).

**Beklenmedik dosyalar (dokunulmadı, sadece bildiriliyor)**: commit sırasında `public/hazine.png`
ve `public/korsan/korsan.png` untracked halde bulundu (23:59'da oluşturulmuş — muhtemelen kullanıcı
uyumadan hemen önce bir sonraki iş için bıraktı). Bu gece işinin HİÇBİR yerinde bahsi geçmediği için
bilerek DOKUNULMADI, commit'e dahil edilmedi — ama `wrangler deploy` public/ klasöründeki HER dosyayı
git'ten bağımsız yüklediği için bu deploy'la birlikte ONLAR DA canlıya çıktı (kod hiçbir yerde
kullanmıyor, sadece pasif statik dosya olarak duruyorlar, zararsız). Sabah ne için olduklarını
sormak gerekiyor.

## 18. Karışık Sınıf genel kontrol (2026-09-13, gece işi — "temel şeyleri kontrol et, düzelt, raporla")

**Kapsam**: kullanıcının "en sonunda karışık sınıf içerisinde temel şeyleri kontrol et düzelt
raporlar" talimatı üzerine yapılan bir denetim — SADECE okuma/gözlem + bugünkü değişikliklerin
(Zirve, Arena) kendi kendine denetimi. Skor/veri katmanına dokunma yasağı gereği hiçbir "düzeltme"
skor hesaplama/D1 yazma yoluna yapılmadı.

**Bulgular**:
1. **12 sekmenin tamamı** (yoklama/skor/lider/klasman/canlı/yarışma/veli/disiplin/pozitif/oyunlar/
   reaksiyon/ritim) `kmSekme()` ile tek tek gezildi, hepsi hatasız render oldu, boş/şüpheli bir
   ekran yok.
2. **Veri bütünlüğü** (salt okuma): `_kmListe`'deki (KM roster) her sporcu `turnuvaDB`'de karşılık
   buluyor — "listede olup gerçek kayıtta olmayan" sporcu YOK (bu, DEVIR'de daha önce belgelenen
   "yerel turnuvaDB bayatlık" hata sınıfının bir belirtisi olurdu — bulunmadı). Aidat senkron
   kuyruğu (`dag_aidat_bekleyen_putler`) boş — birikmiş, gönderilememiş bir yazma yok.
3. **Tonight'ın kendi değişiklikleri** (Zirve `cinsiyet` alanı eklemesi, yeni HUD, Arena "Yeni Oyun")
   `git diff` ile XSS açısından tekrar tarandı — her yeni `.ad` interpolasyonu (`kmOyunZirveKarakterSVG`
   etiketi, Arena "Yeni Oyun" butonu, kamp isimleri) zaten `esc()` içinden geçiyor, yeni bir açık
   bulunmadı.
4. **Ön yükleme hatası (ÖNCEDEN VAR, bu geceki işlerle İLGİSİZ, DÜZELTİLMEDİ)**: konsolda
   `@mediapipe/camera_utils@0.4.1675466862/camera_utils.js` için 404 + `ERR_ABORTED` görüldü —
   `DAGSK_AI_POSE` (video duruş analizi) özelliğinin kullandığı bir CDN betiği, o pinlenmiş sürüm
   artık jsDelivr'de yok gibi görünüyor. Karışık Sınıf'ın 12 sekmesinin HİÇBİRİNİ engellemiyor (sadece
   o AI-duruş özelliği muhtemelen çalışmıyor) — kapsam dışı bırakıldı, sabah ayrı bir karar gerekiyor
   (CDN sürümünü güncellemek mi, özelliği kaldırmak mı).

**Sonuç**: gerçek/aktif bir hata bulunmadı — bu yüzden bir "düzeltme" commit'i YOK, sadece bu rapor.

## 19. Arena — her düello için görünür "Yeni Oyun" + cinsiyete göre karakter (2026-09-13)

**"Yeni Oyun" artık her eşleşmede, her zaman görünür**: önceden sadece BİTMİŞ maçlarda çıkıyordu.
Kullanıcı istedi: "her spor karşılaşması için ayarla, butonu görünür yere yerleştir." `kmOyunArenaMacKartHTML`
artık `bittiMi` durumundan BAĞIMSIZ olarak "🆕 Yeni Oyun (A vs B)" butonunu HER kartta gösteriyor —
devam eden maçlarda "🔁 Diğer okçuya geç"in ALTINDA, dikkat çeksin diye turuncu/altın gradyanlı ayrı bir
renkte (`.km-arena-yeni-oyun-btn`, diğer nötr `km-oyun-geri-al-btn`'lerden BİLEREK farklı). Devam eden
bir maçı sıfırlamak GERÇEK ilerlemeyi (can/ok) kaybettirdiği için `confirm()` ile onay isteniyor
(`kmOyunTakimSifirla`'daki AYNI desen) — bitmiş bir maçta kaybedilecek bir şey olmadığı için onay
İSTENMİYOR (dünkü, zaten test edilmiş davranış korunuyor). Gerçek testle doğrulandı: devam eden bir
maçta buton görünür, tıklayınca confirm() çıkıyor, onaylanınca can/ok/en-iyi-seri sıfırlanıp maç
`etkin` oluyor, DİĞER maçlara hiç dokunulmuyor.

**Karakterler artık cinsiyete göre**: kullanıcı istedi: "karakterler kadına kadın erkeğe erkek olarak
ayarla." 6 okçu görseli tek tek incelenip sınıflandırıldı — kadın havuzu: `okcu-elf-kadin`,
`okcu-sari-sacli` (2). Erkek havuzu: `okcu-kirmizi-genc`, `okcu-orman-elfi`, `okcu-pelerinli` (3).
`okcu-tilki` (antropomorfik, insan değil, cinsiyeti belirsiz) — cinsiyet bilgisi YOKSA (nadir/eski
kayıt) nötr seçenek. Atama hâlâ sırayla-sabit (`_kmOyunArenaKarakterMap`, localStorage, D1'e
YAZILMIYOR, gün değişince sıfırlanıyor) ama artık KENDİ cinsiyet havuzu İÇİNDE sırayla dönüyor.
Aynı gün içinde ÖNCEKİ (sayısal indeks) şemadan kalma kayıtlar `typeof ... === 'string'` kontrolüyle
GEÇERSİZ sayılıp yeniden (doğru) atanıyor — yarım kalmış bir görsel referansı riski yok. Gerçek 8
sporculu testle doğrulandı: K→sadece kadın havuzundan, E→sadece erkek havuzundan, boş→tilki, %100 doğru.

Deploy: aşağıda §20 ile birlikte.

## 20. Hazine Adası — gerçek korsan karakterleri + hazine (2026-09-13)

**Bağlam**: kullanıcı `public/korsan/korsan.png`'deki ikonları Hazine Adası'na entegre etmemi istedi.
Dosya tek görsel değil, 15 ikonluk bir sprite sheet çıktı — `sharp` ile (proje `node_modules`'ında zaten
vardı, transitif bağımlılık) alfa-kanalı bağlı-bileşen tespitiyle otomatik sınır kutuları bulunup her
ikon ayrı transparan WebP'ye kırpıldı (`public/korsan-karakterler/`). 2 kırpımda komşu sprite'tan küçük
bir sızıntı bulunup elle düzeltildi.

**Bonus bulgu**: commit'ten önce fark edildi — `public/hazine.png` (AYNI gece, aynı dakikada
oluşturulmuş, daha önce §17'de "beklenmedik dosya" olarak not edilmişti) de İKİNCİ bir sprite sheet
çıktı: gerçek bir hazine sandığı, yakut, elmas, dürbün, katlı harita, ada haritası. Kullanıcının
talimatı SADECE "korsan" klasörünü işaret ediyordu ama bu ikinci dosya AÇIKÇA aynı iş için hazırlanmıştı
(plan sunulurken "elimde gerçek bir sandık görseli yok" denmişti, tam bunu kapatıyor) — kullanmamak
yanlış olurdu, o da aynı işin kapsamına dahil edildi ve kullanıcıya AYRICA bildirildi (rapor).

**Karakterler**: Arena/Zirve'deki AYNI kadın/erkek/nötr deseni (`kmOyunHazineKarakterAta`) — kadın
havuzu sadece 1 (`korsan-kiz-sise`, sette başka kadın karakter yok, asimetrik ama işlevsel — şeffafça
not edildi), erkek havuzu 3 (`korsan-cocuk-mavi/kanca`, `korsan-yasli-korsan`), cinsiyet yoksa
`korsan-papagan-harita` (tema zaten "hazine haritası", tam oturuyor). Eski paylaşılan
`kmOyunKarakterSVG(...,'kaptan',...)` çağrısı kaldırıldı, `kmOyunHazineKarakterSVG` gerçek illüstrasyon
kullanıyor — takım rengi/wake-izi/etiket mekanizmasına HİÇ dokunulmadı (`--_c` CSS değişkeni aynen).

**Sahne**: eski soyut mürekkep lekeleri (`km-blotch`) kaldırıldı, yerine `#km-oyun-hazine-dekor`
grubunda gemi dümeni, mesaj şişesi, yengeç, dürbün, ada haritası ve 3 papağan haritanın etrafına
dağıtıldı — Zirve'nin dağ katmanlarıyla AYNI "gerçek görsel dekor" mantığı, ama parallax YOK (Hazine'nin
rotası Zirve gibi dikey bir tırmanış değil, yatay bir harita — kamera zaten var olan zoom/pan'ı
kullanıyor, ek bir mekanizma gerekmedi).

**Kontrol noktaları**: numaralı mühür daireleri yerine gerçek altın sikke ikonu (`korsan-altin.webp`) —
"geçildi mi" göstergesi hâlâ AYNI `.km-seal-ring` elementi/`hit` class'ı (`kmOyunResyncHazine`/
`kmOyunAnimateHazine`'e HİÇ dokunulmadı), sadece CSS dolgudan çerçeveye döndü.

**Hazine (bitiş)**: eski prosedürel X+dikdörtgen sandık kaldırıldı, yerine gerçek `hazine-sandik.webp`
+ yanında yakut/elmas flörtü — glow (`km-treasure-glow`) AYNEN kaldı.

**Kullanılmayan dosyalar**: `public/korsan/korsan.png` (1.17MB) ve `public/hazine.png` (662KB) artık
kod tarafından hiç kullanılmıyor (sadece kırpılmış halleri, `korsan-karakterler/` altında ~500KB
kullanılıyor) — kullanıcıya silip silmeme kararı soruldu, YANIT BEKLENİYOR, bu yüzden bilerek
commit'e DAHİL EDİLMEDİ (git'te izlenmiyor) — ama `wrangler deploy` `public/`'daki HER dosyayı git'ten
BAĞIMSIZ yüklediği için deploy'a otomatik dahil olacaklar (zararsız, sadece gereksiz ~1.8MB).

Gerçek testle doğrulandı: 8 sporculu cinsiyet ataması %100 doğru, tüm görseller (27 image elemanı)
200 dönüyor, 12 tema + Reaksiyon regresyon taraması temiz, 360/1280px hatasız.
