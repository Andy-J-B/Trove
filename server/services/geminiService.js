import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
  // return [
  //   {
  //     name: "Levi's 550s",
  //     category: "clothing",
  //     description:
  //       "Classic relaxed fit jeans, available in light and dark wash, considered flattering for all body types.",
  //     icon: "👖",
  //     mentioned_context:
  //       "And these are the Levi's five 50s. And they come in a classic relaxed fit, which I think is flattering for all body types. And personally, the light wash is my favorite. And I think it's great for year round, I would definitely consider getting the dark wash for fall and winter, which they also sell.",
  //   },
  //   {
  //     name: "Uniqlo C sweatpants",
  //     category: "clothing",
  //     description:
  //       "Gray sweatpants with a great fit and silhouette, featuring big pockets, soft fabric, and internal drawstrings for an elevated look.",
  //     icon: "👖",
  //     mentioned_context:
  //       "A gray sweatpants is an essential in everyone's wardrobe. And these are the Uniqlo C sweatpants. Now to me, what's most important is the fit and silhouette. And I think it speaks for itself. And what else I love about these is the pockets are extremely big, the fabric is very soft to the touch. And the drawstrings are on the inside of the waistband, which I just think makes it look way more elevated.",
  //   },
  //   {
  //     name: "Gap 365 pleated trousers",
  //     category: "clothing",
  //     description:
  //       "Pleated trousers suitable for dressy occasions, known for their great silhouette that fits the waist well and flares out at the bottom of the legs. They run big, so sizing down is recommended.",
  //     icon: "👖",
  //     mentioned_context:
  //       "we need some pleated trousers for those dressy occasions... And these are the gap 3, 6, 5 pleated trousers. The silhouette on these is everything. They fit the waist really well and then flare out towards the bottom of the legs. Now On almost every bottom I wear a 31 by 32 and these run really big. So just take note of that. Here I'm wearing a 30 by 30. So definitely size down if you end up buying these.",
  //   },
  //   {
  //     name: "Uniqlo wide chinos",
  //     category: "clothing",
  //     description:
  //       "Versatile wide-fit chinos that can be worn for both elevated and casual occasions, highly recommended by the speaker who owns multiple pairs.",
  //     icon: "👖",
  //     mentioned_context:
  //       "Now Chino's are great because you can wear them in pretty much any occasion, whether it's elevated or casual. And these are the Uniqlo wide chinos. And actually I have two pairs of these, so I can't recommend them enough. Now whether you feel comfortable wearing a wide fit is gonna come down to personal preference. I really do think this would look good on anyone, no matter your body type.",
  //   },
  // ];
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
