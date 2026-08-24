// Backend's own copy of the shared shape definitions it needs.
// Deliberately NOT imported from the frontend package — the backend
// must build and run standalone on Railway with zero reach-out
// outside its own folder. If a field changes, update both this file
// and frontend/src/types/index.ts.

export type Instrument =
  | "XAUUSD" | "EURUSD" | "GBPUSD" | "USDJPY" | "USDCHF"
  | "AUDUSD" | "USDCAD" | "BTCUSD" | "ETHUSD"
  | "NAS100" | "US30" | "SPX500" | "WTIUSD";

export type Timeframe = "1M" | "5M" | "15M" | "1H" | "4H" | "1D" | "1W";

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface Quote {
  instrument: Instrument;
  bid: number;
  ask: number;
  last: number;
  timestamp: number;
}

export type ConnectionStatus = "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR";

export interface ConnectionState {
  status: ConnectionStatus;
  provider: string | null;
  lastUpdate: number | null;
  errorMessage?: string;
}
