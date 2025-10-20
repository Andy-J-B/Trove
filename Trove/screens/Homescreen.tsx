import React, { useEffect, useState, useCallback, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useShareIntent } from "expo-share-intent";
import axios from "axios";
import Constants from "expo-constants";
import { enqueue, clearQueue } from "../src/queue";
import { HomeHeader } from "../components/home/HomeHeader";
import { CategoryList } from "../components/home/CategoryList";
import { AddCategoryModal } from "../components/home/AddCategoryModal";
import { ConfirmDeleteModal } from "../components/home/ConfirmDeleteModal";
import { AppButton } from "../components/ui/AppButton";
import { useQueueProcessor } from "../hooks/use-queue-processor";
import { BackHandler, Platform } from "react-native";
import { getDeviceId } from "@/util/device";
import { Alert } from "react-native";

const SERVER_URL =
  (Constants?.expoConfig?.extra &&
    (Constants.expoConfig.extra as Record<string, string>).SERVER_URL) ||
  "http://127.0.0.1:3000/api";

export default function HomeScreen() {
  console.log("🏠 HomeScreen rendering...");
  
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
      // 1️⃣ Get the device ID from SecureStore / Expo
      const deviceId = await getDeviceId();
      console.log("📱 Device ID:", deviceId);

      // 2️⃣ Make the request with x-device-id header
      console.log("🌐 Fetching categories from:", `${SERVER_URL}/categories`);
      const res = await axios.get(`${SERVER_URL}/categories`, {
        headers: {
          "x-device-id": deviceId,
        },
      });

      console.log("✅ API Response status:", res.status);
      console.log("📦 API Response data:", JSON.stringify(res.data, null, 2));

      // 3️⃣ Normalize response
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      console.log("📊 Normalized categories count:", data.length);
      setCategories(data);
    } catch (err) {
      console.error("❌ Error fetching categories:", err);
      if (axios.isAxiosError(err)) {
        console.error("   Status:", err.response?.status);
        console.error("   Data:", err.response?.data);
        console.error("   Message:", err.message);
      }
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
      const deviceId = await getDeviceId();

      await axios.post(
        `${SERVER_URL}/categories`,
        {
          name: addName,
          description: addDesc,
        },
        {
          headers: {
            "x-device-id": deviceId,
          },
        }
      );

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
      const deviceId = await getDeviceId();

      await axios.delete(`${SERVER_URL}/categories/${pendingDelete.id}`, {
        headers: {
          "x-device-id": deviceId,
        },
      });

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
          try {
            // get or generate persistent unique device ID

            const deviceId = await getDeviceId();

            // enqueue the url with deviceId
            await enqueue(url, deviceId);
            console.log("✅ Enqueued shared URL with device ID:", deviceId);
          } catch (err) {
            console.error("❌ Failed to enqueue shared URL:", err);
          }
        }

        await resetShareIntent();

        // 🔹 Close app automatically after enqueueing
        if (Platform.OS === "android") {
          BackHandler.exitApp(); // clean exit
        } else {
          console.log("📱 iOS: staying idle after enqueue");
        }
      }
    };
    handleShareIntent();
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  // 🔹 Start polling queue when in normal mode
  useEffect(() => {
    if (hasShareIntent) return; // skip if app was opened via share

    // // immediately try once, then every 20s
    // processQueue();
    // queueTimerRef.current = setInterval(processQueue, 20000);

    // return () => {
    //   if (queueTimerRef.current) clearInterval(queueTimerRef.current);
    // };
  }, [hasShareIntent, processQueue]);

  // 🔹 Initial category load
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const askDelete = (cat: any) => {
    setPendingDelete(cat);
    setConfirmOpen(true);
  };

  console.log("🏠 HomeScreen render - categories:", categories.length, "loading:", catLoading);

  return (
    <LinearGradient
      colors={["#000000", "#070707", "#000000"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <HomeHeader />

        <CategoryList
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
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
          textStyle={{ fontWeight: "800", fontSize: 28 }}
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
