import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";

function titleCase(s: string) {
  if (!s) return "";
  return s
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function CategoryScreen() {
  const params = useLocalSearchParams();
  const slug = String(params.slug ?? "");
  const title = titleCase(slug);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Array<{ id: string; title: string; subtitle?: string }>>([]);

  // Minimal in-memory mock DB for demo purposes
  const db = {
    clothing: [
    { id: "c1", title: "Basic Tee", description: "Soft cotton crewneck, everyday essential." },
    { id: "c2", title: "Slim Jeans", description: "Stretch denim with a tailored fit." },
    { id: "c3", title: "Hoodie", description: "Cozy fleece with kangaroo pocket." },
    ],
    skincare: [
    { id: "s1", title: "Hydrating Serum", description: "Hyaluronic acid boost for dry skin." },
    ],
    lebron: [
    { id: "l1", title: "2018 Finals", description: "GOAT."},  
    ],
    // …other categories
    };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    try {
      const key = slug.toLowerCase();
      const data = db[key] ?? [];
      if (mounted) setItems(data);
    } catch (e: any) {
      if (mounted) setError(e?.message ?? "Failed to load data");
    } finally {
      if (mounted) setLoading(false);
    }

    return () => {
      mounted = false;
    };
  }, [slug, db]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title,
          headerBackTitleVisible: false,
          headerTintColor: "#fff",
          headerStyle: { backgroundColor: "#000" },
          headerTitleStyle: { color: "#fff", fontWeight: "800" },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
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
          keyExtractor={(it) => it.id}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => {}}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
              ) : null}
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 16 },
  backBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  backText: { color: "#fff", fontSize: 20 },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 12,
  },
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
  separator: { height: 10 },
});
