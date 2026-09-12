export const i18n = {
    RU: {
        score: "СЧЕТ", hi: "РЕКОРД", bestBy: "ОТ", pause: "ПАУЗА", gameOver: "ФИНИШ", settings: "ОПЦИИ",
        continue: "ИГРАТЬ", newGame: "ЗАНОВО", speed: "СКОРОСТЬ",
        sound: "ЗВУК", lang: "ЯЗЫК", name: "ИМЯ", snakeColor: "ЗМЕЙКА", theme: "ТЕМА", themeModes: ["СВЕТЛАЯ", "ТЁМНАЯ", "АВТО"],
        speedModes: ["ЛЕГКО", "НОРМ", "АД"], toggleModes: ["ВЫКЛ", "ВКЛ"], locked: "ЗАБЛОКИР.",
        records: "РЕКОРДЫ", loading: "ЗАГРУЗКА...", globalTop: "TOP 10", enterName: "ВВЕДИТЕ ИМЯ:",
        empty: "ПУСТО", back: "BACK - В ГЛАВНОЕ МЕНЮ", saveBtn: "ЦЕНТР(ОК) - СОХРАНИТЬ",
        tasksMenu: "ЗАДАНИЯ", tasksTitle: "ЗАДАНИЯ",
        achievementsMenu: "ДОСТИЖЕНИЯ", achievementsTitle: "ДОСТИЖЕНИЯ",
        unknownTask: "???", secretTaskDesc: "СЕКРЕТНОЕ ЗАДАНИЕ",
        menu: "MENU", backBtn: "BACK", ok: "OK",
        modesMenu: "РЕЖИМЫ", modesTitle: "ВЫБОР РЕЖИМА",
        modeInfoMenu: "О РЕЖИМЕ",
        gameModes: [
            "КЛАССИКА", "СТЕНЫ", "КАМНИ", "ПРИЗРАК", "ДВИЖ. КАМНИ", "ПРОТИВ ИИ", "НА ВРЕМЯ", "БЕГУЩАЯ ЕДА",
            "СБОР МОНЕТ", "ТЕЛЕПОРТЫ"
        ],
        modeDescriptions: [
            "Классическая змейка. Еда +1, длина растёт, стены телепортируют.",
            "Стены смертельны. Осторожно на границах поля!",
            "8 неподвижных камней на поле. Столкновение = смерть.",
            "За змейкой остаются призрачные следы. Касание следа = смерть.",
            "Камни движутся каждые 15 тиков. Перед движением камень мигает.",
            "Битва против ИИ-соперника. Кто наберёт больше очков?",
            "60 секунд на выполнение. Каждая еда +5 секунд.",
            "Еда каждые 3 секунды перемещается на новое место.",
            "Собирайте золотые монеты (+1). Еды нет, змейка растёт.",
            "2 портала на поле. Вход в один = телепорт в другой."
        ],
        modeInfoTitle: "ИНФОРМАЦИЯ О РЕЖИМЕ",
        modeInfoCurrent: "ТЕКУЩИЙ РЕЖИМ:",
        aboutMenu: "О ИГРЕ", aboutTitle: "О ИГРЕ",
        nextFood: "СЛЕДУЮЩАЯ ЕДА:",
        moved: "ПЕРЕМЕЩЕНА!",
        turbo: "ТУРБО!",
        shrink: "УМЕНЬШЕНИЕ",
        shield: "ЩИТ",
        shieldDesc: "ЗАЩИЩАЕТ ОТ ОДНОГО СТОЛКНОВЕНИЯ",
        github: "GITHUB: https://github.com/AlexanderRU44/netsnake10",
        portal: "ПОРТАЛ!",
        shopMenu: "МАГАЗИН",
        shopTitle: "МАГАЗИН КРИСТАЛЛОВ",
        crystals: "КРИСТАЛЛЫ",
        buy: "КУПИТЬ",
        owned: "КУПЛЕНО",
        notEnough: "НЕ ХВАТАЕТ КРИСТАЛЛОВ",
        purchased: "КУПЛЕНО!",
        ruby: "РУБИН",
        rubyDesc: "Собери рубин, пока он не исчез!",
        resetCache: "СБРОСИТЬ КЭШ",
        resetCacheConfirm: "ОБНОВИТЬ ИГРУ?",
        resetCacheHint: "OK - ОБНОВИТЬ",
        taskList: {
            score50: "ПЕРВЫЙ ШАГ", score50Desc: "НАБЕРИТЕ 50 ОЧКОВ",
            score100: "ЛОВКАЧ", score100Desc: "НАБЕРИТЕ 100 ОЧКОВ",
            score500: "ПРОФЕССИОНАЛ", score500Desc: "НАБЕРИТЕ 500 ОЧКОВ",
            score1000: "ГРОССМЕЙСТЕР", score1000Desc: "НАБЕРИТЕ 1000 ОЧКОВ",
            goldFood: "ГУРМАН", goldFoodDesc: "СЪЕШЬТЕ ЗОЛОТОЕ ЯБЛОКО",
            blueFood: "АСКЕТ", blueFoodDesc: "СЪЕШЬТЕ СИНЮЮ ЕДУ"
        },
        achList: {
            firstBlood: "ПЕРВАЯ КРОВЬ", firstBloodDesc: "НАБЕРИТЕ 10 ИЛИ БОЛЕЕ ОЧКОВ",
            speedDemon: "СКОРОСТНОЙ ДЕМОН", speedDemonDesc: "СЫГРАЙТЕ НА СЛОЖНОСТИ АД",
            energyDrink: "ЭНЕРГЕТИК", energyDrinkDesc: "АКТИВИРУЙТЕ РЕЖИМ ТУРБО",
            vegetarian: "ВЕГЕТАРИАНЕЦ", vegetarianDesc: "СЪЕШЬТЕ 15 ОБЫЧНЫХ ЯБЛОК ПОДРЯД",
            survivor: "ВЫЖИВШИЙ", survivorDesc: "СЫГРАЙТЕ 5 ИГР НА УСТРОЙСТВЕ",
            blindManeuver: "СЛЕПОЙ МАНЕВР", blindManeuverDesc: "30+ ОЧКОВ В РЕЖИМЕ ПРИЗРАК",
            cyborg: "КИБОРГ", cyborgDesc: "АКТИВИРУЙТЕ РЕЖИМ ИИ ЧЕРЕЗ ЧИТ-КОД",
            hawkTactics: "ТАКТИКА КОРШУНА", hawkTacticsDesc: "СЪЕШЬТЕ РЕДКОЕ ЯБЛОКО МЕНЕЕ ЧЕМ ЗА 5 ТИКОВ ДО ИСЧЕЗНОВЕНИЯ",
            dietMode: "ДИЕТА", dietModeDesc: "СЪЕШЬТЕ СИНЕЕ ЯБЛОКО ПРИ ДЛИНЕ ЗМЕЙКИ В 3 БЛОКА",
            identityCrisis: "КРИЗИС ИДЕНТИЧНОСТИ", identityCrisisDesc: "СМЕНИТЕ ТЕМУ ОФОРМЛЕНИЯ 5 РАЗ ЗА СЕССИЮ",
            greed: "ЖАДНОСТЬ", greedDesc: "ПОГИБНИТЕ В ШАГЕ ОТ ЗОЛОТОГО ЯБЛОКА"
        },
        modeDetails: {
            classic: [
                "• КЛАССИЧЕСКАЯ МЕХАНИКА ЗМЕЙКИ",
                "• ЕДА +1 ОЧКО, ДЛИНА РАСТЁТ",
                "• СТЕНЫ ТЕЛЕПОРТИРУЮТ (БЕЗ СМЕРТИ)",
                "• РЕДКАЯ ЕДА: ЗОЛОТО (+10), СИНЯЯ (УМЕНЬШЕНИЕ)",
                "• ТУРБО-РЕЖИМ: УСКОРЕНИЕ + УВЕЛИЧЕННЫЙ СЧЁТ"
            ],
            walls: [
                "• СТЕНЫ СМЕРТЕЛЬНЫ - НЕ ВРЕЗАЙТЕСЬ!",
                "• ВЫХОД ЗА ГРАНИЦУ = КОНЕЦ ИГРЫ",
                "• ТРЕБУЕТ ПОВЫШЕННОЙ ВНИМАТЕЛЬНОСТИ",
                "• ОСТОРОЖНО НА ПОВОРОТАХ У КРАЁВ"
            ],
            stones: [
                "• 8 НЕПОДВИЖНЫХ КАМНЕЙ НА ПОЛЕ",
                "• СТОЛКНОВЕНИЕ С КАМНЕМ = СМЕРТЬ",
                "• КАМНИ НЕ ДВИГАЮТСЯ",
                "• ТРЕБУЕТСЯ ТОЧНОЕ ПЛАНИРОВАНИЕ МАРШРУТА"
            ],
            ghost: [
                "• ЗА ЗМЕЙКОЙ ОСТАЮТСЯ СЛЕДЫ",
                "• КАСАНИЕ СЛЕДА = СМЕРТЬ",
                "• СЛЕДЫ ИСЧЕЗАЮТ ЧЕРЕЗ 25 ТИКОВ",
                "• ТРЕБУЕТСЯ АККУРАТНОЕ МАНЕВРИРОВАНИЕ"
            ],
            movingStones: [
                "• КАМНИ ПЕРЕМЕЩАЮТСЯ КАЖДЫЕ 15 ТИКОВ",
                "• ПЕРЕД ДВИЖЕНИЕМ КАМЕНЬ МИГАЕТ",
                "• ТРЕБУЕТ ПРОГНОЗИРОВАНИЯ ДВИЖЕНИЙ",
                "• ВЫЗОВ ДЛЯ ОПЫТНЫХ ИГРОКОВ"
            ],
            vsAI: [
                "• БИТВА ПРОТИВ ИСКУССТВЕННОГО ИНТЕЛЛЕКТА",
                "• КТО НАБЕРЁТ БОЛЬШЕ ОЧКОВ?",
                "• ИИ ИСПОЛЬЗУЕТ АЛГОРИТМ ПОИСКА ПУТИ",
                "• ПОБЕДА = ВЫШЕ СЧЁТ ЧЕМ У ИИ"
            ],
            timeMode: [
                "• 60 СЕКУНД НА ВЫПОЛНЕНИЕ",
                "• КАЖДАЯ ЕДА +5 СЕКУНД",
                "• ПРИ 10 СЕКУНДАХ ЭКРАН МИГАЕТ",
                "• ВРЕМЯ = ГЛАВНЫЙ ВРАГ"
            ],
            rushMode: [
                "• ЕДА ПЕРЕМЕЩАЕТСЯ КАЖДЫЕ 3 СЕКУНДЫ",
                "• НУЖНО БЫТЬ БЫСТРЕЕ ЕДЫ",
                "• ДОБАВЛЯЕТ ЭЛЕМЕНТ ХАОСА",
                "• ТРЕБУЕТ БЫСТРОЙ РЕАКЦИИ"
            ],
            coinCollector: [
                "• СОБИРАЙТЕ ЗОЛОТЫЕ МОНЕТЫ (+1)",
                "• ЗМЕЙКА РАСТЁТ ПРИ СБОРЕ МОНЕТ",
                "• ЕДА ОТСУТСТВУЕТ НА ПОЛЕ",
                "• 30 МОНЕТ НА ПОЛЕ, ОБНОВЛЯЮТСЯ",
                "• СТЕНЫ РАБОТАЮТ КАК В КЛАССИКЕ"
            ],
            portals: [
                "• 2 ПОРТАЛА НА ПОЛЕ",
                "• ВХОД В ОДИН = ТЕЛЕПОРТ В ДРУГОЙ",
                "• ПОРТАЛЫ ПЕРЕМЕЩАЮТСЯ КАЖДЫЕ 5 СЕКУНД",
                "• ВИЗУАЛЬНЫЙ И ЗВУКОВОЙ ЭФФЕКТ",
                "• СТЕНЫ ТЕЛЕПОРТИРУЮТ КАК В КЛАССИКЕ"
            ]
        }
    },
    EN: {
        score: "SCORE", hi: "BEST", bestBy: "BY", pause: "PAUSE", gameOver: "GAME OVER", settings: "SETUP",
        continue: "PLAY", newGame: "RETRY", speed: "SPEED",
        sound: "AUDIO", lang: "LANG", name: "NAME", snakeColor: "SNAKE", theme: "THEME", themeModes: ["LIGHT", "DARK", "AUTO"],
        speedModes: ["EASY", "NORM", "HELL"], toggleModes: ["OFF", "ON"], locked: "LOCKED",
        records: "RECORDS", loading: "LOADING...", globalTop: "TOP 10", enterName: "ENTER NAME:",
        empty: "EMPTY", back: "BACK - TO MAIN MENU", saveBtn: "CENTER(OK) - SAVE",
        tasksMenu: "TASKS", tasksTitle: "TASKS LIST",
        achievementsMenu: "ACHIEVEMENTS", achievementsTitle: "ACHIEVEMENTS",
        unknownTask: "???", secretTaskDesc: "SECRET TASK",
        menu: "MENU", backBtn: "BACK", ok: "OK",
        modesMenu: "MODES", modesTitle: "SELECT MODE",
        modeInfoMenu: "MODE INFO",
        gameModes: [
            "CLASSIC", "WALLS", "STONES", "GHOST", "MOVING STONES", "VS AI", "TIME MODE", "RUSH MODE",
            "COIN COLLECTOR", "PORTALS"
        ],
        modeDescriptions: [
            "Classic snake. Food +1, grows, walls wrap around.",
            "Walls are deadly. Watch the borders!",
            "8 static stones on the field. Crash = death.",
            "Ghost trails remain behind. Touching a trail = death.",
            "Stones move every 15 ticks. Stone flashes before moving.",
            "Battle vs AI opponent. Who scores higher?",
            "60 seconds time limit. Each food +5 seconds.",
            "Food teleports to new location every 3 seconds.",
            "Collect gold coins (+1 each). No food, snake grows.",
            "2 portals on the field. Enter one = teleport to other."
        ],
        modeInfoTitle: "MODE INFO",
        modeInfoCurrent: "CURRENT MODE:",
        aboutMenu: "ABOUT", aboutTitle: "ABOUT GAME",
        nextFood: "NEXT FOOD:",
        moved: "MOVED!",
        turbo: "TURBO!",
        shrink: "SHRINK",
        shield: "SHIELD",
        shieldDesc: "PROTECTS FROM ONE COLLISION",
        github: "GITHUB: https://github.com/AlexanderRU44/netsnake10",
        portal: "PORTAL!",
        shopMenu: "SHOP",
        shopTitle: "CRYSTAL SHOP",
        crystals: "CRYSTALS",
        buy: "BUY",
        owned: "OWNED",
        notEnough: "NOT ENOUGH CRYSTALS",
        purchased: "PURCHASED!",
        ruby: "RUBY",
        rubyDesc: "Collect the ruby before it disappears!",
        resetCache: "CLEAR CACHE",
        resetCacheConfirm: "UPDATE GAME?",
        resetCacheHint: "OK - UPDATE",
        taskList: {
            score50: "FIRST STEP", score50Desc: "REACH 50 POINTS",
            score100: "NIMBLE", score100Desc: "REACH 100 POINTS",
            score500: "PROFESSIONAL", score500Desc: "REACH 500 POINTS",
            score1000: "GRANDMASTER", score1000Desc: "REACH 1000 POINTS",
            goldFood: "GOURMET", goldFoodDesc: "EAT A GOLDEN APPLE",
            blueFood: "ASCETIC", blueFoodDesc: "EAT A BLUE SHRINK FOOD"
        },
        achList: {
            firstBlood: "FIRST BLOOD", firstBloodDesc: "SCORE 10 OR MORE POINTS",
            speedDemon: "SPEED DEMON", speedDemonDesc: "PLAY ON HELL DIFFICULTY",
            energyDrink: "ENERGY DRINK", energyDrinkDesc: "ACTIVATE TURBO MODE",
            vegetarian: "VEGETARIAN", vegetarianDesc: "EAT 15 REGULAR APPLES IN A ROW",
            survivor: "SURVIVOR", survivorDesc: "PLAY 5 GAMES ON THIS DEVICE",
            blindManeuver: "BLIND MANEUVER", blindManeuverDesc: "SCORE 30+ POINTS IN GHOST MODE",
            cyborg: "CYBORG", cyborgDesc: "ACTIVATE AI MODE VIA CHEAT CODE",
            hawkTactics: "HAWK TACTICS", hawkTacticsDesc: "EAT RARE FOOD WITHIN 5 TICKS BEFORE VANISHING",
            dietMode: "DIET MODE", dietModeDesc: "EAT A SHRINK FOOD WITH SNAKE LENGTH OF 3",
            identityCrisis: "IDENTITY CRISIS", identityCrisisDesc: "SWITCH THE DESIGN THEME 5 TIMES IN MENU",
            greed: "GREED", greedDesc: "DIE JUST ONE STEP AWAY FROM A GOLDEN APPLE"
        },
        modeDetails: {
            classic: [
                "• CLASSIC SNAKE MECHANICS",
                "• FOOD +1 POINT, SNAKE GROWS",
                "• WALLS WRAP AROUND (NO DEATH)",
                "• RARE FOOD: GOLD (+10), BLUE (SHRINK)",
                "• TURBO MODE: SPEED BOOST + EXTRA SCORE"
            ],
            walls: [
                "• WALLS ARE DEADLY - DON'T CRASH!",
                "• LEAVING THE BORDER = GAME OVER",
                "• REQUIRES EXTRA ATTENTION",
                "• BE CAREFUL AT TURNS NEAR EDGES"
            ],
            stones: [
                "• 8 STATIC STONES ON THE FIELD",
                "• CRASHING INTO A STONE = DEATH",
                "• STONES DO NOT MOVE",
                "• REQUIRES PRECISE ROUTE PLANNING"
            ],
            ghost: [
                "• GHOST TRAILS REMAIN BEHIND",
                "• TOUCHING A TRAIL = DEATH",
                "• TRAILS DISAPPEAR AFTER 25 TICKS",
                "• REQUIRES CAREFUL MANEUVERING"
            ],
            movingStones: [
                "• STONES MOVE EVERY 15 TICKS",
                "• STONE FLASHES BEFORE MOVING",
                "• REQUIRES MOVEMENT PREDICTION",
                "• CHALLENGE FOR EXPERIENCED PLAYERS"
            ],
            vsAI: [
                "• BATTLE AGAINST ARTIFICIAL INTELLIGENCE",
                "• WHO SCORES HIGHER?",
                "• AI USES PATHFINDING ALGORITHM",
                "• VICTORY = SCORE HIGHER THAN AI"
            ],
            timeMode: [
                "• 60 SECOND TIME LIMIT",
                "• EACH FOOD +5 SECONDS",
                "• SCREEN FLASHES AT 10 SECONDS",
                "• TIME IS YOUR MAIN ENEMY"
            ],
            rushMode: [
                "• FOOD MOVES EVERY 3 SECONDS",
                "• NEED TO BE FASTER THAN FOOD",
                "• ADDS CHAOS ELEMENT",
                "• REQUIRES FAST REACTION"
            ],
            coinCollector: [
                "• COLLECT GOLD COINS (+1 EACH)",
                "• SNAKE GROWS WHEN COLLECTING COINS",
                "• NO FOOD ON THE FIELD",
                "• 30 COINS ON FIELD, REGENERATE",
                "• WALLS WORK LIKE IN CLASSIC MODE"
            ],
            portals: [
                "• 2 PORTALS ON THE FIELD",
                "• ENTER ONE = TELEPORT TO OTHER",
                "• PORTALS MOVE EVERY 5 SECONDS",
                "• VISUAL AND SOUND EFFECT",
                "• WALLS WRAP LIKE IN CLASSIC MODE"
            ]
        }
    }
};