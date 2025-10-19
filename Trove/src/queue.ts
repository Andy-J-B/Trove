// utils/queue.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";

// 🔹 Replace with your backend API endpoint

import { SERVER_URL } from "../util/config";
const KEY = "shareQueue:v2";

export type QueueItem = {
  deviceId: string;
  url: string;
};

// 🟩 Add item to local queue
export async function enqueue(url: string, deviceId: string) {
  const raw = (await AsyncStorage.getItem(KEY)) || "[]";
  const arr = JSON.parse(raw) as QueueItem[];
  arr.push({ url, deviceId });
  await AsyncStorage.setItem(KEY, JSON.stringify(arr));
}

let isFlushing = false; // module‑scoped flag

export async function flushQueue() {
  if (isFlushing) {
    console.log("🚧 flushQueue already running – skipping duplicate call");
    return;
  }
  isFlushing = true;

  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return;

    const items: QueueItem[] = JSON.parse(raw);
    if (items.length === 0) return;
    console.log("💦 FLUSHING", items);

    for (const { url, deviceId } of items) {
      await fetch(`${SERVER_URL}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, deviceId }),
      });
    }

    // If every POST succeeded we can safely empty the local queue
    await AsyncStorage.setItem(KEY, JSON.stringify([]));
  } catch (err) {
    console.error("❌ Failed to flush queue:", err);
    // keep the items in AsyncStorage – they’ll be retried next time
  } finally {
    isFlushing = false;
  }
}

// 🟨 Get all items without clearing
export async function peekAll(): Promise<QueueItem[]> {
  const raw = (await AsyncStorage.getItem(KEY)) || "[]";
  return JSON.parse(raw) as QueueItem[];
}

// 🟥 Clear queue manually
export async function clearQueue() {
  await AsyncStorage.setItem(KEY, JSON.stringify([]));
}

AppState.addEventListener("change", async (state) => {
  if (state !== "active") return;

  const isConnected = (await NetInfo.fetch()).isConnected;
  if (!isConnected) {
    console.log("📡 No network – will retry flushing later.");
    return;
  }
  console.log("TRY Flushing");

  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return; // nothing to send

  await flushQueue(); // your existing function
});
