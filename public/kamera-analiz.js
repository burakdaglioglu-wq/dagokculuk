/* Form Lab · telefonda analiz (2026-10-08, kullanıcı: "internet zayıf olunca görüntü kalitesi düşük ve analizler biraz hatalı").
   SORUN: telefon görüntüyü WebRTC ile bilgisayara gönderiyor, iskelet (MediaPipe) bilgisayarda bu yayından çıkarılıyordu.
   Bağlantı zayıflayınca WebRTC bit hızını düşürüyor → bilgisayara bulanık/bloklu görüntü geliyor → eklem noktaları kayıyor,
   el (parmak) modeli çene altını bulamıyordu.
   ÇÖZÜM: aynı modeller telefonda, kameranın TAM KALİTELİ karesi üzerinde çalışır; bilgisayara yalnız noktalar gider
   (kare başına ~1 KB, 'iskelet' veri kanalı, sırasız/yeniden göndermesiz — gecikmeli paket yerine yenisi gelir).
   Görüntü kalitesi düşse bile analiz bozulmaz. Bilgisayar taraf: dagsk-km-formlab.js flTelIskelet*.
   Kurallar bilgisayardakiyle aynı: en büyük kişi → sonra merkezi en yakın kişi (bilgisayar dokunarak seçtirebilir),
   el modeli yalnız el ağza 1 omuz genişliğinden yakınken, ağız-bilek çevresinden kırpılmış 256 px parçada, iki karede bir. */
const TV = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const M_POSE = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const M_EL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const P = { burun: 0, agizSol: 9, agizSag: 10, omuzSol: 11, omuzSag: 12, bilekSol: 15, bilekSag: 16, isaretSol: 19, isaretSag: 20 };
const KA = window.KA = { durum: 'yok', takip: null, gonder: null, sonTs: 0, elSira: false, ms: 0, sayac: 0 };
let pose = null, hand = null, kirp = null, calisiyor = false;

function ts(ms) { let t = Math.max(Math.round(ms), KA.sonTs + 1); KA.sonTs = t; return t; }
function kisiSec(lms, W, H) {
    if (!lms || !lms.length) return null;
    let merkez = l => [(l[11].x + l[12].x) / 2, (l[11].y + l[12].y) / 2], boy = l => Math.hypot((l[11].x - l[12].x) * W, (l[11].y - l[12].y) * H), sec = null;
    if (KA.takip) { let en = 1e9; lms.forEach(l => { let m = merkez(l), d = Math.hypot(m[0] - KA.takip[0], m[1] - KA.takip[1]); if (d < en) { en = d; sec = l; } }); }
    else lms.forEach(l => { if (!sec || boy(l) > boy(sec)) sec = l; });
    KA.takip = merkez(sec);
    return sec;
}
function elGerekli(p, W, H) {
    let px = i => [p[i][0] * W, p[i][1] * H], d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let S = d(px(P.omuzSol), px(P.omuzSag)) || 1, ag = [(px(P.agizSol)[0] + px(P.agizSag)[0]) / 2, (px(P.agizSol)[1] + px(P.agizSag)[1]) / 2];
    if (Math.min(d(px(P.isaretSol), ag), d(px(P.isaretSag), ag), d(px(P.bilekSol), ag), d(px(P.bilekSag), ag)) > 1.0 * S) return false;
    // hız ayarı: yavaş telefonda el modeli iki yerine üç karede bir
    KA.elSay = (KA.elSay || 0) + 1; return KA.elSay % (KA.ms > 140 ? 3 : 2) === 0;
}
function elBul(v, p, W, H, t) {
    let px = i => [p[i][0] * W, p[i][1] * H], d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    let S = d(px(P.omuzSol), px(P.omuzSag)) || 1, ag = [(px(P.agizSol)[0] + px(P.agizSag)[0]) / 2, (px(P.agizSol)[1] + px(P.agizSag)[1]) / 2];
    let bilek = d(px(P.bilekSol), ag) <= d(px(P.bilekSag), ag) ? px(P.bilekSol) : px(P.bilekSag);
    let m = [bilek[0] * 0.55 + ag[0] * 0.45, bilek[1] * 0.55 + ag[1] * 0.45], k = Math.max(48, Math.min(Math.max(W, H), S * 1.3 + d(bilek, ag) * 0.9));
    let x0 = m[0] - k / 2, y0 = m[1] - k / 2;
    if (!kirp) { kirp = document.createElement('canvas'); kirp.width = kirp.height = 256; }
    let x = kirp.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 256, 256);
    try { x.drawImage(v, x0, y0, k, k, 0, 0, 256, 256); } catch (e) { return null; }
    let h = hand.detectForVideo(kirp, t);
    if (!h || !h.landmarks || !h.landmarks.length) return null;
    return h.landmarks.map(l => l.map(q => [r4((x0 + q.x * k) / W), r4((y0 + q.y * k) / H)]));
}
const r4 = x => Math.round(x * 10000) / 10000;

async function yukle() {
    KA.durum = 'yukleniyor'; KA.bildir && KA.bildir();
    const vision = await import(TV + '/vision_bundle.mjs');
    const fs = await vision.FilesetResolver.forVisionTasks(TV + '/wasm');
    const yap = async (Sinif, model, ek) => {
        try { return await Sinif.createFromOptions(fs, Object.assign({ baseOptions: { modelAssetPath: model, delegate: 'GPU' }, runningMode: 'VIDEO' }, ek)); }
        catch (e) { return await Sinif.createFromOptions(fs, Object.assign({ baseOptions: { modelAssetPath: model, delegate: 'CPU' }, runningMode: 'VIDEO' }, ek)); }
    };
    pose = await yap(vision.PoseLandmarker, M_POSE, { numPoses: 3, minPoseDetectionConfidence: 0.4, minPosePresenceConfidence: 0.4, minTrackingConfidence: 0.4 });
    hand = await yap(vision.HandLandmarker, M_EL, { numHands: 2, minHandDetectionConfidence: 0.35, minHandPresenceConfidence: 0.35, minTrackingConfidence: 0.35 });
}

// v: kamera <video>; gonder(paket) her karede çağrılır (bağlı değilse kanal kapalıdır, paket düşer)
KA.baslat = async function (v) {
    if (calisiyor) return; calisiyor = true;
    try { await yukle(); } catch (e) { KA.durum = 'hata'; KA.bildir && KA.bildir(); calisiyor = false; return; }
    KA.durum = 'calisiyor'; KA.bildir && KA.bildir();
    let son = 0;
    const kare = () => {
        if (!calisiyor) return;
        if ('requestVideoFrameCallback' in v) v.requestVideoFrameCallback(kare); else requestAnimationFrame(kare);
        // Hız ayarı (2026-10-08): aralık telefonun kare işleme süresine göre 90–350 ms; çok yavaşsa (≥450 ms, 15 kare üst üste)
        // telefon analizi bırakır, bilgisayar kendi analizine döner (paket gelmeyince 1,5 sn içinde devralır).
        let aralik = Math.max(90, Math.min(350, (KA.ms || 0) * 1.25));
        let simdi = performance.now(); if (simdi - son < aralik || v.readyState < 2 || !v.videoWidth || document.hidden) return; son = simdi;
        let W = v.videoWidth, H = v.videoHeight, t = ts(simdi), z0 = performance.now(), paket = { t: Date.now(), W, H, p: null, h: null, hD: 0, n: 0 };
        try {
            let r = pose.detectForVideo(v, t), lm = kisiSec(r && r.landmarks, W, H);
            paket.n = r && r.landmarks ? r.landmarks.length : 0;
            if (lm) {
                paket.p = lm.map(q => [r4(q.x), r4(q.y), Math.round((q.visibility == null ? 1 : q.visibility) * 100) / 100]);
                if (elGerekli(paket.p, W, H)) { paket.hD = 1; paket.h = elBul(v, paket.p, W, H, ts(performance.now())); }
            }
        } catch (e) { return; }
        KA.ms = KA.ms ? KA.ms * 0.9 + (performance.now() - z0) * 0.1 : performance.now() - z0; KA.sayac++;
        KA.yavasSay = KA.ms >= 450 ? (KA.yavasSay || 0) + 1 : 0;
        if (KA.yavasSay >= 15 && !window.KA_YAVAS_SERBEST) { calisiyor = false; KA.durum = 'yavas'; KA.bildir && KA.bildir(); return; }
        if (KA.gonder) KA.gonder(paket);
    };
    if ('requestVideoFrameCallback' in v) v.requestVideoFrameCallback(kare); else requestAnimationFrame(kare);
};
KA.durdur = function () { calisiyor = false; };
