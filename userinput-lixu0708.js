// userinput-lixu0708.js (simplified version)
// Extends the group code with mouse-based interaction.

// Maximum scale for wheels near the mouse (1.0 = no change).
let hoverScaleMax = 1.35;

// Override Wheel.getEffectiveR so wheels grow near the cursor.
Wheel.prototype.getEffectiveR = function () {
  let r = this.baseR;

  if (mouseX !== undefined && mouseY !== undefined) {
    const d = dist(mouseX, mouseY, this.x, this.y);
    const maxInfluence = this.baseR * 4;

    if (d < maxInfluence) {
      const t = 1 - d / maxInfluence;          // 1 at centre → 0 at edge
      const scale = 1 + (hoverScaleMax - 1) * t;
      r *= scale;
    }
  }
  return r;
};

// Keep the original group keyPressed behaviour and add extra keys.
const baseKeyPressed = window.keyPressed || function () {};

function keyPressed() {
  baseKeyPressed();

  if (keyCode === UP_ARROW) {
    hoverScaleMax = min(hoverScaleMax + 0.05, 1.7);
    redraw();
  } else if (keyCode === DOWN_ARROW) {
    hoverScaleMax = max(hoverScaleMax - 0.05, 1.05);
    redraw();
  }
}

// Redraw whenever the mouse moves or drags, so the interaction is visible.
function mouseMoved() {
  redraw();
}

function mouseDragged() {
  redraw();
}

// Optional: change interaction strength with mouse buttons.
function mousePressed() {
  if (mouseButton === LEFT) {
    hoverScaleMax = 1.5;
  } else if (mouseButton === RIGHT) {
    hoverScaleMax = 1.15;
  }
  redraw();
}
