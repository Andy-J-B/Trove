// src/api/health.ts
import { Router } from "express";
import type { Request, Response } from "express";

// src/api/health.ts  (or create a dedicated status file)

import { urlQueue } from "./queue.js";

const router = Router();

router.get("/queue-status", async (req, res) => {
  try {
    const [waiting, active, delayed, paused, completed, failed, jobCounts] =
      await Promise.all([
        urlQueue.getWaitingCount(),
        urlQueue.getActiveCount(),
        urlQueue.getDelayedCount(),
        urlQueue.isPaused(),
        urlQueue.getCompletedCount(),
        urlQueue.getFailedCount(),
        urlQueue.getJobCounts(), // returns an object with all counts
      ]);

    res.json({
      waiting,
      active,
      delayed,
      paused,
      completed,
      failed,
      // the generic object also contains the same numbers plus "repeatable" etc.
      jobCounts,
    });
  } catch (e) {
    console.error("❌ Queue status error:", e);
    res.status(500).json({ error: "Could not fetch queue status" });
  }
});

router.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "OK",
    message: "Trove backend is alive",
    timestamp: new Date().toISOString(),
  });
});

export default router;
