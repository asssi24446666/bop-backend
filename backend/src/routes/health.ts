import { Router } from "express";

export const healthRouter = Router();

// Railway (and any uptime monitor) can hit this to confirm the
// process is alive, independent of whether Supabase/market-data are
// configured yet.
healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", service: "bop-backend", timestamp: new Date().toISOString() });
});
