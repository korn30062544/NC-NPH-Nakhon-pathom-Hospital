// Local development server only.
//
// In production this app deploys to Vercel as static frontend (Vite build)
// + serverless functions under /api/**. Vercel does NOT run this file.
// This file exists purely so `npm run dev` gives a full-stack experience
// (frontend + working /api/* routes) on your own machine, using the exact
// same handler functions that back the real Vercel functions in /api.
//
// FIX: the original version of this file imported a file that did not
// exist in the project ("./api/gemini"), which crashed the server on
// startup and broke every API route, not just the AI ones. That import
// has been replaced with the shared handlers in api/_lib/handlers.ts.
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  healthHandler,
  fetchCsvHandler,
  chatHandler,
  analyzeDataHandler,
  classifyIncidentsHandler,
  generateHandler,
  geminiPassthroughHandler,
} from "./api/_lib/handlers";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ==========================================
// API Routes (mirrors /api/** serverless functions)
// ==========================================
app.get("/api/health", healthHandler);
app.post("/api/sheets/fetch-csv", fetchCsvHandler);
app.post("/api/ai/chat", chatHandler);
app.post("/api/ai/analyze-data", analyzeDataHandler);
app.post("/api/ai/classify-incidents", classifyIncidentsHandler);
app.post("/api/generate", generateHandler);
app.all("/api/gemini", geminiPassthroughHandler);

// Vite Middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Nakhon Pathom Hospital Risk Dashboard running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Gemini configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
  });
}

startServer();
