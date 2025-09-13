export function renderGameObj(ctx, gameobj) {
    if (gameobj.anchor) {
        if (gameobj.rot) {
            ctx.save()
            ctx.translate(gameobj.pos.x - gameobj.anchor.x * gameobj.width, gameobj.pos.y - gameobj.anchor.y * gameobj.height)
            ctx.rotate(gameobj.rot)
            ctx.drawImage(gameobj.image, 0, 0, gameobj.width, gameobj.height)
            ctx.restore()
        } else {
            ctx.drawImage(gameobj.image, gameobj.pos.x - gameobj.anchor.x * gameobj.width, gameobj.pos.y - gameobj.anchor.y * gameobj.height, gameobj.width, gameobj.height)
        }
    } else {
        ctx.drawImage(gameobj.image, gameobj.pos.x, gameobj.pos.y, gameobj.width, gameobj.height)
    }
}

export function importImages(images) {
    return Promise.all(images.map(path => {
        return new Promise(resolve => {
            let image = new Image()
            image.src = path
            image.onload = () => resolve(image)
        })
    }))
}