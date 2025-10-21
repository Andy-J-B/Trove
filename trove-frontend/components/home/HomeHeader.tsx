// HomeHeader.tsx

// Displays logo/title (“Trove”)

// Handles SafeArea padding

// Could show an “Add” button or future actions (optional)
import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { AppText } from "../ui/AppText";

export const HomeHeader: React.FC = () => (
  <View style={styles.wrap}>
    <View style={styles.row}>
      <Image
        source={require("../../assets/images/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <AppText variant="title" bold style={styles.text}>
        trove
      </AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  logo: { width: 36, height: 36, marginRight: 10 },
  text: {
    fontSize: 26,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
  },
});
