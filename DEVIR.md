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
- `562199b` — Tasarım sistemi Faz 0-2: token katmanı, PALETLER düzeltmeleri, bileşen kütüphanesi *(Faz 0 envanteri + Faz 1 tokenler + Faz 2 PALETLER/bileşen kütüphanesi — üçü de aralarında commit atılmadan tek commit'te toplandı, bkz. Kurallar bölümü)*
- Bu commit (DEVIR.md) — aşağıda

**Faz 3'ten itibaren: her faz onaylandığında HEMEN ayrı commit atılacak.** Bu, bu devrin kendisinin de bir sonucu — fazları biriktirmek devir belgesini yazmayı zorlaştırdı.

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
büyük-harf yok. **Henüz hiçbir gerçek ekrana uygulanmadı** — sadece kütüphanenin
kendisi var, kullanımı Faz 3-5'te ekran ekran olacak.

- **`.btn`** (+ `.btn-primary`, `.btn-danger`, `.btn-ghost`, `.btn-sm`) — her tıklanabilir aksiyon butonu. `.btn-primary` = ekranın ana aksiyonu (ör. "Seriyi kaydet"), düz `.btn` = ikincil/vazgeç, `.btn-danger` = silme/iptal gibi geri alınamaz aksiyonlar, `.btn-ghost` = en düşük vurgulu (ör. "Daha fazla").
- **`.card`** — bir bilgi/özet bloğunu diğerlerinden ayırmak için (ör. "Bugünkü antrenman" özeti). Tekdüze gölge yok, sadece kenarlık.
- **`.chip`** (+ `.chip-success/-warning/-danger`) — küçük durum/etiket rozeti (ör. "Klasik yay", "Tamamlandı", "Bekliyor"). Sekme veya buton YERİNE değil, salt bilgi etiketi olarak.
- **`.seg`** + `.seg-btn` — 2-4 seçenekli segmentli seçici (ör. mevcut `.tur-formati-btn` grubunun yerini alacak "Serbest/WA 70m/WA 18m" gibi).
- **`.switch`** + `.slider` — açık/kapalı anahtar (ör. "Sesli anons"). Daha önce hiç kullanılmayan ölü bir class'tı, tokenlara bağlanıp resmileştirildi.
- **`.settings-row`** + `.settings-label`/`.settings-hint` — bir ayarlar panelindeki her satır (etiket + sağda kontrol). Faz 4'teki "Seri ayarları" katlanır panelinde kullanılacak.
- **`.tabs`** + `.tabs-btn` — YENİ üst-seviye navigasyon deseni (Faz 3'ün 14→6+"Tümü" grubu için). Mevcut `.sekme-grubu`/`.sekme-btn`'in yerini ALACAK ama henüz o değiştirilmedi.
- **`.table`** — düzenli veri tablosu (ör. seri/puan/ortalama listeleri) — app.js'te şu an onlarca yerde ayrı ayrı inline-style'lı `<table>` var, bunlar zamanla `.table`'a taşınabilir.
- **`.empty`** + `.empty-icon`/`.empty-title`/`.empty-hint` — "henüz veri yok" durumları (ör. "Henüz seri girilmedi").

Görsel kanıt: `component-preview-dark.png`/`component-preview-light.png` (kullanıcıya
SendUserFile ile gönderildi, repo'da değil — gerekirse yeniden üretmek için scratchpad'de
aynı yöntem: styles.css'i `file://` ile açan bir HTML, her bileşeni bir kez render et,
`body.classList.add('light-theme')` ile ikinci kez çek).

## 6. Kalan iş

- **Faz 3 — Navigasyon**: 14 sekme (Reaksiyon hariç orijinal prompt sayımı) → 6 ana +
  "Tümü/Daha" grubu paneli. Emoji ikonlar → tek-strok inline SVG ikonlar. `.tabs`
  bileşeni burada devreye girecek, mevcut `.sekme-grubu`/`.sekme-btn` yapısı JS'te
  (`sekmeAc()`, app.js:15216) YOĞUN referans ediliyor — id'ler (`tab-*`/`icerik-*`)
  KESİNLİKLE korunmalı, sadece görsel/CSS değişebilir.
- **Faz 4 — Skor ekranı**: ok-şeridi (girilen oklar kaydetmeden önce görünsün), tek birincil
  "Seriyi kaydet" aksiyonu + ilerleme sayacı, katlanır "Seri ayarları" paneli (`.settings-row`
  burada kullanılacak).
- **Faz 5 — Diğer 15 ekran** (hiçbiri başlanmadı, hepsi mevcut haliyle duruyor):
  Ana Ekran, Sayaç, Skor (Faz 4'te), Canlı Takip, Gelişim, Liderlik, Klasman, Yarışmalar,
  Ders İçerikleri, Teknik Çalışma, Video, Düello, Başarılar, Mağaza, Reaksiyon. Her biri
  için önce tek cümlelik plan sun, onay bekle, sonra uygula (promptun kendi yöntemi).
- **Faz 6 — Temizlik/doğrulama**: kalan çıplak hex tarama (ana rapor + `renk-envanteri-uzun-kuyruk-2026-09.md`
  zaten hazır), kalan emoji ikon taraması, kontrast kontrolü, 360/768/1280px ekran görüntüleri,
  özet rapor. **+ bu turda eklenen madde: token geçişinden sonra ölü kalan eski CSS
  kurallarını tespit et ve raporla** (kullanıcının isteği).

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
- Genel proje kuralları (bu tasarım işine özel olmayan ama geçerli olmaya devam eden):
  yerel D1 `egitmen_hash` test-giriş takası her zaman iş bitince geri alınır; `wrangler dev`
  oturumlar arası hayatta kalmaz, önce curl-healthcheck; PowerShell `-Raw`/`-replace`/
  `Set-Content` app.js/styles.css için YASAK (Türkçe karakter bozulması) — Edit tool kullan.

## 8. Çözülmemiş konular ve açık sorular

- Faz 3'ün "6 ana + Tümü/Daha grubu" için hangi 6 sekmenin ana kalacağı, hangilerinin
  "Daha" altına gireceği henüz kullanıcıyla netleşmedi — Faz 3 başlarken sorulacak.
  (Muhtemel adaylar: Ana Ekran/Sayaç/Skor/Gelişim/Liderlik/Klasman ön planda, Yarışmalar/
  Ders İçerikleri/Teknik Çalışma/Video/Düello/Başarılar/Mağaza/Reaksiyon "Daha"da —
  ama bu sadece bir varsayım, onaylanmadı.)
- Emoji ikonların yerini alacak "tek-strok inline SVG ikon" seti henüz hiç tasarlanmadı —
  14+ ikon (🏠⏱️🎯📡📈🏆📊🏅📚🏹🎥⚔️🏅🎮🧠) için kaynak/stil kararı Faz 3'te verilecek.
  Repo'da hazır bir ikon kütüphanesi/CDN bağımlılığı yok, muhtemelen elle SVG path
  yazılacak.
  - `renk-envanteri-uzun-kuyruk-2026-09.md`'deki 372 düşük-frekans hex OTOMATİK/bağlam
  okunmadan ön-sınıflandırıldı — Faz 6'ya kadar gerçek bir onay/işlem beklemiyor, ama
  o dosyanın "düşük güven" etiketi unutulmamalı.
- Bu tasarım işiyle ilgisiz ama proje genelinde açık kalan eski maddeler (KM Oyunlar
  Fullscreen-API taşma raporu, Yıldız Seferi/Dağ Tırmanışı içerik zenginleştirme) bu
  devrin kapsamı DIŞINDA — ayrı hafıza dosyasında (`dagsk-km-oyunlar-2026-09.md`) duruyor,
  karıştırılmamalı.
