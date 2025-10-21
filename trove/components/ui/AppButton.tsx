import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  textStyle,
}) => {
  const bgStyle =
    variant === "ghost"
      ? styles.ghost
      : variant === "danger"
        ? styles.danger
        : styles.primary;

  const textColor =
    variant === "ghost" ? "#fff" : variant === "danger" ? "#fff" : "#000";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        bgStyle,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.7 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[textStyle, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  primary: { backgroundColor: "#fff" },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  danger: { backgroundColor: "#ef4444" },
});
