// src/api/categories.ts
import { Router } from "express";
import { prisma } from "../lib/db";

const router = Router();

/**
 * All category routes are **device‑scoped**.
 * The client must send its deviceId in the `x-device-id` header.
 */
function getDeviceId(req: any): string {
  const id = req.header("x-device-id");
  if (!id) throw new Error("Missing x-device-id header");
  return id;
}

/* ------------------- CREATE ------------------- */
router.post("/", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const { name, description } = req.body;

    const category = await prisma.category.create({
      data: {
        deviceId,
        name,
        description,
        // We keep an `icon` field in the local SQLite cache only.
        // If you ever want it server‑side, add `icon` to the Prisma model.
      },
    });
    res.status(201).json(category);
  } catch (e) {
    next(e);
  }
});

/* ------------------- READ ALL ------------------- */
router.get("/", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const categories = await prisma.category.findMany({
      where: { deviceId, isDeleted: false },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (e) {
    next(e);
  }
});

/* ------------------- GET ONE ------------------- */
router.get("/:id", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const category = await prisma.category.findFirst({
      where: { id: req.params.id, deviceId, isDeleted: false },
    });
    if (!category) return res.status(404).json({ error: "Not found" });
    res.json(category);
  } catch (e) {
    next(e);
  }
});

/* ------------------- UPDATE ------------------- */
router.patch("/:id", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const updates = req.body;
    const category = await prisma.category.updateMany({
      where: { id: req.params.id, deviceId, isDeleted: false },
      data: updates,
    });
    if (category.count === 0)
      return res.status(404).json({ error: "Not found" });
    const updated = await prisma.category.findUnique({
      where: { id: req.params.id },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

/* ------------------- DELETE ------------------- */
router.delete("/:id", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    await prisma.category.updateMany({
      where: { id: req.params.id, deviceId },
      data: { isDeleted: true },
    });
    // Soft‑delete cascades – we also mark child products as deleted
    await prisma.product.updateMany({
      where: { categoryId: req.params.id },
      data: { isDeleted: true },
    });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

export default router;
