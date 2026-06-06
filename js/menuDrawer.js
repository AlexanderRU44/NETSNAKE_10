import { i18n } from './i18n.js';
import { tasks } from './tasks.js';
import { achievements, isChameleonUnlocked } from './achievements.js';
import { snakeColors } from './utils.js';

export class MenuDrawer {
    constructor(ctx, game) {
        this.ctx = ctx;
        this.game = game;
        this.githubLinkRect = null;
    }

    drawPixelMenu(title) {
        const t = i18n[this.game.currentLang];
        const ctx = this.ctx;
        
        ctx.fillStyle = this.game.isDarkTheme ? "#161b22" : "#2b3a4a";
        ctx.fillRect(20, 25, 360, 350);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(26, 31, 348, 338);
        ctx.fillStyle = "#ffffff";
        ctx.font = "15px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(title, 200, 65);
        ctx.fillRect(40, 85, 320, 2);
        ctx.font = "11px 'Press Start 2P'";
        ctx.textAlign = "left";
        
        if (this.game.currentScreen === "MAIN") {
            ctx.save();
            ctx.beginPath();
            ctx.rect(30, 90, 340, 260);
            ctx.clip();
            let options = this.game.gameOver ? 
                [t.newGame, t.modesMenu, t.settings, t.records, t.tasksMenu, t.achievementsMenu, t.aboutMenu] :
                [t.continue, t.newGame, t.modesMenu, t.settings, t.records, t.tasksMenu, t.achievementsMenu, t.aboutMenu];
            let expectedY = this.game.mainMenuSelection * 34;
            if (expectedY - this.game.mainMenuScrollY > 180) this.game.mainMenuScrollY = expectedY - 180;
            if (expectedY - this.game.mainMenuScrollY < 10) this.game.mainMenuScrollY = Math.max(0, expectedY - 10);
            options.forEach((opt, idx) => {
                let y = 120 + (idx * 34) - this.game.mainMenuScrollY;
                ctx.fillStyle = "#ffffff";
                ctx.fillText(this.game.mainMenuSelection === idx ? ">" : " ", 40, y);
                ctx.fillText(opt, 75, y);
            });
            ctx.restore();
        } else if (this.game.currentScreen === "SETTINGS") {
            let labelColor = t.locked;
            if (isChameleonUnlocked || this.game.settingsMenuSelection !== 4 || this.game.currentSnakeColorIdx !== 4) {
                labelColor = (this.game.currentLang === "RU") ? snakeColors[this.game.currentSnakeColorIdx].nameRU : snakeColors[this.game.currentSnakeColorIdx].nameEN;
                if (this.game.currentSnakeColorIdx === 4 && !isChameleonUnlocked) labelColor = t.locked;
            }
            let items = [
                `${t.speed}:${t.speedModes[this.game.currentSpeedMode]}`,
                `${t.sound}:${this.game.soundEnabled ? t.toggleModes[1] : t.toggleModes[0]}`,
                `${t.lang}:${this.game.currentLang}`,
                `${t.name}:${this.game.playerName}`,
                `${t.snakeColor}:${labelColor}`,
                `${t.theme}:${t.themeModes[this.game.themeMode]}`
            ];
            items.forEach((txt, i) => {
                let y = 115 + (i * 34);
                if (this.game.settingsMenuSelection === i) ctx.fillText(">", 35, y);
                ctx.fillText(txt, 65, y);
            });
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.font = "10px 'Press Start 2P'";
            ctx.fillText(t.back, 200, 345);
        }
    }

    drawModesScreen() {
        const t = i18n[this.game.currentLang];
        const ctx = this.ctx;
        
        ctx.fillStyle = this.game.isDarkTheme ? "#161b22" : "#2b3a4a";
        ctx.fillRect(20, 25, 360, 350);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(26, 31, 348, 338);
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(t.modesTitle, 200, 65);
        ctx.fillRect(40, 85, 320, 2);
        ctx.font = "10px 'Press Start 2P'";
        ctx.textAlign = "left";
        
        for (let idx = 0; idx < t.gameModes.length; idx++) {
            let y = 115 + (idx * 30);
            let selected = (this.game.modesMenuSelection === idx) ? ">" : " ";
            let active = (this.game.currentModeIdx === idx) ? "[X]" : "[ ]";
            ctx.fillText(`${selected} ${active} ${t.gameModes[idx]}`, 42, y);
        }
        
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "10px 'Press Start 2P'";
        ctx.fillText(t.back, 200, 345);
    }

    drawLeaderboardScreen() {
        const t = i18n[this.game.currentLang];
        const ctx = this.ctx;
        
        ctx.fillStyle = this.game.isDarkTheme ? "#161b22" : "#2b3a4a";
        ctx.fillRect(20, 15, 360, 370);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(26, 21, 348, 358);
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(`${t.globalTop} [${t.gameModes[this.game.currentModeIdx] || "GAME"}]`, 200, 48);
        ctx.fillRect(40, 58, 320, 2);
        ctx.font = "11px 'Press Start 2P'";
        ctx.textAlign = "left";
        
        if (this.game.isLoadingLeaderboard) {
            ctx.textAlign = "center";
            ctx.fillText(t.loading, 200, 200);
        } else if (this.game.globalTopTen.length === 0) {
            ctx.textAlign = "center";
            ctx.fillText(t.empty, 200, 200);
        } else {
            this.game.globalTopTen.forEach((entry, idx) => {
                let y = 88 + (idx * 26);
                let rawName = (entry.playerName || "ANON").substring(0, 8);
                ctx.fillText(`${String(idx + 1).padStart(2, '0')}.${rawName}`, 40, y);
                if (idx < 3) {
                    ctx.font = "14px Arial";
                    ctx.fillText(["🥇","🥈","🥉"][idx], 40 + 35 + (rawName.length * 11) + 5, y + 2);
                    ctx.font = "11px 'Press Start 2P'";
                }
                ctx.fillText(`:${entry.score}`, 275, y);
            });
        }
        
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "10px 'Press Start 2P'";
        ctx.fillText(t.back, 200, 360);
    }

    drawTasksScreen() {
        const t = i18n[this.game.currentLang];
        const ctx = this.ctx;
        
        ctx.fillStyle = this.game.isDarkTheme ? "#161b22" : "#2b3a4a";
        ctx.fillRect(20, 15, 360, 370);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(26, 21, 348, 358);
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(t.tasksTitle, 200, 45);
        ctx.fillRect(40, 54, 320, 2);
        ctx.save();
        ctx.beginPath();
        ctx.rect(30, 60, 340, 265);
        ctx.clip();
        ctx.font = "11px 'Press Start 2P'";
        ctx.textAlign = "left";
        
        const taskKeys = ["score50", "score100", "score500", "score1000", "goldFood", "blueFood"];
        taskKeys.forEach((key, idx) => {
            let y = 85 + (idx * 52) - this.game.tasksScrollY;
            let isDone = tasks[key];
            ctx.fillStyle = isDone ? "#ffffff" : (this.game.isDarkTheme ? "#484f58" : "#6c7d93");
            ctx.fillText(`${isDone ? "[X]" : "[ ]"} ${t.taskList[key]}`, 42, y);
            ctx.font = "7.5px 'Press Start 2P'";
            ctx.fillStyle = isDone ? "#ffffff" : (this.game.isDarkTheme ? "#8b949e" : "#a2b0c3");
            ctx.fillText(t.taskList[key + "Desc"], 42, y + 15);
            ctx.font = "11px 'Press Start 2P'";
        });
        
        ctx.restore();
        ctx.fillStyle = this.game.isDarkTheme ? "#21262d" : "#1b2530";
        ctx.fillRect(355, 65, 4, 255);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(355, 65 + (this.game.tasksScrollY / this.game.maxTasksScrollY) * 165, 4, 90);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "10px 'Press Start 2P'";
        ctx.fillText(t.back, 200, 365);
    }

    drawAchievementsScreen() {
        const t = i18n[this.game.currentLang];
        const ctx = this.ctx;
        
        ctx.fillStyle = this.game.isDarkTheme ? "#161b22" : "#2b3a4a";
        ctx.fillRect(20, 15, 360, 370);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(26, 21, 348, 358);
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(t.achievementsTitle, 200, 45);
        ctx.fillRect(40, 54, 320, 2);
        ctx.save();
        ctx.beginPath();
        ctx.rect(30, 60, 340, 265);
        ctx.clip();
        
        const achKeys = Object.keys(achievements);
        const hiddenKeys = ["cyborg", "hawkTactics", "dietMode", "identityCrisis", "greed"];
        achKeys.forEach((key, idx) => {
            let y = 85 + (idx * 45) - this.game.achScrollY;
            let isDone = achievements[key];
            let isHidden = hiddenKeys.includes(key);
            ctx.font = "10px 'Press Start 2P'";
            ctx.textAlign = "left";
            
            if (isHidden) {
                ctx.fillStyle = isDone ? "#ffb900" : (this.game.isDarkTheme ? "#484f58" : "#6c7d93");
            } else {
                ctx.fillStyle = isDone ? "#ffffff" : (this.game.isDarkTheme ? "#484f58" : "#6c7d93");
            }
            
            if (isHidden && !isDone) {
                ctx.fillText(`[ ] ${t.unknownTask}`, 42, y);
                ctx.font = "7px 'Press Start 2P'";
                ctx.fillStyle = this.game.isDarkTheme ? "#58a6ff" : "#a2b0c3";
                ctx.fillText(`* ${t.secretTaskDesc} *`, 42, y + 13);
            } else {
                ctx.fillText(`${isDone ? "[X]" : "[ ]"} ${t.achList[key]}`, 42, y);
                ctx.font = "7px 'Press Start 2P'";
                ctx.fillStyle = isDone ? "#ffffff" : (this.game.isDarkTheme ? "#8b949e" : "#a2b0c3");
                ctx.fillText(t.achList[key + "Desc"], 42, y + 13);
            }
        });
        
        ctx.restore();
        ctx.fillStyle = this.game.isDarkTheme ? "#21262d" : "#1b2530";
        ctx.fillRect(355, 65, 4, 255);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(355, 65 + (this.game.achScrollY / this.game.maxAchScrollY) * 165, 4, 90);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "10px 'Press Start 2P'";
        ctx.fillText(t.back, 200, 365);
    }

    drawAboutScreen() {
        const t = i18n[this.game.currentLang];
        const ctx = this.ctx;
        
        // Принудительно обновляем данные о игре при открытии экрана
        if (this.game.aboutLogic) {
            this.game.aboutLogic.loadAboutText();
        }
        
        ctx.fillStyle = this.game.isDarkTheme ? "#161b22" : "#2b3a4a";
        ctx.fillRect(20, 10, 360, 380);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(26, 16, 348, 368);
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(t.aboutTitle, 200, 45);
        ctx.fillRect(40, 54, 320, 2);
        ctx.save();
        ctx.beginPath();
        ctx.rect(30, 55, 340, 275);
        ctx.clip();
        
        const textLines = this.game.externalAboutData[this.game.currentLang] || [];
        this.githubLinkRect = null;
        
        // Если данных нет, показываем сообщение о загрузке
        if (textLines.length === 0) {
            ctx.font = "7px 'Press Start 2P'";
            ctx.fillStyle = "#ffffff";
            ctx.fillText("LOADING...", 200, 200);
        } else {
            textLines.forEach((line, idx) => {
                let y = 85 + (idx * 22) - this.game.aboutScrollY;
                ctx.textAlign = "left";
                
                if (line.includes("GITHUB")) {
                    ctx.fillStyle = "#58a6ff";
                    ctx.font = "7px 'Press Start 2P'";
                    // Сохраняем позицию ссылки для клика
                    const textWidth = ctx.measureText(line).width;
                    this.githubLinkRect = {
                        x: 40,
                        y: y - 8,
                        width: textWidth,
                        height: 12,
                        url: line.split(": ")[1] || line
                    };
                    // Рисуем подчёркивание
                    ctx.fillRect(40, y + 2, textWidth, 1);
                    ctx.fillText(line, 40, y);
                } else {
                    ctx.font = (idx === 0) ? "10px 'Press Start 2P'" : "7px 'Press Start 2P'";
                    let isHeader = idx === 0 || line.startsWith("УПРАВЛЕНИЕ:") || line.startsWith("CONTROLS:") || line.startsWith("РЕЖИМЫ:") || line.startsWith("MODES:");
                    ctx.fillStyle = isHeader ? "#ffffff" : (this.game.isDarkTheme ? "#8b949e" : "#a2b0c3");
                    ctx.fillText(line, 40, y);
                }
            });
        }
        
        // Если ссылка не найдена в данных, добавляем её вручную внизу списка
        if (!this.githubLinkRect) {
            const githubText = this.game.currentLang === "RU" 
                ? "GITHUB: https://github.com/AlexanderRU44/netsnake10"
                : "GITHUB: https://github.com/AlexanderRU44/netsnake10";
            const y = 85 + (textLines.length * 22) - this.game.aboutScrollY;
            ctx.fillStyle = "#58a6ff";
            ctx.font = "7px 'Press Start 2P'";
            const textWidth = ctx.measureText(githubText).width;
            this.githubLinkRect = {
                x: 40,
                y: y - 8,
                width: textWidth,
                height: 12,
                url: "https://github.com/AlexanderRU44/netsnake10"
            };
            ctx.fillRect(40, y + 2, textWidth, 1);
            ctx.fillText(githubText, 40, y);
        }
        
        ctx.restore();
        ctx.fillStyle = this.game.isDarkTheme ? "#21262d" : "#1b2530";
        ctx.fillRect(355, 65, 4, 255);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(355, 65 + (this.game.aboutScrollY / this.game.maxAboutScrollY) * 135, 4, 120);
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "10px 'Press Start 2P'";
        ctx.fillText(t.back, 200, 365);
    }

    // Метод для проверки клика по ссылке
    checkGithubClick(mouseX, mouseY) {
        if (this.githubLinkRect && 
            mouseX >= this.githubLinkRect.x && 
            mouseX <= this.githubLinkRect.x + this.githubLinkRect.width &&
            mouseY >= this.githubLinkRect.y && 
            mouseY <= this.githubLinkRect.y + this.githubLinkRect.height) {
            window.open(this.githubLinkRect.url, '_blank');
            return true;
        }
        return false;
    }
}