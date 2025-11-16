// userinput-lixu0708.js
// ==========================================
// Individual User Input version
// Extends the group code without changing it
// ==========================================

// how strong the hover/breathing effect is
let hoverScaleMax = 1.35;

// 1) Override Wheel.getEffectiveR to react to the mouse
//    This assumes group_static.js has already defined class Wheel.
Wheel.prototype.getEffectiveR = function () {
  let r = this.baseR;

  if (mouseX !== undefined && mouseY !== undefined) {
    const d = dist(mouseX, mouseY, this.x, this.y);
    const maxInfluence = this.baseR * 4; // how far the effect reaches

    if (d < maxInfluence) {
      // t = 1 when cursor is at centre, 0 at edge
      const t = 1 - d / maxInfluence;
      const scale = 1 + (hoverScaleMax - 1) * t;
      r *= scale;
    }
  }
  return r;
};

// 2) Extend keyPressed: keep group behaviour + add my own keys
const groupKeyPressed = window.keyPressed || function () {};

function keyPressed() {
  // call the original group keyPressed (R / S keys etc.)
  groupKeyPressed();

  // optional: use arrow keys to change hover strength
  if (keyCode === UP_ARROW) {
    hoverScaleMax = min(hoverScaleMax + 0.05, 1.7);
    redraw();
  } else if (keyCode === DOWN_ARROW) {
    hoverScaleMax = max(hoverScaleMax - 0.05, 1.05);
    redraw();
  }
}

// 3) Mouse input: drive redraw so the interaction feels alive

function mouseMoved() {
  // every time the mouse moves, we redraw one frame
  redraw();
}

function mouseDragged() {
  redraw();
}

function mousePressed() {
  // optional: change "mood" based on mouse button
  if (mouseButton === LEFT) {
    hoverScaleMax = 1.5;
  } else if (mouseButton === RIGHT) {
    hoverScaleMax = 1.15;
  }
  redraw();
}
