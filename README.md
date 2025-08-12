# Pawsitive Pet

Mascota virtual 100% HTML + CSS + JavaScript (sin frameworks, sin librerías externas). Diseñada para un hackathon con restricciones estrictas de tecnologías permitidas.

## Características

- Mascota animada en pantalla (emoji con animación y estados).
- Sistema de estados persistente:
  - Hambre: sube con el tiempo, baja al «Alimentar».
  - Felicidad: sube al jugar y completar juegos, baja si se ignora o tiene mucha hambre.
  - Energía: baja al jugar/mini‑juegos, sube al «Dormir» y ligeramente con el tiempo.
- Mini‑juegos integrados:
  - Atrapar la pelota (click rápido en una pelota que se mueve).
  - Juego de memoria (emparejar cartas con emojis).
  - Reflejos (haz clic cuando el panel se ponga verde lo más rápido posible).
- Modo día/noche automático según hora local.
- Persistencia con `localStorage` para mantener el progreso tras recargar.

## Estructura

```
index.html   # Estructura y accesibilidad básica
style.css    # Estilos, layout responsive y animaciones
script.js    # Lógica de la mascota, chat, estados y mini‑juegos
README.md    # Este archivo
```

## Cómo ejecutar

1. Descarga o clona el proyecto.
2. Abre `index.html` en tu navegador (doble clic o arrastrando a la ventana del navegador).
3. No requiere servidor ni instalación.

## Uso rápido

- Alimentar: botón «🍖 Alimentar» para reducir hambre y subir un poco la felicidad.
- Jugar: botón «🎮 Jugar» incrementa felicidad y consume energía.
- Dormir: botón «😴 Dormir» recupera energía (aumenta ligeramente el hambre).
- Mini‑juegos: 
  - Atrapar la pelota: pulsa «Iniciar», haz clic en la pelota hasta que acabe el tiempo.
  - Memoria: pulsa «Nuevo juego», descubre y empareja todas las cartas.
  - Reflejos: pulsa «Iniciar» y haz clic cuando el panel se ponga verde.

## Decisiones de diseño (por qué)

- Sin dependencias: para cumplir la regla del hackathon y facilitar que cualquiera lo ejecute sin setup.
- Emoji como sprite: simplifica assets y mejora compatibilidad. Se puede sustituir por sprites CSS si se desea.
- Estados [0..100]: permite barras intuitivas y fácil normalización.
- Persistencia mínima: `localStorage` con una única clave (`pawsitive_state`).
- Código modular por funciones: cada feature (estados y mini‑juegos) tiene funciones separadas.
- Accesibilidad básica: roles, `aria-label`, tab-focus en elementos interactivos.

## Personalización

- Cambia la velocidad/dificultad en `script.js`:
  - `BALL_GAME_DURATION_MS`, `BALL_MOVE_INTERVAL_MS`.
- Ajusta degradación/recuperación en `tick(deltaMs)`.
- Edita respuestas del chat en `KEYWORD_RESPONSES`.
- Cambia paleta en `style.css` (variables `:root`).

## Notas técnicas

- Responsive: grid adaptable y tamaños fluidos.
- Animación de la mascota: efecto «float» suave con `@keyframes`.
- Día/Noche: clase `body.night` con gradientes y contrastes.
- Memoria: cartas con efecto flip 3D (transform + backface-visibility).

## Futuras mejoras (opcionales)

- Sonidos (solo si el reglamento lo permite, sin recursos externos).
- Más mini‑juegos (p. ej., Simon dice, clicker de recompensas).
- Estados avanzados (limpieza, salud) y eventos aleatorios.

## Licencia

MIT. Úsalo y modifícalo libremente en el hackathon.