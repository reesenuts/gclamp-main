import { router, useLocalSearchParams } from "expo-router";
import { CaretLeft, PaperPlaneTilt } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActionSheetIOS, ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { authService, messagingService } from "../services";
import { Message } from "../services/messaging.service";
import { getErrorMessage } from "../utils/errorHandler";

type ChatMessage = {
  id: string;
  content: string;
  timestamp: string;
  isFromUser: boolean;
  isEdited: boolean;
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
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  
  const conversationId = params.conversationId as string;
  const otherUserId = params.otherUserId as string;
  const contactName = params.name as string;
  const contactRole = params.role as 'instructor' | 'student';
  const displayName = contactRole === 'student' ? toNormalCase(contactName) : contactName;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; fullname: string } | null>(null);
  const [actualConversationId, setActualConversationId] = useState<string | null>(conversationId || null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [editingMessage, setEditingMessage] = useState<{ id: string; originalContent: string } | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Get current user
  useEffect(() => {
    const fetchUser = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        setCurrentUser({ id: user.id, fullname: user.fullname });
      } else {
        Alert.alert('Error', 'Please login to send messages');
        router.back();
      }
    };
    fetchUser();
  }, []);

  // Set conversation ID if provided in params (existing conversation)
  useEffect(() => {
    if (conversationId && !actualConversationId) {
      setActualConversationId(conversationId);
    }
  }, [conversationId, actualConversationId]);

  // Subscribe to messages (only if conversation exists)
  useEffect(() => {
    if (!actualConversationId || !currentUser) {
      // If no conversation exists yet, set loading to false and show empty state
      if (currentUser) {
        setLoading(false);
        setMessages([]);
      }
      return;
    }

    setLoading(true);
    const unsubscribe = messagingService.subscribeToMessages(
      actualConversationId,
      (firestoreMessages: Message[]) => {
        // Transform Firestore messages to ChatMessage
        const transformed: ChatMessage[] = firestoreMessages.map((msg) => {
          const isFromUser = msg.senderId === currentUser.id;
          return {
            id: msg.id,
            content: msg.content,
            timestamp: msg.timestamp.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            }),
            isFromUser,
            isEdited: Boolean(msg.editedAt),
          };
        });

        setMessages(transformed);
        setLoading(false);

        // Mark messages as read
        messagingService.markMessagesAsRead(actualConversationId, currentUser.id).catch(console.error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [actualConversationId, currentUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Handle keyboard visibility to adjust spacing & auto-scroll
  useEffect(() => {
    const showEvent = isIOS ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = isIOS ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardWillShow = Keyboard.addListener(showEvent, (event) => {
      if (!isIOS && event.endCoordinates?.height) {
        setKeyboardHeight(event.endCoordinates.height);
      }
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    const keyboardWillHide = Keyboard.addListener(hideEvent, () => {
      if (!isIOS) {
        setKeyboardHeight(0);
      }
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [isIOS]);

  const resetComposer = () => {
    setMessageInput('');
    setEditingMessage(null);
  };

  // Send or edit message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !currentUser || sending) return;

    const content = messageInput.trim();

    if (editingMessage && actualConversationId) {
      setSending(true);
      try {
        await messagingService.updateMessage(
          actualConversationId,
          editingMessage.id,
          content
        );
        resetComposer();
      } catch (err: any) {
        console.error('Error updating message:', err);
        Alert.alert('Error', getErrorMessage(err) || 'Failed to update message');
        setMessageInput(content);
      } finally {
        setSending(false);
      }
      return;
    }

    setMessageInput('');
    setSending(true);

    try {
      // Get or create conversation if it doesn't exist
      let convId = actualConversationId;
      if (!convId) {
        convId = await messagingService.getOrCreateConversation(
          currentUser.id,
          otherUserId,
          currentUser.fullname,
          contactName
        );
        setActualConversationId(convId);
      }

      // Send the message
      await messagingService.sendMessage(
        convId,
        currentUser.id,
        currentUser.fullname,
        content
      );
    } catch (err: any) {
      console.error('Error sending message:', err);
      Alert.alert('Error', getErrorMessage(err) || 'Failed to send message');
      setMessageInput(content); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const confirmDeleteMessage = (messageId: string) => {
    Alert.alert(
      'Delete message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteMessage(messageId),
        },
      ]
    );
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!actualConversationId) return;

    try {
      await messagingService.deleteMessage(actualConversationId, messageId);
      if (editingMessage?.id === messageId) {
        resetComposer();
      }
    } catch (err: any) {
      console.error('Error deleting message:', err);
      Alert.alert('Error', getErrorMessage(err) || 'Failed to delete message');
    }
  };

  const handleEditMessage = (message: ChatMessage) => {
    setEditingMessage({ id: message.id, originalContent: message.content });
    setMessageInput(message.content);
  };

  const handleMessageLongPress = (message: ChatMessage) => {
    if (!message.isFromUser || !actualConversationId) return;

    const handleSelection = (index: number) => {
      if (index === 0) {
        handleEditMessage(message);
      } else if (index === 1) {
        confirmDeleteMessage(message.id);
      }
    };

    if (isIOS) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Edit', 'Delete', 'Cancel'],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 2,
          title: 'Message options',
        },
        handleSelection
      );
    } else {
      Alert.alert(
        'Message options',
        undefined,
        [
          { text: 'Edit', onPress: () => handleSelection(0) },
          { text: 'Delete', style: 'destructive', onPress: () => handleSelection(1) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={isIOS ? 'padding' : undefined}
      keyboardVerticalOffset={isIOS ? insets.top : 0}
    >
      <SafeAreaView className="flex-1 bg-white" edges={['top']}>
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
        {loading && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4285F4" />
            <Text className="text-millionGrey mt-4">Loading messages...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20">
                <Text className="text-millionGrey text-base">No messages yet.</Text>
                <Text className="text-millionGrey text-sm mt-2">Start the conversation!</Text>
              </View>
            ) : (
              messages.map((message) => (
                <Pressable
                  key={message.id}
                  className={`mb-4 ${message.isFromUser ? 'items-end' : 'items-start'}`}
                  onLongPress={() => handleMessageLongPress(message)}
                  disabled={!message.isFromUser}
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
                    <View className="flex-row items-center mt-2">
                      <Text
                        className={`text-xs ${
                          message.isFromUser ? 'text-white/70' : 'text-millionGrey'
                        }`}
                      >
                        {message.timestamp}
                      </Text>
                      {message.isEdited && (
                        <Text
                          className={`text-xs ml-1 ${
                            message.isFromUser ? 'text-white/70' : 'text-millionGrey'
                          }`}
                        >
                          · Edited
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        )}

        {/* message input */}
        <View 
          className="bg-white border-t border-crystalBell"
          style={{ 
            paddingBottom: insets.bottom,
            marginBottom: isIOS ? 0 : keyboardHeight
          }}
        >
          {editingMessage && (
            <View className="px-4 pt-3 pb-1 flex-row items-center justify-between">
              <Text className="text-millionGrey text-sm">
                Editing message
              </Text>
              <Pressable onPress={resetComposer} hitSlop={8}>
                <Text className="text-seljukBlue text-sm font-semibold">Cancel</Text>
              </Pressable>
            </View>
          )}
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
                (messageInput.trim() && !sending) ? 'bg-seljukBlue' : 'bg-millionGrey/20'
              }`}
              disabled={!messageInput.trim() || sending || !currentUser}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <PaperPlaneTilt
                  size={20}
                  color={(messageInput.trim() && !sending) ? '#FFFFFF' : '#999999'}
                  weight="regular"
                />
              )}
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

