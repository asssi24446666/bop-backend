// Backend-side signal monitor. This is what makes notifications work
// even when the app is fully closed: it runs as a background loop
// inside the always-on Railway process, independent of any browser
// tab or the installed app being open. It watches every ACTIVE
// signal in Supabase against live price and sends a push the moment
// SL or TP is hit.

import { getSupabase } from "@/lib/supabase.js";
import { getQuote } from "@/providers/twelveData.js";
import { sendPushToTokens } from "@/lib/push.js";
import type { Instrument } from "@/types/index.js";

const CHECK_INTERVAL_MS = 30000; // 30s — at most 2 quote calls per cycle (XAUUSD + BTCUSD), well under the rate budget

interface SignalRow {
  id: string;
  symbol: Instrument;
  direction: "BUY" | "SELL";
  entry: number;
  stop_loss: number;
  take_profit: number;
  status: string;
}

async function getAllDeviceTokens(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase.from("device_tokens").select("token");
  return (data ?? []).map((r) => r.token);
}

async function checkOnce(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data: activeSignals } = await supabase
    .from("signals")
    .select("id, symbol, direction, entry, stop_loss, take_profit, status")
    .eq("status", "ACTIVE");

  if (!activeSignals || activeSignals.length === 0) return;

  const tokens = await getAllDeviceTokens();

  for (const signal of activeSignals as SignalRow[]) {
    const quote = await getQuote(signal.symbol);
    if (!quote) continue;

    const price = quote.last;
    const hitTP = signal.direction === "BUY" ? price >= signal.take_profit : price <= signal.take_profit;
    const hitSL = signal.direction === "BUY" ? price <= signal.stop_loss : price >= signal.stop_loss;

    if (!hitTP && !hitSL) continue;

    const result = hitTP ? "PROFIT" : "LOSS";
    const exitPrice = hitTP ? signal.take_profit : signal.stop_loss;

    await supabase
      .from("signals")
      .update({ status: result, exit_price: exitPrice, closed_at: new Date().toISOString() })
      .eq("id", signal.id);

    if (tokens.length > 0) {
      await sendPushToTokens(
        tokens,
        hitTP ? 🟢 TP Hit — ${signal.symbol} : 🔴 SL Hit — ${signal.symbol},
        ${signal.direction} ${signal.symbol} closed at ${exitPrice}.,
        { signalId: signal.id, result }
      );
    }
  }
}

export function startBackendSignalMonitor(): void {
  checkOnce();
  setInterval(checkOnce, CHECK_INTERVAL_MS);
}
