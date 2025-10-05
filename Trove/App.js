import React, { useEffect } from "react";
import { Text, View, AppState } from "react-native";
import { useShareIntent } from "expo-share-intent";
import { enqueue, drain, peekAll } from "./src/queue";
import axios from "axios";

export default function App() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent();

  useEffect(() => {
    if (hasShareIntent && shareIntent) {
      const url = shareIntent.webUrl || shareIntent.text || "";
      if (url) {
        enqueue(url).finally(() => resetShareIntent());
      }
    }
  }, [hasShareIntent, shareIntent]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") await processQueue();
    });
    processQueue(); // run once at startup
    return () => sub.remove();
  }, []);

  async function processQueue() {
    const urls = await drain();
    for (const url of urls) {
      try {
        const { data: transcript } = await axios.post(
          "https://YOUR_TRANSCRIPT_API/parse",
          { url }
        );
        const { data: summary } = await axios.post(
          "https://YOUR_BACKEND/gemini",
          { transcript }
        );
        await axios.post("https://YOUR_BACKEND/content", {
          url,
          transcript,
          summary,
        });
      } catch (e) {
        await enqueue(url);
        console.warn("Processing failed, re-queued", e);
      }
    }
  }

  const [queued, setQueued] = React.useState(0);
  useEffect(() => {
    peekAll().then((q) => setQueued(q.length));
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Share TikTok links to this app.</Text>
      <Text>Queued: {queued}</Text>
      {error ? <Text>{String(error)}</Text> : null}
    </View>
  );
}
