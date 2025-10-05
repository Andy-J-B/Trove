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
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import axios from "axios";
import { useShareIntent } from "expo-share-intent";
import Constants from "expo-constants";
import { Feather } from "@expo/vector-icons";

import { enqueue, drain } from "./src/queue";

// ---------- CONFIG ----------
const EXTRACT_BASE = "http://127.0.0.1:3000"; // replace for prod builds
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

// small helper

export default function App() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  const [mode, setMode] = useState("unknown"); // "unknown" | "share" | "normal"
  const [categories, setCategories] = useState([]); // [{ id, key, label, icon }]
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  // ---- NEW: modal state for Add + Delete ----
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { id, label } or null
  const [deleteBusy, setDeleteBusy] = useState(false);

  // Prevent double-handling a single share launch
  const shareHandledRef = useRef(false);
  const queueTimerRef = useRef(null);

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
        // If this fails, we simply stop processing now (queue item remains removed).
        // If you prefer to re-queue on failure, swap to a remove-after-success pattern.
        break;
      }
    }
  }, [ping]);

  const fetchCategories = useCallback(async (signal) => {
    const url = `${SERVER_URL}/categories`;
    setCatLoading(true);
    setCatError("");
    try {
      const res = await axios.get(url, { timeout: 10000, signal });
      console.log(res);

      const payload = res?.data;
      if (!payload?.success) throw new Error(payload?.error || "Error");
      const data = Array.isArray(payload.data) ? payload.data : [];

      setCategories(
        data.map((c, i) => ({
          id: c.id ?? i + 1,
          key: String(c.id ?? i + 1),
          label: c.name,
          icon: c.icon || "folder", // Feather's clean outline folder
        }))
      );
    } catch {
      setCatError("Failed to load categories");
      setCategories(
        FALLBACK_TILE_LABELS.map((label, i) => ({
          id: `fallback-${i + 1}`,
          key: String(i + 1),
          label,
          icon: "🗂️", // or call autoIconFor(label)
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
        }
        resetShareIntent();
        setTimeout(() => BackHandler.exitApp(), 200);
      } catch {
        // fall through to UI if enqueue fails
      }
    })();
  }, [mode, shareIntent, resetShareIntent]);

  // App.js (add near your share-handling effect)
  useEffect(() => {
    async function disableKeepAwakeIfSharing() {
      if (!__DEV__) return;
      if (Platform.OS !== "android") return;
      if (!hasShareIntent || !shareIntent) return;
      try {
        const { deactivateKeepAwake } = await import("expo-keep-awake");
        await deactivateKeepAwake(); // prevent the dev client from trying to keep screen on
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

  useEffect(() => {
    if (Platform.OS !== "android") return;
    if (mode !== "normal") return;

    function onActive() {
      // cancel any prior timer
      if (queueTimerRef.current) {
        clearTimeout(queueTimerRef.current);
        queueTimerRef.current = null;
      }
      // abort controller for fetchCategories (if we background quickly)
      const ac = new AbortController();

      // 1) start categories fetch right away
      fetchCategories(ac.signal);

      // 2) schedule queue processing after 1s
      queueTimerRef.current = setTimeout(() => {
        queueTimerRef.current = null;
        processQueue();
      }, 1000);

      // return a per-activation cleanup (we’ll call it when state changes)
      return () => {
        ac.abort();
        if (queueTimerRef.current) {
          clearTimeout(queueTimerRef.current);
          queueTimerRef.current = null;
        }
      };
    }

    // Handle current state now
    let cleanup = null;
    if (AppState.currentState === "active") {
      cleanup = onActive();
    }

    // Subscribe to future state changes
    const sub = AppState.addEventListener("change", (state) => {
      // clean the previous activation resources
      if (cleanup) cleanup();
      cleanup = null;
      if (state === "active") {
        cleanup = onActive();
      }
    });

    // unmount
    return () => {
      sub.remove();
      if (cleanup) cleanup();
      if (queueTimerRef.current) {
        clearTimeout(queueTimerRef.current);
        queueTimerRef.current = null;
      }
    };
  }, [mode, fetchCategories, processQueue]);

  // ---- Actions: Add Category ----
  const openAdd = () => {
    setAddName("");
    setAddDesc("");
    setAddOpen(true);
  };

  const submitAdd = async () => {
    if (!addName.trim() || !addDesc.trim()) {
      try {
        ToastAndroid.show(
          "Name and Description are required",
          ToastAndroid.SHORT
        );
      } catch {}
      return;
    }
    setAddBusy(true);
    try {
      const res = await axios.post(`${SERVER_URL}/categories`, {
        name: addName.trim(),
        description: addDesc.trim(),
      });
      const ok = res?.data?.success;
      if (!ok) throw new Error(res?.data?.error || "Failed to create category");
      setAddOpen(false);
      await fetchCategories();
      try {
        ToastAndroid.show("Category added", ToastAndroid.SHORT);
      } catch {}
    } catch (e) {
      try {
        ToastAndroid.show(
          String(e?.response?.data?.error || e?.message || "Error"),
          ToastAndroid.SHORT
        );
      } catch {}
    } finally {
      setAddBusy(false);
    }
  };

  // ---- Actions: Delete Category ----
  const askDelete = (cat) => {
    setPendingDelete(cat);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete?.id) {
      setConfirmOpen(false);
      return;
    }
    setDeleteBusy(true);
    try {
      const res = await axios.delete(
        `${SERVER_URL}/categories/${pendingDelete.id}`
      );
      const ok = res?.data?.success;
      if (!ok) throw new Error(res?.data?.error || "Failed to delete category");
      setConfirmOpen(false);
      setPendingDelete(null);
      await fetchCategories();
      try {
        ToastAndroid.show("Category deleted", ToastAndroid.SHORT);
      } catch {}
    } catch (e) {
      try {
        ToastAndroid.show(
          String(e?.response?.data?.error || e?.message || "Error"),
          ToastAndroid.SHORT
        );
      } catch {}
    } finally {
      setDeleteBusy(false);
    }
  };

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
        {/* Delete "X" in top-right */}
        <Pressable
          onPress={() => askDelete(item)}
          style={({ pressed }) => [
            styles.deleteBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={12}
        >
          <Text style={styles.deleteX}>×</Text>
        </Pressable>

        <View style={styles.cardInner}>
          <Feather name={item.icon} size={40} color="white" />
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
          <View />
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

        {/* Floating Add Button */}
        <Pressable
          onPress={openAdd}
          style={({ pressed }) => [
            styles.fab,
            { transform: [{ scale: pressed ? 0.98 : 1 }] },
          ]}
        >
          <Text style={styles.fabPlus}>＋</Text>
        </Pressable>
      </SafeAreaView>

      {/* Add Category Modal */}
      <Modal
        visible={addOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Category</Text>

            <TextInput
              placeholder="Name *"
              placeholderTextColor="#9aa0a6"
              value={addName}
              onChangeText={setAddName}
              style={styles.input}
            />
            <TextInput
              placeholder="Description *"
              placeholderTextColor="#9aa0a6"
              value={addDesc}
              onChangeText={setAddDesc}
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setAddOpen(false)}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnGhost,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={submitAdd}
                disabled={addBusy}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnPrimary,
                  (pressed || addBusy) && { opacity: 0.9 },
                ]}
              >
                {addBusy ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.btnPrimaryText}>Done</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Category?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to delete this category
              {pendingDelete?.label ? ` (“${pendingDelete.label}”)` : ""}?{"\n"}
              This will delete all items under this category!
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => setConfirmOpen(false)}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnGhost,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.btnGhostText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={confirmDelete}
                disabled={deleteBusy}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnDanger,
                  (pressed || deleteBusy) && { opacity: 0.9 },
                ]}
              >
                {deleteBusy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnDangerText}>OK</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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

  // Delete "X" button
  deleteBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  deleteX: { color: "#fff", fontSize: 18, marginTop: -1 },

  // Floating Add Button
  fab: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fabPlus: { fontSize: 34, color: "#000", fontWeight: "900", marginTop: -2 },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 16,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
    textAlign: "center",
  },
  modalBody: {
    color: "#e5e7eb",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  btnGhostText: { color: "#fff", fontWeight: "700" },
  btnPrimary: { backgroundColor: "#fff" },
  btnPrimaryText: { color: "#000", fontWeight: "800" },
  btnDanger: { backgroundColor: "#ef4444" },
  btnDangerText: { color: "#fff", fontWeight: "800" },
});
