// Firebase Cloud Messaging — server-side only. Sends push
// notifications to registered devices. The service account
// credentials come from FIREBASE_SERVICE_ACCOUNT (the whole
// downloaded JSON, stringified) in Railway's env vars — never
// committed to the repo.

import admin from "firebase-admin";
import { config } from "@/config/env.js";

let app: admin.app.App | null = null;

function getApp(): admin.app.App | null {
  if (!config.firebase.isConfigured) return null;
  if (app) return app;
  try {
    const serviceAccount = JSON.parse(config.firebase.serviceAccountJson);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    return app;
  } catch {
    return null;
  }
}

export function isPushConfigured(): boolean {
  return getApp() !== null;
}

export async function sendPushToTokens(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ successCount: number; failureCount: number }> {
  const fb = getApp();
  if (!fb || tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
    data,
    android: {
      priority: "high",
      notification: {
        sound: "default",
        channelId: "bop_signals",
        priority: "max",
        visibility: "public"
      }
    }
  };

  try {
    const res = await admin.messaging().sendEachForMulticast(message);
    return { successCount: res.successCount, failureCount: res.failureCount };
  } catch {
    return { successCount: 0, failureCount: tokens.length };
  }
}
