"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboard = exports.getGameHistory = void 0;
const mongoose_1 = require("mongoose");
const catchAsync_1 = require("../../common/utils/catchAsync");
const game_model_1 = require("./game.model");
exports.getGameHistory = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const userId = new mongoose_1.Types.ObjectId(req.user._id.toString());
    const [result] = await game_model_1.GameModel.aggregate([
        {
            $match: {
                status: "finished",
                "players.userId": userId,
            },
        },
        {
            $facet: {
                summary: [
                    {
                        $group: {
                            _id: null,
                            played: { $sum: 1 },
                            wins: {
                                $sum: { $cond: [{ $eq: ["$winnerId", userId] }, 1, 0] },
                            },
                            losses: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $ne: ["$winnerId", userId] },
                                                { $eq: ["$isDraw", false] },
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            draws: { $sum: { $cond: ["$isDraw", 1, 0] } },
                        },
                    },
                    { $project: { _id: 0, played: 1, wins: 1, losses: 1, draws: 1 } },
                ],
                recent: [
                    { $sort: { updatedAt: -1 } },
                    { $limit: 50 },
                    {
                        $project: {
                            _id: 1,
                            code: 1,
                            players: 1,
                            winnerId: 1,
                            isDraw: 1,
                            moveCount: { $size: { $ifNull: ["$moves", []] } },
                            createdAt: 1,
                            updatedAt: 1,
                        },
                    },
                ],
                rivals: [
                    {
                        $project: {
                            winnerId: 1,
                            isDraw: 1,
                            rival: {
                                $arrayElemAt: [
                                    {
                                        $filter: {
                                            input: "$players",
                                            as: "player",
                                            cond: { $ne: ["$$player.userId", userId] },
                                        },
                                    },
                                    0,
                                ],
                            },
                        },
                    },
                    { $match: { "rival.userId": { $exists: true } } },
                    {
                        $group: {
                            _id: "$rival.userId",
                            username: { $first: "$rival.username" },
                            played: { $sum: 1 },
                            wins: {
                                $sum: { $cond: [{ $eq: ["$winnerId", userId] }, 1, 0] },
                            },
                            losses: {
                                $sum: {
                                    $cond: [
                                        {
                                            $and: [
                                                { $ne: ["$winnerId", userId] },
                                                { $eq: ["$isDraw", false] },
                                            ],
                                        },
                                        1,
                                        0,
                                    ],
                                },
                            },
                            draws: { $sum: { $cond: ["$isDraw", 1, 0] } },
                        },
                    },
                    { $sort: { played: -1, wins: -1, username: 1 } },
                    { $limit: 20 },
                    {
                        $project: {
                            _id: 0,
                            userId: "$_id",
                            username: 1,
                            played: 1,
                            wins: 1,
                            losses: 1,
                            draws: 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                summary: {
                    $ifNull: [
                        { $arrayElemAt: ["$summary", 0] },
                        { played: 0, wins: 0, losses: 0, draws: 0 },
                    ],
                },
                recent: 1,
                rivals: 1,
            },
        },
    ]);
    res.status(200).json({
        success: true,
        data: {
            userId: userId.toString(),
            ...(result ?? {
                summary: { played: 0, wins: 0, losses: 0, draws: 0 },
                recent: [],
                rivals: [],
            }),
        },
    });
});
exports.getLeaderboard = (0, catchAsync_1.catchAsync)(async (_req, res) => {
    const standings = await game_model_1.GameModel.aggregate([
        { $match: { status: "finished" } },
        { $unwind: "$players" },
        {
            $group: {
                _id: "$players.userId",
                username: { $first: "$players.username" },
                played: { $sum: 1 },
                wins: {
                    $sum: { $cond: [{ $eq: ["$winnerId", "$players.userId"] }, 1, 0] },
                },
                draws: { $sum: { $cond: ["$isDraw", 1, 0] } },
                losses: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: ["$winnerId", null] },
                                    { $ne: ["$winnerId", "$players.userId"] },
                                ],
                            },
                            1,
                            0,
                        ],
                    },
                },
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "profile",
            },
        },
        { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                userId: { $toString: "$_id" },
                username: { $ifNull: ["$profile.username", "$username"] },
                countryCode: { $ifNull: ["$profile.countryCode", null] },
                played: 1,
                wins: 1,
                draws: 1,
                losses: 1,
            },
        },
        { $sort: { wins: -1, draws: -1, losses: 1, username: 1 } },
    ]);
    res.status(200).json({ success: true, data: standings });
});
//# sourceMappingURL=game.controller.js.map