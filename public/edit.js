// ========================
// edit.js — Updated for new HTML (BEM structure)
// ========================

let editMode = "music";         // "music" or "ambience"
let playlists = {};             // Loaded playlists
let currentPlaylist = null;     // Currently selected playlist name
let selectedSongUrl = null;     // Used for editing/removing tracks


// ========================
// ON PAGE LOAD
// ========================
window.onload = async () => {

    const authed = await authCheck();
    if (!authed) return;

    // ========== DOM ELEMENTS ==========
    const btnMusicMode   = document.getElementById("edit-mode-music");
    const btnAmbMode     = document.getElementById("edit-mode-ambience");

    const selectPlaylist = document.getElementById("edit-playlist-select");
    const btnNewPlaylist = document.getElementById("edit-new-playlist");

    const inputTitle     = document.getElementById("edit-title");
    const inputURL       = document.getElementById("edit-url");
    const btnAddEdit     = document.getElementById("edit-title-btn");
    const btnRemove      = document.getElementById("edit-remove-btn");
    const btnSave        = document.getElementById("edit-save");

    // ========== MODE SWITCH ==========
    btnMusicMode.addEventListener("click", () => switchMode("music"));
    btnAmbMode.addEventListener("click",   () => switchMode("ambience"));

    // ========== TOP BAR CONTROLS ==========
    btnNewPlaylist.addEventListener("click", createNewPlaylist);

    // ========== SONG CONTROLS ==========
    btnAddEdit.addEventListener("click", addOrEditSong);
    btnRemove.addEventListener("click", removeSong);

    // ========== SAVE ==========
    btnSave.addEventListener("click", saveChanges);

    // First load → get music playlists
    sendCommand("GET_PLAYLISTS");
};


// ========================
// WEBSOCKET CALLBACKS
// ========================
window.onReturnPlaylists = (playlistData) => {
    playlists = playlistData || {};
    populatePlaylistSelect();
    showStatus("Music playlists loaded.", "success", document.getElementById("edit-status"));
};

window.onReturnAmbience = (ambienceData) => {
    playlists = { Ambience: ambienceData };
    currentPlaylist = "Ambience";

    const select = document.getElementById("edit-playlist-select");
    select.innerHTML = `<option value="Ambience" selected>Ambience</option>`;
    select.disabled = true;

    document.getElementById("edit-new-playlist").disabled = true;

    loadPlaylist("Ambience");
    showStatus("Ambience loaded.", "success", document.getElementById("edit-status"));
};

// Called after saving
window.onReturnPlaylistSave = (data) => {
    showStatus("Playlist saved!", "success", document.getElementById("edit-status"));
};

window.onReturnAmbienceSave = (data) => {
    showStatus("Ambience saved!", "success", document.getElementById("edit-status"));
};

// Request playlists when WS connects
window.onWebSocketConnected = () => {
    if (editMode === "music") sendCommand("GET_PLAYLISTS");
    else sendCommand("GET_AMBIENCE");
};


// ========================
// MODE SWITCH
// ========================
function switchMode(mode) {
    if (editMode === mode) return;

    editMode = mode;
    currentPlaylist = null;
    selectedSongUrl = null;

    const btnMusic = document.getElementById("edit-mode-music");
    const btnAmb   = document.getElementById("edit-mode-ambience");

    btnMusic.classList.toggle("edit-mode__btn--active", mode === "music");
    btnAmb.classList.toggle("edit-mode__btn--active",   mode === "ambience");

    const select = document.getElementById("edit-playlist-select");
    const btnNewPlaylist = document.getElementById("edit-new-playlist");

    // Clear list
    document.getElementById("edit-content").innerHTML = "";

    if (mode === "music") {
        select.disabled = false;
        btnNewPlaylist.disabled = false;

        select.innerHTML = `<option disabled selected>--- Choose a playlist ---</option>`;
        sendCommand("GET_PLAYLISTS");
    } else {
        select.disabled = true;
        btnNewPlaylist.disabled = true;

        select.innerHTML = `<option value="Ambience" selected>Ambience</option>`;
        sendCommand("GET_AMBIENCE");
    }
}


// ========================
// POPULATE PLAYLIST SELECT
// ========================
function populatePlaylistSelect() {
    const select = document.getElementById("edit-playlist-select");
    select.innerHTML = `<option disabled selected>--- Choose a playlist ---</option>`;

    for (const name of Object.keys(playlists)) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        select.appendChild(opt);
    }

    select.onchange = () => loadPlaylist(select.value);
}


// ========================
// LOAD PLAYLIST CONTENT
// ========================
function loadPlaylist(name) {
    currentPlaylist = name;
    selectedSongUrl = null;

    const panel = document.getElementById("edit-content");
    panel.innerHTML = "";

    const list = playlists[name];
    if (!list) return;

    for (const [url, title] of Object.entries(list)) {
        const row = document.createElement("div");
        row.classList.add("playlist-item");
        row.textContent = `${title}  —  ${url}`;

        row.addEventListener("click", () => selectSong(url, title, row));

        panel.appendChild(row);
    }
}

function selectSong(url, title, row) {
    // Remove previous selection
    document.querySelectorAll(".edit-panel__item--selected")
        .forEach(el => el.classList.remove("edit-panel__item--selected"));

    row.classList.add("edit-panel__item--selected");

    selectedSongUrl = url;

    document.getElementById("edit-title").value = title;
    document.getElementById("edit-url").value = url;

    document.getElementById("edit-title-btn").textContent = "Edit";
}


// ========================
// CREATE NEW PLAYLIST
// ========================
function createNewPlaylist() {
    const name = prompt("Enter new playlist name:");
    if (!name) return;

    playlists[name] = {};
    populatePlaylistSelect();

    const select = document.getElementById("edit-playlist-select");
    select.value = name;

    loadPlaylist(name);
}


// ========================
// ADD / EDIT SONG
// ========================
function addOrEditSong() {
    if (!currentPlaylist) return alert("Select a playlist first.");

    const title = document.getElementById("edit-title").value.trim();
    const url   = document.getElementById("edit-url").value.trim();

    if (!title || !url) {
        alert("Enter both a title and URL.");
        return;
    }

    const list = playlists[currentPlaylist];

    // Editing?
    if (selectedSongUrl && list[selectedSongUrl]) {

        // If URL changed → remove old entry
        if (selectedSongUrl !== url) {
            delete list[selectedSongUrl];
        }

        list[url] = title;
    } 
    else {
        list[url] = title;
    }

    loadPlaylist(currentPlaylist);
    clearSelectionFields();
}

function clearSelectionFields() {
    selectedSongUrl = null;

    document.querySelectorAll(".edit-panel__item--selected")
        .forEach(el => el.classList.remove("edit-panel__item--selected"));

    document.getElementById("edit-title").value = "";
    document.getElementById("edit-url").value = "";

    document.getElementById("edit-title-btn").textContent = "Add / Edit";
}


// ========================
// REMOVE SONG
// ========================
function removeSong() {
    if (!currentPlaylist) return alert("Select a playlist first.");
    if (!selectedSongUrl) return alert("Select a song to remove.");

    delete playlists[currentPlaylist][selectedSongUrl];

    loadPlaylist(currentPlaylist);
    clearSelectionFields();
}


// ========================
// SAVE PLAYLISTS
// ========================
function saveChanges() {
    const statusEl = document.getElementById("edit-status");

    if (editMode === "music") {
        if (!currentPlaylist) {
            showStatus("Select a playlist first.", "warning", statusEl);
            return;
        }

        sendCommand("SAVE_PLAYLIST", {
            name: currentPlaylist,
            data: playlists[currentPlaylist]
        });

        showStatus(`Saving "${currentPlaylist}"...`, "success", statusEl);

    } else {
        sendCommand("SAVE_AMBIENCE", {
            data: playlists["Ambience"]
        });

        showStatus("Saving Ambience...", "success", statusEl);
    }
}
