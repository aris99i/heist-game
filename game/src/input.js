// input.js — keyboard and mouse, kept apart from the game rules so the
// engine only ever asks "what is the player doing right now?".

import { KEYS } from './config.js';

export function createInput(canvas) {
  const down = new Set();
  const pressed = new Set(); // keys hit since the last update (edge-triggered)
  const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };

  function codeOf(e) {
    return e.code;
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) pressed.add(e.code);
    down.add(e.code);
  });
  window.addEventListener('keyup', (e) => down.delete(e.code));

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
    mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.clickX = ((e.clientX - r.left) / r.width) * canvas.width;
    mouse.clickY = ((e.clientY - r.top) / r.height) * canvas.height;
    mouse.clicked = true;
  });

  function held(names) {
    return names.some((n) => down.has(n));
  }

  return {
    // Movement vector, normalised, from WASD or arrows.
    moveVector() {
      let x = 0;
      let y = 0;
      if (held(KEYS.LEFT)) x -= 1;
      if (held(KEYS.RIGHT)) x += 1;
      if (held(KEYS.UP)) y -= 1;
      if (held(KEYS.DOWN)) y += 1;
      if (x !== 0 && y !== 0) {
        const s = Math.SQRT1_2;
        x *= s;
        y *= s;
      }
      return { x, y };
    },
    get sneaking() {
      return held(KEYS.SNEAK);
    },
    get cracking() {
      return held(KEYS.CRACK);
    },
    // Edge-triggered actions: true once per physical press.
    wasPressed(names) {
      return names.some((n) => pressed.has(n));
    },
    get mouseClick() {
      if (!mouse.clicked) return null;
      mouse.clicked = false;
      return { x: mouse.clickX, y: mouse.clickY };
    },
    get mousePos() {
      return { x: mouse.x, y: mouse.y };
    },
    // Call at the end of each frame so presses do not linger.
    endFrame() {
      pressed.clear();
    },
  };
}
