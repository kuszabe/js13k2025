import { Vec2 } from "./utilities"

let items = []

export function newItem({...things}) {
    let item = {pos: new Vec2(0,0), ...things, anchor: {x: 0.5, y: 1}}
    items.push(item)
    return item
}

export function addItem(item) {
    items.push(item)
}

export function findItem(type, player_pos) {
    let itemsInRange = items.filter(item => item.type == type && item.pos.distance(player_pos) < INTERACT_DIST)
    if (itemsInRange.length != 0) {
        return itemsInRange.reduce((prev, cur) => prev.pos.distance(player_pos) < cur.pos.distance(player_pos) ? prev : cur)
    } else return null
}

export function removeItem(item) {
    let index = items.indexOf(item)
    if (index == items.length-1) {
        items.pop()
    } else if (index != -1) {
        let replacer = items.pop()
        items[index] = replacer
    }
}

const COUNTERTOPSTART = new Vec2(1190, 365)
const COUNTERTOPEND = new Vec2(1400, 660)
const COUNTERLENGTH = COUNTERTOPSTART.distance(COUNTERTOPEND)
const COUNTERDIR = COUNTERTOPEND.sub(COUNTERTOPSTART).normal()
export const INTERACT_DIST = 250
///returns a position if the counter is in range, else returns null
export function findCounter(position) {
    let scalar = position.sub(COUNTERTOPSTART).dot(COUNTERDIR)
    let point
    if (scalar < 0) {
        point = COUNTERTOPSTART
    } else if (scalar > COUNTERLENGTH) {
        point = COUNTERTOPEND
    } else {
        point = COUNTERTOPSTART.add(COUNTERDIR.scale(scalar))
    }

    if (point.distance(position) < INTERACT_DIST) {
        return point
    } else {
        return null
    }
}

export function lookForPickupableItems(position) {
    let itemsInRange = items.filter(item => item.pos.distance(position) < INTERACT_DIST)
    if (itemsInRange.length != 0) {
        return itemsInRange.reduce((prev, cur) => prev.pos.distance(position) < cur.pos.distance(position) ? prev : cur)
    } else return null
}