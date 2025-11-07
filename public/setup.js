// ========================
// setup.js — Updated for new HTML
// ========================

window.onload = async () => {

    // === Auth check ===
    const authed = await authCheck();
    if (!authed) return;

    // === Cached DOM elements ===
    const inputText  = document.getElementById("setup-text");
    const inputVoice = document.getElementById("setup-voice");
    const btnSave    = document.getElementById("setup-save");
    const statusEl   = document.getElementById("setup-status");

    const themeSelect = document.getElementById("theme-select");
    const previewInput = document.querySelector(".setup-theme__preview-input");
    const previewBtn   = document.querySelector(".setup-theme__preview-btn");
    const themeStatus  = document.getElementById("theme-status");

    if (!inputText || !inputVoice || !btnSave || !statusEl || !themeSelect) {
        console.error("[SETUP] Missing DOM elements!");
        return;
    }

    // ========================
    // SAVE SETUP BUTTON
    // ========================
    btnSave.addEventListener("click", () => {
        const textID = inputText.value.trim();
        const voiceID = inputVoice.value.trim();

        sendCommand("SETUP_SAVE", {
            text_channel_id: textID,
            voice_channel_id: voiceID
        });

        showStatus("Saving bot configuration...", "success", statusEl);
    });

    // ========================
    // THEME PREVIEW + APPLY
    // ========================

    // Mirror of themes from shared.js — JS-only preview
    const themes = {
        green: {
            bg: "#0e0e0e",
            panel: "#1a1a1a",
            accent: "#3aff3a",
            text: "#cccccc"
        },
        purple: {
            bg: "#0b0b15",
            panel: "#111122",
            accent: "#6d5bff",
            text: "#dddddd"
        },
        pink: {
            bg: "#1a0017",
            panel: "#2a0030",
            accent: "#ff00c8",
            text: "#e0e0e0"
        },
        forest: {
            bg: "#0f140f",
            panel: "#1c241c",
            accent: "#79c653",
            text: "#d7d7c3"
        }
    };

    function applyPreview(themeName) {
        const th = themes[themeName];
        if (!th) return;
        
        // Preview Input
        previewInput.style.background = th.panel;
        previewInput.style.color = th.text;
        previewInput.style.borderColor = th.accent;

        // Preview Button
        previewBtn.style.borderColor = th.accent;
        previewBtn.style.color = th.text;
        previewBtn.style.background = "transparent";
    }

    function applyTheme(themeName) {
        const root = document.documentElement;
        const th = themes[themeName];

        // Apply CSS variables to the whole site
        root.style.setProperty("--bg",           th.bg);
        root.style.setProperty("--bg-light",     th.panel);
        root.style.setProperty("--accent",       th.accent);
        root.style.setProperty("--accent-dark",  th.accent);
        root.style.setProperty("--grey",         th.text);
        root.style.setProperty("--grey-dark",    th.text);

        // Save to localStorage
        localStorage.setItem("ai-theme", themeName);

        themeStatus.textContent = `Theme set to ${themeName}`;
    }

    // === On theme selection ===
    themeSelect.addEventListener("change", () => {
        const themeName = themeSelect.value;

        console.log(`Attempting to preview theme ${themeName}`)
        applyPreview(themeName);
        applyTheme(themeName);
        console.log("Applying theme:", themeName, th);
        console.log("Computed accent:", getComputedStyle(document.documentElement).getPropertyValue("--accent"));

    });

    // === Restore saved theme on load ===
    const savedTheme = localStorage.getItem("ai-theme") || "green";
    themeSelect.value = savedTheme;
    applyPreview(savedTheme);
    applyTheme(savedTheme);
};
