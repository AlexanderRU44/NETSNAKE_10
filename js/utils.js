export let audioCtx = null;
export let musicNode = null;

export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        startBackgroundMusic();
    }
    return audioCtx;
}

export function startBackgroundMusic() {
    // Implementation
}

export function stopBackgroundMusic() {
    // Implementation
}

export function updateMusicVolume() {
    // Implementation
}

export function triggerVibration() {
    if (navigator.vibrate) navigator.vibrate(5);
}

export function playSound(type) {
    // Implementation
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
    floatingScores.push({ x: x * 20 + 10, y: y * 20, text: text, alpha: 1.0, life: 15 });
}