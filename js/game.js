import { i18n } from './i18n.js';
import { tasks, completeTask, checkScoreTasks } from './tasks.js';
import { achievements, unlockAchievement, isChameleonUnlocked } from './achievements.js';
import { Renderer } from './renderer.js';
import { IntroScreen } from './intro.js';
import { MenuDrawer } from './menuDrawer.js';
import { CollisionChecker } from './collision.js';
import { FoodLogic } from './foodLogic.js';
import { AILogic } from './aiLogic.js';
import { GameStateHandler } from './gameStateHandler.js';
import { AboutLogic } from './aboutLogic.js';
import { ScreenEffects } from './screenEffects.js';
import { TouchControls } from './touchControls.js';
import { LeaderboardService } from './leaderboardService.js';
import { ObstacleManager } from './obstacleManager.js';
import { NameInputManager } from './nameInputManager.js';
import { AnimationController } from './animationController.js';
import { GameMechanics } from './gameMechanics.js';
import { SpecialModes } from './specialModes.js';
import { ParticleSystem } from './particleSystem.js';
import {
    audioCtx, initAudio, triggerVibration, playSound, snakeColors, speeds,
    maxBigFoodTime, maxShrinkTime, maxTurboTime, addFloatingScore,
    startBackgroundMusic, stopBackgroundMusic
} from './utils.js';

export class Game {
    constructor(canvas, scoreElement, hiScoreElement, hudElement, timerContainer, timerBar, nameOverlay, nameInput, overlayLabel, btnSaveName) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.scoreElement = scoreElement;
        this.hiScoreElement = hiScoreElement;
        this.hudElement = hudElement;
        this.timerContainer = timerContainer;
        this.timerBar = timerBar;
        this.nameOverlay = nameOverlay;
        this.nameInput = nameInput;
        this.overlayLabel = overlayLabel;
        this.btnSaveName = btnSaveName;

        this.gridSize = 20;
        this.tileCount = canvas.width / this.gridSize;
        this.speeds = speeds;
        this.i18n = i18n;
        this.globalTopTen = [];
        this.isLoadingLeaderboard = false;

        this.snake = [{ x: 10, y: 10 }];
        this.aiOpponent = null;
        this.aiOpponentScore = 0;
        this.food = { x: 5, y: 5 };
        this.gift = null;
        this.foodType = "REGULAR";
        this.flashToggle = true;
        this.flashCounter = 0;
        this.bonusTimer = 0;
        this.turboRemainingTime = 0;
        this.goldFoodEaten = false;
        this.blueFoodEaten = false;
        this.isTurboActive = false;
        this.dx = 1;
        this.dy = 0;
        this.nextDx = 1;
        this.nextDy = 0;
        this.isTurningThisTick = false;
        this.score = 0;
        this.isGameSubmitting = false;
        this.hiScore = 0;
        this.playerName = localStorage.getItem("snake_player_name") || "PLAYER";
        this.bestPlayerName = "---";
        this.isPaused = true;
        this.gameOver = false;
        this.aiMode = false;
        this.usedAIThisSession = false;
        this.currentSpeedMode = 1;
        this.soundEnabled = localStorage.getItem("snake_sound_enabled") !== "false";
        this.currentLang = "RU";
        this.themeMode = parseInt(localStorage.getItem("snake_theme_mode") || "2");
        this.currentModeIdx = 0;
        this.obstacles = [];
        this.ghostTrails = [];
        this.movingObstacleTick = 0;
        this.flashingObstacleIdx = -1;
        this.floatingScores = [];
        this.regularApplesStreak = 0;
        this.totalGamesPlayed = parseInt(localStorage.getItem("snake_total_games_played") || "0");
        this.themeChangesCount = 0;
        this.currentScreen = "INTRO";
        this.currentSnakeColorIdx = parseInt(localStorage.getItem("snake_color_idx") || "0");
        this.rainbowHue = 0;
        this.cheatSequence = [];
        this.targetCheat = ["UP", "UP", "DOWN"];
        this.mainMenuSelection = 0;
        this.settingsMenuSelection = 0;
        this.modesMenuSelection = 0;
        this.mainMenuScrollY = 0;
        this.tasksScrollY = 0;
        this.maxTasksScrollY = 120;
        this.aboutScrollY = 0;
        this.maxAboutScrollY = 200;
        this.achScrollY = 0;
        this.maxAchScrollY = 360;
        this.externalAboutData = { RU: [], EN: [] };
        this.currentGithubUrl = null;
        this.goldDistanceBeforeDeath = null;

        this.timeRemaining = 60;
        this.timeModeActive = false;
        this.foodMoveTimer = 0;
        this.foodMoveInterval = 3000;
        this.aiOpponentMoveTimer = 0;
        this.aiOpponentMoveDelay = 200;
        this.timeWarningFlash = false;
        this.lastTimeUpdate = 0;
        this.victoryFlag = false;

        this.modesScrollY = 0;
        
        this.shieldActive = false;
        this.particleSystem = new ParticleSystem(this);

        // Мультиплеерные переменные
        this.multiplayerGame = null;
        this.isMultiplayerMode = false;
        this.peerManager = null;
        this.multiplayerUI = null;

        this.specialModes = new SpecialModes(this);
        this.introScreen = new IntroScreen();
        this.isDarkTheme = this.getEffectiveTheme();
        this.renderer = new Renderer(
            this.ctx, this.canvas, this.tileCount, this.isDarkTheme,
            snakeColors, () => this.currentSnakeColorIdx, () => this.rainbowHue, this
        );
        this.menuDrawer = new MenuDrawer(this.ctx, this);
        this.collisionChecker = new CollisionChecker(this);
        this.foodLogic = new FoodLogic(this);
        this.aiLogic = new AILogic(this);
        this.stateHandler = new GameStateHandler(this);
        this.aboutLogic = new AboutLogic(this);
        this.screenEffects = new ScreenEffects(this);
        this.screenEffects.init();
        this.touchControls = new TouchControls(this, canvas);
        this.leaderboard = new LeaderboardService(this);
        this.obstacleManager = new ObstacleManager(this);
        this.nameInputManager = new NameInputManager(this, nameOverlay, nameInput, overlayLabel, btnSaveName);
        this.animationController = new AnimationController(this);
        this.gameMechanics = new GameMechanics(this);

        this.aboutLogic.loadAboutText();

        this.loadBestSingleScore = () => this.leaderboard.loadBestSingleScore();
        this.loadTopTen = async () => {
            await this.leaderboard.loadTopTen();
            this.globalTopTen = this.leaderboard.globalTopTen;
            this.isLoadingLeaderboard = this.leaderboard.isLoadingLeaderboard;
        };
        this.sendScoreToFirebase = (score) => this.leaderboard.sendScoreToFirebase(score);
        this.generateObstacles = () => this.obstacleManager.generateObstacles();
        this.moveOneObstacle = () => this.obstacleManager.moveOneObstacle();
        this.spawnGift = () => this.obstacleManager.spawnGift();
        this.openNameInput = () => this.nameInputManager.openNameInput();
        this.saveNameInput = () => this.nameInputManager.saveNameInput();
        this.updateTicker = () => this.animationController.updateTicker();
        this.moveSnake = () => this.gameMechanics.moveSnake();
        this.moveFoodInRushMode = () => this.gameMechanics.moveFoodInRushMode();
        this.updateTimeMode = () => this.gameMechanics.updateTimeMode();

        this.applyTheme();
        this.initThemeListener();
        this.animationController.updateTicker();
    }

    getEffectiveTheme() {
        if (this.themeMode === 2) {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return this.themeMode === 1;
    }

    initThemeListener() {
        if (window.matchMedia) {
            const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
            darkModeQuery.addEventListener('change', (e) => {
                if (this.themeMode === 2) {
                    this.isDarkTheme = e.matches;
                    this.applyTheme();
                    this.renderer.isDarkTheme = this.isDarkTheme;
                    this.renderer.invalidateCache();
                }
            });
        }
    }

    applyTheme() {
        if (this.isDarkTheme) {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
        }
        this.renderer.invalidateCache();
    }

    updateHUD() {
        const t = this.i18n[this.currentLang];
        const aiTag = this.aiMode ? " *AI*" : "";
        let modeTag = "";

        if (this.isMultiplayerMode) {
            return;
        } else if (this.currentModeIdx === 5) {
            modeTag = ` [${t.gameModes[5]}] ${this.score}:${this.aiOpponentScore}`;
        } else if (this.currentModeIdx === 6) {
            const mins = Math.floor(this.timeRemaining / 60);
            const secs = this.timeRemaining % 60;
            modeTag = ` [${t.gameModes[6]}] ${mins}:${secs.toString().padStart(2, '0')}`;
        } else if (this.currentModeIdx === 7) {
            modeTag = ` [${t.gameModes[7]}]`;
        } else {
            modeTag = ` [${t.gameModes[this.currentModeIdx]}]`;
        }
        
        let shieldTag = this.shieldActive ? " [SHIELD]" : "";

        this.scoreElement.innerText = `${t.score}:${this.score}${aiTag}${modeTag}${shieldTag}`;

        if (this.bestPlayerName === "---") {
            this.hiScoreElement.innerText = `${t.hi}: ${t.loading}`;
        } else {
            this.hiScoreElement.innerText = `${t.hi}:${this.hiScore} ${t.bestBy} ${this.bestPlayerName}`;
        }
    }

    updateMultiplayerHUD(myScore, opponentScore) {
        const t = this.i18n[this.currentLang];
        this.scoreElement.innerText = `${t.score}:${myScore} | VS:${opponentScore}`;
        this.hiScoreElement.innerText = `MULTIPLAYER`;
    }

    generateFood() {
        if (this.currentModeIdx === 8) {
            this.food = null;
            return;
        }
        this.foodLogic.generateFood();
    }

    checkCollision() {
        this.collisionChecker.checkCollision();
    }

    endGame(victory = false) {
        playSound("die", this.soundEnabled);
        this.gameOver = true;
        this.isPaused = true;
        this.isTurboActive = false;
        
        if (victory && this.currentModeIdx === 5) {
            this.victoryFlag = true;
        } else {
            this.victoryFlag = false;
        }
        
        this.currentScreen = "MAIN";
        this.mainMenuSelection = 0;
        this.mainMenuScrollY = 0;
        this.timeModeActive = false;
        this.totalGamesPlayed++;
        localStorage.setItem("snake_total_games_played", this.totalGamesPlayed);
        if (this.totalGamesPlayed >= 5) unlockAchievement("survivor", achievements);
        if (this.currentSpeedMode === 2) unlockAchievement("speedDemon", achievements);
        
        if (this.goldDistanceBeforeDeath !== null && this.goldDistanceBeforeDeath === 1 && this.foodType === "BIG") {
            unlockAchievement("greed", achievements);
        }
        this.goldDistanceBeforeDeath = null;
        
        this.updateHUD();
        this.sendScoreToFirebase(this.score);
    }
    
    reset() {
        this.gift = null;
        this.goldFoodEaten = false;
        this.blueFoodEaten = false;
        this.isTurboActive = false;
        this.turboRemainingTime = 0;
        this.bonusTimer = 0;
        this.snake = [{ x: 10, y: 10 }];
        this.ghostTrails = [];
        this.floatingScores = [];
        this.movingObstacleTick = 0;
        this.flashingObstacleIdx = -1;
        this.dx = 1;
        this.dy = 0;
        this.nextDx = 1;
        this.nextDy = 0;
        this.score = 0;
        this.gameOver = false;
        this.isPaused = true;
        this.foodType = "REGULAR";
        this.aiMode = false;
        this.usedAIThisSession = false;
        this.mainMenuSelection = 0;
        this.mainMenuScrollY = 0;
        this.timerContainer.style.visibility = "hidden";
        this.regularApplesStreak = 0;
        this.timeRemaining = 60;
        this.lastTimeUpdate = 0;
        this.foodMoveTimer = this.foodMoveInterval;
        this.timeWarningFlash = false;
        this.victoryFlag = false;
        this.goldDistanceBeforeDeath = null;
        this.shieldActive = false;
        
        if (this.foodLogic && this.foodLogic.shieldTimeout) {
            clearTimeout(this.foodLogic.shieldTimeout);
            this.foodLogic.shieldTimeout = null;
        }
        
        if (this.gameMechanics) {
            this.gameMechanics.timeAccumulator = 0;
        }

        this.specialModes.reset();

        if (this.currentModeIdx === 8) {
            this.food = null;
            this.foodType = "REGULAR";
            this.timerContainer.style.visibility = "hidden";
        }

        this.screenEffects.generateNextFoodType();
        if (this.currentModeIdx !== 8) this.generateFood();
        this.generateObstacles();
        if (this.currentModeIdx === 5) {
            this.aiLogic.initAIOpponent();
        } else {
            this.aiOpponent = null;
            this.aiOpponentScore = 0;
        }
        
        if (this.soundEnabled) {
            startBackgroundMusic();
        } else {
            stopBackgroundMusic();
        }
        
        this.updateTicker();
        this.updateHUD();
        this.cheatSequence = [];
    }

    // ========== МУЛЬТИПЛЕЕРНЫЕ МЕТОДЫ ==========

    async openMultiplayerMenu() {
        try {
            const { PeerManager } = await import('./multiplayer/peerManager.js');
            const { MultiplayerGame } = await import('./multiplayer/multiplayerGame.js');
            const { MultiplayerUI } = await import('./multiplayer/ui.js');
            
            this.peerManager = new PeerManager();
            this.multiplayerGame = new MultiplayerGame(this, this.peerManager);
            this.multiplayerUI = new MultiplayerUI(this, this.peerManager, this.multiplayerGame);
            
            this.multiplayerUI.createUI();
        } catch (error) {
            console.error('Failed to load multiplayer modules:', error);
            this.showMultiplayerMessage('Failed to load multiplayer. Check console.');
        }
    }

    startMultiplayerMode(multiplayerGame) {
        console.log("startMultiplayerMode called");
        this.isMultiplayerMode = true;
        this.multiplayerGame = multiplayerGame;
        this.isPaused = false;
        this.gameOver = false;
        this.score = 0;
        this.updateHUD();
        console.log("Multiplayer mode activated, isPaused:", this.isPaused);
    }

    showMultiplayerMessage(message) {
        this.isPaused = true;
        this.gameOver = true;
        this.isMultiplayerMode = false;
        
        setTimeout(() => {
            if (this.ctx) {
                this.ctx.fillStyle = "rgba(0,0,0,0.85)";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = "#ffffff";
                this.ctx.font = "10px 'Press Start 2P'";
                this.ctx.textAlign = "center";
                const lines = this.wrapText(message, 35);
                const startY = this.canvas.height / 2 - (lines.length * 10);
                lines.forEach((line, idx) => {
                    this.ctx.fillText(line, this.canvas.width / 2, startY + idx * 20);
                });
                this.ctx.fillText("PRESS OK TO CONTINUE", this.canvas.width / 2, this.canvas.height / 2 + 40);
            }
        }, 50);
    }

    wrapText(text, maxLength) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (let word of words) {
            if ((currentLine + ' ' + word).length > maxLength) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    exitMultiplayerMode() {
        if (this.multiplayerGame) {
            this.multiplayerGame.cleanup();
            this.multiplayerGame = null;
        }
        if (this.peerManager) {
            this.peerManager.disconnect();
            this.peerManager = null;
        }
        if (this.multiplayerUI) {
            this.multiplayerUI.close();
            this.multiplayerUI = null;
        }
        this.isMultiplayerMode = false;
        this.currentScreen = "MAIN";
        this.isPaused = true;
        this.gameOver = false;
        this.updateHUD();
    }

    handleMenuPress() {
        initAudio();
        if (this.currentScreen === "MULTIPLAYER") {
            this.exitMultiplayerMode();
        }
        if (this.currentScreen !== "EDIT_NAME" && this.currentScreen !== "INTRO") {
            if (!this.isPaused) {
                this.isPaused = true;
            }
            this.currentScreen = "MAIN";
        }
    }

    handleBackPress() {
        initAudio();
        if (this.currentScreen === "MULTIPLAYER") {
            this.exitMultiplayerMode();
        }
        if (this.currentScreen !== "EDIT_NAME" && this.currentScreen !== "INTRO") {
            if (["SETTINGS", "LEADERBOARD", "TASKS", "ACHIEVEMENTS", "MODES", "ABOUT", "MODE_INFO"].includes(this.currentScreen)) {
                this.currentScreen = "MAIN";
            }
        }
    }

    async handleCenter() {
        await this.stateHandler.handleCenter();
    }

    handleInput(act) {
        console.log("handleInput:", act, "isMultiplayerMode:", this.isMultiplayerMode);
        
        if (this.currentScreen === "EDIT_NAME" || this.currentScreen === "INTRO") return;
        if (this.currentScreen === "MULTIPLAYER") return;
        
        initAudio();
        
        // МУЛЬТИПЛЕЕРНЫЙ ВВОД
        if (this.isMultiplayerMode && this.multiplayerGame && this.multiplayerGame.gameActive) {
            console.log("Multiplayer input processing:", act);
            if (act === "UP" && this.multiplayerGame.myDirection.dy === 0) {
                this.multiplayerGame.sendDirection(0, -1);
            } else if (act === "DOWN" && this.multiplayerGame.myDirection.dy === 0) {
                this.multiplayerGame.sendDirection(0, 1);
            } else if (act === "LEFT" && this.multiplayerGame.myDirection.dx === 0) {
                this.multiplayerGame.sendDirection(-1, 0);
            } else if (act === "RIGHT" && this.multiplayerGame.myDirection.dx === 0) {
                this.multiplayerGame.sendDirection(1, 0);
            }
            return;
        }
        
        if (!this.isPaused) {
            this.cheatSequence.push(act);
            if (this.cheatSequence.length > 3) this.cheatSequence.shift();
            if (this.aiMode || this.isTurningThisTick) return;
            if (act === "UP" && this.dy === 0) {
                this.nextDx = 0; this.nextDy = -1;
                this.isTurningThisTick = true;
            } else if (act === "DOWN" && this.dy === 0) {
                this.nextDx = 0; this.nextDy = 1;
                this.isTurningThisTick = true;
            } else if (act === "LEFT" && this.dx === 0) {
                this.nextDx = -1; this.nextDy = 0;
                this.isTurningThisTick = true;
            } else if (act === "RIGHT" && this.dx === 0) {
                this.nextDx = 1; this.nextDy = 0;
                this.isTurningThisTick = true;
            }
        } else {
            if (this.currentScreen === "MAIN") {
                let max = this.gameOver ? 8 : 9;
                if (act === "UP") this.mainMenuSelection = (this.mainMenuSelection <= 0) ? max : this.mainMenuSelection - 1;
                if (act === "DOWN") this.mainMenuSelection = (this.mainMenuSelection >= max) ? 0 : this.mainMenuSelection + 1;
            } 
            else if (this.currentScreen === "MODES") {
                const maxMode = this.i18n[this.currentLang].gameModes.length - 1;
                const visibleHeight = 240;
                const itemHeight = 30;
                const maxScroll = Math.max(0, (maxMode + 1) * itemHeight - visibleHeight);
                
                if (act === "UP") {
                    this.modesMenuSelection = (this.modesMenuSelection <= 0) ? maxMode : this.modesMenuSelection - 1;
                    let targetY = this.modesMenuSelection * itemHeight;
                    if (targetY < this.modesScrollY) {
                        this.modesScrollY = targetY;
                    } else if (targetY > this.modesScrollY + visibleHeight - itemHeight) {
                        this.modesScrollY = targetY - (visibleHeight - itemHeight);
                    }
                    this.modesScrollY = Math.max(0, Math.min(this.modesScrollY, maxScroll));
                } 
                else if (act === "DOWN") {
                    this.modesMenuSelection = (this.modesMenuSelection >= maxMode) ? 0 : this.modesMenuSelection + 1;
                    let targetY = this.modesMenuSelection * itemHeight;
                    if (targetY < this.modesScrollY) {
                        this.modesScrollY = targetY;
                    } else if (targetY > this.modesScrollY + visibleHeight - itemHeight) {
                        this.modesScrollY = targetY - (visibleHeight - itemHeight);
                    }
                    this.modesScrollY = Math.max(0, Math.min(this.modesScrollY, maxScroll));
                }
            }
            else if (this.currentScreen === "SETTINGS") {
                let max = 5;
                if (act === "UP") this.settingsMenuSelection = (this.settingsMenuSelection <= 0) ? max : this.settingsMenuSelection - 1;
                if (act === "DOWN") this.settingsMenuSelection = (this.settingsMenuSelection >= max) ? 0 : this.settingsMenuSelection + 1;
            } 
            else if (this.currentScreen === "TASKS") {
                if (act === "UP") this.tasksScrollY = Math.max(0, this.tasksScrollY - 20);
                if (act === "DOWN") this.tasksScrollY = Math.min(this.maxTasksScrollY, this.tasksScrollY + 20);
            } 
            else if (this.currentScreen === "ABOUT") {
                if (act === "UP") this.aboutScrollY = Math.max(0, this.aboutScrollY - 15);
                if (act === "DOWN") this.aboutScrollY = Math.min(this.maxAboutScrollY, this.aboutScrollY + 15);
            } 
            else if (this.currentScreen === "ACHIEVEMENTS") {
                if (act === "UP") this.achScrollY = Math.max(0, this.achScrollY - 20);
                if (act === "DOWN") this.achScrollY = Math.min(this.maxAchScrollY, this.achScrollY + 20);
            }
        }
    }

    gameLoop() {
        if (this.currentScreen === "INTRO" || this.currentScreen === "EDIT_NAME") {
            this.hudElement.style.visibility = "hidden";
        } else {
            this.hudElement.style.visibility = "visible";
        }

        if (this.currentScreen === "INTRO") {
            this.introScreen.draw(this.ctx, this.canvas.width, this.canvas.height, this.isDarkTheme, this.flashToggle, (type) => playSound(type, this.soundEnabled));
            return;
        }

        this.renderer.clearCanvas();
        
        // ========== МУЛЬТИПЛЕЕР ==========
        // Проверяем мультиплеерный режим игры
        if (this.isMultiplayerMode && this.multiplayerGame) {
            if (this.multiplayerGame.gameActive) {
                this.multiplayerGame.draw(this.ctx, this.gridSize);
            } else {
                // Если игра не активна, показываем сообщение
                this.ctx.fillStyle = "rgba(0,0,0,0.8)";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.fillStyle = "#ffffff";
                this.ctx.font = "10px 'Press Start 2P'";
                this.ctx.textAlign = "center";
                this.ctx.fillText("Waiting for opponent...", this.canvas.width / 2, this.canvas.height / 2);
            }
            this.particleSystem.update();
            this.particleSystem.draw(this.ctx);
            return;
        }
        
        // Мультиплеерное меню (только фон, кнопки HTML)
        if (this.currentScreen === "MULTIPLAYER") {
            this.ctx.fillStyle = "rgba(0,0,0,0.85)";
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = "#ffffff";
            this.ctx.font = "12px 'Press Start 2P'";
            this.ctx.textAlign = "center";
            this.ctx.fillText("MULTIPLAYER", this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.font = "8px 'Press Start 2P'";
            this.ctx.fillStyle = "#8bac0f";
            this.ctx.fillText("Use the buttons below", this.canvas.width / 2, this.canvas.height / 2 + 20);
            this.particleSystem.update();
            this.particleSystem.draw(this.ctx);
            return;
        }

        const t = this.i18n[this.currentLang];
        this.flashCounter++;
        if (this.flashCounter % 3 === 0) this.flashToggle = !this.flashToggle;
        this.rainbowHue = (this.rainbowHue + 5) % 360;

        if (this.isTurboActive) {
            let delta = this.speeds[this.currentSpeedMode];
            this.turboRemainingTime -= delta;
            if (this.turboRemainingTime <= 0) {
                this.isTurboActive = false;
                this.turboRemainingTime = 0;
                this.updateTicker();
                this.timerContainer.style.visibility = "hidden";
            } else {
                const percentage = (this.turboRemainingTime / maxTurboTime) * 100;
                this.timerBar.style.width = percentage + "%";
                this.timerContainer.style.visibility = "visible";
            }
        }

        this.updateHUD();

        if (this.isPaused) {
            this.timerContainer.style.visibility = "hidden";
            this.renderer.drawObstacles(this.obstacles, this.currentModeIdx, this.flashToggle, this.flashingObstacleIdx);
            this.renderer.drawGhostTrails(this.ghostTrails, this.currentModeIdx, this.flashToggle);
            this.renderer.drawSnake(this.snake, this.rainbowHue, this.shieldActive);
            if (this.aiOpponent && this.currentModeIdx === 5) {
                this.renderer.drawAIOpponent(this.aiOpponent.snake);
            }
            this.renderer.drawFood(this.food, this.foodType, this.flashToggle);
            this.renderer.drawGift(this.gift, this.flashToggle);
            this.renderer.drawFloatingScores(this.floatingScores);
            if (this.currentModeIdx === 8) this.renderer.drawCoins(this.specialModes.coins);
            if (this.currentModeIdx === 9) this.renderer.drawPortals(this.specialModes.portals);
            this.particleSystem.update();
            this.particleSystem.draw(this.ctx);

            if (this.currentScreen === "MAIN") {
                if (this.gameOver) this.menuDrawer.drawPixelMenu(t.gameOver);
                else this.menuDrawer.drawPixelMenu(t.pause);
            } else if (this.currentScreen === "SETTINGS") this.menuDrawer.drawPixelMenu(t.settings);
            else if (this.currentScreen === "MODES") this.menuDrawer.drawModesScreen();
            else if (this.currentScreen === "LEADERBOARD") this.menuDrawer.drawLeaderboardScreen();
            else if (this.currentScreen === "TASKS") this.menuDrawer.drawTasksScreen();
            else if (this.currentScreen === "ACHIEVEMENTS") this.menuDrawer.drawAchievementsScreen();
            else if (this.currentScreen === "ABOUT") this.menuDrawer.drawAboutScreen();
            else if (this.currentScreen === "MODE_INFO") this.menuDrawer.drawModeInfoScreen();
            return;
        }

        this.updateTimeMode();
        this.moveFoodInRushMode();

        if (this.foodType === "BIG" || this.foodType === "SHRINK" || this.foodType === "TURBO" || this.foodType === "SHIELD") {
            let currentTickSpeed = this.isTurboActive ? this.speeds[2] : this.speeds[this.currentSpeedMode];
            this.bonusTimer -= currentTickSpeed;
            if (this.bonusTimer < 0) this.bonusTimer = 0;
            this.timerContainer.style.visibility = "visible";
            let maxTime = maxBigFoodTime;
            if (this.foodType === "SHRINK") maxTime = maxShrinkTime;
            if (this.foodType === "TURBO") maxTime = maxTurboTime;
            if (this.foodType === "SHIELD") maxTime = 0;
            if (maxTime > 0) {
                const percentage = Math.max(0, (this.bonusTimer / maxTime) * 100);
                this.timerBar.style.width = percentage + "%";
            }

            if (this.bonusTimer <= 0 && this.foodType !== "SHIELD") {
                this.foodType = "REGULAR";
                this.timerContainer.style.visibility = "hidden";
                this.generateFood();
            }
        } else if (this.foodType === "REGULAR") {
            this.timerContainer.style.visibility = "hidden";
        }

        if (this.aiMode) {
            this.aiLogic.makeAIPlayerMove();
        }

        this.dx = this.nextDx;
        this.dy = this.nextDy;
        this.isTurningThisTick = false;

        if (this.currentModeIdx === 4) {
            this.movingObstacleTick++;
            if (this.movingObstacleTick >= 12) {
                if (this.flashingObstacleIdx === -1) this.flashingObstacleIdx = Math.floor(Math.random() * this.obstacles.length);
            }
            if (this.movingObstacleTick >= 15) {
                this.moveOneObstacle();
                this.flashingObstacleIdx = -1;
                this.movingObstacleTick = 0;
            }
        }

        this.aiLogic.updateAIOpponentMoveTimer();
        this.moveSnake();

        if (!this.gameOver) {
            this.checkCollision();
            this.renderer.drawObstacles(this.obstacles, this.currentModeIdx, this.flashToggle, this.flashingObstacleIdx);
            this.renderer.drawGhostTrails(this.ghostTrails, this.currentModeIdx, this.flashToggle);
            if (this.aiOpponent && this.currentModeIdx === 5) {
                this.renderer.drawAIOpponent(this.aiOpponent.snake);
            }
            this.renderer.drawFood(this.food, this.foodType, this.flashToggle);
            this.renderer.drawGift(this.gift, this.flashToggle);
            this.renderer.drawSnake(this.snake, this.rainbowHue, this.shieldActive);
            this.renderer.drawFloatingScores(this.floatingScores);
            if (this.currentModeIdx === 8) this.renderer.drawCoins(this.specialModes.coins);
            if (this.currentModeIdx === 9) this.renderer.drawPortals(this.specialModes.portals);
            this.particleSystem.update();
            this.particleSystem.draw(this.ctx);

            if (this.currentModeIdx === 6 && this.timeRemaining <= 10 && this.timeRemaining > 0 && this.timeWarningFlash) {
                this.ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    updateMiniDisplay() {
        this.screenEffects.updateMiniDisplay();
    }
}
