# Pawsitive Pet

Virtual pet built with 100% HTML + CSS + JavaScript (no frameworks, no external libs).

## Features

- Animated pet on screen (emoji with states and simple mood).
- Persistent state:
  - Hunger: rises over time, drops when you Feed.
  - Happiness: rises when playing/completing games, drops if hungry/ignored.
  - Energy: drops when playing, recovers when you Sleep and slightly over time.
- Mini games:
  - Catch the ball (click the moving ball).
  - Memory (match pairs of emoji cards).
  - Reaction (click as soon as it turns green).
  - Chess vs your pet (you are White, pet is Black; simplified rules).
- Automatic day/night based on local time.
- `localStorage` persistence to keep progress.

## Structure

```
index.html   # Estructura y accesibilidad básica
style.css    # Estilos, layout responsive y animaciones
script.js    # Lógica de la mascota, chat, estados y mini‑juegos
README.md    # Este archivo
```

## Run

1. Download or clone the project.
2. Open `index.html` in your browser (double-click or drag into a tab).
3. No server required.

## Quick use

- Feed: click «🍖 Feed»
- Play: click «🎮 Play»
- Sleep: click «😴 Sleep»
- Mini games:
  - Catch the ball: «Start», then click the ball until time is over.
  - Memory: «New game», flip and match all pairs.
  - Reaction: «Start», click when it turns green.
  - Chess: «New game», you are White; pet plays a simple Black AI.

## Design decisions (why)

- No dependencies: easy to run anywhere.
- Emoji as sprite: no assets, wide compatibility.
- States [0..100]: intuitive progress bars.
- Minimal storage: `localStorage` with a single key (`pawsitive_state`).
- Modular functions per feature (states and mini‑games).
- Basic accessibility: roles, `aria-label`, keyboard focus.

## Customization

- Change speed/difficulty in `script.js`:
  - `BALL_GAME_DURATION_MS`, `BALL_MOVE_INTERVAL_MS`.
- Adjust decay/recovery in `tick(deltaMs)`.
- Change palette in `style.css` (`:root` variables).

## Technical notes

- Responsive grid and fluid sizes.
- Pet "float" animation via `@keyframes`.
- Day/Night via `body.night` class.
- Memory: 3D flip via transform + backface-visibility.

## Future ideas (optional)

- Sound effects (if allowed, no external resources).
- More mini‑games (e.g., Simon Says, clicker reward game).
- Advanced states (cleanliness, health) and random events.

## Licencia

MIT. Úsalo y modifícalo libremente en el hackathon.