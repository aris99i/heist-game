// main.js — bootstrap: build the game, wire the input, run the frame loop.
// A `?shot=` query stages one fixed scene for screenshots; without it the
// game starts on its title screen and waits for Enter.

import { HeistGame } from './engine.js';
import { drawGame } from './render.js';
import { applyShot } from './shots.js';
import { createInput } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const game = new HeistGame();
const input = createInput(canvas);

const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) {
  applyShot(game, shot);
  drawGame(ctx, game);
} else {
  let last = performance.now();
  // Coming back to a hidden tab must not fast-forward the game.
  document.addEventListener('visibilitychange', () => {
    last = performance.now();
  });
  const frame = (now) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    game.update(dt, input);
    drawGame(ctx, game);
    input.endFrame();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// For play-testing from the console and for the screenshot harness.
window.__game = game;
