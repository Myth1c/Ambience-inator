// ========================
// index.js — Updated for BEM + new HTML
// ========================

// Cached status labels + global state
let elBotStatus   = null;
let elWebStatus   = null;

// ========================
// EVENT DELEGATION — CLICK
// ========================
document.body.addEventListener("click", (e) => {
    switch (e.target.id) {

        case "btn-start":
            sendCommand("START_BOT");
            break;

        case "btn-stop":
            sendCommand("STOP_BOT");
            break;

        case "btn-reboot":
            sendCommand("REBOOT_BOT");
            break;
    }
});

// ========================
// PAGE LOAD
// ========================
window.onload = async () => {

    // --- Auth check ---
    const authed = await authCheck();
    if (!authed) return;

    // --- Cache DOM references ---
    elBotStatus = document.getElementById("status-bot");
    elWebStatus = document.getElementById("status-web");

    if (!elBotStatus || !elWebStatus) {
        console.warn("[INDEX] Missing status elements");
    }

    // --- Request initial status once WS connects ---
    window.onWebSocketConnected = () => {
        sendCommand("GET_BOT_STATUS");
    };
};

// ========================
// HEARTBEAT & BOT STATUS UPDATES
// ========================
window.onHeartbeatUpdate = (webOK, botOK) => {
    updateBotStatus(webOK, botOK);
};

window.onReturnStatus = (statusValue) => {
    // If server responded, then web is definitely online
    updateBotStatus(true);
};

// ========================
// UI UPDATE FUNCTION
// ========================
function updateBotStatus(webOK) {

    const btnStart  = document.getElementById("btn-start");
    const btnStop   = document.getElementById("btn-stop");
    const btnReboot = document.getElementById("btn-reboot");

    const elBotStatus = document.getElementById("status-bot");
    const elWebStatus = document.getElementById("status-web");

    // Bot status comes from playbackState
    let botStatus = window.playbackState.bot_online;

    // Normalize botStatus to a valid string
    if (botStatus === true) botStatus = "online";
    else if (botStatus === false) botStatus = "offline";
    else if (typeof botStatus !== "string") botStatus = "offline";

    // --- Webserver ---
    elWebStatus.textContent = webOK ? "Online" : "Offline";
    elWebStatus.style.color = webOK ? "#4caf50" : "#f44336";

    // --- Bot status display ---
    switch (botStatus) {
        case "online":
            elBotStatus.textContent = "Online";
            elBotStatus.style.color = "#4caf50";
            break;

        case "booting":
            elBotStatus.textContent = "Starting...";
            elBotStatus.style.color = "#ffca28";
            break;

        default:
            elBotStatus.textContent = "Offline";
            elBotStatus.style.color = "#f44336";
            break;
    }

    // --- Button states ---
    const isOnline  = botStatus === "online";
    const isBooting = botStatus === "booting";

    btnStart.disabled  = isOnline || isBooting;
    btnStop.disabled   = !isOnline && !isBooting;
    btnReboot.disabled = !isOnline;

    console.log(`[STATUS] Web=${webOK ? "Online" : "Offline"} | Bot=${botStatus}`);
}
