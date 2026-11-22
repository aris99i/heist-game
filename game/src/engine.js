// engine.js — the rules of the heist: movement and cover, guard patrols and
// vision cones, sweeping cameras, the alarm meter, loot, the vault, smoke
// bombs, coin distractions, and the win/lose screens. Rendering lives in
// render.js; this file only decides what is true.

import { CONFIG, KEYS } from './config.js';
import { createLevel, lootTotal } from './world.js';
import { createAudio } from './audio.js';

const TAU = Math.PI * 2;

function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

function dist(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}

// Shortest angle between two headings, in (-PI, PI].
function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= TAU;
  while (d <= -Math.PI) d += TAU;
  return d;
}

// Does segment (x1,y1)-(x2,y2) hit rectangle r? Slab test.
function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  for (const [p, d, lo, hi] of [
    [x1, dx, r.x, r.x + r.w],
    [y1, dy, r.y, r.y + r.h],
  ]) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}

// Circle vs rectangle overlap (for movement collision).
function circleHitsRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

export class HeistGame {
  constructor() {
    this.audio = createAudio();
    this.best = 0;
    try {
      this.best = Number(localStorage.getItem('meridian-best') || 0) || 0;
    } catch {
      this.best = 0;
    }
    this.reset();
  }

  reset() {
    this.level = createLevel();
    this.thief = { x: this.level.spawn.x, y: this.level.spawn.y, angle: -Math.PI / 2, moving: false, sneaking: false };
    this.alarm = 0;
    this.maxAlarm = 0;
    this.score = 0;
    this.lootGot = 0;
    this.lootMax = lootTotal(this.level);
    this.starTaken = false;
    this.smokeLeft = CONFIG.SMOKE_START;
    this.coinLeft = CONFIG.COIN_START;
    this.smokes = [];
    this.time = 0;
    this.state = 'title'; // title | playing | caught | won
    this.message = '';
    this.messageT = 0;
    this.messageKind = 'info';
    this.spotted = false; // anyone sees the thief right now
    this.caughtBy = 'a guard';
    this.winInfo = null;
    this.frozen = false; // screenshots stage a fixed frame
    this.alarmBeepT = 0;
  }

  start() {
    this.audio.unlock();
    this.state = 'playing';
    this.say('Steal the Star of Meridian — then reach the green exit.', 'info', 4);
  }

  say(text, kind, secs) {
    this.message = text;
    this.messageKind = kind || 'info';
    this.messageT = secs || 3;
  }

  // --- sight -------------------------------------------------------------
  losClear(x1, y1, x2, y2) {
    for (const r of this.level.solids) {
      if (segmentHitsRect(x1, y1, x2, y2, r)) return false;
    }
    return true;
  }

  insideSmoke(x, y) {
    return this.smokes.some((s) => dist(x, y, s.x, s.y) < s.r);
  }

  // Can `eye` see the thief? Range, cone angle, line of sight, smoke.
  canSee(eye, range, halfAngle) {
    const t = this.thief;
    const d = dist(eye.x, eye.y, t.x, t.y);
    if (d > range) return false;
    const want = Math.atan2(t.y - eye.y, t.x - eye.x);
    if (Math.abs(angleDiff(want, eye.angle)) > halfAngle) return false;
    if (!this.losClear(eye.x, eye.y, t.x, t.y)) return false;
    if (this.insideSmoke(t.x, t.y)) return false;
    return true;
  }

  // --- movement ----------------------------------------------------------
  moveCircle(body, dx, dy, r) {
    const solids = this.level.solids;
    let nx = body.x + dx;
    if (!solids.some((s) => circleHitsRect(nx, body.y, r, s))) body.x = nx;
    let ny = body.y + dy;
    if (!solids.some((s) => circleHitsRect(body.x, ny, r, s))) body.y = ny;
    body.x = clamp(body.x, CONFIG.WALL + r, CONFIG.W - CONFIG.WALL - r);
    body.y = clamp(body.y, CONFIG.WALL + r, CONFIG.H - CONFIG.WALL - r);
  }

  // --- tools ---------------------------------------------------------------
  useSmoke() {
    if (this.smokeLeft <= 0) {
      this.say('No smoke bombs left.', 'warn', 2);
      return;
    }
    this.smokeLeft -= 1;
    this.smokes.push({ x: this.thief.x, y: this.thief.y, r: CONFIG.SMOKE_R, t: CONFIG.SMOKE_TIME });
    this.audio.smoke();
    this.say('Smoke out — you are hidden inside the cloud.', 'info', 2.5);
  }

  tossCoin(x, y) {
    if (this.coinLeft <= 0) {
      this.say('No coins left.', 'warn', 2);
      return;
    }
    this.coinLeft -= 1;
    this.audio.coin();
    let bestGuard = null;
    let bestD = 420;
    for (const g of this.level.guards) {
      const d = dist(g.x, g.y, x, y);
      if (d < bestD) {
        bestD = d;
        bestGuard = g;
      }
    }
    if (bestGuard) {
      bestGuard.state = 'investigate';
      bestGuard.investigate = { x, y };
      bestGuard.investigateT = CONFIG.COIN_INVESTIGATE_TIME;
      this.say(`${bestGuard.name} heard the coin — checking it out.`, 'info', 2.5);
    } else {
      this.say('The coin clinks on the marble. Nobody close enough.', 'info', 2);
    }
  }

  // --- loot ------------------------------------------------------------------
  grabLoot() {
    const t = this.thief;
    for (const p of this.level.paintings) {
      if (p.taken) continue;
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      if (dist(t.x, t.y, cx, cy) < 58) {
        p.taken = true;
        this.score += p.value;
        this.lootGot += 1;
        this.audio.pickup();
        this.say(`Painting lifted — +${p.value}.`, 'info', 2);
        return;
      }
    }
    for (const c of this.level.cases) {
      if (!c.gem || c.taken) continue;
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      if (dist(t.x, t.y, cx, cy) < 78) {
        c.taken = true;
        this.score += c.value;
        this.lootGot += 1;
        this.audio.gem();
        this.say(`Gem case emptied — +${c.value}.`, 'info', 2);
        return;
      }
    }
  }

  // --- main update -------------------------------------------------------------
  update(dt, input) {
    if (this.state === 'title') {
      if (input.wasPressed(KEYS.START)) this.start();
      return;
    }
    if (this.state === 'caught' || this.state === 'won') {
      if (input.wasPressed(KEYS.RESTART)) {
        this.reset();
        this.start();
      }
      return;
    }
    if (this.frozen) return;

    this.time += dt;
    if (this.messageT > 0) this.messageT -= dt;
    for (const s of this.smokes) s.t -= dt;
    this.smokes = this.smokes.filter((s) => s.t > 0);

    // Thief movement.
    const mv = input.moveVector();
    const t = this.thief;
    t.sneaking = input.sneaking && (mv.x !== 0 || mv.y !== 0);
    const speed = t.sneaking ? CONFIG.SNEAK_SPEED : CONFIG.THIEF_SPEED;
    if (mv.x !== 0 || mv.y !== 0) {
      t.moving = true;
      t.angle = Math.atan2(mv.y, mv.x);
      this.moveCircle(t, mv.x * speed * dt, mv.y * speed * dt, CONFIG.THIEF_R);
    } else {
      t.moving = false;
    }

    // Tools (and mute).
    if (input.wasPressed(KEYS.SMOKE)) this.useSmoke();
    if (input.wasPressed(['KeyM'])) this.audio.toggle();
    const click = input.mouseClick;
    if (click && this.coinLeft > 0) this.tossCoin(click.x, click.y);
    else if (input.wasPressed(KEYS.COIN)) this.tossCoin(t.x + Math.cos(t.angle) * 190, t.y + Math.sin(t.angle) * 190);

    // Loot and the vault.
    this.grabLoot();
    const v = this.level.vault;
    const vaultD = dist(t.x, t.y, v.x, v.y);
    if (!v.cracked && vaultD < 82) {
      if (input.cracking) {
        v.progress += dt / CONFIG.VAULT_CRACK_TIME;
        if (Math.random() < dt * 6) this.audio.crack();
        if (v.progress >= 1) {
          v.cracked = true;
          this.starTaken = true;
          this.score += CONFIG.STAR_VALUE;
          this.lootGot += 1;
          this.alarm = Math.min(100, this.alarm + CONFIG.VAULT_ALARM_TRIP);
          this.audio.gem();
          this.say('The Star of Meridian is yours! Now reach the green exit.', 'good', 4);
        }
      } else {
        v.progress = Math.max(0, v.progress - dt * 0.4);
        if (vaultD < 82) this.vaultHint = true;
      }
    } else {
      v.progress = Math.max(0, v.progress - dt * 0.4);
      this.vaultHint = false;
    }

    // Guards: patrol, investigate, hunt, and see.
    this.spotted = false;
    for (const g of this.level.guards) {
      const sees = this.canSee(g, CONFIG.GUARD_CONE_RANGE, CONFIG.GUARD_CONE_HALF);
      if (sees) {
        this.spotted = true;
        g.lastSeen = { x: t.x, y: t.y };
        this.alarm += CONFIG.GUARD_SPOT_RATE * dt;
      }
      if (g.state === 'investigate') {
        g.investigateT -= dt;
        this.walkGuardTo(g, g.investigate, CONFIG.GUARD_PATROL_SPEED, dt);
        if (g.investigateT <= 0 || dist(g.x, g.y, g.investigate.x, g.investigate.y) < 16) {
          g.state = 'patrol';
          g.investigate = null;
          g.pauseT = 1.2;
        }
      } else if (this.alarm >= CONFIG.ALARM_SUSPICIOUS_AT && g.lastSeen && !sees) {
        g.state = 'hunt';
        this.walkGuardTo(g, g.lastSeen, CONFIG.GUARD_CHASE_SPEED, dt);
        if (dist(g.x, g.y, g.lastSeen.x, g.lastSeen.y) < 20) {
          g.lastSeen = null;
          g.state = 'patrol';
        }
      } else {
        g.state = sees ? 'alert' : 'patrol';
        if (g.pauseT > 0) {
          g.pauseT -= dt;
        } else {
          const target = g.waypoints[g.wp];
          this.walkGuardTo(g, target, CONFIG.GUARD_PATROL_SPEED, dt);
          if (dist(g.x, g.y, target.x, target.y) < 10) {
            g.wp = (g.wp + 1) % g.waypoints.length;
            g.pauseT = 0.7;
          }
        }
      }
      // Caught on contact.
      if (dist(g.x, g.y, t.x, t.y) < CONFIG.GUARD_TOUCH_CAUGHT) {
        this.getCaught(`Guard ${g.name.split(' ')[1]} grabbed you`);
      }
    }

    // Cameras sweep and watch.
    for (const c of this.level.cameras) {
      c.phase += dt * CONFIG.CAM_SWEEP_SPEED;
      c.angle = c.base + Math.sin(c.phase) * CONFIG.CAM_SWEEP;
      if (this.canSee(c, CONFIG.CAM_RANGE, CONFIG.CAM_CONE_HALF)) {
        this.spotted = true;
        this.alarm += CONFIG.CAM_SPOT_RATE * dt;
      }
    }

    // Alarm: rise while seen, decay while hidden; beep faster as it climbs.
    if (!this.spotted) this.alarm = Math.max(0, this.alarm - CONFIG.ALARM_DECAY * dt);
    this.alarm = clamp(this.alarm, 0, 100);
    this.maxAlarm = Math.max(this.maxAlarm, this.alarm);
    if (this.alarm > 55) {
      this.alarmBeepT -= dt;
      if (this.alarmBeepT <= 0) {
        this.audio.alarmTick();
        this.alarmBeepT = this.alarm > 85 ? 0.45 : 0.8;
      }
    }
    if (this.alarm >= 100) {
      this.getCaught('The alarm hit 100% — security swarmed the gallery');
      return;
    }

    // Win: star in hand, reach the green exit.
    const e = this.level.exit;
    if (this.starTaken && t.x > e.x - 10 && t.x < e.x + e.w + 10 && t.y > e.y - 26 && t.y < e.y + e.h + 14) {
      this.win();
    }
  }

  walkGuardTo(g, target, speed, dt) {
    const d = dist(g.x, g.y, target.x, target.y);
    if (d < 1) return;
    const ang = Math.atan2(target.y - g.y, target.x - g.x);
    g.angle = ang;
    this.moveCircle(g, Math.cos(ang) * speed * dt, Math.sin(ang) * speed * dt, CONFIG.GUARD_R);
  }

  getCaught(why) {
    if (this.state !== 'playing') return;
    this.state = 'caught';
    this.caughtBy = why;
    this.audio.caught();
  }

  win() {
    if (this.state !== 'playing') return;
    this.state = 'won';
    const timeBonus = Math.max(0, Math.round(CONFIG.TIME_BONUS_BASE - this.time * 3));
    const ghost = this.maxAlarm < 50 ? CONFIG.GHOST_BONUS : 0;
    const total = this.score + timeBonus + ghost;
    this.winInfo = { loot: this.score, timeBonus, ghost, total, time: this.time };
    this.score = total;
    if (total > this.best) {
      this.best = total;
      try {
        localStorage.setItem('meridian-best', String(total));
      } catch {
        /* private mode: no best score saved */
      }
    }
    this.audio.win();
  }
}
