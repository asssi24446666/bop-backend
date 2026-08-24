// TwelveDataProvider — talks to api.twelvedata.com using the key from
// config (never exposed to the frontend). Lives entirely inside
// backend/src — no imports outside this package.

import { config } from "@/config/env.js";
import type { Candle, ConnectionState, Instrument, Quote, Timeframe } from "../types.js";

const SYMBOL_MAP: Record<Instrument, string> = {
  XAUUSD: "XAU/USD",
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
  USDJPY: "USD/JPY",
  USDCHF: "USD/CHF",
  AUDUSD: "AUD/USD",
  USDCAD: "USD/CAD",
  BTCUSD: "BTC/USD",
  ETHUSD: "ETH/USD",
  NAS100: "NDX",
  US30: "DJI",
  SPX500: "SPX",
  WTIUSD: "WTI/USD"
};

const TF_MAP: Record<Timeframe, string> = {
  "1M": "1min", "5M": "5min", "15M": "15min",
  "1H": "1h", "4H": "4h", "1D": "1day", "1W": "1week"
};

let cachedState: ConnectionState = { status: "DISCONNECTED", provider: "twelvedata", lastUpdate: null };

async function request(path: string, params: Record<string, string>): Promise<any> {
  const url = new URL(path, config.marketData.apiUrl);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set("apikey", config.marketData.apiKey);

  const res = await fetch(url.toString());
  const json = await res.json();

  if (json.status === "error" || json.code >= 400) {
    throw new Error(json.message || `Twelve Data error (${json.code ?? res.status})`);
  }
  return json;
}

function parseCandles(data: any): Candle[] {
  if (!data?.values) return [];
  const candles: Candle[] = data.values.map((v: any) => ({
    timestamp: new Date(v.datetime).getTime(),
    open: parseFloat(v.open),
    high: parseFloat(v.high),
    low: parseFloat(v.low),
    close: parseFloat(v.close),
    volume: v.volume ? parseFloat(v.volume) : undefined
  }));
  return candles.reverse(); // Twelve Data returns newest-first; BOP expects oldest-first.
}

export async function checkConnection(): Promise<ConnectionState> {
  if (!config.marketData.isConfigured) {
    cachedState = { status: "DISCONNECTED", provider: null, lastUpdate: null, errorMessage: "MARKET_DATA_API_KEY not set" };
    return cachedState;
  }
  try {
    await request("/quote", { symbol: SYMBOL_MAP.XAUUSD });
    cachedState = { status: "CONNECTED", provider: "twelvedata", lastUpdate: Date.now() };
  } catch (err) {
    cachedState = {
      status: "ERROR",
      provider: "twelvedata",
      lastUpdate: Date.now(),
      errorMessage: err instanceof Error ? err.message : "Twelve Data connection failed"
    };
  }
  return cachedState;
}

export function getCachedConnectionState(): ConnectionState {
  return cachedState;
}

export async function getQuote(instrument: Instrument): Promise<Quote | null> {
  if (!config.marketData.isConfigured) return null;
  try {
    const data = await request("/quote", { symbol: SYMBOL_MAP[instrument] });
    if (!data || data.close === undefined) return null;
    const last = parseFloat(data.close);
    return {
      instrument,
      bid: data.bid ? parseFloat(data.bid) : last,
      ask: data.ask ? parseFloat(data.ask) : last,
      last,
      timestamp: data.timestamp ? data.timestamp * 1000 : Date.now()
    };
  } catch {
    return null;
  }
}

export async function getRecentCandles(instrument: Instrument, timeframe: Timeframe, count: number): Promise<Candle[]> {
  if (!config.marketData.isConfigured) return [];
  try {
    const data = await request("/time_series", {
      symbol: SYMBOL_MAP[instrument],
      interval: TF_MAP[timeframe],
      outputsize: String(Math.min(count, 5000))
    });
    return parseCandles(data);
  } catch {
    return [];
  }
}
