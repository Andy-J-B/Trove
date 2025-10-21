import React from "react";
import { Modal, View, StyleSheet, ViewStyle } from "react-native";

export interface AppModalProps {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  cardStyle?: ViewStyle;
}

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  onRequestClose,
  children,
  cardStyle,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onRequestClose}
  >
    <View style={styles.backdrop}>
      <View style={[styles.card, cardStyle]}>{children}</View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 16,
    backgroundColor: "#1c1c1c",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
});
