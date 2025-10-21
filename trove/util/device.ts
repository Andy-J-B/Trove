import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";
import * as Crypto from "expo-crypto";

const DEVICE_ID_KEY = "uniqueDeviceId";

export async function getDeviceId(): Promise<string> {
  // Try to load existing ID
  let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate a new one using Expo-safe randomUUID
    const randomId = Crypto.randomUUID();
    const name = Device.deviceName ?? "device";
    deviceId = `${name}-${randomId}`;

    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}
