const WebSocket = require("ws");
const express = require("express");
const http = require("http");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();

const PORT = 3000;
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

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// SQLite3 database
const db = new sqlite3.Database("./scores.db", (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
    db.run(
      `CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        moves INTEGER
      )`,
      (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
        } else {
          console.log("Scores table created or already exists");
        }
      }
    );
  }
});

wss.on("connection", function connection(ws) {
  console.log("Client connected");

  ws.send(JSON.stringify({ type: "syncResponse", gameState: gameState }));

  ws.on("message", function message(data) {
    try {
      const message = JSON.parse(data);
      console.log("Received game state:", JSON.stringify(message, null, 2));

      if (
        message.type === "startGame" ||
        message.type === "gameUpdate" ||
        message.type === "gameReset"
      ) {
        gameState = { ...message.gameState };
        if (gameState.winner) {
          scoreHandler(gameState);
        }
      }

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({
              type: message.type,
              gameState: gameState,
            })
          );
        }
      });
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  ws.on("close", function close() {
    console.log("Client disconnected");
  });
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/db", (req, res) => {
  db.all("SELECT * FROM scores ORDER BY score DESC, moves ASC, player_name DESC", [], (err, rows) => {
    if (err) {
      console.error("Error querying database:", err.message);
      return res.status(500).json({ error: "Database error" });
    }
    if (rows.length === 0) {
      return res.json({ message: "no database" });
    }
    res.json(rows);
  });
});

server.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT} and ws://localhost:${PORT}`
  );
});

function scoreHandler(gameState) {
  if (!gameState.winner) return gameState;

  if (gameState.winner === "draw") {
    const player1 = gameState.playerNsMs["X"].name || "Player X";
    const player2 = gameState.playerNsMs["O"].name || "Player O";
    dbOperations(player1, 50, gameState.playerNsMs["X"].moves);
    dbOperations(player2, 50, gameState.playerNsMs["O"].moves);
    console.log(`50 points for ${player1} and ${player2}`);
  } else {
    const winner = gameState.winner;
    const winnerName = gameState.playerNsMs[winner].name || `Player ${winner}`;
    const winnerMoves = gameState.playerNsMs[winner].moves;
    const winnerScore = Math.max(100 - winnerMoves * 10, 0);
    dbOperations(winnerName, winnerScore, winnerMoves);
    console.log(`${winnerScore} for ${winnerName}`);
  }
}

const dbOperations = (playerName, newScore, newMoves) => {
  db.get(
    "SELECT score, moves FROM scores WHERE player_name = ?",
    [playerName],
    (err, row) => {
      if (err) {
        console.error("Error querying database:", err.message);
        return;
      }
      if (row) {
        const updatedScore = row.score + newScore;
        const updatedMoves = row.moves + newMoves;
        db.run(
          "UPDATE scores SET score = ?, moves = ? WHERE player_name = ?",
          [updatedScore, updatedMoves, playerName],
          (err) => {
            if (err) {
              console.error("Error updating score:", err.message);
            } else {
              console.log(
                `Updated DB: ${playerName} - ${updatedScore} points, ${updatedMoves} moves`
              );
            }
          }
        );
      } else {
        db.run(
          "INSERT INTO scores (player_name, score, moves) VALUES (?, ?, ?)",
          [playerName, newScore, newMoves],
          (err) => {
            if (err) {
              console.error("Error inserting new player:", err.message);
            } else {
              console.log(
                `Added to DB: ${playerName} - ${newScore} points, ${newMoves} moves`
              );
            }
          }
        );
      }
    }
  );
};


process.on("SIGINT", () => {
  db.close((err) => {
    if (err) {
      console.error("Error closing database:", err.message);
    }
    console.log("Database connection closed");
    process.exit(0);
  });
});