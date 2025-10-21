// src/jobs/queueProcessor.ts
import { Worker, Job } from "bullmq";
import { redisConnection } from "../lib/redis.js";
import { prisma } from "../lib/db.js";
import { getTranscript } from "../external/transcriptService.js";
import { extractProducts } from "../external/geminiService.js";
import { fetchShoppingUrls } from "../external/serpService.js";

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
 * Core worker – transcript → Gemini → (outside‑transaction) SerpAPI → DB.
 */
async function processJob(job: Job) {
  const { queueItemId } = job.data as { queueItemId: string };

  // Load the QueueItem (includes deviceId + original TikTok URL)
  const queueItem = await prisma.queueItem.findUniqueOrThrow({
    where: { id: queueItemId },
    include: { device: true },
  });

  await setStatus(queueItem.id, "PROCESSING");

  try {
    // -------------------------------------------------
    // 1️⃣  Transcript
    // -------------------------------------------------
    const transcript = await getTranscript(queueItem.url);

    // -------------------------------------------------
    // 2️⃣  Gemini → structured categories / products
    // -------------------------------------------------
    const geminiCategories = await extractProducts(
      transcript,
      queueItem.deviceId
    );

    // -------------------------------------------------
    // 3️⃣  First transaction: create/update Category + Product rows
    // -------------------------------------------------
    // We collect every product we just created/updated so we can
    // call SerpAPI for each of them *after* the transaction ends.
    const createdProducts: { id: string; name: string }[] = [];

    await prisma.$transaction(async (tx) => {
      for (const cat of geminiCategories) {
        // ----- Upsert Category (device‑scoped) -----
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
          update: {}, // keep existing
        });

        // ----- Upsert each Product in the Category -----
        for (const prod of cat.products) {
          // Upsert returns the fields we asked for via `select`
          const product = await tx.product.upsert({
            where: {
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
            update: {}, // keep first version
            select: {
              id: true,
              name: true, // we need the name for the SerpAPI call later
            },
          });

          // Remember the newly‑created (or already‑existing) product
          createdProducts.push({ id: product.id, name: product.name });
        }
      }
    });

    // -------------------------------------------------
    // 4️⃣  SECOND phase – fetch shopping URLs **outside** the transaction
    // -------------------------------------------------
    for (const { id: productId, name: productName } of createdProducts) {
      // One API request per product (you can parallelize with Promise.all if you wish)
      const shoppingLinks = await fetchShoppingUrls(productName);

      // Upsert each shopping link – we can use the regular Prisma client now
      for (const shopping_option of shoppingLinks) {
        await prisma.shoppingUrl.upsert({
          where: {
            id: `${productId}-${shopping_option.link}`,
          },
          create: {
            id: `${productId}-${shopping_option.link}`,
            productId,
            url: shopping_option.link,
            // 🛑 FIX: Use conditional spreading for all optional/nullable fields
            // Only include the property if the value is NOT undefined (or NOT null)

            ...(shopping_option.price !== undefined && {
              price: shopping_option.price,
            }),
            ...(shopping_option.source !== undefined && {
              source: shopping_option.source,
            }),
            ...(shopping_option.source_icon !== undefined && {
              sourceIcon: shopping_option.source_icon,
            }),
            // Use the nullish coalescing for the combined thumbnail value
            // and then conditionally spread it to handle `undefined`
            ...((shopping_option.thumbnail ??
              shopping_option.serpapi_thumbnail) !== undefined && {
              thumbnail:
                shopping_option.thumbnail ?? shopping_option.serpapi_thumbnail,
            }),
            ...(shopping_option.delivery !== undefined && {
              delivery: shopping_option.delivery,
            }),
          },
          update: {}, // keep the first version we stored
        });
      }
    }

    // -------------------------------------------------
    // 5️⃣  Mark the queue item as COMPLETED
    // -------------------------------------------------
    await setStatus(queueItem.id, "COMPLETED");
  } catch (e) {
    console.error(`❌ Job ${job.id} failed:`, e);
    await setStatus(queueItem.id, "FAILED");
    // Rethrow so BullMQ can apply its retry/back‑off logic
    throw e;
  }
}

/**
 * Called from src/server.ts – starts the BullMQ worker.
 */
export function startQueueProcessor() {
  const worker = new Worker("tiktok-extract", processJob, {
    connection: redisConnection,
    concurrency: 3,
    // attempts / backoff are optional – you can enable them here
    // attempts: 3,
    // backoff: { type: "exponential", delay: 5_000 },
  });

  worker.on("error", (err) => console.error("🚨 BullMQ worker error:", err));
  worker.on("completed", (job) => console.log(`✅ Job ${job.id} completed`));
  worker.on("failed", (job, err) =>
    console.warn(`⚠️ Job ${job?.id ?? "unknown"} failed:`, err)
  );
}
