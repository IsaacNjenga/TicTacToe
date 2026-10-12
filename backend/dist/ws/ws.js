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
const mailer_1 = require("../utils/mailer");
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
const challengesById = new Map();
const challengeByUser = new Map();
const normalizedOrigin = (origin) => origin.trim().replace(/\/+$/, "");
const allowedOrigins = ["http://localhost:5173", ...env_1.env.FRONTEND_URL.split(",")]
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
async function getOnlinePlayers(excludedUserId) {
    return Promise.all([...socketsByUser.entries()]
        .filter(([userId]) => userId !== excludedUserId)
        .map(async ([userId, socket]) => ({
        userId,
        username: socket.username || "Player",
        countryCode: socket.countryCode ?? null,
        available: !(await getPlayerGame(new mongoose_1.Types.ObjectId(userId))),
    })));
}
async function sendPresence(socket) {
    if (!socket.userId)
        return;
    sendJson(socket, {
        type: "presence:list",
        players: await getOnlinePlayers(socket.userId),
    });
}
function broadcastPresence() {
    for (const socket of socketsByUser.values()) {
        void sendPresence(socket).catch((error) => {
            console.error("Online player list failed:", error);
        });
    }
}
function clearChallenge(challenge) {
    clearTimeout(challenge.timeout);
    challengesById.delete(challenge.id);
    if (challengeByUser.get(challenge.fromUserId) === challenge.id) {
        challengeByUser.delete(challenge.fromUserId);
    }
    if (challengeByUser.get(challenge.toUserId) === challenge.id) {
        challengeByUser.delete(challenge.toUserId);
    }
}
function notifyChallengePeer(challenge, userId, data) {
    const socket = socketsByUser.get(userId);
    if (socket)
        sendJson(socket, data);
}
async function sendChallenge(socket, user, targetUserId) {
    if (typeof targetUserId !== "string" ||
        !mongoose_1.Types.ObjectId.isValid(targetUserId)) {
        sendError(socket, "Choose a valid online player to challenge.");
        return;
    }
    const toUserId = new mongoose_1.Types.ObjectId(targetUserId).toString();
    const fromUserId = user._id.toString();
    const targetSocket = socketsByUser.get(toUserId);
    if (toUserId === fromUserId || !targetSocket) {
        sendError(socket, "That player is no longer online.");
        return;
    }
    if (challengeByUser.has(fromUserId) || challengeByUser.has(toUserId)) {
        sendError(socket, "One of you already has a pending challenge.");
        return;
    }
    if (await getPlayerGame(user._id)) {
        sendError(socket, "Finish your current game before challenging someone.");
        return;
    }
    if (await getPlayerGame(new mongoose_1.Types.ObjectId(toUserId))) {
        sendError(socket, "That player is already in a game.");
        broadcastPresence();
        return;
    }
    if (!socketsByUser.has(toUserId) ||
        challengeByUser.has(fromUserId) ||
        challengeByUser.has(toUserId)) {
        sendError(socket, "That player is no longer available for a challenge.");
        return;
    }
    const availableTargetSocket = socketsByUser.get(toUserId);
    if (!availableTargetSocket) {
        sendError(socket, "That player is no longer online.");
        return;
    }
    const id = (0, node_crypto_1.randomBytes)(8).toString("hex");
    const challenge = {
        id,
        fromUserId,
        toUserId,
        fromUsername: user.username || "Player",
        fromCountryCode: user.countryCode ?? null,
        timeout: setTimeout(() => {
            clearChallenge(challenge);
            notifyChallengePeer(challenge, fromUserId, {
                type: "challenge:expired",
                challengeId: id,
                message: "Your challenge expired without a response.",
            });
            notifyChallengePeer(challenge, toUserId, {
                type: "challenge:expired",
                challengeId: id,
                message: "The challenge expired.",
            });
        }, 60000),
    };
    challengesById.set(id, challenge);
    challengeByUser.set(fromUserId, id);
    challengeByUser.set(toUserId, id);
    sendJson(socket, {
        type: "challenge:sent",
        challengeId: id,
        targetUserId: toUserId,
        username: availableTargetSocket.username || "Player",
    });
    sendJson(availableTargetSocket, {
        type: "challenge:incoming",
        challengeId: id,
        challenger: {
            userId: fromUserId,
            username: challenge.fromUsername,
            countryCode: challenge.fromCountryCode,
        },
    });
    if (availableTargetSocket.email) {
        const frontendUrl = env_1.env.FRONTEND_URL.split(",")[0]
            .trim()
            .replace(/\/+$/, "");
        void mailer_1.transporter
            .sendMail({
            from: env_1.env.EMAIL_USER,
            to: availableTargetSocket.email,
            subject: `${challenge.fromUsername} challenged you on Little Rivals`,
            text: `${challenge.fromUsername} challenged you to a Tic Tac Toe match. Sign in to respond: ${frontendUrl}/home`,
        })
            .catch((error) => {
            console.error("Challenge notification email failed:", error);
        });
    }
}
async function respondToChallenge(socket, userId, challengeId, accepted) {
    if (typeof challengeId !== "string") {
        sendError(socket, "That challenge is no longer available.");
        return;
    }
    const challenge = challengesById.get(challengeId);
    if (!challenge || challenge.toUserId !== userId.toString()) {
        sendError(socket, "That challenge is no longer available.");
        return;
    }
    const challengerSocket = socketsByUser.get(challenge.fromUserId);
    if (!challengerSocket) {
        clearChallenge(challenge);
        sendJson(socket, {
            type: "challenge:expired",
            challengeId,
            message: "The challenger went offline.",
        });
        return;
    }
    if (!accepted) {
        clearChallenge(challenge);
        sendJson(socket, { type: "challenge:declined", challengeId });
        sendJson(challengerSocket, {
            type: "challenge:declined",
            challengeId,
            username: socket.username || "Player",
        });
        return;
    }
    if ((await getPlayerGame(new mongoose_1.Types.ObjectId(challenge.fromUserId))) ||
        (await getPlayerGame(userId))) {
        clearChallenge(challenge);
        sendJson(socket, {
            type: "challenge:expired",
            challengeId,
            message: "A player is already in a game.",
        });
        sendJson(challengerSocket, {
            type: "challenge:expired",
            challengeId,
            message: "The challenge could not start because a player entered a game.",
        });
        broadcastPresence();
        return;
    }
    const game = new game_model_1.GameModel({
        code: (0, node_crypto_1.randomBytes)(6).toString("hex").toUpperCase(),
        status: "active",
        players: [
            {
                userId: new mongoose_1.Types.ObjectId(challenge.fromUserId),
                username: challenge.fromUsername,
                symbol: "X",
            },
            { userId, username: socket.username || "Player", symbol: "O" },
        ],
    });
    await game.save();
    const challengerReserved = await reservePlayer(new mongoose_1.Types.ObjectId(challenge.fromUserId), game._id);
    const recipientReserved = challengerReserved && (await reservePlayer(userId, game._id));
    if (!challengerReserved || !recipientReserved) {
        await releaseGameLocks(game._id);
        await game_model_1.GameModel.deleteOne({ _id: game._id });
        clearChallenge(challenge);
        sendError(socket, "A player entered another game before the challenge was accepted.");
        sendError(challengerSocket, "The challenge could not start because a player entered another game.");
        broadcastPresence();
        return;
    }
    clearChallenge(challenge);
    sendJson(challengerSocket, { type: "challenge:accepted", challengeId });
    sendGameState(game);
    broadcastPresence();
}
function cancelChallenge(socket, userId, challengeId) {
    if (typeof challengeId !== "string")
        return;
    const challenge = challengesById.get(challengeId);
    if (!challenge || challenge.fromUserId !== userId.toString())
        return;
    clearChallenge(challenge);
    notifyChallengePeer(challenge, challenge.toUserId, {
        type: "challenge:cancelled",
        challengeId,
    });
    sendJson(socket, { type: "challenge:cancelled", challengeId });
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
            if (!existingGame ||
                existingGame.status === "finished" ||
                existingGame.status === "cancelled") {
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
    const user = await user_model_1.UserModel.findById(payload.userId).select("_id username countryCode email isActivated");
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
    socket.username = user.username || "Player";
    socket.countryCode = user.countryCode ?? null;
    socket.email = user.email ?? undefined;
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
    broadcastPresence();
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
    broadcastPresence();
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
        await game_model_1.PlayerGameLockModel.deleteOne({
            _id: userId,
            gameId: waitingGame._id,
        });
        sendError(socket, "That game was just joined or is no longer available.");
        return;
    }
    sendGameState(joinedGame);
    broadcastPresence();
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
        broadcastPresence();
    }
}
async function cancelGame(socket, userId) {
    const game = await getPlayerGame(userId);
    if (!game) {
        sendError(socket, "You are not currently in a game.");
        return;
    }
    if (game.status !== "waiting" || !game.players[0].userId.equals(userId)) {
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
    broadcastPresence();
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
    const user = await user_model_1.UserModel.findById(userId).select("_id username countryCode email isActivated");
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
        case "challenge:send":
            await sendChallenge(socket, user, message.targetUserId);
            return;
        case "challenge:accept":
            await respondToChallenge(socket, userId, message.challengeId, true);
            return;
        case "challenge:decline":
            await respondToChallenge(socket, userId, message.challengeId, false);
            return;
        case "challenge:cancel":
            cancelChallenge(socket, userId, message.challengeId);
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
            const userId = socket.userId;
            socketsByUser.delete(userId);
            const challengeId = challengeByUser.get(userId);
            const challenge = challengeId
                ? challengesById.get(challengeId)
                : undefined;
            if (challenge) {
                clearChallenge(challenge);
                const peerId = challenge.fromUserId === userId
                    ? challenge.toUserId
                    : challenge.fromUserId;
                notifyChallengePeer(challenge, peerId, {
                    type: "challenge:expired",
                    challengeId,
                    message: "The other player went offline.",
                });
            }
            broadcastPresence();
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