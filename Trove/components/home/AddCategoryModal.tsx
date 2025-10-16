// AddCategoryModal.tsx

// Uses Modal (React Native)

// Controlled by parent

// Input fields for name & description

// Calls onSubmit({ name, description })
import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { AppModal } from "../ui/AppModal";
import { AppButton } from "../ui/AppButton";
import { AppText } from "../ui/AppText";

interface Props {
  visible: boolean;
  name: string;
  desc: string;
  busy: boolean;
  onChangeName: (v: string) => void;
  onChangeDesc: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export const AddCategoryModal: React.FC<Props> = ({
  visible,
  name,
  desc,
  busy,
  onChangeName,
  onChangeDesc,
  onSubmit,
  onClose,
}) => (
  <AppModal visible={visible} onRequestClose={onClose}>
    <AppText variant="title" style={styles.title}>
      Add Category
    </AppText>

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

    <View style={styles.actions}>
      <AppButton title="Cancel" onPress={onClose} variant="ghost" />
      <AppButton title="Done" onPress={onSubmit} loading={busy} />
    </View>
  </AppModal>
);

const styles = StyleSheet.create({
  title: { marginBottom: 10, textAlign: "center" },
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
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
});
