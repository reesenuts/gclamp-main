import { router, useLocalSearchParams } from "expo-router";
import { CaretLeft, PaperPlaneTilt } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChatMessage = {
  id: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
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

export default function ChatDetail() {
  const params = useLocalSearchParams();
  
  const contactName = params.name as string;
  const contactRole = params.role as 'instructor' | 'student';
  const displayName = contactRole === 'student' ? toNormalCase(contactName) : contactName;

  // chat messages data - based on contact
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: contactRole === 'instructor' 
        ? "Hello! How can I help you today?"
        : "Hi! Can you help me with the AR/VR project?",
      timestamp: '10:30 AM',
      isFromUser: false,
    },
    {
      id: '2',
      content: contactRole === 'instructor'
        ? "Good morning, Ma'am. May I ask if the draft submission deadline is still this Friday?"
        : "Sure, what do you need help with?",
      timestamp: '10:32 AM',
      isFromUser: true,
    },
    {
      id: '3',
      content: contactRole === 'instructor'
        ? "Yes, the deadline is still this Friday at 11:59 PM. Make sure to submit through the portal."
        : "I'm having trouble with the Unity setup. Can you guide me?",
      timestamp: '10:35 AM',
      isFromUser: false,
    },
    {
      id: '4',
      content: contactRole === 'instructor'
        ? "Thank you for the clarification!"
        : "I'll check the lab computers and get back to you.",
      timestamp: '10:36 AM',
      isFromUser: true,
    },
  ]);

  // message input state
  const [messageInput, setMessageInput] = useState('');
  // scroll view ref for auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);

  // scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // send message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      isFromUser: true,
    };

    setMessages([...messages, newMessage]);
    setMessageInput('');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* header */}
        <View className="px-4 pt-4 pb-4 bg-white border-b border-crystalBell">
          <View className="flex-row items-center">
            <Pressable onPress={() => router.back()} className="mr-4">
              <CaretLeft size={24} color="#191815" weight="regular" />
            </Pressable>
            {/* contact avatar */}
            <View className="w-10 h-10 rounded-full bg-millionGrey/10 border border-crystalBell items-center justify-center mr-3">
              <Text className="text-metalDeluxe font-bold text-base">
                {getInitials(contactName)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-twilightZone text-lg font-semibold">
                {displayName}
              </Text>
              {contactRole === 'instructor' && (
                <Text className="text-millionGrey text-xs">Instructor</Text>
              )}
            </View>
          </View>
        </View>

        {/* messages list */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              className={`mb-4 ${message.isFromUser ? 'items-end' : 'items-start'}`}
            >
              <View
                className={`max-w-[80%] rounded-2xl p-4 ${
                  message.isFromUser
                    ? 'bg-seljukBlue'
                    : 'bg-slate-50 border border-crystalBell'
                }`}
              >
                <Text
                  className={`text-base ${
                    message.isFromUser ? 'text-white' : 'text-twilightZone'
                  }`}
                >
                  {message.content}
                </Text>
                <Text
                  className={`text-xs mt-2 ${
                    message.isFromUser ? 'text-white/70' : 'text-millionGrey'
                  }`}
                >
                  {message.timestamp}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* message input */}
        <SafeAreaView edges={['bottom']} className="bg-white border-t border-crystalBell">
          <View className="px-4 py-3 flex-row items-end">
            <View className="flex-1 border border-crystalBell rounded-full mr-3">
              <TextInput
                className="p-4 text-base text-twilightZone"
                placeholder="Type a message..."
                placeholderTextColor="#999999"
                multiline
                value={messageInput}
                onChangeText={setMessageInput}
                style={{
                  textAlignVertical: 'top',
                  minHeight: 40,
                  maxHeight: 100,
                }}
              />
            </View>
            <Pressable
              onPress={handleSendMessage}
              className={`rounded-full p-4 ${
                messageInput.trim() ? 'bg-seljukBlue' : 'bg-millionGrey/20'
              }`}
              disabled={!messageInput.trim()}
            >
              <PaperPlaneTilt
                size={20}
                color={messageInput.trim() ? '#FFFFFF' : '#999999'}
                weight="regular"
              />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

