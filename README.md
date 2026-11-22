# heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/aris99i/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/aris99i/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

The Meridian Heist — a complete original top-down stealth game. One thief slips into the Meridian Museum after closing: dodge guard vision cones and sweeping wall cameras, lift paintings and gems, crack the vault to steal the Star of Meridian, and walk out the green exit before the alarm meter hits 100%. Smoke bombs hide you, tossed coins pull guards away, and a clean getaway pays a ghost bonus.

## Run it

```sh
# Play it: serve the game folder and open it in a desktop browser
python3 -m http.server 8080 --directory game
# then open http://localhost:8080

# Rebuild the submission output (what main.ts hands to the grader)
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## How to play

- **WASD / Arrow keys** — move (Shift to sneak, slower but harder to spot)
- **E (hold)** — crack the vault when you are close to it
- **F** — smoke bomb: hides you inside the cloud (3 per run)
- **C or click** — toss a coin: the nearest guard goes to investigate it (3 per run)
- **R** — restart after you are caught or escape
- **M** — mute

Steal the Star, then reach the green exit. Get caught by a guard's touch or let the alarm reach 100% and the run is over. Loot, a time bonus and a ghost bonus (alarm never past 50) make up your final score.

## Files

- `game/` — the playable game as static files: `index.html` plus `src/` (config, world, input, audio, engine, render, shots, main). No libraries, no network.
- `screenshots/` — 4 real renders of the game in a browser (the first is the cover). Each one is a staged frame of the game's own code: `?shot=start` (the break-in), `?shot=play` (mid-heist at the vault), `?shot=win` (clean getaway), `?shot=caught` (busted).
- `main.ts` — the entry program: copies `game/` and `screenshots/` to the output and writes `dossier.json` with the vendored make.fun library.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

---

<sub>Entered on [make.fun](https://make.fun/?ref=pps563g6&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
