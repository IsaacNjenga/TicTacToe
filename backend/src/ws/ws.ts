import { WebSocket, WebSocketServer } from "ws";
import { randomUUID } from "node:crypto"; //generates a unique ID for each new game.

type PlayerSymbol = "X" | "O";
type GameStatus = "WAITING" | "READY";

type GamePlayer = {
  socket: WebSocket;
  symbol: PlayerSymbol;
};

type GameSession = {
  //describes the shape of one game.
  id: string;
  status: GameStatus;
  players: GamePlayer[];
};

function sendJson(socket: WebSocket, data: object) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

// Instead of independently sending a status to each player, create one representation of the game
// state and sends it to every player in the session.
// Both clients receive the same game ID and status.
function sendGameState(game: GameSession) {
  const state = {
    type: "game:state",
    gameId: game.id,
    status: game.status,
    players: game.players.map((player) => ({
      symbol: player.symbol,
    })),
  };

  for (const player of game.players) {
    sendJson(player.socket, state);
  }
}

//handles a disconnection.
// If one player leaves, the remaining player is notified and the game returns to WAITING.
function removePlayer(socket: WebSocket) {
  const gameId = socketGames.get(socket);

  if (!gameId) return;

  const game = games.get(gameId);

  socketGames.delete(socket);

  if (!game) return;

  game.players = game.players.filter((player) => player.socket !== socket);

  if (game.players.length === 0) {
    games.delete(gameId);
    return;
  }

  // The remaining player can wait for a replacement.
  game.status = "WAITING";

  sendJson(game.players[0].socket, {
    type: "game:opponent_left",
    message: "Your opponent disconnected. Waiting for another player.",
  });

  sendGameState(game);
}

const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket server starting on port 8080");

const clients = new Set<WebSocket>();
const rooms = new Map<string, Set<WebSocket>>();
const clientRooms = new Map<WebSocket, string>();
const games = new Map<string, GameSession>(); // look up a session using its ID.
const socketGames = new Map<WebSocket, string>(); // Find the game a connected socket belongs to.

function broadcastPresence() {
  const message = {
    type: "presence:update",
    onlineCount: clients.size,
  };

  for (const client of clients) {
    sendJson(client, message);
  }
}

function broadcastToRoom(roomId: string, data: object) {
  const members = rooms.get(roomId);

  if (!members) return;

  for (const client of members) {
    sendJson(client, data);
  }
}

function leaveRoom(socket: WebSocket) {
  const roomId = clientRooms.get(socket);

  if (!roomId) return;

  const members = rooms.get(roomId);

  members?.delete(socket);
  clientRooms.delete(socket);

  if (members?.size === 0) {
    rooms.delete(roomId);
  } else {
    broadcastToRoom(roomId, {
      type: "room:leave",
      message: "A user has left the room.",
    });
  }
}

wss.on("connection", (socket) => {
  console.log("A client connected");

  clients.add(socket);
  broadcastPresence();

  socket.on("message", (rawData) => {
    let data: {
      type?: string;
      gameId?: string;
    };

    try {
      data = JSON.parse(rawData.toString());
    } catch {
      sendJson(socket, {
        type: "error",
        message: "Invalid JSON message.",
      });
      return;
    }

    // A connection can participate in only one game at a time.
    if (socketGames.has(socket)) {
      sendJson(socket, {
        type: "error",
        message: "You are already in a game.",
      });
      return;
    }

    if (data.type === "game:create") {
      const gameId = randomUUID().slice(0, 8);

      const game: GameSession = {
        id: gameId,
        status: "WAITING",
        players: [
          {
            socket,
            symbol: "X",
          },
        ],
      };

      games.set(gameId, game);
      socketGames.set(socket, gameId);

      sendJson(socket, {
        type: "game:created",
        gameId,
        symbol: "X",
      });

      sendGameState(game);

      console.log(`Game created: ${gameId}`);
      return;
    }

    if (data.type === "game:join") {
      const gameId = data.gameId?.trim();

      if (!gameId) {
        sendJson(socket, {
          type: "error",
          message: "A game ID is required.",
        });
        return;
      }

      const game = games.get(gameId);

      if (!game) {
        sendJson(socket, {
          type: "error",
          message: "Game not found.",
        });
        return;
      }

      if (game.status !== "WAITING" || game.players.length >= 2) {
        sendJson(socket, {
          type: "error",
          message: "This game is not available to join.",
        });
        return;
      }

      // Assign whichever symbol is not already taken.
      const symbol: PlayerSymbol = game.players.some(
        (player) => player.symbol === "X",
      )
        ? "O"
        : "X";

      game.players.push({ socket, symbol });
      game.status = "READY";

      socketGames.set(socket, gameId);

      sendJson(socket, {
        type: "game:joined",
        gameId,
        symbol,
      });

      sendGameState(game);
      console.log(`Player joined game: ${gameId}`);
      return;
    }

    sendJson(socket, {
      type: "error",
      message: "Unknown event type.",
    });
  });

  socket.on("close", () => {
    leaveRoom(socket);
    clients.delete(socket);
    broadcastPresence();

    console.log("A client disconnected");
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});
