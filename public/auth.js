// ========================
// auth.js — Updated for new HTML
// ========================

window.onload = () => {

    const inputKey  = document.getElementById("auth-key");
    const btnSubmit = document.getElementById("auth-submit");

    if (!inputKey || !btnSubmit) {
        console.error("[AUTH] Missing DOM elements!");
        return;
    }

    // ========================
    // HANDLE AUTH SUBMISSION
    // ========================
    async function submitAuth() {

        const key = inputKey.value.trim();
        if (!key) {
            alert("Enter the key");
            return;
        }

        try {
            const res = await fetch("https://ambienceinator-web.onrender.com/auth_check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key }),
                credentials: "include"
            });

            const data = await res.json();

            if (data.ok) {

                window.location.href = "./";
            } else {
                alert("Invalid key");
                localStorage.removeItem("ambience_auth_key");
            }

        } catch (err) {
            console.error("[AUTH] Error:", err);
            alert("Unable to contact authentication server");
        }
    }

    // Submit via button
    btnSubmit.addEventListener("click", submitAuth);

    // Submit via ENTER key
    inputKey.addEventListener("keyup", (e) => {
        if (e.key === "Enter") {
            submitAuth();
        }
    });
};
