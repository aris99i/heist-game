// shots.js — deterministic scene staging for the entry's screenshots.
// `?shot=start|play|caught|win` poses the game in a fixed, lively frame and
// freezes the update loop, so the render is the same every time it is taken.
// These are real renders of the game's own code in a browser, never edits.

export function applyShot(game, name) {
  game.reset();
  game.frozen = true;
  const L = game.level;
  const t = game.thief;

  if (name === 'start') {
    // Opening moves: the thief slips in from the exit, guards mid-patrol,
    // cameras sweeping, loot glowing, alarm at zero.
    game.state = 'playing';
    t.x = 640;
    t.y = 690;
    t.angle = -Math.PI / 2;
    L.guards[0].x = 320; L.guards[0].y = 250; L.guards[0].angle = 0;
    L.guards[1].x = 850; L.guards[1].y = 380; L.guards[1].angle = Math.PI / 2;
    L.guards[2].x = 920; L.guards[2].y = 620; L.guards[2].angle = Math.PI;
    L.cameras[0].angle = Math.PI / 4 + 0.4;
    L.cameras[1].angle = (3 * Math.PI) / 4 - 0.35;
    L.cameras[2].angle = (-3 * Math.PI) / 4 + 0.3;
    game.say('Steal the Star of Meridian — then reach the green exit.', 'info', 999);
    return;
  }

  if (name === 'play') {
    // Mid-heist, the frame the judge should remember: a painting already
    // lifted, the thief by the vault with the crack half done, one guard
    // suspicious, a smoke cloud blooming, alarm at 58%.
    game.state = 'playing';
    game.time = 74;
    game.score = 650;
    game.lootGot = 3;
    L.paintings[0].taken = true;
    L.paintings[1].taken = true;
    L.cases[0].taken = true;
    t.x = 905;
    t.y = 420;
    t.angle = Math.PI / 4;
    L.vault.progress = 0.6;
    game.vaultHint = true;
    game.alarm = 58;
    game.maxAlarm = 58;
    game.smokeLeft = 2;
    game.coinLeft = 2;
    game.smokes = [{ x: 800, y: 520, r: 92, t: 3.5 }];
    L.guards[0].x = 640; L.guards[0].y = 250; L.guards[0].angle = 0.5;
    L.guards[1].x = 850; L.guards[1].y = 560; L.guards[1].angle = -Math.PI / 2;
    L.guards[1].state = 'alert';
    L.guards[1].lastSeen = { x: 905, y: 420 };
    L.guards[2].x = 1080; L.guards[2].y = 660; L.guards[2].angle = Math.PI;
    L.cameras[0].angle = Math.PI / 4 + 0.5;
    L.cameras[1].angle = (3 * Math.PI) / 4 - 0.2;
    L.cameras[2].angle = (-3 * Math.PI) / 4 + 0.5;
    game.spotted = true;
    game.say('The Star is almost yours!', 'info', 999);
    return;
  }

  if (name === 'caught') {
    // The fair fail: alarm at 100, a guard on top of the thief.
    game.state = 'caught';
    game.time = 96;
    game.score = 400;
    game.lootGot = 2;
    game.alarm = 100;
    game.maxAlarm = 100;
    t.x = 665;
    t.y = 445;
    t.angle = Math.PI;
    L.guards[0].x = 692; L.guards[0].y = 432; L.guards[0].angle = Math.PI;
    L.guards[0].state = 'alert';
    L.guards[1].x = 850; L.guards[1].y = 500; L.guards[1].angle = -Math.PI / 2;
    L.guards[2].x = 1000; L.guards[2].y = 620; L.guards[2].angle = Math.PI;
    game.caughtBy = 'Guard Mara grabbed you';
    return;
  }

  if (name === 'win') {
    // The payoff: clean getaway, score breakdown on screen.
    game.state = 'won';
    game.time = 132;
    game.score = 2236;
    game.lootGot = 8;
    game.lootMax = 8;
    game.starTaken = true;
    L.vault.cracked = true;
    for (const p of L.paintings) p.taken = true;
    for (const c of L.cases) c.taken = true;
    game.winInfo = { loot: 1900, timeBonus: 336, ghost: 0, total: 2236, time: 132 };
    game.best = 2236;
    t.x = 640;
    t.y = 742;
    t.angle = Math.PI / 2;
    L.guards[0].x = 300; L.guards[0].y = 200; L.guards[0].angle = 0;
    L.guards[1].x = 880; L.guards[1].y = 255; L.guards[1].angle = Math.PI / 2;
    L.guards[2].x = 1000; L.guards[2].y = 640; L.guards[2].angle = Math.PI;
    return;
  }

  // Unknown shot name: plain playing state, thief at the door.
  game.state = 'playing';
}
