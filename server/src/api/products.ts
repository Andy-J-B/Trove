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

/* ------------------- READ BY PRODUCT ID ------------------- */
router.get("/:id", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const productId = req.params.id;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isDeleted: false,
        // The product must belong to a category that belongs to this device
        category: {
          deviceId,
          isDeleted: false,
        },
      },
      // Pull the related shopping URLs in one go
      include: {
        shoppingUrls: true,
      },
      // Not really needed for a single row, but keeps ordering logic uniform
      orderBy: [{ createdAt: "desc" }],
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
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
// src/api/products.ts   (replace the old soft‑delete block)

router.delete("/:id", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const productId = req.params.id;

    // Verify ownership first – we don’t want to delete someone else’s product.
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isDeleted: false, // ignore already‑deleted rows
        category: { deviceId, isDeleted: false },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // This single call permanently deletes the product **and**
    // all its ShoppingUrl rows thanks to the cascade we added above.
    await prisma.product.delete({ where: { id: productId } });

    res.json({ deleted: true, success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
