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

function formatString(toFormat: string) {
  return toFormat.trim().toLowerCase();
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

  console.log(
    `[JOB ${queueItem.id}] Starting processing for URL: ${queueItem.url}`
  ); // 💡 LOG

  try {
    // -------------------------------------------------
    // 1️⃣  Transcript
    // -------------------------------------------------
    const transcript = await getTranscript(queueItem.url);
    console.log(
      `[JOB ${queueItem.id}] Transcript fetched (length: ${transcript.length})`
    ); // 💡 LOG

    // -------------------------------------------------
    // 2️⃣  Gemini → structured categories / products
    // -------------------------------------------------
    const geminiCategories = await extractProducts(
      transcript,
      queueItem.deviceId
    );
    console.log(
      `[JOB ${queueItem.id}] Gemini extracted ${geminiCategories.length} categories.`
    ); // 💡 LOG

    // -------------------------------------------------
    // 3️⃣  First transaction: create/update Category + Product rows
    // -------------------------------------------------
    const createdProducts: { id: string; name: string }[] = [];

    await prisma.$transaction(async (tx) => {
      console.log(`[JOB ${queueItem.id}] Starting database transaction...`); // 💡 LOG

      for (const cat of geminiCategories) {
        const formattedCatName = formatString(cat.name);
        console.log(
          `[JOB ${queueItem.id}] Processing Category: ${cat.name} (${formattedCatName})`
        ); // 💡 LOG

        // ----- Upsert Category (device-scoped) -----
        const category = await tx.category.upsert({
          where: {
            deviceId_name: {
              deviceId: queueItem.deviceId,
              name: formattedCatName,
            },
          },
          create: {
            deviceId: queueItem.deviceId,
            name: formattedCatName,
            description: cat.description ?? null,
            productCount: 0,
          },
          update: {}, // keep existing
        });
        console.log(
          `[JOB ${queueItem.id}] Category upserted. ID: ${category.id}`
        ); // 💡 LOG

        let productsCreatedInThisCategory = 0;

        // ----- Upsert each Product in the Category -----
        for (const prod of cat.products) {
          const productIdToUse = prod.id ?? `${category.id}-${prod.name}`;

          // Attempt to find the product first
          const existingProduct = await tx.product.findUnique({
            where: { id: productIdToUse },
          });

          // Upsert the product
          const product = await tx.product.upsert({
            where: {
              id: productIdToUse,
            },
            create: {
              id: productIdToUse,
              categoryId: category.id,
              name: prod.name,
              tiktokUrl: queueItem.url,
              description: prod.description ?? null,
              mentionedContent: prod.mentioned_context ?? null,
            },
            update: {}, // keep first version
            select: {
              id: true,
              name: true,
            },
          });

          // Check if this was a brand-new creation (i.e., no existing product found)
          if (!existingProduct) {
            productsCreatedInThisCategory++;
            console.log(
              `[JOB ${queueItem.id}] NEW Product created: ${product.name} (ID: ${product.id}). New count for category: ${productsCreatedInThisCategory}`
            ); // 💡 LOG
          } else {
            console.log(
              `[JOB ${queueItem.id}] EXISTING Product found/updated: ${product.name} (ID: ${product.id}). Count NOT incremented.`
            ); // 💡 LOG
          }

          createdProducts.push({ id: product.id, name: product.name });
        }

        // Check for product count update
        if (productsCreatedInThisCategory > 0) {
          console.log(
            `[JOB ${queueItem.id}] Incrementing productCount for Category ${category.id} by ${productsCreatedInThisCategory}`
          ); // 💡 LOG
          await tx.category.update({
            where: { id: category.id },
            data: {
              productCount: {
                increment: productsCreatedInThisCategory,
              },
            },
          });
          console.log(
            `[JOB ${queueItem.id}] productCount incremented successfully.`
          ); // 💡 LOG
        } else {
          console.log(
            `[JOB ${queueItem.id}] productsCreatedInThisCategory is 0 for Category ${category.id}. productCount NOT incremented.`
          ); // 💡 LOG
        }
      }
      console.log(
        `[JOB ${queueItem.id}] Transaction complete. Total unique products for SerpAPI: ${createdProducts.length}`
      ); // 💡 LOG
    });

    // ... rest of the function (SerpAPI, ShoppingUrl upsert, setStatus COMPLETED) remains the same
    // ... The SerpAPI part is not directly related to the productCount issue, but keep it for completeness.

    // -------------------------------------------------
    // 4️⃣  SECOND phase – fetch shopping URLs **outside** the transaction
    // -------------------------------------------------
    for (const { id: productId, name: productName } of createdProducts) {
      console.log(
        `[JOB ${queueItem.id}] Fetching shopping URLs for product: ${productName} (ID: ${productId})`
      ); // 💡 LOG
      // One API request per product (you can parallelize with Promise.all if you wish)
      const shoppingLinks = await fetchShoppingUrls(productName);
      console.log(
        `[JOB ${queueItem.id}] Found ${shoppingLinks.length} shopping links for ${productName}.`
      ); // 💡 LOG

      // Upsert each shopping link – we can use the regular Prisma client now
      for (const shopping_option of shoppingLinks) {
        const shoppingUrlId = `${productId}-${shopping_option.link}`;
        await prisma.shoppingUrl.upsert({
          where: { id: shoppingUrlId },
          create: {
            id: shoppingUrlId,
            productId,
            url: shopping_option.link,
            ...(shopping_option.price !== undefined && {
              price: shopping_option.price,
            }),
            ...(shopping_option.source !== undefined && {
              source: shopping_option.source,
            }),
            ...(shopping_option.source_icon !== undefined && {
              sourceIcon: shopping_option.source_icon,
            }),
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
    console.log(`[JOB ${queueItem.id}] Successfully COMPLETED.`); // 💡 LOG
  } catch (e) {
    // ... existing error handling
    console.error(`❌ Job ${job.id} failed:`, e);
    await setStatus(queueItem.id, "FAILED");
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
  worker.on("ready", () =>
    console.log("🎉 BullMQ Worker connected and ready to process jobs.")
  ); // 💡 Add this log!
  worker.on("error", (err) => console.error("🚨 BullMQ worker error:", err));
  worker.on("completed", (job) => console.log(`✅ Job ${job.id} completed`));
  worker.on("failed", (job, err) =>
    console.warn(`⚠️ Job ${job?.id ?? "unknown"} failed:`, err)
  );
}
