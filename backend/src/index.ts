import { createServer } from "node:http";
import { connectToDB } from "./config/db";
import "./config/redis";
import { env } from "./config/env";
import app from "./app";
import { attachGameWebSocket } from "./ws/ws";

const PORT = parseInt(env.PORT) || 3001;

async function startServer() {
  await connectToDB();
  app.get("/", (req, res) => {
    res.send({ message: "TicTacToe backend is running!" });
  });

  const server = createServer(app);
  attachGameWebSocket(server);
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at PORT: ${PORT}`);
  });
}

startServer();
