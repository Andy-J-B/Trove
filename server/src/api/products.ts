// src/api/products.ts
import { Router } from "express";
import { prisma } from "../lib/db.js";

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
      categoryId, // client sends the **category** UUID
    } = req.body;

    // Verify the category belongs to this device & is not deleted
    const cat = await prisma.category.findFirst({
      where: { id: categoryId, deviceId, isDeleted: false },
    });
    if (!cat) return res.status(400).json({ error: "Invalid category" });

    // 👇  One transaction: create product + bump the counter
    const [product] = await prisma.$transaction([
      prisma.product.create({
        data: {
          name,
          price,
          tiktokUrl,
          imageUrl,
          description,
          categoryId: cat.id,
        },
      }),
      prisma.category.update({
        where: { id: cat.id },
        data: { productCount: { increment: 1 } },
      }),
    ]);

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
    const productId = req.params.id;
    const updates = req.body as any;

    // 0️⃣  Load the current product (we need its old categoryId)
    const current = await prisma.product.findFirst({
      where: {
        id: productId,
        isDeleted: false,
        category: { deviceId, isDeleted: false },
      },
      select: { categoryId: true },
    });

    if (!current) return res.status(404).json({ error: "Not found" });

    // 1️⃣  If the caller wants to move the product to a new category,
    //      verify the new category belongs to the same device.
    if (updates.categoryId && updates.categoryId !== current.categoryId) {
      const newCat = await prisma.category.findFirst({
        where: { id: updates.categoryId, deviceId, isDeleted: false },
      });
      if (!newCat)
        return res.status(400).json({ error: "Invalid new category" });
    }

    // 2️⃣  Perform the update – we will adjust counts if the category changed.
    const updated = await prisma.product.updateMany({
      where: {
        id: productId,
        isDeleted: false,
        category: { deviceId, isDeleted: false },
      },
      data: updates,
    });
    if (updated.count === 0)
      return res.status(404).json({ error: "Not found" });

    // 3️⃣  If the category changed, move the counter.
    if (updates.categoryId && updates.categoryId !== current.categoryId) {
      await prisma.$transaction([
        // decrement old category
        prisma.category.update({
          where: { id: current.categoryId },
          data: { productCount: { decrement: 1 } },
        }),
        // increment new category
        prisma.category.update({
          where: { id: updates.categoryId },
          data: { productCount: { increment: 1 } },
        }),
      ]);
    }

    // 4️⃣  Return the fresh product (with category relationship)
    const fresh = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    res.json(fresh);
  } catch (e) {
    next(e);
  }
});

/* ------------------- DELETE (hard) ------------------- */
router.delete("/:id", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const productId = req.params.id;

    // 1️⃣  Find the product (so we know its current category)
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isDeleted: false,
        category: { deviceId, isDeleted: false },
      },
      select: { id: true, categoryId: true },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    // 2️⃣  Delete the product **and** decrement the parent count – atomic
    await prisma.$transaction([
      prisma.product.delete({ where: { id: product.id } }),
      prisma.category.update({
        where: { id: product.categoryId },
        data: { productCount: { decrement: 1 } },
      }),
    ]);

    res.json({ deleted: true, success: true });
  } catch (e) {
    next(e);
  }
});

export default router;
