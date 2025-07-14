document.addEventListener("DOMContentLoaded", () => {
  const squares = document.querySelectorAll(".square");
  const statusText = document.getElementById("message");
  const gameButton = document.getElementById("start");
  const resetButton = document.getElementById("reset");
  const fetchDataBtn = document.getElementById("fetch-data-btn");
  const displayDiv = document.getElementById("data-display");
  const gameModeSelect = document.getElementById("game-mode");
  const aiDifficultySelect = document.getElementById("ai-difficulty");
  const selectPvp = document.getElementById("select-pvp");
  const selectPva = document.getElementById("select-pva");

  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], 
    [0, 4, 8],
    [2, 4, 6], 
  ];

  const players = [
    "SpongeBob",
    "Patrick",
    "Squidward",
    "Mr.Krabs",
    "Sandy Cheeks",
    "Plankton",
  ];

  let gameState = {
    board: Array(9).fill(null),
    gameMode: "",
    currentPlayer: "X",
    gameActive: false,
    winner: null,
    playerNsMs: {
      X: { name: "", moves: 0 },
      O: { name: "", moves: 0 },
    },
    aiDifficulty: "",
    wsOF: false,
  };

  function getRandomNames() {
    // Create a copy of the players array to avoid mutation
    const availablePlayers = [...players];

    // Randomly select first player
    const firstIndex = Math.floor(Math.random() * availablePlayers.length);
    const player1 = availablePlayers.splice(firstIndex, 1)[0];

    // Randomly select second player from remaining
    const secondIndex = Math.floor(Math.random() * availablePlayers.length);
    const player2 = availablePlayers[secondIndex];

    return [player1, player2];
  }

  // Initialise UI
  updateUI();

  gameModeSelect.addEventListener("change", () => {
    if (
      !selectPvp.classList.contains("hide") ||
      !selectPva.classList.contains("hide") ||
      gameState.playerNsMs.X.name ||
      gameState.playerNsMs.O.name
    ) {
      selectPvp.classList.toggle("hide", true);
      selectPva.classList.toggle("hide", true);
      gameState.playerNsMs.X.name = "";
      gameState.playerNsMs.O.name = "";
    }

    if (gameModeSelect.value !== "pva") {
      aiDifficultySelect.value = "";
      gameState.aiDifficulty = "";
    }

    if (gameModeSelect.value === "pvp") {
      selectPvp.classList.toggle("hide", false);
      const [name1, name2] = getRandomNames();
      gameState.playerNsMs.X.name = name1;
      gameState.playerNsMs.O.name = name2;
      document.getElementById("player1-name").textContent = name1;
      document.getElementById("player2-name").textContent = name2;
    } else if (gameModeSelect.value === "pva") {
      selectPva.classList.toggle("hide", false);
    }

    gameState.gameMode = gameModeSelect.value;
  });

  aiDifficultySelect.addEventListener("change", () => {
    gameState.aiDifficulty = aiDifficultySelect.value;
  });

  function updateUI() {
    // Update board squares
    squares.forEach((square, index) => {
      const cellValue = gameState.board[index];
      square.textContent = gameState.board[index] || "";
      square.setAttribute(
        "aria-label",
        `Cell ${index + 1}, ${cellValue ? cellValue : "empty"}`
      );
      square.classList.toggle(
        "enabled",
        gameState.gameActive && !square.textContent
      );
    });

    // Update status message
    if (gameState.winner) {
      statusText.textContent =
        gameState.winner === "draw"
          ? "Game Drawn!"
          : `${gameState.winner} Wins!`;
      statusText.setAttribute("aria-live", "assertive");
    } else {
      statusText.textContent = gameState.gameActive
        ? `${gameState.currentPlayer}'s Turn`
        : "Select Game Mode";
      statusText.setAttribute("aria-live", "polite");
    }


    gameButton.classList.toggle("hide", gameState.gameActive);
    resetButton.classList.toggle("hide", !gameState.gameActive);
  }

  function checkWinner() {
    return winningCombinations.some(([a, b, c]) => {
      return (
        gameState.board[a] &&
        gameState.board[a] === gameState.board[b] &&
        gameState.board[a] === gameState.board[c]
      );
    });
  }

  function handleMove(index) {
    if (!gameState.gameActive || gameState.board[index]) return;


    gameState.board[index] = gameState.currentPlayer;


    if (gameState.currentPlayer === "X") {
      gameState.playerNsMs.X.moves++;
    } else {
      gameState.playerNsMs.O.moves++;
    }

    // Check for winner
    if (checkWinner()) {
      gameState.winner = gameState.currentPlayer;
      gameState.gameActive = false;

      if (gameModeSelect.value) {
        if (gameModeSelect.value === "pvp") {
          displayDiv.innerHTML = "";

          gameState.wsOF = false;
          ws.send(JSON.stringify({ type: "gameUpdate", gameState: gameState }));
        }
        if (gameModeSelect.value === "pva") {
          aiDifficultySelect.value = "";
        }
        gameModeSelect.value = "";
        if (!selectPvp.classList.contains("hide")) {
          selectPvp.classList.toggle("hide", true);
        } else if (!selectPva.classList.contains("hide")) {
          selectPva.classList.toggle("hide", true);
        }
      }

      gameModeSelect.disabled = false;
      aiDifficultySelect.disabled = false;
    }
    // Check for draw
    else if (!gameState.board.includes(null)) {
      gameState.winner = "draw";
      gameState.gameActive = false;

      if (gameModeSelect.value) {
        if (gameModeSelect.value === "pvp") {
          displayDiv.innerHTML;

          gameState.wsOF = false;
          ws.send(JSON.stringify({ type: "gameUpdate", gameState: gameState }));
        }
        if (gameModeSelect.value === "pva") {
          aiDifficultySelect.value = "";
        }
        gameModeSelect.value = "";
        if (!selectPvp.classList.contains("hide")) {
          selectPvp.classList.toggle("hide", true);
        } else if (!selectPva.classList.contains("hide")) {
          selectPva.classList.toggle("hide", true);
        }
      }

      gameModeSelect.disabled = false;
      aiDifficultySelect.disabled = false;
    }
    // Continue game
    else {
      gameState.currentPlayer = gameState.currentPlayer === "X" ? "O" : "X";

      if (gameModeSelect.value === "pva" && gameState.currentPlayer === "O") {
        disablePlayerClicks();
        setTimeout(() => {
          aiMove();
          enablePlayerClicks();
        }, 200);
      }
    }

    if (gameModeSelect.value === "pvp") {
      //if move is x add
      ws.send(JSON.stringify({ type: "gameUpdate", gameState: gameState }));
    }

    updateUI();
  }

  // Event Listeners
  gameButton.addEventListener("click", () => {
    if (!gameModeSelect.value) {
      alert("Please select a game mode.");
      return;
    }

    if (gameModeSelect.value === "pva" && !aiDifficultySelect.value) {
      alert("Please select an AI difficulty.");
      return;
    }

    gameState = {
      ...gameState,
      board: Array(9).fill(null),
      currentPlayer: "X",
      gameActive: true,
      winner: null,
      playerNsMs: {
        X: { ...gameState.playerNsMs.X, moves: 0 },
        O: { ...gameState.playerNsMs.O, moves: 0 },
      },
    };

    //WS INTEGRATION//
    if (gameModeSelect.value === "pvp") {
      gameState.wsOF = true;
      ws.send(JSON.stringify({ type: "startGame", gameState: gameState }));
    }

    gameModeSelect.disabled = true;
    aiDifficultySelect.disabled = true;

    updateUI();
    // console.log(gameState);
  });

  resetButton.addEventListener("click", () => {
    gameState = {
      board: Array(9).fill(null),
      gameMode: "",
      currentPlayer: "X",
      gameActive: false,
      winner: null,
      playerNsMs: {
        X: { name: "", moves: 0 },
        O: { name: "", moves: 0 },
      },
      aiDifficulty: "",
      wsOF: false,
    };

    if (gameModeSelect.value === "pvp") {
      displayDiv.innerHTML = "";
      ws.send(JSON.stringify({ type: "gameReset", gameState: gameState }));
    }

    gameModeSelect.disabled = false; // Re-enable game mode selection
    aiDifficultySelect.disabled = false;

    updateUI();

    if (gameModeSelect.value) {
      if (gameModeSelect.value === "pva") {
        aiDifficultySelect.value = "";
      }
      gameModeSelect.value = "";
      if (!selectPvp.classList.contains("hide")) {
        selectPvp.classList.toggle("hide", true);
      } else if (!selectPva.classList.contains("hide")) {
        selectPva.classList.toggle("hide", true);
      }
    }
  });

  fetchDataBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("http://localhost:3000/db");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      console.log("Fetched data:", data); // Debug log

      if (data.error) {
        displayDiv.innerHTML = `<p>Error: ${data.error}</p>`;
        return;
      }

      if (data.message === "no database") {
        displayDiv.innerHTML = "<p>No data available in the database.</p>";
        return;
      }

      if (data.length === 0) {
        displayDiv.innerHTML = "<p>No records found.</p>";
        return;
      }

      let tableHTML = `<table>
        <caption>Player Scores</caption>
        <tr>
          <th scope="col">Player Name</th>
          <th scope="col">Score</th>
          <th scope="col">Moves</th>
        </tr>`;

      data.forEach((row) => {
        tableHTML += `
          <tr>
            <td>${row.player_name}</td>
            <td>${row.score}</td>
            <td>${row.moves}</td>
          </tr>`;
      });

      tableHTML += `</table>`;
      displayDiv.innerHTML = tableHTML;
    } catch (error) {
      console.error("Fetch error:", error.message); // Enhanced error logging
      displayDiv.innerHTML = `<p style="color:red;">Error fetching data: ${error.message}</p>`;
    }
  });

  // Add event listeners to each square
  squares.forEach((square, index) => {
    square.addEventListener("click", () => {
      if (gameState.gameActive && !gameState.winner) {
        handleMove(index);
      }
    });
  });

  function aiMove() {
    let move;
    if (gameState.aiDifficulty === "naive") {
      move = naiveAI();
    } else if (gameState.aiDifficulty === "intermediate") {
      move = intermediateAI();
    } else {
      move = advancedAI();
    }
    if (move !== -1) {
      handleMove(move);
    }
  }

  function naiveAI() {
    const availableMoves = gameState.board
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);

    if (availableMoves.length === 0) return -1;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  function intermediateAI() {
    // Try to win or block
    for (const combo of winningCombinations) {
      const [a, b, c] = combo;
      const values = [
        gameState.board[a],
        gameState.board[b],
        gameState.board[c],
      ];

      // If AI can win
      if (
        values.filter((v) => v === "O").length === 2 &&
        values.includes(null)
      ) {
        return combo[values.indexOf(null)];
      }
      // If AI can block X
      if (
        values.filter((v) => v === "X").length === 2 &&
        values.includes(null)
      ) {
        return combo[values.indexOf(null)];
      }
    }
    return naiveAI();
  }

  function advancedAI() {
    const best = minimax(gameState.board, "O");
    return best.index;
  }

  // Minimax Algorithm 
  function minimax(board, player) {
    const emptySquares = board
      .map((val, idx) => (val === null ? idx : null))
      .filter((val) => val !== null);

    // Evaluate terminal states
    if (checkWinnerMinimax(board, "X")) return { score: -10 };
    if (checkWinnerMinimax(board, "O")) return { score: 10 };
    if (emptySquares.length === 0) return { score: 0 };

    let moves = [];

    for (const i of emptySquares) {
      let move = {};
      move.index = i;
      board[i] = player; // set the spot

      if (player === "O") {
        move.score = minimax(board, "X").score;
      } else {
        move.score = minimax(board, "O").score;
      }

      board[i] = null; // reset spot
      moves.push(move);
    }

    // Choose best move
    let bestMove;
    if (player === "O") {
      let bestScore = -Infinity;
      moves.forEach((m) => {
        if (m.score > bestScore) {
          bestScore = m.score;
          bestMove = m;
        }
      });
      return bestMove;
    } else {
      let bestScore = Infinity;
      moves.forEach((m) => {
        if (m.score < bestScore) {
          bestScore = m.score;
          bestMove = m;
        }
      });
      return bestMove;
    }
  }

  function checkWinnerMinimax(board, player) {
    return winningCombinations.some(([a, b, c]) => {
      return board[a] === player && board[b] === player && board[c] === player;
    });
  }

  function disablePlayerClicks() {
    squares.forEach((square) => {
      square.style.pointerEvents = "none";
    });
  }

  function enablePlayerClicks() {
    squares.forEach((square) => {
      square.style.pointerEvents = "auto";
    });
  }







  //ws connection
  const ws = new WebSocket("ws://localhost:3000");

  ws.addEventListener("open", () => {
    console.log("WebSocket connection opened");
  });

  ws.addEventListener("message", (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log(
        "Message accepted from server:",
        JSON.stringify(message, null, 2)
      );
      
      // Sync gameState and UI
      if (message.type && message.gameState) {
        Object.assign(gameState, message.gameState);

        if (message.gameState.winner && !message.gameState.wsOF) {
          // Reset game mode and related states
          gameState.gameMode = "";
          gameState.aiDifficulty = "";
          gameState.playerNsMs.X.name = "";
          gameState.playerNsMs.O.name = "";
        }
        updateUI();
        updateSelectUI();
      }
    } catch (error) {
      console.error("Failed to parse server message:", error);
    }
  });

  ws.addEventListener("close", () => {
    console.warn("WebSocket connection closed. Attempting to reconnect...");
    setTimeout(() => {
      location.reload();
    }, 3000);
  });

  function updateSelectUI() {
    // Update game mode select
    gameModeSelect.value = gameState.gameMode || "";

    // Update AI difficulty select
    aiDifficultySelect.value = gameState.aiDifficulty || "";

    // Update visibility of PVP and PVA select sections
    if (gameState.gameMode === "pvp") {
      selectPvp.classList.toggle("hide", false);
      selectPva.classList.toggle("hide", true);
      const [name1, name2] = [
        gameState.playerNsMs.X.name,
        gameState.playerNsMs.O.name,
      ];
      document.getElementById("player1-name").textContent = name1 || "";
      document.getElementById("player2-name").textContent = name2 || "";
    } else if (gameState.gameMode === "pva") {
      selectPvp.classList.toggle("hide", true);
      selectPva.classList.toggle("hide", false);
    } else {
      selectPvp.classList.toggle("hide", true);
      selectPva.classList.toggle("hide", true);
    }

    // Disable/enable selects based on game activity
    gameModeSelect.disabled = gameState.gameActive;
    aiDifficultySelect.disabled = gameState.gameActive;
  }

  document.addEventListener("keydown", (event) => {
    const focusedElement = document.activeElement;
    if (!focusedElement.classList.contains("square")) return;

    const index = parseInt(focusedElement.id);
    let newIndex;

    switch (event.key) {
      case "ArrowUp":
        newIndex = index - 3 >= 0 ? index - 3 : index;
        break;
      case "ArrowDown":
        newIndex = index + 3 < 9 ? index + 3 : index;
        break;
      case "ArrowLeft":
        newIndex = index % 3 !== 0 ? index - 1 : index;
        break;
      case "ArrowRight":
        newIndex = (index + 1) % 3 !== 0 ? index + 1 : index;
        break;
      default:
        return;
    }

    squares[newIndex].focus();
  });
});
