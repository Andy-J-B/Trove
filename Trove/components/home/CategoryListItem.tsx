// CategoryListItem.tsx

import React from "react";
import {
  Pressable,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Category } from "../../constants/types";
import { AppText } from "../ui/AppText";

interface CategoryListItemProps {
  category: Category;
  onPress: () => void;
  onDelete: () => void;
}

export const CategoryListItem: React.FC<CategoryListItemProps> = ({
  category,
  onPress,
  onDelete,
}) => {
  const itemCount = category.itemCount ?? 0;
  const itemCountText = itemCount === 1 ? "1 item" : `${itemCount} items`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <View style={styles.content}>
        {/* Delete Button */}
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [
            styles.deleteBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={12}
        >
          <Text style={styles.deleteX}>×</Text>
        </Pressable>

        {/* Icon */}
        <View style={styles.iconContainer}>
          <Feather name="folder" size={24} color="white" />
        </View>

        {/* Text Content */}
        <View style={styles.textContainer}>
          <AppText style={styles.categoryName}>{category.name}</AppText>
          <Text style={styles.itemCount}>{itemCountText}</Text>
        </View>

        {/* Chevron */}
        <Feather
          name="chevron-right"
          size={20}
          color="rgba(255,255,255,0.4)"
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minHeight: 88,
    borderRadius: 16,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginVertical: 8,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  deleteX: {
    color: "#fff",
    fontSize: 18,
    marginTop: -1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(91,95,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  chevron: {
    marginLeft: 8,
  },
});
