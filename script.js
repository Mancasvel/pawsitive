// Pawsitive Pet - 100% HTML/CSS/JS (no dependencies)
// Virtual pet with states, mini-games, day/night mode and localStorage persistence

(function () {
  "use strict";

  // ---------- General utilities ----------
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  /**
   * Convert a [0..100] value to percent string for progress bars
   */
  function toPercent(value) {
    const clamped = Math.max(0, Math.min(100, value));
    return `${clamped}%`;
  }

  /** Simple localStorage persistence */
  const Storage = {
    save(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {
        // ignore
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

  // ---------- Pet state ----------
  const DEFAULT_STATE = {
    hunger: 20, // 0 well fed, 100 very hungry
    happiness: 70,
    energy: 80,
    lastTick: Date.now(),
    ballHighScore: 0,
    petName: "",
    petType: "dog", // dog, cat, rabbit, fox, panda, tiger, monkey, unicorn
  };

  let state = Storage.load("pawsitive_state", DEFAULT_STATE);

  // ---------- DOM refs ----------
  const petEl = $("#pet");
  const themeIndicator = $("#themeIndicator");
  const hungerBar = $("#hungerBar");
  const happinessBar = $("#happinessBar");
  const energyBar = $("#energyBar");
  const petStatus = $("#petStatus");

  const feedBtn = $("#feedBtn");
  const playBtn = $("#playBtn");
  const sleepBtn = $("#sleepBtn");

  // Onboarding
  const onboardingModal = $("#onboardingModal");
  const petNameInput = $("#petNameInput");
  const petTypeSelect = $("#petTypeSelect");
  const saveOnboarding = $("#saveOnboarding");

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
    // Base emoji from type
    const TYPE_TO_EMOJI = {
      dog: "🐶",
      cat: "🐱",
      rabbit: "🐰",
      fox: "🦊",
      panda: "🐼",
      tiger: "🐯",
      monkey: "🐵",
      unicorn: "🦄",
    };
    let emoji = TYPE_TO_EMOJI[state.petType] || "🐶";
    // Simple mood overlay
    if (state.hunger > 70) emoji = "🥺";
    if (state.happiness > 80) emoji = "😄";
    if (state.energy < 25) emoji = "🥱";
    petEl.textContent = emoji;
    if (state.petName) {
      petEl.setAttribute("aria-label", `${state.petName} the ${state.petType}`);
    }
  }

  function renderTheme() {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 19 || hour < 7;
    document.body.classList.toggle("night", isNight);
    themeIndicator.textContent = isNight ? "Night" : "Day";
  }

  function renderAll() {
    renderStats();
    renderPetMood();
    renderTheme();
  }

  // ---------- State decay/recovery ----------
  function tick(deltaMs) {
    const deltaMin = deltaMs / 60000; // minutes
    // Hunger rises over time
    state.hunger = Math.min(100, state.hunger + 2 * deltaMin);
    // Happiness drops a bit, more if hunger high
    const happinessDrop = (state.hunger > 70 ? 1.5 : 0.5) * deltaMin;
    state.happiness = Math.max(0, state.happiness - happinessDrop);
    // Energy recovers slightly over time
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

  // ---------- User actions ----------
  function feedPet() {
    state.hunger = Math.max(0, state.hunger - 25);
    state.happiness = Math.min(100, state.happiness + 8);
    showPetStatus("Yummy! Thanks for the food 🍖");
    renderAll();
    Storage.save("pawsitive_state", state);
  }

  function playWithPet() {
    // Playing consumes energy, increases happiness; less effect if very tired
    const energyCost = 15;
    if (state.energy < energyCost) {
      state.happiness = Math.min(100, state.happiness + 4);
      showPetStatus("I feel a bit tired… let's play gently 🐾");
    } else {
      state.energy = Math.max(0, state.energy - energyCost);
      state.happiness = Math.min(100, state.happiness + 12);
      showPetStatus("I love playing with you! 🎉");
    }
    renderAll();
    Storage.save("pawsitive_state", state);
  }

  function sleepPet() {
    // Sleeping recovers energy and slightly increases hunger
    state.energy = Math.min(100, state.energy + 30);
    state.hunger = Math.min(100, state.hunger + 5);
    showPetStatus("Zzz… Thanks for letting me rest 😴");
    renderAll();
    Storage.save("pawsitive_state", state);
  }

  // ---------- Short pet status messages ----------
  function showPetStatus(text) {
    if (!petStatus) return;
    petStatus.textContent = text;
  }

  // ---------- Mini‑game: Catch the ball ----------
  let ballTimer = null;
  let ballScore = 0;
  let ballRunning = false;
  const BALL_GAME_DURATION_MS = 20000; // 20s
  const BALL_MOVE_INTERVAL_MS = 700; // base speed

  function randomPositionWithin(area, size) {
    const rect = area.getBoundingClientRect();
    const maxX = Math.max(0, rect.width - size);
    const maxY = Math.max(0, rect.height - size);
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;
    return { x, y };
  }

  function moveBall() {
    const size = 40; // matches CSS
    const { x, y } = randomPositionWithin(ballArea, size);
    ball.style.transform = `translate(${x}px, ${y}px)`;
  }

  function startBallGame() {
    if (ballRunning) return;
    ballRunning = true;
    ballScore = 0;
    ballScoreEl.textContent = String(ballScore);
    showPetStatus("Catch the ball! 🏀");
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
    showPetStatus(`Time. Score: ${ballScore}!`);
    // Rewards
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
    // quick visual feedback
    ball.style.scale = "0.95";
    setTimeout(() => (ball.style.scale = "1"), 80);
  }

  // ---------- Mini‑game: Memory ----------
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
      card.setAttribute("aria-label", "Memory card");
      card.innerHTML = `
        <div class="card-face card-front">❓</div>
        <div class="card-face card-back">${emoji}</div>
      `;
      card.addEventListener("click", () => onClickMemoryCard(card));
      memoryGrid.appendChild(card);
    });
    memoryStatus.textContent = "Find all pairs";
  }

  function onClickMemoryCard(card) {
    if (memoryLock) return;
    if (card.classList.contains("matched")) return;

    card.classList.add("revealed");
    if (!memoryFirstCard) {
      memoryFirstCard = card;
      return;
    }

    // Compare
    const same = memoryFirstCard.getAttribute("data-emoji") === card.getAttribute("data-emoji");
    if (same) {
      card.classList.add("matched");
      memoryFirstCard.classList.add("matched");
      memoryFirstCard = null;
      memoryPairsFound += 1;
      memoryStatus.textContent = `Pairs: ${memoryPairsFound}/${MEMORY_EMOJIS.length}`;
      // Small reward per pair
      state.happiness = Math.min(100, state.happiness + 1);
      Storage.save("pawsitive_state", state);
      renderAll();
      if (memoryPairsFound === MEMORY_EMOJIS.length) {
        showPetStatus("Memory completed! 🎉");
        // final reward
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

  // eventos de chat eliminados

  ballStart.addEventListener("click", startBallGame);
  ballStop.addEventListener("click", stopBallGame);
  ball.addEventListener("click", clickBall);
  ball.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") clickBall();
  });

  memoryStart.addEventListener("click", renderMemoryBoard);

  // ---------- Mini‑game: Reaction ----------
  const reactionArea = $("#reactionArea");
  const reactionStart = $("#reactionStart");
  const reactionStatus = $("#reactionStatus");
  let reactionTimeoutId = null;
  let reactionStartAt = 0;
  let reactionArmed = false;

  function resetReactionGame() {
    reactionArmed = false;
    reactionStartAt = 0;
    if (reactionTimeoutId) {
      clearTimeout(reactionTimeoutId);
      reactionTimeoutId = null;
    }
    if (reactionArea) {
      reactionArea.classList.remove("ready");
      reactionArea.textContent = "Wait…";
    }
    if (reactionStatus) reactionStatus.textContent = "Ready";
  }

  function startReactionGame() {
    resetReactionGame();
    if (!reactionArea) return;
    reactionStatus.textContent = "Get ready…";
    const delay = 1000 + Math.random() * 3000; // 1-4s
    reactionTimeoutId = setTimeout(() => {
      reactionArea.classList.add("ready");
      reactionArea.textContent = "Click!";
      reactionArmed = true;
      reactionStartAt = performance.now();
    }, delay);
  }

  function handleReactionClick() {
    if (!reactionArea) return;
    if (!reactionArmed) {
      // early click
      resetReactionGame();
      reactionStatus.textContent = "Too soon. Try again.";
      state.happiness = Math.max(0, state.happiness - 1);
      Storage.save("pawsitive_state", state);
      renderAll();
      return;
    }
    const elapsedMs = Math.round(performance.now() - reactionStartAt);
    reactionStatus.textContent = `Time: ${elapsedMs} ms`;
    showPetStatus(`Reaction: ${elapsedMs} ms ⚡`);
    // simple rewards
    const happinessBoost = elapsedMs < 250 ? 8 : elapsedMs < 400 ? 5 : 2;
    state.happiness = Math.min(100, state.happiness + happinessBoost);
    state.energy = Math.max(0, state.energy - 5);
    Storage.save("pawsitive_state", state);
    renderAll();
    resetReactionGame();
  }

  if (reactionStart) reactionStart.addEventListener("click", startReactionGame);
  if (reactionArea) {
    reactionArea.addEventListener("click", handleReactionClick);
    reactionArea.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") handleReactionClick();
    });
  }

  // ---------- Mini‑game: Chess vs your pet ----------
  const chessBoardEl = document.getElementById("chessBoard");
  const chessStatusEl = document.getElementById("chessStatus");
  const chessNewGameBtn = document.getElementById("chessNewGame");

  // Board representation: 0..63, a1..h8 with a1 at bottom-left from White perspective
  // Use Unicode pieces
  const PIECES = {
    P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
    p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  };

  let chessBoard = [];
  let chessSelected = -1;
  let chessTurn = "w"; // 'w' or 'b'

  function chessIndexToCoord(i) { return { x: i % 8, y: Math.floor(i / 8) }; }
  function chessCoordToIndex(x, y) { return y * 8 + x; }
  function isInside(x, y) { return x >= 0 && x < 8 && y >= 0 && y < 8; }
  function isWhite(piece) { return piece && piece === piece.toUpperCase(); }
  function isBlack(piece) { return piece && piece === piece.toLowerCase(); }

  function newChessGame() {
    chessBoard = [
      "r","n","b","q","k","b","n","r",
      "p","p","p","p","p","p","p","p",
      "","","","","","","","",
      "","","","","","","","",
      "","","","","","","","",
      "","","","","","","","",
      "P","P","P","P","P","P","P","P",
      "R","N","B","Q","K","B","N","R",
    ];
    chessSelected = -1;
    chessTurn = "w";
    renderChessBoard();
    setChessStatus("Your turn (White)");
  }

  function setChessStatus(text) { if (chessStatusEl) chessStatusEl.textContent = text; }

  function renderChessBoard() {
    if (!chessBoardEl) return;
    if (!chessBoardEl.dataset.built) {
      chessBoardEl.innerHTML = "";
      chessBoardEl.dataset.built = "1";
      chessBoardEl.classList.add("chess-grid");
      for (let i = 0; i < 64; i += 1) {
        const sq = document.createElement("button");
        sq.className = "square";
        const { x, y } = chessIndexToCoord(i);
        const dark = (x + y) % 2 === 1;
        if (dark) sq.classList.add("dark"); else sq.classList.add("light");
        sq.setAttribute("data-idx", String(i));
        sq.addEventListener("click", () => onClickChessSquare(i));
        chessBoardEl.appendChild(sq);
      }
    }
    const squares = chessBoardEl.querySelectorAll(".square");
    squares.forEach((sq) => sq.classList.remove("highlight"));
    for (let i = 0; i < 64; i += 1) {
      const piece = chessBoard[i];
      const sq = squares[i];
      sq.textContent = piece ? PIECES[piece] : "";
    }
    if (chessSelected >= 0) {
      const moves = generateMovesForIndex(chessSelected, "w");
      moves.forEach((m) => { squares[m].classList.add("highlight"); });
    }
  }

  function onClickChessSquare(idx) {
    if (chessTurn !== "w") return;
    const piece = chessBoard[idx];
    if (chessSelected === -1) {
      if (piece && isWhite(piece)) {
        chessSelected = idx;
        renderChessBoard();
      }
      return;
    }
    if (idx === chessSelected) {
      chessSelected = -1;
      renderChessBoard();
      return;
    }
    const legal = generateMovesForIndex(chessSelected, "w");
    if (legal.includes(idx)) {
      makeChessMove(chessSelected, idx, "w");
      chessSelected = -1;
      renderChessBoard();
      setChessStatus("Pet is thinking…");
      setTimeout(petChessMove, 400);
    } else {
      // allow reselection if clicking on another white piece
      if (piece && isWhite(piece)) {
        chessSelected = idx;
        renderChessBoard();
      }
    }
  }

  function makeChessMove(from, to, side) {
    const mover = chessBoard[from];
    // Promotion to queen
    if (mover === "P" && Math.floor(to / 8) === 0) {
      chessBoard[to] = "Q";
    } else if (mover === "p" && Math.floor(to / 8) === 7) {
      chessBoard[to] = "q";
    } else {
      chessBoard[to] = mover;
    }
    chessBoard[from] = "";
    chessTurn = side === "w" ? "b" : "w";
    // small mood impact
    if (side === "w") {
      state.happiness = Math.min(100, state.happiness + 1);
      state.energy = Math.max(0, state.energy - 1);
    }
    Storage.save("pawsitive_state", state);
    renderAll();
    // Check king capture (simplified end)
    if (!chessBoard.includes("k")) {
      setChessStatus(`Checkmate (capture)! ${state.petName || "Your pet"} resigns. You win!`);
      chessTurn = "-";
    } else if (!chessBoard.includes("K")) {
      setChessStatus(`Checkmate (capture)! ${state.petName || "Your pet"} wins!`);
      chessTurn = "-";
    }
  }

  function petChessMove() {
    if (chessTurn !== "b") return;
    const allMoves = [];
    for (let i = 0; i < 64; i += 1) {
      const piece = chessBoard[i];
      if (!piece || !isBlack(piece)) continue;
      const moves = generateMovesForIndex(i, "b");
      moves.forEach((to) => {
        const captures = chessBoard[to] && isWhite(chessBoard[to]);
        allMoves.push({ from: i, to, captures });
      });
    }
    if (allMoves.length === 0) {
      setChessStatus(`${state.petName || "Your pet"} has no moves. You win!`);
      chessTurn = "-";
      return;
    }
    // Prefer captures, else random
    const captureMoves = allMoves.filter((m) => m.captures);
    const choicePool = captureMoves.length ? captureMoves : allMoves;
    const choice = choicePool[Math.floor(Math.random() * choicePool.length)];
    makeChessMove(choice.from, choice.to, "b");
    if (chessTurn !== "-") setChessStatus("Your turn (White)");
    renderChessBoard();
  }

  function generateMovesForIndex(idx, side) {
    const piece = chessBoard[idx];
    if (!piece) return [];
    const isSide = side === "w" ? isWhite : isBlack;
    const isOpponent = side === "w" ? isBlack : isWhite;
    if (!isSide(piece)) return [];
    const { x, y } = chessIndexToCoord(idx);
    const moves = [];
    const pushIf = (tx, ty) => { if (isInside(tx, ty)) moves.push(chessCoordToIndex(tx, ty)); };
    const ray = (dirs) => {
      dirs.forEach(([dx, dy]) => {
        let tx = x + dx, ty = y + dy;
        while (isInside(tx, ty)) {
          const t = chessCoordToIndex(tx, ty);
          if (!chessBoard[t]) { moves.push(t); }
          else { if (isOpponent(chessBoard[t])) moves.push(t); break; }
          tx += dx; ty += dy;
        }
      });
    };
    switch (piece) {
      case "P": {
        if (!chessBoard[chessCoordToIndex(x, y - 1)]) pushIf(x, y - 1);
        if (y === 6 && !chessBoard[chessCoordToIndex(x, y - 1)] && !chessBoard[chessCoordToIndex(x, y - 2)]) pushIf(x, y - 2);
        if (isOpponent(chessBoard[chessCoordToIndex(x - 1, y - 1)])) pushIf(x - 1, y - 1);
        if (isOpponent(chessBoard[chessCoordToIndex(x + 1, y - 1)])) pushIf(x + 1, y - 1);
        break;
      }
      case "p": {
        if (!chessBoard[chessCoordToIndex(x, y + 1)]) pushIf(x, y + 1);
        if (y === 1 && !chessBoard[chessCoordToIndex(x, y + 1)] && !chessBoard[chessCoordToIndex(x, y + 2)]) pushIf(x, y + 2);
        if (isOpponent(chessBoard[chessCoordToIndex(x - 1, y + 1)])) pushIf(x - 1, y + 1);
        if (isOpponent(chessBoard[chessCoordToIndex(x + 1, y + 1)])) pushIf(x + 1, y + 1);
        break;
      }
      case "N": case "n": {
        const deltas = [[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]];
        deltas.forEach(([dx, dy]) => {
          const tx = x + dx, ty = y + dy;
          if (!isInside(tx, ty)) return;
          const t = chessCoordToIndex(tx, ty);
          if (!chessBoard[t] || isOpponent(chessBoard[t])) moves.push(t);
        });
        break;
      }
      case "B": case "b": ray([[1,1],[1,-1],[-1,1],[-1,-1]]); break;
      case "R": case "r": ray([[1,0],[-1,0],[0,1],[0,-1]]); break;
      case "Q": case "q": ray([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]); break;
      case "K": case "k": {
        const deltas = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
        deltas.forEach(([dx, dy]) => {
          const tx = x + dx, ty = y + dy;
          if (!isInside(tx, ty)) return;
          const t = chessCoordToIndex(tx, ty);
          if (!chessBoard[t] || isOpponent(chessBoard[t])) moves.push(t);
        });
        break;
      }
    }
    // Remove own-occupied squares
    return moves.filter((m) => !isSide(chessBoard[m]));
  }

  if (chessNewGameBtn) chessNewGameBtn.addEventListener("click", newChessGame);

  // ---------- Onboarding ----------
  function showOnboardingIfNeeded() {
    if (!onboardingModal) return;
    const need = !state.petName || !state.petType;
    onboardingModal.setAttribute("aria-hidden", need ? "false" : "true");
    onboardingModal.classList.toggle("visible", need);
    if (need) {
      if (petNameInput) petNameInput.value = state.petName || "";
      if (petTypeSelect) petTypeSelect.value = state.petType || "dog";
    }
  }

  function saveOnboardingData() {
    const name = (petNameInput?.value || "").trim().slice(0, 20);
    const type = petTypeSelect?.value || "dog";
    state.petName = name || "Buddy";
    state.petType = type;
    Storage.save("pawsitive_state", state);
    showPetStatus(`Hi! I'm ${state.petName}, your ${state.petType}.`);
    renderAll();
    if (onboardingModal) {
      onboardingModal.setAttribute("aria-hidden", "true");
      onboardingModal.classList.remove("visible");
    }
  }

  if (saveOnboarding) saveOnboarding.addEventListener("click", saveOnboardingData);

  // ---------- Init ----------
  function bootstrap() {
    renderAll();
    renderMemoryBoard();
    newChessGame();
    showOnboardingIfNeeded();
    if (state.petName) showPetStatus(`Hi ${state.petName}! Ready to play? 🐾`);
    // Start loop
    requestAnimationFrame(gameLoop);
  }

  window.addEventListener("load", bootstrap);
})();

