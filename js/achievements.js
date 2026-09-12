export let achievements = {
    firstBlood: localStorage.getItem("ach_firstBlood") === "true",
    speedDemon: localStorage.getItem("ach_speedDemon") === "true",
    energyDrink: localStorage.getItem("ach_energyDrink") === "true",
    vegetarian: localStorage.getItem("ach_vegetarian") === "true",
    survivor: localStorage.getItem("ach_survivor") === "true",
    blindManeuver: localStorage.getItem("ach_blindManeuver") === "true",
    cyborg: localStorage.getItem("ach_cyborg") === "true",
    hawkTactics: localStorage.getItem("ach_hawkTactics") === "true",
    dietMode: localStorage.getItem("ach_dietMode") === "true",
    identityCrisis: localStorage.getItem("ach_identityCrisis") === "true",
    greed: localStorage.getItem("ach_greed") === "true"
};

export let isChameleonUnlocked = localStorage.getItem("snake_chameleon_unlocked") === "true";

// Награда рубинами за достижение
const ACH_REWARDS = {
    firstBlood: 3,
    speedDemon: 5,
    energyDrink: 5,
    vegetarian: 10,
    survivor: 8,
    blindManeuver: 15,
    cyborg: 20,
    hawkTactics: 12,
    dietMode: 10,
    identityCrisis: 10,
    greed: 15
};

export function unlockAchievement(id, achievementsObj) {
    if (!achievementsObj[id]) {
        achievementsObj[id] = true;
        localStorage.setItem("ach_" + id, "true");
        // Обновляем статус хамелеона при разблокировке
        if (id === "cyborg") {
            localStorage.setItem("snake_chameleon_unlocked", "true");
            isChameleonUnlocked = true;
        }
        // FIX: награда рубинами за достижение
        const reward = ACH_REWARDS[id] || 5;
        if (window.gameRef && window.gameRef.currency) {
            window.gameRef.currency.add(reward);
        }
        return true;
    }
    return false;
}
