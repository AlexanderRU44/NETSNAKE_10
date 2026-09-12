// currency.js — управление валютой (рубинами)

const STORAGE_KEY = 'snake_crystals';
const PURCHASES_KEY = 'snake_purchases';

export class Currency {
    constructor(game) {
        this.game = game;
        this.crystals = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        this.purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '{}');
        this.activeBonuses = {};
    }

    add(amount) {
        if (amount <= 0) return;
        this.crystals += amount;
        this.save();
    }

    spend(amount) {
        if (this.crystals < amount) return false;
        this.crystals -= amount;
        this.save();
        return true;
    }

    has(itemId) {
        return !!this.purchases[itemId];
    }

    markPurchased(itemId) {
        this.purchases[itemId] = true;
        this.save();
    }

    save() {
        localStorage.setItem(STORAGE_KEY, String(this.crystals));
        localStorage.setItem(PURCHASES_KEY, JSON.stringify(this.purchases));
    }

    reset() {
        this.crystals = 0;
        this.purchases = {};
        this.activeBonuses = {};
        this.save();
    }
}
