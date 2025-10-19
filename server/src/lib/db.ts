// src/lib/db.ts
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * We create a **singleton** Prisma client.
 * In dev mode (hot‑reloading) we reuse the same instance to avoid exhausted
 * connection pools.
 */
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  // @ts-ignore
  global.prisma = prisma;
}
