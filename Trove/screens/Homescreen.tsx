import React, { useEffect, useState, useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useShareIntent } from "expo-share-intent";
import axios from "axios";
import Constants from "expo-constants";
import { enqueue } from "../src/queue";
import { HomeHeader } from "../components/home/HomeHeader";
import { CategoryGrid } from "../components/home/CategoryGrid";
import { AddCategoryModal } from "../components/home/AddCategoryModal";
import { ConfirmDeleteModal } from "../components/home/ConfirmDeleteModal";
import { AppButton } from "../components/ui/AppButton";
import { useQueueProcessor } from "../hooks/use-queue-processor";
import { BackHandler, Platform } from "react-native";

const EXTRACT_BASE = "http://127.0.0.1:3000";
const SERVER_URL =
  (Constants?.expoConfig?.extra &&
    (Constants.expoConfig.extra as Record<string, string>).SERVER_URL) ||
  "http://127.0.0.1:3000/api";

export default function HomeScreen() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const { processQueue } = useQueueProcessor();

  const [categories, setCategories] = useState<any[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 🔹 Fetch categories from backend
  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    setCatError("");
    try {
      const res = await axios.get(`${SERVER_URL}/categories`);
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setCategories(data);
    } catch (err) {
      console.error(err);
      setCatError("Failed to load categories");
    } finally {
      setCatLoading(false);
    }
  }, []);

  // 🔹 Handle Add Category
  const handleAddCategory = useCallback(async () => {
    if (!addName.trim()) return;
    setAddBusy(true);
    try {
      await axios.post(`${SERVER_URL}/categories`, {
        name: addName,
        description: addDesc,
      });
      setAddOpen(false);
      setAddName("");
      setAddDesc("");
      await fetchCategories();
    } catch (err) {
      console.error("Error adding category:", err);
    } finally {
      setAddBusy(false);
    }
  }, [addName, addDesc, fetchCategories]);

  // 🔹 Handle Delete Category
  const handleDeleteCategory = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    try {
      await axios.delete(`${SERVER_URL}/categories/${pendingDelete.id}`);
      setConfirmOpen(false);
      setPendingDelete(null);
      await fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
    } finally {
      setDeleteBusy(false);
    }
  }, [pendingDelete, fetchCategories]);

  // 🔹 Handle Share Intent (share to queue)
  useEffect(() => {
    const handleShareIntent = async () => {
      if (hasShareIntent && shareIntent) {
        const url = shareIntent.webUrl || shareIntent.text || "";
        console.log("Received share intent URL:", url);
        if (url) {
          await enqueue(url);
          console.log("✅ Enqueued shared URL");
        }
        await resetShareIntent();

        // 🔹 Close app automatically after enqueueing
        if (Platform.OS === "android") {
          // On Android, BackHandler.exitApp() cleanly exits
          BackHandler.exitApp();
        } else {
          // On iOS, you can’t programmatically close the app
          // Instead, just silently go to background (no redirect)
          console.log("📱 iOS: staying idle after enqueue");
        }
      }
    };
    handleShareIntent();
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  // 🔹 Start polling queue when in normal mode
  useEffect(() => {
    // skip if app was opened via share intent
    if (hasShareIntent) return;

    // immediately try once, then every 20s
    processQueue();
    queueTimerRef.current = setInterval(processQueue, 20000);

    return () => {
      if (queueTimerRef.current) clearInterval(queueTimerRef.current);
    };
  }, [hasShareIntent, processQueue]);

  // 🔹 Initial category load
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const askDelete = (cat: any) => {
    setPendingDelete(cat);
    setConfirmOpen(true);
  };

  return (
    <LinearGradient
      colors={["#000000", "#070707", "#000000"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 12 }}>
        <HomeHeader />

        <CategoryGrid
          data={categories}
          loading={catLoading}
          error={catError}
          onRefresh={fetchCategories}
          onDelete={askDelete}
        />

        <AppButton
          title="+"
          onPress={() => setAddOpen(true)}
          style={{
            position: "absolute",
            bottom: 40,
            alignSelf: "center",
            width: 64,
            height: 64,
            borderRadius: 32,
          }}
          textStyle={{ fontWeight: "800", fontSize: 30 }}
        />
      </SafeAreaView>

      <AddCategoryModal
        visible={addOpen}
        name={addName}
        desc={addDesc}
        busy={addBusy}
        onChangeName={setAddName}
        onChangeDesc={setAddDesc}
        onSubmit={handleAddCategory}
        onClose={() => setAddOpen(false)}
      />

      <ConfirmDeleteModal
        visible={confirmOpen}
        category={pendingDelete}
        busy={deleteBusy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDeleteCategory}
      />

      <StatusBar style="light" />
    </LinearGradient>
  );
}
