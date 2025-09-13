// utilities.js
function evenChance(options) {
  let index = Math.floor(Math.random() * options.length);
  return options[index];
}
var Vec2 = class _Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  sub(vec) {
    return new _Vec2(this.x - vec.x, this.y - vec.y);
  }
  add(vec) {
    return new _Vec2(this.x + vec.x, this.y + vec.y);
  }
  scale(input) {
    return new _Vec2(this.x * input, this.y * input);
  }
  len() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
  normal() {
    let magnitude = this.len();
    return new _Vec2(this.x / magnitude, this.y / magnitude);
  }
  dot(vec) {
    return this.x * vec.x + this.y * vec.y;
  }
  distance(vec) {
    return Math.sqrt(Math.pow(this.x - vec.x, 2) + Math.pow(this.y - vec.y, 2));
  }
  perp() {
    return new _Vec2(-this.y, this.x);
  }
  set(vec) {
    this.x = vec.x;
    this.y = vec.y;
  }
};

// collision.js
var ELSO_COUNTER_OFFSET = new Vec2(600, 400);
var ELSO_COUNTER_COLLISION_POINTS = [new Vec2(0, 155), new Vec2(155, 365), new Vec2(240, 365), new Vec2(85, 155)].map((point) => point.add(ELSO_COUNTER_OFFSET));
var MASODIK_COUNTER_COLLISION_POINTS = [new Vec2(1354, 841), new Vec2(1500, 841), new Vec2(1200, 413), new Vec2(1050, 413)];
var POLYS = [ELSO_COUNTER_COLLISION_POINTS, MASODIK_COUNTER_COLLISION_POINTS];
var FALAK = [
  { pos: new Vec2(1600, 1e3), dir: new Vec2(1600, 1e3).sub(new Vec2(1190, 415)) },
  { pos: new Vec2(0, 428), dir: new Vec2(1, 0) }
].map((val) => ({ pos: val.pos, dir: val.dir.normal().perp() }));
var RADIUS = 20;
var MACSKAOFFSET = new Vec2(0, -30);
function check_collision(macska_pos) {
  const circ_pos = macska_pos.add(MACSKAOFFSET);
  for (const points of POLYS) {
    let MTV = null;
    let axes = [];
    let prevpoint = points[points.length - 1];
    for (let i = 0; i < points.length; i++) {
      let point = points[i];
      let axis = point.sub(prevpoint).perp().normal();
      axes.push(axis);
      prevpoint = point;
    }
    for (let i = 0; i < points.length; i++) {
      let min = Infinity;
      let max = -Infinity;
      for (let point of points) {
        let scalar = point.sub(points[i]).dot(axes[i]);
        if (scalar > max) max = scalar;
        if (scalar < min) min = scalar;
      }
      let projcircpos = circ_pos.sub(points[i]).dot(axes[i]);
      let circmax = projcircpos + RADIUS;
      let circmin = projcircpos - RADIUS;
      let overlap = testPoints(min, max, circmin, circmax);
      if (overlap) {
        if (!MTV || MTV.len() > Math.abs(overlap)) {
          MTV = axes[i].scale(-overlap);
        }
      } else {
        MTV = null;
        break;
      }
    }
    if (MTV) {
      macska_pos.set(macska_pos.add(MTV));
    }
  }
  for (const fal of FALAK) {
    let projcircpos = circ_pos.sub(fal.pos).dot(fal.dir);
    let circmin = projcircpos - RADIUS;
    if (circmin < 0) {
      macska_pos.set(macska_pos.add(fal.dir.scale(-circmin)));
    }
  }
}
function testPoints(min1, max1, min2, max2) {
  if (min1 > min2 && min1 < max2) {
    return max2 - min1;
  } else if (min2 > min1 && min2 < max1) {
    return min2 - max1;
  } else return null;
}

// items.js
var items = [];
function newItem({ ...things }) {
  let item = { pos: new Vec2(0, 0), ...things, anchor: { x: 0.5, y: 1 } };
  items.push(item);
  return item;
}
function addItem(item) {
  items.push(item);
}
function findItem(type, player_pos) {
  let itemsInRange = items.filter((item) => item.type == type && item.pos.distance(player_pos) < INTERACT_DIST);
  if (itemsInRange.length != 0) {
    return itemsInRange.reduce((prev, cur) => prev.pos.distance(player_pos) < cur.pos.distance(player_pos) ? prev : cur);
  } else return null;
}
function removeItem(item) {
  let index = items.indexOf(item);
  if (index == items.length - 1) {
    items.pop();
  } else if (index != -1) {
    let replacer = items.pop();
    items[index] = replacer;
  }
}
var COUNTERTOPSTART = new Vec2(1190, 365);
var COUNTERTOPEND = new Vec2(1400, 660);
var COUNTERLENGTH = COUNTERTOPSTART.distance(COUNTERTOPEND);
var COUNTERDIR = COUNTERTOPEND.sub(COUNTERTOPSTART).normal();
var INTERACT_DIST = 250;
function findCounter(position) {
  let scalar = position.sub(COUNTERTOPSTART).dot(COUNTERDIR);
  let point;
  if (scalar < 0) {
    point = COUNTERTOPSTART;
  } else if (scalar > COUNTERLENGTH) {
    point = COUNTERTOPEND;
  } else {
    point = COUNTERTOPSTART.add(COUNTERDIR.scale(scalar));
  }
  if (point.distance(position) < INTERACT_DIST) {
    return point;
  } else {
    return null;
  }
}
function lookForPickupableItems(position) {
  let itemsInRange = items.filter((item) => item.pos.distance(position) < INTERACT_DIST);
  if (itemsInRange.length != 0) {
    return itemsInRange.reduce((prev, cur) => prev.pos.distance(position) < cur.pos.distance(position) ? prev : cur);
  } else return null;
}

// graphiclib.js
function renderGameObj(ctx2, gameobj) {
  if (gameobj.anchor) {
    if (gameobj.rot) {
      ctx2.save();
      ctx2.translate(gameobj.pos.x - gameobj.anchor.x * gameobj.width, gameobj.pos.y - gameobj.anchor.y * gameobj.height);
      ctx2.rotate(gameobj.rot);
      ctx2.drawImage(gameobj.image, 0, 0, gameobj.width, gameobj.height);
      ctx2.restore();
    } else {
      ctx2.drawImage(gameobj.image, gameobj.pos.x - gameobj.anchor.x * gameobj.width, gameobj.pos.y - gameobj.anchor.y * gameobj.height, gameobj.width, gameobj.height);
    }
  } else {
    ctx2.drawImage(gameobj.image, gameobj.pos.x, gameobj.pos.y, gameobj.width, gameobj.height);
  }
}
function importImages(images) {
  return Promise.all(images.map((path) => {
    return new Promise((resolve) => {
      let image = new Image();
      image.src = path;
      image.onload = () => resolve(image);
    });
  }));
}

// costumer.js
var [human_img, empty_dialog_img, coffee_mug_img, tej_img] = await importImages(["ember.svg", "dialog.svg", "telecs\xE9sze.svg", "tej.svg"]);
var ICON_SIZE = 50;
var ICON_PADDING = 0;
var DIALOG_MID_X = 100;
var DIALOG_ICON_Y_OFFSET = -70 - ICON_SIZE / 2;
var DIALOG_Y_OFFSET = -150;
var MAXWOBBLE = 0.03;
var WOBBLESPEED = 5e-3;
var CAFFEE_OPTS = [
  { type: "coffee" },
  { type: "coffee", tej: 1 },
  { type: "coffee", tej: 2 }
];
var COSUTMER_OFFSET = 210;
var LINE_START = new Vec2(480, 700);
var costumerLine = [];
function addCostumerToLine() {
  let costumer_x = LINE_START.x - COSUTMER_OFFSET * costumerLine.length;
  let obj = Object.create(Customer);
  obj.pos = new Vec2(-300, 500);
  obj.width = 200;
  obj.height = 400;
  obj.image = human_img;
  obj.anchor = { x: 0.5, y: 1 };
  obj.target = new Vec2(costumer_x, LINE_START.y);
  obj.speed = 4;
  obj.state = "order";
  obj.order = [evenChance(CAFFEE_OPTS)];
  obj.left = false;
  obj.dialogContent = [];
  obj.calcDialogContent();
  obj.rot = 0;
  obj.wobble_target = 0;
  costumerLine.push(obj);
  return obj;
}
function advanceLine() {
  costumerLine.forEach((costumer, index) => costumer.target = new Vec2(LINE_START.x - COSUTMER_OFFSET * index, LINE_START.y));
}
var Customer = {
  //this handles moving the costumer ot a set target and the wobble animation
  update(dt) {
    if (this.target) {
      if (this.pos.distance(this.target) > this.speed) {
        this.pos = this.pos.add(this.target.sub(this.pos).normal().scale(this.speed * dt));
        if (this.wobble_target == 0) {
          this.wobble_target = MAXWOBBLE;
        } else if (Math.abs(this.rot) == MAXWOBBLE) {
          this.wobble_target *= -1;
        }
      } else {
        Object.assign(this.pos, this.target);
        this.target = null;
        this.wobble_target = 0;
      }
    }
    if (Math.abs(this.wobble_target - this.rot) < WOBBLESPEED) {
      this.rot = this.wobble_target;
    } else {
      let dist = this.wobble_target - this.rot;
      let sign = dist / Math.abs(dist);
      this.rot += WOBBLESPEED * sign;
    }
  },
  //this renders their order in the diealog above the costumers head
  additionalRender(ctx2) {
    if (this.state == "order") {
      ctx2.drawImage(empty_dialog_img, this.pos.x - this.width / 2, this.pos.y + DIALOG_Y_OFFSET - this.height);
      for (let { image, x } of this.dialogContent) {
        ctx2.drawImage(image, this.pos.x - this.width / 2 + x, this.pos.y - this.height + DIALOG_ICON_Y_OFFSET, ICON_SIZE, ICON_SIZE);
      }
    }
  },
  //this calculet what should be in the dialog and how it should be laid out
  calcDialogContent() {
    let images = this.order.flatMap((piece) => {
      let output = [];
      switch (piece.type) {
        case "coffee": {
          output.push(coffee_mug_img);
          if (piece.tej == 1) output.push(tej_img);
          if (piece.tej == 2) {
            output.push(tej_img);
            output.push(tej_img);
          }
          break;
        }
      }
      return output;
    });
    let icons_width = images.length * ICON_SIZE + (images.length - 1) * ICON_PADDING;
    let icons_start = DIALOG_MID_X - icons_width / 2;
    this.dialogContent = images.map((image, index) => {
      let x = icons_start + index * (ICON_SIZE + ICON_PADDING);
      return { image, x };
    });
  },
  //this gets called when an item is delivered
  itemDelivered(item) {
    let index = this.order.findIndex((val) => item.content.type == "coffee" && val.type == "coffee" && val.tej == item.content.tej);
    if (index != -1) {
      this.order.splice(index, 1);
      if (this.order.length == 0) {
        this.done();
      }
      return true;
    } else {
      return false;
    }
  },
  done() {
    this.state = "leave";
    this.target = new Vec2(-200, 1e3);
    costumerLine.splice(costumerLine.indexOf(this), 1);
    advanceLine();
  }
};

// menu.js
function displayMenu(ctx2, title, level2) {
  return new Promise((resolve) => {
    ctx2.fillStyle = "white";
    ctx2.clearRect(0, 0, 1600, 1e3);
    ctx2.font = "30px monospace";
    ctx2.fillText(title, 800, 300);
    ctx2.font = "20px monospace";
    ctx2.fillText(`press any key to start level ${level2}`, 800, 700);
    setTimeout(() => {
      let eventlistener = () => {
        document.body.removeEventListener("keydown", eventlistener);
        resolve();
      };
      document.body.addEventListener("keydown", eventlistener);
    }, 1e3);
  });
}

// main.js
Array.prototype.remove = function(thing) {
  const i = this.indexOf(thing);
  if (i != -1) this.splice(i, 1);
};
var keys = {};
onkeydown = (event) => keys[event.key] = keys[event.key] == "press" || keys[event.key] == "hold" ? "hold" : "press";
onkeyup = (event) => keys[event.key] = null;
function testForKeyHolding() {
  for (const key in keys) {
    if (keys[key] == "press") keys[key] = "hold";
  }
}
var ctx = document.getElementsByTagName("canvas")[0].getContext("2d");
ctx.fillStyle = "white";
ctx.textAlign = "center";
var running = true;
var [macska_img, hatter_img, counter_img, coffee_img, filled_coffe_img, interact_img, telif\u0151z\u0151cs\u00E9sze_image, f\u00E9ligtelif\u0151z\u0151cs\u00E9sze_img, \u00FCresf\u0151z\u0151cs\u00E9sze_image, k\u00E1v\u00E9f\u0151z\u0151_img, k\u00E1v\u00E9f\u0151z\u0151cs\u00E9sz\u00E9vel_img, k\u00E1v\u00E9f\u0151z\u0151cs\u00E9szeteli_img, k\u00E1v\u00E9f\u0151z\u0151fej_img, smoke1, tej_img2] = await importImages([
  "macska.svg",
  "hatter.svg",
  "elso_counter.svg",
  "cs\xE9sze.svg",
  "telecs\xE9sze.svg",
  "interact.svg",
  "telif\u0151z\u0151cs\xE9sze.svg",
  "f\xE9ligtelif\u0151z\u0151cs\xE9sze.svg",
  "\xFCresf\u0151z\u0151cs\xE9sze.svg",
  "k\xE1v\xE9f\u0151z\u0151.svg",
  "k\xE1v\xE9f\u0151z\u0151cs\xE9sze.svg",
  "k\xE1v\xE9f\u0151z\u0151cs\xE9szeteli.svg",
  "k\xE1v\xE9f\u0151z\u0151fej.svg",
  "g\u0151z1.svg",
  "tej.svg"
]);
var smoke2 = (() => {
  let canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  let ctx2 = canvas.getContext("2d");
  ctx2.save();
  ctx2.translate(100, 0);
  ctx2.scale(-1, 1);
  ctx2.drawImage(smoke1, 0, 0, 100, 100);
  ctx2.restore();
  let img = new Image();
  img.src = canvas.toDataURL();
  return img;
})();
var SPEED = 7;
var MAXWOBBLE2 = 0.04;
var WOBBLESPEED2 = 7e-3;
var cat = { image: macska_img, pos: new Vec2(500, 500), anchor: { x: 0.6, y: 1 }, width: 100, height: 100, rot: 0, wobble_target: 0 };
var background = { image: hatter_img, pos: new Vec2(0, 0), width: 1600, height: 1e3 };
var counter = { image: counter_img, pos: new Vec2(600, 400 + 369), anchor: { x: 0, y: 1 }, width: 241, height: 369 };
var interactsign = { image: interact_img, anchor: { x: 0.5, y: 1.4 }, pos: new Vec2(0, 0), width: 100, height: 100 };
var showinteractsign = false;
var COUNTEROFFSET = new Vec2(600, 400);
var COFFEE_MACHINE_SCALE = 1.2;
var CAFE_COOK_TIME = 5e3;
var CAFFE_COOK_ANIM_FRAME = 500;
var KAVEF\u0150Z\u0150_INTERACT = new Vec2(1150, 300);
var G\u0150Z_POS = new Vec2(1100, 150);
var smoke_state = 0;
var COFFEE_MACHINE_X = 1100;
var COFFEE_MACHINE_Y = 250;
var COFFEE_MACHINE_BASE_WIDTH = 98.762 * COFFEE_MACHINE_SCALE;
var COFFEE_MACHINE_BASE_HEIGHT = 88.567 * COFFEE_MACHINE_SCALE;
var COFFEE_MACHINE_WITH_CUP_WIDTH = 104.86 * COFFEE_MACHINE_SCALE;
var coffee_machine_cup = null;
var coffee_machine_cooking = false;
var coffee_machine_state = 0;
function renderCoffeeMachine() {
  ctx.drawImage(k\u00E1v\u00E9f\u0151z\u0151_img, COFFEE_MACHINE_X, COFFEE_MACHINE_Y, COFFEE_MACHINE_BASE_WIDTH, COFFEE_MACHINE_BASE_HEIGHT);
  switch (coffee_machine_state) {
    case 0:
      break;
    case 1:
      ctx.drawImage(k\u00E1v\u00E9f\u0151z\u0151cs\u00E9sz\u00E9vel_img, COFFEE_MACHINE_X, COFFEE_MACHINE_Y, COFFEE_MACHINE_WITH_CUP_WIDTH, COFFEE_MACHINE_BASE_HEIGHT);
      break;
    case 2:
      ctx.drawImage(k\u00E1v\u00E9f\u0151z\u0151cs\u00E9szeteli_img, COFFEE_MACHINE_X, COFFEE_MACHINE_Y, COFFEE_MACHINE_WITH_CUP_WIDTH, COFFEE_MACHINE_BASE_HEIGHT);
      break;
  }
  ctx.drawImage(k\u00E1v\u00E9f\u0151z\u0151fej_img, COFFEE_MACHINE_X, COFFEE_MACHINE_Y, COFFEE_MACHINE_BASE_WIDTH, COFFEE_MACHINE_BASE_HEIGHT);
}
var brewing_cup = newItem({ image: \u00FCresf\u0151z\u0151cs\u00E9sze_image, width: 67, height: 67, type: "f\u0151z\u0151cs\xE9sze", fill: "none" });
brewing_cup.pos = new Vec2(1200, 400);
var milk = newItem({ image: tej_img2, width: 70, height: 70, type: "tej" });
milk.pos = new Vec2(1300, 600);
var costumers = [];
var costumerTime = 15e3;
var costumerCount = 1;
var remainingCostumers;
var level = 1;
function initStage() {
  renderList = [cat, brewing_cup, milk];
  remainingCostumers = costumerCount;
  setTimeout(costumerLoopCallback, 1e3);
  setTimeout(costumerCleanupLoopCallback, 2e4);
  running = true;
  update(performance.now());
}
function costumerLoopCallback() {
  if (remainingCostumers == 0) return;
  remainingCostumers -= 1;
  let costumer = addCostumerToLine();
  costumers.push(costumer);
  renderList.push(costumer);
  if (running) setTimeout(costumerLoopCallback, costumerTime);
}
function costumerCleanupLoopCallback() {
  if (costumers.length > 0) {
    let i = costumers.length - 1;
    while (i > -1) {
      if (costumers[i].state == "leave" && costumers[i].target == null) {
        costumers.splice(i, 1);
      }
      i -= 1;
    }
    if (costumers.length == 0 && remainingCostumers == 0) stageFinished();
    else setTimeout(costumerCleanupLoopCallback, 5e3);
  } else if (remainingCostumers == 0) {
    stageFinished();
  }
}
async function stageFinished() {
  running = false;
  costumerTime *= 0.9;
  costumerCount += 3;
  level += 1;
  await displayMenu(ctx, `You finished level ${level - 1}`, level);
  initStage();
}
var renderList;
var CUPBOARD_POS = new Vec2(930, 300);
var currentAction;
function findAction() {
  if (!equippedItem) {
    if (coffee_machine_cup != null && cat.pos.distance(KAVEF\u0150Z\u0150_INTERACT) < INTERACT_DIST && !coffee_machine_cooking) {
      interactsign.pos = KAVEF\u0150Z\u0150_INTERACT;
      showinteractsign = true;
      currentAction = { type: "take-f\u0151z\u0151cs\xE9sze" };
      return;
    }
    if (cat.pos.distance(CUPBOARD_POS) < 200) {
      interactsign.pos = CUPBOARD_POS;
      showinteractsign = true;
      currentAction = { type: "cupboard" };
      return;
    }
    let item = lookForPickupableItems(cat.pos);
    if (item) {
      interactsign.pos = item.pos;
      showinteractsign = true;
      currentAction = { type: "pickup", item };
      return;
    }
  } else if (equippedItem == brewing_cup) {
    if (cat.pos.distance(KAVEF\u0150Z\u0150_INTERACT) < INTERACT_DIST && coffee_machine_cup == null) {
      interactsign.pos = KAVEF\u0150Z\u0150_INTERACT;
      showinteractsign = true;
      currentAction = { type: "place-f\u0151z\u0151cs\xE9sze" };
      return;
    }
    if (brewing_cup.fill == "full" || brewing_cup.fill == "half") {
      let item = findItem("cup", cat.pos);
      if (item) {
        interactsign.pos = item.pos;
        showinteractsign = true;
        currentAction = { type: "pour-coffee", item };
        return;
      }
    }
  } else if (equippedItem == milk) {
    let k\u00E1v\u00E9 = findItem("coffee", cat.pos);
    if (k\u00E1v\u00E9 && (k\u00E1v\u00E9.content.tej < 2 || k\u00E1v\u00E9.content.tej == null)) {
      interactsign.pos = k\u00E1v\u00E9.pos;
      showinteractsign = true;
      currentAction = { type: "pour-milk", item: k\u00E1v\u00E9 };
      return;
    }
  } else {
    let closest_npc = costumers.filter((val) => val.pos.distance(cat.pos) < INTERACT_DIST);
    if (closest_npc.length != 0) {
      closest_npc = costumers.reduce((prev, cur) => prev.pos.distance(cat.pos) < cur.pos.distance(cat.pos) ? prev : cur);
      currentAction = { type: "give-item", npc: closest_npc };
      showinteractsign = false;
      return;
    }
  }
  showinteractsign = false;
  currentAction = null;
}
var equippedItem;
function equipItem(item) {
  removeItem(item);
  equippedItem = item;
}
function unEquipItem() {
  let item = equippedItem;
  equippedItem = null;
  return item;
}
var prevFrame = performance.now();
function update(timestamp) {
  if (!running) return;
  let dt = (timestamp - prevFrame) / 16.6666 || 1;
  prevFrame = timestamp;
  for (let costumer of costumers) {
    costumer.update(dt);
  }
  updateCat(dt);
  findAction();
  if (keys.q == "press") QPress();
  if (keys.e == "press") EPress();
  testForKeyHolding();
  render();
}
function renderEquippedItem() {
  if (equippedItem) {
    equippedItem.pos = cat.pos.add(new Vec2(-5, -100));
    renderGameObj(ctx, equippedItem);
  }
  ;
}
function testIfMacskaBeforeCounter() {
  if (cat.pos.y > counter.pos.y) {
    return true;
  } else if (cat.pos.y < counter.pos.y - 200) {
    return false;
  } else {
    return righterThanCounter(cat.pos) < 0;
  }
}
function render() {
  ctx.fillStyle = "black";
  ctx.clearRect(0, 0, 1600, 1e3);
  renderGameObj(ctx, background);
  renderCoffeeMachine();
  renderList.sort(sceneSortFunction).forEach((value) => {
    if (value == cat) {
      let is_before_counter = testIfMacskaBeforeCounter();
      if (is_before_counter) {
        renderGameObj(ctx, counter);
        renderEquippedItem();
        renderGameObj(ctx, cat);
      } else {
        renderGameObj(ctx, cat);
        renderEquippedItem();
        renderGameObj(ctx, counter);
      }
    } else {
      renderGameObj(ctx, value);
      if (value.additionalRender) value.additionalRender(ctx);
    }
  });
  if (coffee_machine_cooking) {
    if (smoke_state == 0) ctx.drawImage(smoke1, G\u0150Z_POS.x, G\u0150Z_POS.y, 100, 100);
    else ctx.drawImage(smoke2, G\u0150Z_POS.x, G\u0150Z_POS.y, 100, 100);
  }
  if (showinteractsign) renderGameObj(ctx, interactsign);
  requestAnimationFrame(update);
}
function sceneSortFunction(a, b) {
  return a.pos.y - b.pos.y;
}
var SIDE_DIR = new Vec2(155, 365).add(COUNTEROFFSET).sub(new Vec2(0, 155).add(COUNTEROFFSET));
var SIDE_POS = new Vec2(0, 155).add(COUNTEROFFSET);
function righterThanCounter(pos) {
  const t = (pos.y - SIDE_POS.y) / SIDE_DIR.y;
  const lineX = SIDE_POS.x + t * SIDE_DIR.x;
  return pos.x - lineX;
}
function updateCat(dt) {
  if (keys.w) cat.pos.y -= SPEED * dt;
  if (keys.s) cat.pos.y += SPEED * dt;
  if (keys.a) cat.pos.x -= SPEED * dt;
  if (keys.d) cat.pos.x += SPEED * dt;
  if (keys.w || keys.s || keys.a || keys.d) {
    if (cat.wobble_target == 0) {
      cat.wobble_target = MAXWOBBLE2;
    } else if (Math.abs(cat.rot) == MAXWOBBLE2) {
      cat.wobble_target *= -1;
    }
  } else {
    cat.wobble_target = 0;
  }
  if (Math.abs(cat.wobble_target - cat.rot) < WOBBLESPEED2) {
    cat.rot = cat.wobble_target;
  } else {
    let dist = cat.wobble_target - cat.rot;
    let sign = dist / Math.abs(dist);
    cat.rot += WOBBLESPEED2 * sign;
  }
  check_collision(cat.pos);
}
function QPress() {
  if (equippedItem) {
    let placepos = findCounter(cat.pos);
    if (placepos) {
      let item = unEquipItem();
      item.pos = placepos;
      renderList.push(item);
      addItem(item);
    }
  }
}
function EPress() {
  if (!currentAction) return;
  switch (currentAction.type) {
    case "pickup": {
      renderList.remove(currentAction.item);
      equipItem(currentAction.item);
      break;
    }
    case "cupboard": {
      let coffee = newItem({ image: coffee_img, width: 50, height: 50, type: "cup", content: {} });
      equipItem(coffee);
      break;
    }
    case "place-f\u0151z\u0151cs\xE9sze": {
      let cs\u00E9sze = unEquipItem();
      coffee_machine_cup = cs\u00E9sze;
      coffee_machine_state = 1;
      coffee_machine_cooking = true;
      let anim_interval = setInterval(() => {
        if (smoke_state == 0) smoke_state = 1;
        else smoke_state = 0;
      }, CAFFE_COOK_ANIM_FRAME);
      setTimeout(() => {
        coffee_machine_cooking = false;
        coffee_machine_state = 2;
        cs\u00E9sze.fill = "full";
        cs\u00E9sze.image = telif\u0151z\u0151cs\u00E9sze_image;
        clearInterval(anim_interval);
      }, CAFE_COOK_TIME);
      break;
    }
    case "take-f\u0151z\u0151cs\xE9sze": {
      coffee_machine_state = 0;
      equipItem(coffee_machine_cup);
      coffee_machine_cup = null;
      break;
    }
    case "pour-coffee": {
      let f\u0151z\u0151cs\u00E9sze = equippedItem;
      let cs\u00E9sze = currentAction.item;
      switch (f\u0151z\u0151cs\u00E9sze.fill) {
        case "full": {
          f\u0151z\u0151cs\u00E9sze.image = f\u00E9ligtelif\u0151z\u0151cs\u00E9sze_img;
          f\u0151z\u0151cs\u00E9sze.fill = "half";
          break;
        }
        case "half": {
          f\u0151z\u0151cs\u00E9sze.image = \u00FCresf\u0151z\u0151cs\u00E9sze_image;
          f\u0151z\u0151cs\u00E9sze.fill = "none";
          break;
        }
      }
      cs\u00E9sze.image = filled_coffe_img;
      cs\u00E9sze.type = "coffee";
      cs\u00E9sze.content = { type: "coffee" };
      break;
    }
    case "give-item": {
      if (currentAction.npc.itemDelivered(equippedItem)) {
        unEquipItem();
      }
      break;
    }
    case "pour-milk": {
      currentAction.item.content.tej = (currentAction.item.content.tej ?? 0) + 1;
      break;
    }
  }
}
await displayMenu(ctx, "Black Cat Caffee", 1);
initStage();
//# sourceMappingURL=main.js.map
