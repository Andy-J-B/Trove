import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";

type FloatingAddButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
};

export default function FloatingAddButton({ onPress }: FloatingAddButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Text style={styles.fabPlus}>＋</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    backgroundColor: "#007AFF",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  fabPlus: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "600",
    lineHeight: 34,
  },
});
