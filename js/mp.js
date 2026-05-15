// Social-proof "Premio Pagado" notification widget.
// Cycles a fake transferencia (name + amount + time) in sync with the CSS
// animation iteration on `.mp-notif`.

const FIRST_NAMES = [
    "Valerián", "Mateo", "Sofía", "Martina", "Lucas", "Julieta", "Diego", "Lucía",
    "Tomás", "Camila", "Agustín", "Florencia", "Benjamín", "Isabella", "Bruno",
    "Marcos", "María", "Santiago", "Agustina", "Nicolás", "Federico", "Paula"
];

const LAST_NAMES = [
    "González", "Pérez", "Rodríguez", "Gómez", "Fernández", "López", "Sánchez",
    "Martínez", "García", "Romero", "Díaz", "Rossi", "Torres", "Vega", "Cruz",
    "Canaza", "Méndez", "Silva", "Álvarez", "Ramos", "Herrera"
];

const mp = document.querySelector(".mp-notif");

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function randomArr(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function gName() {
    const firstName = randomArr(FIRST_NAMES);
    const lastName1 = randomArr(LAST_NAMES);

    const prob = Math.random() < 0.6;

    if (prob) {
        let lastName2 = randomArr(LAST_NAMES);
        while (lastName2 === lastName1) {
            lastName2 = randomArr(LAST_NAMES);
        }
        return `${firstName} ${lastName1} ${lastName2}`;
    }
    return `${firstName} ${lastName1}`;
}

function gAmount() {
    const r = Math.random() < 0.7;
    const wholeNumb = r ? randomInt(17000, 100000) : randomInt(100000, 338000);

    const d = Math.random() < 0.4;
    const decimNumb = d ? randomInt(0, 98) : 0;

    const amount = wholeNumb + decimNumb / 100;
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function gHour() {
    try {
        const now = new Date();
        return now.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Argentina/Buenos_Aires",
        });
    } catch (e) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    }
}

function updateV() {
    const a = document.querySelector(".amount-value");
    const n = document.querySelector(".recipient-name");
    const t = document.querySelector(".time-value");

    // Need at least one slot to update; bail early otherwise.
    if (!a && !n && !t) return;

    if (a) a.textContent = gAmount();
    if (n) n.textContent = gName();
    if (t) t.textContent = gHour();
}

function mpN() {
    updateV();

    if (!mp) {
        // No widget in DOM — fall back to a polling refresh so any late-mounted
        // copy still gets values. Pass the function reference, NOT its return.
        setInterval(updateV, 6400);
        return;
    }

    // Sync with the CSS animation: every iteration the notif "refreshes".
    mp.addEventListener("animationiteration", () => {
        requestAnimationFrame(updateV);
    });
}

// Refresh values when the tab regains focus so a returning user sees fresh data.
window.addEventListener("focus", updateV);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mpN);
} else {
    mpN();
}
