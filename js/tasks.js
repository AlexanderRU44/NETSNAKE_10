export let tasks = {
    score50: false, score100: false, score500: false, score1000: false,
    goldFood: false, blueFood: false
};

export function completeTask(id, tasksObj, playSoundCallback, spawnGiftCallback) {
    if (!tasksObj[id]) {
        tasksObj[id] = true;
        playSoundCallback("taskComplete");
        if (spawnGiftCallback) spawnGiftCallback();
    }
}

export function checkScoreTasks(score, tasksObj, completeTaskCallback, unlockAchievementCallback, achievementsObj) {
    if (score >= 10) unlockAchievementCallback("firstBlood", achievementsObj);
    if (score >= 50) completeTaskCallback("score50", tasksObj);
    if (score >= 100) completeTaskCallback("score100", tasksObj);
    if (score >= 500) completeTaskCallback("score500", tasksObj);
    if (score >= 1000) completeTaskCallback("score1000", tasksObj);
}