/**
 * geminiService.ts
 *
 * Calls Gemini‑2.5‑flash with a prompt that asks it to extract up‑to‑5
 * products from a TikTok transcript.  The prompt is built dynamically
 * using the list of *active* categories stored in your Postgres DB
 * (via Prisma).  The function returns an array whose shape matches
 * the `GeminiCategory` / `GeminiProduct` interfaces defined below.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../lib/db.js";

export interface GeminiProduct {
  id: string;
  /** The product name that appears in the video */
  name: string;
  /** Must be one of the category names you already have */
  category: string;
  /** Short human‑readable description */
  description: string;
  /** Emoji/icon that the user sees in the UI (optional) */
  icon?: string;
  /** The exact phrase / context in which the TikTok creator mentioned it */
  mentioned_context?: string;
}

/**
 * A “category” is only used for the prompt – we do **not** write it to the DB
 * here (the worker will create the Category rows after Gemini returns its data).
 */
export interface GeminiCategory {
  /** Human readable name – will become the Category.name in the DB */
  name: string;
  /** Optional description we expose to the UI */
  description?: string;
  /** Products that belong to this category */
  products: GeminiProduct[];
}

/* -----------------------------------------------------------------
 * Initialise the Gemini client (once per process)
 * ----------------------------------------------------------------- */
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

/**
 * Build the prompt that Gemini sees.
 *
 * 1️⃣  Pull the *active* (non‑deleted) categories for the device.
 * 2️⃣  Build a markdown‑style list that Gemini can use for validation.
 * 3️⃣  Ask Gemini to return **pure JSON** (no code fences) that matches
 *     the `GeminiCategory[]` shape.
 */
function buildPrompt(
  transcript: string,
  categoriesFromDb: { name: string; description: string | null }[]
): string {
  // -----------------------------------------------------------------
  // 1️⃣  Build a handy comma‑separated list of category names
  // -----------------------------------------------------------------
  const categoryNames = categoriesFromDb.map((c) => c.name).join(", ");

  // -----------------------------------------------------------------
  // 2️⃣  Build a description block (one line per category)
  // -----------------------------------------------------------------
  const descriptionBlock = categoriesFromDb
    .map((c) => `${c.name}: ${c.description ?? ""}`)
    .join("\n");

  // -----------------------------------------------------------------
  // 3️⃣  The final prompt – ask Gemini to output **valid JSON** only.
  // -----------------------------------------------------------------
  return `
You are a product‑extraction expert.  
From the TikTok transcript below, extract **up to 5 relevant products**. 
IT'S BETTER TO HAVE LESS AND MORE PRECISE PRODUCTS.

Each product must follow this exact JSON structure:

[
  {
    "name": "Product name",
    "category": "one of: ${categoryNames}",
    "description": "Short description (one‑sentence)",
    "icon": "emoji or icon",
    "mentioned_context": "How the creator mentioned the product"
  }
]

The Categories and their descriptions to help you:
${descriptionBlock}

--- TRANSCRIPT ----------------------------------------------------
${transcript}
--- END TRANSCRIPT ------------------------------------------------
Return **just the JSON array**, nothing else (no markdown fences, no commentary).`;
}

/**
 * Call Gemini with the transcript and return a parsed array of
 * `GeminiCategory`.  If Gemini returns malformed JSON we fall back
 * to an empty array and log a warning.
 */
export async function extractProducts(
  transcript: string,
  deviceId: string
): Promise<GeminiCategory[]> {
  // -----------------------------------------------------------------
  // Fetch *active* categories for this device (soft‑deleted rows excluded)
  // -----------------------------------------------------------------
  const dbCategories = await prisma.category.findMany({
    where: { deviceId, isDeleted: false },
    select: { name: true, description: true },
  });

  // -----------------------------------------------------------------
  // Build the prompt and send it to Gemini
  // -----------------------------------------------------------------
  const prompt = buildPrompt(transcript, dbCategories);

  const result = await model.generateContent(prompt);

  // Gemini returns a `Response` object – we grab the plain text
  const rawText = result.response
    .text()
    .replace(/```json\n?|\n?```/g, "") // strip code fences if they appear
    .trim();

  // console.log("\n\n\n", rawText, "\n\n\n");

  // const rawText = [
  //   {
  //     name: "Uniqlo Pleated Trousers",
  //     category: "Clothing",
  //     description:
  //       "These trousers are highly recommended for every man, known for their amazing fit and true-to-size nature, coming with two drawstrings for perfect sizing.",
  //     icon: "👖",
  //     mentioned_context:
  //       "Uniqlo's pants that every man needs; these are the Uniqlo pleated trousers.",
  //   },
  // ];

  // const rawText = [
  //   {
  //     name: "Joggers",
  //     category: "Clothing",
  //     description:
  //       "Essential trousers made from heavyweight material, available in cuffed or uncuffed styles, often preferred with a straight or wide leg fit.",
  //     icon: "👖",
  //     mentioned_context:
  //       "No. 1 is a solid pair of joggers. You want a heavyweight material that's actually gonna hold up after a few wears, so don't go cheap. Cuffed or uncuffed is down to your own preference. I prefer mine uncuffed with a straight or wide leg fit.",
  //   },
  //   {
  //     name: "Denim Jeans",
  //     category: "Clothing",
  //     description:
  //       "Essential denim trousers available in a variety of fits and washes, recommended to start with light or dark options.",
  //     icon: "👖",
  //     mentioned_context:
  //       "No. 2 is denim. Go for a variety of fits depending on your style. Start with a light or dark wash before going to other colours.",
  //   },
  //   {
  //     name: "Dress Trousers",
  //     category: "Clothing",
  //     description:
  //       "Black or grey trousers that add a polished, smart casual touch to an outfit, often preferred with a straight or wide leg fit.",
  //     icon: "👖",
  //     mentioned_context:
  //       "No. 3 is some black or grey dress trousers. These add a polished, smart casual touch and I love how they flow with an outfit. And again, I prefer a straight or wide leg fit.",
  //   },
  // ];

  // -----------------------------------------------------------------
  // Try to parse the JSON.  If parsing fails we warn and return [].
  // -----------------------------------------------------------------
  try {
    const parsed = JSON.parse(rawText) as GeminiProduct[];
    // const parsed = rawText as GeminiProduct[];
    // The original service used a flat product list; for the
    // DB‑writer we regroup by category here.
    const byCategory: Record<string, GeminiCategory> = {};

    for (const prod of parsed) {
      const catName = prod.category;
      if (!byCategory[catName]) {
        byCategory[catName] = {
          name: catName,
          description: "", // we don’t know a description – optional
          products: [],
        };
      }

      const newProduct: GeminiProduct = {
        id: prod.id,
        name: prod.name,
        category: prod.category,
        description: prod.description,
        // ✅ Only include icon if it is NOT undefined
        ...(prod.icon !== undefined && { icon: prod.icon }),
        // ✅ Only include mentioned_context if it is NOT undefined
        ...(prod.mentioned_context !== undefined && {
          mentioned_context: prod.mentioned_context,
        }),
      };

      byCategory[catName].products.push(newProduct);
    }

    // Return an array of categories (order does not matter)

    // Example of byCategory :
    // {
    //   Clothing: {
    //     name: 'Clothing',
    //     description: '',
    //     products: [ [Object], [Object], [Object] ]
    //   }
    // }
    return Object.values(byCategory);
  } catch (e) {
    console.warn("⚠️ Gemini returned invalid JSON:", rawText);
    console.warn("Parse error:", e);
    return []; // Gracefully continue – the worker will mark the QueueItem as FAILED
  }
}
