/**
 * DAĞ S.K. — Yan Yana İkili Video Karşılaştırma & Senkronize Form Analizi
 * (Side-by-Side Dual Video Comparison & Synchronized Archery Biomechanics)
 * 
 * Özellikler:
 * - Video A & Video B bağımsız ve senkronize yükleme
 * - 🔗 Senkron Kilidi (Sync Lock) ile aynı anda kare kare oynatma/sarma
 * - 🔲 Yan Yana (Split 50/50) ve 👻 Hayalet / Şeffaf Bindirme (Ghost Overlay) modları
 * - Her iki video üzerinde açı (angle), çizgi (line) ve daire (circle) ölçümleri
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

        videoA: {
            element: null,
            canvas: null,
            file: null,
            loaded: false,
            syncOffset: 0
        },
        videoB: {
            element: null,
            canvas: null,
            file: null,
            loaded: false,
            syncOffset: 0
        },

        drawingsA: [],
        drawingsB: [],
        activeTool: null, // null | 'pen' | 'line' | 'circle' | 'angle'
        currentColor: '#ff6a1a',
        activeCanvasTarget: 'A', // 'A' or 'B'
        angleDraftPoints: []
    };

    let syncRAF = null;

    function init() {
        state.videoA.element = document.getElementById('cmp-video-a');
        state.videoA.canvas = document.getElementById('cmp-canvas-a');

        state.videoB.element = document.getElementById('cmp-video-b');
        state.videoB.canvas = document.getElementById('cmp-canvas-b');

        setupVideoEventListeners(state.videoA, 'A');
        setupVideoEventListeners(state.videoB, 'B');
        setupDrawingListeners();
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
            renderDrawings(target);
            checkReadyState();
        };

        vidObj.element.ontimeupdate = () => {
            updateTimelineDisplay(target);
            if (target === 'A') updateMasterTimeline();
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
    function loadVideo(target, file) {
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
        }
    }

    function startSyncLoop() {
        stopSyncLoop();
        const loop = () => {
            if (state.isPlaying) {
                // Eğer senkron kilidi açıksa ve iki video da varsa hız/zaman sapmasını kontrol et
                if (state.isSyncLocked && state.videoA.loaded && state.videoB.loaded) {
                    const tA = state.videoA.element.currentTime;
                    const expectedTB = Math.max(0, tA + (state.videoB.syncOffset - state.videoA.syncOffset));
                    if (Math.abs(state.videoB.element.currentTime - expectedTB) > 0.08) {
                        state.videoB.element.currentTime = expectedTB;
                    }
                }
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
    }

    /**
     * Tekil Video Zaman Çubuğu (A veya B için bağımsız ince ayar)
     */
    function onSingleSeek(target, e) {
        const vidObj = target === 'A' ? state.videoA : state.videoB;
        if (!vidObj.loaded || !vidObj.element || !vidObj.element.duration) return;

        const pct = parseFloat(e.target.value) / 100;
        vidObj.element.currentTime = pct * vidObj.element.duration;
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
        } else {
            const vidObj = target === 'A' ? state.videoA : state.videoB;
            if (vidObj.loaded && vidObj.element) {
                vidObj.element.currentTime = Math.max(0, Math.min(vidObj.element.duration || 0, vidObj.element.currentTime + deltaSeconds));
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
                        const radians = Math.atan2(p3.y - p2.y, p3.x - p2.x) - Math.atan2(p1.y - p2.y, p1.x - p2.x);
                        let deg = Math.abs((radians * 180.0) / Math.PI);
                        if (deg > 180.0) deg = 360.0 - deg;
                        history.push({ type: 'angle', color: state.currentColor, p1, p2, p3, angleVal: Math.round(deg * 10) / 10 });
                        state.angleDraftPoints = [];
                    }
                }
                renderDrawings(target);
            });

            canvas.addEventListener('pointermove', (e) => {
                if (!state.activeTool || e.buttons === 0) return;
                const p = getPos(e);
                const history = target === 'A' ? state.drawingsA : state.drawingsB;
                const cur = history[history.length - 1];
                if (!cur) return;

                if (cur.type === 'pen') {
                    cur.points.push(p);
                    renderDrawings(target);
                } else if (cur.type === 'line') {
                    cur.p2 = p;
                    renderDrawings(target);
                } else if (cur.type === 'circle') {
                    cur.radius = Math.hypot(p.x - cur.center.x, p.y - cur.center.y);
                    renderDrawings(target);
                }
            });
        });
    }

    function renderDrawings(target) {
        const canvas = target === 'A' ? state.videoA.canvas : state.videoB.canvas;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const history = target === 'A' ? state.drawingsA : state.drawingsB;
        renderDrawingItemsOnContext(ctx, canvas.width, canvas.height, history);
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

            renderDrawings('A');
            renderDrawings('B');
            if (window.showToast) window.showToast('Son çizim geri alındı.');
        }
    }

    function clearDrawings() {
        state.drawingsA = [];
        state.drawingsB = [];
        state.angleDraftPoints = [];
        renderDrawings('A');
        renderDrawings('B');
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
        ctx.fillText(`Tarih: ${new Date().toLocaleDateString('tr-TR')} · Senkronize Kare Analizi`, 20, 60);

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

        const message = `🎯 *DAĞ OKÇULUK SPOR KULÜBÜ*\n🏹 *İkili Teknik Atış & Form Karşılaştırması*\n📅 Tarih: ${dateStr}\n\n👤 *Sporcu:* ${athleteName}\n\n✅ *Antrenör Notu:* Sporcumuzun iki farklı atışı / referans formu yan yana senkronize olarak incelenmiş, eklem açıları ve çapa duruşundaki gelişim değerlendirilmiştir. İndirilen detaylı karşılaştırma kartı ektedir.`;

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
