// BOP backend — Node.js + TypeScript + Express, deployed on Railway.
// Pure Express server: no framework magic, no cross-package imports.
// Every route degrades gracefully (503 + a clear error code) when an
// integration (Supabase, market-data provider, broker) isn't
// configured yet — it never fabricates data instead.

import express from "express";
import { config } from "@/config/env.js";
import { corsMiddleware } from "@/lib/cors.js";
import { healthRouter } from "@/routes/health.js";
import { marketDataRouter } from "@/routes/marketData.js";
import { newsRouter } from "@/routes/news.js";
import { signalsRouter } from "@/routes/signals.js";
import { settingsRouter } from "@/routes/settings.js";
import { systemRouter } from "@/routes/system.js";

const app = express();

app.use(corsMiddleware);
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/market-data", marketDataRouter);
app.use("/api/news", newsRouter);
app.use("/api/signals", signalsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/system", systemRouter);

app.listen(config.port, () => {
  console.log(`BOP backend listening on :${config.port}`);
  console.log(`Market data provider configured: ${config.marketData.isConfigured}`);
  console.log(`News provider configured: ${Boolean(config.news.apiKey)}`);
  console.log(`Supabase configured: ${config.supabase.isConfigured}`);
  console.log(`Allowed frontend origins: ${config.frontendOrigins.length ? config.frontendOrigins.join(", ") : "(none set — allowing all for now)"}`);
});
