import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import Constants from "expo-constants";
import { Linking } from "react-native";
import axios from "axios";
import { getDeviceId } from "@/util/device";

type Product = {
  id: string | number;
  name?: string;
  title?: string;
  description?: string;
  tiktokUrl?: string;
};

function titleCase(s: string) {
  if (!s) return "";
  return s
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const SERVER_URL: string =
  (Constants?.expoConfig?.extra as any)?.SERVER_URL ||
  "http://127.0.0.1:3000/api";

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams();
  console.log(String(slug));
  const [categoryId, categoryName] = String(slug).split("%CATEGORYPAGE%", 2);
  console.log(categoryId, categoryName);

  const category = categoryName.toLowerCase();
  const title = titleCase(categoryName);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);

  // ---------------- Fetch Products ----------------
  const loadItems = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const deviceId = await getDeviceId();
      const res = await axios.get(
        `${SERVER_URL}/products/by-category/${categoryId}`,
        {
          headers: { "x-device-id": deviceId },
        }
      );
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
    } catch (e: any) {
      console.error("Error loading products:", e);
      setError(e?.message || "Failed to load products");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadItems();
    } finally {
      setRefreshing(false);
    }
  }, [loadItems]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadItems();
    })();
    return () => {
      mounted = false;
    };
  }, [loadItems]);

  // ---------------- Delete Item ----------------
  async function deleteItem(id: string | number) {
    try {
      const deviceId = await getDeviceId();
      const res = await axios.delete(`${SERVER_URL}/products/${id}`, {
        headers: { "x-device-id": deviceId },
      });
      const data = res.data;

      if (!data?.success) throw new Error(data?.error || "Delete failed");
      setItems((prev) => prev.filter((p) => String(p.id) !== String(id)));
    } catch (e: any) {
      Alert.alert("Delete failed", e?.message ?? "Unable to delete item.");
    }
  }

  function confirmDelete(id: string | number, label: string) {
    Alert.alert("Delete item", `Remove "${label}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteItem(id) },
    ]);
  }

  // ---------------- Open TikTok Link ----------------
  async function handleOpenLink(url?: string) {
    if (!url) {
      Alert.alert(
        "No link available",
        "This item doesn't have a valid TikTok URL."
      );
      return;
    }

    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error("Error opening TikTok link:", err);
      Alert.alert("Error", "Failed to open TikTok link.");
    }
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title,
          headerTintColor: "#fff",
          headerStyle: { backgroundColor: "#000" },
          headerTitleStyle: { color: "#fff", fontWeight: "800" },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={styles.backBtn}
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>
          ),
        }}
      />

      <Text style={styles.title}>{title}</Text>

      {loading ? (
        <View style={styles.centerRow}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : items.length === 0 ? (
        <Text style={styles.subtitle}>No items found for this category.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => {
            const displayTitle = item.name || item.title || `#${item.id}`;
            return (
              <View style={styles.cardRow}>
                <Pressable
                  style={styles.card}
                  onPress={() => handleOpenLink(item.tiktokUrl)}
                >
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {displayTitle}
                  </Text>
                  {!!item.description && (
                    <Text style={styles.cardSubtitle} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.deleteBtn}
                  onPress={() => confirmDelete(item.id, displayTitle)}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  backText: { color: "#fff", fontSize: 20 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 12 },
  subtitle: { color: "#aaa", fontSize: 14 },
  loadingText: { color: "#fff", marginLeft: 8 },
  errorText: { color: "#ff6b6b", fontSize: 14 },
  centerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardRow: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  card: {
    flex: 1,
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cardSubtitle: { color: "#bbb", marginTop: 4 },
  deleteBtn: {
    alignSelf: "stretch",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    borderColor: "rgba(255, 59, 48, 0.45)",
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: "center",
    minWidth: 76,
  },
  deleteText: { color: "#ff6b6b", fontWeight: "800", textAlign: "center" },
  separator: { height: 10 },
});
