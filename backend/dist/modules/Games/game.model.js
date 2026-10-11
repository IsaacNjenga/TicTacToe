"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerGameLockModel = exports.GameModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const GameSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true, uppercase: true },
    status: {
        type: String,
        enum: ["waiting", "active", "finished", "cancelled"],
        required: true,
        default: "waiting",
    },
    players: {
        type: [
            {
                _id: false,
                userId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
                username: { type: String, required: true },
                symbol: { type: String, enum: ["X", "O"], required: true },
            },
        ],
        validate: {
            validator: (players) => players.length <= 2,
            message: "A game cannot contain more than two players.",
        },
        required: true,
    },
    board: {
        type: [{ type: String, enum: ["X", "O"] }],
        default: () => Array(9).fill(null),
        validate: {
            validator: (board) => board.length === 9 &&
                board.every((square) => square === null || square === "X" || square === "O"),
            message: "A game board must contain exactly nine valid squares.",
        },
        required: true,
    },
    turn: { type: String, enum: ["X", "O"], default: "X", required: true },
    winnerId: { type: mongoose_1.Schema.Types.ObjectId, default: null },
    isDraw: { type: Boolean, default: false },
    moves: {
        type: [
            new mongoose_1.Schema({
                playerId: { type: mongoose_1.Schema.Types.ObjectId, required: true },
                symbol: { type: String, enum: ["X", "O"], required: true },
                index: { type: Number, min: 0, max: 8, required: true },
                playedAt: { type: Date, required: true },
            }, { _id: false }),
        ],
        default: [],
    },
}, { timestamps: true, collection: "games" });
GameSchema.index({ "players.userId": 1, status: 1, updatedAt: -1 });
exports.GameModel = mongoose_1.default.models.Game ??
    mongoose_1.default.model("Game", GameSchema);
const PlayerGameLockSchema = new mongoose_1.Schema({
    _id: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    gameId: { type: mongoose_1.Schema.Types.ObjectId, required: true, index: true },
}, { collection: "player_game_locks", versionKey: false });
exports.PlayerGameLockModel = mongoose_1.default.models.PlayerGameLock ||
    mongoose_1.default.model("PlayerGameLock", PlayerGameLockSchema);
//# sourceMappingURL=game.model.js.map