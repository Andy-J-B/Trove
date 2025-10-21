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

  try {
    // 1️⃣  Ensure the device exists (idempotent upsert)
    await ensureDevice(deviceId);

    // 2️⃣  Insert a QueueItem row (status = PENDING)
    const queueItem = await prisma.queueItem.create({
      data: {
        deviceId,
        url,
        status: "PENDING",
      },
    });

    // 3️⃣  Enqueue a BullMQ job – we only need the QueueItem id.
    const hash = crypto.createHash("sha1").update(url).digest("hex");
    const jobId = `${deviceId}-${hash}`;
    try {
      await urlQueue.add("process", { queueItemId: queueItem.id }, { jobId });
    } catch (e: any) {
      // Bull‑MQ throws JobExistsError (code 0x1) if a job with the same jobId
      // is already present (waiting, delayed, active, or completed with
      // removeOnComplete = false). In that case we simply ignore it.
      if (e?.code === "ERR_JOB_EXISTS") {
        console.warn(`⚠️ Duplicate job ignored – jobId ${jobId}`);
      } else {
        throw e; // re‑throw anything else
      }
    }

    console.log("DONE QUEUE");
    return res.status(202).json({ ok: true, queueItemId: queueItem.id });
  } catch (err: any) {
    // -------------------------------------------------
    // Handle the Prisma unique‑constraint violation (duplicate QueueItem)
    // -------------------------------------------------
    if (err?.code === "P2002") {
      // P2002 = Unique constraint failed (deviceId + url already exists)
      console.warn(
        `⚠️ QueueItem already exists for device ${deviceId}, url ${url}`
      );
      // We still return 202 – the client already knows it “sent” the URL.
      return res.status(202).json({ ok: true, duplicate: true });
    }

    console.error("❌ /queue error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
