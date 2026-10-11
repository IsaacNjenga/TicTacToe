"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invalidateLogCache = exports.fetchLogs = exports.createLog = void 0;
const logs_model_1 = require("./logs.model");
const BadRequestError_1 = require("../../common/errors/BadRequestError");
const node_cache_1 = __importDefault(require("node-cache"));
const logCache = new node_cache_1.default({ stdTTL: 300 });
const createLog = async (input) => {
    if (!input) {
        throw new BadRequestError_1.BadRequestError("Input data is required");
    }
    const logEntry = new logs_model_1.LogModel(input);
    await logEntry.save();
    (0, exports.invalidateLogCache)();
    return logEntry;
};
exports.createLog = createLog;
const fetchLogs = async (req) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 25));
    const skip = (page - 1) * limit;
    const cacheKey = `logs_page_${page}_limit_${limit}`;
    const cachedData = logCache.get(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const [logs, totalLogs] = (await Promise.all([
        logs_model_1.LogModel.find().skip(skip).limit(limit).lean().sort({ createdAt: -1 }),
        logs_model_1.LogModel.countDocuments(),
    ]));
    const responseData = {
        logs: logs,
        totalLogs: totalLogs,
        currentPage: page,
        totalPages: Math.ceil(totalLogs / limit),
    };
    //cache response
    logCache.set(cacheKey, responseData);
    return responseData;
};
exports.fetchLogs = fetchLogs;
//invalidation when a log is created/updated/deleted
const invalidateLogCache = () => {
    logCache.flushAll();
};
exports.invalidateLogCache = invalidateLogCache;
//# sourceMappingURL=logs.service.js.map