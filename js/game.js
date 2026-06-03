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

        this.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
        this.aiOpponent = null;
        this.aiOpponentScore = 0;
        this.food = { x: 15, y: 10 };
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

        // Мультиплеер
        this.isMultiplayer = false;
        this.multiplayerLocalNumber = 1;
        this.multiplayerManager = null;
        this.opponentSnake = [];
        this.opponentScore = 0;
        this.opponentReady = false;
        this.multiplayerMenuSelection = 0;
        this.multiplayerResult = null;
        // Интерполяция для плавного движения оппонента
        this.opponentTargetSnake = [];
        this.opponentMoveInterp = 0;
        this.lastOpponentUpdate = 0;
        this.lastFrameTime = 0;

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

        if (this.isMultiplayer) {
            modeTag = ` [MP] ${this.score}:${this.opponentScore}`;
        } else if (this.currentModeIdx === 5) {
            modeTag = ` [${t.gameModes[5]}] ${this.score}:${this.aiOpponentScore}`;
        } else if (this.currentModeIdx === 6) {
            const mins = Math.floor(this.timeRemaining / 60);
            const secs = this.timeRemaining % 60;
            modeTag = ` [${t.gameModes[6]}] ${mins}:${secs.toString().padStart(2, '0')}`;
        } else if (this.currentModeIdx === 7) {
            modeTag = ` [${t.gameModes[7]}]`;
        } else if (this.currentScreen !== "MULTIPLAYER_RESULT" && this.currentScreen !== "WAITING_MP") {
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

    generateFood() {
        if (this.isMultiplayer) {
            // В мультиплеере генерируем еду в случайном месте, не занятом змейками
            let maxAttempts = 100;
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const x = Math.floor(Math.random() * this.tileCount);
                const y = Math.floor(Math.random() * this.tileCount);
                let occupied = this.snake.some(seg => seg.x === x && seg.y === y);
                occupied = occupied || this.opponentSnake.some(seg => seg.x === x && seg.y === y);
                if (!occupied) {
                    this.food = { x, y };
                    return;
                }
            }
        } else {
            this.foodLogic.generateFood();
        }
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
        
        if (this.isMultiplayer && this.multiplayerManager) {
            const winner = this.score > this.opponentScore ? 
                (this.multiplayerLocalNumber === 1 ? 'player1' : 'player2') :
                (this.opponentScore > this.score ? 
                    (this.multiplayerLocalNumber === 1 ? 'player2' : 'player1') : 'draw');
            this.multiplayerManager.sendGameOver(winner);
        }
        
        if (!this.isMultiplayer) {
            this.currentScreen = "MAIN";
        } else {
            this.currentScreen = "MULTIPLAYER_RESULT";
            this.multiplayerResult = (this.score > this.opponentScore) ? 'win' : 'lose';
        }
        
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
        if (!this.isMultiplayer) {
            this.sendScoreToFirebase(this.score);
        }
    }
    
    reset() {
        this.gift = null;
        this.goldFoodEaten = false;
        this.blueFoodEaten = false;
        this.isTurboActive = false;
        this.turboRemainingTime = 0;
        this.bonusTimer = 0;
        this.snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
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
        
        if (this.gameMechanics) {
            this.gameMechanics.timeAccumulator = 0;
        }

        this.specialModes.reset();

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

    resetMultiplayer() {
        this.gift = null;
        this.goldFoodEaten = false;
        this.blueFoodEaten = false;
        this.isTurboActive = false;
        this.turboRemainingTime = 0;
        this.bonusTimer = 0;
        
        // Стартовая позиция игрока (слева)
        this.snake = [
            { x: 5, y: 10 },
            { x: 4, y: 10 },
            { x: 3, y: 10 }
        ];
        
        // Сброс оппонента
        this.opponentSnake = [];
        this.opponentTargetSnake = [];
        this.opponentMoveInterp = 0;
        this.lastOpponentUpdate = 0;
        this.opponentScore = 0;
        this.opponentReady = false;
        
        this.ghostTrails = [];
        this.floatingScores = [];
        this.dx = 1;
        this.dy = 0;
        this.nextDx = 1;
        this.nextDy = 0;
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.foodType = "REGULAR";
        this.timerContainer.style.visibility = "hidden";
        this.regularApplesStreak = 0;
        this.victoryFlag = false;
        this.shieldActive = false;
        
        // Генерация еды
        let validPosition = false;
        let attempts = 0;
        while (!validPosition && attempts < 100) {
            const x = Math.floor(Math.random() * this.tileCount);
            const y = Math.floor(Math.random() * this.tileCount);
            let occupied = this.snake.some(seg => seg.x === x && seg.y === y);
            if (!occupied) {
                this.food = { x, y };
                validPosition = true;
            }
            attempts++;
        }
        
        this.updateHUD();
        this.updateTicker();
    }

    updateOpponent(state) {
        // Получаем данные оппонента
        if (state.snake && Array.isArray(state.snake) && state.snake.length > 0) {
            // Сохраняем текущую позицию как начальную для интерполяции
            if (this.opponentSnake.length === 0) {
                this.opponentSnake = JSON.parse(JSON.stringify(state.snake));
                this.opponentTargetSnake = JSON.parse(JSON.stringify(state.snake));
            } else {
                this.opponentSnake = JSON.parse(JSON.stringify(this.opponentSnake));
                this.opponentTargetSnake = JSON.parse(JSON.stringify(state.snake));
                this.opponentMoveInterp = 0;
                this.lastOpponentUpdate = performance.now();
            }
        }
        if (state.score !== undefined) {
            this.opponentScore = state.score;
            this.updateHUD();
        }
        if (state.alive === false && !this.gameOver) {
            this.endGame();
        }
        
        // Отладочный вывод
        console.log("Opponent update:", { 
            snakeLength: state.snake?.length, 
            score: state.score, 
            alive: state.alive 
        });
    }

    updateOpponentMovement() {
        if (!this.isMultiplayer || this.opponentTargetSnake.length === 0) {
            return;
        }
        
        const now = performance.now();
        if (this.lastOpponentUpdate === 0) {
            this.lastOpponentUpdate = now;
            return;
        }
        
        // Интерполяция за 100мс
        const interpDuration = 100;
        let delta = (now - this.lastOpponentUpdate) / interpDuration;
        
        if (delta >= 1) {
            // Достигли цели
            this.opponentSnake = JSON.parse(JSON.stringify(this.opponentTargetSnake));
        } else if (delta > 0) {
            // Плавная интерполяция
            const newSnake = [];
            const maxLen = Math.max(this.opponentSnake.length, this.opponentTargetSnake.length);
            
            for (let i = 0; i < maxLen; i++) {
                const from = this.opponentSnake[i];
                const to = this.opponentTargetSnake[i];
                
                if (from && to) {
                    newSnake.push({
                        x: from.x + (to.x - from.x) * delta,
                        y: from.y + (to.y - from.y) * delta
                    });
                } else if (to) {
                    newSnake.push({ x: to.x, y: to.y });
                } else if (from) {
                    newSnake.push({ x: from.x, y: from.y });
                }
            }
            this.opponentSnake = newSnake;
        }
    }

    onOpponentReady(ready) {
        this.opponentReady = ready;
        console.log("Opponent ready changed:", ready);
    }

    onMultiplayerGameOver(isWinner) {
        this.gameOver = true;
        this.isPaused = true;
        this.isTurboActive = false;
        this.currentScreen = "MULTIPLAYER_RESULT";
        this.multiplayerResult = isWinner ? 'win' : 'lose';
        this.updateHUD();
    }

    onMultiplayerFinished(winner) {
        const isWinner = (winner === 'player1' && this.multiplayerLocalNumber === 1) ||
                        (winner === 'player2' && this.multiplayerLocalNumber === 2);
        this.onMultiplayerGameOver(isWinner);
    }

    onRoomClosed() {
        this.currentScreen = "MAIN";
        if (this.multiplayerManager) {
            this.multiplayerManager.cleanup();
        }
        this.isMultiplayer = false;
        this.updateHUD();
    }

    async sendMultiplayerState() {
        if (!this.isMultiplayer || !this.multiplayerManager || this.gameOver) return;
        
        const state = {
            snake: this.snake,
            score: this.score,
            alive: !this.gameOver
        };
        
        await this.multiplayerManager.sendGameState(state);
    }

    handleMenuPress() {
        initAudio();
        if (this.currentScreen !== "EDIT_NAME" && this.currentScreen !== "INTRO") {
            if (!this.isPaused && !this.isMultiplayer) {
                this.isPaused = true;
            }
            if (this.currentScreen === "MULTIPLAYER_RESULT") {
                if (this.multiplayerManager) {
                    this.multiplayerManager.cleanup();
                }
                this.isMultiplayer = false;
            }
            if (this.currentScreen !== "WAITING_MP" && this.currentScreen !== "GAME_MP") {
                this.currentScreen = "MAIN";
            }
        }
    }

    handleBackPress() {
        initAudio();
        if (this.currentScreen !== "EDIT_NAME" && this.currentScreen !== "INTRO") {
            if (["SETTINGS", "LEADERBOARD", "TASKS", "ACHIEVEMENTS", "MODES", "ABOUT", "MODE_INFO", "MULTIPLAYER_MENU"].includes(this.currentScreen)) {
                this.currentScreen = "MAIN";
            }
            if ((this.currentScreen === "WAITING_MP" || this.currentScreen === "GAME_MP") && this.multiplayerManager) {
                this.multiplayerManager.leaveRoom();
                this.isMultiplayer = false;
                this.currentScreen = "MAIN";
            }
        }
    }

    async handleCenter() {
        await this.stateHandler.handleCenter();
    }

    handleInput(act) {
        if (this.currentScreen === "EDIT_NAME" || this.currentScreen === "INTRO") return;
        
        // Мультиплеерное управление
        if (this.isMultiplayer && !this.isPaused && !this.gameOver && this.currentScreen === "GAME_MP") {
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
            return;
        }
        
        if (this.currentScreen === "MULTIPLAYER_MENU") {
            const max = 2;
            if (act === "UP") this.multiplayerMenuSelection = (this.multiplayerMenuSelection <= 0) ? max : this.multiplayerMenuSelection - 1;
            if (act === "DOWN") this.multiplayerMenuSelection = (this.multiplayerMenuSelection >= max) ? 0 : this.multiplayerMenuSelection + 1;
            return;
        }
        
        if (this.currentScreen === "WAITING_MP") {
            if (act === "CENTER" && this.multiplayerManager) {
                this.multiplayerManager.sendReady();
            }
            return;
        }
        
        if (this.currentScreen === "MULTIPLAYER_RESULT") {
            if (act === "CENTER" || act === "MENU") {
                if (this.multiplayerManager) {
                    this.multiplayerManager.cleanup();
                }
                this.isMultiplayer = false;
                this.currentScreen = "MAIN";
            }
            return;
        }
        
        initAudio();
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

        if (this.isPaused && !this.isMultiplayer) {
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
            else if (this.currentScreen === "MULTIPLAYER_MENU") this.menuDrawer.drawMultiplayerMenu();
            else if (this.currentScreen === "WAITING_MP") this.menuDrawer.drawWaitingScreen();
            else if (this.currentScreen === "MULTIPLAYER_RESULT") this.menuDrawer.drawMultiplayerResult();
            return;
        }

        if (!this.isMultiplayer) {
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
        } else if (this.isMultiplayer && this.currentScreen === "GAME_MP") {
            // Обновляем движение оппонента с интерполяцией
            this.updateOpponentMovement();
            
            // Мультиплеерный геймплей
            if (!this.gameOver && !this.isPaused) {
                this.dx = this.nextDx;
                this.dy = this.nextDy;
                this.isTurningThisTick = false;
                
                // Двигаем голову
                let head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
                
                // Телепортация через стены
                head.x = (head.x + this.tileCount) % this.tileCount;
                head.y = (head.y + this.tileCount) % this.tileCount;
                
                this.snake.unshift(head);
                
                // Проверяем еду
                if (head.x === this.food.x && head.y === this.food.y) {
                    playSound("eat", this.soundEnabled);
                    this.score++;
                    this.updateHUD();
                    this.generateFood();
                    this.particleSystem.addExplosion(head.x, head.y, "#ff4d4d", 6);
                    addFloatingScore(this.floatingScores, head.x, head.y, "+1", this.currentLang);
                } else {
                    this.snake.pop();
                }
                
                // Проверка столкновения с собой
                for (let i = 1; i < this.snake.length; i++) {
                    if (Math.floor(this.snake[i].x) === Math.floor(head.x) && 
                        Math.floor(this.snake[i].y) === Math.floor(head.y)) {
                        this.endGame();
                        break;
                    }
                }
                
                // Проверка столкновения с оппонентом
                for (let i = 0; i < this.opponentSnake.length; i++) {
                    const seg = this.opponentSnake[i];
                    if (Math.floor(seg.x) === Math.floor(head.x) && 
                        Math.floor(seg.y) === Math.floor(head.y)) {
                        this.endGame();
                        break;
                    }
                }
                
                // Отправляем состояние оппоненту
                this.sendMultiplayerState();
            }
            
            // Отрисовка
            this.renderer.drawFood(this.food, this.foodType, this.flashToggle);
            this.renderer.drawSnake(this.snake, this.rainbowHue, this.shieldActive);
            this.renderer.drawOpponentSnake(this.opponentSnake);
            this.renderer.drawFloatingScores(this.floatingScores);
            this.particleSystem.update();
            this.particleSystem.draw(this.ctx);
            
            // Отображаем счёт на экране
            this.ctx.fillStyle = this.isDarkTheme ? "#ffffff" : "#2b3a4a";
            this.ctx.font = "12px 'Press Start 2P'";
            this.ctx.textAlign = "center";
            this.ctx.fillText(`${this.score} : ${this.opponentScore}`, 200, 30);
        }
    }

    updateMiniDisplay() {
        this.screenEffects.updateMiniDisplay();
    }
}