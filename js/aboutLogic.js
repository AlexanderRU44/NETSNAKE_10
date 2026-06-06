import { i18n } from './i18n.js';

export class AboutLogic {
    constructor(game) {
        this.game = game;
    }

    loadAboutText() {
        const lang = this.game.currentLang;
        const t = i18n[lang];
        
        this.game.externalAboutData = {
            "RU": [
                "NETSNAKE 10 V1.0", "КЛАССИЧЕСКАЯ ЗМЕЙКА", "В НОВОМ ФОРМАТЕ.", "",
                "УПРАВЛЕНИЕ:", "СТРЕЛКИ / WASD - ДВИЖЕНИЕ", "ENTER / SPACE - OK",
                "ESC - ГЛАВНОЕ МЕНЮ", "BACKSPACE - НАЗАД", "",
                t.github
            ],
            "EN": [
                "NETSNAKE 10 V1.0", "CLASSIC SNAKE GAME", "REIMAGINED.", "",
                "CONTROLS:", "ARROWS / WASD - MOVE", "ENTER / SPACE - OK",
                "ESC - MAIN MENU", "BACKSPACE - BACK", "",
                t.github
            ]
        };
        console.log("AboutLogic loaded:", this.game.externalAboutData);
    }
}