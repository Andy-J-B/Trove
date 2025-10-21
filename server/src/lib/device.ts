// src/lib/device.ts
import { prisma } from "./db.js";

/**
 * Guarantees that a Device row exists for the supplied `deviceId`.
 * If it already exists the call is a cheap no‑op.
 */
export async function ensureDevice(deviceId: string): Promise<void> {
  await prisma.device.upsert({
    where: { id: deviceId },
    create: { id: deviceId },
    update: {}, // nothing to update
  });
}
