const STORAGE_KEY = 'snake_crystals';
const PURCHASES_KEY = 'snake_purchases';
const MODES_KEY = 'snake_unlocked_modes';

export class Currency {
    constructor(game) {
        this.game = game;
        this.crystals = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        this.purchases = JSON.parse(localStorage.getItem(PURCHASES_KEY) || '{}');
        this.unlockedModes = this.loadUnlockedModes();
        this.activeBonuses = {};
    }

    loadUnlockedModes() {
        try {
            const saved = JSON.parse(localStorage.getItem(MODES_KEY) || '[0]');
            if (!Array.isArray(saved) || saved.length === 0) return [0];
            // Всегда включаем режим 0 (классика)
            if (!saved.includes(0)) saved.unshift(0);
            return saved;
        } catch (e) {
            return [0];
        }
    }

    saveUnlockedModes() {
        localStorage.setItem(MODES_KEY, JSON.stringify(this.unlockedModes));
    }

    isModeUnlocked(modeIdx) {
        if (modeIdx === 0) return true;
        return this.unlockedModes.includes(modeIdx);
    }

    unlockMode(modeIdx) {
        if (!this.unlockedModes.includes(modeIdx)) {
            this.unlockedModes.push(modeIdx);
            this.saveUnlockedModes();
        }
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
        this.unlockedModes = [0];
        this.activeBonuses = {};
        this.save();
        this.saveUnlockedModes();
    }
}