import { router } from "expo-router";
import { MagnifyingGlass } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";

type Message = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  role: 'instructor' | 'student';
};

// get initials from name
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

// convert uppercase name to normal case
const toNormalCase = (name: string) => {
  return name
    .split(',')
    .map(part => 
      part.trim()
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
    .join(', ');
};

// messages data - only faculty (instructors) to students conversations
const messages: Message[] = [
  {
    id: '1',
    name: 'Erlinda Abarintos',
    lastMessage: "Good morning, Ma'am. May I ask if the draft submission deadline is still this Friday?",
    time: "3:16 PM",
    role: 'instructor',
  },
  {
    id: '2',
    name: 'Melner Balce',
    lastMessage: "Yes, both topics are included.",
    time: "4:15 PM",
    role: 'instructor',
  },
  {
    id: '3',
    name: 'Loudel Manaloto',
    lastMessage: "For now, please stick with Unity since that's what we'll be using in class. You may use the lab computers if your...",
    time: "8/12/25",
    role: 'instructor',
  },
];

export default function Messages() {
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const filteredMessages = messages.filter((msg) =>
    msg.name.toLowerCase().includes(search.toLowerCase())
  );

  // handle message click - navigate to chat detail
  const handleMessageClick = (message: Message) => {
    router.push({
      pathname: '/components/chat-detail' as any,
      params: {
        id: message.id,
        name: message.name,
        role: message.role,
      }
    });
  };

  return (
    <View className="flex-1 px-6 bg-white">
      {/* searchbar */}
      <View className="mb-4 rounded-full" style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 50, backgroundColor: isFocused ? "#FFFFFF" : "#F9F9F9", borderWidth: 1, borderColor: isFocused ? "#EFEFEF" : "transparent", }} >
        <MagnifyingGlass size={20} color={isFocused ? "#191815" : "#999999"} weight="regular" style={{ marginRight: 10 }} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search" placeholderTextColor={isFocused ? "#191815" : "#999999"} className="flex-1 font-base" style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false, color: "#191815", }} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
      </View>

      {/* messages list */}
      {filteredMessages.length > 0 ? (
        <ScrollView showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} >
          {filteredMessages.map((msg) => (
            <Pressable
              key={msg.id}
              className="flex-row items-center py-4 border-b border-crystalBell active:opacity-80"
              onPress={() => handleMessageClick(msg)}
            >
              {/* avatar with initials */}
              <View className="w-12 h-12 rounded-full bg-millionGrey/10 border border-crystalBell items-center justify-center mr-4">
                <Text className="text-metalDeluxe font-bold text-base">
                  {getInitials(msg.name)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-twilightZone font-semibold text-base">
                  {msg.name}
                </Text>
                <Text className="text-millionGrey text-sm" numberOfLines={2}>
                  {msg.lastMessage}
                </Text>
              </View>
              <Text className="text-millionGrey text-xs ml-3">{msg.time}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-millionGrey text-base">No messages found.</Text>
        </View>
      )}
    </View>
  );
}
