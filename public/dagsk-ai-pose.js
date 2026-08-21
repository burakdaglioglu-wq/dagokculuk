/**
 * DAĞ S.K. — Yapay Zekâ Destekli Duruş & Form Analizi (AI Pose Detection)
 * Google MediaPipe Pose tabanlı, %100 yerel canlı kamera ve kayıtlı video analiz motoru.
 */

(function (global) {
    'use strict';

    // Durum değişkenleri
    let poseInstance = null;
    let isLiveActive = false;
    let isVideoLoaded = false;
    let isVideoPlaying = false;
    let currentHandedness = 'right'; // 'right' (sağlak) | 'left' (solak)
    let currentSourceMode = 'camera'; // 'camera' | 'video'
    let currentFacingMode = 'environment'; // 'environment' | 'user'
    let animationFrameId = null;
    let videoProcessingRAF = null;

    // En son analiz sonucu
    let lastAnalysisResult = {
        score: 0,
        bowArmAngle: 0,
        drawElbowAngle: 0,
        shoulderTilt: 0,
        spineAngle: 0,
        feedbacks: [],
        timestamp: null
    };

    /**
     * İki 2D nokta arasındaki açıyı hesaplar (Derece: 0-180)
     */
    function calculateAngle(a, b, c) {
        if (!a || !b || !c) return 0;
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) angle = 360.0 - angle;
        return Math.round(angle * 10) / 10;
    }

    /**
     * İki nokta arasındaki yatay eğim açısı
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
     */
    function evaluateArcheryForm(landmarks, handedness = 'right') {
        const isRight = handedness === 'right';

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

        // 1. Yay Kolu Açısı -> İdeal: 172° - 185°
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

        // 2. Çekiş Dirseği Açısı ve Yüksekliği
        let drawElbowAngle = 45;
        if (drawShoulder && drawElbow && drawWrist && drawElbow.visibility > 0.4) {
            drawElbowAngle = calculateAngle(drawShoulder, drawElbow, drawWrist);
            const elbowHeightDiff = (drawShoulder.y - drawElbow.y);

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
                    text: 'Çekiş dirseği ok ekseni ve omuz hattıyla dengeli.'
                });
            }
        }

        // 3. Omuz Hizalanması & T-Duruşu
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
                    text: `Omuz eğimi yüksek (${shoulderTilt.toFixed(1)}°). Omuzlarını gevşetip aşağı bastır.`
                });
            } else if (shoulderTilt > 6) {
                score -= 6;
                feedbacks.push({
                    type: 'warn',
                    badge: '🟡 Omuz Dengesi',
                    text: `Hafif omuz eğimi tespit edildi (${shoulderTilt.toFixed(1)}°).`
                });
            } else {
                feedbacks.push({
                    type: 'good',
                    badge: '🟢 Düz T-Omuz Hattı',
                    text: `Omuz çizgisi harika hizalanmış (${shoulderTilt.toFixed(1)}°).`
                });
            }
        }

        // 4. Omurga Dikliği
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
                    text: `Gövde dikey eksenden ${angleFromVert.toFixed(1)}° kaymış. Dik duruşunu koru.`
                });
            } else {
                feedbacks.push({
                    type: 'good',
                    badge: '🟢 Dik Omurga & Dengeli Postür',
                    text: 'Gövde dikliği ve ağırlık merkezi dengeli.'
                });
            }
        }

        // 5. Çapa Mesafesi
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

        score = Math.max(0, Math.min(100, Math.round(score)));

        return {
            score,
            bowArmAngle,
            drawElbowAngle,
            shoulderTilt,
            spineAngle,
            feedbacks,
            timestamp: Date.now()
        };
    }

    /**
     * Pose sonuçlarını Canvas üzerine çizer
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

        const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
            [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]
        ];

        // 1. İskelet Kemikleri
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

        // 2. Eklemler
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

        // 3. Açı Etiketleri
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
        updateHUDDashboard(analysis);
    }

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
        if (ctx.roundRect) ctx.roundRect(px, py, pw, ph, 6);
        else ctx.rect(px, py, pw, ph);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

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
                feedbacksList.innerHTML = '<div style="color:var(--text-muted); font-size:12px; text-align:center; padding:8px;">Atış duruşu algılanıyor...</div>';
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
     * Kaynak Modunu Değiştirir: 'camera' veya 'video'
     */
    function setSourceMode(mode) {
        currentSourceMode = mode;
        const camTabBtn = document.getElementById('ai-src-cam-btn');
        const vidTabBtn = document.getElementById('ai-src-vid-btn');
        const camControls = document.getElementById('ai-cam-controls');
        const vidUploadBox = document.getElementById('ai-vid-upload-box');
        const vidPlayerControls = document.getElementById('ai-vid-controls');
        const statusText = document.getElementById('ai-pose-status');

        if (mode === 'camera') {
            if (camTabBtn) camTabBtn.classList.add('aktif');
            if (vidTabBtn) vidTabBtn.classList.remove('aktif');
            if (camControls) camControls.style.display = 'flex';
            if (vidUploadBox) vidUploadBox.style.display = 'none';
            if (vidPlayerControls) vidPlayerControls.style.display = 'none';
            if (statusText) statusText.textContent = '📷 Kamera Bekleniyor';
            stopVideoPlayback();
        } else {
            if (camTabBtn) camTabBtn.classList.remove('aktif');
            if (vidTabBtn) vidTabBtn.classList.add('aktif');
            if (camControls) camControls.style.display = 'none';
            if (vidUploadBox) vidUploadBox.style.display = isVideoLoaded ? 'none' : 'block';
            if (vidPlayerControls) vidPlayerControls.style.display = isVideoLoaded ? 'flex' : 'none';
            if (statusText) statusText.textContent = isVideoLoaded ? '🎬 Video Analizi Hazır' : '📂 Video Yükleyin';
            stopLiveCamera();
        }
    }

    /**
     * Canlı Kamerayı Başlatır
     */
    async function startLiveCamera() {
        const videoElement = document.getElementById('ai-pose-video');
        const canvasElement = document.getElementById('ai-pose-canvas');
        const startBtn = document.getElementById('ai-pose-cam-start');
        const stopBtn = document.getElementById('ai-pose-cam-stop');
        const statusText = document.getElementById('ai-pose-status');

        if (!videoElement || !canvasElement) return;

        try {
            if (statusText) statusText.textContent = 'Motor hazırlanıyor...';
            await initPoseEngine();

            if (statusText) statusText.textContent = 'Kamera açılıyor...';
            
            // Eğer video oynuyorsa durdur
            stopVideoPlayback();

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

            if (startBtn) startBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'inline-flex';
            if (statusText) statusText.textContent = '🟢 Canlı Duruş Takibi Aktif';

            const processFrame = async () => {
                if (!isLiveActive || currentSourceMode !== 'camera') return;
                if (videoElement.readyState >= 2) {
                    await poseInstance.send({ image: videoElement });
                }
                animationFrameId = requestAnimationFrame(processFrame);
            };
            processFrame();

        } catch (err) {
            console.error('AI Kamera Başlatma Hatası:', err);
            if (statusText) statusText.textContent = '⚠️ Kamera açılamadı: ' + (err.message || err);
            if (window.showToast) window.showToast('Kamera açılamadı. Lütfen kamera izinlerini kontrol edin.', 'error');
        }
    }

    /**
     * Canlı Kamerayı Durdurur
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
        if (statusText && currentSourceMode === 'camera') statusText.textContent = 'Kamera durduruldu.';
    }

    /**
     * Video Dosyasını Yükler ve Analiz İçin Hazırlar
     */
    async function loadVideoFile(file) {
        if (!file) return;

        const videoElement = document.getElementById('ai-pose-video');
        const canvasElement = document.getElementById('ai-pose-canvas');
        const statusText = document.getElementById('ai-pose-status');
        const vidUploadBox = document.getElementById('ai-vid-upload-box');
        const vidControls = document.getElementById('ai-vid-controls');

        try {
            stopLiveCamera();
            if (statusText) statusText.textContent = 'Video yükleniyor ve AI hazırlanıyor...';
            await initPoseEngine();

            const videoURL = URL.createObjectURL(file);
            videoElement.srcObject = null;
            videoElement.src = videoURL;
            videoElement.load();

            videoElement.onloadeddata = async () => {
                canvasElement.width = videoElement.videoWidth || 640;
                canvasElement.height = videoElement.videoHeight || 480;
                isVideoLoaded = true;

                if (vidUploadBox) vidUploadBox.style.display = 'none';
                if (vidControls) vidControls.style.display = 'flex';
                if (statusText) statusText.textContent = '🎬 Video yüklendi. Oynatabilir veya kare kare inceleyebilirsiniz.';

                updateVideoTimeline();
                // İlk kareyi hemen analiz et
                await analyzeCurrentVideoFrame();
                if (window.showToast) window.showToast('✅ Video başarıyla yüklendi. Oynatın veya durdurup kareyi inceleyin.', 'success');
            };

            // Video oynatma/durdurma olayları
            videoElement.ontimeupdate = () => {
                updateVideoTimeline();
                if (videoElement.paused) {
                    analyzeCurrentVideoFrame();
                }
            };

        } catch (err) {
            console.error('Video yükleme hatası:', err);
            if (statusText) statusText.textContent = '⚠️ Video yüklenemedi: ' + (err.message || err);
        }
    }

    /**
     * Tek bir video karesini anlık analiz eder
     */
    async function analyzeCurrentVideoFrame() {
        const videoElement = document.getElementById('ai-pose-video');
        if (!videoElement || videoElement.readyState < 2 || !poseInstance) return;
        try {
            await poseInstance.send({ image: videoElement });
        } catch (e) {}
    }

    /**
     * Video Oynat / Durdur
     */
    async function toggleVideoPlay() {
        const videoElement = document.getElementById('ai-pose-video');
        const playBtn = document.getElementById('ai-vid-play-btn');
        if (!videoElement) return;

        if (videoElement.paused) {
            await videoElement.play();
            if (playBtn) playBtn.innerHTML = '⏸ Durdur';
            isVideoPlaying = true;

            const processVideoFrame = async () => {
                if (!videoElement.paused && !videoElement.ended) {
                    if (videoElement.readyState >= 2) {
                        await poseInstance.send({ image: videoElement });
                    }
                    videoProcessingRAF = requestAnimationFrame(processVideoFrame);
                } else {
                    if (playBtn) playBtn.innerHTML = '▶ Oynat';
                    isVideoPlaying = false;
                }
            };
            processVideoFrame();
        } else {
            videoElement.pause();
            if (playBtn) playBtn.innerHTML = '▶ Oynat';
            isVideoPlaying = false;
            if (videoProcessingRAF) cancelAnimationFrame(videoProcessingRAF);
            analyzeCurrentVideoFrame();
        }
    }

    function stopVideoPlayback() {
        const videoElement = document.getElementById('ai-pose-video');
        if (videoElement) {
            videoElement.pause();
        }
        if (videoProcessingRAF) {
            cancelAnimationFrame(videoProcessingRAF);
            videoProcessingRAF = null;
        }
        isVideoPlaying = false;
    }

    /**
     * Videoda Kare Kare İlerleme (Örn: -0.1sn / +0.1sn)
     */
    function stepVideoFrame(seconds) {
        const videoElement = document.getElementById('ai-pose-video');
        if (!videoElement || !isVideoLoaded) return;
        videoElement.pause();
        const playBtn = document.getElementById('ai-vid-play-btn');
        if (playBtn) playBtn.innerHTML = '▶ Oynat';

        videoElement.currentTime = Math.max(0, Math.min(videoElement.duration || 0, videoElement.currentTime + seconds));
    }

    /**
     * Oynatma Hızı Ayarı (0.25x, 0.5x, 1x)
     */
    function setVideoSpeed(speed) {
        const videoElement = document.getElementById('ai-pose-video');
        if (!videoElement) return;
        videoElement.playbackRate = speed;
        ['025', '05', '1'].forEach(s => {
            const btn = document.getElementById(`ai-speed-${s}`);
            if (btn) btn.classList.remove('aktif');
        });
        const currentBtn = document.getElementById(`ai-speed-${speed === 0.25 ? '025' : (speed === 0.5 ? '05' : '1')}`);
        if (currentBtn) currentBtn.classList.add('aktif');
    }

    /**
     * Zaman Çubuğu Kaydırma
     */
    function onVideoSeek(e) {
        const videoElement = document.getElementById('ai-pose-video');
        if (!videoElement || !videoElement.duration) return;
        const pct = e.target.value / 100;
        videoElement.currentTime = pct * videoElement.duration;
    }

    function updateVideoTimeline() {
        const videoElement = document.getElementById('ai-pose-video');
        const seekBar = document.getElementById('ai-vid-seek');
        const timeLabel = document.getElementById('ai-vid-time');
        if (!videoElement || !seekBar) return;

        const cur = videoElement.currentTime || 0;
        const dur = videoElement.duration || 0;
        if (dur > 0) {
            seekBar.value = (cur / dur) * 100;
        }

        if (timeLabel) {
            const formatTime = (t) => {
                const m = Math.floor(t / 60);
                const s = (t % 60).toFixed(1);
                return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            };
            timeLabel.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
        }
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
            rBtn.classList.toggle('aktif', handedness === 'right');
            lBtn.classList.toggle('aktif', handedness === 'left');
        }
        if (window.showToast) {
            window.showToast(handedness === 'right' ? '🏹 Sağlak okçu modu seçildi (Sol kol yay kolu)' : '🏹 Solak okçu modu seçildi (Sağ kol yay kolu)');
        }
        // Eğer durdurulmuş bir video karesi varsa hemen tekrar analiz et
        if (currentSourceMode === 'video' && isVideoLoaded) {
            analyzeCurrentVideoFrame();
        }
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
        ctx.fillRect(12, 12, 250, 80);
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(12, 12, 250, 80);

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
        setSourceMode,
        startLiveCamera,
        stopLiveCamera,
        loadVideoFile,
        toggleVideoPlay,
        stepVideoFrame,
        setVideoSpeed,
        onVideoSeek,
        toggleCameraFacing,
        setHandedness,
        captureAnalysisCard,
        getAnalysis: () => lastAnalysisResult
    };

})(typeof window !== 'undefined' ? window : this);
