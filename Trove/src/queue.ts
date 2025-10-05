import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "shareQueue:v1";

export async function enqueue(url: string) {
  const raw = (await AsyncStorage.getItem(KEY)) || "[]";
  const arr = JSON.parse(raw) as string[];
  arr.push(url);
  await AsyncStorage.setItem(KEY, JSON.stringify(arr));
}

export async function drain(): Promise<string[]> {
  const raw = (await AsyncStorage.getItem(KEY)) || "[]";
  const arr = JSON.parse(raw) as string[];
  await AsyncStorage.setItem(KEY, JSON.stringify([]));
  return arr;
}

export async function peekAll(): Promise<string[]> {
  const raw = (await AsyncStorage.getItem(KEY)) || "[]";
  return JSON.parse(raw) as string[];
}
