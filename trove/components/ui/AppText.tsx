import React from "react";
import { Text, TextProps, StyleSheet } from "react-native";

export interface AppTextProps extends TextProps {
  variant?: "title" | "body" | "label";
  bold?: boolean;
  color?: string;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = "body",
  bold = false,
  color,
  style,
  children,
  ...rest
}) => {
  const variantStyle =
    variant === "title"
      ? styles.title
      : variant === "label"
        ? styles.label
        : styles.body;

  return (
    <Text
      style={[variantStyle, bold && styles.bold, color && { color }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  body: {
    color: "#fff",
    fontSize: 15,
  },
  label: {
    color: "#ddd",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  bold: { fontWeight: "bold" },
});
