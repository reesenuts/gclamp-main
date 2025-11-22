import {Newspaper, FolderOpen, Books, GraduationCap, Info, } from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "feed" | "activities" | "resources" | "classlist" | "details";

interface ClassNavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string; icon: any }[] = [
  { id: "feed", label: "Class Feed", icon: Newspaper },
  { id: "activities", label: "Activities", icon: Books },
  { id: "resources", label: "Resources", icon: FolderOpen },
  { id: "classlist", label: "Class List", icon: GraduationCap },
  { id: "details", label: "Details", icon: Info },
];

export default function ClassNavbar({
  activeTab,
  onTabChange,
}: ClassNavbarProps) {
  return (
    <SafeAreaView edges={["bottom"]} className="bg-white border-t border-crystalBell" >
      <View className="flex-row justify-between pt-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Pressable key={tab.id} onPress={() => onTabChange(tab.id)} className="items-center flex-1" >
              <View className="relative">
                <Icon size={28} color={isActive ? "#4285F4" : "#999999"} weight={isActive ? "fill" : "regular"} />
              </View>

              <Text className={`text-xs mt-1 ${isActive ? "text-seljukBlue font-semibold" : "text-millionGrey"}`} >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
