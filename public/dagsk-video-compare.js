/**
 * DAĞ S.K. — Yan Yana İkili Video Karşılaştırma & Senkronize Form Analizi
 * (Side-by-Side Dual Video Comparison & Synchronized AI Pose & Angle Detection)
 * 
 * Özellikler:
 * - 🤖 Her iki videoda da (Video A & Video B) EŞ ZAMANLI MediaPipe AI İskelet & Açı Tespiti
 * - Yay Kolu Kilidi, Çekiş Dirseği Açısı, Çapa (Anchor) ve Omuz Hizası
 * - Otomatik Makaralı (Compound) & Klasik (Recurve) Yay Kalibrasyonu
 * - 🔗 Senkron Kilidi (Sync Lock) ile aynı anda kare kare oynatma/sarma
 * - 🔲 Yan Yana (Split 50/50) ve 👻 Hayalet / Şeffaf Bindirme (Ghost Overlay) modları
 * - Her iki video üzerinde açı (angle), çizgi (line) ve daire (circle) serbest çizim araçları
 * - Yavaş çekim (0.25x, 0.5x, 1x)
 * - 📸 Yan Yana Karşılaştırma Kartını İndirme & WhatsApp ile veliye gönderme
 */

(function (global) {
    'use strict';

    const state = {
        isSyncLocked: true,
        isPlaying: false,
        viewMode: 'split', // 'split' | 'overlay'
        overlayOpacity: 0.5,
        playbackSpeed: 1.0,
        aiAnglesEnabled: true,
        handedness: 'right', // 'right' | 'left'
        bowType: 'auto', // 'auto' | 'recurve' | 'compound'

        videoA: {
            element: null,
            canvas: null,
            file: null,
            loaded: false,
            syncOffset: 0,
            analysis: null,
            lastFrameDrawn: false
        },
        videoB: {
            element: null,
            canvas: null,
            file: null,
            loaded: false,
            syncOffset: 0,
            analysis: null,
            lastFrameDrawn: false
        },

        drawingsA: [],
        drawingsB: [],
        activeTool: null, // null | 'pen' | 'line' | 'circle' | 'angle'
        currentColor: '#ff6a1a',
        activeCanvasTarget: 'A', // 'A' or 'B'
        angleDraftPoints: []
    };

    let poseInstance = null;
    let isPoseInitializing = false;
    let syncRAF = null;
    let isAnalyzingA = false;
    let isAnalyzingB = false;

    async function init() {
        state.videoA.element = document.getElementById('cmp-video-a');
        state.videoA.canvas = document.getElementById('cmp-canvas-a');

        state.videoB.element = document.getElementById('cmp-video-b');
        state.videoB.canvas = document.getElementById('cmp-canvas-b');

        setupVideoEventListeners(state.videoA, 'A');
        setupVideoEventListeners(state.videoB, 'B');
        setupDrawingListeners();

        // Pose motorunu hazırla
        await initComparePoseEngine();
    }

    async function initComparePoseEngine() {
        if (poseInstance || isPoseInitializing) return poseInstance;
        isPoseInitializing = true;

        try {
            if (!window.Pose) {
                await loadMediaPipeScript();
            }

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

            isPoseInitializing = false;
            return poseInstance;
        } catch (e) {
            console.error('Compare Pose init error:', e);
            isPoseInitializing = false;
        }
    }

    function loadMediaPipeScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js';
            script.crossOrigin = 'anonymous';
            script.onload = () => resolve(true);
            script.onerror = () => reject(new Error('MediaPipe script yüklenemedi'));
            document.head.appendChild(script);
        });
    }

    function setupVideoEventListeners(vidObj, target) {
        if (!vidObj.element) return;

        vidObj.element.onloadedmetadata = () => {
            vidObj.loaded = true;
            if (vidObj.canvas) {
                vidObj.canvas.width = vidObj.element.videoWidth || 640;
                vidObj.canvas.height = vidObj.element.videoHeight || 480;
            }
            updateMasterTimeline();
            checkReadyState();
        };

        vidObj.element.onloadeddata = async () => {
            await analyzeTargetFrame(target);
        };

        vidObj.element.ontimeupdate = () => {
            updateTimelineDisplay(target);
            if (target === 'A') updateMasterTimeline();
            if (!state.isPlaying) {
                analyzeTargetFrame(target);
            }
        };

        vidObj.element.onseeked = () => {
            analyzeTargetFrame(target);
        };

        vidObj.element.onended = () => {
            if (state.isPlaying) {
                togglePlay(false);
            }
        };
    }

    function checkReadyState() {
        const controls = document.getElementById('cmp-master-controls');
        if (controls) {
            controls.style.display = (state.videoA.loaded || state.videoB.loaded) ? 'flex' : 'none';
        }
    }

    /**
     * Video Dosyası Yükleme (A veya B)
     */
    async function loadVideo(target, file) {
        if (!file) return;

        const vidObj = target === 'A' ? state.videoA : state.videoB;
        const uploadBox = document.getElementById(`cmp-upload-${target.toLowerCase()}`);
        const wrapper = document.getElementById(`cmp-wrapper-${target.toLowerCase()}`);
        const label = document.getElementById(`cmp-filename-${target.toLowerCase()}`);

        vidObj.file = file;
        const url = URL.createObjectURL(file);
        vidObj.element.src = url;
        vidObj.element.load();

        if (uploadBox) uploadBox.style.display = 'none';
        if (wrapper) wrapper.style.display = 'block';
        if (label) label.textContent = file.name ? file.name.substring(0, 22) : `Video ${target}`;

        await initComparePoseEngine();
        if (window.showToast) window.showToast(`✅ Video ${target} yüklendi.`);
    }

    /**
     * Senkronize Play / Pause
     */
    async function togglePlay(forceState) {
        const shouldPlay = typeof forceState === 'boolean' ? forceState : !state.isPlaying;
        state.isPlaying = shouldPlay;

        const playBtn = document.getElementById('cmp-master-play-btn');
        if (playBtn) playBtn.innerHTML = shouldPlay ? '⏸ Durdur' : '▶ Senkron Oynat';

        if (shouldPlay) {
            if (state.videoA.loaded && state.videoA.element.paused) {
                await state.videoA.element.play();
            }
            if (state.videoB.loaded && state.videoB.element.paused) {
                await state.videoB.element.play();
            }
            startSyncLoop();
        } else {
            if (state.videoA.element) state.videoA.element.pause();
            if (state.videoB.element) state.videoB.element.pause();
            stopSyncLoop();
            // Durdurulduğunda mevcut karelerin açılarını analiz et ve ekranda tut
            analyzeTargetFrame('A');
            analyzeTargetFrame('B');
        }
    }

    function startSyncLoop() {
        stopSyncLoop();
        let frameCount = 0;

        const loop = () => {
            if (state.isPlaying) {
                // Senkron kilidi kontrolü
                if (state.isSyncLocked && state.videoA.loaded && state.videoB.loaded) {
                    const tA = state.videoA.element.currentTime;
                    const expectedTB = Math.max(0, tA + (state.videoB.syncOffset - state.videoA.syncOffset));
                    if (Math.abs(state.videoB.element.currentTime - expectedTB) > 0.08) {
                        state.videoB.element.currentTime = expectedTB;
                    }
                }

                // AI Açı Analizini her 2-3 karede bir çalıştır (aşırı CPU yükünü önlemek için)
                if (state.aiAnglesEnabled && frameCount % 2 === 0) {
                    if (state.videoA.loaded && !isAnalyzingA) analyzeTargetFrame('A');
                    if (state.videoB.loaded && !isAnalyzingB) analyzeTargetFrame('B');
                }

                frameCount++;
                syncRAF = requestAnimationFrame(loop);
            }
        };
        syncRAF = requestAnimationFrame(loop);
    }

    function stopSyncLoop() {
        if (syncRAF) {
            cancelAnimationFrame(syncRAF);
            syncRAF = null;
        }
    }

    // ==========================================
    // 🤖 AI İSKELET & AÇI ANALİZ MOTORU
    // ==========================================

    async function analyzeTargetFrame(target) {
        const vidObj = target === 'A' ? state.videoA : state.videoB;
        if (!vidObj.loaded || !vidObj.element || vidObj.element.readyState < 2) return;

        if (!poseInstance) {
            await initComparePoseEngine();
            if (!poseInstance) {
                renderCombinedCanvas(target, null);
                return;
            }
        }

        const isBusy = target === 'A' ? isAnalyzingA : isAnalyzingB;
        if (isBusy) return;

        if (target === 'A') isAnalyzingA = true;
        else isAnalyzingB = true;

        try {
            poseInstance.onResults((results) => {
                if (!results || !results.poseLandmarks) {
                    vidObj.analysis = null;
                    renderCombinedCanvas(target, null);
                    return;
                }

                const analysis = evaluateForm(results.poseLandmarks, state.handedness, state.bowType);
                vidObj.analysis = analysis;
                renderCombinedCanvas(target, results.poseLandmarks, analysis);
                updateComparisonDiffBanner();
            });

            await poseInstance.send({ image: vidObj.element });
        } catch (err) {
            renderCombinedCanvas(target, null);
        } finally {
            if (target === 'A') isAnalyzingA = false;
            else isAnalyzingB = false;
        }
    }

    function calculateAngle(a, b, c) {
        if (!a || !b || !c) return 0;
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) angle = 360.0 - angle;
        return Math.round(angle * 10) / 10;
    }

    function evaluateForm(landmarks, handedness = 'right', bowTypePref = 'auto') {
        const isRight = handedness === 'right';

        const bowShoulder = isRight ? landmarks[11] : landmarks[12];
        const bowElbow    = isRight ? landmarks[13] : landmarks[14];
        const bowWrist    = isRight ? landmarks[15] : landmarks[16];

        const drawShoulder = isRight ? landmarks[12] : landmarks[11];
        const drawElbow    = isRight ? landmarks[14] : landmarks[13];
        const drawWrist    = isRight ? landmarks[16] : landmarks[15];

        const chin = landmarks[0];
        const ear = isRight ? landmarks[8] : landmarks[7];

        const bowArmAngle = calculateAngle(bowShoulder, bowElbow, bowWrist);
        const drawElbowAngle = calculateAngle(drawShoulder, drawElbow, drawWrist);

        // Makaralı Yay Oto-Tespit
        let effectiveBowType = bowTypePref;
        if (bowTypePref === 'auto') {
            if (ear && drawWrist && (drawWrist.visibility === undefined || drawWrist.visibility > 0.3)) {
                const distToEar = Math.hypot(ear.x - drawWrist.x, ear.y - drawWrist.y);
                const distToChin = chin ? Math.hypot(chin.x - drawWrist.x, chin.y - drawWrist.y) : 1;
                effectiveBowType = (distToEar < distToChin && bowArmAngle >= 165 && bowArmAngle <= 178) ? 'compound' : 'recurve';
            } else {
                effectiveBowType = 'recurve';
            }
        }

        const isCompound = effectiveBowType === 'compound';
        const bowTypeLabel = isCompound ? '⚙️ Makaralı Yay' : '🏹 Klasik Yay';

        // Çapa Kontrolü
        let anchorStatus = 'Kilitli 🟢';
        const anchorTarget = isCompound ? ear : chin;
        if (anchorTarget && drawWrist && (drawWrist.visibility === undefined || drawWrist.visibility > 0.25)) {
            const anchorDist = Math.hypot(anchorTarget.x - drawWrist.x, anchorTarget.y - drawWrist.y);
            const limitErr = isCompound ? 0.26 : 0.24;
            const limitWarn = isCompound ? 0.16 : 0.14;
            if (anchorDist > limitErr) anchorStatus = 'Açık 🔴';
            else if (anchorDist > limitWarn) anchorStatus = 'Hafif Açık 🟡';
            else anchorStatus = 'Kilitli 🟢';
        }

        return {
            bowArmAngle,
            drawElbowAngle,
            anchorStatus,
            bowType: effectiveBowType,
            bowTypeLabel
        };
    }

    /**
     * Canvas Üzerine AI İskeletini, Açı Rozetlerini ve Kullanıcı Çizimlerini Çizer
     */
    function renderCombinedCanvas(target, landmarks, analysis) {
        const vidObj = target === 'A' ? state.videoA : state.videoB;
        const canvas = vidObj.canvas;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);

        const isRight = state.handedness === 'right';
        const scale = Math.max(0.75, Math.min(width, height) / 640);

        // 1. AI Otomatik Açılar & İskelet Çizimi (Aktifse)
        if (state.aiAnglesEnabled && landmarks && analysis) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // İskelet Kemik Çizgileri
            const connections = [
                [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
                [11, 23], [12, 24], [23, 24]
            ];

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
                    ctx.lineWidth = Math.max(3.5, 4 * scale);
                    const isGood = analysis.bowType === 'compound' ? (analysis.bowArmAngle >= 166 && analysis.bowArmAngle <= 180) : (analysis.bowArmAngle >= 172);
                    ctx.strokeStyle = isGood ? '#ff6a1a' : '#ff3366';
                    ctx.shadowColor = ctx.strokeStyle;
                    ctx.shadowBlur = Math.round(8 * scale);
                } else if (isDrawArm) {
                    ctx.lineWidth = Math.max(3.5, 4 * scale);
                    ctx.strokeStyle = '#e8d7c5';
                    ctx.shadowColor = '#e8d7c5';
                    ctx.shadowBlur = Math.round(6 * scale);
                } else {
                    ctx.lineWidth = Math.max(2.2, 2.5 * scale);
                    ctx.strokeStyle = 'rgba(232, 215, 197, 0.45)';
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }
                ctx.stroke();
            });

            // Eklem Noktaları
            [11, 12, 13, 14, 15, 16].forEach(idx => {
                const p = landmarks[idx];
                if (!p || (p.visibility !== undefined && p.visibility < 0.25)) return;
                const x = p.x * width, y = p.y * height;
                const r = Math.round(4.5 * scale);

                ctx.beginPath();
                ctx.arc(x, y, r + Math.round(2 * scale), 0, 2 * Math.PI);
                ctx.strokeStyle = '#ff6a1a';
                ctx.lineWidth = Math.max(1.2, 1.5 * scale);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(x, y, r, 0, 2 * Math.PI);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            });

            // Açı Rozetleri (Yay Kolu & Çekiş Dirseği)
            const bowElbow = isRight ? landmarks[13] : landmarks[14];
            const drawElbow = isRight ? landmarks[14] : landmarks[13];

            if (bowElbow && (bowElbow.visibility === undefined || bowElbow.visibility > 0.25)) {
                const isGood = analysis.bowType === 'compound' ? (analysis.bowArmAngle >= 166 && analysis.bowArmAngle <= 180) : (analysis.bowArmAngle >= 172);
                drawAngleBadge(ctx, `${Math.round(analysis.bowArmAngle)}°`, bowElbow.x * width, bowElbow.y * height - Math.round(18 * scale), isGood ? '#ff6a1a' : '#ff3366', scale);
            }

            if (drawElbow && (drawElbow.visibility === undefined || drawElbow.visibility > 0.25)) {
                drawAngleBadge(ctx, `${Math.round(analysis.drawElbowAngle)}°`, drawElbow.x * width, drawElbow.y * height - Math.round(18 * scale), '#e8d7c5', scale);
            }

            // Sağ Alt Canlı Özet Kutusu
            drawHUDCornerBadge(ctx, width, height, target, analysis, scale);

            ctx.restore();
        }

        // 2. Kullanıcının Yaptığı Özel Çizimler
        const userDrawings = target === 'A' ? state.drawingsA : state.drawingsB;
        renderDrawingItemsOnContext(ctx, width, height, userDrawings);
    }

    function drawAngleBadge(ctx, text, x, y, color, scale = 1) {
        ctx.save();
        const padX = Math.round(7 * scale);
        const padY = Math.round(3 * scale);
        const fontSize = Math.max(11, Math.round(12.5 * scale));
        ctx.font = `bold ${fontSize}px Poppins, -apple-system, sans-serif`;

        const textMetrics = ctx.measureText(text);
        const boxW = textMetrics.width + (padX * 2);
        const boxH = fontSize + (padY * 2);
        const drawX = x - (boxW / 2);
        const drawY = y - (boxH / 2);

        ctx.fillStyle = 'rgba(10, 10, 14, 0.88)';
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1.2, 1.4 * scale);

        // Güvenli yuvarlak kutu
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(drawX, drawY, boxW, boxH, Math.round(6 * scale)) : ctx.rect(drawX, drawY, boxW, boxH);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y + 1);
        ctx.restore();
    }

    function drawHUDCornerBadge(ctx, width, height, target, analysis, scale = 1) {
        ctx.save();
        const boxW = Math.min(width * 0.46, Math.max(160 * scale, 135));
        const boxH = Math.max(68, Math.round(72 * scale));
        const margin = Math.max(8, Math.round(8 * scale));
        const x = width - boxW - margin;
        const y = height - boxH - margin;

        ctx.fillStyle = 'rgba(10, 10, 14, 0.92)';
        ctx.strokeStyle = target === 'A' ? 'rgba(255, 106, 26, 0.45)' : 'rgba(232, 215, 197, 0.45)';
        ctx.lineWidth = Math.max(1.2, 1.4 * scale);

        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, boxW, boxH, Math.round(7 * scale)) : ctx.rect(x, y, boxW, boxH);
        ctx.fill();
        ctx.stroke();

        const pX = Math.round(7 * scale);

        // Başlık
        ctx.font = `bold ${Math.max(9, Math.round(9.5 * scale))}px Poppins, sans-serif`;
        ctx.fillStyle = target === 'A' ? '#ff6a1a' : '#e8d7c5';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Video ${target} (${analysis.bowTypeLabel})`, x + pX, y + Math.round(6 * scale));

        // Yay Kolu
        ctx.font = `${Math.max(8.5, Math.round(9 * scale))}px Poppins, sans-serif`;
        ctx.fillStyle = '#9e9ea8';
        ctx.fillText('🏹 Yay Kolu:', x + pX, y + Math.round(26 * scale));
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ff6a1a';
        ctx.fillText(`${Math.round(analysis.bowArmAngle)}°`, x + boxW - pX, y + Math.round(26 * scale));

        // Çekiş Dirseği & Çapa
        ctx.textAlign = 'left';
        ctx.fillStyle = '#9e9ea8';
        ctx.fillText('🎯 Çekiş / Çapa:', x + pX, y + Math.round(44 * scale));
        ctx.textAlign = 'right';
        ctx.fillStyle = '#e8d7c5';
        const cleanAnchor = analysis.anchorStatus.replace(/🟢|🟡|🔴/g, '').trim();
        ctx.fillText(`${Math.round(analysis.drawElbowAngle)}° · ${cleanAnchor}`, x + boxW - pX, y + Math.round(44 * scale));

        ctx.restore();
    }

    /**
     * İki Video Arasındaki Açı Farkını Gösteren Karşılaştırma Bandı
     */
    function updateComparisonDiffBanner() {
        const banner = document.getElementById('cmp-diff-banner');
        if (!banner) return;

        if (state.videoA.analysis && state.videoB.analysis) {
            banner.style.display = 'flex';
            const armDiff = Math.abs(state.videoA.analysis.bowArmAngle - state.videoB.analysis.bowArmAngle).toFixed(1);
            const elbowDiff = Math.abs(state.videoA.analysis.drawElbowAngle - state.videoB.analysis.drawElbowAngle).toFixed(1);

            banner.innerHTML = `
                <div style="font-weight:800; color:var(--accent-orange);">⚔️ KARŞILAŞTIRMA FARKI:</div>
                <div>🏹 Yay Kolu Açı Farkı: <b style="color:#ff6a1a;">Δ ${armDiff}°</b></div>
                <div>🎯 Çekiş Dirseği Farkı: <b style="color:#e8d7c5;">Δ ${elbowDiff}°</b></div>
            `;
        } else {
            banner.style.display = 'none';
        }
    }

    /**
     * AI Otomatik Açıları Aç / Kapat
     */
    function toggleAIAngles() {
        state.aiAnglesEnabled = !state.aiAnglesEnabled;
        const btn = document.getElementById('cmp-ai-angles-btn');
        if (btn) {
            btn.classList.toggle('aktif', state.aiAnglesEnabled);
            btn.innerHTML = state.aiAnglesEnabled ? '🤖 AI Açılar: AÇIK' : '🤖 AI Açılar: KAPALI';
        }
        analyzeTargetFrame('A');
        analyzeTargetFrame('B');
        if (window.showToast) {
            window.showToast(state.aiAnglesEnabled ? '🤖 Yapay zekâ otomatik açı tespiti aktif' : 'AI açıları gizlendi');
        }
    }

    function setHandedness(hand) {
        state.handedness = hand;
        ['right', 'left'].forEach(h => {
            const btn = document.getElementById(`cmp-hand-${h}`);
            if (btn) btn.classList.toggle('aktif', hand === h);
        });
        analyzeTargetFrame('A');
        analyzeTargetFrame('B');
    }

    function setBowType(type) {
        state.bowType = type;
        ['auto', 'recurve', 'compound'].forEach(t => {
            const btn = document.getElementById(`cmp-bow-${t}`);
            if (btn) btn.classList.toggle('aktif', type === t);
        });
        analyzeTargetFrame('A');
        analyzeTargetFrame('B');
    }

    /**
     * Ana Zaman Çubuğunu Kaydırma (Master Scrub)
     */
    function onMasterSeek(e) {
        const pct = parseFloat(e.target.value) / 100;
        const durA = (state.videoA.loaded && state.videoA.element.duration) ? state.videoA.element.duration : 1;
        const targetTimeA = pct * durA;

        if (state.videoA.loaded && state.videoA.element) {
            state.videoA.element.currentTime = targetTimeA;
        }

        if (state.isSyncLocked && state.videoB.loaded && state.videoB.element) {
            const targetTimeB = targetTimeA + (state.videoB.syncOffset - state.videoA.syncOffset);
            state.videoB.element.currentTime = Math.max(0, Math.min(state.videoB.element.duration || 0, targetTimeB));
        }

        analyzeTargetFrame('A');
        analyzeTargetFrame('B');
    }

    /**
     * Tekil Video Zaman Çubuğu (A veya B için bağımsız ince ayar)
     */
    function onSingleSeek(target, e) {
        const vidObj = target === 'A' ? state.videoA : state.videoB;
        if (!vidObj.loaded || !vidObj.element || !vidObj.element.duration) return;

        const pct = parseFloat(e.target.value) / 100;
        vidObj.element.currentTime = pct * vidObj.element.duration;
        analyzeTargetFrame(target);
    }

    /**
     * Kare Kare İlerletme / Geri Alma (Frame Stepper)
     */
    function stepFrame(target, deltaSeconds) {
        togglePlay(false);

        if (target === 'both') {
            if (state.videoA.loaded && state.videoA.element) {
                state.videoA.element.currentTime = Math.max(0, Math.min(state.videoA.element.duration || 0, state.videoA.element.currentTime + deltaSeconds));
            }
            if (state.videoB.loaded && state.videoB.element) {
                state.videoB.element.currentTime = Math.max(0, Math.min(state.videoB.element.duration || 0, state.videoB.element.currentTime + deltaSeconds));
            }
            analyzeTargetFrame('A');
            analyzeTargetFrame('B');
        } else {
            const vidObj = target === 'A' ? state.videoA : state.videoB;
            if (vidObj.loaded && vidObj.element) {
                vidObj.element.currentTime = Math.max(0, Math.min(vidObj.element.duration || 0, vidObj.element.currentTime + deltaSeconds));
                analyzeTargetFrame(target);
            }
        }
    }

    /**
     * Senkron Noktası Ayarla (Mevcut kareyi Çapa / Bırakış anı olarak eşle)
     */
    function setSyncAnchor(target) {
        const vidObj = target === 'A' ? state.videoA : state.videoB;
        if (!vidObj.loaded || !vidObj.element) return;

        vidObj.syncOffset = vidObj.element.currentTime;
        if (window.showToast) {
            window.showToast(`🎯 Video ${target} için senkron referans noktası kaydedildi (${vidObj.syncOffset.toFixed(2)}s).`);
        }
    }

    /**
     * Senkron Kilidini Aç / Kapat
     */
    function toggleSyncLock() {
        state.isSyncLocked = !state.isSyncLocked;
        const btn = document.getElementById('cmp-sync-lock-btn');
        if (btn) {
            btn.classList.toggle('aktif', state.isSyncLocked);
            btn.innerHTML = state.isSyncLocked ? '🔗 Senkron: Kilitli' : '🔓 Senkron: Serbest';
        }
        if (window.showToast) {
            window.showToast(state.isSyncLocked ? '🔗 Senkronize kaydırma aktif' : '🔓 Videolar bağımsız kaydırılabilir');
        }
    }

    /**
     * Oynatma Hızı Ayarla
     */
    function setSpeed(spd) {
        state.playbackSpeed = spd;
        if (state.videoA.element) state.videoA.element.playbackRate = spd;
        if (state.videoB.element) state.videoB.element.playbackRate = spd;

        ['025', '05', '1'].forEach(s => {
            const btn = document.getElementById(`cmp-speed-${s}`);
            if (btn) btn.classList.remove('aktif');
        });
        const currentBtn = document.getElementById(`cmp-speed-${spd === 0.25 ? '025' : (spd === 0.5 ? '05' : '1')}`);
        if (currentBtn) currentBtn.classList.add('aktif');
    }

    /**
     * Görünüm Modu Değiştir: 'split' (Yan Yana) | 'overlay' (Bindirme)
     */
    function setViewMode(mode) {
        state.viewMode = mode;
        const container = document.getElementById('cmp-dual-container');
        const splitBtn = document.getElementById('cmp-mode-split');
        const overlayBtn = document.getElementById('cmp-mode-overlay');
        const opacitySliderWrap = document.getElementById('cmp-opacity-wrap');

        if (container) {
            container.classList.toggle('cmp-mode-overlay-active', mode === 'overlay');
        }
        if (splitBtn) splitBtn.classList.toggle('aktif', mode === 'split');
        if (overlayBtn) overlayBtn.classList.toggle('aktif', mode === 'overlay');
        if (opacitySliderWrap) opacitySliderWrap.style.display = mode === 'overlay' ? 'flex' : 'none';

        applyOverlayOpacity();
    }

    function setOverlayOpacity(val) {
        state.overlayOpacity = parseFloat(val) / 100;
        applyOverlayOpacity();
    }

    function applyOverlayOpacity() {
        const wrapB = document.getElementById('cmp-wrapper-b');
        if (wrapB) {
            wrapB.style.opacity = state.viewMode === 'overlay' ? state.overlayOpacity : 1.0;
        }
    }

    function updateTimelineDisplay(target) {
        const vidObj = target === 'A' ? state.videoA : state.videoB;
        const seek = document.getElementById(`cmp-seek-${target.toLowerCase()}`);
        const timeLbl = document.getElementById(`cmp-time-${target.toLowerCase()}`);

        if (!vidObj.element) return;
        const cur = vidObj.element.currentTime || 0;
        const dur = vidObj.element.duration || 0;

        if (seek && dur > 0) seek.value = (cur / dur) * 100;
        if (timeLbl) {
            const formatTime = (t) => {
                const m = Math.floor(t / 60);
                const s = (t % 60).toFixed(1);
                return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            };
            timeLbl.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
        }
    }

    function updateMasterTimeline() {
        const masterSeek = document.getElementById('cmp-master-seek');
        const masterTimeLbl = document.getElementById('cmp-master-time');
        if (!masterSeek || !state.videoA.element) return;

        const cur = state.videoA.element.currentTime || 0;
        const dur = state.videoA.element.duration || 0;

        if (dur > 0) masterSeek.value = (cur / dur) * 100;
        if (masterTimeLbl) {
            const formatTime = (t) => {
                const m = Math.floor(t / 60);
                const s = (t % 60).toFixed(1);
                return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
            };
            masterTimeLbl.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
        }
    }

    // ==========================================
    // 🎨 İKİLİ ÇİZİM MOTORU (DUAL DRAWING CANVAS)
    // ==========================================

    function setupDrawingListeners() {
        ['A', 'B'].forEach(target => {
            const canvas = document.getElementById(`cmp-canvas-${target.toLowerCase()}`);
            if (!canvas) return;

            const getPos = (e) => {
                const rect = canvas.getBoundingClientRect();
                const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
                const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
                return {
                    x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
                    y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
                };
            };

            canvas.addEventListener('pointerdown', (e) => {
                if (!state.activeTool) return;
                e.preventDefault();
                state.activeCanvasTarget = target;
                const p = getPos(e);
                const history = target === 'A' ? state.drawingsA : state.drawingsB;

                if (state.activeTool === 'pen') {
                    history.push({ type: 'pen', color: state.currentColor, points: [p] });
                } else if (state.activeTool === 'line') {
                    history.push({ type: 'line', color: state.currentColor, p1: p, p2: p });
                } else if (state.activeTool === 'circle') {
                    history.push({ type: 'circle', color: state.currentColor, center: p, radius: 0.05 });
                } else if (state.activeTool === 'angle') {
                    state.angleDraftPoints.push(p);
                    if (state.angleDraftPoints.length === 3) {
                        const [p1, p2, p3] = state.angleDraftPoints;
                        const deg = calculateAngle(p1, p2, p3);
                        history.push({ type: 'angle', color: state.currentColor, p1, p2, p3, angleVal: deg });
                        state.angleDraftPoints = [];
                    }
                }
                analyzeTargetFrame(target);
            });

            canvas.addEventListener('pointermove', (e) => {
                if (!state.activeTool || e.buttons === 0) return;
                const p = getPos(e);
                const history = target === 'A' ? state.drawingsA : state.drawingsB;
                const cur = history[history.length - 1];
                if (!cur) return;

                if (cur.type === 'pen') {
                    cur.points.push(p);
                    analyzeTargetFrame(target);
                } else if (cur.type === 'line') {
                    cur.p2 = p;
                    analyzeTargetFrame(target);
                } else if (cur.type === 'circle') {
                    cur.radius = Math.hypot(p.x - cur.center.x, p.y - cur.center.y);
                    analyzeTargetFrame(target);
                }
            });
        });
    }

    function renderDrawingItemsOnContext(ctx, width, height, items) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        items.forEach(item => {
            ctx.strokeStyle = item.color;
            ctx.fillStyle = item.color;
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 6;

            if (item.type === 'pen' && item.points) {
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(item.points[0].x * width, item.points[0].y * height);
                for (let i = 1; i < item.points.length; i++) {
                    ctx.lineTo(item.points[i].x * width, item.points[i].y * height);
                }
                ctx.stroke();
            } else if (item.type === 'line' && item.p1 && item.p2) {
                ctx.lineWidth = 3.5;
                ctx.beginPath();
                ctx.moveTo(item.p1.x * width, item.p1.y * height);
                ctx.lineTo(item.p2.x * width, item.p2.y * height);
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(item.p2.x * width, item.p2.y * height, 4.5, 0, 2 * Math.PI);
                ctx.fill();
            } else if (item.type === 'circle' && item.center) {
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(item.center.x * width, item.center.y * height, item.radius * width, 0, 2 * Math.PI);
                ctx.stroke();
            } else if (item.type === 'angle' && item.p1 && item.p2 && item.p3) {
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(item.p1.x * width, item.p1.y * height);
                ctx.lineTo(item.p2.x * width, item.p2.y * height);
                ctx.lineTo(item.p3.x * width, item.p3.y * height);
                ctx.stroke();

                [item.p1, item.p2, item.p3].forEach(pt => {
                    ctx.beginPath();
                    ctx.arc(pt.x * width, pt.y * height, 4, 0, 2 * Math.PI);
                    ctx.fill();
                });

                // Açı etiketi
                ctx.fillStyle = 'rgba(10, 10, 14, 0.9)';
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 1.5;
                const ax = item.p2.x * width;
                const ay = item.p2.y * height - 18;
                ctx.beginPath();
                ctx.arc(ax, ay, 14, 0, 2 * Math.PI);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px Poppins, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${item.angleVal}°`, ax, ay);
            }
        });

        ctx.restore();
    }

    function setDrawTool(tool) {
        state.activeTool = tool;
        state.angleDraftPoints = [];

        [state.videoA.canvas, state.videoB.canvas].forEach(c => {
            if (c) {
                c.style.pointerEvents = tool ? 'auto' : 'none';
                c.style.cursor = tool ? 'crosshair' : 'default';
            }
        });

        ['pen', 'line', 'circle', 'angle', 'none'].forEach(t => {
            const btn = document.getElementById(`cmp-tool-${t}`);
            if (btn) btn.classList.toggle('aktif', (tool === t) || (!tool && t === 'none'));
        });

        if (window.showToast) {
            const names = { pen: '✏️ Kalem aktif', line: '📏 Düz Çizgi aktif', circle: '⭕ Daire aktif', angle: '📐 3 noktaya dokunarak açı ölçün', null: '🖐️ Gezinme modu' };
            window.showToast(names[tool] || 'Çizim modu');
        }
    }

    function setDrawColor(color, el) {
        state.currentColor = color;
        document.querySelectorAll('.cmp-color-dot').forEach(dot => dot.classList.remove('aktif'));
        if (el) el.classList.add('aktif');
    }

    function undoDraw() {
        if (state.drawingsA.length > 0 || state.drawingsB.length > 0) {
            if (state.activeCanvasTarget === 'A' && state.drawingsA.length > 0) state.drawingsA.pop();
            else if (state.drawingsB.length > 0) state.drawingsB.pop();
            else if (state.drawingsA.length > 0) state.drawingsA.pop();

            analyzeTargetFrame('A');
            analyzeTargetFrame('B');
            if (window.showToast) window.showToast('Son çizim geri alındı.');
        }
    }

    function clearDrawings() {
        state.drawingsA = [];
        state.drawingsB = [];
        state.angleDraftPoints = [];
        analyzeTargetFrame('A');
        analyzeTargetFrame('B');
        if (window.showToast) window.showToast('Tüm karşılaştırma çizimleri temizlendi.');
    }

    /**
     * 📸 Yan Yana Karşılaştırma Kartını İndir
     */
    function captureComparisonCard() {
        if (!state.videoA.loaded && !state.videoB.loaded) {
            if (window.showToast) window.showToast('En az bir video yüklenmelidir.', 'error');
            return;
        }

        const wA = (state.videoA.loaded && state.videoA.element) ? state.videoA.element.videoWidth || 640 : 640;
        const hA = (state.videoA.loaded && state.videoA.element) ? state.videoA.element.videoHeight || 480 : 480;
        const wB = (state.videoB.loaded && state.videoB.element) ? state.videoB.element.videoWidth || 640 : 640;
        const hB = (state.videoB.loaded && state.videoB.element) ? state.videoB.element.videoHeight || 480 : 480;

        const targetH = Math.max(hA, hB);
        const scaleA = targetH / hA;
        const scaleB = targetH / hB;
        const finalWA = wA * scaleA;
        const finalWB = wB * scaleB;

        const cardCanvas = document.createElement('canvas');
        cardCanvas.width = finalWA + finalWB + 20;
        cardCanvas.height = targetH + 80;
        const ctx = cardCanvas.getContext('2d');

        // Arka Plan
        ctx.fillStyle = '#0a0a0d';
        ctx.fillRect(0, 0, cardCanvas.width, cardCanvas.height);

        // Başlık
        ctx.fillStyle = '#ff6a1a';
        ctx.font = 'bold 22px Poppins, sans-serif';
        ctx.fillText('🏹 DAĞ OKÇULUK — İkili Form & Atış Karşılaştırması', 20, 36);

        ctx.fillStyle = '#e8d7c5';
        ctx.font = '13px Poppins, sans-serif';
        ctx.fillText(`Tarih: ${new Date().toLocaleDateString('tr-TR')} · Senkronize Kare & Açı Analizi`, 20, 60);

        // Video A
        if (state.videoA.loaded && state.videoA.element) {
            ctx.drawImage(state.videoA.element, 0, 70, finalWA, targetH);
            if (state.videoA.canvas) ctx.drawImage(state.videoA.canvas, 0, 70, finalWA, targetH);
        }

        // Ayraç Çizgisi
        ctx.strokeStyle = 'rgba(255, 106, 26, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(finalWA + 10, 70);
        ctx.lineTo(finalWA + 10, targetH + 70);
        ctx.stroke();

        // Video B
        if (state.videoB.loaded && state.videoB.element) {
            ctx.drawImage(state.videoB.element, finalWA + 20, 70, finalWB, targetH);
            if (state.videoB.canvas) ctx.drawImage(state.videoB.canvas, finalWA + 20, 70, finalWB, targetH);
        }

        // İndir
        const link = document.createElement('a');
        link.download = `DAG_SK_Karsilastirma_${Date.now()}.png`;
        link.href = cardCanvas.toDataURL('image/png');
        link.click();

        if (window.showToast) window.showToast('📸 Karşılaştırma kartı kaydedildi!', 'success');
    }

    /**
     * WhatsApp Veli Paylaşımı
     */
    function shareToWhatsApp() {
        captureComparisonCard();

        const athleteName = (window.aktifSporcu && window.aktifSporcu.ad) ? window.aktifSporcu.ad : 'Sporcumuz';
        const dateStr = new Date().toLocaleDateString('tr-TR');

        let diffText = '';
        if (state.videoA.analysis && state.videoB.analysis) {
            const armDiff = Math.abs(state.videoA.analysis.bowArmAngle - state.videoB.analysis.bowArmAngle).toFixed(1);
            const elbowDiff = Math.abs(state.videoA.analysis.drawElbowAngle - state.videoB.analysis.drawElbowAngle).toFixed(1);
            diffText = `\n📊 *Açı Karşılaştırma Özeti:*\n• 1. Atış Yay Kolu: ${Math.round(state.videoA.analysis.bowArmAngle)}° | 2. Atış: ${Math.round(state.videoB.analysis.bowArmAngle)}° (Fark: ${armDiff}°)\n• 1. Atış Çekiş Dirseği: ${Math.round(state.videoA.analysis.drawElbowAngle)}° | 2. Atış: ${Math.round(state.videoB.analysis.drawElbowAngle)}° (Fark: ${elbowDiff}°)\n`;
        }

        const message = `🎯 *DAĞ OKÇULUK SPOR KULÜBÜ*\n🏹 *İkili Teknik Atış & Form Karşılaştırması*\n📅 Tarih: ${dateStr}\n\n👤 *Sporcu:* ${athleteName}${diffText}\n✅ *Antrenör Notu:* Sporcumuzun iki farklı atışı yan yana senkronize incelenmiş, eklem açıları ve çapa duruşundaki gelişim değerlendirilmiştir. Detaylı analiz kartı ektedir.`;

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
        if (window.showToast) window.showToast('📲 WhatsApp veli mesajı hazırlandı!');
    }

    // Global Dışa Aktarım
    global.DAGSK_COMPARE = {
        init,
        loadVideo,
        togglePlay,
        onMasterSeek,
        onSingleSeek,
        stepFrame,
        setSyncAnchor,
        toggleSyncLock,
        toggleAIAngles,
        setHandedness,
        setBowType,
        setSpeed,
        setViewMode,
        setOverlayOpacity,
        setDrawTool,
        setDrawColor,
        undoDraw,
        clearDrawings,
        captureComparisonCard,
        shareToWhatsApp
    };

})(typeof window !== 'undefined' ? window : this);
