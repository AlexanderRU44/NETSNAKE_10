export let audioCtx = null;
export let musicNode = null;
let musicInterval = null;

export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        startBackgroundMusic();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

export function startBackgroundMusic() {
    if (!audioCtx) return;
    if (musicInterval) clearInterval(musicInterval);
    
    musicInterval = setInterval(() => {
        if (musicNode && musicNode.connected) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = 220;
        gain.gain.value = 0.03;
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 2);
        osc.stop(audioCtx.currentTime + 2);
        musicNode = osc;
    }, 3000);
}

export function stopBackgroundMusic() {
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
    if (musicNode) {
        try { musicNode.stop(); } catch(e) {}
        musicNode = null;
    }
}

export function updateMusicVolume(isPaused, soundEnabled) {
    if (!soundEnabled || isPaused) {
        stopBackgroundMusic();
    } else {
        startBackgroundMusic();
    }
}

export function triggerVibration() {
    if (navigator.vibrate) navigator.vibrate(5);
}

export function playSound(type, soundEnabled) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    switch(type) {
        case "eat":
            osc.frequency.value = 523.25;
            gain.gain.value = 0.1;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
            osc.stop(audioCtx.currentTime + 0.1);
            break;
        case "bigEat":
            osc.frequency.value = 659.25;
            gain.gain.value = 0.15;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
            osc.stop(audioCtx.currentTime + 0.15);
            break;
        case "shrinkEat":
            osc.frequency.value = 392.00;
            gain.gain.value = 0.12;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.12);
            osc.stop(audioCtx.currentTime + 0.12);
            break;
        case "turboEat":
            osc.frequency.value = 880.00;
            gain.gain.value = 0.15;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
            osc.stop(audioCtx.currentTime + 0.2);
            break;
        case "giftEat":
            osc.frequency.value = 1046.50;
            gain.gain.value = 0.12;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.25);
            osc.stop(audioCtx.currentTime + 0.25);
            break;
        case "die":
            osc.frequency.value = 164.81;
            gain.gain.value = 0.15;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
            osc.stop(audioCtx.currentTime + 0.3);
            break;
        case "taskComplete":
            osc.frequency.value = 523.25;
            gain.gain.value = 0.1;
            osc.start();
            setTimeout(() => {
                osc.frequency.value = 659.25;
            }, 50);
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
            osc.stop(audioCtx.currentTime + 0.2);
            break;
        case "introBeep":
            osc.frequency.value = 440.00;
            gain.gain.value = 0.08;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05);
            osc.stop(audioCtx.currentTime + 0.05);
            break;
        case "foodMove":
            osc.frequency.value = 800.00;
            gain.gain.value = 0.1;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
            osc.stop(audioCtx.currentTime + 0.1);
            break;
        case "timeBonus":
            const now = audioCtx.currentTime;
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);
            osc1.frequency.value = 880;
            gain1.gain.value = 0.15;
            osc1.start();
            
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.value = 1046.5;
            gain2.gain.value = 0.15;
            osc2.start(now + 0.1);
            
            gain1.gain.exponentialRampToValueAtTime(0.00001, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.00001, now + 0.25);
            osc1.stop(now + 0.15);
            osc2.stop(now + 0.25);
            break;
        default:
            osc.frequency.value = 440.00;
            gain.gain.value = 0.1;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
            osc.stop(audioCtx.currentTime + 0.1);
    }
}

export const snakeColors = [
    { nameRU: "КЛАССИКА", nameEN: "CLASSIC", hex: "DYNAMIC", eyeHex: "DYNAMIC" }, 
    { nameRU: "ЗЕЛЕНЫЙ", nameEN: "GREEN", hex: "#38ff38", eyeHex: "#111" },
    { nameRU: "СИНИЙ", nameEN: "BLUE", hex: "#0044ff", eyeHex: "#ffffff" },
    { nameRU: "РУБИН", nameEN: "RUBY", hex: "#b30000", eyeHex: "#ffffff" },
    { nameRU: "ХАМЕЛЕОН", nameEN: "CHAMELEON", hex: "RAINBOW", eyeHex: "#ffffff" }
];

export const speeds = [150, 100, 60];
export const maxBigFoodTime = 8000;
export const maxShrinkTime = 4000;
export const maxTurboTime = 6000;

export function addFloatingScore(floatingScores, x, y, text) {
    floatingScores.push({ 
        x: x * 20 + 10, 
        y: y * 20 - 15,
        text: text, 
        alpha: 1.0, 
        life: 15 
    });
}