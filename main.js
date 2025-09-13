import { check_collision } from "./collision";
import { addItem, findCounter, findItem, lookForPickupableItems, newItem, removeItem, INTERACT_DIST } from "./items";
import { renderGameObj, importImages } from "./graphiclib";
import { addCostumerToLine} from "./costumer"
import { Vec2 } from "./utilities";
import { displayMenu } from "./menu";

Array.prototype.remove = function(thing) {
	const i = this.indexOf(thing)
	if (i != -1) this.splice(i, 1)
}

let keys = {}
onkeydown = (event) => keys[event.key] = (keys[event.key] == "press" || keys[event.key] == "hold") ? "hold" : "press"
onkeyup = (event) => keys[event.key] = null
function testForKeyHolding() {
	for (const key in keys) {
		if (keys[key] == "press") keys[key] = "hold"
	}
}

let ctx = document.getElementsByTagName("canvas")[0].getContext("2d")
ctx.fillStyle = "white"
ctx.textAlign = "center"

let running = true

//some of these are still hungarian, i didn't have time to rename everything to english
let [macska_img, hatter_img, counter_img, coffee_img, filled_coffe_img, interact_img, telifőzőcsésze_image, féligtelifőzőcsésze_img, üresfőzőcsésze_image, kávéfőző_img, kávéfőzőcsészével_img, kávéfőzőcsészeteli_img, kávéfőzőfej_img, smoke1, tej_img] = await importImages([
	"macska.svg",
	"hatter.svg",
	"elso_counter.svg",
	"csésze.svg",
	"telecsésze.svg",
	"interact.svg",
	"telifőzőcsésze.svg",
	"féligtelifőzőcsésze.svg",
	"üresfőzőcsésze.svg",
	"kávéfőző.svg",
	"kávéfőzőcsésze.svg",
	"kávéfőzőcsészeteli.svg",
	"kávéfőzőfej.svg",
	"gőz1.svg",
	"tej.svg"
]);

let smoke2 = (() => {
	let canvas = document.createElement("canvas");
	canvas.width = 100;
	canvas.height = 100;
	let ctx = canvas.getContext("2d");
	ctx.save();
	ctx.translate(100, 0);
	ctx.scale(-1, 1);
	ctx.drawImage(smoke1, 0, 0, 100, 100);
	ctx.restore();
	let img = new Image();
	img.src = canvas.toDataURL();
	return img;
})();

const SPEED = 7;
const MAXWOBBLE = 0.04
const WOBBLESPEED = 0.007
let cat = { image: macska_img, pos: new Vec2(500, 500), anchor: {x:0.6, y:1}, width: 100, height: 100, rot: 0, wobble_target: 0};
let background = { image: hatter_img, pos: new Vec2(0,0), width: 1600, height: 1000 };
let counter = { image: counter_img, pos: new Vec2(600, 400+369), anchor: {x: 0, y: 1}, width: 241, height: 369 };
let interactsign = { image: interact_img, anchor: {x:0.5, y: 1.4}, pos: new Vec2(0,0), width: 100, height: 100 }
let showinteractsign = false

const COUNTEROFFSET = new Vec2(600, 400)

const COFFEE_MACHINE_SCALE = 1.2
const CAFE_COOK_TIME = 5000
const CAFFE_COOK_ANIM_FRAME = 500
const KAVEFŐZŐ_INTERACT = new Vec2(1150, 300)
const GŐZ_POS = new Vec2(1100, 150)
let smoke_state = 0
const COFFEE_MACHINE_X = 1100
const COFFEE_MACHINE_Y = 250
const COFFEE_MACHINE_ANIM = 0
const COFFEE_MACHINE_BASE_WIDTH = 98.762*COFFEE_MACHINE_SCALE
const COFFEE_MACHINE_BASE_HEIGHT = 88.567*COFFEE_MACHINE_SCALE
const COFFEE_MACHINE_WITH_CUP_WIDTH = 104.860 * COFFEE_MACHINE_SCALE
let coffee_machine_cup = null
let coffee_machine_cooking = false
let coffee_machine_state = 0

function renderCoffeeMachine() {
	ctx.drawImage(kávéfőző_img, COFFEE_MACHINE_X, COFFEE_MACHINE_Y, COFFEE_MACHINE_BASE_WIDTH, COFFEE_MACHINE_BASE_HEIGHT)
	switch (coffee_machine_state) {
		case 0: break
		case 1: 
			ctx.drawImage(kávéfőzőcsészével_img, COFFEE_MACHINE_X, COFFEE_MACHINE_Y, COFFEE_MACHINE_WITH_CUP_WIDTH, COFFEE_MACHINE_BASE_HEIGHT)
			break
		case 2: 
			ctx.drawImage(kávéfőzőcsészeteli_img, COFFEE_MACHINE_X, COFFEE_MACHINE_Y, COFFEE_MACHINE_WITH_CUP_WIDTH, COFFEE_MACHINE_BASE_HEIGHT)
			break
	}
	ctx.drawImage(kávéfőzőfej_img, COFFEE_MACHINE_X, COFFEE_MACHINE_Y, COFFEE_MACHINE_BASE_WIDTH, COFFEE_MACHINE_BASE_HEIGHT)
}

let brewing_cup = newItem({image: üresfőzőcsésze_image, width: 67, height: 67, type: "főzőcsésze", fill: "none"})
brewing_cup.pos = new Vec2(1200, 400)

let milk = newItem({image: tej_img, width: 70, height: 70, type: "tej"})
milk.pos = new Vec2(1300, 600)

let costumers = []
let costumerTime = 15000
let costumerCount = 1
let remainingCostumers
let level = 1

function initStage() {
	renderList = [cat, brewing_cup,milk]
	remainingCostumers = costumerCount
	setTimeout(costumerLoopCallback, 1000)
	setTimeout(costumerCleanupLoopCallback, 20000)
	running = true
	update(performance.now())
}

function costumerLoopCallback() {
	if (remainingCostumers == 0) return
	remainingCostumers -= 1
	let costumer = addCostumerToLine()
	costumers.push(costumer)
	renderList.push(costumer)
	if (running) setTimeout(costumerLoopCallback, costumerTime)
}

function costumerCleanupLoopCallback() {
	if (costumers.length > 0) {
		let i = costumers.length - 1
		while (i > -1) {
			if (costumers[i].state == "leave" && costumers[i].target == null) {
				costumers.splice(i, 1)
			}
			i -= 1
		}
		if (costumers.length == 0 && remainingCostumers == 0) stageFinished();
		else setTimeout(costumerCleanupLoopCallback, 5000)
	} else if (remainingCostumers == 0) {
		stageFinished()
	}
}

async function stageFinished() {
	running = false
	costumerTime *= 0.9
	costumerCount += 3
	level += 1
	await displayMenu(ctx, `You finished level ${level-1}`, level)
	initStage()
}

let renderList

const CUPBOARD_POS = new Vec2(930, 300)

//ACTION
let currentAction
//this function looks for actions that can be taken by the player and if there is one it displays the interact_sign(the letter e in a  bubble)
//it sets the currentAction, then the EPress function does said action
function findAction() {
	if (!equippedItem) { // find equipable items
		//check if there is a főzőcsésze in the coffee machine
		if (coffee_machine_cup != null && cat.pos.distance(KAVEFŐZŐ_INTERACT) < INTERACT_DIST && !coffee_machine_cooking) {
			interactsign.pos = KAVEFŐZŐ_INTERACT
			showinteractsign = true
			currentAction = {type: "take-főzőcsésze"}
			return
		}
		
		//check the cupboard
		if (cat.pos.distance(CUPBOARD_POS) < 200) {
			interactsign.pos = CUPBOARD_POS
			showinteractsign = true
			currentAction = {type: "cupboard"}
			return
		}
		
		//check for pickupable items
		let item = lookForPickupableItems(cat.pos)
		if (item) {
			interactsign.pos = item.pos
			showinteractsign = true
			currentAction = {type: "pickup", item}
			return
		}
	} else if (equippedItem == brewing_cup) {
		//the player is holding a főzőcsésze that can be placed into the coffee machine
		if (cat.pos.distance(KAVEFŐZŐ_INTERACT) < INTERACT_DIST && coffee_machine_cup == null) {
			interactsign.pos = KAVEFŐZŐ_INTERACT
			showinteractsign = true
			currentAction = {type: "place-főzőcsésze"}
			return
		}

		//pour coffee into a cup
		if (brewing_cup.fill == "full" || brewing_cup.fill == "half") {
			let item = findItem("cup", cat.pos)
			if (item) {
				interactsign.pos = item.pos
				showinteractsign = true
				currentAction = {type: "pour-coffee", item}
				return
			}
		}
	} else if (equippedItem == milk) {
		//the player has the milk equipped, it check if it can be poured
		let kávé = findItem("coffee", cat.pos)
		if (kávé && (kávé.content.tej < 2 || kávé.content.tej == null)) {
			interactsign.pos = kávé.pos
			showinteractsign = true
			currentAction = {type: "pour-milk", item:kávé}
			return
		}
	} else {
		//check if in interaction distance with npc's
		let closest_npc = costumers.filter(val => val.pos.distance(cat.pos) < INTERACT_DIST)
		if (closest_npc.length != 0) {
			closest_npc = costumers.reduce((prev, cur) => prev.pos.distance(cat.pos) < cur.pos.distance(cat.pos) ? prev : cur)
			currentAction = {type: "give-item", npc: closest_npc}
			showinteractsign = false
			return
		}
	}

	showinteractsign = false
	currentAction = null
}

//ITEM
let equippedItem
function equipItem(item) {
	removeItem(item)
	equippedItem = item
}
function unEquipItem() {
	let item = equippedItem
	equippedItem = null
	return item
}

let prevFrame = performance.now()
function update(timestamp) {
	if (!running) return;
	let dt = ((timestamp - prevFrame) / 16.6666) || 1
	prevFrame = timestamp

	for (let costumer of costumers) {
		costumer.update(dt)
	}

	updateCat(dt);
	findAction()
	if (keys.q == "press") QPress();
	if (keys.e == "press") EPress();
	testForKeyHolding()
	render()
}

function renderEquippedItem() {
	if (equippedItem) {
		equippedItem.pos = cat.pos.add(new Vec2(-5, -100))
		renderGameObj(ctx, equippedItem)
	};
}

///this test if the cat should be rendered before or behind the counter
function testIfMacskaBeforeCounter() {
	if (cat.pos.y > counter.pos.y) {
		return true
	} else if (cat.pos.y < counter.pos.y-200) {
		return false
	} else {
		return righterThanCounter(cat.pos) < 0
	}
}

function render() {
	ctx.fillStyle = "black"
	ctx.clearRect(0,0,1600, 1000)
	renderGameObj(ctx, background)
	renderCoffeeMachine()
	// this sorts the renderList so that object things are rendered respective to their y level
	// the only thing that reqires special handling is the counter
	// the counter always renders together with the cat, because if it cannot be ordered nnormally based on y level
	renderList.sort(sceneSortFunction).forEach(value => {
		if (value == cat) {
			let is_before_counter = testIfMacskaBeforeCounter()
			
			if (is_before_counter) {
				renderGameObj(ctx, counter)
				renderEquippedItem()
				renderGameObj(ctx, cat)
			} else {
				renderGameObj(ctx, cat)
				renderEquippedItem()
				renderGameObj(ctx, counter)
			}
			
		} else {
			renderGameObj(ctx, value)
			if (value.additionalRender) value.additionalRender(ctx);
		}
	})

	if (coffee_machine_cooking) {
		if (smoke_state == 0) ctx.drawImage(smoke1, GŐZ_POS.x, GŐZ_POS.y, 100, 100);
		else ctx.drawImage(smoke2, GŐZ_POS.x, GŐZ_POS.y, 100, 100);
	}

	
	if (showinteractsign) renderGameObj(ctx, interactsign);
	requestAnimationFrame(update)
}

function sceneSortFunction(a,b) {
	return a.pos.y - b.pos.y
}


const SIDE_DIR = new Vec2(155,365).add(COUNTEROFFSET).sub(new Vec2(0,155).add(COUNTEROFFSET))
const SIDE_POS = new Vec2(0,155).add(COUNTEROFFSET)

function righterThanCounter(pos) {
	const t = (pos.y - SIDE_POS.y) / SIDE_DIR.y;
	const lineX = SIDE_POS.x + t * SIDE_DIR.x;
	return pos.x - lineX;
}


function updateCat(dt) {
	//this moves 
	if (keys.w) cat.pos.y -= SPEED * dt;
	if (keys.s) cat.pos.y += SPEED * dt;
	if (keys.a) cat.pos.x -= SPEED * dt;
	if (keys.d) cat.pos.x += SPEED * dt;

	if (keys.w || keys.s || keys.a || keys.d) {
		//set the wobble if the cat is moving
		if (cat.wobble_target == 0) {
			cat.wobble_target = MAXWOBBLE
		} else if (Math.abs(cat.rot) == MAXWOBBLE) {
			cat.wobble_target *= -1
		}
	} else {
		cat.wobble_target = 0
	}

	//make the cat wobble
	if (Math.abs(cat.wobble_target - cat.rot) < WOBBLESPEED) {
		cat.rot = cat.wobble_target
	} else {
		let dist = cat.wobble_target - cat.rot
		let sign = dist / Math.abs(dist)
		cat.rot += WOBBLESPEED * sign
	}

	//here the collision detection shall be done
	check_collision(cat.pos);
}

//this places as item
function QPress() {
	if (equippedItem) {
		//findCounter finds the closest spot on the counter if it is in range
		let placepos = findCounter(cat.pos)
		if (placepos) {
			let item = unEquipItem()
			item.pos = placepos
			renderList.push(item)
			addItem(item)
		}
	}
}

//if there is current action this function executes it(eq.: picking up an item, or giving an item to a costumer)
function EPress() {
	if (!currentAction) return;
	switch (currentAction.type) {
		case "pickup": {
			renderList.remove(currentAction.item)
			equipItem(currentAction.item)
			break
		}
		case "cupboard": {
			let coffee = newItem({ image: coffee_img, width: 50, height: 50, type: "cup", content: {} })
			equipItem(coffee)
			break
		}
		case "place-főzőcsésze": {
			let csésze = unEquipItem()
			coffee_machine_cup = csésze
			coffee_machine_state = 1
			coffee_machine_cooking = true

			let anim_interval = setInterval(() => {
				if (smoke_state == 0) smoke_state = 1; else smoke_state = 0;
			}, CAFFE_COOK_ANIM_FRAME)

			setTimeout(() => {
				coffee_machine_cooking = false
				coffee_machine_state = 2
				csésze.fill = "full"
				csésze.image = telifőzőcsésze_image
				clearInterval(anim_interval)
			}, CAFE_COOK_TIME)
			break
		}
		case "take-főzőcsésze": {
			coffee_machine_state = 0
			equipItem(coffee_machine_cup)
			coffee_machine_cup = null
			break
		}
		case "pour-coffee": {
			let főzőcsésze = equippedItem
			let csésze = currentAction.item
			switch (főzőcsésze.fill) {
				case "full": {
					főzőcsésze.image = féligtelifőzőcsésze_img
					főzőcsésze.fill = "half"
					break
				}
				case "half": {
					főzőcsésze.image = üresfőzőcsésze_image
					főzőcsésze.fill = "none"
					break
				}
			}
			csésze.image = filled_coffe_img
			csésze.type = "coffee"
			csésze.content = {type: "coffee"}
			break
		}
		case "give-item": {
			if (currentAction.npc.itemDelivered(equippedItem)) {
				unEquipItem()
			}
			break
		}
		case "pour-milk": {
			currentAction.item.content.tej = (currentAction.item.content.tej ?? 0) + 1
			break
		}
	}
}

//diplaymenu displays the menu, then waits for a keypress before continuing
await displayMenu(ctx, "Black Cat Caffee", 1)
initStage()