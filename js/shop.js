export const SHOP_ITEMS = [
    // === Скины ===
    { id: 'skin_classic', type: 'skin', price: 0, unlockedByDefault: true, icon: '⚪', colorIdx: 0, nameRU: 'КЛАССИКА', nameEN: 'CLASSIC', descRU: 'Базовый цвет змейки', descEN: 'Basic snake color' },
    { id: 'skin_green', type: 'skin', price: 100, unlockedByDefault: false, icon: '🟢', colorIdx: 1, nameRU: 'ЗЕЛЁНАЯ ЗМЕЙКА', nameEN: 'GREEN SNAKE', descRU: 'Классический зелёный цвет', descEN: 'Classic green color' },
    { id: 'skin_blue', type: 'skin', price: 100, unlockedByDefault: false, icon: '🔵', colorIdx: 2, nameRU: 'СИНЯЯ ЗМЕЙКА', nameEN: 'BLUE SNAKE', descRU: 'Спокойный синий', descEN: 'Calm blue' },
    { id: 'skin_ruby', type: 'skin', price: 150, unlockedByDefault: false, icon: '🔴', colorIdx: 3, nameRU: 'РУБИНОВАЯ', nameEN: 'RUBY', descRU: 'Яркий красный', descEN: 'Bright red' },
    { id: 'skin_rainbow', type: 'skin', price: 500, unlockedByDefault: false, icon: '🌈', colorIdx: 4, nameRU: 'РАДУЖНАЯ', nameEN: 'RAINBOW', descRU: 'Переливается всеми цветами', descEN: 'Shimmering rainbow' },

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

// === ЦЕНЫ НА РАЗБЛОКИРУЕМЫЕ РЕЖИМЫ ===
export const MODE_PRICES = {
    1: 100,   // WALLS
    2: 150,   // STONES
    3: 150,   // GHOST
    4: 200,   // MOVING STONES
    5: 250,   // VS AI
    6: 200,   // TIME MODE
    7: 200,   // RUSH MODE
    8: 300,   // COINS
    9: 300,   // PORTALS
    10: 400,  // MAZE
    11: 500,  // NIGHT
    12: 600   // ENDLESS
};

export function getModePriceByModeIdx(modeIdx) {
    return MODE_PRICES[modeIdx] || 0;
}

export function getModeItemByModeIdx(modeIdx) {
    const price = getModePriceByModeIdx(modeIdx);
    if (!price) return null;
    return {
        id: `mode_${modeIdx}`,
        type: 'mode',
        modeIdx: modeIdx,
        price: price
    };
}

export const DEFAULT_UNLOCKED_MODES = [0];