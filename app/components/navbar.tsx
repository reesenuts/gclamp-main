import { usePathname, useRouter } from "expo-router";
import { Bell, Books, CalendarBlank, ChalkboardSimple, ChatTeardrop } from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNotifications } from "../hooks/useNotifications";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

type Routes = | "/todolist" | "/classes" | "/schedule" | "/notifications" | "/messages";

interface TabItem { name: string; icon: React.ElementType; route: Routes; }

const tabs: TabItem[] = [
  { name: "To-Do", icon: Books, route: "/todolist" },
  { name: "Classes", icon: ChalkboardSimple, route: "/classes" },
  { name: "Schedule", icon: CalendarBlank, route: "/schedule" },
  { name: "Notifications", icon: Bell, route: "/notifications" },
  { name: "Messages", icon: ChatTeardrop, route: "/messages" },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<TabItem["name"]>("To-Do");
  const { unreadCount: unreadNotifications } = useNotifications();
  const { unreadCount: unreadMessages } = useUnreadMessages();

  const badgeCounts = {
    notifications: unreadNotifications,
    messages: unreadMessages,
    todo: 0, // Will be implemented when todo notifications are added
  };

  useEffect(() => {
    const currentTab = tabs.find((tab) => pathname === tab.route);
    if (currentTab) setActive(currentTab.name);
  }, [pathname]);

  // get badge count for specific tab
  const getBadgeCount = (tabName: string): number => {
    switch (tabName) {
      case "Notifications":
        return badgeCounts.notifications;
      case "Messages":
        return badgeCounts.messages;
      case "To-Do":
        return badgeCounts.todo;
      default:
        return 0;
    }
  };

  return (
    <View className="flex-row justify-between bg-white border-t border-crystalBell pt-3">
      {tabs.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.name;
        const badgeCount = getBadgeCount(item.name);

        return (
          <Pressable key={item.name} onPress={() => router.push(item.route)} className="items-center flex-1" >
            <View className="relative">
              <Icon size={28} color={isActive ? "#4285F4" : "#999999"} weight={isActive ? "fill" : "regular"} />
              {/* badge */}
              {badgeCount > 0 && (
                <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-reddishPink items-center justify-center px-1">
                  <Text className="text-white text-[10px] font-bold">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Text>
                </View>
              )}
            </View>

            <Text className={`text-xs mt-1 ${ isActive ? "text-seljukBlue font-semibold" : "text-millionGrey" }`} >
              {item.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
