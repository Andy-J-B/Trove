import React from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { CARD_WIDTH, CARD_HEIGHT, modernFontBold } from "../util/config";
import { Category } from "../hooks/use-categories";

interface Props {
  item: Category;
  onDelete: (item: Category) => void;
}

export default function CategoryCard({ item, onDelete }: Props) {
  return (
    <Pressable
      onPress={() =>
        router.push(`/category/${encodeURIComponent(item.label.toLowerCase())}`)
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
          <Feather name={item.icon} size={40} color="white" />
          <Text style={styles.cardLabel}>{item.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    margin: 8,
  },
  cardInner: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  deleteX: { color: "#fff", fontSize: 18 },
  cardLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: modernFontBold,
  },
});
