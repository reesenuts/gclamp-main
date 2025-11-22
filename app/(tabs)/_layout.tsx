import { Slot, usePathname } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import BottomNav from "../components/navbar";
import Header from "../components/header";

export default function TabsLayout() {
  const pathname = usePathname();

  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
  }).format(today);

  const headerTitleMap: Record<string, { title: string; subtitle?: string }> = {
    "/todolist": { title: "To-Do", subtitle: formattedDate },
    "/classes": { title: "Classes" },
    "/schedule": { title: "Schedule" },
    "/notifications": { title: "Notifications" },
    "/messages": { title: "Messages" },
  };

  const { title, subtitle } = headerTitleMap[pathname] || { title: "" };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Header title={title} subtitle={subtitle} />
      <Slot />
      <BottomNav />
    </SafeAreaView>
  );
}
