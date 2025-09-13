export function displayMenu(ctx, title, level) {
    return new Promise(resolve => {
        ctx.fillStyle = "white"
        ctx.clearRect(0,0,1600, 1000)
        ctx.font = "30px monospace"
        ctx.fillText(title, 800, 300)
        ctx.font = "20px monospace"
        ctx.fillText(`press any key to start level ${level}`, 800, 700)
        setTimeout(() => {
            let eventlistener = () => {
                document.body.removeEventListener("keydown", eventlistener)
                resolve()
            }
            document.body.addEventListener("keydown", eventlistener)
            
        }, 1000)
    })
}