import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function extractProducts(transcript, db) {
  const categories = await db.categories.getAll();
  const namesString = categories.map((c) => c.name).join(", ");
  const formattedString = categories
    .map((c) => `${c.name}: ${c.description}`)
    .join("\n");

  const prompt = `
You are a product extraction expert. Extract up to 5 relevant products from the following TikTok transcript.

Each product must follow this structure:
[
  { "name": "Product name", "category": "one of: ${namesString}",
    "description": "Short description", "icon": "emoji/icon",
    "mentioned_context": "How it was mentioned" }
]

Categories:
${formattedString}

Transcript:
"${transcript}"
  `;

  const result = await model.generateContent(prompt);
  const text = result.response
    .text()
    .replace(/```json\n?|\n?```/g, "")
    .trim();

  try {
    return JSON.parse(text);
  } catch {
    console.warn("Invalid Gemini JSON:", text);
    return [];
  }
}
