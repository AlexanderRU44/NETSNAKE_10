import { db, collection, addDoc, query, orderBy, limit, getDocs, where } from './firebase-config.js';

export class LeaderboardService {
    constructor(game) {
        this.game = game;
        this.globalTopTen = [];
        this.isLoadingLeaderboard = false;
    }

    async sendScoreToFirebase(finalScore) {
        if (this.game.isGameSubmitting || finalScore <= 0) return;
        if (this.game.usedAIThisSession) return;
        this.game.isGameSubmitting = true;
        try {
            await addDoc(collection(db, "global_leaderboard"), {
                playerName: this.game.playerName,
                score: Number(finalScore),
                mode: Number(this.game.currentModeIdx),
                timestamp: new Date()
            });
            await this.loadBestSingleScore();
        } catch (e) { console.error(e); }
        finally { this.game.isGameSubmitting = false; }
    }

    async loadBestSingleScore() {
        this.game.hiScore = localStorage.getItem(`snake_hi_score_mode_${this.game.currentModeIdx}`) || 0;
        this.game.bestPlayerName = localStorage.getItem(`snake_best_player_mode_${this.game.currentModeIdx}`) || "---";
        this.game.updateHUD();
        try {
            const q = query(
                collection(db, "global_leaderboard"), 
                where("mode", "==", this.game.currentModeIdx),
                orderBy("score", "desc"), 
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const bestDoc = querySnapshot.docs[0].data();
                this.game.hiScore = bestDoc.score;
                this.game.bestPlayerName = bestDoc.playerName;
                localStorage.setItem(`snake_hi_score_mode_${this.game.currentModeIdx}`, this.game.hiScore);
                localStorage.setItem(`snake_best_player_mode_${this.game.currentModeIdx}`, this.game.bestPlayerName);
                this.game.updateHUD();
            }
        } catch (e) { console.error(e); }
    }

    async loadTopTen() {
        this.isLoadingLeaderboard = true;
        this.game.isLoadingLeaderboard = true;
        try {
            const q = query(
                collection(db, "global_leaderboard"), 
                where("mode", "==", this.game.currentModeIdx),
                orderBy("score", "desc"), 
                limit(10)
            );
            const querySnapshot = await getDocs(q);
            this.globalTopTen = [];
            querySnapshot.forEach((doc) => { this.globalTopTen.push(doc.data()); });
            this.game.globalTopTen = this.globalTopTen;
        } catch (e) { console.error(e); }
        this.isLoadingLeaderboard = false;
        this.game.isLoadingLeaderboard = false;
    }
}