// config.js — every tunable number for The Meridian Heist lives here, so the
// rest of the game reads like a rulebook instead of a pile of magic numbers.

export const CONFIG = {
  // Canvas and room.
  W: 1280,
  H: 800,
  WALL: 24,

  // The thief.
  THIEF_R: 13,
  THIEF_SPEED: 175,
  SNEAK_SPEED: 98,

  // Guards.
  GUARD_R: 14,
  GUARD_PATROL_SPEED: 72,
  GUARD_CHASE_SPEED: 118,
  GUARD_CONE_RANGE: 235,
  GUARD_CONE_HALF: 0.55, // radians, ~31 degrees each side
  GUARD_SPOT_RATE: 58, // alarm points per second while the thief is seen
  GUARD_TOUCH_CAUGHT: 30, // distance that means caught on contact

  // Wall cameras.
  CAM_RANGE: 265,
  CAM_CONE_HALF: 0.46,
  CAM_SPOT_RATE: 46,
  CAM_SWEEP: 0.62, // radians each side of the base angle
  CAM_SWEEP_SPEED: 0.55,

  // Alarm meter: 0..100. Fills while seen, drains while hidden.
  ALARM_DECAY: 13,
  ALARM_SUSPICIOUS_AT: 35, // guards start hunting the last seen spot

  // Tools.
  SMOKE_START: 3,
  SMOKE_R: 92,
  SMOKE_TIME: 4.5,
  COIN_START: 3,
  COIN_INVESTIGATE_TIME: 3.5,

  // The vault and the Star of Meridian.
  VAULT_CRACK_TIME: 2.5,
  VAULT_ALARM_TRIP: 15, // silent alarm: cracking the vault adds this much

  // Loot values.
  PAINTING_VALUE: 150,
  GEM_VALUE: 250,
  STAR_VALUE: 1000,
  GHOST_BONUS: 400, // win while the alarm never passed 50
  TIME_BONUS_BASE: 900, // win bonus starts here, minus 3 per second played

  // Palette: a museum after closing — deep blue-charcoal, warm gold, red danger.
  COLORS: {
    floorA: '#1b1e2c',
    floorB: '#181b27',
    carpet: '#5d2430',
    carpetEdge: '#7a3040',
    wall: '#3c4160',
    wallTop: '#4a5080',
    wallTrim: '#c9a227',
    caseFrame: '#8a6d2f',
    caseGlass: 'rgba(150, 190, 220, 0.10)',
    gold: '#f5c542',
    goldDim: '#b98a1e',
    paintingFrame: '#6b4f1d',
    thief: '#4ade80',
    thiefDark: '#22c55e',
    guard: '#5b7bd5',
    guardSuit: '#2e3d6e',
    coneGuard: 'rgba(245, 197, 66, 0.20)',
    coneGuardEdge: 'rgba(245, 197, 66, 0.45)',
    coneCam: 'rgba(239, 68, 68, 0.16)',
    coneCamEdge: 'rgba(239, 68, 68, 0.4)',
    smoke: 'rgba(200, 205, 215, 0.34)',
    exit: '#22c55e',
    text: '#e8e6df',
    textDim: '#9aa0b5',
    danger: '#ef4444',
    warn: '#f59e0b',
  },
};

// Keyboard bindings. Arrows and WASD both move; Shift sneaks.
export const KEYS = {
  UP: ['ArrowUp', 'KeyW'],
  DOWN: ['ArrowDown', 'KeyS'],
  LEFT: ['ArrowLeft', 'KeyA'],
  RIGHT: ['ArrowRight', 'KeyD'],
  SNEAK: ['ShiftLeft', 'ShiftRight'],
  SMOKE: ['KeyF'],
  COIN: ['KeyC'],
  CRACK: ['KeyE'],
  RESTART: ['KeyR'],
  START: ['Enter'],
};
