"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const node_crypto_1 = require("node:crypto"); //generates a unique ID for each new game.
function sendJson(socket, data) {
    if (socket.readyState === ws_1.WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    }
}
// Instead of independently sending a status to each player, create one representation of the game
// state and sends it to every player in the session.
// Both clients receive the same game ID and status.
function sendGameState(game) {
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
function removePlayer(socket) {
    const gameId = socketGames.get(socket);
    if (!gameId)
        return;
    const game = games.get(gameId);
    socketGames.delete(socket);
    if (!game)
        return;
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
const wss = new ws_1.WebSocketServer({ port: 8080 });
console.log("WebSocket server starting on port 8080");
const clients = new Set();
const rooms = new Map();
const clientRooms = new Map();
const games = new Map(); // look up a session using its ID.
const socketGames = new Map(); // Find the game a connected socket belongs to.
function broadcastPresence() {
    const message = {
        type: "presence:update",
        onlineCount: clients.size,
    };
    for (const client of clients) {
        sendJson(client, message);
    }
}
function broadcastToRoom(roomId, data) {
    const members = rooms.get(roomId);
    if (!members)
        return;
    for (const client of members) {
        sendJson(client, data);
    }
}
function leaveRoom(socket) {
    const roomId = clientRooms.get(socket);
    if (!roomId)
        return;
    const members = rooms.get(roomId);
    members?.delete(socket);
    clientRooms.delete(socket);
    if (members?.size === 0) {
        rooms.delete(roomId);
    }
    else {
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
        let data;
        try {
            data = JSON.parse(rawData.toString());
        }
        catch {
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
            const gameId = (0, node_crypto_1.randomUUID)().slice(0, 8);
            const game = {
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
            const symbol = game.players.some((player) => player.symbol === "X")
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
//# sourceMappingURL=ws.js.map