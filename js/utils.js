export let audioCtx = null;
export let bgMusic = null;
let musicEnabled = true;

// --- Инициализация звука ---
export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// --- Управление фоновой музыкой ---
export function initBackgroundMusic() {
    if (!bgMusic) {
        bgMusic = new Audio('https://zvukogram.com/index.php?r=site/download&id=89396&type=mp3');
        bgMusic.loop = true;
        bgMusic.volume = 0.2;
        bgMusic.addEventListener('canplaythrough', () => console.log("Music loaded"));
        bgMusic.addEventListener('error', (e) => console.error("Music error:", e));
    }
    return bgMusic;
}

export function startBackgroundMusic() {
    if (!musicEnabled) return;
    const music = initBackgroundMusic();
    music.play().catch(e => console.log("Autoplay blocked:", e));
}

export function stopBackgroundMusic() {
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
}

export function updateMusicBySound(soundEnabled) {
    musicEnabled = soundEnabled;
    if (soundEnabled) {
        startBackgroundMusic();
    } else {
        stopBackgroundMusic();
    }
}

// --- Звуковые эффекты ---
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
            gain.gain.value = 0.2;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.1);
            osc.stop(audioCtx.currentTime + 0.1);
            break;
        case "bigEat":
            osc.frequency.value = 659.25;
            gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
            osc.stop(audioCtx.currentTime + 0.15);
            break;
        case "shrinkEat":
            osc.frequency.value = 392.00;
            gain.gain.value = 0.25;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.12);
            osc.stop(audioCtx.currentTime + 0.12);
            break;
        case "turboEat":
            osc.frequency.value = 880.00;
            gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
            osc.stop(audioCtx.currentTime + 0.2);
            break;
        case "giftEat":
            osc.frequency.value = 1046.50;
            gain.gain.value = 0.25;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.25);
            osc.stop(audioCtx.currentTime + 0.25);
            break;
        case "die":
            osc.frequency.value = 164.81;
            gain.gain.value = 0.35;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
            osc.stop(audioCtx.currentTime + 0.3);
            break;
        case "taskComplete":
            osc.frequency.value = 523.25;
            gain.gain.value = 0.2;
            osc.start();
            setTimeout(() => { if (osc) osc.frequency.value = 659.25; }, 50);
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
            osc.stop(audioCtx.currentTime + 0.2);
            break;
        case "introBeep":
            osc.frequency.value = 440.00;
            gain.gain.value = 0.15;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05);
            osc.stop(audioCtx.currentTime + 0.05);
            break;
        case "foodMove":
            osc.frequency.value = 800.00;
            gain.gain.value = 0.2;
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
            gain1.gain.value = 0.3;
            osc1.start();
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.value = 1046.5;
            gain2.gain.value = 0.3;
            osc2.start(now + 0.1);
            gain1.gain.exponentialRampToValueAtTime(0.00001, now + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.00001, now + 0.25);
            osc1.stop(now + 0.15);
            osc2.stop(now + 0.25);
            break;
        case "shield":
            osc.frequency.value = 523.25;
            gain.gain.value = 0.25;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.2);
            osc.stop(audioCtx.currentTime + 0.2);
            break;
        case "shieldBreak":
            osc.frequency.value = 220.00;
            gain.gain.value = 0.3;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.15);
            osc.stop(audioCtx.currentTime + 0.15);
            break;
        default:
            osc.frequency.value = 440.00;
            gain.gain.value = 0.2;
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
export const maxTurboTime = 30000;

export function addFloatingScore(floatingScores, x, y, text, lang = "RU") {
    let displayText = text;
    if (text === "MOVED!") displayText = (lang === "RU") ? "ПЕРЕМЕЩЕНА!" : "MOVED!";
    else if (text === "TURBO!") displayText = (lang === "RU") ? "ТУРБО!" : "TURBO!";
    else if (text === "SHRINK") displayText = (lang === "RU") ? "УМЕНЬШЕНИЕ" : "SHRINK";
    else if (text === "SHIELD") displayText = (lang === "RU") ? "ЩИТ!" : "SHIELD!";
    else displayText = text;
    floatingScores.push({ 
        x: x * 20 + 10, 
        y: y * 20 - 15,
        text: displayText, 
        alpha: 1.0, 
        life: 15 
    });
}