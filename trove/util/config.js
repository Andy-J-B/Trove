import { Dimensions, Platform } from "react-native";
import Constants from "expo-constants";

const { width, height } = Dimensions.get("window");

export const EXTRACT_BASE = "http://127.0.0.1:3000"; // dev
export const SERVER_URL =
  (Constants?.expoConfig?.extra && Constants.expoConfig.extra.SERVER_URL) ||
  "http://127.0.0.1:3000/api";

export const SCREEN_HORIZONTAL_PADDING = 12;
export const TILE_GAP = 14;
export const NUM_COLUMNS = 2;
export const CARD_WIDTH =
  (width - SCREEN_HORIZONTAL_PADDING * 2 - TILE_GAP * (NUM_COLUMNS + 1)) /
  NUM_COLUMNS;
export const CARD_HEIGHT = CARD_WIDTH * 0.95;
export const BOTTOM_SPACER = height * 0.125;

export const modernFontBold = Platform.select({
  ios: "Helvetica Neue",
  android: "Roboto",
  default: "System",
});
