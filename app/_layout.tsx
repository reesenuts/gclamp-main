import { useEffect } from "react";
import { Stack } from "expo-router";
import "../global.css";
import { setupFCM } from "./utils/fcmSetup";

export default function RootLayout() {
  useEffect(() => {
    // Setup FCM when app starts
    setupFCM().catch((error) => {
      console.error('Failed to setup FCM:', error);
    });
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
