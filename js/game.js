import { makeAIMove } from './ai.js';
import { db, collection, addDoc, query, orderBy, limit, getDocs, where } from './firebase-config.js';
import { i18n } from './i18n.js';
import { tasks, completeTask, checkScoreTasks } from './tasks.js';
import { achievements, unlockAchievement, isChameleonUnlocked } from './achievements.js';
import { Renderer } from './renderer.js';
import { IntroScreen } from './intro.js';
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
        this.isDarkTheme = localStorage.getItem("snake_dark_theme") === "true";
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
        this.maxAboutScrollY = 160;
        this.achScrollY = 0;
        this.maxAchScrollY = 360;
        this.gameInterval = null;
        this.globalTopTen = [];
        this.isLoadingLeaderboard = false;
        this.externalAboutData = { RU: [], EN: [] };

        // Touch control variables
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;
        this.isTouchMoving = false;
        this.swipeThreshold = 20; // min distance for swipe

        // Modules
        this.introScreen = new IntroScreen();
        this.renderer = new Renderer(
            this.ctx, this.canvas, this.tileCount, this.isDarkTheme, 
            snakeColors, () => this.currentSnakeColorIdx, () => this.rainbowHue
        );

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);

        // Initialize touch controls
        this.initTouchControls();
    }

    // ========== TOUCH CONTROLS ==========
    initTouchControls() {
        this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd);
    }

    handleTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX - rect.left;
        this.touchStartY = touch.clientY - rect.top;
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
            // Tap detected
            this.handleTap();
            return;
        }
        if (this.isTouchMoving) {
            // Swipe detected
            const rect = this.canvas.getBoundingClientRect();
            let endX = this.touchStartX;
            let endY = this.touchStartY;
            if (e.changedTouches.length > 0) {
                endX = e.changedTouches[0].clientX - rect.left;
                endY = e.changedTouches[0].clientY - rect.top;
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
            // Исправлено: свайп вниз -> DOWN, свайп вверх -> UP
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
        const modeTag = ` [${t.gameModes[this.currentModeIdx] || "MODE"}]`;
        this.scoreElement.innerText = `${t.score}:${this.score}${aiTag}${modeTag}`;
        if (this.bestPlayerName === "---") {
            this.hiScoreElement.innerText = `${t.hi}: ${t.loading}`;
        } else {
            this.hiScoreElement.innerText = `${t.hi}:${this.hiScore} ${t.bestBy} ${this.bestPlayerName}`;
        }
    }

    updateTicker() {
        if (this.gameInterval) clearInterval(this.gameInterval);
        let activeSpeed = this.isTurboActive ? speeds[2] : speeds[this.currentSpeedMode];
        let tickSpeed = (this.currentScreen === "INTRO") ? 33 : activeSpeed;
        this.gameInterval = setInterval(this.gameLoop, tickSpeed);
    }

    generateObstacles() {
        this.obstacles = [];
        this.flashingObstacleIdx = -1;
        if (this.currentModeIdx !== 2 && this.currentModeIdx !== 4) return;
        while (this.obstacles.length < 8) {
            let obsX = Math.floor(Math.random() * this.tileCount);
            let obsY = Math.floor(Math.random() * this.tileCount);
            let distance = Math.abs(obsX - 10) + Math.abs(obsY - 10);
            if (distance > 3) {
                if (!this.obstacles.some(o => o.x === obsX && o.y === obsY)) {
                    this.obstacles.push({x: obsX, y: obsY});
                }
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
                                 (this.gift && this.gift.x === x && this.gift.y === y);
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
                                 (this.gift && this.gift.x === x && this.gift.y === y);
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

    async loadAboutText() {
        this.externalAboutData = {
            "RU": [
                "NETSNAKE 10 V1.0", "КЛАССИЧЕСКАЯ ЗМЕЙКА", "В НОВОМ ФОРМАТЕ.", "",
                "ЯБЛОКО: +1 ОЧКО И ХВОСТ", "ЗОЛОТОЕ: +10 ОЧКОВ (ЛИМИТ)", "СИНЕЕ: УМЕНЬШАЕТ ХВОСТ",
                "ФИОЛЕТ: ТУРБО-РЕЖИМ (X3)", "ПОДАРОК: +50 ОЧКОВ (БОНУС)", "",
                "УПРАВЛЕНИЕ:", "СТРЕЛКИ / WASD - ДВИЖЕНИЕ", "ENTER / SPACE - ОК",
                "ESC / BACKSPACE - НАЗАД", "M - ГЛАВНОЕ МЕНЮ", "", "ПРОЕКТ НА GITHUB"
            ],
            "EN": [
                "NETSNAKE 10 V1.0", "CLASSIC SNEK GAME", "REIMAGINED.", "",
                "APPLE: +1 SCORE & TAIL", "GOLDEN: +10 SCORE (TIMER)", "BLUE: SHRINKS SNAKE",
                "PURPLE: TURBO MODE (X3)", "GIFT: +50 SCORE (BONUS)", "",
                "CONTROLS:", "ARROWS / WASD - MOVE", "ENTER / SPACE - OK",
                "ESC / BACKSPACE - BACK", "M - MAIN MENU", "", "SOURCE ON GITHUB"
            ]
        };
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
        this.ghostTrails.forEach(gt => gt.ttl--);
        this.ghostTrails = this.ghostTrails.filter(gt => gt.ttl > 0);

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
            if (this.foodType !== "REGULAR" && this.bonusTimer > 0 && this.bonusTimer < (activeSpeed * 5)) {
                unlockAchievement("hawkTactics", achievements);
            }
            if (this.foodType === "REGULAR") {
                playSound("eat", this.soundEnabled);
                let gain = this.isTurboActive ? 3 : 1;
                this.score += gain;
                addFloatingScore(this.floatingScores, h.x, h.y, `+${gain}`);
                this.regularApplesStreak++;
                if (this.regularApplesStreak >= 15) {
                    unlockAchievement("vegetarian", achievements);
                }
            } else if (this.foodType === "BIG") {
                playSound("bigEat", this.soundEnabled);
                this.score += 10;
                addFloatingScore(this.floatingScores, h.x, h.y, "+10");
                this.goldFoodEaten = true;
                completeTask("goldFood", tasks, (type) => playSound(type, this.soundEnabled), () => this.spawnGift());
                this.regularApplesStreak = 0;
            } else if (this.foodType === "SHRINK") {
                playSound("shrinkEat", this.soundEnabled);
                this.blueFoodEaten = true;
                completeTask("blueFood", tasks, (type) => playSound(type, this.soundEnabled), () => this.spawnGift());
                this.regularApplesStreak = 0;
                if (this.snake.length === 3) {
                    unlockAchievement("dietMode", achievements);
                }
                let newLength = Math.max(1, Math.floor(this.snake.length / 2));
                while (this.snake.length > newLength) this.snake.pop();
                addFloatingScore(this.floatingScores, h.x, h.y, "SHRINK");
            } else if (this.foodType === "TURBO") {
                playSound("turboEat", this.soundEnabled);
                this.isTurboActive = true;
                this.bonusTimer = maxTurboTime;
                addFloatingScore(this.floatingScores, h.x, h.y, "TURBO!");
                unlockAchievement("energyDrink", achievements);
                this.regularApplesStreak = 0;
                this.updateTicker();
            }
            checkScoreTasks(this.score, tasks, (id, tasksObj) => completeTask(id, tasksObj, (type) => playSound(type, this.soundEnabled), () => this.spawnGift()), (id, ach) => unlockAchievement(id, ach), achievements);
            if (this.foodType !== "TURBO") {
                this.foodType = "REGULAR";
                if (!this.isTurboActive) this.timerContainer.style.visibility = "hidden";
            }
            this.updateHUD();
            this.generateFood();
        } else {
            this.snake.pop();
        }
    }

    generateFood() {
        let validPositions = [];
        for (let x = 0; x < this.tileCount; x++) {
            for (let y = 0; y < this.tileCount; y++) {
                let isOccupied = this.snake.some(p => p.x === x && p.y === y) ||
                                 this.obstacles.some(o => o.x === x && o.y === y) ||
                                 this.ghostTrails.some(g => g.x === x && g.y === y) ||
                                 (this.gift && this.gift.x === x && this.gift.y === y);
                if (!isOccupied) validPositions.push({x, y});
            }
        }
        if (validPositions.length === 0) {
            if (!this.aiMode) this.endGame();
            return;
        }
        this.food = validPositions[Math.floor(Math.random() * validPositions.length)];
        if (this.isTurboActive) {
            this.foodType = "REGULAR";
            return;
        }
        let rand = Math.random();
        if (rand < 0.05 && !this.blueFoodEaten) {
            this.foodType = "SHRINK";
            this.bonusTimer = maxShrinkTime;
        } else if (rand < 0.10) {
            this.foodType = "TURBO";
            this.bonusTimer = maxTurboTime;
        } else if (rand < 0.20 && !this.goldFoodEaten) {
            this.foodType = "BIG";
            this.bonusTimer = maxBigFoodTime;
        } else {
            this.foodType = "REGULAR";
        }
    }

    checkCollision() {
        if (this.aiMode) return;
        let h = this.snake[0];
        if (this.foodType === "BIG") {
            let distToGold = Math.abs(h.x - this.food.x) + Math.abs(h.y - this.food.y);
            if (distToGold === 1) {
                if (this.currentModeIdx === 1 && (h.x + this.dx < 0 || h.x + this.dx > this.tileCount - 1 || h.y + this.dy < 0 || h.y + this.dy > this.tileCount - 1)) {
                    unlockAchievement("greed", achievements);
                }
                if ((this.currentModeIdx === 2 || this.currentModeIdx === 4) && this.obstacles.some(obs => obs.x === (h.x + this.dx) && obs.y === (h.y + this.dy))) {
                    unlockAchievement("greed", achievements);
                }
                for (let i = 1; i < this.snake.length; i++) {
                    if ((h.x + this.dx) === this.snake[i].x && (h.y + this.dy) === this.snake[i].y) {
                        unlockAchievement("greed", achievements);
                    }
                }
            }
        }
        if (this.currentModeIdx === 1 && (h.x < 0 || h.x > this.tileCount - 1 || h.y < 0 || h.y > this.tileCount - 1)) {
            this.endGame();
            return;
        }
        for (let i = 1; i < this.snake.length; i++) {
            if (h.x === this.snake[i].x && h.y === this.snake[i].y) {
                this.endGame();
                return;
            }
        }
        if ((this.currentModeIdx === 2 || this.currentModeIdx === 4) && this.obstacles.some(obs => obs.x === h.x && obs.y === h.y)) {
            this.endGame();
            return;
        }
        if (this.ghostTrails.some(gt => gt.x === h.x && gt.y === h.y)) {
            this.endGame();
        }
    }

    endGame() {
        playSound("die", this.soundEnabled);
        this.gameOver = true;
        this.isPaused = true;
        this.isTurboActive = false;
        this.currentScreen = "MAIN";
        this.mainMenuSelection = 0;
        this.mainMenuScrollY = 0;
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
        this.generateObstacles();
        this.dx = 1;
        this.dy = 0;
        this.nextDx = 1;
        this.nextDy = 0;
        this.score = 0;
        this.gameOver = false;
        this.isPaused = false;
        this.foodType = "REGULAR";
        this.aiMode = false;
        this.usedAIThisSession = false;
        this.mainMenuSelection = 0;
        this.mainMenuScrollY = 0;
        this.timerContainer.style.visibility = "hidden";
        this.regularApplesStreak = 0;
        this.generateFood();
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
        initAudio();
        if (this.currentScreen === "INTRO") {
            if (this.introScreen.isReady()) {
                this.currentScreen = "MAIN";
                this.updateTicker();
            }
            return;
        }
        if (this.currentScreen === "EDIT_NAME") {
            this.saveNameInput();
            return;
        }
        if (!this.isPaused && !this.gameOver && this.cheatSequence.length === 3 && this.cheatSequence.every((val, i) => val === this.targetCheat[i])) {
            this.aiMode = !this.aiMode;
            if (this.aiMode) {
                this.usedAIThisSession = true;
                unlockAchievement("cyborg", achievements);
            }
            this.updateHUD();
            this.cheatSequence = [];
            return;
        }
        this.cheatSequence = [];
        if (this.currentScreen === "MAIN") {
            if (this.gameOver) {
                if (this.mainMenuSelection === 0) this.reset();
                else if (this.mainMenuSelection === 1) { this.currentScreen = "MODES"; this.modesMenuSelection = this.currentModeIdx; }
                else if (this.mainMenuSelection === 2) { this.currentScreen = "SETTINGS"; this.settingsMenuSelection = 0; }
                else if (this.mainMenuSelection === 3) { this.currentScreen = "LEADERBOARD"; await this.loadTopTen(); }
                else if (this.mainMenuSelection === 4) { this.currentScreen = "TASKS"; this.tasksScrollY = 0; }
                else if (this.mainMenuSelection === 5) { this.currentScreen = "ACHIEVEMENTS"; this.achScrollY = 0; }
                else if (this.mainMenuSelection === 6) { this.currentScreen = "ABOUT"; this.aboutScrollY = 0; }
            } else {
                if (this.mainMenuSelection === 0) { this.isPaused = false; updateMusicVolume(this.isPaused, this.soundEnabled); }
                else if (this.mainMenuSelection === 1) this.reset();
                else if (this.mainMenuSelection === 2) { this.currentScreen = "MODES"; this.modesMenuSelection = this.currentModeIdx; }
                else if (this.mainMenuSelection === 3) { this.currentScreen = "SETTINGS"; this.settingsMenuSelection = 0; }
                else if (this.mainMenuSelection === 4) { this.currentScreen = "LEADERBOARD"; await this.loadTopTen(); }
                else if (this.mainMenuSelection === 5) { this.currentScreen = "TASKS"; this.tasksScrollY = 0; }
                else if (this.mainMenuSelection === 6) { this.currentScreen = "ACHIEVEMENTS"; this.achScrollY = 0; }
                else if (this.mainMenuSelection === 7) { this.currentScreen = "ABOUT"; this.aboutScrollY = 0; }
            }
        } 
        else if (this.currentScreen === "MODES") {
            this.currentModeIdx = this.modesMenuSelection;
            this.updateHUD();
            await this.loadBestSingleScore();
            // Исправление: не запускаем игру автоматически
            this.currentScreen = "MAIN";
        } 
        else if (this.currentScreen === "SETTINGS") {
            let s = this.settingsMenuSelection;
            if (s === 0) {
                this.currentSpeedMode = (this.currentSpeedMode + 1) % 3;
                this.updateTicker();
            } else if (s === 1) {
                this.soundEnabled = !this.soundEnabled;
                localStorage.setItem("snake_sound_enabled", this.soundEnabled);
                if (this.soundEnabled) startBackgroundMusic();
                else stopBackgroundMusic();
                updateMusicVolume(this.isPaused, this.soundEnabled);
            } else if (s === 2) {
                this.currentLang = (this.currentLang === "RU") ? "EN" : "RU";
                this.updateHUD();
            } else if (s === 3) {
                this.openNameInput();
            } else if (s === 4) {
                let nextColorIdx = (this.currentSnakeColorIdx + 1) % snakeColors.length;
                if (nextColorIdx === 4 && !isChameleonUnlocked) nextColorIdx = 0;
                this.currentSnakeColorIdx = nextColorIdx;
                localStorage.setItem("snake_color_idx", this.currentSnakeColorIdx);
            } else if (s === 5) {
                this.isDarkTheme = !this.isDarkTheme;
                localStorage.setItem("snake_dark_theme", this.isDarkTheme);
                this.applyTheme();
                this.themeChangesCount++;
                if (this.themeChangesCount >= 5) {
                    unlockAchievement("identityCrisis", achievements);
                }
            }
        } 
        else if (!this.isPaused) {
            this.isPaused = true;
            updateMusicVolume(this.isPaused, this.soundEnabled);
        }
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
                if (act === "UP") this.modesMenuSelection = (this.modesMenuSelection <= 0) ? 4 : this.modesMenuSelection - 1;
                if (act === "DOWN") this.modesMenuSelection = (this.modesMenuSelection >= 4) ? 0 : this.modesMenuSelection + 1;
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
            this.renderer.drawFood(this.food, this.foodType, this.flashToggle);
            this.renderer.drawGift(this.gift, this.flashToggle);
            this.renderer.drawFloatingScores(this.floatingScores);
            if (this.currentScreen === "MAIN") {
                if (this.gameOver) this.drawPixelMenu(t.gameOver);
                else this.drawPixelMenu(t.pause);
            } else if (this.currentScreen === "SETTINGS") this.drawPixelMenu(t.settings);
            else if (this.currentScreen === "MODES") this.drawModesScreen();
            else if (this.currentScreen === "LEADERBOARD") this.drawLeaderboardScreen();
            else if (this.currentScreen === "TASKS") this.drawTasksScreen();
            else if (this.currentScreen === "ACHIEVEMENTS") this.drawAchievementsScreen();
            else if (this.currentScreen === "ABOUT") this.drawAboutScreen();
            return;
        }
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
            const move = makeAIMove(this.snake, this.gift, this.food, this.tileCount, this.obstacles, this.ghostTrails, this.currentModeIdx);
            if (move) {
                if (move === "UP") { this.nextDx = 0; this.nextDy = -1; }
                if (move === "DOWN") { this.nextDx = 0; this.nextDy = 1; }
                if (move === "LEFT") { this.nextDx = -1; this.nextDy = 0; }
                if (move === "RIGHT") { this.nextDx = 1; this.nextDy = 0; }
            }
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
        this.moveSnake();
        if (!this.gameOver) {
            this.checkCollision();
            this.renderer.drawObstacles(this.obstacles, this.currentModeIdx, this.flashToggle, this.flashingObstacleIdx);
            this.renderer.drawGhostTrails(this.ghostTrails, this.currentModeIdx, this.flashToggle);
            this.renderer.drawFood(this.food, this.foodType, this.flashToggle);
            this.renderer.drawGift(this.gift, this.flashToggle);
            this.renderer.drawSnake(this.snake, this.rainbowHue);
            this.renderer.drawFloatingScores(this.floatingScores);
        }
    }

    drawPixelMenu(title) {
        const t = i18n[this.currentLang];
        this.ctx.fillStyle = this.isDarkTheme ? "#161b22" : "#2b3a4a";
        this.ctx.fillRect(20, 25, 360, 350);
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(26, 31, 348, 338);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "15px 'Press Start 2P'";
        this.ctx.textAlign = "center";
        this.ctx.fillText(title, 200, 65);
        this.ctx.fillRect(40, 85, 320, 2);
        this.ctx.font = "11px 'Press Start 2P'";
        this.ctx.textAlign = "left";
        if (this.currentScreen === "MAIN") {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.rect(30, 90, 340, 260);
            this.ctx.clip();
            let options = this.gameOver ? 
                [t.newGame, t.modesMenu, t.settings, t.records, t.tasksMenu, t.achievementsMenu, t.aboutMenu] :
                [t.continue, t.newGame, t.modesMenu, t.settings, t.records, t.tasksMenu, t.achievementsMenu, t.aboutMenu];
            let expectedY = this.mainMenuSelection * 34;
            if (expectedY - this.mainMenuScrollY > 180) this.mainMenuScrollY = expectedY - 180;
            if (expectedY - this.mainMenuScrollY < 10) this.mainMenuScrollY = Math.max(0, expectedY - 10);
            options.forEach((opt, idx) => {
                let y = 120 + (idx * 34) - this.mainMenuScrollY;
                this.ctx.fillStyle = "#ffffff";
                this.ctx.fillText(this.mainMenuSelection === idx ? ">" : " ", 40, y);
                this.ctx.fillText(opt, 75, y);
            });
            this.ctx.restore();
        } else if (this.currentScreen === "SETTINGS") {
            let labelColor = t.locked;
            if (isChameleonUnlocked || this.settingsMenuSelection !== 4 || this.currentSnakeColorIdx !== 4) {
                labelColor = (this.currentLang === "RU") ? snakeColors[this.currentSnakeColorIdx].nameRU : snakeColors[this.currentSnakeColorIdx].nameEN;
                if (this.currentSnakeColorIdx === 4 && !isChameleonUnlocked) labelColor = t.locked;
            }
            let items = [
                `${t.speed}:${t.speedModes[this.currentSpeedMode]}`,
                `${t.sound}:${this.soundEnabled ? t.toggleModes[1] : t.toggleModes[0]}`,
                `${t.lang}:${this.currentLang}`,
                `${t.name}:${this.playerName}`,
                `${t.snakeColor}:${labelColor}`,
                `${t.theme}:${this.isDarkTheme ? t.themeModes[1] : t.themeModes[0]}`
            ];
            items.forEach((txt, i) => {
                let y = 115 + (i * 34);
                if (this.settingsMenuSelection === i) this.ctx.fillText(">", 35, y);
                this.ctx.fillText(txt, 65, y);
            });
            this.ctx.fillStyle = "#ffffff";
            this.ctx.textAlign = "center";
            this.ctx.font = "10px 'Press Start 2P'";
            this.ctx.fillText(t.back, 200, 345);
        }
    }

    drawModesScreen() {
        const t = i18n[this.currentLang];
        this.ctx.fillStyle = this.isDarkTheme ? "#161b22" : "#2b3a4a";
        this.ctx.fillRect(20, 25, 360, 350);
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(26, 31, 348, 338);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "14px 'Press Start 2P'";
        this.ctx.textAlign = "center";
        this.ctx.fillText(t.modesTitle, 200, 65);
        this.ctx.fillRect(40, 85, 320, 2);
        this.ctx.font = "10px 'Press Start 2P'";
        this.ctx.textAlign = "left";
        t.gameModes.forEach((modeName, idx) => {
            let y = 115 + (idx * 33);
            this.ctx.fillText(`${(this.modesMenuSelection === idx) ? ">" : " "} ${this.currentModeIdx === idx ? "[X]" : "[ ]"} ${modeName}`, 42, y);
        });
        this.ctx.fillStyle = "#ffffff";
        this.ctx.textAlign = "center";
        this.ctx.font = "10px 'Press Start 2P'";
        this.ctx.fillText(t.back, 200, 345);
    }

    drawLeaderboardScreen() {
        const t = i18n[this.currentLang];
        this.ctx.fillStyle = this.isDarkTheme ? "#161b22" : "#2b3a4a";
        this.ctx.fillRect(20, 15, 360, 370);
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(26, 21, 348, 358);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "12px 'Press Start 2P'";
        this.ctx.textAlign = "center";
        this.ctx.fillText(`${t.globalTop} [${t.gameModes[this.currentModeIdx] || "GAME"}]`, 200, 48);
        this.ctx.fillRect(40, 58, 320, 2);
        this.ctx.font = "11px 'Press Start 2P'";
        this.ctx.textAlign = "left";
        if (this.isLoadingLeaderboard) {
            this.ctx.textAlign = "center";
            this.ctx.fillText(t.loading, 200, 200);
        } else if (this.globalTopTen.length === 0) {
            this.ctx.textAlign = "center";
            this.ctx.fillText(t.empty, 200, 200);
        } else {
            this.globalTopTen.forEach((entry, idx) => {
                let y = 88 + (idx * 26);
                let rawName = (entry.playerName || "ANON").substring(0, 8);
                this.ctx.fillText(`${String(idx + 1).padStart(2, '0')}.${rawName}`, 40, y);
                if (idx < 3) {
                    this.ctx.font = "14px Arial";
                    this.ctx.fillText(["🥇","🥈","🥉"][idx], 40 + 35 + (rawName.length * 11) + 5, y + 2);
                    this.ctx.font = "11px 'Press Start 2P'";
                }
                this.ctx.fillText(`:${entry.score}`, 275, y);
            });
        }
        this.ctx.fillStyle = "#ffffff";
        this.ctx.textAlign = "center";
        this.ctx.font = "10px 'Press Start 2P'";
        this.ctx.fillText(t.back, 200, 360);
    }

    drawTasksScreen() {
        const t = i18n[this.currentLang];
        this.ctx.fillStyle = this.isDarkTheme ? "#161b22" : "#2b3a4a";
        this.ctx.fillRect(20, 15, 360, 370);
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(26, 21, 348, 358);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "14px 'Press Start 2P'";
        this.ctx.textAlign = "center";
        this.ctx.fillText(t.tasksTitle, 200, 45);
        this.ctx.fillRect(40, 54, 320, 2);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(30, 60, 340, 265);
        this.ctx.clip();
        this.ctx.font = "11px 'Press Start 2P'";
        this.ctx.textAlign = "left";
        const taskKeys = ["score50", "score100", "score500", "score1000", "goldFood", "blueFood"];
        taskKeys.forEach((key, idx) => {
            let y = 85 + (idx * 52) - this.tasksScrollY;
            let isDone = tasks[key];
            this.ctx.fillStyle = isDone ? "#ffffff" : (this.isDarkTheme ? "#484f58" : "#6c7d93");
            this.ctx.fillText(`${isDone ? "[X]" : "[ ]"} ${t.taskList[key]}`, 42, y);
            this.ctx.font = "7.5px 'Press Start 2P'";
            this.ctx.fillStyle = isDone ? "#ffffff" : (this.isDarkTheme ? "#8b949e" : "#a2b0c3");
            this.ctx.fillText(t.taskList[key + "Desc"], 42, y + 15);
            this.ctx.font = "11px 'Press Start 2P'";
        });
        this.ctx.restore();
        this.ctx.fillStyle = this.isDarkTheme ? "#21262d" : "#1b2530";
        this.ctx.fillRect(355, 65, 4, 255);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(355, 65 + (this.tasksScrollY / this.maxTasksScrollY) * 165, 4, 90);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.textAlign = "center";
        this.ctx.font = "10px 'Press Start 2P'";
        this.ctx.fillText(t.back, 200, 365);
    }

    drawAchievementsScreen() {
        const t = i18n[this.currentLang];
        this.ctx.fillStyle = this.isDarkTheme ? "#161b22" : "#2b3a4a";
        this.ctx.fillRect(20, 15, 360, 370);
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(26, 21, 348, 358);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "14px 'Press Start 2P'";
        this.ctx.textAlign = "center";
        this.ctx.fillText(t.achievementsTitle, 200, 45);
        this.ctx.fillRect(40, 54, 320, 2);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(30, 60, 340, 265);
        this.ctx.clip();
        const achKeys = Object.keys(achievements);
        const hiddenKeys = ["cyborg", "hawkTactics", "dietMode", "identityCrisis", "greed"];
        achKeys.forEach((key, idx) => {
            let y = 85 + (idx * 45) - this.achScrollY;
            let isDone = achievements[key];
            let isHidden = hiddenKeys.includes(key);
            this.ctx.font = "10px 'Press Start 2P'";
            this.ctx.textAlign = "left";
            if (isHidden) {
                this.ctx.fillStyle = isDone ? "#ffb900" : (this.isDarkTheme ? "#484f58" : "#6c7d93");
            } else {
                this.ctx.fillStyle = isDone ? "#ffffff" : (this.isDarkTheme ? "#484f58" : "#6c7d93");
            }
            if (isHidden && !isDone) {
                this.ctx.fillText(`[ ] ${t.unknownTask}`, 42, y);
                this.ctx.font = "7px 'Press Start 2P'";
                this.ctx.fillStyle = this.isDarkTheme ? "#58a6ff" : "#a2b0c3";
                this.ctx.fillText(`* ${t.secretTaskDesc} *`, 42, y + 13);
            } else {
                this.ctx.fillText(`${isDone ? "[X]" : "[ ]"} ${t.achList[key]}`, 42, y);
                this.ctx.font = "7px 'Press Start 2P'";
                this.ctx.fillStyle = isDone ? "#ffffff" : (this.isDarkTheme ? "#8b949e" : "#a2b0c3");
                this.ctx.fillText(t.achList[key + "Desc"], 42, y + 13);
            }
        });
        this.ctx.restore();
        this.ctx.fillStyle = this.isDarkTheme ? "#21262d" : "#1b2530";
        this.ctx.fillRect(355, 65, 4, 255);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(355, 65 + (this.achScrollY / this.maxAchScrollY) * 165, 4, 90);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.textAlign = "center";
        this.ctx.font = "10px 'Press Start 2P'";
        this.ctx.fillText(t.back, 200, 365);
    }

    drawAboutScreen() {
        const t = i18n[this.currentLang];
        this.ctx.fillStyle = this.isDarkTheme ? "#161b22" : "#2b3a4a";
        this.ctx.fillRect(20, 15, 360, 370);
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(26, 21, 348, 358);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.font = "14px 'Press Start 2P'";
        this.ctx.textAlign = "center";
        this.ctx.fillText(t.aboutTitle, 200, 45);
        this.ctx.fillRect(40, 54, 320, 2);
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(30, 60, 340, 265);
        this.ctx.clip();
        const textLines = this.externalAboutData[this.currentLang] || [];
        textLines.forEach((line, idx) => {
            let y = 85 + (idx * 22) - this.aboutScrollY;
            this.ctx.textAlign = "left";
            if (line.includes("GITHUB")) {
                this.ctx.fillStyle = "#58a6ff";
                this.ctx.font = "7px 'Press Start 2P'";
                this.ctx.fillRect(40, y + 2, this.ctx.measureText(line).width, 1);
            } else {
                this.ctx.font = (idx === 0) ? "10px 'Press Start 2P'" : "7px 'Press Start 2P'";
                let isHeader = idx === 0 || line.startsWith("УПРАВЛЕНИЕ:") || line.startsWith("CONTROLS:");
                this.ctx.fillStyle = isHeader ? "#ffffff" : (this.isDarkTheme ? "#8b949e" : "#a2b0c3");
            }
            let textX = 40, itemType = null;
            if (line.startsWith("ЯБЛОКО:") || line.startsWith("APPLE:")) itemType = "REGULAR";
            else if (line.startsWith("ЗОЛОТОЕ:") || line.startsWith("GOLDEN:")) itemType = "BIG";
            else if (line.startsWith("СИНЕЕ:") || line.startsWith("BLUE:")) itemType = "SHRINK";
            else if (line.startsWith("ФИОЛЕТ:") || line.startsWith("PURPLE:")) itemType = "TURBO";
            else if (line.startsWith("ПОДАРОК:") || line.startsWith("GIFT:")) itemType = "GIFT";
            if (itemType) {
                textX = 70;
                this.ctx.save();
                let oldFood = { ...this.food };
                let oldType = this.foodType;
                let oldGift = this.gift ? { ...this.gift } : null;
                if (itemType === "GIFT") {
                    this.gift = { x: 40 / 20, y: (y - 12) / 20 };
                    this.renderer.drawGift(this.gift, this.flashToggle);
                } else {
                    this.food = { x: 40 / 20, y: (y - 12) / 20 };
                    this.foodType = itemType;
                    let oldFlash = this.flashToggle;
                    this.flashToggle = true;
                    this.renderer.drawFood(this.food, this.foodType, this.flashToggle);
                    this.flashToggle = oldFlash;
                }
                this.food = oldFood;
                this.foodType = oldType;
                this.gift = oldGift;
                this.ctx.restore();
            }
            this.ctx.fillText(line, textX, y);
        });
        this.ctx.restore();
        this.ctx.fillStyle = this.isDarkTheme ? "#21262d" : "#1b2530";
        this.ctx.fillRect(355, 65, 4, 255);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.fillRect(355, 65 + (this.aboutScrollY / this.maxAboutScrollY) * 135, 4, 120);
        this.ctx.fillStyle = "#ffffff";
        this.ctx.textAlign = "center";
        this.ctx.font = "10px 'Press Start 2P'";
        this.ctx.fillText(t.back, 200, 365);
    }
}
