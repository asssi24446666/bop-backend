import { Router } from "express";
import { checkConnection, getCachedConnectionState, getQuote, getRecentCandles } from "@/providers/twelveData.js";
import type { Instrument, Timeframe } from "@/types";
import { config } from "@/config/env.js";

export const marketDataRouter = Router();

marketDataRouter.get("/status", async (_req, res) => {
  if (!config.marketData.isConfigured) {
    return res.json({ status: "DISCONNECTED", provider: null, errorMessage: "MARKET_DATA_API_KEY not set" });
  }
  const state = await checkConnection();
  res.json(state);
});

marketDataRouter.get("/quote/:symbol", async (req, res) => {
  if (!config.marketData.isConfigured) {
    return res.status(503).json({ error: "DATA_CONNECTION_REQUIRED", message: "No market data provider configured." });
  }
  const quote = await getQuote(req.params.symbol as Instrument);
  if (!quote) {
    return res.status(502).json({ error: "PROVIDER_ERROR", message: "Provider reachable but returned no data for this symbol." });
  }
  res.json(quote);
});

marketDataRouter.get("/candles/:symbol", async (req, res) => {
  if (!config.marketData.isConfigured) {
    return res.status(503).json({ error: "DATA_CONNECTION_REQUIRED", message: "No market data provider configured." });
  }
  const timeframe = (req.query.timeframe as Timeframe) || "15M";
  const count = req.query.count ? Number(req.query.count) : 200;
  const candles = await getRecentCandles(req.params.symbol as Instrument, timeframe, count);
  res.json({ candles });
});

// Exposed mainly for debugging from the browser/Railway logs.
marketDataRouter.get("/_debug/last-state", (_req, res) => {
  res.json(getCachedConnectionState());
});
