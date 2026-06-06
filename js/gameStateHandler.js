import { initAudio, startBackgroundMusic, stopBackgroundMusic, updateMusicVolume } from './utils.js';
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
            }
            return;
        }
        
        if (this.game.currentScreen === "EDIT_NAME") {
            this.game.saveNameInput();
            return;
        }
        
        // Чит-код для AI режима
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
        else if (!this.game.isPaused) {
            this.game.isPaused = true;
            updateMusicVolume(this.game.isPaused, this.game.soundEnabled);
        }
    }

    async handleMainMenu() {
        if (this.game.gameOver) {
            if (this.game.mainMenuSelection === 0) {
                this.game.reset();
                this.game.currentScreen = "MAIN";
            }
            else if (this.game.mainMenuSelection === 1) { this.game.currentScreen = "MODES"; this.game.modesMenuSelection = this.game.currentModeIdx; }
            else if (this.game.mainMenuSelection === 2) { this.game.currentScreen = "SETTINGS"; this.game.settingsMenuSelection = 0; }
            else if (this.game.mainMenuSelection === 3) { this.game.currentScreen = "LEADERBOARD"; await this.game.loadTopTen(); }
            else if (this.game.mainMenuSelection === 4) { this.game.currentScreen = "TASKS"; this.game.tasksScrollY = 0; }
            else if (this.game.mainMenuSelection === 5) { this.game.currentScreen = "ACHIEVEMENTS"; this.game.achScrollY = 0; }
            else if (this.game.mainMenuSelection === 6) { this.game.currentScreen = "ABOUT"; this.game.aboutScrollY = 0; }
        } else {
            if (this.game.mainMenuSelection === 0) { 
                this.game.isPaused = false; 
                this.game.lastTimeUpdate = Date.now();
                updateMusicVolume(this.game.isPaused, this.game.soundEnabled); 
            }
            else if (this.game.mainMenuSelection === 1) {
                this.game.reset();
                this.game.currentScreen = "MAIN";
            }
            else if (this.game.mainMenuSelection === 2) { this.game.currentScreen = "MODES"; this.game.modesMenuSelection = this.game.currentModeIdx; }
            else if (this.game.mainMenuSelection === 3) { this.game.currentScreen = "SETTINGS"; this.game.settingsMenuSelection = 0; }
            else if (this.game.mainMenuSelection === 4) { this.game.currentScreen = "LEADERBOARD"; await this.game.loadTopTen(); }
            else if (this.game.mainMenuSelection === 5) { this.game.currentScreen = "TASKS"; this.game.tasksScrollY = 0; }
            else if (this.game.mainMenuSelection === 6) { this.game.currentScreen = "ACHIEVEMENTS"; this.game.achScrollY = 0; }
            else if (this.game.mainMenuSelection === 7) { this.game.currentScreen = "ABOUT"; this.game.aboutScrollY = 0; }
        }
    }

    handleModesMenu() {
        this.game.currentModeIdx = this.game.modesMenuSelection;
        this.game.updateHUD();
        this.game.loadBestSingleScore();
        this.game.reset();
        this.game.currentScreen = "MAIN";
    }

    handleSettingsMenu() {
        let s = this.game.settingsMenuSelection;
        if (s === 0) {
            this.game.currentSpeedMode = (this.game.currentSpeedMode + 1) % 3;
            this.game.updateTicker();
        } else if (s === 1) {
            this.game.soundEnabled = !this.game.soundEnabled;
            localStorage.setItem("snake_sound_enabled", this.game.soundEnabled);
            if (this.game.soundEnabled) startBackgroundMusic();
            else stopBackgroundMusic();
            updateMusicVolume(this.game.isPaused, this.game.soundEnabled);
        } else if (s === 2) {
            this.game.currentLang = (this.game.currentLang === "RU") ? "EN" : "RU";
            this.game.updateHUD();
            // Обновляем текст "О ИГРЕ" при смене языка
            if (this.game.aboutLogic) {
                this.game.aboutLogic.loadAboutText();
            }
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
            if (this.game.themeChangesCount >= 5) {
                unlockAchievement("identityCrisis", achievements);
            }
        }
    }
}