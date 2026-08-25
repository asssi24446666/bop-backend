// FMP (Financial Modeling Prep) economic calendar integration —
// covers CPI, NFP, FOMC, rate decisions, GDP, PMI, and other
// scheduled macro events. Free tier: 250 requests/day. Same honesty
// rule as market data: never invent an event; if the provider errors
// or the key isn't set, callers get an empty result and the frontend
// shows "NEWS DATA UNAVAILABLE".
//
// Note: FMP occasionally moves specific endpoints between free and
// paid tiers. If your key gets a 402/403 here, the economic-calendar
// endpoint has moved to a paid plan for your account — this code
// still degrades gracefully (empty result) rather than erroring the
// whole app.

import { config } from "@/config/env.js";
import type { Instrument, NewsEvent, NewsImpact } from "@/types/index.js";

const BASE_URL = "https://financialmodelingprep.com/stable/economic-calendar";

// FMP reports country codes, not currency pairs — map the handful we
// care about to the currencies that make up our enabled instruments.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", EU: "EUR", GB: "GBP", JP: "JPY", CH: "CHF",
  AU: "AUD", CA: "CAD", CN: "CNY"
};

function currenciesForInstrument(instrument: Instrument | "ALL"): string[] | null {
  if (instrument === "ALL") return null;
  const map: Partial<Record<Instrument, string[]>> = {
    XAUUSD: ["USD"], EURUSD: ["EUR", "USD"], GBPUSD: ["GBP", "USD"],
    USDJPY: ["USD", "JPY"], USDCHF: ["USD", "CHF"], AUDUSD: ["AUD", "USD"],
    USDCAD: ["USD", "CAD"], BTCUSD: ["USD"], ETHUSD: ["USD"],
    NAS100: ["USD"], US30: ["USD"], SPX500: ["USD"], WTIUSD: ["USD"]
  };
  return map[instrument] ?? ["USD"];
}

function mapImpact(fmpImpact: string | undefined): NewsImpact {
  const normalized = (fmpImpact ?? "").toLowerCase();
  if (normalized === "high") return "HIGH";
  if (normalized === "medium") return "MEDIUM";
  return "LOW";
}

export function isNewsConfigured(): boolean {
  return Boolean(config.news.apiKey);
}

export async function getUpcomingEconomicEvents(
  instrument: Instrument | "ALL",
  withinMs: number
): Promise<NewsEvent[]> {
  if (!isNewsConfigured()) return [];

  const now = new Date();
  const to = new Date(now.getTime() + withinMs);
  const from = now.toISOString().slice(0, 10);
  const toDate = to.toISOString().slice(0, 10);

  const url = new URL(BASE_URL);
  url.searchParams.set("from", from);
  url.searchParams.set("to", toDate);
  url.searchParams.set("apikey", config.news.apiKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const wantedCurrencies = currenciesForInstrument(instrument);

    return data
      .filter((row: any) => {
        const currency = row.currency ?? COUNTRY_TO_CURRENCY[row.country] ?? row.country;
        if (!wantedCurrencies) return true;
        return wantedCurrencies.includes(currency);
      })
      .map((row: any): NewsEvent => ({
        id: `fmp-${row.event ?? "event"}-${row.date}`,
        title: row.event ?? "Economic event",
        instrument: instrument === "ALL" ? "ALL" : instrument,
        impact: mapImpact(row.impact),
        timestamp: new Date(row.date).getTime()
      }))
      .filter((e) => !Number.isNaN(e.timestamp));
  } catch {
    return [];
  }
}
