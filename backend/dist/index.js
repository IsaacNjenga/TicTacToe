"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_http_1 = require("node:http");
const db_1 = require("./config/db");
require("./config/redis");
const env_1 = require("./config/env");
const app_1 = __importDefault(require("./app"));
const ws_1 = require("./ws/ws");
const PORT = parseInt(env_1.env.PORT) || 3001;
async function startServer() {
    await (0, db_1.connectToDB)();
    app_1.default.get("/", (req, res) => {
        res.send({ message: "TicTacToe backend is running!" });
    });
    const server = (0, node_http_1.createServer)(app_1.default);
    (0, ws_1.attachGameWebSocket)(server);
    server.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running at PORT: ${PORT}`);
    });
}
startServer();
//# sourceMappingURL=index.js.map