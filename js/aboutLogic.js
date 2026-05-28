export class AboutLogic {
    constructor(game) {
        this.game = game;
    }

    loadAboutText() {
        this.game.externalAboutData = {
            "RU": [
                "NETSNAKE 10 V1.0", "КЛАССИЧЕСКАЯ ЗМЕЙКА", "В НОВОМ ФОРМАТЕ.", "",
                "УПРАВЛЕНИЕ:", "СТРЕЛКИ / WASD - ДВИЖЕНИЕ", "ENTER / SPACE - OK",
                "ESC - ГЛАВНОЕ МЕНЮ", "BACKSPACE - НАЗАД", "",
                "🐍 GITHUB: https://github.com/AlexanderRU44/NETSNAKE_10"
            ],
            "EN": [
                "NETSNAKE 10 V1.0", "CLASSIC SNAKE GAME", "REIMAGINED.", "",
                "CONTROLS:", "ARROWS / WASD - MOVE", "ENTER / SPACE - OK",
                "ESC - MAIN MENU", "BACKSPACE - BACK", "",
                "🐍 GITHUB: https://github.com/AlexanderRU44/NETSNAKE_10"
            ]
        };
        console.log("AboutLogic loaded:", this.game.externalAboutData); // Отладка
    }
}