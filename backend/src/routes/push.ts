import { Router } from "express";
import { getSupabase } from "@/lib/supabase.js";
import { isPushConfigured, sendPushToTokens } from "@/lib/push.js";

export const pushRouter = Router();

pushRouter.get("/status", (_req, res) => {
  res.json({ status: isPushConfigured() ? "CONFIGURED" : "DISCONNECTED" });
});

// Called once by the app (on launch / after permission granted) to
// register this device's FCM token so the backend can reach it.
pushRouter.post("/register", async (req, res) => {
  const { token, platform } = req.body as { token?: string; platform?: string };
  if (!token) return res.status(400).json({ error: "token is required" });

  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: "SUPABASE_NOT_CONFIGURED" });

  const { error } = await supabase
    .from("device_tokens")
    .upsert({ token, platform: platform ?? "android", last_seen_at: new Date().toISOString() });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ registered: true });
});

// Manual test endpoint — hit this once from a browser to confirm a
// real notification arrives on the phone before wiring it into the
// signal monitor.
pushRouter.post("/test", async (_req, res) => {
  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: "SUPABASE_NOT_CONFIGURED" });

  const { data, error } = await supabase.from("device_tokens").select("token");
  if (error) return res.status(500).json({ error: error.message });

  const tokens = (data ?? []).map((r) => r.token);
  const result = await sendPushToTokens(tokens, "BOP Test", "If you see this, push notifications are working.");
  res.json({ tokensFound: tokens.length, ...result });
});
