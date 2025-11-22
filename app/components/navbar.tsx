import { usePathname, useRouter } from "expo-router";
import { Bell, Books, CalendarBlank, ChalkboardSimple, ChatTeardrop } from "phosphor-react-native";
import React, { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

type Routes = | "/todolist" | "/classes" | "/schedule" | "/notifications" | "/messages";

interface TabItem { name: string; icon: React.ElementType; route: Routes; }

const tabs: TabItem[] = [
  { name: "To-Do", icon: Books, route: "/todolist" },
  { name: "Classes", icon: ChalkboardSimple, route: "/classes" },
  { name: "Schedule", icon: CalendarBlank, route: "/schedule" },
  { name: "Notifications", icon: Bell, route: "/notifications" },
  { name: "Messages", icon: ChatTeardrop, route: "/messages" },
];

// get badge counts - using real data from codebase
const getBadgeCounts = () => {
  // unread notifications count (from notifications.tsx data)
  // counting notifications with isRead: false (ids: 1, 2, 4, 5, 6, 8, 9, 10, 13, 14)
  const unreadNotifications = 10;

  // new messages count (messages with recent timestamps like "3:16 PM", "4:15 PM" are considered new)
  // messages from today (3:16 PM, 4:15 PM)
  const newMessages = 2;

  // new activities in todo (activities posted recently - within last 24-48 hours)
  // activities with postedDate like "Nov 28, 2025, 2:30 PM" (recent)
  const newActivities = 1;

  return {
    notifications: unreadNotifications,
    messages: newMessages,
    todo: newActivities,
  };
};

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<TabItem["name"]>("To-Do");
  const badgeCounts = getBadgeCounts();

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
