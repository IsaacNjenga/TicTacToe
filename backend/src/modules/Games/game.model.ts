import mongoose, { Document, Schema, Types } from "mongoose";

export type PlayerSymbol = "X" | "O";
export type GameStatus = "waiting" | "active" | "finished" | "cancelled";

export interface GamePlayer {
  userId: Types.ObjectId;
  username: string;
  symbol: PlayerSymbol;
}

export interface GameMove {
  playerId: Types.ObjectId;
  symbol: PlayerSymbol;
  index: number;
  playedAt: Date;
}

export interface GameRecord extends Document {
  code: string;
  status: GameStatus;
  players: GamePlayer[];
  board: (PlayerSymbol | null)[];
  turn: PlayerSymbol;
  winnerId: Types.ObjectId | null;
  isDraw: boolean;
  moves: GameMove[];
  createdAt: Date;
  updatedAt: Date;
}

const GameSchema = new Schema<GameRecord>(
  {
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
          userId: { type: Schema.Types.ObjectId, required: true },
          username: { type: String, required: true },
          symbol: { type: String, enum: ["X", "O"], required: true },
        },
      ],
      validate: {
        validator: (players: GamePlayer[]) => players.length <= 2,
        message: "A game cannot contain more than two players.",
      },
      required: true,
    },
    board: {
      type: [{ type: String, enum: ["X", "O"] }],
      default: () => Array(9).fill(null),
      validate: {
        validator: (board: unknown[]) =>
          board.length === 9 &&
          board.every((square) => square === null || square === "X" || square === "O"),
        message: "A game board must contain exactly nine valid squares.",
      },
      required: true,
    },
    turn: { type: String, enum: ["X", "O"], default: "X", required: true },
    winnerId: { type: Schema.Types.ObjectId, default: null },
    isDraw: { type: Boolean, default: false },
    moves: {
      type: [
        new Schema<GameMove>(
          {
            playerId: { type: Schema.Types.ObjectId, required: true },
            symbol: { type: String, enum: ["X", "O"], required: true },
            index: { type: Number, min: 0, max: 8, required: true },
            playedAt: { type: Date, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true, collection: "games" },
);

GameSchema.index({ "players.userId": 1, status: 1, updatedAt: -1 });

export const GameModel: mongoose.Model<GameRecord> =
  (mongoose.models.Game as mongoose.Model<GameRecord> | undefined) ??
  mongoose.model<GameRecord>("Game", GameSchema);

const PlayerGameLockSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, required: true },
    gameId: { type: Schema.Types.ObjectId, required: true, index: true },
  },
  { collection: "player_game_locks", versionKey: false },
);

export const PlayerGameLockModel =
  mongoose.models.PlayerGameLock ||
  mongoose.model("PlayerGameLock", PlayerGameLockSchema);
