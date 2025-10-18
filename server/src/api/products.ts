// src/api/products.ts
import { Router } from "express";
import { prisma } from "../lib/db";

const router = Router();

function getDeviceId(req: any): string {
  const id = req.header("x-device-id");
  if (!id) throw new Error("Missing x-device-id header");
  return id;
}

/* ------------------- CREATE ------------------- */
router.post("/", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const {
      name,
      price,
      tiktokUrl,
      imageUrl,
      description,
      categoryId, // client should send the **category** UUID (not name)
    } = req.body;

    // Verify the category belongs to this device and is not deleted
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, deviceId, isDeleted: false },
    });
    if (!cat) return res.status(400).json({ error: "Invalid category" });

    const product = await prisma.product.create({
      data: {
        name,
        price,
        tiktokUrl,
        imageUrl,
        description,
        categoryId: cat.id,
      },
    });
    res.status(201).json(product);
  } catch (e) {
    next(e);
  }
});

/* ------------------- READ ALL (by device) ------------------- */
router.get("/", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        category: {
          deviceId,
          isDeleted: false,
        },
      },
      include: { category: true },
      orderBy: [{ createdAt: "desc" }],
    });
    res.json(products);
  } catch (e) {
    next(e);
  }
});

/* ------------------- READ BY CATEGORY ------------------- */
router.get("/by-category/:categoryId", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        categoryId: req.params.categoryId,
        category: { deviceId, isDeleted: false },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    res.json(products);
  } catch (e) {
    next(e);
  }
});

/* ------------------- UPDATE ------------------- */
router.patch("/:id", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const updates = req.body;

    // If the payload tries to move the product to another category,
    // make sure the new category belongs to this device.
    if (updates.categoryId) {
      const cat = await prisma.category.findFirst({
        where: { id: updates.categoryId, deviceId, isDeleted: false },
      });
      if (!cat) return res.status(400).json({ error: "Invalid category" });
    }

    // Apply the update only if the product belongs to a category of this device
    const updated = await prisma.product.updateMany({
      where: {
        id: req.params.id,
        isDeleted: false,
        category: { deviceId, isDeleted: false },
      },
      data: updates,
    });
    if (updated.count === 0)
      return res.status(404).json({ error: "Not found" });

    const fresh = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true },
    });

    res.json(fresh);
  } catch (e) {
    next(e);
  }
});

/* ------------------- DELETE (soft) ------------------- */
router.delete("/:id", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const deleted = await prisma.product.updateMany({
      where: {
        id: req.params.id,
        isDeleted: false,
        category: { deviceId, isDeleted: false },
      },
      data: { isDeleted: true },
    });

    if (deleted.count === 0)
      return res.status(404).json({ error: "Not found" });
    res.json({ deleted: true, success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
