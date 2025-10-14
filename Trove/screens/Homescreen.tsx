import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  RefreshControl,
  AppState,
  Platform,
  ToastAndroid,
  BackHandler,
  Image,
  AppStateStatus,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useShareIntent } from "expo-share-intent";
import { enqueue } from "@/src/queue";
import { useCategories, Category } from "../hooks/use-categories";
import { useQueueProcessor } from "../hooks/use-queue-processor";
import AddCategoryModal from "../components/add-category-modal";
import DeleteConfirmModal from "../components/delete-confirm-modal";
import FloatingAddButton from "../components/floating-add-button";
import { BOTTOM_SPACER } from "../util/config";
import CategoryCard from "@/components/category-card";

type Mode = "unknown" | "normal" | "share";

export default function HomeScreen() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();
  const { categories, loading, error, fetchCategories } = useCategories();
  const { processQueue } = useQueueProcessor();
  const [addName, setAddName] = useState<string>("");
  const [addDesc, setAddDesc] = useState<string>("");
  const [addBusy, setAddBusy] = useState<boolean>(false);

  const [addOpen, setAddOpen] = useState<boolean>(false);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);

  const shareHandledRef = useRef<boolean>(false);
  const queueTimerRef = useRef<number | null>(null);
  const [deleteBusy, setDeleteBusy] = useState<boolean>(false);

  const [mode, setMode] = useState<Mode>("unknown");

  // handle share mode
  useEffect(() => {
    if (Platform.OS !== "android") setMode("normal");
    else if (hasShareIntent && shareIntent) setMode("share");
    else if (hasShareIntent === false) setMode("normal");
  }, [hasShareIntent, shareIntent]);

  // share: enqueue URL
  useEffect(() => {
    if (
      Platform.OS !== "android" ||
      mode !== "share" ||
      shareHandledRef.current
    )
      return;

    shareHandledRef.current = true;
    (async () => {
      const url = shareIntent?.webUrl || shareIntent?.text || "";
      if (url) {
        await enqueue(url);
        ToastAndroid.show("Saved to Trove", ToastAndroid.SHORT);
      }
      resetShareIntent();
      setTimeout(() => BackHandler.exitApp(), 200);
    })();
  }, [mode, shareIntent, resetShareIntent]);

  // main refresh
  useEffect(() => {
    if (Platform.OS !== "android" || mode !== "normal") return;

    function onActive() {
      const ac = new AbortController();
      fetchCategories(ac.signal);
      queueTimerRef.current = setTimeout(processQueue, 1000);
      return () => {
        ac.abort();
        if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
      };
    }

    let cleanup: (() => void) | null = null;
    if (AppState.currentState === "active") cleanup = onActive();

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (cleanup) cleanup();
      if (state === "active") cleanup = onActive();
    });

    return () => {
      sub.remove();
      if (cleanup) cleanup();
    };
  }, [mode, fetchCategories, processQueue]);

  const askDelete = (cat: Category) => {
    setPendingDelete(cat);
    setConfirmOpen(true);
  };

  const submitAdd = async () => {
    setAddBusy(true);
    try {
      // Call API to add category here
      // e.g., await api.post("/categories", { name: addName, desc: addDesc });
      setAddName("");
      setAddDesc("");
      setAddOpen(false);
      await fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setAddBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteBusy(true);
    try {
      // Call API to delete
      // await api.delete(`/categories/${pendingDelete.id}`);
      setPendingDelete(null);
      setConfirmOpen(false);
      await fetchCategories();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <LinearGradient colors={["#000", "#070707", "#000"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 12 }}>
        <StatusBar style="light" />
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            paddingBottom: BOTTOM_SPACER,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={{ width: 64, height: 64 }}
              resizeMode="contain"
            />
            <Text style={{ color: "white", fontSize: 44, fontWeight: "900" }}>
              TROVE
            </Text>
          </View>

          <FlatList
            data={categories}
            renderItem={({ item }) => (
              <CategoryCard item={item} onDelete={askDelete} />
            )}
            numColumns={2}
            keyExtractor={(i) => i.key}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => fetchCategories()}
                tintColor="#fff"
              />
            }
            ListHeaderComponent={
              error ? (
                <Text style={{ color: "#ff8a8a", textAlign: "center" }}>
                  {error}
                </Text>
              ) : null
            }
            ListFooterComponent={<View style={{ height: 50 }} />}
          />

          <FloatingAddButton onPress={() => setAddOpen(true)} />

          <AddCategoryModal
            visible={addOpen}
            name={addName}
            desc={addDesc}
            onChangeName={setAddName}
            onChangeDesc={setAddDesc}
            onSubmit={submitAdd}
            onClose={() => setAddOpen(false)}
            busy={addBusy}
          />

          <DeleteConfirmModal
            visible={confirmOpen}
            label={pendingDelete?.label || ""}
            onCancel={() => setConfirmOpen(false)}
            onConfirm={confirmDelete}
            busy={deleteBusy}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
