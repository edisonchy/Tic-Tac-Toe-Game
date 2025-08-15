A simple Tic-Tac-Toe game with both PvP and PvAI modes. Data is stored in SQLite, and WebSockets enable real-time multiplayer across browser instances.

Features
	•	Player vs Player (Online or LAN)
	•	Open the game in multiple browser windows/devices.
	•	Moves sync in real time via WebSocket.
	•	Player vs AI
	•	Three difficulty levels:
	•	Naive – picks a completely random empty square.
	•	Intermediate – looks one move ahead:
	•	If the AI can win this turn, it takes the winning square.
	•	Else if the player can win next turn, it blocks that square.
	•	Otherwise, it falls back to a random legal move.
	•	Advanced (Minimax) – plays perfectly:
	•	Simulates all possible continuations to the end of the game.
	•	Scores outcomes (+10 win, 0 draw, −10 loss) and chooses the optimal move.
	•	Never loses; at best, the human can force a draw.
