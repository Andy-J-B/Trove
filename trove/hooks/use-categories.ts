import { useState, useCallback } from "react";
import { ToastAndroid } from "react-native";
import { api } from "../util/api";

import { Feather } from "@expo/vector-icons";

export interface Category {
  id: number | string;
  key: string;
  label: string;
  icon: keyof typeof Feather.glyphMap; // <-- fix here
}

const FALLBACK_TILE_LABELS = ["Clothing", "Skincare", "Haircare", "Makeup"];

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError("");

    try {
      const res = await api.get(`/categories`, { signal });
      const payload = res.data;

      if (!payload.success) throw new Error(payload.error || "Error");

      const data: any[] = Array.isArray(payload.data) ? payload.data : [];

      setCategories(
        data.map(
          (c, i): Category => ({
            id: c.id ?? i + 1,
            key: String(c.id ?? i + 1),
            label: c.name,
            icon: "folder",
          })
        )
      );
    } catch {
      setError("Failed to load categories");
      setCategories(
        FALLBACK_TILE_LABELS.map(
          (label, i): Category => ({
            id: `fallback-${i + 1}`,
            key: String(i + 1),
            label,
            icon: "folder",
          })
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { categories, loading, error, fetchCategories };
}
