import express from "express";
import { getTranscript } from "../services/transcriptService.js";
import { extractProducts } from "../services/geminiService.js";
import db from "../db/index.js";

const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const { tiktokUrl } = req.body;
    if (!tiktokUrl)
      return res.status(400).json({ error: "TikTok URL is required" });

    const transcript = await getTranscript(tiktokUrl);
    const extracted = await extractProducts(transcript, db);
    console.log(extracted);

    const saved = [];
    for (const p of extracted) {
      const result = await db.products.add({
        ...p,
        tiktok_url: tiktokUrl,
      });
      saved.push(result);
    }

    res.json({
      success: true,
      tiktokUrl,
      transcript,
      extracted,
      savedCount: saved.length,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
