import { router, useFocusEffect } from "expo-router";
import { MagnifyingGlass, Plus } from "phosphor-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { authService, initializeFirebase, isFirebaseConfigured, messagingService } from "../services";
import { Conversation } from "../services/messaging.service";
import { getErrorMessage } from "../utils/errorHandler";

type MessageListItem = {
  id: string;
  conversationId: string;
  name: string;
  lastMessage: string;
  time: string;
  role: 'instructor' | 'student';
  otherUserId: string; // User ID of the other participant
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

// Format timestamp to relative time
const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
};

export default function Messages() {
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<MessageListItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; fullname: string } | null>(null);

  // Initialize Firebase and get current user
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize Firebase if configured
        if (isFirebaseConfigured()) {
          initializeFirebase();
        }

        // Get current user
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser({ id: user.id, fullname: user.fullname });
        } else {
          setError('Please login to view messages');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error initializing:', err);
        setError(getErrorMessage(err));
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Subscribe to conversations
  useEffect(() => {
    if (!currentUser || !isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = messagingService.subscribeToConversations(
      currentUser.id,
      (firestoreConversations: Conversation[]) => {
        try {
          // Transform Firestore conversations to MessageListItem
          // Filter out conversations with no messages (empty lastMessage)
          const transformed: MessageListItem[] = firestoreConversations
            .filter((conv) => conv.lastMessage && conv.lastMessage.trim() !== '')
            .map((conv) => {
              // Get the other participant (not the current user)
              const otherParticipantId = conv.participants.find(id => id !== currentUser.id) || '';
              const otherParticipantName = conv.participantNames?.[otherParticipantId] || 'Unknown User';
              
              // Determine role (for now, assume instructor if email contains @gordoncollege.edu.ph)
              // You can enhance this by storing role in Firebase or fetching from backend
              const role: 'instructor' | 'student' = otherParticipantName.includes('@') 
                ? 'instructor' 
                : 'student';

              return {
                id: conv.id,
                conversationId: conv.id,
                name: otherParticipantName,
                lastMessage: conv.lastMessage || 'No messages yet',
                time: formatTimestamp(conv.lastMessageTime),
                role,
                otherUserId: otherParticipantId,
              };
            });

          setConversations(transformed);
          setError(null);
        } catch (err: any) {
          console.error('Error transforming conversations:', err);
          setError(getErrorMessage(err));
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      // Conversations are already subscribed, so they'll update automatically
    }, [])
  );

  const filteredMessages = conversations.filter((msg) =>
    msg.name.toLowerCase().includes(search.toLowerCase())
  );

  // handle message click - navigate to chat detail
  const handleMessageClick = (message: MessageListItem) => {
    router.push({
      pathname: '/components/chat-detail' as any,
      params: {
        conversationId: message.conversationId,
        otherUserId: message.otherUserId,
        name: message.name,
        role: message.role,
      }
    });
  };

  if (loading) {
    return (
      <View className="flex-1 px-6 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4285F4" />
        <Text className="text-millionGrey mt-4">Loading conversations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 px-6 bg-white items-center justify-center">
        <Text className="text-red-600 text-base text-center mb-4">{error}</Text>
        {!isFirebaseConfigured() && (
          <Text className="text-millionGrey text-sm text-center">
            Firebase is not configured. Please update app/config/firebase.ts with your Firebase credentials.
          </Text>
        )}
      </View>
    );
  }

  // Handle new message button
  const handleNewMessage = () => {
    router.push('/components/contact-picker' as any);
  };

  return (
    <View className="flex-1 px-6 bg-white">
      {/* searchbar with new message button */}
      <View className="flex-row items-center mb-4 gap-3">
        <View className="flex-1 rounded-full" style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, height: 50, backgroundColor: isFocused ? "#FFFFFF" : "#F9F9F9", borderWidth: 1, borderColor: isFocused ? "#EFEFEF" : "transparent", }} >
          <MagnifyingGlass size={20} color={isFocused ? "#191815" : "#999999"} weight="regular" style={{ marginRight: 10 }} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search" placeholderTextColor={isFocused ? "#191815" : "#999999"} className="flex-1 font-base" style={{ paddingVertical: 0, textAlignVertical: "center", includeFontPadding: false, color: "#191815", }} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} />
        </View>
        <Pressable
          onPress={handleNewMessage}
          className="bg-seljukBlue rounded-full p-3 active:opacity-80"
          style={{ width: 50, height: 50, justifyContent: 'center', alignItems: 'center' }}
        >
          <Plus size={20} color="#FFFFFF" weight="bold" />
        </Pressable>
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
           <Text className="text-millionGrey text-base">No conversations yet.</Text>
           <Text className="text-millionGrey text-sm mt-2">Tap the + button to start a new conversation</Text>
         </View>
       )}
    </View>
  );
}
