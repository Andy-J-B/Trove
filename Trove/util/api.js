import axios from "axios";
import { SERVER_URL, EXTRACT_BASE } from "./config";

export const api = axios.create({
  baseURL: SERVER_URL,
  timeout: 10000,
});

export async function ping() {
  try {
    await axios.get(`${EXTRACT_BASE}/health`, { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
