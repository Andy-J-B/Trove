import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
// You can also use @expo/vector-icons; here we’ll just render emoji placeholders for simplicity.

type Tile = {
  key: string;
  label: string;
  icon: string;
};

const TILE_LABELS = [
  "Clothing",
  "Skincare",
  "Haircare",
  "Makeup",
  "Lebron",
  "Faker",
];

const TILE_ICONS = ["👕", "🧴", "💈", "💄", "🏀", "🎮"];

const TILES: Tile[] = (() => {
  const tiles: Tile[] = [];
  for (let index = 0; index < TILE_LABELS.length; index += 1) {
    tiles.push({
      key: `${index + 1}`,
      label: TILE_LABELS[index],
      icon: TILE_ICONS[index] ?? "",
    });
  }
  return tiles;
})();

const { width, height } = Dimensions.get("window");
const SCREEN_HORIZONTAL_PADDING = 12;
const TILE_GAP = 14;
const NUM_COLUMNS = 2;
const CARD_WIDTH =
  (width - SCREEN_HORIZONTAL_PADDING * 2 - TILE_GAP * (NUM_COLUMNS + 1)) /
  NUM_COLUMNS;
const CARD_HEIGHT = CARD_WIDTH * 0.95;
const BOTTOM_SPACER = height * 0.125;
const modernFontBold = Platform.select({
  ios: "Helvetica Neue",
  android: "Roboto",
  default: "System",
});

export default function App() {
  const renderItem = ({ item }: { item: Tile }) => (
    <Pressable
      onPress={() =>
        router.push(`/category/${encodeURIComponent(item.label.toLowerCase())}`)
      }
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.card}>
        <View style={styles.cardInner}>
          <Text style={styles.cardIcon}>{item.icon}</Text>
          <Text style={styles.cardLabel}>{item.label}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <LinearGradient
      colors={["#000000", "#070707", "#000000"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {/* Top: Centered logo area */}
          <View style={styles.logoWrap}>
            <View style={styles.logoRow}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.logoText}>TROVE</Text>
            </View>
          </View>

          {/* Grid of 6 glass tiles */}
          <FlatList
            data={TILES}
            renderItem={renderItem}
            keyExtractor={(item) => item.key}
            numColumns={NUM_COLUMNS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </SafeAreaView>
      <StatusBar style="light" />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: BOTTOM_SPACER,
  },
  logoWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: 6,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 64,
    height: 64,
    marginRight: 16,
  },
  logo: { width: 120, height: 48 },
  logoText: {
    color: "white",
    fontSize: 44,
    fontWeight: "900",
    fontFamily: modernFontBold,
    letterSpacing: 3,
    textAlign: "center",
  },

  list: { flexGrow: 0 },
  grid: {
    justifyContent: "center",
    paddingVertical: 20,
    alignItems: "center",
  },
  row: { justifyContent: "center" },

  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#1c1c1c",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    marginHorizontal: TILE_GAP / 2,
    marginBottom: TILE_GAP + 6,
  },
  cardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 20,
  },
  cardIcon: { fontSize: 40 },
  cardLabel: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
    fontFamily: modernFontBold,
  },
});

// // app/(tabs)/index.tsx
// import React from "react";
// import App from "../../App"; // adjust the path if App.js is elsewhere

// export default function HomeScreen() {
//   return <App />;
// }
