/* ===== DAĞ S.K. sync.js =====
 * Firestore-compatible facade backed by this Worker's REST API + a single
 * WebSocket. app.js still calls dbBulut.collection(x).doc(y).set/get/onSnapshot/delete
 * exactly as it did against the real Firestore SDK — only bulutBaslat()'s
 * connection-init block (a few lines) is edited to hand it this shim instead.
 *
 * The "master" doc is not a stored blob anymore: writes are fanned out to the
 * relational endpoints (athletes, dues, attendance, personnel, ...), and reads
 * are reassembled back into the exact bulutVeriJSON() shape app.js expects.
 * A few lower-confidence, rarely-conflicting collections (takimlarDB,
 * antrenmanlarDB, personelYoklamaDB, elemeEslesmeleri, takimElemeEslesmeleri,
 * atisLog, rekorlarDB) round-trip as one opaque JSON blob under a single
 * meta key instead of being split into guessed relational columns — this
 * keeps them 100% lossless while the truly sync-critical, well-understood
 * data (athletes, series, dues, attendance, personnel, season, credentials,
 * locks) gets the full relational treatment.
 */
(function () {
  const EXTRA_BLOB_META_KEY = "extra_blob";

  async function api(path, options) {
    const res = await fetch(path, {
      ...options,
      headers: { "content-type": "application/json", ...(options && options.headers) },
    });
    if (!res.ok && res.status !== 409) {
      // .status eklendi ki fanOutMasterPayload hangi job'ın 401 (yetkisiz/PIN'siz) yüzünden
      // başarısız olduğunu ayırt edebilsin — mesaj metni değişmedi, bu SADECE ek bir alan.
      const err = new Error("api " + path + " -> " + res.status);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  const get = (path) => api(path, { method: "GET" });
  // Oturum isteyen okumalar: 401 → null (girişsiz cihazda senkronu durdurmasın).
  const getYetkili = (path) => get(path).catch((e) => { if (e && e.status === 401) return null; throw e; });
  const post = (path, body) => api(path, { method: "POST", body: JSON.stringify(body || {}) });
  const put = (path, body) => api(path, { method: "PUT", body: JSON.stringify(body || {}) });
  const patch = (path, body) => api(path, { method: "PATCH", body: JSON.stringify(body || {}) });
  const del = (path) => api(path, { method: "DELETE" });

  function myDeviceId() {
    try {
      return (typeof _cihazId !== "undefined" && _cihazId) || localStorage.getItem("dag_cihaz_id") || null;
    } catch (e) {
      return null;
    }
  }

  /* ===== WebSocket hub — single connection, topic-based fan-out ===== */
  const listeners = { series: [], seriesUpdated: [], seriesCancelled: [], lock: [], season: [], resetSignal: [], masterChanged: [], canliAtis: [], duello: [], wsAcildi: [], duyuru: [], kmOrtak: [] };
  let helloState = null;
  let ws = null;
  let wsBackoff = 1000;

  // DÜZELTME: eskiden tavan 15sn'ydi — Durable Object'in ücretsiz istek kotası dolduğunda TÜM bağlı
  // cihazlar aynı anda ~15sn'de bir yeniden deneyip kotanın kendini toparlamasını engelliyordu (kalıcı
  // retry fırtınası). Tavan büyütüldü + rastgele jitter eklendi ki cihazlar aynı anda değil, dağınık
  // aralıklarla denesin — kota dolduğunda gerçekten boşalma şansı olsun.
  let ilkWsBaglanti = true;
  function wsConnect() {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    ws = new WebSocket(proto + "//" + location.host + "/ws");
    ws.onopen = () => {
      wsBackoff = 1000;
      // İlk bağlantı (sayfa yüklenirken) hariç, her başarılı (yeniden) bağlanma bir öncesinde mesaj
      // kaçırılmış olabileceği anlamına gelir (özellikle iOS'ta arka plandan dönüşte) — dinleyicilere
      // "yenidenBaglanmaMi=true" ile haber veriyoruz ki app.js tam bir veri tazelemesi tetikleyebilsin.
      const yenidenBaglanmaMi = !ilkWsBaglanti;
      ilkWsBaglanti = false;
      listeners.wsAcildi.forEach((cb) => { try { cb(yenidenBaglanmaMi); } catch (e) {} });
      degisimTelafiZamanla(2500);
    };
    ws.onclose = () => {
      const capped = Math.min(wsBackoff, 120000);
      const jitter = capped * (0.75 + Math.random() * 0.5); // ±25%
      setTimeout(wsConnect, jitter);
      wsBackoff *= 1.5;
    };
    ws.onerror = () => {
      try {
        ws.close();
      } catch (e) {}
    };
    ws.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch (e) {
        return;
      }
      if (msg.type === "hello") {
        helloState = msg.payload;
        return;
      }
      if (msg.type === "series-added") {
        listeners.series.forEach((cb) => cb(msg));
      } else if (msg.type === "lock-acquired" || msg.type === "lock-released") {
        if (msg.type === "lock-acquired") helloState = helloState || {};
        if (helloState) helloState.lock = msg.type === "lock-acquired" ? msg.payload : { grup: null, ad: null, yapan: null, zaman: null };
        listeners.lock.forEach((cb) => cb(msg));
      } else if (msg.type === "season-changed") {
        if (helloState) helloState.season = msg.payload;
        listeners.season.forEach((cb) => cb(msg));
      } else if (msg.type === "reset-signal") {
        listeners.resetSignal.forEach((cb) => cb(msg));
        scheduleMasterChanged();
      } else if (msg.type === "athlete-updated" || msg.type === "master-changed" || msg.type === "daily-backup-restored") {
        // KASMA DÜZELTMESİ (2026-09-30): cihazın KENDİ yazdığı değişikliğin yankısı için tüm kulübü baştan
        // çekmeye gerek yok (veri zaten bu cihazda) — eskiden her kendi yazmasından sonra 2 MB çekip işliyordu.
        if (msg.type !== "daily-backup-restored" && msg.deviceId && msg.deviceId === myDeviceId()) return;
        scheduleMasterChanged();
      } else if (msg.type === "canli-atis") {
        listeners.canliAtis.forEach((cb) => cb(msg));
      } else if (msg.type === "duello-davet" || msg.type === "duello-yanit" || msg.type === "duello-ok" || msg.type === "duello-iptal") {
        listeners.duello.forEach((cb) => cb(msg));
      } else if (msg.type === "series-updated") {
        // DÜZELTME: sunucu bu tipi doğru broadcast ediyordu ama burada hiç dinlenmiyordu — bir seri
        // düzenlendiğinde diğer cihazlar hiç haberdar olmuyordu (bayat skor görünmesi vakalarının kök
        // nedeni). scheduleMasterChanged() ile tam yeniden çekim YETERLİ DEĞİL — turnuvaDBMerge()
        // seri birleştirmesini seriId bazlı SAF EKLEME (union) olarak yapıyor, var olan bir seriId'nin
        // oklar/puan alanlarını asla GÜNCELLEMİYOR (bilerek — "uzun taraf kazanır" adlı eski bir bug'ı
        // düzeltmek için). Bu yüzden düzeltme, mesajın kendi payload'ını doğrudan yerel turnuvaDB'ye
        // yamayan özel bir dinleyiciye yönlendiriliyor (app.js: seriGuncellemeMesajGeldi).
        listeners.seriesUpdated.forEach((cb) => cb(msg));
      } else if (msg.type === "series-cancelled") {
        // Aynı sebep: merge silinmiş/iptal edilmiş bir seriId'yi ASLA yerel diziden çıkarmıyor (saf
        // ekleme). Gerçek "iptal" durumu ayrı bir tombstone listesinde (iptalSerilerDB) tutuluyor —
        // bu liste normalde SADECE iptali yapan cihazda güncelleniyordu, diğer cihazlara hiç yayılmıyordu.
        listeners.seriesCancelled.forEach((cb) => cb(msg));
      } else if (msg.type === "duyuru") {
        listeners.duyuru.forEach((cb) => cb(msg));
      } else if (msg.type === "km-ortak") {
        // Karışık Sınıf ortak ders: başka bir cihaz bu konumun durumunu değiştirdi (bkz. dagsk-km-ortak.js).
        if (msg.deviceId && msg.deviceId === myDeviceId()) return;
        listeners.kmOrtak.forEach((cb) => cb(msg.payload));
      }
    };
  }
  wsConnect();

  let masterChangedTimer = null;

  // ÇEVRİMDIŞI TAM TELAFİ (2026-09-29): bağlantı yokken başka cihazlarda yapılan seri DÜZELTME ve İPTALLERİ
  // canlı mesaj olarak kaçırılıyordu; turnuvaDBMerge sadece ekleme yaptığı için bir sonraki tam çekme de
  // bunları geri getirmiyordu (iptal edilen skor bu cihazda sayılmaya devam ediyordu). Artık her bağlanışta,
  // internet geri gelince ve uygulama öne gelince sunucuya "şu zamandan beri ne değişti" diye sorulur;
  // cevap, canlı mesajların AYNI işleyicilerinden geçirilir (ikisi de tekrar çağrılmaya dayanıklı).
  const TELAFI_ANAHTAR = "dag_seri_degisim_son";
  let telafiZaman = null, telafiCalisiyor = false, telafiSon = 0;
  function degisimTelafiZamanla(ms) { clearTimeout(telafiZaman); telafiZaman = setTimeout(degisimTelafi, ms); }
  async function degisimTelafi() {
    if (telafiCalisiyor || Date.now() - telafiSon < 15000) return;
    // app.js işleyicileri henüz bağlanmadıysa biraz sonra tekrar dene.
    if (!listeners.seriesCancelled.length || !listeners.seriesUpdated.length) return degisimTelafiZamanla(3000);
    telafiCalisiyor = true;
    try {
      let since = Number(localStorage.getItem(TELAFI_ANAHTAR) || 0);
      // İlk kez: son 60 gün (daha eskisi o zamanlar zaten canlı mesajla ya da tam çekmeyle gelmişti).
      if (!since) since = Date.now() - 60 * 24 * 3600 * 1000;
      const r = await get("/api/series/degisenler?since=" + Math.max(0, since - 60000));
      const liste = (r && r.degisenler) || [];
      const iptaller = liste.filter((x) => x.iptal).map((x) => x.seriId);
      if (iptaller.length) listeners.seriesCancelled.forEach((cb) => { try { cb({ type: "series-cancelled", payload: { seriIds: iptaller } }); } catch (e) {} });
      liste.filter((x) => !x.iptal).forEach((x) => listeners.seriesUpdated.forEach((cb) => { try { cb({ type: "series-updated", payload: { seriId: x.seriId, oklar: x.oklar, puan: x.puan } }); } catch (e) {} }));
      if (r && r.simdi) localStorage.setItem(TELAFI_ANAHTAR, String(r.simdi));
      telafiSon = Date.now();
    } catch (e) { /* çevrimdışı: bir sonraki bağlanışta tekrar denenir */ }
    finally { telafiCalisiyor = false; }
  }
  window.addEventListener("online", () => degisimTelafiZamanla(1500));
  document.addEventListener("visibilitychange", () => { if (!document.hidden) degisimTelafiZamanla(1500); });
  // KASMA DÜZELTMESİ (2026-09-30): başka bir cihaz toplu yazınca (ör. güncelleme sonrası ilk senkron) yüzlerce
  // "athlete-updated" gelir; eskiden yarım saniyede bir TÜM kulüp verisi (~2 MB) yeniden çekilip işleniyor ve
  // her seferinde 2 MB yedek yazılıyordu → tarayıcı kilitleniyordu. Artık çekmeler arasında en az 5 sn var;
  // arada gelen bildirimler tek bir (son) çekmede birleşir.
  let sonMasterCekme = 0;
  function scheduleMasterChanged() {
    if (masterChangedTimer) return;
    const bekle = Math.max(500, 5000 - (Date.now() - sonMasterCekme));
    masterChangedTimer = setTimeout(() => {
      masterChangedTimer = null;
      sonMasterCekme = Date.now();
      listeners.masterChanged.forEach((cb) => cb());
    }, bekle);
  }

  /* ===== Master blob reassembly (GET side) ===== */
  async function reassembleMasterPayload() {
    const [athletesRes, seriesRes, metaRes, duesRes, attAutoRes, personnelRes, personnelAttRes, classesRes, deletedRes] = await Promise.all([
      get("/api/athletes"),
      get("/api/series"),
      get("/api/meta"),
      getYetkili("/api/dues"),
      get("/api/attendance/auto"),
      getYetkili("/api/personnel"),
      getYetkili("/api/attendance/personnel"),
      get("/api/custom-classes"),
      get("/api/athletes/deleted"),
    ]);

    const turnuvaDB = { buyukler: {}, yildizlar: {}, kucukler: {}, minikler: {} };
    athletesRes.athletes.forEach((a) => {
      if (!turnuvaDB[a.grup]) return;
      const sp = { ...a, seriler: [] };
      delete sp.grup;
      delete sp.ad;
      turnuvaDB[a.grup][a.ad] = sp;
    });
    seriesRes.series.forEach((s) => {
      const sp = turnuvaDB[s.grup] && turnuvaDB[s.grup][s.ad];
      if (sp) sp.seriler.push({ seriId: s.seriId, puan: s.puan, oklar: s.oklar, tarih: s.tarih, t: s.t, okAraliklari: s.okAraliklari || null });
    });

    // Aidat/personel okumaları oturum ister (2026-09-28): 401 → null → alan hiç gönderilmez (undefined),
    // bulutVeriyiUygula da "if(p.X)" ile atlar — girişsiz cihazda yerel veri silinmez, senkronun geri kalanı sürer.
    const aidatDB = duesRes ? {} : undefined;
    if (duesRes) duesRes.dues.forEach((d) => {
      (aidatDB[d.ad] = aidatDB[d.ad] || {})[d.ay] = { odendi: d.odendi, tutar: d.tutar, tarih: d.tarih, notMetin: d.notMetin, odemeTarihi: d.odemeTarihi };
    });

    const otomatikYoklamaDB = {};
    attAutoRes.attendance.forEach((a) => {
      (otomatikYoklamaDB[a.tarih] = otomatikYoklamaDB[a.tarih] || {})[a.ad] = { saat: a.saat, grup: a.grup, elle: !!a.elle, geldi: a.geldi !== 0 };
    });

    let extra = { takimlarDB: [], antrenmanlarDB: [], elemeEslesmeleri: [], takimElemeEslesmeleri: [], atisLog: [], rekorlarDB: {}, aktifTur: 1, aktifTakimTur: 1 };
    try {
      const raw = await get("/api/meta/" + EXTRA_BLOB_META_KEY).catch(() => null);
      if (raw && raw.value) extra = { ...extra, ...JSON.parse(raw.value) };
    } catch (e) {}

    const personelYoklamaDB = personnelAttRes ? [] : undefined;
    const pyokMap = {};
    if (personnelAttRes) personnelAttRes.attendance.forEach((r) => {
      if (!pyokMap[r.tarih]) { pyokMap[r.tarih] = { id: "pyok_" + r.tarih, tarih: r.tarih, gelenler: [], gelmediler: [] }; personelYoklamaDB.push(pyokMap[r.tarih]); }
      (r.geldi !== 0 ? pyokMap[r.tarih].gelenler : pyokMap[r.tarih].gelmediler).push(r.personel_id);
    });

    return {
      turnuvaDB,
      takimlarDB: extra.takimlarDB,
      antrenmanlarDB: extra.antrenmanlarDB,
      ozelSiniflar: classesRes.classes,
      personelDB: personnelRes ? personnelRes.personnel : undefined,
      personelYoklamaDB,
      elemeEslesmeleri: extra.elemeEslesmeleri,
      takimElemeEslesmeleri: extra.takimElemeEslesmeleri,
      aktifTur: extra.aktifTur,
      aktifTakimTur: extra.aktifTakimTur,
      atisLog: extra.atisLog,
      rekorlarDB: extra.rekorlarDB,
      otomatikYoklamaDB,
      aidatDB,
      silinenler: deletedRes.deleted,
      iptalSeriler: [],
      resetZamani: metaRes.resetZamani,
      minSurum: metaRes.minSurum,
      geriYukleme: metaRes.sonGeriYukleme,
    };
  }

  /* ===== Master blob fan-out (SET side) ===== */
  // KVKK (2026-09-28): sunucu, girişsiz okumalarda kişisel alanları (veli adı/telefonu, doğum tarihi, notlar…)
  // HİÇ göndermiyor (anahtar yok). Bu cihazda o alan HİÇ yoksa (undefined) sunucuya null YAZILMAZ — yoksa
  // girişsiz açılmış bir cihaz, sonradan giriş yapıldığında gerçek telefonları boşlukla ezerdi. Bilerek
  // silinen alan '' ya da null olarak cihazda durduğu için yine gönderilir.
  const KISISEL_ALANLAR = ["acilKisi", "acilTelefon", "antrenmanNotu", "genelNot", "dogumTarihi", "katilmaTarihi", "aileMeslek"];
  function kisiselAlanlar(sp) {
    const out = {};
    KISISEL_ALANLAR.forEach((k) => { if (sp[k] !== undefined) out[k] = sp[k] ?? null; });
    return out;
  }

  // DÜZELTME (2026-09-10, DEVIR.md §9): eskiden HER job kendi .catch(() => {})'ine sahipti, bu yüzden
  // Promise.all(jobs) yazmalar %100 başarısız olsa BİLE HİÇ reddetmiyordu — bulutaGonderKontrol()'ün
  // .then() (BAŞARI) dalı sessizce çalışıp sonBulutJSON'ı güncelliyordu, sanki her şey gönderilmiş gibi.
  // Artık: (1) job'lar kendi hatalarını YUTMUYOR, (2) Promise.allSettled ile hepsi denenip kaç
  // tanesinin başarısız olduğu sayılıyor, (3) en az biri başarısızsa fonksiyon GERÇEKTEN reddediyor —
  // bu, app.js'teki 8 çağrı noktasının ZATEN yazılmış olan .catch() işleyicilerini (hepsi
  // bekleyenGonderim=true yapıyor) ilk kez gerçekten çalıştırır, tek tek değiştirmeye gerek kalmadan.
  // DONMA DÜZELTMESİ (2026-09-29): eskiden her senkronda (ör. tek bir skor girilince) TÜM sporcular
  // (her biri 3 istek) + geçmişteki TÜM yoklama hücreleri yeniden gönderiliyordu — yüzlerce/binlerce
  // istek, tablette ~1 sn donma. Artık her kaydın son BAŞARIYLA gönderilen hali (bu sayfa oturumunda)
  // hatırlanıyor; değişmeyen kayıt tekrar gönderilmiyor. Başarısız gönderim hatırlanmaz → sonraki
  // denemede yine gider.
  // AÇILIŞ HIZI (2026-09-29): harita artık cihazda da saklanıyor (içeriğin kendisi değil, iki ayrı 32-bit
  // özet + uzunluk — çakışma olasılığı pratikte sıfır). Sayfa açılınca geri yüklenir → ilk senkron da sadece
  // son oturumdan beri DEĞİŞENLERİ gönderir (eskiden açılışta tüm kulüp baştan gönderiliyordu).
  const IMZA_ANAHTAR = "dag_senk_imza_v1";
  function ozet(str) {
    let a = 0x811c9dc5, b = 0x9e3779b1;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      a = Math.imul(a ^ c, 0x01000193) >>> 0;
      b = Math.imul(b ^ c, 0x5bd1e995) >>> 0; b = (b ^ (b >>> 13)) >>> 0;
    }
    return str.length.toString(36) + "." + a.toString(36) + "." + b.toString(36);
  }
  const _gonderilenImza = new Map();
  try { Object.entries(JSON.parse(localStorage.getItem(IMZA_ANAHTAR) || "{}")).forEach(([k, v]) => _gonderilenImza.set(k, v)); } catch (e) {}
  let imzaKayitZaman = null;
  function imzaKaydet() {
    clearTimeout(imzaKayitZaman);
    // Depo doluysa (5 MB sınırı) imzalar kaydedilemez ve HER açılışta tüm kulüp yeniden gönderilir (binlerce
    // yazma + diğer cihazlarda yenileme fırtınası). O durumda 2 MB'lık yerel acil yedeği silip yer açıyoruz.
    imzaKayitZaman = setTimeout(() => {
      const yaz = () => localStorage.setItem(IMZA_ANAHTAR, JSON.stringify(Object.fromEntries(_gonderilenImza)));
      try { yaz(); } catch (e) { try { localStorage.removeItem("okculuk_yedek_son"); yaz(); } catch (e2) {} }
    }, 1500);
  }
  async function fanOutMasterPayload(json) {
    const p = JSON.parse(json);
    const deviceId = myDeviceId();
    const jobs = [];
    // Alan SIRASINDAN bağımsız: sunucudan birleştirilen kayıtların anahtar sırası değişebiliyor — aynı içerik
    // farklı JSON üretip her açılışta "değişmiş" sayılmasın.
    const sirali = (v) => (v && typeof v === "object" ? (Array.isArray(v) ? "[" + v.map(sirali).join(",") + "]" : "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + sirali(v[k])).join(",") + "}") : JSON.stringify(v === undefined ? null : v));
    const gonder = (anahtar, kaynak, is) => {
      const imza = ozet(sirali(kaynak));
      if (_gonderilenImza.get(anahtar) === imza) return;
      jobs.push(is().then((r) => { _gonderilenImza.set(anahtar, imza); imzaKaydet(); return r; }));
    };

    ["buyukler", "yildizlar", "kucukler", "minikler"].forEach((g) => {
      const group = (p.turnuvaDB && p.turnuvaDB[g]) || {};
      Object.keys(group).forEach((ad) => {
        const sp = group[ad];
        const lastModified = sp.lastModified || Date.now();
        const gamification = {};
        ["oyun", "magaza", "ozelRozetler", "gorev", "monopoly"].forEach((f) => {
          if (sp[f] !== undefined) gamification[f] = sp[f];
        });
        // Parmak izi SADECE sunucuya gerçekten giden alanlardan (tüm sp değil — gönderilmeyen alanlar, ör.
        // cezaGecmisi, sonradan eklenince her açılışta "değişti" sanılıyordu). lastModified yoksa ham hali (null).
        const ilkGovde = { grup: g, ad, kod: sp.kod ?? null, dogumYili: sp.dogumYili ?? null, sinif: sp.sinif ?? null, yay: sp.yay ?? null, cinsiyet: sp.cinsiyet ?? null };
        const alanlar = {
          pasif: sp.pasif ? 1 : 0,
          donduruldu: sp.donduruldu ? 1 : 0,
          aidatMuaf: sp.aidatMuaf ? 1 : 0,
          toplamSkor: sp.toplamSkor || 0,
          xAdet: sp.xAdet || 0,
          sonSkorZamani: sp.sonSkorZamani ?? null,
          kartGecmisi_json: JSON.stringify(sp.kartGecmisi || []),
          gecmisSezonlar_json: JSON.stringify(sp.gecmisSezonlar || []),
          detayliOklar_json: JSON.stringify(sp.detayliOklar || []),
          ...kisiselAlanlar(sp),
          biyomotorTestleri_json: JSON.stringify(sp.biyomotorTestleri || []),
          ekipmanBilgisi_json: JSON.stringify(sp.ekipmanBilgisi || { nisangah: [], bakim: [], notlar: [] }),
        };
        const oyunGovde = { gamification, coin: sp.coin || 0, coinT: sp.coinT || 0 };
        gonder("sp|" + g + "|" + ad, [ilkGovde, alanlar, oyunGovde, sp.lastModified ?? null], () =>
          post("/api/athletes", { ...ilkGovde, lastModified })
            .then(() => patch(`/api/athletes/${encodeURIComponent(g)}/${encodeURIComponent(ad)}`, { fields: alanlar, lastModified: lastModified + 1, deviceId }))
            .then(() => patch(`/api/athletes/${encodeURIComponent(g)}/${encodeURIComponent(ad)}/gamification`, { ...oyunGovde, deviceId }))
        );
      });
    });

    // DÜZELTME (2026-09-11, DEVIR.md §9d): aidatDB burada ARTIK gönderilmiyor — her hücre değişikliği
    // zaten kendi kalıcı, tekrar-denemeli kuyruğuyla (app.js:5866 _aidatBekleyenPutler/_aidatDuesPut,
    // aidatAySave/aidatAyTemizle içinde çağrılıyor) anında ve bağımsız gönderiliyordu; burada AYRICA
    // göndermek 75 (gerçek prod sayısı) saf tekrar isteğiydi. Tüm mutasyon yolları (toplu içe aktarma/
    // ay değişimi dahil) tek tek doğrulandı — ikisi de canlı kodda YOK, months lazy oluşuyor. Silinen
    // bir sporcunun aidatDB hücreleri zaten (ayrı, önceden var olan bir hata yüzünden) hiç
    // temizlenmiyordu — bu değişiklik o davranışı DEĞİŞTİRMEDİ, sadece tekrar gönderimi kaldırdı.

    Object.keys(p.otomatikYoklamaDB || {}).forEach((tarih) => {
      Object.keys(p.otomatikYoklamaDB[tarih]).forEach((ad) => {
        const cell = p.otomatikYoklamaDB[tarih][ad];
        gonder("yok|" + tarih + "|" + ad, cell, () => post("/api/attendance/auto", { tarih, ad, grup: cell.grup ?? null, saat: cell.saat, elle: !!cell.elle, geldi: cell.geldi !== false, deviceId }));
      });
    });

    (p.personelDB || []).forEach((person) => {
      gonder("psn|" + person.id, person, () => post("/api/personnel", { ...person, deviceId }));
    });

    (p.personelYoklamaDB || []).forEach((kayit) => {
      (kayit.gelenler || []).forEach((id) => gonder("pyok|" + kayit.tarih + "|" + id, true, () => post("/api/attendance/personnel", { tarih: kayit.tarih, personelId: id, elle: true, geldi: true, deviceId })));
      (kayit.gelmediler || []).forEach((id) => gonder("pyok|" + kayit.tarih + "|" + id, false, () => post("/api/attendance/personnel", { tarih: kayit.tarih, personelId: id, elle: true, geldi: false, deviceId })));
    });

    (p.ozelSiniflar || []).forEach((ad) => {
      gonder("sinif|" + ad, 1, () => post("/api/custom-classes", { ad, deviceId }));
    });

    // PIN özetleri artık senkronla taşınmıyor (2026-09-27, giriş sistemi sunucuya taşındı).

    if (typeof p.minSurum === "number") {
      gonder("minSurum", p.minSurum, () => put("/api/meta/min-surum", { minSurum: p.minSurum }));
    }

    const ekstra = {
      takimlarDB: p.takimlarDB || [],
      antrenmanlarDB: p.antrenmanlarDB || [],
      elemeEslesmeleri: p.elemeEslesmeleri || [],
      takimElemeEslesmeleri: p.takimElemeEslesmeleri || [],
      atisLog: p.atisLog || [],
      rekorlarDB: p.rekorlarDB || {},
      aktifTur: p.aktifTur || 1,
      aktifTakimTur: p.aktifTakimTur || 1,
    };
    gonder("ekstra", ekstra, () => put("/api/meta/" + EXTRA_BLOB_META_KEY, { value: JSON.stringify(ekstra) }));

    const sonuclar = await Promise.allSettled(jobs);
    const basarisizlar = sonuclar.filter((r) => r.status === "rejected");
    if (basarisizlar.length > 0) {
      const bazi401Mi = basarisizlar.some((r) => r.reason && r.reason.status === 401);
      const err = new Error(`fanOutMasterPayload: ${basarisizlar.length}/${jobs.length} job başarısız oldu`);
      err.basarisizSayisi = basarisizlar.length;
      err.toplamSayisi = jobs.length;
      err.bazi401Mi = bazi401Mi;
      throw err;
    }
  }

  /* ===== Firestore-shaped shim ===== */
  function docSnap(exists, data, id) {
    return { exists, id, data: () => data };
  }

  function seasonDocRef() {
    return {
      set: (data) => put("/api/season", { ad: data.ad, baslangic: data.baslangic || null, bitis: data.bitis || null, deviceId: myDeviceId() }),
      get: () => get("/api/season").then((r) => (r.season ? docSnap(true, r.season) : docSnap(false, null))),
      onSnapshot: (onNext) => {
        listeners.season.push((msg) => onNext(docSnap(true, msg.payload)));
        return () => {};
      },
    };
  }

  function masterDocRef() {
    return {
      set: (data) => fanOutMasterPayload(data.veri),
      get: () => reassembleMasterPayload().then((p) => docSnap(true, { veri: JSON.stringify(p), guncelleme: Date.now() })),
      onSnapshot: (onNext) => {
        const cb = () =>
          reassembleMasterPayload().then((p) => onNext(docSnap(true, { veri: JSON.stringify(p), guncelleme: Date.now() })));
        listeners.masterChanged.push(cb);
        return () => {
          listeners.masterChanged = listeners.masterChanged.filter((c) => c !== cb);
        };
      },
    };
  }

  function resetSinyaliDocRef() {
    return {
      set: (data) => post("/api/reset-signal", { grup: data.grup, tip: data.tip, sezonAdi: data.sezonAdi, deviceId: data.yapan }),
      onSnapshot: (onNext) => {
        listeners.resetSignal.push((msg) =>
          onNext(docSnap(true, { yapan: msg.deviceId, grup: msg.payload.grup, zaman: msg.payload.zaman, tip: msg.payload.tip, sezonAdi: msg.payload.sezonAdi }))
        );
        return () => {};
      },
    };
  }

  function duzenlemeKilidiDocRef() {
    return {
      set: (data) => post("/api/lock", { grup: data.g, ad: data.ad, deviceId: data.yapan }),
      delete: () => del("/api/lock?deviceId=" + encodeURIComponent(myDeviceId() || "")),
      onSnapshot: (onNext) => {
        listeners.lock.push((msg) => {
          if (msg.type === "lock-acquired") {
            onNext(docSnap(true, { g: msg.payload.grup, ad: msg.payload.ad, yapan: msg.payload.yapan, zaman: msg.payload.zaman }));
          } else {
            onNext(docSnap(false, null));
          }
        });
        return () => {};
      },
    };
  }

  function seriDocRef(seriId) {
    return {
      set: (data, options) => {
        if (options && options.merge) {
          return patch("/api/series/" + encodeURIComponent(seriId), { oklar: data.oklar || [], puan: data.puan || 0, deviceId: myDeviceId() });
        }
        return post("/api/series", {
          seriId,
          grup: data.g,
          ad: data.ad,
          oklar: data.oklar || [],
          puan: data.puan || 0,
          tarih: data.tarih,
          cihazId: data.cihazId ?? myDeviceId(),
          t: data.t || Date.now(),
          okAraliklari: data.okAraliklari || null,
        });
      },
      delete: () => del("/api/series/" + encodeURIComponent(seriId) + "?deviceId=" + encodeURIComponent(myDeviceId() || "")),
    };
  }

  function kayitlarCollectionRef() {
    return {
      doc: (seriId) => seriDocRef(seriId),
      get: () =>
        get("/api/series?includeIptal=1").then((r) => ({
          forEach: (fn) => r.series.forEach((s) => fn({ id: s.seriId, data: () => ({ g: s.grup, ad: s.ad, oklar: s.oklar, puan: s.puan, tarih: s.tarih, cihazId: s.cihazId, t: s.t }) })),
        })),
      onSnapshot: (onNext) => {
        const bugun = new Date().toISOString().slice(0, 10);
        get("/api/series?tarih=" + bugun)
          .then((r) => {
            onNext({
              docChanges: () =>
                r.series.map((s) => ({
                  type: "added",
                  doc: { id: s.seriId, data: () => ({ id: s.seriId, g: s.grup, ad: s.ad, oklar: s.oklar, puan: s.puan, tarih: s.tarih, cihazId: s.cihazId, t: s.t }) },
                })),
            });
          })
          .catch(() => {});
        listeners.series.push((msg) => {
          const s = msg.payload;
          onNext({
            docChanges: () => [
              { type: "added", doc: { id: s.seriId, data: () => ({ id: s.seriId, g: s.grup, ad: s.ad, oklar: s.oklar, puan: s.puan, tarih: s.tarih, cihazId: msg.deviceId, t: s.t }) } },
            ],
          });
        });
        return () => {};
      },
    };
  }

  function gunlukBackupDocRef(tarih) {
    return {
      set: () => post("/api/backups/daily-check"),
      get: () =>
        post("/api/backups/" + encodeURIComponent(tarih) + "/restore", { deviceId: myDeviceId() })
          .then(() => reassembleMasterPayload())
          .then((p) => docSnap(true, { veri: JSON.stringify(p) })),
    };
  }

  function gunlukCollectionRef() {
    return {
      doc: (tarih) => gunlukBackupDocRef(tarih),
      get: () =>
        get("/api/backups").then((r) => ({
          forEach: (fn) => r.backups.forEach((b) => fn({ id: b.tarih, data: () => ({ veri: JSON.stringify({ turnuvaDB: { buyukler: Array(b.sporcuSayisi).fill(1) } }) }) })),
        })),
    };
  }

  function yedeklerDocRef() {
    return { collection: () => gunlukCollectionRef() };
  }

  function seriler_ParentDocRef() {
    return { collection: () => kayitlarCollectionRef() };
  }

  function kulupCollectionRef() {
    return {
      doc: (id) => {
        if (id === "sezon_bilgisi") return seasonDocRef();
        if (id === "master") return masterDocRef();
        if (id === "reset_sinyali") return resetSinyaliDocRef();
        if (id === "duzenleme_kilidi") return duzenlemeKilidiDocRef();
        if (id === "seriler") return seriler_ParentDocRef();
        if (id === "yedekler") return yedeklerDocRef();
        throw new Error("dagskSync shim: unknown doc id '" + id + "'");
      },
    };
  }

  function sporcuTasi(grup, ad, toGrup, toAd) {
    return post(`/api/athletes/${encodeURIComponent(grup)}/${encodeURIComponent(ad)}/move`, {
      toGrup,
      toAd,
      deviceId: myDeviceId(),
    });
  }

  function sporcuSil(grup, ad) {
    return del(`/api/athletes/${encodeURIComponent(grup)}/${encodeURIComponent(ad)}?deviceId=${encodeURIComponent(myDeviceId() || "")}`);
  }

  function personelSil(id) {
    return del(`/api/personnel/${encodeURIComponent(id)}?deviceId=${encodeURIComponent(myDeviceId() || "")}`);
  }

  function wsBagliMi() {
    return !!ws && ws.readyState === WebSocket.OPEN;
  }

  // Ephemeral "şu an atış yapıyor" yayını — hiçbir zaman D1'e yazılmaz, sadece Liderlik/Klasman'da
  // anlık ok görünürlüğü için bağlı cihazlara fan-out edilir.
  function canliAtisGonder(grup, ad, oklar, aktif) {
    return post("/api/canli-atis", { grup, ad, oklar: oklar || [], aktif: aktif !== false, deviceId: myDeviceId() }).catch(() => {});
  }
  function canliAtisDinle(cb) {
    listeners.canliAtis.push(cb);
    return () => { listeners.canliAtis = listeners.canliAtis.filter((c) => c !== cb); };
  }

  // Düello daveti/yanıt/canlı-ok/iptal — hiçbir zaman D1'e yazılmaz, sadece bağlı cihazlara fan-out.
  function dueloYayinla(tip, payload) {
    const yol = { "duello-davet": "davet", "duello-yanit": "yanit", "duello-ok": "ok", "duello-iptal": "iptal" }[tip];
    if (!yol) return Promise.resolve();
    return post("/api/duello/" + yol, { ...payload, deviceId: myDeviceId() }).catch(() => {});
  }
  function dueloDinle(cb) {
    listeners.duello.push(cb);
    return () => { listeners.duello = listeners.duello.filter((c) => c !== cb); };
  }

  // Web Push abonelik yönetimi (Düello daveti bildirimleri için).
  async function pushAboneOl(grup, ad) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return { ok: false, reason: "unsupported" };
    const izin = await Notification.requestPermission();
    if (izin !== "granted") return { ok: false, reason: "denied" };
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const { publicKey } = await get("/api/push/public-key");
      const appKey = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((publicKey.length + 3) % 4)), (c) => c.charCodeAt(0));
      sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
    }
    const raw = sub.toJSON();
    await post("/api/push/subscribe", { grup, ad, subscription: { endpoint: raw.endpoint, keys: raw.keys } });
    return { ok: true };
  }

  function wsYenidenBaglan() {
    try {
      // DÜZELTME: eskiden sadece wsBagliMi() (readyState) false ise yeniden bağlanıyordu — ama iOS
      // Safari arka plana atılan bir sekmenin WS bağlantısını sessizce öldürüyor, readyState hemen
      // güncellenmiyor ("zombi" bağlantı, hâlâ OPEN görünüyor). readyState'e güvenmek yerine, görünür
      // olunca HER ZAMAN mevcut soketi (zombi de olsa) kapatıp sıfırdan bağlanıyoruz. onclose'un kendi
      // (üstel bekemeli) yeniden bağlanma zamanlayıcısını devre dışı bırakıyoruz ki burada tetiklenen
      // ANINDA bağlanma ile çakışıp iki bağlantı birden açılmasın.
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        try { ws.close(); } catch (e) {}
      }
      wsBackoff = 1000;
      wsConnect();
    } catch (e) {}
  }
  function wsAcildiDinle(cb) {
    listeners.wsAcildi.push(cb);
    return () => { listeners.wsAcildi = listeners.wsAcildi.filter((c) => c !== cb); };
  }
  function seriesUpdatedDinle(cb) {
    listeners.seriesUpdated.push(cb);
    return () => { listeners.seriesUpdated = listeners.seriesUpdated.filter((c) => c !== cb); };
  }
  function seriesCancelledDinle(cb) {
    listeners.seriesCancelled.push(cb);
    return () => { listeners.seriesCancelled = listeners.seriesCancelled.filter((c) => c !== cb); };
  }
  function duyuruDinle(cb) {
    listeners.duyuru.push(cb);
    return () => { listeners.duyuru = listeners.duyuru.filter((c) => c !== cb); };
  }

  // Sekme arka plandan öne dönünce (telefon kilidi açıldığında vb.) WS'i hemen kontrol et —
  // arka planda tarayıcı bağlantıyı sessizce koparmış olabilir, üstel bekleme süresini atla.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) wsYenidenBaglan();
  });

  window.dagskSync = {
    dbBulut: { collection: (name) => (name === "kulup" ? kulupCollectionRef() : (() => { throw new Error("unknown collection " + name); })()) },
    sporcuTasi,
    sporcuSil,
    personelSil,
    wsBagliMi,
    canliAtisGonder,
    canliAtisDinle,
    dueloYayinla,
    dueloDinle,
    pushAboneOl,
    wsAcildiDinle,
    seriesUpdatedDinle,
    seriesCancelledDinle,
    duyuruDinle,
    kmOrtakDinle: (cb) => listeners.kmOrtak.push(cb),
  };
})();
