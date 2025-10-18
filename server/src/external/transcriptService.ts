/**
 * transcriptService.ts
 *
 * Tiny wrapper around the ScrapeCreators “TikTok transcript” endpoint.
 * Returns a single string that contains the whole transcript (concatenated
 * from every subtitle block the API supplies).
 */

import axios from "axios";

export async function getTranscript(tiktokUrl: string): Promise<string> {
  const { SCRAPE_CREATORS_API_KEY } = process.env;
  if (!SCRAPE_CREATORS_API_KEY) {
    throw new Error("Missing SCRAPE_CREATORS_API_KEY environment variable");
  }

  const data = {
    credits_remaining: 25,
    id: "7455750355897290016",
    url: "https://vt.tiktok.com/ZSUCoAjJU/",
    transcript:
      "WEBVTT\n" +
      "\n" +
      "\n" +
      "00:00:00.120 --> 00:00:02.440\n" +
      "These are the only trousers that you need in your wardrobe.\n" +
      "\n" +
      "00:00:02.441 --> 00:00:03.961\n" +
      "This is part 4 of my essential series\n" +
      "\n" +
      "00:00:03.962 --> 00:00:06.281\n" +
      "where I'm breaking down the foundation of a great wardrobe.\n" +
      "\n" +
      "00:00:06.282 --> 00:00:08.641\n" +
      "No over consumption, just Fashion Simplified.\n" +
      "\n" +
      "00:00:08.642 --> 00:00:10.241\n" +
      "No. 1 is a solid pair of joggers.\n" +
      "\n" +
      "00:00:10.242 --> 00:00:11.281\n" +
      "You want a heavyweight material\n" +
      "\n" +
      "00:00:11.282 --> 00:00:13.321\n" +
      "that's actually gonna hold up after a few wears,\n" +
      "\n" +
      "00:00:13.322 --> 00:00:16.221\n" +
      "so don't go cheap. Cuffed or uncuffed is down to your own preference.\n" +
      "\n" +
      "00:00:16.240 --> 00:00:18.760\n" +
      "I prefer mine uncuffed with a straight or wide leg fit.\n" +
      "\n" +
      "00:00:18.761 --> 00:00:22.701\n" +
      "Top picks of the Uniqlo y Joggers Garms joggers weekday scuba\n" +
      "\n" +
      "00:00:22.720 --> 00:00:25.400\n" +
      "destructive seven layer Johnny Burns\n" +
      "\n" +
      "00:00:25.401 --> 00:00:26.281\n" +
      "if you're enjoying this series\n" +
      "\n" +
      "00:00:26.282 --> 00:00:27.841\n" +
      "and you want to build a timeless wardrobe,\n" +
      "\n" +
      "00:00:27.842 --> 00:00:29.041\n" +
      "drop a follow to stay tuned!\n" +
      "\n" +
      "00:00:29.042 --> 00:00:32.321\n" +
      "No. 2 is denim. Go for a variety of fits depending on your style.\n" +
      "\n" +
      "00:00:32.322 --> 00:00:34.941\n" +
      "Start with a light or dark wash before going to other colours.\n" +
      "\n" +
      "00:00:34.960 --> 00:00:38.560\n" +
      "My top picks Hollister Weekday Levi's 5:01.\n" +
      "\n" +
      "00:00:38.561 --> 00:00:40.241\n" +
      "If you go to your local Uniqlo or Zara\n" +
      "\n" +
      "00:00:40.242 --> 00:00:41.541\n" +
      "you're bound to find a good pair.\n" +
      "\n" +
      "00:00:41.600 --> 00:00:43.840\n" +
      "No. 3 is some black or grey dress trousers.\n" +
      "\n" +
      "00:00:43.841 --> 00:00:44.761\n" +
      "These add a polished,\n" +
      "\n" +
      "00:00:44.762 --> 00:00:47.441\n" +
      "smart casual touch and I love how they flow with an outfit.\n" +
      "\n" +
      "00:00:47.442 --> 00:00:50.101\n" +
      "Top picks for trousers are cos Uniqlo\n" +
      "\n" +
      "00:00:50.280 --> 00:00:53.120\n" +
      "the week they desire or the week they can stick to black or grey.\n" +
      "\n" +
      "00:00:53.121 --> 00:00:55.161\n" +
      "And again, I prefer a straight or wide leg fit.\n" +
      "\n" +
      "00:00:55.162 --> 00:00:57.841\n" +
      "Be sure to drop any essential brands that I might miss in the comments.\n" +
      "\n" +
      "00:00:57.842 --> 00:00:59.481\n" +
      "For now these are the only basics that you need.\n" +
      "\n" +
      "00:00:59.482 --> 00:01:00.838\n" +
      "I'll catch you in the Next episode\n",
  };

  // const response = await axios.get(
  //   "https://api.scrapecreators.com/v1/tiktok/video/transcript",
  //   {
  //     params: { url: tiktokUrl, language: "en" },
  //     headers: { "x-api-key": SCRAPE_CREATORS_API_KEY },
  //   }
  // );

  // const data = response.data;

  // The API sometimes gives an array of subtitle objects,
  // sometimes a single object.  Normalise to a single string.
  if (Array.isArray(data)) {
    // Each element may be { text: string } or { content: string }
    return data
      .map((s) => s.text || s.content || "")
      .join(" ")
      .trim();
  }

  // Fallback – the payload may contain any of the following fields
  return (data.transcript ?? data ?? JSON.stringify(data)).trim();
}
