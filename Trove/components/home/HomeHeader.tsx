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
      <AppText style={styles.text}>
        TROVE
      </AppText>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", marginBottom: 12, marginTop: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  logo: { width: 56, height: 56, marginRight: 12 },
  text: {
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: 2,
    textAlign: "center",
    color: "#fff",
  },
});
