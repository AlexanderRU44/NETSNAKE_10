export const SHOP_ITEMS = [
    // === Скины ===
    { id: 'skin_classic', type: 'skin', price: 0, unlockedByDefault: true, icon: '⚪', colorIdx: 0, nameRU: 'КЛАССИКА', nameEN: 'CLASSIC', descRU: 'Базовый цвет змейки', descEN: 'Basic snake color' },
    { id: 'skin_green', type: 'skin', price: 100, unlockedByDefault: false, icon: '🟢', colorIdx: 1, nameRU: 'ЗЕЛЁНАЯ ЗМЕЙКА', nameEN: 'GREEN SNAKE', descRU: 'Классический зелёный цвет', descEN: 'Classic green color' },
    { id: 'skin_blue', type: 'skin', price: 100, unlockedByDefault: false, icon: '🔵', colorIdx: 2, nameRU: 'СИНЯЯ ЗМЕЙКА', nameEN: 'BLUE SNAKE', descRU: 'Спокойный синий', descEN: 'Calm blue' },
    { id: 'skin_ruby', type: 'skin', price: 150, unlockedByDefault: false, icon: '🔴', colorIdx: 3, nameRU: 'РУБИНОВАЯ', nameEN: 'RUBY', descRU: 'Яркий красный', descEN: 'Bright red' },
    { id: 'skin_rainbow', type: 'skin', price: 500, unlockedByDefault: false, icon: '🌈', colorIdx: 4, nameRU: 'РАДУЖНАЯ', nameEN: 'RAINBOW', descRU: 'Переливается всеми цветами', descEN: 'Shimmering rainbow' },

    // === Разблокировка режимов ===
    { id: 'mode_walls', type: 'mode', modeIdx: 1, price: 100, icon: '🧱', nameRU: 'РЕЖИМ: СТЕНЫ', nameEN: 'MODE: WALLS', descRU: 'Стены смертельны', descEN: 'Deadly walls' },
    { id: 'mode_stones', type: 'mode', modeIdx: 2, price: 150, icon: '🪨', nameRU: 'РЕЖИМ: КАМНИ', nameEN: 'MODE: STONES', descRU: '8 неподвижных камней', descEN: '8 static stones' },
    { id: 'mode_ghost', type: 'mode', modeIdx: 3, price: 150, icon: '👻', nameRU: 'РЕЖИМ: ПРИЗРАК', nameEN: 'MODE: GHOST', descRU: 'Призрачные следы', descEN: 'Ghost trails' },
    { id: 'mode_moving', type: 'mode', modeIdx: 4, price: 200, icon: '⚙️', nameRU: 'РЕЖИМ: ДВИЖ. КАМНИ', nameEN: 'MODE: MOVING STONES', descRU: 'Движущиеся камни', descEN: 'Moving stones' },
    { id: 'mode_vsai', type: 'mode', modeIdx: 5, price: 250, icon: '🤖', nameRU: 'РЕЖИМ: ПРОТИВ ИИ', nameEN: 'MODE: VS AI', descRU: 'Битва с ИИ', descEN: 'Battle vs AI' },
    { id: 'mode_time', type: 'mode', modeIdx: 6, price: 200, icon: '⏱️', nameRU: 'РЕЖИМ: НА ВРЕМЯ', nameEN: 'MODE: TIME', descRU: '60 секунд', descEN: '60 seconds' },
    { id: 'mode_rush', type: 'mode', modeIdx: 7, price: 200, icon: '🏃', nameRU: 'РЕЖИМ: БЕГУЩАЯ ЕДА', nameEN: 'MODE: RUSH', descRU: 'Еда убегает', descEN: 'Food runs away' },
    { id: 'mode_coins', type: 'mode', modeIdx: 8, price: 300, icon: '🪙', nameRU: 'РЕЖИМ: СБОР МОНЕТ', nameEN: 'MODE: COINS', descRU: 'Золотые монеты', descEN: 'Gold coins' },
    { id: 'mode_portals', type: 'mode', modeIdx: 9, price: 300, icon: '🌀', nameRU: 'РЕЖИМ: ТЕЛЕПОРТЫ', nameEN: 'MODE: PORTALS', descRU: '2 портала', descEN: '2 portals' },
    { id: 'mode_maze', type: 'mode', modeIdx: 10, price: 400, icon: '🧩', nameRU: 'РЕЖИМ: ЛАБИРИНТ', nameEN: 'MODE: MAZE', descRU: 'Стены-лабиринт', descEN: 'Maze walls' },
    { id: 'mode_night', type: 'mode', modeIdx: 11, price: 500, icon: '🌙', nameRU: 'РЕЖИМ: НОЧНОЙ', nameEN: 'MODE: NIGHT', descRU: 'Туман войны', descEN: 'Fog of war' },
    { id: 'mode_endless', type: 'mode', modeIdx: 12, price: 600, icon: '♾️', nameRU: 'РЕЖИМ: ЭНДЛЕСС', nameEN: 'MODE: ENDLESS', descRU: 'Бесконечное ускорение', descEN: 'Endless acceleration' },

    // === Одноразовые бонусы ===
    { id: 'boost_start', type: 'consumable', price: 50, icon: '⚡', nameRU: 'УСКОРЕННЫЙ СТАРТ', nameEN: 'QUICK START', descRU: 'Начать с +5 длины', descEN: 'Start with +5 length' },
    { id: 'boost_shield', type: 'consumable', price: 80, icon: '🛡️', nameRU: 'СТАРТОВЫЙ ЩИТ', nameEN: 'STARTING SHIELD', descRU: 'Начать со щитом', descEN: 'Start with shield' },
    { id: 'boost_gift', type: 'consumable', price: 200, icon: '🎁', nameRU: 'ПОДАРОК В НАЧАЛЕ', nameEN: 'STARTING GIFT', descRU: 'Начать с подарком (+50)', descEN: 'Start with gift (+50)' },
    { id: 'boost_double', type: 'consumable', price: 300, icon: '💎', nameRU: 'ДВОЙНОЙ СЧЁТ', nameEN: 'DOUBLE SCORE', descRU: 'Одна игра со счётом ×2', descEN: 'One game ×2 score' },

    // === Постоянные бонусы ===
    { id: 'perk_luck', type: 'permanent', price: 150, icon: '🍀', nameRU: 'УДАЧА', nameEN: 'LUCK', descRU: 'Рубины чаще', descEN: 'More rubies' },
    { id: 'perk_trail', type: 'permanent', price: 400, icon: '✨', nameRU: 'РАДУЖНЫЙ СЛЕД', nameEN: 'RAINBOW TRAIL', descRU: 'Красивый шлейф', descEN: 'Beautiful trail' }
];

export function getItemById(id) {
    return SHOP_ITEMS.find(item => item.id === id) || null;
}

export function getSkinItemByColorIdx(colorIdx) {
    return SHOP_ITEMS.find(item => item.type === 'skin' && item.colorIdx === colorIdx) || null;
}

export function getModeItemByModeIdx(modeIdx) {
    return SHOP_ITEMS.find(item => item.type === 'mode' && item.modeIdx === modeIdx) || null;
}

// Режимы, доступные по умолчанию (всё остальное — покупка)
export const DEFAULT_UNLOCKED_MODES = [0];