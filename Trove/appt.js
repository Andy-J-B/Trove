// App.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  Image,
  AppState,
  BackHandler,
  ToastAndroid,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import axios from "axios";
import { useShareIntent } from "expo-share-intent";

import { enqueue, drain, peekAll, clearQueue } from "./src/queue";

// ---------- CONFIG ----------
// Use adb reverse for dev on Android USB: adb reverse tcp:3000 tcp:3000
// Then localhost:3000 from the device maps to your laptop.
const BASE_URL = "http://localhost:3000";
// ----------------------------

// 🔊 always log on startup
console.log("🔥 App.js loaded");

const TILE_LABELS = [
  "Clothing",
  "Skincare",
  "Haircare",
  "Makeup",
  "Lebron",
  "Faker",
];
const TILE_ICONS = ["👕", "🧴", "💈", "💄", "🏀", "🎮"];
const TILES = TILE_LABELS.map((label, i) => ({
  key: String(i + 1),
  label,
  icon: TILE_ICONS[i] || "",
}));

const { width, height } = Dimensions.get("window");
const SCREEN_HORIZONTAL_PADDING = 12;
const TILE_GAP = 14;
const NUM_COLUMNS = 2;
const CARD_WIDTH =
  (width - SCREEN_HORIZONTAL_PADDING * 2 - TILE_GAP * (NUM_COLUMNS + 1)) /
  NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 0.95;
const BOTTOM_SPACER = height * 0.125;
const modernFontBold = Platform.select({
  ios: "Helvetica Neue",
  android: "Roboto",
  default: "System",
});

export default function App() {
  console.log("🔥 App component rendered");

  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent();

  const [queued, setQueued] = useState(0);
  const [results, setResults] = useState([]); // [{id, url, result}]
  const [handledShare, setHandledShare] = useState(false);
  const lastResult = results[0]?.result || "";

  useEffect(() => {
    (async () => {
      try {
        const r = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
        console.log("HEALTH OK:", r.data);
      } catch (e) {
        console.log(
          "HEALTH FAIL:",
          e.message,
          e.response?.status,
          e.response?.data
        );
      }
    })();
  }, []);

  // ---------- helpers ----------

  const processQueue = useCallback(async () => {
    const urls = await drain();
    console.log("🧹 Drain:", urls);

    for (const url of urls) {
      try {
        // ✅ send the correct body key
        const res = await axios.post(
          `${BASE_URL}/extract-products`,
          { tiktokUrl: url },
          { timeout: 15000 }
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
        break; // avoid tight loop if network is down
      }
    }
  }, []);

  const handleResetQueuePress = useCallback(async () => {
    await clearQueue();
    console.log("🧹 Queue cleared!");
    setQueued(0);
  }, []);

  // ---------- Android share → enqueue fast → exit back to TikTok ----------
  useEffect(() => {
    if (Platform.OS !== "android") return; // ignore iOS
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
          try {
            ToastAndroid.show("Saved to Trove", ToastAndroid.SHORT);
          } catch {}
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

  // ---------- Normal opens (Android): process queue on active ----------
  useEffect(() => {
    if (Platform.OS !== "android") return;
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
  }, [handledShare, processQueue]);

  // ---------- Initial queue count ----------
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (handledShare) return;
    peekAll().then((q) => {
      console.log("🔢 Initial queue size:", q.length);
      setQueued(q.length);
    });
  }, [handledShare]);

  // If we were launched via share and haven’t finished handling, render nothing (so Activity can close quickly)
  if (Platform.OS === "android" && hasShareIntent && !handledShare) {
    return <View style={{ flex: 1, backgroundColor: "transparent" }} />;
  }

  // ---------- UI: your modern gradient + grid ----------
  const renderItem = ({ item }) => (
    <Pressable
      onPress={() =>
        router.push(`/category/${encodeURIComponent(item.label.toLowerCase())}`)
      }
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.card}>
        <View style={styles.cardInner}>
          <Text style={styles.cardIcon}>{item.icon}</Text>
          <Text style={styles.cardLabel}>{item.label}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <LinearGradient
      colors={["#000000", "#070707", "#000000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          {/* Small status strip (keeps you informed without clutter) */}
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>Queued: {queued}</Text>
            {!!error && (
              <Text style={[styles.statusText, { color: "#ff7a7a" }]}>
                {String(error)}
              </Text>
            )}
          </View>

          <Pressable onPress={handleResetQueuePress} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Reset Queue</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Top: Centered logo area */}
          <View style={styles.logoWrap}>
            <View style={styles.logoRow}>
              {/* Update path if needed */}
              <Image
                source={require("./assets/images/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>TROVE</Text>
            </View>
          </View>

          {/* Grid of 6 glass tiles */}
          <FlatList
            data={TILES}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />

          {/* Last API response snippet (handy while testing; keeps console logs too) */}
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Last result</Text>
            <Text style={styles.resultText} numberOfLines={6}>
              {lastResult ? String(lastResult) : "No results yet."}
            </Text>
          </View>
        </View>
      </SafeAreaView>
      <StatusBar style="light" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: BOTTOM_SPACER,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: 6,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: { width: 64, height: 64, marginRight: 16 },
  logoText: {
    color: "white",
    fontSize: 44,
    fontWeight: "900",
    fontFamily: modernFontBold,
    letterSpacing: 3,
    textAlign: "center",
  },
  list: { flexGrow: 0 },
  grid: { justifyContent: "center", paddingVertical: 20, alignItems: "center" },
  row: { justifyContent: "center" },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#1c1c1c",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginHorizontal: TILE_GAP / 2,
    marginBottom: TILE_GAP + 6,
  },
  cardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 20,
  },
  cardIcon: { fontSize: 40 },
  cardLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: modernFontBold,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 20,
  },
  statusPill: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statusText: { color: "white", fontSize: 12 },
  resetBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255, 99, 71, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 99, 71, 0.35)",
  },
  resetBtnText: { color: "#FF9A8A", fontSize: 12, fontWeight: "700" },
  resultBox: {
    marginTop: 10,
    borderRadius: 12,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  resultTitle: { color: "white", fontWeight: "700", marginBottom: 4 },
  resultText: { color: "#CFCFCF", fontSize: 12 },
});
