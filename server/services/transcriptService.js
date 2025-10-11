import axios from "axios";

export async function getTranscript(tiktokUrl) {
  const { SCRAPE_CREATORS_API_KEY } = process.env;
  if (!SCRAPE_CREATORS_API_KEY)
    throw new Error("Missing SCRAPE_CREATORS_API_KEY");

  const response = await axios.get(
    "https://api.scrapecreators.com/v1/tiktok/video/transcript",
    {
      params: { url: tiktokUrl, language: "en" },
      headers: { "x-api-key": SCRAPE_CREATORS_API_KEY },
    }
  );

  const data = response.data;
  if (Array.isArray(data))
    return data.map((s) => s.text || s.content).join(" ");
  return data.transcript || data.text || JSON.stringify(data);
}
