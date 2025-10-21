import React, { useEffect } from "react";
import { deactivateKeepAwake } from "expo-keep-awake";
import HomeScreen from "../screens/Homescreen"; // Make sure capitalization matches

export default function Index() {
  useEffect(() => {
    try {
      deactivateKeepAwake();
      console.log("✅ Keep-awake disabled successfully");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(
          "⚠️ Keep-awake not supported or already inactive:",
          error.message
        );
      } else {
        console.log("⚠️ Keep-awake error (unknown type):", error);
      }
    }
  }, []);

  return <HomeScreen />;
}
