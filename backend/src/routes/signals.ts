import { Router } from "express";
import { getSupabase } from "@/lib/supabase.js";
import { sendPushToTokens } from "@/lib/push.js";

export const signalsRouter = Router();

signalsRouter.get("/", async (_req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: "SUPABASE_NOT_CONFIGURED", signals: [] });
  }
  const { data, error } = await supabase
    .from("signals")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ signals: data ?? [] });
});

// The frontend calls this every time it saves a signal (Home,
// Markets, or the client-side lifecycle monitor). Expected body
// shape (snake_case, matching the signals table):
//   { id, symbol, direction, decision, entry, stop_loss, take_profit,
//     rr, bop_score, status, reason, strategy_version, exit_price? }
signalsRouter.post("/", async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: "SUPABASE_NOT_CONFIGURED" });
  }

  const incoming = req.body;

  // Detect a fresh transition into ACTIVE so we notify exactly once,
  // not on every repeat save with the same status.
  const { data: existing } = await supabase
    .from("signals")
    .select("status")
    .eq("id", incoming.id)
    .maybeSingle();

  const becameActive = incoming.status === "ACTIVE" && existing?.status !== "ACTIVE";

  const { data, error } = await supabase
    .from("signals")
    .upsert(incoming)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  if (becameActive) {
    const { data: tokenRows } = await supabase.from("device_tokens").select("token");
    const tokens = (tokenRows ?? []).map((r) => r.token);
    if (tokens.length > 0) {
      await sendPushToTokens(
        tokens,
        ⚡ New Signal — ${incoming.symbol},
        ${incoming.direction} ${incoming.symbol} @ ${incoming.entry} · BOP Score ${incoming.bop_score}/100,
        { signalId: String(incoming.id) }
      );
    }
  }

  res.status(201).json({ signal: data });
});
