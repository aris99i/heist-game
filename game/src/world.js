// world.js — the Meridian Museum floor plan: walls, display cases, loot,
// the vault, the guards' patrols, the cameras and the exit. Nothing here
// moves; engine.js owns the living state. One room, built to be read in a
// single screenshot: every heist element is on screen at once.

import { CONFIG } from './config.js';

const { W, H, WALL } = CONFIG;

// Axis-aligned rectangles. `solid` blocks movement and line of sight.
function rect(x, y, w, h) {
  return { x, y, w, h };
}

export function createLevel() {
  // Interior divider walls (cover to hide behind).
  const walls = [
    rect(420, 170, 18, 230), // tall divider, upper middle-left
    rect(700, 430, 250, 18), // long divider, lower middle-right
    rect(180, 520, 18, 170), // short divider, lower left
    rect(1050, 150, 18, 180), // short divider, upper right
  ];

  // Freestanding glass display cases: cover, and two of them hold gems.
  const cases = [
    { ...rect(300, 300, 96, 54), gem: true, taken: false, value: CONFIG.GEM_VALUE },
    { ...rect(880, 560, 96, 54), gem: true, taken: false, value: CONFIG.GEM_VALUE },
    { ...rect(560, 150, 96, 54), gem: false, taken: false, value: 0 },
    { ...rect(240, 640, 96, 54), gem: false, taken: false, value: 0 },
    { ...rect(1060, 330, 60, 60), gem: false, taken: false, value: 0 }, // statue plinth
    { ...rect(120, 180, 60, 60), gem: false, taken: false, value: 0 }, // statue plinth
  ];

  // Paintings hang on the walls: small loot, five of them.
  const paintings = [
    { x: 120, y: 70, w: 74, h: 52, taken: false, value: CONFIG.PAINTING_VALUE, hue: '#c94f4f' },
    { x: 330, y: 70, w: 74, h: 52, taken: false, value: CONFIG.PAINTING_VALUE, hue: '#4f7ec9' },
    { x: 760, y: 70, w: 74, h: 52, taken: false, value: CONFIG.PAINTING_VALUE, hue: '#c9a24f' },
    { x: 1160, y: 300, w: 52, h: 74, taken: false, value: CONFIG.PAINTING_VALUE, hue: '#6fc94f' },
    { x: 120, y: 430, w: 52, h: 74, taken: false, value: CONFIG.PAINTING_VALUE, hue: '#9b4fc9' },
  ];

  // The vault: a round pedestal at the heart of the gallery, holding the Star.
  const vault = { x: 950, y: 380, r: 36, progress: 0, cracked: false };

  // Guards walk waypoints and look where they walk.
  const guards = [
    {
      name: 'Guard Mara',
      x: 150, y: 250, angle: 0,
      waypoints: [{ x: 150, y: 250 }, { x: 500, y: 250 }, { x: 500, y: 120 }, { x: 150, y: 120 }],
      wp: 1, state: 'patrol', investigate: null, investigateT: 0, lastSeen: null, pauseT: 0,
    },
    {
      name: 'Guard Oka',
      x: 850, y: 150, angle: Math.PI / 2,
      waypoints: [{ x: 850, y: 150 }, { x: 850, y: 600 }, { x: 1080, y: 600 }, { x: 1080, y: 150 }],
      wp: 1, state: 'patrol', investigate: null, investigateT: 0, lastSeen: null, pauseT: 0,
    },
    {
      name: 'Guard Sinta',
      x: 700, y: 620, angle: Math.PI,
      waypoints: [{ x: 700, y: 620 }, { x: 1150, y: 620 }, { x: 1150, y: 700 }, { x: 700, y: 700 }],
      wp: 1, state: 'patrol', investigate: null, investigateT: 0, lastSeen: null, pauseT: 0,
    },
  ];

  // Cameras sit on the walls and sweep their cones.
  const cameras = [
    { x: 60, y: 60, base: Math.PI / 4, angle: Math.PI / 4, phase: 0 },
    { x: 1220, y: 60, base: (3 * Math.PI) / 4, angle: (3 * Math.PI) / 4, phase: 2.1 },
    { x: 1220, y: 740, base: (-3 * Math.PI) / 4, angle: (-3 * Math.PI) / 4, phase: 4.2 },
  ];

  // The exit: a green door in the bottom wall. The thief slips in here.
  const exit = { x: 600, y: H - WALL - 6, w: 80, h: 30 };

  return {
    walls,
    cases,
    paintings,
    vault,
    guards,
    cameras,
    exit,
    spawn: { x: 640, y: 700 },
    // Everything that blocks movement and sight: outer walls + dividers + cases.
    solids: [
      rect(0, 0, W, WALL),
      rect(0, H - WALL, W, WALL),
      rect(0, 0, WALL, H),
      rect(W - WALL, 0, WALL, H),
      ...walls,
      ...cases.map((c) => rect(c.x, c.y, c.w, c.h)),
    ],
  };
}

// All loot the room holds, for the HUD counter.
export function lootTotal(level) {
  return level.paintings.length + level.cases.filter((c) => c.gem).length + 1;
}
