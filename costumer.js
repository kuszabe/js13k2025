import { Vec2 } from "./utilities";
import { importImages, renderGameObj } from "./graphiclib";
import { evenChance } from "./utilities";

let [human_img, empty_dialog_img, coffee_mug_img, tej_img] = await importImages(["ember.svg", "dialog.svg", "telecsésze.svg", "tej.svg"])

const ICON_SIZE = 50
const ICON_PADDING = 0
const DIALOG_MID_X = 100
const DIALOG_ICON_Y_OFFSET = -70 - ICON_SIZE / 2
const DIALOG_Y_OFFSET = -150
const MAXWOBBLE = 0.03
const WOBBLESPEED = 0.005

const CAFFEE_OPTS = [
    {type: "coffee"},
    {type: "coffee", tej: 1},
    {type: "coffee", tej: 2},
]

const COSUTMER_OFFSET = 210
const LINE_START = new Vec2(480, 700)
let costumerLine = []
export function addCostumerToLine() {
    let costumer_x = LINE_START.x - COSUTMER_OFFSET * costumerLine.length
    let obj = Object.create(Customer)
    obj.pos = new Vec2(-300, 500)
    obj.width = 200
    obj.height = 400
    obj.image = human_img
    obj.anchor = {x:0.5, y:1}
    obj.target = new Vec2(costumer_x, LINE_START.y)
    obj.speed = 4
    obj.state = "order"
    obj.order = [evenChance(CAFFEE_OPTS)]
    obj.left = false
    obj.dialogContent = []
    obj.calcDialogContent()
    obj.rot = 0
    obj.wobble_target = 0
    costumerLine.push(obj)
    return obj
}

function advanceLine() {
    costumerLine.forEach((costumer, index) => costumer.target = new Vec2(LINE_START.x - COSUTMER_OFFSET * index, LINE_START.y))
}

const Customer = {
    update(dt) {
        if (this.target) {
            if (this.pos.distance(this.target) > this.speed) {
                this.pos = this.pos.add(this.target.sub(this.pos).normal().scale(this.speed * dt))
                //set the wobble if the cat is moving
                if (this.wobble_target == 0) {
                    this.wobble_target = MAXWOBBLE
                } else if (Math.abs(this.rot) == MAXWOBBLE) {
                    this.wobble_target *= -1
                }
            } else {
                Object.assign(this.pos, this.target)
                this.target = null
                this.wobble_target = 0
            }
        }

        if (Math.abs(this.wobble_target - this.rot) < WOBBLESPEED) {
		    this.rot = this.wobble_target
        } else {
            let dist = this.wobble_target - this.rot
            let sign = dist / Math.abs(dist)
            this.rot += WOBBLESPEED * sign
        }
    },
    additionalRender(ctx) {
        if (this.state == "order") {
            ctx.drawImage(empty_dialog_img, this.pos.x-this.width/2, this.pos.y+DIALOG_Y_OFFSET-this.height)
            for (let {image, x} of this.dialogContent) {
                ctx.drawImage(image, this.pos.x-this.width/2 + x, this.pos.y - this.height + DIALOG_ICON_Y_OFFSET, ICON_SIZE, ICON_SIZE)
            }
        }
    },
    calcDialogContent() {
        let images = this.order.flatMap(piece => {
            let output = []
            switch (piece.type) {
                case "coffee": {
                    output.push(coffee_mug_img)
                    if (piece.tej == 1) output.push(tej_img);
                    if (piece.tej == 2) {output.push(tej_img); output.push(tej_img);}
                    break
                }
            }
            return output
        })
        let icons_width = images.length * ICON_SIZE + (images.length - 1) * ICON_PADDING
        let icons_start = DIALOG_MID_X - icons_width/2
        this.dialogContent = images.map((image, index) => {
            let x = icons_start + index * (ICON_SIZE + ICON_PADDING)
            return {image, x}
        });
    },
    itemDelivered(item) {
        let index = this.order.findIndex(val => item.content.type == "coffee" && val.type == "coffee" && val.tej == item.content.tej)
        if (index != -1) {
            this.order.splice(index, 1)
            if (this.order.length == 0) {
                this.done()
            }
            return true
        } else {
            return false
        }
    },
    done() {
        this.state = "leave"
        this.target = new Vec2(-200, 1000)
        costumerLine.splice(costumerLine.indexOf(this), 1)
        advanceLine()
    }
}