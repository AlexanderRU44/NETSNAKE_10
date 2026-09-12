// currency.js — управление валютой (кристаллами)

const STORAGE_KEY = 'snake_crystals';
const PURCHASES_KEY = 'snake_purchases';

export class Currency {
    constructor(game) {
        this.game = game;
        this.crystals = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        // Купленные товары (объект {itemId: true})
        this.purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '{}');
        // Активные бонусы (используются при старте игры)
        this.activeBonuses = {};
    }

    // === Начисление ===
    add(amount, reason = '') {
        if (amount <= 0) return;
        this.crystals += amount;
        this.save();
        if (this.game) {
            this.game.updateHUD();
            // Всплывающая надпись над головой змейки
            if (this.game.snake && this.game.snake[0]) {
                const head = this.game.snake[0];
                import('./utils.js').then(({ addFloatingScore }) => {
                    addFloatingScore(
                        this.game.floatingScores,
                        head.x, head.y,
                        `+${amount} 💎`,
                        this.game.currentLang
                    );
                });
            }
        }
    }

    // === Списание ===
    spend(amount) {
        if (this.crystals < amount) return false;
        this.crystals -= amount;
        this.save();
        if (this.game) this.game.updateHUD();
        return true;
    }

    // === Проверка покупки ===
    has(itemId) {
        return !!this.purchases[itemId];
    }

    // === Записать покупку ===
    markPurchased(itemId) {
        this.purchases[itemId] = true;
        this.save();
    }

    // === Сохранение ===
    save() {
        localStorage.setItem(STORAGE_KEY, String(this.crystals));
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(this.purchases));
    }

    // === Полный сброс (для отладки) ===
    reset() {
        this.crystals = 0;
        this.purchases = {};
        this.activeBonuses = {};
        this.save();
    }
}
