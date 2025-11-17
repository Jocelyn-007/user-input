# Wheels of Fortune – User Input Version

**Student:** Lin Xu  
**Artwork:** Pacita Abad – *Wheels of Fortune*  
**Individual method:** User input (mouse and keyboard)

---

## 1. Project overview

This project is my **individual version** of our group work.  
As a group, we wrote code to draw Pacita Abad’s *Wheels of Fortune* using p5.js.  
The group sketch was **static**: it showed the wheels, beads, and background dots, but they did not move.

In my individual work, I keep the same visual style and layout, but I add **interaction**.  
The wheels now **react to the user’s mouse and keyboard**, so the image feels alive when you move and click.

---

## 2. How to run

1. Open `index.html` in a modern browser (for example, Chrome).  
2. Make sure these files are in the same project:
   - `index.html`
   - `sketch.js` (my code)
   - `p5.min.js` and `p5.sound.min.js` in the correct `libraries` folder or linked by CDN.
3. The canvas will fill the browser window and resize when the window size changes.

All the drawing and interaction are built with **p5.js**.

---

## 3. How to interact

**Mouse**

- Move the mouse over the canvas:
  - Wheels close to the cursor **grow bigger** and start to **rotate**.
  - The closer the cursor is, the stronger the effect.
- Hold the mouse button:
  - Nearby wheels grow even more, spin faster, and the beads around them become **brighter**.
  - When you release the mouse, the wheels slowly calm down.

**Keyboard**

- `R` – Regenerate a new layout with different wheel positions and colours.
- `Shift + R` – Regenerate but keep the same seed (useful to test the same layout).
- `S` – Save a PNG of the current frame as  
  `wheels_of_fortune_user_input.png`.
- `A` – Toggle bead arcs (curved bead connections between wheels) on and off.

These inputs are the main part of my **User Input** idea.

---

## 4. My individual idea

The original group version focused on:

- Matching the painting’s **composition and colour**.
- Using clean, modular code:
  - `PaletteSystem`, `DotSystem`, `WheelSystem`, `BeadArc`, `LayoutSystem`.

For my individual task, I chose **User Input** as the driver:

- I keep the same structure and visual identity from the group work.
- I add a new animation layer on each wheel:
  - Wheels react to the **mouse position** and **mouse press**.
- I add simple **keyboard controls** to:
  - Show or hide the bead arcs.
  - Regenerate the layout.
  - Save a frame as an image.

Other group members use different methods (for example, audio, time-based events, or Perlin noise).  
My version is different because all the motion comes from **what the user does on the screen**, not from time or sound.

---

## 5. What is animated

For each wheel, I animate these properties:

1. **Size (radius)**
   - Each wheel has a base radius `baseR`.
   - I calculate an active radius with:
     ```js
     effectiveR = baseR * (1 + 0.6 * pulse);
     ```
   - `pulse` goes from 0 to 1.  
     When it is 1, the wheel can become about 60% bigger than its base size.

2. **Rotation**
   - Each wheel has its own `rotation` and `rotationSpeed`.
   - When the cursor is close, `rotationSpeed` increases.
   - When the mouse is pressed, the wheel spins even faster.
   - On every frame:
     ```js
     this.rotation += this.rotationSpeed;
     ```

3. **Bead brightness and size**
   - Each wheel has a ring of small beads.
   - When `pulse` is high:
     - The dark halo behind each bead becomes **brighter**.
     - The beads become slightly **larger**.
     - The bead colour moves closer to white using `lerpColor`.

4. **Centre circle**
   - The small circle in the middle of the wheel also changes size with `pulse`.  
   - This gives a feeling that the whole wheel is “waking up”.

5. **Background colour**
   - I map `mouseX` to the background hue:
     ```js
     const nx = constrain(width > 0 ? mouseX / width : 0.5, 0, 1);
     const bgHue = lerp(200, 220, nx * 0.6);
     background(bgHue, 40, 20);
     ```
   - This makes the background slightly change when the mouse moves, so the canvas feels more reactive.

---

## 6. Simple technical explanation

### 6.1 Code structure

The main parts of the code are:

- `PaletteSystem`  
  Picks colours from a shared palette and adds small random changes.

- `DotSystem`  
  Creates dot patterns for:
  - Background dots.
  - Dot rings for some wheel layers.

- `Wheel` class  
  Represents each wheel.  
  In my version, it also stores animation state:
  - `pulse`, `rotation`, `rotationSpeed`.

- `WheelSystem`  
  Helper functions to draw:
  - `sunburst` patterns.
  - `stripes` made of coloured arcs.

- `BeadArc` class  
  Draws curved lines of beads between wheels.  
  It uses three points (start, middle control point, end) to build a smooth curve.

- `LayoutSystem`  
  Decides where to place wheels on a grid and how to connect them with bead arcs.  
  It also calls `DotSystem` to fill the background with dots.

### 6.2 User Input logic

In each frame, for every wheel, I call:

```js
w.updateFromInput();
w.display();

Inside updateFromInput():

I measure the distance from the mouse to the wheel centre:
const d = dist(mouseX, mouseY, this.x, this.y);
const influenceRadius = this.baseR * 3.0;

If the cursor is inside this radius:

I calculate a proximity value between 0 and 1.

I set target values for pulse and rotationSpeed:

Higher values when the cursor is close.

Even higher values when the mouse is pressed.

I use lerp to move smoothly from the current value to the target value.

If the cursor is far away:

I slowly move pulse and rotationSpeed back to 0.

This makes the animation feel smooth and responsive, without hard jumps.
8. Tools, libraries and AI use

Libraries

p5.js
 – main library for drawing and interaction.

p5.sound
 – included, but not directly used in my individual version.

External techniques

I used a simple curve idea for BeadArc (start point, middle control point, end point) to make smooth bead connections.

All other logic uses standard p5.js functions we learned in class.

AI assistance

I used ChatGPT (OpenAI) to:

Help me improve English comments.

Help me structure this README and explain my idea more clearly.

I checked all code and text myself and made sure I understand how everything works.

No code was directly copied from online tutorials or other people’s repositories.
