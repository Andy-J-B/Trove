// App.js
import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  AppState,
  BackHandler,
  Platform,
  ToastAndroid,
  FlatList,
  Pressable,
} from "react-native";
import { useShareIntent } from "expo-share-intent";
import { enqueue, drain, peekAll } from "./src/queue";
import axios from "axios";

// Use your ngrok HTTPS URL (works on real Android devices)
const BASE_URL = "https://abc123.ngrok.io";

// 🔊 always log on startup
console.log("🔥 App.js loaded");

export default function App() {
  console.log("🔥 App component rendered");

  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent();

  const [queued, setQueued] = useState(0);
  const [results, setResults] = useState([]);
  const [handledShare, setHandledShare] = useState(false);

  // ANDROID-ONLY share handler: enqueue quickly and exit back to TikTok
  useEffect(() => {
    if (Platform.OS !== "android") return; // ◀︎ ignore iOS entirely
    if (!hasShareIntent || !shareIntent || handledShare) return;

    let didHandle = false;
    (async () => {
      console.log("📩 Android share received");
      setHandledShare(true);
      didHandle = true;

      const url = shareIntent.webUrl || shareIntent.text || "";
      console.log("🔗 Shared URL:", url);

      if (url) {
        try {
          await enqueue(url);
          console.log("🧺 Enqueued:", url);
          if (Platform.OS === "android") {
            try {
              ToastAndroid.show("Saved to Trove", ToastAndroid.SHORT);
            } catch {}
          }
          peekAll().then((q) => setQueued(q.length));
        } catch (e) {
          console.warn("❌ Enqueue failed:", e);
          setHandledShare(false); // let UI open so you can debug
          return;
        }
      } else {
        console.log("ℹ️ No URL found in share payload");
      }

      resetShareIntent();
      // Give logs/toast a moment to flush, then bounce back to TikTok
      setTimeout(() => {
        console.log("👋 Exiting back to TikTok");
        BackHandler.exitApp();
      }, 250);
    })();

    return () => {
      if (!didHandle) setHandledShare(false);
    };
  }, [hasShareIntent, shareIntent, handledShare, resetShareIntent]);

  // NORMAL opens (Android): process queued URLs
  useEffect(() => {
    if (Platform.OS !== "android") return; // iOS: do nothing
    if (handledShare) return;

    const sub = AppState.addEventListener("change", async (state) => {
      console.log("📱 AppState:", state);
      if (state === "active") {
        await processQueue();
        peekAll().then((q) => setQueued(q.length));
      }
    });

    (async () => {
      console.log("🚀 Startup: processing queue once");
      await processQueue();
      peekAll().then((q) => setQueued(q.length));
    })();

    return () => sub.remove();
  }, [handledShare]);

  // Initial count
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (handledShare) return;
    peekAll().then((q) => {
      console.log("🔢 Initial queue size:", q.length);
      setQueued(q.length);
    });
  }, [handledShare]);

  async function processQueue() {
    const urls = await drain();
    console.log("🧹 Drain:", urls);
    for (const url of urls) {
      try {
        const res = await axios.post(
          `${BASE_URL}/extract-products`,
          { url },
          { responseType: "text" }
        );
        const text =
          typeof res.data === "string" ? res.data : JSON.stringify(res.data);
        console.log("✅ API OK:", text);

        setResults((prev) => [
          { id: `${Date.now()}-${Math.random()}`, url, result: text },
          ...prev,
        ]);
      } catch (e) {
        console.warn("⚠️ API fail, re-queue:", url, e?.message || e);
        await enqueue(url);
      }
    }
  }

  // If we were launched via share (Android) and haven’t finished handling, render nothing
  if (Platform.OS === "android" && hasShareIntent && !handledShare) {
    return <View style={{ flex: 1, backgroundColor: "transparent" }} />;
  }

  // Simple UI for normal opens (Android)
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>
        Trove (Android-only)
      </Text>
      <Text style={{ marginTop: 4 }}>Queued: {queued}</Text>
      {error ? (
        <Text style={{ marginTop: 4, color: "crimson" }}>{String(error)}</Text>
      ) : null}

      <Text style={{ marginTop: 20, fontSize: 16, fontWeight: "600" }}>
        Latest results
      </Text>
      <FlatList
        data={results}
        keyExtractor={(r) => r.id}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: "#eee" }} />
        )}
        renderItem={({ item }) => (
          <Pressable>
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ fontWeight: "600" }} numberOfLines={1}>
                {item.url}
              </Text>
              <Text style={{ color: "#444" }} selectable>
                {item.result}
              </Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ color: "#777", marginTop: 8 }}>No results yet.</Text>
        }
        style={{ marginTop: 8 }}
      />
    </View>
  );
}
