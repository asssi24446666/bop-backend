import cors from "cors";
import { config } from "@/config/env.js";

// Agar env variables mein domains set hain to wo allow honge, warna fallback par sab origins allow ho jayenge
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Mobile apps, Postman ya browser options requests ke liye
    if (!origin) return callback(null, true);
    
    // Auto-allow all Vercel deployments and local development
    if (
      origin.includes("vercel.app") || 
      origin.includes("localhost") || 
      config.frontendOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    return callback(null, true); // Permissive access for API requests
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
});
