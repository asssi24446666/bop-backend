// Single place that reads process.env. Every other file imports
// config from here instead of touching process.env directly — keeps
// secrets funneled through one auditable spot and fails loudly at
// boot if something required is missing, instead of failing weirdly
// deep inside a route handler later.

import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[BOP backend] Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const config = {
  port: Number(optional("PORT", "4000")),

  // Comma-separated list of allowed frontend origins (Vercel URL(s)).
  frontendOrigins: optional("FRONTEND_URL", "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  supabase: {
    url: optional("SUPABASE_URL"),
    serviceRoleKey: optional("SUPABASE_SERVICE_ROLE_KEY"),
    get isConfigured() {
      return Boolean(this.url && this.serviceRoleKey);
    }
  },

  marketData: {
    provider: optional("MARKET_DATA_PROVIDER"),
    apiKey: optional("MARKET_DATA_API_KEY"),
    apiUrl: optional("MARKET_DATA_API_URL", "https://api.twelvedata.com"),
    get isConfigured() {
      return Boolean(this.apiKey);
    }
  },

  news: {
    apiKey: optional("NEWS_API_KEY"),
    apiUrl: optional("NEWS_API_URL")
  },

  broker: {
    provider: optional("BROKER_PROVIDER"),
    apiKey: optional("BROKER_API_KEY"),
    secret: optional("BROKER_SECRET"),
    accountId: optional("BROKER_ACCOUNT_ID")
  },

  features: {
    paperTradingEnabled: optional("ENABLE_PAPER_TRADING", "true") === "true",
    liveTradingEnabled: optional("ENABLE_LIVE_TRADING", "false") === "true"
  }
};

// Nothing here throws — missing optional integrations (Supabase, news,
// broker) should degrade to "not configured", not crash the server.
// Only call required() for things the process truly cannot run without,
// and there currently are none (PORT has a sane default).
