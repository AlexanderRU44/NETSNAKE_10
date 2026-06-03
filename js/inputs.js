export function setupInputHandlers(
    handleInput, handleCenter, handleMenuPress, handleBackPress, 
    triggerVibration, nameInput
) {
    const btnUp = document.getElementById("btn-up");
    const btnDown = document.getElementById("btn-down");
    const btnLeft = document.getElementById("btn-left");
    const btnRight = document.getElementById("btn-right");
    const btnMenu = document.getElementById("btn-menu");
    const btnBack = document.getElementById("btn-back");
    const btnSpace = document.getElementById("btn-space");

    btnUp.onclick = () => { triggerVibration(); handleInput("UP"); };
    btnDown.onclick = () => { triggerVibration(); handleInput("DOWN"); };
    btnLeft.onclick = () => { triggerVibration(); handleInput("LEFT"); };
    btnRight.onclick = () => { triggerVibration(); handleInput("RIGHT"); };
    btnMenu.onclick = () => { triggerVibration(); handleMenuPress(); };
    btnBack.onclick = () => { triggerVibration(); handleBackPress(); };
    btnSpace.onclick = () => { triggerVibration(); handleCenter(); };
    
    window.addEventListener("keydown", (e) => {
        if (document.activeElement === nameInput) return; 
        const mapping = { 
            "ArrowUp": "UP", "KeyW": "UP", 
            "ArrowDown": "DOWN", "KeyS": "DOWN", 
            "ArrowLeft": "LEFT", "KeyA": "LEFT", 
            "ArrowRight": "RIGHT", "KeyD": "RIGHT", 
            "Space": "CENTER", 
            "Enter": "CENTER", 
            "Escape": "MENU",      // ESC теперь открывает меню
            "Backspace": "BACK"
        };
        const action = mapping[e.code];
        if (!action) return;
        e.preventDefault(); 
        if (action === "CENTER") handleCenter(); 
        else if (action === "BACK") handleBackPress(); 
        else if (action === "MENU") handleMenuPress(); 
        else handleInput(action);
    });
}