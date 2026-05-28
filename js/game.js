import { db, collection, addDoc, query, orderBy, limit, getDocs, where } from './firebase-config.js';
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
import { 
    audioCtx, musicNode, initAudio, startBackgroundMusic, stopBackgroundMusic, 
    updateMusicVolume, triggerVibration, playSound, snakeColors, speeds, 
    maxBigFoodTime, maxShrinkTime, maxTurboTime, addFloatingScore 
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

        // Game state
        this.snake = [{x: 10, y: 10}];
        this.aiOpponent = null;
        this.aiOpponentScore = 0;
        this.food = {x: 5, y: 5};
        this.gift = null;
        this.foodType = "REGULAR";
        this.flashToggle = true;
        this.flashCounter = 0;
        this.bonusTimer = 0;
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
        this.gameInterval = null;
        this.globalTopTen = [];
        this.isLoadingLeaderboard = false;
        this.externalAboutData = { RU: [], EN: [] };

        // New mode variables
        this.timeRemaining = 60;
        this.timeModeActive = false;
        this.foodMoveTimer = 0;
        this.foodMoveInterval = 3000;
        this.aiOpponentMoveTimer = 0;
        this.aiOpponentMoveDelay = 200;
        this.timeWarningFlash = false;
        this.lastTimeUpdate = 0;

        // Touch control variables
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isTouchMoving = false;
        this.swipeThreshold = 20;

        // Optimization variables
        this._rafId = null;
        this._lastFrameTime = 0;
        this._directionsCache = [
            { x: 0, y: -1, name: "UP" },
            { x: 0, y: 1, name: "DOWN" },
            { x: -1, y: 0, name: "LEFT" },
            { x: 1, y: 0, name: "RIGHT" }
        ];

        // Modules
        this.introScreen = new IntroScreen();
        
        this.isDarkTheme = this.getEffectiveTheme();
        
        this.renderer = new Renderer(
            this.ctx, this.canvas, this.tileCount, this.isDarkTheme, 
            snakeColors, () => this.currentSnakeColorIdx, () => this.rainbowHue
        );
        
        this.menuDrawer = new MenuDrawer(this.ctx, this);
        this.collisionChecker = new CollisionChecker(this);
        this.foodLogic = new FoodLogic(this);
        this.aiLogic = new AILogic(this);
        this.stateHandler = new GameStateHandler(this);
        this.aboutLogic = new AboutLogic(this);
        
        // Загружаем текст "О ИГРЕ" синхронно
        this.aboutLogic.loadAboutText();

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.animationLoop = this.animationLoop.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
        this.handleCanvasClick = this.handleCanvasClick.bind(this);

        this.initTouchControls();
        this.applyTheme();
        this.initThemeListener();
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
                }
            });
        }
    }

    initTouchControls() {
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
        this.canvas.addEventListener('click', this.handleCanvasClick);
    }

    handleCanvasClick(e) {
        if (this.currentScreen === "ABOUT") {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const mouseX = (e.clientX - rect.left) * scaleX;
            const mouseY = (e.clientY - rect.top) * scaleY;
            this.menuDrawer.checkGithubClick(mouseX, mouseY);
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.touchStartX = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
        this.touchStartY = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
        this.touchStartTime = Date.now();
        this.isTouchMoving = false;
    }

    handleTouchMove(e) {
        e.preventDefault();
        this.isTouchMoving = true;
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.isTouchMoving && (Date.now() - this.touchStartTime) < 200) {
            if (this.currentScreen === "ABOUT") {
                if (this.menuDrawer.checkGithubClick(this.touchStartX, this.touchStartY)) {
                    return;
                }
            }
            this.handleTap();
            return;
        }
        if (this.isTouchMoving) {
            const rect = this.canvas.getBoundingClientRect();
            let endX = this.touchStartX;
            let endY = this.touchStartY;
            if (e.changedTouches.length > 0) {
                endX = (e.changedTouches[0].clientX - rect.left) * (this.canvas.width / rect.width);
                endY = (e.changedTouches[0].clientY - rect.top) * (this.canvas.height / rect.height);
            }
            const deltaX = endX - this.touchStartX;
            const deltaY = endY - this.touchStartY;
            if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
                this.handleSwipe(deltaX, deltaY);
            }
        }
        this.isTouchMoving = false;
    }

    handleTap() {
        triggerVibration();
        if (this.currentScreen === "INTRO") {
            this.handleCenter();
            return;
        }
        if (this.currentScreen === "EDIT_NAME") return;

        if (this.isPaused || this.currentScreen !== "GAME") {
            this.handleCenter();
        }
    }

    handleSwipe(deltaX, deltaY) {
        triggerVibration();
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        let direction = null;
        if (absX > absY) {
            direction = deltaX > 0 ? "RIGHT" : "LEFT";
        } else {
            direction = deltaY > 0 ? "DOWN" : "UP";
        }

        if (!this.isPaused && !this.gameOver && this.currentScreen !== "INTRO" && this.currentScreen !== "EDIT_NAME") {
            this.handleInput(direction);
        } 
        else if (this.isPaused || (this.currentScreen !== "GAME" && this.currentScreen !== "INTRO" && this.currentScreen !== "EDIT_NAME")) {
            if (direction === "UP") {
                this.handleInput("UP");
            } else if (direction === "DOWN") {
                this.handleInput("DOWN");
            }
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
    }

    updateHUD() {
        const t = i18n[this.currentLang];
        const aiTag = this.aiMode ? " *AI*" : "";
        let modeTag = "";
        
        if (this.currentModeIdx === 5) {
            modeTag = ` [${t.gameModes[5]}] ${this.score}:${this.aiOpponentScore}`;
        } else if (this.currentModeIdx === 6) {
            const mins = Math.floor(this.timeRemaining / 60);
            const secs = this.timeRemaining % 60;
            modeTag = ` [${t.gameModes[6]}] ${mins}:${secs.toString().padStart(2, '0')}`;
        } else if (this.currentModeIdx === 7) {
            const mins = Math.floor(this.timeRemaining / 60);
            const secs = this.timeRemaining % 60;
            modeTag = ` [${t.gameModes[7]}] ${mins}:${secs.toString().padStart(2, '0')}`;
        } else {
            modeTag = ` [${t.gameModes[this.currentModeIdx]}]`;
        }
        
        this.scoreElement.innerText = `${t.score}:${this.score}${aiTag}${modeTag}`;
        
        if (this.bestPlayerName === "---") {
            this.hiScoreElement.innerText = `${t.hi}: ${t.loading}`;
        } else {
            this.hiScoreElement.innerText = `${t.hi}:${this.hiScore} ${t.bestBy} ${this.bestPlayerName}`;
        }
    }

    updateTicker() {
        if (this.gameInterval) {
            if (this._rafId) cancelAnimationFrame(this._rafId);
            clearInterval(this.gameInterval);
        }
        
        this._lastFrameTime = 0;
        this._rafId = requestAnimationFrame(this.animationLoop);
    }
    
    animationLoop(now) {
        if (!this._lastFrameTime) {
            this._lastFrameTime = now;
            this._rafId = requestAnimationFrame(this.animationLoop);
            return;
        }
        
        let activeSpeed = this.isTurboActive ? speeds[2] : speeds[this.currentSpeedMode];
        let tickSpeed = (this.currentScreen === "INTRO") ? 33 : activeSpeed;
        
        if (now - this._lastFrameTime >= tickSpeed) {
            this.gameLoop();
            this._lastFrameTime = now;
        }
        
        this._rafId = requestAnimationFrame(this.animationLoop);
    }

    generateObstacles() {
        this.obstacles = [];
        this.flashingObstacleIdx = -1;
        
        if (this.currentModeIdx !== 2 && this.currentModeIdx !== 4) return;
        
        while (this.obstacles.length < 8) {
            let obsX = Math.floor(Math.random() * this.tileCount);
            let obsY = Math.floor(Math.random() * this.tileCount);
            
            let distance = Math.abs(obsX - this.snake[0].x) + Math.abs(obsY - this.snake[0].y);
            let isOnFood = (this.food && obsX === this.food.x && obsY === this.food.y);
            let isOnSnake = this.snake.some(part => part.x === obsX && part.y === obsY);
            let isDuplicate = this.obstacles.some(o => o.x === obsX && o.y === obsY);
            
            if (distance > 3 && !isOnFood && !isOnSnake && !isDuplicate) {
                this.obstacles.push({x: obsX, y: obsY});
            }
        }
    }

    moveOneObstacle() {
        if (this.obstacles.length === 0) return;
        let idx = Math.floor(Math.random() * this.obstacles.length);
        let validPositions = [];
        for (let x = 0; x < this.tileCount; x++) {
            for (let y = 0; y < this.tileCount; y++) {
                let isOccupied = this.snake.some(part => part.x === x && part.y === y) || 
                                 this.obstacles.some(o => o.x === x && o.y === y) ||
                                 this.ghostTrails.some(g => g.x === x && g.y === y) ||
                                 (this.food.x === x && this.food.y === y) || 
                                 (this.gift && this.gift.x === x && this.gift.y === y) ||
                                 (this.aiOpponent && this.aiOpponent.snake && this.aiOpponent.snake.some(part => part.x === x && part.y === y));
                if (!isOccupied && (Math.abs(x - this.snake[0].x) + Math.abs(y - this.snake[0].y) > 2)) {
                    validPositions.push({x, y});
                }
            }
        }
        if (validPositions.length > 0) {
            this.obstacles[idx] = validPositions[Math.floor(Math.random() * validPositions.length)];
        }
    }

    spawnGift() {
        let validPositions = [];
        for (let x = 0; x < this.tileCount; x++) {
            for (let y = 0; y < this.tileCount; y++) {
                let isOccupied = this.snake.some(part => part.x === x && part.y === y) || 
                                 this.obstacles.some(o => o.x === x && o.y === y) ||
                                 this.ghostTrails.some(g => g.x === x && g.y === y) ||
                                 (this.food.x === x && this.food.y === y) || 
                                 (this.gift && this.gift.x === x && this.gift.y === y) ||
                                 (this.aiOpponent && this.aiOpponent.snake && this.aiOpponent.snake.some(part => part.x === x && part.y === y));
                if (!isOccupied) validPositions.push({x, y});
            }
        }
        if (validPositions.length > 0) {
            this.gift = validPositions[Math.floor(Math.random() * validPositions.length)];
        }
    }

    async sendScoreToFirebase(finalScore) {
        if (this.isGameSubmitting || finalScore <= 0) return;
        if (this.usedAIThisSession) return;
        this.isGameSubmitting = true;
        try {
            await addDoc(collection(db, "global_leaderboard"), {
                playerName: this.playerName,
                score: Number(finalScore),
                mode: Number(this.currentModeIdx),
                timestamp: new Date()
            });
            await this.loadBestSingleScore();
        } catch (e) { console.error(e); }
        finally { this.isGameSubmitting = false; }
    }

    async loadBestSingleScore() {
        this.hiScore = localStorage.getItem(`snake_hi_score_mode_${this.currentModeIdx}`) || 0;
        this.bestPlayerName = localStorage.getItem(`snake_best_player_mode_${this.currentModeIdx}`) || "---";
        this.updateHUD();
        try {
            const q = query(
                collection(db, "global_leaderboard"), 
                where("mode", "==", this.currentModeIdx),
                orderBy("score", "desc"), 
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const bestDoc = querySnapshot.docs[0].data();
                this.hiScore = bestDoc.score;
                this.bestPlayerName = bestDoc.playerName;
                localStorage.setItem(`snake_hi_score_mode_${this.currentModeIdx}`, this.hiScore);
                localStorage.setItem(`snake_best_player_mode_${this.currentModeIdx}`, this.bestPlayerName);
                this.updateHUD();
            }
        } catch (e) { console.error(e); }
    }

    async loadTopTen() {
        this.isLoadingLeaderboard = true;
        try {
            const q = query(
                collection(db, "global_leaderboard"), 
                where("mode", "==", this.currentModeIdx),
                orderBy("score", "desc"), 
                limit(10)
            );
            const querySnapshot = await getDocs(q);
            this.globalTopTen = [];
            querySnapshot.forEach((doc) => { this.globalTopTen.push(doc.data()); });
        } catch (e) { console.error(e); }
        this.isLoadingLeaderboard = false;
    }

    loadAboutText() {
        // Данные уже загружены в конструкторе через aboutLogic
    }

    reloadAboutText() {
        if (this.aboutLogic) {
            this.aboutLogic.loadAboutText();
        }
    }

    openNameInput() {
        const t = i18n[this.currentLang];
        this.overlayLabel.innerText = t.enterName;
        this.btnSaveName.innerText = t.saveBtn;
        this.nameInput.value = this.playerName;
        this.nameOverlay.style.display = "flex";
        this.currentScreen = "EDIT_NAME";
        setTimeout(() => this.nameInput.focus(), 50);
    }

    saveNameInput() {
        let val = this.nameInput.value.trim().toUpperCase();
        val = val.replace(/[^A-ZА-Я0-9_]/g, '');
        if (val === "") val = "PLAYER";
        this.playerName = val.substring(0, 8);
        localStorage.setItem("snake_player_name", this.playerName);
        this.nameOverlay.style.display = "none";
        this.currentScreen = "SETTINGS";
        this.updateHUD();
    }

    moveSnake() {
        let h = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        const bordersAreDeadly = (this.currentModeIdx === 1);
        if (!bordersAreDeadly || this.aiMode) {
            if (h.x < 0) h.x = this.tileCount - 1;
            if (h.x > this.tileCount - 1) h.x = 0;
            if (h.y < 0) h.y = this.tileCount - 1;
            if (h.y > this.tileCount - 1) h.y = 0;
        }
        if (this.currentModeIdx === 3 && this.snake.length > 0) {
            this.ghostTrails.push({ x: this.snake[this.snake.length - 1].x, y: this.snake[this.snake.length - 1].y, ttl: 25 });
        }
        
        for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
            this.ghostTrails[i].ttl--;
            if (this.ghostTrails[i].ttl <= 0) {
                this.ghostTrails.splice(i, 1);
            }
        }

        this.snake.unshift(h);
        
        if (this.gift && h.x === this.gift.x && h.y === this.gift.y) {
            playSound("giftEat", this.soundEnabled);
            this.score += 50;
            addFloatingScore(this.floatingScores, h.x, h.y, "+50");
            this.gift = null;
            checkScoreTasks(this.score, tasks, (id, tasksObj) => completeTask(id, tasksObj, (type) => playSound(type, this.soundEnabled), () => this.spawnGift()), (id, ach) => unlockAchievement(id, ach), achievements);
            this.updateHUD();
        }
        
        if (h.x === this.food.x && h.y === this.food.y) {
            let activeSpeed = this.isTurboActive ? speeds[2] : speeds[this.currentSpeedMode];
            this.foodLogic.processFoodEaten(h, activeSpeed);
        } else {
            this.snake.pop();
        }
    }

    generateFood() {
        this.foodLogic.generateFood();
    }

    moveFoodInRushMode() {
        if (this.currentModeIdx !== 7) return;
        
        this.foodMoveTimer -= this.isTurboActive ? speeds[2] : speeds[this.currentSpeedMode];
        
        if (this.foodMoveTimer <= 0) {
            playSound("foodMove", this.soundEnabled);
            
            let validPositions = [];
            for (let x = 0; x < this.tileCount; x++) {
                for (let y = 0; y < this.tileCount; y++) {
                    let isOccupied = this.snake.some(p => p.x === x && p.y === y) ||
                                     this.obstacles.some(o => o.x === x && o.y === y) ||
                                     this.ghostTrails.some(g => g.x === x && g.y === y) ||
                                     (this.gift && this.gift.x === x && this.gift.y === y) ||
                                     (this.aiOpponent && this.aiOpponent.snake && this.aiOpponent.snake.some(p => p.x === x && p.y === y));
                    if (!isOccupied) validPositions.push({x, y});
                }
            }
            
            if (validPositions.length > 0) {
                this.food = validPositions[Math.floor(Math.random() * validPositions.length)];
                addFloatingScore(this.floatingScores, this.food.x, this.food.y, "MOVED!");
            }
            
            this.foodMoveTimer = this.foodMoveInterval;
        }
    }

    updateTimeMode() {
        if (this.currentModeIdx !== 6 && this.currentModeIdx !== 7) return;
        
        const now = Date.now();
        if (!this.lastTimeUpdate) {
            this.lastTimeUpdate = now;
            return;
        }
        
        const delta = now - this.lastTimeUpdate;
        if (delta >= 1000) {
            this.timeRemaining -= Math.floor(delta / 1000);
            this.lastTimeUpdate = now;
            
            if (this.timeRemaining > 99) this.timeRemaining = 99;
            
            if (this.timeRemaining <= 0) {
                this.timeRemaining = 0;
                this.endGame();
            }
            
            if (this.timeRemaining <= 10 && this.timeRemaining > 0) {
                this.timeWarningFlash = !this.timeWarningFlash;
            }
            
            this.updateHUD();
        }
    }

    checkCollision() {
        this.collisionChecker.checkCollision();
    }

    endGame() {
        playSound("die", this.soundEnabled);
        this.gameOver = true;
        this.isPaused = true;
        this.isTurboActive = false;
        this.currentScreen = "MAIN";
        this.mainMenuSelection = 0;
        this.mainMenuScrollY = 0;
        this.timeModeActive = false;
        this.totalGamesPlayed++;
        localStorage.setItem("snake_total_games_played", this.totalGamesPlayed);
        if (this.totalGamesPlayed >= 5) {
            unlockAchievement("survivor", achievements);
        }
        if (this.currentSpeedMode === 2) {
            unlockAchievement("speedDemon", achievements);
        }
        updateMusicVolume(this.isPaused, this.soundEnabled);
        this.updateHUD();
        this.sendScoreToFirebase(this.score);
    }

    reset() {
        this.gift = null;
        this.goldFoodEaten = false;
        this.blueFoodEaten = false;
        this.isTurboActive = false;
        this.snake = [{x: 10, y: 10}];
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
        
        this.generateFood();
        this.generateObstacles();
        
        if (this.currentModeIdx === 5) {
            this.aiLogic.initAIOpponent();
        } else {
            this.aiOpponent = null;
            this.aiOpponentScore = 0;
        }
        
        updateMusicVolume(this.isPaused, this.soundEnabled);
        this.updateTicker();
        this.updateHUD();
        this.cheatSequence = [];
    }

    handleMenuPress() {
        initAudio();
        if (this.currentScreen !== "EDIT_NAME" && this.currentScreen !== "INTRO") {
            if (!this.isPaused) {
                this.isPaused = true;
                updateMusicVolume(this.isPaused, this.soundEnabled);
            }
            this.currentScreen = "MAIN";
        }
    }

    handleBackPress() {
        initAudio();
        if (this.currentScreen !== "EDIT_NAME" && this.currentScreen !== "INTRO") {
            if (["SETTINGS","LEADERBOARD","TASKS","ACHIEVEMENTS","MODES","ABOUT"].includes(this.currentScreen)) {
                this.currentScreen = "MAIN";
            }
        }
    }

    async handleCenter() {
        await this.stateHandler.handleCenter();
    }

    handleInput(act) {
        if (this.currentScreen === "EDIT_NAME" || this.currentScreen === "INTRO") return;
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
                let max = this.gameOver ? 6 : 7;
                if (act === "UP") this.mainMenuSelection = (this.mainMenuSelection <= 0) ? max : this.mainMenuSelection - 1;
                if (act === "DOWN") this.mainMenuSelection = (this.mainMenuSelection >= max) ? 0 : this.mainMenuSelection + 1;
            } else if (this.currentScreen === "MODES") {
                if (act === "UP") this.modesMenuSelection = (this.modesMenuSelection <= 0) ? 7 : this.modesMenuSelection - 1;
                if (act === "DOWN") this.modesMenuSelection = (this.modesMenuSelection >= 7) ? 0 : this.modesMenuSelection + 1;
            } else if (this.currentScreen === "SETTINGS") {
                let max = 5;
                if (act === "UP") this.settingsMenuSelection = (this.settingsMenuSelection <= 0) ? max : this.settingsMenuSelection - 1;
                if (act === "DOWN") this.settingsMenuSelection = (this.settingsMenuSelection >= max) ? 0 : this.settingsMenuSelection + 1;
            } else if (this.currentScreen === "TASKS") {
                if (act === "UP") this.tasksScrollY = Math.max(0, this.tasksScrollY - 20);
                if (act === "DOWN") this.tasksScrollY = Math.min(this.maxTasksScrollY, this.tasksScrollY + 20);
            } else if (this.currentScreen === "ABOUT") {
                if (act === "UP") this.aboutScrollY = Math.max(0, this.aboutScrollY - 15);
                if (act === "DOWN") this.aboutScrollY = Math.min(this.maxAboutScrollY, this.aboutScrollY + 15);
            } else if (this.currentScreen === "ACHIEVEMENTS") {
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
        const t = i18n[this.currentLang];
        this.flashCounter++;
        if (this.flashCounter % 3 === 0) this.flashToggle = !this.flashToggle;
        this.rainbowHue = (this.rainbowHue + 5) % 360;
        
        if (this.isPaused) {
            this.timerContainer.style.visibility = "hidden";
            this.renderer.drawObstacles(this.obstacles, this.currentModeIdx, this.flashToggle, this.flashingObstacleIdx);
            this.renderer.drawGhostTrails(this.ghostTrails, this.currentModeIdx, this.flashToggle);
            this.renderer.drawSnake(this.snake, this.rainbowHue);
            if (this.aiOpponent && this.currentModeIdx === 5) {
                this.renderer.drawAIOpponent(this.aiOpponent.snake);
            }
            this.renderer.drawFood(this.food, this.foodType, this.flashToggle);
            this.renderer.drawGift(this.gift, this.flashToggle);
            this.renderer.drawFloatingScores(this.floatingScores);
            
            if (this.currentScreen === "MAIN") {
                if (this.gameOver) this.menuDrawer.drawPixelMenu(t.gameOver);
                else this.menuDrawer.drawPixelMenu(t.pause);
            } else if (this.currentScreen === "SETTINGS") this.menuDrawer.drawPixelMenu(t.settings);
            else if (this.currentScreen === "MODES") this.menuDrawer.drawModesScreen();
            else if (this.currentScreen === "LEADERBOARD") this.menuDrawer.drawLeaderboardScreen();
            else if (this.currentScreen === "TASKS") this.menuDrawer.drawTasksScreen();
            else if (this.currentScreen === "ACHIEVEMENTS") this.menuDrawer.drawAchievementsScreen();
            else if (this.currentScreen === "ABOUT") this.menuDrawer.drawAboutScreen();
            return;
        }
        
        this.updateTimeMode();
        this.moveFoodInRushMode();
        
        if (this.foodType !== "REGULAR") {
            let currentTickSpeed = this.isTurboActive ? speeds[2] : speeds[this.currentSpeedMode];
            this.bonusTimer -= currentTickSpeed;
            this.timerContainer.style.visibility = "visible";
            let maxTime = maxBigFoodTime;
            if (this.foodType === "SHRINK") maxTime = maxShrinkTime;
            if (this.foodType === "TURBO") maxTime = maxTurboTime;
            const percentage = Math.max(0, (this.bonusTimer / maxTime) * 100);
            this.timerBar.style.width = percentage + "%";
            if (this.bonusTimer <= 0) {
                this.foodType = "REGULAR";
                this.isTurboActive = false;
                this.timerContainer.style.visibility = "hidden";
                this.generateFood();
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
        
        if (!this.gameOver) {
            this.checkCollision();
            this.renderer.drawObstacles(this.obstacles, this.currentModeIdx, this.flashToggle, this.flashingObstacleIdx);
            this.renderer.drawGhostTrails(this.ghostTrails, this.currentModeIdx, this.flashToggle);
            if (this.aiOpponent && this.currentModeIdx === 5) {
                this.renderer.drawAIOpponent(this.aiOpponent.snake);
            }
            this.renderer.drawFood(this.food, this.foodType, this.flashToggle);
            this.renderer.drawGift(this.gift, this.flashToggle);
            this.renderer.drawSnake(this.snake, this.rainbowHue);
            this.renderer.drawFloatingScores(this.floatingScores);
            
            if ((this.currentModeIdx === 6 || this.currentModeIdx === 7) && this.timeRemaining <= 10 && this.timeRemaining > 0 && this.timeWarningFlash) {
                this.ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }
}