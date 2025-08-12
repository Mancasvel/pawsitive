// Pawsitive Pet - 100% HTML/CSS/JS (sin dependencias)
// Objetivo: Mascota virtual con chat, estados, mini‑juegos, modo día/noche y persistencia localStorage

(function () {
  "use strict";

  // ---------- Utilidades generales ----------
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  /**
   * Convierte un valor [0..100] a porcentaje para barras de progreso
   */
  function toPercent(value) {
    const clamped = Math.max(0, Math.min(100, value));
    return `${clamped}%`;
  }

  /** Persistencia simple en localStorage */
  const Storage = {
    save(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {
        // ignorar
      }
    },
    load(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) {
        return fallback;
      }
    },
  };

  // ---------- Estado principal de la mascota ----------
  const DEFAULT_STATE = {
    hunger: 20, // 0 bien alimentado, 100 con hambre
    happiness: 70,
    energy: 80,
    lastTick: Date.now(),
    ballHighScore: 0,
  };

  let state = Storage.load("pawsitive_state", DEFAULT_STATE);

  // ---------- Referencias a DOM ----------
  const petEl = $("#pet");
  const themeIndicator = $("#themeIndicator");
  const hungerBar = $("#hungerBar");
  const happinessBar = $("#happinessBar");
  const energyBar = $("#energyBar");

  const feedBtn = $("#feedBtn");
  const playBtn = $("#playBtn");
  const sleepBtn = $("#sleepBtn");

  const chatMessages = $("#chatMessages");
  const chatInput = $("#chatInput");
  const chatSend = $("#chatSend");

  // Ball game
  const ballArea = $("#ballGameArea");
  const ball = $("#ball");
  const ballStart = $("#ballGameStart");
  const ballStop = $("#ballGameStop");
  const ballScoreEl = $("#ballScore");

  // Memory game
  const memoryStart = $("#memoryStart");
  const memoryGrid = $("#memoryGrid");
  const memoryStatus = $("#memoryStatus");

  // ---------- Render UI ----------
  function renderStats() {
    hungerBar.style.width = toPercent(state.hunger);
    happinessBar.style.width = toPercent(state.happiness);
    energyBar.style.width = toPercent(state.energy);
  }

  function renderPetMood() {
    // Simple mapeo de estados a emojis
    let emoji = "🐶";
    if (state.hunger > 70) emoji = "🥺"; // con hambre
    if (state.happiness > 80) emoji = "😄";
    if (state.energy < 25) emoji = "🥱";
    petEl.textContent = emoji;
  }

  function renderTheme() {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 19 || hour < 7;
    document.body.classList.toggle("night", isNight);
    themeIndicator.textContent = isNight ? "Noche" : "Día";
  }

  function renderAll() {
    renderStats();
    renderPetMood();
    renderTheme();
  }

  // ---------- Lógica de degradación/recuperación ----------
  function tick(deltaMs) {
    const deltaMin = deltaMs / 60000; // minutos
    // Hambriento con el tiempo
    state.hunger = Math.min(100, state.hunger + 2 * deltaMin);
    // Felicidad baja si hambre alta o se ignora
    const happinessDrop = (state.hunger > 70 ? 1.5 : 0.5) * deltaMin;
    state.happiness = Math.max(0, state.happiness - happinessDrop);
    // Energía se recupera ligeramente con el tiempo si no está durmiendo activamente
    state.energy = Math.min(100, state.energy + 0.5 * deltaMin);
  }

  function gameLoop() {
    const now = Date.now();
    const delta = now - (state.lastTick || now);
    if (delta > 0) {
      tick(delta);
      state.lastTick = now;
      renderAll();
      Storage.save("pawsitive_state", state);
    }
    requestAnimationFrame(gameLoop);
  }

  // ---------- Acciones del usuario ----------
  function feedPet() {
    state.hunger = Math.max(0, state.hunger - 25);
    state.happiness = Math.min(100, state.happiness + 8);
    addPetMessage("¡Qué rico! Gracias por la comida 🍖");
    renderAll();
    Storage.save("pawsitive_state", state);
  }

  function playWithPet() {
    // Jugar consume energía, sube felicidad; si energía muy baja, reduce efecto
    const energyCost = 15;
    if (state.energy < energyCost) {
      state.happiness = Math.min(100, state.happiness + 4);
      addPetMessage("Estoy un poco cansado… juguemos suave 🐾");
    } else {
      state.energy = Math.max(0, state.energy - energyCost);
      state.happiness = Math.min(100, state.happiness + 12);
      addPetMessage("¡Me encanta jugar contigo! 🎉");
    }
    renderAll();
    Storage.save("pawsitive_state", state);
  }

  function sleepPet() {
    // Dormir recupera energía y baja un poco el hambre
    state.energy = Math.min(100, state.energy + 30);
    state.hunger = Math.min(100, state.hunger + 5);
    addPetMessage("Zzz… Gracias por dejarme descansar 😴");
    renderAll();
    Storage.save("pawsitive_state", state);
  }

  // ---------- Chat sencillo con keywords ----------
  const KEYWORD_RESPONSES = [
    { keys: ["hola", "buenas", "hey"], response: "¡Hola! Soy tu Pawsitive Pet. 🐾" },
    { keys: ["hambre", "comer", "alimento"], response: "Si tienes comida, ¡me encantaría! 🍖" },
    { keys: ["jugar", "play", "divertir"], response: "¡Sí! ¿Probamos un mini‑juego? 🎮" },
    { keys: ["dormir", "siesta", "descansar"], response: "Un ratito de siesta suena bien… 😴" },
    { keys: ["feliz", "contento", "triste"], response: "Me haces feliz cuando estás aquí 💛" },
    { keys: ["amor", "cariño"], response: "Te quiero mucho 💖" },
    { keys: ["reglas", "ayuda", "help"], response: "Puedo comer, jugar, dormir y guardar mi progreso. ¡Hablemos!" },
  ];

  function addMessage(text, who = "user") {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${who}`;

    if (who === "pet") {
      const avatar = document.createElement("div");
      avatar.className = "avatar";
      avatar.textContent = petEl.textContent || "🐶";
      wrapper.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;
    wrapper.appendChild(bubble);

    chatMessages.appendChild(wrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function addUserMessage(text) { addMessage(text, "user"); }
  function addPetMessage(text) { addMessage(text, "pet"); }

  function petReplyTo(input) {
    const msg = input.trim().toLowerCase();
    if (!msg) return;
    const found = KEYWORD_RESPONSES.find(({ keys }) => keys.some((k) => msg.includes(k)));
    if (found) {
      addPetMessage(found.response);
    } else {
      addPetMessage("No entendí muy bien… pero te escucho con atención 🐶");
    }
  }

  function handleSendChat() {
    const text = chatInput.value.trim();
    if (!text) return;
    addUserMessage(text);
    chatInput.value = "";
    setTimeout(() => petReplyTo(text), 250);
  }

  // ---------- Mini‑juego: Atrapar la pelota ----------
  let ballTimer = null;
  let ballScore = 0;
  let ballRunning = false;
  const BALL_GAME_DURATION_MS = 20000; // 20s
  const BALL_MOVE_INTERVAL_MS = 700; // velocidad base

  function randomPositionWithin(area, size) {
    const rect = area.getBoundingClientRect();
    const maxX = Math.max(0, rect.width - size);
    const maxY = Math.max(0, rect.height - size);
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    return { x, y };
  }

  function moveBall() {
    const size = 40; // coincide con CSS
    const { x, y } = randomPositionWithin(ballArea, size);
    ball.style.transform = `translate(${x}px, ${y}px)`;
  }

  function startBallGame() {
    if (ballRunning) return;
    ballRunning = true;
    ballScore = 0;
    ballScoreEl.textContent = String(ballScore);
    addPetMessage("¡Atrapa la pelota! 🏀");
    moveBall();
    const startAt = Date.now();
    let lastMove = 0;

    function loop() {
      if (!ballRunning) return;
      const now = Date.now();
      if (now - lastMove > BALL_MOVE_INTERVAL_MS) {
        moveBall();
        lastMove = now;
      }
      if (now - startAt >= BALL_GAME_DURATION_MS) {
        stopBallGame();
        return;
      }
      ballTimer = requestAnimationFrame(loop);
    }
    ballTimer = requestAnimationFrame(loop);
  }

  function stopBallGame() {
    if (!ballRunning) return;
    ballRunning = false;
    if (ballTimer) cancelAnimationFrame(ballTimer);
    addPetMessage(`Tiempo. ¡Puntaje: ${ballScore}!`);
    // Recompensas
    state.happiness = Math.min(100, state.happiness + Math.min(15, ballScore));
    state.energy = Math.max(0, state.energy - 10);
    state.ballHighScore = Math.max(state.ballHighScore || 0, ballScore);
    Storage.save("pawsitive_state", state);
    renderAll();
  }

  function clickBall() {
    if (!ballRunning) return;
    ballScore += 1;
    ballScoreEl.textContent = String(ballScore);
    // feedback visual rápido
    ball.style.scale = "0.95";
    setTimeout(() => (ball.style.scale = "1"), 80);
  }

  // ---------- Mini‑juego: Memoria ----------
  const MEMORY_EMOJIS = [
    "🐶", "🐱", "🐰", "🦊", "🐼", "🐯", "🐵", "🦄",
  ];

  let memoryFirstCard = null;
  let memoryLock = false;
  let memoryPairsFound = 0;

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function createMemoryDeck() {
    const deck = [...MEMORY_EMOJIS, ...MEMORY_EMOJIS];
    shuffle(deck);
    return deck;
  }

  function renderMemoryBoard() {
    memoryGrid.innerHTML = "";
    memoryPairsFound = 0;
    memoryFirstCard = null;
    memoryLock = false;
    const deck = createMemoryDeck();
    deck.forEach((emoji, idx) => {
      const card = document.createElement("button");
      card.className = "card";
      card.setAttribute("data-emoji", emoji);
      card.setAttribute("aria-label", "Carta de memoria");
      card.innerHTML = `
        <div class="card-face card-front">❓</div>
        <div class="card-face card-back">${emoji}</div>
      `;
      card.addEventListener("click", () => onClickMemoryCard(card));
      memoryGrid.appendChild(card);
    });
    memoryStatus.textContent = "Encuentra todas las parejas";
  }

  function onClickMemoryCard(card) {
    if (memoryLock) return;
    if (card.classList.contains("matched")) return;

    card.classList.add("revealed");
    if (!memoryFirstCard) {
      memoryFirstCard = card;
      return;
    }

    // Comparar
    const same = memoryFirstCard.getAttribute("data-emoji") === card.getAttribute("data-emoji");
    if (same) {
      card.classList.add("matched");
      memoryFirstCard.classList.add("matched");
      memoryFirstCard = null;
      memoryPairsFound += 1;
      memoryStatus.textContent = `Parejas: ${memoryPairsFound}/${MEMORY_EMOJIS.length}`;
      // Recompensa leve por pareja
      state.happiness = Math.min(100, state.happiness + 1);
      Storage.save("pawsitive_state", state);
      renderAll();
      if (memoryPairsFound === MEMORY_EMOJIS.length) {
        addPetMessage("¡Memoria completada! 🎉");
        // recompensa final
        state.happiness = Math.min(100, state.happiness + 10);
        state.energy = Math.max(0, state.energy - 8);
        Storage.save("pawsitive_state", state);
        renderAll();
      }
    } else {
      memoryLock = true;
      setTimeout(() => {
        card.classList.remove("revealed");
        if (memoryFirstCard) memoryFirstCard.classList.remove("revealed");
        memoryFirstCard = null;
        memoryLock = false;
      }, 650);
    }
  }

  // ---------- Eventos ----------
  feedBtn.addEventListener("click", feedPet);
  playBtn.addEventListener("click", playWithPet);
  sleepBtn.addEventListener("click", sleepPet);

  chatSend.addEventListener("click", handleSendChat);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSendChat();
  });

  ballStart.addEventListener("click", startBallGame);
  ballStop.addEventListener("click", stopBallGame);
  ball.addEventListener("click", clickBall);
  ball.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") clickBall();
  });

  memoryStart.addEventListener("click", renderMemoryBoard);

  // ---------- Init ----------
  function bootstrap() {
    renderAll();
    renderMemoryBoard();
    addPetMessage("¡Hola! Soy tu Pawsitive Pet. ¿Jugamos? 🐾");
    // Lanzar bucle del juego (animación/ticks)
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener("load", bootstrap);
})();

