import cors from "cors";
import { config } from "@/config/env";

/**
 * Allows only the configured FRONTEND_URL(s) (your Vercel domain,
 * plus any preview-deployment domains you add to the comma-separated
 * env var). Requests with no Origin header (curl, server-to-server,
 * Railway health checks) are allowed through since they aren't
 * browser CORS requests at all.
 *
 * If FRONTEND_URL isn't set yet (e.g. first deploy before you've
 * pointed Vercel at this backend), this falls back to allowing any
 * origin so you aren't locked out while wiring things up — tighten
 * this once FRONTEND_URL is set.
 */
export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (config.frontendOrigins.length === 0) return callback(null, true);
    if (config.frontendOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
});
