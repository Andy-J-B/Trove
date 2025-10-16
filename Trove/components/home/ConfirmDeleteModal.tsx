// ConfirmDeleteModal.tsx

// Simple confirmation dialog
import React from "react";
import { View, StyleSheet } from "react-native";
import { AppModal } from "../ui/AppModal";
import { AppButton } from "../ui/AppButton";
import { AppText } from "../ui/AppText";
import { Category } from "../../constants/types";

interface Props {
  visible: boolean;
  category?: Category | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<Props> = ({
  visible,
  category,
  busy,
  onClose,
  onConfirm,
}) => (
  <AppModal visible={visible} onRequestClose={onClose}>
    <AppText variant="title" style={styles.title}>
      Delete Category?
    </AppText>
    <AppText style={styles.body}>
      Are you sure you want to delete this category
      {category?.name ? ` (“${category.name}”)` : ""}?{"\n"}This will delete all
      items under it!
    </AppText>

    <View style={styles.actions}>
      <AppButton title="Cancel" onPress={onClose} variant="ghost" />
      <AppButton
        title="OK"
        onPress={onConfirm}
        loading={busy}
        variant="danger"
      />
    </View>
  </AppModal>
);

const styles = StyleSheet.create({
  title: { marginBottom: 10, textAlign: "center" },
  body: {
    color: "#e5e7eb",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
});
