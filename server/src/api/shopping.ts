// src/api/shopping.ts
import { Router } from "express";
import { prisma } from "../lib/db";

const router = Router();

function getDeviceId(req: any): string {
  const id = req.header("x-device-id");
  if (!id) throw new Error("Missing x-device-id header");
  return id;
}

/* GET /api/shopping/:productId – list URLs for a product */
router.get("/:productId", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const productId = req.params.productId;

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isDeleted: false,
        category: { deviceId, isDeleted: false },
      },
      include: { shoppingUrls: true },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(
      product.shoppingUrls.map((u) => ({
        id: u.id,
        url: u.url,
        createdAt: u.createdAt,
      }))
    );
  } catch (e) {
    next(e);
  }
});

/* (optional) POST /api/shopping/:productId – manual add */
router.post("/:productId", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const productId = req.params.productId;
    const { url } = req.body as { url: string };
    if (!url) return res.status(400).json({ error: "Missing `url`" });

    // Verify ownership
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        isDeleted: false,
        category: { deviceId, isDeleted: false },
      },
    });
    if (!product) return res.status(404).json({ error: "Product not found" });

    const shoppingUrl = await prisma.shoppingUrl.create({
      data: { productId: product.id, url },
    });

    res.status(201).json({ id: shoppingUrl.id, url: shoppingUrl.url });
  } catch (e) {
    next(e);
  }
});

/* (optional) DELETE /api/shopping/:urlId */
router.delete("/:urlId", async (req, res, next) => {
  try {
    const deviceId = getDeviceId(req);
    const urlId = req.params.urlId;

    const url = await prisma.shoppingUrl.findFirst({
      where: {
        id: urlId,
        product: {
          isDeleted: false,
          category: { deviceId, isDeleted: false },
        },
      },
    });
    if (!url) return res.status(404).json({ error: "URL not found" });

    await prisma.shoppingUrl.delete({ where: { id: urlId } });
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

export default router;
