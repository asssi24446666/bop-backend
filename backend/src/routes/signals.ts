import { Router } from "express";
import { getSupabase } from "@/lib/supabase";

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

signalsRouter.post("/", async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: "SUPABASE_NOT_CONFIGURED" });
  }
  const { data, error } = await supabase.from("signals").insert(req.body).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ signal: data });
});
