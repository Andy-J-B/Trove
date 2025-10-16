import React, { useEffect, useState, useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useShareIntent } from "expo-share-intent";
import axios from "axios";
import Constants from "expo-constants";
import { enqueue, drain } from "../src/queue";
import { HomeHeader } from "../components/home/HomeHeader";
import { CategoryGrid } from "../components/home/CategoryGrid";
import { AddCategoryModal } from "../components/home/AddCategoryModal";
import { ConfirmDeleteModal } from "../components/home/ConfirmDeleteModal";
import { AppButton } from "../components/ui/AppButton";

const EXTRACT_BASE = "http://127.0.0.1:3000";
const SERVER_URL =
  (Constants?.expoConfig?.extra &&
    (Constants.expoConfig.extra as Record<string, string>).SERVER_URL) ||
  "http://127.0.0.1:3000/api";

export default function HomeScreen() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const [mode, setMode] = useState<"unknown" | "share" | "normal">("unknown");

  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addDesc, setAddDesc] = useState("");
  const [addBusy, setAddBusy] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const shareHandledRef = useRef(false);
  const queueTimerRef = useRef<NodeJS.Timeout | number | null>(null);

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
        await axios.post(`${SERVER_URL}/extract/`, { tiktokUrl: url });
      } catch {
        break;
      }
    }
  }, [ping]);

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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const askDelete = (cat: any) => {
    setPendingDelete(cat);
    setConfirmOpen(true);
  };

  // 🟢 Add Category
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

  // 🔴 Delete Category
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
