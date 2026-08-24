import { Router } from "express";
import { getSupabase } from "@/lib/supabase";

export const settingsRouter = Router();

settingsRouter.get("/:accountId", async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: "SUPABASE_NOT_CONFIGURED" });
  }
  const { data, error } = await supabase
    .from("settings")
    .select("settings_json")
    .eq("account_id", req.params.accountId)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "NOT_FOUND", message: "No settings saved yet for this account." });
  res.json(data.settings_json);
});

settingsRouter.put("/:accountId", async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    return res.status(503).json({ error: "SUPABASE_NOT_CONFIGURED" });
  }
  const { error } = await supabase
    .from("settings")
    .upsert({ account_id: req.params.accountId, settings_json: req.body, updated_at: new Date().toISOString() });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ saved: true });
});
