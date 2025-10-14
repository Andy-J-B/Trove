import express from "express";
import db from "../db/index.js";

const router = express.Router();

// GET all categories
router.get("/", async (req, res, next) => {
  try {
    const categories = await db.categories.getAll();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// GET category by ID
router.get("/:id", async (req, res, next) => {
  try {
    const category = await db.categories.getById(req.params.id);
    if (!category)
      return res
        .status(404)
        .json({ success: false, error: "Category not found" });
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

// POST new category
router.post("/", async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name || !description)
      return res
        .status(400)
        .json({ success: false, error: "Name and Description required" });

    const newCat = await db.categories.create(name, description, icon);
    res.status(201).json({ success: true, data: newCat });
  } catch (err) {
    next(err);
  }
});

// PUT update category
router.put("/:id", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const updated = await db.categories.update(
      req.params.id,
      name,
      description
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE category
router.delete("/:id", async (req, res, next) => {
  try {
    await db.categories.delete(req.params.id);
    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
