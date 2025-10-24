// src/api/queue.ts
import { Router } from "express";
import { prisma } from "../lib/db.js";
import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { ensureDevice } from "../lib/device.js";
import crypto from "crypto";

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

  // Calculate Job ID upfront
  const hash = crypto.createHash("sha1").update(url).digest("hex");
  const jobId = `${deviceId}-${hash}`;

  try {
    // 1️⃣  Ensure the device exists (idempotent upsert)
    await ensureDevice(deviceId);

    // 2️⃣ Check for an existing QueueItem first
    let queueItem = await prisma.queueItem.findUnique({
      where: {
        deviceId_url: { deviceId, url }, // requires @@unique([deviceId, url]) in schema
      },
    });

    if (queueItem) {
      // If the item exists in the DB, it may or may not have been queued.
      // Check BullMQ's status to ensure we don't re-queue completed jobs.
      const bullmqJob = await urlQueue.getJob(jobId);

      if (bullmqJob) {
        // The job is known to both the DB and BullMQ. Do nothing.
        console.warn(
          `[PRODUCER] Duplicate request: QueueItem ${queueItem.id} already exists and BullMQ job ${jobId} is present. Returning 202.`
        );
        return res
          .status(202)
          .json({ ok: true, duplicate: true, queueItemId: queueItem.id });
      }

      // If the item exists in the DB but is NOT in BullMQ, it means the previous attempt failed
      // silently, was cleared, or never added. We should re-queue it.
      console.warn(
        `[PRODUCER] Re-queueing: Existing QueueItem ${queueItem.id} found, but BullMQ job ${jobId} is missing.`
      );
    } else {
      // 3️⃣ Insert a NEW QueueItem row (status = PENDING)
      queueItem = await prisma.queueItem.create({
        data: {
          deviceId,
          url,
          status: "PENDING",
        },
      });
      console.log(`[PRODUCER] Created new QueueItem ID: ${queueItem.id}`);
    }

    // 4️⃣ Enqueue a BullMQ job – Use the ID from the existing or newly created item.
    await urlQueue.add(
      "process",
      { queueItemId: queueItem.id },
      { jobId, attempts: 3 } // Added attempts for resilience
    );

    console.log(`[PRODUCER] Job added to BullMQ: ${jobId}`);
    return res.status(202).json({ ok: true, queueItemId: queueItem.id });
  } catch (err: any) {
    // Catch any errors from ensureDevice, findUnique, create, or urlQueue.add
    console.error(`❌ /queue error processing ${jobId}:`, err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
