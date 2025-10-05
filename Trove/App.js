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

import { enqueue, drain, peekAll, clearQueue } from "./src/queue";

// ---------- CONFIG ----------
const EXTRACT_BASE = "http://127.0.0.1:3000"; // use adb reverse in dev; replace for prod builds
const SERVER_URL =
  (Constants?.expoConfig?.extra && Constants.expoConfig.extra.SERVER_URL) ||
  "http://127.0.0.1:3000/api";
// ----------------------------

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
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  const [queued, setQueued] = useState(0);
  const [mode, setMode] = useState("unknown"); // "unknown" | "share" | "normal"

  // categories state
  const [categories, setCategories] = useState([]); // [{ key, label, icon }]
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  // Prevent double-handling a single share launch
  const shareHandledRef = useRef(false);

  // ---- helpers ----
  const ping = useCallback(async () => {
    try {
      await axios.get(`${EXTRACT_BASE}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }, []);

  const processQueue = useCallback(async () => {
    const ok = await ping();
    if (!ok) return;

    const urls = await drain();
    for (const url of urls) {
      try {
        await axios.post(
          `${EXTRACT_BASE}/extract-products`,
          { tiktokUrl: url },
          { timeout: 15000 }
        );
      } catch {
        await enqueue(url);
        break;
      }
    }
    peekAll().then((q) => setQueued(q.length));
  }, [ping]);

  const handleResetQueuePress = useCallback(async () => {
    await clearQueue();
    setQueued(0);
  }, []);

  // ---- categories fetcher ----
  const fetchCategories = useCallback(async () => {
    const base = String(SERVER_URL).replace(/\/$/, "");
    const url = `${base}/categories`;
    setCatLoading(true);
    setCatError("");
    try {
      const res = await axios.get(url, { timeout: 10000 });
      const payload = res?.data;
      if (!payload?.success) throw new Error(payload?.error || "Error");
      const data = Array.isArray(payload.data) ? payload.data : [];
      setCategories(
        data.map((c, i) => ({
          key: String(c.id ?? i + 1),
          label: c.name,
          icon: iconFor(c.name),
        }))
      );
    } catch (e) {
      setCatError("Failed to load categories");
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

  // Decide mode
  useEffect(() => {
    if (Platform.OS !== "android") {
      setMode("normal");
      return;
    }
    if (hasShareIntent && shareIntent) setMode("share");
    else if (hasShareIntent === false) setMode("normal");
  }, [hasShareIntent, shareIntent]);

  // --- SHARE MODE: enqueue + exit (NO draining)
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (mode !== "share") return;
    if (shareHandledRef.current) return;

    shareHandledRef.current = true;
    (async () => {
      try {
        const url = shareIntent?.webUrl || shareIntent?.text || "";
        if (url) {
          await enqueue(url);
          try {
            ToastAndroid.show("Saved to Trove", ToastAndroid.SHORT);
          } catch {}
          peekAll().then((q) => setQueued(q.length));
        }
        resetShareIntent();
        setTimeout(() => BackHandler.exitApp(), 200);
      } catch {
        // fall through to UI if enqueue fails
      }
    })();
  }, [mode, shareIntent, resetShareIntent]);

  // Process on foreground (normal mode) with a short delay; also fetch categories
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (mode !== "normal") return;

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        const timer = setTimeout(() => {
          processQueue().then(async () => setQueued(await peekAll()));
        }, 5000);
        return () => clearTimeout(timer);
      }
    });

    if (AppState.currentState === "active") {
      const timer = setTimeout(() => {
        processQueue().then(async () => setQueued(await peekAll()));
      }, 5000);
      return () => clearTimeout(timer);
    }

    peekAll().then(setQueued);
    return () => sub.remove();
  }, [mode, processQueue]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (mode !== "normal") return;

    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active") await fetchCategories();
    });
    (async () => {
      await fetchCategories();
    })();
    return () => sub.remove();
  }, [mode, fetchCategories]);

  // Initial queue size (normal launches)
  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (mode !== "normal") return;
    peekAll().then((q) => setQueued(q.length));
  }, [mode]);

  // Share launch: render nothing (fast exit)
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
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
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
            data={categories}
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
});
