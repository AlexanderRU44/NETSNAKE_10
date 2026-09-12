// shop.js — каталог товаров магазина

export const SHOP_ITEMS = [
    // === Скины ===
    {
        id: 'skin_green',
        type: 'skin',
        price: 100,
        icon: '🐍',
        colorIdx: 1, // индекс в snakeColors
        nameRU: 'ЗЕЛЁНАЯ ЗМЕЙКА',
        nameEN: 'GREEN SNAKE',
        descRU: 'Классический зелёный цвет',
        descEN: 'Classic green color'
    },
    {
        id: 'skin_blue',
        type: 'skin',
        price: 100,
        icon: '🔵',
        colorIdx: 2,
        nameRU: 'СИНЯЯ ЗМЕЙКА',
        nameEN: 'BLUE SNAKE',
        descRU: 'Спокойный синий',
        descEN: 'Calm blue'
    },
    {
        id: 'skin_ruby',
        type: 'skin',
        price: 150,
        icon: '🔴',
        colorIdx: 3,
        nameRU: 'РУБИНОВАЯ',
        nameEN: 'RUBY',
        descRU: 'Яркий красный',
        descEN: 'Bright red'
    },
    {
        id: 'skin_rainbow',
        type: 'skin',
        price: 500,
        icon: '🌈',
        colorIdx: 4,
        nameRU: 'РАДУЖНАЯ',
        nameEN: 'RAINBOW',
        descRU: 'Переливается всеми цветами',
        descEN: 'Shimmering rainbow'
    },

    // === Одноразовые бонусы (на 1 игру) ===
    {
        id: 'boost_start',
        type: 'consumable',
        price: 50,
        icon: '⚡',
        nameRU: 'УСКОРЕННЫЙ СТАРТ',
        nameEN: 'QUICK START',
        descRU: 'Начать игру с 5 еды (+5 длины)',
        descEN: 'Start with 5 extra segments'
    },
    {
        id: 'boost_shield',
        type: 'consumable',
        price: 80,
        icon: '🛡️',
        nameRU: 'СТАРТОВЫЙ ЩИТ',
        nameEN: 'STARTING SHIELD',
        descRU: 'Начать с активным щитом',
        descEN: 'Start with an active shield'
    },
    {
        id: 'boost_gift',
        type: 'consumable',
        price: 200,
        icon: '🎁',
        nameRU: 'ПОДАРОК В НАЧАЛЕ',
        nameEN: 'STARTING GIFT',
        descRU: 'Начать игру с подарком (+50)',
        descEN: 'Start with a gift (+50)'
    },
    {
        id: 'boost_double',
        type: 'consumable',
        price: 300,
        icon: '💎',
        nameRU: 'ДВОЙНОЙ СЧЁТ',
        nameEN: 'DOUBLE SCORE',
        descRU: 'Одна игра со счётом ×2',
        descEN: 'One game with double score'
    },

    // === Постоянные бонусы ===
    {
        id: 'perk_luck',
        type: 'permanent',
        price: 150,
        icon: '🍀',
        nameRU: 'УДАЧА',
        nameEN: 'LUCK',
        descRU: 'Редкая еда появляется чаще',
        descEN: 'Rare food appears more often'
    },
    {
        id: 'perk_trail',
        type: 'permanent',
        price: 400,
        icon: '✨',
        nameRU: 'РАДУЖНЫЙ СЛЕД',
        nameEN: 'RAINBOW TRAIL',
        descRU: 'Красивый шлейф за змейкой',
        descEN: 'Beautiful trail behind snake'
    }
];

export function getItemById(id) {
    return SHOP_ITEMS.find(item => item.id === id) || null;
}
