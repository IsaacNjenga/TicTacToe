import express from "express";
import cors from "cors";

import { appRouter } from "./routes/routes";
import { env } from "./config/env";

const app = express();

const normalizeOrigin = (origin: string) => origin.trim().replace(/\/$/, "");
const allowedOrigins = [
  "http://localhost:5173",
  ...env.FRONTEND_URL.split(","),
  ...env.WEBSITE_URL.split(","),
]
  .map(normalizeOrigin)
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use("/api", appRouter);

export default app;

