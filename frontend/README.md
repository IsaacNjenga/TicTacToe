# Little Rivals

Little Rivals is the SvelteKit frontend for an account-based, real-time Tic Tac Toe game.

## Run locally

1. Start the backend after configuring its environment and MongoDB connection.
2. Set `PUBLIC_SERVER_URL` to the backend API base (for example, `http://localhost:3001/api`).
3. Run `npm run dev` in this directory and sign in.

The frontend uses that API base for history at `/api/games/history` and connects to the same
backend host for the authenticated WebSocket at `/ws`.

## Match rules

- A match needs two different signed-in players. The host is X and moves first; the joiner is O.
- Players take turns. Only the player whose symbol is next may place a mark, and a square can be used once.
- A match ends when a player makes a three-in-a-row or when all nine squares are occupied.
- An account can have only one unfinished match. A host may cancel a waiting match.
- Disconnecting does not forfeit a match: reconnecting restores the saved board and turn.
- Moves and completed results are stored by the backend. Only completed matches count in history.

Game IDs contain 12 random URL-safe characters. These rules are enforced by the backend, not just
by the disabled states in the interface.
