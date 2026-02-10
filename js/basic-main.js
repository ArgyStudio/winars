
document.getElementById("Btn").addEventListener("click", async () => {


    document.getElementById("loading-overlay").classList.remove("hidden")



    const nums = ["5491176159174", "5491171247092", "5491171461076", "5491154035064"
    ]




    const randomLine = nums[Math.floor(Math.random() * nums.length)];


    if (randomLine) {
        console.log("ok")

        const msg = `Hola WINARS! vengo por el bono de bienvenida\nMe creas un usuario?`
        const url = `https://wa.me/${randomLine}?text=${encodeURIComponent(msg)}`;
        window.location.href = url
    }




})










window.addEventListener('load', async () => {
    document.body.classList.remove("lbody")
    console.log("load")
})