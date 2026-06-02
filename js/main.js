import { Game } from './game.js';
import { setupInputHandlers } from './inputs.js';
import { initAudio, startBackgroundMusic, triggerVibration } from './utils.js';
import { i18n } from './i18n.js';

// DOM элементы
const canvas = document.getElementById("gameCanvas");
const scoreElement = document.getElementById("score");
const hiScoreElement = document.getElementById("hi-score");
const hudElement = document.getElementById("hud");
const timerContainer = document.getElementById("timer-container");
const timerBar = document.getElementById("timer-bar");
const nameOverlay = document.getElementById("nameOverlay");
const nameInput = document.getElementById("nameInput");
const overlayLabel = document.getElementById("overlayLabel");
const btnSaveName = document.getElementById("btnSaveName");
const nextFoodLabel = document.getElementById("nextFoodLabel");

const game = new Game(
    canvas, scoreElement, hiScoreElement, hudElement,
    timerContainer, timerBar, nameOverlay, nameInput,
    overlayLabel, btnSaveName
);

function updateNextFoodLabel() {
    if (nextFoodLabel) {
        nextFoodLabel.innerText = i18n[game.currentLang].nextFood;
    }
}
updateNextFoodLabel();

const originalUpdateHUD = game.updateHUD.bind(game);
game.updateHUD = function() {
    originalUpdateHUD();
    updateNextFoodLabel();
};

setupInputHandlers(
    (action) => game.handleInput(action),
    () => game.handleCenter(),
    () => game.handleMenuPress(),
    () => game.handleBackPress(),
    triggerVibration,
    nameInput
);

btnSaveName.onclick = (e) => {
    e.preventDefault();
    triggerVibration();
    game.saveNameInput();
};

nameInput.onkeydown = (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        game.saveNameInput();
    }
};

// Первый клик — запускаем аудио и музыку
document.body.addEventListener('click', () => {
    initAudio();
    if (game.soundEnabled) {
        startBackgroundMusic();
    }
}, { once: true });

// Запуск игры
game.generateObstacles();
game.loadBestSingleScore();
game.updateTicker();
game.updateHUD();