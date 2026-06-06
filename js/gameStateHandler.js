import { initAudio, updateMusicBySound } from './utils.js';
import { unlockAchievement, isChameleonUnlocked } from './achievements.js';
import { achievements } from './achievements.js';
import { snakeColors } from './utils.js';

export class GameStateHandler {
    constructor(game) {
        this.game = game;
    }

    async handleCenter() {
        initAudio();
        
        if (this.game.currentScreen === "INTRO") {
            if (this.game.introScreen.isReady()) {
                this.game.currentScreen = "MAIN";
                this.game.updateTicker();
                this.game.updateMiniDisplay();
            }
            return;
        }
        
        if (this.game.currentScreen === "EDIT_NAME") {
            this.game.saveNameInput();
            return;
        }
        
        if (this.game.currentScreen === "ABOUT" && this.game.currentGithubUrl) {
            window.open(this.game.currentGithubUrl, '_blank');
            return;
        }
        
        if (this.game.currentScreen === "MULTIPLAYER_MENU") {
            await this.handleMultiplayerMenu();
            return;
        }
        
        if (this.game.currentScreen === "WAITING_MP") {
            if (this.game.multiplayerManager) {
                this.game.multiplayerManager.sendReady();
            }
            return;
        }
        
        if (this.game.currentScreen === "MULTIPLAYER_RESULT") {
            if (this.game.multiplayerManager) {
                this.game.multiplayerManager.cleanup();
            }
            this.game.isMultiplayer = false;
            this.game.currentScreen = "MAIN";
            this.game.updateMiniDisplay();
            return;
        }
        
        if (this.game.currentScreen === "GAME_MP") {
            if (this.game.isPaused) {
                this.game.isPaused = false;
                this.game.lastTimeUpdate = Date.now();
            } else {
                this.game.isPaused = true;
            }
            return;
        }
        
        if (!this.game.isPaused && !this.game.gameOver && 
            this.game.cheatSequence.length === 3 && 
            this.game.cheatSequence.every((val, i) => val === this.game.targetCheat[i])) {
            this.game.aiMode = !this.game.aiMode;
            if (this.game.aiMode) {
                this.game.usedAIThisSession = true;
                unlockAchievement("cyborg", achievements);
            }
            this.game.updateHUD();
            this.game.cheatSequence = [];
            return;
        }
        this.game.cheatSequence = [];
        
        if (this.game.currentScreen === "MAIN") {
            await this.handleMainMenu();
        } 
        else if (this.game.currentScreen === "MODES") {
            this.handleModesMenu();
        } 
        else if (this.game.currentScreen === "SETTINGS") {
            this.handleSettingsMenu();
        } 
        else if (this.game.currentScreen === "MODE_INFO") {
            this.handleModeInfo();
        }
        else if (!this.game.isPaused) {
            this.game.isPaused = true;
        }
    }

    async handleMainMenu() {
        if (this.game.gameOver) {
            switch (this.game.mainMenuSelection) {
                case 0: this.game.reset(); this.game.currentScreen = "MAIN"; this.game.updateMiniDisplay(); break;
                case 1: this.game.currentScreen = "MODES"; this.game.modesMenuSelection = this.game.currentModeIdx; this.game.modesScrollY = 0; this.game.updateMiniDisplay(); break;
                case 2: this.game.currentScreen = "MODE_INFO"; this.game.updateMiniDisplay(); break;
                case 3: this.game.currentScreen = "SETTINGS"; this.game.settingsMenuSelection = 0; this.game.updateMiniDisplay(); break;
                case 4: this.game.currentScreen = "LEADERBOARD"; await this.game.loadTopTen(); this.game.updateMiniDisplay(); break;
                case 5: this.game.currentScreen = "TASKS"; this.game.tasksScrollY = 0; this.game.updateMiniDisplay(); break;
                case 6: this.game.currentScreen = "ACHIEVEMENTS"; this.game.achScrollY = 0; this.game.updateMiniDisplay(); break;
                case 7: this.game.currentScreen = "ABOUT"; this.game.aboutScrollY = 0; this.game.updateMiniDisplay(); break;
                case 8: this.game.currentScreen = "MULTIPLAYER_MENU"; this.game.multiplayerMenuSelection = 0; this.game.updateMiniDisplay(); break;
            }
        } else {
            switch (this.game.mainMenuSelection) {
                case 0: this.game.isPaused = false; this.game.lastTimeUpdate = Date.now(); this.game.updateMiniDisplay(); break;
                case 1: this.game.reset(); this.game.currentScreen = "MAIN"; this.game.updateMiniDisplay(); break;
                case 2: this.game.currentScreen = "MODES"; this.game.modesMenuSelection = this.game.currentModeIdx; this.game.modesScrollY = 0; this.game.updateMiniDisplay(); break;
                case 3: this.game.currentScreen = "MODE_INFO"; this.game.updateMiniDisplay(); break;
                case 4: this.game.currentScreen = "SETTINGS"; this.game.settingsMenuSelection = 0; this.game.updateMiniDisplay(); break;
                case 5: this.game.currentScreen = "LEADERBOARD"; await this.game.loadTopTen(); this.game.updateMiniDisplay(); break;
                case 6: this.game.currentScreen = "TASKS"; this.game.tasksScrollY = 0; this.game.updateMiniDisplay(); break;
                case 7: this.game.currentScreen = "ACHIEVEMENTS"; this.game.achScrollY = 0; this.game.updateMiniDisplay(); break;
                case 8: this.game.currentScreen = "ABOUT"; this.game.aboutScrollY = 0; this.game.updateMiniDisplay(); break;
                case 9: this.game.currentScreen = "MULTIPLAYER_MENU"; this.game.multiplayerMenuSelection = 0; this.game.updateMiniDisplay(); break;
            }
        }
    }

    async handleMultiplayerMenu() {
        const t = this.game.i18n[this.game.currentLang];
        
        if (this.game.multiplayerMenuSelection === 0) {
            const result = await this.game.multiplayerManager.createRoom(this.game.playerName);
            if (result.success) {
                this.game.currentScreen = "WAITING_MP";
                this.game.updateMiniDisplay();
            } else {
                alert("Failed to create room: " + result.error);
            }
        } else if (this.game.multiplayerMenuSelection === 1) {
            const code = prompt(t.enterRoomCode || "ENTER ROOM CODE:");
            if (code && code.trim()) {
                const result = await this.game.multiplayerManager.joinRoom(code.trim().toUpperCase(), this.game.playerName);
                if (result.success) {
                    this.game.currentScreen = "WAITING_MP";
                    this.game.updateMiniDisplay();
                } else {
                    alert("Failed to join: " + result.error);
                }
            }
        } else if (this.game.multiplayerMenuSelection === 2) {
            this.game.currentScreen = "MAIN";
            this.game.updateMiniDisplay();
        }
    }

    handleModesMenu() {
        this.game.currentModeIdx = this.game.modesMenuSelection;
        this.game.updateHUD();
        this.game.loadBestSingleScore();
        this.game.reset();
        this.game.currentScreen = "MAIN";
        this.game.updateMiniDisplay();
    }

    handleSettingsMenu() {
        let s = this.game.settingsMenuSelection;
        if (s === 0) {
            this.game.currentSpeedMode = (this.game.currentSpeedMode + 1) % 3;
            this.game.updateTicker();
        } else if (s === 1) {
            this.game.soundEnabled = !this.game.soundEnabled;
            localStorage.setItem("snake_sound_enabled", this.game.soundEnabled);
            updateMusicBySound(this.game.soundEnabled);
        } else if (s === 2) {
            this.game.currentLang = (this.game.currentLang === "RU") ? "EN" : "RU";
            this.game.updateHUD();
            if (this.game.aboutLogic) this.game.aboutLogic.loadAboutText();
        } else if (s === 3) {
            this.game.openNameInput();
        } else if (s === 4) {
            let nextColorIdx = (this.game.currentSnakeColorIdx + 1) % snakeColors.length;
            if (nextColorIdx === 4 && !isChameleonUnlocked) nextColorIdx = 0;
            this.game.currentSnakeColorIdx = nextColorIdx;
            localStorage.setItem("snake_color_idx", this.game.currentSnakeColorIdx);
        } else if (s === 5) {
            this.game.themeMode = (this.game.themeMode + 1) % 3;
            localStorage.setItem("snake_theme_mode", this.game.themeMode);
            this.game.isDarkTheme = this.game.getEffectiveTheme();
            this.game.applyTheme();
            this.game.renderer.isDarkTheme = this.game.isDarkTheme;
            this.game.themeChangesCount++;
            if (this.game.themeChangesCount >= 5) unlockAchievement("identityCrisis", achievements);
        }
        this.game.updateMiniDisplay();
    }

    handleModeInfo() {
        this.game.currentScreen = "MAIN";
        this.game.updateMiniDisplay();
    }
}
