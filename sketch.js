// ======================================================
// Pacita Abad 'Wheels of Fortune' — STATIC (Simplified Modular Version)
// Modules: PaletteSystem / DotSystem / WheelSystem / LayoutSystem
// Controls: R = regenerate (new random seed)
//           Shift+R = regenerate (same seed)
//           S = save image
// ======================================================

let SEED = 0;
let wheels = [];
let beadArcs = [];
let backgroundDots = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100);
  noStroke();
  regenerate(false);
  noLoop(); // static output – no continuous animation
}

function draw() {
  background(200, 40, 20); // deep teal background
  DotSystem.drawBackgroundDots(backgroundDots);
  for (const arc of beadArcs) arc.display();
  for (const w of wheels) w.display();
}

function keyPressed() {
  if (key === 'R' || key === 'r') {
    const same = keyIsDown(SHIFT);
    regenerate(same);
  }
  if (key === 'S' || key === 's') {
    saveCanvas('wheels_of_fortune_static', 'png');
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  regenerate(true);
}

function newSeed() {
  SEED = (Date.now() ^ Math.floor(performance.now() * 1000) ^ Math.floor(Math.random() * 1e9)) >>> 0;
}

function regenerate(keepSameSeed = false) {
  if (!keepSameSeed) newSeed();
  randomSeed(SEED);
  noiseSeed(SEED);

  wheels = LayoutSystem.generateWheels();
  beadArcs = LayoutSystem.generateBeadArcs(wheels, 2);
  backgroundDots = LayoutSystem.generateBackgroundDots(wheels);
  redraw();
}

// ======================================================
// Part 1. PaletteSystem — Color control
// ======================================================

const PaletteSystem = {
  basePalette: [
    [340, 90, 100], // magenta
    [25,  95, 100], // orange
    [55,  90, 100], // yellow
    [200, 60,  90], // cyan-blue
    [120, 70,  90], // green
    [0,   0, 100],  // white
    [0,   0,  15]   // black
  ],

  pick() {
    const p = this.basePalette[int(random(this.basePalette.length))];
    let h = (p[0] + random(-8, 8) + 360) % 360;
    let s = constrain(p[1] + random(-6, 6), 50, 100);
    let b = constrain(p[2] + random(-6, 6), 40, 100);
    return color(h, s, b);
  }
};

// ======================================================
// Part 2. DotSystem — Dot patterns
// ======================================================

const DotSystem = {
  makeRingDots(rad) {
    const count = int(map(rad, 20, 220, 16, 32)); // lower density for large rings
    const dotR  = rad * 0.10;
    const dots = [];
    for (let k = 0; k < count; k++) {
      const a = (TWO_PI * k) / count;
      const rr = rad * random(0.8, 0.95);
      dots.push({ x: cos(a) * rr, y: sin(a) * rr, r: dotR });
    }
    return dots;
  },

  generateBackgroundDots(wheels) {
    const dots = [];
    const step = min(width, height) / 28;
    const paletteBG = [
      color(0, 0, 100),
      color(0, 0, 15),
      color(25, 95, 100),
      color(340, 90, 100)
    ];

    for (let y = step * 0.5; y < height; y += step) {
      for (let x = step * 0.5; x < width; x += step) {
        if (random() >= 0.6) continue;
        const px = x + random(-step * 0.3, step * 0.3);
        const py = y + random(-step * 0.3, step * 0.3);

        // skip dots inside wheels
        let insideWheel = false;
        for (const w of wheels) {
          if (dist(px, py, w.x, w.y) < w.baseR * 0.9) {
            insideWheel = true;
            break;
          }
        }
        if (insideWheel) continue;

        dots.push({
          x: px,
          y: py,
          r: random(step * 0.06, step * 0.12),
          c: random(paletteBG)
        });
      }
    }
    return dots;
  },

  drawBackgroundDots(dots) {
    for (const d of dots) {
      fill(d.c);
      ellipse(d.x, d.y, d.r * 2);
    }
  }
};

// ======================================================
// Part 3. Wheels and bead rings (user input version)
// ======================================================

class Wheel {
  constructor(x, y, baseR) {
    this.x = x;
    this.y = y;
    this.baseR = baseR;

    // Core and bead colours taken from the shared palette
    this.coreCol  = PaletteSystem.pick();
    this.beadColor = PaletteSystem.pick();

    // -----------------------------
    // Internal layered structure
    // -----------------------------
    this.layers = [];
    const nLayers = int(random(3, 5));

    for (let i = 0; i < nLayers; i++) {
      // Ratio describes how big this layer is relative to the wheel radius
      const ratio = map(i, 0, nLayers - 1, 0.25, 1.0);
      const style = random(["solid", "dots", "sunburst", "stripes"]);
      const col = PaletteSystem.pick();

      const layer = { ratio, style, col };

      // For dot layers we pre-compute a ring of dots
      if (style === "dots") {
        const rad = this.baseR * ratio * 0.9;
        layer.dots = DotSystem.makeRingDots(rad);
      }

      this.layers.push(layer);
    }

    // -----------------------------
    // Outer bead ring
    // -----------------------------
    const ringR = this.baseR * 0.88;
    const beadSize = this.baseR * 0.09;
    const circumference = TWO_PI * ringR;
    const count = max(10, int(circumference / (beadSize * 1.2)));

    this.beadRing = {
      r: ringR,
      size: beadSize,
      count: count
    };

    // -----------------------------
    // Animation state (user input)
    // -----------------------------
    this.pulse = 0;                 // 0..1, controls scale and brightness
    this.rotation = random(TWO_PI); // starting angle
    this.rotationSpeed = 0;         // updated based on mouse proximity
  }

  // Effective radius with a strong scale effect when activated
  getEffectiveR() {
    // Up to +60% bigger when pulse is 1
    return this.baseR * (1 + 0.6 * this.pulse);
  }

  // Update animation parameters according to mouse position and mouse press
  updateFromInput() {
    const d = dist(mouseX, mouseY, this.x, this.y);
// enlarge the area where the cursor can affect the wheel
const influenceRadius = this.baseR * 3.0;   // was 2.2

if (d < influenceRadius) {
  // Closer to the cursor → stronger effect
  const proximity = 1 - d / influenceRadius; // 0..1

  // stronger pulse when the user is close or pressing the mouse
  const targetPulse = mouseIsPressed ? 1 : 0.9 * proximity; // was 0.6 * proximity
  this.pulse = lerp(this.pulse, targetPulse, 0.2);          // was 0.15

  // slightly faster rotation speeds
  const targetSpeed = mouseIsPressed ? 0.08 : 0.05 * proximity; // was 0.06 / 0.03
  this.rotationSpeed = lerp(this.rotationSpeed, targetSpeed, 0.18); // was 0.15
} else {
  // Let the wheel slowly calm down when the cursor is far away
  this.pulse = lerp(this.pulse, 0, 0.12);          // was 0.1
  this.rotationSpeed = lerp(this.rotationSpeed, 0, 0.12);  // was 0.1
}

this.rotation += this.rotationSpeed;

  }

  // Draw the wheel with current animated state
  display() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);

    const effectiveR = this.getEffectiveR();

    // ---------------------------------
    // Outer ring of small beads
    // ---------------------------------
    for (let i = 0; i < this.beadRing.count; i++) {
      const a  = (TWO_PI * i) / this.beadRing.count;
      const bx = cos(a) * (effectiveR * 0.88);
      const by = sin(a) * (effectiveR * 0.88);

      // Dark halo behind each bead (brightness grows with pulse)
      const haloBrightness = lerp(15, 75, this.pulse);
      fill(0, 0, haloBrightness);
      ellipse(
        bx,
        by,
        this.beadRing.size * 1.4 * (1 + 0.3 * this.pulse) // halo also scales a bit
      );

      // Bead colour moves towards white when active
      const beadCol = lerpColor(this.beadColor, color(0, 0, 100), this.pulse * 0.7);
      fill(beadCol);
      ellipse(bx, by, this.beadRing.size * (1 + 0.25 * this.pulse));
    }

    // ---------------------------------
    // Internal layered patterns
    // ---------------------------------
    for (const L of this.layers) {
      const rad = effectiveR * L.ratio * 0.9;

      switch (L.style) {
        case "solid":
          fill(L.col);
          ellipse(0, 0, rad * 2);
          break;

        case "dots":
          fill(L.col);
          for (const d of L.dots) {
            ellipse(d.x, d.y, d.r * 2);
          }
          break;

        case "sunburst":
          WheelSystem.drawSunburst(rad, L.col);
          break;

        case "stripes":
          WheelSystem.drawStripes(rad, L.col);
          break;
      }
    }

    // ---------------------------------
    // Small centre circle
    // ---------------------------------
    // The centre circle also scales slightly with pulse
    fill(this.coreCol);
    ellipse(0, 0, effectiveR * (0.18 + 0.12 * this.pulse));

    pop();
  }
}

// -------------------------------------
// WheelSystem: helpers to draw patterns
// -------------------------------------
const WheelSystem = {
  // Radial "sunburst" pattern
  drawSunburst(rad, col) {
    const rays = int(map(rad, 20, 220, 20, 40));

    for (let i = 0; i < rays; i++) {
      const a0 = (TWO_PI * i) / rays;
      const a1 = (TWO_PI * (i + 0.5)) / rays;

      // Alternate between the layer colour and dark wedges
      fill(i % 2 === 0 ? col : color(0, 0, 15));

      beginShape();
      vertex(0, 0);
      vertex(cos(a0) * rad, sin(a0) * rad);
      vertex(cos(a1) * rad, sin(a1) * rad);
      endShape(CLOSE);
    }
  },

  // Concentric striped arcs
  drawStripes(rad, col) {
    const bands = int(random(4, 6));
    const thick = (rad * 0.9) / bands;

    for (let b = 0; b < bands; b++) {
      const rr = rad * 0.1 + b * thick;
      const segs = int(map(rad, 20, 220, 12, 24));

      for (let i = 0; i < segs; i++) {
        const a0 = (TWO_PI * i) / segs;
        const a1 = (TWO_PI * (i + 0.6)) / segs;

        // Colour shifts slightly with band index and segment index
        fill(
          (hue(col) + b * 8 + i * 3) % 360,
          saturation(col),
          brightness(col)
        );

        arc(0, 0, rr * 2, rr * 2, a0, a1, PIE);
      }
    }
  }
};

// -------------------------------------
// BeadArc: curved connections between wheels
// -------------------------------------
class BeadArc {
  constructor(wA, wB) {
    const a = createVector(wA.x, wA.y);
    const b = createVector(wB.x, wB.y);

    // Direction from wheel A to wheel B
    const dir = p5.Vector.sub(b, a).normalize();

    // Start point on the edge of wheel A
    const rA = wA.baseR * 0.95;
    this.A = p5.Vector.add(a, p5.Vector.mult(dir, rA));

    // End point on the edge of wheel B
    const rB = wB.baseR * 0.95;
    this.B = p5.Vector.sub(b, p5.Vector.mult(dir, rB));

    // Chord from A to B and its midpoint
    const chord = p5.Vector.sub(this.B, this.A);
    const mid = p5.Vector.add(this.A, p5.Vector.mult(chord, 0.5));

    // Perpendicular direction (normal) to lift the arc off the chord
    const normal = createVector(-chord.y, chord.x).normalize();

    // Control point for a quadratic Bézier curve
    const curvature = chord.mag() * (0.25 + random(-0.08, 0.08));
    this.C = p5.Vector.add(mid, p5.Vector.mult(normal, curvature));

    // Bead colour taken from wheel A
    this.col = wA.beadColor;

    // Bead size and count along the curve
    const beadSize = min(wA.baseR, wB.baseR) * 0.06;
    const spacing = beadSize * 1.4;
    const approxLen = chord.mag() * 1.1;
    this.n = max(4, int(approxLen / spacing));
    this.beadSize = beadSize;
  }

  // Quadratic Bézier interpolation between A, C, B
  _pointAt(t) {
    const mt = 1 - t;
    const x = mt * mt * this.A.x +
              2 * mt * t * this.C.x +
              t * t * this.B.x;
    const y = mt * mt * this.A.y +
              2 * mt * t * this.C.y +
              t * t * this.B.y;
    return createVector(x, y);
  }

  // Draw beads along the curve
  display() {
    for (let i = 0; i <= this.n; i++) {
      const t = i / this.n;
      const p = this._pointAt(t);

      // Small dark halo behind each bead
      fill(0, 0, 15);
      ellipse(p.x, p.y, this.beadSize * 1.45);

      // Coloured bead
      fill(this.col);
      ellipse(p.x, p.y, this.beadSize);
    }
  }
}



// ======================================================
// Part 4. LayoutSystem — Positioning and generation
// ======================================================

const LayoutSystem = {
  generateWheels() {
    const wheelsOut = [];
    const unit = min(width, height) / 9;
    const cols = int(width / unit) + 1;
    const rows = int(height / unit) + 1;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if (random() < 0.8) {
          const cx = (i + 0.5) * unit + random(-unit * 0.25, unit * 0.25);
          const cy = (j + 0.5) * unit + random(-unit * 0.25, unit * 0.25);
          const r  = unit * random(0.55, 1.05);

          // Avoid overlapping wheels
          let ok = true;
          for (const w of wheelsOut) {
            if (dist(cx, cy, w.x, w.y) < (r + w.baseR) * 0.85) {
              ok = false;
              break;
            }
          }
          if (ok) wheelsOut.push(new Wheel(cx, cy, r));
        }
      }
    }
    return wheelsOut;
  },

  generateBeadArcs(wheelsIn, neighborsPerWheel = 2) {
    const arcs = [];
    for (let i = 0; i < wheelsIn.length; i++) {
      const w1 = wheelsIn[i];
      const candidates = [];
      for (let j = 0; j < wheelsIn.length; j++) {
        if (i === j) continue;
        const d = dist(w1.x, w1.y, wheelsIn[j].x, wheelsIn[j].y);
        candidates.push({ j, d });
      }
      candidates.sort((a, b) => a.d - b.d);

      let added = 0;
      for (const c of candidates) {
        if (added >= neighborsPerWheel) break;
        const j = c.j;
        if (j < i) continue;
        const w2 = wheelsIn[j];
        const d = c.d;

        // Skip if wheels too close or too far
        if (d < (w1.baseR + w2.baseR) * 0.95) continue;
        if (d > min(width, height) / 2) continue;

        const arc = new BeadArc(w1, w2);
        const mid = arc._pointAt(0.5);

        // Avoid arcs passing through other wheels
        let blocked = false;
        for (let k = 0; k < wheelsIn.length; k++) {
          if (k === i || k === j) continue;
          if (dist(mid.x, mid.y, wheelsIn[k].x, wheelsIn[k].y) < wheelsIn[k].baseR * 0.9) {
            blocked = true;
            break;
          }
        }
        if (!blocked) {
          arcs.push(arc);
          added++;
        }
      }
    }
    return arcs;
  },

  generateBackgroundDots(wheelsIn) {
    return DotSystem.generateBackgroundDots(wheelsIn);
  }
};
