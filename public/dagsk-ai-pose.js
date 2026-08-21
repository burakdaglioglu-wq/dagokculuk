/**
 * DAĞ S.K. — Yapay Zekâ Destekli Duruş & Form Analizi (AI Pose Detection)
 * Google MediaPipe Pose tabanlı, sıfır API anahtarı gerektiren %100 yerel okçuluk biomekanik analiz motoru.
 */

(function (global) {
    'use strict';

    // Durum değişkenleri
    let poseInstance = null;
    let cameraInstance = null;
    let isLiveActive = false;
    let isProcessingVideo = false;
    let currentHandedness = 'right'; // 'right' (sağlak - sol yay kolu) veya 'left' (solak - sağ yay kolu)
    let activeSource = 'camera'; // 'camera' | 'video'
    let currentFacingMode = 'environment'; // 'environment' (arka) | 'user' (ön kamera)
    let animationFrameId = null;

    // En son analiz sonucu
    let lastAnalysisResult = {
        score: 0,
        bowArmAngle: 0,
        drawElbowAngle: 0,
        drawElbowElevation: 0,
        shoulderTilt: 0,
        spineAngle: 0,
        headTilt: 0,
        feedbacks: [],
        timestamp: null
    };

    /**
     * İki 2D nokta arasındaki açıyı veya 3 nokta arasındaki eklem açısını hesaplar (Derece cinsinden: 0-180)
     */
    function calculateAngle(a, b, c) {
        if (!a || !b || !c) return 0;
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) {
            angle = 360.0 - angle;
        }
        return Math.round(angle * 10) / 10;
    }

    /**
     * İki nokta arasındaki yatay açı (Eğim)
     */
    function calculateSlopeAngle(p1, p2) {
        if (!p1 || !p2) return 0;
        const dy = p2.y - p1.y;
        const dx = p2.x - p1.x;
        const theta = Math.atan2(dy, dx);
        return Math.round(((theta * 180) / Math.PI) * 10) / 10;
    }

    /**
     * MediaPipe kütüphanelerinin yüklü olup olmadığını denetler veya dinamik yükler
     */
    async function ensureMediaPipeLoaded() {
        if (window.Pose) return true;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => {
                const camScript = document.createElement('script');
                camScript.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.4.1675466862/camera_utils.js';
                camScript.crossOrigin = 'anonymous';
                camScript.onload = () => resolve(true);
                camScript.onerror = () => reject(new Error('MediaPipe Camera Utils yüklenemedi.'));
                document.head.appendChild(camScript);
            };
            script.onerror = () => reject(new Error('MediaPipe Pose CDN bağlantısı kurulamadı.'));
            document.head.appendChild(script);
        });
    }

    /**
     * Pose motorunu başlatır
     */
    async function initPoseEngine() {
        if (poseInstance) return poseInstance;

        await ensureMediaPipeLoaded();

        poseInstance = new window.Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
        });

        poseInstance.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            smoothSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        poseInstance.onResults(onPoseResults);
        return poseInstance;
    }

    /**
     * Okçuluk Biomekanik Duruş Değerlendirmesi
     * 
     * Landmarks İndeksleri:
     * 11: Sol Omuz, 12: Sağ Omuz
     * 13: Sol Dirsek, 14: Sağ Dirsek
     * 15: Sol Bilek,  16: Sağ Bilek
     * 23: Sol Kalça,  24: Sağ Kalça
     * 0: Burun, 7: Sol Kulak, 8: Sağ Kulak
     */
    function evaluateArcheryForm(landmarks, handedness = 'right') {
        const isRight = handedness === 'right';

        // Yay kolu & Çekiş kolu eklemleri (Sağlak okçuda: Sol kol = Yay kolu, Sağ kol = Çekiş kolu)
        const bowShoulder = isRight ? landmarks[11] : landmarks[12];
        const bowElbow    = isRight ? landmarks[13] : landmarks[14];
        const bowWrist    = isRight ? landmarks[15] : landmarks[16];

        const drawShoulder = isRight ? landmarks[12] : landmarks[11];
        const drawElbow    = isRight ? landmarks[14] : landmarks[13];
        const drawWrist    = isRight ? landmarks[16] : landmarks[15];

        const leftHip  = landmarks[23];
        const rightHip = landmarks[24];
        const nose     = landmarks[0];

        const feedbacks = [];
        let score = 100;

        // 1. Yay Kolu Açısı (Bow Arm Lock) -> İdeal: 172° - 185°
        let bowArmAngle = 180;
        if (bowShoulder && bowElbow && bowWrist && bowElbow.visibility > 0.4) {
            bowArmAngle = calculateAngle(bowShoulder, bowElbow, bowWrist);
            if (bowArmAngle < 165) {
                const diff = Math.round(180 - bowArmAngle);
                score -= Math.min(25, diff * 1.5);
                feedbacks.push({
                    type: 'error',
                    badge: '🔴 Yay Kolu Bükük',
                    text: `Yay kolu dirseği bükülmüş (${bowArmAngle}°). Kolunu omuzdan ileri kilitlemelisin.`
                });
            } else if (bowArmAngle < 172) {
                score -= 8;
                feedbacks.push({
                    type: 'warn',
                    badge: '🟡 Yay Kolu Hafif Bükük',
                    text: `Yay kolu tam düz değil (${bowArmAngle}°). İdeal düzlük: 175°-180°.`
                });
            } else {
                feedbacks.push({
                    type: 'good',
                    badge: '🟢 Mükemmel Yay Kolu',
                    text: `Yay kolu kilitli ve stabil (${bowArmAngle}°).`
                });
            }
        }

        // 2. Çekiş Dirseği Açısı ve Yüksekliği (Draw Elbow Alignment)
        let drawElbowAngle = 45;
        if (drawShoulder && drawElbow && drawWrist && drawElbow.visibility > 0.4) {
            drawElbowAngle = calculateAngle(drawShoulder, drawElbow, drawWrist);

            // Dirsek omuza göre nerede? (Y ekseninde piksel farkı - Y aşağı doğru artar)
            const elbowHeightDiff = (drawShoulder.y - drawElbow.y); // pozitif = dirsek yüksek, negatif = dirsek düşük

            if (elbowHeightDiff < -0.05) {
                score -= 20;
                feedbacks.push({
                    type: 'error',
                    badge: '🔴 Düşük Çekiş Dirseği',
                    text: 'Çekiş dirseğin aşağıda kalmış! Sırt kaslarını kullanarak dirseğini omuz hizasına kaldır.'
                });
            } else if (elbowHeightDiff > 0.12) {
                score -= 10;
                feedbacks.push({
                    type: 'warn',
                    badge: '🟡 Aşırı Yüksek Dirsek',
                    text: 'Çekiş dirseği çok yukarı kalkmış. Rahat bir çapa için hafifçe dengele.'
                });
            } else {
                feedbacks.push({
                    type: 'good',
                    badge: '🟢 Çekiş Dirseği Hizası İdeal',
                    text: 'Çekiş dirseği ok ekseni ve omuz hattıyla mükemmel hizada.'
                });
            }
        }

        // 3. Omuz Hizalanması & T-Duruşu (Shoulder Tilt) -> İdeal: Yere paralel (< 7° eğim)
        let shoulderTilt = 0;
        if (landmarks[11] && landmarks[12] && landmarks[11].visibility > 0.4 && landmarks[12].visibility > 0.4) {
            shoulderTilt = Math.abs(calculateSlopeAngle(landmarks[11], landmarks[12]));
            if (shoulderTilt > 180) shoulderTilt = Math.abs(360 - shoulderTilt);
            if (shoulderTilt > 90) shoulderTilt = Math.abs(180 - shoulderTilt);

            if (shoulderTilt > 12) {
                score -= 18;
                feedbacks.push({
                    type: 'error',
                    badge: '🔴 Omuzlar Eğik / Sıkışık',
                    text: `Omuz eğimi yüksek (${shoulderTilt.toFixed(1)}°). Omuzlarını gevşetip aşağı bastırarak T-duruşu oluştur.`
                });
            } else if (shoulderTilt > 6) {
                score -= 6;
                feedbacks.push({
                    type: 'warn',
                    badge: '🟡 Omuz Dengesi',
                    text: `Hafif omuz eğimi tespit edildi (${shoulderTilt.toFixed(1)}°). Yay omzunu aşağıda tutmaya çalış.`
                });
            } else {
                feedbacks.push({
                    type: 'good',
                    badge: '🟢 Düz T-Omuz Hattı',
                    text: `Omuz çizgisi harika hizalanmış (${shoulderTilt.toFixed(1)}°).`
                });
            }
        }

        // 4. Omurga / Gövde Dikliği (Spine Angle) -> İdeal: 90° dik (85°-95°)
        let spineAngle = 90;
        if (leftHip && rightHip && landmarks[11] && landmarks[12]) {
            const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
            const midShoulder = { x: (landmarks[11].x + landmarks[12].x) / 2, y: (landmarks[11].y + landmarks[12].y) / 2 };
            
            const angleFromVert = Math.abs(Math.atan2(midShoulder.x - midHip.x, midHip.y - midShoulder.y) * 180 / Math.PI);
            spineAngle = Math.round(90 - angleFromVert);

            if (angleFromVert > 8) {
                score -= 15;
                feedbacks.push({
                    type: 'error',
                    badge: '🔴 Gövde Eğik',
                    text: `Gövde dikey eksenden ${angleFromVert.toFixed(1)}° kaymış. Ağırlığı iki ayağa eşit dağıt, öne/arkaya yatma.`
                });
            } else {
                feedbacks.push({
                    type: 'good',
                    badge: '🟢 Dik Omurga & Dengeli Postür',
                    text: 'Gövde dikliği ve ağırlık merkezi dengeli.'
                });
            }
        }

        // 5. Çapa & Baş Pozisyonu (Anchor Stability)
        if (nose && drawWrist && nose.visibility > 0.4 && drawWrist.visibility > 0.4) {
            const dist = Math.hypot(nose.x - drawWrist.x, nose.y - drawWrist.y);
            if (dist > 0.28) {
                score -= 10;
                feedbacks.push({
                    type: 'warn',
                    badge: '🟡 Çapa Mesafesi Açık',
                    text: 'Çekiş eli çeneden/yüzden uzakta görünüyor. Çapa noktanı sabitlemeyi unutma.'
                });
            }
        }

        // Skoru 0 - 100 aralığında sınırla
        score = Math.max(0, Math.min(100, Math.round(score)));

        return {
            score,
            bowArmAngle,
            drawElbowAngle,
            drawElbowElevation: 0,
            shoulderTilt,
            spineAngle,
            feedbacks,
            timestamp: Date.now()
        };
    }

    /**
     * Pose sonuçlarını Canvas üzerine fütüristik çizgiler ve açı göstergeleri ile çizer
     */
    function onPoseResults(results) {
        const canvas = document.getElementById('ai-pose-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.save();
        ctx.clearRect(0, 0, width, height);

        if (!results.poseLandmarks) {
            ctx.restore();
            return;
        }

        const landmarks = results.poseLandmarks;
        const analysis = evaluateArcheryForm(landmarks, currentHandedness);
        lastAnalysisResult = analysis;

        // Okçuluk Kemik Bağlantıları (Önemli üst gövde ve kollar)
        const connections = [
            [11, 12], // Omuz - Omuz
            [11, 13], [13, 15], // Sol Kol (Omuz-Dirsek-Bilek)
            [12, 14], [14, 16], // Sağ Kol (Omuz-Dirsek-Bilek)
            [11, 23], [12, 24], // Gövde (Omuz-Kalça)
            [23, 24], // Kalça - Kalça
            [23, 25], [25, 27], // Sol Bacak
            [24, 26], [26, 28]  // Sağ Bacak
        ];

        // 1. İskelet Çizgileri (Glow Efekti)
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        connections.forEach(([i, j]) => {
            const p1 = landmarks[i];
            const p2 = landmarks[j];
            if (!p1 || !p2 || p1.visibility < 0.4 || p2.visibility < 0.4) return;

            const isBowArm = (currentHandedness === 'right' && (i === 11 || i === 13) && (j === 13 || j === 15)) ||
                             (currentHandedness === 'left' && (i === 12 || i === 14) && (j === 14 || j === 16));
            
            const isDrawArm = (currentHandedness === 'right' && (i === 12 || i === 14) && (j === 14 || j === 16)) ||
                              (currentHandedness === 'left' && (i === 11 || i === 13) && (j === 13 || j === 15));

            ctx.beginPath();
            ctx.moveTo(p1.x * width, p1.y * height);
            ctx.lineTo(p2.x * width, p2.y * height);

            if (isBowArm) {
                ctx.lineWidth = 5;
                ctx.strokeStyle = analysis.bowArmAngle >= 170 ? '#00f0ff' : '#ff3366';
                ctx.shadowColor = ctx.strokeStyle;
                ctx.shadowBlur = 10;
            } else if (isDrawArm) {
                ctx.lineWidth = 5;
                ctx.strokeStyle = '#ffb703';
                ctx.shadowColor = '#ffb703';
                ctx.shadowBlur = 10;
            } else {
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
        });

        // 2. Eklem Noktaları
        ctx.shadowBlur = 8;
        landmarks.forEach((p, idx) => {
            if (!p || p.visibility < 0.4) return;
            if ([0, 11, 12, 13, 14, 15, 16, 23, 24].includes(idx)) {
                ctx.beginPath();
                ctx.arc(p.x * width, p.y * height, idx === 0 ? 5 : 7, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = '#00f0ff';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#0f172a';
                ctx.stroke();
            }
        });

        // 3. Ekranda Açı Etiketleri Çizimi
        const isRight = currentHandedness === 'right';
        const bowElbow = isRight ? landmarks[13] : landmarks[14];
        const drawElbow = isRight ? landmarks[14] : landmarks[13];

        if (bowElbow && bowElbow.visibility > 0.4) {
            drawAngleLabel(ctx, `${analysis.bowArmAngle}°`, bowElbow.x * width, bowElbow.y * height - 16, 
                analysis.bowArmAngle >= 172 ? '#00f0ff' : '#ff3366');
        }

        if (drawElbow && drawElbow.visibility > 0.4) {
            drawAngleLabel(ctx, `${analysis.drawElbowAngle}°`, drawElbow.x * width, drawElbow.y * height - 16, '#ffb703');
        }

        ctx.restore();

        // UI Dashboard'ı Güncelle
        updateHUDDashboard(analysis);
    }

    /**
     * Canvas üzerine şık açı kutucuğu çizer
     */
    function drawAngleLabel(ctx, text, x, y, color) {
        ctx.save();
        ctx.font = 'bold 12px Poppins, sans-serif';
        const textWidth = ctx.measureText(text).width;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        
        const px = x - textWidth / 2 - 6;
        const py = y - 10;
        const pw = textWidth + 12;
        const ph = 20;
        
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(px, py, pw, ph, 6);
        } else {
            ctx.rect(px, py, pw, ph);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    /**
     * Arayüzdeki Skor ve İpuçları Panelini Günceller
     */
    function updateHUDDashboard(analysis) {
        const scoreEl = document.getElementById('ai-pose-score');
        const scoreRing = document.getElementById('ai-pose-score-ring');
        const feedbacksList = document.getElementById('ai-pose-feedbacks');
        const bowArmEl = document.getElementById('ai-val-bowarm');
        const drawElbowEl = document.getElementById('ai-val-drawelbow');
        const shoulderTiltEl = document.getElementById('ai-val-shoulder');

        if (scoreEl) {
            scoreEl.textContent = analysis.score;
            const scoreColor = analysis.score >= 80 ? 'var(--neon-green)' : (analysis.score >= 60 ? 'var(--gold)' : 'var(--neon-red)');
            scoreEl.style.color = scoreColor;
            if (scoreRing) scoreRing.style.borderColor = scoreColor;
        }

        if (bowArmEl) {
            bowArmEl.textContent = `${analysis.bowArmAngle}°`;
            bowArmEl.style.color = analysis.bowArmAngle >= 172 ? 'var(--neon-green)' : (analysis.bowArmAngle >= 165 ? 'var(--gold)' : 'var(--neon-red)');
        }

        if (drawElbowEl) {
            drawElbowEl.textContent = `${analysis.drawElbowAngle}°`;
        }

        if (shoulderTiltEl) {
            shoulderTiltEl.textContent = `${analysis.shoulderTilt.toFixed(1)}°`;
            shoulderTiltEl.style.color = analysis.shoulderTilt <= 6 ? 'var(--neon-green)' : 'var(--gold)';
        }

        if (feedbacksList) {
            if (!analysis.feedbacks || analysis.feedbacks.length === 0) {
                feedbacksList.innerHTML = '<div style="color:var(--text-muted); font-size:12px; text-align:center; padding:8px;">Kamera karşısında duruşa geçin...</div>';
            } else {
                feedbacksList.innerHTML = analysis.feedbacks.map(f => `
                    <div class="ai-feedback-item ai-fb-${f.type}">
                        <div class="ai-fb-badge">${f.badge}</div>
                        <div class="ai-fb-text">${f.text}</div>
                    </div>
                `).join('');
            }
        }
    }

    /**
     * Canlı AI Kamerayı Başlatır
     */
    async function startLiveCamera() {
        const videoElement = document.getElementById('ai-pose-video');
        const canvasElement = document.getElementById('ai-pose-canvas');
        const startBtn = document.getElementById('ai-pose-cam-start');
        const stopBtn = document.getElementById('ai-pose-cam-stop');
        const statusText = document.getElementById('ai-pose-status');

        if (!videoElement || !canvasElement) return;

        try {
            if (statusText) statusText.textContent = 'Yapay zekâ motoru hazırlanıyor...';
            await initPoseEngine();

            if (statusText) statusText.textContent = 'Kamera açılıyor...';
            
            // Kamera akışını başlat
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: currentFacingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            videoElement.srcObject = stream;
            await videoElement.play();

            videoElement.onloadedmetadata = () => {
                canvasElement.width = videoElement.videoWidth || 640;
                canvasElement.height = videoElement.videoHeight || 480;
            };

            isLiveActive = true;
            activeSource = 'camera';

            if (startBtn) startBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'inline-flex';
            if (statusText) statusText.textContent = '🟢 Canlı Duruş Takibi Aktif';

            const processFrame = async () => {
                if (!isLiveActive || activeSource !== 'camera') return;
                if (videoElement.readyState >= 2) {
                    await poseInstance.send({ image: videoElement });
                }
                animationFrameId = requestAnimationFrame(processFrame);
            };
            processFrame();

        } catch (err) {
            console.error('AI Kamera Başlatma Hatası:', err);
            if (statusText) statusText.textContent = '⚠️ Kamera başlatılamadı: ' + (err.message || err);
            if (window.showToast) window.showToast('Kamera açılamadı. Lütfen kamera izinlerini kontrol edin.', 'error');
        }
    }

    /**
     * Canlı AI Kamerayı Durdurur
     */
    function stopLiveCamera() {
        isLiveActive = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        const videoElement = document.getElementById('ai-pose-video');
        if (videoElement && videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }

        const canvasElement = document.getElementById('ai-pose-canvas');
        if (canvasElement) {
            const ctx = canvasElement.getContext('2d');
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        }

        const startBtn = document.getElementById('ai-pose-cam-start');
        const stopBtn = document.getElementById('ai-pose-cam-stop');
        const statusText = document.getElementById('ai-pose-status');

        if (startBtn) startBtn.style.display = 'inline-flex';
        if (stopBtn) stopBtn.style.display = 'none';
        if (statusText) statusText.textContent = 'Kamera durduruldu.';
    }

    /**
     * Ön / Arka Kamera Geçişi
     */
    async function toggleCameraFacing() {
        currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
        if (isLiveActive) {
            stopLiveCamera();
            await startLiveCamera();
        }
    }

    /**
     * Sağlak / Solak Okçu Seçimi
     */
    function setHandedness(handedness) {
        currentHandedness = handedness;
        const rBtn = document.getElementById('ai-hand-right');
        const lBtn = document.getElementById('ai-hand-left');
        if (rBtn && lBtn) {
            if (handedness === 'right') {
                rBtn.classList.add('aktif');
                lBtn.classList.remove('aktif');
            } else {
                lBtn.classList.add('aktif');
                rBtn.classList.remove('aktif');
            }
        }
        if (window.showToast) {
            window.showToast(handedness === 'right' ? '🏹 Sağlak okçu modu seçildi (Sol kol yay kolu)' : '🏹 Solak okçu modu seçildi (Sağ kol yay kolu)');
        }
    }

    /**
     * Yüklenen veya Mevcut Video Üzerinde Kare / Canlı Analiz
     */
    async function analyzeVideoElement(videoEl) {
        if (!videoEl) return;
        await initPoseEngine();
        const canvasElement = document.getElementById('ai-pose-canvas');
        if (canvasElement) {
            canvasElement.width = videoEl.videoWidth || 640;
            canvasElement.height = videoEl.videoHeight || 480;
        }
        await poseInstance.send({ image: videoEl });
    }

    /**
     * O Anki Analizli Kareyi Fotoğraf / Rapor Olarak Kaydetme
     */
    function captureAnalysisCard() {
        const videoElement = document.getElementById('ai-pose-video');
        const canvasElement = document.getElementById('ai-pose-canvas');
        if (!videoElement || !canvasElement) return;

        const mergeCanvas = document.createElement('canvas');
        mergeCanvas.width = canvasElement.width || 640;
        mergeCanvas.height = canvasElement.height || 480;
        const ctx = mergeCanvas.getContext('2d');

        // 1. Video karesi
        ctx.drawImage(videoElement, 0, 0, mergeCanvas.width, mergeCanvas.height);

        // 2. Üzerine AI iskelet ve açı çizgileri
        ctx.drawImage(canvasElement, 0, 0, mergeCanvas.width, mergeCanvas.height);

        // 3. DAĞ S.K. Master OS Filigran & Skor Rozeti
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(12, 12, 240, 78);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(12, 12, 240, 78);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px Poppins, sans-serif';
        ctx.fillText('🎯 DAĞ S.K. AI Duruş Analizi', 22, 34);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px Poppins, sans-serif';
        ctx.fillText(`Form Skoru: %${lastAnalysisResult.score}  |  Yay: ${lastAnalysisResult.bowArmAngle}°`, 22, 54);

        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = '10px Poppins, sans-serif';
        const dateStr = new Date().toLocaleDateString('tr-TR') + ' ' + new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        ctx.fillText(dateStr, 22, 72);
        ctx.restore();

        // İndir
        const link = document.createElement('a');
        link.download = `DAG_SK_Duruş_Analizi_${Date.now()}.png`;
        link.href = mergeCanvas.toDataURL('image/png');
        link.click();

        if (window.showToast) window.showToast('📸 Duruş analiz kartı cihaza kaydedildi!', 'success');
    }

    // Dışa Aktarılan Modül Arayüzü
    global.DAGSK_AI_POSE = {
        init: initPoseEngine,
        startLiveCamera,
        stopLiveCamera,
        toggleCameraFacing,
        setHandedness,
        analyzeVideoElement,
        captureAnalysisCard,
        getAnalysis: () => lastAnalysisResult
    };

})(typeof window !== 'undefined' ? window : this);
