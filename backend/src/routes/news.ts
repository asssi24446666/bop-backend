import { Router } from "express";
import { getUpcomingEconomicEvents, isNewsConfigured } from "@/providers/fmpNews.js";
import type { Instrument } from "@/types/index.js";

export const newsRouter = Router();

newsRouter.get("/status", (_req, res) => {
  res.json({
    status: isNewsConfigured() ? "CONFIGURED" : "DISCONNECTED",
    provider: isNewsConfigured() ? "fmp" : null
  });
});

newsRouter.get("/upcoming", async (req, res) => {
  if (!isNewsConfigured()) {
    return res.status(503).json({ error: "NEWS_DATA_UNAVAILABLE", message: "No news provider configured.", events: [] });
  }
  const instrument = (req.query.instrument as Instrument | "ALL") || "ALL";
  const withinMs = req.query.withinMs ? Number(req.query.withinMs) : 24 * 60 * 60 * 1000;
  const events = await getUpcomingEconomicEvents(instrument, withinMs);
  res.json({ events });
});
