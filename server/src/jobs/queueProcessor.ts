import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis";
import { prisma } from "../lib/db";
import { getTranscript } from "../external/transcriptService";
import { extractProducts } from "../external/geminiService";

/**
 * Helper – set the status of a QueueItem.
 */
async function setStatus(
  id: string,
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
) {
  await prisma.queueItem.update({
    where: { id },
    data: { status },
  });
}

/**
 * Core worker – runs the heavy‑lifting pipeline.
 */
async function processJob(job: Job) {
  const { queueItemId } = job.data as { queueItemId: string };

  // Load the QueueItem (includes deviceId + the original TikTok URL)
  const queueItem = await prisma.queueItem.findUniqueOrThrow({
    where: { id: queueItemId },
    include: { device: true },
  });

  await setStatus(queueItem.id, "PROCESSING");

  try {
    // 1️⃣ Transcript
    const transcript = await getTranscript(queueItem.url);

    // 2️⃣ Gemini – returns an array of structured categories/products
    const geminiCategories = await extractProducts(
      transcript,
      queueItem.deviceId
    );

    // 3️⃣ Persist everything in a single transaction
    await prisma.$transaction(async (tx) => {
      for (const cat of geminiCategories) {
        // Upsert the category (device scoped)
        const category = await tx.category.upsert({
          where: {
            deviceId_name: {
              deviceId: queueItem.deviceId,
              name: cat.name,
            },
          },
          create: {
            deviceId: queueItem.deviceId,
            name: cat.name,
            description: cat.description ?? null,
          },
          update: {}, // keep existing row
        });
        // Insert each product for the category
        for (const prod of cat.products) {
          await tx.product.upsert({
            where: {
              // Use a deterministic ID if you have one, otherwise fallback to a UUID
              id: prod.id ?? `${category.id}-${prod.name}`,
            },
            create: {
              id: prod.id ?? `${category.id}-${prod.name}`,
              categoryId: category.id,
              name: prod.name,
              tiktokUrl: queueItem.url,
              description: prod.description ?? null,
              mentionedContent: prod.mentioned_context ?? null,
            },
            update: {}, // keep the first version we got
          });
        }
      }
    });

    // 4️⃣ Mark as COMPLETED
    console.log("COMPLETED");
    await setStatus(queueItem.id, "COMPLETED");
  } catch (e) {
    console.error(`❌ Job ${job.id} failed:`, e);
    await setStatus(queueItem.id, "FAILED");
    // re‑throw so BullMQ records the failure (useful for retries)
    throw e;
  }
}

/**
 * Call this from `src/server.ts` – it starts a Worker listening on the
 * "tiktok-extract" queue.
 */
export function startQueueProcessor() {
  const worker = new Worker("tiktok-extract", processJob, {
    connection: redisConnection,
    // OPTIONAL: automatic retries (you can also configure per‑job)
    // attempts: 3,
    // backoff: { type: "exponential", delay: 5_000 },
    concurrency: 3,
  });

  worker.on("error", (err) => {
    console.error("🚨 BullMQ worker error:", err);
  });

  worker.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.warn(`⚠️ Job ${job?.id ?? "unknown"} failed:`, err);
  });
}
