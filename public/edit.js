// ========================
// edit.js — Updated for new HTML (BEM structure)
// ========================

let editMode = "music";         
let playlists = {};             
let currentPlaylist = null;     
let selectedSongUrl = null;     


// ========================
// GLOBAL CLICK DELEGATION
// ========================
document.body.addEventListener("click", (e) => {

    const id = e.target.id;

    // --- Mode Switch ---
    if (id === "edit-mode-music") {
        switchMode("music");
        return;
    }
    if (id === "edit-mode-ambience") {
        switchMode("ambience");
        return;
    }

    // --- Controls ---
    if (id === "edit-new-playlist") {
        createNewPlaylist();
        return;
    }
    if (id === "edit-title-btn") {
        addOrEditSong();
        return;
    }
    if (id === "edit-remove-btn") {
        removeSong();
        return;
    }
    if (id === "edit-save") {
        saveChanges();
        return;
    }

    // --- Playlist item selection (delegated) ---
    if (e.target.classList.contains("playlist-item")) {
        const row = e.target;
        const url = row.dataset.url;
        const title = row.dataset.title;

        if (url && title) {
            selectSong(url, title, row);
        }
    }
});


// ========================
// GLOBAL CHANGE DELEGATION
// ========================
document.body.addEventListener("change", (e) => {
    if (e.target.id === "edit-playlist-select") {
        loadPlaylist(e.target.value);
    }
});


// ========================
// PAGE LOAD
// ========================
window.onload = async () => {
    const authed = await authCheck();
    if (!authed) return;

    sendCommand("GET_PLAYLISTS");
};


// ========================
// WS CALLBACKS
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

window.onReturnPlaylistSave = () => showStatus("Playlist saved.", "success", document.getElementById("edit-status"));

window.onReturnAmbienceSave = () => showStatus("Ambience saved.", "success", document.getElementById("edit-status"));

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

    // Button highlight
    document.getElementById("edit-mode-music")
        .classList.toggle("edit-mode__btn--active", mode === "music");
    document.getElementById("edit-mode-ambience")        
        .classList.toggle("edit-mode__btn--active", mode === "ambience");

    const select = document.getElementById("edit-playlist-select");
    const btnNewPlaylist = document.getElementById("edit-new-playlist");

    // Clear panel
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
// POPULATE PLAYLIST DROPDOWN
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

        // store values in dataset for delegation
        row.dataset.url = url;
        row.dataset.title = title;

        panel.appendChild(row);
    }
}


// ========================
// SONG SELECTION
// ========================
function selectSong(url, title, row) {
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
        alert("Enter a title and URL.");
        return;
    }

    const list = playlists[currentPlaylist];

    // Editing?
    if (selectedSongUrl && list[selectedSongUrl]) {

        // URL changed?
        if (selectedSongUrl !== url) {
            delete list[selectedSongUrl];
        }

        list[url] = title;
    } else {
        list[url] = title;
    }

    loadPlaylist(currentPlaylist);
    clearSelectionFields();
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
// CLEAR SELECTION FIELDS
// ========================
function clearSelectionFields() {
    selectedSongUrl = null;

    document.querySelectorAll(".edit-panel__item--selected")
        .forEach(el => el.classList.remove("edit-panel__item--selected"));

    document.getElementById("edit-title").value = "";
    document.getElementById("edit-url").value = "";

    document.getElementById("edit-title-btn").textContent = "Add / Edit";
}


// ========================
// SAVE CHANGES
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
