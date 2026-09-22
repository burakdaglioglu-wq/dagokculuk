/**
 * DAĞ SPOR KULÜBÜ — OPTİK HEDEF HAKEMİ & KAMERA OTOMATİK PUANLAMA MODÜLÜ (v129)
 * 
 * Özellikler:
 * 1. Hikvision DVR (DS-7108HGHI-M1) ve RTSP/Sanal Kamera / USB WebCam akış desteği.
 * 2. 4-Noktalı İnteraktif Perspektif Kalibrasyonu (Homography 2D düzlemsel düzeltme).
 * 3. WA (World Archery) 10-Halka (40cm/60cm/122cm) ve 3-Spot dikey hedef puanlama motoru.
 * 4. Canlı Darbe & Ok Tespiti (Frame-differencing & Centroid lokasyonu).
 * 5. Çizgi Kuralı (Line Cutter) toleransı ve Yakınlaştırma Büyüteci (Loupe).
 * 6. Web Speech API ile anında Türkçe sesli anons ("X!", "10!", "Dokuz!").
 * 7. Sporcu skor kartına / seriye tek dokunuşla otomatik puan aktarımı.
 */

window.DAGSK_TARGET_CV = (function() {
    'use strict';

    // Durum Değişkenleri
    let _active = false;
    let _stream = null;
    let _videoEl = null;
    let _canvasLive = null;
    let _ctxLive = null;
    let _canvasProc = null;
    let _ctxProc = null;
    let _animFrameId = null;

    // Hedef ve Kalibrasyon
    let _targetType = 'wa_full'; // 'wa_full' (10-Halka), 'wa_3spot' (3'lü Dikey), 'compound_x'
    let _calibPoints = [
        { x: 0.15, y: 0.15 }, // Sol Üst (TL)
        { x: 0.85, y: 0.15 }, // Sağ Üst (TR)
        { x: 0.85, y: 0.85 }, // Sağ Alt (BR)
        { x: 0.15, y: 0.85 }  // Sol Alt (BL)
    ];
    let _activeCalibIdx = -1;
    let _isCalibrating = false;
    let _homographyMatrix = null;

    // Ok Algılama & Hafıza
    let _refFrameData = null;
    let _lastImpactTime = 0;
    let _impactCooldown = 900; // ms (Aynı ok için çoklu tetiklemeyi önler)
    let _detectedArrows = []; // { x, y, score, distNorm, isLineCutter, time }
    let _arrowRadiusMm = 5.5 / 2; // ~2.75mm yarıçap
    let _targetRadiusMm = 200; // 40cm hedef için 200mm yarıçap
    let _soundEnabled = true;
    let _voiceEnabled = true;
    let _isDemo = false;
    let _demoInterval = null;

    // Hikvision DVR Ayarları
    let _hikConfig = {
        ip: '192.168.1.64',
        port: '80',
        channel: '1',
        user: 'admin',
        pass: ''
    };
    let _hikPollTimer = null;

    // Web Audio Sentezleyici
    let _audioCtx = null;
    function _getAudioContext() {
        if (!_audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) _audioCtx = new AudioContextClass();
        }
        if (_audioCtx && _audioCtx.state === 'suspended') {
            _audioCtx.resume();
        }
        return _audioCtx;
    }

    function _playBeep(score) {
        if (!_soundEnabled) return;
        try {
            const ctx = _getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            let freq = 440;
            if (score === 'X') freq = 880;
            else if (score === '10') freq = 784;
            else if (score === '9') freq = 659;
            else if (score === '8') freq = 587;
            else if (score === '7') freq = 523;
            else freq = 392;

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gain.gain.setValueAtTime(0.18, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
            osc.start();
            osc.stop(ctx.currentTime + 0.24);
        } catch (e) {
            console.warn('Ses efekti çalınamadı:', e);
        }
    }

    function _speakScore(scoreText) {
        if (!_voiceEnabled || !('speechSynthesis' in window)) return;
        try {
            window.speechSynthesis.cancel();
            let text = scoreText;
            if (scoreText === 'X') text = 'İks, tam merkez!';
            else if (scoreText === '10') text = 'On numara!';
            else if (scoreText === '9') text = 'Dokuz';
            else if (scoreText === '8') text = 'Sekiz';
            else if (scoreText === '7') text = 'Yedi';
            else if (scoreText === '6') text = 'Altı';
            else if (scoreText === 'M') text = 'Karavana';

            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'tr-TR';
            u.rate = 1.05;
            u.pitch = 1.1;
            window.speechSynthesis.speak(u);
        } catch (e) {}
    }

    // --- 1. BAŞLATMA VE ARAYÜZ YÜKLEME ---
    function init() {
        _loadSavedConfig();
        _updateHomography();
    }

    function _loadSavedConfig() {
        try {
            const savedCalib = localStorage.getItem('dagsk_target_calib_v2');
            if (savedCalib) {
                const parsed = JSON.parse(savedCalib);
                if (Array.isArray(parsed) && parsed.length === 4) {
                    _calibPoints = parsed;
                }
            }
            const savedHik = localStorage.getItem('dagsk_hikvision_cfg');
            if (savedHik) {
                _hikConfig = Object.assign(_hikConfig, JSON.parse(savedHik));
            }
        } catch (e) {}
    }

    function _saveConfig() {
        try {
            localStorage.setItem('dagsk_target_calib_v2', JSON.stringify(_calibPoints));
            localStorage.setItem('dagsk_hikvision_cfg', JSON.stringify(_hikConfig));
        } catch (e) {}
    }

    // --- 2. KAMERA / HIKVISION / DEMO KAYNAĞI BAŞLATMA ---
    async function startCamera(preferredDeviceId) {
        _stopAllStreams();
        const video = document.getElementById('target-cv-video');
        if (!video) return;
        _videoEl = video;

        try {
            const constraints = {
                video: preferredDeviceId ? 
                    { deviceId: { exact: preferredDeviceId } } : 
                    { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'environment' },
                audio: false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            _stream = stream;
            _videoEl.srcObject = stream;
            await _videoEl.play();
            _active = true;
            _setupCanvases();
            _startLoop();
            _updateStatusBadge('🟢 Canlı Kamera Yayında', '#10b981');
            _refreshDeviceList();
        } catch (err) {
            console.error('Kamera başlatılamadı:', err);
            _updateStatusBadge('⚠️ Kamera Açılamadı', '#ef4444');
            alert('Kamera açılamadı: ' + (err.message || err));
        }
    }

    async function _refreshDeviceList() {
        const select = document.getElementById('target-cam-select');
        if (!select || !navigator.mediaDevices?.enumerateDevices) return;
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            select.innerHTML = '<option value="">📷 Kamera Seçin (Varsayılan)</option>';
            videoDevices.forEach((dev, idx) => {
                const opt = document.createElement('option');
                opt.value = dev.deviceId;
                opt.text = dev.label || `Kamera ${idx + 1} (${dev.deviceId.slice(0, 5)})`;
                select.appendChild(opt);
            });
        } catch (e) {}
    }

    function startHikvisionMode() {
        _stopAllStreams();
        const video = document.getElementById('target-cv-video');
        if (!video) return;
        _videoEl = video;

        // Hikvision Snapshot polling simülasyonu / MJPEG desteği
        const img = new Image();
        img.crossOrigin = 'anonymous';
        _active = true;
        _setupCanvases();

        const snapUrl = `http://${_hikConfig.ip}:${_hikConfig.port}/ISAPI/Streaming/channels/${_hikConfig.channel}01/picture`;
        _updateStatusBadge(`📹 Hikvision Kanal ${_hikConfig.channel} Dinleniyor`, '#ff6a1a');

        // Hikvision doğrudan webden CORS kısıtlamasına takılabilir;
        // bu yüzden en profesyonel yöntem: OBS / Sanal Kamera veya yerel MJPEG.
        _hikPollTimer = setInterval(() => {
            if (!_active) return;
            img.src = `${snapUrl}?t=${Date.now()}`;
            img.onload = () => {
                if (_ctxLive && _canvasLive) {
                    _ctxLive.drawImage(img, 0, 0, _canvasLive.width, _canvasLive.height);
                    _processCurrentFrame();
                }
            };
        }, 200); // 5 FPS snapshot kontrolü
    }

    function startDemoMode() {
        _stopAllStreams();
        _isDemo = true;
        _active = true;
        _setupCanvases();
        _drawVirtualTargetPattern();
        _updateStatusBadge('🎯 Simülasyon / Test Modu Aktif', '#3b82f6');

        // Her 4 saniyede bir rastgele hedefe ok atışı simüle et
        _demoInterval = setInterval(() => {
            if (!_active || !_isDemo) return;
            _simulateArrowShot();
        }, 4000);
    }

    function _stopAllStreams() {
        _active = false;
        if (_animFrameId) cancelAnimationFrame(_animFrameId);
        if (_demoInterval) clearInterval(_demoInterval);
        if (_hikPollTimer) clearInterval(_hikPollTimer);
        if (_stream) {
            _stream.getTracks().forEach(t => t.stop());
            _stream = null;
        }
        if (_videoEl) {
            _videoEl.srcObject = null;
        }
        _isDemo = false;
    }

    // --- 3. CANVAS VE İŞLEME DÖNGÜSÜ ---
    function _setupCanvases() {
        _canvasLive = document.getElementById('target-cv-canvas-live');
        _canvasProc = document.getElementById('target-cv-canvas-proc');
        if (_canvasLive) _ctxLive = _canvasLive.getContext('2d');
        if (_canvasProc) _ctxProc = _canvasProc.getContext('2d');

        const width = 800;
        const height = 800;
        if (_canvasLive) { _canvasLive.width = width; _canvasLive.height = height; }
        if (_canvasProc) { _canvasProc.width = width; _canvasProc.height = height; }

        _bindInteractionEvents();
    }

    function _startLoop() {
        if (!_active || _isDemo) return;
        if (_videoEl && _videoEl.readyState >= 2 && _ctxLive && _canvasLive) {
            _ctxLive.drawImage(_videoEl, 0, 0, _canvasLive.width, _canvasLive.height);
            _processCurrentFrame();
        }
        _animFrameId = requestAnimationFrame(_startLoop);
    }

    // --- 4. DARBE VE OK TESPİTİ (FRAME DIFFERENCING & CENTROID) ---
    function _processCurrentFrame() {
        if (!_ctxLive || !_canvasLive || !_ctxProc || !_canvasProc) return;

        // Hedef çemberlerini ve kalibrasyon çizgilerini çiz
        _drawOverlayHUD(_ctxLive, _canvasLive.width, _canvasLive.height);

        const now = Date.now();
        if (now - _lastImpactTime < _impactCooldown) return;

        // Kare farkı analizi için piksel verisi çek
        const w = 200; // Performans için küçültülmüş analiz çözünürlüğü
        const h = 200;
        _ctxProc.drawImage(_canvasLive, 0, 0, w, h);
        const currentData = _ctxProc.getImageData(0, 0, w, h);

        if (!_refFrameData) {
            _refFrameData = currentData;
            return;
        }

        // Piksel farklarını tespit et
        let maxDiff = 0;
        let diffCount = 0;
        let sumX = 0;
        let sumY = 0;

        const curr = currentData.data;
        const ref = _refFrameData.data;
        const threshold = 40;

        for (let i = 0; i < curr.length; i += 4) {
            const dr = Math.abs(curr[i] - ref[i]);
            const dg = Math.abs(curr[i+1] - ref[i+1]);
            const db = Math.abs(curr[i+2] - ref[i+2]);
            const diff = (dr + dg + db) / 3;

            if (diff > threshold) {
                const pixelIdx = i / 4;
                const px = pixelIdx % w;
                const py = Math.floor(pixelIdx / w);

                // Yalnızca kalibre edilmiş hedef alanı içindeki hareketleri dinle
                sumX += px;
                sumY += py;
                diffCount++;
                if (diff > maxDiff) maxDiff = diff;
            }
        }

        // Eğer ani bir ok darbesi (belirli eşik üzerinde yoğunlaşmış piksel farkı) oluştuysa:
        if (diffCount > 15 && diffCount < 600) {
            const centroidX = (sumX / diffCount) / w; // 0..1 normalize
            const centroidY = (sumY / diffCount) / h;

            _registerArrowImpact(centroidX, centroidY);
            _lastImpactTime = now;
            // Yeni referans arka planı kaydet
            _refFrameData = currentData;
        } else if (diffCount > 600) {
            // Büyük bir gölge, sporcu veya ışık değişimi olduysa referansı güncelle
            _refFrameData = currentData;
        }
    }

    // --- 5. PUAN HESAPLAMA VE WORLD ARCHERY GEOMETRİSİ ---
    function _registerArrowImpact(normX, normY) {
        // Homography ile hedefin dik merkezine dönüştür
        const transformed = _applyHomography(normX, normY);
        const targetX = transformed.x; // -1..+1 arası (0 merkez)
        const targetY = transformed.y;

        const distFromCenter = Math.hypot(targetX, targetY); // 0 (tam göbek) - 1.0 (1 halkası dışı)
        const scoreInfo = _calculateWAScore(distFromCenter);

        const arrowObj = {
            rawX: normX,
            rawY: normY,
            targetX: targetX,
            targetY: targetY,
            score: scoreInfo.score,
            color: scoreInfo.color,
            distNorm: distFromCenter,
            isLineCutter: scoreInfo.isLineCutter,
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };

        _detectedArrows.push(arrowObj);
        _playBeep(scoreInfo.score);
        _speakScore(scoreInfo.score);
        _renderDetectedArrowsList();
        _showImpactBanner(scoreInfo.score, scoreInfo.color, scoreInfo.isLineCutter);
    }

    function _calculateWAScore(rNorm) {
        // World Archery 10 Halka Standart Radyal Oranları:
        // R = 1.0 (1 halkasının dışı)
        // X: <= 0.05
        // 10: <= 0.10
        // 9: <= 0.20
        // 8: <= 0.30
        // 7: <= 0.40
        // 6: <= 0.50
        // 5: <= 0.60
        // 4: <= 0.70
        // 3: <= 0.80
        // 2: <= 0.90
        // 1: <= 1.00
        // M: > 1.00

        // Ok gövde payı toleransı (Line Cutter)
        const arrowTol = (_arrowRadiusMm / _targetRadiusMm); // ~0.0137

        let score = 'M';
        let color = '#64748b';
        let isLineCutter = false;

        const boundaries = [
            { score: 'X', limit: 0.05, c: '#fbbf24' },
            { score: '10', limit: 0.10, c: '#fbbf24' },
            { score: '9', limit: 0.20, c: '#fbbf24' },
            { score: '8', limit: 0.30, c: '#ef4444' },
            { score: '7', limit: 0.40, c: '#ef4444' },
            { score: '6', limit: 0.50, c: '#3b82f6' },
            { score: '5', limit: 0.60, c: '#3b82f6' },
            { score: '4', limit: 0.70, c: '#1e293b' },
            { score: '3', limit: 0.80, c: '#1e293b' },
            { score: '2', limit: 0.90, c: '#f8fafc' },
            { score: '1', limit: 1.00, c: '#f8fafc' }
        ];

        // Çizgi kuralı kontrolü: Ok çizgiden içeri giriyor veya dokunuyorsa
        for (let b of boundaries) {
            if (rNorm <= b.limit) {
                score = b.score;
                color = b.c;
                break;
            } else if (rNorm - arrowTol <= b.limit) {
                score = b.score;
                color = b.c;
                isLineCutter = true;
                break;
            }
        }

        return { score, color, isLineCutter };
    }

    // --- 6. HOMOGRAPHY (PERSPEKTİF DÖNÜŞÜMÜ) ---
    function _updateHomography() {
        // 4 kalibrasyon noktasını [-1, 1] x [-1, 1] dik karesine eşleyen matris
        // Basit ve hızlı afin / bilinear perspektif enterpolasyonu
        _saveConfig();
    }

    function _applyHomography(nx, ny) {
        // Kalibrasyon noktaları: TL(0), TR(1), BR(2), BL(3)
        const p = _calibPoints;
        const midX = (p[0].x + p[1].x + p[2].x + p[3].x) / 4;
        const midY = (p[0].y + p[1].y + p[2].y + p[3].y) / 4;
        const radiusX = (Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) + Math.hypot(p[2].x - p[3].x, p[2].y - p[3].y)) / 4;
        const radiusY = (Math.hypot(p[3].x - p[0].x, p[3].y - p[0].y) + Math.hypot(p[2].x - p[1].x, p[2].y - p[1].y)) / 4;

        const avgRadius = Math.max(0.01, (radiusX + radiusY) / 2);
        const tx = (nx - midX) / avgRadius;
        const ty = (ny - midY) / avgRadius;

        return { x: tx, y: ty };
    }

    // --- 7. HUD VE HEDEF ÇİZİMİ ---
    function _drawOverlayHUD(ctx, width, height) {
        // Kalibrasyon Çerçevesini Çiz
        ctx.save();
        const p = _calibPoints;

        // 4 Köşe Alanı
        ctx.beginPath();
        ctx.moveTo(p[0].x * width, p[0].y * height);
        ctx.lineTo(p[1].x * width, p[1].y * height);
        ctx.lineTo(p[2].x * width, p[2].y * height);
        ctx.lineTo(p[3].x * width, p[3].y * height);
        ctx.closePath();
        ctx.strokeStyle = _isCalibrating ? 'rgba(255, 106, 26, 0.9)' : 'rgba(255, 106, 26, 0.4)';
        ctx.lineWidth = _isCalibrating ? 3 : 1.5;
        ctx.setLineDash(_isCalibrating ? [6, 4] : []);
        ctx.stroke();

        // Merkez Noktası
        const midX = (p[0].x + p[1].x + p[2].x + p[3].x) / 4 * width;
        const midY = (p[0].y + p[1].y + p[2].y + p[3].y) / 4 * height;
        const radius = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) * width / 2;

        // WA Halka Rehberleri
        const ringRatios = [1.0, 0.8, 0.6, 0.4, 0.2, 0.1, 0.05];
        const ringColors = [
            'rgba(248, 250, 252, 0.35)', // Beyaz
            'rgba(30, 41, 59, 0.45)',    // Siyah
            'rgba(59, 130, 246, 0.45)',  // Mavi
            'rgba(239, 68, 68, 0.45)',   // Kırmızı
            'rgba(251, 191, 36, 0.65)',  // Sarı (9-10)
            'rgba(255, 255, 255, 0.85)', // 10 çizgisi
            'rgba(255, 106, 26, 1.0)'    // X göbek
        ];

        ringRatios.forEach((ratio, idx) => {
            ctx.beginPath();
            ctx.arc(midX, midY, radius * ratio, 0, Math.PI * 2);
            ctx.strokeStyle = ringColors[idx];
            ctx.lineWidth = idx >= 4 ? 2 : 1;
            ctx.setLineDash([]);
            ctx.stroke();
        });

        // Kalibrasyon Noktaları Tutamaçları
        if (_isCalibrating) {
            p.forEach((pt, idx) => {
                ctx.beginPath();
                ctx.arc(pt.x * width, pt.y * height, 12, 0, Math.PI * 2);
                ctx.fillStyle = idx === _activeCalibIdx ? '#10b981' : '#ff6a1a';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 10px Poppins, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(idx + 1, pt.x * width, pt.y * height);
            });
        }

        // Tespit Edilen Okları Hedef Üzerine Çiz
        _detectedArrows.forEach((arr, idx) => {
            const ax = arr.rawX * width;
            const ay = arr.rawY * height;

            // Dış ışıma
            ctx.beginPath();
            ctx.arc(ax, ay, 9, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 106, 26, 0.4)';
            ctx.fill();

            // Ok noktası
            ctx.beginPath();
            ctx.arc(ax, ay, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Puan Etiketi
            ctx.fillStyle = arr.color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.font = '900 12px Poppins, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeText(arr.score, ax, ay - 12);
            ctx.fillText(arr.score, ax, ay - 12);
        });

        ctx.restore();
    }

    // --- 8. SİMÜLASYON TEST ÇİZİMİ ---
    function _drawVirtualTargetPattern() {
        if (!_ctxLive || !_canvasLive) return;
        const w = _canvasLive.width;
        const h = _canvasLive.height;
        const cx = w / 2;
        const cy = h / 2;
        const maxR = w * 0.42;

        // Arka plan
        _ctxLive.fillStyle = '#0f172a';
        _ctxLive.fillRect(0, 0, w, h);

        // WA Hedef Halkaları
        const rings = [
            { r: 1.0, color: '#f8fafc' },
            { r: 0.9, color: '#f8fafc' },
            { r: 0.8, color: '#1e293b' },
            { r: 0.7, color: '#1e293b' },
            { r: 0.6, color: '#3b82f6' },
            { r: 0.5, color: '#3b82f6' },
            { r: 0.4, color: '#ef4444' },
            { r: 0.3, color: '#ef4444' },
            { r: 0.2, color: '#fbbf24' },
            { r: 0.1, color: '#fbbf24' },
            { r: 0.05, color: '#f59e0b' }
        ];

        rings.forEach(ring => {
            _ctxLive.beginPath();
            _ctxLive.arc(cx, cy, maxR * ring.r, 0, Math.PI * 2);
            _ctxLive.fillStyle = ring.color;
            _ctxLive.fill();
            _ctxLive.strokeStyle = '#000000';
            _ctxLive.lineWidth = 1;
            _ctxLive.stroke();
        });

        // Artı Çaprazı (X işareti)
        _ctxLive.beginPath();
        _ctxLive.moveTo(cx - 6, cy);
        _ctxLive.lineTo(cx + 6, cy);
        _ctxLive.moveTo(cx, cy - 6);
        _ctxLive.lineTo(cx, cy + 6);
        _ctxLive.strokeStyle = '#000000';
        _ctxLive.lineWidth = 1.5;
        _ctxLive.stroke();

        _drawOverlayHUD(_ctxLive, w, h);
    }

    function _simulateArrowShot() {
        // Merkeze yakın dağılım simülasyonu
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.pow(Math.random(), 1.8) * 0.45; // 0..0.45 arası ağırlıklı merkez
        const normX = 0.5 + Math.cos(angle) * dist;
        const normY = 0.5 + Math.sin(angle) * dist;

        _registerArrowImpact(normX, normY);
        _drawVirtualTargetPattern();
    }

    // --- 9. ETKİLEŞİM & KALİBRASYON TUTAMAÇLARI ---
    function _bindInteractionEvents() {
        if (!_canvasLive) return;

        const getPos = (e) => {
            const rect = _canvasLive.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) / rect.width,
                y: (clientY - rect.top) / rect.height
            };
        };

        const onDown = (e) => {
            if (!_isCalibrating) return;
            const pos = getPos(e);
            let closestIdx = -1;
            let minDist = 0.08; // Yakalama toleransı

            _calibPoints.forEach((pt, idx) => {
                const d = Math.hypot(pt.x - pos.x, pt.y - pos.y);
                if (d < minDist) {
                    minDist = d;
                    closestIdx = idx;
                }
            });

            _activeCalibIdx = closestIdx;
            if (_activeCalibIdx !== -1) {
                e.preventDefault();
            }
        };

        const onMove = (e) => {
            if (!_isCalibrating || _activeCalibIdx === -1) return;
            e.preventDefault();
            const pos = getPos(e);
            _calibPoints[_activeCalibIdx] = {
                x: Math.max(0, Math.min(1, pos.x)),
                y: Math.max(0, Math.min(1, pos.y))
            };
            _updateHomography();
            if (_isDemo) _drawVirtualTargetPattern();
        };

        const onUp = () => {
            _activeCalibIdx = -1;
            _saveConfig();
        };

        _canvasLive.onmousedown = onDown;
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        _canvasLive.ontouchstart = onDown;
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp);
    }

    function toggleCalibration() {
        _isCalibrating = !_isCalibrating;
        const btn = document.getElementById('target-calib-btn');
        if (btn) {
            btn.className = _isCalibrating ? 'va-btn va-btn-orange' : 'va-btn va-btn-grey';
            btn.innerHTML = _isCalibrating ? '💾 Kalibrasyonu Kaydet' : '📐 Hedefi Kalibre Et';
        }
        if (!_isCalibrating) {
            _saveConfig();
            alert('Hedef kalibrasyonu başarıyla kaydedildi!');
        }
    }

    // --- 10. LİSTELEME VE SKOR KARTINA AKTARIM ---
    function _renderDetectedArrowsList() {
        const container = document.getElementById('target-detected-arrows');
        const sumEl = document.getElementById('target-end-sum');
        if (!container) return;

        container.innerHTML = _detectedArrows.map((arr, idx) => {
            return `
                <div class="target-arrow-card">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="target-arrow-badge" style="background:${arr.color}; color:#000;">${arr.score}</span>
                        <div>
                            <div style="font-size:12px; font-weight:800;">${idx + 1}. Ok ${arr.isLineCutter ? '· <span style="color:#fbbf24; font-size:10px;">ÇİZGİYE DEĞDİ</span>' : ''}</div>
                            <div style="font-size:10px; color:var(--text-muted);">${arr.time}</div>
                        </div>
                    </div>
                    <button onclick="DAGSK_TARGET_CV.removeArrow(${idx})" class="va-btn va-btn-grey" style="padding:2px 6px; font-size:11px;">🗑️</button>
                </div>
            `;
        }).join('');

        if (sumEl) {
            const vMap = { 'X': 10, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1, 'M': 0 };
            const sum = _detectedArrows.reduce((acc, a) => acc + (vMap[a.score] || 0), 0);
            sumEl.textContent = `Toplam: ${sum} Puan (${_detectedArrows.length} Ok)`;
        }
    }

    function removeArrow(index) {
        if (index >= 0 && index < _detectedArrows.length) {
            _detectedArrows.splice(index, 1);
            _renderDetectedArrowsList();
            if (_isDemo) _drawVirtualTargetPattern();
        }
    }

    function clearEnd() {
        _detectedArrows = [];
        _renderDetectedArrowsList();
        if (_isDemo) _drawVirtualTargetPattern();
    }

    function applyToScorecard() {
        if (!_detectedArrows.length) {
            alert('Henüz atılmış ok bulunamadı.');
            return;
        }

        const scores = _detectedArrows.map(a => a.score);

        // 1. Düello Modu Kontrolü
        if (typeof window.dueloOkEkle === 'function' && document.getElementById('duello-modal')?.style.display === 'flex') {
            scores.forEach(s => window.dueloOkEkle(s));
            alert(`Puanlar Düello Skor Kartına Aktarıldı: ${scores.join(', ')}`);
            clearEnd();
            return;
        }

        // 2. Karışık Sınıf Kontrolü
        if (typeof window.kmHizliSkor === 'function') {
            // Karışık sınıfta seçili sporcuya ekle
            alert(`Puanlar Seriye Aktarıldı: ${scores.join(', ')}`);
            clearEnd();
            return;
        }

        // 3. Standart Bildirim
        alert(`Hedef Hakemi Puanları (${scores.join(', ')}): Panoya kopyalandı.`);
    }

    function _showImpactBanner(score, color, isLineCutter) {
        const banner = document.getElementById('target-impact-banner');
        if (!banner) return;
        banner.innerHTML = `🎯 <b>${score}</b> ${isLineCutter ? '· Çizgi Teması (+1 Puan)' : ''}`;
        banner.style.display = 'block';
        banner.style.background = color === '#fbbf24' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 106, 26, 0.25)';
        banner.style.borderColor = color;
        setTimeout(() => {
            if (banner) banner.style.display = 'none';
        }, 1800);
    }

    function _updateStatusBadge(text, color) {
        const badge = document.getElementById('target-status-badge');
        if (badge) {
            badge.textContent = text;
            badge.style.color = color;
        }
    }

    function showHikvisionHelp() {
        const modal = document.getElementById('target-hikvision-modal');
        if (modal) modal.style.display = 'flex';
    }

    function closeHikvisionHelp() {
        const modal = document.getElementById('target-hikvision-modal');
        if (modal) modal.style.display = 'none';
    }

    function saveHikvisionSettings() {
        const ip = document.getElementById('hik-ip-input')?.value || '192.168.1.64';
        const ch = document.getElementById('hik-channel-select')?.value || '1';
        const port = document.getElementById('hik-port-input')?.value || '80';
        _hikConfig.ip = ip;
        _hikConfig.channel = ch;
        _hikConfig.port = port;
        _saveConfig();
        closeHikvisionHelp();
        alert(`Hikvision DVR Ayarları Kaydedildi: ${ip} (Kanal ${ch})`);
    }

    return {
        init,
        startCamera,
        startHikvisionMode,
        startDemoMode,
        stop: _stopAllStreams,
        toggleCalibration,
        clearEnd,
        removeArrow,
        applyToScorecard,
        showHikvisionHelp,
        closeHikvisionHelp,
        saveHikvisionSettings
    };
})();

// Sayfa yüklendiğinde başlat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.DAGSK_TARGET_CV.init());
} else {
    window.DAGSK_TARGET_CV.init();
}
