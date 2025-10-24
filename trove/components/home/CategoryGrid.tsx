// CategoryGrid.tsx

// Renders FlatList of CategoryCard components
import React from "react";
import {
  FlatList,
  Pressable,
  View,
  Text,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Category } from "../../constants/types";
import { AppText } from "../ui/AppText";
import { formatTitle } from "@/util/helper";

interface Props {
  data: Category[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onDelete: (cat: Category) => void;
}

const NUM_COLUMNS = 2;

export const CategoryGrid: React.FC<Props> = ({
  data,
  loading,
  error,
  onRefresh,
  onDelete,
}) => {
  const renderItem = ({ item }: { item: Category }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/category/[slug]",
          params: {
            slug: `${item.id}%CATEGORYPAGE%${encodeURIComponent(item.name.trim())}`, // 👈 both id and name combined
          },
        })
      }
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.card}>
        <Pressable
          onPress={() => onDelete(item)}
          style={({ pressed }) => [
            styles.deleteBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={12}
        >
          <Text style={styles.deleteX}>×</Text>
        </Pressable>

        <View style={styles.cardInner}>
          <Feather name={item.iconName || "folder"} size={48} color="white" />
          <AppText bold>{formatTitle(item.name)}</AppText>
          <Text style={styles.productCount}>
            {(item.productCount ?? 0) === 1
              ? `${item.productCount ?? 0} item`
              : `${item.productCount ?? 0} items`}
          </Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.grid}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRefresh}
          tintColor="#8b5cf6"
        />
      }
      ListHeaderComponent={
        error ? (
          <AppText
            color="#ff8a8a"
            style={{ textAlign: "center", marginBottom: 6 }}
          >
            {error}
          </AppText>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  grid: {
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  row: {
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
  },
  card: {
    width: 150,
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
    backgroundColor: "#1e1b2e",
    alignItems: "center",
  },
  cardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  productCount: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 4,
  },
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
});
