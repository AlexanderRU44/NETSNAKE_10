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

export function unlockAchievement(id, achievementsObj) {
    if (!achievementsObj[id]) {
        achievementsObj[id] = true;
        localStorage.setItem("ach_" + id, "true");
        return true;
    }
    return false;
}