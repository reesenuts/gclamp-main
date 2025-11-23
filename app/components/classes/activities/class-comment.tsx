import { X } from "phosphor-react-native";
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Comment = {
  id: string;
  author: string;
  content: string;
  timestamp: string;
};

type ClassCommentProps = {
  visible: boolean;
  comments: Comment[];
  newComment: string;
  loading?: boolean; // Optional loading state for adding comment
  onClose: () => void;
  onCommentChange: (text: string) => void;
  onAddComment: () => void;
};

export default function ClassComment({
  visible,
  comments,
  newComment,
  loading = false,
  onClose,
  onCommentChange,
  onAddComment,
}: ClassCommentProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} >
      <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} >
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
          {/* modal header */}
          <View className="pt-6 px-6 pb-4 bg-white border-b border-crystalBell">
            <View className="flex-row justify-between items-center">
              <Text className="text-twilightZone text-lg font-semibold">
                Class Comments ({comments.length})
              </Text>
              <Pressable onPress={onClose}>
                <X size={20} color="#191815" weight="regular" />
              </Pressable>
            </View>
          </View>

          {/* comments list */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled" >
            <View className="p-6">
              {/* Empty state */}
              {comments.length === 0 && (
                <View className="items-center justify-center py-20">
                  <Text className="text-millionGrey text-base">No comments yet. Be the first to comment!</Text>
                </View>
              )}

              {/* Comments list */}
              {comments.map((comment, index) => (
                <View key={comment.id}>
                  {/* divider between comments */}
                  {index > 0 && (
                    <View className="border-t border-crystalBell my-4" />
                  )}
                  <View className="flex-row items-start">
                    {/* commentor avatar */}
                    <View className="w-10 h-10 rounded-full border border-crystalBell bg-millionGrey/10 mr-4 items-center justify-center">
                      <Text className="text-metalDeluxe font-bold text-sm">
                        {comment.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </Text>
                    </View>
                    {/* comment content */}
                    <View className="flex-1 rounded-lg">
                      <View className="flex-row items-center">
                        <Text className="text-twilightZone font-semibold text-base">
                          {comment.author}
                        </Text>
                        <Text className="text-millionGrey text-xs mx-1">•</Text>
                        <Text className="text-millionGrey text-xs">
                          {comment.timestamp}
                        </Text>
                      </View>
                      <Text className="text-twilightZone text-base">
                        {comment.content}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* comment input section */}
          <SafeAreaView edges={['bottom']} className="bg-white border-t border-crystalBell">
            <View className="px-6 py-4">
              {/* comment text input */}
              <View className="border border-crystalBell rounded-2xl mb-3">
                <TextInput className="p-5 text-twilightZone" placeholder="Write a comment or ask a question..." placeholderTextColor="#999999" multiline value={newComment} onChangeText={onCommentChange} style={{ textAlignVertical: 'top', minHeight: 40, maxHeight: 100 }} />
              </View>
              {/* post comment button */}
              <Pressable 
                onPress={onAddComment} 
                className={`rounded-full p-5 ${newComment.trim() && !loading ? 'bg-starfleetBlue' : 'bg-starfleetBlue/50'}`} 
                disabled={!newComment.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className={`text-center font-semibold ${newComment.trim() ? 'text-white' : 'text-white/50'}`}>
                    Post Comment
                  </Text>
                )}
              </Pressable>
            </View>
          </SafeAreaView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

