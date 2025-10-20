// CategoryList.tsx

import React from "react";
import {
  FlatList,
  View,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Category } from "../../constants/types";
import { CategoryListItem } from "./CategoryListItem";
import { AppText } from "../ui/AppText";

interface CategoryListProps {
  data: Category[];
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onDelete: (category: Category) => void;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  data,
  loading,
  error,
  onRefresh,
  onDelete,
}) => {
  const renderItem = ({ item }: { item: Category }) => (
    <CategoryListItem
      category={item}
      onPress={() =>
        router.push({
          pathname: "/category/[slug]",
          params: {
            slug: `${item.id}%CATEGORYPAGE%${encodeURIComponent(item.name.trim())}`,
          },
        })
      }
      onDelete={() => onDelete(item)}
    />
  );

  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <AppText style={styles.emptyText}>No categories yet</AppText>
        <AppText style={styles.emptySubtext}>
          Tap the + button to create your first category
        </AppText>
      </View>
    );
  };

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.contentContainer}
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
            style={styles.errorText}
          >
            {error}
          </AppText>
        ) : null
      }
      ListEmptyComponent={renderEmptyState}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    paddingBottom: 100, // Extra padding for floating button
  },
  errorText: {
    textAlign: "center",
    marginBottom: 12,
    marginHorizontal: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },
});
