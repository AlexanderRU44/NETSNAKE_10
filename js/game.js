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
import { Currency } from './currency.js';
import { ShopDrawer } from './shopDrawer.js';
import { SHOP_ITEMS } from './shop.js';
import {
    audioCtx, initAudio, triggerVibration, playSound, snakeColors, speeds,
    maxBigFoodTime, maxShrinkTime, maxTurboTime, addFloatingScore,
    startBackgroundMusic, stopBackgroundMusic
} from './utils.js';

// === НАСТРОЙКИ РУБИНОВ ===
const RUBY_SPAWN_INTERVAL_MIN = 8000;   // минимум мс между появлениями
const RUBY_SPAWN_INTERVAL_MAX = 15000;  // максимум мс
const RUBY_LIFETIME = 10000;            // 10 секунд на поле
const RUBY_VALUE = 3;                   // сколько рубинов даёт один кристалл
const RUBY_LUCK_CHANCE = 0.5;           // шанс спавна с перком "удача"

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
        // FIX: скин по умолчанию — только если куплен. Иначе classic (0).
        const savedColorIdx = parseInt(localStorage.getItem("snake_color_idx") || "0");
        const ownedSkin = this.currencyHasSkin(savedColorIdx);
        this.currentSnakeColorIdx = ownedSkin ? savedColorIdx : 0;
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

        // === МАГАЗИН ===
        this.currency = new Currency(this);
        this.shopDrawer = new ShopDrawer(this.ctx, this);
        this.shopSelection = 0;
        this.shopScrollY = 0;

        // === РУБИНЫ НА ПОЛЕ ===
        this.rubies = [];               // [{x, y, ttl}] — ttl в мс
        this.rubySpawnTimer = 0;        // мс до следующего спавна
        this.rubySpawnInterval = 0;     // текущий интервал

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

    // Проверка, куплен ли скин (соответствует colorIdx)
    currencyHasSkin(colorIdx) {
        if (colorIdx === 0) return true; // CLASSIC всегда открыт
        const skinId = `skin_${['classic','green','blue','ruby','rainbow'][colorIdx]}`;
        // fallback на случай, если currency ещё не создан
        const purchases = JSON.parse(localStorage.getItem('snake_purchases') || '{}');
        return !!purchases[skinId];
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

        if (this.currentModeIdx === 5) {
            modeTag = ` [${t.gameModes[5]}] ${this.score}:${this.aiOpponentScore}`;
        } else if (this.currentModeIdx === 6) {
            const mins = Math.floor(this.timeRemaining / 60);
            const secs = this.timeRemaining % 60;
            modeTag = ` [${t.gameModes[6]}] ${mins}:${secs.toString().padStart(2, '0')}`;
        } else if (this.currentModeIdx === 7) {
            modeTag = ` [${t.gameModes[7]}]`;
        } else if (this.currentScreen !== "MAIN") {
            modeTag = ` [${t.gameModes[this.currentModeIdx]}]`;
        }

        let shieldTag = this.shieldActive ? " [SHIELD]" : "";
        // FIX: убрали кристаллы из HUD

        this.scoreElement.innerText = `${t.score}:${this.score}${aiTag}${modeTag}${shieldTag}`;

        if (this.bestPlayerName === "---") {
            this.hiScoreElement.innerText = `${t.hi}: ${t.loading}`;
        } else {
            this.hiScoreElement.innerText = `${t.hi}:${this.hiScore} ${t.bestBy} ${this.bestPlayerName}`;
        }
    }

    generateFood() {
        this.foodLogic.generateFood();
    }

    checkCollision() {
        this.collisionChecker.checkCollision();
    }

    // === СПАВН РУБИНОВ ===
    scheduleNextRubySpawn() {
        // Базовая задержка + перк "удача" уменьшает её вдвое
        let minInterval = RUBY_SPAWN_INTERVAL_MIN;
        let maxInterval = RUBY_SPAWN_INTERVAL_MAX;
        if (this.currency.has('perk_luck')) {
            minInterval *= 0.5;
            maxInterval *= 0.5;
        }
        this.rubySpawnInterval = minInterval + Math.random() * (maxInterval - minInterval);
        this.rubySpawnTimer = 0;
    }

    trySpawnRuby() {
        // Ограничение: не более 3 рубинов одновременно
        if (this.rubies.length >= 3) return;

        // Ищем свободную клетку
        let attempts = 0;
        while (attempts < 50) {
            const x = Math.floor(Math.random() * this.tileCount);
            const y = Math.floor(Math.random() * this.tileCount);

            const occupied =
                this.snake.some(p => p.x === x && p.y === y) ||
                (this.food && this.food.x === x && this.food.y === y) ||
                (this.gift && this.gift.x === x && this.gift.y === y) ||
                this.obstacles.some(o => o.x === x && o.y === y) ||
                this.ghostTrails.some(g => g.x === x && g.y === y) ||
                this.rubies.some(r => r.x === x && r.y === y) ||
                (this.aiOpponent && this.aiOpponent.snake && this.aiOpponent.snake.some(p => p.x === x && p.y === y));

            if (!occupied) {
                this.rubies.push({ x, y, ttl: RUBY_LIFETIME });
                // Партиклы при появлении
                if (this.particleSystem) {
                    this.particleSystem.addExplosion(x, y, "#ff2d55", 6);
                }
                return;
            }
            attempts++;
        }
    }

    updateRubies(deltaMs) {
        // Тик таймера спавна
        this.rubySpawnTimer += deltaMs;
        if (this.rubySpawnTimer >= this.rubySpawnInterval) {
            this.trySpawnRuby();
            this.scheduleNextRubySpawn();
        }

        // Обновляем TTL существующих
        for (let i = this.rubies.length - 1; i >= 0; i--) {
            this.rubies[i].ttl -= deltaMs;
            if (this.rubies[i].ttl <= 0) {
                // Партиклы при исчезновении
                if (this.particleSystem) {
                    this.particleSystem.addExplosion(this.rubies[i].x, this.rubies[i].y, "#8b0000", 4);
                }
                this.rubies.splice(i, 1);
            }
        }
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

        // FIX: убрали автоматическое начисление рубинов за очки
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

        this.foodLogic.resetShield();

        if (this.specialModes) {
            this.specialModes.portalMoveTimer = 0;
        }

        if (this.gameMechanics) {
            this.gameMechanics.timeAccumulator = 0;
        }

        // FIX: сброс рубинов
        this.rubies = [];
        this.scheduleNextRubySpawn();

        this.specialModes.reset();

        this.screenEffects.generateNextFoodType();
        if (this.currentModeIdx !== 8) {
            this.generateFood();
        } else {
            this.food = null;
        }
        this.generateObstacles();
        if (this.currentModeIdx === 5) {
            this.aiLogic.initAIOpponent();
        } else {
            this.aiOpponent = null;
            this.aiOpponentScore = 0;
        }

        if (this.currency) {
            if (this.currency.activeBonuses['boost_start']) {
                for (let i = 0; i < 5; i++) {
                    this.snake.push({ x: 8 - i, y: 10 });
                }
                delete this.currency.activeBonuses['boost_start'];
            }
            if (this.currency.activeBonuses['boost_shield']) {
                this.shieldActive = true;
                delete this.currency.activeBonuses['boost_shield'];
            }
            if (this.currency.activeBonuses['boost_gift']) {
                this.gift = { x: 15, y: 15 };
                delete this.currency.activeBonuses['boost_gift'];
            }
            if (this.currency.activeBonuses['boost_double']) {
                this.doubleScoreActive = true;
                delete this.currency.activeBonuses['boost_double'];
            }
            this.currency.save();
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

    handleMenuPress() {
        initAudio();
        if (this.currentScreen !== "EDIT_NAME" && this.currentScreen !== "INTRO") {
            if (!this.isPaused) this.isPaused = true;
            this.currentScreen = "MAIN";
        }
    }

    handleBackPress() {
        initAudio();
        if (this.currentScreen !== "EDIT_NAME" && this.currentScreen !== "INTRO") {
            if (["SETTINGS", "LEADERBOARD", "TASKS", "ACHIEVEMENTS", "MODES", "ABOUT", "MODE_INFO", "SHOP"].includes(this.currentScreen)) {
                this.currentScreen = "MAIN";
            }
        }
    }

    async handleCenter() {
        await this.stateHandler.handleCenter();
    }

    handleInput(act) {
        if (this.currentScreen === "EDIT_NAME" || this.currentScreen === "INTRO") return;

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
                    if (targetY < this.modesScrollY) this.modesScrollY = targetY;
                    else if (targetY > this.modesScrollY + visibleHeight - itemHeight) this.modesScrollY = targetY - (visibleHeight - itemHeight);
                    this.modesScrollY = Math.max(0, Math.min(this.modesScrollY, maxScroll));
                }
                else if (act === "DOWN") {
                    this.modesMenuSelection = (this.modesMenuSelection >= maxMode) ? 0 : this.modesMenuSelection + 1;
                    let targetY = this.modesMenuSelection * itemHeight;
                    if (targetY < this.modesScrollY) this.modesScrollY = targetY;
                    else if (targetY > this.modesScrollY + visibleHeight - itemHeight) this.modesScrollY = targetY - (visibleHeight - itemHeight);
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
            else if (this.currentScreen === "SHOP") {
                const itemHeight = 52;
                const visibleHeight = 260;
                const totalHeight = SHOP_ITEMS.length * itemHeight;
                const maxScroll = Math.max(0, totalHeight - visibleHeight);
                if (act === "UP") {
                    this.shopSelection = (this.shopSelection <= 0) ? SHOP_ITEMS.length - 1 : this.shopSelection - 1;
                    let targetY = this.shopSelection * itemHeight;
                    if (targetY < this.shopScrollY) this.shopScrollY = targetY;
                    else if (targetY > this.shopScrollY + visibleHeight - itemHeight) this.shopScrollY = targetY - (visibleHeight - itemHeight);
                    this.shopScrollY = Math.max(0, Math.min(this.shopScrollY, maxScroll));
                }
                if (act === "DOWN") {
                    this.shopSelection = (this.shopSelection >= SHOP_ITEMS.length - 1) ? 0 : this.shopSelection + 1;
                    let targetY = this.shopSelection * itemHeight;
                    if (targetY < this.shopScrollY) this.shopScrollY = targetY;
                    else if (targetY > this.shopScrollY + visibleHeight - itemHeight) this.shopScrollY = targetY - (visibleHeight - itemHeight);
                    this.shopScrollY = Math.max(0, Math.min(this.shopScrollY, maxScroll));
                }
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

        if (this.isPaused) {
            this.timerContainer.style.visibility = "hidden";
            this.renderer.drawObstacles(this.obstacles, this.currentModeIdx, this.flashToggle, this.flashingObstacleIdx);
            this.renderer.drawGhostTrails(this.ghostTrails, this.currentModeIdx, this.flashToggle);
            this.renderer.drawSnake(this.snake, this.rainbowHue, this.shieldActive);
            if (this.aiOpponent && this.currentModeIdx === 5) {
                this.renderer.drawAIOpponent(this.aiOpponent.snake);
            }
            if (this.currentModeIdx !== 8 && this.food) {
                this.renderer.drawFood(this.food, this.foodType, this.flashToggle);
            }
            this.renderer.drawGift(this.gift, this.flashToggle);
            // FIX: рисуем рубины и в паузе
            if (this.renderer.drawRubies) this.renderer.drawRubies(this.rubies, this.flashToggle);
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
            else if (this.currentScreen === "SHOP") this.shopDrawer.draw();
            return;
        }

        this.updateTimeMode();
        this.moveFoodInRushMode();

        // FIX: тик рубинов
        const tickMs = this.isTurboActive ? this.speeds[2] : this.speeds[this.currentSpeedMode];
        this.updateRubies(tickMs);

        if (this.currentModeIdx !== 8) {
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
        } else {
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

        if (this.currentModeIdx === 9) {
            const tickSpeed = this.isTurboActive ? this.speeds[2] : this.speeds[this.currentSpeedMode];
            this.specialModes.updatePortals(tickSpeed);
        }

        if (!this.gameOver) {
            this.checkCollision();
            this.renderer.drawObstacles(this.obstacles, this.currentModeIdx, this.flashToggle, this.flashingObstacleIdx);
            this.renderer.drawGhostTrails(this.ghostTrails, this.currentModeIdx, this.flashToggle);
            if (this.aiOpponent && this.currentModeIdx === 5) {
                this.renderer.drawAIOpponent(this.aiOpponent.snake);
            }
            if (this.currentModeIdx !== 8 && this.food) {
                this.renderer.drawFood(this.food, this.foodType, this.flashToggle);
            }
            this.renderer.drawGift(this.gift, this.flashToggle);
            // FIX: рисуем рубины
            if (this.renderer.drawRubies) this.renderer.drawRubies(this.rubies, this.flashToggle);
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

    loadBestSingleScore() {
        this.leaderboard.loadBestSingleScore();
    }
}
