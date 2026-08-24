import { Router } from "express";
import { config } from "@/config/env.js";
import { getCachedConnectionState } from "@/providers/twelveData.js";

export const systemRouter = Router();

systemRouter.get("/status", (_req, res) => {
  res.json({
    marketData: config.marketData.isConfigured ? getCachedConnectionState().status : "DISCONNECTED",
    news: config.news.apiKey ? "CONFIGURED" : "DISCONNECTED",
    broker: config.broker.apiKey ? "CONFIGURED" : "DISCONNECTED",
    supabase: config.supabase.isConfigured ? "CONFIGURED" : "NOT_CONFIGURED",
    bopEngine: "ACTIVE",
    riskEngine: "ACTIVE",
    tradingMode: config.features.liveTradingEnabled ? "LIVE_TRADING" : config.features.paperTradingEnabled ? "PAPER" : "LIVE_ANALYSIS"
  });
});
