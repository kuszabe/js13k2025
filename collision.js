//this is responsible for checking and applying collsiion to the cat, it uses the SAT theorem
import { Vec2 } from "./utilities"

const ELSO_COUNTER_OFFSET = new Vec2(600, 400)
const ELSO_COUNTER_COLLISION_POINTS = [new Vec2(0,155), new Vec2(155,365), new Vec2(240, 365), new Vec2(85, 155)].map(point => point.add(ELSO_COUNTER_OFFSET))
const MASODIK_COUNTER_COLLISION_POINTS = [new Vec2(1354, 841), new Vec2(1500, 841), new Vec2(1200, 413), new Vec2(1050, 413)]
const POLYS = [ELSO_COUNTER_COLLISION_POINTS, MASODIK_COUNTER_COLLISION_POINTS]

const FALAK = [
    {pos: new Vec2(1600, 1000), dir: new Vec2(1600, 1000).sub(new Vec2(1190, 415))},
    {pos: new Vec2(0,428), dir: new Vec2(1,0)}
].map(val => ({pos: val.pos, dir: val.dir.normal().perp()}))

const RADIUS = 20
const MACSKAOFFSET = new Vec2(0, -30)

export function check_collision(macska_pos) {
    const circ_pos = macska_pos.add(MACSKAOFFSET)

    for (const points of POLYS) {
        let MTV = null;

        let axes = []
        let prevpoint = points[points.length-1]
        for (let i = 0; i< points.length; i++) {
            let point = points[i]
            let axis = point.sub(prevpoint).perp().normal()
            axes.push(axis)
            prevpoint = point
        }
    
        //test or collision with the counter
        for (let i = 0; i < points.length; i++) {

            let min = Infinity
            let max = -Infinity
            for (let point of points) {
                let scalar = point.sub(points[i]).dot(axes[i]);
                if (scalar > max) max = scalar;
                if (scalar < min) min = scalar;
            }
    
            let projcircpos = circ_pos.sub(points[i]).dot(axes[i]);
            let circmax = projcircpos + RADIUS
            let circmin = projcircpos - RADIUS
    
            let overlap = testPoints(min, max, circmin, circmax)
    
            if (overlap) {
                if (!MTV || MTV.len() > Math.abs(overlap)) {
                    MTV = axes[i].scale(-overlap)
                }
            } else {
                MTV = null
                break
            }
        }

        if (MTV) {
            macska_pos.set(macska_pos.add(MTV))
        }
    }


    //test for collision with the walls
    for (const fal of FALAK) {
        let projcircpos = circ_pos.sub(fal.pos).dot(fal.dir);
        let circmin = projcircpos - RADIUS

        if (circmin < 0) {
            macska_pos.set(macska_pos.add(fal.dir.scale(-circmin)))
        }
    }
}

function testPoints(min1, max1, min2, max2) {
    //   ->      max2-min1
    //   |===|
    //|===|   
    if (min1 > min2 && min1 < max2) {
        return max2-min1
    }
    //|=====|
    //   |=====|
    //   --->     min2-max1
    else if (min2 > min1 && min2 < max1) {
        return min2-max1
    } 
    else return null
}