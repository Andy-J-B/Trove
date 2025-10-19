// app/product/[productId].tsx   (only the changed parts are shown)

import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
  Image,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import Constants from "expo-constants";
import { Linking } from "react-native";
import axios from "axios";
import { getDeviceId } from "@/util/device";
import { ShoppingUrl } from "@/constants/types";

type Product = {
  id: string;
  categoryId: string;
  name: string;
  price?: string;
  tiktokUrl: string;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  isDeleted: boolean;
  mentionedContent?: string | null;
  shoppingUrls: ShoppingUrl[];
};

const SERVER_URL: string =
  (Constants?.expoConfig?.extra as any)?.SERVER_URL ||
  "http://127.0.0.1:3000/api";

export default function ProductScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* -------------------------------------------------
     ONE‑CALL loader – fetches product + embedded shopping URLs
  ------------------------------------------------- */
  const loadProduct = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const deviceId = await getDeviceId();

      const res = await axios.get(`${SERVER_URL}/products/${productId}`, {
        headers: { "x-device-id": deviceId },
      });

      setProduct(res.data as Product);
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load product");
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  /* -------------------------------------------------
     UI helpers – open TikTok or a shopping link
  ------------------------------------------------- */
  const openLink = async (url?: string) => {
    if (!url) {
      Alert.alert("No link", "This item doesn't have a valid URL.");
      return;
    }
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.error("Link error:", err);
      Alert.alert("Error", "Could not open the link.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: product?.name ?? "Product",
          headerTintColor: "#fff",
          headerStyle: { backgroundColor: "#000" },
          headerTitleStyle: { color: "#fff", fontWeight: "800" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
          ),
        }}
      />

      {loading ? (
        <View style={styles.centerRow}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : product ? (
        <>
          {/* -------------------- Basic product info -------------------- */}
          <Text style={styles.title}>{product.name}</Text>
          {product.description && (
            <Text style={styles.description}>{product.description}</Text>
          )}
          {product.price && (
            <Text style={styles.price}>Price: {product.price}</Text>
          )}

          {/* -------------------- TikTok button -------------------- */}
          <Pressable
            style={styles.tiktokBtn}
            onPress={() => openLink(product.tiktokUrl)}
          >
            <Text style={styles.tiktokText}>Open in TikTok</Text>
          </Pressable>

          {/* -------------------- Shopping URLs list -------------------- */}
          <Text style={styles.sectionHeader}>Shop these items:</Text>

          {product.shoppingUrls.length === 0 ? (
            <Text style={styles.noShop}>No shopping links found.</Text>
          ) : (
            <FlatList
              data={product.shoppingUrls}
              keyExtractor={(it) => it.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.shopRow}
                  onPress={() => openLink(item.url)}
                >
                  {/* Thumbnail */}
                  {item.thumbnail ? (
                    <Image
                      source={{ uri: item.thumbnail }}
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.thumbnailPlaceholder} />
                  )}

                  {/* Info column */}
                  <View style={styles.shopInfo}>
                    {/* Vendor name + logo */}
                    <View style={styles.vendorRow}>
                      {item.sourceIcon ? (
                        <Image
                          source={{ uri: item.sourceIcon }}
                          style={styles.vendorIcon}
                        />
                      ) : null}
                      <Text style={styles.vendorName}>
                        {item.source ?? "Unknown store"}
                      </Text>
                    </View>

                    {/* Price */}
                    <Text style={styles.priceText}>
                      {item.price ? `${item.price}` : "Price not listed"}
                    </Text>

                    {/* Delivery badge */}
                    {item.delivery ? (
                      <View style={styles.deliveryBadge}>
                        <Text style={styles.deliveryText}>{item.delivery}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Simple chevron indicator */}
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              )}
              ItemSeparatorComponent={() => <View style={styles.sep} />}
            />
          )}
        </>
      ) : null}
    </View>
  );
}

/* -----------------------------------------------------------------
   Styles – added only the new ones, keep the rest you already had.
----------------------------------------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  backText: { color: "#fff", fontSize: 20, marginBottom: 12 },

  title: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 8 },
  description: { color: "#ccc", fontSize: 14, marginBottom: 6 },
  price: { color: "#ffdf7f", fontSize: 16, marginBottom: 12 },

  loadingText: { color: "#fff", marginLeft: 8 },
  errorText: { color: "#ff6b6b", fontSize: 14 },
  centerRow: { flexDirection: "row", alignItems: "center", gap: 6 },

  tiktokBtn: {
    backgroundColor: "#1a1a1a",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
    alignItems: "center",
  },
  tiktokText: { color: "#00f5d4", fontWeight: "600" },

  sectionHeader: {
    color: "#fff",
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },

  /* ---------- NEW: shopping‑url row ---------- */
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 8,
    padding: 8,
  },

  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: "#222",
  },

  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 4,
    backgroundColor: "#333",
  },

  shopInfo: { flex: 1, marginLeft: 10 },

  vendorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  vendorIcon: { width: 16, height: 16, marginRight: 6 },

  vendorName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  priceText: {
    color: "#ffdf7f",
    fontSize: 15,
    fontWeight: "500",
  },

  deliveryBadge: {
    marginTop: 4,
    backgroundColor: "rgba(0,200,0,0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },

  deliveryText: {
    color: "#00ff7f",
    fontSize: 12,
    fontWeight: "600",
  },

  chevron: { color: "#777", fontSize: 20, marginLeft: 8 },

  noShop: { color: "#888", fontStyle: "italic", marginTop: 4 },

  sep: { height: 10 },
});
