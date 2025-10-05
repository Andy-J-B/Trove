// App.js
import React, { useEffect, useState, useCallback, useRef } from "react";
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
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import axios from "axios";
import { useShareIntent } from "expo-share-intent";
import Constants from "expo-constants";
// If you're using react-native-dotenv, you can also:
// import { SERVER_URL as ENV_SERVER_URL } from "@env";

import { enqueue, drain, peekAll, clearQueue } from "./src/queue";

// ---------- CONFIG ----------
// For the extract-products route you already had:
const EXTRACT_BASE = "http://127.0.0.1:3000"; // keep your previous behavior (use adb reverse)
// Server URL for categories comes from env:
const SERVER_URL =
  // Prefer Expo extra
  (Constants?.expoConfig?.extra && Constants.expoConfig.extra.SERVER_URL) ||
  // Or dotenv if you use it: ENV_SERVER_URL ||
  "http://127.0.0.1:3000/api";
// ----------------------------

console.log("🔥 App.js loaded");

// ---- UI constants
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

// Fallback tiles if API isn’t reachable
const FALLBACK_TILE_LABELS = [
  "Clothing",
  "Skincare",
  "Haircare",
  "Makeup",
  "Lebron",
  "Faker",
];
const ICONS = {
  clothing: "👕",
  skincare: "🧴",
  haircare: "💈",
  makeup: "💄",
  lebron: "🏀",
  faker: "🎮",
};
const iconFor = (name) => ICONS[name?.toLowerCase?.()] || "🗂️";

export default function App() {
  console.log("🔥 App component rendered");

  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent();

  const [queued, setQueued] = useState(0);
  const [results, setResults] = useState([]); // [{id, url, result}]
  const lastResult = results[0]?.result || "";
  const [mode, setMode] = useState("unknown"); // "unknown" | "share" | "normal"

  // categories state
  const [categories, setCategories] = useState([]); // [{ id?, name }]
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  // Prevent double-handling a single share launch
  const shareHandledRef = useRef(false);

  // ---- helpers ----
  const ping = useCallback(async () => {
    try {
      const r = await axios.get(`${EXTRACT_BASE}/health`, { timeout: 5000 });
      console.log("🌐 Health OK:", r.status, r.data);
      return true;
    } catch (e) {
      console.warn("🌐 Health FAIL:", e?.message);
      return false;
    }
  }, []);

  const processQueue = useCallback(async () => {
    const ok = await ping();
    if (!ok) {
      console.warn("🚫 Backend not reachable; will retry later");
      return;
    }

    const urls = await drain();
    console.log("🧹 Drain:", urls);

    for (const url of urls) {
      try {
        const res = await axios.post(
          `${EXTRACT_BASE}/extract-products`,
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

    peekAll().then((q) => setQueued(q.length));
  }, [ping]);

  const handleResetQueuePress = useCallback(async () => {
    await clearQueue();
    console.log("🧹 Queue cleared!");
    setQueued(0);
  }, []);

  // ---- categories fetcher (uses SERVER_URL env) ----
  const fetchCategories = useCallback(async () => {
    const base = String(SERVER_URL).replace(/\/$/, "");
    const url = `${base}/categories`;
    setCatLoading(true);
    setCatError("");
    try {
      const res = await axios.get(url, { timeout: 10000 });
      const payload = res?.data;
      if (!payload?.success) throw new Error(payload?.error || "Unknown error");
      const data = Array.isArray(payload.data) ? payload.data : [];
      // Expecting [{ id, name }, ...]
      setCategories(
        data.map((c, i) => ({
          key: String(c.id ?? i + 1),
          label: c.name,
          icon: iconFor(c.name),
        }))
      );
      console.log("📦 Categories loaded:", data.length);
    } catch (e) {
      console.warn("❌ Categories fetch failed:", e?.message || e);
      setCatError(e?.message || "Failed to load categories");
      // fallback to static
      setCategories(
        FALLBACK_TILE_LABELS.map((label, i) => ({
          key: String(i + 1),
          label,
          icon: iconFor(label),
        }))
      );
    } finally {
      setCatLoading(false);
    }
  }, []);

  // Decide mode (share vs normal) once useShareIntent resolves
  useEffect(() => {
    if (Platform.OS !== "android") {
      setMode("normal");
      return;
    }
    if (hasShareIntent && shareIntent) setMode("share");
    else if (hasShareIntent === false) setMode("normal");
  }, [hasShareIntent, shareIntent]);

  // In dev, prevent Expo Dev Client keep-awake during share launches
  useEffect(() => {
    async function disableKeepAwakeIfSharing() {
      if (!__DEV__) return;
      if (Platform.OS !== "android") return;
      if (!hasShareIntent || !shareIntent) return;
      try {
        const { deactivateKeepAwake } = await import("expo-keep-awake");
        await deactivateKeepAwake();
        console.log("KeepAwake deactivated for share launch");
      } catch (e) {
        console.log(
          "KeepAwake deactivate failed (safe to ignore):",
          e?.message || e
        );
      }
    }
    disableKeepAwakeIfSharing();
  }, [hasShareIntent, shareIntent]);

  // --- SHARE MODE: enqueue + exit back to TikTok (NO draining)
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (mode !== "share") return;
    if (shareHandledRef.current) return;

    shareHandledRef.current = true;
    (async () => {
      try {
        const url = shareIntent?.webUrl || shareIntent?.text || "";
        console.log("📩 Share received, URL:", url);

        if (url) {
          await enqueue(url);
          console.log("🧺 Enqueued:", url);
          try {
            ToastAndroid.show("Saved to Trove", ToastAndroid.SHORT);
          } catch {}
          peekAll().then((q) => setQueued(q.length));
        } else {
          console.log("ℹ️ Share payload had no URL");
        }

        resetShareIntent();
        setTimeout(() => BackHandler.exitApp(), 200); // bounce back to TikTok
      } catch (e) {
        console.warn("❌ Share enqueue failed:", e);
        // Don't exit; let UI load so you can debug
      }
    })();
  }, [mode, shareIntent, resetShareIntent]);

  // --- NORMAL MODE: process queue on foreground + once on open; also fetch categories
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (mode !== "normal") return;

    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") {
        await processQueue();
        await fetchCategories();
      }
    });

    (async () => {
      await processQueue();
      await fetchCategories();
    })();

    return () => sub.remove();
  }, [mode, processQueue, fetchCategories]);

  // Initial queue size (normal launches only)
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (mode !== "normal") return;
    peekAll().then((q) => setQueued(q.length));
  }, [mode]);

  // If launched via share, render almost nothing so exit is instant
  if (Platform.OS === "android" && mode === "share") {
    return <View style={{ flex: 1, backgroundColor: "transparent" }} />;
  }

  // ---- UI ----
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
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>Queued: {queued}</Text>
            {!!error && (
              <Text style={[styles.statusText, { color: "#ff7a7a" }]}>
                {String(error)}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={processQueue} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Process Now</Text>
            </Pressable>

            <Pressable onPress={handleResetQueuePress} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Reset Queue</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.logoWrap}>
            <View style={styles.logoRow}>
              <Image
                source={require("./assets/images/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>TROVE</Text>
            </View>
          </View>

          <FlatList
            data={categories} // <-- dynamic data from API (fallback applied if needed)
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={catLoading}
                onRefresh={fetchCategories}
                tintColor="#fff"
              />
            }
            ListHeaderComponent={
              catError ? (
                <Text
                  style={{
                    color: "#ff8a8a",
                    textAlign: "center",
                    marginBottom: 6,
                  }}
                >
                  {catError}
                </Text>
              ) : null
            }
          />

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
  cardIcon: { fontSize: 40, color: "#fff" },
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
