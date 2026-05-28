import { Game } from './game.js';
import { setupInputHandlers } from './inputs.js';
import { initAudio, triggerVibration, playSound } from './utils.js';

// Initialize DOM elements
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

// Create game instance
const game = new Game(
    canvas, scoreElement, hiScoreElement, hudElement, 
    timerContainer, timerBar, nameOverlay, nameInput, 
    overlayLabel, btnSaveName
);

// Setup event handlers
setupInputHandlers(
    (action) => game.handleInput(action),
    () => game.handleCenter(),
    () => game.handleMenuPress(),
    () => game.handleBackPress(),
    triggerVibration,
    nameInput
);

// Handle name input
btnSaveName.onclick = (e) => { e.preventDefault(); triggerVibration(); game.saveNameInput(); };
nameInput.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); game.saveNameInput(); } };

// Start game
game.loadAboutText();
game.generateObstacles();
game.loadBestSingleScore();
game.updateTicker();
game.updateHUD();