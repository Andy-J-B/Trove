import { useCallback } from "react";
import axios from "axios";
import { ping } from "../util/api";
import { SERVER_URL } from "../util/config";
import { drain } from "@/src/queue";

/**
 * The `useQueueProcessor` hook is responsible for syncing queued TikTok URLs
 * to the backend once connectivity is available.
 */
export function useQueueProcessor() {
  /**
   * Processes the local queue:
   * - Pings the server to ensure it's reachable
   * - Drains queued URLs
   * - Posts each URL to the backend `/extract/` endpoint
   */
  const processQueue = useCallback(async (): Promise<void> => {
    const ok: boolean = await ping();
    if (!ok) return;

    // drain() should return an array of URLs (string[])
    const urls: string[] = await drain();

    for (const url of urls) {
      try {
        await axios.post(`${SERVER_URL}/extract/`, { tiktokUrl: url });
      } catch {
        // stop on first failure (e.g., offline or server down)
        break;
      }
    }
  }, []);

  return { processQueue };
}
