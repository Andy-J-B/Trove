// src/api/categories.ts
import { Router } from "express";
import { prisma } from "../lib/db";
import { ensureDevice } from "../lib/device";

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

    await ensureDevice(deviceId);

    const categories = await prisma.category.findMany({
      where: { deviceId, isDeleted: false },
      include: {
        _count: {
          select: {
            products: {
              where: { isDeleted: false }
            }
          }
        }
      },
      orderBy: { name: "asc" },
    });

    // Map response to include itemCount field
    const categoriesWithCount = categories.map(cat => ({
      id: cat.id,
      deviceId: cat.deviceId,
      name: cat.name,
      description: cat.description,
      isDeleted: cat.isDeleted,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      itemCount: cat._count.products
    }));

    res.json(categoriesWithCount);
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
// src/api/categories.ts   (replace the old soft‑delete block)

router.delete("/:id", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const categoryId = req.params.id;

    // Verify the category belongs to the device
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        deviceId,
        isDeleted: false,
      },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // One call – the cascade will:
    //   * delete the category
    //   * delete every product that belongs to it
    //   * delete every ShoppingUrl that belongs to those products
    await prisma.category.delete({ where: { id: categoryId } });

    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

export default router;
