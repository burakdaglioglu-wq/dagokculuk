/**
 * DAĞ S.K. — Yapay Zekâ Destekli Duruş & Form Analizi (AI Pose Detection) — Pro v8
 * Tam ekranda entegre çizim araçları, Yakınlaştırma (Zoom & Pan & Pinch),
 * dengelenmiş/küçültülmüş zarif eklem halkaları ve kusursuz PC/Tablet uyumluluğu.
 */

(function (global) {
    'use strict';

    // Durum değişkenleri
    let poseInstance = null;
    let isLiveActive = false;
    let isVideoLoaded = false;
    let isVideoPlaying = false;
    let isProcessingVideoFrame = false;
    let currentHandedness = 'right'; // 'right' (sağlak) | 'left' (solak)
    let currentSourceMode = 'camera'; // 'camera' | 'video'
    let currentFacingMode = 'environment'; // 'environment' | 'user'
    let animationFrameId = null;
    let videoProcessingRAF = null;

    // En son analiz sonucu
    let lastAnalysisResult = {
        score: 100,
        bowArmAngle: 180,
        drawElbowAngle: 45,
        shoulderTilt: 0,
        spineAngle: 90,
        anchorStatus: 'Kilitli 🟢',
        feedbacks: [],
        timestamp: null
    };

    // ==========================================
    // 🔍 YAKINLAŞTIRMA & KAYDIRMA SİSTEMİ (ZOOM & PAN)
    // ==========================================
    const zoomState = {
        scale: 1.0,
        panX: 0,
        panY: 0,
        isPanning: false,
        startX: 0,
        startY: 0,
        startPanX: 0,
        startPanY: 0,
        initialPinchDist: 0
    };

    function applyZoomTransform() {
        const inner = document.getElementById('ai-pose-inner');
        const badge = document.getElementById('ai-zoom-val');
        if (!inner) return;

        if (zoomState.scale <= 1.0) {
            zoomState.scale = 1.0;
            zoomState.panX = 0;
            zoomState.panY = 0;
            inner.style.transform = 'none';
        } else {
            inner.style.transform = `scale(${zoomState.scale.toFixed(2)}) translate(${zoomState.panX.toFixed(1)}px, ${zoomState.panY.toFixed(1)}px)`;
        }

        if (badge) badge.textContent = `${zoomState.scale.toFixed(1)}x`;
    }

    function zoomStep(delta) {
        zoomState.scale = Math.max(1.0, Math.min(3.5, zoomState.scale + delta));
        if (zoomState.scale === 1.0) {
            zoomState.panX = 0;
            zoomState.panY = 0;
        }
        applyZoomTransform();
        if (window.showToast && zoomState.scale > 1.0) {
            window.showToast(`🔍 Yakınlaştırma: ${zoomState.scale.toFixed(1)}x (Kaydırmak için sürükleyin)`);
        }
    }

    function resetZoom() {
        zoomState.scale = 1.0;
        zoomState.panX = 0;
        zoomState.panY = 0;
        applyZoomTransform();
        if (window.showToast) window.showToast('↺ Yakınlaştırma sıfırlandı (1.0x)');
    }

    // ==========================================
    // 🎨 VİDEO ÜZERİNE ÇİZİM SİSTEMİ (ANNOTATIONS)
    // ==========================================
    const drawState = {
        activeTool: null, // null (gezin) | 'pen' | 'line' | 'circle' | 'angle'
        currentColor: '#fbbf24',
        drawingsHistory: [],
        isDrawing: false,
        currentDraft: null,
        angleDraftPoints: []
    };

    /**
     * Hem Masaüstü PC hem Tablet/Mobilde Dengeli Çözünürlük Ölçekleyici
     */
    function getResponsiveScale(width, height) {
        if (!width || !height) return 1;
        const minDim = Math.min(width, height);
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth < 1024);
        
        // Zarif, küçültülmüş ve dengeli boyutlandırma
        const base = Math.max(0.75, minDim / 680);
        return isTouch ? base * 1.18 : base;
    }

    /**
     * Tüm tarayıcılarda %100 uyumlu güvenli yuvarlak dikdörtgen çizer
     */
    function drawSafeRoundedRect(ctx, x, y, width, height, radius) {
        radius = Math.max(0, Math.min(radius, Math.min(width, height) / 2));
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

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
     * MediaPipe kütüphanelerinin yüklü olup olmadığını denetler
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
        setupDrawingCanvasListeners();
        return poseInstance;
    }

    /**
     * Okçuluk Biomekanik Duruş & Çapa (Anchor) Değerlendirmesi
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
        if (bowShoulder && bowElbow && bowWrist && (bowElbow.visibility === undefined || bowElbow.visibility > 0.3)) {
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
        if (drawShoulder && drawElbow && drawWrist && (drawElbow.visibility === undefined || drawElbow.visibility > 0.3)) {
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
        if (landmarks[11] && landmarks[12] && (landmarks[11].visibility === undefined || landmarks[11].visibility > 0.3)) {
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

        // 5. Çapa (Anchor Point) Kilidi ve Yüz Teması Analizi
        let anchorStatus = 'Kilitli 🟢';
        let anchorDist = 0;
        const chinTarget = isRight ? (landmarks[10] || landmarks[8] || nose) : (landmarks[9] || landmarks[7] || nose);

        if (chinTarget && drawWrist && (drawWrist.visibility === undefined || drawWrist.visibility > 0.3)) {
            anchorDist = Math.hypot(chinTarget.x - drawWrist.x, chinTarget.y - drawWrist.y);
            if (anchorDist > 0.24) {
                anchorStatus = 'Açık 🔴';
                score -= 15;
                feedbacks.push({
                    type: 'error',
                    badge: '🔴 Çapa Noktası Ayrık',
                    text: 'Çekiş eli çeneden/yüzden uzakta. Çapa noktasını çene altına veya ağız kenarına kilitle.'
                });
            } else if (anchorDist > 0.14) {
                anchorStatus = 'Hafif Açık 🟡';
                score -= 6;
                feedbacks.push({
                    type: 'warn',
                    badge: '🟡 Çapa Teması Geliştirilmeli',
                    text: 'Çekiş eli çapa noktasına yakın ama tam kilitlenmemiş.'
                });
            } else {
                anchorStatus = 'Kilitli 🟢';
                feedbacks.push({
                    type: 'good',
                    badge: '🟢 Çapa Noktası Kilitli',
                    text: 'Çekiş eli ile çene/yüz referans teması mükemmel.'
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
            anchorStatus,
            feedbacks,
            timestamp: Date.now()
        };
    }

    /**
     * Pose sonuçlarını Canvas üzerine çizer (Dengeli, Zarif & Net)
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

        try {
            const scale = getResponsiveScale(width, height);
            const landmarks = results.poseLandmarks;
            const analysis = evaluateArcheryForm(landmarks, currentHandedness);
            lastAnalysisResult = analysis;

            const isRight = currentHandedness === 'right';
            const bowWrist = isRight ? landmarks[15] : landmarks[16];
            const drawWrist = isRight ? landmarks[16] : landmarks[15];

            // 1. Ok Doğrultusu Rehber Çizgisi
            if (bowWrist && drawWrist && (bowWrist.visibility === undefined || bowWrist.visibility > 0.3) && (drawWrist.visibility === undefined || drawWrist.visibility > 0.3)) {
                const x1 = drawWrist.x * width, y1 = drawWrist.y * height;
                const x2 = bowWrist.x * width, y2 = bowWrist.y * height;
                const angle = Math.atan2(y2 - y1, x2 - x1);
                const xTarget = x2 + Math.cos(angle) * (70 * scale);
                const yTarget = y2 + Math.sin(angle) * (70 * scale);

                ctx.save();
                ctx.setLineDash([Math.round(5 * scale), Math.round(4 * scale)]);
                ctx.lineWidth = Math.max(1.8, 1.8 * scale);
                ctx.strokeStyle = 'rgba(255, 98, 0, 0.85)';
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(xTarget, yTarget);
                ctx.stroke();
                ctx.restore();
            }

            // 2. İskelet Kemik Çizgileri
            const connections = [
                [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
                [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]
            ];

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            connections.forEach(([i, j]) => {
                const p1 = landmarks[i];
                const p2 = landmarks[j];
                if (!p1 || !p2 || (p1.visibility !== undefined && p1.visibility < 0.25) || (p2.visibility !== undefined && p2.visibility < 0.25)) return;

                const isBowArm = (isRight && (i === 11 || i === 13) && (j === 13 || j === 15)) ||
                                 (!isRight && (i === 12 || i === 14) && (j === 14 || j === 16));
                
                const isDrawArm = (isRight && (i === 12 || i === 14) && (j === 14 || j === 16)) ||
                                  (!isRight && (i === 11 || i === 13) && (j === 13 || j === 15));

                ctx.beginPath();
                ctx.moveTo(p1.x * width, p1.y * height);
                ctx.lineTo(p2.x * width, p2.y * height);

                if (isBowArm) {
                    ctx.lineWidth = Math.max(3.8, 4.2 * scale);
                    ctx.strokeStyle = analysis.bowArmAngle >= 172 ? '#00e5ff' : '#ff3366';
                    ctx.shadowColor = ctx.strokeStyle;
                    ctx.shadowBlur = Math.round(8 * scale);
                } else if (isDrawArm) {
                    ctx.lineWidth = Math.max(3.8, 4.2 * scale);
                    ctx.strokeStyle = '#fbbf24';
                    ctx.shadowColor = '#fbbf24';
                    ctx.shadowBlur = Math.round(8 * scale);
                } else if (i === 11 && j === 12) {
                    ctx.lineWidth = Math.max(2.8, 3 * scale);
                    ctx.strokeStyle = '#818cf8';
                    ctx.shadowColor = '#818cf8';
                    ctx.shadowBlur = Math.round(5 * scale);
                } else {
                    ctx.lineWidth = Math.max(2.2, 2.4 * scale);
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }
                ctx.stroke();
            });

            // 3. Küçültülmüş & Dengeli Eklem Noktaları (Dual-Ring Joints)
            const keyJoints = [0, 11, 12, 13, 14, 15, 16, 23, 24];
            keyJoints.forEach(idx => {
                const p = landmarks[idx];
                if (!p || (p.visibility !== undefined && p.visibility < 0.25)) return;
                const x = p.x * width, y = p.y * height;
                const isArm = [11, 12, 13, 14, 15, 16].includes(idx);
                const r = Math.round((isArm ? 4.5 : 3.2) * scale);

                // Dış halka
                ctx.beginPath();
                ctx.arc(x, y, r + Math.round(2 * scale), 0, 2 * Math.PI);
                ctx.strokeStyle = isArm ? '#00e5ff' : 'rgba(255,255,255,0.7)';
                ctx.lineWidth = Math.max(1.2, 1.5 * scale);
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = isArm ? Math.round(6 * scale) : 0;
                ctx.stroke();

                // İç beyaz çekirdek
                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            });

            // 4. Çapa (Anchor) Kilidi Hedef Çemberi
            if (drawWrist && (drawWrist.visibility === undefined || drawWrist.visibility > 0.25)) {
                const ax = drawWrist.x * width;
                const ay = drawWrist.y * height;
                ctx.save();
                ctx.beginPath();
                ctx.arc(ax, ay, Math.round(11 * scale), 0, 2 * Math.PI);
                ctx.strokeStyle = analysis.anchorStatus.includes('🟢') ? '#10b981' : '#fbbf24';
                ctx.lineWidth = Math.max(1.8, 2 * scale);
                ctx.setLineDash([Math.round(3 * scale), Math.round(3 * scale)]);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();
            }

            // 5. Şık & Dengeli Açı Rozetleri
            const bowElbow = isRight ? landmarks[13] : landmarks[14];
            const drawElbow = isRight ? landmarks[14] : landmarks[13];

            if (bowElbow && (bowElbow.visibility === undefined || bowElbow.visibility > 0.25)) {
                drawAngleLabel(ctx, `${Math.round(analysis.bowArmAngle)}°`, bowElbow.x * width, bowElbow.y * height - Math.round(18 * scale), 
                    analysis.bowArmAngle >= 172 ? '#00e5ff' : '#ff3366', scale);
            }

            if (drawElbow && (drawElbow.visibility === undefined || drawElbow.visibility > 0.25)) {
                drawAngleLabel(ctx, `${Math.round(analysis.drawElbowAngle)}°`, drawElbow.x * width, drawElbow.y * height - Math.round(18 * scale), '#fbbf24', scale);
            }

            // 6. 📱 Sağ Alt Veli & Antrenör Analiz Özeti Rozeti
            drawCompactParentHUD(ctx, width, height, analysis, scale);

            updateHUDDashboard(analysis);
        } catch (err) {
            console.error('Pose rendering error:', err);
        } finally {
            ctx.restore();
        }
    }

    /**
     * Videonun sağ altına şık ve okunaklı canlı antrenör analizi kutusu çizer
     */
    function drawCompactParentHUD(ctx, width, height, analysis, scale = 1) {
        ctx.save();
        const boxW = Math.min(width * 0.46, Math.max(160 * scale, 135));
        const boxH = Math.max(72, Math.round(76 * scale));
        const margin = Math.max(8, Math.round(8 * scale));
        const x = width - boxW - margin;
        const y = height - boxH - margin;

        // Koyu cam arka plan
        ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
        ctx.lineWidth = Math.max(1.2, 1.4 * scale);
        
        drawSafeRoundedRect(ctx, x, y, boxW, boxH, Math.round(7 * scale));
        ctx.fill();
        ctx.stroke();

        const pX = Math.round(7 * scale);

        // Başlık: Canlı Antrenör Analizi
        ctx.font = `bold ${Math.max(9.5, Math.round(10 * scale))}px Poppins, -apple-system, sans-serif`;
        ctx.fillStyle = '#00f0ff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('📋 ANTRENÖR ANALİZİ', x + pX, y + Math.round(6 * scale));

        // Satır 1: En Önemli Canlı Antrenör İpucu
        const topFeedback = (analysis.feedbacks && analysis.feedbacks[0]) ? analysis.feedbacks[0].badge : '🟢 Form Dengeli';
        ctx.font = `bold ${Math.max(9, Math.round(9.5 * scale))}px Poppins, -apple-system, sans-serif`;
        ctx.fillStyle = topFeedback.includes('🔴') ? '#ff3366' : (topFeedback.includes('🟡') ? '#fbbf24' : '#10b981');
        ctx.fillText(topFeedback, x + pX, y + Math.round(22 * scale));

        // Satır 2: Yay Kolu & Çekiş Dirseği Açıları
        ctx.font = `${Math.max(8.5, Math.round(9 * scale))}px Poppins, -apple-system, sans-serif`;
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('🏹 Yay Kolu:', x + pX, y + Math.round(39 * scale));
        ctx.textAlign = 'right';
        ctx.fillStyle = analysis.bowArmAngle >= 172 ? '#10b981' : (analysis.bowArmAngle >= 165 ? '#fbbf24' : '#ff3366');
        ctx.fillText(`${Math.round(analysis.bowArmAngle)}°`, x + boxW - pX, y + Math.round(39 * scale));

        // Satır 3: Çekiş Dirsek & Çapa Durumu
        ctx.textAlign = 'left';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('🎯 Çekiş / Çapa:', x + pX, y + Math.round(55 * scale));
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fbbf24';
        const cleanAnchor = analysis.anchorStatus.replace(/🟢|🟡|🔴/g, '').trim();
        ctx.fillText(`${Math.round(analysis.drawElbowAngle)}° · ${cleanAnchor}`, x + boxW - pX, y + Math.round(55 * scale));

        ctx.restore();
    }

    function drawAngleLabel(ctx, text, x, y, color, scale = 1) {
        ctx.save();
        const fontSize = Math.max(11, Math.round(12 * scale));
        ctx.font = `bold ${fontSize}px Poppins, -apple-system, sans-serif`;
        const textWidth = ctx.measureText(text).width;
        
        const pw = Math.max(34, textWidth + Math.round(14 * scale));
        const ph = Math.max(22, Math.round(23 * scale));
        const px = x - pw / 2;
        const py = y - ph / 2;
        const rad = Math.round(6 * scale);
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.5, 1.8 * scale);
        ctx.shadowColor = color;
        ctx.shadowBlur = Math.round(6 * scale);
        
        drawSafeRoundedRect(ctx, px, py, pw, ph, rad);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
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
        const anchorEl = document.getElementById('ai-val-anchor');
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

        if (anchorEl) {
            anchorEl.textContent = analysis.anchorStatus || '--';
            anchorEl.style.color = (analysis.anchorStatus && analysis.anchorStatus.includes('🟢')) ? 'var(--neon-green)' : ((analysis.anchorStatus && analysis.anchorStatus.includes('🟡')) ? 'var(--gold)' : 'var(--neon-red)');
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

    // ==========================================
    // 🖌️ İNTERAKTİF ÇİZİM & DOKUNMA MOTORU
    // ==========================================

    function setupDrawingCanvasListeners() {
        const drawCanvas = document.getElementById('ai-draw-canvas');
        const boxContainer = document.getElementById('ai-pose-box-container');
        if (!drawCanvas || !boxContainer) return;

        const getPos = (e) => {
            const rect = drawCanvas.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
            const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
            return {
                x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
                y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
            };
        };

        // Mouse Wheel Zoom Desteği
        boxContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.2 : -0.2;
            zoomStep(delta);
        }, { passive: false });

        const onPointerDown = (e) => {
            // İki parmakla dokunulursa (Pinch-to-zoom başlangıcı)
            if (e.touches && e.touches.length === 2) {
                const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                zoomState.initialPinchDist = dist;
                return;
            }

            // Eğer yakınlaştırılmışsa ve Gezinme modundaysa -> Kaydır (Pan)
            if (!drawState.activeTool && zoomState.scale > 1.0) {
                zoomState.isPanning = true;
                zoomState.startX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
                zoomState.startY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
                zoomState.startPanX = zoomState.panX;
                zoomState.startPanY = zoomState.panY;
                return;
            }

            if (!drawState.activeTool) return;
            e.preventDefault();
            const p = getPos(e);
            drawState.isDrawing = true;

            if (drawState.activeTool === 'pen') {
                drawState.currentDraft = {
                    type: 'pen',
                    color: drawState.currentColor,
                    points: [p]
                };
            } else if (drawState.activeTool === 'line') {
                drawState.currentDraft = {
                    type: 'line',
                    color: drawState.currentColor,
                    p1: p,
                    p2: p
                };
            } else if (drawState.activeTool === 'circle') {
                drawState.currentDraft = {
                    type: 'circle',
                    color: drawState.currentColor,
                    center: p,
                    radius: 0
                };
            } else if (drawState.activeTool === 'angle') {
                drawState.angleDraftPoints.push(p);
                if (drawState.angleDraftPoints.length === 3) {
                    const [p1, p2, p3] = drawState.angleDraftPoints;
                    const deg = calculateAngle(p1, p2, p3);
                    drawState.drawingsHistory.push({
                        type: 'angle',
                        color: drawState.currentColor,
                        p1, p2, p3,
                        angleVal: deg
                    });
                    drawState.angleDraftPoints = [];
                    drawState.isDrawing = false;
                }
                renderUserDrawings();
            }
        };

        const onPointerMove = (e) => {
            // İki parmakla Pinch-to-zoom hareketi
            if (e.touches && e.touches.length === 2 && zoomState.initialPinchDist > 0) {
                e.preventDefault();
                const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                const diff = (dist - zoomState.initialPinchDist) / 200;
                zoomState.scale = Math.max(1.0, Math.min(3.5, zoomState.scale + diff));
                zoomState.initialPinchDist = dist;
                applyZoomTransform();
                return;
            }

            // Yakınlaştırılmış ekranda kaydırma (Pan)
            if (zoomState.isPanning) {
                e.preventDefault();
                const curX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
                const curY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
                const dx = (curX - zoomState.startX) / zoomState.scale;
                const dy = (curY - zoomState.startY) / zoomState.scale;
                zoomState.panX = zoomState.startPanX + dx;
                zoomState.panY = zoomState.startPanY + dy;
                applyZoomTransform();
                return;
            }

            if (!drawState.isDrawing || !drawState.activeTool) return;
            e.preventDefault();
            const p = getPos(e);

            if (drawState.activeTool === 'pen' && drawState.currentDraft) {
                drawState.currentDraft.points.push(p);
                renderUserDrawings();
            } else if (drawState.activeTool === 'line' && drawState.currentDraft) {
                drawState.currentDraft.p2 = p;
                renderUserDrawings();
            } else if (drawState.activeTool === 'circle' && drawState.currentDraft) {
                drawState.currentDraft.radius = Math.hypot(p.x - drawState.currentDraft.center.x, p.y - drawState.currentDraft.center.y);
                renderUserDrawings();
            }
        };

        const onPointerUp = (e) => {
            zoomState.isPanning = false;
            zoomState.initialPinchDist = 0;

            if (!drawState.isDrawing) return;
            drawState.isDrawing = false;

            if (drawState.currentDraft) {
                drawState.drawingsHistory.push(drawState.currentDraft);
                drawState.currentDraft = null;
                renderUserDrawings();
            }
        };

        drawCanvas.addEventListener('pointerdown', onPointerDown);
        drawCanvas.addEventListener('pointermove', onPointerMove);
        drawCanvas.addEventListener('pointerup', onPointerUp);
        drawCanvas.addEventListener('pointercancel', onPointerUp);
    }

    /**
     * Tüm kullanıcı çizimlerini belirtilen canvas üzerine çizer
     */
    function renderUserDrawingsOnContext(ctx, width, height) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const scale = getResponsiveScale(width, height);

        const allItems = [...drawState.drawingsHistory];
        if (drawState.currentDraft) allItems.push(drawState.currentDraft);

        allItems.forEach(item => {
            ctx.strokeStyle = item.color;
            ctx.fillStyle = item.color;
            ctx.shadowColor = item.color;
            ctx.shadowBlur = Math.round(5 * scale);

            if (item.type === 'pen' && item.points && item.points.length > 0) {
                ctx.lineWidth = Math.max(3, 3.5 * scale);
                ctx.beginPath();
                ctx.moveTo(item.points[0].x * width, item.points[0].y * height);
                for (let i = 1; i < item.points.length; i++) {
                    ctx.lineTo(item.points[i].x * width, item.points[i].y * height);
                }
                ctx.stroke();
            } else if (item.type === 'line' && item.p1 && item.p2) {
                ctx.lineWidth = Math.max(3, 3.5 * scale);
                ctx.beginPath();
                ctx.moveTo(item.p1.x * width, item.p1.y * height);
                ctx.lineTo(item.p2.x * width, item.p2.y * height);
                ctx.stroke();

                // Ok başı / Uç nokta
                ctx.beginPath();
                ctx.arc(item.p2.x * width, item.p2.y * height, Math.round(4.5 * scale), 0, 2 * Math.PI);
                ctx.fill();
            } else if (item.type === 'circle' && item.center) {
                ctx.lineWidth = Math.max(2.5, 3 * scale);
                ctx.beginPath();
                ctx.arc(item.center.x * width, item.center.y * height, item.radius * width, 0, 2 * Math.PI);
                ctx.stroke();

                // Merkez noktası
                ctx.beginPath();
                ctx.arc(item.center.x * width, item.center.y * height, Math.round(3.5 * scale), 0, 2 * Math.PI);
                ctx.fill();
            } else if (item.type === 'angle' && item.p1 && item.p2 && item.p3) {
                ctx.lineWidth = Math.max(2.5, 3 * scale);
                ctx.beginPath();
                ctx.moveTo(item.p1.x * width, item.p1.y * height);
                ctx.lineTo(item.p2.x * width, item.p2.y * height);
                ctx.lineTo(item.p3.x * width, item.p3.y * height);
                ctx.stroke();

                // Köşe noktaları
                [item.p1, item.p2, item.p3].forEach(pt => {
                    ctx.beginPath();
                    ctx.arc(pt.x * width, pt.y * height, Math.round(4 * scale), 0, 2 * Math.PI);
                    ctx.fill();
                });

                // Açı etiketi
                drawAngleLabel(ctx, `${item.angleVal}°`, item.p2.x * width, item.p2.y * height - Math.round(18 * scale), item.color, scale);
            }
        });

        // Açı aracı taslağı (seçilen ilk veya ikinci nokta)
        if (drawState.activeTool === 'angle' && drawState.angleDraftPoints.length > 0) {
            ctx.fillStyle = drawState.currentColor;
            drawState.angleDraftPoints.forEach((pt, idx) => {
                ctx.beginPath();
                ctx.arc(pt.x * width, pt.y * height, Math.round(6 * scale), 0, 2 * Math.PI);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${Math.round(10 * scale)}px Poppins, sans-serif`;
                ctx.fillText(`${idx + 1}`, pt.x * width + Math.round(8 * scale), pt.y * height - Math.round(8 * scale));
            });
        }

        ctx.restore();
    }

    function renderUserDrawings() {
        const drawCanvas = document.getElementById('ai-draw-canvas');
        if (!drawCanvas) return;
        const ctx = drawCanvas.getContext('2d');
        ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        renderUserDrawingsOnContext(ctx, drawCanvas.width, drawCanvas.height);
    }

    function setDrawTool(tool) {
        drawState.activeTool = tool;
        drawState.angleDraftPoints = [];
        drawState.currentDraft = null;

        const drawCanvas = document.getElementById('ai-draw-canvas');
        if (drawCanvas) {
            drawCanvas.style.pointerEvents = tool ? 'auto' : 'none';
            drawCanvas.style.cursor = tool ? 'crosshair' : 'default';
        }

        // Hem normal toolbar hem tam ekran yüzen toolbar butonlarını güncelle
        ['pen', 'line', 'circle', 'angle', 'none'].forEach(t => {
            const btn = document.getElementById(`ai-tool-${t}`);
            const fsBtn = document.getElementById(`ai-fs-tool-${t}`);
            const isActive = (tool === t) || (!tool && t === 'none');
            if (btn) btn.classList.toggle('aktif', isActive);
            if (fsBtn) fsBtn.classList.toggle('aktif', isActive);
        });

        renderUserDrawings();
        if (window.showToast) {
            const toolNames = { pen: '✏️ Serbest Kalem aktif', line: '📏 Düz Çizgi aktif', circle: '⭕ Daire Çizim aktif', angle: '📐 3 noktaya dokunarak açı ölçün', null: '🖐️ Gezinme moduna geçildi' };
            window.showToast(toolNames[tool] || 'Çizim modu');
        }
    }

    function setDrawColor(color, el) {
        drawState.currentColor = color;
        document.querySelectorAll('.ai-color-dot').forEach(dot => {
            dot.classList.toggle('aktif', dot.style.background.includes(color) || (color === '#fbbf24' && dot.style.background.includes('251')));
        });
        if (el) el.classList.add('aktif');
    }

    function undoDraw() {
        if (drawState.drawingsHistory.length > 0) {
            drawState.drawingsHistory.pop();
            renderUserDrawings();
            if (window.showToast) window.showToast('Son çizim geri alındı.');
        }
    }

    function clearDrawings() {
        drawState.drawingsHistory = [];
        drawState.angleDraftPoints = [];
        drawState.currentDraft = null;
        renderUserDrawings();
        if (window.showToast) window.showToast('Tüm çizimler temizlendi.');
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
        const drawCanvas = document.getElementById('ai-draw-canvas');
        const startBtn = document.getElementById('ai-pose-cam-start');
        const stopBtn = document.getElementById('ai-pose-cam-stop');
        const statusText = document.getElementById('ai-pose-status');

        if (!videoElement || !canvasElement) return;

        try {
            if (statusText) statusText.textContent = 'Motor hazırlanıyor...';
            await initPoseEngine();

            if (statusText) statusText.textContent = 'Kamera açılıyor...';
            
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
                const w = videoElement.videoWidth || 640;
                const h = videoElement.videoHeight || 480;
                canvasElement.width = w;
                canvasElement.height = h;
                if (drawCanvas) {
                    drawCanvas.width = w;
                    drawCanvas.height = h;
                    renderUserDrawings();
                }
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
     * Video Oynarken Kesintisiz Gerçek Zamanlı Analiz Döngüsü (Continuous Loop)
     */
    function startContinuousVideoAnalysis() {
        if (videoProcessingRAF) {
            cancelAnimationFrame(videoProcessingRAF);
            videoProcessingRAF = null;
        }

        const videoElement = document.getElementById('ai-pose-video');
        if (!videoElement) return;

        const loop = async () => {
            if (!videoElement.paused && !videoElement.ended && currentSourceMode === 'video') {
                if (videoElement.readyState >= 2 && poseInstance && !isProcessingVideoFrame) {
                    isProcessingVideoFrame = true;
                    try {
                        await poseInstance.send({ image: videoElement });
                    } catch (e) {
                        // frame drop ignore
                    } finally {
                        isProcessingVideoFrame = false;
                    }
                }
                videoProcessingRAF = requestAnimationFrame(loop);
            } else {
                const playBtn = document.getElementById('ai-vid-play-btn');
                if (playBtn && videoElement.ended) playBtn.innerHTML = '▶ Oynat';
                isVideoPlaying = !videoElement.paused && !videoElement.ended;
            }
        };

        videoProcessingRAF = requestAnimationFrame(loop);
    }

    /**
     * Video Dosyasını Yükler
     */
    async function loadVideoFile(file) {
        if (!file) return;

        const videoElement = document.getElementById('ai-pose-video');
        const canvasElement = document.getElementById('ai-pose-canvas');
        const drawCanvas = document.getElementById('ai-draw-canvas');
        const statusText = document.getElementById('ai-pose-status');
        const vidUploadBox = document.getElementById('ai-vid-upload-box');
        const vidControls = document.getElementById('ai-vid-controls');

        try {
            stopLiveCamera();
            resetZoom();
            if (statusText) statusText.textContent = 'Video yükleniyor ve AI hazırlanıyor...';
            await initPoseEngine();

            const videoURL = URL.createObjectURL(file);
            videoElement.srcObject = null;
            videoElement.src = videoURL;
            videoElement.load();

            videoElement.onloadeddata = async () => {
                const w = videoElement.videoWidth || 640;
                const h = videoElement.videoHeight || 480;
                canvasElement.width = w;
                canvasElement.height = h;
                if (drawCanvas) {
                    drawCanvas.width = w;
                    drawCanvas.height = h;
                    renderUserDrawings();
                }
                isVideoLoaded = true;

                if (vidUploadBox) vidUploadBox.style.display = 'none';
                if (vidControls) vidControls.style.display = 'flex';
                if (statusText) statusText.textContent = '🎬 Video hazır. Oynatırken canlı açılar akacaktır.';

                updateVideoTimeline();
                await analyzeCurrentVideoFrame();
                if (window.showToast) window.showToast('✅ Video yüklendi.', 'success');
            };

            videoElement.ontimeupdate = () => {
                updateVideoTimeline();
            };

            videoElement.onplay = () => {
                const playBtn = document.getElementById('ai-vid-play-btn');
                if (playBtn) playBtn.innerHTML = '⏸ Durdur';
                isVideoPlaying = true;
                startContinuousVideoAnalysis();
            };

            videoElement.onpause = () => {
                const playBtn = document.getElementById('ai-vid-play-btn');
                if (playBtn) playBtn.innerHTML = '▶ Oynat';
                isVideoPlaying = false;
                stopVideoPlayback();
                analyzeCurrentVideoFrame();
            };

            videoElement.onseeked = () => {
                analyzeCurrentVideoFrame();
            };

        } catch (err) {
            console.error('Video yükleme hatası:', err);
            if (statusText) statusText.textContent = '⚠️ Video yüklenemedi: ' + (err.message || err);
        }
    }

    async function analyzeCurrentVideoFrame() {
        const videoElement = document.getElementById('ai-pose-video');
        if (!videoElement || videoElement.readyState < 2 || !poseInstance) return;
        try {
            await poseInstance.send({ image: videoElement });
        } catch (e) {}
    }

    async function toggleVideoPlay() {
        const videoElement = document.getElementById('ai-pose-video');
        const playBtn = document.getElementById('ai-vid-play-btn');
        if (!videoElement) return;

        if (videoElement.paused) {
            await videoElement.play();
            if (playBtn) playBtn.innerHTML = '⏸ Durdur';
            isVideoPlaying = true;
            startContinuousVideoAnalysis();
        } else {
            videoElement.pause();
            if (playBtn) playBtn.innerHTML = '▶ Oynat';
            isVideoPlaying = false;
            stopVideoPlayback();
            analyzeCurrentVideoFrame();
        }
    }

    function stopVideoPlayback() {
        if (videoProcessingRAF) {
            cancelAnimationFrame(videoProcessingRAF);
            videoProcessingRAF = null;
        }
        isProcessingVideoFrame = false;
        isVideoPlaying = false;
    }

    function stepVideoFrame(seconds) {
        const videoElement = document.getElementById('ai-pose-video');
        if (!videoElement || !isVideoLoaded) return;
        videoElement.pause();
        const playBtn = document.getElementById('ai-vid-play-btn');
        if (playBtn) playBtn.innerHTML = '▶ Oynat';

        videoElement.currentTime = Math.max(0, Math.min(videoElement.duration || 0, videoElement.currentTime + seconds));
    }

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

    async function toggleCameraFacing() {
        currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
        if (isLiveActive) {
            stopLiveCamera();
            await startLiveCamera();
        }
    }

    function setHandedness(handedness) {
        currentHandedness = handedness;
        const rBtn = document.getElementById('ai-hand-right');
        const lBtn = document.getElementById('ai-hand-left');
        if (rBtn && lBtn) {
            rBtn.classList.toggle('aktif', handedness === 'right');
            lBtn.classList.toggle('aktif', handedness === 'left');
        }
        if (window.showToast) {
            window.showToast(handedness === 'right' ? '🏹 Sağlak okçu modu seçildi (Sol yay kolu)' : '🏹 Solak okçu modu seçildi (Sağ yay kolu)');
        }
        if (currentSourceMode === 'video' && isVideoLoaded) {
            analyzeCurrentVideoFrame();
        }
    }

    // ==========================================
    // 🎬 AÇILARIYLA BİRLİKTE VİDEO DIŞA AKTARMA (RECORDER)
    // ==========================================
    let isExportingVideo = false;
    let exportRecorder = null;
    let exportChunks = [];
    let exportAnimFrame = null;

    async function exportAnalyzedVideo() {
        const videoElement = document.getElementById('ai-pose-video');
        const poseCanvas = document.getElementById('ai-pose-canvas');
        const recordBtn = document.getElementById('ai-vid-record-btn');

        if (!videoElement) return;

        // Eğer kayıt zaten çalışıyorsa, durdur
        if (isExportingVideo) {
            stopExportingVideo();
            return;
        }

        try {
            isExportingVideo = true;
            exportChunks = [];

            if (recordBtn) {
                recordBtn.classList.add('ai-rec-anim');
                recordBtn.innerHTML = '⏹️ Kaydı Bitir & İndir';
            }

            // Birleşik Canvas
            const compCanvas = document.createElement('canvas');
            compCanvas.width = videoElement.videoWidth || 640;
            compCanvas.height = videoElement.videoHeight || 480;
            const compCtx = compCanvas.getContext('2d');

            // Video format seçimi (MP4 / WebM)
            let mime = 'video/mp4';
            if (!MediaRecorder.isTypeSupported(mime)) {
                mime = 'video/webm;codecs=vp9';
                if (!MediaRecorder.isTypeSupported(mime)) mime = 'video/webm';
            }

            const stream = compCanvas.captureStream(30);
            exportRecorder = new MediaRecorder(stream, { mimeType: mime });

            exportRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) exportChunks.push(e.data);
            };

            exportRecorder.onstop = () => {
                if (exportChunks.length > 0) {
                    const blob = new Blob(exportChunks, { type: mime });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `DAG_SK_Açı_Analizi_Video_${Date.now()}.${mime.includes('mp4') ? 'mp4' : 'webm'}`;
                    link.href = url;
                    link.click();
                    if (window.showToast) window.showToast('✅ Açılarıyla video başarıyla indirildi!', 'success');
                }
                resetExportBtn();
            };

            exportRecorder.start();

            // Video başa sarıp oynatılır
            videoElement.currentTime = 0;
            await videoElement.play();

            const renderExportFrame = async () => {
                if (!isExportingVideo) return;

                // 1. Ham Video Karesi
                compCtx.drawImage(videoElement, 0, 0, compCanvas.width, compCanvas.height);

                // 2. Pose iskelet ve açı etiketleri
                if (poseCanvas) {
                    compCtx.drawImage(poseCanvas, 0, 0, compCanvas.width, compCanvas.height);
                }

                // 3. Kullanıcı çizimleri
                renderUserDrawingsOnContext(compCtx, compCanvas.width, compCanvas.height);

                if (!videoElement.paused && !videoElement.ended) {
                    exportAnimFrame = requestAnimationFrame(renderExportFrame);
                } else {
                    stopExportingVideo();
                }
            };

            renderExportFrame();

        } catch (err) {
            console.error('Video kayıt hatası:', err);
            resetExportBtn();
            if (window.showToast) window.showToast('⚠️ Video kaydedilemedi: ' + err.message, 'error');
        }
    }

    function stopExportingVideo() {
        isExportingVideo = false;
        if (exportAnimFrame) {
            cancelAnimationFrame(exportAnimFrame);
            exportAnimFrame = null;
        }
        if (exportRecorder && exportRecorder.state !== 'inactive') {
            exportRecorder.stop();
        }
        resetExportBtn();
    }

    function resetExportBtn() {
        isExportingVideo = false;
        const recordBtn = document.getElementById('ai-vid-record-btn');
        if (recordBtn) {
            recordBtn.classList.remove('ai-rec-anim');
            recordBtn.innerHTML = '⏺️ Açılarıyla Videoyu İndir';
        }
    }

    // ==========================================
    // 📸 KARE ANALİZ KARTI & 📲 WHATSAPP VELİ PAYLAŞIMI
    // ==========================================

    function captureAnalysisCard() {
        const videoElement = document.getElementById('ai-pose-video');
        const poseCanvas = document.getElementById('ai-pose-canvas');
        if (!videoElement) return;

        const mergeCanvas = document.createElement('canvas');
        mergeCanvas.width = videoElement.videoWidth || 640;
        mergeCanvas.height = videoElement.videoHeight || 480;
        const ctx = mergeCanvas.getContext('2d');

        // 1. Video karesi
        ctx.drawImage(videoElement, 0, 0, mergeCanvas.width, mergeCanvas.height);

        // 2. AI iskelet ve açı çizgileri
        if (poseCanvas) {
            ctx.drawImage(poseCanvas, 0, 0, mergeCanvas.width, mergeCanvas.height);
        }

        // 3. Kullanıcı çizimleri
        renderUserDrawingsOnContext(ctx, mergeCanvas.width, mergeCanvas.height);

        // İndir
        const link = document.createElement('a');
        link.download = `DAG_SK_Duruş_Analizi_${Date.now()}.png`;
        link.href = mergeCanvas.toDataURL('image/png');
        link.click();

        if (window.showToast) window.showToast('📸 Duruş analiz kartı kaydedildi!', 'success');
    }

    /**
     * Veliye tek dokunuşla WhatsApp analiz mesajı gönderir
     */
    function shareToWhatsApp() {
        // Kartı da otomatik indirir
        captureAnalysisCard();

        const athleteName = (window.aktifSporcu && window.aktifSporcu.ad) ? window.aktifSporcu.ad : 'Sporcumuz';
        const score = lastAnalysisResult.score || 100;
        const bowArm = lastAnalysisResult.bowArmAngle || 180;
        const drawElbow = lastAnalysisResult.drawElbowAngle || 45;
        const anchor = lastAnalysisResult.anchorStatus || 'Kilitli';
        const shoulder = lastAnalysisResult.shoulderTilt ? `${lastAnalysisResult.shoulderTilt}°` : 'Dengeli';
        const dateStr = new Date().toLocaleDateString('tr-TR');

        const message = `🎯 *DAĞ OKÇULUK SPOR KULÜBÜ*\n🏹 *Teknik Duruş & Biomekanik Atış Analizi*\n📅 Tarih: ${dateStr}\n\n👤 *Sporcu:* ${athleteName}\n📊 *Form Puanı:* %${score}\n📐 *Yay Kolu Açısı:* ${bowArm}° (İdeal: 175°-180°)\n🎯 *Çekiş Dirseği:* ${drawElbow}°\n⚓ *Çapa Noktası:* ${anchor}\n⚖️ *Omuz Dengesi:* ${shoulder}\n\n✅ *Antrenör Notu:* Atış formu ve eklem açıları incelenmiştir. İndirilen detaylı analiz kartı/videosu ektedir.`;

        const whatsappURL = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappURL, '_blank');

        if (window.showToast) window.showToast('📲 WhatsApp veli mesajı hazırlandı!', 'success');
    }

    /**
     * Ekrana / Tablete dokunulduğunda oynat/durdur
     */
    function handleScreenTap(e) {
        // Eğer bir çizim aracı seçiliyse veya kaydırma/yakınlaştırma yapılıyorsa pas geç
        if (drawState.activeTool) return;
        if (zoomState.isPanning || zoomState.scale > 1.0) return;
        if (currentSourceMode !== 'video' || !isVideoLoaded) return;

        // Play/Pause yap
        toggleVideoPlay();

        // Ortada Play/Pause animasyon ikonu göster
        const splash = document.getElementById('ai-play-splash');
        const videoElement = document.getElementById('ai-pose-video');
        if (splash && videoElement) {
            splash.textContent = videoElement.paused ? '⏸' : '▶';
            splash.classList.add('show');
            setTimeout(() => splash.classList.remove('show'), 400);
        }
    }

    /**
     * Tam ekran modunu açar veya kapatır
     */
    function toggleFullScreen() {
        const container = document.getElementById('ai-pose-box-container');
        if (!container) return;

        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen().catch(() => container.classList.toggle('ai-fullscreen'));
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            } else {
                container.classList.toggle('ai-fullscreen');
            }
            if (window.showToast) window.showToast('⛶ Tam ekran açıldı. Çizim araçları alttadır.');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
            container.classList.remove('ai-fullscreen');
            if (window.showToast) window.showToast('Tam ekrandan çıkıldı.');
        }
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
        setDrawTool,
        setDrawColor,
        undoDraw,
        clearDrawings,
        handleScreenTap,
        toggleFullScreen,
        zoomStep,
        resetZoom,
        exportAnalyzedVideo,
        captureAnalysisCard,
        shareToWhatsApp,
        getAnalysis: () => lastAnalysisResult
    };

})(typeof window !== 'undefined' ? window : this);
