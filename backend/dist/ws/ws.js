"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachGameWebSocket = attachGameWebSocket;
const node_crypto_1 = require("node:crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = require("mongoose");
const ws_1 = require("ws");
const env_1 = require("../config/env");
const user_model_1 = require("../modules/Users/user.model");
const game_model_1 = require("../modules/Games/game.model");
const winningLines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
];
const webSocketServer = new ws_1.WebSocketServer({
    noServer: true,
    maxPayload: 4096,
    perMessageDeflate: false,
});
const socketsByUser = new Map();
const normalizedOrigin = (origin) => origin.trim().replace(/\/+$/, "");
const allowedOrigins = [
    "http://localhost:5173",
    ...env_1.env.FRONTEND_URL.split(","),
    ...env_1.env.WEBSITE_URL.split(","),
]
    .map(normalizedOrigin)
    .filter(Boolean);
function sendJson(socket, data) {
    if (socket.readyState === ws_1.WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    }
}
function sendError(socket, message) {
    sendJson(socket, { type: "game:error", message });
}
function isDuplicateKeyError(error) {
    return (typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000);
}
async function reservePlayer(userId, gameId) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            await game_model_1.PlayerGameLockModel.create({ _id: userId, gameId });
            return true;
        }
        catch (error) {
            if (!isDuplicateKeyError(error)) {
                throw error;
            }
            const existingLock = await game_model_1.PlayerGameLockModel.findById(userId).lean();
            if (!existingLock) {
                continue;
            }
            const existingGame = await game_model_1.GameModel.findById(existingLock.gameId)
                .select("status")
                .lean();
            if (!existingGame || existingGame.status === "finished" || existingGame.status === "cancelled") {
                await game_model_1.PlayerGameLockModel.deleteOne({
                    _id: userId,
                    gameId: existingLock.gameId,
                });
                continue;
            }
            return false;
        }
    }
    return false;
}
async function releaseGameLocks(gameId) {
    await game_model_1.PlayerGameLockModel.deleteMany({ gameId });
}
function serializeGame(game) {
    return {
        type: "game:state",
        gameId: game.code,
        status: game.status,
        players: game.players.map((player) => ({
            userId: player.userId.toString(),
            username: player.username,
            symbol: player.symbol,
        })),
        board: game.board,
        turn: game.turn,
        winnerId: game.winnerId?.toString() ?? null,
        isDraw: game.isDraw,
        moves: game.moves.map((move) => ({
            userId: move.playerId.toString(),
            symbol: move.symbol,
            index: move.index,
            playedAt: move.playedAt,
        })),
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
    };
}
function sendGameState(game) {
    const message = serializeGame(game);
    for (const player of game.players) {
        const socket = socketsByUser.get(player.userId.toString());
        if (socket) {
            sendJson(socket, message);
        }
    }
}
async function getPlayerGame(userId) {
    const lock = await game_model_1.PlayerGameLockModel.findById(userId).lean();
    if (!lock) {
        return null;
    }
    const game = await game_model_1.GameModel.findById(lock.gameId);
    if (!game || game.status === "finished" || game.status === "cancelled") {
        await game_model_1.PlayerGameLockModel.deleteOne({ _id: userId, gameId: lock.gameId });
        return null;
    }
    if (!game.players.some((player) => player.userId.equals(userId))) {
        await game_model_1.PlayerGameLockModel.deleteOne({ _id: userId, gameId: lock.gameId });
        return null;
    }
    return game;
}
async function authenticateSocket(socket, token) {
    if (typeof token !== "string" || token.length === 0) {
        sendJson(socket, {
            type: "auth:error",
            message: "Sign in is required to play.",
        });
        socket.close(4401, "Authentication required");
        return;
    }
    let payload;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        if (typeof decoded === "string" ||
            typeof decoded.userId !== "string" ||
            !mongoose_1.Types.ObjectId.isValid(decoded.userId)) {
            throw new Error("Invalid token payload");
        }
        payload = decoded;
    }
    catch {
        sendJson(socket, {
            type: "auth:error",
            message: "Your sign-in has expired. Please sign in again.",
        });
        socket.close(4401, "Invalid authentication");
        return;
    }
    const user = await user_model_1.UserModel.findById(payload.userId).select("_id username isActivated");
    if (!user || !user.isActivated) {
        sendJson(socket, {
            type: "auth:error",
            message: "Your account is not available for play.",
        });
        socket.close(4401, "Account unavailable");
        return;
    }
    if (socket.readyState !== ws_1.WebSocket.OPEN) {
        return;
    }
    const userId = user._id.toString();
    const previousSocket = socketsByUser.get(userId);
    if (previousSocket && previousSocket !== socket) {
        previousSocket.userId = undefined;
        previousSocket.close(4001, "A newer connection replaced this one");
    }
    socket.userId = userId;
    socketsByUser.set(userId, socket);
    if (socket.authenticationTimer) {
        clearTimeout(socket.authenticationTimer);
        socket.authenticationTimer = undefined;
    }
    sendJson(socket, {
        type: "auth:ok",
        userId,
        username: user.username || "Player",
    });
    const game = await getPlayerGame(user._id);
    if (game) {
        sendJson(socket, serializeGame(game));
    }
}
async function createGame(socket, userId, username) {
    const game = new game_model_1.GameModel({
        code: (0, node_crypto_1.randomBytes)(6).toString("hex").toUpperCase(),
        status: "waiting",
        players: [{ userId, username, symbol: "X" }],
    });
    await game.save();
    if (!(await reservePlayer(userId, game._id))) {
        await game_model_1.GameModel.deleteOne({ _id: game._id });
        sendError(socket, "Finish or cancel your current game before creating another.");
        return;
    }
    sendGameState(game);
}
async function joinGame(socket, userId, username, suppliedCode) {
    if (typeof suppliedCode !== "string" ||
        !/^[a-f\d]{12}$/i.test(suppliedCode.trim())) {
        sendError(socket, "Enter a valid 12-character game ID.");
        return;
    }
    const code = suppliedCode.trim().toUpperCase();
    const waitingGame = await game_model_1.GameModel.findOne({ code, status: "waiting" });
    if (!waitingGame ||
        waitingGame.players.length !== 1 ||
        waitingGame.players[0].userId.equals(userId)) {
        sendError(socket, "That game is unavailable or you cannot join your own game.");
        return;
    }
    if (!(await reservePlayer(userId, waitingGame._id))) {
        sendError(socket, "Finish or cancel your current game before joining another.");
        return;
    }
    const joinedGame = await game_model_1.GameModel.findOneAndUpdate({
        _id: waitingGame._id,
        status: "waiting",
        players: { $size: 1 },
        "players.userId": { $ne: userId },
    }, {
        $push: { players: { userId, username, symbol: "O" } },
        $set: { status: "active" },
    }, { new: true, runValidators: true });
    if (!joinedGame) {
        await game_model_1.PlayerGameLockModel.deleteOne({ _id: userId, gameId: waitingGame._id });
        sendError(socket, "That game was just joined or is no longer available.");
        return;
    }
    sendGameState(joinedGame);
}
async function playMove(socket, userId, index) {
    if (typeof index !== "number" ||
        !Number.isInteger(index) ||
        index < 0 ||
        index > 8) {
        sendError(socket, "Choose a square on the board.");
        return;
    }
    const game = await getPlayerGame(userId);
    if (!game) {
        sendError(socket, "You are not currently in a game.");
        return;
    }
    const player = game.players.find((candidate) => candidate.userId.equals(userId));
    if (!player || game.status !== "active") {
        sendError(socket, "The game is not ready for a move.");
        return;
    }
    if (player.symbol !== game.turn) {
        sendError(socket, "It is your opponent's turn.");
        return;
    }
    if (game.board[index] !== null) {
        sendError(socket, "That square is already taken.");
        return;
    }
    const board = [...game.board];
    board[index] = player.symbol;
    const hasWon = winningLines.some((line) => line.every((square) => board[square] === player.symbol));
    const isDraw = !hasWon && board.every((square) => square !== null);
    const nextStatus = hasWon || isDraw ? "finished" : "active";
    const nextTurn = player.symbol === "X" ? "O" : "X";
    const updatedGame = await game_model_1.GameModel.findOneAndUpdate({
        _id: game._id,
        status: "active",
        turn: game.turn,
        board: game.board,
    }, {
        $set: {
            board,
            status: nextStatus,
            turn: nextTurn,
            winnerId: hasWon ? userId : null,
            isDraw,
        },
        $push: {
            moves: {
                playerId: userId,
                symbol: player.symbol,
                index,
                playedAt: new Date(),
            },
        },
    }, { new: true, runValidators: true });
    if (!updatedGame) {
        const currentGame = await game_model_1.GameModel.findById(game._id);
        if (currentGame) {
            sendGameState(currentGame);
        }
        sendError(socket, "The board changed before your move was saved. Please try again.");
        return;
    }
    sendGameState(updatedGame);
    if (updatedGame.status === "finished") {
        await releaseGameLocks(updatedGame._id);
    }
}
async function cancelGame(socket, userId) {
    const game = await getPlayerGame(userId);
    if (!game) {
        sendError(socket, "You are not currently in a game.");
        return;
    }
    if (game.status !== "waiting" ||
        !game.players[0].userId.equals(userId)) {
        sendError(socket, "Only the host can cancel a waiting game.");
        return;
    }
    const cancelledGame = await game_model_1.GameModel.findOneAndUpdate({ _id: game._id, status: "waiting", "players.0.userId": userId }, { $set: { status: "cancelled" } }, { new: true });
    if (!cancelledGame) {
        sendError(socket, "This game is no longer waiting.");
        return;
    }
    sendGameState(cancelledGame);
    await releaseGameLocks(cancelledGame._id);
}
function isMessage(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
async function handleMessage(socket, raw) {
    let message;
    try {
        message = JSON.parse(raw.toString());
    }
    catch {
        sendError(socket, "Invalid message format.");
        return;
    }
    if (!isMessage(message) || typeof message.type !== "string") {
        sendError(socket, "A message type is required.");
        return;
    }
    if (!socket.userId) {
        if (message.type !== "auth:authenticate") {
            sendJson(socket, {
                type: "auth:error",
                message: "Authenticate before sending game commands.",
            });
            socket.close(4401, "Authentication required");
            return;
        }
        await authenticateSocket(socket, message.token);
        return;
    }
    if (message.type === "auth:authenticate") {
        sendError(socket, "This connection is already authenticated.");
        return;
    }
    const userId = new mongoose_1.Types.ObjectId(socket.userId);
    const user = await user_model_1.UserModel.findById(userId).select("_id username isActivated");
    if (!user || !user.isActivated) {
        sendError(socket, "Your account is no longer available.");
        socket.close(4401, "Account unavailable");
        return;
    }
    switch (message.type) {
        case "game:create":
            await createGame(socket, userId, user.username || "Player");
            return;
        case "game:join":
            await joinGame(socket, userId, user.username || "Player", message.gameId);
            return;
        case "game:move":
            await playMove(socket, userId, message.index);
            return;
        case "game:cancel":
            await cancelGame(socket, userId);
            return;
        default:
            sendError(socket, "Unknown game command.");
    }
}
function handleUpgrade(request, socket, head) {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const origin = request.headers.origin;
    if (requestUrl.pathname !== "/ws") {
        socket.destroy();
        return;
    }
    if (origin && !allowedOrigins.includes(normalizedOrigin(origin))) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
    }
    webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
        webSocketServer.emit("connection", webSocket, request);
    });
}
webSocketServer.on("connection", (webSocket) => {
    const socket = webSocket;
    socket.authenticationTimer = setTimeout(() => {
        sendJson(socket, {
            type: "auth:error",
            message: "Authentication timed out.",
        });
        socket.close(4401, "Authentication timeout");
    }, 10000);
    socket.on("message", (raw) => {
        const payload = Buffer.isBuffer(raw)
            ? raw
            : Array.isArray(raw)
                ? Buffer.concat(raw)
                : Buffer.from(new Uint8Array(raw));
        void handleMessage(socket, payload).catch((error) => {
            console.error("Game WebSocket message failed:", error);
            sendError(socket, "The server could not process that game action.");
        });
    });
    socket.on("close", () => {
        if (socket.authenticationTimer) {
            clearTimeout(socket.authenticationTimer);
        }
        if (socket.userId && socketsByUser.get(socket.userId) === socket) {
            socketsByUser.delete(socket.userId);
        }
    });
    socket.on("error", (error) => {
        console.error("Game WebSocket error:", error);
    });
});
function attachGameWebSocket(server) {
    server.on("upgrade", handleUpgrade);
}
//# sourceMappingURL=ws.js.map