// shopDrawer.js — отрисовка экрана магазина
import { i18n } from './i18n.js';
import { SHOP_ITEMS } from './shop.js';

export class ShopDrawer {
    constructor(ctx, game) {
        this.ctx = ctx;
        this.game = game;
    }

    wrapText(text, maxWidth, ctx) {
        if (!text) return [];
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        for (let word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            if (ctx.measureText(testLine).width > maxWidth && currentLine !== '') {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    draw() {
        const ctx = this.ctx;
        const t = i18n[this.game.currentLang];
        const isDark = this.game.isDarkTheme;

        // Фон
        ctx.fillStyle = isDark ? "#161b22" : "#2b3a4a";
        ctx.fillRect(20, 15, 360, 370);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.strokeRect(26, 21, 348, 358);

        // Заголовок
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px 'Press Start 2P'";
        ctx.textAlign = "center";
        ctx.fillText(t.shopTitle || "МАГАЗИН", 200, 45);

        // Баланс кристаллов
        ctx.font = "10px 'Press Start 2P'";
        ctx.fillStyle = "#ffd700";
        ctx.fillText(`${this.game.currency.crystals} 💎`, 200, 66);

        ctx.fillRect(40, 76, 320, 2);

        // Список товаров
        ctx.save();
        ctx.beginPath();
        ctx.rect(30, 82, 340, 260);
        ctx.clip();

        ctx.font = "9px 'Press Start 2P'";
        ctx.textAlign = "left";

        const itemHeight = 52;
        const scroll = this.game.shopScrollY || 0;

        SHOP_ITEMS.forEach((item, idx) => {
            const y = 105 + idx * itemHeight - scroll;
            if (y < 60 || y > 360) return; // обрезаем невидимое

            const isSelected = this.game.shopSelection === idx;
            const owned = this.game.currency.has(item.id);

            // Фон выделения
            if (isSelected) {
                ctx.fillStyle = isDark ? "rgba(88,166,255,0.15)" : "rgba(43,58,74,0.15)";
                ctx.fillRect(32, y - 14, 336, itemHeight - 6);
            }

            // Иконка
            ctx.font = "16px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            ctx.fillText(item.icon, 42, y);

            // Название
            ctx.font = "9px 'Press Start 2P'";
            const itemName = (this.game.currentLang === 'RU') ? item.nameRU : item.nameEN;
            ctx.fillStyle = owned ? "#7ed321" : (isSelected ? "#58a6ff" : "#ffffff");
            ctx.fillText(itemName, 75, y);

            // Описание
            ctx.font = "6px 'Press Start 2P'";
            ctx.fillStyle = isDark ? "#8b949e" : "#a2b0c3";
            const desc = (this.game.currentLang === 'RU') ? item.descRU : item.descEN;
            const descLines = this.wrapText(desc, 240, ctx);
            descLines.forEach((line, li) => {
                ctx.fillText(line, 75, y + 12 + li * 9);
            });

            // Цена / статус
            ctx.font = "9px 'Press Start 2P'";
            ctx.textAlign = "right";
            if (owned && item.type !== 'consumable') {
                ctx.fillStyle = "#7ed321";
                ctx.fillText("✓", 355, y);
            } else {
                ctx.fillStyle = this.game.currency.crystals >= item.price ? "#ffd700" : "#8b949e";
                ctx.fillText(`${item.price}💎`, 355, y);
            }
        });

        ctx.restore();

        // Скроллбар
        const totalHeight = SHOP_ITEMS.length * itemHeight;
        const maxScroll = Math.max(0, totalHeight - 260);
        if (maxScroll > 0) {
            ctx.fillStyle = isDark ? "#21262d" : "#1b2530";
            ctx.fillRect(355, 86, 4, 252);
            const scrollPercent = (this.game.shopScrollY || 0) / maxScroll;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(355, 86 + scrollPercent * 200, 4, 52);
        }

        // Подсказка снизу
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "8px 'Press Start 2P'";
        ctx.fillText(t.back || "BACK - НАЗАД", 200, 365);
    }
}
