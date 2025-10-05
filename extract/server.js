import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "TikTok Product Extractor API is running",
  });
});

// Test endpoint to debug Scrape Creators API
app.post("/test-transcript", async (req, res) => {
  try {
    const { tiktokUrl } = req.body;

    if (!tiktokUrl) {
      return res.status(400).json({ error: "TikTok URL is required" });
    }

    console.log("Testing transcript fetch for:", tiktokUrl);
    const transcript = await getTranscript(tiktokUrl);

    res.json({
      success: true,
      tiktokUrl,
      transcript,
      transcriptLength: transcript?.length || 0,
    });
  } catch (error) {
    console.error("Test transcript error:", error);
    res.status(500).json({
      error: "Test failed",
      message: error.message,
    });
  }
});

// Main endpoint to extract products from TikTok video
app.post("/extract-products", async (req, res) => {
  try {
    const { tiktokUrl } = req.body;

    if (!tiktokUrl) {
      return res.status(400).json({ error: "TikTok URL is required" });
    }

    // Step 1: Get transcript from Scrape Creators API
    console.log("Fetching transcript for:", tiktokUrl);
    const transcript = await getTranscript(tiktokUrl);

    if (!transcript) {
      return res
        .status(404)
        .json({ error: "Could not extract transcript from video" });
    }

    // Step 2: Extract products using OpenAI
    console.log("Extracting products from transcript...");
    const products = await extractProducts(transcript);

    res.json({
      success: true,
      tiktokUrl,
      transcript,
      products,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Function to get transcript from Scrape Creators API
async function getTranscript(tiktokUrl) {
  try {
    // console.log("Making request to Scrape Creators API...");
    // console.log("URL:", tiktokUrl);
    // console.log("API Key present:", !!process.env.SCRAPE_CREATORS_API_KEY);

    // const response = await axios.get(
    //   "https://api.scrapecreators.com/v1/tiktok/video/transcript",
    //   {
    //     params: {
    //       url: tiktokUrl,
    //       language: "en",
    //     },
    //     headers: {
    //       "x-api-key": process.env.SCRAPE_CREATORS_API_KEY,
    //     },
    //   }
    // );

    // console.log("API Response status:", response.status);
    // console.log("API Response data:", JSON.stringify(response.data, null, 2));

    // // The API returns transcript data with timestamps
    // const transcriptData = response.data;

    // // Extract just the text from the transcript segments
    // if (transcriptData && Array.isArray(transcriptData)) {
    //   return transcriptData
    //     .map((segment) => segment.text || segment.content)
    //     .join(" ");
    // }
    // console.log(
    //   transcriptData.transcript ||
    //     transcriptData.text ||
    //     JSON.stringify(transcriptData)
    // );
    // // Fallback if the response format is different
    // return (
    //   transcriptData.transcript ||
    //   transcriptData.text ||
    //   JSON.stringify(transcriptData)
    // );
    return '{"utterances":[{"text":"no wonder you have acne you skip the most important step","start_time":80,"end_time":2520,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.9054263565891473,"source_height":0.15479651162790697},{"text":"your skincare every morning I do this exact routine","start_time":2521,"end_time":4600,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.9038759689922481,"source_height":0.15479651162790697},{"text":"I start with the centella cleansing oil removes dirt and oils","start_time":4601,"end_time":7040,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.9124031007751937,"source_height":0.15479651162790697},{"text":"I think I put a little too much","start_time":7041,"end_time":8080,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8899224806201551,"source_height":0.11162790697674418},{"text":"then I wash this off nice","start_time":8081,"end_time":9920,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.7744186046511627,"source_height":0.11162790697674418},{"text":"then I go in with the ampoule foam","start_time":10046,"end_time":11206,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8031007751937984,"source_height":0.11162790697674418},{"text":"Koreans know how to do one thing","start_time":11207,"end_time":12286,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8612403100775193,"source_height":0.11162790697674418},{"text":"it\'s their skincare rub this in","start_time":12287,"end_time":13406,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8503875968992248,"source_height":0.11162790697674418},{"text":"this is to remove all the dirt and oils","start_time":13407,"end_time":15186,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.9124031007751937,"source_height":0.11162790697674418},{"text":"you know what I like about these two","start_time":15187,"end_time":16156,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8248062015503876,"source_height":0.11162790697674418},{"text":"it doesn\'t leave your skin feeling tight and dry","start_time":16157,"end_time":17796,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8395348837209302,"source_height":0.15479651162790697},{"text":"favorites before I moisturize","start_time":17797,"end_time":19116,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.6984496124031008,"source_height":0.11162790697674418},{"text":"I usually go in with an ampoule ","start_time":19117,"end_time":20156,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8682170542635659,"source_height":0.11162790697674418},{"text":"grab a few drops essentially a serum","start_time":20157,"end_time":21796,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.7596899224806202,"source_height":0.11162790697674418},{"text":"go like this keeps my skin shiny","start_time":21797,"end_time":23316,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8434108527131784,"source_height":0.11162790697674418},{"text":"once I\'m done with the ampoule","start_time":23317,"end_time":24196,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8984496124031007,"source_height":0.11162790697674418},{"text":"I use a moisturizer moisturizer helps keep my skin smooth and balanced","start_time":24197,"end_time":27116,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8961240310077518,"source_height":0.19796511627906976},{"text":"locks in the hydration from the ampoule and prevents moisture loss","start_time":27117,"end_time":29676,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8829457364341086,"source_height":0.15479651162790697},{"text":"lastly it\'s summer right now","start_time":29677,"end_time":30756,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.9015503875968993,"source_height":0.11162790697674418},{"text":"so I use sunscreen gotta protect myself from the UV rays","start_time":30757,"end_time":32916,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.813953488372093,"source_height":0.15479651162790697},{"text":"prevents skin cancer and signs of aging","start_time":32917,"end_time":34636,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8364341085271318,"source_height":0.11162790697674418},{"text":"even if you\'re indoor still use sunscreen","start_time":34637,"end_time":36076,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8108527131782947,"source_height":0.11162790697674418},{"text":"make sure you do it daily","start_time":36077,"end_time":36996,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.7891472868217054,"source_height":0.11162790697674418},{"text":"I won\'t gate keep anymore","start_time":36997,"end_time":37836,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.7062015503875969,"source_height":0.11162790697674418},{"text":"all of these are from skin 1","start_time":37837,"end_time":38756,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8069767441860465,"source_height":0.11162790697674418},{"text":"0 0 4","start_time":38757,"end_time":39316,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.23953488372093024,"source_height":0.06802325581395349},{"text":"this right here is why I take care of my skin pretty quick routine","start_time":39317,"end_time":41676,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.8868217054263565,"source_height":0.15479651162790697},{"text":"Korean skincare","start_time":41677,"end_time":42307,"words":null,"text_size":28,"text_color":"#FFFFFFFF","bg_color":"#00000000","alignment":0,"source_width":0.651937984496124,"source_height":0.06802325581395349}]}';
  } catch (error) {
    console.error("Detailed error info:");
    console.error("Status:", error.response?.status);
    console.error("Status Text:", error.response?.statusText);
    console.error("Response Data:", error.response?.data);
    console.error("Request Config:", {
      url: error.config?.url,
      method: error.config?.method,
      params: error.config?.params,
      headers: error.config?.headers,
    });

    throw new Error(
      `Scrape Creators API Error: ${error.response?.status} - ${JSON.stringify(error.response?.data) || error.message}`
    );
  }
}

async function extractProducts(transcript) {
  try {
    const prompt = `
You are a product extraction expert. Analyze the given transcript from a TikTok video and extract all products mentioned.

Return ONLY a valid JSON array of products with this structure:
[
  {
    "name": "Product name",
    "category": "Product category",
    "description": "Brief description based on context",
    "mentioned_context": "How it was mentioned in the video"
  }
]

Only include actual products (physical items, services, brands, apps, etc.) that are clearly mentioned or discussed.
Do not include generic terms or concepts unless they refer to specific products.

Transcript:
"${transcript}"
    `;

    // const result = await model.generateContent(prompt);
    return "DONEOWNDWANLKDNALK";
    const text = result.response.text();

    // Try to parse JSON
    try {
      return JSON.parse(text);
    } catch (err) {
      console.warn("Gemini output was not valid JSON:", text);
      return [
        {
          name: "Raw Response",
          category: "Unknown",
          description: text,
          mentioned_context: "Gemini response could not be parsed as JSON",
        },
      ];
    }
  } catch (error) {
    console.error("Error extracting products with Gemini:", error);
    throw new Error("Failed to extract products using Gemini");
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
