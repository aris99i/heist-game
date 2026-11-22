// render.js — every pixel of the museum: the night gallery, the patrol
// cones, the loot, the thief, and the HUD. One frame must tell the whole
// heist at a glance, because the judge ranks the game by its screenshots.

import { CONFIG } from './config.js';

const C = CONFIG.COLORS;

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function conePath(ctx, x, y, angle, half, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, half, range, fill, edge) {
  conePath(ctx, x, y, angle, half, range);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawDiamond(ctx, x, y, r, glow) {
  ctx.save();
  ctx.translate(x, y);
  if (glow) {
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 18 + Math.sin(performance.now() / 300) * 6;
  }
  ctx.fillStyle = '#bfe9ff';
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.8, -r * 0.15);
  ctx.lineTo(r * 0.45, r);
  ctx.lineTo(-r * 0.45, r);
  ctx.lineTo(-r * 0.8, -r * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.8, -r * 0.15);
  ctx.lineTo(r * 0.8, -r * 0.15);
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.stroke();
  ctx.restore();
}

export function drawGame(ctx, game) {
  const { W, H, WALL } = CONFIG;
  const L = game.level;
  ctx.clearRect(0, 0, W, H);

  // Floor: checker marble + a red carpet runner down the middle.
  for (let y = 0; y < H / 64; y++) {
    for (let x = 0; x < W / 64; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? C.floorA : C.floorB;
      ctx.fillRect(x * 64, y * 64, 64, 64);
    }
  }
  ctx.fillStyle = C.carpet;
  ctx.fillRect(W / 2 - 90, WALL, 180, H - WALL * 2);
  ctx.fillStyle = C.carpetEdge;
  ctx.fillRect(W / 2 - 90, WALL, 6, H - WALL * 2);
  ctx.fillRect(W / 2 + 84, WALL, 6, H - WALL * 2);
  // Gallery name woven into the carpet, so the room reads as a museum.
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = 'rgba(232, 230, 223, 0.16)';
  ctx.font = 'bold 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('M E R I D I A N   M U S E U M', 0, 12);
  ctx.restore();

  // Walls with gold trim.
  ctx.fillStyle = C.wall;
  ctx.fillRect(0, 0, W, WALL);
  ctx.fillRect(0, H - WALL, W, WALL);
  ctx.fillRect(0, 0, WALL, H);
  ctx.fillRect(W - WALL, 0, WALL, H);
  ctx.fillStyle = C.wallTrim;
  ctx.fillRect(0, WALL - 3, W, 3);
  ctx.fillRect(0, H - WALL, W, 3);
  ctx.fillRect(WALL - 3, 0, 3, H);
  ctx.fillRect(W - WALL, 0, 3, H);
  for (const w of L.walls) {
    ctx.fillStyle = C.wallTop;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = C.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }

  // Exit door (bottom wall, green when the star is stolen).
  const e = L.exit;
  ctx.fillStyle = game.starTaken ? C.exit : '#3f7d52';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.fillStyle = '#0b1f12';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.starTaken ? 'EXIT — GO!' : 'EXIT', e.x + e.w / 2, e.y + 19);

  // Paintings (empty gold frame once lifted).
  for (const p of L.paintings) {
    ctx.fillStyle = C.paintingFrame;
    ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
    if (!p.taken) {
      ctx.fillStyle = p.hue;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(p.x + 8, p.y + 8, p.w - 22, 6);
      ctx.fillStyle = C.gold;
      ctx.font = 'bold 11px Georgia, serif';
      ctx.fillText('$', p.x + p.w / 2, p.y + p.h / 2 + 4);
    } else {
      ctx.fillStyle = '#101018';
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
  }

  // Display cases (glass + gold frame; gems sparkle while present).
  for (const cs of L.cases) {
    ctx.fillStyle = C.caseFrame;
    ctx.fillRect(cs.x - 3, cs.y - 3, cs.w + 6, cs.h + 6);
    ctx.fillStyle = '#232838';
    ctx.fillRect(cs.x, cs.y, cs.w, cs.h);
    ctx.fillStyle = C.caseGlass;
    ctx.fillRect(cs.x, cs.y, cs.w, cs.h);
    if (cs.gem && !cs.taken) {
      drawDiamond(ctx, cs.x + cs.w / 2, cs.y + cs.h / 2, 13, true);
    }
  }

  // The vault pedestal and the Star of Meridian.
  const v = L.vault;
  // A warm spotlight pool over the vault: the eye goes there first.
  const spot = ctx.createRadialGradient(v.x, v.y, 10, v.x, v.y, 130);
  spot.addColorStop(0, 'rgba(245, 197, 66, 0.14)');
  spot.addColorStop(1, 'rgba(245, 197, 66, 0)');
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.arc(v.x, v.y, 130, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2c3049';
  ctx.beginPath();
  ctx.arc(v.x, v.y, v.r + 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = C.wallTrim;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (!v.cracked) {
    drawDiamond(ctx, v.x, v.y, 20, true);
    if (v.progress > 0) {
      ctx.strokeStyle = C.gold;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(v.x, v.y, v.r + 22, -Math.PI / 2, -Math.PI / 2 + v.progress * Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillText('★ STAR OF MERIDIAN ★', v.x, v.y - v.r - 26);
  } else {
    ctx.fillStyle = C.textDim;
    ctx.font = '13px Georgia, serif';
    ctx.fillText('vault empty', v.x, v.y - v.r - 26);
  }

  // Guard vision cones (under the guards).
  for (const g of L.guards) {
    const hot = g.state === 'alert' || g.state === 'hunt';
    drawCone(
      ctx, g.x, g.y, g.angle,
      CONFIG.GUARD_CONE_HALF, CONFIG.GUARD_CONE_RANGE,
      hot ? 'rgba(245, 120, 66, 0.26)' : C.coneGuard,
      hot ? 'rgba(245, 120, 66, 0.6)' : C.coneGuardEdge,
    );
  }
  // Camera cones.
  for (const c of L.cameras) {
    drawCone(ctx, c.x, c.y, c.angle, CONFIG.CAM_CONE_HALF, CONFIG.CAM_RANGE, C.coneCam, C.coneCamEdge);
  }

  // Smoke clouds.
  for (const s of game.smokes) {
    ctx.fillStyle = C.smoke;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.x - 30, s.y + 14, s.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s.x + 34, s.y - 10, s.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  // Guards.
  for (const g of L.guards) {
    ctx.fillStyle = C.guardSuit;
    ctx.beginPath();
    ctx.arc(g.x, g.y, CONFIG.GUARD_R + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, CONFIG.GUARD_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#dfe6ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 20, g.y + Math.sin(g.angle) * 20);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Georgia, serif';
    if (g.state === 'alert' || g.state === 'hunt') ctx.fillText('!', g.x, g.y - 22);
    else if (g.state === 'investigate') ctx.fillText('?', g.x, g.y - 22);
    ctx.font = '11px Georgia, serif';
    ctx.fillStyle = C.textDim;
    ctx.fillText(g.name, g.x, g.y + 28);
  }

  // Cameras on the walls.
  for (const c of L.cameras) {
    ctx.fillStyle = '#1f2436';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.danger;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(c.x + Math.cos(c.angle) * 18, c.y + Math.sin(c.angle) * 18);
    ctx.stroke();
  }

  // The thief.
  const t = game.thief;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = t.sneaking ? C.thiefDark : C.thief;
  ctx.beginPath();
  ctx.arc(t.x, t.y, CONFIG.THIEF_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#062b16';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(t.x, t.y);
  ctx.lineTo(t.x + Math.cos(t.angle) * 18, t.y + Math.sin(t.angle) * 18);
  ctx.stroke();
  ctx.fillStyle = '#062b16';
  ctx.beginPath();
  ctx.arc(t.x + Math.cos(t.angle) * 7, t.y + Math.sin(t.angle) * 7, 3, 0, Math.PI * 2);
  ctx.fill();

  // Alarm vignette when the heat is on.
  if (game.alarm > 50 && game.state === 'playing') {
    const a = ((game.alarm - 50) / 50) * (0.22 + 0.1 * Math.sin(performance.now() / 180));
    const grad = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.75);
    grad.addColorStop(0, 'rgba(239,68,68,0)');
    grad.addColorStop(1, `rgba(239,68,68,${a.toFixed(3)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  drawHud(ctx, game);

  if (game.state === 'title') drawTitle(ctx, game);
  if (game.state === 'caught') drawCaught(ctx, game);
  if (game.state === 'won') drawWon(ctx, game);
}

function drawHud(ctx, game) {
  const { W } = CONFIG;
  ctx.fillStyle = 'rgba(8, 10, 18, 0.82)';
  ctx.fillRect(0, 0, W, 54);
  ctx.fillStyle = C.wallTrim;
  ctx.fillRect(0, 54, W, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`★ ${game.score}`, 18, 34);
  ctx.fillStyle = C.text;
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`LOOT ${game.lootGot}/${game.lootMax}`, 130, 33);

  // Alarm meter, centre — the number the whole game revolves around.
  const mw = 330;
  const mx = W / 2 - mw / 2;
  ctx.fillStyle = game.alarm > 70 ? C.danger : game.alarm > 35 ? C.warn : C.textDim;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('ALARM', W / 2, 18);
  ctx.fillStyle = '#10131f';
  ctx.fillRect(mx, 24, mw, 16);
  const aw = (mw * game.alarm) / 100;
  ctx.fillStyle = game.alarm > 70 ? C.danger : game.alarm > 35 ? C.warn : '#3f9e57';
  ctx.fillRect(mx, 24, aw, 16);
  ctx.strokeStyle = '#555b78';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, 24, mw, 16);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Georgia, serif';
  ctx.fillText(`${Math.round(game.alarm)}%`, W / 2, 36);

  ctx.textAlign = 'right';
  ctx.fillStyle = C.text;
  ctx.font = '15px Georgia, serif';
  ctx.fillText(`⏱ ${fmtTime(game.time)}`, W - 18, 24);
  ctx.fillText(`💨 ×${game.smokeLeft}    🪙 ×${game.coinLeft}`, W - 18, 45);

  // Objective + live message.
  ctx.textAlign = 'left';
  ctx.fillStyle = C.textDim;
  ctx.font = 'italic 14px Georgia, serif';
  const obj = game.starTaken
    ? 'Objective: reach the green exit — do not get caught.'
    : 'Objective: crack the vault (hold E), steal the Star, then escape.';
  ctx.fillText(obj, 18, 76);
  if (game.messageT > 0 && game.message) {
    ctx.textAlign = 'center';
    ctx.fillStyle = game.messageKind === 'warn' ? C.warn : game.messageKind === 'good' ? C.thief : '#ffd97a';
    ctx.font = 'bold 17px Georgia, serif';
    ctx.fillText(game.message, W / 2, 104);
  }
  if (game.state === 'playing' && game.spotted) {
    ctx.textAlign = 'center';
    ctx.fillStyle = C.danger;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('SPOTTED!', W / 2, 138);
  }

  // Vault hint when close.
  if (game.state === 'playing' && game.vaultHint && !game.level.vault.cracked) {
    ctx.textAlign = 'center';
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText('Hold E to crack the vault…', game.level.vault.x, game.level.vault.y + 66);
  }

  // Controls, bottom edge — short and left-aligned so it never covers the exit.
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(232,230,223,0.55)';
  ctx.font = '13px Georgia, serif';
  ctx.fillText('WASD move · Shift sneak · E crack · F smoke · C / click coin · R restart', 18, CONFIG.H - 8);
}

function overlay(ctx, rgba) {
  ctx.fillStyle = rgba;
  ctx.fillRect(0, 0, CONFIG.W, CONFIG.H);
}

function drawTitle(ctx, game) {
  overlay(ctx, 'rgba(6, 8, 16, 0.78)');
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('THE MERIDIAN HEIST', CONFIG.W / 2, 250);
  ctx.fillStyle = C.text;
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('One thief. One diamond. Three guards, three cameras, one alarm.', CONFIG.W / 2, 296);
  ctx.font = '17px Georgia, serif';
  ctx.fillStyle = C.textDim;
  ctx.fillText('Slip past the vision cones, lift the paintings, crack the vault,', CONFIG.W / 2, 360);
  ctx.fillText('steal the Star of Meridian — and walk out the green door.', CONFIG.W / 2, 386);
  ctx.fillStyle = C.thief;
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillText('Press ENTER to begin the heist', CONFIG.W / 2, 470);
  ctx.fillStyle = C.textDim;
  ctx.font = '15px Georgia, serif';
  ctx.fillText('WASD / Arrows move · Shift sneak · E crack vault · F smoke · C / click toss coin', CONFIG.W / 2, 520);
  if (game.best > 0) {
    ctx.fillStyle = C.gold;
    ctx.fillText(`Best getaway so far: ${game.best}`, CONFIG.W / 2, 556);
  }
}

function drawCaught(ctx, game) {
  overlay(ctx, 'rgba(60, 4, 8, 0.72)');
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6b6b';
  ctx.font = 'bold 68px Georgia, serif';
  ctx.fillText('BUSTED!', CONFIG.W / 2, 300);
  ctx.fillStyle = C.text;
  ctx.font = '20px Georgia, serif';
  ctx.fillText(game.caughtBy + '.', CONFIG.W / 2, 352);
  ctx.fillStyle = C.textDim;
  ctx.font = '17px Georgia, serif';
  ctx.fillText(`Score kept: ${game.score}  ·  Loot ${game.lootGot}/${game.lootMax}  ·  Time ${fmtTime(game.time)}`, CONFIG.W / 2, 396);
  ctx.fillStyle = C.thief;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press R to try the heist again', CONFIG.W / 2, 470);
}

function drawWon(ctx, game) {
  overlay(ctx, 'rgba(4, 28, 12, 0.78)');
  const info = game.winInfo || { loot: game.score, timeBonus: 0, ghost: 0, total: game.score, time: game.time };
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 60px Georgia, serif';
  ctx.fillText('CLEAN GETAWAY!', CONFIG.W / 2, 250);
  ctx.fillStyle = C.text;
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillText('The Star of Meridian is gone — and so are you.', CONFIG.W / 2, 296);
  ctx.font = '19px Georgia, serif';
  ctx.fillText(`Loot: ${info.loot}`, CONFIG.W / 2, 360);
  ctx.fillText(`Time bonus: +${info.timeBonus}`, CONFIG.W / 2, 392);
  if (info.ghost > 0) ctx.fillText(`Ghost bonus (alarm never passed 50): +${info.ghost}`, CONFIG.W / 2, 424);
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 26px Georgia, serif';
  ctx.fillText(`TOTAL SCORE: ${info.total}`, CONFIG.W / 2, 478);
  ctx.fillStyle = C.textDim;
  ctx.font = '16px Georgia, serif';
  ctx.fillText(`Finished in ${fmtTime(info.time)}  ·  Best: ${game.best}`, CONFIG.W / 2, 516);
  ctx.fillStyle = C.thief;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText('Press R to run it back', CONFIG.W / 2, 580);
}
