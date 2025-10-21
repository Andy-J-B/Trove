import { prisma } from "../lib/db.js";

/**
 * Deletes any rows (Product, QueueItem) whose
 * `createdAt` timestamp is older than 30 days.
 *
 * This function is intended to be called once a day via a simple
 * Node timer (`setInterval`).
 */
export async function purgeOldData(): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

  // Delete old products
  await prisma.product.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  // Delete old queue items
  await prisma.queueItem.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });

  console.log(
    "🧹 purgeOldData executed – Product/QueueItem rows >30 days removed"
  );
}

/**
 * Starts a **daily timer** that fires at 02:00 UTC each day.
 * We compute the delay until the next 02:00 and then `setInterval`
 * for 24 h repeats.
 */
export function schedulePurgeJob(): void {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  // Compute milliseconds until the next 02:00 UTC
  const now = new Date();
  const next = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      2, // 02:00 UTC
      0,
      0,
      0
    )
  );
  if (next <= now) {
    // 02:00 today already passed → schedule for tomorrow
    next.setUTCDate(next.getUTCDate() + 1);
  }
  const initialDelay = next.getTime() - now.getTime();

  // First run (once we hit the target time)
  setTimeout(() => {
    purgeOldData().catch((e) => console.error("❌ purge failed:", e));

    // Subsequent runs every 24 h
    setInterval(() => {
      purgeOldData().catch((e) => console.error("❌ purge failed:", e));
    }, ONE_DAY_MS);
  }, initialDelay);
}
