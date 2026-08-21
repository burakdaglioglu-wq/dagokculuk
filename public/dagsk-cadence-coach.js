/**
 * DAĞ S.K. — Sesli Atış Ritmi & Tıkır Metronomu (Audio Shot Cadence Coach)
 * 
 * Özellikler:
 * - 🎙️ Türkçe Sesli Antrenör ("Kaldır... Çek... Çapa... Bırak!") + Web Speech API
 * - 🎵 Web Audio API Düşük Gecikmeli Metronom & Gerçekçi Tıkır (Clicker) Ses Efekti
 * - ⭕ Dairesel Görsel Ritim Halkası (Animated Cadence SVG Ring)
 * - 🏹 Hazır Şablonlar (Mete Gazoz Ritmi, Hızlı Rüzgar Ritmi, Makaralı Yay Ritmi, Özel Ritim)
 * - 📊 Atış Tutarlılığı & Standart Sapma (Consistency Scoring & Muscle Memory Tracker)
 * - 📱 Tablet / Telefon Tam Ekran Modu & Bluetooth Kulaklık Uyumluluğu
 */

(function (global) {
    'use strict';

    // Ritim Şablonları (Faz süreleri saniye cinsinden)
    const PRESETS = {
        mete_gazoz: {
            name: '🏹 Mete Gazoz Klasik Ritmi (8.5s)',
            desc: 'Dünya şampiyonu standardında akıcı, kesintisiz çekiş ve kararlı 1.5s tıkır genişlemesi.',
            phases: [
                { id: 'set', name: 'Hazırlık & Duruş', duration: 2.0, color: '#9e9ea8', audio: 'Hazır' },
                { id: 'lift', name: 'Yayı Kaldır', duration: 1.5, color: '#f59e0b', audio: 'Kaldır' },
                { id: 'draw', name: 'Çekiş', duration: 2.2, color: '#ff6a1a', audio: 'Çek' },
                { id: 'anchor', name: 'Çapa & Sırt Kilidi', duration: 1.3, color: '#ea580c', audio: 'Çapa' },
                { id: 'expand', name: 'Genişleme & Bırak!', duration: 1.5, color: '#10b981', audio: 'Bırak', isRelease: true },
                { id: 'follow', name: 'Takip (Duruşu Koru)', duration: 1.5, color: '#e8d7c5', audio: 'Koru' },
                { id: 'rest', name: 'Ok Arası Dinlenme', duration: 4.0, color: '#64748b', audio: 'Dinlen' }
            ]
        },
        fast_wind: {
            name: '⚡ Hızlı / Rüzgarlı Hava Ritmi (6.5s)',
            desc: 'Rüzgar patlamadan önce hızlı ve seri bırakış ritmi.',
            phases: [
                { id: 'set', name: 'Hazırlık & Duruş', duration: 1.5, color: '#9e9ea8', audio: 'Hazır' },
                { id: 'lift', name: 'Yayı Kaldır', duration: 1.0, color: '#f59e0b', audio: 'Kaldır' },
                { id: 'draw', name: 'Hızlı Çekiş', duration: 1.8, color: '#ff6a1a', audio: 'Çek' },
                { id: 'anchor', name: 'Çapa', duration: 1.0, color: '#ea580c', audio: 'Çapa' },
                { id: 'expand', name: 'Bırak!', duration: 1.2, color: '#10b981', audio: 'Bırak', isRelease: true },
                { id: 'follow', name: 'Takip', duration: 1.2, color: '#e8d7c5', audio: 'Koru' },
                { id: 'rest', name: 'Dinlenme', duration: 3.5, color: '#64748b', audio: 'Dinlen' }
            ]
        },
        compound_pro: {
            name: '⚙️ Makaralı Yay (Compound) Tetik Ritmi (10.0s)',
            desc: 'Makaralı yay için kontrollü çapa, peep hizalaması ve sürpriz tetik ezme süresi.',
            phases: [
                { id: 'set', name: 'Hazırlık', duration: 2.0, color: '#9e9ea8', audio: 'Hazır' },
                { id: 'lift', name: 'Yayı Kaldır', duration: 1.5, color: '#f59e0b', audio: 'Kaldır' },
                { id: 'draw', name: 'Durağa Kadar Çek', duration: 2.5, color: '#ff6a1a', audio: 'Çek' },
                { id: 'anchor', name: 'Peep & Çapa Kilidi', duration: 1.5, color: '#ea580c', audio: 'Kilit' },
                { id: 'expand', name: 'Tetiği Ez & Bırak!', duration: 2.5, color: '#10b981', audio: 'Tetik', isRelease: true },
                { id: 'follow', name: 'Takip', duration: 1.5, color: '#e8d7c5', audio: 'Koru' },
                { id: 'rest', name: 'Dinlenme', duration: 5.0, color: '#64748b', audio: 'Dinlen' }
            ]
        },
        custom: {
            name: '🛠️ Özel Kulüp / Sporcu Ritmi',
            desc: 'Antrenör tarafından özelleştirilmiş saniye süreleri.',
            phases: [
                { id: 'set', name: 'Hazırlık', duration: 2.0, color: '#9e9ea8', audio: 'Hazır' },
                { id: 'lift', name: 'Kaldır', duration: 1.5, color: '#f59e0b', audio: 'Kaldır' },
                { id: 'draw', name: 'Çekiş', duration: 2.0, color: '#ff6a1a', audio: 'Çek' },
                { id: 'anchor', name: 'Çapa', duration: 1.5, color: '#ea580c', audio: 'Çapa' },
                { id: 'expand', name: 'Bırak!', duration: 1.5, color: '#10b981', audio: 'Bırak', isRelease: true },
                { id: 'follow', name: 'Takip', duration: 1.5, color: '#e8d7c5', audio: 'Koru' },
                { id: 'rest', name: 'Dinlenme', duration: 4.0, color: '#64748b', audio: 'Dinlen' }
            ]
        }
    };

    const state = {
        selectedPreset: 'mete_gazoz',
        audioMode: 'voice_beep', // 'voice_beep' | 'voice_only' | 'beep_only' | 'silent'
        isRunning: false,
        isPaused: false,

        currentShotCount: 1,
        targetShotsPerEnd: 6,
        currentEndCount: 1,
        targetTotalEnds: 5,

        currentPhaseIdx: 0,
        phaseTimeRemaining: 0,
        phaseStartTime: 0,

        shotStartTime: 0,
        recordedShotsHistory: [], // { shotNum, targetDuration, actualDuration, diff, scorePct }
        currentShotActualStart: 0
    };

    let audioCtx = null;
    let timerInterval = null;

    /**
     * Web Audio API Başlatıcı (Düşük gecikmeli profesyonel tınılar)
     */
    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    /**
     * Tıkır (Clicker) & Bip Ses Efektleri
     */
    function playBeep(freq = 660, duration = 0.08, type = 'sine') {
        if (state.audioMode === 'silent' || state.audioMode === 'voice_only') return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {}
    }

    /**
     * Gerçekçi Metalik Tıkır (Clicker) Sesi
     */
    function playClickerSound() {
        if (state.audioMode === 'silent') return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;

            // Çift frekanslı metalik tık sesi
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();

            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(2400, ctx.currentTime);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(4200, ctx.currentTime);

            gain.gain.setValueAtTime(0.65, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(ctx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 0.05);
            osc2.stop(ctx.currentTime + 0.05);
        } catch (e) {}
    }

    /**
     * Türkçe Sesli Anons (Web Speech API)
     */
    function speakVoice(text) {
        if (state.audioMode === 'silent' || state.audioMode === 'beep_only') return;
        if (!('speechSynthesis' in window)) return;

        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'tr-TR';
            utterance.rate = 1.25;
            utterance.pitch = 1.05;
            utterance.volume = 1.0;
            window.speechSynthesis.speak(utterance);
        } catch (e) {}
    }

    /**
     * Ritim Koçunu Başlat / Durdur
     */
    function toggleCadence() {
        if (state.isRunning) {
            stopCadence();
        } else {
            startCadence();
        }
    }

    function startCadence() {
        getAudioContext();
        state.isRunning = true;
        state.isPaused = false;
        state.currentPhaseIdx = 0;

        const preset = PRESETS[state.selectedPreset];
        state.phaseTimeRemaining = preset.phases[0].duration;
        state.currentShotActualStart = Date.now();

        updatePlayButtonUI(true);
        triggerPhase(0);

        if (timerInterval) clearInterval(timerInterval);
        const tickMs = 50; // 20 FPS pürüzsüz halka animasyonu

        timerInterval = setInterval(() => {
            if (!state.isRunning || state.isPaused) return;

            state.phaseTimeRemaining -= (tickMs / 1000);

            if (state.phaseTimeRemaining <= 0) {
                advanceToNextPhase();
            } else {
                renderRingUI();
            }
        }, tickMs);
    }

    function stopCadence() {
        state.isRunning = false;
        state.isPaused = false;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        updatePlayButtonUI(false);
        renderIdleUI();
    }

    function advanceToNextPhase() {
        const preset = PRESETS[state.selectedPreset];
        const nextIdx = state.currentPhaseIdx + 1;

        if (nextIdx < preset.phases.length) {
            state.currentPhaseIdx = nextIdx;
            state.phaseTimeRemaining = preset.phases[nextIdx].duration;
            triggerPhase(nextIdx);
        } else {
            // Atış tamamlandı! Ok sayısını artır veya dinlenmeye geç
            recordShotCompletion();
            state.currentShotCount++;

            if (state.currentShotCount > state.targetShotsPerEnd) {
                // Seri bitti!
                state.currentShotCount = 1;
                state.currentEndCount++;
                speakVoice('Seri bitti. Okları topla.');
                if (window.showToast) window.showToast(`🎯 Seri tamamlandı! (${state.targetShotsPerEnd} Ok)`, 'success');
            }

            state.currentPhaseIdx = 0;
            state.phaseTimeRemaining = preset.phases[0].duration;
            state.currentShotActualStart = Date.now();
            triggerPhase(0);
        }
    }

    function triggerPhase(idx) {
        const preset = PRESETS[state.selectedPreset];
        const phase = preset.phases[idx];
        if (!phase) return;

        // Görseli Güncelle
        renderRingUI();

        // Sesli Uyarılar
        if (phase.isRelease) {
            playClickerSound();
            speakVoice('Bırak!');
        } else {
            if (phase.id === 'lift') playBeep(520, 0.08);
            else if (phase.id === 'draw') playBeep(620, 0.08);
            else if (phase.id === 'anchor') playBeep(740, 0.08);
            else playBeep(440, 0.06);

            if (phase.audio) speakVoice(phase.audio);
        }
    }

    /**
     * Sporcu Bıraktığı Anda Butona Dokunursa (Manuel Reaksiyon Kaydı)
     */
    function recordManualRelease() {
        if (!state.isRunning) return;

        const preset = PRESETS[state.selectedPreset];
        const totalTargetShotTime = preset.phases.slice(0, 5).reduce((acc, p) => acc + p.duration, 0);
        const actualTime = (Date.now() - state.currentShotActualStart) / 1000;
        const diff = actualTime - totalTargetShotTime;
        const diffAbs = Math.abs(diff);

        // Tutarlılık Puanı (±0.15s = %100, ±0.5s = %80, ±1s = %50)
        let score = Math.max(20, Math.round(100 - (diffAbs * 45)));

        state.recordedShotsHistory.unshift({
            shotNum: state.currentShotCount,
            endNum: state.currentEndCount,
            targetDuration: totalTargetShotTime.toFixed(1),
            actualDuration: actualTime.toFixed(2),
            diff: diff > 0 ? `+${diff.toFixed(2)}s` : `${diff.toFixed(2)}s`,
            score,
            timestamp: new Date().toLocaleTimeString('tr-TR', { minute: '2-digit', second: '2-digit' })
        });

        if (state.recordedShotsHistory.length > 20) state.recordedShotsHistory.pop();

        playClickerSound();
        renderHistoryListUI();

        if (window.showToast) {
            const badge = score >= 90 ? '🟢 Mükemmel Ritim' : (score >= 75 ? '🟡 İyi' : '🔴 Erken/Geç Bırakış');
            window.showToast(`${badge}: ${actualTime.toFixed(2)}s (${score} Puan)`);
        }
    }

    function recordShotCompletion() {
        const preset = PRESETS[state.selectedPreset];
        const totalTargetShotTime = preset.phases.slice(0, 5).reduce((acc, p) => acc + p.duration, 0);
        const actualTime = (Date.now() - state.currentShotActualStart) / 1000;
        const diff = actualTime - totalTargetShotTime;

        let score = Math.max(30, Math.round(100 - (Math.abs(diff) * 40)));

        state.recordedShotsHistory.unshift({
            shotNum: state.currentShotCount,
            endNum: state.currentEndCount,
            targetDuration: totalTargetShotTime.toFixed(1),
            actualDuration: actualTime.toFixed(2),
            diff: diff > 0 ? `+${diff.toFixed(2)}s` : `${diff.toFixed(2)}s`,
            score,
            timestamp: new Date().toLocaleTimeString('tr-TR', { minute: '2-digit', second: '2-digit' })
        });

        if (state.recordedShotsHistory.length > 20) state.recordedShotsHistory.pop();
        renderHistoryListUI();
    }

    // ==========================================
    // 🎨 UI VE GÖRSEL RİTİM HALKASI RENDERER
    // ==========================================

    function renderRingUI() {
        const preset = PRESETS[state.selectedPreset];
        const phase = preset.phases[state.currentPhaseIdx];
        if (!phase) return;

        const phaseNameEl = document.getElementById('cadence-phase-name');
        const phaseSecEl = document.getElementById('cadence-phase-sec');
        const shotCounterEl = document.getElementById('cadence-shot-counter');
        const progressCircle = document.getElementById('cadence-svg-progress');
        const mainContainer = document.getElementById('cadence-ring-container');

        if (phaseNameEl) {
            phaseNameEl.textContent = phase.name.toUpperCase();
            phaseNameEl.style.color = phase.color;
        }

        if (phaseSecEl) {
            phaseSecEl.textContent = `${Math.max(0, state.phaseTimeRemaining).toFixed(1)}s`;
        }

        if (shotCounterEl) {
            shotCounterEl.textContent = `Ok ${state.currentShotCount}/${state.targetShotsPerEnd} · Seri ${state.currentEndCount}/${state.targetTotalEnds}`;
        }

        if (progressCircle) {
            const totalDuration = phase.duration;
            const progress = Math.max(0, Math.min(1, state.phaseTimeRemaining / totalDuration));
            const circumference = 2 * Math.PI * 130; // r=130
            const offset = circumference * (1 - progress);
            progressCircle.style.strokeDasharray = `${circumference}`;
            progressCircle.style.strokeDashoffset = `${offset}`;
            progressCircle.style.stroke = phase.color;
        }

        if (mainContainer) {
            mainContainer.style.boxShadow = `0 0 40px ${phase.color}33`;
        }
    }

    function renderIdleUI() {
        const phaseNameEl = document.getElementById('cadence-phase-name');
        const phaseSecEl = document.getElementById('cadence-phase-sec');
        const progressCircle = document.getElementById('cadence-svg-progress');
        const mainContainer = document.getElementById('cadence-ring-container');

        if (phaseNameEl) {
            phaseNameEl.textContent = 'HAZIR';
            phaseNameEl.style.color = 'var(--accent-sand)';
        }

        if (phaseSecEl) {
            const preset = PRESETS[state.selectedPreset];
            const total = preset.phases.slice(0, 5).reduce((acc, p) => acc + p.duration, 0);
            phaseSecEl.textContent = `${total.toFixed(1)}s`;
        }

        if (progressCircle) {
            const circumference = 2 * Math.PI * 130;
            progressCircle.style.strokeDashoffset = '0';
            progressCircle.style.stroke = 'var(--border-color)';
        }

        if (mainContainer) {
            mainContainer.style.boxShadow = 'none';
        }
    }

    function updatePlayButtonUI(isRunning) {
        const btn = document.getElementById('cadence-start-btn');
        if (btn) {
            btn.classList.toggle('va-btn-red', isRunning);
            btn.classList.toggle('va-btn-orange', !isRunning);
            btn.innerHTML = isRunning ? '⏹️ Antrenmanı Durdur' : '▶ Ritim Antrenmanını Başlat';
        }
    }

    function renderHistoryListUI() {
        const listEl = document.getElementById('cadence-history-list');
        const avgScoreEl = document.getElementById('cadence-avg-score');
        if (!listEl) return;

        if (state.recordedShotsHistory.length === 0) {
            listEl.innerHTML = '<div style="font-size:11.5px; color:var(--text-muted); text-align:center; padding:12px;">Henüz atış yapılmadı. Başlat\'a basarak ritim antrenmanına başlayın.</div>';
            if (avgScoreEl) avgScoreEl.textContent = '--';
            return;
        }

        const totalScore = state.recordedShotsHistory.reduce((acc, s) => acc + s.score, 0);
        const avgScore = Math.round(totalScore / state.recordedShotsHistory.length);
        if (avgScoreEl) avgScoreEl.textContent = `%${avgScore}`;

        listEl.innerHTML = state.recordedShotsHistory.map((s, idx) => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:7px 10px; background:rgba(255,255,255,0.03); border-radius:8px; margin-bottom:4px; font-size:12px; border-left:3px solid ${s.score >= 90 ? '#10b981' : (s.score >= 75 ? '#f59e0b' : '#ef4444')};">
                <div>
                    <b>Ok #${s.shotNum} (Seri ${s.endNum})</b>
                    <span style="color:var(--text-muted); font-size:10px; margin-left:6px;">${s.timestamp}</span>
                </div>
                <div style="display:flex; gap:10px; align-items:center;">
                    <span style="font-size:11px; color:var(--accent-sand);">Süre: <b>${s.actualDuration}s</b> (${s.diff})</span>
                    <span style="font-weight:900; color:${s.score >= 90 ? '#10b981' : (s.score >= 75 ? '#f59e0b' : '#ef4444')}; font-size:12.5px;">%${s.score}</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Şablon Değiştirme
     */
    function selectPreset(presetId) {
        if (state.isRunning) stopCadence();
        state.selectedPreset = presetId;

        ['mete_gazoz', 'fast_wind', 'compound_pro', 'custom'].forEach(p => {
            const btn = document.getElementById(`cadence-pre-${p}`);
            if (btn) btn.classList.toggle('aktif', p === presetId);
        });

        const descEl = document.getElementById('cadence-preset-desc');
        if (descEl && PRESETS[presetId]) {
            descEl.textContent = PRESETS[presetId].desc;
        }

        renderIdleUI();
    }

    /**
     * Ses Modu Değiştirme
     */
    function setAudioMode(mode) {
        state.audioMode = mode;
        ['voice_beep', 'voice_only', 'beep_only', 'silent'].forEach(m => {
            const btn = document.getElementById(`cadence-aud-${m}`);
            if (btn) btn.classList.toggle('aktif', m === mode);
        });
        if (window.showToast) {
            const names = { voice_beep: '🗣️🎵 Sesli Komut + Bip Aktif', voice_only: '🗣️ Yalnızca Sesli Komut', beep_only: '🎵 Yalnızca Metronom / Tıkır', silent: '🔕 Sessiz Mod' };
            window.showToast(names[mode] || 'Ses modu ayarlandı');
        }
    }

    // Global Dışa Aktarım
    global.DAGSK_CADENCE = {
        toggleCadence,
        startCadence,
        stopCadence,
        selectPreset,
        setAudioMode,
        recordManualRelease,
        renderIdleUI,
        PRESETS
    };

})(typeof window !== 'undefined' ? window : this);
