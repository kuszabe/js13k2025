export function evenChance(options) {
    let index = Math.floor(Math.random() * options.length)
    return options[index]
}

export class Vec2 {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    sub(vec) { return new Vec2(this.x - vec.x, this.y - vec.y) }
    add(vec) { return new Vec2(this.x + vec.x, this.y + vec.y) }
    scale(input) {
        return new Vec2(this.x * input, this.y * input)
    }
    len() {
        return Math.sqrt(this.x ** 2 + this.y ** 2)
    }
    normal() {
        let magnitude = this.len()
        return new Vec2(this.x / magnitude, this.y / magnitude)
    }
    dot(vec) {
        return this.x * vec.x + this.y * vec.y
    }
    distance(vec) { return Math.sqrt(Math.pow(this.x - vec.x, 2) + Math.pow(this.y - vec.y, 2)) }
    perp() { return new Vec2(-this.y, this.x) }
    set(vec) {
        this.x = vec.x
        this.y = vec.y
    }
}



