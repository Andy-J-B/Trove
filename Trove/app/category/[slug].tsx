// app/category/[slug].tsx
import React, { useEffect, useCallback, useState } from "react";
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
import { Swipeable } from "react-native-gesture-handler";

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
  const [categoryId, categoryName] = String(slug).split("%CATEGORYPAGE%", 2);

  const category = categoryName.toLowerCase();
  const title = titleCase(categoryName);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);

  // -------------------------------------------------
  // Load products for the selected category
  // -------------------------------------------------
  const loadItems = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const deviceId = await getDeviceId();
      const res = await axios.get(
        `${SERVER_URL}/products/by-category/${categoryId}`,
        { headers: { "x-device-id": deviceId } }
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
  }, [categoryId]);

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
      if (mounted) await loadItems();
    })();
    return () => {
      mounted = false;
    };
  }, [loadItems]);

  // -------------------------------------------------
  // Delete a product (kept unchanged)
  // -------------------------------------------------
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

  // -------------------------------------------------
  // Navigation – open the product‑detail page instead of TikTok
  // -------------------------------------------------
  const goToProduct = (productId: string | number) => {
    // The product detail screen lives at /product/[productId]
    router.push(`/product/${productId}`);
  };

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
            
            const renderRightActions = () => (
              <Pressable
                style={styles.deleteAction}
                onPress={() => confirmDelete(item.id, displayTitle)}
              >
                <Text style={styles.deleteActionText}>Delete</Text>
              </Pressable>
            );

            return (
              <Swipeable renderRightActions={renderRightActions}>
                <Pressable
                  style={styles.card}
                  onPress={() => goToProduct(item.id)}
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
              </Swipeable>
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

/* -------------------------------------------------
   Styles (unchanged)
------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  backText: { color: "#fff", fontSize: 20 },
  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 12 },
  subtitle: { color: "#aaa", fontSize: 14 },
  loadingText: { color: "#fff", marginLeft: 8 },
  errorText: { color: "#ff6b6b", fontSize: 14 },
  centerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  card: {
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cardSubtitle: { color: "#bbb", marginTop: 4 },
  deleteAction: {
    backgroundColor: "#ff3b30",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 10,
    marginLeft: 8,
  },
  deleteActionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  separator: { height: 10 },
});
