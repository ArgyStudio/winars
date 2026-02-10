

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
    return Math.floor(Math.random() * (max - min) + min)
}

function randomArr(Array) {
    return Array[Math.floor(Math.random() * Array.length)]
}



function gName() {
    const firstName = randomArr(FIRST_NAMES)
    const lastName1 = randomArr(LAST_NAMES)


    const prob = Math.random() < 0.6

    if (prob) {
        let lastName2 = randomArr(LAST_NAMES)

        while (lastName2 === lastName1) {
            lastName2 = randomArr(LAST_NAMES)
        }
        return `${firstName} ${lastName1} ${lastName2}`

    } else {
        return `${firstName} ${lastName1}`
    }

}

function gAmount() {
    let wholeNumb = null
    let decimNumb = null

    const r = Math.random() < 0.7

    if (r) {
        wholeNumb = randomInt(17000, 100000)
    } else {
        wholeNumb = randomInt(100000, 338000)
    }

    const d = Math.random() < 0.4
    if (d) {
        decimNumb = randomInt(0, 98)
    } else {
        decimNumb = 0
    }
    const amount = wholeNumb + decimNumb / 100
    return new Intl.NumberFormat("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);


}

function gHour() {
    try {
        const now = new Date();
        const parts = now.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "America/Argentina/Buenos_Aires"
        });
        return parts;
    } catch (e) {
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        return `${hh}:${mm}`;
    }
}


//

function updateV() {
    const a = document.querySelector(".amount-value")
    const n = document.querySelector(".recipient-name");
    const t = document.querySelector(".time-value");
    if (!a && !n && !p) {
        return
    }

    const r_a = gAmount()
    const r_n = gName()
    const r_t = gHour()


    if (a) { a.textContent = r_a }
    if (n) { n.textContent = r_n }
    if (t) { t.textContent = r_t }

}


function mpN() {



    updateV()
    if (!mp) {
        setInterval(updateV(), 6400)
        return
    }

    mp.addEventListener("Animation", () => {
        updateV()
    })
}
mp.addEventListener("animationiteration", () => {
    requestAnimationFrame(updateV())
})

window.addEventListener("focus", updateV())

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mpN())
}
else {
    mpN()
}

