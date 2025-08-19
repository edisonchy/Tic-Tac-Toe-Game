# Tic Tac Toe Game

A simple Tic-Tac-Toe game with both **PvP** and **PvAI** modes.  
Data is stored in **SQLite**, and **WebSockets** enable real-time multiplayer across browser instances.

<img src="https://github.com/user-attachments/assets/e1d7b28c-0fb5-4ea1-a8b2-b9ba12f3106f" alt="Tic Tac Toe Screenshot" width="600">

## Features

### 👥 Player vs Player
- Open the game in multiple browser windows/devices.  
- Moves sync in real time via **WebSocket**.

### 🤖 Player vs AI
- **Naive Mode**  
  - Picks a completely random empty square.
- **Intermediate Mode**  
  - Looks one move ahead:
    - If the AI can win this turn, it takes the winning square.  
    - If the player can win next turn, it blocks that square.  
    - Otherwise, it falls back to a random legal move.
- **Advanced Mode (Minimax)**  
  - Simulates all possible continuations to the end of the game.  
  - Scores outcomes: **+10 (win), 0 (draw), −10 (loss)**.  
  - Chooses the optimal move.
