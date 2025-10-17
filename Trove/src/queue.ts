// utils/queue.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

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

// 🟦 Send all items to backend and clear queue
export async function flushQueue() {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return;

  const items: QueueItem[] = JSON.parse(raw);
  if (items.length === 0) return;

  try {
    for (const { url, deviceId } of items) {
      console.log("POST");
      return;
      await fetch(`${SERVER_URL}/queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, deviceId }),
      });
    }
    // Clear queue after successful flush
    await AsyncStorage.setItem(KEY, JSON.stringify([]));
  } catch (err) {
    console.error("❌ Failed to flush queue:", err);
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

// 🟪 Automatically flush when app becomes active
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    flushQueue();
  }
});
