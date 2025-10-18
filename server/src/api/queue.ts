import { Router } from "express";
import { prisma } from "../lib/db";
import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis";

const router = Router();

// BullMQ queue that the worker will listen to
export const urlQueue = new Queue("tiktok-extract", {
  connection: redisConnection,

  // ────── AUTO‑CLEANUP ──────
  defaultJobOptions: {
    // Delete the job after a successful run
    removeOnComplete: true,

    // Delete the job after a failure (set to false if you want to inspect failures)
    removeOnFail: true,

    // You can also use a TTL instead of immediate deletion, e.g.:
    // removeOnComplete: { age: 3600 },   // keep for 1 hour
    // removeOnFail:    { age: 86400 },  // keep for 24 hours
  },
});

/**
 * POST /queue
 * Body: { url: string, deviceId: string }
 */
router.post("/", async (req: any, res: any) => {
  const { url, deviceId } = req.body as {
    url: string;
    deviceId: string;
  };

  if (!url || !deviceId) {
    return res
      .status(400)
      .json({ error: "Both url and deviceId are required." });
  }

  try {
    // 1️⃣  Ensure the device exists (idempotent upsert)
    await prisma.device.upsert({
      where: { id: deviceId },
      create: { id: deviceId },
      update: {}, // nothing to update
    });

    // 2️⃣  Insert a QueueItem row (status = PENDING)
    const queueItem = await prisma.queueItem.create({
      data: {
        deviceId,
        url,
        status: "PENDING",
      },
    });

    // 3️⃣  Enqueue a BullMQ job – we only need the QueueItem id.
    await urlQueue.add("process", {
      queueItemId: queueItem.id,
    });

    console.log("DONE QUEUE");

    return res.status(202).json({ ok: true, queueItemId: queueItem.id });
  } catch (err) {
    console.error("❌ /queue error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
