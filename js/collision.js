import { unlockAchievement } from './achievements.js';
import { achievements } from './achievements.js';
import { playSound } from './utils.js';

const RUBY_VALUE = 3;

export class CollisionChecker {
    constructor(game) {
        this.game = game;
    }

    checkCollision() {
        const h = this.game.snake[0];
        const headX = h.x;
        const headY = h.y;

        // === СБОР РУБИНОВ (всегда) ===
        if (this.game.rubies && this.game.rubies.length) {
            for (let i = this.game.rubies.length - 1; i >= 0; i--) {
                const r = this.game.rubies[i];
                if (r.x === headX && r.y === headY) {
                    this.game.currency.add(RUBY_VALUE);
                    playSound("giftEat", this.game.soundEnabled);
                    this.game.particleSystem.addExplosion(r.x, r.y, "#00d4ff", 10);
                    this.game.rubies.splice(i, 1);
                    import('./utils.js').then(({ addFloatingScore }) => {
                        addFloatingScore(this.game.floatingScores, r.x, r.y, "+3", this.game.currentLang);
                    });
                }
            }
        }

        if (this.game.aiMode) return;

        let isOnPortal = false;
        if (this.game.currentModeIdx === 9 && this.game.specialModes.isPortalCell(headX, headY)) {
            isOnPortal = true;
        }

        if (this.game.foodType === "BIG" && this.game.food) {
            const distToGold = Math.abs(headX - this.game.food.x) + Math.abs(headY - this.game.food.y);
            this.game.goldDistanceBeforeDeath = distToGold;
        } else {
            this.game.goldDistanceBeforeDeath = null;
        }

        // === ХЕЛПЕР: попытка умереть с учётом щита ===
        const tryDie = () => {
            if (this.game.shieldActive) {
                // Щит спасает — выключаем и играем звук
                this.game.shieldActive = false;
                playSound("shieldBreak", this.game.soundEnabled);
                if (this.game.particleSystem) {
                    this.game.particleSystem.addExplosion(headX, headY, "#1e88e5", 12);
                }
                import('./utils.js').then(({ addFloatingScore }) => {
                    addFloatingScore(this.game.floatingScores, headX, headY, "SHIELD!", this.game.currentLang);
                });
                return false;
            }
            this.game.endGame();
            return true;
        };

        // === СТЕНЫ (режим 1) ===
        if (this.game.currentModeIdx === 1) {
            if (headX < 0 || headX >= this.game.tileCount || headY < 0 || headY >= this.game.tileCount) {
                return tryDie();
            }
        }

        // === Столкновение с собой ===
        for (let i = 1; i < this.game.snake.length; i++) {
            if (headX === this.game.snake[i].x && headY === this.game.snake[i].y) {
                return tryDie();
            }
        }

        // === Камни + лабиринт (режимы 2, 4, 10) ===
        if ([2, 4, 10].includes(this.game.currentModeIdx) && this.game.obstacles.length) {
            for (let obs of this.game.obstacles) {
                if (obs.x === headX && obs.y === headY) {
                    return tryDie();
                }
            }
        }

        // === Призрачные следы (режим 3) ===
        if (this.game.currentModeIdx === 3 && this.game.ghostTrails.length) {
            for (let gt of this.game.ghostTrails) {
                if (gt.x === headX && gt.y === headY) {
                    return tryDie();
                }
            }
        }

        // === AI соперник (режим 5) ===
        if (this.game.currentModeIdx === 5 && this.game.aiOpponent) {
            for (let seg of this.game.aiOpponent.snake) {
                if (seg.x === headX && seg.y === headY) {
                    return tryDie();
                }
            }
        }

        if (isOnPortal) return false;
        return false;
    }
}