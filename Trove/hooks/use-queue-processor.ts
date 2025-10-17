import { useCallback } from "react";
import { ping } from "../util/api";
import { flushQueue } from "@/src/queue";

/**
 * The `useQueueProcessor` hook syncs queued TikTok URLs to the backend
 * once connectivity is available.
 */
export function useQueueProcessor() {
  /**
   * Processes the local queue:
   * - Pings the server to ensure it's reachable
   * - Calls `flushQueue()` which:
   *    → Sends all queued items to backend
   *    → Clears the local queue on success
   */
  const processQueue = useCallback(async (): Promise<void> => {
    const ok = await ping();
    if (!ok) return;

    await flushQueue(); // handles sending + clearing internally
  }, []);

  return { processQueue };
}
