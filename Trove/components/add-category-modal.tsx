import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

interface AddCategoryModalProps {
  visible: boolean;
  name: string;
  desc: string;
  onChangeName: (text: string) => void;
  onChangeDesc: (text: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  busy?: boolean;
}

export default function AddCategoryModal({
  visible,
  name,
  desc,
  onChangeName,
  onChangeDesc,
  onSubmit,
  onClose,
  busy = false,
}: AddCategoryModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Category</Text>
          <TextInput
            placeholder="Name *"
            placeholderTextColor="#9aa0a6"
            value={name}
            onChangeText={onChangeName}
            style={styles.input}
          />
          <TextInput
            placeholder="Description *"
            placeholderTextColor="#9aa0a6"
            value={desc}
            onChangeText={onChangeDesc}
            style={[styles.input, { height: 90, textAlignVertical: "top" }]}
            multiline
          />
          <View style={styles.modalActions}>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={styles.btnGhostText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={onSubmit}
              disabled={busy}
              style={[styles.btn, styles.btnPrimary]}
            >
              {busy ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.btnPrimaryText}>Done</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    borderRadius: 16,
    backgroundColor: "#1c1c1c",
    padding: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#111",
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnGhost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#444",
  },
  btnGhostText: { color: "#fff" },
  btnPrimary: { backgroundColor: "#fff" },
  btnPrimaryText: { color: "#000", fontWeight: "800" },
});
