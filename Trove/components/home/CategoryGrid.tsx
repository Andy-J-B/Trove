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
          <Feather name="folder" size={40} color="white" />
          <AppText bold>{item.name}</AppText>
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
          tintColor="#fff"
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
  grid: { justifyContent: "center", paddingVertical: 20, alignItems: "center" },
  row: { justifyContent: "center" },
  card: {
    width: 150,
    height: 140,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#1c1c1c",
    marginHorizontal: 7,
    marginBottom: 16,
    alignItems: "center",
  },
  cardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
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
