export class NameInputManager {
    constructor(game, nameOverlay, nameInput, overlayLabel, btnSaveName) {
        this.game = game;
        this.nameOverlay = nameOverlay;
        this.nameInput = nameInput;
        this.overlayLabel = overlayLabel;
        this.btnSaveName = btnSaveName;
    }

    openNameInput() {
        const t = this.game.i18n[this.game.currentLang];
        this.overlayLabel.innerText = t.enterName;
        this.btnSaveName.innerText = t.saveBtn;
        this.nameInput.value = this.game.playerName;
        this.nameOverlay.style.display = "flex";
        this.game.currentScreen = "EDIT_NAME";
        setTimeout(() => this.nameInput.focus(), 50);
    }

    saveNameInput() {
        let val = this.nameInput.value.trim().toUpperCase();
        val = val.replace(/[^A-ZА-Я0-9_]/g, '');
        if (val === "") val = "PLAYER";
        this.game.playerName = val.substring(0, 8);
        localStorage.setItem("snake_player_name", this.game.playerName);
        this.nameOverlay.style.display = "none";
        this.game.currentScreen = "SETTINGS";
        this.game.updateHUD();
    }
}