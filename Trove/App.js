import React, { useEffect } from "react";
import {
  Text,
  View,
  AppState,
  BackHandler,
  Platform,
  ToastAndroid,
} from "react-native";
import { useShareIntent } from "expo-share-intent";
import { enqueue, drain, peekAll } from "./src/queue";
import axios from "axios";

export default function App() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent();
  const [queued, setQueued] = React.useState(0);

  // Handle incoming share: enqueue and immediately close the Activity on Android
  useEffect(() => {
    let didHandle = false;

    (async () => {
      if (hasShareIntent && shareIntent && !didHandle) {
        didHandle = true;

        const url = shareIntent.webUrl || shareIntent.text || "";
        if (url) {
          await enqueue(url);
          // (optional) tiny feedback so users know it was saved
          if (Platform.OS === "android") {
            try {
              ToastAndroid.show("Saved to Trove", ToastAndroid.SHORT);
            } catch {}
          }
          // refresh the counter
          peekAll().then((q) => setQueued(q.length));
        }

        // Clear share state so future shares work
        resetShareIntent();

        // Give the enqueue a moment to flush, then finish the Activity (return to TikTok)
        if (Platform.OS === "android") {
          setTimeout(() => BackHandler.exitApp(), 40);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasShareIntent, shareIntent]);

  // Process the queue whenever app becomes active (normal opens)
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        await processQueue();
        peekAll().then((q) => setQueued(q.length));
      }
    });

    // Also run once at startup (for normal launches)
    (async () => {
      await processQueue();
      peekAll().then((q) => setQueued(q.length));
    })();

    return () => sub.remove();
  }, []);

  async function processQueue() {
    const urls = await drain();
    for (const url of urls) {
      try {
        await axios.post("http://localhost:3000/extract-products", {
          url,
        });
      } catch (e) {
        await enqueue(url); // re-queue on failure
        console.warn("Processing failed, re-queued", e);
      }
    }
  }

  // initial count for the basic UI (not required for the share flow)
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
