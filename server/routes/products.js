import express from "express";
import db from "../db/index.js";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { category } = req.query;
    const products = category
      ? await db.products.getByCategory(category)
      : await db.products.getAll();
    res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const product = await db.products.getById(req.params.id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { name, category } = req.body;
    if (!name || !category)
      return res
        .status(400)
        .json({ success: false, error: "Name and Category required" });

    const newProduct = await db.products.create(req.body);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const updated = await db.products.update(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await db.products.delete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
